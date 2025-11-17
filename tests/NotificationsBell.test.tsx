import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsBell from '../components/NotificationsBell';

const baseNotifications = [
  { id: 'n1', userId: 'user@test.com', text: 'Nova proposta recebida', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n2', userId: 'user@test.com', text: 'Pagamento confirmado', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n3', userId: 'user@test.com', text: 'Job concluído', isRead: true, createdAt: new Date().toISOString() },
];

describe('NotificationsBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe badge com contador de não lidas e abre o popover ao clicar', async () => {
    const onMarkAsRead = vi.fn();
    const onMarkAllAsRead = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationsBell
        notifications={baseNotifications as any}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
      />
    );

    // Badge com 2 não lidas
    expect(screen.getByText('2')).toBeInTheDocument();

    // Abre popover
    const bell = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bell);

    await waitFor(() => {
      expect(screen.getByText('Notificações')).toBeInTheDocument();
    });

    // Clica em uma notificação para marcar como lida
    await user.click(screen.getByText(/Nova proposta recebida/i));
    expect(onMarkAsRead).toHaveBeenCalledWith('n1');
  });

  it('marca todas como lidas e fecha o popover', async () => {
    const onMarkAsRead = vi.fn();
    const onMarkAllAsRead = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationsBell
        notifications={baseNotifications as any}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
      />
    );

    const bell = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bell);

    const markAllBtn = await screen.findByRole('button', { name: /Marcar todas como lidas/i });
    await user.click(markAllBtn);

    expect(onMarkAllAsRead).toHaveBeenCalled();

    // Popover deve fechar
    await waitFor(() => {
      expect(screen.queryByText('Notificações')).not.toBeInTheDocument();
    });
  });

  it('fecha o popover ao clicar fora', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationsBell
        notifications={baseNotifications as any}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />
    );

    const bell = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bell);

    await waitFor(() => {
      expect(screen.getByText('Notificações')).toBeInTheDocument();
    });

    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Notificações')).not.toBeInTheDocument();
    });
  });
});
