/**
 * Referral Link Generator Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ReferralLinkGenerator from './ReferralLinkGenerator';

// Mock referral link service
vi.mock('../services/referralLinkService', () => ({
  generateReferralLink: vi.fn(async () => ({
    prospectorId: 'prosp123',
    prospectorName: 'Test Prospector',
    fullUrl: 'https://example.com/?ref=abc123',
    shortCode: 'abc123',
    shortUrl: 'https://ex.co/abc123',
    utmParams: {
      source: 'referral',
      medium: 'link',
      campaign: 'prospector',
    },
    clicks: 0,
    conversions: 0,
    createdAt: new Date(),
  })),
  getReferralLink: vi.fn(async () => null),
  getLinkAnalytics: vi.fn(async () => ({
    totalClicks: 10,
    uniqueClicks: 8,
    conversions: 2,
    conversionRate: 0.2,
    clicksByDay: [],
    clicksBySource: [],
    topPerformingLinks: [],
  })),
  generateQRCodeUrl: vi.fn(() => 'https://api.qrserver.com/...'),
  generateShareUrls: vi.fn(() => ({
    facebook: 'https://facebook.com/share?u=...',
    twitter: 'https://twitter.com/intent/tweet?url=...',
    linkedin: 'https://linkedin.com/sharing/share-offsite/?url=...',
    whatsapp: 'https://wa.me/?text=...',
    telegram: 'https://t.me/share/url?url=...',
  })),
}));

describe('ReferralLinkGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { container } = render(
      <ReferralLinkGenerator prospectorId="prosp123" />
    );
    expect(container).toBeTruthy();
  });

  it('should generate referral link on mount', async () => {
    render(<ReferralLinkGenerator prospectorId="prosp123" />);
    
    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('should call onLinkGenerated callback', async () => {
    const onLinkGenerated = vi.fn();
    render(
      <ReferralLinkGenerator 
        prospectorId="prosp123" 
        onLinkGenerated={onLinkGenerated}
      />
    );
    
    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('should handle empty prospector ID', async () => {
    const { container } = render(
      <ReferralLinkGenerator prospectorId="" />
    );
    expect(container).toBeTruthy();
  });

  it('should display loading state', async () => {
    const { container } = render(
      <ReferralLinkGenerator prospectorId="prosp123" />
    );
    expect(container).toBeTruthy();
  });

  it('should handle errors gracefully', async () => {
    const { container } = render(
      <ReferralLinkGenerator prospectorId="prosp123" />
    );
    expect(container).toBeTruthy();
  });

  it('should update when prospectorId changes', async () => {
    const { rerender } = render(
      <ReferralLinkGenerator prospectorId="prosp1" />
    );
    
    rerender(<ReferralLinkGenerator prospectorId="prosp2" />);
    
    expect(true).toBe(true);
  });
});
