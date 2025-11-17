import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

import ClientJobManagement from '../components/ClientJobManagement';
import * as API from '../services/api';
import { User, Job } from '../types';

// Mock API
vi.mock('../services/api');

const mockUser: User = {
  email: 'client@test.com',
  name: 'Test Client',
  type: 'cliente',
  status: 'ativo',
  memberSince: new Date().toISOString(),
};

const mockJobs: Job[] = [
  { id: 'job-1', clientId: 'client@test.com', category: 'Encanamento', description: 'Vazamento na pia', status: 'ativo', createdAt: new Date().toISOString() },
  { id: 'job-2', clientId: 'other@test.com', category: 'Eletricista', description: 'Tomada não funciona', status: 'ativo', createdAt: new Date().toISOString() },
  { id: 'job-3', clientId: 'client@test.com', category: 'Pintura', description: 'Pintar parede', status: 'agendado', providerId: 'provider-1', createdAt: new Date().toISOString() },
];

describe('ClientJobManagement', () => {
  const mockOnCreateJob = vi.fn();
  const mockOnViewMap = vi.fn();
  const fetchJobsMock = vi.mocked(API.fetchJobs);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ClientJobManagement user={mockUser} onCreateJob={mockOnCreateJob} onViewMap={mockOnViewMap} />
      </BrowserRouter>
    );
  };

  it('exibe estado de carregamento inicialmente', () => {
    fetchJobsMock.mockReturnValue(new Promise(() => {})); // Promise que nunca resolve
    renderComponent();
    expect(screen.getByText('Carregando seus serviços...')).toBeInTheDocument();
  });

  it('renderiza apenas os jobs do cliente após o carregamento', async () => {
    fetchJobsMock.mockResolvedValue(mockJobs);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Encanamento')).toBeInTheDocument();
      expect(screen.getByText('Pintura')).toBeInTheDocument();
      expect(screen.queryByText('Eletricista')).not.toBeInTheDocument();
    });
  });

  it('exibe mensagem de estado vazio se não houver jobs', async () => {
    fetchJobsMock.mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Você ainda não solicitou nenhum serviço.')).toBeInTheDocument();
    });
  });

  it('chama onCreateJob ao clicar no botão "Solicitar Novo Serviço"', async () => {
    fetchJobsMock.mockResolvedValue([]);
    renderComponent();

    const addButton = await screen.findByRole('button', { name: /Solicitar Novo Serviço/i });
    await userEvent.click(addButton);

    expect(mockOnCreateJob).toHaveBeenCalledTimes(1);
  });

  it('chama onViewMap com o ID correto ao clicar em "Ver no Mapa"', async () => {
    fetchJobsMock.mockResolvedValue(mockJobs);
    renderComponent();

    const viewMapButton = await screen.findByRole('button', { name: /Ver no Mapa/i });
    expect(viewMapButton).toBeInTheDocument(); // Apenas um job tem o botão

    await userEvent.click(viewMapButton);

    expect(mockOnViewMap).toHaveBeenCalledTimes(1);
    expect(mockOnViewMap).toHaveBeenCalledWith('job-3');
  });

  it('lida com erro da API e exibe estado vazio', async () => {
    fetchJobsMock.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Você ainda não solicitou nenhum serviço.')).toBeInTheDocument();
    });
  });
});