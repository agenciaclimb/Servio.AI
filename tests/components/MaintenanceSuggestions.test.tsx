import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MaintenanceSuggestions from '../../components/MaintenanceSuggestions';

vi.mock('../../services/geminiService', () => ({
  suggestMaintenance: vi.fn(),
}));

import { suggestMaintenance } from '../../services/geminiService';

const items = [
  { id: 'i1', clientId: 'c1', name: 'Ar Condicionado', category: 'clima', imageUrl: 'data:', createdAt: '2024-01-01', maintenanceHistory: [] },
  { id: 'i2', clientId: 'c1', name: 'Geladeira', category: 'eletro', imageUrl: 'data:', createdAt: '2024-01-01', maintenanceHistory: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MaintenanceSuggestions', () => {
  it('renders suggestions and triggers onSuggestJob', async () => {
    (suggestMaintenance as any)
      .mockResolvedValueOnce({ suggestionTitle: 'Limpeza preventiva', jobDescription: 'Limpar filtros' })
      .mockResolvedValueOnce(null);

    const onSuggestJob = vi.fn();
    render(<MaintenanceSuggestions items={items as any} onSuggestJob={onSuggestJob} />);

    // Shows loading first
    expect(screen.getByText(/Buscando sugestões/i)).toBeInTheDocument();

    // Then shows suggestions heading
    expect(await screen.findByText(/Sugestões da IA para Você/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Agendar Manutenção/i });
    fireEvent.click(btn);
    expect(onSuggestJob).toHaveBeenCalledWith('Limpar filtros');
  });

  it('renders nothing when there are no suggestions', async () => {
    (suggestMaintenance as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const { container } = render(<MaintenanceSuggestions items={items as any} onSuggestJob={vi.fn()} />);

    // wait for loading to finish
    await screen.findByText(/Sugestões/i).catch(() => {});

    // If suggestions length = 0, component returns null => container should be essentially empty (no heading)
    expect(container.querySelector('h3')).toBeNull();
  });
});
