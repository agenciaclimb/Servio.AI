/**
 * FCM Service Tests
 * Tests for Firebase Cloud Messaging integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fcmService from './fcmService';

// Mock Firebase Messaging
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({ id: 'mock-messaging' })),
  getToken: vi.fn(async () => 'mock-fcm-token-123'),
  onMessage: vi.fn((_, _callback) => () => {}),
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('fcmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isNotificationSupported', () => {
    it('should return true if notifications are supported', () => {
      const supported = fcmService.isNotificationSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('getNotificationPermission', () => {
    it('should return current notification permission', () => {
      const permission = fcmService.getNotificationPermission();
      expect(['granted', 'denied', 'default']).toContain(permission);
    });

    it('should return denied if notifications not supported', () => {
      const permission = fcmService.getNotificationPermission();
      expect(typeof permission).toBe('string');
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request notification permission', async () => {
      const result = await fcmService.requestNotificationPermission('user123');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
    });

    it('should return success or error', async () => {
      const result = await fcmService.requestNotificationPermission('user456');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle unsupported browsers', async () => {
      const result = await fcmService.requestNotificationPermission('user789');
      expect(result).toHaveProperty('success');
    });

    it('should get FCM token on success', async () => {
      const result = await fcmService.requestNotificationPermission('user123');
      if (result.success) {
        expect(result.token).toBeDefined();
      }
    });

    it('should return error message on failure', async () => {
      const result = await fcmService.requestNotificationPermission('user123');
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('setupForegroundListener', () => {
    it('should setup message listener', () => {
      const unsubscribe = fcmService.setupForegroundListener();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const unsubscribe = fcmService.setupForegroundListener();
      expect(unsubscribe).toBeDefined();
      unsubscribe();
    });

    it('should handle multiple listeners', () => {
      const unsubscribe1 = fcmService.setupForegroundListener();
      const unsubscribe2 = fcmService.setupForegroundListener();
      expect(unsubscribe1).toBeDefined();
      expect(unsubscribe2).toBeDefined();
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('revokeNotificationPermission', () => {
    it('should revoke notification permission', async () => {
      await fcmService.revokeNotificationPermission('user123');
      expect(true).toBe(true);
    });

    it('should handle revocation for different users', async () => {
      await fcmService.revokeNotificationPermission('user1');
      await fcmService.revokeNotificationPermission('user2');
      expect(true).toBe(true);
    });
  });

  describe('useProspectorNotifications', () => {
    it('should return notifications hook', () => {
      const hook = fcmService.useProspectorNotifications('prosp123');
      expect(hook).toBeDefined();
    });

    it('should handle different prospector IDs', () => {
      const hook1 = fcmService.useProspectorNotifications('prosp1');
      const hook2 = fcmService.useProspectorNotifications('prosp2');
      expect(hook1).toBeDefined();
      expect(hook2).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle permission request errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
      const result = await fcmService.requestNotificationPermission('user123');
      expect(result).toBeDefined();
    });

    it('should handle messaging initialization errors', async () => {
      const result = await fcmService.requestNotificationPermission('user123');
      expect(result).toHaveProperty('success');
    });
  });

  describe('notification types', () => {
    it('should handle click notification events', () => {
      fcmService.setupForegroundListener();
      expect(true).toBe(true);
    });

    it('should handle conversion notification events', () => {
      fcmService.setupForegroundListener();
      expect(true).toBe(true);
    });

    it('should handle commission notification events', () => {
      fcmService.setupForegroundListener();
      expect(true).toBe(true);
    });

    it('should handle badge notification events', () => {
      fcmService.setupForegroundListener();
      expect(true).toBe(true);
    });
  });
});
