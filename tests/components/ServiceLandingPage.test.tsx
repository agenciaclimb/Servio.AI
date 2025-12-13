import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ServiceLandingPage from '../../components/ServiceLandingPage';
import * as API from '../../services/api';

describe('ServiceLandingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when no providers match category', async () => {
    // ServiceLandingPage agora usa serviceId e fetchJobById
    vi.spyOn(API, 'fetchJobById').mockResolvedValueOnce(null);

    render(<ServiceLandingPage serviceId="invalid-job" />);

    await waitFor(() => {
      expect(screen.getByText(/Serviço não encontrado/i)).toBeInTheDocument();
    });
  });

  it('lists providers that match the category', async () => {
    const mockJob = {
      id: 'job-123',
      category: 'Encanador',
      serviceType: 'Reparo',
      description: 'Consertar vazamento',
      fixedPrice: 150,
      urgency: 'normal',
      status: 'aberto',
      clientId: 'client@test.com',
      createdAt: new Date().toISOString(),
    };

    vi.spyOn(API, 'fetchJobById').mockResolvedValueOnce(mockJob as any);

    render(<ServiceLandingPage serviceId="job-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Encanador/i)).toBeInTheDocument();
      expect(screen.getByText(/Consertar vazamento/i)).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    vi.spyOn(API, 'fetchJobById').mockRejectedValueOnce(new Error('network'));

    render(<ServiceLandingPage serviceId="job-error" />);

    await waitFor(() => {
      expect(screen.getByText(/Serviço não encontrado ou indisponível/i)).toBeInTheDocument();
    });
  });
});
