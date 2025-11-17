import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock heavy lazy-loaded components
vi.mock('../components/ClientDashboard', () => ({
  default: () => <div data-testid="client-dashboard">Client Dashboard</div>,
}));

vi.mock('../components/AIJobRequestWizard', () => ({
  default: () => <div data-testid="ai-wizard">AI Wizard</div>,
}));

vi.mock('../components/FindProvidersPage', () => ({
  default: () => <div data-testid="find-providers">Find Providers</div>,
}));

// Mock toast
vi.mock('../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: any) => <div>{children}</div>,
  useToast: () => ({ addToast: vi.fn() }),
}));

// Mock messaging service
vi.mock('../services/messagingService', () => ({
  registerUserFcmToken: vi.fn(() => Promise.resolve()),
  onForegroundMessage: vi.fn(),
}));

import App from '../App';
import * as API from '../services/api';

describe('App – integração leve de rotas e auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('renderiza home com HeroSection por padrão', () => {
    render(<App />);
    // Header renderiza
    expect(screen.getByText('SERVIO.AI')).toBeInTheDocument();
    // Hero section exibe mensagem principal
    expect(screen.getByText(/resolver para você hoje/i)).toBeInTheDocument();
  });

  it('navega para "Encontrar Profissionais" e carrega dados', async () => {
    const mockUsers = [{ email: 'prov@test.com', name: 'Provider Test', type: 'prestador', status: 'ativo' }];
    const mockJobs = [{ id: 'job1', category: 'Eletricista', status: 'aberto' }];

    vi.spyOn(API, 'fetchAllUsers').mockResolvedValueOnce(mockUsers as any);
    vi.spyOn(API, 'fetchJobs').mockResolvedValueOnce(mockJobs as any);

    render(<App />);

    // Clicar no botão "Encontrar Profissionais" no Header
    const findButton = screen.getByRole('button', { name: /Encontrar Profissionais/i });
    await userEvent.click(findButton);

    // Aguardar que os dados sejam carregados
    await waitFor(() => {
      expect(API.fetchAllUsers).toHaveBeenCalled();
      expect(API.fetchJobs).toHaveBeenCalled();
    }, { timeout: 2000 });

    // FindProvidersPage mocada deve renderizar
    expect(screen.getByTestId('find-providers')).toBeInTheDocument();
  });

  it('dispara listener de evento customizado "open-wizard-from-chat"', async () => {
    render(<App />);

    // Simular evento customizado que abre o wizard
    const jobData = {
      category: 'Pintor',
      description: 'Pintar sala',
      urgency: '1semana',
    };

    const customEvent = new CustomEvent('open-wizard-from-chat', { detail: jobData });
    window.dispatchEvent(customEvent);

    // Wizard mocado deve aparecer no DOM
    await waitFor(() => {
      expect(screen.getByTestId('ai-wizard')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('renderiza componentes lazy-loaded via Suspense', async () => {
    render(<App />);

    // Disparar evento customizado para abrir o wizard
    const jobData = { category: 'Teste', description: 'Teste serviço' };
    window.dispatchEvent(new CustomEvent('open-wizard-from-chat', { detail: jobData }));

    // Aguardar que o Suspense resolva e o wizard mocado apareça
    await waitFor(() => {
      expect(screen.getByTestId('ai-wizard')).toBeInTheDocument();
    });
  });
});
