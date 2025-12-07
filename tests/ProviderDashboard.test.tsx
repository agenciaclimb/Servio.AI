import { render, screen, _waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import _userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProviderDashboard from '../components/ProviderDashboard';
import type { User, Job, Proposal, _Message } from '../types';

// Mock de skeleton component
vi.mock('../components/skeletons/ProviderDashboardSkeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}));

// Mock de ProfileTips para evitar efeitos assíncronos que geram warnings de act
vi.mock('../components/ProfileTips', () => ({
  default: () => <div data-testid="profile-tips" />,
}));

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('ProviderDashboard', () => {
  const mockUser: User = {
    uid: 'provider-123',
    email: 'provider@test.com',
    displayName: 'João Provider',
    role: 'provider',
    profile: {
      phone: '11999999999',
      cpf: '123.456.789-00',
      bio: 'Profissional com 10 anos de experiência',
      categories: ['encanamento', 'eletricista'],
      rating: 4.8,
      completedJobs: 50,
      location: { city: 'São Paulo', state: 'SP' },
    },
    createdAt: new Date().toISOString(),
  };

  const _mockJobs: Job[] = [
    {
      id: 'job-1',
      title: 'Conserto de Encanamento',
      description: 'Vazamento na pia',
      category: 'encanamento',
      urgency: 'urgente',
      mode: 'normal',
      clientId: 'client-1',
      clientName: 'Maria Client',
      status: 'aberto',
      budget: 150,
      location: { city: 'São Paulo', state: 'SP' },
      createdAt: new Date().toISOString(),
    },
  ];

  const _mockProposals: Proposal[] = [
    {
      id: 'proposal-1',
      jobId: 'job-1',
      providerId: 'provider-123',
      price: 120,
      description: 'Posso fazer hoje',
      estimatedDuration: '2h',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    },
  ];

  const renderDashboard = (props = {}) => {
    const defaultProps = {
      user: mockUser,
      onViewProfile: vi.fn(),
      onPlaceBid: vi.fn(),
      disableOnboarding: true,
      disableSkeleton: true,
      ...props,
    };

    return render(
      <BrowserRouter>
        <ProviderDashboard {...defaultProps} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza dashboard do provedor sem erros', () => {
    renderDashboard();

    // Componente renderiza sem crash - verifica ProfileStrength
    expect(screen.getByText(/Força do Perfil/i)).toBeInTheDocument();
  });

  it('exibe onboarding para provedor não verificado quando não desabilitado', () => {
    const unverifiedUser = {
      ...mockUser,
      verificationStatus: 'pendente',
    };

    renderDashboard({ user: unverifiedUser, disableOnboarding: false });

    // Deve exibir onboarding quando não verificado
    expect(screen.getByText(/Análise em Andamento/i)).toBeInTheDocument();
  });

  it('bypassa onboarding quando disableOnboarding=true', () => {
    const unverifiedUser = {
      ...mockUser,
      verificationStatus: 'pendente',
    };

    renderDashboard({ user: unverifiedUser, disableOnboarding: true });

    // Dashboard é renderizado mesmo não verificado
    expect(screen.getByText(/Força do Perfil/i)).toBeInTheDocument();
  });
});
