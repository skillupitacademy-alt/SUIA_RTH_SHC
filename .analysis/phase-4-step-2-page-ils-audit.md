# ILS Phase 4 - STEP 2: Existing Page ILS Audit

**Date:** 2026-09-05  
**Phase:** Phase 4 - Block Learning State & Telemetry Foundation  
**Status:** STEP 2 Complete - Page ILS patterns documented

---

## Objective

Before designing block-level telemetry, audit the existing page-level ILS implementation to:
1. Document exact visit/revision/time tracking semantics
2. Identify reusable patterns for block-level implementation
3. Ensure block telemetry aligns with page-level conventions
4. Prevent architectural conflicts

---

## Existing Page-Level Fields

### From `tutorial_navigation_progress` Schema

**Identity:**
- `userId` - Learner identity
- `navigationNodeId` - WHERE (navigation node, textual ID)
- `sectionId` - WHAT content (may be null if not created)
- `subtopicId` - Curriculum hierarchy

**Progress State:**
- `status` - 'not_started' | 'in_progress' | 'completed'
- `completedBlocks` - JSONB array of `{blockId, blockVersion, completedAt}`

**Time Tracking:**
- `timeSpentActiveSec` - Active time (tab visible, user engaged)
- `firstViewedAt` - Initial content view timestamp
- `lastViewedAt` - Most recent view timestamp
- `completedAt` - When page was completed

**Session Tracking:**
- `visitCount` - Total distinct visits/sessions
- `revisionCount` - Returns after initial completion
- `lastSessionId` - JWT family ID or client session UUID

**Metadata:**
- `version` - Optimistic locking
- `createdAt`, `updatedAt`, `deletedAt` - Standard audit fields

---

## Semantic Analysis

### 1. What is a "Visit"?

**Source:** `recordVisit()` method in `TutorialNavigationProgressRepository`

**Definition:**
A visit occurs when a learner accesses a page in a **new learning session**.

**Session Transition Logic:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
  THEN visitCount + 1
  ELSE visitCount  -- Same session, no increment
END
```

**Key Insights:**
- ✅ **Idempotent:** Same `sessionId` = no visit increment (prevents double-counting on reload)
- ✅ **Atomic:** Database determines session transition (prevents race conditions)
- ✅ **NULL-safe:** `NULL IS DISTINCT FROM 'session-123'` → TRUE (first visit increments)
- ✅ **Concurrent-safe:** Multiple requests with same new sessionId only increment once

**First Visit Creates:**
```typescript
{
  visitCount: 1,           // First visit
  revisionCount: 0,
  lastSessionId: event.sessionId,
  firstViewedAt: now,
  lastViewedAt: now,
  status: 'not_started'
}
```

**Subsequent Same-Session Visit:**
- `visitCount` unchanged
- `lastViewedAt` updated
- `lastSessionId` unchanged

**New Session Visit:**
- `visitCount` incremented atomically by database
- `lastSessionId` updated to new session
- `lastViewedAt` updated

---

### 2. What is a "Revision"?

**Source:** `buildAtomicRevisionCountIncrement()` SQL helper

**Definition:**
A revision occurs when a learner **returns to a completed page in a new session**.

**Revision Logic:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND status = 'completed'
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**Key Insights:**
- ✅ **Two conditions required:** Session change AND completed status
- ✅ **Not-started/in-progress pages:** Never increment revision
- ✅ **Completed pages:** New session = revision
- ✅ **Same session returns:** Do not count as revision

**Lifecycle Example:**
```
Visit 1 (Session A): not_started → in_progress
  visitCount: 1, revisionCount: 0

Visit 2 (Session A): same session
  visitCount: 1, revisionCount: 0

Visit 3 (Session B): new session, still in_progress
  visitCount: 2, revisionCount: 0

Complete page (Session B): status → completed
  visitCount: 2, revisionCount: 0

