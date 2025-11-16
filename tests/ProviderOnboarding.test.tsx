import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProviderOnboarding from '../doc/ProviderOnboarding';
import * as api from '../services/api';
import { User } from '../types';

// Mock dos subcomponentes para isolar o teste do orquestrador (caminhos atualizados)
vi.mock('../doc/OnboardingStepWelcome', () => ({
  default: ({ onUpdate, error }: { onUpdate: (field: string, value: any) => void; error?: string }) => (
    <div data-testid="step-welcome">
      <label htmlFor="bio">Biografia</label>
      <textarea id="bio" onChange={(e) => onUpdate('bio', e.target.value)} />
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  ),
}));
vi.mock('../doc/OnboardingStepProfile', () => ({
  default: () => <div data-testid="step-profile" />,
}));
vi.mock('../doc/OnboardingStepPayments', () => ({
  default: ({ onConnectStripe }: { onConnectStripe: () => void }) => (
    <div data-testid="step-payments">
      <button onClick={onConnectStripe}>Conectar com Stripe</button>
    </div>
  ),
}));
vi.mock('../doc/OnboardingProgress', () => ({
  default: () => <div data-testid="progress-bar" />,
}));

// Mock do serviço de API e react-router-dom
vi.mock('../services/api');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ProviderOnboarding', () => {
  const mockUser: User = {
    email: 'provider@test.com',
    name: 'Test Provider',
    type: 'prestador',
    status: 'ativo',
    verificationStatus: 'pendente',
    profile: { bio: '', specialties: ['Pintor'] },
  } as User;

  const onOnboardingComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (api.updateUser as vi.Mock).mockResolvedValue({ success: true });
    (api.createStripeConnectAccount as vi.Mock).mockResolvedValue({ accountId: 'acct_123' });
    (api.createStripeAccountLink as vi.Mock).mockResolvedValue({ url: 'https://connect.stripe.com/onboard' });
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { assign: vi.fn(), href: '' },
    });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <ProviderOnboarding user={mockUser} onOnboardingComplete={onOnboardingComplete} />
      </BrowserRouter>
    );
  };

  it('deve renderizar a primeira etapa (Welcome) e a barra de progresso por padrão', () => {
    renderComponent();
    expect(screen.getByText('Etapa 1 de 3: Boas-vindas')).toBeInTheDocument();
    expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('deve exibir um erro de validação e não avançar se a biografia for muito curta', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();

    await user.type(screen.getByLabelText('Biografia'), 'bio curta');
    await user.click(screen.getByRole('button', { name: /Próximo/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Sua biografia precisa ter pelo menos 30 caracteres para se destacar.'
      );
    }, { timeout: 10000 });
    
    expect(api.updateUser).not.toHaveBeenCalled();
    expect(screen.queryByTestId('step-profile')).not.toBeInTheDocument();
  }, 15000);

  it('deve avançar para a próxima etapa e chamar a API de atualização ao preencher os dados corretamente', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();

    await user.type(screen.getByLabelText('Biografia'), 'Esta é uma biografia longa e detalhada o suficiente para passar na validação.');
    await user.click(screen.getByRole('button', { name: /Próximo/i }));

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalled();
    }, { timeout: 10000 });
    
    expect(screen.getByTestId('step-profile')).toBeInTheDocument();
  }, 15000);

  it('deve chamar as APIs do Stripe e redirecionar na etapa de pagamento', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();

    // Simula o avanço para a etapa 3
    fireEvent.change(screen.getByLabelText('Biografia'), { target: { value: 'Biografia válida com mais de 30 caracteres.' } });
    await user.click(screen.getByRole('button', { name: /Próximo/i }));
    
    await waitFor(() => expect(screen.getByTestId('step-profile')).toBeInTheDocument(), { timeout: 10000 });
    
    // Navega para etapa de pagamentos (botão "Próximo" ainda existe na etapa 2)
    const nextButtons = screen.queryAllByRole('button', { name: /Próximo/i });
    if (nextButtons.length > 0) {
      await user.click(nextButtons[0]);
    }

    await waitFor(() => expect(screen.getByTestId('step-payments')).toBeInTheDocument(), { timeout: 10000 });
    
    await user.click(screen.getByRole('button', { name: /Conectar com Stripe/i }));

    await waitFor(() => {
      expect(api.createStripeConnectAccount).toHaveBeenCalledWith(mockUser.email);
      expect(api.createStripeAccountLink).toHaveBeenCalledWith(mockUser.email);
      expect(window.location.href).toBe('https://connect.stripe.com/onboard');
    }, { timeout: 10000 });
  }, 20000);
});