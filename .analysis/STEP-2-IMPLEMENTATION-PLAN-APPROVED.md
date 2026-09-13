# STEP 2 — ARCHITECTURE & IMPLEMENTATION PLAN
## Block-Level Metrics Fix - Detailed Design

**Date:** 2026-09-07  
**Status:** ✅ APPROVED AS BASIS FOR STEP 3  
**Review:** User approval received with verification requirements

---

## APPROVAL STATUS

**Status:** ✅ **APPROVED**

**Approved Approach:** Design Option B — Fully Atomic Implementation

**Key Verification Requirement:** `firstViewedAt` logic must be verified against existing repository implementation before coding.

**Verification Result:** ✅ **COMPLETED** - Use existing `buildAtomicFirstViewedAtInit()` helper from page-level

---

## 1. Current Block Architecture

**Schema:** `packages/db-tutorial/src/schema/block-learning-state.ts`

**Key Fields:**
- `userId`, `navigationNodeId`, `blockId`, `blockVersion` (identity)
- `visitCount`, `revisionCount`, `activeTimeSec` (metrics)
- `firstViewedAt`, `lastViewedAt`, `completedAt` (timestamps)
- **❌ MISSING:** `lastSessionId` field

**Current Service Pattern (Lines 620-730):**
```
1. findOne() - SELECT existing state
2. JavaScript: isNewSession = (now - lastViewedAt) > 30 minutes
3. if first visit: upsert({ visitCount: 1 })
4. else if same session: upsert({ visitCount: 0 })
5. else: upsert({ visitCount: 1, revisionCount: isCompleted ? 1 : 0 })
```

**❌ Problems:**
- Read-then-write (TOCTOU race)
- Time heuristic instead of session identity
- Concurrent requests can double-count

---

## 2. Current Page-Level Architecture (PROVEN PATTERN)

**Schema:** Has `lastSessionId: text('last_session_id')`

**Repository Pattern (Lines 490-620):**
```typescript
// Single atomic UPDATE - NO SELECT
const [updated] = await this.dbInstance
  .update(tutorialNavigationProgress)
  .set({
    visitCount: buildAtomicVisitCountIncrement(
      col.visitCount,
      col.lastSessionId,  // Database compares
      event.sessionId
    ),
    revisionCount: buildAtomicRevisionCountIncrement(
      col.revisionCount,
      col.lastSessionId,
      col.status,  // 'completed' check
      event.sessionId
    ),
    lastSessionId: event.sessionId,  // Always update
    lastViewedAt: now,
  })
```

