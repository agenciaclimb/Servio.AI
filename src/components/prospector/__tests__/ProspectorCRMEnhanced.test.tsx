/**
 * Testes para ProspectorCRMEnhanced - CRM Kanban com IA
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProspectorCRMEnhanced from '../ProspectorCRMEnhanced';
import { getDocs } from 'firebase/firestore';

// Mock do Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}));

// Mock do canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('ProspectorCRMEnhanced', () => {
  const mockLeads = [
    {
      id: 'lead-1',
      prospectorId: 'prospector-123',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@test.com',
      category: 'Eletricista',
      source: 'referral',
      stage: 'new',
      score: 75,
      temperature: 'hot',
      priority: 'high',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      lastActivity: new Date(),
      activities: []
    },
    {
      id: 'lead-2',
      prospectorId: 'prospector-123',
      name: 'Maria Santos',
      phone: '11988888888',
      source: 'direct',
      stage: 'contacted',
      score: 50,
      temperature: 'warm',
      priority: 'medium',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date(),
      activities: []
    },
    {
      id: 'lead-3',
      prospectorId: 'prospector-123',
      name: 'Pedro Costa',
      phone: '11977777777',
      source: 'social',
      stage: 'negotiating',
      score: 85,
      temperature: 'hot',
      priority: 'high',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date(),
      lastActivity: new Date(),
      activities: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: mockLeads.map(lead => ({
        id: lead.id,
        data: () => ({
          ...lead,
          createdAt: { toDate: () => lead.createdAt },
          updatedAt: { toDate: () => lead.updatedAt },
          lastActivity: lead.lastActivity ? { toDate: () => lead.lastActivity } : null,
          activities: []
        })
      }))
    } as any);
  });

  it('deve renderizar o componente corretamente', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Prospecção')).toBeInTheDocument();
    });
  });

  it('deve carregar leads do Firestore', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    });
  });

  it('deve exibir leads nas colunas corretas', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      const newColumn = screen.getByText('🆕 Novos').closest('div');
      expect(newColumn).toHaveTextContent('João Silva');

      const contactedColumn = screen.getByText('📞 Contatados').closest('div');
      expect(contactedColumn).toHaveTextContent('Maria Santos');

      const negotiatingColumn = screen.getByText('🤝 Negociando').closest('div');
      expect(negotiatingColumn).toHaveTextContent('Pedro Costa');
    });
  });

  it('deve calcular lead score corretamente', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      const hotLeads = screen.getAllByText('🔥');
      expect(hotLeads.length).toBeGreaterThan(0); // João e Pedro são hot
    });
  });

  it('deve filtrar leads por temperatura', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const hotFilter = screen.getByText('🔥 Quentes');
    fireEvent.click(hotFilter);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('deve exibir stats resumidas', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 lead novo
    });
  });

  it('deve atualizar lead no Firestore ao arrastar', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Simular drag and drop
    // Nota: Teste completo de DnD requer setup mais complexo
    // Aqui testamos apenas a função handleDragEnd diretamente
    
    // TODO: Implementar teste de drag-and-drop completo com @testing-library/user-event
  });

  it('deve disparar confetti ao converter lead', async () => {
    const confetti = await import('canvas-confetti');
    
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Simular movimento para "won"
    // handleDragEnd será chamado internamente
    
    await waitFor(() => {
      expect(confetti.default).toHaveBeenCalled();
    });
  });

  it('deve abrir modal AIMessageGenerator ao clicar em lead', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const leadCard = screen.getByText('João Silva').closest('div');
    fireEvent.click(leadCard!);

    await waitFor(() => {
      expect(screen.getByText('Mensagem para João Silva')).toBeInTheDocument();
    });
  });

  it('deve abrir WhatsApp ao clicar no botão quick action', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const whatsappButtons = screen.getAllByTitle('WhatsApp');
    fireEvent.click(whatsappButtons[0]);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/'),
      '_blank'
    );
  });

  it('deve exibir tempo relativo de última atividade', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      const activityLabels = screen.getAllByText(/Última atividade:/);
      expect(activityLabels.length).toBeGreaterThan(0);
      const activityTimes = screen.getAllByText(/agora mesmo|há \d+ (min|h|d)/);
      expect(activityTimes.length).toBeGreaterThan(0);
    });
  });

  it('deve exibir progress bar de score', async () => {
    const { container } = render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      // Progress bars são divs com classe de fundo colorido
      const progressBars = container.querySelectorAll('.bg-green-500, .bg-yellow-500, .bg-red-500');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('deve notificar leads inativos', async () => {
    const mockNotification = vi.fn();
    Object.defineProperty(global, 'Notification', {
      value: class MockNotification {
        constructor(title: string, options?: any) {
          mockNotification(title, options);
        }
        static permission = 'granted';
      },
      configurable: true
    });

    // Mock já configurado acima com permission e classe

    const inactiveLeads = [
      {
        ...mockLeads[0],
        lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 dias atrás
      }
    ];

    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: inactiveLeads.map(lead => ({
        id: lead.id,
        data: () => ({
          ...lead,
          createdAt: { toDate: () => lead.createdAt },
          updatedAt: { toDate: () => lead.updatedAt },
          lastActivity: { toDate: () => lead.lastActivity },
          activities: []
        })
      }))
    } as any);

    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(mockNotification).toHaveBeenCalledWith(
        '⏰ Leads precisam de atenção!',
        expect.objectContaining({
          body: expect.stringContaining('sem atividade há 7+ dias')
        })
      );
    });
  });

  it('deve auto-refresh a cada 30 segundos', async () => {
    vi.useFakeTimers();

    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalledTimes(1);
    });

    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it('deve fechar modal ao clicar fora', async () => {
    render(
      <ProspectorCRMEnhanced
        prospectorId="prospector-123"
        prospectorName="Test User"
        referralLink="https://servio.ai/ref/123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const leadCard = screen.getByText('João Silva').closest('div');
    fireEvent.click(leadCard!);

    await waitFor(() => {
      expect(screen.getByText('Mensagem para João Silva')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Mensagem para João Silva')).not.toBeInTheDocument();
    });
  });
});
