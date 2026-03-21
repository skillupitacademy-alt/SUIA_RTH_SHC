# GCP-Only Deployment Architecture
## Replacing Vercel — Complete Platform on Google Cloud Platform

> Decision: Remove Vercel. All services + frontend apps on GCP.
> k6 load testing: OCI free tier (permanent)
> Status: FINAL — Ready for implementation

---

## PART 1: What Changes When You Remove Vercel

```
BEFORE (with Vercel):                AFTER (GCP only):
──────────────────────               ──────────────────
Vercel → frontend apps               GCP Cloud Run → ALL apps + services
Vercel Edge → middleware             Cloudflare → CDN + WAF + DDoS (free)
Vercel ISR → page caching            Cloud CDN → static assets + page cache
Vercel Blob → file storage           GCS (Google Cloud Storage) → files
Railway → backend services           GCP Cloud Run → backend services
                                     OCI → k6 load testing + Grafana
```

### What You LOSE by leaving Vercel
```
❌ Vercel's automatic ISR (Incremental Static Regeneration)
   → Replace with: Cloud CDN cache + manual revalidation endpoint
❌ Vercel's image optimization (next/image automatic)
   → Replace with: next/image with GCS + Cloud CDN origin
❌ Vercel's Edge Middleware (runs at 200+ PoPs)
   → Replace with: Cloudflare Workers (still free, still global)
❌ Zero-config Next.js deployment
   → Replace with: Dockerfile + Cloud Run (one-time setup)
❌ Vercel Analytics
   → Replace with: Grafana on OCI (already in your stack)
```

### What You GAIN
```
✅ Everything in ONE GCP project (one dashboard, one bill)
✅ Private VPC between all services (no egress costs internally)
✅ Cloud CDN natively integrated with Cloud Run (same network)
✅ GCP Secret Manager for all environment variables
✅ No surprise bandwidth bills (GCP pricing more predictable)
✅ Your $300 GCP credit covers EVERYTHING (not split across providers)
✅ Full control over Docker containers (debug, customise, inspect)
✅ Cloud Run scales to 0 when idle → cost = $0 at night
```

---

## PART 2: Complete GCP Architecture

```
                        USER (anywhere in world)
                               │
                    ┌──────────▼──────────┐
                    │   Cloudflare         │
                    │   DNS + WAF + DDoS   │
                    │   (free forever)     │
                    └──────────┬──────────┘
                               │ HTTPS
                    ┌──────────▼──────────┐
                    │  GCP HTTP(S)         │
                    │  Load Balancer       │ ← Global anycast IP
                    │  + Cloud CDN         │ ← caches static assets
                    │  + Cloud Armor       │ ← GCP-side WAF
                    └──┬────────┬────────┬─┘
                       │        │        │
              ┌────────▼─┐ ┌───▼────┐ ┌─▼──────────┐
              │ student- │ │tutorial│ │  admin-app  │
              │   app    │ │  -app  │ │  crm-app    │
              │Cloud Run │ │Cloud   │ │  faculty-   │
              │(Next.js) │ │Run     │ │  app        │
              └────────┬─┘ └───┬────┘ └─┬──────────┘
                       │       │         │
                    ┌──▼───────▼─────────▼──┐
                    │   Cloudflare Workers   │
                    │   (API Gateway)        │ ← stays on Cloudflare edge
                    │   api.platform.com     │   zero cold start
                    └──┬────────┬────────┬──┘
                       │        │        │
              ┌────────▼─┐ ┌───▼────┐ ┌─▼──────────┐
              │  exam-   │ │tutorial│ │skillhubcore │
              │ service  │ │-service│ │  service    │
              │Cloud Run │ │Cloud   │ │  Cloud Run  │
              │          │ │Run     │ │             │
              └────────┬─┘ └───┬────┘ └─┬──────────┘
                       │       │         │
              ┌────────▼───────▼─────────▼──────────┐
              │            GCP VPC (private)          │
              │  Neon Postgres (external, 5 DBs)      │
              │  Upstash Redis + QStash (external)    │
              │  GCS Buckets (file storage)           │
              └───────────────────────────────────────┘

OCI (separate, free forever):
  ├── k6 load testing → fires requests at GCP Cloud Run
  ├── Grafana + Prometheus + Loki + Tempo
  └── Alertmanager
```

