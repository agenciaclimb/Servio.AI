import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentSuccessPage from '../../components/PaymentSuccessPage';
import * as API from '../../services/api';

// Mock da API
vi.mock('../../services/api', () => ({
  confirmPayment: vi.fn(),
}));

describe('PaymentSuccessPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    delete (window as unknown as { location: Location | undefined }).location;
    window.location = {
      ...originalLocation,
      search: '?session_id=sess_123&job_id=job_456',
      href: '',
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('renderização', () => {
    it('deve renderizar a página de sucesso', () => {
      render(<PaymentSuccessPage />);
      
      expect(screen.getByText('Pagamento Confirmado!')).toBeInTheDocument();
    });

    it('deve exibir mensagem de confirmação', () => {
      render(<PaymentSuccessPage />);
      
      expect(screen.getByText(/Seu pagamento foi processado com sucesso/)).toBeInTheDocument();
    });

    it('deve exibir ID da sessão', () => {
      render(<PaymentSuccessPage />);
      
      expect(screen.getByText(/ID da Sessão:/)).toBeInTheDocument();
      expect(screen.getByText(/sess_123/)).toBeInTheDocument();
    });

    it('deve renderizar botão de voltar ao dashboard', () => {
      render(<PaymentSuccessPage />);
      
      expect(screen.getByRole('button', { name: /Voltar ao Dashboard/i })).toBeInTheDocument();
    });

    it('deve renderizar ícone de sucesso (checkmark)', () => {
      const { container } = render(<PaymentSuccessPage />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-green-600');
    });
  });

  describe('processamento de pagamento', () => {
    it('deve chamar confirmPayment com session_id e job_id', async () => {
      render(<PaymentSuccessPage />);
      
      await waitFor(() => {
        expect(API.confirmPayment).toHaveBeenCalledWith('job_456', 'sess_123');
      });
    });

    it('não deve chamar confirmPayment se session_id estiver ausente', async () => {
      window.location.search = '?job_id=job_456';
      
      render(<PaymentSuccessPage />);
      
      await waitFor(() => {
        expect(API.confirmPayment).not.toHaveBeenCalled();
      });
    });

    it('não deve chamar confirmPayment se job_id estiver ausente', async () => {
      window.location.search = '?session_id=sess_123';
      
      render(<PaymentSuccessPage />);
      
      await waitFor(() => {
        expect(API.confirmPayment).not.toHaveBeenCalled();
      });
    });

    it('deve lidar com erro de confirmPayment graciosamente', async () => {
      vi.mocked(API.confirmPayment).mockRejectedValueOnce(new Error('API Error'));
      
      // Não deve lançar erro
      expect(() => render(<PaymentSuccessPage />)).not.toThrow();
    });
  });

  describe('navegação', () => {
    it('deve redirecionar para home ao clicar em voltar', async () => {
      const user = userEvent.setup();
      render(<PaymentSuccessPage />);
      
      const button = screen.getByRole('button', { name: /Voltar ao Dashboard/i });
      await user.click(button);
      
      expect(window.location.href).toBe('/');
    });
  });

  describe('estilização', () => {
    it('deve ter container centralizado', () => {
      const { container } = render(<PaymentSuccessPage />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('deve ter card com fundo branco', () => {
      const { container } = render(<PaymentSuccessPage />);
      
      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-2xl', 'shadow-xl');
    });

    it('deve ter ícone com fundo verde', () => {
      const { container } = render(<PaymentSuccessPage />);
      
      const iconWrapper = container.querySelector('.bg-green-100');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveClass('rounded-full');
    });
  });

  describe('sem parâmetros de URL', () => {
    it('deve exibir placeholder quando session_id não existe', () => {
      window.location.search = '';
      
      render(<PaymentSuccessPage />);
      
      expect(screen.getByText(/ID da Sessão: —/)).toBeInTheDocument();
    });
  });
});
