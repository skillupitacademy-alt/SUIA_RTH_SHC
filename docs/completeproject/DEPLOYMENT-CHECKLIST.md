# Deployment Checklist - Complete Infrastructure Status

> [!IMPORTANT]
> Historical deployment note: this checklist reflects an older infrastructure snapshot and still references retired student hosts.
> Current production truth lives in `.kiro/DEPLOYMENT_STATUS_MATRIX.md`.
> Treat `user.realtutorialhub.com`, `user.skillupitacademy.com`, `tutorial.skillhubcore.in`, `quiz.skillhubcore.in`, and `placement.skillhubcore.in` as the active public host map unless this file explicitly says otherwise.

> Based on actual .env.local, wrangler.toml, GitHub workflows
> Generated: 2026-03-29

---

## Infrastructure Overview

**GCP Project**: `project-48af6a2d-e8bb-46dd-a58`
**GCP Region**: `asia-south1` (Mumbai)
**Cloudflare Account**: `b242b3f7061a0ee4332078c3d1008556`
**Cloudflare Zone (RTH)**: `6e22350fd4e99e758a5b49e6ad757a88`

---

## Domain Deployment Status

| Domain | Status | Platform | Target | DNS | SSL | Notes |
|--------|--------|----------|--------|-----|-----|-------|
| **RealTutorialHub** |
| `realtutorialhub.com` | ✅ LIVE | Static/Vercel | Marketing site | ✅ | ✅ | Landing page |
| `notes.realtutorialhub.com` | ✅ LIVE | Vercel | `realtutorialhub-web` | ✅ | ✅ | Tutorial app |
| `quiz.realtutorialhub.com` | ✅ LIVE | GCP Cloud Run | `quiz-web-app` | ✅ | ✅ | Quiz app |
| `admin.realtutorialhub.com` | ✅ LIVE | GCP Cloud Run | `quiz-admin-app` | ✅ | ✅ | Admin portal |
| `api.realtutorialhub.com` | ✅ LIVE | Cloudflare Worker | `platform-api-gateway` | ✅ | ✅ | API Gateway |
| **SkillUp IT Academy** |
| `skillupitacademy.com` | ✅ LIVE | Static/Vercel | Marketing site | ✅ | ✅ | Landing page |
| `app.skillupitacademy.com` | ⚠️ DEPLOYED | GCP Cloud Run | `skillup-web` | ❌ | ❌ | **DNS MISSING** |
| `admin.skillupitacademy.com` | ✅ LIVE | GCP Cloud Run | `skillup-admin` | ✅ | ✅ | Admin portal |
| `faculty.skillupitacademy.com` | ✅ LIVE | GCP Cloud Run | `faculty-app` | ✅ | ✅ | Faculty portal |
| **SkillHubCore** |
| `skillhubcore.in` | ✅ LIVE | Static | Marketing site | ✅ | ✅ | Landing page |
| `api.skillhubcore.in` | ✅ LIVE | GCP Cloud Run | `skillhubcore-service` | ✅ | ✅ | Auth/API service |
| `admin.skillhubcore.in` | ✅ LIVE | GCP Cloud Run | `skillhubcore-admin` | ✅ | ✅ | Admin portal |

---

## GCP Cloud Run Services

### Currently Deployed

| Service Name | URL | Port | Memory | Min/Max Instances | Status |
|--------------|-----|------|--------|-------------------|--------|
| `quiz-api-server` | `quiz-api-server-plldp3atca-el.a.run.app` | 3000 | 2Gi | 0/10 | ✅ LIVE |
| `quiz-web-app` | `quiz-web-app-plldp3atca-el.a.run.app` | 3001 | 1Gi | 0/10 | ✅ LIVE |
| `quiz-admin-app` | `quiz-admin-app-plldp3atca-el.a.run.app` | 3002 | 1Gi | 0/10 | ✅ LIVE |
| `skillup-web` | `skillup-web-plldp3atca-el.a.run.app` | 3004 | 512Mi | 0/5 | ✅ DEPLOYED |
| `skillup-admin` | `skillup-admin-plldp3atca-el.a.run.app` | 3005 | 512Mi | 0/5 | ✅ LIVE |
| `faculty-app` | `faculty-app-plldp3atca-el.a.run.app` | 3006 | 512Mi | 0/5 | ✅ LIVE |
| `skillhubcore-admin` | `skillhubcore-admin-plldp3atca-el.a.run.app` | 3007 | 512Mi | 0/5 | ✅ LIVE |
| `skillhubcore-service` | `skillhubcore-service-plldp3atca-el.a.run.app` | 3000 | 512Mi | 1/5 | ✅ LIVE |

