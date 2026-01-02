import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderJobCard from '../../components/ProviderJobCard';
import { Job, User } from '../../types';

// Mock JobTimeline component
vi.mock('../../components/JobTimeline', () => ({
  default: () => <div>JobTimeline</div>,
}));

describe('ProviderJobCard Component', () => {
  const mockJob: Job = {
    id: 'job1',
    clientId: 'client@test.com',
    category: 'reparos',
    description: 'Consertar vazamento na pia da cozinha',
    status: 'agendado',
    createdAt: new Date().toISOString(),
    serviceType: 'personalizado',
    urgency: '1semana',
  };

  const mockClient: User = {
    name: 'Carlos Silva',
    email: 'client@test.com',
    role: 'cliente',
  };

  it('renderiza categoria do job', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText('reparos')).toBeInTheDocument();
  });

  it('renderiza nome do cliente', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Carlos Silva/)).toBeInTheDocument();
  });

  it('mostra clientId quando client não está disponível', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText(/client@test.com/)).toBeInTheDocument();
  });

  it('renderiza descrição do job', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText(/vazamento na pia/)).toBeInTheDocument();
  });

  it('renderiza componente JobTimeline', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText('JobTimeline')).toBeInTheDocument();
  });

  it('mostra botão "Estou a Caminho" quando status é agendado', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Estou a Caminho/)).toBeInTheDocument();
  });

  it('chama onUpdateStatus com status "a_caminho" ao clicar', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={onUpdateStatus}
      />
    );
    
    await user.click(screen.getByText(/Estou a Caminho/));
    
    expect(onUpdateStatus).toHaveBeenCalledWith('job1', 'a_caminho');
  });

  it('mostra botão "Iniciar Serviço" quando status é a_caminho', () => {
    const onTheWayJob = { ...mockJob, status: 'a_caminho' as const };
    render(
      <ProviderJobCard
        job={onTheWayJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText(/Iniciar Serviço/)).toBeInTheDocument();
  });

  it('chama onUpdateStatus com status "em_progresso" ao clicar em Iniciar', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    const onTheWayJob = { ...mockJob, status: 'a_caminho' as const };
    render(
      <ProviderJobCard
        job={onTheWayJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={onUpdateStatus}
      />
    );
    
    await user.click(screen.getByText(/Iniciar Serviço/));
    
    expect(onUpdateStatus).toHaveBeenCalledWith('job1', 'em_progresso');
  });

  it('mostra botão "Ver Disputa" quando status é em_disputa', () => {
    const disputeJob = { ...mockJob, status: 'em_disputa' as const };
    render(
      <ProviderJobCard
        job={disputeJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText('Ver Disputa')).toBeInTheDocument();
  });

  it('chama onChat ao clicar em "Ver Disputa"', async () => {
    const user = userEvent.setup();
    const onChat = vi.fn();
    const disputeJob = { ...mockJob, status: 'em_disputa' as const };
    render(
      <ProviderJobCard
        job={disputeJob}
        client={mockClient}
        onChat={onChat}
        onUpdateStatus={vi.fn()}
      />
    );
    
    await user.click(screen.getByText('Ver Disputa'));
    
    expect(onChat).toHaveBeenCalled();
  });

  it('mostra botão "Abrir Chat com Cliente" quando não está em disputa', () => {
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.getByText('Abrir Chat com Cliente')).toBeInTheDocument();
  });

  it('chama onChat ao clicar em "Abrir Chat com Cliente"', async () => {
    const user = userEvent.setup();
    const onChat = vi.fn();
    render(
      <ProviderJobCard
        job={mockJob}
        client={mockClient}
        onChat={onChat}
        onUpdateStatus={vi.fn()}
      />
    );
    
    await user.click(screen.getByText('Abrir Chat com Cliente'));
    
    expect(onChat).toHaveBeenCalled();
  });

  it('não mostra botão de progresso quando status é em_progresso', () => {
    const inProgressJob = { ...mockJob, status: 'em_progresso' as const };
    render(
      <ProviderJobCard
        job={inProgressJob}
        client={mockClient}
        onChat={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );
    
    expect(screen.queryByText(/Estou a Caminho/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Iniciar Serviço/)).not.toBeInTheDocument();
  });
});
