# Scale Architecture

Goal
- Support billions of users over time and millions of concurrent exam sessions without downtime.

Current observed constraints (from repo)
- /api/migrate is public by code path.
- Access tokens are stored in localStorage.
- Question selection uses ORDER BY RANDOM().
- Scoring runs synchronously in the request path.
- Rate limiting is in-memory per instance.

Target architecture (logical)
- Edge: CDN + WAF + global traffic manager.
- Gateway: API gateway with auth, rate limiting, and request shaping.
- Control plane: authoring, governance, reporting, admin.
- Data plane: session orchestration, question delivery, answer capture, scoring, results.
- Event bus: async processing for scoring, reporting, and analytics.
- Storage: primary relational database + read replicas + cache + object storage.

Key principles
- Stateless services for horizontal scale.
- Idempotent write operations with request ids.
- Async scoring and reporting pipelines.
- Multi-region read with single-writer or regional write per tenant.
- Strict tenant isolation at data and cache layers.

Data plane flow (target)
1) Candidate starts session via gateway.
2) Session service creates or resumes session, stores state in cache.
3) Question delivery service fetches from precomputed blueprint or selection pool.
4) Answer capture writes to append-only event stream and fast store.
5) Scoring worker processes events asynchronously and writes results.
6) Report service reads from aggregated views.

Async scoring (minimal design)
- On submit, write an immutable submission event and return 202 Accepted.
- A scoring worker consumes the event, computes score, and writes results.
- Client polls a result endpoint or is notified when scoring completes.
- Use idempotency keys on submit to avoid double scoring.

Sampling strategy (minimal design)
- Do not use ORDER BY RANDOM on large tables.
- Use one of these safe patterns:
  - Pre-shuffled question pools per topic and difficulty, refreshed periodically.
  - Random id-range sampling on indexed columns with retries until count is reached.
  - Deterministic sampling using a seed (userId + examId) to ensure repeatability.

Performance targets (initial)
- Launch p95 <= 300ms
- Autosave p95 <= 200ms
- Submit p95 <= 800ms
- Scoring p95 <= 2s for objective questions

Storage design
- Primary DB for users, exams, questions, blueprints, attempts.
- Read replicas for reporting and admin dashboards.
- Cache (Redis) for sessions, rate limits, and hot config.
- Object store for exports and large assets.
- Event stream for audit, scoring, and analytics.

Scalability tactics
- Replace ORDER BY RANDOM with sampling by indexed id ranges or pre-shuffled pools.
- Use queue-based scoring; never score in the request path for large exams.
- Partition exam questions and results by tenant and time.
- Introduce bulk write paths for autosave.

Operational readiness
- SLOs, alerts, and runbooks are required before global launch.
