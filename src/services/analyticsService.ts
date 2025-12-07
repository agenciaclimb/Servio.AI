/**
 * Analytics Service - Phase 1 Metrics Tracking
 *
 * Tracks user interactions and KPIs for Phase 1 features:
 * - Onboarding tour completion
 * - Quick actions usage
 * - Dashboard engagement
 * - FCM notification permissions
 */

import { db } from '../../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { logInfo, logError } from '../../utils/logger';

export type AnalyticsProperties = Record<string, unknown> & {
  prospectorId?: string;
};

export interface AnalyticsEvent {
  eventName: string;
  userId: string;
  prospectorId?: string;
  timestamp: Date;
  properties?: AnalyticsProperties;
  sessionId?: string;
}

// Get or create session ID (persists for 30 minutes)
function getSessionId(): string {
  const SESSION_KEY = 'servio_session_id';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  const sessionData = sessionStorage.getItem(SESSION_KEY);

  if (sessionData) {
    const { id, timestamp } = JSON.parse(sessionData);
    if (Date.now() - timestamp < SESSION_DURATION) {
      return id;
    }
  }

  // Create new session
  const randomSegment = Math.random().toString(36).slice(2, 11);
  const newSessionId = `session_${Date.now()}_${randomSegment}`;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: newSessionId,
      timestamp: Date.now(),
    })
  );

  return newSessionId;
}

/**
 * Track analytics event to Firestore
 */
export async function trackEvent(
  eventName: string,
  userId: string,
  properties?: AnalyticsProperties
): Promise<void> {
  try {
    const prospectorIdOverride =
      typeof properties?.prospectorId === 'string' ? properties.prospectorId : undefined;
    const event: AnalyticsEvent = {
      eventName,
      userId,
      prospectorId: prospectorIdOverride || userId,
      timestamp: new Date(),
      sessionId: getSessionId(),
      properties: properties ?? {},
    };

    await addDoc(collection(db, 'analytics_events'), {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    });

    logInfo(`[Analytics] Event tracked: ${eventName}`, properties);
  } catch (error) {
    logError('[Analytics] Failed to track event:', error);
  }
}

/**
 * Track page view with time spent
 */
export function trackPageView(pageName: string, userId: string): () => void {
  const startTime = Date.now();

  trackEvent('page_view', userId, { pageName });

  // Return cleanup function to track time spent
  return () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds
    trackEvent('page_exit', userId, {
      pageName,
      timeSpent,
      timeSpentFormatted: formatDuration(timeSpent),
    });
  };
}

/**
 * Helper: Format duration in seconds to human-readable
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

// ============ PHASE 1 SPECIFIC EVENTS ============

/**
 * Track onboarding tour events
 */
export function trackTourStarted(userId: string): void {
  trackEvent('tour_started', userId, { feature: 'prospector_onboarding' });
}

export function trackTourCompleted(userId: string, completionTime: number): void {
  trackEvent('tour_completed', userId, {
    feature: 'prospector_onboarding',
    completionTimeSeconds: completionTime,
    completionTimeFormatted: formatDuration(completionTime),
  });
}

export function trackTourSkipped(userId: string, stepNumber: number): void {
  trackEvent('tour_skipped', userId, {
    feature: 'prospector_onboarding',
    stepNumber,
  });
}

/**
 * Track quick actions bar usage
 */
export function trackQuickActionUsed(
  userId: string,
  action: 'copy_link' | 'copy_whatsapp' | 'copy_email' | 'copy_sms'
): void {
  trackEvent('quick_action_used', userId, {
    feature: 'quick_actions_bar',
    action,
  });
}

/**
 * Track dashboard engagement
 */
export function trackDashboardEngagement(
  userId: string,
  section: string,
  action: 'click' | 'scroll' | 'hover'
): void {
  trackEvent('dashboard_engagement', userId, {
    feature: 'dashboard_unified',
    section,
    action,
  });
}

/**
 * Track FCM notification permission
 */
export function trackNotificationPermission(
  userId: string,
  granted: boolean,
  prompt: 'first' | 'retry' = 'first'
): void {
  trackEvent(
    granted ? 'notification_permission_granted' : 'notification_permission_denied',
    userId,
    {
      feature: 'fcm_notifications',
      prompt,
    }
  );
}

/**
 * Track FCM notification received/clicked
 */
export function trackNotificationReceived(
  userId: string,
  notificationType: 'click' | 'conversion' | 'commission' | 'badge'
): void {
  trackEvent('notification_received', userId, {
    feature: 'fcm_notifications',
    notificationType,
  });
}

export function trackNotificationClicked(
  userId: string,
  notificationType: 'click' | 'conversion' | 'commission' | 'badge'
): void {
  trackEvent('notification_clicked', userId, {
    feature: 'fcm_notifications',
    notificationType,
  });
}

/**
 * Track referral link shares
 */
export function trackReferralShare(
  userId: string,
  method: 'whatsapp' | 'email' | 'sms' | 'copy' | 'qr'
): void {
  trackEvent('referral_share', userId, {
    feature: 'referral_links',
    method,
  });
}

/**
 * Track template usage
 */
export function trackTemplateUsed(
  userId: string,
  templateId: string,
  platform: 'whatsapp' | 'email' | 'sms'
): void {
  trackEvent('template_used', userId, {
    feature: 'message_templates',
    templateId,
    platform,
  });
}
