import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClientDashboardSkeleton from '../../../components/skeletons/ClientDashboardSkeleton';

// Mock SkeletonBlock para isolar o teste
vi.mock('../../../components/skeletons/SkeletonBlock', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-block" className={className} />
  ),
}));

describe('ClientDashboardSkeleton', () => {
  describe('renderização básica', () => {
    it('deve renderizar o dashboard skeleton', () => {
      const { container } = render(<ClientDashboardSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('deve ter múltiplos blocos skeleton', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      expect(skeletonBlocks.length).toBeGreaterThan(0);
    });

    it('deve renderizar 12 blocos skeleton', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Welcome: 2, Appointments Title: 1, Appointments: 2, Activity Title: 1, Activity: 2, Quick Actions Title: 1, Quick Actions: 3 = 12
      expect(skeletonBlocks).toHaveLength(12);
    });
  });

  describe('layout do container', () => {
    it('deve ter padding responsivo', () => {
      const { container } = render(<ClientDashboardSkeleton />);
      
      expect(container.firstChild).toHaveClass('p-4', 'md:p-6', 'lg:p-8');
    });
  });

  describe('seção de boas vindas', () => {
    it('deve ter skeleton para mensagem de boas vindas', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Primeiro bloco é título h-8 w-1/3
      expect(skeletonBlocks[0]).toHaveClass('h-8', 'w-1/3');
    });

    it('deve ter skeleton para subtítulo de boas vindas', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Segundo bloco é subtítulo h-4 w-1/2
      expect(skeletonBlocks[1]).toHaveClass('h-4', 'w-1/2');
    });
  });

  describe('seção de agendamentos', () => {
    it('deve ter skeleton para título de agendamentos', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Bloco 2 é título h-6 w-1/4
      expect(skeletonBlocks[2]).toHaveClass('h-6', 'w-1/4');
    });

    it('deve ter skeleton para items de agendamento', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 3, 4 são agendamentos (h-20 rounded-lg)
      expect(skeletonBlocks[3]).toHaveClass('h-20', 'rounded-lg');
      expect(skeletonBlocks[4]).toHaveClass('h-20', 'rounded-lg');
    });
  });

  describe('seção de atividade recente', () => {
    it('deve ter skeleton para título de atividade', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Bloco 5 é título h-6 w-1/4
      expect(skeletonBlocks[5]).toHaveClass('h-6', 'w-1/4');
    });

    it('deve ter skeleton para items de atividade', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 6, 7 são atividades (h-16 rounded-lg)
      expect(skeletonBlocks[6]).toHaveClass('h-16', 'rounded-lg');
      expect(skeletonBlocks[7]).toHaveClass('h-16', 'rounded-lg');
    });
  });

  describe('seção de ações rápidas', () => {
    it('deve ter skeleton para título de ações rápidas', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Bloco 8 é título h-6 w-1/2
      expect(skeletonBlocks[8]).toHaveClass('h-6', 'w-1/2');
    });

    it('deve ter skeleton para botões de ações rápidas', () => {
      render(<ClientDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 9, 10, 11 são botões (h-12 rounded-lg)
      expect(skeletonBlocks[9]).toHaveClass('h-12', 'rounded-lg');
      expect(skeletonBlocks[10]).toHaveClass('h-12', 'rounded-lg');
      expect(skeletonBlocks[11]).toHaveClass('h-12', 'rounded-lg');
    });
  });

  describe('responsividade', () => {
    it('deve ter grid responsivo para conteúdo principal', () => {
      const { container } = render(<ClientDashboardSkeleton />);
      
      const gridElement = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      expect(gridElement).toBeInTheDocument();
    });

    it('deve ter coluna de conteúdo ocupando 2 colunas em lg', () => {
      const { container } = render(<ClientDashboardSkeleton />);
      
      const leftColumn = container.querySelector('.lg\\:col-span-2');
      expect(leftColumn).toBeInTheDocument();
    });
  });

  describe('acessibilidade', () => {
    it('deve ser um container visualmente limpo', () => {
      const { container } = render(<ClientDashboardSkeleton />);
      
      const textContent = container.textContent;
      expect(textContent).toBe('');
    });
  });
});
