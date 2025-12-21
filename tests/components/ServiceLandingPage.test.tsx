import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ServiceLandingPage from '../../components/ServiceLandingPage';
import * as API from '../../services/api';

describe('ServiceLandingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra erro quando serviceId é vazio', async () => {
    render(<ServiceLandingPage serviceId="" />);

    await waitFor(() => {
      expect(screen.getByText(/ID de serviço inválido/i)).toBeInTheDocument();
    });
  });

  it('mostra erro quando serviço não é encontrado', async () => {
    vi.spyOn(API, 'fetchJobById').mockResolvedValueOnce(null as any);

    render(<ServiceLandingPage serviceId="svc_123" />);

    await waitFor(() => {
      expect(screen.getByText(/Serviço não encontrado ou indisponível/i)).toBeInTheDocument();
    });
  });

  it('renderiza detalhes quando o serviço existe', async () => {
    vi.spyOn(API, 'fetchJobById').mockResolvedValueOnce({
      id: 'svc_123',
      category: 'encanador',
      serviceType: 'reparo',
      description: 'Trocar torneira',
      urgency: 'alta',
      fixedPrice: 150,
    } as any);

    render(<ServiceLandingPage serviceId="svc_123" />);

    await waitFor(() => {
      expect(screen.getByText(/Descrição do Serviço/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/encanador/i)).toBeInTheDocument();
    expect(screen.getByText(/Trocar torneira/i)).toBeInTheDocument();
    expect(screen.getByText(/Preço Fixo/i)).toBeInTheDocument();
  });
});
