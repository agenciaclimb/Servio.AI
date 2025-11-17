import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuctionRoomModal from '../components/AuctionRoomModal';
import type { Job, Bid, User } from '../types';
import { vi } from 'vitest';

const providerUser: User = {
  email: 'prov1@example.com',
  name: 'Prestador Real',
  type: 'prestador',
  bio: '',
  location: 'SP',
  memberSince: '2024-01-01T00:00:00.000Z',
  status: 'ativo',
};

const clientUser: User = {
  email: 'cli@example.com',
  name: 'Cliente',
  type: 'cliente',
  bio: '',
  location: 'SP',
  memberSince: '2024-01-01T00:00:00.000Z',
  status: 'ativo',
};

const baseJob: Job = {
  id: 'job-abc',
  clientId: clientUser.email,
  category: 'Eletrica',
  description: 'Instalar novo ponto de luz',
  status: 'em_leilao',
  createdAt: '2025-11-11T12:00:00.000Z',
  serviceType: 'personalizado',
  urgency: 'hoje',
  auctionEndDate: new Date(Date.now() + 60_000).toISOString(), // +1 min
};

function makeBid(id: string, providerId: string, amount: number, offsetMs = 0): Bid {
  return {
    id,
    jobId: baseJob.id,
    providerId,
    amount,
    createdAt: new Date(Date.now() - offsetMs).toISOString(),
  };
}

describe('AuctionRoomModal', () => {
  test('renderiza estrutura básica (título, descrição, histórico)', () => {
    render(
      <AuctionRoomModal
        job={baseJob}
        currentUser={clientUser}
        bids={[]}
        onClose={vi.fn()}
        onPlaceBid={vi.fn()}
      />
    );
    expect(screen.getByText('Sala de Leilão ⚖️')).toBeInTheDocument();
    expect(screen.getByText(/Instalar novo ponto de luz/)).toBeInTheDocument();
    expect(screen.getByText('Histórico de Lances')).toBeInTheDocument();
    expect(screen.getByText('Seja o primeiro a dar um lance!')).toBeInTheDocument();
  });

  test('ordena lances por valor e destaca menor lance', () => {
    const bids = [
      makeBid('b1', 'provA', 500, 5000),
      makeBid('b2', 'provB', 400, 4000),
      makeBid('b3', 'provC', 350, 3000),
    ];
    render(
      <AuctionRoomModal
        job={baseJob}
        currentUser={clientUser} // cliente: evita simulação de novos lances
        bids={bids}
        onClose={vi.fn()}
        onPlaceBid={vi.fn()}
      />
    );
    const historyHeading = screen.getByText('Histórico de Lances');
    const historyPanel = historyHeading.closest('main') as HTMLElement;
    const valores = within(historyPanel).getAllByText(/R\$/);
    expect(valores[0].textContent).toMatch(/500,00/);
    expect(valores[valores.length - 1].textContent).toMatch(/350,00/);
    const card = valores[valores.length - 1].closest('div');
    expect(card).toHaveClass('bg-green-100');
  });

  test('anonimiza provedores e exibe rótulos sequenciais', () => {
    const bids = [
      makeBid('b1', 'provX', 700),
      makeBid('b2', 'provY', 650),
    ];
    render(
      <AuctionRoomModal
        job={baseJob}
        currentUser={clientUser}
        bids={bids}
        onClose={vi.fn()}
        onPlaceBid={vi.fn()}
      />
    );
    expect(screen.getByText('Prestador A')).toBeInTheDocument();
    expect(screen.getByText('Prestador B')).toBeInTheDocument();
  });

  test('não renderiza formulário de lance na visão do cliente', () => {
    render(
      <AuctionRoomModal
        job={baseJob}
        currentUser={clientUser}
        bids={[]}
        onClose={vi.fn()}
        onPlaceBid={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/Seu lance/)).not.toBeInTheDocument();
  });

  test('valida e envia lance menor que o menor existente', async () => {
    const user = userEvent.setup({ delay: null }); // Remove delay para testes mais rápidos
    const onPlaceBid = vi.fn().mockResolvedValue(undefined); // Mock com Promise resolved
    const bids = [makeBid('b1', 'provA', 500)];
    render(
      <AuctionRoomModal
        job={baseJob}
        currentUser={providerUser}
        bids={bids}
        onClose={vi.fn()}
        onPlaceBid={onPlaceBid}
      />
    );
    const input = screen.getByLabelText(/Seu lance/);
    
    // Validação de lance inválido (>= menor existente)
    await user.clear(input);
    await user.type(input, '600'); // inválido (>= menor)
    await user.click(screen.getByRole('button', { name: /Confirmar Lance/ }));
    
    // Aguardar validação aparecer com timeout maior
    expect(await screen.findByText(/Seu lance deve ser menor/, {}, { timeout: 10000 })).toBeInTheDocument();

    // Validação de lance válido (< menor existente)
    await user.clear(input);
    await user.type(input, '480');
    await user.click(screen.getByRole('button', { name: /Confirmar Lance/ }));
    
    // Aguardar callback ser chamado com timeout maior
    await vi.waitFor(() => {
      expect(onPlaceBid).toHaveBeenCalledTimes(1);
    }, { timeout: 10000 });
    
    expect(onPlaceBid).toHaveBeenCalledWith(baseJob.id, 480);
  }, 15000); // Timeout total do teste: 15 segundos

  test('exibe "Leilão Encerrado" quando data fim já passou', () => {
    const pastJob: Job = { ...baseJob, auctionEndDate: new Date(Date.now() - 1000).toISOString() };
    render(
      <AuctionRoomModal
        job={pastJob}
        currentUser={clientUser}
        bids={[]}
        onClose={vi.fn()}
        onPlaceBid={vi.fn()}
      />
    );
    expect(screen.getByText('Leilão Encerrado')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Seu lance/)).not.toBeInTheDocument();
  });

  test('contador encerra após expirar (fake timers)', async () => {
    vi.useFakeTimers();
    const shortJob: Job = { ...baseJob, auctionEndDate: new Date(Date.now() + 1500).toISOString() };
    render(
      <AuctionRoomModal
        job={shortJob}
        currentUser={clientUser}
        bids={[]}
        onClose={vi.fn()}
        onPlaceBid={vi.fn()}
      />
    );
    const { act } = await import('react-dom/test-utils');
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Leilão Encerrado')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
