# AI Implementation Prompt: Phase 2 — Database Optimization (T92–T98)

**Objective**: Optimize database access patterns, eliminate N+1 queries, add transaction safety, and implement data retention and keyset pagination.

> [!IMPORTANT]
> Each task references **exact file paths and module names** from this codebase. Read each referenced file before implementing.

---

## T92: Configure Read Replica for Analytics Queries

**Goal**: Separate read traffic (analytics) from write traffic (exam submissions) using dual database clients.

### Current Database Setup

- Main DB client: `packages/db/src/index.ts` — Lazy singleton with Neon serverless
- Schema files: `packages/db/src/schema/` (11 files)
- Connection uses `DATABASE_URL` environment variable

### Implementation Steps

1. **Modify `packages/db/src/index.ts`**:
   - Keep existing `db` — Primary (read + write) using `DATABASE_POOL_URL`
   - Create new `dbReadOnly` — Read replica using `DATABASE_REPLICA_URL`
   - If `DATABASE_REPLICA_URL` is not set, fall back to primary (for dev environments)
   - Export: `export { db, dbReadOnly }`

2. **Queries that should use `dbReadOnly`** (analytics/reports, can tolerate slight staleness):
   - `apps/api-server/src/modules/admin-engine/analytics-admin.service.ts` — All analytics queries
   - `apps/api-server/src/modules/admin-engine/metrics-admin.service.ts` — Dashboard metrics
   - `apps/api-server/src/modules/report-engine/` — Report generation queries
   - `apps/api-server/src/modules/analytics/` — All 17 files
   - `apps/api-server/src/modules/dashboard-engine/` — Dashboard data

3. **Queries that MUST use primary `db`** (writes and critical reads):
   - `apps/api-server/src/modules/exam-engine/` — Exam creation, answer submission
   - `apps/api-server/src/modules/auth/` — Authentication (must read latest state)
   - `apps/api-server/src/modules/scoring-engine/` — Score writes
   - Any query immediately following a write

4. Update 3–5 service files as examples
5. Add `DATABASE_REPLICA_URL` to environment documentation

---

## T93: Fix N+1 in SelectionEngine (Batch Queries)

**Goal**: Reduce ~60 sequential DB queries per exam start down to 3–5.

### Target File

`apps/api-server/src/modules/selection-engine/` (15 files)

### Implementation Steps

1. **Read** the complete selection service to identify all sequential query loops
2. **Identify pattern**: WHERE clause in loop body fetching questions one-by-one
3. **Replace with batch queries**:
   - Single `WHERE id IN (...)` query instead of per-ID lookups
   - Combined filter query instead of per-filter loop
   - JOINs for related data (skills, topics) instead of per-question fetch
4. **Preserve deterministic keyset algorithm**:
   - SHA-256 chained anchors must produce identical results
   - Optimization changes HOW we fetch, not WHAT we fetch
5. **Target**: Maximum 3–5 queries per exam start
6. **Add timing logs**: Log total selection time, compare before/after
7. **Write test**: Same inputs → identical question set before and after

---

## T94: Fix N+1 in HierarchyFactory (Batch Upserts)

**Goal**: Reduce ~150 individual skill lookups per hierarchy import to 8–10 batch queries.

### Target File

`apps/api-server/src/modules/domain/` (40 files, focus on `hierarchy.factory.ts`)

### Implementation Steps

1. **Batch skill lookups**:
   - Before: `for (skill of skills) { await db.query.skills.findFirst({ where: eq(name, skill.name) }) }`
   - After: `const existing = await db.query.skills.findMany({ where: inArray(name, allSkillNames) })`
   - Single query finds all existing, then INSERT only missing ones

2. **Batch inserts**:
   - Use `db.insert(skills).values(newSkillRecords)` for bulk insert
   - Same for `topicSkills` bridge records — batch insert all at once

3. **Batch upserts per hierarchy level**:
   - Group all subjects for a domain → single `ON CONFLICT DO UPDATE`
   - Same for topics, subtopics

4. **Keep transaction integrity**: All batch operations within existing `db.transaction()`
5. **Target**: Maximum 8–10 queries per hierarchy import
6. **Write tests**: Identical results, transaction rollback still works

---

## T95: Add Missing Database Transactions

**Goal**: Wrap non-atomic multi-step writes in transactions to prevent inconsistent state.

### Files to Audit

| Module | Path | Files/Children |
|---|---|---|
| Admin Engine | `apps/api-server/src/modules/admin-engine/` | 17 files |
| Auth | `apps/api-server/src/modules/auth/` | 76 files |
| Exam Engine | `apps/api-server/src/modules/exam-engine/` | 23 files |
| Domain | `apps/api-server/src/modules/domain/` | 40 files |
| Scoring Engine | `apps/api-server/src/modules/scoring-engine/` | 26 files |
| System | `apps/api-server/src/modules/system/` | 46 files |

### Implementation Steps

