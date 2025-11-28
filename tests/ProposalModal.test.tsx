import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProposalModal from '../components/ProposalModal';
import type { Job, User } from '../types';
import * as geminiService from '../services/geminiService';

vi.mock('../services/geminiService', () => ({
  generateProposalMessage: vi.fn(),
}));

describe('ProposalModal', () => {
  const mockJob: Job = {
    id: 'job-1',
    title: 'Pintar sala',
    category: 'Pintura',
    description: 'Preciso pintar minha sala de 20m²',
    clientId: 'client-1',
    status: 'open',
    serviceType: 'orcamento',
    createdAt: new Date(),
  } as Job;

  const mockFixedPriceJob: Job = {
    ...mockJob,
    serviceType: 'tabelado',
    fixedPrice: 250,
  } as Job;

  const mockProvider: User = {
    id: 'provider-1',
    name: 'João Pintor',
    email: 'joao@test.com',
    role: 'provider',
  } as User;

  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza modal com informações do job', () => {
    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Enviar Proposta')).toBeInTheDocument();
    expect(screen.getByText(/Pintura/i)).toBeInTheDocument();
    expect(screen.getByText(/Preciso pintar minha sala/i)).toBeInTheDocument();
  });

  it('fecha modal ao clicar no X', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    const closeButton = screen.getAllByRole('button')[0]; // Botão X
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('permite enviar proposta com preço e mensagem', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    // Preenche preço
    const priceInput = screen.getByLabelText(/Seu Orçamento/i);
    await user.clear(priceInput);
    await user.type(priceInput, '350.50');

    // Preenche mensagem
    const messageInput = screen.getByLabelText(/Mensagem/i);
    await user.type(messageInput, 'Tenho experiência de 10 anos em pintura');

    // Submete
    const submitButton = screen.getByRole('button', { name: /Confirmar e Enviar/i });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      message: 'Tenho experiência de 10 anos em pintura',
      price: 350.5,
    });
  });

  it('exibe erro quando preço é inválido', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    // Tenta submeter com preço negativo
    const priceInput = screen.getByLabelText(/Seu Orçamento/i);
    await user.clear(priceInput);
    await user.type(priceInput, '-50');

    const submitButton = screen.getByRole('button', { name: /Confirmar e Enviar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Por favor, insira um valor válido/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('desabilita campo de preço quando serviceType é tabelado', () => {
    render(
      <ProposalModal
        job={mockFixedPriceJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    const priceInput = screen.getByLabelText(/Valor Fixo do Serviço/i);
    expect(priceInput).toBeDisabled();
    expect(priceInput).toHaveValue(250);
  });

  it('gera mensagem com IA quando botão é clicado', async () => {
    const user = userEvent.setup({ delay: null });
    const mockGeneratedMessage = 'Olá! Sou especialista em pintura residencial com 15 anos de experiência.';
    vi.mocked(geminiService.generateProposalMessage).mockResolvedValue(mockGeneratedMessage);

    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    // Clica em gerar com IA
    const generateButton = screen.getByRole('button', { name: /Gerar com IA/i });
    await user.click(generateButton);

    // Aguarda que a mensagem seja preenchida
    await waitFor(() => {
      const messageInput = screen.getByLabelText(/Mensagem/i) as HTMLTextAreaElement;
      expect(messageInput.value).toBe(mockGeneratedMessage);
    });

    expect(geminiService.generateProposalMessage).toHaveBeenCalledWith(mockJob, mockProvider);
  });

  it('exibe erro quando IA falha ao gerar mensagem', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(geminiService.generateProposalMessage).mockRejectedValue(new Error('API timeout'));

    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    const generateButton = screen.getByRole('button', { name: /Gerar com IA/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/API timeout/i)).toBeInTheDocument();
    });
  });

  it('permite submeter proposta sem mensagem', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    // Preenche apenas preço
    const priceInput = screen.getByLabelText(/Seu Orçamento/i);
    await user.clear(priceInput);
    await user.type(priceInput, '200');

    const submitButton = screen.getByRole('button', { name: /Confirmar e Enviar/i });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      message: '',
      price: 200,
    });
  });

  it('exibe dica de segurança', () => {
    render(
      <ProposalModal
        job={mockJob}
        provider={mockProvider}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(/Dica de Segurança/i)).toBeInTheDocument();
    expect(screen.getByText(/Mantenha todas as negociações/i)).toBeInTheDocument();
  });
});
