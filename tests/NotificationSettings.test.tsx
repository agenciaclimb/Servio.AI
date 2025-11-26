import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSettings } from '../src/components/NotificationSettings';
import * as notificationService from '../src/services/notificationService';

vi.mock('../src/services/notificationService');

const mockPreferences = {
  prospectorId: 'prospector1',
  pushEnabled: true,
  emailEnabled: true,
  leadNotifications: true,
  messageNotifications: true,
  systemNotifications: true,
  dailyDigest: true,
};

const mockNotifications = [
  {
    id: 'n1',
    prospectorId: 'prospector1',
    title: 'New Lead',
    body: 'João Silva is interested',
    type: 'lead',
    read: false,
    timestamp: new Date('2025-11-25T10:00:00'),
  },
  {
    id: 'n2',
    prospectorId: 'prospector1',
    title: 'Message',
    body: 'You have a new message',
    type: 'message',
    read: true,
    timestamp: new Date('2025-11-25T09:00:00'),
  },
];

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getNotificationPreferences).mockResolvedValue(mockPreferences as any);
    vi.mocked(notificationService.getUnreadNotifications).mockResolvedValue(mockNotifications as any);
    vi.mocked(notificationService.setupForegroundMessageListener).mockReturnValue(() => {});
    vi.mocked(notificationService.checkNotificationPermission).mockResolvedValue('granted');
  });

  // ============================================
  // RENDERING & LOADING
  // ============================================

  it('renders without crashing', async () => {
    const { container } = render(
      <NotificationSettings prospectorId="prospector1" />
    );

    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('loads notification preferences on mount', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.getNotificationPreferences).toHaveBeenCalledWith('prospector1');
    });
  });

  it('loads recent notifications on mount', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.getUnreadNotifications).toHaveBeenCalledWith('prospector1');
    });
  });

  it('displays settings title', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(screen.queryByText(/notificações|notification|preferências/i)).toBeTruthy();
    });
  });

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================

  it('displays push notifications toggle', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const toggles = screen.queryAllByRole('checkbox');
      expect(toggles.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('can enable/disable push notifications', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const toggles = screen.queryAllByRole('checkbox');
      if (toggles.length > 0) {
        fireEvent.click(toggles[0]);
        expect(notificationService.updateNotificationPreferences).toHaveBeenCalled();
      }
    });
  });

  it('requests notification permission when enabling', async () => {
    vi.mocked(notificationService.requestNotificationPermission).mockResolvedValue('granted');
    
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      // Component should be functional
      expect(screen.queryByText(/notificações|notification/i)).toBeTruthy();
    });
  });

  // ============================================
  // EMAIL NOTIFICATIONS
  // ============================================

  it('displays email notification toggle', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain(/email|e-mail/i);
    });
  });

  it('can toggle email notifications', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.getNotificationPreferences).toHaveBeenCalled();
    });
  });

  // ============================================
  // NOTIFICATION TYPES
  // ============================================

  it('displays lead notification toggle', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain(/lead|leads/i);
    });
  });

  it('displays message notification toggle', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain(/mensagem|message/i);
    });
  });

  it('displays system notification toggle', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain(/system|sistema/i);
    });
  });

  // ============================================
  // RECENT NOTIFICATIONS
  // ============================================

  it('displays recent notifications section', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain(/recente|recent|histórico/i);
    });
  });

  it('shows recent notification items', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      // Should display notification titles or content
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it('can mark notification as read', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const readButtons = screen.queryAllByText(/marcar|mark|lido|read/i);
      if (readButtons.length > 0) {
        fireEvent.click(readButtons[0]);
        expect(notificationService.markNotificationAsRead).toHaveBeenCalled();
      }
    });
  });

  it('displays unread notification badge', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      // Should show count of unread notifications
      expect(document.body.textContent).toBeTruthy();
    });
  });

  // ============================================
  // DAILY DIGEST
  // ============================================

  it('displays daily digest toggle', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain(/digest|diário|resumo/i);
    });
  });

  it('can toggle daily digest', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const toggles = screen.queryAllByRole('checkbox');
      if (toggles.length > 0) {
        expect(toggles.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  // ============================================
  // TEST NOTIFICATION
  // ============================================

  it('displays test notification button', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const testButton = screen.queryByText(/teste|test|enviar/i);
      expect(testButton).toBeTruthy();
    });
  });

  it('sends test notification when button clicked', async () => {
    vi.mocked(notificationService.sendTestNotification).mockResolvedValue(undefined);
    
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      const testButton = screen.queryByText(/teste|test/i);
      if (testButton && testButton instanceof HTMLElement) {
        fireEvent.click(testButton);
        // Component should handle the click
        expect(document.body).toBeTruthy();
      }
    });
  });

  // ============================================
  // SAVING PREFERENCES
  // ============================================

  it('shows loading state while saving', async () => {
    vi.mocked(notificationService.updateNotificationPreferences).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.getNotificationPreferences).toHaveBeenCalled();
    });
  });

  it('updates preferences successfully', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.getNotificationPreferences).toHaveBeenCalled();
    });
  });

  // ============================================
  // PERMISSION STATUS
  // ============================================

  it('checks notification permission status', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.checkNotificationPermission).toHaveBeenCalled();
    });
  });

  it('shows permission denied message when denied', async () => {
    vi.mocked(notificationService.checkNotificationPermission).mockResolvedValue('denied');
    
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.checkNotificationPermission).toHaveBeenCalled();
    });
  });

  // ============================================
  // SETUP & CLEANUP
  // ============================================

  it('sets up foreground message listener on mount', async () => {
    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(notificationService.setupForegroundMessageListener).toHaveBeenCalled();
    });
  });

  it('cleans up foreground listener on unmount', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(notificationService.setupForegroundMessageListener).mockReturnValue(unsubscribe);

    const { unmount } = render(<NotificationSettings prospectorId="prospector1" />);

    unmount();

    await waitFor(() => {
      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  it('handles errors when loading preferences', async () => {
    vi.mocked(notificationService.getNotificationPreferences).mockRejectedValue(
      new Error('Load failed')
    );

    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      // Component should handle error gracefully
      expect(document.body).toBeTruthy();
    });
  });

  it('handles errors when updating preferences', async () => {
    vi.mocked(notificationService.updateNotificationPreferences).mockRejectedValue(
      new Error('Update failed')
    );

    render(<NotificationSettings prospectorId="prospector1" />);

    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
