import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProposalDetailCard from '../../components/ProposalDetailCard';
import { Proposal, User } from '../../types';

describe('ProposalDetailCard Component', () => {
  const mockProposal: Proposal = {
    id: 'prop1',
    jobId: 'job1',
    providerId: 'provider@test.com',
    price: 250,
    message: 'Posso fazer o serviço amanhã',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  };

  const mockProvider: User = {
    name: 'Maria Santos',
    email: 'provider@test.com',
    role: 'prestador',
  };

  it('renderiza nome do prestador', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('mostra providerId quando provider não está disponível', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('provider@test.com')).toBeInTheDocument();
  });

  it('renderiza valor da proposta em formato pt-BR', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
  });

  it('mostra badge "Pendente" para status pendente', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('mostra badge "Aceita" para status aceita', () => {
    const acceptedProposal = { ...mockProposal, status: 'aceita' as const };
    render(
      <ProposalDetailCard
        proposal={acceptedProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('Aceita')).toBeInTheDocument();
  });

  it('mostra badge "Recusada" para status recusada', () => {
    const rejectedProposal = { ...mockProposal, status: 'recusada' as const };
    render(
      <ProposalDetailCard
        proposal={rejectedProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('Recusada')).toBeInTheDocument();
  });

  it('mostra badge "Bloqueada" para status bloqueada', () => {
    const blockedProposal = { ...mockProposal, status: 'bloqueada' as const };
    render(
      <ProposalDetailCard
        proposal={blockedProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('Bloqueada')).toBeInTheDocument();
  });

  it('renderiza descrição da proposta', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText(/amanhã/)).toBeInTheDocument();
  });

  it('chama onViewProfile ao clicar no nome do prestador', async () => {
    const user = userEvent.setup();
    const onViewProfile = vi.fn();
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={onViewProfile}
        isJobDecided={false}
        onViewProfile={onViewProfile}
      />
    );
    
    await user.click(screen.getByText('Maria Santos'));
    
    expect(onViewProfile).toHaveBeenCalledWith('provider@test.com');
  });

  it('mostra botão "Aceitar e Pagar com Segurança" quando pendente e job não decidido', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.getByText('Aceitar e Pagar com Segurança')).toBeInTheDocument();
  });

  it('chama onAccept ao clicar em "Aceitar e Pagar com Segurança"', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={onAccept}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    await user.click(screen.getByText('Aceitar e Pagar com Segurança'));
    
    expect(onAccept).toHaveBeenCalledWith('prop1');
  });

  it('não mostra botão quando job já foi decidido', () => {
    render(
      <ProposalDetailCard
        proposal={mockProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={true}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.queryByText('Aceitar e Pagar com Segurança')).not.toBeInTheDocument();
  });

  it('não mostra botão quando proposta não está pendente', () => {
    const acceptedProposal = { ...mockProposal, status: 'aceita' as const };
    render(
      <ProposalDetailCard
        proposal={acceptedProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    expect(screen.queryByText('Aceitar e Pagar com Segurança')).not.toBeInTheDocument();
  });

  it('aplica opacidade reduzida quando proposta não está pendente', () => {
    const acceptedProposal = { ...mockProposal, status: 'aceita' as const };
    const { container } = render(
      <ProposalDetailCard
        proposal={acceptedProposal}
        provider={mockProvider}
        onAccept={vi.fn()}
        isJobDecided={false}
        onViewProfile={vi.fn()}
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('opacity-75');
  });
});
