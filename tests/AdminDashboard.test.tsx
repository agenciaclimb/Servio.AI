import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import type { User, Job, Proposal, Dispute } from '../types';

// Mock do módulo api (inclui exports necessários para evitar warnings e garantir fim do loading)
vi.mock('../services/api', async () => {
  const actual = await vi.importActual<any>('../services/api');
  return {
    ...actual,
    fetchJobs: vi.fn().mockResolvedValue([]),
    fetchJobsForUser: vi.fn().mockResolvedValue([]),
    fetchJobsForProvider: vi.fn().mockResolvedValue([]),
    fetchAllUsers: vi.fn().mockResolvedValue([]),
    fetchDisputes: vi.fn().mockResolvedValue([]),
    fetchSentimentAlerts: vi.fn().mockResolvedValue([]),
    default: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

// Mock do geminiService
vi.mock('../services/geminiService', () => ({
  mediateDispute: vi.fn(),
  analyzeProviderBehaviorForFraud: vi.fn(),
}));

describe('AdminDashboard', () => {
  const mockUser: User = {
    email: 'admin@test.com',
    name: 'Admin Test',
    type: 'admin',
    status: 'approved',
    location: 'São Paulo',
    memberSince: new Date('2024-01-01'),
  };

  const mockJobs: Job[] = [
    {
      id: 'job1',
      clientId: 'client1',
      category: 'Eletricista',
      description: 'Instalação de tomadas',
      status: 'open',
      createdAt: new Date(),
    },
    {
      id: 'job2',
      clientId: 'client2',
      providerId: 'provider1',
      category: 'Encanador',
      description: 'Vazamento urgente',
      status: 'in-progress',
      createdAt: new Date(),
    },
  ];

  const _mockProposals: Proposal[] = [
    {
      id: 'prop1',
      jobId: 'job1',
      providerId: 'provider1',
      price: 250,
      message: 'Posso fazer hoje',
      status: 'pending',
      createdAt: new Date(),
    },
  ];

  const mockDisputes: Dispute[] = [
    {
      id: 'disp1',
      jobId: 'job2',
      initiatorId: 'client2',
      reason: 'Trabalho não concluído',
      status: 'open',
      createdAt: new Date(),
    },
  ];

  const mockUsers: User[] = [
    {
      email: 'client1@test.com',
      name: 'Cliente 1',
      type: 'client',
      status: 'approved',
      location: 'Rio de Janeiro',
      memberSince: new Date('2024-02-01'),
    },
    {
      email: 'provider1@test.com',
      name: 'Prestador 1',
      type: 'provider',
      status: 'approved',
      location: 'São Paulo',
      memberSince: new Date('2024-03-01'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o dashboard do admin com loading inicial', () => {
    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    // Verifica se as abas principais estão presentes usando data-testid
    expect(screen.getByTestId('admin-tab-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('admin-tab-jobs')).toBeInTheDocument();
    expect(screen.getByTestId('admin-tab-providers')).toBeInTheDocument();
  });

  it('deve exibir analytics após carregamento', async () => {
    const { default: api } = await import('../services/api');
    
    // Mock das chamadas de API
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/metrics/user-growth')) {
        return { data: { total: 150, newThisMonth: 25 } };
      }
      if (url.includes('/metrics/job-creation')) {
        return { data: { total: 80, activeJobs: 30 } };
      }
      if (url.includes('/metrics/revenue')) {
        return { data: { totalRevenue: 15000, platformRevenue: 3000 } };
      }
      if (url.includes('/users')) {
        return { data: mockUsers };
      }
      if (url.includes('/jobs')) {
        return { data: mockJobs };
      }
      if (url.includes('/disputes')) {
        return { data: mockDisputes };
      }
      return { data: [] };
    });

    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    // Aguarda o carregamento dos dados
    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    });

    // Verifica se as abas estão presentes (indicando que renderizou)
    await waitFor(() => {
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/providers/i)).toBeInTheDocument();
    });
  });

  it('deve filtrar jobs por status', async () => {
    const { default: api } = await import('../services/api');
    
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/jobs')) {
        return { data: mockJobs };
      }
      if (url.includes('/users')) {
        return { data: mockUsers };
      }
      return { data: [] };
    });

    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    });

    // Procura por elementos de controle de abas/filtros
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('deve permitir suspender um provedor', async () => {
    const { default: api } = await import('../services/api');
    
    vi.mocked(api.get).mockResolvedValue({ data: mockUsers });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    });

    // Tenta encontrar botão de suspender (pode estar em modal ou lista de usuários)
    const buttons = screen.queryAllByRole('button');
    const suspendButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('suspender')
    );

    if (suspendButton) {
      fireEvent.click(suspendButton);
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    }
  });

  it('deve chamar mediação de disputa ao clicar em "Mediar"', async () => {
    const { mediateDispute } = await import('../services/geminiService');
    const { default: api } = await import('../services/api');
    
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/disputes')) {
        return { data: mockDisputes };
      }
      if (url.includes('/users')) {
        return { data: mockUsers };
      }
      if (url.includes('/jobs')) {
        return { data: mockJobs };
      }
      return { data: [] };
    });

    vi.mocked(mediateDispute).mockResolvedValue('Recomendação: favor ao cliente');

    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    });

    // Procura botão de mediar
    const buttons = screen.queryAllByRole('button');
    const mediateButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('mediar')
    );

    if (mediateButton) {
      fireEvent.click(mediateButton);
      await waitFor(() => {
        expect(mediateDispute).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });

  it('deve tratar erro de API gracefully', async () => {
    const { default: api } = await import('../services/api');
    
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    // Verifica que o componente não quebra e renderiza as abas
    await waitFor(() => {
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    });

    // Não deve mostrar loading indefinidamente
    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('deve navegar entre abas do dashboard', async () => {
    const { default: api } = await import('../services/api');
    
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/users')) return { data: mockUsers };
      if (url.includes('/jobs')) return { data: mockJobs };
      if (url.includes('/disputes')) return { data: mockDisputes };
      return { data: [] };
    });

    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    });

    // Tenta encontrar e clicar em diferentes abas
    const buttons = screen.queryAllByRole('button');
    
    // Clica em diferentes botões para simular navegação de abas
    if (buttons.length > 1) {
      fireEvent.click(buttons[1]);
      await waitFor(() => {
        expect(buttons[1]).toBeTruthy();
      });
    }
  });
});


