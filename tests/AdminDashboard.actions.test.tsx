import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../components/AdminDashboard';

// Mocks de subcomponentes para isolar orquestração de abas e fluxo de mediação
vi.mock('../components/AdminAnalyticsDashboard', () => ({ default: () => <div data-testid="tab-content-analytics">Analytics</div> }));
vi.mock('../components/AdminJobManagement', () => ({ default: ({ onMediateClick }: any) => <div data-testid="tab-content-jobs"><button onClick={()=> onMediateClick({ id:'job123', clientId:'cli@ex.com', providerId:'prov@ex.com' })}>Mediate</button></div> }));
vi.mock('../components/AdminProviderManagement', () => ({ default: () => <div data-testid="tab-content-providers">Providers</div> }));
vi.mock('../components/AdminFinancials', () => ({ default: () => <div data-testid="tab-content-financials">Financials</div> }));
vi.mock('../components/AdminFraudAlerts', () => ({ default: () => <div data-testid="tab-content-fraud">Fraud</div> }));
vi.mock('../components/DisputeDetailsModal', () => ({ default: ({ dispute, onResolve, onClose }: any) => (
  <div data-testid="dispute-modal">
    <span>Dispute {dispute?.id}</span>
    <button onClick={()=> onResolve(dispute.id, { outcome:'cliente', reason:'A favor do cliente' })}>Resolver</button>
    <button onClick={onClose}>Fechar</button>
  </div>
) }));

// API mocks
vi.mock('../services/api', () => ({
  fetchDisputes: vi.fn(async () => ([{ id:'disp1', jobId:'job123', status:'aberta' }])),
  fetchUserById: vi.fn(async (email:string) => ({ email, name: email.includes('cli')?'Cliente':'Prestador', type: email.includes('cli')?'cliente':'prestador' })),
  resolveDispute: vi.fn(async ()=> ({})),
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

const adminUser = {
  email:'admin@ex.com',
  name:'Admin',
  type:'admin',
} as any;

describe('AdminDashboard – abas e mediação de disputas', () => {
  it('alternar entre todas as abas', () => {
    render(<AdminDashboard user={adminUser} />);
    // Analytics padrão
    expect(screen.getByTestId('tab-content-analytics')).toBeInTheDocument();
    const tabs = ['jobs','providers','financials','fraud','analytics'];
    for (const t of tabs) {
      fireEvent.click(screen.getByTestId(`admin-tab-${t}`));
      expect(screen.getByTestId(`tab-content-${t}`)).toBeInTheDocument();
    }
  });

  it('fluxo de mediação abre modal e resolve disputa', async () => {
    render(<AdminDashboard user={adminUser} />);
    // Ir para aba jobs
    fireEvent.click(screen.getByTestId('admin-tab-jobs'));
    // Dispara mediação
    fireEvent.click(screen.getByText('Mediate'));
    await waitFor(()=> expect(screen.getByTestId('dispute-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Resolver'));
    await waitFor(()=> expect(screen.queryByTestId('dispute-modal')).toBeNull());
  });
});