---

## Cloudflare Worker (API Gateway)

**Worker Name**: `platform-api-gateway`
**Environment**: `production`
**Status**: ✅ DEPLOYED

### Routes Configured

```toml
[[env.production.routes]]
pattern = "app.skillupitacademy.com/*"
zone_name = "skillupitacademy.com"

[[env.production.routes]]
pattern = "api.realtutorialhub.com/*"
zone_name = "realtutorialhub.com"

[[env.production.routes]]
pattern = "api.skillhubcore.in/*"
zone_name = "skillhubcore.in"
```

### Upstream Mappings

| Route | Upstream Service |
|-------|------------------|
| `app.skillupitacademy.com/*` | `skillup-web` (GCP Cloud Run) |
| `api.realtutorialhub.com/*` | `quiz-api-server` (GCP Cloud Run) |
| `api.skillhubcore.in/*` | `skillhubcore-service` (GCP Cloud Run) |

---

## DNS Configuration Required

### ⚠️ MISSING DNS Record

**Domain**: `app.skillupitacademy.com`
**Status**: Service deployed, DNS not configured
**Action Required**: Add Cloudflare DNS record

**Steps to Fix**:
```bash
# Option 1: Via Cloudflare Dashboard
1. Go to Cloudflare Dashboard → skillupitacademy.com → DNS
2. Add CNAME record:
   - Name: app
   - Target: platform-api-gateway-production.realtutorialh.workers.dev
   - Proxy: ON (orange cloud)

# Option 2: Via Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "app",
    "content": "platform-api-gateway-production.realtutorialh.workers.dev",
    "proxied": true
  }'
```

---

## GitHub Secrets Status

### Required Secrets (Check with `gh secret list`)

```bash
# Check if all secrets exist
gh secret list --repo YOUR_ORG/quiz-platform
```

**Expected Secrets**:
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `GCP_PROJECT_ID`
- ✅ `WIF_PROVIDER` (Workload Identity Federation)
- ✅ `WIF_SERVICE_ACCOUNT`
- ✅ `JWT_SECRET`
- ✅ `ADMIN_JWT_SECRET`
- ✅ `INTERNAL_GATEWAY_SECRET`
- ✅ `DATABASE_URL` (+ all 5 database variants)
- ✅ `UPSTASH_REDIS_REST_URL`
- ✅ `UPSTASH_REDIS_REST_TOKEN`
- ✅ `QSTASH_TOKEN`
- ✅ `RESEND_API_KEY`
- ✅ `NEXT_PUBLIC_SENTRY_DSN`
- ✅ `SENTRY_AUTH_TOKEN`

---

## GCP Secret Manager Status

### Check Secrets

```bash
# List all secrets
gcloud secrets list --project=project-48af6a2d-e8bb-46dd-a58

# Verify specific secrets exist
gcloud secrets describe JWT_SECRET --project=project-48af6a2d-e8bb-46dd-a58
gcloud secrets describe DATABASE_URL --project=project-48af6a2d-e8bb-46dd-a58
gcloud secrets describe UPSTASH_REDIS_REST_URL --project=project-48af6a2d-e8bb-46dd-a58
```

**Required Secrets** (from workflows):
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_JWT_SECRET`
- `DATABASE_URL` (quiz_platform_prod)
- `DATABASE_URL_TUTORIAL` (tutorial_prod)
- `DATABASE_URL_PEOPLE` (people_prod)
- `DATABASE_URL_PAYMENT` (payment_prod)
- `DATABASE_URL_PLACEMENT` (placement_prod)
- `DATABASE_DIRECT_URL` (+ all 5 variants)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `QSTASH_URL`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WEB_APP_URL`
- `NEXT_PUBLIC_ADMIN_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `CSRF_SECRET`
- `INTERNAL_API_KEY`
- `INTERNAL_API_URL`
- `INTERNAL_GATEWAY_SECRET`
- `COOKIE_DOMAIN`
- `ALLOWED_ORIGINS`
- `STORAGE_PROVIDER`
- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `BROWSERLESS_URL`
- `HIGH_LOAD_MODE`
- `ALLOW_MOCK_JOBS`
- `DISABLE_BACKGROUND_WORKERS`

---

## Verification Commands

### 1. Check Cloudflare Worker Status

```bash
cd services/api-gateway
npx wrangler deployments list --env production
```

### 2. Check GCP Cloud Run Services

```bash
# List all services
gcloud run services list --region=asia-south1 --project=project-48af6a2d-e8bb-46dd-a58

