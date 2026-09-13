# STEP 2 — ARCHITECTURE & IMPLEMENTATION PLAN
## Block-Level Metrics Fix - Detailed Design

**Date:** 2026-09-07  
**Status:** Design Phase (No code modifications)  
**Dependencies:** STEP 1 Investigation Complete

---

## 1. Current Block Architecture

**Schema:** `packages/db-tutorial/src/schema/block-learning-state.ts`

```typescript
export const blockLearningState = pgTable('block_learning_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  navigationNodeId: text('navigation_node_id').notNull(),
  blockId: text('block_id').notNull(),
  blockVersion: text('block_version').notNull(),
  
  visitCount: integer('visit_count').notNull().default(0),
  revisionCount: integer('revision_count').notNull().default(0),
  activeTimeSec: integer('active_time_sec').notNull().default(0),
  expectedTimeSec: integer('expected_time_sec'), // nullable
  
  firstViewedAt: timestamp('first_viewed_at', { mode: 'date' }),
  lastViewedAt: timestamp('last_viewed_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  
  // ❌ MISSING: lastSessionId field
  
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});
```

**Current Service Pattern (Lines 620-730):**
```
1. findOne() - SELECT existing state
2. JavaScript calculates: (now - lastViewedAt) > 30 minutes
3. if first visit: upsert({ visitCount: 1 })
4. else if same session: upsert({ visitCount: 0 })
5. else: upsert({ visitCount: 1, revisionCount: isCompleted ? 1 : 0 })
```

**Problems:**
- ❌ Read-then-write (TOCTOU race)
- ❌ Time-based heuristic instead of session identity
- ❌ Concurrent requests can double-count

---

## 2. Current Page-Level Architecture

**Schema:** `packages/db-tutorial/src/schema/tutorial-navigation-progress.ts`

```typescript
export const tutorialNavigationProgress = pgTable('tutorial_navigation_progress', {
  // ... other fields ...
  visitCount: integer('visit_count').notNull().default(0),
  revisionCount: integer('revision_count').notNull().default(0),
  lastSessionId: text('last_session_id'), // ✅ EXISTS
  // ... other fields ...
});
```

**Repository Pattern (Lines 490-620):**
```typescript
async recordVisit(event: TutorialVisitEvent) {
  // Single atomic UPDATE with SQL CASE
  const [updated] = await this.dbInstance
    .update(tutorialNavigationProgress)
    .set({
      visitCount: buildAtomicVisitCountIncrement(
        tutorialNavigationProgress.visitCount,
        tutorialNavigationProgress.lastSessionId,
        event.sessionId
      ),
      revisionCount: buildAtomicRevisionCountIncrement(
        tutorialNavigationProgress.revisionCount,
        tutorialNavigationProgress.lastSessionId,
        tutorialNavigationProgress.status,
        event.sessionId
      ),
      lastSessionId: event.sessionId, // Always update
      lastViewedAt: now,
      // ... other fields
    })
    .where(...)
    .returning();
}
```

