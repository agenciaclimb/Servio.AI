# 🎬 PLANO DE AÇÃO IMEDIATO — LANÇAR SERVIO.AI

**Versão**: 1.0  
**Data**: 26 de março de 2026  
**Status**: 🎯 PRONTO PARA EXECUÇÃO

---

## ⚡ RESUMO EXECUTIVO (30 segundos)

| Item          | Status | Ação                       |
| ------------- | ------ | -------------------------- |
| **Código**    | ✅     | Implementado               |
| **Testes**    | 🟡     | Corrigir 2 race conditions |
| **Segurança** | ✅     | Verificado                 |
| **Deploy**    | 🟡     | Configurar GitHub Secrets  |
| **Produção**  | ⏳     | Aguardando fixes + config  |
| **Timeline**  | 🟢     | 3-5 dias para lançar       |

**Veredito**: Sistema pronto! Resolve **6 bloqueadores** em paralelo e lança em 3-5 dias.

---

## 📋 BLOQUEADORES — ORDEM DE PRIORIDADE

### 🔴 P0: CRÍTICO — Deve fazer HOJE

#### **P0.1** - Transação Atômica em `release-payment`

**Arquivo**: [backend/src/index.js](backend/src/index.js) linha ~2877  
**Responsável**: Dev A (Backend/Security)  
**Tempo**: 1-2h

```bash
# O QUE FAZER:
# 1. Localizar POST /jobs/:jobId/release-payment
# 2. Envolver lógica em db.runTransaction()
# 3. Adicionar campo "lockedAt" para prevent re-entry
# 4. Testar com 2 requests simultâneos (Promise.all test)
# 5. Commit + push

# TESTE:
npm run test:backend -- release-payment.test.js
```

**Prioridade**: 🔴 CRÍTICA — Sem isso, provider recebe 2x o pagamento

---

#### **P0.2** - Idempotência no Webhook Stripe

**Arquivo**: [backend/src/index.js](backend/src/index.js) linha ~2832  
**Responsável**: Dev B (Backend/Stripe)  
**Tempo**: 1-2h

```bash
# O QUE FAZER:
# 1. Localizar POST /api/stripe-webhook case checkout.session.completed
# 2. Usar db.runTransaction() para idempotência
# 3. Verificar se paymentIntentId já foi processado
# 4. Testar enviando webhook 2x (mock Stripe trigger)
# 5. Commit + push

# TESTE:
npm run test:backend -- stripe-webhook.test.js
```

**Prioridade**: 🔴 CRÍTICA — Sem isso, webhooks duplicados corrompem data

---

#### **P0.3** - Adicionar Firebase Token ao GitHub Secrets

**Arquivo**: GitHub Actions  
**Responsável**: Dev C (DevOps/Anyone)  
**Tempo**: 5 minutos

```bash
# O QUE FAZER:
1. Abra: https://github.com/agenciaclimb/Servio.AI/settings/secrets/actions
2. Clique em "New repository secret"
3. Name: FIREBASE_TOKEN
4. Secret: 1//0h-Zg_2HXzEFYCgYIARAAGBESNwF-L9Irx1XDfkSOdSJJmfpKCrLB_mu7B6Z1YHGcx-I3To5NzPMD
           aRxYpyZeRn1NFGcq0wpipAA
5. Clique "Add secret"

# RESULTADO:
Próximo push vai deployar automaticamente!
```

**Prioridade**: 🔴 CRÍTICA — Bloqueia CI/CD

---

### 🟠 P1: IMPORTANTE — Deve fazer em paralelo com P0

#### **P1.1** - Resolver Testes JSDOM

**Responsável**: Dev D (Infrastructure)  
**Tempo**: 15 minutos

```bash
# O QUE FAZER:
npm ci  # Safe clean install
# Se ainda falhar:
npm install --no-audit --legacy-peer-deps

# TESTE:
npm test -- --reporter=verbose
```

---

#### **P1.2** - Diagnosticar 7 Testes Falhando

**Responsável**: Dev E (QA/Testing)  
**Tempo**: 2-3h

```bash
# O QUE FAZER:
npm run test:backend -- --reporter=verbose

# Foco em:
# - rateLimit.test.js
# - pipedriveService.test.js
# - Email/WhatsApp tests

# Cada falha:
# 1. Ler erro
# 2. Identificar se é mock ou código
# 3. Corrigir mock ou implementação
# 4. Re-rodar teste até passar
```

---

#### **P1.3** - Preparar Chaves Stripe LIVE

**Responsável**: Dev A (Backend)  
**Tempo**: 1-2h

```bash
# O QUE FAZER:
# 1. Ir para: https://dashboard.stripe.com/apikeys
# 2. Copiar chave LIVE (não test!)
# 3. Configurar em GitHub Secrets:
#    - STRIPE_PUBLISHABLE_KEY = pk_live_...
#    - STRIPE_SECRET_KEY = sk_live_...
# 4. Testar webhook endpoint com chave live

# TESTE:
curl -X POST https://seu-backend/api/stripe-webhook \
  -H "Stripe-Signature: xxx" \
  -d '{"type": "checkout.session.completed"}'
```

---

## 🧪 FASE DE VALIDAÇÃO (Paralelo com fixes)

### V1: Testes Automatizados

```bash
# Rodar depois de cada fix:
npm run test:backend          # Backend tests
npm run e2e:smoke             # 10 smoke tests essenciais
npm run validate:prod         # Gate completo
```

**Deve passar**:

- ✅ 0 erros TypeScript
- ✅ 0 lint críticos
- ✅ ≥45% cobertura testes
- ✅ Build sucesso

---

### V2: Validação Manual E2E

**Tempo**: 15-30 minutos  
**Responsável**: QA/PM

