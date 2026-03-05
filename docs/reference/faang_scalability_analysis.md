# FAANG/MAANG Scalability & Engineering Maturity Plan

## 1. Executive Snapshot
- Current level: **Level 2 – Secure MVP** (good for ~10k–50k users).
- Target: **Level 5 – Internet scale** (millions of concurrent exam sessions).
- Core posture: strong auth/RBAC/CSRF, deterministic question selection, idempotent start/submit. Missing: async processing, distributed infra, observability, CI/CD, DR/compliance.

## 2. Principle Audit (S.O.L.I.D / KISS / DRY / YAGNI)
- S: Services mostly single-purpose (ExamEngine, SelectionEngine, ScoringEngine).
- O/L: Extensible via engines; minimal inheritance. Safe.
- I: Interfaces implicit; add typed ports for queue/cache/db.
- D: Dependency injection is manual; introduce lightweight DI (factory/constructor injection).
- KISS/YAGNI: Good; keep monolith + worker split (avoid premature microservices).
- DRY: Validation and logging duplicated; extract shared schemas/constants.

## 3. 30-Point System Design Checklist (status)
- Edge/CDN/WAF/API GW: ? none.
- HTTP/REST basics: ?.
- Latency/Network: ?? no compression/edge caching.
- Proxy/Reverse proxy: ? not defined.
- DB: ? Postgres + indexes; ? replicas/partitioning.
- Caching: ?? local LRU + optional Redis; not enforced.
- Load balancer: ?.
- Vertical/Horizontal scaling: ?? stateless app but shared stores optional.
- Replication/Sharding/Partitioning: ?.
- Denormalization: ? selective; monitor.
- Message queue: ? (critical gap for scoring/reporting).
- Rate limiting: ?? per instance.
- API Gateway: ?.
- Idempotency: ? start/submit.
- CAP stance: choose AP for submit/status, ACID for authoring.
- Blob storage: ? (exports/assets).
- Webhooks/WebSockets: ?; optional later.

## 4. Architecture Target
- Edge: CDN + WAF + API Gateway (JWT at edge, per-route limits).
- Control plane: Next API (authoring, dashboards) + BFF endpoints.
- Data plane: Async scoring worker + status endpoint; queue (SQS/Kafka) + DLQ.
- Shared services: Redis (mandatory), Postgres primary + read replica, object storage.
- Observability: OpenTelemetry traces, structured logs, RED/USE metrics, SLOs.
- Safety: Feature flags, blue/green or canary, circuit breakers, timeouts, quotas.
- Compliance/ops: Backups/PITR, DR runbook, PII scrubbing, a11y/i18n groundwork.

## 5. Phase Plan (do in order)
### Phase 1 – Engineering Hygiene (1–2 weeks)
- Add CI (lint+typecheck+tests) and pre-commit hooks.
- Introduce Jest/Vitest; write critical-path tests (auth, idempotency, selection, scoring maths).
- Add pino/winston structured logger with request-id.
- Enforce env validation (Redis/SQS required in prod).

### Phase 2 – Scale Foundations (2–3 weeks)
- Redis required for rate-limit/cache/session keys; remove local-only fallback in prod.
- Queue + worker for scoring; submit returns 202 + status URL; add `/api/quiz/status/[id]` with Redis cache.
- CDN/WAF/API gateway in front; block `/api/migrate`; per-route rate limits.
- Connection hygiene: pool sizing, 3s timeouts, body size limits.
- Observability MVP: OTEL traces, metrics (RPS/latency/errors), health endpoints.

### Phase 3 – Data & Delivery (3–4 weeks)
- Postgres read replica + PgBouncer; route reporting reads to replica.
- Object storage for exports/assets; signed URLs.
- Backups/PITR tests; DR playbook; DLQ alerting.
- Compression (gzip/brotli), HTTP/2+, CDN caching for static/assets.
- Frontend perf: code-splitting, image optimization, polling with backoff, offline-friendly autosave retry.

### Phase 4 – Advanced Resilience & Growth (ongoing)
- Partitioning/sharding plan for exams/results by tenant/time.
- Feature flags + canary deploys.
- Security headers (HSTS, CSP, XFO), secrets manager, PII scrubber.
- Load/soak + chaos drills (DB down, Redis down, queue lag).
- i18n/a11y compliance; audit logging immutability.

