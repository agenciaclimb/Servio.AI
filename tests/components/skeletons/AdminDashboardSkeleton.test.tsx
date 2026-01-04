import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboardSkeleton from '../../../components/skeletons/AdminDashboardSkeleton';

// Mock SkeletonBlock para isolar o teste
vi.mock('../../../components/skeletons/SkeletonBlock', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-block" className={className} />
  ),
}));

describe('AdminDashboardSkeleton', () => {
  describe('renderização básica', () => {
    it('deve renderizar o dashboard skeleton', () => {
      const { container } = render(<AdminDashboardSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('deve ter múltiplos blocos skeleton', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      expect(skeletonBlocks.length).toBeGreaterThan(0);
    });

    it('deve renderizar 12 blocos skeleton', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Header: 2, Stat Cards: 4, Chart: 1, Activity Title: 1, Activity Items: 4 = 12
      expect(skeletonBlocks).toHaveLength(12);
    });
  });

  describe('layout do container', () => {
    it('deve ter padding responsivo', () => {
      const { container } = render(<AdminDashboardSkeleton />);
      
      expect(container.firstChild).toHaveClass('p-4', 'md:p-6', 'lg:p-8');
    });
  });

  describe('seção de header', () => {
    it('deve ter skeleton para título principal', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Primeiro bloco é o título h-8 w-1/3
      expect(skeletonBlocks[0]).toHaveClass('h-8', 'w-1/3');
    });

    it('deve ter skeleton para subtítulo', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Segundo bloco é subtítulo h-4 w-1/2
      expect(skeletonBlocks[1]).toHaveClass('h-4', 'w-1/2');
    });
  });

  describe('seção de stat cards', () => {
    it('deve ter 4 blocos para stat cards', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 2, 3, 4, 5 são stat cards (h-24 rounded-lg)
      expect(skeletonBlocks[2]).toHaveClass('h-24', 'rounded-lg');
      expect(skeletonBlocks[3]).toHaveClass('h-24', 'rounded-lg');
      expect(skeletonBlocks[4]).toHaveClass('h-24', 'rounded-lg');
      expect(skeletonBlocks[5]).toHaveClass('h-24', 'rounded-lg');
    });

    it('deve ter grid responsivo para stat cards', () => {
      const { container } = render(<AdminDashboardSkeleton />);
      
      const gridElement = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(gridElement).toBeInTheDocument();
    });
  });

  describe('seção de gráfico', () => {
    it('deve ter skeleton para gráfico', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Bloco 6 é o gráfico (h-80 rounded-lg)
      expect(skeletonBlocks[6]).toHaveClass('h-80', 'rounded-lg');
    });
  });

  describe('seção de atividade recente', () => {
    it('deve ter skeleton para título de atividade', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Bloco 7 é título de atividade (h-6 w-1/4)
      expect(skeletonBlocks[7]).toHaveClass('h-6', 'w-1/4');
    });

    it('deve ter 4 blocos para items de atividade', () => {
      render(<AdminDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 8, 9, 10, 11 são items de atividade (h-16 rounded-lg)
      expect(skeletonBlocks[8]).toHaveClass('h-16', 'rounded-lg');
      expect(skeletonBlocks[9]).toHaveClass('h-16', 'rounded-lg');
      expect(skeletonBlocks[10]).toHaveClass('h-16', 'rounded-lg');
      expect(skeletonBlocks[11]).toHaveClass('h-16', 'rounded-lg');
    });
  });

  describe('acessibilidade', () => {
    it('deve ser um container visualmente limpo', () => {
      const { container } = render(<AdminDashboardSkeleton />);
      
      const textContent = container.textContent;
      expect(textContent).toBe('');
    });
  });
});