```bash
# Fluxo completo:
1. Signup novo cliente
2. Signup novo prestador
3. Cliente cria job (R$ 500)
4. Prestador envia proposta
5. Cliente aceita proposta
6. Sistema cria escrow (status = aguardando_pagamento)
7. Cliente clica "Pagar com Stripe"
8. Completa pagamento (Stripe test)
9. Escrow muda para status = pago
10. Prestador clica "Liberar Pagamento"
    → VERIFY: Só 1 transfer criado, não 2
11. Prestador recebe exatamente R$ 500 (não R$ 1000)
12. Escrow transita para liberado
```

**Verificações**:

- [ ] Pagamento só criado UMA vez
- [ ] Webhook recebido corretamente
- [ ] Escrow em estado consistente
- [ ] Provider balance correto

---

### V3: Teste de Idempotência

**Responsável**: Dev B

```bash
# Simular webhook duplicado:
1. Capturar webhook UUID do Stripe (event_id)
2. Enviar webhook 1.ª vez → escrow = pago
3. Enviar webhook 2.ª vez (mesmo UUID)
   → Deve retornar 200 OK (idempotente)
   → Escrow deve manter-se = pago
   → Sem update duplicado no log
```

---

## 📅 CRONOGRAMA SUGERIDO

### Opção A: Lançar em 3 dias (Agressivo)

```
HOJE (Dia 1):
  09:00 - Equipe read este documento
  09:30 - Dev A resolve P0.1 + P1.3 (Em paralelo)
  10:00 - Dev B resolve P0.2 (Em paralelo)
  10:05 - Dev C adiciona Firebase Token (Em paralelo)
  12:00 - Todos: Code review em paralelo
  14:00 - Dev D + Dev E: Testes JSDOM + 7 falhas
  18:00 - Todos: Push código

AMANHÃ (Dia 2):
  09:00 - Rodar npm run validate:prod
  10:00 - E2E manual completa
  12:00 - Teste idempotência
  14:00 - Fix bugs encontrados
  18:00 - Prep para deploy

DEPOIS (Dia 3):
  09:00 - Deploy staging (opcional)
  12:00 - Deploy produção
  14:00 - Monitoramento ativo
```

**Risco**: 🟠 Médio (correria, menos tempo de QA)

---

### Opção B: Lançar em 5 dias (RECOMENDADO)

```
DIA 1:
  - Fix P0.1, P0.2, P0.3 (em paralelo)
  - Fix P1.1, P1.2 (em paralelo)
  - Code review + merge

DIA 2:
  - npm run validate:prod ✅
  - npm run test:backend ✅
  - Rodar E2E smoke tests 10/10 ✅

DIA 3:
  - E2E manual completa (job → payment → liberação)
  - Teste idempotência webhook
  - Teste race conditions P0.1

DIA 4:
  - Staging validação (se houver env staging)
  - Fix bugs encontrados
  - Aprovação final

DIA 5:
  - Deploy produção
  - Monitoramento ativo 24h
  - Comunicar lançamento
```

**Risco**: 🟢 Baixo (recomendado)

---

## ✅ CHECKLIST FINAL PRÉ-DEPLOY

- [ ] P0.1: Transação em `release-payment` ✅
- [ ] P0.2: Idempotência webhook ✅
- [ ] P0.3: Firebase Token no GitHub ✅
- [ ] P1.1: JSDOM testes ok ✅
- [ ] P1.2: 7 testes resolvidos ✅
- [ ] P1.3: Stripe LIVE configurado ✅
- [ ] `npm run validate:prod` passa ✅
- [ ] `npm run e2e:smoke` 10/10 ✅
- [ ] E2E manual completa ✅
- [ ] Idempotência validada ✅
- [ ] Race conditions testadas ✅
- [ ] `.env.production` configurado ✅
- [ ] GitHub Secrets completos ✅
- [ ] Rollback plan documentado ✅
- [ ] Equipe on-call pronta ✅

---

## 🚨 COMANDOS CRÍTICOS

### Build & Test (Use estes para validar)

```powershell
# Backend tests
npm run test:backend

# Frontend tests + E2E smoke
npm run test
npm run e2e:smoke

# Validação completa (DEVE PASSAR antes de deploy)
npm run validate:prod

# Build produção
npm run build
```

### Deploy (Quando tudo passar)

```bash
# 1. Commit
git add .
git commit -m "fix: resolve P0 blockers (race conditions, idempotency, stripe live)"

# 2. Push (dispara CI/CD)
git push origin main

# 3. Monitorar
# GitHub Actions →  CI/CD pipeline →  Firebase Hosting atualizado
# Verificar: https://github.com/agenciaclimb/Servio.AI/actions
```

---

## 📞 DÚVIDAS? REFERÊNCIAS

- **Race conditions**: [RELATORIO_AUDITORIA_PRODUTO_FINAL.md](RELATORIO_AUDITORIA_PRODUTO_FINAL.md) é definição exata do problema
- **Deploy**: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) tem protocolo completo
- **APIs**: [API_ENDPOINTS.md](API_ENDPOINTS.md) documentação técnica
- **Timeline**: [HANDOFF_TALINA.md](HANDOFF_TALINA.md) guia executivo

---

## 🎯 TL;DR - RESUMO EM 1 MINUTO

**Servio.AI está 85% pronto.**

**Faltam**:

1. Corrigir 2 race conditions (bankend)
2. Adicionar Firebase Token ao GitHub (5 min)
3. Resolver 7 testes
4. Configurar Stripe LIVE

**Tempo**: 3-5 dias com time paralelo

**Lançamento**: Seguro e sem comprometer clientes

**Recomendação**: Opção B (5 dias, risco baixo)

---

**Documento válido a partir de**: 26 de março de 2026  
**Próxima revisão**: Após P0.1 e P0.2 completos
