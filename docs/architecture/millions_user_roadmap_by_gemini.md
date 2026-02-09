# 🗺️ The "Billions of Users" Master Roadmap

## 1. Executive Snapshot
- **Current State**: Level 2 (Secure MVP). ~10k concurrent users.
- **Target State**: Level 5 (Global Scale). Millions of concurrent exams.
- **Critical Gap**: Synchronous scoring, single DB node, no observability, no CI/CD.

---

## 2. Phase-wise Execution Plan

### 🏗️ Phase 1: Engineering Hygiene (Weeks 1-2)
*Goal: Stop the bleeding. Enable safe, rapid iteration.*

#### 1.1 Automated Quality Gates
**Tech**: `husky` (pre-commit), `lint-staged`.
- [ ] Install Husky hooks for `tsc --noEmit` and `eslint`.
- [ ] Enforce Conventional Commits.
> **🤖 AI Prompt**:  
> "Configure Husky and lint-staged in my root package.json. I want to run `tsc --noEmit` and `eslint` on staged files before every commit. Also, strictly enforce Conventional Commits message format."

#### 1.2 The Testing Pyramid
**Tech**: `vitest` (fast unit tests), `react-testing-library`.
- [ ] Set up Vitest workspace.
- [ ] Write critical-path tests: Auth, Idempotency, Selection, Scoring Maths.
> **🤖 AI Prompt**:  
> "Set up Vitest in the `packages/db` and `apps/api-server` workspaces. Create a first integration test that spins up an in-memory Postgres, seeds a user, and verifies the `auth.login` function works correctly."

#### 1.3 Containerization
**Tech**: `Dockerfile`, `docker-compose`.
- [ ] Create optimized multi-stage `Dockerfile`.
- [ ] Create `docker-compose.yml` (API + DB + Redis).
> **🤖 AI Prompt**:  
> "Write a multi-stage `Dockerfile` for the `api-server` app. It should use `node:20-alpine`, respect `pnpm` workspaces, strict `.dockerignore`, and optimize for layer caching."

**✅ Phase 1 Acceptance Criteria**:
- CI is Green.
- >70% Test coverage on critical paths.
- Request-ID logs enabled in API.
- Environment checks fail if `REDIS_URL` is missing in prod.

---

### ⚡ Phase 2: Scale Foundations (Weeks 3-5)
*Goal: Decouple the monolith. The server never "waits".*

#### 2.1 Async Job Architecture
**Tech**: `BullMQ`, `Redis`.
- [ ] **Queue**: Create `scoring-queue` & `email-queue`.
- [ ] **Worker**: Create `apps/worker` service (Node/TS).
- [ ] **API**: `submit` returns `202 Accepted` + `statusUrl`.
- [ ] **Status**: New endpoint `/api/quiz/status/[id]` checked via Redis/DB.
> **🤖 AI Prompt**:  
> "Implement a generic `QueueService` using BullMQ. Create a dedicated `worker` process entry point. Update the `submitExam` API route to enqueue a job instead of processing inline. Implement the 202 status flow."

#### 2.2 Global Rate Limiting
**Tech**: `ioredis`, Token Bucket.
- [ ] **Redis Enforcement**: Make `UPSTASH_REDIS_REST_URL` mandatory.
- [ ] **Logic**: Sliding window counters per IP/User.
- [ ] **Middleware**: Block abusive traffic globally (across replicas).
> **🤖 AI Prompt**:  
> "Refactor `middleware.ts` to use centralized Redis-based Rate Limiting. Support different limits for auth vs anonymous users. Ensure it fails open safe or closed based on config."

#### 2.3 Edge Protection
**Tech**: `Cloudflare` / `AWS WAF`.
- [ ] **Access Control**: Block `/api/migrate` from public internet.
- [ ] **Caching**: Aggressive `s-maxage` for static/public data.
> **🤖 AI Prompt**:  
> "Generate a Cloudflare specific `next.config.js` configuration. Set up security headers (HSTS, CSP) and configure `stale-while-revalidate` caching strategy for Dashboard APIs."

**✅ Phase 2 Acceptance Criteria**:
- Submit returns 202 instantly (<500ms).
- Scoring happens in background worker.
- Status endpoint accurately reflects progress.
- API is guarded by CDN/WAF.

---

### 🗄️ Phase 3: Data & Delivery (Weeks 6-9)
*Goal: Database reliability and content delivery.*

#### 3.1 Advanced Data Layer
**Tech**: `PgBouncer`, Read Replicas.
- [ ] **Pooling**: Configure transaction pooling (port 6543).
- [ ] **Splitting**: Route `SELECT` reports to Read Replica.
> **🤖 AI Prompt**:  
> "Modify `drizzle.config.ts` to distinguish between Transaction Mode and Session Mode. Update Drizzle service layer to support Read/Write splitting with a `getDb('read'|'write')` helper."

#### 3.2 Object Storage
**Tech**: AWS S3 / R2.
- [ ] Offload exports/assets to S3.
- [ ] Use Signed URLs for secure access.
> **🤖 AI Prompt**:  
> "Implement an `StorageService` using AWS S3 SDK. Create a method to generate pre-signed upload URLs for user avatars and report exports."

#### 3.3 Frontend Performance
**Tech**: `next/image`, Code Splitting.
- [ ] Enable Brotli/Gzip.
- [ ] Implement exponential backoff for polling.
- [ ] Offline-friendly autosave retry logic.

**✅ Phase 3 Acceptance Criteria**:
- Report generation reads from Replica.
- Static assets served via CDN.
- Exports stored in S3.
- Database connection count is stable under load.

---

### 🛡️ Phase 4: Operational Excellence (Ongoing)
*Goal: SRE Maturity.*

#### 4.1 Observability
**Tech**: `OpenTelemetry`, `Jaeger`, `Prometheus`.
- [ ] Distributed Tracing (Middleware -> DB -> Redis).
- [ ] Metrics (RPS, Latency, Error Rate).
> **🤖 AI Prompt**:  
> "Add OpenTelemetry instrumentation to `api-server`. Trace HTTP requests, DB queries, and Redis calls. Export to a local Jaeger instance."

#### 4.2 Reliability Engineering
**Tech**: Blue/Green Deploys, Feature Flags.
- [ ] **Safe Deploys**: GitHub Actions for Blue/Green swap.
- [ ] **Flags**: Redis-based feature toggles.
> **🤖 AI Prompt**:  
> "Implement a strictly typed Feature Flag service using Redis. Allow toggling features per userId without redeployment."

#### 4.3 Disaster Recovery
**Tech**: Cross-Region Standby.
- [ ] PITR Backups.
- [ ] Failover playbook.

**✅ Phase 4 Acceptance Criteria**:
- Canary pipeline active.
- DR Test performed quarterly.
- Chaos drills (DB down) executed.

---

## 3. Role Ownership
- **Platform/SRE**: CDN, WAF, Gateway, IaC (Terraform), DR.
- **Backend Engineer**: Queue/Worker, Status Endpoint, Redis, DB Scaling.
- **Frontend Engineer**: Perf optimization, Polling logic, a11y/i18n.
- **QA Engineer**: Load/Soak scripts (k6), E2E Test Suite.

## 4. Next Steps
The path is clear. We cannot skip steps.
**Start Phase 1.1 immediately.**
