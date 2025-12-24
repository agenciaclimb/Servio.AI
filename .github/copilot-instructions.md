# Servio.AI - AI Agent Instructions

## Project Overview

Servio.AI is a production-ready marketplace connecting clients with service providers, enhanced with AI-powered matching and prospecting. The system uses Firebase/Firestore as the backend, Stripe for payments, and Google Gemini AI for intelligent features.

**Tech Stack**: React 18 + TypeScript + Vite (frontend), Node.js + Express (backend), Firestore (database), Cloud Run (deployment)

**Production Status**: 🟢 LIVE | 634/634 tests passing (100%) | 48.36% coverage | CI/CD via GitHub Actions | Last validated: 2025-12-23

**Recent Updates (Dec 2025)**:

- Task 4.6: Security Hardening v2 (rate limiting, CSRF, XSS protection, Zod validators) ✅
- Gmail SMTP + WhatsApp Business API integrated ✅
- Firestore production service account configured (`C:\secrets\servio-prod.json`) ✅
- Backend tests: 125/188 passing (66.5%) - Gmail/WhatsApp/Firestore working, Gemini test env issues pending

## Architecture & Key Patterns

### Data Model Convention - Email as ID

**CRITICAL**: Throughout the codebase, user documents use **email addresses as document IDs**, not Firebase Auth UIDs.

- Firestore collections: `users/{email}`, `jobs.clientId = email`, `jobs.providerId = email`
- Security rules: Use `authEmail()` helper, not `request.auth.uid`
- Example: `db.collection('users').doc('user@example.com')`
- See [firestore.rules](firestore.rules) for reference implementations

**Why**: Legacy design from MVP phase. Migration to UID-based IDs is planned but requires careful data migration across all collections.

### Backend Dependency Injection

The Express backend uses a factory pattern for testability:

```javascript
// backend/src/index.js line 200
function createApp({ db, storage, stripe, genAI, rateLimitConfig }) {
  const app = express();
  // ... configures routes with injected dependencies
  return app;
}
```

**When testing**: Always use `createApp()` with mock instances, never import the default `app` export. Backend tests currently at 125/188 passing (66.5%) - focus areas: Gemini test env setup, LandingPage/Twilio stubs, Firestore pagination mocks.

See [backend/tests/jobs.test.js](backend/tests/jobs.test.js) for the mock structure pattern:

```javascript
const mockDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({...}) }),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    })),
    where: vi.fn().mockReturnThis(),
  })),
};
app = createApp({ db: mockDb, storage: null, stripe: null });
```

### Firebase Lazy Loading Pattern

Firebase modules are split for performance optimization:

- **Critical path** (loaded immediately): `auth`, `db` (Firestore)
- **Lazy-loaded**: `storage`, `analytics` via `getStorageInstance()`, `getAnalyticsIfSupported()`
- Implementation: Proxy pattern in [firebaseConfig.ts](firebaseConfig.ts) lines 90-109

**Why**: Reduces initial bundle size by ~200KB. Analytics/Storage aren't needed for auth or initial render.

### Component Patterns

- Props interfaces follow the convention: `interface ComponentNameProps { ... }`
- User types: `'cliente' | 'prestador' | 'admin' | 'prospector'` (defined in [types.ts](types.ts))
- Status enums use **Portuguese**: `'ativo' | 'suspenso'`, `'aberto' | 'em_progresso' | 'concluido'`
- All dashboards are lazy-loaded via React `lazy()` and `<Suspense>` (see [App.tsx](App.tsx) lines 11-37)

## Development Workflows

### Running Tests

```powershell
# Frontend unit tests (Vitest + React Testing Library)
npm test                    # With coverage (48.36% current ✅)
npm run test:watch         # Watch mode for TDD
npm run test:ui            # Visual test UI

# Backend tests (from root)
npm run test:backend       # Runs backend/tests/*.test.js
npm run test:all           # Frontend + Backend

# E2E tests (Playwright)
npm run e2e:smoke          # Critical smoke tests (10 tests, <2min)
npm run e2e:critical       # Full critical flow validation
npm run e2e:ui             # Interactive Playwright UI
```

**Test Philosophy**: All tests mock external services (Firebase, Stripe, Gemini). No real API calls in tests. Real integration tests run in CI post-deployment against production endpoints.

### Local Development

```powershell
# Frontend dev server (port 3000 via Vite)
npm run dev

# Backend dev server (port 8081) - from backend/
cd backend && npm start

# Required env vars (see .env.example):
# - VITE_FIREBASE_* (Firebase config - 7 vars)
# - VITE_STRIPE_PUBLISHABLE_KEY
# - GEMINI_API_KEY (backend only)
```

**API Proxy**: Vite dev server proxies `/api/*` to backend. Configure `VITE_BACKEND_URL` or `VITE_BACKEND_API_URL` in `.env.local` to override (default: `http://localhost:8081`). See [vite.config.ts](vite.config.ts) lines 10-22.

### Build & Deploy