**SQL Helper (tutorial-navigation-progress-sql.helpers.ts):**
```typescript
export function buildAtomicVisitCountIncrement(
  visitCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  newSessionId: string
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

**Benefits:**
- ✅ Single atomic operation
- ✅ Database decides session transition
- ✅ Concurrency-safe
- ✅ Session identity, not time heuristic

---

## 3. Exact Differences

| Aspect | Page-Level ✅ | Block-Level ❌ |
|--------|--------------|---------------|
| **Schema** | Has `lastSessionId` | Missing field |
| **Pattern** | Single UPDATE | SELECT → decide → UPSERT |
| **Decision** | Database (SQL CASE) | JavaScript (timeout) |
| **Session** | Identity-based | Time-based (30 min) |
| **Concurrency** | Safe (atomic) | Unsafe (race) |
| **Insert** | Uses `onConflictDoNothing()` | Uses `onConflictDoUpdate()` |
| **Conflict API** | Deprecated `where:` | Deprecated `where:` |

---

## 4. Required Schema Change

**Migration Required:** YES

**New Column:**
```sql
ALTER TABLE block_learning_state 
ADD COLUMN last_session_id TEXT;
```

**Rationale:**
- Must store session identity to detect transitions
- Nullable (existing rows will have NULL, meaning "no prior session")
- No default value needed (NULL is semantically correct for initial state)
- No index needed (not queried independently)

**TypeScript Schema Update:**
```typescript
lastSessionId: text('last_session_id'), // Nullable
```

**Soft-Delete Consideration:**
- Soft-deleted rows can retain `lastSessionId` (no cleanup needed)
- New active row after soft-delete starts with `lastSessionId = NULL`

---

## 5. Required Repository Change

**File:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

### Change 1: Fix Drizzle API (Line 315)

```diff
.onConflictDoUpdate({
  target: [...],
- where: sql`${blockLearningState.deletedAt} IS NULL`,
+ targetWhere: sql`${blockLearningState.deletedAt} IS NULL`,
  set: { ... }
})
```

### Change 2: Add `lastSessionId` to Input Type

```typescript
export interface UpsertBlockLearningStateInput {
  // Identity
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  
  // NEW: Session identity
  lastSessionId?: string; // NEW FIELD
  
  // Telemetry (unchanged)
  visitCount?: number;
  revisionCount?: number;
  // ...
}
```

### Change 3: Update Repository `upsert()` Method

**DO NOT change counter logic** - keep atomic increments  
**ADD** `lastSessionId` to INSERT values and UPDATE set:

```typescript
.values({
  // ... existing fields ...
  lastSessionId: data.lastSessionId ?? null, // NEW
})
.onConflictDoUpdate({
  target: [...],
  targetWhere: sql`${blockLearningState.deletedAt} IS NULL`,
  set: {
    // Counters unchanged (repository doesn't decide, service does)
    visitCount: data.visitCount !== undefined 
      ? buildAtomicTimeIncrement(...) 
      : blockLearningState.visitCount,
    
    // NEW: Always update session
    lastSessionId: data.lastSessionId !== undefined 
      ? data.lastSessionId 
      : blockLearningState.lastSessionId,
    
    // ... other fields unchanged ...
  }
})
```

**Note:** Repository remains passive - service still provides increment amounts.

---

## 6. Required Service Change

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method:** `recordBlockVisit()` (Lines 544-732)

### Strategy: Remove JavaScript Session Decision

**Current (Lines 620-730):**
```typescript
const existing = await findOne();
if (!existing) {
  upsert({ visitCount: 1 });
} else {
  const isNewSession = (now - lastViewedAt) > SESSION_TIMEOUT_MS;
  if (isNewSession) {
    upsert({ visitCount: 1, revisionCount: isCompleted ? 1 : 0 });
  } else {
    upsert({ visitCount: 0 });
  }
}
```

**Proposed:**
```typescript
// NO findOne() call
// Single upsert with conditional increments determined by SQL

await this.blockLearningStateRepository.upsert({
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  lastSessionId: sessionId, // NEW - always provide
  
  // DECISION: Keep service-layer logic or move to SQL?
  // See Section 7 for detailed design
});
```

**BUT WAIT:** Service currently needs `existing.completedAt` to determine revision increment.

**Problem:** If we remove `findOne()`, how do we know if block is completed?

**Options:**
1. Keep `findOne()` for completion check only (partial fix)
2. Move revision logic to SQL CASE (full atomic)
3. Use separate completion tracking

**Recommendation:** See Section 9 for revision semantics analysis.

---

## 7. Atomic Upsert Design

### Design Option A: Service-Layer Conditional (Hybrid)

**Service:**
```typescript
// Still need SELECT to check completedAt for revision logic
const existing = await this.blockLearningStateRepository.findOne({...});

const isCompleted = existing?.completedAt !== null;

