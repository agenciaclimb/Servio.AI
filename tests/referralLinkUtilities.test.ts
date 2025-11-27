/**
 * Tests for Referral Link Service Utility Functions
 * Pure functions with no external dependencies
 */

import { describe, it, expect } from 'vitest';
import {
  generateQRCodeUrl,
  generateShareUrls,
} from '../src/services/referralLinkService';

describe('referralLinkService utility functions', () => {
  describe('generateQRCodeUrl', () => {
    it('should generate valid QR code URL', () => {
      const url = 'https://servio.ai/ref/abc123';
      const qrUrl = generateQRCodeUrl(url);

      expect(qrUrl).toContain('https://api.qrserver.com');
      expect(qrUrl).toContain('size=300x300');
      expect(qrUrl).toContain(encodeURIComponent(url));
    });

    it('should use default size of 300 when not specified', () => {
      const url = 'https://servio.ai/ref/test';
      const qrUrl = generateQRCodeUrl(url);

      expect(qrUrl).toContain('size=300x300');
    });

    it('should use custom size when provided', () => {
      const url = 'https://servio.ai/ref/test';
      const customSize = 500;
      const qrUrl = generateQRCodeUrl(url, customSize);

      expect(qrUrl).toContain(`size=${customSize}x${customSize}`);
    });

    it('should encode URL properly', () => {
      const url = 'https://servio.ai/ref/abc123?token=xyz&ref=test';
      const qrUrl = generateQRCodeUrl(url);

      expect(qrUrl).toContain(encodeURIComponent(url));
      expect(qrUrl).not.toContain('?token=');
    });

    it('should encode special characters', () => {
      const url = 'https://servio.ai/ref/test%20space&special=chars';
      const qrUrl = generateQRCodeUrl(url);

      expect(typeof qrUrl).toBe('string');
      expect(qrUrl.length).toBeGreaterThan(0);
    });

    it('should return different URLs for different inputs', () => {
      const url1 = 'https://servio.ai/ref/abc123';
      const url2 = 'https://servio.ai/ref/xyz789';

      const qrUrl1 = generateQRCodeUrl(url1);
      const qrUrl2 = generateQRCodeUrl(url2);

      expect(qrUrl1).not.toBe(qrUrl2);
    });

    it('should handle empty URL', () => {
      const qrUrl = generateQRCodeUrl('');
      expect(qrUrl).toContain('https://api.qrserver.com');
    });

    it('should include create-qr-code endpoint', () => {
      const url = 'https://servio.ai/test';
      const qrUrl = generateQRCodeUrl(url);

      expect(qrUrl).toContain('v1/create-qr-code');
    });

    it('should return consistent results for same input', () => {
      const url = 'https://servio.ai/ref/consistent';
      const qrUrl1 = generateQRCodeUrl(url);
      const qrUrl2 = generateQRCodeUrl(url);

      expect(qrUrl1).toBe(qrUrl2);
    });
  });

  describe('generateShareUrls', () => {
    const referralUrl = 'https://servio.ai/ref/abc123';
    const message = 'Confira a Servio.AI';

    it('should return object with all social platforms', () => {
      const shareUrls = generateShareUrls(referralUrl, message);

      expect(shareUrls).toHaveProperty('facebook');
      expect(shareUrls).toHaveProperty('twitter');
      expect(shareUrls).toHaveProperty('linkedin');
      expect(shareUrls).toHaveProperty('whatsapp');
      expect(shareUrls).toHaveProperty('telegram');
    });

    it('should include referral URL in all shares', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const encodedUrl = encodeURIComponent(referralUrl);

      expect(shareUrls.facebook).toContain(encodedUrl);
      expect(shareUrls.twitter).toContain(encodedUrl);
      expect(shareUrls.linkedin).toContain(encodedUrl);
      expect(shareUrls.whatsapp).toContain(encodedUrl);
      expect(shareUrls.telegram).toContain(encodedUrl);
    });

    it('should generate valid Facebook share URL', () => {
      const shareUrls = generateShareUrls(referralUrl, message);

      expect(shareUrls.facebook).toContain('https://www.facebook.com/sharer/sharer.php');
      expect(shareUrls.facebook).toContain('?u=');
    });

    it('should generate valid Twitter share URL', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const encodedMessage = encodeURIComponent(message);

      expect(shareUrls.twitter).toContain('https://twitter.com/intent/tweet');
      expect(shareUrls.twitter).toContain('?text=');
      expect(shareUrls.twitter).toContain(encodedMessage);
    });

    it('should generate valid LinkedIn share URL', () => {
      const shareUrls = generateShareUrls(referralUrl, message);

      expect(shareUrls.linkedin).toContain('https://www.linkedin.com/sharing/share-offsite');
      expect(shareUrls.linkedin).toContain('?url=');
    });

    it('should generate valid WhatsApp share URL', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const encodedMessage = encodeURIComponent(message);

      expect(shareUrls.whatsapp).toContain('https://wa.me/');
      expect(shareUrls.whatsapp).toContain('?text=');
      expect(shareUrls.whatsapp).toContain(encodedMessage);
    });

    it('should generate valid Telegram share URL', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const encodedMessage = encodeURIComponent(message);

      expect(shareUrls.telegram).toContain('https://t.me/share/url');
      expect(shareUrls.telegram).toContain('?url=');
      expect(shareUrls.telegram).toContain(encodedMessage);
    });

    it('should handle URLs with special characters', () => {
      const specialUrl = 'https://servio.ai/ref/test?token=abc&ref=123';
      const shareUrls = generateShareUrls(specialUrl, message);

      Object.values(shareUrls).forEach(url => {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
        expect(url).toContain('https');
      });
    });

    it('should handle messages with special characters', () => {
      const specialMessage = 'Olá! Confira 50% OFF & exclusivo!';
      const shareUrls = generateShareUrls(referralUrl, specialMessage);

      Object.values(shareUrls).forEach(url => {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty message', () => {
      const shareUrls = generateShareUrls(referralUrl, '');

      Object.values(shareUrls).forEach(url => {
        expect(url).toContain(encodeURIComponent(referralUrl));
      });
    });

    it('should handle empty URL', () => {
      const shareUrls = generateShareUrls('', message);

      Object.values(shareUrls).forEach(url => {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      });
    });

    it('should return different URLs for different inputs', () => {
      const urls1 = generateShareUrls('https://servio.ai/ref/abc', 'Message 1');
      const urls2 = generateShareUrls('https://servio.ai/ref/xyz', 'Message 2');

      expect(urls1.facebook).not.toBe(urls2.facebook);
      expect(urls1.twitter).not.toBe(urls2.twitter);
    });

    it('should return consistent results for same input', () => {
      const urls1 = generateShareUrls(referralUrl, message);
      const urls2 = generateShareUrls(referralUrl, message);

      expect(urls1.facebook).toBe(urls2.facebook);
      expect(urls1.twitter).toBe(urls2.twitter);
      expect(urls1.linkedin).toBe(urls2.linkedin);
      expect(urls1.whatsapp).toBe(urls2.whatsapp);
      expect(urls1.telegram).toBe(urls2.telegram);
    });

    it('should encode message for Twitter with text parameter', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const encodedMessage = encodeURIComponent(message);

      expect(shareUrls.twitter).toContain(`text=${encodedMessage}`);
    });

    it('should include URL in Twitter share', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const encodedUrl = encodeURIComponent(referralUrl);

      expect(shareUrls.twitter).toContain(`&url=${encodedUrl}`);
    });

    it('should handle Portuguese characters in message', () => {
      const portugueseMsg = 'Confira a plataforma com prestadores de São Paulo!';
      const shareUrls = generateShareUrls(referralUrl, portugueseMsg);

      Object.values(shareUrls).forEach(url => {
        expect(url).toContain(encodeURIComponent(portugueseMsg));
      });
    });

    it('should handle emoji in message', () => {
      const emojiMsg = 'Confira 🚀 Servio.AI 💰';
      const shareUrls = generateShareUrls(referralUrl, emojiMsg);

      Object.values(shareUrls).forEach(url => {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      });
    });

    it('should have all platforms accessible', () => {
      const shareUrls = generateShareUrls(referralUrl, message);
      const platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram'];

      platforms.forEach(platform => {
        expect(shareUrls).toHaveProperty(platform);
        expect(typeof shareUrls[platform as keyof typeof shareUrls]).toBe('string');
        expect(shareUrls[platform as keyof typeof shareUrls].length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration: QR Code and Share URLs', () => {
    it('should generate QR code and share URLs for same link', () => {
      const referralUrl = 'https://servio.ai/ref/integration-test';
      const message = 'Test message';

      const qrUrl = generateQRCodeUrl(referralUrl);
      const shareUrls = generateShareUrls(referralUrl, message);

      expect(qrUrl).toContain('api.qrserver.com');
      expect(shareUrls.facebook).toContain('facebook.com');
      expect(shareUrls.twitter).toContain('twitter.com');
    });

    it('should handle referral URL with different sizes', () => {
      const referralUrl = 'https://servio.ai/ref/test';
      const sizes = [200, 300, 500, 1000];

      sizes.forEach(size => {
        const qrUrl = generateQRCodeUrl(referralUrl, size);
        expect(qrUrl).toContain(`size=${size}x${size}`);
      });
    });
  });
});