```powershell
# Production build
npm run build              # TypeScript compile + Vite build

# Pre-deploy validation (CRITICAL - run before any deploy)
npm run validate:prod      # TypeCheck + Tests + Build + Security Audit

# Deploy (automated via GitHub Actions on push to main)
# - Frontend → Firebase Hosting (CDN global)
# - Backend → Google Cloud Run (us-west1, auto-scaling)
```

**CI/CD**: See [.github/workflows/ci.yml](.github/workflows/ci.yml). Pipeline: Lint → TypeCheck → Tests (Frontend + Backend) → E2E Smoke → Build → Deploy. **Note**: CI currently disabled (line 13: `if: false`) - tests run locally via "Memory Mode" backend validation before merges.

## AI-Driven Development System

**Unique to this project**: Servio.AI uses an AI orchestrator for task management and code generation.

### AI Orchestrator Workflow

```powershell
# Generate tasks from backlog using Gemini
npm run generate-tasks     # Reads ai-tasks/TAREFAS_ATIVAS.json

# Orchestrate task execution (Gemini → GitHub → Copilot loop)
npm run orchestrate-tasks  # Creates issues, assigns Copilot, monitors PRs

# Full AI cycle
npm run servio:full-cycle  # Generate → Orchestrate → Test

# Available VS Code tasks
npm run task:audit-pr       # 🔍 Auditar PR (requires PR number)
npm run task:update-doc     # 📝 Atualizar Documento Mestre
npm run task:generate       # 🎯 Gerar Tasks do Dia
npm run task:fix-issue      # 🔧 Gerar Fix para Issue
npm run task:create-pr      # 🚀 Criar PR
npm run task:merge-pr       # ✅ Merge PR
```

**Key Files**:

- `ai-orchestrator/src/orchestrator.cjs` - Main orchestration logic
- `ai-tasks/TAREFAS_ATIVAS.json` - Active task backlog
- `DOCUMENTO_MESTRE_SERVIO_AI.md` - Source of truth for architecture (5629 lines, updated continuously)

### Protocolo Supremo (Supreme Protocol)

Internal workflow automation for quality gates:

```powershell
npm run supremo:init      # Initialize branch with standards check
npm run supremo:audit     # Run full quality audit
npm run supremo:fix       # Auto-fix lint/format issues
npm run supremo:test-backend  # Backend test validation
npm run supremo:pr-status # Check PR status + GitHub API integration
```

Located in `scripts/protocolo-supremo.cjs`. Enforces: branch naming (`feature/**`), commit message format (`feat: [task-X.Y] ...`), no secrets in commits, test coverage >45%.

## Critical Integration Points

### Stripe Payment Flow

1. Client accepts proposal → backend creates Checkout Session (`POST /api/create-checkout-session`)
2. User completes payment on Stripe-hosted page
3. Webhook (`POST /api/stripe-webhook`) receives `checkout.session.completed` event
4. Backend creates escrow document in Firestore (`escrows/{jobId}`)
5. Job status → `'em_progresso'`, payment held until job completion
6. **Connect accounts**: Providers onboard via Stripe Connect to receive payouts

**Stripe Mode Detection**: [backend/src/stripeConfig.js](backend/src/stripeConfig.js) - Automatically detects `sk_test_` vs `sk_live_` keys. Warns if test key is used in production. Returns `null` if `STRIPE_SECRET_KEY` is missing (disables Stripe features gracefully).

**Test with**: Card `4242 4242 4242 4242`, any future expiry/CVV

### Gemini AI Integration

Used for:

- Job description enhancement (`services/geminiService.ts` → `enhanceJobDescription`)
- Provider bio generation (`generateProviderBio`)
- Prospecting message templates (backend endpoints)
- **AI orchestration** (task generation, code reviews, PR audits)

**Configuration**: Model `gemini-2.0-flash-exp`, requires `GEMINI_API_KEY` env var. Calls from backend use `GoogleGenerativeAI` SDK.

### Multi-Channel Communication (WhatsApp, Gmail, SMS)

Backend integrates with:

- **WhatsApp Business API** (`backend/src/whatsappService.js` + `/routes/whatsapp.js`)
- **Gmail SMTP** (`backend/src/gmailService.js`) - Follow-up emails
- **Twilio** (optional, disabled by default: `TWILIO_ENABLED=false`)

**Outreach Scheduler**: `backend/src/outreachScheduler.js` - `processPendingOutreach()` function handles automated prospector follow-ups. Called from scheduled jobs.

### Firestore Security Rules

**Role-based access** enforced at database level via custom claims:

- `isAdmin()`, `isClient()`, `isProvider()` check `request.auth.token.role` (no Firestore reads)
- `authEmail()` helper returns `request.auth.token.email` for email-based ownership checks
- `isJobParticipant()` validates `clientId` or `providerId` match `authEmail()`
- Rules file: [firestore.rules](firestore.rules) (309 lines) - deploy with `npm run firebase:deploy:rules`

**Critical**: Rules use `request.auth.token.role` (custom claims set by Cloud Function on user creation), NOT `resource.data.type` (avoids Firestore reads for auth checks).

## Common Gotchas

### 1. Email vs UID in User Lookups

