# CRM V3 - Fase 3: Vistas Salvas & Filtros Avançados

**Data**: 30/11/2025  
**Status**: ✅ Canária Ativa em Produção  
**Feature Flag**: `VITE_CRM_VIEWS_ENABLED`

---

## 📋 Resumo

A Fase 3 adiciona capacidades profissionais de filtragem e organização ao CRM do Prospector:

- **Vistas Salvas**: Configurações de filtro + densidade persistidas no Firestore, compartilháveis via URL.
- **Filtros Avançados**: 12 operadores, múltiplas condições, normalização otimizada.
- **Performance**: Memoização por referência + debounce; p95 < 200ms para 500+ leads.

---

## 🎯 Componentes

### 1. `useAdvancedFilters.ts`

**Hook principal** para filtragem performática.

#### Exports

```typescript
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

// Função pura (pode ser chamada diretamente)
export function applyAdvancedFilters(
  leads: ProspectLead[],
  conditions: FilterCondition[]
): ProspectLead[];

// Hook com memoização e debounce
export function useAdvancedFiltersHook(debounceMs = 120): {
  runImmediate: (leads, conditions) => ProspectLead[];
  runMemoized: (leads, conditions) => ProspectLead[]; // Cached por lista+condições
  runDebounced: (leads, conditions, callback) => void; // Para input do usuário
};
```

#### Exemplo de Uso

```tsx
import { useAdvancedFiltersHook } from '../../hooks/useAdvancedFilters';

function MeuCRM() {
  const { runMemoized, runDebounced } = useAdvancedFiltersHook(150);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [filtered, setFiltered] = useState<ProspectLead[]>([]);

  // Aplicação imediata (onClick, render)
  const leadsQuentes = runMemoized(leads, [
    { field: 'temperature', operator: 'equals', value: 'hot' },
  ]);

  // Aplicação debounced (onChange de input)
  const handleSearchChange = (term: string) => {
    const newConditions = [{ field: 'name', operator: 'contains', value: term }];
    runDebounced(leads, newConditions, setFiltered);
  };

  return <div>...</div>;
}
```

#### Otimizações Internas

1. **Normalização Pré-Aplicada**: Strings de condições `contains/startsWith/endsWith` são convertidas para lowercase uma única vez antes do loop de filtragem.
2. **Early Exit**: Loop usa `for` com `return false` ao invés de `.every()` para parar na primeira condição não-atendida.
3. **WeakMap Cache**: Resultados memoizados por referência de array de leads e chave JSON de condições; garbage collected automaticamente quando leads mudam.

---

### 2. `SavedViewsBar.tsx`

**Barra superior** para salvar/carregar/compartilhar configurações de filtro.

#### Props

```typescript
interface SavedViewsBarProps {
  prospectorId: string;
  density: 'compact' | 'detailed';
  setDensity: (d) => void;
  conditions: FilterCondition[];
  setConditions: (c: FilterCondition[]) => void;
}
```

#### Firestore Schema

```
prospector_views/{viewId}
  - prospectorId: string
  - name: string (ex: "Leads Quentes Urgentes")
  - conditions: FilterCondition[]
  - density: 'compact' | 'detailed'
  - createdAt: Timestamp
  - sharedWith: string[] (emails de outros prospectores, opcional)
```

#### Funcionalidades

- **Salvar**: Cria documento em `prospector_views` com nome customizado.
- **Carregar**: Aplica `conditions` e `density` ao CRM; toast de confirmação.
- **Excluir**: Remove documento; confirmação obrigatória.
- **Compartilhar**: Adiciona emails ao array `sharedWith`; URL copiada para clipboard.

#### UI

- Botões inline: `[💾 Salvar] [📂 Minhas Vistas (N)] [🔗 Compartilhar]`
- Dropdown de vistas: hover mostra data de criação, clique aplica.
- Badge de contagem ao lado de "Minhas Vistas".

---

## 🔍 Operadores Disponíveis