**SQL Helper (proven working):**
```typescript
export function buildAtomicVisitCountIncrement(
  visitCountColumn,
  lastSessionIdColumn,
  newSessionId
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
      THEN ${visitCountColumn} + 1
      ELSE ${visitCountColumn}
    END
  `;
}
```

**✅ Benefits:**
- Single atomic operation
- Database decides session transition
- Concurrency-safe
- Session identity, not time heuristic

---

## 3. Key Differences

| Aspect | Page-Level ✅ | Block-Level ❌ |
|--------|--------------|---------------|
| Schema | Has `lastSessionId` | Missing |
| Pattern | Single UPDATE | SELECT → decide → UPSERT |
| Decision | Database (SQL CASE) | JavaScript (30-min timeout) |
| Session | Identity-based | Time-based |
| Concurrency | Safe | Unsafe (race) |
| Drizzle API | Deprecated `where:` | Deprecated `where:` |

---

## 4. Required Schema Change

**Migration Required:** YES

```sql
ALTER TABLE block_learning_state 
ADD COLUMN last_session_id TEXT;
```

**TypeScript Schema:**
```typescript
lastSessionId: text('last_session_id'), // Nullable
```

**Rationale:**
- Must store session identity to detect transitions
- Nullable (NULL = no prior session, correct for first visit)
- No default needed
- No index needed (not queried independently)
- Existing rows: NULL is semantically correct

---

## 5. Repository Changes Required

**File:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

### Change 1: Fix Drizzle API (Line 315) ✅ SIMPLE

```diff
.onConflictDoUpdate({
  target: [...],
- where: sql`${blockLearningState.deletedAt} IS NULL`,
+ targetWhere: sql`${blockLearningState.deletedAt} IS NULL`,
  set: { ... }
})
```

### Change 2: Add SQL CASE Logic for Atomic Session Handling

```typescript
set: {
  // Atomic visit count - database decides session transition
  visitCount: buildAtomicVisitCountIncrement(
    blockLearningState.visitCount,
    blockLearningState.lastSessionId,
    data.lastSessionId
  ),
  
  // Atomic revision count - only if completed + session changed
  revisionCount: sql`
    CASE
      WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
        AND ${blockLearningState.completedAt} IS NOT NULL
      THEN ${blockLearningState.revisionCount} + 1
      ELSE ${blockLearningState.revisionCount}
    END
  `,
  
  // ✅ VERIFIED: Use existing page-level helper
  firstViewedAt: buildAtomicFirstViewedAtInit(
    blockLearningState.firstViewedAt,
    blockLearningState.lastSessionId,
    now
  ),
  
  lastSessionId: data.lastSessionId,  // Always update
  lastViewedAt: now,
  // ... other fields unchanged
}
```

### Change 3: Update Input Type

```typescript
export interface UpsertBlockLearningStateInput {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  lastSessionId?: string;  // NEW FIELD
  // ... other fields unchanged
}
```

---

## 6. Service Changes Required

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method:** `recordBlockVisit()` (Lines 544-732)

### Remove Time-Based Heuristic

**REMOVE:**
```typescript
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;  // DELETE
const existing = await findOne();  // DELETE
const isNewSession = ...;  // DELETE
```

**REPLACE WITH:**
```typescript
// Single atomic upsert - NO SELECT
const result = await this.blockLearningStateRepository.upsert({
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  lastSessionId: sessionId,  // NEW - always provide
  expectedTimeSec,
  lastViewedAt: now,
  // Visit/revision/firstViewedAt handled by SQL CASE in repository
});
```

**✅ Benefits:**
- No SELECT before write
- Database handles all session logic
- Concurrency-safe
- Matches page-level pattern

---

## 7. Visit Count Semantics (PROVEN SQL)

**Intended Behavior:**
- First visit: `visitCount = 1`
- Same session: no increment
- New session: `visitCount + 1`

**SQL Implementation:**
```sql
CASE
  WHEN last_session_id IS DISTINCT FROM $new_session
  THEN visit_count + 1
  ELSE visit_count
END
```

**Edge Cases (all handled correctly):**
- First visit: `NULL IS DISTINCT FROM 'abc'` → TRUE → increment ✅
- Same session: `'abc' IS DISTINCT FROM 'abc'` → FALSE → no increment ✅
- New session: `'abc' IS DISTINCT FROM 'xyz'` → TRUE → increment ✅

---

## 8. Revision Count Semantics (PROVEN SQL)

**Intended Behavior:**
- Revision = returning to **completed** block in **new** session
- Not completed: no increment
- Completed + same session: no increment
- Completed + new session: `revisionCount + 1`

**SQL Implementation:**
```sql
CASE
  WHEN last_session_id IS DISTINCT FROM $new_session
    AND completed_at IS NOT NULL
  THEN revision_count + 1
  ELSE revision_count
END
```

**Matches Page-Level Helper:**
```typescript
// Page uses: status = 'completed'
// Block uses: completedAt IS NOT NULL
// Same logic, different field
```

---

## 9. Active Time Semantics (NO CHANGE)

**Current Behavior:** ✅ **CORRECT - DO NOT MODIFY**

**Method:** `recordBlockActiveTime()` (Lines 732-850)

**Pattern:**
- Does NOT call `recordBlockVisit()`
- Does NOT modify `visitCount`
- Does NOT modify `lastSessionId`
- Only accumulates `activeTimeSec` atomically

**✅ This is correct and must be preserved**

Page-level equivalent also keeps time tracking separate from visit tracking (Line 467 in `tutorial-navigation-progress.repository.ts`).

---

## 10. firstViewedAt Logic (VERIFIED ✅)

### Current Repository Behavior (Line 337-338)

```typescript
firstViewedAt: data.firstViewedAt !== undefined 
  ? data.firstViewedAt 
  : blockLearningState.firstViewedAt,
```

**Pattern:** Service provides value, repository preserves if not provided.

### STEP 3 Implementation (VERIFIED CORRECT)

**Use existing page-level helper:**

```typescript
import { buildAtomicFirstViewedAtInit } from './tutorial-navigation-progress-sql.helpers';

