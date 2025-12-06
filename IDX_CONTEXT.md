# SERVIO.AI - Contexto para Google IDX + Gemini

## 📋 Resumo Executivo

**Servio.AI** é um marketplace production-ready conectando clientes com prestadores de serviços, com IA integrada (Gemini), pagamentos (Stripe), e automação (Cloud Scheduler).

**Status**: 🟢 LIVE | **Versão**: 3.0.0 (Fase 3) | **Deploy**: Cloud Run + Firebase Hosting

---

## 🏗️ Stack Técnico

### Frontend

- **React 18 + TypeScript + Vite**
- **Firebase Auth** (email/password)
- **Firestore** (real-time DB)
- **Hosting**: Firebase (gen-lang-client-0737507616.web.app)

### Backend

- **Node.js 18 + Express**
- **Firebase Admin SDK** (Firestore, Storage, Auth)
- **Stripe** (payments, Connect)
- **Google Gemini** (AI)
- **Cloud Run** (us-west1): https://servio-backend-v2-1000250760228.us-west1.run.app
- **Port**: 8081

### Infraestrutura

- **Database**: Firestore (collections: users, jobs, proposals, prospector_prospects, email_events, etc.)
- **Storage**: Google Cloud Storage
- **Payments**: Stripe (test + live modes)
- **Scheduler**: Google Cloud Scheduler (5 jobs, every 4h-7d)
- **Project GCP**: gen-lang-client-0737507616

---

## 📁 Estrutura Principal

```
/
├── src/                           # Frontend React
│   ├── App.tsx                   # Routing + Auth Context
│   ├── components/               # React components
│   │   ├── ClientDashboard.tsx   # Cliente (buyer)
│   │   ├── ProviderDashboard.tsx # Prestador (service provider)
│   │   ├── AdminPanel.tsx        # Admin
│   │   ├── MetricsPageDashboard.tsx # Analytics (Fase 3)
│   │   └── prospector/           # Prospecção
│   ├── types.ts                  # Interfaces centralizadas
│   └── services/                 # API calls
│
├── backend/src/                   # Backend Express
│   ├── index.js                  # App principal (4010 linhas, 138 rotas)
│   ├── authorizationMiddleware.js # Autenticação/autorização
│   ├── routes/
│   │   ├── scheduler.js          # Cloud Scheduler handlers
│   │   ├── analytics.js          # Analytics endpoints
│   │   ├── whatsapp.js           # WhatsApp messaging
│   │   └── whatsappMultiRole.js  # Multi-role WhatsApp
│   ├── services/
│   │   ├── analyticsService.js   # Aggregação de dados
│   │   ├── outreachScheduler.js  # Follow-ups automáticos
│   │   ├── geminiService.js      # Google Gemini AI
│   │   ├── gmailService.js       # Gmail integration
│   │   └── whatsappService.js    # WhatsApp Business API
│   ├── stripeConfig.js           # Stripe safe initialization
│   ├── dbWrapper.js              # Firestore wrapper com fallback
│   └── Dockerfile                # Build Node.js 18-alpine
│
├── firestore.rules               # Segurança no BD (218 linhas)
├── storage.rules                 # Autorização de uploads
├── .github/workflows/ci.yml      # CI/CD (TypeScript, tests, build, deploy)
└── package.json                  # Scripts: dev, build, test, deploy
```

---

## 🔑 Padrões & Convenções Críticas

### 1. **Email como ID de Usuário** ⚠️

```javascript
// CORRETO: Usar email como document ID
db.collection('users').doc('user@example.com');

// ERRADO: Usar Firebase Auth UID
db.collection('users').doc(auth.currentUser.uid); // ❌
```

### 2. **User Types** (português)

```typescript
type UserType = 'cliente' | 'prestador' | 'admin' | 'prospector';
// Em Firestore: user.type = 'cliente' (lowercase, português)
```

### 3. **Job Statuses** (português)

```javascript
'ativo' | 'suspenso' | 'concluido' | 'cancelado' | 'em_progresso';
```

### 4. **Middleware de Autenticação**

```javascript
// Todos os endpoints protegidos usam requireAuth
app.post('/api/endpoint', requireAuth, async (req, res) => {
  const email = req.auth.email;
  const user = await db.collection('users').doc(email).get();
});
```

### 5. **Dependency Injection** (Backend)

```javascript
// Permite testar com mocks
function createApp({ db, storage, stripe }) { ... }
const app = createApp(); // Default instance
```

---

## 🚀 Endpoints Principais (138 rotas)

