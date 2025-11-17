import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ProposalModal from '../doc/ProposalModal'; // Ajuste o caminho conforme necessário
import { Job } from '../types';

const mockJob: Job = {
  id: 'job123',
  clientId: 'client@example.com',
  category: 'Encanamento',
  description: 'Vazamento na pia da cozinha',
  status: 'ativo',
  createdAt: new Date().toISOString(),
  title: 'Consertar vazamento',
};

describe('ProposalModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza quando isOpen é false ou job é null', () => {
    const { container } = render(<ProposalModal job={mockJob} isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);
    expect(container).toBeEmptyDOMElement();

    const { container: container2 } = render(<ProposalModal job={null} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);
    expect(container2).toBeEmptyDOMElement();
  });

  it('renderiza corretamente com os dados do job', () => {
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByText('Sua proposta para o serviço')).toBeInTheDocument();
    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor da Proposta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição da Proposta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo Estimado para Conclusão/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Proposta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('atualiza o estado ao digitar nos campos', async () => {
    const user = userEvent.setup();
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    const priceInput = screen.getByLabelText(/Valor da Proposta/i);
    const descriptionInput = screen.getByLabelText(/Descrição da Proposta/i);
    const durationInput = screen.getByLabelText(/Tempo Estimado para Conclusão/i);

    await user.type(priceInput, '250');
    await user.type(descriptionInput, 'Minha proposta detalhada.');
    await user.type(durationInput, '4 horas');

    expect(priceInput).toHaveValue(250);
    expect(descriptionInput).toHaveValue('Minha proposta detalhada.');
    expect(durationInput).toHaveValue('4 horas');
  });

  it('chama onSubmit com os dados corretos ao submeter', async () => {
    const user = userEvent.setup();
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    const priceInput = screen.getByLabelText(/Valor da Proposta/i);
    const descriptionInput = screen.getByLabelText(/Descrição da Proposta/i);
    const durationInput = screen.getByLabelText(/Tempo Estimado para Conclusão/i);
    const submitButton = screen.getByRole('button', { name: /Enviar Proposta/i });

    await user.type(priceInput, '300');
    await user.type(descriptionInput, 'Proposta para o serviço.');
    await user.type(durationInput, '1 dia');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      price: 300,
      description: 'Proposta para o serviço.',
      estimatedDuration: '1 dia',
    });
  });

  it('exibe mensagem de erro para campos obrigatórios vazios', async () => {
    const user = userEvent.setup();
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: /Enviar Proposta/i });
    await user.click(submitButton);

    expect(screen.getByText('Todos os campos são obrigatórios.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('exibe mensagem de erro para preço inválido (<= 0)', async () => {
    const user = userEvent.setup();
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    const priceInput = screen.getByLabelText(/Valor da Proposta/i);
    const descriptionInput = screen.getByLabelText(/Descrição da Proposta/i);
    const durationInput = screen.getByLabelText(/Tempo Estimado para Conclusão/i);
    const submitButton = screen.getByRole('button', { name: /Enviar Proposta/i });

    await user.type(priceInput, '0');
    await user.type(descriptionInput, 'Descrição.');
    await user.type(durationInput, 'Duração.');
    await user.click(submitButton);

    expect(screen.getByText('O valor da proposta deve ser positivo.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('desabilita o botão de submissão quando isLoading é true', () => {
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /Enviando.../i });
    expect(submitButton).toBeDisabled();
  });

  it('chama onClose ao clicar no botão "Cancelar"', async () => {
    const user = userEvent.setup();
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar no botão de fechar (X)', async () => {
    const user = userEvent.setup();
    render(<ProposalModal job={mockJob} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isLoading={false} />);

    const closeButton = screen.getByRole('button', { name: /×/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});