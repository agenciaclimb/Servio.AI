import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProspectorStatistics from '../../components/ProspectorStatistics';

// Mock hooks and dependencies
vi.mock('../../hooks/useProspectorStats', () => ({
  useProspectorStats: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  computeBadgeProgress: () => ({
    currentBadge: 'Bronze',
    nextBadge: 'Silver',
    progressToNextBadge: 25,
    tiers: [],
  }),
}));

vi.mock('../../components/skeletons/ProspectorDashboardSkeleton', () => ({
  default: () => <div data-testid="skeleton">Loading...</div>,
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('ProspectorStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when loading', async () => {
    const { useProspectorStats } = await import('../../hooks/useProspectorStats');
    vi.mocked(useProspectorStats).mockReturnValue({
      stats: null,
      leaderboard: [],
      loading: true,
      error: null,
    });

    render(<ProspectorStatistics prospectorId="test123" />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error message when error occurs', async () => {
    const { useProspectorStats } = await import('../../hooks/useProspectorStats');
    vi.mocked(useProspectorStats).mockReturnValue({
      stats: null,
      leaderboard: [],
      loading: false,
      error: 'Failed to load statistics',
    });

    render(<ProspectorStatistics prospectorId="test123" />);

    expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
  });

  it('displays stats cards when data loaded', async () => {
    const { useProspectorStats } = await import('../../hooks/useProspectorStats');
    vi.mocked(useProspectorStats).mockReturnValue({
      stats: {
        activeRecruits: 10,
        totalRecruits: 25,
        totalCommissionsEarned: 1500.5,
        averageCommissionPerRecruit: 60.02,
        currentBadge: 'Silver',
        nextBadge: 'Gold',
        progressToNextBadge: 45,
        badgeTiers: [],
        pendingCommissions: 200,
        referralLinkClicks: 100,
        totalJobsCompleted: 50,
        linkClicks: 100,
        conversions: 25,
        conversionRate: 25,
        pendingRecruits: 3,
      },
      leaderboard: [],
      loading: false,
      error: null,
    });

    render(<ProspectorStatistics prospectorId="test123" />);

    expect(screen.getByText('Recrutas Ativos')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total Recrutas')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    // Check that commission labels exist (may have multiple)
    expect(screen.getAllByText(/Comissões/i).length).toBeGreaterThan(0);
    expect(screen.getByText('1500.50')).toBeInTheDocument();
  });

  it('displays average commission', async () => {
    const { useProspectorStats } = await import('../../hooks/useProspectorStats');
    vi.mocked(useProspectorStats).mockReturnValue({
      stats: {
        activeRecruits: 5,
        totalRecruits: 10,
        totalCommissionsEarned: 500,
        averageCommissionPerRecruit: 50,
        currentBadge: 'Bronze',
        nextBadge: 'Silver',
        progressToNextBadge: 30,
        badgeTiers: [],
        pendingCommissions: 100,
        referralLinkClicks: 50,
        totalJobsCompleted: 20,
        linkClicks: 50,
        conversions: 10,
        conversionRate: 20,
        pendingRecruits: 2,
      },
      leaderboard: [],
      loading: false,
      error: null,
    });

    render(<ProspectorStatistics prospectorId="test123" />);

    expect(screen.getByText('Média Comissão')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
  });

  it('handles zero stats gracefully', async () => {
    const { useProspectorStats } = await import('../../hooks/useProspectorStats');
    vi.mocked(useProspectorStats).mockReturnValue({
      stats: {
        activeRecruits: 0,
        totalRecruits: 0,
        totalCommissionsEarned: 0,
        averageCommissionPerRecruit: 0,
        currentBadge: 'Iniciante',
        nextBadge: 'Bronze',
        progressToNextBadge: 0,
        badgeTiers: [],
        pendingCommissions: 0,
        referralLinkClicks: 0,
        totalJobsCompleted: 0,
        linkClicks: 0,
        conversions: 0,
        conversionRate: 0,
        pendingRecruits: 0,
      },
      leaderboard: [],
      loading: false,
      error: null,
    });

    render(<ProspectorStatistics prospectorId="test123" />);

    // Should show 0 values
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0);
  });

  it('calls useProspectorStats with correct prospectorId', async () => {
    const { useProspectorStats } = await import('../../hooks/useProspectorStats');
    vi.mocked(useProspectorStats).mockReturnValue({
      stats: null,
      leaderboard: [],
      loading: true,
      error: null,
    });

    render(<ProspectorStatistics prospectorId="specific-id-123" />);

    expect(useProspectorStats).toHaveBeenCalledWith('specific-id-123');
  });
});
