# 🚀 PLANO DE DESENVOLVIMENTO AUTÔNOMO - PRÓXIMAS 24H

**Iniciado**: 07/12/2025 (Modo Autônomo Ativo)  
**Status**: 🔴 EM EXECUÇÃO  
**Executor**: GitHub Copilot (seguindo Protocolo Oficial v1.0)

---

## 📋 Análise do Projeto Atual

### ✅ Estado Atual

- **Frontend**: Produção LIVE (React 18 + TypeScript + Vite)
- **Backend**: Cloud Run v00025-dp2 (128 endpoints)
- **Fase 3**: COMPLETA (Cloud Scheduler + Analytics)
- **Testes E2E**: 21/59 passando (35.6%)
- **Cobertura**: >45% (alvo atingido)
- **Git**: Main limpa, sincronizada com origin

### 🔴 Problemas Identificados

1. **37 testes E2E falhando** (63.7% - bloqueador para Phase 4)
2. **Backend não rodando localmente** (8081 para testes)
3. **Helper de autenticação faltando** (12+ tests dependem)
4. **Seletores Playwright desatualizados** (CRM, OmniInbox)

### 🎯 Objetivo das Próximas 24h

**Desbloquear Phase 4** implementando:

1. ✅ E2E auth helper (20 min)
2. ✅ Corrigir seletores CRM (30 min)
3. ✅ Implementar Lead Scoring básico (2h)
4. ✅ Criar endpoint AI Recommendations (1.5h)
5. ✅ Testes para Lead Scoring (1h)

**Meta Final**: 50+ testes E2E passando + Phase 4 foundation pronta

---

## 📊 Plano Detalhado (24h)

### **SPRINT 1: Testes E2E (00:00 - 04:00)**

#### Task 1.1: Criar Auth Helper para E2E (20 min)

**Branch**: `feat/e2e-auth-helper`
**Arquivo**: `tests/e2e/helpers/auth.ts`
**Saída**: 3 funções (loginAsProvider, loginAsClient, loginAsAdmin)

```typescript
- loginAsProvider(page, email?, password?)
- loginAsClient(page, email?, password?)
- loginAsAdmin(page, email?, password?)
- logout(page)
- waitForAuthRedirect(page, expectedUrl)
```

**Testes**: ✅ Jest unit tests para helper
**Commit**: `feat(e2e): criar auth helper para testes`

#### Task 1.2: Corrigir Seletores CRM Kanban (30 min)

**Branch**: `fix/e2e-kanban-seletores`
**Arquivo**: `tests/e2e/prospector/crm-kanban.spec.ts`
**Alterações**:

- Atualizar `[data-testid]` seletores
- Adicionar `waitForLoadState('networkidle')`
- Usar auth helper em beforeEach
  **Meta**: 8/12 testes passando
  **Commit**: `fix(e2e): corrigir seletores kanban`

#### Task 1.3: Integrar Auth nos Providers (15 min)

**Arquivo**: `tests/e2e/provider/provider-flows.spec.ts`
**Alterações**:

- Usar `loginAsProvider()`
- Adicionar waits para elementos
- Atualizar seletores de jobs
  **Meta**: 1/2 testes passando
  **Commit**: `fix(e2e): integrar auth em provider flows`

### **SPRINT 2: Lead Scoring Backend (04:00 - 06:30)**

#### Task 2.1: Criar LeadScoringService (45 min)

**Branch**: `feat/lead-scoring-engine`
**Arquivo**: `backend/src/services/leadScoringService.js`
**Funções**:

```javascript
calculateLeadScore(lead, prospectProfile);
// Score: 0-100 baseado em:
// - Similaridade com preferências (30%)
// - Histórico de engagement (25%)
// - Localização (20%)
// - Categoria match (25%)

scoreLeadsBatch(prospectorId, leads);
// Calcula score para múltiplos leads

rankLeads(leads);
// Ordena por score descendente

detectHotLeads(prospectorId, (threshold = 80));
// Retorna leads com score > threshold
```

**Testes**: `backend/tests/services/leadScoringService.test.js`

- Unit tests para cada função
- Mock data com leads variados
- Meta: >70% cobertura
  **Commit**: `feat(backend): lead scoring engine`

#### Task 2.2: Criar Endpoint de Scoring (15 min)

**Arquivo**: `backend/src/routes/leadScoring.js`

```javascript
POST /api/prospector/score-lead
  - Params: { leadId, prospectorId }
  - Returns: { leadId, score, analysis, recommendation }

GET /api/prospector/top-leads
  - Query: ?prospectorId=X&limit=10
  - Returns: leads ordenados por score

POST /api/prospector/leads-batch-score
  - Params: { prospectorId, leadIds: [] }
  - Returns: { leadId, score }[]
```

**Validações**: requireAuth, prospectorId match
**Commit**: `feat(api): endpoints de lead scoring`

### **SPRINT 3: AI Recommendations (06:30 - 08:00)**

#### Task 3.1: Criar AIRecommendationService (45 min)

**Branch**: `feat/ai-recommendations`
**Arquivo**: `backend/src/services/aiRecommendationService.js`
**Funções**:

