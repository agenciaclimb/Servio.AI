# Servio.AI - AI Agent Instructions

## Project Overview

Servio.AI is a production-ready marketplace connecting clients with service providers, enhanced with AI-powered matching and prospecting. The system uses Firebase/Firestore as the backend, Stripe for payments, and Google Gemini AI for intelligent features.

**Tech Stack**: React 18 + TypeScript + Vite (frontend), Node.js + Express (backend), Firestore (database), Cloud Run (deployment)

## Architecture & Key Patterns

### Data Model Convention - Email as ID

**CRITICAL**: Throughout the codebase, user documents use **email addresses as document IDs**, not Firebase Auth UIDs.

- Firestore collections: `users/{email}`, `jobs.clientId = email`, `jobs.providerId = email`
- Security rules: Use `authEmail()` helper, not `request.auth.uid`
- Example: `db.collection('users').doc('user@example.com')`
- See `firestore.rules` for reference implementations

### Backend Dependency Injection

The Express backend uses a factory pattern for testability:

```javascript
// backend/src/index.js
function createApp({ db, storage, stripe }) {
  // Allows injecting mocks in tests
}
```

**When testing**: Always use `createApp()` with mock instances, never import the default `app` export directly.

### Firebase Lazy Loading Pattern

Firebase modules are split for performance:

- **Critical path** (loaded immediately): `auth`, `db` (Firestore)
- **Lazy-loaded**: `storage`, `analytics` via `getStorageInstance()`, `getAnalyticsIfSupported()`
- See `firebaseConfig.ts` for the Proxy pattern implementation

### Component Patterns

- Props interfaces follow the convention: `interface ComponentNameProps { ... }`
- User types: `'cliente' | 'prestador' | 'admin' | 'prospector'` (defined in `types.ts`)
- Status enums use Portuguese: `'ativo' | 'suspenso'`, `'aberto' | 'em_progresso' | 'concluido'`

## Development Workflows

### Running Tests

```powershell
# Frontend unit tests (Vitest + React Testing Library)
npm test                    # With coverage (48% target met ✅)
npm run test:watch         # Watch mode for TDD

# Backend tests
npm run test:backend       # All backend tests
cd backend && npm test     # From backend directory

# E2E tests (Playwright)
npm run e2e:smoke          # Critical smoke tests (10 tests)
npm run e2e:critical       # Full critical flow validation
```

**Test Philosophy**: All tests use mocks for external services (Firebase, Stripe, Gemini). Real integration tests run in CI against production endpoints.

### Local Development

```powershell
# Frontend dev server (port 5173)
npm run dev

# Backend dev server (port 8081) - from backend/
cd backend && npm start

# Required env vars (see .env.example):
# - VITE_FIREBASE_* (Firebase config)
# - VITE_STRIPE_PUBLISHABLE_KEY
# - GEMINI_API_KEY (backend only)
```

**API Proxy**: Vite dev server proxies `/api/*` to backend. Configure `VITE_BACKEND_URL` in `.env.local` to override (default: `http://localhost:8081`).

### Build & Deploy

```powershell
# Production build
npm run build              # TypeScript compile + Vite build

# Pre-deploy validation
npm run validate:prod      # TypeCheck + Tests + E2E Smoke + Build

# Deploy (automated via GitHub Actions on push to main)
# - Frontend → Firebase Hosting
# - Backend → Google Cloud Run (us-west1)
```

**CI/CD**: See `.github/workflows/ci.yml` for the full pipeline. Tests must pass before deployment.

## Critical Integration Points

### Stripe Payment Flow

1. Client accepts proposal → backend creates Checkout Session
2. User completes payment on Stripe-hosted page
3. Webhook (`/api/stripe-webhook`) receives `checkout.session.completed` event
4. Backend creates escrow document in Firestore
5. Job status → `'em_progresso'`, payment held until job completion
6. **Connect accounts**: Providers onboard via Stripe Connect to receive payouts

**Test with**: Card `4242 4242 4242 4242`, any future expiry/CVV

### Gemini AI Integration

Used for:

- Job description enhancement (`services/geminiService.ts` → `enhanceJobDescription`)
- Provider bio generation (`generateProviderBio`)
- Prospecting message templates

**Configuration**: Model `gemini-2.0-flash-exp`, requires `GEMINI_API_KEY` env var

### Firestore Security Rules

**Role-based access** enforced at database level:

- `isAdmin()`, `isClient()`, `isProvider()` helpers check user.type
- `isJobParticipant()` validates access to job-related documents
- Rules file: `firestore.rules` (218 lines) - deploy with `firebase deploy --only firestore:rules`

## Common Gotchas

### 1. Email vs UID in User Lookups

❌ **Wrong**: `db.collection('users').doc(auth.currentUser.uid)`  
✅ **Right**: `db.collection('users').doc(auth.currentUser.email)`

### 2. Mock Structure for Tests

When mocking Firestore in tests, implement the full collection chain:

```javascript
const mockDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    })),
  })),
};
```

See `backend/tests/jobs.test.js` for reference.

### 3. Portuguese String Literals

UI strings and database enums use Portuguese:

- Job statuses: `'ativo'`, `'concluido'`, `'cancelado'`
- User types: `'cliente'`, `'prestador'`, `'admin'`
- Never translate these to English in database operations

### 4. Async Component Loading

Dashboards are code-split for performance:

```typescript
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
// Wrap in <Suspense fallback={<Loading />}>
```

## Key Files & Documentation

**Entry points**:

- `src/App.tsx` - Frontend routing and auth context
- `backend/src/index.js` - Express app with all API endpoints (3000+ lines)

**Critical docs** (read before major changes):

- `DOCUMENTO_MESTRE_SERVIO_AI.md` - Authoritative architecture reference
- `COMANDOS_UTEIS.md` - Complete command reference
- `API_ENDPOINTS.md` - Backend API documentation
- `STRIPE_GUIA_RAPIDO.md` - Payment integration guide

**Type definitions**: `types.ts` - Central source of truth for all interfaces (`User`, `Job`, `Proposal`, etc.)

## Quality Standards

- **Test coverage**: Maintain >45% (current: 48.36%)
- **Lint**: No warnings allowed in CI (`npm run lint:ci` max-warnings=1000)
- **TypeScript**: Strict mode enabled, all public APIs must be typed
- **Security**: Zero npm vulnerabilities (`npm run security:audit` before PR)

---

_Last updated: 2025-11-24 | Production status: LIVE | Coverage: 633/634 tests passing_
