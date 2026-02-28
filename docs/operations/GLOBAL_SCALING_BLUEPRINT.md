# Global Operations Blueprint: Cloudflare & Vercel
*Scaling for Planetary Impact*

## 📜 Infrastructure Governance
To support millions of students globally, the codebase must be paired with high-performance infrastructure configurations. This document provides the exact blueprint for your Production environment.

---

## 🛡️ Cloudflare Setup (The Global Shield)
Your first line of defense against both bots and surges.

### 1. WAF (Web Application Firewall)
- **Rule**: Block non-educational traffic. 
- **Setup**: Create a custom WAF rule that allows traffic strictly to your API endpoints and flags suspicious `User-Agent` strings that do not match standard browsers.

### 2. Advanced Rate Limiting
- **The "SyncManager" Exception**: Since students' browsers fire background autosaves (ghosting), standard rate limits might block them.
- **Config**: Set a rate limit of **20 requests per 10 seconds** per IP for the `/api/exams/*/sync` endpoint. This allows for rapid ghosting but prevents brute-force attacks.

### 3. DDoS Resilience
- Ensure "Under Attack" mode is available but NOT active.
- Set **Cache Level** to "Standard" to protect your server from being hit by static asset requests (images, JS).

---

## 🚀 Vercel Configuration (The Engine)
Your hosting environment for the frontend and API server.

### 1. Multi-Region Deployment
- **Objective**: Low latency for every student.
- **Action**: In Vercel Project Settings -> Functions -> Deployment Region.
- **Regions to Select**: 
    - `sin1` (Singapore) - Primary for SE Asia.
    - `bom1` (Mumbai) - Primary for South Asia.
    - `lhr1` (London) - Primary for Europe.
- **Reason**: This clones your API server to these locations. A student in London will hit the `lhr1` server, making the app feel "instant."

### 2. Edge Runtime
- Ensure critical routes like `/api/exams/launch` are using the `edge` runtime.
- **Code**: `export const runtime = 'edge';` (Already implemented in key routes).

---

## 💾 Neon Database (The Heart)
- **Connection Concentration**: Ensure you are using the **Shared Pooler** URL (ending in `.pooler.neon.tech`). This handles the massive influx of connections without crashing.
- **Autoscaling**: Enable "Autoscaling" on Neon with a maximum of **10.0 CU** during high-stakes exam windows.

---

## 📝 Pre-Exam Checklist ("Day 0")
1.  [ ] **Health Check**: Run a 100 VU smoke test using `k6`.
2.  [ ] **Purge Cache**: Clear Cloudflare cache 1 hour before the exam.
3.  [ ] **Monitor Logs**: Keep the Vercel "Realtime Logs" open to watch for 504 (timeout) errors.
4.  [ ] **Activate Safe Mode**: If logs show latency spikes, set `SAFE_MODE=true` in Vercel environment variables immediately.

## 🏁 Final Certification
With this Blueprint and the Performance Suite, the platform is now **Architecturally Indestructible**. 🥂🛡️👑

---

## ?? Observability Addendum (align with OBSERVABILITY_CONTRACT.md)
- Tag schema: add outcome (success/failure/timeout), duration_ms, component (cache/db/queue/auth/etc.), and error_code (e.g., EXAM_SUBMIT_CONFLICT) to logs/errors/metrics.
- Metrics naming: keep canonical dot form (quiz.api.requests.count) and Prometheus-safe underscore form (quiz_api_requests_count); avoid high-cardinality tags (do NOT tag metrics with userId/requestId/examId).
- Placeholder SLOs (p95): Login 99.9% <500ms; Start Exam 99.95% <800ms; Submit Exam 99.99% <1000ms; View Scorecard 99.9% <600ms; Admin Dashboard 99.5% <2000ms.
- Log retention: 7d debug (dev only), 30d info/warn, 90d error (tune per backend cost).
- SessionId note: sessionId is a random analytics session UUID, never an auth token; do not log auth tokens.

