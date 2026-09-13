# Gate 3C.1R Phase D
# Lifecycle Semantic Contract

**Date:** 2026-09-10  
**Source:** Actual repository and service implementation inspection

---

## visitCount

**Producer:** `BlockLearningStateRepository.upsert()`  
**Write path:** `recordBlockVisit()` → `BlockLearningStateRepository.upsert()`  
**Read path:** `findByNavigationNode()` → API → ILSProvider

**First visit:**
- `visitCount` initialized to `1` (when `lastSessionId` provided)
- `firstViewedAt` initialized to current timestamp

**Same-session visit:**
- `visitCount` remains unchanged (no increment)
- Database compares: `WHEN lastSessionId IS DISTINCT FROM newSessionId`
- Same session → `IS DISTINCT FROM` returns `false` → no increment

**New-session visit:**
- `visitCount` increments by `1`
- Database detects: `lastSessionId IS DISTINCT FROM newSessionId` → `true` → increment
- Session transition is atomic in PostgreSQL

**Concurrency:**
- Atomic SQL `CASE` expression in `ON CONFLICT DO UPDATE`
- Session comparison happens in database transaction
- Multiple concurrent requests with same `sessionId` → only first causes increment

**Idempotency:**
- Same `sessionId` repeated calls → `visitCount` stable (no increment)
- Idempotent per session ID

**Source:**
```typescript
// BlockLearningStateRepository.upsert() lines 312-318
visitCount: data.lastSessionId
  ? buildAtomicVisitCountIncrement(
      blockLearningState.visitCount,
      blockLearningState.lastSessionId,
      data.lastSessionId
    )
  : blockLearningState.visitCount,
```

**Helper implementation:**
```typescript
// tutorial-navigation-progress-sql.helpers.ts lines 68-83
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

---

## revisionCount

**Producer:** `BlockLearningStateRepository.upsert()`  
**Write path:** `recordBlockVisit()` → `BlockLearningStateRepository.upsert()`  
**Read path:** `findByNavigationNode()` → API → ILSProvider

**Increment condition:**
```
revisionCount increments ONLY when:
  1. Session changes (lastSessionId IS DISTINCT FROM newSessionId)
  AND
  2. Block is already completed (completedAt IS NOT NULL)
```

**Non-increment conditions:**
- Same session visit → no increment
- New session but block not completed → no increment
- First visit → no increment (initialized to 0)

**Semantic meaning:**
"Revision = returning to a completed block in a new learning session"

**Concurrency:**
- Atomic SQL `CASE` expression
- Both conditions evaluated in database transaction

**Idempotency:**
- Same `sessionId` on completed block → `revisionCount` stable

**Source:**
```typescript
// BlockLearningStateRepository.upsert() lines 320-331
revisionCount: data.lastSessionId
  ? sql`
      CASE
        WHEN ${blockLearningState.lastSessionId} IS DISTINCT FROM ${data.lastSessionId}
          AND ${blockLearningState.completedAt} IS NOT NULL
        THEN ${blockLearningState.revisionCount} + 1
        ELSE ${blockLearningState.revisionCount}
      END
    `
  : blockLearningState.revisionCount,
```

**CRITICAL:** Revision is NOT simply "new session". It requires BOTH session change AND prior completion.

---

## activeTimeSec

**Producer:** `BlockLearningStateRepository.upsert()`  
**Write path:** `recordBlockActiveTime()` → `BlockLearningStateRepository.upsert()`  
**Read path:** `findByNavigationNode()` → API → ILSProvider

**Update rule:**
- Simple atomic increment: `activeTimeSec = activeTimeSec + delta`
- Independent from `visitCount`
- Independent from `lastSessionId`

**Accumulation:**
- Each call adds `activeTimeSec` parameter to existing value
- Max per-update: 600 seconds (service validation)
- Min per-update: 0 seconds (service validation)

**Concurrency:**
- Atomic SQL addition in `ON CONFLICT DO UPDATE`
- PostgreSQL guarantees atomicity

**Interaction with visitCount:**
- `recordBlockActiveTime()` does NOT increment `visitCount`
- `recordBlockActiveTime()` does NOT update `lastSessionId`
- Active time tracking is independent measurement

**Interaction with lastSessionId:**
- `recordBlockActiveTime()` does NOT provide `lastSessionId` parameter
- Session identity not required for time tracking

**Source:**
```typescript
// BlockLearningStateRepository.upsert() lines 333-337
activeTimeSec:
  data.activeTimeSec !== undefined
    ? buildAtomicTimeIncrement(blockLearningState.activeTimeSec, data.activeTimeSec)
    : blockLearningState.activeTimeSec,
