# 🎯 Plano de Ação: 80% Coverage Excellence

**Objetivo:** Atingir 80% de coverage de código para excelência em produção  
**Status Atual:** 26.24% coverage (53.76% de gap)  
**Data:** 25/11/2025  
**Prioridade:** 🔴 CRÍTICA - Bloqueador para produção

---

## 📊 Situação Atual

| Métrica                | Atual        | Target | Gap     |
| ---------------------- | ------------ | ------ | ------- |
| **Coverage**           | 26.24%       | 80%    | -53.76% |
| **Tests**              | 678 passando | 1000+  | -322    |
| **Issues SonarCloud**  | 212          | 0      | 212     |
| **Security Hotspots**  | 4            | 0      | 4       |
| **Reliability Rating** | -            | A      | -       |

---

## 🔧 Fase 1: Identificação de Gaps (1-2 dias)

### 1.1 Componentes com Coverage Baixo

**HIGH PRIORITY (0% coverage):**

```
❌ ProfilePage.tsx - 0%
❌ ProviderLandingPage.tsx - 0%
❌ FindClientsPage.tsx - 0%
❌ ServiceCatalogModal.tsx - 0%
❌ AIJobRequestWizard.tsx - Parcial (25.71%)
❌ ProspectorCRM.tsx - 0%
❌ QuickActionsBar.tsx - 0%
❌ OnboardingTour.tsx - Parcial (72.49%)
```

**MEDIUM PRIORITY (< 50% coverage):**

```
🟡 ClientDashboard.tsx - 75.69%
🟡 ProviderDashboard.tsx - 85.41%
🟡 ProfileModal.tsx - 71.11%
🟡 ProspectorDashboard.tsx - 75.69%
```

### 1.2 Services Sem Testes

```
❌ fcmService.ts - 0%
❌ notificationService.ts - 0%
❌ matchingService.ts - Parcial (47.69%)
❌ prospectingService.ts - 0%
```

---

## 📝 Fase 2: Estratégia de Testes (3-5 dias)

### 2.1 Testes de Página (Critical Pages)

**Priority Order:**

1. `ProfilePage.tsx` - Core user functionality
   - User profile display
   - Edit profile form
   - Profile strength indicator
   - Photo upload

2. `AIJobRequestWizard.tsx` - Job creation flow
   - Step navigation
   - Form validation
   - AI enhancement integration
   - Submission

3. `ClientDashboard.tsx` - Main dashboard
   - Job list rendering
   - Status filters
   - Search/pagination
   - Job actions

### 2.2 Service Layer Tests

**Services Críticas:**

1. `geminiService.ts` - Mock GEMINI_API_KEY
2. `notificationService.ts` - Mock Firebase messaging
3. `matchingService.ts` - Complete flow testing
4. `prospectingService.ts` - Mock API calls

### 2.3 Estratégia de Mock

```typescript
// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
}));

// Mock API
vi.mock('./services/api', () => ({
  callBackendAPI: vi.fn(endpoint => {
    if (endpoint === '/enhance-job') return { enhanced: true };
    if (endpoint === '/match-providers') return { matches: [] };
    return {};
  }),
}));

// Mock Gemini
vi.mock('./services/geminiService', () => ({
  enhanceJobDescription: vi.fn(() => 'Enhanced text'),
  generateProviderBio: vi.fn(() => 'Generated bio'),
}));
```

---

## 🧪 Fase 3: Implementação de Testes (5-7 dias)

### 3.1 Prioridade de Componentes

| Semana   | Componente             | Objetivo      | Estimativa |
| -------- | ---------------------- | ------------- | ---------- |
| Semana 1 | ProfilePage.tsx        | 85% coverage  | 6h         |
| Semana 1 | AIJobRequestWizard.tsx | 80% coverage  | 8h         |
| Semana 2 | ClientDashboard.tsx    | 85% coverage  | 6h         |
| Semana 2 | ProviderDashboard.tsx  | 90% coverage  | 6h         |
| Semana 2 | Services (5)           | 80%+ coverage | 10h        |

### 3.2 Checklist de Testes

Para cada componente/service, garantir:

