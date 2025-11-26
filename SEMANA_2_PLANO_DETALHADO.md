# 🎯 SEMANA 2 - PLANO DETALHADO (27/11 - 03/12/2025)

**Status**: 🟢 INICIADA  
**Meta**: 46.81% → 55-60% (+8-13 pts de cobertura)  
**Estratégia**: Dashboards complexos + serviços críticos + testes focused

---

## 📊 MAPA DE COMPONENTES

### Tier 1: ALTA PRIORIDADE (Alto Impacto de Cobertura)

#### 1️⃣ **ClientDashboard.tsx** (931 linhas)

- **Localização**: `src/components/dashboards/ClientDashboard.tsx`
- **Cobertura Atual**: 0%
- **Impacto Estimado**: +3-4% cobertura geral
- **Testes Estimados**: 40-50 testes
- **Complexidade**: Alta (múltiplos estados, filtros, modais)

**Funcionalidades a Testar**:

```typescript
✓ Render initial state (loading, empty, with data)
✓ Proposals: listagem, aceitação, rejeição, cancelamento
✓ Jobs in progress: tracking, status updates
✓ Reviews & ratings: display, filtering
✓ Payment history: visualização de transações
✓ Modal interactions: aceitar proposta, visualizar detalhes
✓ Filtros & paginação: categoria, status, data
✓ Error states & recovery
✓ Listener cleanup on unmount
```

**Mock Needs**:

- `useClientDashboardData()` hook
- Firestore queries: users/{email}/proposals, jobs, reviews
- Firebase real-time listeners
- Payment service integration

**Padrão de Teste**:

```typescript
describe('ClientDashboard', () => {
  // Setup: mock hook que retorna { proposals: [], jobs: [], reviews: [] }
  // Test categories:
  // 1. Rendering: initial, loading, empty, populated states
  // 2. User interactions: click accept/reject, expand details
  // 3. Data transformations: filtering, sorting, pagination
  // 4. Error handling: Firebase errors, network failures
  // 5. Cleanup: listeners removed on unmount
});
```

---

#### 2️⃣ **FindProvidersPage.tsx** (238 linhas)

- **Localização**: `src/pages/FindProvidersPage.tsx`
- **Cobertura Atual**: 0%
- **Impacto Estimado**: +1-2% cobertura
- **Testes Estimados**: 25-35 testes
- **Complexidade**: Média (search, filters, pagination)

**Funcionalidades a Testar**:

```typescript
✓ Initial render com lista vazia ou populada
✓ Search input: typing, submit, clearing
✓ Filtros: categoria, experiência mínima, avaliação mínima
✓ Ordenação: por avaliação, recente, preço
✓ Paginação: next/prev, página específica
✓ Provider cards: display info, botão de contato
✓ Navigation: click provider → profile, click "Contratar" → AIJobRequestWizard
✓ Error states: sem resultados, network error
✓ Mobile responsiveness
```

**Mock Needs**:

- API call: `GET /api/providers?search=&category=&minRating=`
- Pagination hook ou state management
- Navigation context/hook

---

#### 3️⃣ **ProviderDashboard.tsx** (retry - mock simplificado)

- **Localização**: `src/components/dashboards/ProviderDashboard.tsx`
- **Cobertura Atual**: 0%
- **Impacto Estimado**: +1-2% cobertura
- **Testes Estimados**: 30-40 testes
- **Complexidade**: Alta (múltiplos componentes filhos)
- **Estratégia**: Mock selective (não mock toda árvore, only critical)

**Funcionalidades a Testar**:

```typescript
✓ Licitações recebidas: render, aceitar, rejeitar
✓ Trabalhos ativos: tracking, upload de progress, conclusão
✓ Histórico de ganhos: totalização, por período
✓ Performance metrics: taxa de aceitação, avaliação média
✓ Settings & perfil: visualização, edição (mocked)
✓ Notificações: novas licitações, updates
✓ Filtros: status, período, categoria
```

**Mock Strategy - SIMPLIFICADO**:

- Mock only `useProviderDashboardData()` hook (retorna dados)
- Do NOT mock child components individually
- Let child components render (test integration)
- Mock only Firestore queries and API calls

