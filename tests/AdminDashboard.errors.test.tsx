import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../components/AdminDashboard';

vi.mock('../components/AdminAnalyticsDashboard', () => ({ default: () => <div /> }));
vi.mock('../components/AdminJobManagement', () => ({
  default: ({ onMediateClick }: any) => (
    <div data-testid="job-mgmt">
      <button
        onClick={() =>
          onMediateClick({ id: 'job123', clientId: 'cli@ex.com', providerId: 'prov@ex.com' })
        }
      >
        Mediate
      </button>
    </div>
  ),
}));
vi.mock('../components/AdminProviderManagement', () => ({ default: () => <div /> }));
vi.mock('../components/AdminFinancials', () => ({ default: () => <div /> }));
vi.mock('../components/AdminFraudAlerts', () => ({ default: () => <div /> }));
vi.mock('../components/DisputeDetailsModal', () => ({
  default: ({ dispute, onResolve, onClose }: any) => (
    <div data-testid="dispute-modal">
      <span>Dispute {dispute?.id}</span>
      <button
        onClick={() => onResolve(dispute.id, { outcome: 'cliente', reason: 'A favor do cliente' })}
      >
        Resolver
      </button>
      <button onClick={onClose}>Fechar</button>
    </div>
  ),
}));

const addToastMock = vi.fn();
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: addToastMock }),
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../services/api', () => ({
  fetchDisputes: vi.fn(),
  fetchUserById: vi.fn(),
  resolveDispute: vi.fn(),
}));
import * as API from '../services/api';

const adminUser = { email: 'admin@ex.com', name: 'Admin', type: 'admin' } as any;

describe('AdminDashboard – cenários de erro', () => {
  it('exibe toast de erro quando handleMediateClick falha', async () => {
    vi.mocked(API.fetchDisputes).mockRejectedValueOnce(new Error('fail'));
    render(<AdminDashboard user={adminUser} />);
    fireEvent.click(screen.getByTestId('admin-tab-jobs'));
    fireEvent.click(screen.getByText('Mediate'));
    await waitFor(() => expect(addToastMock).toHaveBeenCalled());
    const lastCall = addToastMock.mock.calls[addToastMock.mock.calls.length - 1];
    expect(lastCall[0]).toMatch(/Erro ao buscar dados da disputa/i);
  });

  it('exibe toast de erro ao falhar resolver disputa e fecha modal no finally', async () => {
    vi.mocked(API.fetchDisputes).mockResolvedValueOnce([
      {
        id: 'disp1',
        jobId: 'job123',
        initiatorId: 'client1',
        reason: 'teste',
        status: 'aberta',
        messages: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(API.fetchUserById).mockResolvedValueOnce({
      email: 'cli@ex.com',
      name: 'Cliente',
      type: 'cliente',
    } as any);
    vi.mocked(API.fetchUserById).mockResolvedValueOnce({
      email: 'prov@ex.com',
      name: 'Prestador',
      type: 'prestador',
    } as any);
    vi.mocked(API.resolveDispute).mockRejectedValueOnce(new Error('fail'));

    render(<AdminDashboard user={adminUser} />);
    fireEvent.click(screen.getByTestId('admin-tab-jobs'));
    fireEvent.click(screen.getByText('Mediate'));
    await waitFor(() => expect(screen.getByTestId('dispute-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Resolver'));
    await waitFor(() => expect(addToastMock).toHaveBeenCalled());
    expect(screen.queryByTestId('dispute-modal')).toBeNull();
  });
});
