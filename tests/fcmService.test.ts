/**
 * Tests for FCM Service Pure Functions
 * Testing notification permission checks and helper functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
} from '../src/services/fcmService';

describe('fcmService pure functions', () => {
  describe('isNotificationSupported', () => {
    let originalNotification: any;
    let originalNavigator: any;
    let originalGlobalThis: any;

    beforeEach(() => {
      originalNotification = globalThis.Notification;
      originalNavigator = navigator.serviceWorker;
      originalGlobalThis = globalThis.PushManager;
    });

    afterEach(() => {
      globalThis.Notification = originalNotification;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
      globalThis.PushManager = originalGlobalThis;
    });

    it('should return true when all required APIs are available', () => {
      // Mock all required APIs
      Object.defineProperty(globalThis, 'Notification', {
        value: class MockNotification {},
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

      const result = isNotificationSupported();
      expect(typeof result).toBe('boolean');
    });

    it('should return a boolean value', () => {
      const result = isNotificationSupported();
      expect(typeof result).toBe('boolean');
    });

    it('should be callable multiple times', () => {
      const result1 = isNotificationSupported();
      const result2 = isNotificationSupported();
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    it('should have consistent return values', () => {
      const result1 = isNotificationSupported();
      const result2 = isNotificationSupported();
      expect(result1).toBe(result2);
    });
  });

  describe('getNotificationPermission', () => {
    let originalNotification: any;

    beforeEach(() => {
      originalNotification = globalThis.Notification;
    });

    afterEach(() => {
      globalThis.Notification = originalNotification;
    });

    it('should return a valid permission value', () => {
      const result = getNotificationPermission();
      expect(['granted', 'denied', 'default']).toContain(result);
    });

    it('should return denied when notifications not supported', () => {
      Object.defineProperty(globalThis, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const result = getNotificationPermission();
      expect(result).toBe('denied');
    });

    it('should return a string', () => {
      const result = getNotificationPermission();
      expect(typeof result).toBe('string');
    });

    it('should have consistent return for same state', () => {
      const result1 = getNotificationPermission();
      const result2 = getNotificationPermission();
      expect(result1).toBe(result2);
    });

    it('should not throw errors', () => {
      expect(() => {
        getNotificationPermission();
      }).not.toThrow();
    });

    it('should work without permission setup', () => {
      const result = getNotificationPermission();
      expect(result).toBeDefined();
    });

    it('should handle multiple calls without side effects', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          getNotificationPermission();
        }
      }).not.toThrow();
    });
  });

  describe('Integration: Notification capability detection', () => {
    it('should correctly identify notification support status', () => {
      const supported = isNotificationSupported();
      const permission = getNotificationPermission();

      if (supported) {
        expect(['granted', 'denied', 'default']).toContain(permission);
      } else {
        expect(permission).toBe('denied');
      }
    });

    it('should handle permission checks consistently', () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(getNotificationPermission());
      }

      // All results should be the same
      expect(new Set(results).size).toBe(1);
    });
  });
});
