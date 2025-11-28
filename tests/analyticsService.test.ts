/**
 * Tests for Analytics Service Pure Functions
 * Testing page tracking, tour tracking, and event tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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

// Mock gtag since it's a window function
vi.stubGlobal('gtag', vi.fn());

describe('analyticsService tracking functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackPageView', () => {
    it('should return a function', () => {
      const tracker = trackPageView('TestPage', 'user123');
      expect(typeof tracker).toBe('function');
    });

    it('should be callable multiple times', () => {
      const tracker = trackPageView('HomePage', 'user456');
      expect(() => {
        tracker();
        tracker();
      }).not.toThrow();
    });

    it('should work with different page names', () => {
      const pages = ['Dashboard', 'Jobs', 'Messages', 'Profile', 'Services'];
      pages.forEach(page => {
        const tracker = trackPageView(page, 'user789');
        expect(typeof tracker).toBe('function');
      });
    });

    it('should work with different user IDs', () => {
      const userIds = ['user1', 'user2@test.com', 'provider@domain.com'];
      userIds.forEach(userId => {
        const tracker = trackPageView('TestPage', userId);
        expect(typeof tracker).toBe('function');
      });
    });

    it('should handle empty page name', () => {
      const tracker = trackPageView('', 'user123');
      expect(typeof tracker).toBe('function');
    });

    it('should handle empty user ID', () => {
      const tracker = trackPageView('TestPage', '');
      expect(typeof tracker).toBe('function');
    });

    it('should handle special characters in page name', () => {
      const tracker = trackPageView('Dashboard/Jobs/Search', 'user123');
      expect(typeof tracker).toBe('function');
    });

    it('should handle very long page names', () => {
      const longName = 'A'.repeat(500);
      const tracker = trackPageView(longName, 'user123');
      expect(typeof tracker).toBe('function');
    });
  });

  describe('trackTourStarted', () => {
    it('should not throw for valid user ID', () => {
      expect(() => {
        trackTourStarted('user123');
      }).not.toThrow();
    });

    it('should not throw for empty user ID', () => {
      expect(() => {
        trackTourStarted('');
      }).not.toThrow();
    });

    it('should handle different user ID formats', () => {
      const userIds = ['user1', 'email@domain.com', 'provider@service.io'];
      userIds.forEach(userId => {
        expect(() => {
          trackTourStarted(userId);
        }).not.toThrow();
      });
    });

    it('should handle special characters in user ID', () => {
      expect(() => {
        trackTourStarted('user+tag@domain.com');
      }).not.toThrow();
    });
  });

  describe('trackTourCompleted', () => {
    it('should not throw for valid inputs', () => {
      expect(() => {
        trackTourCompleted('user123', 120);
      }).not.toThrow();
    });

    it('should handle zero completion time', () => {
      expect(() => {
        trackTourCompleted('user123', 0);
      }).not.toThrow();
    });

    it('should handle negative completion time', () => {
      expect(() => {
        trackTourCompleted('user123', -1);
      }).not.toThrow();
    });

    it('should handle large completion times', () => {
      expect(() => {
        trackTourCompleted('user123', 999999);
      }).not.toThrow();
    });

    it('should handle decimal completion times', () => {
      expect(() => {
        trackTourCompleted('user123', 123.456);
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackTourCompleted('', 120);
      }).not.toThrow();
    });
  });

  describe('trackTourSkipped', () => {
    it('should not throw for valid inputs', () => {
      expect(() => {
        trackTourSkipped('user123', 3);
      }).not.toThrow();
    });

    it('should handle step 0', () => {
      expect(() => {
        trackTourSkipped('user123', 0);
      }).not.toThrow();
    });

    it('should handle negative step numbers', () => {
      expect(() => {
        trackTourSkipped('user123', -1);
      }).not.toThrow();
    });

    it('should handle large step numbers', () => {
      expect(() => {
        trackTourSkipped('user123', 1000);
      }).not.toThrow();
    });

    it('should handle different user IDs', () => {
      const userIds = ['user1', 'admin@site.com', 'provider@service.io'];
      userIds.forEach(userId => {
        expect(() => {
          trackTourSkipped(userId, 5);
        }).not.toThrow();
      });
    });
  });

  describe('trackQuickActionUsed', () => {
    it('should not throw for valid action name and user ID', () => {
      expect(() => {
        trackQuickActionUsed('NewJob', 'user123');
      }).not.toThrow();
    });

    it('should handle different action names', () => {
      const actions = ['NewJob', 'SearchProviders', 'ViewMessages', 'EditProfile'];
      actions.forEach(action => {
        expect(() => {
          trackQuickActionUsed(action, 'user123');
        }).not.toThrow();
      });
    });

    it('should handle empty action name', () => {
      expect(() => {
        trackQuickActionUsed('', 'user123');
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackQuickActionUsed('NewJob', '');
      }).not.toThrow();
    });

    it('should handle special characters in action name', () => {
      expect(() => {
        trackQuickActionUsed('Create/New/Job', 'user123');
      }).not.toThrow();
    });
  });

  describe('trackDashboardEngagement', () => {
    it('should not throw for valid engagement metric', () => {
      expect(() => {
        trackDashboardEngagement('TimeSpent', 300, 'user123');
      }).not.toThrow();
    });

    it('should handle different metric types', () => {
      const metrics = ['TimeSpent', 'ClickCount', 'HoverCount', 'ScrollDepth'];
      metrics.forEach(metric => {
        expect(() => {
          trackDashboardEngagement(metric, 100, 'user123');
        }).not.toThrow();
      });
    });

    it('should handle zero value', () => {
      expect(() => {
        trackDashboardEngagement('TimeSpent', 0, 'user123');
      }).not.toThrow();
    });

    it('should handle negative value', () => {
      expect(() => {
        trackDashboardEngagement('TimeSpent', -10, 'user123');
      }).not.toThrow();
    });

    it('should handle large values', () => {
      expect(() => {
        trackDashboardEngagement('ClickCount', 100000, 'user123');
      }).not.toThrow();
    });

    it('should handle decimal values', () => {
      expect(() => {
        trackDashboardEngagement('TimeSpent', 123.456, 'user123');
      }).not.toThrow();
    });

    it('should handle empty metric name', () => {
      expect(() => {
        trackDashboardEngagement('', 100, 'user123');
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackDashboardEngagement('TimeSpent', 300, '');
      }).not.toThrow();
    });
  });

  describe('trackNotificationPermission', () => {
    it('should not throw for granted permission', () => {
      expect(() => {
        trackNotificationPermission('granted', 'user123');
      }).not.toThrow();
    });

    it('should not throw for denied permission', () => {
      expect(() => {
        trackNotificationPermission('denied', 'user123');
      }).not.toThrow();
    });

    it('should not throw for default permission', () => {
      expect(() => {
        trackNotificationPermission('default', 'user123');
      }).not.toThrow();
    });

    it('should handle different user IDs', () => {
      const userIds = ['user1', 'user2@domain.com', 'provider@service.io'];
      userIds.forEach(userId => {
        expect(() => {
          trackNotificationPermission('granted', userId);
        }).not.toThrow();
      });
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackNotificationPermission('granted', '');
      }).not.toThrow();
    });

    it('should handle empty permission', () => {
      expect(() => {
        trackNotificationPermission('', 'user123');
      }).not.toThrow();
    });
  });

  describe('trackNotificationReceived', () => {
    it('should not throw for valid notification type', () => {
      expect(() => {
        trackNotificationReceived('ProspectMessage', 'user123');
      }).not.toThrow();
    });

    it('should handle different notification types', () => {
      const types = ['NewJob', 'ProspectMessage', 'JobUpdate', 'ReviewRequest', 'PaymentConfirmed'];
      types.forEach(type => {
        expect(() => {
          trackNotificationReceived(type, 'user123');
        }).not.toThrow();
      });
    });

    it('should handle empty notification type', () => {
      expect(() => {
        trackNotificationReceived('', 'user123');
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackNotificationReceived('NewJob', '');
      }).not.toThrow();
    });

    it('should handle special characters in notification type', () => {
      expect(() => {
        trackNotificationReceived('Notification/Update/Alert', 'user123');
      }).not.toThrow();
    });
  });

  describe('trackNotificationClicked', () => {
    it('should not throw for valid notification type', () => {
      expect(() => {
        trackNotificationClicked('JobUpdate', 'user123');
      }).not.toThrow();
    });

    it('should handle different notification types', () => {
      const types = ['NewJob', 'ProspectMessage', 'JobUpdate', 'ReviewRequest'];
      types.forEach(type => {
        expect(() => {
          trackNotificationClicked(type, 'user123');
        }).not.toThrow();
      });
    });

    it('should handle empty notification type', () => {
      expect(() => {
        trackNotificationClicked('', 'user123');
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackNotificationClicked('NewJob', '');
      }).not.toThrow();
    });

    it('should handle different user ID formats', () => {
      const userIds = ['user1', 'email@domain.com', 'provider@service.io'];
      userIds.forEach(userId => {
        expect(() => {
          trackNotificationClicked('NewJob', userId);
        }).not.toThrow();
      });
    });
  });

  describe('trackReferralShare', () => {
    it('should not throw for valid platform', () => {
      expect(() => {
        trackReferralShare('whatsapp', 'user123');
      }).not.toThrow();
    });

    it('should handle different platforms', () => {
      const platforms = ['whatsapp', 'email', 'facebook', 'linkedin', 'twitter'];
      platforms.forEach(platform => {
        expect(() => {
          trackReferralShare(platform, 'user123');
        }).not.toThrow();
      });
    });

    it('should handle uppercase platform names', () => {
      expect(() => {
        trackReferralShare('WHATSAPP', 'user123');
      }).not.toThrow();
    });

    it('should handle empty platform', () => {
      expect(() => {
        trackReferralShare('', 'user123');
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackReferralShare('whatsapp', '');
      }).not.toThrow();
    });

    it('should handle special characters in platform', () => {
      expect(() => {
        trackReferralShare('platform/name', 'user123');
      }).not.toThrow();
    });
  });

  describe('trackTemplateUsed', () => {
    it('should not throw for valid template name', () => {
      expect(() => {
        trackTemplateUsed('QuickProposal', 'user123');
      }).not.toThrow();
    });

    it('should handle different template names', () => {
      const templates = ['QuickProposal', 'DetailedOffer', 'FollowUp', 'Discount', 'Premium'];
      templates.forEach(template => {
        expect(() => {
          trackTemplateUsed(template, 'user123');
        }).not.toThrow();
      });
    });

    it('should handle empty template name', () => {
      expect(() => {
        trackTemplateUsed('', 'user123');
      }).not.toThrow();
    });

    it('should handle empty user ID', () => {
      expect(() => {
        trackTemplateUsed('QuickProposal', '');
      }).not.toThrow();
    });

    it('should handle special characters in template name', () => {
      expect(() => {
        trackTemplateUsed('Template/Name/Special', 'user123');
      }).not.toThrow();
    });

    it('should handle numeric template names', () => {
      expect(() => {
        trackTemplateUsed('Template123', 'user123');
      }).not.toThrow();
    });
  });

  describe('Integration: Analytics tracking flow', () => {
    it('should handle complete user journey tracking', () => {
      expect(() => {
        // User views dashboard
        const pageTracker = trackPageView('Dashboard', 'user123');
        pageTracker();

        // User starts tour
        trackTourStarted('user123');

        // User completes tour
        trackTourCompleted('user123', 150);

        // User uses quick action
        trackQuickActionUsed('CreateJob', 'user123');

        // User engages with dashboard
        trackDashboardEngagement('TimeSpent', 450, 'user123');

        // User shares referral via WhatsApp
        trackReferralShare('whatsapp', 'user123');
      }).not.toThrow();
    });

    it('should handle notification flow', () => {
      expect(() => {
        // User grants notification permission
        trackNotificationPermission('granted', 'user123');

        // User receives notification
        trackNotificationReceived('NewJob', 'user123');

        // User clicks notification
        trackNotificationClicked('NewJob', 'user123');
      }).not.toThrow();
    });

    it('should handle template usage tracking', () => {
      expect(() => {
        trackTemplateUsed('QuickProposal', 'user123');
        trackTemplateUsed('DetailedOffer', 'user123');
        trackTemplateUsed('FollowUp', 'user123');
      }).not.toThrow();
    });

    it('should handle tour with skip tracking', () => {
      expect(() => {
        trackTourStarted('user123');
        trackTourSkipped('user123', 2);
      }).not.toThrow();
    });

    it('should be resilient to missing user context', () => {
      expect(() => {
        trackPageView('Dashboard', '');
        trackTourStarted('');
        trackQuickActionUsed('Action', '');
      }).not.toThrow();
    });

    it('should handle rapid consecutive tracking calls', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          trackPageView('Dashboard', `user${i}`);
          trackQuickActionUsed('Action', `user${i}`);
          trackDashboardEngagement('TimeSpent', i * 10, `user${i}`);
        }
      }).not.toThrow();
    });
  });
});
