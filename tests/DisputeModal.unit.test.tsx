import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisputeModal from '../components/DisputeModal';
import type { Job, User, Dispute, Message } from '../types';

const makeMsg = (over: Partial<Message> = {}): Message => ({
  id: over.id ?? 'm1',
  jobId: over.jobId ?? 'job-1',
  senderId: over.senderId ?? 'client@test.com',
  text: over.text ?? 'Mensagem inicial',
  createdAt: over.createdAt ?? new Date().toISOString(),
});

const job: Job = {
  id: 'job-1',
  title: 'Reparo',
  category: 'reparos' as any,
  description: 'Ajustar porta',
  clientId: 'client-1',
  status: 'em_disputa' as any,
  serviceType: 'personalizado' as any,
  createdAt: new Date(),
} as Job;

const client: User = { id: 'client-1', name: 'Cliente', email: 'client@test.com', role: 'client' as any };
const provider: User = { id: 'prov-1', name: 'Prestador', email: 'prov@test.com', role: 'provider' as any };

const dispute: Dispute = {
  id: 'd1',
  jobId: 'job-1',
  openedBy: 'client@test.com',
  status: 'open' as any,
  createdAt: new Date().toISOString(),
  messages: [
    makeMsg({ id: 'm1', senderId: 'client@test.com', text: 'Problema no serviço' }),
    makeMsg({ id: 'm2', senderId: 'prov@test.com', text: 'Vamos resolver' }),
  ],
};

describe('DisputeModal (unit)', () => {
  const onClose = vi.fn();
  const onSendMessage = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renderiza cabeçalho e nota de pagamento pausado', () => {
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );

    expect(screen.getByText(/Disputa em Aberto/i)).toBeInTheDocument();
    // Texto está dividido em nós: "O pagamento está" + <span>"pausado"</span>
    expect(screen.getByText(/O pagamento está/i)).toBeInTheDocument();
    expect(screen.getByText(/pausado/i)).toBeInTheDocument();
    expect(screen.getByText(/Problema no serviço/i)).toBeInTheDocument();
    expect(screen.getByText(/Vamos resolver/i)).toBeInTheDocument();
  });

  it('envia mensagem ao submeter quando há texto e outra parte', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLInputElement;
    await user.type(input, 'Nova mensagem');

  // Há dois botões sem nome acessível (fechar e enviar). Clicar no segundo (submit)
  const buttons = screen.getAllByRole('button');
  await user.click(buttons[1]);

    expect(onSendMessage).toHaveBeenCalledWith('Nova mensagem');
    expect(input.value).toBe('');
  });

  it('não envia quando mensagem vazia ou só espaços', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLInputElement;
    await user.type(input, '    ');
  const buttons = screen.getAllByRole('button');
  await user.click(buttons[1]);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('não envia se otherParty estiver ausente', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <DisputeModal user={client} job={job} dispute={dispute} onClose={onClose} onSendMessage={onSendMessage} />
    );

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLInputElement;
    await user.type(input, 'Sem outro usuário');
  const buttons = screen.getAllByRole('button');
  await user.click(buttons[1]);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('fecha ao clicar no botão de fechar', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );

    const closeBtn = screen.getAllByRole('button')[0];
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('exibe nome da outra parte no cabeçalho', () => {
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );
    expect(screen.getByText(/Job:/)).toBeInTheDocument();
    expect(screen.getByText(/Prestador/)).toBeInTheDocument();
  });

  it('alinha mensagens conforme remetente (cliente à direita, prestador à esquerda)', () => {
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );
    const msgCliente = screen.getByText('Problema no serviço');
    const msgPrestador = screen.getByText('Vamos resolver');

    // Verifica classes de alinhamento nos containers ancestrais imediatos
    const bubbleCliente = msgCliente.closest('div');
    const rowCliente = bubbleCliente?.parentElement as HTMLElement;
    const bubblePrestador = msgPrestador.closest('div');
    const rowPrestador = bubblePrestador?.parentElement as HTMLElement;

    expect(rowCliente?.className).toMatch(/justify-end/);
    expect(rowPrestador?.className).toMatch(/justify-start/);
  });

  it('fecha ao clicar no overlay', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );
    // O overlay é o container com role dialog no getModalOverlayProps; usamos getByRole('dialog')
    const overlay = screen.getByRole('dialog');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('mostra "Usuário" no cabeçalho quando otherParty não é fornecido', () => {
    render(
      <DisputeModal user={client} job={job} dispute={dispute} onClose={onClose} onSendMessage={onSendMessage} />
    );
    expect(screen.getByText(/Job:/)).toBeInTheDocument();
    expect(screen.getByText(/Usuário/)).toBeInTheDocument();
  });

  it('envia mensagem ao pressionar Enter', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <DisputeModal user={client} job={job} dispute={dispute} otherParty={provider} onClose={onClose} onSendMessage={onSendMessage} />
    );
    const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLInputElement;
    await user.type(input, 'Mensagem via enter{enter}');

    expect(onSendMessage).toHaveBeenCalledWith('Mensagem via enter');
    expect(input.value).toBe('');
  });
});
