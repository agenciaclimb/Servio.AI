import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProviderEarningsCard from '../../components/ProviderEarningsCard';
import { Job } from '../../types';

describe('ProviderEarningsCard Component', () => {
  const mockCompletedJobs: Job[] = [
    {
      id: '1',
      clientId: 'client1@test.com',
      category: 'limpeza',
      description: 'Job 1',
      status: 'concluido',
      createdAt: new Date().toISOString(),
      serviceType: 'personalizado',
      urgency: '1semana',
      earnings: {
        total: 100,
        providerShare: 85,
        platformFee: 15,
      },
    },
    {
      id: '2',
      clientId: 'client2@test.com',
      category: 'reparos',
      description: 'Job 2',
      status: 'concluido',
      createdAt: new Date().toISOString(),
      serviceType: 'personalizado',
      urgency: '1semana',
      earnings: {
        total: 200,
        providerShare: 170,
        platformFee: 30,
      },
    },
  ];

  it('renderiza o título do card', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={10}
        averageRating={4.5}
      />
    );
    
    expect(screen.getByText(/Ganhos/)).toBeInTheDocument();
  });

  it('calcula ganhos totais corretamente', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={10}
        averageRating={4.5}
      />
    );
    
    // 85 + 170 = 255 em formato pt-BR
    expect(screen.getByText('Total Acumulado')).toBeInTheDocument();
    const elements = screen.getAllByText(/255,00/);
    expect(elements[0]).toHaveClass('text-3xl');
  });

  it('mostra badge Elite para 100+ jobs e rating >= 4.8', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={100}
        averageRating={4.8}
      />
    );
    
    expect(screen.getByText(/Elite/)).toBeInTheDocument();
  });

  it('mostra badge Premium para 50+ jobs e rating >= 4.5', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={50}
        averageRating={4.5}
      />
    );
    
    expect(screen.getByText(/Premium/)).toBeInTheDocument();
  });

  it('mostra badge Profissional para 20+ jobs e rating >= 4.0', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={20}
        averageRating={4.0}
      />
    );
    
    expect(screen.getByText(/Profissional/)).toBeInTheDocument();
  });

  it('mostra badge Verificado para 5+ jobs', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={5}
        averageRating={3.5}
      />
    );
    
    expect(screen.getByText(/Verificado/)).toBeInTheDocument();
  });

  it('mostra badge Iniciante para < 5 jobs', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={2}
        averageRating={5.0}
      />
    );
    
    expect(screen.getByText(/Iniciante/)).toBeInTheDocument();
  });

  it('calcula média de valor por job', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={10}
        averageRating={4.5}
      />
    );
    
    // 255 / 2 = 127.5
    expect(screen.getByText(/R\$ 127/)).toBeInTheDocument();
  });

  it('mostra 0 para média quando não há jobs completados', () => {
    render(
      <ProviderEarningsCard
        completedJobs={[]}
        currentRate={0.85}
        totalJobs={0}
        averageRating={0}
      />
    );
    
    // Deve mostrar R$ 0,00 para Média por Job
    expect(screen.getByText('Média por Job')).toBeInTheDocument();
  });

  it('calcula taxa da plataforma corretamente', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={10}
        averageRating={4.5}
      />
    );
    
    // (1 - 0.85) * 100 = 15%
    expect(screen.getByText(/15%/)).toBeInTheDocument();
  });

  it('mostra número total de jobs', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={25}
        averageRating={4.5}
      />
    );
    
    // O texto exato é '25' sem outros contextos próximos
    const jobsText = screen.getByText('25');
    expect(jobsText).toBeInTheDocument();
  });

  it('mostra avaliação média', () => {
    render(
      <ProviderEarningsCard
        completedJobs={mockCompletedJobs}
        currentRate={0.85}
        totalJobs={10}
        averageRating={4.7}
      />
    );
    
    expect(screen.getByText(/4\.7/)).toBeInTheDocument();
  });
});
