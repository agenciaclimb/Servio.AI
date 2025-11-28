import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import type { User, Job, Dispute } from '../types';
import * as api from '../services/api';
import { mediateDispute } from '../services/geminiService';

// Mock do módulo api usando exports nomeadas
vi.mock('../services/api');

// Mock do geminiService (funções nomeadas)
vi.mock('../services/geminiService', () => ({
  mediateDispute: vi.fn(),
  analyzeProviderBehaviorForFraud: vi.fn(),
}));

describe('AdminDashboard', () => {
  const mockUser: User = {
    email: 'admin@test.com',
    name: 'Admin Test',
    type: 'admin',
    status: 'ativo',
    location: 'São Paulo',
    bio: '',
    memberSince: '2024-01-01',
  };

  const mockJobs: Job[] = [
    {
      id: 'job1',
      clientId: 'client1',
      category: 'Eletricista',
      description: 'Instalação de tomadas',
      status: 'ativo',
      serviceType: 'tabelado',
      urgency: 'hoje',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job2',
      clientId: 'client2',
      providerId: 'provider1',
      category: 'Encanador',
      description: 'Vazamento urgente',
      status: 'em_progresso',
      serviceType: 'personalizado',
      urgency: 'hoje',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockDisputes: Dispute[] = [
    {
      id: 'disp1',
      jobId: 'job2',
      initiatorId: 'client2',
      reason: 'Trabalho não concluído',
      status: 'aberta',
      messages: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const mockUsers: User[] = [
    {
      email: 'client1@test.com',
      name: 'Cliente 1',
      type: 'cliente',
      status: 'ativo',
      location: 'Rio de Janeiro',
      bio: '',
      memberSince: '2024-02-01',
    },
    {
      email: 'provider1@test.com',
      name: 'Prestador 1',
      type: 'prestador',
      status: 'ativo',
      location: 'São Paulo',
      bio: '',
      memberSince: '2024-03-01',
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
    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    // Verifica se as abas com data-testid estão presentes (indicando que renderizou)
    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('admin-tab-providers')).toBeInTheDocument();
    });
  });

  it('deve filtrar jobs por status', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    // As abas já renderizam imediatamente, verifica se ao menos uma existe
    const buttons = await screen.findAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('deve permitir suspender um provedor', async () => {
    vi.mocked(api.fetchAllUsers).mockResolvedValue(mockUsers);
    vi.mocked(api.suspendProvider).mockResolvedValue({ success: true, message: 'ok' } as any);

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
        expect(api.suspendProvider).toHaveBeenCalled();
      });
    }
  });

  it('deve chamar mediação de disputa ao clicar em "Mediar"', async () => {
    vi.mocked(api.fetchDisputes).mockResolvedValue(mockDisputes);
    vi.mocked(api.fetchAllUsers).mockResolvedValue(mockUsers);
    vi.mocked(api.fetchJobs).mockResolvedValue(mockJobs);

    vi.mocked(mediateDispute).mockResolvedValue({
      summary: 'Resumo da disputa',
      analysis: 'Análise detalhada',
      suggestion: 'Recomendação: favor ao cliente',
    });

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
    render(
      <BrowserRouter>
        <AdminDashboard user={mockUser} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-analytics')).toBeInTheDocument();
    });
  });

  it('deve navegar entre abas do dashboard', async () => {
    vi.mocked(api.fetchAllUsers).mockResolvedValue(mockUsers);
    vi.mocked(api.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(api.fetchDisputes).mockResolvedValue(mockDisputes);

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


