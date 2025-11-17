import React, { _useEffect } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mocks de componentes pesados para tornar o teste determinístico/leve
vi.mock('../components/AuthModal', () => ({
  default: ({ onSuccess }: any) => {
    return (
      <div data-testid="auth-mock">
        <button onClick={() => onSuccess('cliente@app.test', 'cliente')}>
          Auto Login
        </button>
      </div>
    );
  },
}));

// Mock do Wizard: ao montar, chama onSubmit com um JobData simples
vi.mock('../components/AIJobRequestWizard', () => ({
  default: ({ onSubmit, onClose }: any) => {
    const handleSubmit = () => {
      const jobData = {
        description: 'Instalar tomada',
        category: 'Eletricista',
        serviceType: 'personalizado',
        urgency: '3dias',
      };
      onSubmit(jobData);
    };
    return (
      <div data-testid="wizard-mock">
        <button onClick={handleSubmit}>Submit Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  },
}));

// Opcional: evitar carregamento de páginas pesadas que não usamos aqui
vi.mock('../components/ProviderDashboard', () => ({ default: () => <div>ProviderDashboardMock</div> }));
vi.mock('../components/AdminDashboard', () => ({ default: () => <div>AdminDashboardMock</div> }));

import App from '../App';
import * as API from '../services/api';

const user = userEvent.setup({ delay: null });

describe('App - Fluxo Criar Job (integração leve)', () => {
  let alertSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('feliz: cria job, faz matching e notifica prestadores', async () => {
    // Spies da API
    const createJobMock = vi.spyOn(API, 'createJob').mockResolvedValue({
      id: 'job-123',
      category: 'Eletricista',
      jobMode: 'normal',
      description: 'Instalar tomada',
      clientId: 'cliente@app.test',
      status: 'aberto',
      serviceType: 'personalizado',
      urgency: '3dias',
      createdAt: new Date().toISOString(),
    } as any);

    const matchProvidersMock = vi.spyOn(API, 'matchProvidersForJob').mockResolvedValue([
      { provider: { email: 'prov1@servio.ai', name: 'Provider 1' }, reason: 'alto score' },
      { provider: { email: 'prov2@servio.ai', name: 'Provider 2' }, reason: 'perto de você' },
    ] as any);

    const createNotificationMock = vi.spyOn(API, 'createNotification').mockResolvedValue({
      id: 'notif-1',
      userId: 'prov1@servio.ai',
      text: 'Novo serviço disponível',
      isRead: false,
      createdAt: new Date().toISOString(),
    } as any);

    render(<App />);

  // Abre modal de login e autentica manualmente via mock
    const loginBtn = await screen.findByTestId('header-login-button');
    await user.click(loginBtn);
    
    const authMock = await screen.findByTestId('auth-mock');
    const autoLoginBtn = within(authMock).getByRole('button', { name: /Auto Login/i });
    await user.click(autoLoginBtn);
    
    // Espera auth fechar
    await waitFor(() => {
      expect(screen.queryByTestId('auth-mock')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Garantir que login refletiu na UI
    await screen.findByText(/Olá,\s*cliente/i, {}, { timeout: 3000 });
    
    // Abrir wizard disparando o evento global utilizado no App
    const customEvent = new CustomEvent('open-wizard-from-chat', { detail: {
      description: 'Instalar tomada',
      category: 'Eletricista',
      serviceType: 'personalizado',
      urgency: '3dias',
    }} as any);
    window.dispatchEvent(customEvent as Event);
    
    // Aguarda o wizard mocado aparecer e clica submit
    const wizardMock = await screen.findByTestId('wizard-mock', {}, { timeout: 5000 });
    const submitBtn = within(wizardMock).getByRole('button', { name: /Submit Mock/i });
    await user.click(submitBtn);

    // Verifica chamadas da API - espera createJob primeiro
    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });
    
    // Espera matching ser chamado
    await waitFor(() => {
      expect(matchProvidersMock).toHaveBeenCalledWith('job-123');
    }, { timeout: 5000 });
    
    // Espera notificações serem criadas (top 5 matches, mas temos 2)
    await waitFor(() => {
      expect(createNotificationMock).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });

    // Verifica alert de sucesso com contagem de prestadores notificados
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
      const alertMsg = alertSpy.mock.calls.map((c: any[]) => String(c[0])).join('\n');
      expect(alertMsg).toMatch(/criado com sucesso|publicado/i);
      expect(alertMsg).toMatch(/2 prestadores/i);
    }, { timeout: 5000 });
  }, 30000);

  it('erro: alerta falha ao criar serviço e fecha wizard', async () => {
    vi.spyOn(API, 'createJob').mockRejectedValue(new Error('backend indisponível'));

    render(<App />);

  // Monta AuthModal via Header e autentica manualmente
    const loginBtn = await screen.findByTestId('header-login-button');
    await user.click(loginBtn);

  const authMock2 = await screen.findByTestId('auth-mock');
  const autoLoginBtn2 = within(authMock2).getByRole('button', { name: /Auto Login/i });
  await user.click(autoLoginBtn2);

  // Garantir que login refletiu na UI
  await screen.findByText(/Olá,\s*cliente/i);
  // Abrir wizard via evento global
  const customEvent2 = new CustomEvent('open-wizard-from-chat', { detail: {
    description: 'Instalar tomada',
    category: 'Eletricista',
    serviceType: 'personalizado',
    urgency: '3dias',
  }} as any);
  window.dispatchEvent(customEvent2 as Event);
    
    // Aguarda wizard e dispara submit
    const wizardMock = await screen.findByTestId('wizard-mock', {}, { timeout: 5000 });
    const submitBtn = within(wizardMock).getByRole('button', { name: /Submit Mock/i });
    await user.click(submitBtn);

    
  // Espera alert de erro
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/erro ao criar|indisponível/i));
    }, { timeout: 5000 });

    
  // Wizard fecha após erro
    await waitFor(() => {
  expect(screen.queryByTestId('wizard-mock')).not.toBeInTheDocument();
    });
  }, 20000);
});

