# Semana 3 - Plano de Ação para Alcançar 50%+ Cobertura

## Objetivo Principal

Aumentar cobertura de **48.12% → 50%+** (+1.88 pontos percentuais)

## Status Atual

### Métrica Consolidada

- **Linhas**: 48.12%
- **Funções**: 54.47%
- **Statements**: 48.12%
- **Target Global**: 80%

### Testes Falhando (Semana 2)

- ❌ AIJobRequestWizard.test.tsx: 10 falhas
- ❌ FindProvidersPage.test.tsx: 17 falhas
- ❌ fcmService.test.ts: 9 falhas
- ❌ NotificationSettings.test.tsx: 28 falhas
- ❌ MessageTemplateSelector.test.tsx: 11 falhas
- ⚠️ Outros: ~22 falhas

**Total: 97 falhas / 966 testes (89.95% sucesso)**

## Prioridades de Semana 3

### Fase 1: Correção de Testes Críticos (Dia 1-2)

#### 1. NotificationSettings.test.tsx (28 falhas - CRÍTICA)

```
Problema: "Cannot read properties of undefined (reading 'writeText')"
Causa: Clipboard API não mockada
Solução: Mock navigator.clipboard
Linhas afetadas: múltiplas
Impacto estimado: +1-1.5% cobertura
```

#### 2. AIJobRequestWizard.test.tsx (10 falhas)

```
Problema: Testes com dynamic imports falhando
Causa: Async module loading
Solução: Usar await import() corretamente
Impacto: +0.5-0.8% cobertura
```

#### 3. FindProvidersPage.test.tsx (17 falhas)

```
Problema: Component interaction tests failing
Causa: Mock setup incompleto
Solução: Melhorar mock de dependencies
Impacto: +0.3-0.5% cobertura
```

### Fase 2: Novos Testes (Dia 2-3)

#### 4. ClientDashboard.test.tsx (NOVO)

```typescript
// Componente: src/components/ClientDashboard.tsx
// Escopo:
- Rendering dashboard sections
- Available providers filtering
- Job post and tracking
- Payment status display
- Review submission
- Statistics and metrics

// Testes esperados: 30+
// Cobertura: +0.4-0.6%
```

#### 5. JobDetailCard.test.tsx (NOVO)

```typescript
// Componente: src/components/JobDetailCard.tsx
// Escopo:
- Job detail display
- Edit functionality
- Status transitions
- Provider interaction
- Payment handling
- Review display

// Testes esperados: 25+
// Cobertura: +0.3-0.5%
```

#### 6. ProposalCard.test.tsx (NOVO)

```typescript
// Componente: src/components/ProposalCard.tsx
// Escopo:
- Proposal rendering
- Accept/Reject actions
- Price negotiation
- Timeline display
- Provider info
- Communication triggers

// Testes esperados: 20+
// Cobertura: +0.2-0.4%
```

### Fase 3: Consolidação (Dia 3-4)

#### 7. API Integration Tests

```typescript
// Path: tests/services/api.test.ts
// Escopo:
- Job creation endpoint
- Proposal submission
- Payment verification
- Review posting
- User profile updates
- Search queries

// Testes esperados: 40+
// Cobertura: +0.6-0.9%
```

#### 8. Firestore Service Tests

```typescript
// Path: tests/services/firestoreService.test.ts
// Escopo:
- Document CRUD operations
- Collection queries
- Real-time listeners
- Transaction handling
- Error scenarios

// Testes esperados: 35+
// Cobertura: +0.4-0.7%
```

## Cronograma Detalhado

### Dia 1 (Fase 1 - Parte 1)

- **09:00-10:00**: Análise e correção de NotificationSettings (28 falhas)
- **10:00-11:00**: Mocking de Clipboard API
- **11:00-12:00**: Testes de verificação

### Dia 2 (Fase 1 - Parte 2 + Fase 2 - Parte 1)

- **09:00-10:00**: Correção AIJobRequestWizard (10 falhas)
- **10:00-11:00**: Correção FindProvidersPage (17 falhas)
- **11:00-12:00**: ClientDashboard.test.tsx inicial

### Dia 3 (Fase 2 - Parte 2 + Consolidação)

- **09:00-10:00**: JobDetailCard.test.tsx
- **10:00-11:00**: ProposalCard.test.tsx
- **11:00-12:00**: API Integration tests

### Dia 4 (Fase 3 + Validação)

- **09:00-10:00**: Firestore Service tests
- **10:00-11:00**: Testes e correções finais
- **11:00-12:00**: Verificação de cobertura e consolidação

## Métricas de Sucesso

### Checkpoints de Cobertura

| Fase                     | Ação       | Cobertura Target |
| ------------------------ | ---------- | ---------------- |
| Correção NOT (28 falhas) | -28 falhas | ~49.0%           |
| Correção AIJ (10 falhas) | -10 falhas | ~49.3%           |
| Correção FPP (17 falhas) | -17 falhas | ~49.6%           |
| ClientDashboard (NOVO)   | +30 testes | ~50.0%           |
| JobDetailCard (NOVO)     | +25 testes | ~50.3%           |
| ProposalCard (NOVO)      | +20 testes | ~50.5%           |
| API + Firestore (NOVO)   | +75 testes | ~51.5%+          |

## Ferramentas e Configuração

### Debugging

```powershell
# Rodar um arquivo de teste específico
npm test -- tests/NotificationSettings.test.tsx --reporter=verbose

# Rodar com coverage para arquivo único
npm test -- tests/NotificationSettings.test.tsx --coverage

# Watch mode para desenvolvimento
npm test -- --watch tests/NotificationSettings.test.tsx
```

### Validação

```powershell
# ESLint antes de commit
npm run lint -- tests/week3/

# Cobertura report
npm test 2>&1 | Select-Object -Last 50
```

## Estratégia de Mocking para Semana 3

### Pattern Consistente (Aprendizado de Semana 2)

```typescript
// ✅ Correto: usar dynamic imports
const mockModule = await import('path/to/module');
vi.mocked(mockModule.function).mockImplementation(...);

// ❌ Evitar: require statements
// vi.mocked(require('path').function)...

// ✅ Browser APIs
Object.assign(global.navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});
```

## Possíveis Obstáculos e Soluções

| Obstáculo                      | Solução                       |
| ------------------------------ | ----------------------------- |
| Clipboard API não disponível   | Mock navigator.clipboard      |
| Dynamic imports falhando       | Usar await import() pattern   |
| Firebase auth mock incompleto  | Melhorar firebaseAuth mock    |
| Componentes com state complexo | Usar custom hooks e providers |
| Network requests               | Mock fetch/axios              |

## Commits Esperados em Semana 3

```
tests(week3): fix NotificationSettings 28 failures - clipboard mock
tests(week3): fix AIJobRequestWizard 10 failures - dynamic imports
tests(week3): fix FindProvidersPage 17 failures - component mocking
tests(week3): add ClientDashboard 30+ tests
tests(week3): add JobDetailCard 25+ tests
tests(week3): add ProposalCard 20+ tests
tests(week3): add api service comprehensive suite 40+ tests
tests(week3): add firestore service comprehensive suite 35+ tests
docs(week3): consolidation with 50%+ coverage achieved
```

## Meta Final de Semana 3

✅ **Cobertura Target**: 50%+ (preferível 51-52%)
✅ **Taxa de Sucesso**: 95%+ (máximo 50 falhas)
✅ **Commits**: 8-10 validados
✅ **Novos Testes**: 150-200 testes
✅ **ESLint**: 100% compliant

---

_Plano detalhado para Semana 3 - Documento vivo, atualizar conforme necessário_
