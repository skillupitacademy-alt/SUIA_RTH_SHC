# AI Implementation Prompt: Phase 2 — Carry-Forward Tasks (CF-3, CF-4, CF-6, CF-7)

**Objective**: Close out remaining Phase 1 carry-forward items before Phase 2 is considered complete.

> [!NOTE]
> CF-1 (Playwright) is deferred to last phase. CF-2 (Seed Scripts) is permanently removed. CF-5 (statement_timeout) is already closed.

---

## CF-3: Add Bundle Size CI Check (from Phase 1 Task 23)

**Current State**: `@next/bundle-analyzer` is installed. No CI job uses it.

### Implementation Steps

1. **Create** `.github/workflows/bundle-analysis.yml` (or add job to existing `ci.yml`):

   ```yaml
   bundle-check:
     runs-on: ubuntu-latest
     steps:
       - checkout, setup pnpm, install deps
       - run: ANALYZE=true pnpm turbo build
       - check total first-load JS for web-app < 500KB budget
       - check total first-load JS for admin-app < 600KB budget
       - upload .next/analyze/ as artifact
       - fail if budget exceeded
   ```

2. **Verify** both apps' `next.config.ts` files conditionally enable analyzer when `ANALYZE=true`
3. **Add** root scripts to `package.json`:
   - `"analyze:web": "ANALYZE=true pnpm --filter web-app build"`
   - `"analyze:admin": "ANALYZE=true pnpm --filter admin-app build"`

---

## CF-4: Vercel Preview CI Integration (from Phase 1 Task 24)

**Current State**: Vercel creates preview URLs on PRs. No CI checks run against them.

### Implementation Steps

1. **Create** `.github/workflows/preview-check.yml`:
   - Trigger: `deployment_status` event (fires when Vercel deploys)
   - Wait for deployment status `success`
   - Extract preview URL from deployment payload
   - Run `curl -sSf $PREVIEW_URL/api/healthz` (health check endpoint from T76)
   - Report pass/fail on PR
2. **Must work** on GitHub Free Tier (no Vercel Checks API needed)
3. **Add** timeout of 5 minutes for deployment wait

---

## CF-6: Apply `withTimeout` to Engine Queries (from Phase 1 Task 37)

**Current State**: `packages/db/src/utils/query-timeout.ts` exists with 4 presets:
- `QUICK_QUERY_TIMEOUT = 5000` (5s)
- `STANDARD_QUERY_TIMEOUT = 15000` (15s)
- `REPORT_QUERY_TIMEOUT = 30000` (30s)
- `MIGRATION_TIMEOUT = 120000` (120s)

Not applied to any engine queries yet.

### Implementation Steps

1. **Import** `withTimeout` and presets in target files
2. **Apply to ScoringEngine** at `apps/api-server/src/modules/scoring-engine/`:
   - `calculateExamResults()` → wrap heavy aggregation queries with `REPORT_QUERY_TIMEOUT`
   - Dimension scoring queries → `REPORT_QUERY_TIMEOUT`

3. **Apply to ExamEngine** at `apps/api-server/src/modules/exam-engine/`:
   - `startExam()` → `STANDARD_QUERY_TIMEOUT`
   - `submitAnswer()` → `QUICK_QUERY_TIMEOUT`
   - `completeExam()` → `STANDARD_QUERY_TIMEOUT`

4. **Apply to Admin Analytics** at `apps/api-server/src/modules/analytics/`:
   - All reporting/aggregation queries → `REPORT_QUERY_TIMEOUT`

5. **Apply to SelectionEngine** at `apps/api-server/src/modules/selection-engine/`:
   - Question selection queries → `STANDARD_QUERY_TIMEOUT`

6. **Wrap pattern**:
   ```typescript
   import { withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db/utils/query-timeout';
   const result = await withTimeout(
     db.select().from(exams).where(...),
     STANDARD_QUERY_TIMEOUT,
     'ExamEngine.startExam'
   );
   ```

---

## CF-7: Add Remaining Database Indexes (from Phase 1 Task 38)

**Current State**: 26 core indexes are implemented. 4 additional indexes identified during audit.

### Target Schema File

`packages/db/src/schema/auth.ts`

### Indexes to Add

| Index | Column(s) | Purpose |
|---|---|---|
| `idx_users_created_at` | `users.created_at` | Sorting/filtering users by registration date in admin dashboard |
| `idx_audit_logs_action` | `audit_logs.action` | Filtering audit logs by action type |
| `idx_audit_logs_created_at` | `audit_logs.created_at` | Time-range queries on audit logs |
| `idx_login_attempts_user_id` | `login_attempts.user_id` | Rate limiting lookups by user |

### Implementation Steps

1. **Open** `packages/db/src/schema/auth.ts`
2. **Add** indexes using Drizzle ORM's index API:
   ```typescript
   // In the table definition or as separate index declarations:
   index('idx_users_created_at').on(users.createdAt)
   index('idx_audit_logs_action').on(auditLogs.action)
   index('idx_audit_logs_created_at').on(auditLogs.createdAt)
   index('idx_login_attempts_user_id').on(loginAttempts.userId)
   ```
3. **Add comment** per index explaining which query pattern it optimizes
4. **Generate** migration: `pnpm drizzle-kit generate`
5. **Do NOT** auto-run the migration — review the generated SQL first
