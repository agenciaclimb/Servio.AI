import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProspectorDashboard from '../components/ProspectorDashboard';
import * as api from '../services/api';

// Mock API
vi.mock('../services/api', () => ({
  fetchProspectorStats: vi.fn(),
  fetchProspectorLeaderboard: vi.fn(),
  computeBadgeProgress: (recruits: number) => {
    const tiers = [
      { name: 'Bronze', min: 0 },
      { name: 'Prata', min: 5 },
      { name: 'Ouro', min: 10 },
      { name: 'Platina', min: 25 },
      { name: 'Diamante', min: 50 }
    ];
    let current = 'Bronze';
    let next: string | null = 'Prata';
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (recruits >= tiers[i].min) {
        current = tiers[i].name;
        next = tiers[i + 1] ? tiers[i + 1].name : null;
        break;
      }
    }
    const nextThreshold = next ? tiers.find(t => t.name === next)!.min : null;
    const currentBase = tiers.find(t => t.name === current)!.min;
    const progress = nextThreshold === null ? 100 : Math.min(100, Math.round(((recruits - currentBase) / (nextThreshold - currentBase)) * 100));
    return { currentBadge: current, nextBadge: next, progressToNextBadge: progress, tiers };
  }
}));

const TEST_USER_ID = 'prospector@test.com';

const createMockStats = (overrides: Partial<any> = {}) => ({
  prospectorId: TEST_USER_ID,
  totalRecruits: 0,
  activeRecruits: 0,
  totalCommissionsEarned: 0,
  pendingCommissions: 0,
  averageCommissionPerRecruit: 0,
  currentBadge: 'Bronze',
  nextBadge: 'Prata',
  progressToNextBadge: 0,
  badgeTiers: [
    { name: 'Bronze', min: 0 },
    { name: 'Prata', min: 5 },
    { name: 'Ouro', min: 10 },
    { name: 'Platina', min: 25 },
    { name: 'Diamante', min: 50 }
  ],
  ...overrides
});

describe('ProspectorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially', () => {
    vi.mocked(api.fetchProspectorStats).mockImplementation(() => new Promise(() => {}));
    vi.mocked(api.fetchProspectorLeaderboard).mockImplementation(() => new Promise(() => {}));
    
    render(<ProspectorDashboard userId="prospector@test.com" />);
    
    const loadingElements = screen.getAllByTestId(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('displays stats when data loads successfully', async () => {
    const mockStats = {
      prospectorId: TEST_USER_ID,
      totalRecruits: 12,
      activeRecruits: 8,
      totalCommissionsEarned: 850.50,
      pendingCommissions: 0,
      averageCommissionPerRecruit: 70.88,
      currentBadge: 'Ouro',
      nextBadge: 'Platina',
      progressToNextBadge: 13,
      badgeTiers: [
        { name: 'Bronze', min: 0 },
        { name: 'Prata', min: 5 },
        { name: 'Ouro', min: 10 },
        { name: 'Platina', min: 25 },
        { name: 'Diamante', min: 50 }
      ]
    };
    
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(mockStats);
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('850.50')).toBeInTheDocument();
    });
  });

  test('displays badge progression correctly', async () => {
    const mockStats = createMockStats({
      totalRecruits: 12,
      activeRecruits: 8,
      totalCommissionsEarned: 850.50,
      currentBadge: 'Ouro',
      nextBadge: 'Platina',
      progressToNextBadge: 13
    });
    
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(mockStats);
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText('Ouro')).toBeInTheDocument();
      expect(screen.getAllByText(/Platina/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Progresso: 13/)).toBeInTheDocument();
    });
  });

  test('renders leaderboard with ranking data', async () => {
    const mockLeaderboard = [
      { prospectorId: 'p1', name: 'Alice', totalRecruits: 25, totalCommissions: 1500, badge: 'Ouro', rank: 1 },
      { prospectorId: 'p2', name: 'Bob', totalRecruits: 18, totalCommissions: 1200, badge: 'Prata', rank: 2 },
      { prospectorId: 'prospector@test.com', name: 'Test Prospector', totalRecruits: 12, totalCommissions: 850, badge: 'Bronze', rank: 3 }
    ];
    
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(createMockStats({
      totalRecruits: 12,
      activeRecruits: 8,
      totalCommissionsEarned: 850,
      currentBadge: 'Bronze',
      nextBadge: 'Prata',
      progressToNextBadge: 50
    }));
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue(mockLeaderboard);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  test('displays empty leaderboard message when no data', async () => {
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(createMockStats());
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText('Sem dados ainda')).toBeInTheDocument();
    });
  });

  test('displays error message when fetch fails', async () => {
    vi.mocked(api.fetchProspectorStats).mockRejectedValue(new Error('Network error'));
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('highlights current user in leaderboard', async () => {
    const mockLeaderboard = [
      { prospectorId: 'p1', name: 'Alice', totalRecruits: 25, totalCommissions: 1500, badge: 'Ouro', rank: 1 },
      { prospectorId: 'prospector@test.com', name: 'Test Prospector', totalRecruits: 12, totalCommissions: 850, badge: 'Bronze', rank: 2 }
    ];
    
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(createMockStats({
      totalRecruits: 12,
      activeRecruits: 8,
      totalCommissionsEarned: 850,
      currentBadge: 'Bronze',
      nextBadge: 'Prata',
      progressToNextBadge: 50
    }));
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue(mockLeaderboard);
    
    const { container } = render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      const highlightedRow = container.querySelector('.bg-indigo-50');
      expect(highlightedRow).toBeInTheDocument();
    });
  });

  test('displays all badge tiers correctly', async () => {
    const badges = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
    
    for (const badge of badges) {
      vi.mocked(api.fetchProspectorStats).mockResolvedValue(createMockStats({
        currentBadge: badge,
        nextBadge: badge === 'Diamante' ? null : 'Prata',
        progressToNextBadge: 0
      }));
      vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
      
      const { unmount } = render(<ProspectorDashboard userId={TEST_USER_ID} />);
      
      await waitFor(() => {
        expect(screen.getByText(badge)).toBeInTheDocument();
      });
      
      unmount();
    }
  });

  test('formats currency correctly', async () => {
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(createMockStats({
      totalRecruits: 5,
      activeRecruits: 3,
      totalCommissionsEarned: 1234.56,
      currentBadge: 'Bronze',
      nextBadge: 'Prata',
      progressToNextBadge: 50
    }));
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText('1234.56')).toBeInTheDocument();
    });
  });

  test('displays quick tips section', async () => {
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(createMockStats());
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId={TEST_USER_ID} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dicas Rápidas/i)).toBeInTheDocument();
    });
  });
});
