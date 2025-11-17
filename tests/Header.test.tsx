import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Header from '../components/Header';
import type { User, Notification } from '../types';

const mockUser: User = {
  email: 'test@servio.ai',
  name: 'Test User',
  type: 'cliente',
  bio: '',
  location: 'São Paulo, SP',
  status: 'ativo',
};

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'test@servio.ai',
    text: 'Nova proposta recebida',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

describe('Header', () => {
  const defaultProps = {
    user: null,
    notifications: [],
    onLoginClick: vi.fn(),
    onRegisterClick: vi.fn(),
    onLogoutClick: vi.fn(),
    onSetView: vi.fn(),
    onMarkAsRead: vi.fn(),
    onMarkAllAsRead: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza logo e botões quando não há usuário logado', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('SERVIO.AI')).toBeInTheDocument();
    expect(screen.getByText('BETA')).toBeInTheDocument();
    expect(screen.getByTestId('header-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('header-register-button')).toBeInTheDocument();
  });

  it('chama onLoginClick ao clicar em "Entrar"', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Header {...defaultProps} />);

    await user.click(screen.getByTestId('header-login-button'));
    expect(defaultProps.onLoginClick).toHaveBeenCalledWith('cliente');
  });

  it('chama onRegisterClick ao clicar em "Cadastre-se"', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Header {...defaultProps} />);

    await user.click(screen.getByTestId('header-register-button'));
    expect(defaultProps.onRegisterClick).toHaveBeenCalledWith('cliente');
  });

  it('renderiza nome do usuário e botão "Sair" quando logado', () => {
    render(<Header {...defaultProps} user={mockUser} />);

    expect(screen.getByText(/Olá, Test User!/i)).toBeInTheDocument();
    expect(screen.getByTestId('header-logout-button')).toBeInTheDocument();
    expect(screen.queryByTestId('header-login-button')).not.toBeInTheDocument();
  });

  it('chama onLogoutClick ao clicar em "Sair"', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Header {...defaultProps} user={mockUser} />);

    await user.click(screen.getByTestId('header-logout-button'));
    expect(defaultProps.onLogoutClick).toHaveBeenCalledTimes(1);
  });

  it('chama onSetView ao clicar no logo', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Header {...defaultProps} />);

    const logo = screen.getByText('SERVIO.AI');
    await user.click(logo);
    expect(defaultProps.onSetView).toHaveBeenCalledWith('home');
  });

  it('exibe NotificationsBell quando há notificações e usuário está logado', () => {
    render(<Header {...defaultProps} user={mockUser} notifications={mockNotifications} />);

    // NotificationsBell deve estar presente (ícone de sino)
    const bellButton = screen.getByLabelText('View notifications');
    expect(bellButton).toBeInTheDocument();
  });

  it('renderiza link "Encontrar Profissionais"', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Header {...defaultProps} />);

    const link = screen.getByText('Encontrar Profissionais');
    expect(link).toBeInTheDocument();
    await user.click(link);
    expect(defaultProps.onSetView).toHaveBeenCalledWith('find-providers');
  });

  it('renderiza link "Seja um Prestador" quando não logado', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Header {...defaultProps} />);

    const link = screen.getByText('Seja um Prestador');
    expect(link).toBeInTheDocument();
    await user.click(link);
    expect(defaultProps.onSetView).toHaveBeenCalledWith('provider-landing');
  });

  it('não renderiza link "Seja um Prestador" quando usuário está logado', () => {
    render(<Header {...defaultProps} user={mockUser} />);

    expect(screen.queryByText('Seja um Prestador')).not.toBeInTheDocument();
  });
});