// In repository set clause:
firstViewedAt: buildAtomicFirstViewedAtInit(
  blockLearningState.firstViewedAt,
  blockLearningState.lastSessionId,
  now
),
```

**Helper definition (already exists):**
```typescript
export function buildAtomicFirstViewedAtInit(
  firstViewedAtColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  currentTimestamp: Date
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS NULL
      THEN ${currentTimestamp}
      ELSE ${firstViewedAtColumn}
    END
  `;
}
```

**Why this is correct:**
- ✅ New records: `lastSessionId IS NULL` → set `firstViewedAt`
- ✅ Existing records after migration: `lastSessionId IS NULL` → set `firstViewedAt` on first post-migration visit
- ✅ Subsequent visits: `lastSessionId IS NOT NULL` → preserve `firstViewedAt`
- ✅ Matches page-level pattern exactly
- ✅ Service doesn't need to provide `firstViewedAt` explicitly

**Verification Result:** ✅ **APPROVED** - Reuse existing helper, pattern is correct.

---

## 11. Migration Plan

**File:** `packages/db-tutorial/migrations/0024_<name>.sql` (NEW)

```sql
-- Add last_session_id for atomic session-aware visit tracking
ALTER TABLE block_learning_state 
ADD COLUMN last_session_id TEXT;
```

**Generation:**
```bash
cd packages/db-tutorial
pnpm db:generate  # Drizzle Kit generates migration
```

**Execution:**
```bash
pnpm db:migrate  # Apply locally
```

**Rollback:**
```sql
ALTER TABLE block_learning_state DROP COLUMN last_session_id;
```

**Production Impact:** ✅ Safe
- Non-blocking (nullable column)
- No default computation
- Existing rows: `last_session_id = NULL` (correct initial state)
- No backfill needed

---

## 12. Test Plan

### Unit Tests (Update Existing)

**File:** `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`

**UPDATE:**
```typescript
it('increments visit on new session (session-based)', async () => {
  const first = await service.recordBlockVisit(
    testIdentity, 'node-1', 'subtopic-1', 'block-1', 'D1', 'session-A'
  );
  expect(first.visitCount).toBe(1);
  expect(first.lastSessionId).toBe('session-A');
  
  const second = await service.recordBlockVisit(
    testIdentity, 'node-1', 'subtopic-1', 'block-1', 'D1', 'session-B'
  );
  expect(second.visitCount).toBe(2);  // New session
  expect(second.lastSessionId).toBe('session-B');
});

it('does not increment visit on same session', async () => {
  await service.recordBlockVisit(..., 'session-A');
  const result = await service.recordBlockVisit(..., 'session-A');
  expect(result.visitCount).toBe(1);  // No increment
});
```

### Integration Tests (NEW - Critical)

**File:** `packages/db-tutorial/src/repositories/__tests__/block-learning-state.integration.test.ts` (NEW)

```typescript
describe('BlockLearningStateRepository - PostgreSQL Integration', () => {
  it('handles concurrent same-session visits atomically', async () => {
    // 5 concurrent requests, same new session
    await Promise.all([
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
    ]);
    
    const final = await repo.findOne(identity);
    expect(final.visitCount).toBe(1);  // NOT 5 ✅
  });
  
  it('increments visit exactly once for session transition', async () => {
    await repo.upsert({ ...identity, lastSessionId: 'session-A' });
    
    // Concurrent with new session
    await Promise.all([
      repo.upsert({ ...identity, lastSessionId: 'session-B' }),
      repo.upsert({ ...identity, lastSessionId: 'session-B' }),
    ]);
    
    const final = await repo.findOne(identity);
    expect(final.visitCount).toBe(2);  // 1 + 1, NOT 1 + 2 ✅
  });
});
```

---

## 13. Files Affected

**Schema & Migration:**
1. `packages/db-tutorial/src/schema/block-learning-state.ts` - Add `lastSessionId`
2. `packages/db-tutorial/migrations/0024_<name>.sql` - NEW migration

**Repository:**
3. `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`
   - Line 315: `where:` → `targetWhere:`
   - Import SQL helpers from page-level
   - Add SQL CASE logic using helpers
   - Update input type

**Service:**
4. `packages/db-tutorial/src/services/learning-progress.service.ts`
   - Remove `findOne()` call
   - Remove `SESSION_TIMEOUT_MS`
   - Simplify to single upsert

**Tests:**
5. `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts` - Update
6. `packages/db-tutorial/src/repositories/__tests__/block-learning-state.integration.test.ts` - NEW

---

## 14. Files NOT Affected

**✅ NO CHANGES NEEDED:**
- API routes (already pass `sessionId`)
- Frontend telemetry (already sends `sessionId`)
- Authentication (JWT unchanged)
- `recordBlockActiveTime()` method (separate from visits)
- Other database tables
- BFF routing

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Test coverage gap | Miss SQL bugs | Add PostgreSQL integration tests | ⚠️ Must do |
| Migration rollback | Data loss | Column nullable, safe to drop | ✅ Low risk |
| Existing rows NULL | First visit handling | `IS DISTINCT FROM` handles NULL | ✅ Safe |
| Active time broken | Metrics stop | Keep method unchanged, test separately | ✅ Safe |
| Repository API change | Other callers break | Only 2 callers, both updated | ✅ Safe |
| firstViewedAt logic | Wrong timestamp | Use proven helper, verified correct | ✅ Safe |

---

## 16. Implementation Sequence (STEP 3)

### Phase 1: Schema (5 min)
1. Update `block-learning-state.ts` - add `lastSessionId` field
2. Generate migration: `pnpm db:generate`
3. Apply locally: `pnpm db:migrate`
4. Verify column: `\d block_learning_state` in psql

### Phase 2: Repository (30 min)
5. Fix line 315: `where:` → `targetWhere:`
6. Import SQL helpers from `tutorial-navigation-progress-sql.helpers.ts`
7. Add `buildAtomicVisitCountIncrement()` for visitCount
8. Add SQL CASE for `revisionCount`
9. Add `buildAtomicFirstViewedAtInit()` for firstViewedAt
10. Persist `lastSessionId`
11. Update input type

### Phase 3: Service (15 min)
12. Remove `findOne()` call
13. Remove `SESSION_TIMEOUT_MS` logic
14. Simplify to single `upsert()` call with `lastSessionId`

### Phase 4: Tests (30 min)
15. Update unit test expectations
16. Add integration tests (concurrency)

### Phase 5: Verify (10 min)
17. Run test suite: `pnpm test`
18. Local smoke test: visit block, check database
19. Verify `visitCount`, `lastSessionId`, `firstViewedAt` correct

**Total Estimated Time:** ~90 minutes

---

## 17. Implementation Non-Goals

**STEP 3 should NOT:**
- ❌ Change API contract
- ❌ Change frontend telemetry
- ❌ Change authentication/session generation
- ❌ Change `recordBlockActiveTime()` method
- ❌ Change completion semantics
- ❌ Modify page-level metrics
- ❌ Refactor unrelated repositories
- ❌ Make unrelated schema changes
- ❌ Modify any code until STEP 3 explicitly authorized

---

## 18. Recommended Approach (APPROVED)

**✅ FULLY ATOMIC IMPLEMENTATION (Design Option B)**

**Why:**
1. Matches proven page-level pattern exactly
2. Eliminates TOCTOU race completely
3. Zero SELECT before upsert
4. Database-side session decision
5. Concurrency-safe by design
6. Reuses proven SQL helpers

**Implementation Complexity:** Moderate  
**Risk Level:** Low (pattern already proven)  
**Testing Effort:** Medium (add integration tests)  
**Deployment Impact:** Low (safe migration, no API changes)

---

## SUMMARY

**Two Problems, One Fix:**

1. **Drizzle API Bug:** `where:` → `targetWhere:` (1-word change)
2. **Architecture Bug:** Add `lastSessionId` + atomic SQL (follows proven pattern)

**Cannot fix #1 alone** - that leaves concurrency race.

**Must do both together** - schema migration + atomic SQL implementation.

**Pattern exists** - page-level already solved this identically.

**Key Verification:** ✅ `firstViewedAt` uses existing `buildAtomicFirstViewedAtInit()` helper

**Next:** STEP 3 implementation awaiting explicit user authorization.

---

**STEP 2 STATUS: ✅ COMPLETE AND APPROVED**

**Date Approved:** 2026-09-07  
**Approved By:** User review  
**Ready for:** STEP 3 implementation
