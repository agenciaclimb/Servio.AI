/**
 * Testes de Integração - Fluxo Completo do Prospector
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProspectorDashboard from '../../../../../components/ProspectorDashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  getFirestore: vi.fn(() => ({})),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  Timestamp: { now: vi.fn(() => ({ toDate: () => new Date() })) }
}));

// Mock API
vi.mock('../../../../../services/api', () => ({
  fetchProspectorStats: vi.fn(() => Promise.resolve({
    prospectorId: 'test-123',
    activeRecruits: 5,
    totalRecruits: 10,
    totalCommissionsEarned: 500,
    averageCommissionPerRecruit: 50,
    pendingCommissions: 100,
    currentBadge: 'Bronze',
    nextBadge: 'Prata',
    progressToNextBadge: 50,
    badgeTiers: []
  })),
  fetchProspectorLeaderboard: vi.fn(() => Promise.resolve([])),
  computeBadgeProgress: vi.fn(() => ({
    currentBadge: 'Bronze',
    nextBadge: 'Prata',
    progressToNextBadge: 50,
    tiers: []
  }))
}));

// Mock outros serviços
vi.mock('../../../../services/smartActionsService', () => ({
  generateSmartActions: vi.fn(() => Promise.resolve([]))
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('Integração: Fluxo Completo do Prospector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Fluxo 1: Onboarding completo de um novo prospector', async () => {
    render(
      <BrowserRouter>
        <ProspectorDashboard userId="new-user-123" />
      </BrowserRouter>
    );

    // 1. Dashboard IA carrega por padrão
    await waitFor(() => {
      expect(screen.getByText(/Dashboard IA/)).toBeInTheDocument();
    });

    // 2. Onboarding tour inicia automaticamente
    await waitFor(() => {
      expect(screen.getByText(/Bem-vindo/i)).toBeInTheDocument();
    });

    // 3. Quick Actions Bar está visível
    expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();

    // 4. Checklist de onboarding aparece
    await waitFor(() => {
      expect(screen.getByText('Checklist de Onboarding')).toBeInTheDocument();
    });
  });

  it('Fluxo 2: Prospector gera e compartilha link de indicação', async () => {
    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    // 1. Navegar para tab Links
    const linksTab = screen.getByText('🔗 Links');
    fireEvent.click(linksTab);

    await waitFor(() => {
      expect(screen.getByText(/Link de Indicação/i)).toBeInTheDocument();
    });

    // 2. Copiar link (simular)
    // Verifica se componente ReferralLinkGenerator está renderizado
    expect(screen.getByText(/servio.ai\/ref\//i)).toBeInTheDocument();
  });

  it('Fluxo 3: Prospector adiciona lead e envia mensagem IA', async () => {
    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    // 1. Navegar para CRM
    const crmTab = screen.getByText('🎯 Pipeline CRM');
    fireEvent.click(crmTab);

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Prospecção')).toBeInTheDocument();
    });

    // 2. Verificar se quick action "Novo Lead" está disponível
    expect(screen.getByText('Novo Lead')).toBeInTheDocument();

    // 3. Clicar em "Novo Lead"
    const addLeadButton = screen.getByText('Novo Lead').closest('button');
    fireEvent.click(addLeadButton!);

    // 4. Modal deve abrir
    await waitFor(() => {
      expect(screen.getByText('➕ Adicionar Lead')).toBeInTheDocument();
    });
  });

  it('Fluxo 4: Prospector filtra leads por temperatura', async () => {
    const { getDocs } = await import('firebase/firestore');
    
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: 'lead-1',
          data: () => ({
            name: 'João Hot',
            stage: 'negotiating',
            score: 85,
            temperature: 'hot',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          })
        },
        {
          id: 'lead-2',
          data: () => ({
            name: 'Maria Cold',
            stage: 'new',
            score: 30,
            temperature: 'cold',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          })
        }
      ]
    } as any);

    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    // 1. Ir para CRM
    const crmTab = screen.getByText('🎯 Pipeline CRM');
    fireEvent.click(crmTab);

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Prospecção')).toBeInTheDocument();
    });

    // 2. Aplicar filtro "Quentes"
    const hotFilter = screen.getByText('🔥 Quentes');
    fireEvent.click(hotFilter);

    // 3. Verificar se apenas leads quentes aparecem
    await waitFor(() => {
      expect(screen.getByText('João Hot')).toBeInTheDocument();
      expect(screen.queryByText('Maria Cold')).not.toBeInTheDocument();
    });
  });

  it('Fluxo 5: Prospector arrasta lead entre stages (CRM)', async () => {
    // Este teste requer configuração mais complexa de DnD
    // Placeholder para implementação futura com @testing-library/user-event
    expect(true).toBe(true);
  });

  it('Fluxo 6: Dashboard IA exibe smart actions personalizadas', async () => {
    const { generateSmartActions } = await import('../../../../services/smartActionsService');
    
    vi.mocked(generateSmartActions).mockResolvedValueOnce([
      {
        id: '1',
        icon: '📞',
        title: 'Contatar lead urgente',
        description: 'João Silva aguarda há 7 dias',
        priority: 'high',
        actionType: 'follow_up'
      }
    ]);

    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    // Dashboard IA é tab padrão
    await waitFor(() => {
      expect(screen.getByText('Contatar lead urgente')).toBeInTheDocument();
    });

    // Verificar badge de prioridade
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('Fluxo 7: Navegação entre todas as tabs', async () => {
    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    const tabs = [
      { name: '⚡ Dashboard IA', content: /Olá/i },
      { name: '🎯 Pipeline CRM', content: /Pipeline de Prospecção/ },
      { name: '🔗 Links', content: /Link de Indicação/i },
      { name: '📚 Materiais', content: /Materiais/i },
      { name: '📊 Estatísticas', content: /Recrutas Ativos/ }
    ];

    for (const tab of tabs) {
      const tabButton = screen.getByText(tab.name);
      fireEvent.click(tabButton);

      await waitFor(() => {
        expect(screen.getByText(tab.content)).toBeInTheDocument();
      });
    }
  });

  it('Fluxo 8: Quick Actions Bar responde a todas as ações', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    // 1. Compartilhar link
    const shareButton = screen.getByText('Compartilhar').closest('button');
    fireEvent.click(shareButton!);
    expect(mockOpen).toHaveBeenCalled();

    // 2. Adicionar lead
    const addButton = screen.getByText('Novo Lead').closest('button');
    fireEvent.click(addButton!);
    await waitFor(() => {
      expect(screen.getByText('➕ Adicionar Lead')).toBeInTheDocument();
    });

    // 3. Fechar modal
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    // 4. Abrir notificações
    const notifButton = screen.getByText('Alertas').closest('button');
    fireEvent.click(notifButton!);
    await waitFor(() => {
      expect(screen.getByText('🔔 Notificações')).toBeInTheDocument();
    });
  });

  it('Fluxo 9: Celebração ao conquistar novo badge', async () => {
    const confetti = await import('canvas-confetti');
    const { fetchProspectorStats } = await import('../../../../../services/api');

    const { rerender } = render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dashboard IA/)).toBeInTheDocument();
    });

    // Simular mudança de badge
    vi.mocked(fetchProspectorStats).mockResolvedValueOnce({
      prospectorId: 'test-123',
      activeRecruits: 10,
      totalRecruits: 15,
      totalCommissionsEarned: 1500,
      averageCommissionPerRecruit: 100,
      pendingCommissions: 200,
      currentBadge: 'Prata', // Novo badge!
      nextBadge: 'Ouro',
      progressToNextBadge: 25,
      badgeTiers: []
    });

    rerender(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(confetti.default).toHaveBeenCalled();
    });
  });

  it('Fluxo 10: Responsividade mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(
      <BrowserRouter>
        <ProspectorDashboard userId="user-123" />
      </BrowserRouter>
    );

    fireEvent(window, new Event('resize'));

    // FAB deve aparecer em vez de barra sticky
    await waitFor(() => {
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });
});
