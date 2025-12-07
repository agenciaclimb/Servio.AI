import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  applyAdvancedFilters,
  useAdvancedFiltersHook,
  type FilterCondition,
} from '../useAdvancedFilters';
import type { ProspectLead } from '../../components/ProspectorCRM';

// Mock data
const mockLeads: ProspectLead[] = [
  {
    id: '1',
    prospectorId: 'p1',
    name: 'João Silva',
    phone: '11987654321',
    email: 'joao@exemplo.com',
    category: 'Eletricista',
    source: 'referral',
    stage: 'new',
    score: 75,
    temperature: 'hot',
    priority: 'high',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastActivity: new Date('2025-11-30'),
    activities: [],
  },
  {
    id: '2',
    prospectorId: 'p1',
    name: 'Maria Santos',
    phone: '11976543210',
    email: undefined,
    category: 'Encanador',
    source: 'direct',
    stage: 'contacted',
    score: 45,
    temperature: 'warm',
    priority: 'medium',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    activities: [],
  },
  {
    id: '3',
    prospectorId: 'p1',
    name: 'Pedro Costa',
    phone: '11965432109',
    email: 'pedro@exemplo.com',
    category: 'Pintor',
    source: 'event',
    stage: 'negotiating',
    score: 30,
    temperature: 'cold',
    priority: 'low',
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01'),
    activities: [],
  },
];

