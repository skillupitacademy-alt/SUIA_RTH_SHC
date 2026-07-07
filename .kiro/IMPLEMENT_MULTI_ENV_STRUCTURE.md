# 🏗️ Implementing Multi-Environment Structure (GCP-like on VPS)

## Problem
Currently ALL containers share ONE `.env.production` file, causing:
- ❌ Brand-specific configs (like `NEXT_PUBLIC_LOGIN_URL`) conflict
- ❌ All services see all secrets (security issue)
- ❌ Can't deploy one service without affecting others

## Solution: Multi-Layer Environment Structure

Following GCP Cloud Run model where each service had its own environment.

### Directory Structure

```
/opt/platform/env/
├── shared/
│   └── .env                    # Infrastructure (DB, Redis, R2, Sentry)
├── brands/
│   ├── realtutorialhub.env    # RTH brand configs
│   ├── skillup.env            # SUIA brand configs
│   └── skillhubcore.env       # SHC brand configs
└── services/
    ├── api-server.env
    ├── realtutorialhub-web.env
    ├── realtutorialhub-admin.env
    ├── realtutorialhub-quiz.env
    ├── skillup-web.env
    ├── skillup-admin.env
    ├── faculty-app.env
    ├── skillhubcore-admin.env
    ├── skillhubcore-service.env
    └── skillhub-placement.env
```

### Docker Compose Configuration

**Before** (current):
```yaml
x-app-defaults: &app-defaults
  env_file:
    - ${HOSTINGER_ENV_FILE:-../env/.env.production}  # ALL share this
```

**After** (proposed):
```yaml
services:
  realtutorialhub-web:
    env_file:
      - /opt/platform/env/shared/.env               # Infrastructure
      - /opt/platform/env/brands/realtutorialhub.env # Brand config
      - /opt/platform/env/services/realtutorialhub-web.env # Service config
  
  skillup-web:
    env_file:
      - /opt/platform/env/shared/.env
      - /opt/platform/env/brands/skillup.env        # Different brand!
      - /opt/platform/env/services/skillup-web.env
```

Docker Compose loads them in order - later files override earlier ones.

## Environment File Contents

### 1. Shared Infrastructure (`shared/.env`)
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis
REDIS_URL=...
REDIS_TOKEN=...

# Storage
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...

# Monitoring
SENTRY_DSN=...
SENTRY_ORG=...
SENTRY_PROJECT=...

# Logging
VECTOR_ENDPOINT=...

# API Gateway
INTERNAL_GATEWAY_SECRET=...

# Email
RESEND_API_KEY=...
```

### 2. Brand Configs (`brands/realtutorialhub.env`)
```bash
# Brand Identity
BRAND=realtutorialhub
PLATFORM=realtutorialhub

# Cookie Configuration  
COOKIE_DOMAIN_RTH=.realtutorialhub.com

# Public URLs
NEXT_PUBLIC_BRAND=realtutorialhub
NEXT_PUBLIC_SITE_URL=https://user.realtutorialhub.com
NEXT_PUBLIC_APP_URL=https://user.realtutorialhub.com
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com
NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com
NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com

# Gateway URLs
GATEWAY_URL=https://api.realtutorialhub.com
```

### 3. Brand Configs (`brands/skillup.env`)
```bash
# Brand Identity
BRAND=skillup
PLATFORM=skillup

# Cookie Configuration
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com

# Public URLs
NEXT_PUBLIC_BRAND=skillup
NEXT_PUBLIC_SITE_URL=https://user.skillupitacademy.com
NEXT_PUBLIC_APP_URL=https://user.skillupitacademy.com  
NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com
NEXT_PUBLIC_WEB_APP_URL=https://user.skillupitacademy.com
NEXT_PUBLIC_ADMIN_URL=https://admin.skillupitacademy.com
NEXT_PUBLIC_FACULTY_URL=https://faculty.skillupitacademy.com

# Gateway URLs
GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com
```

### 4. Service Configs (`services/realtutorialhub-web.env`)
```bash
# Service-specific overrides
PORT=3003
NODE_ENV=production

# Service name for logs
SERVICE_NAME=realtutorialhub-web

# Build-time variables (if needed)
# NEXT_PUBLIC_LOGIN_URL is NOT set - uses fallback in code
```

### 5. Service Configs (`services/skillup-web.env`)
```bash
# Service-specific overrides
PORT=3004
NODE_ENV=production

# Service name for logs
SERVICE_NAME=skillup-web

# Build-time variables (if needed)  
# NEXT_PUBLIC_LOGIN_URL is NOT set - uses fallback in code
```

### 6. Service Configs (`services/api-server.env`)
```bash
# API Server specific
PORT=3000
NODE_ENV=production
SERVICE_NAME=api-server

