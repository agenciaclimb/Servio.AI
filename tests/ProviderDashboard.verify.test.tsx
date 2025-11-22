import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProviderDashboard from '../components/ProviderDashboard';

// Mocks de componentes filhos para isolar fluxos de verificação/onboarding
// Use real ProviderOnboarding to assert actual onboarding content instead of a test id
vi.mock('../components/ProviderDashboardSkeleton', () => ({ default: () => <div data-testid="skeleton">Loading...</div> }));
vi.mock('../components/ProfileStrength', () => ({ default: () => <div/> }));
vi.mock('../components/ProfileTips', () => ({ default: () => <div/> }));
vi.mock('../components/ReferralProgram', () => ({ default: () => <div/> }));
vi.mock('../components/PaymentSetupCard', () => ({ default: () => <div/> }));
vi.mock('../components/ProviderEarningsCard', () => ({ default: () => <div/> }));
vi.mock('../components/ProposalModal', () => ({ default: () => <div/> }));
vi.mock('../components/AuctionRoomModal', () => ({ default: () => <div/> }));
vi.mock('../components/ProfileModal', () => ({ default: () => <div/> }));
vi.mock('../components/ReferralInvitationModal', () => ({ default: () => <div/> }));
vi.mock('../components/ChatModal', () => ({ default: () => <div/> }));
vi.mock('../components/ProviderJobCard', () => ({ default: () => <div/> }));
vi.mock('../components/JobCard', () => ({ default: () => <div/> }));

vi.mock('../components/useProviderDashboardData', () => ({
  useProviderDashboardData: () => ({
    data: {
      availableJobs: [],
      myJobs: [],
      completedJobs: [],
      myProposals: [],
      myBids: [],
      allUsers: [],
      allMessages: [],
    },
    setters: {
      setMyJobs: vi.fn(),
      setMyProposals: vi.fn(),
      setAllMessages: vi.fn(),
    },
    isLoading: false,
  })
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

const base = {
  email:'prov@ex.com',
  name:'Prestador',
  type:'prestador',
  specialties:[],
} as any;

describe('ProviderDashboard – verificação & onboarding', () => {
  it('mostra aviso amarelo quando verificação está pendente', () => {
    const user = { ...base, verificationStatus: 'pendente' };
    render(<ProviderDashboard user={user} />);
    expect(screen.getByText(/Análise em Andamento/i)).toBeInTheDocument();
  });

  it('mostra CTA de verificação e abre fluxo ao clicar em Verificar Agora', () => {
    const user = { ...base, verificationStatus: 'incompleto' } as any;
    render(<ProviderDashboard user={user} />);
    const button = screen.getByRole('button', { name: /Verificar Agora/i });
    fireEvent.click(button);
    // Assert real onboarding heading rendered
    expect(screen.getByText(/Verificação de Identidade/i)).toBeInTheDocument();
  });

  it('usuário recusado cai direto no fluxo de verificação (onboarding etapa 1)', () => {
    const user = { ...base, verificationStatus: 'recusado' } as any;
    render(<ProviderDashboard user={user} />);
    expect(screen.getByText(/Verificação de Identidade/i)).toBeInTheDocument();
  });
});
