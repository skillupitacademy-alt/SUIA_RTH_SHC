# PHYSICAL INFRASTRUCTURE DETAILS
## Complete Service Configurations

---

## **1. CLOUD RUN SERVICES (10 Total)**

All services deployed in **asia-southeast1** (Singapore) region.

---

### **1.1 quiz-api-server** (Main Backend API)

**Purpose**: Central API server handling all business logic, authentication, and database operations.

**Configuration**:
```yaml
Service Name: quiz-api-server
Region: asia-southeast1
Image: asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-api-server:latest
Port: 3000
Memory: 2Gi
CPU: 2
Concurrency: 1000 requests/instance
Min Instances: 0
Max Instances: 10
Allow Unauthenticated: Yes
```

**Public URLs**:
- https://api.realtutorialhub.com (via Cloudflare)
- https://api.skillupitacademy.com (via Cloudflare)

**Internal URL**:
- https://quiz-api-server-plldp3atca-as.a.run.app

**Environment Variables**:
```bash
NODE_ENV=production
CLOUD_RUN_BUILD=true
```

**Secrets (from GCP Secret Manager)**:
```bash
# Database URLs (7 databases)
DATABASE_URL=quiz_platform_prod
DATABASE_URL_RTH=rth_prod
DATABASE_URL_SKILLUP=skillup_prod
DATABASE_URL_TUTORIAL=tutorial_prod
DATABASE_URL_PEOPLE=people_prod
DATABASE_URL_PAYMENT=payment_prod
DATABASE_URL_PLACEMENT=placement_prod

# JWT Secrets
JWT_SECRET=user_token_secret
JWT_REFRESH_SECRET=refresh_token_secret
ADMIN_JWT_SECRET=admin_token_secret

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=redis_url
UPSTASH_REDIS_REST_TOKEN=redis_token

# QStash (Background Jobs)
QSTASH_URL=qstash_url
QSTASH_TOKEN=qstash_token
QSTASH_CURRENT_SIGNING_KEY=signing_key
QSTASH_NEXT_SIGNING_KEY=next_signing_key

# Email (Resend)
RESEND_API_KEY=resend_key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=sentry_dsn
SENTRY_AUTH_TOKEN=sentry_token

# Security
CSRF_SECRET=csrf_secret
INTERNAL_API_KEY=internal_key
INTERNAL_GATEWAY_SECRET=gateway_secret
COOKIE_DOMAIN=.realtutorialhub.com
ALLOWED_ORIGINS=allowed_origins

# Storage (Cloudflare R2)
STORAGE_PROVIDER=r2
R2_ENDPOINT=r2_endpoint
R2_BUCKET=r2_bucket
R2_ACCESS_KEY_ID=r2_key
R2_SECRET_ACCESS_KEY=r2_secret

# PDF Generation
BROWSERLESS_URL=browserless_url

# Feature Flags
HIGH_LOAD_MODE=false
ALLOW_MOCK_JOBS=false
DISABLE_BACKGROUND_WORKERS=false
```

**Direct Database Access**: ALL 7 databases
**Framework**: Next.js 14 (API Routes)
**Build**: Multi-stage Docker with pnpm workspace

---

### **1.2 quiz-admin-app** (RTH Admin Dashboard)

**Purpose**: Admin dashboard for RealTutorialHub brand.

**Configuration**:
```yaml
Service Name: quiz-admin-app
Region: asia-southeast1
Image: asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-admin-app:latest
Port: 3002
Memory: 1Gi
CPU: 1
Concurrency: 1000 requests/instance
Min Instances: 0
Max Instances: 10
Allow Unauthenticated: Yes
```

**Public URL**:
- https://admin.realtutorialhub.com (via Cloudflare)

**Internal URL**:
- https://quiz-admin-app-plldp3atca-as.a.run.app

**Environment Variables**:
```bash
NODE_ENV=production
CLOUD_RUN_BUILD=true
```

**Secrets**:
```bash
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api
NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com
NEXT_PUBLIC_SENTRY_DSN=sentry_dsn
SENTRY_AUTH_TOKEN=sentry_token
JWT_SECRET=user_token_secret
JWT_REFRESH_SECRET=refresh_token_secret
ADMIN_JWT_SECRET=admin_token_secret
DATABASE_URL_TUTORIAL=tutorial_prod
DATABASE_DIRECT_URL_TUTORIAL=tutorial_prod_direct
COOKIE_DOMAIN=.realtutorialhub.com
CSRF_SECRET=csrf_secret
INTERNAL_API_URL=internal_api_url
```

**Direct Database Access**: `tutorial_prod` only (for BFF routes)
**Framework**: Next.js 14 (App Router)

---

### **1.3 quiz-web-app** (Quiz Platform)

**Configuration**:
```yaml
Service Name: quiz-web-app
Region: asia-southeast1
Port: 3001
Memory: 1Gi
CPU: 1
Max Instances: 10
```

