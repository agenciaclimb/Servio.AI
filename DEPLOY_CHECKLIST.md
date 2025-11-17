# 🚀 Deploy Checklist - Servio.AI

## 📋 Checklist Pré-Deploy

### 1. ✅ Validação de Código

- [ ] **Testes unitários**: `npm test` → 261/261 passando
- [ ] **Build produção**: `npm run build` → Sem erros
- [ ] **TypeScript**: `npm run typecheck` → Sem erros
- [ ] **Linting**: `npm run lint` → Sem erros críticos
- [ ] **Smoke Tests E2E**: `npm run e2e:smoke` → 10/10 passando

### 2. ✅ Qualidade e Performance

- [ ] **Cobertura de testes**: >40% (atual: 48.36%)
- [ ] **SonarCloud**: Sem bugs BLOCKER/CRITICAL
- [ ] **Bundle size**: <300KB gzipped (atual: ~200KB)
- [ ] **Lighthouse**: Performance >60, Accessibility >90
- [ ] **Vulnerabilidades**: 0 (verificar com `npm audit`)

### 3. ✅ Configuração de Ambiente

#### Firebase (Produção)

- [ ] **Authentication**: Providers configurados (Google, Email/Password)
- [ ] **Firestore**: Rules de produção aplicadas
- [ ] **Storage**: Rules de produção aplicadas
- [ ] **Hosting**: Domínio custom configurado
- [ ] **Functions**: Deployed e funcionando

#### Variáveis de Ambiente (`.env.production`)

```bash
# Firebase
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=servio-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=servio-ai
VITE_FIREBASE_STORAGE_BUCKET=servio-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MEASUREMENT_ID=xxx

# Cloud Run Backend
VITE_BACKEND_URL=https://servio-backend-HASH-uw.a.run.app
VITE_AI_SERVICE_URL=https://servio-ai-HASH-uw.a.run.app

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Feature Flags
VITE_USE_MOCK_DATA=false
VITE_ENABLE_ANALYTICS=true
```

#### Google Cloud Run

- [ ] **servio-backend**: Deployed e saudável
- [ ] **servio-ai**: Deployed e saudável
- [ ] **IAM configurado**: Service accounts com permissões corretas
- [ ] **Secrets Manager**: API keys configuradas
- [ ] **Cloud SQL**: Conexão configurada (se aplicável)

#### Stripe

- [x] **Chaves configuradas**: ✅ **CONFIGURADAS**
  - Frontend: `VITE_STRIPE_PUBLISHABLE_KEY` em `.env.local` (test mode)
  - Backend: `STRIPE_SECRET_KEY` no Cloud Run
  - Validado via script `.\scripts\validate_stripe.ps1`
- [x] **Webhook endpoint**: ✅ **FUNCIONANDO** - URL: `https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook`
  - Status: Protegido (rejeita requisições sem assinatura)
  - Validado com `stripe trigger checkout.session.completed`
- [x] **Eventos habilitados**:
  - `checkout.session.completed` (crítico) ✅
  - `payment_intent.succeeded` ✅
  - `payment_intent.created` ✅
  - `charge.updated` ✅
- [x] **Signing Secret**: Configurado no Cloud Run como `STRIPE_WEBHOOK_SECRET` ✅
  - Verificado via `/diag/stripe-webhook-secret` → `{"configured": true}`