### Prospecção (Phase 2/3)

- `POST /api/prospector/import-leads` → Bulk import com deduplicação
- `POST /api/prospector/enrich-lead` → Google Places + Gemini AI
- `POST /api/prospector/send-campaign` → Email + WhatsApp multicanal
- `GET /api/prospector/campaigns` → Histórico de campanhas

### Scheduler (Phase 3)

- `POST /api/scheduler/follow-ups` → Follow-ups automáticos (4h)
- `POST /api/scheduler/email-reminders` → Reminders (24h)
- `POST /api/scheduler/analytics-rollup` → Agregação diária (midnight)
- `POST /api/scheduler/campaign-performance` → Métricas (6h)
- `POST /api/scheduler/cleanup` → Limpeza (weekly)

### Analytics (Phase 3)

- `GET /api/analytics/metrics-timeline` → KPIs timeline
- `GET /api/analytics/campaign-performance` → Performance por campanha
- `GET /api/analytics/channel-performance` → Email vs WhatsApp

### Pagamentos

- `POST /create-checkout-session` → Stripe checkout
- `POST /api/stripe-webhook` → Webhook de pagamentos
- `POST /api/stripe/create-connect-account` → Onboarding prestador

### Chat & Comunicação

- `POST /api/whatsapp/send` → Envio WhatsApp
- `POST /api/omni/webhook/*` → Omnichannel (WhatsApp, Instagram, Facebook)

### Admin

- `GET /api/admin/users` → Listar usuários
- `GET /api/admin/jobs` → Listar trabalhos
- `POST /api/admin/suspend-user` → Suspender usuário

---

## 📊 Collections Firestore

| Collection             | Doc ID                  | Campos Principais                                        |
| ---------------------- | ----------------------- | -------------------------------------------------------- |
| `users`                | email                   | type, name, phone, avatar, verificationStatus, stripeId, |
| `jobs`                 | auto                    | clientId, providerId, title, status, budget, deadline,   |
| `proposals`            | auto                    | jobId, proposalId, status, offeredPrice,                 |
| `prospector_prospects` | {prospectorId}\_{phone} | name, phone, email, enrichedData, status,                |
| `prospector_campaigns` | auto                    | prospectorId, channels, status, results,                 |
| `email_events`         | auto                    | messageId, event, timestamp, leadEmail,                  |
| `prospector_outreach`  | auto                    | status, prospectorId, followUpEligibleAt,                |
| `analytics_daily`      | YYYY-MM-DD              | metrics, campaigns, channels,                            |

---

## 🔐 Segurança & Secrets

**Cloud Run Secrets** (Secret Manager):

- `GOOGLE_PLACES_API_KEY` → Google Places API
- `SENDGRID_API_KEY` → Email via SendGrid
- `STRIPE_SECRET_KEY` → Pagamentos

**Env Vars**:

- `NODE_ENV=production` (Cloud Run)
- `GEMINI_API_KEY` (backend, Cloud Run)
- `PORT=8081` (Cloud Run)
- `VITE_STRIPE_PUBLISHABLE_KEY` (frontend)
- `VITE_FIREBASE_*` (frontend config)

---

## 🧪 Testes & CI/CD

### Local Development

```bash
npm run dev              # Frontend on :5173
cd backend && npm start  # Backend on :8081

npm test                 # Unit tests + coverage
npm run e2e:smoke       # 10 critical smoke tests
```

### CI/CD Pipeline (.github/workflows/ci.yml)

1. **Lint** → ESLint com max-warnings=1000
2. **TypeScript** → Verificação de tipos
3. **Tests** → Vitest + React Testing Library (coverage >45%)
4. **Build** → Vite bundle
5. **E2E Smoke** → Playwright (10 testes críticos)
6. **Deploy** → Firebase (frontend) + Cloud Run (backend)

---

## 📈 Fase 3 - Cloud Scheduler + Analytics (CURRENT)

### 5 Jobs Automáticos

```
prospector-follow-ups-v3         → 0 */4 * * *     (Follow-ups)
prospector-email-reminders-v3    → 0 9 * * *      (Reminders 9AM)
prospector-analytics-daily-v3    → 0 0 * * *      (Midnight rollup)
prospector-campaign-metrics-v3   → 0 6,12,18 * * * (6h interval)
prospector-cleanup-v3            → 0 3 * * 0      (Sunday 3AM)
```

**Auth**: Cloud Scheduler usa OIDC token → Cloud Run valida automaticamente.

### Analytics Dashboard