describe('applyAdvancedFilters', () => {
  describe('Operador contains', () => {
    it('deve filtrar por substring case insensitive', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'joão' },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });

    it('deve retornar vazio se substring não encontrada', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'inexistente' },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(0);
    });
  });

  describe('Operador equals', () => {
    it('deve filtrar por igualdade exata (string)', () => {
      const conditions: FilterCondition[] = [
        { field: 'temperature', operator: 'equals', value: 'hot' },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].temperature).toBe('hot');
    });

    it('deve filtrar por igualdade exata (number)', () => {
      const conditions: FilterCondition[] = [{ field: 'score', operator: 'equals', value: 45 }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(45);
    });
  });

  describe('Operadores startsWith/endsWith', () => {
    it('deve filtrar por prefixo case insensitive', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'startsWith', value: 'maria' },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Maria Santos');
    });

    it('deve filtrar por sufixo', () => {
      const conditions: FilterCondition[] = [
        { field: 'phone', operator: 'endsWith', value: '321' },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].phone).toBe('11987654321');
    });
  });

  describe('Operadores numéricos', () => {
    it('deve filtrar por maior que (gt)', () => {
      const conditions: FilterCondition[] = [{ field: 'score', operator: 'gt', value: 50 }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(75);
    });

    it('deve filtrar por menor que (lt)', () => {
      const conditions: FilterCondition[] = [{ field: 'score', operator: 'lt', value: 40 }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(30);
    });

    it('deve filtrar por maior ou igual (gte)', () => {
      const conditions: FilterCondition[] = [{ field: 'score', operator: 'gte', value: 45 }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(2);
      expect(result.map(l => l.score).sort()).toEqual([45, 75]);
    });

    it('deve filtrar por menor ou igual (lte)', () => {
      const conditions: FilterCondition[] = [{ field: 'score', operator: 'lte', value: 45 }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(2);
      expect(result.map(l => l.score).sort()).toEqual([30, 45]);
    });
  });

  describe('Operadores de array', () => {
    it('deve filtrar por inclusão (in)', () => {
      const conditions: FilterCondition[] = [
        { field: 'source', operator: 'in', value: ['referral', 'event'] },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(2);
      expect(result.map(l => l.source).sort()).toEqual(['event', 'referral']);
    });

    it('deve filtrar por exclusão (notIn)', () => {
      const conditions: FilterCondition[] = [
        { field: 'temperature', operator: 'notIn', value: ['cold'] },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(2);
      expect(result.every(l => l.temperature !== 'cold')).toBe(true);
    });
  });

  describe('Operadores de existência', () => {
    it('deve filtrar por campo existente (exists)', () => {
      const conditions: FilterCondition[] = [{ field: 'email', operator: 'exists' }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(2);
      expect(result.every(l => l.email != null && l.email !== '')).toBe(true);
    });

    it('deve filtrar por campo não existente (notExists)', () => {
      const conditions: FilterCondition[] = [{ field: 'email', operator: 'notExists' }];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBeUndefined();
    });
  });

  describe('Múltiplas condições (AND)', () => {
    it('deve aplicar todas as condições (AND lógico)', () => {
      const conditions: FilterCondition[] = [
        { field: 'temperature', operator: 'equals', value: 'hot' },
        { field: 'score', operator: 'gte', value: 70 },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });

    it('deve retornar vazio se qualquer condição falhar', () => {
      const conditions: FilterCondition[] = [
        { field: 'temperature', operator: 'equals', value: 'hot' },
        { field: 'score', operator: 'lt', value: 50 }, // João tem score 75
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('deve retornar todos os leads quando sem condições', () => {
      const result = applyAdvancedFilters(mockLeads, []);
      expect(result).toHaveLength(3);
    });

    it('deve lidar com lista vazia de leads', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'test' },
      ];
      const result = applyAdvancedFilters([], conditions);
      expect(result).toHaveLength(0);
    });

    it('deve normalizar strings apenas uma vez (performance)', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'JOÃO' },
      ];
      const result = applyAdvancedFilters(mockLeads, conditions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });
  });
});

describe('useAdvancedFiltersHook', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe('runImmediate', () => {
    it('deve aplicar filtros imediatamente', () => {
      const { result } = renderHook(() => useAdvancedFiltersHook(100));
      const conditions: FilterCondition[] = [
        { field: 'temperature', operator: 'equals', value: 'hot' },
      ];
      const filtered = result.current.runImmediate(mockLeads, conditions);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('João Silva');
    });
  });

  describe('runMemoized', () => {
    it('deve retornar resultado cacheado para mesmas condições', () => {
      const { result } = renderHook(() => useAdvancedFiltersHook(100));
      const conditions: FilterCondition[] = [
        { field: 'temperature', operator: 'equals', value: 'hot' },
      ];

      // Primeira chamada
      const first = result.current.runMemoized(mockLeads, conditions);
      // Segunda chamada (deve retornar do cache)
      const second = result.current.runMemoized(mockLeads, conditions);

      expect(first).toBe(second); // Mesma referência = cache hit
      expect(first).toHaveLength(1);
    });

    it('deve recalcular quando condições mudarem', () => {
      const { result } = renderHook(() => useAdvancedFiltersHook(100));
      const cond1: FilterCondition[] = [{ field: 'temperature', operator: 'equals', value: 'hot' }];
      const cond2: FilterCondition[] = [
        { field: 'temperature', operator: 'equals', value: 'warm' },
      ];

      const first = result.current.runMemoized(mockLeads, cond1);
      const second = result.current.runMemoized(mockLeads, cond2);

      expect(first).not.toBe(second); // Cache miss
      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);
      expect(first[0].temperature).toBe('hot');
      expect(second[0].temperature).toBe('warm');
    });
  });

  describe('runDebounced', () => {
    it('deve invocar callback após debounce delay', () => {
      const { result } = renderHook(() => useAdvancedFiltersHook(100));
      const callback = vi.fn();
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'joão' },
      ];

      act(() => {
        result.current.runDebounced(mockLeads, conditions, callback);
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([mockLeads[0]]);
    });

    it('deve cancelar timeout anterior em chamadas rápidas', () => {
      const { result } = renderHook(() => useAdvancedFiltersHook(100));
      const callback = vi.fn();
      const cond1: FilterCondition[] = [{ field: 'name', operator: 'contains', value: 'joão' }];
      const cond2: FilterCondition[] = [{ field: 'name', operator: 'contains', value: 'maria' }];

      act(() => {
        result.current.runDebounced(mockLeads, cond1, callback);
      });
      act(() => {
        vi.advanceTimersByTime(50); // Apenas metade do delay
      });
      act(() => {
        result.current.runDebounced(mockLeads, cond2, callback); // Nova chamada cancela anterior
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(1); // Apenas a última chamada
      expect(callback).toHaveBeenCalledWith([mockLeads[1]]); // Maria, não João
    });

    it('deve usar debounce configurável', () => {
      const { result } = renderHook(() => useAdvancedFiltersHook(200)); // 200ms custom
      const callback = vi.fn();
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'pedro' },
      ];

      act(() => {
        result.current.runDebounced(mockLeads, conditions, callback);
      });
      act(() => {
        vi.advanceTimersByTime(100); // Ainda não deveria ter chamado
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100); // Total 200ms
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
