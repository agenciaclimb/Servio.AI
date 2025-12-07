import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobCard from '../components/JobCard';
import type { Job, Bid } from '../types';

vi.mock('../services/geminiService', () => ({
  generateJobFAQ: vi.fn(async () => [
    { question: 'Qual o horário?', answer: 'Manhã' },
    { question: 'Materiais inclusos?', answer: 'Sim' },
  ]),
}));

const baseJob = (over: Partial<Job> = {}): Job =>
  ({
    id: 'job-1',
    title: 'Reparo em porta',
    category: 'reparos' as any,
    description: 'Porta desalinhada, precisa ajuste de dobradiça.',
    clientId: 'client-1',
    status: 'open' as any,
    serviceType: 'tabelado' as any,
    fixedPrice: 200,
    jobMode: 'normal' as any,
    createdAt: new Date().toISOString(),
    ...over,
  }) as Job;

const bids = (...amounts: number[]): Bid[] =>
  amounts.map((a, i) => ({
    id: `bid-${i + 1}`,
    jobId: 'job-1',
    providerId: `p-${i + 1}`,
    amount: a,
    createdAt: new Date().toISOString(),
  })) as Bid[];

describe('JobCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza informações básicas e preço fixo quando tabelado', () => {
    const job = baseJob({ serviceType: 'tabelado', fixedPrice: 200 });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);

    expect(screen.getByText('Reparos')).toBeInTheDocument();
    expect(screen.getByText('Preço Fixo')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*200,00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Proposta/i })).toBeInTheDocument();
    // Publicado ...
    expect(screen.getByText(/Publicado/i)).toBeInTheDocument();
  });

  it('mostra botão de FAQ e abre modal com FAQ gerada', async () => {
    const user = userEvent.setup({ delay: null });
    const job = baseJob({ serviceType: 'personalizado', fixedPrice: undefined });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);

    const faqBtn = screen.getByRole('button', { name: /FAQ Rápida/i });
    await user.click(faqBtn);

    // Modal título
    expect(await screen.findByText(/FAQ Rápida do Job/i)).toBeInTheDocument();
    // Conteúdo gerado
    expect(await screen.findByText(/Qual o horário\?/i)).toBeInTheDocument();
  });

  it('em modo leilão exibe menor lance atual', () => {
    const job = baseJob({ jobMode: 'leilao', serviceType: 'personalizado', fixedPrice: undefined });
    render(
      <JobCard job={job} bids={bids(350, 220, 280)} onProposeClick={vi.fn()} hasProposed={false} />
    );

    expect(screen.getByText(/Leilão/i)).toBeInTheDocument();
    expect(screen.getByText(/Menor Lance Atual/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*220,00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dar Lance/i })).toBeInTheDocument();
  });

  it('desabilita botão em leilão quando já propôs e mostra texto adequado', () => {
    const job = baseJob({ jobMode: 'leilao', serviceType: 'personalizado', fixedPrice: undefined });
    render(<JobCard job={job} bids={bids(150)} onProposeClick={vi.fn()} hasProposed={true} />);

    const actionBtn = screen.getByRole('button', { name: /Você deu o menor lance/i });
    expect(actionBtn).toBeDisabled();
  });

  it('mostra "Nenhum lance" quando leilão sem lances', () => {
    const job = baseJob({ jobMode: 'leilao', serviceType: 'personalizado', fixedPrice: undefined });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);

    expect(screen.getByText(/Nenhum lance/i)).toBeInTheDocument();
  });

  it('em serviço não-leilão, com proposta enviada, mantém botão habilitado e altera o texto', () => {
    const job = baseJob({ jobMode: 'normal', serviceType: 'personalizado', fixedPrice: undefined });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={true} />);

    const btn = screen.getByRole('button', { name: /Proposta Enviada ✓/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('não exibe FAQ quando em leilão', () => {
    const job = baseJob({ jobMode: 'leilao', serviceType: 'personalizado', fixedPrice: undefined });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);

    expect(screen.queryByRole('button', { name: /FAQ Rápida/i })).not.toBeInTheDocument();
  });

  it('exibe selo de Diagnóstico e não mostra preço fixo quando serviceType=diagnostico', () => {
    const job = baseJob({ jobMode: 'normal', serviceType: 'diagnostico', fixedPrice: undefined });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);

    expect(screen.getByText(/Diagnóstico/i)).toBeInTheDocument();
    expect(screen.queryByText(/Preço Fixo/i)).not.toBeInTheDocument();
  });

  it('renderiza tempo relativo (Publicado há Xh) baseado no createdAt', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const job = baseJob({ createdAt: twoHoursAgo });
    render(<JobCard job={job} bids={[]} onProposeClick={vi.fn()} hasProposed={false} />);

    // Verifica que a linha de tempo contém "Publicado" e um padrão de horas
    expect(screen.getByText(/Publicado/)).toBeInTheDocument();
    // Padrão flexível: "há 2h" pode variar levemente com o relógio; checamos presença de "há" e "h"
    expect(screen.getByText(/há .*h/)).toBeInTheDocument();
  });
});
