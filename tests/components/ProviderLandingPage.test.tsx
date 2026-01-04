import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderLandingPage from '../../components/ProviderLandingPage';

describe('ProviderLandingPage', () => {
  const mockOnRegisterClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderização básica', () => {
    it('deve renderizar a página', () => {
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      expect(screen.getByText(/Sua expertise, nossos clientes/i)).toBeInTheDocument();
    });

    it('deve renderizar título principal com destaque', () => {
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      expect(screen.getByText(/Junte-se à revolução dos serviços/i)).toBeInTheDocument();
    });

    it('deve renderizar descrição', () => {
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      expect(screen.getByText(/Conectamos seu talento a milhares de clientes/i)).toBeInTheDocument();
    });
  });

  describe('botão de registro', () => {
    it('deve renderizar botão de registro', () => {
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      expect(screen.getByRole('button', { name: /Quero ser um Parceiro/i })).toBeInTheDocument();
    });

    it('deve chamar onRegisterClick ao clicar no botão', async () => {
      const user = userEvent.setup();
      
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      await user.click(screen.getByRole('button', { name: /Quero ser um Parceiro/i }));
      
      expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
    });

    it('botão deve ter estilos corretos', () => {
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      const button = screen.getByRole('button', { name: /Quero ser um Parceiro/i });
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'rounded-lg');
    });
  });

  describe('seções', () => {
    it('deve renderizar seção hero', () => {
      render(<ProviderLandingPage onRegisterClick={mockOnRegisterClick} />);
      
      const heroSection = screen.getByText(/Sua expertise, nossos clientes/i).closest('section');
      expect(heroSection).toHaveClass('text-center', 'py-20');
    });
  });

  describe('layout', () => {
    it('deve ter container com fundo branco', () => {
      const { container } = render(
        <ProviderLandingPage onRegisterClick={mockOnRegisterClick} />
      );
      
      expect(container.firstChild).toHaveClass('bg-white');
    });
  });
});