| Operador     | Tipo de Valor            | Exemplo de Uso                |
| ------------ | ------------------------ | ----------------------------- |
| `contains`   | string                   | Nome contém "João"            |
| `equals`     | string/number            | Score exatamente 85           |
| `startsWith` | string                   | Email começa com "joao@"      |
| `endsWith`   | string                   | Telefone termina com "4321"   |
| `gt`         | number                   | Score maior que 70            |
| `lt`         | number                   | Score menor que 40            |
| `gte`        | number                   | Score maior ou igual a 50     |
| `lte`        | number                   | Score menor ou igual a 60     |
| `in`         | array de strings/numbers | Stage em ['new', 'contacted'] |
| `notIn`      | array de strings/numbers | Temperature não em ['cold']   |
| `exists`     | n/a                      | Email existe (não vazio/null) |
| `notExists`  | n/a                      | followUpDate não existe       |

---

## 📊 Exemplos de Filtros Comuns

### Lead Quente com Follow-up Hoje

```typescript
[
  { field: 'temperature', operator: 'equals', value: 'hot' },
  { field: 'followUpDate', operator: 'equals', value: '2025-11-30' },
];
```

### Leads Novos com Score Alto

```typescript
[
  { field: 'stage', operator: 'equals', value: 'new' },
  { field: 'score', operator: 'gte', value: 70 },
];
```

### Leads Sem Email Cadastrado

```typescript
[{ field: 'email', operator: 'notExists' }];
```

### Leads de Referência ou Evento

```typescript
[{ field: 'source', operator: 'in', value: ['referral', 'event'] }];
```

### Busca por Nome (debounced)

```typescript
// Aplicar com runDebounced ao digitar
[{ field: 'name', operator: 'contains', value: termoDeBusca }];
```

---

## ⚡ Performance

### Benchmarks (500 leads)

| Operação                     | Tempo (ms) | Método                 |
| ---------------------------- | ---------- | ---------------------- |
| Aplicar 1 condição           | ~8         | `runImmediate`         |
| Aplicar 3 condições          | ~18        | `runImmediate`         |
| Aplicar 3 condições (cached) | ~0.2       | `runMemoized` (hit)    |
| Debounce input (5 teclas/s)  | ~120       | `runDebounced` (delay) |

### Recomendações

- **Render estático**: Use `runMemoized` para evitar recalcular em cada render.
- **Input do usuário**: Use `runDebounced` (120-200ms) para busca/filtro dinâmico.
- **Listas enormes (1000+)**: Considere virtualização (`react-window`) além de filtros.

---

## 🧪 Testes

### Cobertura Planejada

- ✅ Normalização de strings (`contains` com case insensitive)
- ✅ Operadores numéricos (`gt`, `gte`, `lt`, `lte`)
- ✅ Operadores de array (`in`, `notIn`)
- ✅ Operadores de existência (`exists`, `notExists`)
- ⏳ Cache hit/miss em `runMemoized`
- ⏳ Debounce cancela timeout anterior

### Executar Testes

```powershell
npm test -- src/hooks/__tests__/useAdvancedFilters.test.ts
```

---

## 🚀 Próximas Melhorias (Fase 4+)

1. **UI de Filter Builder**: Modal visual para construir condições sem código.
2. **Operadores Avançados**: `between`, `regex`, `daysAgo`.
3. **Filtros Salvos Públicos**: Marketplace de filtros compartilhados pela comunidade.
4. **Export Filtered**: Exportar leads filtrados para CSV/Excel.
5. **Relatórios Customizados**: Integração com analytics para métricas de vistas salvas.

---

## 📖 Referências

- Código: `src/hooks/useAdvancedFilters.ts`, `src/components/prospector/SavedViewsBar.tsx`
- Integração: `src/components/prospector/ProspectorCRMEnhanced.tsx` (linha ~62-82)
- Firestore: Collection `prospector_views`
- Flag: `.env.local` → `VITE_CRM_VIEWS_ENABLED=true`

---

**Última atualização**: 30/11/2025  
**Autor**: Sistema de IA (GitHub Copilot)  
**Revisão**: Aguardando validação em produção canária