await this.blockLearningStateRepository.upsert({
  userId,
  navigationNodeId,
  blockId,
  blockVersion,
  lastSessionId: sessionId, // NEW
  
  // Service determines increments based on completion state
  visitCount: 1, // Will be applied conditionally by SQL CASE in repository
  revisionCount: isCompleted ? 1 : 0,
  expectedTimeSec,
  firstViewedAt: !existing ? now : undefined,
  lastViewedAt: now,
});
```

**Repository (uses SQL CASE for session):**
```typescript
set: {
  visitCount: sql`
    CASE
      WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
      THEN ${blockLearningState.visitCount} + ${data.visitCount}
      ELSE ${blockLearningState.visitCount}
    END
  `,
  revisionCount: sql`
    CASE
      WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
      THEN ${blockLearningState.revisionCount} + ${data.revisionCount}
      ELSE ${blockLearningState.revisionCount}
    END
  `,
  lastSessionId: data.lastSessionId,
  // ...
}
```

**Analysis:**
- ✅ Fixes concurrency (session decision in SQL)
- ❌ Still has SELECT (but only for completion check, not session)
- ✅ Revision logic remains in service (simpler)
- ⚠️ Partial improvement

---

### Design Option B: Fully Atomic (Repository SQL CASE)

**Service:**
```typescript
// NO SELECT at all
await this.blockLearningStateRepository.upsert({
  userId,
  navigationNodeId,
  blockId,
  blockVersion,
  lastSessionId: sessionId, // NEW
  expectedTimeSec,
  lastViewedAt: now,
});
```

**Repository (determines EVERYTHING in SQL):**
```typescript
set: {
  visitCount: sql`
    CASE
      WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
      THEN ${blockLearningState.visitCount} + 1
      ELSE ${blockLearningState.visitCount}
    END
  `,
  
  revisionCount: sql`
    CASE
      WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
        AND ${blockLearningState.completedAt} IS NOT NULL
      THEN ${blockLearningState.revisionCount} + 1
      ELSE ${blockLearningState.revisionCount}
    END
  `,
  
  firstViewedAt: sql`
    CASE
      WHEN ${blockLearningState.lastSessionId} IS NULL
      THEN ${now}
      ELSE ${blockLearningState.firstViewedAt}
    END
  `,
  
  lastSessionId: data.lastSessionId,
  lastViewedAt: now,
  // ...
}
```

**Analysis:**
- ✅ Fully atomic (zero TOCTOU)
- ✅ Maximum concurrency safety
- ✅ Matches page-level pattern exactly
- ✅ No SELECT needed
- ⚠️ Revision logic in repository (more complex)

---

### Recommendation: **Option B (Fully Atomic)**

**Reasoning:**
1. Matches established page-level pattern
2. Eliminates SELECT entirely
3. Handles all edge cases atomically
4. Revision logic is simple: `completedAt IS NOT NULL AND session changed`
5. SQL helpers already exist for this pattern

---

## 8. Visit Count Semantics

**Current Behavior:** ✅ Correct logic, ❌ Wrong implementation

**Intended:**
- First visit: `visitCount = 1`
- Same session: `visitCount` no change
- New session: `visitCount + 1`

**SQL Implementation:**
```sql
visitCount = CASE
  WHEN last_session_id IS DISTINCT FROM $new_session_id
  THEN visit_count + 1
  ELSE visit_count
END
```

**Edge Cases:**
- First visit: `lastSessionId IS NULL`, `newSessionId IS NOT NULL` → `IS DISTINCT FROM` → increment ✅
- Same session: `lastSessionId = 'abc'`, `newSessionId = 'abc'` → NOT distinct → no increment ✅
- New session: `lastSessionId = 'abc'`, `newSessionId = 'xyz'` → IS DISTINCT FROM → increment ✅

**Confidence:** ✅ SQL pattern proven in page-level implementation

---

## 9. Revision Count Semantics

**Current Behavior (Service Lines 712-715):**
```typescript
const isCompleted = existing.completedAt !== null;
const revisionCount = isCompleted ? 1 : 0;
```

**Intended:**
- Revision = returning to a **completed** block in a **new** session
- Not completed yet: `revisionCount` no change
- Completed + same session: `revisionCount` no change
- Completed + new session: `revisionCount + 1`

**SQL Implementation:**
```sql
revisionCount = CASE
  WHEN last_session_id IS DISTINCT FROM $new_session_id
    AND completed_at IS NOT NULL
  THEN revision_count + 1
  ELSE revision_count