# JWT Keys
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Admin secrets
ADMIN_SECRET=...

# Payment keys (API needs these, frontends don't)
STRIPE_SECRET_KEY=...
RAZORPAY_KEY_SECRET=...
```

## Benefits

### 1. Security (Principle of Least Privilege)
**Before**:
```
RTH-Web sees: JWT_SECRET, STRIPE_SECRET, ADMIN_SECRET ❌
```

**After**:
```
RTH-Web sees: Only brand and public URLs ✅
API-Server sees: JWT_SECRET, STRIPE_SECRET ✅
```

### 2. Brand Isolation
**Before**:
```
NEXT_PUBLIC_LOGIN_URL=https://user.realtutorialhub.com/login
  ↓
Both RTH and SUIA use RTH login URL ❌
```

**After**:
```
RTH-Web: brands/realtutorialhub.env → RTH URLs ✅
SUIA-Web: brands/skillup.env → SUIA URLs ✅
```

### 3. Independent Deployments
**Before**:
```
Change SUIA config → ALL containers restart ❌
```

**After**:
```
Change brands/skillup.env → Only SUIA services restart ✅
Change services/api-server.env → Only API restarts ✅
```

### 4. Easier Maintenance
**Before**:
```
500+ lines in one .env.production file 😰
```

**After**:
```
shared/.env: ~50 lines (infrastructure)
brands/skillup.env: ~30 lines (brand config)
services/skillup-web.env: ~10 lines (service overrides)
```

## Implementation Steps

### Step 1: Create Directory Structure
```bash
ssh hostinger-quiz-platform-root

cd /opt/platform/env
mkdir -p shared brands services
```

### Step 2: Split Current .env.production
```bash
# Backup current file
cp .env.production .env.production.backup.$(date +%Y%m%d)

# Create new files (see templates in next section)
```

### Step 3: Update docker-compose.yml
Change from:
```yaml
x-app-defaults: &app-defaults
  env_file:
    - ${HOSTINGER_ENV_FILE:-../env/.env.production}
```

To:
```yaml
services:
  api-server:
    env_file:
      - /opt/platform/env/shared/.env
      - /opt/platform/env/services/api-server.env
  
  realtutorialhub-web:
    env_file:
      - /opt/platform/env/shared/.env
      - /opt/platform/env/brands/realtutorialhub.env
      - /opt/platform/env/services/realtutorialhub-web.env
  
  skillup-web:
    env_file:
      - /opt/platform/env/shared/.env
      - /opt/platform/env/brands/skillup.env
      - /opt/platform/env/services/skillup-web.env
  
  # ... etc for each service
```

### Step 4: Rebuild Containers
```bash
cd /opt/platform/apps/quiz-platform

# Rebuild with new env structure
./infra/hostinger/scripts/build.sh

# Deploy
./infra/hostinger/scripts/deploy.sh
```

### Step 5: Verify
```bash
# Check each container sees correct env
docker exec quiz-platform-skillup-web-1 env | grep NEXT_PUBLIC_LOGIN_URL
# Should be empty or show SUIA URL

docker exec quiz-platform-realtutorialhub-web-1 env | grep NEXT_PUBLIC_SITE_URL  
# Should show RTH URL
```

## Matches GCP Cloud Run Architecture

**GCP Cloud Run**:
```
RTH-Web Service
  ├─ Environment Variables (brand-specific)
  └─ Secrets (service-specific)

SUIA-Web Service
  ├─ Environment Variables (brand-specific)
  └─ Secrets (service-specific)
```

**VPS with Multi-Env** (same concept):
```
RTH-Web Container
  ├─ shared/.env (infrastructure)
  ├─ brands/realtutorialhub.env (brand-specific)
  └─ services/realtutorialhub-web.env (service-specific)

SUIA-Web Container
  ├─ shared/.env (infrastructure)
  ├─ brands/skillup.env (brand-specific)
  └─ services/skillup-web.env (service-specific)
```

## Rollout Strategy

1. ✅ Create new directory structure
2. ✅ Split .env.production into layered files
3. ✅ Test locally with one service (skillup-web)
4. ✅ Deploy to VPS for one service
5. ✅ Verify it works
6. ✅ Migrate remaining services one by one
7. ✅ Remove old .env.production once all migrated

## Future Benefits

- Easy to add new brands
- Easy to add new services
- Ready for Kubernetes migration (ConfigMaps + Secrets)
- Ready for Nomad migration (templates + vault)
- Better security audit trail

---

**Status**: Design complete. Ready to implement.  
**Impact**: Fixes brand redirect issue + improves security + matches GCP pattern
