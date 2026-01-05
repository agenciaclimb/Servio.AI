import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminFinancials from '../../components/AdminFinancials';
import * as API from '../../services/api';

vi.mock('../../services/api');

describe('AdminFinancials', () => {
  const mockJobs = [
    {
      id: 'job1',
      status: 'concluido',
      title: 'Job 1',
      description: 'Test job 1',
      clientId: 'client1',
      createdAt: new Date(),
    },
    {
      id: 'job2',
      status: 'concluido',
      title: 'Job 2',
      description: 'Test job 2',
      clientId: 'client2',
      createdAt: new Date(),
    },
    {
      id: 'job3',
      status: 'aberto',
      title: 'Job 3',
      description: 'Test job 3',
      clientId: 'client3',
      createdAt: new Date(),
    },
  ];

  const mockProposals = [
    {
      id: 'proposal1',
      jobId: 'job1',
      providerId: 'provider1',
      price: 1000,
      status: 'aceita',
      description: 'Proposal 1',
      createdAt: new Date(),
    },
    {
      id: 'proposal2',
      jobId: 'job2',
      providerId: 'provider2',
      price: 2000,
      status: 'aceita',
      description: 'Proposal 2',
      createdAt: new Date(),
    },
    {
      id: 'proposal3',
      jobId: 'job3',
      providerId: 'provider3',
      price: 500,
      status: 'pendente',
      description: 'Proposal 3',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(API.fetchJobs).mockImplementation(() => new Promise(() => {}));
    vi.mocked(API.fetchProposals).mockImplementation(() => new Promise(() => {}));

    render(<AdminFinancials />);
    expect(screen.getByText('Carregando dados financeiros...')).toBeInTheDocument();
  });

  it('should load and display financial data', async () => {
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(API.fetchProposals).mockResolvedValue(mockProposals);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('GMV (Total Transacionado)')).toBeInTheDocument();
    expect(screen.getByText('Receita da Plataforma')).toBeInTheDocument();
    expect(screen.getByText('Total em Custódia (Escrow)')).toBeInTheDocument();
  });

  it('should calculate GMV correctly from completed jobs', async () => {
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(API.fetchProposals).mockResolvedValue(mockProposals);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    // GMV = 1000 + 2000 = 3000 (only completed jobs with accepted proposals)
    // Formatted as R$ 3.000,00
    expect(screen.getByText(/R\$\s*3\.000,00/)).toBeInTheDocument();
  });

  it('should calculate platform revenue as 15% of GMV', async () => {
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(API.fetchProposals).mockResolvedValue(mockProposals);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    // Platform revenue = 3000 * 0.15 = 450
    // Formatted as R$ 450,00
    expect(screen.getByText(/R\$\s*450,00/)).toBeInTheDocument();
  });

  it('should display stat cards with icons', async () => {
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(API.fetchProposals).mockResolvedValue(mockProposals);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('💰')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('should display escrow transactions table headers', async () => {
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(API.fetchProposals).mockResolvedValue(mockProposals);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Histórico de Transações de Custódia (Escrow)')).toBeInTheDocument();
    expect(screen.getByText('ID da Transação')).toBeInTheDocument();
    expect(screen.getByText('Job ID')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(API.fetchJobs).mockRejectedValue(new Error('API Error'));
    vi.mocked(API.fetchProposals).mockRejectedValue(new Error('API Error'));

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load financial data:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should only count completed jobs with accepted proposals for GMV', async () => {
    const jobsWithMixedStatuses = [
      ...mockJobs,
      {
        id: 'job4',
        status: 'concluido',
        title: 'Job 4',
        description: 'Test job 4',
        clientId: 'client4',
        createdAt: new Date(),
      },
    ];

    const proposalsWithMixedStatuses = [
      ...mockProposals,
      {
        id: 'proposal4',
        jobId: 'job4',
        providerId: 'provider4',
        price: 5000,
        status: 'pendente', // Not accepted, should not be counted
        description: 'Proposal 4',
        createdAt: new Date(),
      },
    ];

    vi.mocked(API.fetchJobs).mockResolvedValue(jobsWithMixedStatuses);
    vi.mocked(API.fetchProposals).mockResolvedValue(proposalsWithMixedStatuses);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    // GMV should still be 3000 (1000 + 2000), not 8000
    expect(screen.getByText(/R\$\s*3\.000,00/)).toBeInTheDocument();
  });

  it('should display zero GMV when no completed jobs with accepted proposals', async () => {
    const jobsWithNoCompleted = [
      {
        id: 'job1',
        status: 'aberto',
        title: 'Job 1',
        description: 'Test job 1',
        clientId: 'client1',
        createdAt: new Date(),
      },
    ];

    vi.mocked(API.fetchJobs).mockResolvedValue(jobsWithNoCompleted);
    vi.mocked(API.fetchProposals).mockResolvedValue([]);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    // GMV should be 0 (getAllByText because all 3 cards show R$ 0,00)
    const zeroValues = screen.getAllByText(/R\$\s*0,00/);
    expect(zeroValues.length).toBeGreaterThanOrEqual(3);
  });

  it('should calculate total in escrow correctly', async () => {
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs);
    vi.mocked(API.fetchProposals).mockResolvedValue(mockProposals);

    render(<AdminFinancials />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dados financeiros...')).not.toBeInTheDocument();
    });

    // Total in escrow should be R$ 0,00 since allEscrows is empty by default
    const escrowValues = screen.getAllByText(/R\$\s*0,00/);
    expect(escrowValues.length).toBeGreaterThan(0);
  });
});