```javascript
generateNextActions(lead, prospectorHistory);
// Usa Gemini para sugerir: email, call, whatsapp, etc
// Retorna: { action, template, timeToSend }

predictConversion(lead, leadScore);
// Score de conversão: 0-100%
// Baseado em: score, histórico, padrões

suggestFollowUpSequence(lead);
// Recomenda: email→2h→call→24h→whatsapp
```

**Integração**: Google Gemini API
**Testes**: Unit tests + mock responses
**Commit**: `feat(backend): AI recommendations`

#### Task 3.2: Endpoint de Recomendações (15 min)

**Arquivo**: `backend/src/routes/aiRecommendations.js`

```javascript
POST /api/prospector/ai-recommendations
  - Params: { leadId, prospectorId }
  - Returns: { nextAction, message, confidence, conversionProb }
```

**Commit**: `feat(api): endpoint recomendações IA`

### **SPRINT 4: Frontend Integration (08:00 - 10:00)**

#### Task 4.1: LeadScoreCard Component (30 min)

**Arquivo**: `src/components/prospector/LeadScoreCard.tsx`

```typescript
Props:
- leadId: string
- score: number (0-100)
- analysis: string
- recommendation: string

Display:
- Circular progress (score%)
- Color coding: red (0-33), yellow (33-66), green (66-100)
- Badges: "Hot", "Warm", "Cold"
- Next action recommendation
```

**Commit**: `feat(ui): componente Lead Score Card`

#### Task 4.2: Integrar em CRM Kanban (30 min)

**Arquivo**: `src/components/prospector/crm-kanban.spec.ts`

- Adicionar LeadScoreCard em cada card
- Mostrar score ao abrir detalhes
- Integrar com API de scoring

**Commit**: `feat(ui): integrar lead scoring no kanban`

### **SPRINT 5: Testes E2E Completos (10:00 - 12:00)**

#### Task 5.1: Executar Suite Completa

```bash
npm test                                    # Unit tests
npx playwright test tests/e2e/smoke/       # Smoke (devem passar)
npx playwright test tests/e2e/prospector/  # Prospector (target: 80%+)
npx playwright test tests/e2e/provider/    # Provider (target: 50%+)
```

#### Task 5.2: Corrigir Falhas Restantes (2h)

- Debugar seletores com `--debug --headed`
- Adicionar waits conforme necessário
- Atualizar fixtures se preciso

### **SPRINT 6: Documentation & PR (12:00 - 13:00)**

#### Task 6.1: Atualizar DOCUMENTO_MESTRE

- Adicionar seção "Phase 4: Lead Scoring + AI Recommendations"
- Documentar novos endpoints
- Atualizar roadmap

#### Task 6.2: Abrir PR Consolidada

```
Title: "feat: phase 4 foundation - lead scoring + ai recommendations"

Checklist:
- [x] Lead Scoring Service (unit tests >70%)
- [x] AI Recommendations (Gemini integration)
- [x] 3 novos endpoints (protected)
- [x] LeadScoreCard component
- [x] E2E auth helper + seletores corrigidos
- [x] Testes E2E: 50+ passando
- [x] Linting: PASS
- [x] Build: PASS
- [x] Documentação: UPDATED
```

---

## 🔄 Padrão de Execução

### Por Sprint:

1. ✅ Git checkout -b feat/task-name
2. ✅ Implementar código
3. ✅ Criar testes (>45% cobertura)
4. ✅ `npm test` + `npm run build` + `npm run lint`
5. ✅ Git commit com padrão
6. ✅ Git push
7. ✅ Aguardar Gemini validar (E2E, arquitetura)

### Após Sprint 6:

- ✅ Abrir PR no GitHub
- ✅ Aguardar revisão Gemini
- ✅ Implementar feedbacks se houver
- ✅ Merge quando aprovado

---

## ⏱️ Timeline

| Sprint    | Tarefa                      | Tempo     | Status |
| --------- | --------------------------- | --------- | ------ |
| 1         | Auth Helper + CRM Seletores | 1:15h     | ⏳     |
| 2         | Lead Scoring Service        | 1:00h     | ⏳     |
| 3         | AI Recommendations          | 1:00h     | ⏳     |
| 4         | Frontend Integration        | 1:00h     | ⏳     |
| 5         | E2E Testing                 | 2:00h     | ⏳     |
| 6         | Documentation + PR          | 1:00h     | ⏳     |
| **TOTAL** | **24h de Trabalho**         | **7:15h** | ⏳     |

**Margem de Segurança**: 16:45h (para debugging, PR reviews, ajustes)

---

## 🎯 Success Criteria

✅ **Ao final das 24h:**

- [ ] 50+ testes E2E passando (target: 85%+)
- [ ] Lead Scoring implementado e testado
- [ ] AI Recommendations integrada com Gemini
- [ ] 3 novos endpoints produção-ready
- [ ] Frontend mostrando scores em tempo real
- [ ] PR aberta e pronta para revisão Gemini
- [ ] Documentação atualizada
- [ ] Zero erros de linting
- [ ] Build passa 100%
- [ ] Phase 4 Foundation pronta

---

## 🚀 Iniciando Execução

Próximo comando: Iniciar Sprint 1 (Auth Helper)

**Status**: 🟢 PRONTO PARA COMEÇAR