**Public URL**:
- https://quiz.skillhubcore.in (via Cloudflare)

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api
NEXT_PUBLIC_WEB_APP_URL=https://quiz.skillhubcore.in
NEXT_PUBLIC_TUTORIAL_APP_URL=https://tutorial.skillhubcore.in
```

---

### **1.4 realtutorialhub-web** (Tutorial Platform)

**Configuration**:
```yaml
Service Name: realtutorialhub-web
Region: asia-southeast1
Port: 3003
Memory: 1Gi
CPU: 1
Max Instances: 10
```

**Public URLs**:
- https://user.realtutorialhub.com (via Cloudflare)
- https://tutorial.skillhubcore.in (via Cloudflare)

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api
INTERNAL_API_URL=[internal_url]
NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com
NEXT_PUBLIC_SITE_URL=https://user.realtutorialhub.com
NEXT_PUBLIC_LOGIN_URL=https://user.realtutorialhub.com/login
```

**Secrets**:
```bash
JWT_SECRET=user_token_secret
COOKIE_DOMAIN=.realtutorialhub.com
INTERNAL_API_KEY=internal_key
INTERNAL_GATEWAY_SECRET=gateway_secret
UPSTASH_REDIS_REST_URL=redis_url
UPSTASH_REDIS_REST_TOKEN=redis_token
QSTASH_TOKEN=qstash_token
TUTORIAL_HELP_REQUEST_TOPIC_URL=help_topic_url
CERTIFICATE_ISSUED_EVENT_URL=cert_event_url
```

---

### **1.5 skillup-web** (SkillUp User Portal)

**Configuration**:
```yaml
Service Name: skillup-web
Region: asia-southeast1
Port: 3004
Memory: 512Mi
CPU: 1
Max Instances: 5
```

**Public URL**:
- https://user.skillupitacademy.com (via Cloudflare)

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api
INTERNAL_API_URL=[internal_url]
```

---

### **1.6 skillup-admin** (SkillUp Admin Portal)

**Configuration**:
```yaml
Service Name: skillup-admin
Region: asia-southeast1
Port: 3005
Memory: 512Mi
CPU: 1
Max Instances: 5
```

**Public URL**:
- https://admin.skillupitacademy.com (via Cloudflare)

---

### **1.7 faculty-app** (Faculty Portal)

**Configuration**:
```yaml
Service Name: faculty-app
Region: asia-southeast1
Port: 3006
Memory: 512Mi
CPU: 1
Max Instances: 5
```

**Public URL**:
- https://faculty.skillupitacademy.com (via Cloudflare)

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api
NEXT_PUBLIC_APP_URL=https://faculty.skillupitacademy.com
```

---

### **1.8 skillhubcore-admin** (SkillHub Admin)

**Configuration**:
```yaml
Service Name: skillhubcore-admin
Region: asia-southeast1
Port: 3007
Memory: 512Mi
CPU: 1
Max Instances: 5
```

**Public URL**:
- Internal only (no public route configured)

**Direct Database Access**: `people_prod`

---

### **1.9 skillhub-placement** (Placement Service)

**Configuration**:
```yaml
Service Name: skillhub-placement
Region: asia-southeast1
Port: 3008
Memory: 512Mi
CPU: 1
Max Instances: 5
```

**Public URL**:
- https://placement.skillhubcore.in (via Cloudflare)

**Direct Database Access**: `placement_prod`

---

### **1.10 skillhubcore-service** (SkillHub Core API)

**Configuration**:
```yaml
Service Name: skillhubcore-service
Region: asia-southeast1
Port: 3009
Memory: 512Mi
CPU: 1
Min Instances: 1
Max Instances: 5
```

**Public URL**:
- https://api.skillhubcore.in (via Cloudflare)

---

## **2. CLOUDFLARE WORKER**

### **2.1 platform-api-gateway**

**Purpose**: Edge gateway for routing, authentication, and brand resolution.

**Configuration**:
```toml
name = "platform-api-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[placement]
mode = "smart"  # Execute closer to Singapore backend
```

**Environment**: production

**Variables** (10 upstream URLs):
```bash
QUIZ_WEB_URL=https://quiz-web-app-plldp3atca-as.a.run.app
RTH_ADMIN_URL=https://quiz-admin-app-plldp3atca-as.a.run.app
SKILLUP_WEB_URL=https://skillup-web-plldp3atca-as.a.run.app
SKILLUP_ADMIN_URL=https://skillup-admin-plldp3atca-as.a.run.app
FACULTY_URL=https://faculty-app-plldp3atca-as.a.run.app
TUTORIAL_SERVICE_URL=https://realtutorialhub-web-plldp3atca-as.a.run.app
EXAM_SERVICE_URL=https://quiz-api-server-plldp3atca-as.a.run.app
NOTIFICATION_URL=https://quiz-api-server-plldp3atca-as.a.run.app
PLACEMENT_URL=https://skillhub-placement-plldp3atca-as.a.run.app
SKILLHUBCORE_URL=https://skillhubcore-service-plldp3atca-as.a.run.app
```

**Secrets**:
```bash
JWT_SECRET=user_token_secret
ADMIN_JWT_SECRET=admin_token_secret
INTERNAL_GATEWAY_SECRET=gateway_secret
```

