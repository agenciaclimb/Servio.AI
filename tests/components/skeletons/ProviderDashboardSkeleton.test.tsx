import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProviderDashboardSkeleton from '../../../components/skeletons/ProviderDashboardSkeleton';

// Mock SkeletonBlock para isolar o teste
vi.mock('../../../components/skeletons/SkeletonBlock', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-block" className={className} />
  ),
}));

describe('ProviderDashboardSkeleton', () => {
  describe('renderização básica', () => {
    it('deve renderizar o dashboard skeleton', () => {
      const { container } = render(<ProviderDashboardSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('deve ter múltiplos blocos skeleton', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      expect(skeletonBlocks.length).toBeGreaterThan(0);
    });

    it('deve renderizar 10 blocos skeleton', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Header: 3, Stat Cards: 3, Content Title: 1, Content Items: 3 = 10
      expect(skeletonBlocks).toHaveLength(10);
    });
  });

  describe('layout do container', () => {
    it('deve ter padding responsivo', () => {
      const { container } = render(<ProviderDashboardSkeleton />);
      
      expect(container.firstChild).toHaveClass('p-4', 'md:p-6', 'lg:p-8');
    });
  });

  describe('seção de header', () => {
    it('deve ter skeleton para título principal', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Primeiro bloco é o título h-8 w-48
      expect(skeletonBlocks[0]).toHaveClass('h-8', 'w-48');
    });

    it('deve ter skeleton para subtítulo', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Segundo bloco é subtítulo h-4 w-64
      expect(skeletonBlocks[1]).toHaveClass('h-4', 'w-64');
    });

    it('deve ter skeleton para botão de ação', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Terceiro bloco é botão h-10 w-32
      expect(skeletonBlocks[2]).toHaveClass('h-10', 'w-32');
    });
  });

  describe('seção de stat cards', () => {
    it('deve ter 3 blocos para stat cards', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 3, 4, 5 são stat cards (h-24 rounded-lg)
      expect(skeletonBlocks[3]).toHaveClass('h-24', 'rounded-lg');
      expect(skeletonBlocks[4]).toHaveClass('h-24', 'rounded-lg');
      expect(skeletonBlocks[5]).toHaveClass('h-24', 'rounded-lg');
    });
  });

  describe('seção de conteúdo principal', () => {
    it('deve ter skeleton para título da seção', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Bloco 6 é título do content (h-6 w-40)
      expect(skeletonBlocks[6]).toHaveClass('h-6', 'w-40');
    });

    it('deve ter 3 blocos para items de conteúdo', () => {
      render(<ProviderDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Blocos 7, 8, 9 são items de conteúdo (h-28 rounded-lg)
      expect(skeletonBlocks[7]).toHaveClass('h-28', 'rounded-lg');
      expect(skeletonBlocks[8]).toHaveClass('h-28', 'rounded-lg');
      expect(skeletonBlocks[9]).toHaveClass('h-28', 'rounded-lg');
    });
  });

  describe('acessibilidade', () => {
    it('deve ser um container visualmente limpo', () => {
      const { container } = render(<ProviderDashboardSkeleton />);
      
      // Container principal não deve ter texto visível
      const textContent = container.textContent;
      expect(textContent).toBe('');
    });
  });

  describe('responsividade', () => {
    it('deve ter grid responsivo para stat cards', () => {
      const { container } = render(<ProviderDashboardSkeleton />);
      
      // Procura o grid de stat cards
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('deve ter gap entre stat cards', () => {
      const { container } = render(<ProviderDashboardSkeleton />);
      
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('gap-6');
    });
  });
});
