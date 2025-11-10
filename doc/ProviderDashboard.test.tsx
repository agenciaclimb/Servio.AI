import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProviderDashboard from '../components/ProviderDashboard';
import { MOCK_JOBS, MOCK_USERS, MOCK_PROPOSALS } from '../mockData';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchOpenJobs: vi.fn().mockResolvedValue(MOCK_JOBS.filter(j => j.status === 'ativo')),
    fetchJobsForProvider: vi.fn().mockResolvedValue(MOCK_JOBS.filter(j => j.providerId === 'prestador@servio.ai')),
    fetchProposalsForProvider: vi.fn().mockResolvedValue(MOCK_PROPOSALS.filter(p => p.providerId === 'prestador@servio.ai')),
  };
});

const providerUser = MOCK_USERS.find(u => u.email === 'prestador@servio.ai')!;

describe('ProviderDashboard', () => {
  it('renderiza as abas corretamente', async () => {
    render(<ProviderDashboard user={providerUser} />);
    await screen.findByText('Oportunidades');
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Meus Serviços')).toBeInTheDocument();
    expect(screen.getByText('Ganhos')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('exibe jobs na aba "Oportunidades"', async () => {
    render(<ProviderDashboard user={providerUser} />);
    const job = MOCK_JOBS.find(j => j.status === 'ativo')!;
    expect(await screen.findByText(job.description)).toBeInTheDocument();
  });

  it('exibe os serviços aceitos na aba "Meus Serviços"', async () => {
    render(<ProviderDashboard user={providerUser} />);
    fireEvent.click(screen.getByText('Meus Serviços'));
    const myJob = MOCK_JOBS.find(j => j.providerId === 'prestador@servio.ai')!;
    expect(await screen.findByText(myJob.description)).toBeInTheDocument();
  });

  it('abre o modal de proposta ao clicar em "Enviar Proposta"', async () => {
    render(<ProviderDashboard user={providerUser} />);
    const proposalButtons = await screen.findAllByText('Enviar Proposta');
    fireEvent.click(proposalButtons[0]);
    expect(await screen.findByText('Sua proposta para o serviço')).toBeInTheDocument();
  });

  it('mostra o card de ganhos na aba "Ganhos"', async () => {
    render(<ProviderDashboard user={providerUser} />);
    fireEvent.click(screen.getByText('Ganhos'));
    expect(await screen.findByText('Total Acumulado')).toBeInTheDocument();
    expect(screen.getByText('Ganhos do Mês')).toBeInTheDocument();
  });
});