---

## PART 3: Every Service on Cloud Run

### Service Inventory

```
GCP Cloud Run Services (all in one project: platform-production):

FRONTEND APPS (Next.js — standalone output):
┌──────────────────┬──────────────────────────────┬──────────────┬───────────┐
│ Service Name     │ Domain                        │ Min Instance │ CPU/RAM   │
├──────────────────┼──────────────────────────────┼──────────────┼───────────┤
│ student-app      │ realtutorialhub.com           │ 1            │ 1/512MB   │
│ tutorial-app     │ notes.realtutorialhub.com     │ 0            │ 1/512MB   │
│ admin-app        │ admin.realtutorialhub.com     │ 1            │ 1/256MB   │
│ crm-app          │ enquiry.skillupitacademy.com  │ 0            │ 1/256MB   │
│ faculty-app      │ learn.skillupitacademy.com    │ 0            │ 1/256MB   │
└──────────────────┴──────────────────────────────┴──────────────┴───────────┘

BACKEND SERVICES (Hono):
┌──────────────────────┬──────────────────────────────┬──────────────┬──────────┐
│ Service Name         │ Internal URL                  │ Min Instance │ CPU/RAM  │
├──────────────────────┼──────────────────────────────┼──────────────┼──────────┤
│ exam-service         │ exam-svc.internal             │ 1            │ 1/512MB  │
│ tutorial-service     │ tutorial-svc.internal         │ 0            │ 1/512MB  │
│ skillhubcore-service │ core-svc.internal             │ 2            │ 1/256MB  │
│ skillup-service      │ skillup-svc.internal          │ 0            │ 1/256MB  │
│ payment-service      │ payment-svc.internal          │ 1            │ 1/256MB  │
│ notification-service │ notif-svc.internal            │ 0            │ 1/256MB  │
│ placement-service    │ placement-svc.internal        │ 0            │ 1/256MB  │
└──────────────────────┴──────────────────────────────┴──────────────┴──────────┘

NOT on Cloud Run (stays on Cloudflare):
  api-gateway → Cloudflare Workers (edge, zero cold start, free)
```

### Min-instance Reasoning
```
min-instances: 1 → exam-service (students cannot wait 2s cold start during exam)
min-instances: 2 → skillhubcore-service (auth cannot cold start — blocks every other request)
min-instances: 1 → payment-service (webhooks from Razorpay have 5s timeout)
min-instances: 1 → student-app (homepage must load instantly for new visitors)
min-instances: 0 → everything else (fine to cold start, saves $300 GCP credit)
```

---

## PART 4: Next.js on Cloud Run — The Dockerfile

The `output: "standalone"` setting tells Next.js to create a self-contained build that includes all necessary dependencies, making the Docker image much smaller because you don't need to copy the entire node_modules directory.

```dockerfile
# Dockerfile (identical for all Next.js apps — just change WORKDIR)
# Place at: apps/student-app/Dockerfile

FROM node:20-slim AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files (needed for monorepo resolution)
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/student-app/ ./apps/student-app/

# Install all deps
RUN pnpm install --frozen-lockfile

# Build this specific app
RUN pnpm --filter @platform/student-app run build

# ── RUNNER ──────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# Copy standalone output (self-contained, no node_modules needed)
COPY --from=builder /app/apps/student-app/.next/standalone ./
COPY --from=builder /app/apps/student-app/.next/static ./.next/static
COPY --from=builder /app/apps/student-app/public ./public

# Non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 8080
CMD ["node", "server.js"]
```

```typescript
// next.config.ts — required for standalone output
const nextConfig = {
  output: 'standalone',  // ← CRITICAL for Cloud Run deployment
  // Static assets served from GCS + Cloud CDN:
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.realtutorialhub.com'
    : '',
  images: {
    remotePatterns: [
      { hostname: 'storage.googleapis.com' },
      { hostname: 'cdn.realtutorialhub.com' }
    ]
  }
}
```

---

## PART 5: Static Assets — GCS + Cloud CDN

This replaces Vercel's automatic static asset CDN.

### The Two-Layer Static Asset Strategy