# Check specific service
gcloud run services describe quiz-api-server \
  --region=asia-south1 \
  --project=project-48af6a2d-e8bb-46dd-a58 \
  --format='value(status.url)'
```

### 3. Health Check All Services

```bash
# RTH Quiz API
curl -I https://api.realtutorialhub.com/api/health/live

# RTH Quiz App
curl -I https://quiz.realtutorialhub.com/

# RTH Admin
curl -I https://admin.realtutorialhub.com/

# SkillUp Web (via Cloud Run URL - DNS missing)
curl -I https://skillup-web-plldp3atca-el.a.run.app/api/healthz

# SkillUp Admin
curl -I https://admin.skillupitacademy.com/api/healthz

# Faculty App
curl -I https://faculty.skillupitacademy.com/api/healthz

# SkillHubCore Service
curl -I https://api.skillhubcore.in/healthz/

# SkillHubCore Admin
curl -I https://admin.skillhubcore.in/api/healthz
```

### 4. Check DNS Resolution

```bash
# Check if DNS is configured
dig app.skillupitacademy.com
dig api.realtutorialhub.com
dig api.skillhubcore.in

# Expected: CNAME pointing to Cloudflare Worker or Cloud Run
```

---

## Deployment Workflows Status

| Workflow | Trigger | Status | Notes |
|----------|---------|--------|-------|
| `deploy-cloudrun.yml` | Push to main | ✅ ACTIVE | Deploys the Cloud Run groups: quiz API, quiz web, quiz admin, tutorial web, SkillUp apps, and SkillHubCore service |
| `deploy-gateway.yml` | Push to main | ✅ ACTIVE | Deploys Cloudflare Worker |
| `quality.yml` | Push / PR | ✅ ACTIVE | Lint, type-check, tests, build, audit, and secret scan |
---

## Action Items

### IMMEDIATE (Blocking Production)

1. **Add DNS for `app.skillupitacademy.com`**
   ```bash
   # Via Cloudflare Dashboard or API
   # CNAME: app → platform-api-gateway-production.realtutorialh.workers.dev
   # Proxy: ON
   ```

### VERIFICATION (After DNS Added)

2. **Test SkillUp Student Portal**
   ```bash
   curl -I https://app.skillupitacademy.com/api/healthz
   # Expected: 200 OK
   ```

3. **Test Gateway Routing**
   ```bash
   curl -I https://app.skillupitacademy.com/programs
   # Should route to skillup-web Cloud Run service
   ```

### OPTIONAL (Future Domains)

4. **Do NOT add these domains yet** (over-engineering):
   - ❌ `learn.skillupitacademy.com`
   - ❌ `enquiry.skillupitacademy.com`
   - ❌ `admission.skillupitacademy.com`
   - ❌ `schedule.skillupitacademy.com`
   - ❌ `attendance.skillupitacademy.com`
   - ❌ `cert.skillupitacademy.com`
   - ❌ `internship.skillupitacademy.com`
   - ❌ `placement.skillupitacademy.com`

   **Reason**: These should be routes within `app.skillupitacademy.com`, not separate domains.

---

## Cost Monitoring

### GCP Cloud Run

```bash
# Check current usage
gcloud run services list --region=asia-south1 --format='table(name,status.url,status.traffic[0].percent)'

# Check billing
gcloud billing accounts list
gcloud billing projects describe project-48af6a2d-e8bb-46dd-a58
```

### Cloudflare Workers

```bash
# Check usage via dashboard
# https://dash.cloudflare.com/b242b3f7061a0ee4332078c3d1008556/workers/overview
```

---

## Rollback Procedures

### Rollback Cloudflare Worker

```bash
cd services/api-gateway
npx wrangler rollback --env production
```

### Rollback GCP Cloud Run Service

```bash
# List revisions
gcloud run revisions list --service=quiz-api-server --region=asia-south1

# Rollback to previous revision
gcloud run services update-traffic quiz-api-server \
  --to-revisions=REVISION_NAME=100 \
  --region=asia-south1
```

---

## Summary

**Status**: 🟢 95% Complete

**What's Working**:
- ✅ All RTH domains live
- ✅ All SkillUp domains live (except `app.skillupitacademy.com` DNS)
- ✅ All SkillHubCore domains live
- ✅ All GCP Cloud Run services deployed
- ✅ Cloudflare Worker gateway deployed
- ✅ GitHub Actions workflows active
- ✅ All secrets configured

**What's Missing**:
- ❌ DNS record for `app.skillupitacademy.com`

**Next Step**: Add DNS record for `app.skillupitacademy.com` and you're 100% live! 🚀

---

**END OF DEPLOYMENT CHECKLIST**