**Routes** (13 total):
```toml
# RealTutorialHub
user.realtutorialhub.com/*
admin.realtutorialhub.com/*
api.realtutorialhub.com/*

# SkillUp IT Academy
user.skillupitacademy.com/*
admin.skillupitacademy.com/*
faculty.skillupitacademy.com/*
api.skillupitacademy.com/*

# SkillHubCore
quiz.skillhubcore.in/*
tutorial.skillhubcore.in/*
placement.skillhubcore.in/*
api.skillhubcore.in/*
```

**Framework**: Hono.js
**Runtime**: Cloudflare Workers (V8 isolates)
**Deployment**: Wrangler CLI

---

## **3. CONTAINER REGISTRY**

**Provider**: GCP Artifact Registry
**Region**: asia-southeast1
**Repository**: quiz-platform

**Images**:
```
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-api-server:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-admin-app:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-web-app:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/realtutorialhub-web:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/skillup-web:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/skillup-admin:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/faculty-app:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/skillhubcore-admin:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/skillhub-placement:latest
asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/skillhubcore-service:latest
```

**Tagging Strategy**:
- `:latest` - Latest production build
- `:$GITHUB_SHA` - Specific commit SHA (for rollback)

---

## **4. SECRETS MANAGEMENT**

**Provider**: GCP Secret Manager
**Access**: IAM-based (Workload Identity)
**Versioning**: Enabled (`:latest` tag)

**Secret Categories**:

### **4.1 Database Secrets** (7 databases)
```
DATABASE_URL
DATABASE_URL_RTH
DATABASE_URL_SKILLUP
DATABASE_URL_TUTORIAL
DATABASE_DIRECT_URL_TUTORIAL
DATABASE_URL_PEOPLE
DATABASE_URL_PAYMENT
DATABASE_URL_PLACEMENT
```

### **4.2 JWT Secrets**
```
JWT_SECRET
JWT_REFRESH_SECRET
ADMIN_JWT_SECRET
```

### **4.3 Redis & QStash**
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
QSTASH_URL
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY
```

### **4.4 Email & Monitoring**
```
RESEND_API_KEY
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
```

### **4.5 Security & Internal**
```
CSRF_SECRET
INTERNAL_API_KEY
INTERNAL_GATEWAY_SECRET
COOKIE_DOMAIN
ALLOWED_ORIGINS
```

### **4.6 Storage (Cloudflare R2)**
```
R2_ENDPOINT
R2_BUCKET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
```

---

## **5. NETWORKING**

### **5.1 DNS Configuration**

**Provider**: Cloudflare DNS

**RealTutorialHub (realtutorialhub.com)**:
```
user.realtutorialhub.com    → CNAME → Cloudflare Worker
admin.realtutorialhub.com   → CNAME → Cloudflare Worker
api.realtutorialhub.com     → CNAME → Cloudflare Worker
```

**SkillUp IT Academy (skillupitacademy.com)**:
```
user.skillupitacademy.com   → CNAME → Cloudflare Worker
admin.skillupitacademy.com  → CNAME → Cloudflare Worker
faculty.skillupitacademy.com → CNAME → Cloudflare Worker
api.skillupitacademy.com    → CNAME → Cloudflare Worker
```

**SkillHubCore (skillhubcore.in)**:
```
quiz.skillhubcore.in        → CNAME → Cloudflare Worker
tutorial.skillhubcore.in    → CNAME → Cloudflare Worker
placement.skillhubcore.in   → CNAME → Cloudflare Worker
api.skillhubcore.in         → CNAME → Cloudflare Worker
```

### **5.2 TLS/SSL**

**Provider**: Cloudflare
**Certificates**: Auto-managed (Let's Encrypt)
**Mode**: Full (strict)
**TLS Version**: 1.2+ (1.3 preferred)

---

## **6. MONITORING & OBSERVABILITY**

### **6.1 Error Tracking**
**Provider**: Sentry
**Integration**: All services
**DSN**: Configured via secrets

### **6.2 Logging**
**Provider**: GCP Cloud Logging
**Retention**: 30 days
**Log Levels**: INFO, WARN, ERROR

### **6.3 Metrics**
**Provider**: GCP Cloud Monitoring
**Metrics**: CPU, Memory, Request Count, Latency
**Alerts**: Configured for high error rates

### **6.4 Tracing**
**Implementation**: Custom correlation IDs
**Headers**: `x-request-id`, `x-correlation-id`
**Propagation**: Across all services

---

## **RESOURCE SUMMARY**

| Resource Type | Count | Provider | Region |
|---------------|-------|----------|--------|
| Cloud Run Services | 10 | GCP | asia-southeast1 |
| Cloudflare Workers | 1 | Cloudflare | Global |
| PostgreSQL Databases | 7 | Neon | AWS ap-southeast-1 |
| DNS Zones | 3 | Cloudflare | Global |
| Container Images | 10 | GCP Artifact Registry | asia-southeast1 |
| Secrets | 30+ | GCP Secret Manager | Global |
| Routes | 13 | Cloudflare | Global |

**Total Infrastructure Cost**: ~$500-1000/month (estimated)
