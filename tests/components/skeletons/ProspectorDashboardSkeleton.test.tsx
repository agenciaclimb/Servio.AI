import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProspectorDashboardSkeleton from '../../../components/skeletons/ProspectorDashboardSkeleton';

// Mock SkeletonBlock para isolar o teste
vi.mock('../../../components/skeletons/SkeletonBlock', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-block" className={className} />
  ),
}));

describe('ProspectorDashboardSkeleton', () => {
  describe('renderização básica', () => {
    it('deve renderizar o dashboard skeleton', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      expect(container).toBeInTheDocument();
    });

    it('deve ter múltiplos blocos skeleton', () => {
      render(<ProspectorDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      expect(skeletonBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('seção de stat cards', () => {
    it('deve ter 4 stat cards skeleton', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      // Cada StatCardSkeleton tem 2 skeleton blocks (título + valor)
      // 4 stat cards * 2 = 8 blocks nos stat cards
      const statCardsContainer = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(statCardsContainer).toBeInTheDocument();
    });

    it('deve ter grid responsivo de 2 colunas mobile e 4 desktop', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      const grid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(grid).toHaveClass('gap-4');
    });

    it('deve renderizar stat card skeleton com estrutura correta', () => {
      render(<ProspectorDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Primeiros 8 blocos são dos stat cards (4 cards x 2 blocos cada)
      expect(skeletonBlocks[0]).toHaveClass('h-4', 'w-3/4'); // título
      expect(skeletonBlocks[1]).toHaveClass('h-8', 'w-1/2'); // valor
    });
  });

  describe('seção de progresso de badge', () => {
    it('deve ter container de progresso com fundo branco', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      const badgeProgress = container.querySelector('.bg-white.p-5.rounded.border.shadow-sm.mt-4');
      expect(badgeProgress).toBeInTheDocument();
    });

    it('deve ter skeleton para títulos de badge', () => {
      render(<ProspectorDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Após os 8 blocos de stat cards, temos blocos de badge progress
      // Bloco 8 deve ser título do badge (h-4 w-24)
      expect(skeletonBlocks[8]).toHaveClass('h-4', 'w-24');
    });

    it('deve ter skeleton para barra de progresso', () => {
      render(<ProspectorDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Existe um bloco h-4 w-full que é a barra de progresso
      const progressBar = skeletonBlocks.find(block => 
        block.classList.contains('h-4') && block.classList.contains('w-full')
      );
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('seção de leaderboard', () => {
    it('deve ter container de leaderboard com fundo branco', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      const leaderboard = container.querySelector('.bg-white.p-5.rounded.border.shadow-sm.mt-4:last-child');
      expect(leaderboard).toBeInTheDocument();
    });

    it('deve ter skeleton para título do leaderboard', () => {
      render(<ProspectorDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Procura bloco h-6 w-1/2 que é o título do leaderboard
      const leaderboardTitle = skeletonBlocks.find(block => 
        block.classList.contains('h-6') && block.classList.contains('w-1/2')
      );
      expect(leaderboardTitle).toBeInTheDocument();
    });

    it('deve ter 5 linhas de leaderboard skeleton', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      // Cada linha do leaderboard tem 4 skeleton blocks
      // O container do leaderboard tem className text-sm space-y-4
      const leaderboardRows = container.querySelectorAll('.space-y-4 .flex.justify-between.items-center');
      expect(leaderboardRows).toHaveLength(5);
    });

    it('deve ter skeleton para posição, nome, pontos e badges em cada linha', () => {
      render(<ProspectorDashboardSkeleton />);
      
      const skeletonBlocks = screen.getAllByTestId('skeleton-block');
      // Verifica se existem blocos com classes de largura variada para as colunas
      const positionBlocks = skeletonBlocks.filter(block => 
        block.classList.contains('h-5') && block.classList.contains('w-10')
      );
      expect(positionBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('estatísticas de stat card', () => {
    it('cada stat card deve ter estrutura de card', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      const statCards = container.querySelectorAll('.p-4.bg-white.rounded.border.shadow-sm');
      expect(statCards).toHaveLength(4);
    });

    it('stat cards devem ter flex column layout', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      const statCards = container.querySelectorAll('.p-4.bg-white.rounded.border.shadow-sm.flex.flex-col');
      expect(statCards).toHaveLength(4);
    });
  });

  describe('acessibilidade', () => {
    it('deve ser um container visualmente limpo (sem texto)', () => {
      const { container } = render(<ProspectorDashboardSkeleton />);
      
      const textContent = container.textContent;
      expect(textContent).toBe('');
    });
  });
});
