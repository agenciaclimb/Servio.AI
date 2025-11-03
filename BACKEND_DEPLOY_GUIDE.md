# Backend Service Deployment Guide

## Overview

This guide covers deploying the SERVIO.AI backend REST API service to Google Cloud Run. The platform uses a **dual service architecture**:

- **servio-ai** (PORT 8080): AI/Gemini service for reports and analysis
- **servio-backend** (PORT 8081): REST API for data operations

## Prerequisites

### 1. Artifact Registry Setup (One-time)

The backend uses the same Artifact Registry repository as the AI service.

**Verify repository exists:**

```bash
gcloud artifacts repositories describe servio-ai \
  --location=us-west1 \
  --project=gen-lang-client-0737507616
```

**If not exists, create it:**

```bash
gcloud artifacts repositories create servio-ai \
  --repository-format=docker \
  --location=us-west1 \
  --description="SERVIO.AI Docker images (AI + Backend services)" \
  --project=gen-lang-client-0737507616
```

### 2. Required GitHub Secrets

All secrets should already be configured from AI service deployment. Verify in **Settings → Secrets and variables → Actions**:

**Infrastructure:**

- `GCP_PROJECT_ID`: `gen-lang-client-0737507616`
- `GCP_REGION`: `us-west1`
- `GCP_SA_KEY`: Service Account JSON with permissions
- `GCP_STORAGE_BUCKET`: Cloud Storage bucket name
- `STRIPE_SECRET_KEY`: Stripe API key

**Note:** `GCP_SERVICE` secret is not used for backend deployment (hardcoded in config).

### 3. Local Testing (Optional)

Before deploying, test the backend locally:

```bash
# Run tests
cd backend
npm test

# Should show: ✅ 35/35 tests passing

# Test Docker build
docker build -t servio-backend -f backend/Dockerfile .
docker run -p 8081:8081 servio-backend
```

## Deployment Methods

### Method 1: Manual Deployment via GitHub Actions (Recommended)

1. **Go to Actions tab** in GitHub repository
2. **Select "Deploy to Cloud Run"** workflow
3. **Click "Run workflow"**
4. **Configure:**
   - Branch: `feature/full-implementation` (or your current branch)
   - Service: `backend` (deploy only backend) or `both` (deploy AI + backend)
5. **Click "Run workflow"**

**Workflow will:**

- Build Docker image from `backend/Dockerfile`
- Push to Artifact Registry: `us-west1-docker.pkg.dev/.../servio-ai/backend:SHORT_SHA`
- Deploy to Cloud Run: `servio-backend` service
- Configure PORT 8081
- Set to allow unauthenticated requests

### Method 2: Tag-based Automatic Deployment

Push a version tag to trigger automatic deployment:

```bash
git tag v1.0.0-backend
git push origin v1.0.0-backend
```

**This will deploy BOTH services** (AI + backend) automatically.

### Method 3: Manual gcloud Deployment

For direct control:

```bash
# Build and submit via Cloud Build
gcloud builds submit \
  --project gen-lang-client-0737507616 \
  --config cloudbuild-backend.yaml \
  --substitutions=_REGION="us-west1",_SERVICE="servio-backend",_REPO="servio-ai",_IMAGE="backend",SHORT_SHA="$(git rev-parse --short HEAD)"

# Verify deployment
gcloud run services describe servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616
```

## Post-Deployment Verification

### 1. Check Service Status

```bash
# Get service URL
gcloud run services describe servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --format 'value(status.url)'

# Expected: https://servio-backend-XXXXX-uw.a.run.app
```

### 2. Test Health Endpoint

```bash
# Test basic connectivity
curl https://servio-backend-XXXXX-uw.a.run.app/health

# Expected response: 200 OK
```

### 3. Test API Endpoints

```bash
# Set service URL
export BACKEND_URL="https://servio-backend-XXXXX-uw.a.run.app"

# Test users endpoint
curl "$BACKEND_URL/users"

# Test jobs endpoint
curl "$BACKEND_URL/jobs"

# Expected: 200 OK with JSON array responses
```

### 4. Check Logs

```bash
# View recent logs
gcloud run services logs read servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --limit 50

# Stream logs in real-time
gcloud run services logs tail servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616
```

