# Scalability Plan

Objective
- Define the phased plan to move from current architecture to multi-region scale.

Phase 0 - Security and safety
- Lock down /api/migrate with internal-only access.
- Enforce admin-only checks for factory endpoints.
- Remove access tokens from localStorage and use httpOnly cookies.

Phase 1 - Performance baseline
- Add database indexes on hot paths (exam_id, question_id, topic_id, difficulty, status).
- Replace ORDER BY RANDOM with scalable selection.
- Add caching for static configuration and blueprint data.

Phase 1a - Sampling (minimal)
- Build pre-shuffled pools per topic/difficulty and rotate on schedule.
- Add deterministic seed-based selection to allow audit and replay.
- Avoid full-table random scans.

Phase 2 - Async scoring (minimal)
- On submit, write a submission event and return 202 Accepted.
- Add scoring worker that processes submissions and writes results.
- Add result polling endpoint or notification hook.
- Add idempotency key to submit endpoint to prevent double scoring.

Phase 3 - Multi-region
- Global traffic manager and regional failover.
- Read replicas in all regions.
- Cache replication for session config.

Phase 4 - Extreme scale
- Shard attempts and results by tenant and time.
- Move analytics to data warehouse.
- Heavy reporting served from pre-aggregated views.

Capacity planning
- Define expected RPS per endpoint.
- Define peak concurrent sessions per region.
- Build load tests for each core flow.

Acceptance criteria
- All critical endpoints meet latency targets under load.
- No single point of failure in data plane.
- Backpressure protects the system from cascading failures.
