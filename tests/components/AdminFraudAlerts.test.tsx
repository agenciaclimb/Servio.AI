import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminFraudAlerts from '../../components/AdminFraudAlerts';
import * as API from '../../services/api';

vi.mock('../../services/api');

describe('AdminFraudAlerts', () => {
  const mockUsers = [
    {
      email: 'provider1@test.com',
      name: 'Provider One',
      role: 'prestador',
      status: 'ativo',
    },
    {
      email: 'provider2@test.com',
      name: 'Provider Two',
      role: 'prestador',
      status: 'ativo',
    },
  ];

  const mockAlerts = [
    {
      id: 'alert1',
      providerId: 'provider1@test.com',
      riskScore: 85,
      reason: 'Multiple canceled jobs',
      status: 'novo',
      createdAt: new Date('2024-01-15T10:00:00'),
    },
    {
      id: 'alert2',
      providerId: 'provider2@test.com',
      riskScore: 92,
      reason: 'Suspicious activity pattern',
      status: 'revisado',
      createdAt: new Date('2024-01-16T14:30:00'),
    },
    {
      id: 'alert3',
      providerId: 'provider3@test.com',
      riskScore: 75,
      reason: 'High dispute rate',
      status: 'resolvido',
      createdAt: new Date('2024-01-17T09:15:00'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(API.fetchSentimentAlerts).mockImplementation(() => new Promise(() => {}));
    vi.mocked(API.fetchAllUsers).mockImplementation(() => new Promise(() => {}));

    render(<AdminFraudAlerts />);
    expect(screen.getByText('Carregando alertas...')).toBeInTheDocument();
  });

  it('should load and display fraud alerts', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Multiple canceled jobs')).toBeInTheDocument();
    expect(screen.getByText('Suspicious activity pattern')).toBeInTheDocument();
    expect(screen.getByText('High dispute rate')).toBeInTheDocument();
  });

  it('should display empty state when no alerts', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue([]);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Tudo Certo!')).toBeInTheDocument();
    expect(screen.getByText('Nenhum alerta de fraude foi gerado.')).toBeInTheDocument();
  });

  it('should display provider names correctly', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Provider One')).toBeInTheDocument();
    expect(screen.getByText('Provider Two')).toBeInTheDocument();
  });

  it('should display providerId when provider not found', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    // provider3@test.com not in mockUsers
    expect(screen.getByText('provider3@test.com')).toBeInTheDocument();
  });

  it('should display risk scores correctly', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should display status badges correctly', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    const statuses = screen.getAllByText(/novo|revisado|resolvido/);
    expect(statuses.length).toBeGreaterThanOrEqual(3);
  });

  it('should show "Marcar como Revisado" button for novo alerts', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Marcar como Revisado')).toBeInTheDocument();
  });

  it('should show "Marcar como Resolvido" button for revisado alerts', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Marcar como Resolvido')).toBeInTheDocument();
  });

  it('should not show action buttons for resolvido alerts', async () => {
    const resolvidoAlerts = [
      {
        id: 'alert1',
        providerId: 'provider1@test.com',
        riskScore: 85,
        reason: 'Resolved issue',
        status: 'resolvido',
        createdAt: new Date('2024-01-15T10:00:00'),
      },
    ];

    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(resolvidoAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Marcar como Revisado')).not.toBeInTheDocument();
    expect(screen.queryByText('Marcar como Resolvido')).not.toBeInTheDocument();
  });

  it('should update alert status to revisado when clicking button', async () => {
    const user = userEvent.setup();
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue([mockAlerts[0]]);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    const reviewButton = screen.getByText('Marcar como Revisado');
    await user.click(reviewButton);

    // Button should disappear after status change
    await waitFor(() => {
      expect(screen.queryByText('Marcar como Revisado')).not.toBeInTheDocument();
    });
  });

  it('should update alert status to resolvido when clicking button', async () => {
    const user = userEvent.setup();
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue([mockAlerts[1]]);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    const resolveButton = screen.getByText('Marcar como Resolvido');
    await user.click(resolveButton);

    // Button should disappear after status change
    await waitFor(() => {
      expect(screen.queryByText('Marcar como Resolvido')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(API.fetchSentimentAlerts).mockRejectedValue(new Error('API Error'));
    vi.mocked(API.fetchAllUsers).mockRejectedValue(new Error('API Error'));

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load fraud alerts data:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should display formatted dates correctly', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    // Check if date formatting is present (just verify dates are rendered)
    const dates = screen.getAllByText(/\/2024/);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('should display table headers correctly', async () => {
    vi.mocked(API.fetchSentimentAlerts).mockResolvedValue(mockAlerts);
    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers);

    render(<AdminFraudAlerts />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando alertas...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Prestador')).toBeInTheDocument();
    expect(screen.getByText('Risco')).toBeInTheDocument();
    expect(screen.getByText('Motivo')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });
});
