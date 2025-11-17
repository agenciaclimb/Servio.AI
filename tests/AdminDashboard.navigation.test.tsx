import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, _fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import { User } from '../types';

// Mock dos subcomponentes para isolar o teste de navegação (alinha com os imports reais)
vi.mock('../components/AdminAnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-content">Analytics Content</div>,
}));
vi.mock('../components/AdminJobManagement', () => ({
  default: () => <div data-testid="jobs-content">Jobs Content</div>,
}));
vi.mock('../components/AdminProviderManagement', () => ({
  default: () => <div data-testid="providers-content">Providers Content</div>,
}));
vi.mock('../components/AdminFinancials', () => ({
  default: () => <div data-testid="financials-content">Financials Content</div>,
}));
vi.mock('../components/AdminFraudAlerts', () => ({
  default: () => <div data-testid="fraud-content">Fraud Content</div>,
}));

// Mock do hook de dados para evitar chamadas de API reais
vi.mock('../hooks/useAdminDashboardData', () => ({
  useAdminDashboardData: () => ({
    data: {
      jobs: [],
      users: [],
      proposals: [],
      disputes: [],
      fraudAlerts: [],
    },
    isLoading: false,
  }),
}));

const mockAdminUser: User = {
  email: 'admin@servio.ai',
  name: 'Admin',
  type: 'admin',
  status: 'ativo',
  memberSince: new Date().toISOString(),
  location: 'Matrix',
  bio: 'Admin user',
};

describe('AdminDashboard Tab Navigation', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <AdminDashboard user={mockAdminUser} />
      </BrowserRouter>
    );
  });

  it('deve renderizar a aba "Analytics" como padrão e exibir seu conteúdo', () => {
    const analyticsTab = screen.getByTestId('admin-tab-analytics');
    expect(analyticsTab).toHaveClass('border-blue-500'); // Verifica se está visualmente ativa
    expect(screen.getByTestId('analytics-content')).toBeInTheDocument();
    expect(screen.queryByTestId('jobs-content')).not.toBeInTheDocument();
  });

  it('deve navegar para a aba "Jobs" e exibir seu conteúdo ao ser clicada', async () => {
    const user = userEvent.setup();
    const jobsTab = screen.getByTestId('admin-tab-jobs');

    await user.click(jobsTab);

    await waitFor(() => {
      expect(jobsTab).toHaveClass('border-blue-500');
      expect(screen.getByTestId('jobs-content')).toBeInTheDocument();
      expect(screen.queryByTestId('analytics-content')).not.toBeInTheDocument();
    });
  });

  it('deve navegar entre múltiplas abas corretamente', async () => {
    const user = userEvent.setup();

    // Vai para Providers
    await user.click(screen.getByTestId('admin-tab-providers'));
    await waitFor(() => expect(screen.getByTestId('providers-content')).toBeInTheDocument());

    // Volta para Analytics
    await user.click(screen.getByTestId('admin-tab-analytics'));
    await waitFor(() => expect(screen.getByTestId('analytics-content')).toBeInTheDocument());
  });
});
