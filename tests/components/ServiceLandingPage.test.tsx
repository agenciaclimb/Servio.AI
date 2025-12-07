import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ServiceLandingPage from '../../components/ServiceLandingPage';
import * as API from '../../services/api';

describe('ServiceLandingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when no providers match category', async () => {
    vi.spyOn(API, 'fetchProviders').mockResolvedValueOnce([
      {
        email: 'a@a.com',
        name: 'A',
        type: 'prestador',
        bio: '',
        location: 'sp',
        memberSince: new Date().toISOString(),
        status: 'ativo',
        specialties: ['eletricista'],
      },
    ] as any);

    render(
      <ServiceLandingPage category="encanador" location="sp" serviceNameToCategory={x => x} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Nenhum prestador encontrado/i)).toBeInTheDocument();
    });
  });

  it('lists providers that match the category', async () => {
    vi.spyOn(API, 'fetchProviders').mockResolvedValueOnce([
      {
        email: 'b@b.com',
        name: 'B',
        type: 'prestador',
        bio: '',
        location: 'sp',
        memberSince: new Date().toISOString(),
        status: 'ativo',
        specialties: ['encanador'],
      },
      {
        email: 'c@c.com',
        name: 'C',
        type: 'prestador',
        bio: '',
        location: 'sp',
        memberSince: new Date().toISOString(),
        status: 'ativo',
        specialties: ['eletricista'],
      },
    ] as any);

    render(<ServiceLandingPage category="encanador" />);

    await waitFor(() => {
      // page header always visible
      expect(screen.getByText(/Prestadores de Serviço/i)).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    vi.spyOn(API, 'fetchProviders').mockRejectedValueOnce(new Error('network'));

    render(<ServiceLandingPage category="encanador" />);

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível carregar/i)).toBeInTheDocument();
    });
  });
});