END
```

**Edge Cases:**
- First visit (not completed): no increment ✅
- Revisit same session (completed): no increment ✅
- Revisit new session (not completed): no increment ✅
- Revisit new session (completed): increment ✅

**Page-Level Equivalent (tutorial-navigation-progress.repository.ts Line 579):**
```typescript
revisionCount: buildAtomicRevisionCountIncrement(
  tutorialNavigationProgress.revisionCount,
  tutorialNavigationProgress.lastSessionId,
  tutorialNavigationProgress.status, // 'completed' status
  event.sessionId
)
```

**Helper (tutorial-navigation-progress-sql.helpers.ts Lines 94-107):**
```typescript
export function buildAtomicRevisionCountIncrement(
  revisionCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  statusColumn: PgColumn, // For page: status = 'completed'
  newSessionId: string
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
        AND ${statusColumn} = 'completed'
      THEN ${revisionCountColumn} + 1
      ELSE ${revisionCountColumn}
    END
  `;
}
```

**Block-Level Adaptation:**
```typescript
export function buildAtomicBlockRevisionCountIncrement(
  revisionCountColumn: PgColumn,
  lastSessionIdColumn: PgColumn,
  completedAtColumn: PgColumn, // For block: completedAt IS NOT NULL
  newSessionId: string
): SQL {
  return sql`
    CASE
      WHEN ${lastSessionIdColumn} IS DISTINCT FROM ${newSessionId}
        AND ${completedAtColumn} IS NOT NULL
      THEN ${revisionCountColumn} + 1
      ELSE ${revisionCountColumn}
    END
  `;
}
```

**Confidence:** ✅ Pattern matches page-level, adapted for block schema

---

## 10. Active Time Semantics

**Current Behavior:** ✅ Correct and should NOT change

**Method:** `recordBlockActiveTime()` (Lines 732-850)

**Pattern:**
- Does NOT call `recordBlockVisit()`
- Does NOT modify `visitCount`
- Does NOT modify `lastSessionId`
- Accumulates `activeTimeSec` atomically

**Implementation:** ✅ Already correct

```typescript
await this.blockLearningStateRepository.upsert({
  userId,
  navigationNodeId,
  blockId,
  blockVersion,
  activeTimeSec, // Accumulates atomically via buildAtomicTimeIncrement
  lastViewedAt: now,
  // NO visitCount, NO lastSessionId
});
```

**Repository handling:**
```typescript
activeTimeSec: data.activeTimeSec !== undefined
  ? buildAtomicTimeIncrement(blockLearningState.activeTimeSec, data.activeTimeSec)
  : blockLearningState.activeTimeSec,
```

**Must preserve:** This behavior MUST NOT change when fixing visit logic.

**Test coverage:** Phase 4.3 tests verify active time does NOT increment visits.

---

## 11. Completion Semantics

**Current Behavior:** Block completion tracked via `completedAt` timestamp

**Set By:** Separate logic (not in `recordBlockVisit`)

**Used By:** Revision count logic (see Section 9)

**Field:** `completedAt: timestamp` (nullable)

**Semantics:**
- `NULL` = not completed
- `NOT NULL` = completed (with timestamp)

**Impact on Fix:**
- ✅ No change needed to completion logic
- ✅ Revision count SQL checks: `completedAt IS NOT NULL`
- ✅ Repository preserves `completedAt` unless explicitly updated

**Note:** Page-level uses `status = 'completed'`, block-level uses `completedAt IS NOT NULL`. Both work.

---

## 12. Migration Plan

**Migration File:** `packages/db-tutorial/migrations/0024_<name>.sql`

**SQL:**
```sql
-- Migration: Add last_session_id to block_learning_state
-- Phase: Block-level session tracking alignment with page-level pattern

ALTER TABLE block_learning_state 
ADD COLUMN last_session_id TEXT;

-- No index needed (not queried independently)
-- NULL values allowed (initial state = no prior session)
-- No default (NULL is semantically correct)
```

**Drizzle Schema Update:**
```typescript
// packages/db-tutorial/src/schema/block-learning-state.ts
export const blockLearningState = pgTable('block_learning_state', {
  // ... existing fields ...
  
  lastSessionId: text('last_session_id'), // NEW - after activeTimeSec
  
  // ... rest of fields ...
});
```

**Migration Generation:**
```bash
cd packages/db-tutorial
pnpm db:generate  # Generate migration with Drizzle Kit
```

**Migration Execution:**
```bash
pnpm db:migrate  # Apply to local database
```

**Rollback Plan:**
```sql
ALTER TABLE block_learning_state DROP COLUMN last_session_id;
```

**Production Considerations:**
- Column addition is non-blocking (nullable, no default computation)
- Existing rows will have `last_session_id = NULL`
- First visit after migration will set `lastSessionId`
- No data backfill needed

---

## 13. Test Plan

### Unit Tests (Mock Database)

**File:** `packages/db-tutorial/src/repositories/__tests__/block-learning-state.repository.test.ts`

**Add:**
```typescript
it('uses targetWhere for partial unique index', () => {
  // Verify deprecated 'where' replaced with 'targetWhere'
  expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      targetWhere: expect.anything()
    })
  );
});

it('persists lastSessionId', async () => {
  const result = await repo.upsert({
    ...identity,
    lastSessionId: 'session-123',
  });
  
  expect(result.lastSessionId).toBe('session-123');
});
```

**File:** `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`

**Update:**
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
  expect(second.visitCount).toBe(2); // New session
  expect(second.lastSessionId).toBe('session-B');
});

