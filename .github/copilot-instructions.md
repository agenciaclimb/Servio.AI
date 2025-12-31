# Servio.AI — Copilot Instructions

## Idioma / Language

- **Comunicação**: Sempre responda em **português brasileiro** ao interagir com a equipe. Use português em comentários de código, mensagens de commit, documentação e PRs.
- **Código**: Mantenha nomes de variáveis, funções e componentes em **inglês** (padrão da indústria), mas enums de domínio e strings de interface devem estar em **português** (ver seção Core Conventions).
- **Documentação técnica**: Markdown files (README, CHANGELOG, etc.) devem estar em português, exceto quando forem referências de API para audiência internacional.

## Big Picture

- **Marketplace app**: React 18 + TypeScript + Vite frontend, Express + Firestore backend, Stripe payments, Gemini AI features. Production/live; email is the Firestore document ID everywhere (legacy, migration to uid in progress).
- **Frontend structure**: [App.tsx](App.tsx) uses React Router + lazy loading + Suspense for 4 main dashboards (admin, client, provider, prospector). Components in [components/](components/), business logic in [services/](services/), hooks in [hooks/](hooks/), contexts in [contexts/](contexts/).
- **Backend architecture**: Constructed via `createApp({ db, storage, stripe, genAI, rateLimitConfig })` in [backend/src/index.js](backend/src/index.js) (~4400 linhas). Routes segregated by entity in [backend/src/routes/](backend/src/routes/) (jobs.js, users.js, payments.js, etc.). Always inject mocks in tests instead of importing a singleton app.
- **Auth pattern**: Ownership checks use `request.auth.token.email` (see [firestore.rules](firestore.rules) lines 26-40); document IDs remain emails even though `uid` exists as a field. Custom claims (`role`) set by Cloud Function avoid Firestore reads—authorization is immutable via JWT token.

## Core Conventions

- **Portuguese enums**: Part of the API contract—never translate: job status `'aberto'|'em_progresso'|'concluido'|'cancelado'`; user status `'ativo'|'suspenso'`; user types `'cliente'|'prestador'|'admin'|'prospector'` (see [types.ts](types.ts) lines 1-6).
- **Firestore mock pattern**: Chain `collection → doc → get/set/update`, plus `where/orderBy/limit/get` returning `this` for fluent API. Mock structure (see [backend/tests/jobs.test.js](backend/tests/jobs.test.js)):
  ```javascript
  mockDb = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'doc' }) }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  const app = createApp({ db: mockDb, stripe: null, genAI: null });
  ```
- **Firebase lazy load**: Only `auth` + `db` eager-loaded; `storage`/`analytics` fetched via async getters in [firebaseConfig.ts](firebaseConfig.ts) to reduce bundle size (~0.69MB gzipped).
- **Code splitting**: Dashboards use React `lazy()` + Suspense in [App.tsx](App.tsx); manual chunks in [vite.config.ts](vite.config.ts) split `'react-vendor'`, `'firebase-vendor'` (critical path: auth + firestore only). Dashboard chunks lazy-loaded per role.

## Security Stack (Task 4.6)

- **Middleware layers** (in [backend/src/index.js](backend/src/index.js)): Helmet + CSP headers, XSS filters (`sanitizeInput`/`sanitizeQuery`), express-rate-limit with 5 tiers (`globalLimiter`, `authLimiter`, `apiLimiter`, `paymentLimiter`, `webhookLimiter`), CSRF protection via `/api/csrf-token`, path traversal prevention. Zod validators in [backend/src/validators/requestValidators.js](backend/src/validators/requestValidators.js).
- **Audit logging**: `AuditLogger` service in [backend/src/services/auditLogger.js](backend/src/services/auditLogger.js) tracks sensitive actions (LOGIN, CREATE_JOB, PROCESS_PAYMENT, ADMIN_ACTION, ROLE_CHANGE, DELETE_USER, etc.) to Firestore `audit_logs` collection.
- **Stripe safety**: [backend/src/stripeConfig.js](backend/src/stripeConfig.js) detects mode (test/live/disabled) via key prefix (`sk_test_` vs `sk_live_`) and returns `null` if missing—features degrade gracefully. Checkout flow creates Firestore escrow document and transitions job to `'em_progresso'`. Webhook validation via Stripe signature.
- **Authorization middleware**: `requireAuth`, `requireRole`, `requireAdmin`, `requireOwnership`, `requireJobParticipant`, `requireDisputeParticipant` in [backend/src/authorizationMiddleware.js](backend/src/authorizationMiddleware.js). **Do not bypass in tests**; always use `createApp()` with injected mocks to respect middleware chain.

