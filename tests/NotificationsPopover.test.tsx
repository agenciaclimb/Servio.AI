import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPopover from '../components/NotificationsPopover';

const now = new Date('2025-11-12T10:00:00.000Z');

const makeNoti = (overrides: Partial<any> = {}) => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  userId: 'user@test.com',
  text: overrides.text ?? 'Mensagem',
  isRead: overrides.isRead ?? false,
  createdAt: overrides.createdAt ?? now.toISOString(),
});

describe('NotificationsPopover', () => {
  it('renderiza lista e botão de marcar todas quando há não lidas', () => {
    const notis = [makeNoti({ text: 'N1' }), makeNoti({ text: 'N2', isRead: true })];

    render(
      <NotificationsPopover
        notifications={notis as any}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />
    );

    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('N1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marcar todas como lidas/i })).toBeInTheDocument();
  });

  it('exibe estado vazio quando não há notificações', () => {
    render(
      <NotificationsPopover
        notifications={[] as any}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />
    );

    expect(screen.getByText(/Você não tem nenhuma notificação/i)).toBeInTheDocument();
  });

  it('formata timeAgo corretamente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    render(
      <NotificationsPopover
        notifications={[
          makeNoti({ text: 'A', createdAt: fiveMinAgo }),
          makeNoti({ text: 'B', createdAt: twoHoursAgo }),
        ] as any}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />
    );

    expect(screen.getByText(/há 5 min/i)).toBeInTheDocument();
    expect(screen.getByText(/há 2h/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('aciona onMarkAsRead ao clicar em item', async () => {
    const onMark = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationsPopover
        notifications={[makeNoti({ text: 'Clique aqui' })] as any}
        onMarkAsRead={onMark}
        onMarkAllAsRead={vi.fn()}
      />
    );

    await user.click(screen.getByText(/Clique aqui/i));
    expect(onMark).toHaveBeenCalled();
  });
});
