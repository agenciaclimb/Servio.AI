import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminVerificationCard from '../../components/AdminVerificationCard';
import { User } from '../../types';

describe('AdminVerificationCard', () => {
  const mockProvider: User = {
    id: 'provider-1',
    name: 'Maria Santos',
    email: 'maria@test.com',
    phone: '11999999999',
    type: 'prestador',
    status: 'ativo',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderização básica', () => {
    it('deve renderizar o card', () => {
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      expect(screen.getByRole('heading', { name: 'Maria Santos' })).toBeInTheDocument();
    });

    it('deve exibir email do provider', () => {
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      expect(screen.getByText('maria@test.com')).toBeInTheDocument();
    });

    it('deve exibir badge de status pendente', () => {
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  describe('documentos', () => {
    it('deve exibir mensagem quando não há imagem de documento', () => {
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      expect(screen.getByText('Imagem não disponível')).toBeInTheDocument();
    });

    it('deve exibir imagem de documento quando disponível', () => {
      const providerWithDoc = {
        ...mockProvider,
        documentImage: 'https://example.com/doc.jpg',
      };
      
      render(
        <AdminVerificationCard 
          provider={providerWithDoc} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      const img = screen.getByAltText('Documento');
      expect(img).toHaveAttribute('src', 'https://example.com/doc.jpg');
    });
  });

  describe('ações', () => {
    it('deve renderizar botões de aprovar e recusar', () => {
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      expect(screen.getByRole('button', { name: /Aprovar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Recusar/i })).toBeInTheDocument();
    });

    it('deve chamar onApprove ao clicar em Aprovar', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      await user.click(screen.getByRole('button', { name: /Aprovar/i }));
      
      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onReject ao clicar em Recusar', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      await user.click(screen.getByRole('button', { name: /Recusar/i }));
      
      expect(mockOnReject).toHaveBeenCalledTimes(1);
    });
  });

  describe('estilização', () => {
    it('deve ter container com fundo branco e sombra', () => {
      const { container } = render(
        <AdminVerificationCard 
          provider={mockProvider} 
          onApprove={mockOnApprove} 
          onReject={mockOnReject} 
        />
      );
      
      expect(container.firstChild).toHaveClass('bg-white', 'rounded-xl', 'shadow-md');
    });
  });
});