```
Layer 1: Next.js _next/static/ (JS, CSS, fonts)
  → Uploaded to GCS bucket: cdn.realtutorialhub.com
  → Served via Cloud CDN (cache-forever, immutable)
  → Cache-Control: public, max-age=31536000, immutable

Layer 2: Public assets (images, icons, manifest.json)
  → Same GCS bucket
  → Cache-Control: public, max-age=86400 (1 day)

Layer 3: SSR pages (HTML from Cloud Run)
  → Served by Cloud Run instance directly
  → Cache-Control: public, s-maxage=60 (Cloud CDN caches 60s)
  → Stale-while-revalidate: 600 (serve stale for 10min while refreshing)
```

### GCS Bucket Setup

```bash
# Create CDN bucket
gsutil mb -l asia-south1 gs://platform-static-assets

# Make public
gsutil iam ch allUsers:objectViewer gs://platform-static-assets

# Upload Next.js static assets after build
gsutil -m cp -r apps/student-app/.next/static/ \
  gs://platform-static-assets/_next/static/

# Set immutable cache headers on static assets
gsutil -m setmeta \
  -h "Cache-Control:public, max-age=31536000, immutable" \
  "gs://platform-static-assets/_next/static/**"

# Set up Cloud CDN in front of this bucket
# (done once via GCP Console: Load Balancing → CDN → Backend Bucket)
```

### Cloud CDN Setup (via gcloud)

```bash
# Create backend bucket pointing to GCS
gcloud compute backend-buckets create platform-static-cdn \
  --gcs-bucket-name=platform-static-assets \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC

# Create URL map routing static/* to GCS, rest to Cloud Run
gcloud compute url-maps create platform-url-map \
  --default-service=student-app-backend

# Add path matcher: /_next/static/* → GCS bucket
gcloud compute url-maps add-path-matcher platform-url-map \
  --path-matcher-name=static-assets \
  --default-service=student-app-backend \
  --backend-bucket-path-rules="/_next/static/*=platform-static-cdn"
```

---

## PART 6: Complete Domain → Cloud Run Routing

```
Cloudflare DNS records (proxy enabled = orange cloud):

realtutorialhub.com          → GCP Load Balancer IP (Cloudflare proxy)
notes.realtutorialhub.com    → GCP Load Balancer IP
quiz.realtutorialhub.com     → GCP Load Balancer IP
admin.realtutorialhub.com    → GCP Load Balancer IP
api.realtutorialhub.com      → Cloudflare Workers (not GCP)
cdn.realtutorialhub.com      → GCS bucket (Cloudflare proxy or GCP CDN)

skillupitacademy.com         → GCP Load Balancer IP
admin.skillupitacademy.com   → GCP Load Balancer IP
api.skillhubcore.in          → Cloudflare Workers

GCP Load Balancer routing rules:
  realtutorialhub.com/*              → student-app Cloud Run
  notes.realtutorialhub.com/*        → tutorial-app Cloud Run
  quiz.realtutorialhub.com/*         → student-app (exam routes)
  admin.realtutorialhub.com/*        → admin-app Cloud Run
  skillupitacademy.com/*             → crm-app Cloud Run
  admin.skillupitacademy.com/*       → admin-app Cloud Run
  /_next/static/*                    → GCS bucket (Cloud CDN)
```

---

## PART 7: GCP Secret Manager (Replaces Vercel Env Vars)

```bash
# Store all secrets in GCP Secret Manager
gcloud secrets create DATABASE_EXAM_URL \
  --replication-policy=user-managed \
  --locations=asia-south1

echo -n "postgresql://..." | gcloud secrets versions add DATABASE_EXAM_URL --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding DATABASE_EXAM_URL \
  --member="serviceAccount:exam-service@platform-production.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Reference in Cloud Run deployment:
gcloud run deploy exam-service \
  --set-secrets="DATABASE_EXAM_URL=DATABASE_EXAM_URL:latest,\
                 UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,\
                 JWT_SECRET=JWT_SECRET:latest"

# Each service gets its OWN service account
# with access ONLY to its own secrets
# → principle of least privilege
```

---

## PART 8: GitHub Actions → GCP Cloud Run CI/CD

