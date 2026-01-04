import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchingResultsModal from '../../components/MatchingResultsModal';

// Mock ProviderCard
vi.mock('../../components/ProviderCard', () => ({
  default: ({ result }: { result: { provider: { email: string; name: string } } }) => (
    <div data-testid={`provider-card-${result.provider.email}`}>
      Provider: {result.provider.name}
    </div>
  ),
}));

describe('MatchingResultsModal', () => {
  // A estrutura correta é { provider: User, matchScore: number }
  const mockResults = [
    {
      provider: {
        id: 'provider-1',
        name: 'Carlos Eletricista',
        email: 'carlos@test.com',
        type: 'prestador' as const,
        status: 'ativo' as const,
        createdAt: '2026-01-01T00:00:00Z',
      },
      matchScore: 95,
    },
    {
      provider: {
        id: 'provider-2',
        name: 'Ana Encanadora',
        email: 'ana@test.com',
        type: 'prestador' as const,
        status: 'ativo' as const,
        createdAt: '2026-01-01T00:00:00Z',
      },
      matchScore: 85,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnInvite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderização básica', () => {
    it('deve renderizar o modal', () => {
      render(
        <MatchingResultsModal 
          results={mockResults} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      expect(screen.getByTestId('provider-card-carlos@test.com')).toBeInTheDocument();
    });

    it('deve renderizar todos os providers', () => {
      render(
        <MatchingResultsModal 
          results={mockResults} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      expect(screen.getByTestId('provider-card-carlos@test.com')).toBeInTheDocument();
      expect(screen.getByTestId('provider-card-ana@test.com')).toBeInTheDocument();
    });
  });

  describe('fechar modal', () => {
    it('deve renderizar botão de fechar', () => {
      render(
        <MatchingResultsModal 
          results={mockResults} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      // Modal deve ter botão de fechar
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('deve chamar onClose ao clicar no overlay', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <MatchingResultsModal 
          results={mockResults} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      // Clicar no overlay (primeiro elemento)
      const overlay = container.firstChild as HTMLElement;
      await user.click(overlay);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('convidar provider', () => {
    it('deve renderizar título do modal', () => {
      render(
        <MatchingResultsModal 
          results={mockResults} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      expect(screen.getByText(/Profissionais Recomendados/i)).toBeInTheDocument();
    });
  });

  describe('acessibilidade', () => {
    it('deve ter role dialog', () => {
      render(
        <MatchingResultsModal 
          results={mockResults} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('lista vazia', () => {
    it('deve funcionar com lista vazia de resultados', () => {
      render(
        <MatchingResultsModal 
          results={[]} 
          onClose={mockOnClose} 
          onInvite={mockOnInvite} 
        />
      );
      
      expect(screen.queryByTestId('provider-card-carlos@test.com')).not.toBeInTheDocument();
    });
  });
});
