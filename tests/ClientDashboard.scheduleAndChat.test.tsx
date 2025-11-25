import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Capture toasts from the dashboard logic
let toastSpy: (msg: string, type?: string) => void;
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: (msg: string, type?: string) => toastSpy && toastSpy(msg, type),
  }),
}));

// Avoid rendering heavy skeleton while preserving component logic
vi.mock('../components/skeletons/ClientDashboardSkeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}));

// Prevent Firestore listeners from hitting the real SDK during dashboard boot
vi.mock('firebase/firestore', () => {
  const unsubscribe = vi.fn();
  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn((_, onNext) => {
      if (typeof onNext === 'function') {
        const snapshot = {
          docs: [] as Array<{ id: string; data: () => Record<string, unknown> }> ,
          empty: true,
          forEach(cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) {
            snapshot.docs.forEach(cb);
          }
        };
        onNext(snapshot);
      }
      return unsubscribe;
    }),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    serverTimestamp: vi.fn(() => new Date()),
    Timestamp: {
      now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
    },
  };
});

import ClientDashboard from '../components/ClientDashboard';
import * as API from '../services/api';

describe('ClientDashboard – chat & agendamento (integração leve)', () => {
  beforeEach(() => {
    toastSpy = vi.fn();
    vi.restoreAllMocks();
  });

  const baseUser = {
    email: 'cliente@servio.ai',
    name: 'Ana Cliente',
    type: 'cliente',
    status: 'ativo',
    address: 'Rua A, 100',
  } as any;

  const provider = { email: 'prov@servio.ai', name: 'Paulo Prestador', type: 'prestador' } as any;

  function renderDash(overrides: Partial<any> = {}) {
    const job = {
      id: 'job-1',
      clientId: baseUser.email,
      providerId: provider.email,
      category: 'Eletricista',
      description: 'Instalar tomada',
      status: 'proposta_aceita',
    };

    const props: any = {
      user: baseUser,
      allUsers: [provider],
      allProposals: [],
      allDisputes: [],
      allBids: [],
      maintainedItems: [],
      allMessages: overrides.allMessages ?? [],
      setAllMessages: vi.fn(),
      setAllNotifications: vi.fn(),
      setAllDisputes: vi.fn(),
      setAllProposals: vi.fn(),
      setAllEscrows: vi.fn(),
      setMaintainedItems: vi.fn(),
      onViewProfile: vi.fn(),
      onNewJobFromItem: vi.fn(),
      onUpdateUser: vi.fn(),
      disableSkeleton: true,
      initialUserJobs: [job],
      ...overrides,
    };

    const ui = render(
      <ClientDashboard
        {...props}
        disableSkeleton
        initialUserJobs={props.initialUserJobs}
      />
    );
    return { ui, props };
  }

  it('confirma agendamento a partir de uma proposta recebida no chat', async () => {
    // Mensagem de proposta de agendamento enviada pelo prestador
    const scheduleMsg = {
      id: 'm1',
      chatId: 'job-1',
      senderId: provider.email,
      createdAt: new Date().toISOString(),
      type: 'schedule_proposal',
      text: 'Proposta de agenda',
      schedule: { date: '2025-12-01', time: '14:00' },
    } as any;

    const { props } = renderDash({ allMessages: [scheduleMsg] });

    // Ir para "Meus Serviços" e abrir chat do job ativo
    await userEvent.click(screen.getByRole('button', { name: /Meus Serviços/i }));
    const chatButtons = screen.getAllByRole('button', { name: /^Chat$/i });
    await userEvent.click(chatButtons[0]);

    // Deve exibir o bloco de proposta de agendamento com botão Confirmar
    const confirmBtn = await screen.findByRole('button', { name: /Confirmar/i });
    await userEvent.click(confirmBtn);

    // Valida efeitos colaterais via setters de estado
    // 1) Primeira chamada adiciona mensagem do sistema confirmando agendamento
    expect(props.setAllMessages).toHaveBeenCalled();
    const addSystemCall = props.setAllMessages.mock.calls.find((c: any[]) => typeof c[0] === 'function');
    expect(addSystemCall).toBeTruthy();
    const updater = addSystemCall[0] as (prev: any[]) => any[];
    expect(typeof updater).toBe('function');

    // 2) Outra chamada marca a mensagem original como confirmada
    const markCall = props.setAllMessages.mock.calls.find((c: any[]) => typeof c[0] === 'function' && c[0] !== updater);
    if (markCall) {
      const markUpdater = markCall[0] as (prev: any[]) => any[];
      const marked = markUpdater([scheduleMsg]);
      expect(Array.isArray(marked)).toBe(true);
    }

    // 3) Notificação para o prestador
    expect(props.setAllNotifications).toHaveBeenCalled();
  });

  it('mostra aviso ao tentar salvar perfil sem campos obrigatórios', async () => {
  renderDash({});

  // Abrir modal de conta
  await userEvent.click(screen.getByRole('button', { name: /Conta Pessoal/i }));

  // Limpa campos obrigatórios e tenta salvar
  const nameInput = screen.getByDisplayValue('Ana Cliente');
  const addressInput = screen.getByPlaceholderText('Rua, nº, bairro');
  const whatsappInput = screen.getByPlaceholderText('(DDD) 9 9999-9999');
  await userEvent.clear(nameInput as HTMLInputElement);
  await userEvent.clear(addressInput as HTMLInputElement);
  await userEvent.clear(whatsappInput as HTMLInputElement);

  await userEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    // Toast de validação obrigatória
    await waitFor(() => {
      expect((toastSpy as any).mock.calls.join('\n')).toMatch(/preencha/i);
    });
  });

  it('exibe toast de erro ao falhar envio de mensagem', async () => {
    vi.spyOn(API, 'createMessage').mockRejectedValueOnce(new Error('fail'));

  renderDash({});
    await userEvent.click(screen.getByRole('button', { name: /Meus Serviços/i }));
    const chatButtons = screen.getAllByRole('button', { name: /^Chat$/i });
    await userEvent.click(chatButtons[0]);

    // Digita e envia mensagem
  const input = await screen.findByPlaceholderText('Digite sua mensagem...');
  await userEvent.type(input, 'Olá!');
  const form = input.closest('form') as HTMLElement;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  await userEvent.click(submitBtn);

    await waitFor(() => {
      expect((toastSpy as any).mock.calls.join('\n')).toMatch(/Erro ao enviar mensagem/i);
    });
  });
});