## Development Workflows

- **Frontend**: `npm run dev` (port 3000, proxies `/api` to `localhost:8081` via [vite.config.ts](vite.config.ts)). Tests: `npm test` (Vitest), `npm run test:watch`, `npm run test:ui`.
- **Backend**: `cd backend && npm start` (port 8081 for local). Tests from root: `npm run test:backend` (runs Vitest in `backend/` with no coverage by default). Coverage: `npm run test` (frontend) + `npm run test:backend` = combined `npm run test:all`.
- **E2E Playwright**: `npm run e2e:smoke` (10-test suite ~1min: [tests/e2e/smoke/basic-smoke.spec.ts](tests/e2e/smoke/basic-smoke.spec.ts)), `npm run e2e:critical` (full journeys), `npm run e2e:headed` (visible browser), `npm run e2e:report` (view results). Config: [playwright.config.ts](playwright.config.ts) uses port 4173 (preview server), single worker, no parallel execution.
- **Pre-deploy gate**: `npm run validate:prod` runs lint + typecheck + test + build + `guardrails:audit` (detects secrets via custom script in [scripts/guardrails/](scripts/guardrails/)). CI disabled (`if: false` in [.github/workflows/ci.yml](.github/workflows/ci.yml)).
- **VS Code tasks**: [.vscode/tasks.json](.vscode/tasks.json) provides automated workflows (audit PR, update master doc, generate tasks, create/merge PRs).
- **Windows environment**: Primary dev OS; PowerShell scripts in [scripts/](scripts/) for GCP ops, secret validation, log tailing.

## AI Orchestration

- **Automation commands**: `npm run generate-tasks` (Gemini task generation via [ai-engine/gemini/](ai-engine/gemini/)), `npm run orchestrate-tasks` (GitHub issue + execution via [ai-orchestrator/src/orchestrator.cjs](ai-orchestrator/src/orchestrator.cjs)), `npm run servio:full-cycle` (end-to-end pipeline).
- **Task backlog**: [ai-tasks/TAREFAS_ATIVAS.json](ai-tasks/TAREFAS_ATIVAS.json) is the active queue. Task interface in [ai-tasks/task_interface.ts](ai-tasks/task_interface.ts). Use `npm run generate-tasks` to batch-generate from Gemini.
- **Master document**: [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md) is the **authoritative source of truth** (~5700 lines)—tracks task progress, test results, deployment state, known issues, and PR/branch status.

## Data Model + Rules

- **Jobs**: Store participant emails as `clientId`/`providerId`. Firestore rules rely on `authEmail()` helper function (lines 26-40 in [firestore.rules](firestore.rules)). Job statuses enum: `'aberto'|'em_progresso'|'concluido'|'cancelado'`.
- **Users**: Document ID = email (legacy). `uid` field added; full migration to uid-based IDs pending. Roles via custom claims, not stored in DB. Services/proposals/reviews use `clientId`/`providerId` (email references) for participant lookups.
- **Lead lifecycle** (Prospector CRM): Stages `'new'|'contacted'|'negotiating'|'won'|'lost'`, temperatures `'hot'|'warm'|'cold'`, priorities `'high'|'medium'|'low'`. See [types.ts](types.ts) lines 1-9 for all enums.

## Integrations

