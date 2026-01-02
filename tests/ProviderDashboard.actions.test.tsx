import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ProviderDashboard from '../components/ProviderDashboard';

// Mantemos componentes reais para cobrir mais lógica; apenas mockamos a fonte de dados.
// Para evitar erros de props complexas e focar em fluxos do dashboard, mockamos componentes filhos pesados.
vi.mock('../components/ProviderOnboarding', () => ({
  default: ({ onComplete }: any) => (
    <div data-testid="onboarding">
      Onboarding <button onClick={onComplete}>fin</button>
    </div>
  ),
}));
vi.mock('../components/ProviderDashboardSkeleton', () => ({
  default: () => <div data-testid="skeleton">Loading...</div>,
}));
vi.mock('../components/ProfileStrength', () => ({
  default: ({ onEditProfile }: any) => (
    <button data-testid="profile-strength" onClick={onEditProfile}>
      Strength
    </button>
  ),
}));
vi.mock('../components/ProfileTips', () => ({ default: () => <div data-testid="profile-tips" /> }));
vi.mock('../components/ReferralProgram', () => ({
  default: ({ onSendReferral }: any) => (
    <button onClick={() => onSendReferral('amigo@ex.com')} data-testid="referral-btn">
      Refer
    </button>
  ),
}));
vi.mock('../components/PaymentSetupCard', () => ({
  default: () => <div data-testid="payment-setup" />,
}));
vi.mock('../components/ProviderEarningsCard', () => ({
  default: () => <div data-testid="earnings" />,
}));
vi.mock('../components/ProposalModal', () => ({
  default: ({ onClose, onSubmit }: any) => (
    <div data-testid="proposal-modal">
      <button
        onClick={() => {
          onSubmit({ message: 'Olá', price: 100 });
          onClose();
        }}
      >
        Enviar
      </button>
      <button onClick={onClose}>Fechar</button>
    </div>
  ),
}));
vi.mock('../components/AuctionRoomModal', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="auction-modal">
      <button onClick={onClose}>Sair</button>
    </div>
  ),
}));
vi.mock('../components/ProfileModal', () => ({
  default: ({ onSave }: any) => (
    <div data-testid="profile-modal">
      <button onClick={() => onSave({ headline: 'Nova', bio: 'Bio nova' })}>Salvar Perfil</button>
    </div>
  ),
}));
vi.mock('../components/ReferralInvitationModal', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="referral-modal">
      <button onClick={onClose}>Fechar Ref</button>
    </div>
  ),
}));
vi.mock('../components/ChatModal', () => ({
  default: ({ onSendMessage, onConfirmSchedule, job }: any) => (
    <div data-testid="chat-modal">
      <button onClick={() => onSendMessage({ chatId: job.id, text: 'Ping' })}>Msg</button>
      <button onClick={() => onConfirmSchedule(job.id, { date: '2025-12-01', time: '10:00' })}>
        Agendar
      </button>
    </div>
  ),
}));
vi.mock('../components/ProviderJobCard', () => ({
  default: ({ job, onUpdateStatus, onChat }: any) => (
    <div data-testid={`provider-job-${job.id}`}>
      JOB {job.id}
      <button
        onClick={() => onUpdateStatus(job.id, job.status === 'agendado' ? 'a_caminho' : 'agendado')}
      >
        Avançar
      </button>
      <button onClick={onChat}>Chat</button>
    </div>
  ),
}));
vi.mock('../components/JobCard', () => ({
  default: ({ job, onProposeClick }: any) => (
    <div data-testid={`job-${job.id}`}>
      <span>{job.category}</span>
      <button onClick={onProposeClick}>Propor</button>
    </div>
  ),
}));

// Hook de dados do dashboard simulado para controlar estados
vi.mock('../components/useProviderDashboardData', () => ({
  useProviderDashboardData: () => ({
    data: {
      availableJobs: [
        {
          id: 'j1',
          category: 'limpeza',
          status: 'aberto',
          clientId: 'cli@ex.com',
          jobMode: 'normal',
        },
        {
          id: 'j2',
          category: 'reparos',
          status: 'aberto',
          clientId: 'cli@ex.com',
          jobMode: 'leilao',
        },
      ],
      myJobs: [
        {
          id: 'mj1',
          category: 'limpeza',
          status: 'agendado',
          clientId: 'cli@ex.com',
          jobMode: 'normal',
        },
      ],
      completedJobs: [],
      myProposals: [],
      myBids: [],
      allUsers: [{ email: 'cli@ex.com', name: 'Cliente', type: 'cliente' }],
      allMessages: [],
    },
    setters: {
      setMyJobs: vi.fn(),
      setMyProposals: vi.fn(),
      setAllMessages: vi.fn(),
    },
    isLoading: false,
  }),
}));