it('does not increment visit on same session', async () => {
  const first = await service.recordBlockVisit(
    testIdentity, 'node-1', 'subtopic-1', 'block-1', 'D1', 'session-A'
  );
  
  const second = await service.recordBlockVisit(
    testIdentity, 'node-1', 'subtopic-1', 'block-1', 'D1', 'session-A'
  );
  expect(second.visitCount).toBe(1); // Same session
});
```

### Integration Tests (Real PostgreSQL)

**New File:** `packages/db-tutorial/src/repositories/__tests__/block-learning-state.integration.test.ts`

**Tests:**
```typescript
describe('BlockLearningStateRepository - PostgreSQL Integration', () => {
  it('handles concurrent same-session visits atomically', async () => {
    const identity = { userId, navigationNodeId, blockId, blockVersion };
    
    // 5 concurrent requests, same new session
    const results = await Promise.all([
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
      repo.upsert({ ...identity, lastSessionId: 'session-new' }),
    ]);
    
    const final = await repo.findOne(identity);
    expect(final.visitCount).toBe(1); // NOT 5
    expect(final.lastSessionId).toBe('session-new');
  });
  
  it('increments visit exactly once for session transition', async () => {
    // First visit
    await repo.upsert({ ...identity, lastSessionId: 'session-A' });
    
    // Concurrent requests with new session
    await Promise.all([
      repo.upsert({ ...identity, lastSessionId: 'session-B' }),
      repo.upsert({ ...identity, lastSessionId: 'session-B' }),
    ]);
    
    const final = await repo.findOne(identity);
    expect(final.visitCount).toBe(2); // 1 + 1, NOT 1 + 2
  });
  
  it('handles partial unique index with targetWhere', async () => {
    // Create active record
    const active = await repo.upsert(identity);
    
    // Soft delete
    await repo.softDelete(active.id);
    
    // Create new active record (should succeed)
    const newActive = await repo.upsert(identity);
    expect(newActive.id).not.toBe(active.id);
  });
});
```

### E2E Tests

**File:** `tests/e2e/ils-block-metrics.spec.ts`

**Tests:**
```typescript
test('block visit creates metrics with correct session tracking', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/tutorial-v2/.../what-is-java');
  
  // First visit
  await page.click('[data-block-id="definition"]');
  await page.waitForTimeout(1000);
  
  let record = await getBlockState(testUserId, 'definition');
  expect(record.visitCount).toBe(1);
  expect(record.lastSessionId).toBeTruthy();
  
  // Same session (refresh page, same JWT)
  await page.reload();
  await page.click('[data-block-id="definition"]');
  
  record = await getBlockState(testUserId, 'definition');
  expect(record.visitCount).toBe(1); // No increment
  
  // New session (logout, login, different JWT family)
  await logout(page);
  await loginAsStudent(page);
  await page.goto('/tutorial-v2/.../what-is-java');
  await page.click('[data-block-id="definition"]');
  
  record = await getBlockState(testUserId, 'definition');
  expect(record.visitCount).toBe(2); // Increment
});
```

---

## 14. Files Affected

### Schema & Migration

1. **`packages/db-tutorial/src/schema/block-learning-state.ts`**
   - Add: `lastSessionId: text('last_session_id')`
   
2. **`packages/db-tutorial/migrations/0024_<name>.sql`** (NEW)
   - Add: `ALTER TABLE block_learning_state ADD COLUMN last_session_id TEXT`

### Repository

3. **`packages/db-tutorial/src/repositories/block-learning-state.repository.ts`**
   - Line 315: Change `where:` to `targetWhere:`
   - `UpsertBlockLearningStateInput`: Add `lastSessionId?: string`
   - `upsert()` method: Add SQL CASE logic for visit/revision counts
   - `upsert()` method: Persist `lastSessionId`

### SQL Helpers (NEW or REUSE)

4. **`packages/db-tutorial/src/repositories/tutorial-navigation-progress-sql.helpers.ts`**
   - Option A: Reuse existing `buildAtomicVisitCountIncrement()`
   - Option B: Create block-specific variant if needed

### Service

5. **`packages/db-tutorial/src/services/learning-progress.service.ts`**
   - `recordBlockVisit()` method: Remove `findOne()` call (if fully atomic)
   - `recordBlockVisit()` method: Remove `SESSION_TIMEOUT_MS` logic
   - `recordBlockVisit()` method: Always pass `sessionId` to repository

### Tests

6. **`packages/db-tutorial/src/repositories/__tests__/block-learning-state.repository.test.ts`**
   - Update: Mock expectations for `targetWhere`
   - Add: Tests for `lastSessionId` persistence

7. **`packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`**
   - Update: Tests to use session identity instead of time
   - Add: Concurrent visit tests

8. **`packages/db-tutorial/src/repositories/__tests__/block-learning-state.integration.test.ts`** (NEW)
   - Add: Real PostgreSQL concurrency tests

---

## 15. Files NOT Affected

### NO CHANGES NEEDED

1. **API Routes**
   - `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts` ✅
   - Already passes `sessionId` parameter

2. **Frontend Telemetry**
   - Browser already sends `sessionId` ✅
   - No contract change

3. **Authentication**
   - JWT generation/validation unchanged ✅

4. **Active Time Tracking**
   - `recordBlockActiveTime()` method unchanged ✅
   - Does NOT participate in visit/session logic

5. **Other Repositories**
   - `tutorial-navigation-progress.repository.ts` - separate issue (optional fix)
   - Other upserts without partial indexes - unaffected

6. **Database Tables**
   - Only `block_learning_state` affected
   - Other tables unchanged

---

## 16. Risks / Open Questions

### Risk 1: Test Coverage Gap

**Issue:** Current tests mock database, miss SQL bugs  
**Mitigation:** Add PostgreSQL integration tests (Section 13)  
**Status:** ⚠️ Medium risk if skipped

### Risk 2: Revision Count Logic Complexity

**Issue:** SQL CASE for revision might miss edge cases  
**Mitigation:** Copy proven page-level helper, adapt for `completedAt`  
**Status:** ✅ Low risk (pattern already proven)

### Risk 3: Active Time Method Unchanged?

**Question:** Does `recordBlockActiveTime()` need `lastSessionId`?  
**Answer:** NO - active time should NOT modify session state  
**Evidence:** Page-level `recordTime()` also doesn't modify `lastSessionId` (Line 467)  
**Status:** ✅ Confirmed safe

### Risk 4: Migration Rollback

**Issue:** Rolling back migration after data written  
**Mitigation:** Column is nullable, can be dropped safely  
**Status:** ✅ Low risk

### Risk 5: Existing Rows After Migration

**Issue:** Existing rows have `lastSessionId = NULL`  
**Behavior:** First visit after migration sets session, subsequent visits work correctly  
**Status:** ✅ Safe (NULL handled by `IS DISTINCT FROM`)

### Risk 6: Frontend Session Identity

**Question:** Does frontend provide stable `sessionId`?  
**Evidence:** API route already receives and validates `sessionId` parameter  
**Status:** ✅ Confirmed working

### Risk 7: Repository API Compatibility

**Question:** Other callers of `blockLearningStateRepository.upsert()`?  
**Search:** Only `recordBlockVisit()` and `recordBlockActiveTime()` call it  
**Impact:** Both methods updated, no external callers  
**Status:** ✅ Safe

---

## 17. Exact Step 3 Implementation Sequence

### Phase 1: Schema & Migration

**STEP 3.1:** Generate migration
```bash
# Update schema file
# Run drizzle-kit generate
# Review generated migration
# Commit schema + migration
```

**STEP 3.2:** Apply migration locally
```bash
pnpm --filter @quiz/db-tutorial db:migrate
# Verify column exists
```

### Phase 2: Repository Changes

**STEP 3.3:** Fix Drizzle API
```typescript
// Line 315: where → targetWhere
// Commit: "fix: use targetWhere for block_learning_state partial index"
```

**STEP 3.4:** Add SQL helpers (if not reusing page-level)
```typescript
// Create buildAtomicBlockVisitCountIncrement()
// Create buildAtomicBlockRevisionCountIncrement()
// Or import existing helpers
```

**STEP 3.5:** Update repository upsert()
```typescript
// Add lastSessionId to input type
// Add SQL CASE for visitCount
// Add SQL CASE for revisionCount
// Add SQL CASE for firstViewedAt
// Persist lastSessionId
// Commit: "feat: atomic session-aware block visit upsert"
```

### Phase 3: Service Changes

**STEP 3.6:** Update recordBlockVisit()
```typescript
// Remove findOne() call (if fully atomic)
// Remove SESSION_TIMEOUT_MS logic
// Always pass sessionId to repository
// Commit: "refactor: remove time-based session heuristic, use session identity"
```

### Phase 4: Tests

**STEP 3.7:** Update unit tests
```typescript
// Fix mock expectations
// Update test assertions
// Commit: "test: update block visit tests for session identity"
```

**STEP 3.8:** Add integration tests
```typescript
// Create integration test file
// Add concurrency tests
// Commit: "test: add PostgreSQL integration tests for block upsert"
```

### Phase 5: Verification

**STEP 3.9:** Local smoke test
```bash
# Start API server
# Visit tutorial block
# Check database: SELECT * FROM block_learning_state
# Verify visitCount, lastSessionId populated
```

**STEP 3.10:** Run test suite
```bash
pnpm --filter @quiz/db-tutorial test
# All tests should pass
```

### Phase 6: Optional

**STEP 3.11:** Fix page-level repository (optional)
```typescript
// tutorial-navigation-progress.repository.ts
// Change deprecated where: to where: (keep as-is, it works)
// OR change to targetWhere for consistency
```

---

## FINAL RECOMMENDATION

**Proceed with fully atomic implementation (Design Option B from Section 7):**

1. ✅ Matches established page-level pattern exactly
2. ✅ Eliminates TOCTOU race completely
3. ✅ Zero SELECT before upsert
4. ✅ Database-side session decision
5. ✅ Concurrency-safe
6. ✅ Reuses proven SQL helpers

**Implementation Complexity:** Moderate (requires SQL CASE logic)  
**Risk Level:** Low (pattern already proven in page-level)  
**Testing Effort:** Medium (add integration tests)  
**Deployment Impact:** Low (non-blocking migration, no contract changes)

---

**STEP 2 COMPLETE - Design approved, awaiting STEP 3 implementation authorization**