- ✅ Happy path (cenário ideal)
- ✅ Error handling (tratamento de erros)
- ✅ Edge cases (casos extremos)
- ✅ User interactions (cliques, inputs)
- ✅ Async operations (promises, API calls)
- ✅ Conditional rendering (props diferentes)
- ✅ State changes (updates, cleanup)

---

## 📈 Fase 4: Incremento Gradual

### Metas de Cobertura Quinzenais

```
Semana 1: 26.24% → 35% (+8.76%)
Semana 2: 35% → 45% (+10%)
Semana 3: 45% → 55% (+10%)
Semana 4: 55% → 65% (+10%)
Semana 5: 65% → 75% (+10%)
Semana 6: 75% → 80% (+5%)
```

### Monitoramento

```bash
# Verificar coverage por arquivo
npm run test -- --coverage --verbose

# Gerar relatório HTML
npm run test -- --coverage && open coverage/index.html

# Monitorar no SonarCloud
# Dashboard: https://sonarcloud.io/project/overview?id=agenciaclimb_Servio.AI
```

---

## 🚀 Fase 5: CI/CD Integration

### 5.1 Configuração de Thresholds

```javascript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  lines: 80,        // Linhas
  functions: 80,    // Funções
  branches: 75,     // Branches (mais difícil)
  statements: 80,   // Statements
}
```

### 5.2 GitHub Actions

```yaml
- name: Test Coverage
  run: npm test -- --coverage

- name: Check Coverage Threshold
  run: |
    COVERAGE=$(grep -oP 'Lines\s+:\s+\K[0-9.]+' coverage/lcov-report/index.html)
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 80% threshold"
      exit 1
    fi
```

---

## 🎯 Componentes Críticos para 80%

### Absolute Must-Have

```
✅ ProfilePage.tsx        → 85% (6h)
✅ AIJobRequestWizard.tsx → 80% (8h)
✅ ClientDashboard.tsx    → 85% (6h)
✅ ProviderDashboard.tsx  → 90% (6h)
✅ geminiService.ts       → 85% (4h)
✅ matchingService.ts     → 80% (4h)
✅ notificationService.ts → 80% (4h)
✅ prospectingService.ts  → 80% (4h)
```

**Total: ~42 horas de trabalho**

### Nice-to-Have (Extra Coverage)

```
🟡 Modal Components       → 80% (8h)
🟡 Form Components        → 80% (6h)
🟡 Utility Functions      → 90% (4h)
```

---

## ⚠️ Bloqueadores & Soluções

### Problema 1: Componentes com Firebase Puro

**Issue:** Componentes que usam Firebase diretamente não podem ser testados

**Solução:**

```typescript
// ANTES (não testável)
import { db } from './firebaseConfig'
const snapshot = await db.collection('users').get()

// DEPOIS (testável)
// Injetar db como prop/context
<Provider db={mockDb}>
  <MyComponent />
</Provider>
```

### Problema 2: Async Operations

**Issue:** Testes falhando com promises não resolvidas

**Solução:**

```typescript
vi.useFakeTimers()
await waitFor(() => expect(...).toBe(...))
vi.useRealTimers()
```

### Problema 3: Network Calls

**Issue:** Testes lentos esperando API

**Solução:**

```typescript
vi.mock('./services/api', () => ({
  default: {
    post: vi.fn(() => Promise.resolve(mockResponse)),
  },
}));
```

---

## 📋 Próximos Passos Imediatos

### Hoje (25/11):

- [x] Definir plano 80% coverage
- [x] Configurar SonarCloud com 80% threshold
- [ ] Criar template de testes padrão

### Amanhã (26/11):

- [ ] Começar com ProfilePage.tsx (teste 1)
- [ ] Criar fixtures/mocks reutilizáveis
- [ ] Document best practices de teste

### Esta Semana:

- [ ] 5 componentes críticos testados
- [ ] Coverage aumentando para 35%
- [ ] CI/CD validando coverage

---

## 📞 Recursos

- **Vitest Docs:** https://vitest.dev/guide/coverage
- **SonarCloud:** https://sonarcloud.io/project/quality-gate?id=agenciaclimb_Servio.AI
- **Test Coverage Reports:** `npm run test -- --coverage`

---

**Mantém a excelência! 🚀 Vamos atingir 80%!**
