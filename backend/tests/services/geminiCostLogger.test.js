/**
 * Tests for Gemini Cost Logger
 * Protocolo Supremo v4 - Task 2.2
 */

const { describe, it, expect, beforeEach, vi } = require('vitest');
const {
  calculateCost,
  logGeminiUsage,
  getUsageStats,
  GEMINI_PRICING,
} = require('../../src/services/geminiCostLogger');

// Mock Firebase Admin
vi.mock('../../src/firebaseAdmin', () => ({
  db: {
    collection: vi.fn(() => ({
      add: vi.fn(),
      where: vi.fn(() => ({
        get: vi.fn(() => ({
          forEach: vi.fn(),
        })),
      })),
    })),
  },
}));

const { db } = require('../../src/firebaseAdmin');

describe('Gemini Cost Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suprimir console.log/error nos testes
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('calculateCost', () => {
    it('should calculate cost for gemini-2.0-flash-exp (free tier)', () => {
      const cost = calculateCost('gemini-2.0-flash-exp', 1000, 500);
      expect(cost).toBe(0); // Free tier
    });

    it('should calculate cost for gemini-1.5-flash', () => {
      const cost = calculateCost('gemini-1.5-flash', 1_000_000, 500_000);
      // (1M / 1M) * $0.075 + (500k / 1M) * $0.30 = $0.075 + $0.15 = $0.225
      expect(cost).toBeCloseTo(0.225, 3);
    });

    it('should calculate cost for gemini-1.5-pro', () => {
      const cost = calculateCost('gemini-1.5-pro', 500_000, 250_000);
      // (500k / 1M) * $1.25 + (250k / 1M) * $5.00 = $0.625 + $1.25 = $1.875
      expect(cost).toBeCloseTo(1.875, 3);
    });

    it('should fallback to gemini-1.5-flash pricing for unknown model', () => {
      const cost = calculateCost('unknown-model', 1_000_000, 500_000);
      expect(cost).toBeCloseTo(0.225, 3); // Mesmo cálculo do gemini-1.5-flash
    });

    it('should handle zero tokens', () => {
      const cost = calculateCost('gemini-1.5-flash', 0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('logGeminiUsage', () => {
    it('should log usage to Firestore and console', async () => {
      const mockAdd = vi.fn();
      db.collection.mockReturnValue({ add: mockAdd });

      await logGeminiUsage({
        endpoint: '/api/enhance-job',
        model: 'gemini-2.0-flash-exp',
        latencyMs: 2500,
        inputTokens: 150,
        outputTokens: 80,
        success: true,
        userId: 'user@example.com',
      });

      expect(db.collection).toHaveBeenCalledWith('gemini_logs');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/enhance-job',
          model: 'gemini-2.0-flash-exp',
          latencyMs: 2500,
          inputTokens: 150,
          outputTokens: 80,
          totalTokens: 230,
          cost: 0, // Free tier
          success: true,
          error: null,
          userId: 'user@example.com',
          timestamp: expect.any(String),
        })
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"severity":"INFO"')
      );
    });

    it('should log errors without breaking application', async () => {
      db.collection.mockReturnValue({
        add: vi.fn().mockRejectedValue(new Error('Firestore down')),
      });

      // Não deve lançar erro
      await expect(
        logGeminiUsage({
          endpoint: '/api/test',
          model: 'gemini-1.5-flash',
          latencyMs: 1000,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        })
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to log Gemini usage:',
        expect.any(Error)
      );
    });

    it('should handle failure case with error message', async () => {
      const mockAdd = vi.fn();
      db.collection.mockReturnValue({ add: mockAdd });

      await logGeminiUsage({
        endpoint: '/api/enhance-job',
        model: 'gemini-1.5-flash',
        latencyMs: 500,
        inputTokens: 100,
        outputTokens: 0,
        success: false,
        error: 'API quota exceeded',
        userId: 'user@example.com',
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'API quota exceeded',
        })
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"severity":"ERROR"')
      );
    });

    it('should use anonymous userId by default', async () => {
      const mockAdd = vi.fn();
      db.collection.mockReturnValue({ add: mockAdd });

      await logGeminiUsage({
        endpoint: '/api/test',
        model: 'gemini-2.0-flash-exp',
        latencyMs: 1000,
        inputTokens: 50,
        outputTokens: 30,
        success: true,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'anonymous',
        })
      );
    });
  });

  describe('getUsageStats', () => {
    it('should aggregate usage stats from Firestore', async () => {
      const mockDocs = [
        {
          data: () => ({
            model: 'gemini-2.0-flash-exp',
            endpoint: '/api/enhance-job',
            latencyMs: 2000,
            totalTokens: 200,
            cost: 0,
            success: true,
          }),
        },
        {
          data: () => ({
            model: 'gemini-1.5-flash',
            endpoint: '/api/generate-tip',
            latencyMs: 3000,
            totalTokens: 300,
            cost: 0.1,
            success: true,
          }),
        },
        {
          data: () => ({
            model: 'gemini-1.5-flash',
            endpoint: '/api/enhance-job',
            latencyMs: 1500,
            totalTokens: 150,
            cost: 0.05,
            success: false,
          }),
        },
      ];

      const mockGet = vi.fn(() => ({
        forEach: (callback) => mockDocs.forEach(callback),
      }));

      const mockWhere = vi.fn(() => ({ get: mockGet }));
      db.collection.mockReturnValue({ where: mockWhere });

      const stats = await getUsageStats();

      expect(stats.totalCalls).toBe(3);
      expect(stats.successfulCalls).toBe(2);
      expect(stats.failedCalls).toBe(1);
      expect(stats.totalCost).toBeCloseTo(0.15, 2);
      expect(stats.totalTokens).toBe(650);
      expect(stats.avgLatencyMs).toBeCloseTo(2166.67, 2);

      expect(stats.byModel['gemini-2.0-flash-exp']).toEqual({
        calls: 1,
        cost: 0,
      });
      expect(stats.byModel['gemini-1.5-flash']).toEqual({
        calls: 2,
        cost: 0.15,
      });

      expect(stats.byEndpoint['/api/enhance-job']).toEqual({
        calls: 2,
        cost: 0.05,
      });
      expect(stats.byEndpoint['/api/generate-tip']).toEqual({
        calls: 1,
        cost: 0.1,
      });
    });

    it('should return zero stats when no logs exist', async () => {
      const mockGet = vi.fn(() => ({
        forEach: vi.fn(),
      }));

      const mockWhere = vi.fn(() => ({ get: mockGet }));
      db.collection.mockReturnValue({ where: mockWhere });

      const stats = await getUsageStats();

      expect(stats.totalCalls).toBe(0);
      expect(stats.successfulCalls).toBe(0);
      expect(stats.failedCalls).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.avgLatencyMs).toBe(0);
    });
  });

  describe('GEMINI_PRICING', () => {
    it('should have valid pricing structure', () => {
      expect(GEMINI_PRICING).toHaveProperty('gemini-2.0-flash-exp');
      expect(GEMINI_PRICING).toHaveProperty('gemini-1.5-flash');
      expect(GEMINI_PRICING).toHaveProperty('gemini-1.5-pro');

      Object.values(GEMINI_PRICING).forEach(pricing => {
        expect(pricing).toHaveProperty('inputPer1M');
        expect(pricing).toHaveProperty('outputPer1M');
        expect(typeof pricing.inputPer1M).toBe('number');
        expect(typeof pricing.outputPer1M).toBe('number');
      });
    });

    it('should have gemini-2.0-flash-exp as free tier', () => {
      expect(GEMINI_PRICING['gemini-2.0-flash-exp'].inputPer1M).toBe(0);
      expect(GEMINI_PRICING['gemini-2.0-flash-exp'].outputPer1M).toBe(0);
    });
  });
});
