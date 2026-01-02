import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobCard from '../../components/JobCard';
import { Job, Bid } from '../../types';

// Mock JobFAQModal component
vi.mock('../../components/JobFAQModal', () => ({
  default: () => <div>FAQ Modal</div>,
}));

describe('JobCard Component', () => {
  const mockJob: Job = {
    id: 'job1',
    clientId: 'client@test.com',
    category: 'reparos',
    description: 'Precisamos consertar um vazamento na cozinha',
    status: 'aberto',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    serviceType: 'personalizado',
    urgency: '1semana',
  };

  const mockBids: Bid[] = [
    {
      id: 'bid1',
      jobId: 'job1',
      providerId: 'provider1',
      amount: 150,
      proposal: 'Posso fazer hoje',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bid2',
      jobId: 'job1',
      providerId: 'provider2',
      amount: 120,
      proposal: 'Melhor preço',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    },
  ];

  it('renderiza categoria do job', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Reparos')).toBeInTheDocument();
  });

  it('renderiza ícone da categoria', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('🔧')).toBeInTheDocument();
  });

  it('renderiza descrição do job', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText(/vazamento na cozinha/)).toBeInTheDocument();
  });

  it('mostra badge "Personalizado" para serviceType personalizado', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });

  it('mostra badge "Tabelado" para serviceType tabelado', () => {
    const tabeladoJob = { ...mockJob, serviceType: 'tabelado' as const };
    render(<JobCard job={tabeladoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Tabelado')).toBeInTheDocument();
  });

  it('mostra badge "Diagnóstico" para serviceType diagnostico', () => {
    const diagnosticoJob = { ...mockJob, serviceType: 'diagnostico' as const };
    render(<JobCard job={diagnosticoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
  });

  it('mostra preço fixo quando serviceType é tabelado', () => {
    const tabeladoJob = {
      ...mockJob,
      serviceType: 'tabelado' as const,
      fixedPrice: 250,
    };
    render(<JobCard job={tabeladoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Preço Fixo')).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
  });

  it('mostra badge "Leilão" quando jobMode é leilao', () => {
    const leilaoJob = { ...mockJob, jobMode: 'leilao' as const };
    render(<JobCard job={leilaoJob} bids={mockBids} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText(/Leilão/)).toBeInTheDocument();
  });

  it('mostra menor lance atual em modo leilão', () => {
    const leilaoJob = { ...mockJob, jobMode: 'leilao' as const };
    render(<JobCard job={leilaoJob} bids={mockBids} onProposeClick={vi.fn()} hasProposed={false} />);
    
    // Menor lance é 120
    expect(screen.getByText('Menor Lance Atual')).toBeInTheDocument();
    expect(screen.getByText(/120,00/)).toBeInTheDocument();
  });

  it('mostra "Nenhum lance" quando não há bids no leilão', () => {
    const leilaoJob = { ...mockJob, jobMode: 'leilao' as const };
    render(<JobCard job={leilaoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Nenhum lance')).toBeInTheDocument();
  });

  it('mostra tempo relativo de publicação', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    // Job criado há 1 hora
    expect(screen.getByText(/Publicado há/)).toBeInTheDocument();
  });

  it('mostra botão "Enviar Proposta" por padrão', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Enviar Proposta')).toBeInTheDocument();
  });

  it('mostra "Proposta Enviada" quando hasProposed=true', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={true} />);
    
    expect(screen.getByText(/Proposta Enviada/)).toBeInTheDocument();
  });

  it('mostra "Dar Lance" em modo leilão', () => {
    const leilaoJob = { ...mockJob, jobMode: 'leilao' as const };
    render(<JobCard job={leilaoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Dar Lance')).toBeInTheDocument();
  });

  it('desabilita botão no leilão quando já deu lance', () => {
    const leilaoJob = { ...mockJob, jobMode: 'leilao' as const };
    render(<JobCard job={leilaoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={true} />);
    
    const button = screen.getByText(/Você deu o menor lance/);
    expect(button).toBeDisabled();
  });

  it('chama onProposeClick ao clicar no botão', async () => {
    const user = userEvent.setup();
    const onProposeClick = vi.fn();
    render(<JobCard job={mockJob} bids={[]} onProposeClick={onProposeClick} hasProposed={false} />);
    
    await user.click(screen.getByText('Enviar Proposta'));
    
    expect(onProposeClick).toHaveBeenCalled();
  });

  it('mostra botão FAQ Rápida quando não é leilão', () => {
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText(/FAQ Rápida/)).toBeInTheDocument();
  });

  it('não mostra FAQ Rápida em modo leilão', () => {
    const leilaoJob = { ...mockJob, jobMode: 'leilao' as const };
    render(<JobCard job={leilaoJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.queryByText(/FAQ Rápida/)).not.toBeInTheDocument();
  });

  it('abre modal FAQ ao clicar no botão', async () => {
    const user = userEvent.setup();
    render(<JobCard job={mockJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    await user.click(screen.getByText(/FAQ Rápida/));
    
    expect(screen.getByText('FAQ Modal')).toBeInTheDocument();
  });

  it('usa categoria default quando categoria não é reconhecida', () => {
    const unknownJob = { ...mockJob, category: 'categoria_desconhecida' as any };
    render(<JobCard job={unknownJob} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);
    
    expect(screen.getByText('Serviço')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
  });
});
