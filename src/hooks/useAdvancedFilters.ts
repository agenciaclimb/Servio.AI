import type { ProspectLead } from '../components/ProspectorCRM';
import { useMemo, useRef, useCallback } from 'react';

export type Operator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'exists'
  | 'notExists';
export interface FilterCondition {
  field: keyof ProspectLead | 'followUpDate' | 'lastActivity';
  operator: Operator;
  value?: string | number | Array<string | number>;
}

export function applyAdvancedFilters(
  leads: ProspectLead[],
  conditions: FilterCondition[]
): ProspectLead[] {
  if (!conditions || conditions.length === 0) return leads;
  // Normaliza condições para acelerar comparações (lowercase pré-calculado)
  const normalized = conditions.map(cond => {
    if (
      (cond.operator === 'contains' ||
        cond.operator === 'startsWith' ||
        cond.operator === 'endsWith') &&
      typeof cond.value === 'string'
    ) {
      return { ...cond, value: (cond.value as string).toLowerCase() };
    }
    return cond;
  });
  return leads.filter(lead => {
    for (let i = 0; i < normalized.length; i++) {
      const cond = normalized[i];
      const raw = (lead as any)[cond.field as string];
      const valStr = String(raw ?? '').toLowerCase();
      switch (cond.operator) {
        case 'contains':
          if (!valStr.includes(String(cond.value ?? ''))) return false;
          break;
        case 'equals':
          if (String(raw ?? '') !== String(cond.value ?? '')) return false;
          break;
        case 'startsWith':
          if (!valStr.startsWith(String(cond.value ?? ''))) return false;
          break;
        case 'endsWith':
          if (!valStr.endsWith(String(cond.value ?? ''))) return false;
          break;
        case 'gt':
          if (!(Number(raw ?? 0) > Number(cond.value ?? 0))) return false;
          break;
        case 'lt':
          if (!(Number(raw ?? 0) < Number(cond.value ?? 0))) return false;
          break;
        case 'gte':
          if (!(Number(raw ?? 0) >= Number(cond.value ?? 0))) return false;
          break;
        case 'lte':
          if (!(Number(raw ?? 0) <= Number(cond.value ?? 0))) return false;
          break;
        case 'in':
          if (!Array.isArray(cond.value) || !cond.value.includes(raw as string | number)) return false;
          break;
        case 'notIn':
          if (Array.isArray(cond.value) && cond.value.includes(raw as string | number)) return false;
          break;
        case 'exists':
          if (raw === undefined || raw === null || raw === '') return false;
          break;
        case 'notExists':
          if (!(raw === undefined || raw === null || raw === '')) return false;
          break;
        default:
          break;
      }
    }
    return true;
  });
}

// Hook com memoização e debounce para listas grandes
export function useAdvancedFiltersHook(debounceMs = 120) {
  const timerRef = useRef<number | undefined>(undefined);

  const runImmediate = useCallback((leads: ProspectLead[], conditions: FilterCondition[]) => {
    return applyAdvancedFilters(leads, conditions);
  }, []);

  const runMemoized = useMemo(() => {
    const cache = new WeakMap<object, Map<string, ProspectLead[]>>();
    return (leads: ProspectLead[], conditions: FilterCondition[]) => {
      const key = JSON.stringify(conditions);
      let byKey = cache.get(leads as unknown as object);
      if (!byKey) {
        byKey = new Map<string, ProspectLead[]>();
        cache.set(leads as unknown as object, byKey);
      }
      const cached = byKey.get(key);
      if (cached) return cached;
      const result = runImmediate(leads, conditions);
      byKey.set(key, result);
      return result;
    };
  }, [runImmediate]);

  const runDebounced = useCallback(
    (
      leads: ProspectLead[],
      conditions: FilterCondition[],
      callback: (res: ProspectLead[]) => void
    ) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const res = runMemoized(leads, conditions);
        callback(res);
      }, debounceMs) as unknown as number;
    },
    [runMemoized, debounceMs]
  );

  return { runImmediate, runMemoized, runDebounced };
}
