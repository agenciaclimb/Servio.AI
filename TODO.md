# ROADMAP QUALIDADE & ESTABILIDADE - SERVIO.AI

> **Meta Pré-Lançamento**: 40% Cobertura | **Meta Pós-Lançamento**: 100% Cobertura

**Status Atual**: 19.74% cobertura, 119/120 testes passando, 498 issues qualidade

---

## 🔴 FASE 1: ESTABILIZAÇÃO CRÍTICA (URGENTE - 4-6h)

**Objetivo**: Sistema 100% estável para lançamento

### 1.1 Fix Flaky Test (2h) - BLOCKER

- [ ] **AuctionRoomModal.test.tsx**: Corrigir timeout em "valida e envia lance menor"
  - Aumentar timeout: 5s → 10s
  - Melhorar mocks async (waitFor com condições específicas)
  - Validar: `npm test AuctionRoomModal` → 100% passing
  - **Meta**: 120/120 testes passando (100%)

### 1.2 Refatoração services/api.ts - Crítico (2-4h)

- [ ] **Anti-patterns**: Remover 43x `Promise.resolve()` wrapping desnecessário
  - Pattern atual: `return Promise.resolve(data)`
  - Pattern correto: `return data` (dentro de async function)
- [ ] **Error Handling**: Corrigir 15 blocos catch vazios
  - Adicionar logging: `console.error('Erro em [operação]:', error)`
  - Re-throw quando necessário: `throw new Error('Failed to...')`
- [ ] **Imports**: Remover `Escrow` não utilizado
- [ ] **Validar**: `npm run lint` → 498 → 150 issues (-70%)

**Checkpoint Fase 1**: 22% cobertura, 120/120 testes, 150 issues

---

## 🟠 FASE 2: EXPANSÃO API LAYER (8-10h)

**Objetivo**: services/api.ts 29% → 60% cobertura

### 2.1 Match & Proposal System (3h)

- [ ] **getMatchingProviders()** (8 testes)
  - Filtro por distância (5km, 10km, 50km)
  - Filtro por categoria (single, multiple)
  - Filtro por disponibilidade (horário, dias)
  - Edge case: sem matches, todos ocupados
- [ ] **submitProposal()** (4 testes)
  - Validação: preço mínimo, descrição obrigatória
  - Duplicatas: prevenir múltiplas propostas mesmo provider
  - Notificação: cliente recebe alert nova proposta
- [ ] **acceptProposal()** (3 testes)
  - Status job: "open" → "in_progress"
  - Pagamento: escrow criado com valor correto
  - Conflitos: rejeitar outras propostas automaticamente

### 2.2 Payment & Escrow (2h)

- [ ] **createEscrow()** (3 testes)
  - Valores: validação mínimo R$50, máximo R$50.000
  - Estados: "pending" → "released" → "completed"
  - Integração Stripe: payment_intent criado
- [ ] **completeJob()** (4 testes)
  - Liberação: pagamento transferido para provider
  - Disputa: bloqueio se disputa ativa
  - Review: obrigatória antes de completar

### 2.3 Webhooks & Background (3h)

- [ ] **handleStripeWebhook()** (5 testes)
  - Evento: payment_intent.succeeded
  - Evento: payment_intent.payment_failed
  - Evento: account.updated (Connect)
  - Segurança: validar signature Stripe
  - Idempotência: prevenir duplicação
- [ ] **processScheduledJobs()** (3 testes)
  - Notificações: envio diário resumo jobs
  - Expiração: jobs sem proposta > 7 dias
  - Auto-match: sugerir providers próximos

### 2.4 Edge Cases (2h)

- [ ] **Network Failures** (4 testes)
  - Timeout: retry com exponential backoff
  - 500 errors: fallback para mock data
  - Rate limiting: queue de requisições
- [ ] **Concurrent Operations** (3 testes)
  - Race condition: aceitar proposta simultânea
  - Optimistic locking: versioning de documents

**Checkpoint Fase 2**: 30% cobertura, 130/130 testes, 120 issues

---

## 🟠 FASE 3: COMPONENTES CORE (6-8h)

**Objetivo**: Components críticos 0% → 50%+

### 3.1 Dashboard Components (4h)

