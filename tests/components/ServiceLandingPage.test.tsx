import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ServiceLandingPage from '../../components/ServiceLandingPage';
import * as API from '../../services/api';

describe('ServiceLandingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows error when serviceId is not provided', async () => {
    render(<ServiceLandingPage serviceId="" />);

    await waitFor(() => {
      expect(screen.getByText(/ID de serviço inválido/i)).toBeInTheDocument();
    });
  });

  it('shows error when job is not found', async () => {
    vi.spyOn(API, 'fetchJobById').mockResolvedValueOnce(null as any);

    render(<ServiceLandingPage serviceId="invalid-id" />);

    await waitFor(() => {
      expect(screen.getByText(/Serviço não encontrado/i)).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    vi.spyOn(API, 'fetchJobById').mockRejectedValueOnce(new Error('network'));

    render(<ServiceLandingPage serviceId="job-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Serviço não encontrado/i)).toBeInTheDocument();
    });
  });
});