- [ ] **Stripe Connect**: Configurar no Dashboard (https://dashboard.stripe.com/test/connect/accounts/overview)
  - Adicionar Redirect URIs
  - Habilitar Standard account type
- [ ] **Webhook no Dashboard**: Verificar configuração em https://dashboard.stripe.com/test/webhooks
- [ ] **Teste E2E**: Executar fluxo completo (job → proposta → pagamento → escrow)
- [ ] **Produtos**: Criados no dashboard (opcional - criamos sessões dinamicamente)
- [ ] **Chaves Live**: Trocar para produção quando pronto (pk*live*, sk*live*)

### 4. ✅ Monitoramento e Logging

- [ ] **Google Cloud Monitoring**: Alertas configurados
  - Uptime checks
  - Error rate > 5%
  - Latency p95 > 2s
  - CPU > 80%
  - Memory > 80%

- [ ] **Firebase Analytics**: Eventos principais configurados
  - `user_signup`
  - `job_created`
  - `proposal_sent`
  - `payment_completed`
  - `job_completed`

- [ ] **Error Tracking**: Sentry/Firebase Crashlytics configurado

### 5. ✅ Segurança

- [ ] **HTTPS**: Forçado em todas as rotas
- [ ] **CORS**: Configurado corretamente no backend
- [ ] **Rate Limiting**: Implementado no Cloud Run
- [ ] **API Keys**: Rotacionadas recentemente
- [ ] **Firestore Rules**: Testadas e validadas
- [ ] **CSP Headers**: Content Security Policy configurado
- [ ] **Secrets**: Não commitados no repositório

### 6. ✅ Backup e Rollback

- [ ] **Backup Firestore**: Agendado (diário)
- [ ] **Backup Storage**: Configurado
- [ ] **Tag de versão**: Criada no Git (`git tag v1.0.0`)
- [ ] **Rollback testado**: Procedimento documentado
- [ ] **Build anterior**: Armazenado e acessível

---

## 🚀 Procedimento de Deploy

### Ambiente Staging

```bash
# 1. Atualizar dependências
npm ci

# 2. Rodar todos os testes
npm run test:all

# 3. Build de staging
npm run build -- --mode staging

# 4. Deploy para Firebase Hosting (staging)
firebase deploy --only hosting:staging

# 5. Rodar smoke tests contra staging
PLAYWRIGHT_BASE_URL=https://staging.servio.ai npm run e2e:smoke

# 6. Validação manual (15 minutos)
# - Login cliente e prestador
# - Criar job
# - Enviar proposta
# - Processar pagamento (sandbox)
```

### Ambiente Produção

```bash
# 1. Confirmar staging OK
# ✅ Smoke tests passando
# ✅ Sem erros críticos
# ✅ Performance aceitável

# 2. Build de produção
npm run build

# 3. Deploy gradual (Canary)
# Fase 1: 10% do tráfego
firebase deploy --only hosting --rollout-percentage 10

# Aguardar 30 minutos e monitorar métricas
# - Error rate
# - Latency
# - User feedback

# Fase 2: 50% do tráfego
firebase deploy --only hosting --rollout-percentage 50

# Aguardar 30 minutos

# Fase 3: 100% do tráfego
firebase deploy --only hosting

# 4. Deploy backend (se houver mudanças)
cd backend
gcloud run deploy servio-backend \
  --source . \
  --region us-west2 \
  --allow-unauthenticated

# 5. Validação pós-deploy
npm run e2e:smoke
```

---

## 🔄 Procedimento de Rollback

### Rollback Imediato (< 5 minutos)

```bash
# 1. Firebase Hosting
firebase hosting:channel:deploy rollback
# OU
firebase rollback hosting

# 2. Cloud Run (se necessário)
gcloud run services update-traffic servio-backend \
  --to-revisions=servio-backend-PREVIOUS=100 \
  --region us-west2

# 3. Validar rollback
curl https://servio.ai/health
```

### Rollback Completo (< 15 minutos)

```bash
# 1. Checkout versão anterior
git checkout v1.0.0

# 2. Rebuild
npm ci
npm run build

# 3. Deploy versão anterior
firebase deploy --only hosting

# 4. Notificar equipe
# - Slack/Teams
# - Status page
# - Email usuários críticos (se necessário)

# 5. Investigar causa raiz
# - Logs do Cloud Run
# - Firebase Analytics
# - Error tracking
```

---

## 📊 Métricas de Sucesso

### Imediato (Primeiras 24h)

- ✅ Error rate < 1%
- ✅ Latency p95 < 2s
- ✅ Uptime > 99.5%
- ✅ 0 incidents críticos
- ✅ User feedback positivo

### Curto Prazo (Primeira semana)

- ✅ 100+ jobs criados
- ✅ 50+ propostas enviadas
- ✅ 20+ pagamentos processados
- ✅ Rating médio > 4.0
- ✅ Churn rate < 5%

### Médio Prazo (Primeiro mês)

- ✅ 1000+ usuários ativos
- ✅ 500+ jobs completados
- ✅ R$ 50.000+ em GMV
- ✅ NPS > 50
- ✅ Uptime > 99.9%

---

## 🚨 Contatos de Emergência

- **Tech Lead**: [nome@email.com]
- **DevOps**: [nome@email.com]
- **Product Owner**: [nome@email.com]
- **On-call**: [número de plantão]

## 📚 Links Úteis

- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [SonarCloud](https://sonarcloud.io/project/overview?id=agenciaclimb_Servio.AI)
- [Monitoring Dashboard](https://console.cloud.google.com/monitoring)

---

**Última atualização**: 13/11/2025
**Versão do documento**: 1.0
**Responsável**: Time de Engenharia Servio.AI
