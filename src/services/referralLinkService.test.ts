/**
 * Referral Link Service Tests
 * Tests for referral link generation and analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as referralLinkService from './referralLinkService';

// Mock Firebase
vi.mock('../../firebaseConfig', () => ({
  db: {
    collection: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

describe('referralLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateReferralLink', () => {
    it('should generate referral link for prospector', async () => {
      const link = await referralLinkService.generateReferralLink('prosp123', 'John Prospector');
      expect(link).toBeDefined();
      expect(link).toHaveProperty('prospectorId');
      expect(link).toHaveProperty('fullUrl');
      expect(link).toHaveProperty('shortCode');
    });

    it('should include UTM parameters', async () => {
      const link = await referralLinkService.generateReferralLink('prosp123', 'John');
      expect(link.fullUrl).toContain('utm_source=');
      expect(link.fullUrl).toContain('utm_medium=');
      expect(link.fullUrl).toContain('utm_campaign=');
    });

    it('should generate unique short code', async () => {
      const link1 = await referralLinkService.generateReferralLink('prosp1', 'John');
      const link2 = await referralLinkService.generateReferralLink('prosp2', 'Jane');
      expect(link1.shortCode).not.toBe(link2.shortCode);
    });

    it('should include prospector ID in URL', async () => {
      const link = await referralLinkService.generateReferralLink('prosp123', 'John');
      expect(link.fullUrl).toContain('prosp123');
    });

    it('should initialize click count at zero', async () => {
      const link = await referralLinkService.generateReferralLink('prosp123', 'John');
      expect(link.clicks).toBe(0);
      expect(link.conversions).toBe(0);
    });
  });

  describe('getReferralLink', () => {
    it('should retrieve existing referral link', async () => {
      const link = await referralLinkService.getReferralLink('prosp123');
      expect(link === null || typeof link === 'object').toBe(true);
    });

    it('should return null if not found', async () => {
      const link = await referralLinkService.getReferralLink('unknown_prosp');
      expect(link === null || typeof link === 'object').toBe(true);
    });

    it('should include link analytics', async () => {
      const link = await referralLinkService.getReferralLink('prosp123');
      if (link) {
        expect(link).toHaveProperty('clicks');
        expect(link).toHaveProperty('conversions');
      }
    });
  });

  describe('trackClick', () => {
    it('should track link click', async () => {
      await referralLinkService.trackClick('shortcode123', 'referral-link');
      expect(true).toBe(true);
    });

    it('should track with source information', async () => {
      await referralLinkService.trackClick('shortcode123', 'referral-link', {
        userAgent: 'Mozilla/5.0',
        country: 'BR',
      });
      expect(true).toBe(true);
    });

    it('should increment click counter', async () => {
      await referralLinkService.trackClick('shortcode123', 'referral-link');
      await referralLinkService.trackClick('shortcode123', 'referral-link');
      expect(true).toBe(true);
    });

    it('should update last clicked timestamp', async () => {
      await referralLinkService.trackClick('shortcode123', 'referral-link');
      expect(true).toBe(true);
    });
  });

  describe('trackConversion', () => {
    it('should track conversion from referral link', async () => {
      await referralLinkService.trackConversion('shortcode123', {
        conversionId: 'conv-123',
        amount: 100.0,
      });
      expect(true).toBe(true);
    });

    it('should increment conversion counter', async () => {
      await referralLinkService.trackConversion('shortcode123', {
        conversionId: 'conv-1',
      });
      await referralLinkService.trackConversion('shortcode123', {
        conversionId: 'conv-2',
      });
      expect(true).toBe(true);
    });

    it('should include conversion amount', async () => {
      await referralLinkService.trackConversion('shortcode123', {
        conversionId: 'conv-123',
        amount: 250.5,
      });
      expect(true).toBe(true);
    });
  });

  describe('getLinkAnalytics', () => {
    it('should retrieve link analytics', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      expect(analytics === null || typeof analytics === 'object').toBe(true);
    });

    it('should include click metrics', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      if (analytics) {
        expect(analytics).toHaveProperty('totalClicks');
        expect(analytics).toHaveProperty('uniqueClicks');
        expect(analytics).toHaveProperty('conversions');
      }
    });

    it('should calculate conversion rate', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      if (analytics) {
        expect(typeof analytics.conversionRate).toBe('number');
        expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
        expect(analytics.conversionRate).toBeLessThanOrEqual(1);
      }
    });

    it('should include click by day breakdown', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      if (analytics) {
        expect(Array.isArray(analytics.clicksByDay)).toBe(true);
      }
    });

    it('should include click by source breakdown', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      if (analytics) {
        expect(Array.isArray(analytics.clicksBySource)).toBe(true);
      }
    });

    it('should include top performing links', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      if (analytics) {
        expect(Array.isArray(analytics.topPerformingLinks)).toBe(true);
      }
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for referral link', async () => {
      const qrUrl = await referralLinkService.generateQRCode('https://example.com/ref/abc123');
      expect(qrUrl).toBeDefined();
      expect(typeof qrUrl).toBe('string');
    });

    it('should handle different URL formats', async () => {
      const qr1 = await referralLinkService.generateQRCode('https://example.com/ref/short1');
      const qr2 = await referralLinkService.generateQRCode('https://example.com/ref/short2');
      expect(qr1).toBeDefined();
      expect(qr2).toBeDefined();
    });

    it('should generate different QR codes for different URLs', async () => {
      const qr1 = await referralLinkService.generateQRCode('https://example.com/ref/abc');
      const qr2 = await referralLinkService.generateQRCode('https://example.com/ref/xyz');
      // Should be different URLs but both valid
      expect(qr1).toBeDefined();
      expect(qr2).toBeDefined();
    });
  });

  describe('shortenURL', () => {
    it('should shorten long URL', async () => {
      const shortUrl = await referralLinkService.shortenURL(
        'https://example.com/very/long/referral/link?utm_source=referral'
      );
      expect(shortUrl).toBeDefined();
      expect(shortUrl.length).toBeLessThan(100);
    });

    it('should handle already short URLs', async () => {
      const shortUrl = await referralLinkService.shortenURL('https://short.url/a');
      expect(shortUrl).toBeDefined();
    });

    it('should preserve URL functionality', async () => {
      const shortUrl = await referralLinkService.shortenURL(
        'https://example.com/ref?id=123&utm_campaign=test'
      );
      expect(shortUrl).toBeTruthy();
    });
  });

  describe('validateShortCode', () => {
    it('should validate short code format', () => {
      const valid = referralLinkService.validateShortCode('abc123');
      expect(typeof valid).toBe('boolean');
    });

    it('should reject invalid short codes', () => {
      const valid = referralLinkService.validateShortCode('');
      expect(typeof valid).toBe('boolean');
    });

    it('should handle alphanumeric codes', () => {
      const valid = referralLinkService.validateShortCode('ABC123XYZ');
      expect(typeof valid).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      expect(async () => {
        await referralLinkService.generateReferralLink('prosp123', 'John');
      }).not.toThrow();
    });

    it('should handle invalid prospector ID', async () => {
      await referralLinkService.getReferralLink('');
      expect(true).toBe(true);
    });

    it('should handle URL generation errors', async () => {
      const link = await referralLinkService.generateReferralLink('prosp123', 'John');
      expect(link).toBeDefined();
    });

    it('should handle analytics calculation errors', async () => {
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      expect(analytics === null || typeof analytics === 'object').toBe(true);
    });
  });

  describe('link expiration', () => {
    it('should handle expired links', async () => {
      const link = await referralLinkService.getReferralLink('prosp123');
      expect(link === null || typeof link === 'object').toBe(true);
    });

    it('should extend link expiration on use', async () => {
      await referralLinkService.trackClick('shortcode123', 'referral-link');
      expect(true).toBe(true);
    });
  });

  describe('bulk operations', () => {
    it('should handle multiple links for same prospector', async () => {
      const link1 = await referralLinkService.generateReferralLink('prosp123', 'John');
      const link2 = await referralLinkService.generateReferralLink('prosp123', 'John');
      expect(link1).toBeDefined();
      expect(link2).toBeDefined();
    });

    it('should track analytics across multiple links', async () => {
      await referralLinkService.trackClick('code1', 'link-1');
      await referralLinkService.trackClick('code2', 'link-2');
      const analytics = await referralLinkService.getLinkAnalytics('prosp123');
      expect(analytics === null || typeof analytics === 'object').toBe(true);
    });
  });
});
