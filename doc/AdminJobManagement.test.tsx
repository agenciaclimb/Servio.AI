import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import AdminJobManagement from '../components/AdminJobManagement';
import * as API from '../services/api';
import { Job, User } from '../types';

// Mock da API
vi.mock('../services/api');

const mockUsers: User[] = [
  { email: 'client@test.com', name: 'Cliente Teste', type: 'cliente', status: 'ativo', memberSince: new Date().toISOString() },
  { email: 'provider@test.com', name: 'Prestador Teste', type: 'prestador', status: 'ativo', memberSince: new Date().toISOString() },
];

const mockJobs: Job[] = [
  { id: 'job-123', clientId: 'client@test.com', providerId: 'provider@test.com', category: 'Encanamento', description: 'Vazamento', status: 'concluido', createdAt: new Date('2023-10-26T10:00:00Z').toISOString() },
  { id: 'job-456', clientId: 'client@test.com', providerId: 'provider@test.com', category: 'Elétrica', description: 'Tomada', status: 'em_disputa', createdAt: new Date('2023-10-27T11:00:00Z').toISOString() },
];

describe('AdminJobManagement', () => {
  const mockOnMediateClick = vi.fn();
  const fetchJobsMock = vi.mocked(API.fetchJobs);
  const fetchAllUsersMock = vi.mocked(API.fetchAllUsers);

  beforeEach(() => {
    vi.clearAllMocks();
    fetchJobsMock.mockResolvedValue(mockJobs);
    fetchAllUsersMock.mockResolvedValue(mockUsers);
  });

  it('exibe o estado de carregamento inicialmente', () => {
    fetchJobsMock.mockReturnValue(new Promise(() => {})); // Promise que nunca resolve
    render(<AdminJobManagement onMediateClick={mockOnMediateClick} />);
    expect(screen.getByText('Carregando jobs...')).toBeInTheDocument();
  });

  it('renderiza os jobs e usuários corretamente após o carregamento', async () => {
    render(<AdminJobManagement onMediateClick={mockOnMediateClick} />);

    await waitFor(() => {
      expect(screen.getByText('job-123')).toBeInTheDocument();
      expect(screen.getByText('job-456')).toBeInTheDocument();
      // Verifica se os nomes do cliente e prestador são exibidos
      expect(screen.getAllByText('Cliente Teste').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Prestador Teste').length).toBeGreaterThan(0);
    });
  });

  it('filtra os jobs por status quando o seletor é alterado', async () => {
    const user = userEvent.setup();
    render(<AdminJobManagement onMediateClick={mockOnMediateClick} />);

    await waitFor(() => {
      expect(screen.getByText('job-123')).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText('Filtrar por Status');
    await user.selectOptions(filterSelect, 'em_disputa');

    expect(screen.queryByText('job-123')).not.toBeInTheDocument();
    expect(screen.getByText('job-456')).toBeInTheDocument();
  });

  it('chama onMediateClick com o job correto quando o botão "Mediar" é clicado', async () => {
    const user = userEvent.setup();
    render(<AdminJobManagement onMediateClick={mockOnMediateClick} />);

    const mediateButton = await screen.findByRole('button', { name: /Mediar/i });
    await user.click(mediateButton);

    expect(mockOnMediateClick).toHaveBeenCalledTimes(1);
    expect(mockOnMediateClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-456' })
    );
  });

  it('renderiza uma tabela vazia se não houver jobs', async () => {
    fetchJobsMock.mockResolvedValue([]);
    render(<AdminJobManagement onMediateClick={mockOnMediateClick} />);

    await waitFor(() => {
      // O cabeçalho da tabela deve estar presente
      expect(screen.getByText('Job ID')).toBeInTheDocument();
      // Mas nenhum job ID (como job-123) deve ser encontrado
      expect(screen.queryByText('job-123')).not.toBeInTheDocument();
    });
  });

  it('lida com erro na API e renderiza uma tabela vazia', async () => {
    fetchJobsMock.mockRejectedValue(new Error('API Error'));
    render(<AdminJobManagement onMediateClick={mockOnMediateClick} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando jobs...')).not.toBeInTheDocument();
      expect(screen.queryByText('job-123')).not.toBeInTheDocument();
    });
  });
});