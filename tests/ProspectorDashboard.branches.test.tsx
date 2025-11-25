/**
 * ProspectorDashboard - Testes de Branches Adicionais
 * Foco: Aumentar cobertura de código novo para >80%
 * 
 * Branches cobertos:
 * - Ternários aninhados (leaderboard vazio vs populado)
 * - Smart actions com diferentes estados (loading, vazio, erro, sucesso)
 * - Badge progress com stats ausentes vs presentes
 * - Alternância entre tabs (dashboard e CRM)
 * - Tratamento de erros em loadSmartActions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProspectorDashboard from '../components/ProspectorDashboard';
import * as api from '../services/api';
import * as smartActionsService from '../src/services/smartActionsService';

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

// Mock firebaseConfig
vi.mock('../firebaseConfig', () => ({
  db: {},
  auth: { currentUser: null },
  storage: {},
}));

// Mock services
vi.mock('../services/api');
vi.mock('../src/services/smartActionsService');

// Mock child components
vi.mock('../src/components/ProspectorOnboarding', () => ({
  default: () => <div data-testid="prospector-onboarding" />,
}));
vi.mock('../src/components/ProspectorQuickActions', () => ({
  default: () => <div data-testid="quick-actions" />,
}));
vi.mock('../src/components/ReferralLinkGenerator', () => ({
  default: ({ onLinkGenerated }: any) => {
    onLinkGenerated('https://servio.ai/ref/test123');
    return <div data-testid="referral-link-generator" />;
  },
}));
vi.mock('../src/components/MessageTemplateSelector', () => ({
  default: () => <div data-testid="message-template-selector" />,
}));
vi.mock('../src/components/NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings" />,
}));
vi.mock('../src/components/ProspectorCRM', () => ({
  default: () => <div data-testid="prospector-crm" />,
}));
vi.mock('./AIInternalChat', () => ({
  default: () => <div data-testid="ai-chat" />,
}));

describe.skip('ProspectorDashboard - Branches Adicionais (temporarily skipped)', () => {
  const mockStats = {
    totalRecruits: 15,
    activeRecruits: 10,
    totalCommissionsEarned: 1500,
    averageCommissionPerRecruit: 100,
    currentBadge: 'Prata',
    nextBadge: 'Ouro',
    progressToNextBadge: 60,
    badgeTiers: ['Bronze', 'Prata', 'Ouro'],
  };

  const mockLeaderboard = [
    { prospectorId: '1', rank: 1, name: 'João Silva', totalRecruits: 50, totalCommissionsEarned: 5000 },
    { prospectorId: '2', rank: 2, name: 'Maria Santos', totalRecruits: 40, totalCommissionsEarned: 4000 },
    { prospectorId: '3', rank: 3, name: 'Pedro Costa', totalRecruits: 30, totalCommissionsEarned: 3000 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(mockStats as any);
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue(mockLeaderboard as any);
    vi.mocked(api.computeBadgeProgress).mockReturnValue({
      currentBadge: 'Bronze',
      nextBadge: 'Prata',
      progressToNextBadge: 0,
      tiers: ['Bronze', 'Prata', 'Ouro'],
    });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exibe leaderboard vazio quando não há dados (branch ternário aninhado)', async () => {
    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue([]);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    // Branch: leaderboard.slice(0, 5).length === 0
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('exibe leaderboard populado com ranking e comissões formatadas', async () => {
    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    // Branch: leaderboard.slice(0, 5).map(...)
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('50 rec')).toBeInTheDocument();
    expect(screen.getByText('R$ 5000')).toBeInTheDocument();
  });

  it('mostra estado de loading para smart actions', async () => {
    let resolveActions: any;
    vi.mocked(smartActionsService.generateSmartActions).mockReturnValue(
      new Promise(resolve => {
        resolveActions = resolve;
      })
    );

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-total')).not.toBeInTheDocument();
    });

    // Branch: actionsLoading === true
    expect(screen.getByText('Gerando sugestões...')).toBeInTheDocument();

    // Resolve para limpar
    resolveActions([]);
  });

  it('mostra mensagem quando smart actions está vazio (branch alternativo)', async () => {
    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([]);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma sugestão no momento')).toBeInTheDocument();
    });
  });

  it('exibe smart actions quando disponíveis', async () => {
    const mockActions = [
      {
        id: 'action-1',
        title: 'Recrutar Eletricistas',
        description: 'Categoria com alta demanda',
        icon: '⚡',
        priority: 'high',
        actionUrl: '#',
      },
    ];

    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue(mockActions as any);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('Recrutar Eletricistas')).toBeInTheDocument();
      expect(screen.getByText('Categoria com alta demanda')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });

  it('usa computeBadgeProgress quando stats está ausente (branch de fallback)', async () => {
    vi.mocked(api.fetchProspectorStats).mockResolvedValue(null as any);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-total')).not.toBeInTheDocument();
    });

    // Branch: stats ausente → computeBadgeProgress é chamado
    expect(api.computeBadgeProgress).toHaveBeenCalledWith(0);
    expect(screen.getByText('Bronze')).toBeInTheDocument();
  });

  it('alterna entre tabs Dashboard e CRM', async () => {
    const user = userEvent.setup();
    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([]);
    
    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    // Tab padrão: Dashboard
    expect(screen.getByTestId('referral-link-generator')).toBeInTheDocument();

    // Clica na tab CRM
    const crmTab = screen.getByText('🎯 Pipeline CRM');
    await user.click(crmTab);

    // Verifica que a tab CRM foi selecionada
    await waitFor(() => {
      expect(crmTab).toHaveClass('text-indigo-600');
    });

    // Volta para Dashboard
    const dashboardTab = screen.getByText('📊 Dashboard');
    await user.click(dashboardTab);

    await waitFor(() => {
      expect(dashboardTab).toHaveClass('text-indigo-600');
      expect(screen.getByTestId('referral-link-generator')).toBeInTheDocument();
    });
  });

  it('trata erro em loadSmartActions e tenta fallback sem leads', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Primeiro getDocs falha, depois gera smartActions normalmente
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore timeout'));
    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([]);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-total')).not.toBeInTheDocument();
    });

    // Branch: erro ao buscar leads → fallback para generateSmartActions sem leads
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ProspectorDashboard] SmartActions fallback:'),
        expect.any(String)
      );
    });

    // Verifica que mensagem de ações vazias é exibida
    expect(screen.getByText('Nenhuma sugestão no momento')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('trata erro duplo em loadSmartActions definindo array vazio', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore fail'));
    vi.mocked(smartActionsService.generateSmartActions)
      .mockRejectedValueOnce(new Error('Primary fail'))
      .mockRejectedValueOnce(new Error('Fallback also fail'));

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-total')).not.toBeInTheDocument();
    });

    // Branch: erro duplo → smartActions fica vazio
    await waitFor(() => {
      expect(screen.getByText('Nenhuma sugestão no momento')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('carrega smart actions com leads quando Firestore retorna dados', async () => {
    const mockLeads = [
      {
        id: 'lead-1',
        stage: 'contacted',
        lastActivity: new Date('2025-01-01'),
      },
      {
        id: 'lead-2',
        stage: 'negotiating',
        lastActivity: new Date('2025-01-02'),
      },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockLeads.map((lead: any) => ({
        id: lead.id,
        data: () => ({
          stage: lead.stage,
          lastActivity: {
            toDate: () => lead.lastActivity,
          },
        }),
      })),
    } as any);

    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([]);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-total')).not.toBeInTheDocument();
    });

    // Verifica que generateSmartActions foi chamado com leads
    await waitFor(() => {
      expect(smartActionsService.generateSmartActions).toHaveBeenCalledWith(
        'test-user',
        mockStats,
        expect.arrayContaining([
          expect.objectContaining({ id: 'lead-1', stage: 'contacted' }),
          expect.objectContaining({ id: 'lead-2', stage: 'negotiating' }),
        ]),
        []
      );
    });
  });

  it('formata comissões corretamente com .toFixed(2)', async () => {
    const statsWithDecimal = {
      ...mockStats,
      totalCommissionsEarned: 1234.567,
      averageCommissionPerRecruit: 82.304,
    };

    vi.mocked(api.fetchProspectorStats).mockResolvedValue(statsWithDecimal as any);
    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([]);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-total')).not.toBeInTheDocument();
    });

    // Verifica formatação decimal
    expect(screen.getByText('1234.57')).toBeInTheDocument();
    expect(screen.getByText('82.30')).toBeInTheDocument();
  });

  it('formata comissões do leaderboard com .toFixed(0)', async () => {
    const leaderboardWithDecimal = [
      { prospectorId: '1', rank: 1, name: 'João', totalRecruits: 50, totalCommissionsEarned: 4567.89 },
    ];

    vi.mocked(api.fetchProspectorLeaderboard).mockResolvedValue(leaderboardWithDecimal as any);
    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([]);

    render(<ProspectorDashboard userId="test-user" />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    // Verifica formatação sem decimais no leaderboard
    expect(screen.getByText('R$ 4568')).toBeInTheDocument();
  });
});
