# SERVIO.AI Backend REST API

REST API service for the SERVIO.AI platform - a marketplace connecting service providers with clients for home services, maintenance, and professional tasks.

## Architecture

- **Runtime**: Node.js 18
- **Framework**: Express.js (CommonJS)
- **Database**: Firebase Firestore
- **Storage**: Google Cloud Storage
- **Payments**: Stripe (with Connect for provider payouts)
- **Testing**: Vitest + Supertest
- **Deployment**: Google Cloud Run (PORT 8081)

The server uses **Dependency Injection** via the `createApp` factory function, allowing db/storage/stripe mocks for testing.

## Environment Variables

```bash
# Required
PORT=8081                          # Server port
GOOGLE_APPLICATION_CREDENTIALS=... # Firebase Admin SDK credentials path
GCP_STORAGE_BUCKET=...            # Google Cloud Storage bucket name
STRIPE_SECRET_KEY=...             # Stripe API secret key
FRONTEND_URL=...                  # Frontend URL for Stripe redirects

# Optional
NODE_ENV=production               # Environment (development/production)
```

## Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Start server
npm start
# Server starts at http://localhost:8081
```

## Test Results

✅ **35/35 tests passing**

- 4 test files: integration, jobs, smoke, earnings
- Full CRUD coverage for all endpoints
- Mock Firestore for isolated testing

## Project Structure

```
backend/
├── src/
│   ├── index.js          # Main Express application (1334 lines)
│   └── earnings.test.js  # Earnings calculation tests
├── tests/
│   ├── integration.test.js  # Complete REST API integration tests (20 tests)
│   ├── smoke.test.ts        # Basic health checks
│   ├── index.test.js        # Core endpoint tests
│   └── jobs.test.js         # Job workflow tests
├── Dockerfile            # Container build for Cloud Run
├── package.json
└── README.md
```

---

## API Endpoints Reference

### Users API

- **GET /users** - List all users (query: `role`)
- **GET /users/:id** - Get user by ID
- **POST /users** - Create new user
- **PUT /users/:id** - Update user
- **DELETE /users/:id** - Delete user

### Jobs API

- **GET /jobs** - List jobs (query: `providerId`, `status`)
- **GET /jobs/:id** - Get job by ID
- **POST /jobs** - Create new job (default status: `ativo`)
- **PUT /jobs/:id** - Update job (generic)
- **POST /jobs/:id/complete** - Mark job as complete
- **POST /jobs/:id/release-payment** - Release payment to provider

### Proposals API

- **GET /proposals** - List proposals (query: `jobId`, `providerId`)
- **POST /proposals** - Create proposal (default status: `pendente`)
- **PUT /proposals/:id** - Update proposal status

### Messages API

- **GET /messages/:jobId** - Get messages for job/chat
- **POST /messages** - Send new message

### Maintained Items API

- **GET /maintained-items** - List items (query: `clientId` **required**)
- **POST /maintained-items** - Create maintained item
- **GET /maintained-items/:itemId/history** - Get maintenance history

### Invitations API

- **GET /invitations** - List invitations (query: `clientId`, `providerId`)
- **POST /invitations** - Create invitation

### Disputes API

- **GET /disputes** - List all disputes
- **POST /disputes** - Create dispute (updates job to `em_disputa`)
- **POST /disputes/:disputeId/resolve** - Resolve dispute (admin)

### Escrows API

- **GET /escrows** - List escrows (query: `status`, `clientId`, `providerId`)

### Fraud Alerts API

- **GET /fraud-alerts** - List fraud detection alerts
- **PUT /fraud-alerts/:id** - Update alert status

### Metrics API

- **GET /metrics/activity** - Get activity metrics (query: `startDate`, `endDate`)
- **GET /metrics/earnings** - Get earnings data (query: `providerId`)

### Admin API

- **POST /admin/payments/:escrowId/mark-paid** - Manually mark payment as paid to provider

### Payment & Storage

- **POST /create-checkout-session** - Create Stripe checkout session
- **GET /generate-upload-url** - Generate signed GCS upload URL

---

## Detailed Endpoint Documentation

### POST /jobs

Create a new job.

**Request:**

```json
{
  "clientId": "client@example.com",
  "title": "Repair kitchen sink",
  "description": "Leaking faucet",
  "category": "Encanamento",
  "budget": 150.0,
  "location": { "address": "Rua das Flores, 123" },
  "scheduledFor": "2024-01-20T14:00:00.000Z"
}
```

**Response:** `201 Created`

```json
{
  "id": "mock-jobs-1234567890-abc",
  "status": "ativo",
  ...
}
```

### POST /disputes

Create a dispute (also updates job status to `em_disputa`).

**Request:**

```json
{
  "jobId": "job-123",
  "initiatorId": "client@example.com",
  "reason": "Work not completed"
}
```

**Response:** `201 Created`

```json
{
  "id": "mock-disputes-1234567890-abc",
  "status": "aberta",
  "messages": [],
  ...
}
```

### GET /maintained-items

List maintained items (**requires** `clientId` query param).

**Request:** `GET /maintained-items?clientId=client@example.com`

**Response:** `200 OK`

```json
[
  {
    "id": "item-123",
    "clientId": "client@example.com",
    "name": "Air Conditioning Unit",
    "maintenanceHistory": [],
    ...
  }
]
```

**Error:** `400 Bad Request` if `clientId` missing

---

## Authentication & Security

- Admin endpoints (e.g., `/admin/*`) require `checkSuperAdmin` middleware
- Most endpoints open for MVP/beta testing
- Production will integrate Firebase Auth ID token validation
- Stripe payments use secure checkout sessions
- GCS upload URLs signed with 15-minute expiration

---

## Testing Strategy

**Test Suites:**

1. **Integration Tests** (`tests/integration.test.js`): 20 tests covering all CRUD operations
2. **Jobs Tests** (`tests/jobs.test.js`): Job workflow validation
3. **Earnings Tests** (`src/earnings.test.js`): Payment calculations
4. **Smoke Tests** (`tests/smoke.test.ts`): Health checks

**Mock Strategy:**

- Firestore fully mocked with collection/doc/where/orderBy chains
- Dependency injection via `createApp({ db, storage, stripe })`
- No external dependencies during test runs

**Example Test:**

```javascript
import { createApp } from "../src/index.js";
import request from "supertest";

const mockDb = {
  /* mock Firestore */
};
const app = createApp({ db: mockDb, storage: null, stripe: null });

