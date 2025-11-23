import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProspectorDashboard from '../components/ProspectorDashboard';
import * as api from '../services/api';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
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
  Timestamp: {
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  },
}));

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

  it('should render unified 3-column layout without tabs', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.queryByText('📊 Visão Geral')).not.toBeInTheDocument(); // Sem tabs
      expect(screen.queryByText('🔗 Links de Indicação')).not.toBeInTheDocument();
    });

    // Verifica título principal
    expect(screen.getByText('Painel do Prospector')).toBeInTheDocument();
  });

  it('should render Column 1 - Stats Cards', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('Recrutas Ativos')).toBeInTheDocument();
      expect(screen.getByText('Total Recrutas')).toBeInTheDocument();
      expect(screen.getByText('Comissões (R$)')).toBeInTheDocument();
      expect(screen.getByText('Média Comissão')).toBeInTheDocument();
    });

    // Verifica valores
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // activeRecruits
      expect(screen.getByText('12')).toBeInTheDocument(); // totalRecruits
      expect(screen.getByText('2450.75')).toBeInTheDocument(); // commissions
      expect(screen.getByText('204.23')).toBeInTheDocument(); // average
    });
  });

  it('should render Column 1 - Badge Progress section', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('🏆 Progresso de Badge')).toBeInTheDocument();
      expect(screen.getByText('Ouro')).toBeInTheDocument(); // currentBadge
      expect(screen.getByText('Platina')).toBeInTheDocument(); // nextBadge
      expect(screen.getByText('75% completo')).toBeInTheDocument();
    });
  });

  it('should render Column 1 - Mini Leaderboard (Top 5)', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('🥇 Top 5 Prospectors')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('User Test')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getAllByText('#1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#2').length).toBeGreaterThan(0);
    });
  });

  it('should render Column 2 - Referral Link and Templates', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByTestId('referral-generator')).toBeInTheDocument();
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    });
  });

  it('should render Column 2 - Quick Tips', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('💡 Dicas Rápidas')).toBeInTheDocument();
      expect(screen.getByText(/Convide prestadores em categorias com menor cobertura/)).toBeInTheDocument();
    });
  });

  it('should render Column 3 - Smart Actions', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('🎯 Ações Sugeridas')).toBeInTheDocument();
      // Actions provided by mocked smartActionsService
      expect(screen.getByText('Compartilhar no WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Contatar recrutados inativos')).toBeInTheDocument();
    });
  });

  it('should render Column 3 - Performance metrics', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('📊 Performance')).toBeInTheDocument();
      expect(screen.getByText('Taxa de conversão')).toBeInTheDocument();
      expect(screen.getByText('Média por recrutado')).toBeInTheDocument();
      expect(screen.getByText('Posição no ranking')).toBeInTheDocument();
    });

    // Verifica cálculos
    await waitFor(() => {
      expect(screen.getByText('83%')).toBeInTheDocument(); // (10/12)*100
      expect(screen.getByText('R$ 204')).toBeInTheDocument(); // average rounded
      expect(screen.getAllByText('#2').length).toBeGreaterThan(0); // rank appears in leaderboard and performance
    });
  });

  it('should render Column 3 - Weekly Goals', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('🎯 Meta Semanal')).toBeInTheDocument();
      expect(screen.getByText('Novos recrutas esta semana')).toBeInTheDocument();
      expect(screen.getByText('/ 5 meta')).toBeInTheDocument();
    });
  });

  it('should render Column 3 - Notification Settings', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByText('🔔 Notificações')).toBeInTheDocument();
      expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
    });
  });

  it('should render Onboarding Tour component', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
  });

  it('should render Quick Actions when stats and link available', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    (api.fetchProspectorStats as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<ProspectorDashboard userId="test-prospector" />);

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

  it('should have responsive grid classes', () => {
    const { container } = render(<ProspectorDashboard userId="test-prospector" />);
    
    const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-12');
    expect(gridContainer).toBeInTheDocument();

    const col1 = container.querySelector('.lg\\:col-span-4');
    const col2 = container.querySelector('.lg\\:col-span-5');
    const col3 = container.querySelector('.lg\\:col-span-3');
    
    expect(col1).toBeInTheDocument();
    expect(col2).toBeInTheDocument();
    expect(col3).toBeInTheDocument();
  });

  it('should display all sections simultaneously (no tab switching)', async () => {
    render(<ProspectorDashboard userId="test-prospector" />);

    await waitFor(() => {
      // Todas seções visíveis ao mesmo tempo
      expect(screen.getByTestId('referral-generator')).toBeInTheDocument();
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
      expect(screen.getByText('🥇 Top 5 Prospectors')).toBeInTheDocument();
      expect(screen.getByText('🎯 Ações Sugeridas')).toBeInTheDocument();
    });
  });
});
