import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReferralLinkGenerator from '../../src/components/ReferralLinkGenerator';

// Mock the referral link service
vi.mock('../../src/services/referralLinkService', () => ({
  generateReferralLink: vi.fn(),
  getReferralLink: vi.fn(),
  getLinkAnalytics: vi.fn(),
  generateQRCodeUrl: vi.fn(),
  generateShareUrls: vi.fn(),
}));

describe('ReferralLinkGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    const { getReferralLink } = await import('../../src/services/referralLinkService');
    vi.mocked(getReferralLink).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    );

    render(<ReferralLinkGenerator prospectorId="test-prospector" />);

    expect(screen.getByText(/Carregando link de indicação/i)).toBeInTheDocument();
  });

  it('shows error state when loading fails', async () => {
    const { getReferralLink, generateReferralLink } = await import(
      '../../src/services/referralLinkService'
    );
    vi.mocked(getReferralLink).mockResolvedValue(null);
    vi.mocked(generateReferralLink).mockRejectedValue(new Error('Network error'));

    render(<ReferralLinkGenerator prospectorId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('displays referral link when loaded', async () => {
    const mockLink = {
      prospectorId: 'test-prospector',
      prospectorName: 'Test User',
      fullUrl: 'https://servio.ai/ref/test123',
      shortCode: 'test123',
      shortUrl: 'https://servio.link/test123',
      utmParams: {
        source: 'prospector',
        medium: 'referral',
        campaign: 'phase1',
      },
      clicks: 100,
      conversions: 10,
      createdAt: new Date(),
    };

    const mockAnalytics = {
      totalClicks: 100,
      uniqueClicks: 80,
      conversions: 10,
      conversionRate: 12.5,
      clicksByDay: [],
      clicksBySource: [],
      topPerformingLinks: [],
    };

    const { getReferralLink, getLinkAnalytics } = await import(
      '../../src/services/referralLinkService'
    );
    vi.mocked(getReferralLink).mockResolvedValue(mockLink);
    vi.mocked(getLinkAnalytics).mockResolvedValue(mockAnalytics);

    render(<ReferralLinkGenerator prospectorId="test-prospector" />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    });
  });

  it('calls onLinkGenerated callback when link is loaded', async () => {
    const mockLink = {
      prospectorId: 'test-prospector',
      prospectorName: 'Test User',
      fullUrl: 'https://servio.ai/ref/abc123',
      shortCode: 'abc123',
      shortUrl: 'https://servio.link/abc123',
      utmParams: {
        source: 'prospector',
        medium: 'referral',
        campaign: 'phase1',
      },
      clicks: 50,
      conversions: 5,
      createdAt: new Date(),
    };

    const onLinkGenerated = vi.fn();

    const { getReferralLink, getLinkAnalytics } = await import(
      '../../src/services/referralLinkService'
    );
    vi.mocked(getReferralLink).mockResolvedValue(mockLink);
    vi.mocked(getLinkAnalytics).mockResolvedValue({
      totalClicks: 50,
      uniqueClicks: 40,
      conversions: 5,
      conversionRate: 10,
      clicksByDay: [],
      clicksBySource: [],
      topPerformingLinks: [],
    });

    render(
      <ReferralLinkGenerator prospectorId="test-prospector" onLinkGenerated={onLinkGenerated} />
    );

    await waitFor(() => {
      expect(onLinkGenerated).toHaveBeenCalledWith('https://servio.ai/ref/abc123');
    });
  });

  it('generates new link when none exists', async () => {
    const mockNewLink = {
      prospectorId: 'new-prospector',
      prospectorName: 'Prospector',
      fullUrl: 'https://servio.ai/ref/new123',
      shortCode: 'new123',
      shortUrl: 'https://servio.link/new123',
      utmParams: {
        source: 'prospector',
        medium: 'referral',
        campaign: 'phase1',
      },
      clicks: 0,
      conversions: 0,
      createdAt: new Date(),
    };

    const { getReferralLink, generateReferralLink, getLinkAnalytics } = await import(
      '../../src/services/referralLinkService'
    );
    vi.mocked(getReferralLink).mockResolvedValue(null);
    vi.mocked(generateReferralLink).mockResolvedValue(mockNewLink);
    vi.mocked(getLinkAnalytics).mockResolvedValue({
      totalClicks: 0,
      uniqueClicks: 0,
      conversions: 0,
      conversionRate: 0,
      clicksByDay: [],
      clicksBySource: [],
      topPerformingLinks: [],
    });

    render(<ReferralLinkGenerator prospectorId="new-prospector" />);

    await waitFor(() => {
      expect(generateReferralLink).toHaveBeenCalledWith('new-prospector', 'Prospector');
    });
  });

  it('does not load when prospectorId is empty', async () => {
    const { getReferralLink } = await import('../../src/services/referralLinkService');

    render(<ReferralLinkGenerator prospectorId="" />);

    // Should not call the service with empty ID
    expect(getReferralLink).not.toHaveBeenCalled();
  });
});