Visit 4 (Session C): new session, completed
  visitCount: 3, revisionCount: 1  ← REVISION

Visit 5 (Session C): same session
  visitCount: 3, revisionCount: 1

Visit 6 (Session D): new session, completed
  visitCount: 4, revisionCount: 2  ← REVISION
```

**Manual Override:**
`incrementRevision()` method exists for backward compatibility - increments BOTH visit and revision counts unconditionally.

---

### 3. What is "Active Time"?

**Source:** `recordTime()` method

**Definition:**
Cumulative seconds while learner is **actively engaged** with content.

**Time Accumulation Logic:**
```sql
timeSpentActiveSec + incrementSeconds
```

**Key Insights:**
- ✅ **Cumulative:** Each call adds to existing total
- ✅ **Validation:** Prevents negative values, caps single increment at 3600s (1 hour)
- ✅ **Session-independent:** Does not care about sessionId
- ✅ **Visit-independent:** Can record time without creating visit
- ✅ **Atomic:** SQL-level addition prevents lost updates

**Time Event Behavior:**
```typescript
recordTime({
  userId,
  navigationNodeId,
  subtopicId,
  timeSpentActiveSec: 45  // Add 45 seconds
})
```

**Does NOT:**
- ❌ Create/increment visitCount
- ❌ Update lastSessionId
- ❌ Affect revisionCount

**DOES:**
- ✅ Update `lastViewedAt`
- ✅ Accumulate time: `timeSpentActiveSec += 45`
- ✅ Create progress record if doesn't exist (with visitCount=0)

**Design Note:**
> "Time tracking should not create a visit - that's done by explicit visit events"

This separation allows:
- Visit tracking via page_view events
- Time tracking via periodic timer flushes
- Independent event streams that don't interfere

---

### 4. How is Completion Tracked?

**Page Completion:** `completeNode()` method

**Block Completion:** `markBlockCompleted()` method + `buildAtomicBlockAppend()`

**Block Completion Logic:**
```sql
CASE
  WHEN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(completed_blocks) AS block
    WHERE block->>'blockId' = 'block-uuid'
      AND block->>'blockVersion' = 'D1'
  )
  THEN completed_blocks  -- Already exists, no change
  ELSE completed_blocks || '[{"blockId":"...", "blockVersion":"D1", "completedAt":"..."}]'::jsonb
END
```

**Key Insights:**
- ✅ **Idempotent:** Same block+version = no duplicate entries
- ✅ **Version-aware:** D1 and D2 of same block are distinct completions
- ✅ **Atomic:** EXISTS check + append in single SQL prevents duplicates under concurrency
- ✅ **Preserves history:** Array maintains all completed blocks

**Block Identity for Completion:**
```typescript
{
  blockId: string,      // UUID - specific block instance
  blockVersion: string, // e.g., "D1", "C1"
  completedAt: string   // ISO timestamp
}
```

**Critical Design:**
> "Educational rules (D1/C1/S1 requirements) belong in service layer"

Repository doesn't validate "all required blocks completed" - it just records individual block completions.

---

## Atomic SQL Patterns

### Pattern 1: Session-Aware Counter Increment

**Used for:** visitCount, revisionCount

**SQL Pattern:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
  THEN counter + 1
  ELSE counter
END
```

**Advantages:**
- Single UPDATE statement handles both conditions
- Database atomically decides increment vs preserve
- No SELECT-then-UPDATE race condition
- Null-safe session comparison

---

### Pattern 2: Conditional Initialization

**Used for:** firstViewedAt

**SQL Pattern:**
```sql
CASE
  WHEN lastSessionId IS NULL
  THEN currentTimestamp
  ELSE existingValue
END
```

**Advantages:**
- Set-once behavior in UPDATE statement
- No separate "is this first visit?" logic
- Works with concurrent requests

---

### Pattern 3: Simple Accumulation

**Used for:** timeSpentActiveSec, version