1. **Search** for sequences of `db.insert`, `db.update`, `db.delete` without wrapping `db.transaction()`
2. **Wrap** multi-step writes in `db.transaction(async (tx) => { ... })`:

   **Candidates to check**:
   - User update + roles assignment → `user-admin.service.ts`
   - Signup (create user + profile + role) → `signup.service.ts`
   - Exam start (create exam + exam_questions) → Already transactional? Verify
   - `HierarchyFactory` → Already uses transaction? Verify coverage
   - Any cascading delete operations

3. **Transaction best practices**:
   - Use `tx` instead of `db` inside transaction
   - Keep transactions short — no API calls inside
   - Use READ COMMITTED isolation (default)
   - Log transaction failures with context
4. **Write tests** for 2–3 scenarios: success + partial-failure rollback

---

## T96: Create Data Retention Cleanup Jobs

**Goal**: Create automated cleanup for tables that grow indefinitely.

### Implementation Steps

1. **Create** `apps/api-server/src/modules/system/cleanup.service.ts`:

   | Function | Table | Retention |
   |---|---|---|
   | `cleanupExpiredRefreshTokens()` | `refresh_tokens` | 30 days |
   | `cleanupRevokedTokens()` | `refresh_tokens` (revoked) | 7 days |
   | `cleanupExpiredSessions()` | `sessions` | 24 hours past expiry |
   | `cleanupOldLoginAttempts()` | `login_attempts` | 90 days |
   | `cleanupExpiredVerificationTokens()` | `verification_tokens` | 7 days |
   | `cleanupExpiredPasswordResetTokens()` | `password_reset_tokens` | 24 hours |
   | `cleanupExpiredIdempotencyKeys()` | `idempotency_keys` | 24 hours |
   | `cleanupOldAuditLogs()` | `audit_logs` | 1 year (configurable) |

2. **Each function**: Use `DELETE ... WHERE created_at < $cutoff LIMIT 1000`, loop until < 1000 deleted
3. **Create** `cleanupAll()` orchestrator — runs all tasks sequentially, returns combined summary
4. **Create** API endpoint `/api/admin/maintenance/cleanup` (admin-authenticated, POST triggers, GET returns last summary)
5. **Create** Vercel Cron route handler — daily at 3:00 AM UTC
6. **Add** configurable retention via env vars: `RETENTION_REFRESH_TOKENS_DAYS=30`, etc.

---

## T97: Add CASCADE DELETE Safety Limits

**Goal**: Prevent long-running locks when deleting users with large datasets.

### Implementation Steps

1. **Create** `apps/api-server/src/modules/admin-engine/safe-delete.service.ts`:

   **`preDeleteCheck(userId: string): Promise<DeletionImpact>`**
   - Count affected records: exams, exam_questions, results, sessions, audit_logs
   - Return: `{ userId, examCount, questionCount, resultCount, totalAffectedRows, requiresConfirmation }`
   - `requiresConfirmation = true` if `totalAffectedRows > 1000`

   **`deleteUserSafely(userId: string): Promise<DeletionResult>`**
   - Delete `exam_questions` in batches of 500
   - Delete `results_by_dimension` in batches of 500
   - Delete `exams` in batches of 100
   - Delete sessions, tokens, login_attempts
   - Finally delete user record
   - Each batch = separate transaction (prevents long locks)
   - Log progress: "Deleted 500/2000 exam questions..."

   **`softDeleteUser(userId: string)`**
   - Set `deletedAt` timestamp, deactivate account
   - Data remains for audit
   - Hard delete runs later in background

2. **Update** admin delete user endpoint to call `preDeleteCheck` first, require confirmation if high impact
3. **Write tests**: Impact calculation, batched deletion, soft delete

---

## T98: Convert Admin Lists to Keyset Pagination

**Goal**: Replace OFFSET-based pagination with cursor-based for O(log N) performance at scale.

### Implementation Steps

1. **Create** `apps/api-server/src/lib/pagination.ts`:

   | Function | Signature | Purpose |
   |---|---|---|
   | `encodePageCursor()` | `(lastItem: { id, sortValue }) → string` | Base64 encode cursor |
   | `decodePageCursor()` | `(cursor: string) → { lastId, lastSortValue }` | Decode cursor |
   | `buildKeysetQuery()` | `(cursor, sortField, sortDir) → SQL WHERE` | Generate keyset clause |

2. **Keyset pattern**:
   - Before: `SELECT * FROM users ORDER BY created_at DESC OFFSET 100 LIMIT 20`
   - After: `SELECT * FROM users WHERE (created_at < $cursor_val OR (created_at = $cursor_val AND id < $cursor_id)) ORDER BY created_at DESC LIMIT 20`
   - Response: `{ data: [...], nextCursor: "encoded", hasMore: boolean }`

3. **Convert endpoints** (search in `apps/api-server/src/modules/admin-engine/`):
   - `user-admin.service.ts` → keyset by `created_at`
   - `question-admin.service.ts` → keyset by `created_at`
   - `audit-admin.service.ts` → keyset by `created_at`
   - Exam list → keyset by `started_at`

4. **Backward compatibility**: Support both `?page=&pageSize=` (old, deprecated) and `?cursor=&limit=` (new)
5. **Update** admin app frontend components to use cursor-based "Load More" / infinite scroll
6. **Write tests**: Cursor encode/decode, keyset correctness, first/last page, empty results
