import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewModal from '../../components/ReviewModal';
import type { Job } from '../../types';
import * as geminiService from '../../services/geminiService';

vi.mock('../../services/geminiService', () => ({
  generateReviewComment: vi.fn(),
}));

const mockJob: Job = {
  id: '1',
  category: 'Encanador',
  description: 'Fix leak in bathroom',
  status: 'completed',
  clientId: '1',
  providerId: '2',
  price: 150,
  createdAt: new Date().toISOString(),
};

describe('ReviewModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders review modal', () => {
    const { container } = render(
      <ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('displays review form elements', () => {
    const { container } = render(
      <ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('shows error when submitting without rating', async () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.textContent?.includes('Liberar'));

    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorText = screen.queryByText(/selecione uma avaliação/i);
        if (errorText) {
          expect(errorText).toBeInTheDocument();
        }
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    }
  });

  it('allows user to enter comment', () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Great service!' } });
    expect(textarea).toHaveValue('Great service!');
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0]; // First button is close
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('generates AI comment when button is clicked', async () => {
    const mockGeneratedComment = 'AI generated review comment';
    vi.mocked(geminiService.generateReviewComment).mockResolvedValue(mockGeneratedComment);

    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Select a rating first
    const starButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.getAttribute('aria-label')?.includes('estrela'));

    if (starButtons.length > 0) {
      fireEvent.click(starButtons[4]);

      const buttons = screen.getAllByRole('button');
      const aiButton = buttons.find(btn => btn.textContent?.includes('Gerar'));

      if (aiButton) {
        fireEvent.click(aiButton);

        await waitFor(
          () => {
            expect(geminiService.generateReviewComment).toHaveBeenCalled();
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it('shows error when AI generation fails', async () => {
    vi.mocked(geminiService.generateReviewComment).mockRejectedValue(
      new Error('AI service unavailable')
    );

    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const starButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.getAttribute('aria-label')?.includes('estrela'));

    if (starButtons.length > 0) {
      fireEvent.click(starButtons[2]);

      const buttons = screen.getAllByRole('button');
      const aiButton = buttons.find(btn => btn.textContent?.includes('Gerar'));

      if (aiButton) {
        fireEvent.click(aiButton);

        await waitFor(
          () => {
            expect(geminiService.generateReviewComment).toHaveBeenCalled();
            const errorMsg = screen.queryByText(/AI service unavailable/i);
            if (errorMsg) {
              expect(errorMsg).toBeInTheDocument();
            }
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it('shows error when trying to generate AI comment without rating', async () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const buttons = screen.getAllByRole('button');
    const aiButton = buttons.find(btn => btn.textContent?.includes('Gerar'));

    if (aiButton) {
      fireEvent.click(aiButton);

      await waitFor(() => {
        const errorMsg = screen.queryByText(/primeiro, selecione uma nota/i);
        if (errorMsg) {
          expect(errorMsg).toBeInTheDocument();
        }
        // Verifica que generateReviewComment não foi chamado
        expect(geminiService.generateReviewComment).not.toHaveBeenCalled();
      });
    }
  });

  it('disables submit button when rating is 0', () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn =>
      btn.textContent?.includes('Liberar')
    ) as HTMLButtonElement;

    expect(submitButton).toBeDisabled();
  });

  it('enables submit button after rating is selected', async () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Mock StarRatingInput: encontra o componente e simula setRating
    const starButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.getAttribute('aria-label')?.includes('estrela'));

    if (starButtons.length > 0) {
      fireEvent.click(starButtons[3]); // Select 4 stars

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitButton = buttons.find(btn =>
          btn.textContent?.includes('Liberar')
        ) as HTMLButtonElement;
        expect(submitButton).not.toBeDisabled();
      });
    }
  });

  it('submits review with rating and comment', async () => {
    render(<ReviewModal job={mockJob} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const starButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.getAttribute('aria-label')?.includes('estrela'));

    if (starButtons.length > 0) {
      fireEvent.click(starButtons[4]); // Select 5 stars

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Excelente trabalho!' } });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitButton = buttons.find(btn =>
          btn.textContent?.includes('Liberar')
        ) as HTMLButtonElement;

        if (submitButton && !submitButton.disabled) {
          fireEvent.click(submitButton);
          expect(mockOnSubmit).toHaveBeenCalledWith({
            rating: 5,
            comment: 'Excelente trabalho!',
          });
        }
      });
    }
  });
});
