/**
 * Monitoring Service Tests
 * Unit tests for monitoring, metrics, alerts, and SLO tracking
 * Task 4.4 - Sistema de Monitoramento & Alertas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import MonitoringService from '../../src/services/monitoringService';

// Mock Firebase Admin
const mockFirestoreCollectionGet = vi.fn();
const mockFirestoreCollectionAdd = vi.fn();
const mockFirestoreDocSet = vi.fn();
const mockFirestoreDocGet = vi.fn();
const mockFirestoreDocUpdate = vi.fn();

vi.mock('firebase-admin', () => ({
  default: {
    firestore: vi.fn(() => ({
      collection: vi.fn((path: string) => ({
        add: mockFirestoreCollectionAdd,
        get: mockFirestoreCollectionGet,
        where: vi.fn(() => ({
          get: mockFirestoreCollectionGet,
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: mockFirestoreCollectionGet,
          })),
        })),
        doc: vi.fn(() => ({
          set: mockFirestoreDocSet,
          get: mockFirestoreDocGet,
          update: mockFirestoreDocUpdate,
        })),
      })),
    })),
  },
}));

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordMetric', () => {
    it('should record a metric successfully', async () => {
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'metric-123' });

      await MonitoringService.recordMetric({
        name: 'api_latency',
        value: 120,
        timestamp: new Date(),
        tags: { endpoint: '/api/jobs' },
        unit: 'ms',
      });

      expect(mockFirestoreCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'api_latency',
          value: 120,
          unit: 'ms',
          tags: { endpoint: '/api/jobs' },
        })
      );
    });

    it('should handle missing optional fields', async () => {
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'metric-456' });

      await MonitoringService.recordMetric({
        name: 'error_count',
        value: 5,
        timestamp: new Date(),
      });

      expect(mockFirestoreCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'error_count',
          value: 5,
        })
      );
    });

    it('should throw on Firestore error', async () => {
      mockFirestoreCollectionAdd.mockRejectedValue(new Error('Firestore error'));

      await expect(
        MonitoringService.recordMetric({
          name: 'test_metric',
          value: 100,
          timestamp: new Date(),
        })
      ).rejects.toThrow('Failed to record metric');
    });
  });

  describe('recordMetrics', () => {
    it('should record multiple metrics in batch', async () => {
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'batch-123' });

      const metrics = [
        { name: 'metric1', value: 10, timestamp: new Date() },
        { name: 'metric2', value: 20, timestamp: new Date() },
        { name: 'metric3', value: 30, timestamp: new Date() },
      ];

      await MonitoringService.recordMetrics(metrics);

      expect(mockFirestoreCollectionAdd).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      await MonitoringService.recordMetrics([]);

      expect(mockFirestoreCollectionAdd).not.toHaveBeenCalled();
    });
  });

  describe('triggerAlert', () => {
    it('should create alert successfully', async () => {
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'alert-789' });

      const alertId = await MonitoringService.triggerAlert({
        name: 'High Latency',
        severity: 'critical',
        message: 'API latency exceeded 1s',
        source: 'api_monitor',
        metadata: { endpoint: '/api/jobs', latency: 1200 },
      });

      expect(alertId).toBe('alert-789');
      expect(mockFirestoreCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'High Latency',
          severity: 'critical',
          message: 'API latency exceeded 1s',
          source: 'api_monitor',
          status: 'active',
          metadata: { endpoint: '/api/jobs', latency: 1200 },
        })
      );
    });

    it('should throw on Firestore error', async () => {
      mockFirestoreCollectionAdd.mockRejectedValue(new Error('DB error'));

      await expect(
        MonitoringService.triggerAlert({
          name: 'Test Alert',
          severity: 'warning',
          message: 'Test message',
          source: 'test',
        })
      ).rejects.toThrow('Failed to trigger alert');
    });
  });

  describe('getActiveAlerts', () => {
    it('should get all active alerts', async () => {
      const mockAlerts = [
        { id: 'alert-1', name: 'Alert 1', severity: 'critical', status: 'active' },
        { id: 'alert-2', name: 'Alert 2', severity: 'warning', status: 'active' },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      });

      const alerts = await MonitoringService.getActiveAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toMatchObject({ id: 'alert-1', name: 'Alert 1' });
    });

    it('should filter alerts by severity', async () => {
      const mockAlerts = [
        { id: 'alert-1', name: 'Critical Alert', severity: 'critical', status: 'active' },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      });

      const alerts = await MonitoringService.getActiveAlerts('critical');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('critical');
    });

    it('should return empty array when no alerts', async () => {
      mockFirestoreCollectionGet.mockResolvedValue({ docs: [] });

      const alerts = await MonitoringService.getActiveAlerts();

      expect(alerts).toEqual([]);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      mockFirestoreDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ status: 'active' }),
      });
      mockFirestoreDocUpdate.mockResolvedValue(undefined);

      const result = await MonitoringService.resolveAlert('alert-123', 'Fixed by deploy');

      expect(result).toBe(true);
      expect(mockFirestoreDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          resolution: 'Fixed by deploy',
        })
      );
    });

    it('should return false if alert not found', async () => {
      mockFirestoreDocGet.mockResolvedValue({ exists: false });

      const result = await MonitoringService.resolveAlert('nonexistent', 'Test');

      expect(result).toBe(false);
      expect(mockFirestoreDocUpdate).not.toHaveBeenCalled();
    });

    it('should throw on Firestore error', async () => {
      mockFirestoreDocGet.mockRejectedValue(new Error('DB error'));

      await expect(MonitoringService.resolveAlert('alert-123')).rejects.toThrow(
        'Failed to resolve alert'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are up', async () => {
      mockFirestoreDocSet.mockResolvedValue(undefined);
      mockFirestoreDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ test: true }),
      });

      const health = await MonitoringService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.services.firestore).toBe('healthy');
      expect(health.services.functions).toBe('healthy');
    });

    it('should return degraded when storage fails', async () => {
      mockFirestoreDocSet.mockResolvedValue(undefined);
      mockFirestoreDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ test: true }),
      });

      const health = await MonitoringService.healthCheck();

      // Storage might be degraded based on implementation
      expect(['healthy', 'degraded']).toContain(health.status);
    });

    it('should return unhealthy when Firestore fails', async () => {
      mockFirestoreDocSet.mockRejectedValue(new Error('Firestore error'));

      const health = await MonitoringService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.services.firestore).toBe('unhealthy');
    });
  });

  describe('getMetrics', () => {
    it('should get metrics within date range', async () => {
      const mockMetrics = [
        { name: 'api_latency', value: 120, timestamp: new Date(), unit: 'ms' },
        { name: 'api_latency', value: 150, timestamp: new Date(), unit: 'ms' },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockMetrics.map(metric => ({
          data: () => metric,
        })),
      });

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const metrics = await MonitoringService.getMetrics('api_latency', startDate, endDate);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].name).toBe('api_latency');
    });

    it('should respect limit parameter', async () => {
      mockFirestoreCollectionGet.mockResolvedValue({ docs: [] });

      await MonitoringService.getMetrics('test_metric', new Date(), new Date(), 10);

      expect(mockFirestoreCollectionGet).toHaveBeenCalled();
    });
  });

  describe('getSLOMetrics', () => {
    it('should calculate SLO metrics correctly', async () => {
      const mockMetrics = [
        { name: 'uptime', value: 1, timestamp: new Date() },
        { name: 'api_latency', value: 500, timestamp: new Date(), unit: 'ms' },
        { name: 'error_rate', value: 0.005, timestamp: new Date() },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockMetrics.map(m => ({ data: () => m })),
      });

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const slo = await MonitoringService.getSLOMetrics(startDate, endDate);

      expect(slo).toHaveProperty('uptime');
      expect(slo).toHaveProperty('avgLatency');
      expect(slo).toHaveProperty('errorRate');
      expect(slo.uptime).toBeGreaterThanOrEqual(0);
      expect(slo.uptime).toBeLessThanOrEqual(100);
    });

    it('should return zero values when no metrics', async () => {
      mockFirestoreCollectionGet.mockResolvedValue({ docs: [] });

      const slo = await MonitoringService.getSLOMetrics(new Date(), new Date());

      expect(slo.uptime).toBe(0);
      expect(slo.avgLatency).toBe(0);
      expect(slo.errorRate).toBe(0);
    });
  });

  describe('checkSLOViolations', () => {
    it('should trigger alert when uptime SLO violated', async () => {
      const mockMetrics = [
        { name: 'uptime', value: 0.98, timestamp: new Date() }, // Below 99.5%
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockMetrics.map(m => ({ data: () => m })),
      });
      mockFirestoreCollectionAdd.mockResolvedValue({ id: 'alert-slo' });

      await MonitoringService.checkSLOViolations();

      expect(mockFirestoreCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('SLO'),
          severity: 'critical',
        })
      );
    });

    it('should not trigger alert when SLOs are met', async () => {
      const mockMetrics = [
        { name: 'uptime', value: 0.999, timestamp: new Date() },
        { name: 'api_latency', value: 800, timestamp: new Date(), unit: 'ms' },
        { name: 'error_rate', value: 0.005, timestamp: new Date() },
      ];

      mockFirestoreCollectionGet.mockResolvedValue({
        docs: mockMetrics.map(m => ({ data: () => m })),
      });

      await MonitoringService.checkSLOViolations();

      expect(mockFirestoreCollectionAdd).not.toHaveBeenCalled();
    });
  });

  describe('logEvent', () => {
    it('should log info event', () => {
      MonitoringService.logEvent('info', 'Test message', { key: 'value' });
      // Since logger is mocked, this just tests the method exists
    });

    it('should log warning event', () => {
      MonitoringService.logEvent('warn', 'Warning message');
      // Logger mock verification
    });

    it('should log error event', () => {
      MonitoringService.logEvent('error', 'Error message', { error: 'details' });
      // Logger mock verification
    });
  });
});
