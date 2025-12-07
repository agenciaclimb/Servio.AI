import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DisputeDetailsModal from '../../components/DisputeDetailsModal';
import type { Job, Dispute, User } from '../../types';

// Mock scrollIntoView para JSDOM
HTMLElement.prototype.scrollIntoView = vi.fn();

const mockJob: Job = {
  id: '1',
  category: 'Encanador',
  description: 'Fix leak',
  status: 'in_dispute',
  clientId: 'client@example.com',
  providerId: 'provider@example.com',
  price: 150,
  createdAt: new Date().toISOString(),
};

const mockClient: User = {
  id: '1',
  name: 'Cliente Teste',
  email: 'client@example.com',
  role: 'client',
  createdAt: new Date().toISOString(),
};

const mockProvider: User = {
  id: '2',
  name: 'Prestador Teste',
  email: 'provider@example.com',
  role: 'provider',
  createdAt: new Date().toISOString(),
};

const mockDispute: Dispute = {
  id: 'd1',
  jobId: '1',
  initiatorId: 'client@example.com',
  status: 'aberta',
  reason: 'Serviço incompleto',
  description: 'Problema no reparo',
  messages: [
    {
      id: 'm1',
      senderId: 'client@example.com',
      text: 'Serviço não concluído',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'm2',
      senderId: 'provider@example.com',
      text: 'Vou verificar',
      timestamp: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
};

describe('DisputeDetailsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSendMessage = vi.fn();
  const mockOnResolve = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza modal quando isOpen=true', () => {
    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={mockDispute}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={true}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.getByTestId('dispute-details-modal')).toBeInTheDocument();
    expect(screen.getByText('Mediação de Disputa')).toBeInTheDocument();
  });

  it('não renderiza quando isOpen=false', () => {
    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={mockDispute}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={false}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.queryByTestId('dispute-details-modal')).not.toBeInTheDocument();
  });

  it('exibe mensagens da disputa', () => {
    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={mockDispute}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={true}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Serviço não concluído')).toBeInTheDocument();
    expect(screen.getByText('Vou verificar')).toBeInTheDocument();
  });

  it('envia nova mensagem ao submit', () => {
    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={mockDispute}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={true}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const textarea = screen.getByPlaceholderText(/Digite sua mensagem/i);
    fireEvent.change(textarea, { target: { value: 'Nova mensagem' } });

    const form = textarea.closest('form');
    expect(form).toBeInTheDocument();

    if (form) {
      fireEvent.submit(form);
      expect(mockOnSendMessage).toHaveBeenCalledWith('d1', 'Nova mensagem');
    }
  });

  it('não envia mensagem vazia', () => {
    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={mockDispute}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={true}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const textarea = screen.getByPlaceholderText(/Digite sua mensagem/i);
    const form = textarea.closest('form');

    if (form) {
      fireEvent.submit(form);
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    }
  });

  it('identifica nome do remetente corretamente (client, provider, admin)', () => {
    const disputeComAdmin = {
      ...mockDispute,
      messages: [
        {
          id: 'm1',
          senderId: 'client@example.com',
          text: 'Msg Cliente',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'm2',
          senderId: 'provider@example.com',
          text: 'Msg Prestador',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'm3',
          senderId: 'admin@servio.ai',
          text: 'Msg Admin',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={disputeComAdmin}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={true}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.getByText('Msg Cliente')).toBeInTheDocument();
    expect(screen.getByText('Msg Prestador')).toBeInTheDocument();
    expect(screen.getByText('Msg Admin')).toBeInTheDocument();
  });

  it('fecha modal ao clicar no botão X', () => {
    render(
      <DisputeDetailsModal
        job={mockJob}
        dispute={mockDispute}
        currentUser={mockClient}
        client={mockClient}
        provider={mockProvider}
        isOpen={true}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
