import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProfilePage from '../../components/ProfilePage';

// Mocks pesados
vi.mock('../../components/CompletedJobCard', () => ({
  default: () => <div data-testid="CompletedJobCard" />,
}));
vi.mock('../../components/PublicContactCTA', () => ({
  default: () => <div data-testid="PublicContactCTA" />,
}));
vi.mock('../../components/StructuredDataSEO', () => ({
  default: () => <script data-testid="StructuredDataSEO" />,
}));
vi.mock('../../components/LocationMap', () => ({
  default: () => <div data-testid="LocationMap" />,
}));
vi.mock('../../components/PortfolioGallery', () => ({
  default: () => <div data-testid="PortfolioGallery" />,
}));

// Mock API e Gemini
vi.mock('../../services/api', () => ({
  fetchUserById: vi.fn(async (id: string) => ({
    uid: 'u1',
    email: id,
    name: 'Maria Prestadora',
    type: 'prestador',
    location: 'São Paulo',
    status: 'ativo',
  })),
  fetchJobs: vi.fn(async () => ([{
    id: 'j1',
    clientId: 'cliente@example.com',
    providerId: 'maria@example.com',
    status: 'concluido',
    review: { rating: 5, comment: 'Excelente' },
    description: 'Instalação elétrica',
  }])),
  fetchAllUsers: vi.fn(async () => ([{
    uid: 'u1', email: 'maria@example.com', name: 'Maria Prestadora', type: 'prestador', status: 'ativo'
  }])),
}));

vi.mock('../../services/geminiService', () => ({
  summarizeReviews: vi.fn(async () => 'Resumo de avaliações: excelente atendimento.'),
  generateSEOProfileContent: vi.fn(async () => ({
    title: 'Serviços Profissionais em São Paulo',
    description: 'Perfil otimizado para busca',
    keywords: ['serviços', 'São Paulo'],
  })),
}));

describe('ProfilePage smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza e exibe nome do usuário após carregar', async () => {
    render(
      <ProfilePage
        userId="maria@example.com"
        onBackToDashboard={() => {}}
        isPublicView={true}
        onLoginToContact={() => {}}
      />
    );

    // Loading presente inicialmente
    expect(screen.getByText(/Carregando perfil/)).toBeInTheDocument();

    // Após carregar, deve mostrar o nome
    await waitFor(() => {
      expect(screen.getByText(/Maria Prestadora/)).toBeInTheDocument();
    });
  });
});
