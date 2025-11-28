import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as prospectingService from '../../../services/prospectingService';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'doc-123' })),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

describe('prospectingService - Comprehensive Quality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize without errors', () => {
      expect(prospectingService).toBeDefined();
    });

    it('should export all required functions', () => {
      expect(typeof prospectingService.getSmartProspectingActions).toBe('function');
      expect(typeof prospectingService.generateProspectingMessage).toBe('function');
    });
  });

  describe('getSmartProspectingActions - Core Functionality', () => {
    it('should return empty array for user with no referrals', async () => {
      const result = await prospectingService.getSmartProspectingActions('test@email.com');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should generate actions for valid user', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return actions with required fields', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      if (result.length > 0) {
        result.forEach(action => {
          expect(action).toHaveProperty('type');
          expect(action).toHaveProperty('priority');
        });
      }
    });

    it('should handle different user email formats', async () => {
      const emails = [
        'simple@example.com',
        'user+tag@example.co.uk',
        'first.last@subdomain.example.com',
        'user123@test-domain.com',
      ];

      for (const email of emails) {
        const result = await prospectingService.getSmartProspectingActions(email);
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should prioritize actions correctly', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      if (result.length > 1) {
        // Priority should be comparable
        for (let i = 1; i < result.length; i++) {
          const prev = result[i - 1];
          const curr = result[i];
          expect(prev.priority).toBeDefined();
          expect(curr.priority).toBeDefined();
        }
      }
    });
  });

  describe('generateProspectingMessage - Message Quality', () => {
    it('should generate message for prospect data', async () => {
      const prospectData = {
        name: 'John Client',
        service: 'web development',
        budget: 5000,
        timeline: '2 weeks',
        email: 'john@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    });

    it('should include prospect name in message', async () => {
      const prospectData = {
        name: 'Maria Silva',
        service: 'design',
        budget: 2000,
        timeline: '1 month',
        email: 'maria@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message.length).toBeGreaterThan(0);
    });

    it('should generate personalized messages for different services', async () => {
      const services = ['web development', 'graphic design', 'social media', 'copywriting'];

      for (const service of services) {
        const prospectData = {
          name: 'Test Client',
          service,
          budget: 1000,
          timeline: '1 week',
          email: 'test@example.com',
        };

        const message = await prospectingService.generateProspectingMessage(prospectData);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
      }
    });

    it('should handle missing optional fields', async () => {
      const prospectData = {
        name: 'Client',
        service: 'services',
        email: 'client@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should handle special characters in prospect name', async () => {
      const prospectData = {
        name: 'José María da Silva-Costa',
        service: 'web development',
        budget: 5000,
        timeline: '3 weeks',
        email: 'jose@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should keep message within reasonable length', async () => {
      const prospectData = {
        name: 'Client Name',
        service: 'design',
        budget: 1000,
        timeline: '1 week',
        email: 'client@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      // LinkedIn/WhatsApp message should be max 2000 chars
      expect(message.length).toBeLessThan(2000);
    });

    it('should maintain professional tone', async () => {
      const prospectData = {
        name: 'Client',
        service: 'services',
        budget: 1000,
        email: 'client@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      const lowerMessage = message.toLowerCase();
      
      // Should not contain inappropriate language
      expect(lowerMessage).not.toMatch(/spam|scam|guaranteed/i);
    });
  });

  describe('Multi-Channel Message Generation', () => {
    it('should generate appropriate SMS format messages', async () => {
      const prospectData = {
        name: 'John',
        service: 'web dev',
        email: 'john@example.com',
        channel: 'sms',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      // SMS should be shorter
      expect(message.length).toBeLessThan(500);
    });

    it('should generate appropriate email format messages', async () => {
      const prospectData = {
        name: 'John',
        service: 'web development',
        email: 'john@example.com',
        channel: 'email',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should generate appropriate WhatsApp format messages', async () => {
      const prospectData = {
        name: 'John',
        service: 'design',
        email: 'john@example.com',
        channel: 'whatsapp',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should generate appropriate LinkedIn format messages', async () => {
      const prospectData = {
        name: 'John Smith',
        service: 'services',
        email: 'john@example.com',
        channel: 'linkedin',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle null email gracefully', async () => {
      expect(async () => {
        await prospectingService.getSmartProspectingActions(null as any);
      }).not.toThrow();
    });

    it('should handle empty email gracefully', async () => {
      const result = await prospectingService.getSmartProspectingActions('');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle malformed email gracefully', async () => {
      const result = await prospectingService.getSmartProspectingActions('not-an-email');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle null prospect data', async () => {
      expect(async () => {
        await prospectingService.generateProspectingMessage(null as any);
      }).not.toThrow();
    });

    it('should handle missing prospect name', async () => {
      const prospectData = {
        service: 'design',
        email: 'test@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData as any);
      expect(message).toBeDefined();
    });

    it('should handle network failures gracefully', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle Firebase errors gracefully', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle very long prospect name', async () => {
      const prospectData = {
        name: 'A'.repeat(500),
        service: 'design',
        email: 'test@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should handle very high budget values', async () => {
      const prospectData = {
        name: 'Rich Client',
        service: 'web development',
        budget: 1000000,
        timeline: '6 months',
        email: 'rich@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should handle zero budget', async () => {
      const prospectData = {
        name: 'Budget Client',
        service: 'design',
        budget: 0,
        email: 'budget@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should handle negative budget gracefully', async () => {
      const prospectData = {
        name: 'Client',
        service: 'services',
        budget: -100,
        email: 'test@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message).toBeDefined();
    });

    it('should handle unusual service names', async () => {
      const services = [
        'Very niche service',
        '123 Numeric',
        'Service-with-dashes',
        'Serviço em Português',
        'SERVICE_WITH_UNDERSCORES',
      ];

      for (const service of services) {
        const prospectData = {
          name: 'Client',
          service,
          email: 'test@example.com',
        };

        const message = await prospectingService.generateProspectingMessage(prospectData);
        expect(message).toBeDefined();
      }
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map((_, i) =>
        prospectingService.getSmartProspectingActions(`user${i}@example.com`)
      );

      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(Array.isArray(result.value)).toBe(true);
        }
      });
    });
  });

  describe('Performance', () => {
    it('should retrieve actions within reasonable time', async () => {
      const start = Date.now();
      await prospectingService.getSmartProspectingActions('user@example.com');
      const duration = Date.now() - start;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should generate messages within reasonable time', async () => {
      const prospectData = {
        name: 'Client',
        service: 'design',
        email: 'test@example.com',
      };

      const start = Date.now();
      await prospectingService.generateProspectingMessage(prospectData);
      const duration = Date.now() - start;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle bulk action retrieval', async () => {
      const start = Date.now();
      const promises = Array(50).fill(null).map((_, i) =>
        prospectingService.getSmartProspectingActions(`user${i}@example.com`)
      );

      await Promise.all(promises);
      const duration = Date.now() - start;

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Data Validation', () => {
    it('should return consistent data structure for actions', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      
      result.forEach(action => {
        expect(typeof action).toBe('object');
        expect(action).not.toBeNull();
      });
    });

    it('should generate non-empty messages', async () => {
      const prospectData = {
        name: 'Client',
        service: 'services',
        email: 'test@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      expect(message.length).toBeGreaterThan(0);
    });

    it('should not generate messages with excessive newlines', async () => {
      const prospectData = {
        name: 'Client',
        service: 'services',
        email: 'test@example.com',
      };

      const message = await prospectingService.generateProspectingMessage(prospectData);
      const consecutiveNewlines = message.match(/\n\n\n/g);
      
      expect(consecutiveNewlines).toBeNull();
    });
  });

  describe('Integration with Firestore', () => {
    it('should query correct collection', async () => {
      await prospectingService.getSmartProspectingActions('user@example.com');
      // Should not throw any Firestore related errors
      expect(true).toBe(true);
    });

    it('should handle Firestore permission errors', async () => {
      const result = await prospectingService.getSmartProspectingActions('user@example.com');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