```

```typescript
// LearningProgressService.recordBlockActiveTime() lines 750-758
return await this.blockLearningStateRepository.upsert({
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  activeTimeSec,  // No sessionId provided
  lastViewedAt: now,
});
```

---

## expectedTimeSec

**Producer:** `LearningProgressService.recordBlockVisit()`  
**Canonical source:** Tutorial document canonical block envelope (`section.content.blocks[].expectedTimeSec`)  
**Persistence:** First write sets value, subsequent writes preserve if not provided

**Canonical ownership:**
- Extracted from published tutorial content
- Generic lookup: `blocks.find(b => b.id === blockId && b.version === blockVersion)`
- No D1/C1-specific mapping
- Nullable: may not exist for all blocks

**Mutation behavior:**
- Set on first `recordBlockVisit()` call
- Preserved on subsequent visits if not explicitly updated
- Repository: `data.expectedTimeSec !== undefined ? data.expectedTimeSec : blockLearningState.expectedTimeSec`

**Source:**
```typescript
// LearningProgressService.recordBlockVisit() lines 639-649
const section = await this.sectionRepository.getTutorialByPageIdentity(
  subtopicId,
  navigationNodeId,
  identity.brand
);

let expectedTimeSec: number | null = null;
if (section?.content?.blocks) {
  const block = section.content.blocks.find(
    (b: any) => b.id === blockId && b.version === blockVersion
  );
  expectedTimeSec = block?.expectedTimeSec ?? null;
}
```

---

## firstViewedAt

**Producer:** `BlockLearningStateRepository.upsert()`  
**Mutation rule:** Set ONLY on first visit (when `lastSessionId IS NULL`)

**Logic:**
```sql
CASE
  WHEN lastSessionId IS NULL
  THEN <current_timestamp>
  ELSE firstViewedAt  -- preserve existing
END
```

**Behavior:**
- First visit: `lastSessionId` is NULL (no prior session) → set `firstViewedAt`
- Subsequent visits: `lastSessionId` not NULL → preserve existing `firstViewedAt`
- Immutable after first write

**Source:**
```typescript
// BlockLearningStateRepository.upsert() lines 339-349
firstViewedAt: data.lastSessionId
  ? buildAtomicFirstViewedAtInit(
      blockLearningState.firstViewedAt,
      blockLearningState.lastSessionId,
      now
    )
  : data.firstViewedAt !== undefined
    ? data.firstViewedAt
    : blockLearningState.firstViewedAt,
```

---

## lastViewedAt

**Producer:** `BlockLearningStateRepository.upsert()`  
**Mutation rule:** Always updated to current timestamp on any write

**Behavior:**
- `recordBlockVisit()` → updates `lastViewedAt`
- `recordBlockActiveTime()` → updates `lastViewedAt`
- Every telemetry write updates this field

**Source:**
```typescript
// BlockLearningStateRepository.upsert() line 357
lastViewedAt: data.lastViewedAt ?? now, // Always update lastViewedAt
```

---

## completedAt

**Producer:** `TutorialNavigationProgressRepository.markBlockCompleted()`  
**Persistence path:** `recordBlockCompletion()` → `TutorialNavigationProgressRepository.markBlockCompleted()` → `tutorial_navigation_progress.completed_blocks[]`

**CRITICAL ARCHITECTURAL FACT:**
Completion is **NOT** currently stored in `block_learning_state.completedAt`.

Completion is stored in:
```
tutorial_navigation_progress.completed_blocks JSONB[]
```

The `block_learning_state.completedAt` column exists but is currently:
- Always `null` in normal operation
- Available for future denormalization
- Not the authoritative completion source

**Repeated completion:**
- Idempotent at `TutorialNavigationProgressRepository` level
- Same block completion multiple times → same result

**Re-completion:**
- No semantic difference from first completion
- Completion list is append-only in current implementation

**Source:**
```typescript
// LearningProgressService.recordBlockCompletion() lines 352-365
const event: TutorialBlockCompletionEvent = {
  userId: identity.userId,
  navigationNodeId,
  sectionId,
  subtopicId,
  blockId,
  blockType,
  blockVersion,
  sessionId,
  occurredAt: new Date(),
};

