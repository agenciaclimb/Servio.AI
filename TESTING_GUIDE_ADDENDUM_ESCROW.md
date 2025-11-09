# Escrow Test Utilities (ENABLE_TEST_UTILS)

To fully exercise dispute resolution (without going through real Stripe checkout) you can enable a lightweight escrow seeding utility.

## 1. Enable Test Utilities

Set the environment variable before starting the backend locally or in a staging deploy:

Windows PowerShell:

```powershell
$env:ENABLE_TEST_UTILS="true"
npm run dev:backend
```

Or add to your Cloud Run revision (staging only, NOT production):

- Key: ENABLE_TEST_UTILS
- Value: true

## 2. Available Endpoints (when enabled)

- POST /test-utils/seed-escrow
  Body:
  {
  "jobId": "<job id>",
  "clientId": "<client user id/email>",
  "providerId": "<provider user id/email>",
  "amount": 150,
  "status": "pago"
  }
  Returns existing escrow if one already exists for the job.

- GET /test-utils/escrow/:jobId
  Fetches first escrow document for the job.

## 3. Flow in E2E

The suite `tests/e2e_admin_dashboard.test.mjs` tries to seed an escrow (Test 6b). If utilities are disabled it logs a skip and dispute resolution (Test 7/8) degrades gracefully (still validates alert & revenue metrics).

With utilities enabled:

1. Job is created and completed.
2. Escrow is seeded as status "pago".
3. Dispute is created.
4. Resolution endpoint succeeds (refund_client or release_to_provider).
5. Analytics verification also confirms escrow status (reembolsado/liberado).

## 4. Example Manual Use

```powershell
# Seed escrow
curl -X POST https://<backend-host>/test-utils/seed-escrow `
  -H "Content-Type: application/json" `
  -d '{"jobId":"abc123","clientId":"client@example.com","providerId":"prov@example.com","amount":150,"status":"pago"}'

# Resolve dispute after creating one
curl -X POST https://<backend-host>/disputes/<disputeId>/resolve `
  -H "Content-Type: application/json" `
  -d '{"resolution":"refund_client","comment":"Teste de resolução"}'
```

## 5. Safety Notes

- Do NOT enable in production: bypasses real payment flow.
- Documents created include `seededForTests: true` for easy cleanup.
- Amount stored is in BRL (not centavos) consistent with existing simplified logic.

## 6. Cleanup Script Idea (optional)

You can write a script to delete `escrows` with `seededForTests=true` older than X days to keep Firestore tidy.

## 7. Next Steps

- Add an automated staged run that sets ENABLE_TEST_UTILS=true so CI can assert full resolution.
- Extend utilities to optionally simulate both refund and provider release paths.

---

Updated: Addendum complements `TESTING_GUIDE.md` for escrow test coverage.
