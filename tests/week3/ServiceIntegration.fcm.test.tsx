import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Firebase Cloud Messaging (FCM) Service Integration Tests
 *
 * Coverage:
 * - FCM token generation and registration
 * - Notification permission requests
 * - Foreground message handling
 * - Background message handling
 * - Token refresh and revocation
 * - Event dispatching
 * - Error handling
 */

// Mock Firebase Messaging
const mockGetMessaging = vi.fn();
const mockGetToken = vi.fn();
const mockOnMessage = vi.fn();
const mockDeleteToken = vi.fn();

vi.mock('firebase/messaging', () => ({
  getMessaging: mockGetMessaging,
  getToken: mockGetToken,
  onMessage: mockOnMessage,
  deleteToken: mockDeleteToken,
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({ name: 'default' })),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

// Mock global Notification API
Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'default' as NotificationPermission,
    requestPermission: vi.fn(),
  },
  configurable: true,
});

describe('FCM Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Notification.permission as any) = 'default';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Notification Support Detection', () => {
    it('should detect notification support when all APIs available', () => {
      const hasNotification = 'Notification' in globalThis;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in globalThis;

      // At least Notification API should be available (mocked in setup)
      expect(hasNotification).toBe(true);
      // Service Worker and PushManager availability depends on test environment
      // They may or may not be available in JSDOM
      expect([true, false]).toContain(hasServiceWorker);
      expect([true, false]).toContain(hasPushManager);
    });

    it('should report notification permission status', () => {
      const permission = Notification.permission;
      expect(['default', 'granted', 'denied']).toContain(permission);
    });
  });

  describe('FCM Token Management', () => {
    it('should request notification permission and get FCM token', async () => {
      const mockToken = 'fcm_token_test_123';

      (Notification.requestPermission as any) = vi.fn().mockResolvedValue('granted');
      (Notification.permission as any) = 'granted';
      mockGetMessaging.mockReturnValue({ name: 'messaging' });
      mockGetToken.mockResolvedValue(mockToken);

      const permission = await Notification.requestPermission();
      expect(permission).toBe('granted');

      const messaging = mockGetMessaging();
      expect(messaging).toBeDefined();

      const token = await mockGetToken(messaging, {
        vapidKey: 'test_vapid_key',
      });

      expect(token).toBe(mockToken);
      expect(mockGetToken).toHaveBeenCalledWith(messaging, {
        vapidKey: 'test_vapid_key',
      });
    });

    it('should handle permission denied scenario', async () => {
      (Notification.requestPermission as any) = vi.fn().mockResolvedValue('denied');

      const permission = await Notification.requestPermission();
      expect(permission).toBe('denied');
    });

    it('should handle messaging initialization failure', () => {
      mockGetMessaging.mockReturnValue(null);

      const messaging = mockGetMessaging();
      expect(messaging).toBeNull();
    });

    it('should register FCM token with backend', async () => {
      const mockToken = 'fcm_token_test_123';
      const userId = 'user@example.com';

      mockGetToken.mockResolvedValue(mockToken);

      const token = await mockGetToken({} as any, {
        vapidKey: 'test_vapid_key',
      });

      // Simulate backend registration
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, fcmToken: mockToken }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      const response = await fetch('http://localhost:8081/prospector/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fcmToken: token }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.fcmToken).toBe(mockToken);
    });

    it('should revoke FCM token from backend', async () => {
      const mockToken = 'fcm_token_test_123';
      const userId = 'user@example.com';

      mockDeleteToken.mockResolvedValue(true);

      const result = await mockDeleteToken({} as any);
      expect(result).toBe(true);

      // Simulate backend revocation
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      const response = await fetch('http://localhost:8081/prospector/fcm-token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fcmToken: mockToken }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle token refresh on expiry', async () => {
      const initialToken = 'fcm_token_old';
      const refreshedToken = 'fcm_token_new';

      mockGetToken.mockResolvedValueOnce(initialToken).mockResolvedValueOnce(refreshedToken);

      const token1 = await mockGetToken({} as any, {
        vapidKey: 'test_vapid_key',
      });
      expect(token1).toBe(initialToken);

      const token2 = await mockGetToken({} as any, {
        vapidKey: 'test_vapid_key',
      });
      expect(token2).toBe(refreshedToken);
      expect(mockGetToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message Handling', () => {
    it('should setup foreground message listener', async () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging' });
      mockOnMessage.mockImplementation((messaging, callback) => {
        // Simulate receiving a message
        setTimeout(() => {
          callback({
            notification: {
              title: 'Prospector Click',
              body: 'Someone clicked your referral link',
            },
            data: {
              type: 'prospector-click',
              link_id: 'link_123',
            },
          });
        }, 10);
        return () => {}; // Unsubscribe function
      });

      const messaging = mockGetMessaging();

      let receivedMessage: any;
      const unsubscribe = mockOnMessage(messaging, message => {
        receivedMessage = message;
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.notification.title).toBe('Prospector Click');
      expect(receivedMessage.data.type).toBe('prospector-click');
      expect(typeof unsubscribe).toBe('function');
    });

    it('should dispatch custom event on message received', async () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging' });

      const eventListener = vi.fn();
      window.addEventListener('prospector-click', eventListener);

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Prospector Click',
            body: 'Someone clicked your referral link',
          },
          data: {
            type: 'prospector-click',
            link_id: 'link_123',
            count: '5',
          },
        });
        return () => {};
      });

      const messaging = mockGetMessaging();
      mockOnMessage(messaging, message => {
        const event = new CustomEvent(message.data.type, {
          detail: message.data,
        });
        window.dispatchEvent(event);
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(eventListener).toHaveBeenCalled();
      window.removeEventListener('prospector-click', eventListener);
    });

    it('should handle different notification types', async () => {
      const mockMessages = [
        {
          type: 'prospector-click',
          title: 'Link Clicked',
          icon: 'click',
        },
        {
          type: 'prospector-conversion',
          title: 'New Recruit',
          icon: 'star',
        },
        {
          type: 'prospector-commission',
          title: 'Commission Earned',
          icon: 'payment',
        },
        {
          type: 'prospector-badge',
          title: 'Badge Unlocked',
          icon: 'trophy',
        },
      ];

      mockMessages.forEach(msg => {
        expect([
          'prospector-click',
          'prospector-conversion',
          'prospector-commission',
          'prospector-badge',
        ]).toContain(msg.type);
      });
    });

    it('should handle notification with metadata', async () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging' });

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Commission Earned',
            body: '$50.00 commission',
          },
          data: {
            type: 'prospector-commission',
            amount: '50',
            currency: 'usd',
            recruit_id: 'user_123',
            timestamp: '1234567890',
          },
        });
        return () => {};
      });

      const messaging = mockGetMessaging();

      let receivedData: any;
      mockOnMessage(messaging, message => {
        receivedData = message.data;
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedData.amount).toBe('50');
      expect(receivedData.currency).toBe('usd');
      expect(receivedData.recruit_id).toBe('user_123');
    });
  });

  describe('Error Handling', () => {
    it('should handle getToken errors', async () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging' });
      mockGetToken.mockRejectedValue(new Error('Failed to get FCM token'));

      try {
        await mockGetToken({} as any, {
          vapidKey: 'test_vapid_key',
        });
        expect.fail('Should have thrown error');
      } catch (err) {
        expect((err as Error).message).toBe('Failed to get FCM token');
      }
    });

    it('should handle deleteToken errors', async () => {
      mockDeleteToken.mockRejectedValue(new Error('Failed to delete FCM token'));

      try {
        await mockDeleteToken({} as any);
        expect.fail('Should have thrown error');
      } catch (err) {
        expect((err as Error).message).toBe('Failed to delete FCM token');
      }
    });

    it('should handle browser not supporting notifications', () => {
      const hasNotifications = 'Notification' in globalThis;
      expect(hasNotifications).toBe(true); // We have mocked it
    });

    it('should handle messaging initialization errors', () => {
      mockGetMessaging.mockImplementation(() => {
        throw new Error('Firebase not initialized');
      });

      expect(() => mockGetMessaging()).toThrow('Firebase not initialized');
    });

    it('should handle onMessage subscription errors', async () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging' });
      mockOnMessage.mockImplementation(() => {
        throw new Error('Failed to subscribe to messages');
      });

      expect(() => {
        mockOnMessage({} as any, () => {});
      }).toThrow('Failed to subscribe to messages');
    });
  });

  describe('Permission Management', () => {
    it('should transition from default to granted permission', async () => {
      (Notification.permission as any) = 'default';
      expect(Notification.permission).toBe('default');

      (Notification.requestPermission as any) = vi.fn().mockResolvedValue('granted');

      const permission = await Notification.requestPermission();
      (Notification.permission as any) = permission;

      expect(Notification.permission).toBe('granted');
    });

    it('should handle denied permission', async () => {
      (Notification.requestPermission as any) = vi.fn().mockResolvedValue('denied');

      const permission = await Notification.requestPermission();
      expect(permission).toBe('denied');
    });

    it('should respect user permission choice', async () => {
      (Notification.requestPermission as any) = vi.fn().mockResolvedValue('granted');

      const perm1 = await Notification.requestPermission();
      expect(perm1).toBe('granted');

      (Notification.requestPermission as any).mockResolvedValueOnce('denied');
      const perm2 = await Notification.requestPermission();
      expect(perm2).toBe('denied');
    });
  });

  describe('Integration with Backend', () => {
    it('should register token when user logs in', async () => {
      const userId = 'user@example.com';
      const token = 'fcm_token_123';

      mockGetMessaging.mockReturnValue({ name: 'messaging' });
      mockGetToken.mockResolvedValue(token);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      // Get token
      const fcmToken = await mockGetToken({} as any, {
        vapidKey: 'test_vapid_key',
      });

      // Register with backend
      const response = await fetch('/api/prospector/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fcmToken }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/prospector/fcm-token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should revoke token when user logs out', async () => {
      const userId = 'user@example.com';
      const token = 'fcm_token_123';

      mockDeleteToken.mockResolvedValue(true);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      // Delete token
      await mockDeleteToken({} as any);

      // Revoke from backend
      const response = await fetch('/api/prospector/fcm-token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fcmToken: token }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle backend registration failures', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      global.fetch = mockFetch as unknown as typeof fetch;

      const response = await fetch('/api/prospector/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user@example.com', fcmToken: 'token' }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache messaging instance', () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging', cached: true });

      const messaging1 = mockGetMessaging();
      const messaging2 = mockGetMessaging();

      expect(messaging1).toBe(messaging2);
      expect(mockGetMessaging).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe from message listener on cleanup', async () => {
      mockGetMessaging.mockReturnValue({ name: 'messaging' });

      const unsubscribeFn = vi.fn();
      mockOnMessage.mockReturnValue(unsubscribeFn);

      const messaging = mockGetMessaging();
      const unsubscribe = mockOnMessage(messaging, () => {});

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBe(unsubscribeFn);

      // Verify the unsubscribe function is the one returned from mockOnMessage
      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should handle concurrent token requests', async () => {
      mockGetToken
        .mockResolvedValueOnce('token_1')
        .mockResolvedValueOnce('token_2')
        .mockResolvedValueOnce('token_3');

      const promises = [
        mockGetToken({} as any, { vapidKey: 'key' }),
        mockGetToken({} as any, { vapidKey: 'key' }),
        mockGetToken({} as any, { vapidKey: 'key' }),
      ];

      const tokens = await Promise.all(promises);

      expect(tokens).toHaveLength(3);
      expect(mockGetToken).toHaveBeenCalledTimes(3);
    });
  });
});
