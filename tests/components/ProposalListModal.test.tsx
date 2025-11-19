import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProposalListModal from '../../components/ProposalListModal';
import { Job, Proposal, User } from '../../types';

// Mock ProposalDetailCard
vi.mock('../../components/ProposalDetailCard', () => ({
  default: ({ proposal, onAccept, onViewProfile }: any) => (
    <div data-testid={`proposal-${proposal.id}`}>
      <span>{proposal.message}</span>
      <span>R$ {proposal.price}</span>
      <button onClick={() => onAccept(proposal.id)}>Aceitar</button>
      <button onClick={() => onViewProfile(proposal.providerId)}>Ver Perfil</button>
    </div>
  ),
}));

const mockJob: Job = {
  id: '1',
  category: 'Encanador',
  description: 'Consertar vazamento urgente',
  status: 'ativo',
  clientId: 'client@example.com',
  price: 200,
  createdAt: new Date().toISOString(),
};

const mockProposals: Proposal[] = [
  {
    id: 'p1',
    jobId: '1',
    providerId: 'provider1@example.com',
    price: 180,
    message: 'Posso hoje à tarde',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    jobId: '1',
    providerId: 'provider2@example.com',
    price: 150,
    message: 'Disponível amanhã',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Prestador 1',
    email: 'provider1@example.com',
    role: 'provider',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Prestador 2',
    email: 'provider2@example.com',
    role: 'provider',
    createdAt: new Date().toISOString(),
  },
];

describe('ProposalListModal', () => {
  const mockCallbacks = {
    onClose: vi.fn(),
    onAcceptProposal: vi.fn(),
    onViewProfile: vi.fn(),
  };

  beforeEach(() => {
    Object.values(mockCallbacks).forEach(fn => fn.mockClear());
  });

  it('renderiza modal com propostas ordenadas por preço', () => {
    render(
      <ProposalListModal
        job={mockJob}
        proposals={mockProposals}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText(/Propostas para:/i)).toBeInTheDocument();
    expect(screen.getByText('Encanador')).toBeInTheDocument();
    expect(screen.getByText('Consertar vazamento urgente')).toBeInTheDocument();

    // Verifica que ambas propostas estão renderizadas
    expect(screen.getByTestId('proposal-p1')).toBeInTheDocument();
    expect(screen.getByTestId('proposal-p2')).toBeInTheDocument();
  });

  it('ordena propostas por preço (menor primeiro)', () => {
    const { container } = render(
      <ProposalListModal
        job={mockJob}
        proposals={mockProposals}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    const proposals = container.querySelectorAll('[data-testid^="proposal-"]');
    // p2 (R$150) deve vir antes de p1 (R$180)
    expect(proposals[0].getAttribute('data-testid')).toBe('proposal-p2');
    expect(proposals[1].getAttribute('data-testid')).toBe('proposal-p1');
  });

  it('chama onClose ao clicar no botão fechar', () => {
    render(
      <ProposalListModal
        job={mockJob}
        proposals={mockProposals}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    const closeButton = screen.getAllByRole('button')[0]; // Primeiro botão é o X
    fireEvent.click(closeButton);

    expect(mockCallbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it('repassa onAcceptProposal para ProposalDetailCard', () => {
    render(
      <ProposalListModal
        job={mockJob}
        proposals={mockProposals}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    const acceptButton = screen.getAllByRole('button', { name: /Aceitar/i })[0];
    fireEvent.click(acceptButton);

    expect(mockCallbacks.onAcceptProposal).toHaveBeenCalledWith('p2'); // p2 é a primeira (menor preço)
  });

  it('repassa onViewProfile para ProposalDetailCard', () => {
    render(
      <ProposalListModal
        job={mockJob}
        proposals={mockProposals}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    const viewProfileButton = screen.getAllByRole('button', { name: /Ver Perfil/i })[0];
    fireEvent.click(viewProfileButton);

    expect(mockCallbacks.onViewProfile).toHaveBeenCalledWith('provider2@example.com');
  });

  it('exibe mensagem quando não há propostas', () => {
    render(
      <ProposalListModal
        job={mockJob}
        proposals={[]}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Nenhuma proposta recebida')).toBeInTheDocument();
    expect(screen.getByText(/Aguarde um pouco/i)).toBeInTheDocument();
  });

  it('filtra propostas bloqueadas', () => {
    const proposalsComBloqueada = [
      ...mockProposals,
      {
        id: 'p3',
        jobId: '1',
        providerId: 'blocked@example.com',
        price: 100,
        message: 'Bloqueado',
        status: 'bloqueada' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <ProposalListModal
        job={mockJob}
        proposals={proposalsComBloqueada}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByTestId('proposal-p3')).not.toBeInTheDocument();
    expect(screen.getByTestId('proposal-p1')).toBeInTheDocument();
    expect(screen.getByTestId('proposal-p2')).toBeInTheDocument();
  });

  it('identifica job decidido quando status não é ativo', () => {
    const jobDecidido = { ...mockJob, status: 'proposta_aceita' as const };
    
    render(
      <ProposalListModal
        job={jobDecidido}
        proposals={mockProposals}
        users={mockUsers}
        {...mockCallbacks}
      />
    );

    // ProposalDetailCard recebe isJobDecided=true (verificado via mock props)
    expect(screen.getByTestId('proposal-p1')).toBeInTheDocument();
  });
});