❌ **Wrong**: `db.collection('users').doc(auth.currentUser.uid)`  
✅ **Right**: `db.collection('users').doc(auth.currentUser.email)`

**Exception**: In security rules, `request.auth.uid` is compared against the `uid` field stored in user documents (migration in progress). Document IDs are still emails.

### 2. Mock Structure for Tests

When mocking Firestore in tests, implement the **full collection chain** with `vi.fn().mockReturnThis()`:

```javascript
const mockDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ email: 'test@example.com' }) }),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    })),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [] }),
  })),
};
```

See [backend/tests/jobs.test.js](backend/tests/jobs.test.js) lines 5-20 for reference.

### 3. Portuguese String Literals

UI strings and database enums use **Portuguese** (Brazilian market):

- Job statuses: `'aberto'`, `'em_progresso'`, `'concluido'`, `'cancelado'`
- User types: `'cliente'`, `'prestador'`, `'admin'`, `'prospector'`
- User status: `'ativo'`, `'suspenso'`

**Never translate these to English** in database operations or type definitions. They are part of the data model contract.

### 4. Async Component Loading

All dashboards are code-split for performance:

```typescript
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
// Must wrap in <Suspense fallback={<LoadingFallback />}> in App.tsx
```

**Why**: Initial bundle without lazy loading was 800KB+. With lazy loading + code splitting, main bundle is <300KB. See [vite.config.ts](vite.config.ts) `manualChunks` config.

### 5. Security Middleware Stack (Task 4.6)

Backend has layered security (added Dec 2025, PR pending):

- **Rate limiting**: `globalLimiter`, `authLimiter`, `apiLimiter`, `paymentLimiter` (express-rate-limit)
- **Security headers**: Helmet.js + custom CSP + XSS protection
- **CSRF protection**: `csrf-csrf` library, endpoint `/api/csrf-token`
- **Input sanitization**: `sanitizeInput`, `sanitizeQuery`, `preventPathTraversal`
- **Request validation**: Zod schemas in `backend/src/validators/requestValidators.js`
- **Audit Logger**: Records sensitive actions (LOGIN, CREATE_JOB, PROCESS_PAYMENT, etc.)

**Critical**: Never bypass these middlewares in tests. Use `createApp()` with full middleware stack, then mock external dependencies.

**Credentials**: Production Firestore uses service account JSON in `C:\secrets\servio-prod.json` (gitignored). See `GUIA_SETUP_CREDENCIAIS.md` for setup instructions.

## Key Files & Documentation

**Entry points**:

- [App.tsx](App.tsx) - Frontend routing, auth context, lazy loading setup
- [backend/src/index.js](backend/src/index.js) - Express app with 128+ API endpoints (4405 lines)

**Critical docs** (read before major changes):

- [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md) - **Authoritative** architecture reference (5629 lines, updated 2025-12-22)
- [COMANDOS_UTEIS.md](COMANDOS_UTEIS.md) - Complete command reference (237 lines)
- [API_ENDPOINTS.md](API_ENDPOINTS.md) - Backend API documentation (1341 lines, includes error codes)
- `GUIA_SETUP_CREDENCIAIS.md` - Secure credential setup guide (Gmail, Firestore, WhatsApp)

**Type definitions**: [types.ts](types.ts) - Central source of truth for all interfaces (`User`, `Job`, `Proposal`, `Prospect`, etc. - 385 lines)

**Configuration**:

- [vite.config.ts](vite.config.ts) - Vite config (proxy, build optimization, code splitting)
- [firestore.rules](firestore.rules) - Database security rules (custom claims-based, 309 lines)
- [.env.example](.env.example) - Required environment variables template

## Quality Standards

- **Test coverage**: Maintain >45% (current: 48.36% ✅)
- **Lint**: Max 1000 warnings in CI (`npm run lint:ci`)
- **TypeScript**: Strict mode enabled, all public APIs must be typed
- **Security**: Zero npm vulnerabilities (`npm run security:audit` before PR)
- **Branch naming**: `feature/**`, `fix/**`, `hotfix/**`
- **Commit format**: `feat: [task-X.Y] description` or `fix: [task-X.Y] description`

## Environment Variables

**Frontend** (prefix `VITE_`):

- `VITE_FIREBASE_*` (7 vars) - Firebase config
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `VITE_BACKEND_URL` or `VITE_BACKEND_API_URL` - Backend API URL (defaults to localhost:8081)

**Backend**:

- `GEMINI_API_KEY` - Google Gemini AI API key
- `STRIPE_SECRET_KEY` - Stripe secret key (sk*test*_ or sk*live*_)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to GCP service account JSON (for production Firestore)
- `GMAIL_USER`, `GMAIL_PASS` - SMTP credentials for automated emails
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business API
- `TWILIO_*` - Twilio credentials (optional, disabled by default)

**Storage**: Credentials stored in `C:\secrets\` (gitignored). See `GUIA_SETUP_CREDENCIAIS.md` for setup instructions.

---

_Last updated: 2025-12-23 | Production: LIVE | Coverage: 634/634 tests passing | AI Orchestrator: Active_