// Test endpoint
const response = await request(app).get("/jobs");
expect(response.status).toBe(200);
```

---

## Data Model

**Collections:**

- `users`: Platform users (clients, providers, admins)
- `jobs`: Service requests with status workflow
- `proposals`: Provider bids on jobs
- `messages`: Chat messages between users
- `maintained_items`: Client assets for maintenance tracking
- `invitations`: Client invitations to providers
- `disputes`: Job-related disputes with resolution tracking
- `escrows`: Payment escrows for job transactions
- `sentiment_alerts`: Fraud detection alerts

**Job Statuses:** `ativo` → `em_progresso` → `concluido` → `cancelado` | `em_disputa`

**Escrow Statuses:** `bloqueado` → `liberado` | `reembolsado` | `em_disputa` | `pago_ao_prestador`

---

## Deployment

### Docker Build

```bash
# Build image
docker build -t servio-backend .

# Run locally
docker run -p 8081:8081 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/creds.json \
  -e GCP_STORAGE_BUCKET=your-bucket \
  -e STRIPE_SECRET_KEY=sk_test_... \
  servio-backend
```

### Google Cloud Run

```bash
# Build and push (via Cloud Build)
gcloud builds submit --config cloudbuild-backend.yaml

# Deploy to Cloud Run
gcloud run deploy servio-backend \
  --image us-west1-docker.pkg.dev/PROJECT_ID/servio/servio-backend:latest \
  --platform managed \
  --region us-west1 \
  --port 8081 \
  --allow-unauthenticated \
  --set-env-vars "GCP_STORAGE_BUCKET=your-bucket,STRIPE_SECRET_KEY=sk_test_..."
```

---

## Dual Service Architecture

SERVIO.AI uses two Cloud Run services:

1. **servio-ai** (PORT 8080): Gemini AI service for reports, scheduling, analysis
2. **servio-backend** (PORT 8081): REST API for data operations (this service)

Frontend routes requests appropriately:

- `src/lib/api.ts` → Backend REST API (8081)
- `src/lib/aiApi.ts` → AI Service (8080)

---

## Payment Flow

1. Client creates job → Status: `ativo`
2. Provider submits proposal → Status: `pendente`
3. Client accepts proposal → Escrow created: `bloqueado`
4. Provider completes work → Job status: `em_progresso`
5. Client marks complete → Job status: `concluido`
6. Client releases payment → Escrow: `liberado` → Stripe transfer
7. Admin confirms → Escrow: `pago_ao_prestador`

---

## Error Responses

All endpoints follow consistent format:

**400 Bad Request:**

```json
{ "error": "Validation error message" }
```

**404 Not Found:**

```json
{ "error": "Resource not found" }
```

**500 Internal Server Error:**

```json
{ "error": "Failed to perform operation." }
```

---

## Future Improvements

- [ ] Implement Firebase Auth token validation in production
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add request validation middleware (express-validator)
- [ ] Implement WebSocket for real-time messaging
- [ ] Add pagination for large result sets
- [ ] Implement caching layer (Redis)
- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement audit logging for sensitive operations

---

**Version:** 1.0.0  
**Last Updated:** January 2024