---

### Tier 2: MÉDIA PRIORIDADE (Dashboards Admin)

#### 4️⃣ **AdminDashboard.tsx** (197 linhas)

- **Testes**: 20-25 testes
- **Impacto**: +0.5-1% cobertura

**Funcionalidades**:

- Estatísticas (usuários ativos, receita, jobs concluídos)
- Gráficos/charts (tendências)
- Quick actions (navegar para moderation, users, jobs)

---

#### 5️⃣ **AdminUsersPanel.tsx** (146 linhas)

- **Testes**: 20-25 testes
- **Impacto**: +0.5-1% cobertura

**Funcionalidades**:

- Listagem com paginação
- Busca por email/nome
- Actions: view detail, ativar, suspender, delete

---

#### 6️⃣ **AdminJobsPanel.tsx** (118 linhas)

- **Testes**: 15-20 testes
- **Impacto**: +0.5-1% cobertura

**Funcionalidades**:

- Listagem com filtros (status: aberto/em_progresso/concluído)
- Detalhes expandidos
- Ações: view details, remover, marcar completo

---

### Tier 3: SERVIÇOS CRÍTICOS

#### 7️⃣ **fcmService.ts** (201 linhas, 0% cobertura)

- **Localização**: `src/services/fcmService.ts`
- **Testes**: 30-35 testes
- **Impacto**: +1-2% cobertura

**Funcionalidades a Testar**:

```typescript
✓ Inicialização: getToken(), error handling
✓ Token refresh: listener, update backend
✓ Listeners: onMessage(), onNotificationClick
✓ Message types: proposal received, job update, review posted
✓ Payload parsing: estrutura esperada
✓ Error scenarios: permissão negada, service worker ausente
✓ Cleanup: removeListener(), service worker unregister
```

**Mock Needs**:

```typescript
vi.mock('firebase/messaging', () => ({
  initializeApp: vi.fn(),
  getMessaging: vi.fn(() => ({ app: {} })),
  getToken: vi.fn(() => Promise.resolve('mock-token')),
  onMessage: vi.fn(cb => {
    /* trigger callback */
  }),
  onBackgroundMessage: vi.fn(),
}));
```

---

#### 8️⃣ **stripeService.ts** (318 linhas, 0% cobertura)

- **Localização**: `src/services/stripeService.ts`
- **Testes**: 40-45 testes
- **Impacto**: +2-3% cobertura

**Funcionalidades a Testar**:

```typescript
✓ Criar Checkout Session: { lineItems, successUrl, cancelUrl }
✓ Verificar status: retrieve session
✓ Webhook validation: event signature, processing
✓ Payment statuses: completed, failed, expired
✓ Refund processing: full refund, partial refund
✓ Error handling: invalid session, network error
✓ Integração com Escrow: job.escrowId update
✓ Receipt generation: email notification
```

**Mock Needs**:

```typescript
vi.mock('stripe', () => ({
  Stripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
    },
  })),
}));
```

---

## 📅 CRONOGRAMA EXECUTIVO

### Segunda-feira (27/11)

**Manhã** (09:00-12:00):

- [ ] Criar `tests/week2/ClientDashboard.test.tsx` (40 testes)
- [ ] Executar testes, validar ESLint
- [ ] Commit: "tests(week2): ClientDashboard comprehensive test suite"

**Tarde** (14:00-17:00):

- [ ] Criar `tests/FindProvidersPage.test.tsx` (25 testes)
- [ ] Executar testes, validar ESLint
- [ ] Commit: "tests(week2): FindProvidersPage search and filter tests"
- [ ] **Checkpoint**: Cobertura esperada: 48-50%

---

### Terça-feira (28/11)

**Manhã**:

- [ ] Retry `tests/week2/ProviderDashboard.test.tsx` com mock simplificado (30 testes)
- [ ] Executar testes, validar ESLint
- [ ] Commit: "tests(week2): ProviderDashboard simplified mock tests"

**Tarde**:

- [ ] Criar `tests/week2/AdminDashboard.test.tsx` (20 testes)
- [ ] Criar `tests/week2/AdminUsersPanel.test.tsx` (20 testes)
- [ ] Commit: "tests(week2): Admin dashboards test suites"
- [ ] **Checkpoint**: Cobertura esperada: 50-52%