**SQL Pattern:**
```sql
column + incrementValue
```

**Advantages:**
- Atomic addition at SQL level
- No read-modify-write cycle
- Concurrent-safe

---

### Pattern 4: JSONB Atomic Append with Deduplication

**Used for:** completedBlocks

**SQL Pattern:**
```sql
CASE
  WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(...) WHERE conditions)
  THEN array  -- Already exists
  ELSE array || newElement::jsonb
END
```

**Advantages:**
- Prevents duplicate entries
- Single UPDATE statement
- Concurrent-safe
- Preserves array ordering

---

## State Ownership Boundaries

### Visit-Owned State

**Only updated by `recordVisit()`:**
- `lastSessionId`
- `visitCount` (via session transition)
- `revisionCount` (via session transition + completion)
- `firstViewedAt` (via first-visit detection)

**Never updated by `recordTime()`**

**Rationale:**
> "Does NOT update lastSessionId - that's visit-owned state"

Clear separation prevents conflicting state updates.

---

### Time-Owned State

**Updated by `recordTime()`:**
- `timeSpentActiveSec`
- `lastViewedAt`

**Also updated by `recordVisit()` and `completeNode()`:**
- `lastViewedAt` (shared field)

**No exclusive ownership** - but no conflicts because time accumulation is additive.

---

### Completion-Owned State

**Updated by `markBlockCompleted()`:**
- `completedBlocks` JSONB array
- `status` (via service-layer logic after checking completion criteria)

**Updated by `completeNode()`:**
- `status` → 'completed'
- `completedAt`

---

## Reusable Patterns for Block-Level Telemetry

### Pattern A: Session-Aware Block Visit

**Apply to:** Block visitCount

**Adaptation:**
```sql
-- Page-level (existing)
CASE
  WHEN page.lastSessionId IS DISTINCT FROM newSessionId
  THEN page.visitCount + 1
  ELSE page.visitCount
END

-- Block-level (Phase 4)
CASE
  WHEN block.lastSessionId IS DISTINCT FROM newSessionId
  THEN block.visitCount + 1
  ELSE block.visitCount
END
```

**Same semantic:** New session = new visit

---

### Pattern B: Block Revision Detection

**Apply to:** Block revisionCount

**Adaptation:**
```sql
-- Page-level (existing)
CASE
  WHEN page.lastSessionId IS DISTINCT FROM newSessionId
    AND page.status = 'completed'
  THEN page.revisionCount + 1
  ELSE page.revisionCount
END

-- Block-level (Phase 4)
CASE
  WHEN block.lastSessionId IS DISTINCT FROM newSessionId
    AND block.completedAt IS NOT NULL
  THEN block.revisionCount + 1
  ELSE block.revisionCount
END
```

**Difference:** Blocks use `completedAt IS NOT NULL` instead of status enum

---

### Pattern C: Block Active Time Accumulation

**Apply to:** Block activeTimeSec

**Same pattern:**
```sql
block.activeTimeSec + incrementSeconds
```

**Validation reuse:**
- Prevent negative values
- Cap single increment (e.g., 600s = 10 min for blocks vs 3600s for pages)

---

### Pattern D: Block First View Detection

**Apply to:** Block firstViewedAt

**Adaptation:**
```sql
-- Use block's own lastSessionId as indicator
CASE
  WHEN block.lastSessionId IS NULL
  THEN currentTimestamp
  ELSE block.firstViewedAt
END
```

---

## Page ↔ Block Relationship

### Critical Insight

**Page and block telemetry are INDEPENDENT but RELATED.**

**Page timeSpentActiveSec:**
- Tracks total time on page
- May include time when no block is active (scrolling, reading intro, etc.)

**Block activeTimeSec:**
- Tracks time when specific block is active (via ActiveBlockContext)
- Sum of all block active times may be < page active time

**Therefore:**
```
page.timeSpentActiveSec ≠ SUM(block.activeTimeSec)
```