```yaml
# .github/workflows/deploy-student-app.yml
name: Deploy student-app

on:
  push:
    branches: [main]
    paths:
      - 'apps/student-app/**'
      - 'packages/ui/**'
      - 'packages/types/**'

env:
  GCP_PROJECT: platform-production
  GCP_REGION: asia-south1
  SERVICE_NAME: student-app
  IMAGE: asia-south1-docker.pkg.dev/platform-production/platform/student-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # for Workload Identity Federation (no service account keys)

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP (keyless)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker asia-south1-docker.pkg.dev

      - name: Build Docker image
        run: |
          docker build \
            -f apps/student-app/Dockerfile \
            -t $IMAGE:${{ github.sha }} \
            -t $IMAGE:latest \
            .

      - name: Push to Artifact Registry
        run: |
          docker push $IMAGE:${{ github.sha }}
          docker push $IMAGE:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image=$IMAGE:${{ github.sha }} \
            --region=$GCP_REGION \
            --platform=managed \
            --min-instances=1 \
            --max-instances=100 \
            --memory=512Mi \
            --cpu=1 \
            --port=8080 \
            --set-secrets="NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL:latest" \
            --allow-unauthenticated

      - name: Upload static assets to GCS
        run: |
          # Upload _next/static to GCS after build
          gsutil -m cp -r apps/student-app/.next/static/ \
            gs://platform-static-assets/_next/static/
          # Set immutable cache headers
          gsutil -m setmeta \
            -h "Cache-Control:public, max-age=31536000, immutable" \
            "gs://platform-static-assets/_next/static/**"

      - name: Smoke test
        run: |
          sleep 20
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://realtutorialhub.com/healthz)
          [ "$STATUS" = "200" ] || exit 1
```

---

## PART 9: OCI → k6 Load Testing Setup

```bash
# On OCI free instance (2 AMD OCPU + 12GB RAM):

# Install k6
sudo gpg -k
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
  https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# k6 test script for exam-service (T130):
cat > exam-baseline.js << 'EOF'
import http from 'k6/http'
import { sleep, check } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp to 100 users
    { duration: '5m', target: 100 },   // hold at 100 users
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // 95% requests under 300ms
    http_req_failed: ['rate<0.001'],   // error rate < 0.1%
  },
}

export default function () {
  // Test exam submission endpoint
  const res = http.post(
    'https://exam.api.realtutorialhub.com/exam/submit',
    JSON.stringify({ examId: 'test-id', answers: [...] }),
    { headers: { 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${__ENV.TEST_TOKEN}` } }
  )
  check(res, { 'status 200 or 202': (r) => [200, 202].includes(r.status) })
  sleep(1)
}
EOF

# Run from OCI against GCP:
k6 run --env TEST_TOKEN=$TEST_TOKEN exam-baseline.js

# Results streamed to Grafana on OCI:
k6 run --out influxdb=http://localhost:8086/k6 exam-baseline.js
```

---

## PART 10: Cost Projection (GCP $300 Credit)

```
SERVICE                    COST/MONTH    NOTES
──────────────────────────────────────────────────────────────
Cloud Run (all services)   ~$40–60       Pay per request, scales to 0
  student-app (min: 1)     ~$8           Always 1 instance warm
  exam-service (min: 1)    ~$8           Always 1 instance warm
  skillhubcore (min: 2)    ~$12          2 instances always warm
  All others (min: 0)      ~$10–30       Cold start, low traffic initially

Artifact Registry          ~$2           Docker image storage
Cloud CDN                  ~$2–5         Static asset delivery (~100GB)
GCS (static assets)        ~$1           Storage cheap on GCP
Load Balancer              ~$18          Fixed cost per month (main cost!)
Secret Manager             ~$1           Per secret version
Cloud Build (optional)     ~$0–5         If used for builds (GitHub Actions free)
──────────────────────────────────────────────────────────────
TOTAL GCP/MONTH:           ~$75–95

$300 credit lasts:         3–4 months

AFTER CREDIT (move to OCI):
  Move tutorial-service + notification-service → OCI always-on
  Keep exam-service + auth on GCP (need Cloud Run auto-scaling on exam day)
  Estimated GCP after credit: ~$40–50/month

FREE FOREVER:
  Cloudflare: DNS + WAF + DDoS + Workers (API Gateway)
  OCI: 2 AMD OCPU + 12GB RAM (k6 + Grafana + 1-2 services)
  Neon Postgres: 5 databases free tier
  Upstash: Redis + QStash + Vector free tier
  Resend: 3,000 emails/month free
```

---

## PART 11: What to Update in Your Existing Blueprint Files

```
Files that said "Vercel" → now say "GCP Cloud Run":

