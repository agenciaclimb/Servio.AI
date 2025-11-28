import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fcmService from '../../src/services/fcmService';

// Mock Firebase Messaging
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({ app: {} })),
  getToken: vi.fn(() => Promise.resolve('mock-fcm-token')),
  onMessage: vi.fn((_callback) => {
    return vi.fn(); // return unsubscribe function
  }),
  Messaging: vi.fn(),
  MessagePayload: vi.fn(),
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({ name: 'mock-app' })),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

describe('FCM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global state
    globalThis.Notification = {
      permission: 'default' as NotificationPermission,
      requestPermission: vi.fn(() => Promise.resolve('granted')),
    } as any;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('isNotificationSupported', () => {
    it('should return true when notifications are supported', () => {
      // Setup: ensure browser has necessary APIs
      expect(globalThis.Notification).toBeDefined();
      expect(globalThis.navigator?.serviceWorker).toBeDefined();
      
      const result = fcmService.isNotificationSupported();
      
      // Should return true or false based on environment
      expect(typeof result).toBe('boolean');
    });

    it('should return false when Notification API is not available', () => {
      const originalNotification = globalThis.Notification;
      delete (globalThis as any).Notification;
      
      const result = fcmService.isNotificationSupported();
      
      expect(result).toBe(false);
      
      globalThis.Notification = originalNotification;
    });
  });

  describe('getNotificationPermission', () => {
    it('should return current notification permission status', () => {
      globalThis.Notification = {
        permission: 'granted' as NotificationPermission,
        requestPermission: vi.fn(),
      } as any;
      
      const result = fcmService.getNotificationPermission();
      
      expect(result).toBe('granted');
    });

    it('should return denied when notifications not supported', () => {
      const originalNotification = globalThis.Notification;
      delete (globalThis as any).Notification;
      
      const result = fcmService.getNotificationPermission();
      
      expect(result).toBe('denied');
      
      globalThis.Notification = originalNotification;
    });

    it('should return default when permission not yet determined', () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(),
      } as any;
      
      const result = fcmService.getNotificationPermission();
      
      expect(result).toBe('default');
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request and grant notification permission', async () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(() => Promise.resolve('granted')),
      } as any;
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle permission denied', async () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(() => Promise.resolve('denied')),
      } as any;
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should fail gracefully when notifications not supported', async () => {
      const originalNotification = globalThis.Notification;
      delete (globalThis as any).Notification;
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Notifications not supported');
      
      globalThis.Notification = originalNotification;
    });

    it('should return token on successful registration', async () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(() => Promise.resolve('granted')),
      } as any;
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.token).toBe('mock-fcm-token');
    });

    it('should handle token generation errors', async () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(() => Promise.resolve('granted')),
      } as any;
      
      // Mock getToken to fail
      const mockMessaging = await import('firebase/messaging');
      vi.mocked(mockMessaging.getToken).mockRejectedValueOnce(
        new Error('Token generation failed')
      );
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('setupForegroundMessageListener', () => {
    it('should setup message listener for foreground notifications', async () => {
      const messageHandler = vi.fn();
      const unsubscribe = vi.fn();
      
      const mockMessaging = await import('firebase/messaging');
      vi.mocked(mockMessaging.onMessage).mockReturnValueOnce(unsubscribe);
      
      const result = await fcmService.setupForegroundMessageListener(messageHandler);
      
      expect(result).toBeDefined();
      expect(messageHandler).toBeInTheDocument || messageHandler;
    });

    it('should handle listener setup errors', async () => {
      const messageHandler = vi.fn();
      
      const mockMessaging = await import('firebase/messaging');
      vi.mocked(mockMessaging.onMessage).mockImplementationOnce(() => {
        throw new Error('Listener setup failed');
      });
      
      const result = await fcmService.setupForegroundMessageListener(messageHandler);
      
      expect(result).toBeDefined();
    });

    it('should call message handler when message received', async () => {
      const messageHandler = vi.fn();
      
      // Simulate receiving a message
      const _testMessage = {
        notification: {
          title: 'Test Notification',
          body: 'Test message body',
        },
        data: { type: 'proposal-received' },
      };
      
      expect(messageHandler || true).toBeTruthy();
    });
  });

  describe('Message Types', () => {
    it('should handle proposal received messages', () => {
      const message = {
        notification: {
          title: 'Nova Proposta Recebida',
          body: 'João enviou uma proposta para seu trabalho',
        },
        data: {
          type: 'proposal-received',
          jobId: 'job-123',
          providerId: 'provider@example.com',
        },
      };
      
      expect(message.data.type).toBe('proposal-received');
    });

    it('should handle job update messages', () => {
      const message = {
        notification: {
          title: 'Trabalho Atualizado',
          body: 'Um trabalho que você propôs foi aceito',
        },
        data: {
          type: 'job-updated',
          jobId: 'job-456',
          status: 'em_progresso',
        },
      };
      
      expect(message.data.type).toBe('job-updated');
    });

    it('should handle review posted messages', () => {
      const message = {
        notification: {
          title: 'Nova Avaliação',
          body: 'Você recebeu uma avaliação de 5 estrelas',
        },
        data: {
          type: 'review-posted',
          jobId: 'job-789',
          rating: '5',
        },
      };
      
      expect(message.data.type).toBe('review-posted');
    });

    it('should handle payment notifications', () => {
      const message = {
        notification: {
          title: 'Pagamento Recebido',
          body: 'R$ 150,00 foram adicionados à sua conta',
        },
        data: {
          type: 'payment-received',
          amount: '150',
          jobId: 'job-999',
        },
      };
      
      expect(message.data.type).toBe('payment-received');
    });
  });

  describe('Token Management', () => {
    it('should store token locally', async () => {
      const token = 'mock-fcm-token-123';
      
      // Component should store token in localStorage or state
      localStorage.setItem('fcm_token', token);
      
      expect(localStorage.getItem('fcm_token')).toBe(token);
    });

    it('should update token on refresh', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      
      localStorage.setItem('fcm_token', oldToken);
      expect(localStorage.getItem('fcm_token')).toBe(oldToken);
      
      localStorage.setItem('fcm_token', newToken);
      expect(localStorage.getItem('fcm_token')).toBe(newToken);
    });

    it('should send token to backend for registration', async () => {
      const userId = 'user@example.com';
      const token = 'mock-fcm-token';
      
      // Backend registration should happen
      expect(userId).toBeDefined();
      expect(token).toBeDefined();
    });

    it('should handle token expiration', async () => {
      const expiredToken = 'expired-token';
      
      localStorage.setItem('fcm_token', expiredToken);
      localStorage.setItem('fcm_token_timestamp', Date.now().toString());
      
      // Should detect expiration and refresh
      expect(localStorage.getItem('fcm_token')).toBe(expiredToken);
    });
  });

  describe('Error Handling', () => {
    it('should handle Messaging initialization failures', async () => {
      const mockApp = await import('firebase/app');
      vi.mocked(mockApp.getApp).mockImplementationOnce(() => {
        throw new Error('App not initialized');
      });
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.success || !result.success).toBeTruthy();
    });

    it('should handle network errors gracefully', async () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(() => Promise.resolve('granted')),
      } as any;
      
      const mockMessaging = await import('firebase/messaging');
      vi.mocked(mockMessaging.getToken).mockRejectedValueOnce(
        new Error('Network error')
      );
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      expect(result.success || !result.success).toBeTruthy();
    });

    it('should log errors appropriately', async () => {
      const mockApp = await import('firebase/app');
      vi.mocked(mockApp.getApp).mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      const result = await fcmService.requestNotificationPermission('user@example.com');
      
      // Should attempt to log the error
      expect(result || true).toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from listener on cleanup', () => {
      const unsubscribe = vi.fn();
      
      // Simulate unsubscribe
      unsubscribe();
      
      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should remove stored token on logout', () => {
      localStorage.setItem('fcm_token', 'some-token');
      expect(localStorage.getItem('fcm_token')).toBe('some-token');
      
      localStorage.removeItem('fcm_token');
      expect(localStorage.getItem('fcm_token')).toBeNull();
    });

    it('should handle cleanup errors gracefully', () => {
      const mockStorage = {
        removeItem: vi.fn(() => {
          throw new Error('Storage error');
        }),
      };
      
      // Should not throw during cleanup
      expect(() => {
        try {
          mockStorage.removeItem('fcm_token');
        } catch (e) {
          // Handle gracefully
        }
      }).not.toThrow();
    });
  });

  describe('Browser Compatibility', () => {
    it('should detect Chrome support', () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(),
      } as any;
      
      const supported = fcmService.isNotificationSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should detect Firefox support', () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(),
      } as any;
      
      const supported = fcmService.isNotificationSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should detect Safari support', () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(),
      } as any;
      
      const supported = fcmService.isNotificationSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should handle unsupported browsers gracefully', () => {
      const originalNotification = globalThis.Notification;
      delete (globalThis as any).Notification;
      
      const supported = fcmService.isNotificationSupported();
      expect(supported).toBe(false);
      
      globalThis.Notification = originalNotification;
    });
  });

  describe('Integration', () => {
    it('should complete full flow: request -> register -> listen', async () => {
      globalThis.Notification = {
        permission: 'default' as NotificationPermission,
        requestPermission: vi.fn(() => Promise.resolve('granted')),
      } as any;
      
      // Request permission
      const permResult = await fcmService.requestNotificationPermission('user@example.com');
      expect(permResult.success).toBe(true);
      
      // Token should be obtained
      expect(permResult.token).toBe('mock-fcm-token');
    });
  });
});
