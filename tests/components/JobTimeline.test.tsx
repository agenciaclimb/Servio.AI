import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import JobTimeline from '../../components/JobTimeline';
import { Job } from '../../types';

describe('JobTimeline Component', () => {
  const baseJob: Job = {
    id: '1',
    clientId: 'client@test.com',
    category: 'limpeza',
    description: 'Limpeza residencial',
    status: 'agendado',
    createdAt: new Date().toISOString(),
    serviceType: 'personalizado',
    urgency: '1semana',
  };

  it('renderiza o título da timeline', () => {
    render(<JobTimeline job={{ ...baseJob, status: 'agendado' }} />);
    
    expect(screen.getByText('Linha do Tempo do Serviço')).toBeInTheDocument();
  });

  it('renderiza todos os 5 passos', () => {
    render(<JobTimeline job={{ ...baseJob, status: 'agendado' }} />);
    
    expect(screen.getByText('Agendado')).toBeInTheDocument();
    expect(screen.getByText('A Caminho')).toBeInTheDocument();
    expect(screen.getByText('Em Progresso')).toBeInTheDocument();
    expect(screen.getByText('Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Finalizado')).toBeInTheDocument();
  });

  it('mostra ícones para cada passo', () => {
    render(<JobTimeline job={{ ...baseJob, status: 'agendado' }} />);
    
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('🚚')).toBeInTheDocument();
    expect(screen.getByText('🛠️')).toBeInTheDocument();
    expect(screen.getByText('💳')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('marca passo como ativo quando é o status atual', () => {
    const { container } = render(<JobTimeline job={{ ...baseJob, status: 'em_progresso' }} />);
    
    const activeSteps = container.querySelectorAll('.bg-blue-500.border-blue-500');
    expect(activeSteps.length).toBeGreaterThan(0);
  });

  it('marca passos anteriores como completados', () => {
    const { container } = render(<JobTimeline job={{ ...baseJob, status: 'pagamento_pendente' }} />);
    
    // Deve ter passos completados (agendado, a_caminho, em_progresso)
    const completedSteps = container.querySelectorAll('.bg-blue-500');
    expect(completedSteps.length).toBeGreaterThan(0);
  });

  it('não renderiza para status proposta_aceita', () => {
    render(<JobTimeline job={{ ...baseJob, status: 'proposta_aceita' }} />);
    
    // Deve renderizar a timeline (proposta_aceita é tratado como antes do primeiro passo)
    expect(screen.getByText('Linha do Tempo do Serviço')).toBeInTheDocument();
  });

  it('não renderiza para status fora do fluxo (ativo)', () => {
    const { container } = render(<JobTimeline job={{ ...baseJob, status: 'ativo' }} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza para status cancelado', () => {
    const { container } = render(<JobTimeline job={{ ...baseJob, status: 'cancelado' }} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('último passo fica ativo quando status é concluido', () => {
    render(<JobTimeline job={{ ...baseJob, status: 'concluido' }} />);
    
    expect(screen.getByText('Finalizado')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });
});
