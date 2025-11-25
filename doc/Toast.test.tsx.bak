import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Toast from '../components/Toast';
import type { ToastMessage } from '../contexts/ToastContext';

describe('Toast Component', () => {
  // Habilita os fake timers para controlar setTimeout
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // Restaura os timers reais após cada teste
  afterEach(() => {
    vi.useRealTimers();
  });

  const mockRemoveToast = vi.fn();

  const successMessage: ToastMessage = {
    id: 1,
    message: 'Operação realizada com sucesso!',
    type: 'success',
  };

  it('deve renderizar a mensagem e o ícone corretamente', () => {
    render(<Toast message={successMessage} removeToast={mockRemoveToast} />);

    // Verifica se a mensagem está na tela
    expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();

    // Verifica se o botão de fechar está presente
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
  });

  it('deve chamar a função removeToast ao clicar no botão de fechar', async () => {
    const user = userEvent.setup();
    render(<Toast message={successMessage} removeToast={mockRemoveToast} />);

    const closeButton = screen.getByRole('button', { name: /Close/i });
    await user.click(closeButton);

    // Verifica se a função foi chamada
    expect(mockRemoveToast).toHaveBeenCalledTimes(1);
    expect(mockRemoveToast).toHaveBeenCalledWith(successMessage.id);
  });

  it('deve chamar a função removeToast automaticamente após 5 segundos', async () => {
    render(<Toast message={successMessage} removeToast={mockRemoveToast} />);

    // Verifica que a função ainda não foi chamada
    expect(mockRemoveToast).not.toHaveBeenCalled();

    // Avança o tempo em 5 segundos
    vi.advanceTimersByTime(5000);

    // Aguarda a execução da callback do setTimeout
    await waitFor(() => {
      expect(mockRemoveToast).toHaveBeenCalledTimes(1);
      expect(mockRemoveToast).toHaveBeenCalledWith(successMessage.id);
    });
  });
});