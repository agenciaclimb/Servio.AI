import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProspectorDashboard from '../components/ProspectorDashboard';
import * as api from '../services/api';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => {
  const unsub = vi.fn();
  return {
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ 
      docs: [],
      empty: true,
      size: 0
    })),
    getDoc: vi.fn(() => Promise.resolve({ 
      exists: () => false,
      data: () => ({})
    })),
    doc: vi.fn(),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn(() => unsub),
    runTransaction: vi.fn((_, updater) => Promise.resolve(typeof updater === 'function' ? updater({}) : undefined)),
    Timestamp: {
      now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
      fromDate: vi.fn(date => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
    },
  };
});

// Mock firebaseConfig (necessário para ProspectorDashboard)
vi.mock('../firebaseConfig', () => ({
  db: {},
  auth: { currentUser: null },
  storage: {},
}));

// Mock dos serviços
vi.mock('../services/api', () => ({
  fetchProspectorStats: vi.fn(),
  fetchProspectorLeaderboard: vi.fn(),
  computeBadgeProgress: vi.fn(() => ({
    currentBadge: 'Bronze',
    nextBadge: 'Prata',
    progressToNextBadge: 25,
    tiers: [
      { name: 'Bronze', min: 0 },
      { name: 'Prata', min: 5 },
      { name: 'Ouro', min: 15 }
    ]
  }))
}));

// Mock dos componentes internos
vi.mock('../src/components/ReferralLinkGenerator', () => ({
  default: ({ onLinkGenerated }: any) => {
    // Simula geração de link
    setTimeout(() => onLinkGenerated('https://servio-ai.com/invite/test123'), 0);
    return <div data-testid="referral-generator">Referral Link Generator</div>;
  }
}));

vi.mock('../src/components/MessageTemplateSelector', () => ({
  default: () => <div data-testid="template-selector">Template Selector</div>
}));

vi.mock('../src/components/NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings">Notification Settings</div>
}));

vi.mock('../src/components/ProspectorOnboarding', () => ({
  default: () => <div data-testid="onboarding-tour">Onboarding Tour</div>
}));

vi.mock('../src/components/ProspectorQuickActions', () => ({
  default: () => <div data-testid="quick-actions">Quick Actions</div>
}));

// Mock Smart Actions service to ensure actions render (prevents timeout)
vi.mock('../src/services/smartActionsService', () => ({
  generateSmartActions: vi.fn().mockResolvedValue([
    { id: 'a1', title: 'Compartilhar no WhatsApp', description: 'Envie seu link para grupos locais', icon: '💬' },
    { id: 'a2', title: 'Contatar recrutados inativos', description: 'Reative interessados que não completaram cadastro', icon: '📣' },
  ])
}));

describe('ProspectorDashboard - Unified Layout', () => {
  const mockStats = {
    prospectorId: 'test-prospector',
    totalRecruits: 12,
    activeRecruits: 10,
    totalCommissionsEarned: 2450.75,
    pendingCommissions: 320.0,
    averageCommissionPerRecruit: 204.23,
    currentBadge: 'Ouro',
    nextBadge: 'Platina',
    progressToNextBadge: 75,
    badgeTiers: [
      { name: 'Bronze', min: 0 },
      { name: 'Prata', min: 5 },
      { name: 'Ouro', min: 15 },
      { name: 'Platina', min: 30 }
    ]
  };

  const mockLeaderboard = [
    { prospectorId: 'p1', name: 'João Silva', rank: 1, totalRecruits: 50, totalCommissionsEarned: 10000 },
    { prospectorId: 'test-prospector', name: 'User Test', rank: 2, totalRecruits: 12, totalCommissionsEarned: 2450 },
    { prospectorId: 'p3', name: 'Maria Santos', rank: 3, totalRecruits: 8, totalCommissionsEarned: 1500 },
    { prospectorId: 'p4', name: 'Pedro Costa', rank: 4, totalRecruits: 6, totalCommissionsEarned: 1200 },
    { prospectorId: 'p5', name: 'Ana Lima', rank: 5, totalRecruits: 5, totalCommissionsEarned: 1000 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.fetchProspectorStats as any).mockResolvedValue(mockStats);
    (api.fetchProspectorLeaderboard as any).mockResolvedValue(mockLeaderboard);
  });

  // Legacy unified layout tests removed – dashboard now uses tab navigation.

  it('should display loading state initially dentro da aba Estatísticas', async () => {
    (api.fetchProspectorStats as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    const user = userEvent.setup();
    render(<ProspectorDashboard userId="test-prospector" />);

    const statsTab = screen.getByRole('button', { name: /estatísticas/i });
    await user.click(statsTab);

    expect(screen.getByTestId('loading-active')).toBeInTheDocument();
    expect(screen.getByTestId('loading-total')).toBeInTheDocument();
    expect(screen.getByTestId('loading-commissions')).toBeInTheDocument();
    expect(screen.getByTestId('loading-average')).toBeInTheDocument();
  });

  it('should display error message when API fails', async () => {
    (api.fetchProspectorStats as any).mockRejectedValue(new Error('API Error'));
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

    // Grid and tab navigation tests removed (legacy layout); covered by branches suite.
});
