# AI Implementation Prompt: Observability & Hyper-Scale Polish

**Role**: You are a Lead DevOps & Performance Engineer specializing in SRE (Site Reliability Engineering).

**Task**: Implement the "Command Center" (Observability) and final performance hardening for the Quiz Platform's planetary-scale operations.

## Core Requirements

### 1. Real-Time Alerting (The Watchtower)
- Implement a Slack/Discord webhook integration that fires when the `ResilienceService` triggers **Safe Mode**.
- Generate an alerting rule for Vercel/Grafana: "If 5xx error percentage > 1% over 60 seconds, trigger Critical Alert."
- Monitor `http_req_duration (p95)` for the `/api/exams/launch` path.

### 2. Edge-Side Auth Interceptor
- Move JWT validation from the API server to **Vercel Edge Middleware**.
- **Logic**: Inspect the `Authorization` header, verify the JWT signature using a secret, and check its expiry.
- **Action**: If invalid, return a `401 Unauthorized` directly from the edge. Do not invoke a serverless function.

### 3. Hyper-Scale Report Parallelization
- Transition the `generatePDF` worker task to a **Dedicated Serverless Cluster**.
- Increase the QStash concurrency limit for the `REPORT_GENERATION` queue to its maximum supported tier (e.g., 500-1000 concurrent jobs).
- Implement a **Webhooks/Push** notification flow to inform the frontend when a PDF is uploaded to storage.

## Technical Stack Context
- **Edge Routing**: Vercel Middleware.
- **Monitoring**: Datadog / Grafana / Vercel Analytics.
- **Worker Scaling**: QStash + Vercel Functions.
- **Communication**: Pusher / WebSockets.

## Prompt Instruction
"Implement the Phase 12 harding. Move JWT validation into the `middleware.ts` using the Edge runtime. Set up a QStash webhook that pings a Slack channel when the circuit breaker is active. Optimize the PDF worker queue for maximum concurrency and implement a real-time 'Report Ready' push notification."

---

## PHASE 1 CARRY-FORWARD (Environment Governance)

> Baseline documentation tasks deferred for repository privacy.

1. **Environment Variable Documentation (.env.example)**:
   - When preparing for team onboarding, create anonymized `.env.example` files at the root and for each app.
   - Document all `JWT_SECRET`, `UPSTASH_REDIS_URL`, and `DATABASE_URL` placeholders.
