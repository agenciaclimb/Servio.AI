import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ClientItemManagement from '../components/ClientItemManagement';
import * as API from '../services/api';
import { User, MaintainedItem } from '../types';

// Mock API
vi.mock('../services/api');

// Mock do ItemCard para focar no teste do componente de gerenciamento
vi.mock('../components/ItemCard', () => ({
  default: ({ item }: { item: MaintainedItem }) => <div data-testid={`item-card-${item.id}`}>{item.name}</div>,
}));

const mockUser: User = {
  email: 'client@test.com',
  name: 'Test Client',
  type: 'cliente',
  status: 'ativo',
  memberSince: new Date().toISOString(),
};

const mockItems: MaintainedItem[] = [
  { id: 'item-1', clientId: 'client@test.com', name: 'Ar Condicionado', category: 'Eletrodoméstico', imageUrl: '', createdAt: new Date().toISOString(), maintenanceHistory: [] },
  { id: 'item-2', clientId: 'client@test.com', name: 'Geladeira', category: 'Eletrodoméstico', imageUrl: '', createdAt: new Date().toISOString(), maintenanceHistory: [] },
];

describe('ClientItemManagement', () => {
  const mockOnAddItem = vi.fn();
  const fetchMaintainedItemsMock = vi.mocked(API.fetchMaintainedItems);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe estado de carregamento inicialmente', () => {
    fetchMaintainedItemsMock.mockReturnValue(new Promise(() => {})); // Promise que nunca resolve
    render(<ClientItemManagement user={mockUser} onAddItem={mockOnAddItem} />);
    expect(screen.getByText('Carregando seus itens...')).toBeInTheDocument();
  });

  it('renderiza itens do cliente após o carregamento', async () => {
    fetchMaintainedItemsMock.mockResolvedValue(mockItems);
    render(<ClientItemManagement user={mockUser} onAddItem={mockOnAddItem} />);

    await waitFor(() => {
      expect(screen.getByTestId('item-card-item-1')).toHaveTextContent('Ar Condicionado');
      expect(screen.getByTestId('item-card-item-2')).toHaveTextContent('Geladeira');
    });
  });

  it('exibe mensagem de estado vazio se não houver itens', async () => {
    fetchMaintainedItemsMock.mockResolvedValue([]);
    render(<ClientItemManagement user={mockUser} onAddItem={mockOnAddItem} />);

    await waitFor(() => {
      expect(screen.getByText('Você ainda não cadastrou nenhum item.')).toBeInTheDocument();
    });
  });

  it('chama onAddItem ao clicar no botão "Adicionar Novo Item"', async () => {
    fetchMaintainedItemsMock.mockResolvedValue([]);
    render(<ClientItemManagement user={mockUser} onAddItem={mockOnAddItem} />);

    const addButton = await screen.findByRole('button', { name: /Adicionar Novo Item/i });
    await userEvent.click(addButton);

    expect(mockOnAddItem).toHaveBeenCalledTimes(1);
  });

  it('lida com erro da API e exibe estado vazio', async () => {
    fetchMaintainedItemsMock.mockRejectedValue(new Error('API Error'));
    render(<ClientItemManagement user={mockUser} onAddItem={mockOnAddItem} />);

    await waitFor(() => {
      expect(screen.getByText('Você ainda não cadastrou nenhum item.')).toBeInTheDocument();
    });
  });
});