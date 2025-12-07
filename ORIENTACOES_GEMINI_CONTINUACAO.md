# 🎯 Orientações para Gemini (Google IDX) - Continuação Autônoma

**Data**: 7 de dezembro de 2025  
**Status**: ✅ Trabalho simultâneo funcionando perfeitamente  
**Sincronização**: Git origin agenciaclimb/Servio.AI (branch única)

---

## 📋 Resumo Atual

### Seu Trabalho (Copilot VS Code Local) ✅

- **SPRINT 1-3**: 3,230+ LOC implementados
  - E2E Auth Helper (447 LOC)
  - Lead Scoring Backend (1,316 LOC)
  - AI Recommendations (1,214 LOC)
- **Branch**: feat/ai-recommendations (sincronizada)
- **PR #8**: Aberta e aguardando revisão

### Trabalho Detectado do Gemini ✅

- **fix(a11y)**: AIInternalChat accessibility (origin/main - 8e2d936)
- **chore(autofix)**: ESLint/Prettier em 363 arquivos (db64e51)
- **Status**: Commits visíveis em origin, zero conflitos

---

## 🚀 Instruções para Continuar (SPRINT 4-6)

### SPRINT 4: Frontend Components (60 min)

**Objetivo**: Integrar lead scoring com UI React

**Tasks**:

1. **Task 4.1**: LeadScoreCard Component
   - Arquivo: `src/components/prospector/LeadScoreCard.tsx`
   - Props: `{ leadId, score, analysis, recommendation }`
   - Features:
     - Circular progress (0-100)
     - Color coding: Red (cold <50) → Yellow (warm 50-79) → Green (hot ≥80)
     - Badges: "Hot", "Warm", "Cold"
     - Modal com breakdown detalhado
   - Tests: Unit tests (jest + vitest)
   - Acceptance: >80% coverage, ESLint PASS

2. **Task 4.2**: useAIRecommendations Hook
   - Arquivo: `src/hooks/useAIRecommendations.ts`
   - Signature:
     ```typescript
     function useAIRecommendations(leadId: string, prospectorId: string) {
       return {
         recommendations: Recommendation | null;
         loading: boolean;
         error: Error | null;
         refetch: () => Promise<void>;
       }
     }
     ```
   - Integration: Fetch from `/api/prospector/ai-recommendations`
   - Tests: Hook unit tests
   - Acceptance: >80% coverage

3. **Task 4.3**: CRM Kanban Integration
   - Arquivo: `src/components/prospector/ProspectorCRMEnhanced.tsx`
   - Changes:
     - Add LeadScoreCard to each kanban card
     - Show score badge on card header
     - Open recommendation modal on click
     - Filter by score threshold
   - Tests: Integration tests
   - Acceptance: No breaking changes

**Branch**: `git checkout -b feat/frontend-scoring`  
**Commits**: Atomic, uma task por commit  
**Pattern**: Mesmo padrão anterior (testes primeiro, depois código)

---

### SPRINT 5: E2E Testing Completion (120 min)

**Objetivo**: Executar e corrigir suite E2E completa

**Tasks**:

1. **Task 5.1**: Execute Full Test Suite
   - Command: `npm run e2e:critical` (50+ testes)
   - Current: 21/59 (35.6%)
   - Target: 50+/59 (85%+)
   - Focus areas:
     - Prospector flows (lead scoring + AI)
     - Provider flows (recomendações)
     - Admin flows (analytics)
     - Client flows (proposals)

2. **Task 5.2**: Fix Failures + Stabilize
   - Debug flaky tests
   - Improve selector robustness
   - Add waits where needed
   - Document patterns

**Branch**: `git checkout -b feat/e2e-complete`  
**Acceptance**: 50+ tests passing, zero flaky tests

---

### SPRINT 6: Documentation & Consolidation (60 min)

**Objetivo**: Documentar Phase 4 e consolidar PRs

**Tasks**:

1. **Task 6.1**: Update DOCUMENTO_MESTRE
   - Add sections:
     - "Phase 4 Frontend Architecture"
     - "Lead Scoring UI Components"
     - "E2E Test Infrastructure"
     - "Performance Metrics"

2. **Task 6.2**: Consolidate PRs
   - Merge feat/frontend-scoring → feat/e2e-complete
   - Merge feat/e2e-complete → main
   - OR: Create consolidated PR with all SPRINTs

**Branch**: main (após merges)  
**Acceptance**: Documentation completa, PRs consolidadas

---

## 📌 Protocolos de Sincronização