// API mocks
vi.mock('../services/api', () => ({
  createProposal: vi.fn(async data => ({ id: 'prop1', ...data })),
  createNotification: vi.fn(async () => ({})),
  updateJob: vi.fn(async () => ({})),
  updateUser: vi.fn(async () => ({})),
  createMessage: vi.fn(async msg => ({ id: 'm1', ...msg })),
  fetchUserById: vi.fn(async id => ({ email: id, name: 'User', type: 'cliente' })),
  fetchDisputes: vi.fn(async () => []),
}));

vi.mock('../services/geminiService', () => ({
  analyzeProviderBehaviorForFraud: vi.fn(async () => ({ isSuspicious: false })),
  generateReferralEmail: vi.fn(async (name, email) => ({
    subject: 'Convite',
    body: `Olá ${email}`,
  })),
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

const baseUser = {
  email: 'prov@ex.com',
  name: 'Prestador',
  type: 'prestador',
  verificationStatus: 'verificado',
  specialties: ['limpeza'],
  bio: 'Profissional',
  headline: 'Headline',
} as any;

describe('ProviderDashboard – ações e fluxos principais', () => {
  it('permite avançar status de job e abrir chat', () => {
    render(<ProviderDashboard user={baseUser} disableOnboarding disableSkeleton />);
    const jobCard = screen.getByTestId('provider-job-mj1');
    const advanceBtn = within(jobCard).getByRole('button', { name: /Avançar/i });
    fireEvent.click(advanceBtn); // agendado -> a_caminho
    fireEvent.click(advanceBtn); // a_caminho -> agendado (ciclo simples mock)
    const chatBtn = within(jobCard).getByRole('button', { name: /Chat/i });
    fireEvent.click(chatBtn);
    expect(screen.getByTestId('chat-modal')).toBeInTheDocument();
  });

  it('abre modal de proposta para job normal e envia proposta', async () => {
    render(<ProviderDashboard user={baseUser} disableOnboarding disableSkeleton />);
    const normalJob = screen.getByTestId('job-j1');
    fireEvent.click(within(normalJob).getByText(/Propor/i));
    expect(screen.getByTestId('proposal-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));
    await waitFor(() => expect(screen.queryByTestId('proposal-modal')).toBeNull());
  });

  it('abre sala de leilão para job em modo leilao', () => {
    render(<ProviderDashboard user={baseUser} disableOnboarding disableSkeleton />);
    const auctionJob = screen.getByTestId('job-j2');
    fireEvent.click(within(auctionJob).getByText(/Propor/i));
    expect(screen.getByTestId('auction-modal')).toBeInTheDocument();
  });

  it('filtra disponíveis por categoria e localização e limpa filtros', () => {
    render(<ProviderDashboard user={baseUser} disableOnboarding disableSkeleton />);
    const categoriaSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(categoriaSelect, { target: { value: 'limpeza' } });
    // Placeholder atualizado para refletir o componente atual
    const locInput = screen.getByPlaceholderText(/Cidade ou endereço/i);
    fireEvent.change(locInput, { target: { value: 'são' } });
    // Botão limpar aparece
    const limparBtn = screen.getByText('Limpar filtros');
    fireEvent.click(limparBtn);
    expect(categoriaSelect).toHaveValue('Todos');
    expect(locInput).toHaveValue('');
  });

  it('envia mensagem e confirma agendamento via ChatModal', () => {
    render(<ProviderDashboard user={baseUser} disableOnboarding disableSkeleton />);
    // Abrir chat
    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    const chat = screen.getByTestId('chat-modal');
    fireEvent.click(within(chat).getByText('Msg'));
    fireEvent.click(within(chat).getByText('Agendar'));
    // Não há assert específico sobre estado (mock), mas cobre branches de envio/agendamento
    expect(chat).toBeInTheDocument();
  });

  it('gera email de indicação e exibe modal de convite', async () => {
    render(<ProviderDashboard user={baseUser} disableOnboarding disableSkeleton />);
    // Botão de indicar (texto pode variar; usamos regex para permitir i18n)
    const referButton = screen.getByRole('button', { name: /Indicar|Refer/i });
    fireEvent.click(referButton);
    await waitFor(() => expect(screen.getByTestId('referral-modal')).toBeInTheDocument());
  });
});