- [ ] **ClientDashboard.tsx** (6 testes)
  - Navegação: tabs (active, completed, disputes)
  - Estados: loading, empty, error
  - Filtros: categoria, data, status
- [ ] **ProviderDashboard.tsx** (8 testes)
  - Leilão: envio lance, validação mínimo
  - Propostas: criar, editar, cancelar
  - Earnings: cálculo correto, histórico
- [ ] **AdminDashboard.tsx** (5 testes)
  - Analytics: métricas corretas, filtros período
  - Moderação: suspender usuário, resolver disputa
  - Usuários: listagem, busca, paginação

### 3.2 Modal & Forms (3h)

- [ ] **CreateJobModal.tsx** (5 testes)
  - Validação: todos campos obrigatórios
  - Geo: autocomplete endereço, validação
  - Submit: loading state, success/error
- [ ] **DisputeModal.tsx** (4 testes)
  - Evidências: upload imagens (max 5MB)
  - Resolução: texto obrigatório mínimo 50 chars
  - Submit: notificação ambas partes
- [ ] **ReviewModal.tsx** (3 testes)
  - Rating: validação 1-5 estrelas
  - Comentário: opcional, max 500 chars
  - Submit: atualização profile provider

### 3.3 Auth & Onboarding (2h)

- [ ] **ProviderOnboarding.tsx** (expandir 4→10 testes)
  - Todas 5 etapas: welcome → profile → docs → payment → finish
  - Navegação: avançar/voltar, skip disabled
  - Validação: cada etapa obrigatória
- [ ] **ProfilePage.tsx** (4 testes)
  - Edição: update campos, save button
  - Upload: foto perfil, validação formato/tamanho
  - Validação: email único, telefone formato

**Checkpoint Fase 3**: 42% cobertura, 150/150 testes, 80 issues

**🎯 META PRÉ-LANÇAMENTO ATINGIDA: 40%+ cobertura, 150 testes, sistema estável**

---

## 🟡 FASE 4: BACKEND 100% (Pós-Lançamento - 15-20h)

### 4.1 Admin Operations (5h)

- [ ] **adminMetrics.ts**: Expandir para 100% (fraud detection, trends, forecasting)
- [ ] **User Management**: Suspensão, verificação KYC, histórico ações
- [ ] **Impacto**: +8pp cobertura

### 4.2 Advanced Features (5h)

- [ ] **aiSchedulingService.ts**: ML predictions, availability matching
- [ ] **geminiService.ts**: Prompt testing, context management, retry logic
- [ ] **Impacto**: +6pp cobertura

### 4.3 Integration Layer (5h)

- [ ] **Stripe Connect**: Onboarding completo, transfers, refunds
- [ ] **Firebase Storage**: Upload/download, permissões, metadata
- [ ] **Maps API**: Geocoding, directions, distance matrix
- [ ] **Impacto**: +8pp cobertura

**Checkpoint Fase 4**: 60% cobertura, 180/180 testes

---

## 🟡 FASE 5: FRONTEND 100% (Pós-Lançamento - 20-25h)

### 5.1 All Dashboards 100% (8h)

- [ ] Todos cenários de cada dashboard
- [ ] Estados loading/error/empty
- [ ] Interações complexas (drag-drop, filtros avançados)
- [ ] **Impacto**: +10pp cobertura

### 5.2 All Modals & Forms 100% (6h)

- [ ] Validação completa de todos campos
- [ ] Estados submit (loading, success, error)
- [ ] File uploads, image preview
- [ ] **Impacto**: +6pp cobertura

### 5.3 Pages & Navigation (6h)

- [ ] Landing pages: Hero, Categories, About, Terms
- [ ] Routing: guards, redirects, 404
- [ ] SEO: meta tags, structured data
- [ ] **Impacto**: +8pp cobertura

**Checkpoint Fase 5**: 85% cobertura, 220/220 testes

---

## 🟢 FASE 6: E2E & EXCELÊNCIA (Pós-Lançamento - 10-15h)

### 6.1 Cypress E2E Suite (8h)

- [ ] **User Journeys**: signup → job → proposal → payment → review
- [ ] **Cross-browser**: Chrome, Firefox, Safari
- [ ] **Mobile**: viewport testing, touch events
- [ ] **Impacto**: Estabilidade produção

### 6.2 Performance & Load (4h)

