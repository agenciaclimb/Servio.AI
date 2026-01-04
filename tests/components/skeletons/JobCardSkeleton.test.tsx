import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JobCardSkeleton from '../../../components/skeletons/JobCardSkeleton';

// Mock SkeletonBlock para isolar o teste
vi.mock('../../../components/skeletons/SkeletonBlock', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-block" className={className} />
  ),
}));

describe('JobCardSkeleton', () => {
  describe('renderização básica', () => {
    it('deve renderizar o card skeleton', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('deve ter múltiplos blocos skeleton', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      expect(skeletonBlocks.length).toBeGreaterThan(0);
    });

    it('deve renderizar 7 blocos skeleton', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Header: 2, Client: 1, Service: 2, Footer: 2 = 7
      expect(skeletonBlocks).toHaveLength(7);
    });
  });

  describe('estrutura do card', () => {
    it('deve ter classe de borda', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toHaveClass('border', 'border-gray-200');
    });

    it('deve ter background branco', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('deve ter bordas arredondadas', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('deve ter padding', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('deve ter sombra', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toHaveClass('shadow-sm');
    });

    it('deve ter animação pulse', () => {
      const { container } = render(<JobCardSkeleton />);
      
      expect(container.firstChild).toHaveClass('animate-pulse');
    });
  });

  describe('seções do card', () => {
    it('deve ter skeleton para header (título)', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Primeiro bloco do header (título) tem w-3/5
      expect(skeletonBlocks[0]).toHaveClass('w-3/5');
    });

    it('deve ter skeleton para header (status)', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Segundo bloco do header (status) tem w-1/5
      expect(skeletonBlocks[1]).toHaveClass('w-1/5');
    });

    it('deve ter skeleton para info do cliente', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Terceiro bloco é info do cliente com w-1/4
      expect(skeletonBlocks[2]).toHaveClass('w-1/4');
    });

    it('deve ter skeleton para detalhes do serviço', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Quarto e quinto blocos são detalhes (w-full e w-3/4)
      expect(skeletonBlocks[3]).toHaveClass('w-full');
      expect(skeletonBlocks[4]).toHaveClass('w-3/4');
    });

    it('deve ter skeleton para rodapé (tempo e preço)', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Sexto e sétimo blocos são footer (w-1/3 e w-1/4)
      expect(skeletonBlocks[5]).toHaveClass('w-1/3');
      expect(skeletonBlocks[6]).toHaveClass('w-1/4');
    });
  });

  describe('altura dos elementos', () => {
    it('deve ter alturas apropriadas nos blocos', () => {
      render(<JobCardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      
      // Header blocks têm h-5
      expect(skeletonBlocks[0]).toHaveClass('h-5');
      expect(skeletonBlocks[1]).toHaveClass('h-5');
      
      // Client info e detalhes têm h-4
      expect(skeletonBlocks[2]).toHaveClass('h-4');
      expect(skeletonBlocks[3]).toHaveClass('h-4');
      expect(skeletonBlocks[4]).toHaveClass('h-4');
      
      // Footer tempo tem h-4
      expect(skeletonBlocks[5]).toHaveClass('h-4');
      
      // Botão de preço tem h-8
      expect(skeletonBlocks[6]).toHaveClass('h-8');
    });
  });
});