---

### Quarta-feira (29/11)

**Manhã**:

- [ ] Criar `tests/services/fcmService.test.ts` (35 testes)
- [ ] Executar testes, validar ESLint
- [ ] Commit: "tests(services): FCM service comprehensive tests"

**Tarde**:

- [ ] Criar `tests/services/stripeService.test.ts` (40 testes)
- [ ] Executar testes, validar ESLint
- [ ] Commit: "tests(services): Stripe service comprehensive tests"
- [ ] **Checkpoint**: Cobertura esperada: 54-56%

---

### Quinta/Sexta (30/11 - 03/12)

**Revisão e Consolidação**:

- [ ] Rodar suite completa: `npm test`
- [ ] Verificar coverage report
- [ ] Ajustar testes conforme necessário
- [ ] Documentar padrões estabelecidos
- [ ] Final commit: "tests(semana2): coverage consolidation 46.81% → 55-60%"

**Target Final**: 55-60% ✅

---

## 🔧 TEMPLATE DE TESTE (Reutilizável)

### Para Componentes (ex: ClientDashboard)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientDashboard from '../../components/dashboards/ClientDashboard';

// Mock dependencies
vi.mock('../../services/api');
vi.mock('../../firebaseConfig');
vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading">Loading</div>
}));

describe('ClientDashboard', () => {
  const mockUser = { email: 'client@example.com', uid: 'user-123' };
  const mockProposals = [/* mock data */];

  beforeEach(() => {
    // Setup mocks
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      // test
    });
    it('should render empty state when no proposals', () => {
      // test
    });
    it('should render proposal list when data loaded', () => {
      // test
    });
  });

  describe('User Interactions', () => {
    it('should accept proposal on button click', async () => {
      // test
    });
    it('should reject proposal on button click', async () => {
      // test
    });
  });

  // More describe blocks...
});
```

### Para Services (ex: stripeService)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import stripeService from '../../services/stripeService';

vi.mock('stripe', () => ({
  Stripe: vi.fn(() => ({
    /* mock */
  })),
}));

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create session with valid params', async () => {
      // test
    });
    it('should handle API errors', async () => {
      // test
    });
  });

  // More describes...
});
```

---

## ✅ CRITÉRIO DE SUCESSO

### Métricas Obrigatórias

| Métrica             | Target   | Aceitável | Crítico |
| ------------------- | -------- | --------- | ------- |
| **Cobertura**       | 56-60%   | 54%       | <50% ❌ |
| **Testes Passando** | 100%     | 99%       | <95% ❌ |
| **ESLint**          | 0 Errors | 0 Errors  | >0 ❌   |
| **Commits**         | 6-8      | 5+        | <3 ❌   |
| **Build**           | Pass     | Pass      | Fail ❌ |

### Checklist Diário

- [ ] Testes escritos e passando
- [ ] `npm run lint` executado, zero erros
- [ ] `npm test` com coverage report verificado
- [ ] Commit feito com mensagem descritiva
- [ ] Import paths verificados (../../ para week2/)
- [ ] ESLint pre-commit hooks passando

---

## 📝 NOTAS IMPORTANTES

1. **Import Paths**:
   - `tests/week2/*.tsx` → use `../../services/`, `../../components/`
   - `tests/*.tsx` → use `../services/`, `../components/`

2. **Mock Strategy**:
   - Firestore: Mock em nível de serviço, não de SDK
   - API: Mock HTTP calls, não rotas express
   - Firebase Auth: Mock `getIdToken()`, `currentUser`

3. **Padrão de Commit**:

   ```
   tests(week2): <description>

   - Added X tests for ComponentName
   - Coverage: Y% → Z% (+ΔZ%)
   - All tests passing, ESLint validated
   ```

4. **Coverage Validation**:
   ```bash
   npm test 2>&1 | grep -E "Coverage|lines|statements"
   ```

---

_Plano preparado: 26/11/2025_  
_Última atualização: 26/11/2025 - Semana 2 Iniciada 🚀_
