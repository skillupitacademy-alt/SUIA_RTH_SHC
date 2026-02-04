# Remediation Roadmap

P0 (Immediate)
- Lock down /api/migrate or remove it in production.
  Done when:
  - /api/migrate is not reachable without internal secret
  - Production routing blocks or removes the endpoint

- Enforce admin checks for factory endpoints.
  Done when:
  - All /api/factory routes reject non-admin tokens
  - Admin role check covered by tests

- Add exam ownership checks for answer/state/result endpoints.
  Done when:
  - User can only read/write exams they own
  - Admin can access for support with audit log

P1 (High)
- Move access tokens to httpOnly cookies.
  Done when:
  - No accessToken in localStorage
  - Auth still works across web/admin subdomains

- Replace ORDER BY RANDOM with scalable selection.
  Done when:
  - Selection uses indexed sampling or pre-shuffled pools
  - Load test shows stable latency

- Add missing indexes for hot query paths.
  Done when:
  - Indexes exist for exam_id, question_id, topic_id, difficulty, status
  - Query plans confirm index usage

P2 (Medium)
- Move scoring to async pipeline.
  Done when:
  - Submit returns 202 Accepted
  - Worker computes score and updates results

- Add distributed rate limiting.
  Done when:
  - Rate limiting state stored in Redis or gateway

- Add caching for blueprint and session config.
  Done when:
  - Cache hit ratio > 80% for repeated exam launches

P3 (Long term)
- Multi-region failover.
  Done when:
  - Traffic can fail over without downtime

- Sharding of attempts and results.
  Done when:
  - Writes scale linearly with shards

- Analytics warehouse.
  Done when:
  - Reporting queries removed from primary DB