### Git Workflow (CRÍTICO)

```powershell
# Antes de começar nova task
git fetch origin
git pull origin main --no-rebase
git status

# Depois de task completa
git add <files>
git commit -m "type(scope): descrição [GEMINI]"
git push -u origin feat/branch-name

# Se houver merge
git fetch origin
git merge origin/main --no-rebase
# Resolver conflicts se houver (unlikely)
git push origin feat/branch-name
```

### Nomes de Branches

- SPRINT 4: `feat/frontend-scoring`
- SPRINT 5: `feat/e2e-complete`
- SPRINT 6: mergear para main

### Formato de Commits

```
feat(scope): descrição [GEMINI]
fix(scope): correção [GEMINI]
test(scope): testes [GEMINI]
docs(scope): documentação [GEMINI]
chore(scope): manutenção [GEMINI]
```

---

## ✅ Checklist para Cada Task

- [ ] Branch criada e sincronizada
- [ ] Código escrito com comentários JSDoc
- [ ] Tests passando (>80% coverage)
- [ ] ESLint PASSING (pre-commit)
- [ ] TypeScript STRICT (no `any` types)
- [ ] Sem console.logs em produção
- [ ] Commits atômicos e descritivos
- [ ] Git push successful
- [ ] PR opened se finalizada (SPRINT)

---

## 🔗 Referências & Padrões

### Arquivos para Estudar

- `src/components/prospector/ProspectorCRMEnhanced.tsx` (1,365 LOC)
- `src/hooks/useAdvancedFilters.ts` (134 LOC)
- `backend/src/services/leadScoringService.js` (380 LOC)
- `backend/src/services/aiRecommendationService.js` (420 LOC)

### Padrões de Código

1. **React Components**:

   ```tsx
   interface ComponentProps {
     prop1: Type1;
     prop2: Type2;
   }

   export default function Component({ prop1, prop2 }: ComponentProps) {
     const [state, setState] = useState<Type>();
     useEffect(() => {
       /* ... */
     }, [dep1, dep2]);
     return <div>...</div>;
   }
   ```

2. **Custom Hooks**:

   ```ts
   interface HookReturn {
     data: DataType | null;
     loading: boolean;
     error: Error | null;
   }

   export function useCustom(): HookReturn {
     const [data, setData] = useState<DataType | null>(null);
     // ...
     return { data, loading, error };
   }
   ```

3. **Tests**:
   ```ts
   describe('Component', () => {
     it('should render', () => {
       render(<Component {...props} />);
       expect(screen.getByRole('button')).toBeInTheDocument();
     });
   });
   ```

---

## ⚠️ Pontos Críticos

### Evitar

- ❌ Modificar PR #8 enquanto aguarda review
- ❌ Trabalhar em main diretamente
- ❌ Usar `any` types (TypeScript strict)
- ❌ Esquecaer `git fetch` antes de criar branch
- ❌ Fazer commits em branch errada

### Prioridades

1. **Qualidade > Quantidade**: Preferir testes perfeitos a código rápido
2. **Sincronização**: git fetch a cada 30 min
3. **Documentação**: JSDoc em toda função pública
4. **Commits**: Mensagens claras e descritivas

---

## 📞 Handoff (Se Necessário)

Se você (Copilot) precisar transferir para outro agente ou retomar depois:

**Estado Atual**:

- ✅ SPRINT 1-3: Completos (3,230+ LOC)
- ✅ PR #8: Aberta e sincronizada
- ✅ Git: Zero conflitos
- ⏳ SPRINT 4: Frontend (próximo)
- ⏳ SPRINT 5: E2E (após SPRINT 4)
- ⏳ SPRINT 6: Documentation (final)

**Para Continuar**:

1. `git checkout main && git pull origin main --no-rebase`
2. Criar nova branch para SPRINT 4
3. Seguir tasks acima
4. Manter git fetch a cada step

---

## 🎯 Meta Final (Phase 4 Complete)

**Quando tudo estiver pronto**:

- ✅ 3 SPRINTs completados (E2E + Backend + Frontend)
- ✅ 50+ E2E tests passando (85%+)
- ✅ >88% code coverage
- ✅ Documentação atualizada
- ✅ PR consolidada merged para main
- ✅ Production-ready Phase 4

**ETA**: ~7-8 horas totais (3h feitas, 4-5h restantes)

---

**Você pode continuar!** 🚀  
Está tudo sincronizado e alinhado. Siga o protocolo acima e mantenha a sincronização Git a cada 30 min.
