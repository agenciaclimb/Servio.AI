import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import * as logger from '../utils/logger';
import {
  trackEvent,
  trackPageView,
  trackTourStarted,
  trackTourCompleted,
  trackTourSkipped,
  trackQuickActionUsed,
  trackDashboardEngagement,
  trackNotificationPermission,
  trackNotificationReceived,
  trackNotificationClicked,
  trackReferralShare,
  trackTemplateUsed,
} from '../src/services/analyticsService';

// Mock dependencies
vi.mock('../firebaseConfig', () => ({
  db: {},
  auth: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  Timestamp: {
    fromDate: date => date,
  },
}));

vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('trackEvent', () => {
    it('should track a basic event and call Firestore and logger', async () => {
      const eventName = 'test_event';
      const userId = 'user123';
      const properties = { foo: 'bar' };

      await trackEvent(eventName, userId, properties);

      expect(firestore.addDoc).toHaveBeenCalledOnce();
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];

      expect(addDocCall.eventName).toBe(eventName);
      expect(addDocCall.userId).toBe(userId);
      expect(addDocCall.prospectorId).toBe(userId);
      expect(addDocCall.properties).toEqual(properties);
      expect(addDocCall.sessionId).toMatch(/^session_\d+_\w+$/);
      expect(addDocCall.timestamp).toBeInstanceOf(Date);

      expect(logger.logInfo).toHaveBeenCalledWith(
        `[Analytics] Event tracked: ${eventName}`,
        properties
      );
      expect(logger.logError).not.toHaveBeenCalled();
    });

    it('should override prospectorId if provided in properties', async () => {
      await trackEvent('test_event', 'user123', { prospectorId: 'prospector456' });

      expect(firestore.addDoc).toHaveBeenCalledOnce();
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.prospectorId).toBe('prospector456');
    });

    it('should handle events with no properties', async () => {
      await trackEvent('simple_event', 'user123');

      expect(firestore.addDoc).toHaveBeenCalledOnce();
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.properties).toEqual({});
      expect(logger.logInfo).toHaveBeenCalledWith(
        '[Analytics] Event tracked: simple_event',
        undefined
      );
    });

    it('should log an error if Firestore call fails', async () => {
      const error = new Error('Firestore unavailable');
      (firestore.addDoc as any).mockRejectedValueOnce(error);

      await trackEvent('failing_event', 'user123');

      expect(logger.logError).toHaveBeenCalledWith('[Analytics] Failed to track event:', error);
      expect(logger.logInfo).not.toHaveBeenCalled();
    });
  });

  describe('getSessionId', () => {
    it('should create a new session if one does not exist', () => {
      trackEvent('test', 'user1'); //This calls getSessionId internally
      const sessionData = JSON.parse(sessionStorageMock.getItem('servio_session_id'));
      expect(sessionData.id).toMatch(/^session_\d+_\w+$/);
      expect(sessionData.timestamp).toBe(new Date('2025-01-01T12:00:00.000Z').getTime());
    });

    it('should retrieve an existing session if it is not expired', () => {
      const existingSession = { id: 'session_abc', timestamp: Date.now() - 10 * 60 * 1000 }; // 10 mins ago
      sessionStorageMock.setItem('servio_session_id', JSON.stringify(existingSession));

      trackEvent('test', 'user1');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];

      expect(addDocCall.sessionId).toBe('session_abc');
    });

    it('should create a new session if the existing one is expired', () => {
      const expiredSession = { id: 'session_xyz', timestamp: Date.now() - 40 * 60 * 1000 }; // 40 mins ago
      sessionStorageMock.setItem('servio_session_id', JSON.stringify(expiredSession));

      trackEvent('test', 'user1');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];

      expect(addDocCall.sessionId).not.toBe('session_xyz');
      expect(addDocCall.sessionId).toMatch(/^session_\d+_\w+$/);
    });
  });

  describe('trackPageView', () => {
    it('should track page_view on call and page_exit on cleanup', () => {
      const pageName = 'HomePage';
      const userId = 'user456';

      const cleanup = trackPageView(pageName, userId);

      // Check initial page_view event
      expect(firestore.addDoc).toHaveBeenCalledOnce();
      let addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('page_view');
      expect(addDocCall.properties).toEqual({ pageName });

      // Advance time and call cleanup
      vi.advanceTimersByTime(5000); // 5 seconds
      cleanup();

      // Check page_exit event
      expect(firestore.addDoc).toHaveBeenCalledTimes(2);
      addDocCall = (firestore.addDoc as any).mock.calls[1][1];
      expect(addDocCall.eventName).toBe('page_exit');
      expect(addDocCall.properties).toEqual({
        pageName,
        timeSpent: 5,
        timeSpentFormatted: '5s',
      });
    });

    it('should format duration correctly for over a minute', () => {
      const cleanup = trackPageView('SettingsPage', 'user789');
      vi.advanceTimersByTime(75000); // 1 minute 15 seconds
      cleanup();

      const addDocCall = (firestore.addDoc as any).mock.calls[1][1];
      expect(addDocCall.properties.timeSpentFormatted).toBe('1m 15s');
    });
  });

  // Test specific event trackers
  describe('Specific Event Trackers', () => {
    const userId = 'user-specific';

    it('trackTourStarted should track correctly', () => {
      trackTourStarted(userId);
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('tour_started');
      expect(addDocCall.properties).toEqual({ feature: 'prospector_onboarding' });
    });

    it('trackTourCompleted should track with timing', () => {
      trackTourCompleted(userId, 125); // 2m 5s
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('tour_completed');
      expect(addDocCall.properties).toEqual({
        feature: 'prospector_onboarding',
        completionTimeSeconds: 125,
        completionTimeFormatted: '2m 5s',
      });
    });

    it('trackTourSkipped should track the step number', () => {
      trackTourSkipped(userId, 3);
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('tour_skipped');
      expect(addDocCall.properties).toEqual({ feature: 'prospector_onboarding', stepNumber: 3 });
    });

    it('trackQuickActionUsed should track the action', () => {
      trackQuickActionUsed(userId, 'copy_whatsapp');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('quick_action_used');
      expect(addDocCall.properties).toEqual({
        feature: 'quick_actions_bar',
        action: 'copy_whatsapp',
      });
    });

    it('trackDashboardEngagement should track section and action', () => {
      trackDashboardEngagement(userId, 'leaderboard', 'click');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('dashboard_engagement');
      expect(addDocCall.properties).toEqual({
        feature: 'dashboard_unified',
        section: 'leaderboard',
        action: 'click',
      });
    });

    it('trackNotificationPermission should handle granted', () => {
      trackNotificationPermission(userId, true, 'retry');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('notification_permission_granted');
      expect(addDocCall.properties).toEqual({ feature: 'fcm_notifications', prompt: 'retry' });
    });

    it('trackNotificationPermission should handle denied', () => {
      trackNotificationPermission(userId, false, 'first');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('notification_permission_denied');
      expect(addDocCall.properties).toEqual({ feature: 'fcm_notifications', prompt: 'first' });
    });

    it('trackNotificationReceived should track the notification type', () => {
      trackNotificationReceived(userId, 'commission');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('notification_received');
      expect(addDocCall.properties).toEqual({
        feature: 'fcm_notifications',
        notificationType: 'commission',
      });
    });

    it('trackNotificationClicked should track the notification type', () => {
      trackNotificationClicked(userId, 'badge');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('notification_clicked');
      expect(addDocCall.properties).toEqual({
        feature: 'fcm_notifications',
        notificationType: 'badge',
      });
    });

    it('trackReferralShare should track the share method', () => {
      trackReferralShare(userId, 'qr');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('referral_share');
      expect(addDocCall.properties).toEqual({ feature: 'referral_links', method: 'qr' });
    });

    it('trackTemplateUsed should track template and platform', () => {
      trackTemplateUsed(userId, 'template-123', 'email');
      const addDocCall = (firestore.addDoc as any).mock.calls[0][1];
      expect(addDocCall.eventName).toBe('template_used');
      expect(addDocCall.properties).toEqual({
        feature: 'message_templates',
        templateId: 'template-123',
        platform: 'email',
      });
    });
  });
});
