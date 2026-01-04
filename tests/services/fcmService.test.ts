import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase messaging
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({})),
}));

vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

// Store original values
const originalNotification = globalThis.Notification;
const originalServiceWorker = navigator.serviceWorker;
const originalPushManager = globalThis.PushManager;

describe('fcmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Reset global mocks
    Object.defineProperty(globalThis, 'Notification', {
      value: class MockNotification {
        static permission: NotificationPermission = 'granted';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        constructor(
          public title: string,
          public options?: NotificationOptions
        ) {}
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'PushManager', {
      value: class MockPushManager {},
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(globalThis, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'PushManager', {
      value: originalPushManager,
      writable: true,
      configurable: true,
    });
  });

  describe('isNotificationSupported', () => {
    it('returns true when all features are supported', async () => {
      const { isNotificationSupported } = await import('../../src/services/fcmService');
      expect(isNotificationSupported()).toBe(true);
    });

    it('returns false when Notification is not in globalThis', async () => {
      // @ts-expect-error Testing deletion
      delete globalThis.Notification;
      const { isNotificationSupported } = await import('../../src/services/fcmService');
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe('getNotificationPermission', () => {
    it('returns granted when permission is granted', async () => {
      const { getNotificationPermission } = await import('../../src/services/fcmService');
      expect(getNotificationPermission()).toBe('granted');
    });

    it('returns denied when permission is denied', async () => {
      Object.defineProperty(globalThis, 'Notification', {
        value: class {
          static permission: NotificationPermission = 'denied';
        },
        writable: true,
        configurable: true,
      });
      vi.resetModules();
      const { getNotificationPermission } = await import('../../src/services/fcmService');
      expect(getNotificationPermission()).toBe('denied');
    });

    it('returns denied when notifications not supported', async () => {
      // @ts-expect-error Testing deletion
      delete globalThis.Notification;
      vi.resetModules();
      const { getNotificationPermission } = await import('../../src/services/fcmService');
      expect(getNotificationPermission()).toBe('denied');
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns error when notifications not supported', async () => {
      // @ts-expect-error Testing deletion
      delete globalThis.Notification;
      vi.resetModules();
      const { requestNotificationPermission } = await import('../../src/services/fcmService');

      const result = await requestNotificationPermission('user123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Notifications not supported');
    });

    it('returns error when permission denied', async () => {
      Object.defineProperty(globalThis, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('denied'),
        },
        writable: true,
        configurable: true,
      });
      vi.resetModules();
      const { requestNotificationPermission } = await import('../../src/services/fcmService');

      const result = await requestNotificationPermission('user123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('returns error when messaging init fails', async () => {
      const { getApp } = await import('firebase/app');
      vi.mocked(getApp).mockImplementation(() => {
        throw new Error('App not initialized');
      });
      vi.resetModules();

      const { requestNotificationPermission } = await import('../../src/services/fcmService');
      const result = await requestNotificationPermission('user123');
      expect(result.success).toBe(false);
    });
  });

  describe('setupForegroundListener', () => {
    it('returns noop when messaging not initialized', async () => {
      const { getApp } = await import('firebase/app');
      vi.mocked(getApp).mockImplementation(() => {
        throw new Error('No app');
      });
      vi.resetModules();

      const { setupForegroundListener } = await import('../../src/services/fcmService');
      const unsubscribe = setupForegroundListener();
      expect(typeof unsubscribe).toBe('function');
      // Should not throw
      unsubscribe();
    });

    it('sets up message listener when messaging available', async () => {
      const { getMessaging, onMessage } = await import('firebase/messaging');
      const mockMessaging = { name: 'messaging' };
      vi.mocked(getMessaging).mockReturnValue(mockMessaging as any);
      vi.mocked(onMessage).mockReturnValue(() => {});
      vi.resetModules();

      const { setupForegroundListener } = await import('../../src/services/fcmService');
      const unsubscribe = setupForegroundListener();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('revokeNotificationPermission', () => {
    it('calls backend to revoke token', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);

      const { revokeNotificationPermission } = await import('../../src/services/fcmService');
      await revokeNotificationPermission('user123');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/prospector/fcm-token'),
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospectorId: 'user123' }),
        })
      );
    });

    it('handles errors gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);

      const { revokeNotificationPermission } = await import('../../src/services/fcmService');

      // Should not throw
      await expect(revokeNotificationPermission('user123')).resolves.toBeUndefined();
    });
  });

  describe('useProspectorNotifications', () => {
    it('sets up event listeners for prospector events', async () => {
      const { useProspectorNotifications } = await import('../../src/services/fcmService');
      const callback = vi.fn();

      const cleanup = useProspectorNotifications(callback);

      // Dispatch test event
      globalThis.dispatchEvent(
        new CustomEvent('prospector-click', { detail: { id: 'lead1' } })
      );

      expect(callback).toHaveBeenCalledWith('click', { id: 'lead1' });

      // Test cleanup
      if (cleanup) {
        cleanup();
      }
    });

    it('handles multiple event types', async () => {
      const { useProspectorNotifications } = await import('../../src/services/fcmService');
      const callback = vi.fn();

      const cleanup = useProspectorNotifications(callback);

      globalThis.dispatchEvent(
        new CustomEvent('prospector-conversion', { detail: { amount: 100 } })
      );
      globalThis.dispatchEvent(
        new CustomEvent('prospector-commission', { detail: { value: 50 } })
      );
      globalThis.dispatchEvent(
        new CustomEvent('prospector-badge', { detail: { badge: 'gold' } })
      );

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith('conversion', { amount: 100 });
      expect(callback).toHaveBeenCalledWith('commission', { value: 50 });
      expect(callback).toHaveBeenCalledWith('badge', { badge: 'gold' });

      if (cleanup) {
        cleanup();
      }
    });
  });

  describe('default export', () => {
    it('exports all functions', async () => {
      const fcmService = await import('../../src/services/fcmService');
      expect(fcmService.default).toHaveProperty('isNotificationSupported');
      expect(fcmService.default).toHaveProperty('getNotificationPermission');
      expect(fcmService.default).toHaveProperty('requestNotificationPermission');
      expect(fcmService.default).toHaveProperty('setupForegroundListener');
      expect(fcmService.default).toHaveProperty('revokeNotificationPermission');
    });
  });
});
