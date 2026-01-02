import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CompletedJobCard from '../../components/CompletedJobCard';
import { Job, User } from '../../types';

describe('CompletedJobCard Component', () => {
  const mockJob: Job = {
    id: '1',
    clientId: 'client@test.com',
    category: 'limpeza',
    description: 'Limpeza completa do apartamento',
    status: 'concluido',
    createdAt: new Date().toISOString(),
    serviceType: 'personalizado',
    urgency: '1semana',
    review: {
      rating: 5,
      comment: 'Excelente trabalho!',
      createdAt: new Date().toISOString(),
    },
  };

  const mockClient: User = {
    id: '2',
    email: 'client@test.com',
    name: 'João Cliente',
    tipo: 'cliente',
    status: 'ativo',
    fotoPerfil: '',
    bio: '',
    servicosPrestados: [],
    tags: [],
    telefone: '',
    endereco: '',
  };

  it('renderiza descrição do job', () => {
    render(<CompletedJobCard job={mockJob} />);
    
    expect(screen.getByText('Limpeza completa do apartamento')).toBeInTheDocument();
  });

  it('mostra ícone e nome da categoria', () => {
    render(<CompletedJobCard job={mockJob} />);
    
    expect(screen.getByText('✨')).toBeInTheDocument();
    expect(screen.getByText('Limpeza')).toBeInTheDocument();
  });

  it('mostra email do cliente quando não há objeto User', () => {
    render(<CompletedJobCard job={mockJob} />);
    
    expect(screen.getByText(/Cliente: client@test.com/)).toBeInTheDocument();
  });

  it('mostra nome do cliente quando objeto User é fornecido', () => {
    render(<CompletedJobCard job={mockJob} client={mockClient} />);
    
    expect(screen.getByText(/Cliente: João Cliente/)).toBeInTheDocument();
  });

  it('mostra avaliação quando presente', () => {
    render(<CompletedJobCard job={mockJob} />);
    
    expect(screen.getByText('Avaliação Recebida:')).toBeInTheDocument();
  });

  it('renderiza 5 estrelas para avaliação', () => {
    const { container } = render(<CompletedJobCard job={mockJob} />);
    
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('preenche estrelas de acordo com rating', () => {
    const { container } = render(<CompletedJobCard job={mockJob} />);
    
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(5); // rating: 5
  });

  it('mostra comentário da avaliação', () => {
    render(<CompletedJobCard job={mockJob} />);
    
    expect(screen.getByText(/Excelente trabalho/)).toBeInTheDocument();
  });

  it('não mostra seção de avaliação quando não há review', () => {
    const jobWithoutReview = { ...mockJob, review: undefined };
    render(<CompletedJobCard job={jobWithoutReview} />);
    
    expect(screen.queryByText('Avaliação Recebida:')).not.toBeInTheDocument();
  });

  it('usa categoria padrão para categoria desconhecida', () => {
    const jobUnknownCategory = { ...mockJob, category: 'categoria_invalida' };
    render(<CompletedJobCard job={jobUnknownCategory} />);
    
    expect(screen.getByText('💼')).toBeInTheDocument();
    expect(screen.getByText('Serviço')).toBeInTheDocument();
  });

  it('renderiza ícone correto para categoria reparos', () => {
    const jobReparos = { ...mockJob, category: 'reparos' };
    render(<CompletedJobCard job={jobReparos} />);
    
    expect(screen.getByText('🔧')).toBeInTheDocument();
    expect(screen.getByText('Reparos')).toBeInTheDocument();
  });

  it('renderiza ícone correto para categoria aulas', () => {
    const jobAulas = { ...mockJob, category: 'aulas' };
    render(<CompletedJobCard job={jobAulas} />);
    
    expect(screen.getByText('🎓')).toBeInTheDocument();
    expect(screen.getByText('Aulas')).toBeInTheDocument();
  });

  it('tem classes de estilo do card branco', () => {
    const { container } = render(<CompletedJobCard job={mockJob} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('shadow-sm');
  });
});
