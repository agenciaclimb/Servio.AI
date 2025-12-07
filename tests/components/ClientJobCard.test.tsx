import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientJobCard from '../../components/ClientJobCard';
import { Job, Proposal } from '../../types';

const mockJob: Job = {
  id: '1',
  category: 'Encanador',
  description: 'Consertar vazamento na cozinha',
  status: 'ativo',
  clientId: 'client@example.com',
  price: 150,
  createdAt: new Date().toISOString(),
  address: 'Rua Exemplo, 123 - São Paulo, SP',
};

const mockProposals: Proposal[] = [
  {
    id: 'p1',
    jobId: '1',
    providerId: 'provider@example.com',
    price: 150,
    message: 'Posso fazer hoje',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    jobId: '1',
    providerId: 'provider2@example.com',
    price: 180,
    message: 'Faço amanhã',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
];

describe('ClientJobCard', () => {
  const mockCallbacks = {
    onViewProposals: vi.fn(),
    onChat: vi.fn(),
    onFinalize: vi.fn(),
    onReportIssue: vi.fn(),
    onViewOnMap: vi.fn(),
  };

  beforeEach(() => {
    Object.values(mockCallbacks).forEach(fn => fn.mockClear());
  });

  it('renderiza job com status ativo e contador de propostas', () => {
    render(<ClientJobCard job={mockJob} proposals={mockProposals} {...mockCallbacks} />);

    expect(screen.getByText('Encanador')).toBeInTheDocument();
    expect(screen.getByText('Consertar vazamento na cozinha')).toBeInTheDocument();
    expect(screen.getByText('Buscando Profissionais')).toBeInTheDocument();
    expect(screen.getByText(/2 Propostas/i)).toBeInTheDocument();
  });

  it('exibe endereço quando presente', () => {
    render(<ClientJobCard job={mockJob} proposals={[]} {...mockCallbacks} />);

    expect(screen.getByText('Rua Exemplo, 123 - São Paulo, SP')).toBeInTheDocument();
  });

  it('chama onViewProposals ao clicar em Ver Propostas', () => {
    render(<ClientJobCard job={mockJob} proposals={mockProposals} {...mockCallbacks} />);

    const button = screen.getByRole('button', { name: /Ver Propostas/i });
    fireEvent.click(button);

    expect(mockCallbacks.onViewProposals).toHaveBeenCalledTimes(1);
  });

  it('desabilita botão Ver Propostas quando não há propostas', () => {
    render(<ClientJobCard job={mockJob} proposals={[]} {...mockCallbacks} />);

    const button = screen.getByRole('button', { name: /Ver Propostas/i });
    expect(button).toBeDisabled();
  });

  it('exibe botão de leilão quando status é em_leilao', () => {
    const leilaoJob = { ...mockJob, status: 'em_leilao' as const };
    render(<ClientJobCard job={leilaoJob} proposals={[]} {...mockCallbacks} />);

    const button = screen.getByRole('button', { name: /Acompanhar Leilão/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockCallbacks.onViewProposals).toHaveBeenCalledTimes(1);
  });

  it('exibe botões Chat e Mapa quando status é proposta_aceita', () => {
    const jobAceito = { ...mockJob, status: 'proposta_aceita' as const };
    render(<ClientJobCard job={jobAceito} proposals={[]} {...mockCallbacks} />);

    const chatButton = screen.getByRole('button', { name: /Chat/i });
    expect(chatButton).toBeInTheDocument();

    const mapButton = screen.getByRole('button', { name: /Ver no Mapa/i });
    expect(mapButton).toBeInTheDocument();

    fireEvent.click(chatButton);
    expect(mockCallbacks.onChat).toHaveBeenCalledTimes(1);

    fireEvent.click(mapButton);
    expect(mockCallbacks.onViewOnMap).toHaveBeenCalledWith(jobAceito);
  });

  it('exibe botão Finalizar e Avaliar quando status é pagamento_pendente', () => {
    const jobPendente = { ...mockJob, status: 'pagamento_pendente' as const };
    render(<ClientJobCard job={jobPendente} proposals={[]} {...mockCallbacks} />);

    const button = screen.getByRole('button', { name: /Finalizar e Avaliar/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockCallbacks.onFinalize).toHaveBeenCalledTimes(1);
  });

  it('exibe botão Ver Disputa quando status é em_disputa', () => {
    const jobDisputa = { ...mockJob, status: 'em_disputa' as const };
    render(<ClientJobCard job={jobDisputa} proposals={[]} {...mockCallbacks} />);

    const button = screen.getByRole('button', { name: /Ver Disputa/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockCallbacks.onChat).toHaveBeenCalledTimes(1);
  });

  it('aplica classe CSS correta para cada status', () => {
    const statuses = [
      { status: 'ativo' as const, text: 'Buscando Profissionais', className: 'bg-blue-100' },
      { status: 'em_leilao' as const, text: 'Em Leilão', className: 'bg-orange-100' },
      { status: 'agendado' as const, text: 'Serviço Agendado', className: 'bg-indigo-100' },
      { status: 'concluido' as const, text: 'Concluído', className: 'bg-gray-200' },
    ];

    statuses.forEach(({ status, text, className }) => {
      const { container } = render(
        <ClientJobCard job={{ ...mockJob, status }} proposals={[]} {...mockCallbacks} />
      );

      const statusBadge = screen.getByText(text);
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.className).toContain(className);

      container.remove();
    });
  });
});