const updated = await this.progressRepository.markBlockCompleted(event);
```

**Note:** Phase D must test the actual completion path through `TutorialNavigationProgressRepository`, not a hypothetical `block_learning_state.completedAt` write.

---

## lastSessionId

**Producer:** `LearningProgressService.recordBlockVisit()`  
**Persistence:** `BlockLearningStateRepository.upsert()`

**Mutation rule:**
- Set to current `sessionId` on every `recordBlockVisit()` call
- NOT updated by `recordBlockActiveTime()`
- Enables atomic session transition detection in database

**Source:**
```typescript
// LearningProgressService.recordBlockVisit() line 668
lastSessionId: sessionId,  // Phase 4.6: Database compares for session transition
```

```typescript
// BlockLearningStateRepository.upsert() line 352
lastSessionId: data.lastSessionId ?? blockLearningState.lastSessionId,
```

**Session comparison:**
- Database uses `IS DISTINCT FROM` for NULL-safe comparison
- NULL = no prior session (first visit)
- Non-NULL = subsequent visits with session tracking

---

## Identity

**userId:** UUID (from `AuthenticatedIdentity`)  
**navigationNodeId:** String identifier (page context)  
**blockId:** Text (UUID-shaped but stored as text for universality)  
**blockVersion:** Text version label ('D1', 'C1', 'S1', etc.)

**Composite identity:**
```
(userId, navigationNodeId, blockId, blockVersion)
```

**PostgreSQL constraint:**
```sql
UNIQUE INDEX uq_block_learning_state_identity
ON (user_id, navigation_node_id, block_id, block_version)
WHERE deleted_at IS NULL
```

**Cross-page blocks:**
- Same `blockId` + `blockVersion` on different `navigationNodeId` → separate telemetry records
- Telemetry is scoped to navigation context

---

## Brand

**Authoritative identity boundary:** User identity is brand-scoped via existing identity model  
**Where enforced:** Authentication layer (`AuthenticatedIdentity.brand`)

**Critical fact:**
Brand is NOT a column in `block_learning_state` table.

Brand isolation is enforced at:
1. Authentication boundary (API middleware)
2. Service layer (`AuthenticatedIdentity` parameter)
3. Content resolution (tutorial documents are brand-specific)

**User identity already includes brand:**
- Same user UUID cannot exist across multiple brands
- User table has brand boundary
- `block_learning_state.user_id` inherits brand isolation from user identity

**Phase D brand isolation test (DC-7):**
Must test at user/identity boundary, not at telemetry table level.

---

## Soft Delete

**Behavior:**
- Records have `deleted_at` timestamp column
- Active records: `deleted_at IS NULL`
- Soft-deleted records: `deleted_at IS NOT NULL`
- Partial unique index only applies to active records

**Uniqueness:**
- Unique constraint enforced only where `deleted_at IS NULL`
- Soft-deleted records do not block new records with same identity

**Query filtering:**
Repository queries use:
```typescript
const activeBlockState = isNull(blockLearningState.deletedAt);
```

---

## Missing Record

**Behavior:**
When no telemetry record exists for `(userId, navigationNodeId, blockId, blockVersion)`:

**From `findByNavigationNode()`:**
- Returns empty array or array without that block
- No error thrown
- Absence = no prior interaction

**From `recordBlockVisit()` with `lastSessionId`:**
- Creates new record
- `visitCount = 1`
- `revisionCount = 0`
- `firstViewedAt = now`
- `lastSessionId = <provided>`

**From `recordBlockActiveTime()`:**
- Creates new record
- `visitCount = 0` (no session ID provided)
- `activeTimeSec = <delta>`
- `firstViewedAt = null`
- `lastSessionId = null`

**CRITICAL:**
`recordBlockActiveTime()` CAN create a record with `visitCount = 0` if called before any visit.

---

## Summary Table

| Metric          | Write Method               | Session-Aware | Atomic | Idempotent per Session |
|-----------------|----------------------------|---------------|--------|------------------------|
| visitCount      | recordBlockVisit()         | ✅ Yes        | ✅ Yes | ✅ Yes                 |
| revisionCount   | recordBlockVisit()         | ✅ Yes        | ✅ Yes | ✅ Yes                 |
| activeTimeSec   | recordBlockActiveTime()    | ❌ No         | ✅ Yes | ❌ No (accumulates)    |
| expectedTimeSec | recordBlockVisit()         | ❌ No         | N/A    | ✅ Yes (set once)      |
| firstViewedAt   | recordBlockVisit()         | ✅ Yes        | ✅ Yes | ✅ Yes (immutable)     |
| lastViewedAt    | both methods               | ❌ No         | N/A    | ❌ No (always updates) |
| completedAt     | TutorialNavigationProgress | N/A           | N/A    | ✅ Yes                 |
| lastSessionId   | recordBlockVisit()         | N/A           | N/A    | ✅ Yes (updates)       |

---

## Key Semantic Rules for Phase D Tests

1. **Revision requires completion + new session** (not just new session)
2. **Active time is independent** (no visit increment, no session update)
3. **visitCount can be 0** (if only active-time called, never visit)
4. **Completion lives in different table** (not block_learning_state.completedAt)
5. **Expected time comes from canonical content** (not hardcoded D1/C1 mapping)
6. **Session comparison is NULL-safe** (IS DISTINCT FROM handles NULL first visit)
7. **First viewed only sets once** (when lastSessionId transitions from NULL)
8. **Last viewed always updates** (on any write operation)
9. **Brand isolated via user identity** (not separate telemetry table column)
10. **Block ID is text** (universal, not hardcoded to UUID type)

---

## Phase D Test Implications

### WR (Write-Read)
- Test actual values after operations
- Verify independent metrics don't interfere

### SS (Session)
- Test session transition detection
- Verify `IS DISTINCT FROM` logic
- Test first visit (NULL → sessionId transition)
- Test revision only after completion

### LE (Lifecycle)
- Test visit/active-time/completion independence
- Verify timestamp ordering
- Test missing record creation

### CS (Concurrency)
- Test atomic SQL expressions
- Test same-session concurrent calls → idempotent
- Test cross-session concurrent calls → both increment

### DC (Data Consistency)
- Test user isolation (different userIds)
- Test navigation node isolation (different nodeIds)
- Test block identity isolation (D1 vs C1 separate records)
- Test brand via user identity boundary
- Test soft-delete behavior
- Test missing record behavior
