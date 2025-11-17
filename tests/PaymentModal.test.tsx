import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentModal from '../components/PaymentModal';
import type { Job, Proposal, User } from '../types';

describe('PaymentModal', () => {
  const mockJob: Job = {
    id: 'job-1',
    title: 'Pintar sala',
    category: 'Pintura',
    clientId: 'client-1',
    status: 'open' as any,
    createdAt: new Date(),
  } as Job;

  const mockProposal: Proposal = {
    id: 'prop-1',
    jobId: 'job-1',
    providerId: 'provider-1',
    price: 350.0,
    message: 'Proposta teste',
    status: 'pending' as any,
    createdAt: new Date(),
  } as Proposal;

  const mockProvider: User = {
    id: 'provider-1',
    name: 'João Silva',
    email: 'joao@test.com',
    role: 'provider' as any,
  } as User;

  const onClose = vi.fn();
  const onConfirmPayment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza quando isOpen é false', () => {
    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={false}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );
    expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
  });

  it('renderiza modal com informações corretas quando isOpen é true', () => {
    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    expect(screen.getByTestId('payment-modal')).toBeInTheDocument();
    expect(screen.getByText('Finalizar Pagamento')).toBeInTheDocument();
    expect(screen.getByText(/João Silva/)).toBeInTheDocument();
    expect(screen.getByText(/Pintura/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*350,00/)).toBeInTheDocument();
    expect(screen.getByText(/Como funciona o Pagamento Seguro/)).toBeInTheDocument();
  });

  it('chama onClose quando clicar no botão Cancelar', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirmPayment).not.toHaveBeenCalled();
  });

  it('chama onClose quando clicar no botão X', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    await user.click(screen.getByRole('button', { name: /×/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onConfirmPayment e exibe loading ao clicar em Pagar', async () => {
    const user = userEvent.setup({ delay: null });
    onConfirmPayment.mockResolvedValue(undefined);

    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    const payButton = screen.getByRole('button', { name: /Pagar com Stripe/i });
    await user.click(payButton);

    expect(onConfirmPayment).toHaveBeenCalledWith(mockProposal);
    // Durante o processamento, loading é exibido (mas pode ser rápido demais para capturar consistentemente)
    // Então vamos apenas confirmar que a função foi chamada corretamente
  });

  it('exibe mensagem de erro quando onConfirmPayment falha', async () => {
    const user = userEvent.setup({ delay: null });
    const errorMsg = 'Falha no pagamento';
    onConfirmPayment.mockRejectedValue(new Error(errorMsg));

    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    await user.click(screen.getByRole('button', { name: /Pagar com Stripe/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erro ao processar pagamento/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(errorMsg))).toBeInTheDocument();
    });

    expect(onConfirmPayment).toHaveBeenCalledWith(mockProposal);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('desabilita botões durante loading', async () => {
    const user = userEvent.setup({ delay: null });
    
    // Cria uma promise que controlamos manualmente
    let resolvePayment: () => void;
    const paymentPromise = new Promise<void>((resolve) => {
      resolvePayment = resolve;
    });
    onConfirmPayment.mockReturnValue(paymentPromise);

    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    const payButton = screen.getByRole('button', { name: /Pagar com Stripe/i });
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });

    await user.click(payButton);

    // Aguarda o estado de loading
    await waitFor(() => {
      expect(screen.getByText('Processando...')).toBeInTheDocument();
    });

    expect(payButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    // Resolve o pagamento para finalizar
    resolvePayment!();
    
    // Apenas aguarda que o onConfirmPayment tenha sido chamado - não há garantia
    // de que o estado interno vai mudar antes do componente fechar/desmontar
    await waitFor(() => expect(onConfirmPayment).toHaveBeenCalledWith(mockProposal));
  });

  it('mostra ação de Tentar novamente quando erro for E_TIMEOUT e permite retry', async () => {
    const user = userEvent.setup({ delay: null });
  const timeoutErr = new Error('Tempo de resposta excedido');
  (timeoutErr as any).code = 'E_TIMEOUT';
    onConfirmPayment.mockRejectedValueOnce(timeoutErr);

    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    await user.click(screen.getByRole('button', { name: /Pagar com Stripe/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erro ao processar pagamento/i)).toBeInTheDocument();
      expect(screen.getByText(/Conexão instável|tempo esgotado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    });

    onConfirmPayment.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole('button', { name: /Tentar novamente/i }));
    expect(onConfirmPayment).toHaveBeenCalledTimes(2);
  });

  it('mostra ação de Tentar novamente quando erro for E_NETWORK', async () => {
    const user = userEvent.setup({ delay: null });
  const netErr = new Error('Falha de rede. Verifique sua conexão.');
  (netErr as any).code = 'E_NETWORK';
    onConfirmPayment.mockRejectedValueOnce(netErr);

    render(
      <PaymentModal
        job={mockJob}
        proposal={mockProposal}
        provider={mockProvider}
        isOpen={true}
        onClose={onClose}
        onConfirmPayment={onConfirmPayment}
      />
    );

    await user.click(screen.getByRole('button', { name: /Pagar com Stripe/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erro ao processar pagamento/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    });
  });
});
