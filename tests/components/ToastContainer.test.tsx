import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToastContainer from '../../components/ToastContainer';
import type { ToastMessage } from '../../contexts/ToastContext';

// Mock Toast component
vi.mock('../../components/Toast', () => ({
  default: ({ message, removeToast }: { message: ToastMessage; removeToast: (id: number) => void }) => (
    <div data-testid={`toast-${message.id}`} onClick={() => removeToast(message.id)}>
      <span data-testid="toast-message">{message.message}</span>
      <span data-testid="toast-type">{message.type}</span>
    </div>
  ),
}));

describe('ToastContainer', () => {
  const mockRemoveToast = vi.fn();

  beforeEach(() => {
    mockRemoveToast.mockClear();
  });

  describe('renderização básica', () => {
    it('deve renderizar container vazio quando não há mensagens', () => {
      const { container } = render(
        <ToastContainer messages={[]} removeToast={mockRemoveToast} />
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryByTestId(/toast-/)).not.toBeInTheDocument();
    });

    it('deve renderizar uma mensagem de toast', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'Sucesso!', type: 'success' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-1')).toBeInTheDocument();
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });

    it('deve renderizar múltiplas mensagens de toast', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'Sucesso!', type: 'success' },
        { id: 2, message: 'Erro!', type: 'error' },
        { id: 3, message: 'Info!', type: 'info' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-1')).toBeInTheDocument();
      expect(screen.getByTestId('toast-2')).toBeInTheDocument();
      expect(screen.getByTestId('toast-3')).toBeInTheDocument();
    });
  });

  describe('tipos de toast', () => {
    it('deve passar tipo success para o componente Toast', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'Operação bem sucedida', type: 'success' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-type')).toHaveTextContent('success');
    });

    it('deve passar tipo error para o componente Toast', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'Ocorreu um erro', type: 'error' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-type')).toHaveTextContent('error');
    });

    it('deve passar tipo info para o componente Toast', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'Informação importante', type: 'info' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-type')).toHaveTextContent('info');
    });

    it('deve passar tipo warning para o componente Toast', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'Atenção!', type: 'warning' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-type')).toHaveTextContent('warning');
    });
  });

  describe('callback removeToast', () => {
    it('deve passar removeToast para cada Toast', async () => {
      const messages: ToastMessage[] = [
        { id: 42, message: 'Test', type: 'info' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      const toast = screen.getByTestId('toast-42');
      toast.click();

      expect(mockRemoveToast).toHaveBeenCalledWith(42);
    });

    it('deve chamar removeToast com id correto para múltiplos toasts', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'First', type: 'success' },
        { id: 2, message: 'Second', type: 'error' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      screen.getByTestId('toast-2').click();

      expect(mockRemoveToast).toHaveBeenCalledWith(2);
      expect(mockRemoveToast).not.toHaveBeenCalledWith(1);
    });
  });

  describe('estilos e posicionamento', () => {
    it('deve ter classes de posicionamento fixo', () => {
      const { container } = render(
        <ToastContainer messages={[]} removeToast={mockRemoveToast} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('fixed');
      expect(wrapper).toHaveClass('top-5');
      expect(wrapper).toHaveClass('right-5');
    });

    it('deve ter z-index alto para sobrepor outros elementos', () => {
      const { container } = render(
        <ToastContainer messages={[]} removeToast={mockRemoveToast} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('z-[100]');
    });

    it('deve ter largura máxima definida', () => {
      const { container } = render(
        <ToastContainer messages={[]} removeToast={mockRemoveToast} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-xs');
    });

    it('deve ter espaçamento entre toasts', () => {
      const { container } = render(
        <ToastContainer messages={[]} removeToast={mockRemoveToast} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-3');
    });
  });

  describe('edge cases', () => {
    it('deve lidar com mensagens vazias', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: '', type: 'info' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByTestId('toast-1')).toBeInTheDocument();
    });

    it('deve lidar com IDs grandes', () => {
      const messages: ToastMessage[] = [
        { id: Date.now(), message: 'Timestamp ID', type: 'success' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByText('Timestamp ID')).toBeInTheDocument();
    });

    it('deve lidar com mensagens longas', () => {
      const longMessage = 'A'.repeat(500);
      const messages: ToastMessage[] = [
        { id: 1, message: longMessage, type: 'info' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('deve renderizar toasts em ordem de inserção', () => {
      const messages: ToastMessage[] = [
        { id: 1, message: 'First', type: 'success' },
        { id: 2, message: 'Second', type: 'error' },
        { id: 3, message: 'Third', type: 'info' },
      ];

      render(<ToastContainer messages={messages} removeToast={mockRemoveToast} />);

      // Verifica se todos os toasts estão presentes
      expect(screen.getByTestId('toast-1')).toBeInTheDocument();
      expect(screen.getByTestId('toast-2')).toBeInTheDocument();
      expect(screen.getByTestId('toast-3')).toBeInTheDocument();
    });
  });
});