MASTER-PLATFORM-ARCHITECTURE.md:
  CHANGE: "Deploy target: Vercel (frontends)" 
  TO:     "Deploy target: GCP Cloud Run (all apps + services)"

  CHANGE: "Vercel Analytics → Core Web Vitals per route"
  TO:     "Grafana on OCI → Core Web Vitals via web-vitals npm package"

  CHANGE: "Vercel Data Cache (revalidateTag)"
  TO:     "Cloud CDN cache + custom revalidation endpoint"

ADR-CRITICAL-001-integration-architecture.md:
  CHANGE: "student-app → Vercel (Next.js native, ISR, Edge)"
  TO:     "student-app → GCP Cloud Run (Docker standalone)"

  CHANGE: "Railway → backend services"
  TO:     "GCP Cloud Run → all services"

PHASE-T1-TUTORIAL-FOUNDATION.md:
  No change needed (backend only)

tutorial-subtopic-page.prompt.md:
  CHANGE Prompt 3: "unstable_cache revalidate" 
  → Still works on self-hosted Next.js via fetch cache
  → But ISR (Incremental Static Regeneration) needs manual implementation
  → Use: Cache-Control headers on route handlers instead of unstable_cache

PHASE-CICD-PIPELINE.md:
  REPLACE: "Vercel preview deployments" job
  WITH:    "GCP Cloud Run staging deployment" job (as shown in Part 8 above)
```

---

## PART 12: The One Thing That Changes Most — ISR

Vercel's ISR (Incremental Static Regeneration) was the biggest feature you
used. On self-hosted Next.js + Cloud Run, ISR works differently.

```
VERCEL ISR (automatic):
  export const revalidate = 3600
  → Vercel automatically caches and revalidates
  → Zero configuration needed

GCP CLOUD RUN ISR (manual):
  Option A: Use Cache-Control headers (simplest):
    Response headers: Cache-Control: public, s-maxage=3600,
                                     stale-while-revalidate=86400
    Cloud CDN respects these headers automatically
    → Content cached at GCP edge for 1 hour
    → Served stale for 24 hours while refreshing

  Option B: On-demand revalidation via API route:
    POST /api/revalidate?secret=XXX&path=/explore/full-stack
    → calls res.revalidate('/explore/full-stack') in Next.js
    → Works identically on self-hosted
    → Called by admin when content is published

  Recommendation: Use BOTH
    Static pages (domain/subject listings): Cache-Control s-maxage=3600
    Dynamic pages (student dashboard): no cache
    Admin publishes content: POST /api/revalidate to bust cache
```

---

## PART 13: Revised CLAUDE.md Deployment Section

```markdown
## Deployment (GCP Only — No Vercel)

### Frontend Apps (Next.js)
  Runtime: GCP Cloud Run (Docker standalone output)
  Build:   output: 'standalone' in next.config.ts (REQUIRED)
  Static:  _next/static/* uploaded to GCS → served via Cloud CDN
  Port:    8080 (Cloud Run default)
  Region:  asia-south1 (Mumbai — lowest latency for India)

### Backend Services (Hono)
  Runtime: GCP Cloud Run
  Port:    8080
  Secrets: GCP Secret Manager (never hardcoded env vars)

### API Gateway
  Runtime: Cloudflare Workers (stays on Cloudflare — NOT GCP)
  Reason:  Edge runtime, zero cold start, free, global

### Load Testing
  Runtime: OCI free tier (2 AMD OCPU + 12GB RAM)
  Tool:    k6
  Target:  GCP Cloud Run services
  Output:  Grafana dashboard on OCI

### Environments
  production: asia-south1 (Mumbai)
  staging:    asia-south1 (same region, separate Cloud Run revision)

### ISR Replacement
  Use Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
  NOT: export const revalidate = 3600 (Vercel-specific, ignored on Cloud Run)
  For on-demand: POST /api/revalidate (works identically self-hosted)

### Docker Build Command
  pnpm --filter @platform/[app-name] run build
  docker build -f apps/[app-name]/Dockerfile -t [image] .
  docker push [image]
  gcloud run deploy [service] --image=[image]
```

---

*Version: 2.0 | Vercel removed | GCP + OCI + Cloudflare only*
*Status: FINAL — supersedes all previous deployment references*
