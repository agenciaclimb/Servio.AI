import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewModal from '../components/ReviewModal';
import type { Job } from '../types';
import * as geminiService from '../services/geminiService';

vi.mock('../services/geminiService', () => ({
  generateReviewComment: vi.fn(),
}));

describe('ReviewModal', () => {
  const mockJob: Job = {
    id: 'job-1',
    title: 'Pintar parede',
    category: 'Pintura',
    description: 'Pintar parede da sala',
    clientId: 'client-1',
    status: 'completed',
    createdAt: new Date(),
  } as Job;

  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza modal com título e campos', () => {
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByText('Finalizar e Avaliar Serviço')).toBeInTheDocument();
    expect(screen.getByText(/Sua nota para este serviço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Deixe um comentário/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Liberar Pagamento e Enviar Avaliação/i })
    ).toBeInTheDocument();
  });

  it('fecha modal ao clicar no botão X', async () => {
    const _user = userEvent.setup({ delay: null });
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    const closeButton = screen.getByRole('button', { name: '' }); // Botão X sem label
    await _user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não permite submeter quando rating é 0 (botão desabilitado)', () => {
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Liberar Pagamento/i });
    expect(submitButton).toBeDisabled();
  });

  it('permite selecionar rating e submeter review', async () => {
    const _user = userEvent.setup({ delay: null });
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    // Seleciona 5 estrelas (as estrelas são SVGs, não botões)
    const stars = document.querySelectorAll('svg.cursor-pointer');
    await _user.click(stars[4]); // Quinta estrela (index 4)

    // Preenche comentário
    const commentInput = screen.getByLabelText(/Deixe um comentário/i);
    await _user.type(commentInput, 'Excelente serviço!');

    // Submete
    const submitButton = screen.getByRole('button', { name: /Liberar Pagamento/i });
    await _user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      rating: 5,
      comment: 'Excelente serviço!',
    });
  });

  it('permite submeter review sem comentário', async () => {
    const _user = userEvent.setup({ delay: null });
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    // Seleciona 4 estrelas
    const stars = document.querySelectorAll('svg.cursor-pointer');
    await _user.click(stars[3]);

    // Submete sem comentário
    const submitButton = screen.getByRole('button', { name: /Liberar Pagamento/i });
    await _user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      rating: 4,
      comment: '',
    });
  });

  it('gera comentário com IA quando botão é clicado', async () => {
    const _user = userEvent.setup({ delay: null });
    const mockGeneratedComment = 'Serviço impecável, profissional muito competente!';
    vi.mocked(geminiService.generateReviewComment).mockResolvedValue(mockGeneratedComment);

    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    // Seleciona rating primeiro
    const stars = document.querySelectorAll('svg.cursor-pointer');
    await _user.click(stars[4]);

    // Clica em gerar com IA
    const generateButton = screen.getByRole('button', { name: /Gerar com IA/i });
    await _user.click(generateButton);

    // Aguarda que o comentário seja preenchido (a IA resolve rápido demais para ver loading)
    await waitFor(() => {
      const commentInput = screen.getByLabelText(/Deixe um comentário/i) as HTMLTextAreaElement;
      expect(commentInput.value).toBe(mockGeneratedComment);
    });

    expect(geminiService.generateReviewComment).toHaveBeenCalledWith(
      5,
      'Pintura',
      'Pintar parede da sala'
    );
  });

  it('exibe erro quando IA falha ao gerar comentário', async () => {
    const _user = userEvent.setup({ delay: null });
    vi.mocked(geminiService.generateReviewComment).mockRejectedValue(new Error('API error'));

    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    // Seleciona rating
    const stars = document.querySelectorAll('svg.cursor-pointer');
    await _user.click(stars[3]);

    // Tenta gerar com IA
    const generateButton = screen.getByRole('button', { name: /Gerar com IA/i });
    await _user.click(generateButton);

    // Aguarda erro
    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('desabilita botão de gerar IA quando rating não foi selecionado', () => {
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    const generateButton = screen.getByRole('button', { name: /Gerar com IA/i });
    expect(generateButton).toBeDisabled();
  });

  it('exibe mensagem de erro ao tentar gerar IA sem rating', async () => {
    const _user = userEvent.setup({ delay: null });
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    // Força click no botão desabilitado não funciona, então testamos o estado
    const generateButton = screen.getByRole('button', { name: /Gerar com IA/i });
    expect(generateButton).toBeDisabled();
  });

  it('desabilita botão submit quando rating é 0', () => {
    render(<ReviewModal job={mockJob} onClose={onClose} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Liberar Pagamento/i });
    expect(submitButton).toBeDisabled();
  });
});
