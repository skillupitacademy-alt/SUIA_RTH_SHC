# AI Implementation Prompt: Phase 5 - Battle Hardening

**Task**: Implement Phase 5 Scaling (Battle Hardening) for the Quiz Platform API and Frontend.

## Context
The system already supports asynchronous processing and read/write splitting. We now need to offload idempotency to Redis and add client-side sync resilience.

## Core Requirements

### 1. Redis Idempotency (API-Server)
Modify `apps/api-server/src/modules/exam-engine/exam.engine.ts`:
- Locate `executeSubmitAnswer`.
- Instead of checking `tx.query.idempotencyKeys` for answer-level keys, use `cacheService.get` with key `idem:ans:${userId}:${idempotencyKey}`.
- If found, return early.
- If not found, proceed and then `cacheService.set` the key with a 24-hour TTL.

### 2. Synchronization Wrapper (Web-App)
Create `apps/web-app/src/services/sync-manager.ts`:
- Create a class to intercept exam answer submissions.
- Implement `submitWithRetry(payload: AnswerPayload)`:
  - Attempt to send to API.
  - On failure (network or 5xx), save to IndexedDB.
  - Implement a `syncLoop()` that checks IndexedDB every 30s and retries with exponential backoff + jitter.

### 3. Database Partitioning Guide
Prepare a migration file `000X_partitioning_strategy.sql`:
- Document the intent to partition `exams` (Range) and `exam_questions` (Hash).
- Provide the SQL template for creating the partition tables.

## Constraints
- Do not remove existing logic for `submitExam` idempotency (which should stay in Postgres for ACID safety).
- Ensure the frontend UI shows a "Syncing..." status when IndexedDB is active.