**Each is authoritative for its scope:**
- Page time = "how long on this page?"
- Block time = "how long engaged with this specific block?"

---

## Session ID Semantics

### What is sessionId?

**From TutorialVisitEvent type:**
```typescript
sessionId: string;  // REQUIRED: JWT family ID or client session UUID
```

**Service Layer Responsibility:**
- Authenticated users: Extract JWT family/session ID
- Anonymous users: Generate stable client UUID
- Browser maintains sessionId in sessionStorage

**Repository Responsibility:**
- Compare incoming sessionId with lastSessionId
- Atomically increment counters on session change
- Store new sessionId

**Critical for Phase 4:**
Block-level visits MUST use the SAME sessionId as page-level to maintain consistency.

---

## Validation Rules

### Time Validation

**From `recordTime()`:**
```typescript
if (event.timeSpentActiveSec < 0) {
  throw new Error('Time spent cannot be negative');
}

const MAX_SINGLE_INCREMENT = 3600; // 1 hour
if (event.timeSpentActiveSec > MAX_SINGLE_INCREMENT) {
  throw new Error(`Time increment too large`);
}
```

**Phase 4 Block Time:**
- Use same validation pattern
- Consider smaller MAX for blocks (e.g., 600s = 10 min)
- Blocks typically viewed for shorter periods than full pages

---

## Concurrency Safety

### All operations use:

1. **Atomic SQL expressions** - no SELECT-then-UPDATE
2. **Optimistic locking** - version column increment
3. **Soft-delete safety** - WHERE deletedAt IS NULL
4. **CASE expressions** - conditional logic at database level
5. **IS DISTINCT FROM** - null-safe comparisons

**Phase 4 MUST maintain these patterns** for block telemetry.

---

## Key Takeaways for Block-Level Design

### ✅ Reuse These Patterns:

1. **Session-aware counter increment** - visitCount, revisionCount
2. **Atomic time accumulation** - activeTimeSec
3. **Conditional initialization** - firstViewedAt
4. **State ownership boundaries** - visit vs time vs completion
5. **Validation rules** - negative time, max increments
6. **Concurrent-safe SQL** - CASE expressions, IS DISTINCT FROM

### ✅ Maintain These Principles:

1. **Idempotent operations** - Same input = same result
2. **Atomic database decisions** - No race conditions
3. **Separation of concerns** - Visit ≠ Time ≠ Completion
4. **Service-layer policy** - Repository enforces data integrity only
5. **Independent event streams** - Visit events ≠ Time events

### ⚠️ Critical Decisions Required:

1. **Storage model:** Extend JSONB vs dedicated table?
2. **Identity:** Same sessionId for blocks as pages?
3. **Aggregation:** How does page.timeSpent relate to block times?
4. **Completion sync:** How does block completion affect page completion?
5. **Expected time:** Where does it come from? How is it configured?

---

## Comparison: Page vs Block Telemetry

| Aspect | Page (Existing) | Block (Phase 4 Design) |
|--------|-----------------|------------------------|
| **Identity** | userId + navigationNodeId | userId + navigationNodeId + blockId + blockVersion |
| **Visit** | New session on page | New session + block activated |
| **Revision** | Return to completed page | Return to completed block |
| **Active Time** | Total time on page | Time with block active (ActiveBlockContext) |
| **Completion** | All required blocks done | Individual block completed |
| **Session Owner** | page.lastSessionId | block.lastSessionId (independent) |
| **Storage** | Single row per page | ??? (to be decided in STEP 5) |

---

## Evidence Quality

**All findings verified from:**
- ✅ Actual repository implementation
- ✅ SQL helper functions with comments
- ✅ Type definitions
- ✅ Existing tests (Phase 2 certification)

**No assumptions or invented patterns.**

---

**STEP 2 Status:** ✅ Complete  
**Next Action:** STEP 3 - Audit existing block completion flow

