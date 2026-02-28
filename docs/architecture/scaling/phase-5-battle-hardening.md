# Phase 5: Battle Hardening & Long-Term Scaling

This phase focuses on ensuring the system remains indestructible as data grows from millions to billions of rows, and protecting the backend from "Thundering Herd" scenarios.

## Objectives
1. **Reduce Postgres Hot-Path Latency**: Offload idempotency checks to Redis.
2. **Horizontal Data Management**: Plan for table partitioning to maintain query speed at scale.
3. **Client-Side Resilience**: Implement background synchronization to handle network volatility.

## 1. Redis Idempotency Offloading
Currently, every exam answer submission performs a read and a write to the `idempotency_keys` table in Postgres.
- **Action**: Modify `ExamEngine` to check and set idempotency keys in Redis using a prefix `idem:ans:{userId}:{key}`.
- **TTL**: 24 hours (sufficient to prevent duplicates during a session).
- **Impact**: Removes ~50% of the Postgres operation count during active exams.

## 2. Table Partitioning (PostgreSQL)
As `exams` and `exam_questions` tables grow, indexes become too large to fit in memory.
- **exams**: Range partition by `started_at` (Monthly partitions).
- **exam_questions**: Hash partition by `exam_id` into 64 partitions to distribute I/O load.
- **Implementation**: Performed via SQL migrations. Ensure Drizzle ORM is configured to target the partition parent table.

## 3. Client-Side Resilience (IndexedDB)
Millions of users may lose connection simultaneously. When it returns, we must avoid a "Retry Storm".
- **Action**: Implement a `OfflineSyncService` on the frontend.
- **Storage**: Store answers in IndexedDB if the API returns a 5xx error or a timeout.
- **Strategy**: Background sync with **Jittered Exponential Backoff**.
- **Impact**: Backend remains stable even during mass reconnection events.