- **WhatsApp Business API**: [backend/src/whatsappService.js](backend/src/whatsappService.js) + multi-role support in [backend/src/whatsappMultiRoleService.js](backend/src/whatsappMultiRoleService.js). Routes at [backend/src/routes/whatsapp\*.js](backend/src/routes/). Requires `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.
- **Gmail SMTP**: [backend/src/gmailService.js](backend/src/gmailService.js) for follow-up emails. Batch scheduler in [backend/src/outreachScheduler.js](backend/src/outreachScheduler.js) processes pending outreach jobs. Requires `GMAIL_USER`, `GMAIL_PASS`.
- **Gemini AI**: Model `gemini-2.0-flash-exp` via `@google/generative-ai`. Frontend calls go to backend (`/api/prospecting/enhance-bio`, `/api/prospecting/analyze-job`). See [services/geminiService.ts](services/geminiService.ts) for client implementation. Requires `GEMINI_API_KEY`.
- **Stripe**: Checkout sessions, webhook handlers, Connect onboarding. Config detects test vs live key. Webhook validation via signature in [backend/src/routes/payments.js](backend/src/routes/payments.js).
- **Twilio**: Optional SMS/voice (disabled by default via `TWILIO_ENABLED=false`). For testing, mock via Vitest.

## Environment Variables (see [.env.example](.env.example))

- **Frontend**: `VITE_FIREBASE_*` (7 vars: API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID, MEASUREMENT_ID), `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_BACKEND_API_URL` (defaults to `localhost:8081` in dev).
- **Backend**: `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS` (GCP service account JSON path), `GCP_STORAGE_BUCKET`, `GMAIL_USER`, `GMAIL_PASS`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, optional `TWILIO_*`. Production secrets in `C:\secrets\` (gitignored).
- **Mode detection**: Stripe key prefix (`sk_test_` vs `sk_live_`) auto-detected; warning logged if test key in production.

## Documentation Map

- **API reference**: [API_ENDPOINTS.md](API_ENDPOINTS.md) (~1341 lines, comprehensive endpoint docs with request/response examples).
- **Commands cheat sheet**: [COMANDOS_UTEIS.md](COMANDOS_UTEIS.md) (test, build, e2e, validation commands).
- **Deployment checklist**: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) (pre-deploy steps, quality gates, env config).
- **Architecture source**: [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md) (task progress, test state, audit logs, PR/branch status).

## Quality Bars

- **Coverage**: Maintain ≥45% (current ~48%). Thresholds in [vitest.config.ts](vitest.config.ts) lines 46-51: lines 45%, statements 45%, functions 45%, branches 40%.
- **Lint budget**: ≤1000 warnings via `npm run lint:ci` (uses `--max-warnings=1000`).
- **Commit format**: `feat|fix|chore|docs: [task-X.Y] description` (conventional commits, no periods).
- **Branch names**: `feature/**`, `fix/**`, `hotfix/**` (kebab-case).
- **Pre-commit**: `lint-staged` via Husky runs format check + lint on staged files.

## Testing Patterns

- **Vitest config**: [vitest.config.ts](vitest.config.ts) uses jsdom, `singleThread: true`, `maxWorkers: 1` for stability; coverage via v8 provider. Excludes: `backend/**`, `doc/**`, `node_modules/**`.
- **Backend tests**: Use `createApp()` with injected mocks **never import singleton**. Example: `const app = createApp({ db: mockDb, stripe: null, genAI: null });`. Run: `npm run test:backend` (Vitest in `backend/` dir). Respect middleware chain—don't bypass auth checks.
- **Frontend tests**: 261+ passing tests across [tests/](tests/) and [tests/e2e/](tests/e2e/). Smoke tests (10 critical flows) in [tests/e2e/smoke/basic-smoke.spec.ts](tests/e2e/smoke/basic-smoke.spec.ts); run `npm run e2e:smoke` for <2min validation.
- **Setup files**: [tests/setup.ts](tests/setup.ts) for frontend (MSW, mocks), [backend/vitest.config.mjs](backend/vitest.config.mjs) for backend (no Firestore reads in tests).
- **E2E stability**: Single worker (`workers: 1`), no parallel execution (`fullyParallel: false`), retries disabled in local (2 in CI). Preview server auto-starts on port 4173.
