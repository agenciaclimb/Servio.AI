import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatModal from '../components/ChatModal';
import type { Job, Message, User, ScheduledDateTime, ChatSuggestion } from '../types';
import * as geminiService from '../services/geminiService';

// jsdom não implementa scrollIntoView; mock para evitar TypeError em efeitos de montagem
beforeAll(() => {
  (HTMLElement.prototype as any).scrollIntoView = vi.fn();
});

describe('ChatModal', () => {
  const baseJob: Job = {
    id: 'job-1',
    clientId: 'client@mail.com',
    category: 'reparos',
    description: 'Arrumar torneira',
    status: 'ativo',
    createdAt: new Date().toISOString(),
    serviceType: 'personalizado',
    urgency: '3dias',
  };

  const currentUser: User = {
    email: 'client@mail.com',
    name: 'Cliente',
    type: 'cliente',
    bio: '',
    location: 'SP',
    memberSince: '2024-01-01',
    status: 'ativo',
  };

  const otherParty: User = {
    email: 'provider@mail.com',
    name: 'Prestador',
    type: 'prestador',
    bio: '',
    location: 'SP',
    memberSince: '2024-01-01',
    status: 'ativo',
  };

  const baseMessages: Message[] = [
    {
      id: 'm1',
      chatId: baseJob.id,
      senderId: currentUser.email,
      text: 'Olá, preciso de ajuda',
      createdAt: new Date(Date.now() - 10000).toISOString(),
      type: 'text',
    },
    {
      id: 'm2',
      chatId: baseJob.id,
      senderId: otherParty.email,
      text: 'Posso amanhã à tarde',
      createdAt: new Date(Date.now() - 5000).toISOString(),
      type: 'text',
    },
  ];

  const setup = (overrides?: Partial<React.ComponentProps<typeof ChatModal>>) => {
    const onClose = vi.fn();
    const onSendMessage = vi.fn();
    const onConfirmSchedule = vi.fn();
    const props: React.ComponentProps<typeof ChatModal> = {
      job: baseJob,
      currentUser,
      otherParty,
      messages: baseMessages,
      onClose,
      onSendMessage,
      onConfirmSchedule,
      ...overrides,
    };
    render(<ChatModal {...props} />);
    return { onClose, onSendMessage, onConfirmSchedule };
  };

  it('renderiza cabeçalho e mensagens básicas', () => {
    setup();
    expect(screen.getByText(/Chat com Prestador/)).toBeInTheDocument();
    expect(screen.getByText(/Sobre o job: reparos/)).toBeInTheDocument();
    expect(screen.getByText('Olá, preciso de ajuda')).toBeInTheDocument();
    expect(screen.getByText('Posso amanhã à tarde')).toBeInTheDocument();
  });

  it('bloqueia envio quando outra parte não existe', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSendMessage } = setup({ otherParty: undefined });
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    await user.type(input, 'Teste');
    // botão enviar (ícone paper-plane) - botão azul de enviar
    const sendBtn = screen.getAllByRole('button').find(b => b.className.includes('bg-blue-600'));
    if (sendBtn) {
      await user.click(sendBtn);
    }
    expect(onSendMessage).not.toHaveBeenCalled();
  }, 10000);

  it('envia mensagem de texto e limpa input', async () => {
    const user = userEvent.setup();
    const { onSendMessage } = setup();
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    await user.type(input, 'Mensagem nova');
    const sendBtn = screen.getAllByRole('button').find(b => b.className.includes('bg-blue-600'))!; // botão azul enviar
    await user.click(sendBtn);
    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledWith({
      chatId: baseJob.id,
      text: 'Mensagem nova',
      type: 'text',
    });
    // input limpo
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('mostra sugestão da IA e envia resumo como notificação de sistema', async () => {
    const user = userEvent.setup();
    const suggestion: ChatSuggestion = {
      name: 'summarize_agreement',
      args: { summaryText: 'Resumo do acordo feito.' },
      displayText: 'Enviar resumo do acordo',
    };
    const getAssistSpy = vi
      .spyOn(geminiService, 'getChatAssistance')
      .mockResolvedValueOnce(suggestion);

    const { onSendMessage } = setup();
    const aiBtn = screen.getByTitle('Assistente IA');
    await user.click(aiBtn);

    const sugBtn = await screen.findByRole('button', { name: /Enviar resumo do acordo/i });
    await user.click(sugBtn);

    expect(getAssistSpy).toHaveBeenCalled();
    expect(onSendMessage).toHaveBeenCalledWith({
      chatId: baseJob.id,
      text: 'Resumo do acordo feito.',
      type: 'system_notification',
    });
  });

  it('exibe sugestão de agendamento via IA (proposeScheduleFromChat) e confirma', async () => {
    const user = userEvent.setup();

    const schedule: ScheduledDateTime = { date: '2025-12-25', time: '14:00' };
    vi.spyOn(geminiService, 'proposeScheduleFromChat').mockResolvedValueOnce(schedule);

    const messages = [...baseMessages];
    const { onConfirmSchedule } = setup({
      messages,
      job: { ...baseJob, status: 'proposta_aceita' },
    });

    // O componente AISchedulingAssistant exibe "Sugestão da IA" e botão Confirmar
    const aiBanner = await screen.findByText(/Sugestão da IA/i);
    expect(aiBanner).toBeInTheDocument();
    const confirmBtn = within(aiBanner.closest('.p-3') as HTMLElement).getByRole('button', {
      name: /Confirmar/i,
    });
    await user.click(confirmBtn);

    expect(onConfirmSchedule).toHaveBeenCalledWith(baseJob.id, schedule);
  });

  it('permite sugerir agendamento manual e envia schedule_proposal', async () => {
    const user = userEvent.setup();
    const { onSendMessage } = setup();

    // Abrir formulário de agendamento manual (botão calendário)
    const buttons = screen.getAllByRole('button');
    const calendarBtn = buttons.find(b => b.getAttribute('title') === 'Sugerir Horário')!;
    await user.click(calendarBtn);

    // Os inputs não têm label; selecione por role=spinbutton/textbox pela ordem
    // escopar busca ao formulário de agendamento
    const submitBtn = screen.getByRole('button', { name: /Enviar Sugestão/i });
    const scheduleForm = submitBtn.closest('form') as HTMLElement;
    const dateEl = scheduleForm.querySelector('input[type="date"]') as HTMLInputElement;
    const timeEl = scheduleForm.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(dateEl, { target: { value: '2025-11-30' } });
    fireEvent.change(timeEl, { target: { value: '09:30' } });

    await user.click(submitBtn);

    expect(onSendMessage).toHaveBeenCalled();
    const call = (onSendMessage as any).mock.calls.find(
      (c: any[]) => c[0]?.type === 'schedule_proposal'
    );
    expect(call?.[0]).toMatchObject({
      chatId: baseJob.id,
      type: 'schedule_proposal',
      schedule: { date: '2025-11-30', time: '09:30' },
    });
  });

  it('mostra proposta de agendamento recebida e permite confirmar', async () => {
    const user = userEvent.setup();
    const schedule: ScheduledDateTime = { date: '2025-12-20', time: '10:00' };
    const scheduleMsg: Message = {
      id: 'm3',
      chatId: baseJob.id,
      senderId: otherParty.email, // recebido do prestador
      text: `Sugestão de agendamento`,
      createdAt: new Date().toISOString(),
      type: 'schedule_proposal',
      schedule,
    };

    const { onConfirmSchedule } = setup({ messages: [...baseMessages, scheduleMsg] });

    // Localiza o card "Proposta de Agendamento" e clica Confirmar
    const card = await screen.findByText(/Proposta de Agendamento/i);
    const container = card.closest('.max-w-xs');
    const confirmBtn = within(container as HTMLElement).getByRole('button', { name: /Confirmar/i });
    await user.click(confirmBtn);

    expect(onConfirmSchedule).toHaveBeenCalledWith(baseJob.id, schedule, 'm3');
  });
});