## 6. Role/Owner Mapping (suggested)
- Platform/SRE: CDN/WAF/Gateway, IaC, observability, DR.
- Backend: Queue/worker, status endpoint, Redis enforcement, DB pooling/replica.
- Frontend: Perf optimizations, backoff/polling, a11y/i18n hooks.
- QA: Tests (unit/integration/E2E), load/soak scripts (k6).

## 7. Acceptance Criteria by Phase
- Phase 1: CI green; >70% critical-path coverage; request-id logs in API; env check fails without Redis URL in prod.
- Phase 2: Submit responds 202; scoring done by worker; status endpoint live; Redis-backed rate limits validated; gateway blocking `/api/migrate`.
- Phase 3: Replica serving reads; DLQ alarm wired; brotli enabled; static assets cached via CDN.
- Phase 4: Canary pipeline exists; quarterly DR test; chaos drill playbook executed.

## 8. Quick AI Prompt (reuse for future deep-dives)
```
You are a staff-level platform architect. Audit the repo for FAANG-scale readiness. Map findings to: Edge/Gateway, Compute, Data, Async, Caching, Observability, Security/Compliance, Frontend Perf, Release Safety. For each: current state (with file paths), risks at 1M concurrent users, and a phased remediation plan with acceptance criteria. Prioritize top 5 risks. Keep it under 400 words, explicit and actionable.
```

## 9. Next Steps (if/when implementing)
1) Wire Redis as mandatory and add global rate limiting. 2) Add SQS + worker scoring flow and status endpoint. 3) Put API behind CDN/WAF with JWT-at-edge. 4) Stand up observability (OTEL + metrics) and CI.

## 10. "Billions of Users" Master Roadmap (detailed prompts)
Strategy: Hygiene ? Async ? Distributed ? Global. Use these ready-to-run prompts to execute each step.

### Phase 1 – Engineering Hygiene
- Husky & lint-staged (Conventional Commits):
  - "Configure Husky and lint-staged in root package.json. Run `tsc --noEmit` and eslint on staged files pre-commit; enforce Conventional Commits message format."
- Testing pyramid (Vitest):
  - "Set up Vitest in packages/db and apps/api-server. Add an integration test that spins up in-memory Postgres, seeds a user, and verifies auth.login works."
- Containerization (Docker + compose):
  - "Write a multi-stage Dockerfile for api-server using node:20-alpine, pnpm workspaces, strict .dockerignore, cached layers. Create docker-compose with API + Postgres + Redis for local dev."

### Phase 2 – Decoupling & Async
- BullMQ queues:
  - "Implement QueueService (BullMQ) with email-queue and scoring-queue; worker entry processes jobs concurrently; submitExam enqueues instead of inline."
- Global rate limiting (Redis):
  - "Refactor middleware.ts to sliding-window Redis limiter; different limits for authenticated vs anonymous; shared across replicas."
- Edge caching/CDN:
  - "Update next.config.mjs/headers for Cache-Control s-maxage; add stale-while-revalidate for dashboard GETs."

### Phase 3 – Data at Scale
- Connection pooling:
  - "Adjust drizzle config to use PgBouncer; separate transaction vs session ports; add graceful timeouts."
- Read replicas (RW split):
  - "Create getDb(mode: 'read'|'write'); default SELECT to replica, mutations to primary."
- Partitioning:
  - "Generate SQL migration to partition exam_questions by created_at (monthly); explain index/unique impacts."

### Phase 4 – Operational Excellence
- Observability:
  - "Add OpenTelemetry to api-server; trace HTTP, DB, Redis; export to local Jaeger."
- Zero-downtime deploys:
  - "GitHub Actions workflow for blue/green: deploy staging slot, run smoke, swap traffic; document expand/contract DB migration pattern."
- Feature flags:
  - "Implement typed FeatureFlag service on Redis; toggle NewScoringEngine per user or globally without redeploy."

### Phase 5 – Global Scale & Compliance
- DR / Multi-region:
  - "Design DR with Postgres WAL shipping to standby region; script failover from primary outage."
- Audit/compliance:
  - "Build AuditLog service capturing before/after for admin writes; store in append-only table/immutable storage."
- i18n:
  - "Add next-i18next with locales/en|es|fr; extract strings from QuizSelectionConsole into translation keys."

Use these prompts as execution guides; keep phase order to control risk.

