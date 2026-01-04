import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationSettings from '../../src/components/NotificationSettings';

// Mock the hook
vi.mock('../../src/hooks/useNotificationSettings', () => ({
  useNotificationSettings: vi.fn(),
}));

describe('NotificationSettings', () => {
  const mockUpdateSetting = vi.fn();

  const defaultSettings = [
    { id: 'job_updates', enabled: true },
    { id: 'proposal_updates', enabled: true },
    { id: 'payment_updates', enabled: false },
    { id: 'message_updates', enabled: true },
    { id: 'follow_up_reminders', enabled: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification settings title', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    expect(screen.getByText('Configurações de Notificação')).toBeInTheDocument();
  });

  it('renders all notification options', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    expect(screen.getByText('Atualizações de Trabalhos')).toBeInTheDocument();
    expect(screen.getByText('Atualizações de Propostas')).toBeInTheDocument();
    expect(screen.getByText('Atualizações de Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('Novas Mensagens')).toBeInTheDocument();
    expect(screen.getByText('Lembretes de Follow-up')).toBeInTheDocument();
  });

  it('renders setting descriptions', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    expect(screen.getByText(/Notificações sobre status de trabalhos/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmações de pagamento/i)).toBeInTheDocument();
  });

  it('renders checkboxes with correct initial state', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(5);

    // Check that some are checked and some are not based on defaultSettings
    const checkedCount = checkboxes.filter((cb) => (cb as HTMLInputElement).checked).length;
    const uncheckedCount = checkboxes.filter((cb) => !(cb as HTMLInputElement).checked).length;
    expect(checkedCount).toBe(3); // job_updates, proposal_updates, message_updates
    expect(uncheckedCount).toBe(2); // payment_updates, follow_up_reminders
  });

  it('calls updateSetting when checkbox is toggled', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockUpdateSetting).toHaveBeenCalledWith('job_updates', { enabled: false });
  });

  it('enables previously disabled setting', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    // Find the unchecked checkbox (payment_updates is at index 2)
    const checkboxes = screen.getAllByRole('checkbox');
    const paymentCheckbox = checkboxes[2];
    expect((paymentCheckbox as HTMLInputElement).checked).toBe(false);

    fireEvent.click(paymentCheckbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('payment_updates', { enabled: true });
  });

  it('renders icons for each setting', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: defaultSettings,
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    // Check for icon emojis
    expect(screen.getByText('🛠️')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
    expect(screen.getByText('💳')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('⏰')).toBeInTheDocument();
  });

  it('handles empty settings gracefully', async () => {
    const { useNotificationSettings } = await import('../../src/hooks/useNotificationSettings');
    vi.mocked(useNotificationSettings).mockReturnValue({
      settings: [],
      updateSetting: mockUpdateSetting,
    });

    render(<NotificationSettings />);

    // Should still render the component structure
    expect(screen.getByText('Configurações de Notificação')).toBeInTheDocument();
    // Checkboxes should default to true when setting not found
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.every((cb) => (cb as HTMLInputElement).checked)).toBe(true);
  });
});
