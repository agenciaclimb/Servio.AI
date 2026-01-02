import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { applyAdvancedFilters, useAdvancedFiltersHook } from '../../src/hooks/useAdvancedFilters';
import type { ProspectLead } from '../../src/components/ProspectorCRM';

const mockLeads: ProspectLead[] = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria@test.com',
    phone: '11999999999',
    company: 'Tech Corp',
    stage: 'negotiating',
    temperature: 'hot',
    priority: 'high',
    source: 'website',
    notes: 'Interessada em serviço completo',
    createdAt: new Date('2024-01-01').toISOString(),
    lastContact: new Date('2024-01-15').toISOString(),
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@test.com',
    phone: '11988888888',
    company: 'Small Business',
    stage: 'new',
    temperature: 'warm',
    priority: 'medium',
    source: 'referral',
    notes: '',
    createdAt: new Date('2024-01-10').toISOString(),
    lastContact: new Date('2024-01-10').toISOString(),
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana@test.com',
    phone: '',
    company: '',
    stage: 'won',
    temperature: 'cold',
    priority: 'low',
    source: 'linkedin',
    notes: 'Cliente fechado',
    createdAt: new Date('2024-01-05').toISOString(),
    lastContact: new Date('2024-01-20').toISOString(),
  },
];

describe('applyAdvancedFilters', () => {
  it('retorna todos os leads quando não há condições', () => {
    const result = applyAdvancedFilters(mockLeads, []);
    
    expect(result).toEqual(mockLeads);
  });

  it('filtra por contains (case insensitive)', () => {
    const conditions = [{ field: 'name' as const, operator: 'contains' as const, value: 'maria' }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Maria Santos');
  });

  it('filtra por equals', () => {
    const conditions = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('João Silva');
  });

  it('filtra por startsWith', () => {
    const conditions = [{ field: 'name' as const, operator: 'startsWith' as const, value: 'ana' }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ana Costa');
  });

  it('filtra por endsWith', () => {
    const conditions = [{ field: 'email' as const, operator: 'endsWith' as const, value: 'test.com' }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(3);
  });

  it('filtra por in (array)', () => {
    const conditions = [{ field: 'stage' as const, operator: 'in' as const, value: ['new', 'won'] }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(2);
  });

  it('filtra por notIn (array)', () => {
    const conditions = [{ field: 'stage' as const, operator: 'notIn' as const, value: ['won'] }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(2);
  });

  it('filtra por exists', () => {
    const conditions = [{ field: 'phone' as const, operator: 'exists' as const }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(2); // Maria e João têm telefone
  });

  it('filtra por notExists', () => {
    const conditions = [{ field: 'phone' as const, operator: 'notExists' as const }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1); // Ana não tem telefone
    expect(result[0].name).toBe('Ana Costa');
  });

  it('aplica múltiplas condições (AND)', () => {
    const conditions = [
      { field: 'stage' as const, operator: 'equals' as const, value: 'negotiating' },
      { field: 'temperature' as const, operator: 'equals' as const, value: 'hot' },
    ];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Maria Santos');
  });

  it('retorna vazio quando condição não corresponde', () => {
    const conditions = [{ field: 'name' as const, operator: 'contains' as const, value: 'Pedro' }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(0);
  });

  it('normaliza strings para lowercase em contains', () => {
    const conditions = [{ field: 'name' as const, operator: 'contains' as const, value: 'MARIA' }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1);
  });

  it('filtra por campo company vazio', () => {
    const conditions = [{ field: 'company' as const, operator: 'notExists' as const }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ana Costa');
  });

  it('filtra por notes preenchido', () => {
    const conditions = [{ field: 'notes' as const, operator: 'exists' as const }];
    const result = applyAdvancedFilters(mockLeads, conditions);
    
    expect(result).toHaveLength(2); // Maria e Ana têm notes
  });
});

describe('useAdvancedFiltersHook', () => {
  it('runImmediate retorna resultados filtrados', () => {
    const { result } = renderHook(() => useAdvancedFiltersHook());
    
    const conditions = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    const filtered = result.current.runImmediate(mockLeads, conditions);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('João Silva');
  });

  it('runMemoized retorna resultados em cache', () => {
    const { result } = renderHook(() => useAdvancedFiltersHook());
    
    const conditions = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    const first = result.current.runMemoized(mockLeads, conditions);
    const second = result.current.runMemoized(mockLeads, conditions);
    
    expect(first).toBe(second); // Mesma referência (cache)
  });

  it('runMemoized recalcula quando condições mudam', () => {
    const { result } = renderHook(() => useAdvancedFiltersHook());
    
    const conditions1 = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    const conditions2 = [{ field: 'stage' as const, operator: 'equals' as const, value: 'won' }];
    
    const first = result.current.runMemoized(mockLeads, conditions1);
    const second = result.current.runMemoized(mockLeads, conditions2);
    
    expect(first).not.toBe(second);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0].name).toBe('João Silva');
    expect(second[0].name).toBe('Ana Costa');
  });

  it('runDebounced chama callback após debounce', async () => {
    const { result } = renderHook(() => useAdvancedFiltersHook(50));
    
    const callback = vi.fn();
    const conditions = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    
    act(() => {
      result.current.runDebounced(mockLeads, conditions, callback);
    });
    
    await waitFor(() => {
      expect(callback).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ name: 'João Silva' })
      ]));
    }, { timeout: 100 });
  });

  it('runDebounced cancela chamadas anteriores', async () => {
    const { result } = renderHook(() => useAdvancedFiltersHook(50));
    
    const callback = vi.fn();
    const conditions1 = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    const conditions2 = [{ field: 'stage' as const, operator: 'equals' as const, value: 'won' }];
    
    act(() => {
      result.current.runDebounced(mockLeads, conditions1, callback);
      result.current.runDebounced(mockLeads, conditions2, callback);
    });
    
    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1); // Só a última
      expect(callback).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ name: 'Ana Costa' })
      ]));
    }, { timeout: 100 });
  });

  it('aceita debounceMs customizado', () => {
    const { result } = renderHook(() => useAdvancedFiltersHook(200));
    
    expect(result.current.runDebounced).toBeDefined();
  });

  it('runImmediate não usa cache', () => {
    const { result } = renderHook(() => useAdvancedFiltersHook());
    
    const conditions = [{ field: 'stage' as const, operator: 'equals' as const, value: 'new' }];
    const first = result.current.runImmediate(mockLeads, conditions);
    const second = result.current.runImmediate(mockLeads, conditions);
    
    expect(first).toEqual(second);
    expect(first).not.toBe(second); // Referências diferentes
  });
});