- [ ] **Lighthouse CI**: Integrado no pipeline, score mínimo 80
- [ ] **Load Testing**: k6 com 1000+ usuários simultâneos
- [ ] **Memory Leaks**: Detection com Chrome DevTools
- [ ] **Impacto**: Escalabilidade

### 6.3 Security & Penetration (3h)

- [ ] **OWASP Top 10**: Validation completa
- [ ] **Firestore Rules**: Comprehensive testing
- [ ] **Rate Limiting**: DDoS protection, brute-force
- [ ] **Impacto**: Segurança Grade A+

**🏆 META FINAL: 100% cobertura, 250/250 testes, 0 issues, Performance 80+**

---

## 📊 MÉTRICAS DE PROGRESSO

| Fase               | Cobertura | Issues   | Tests    | Status            |
| ------------------ | --------- | -------- | -------- | ----------------- |
| **Atual**          | 19.74%    | 498      | 119/120  | 🟡 Em Progresso   |
| Fase 1             | 22%       | 150      | 120/120  | ⏳ Próximo        |
| Fase 2             | 30%       | 120      | 130/130  | ⏳ Planejado      |
| Fase 3             | 42%       | 80       | 150/150  | ⏳ Planejado      |
| **PRÉ-LANÇAMENTO** | **40%+**  | **<100** | **150+** | 🎯 **META**       |
| Fase 4             | 60%       | 40       | 180/180  | 📅 Pós-Lançamento |
| Fase 5             | 85%       | 10       | 220/220  | 📅 Pós-Lançamento |
| Fase 6             | 100%      | 0        | 250/250  | 📅 Pós-Lançamento |

---

## ⏱️ CRONOGRAMA

**PRÉ-LANÇAMENTO (Esta Semana - 18-24h total):**

- **Dia 1-2**: Fase 1 (Estabilização) + Início Fase 2
- **Dia 3-4**: Fase 2 (API Coverage) + Início Fase 3
- **Dia 5**: Fase 3 (Components) + Review & Deploy
- **🚀 GO-LIVE**: Fim Semana 1

**PÓS-LANÇAMENTO (Sprints 1-3 - 45-60h total):**

- **Sprint 1** (Semanas 2-3): Fase 4 (Backend 100%)
- **Sprint 2** (Semanas 4-5): Fase 5 (Frontend 100%)
- **Sprint 3** (Semanas 6-7): Fase 6 (E2E, Performance, Security)
- **🏆 100% COVERAGE**: Fim Semana 7

---

## 🔴 Crítico (Antes de Produção)

### Backend - Pagamentos

- **Stripe Payout/Transfer Implementation**
  - **Arquivo**: `backend/src/index.js:136`
  - **Descrição**: Implementar transferência real para conta conectada do prestador via Stripe
  - **Status**: ✅ Concluído - Lógica implementada com `stripe.transfers.create()`
  - **Impacto**: Alto - necessário para liberação de pagamentos real
  - **Referência**: [Stripe Connect Documentation](https://stripe.com/docs/connect)

## 🟡 Importante (v1.1)

### Frontend - Admin

- **Suspend Provider Logic**
  - **Arquivo**: `doc/FraudAlertModal.tsx:37`
  - **Descrição**: Implementar lógica de suspensão de prestador após alerta de fraude
  - **Status**: Placeholder com alert
  - **Impacto**: Médio - segurança da plataforma

### Testes

- **Expandir Cobertura de Testes**
  - **Cobertura Atual**: Backend 38%, Frontend ~0%
  - **Meta**: Backend 70%+, Frontend 50%+
  - **Foco**: Jobs CRUD, Disputes, File Upload, Stripe webhooks

## 🟢 Desejável (Futuro)

### Documentação

- **API Documentation**
  - Gerar documentação Swagger/OpenAPI para todos os endpoints
  - Adicionar exemplos de requests/responses

### Monitoramento

- **Logging Estruturado**
  - Implementar Winston ou Pino para logs estruturados
  - Integrar com Google Cloud Logging

### Performance

- **Caching Strategy**
  - Implementar cache Redis para queries frequentes
  - Cache de perfis de usuário e catálogo de serviços

## 📋 Próximas Versões

Ver `doc/PLANO_POS_MVP_v1.1.md` para roadmap completo.

---

**Última atualização**: 31/10/2025 21:05
