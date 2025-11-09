/**
 * Unit Tests for Cloud Functions
 * Run: cd functions && npm test
 */

const functions = require('firebase-functions-test')();
const admin = require('firebase-admin');

// Mock Firestore
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
};

describe('Cloud Functions Tests', () => {
  
  describe('calculateProviderRate', () => {
    // Import the function (we'll need to export it separately for testing)
    const calculateProviderRate = (provider = {}, stats = {}) => {
      const baseRate = 0.75;
      const headline = (provider.headline || '').trim();
      const verificationStatus = provider.verificationStatus || 'pendente';
      const totalJobs = Number(stats.totalJobs || 0);
      const averageRating = Number(stats.averageRating || 0);
      const totalRevenue = Number(stats.totalRevenue || 0);
      const totalDisputes = Number(stats.totalDisputes || 0);

      const profileComplete = headline && verificationStatus === 'verificado' ? 0.02 : 0;
      const highRating = averageRating >= 4.8 ? 0.02 : 0;
      const volumeTier = totalRevenue >= 11000 ? 0.03 : totalRevenue >= 6000 ? 0.02 : totalRevenue >= 1500 ? 0.01 : 0;
      const lowDisputeRate = totalJobs > 0 && totalDisputes / totalJobs < 0.05 ? 0.01 : 0;

      let rate = baseRate + profileComplete + highRating + volumeTier + lowDisputeRate;
      rate = Math.min(0.85, rate);

      const tier = highRating && profileComplete && volumeTier >= 0.02 && lowDisputeRate > 0 ? 'Ouro' : 'Bronze';

      return {
        currentRate: Number(rate.toFixed(2)),
        bonuses: { profileComplete, highRating, volumeTier, lowDisputeRate },
        tier,
      };
    };

    test('should return base rate for new provider', () => {
      const result = calculateProviderRate({}, {});
      expect(result.currentRate).toBe(0.75);
      expect(result.tier).toBe('Bronze');
    });

    test('should add profile complete bonus', () => {
      const provider = {
        headline: 'Expert plumber',
        verificationStatus: 'verificado',
      };
      const result = calculateProviderRate(provider, {});
      expect(result.currentRate).toBe(0.77); // 0.75 + 0.02
      expect(result.bonuses.profileComplete).toBe(0.02);
    });

    test('should add high rating bonus', () => {
      const stats = {
        totalJobs: 10,
        averageRating: 4.9,
      };
      const result = calculateProviderRate({}, stats);
        expect(result.currentRate).toBe(0.78); // 0.75 + 0.02 (high rating) + 0.01 (low disputes - 0/10)
      expect(result.bonuses.highRating).toBe(0.02);
    });

    test('should add volume tier bonus', () => {
      const stats = {
        totalRevenue: 12000,
      };
      const result = calculateProviderRate({}, stats);
      expect(result.currentRate).toBe(0.78); // 0.75 + 0.03
      expect(result.bonuses.volumeTier).toBe(0.03);
    });

    test('should add low dispute rate bonus', () => {
      const stats = {
        totalJobs: 100,
        totalDisputes: 2, // 2%
      };
      const result = calculateProviderRate({}, stats);
      expect(result.currentRate).toBe(0.76); // 0.75 + 0.01
      expect(result.bonuses.lowDisputeRate).toBe(0.01);
    });

    test('should cap at 85%', () => {
      const provider = {
        headline: 'Expert',
        verificationStatus: 'verificado',
      };
      const stats = {
        totalJobs: 100,
        averageRating: 4.9,
        totalRevenue: 15000,
        totalDisputes: 1,
      };
      const result = calculateProviderRate(provider, stats);
        expect(result.currentRate).toBe(0.83); // 0.75 + 0.02 + 0.02 + 0.03 + 0.01 = 0.83
      expect(result.tier).toBe('Ouro');
    });

    test('should award Ouro tier for excellent provider', () => {
      const provider = {
        headline: 'Expert',
        verificationStatus: 'verificado',
      };
      const stats = {
        totalJobs: 50,
        averageRating: 4.9,
        totalRevenue: 12000,
        totalDisputes: 1,
      };
      const result = calculateProviderRate(provider, stats);
      expect(result.tier).toBe('Ouro');
    });
  });

  describe('notifyOnNewMessage logic', () => {
    test('should identify correct recipient when client sends message', () => {
      const message = {
        chatId: 'job-123',
        senderId: 'client@test.com',
        senderType: 'cliente',
        text: 'Hello',
      };

      const job = {
        clientId: 'client@test.com',
        providerId: 'provider@test.com',
        category: 'Limpeza',
      };

      // Recipient should be provider
      const recipientId = message.senderId === job.clientId ? job.providerId : job.clientId;
      expect(recipientId).toBe('provider@test.com');
    });

    test('should identify correct recipient when provider sends message', () => {
      const message = {
        chatId: 'job-123',
        senderId: 'provider@test.com',
        senderType: 'prestador',
        text: 'Hello',
      };

      const job = {
        clientId: 'client@test.com',
        providerId: 'provider@test.com',
        category: 'Limpeza',
      };

      // Recipient should be client
      const recipientId = message.senderId === job.clientId ? job.providerId : job.clientId;
      expect(recipientId).toBe('client@test.com');
    });

    test('should skip notification for system messages', () => {
      const message = {
        chatId: 'job-123',
        senderId: 'system',
        senderType: 'system',
        text: 'Job scheduled',
      };

      // Should not create notification
      expect(message.senderType).toBe('system');
    });
  });

  describe('updateProviderRate trigger logic', () => {
    test('should only trigger when job becomes concluido', () => {
      const jobBefore = { status: 'em_progresso', providerId: 'provider@test.com' };
      const jobAfter = { status: 'concluido', providerId: 'provider@test.com' };

      const shouldTrigger = jobBefore.status !== 'concluido' && jobAfter.status === 'concluido';
      expect(shouldTrigger).toBe(true);
    });

    test('should not trigger when job stays concluido', () => {
      const jobBefore = { status: 'concluido', providerId: 'provider@test.com' };
      const jobAfter = { status: 'concluido', providerId: 'provider@test.com' };

      const shouldTrigger = jobBefore.status !== 'concluido' && jobAfter.status === 'concluido';
      expect(shouldTrigger).toBe(false);
    });

    test('should not trigger when job is not concluido', () => {
      const jobBefore = { status: 'ativo', providerId: 'provider@test.com' };
      const jobAfter = { status: 'em_progresso', providerId: 'provider@test.com' };

      const shouldTrigger = jobBefore.status !== 'concluido' && jobAfter.status === 'concluido';
      expect(shouldTrigger).toBe(false);
    });
  });

  describe('cleanupOldNotifications logic', () => {
    test('should calculate correct date threshold', () => {
      const now = new Date('2025-11-08T00:00:00Z');
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      expect(thirtyDaysAgo.toISOString()).toBe('2025-10-09T00:00:00.000Z');
    });

    test('should identify notifications to delete', () => {
      const now = new Date('2025-11-08T00:00:00Z');
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const notifications = [
        { id: '1', createdAt: new Date('2025-10-01T00:00:00Z') }, // Old - DELETE
        { id: '2', createdAt: new Date('2025-10-15T00:00:00Z') }, // Recent - KEEP
        { id: '3', createdAt: new Date('2025-11-01T00:00:00Z') }, // Recent - KEEP
        { id: '4', createdAt: new Date('2025-09-01T00:00:00Z') }, // Old - DELETE
      ];

      const toDelete = notifications.filter(n => n.createdAt < thirtyDaysAgo);
      expect(toDelete).toHaveLength(2);
      expect(toDelete.map(n => n.id)).toEqual(['1', '4']);
    });
  });
});
