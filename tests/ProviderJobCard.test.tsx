import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderJobCard from '../components/ProviderJobCard';
import type { Job, User } from '../types';

const baseJob = (over: Partial<Job> = {}): Job =>
  ({
    id: 'job-1',
    title: 'Limpeza pós-obra',
    category: 'limpeza' as any,
    description: 'Limpeza de apartamento 70m²',
    clientId: 'client-1',
    status: 'open' as any,
    serviceType: 'personalizado' as any,
    createdAt: new Date(),
    ...over,
  }) as Job;

const client: User = {
  id: 'client-1',
  name: 'Maria',
  email: 'maria@test.com',
  role: 'client' as any,
};

describe('ProviderJobCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza categoria e cliente', () => {
    const job = baseJob({ status: 'agendado' as any });
    render(<ProviderJobCard job={job} client={client} onChat={vi.fn()} onUpdateStatus={vi.fn()} />);
    // Pode haver múltiplas ocorrências de "limpeza"; validamos ao menos uma
    expect(screen.getAllByText(/limpeza/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Cliente: Maria/i)).toBeInTheDocument();
  });

  it('chama onUpdateStatus para a_caminho quando status agendado', async () => {
    const user = userEvent.setup({ delay: null });
    const onUpdateStatus = vi.fn();
    const job = baseJob({ status: 'agendado' as any });
    render(
      <ProviderJobCard job={job} client={client} onChat={vi.fn()} onUpdateStatus={onUpdateStatus} />
    );

    const btn = screen.getByRole('button', { name: /Estou a Caminho/i });
    await user.click(btn);

    expect(onUpdateStatus).toHaveBeenCalledWith('job-1', 'a_caminho');
  });

  it('chama onUpdateStatus para em_progresso quando status a_caminho', async () => {
    const user = userEvent.setup({ delay: null });
    const onUpdateStatus = vi.fn();
    const job = baseJob({ status: 'a_caminho' as any });
    render(
      <ProviderJobCard job={job} client={client} onChat={vi.fn()} onUpdateStatus={onUpdateStatus} />
    );

    const btn = screen.getByRole('button', { name: /Iniciar Serviço/i });
    await user.click(btn);

    expect(onUpdateStatus).toHaveBeenCalledWith('job-1', 'em_progresso');
  });

  it('mostra "Ver Disputa" e chama onChat quando em_disputa', async () => {
    const user = userEvent.setup({ delay: null });
    const onChat = vi.fn();
    const job = baseJob({ status: 'em_disputa' as any });
    render(<ProviderJobCard job={job} client={client} onChat={onChat} onUpdateStatus={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /Ver Disputa/i });
    await user.click(btn);
    expect(onChat).toHaveBeenCalled();
  });

  it('mostra botão para abrir chat com cliente e chama onChat', async () => {
    const user = userEvent.setup({ delay: null });
    const onChat = vi.fn();
    const job = baseJob({ status: 'agendado' as any });
    render(<ProviderJobCard job={job} client={client} onChat={onChat} onUpdateStatus={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /Abrir Chat com Cliente/i });
    await user.click(btn);
    expect(onChat).toHaveBeenCalled();
  });
});