## Environment Variables Configuration

Backend service environment variables are set during deployment via Cloud Build:

**Configured automatically:**

- `PORT=8081` (set in Dockerfile and cloudbuild)

**May need manual configuration:**

```bash
# Set additional environment variables if needed
gcloud run services update servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --set-env-vars "NODE_ENV=production,LOG_LEVEL=info"
```

**Note:** Sensitive credentials (Stripe, Firebase) are configured via:

- `GOOGLE_APPLICATION_CREDENTIALS`: Auto-injected by Cloud Run
- `STRIPE_SECRET_KEY`: Set via Cloud Run environment variables
- `GCP_STORAGE_BUCKET`: Set via Cloud Run environment variables

## Architecture

### Service URLs (after deployment)

- **AI Service**: `https://servio-ai-XXXXX-uw.a.run.app` (PORT 8080)
- **Backend Service**: `https://servio-backend-XXXXX-uw.a.run.app` (PORT 8081)
- **Frontend**: `https://servio-ai.web.app`

### Frontend Integration

Update frontend environment variables to point to backend:

```bash
# .env.production
VITE_BACKEND_API_URL=https://servio-backend-XXXXX-uw.a.run.app
VITE_AI_API_URL=https://servio-ai-XXXXX-uw.a.run.app
```

**Rebuild and redeploy frontend** after updating URLs.

## Troubleshooting

### Issue: "Permission denied" during build

**Cause:** Service Account lacks permissions

**Solution:**

```bash
# Grant required roles to service account
export SA_EMAIL="your-sa@PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding gen-lang-client-0737507616 \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"
```

### Issue: "Repository not found" error

**Cause:** Artifact Registry repository doesn't exist

**Solution:** Create repository (see Prerequisites section)

### Issue: Backend returns 500 errors

**Cause:** Missing environment variables or Firebase credentials

**Solution:**

```bash
# Check current env vars
gcloud run services describe servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --format 'value(spec.template.spec.containers[0].env)'

# Set missing variables
gcloud run services update servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --set-env-vars "GCP_STORAGE_BUCKET=your-bucket,STRIPE_SECRET_KEY=sk_test_..."
```

### Issue: CORS errors from frontend

**Cause:** Backend not allowing frontend origin

**Solution:** Update `FRONTEND_URL` in backend:

```bash
gcloud run services update servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --set-env-vars "FRONTEND_URL=https://servio-ai.web.app"
```

## Rollback

If deployment fails or has issues:

```bash
# List revisions
gcloud run revisions list \
  --service servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616

# Rollback to previous revision
gcloud run services update-traffic servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --to-revisions REVISION_NAME=100
```

## Cost Optimization

Backend service uses Cloud Run pricing:

- **Free tier:** 2 million requests/month, 360,000 GB-seconds
- **Pricing:** ~$0.40 per million requests after free tier

**Recommended settings:**

```bash
# Set min/max instances and memory
gcloud run services update servio-backend \
  --region us-west1 \
  --project gen-lang-client-0737507616 \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

## Monitoring

### Cloud Console

1. Go to **Cloud Run** in GCP Console
2. Select **servio-backend** service
3. View **Metrics** tab for:
   - Request count
   - Request latency
   - Instance count
   - Memory/CPU usage

### Logs Explorer

```bash
# Query logs
resource.type="cloud_run_revision"
resource.labels.service_name="servio-backend"
severity>=ERROR
```

## Next Steps

After successful backend deployment:

1. ✅ Verify both services are running (AI + Backend)
2. ✅ Update frontend environment variables with service URLs
3. ✅ Redeploy frontend with new backend URL
4. ✅ Test end-to-end workflows (job creation, proposals, payments)
5. ✅ Monitor logs and metrics for errors
6. 📋 Day 5: Frontend-backend integration testing

## Support

For issues or questions:

- Check logs: `gcloud run services logs read servio-backend`
- Review Cloud Build history: GCP Console → Cloud Build → History
- Consult `backend/README.md` for API documentation
- See `TROUBLESHOOTING.md` for common issues

**Version:** 1.0.0  
**Last Updated:** November 2024