- `MetricsPageDashboard.tsx` → Rota `/metrics`
- Dados: Campaign performance, channel effectiveness, lead scoring
- Real-time via Firestore listeners

---

## ✅ Status Fase 3 - COMPLETO E FUNCIONAL

**Deploy**: Revisão `servio-backend-v2-00022-4bb` LIVE (Cloud Run us-west1)  
**Scheduler Jobs**: 5/5 ENABLED e funcionando  
**Endpoints**: `POST /api/scheduler/*` retornando 200 OK com OIDC auth  
**Analytics**: Dashboard integrado em `/metrics`  
**Automation**: 5 jobs rodando 24/7 conforme schedule

### Jobs Ativos em Produção

```
✅ prospector-follow-ups-v3       → 0 */4 * * *     (A cada 4h)
✅ prospector-email-reminders-v3  → 0 9 * * *      (Diárias 9h)
✅ prospector-analytics-daily-v3  → 0 0 * * *      (Midnight)
✅ prospector-campaign-metrics-v3 → 0 6,12,18 * * * (6h)
✅ prospector-cleanup-v3          → 0 3 * * 0      (Dom 3h)
```

**Autenticação**: Cloud Scheduler OIDC → Cloud Run valida automaticamente ✅

---

## 🎯 Arquivos Críticos para Editar

| Arquivo                                  | Propósito                | Linhas |
| ---------------------------------------- | ------------------------ | ------ |
| `backend/src/index.js`                   | All routes + middleware  | 4010   |
| `src/App.tsx`                            | Frontend routing + auth  | 150+   |
| `src/types.ts`                           | Interfaces centralizadas | 200+   |
| `firestore.rules`                        | DB security rules        | 218    |
| `backend/src/authorizationMiddleware.js` | Auth logic               | 100+   |
| `.github/workflows/ci.yml`               | CI/CD pipeline           | 150+   |

---

## 🚨 Common Gotchas

1. **Email vs UID**: Sempre usar `email` como Firestore doc ID
2. **Português**: Database enums em português (`'cliente'`, `'concluido'`)
3. **Mocks em testes**: Implementar chain completo (collection → doc → get/set/update)
4. **Env vars**: `VITE_*` no frontend (Vite substitui), vars normais no backend
5. **Async no Cloud Run**: Sempre await + error handling
6. **Rate limiting**: SendGrid + WhatsApp têm limites (vide código)

---

## 📞 Support Info

- **GCP Project**: gen-lang-client-0737507616
- **Firebase Project**: gen-lang-client-0737507616
- **Stripe Dashboard**: (test mode)
- **Cloud Run**: us-west1
- **Frontend URL**: https://gen-lang-client-0737507616.web.app
- **Backend URL**: https://servio-backend-v2-1000250760228.us-west1.run.app

---

## 🔗 Documentação Interna

- `DOCUMENTO_MESTRE_SERVIO_AI.md` → Autoridade técnica
- `STRIPE_GUIA_RAPIDO.md` → Payment integration
- `CLOUD_SCHEDULER_SETUP.md` → Scheduler config
- `API_ENDPOINTS.md` → Full endpoint list
- `COMANDOS_UTEIS.md` → Common commands

---

## 🔄 Workflow Git Automatizado

### Para Você (Gemini):

**Após editar arquivos, SEMPRE informe:**

```
✅ Arquivos modificados com sucesso!

📝 Mudanças:
- [listar arquivos]

🚀 AÇÃO NECESSÁRIA:
Execute no terminal do IDX:

git add .
git commit -m "feat: [descrever mudanças]"
git push origin main
```

### Para o Desenvolvedor:

**Scripts disponíveis (PowerShell local):**

```powershell
# Auto sync completo (100% automático)
.\sync-servio.ps1 -Mode Auto

# Ou use aliases (após carregar sync-aliases.ps1):
sa                # Auto sync
sp                # Pull apenas
sps "mensagem"    # Push com mensagem
st                # Status
```

**Veja arquivos:**

- `GEMINI_IDX_INSTRUCTIONS.md` → Instruções completas para Gemini
- `WORKFLOW_GIT.md` → Guia completo do workflow
- `sync-servio.ps1` → Script de automação
- `sync-aliases.ps1` → Aliases rápidos

---

**Última Atualização**: 05/12/2025 20:30 BRT (Fase 3 ✅ Completa + Automação Git implementada)  
**Status**: 🟢 PRODUCTION READY | 5 Cloud Scheduler jobs ativos | Analytics Dashboard live  
**Próximas Iterações**: Phase 4 (AI Autopilot + Marketplace Matching)
