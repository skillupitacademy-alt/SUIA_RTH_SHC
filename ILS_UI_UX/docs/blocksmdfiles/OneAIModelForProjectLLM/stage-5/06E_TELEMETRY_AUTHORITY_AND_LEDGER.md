# 06E: Telemetry Authority and Ledger Synthesis

**Investigation Type:** T3 - Cross-Authority Synthesis  
**Created:** 2026-10-02  
**Revised:** 2026-10-02 (corrections applied per user review)  
**Evidence Status:** VERIFIED (repository code inspection)  
**Baseline Documents:** 06A, 06B, 06C, 06D

**Correction Note:** Initial draft overstated several findings. Corrected to reflect:
1. `completedAt` is **mutable** (repository accepts writes); `recordBlockCompletion()` does not synchronize it (narrower claim)
2. Page-level vs block-level `lastViewedAt` explicitly distinguished
3. Completion authority uses "atomic deduplicated append" (not "immutable")
4. Event-ledger reconstruction qualified by retention policy
5. Concurrent-visit behavior marked as requiring concurrency testing (not proven incorrect)
6. Exhaustive writer-set verification marked PARTIAL

---

## Executive Summary

This document investigates the **relationships and boundary conditions** between the three persistence authorities established in Phase B-D:

1. **Completion Authority:** `tutorial_navigation_progress.completed_blocks[]`
2. **Event Ledger:** `block_telemetry_events`
3. **Cumulative State:** `block_learning_state`

**Key Finding:** The three authorities serve distinct purposes with **independent write patterns**. The `recordBlockCompletion()` API does not synchronize `block_learning_state.completedAt`, establishing completion authority separation. The system prioritizes operational independence over automatic denormalized-field synchronization.

---

## 1. Authority Map

**Evidence Source:** Direct code inspection of repository upsert/update methods

| Field | Source of Truth | Secondary/Denormalized | Writer API(s) | Reconstructable? |
|-------|----------------|------------------------|---------------|------------------|
| **Block completion** | `tutorial_navigation_progress.completed_blocks[]` | `block_learning_state.completedAt` | `recordBlockCompletion()` → `markBlockCompleted()` | **NO** - canonical only |
| **Completion timestamp** | `completed_blocks[].completedAt` (ISO string) | `block_learning_state.completedAt` (Date) | `markBlockCompleted()` writes canonical only | **NO** - canonical only |
| **completedAt (denormalized)** | N/A | `block_learning_state.completedAt` | Mutable field; writer set not exhaustively verified | **NO** - denormalized |
| **Visit count** | `block_learning_state.visitCount` | None | `recordBlockVisit()` → `upsert()` | **NO** - stateful counter |
| **Revision count** | `block_learning_state.revisionCount` | None | `recordBlockVisit()` → `upsert()` | **NO** - stateful counter |
| **Active time (cumulative)** | `block_learning_state.activeTimeSec` | None | `recordBlockActiveTime()` → transaction | **YES** - from retained ledger events |
| **Active time (delta)** | `block_telemetry_events.activeTimeSec` | None | `recordBlockActiveTime()` → `claimEvent()` | N/A - immutable ledger |
| **Last viewed (page-level)** | `tutorial_navigation_progress.lastViewedAt` | None | Multiple APIs write page-level | **NO** - latest only |
| **Last viewed (block-level)** | `block_learning_state.lastViewedAt` | None | Visit/Active-time APIs write block-level | **NO** - latest only |
| **First viewed timestamp** | `block_learning_state.firstViewedAt` | None | `recordBlockVisit()` → atomic init | **NO** - cannot re-derive |
| **Session identity** | `block_learning_state.lastSessionId` | None | `recordBlockVisit()` → atomic compare | **NO** - latest only |
| **Expected time** | `block_learning_state.expectedTimeSec` | None | `recordBlockVisit()` → from content | **YES** - from canonical content |

**Evidence State:** VERIFIED

---

## 2. Cross-API Write Ownership

### 2.1 recordBlockCompletion()

**Repository Method:** `TutorialNavigationProgressRepository.markBlockCompleted()`

**Writes:**
- `tutorial_navigation_progress.completed_blocks[]` ← APPEND new `CompletedBlockRecord`
- `tutorial_navigation_progress.lastViewedAt` ← `now`
- `tutorial_navigation_progress.status` ← `'in_progress'` (if was `'not_started'`)

**Does NOT Write:**
- `block_learning_state.completedAt` ← **NOT SYNCHRONIZED by recordBlockCompletion()**

**Evidence:**
```typescript
// File: packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts
// Line: 229-356

async markBlockCompleted(event: TutorialBlockCompletionEvent): Promise<TutorialNavigationProgressRecord> {
  // ...
  const newRecord: CompletedBlockRecord = {
    blockId: event.blockId,
    blockVersion: event.blockVersion,
    completedAt: now.toISOString(),  // ← Canonical timestamp
  };
  
  // Atomic append to completed_blocks[]
  const [updated] = await this.dbInstance
    .update(tutorialNavigationProgress)
    .set({
      completedBlocks: buildAtomicBlockAppend(...),
      status: newStatus,
      lastViewedAt: now,  // ← Only page-level timestamp updated
      // NO block_learning_state write
    });
}
```

**Evidence State:** VERIFIED

---

### 2.2 recordBlockVisit()

**Repository Method:** `BlockLearningStateRepository.upsert()`

**Writes:**
- `block_learning_state.visitCount` ← atomic session-aware increment
- `block_learning_state.revisionCount` ← atomic increment (if session changed + completed)
- `block_learning_state.lastSessionId` ← new session ID
- `block_learning_state.firstViewedAt` ← atomic initialization (if NULL)
- `block_learning_state.lastViewedAt` ← `now`
- `block_learning_state.expectedTimeSec` ← from canonical content (if provided)

**Does NOT Write:**
- `tutorial_navigation_progress` (any field)
- `block_telemetry_events`

**Evidence:**
```typescript
// File: packages/db-tutorial/src/repositories/block-learning-state.repository.ts
// Line: 260-370

async upsert(data: UpsertBlockLearningStateInput): Promise<BlockLearningState> {
  // ...
  .onConflictDoUpdate({
    set: {
      // ... visit/revision counters ...
      
      // completedAt is MUTABLE: writes supplied value, preserves if not supplied
      completedAt: data.completedAt !== undefined 
        ? data.completedAt 
        : blockLearningState.completedAt,  // ← Repository accepts writes
    }
  });
}
```

**Critical Note:** The repository **accepts** `completedAt` writes via `upsert(data.completedAt)`. However, **`recordBlockVisit()` does not supply this field**, so the preserved value remains unsynchronized with canonical completion records.

**Evidence State:** VERIFIED (recordBlockVisit does not synchronize) + PARTIAL (exhaustive writer-set audit incomplete)

---

### 2.3 recordBlockActiveTime()

**Transaction Structure:** Event claim + state upsert (atomic)

**Writes:**
1. `block_telemetry_events` ← INSERT with ON CONFLICT DO NOTHING (idempotent claim)
2. `block_learning_state.activeTimeSec` ← atomic increment (if event claimed)
3. `block_learning_state.lastViewedAt` ← `now`

**Does NOT Write:**
- `tutorial_navigation_progress` (any field)
- `block_learning_state.completedAt`

**Evidence:**
```typescript
// File: packages/db-tutorial/src/services/learning-progress.service.ts
// Line: 746-890

async recordBlockActiveTime(...): Promise<{...}> {
  return await db.transaction(async (tx) => {
    const txBlockTelemetryRepo = this.blockTelemetryEventRepository.withDb(tx);
    const txBlockStateRepo = this.blockLearningStateRepository.withDb(tx);

    // 1. Attempt atomic event claim
    const claimedEvent = await txBlockTelemetryRepo.claimEvent({
      eventId,
      userId,
      navigationNodeId,
      blockId,
      blockVersion,
      activeTimeSec,  // ← Delta stored in ledger
    });

    if (claimedEvent) {
      // 2. NEW EVENT: Accumulate active time atomically
      const updatedState = await txBlockStateRepo.upsert({
        userId,
        navigationNodeId,
        blockId,
        blockVersion,
        activeTimeSec,  // ← Cumulative increment
        lastViewedAt: now,
      });
      
      return { state: updatedState, wasProcessed: true, wasAlreadyProcessed: false };
    } else {
      // 3. DUPLICATE EVENT: Validate immutability, do NOT accumulate
      // ...idempotency validation...
      return { state: currentState, wasProcessed: false, wasAlreadyProcessed: true };
    }
  });
}
```

**Transaction Boundary:** VERIFIED  
**Idempotency Mechanism:** Event ledger uniqueness constraint + transaction isolation

**Evidence State:** VERIFIED

---

## 3. Lifecycle Divergence Scenarios

### 3.1 Completion Exists, Telemetry State Absent

**Scenario:**
1. Learner completes block D1 → `completed_blocks[]` appended
2. `block_learning_state` soft-deleted (e.g., admin purge, test cleanup)
3. Completion remains in canonical record

**Result:**
- `tutorial_navigation_progress.completed_blocks[]` contains D1 completion ✅
- `block_learning_state` record for D1 deleted (`deletedAt IS NOT NULL`)
- DTO construction reads from canonical completion only

**DTO Behavior:**
```typescript
// File: packages/db-tutorial/src/services/learning-progress.service.ts
// Line: 1047-1077

private resolveBlockCompletedAt(
  record: TutorialNavigationProgressRecord,
  state: BlockLearningState
): Date | null {
  const authoritativeCompletion = record.completedBlocks.find(
    (completion) =>
      completion.blockId === state.blockId &&
      completion.blockVersion === state.blockVersion
  );

  if (!authoritativeCompletion) {
    return state.completedAt;  // ← Fallback to denormalized field
  }

  return new Date(authoritativeCompletion.completedAt);  // ← Canonical authority
}
```

**When telemetry state is absent:**
- DTO construction for that block **omitted** (not in `blockStates[]` query result)
- Completion still reflected in `completedBlocks` count
- Per-block metrics unavailable (visitCount, activeTimeSec, etc.)

**Evidence:** Inferred from query filter `WHERE deleted_at IS NULL`

**Evidence State:** INFERRED (no explicit test for this scenario in codebase)

---

### 3.2 Event Ledger Exists, State Absent

**Scenario:**
1. Active-time events processed and ledger populated
2. `block_learning_state` soft-deleted
3. New duplicate event arrives

**Result:**
```typescript
// D2-9 CRITICAL: Event ledger is authoritative for idempotency.
// Even if block_learning_state is soft-deleted/absent, the duplicate
// event must NOT be reprocessed.

const currentState = await txBlockStateRepo.findOne({...});

if (!currentState) {
  // Return stub state, preserving idempotency
  const stubState: BlockLearningState = {
    id: '',
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    visitCount: 0,
    revisionCount: 0,
    activeTimeSec: 0,  // ← Cannot determine true value without state
    // ...
  };
  return { state: stubState, wasProcessed: false, wasAlreadyProcessed: true };
}
```

**Key Property:** Event ledger prevents duplicate processing even when cumulative state is absent.

**Evidence State:** VERIFIED

---

### 3.3 State Recreated After Deletion

**Scenario:**
1. `block_learning_state` soft-deleted
2. New visit/active-time event arrives
3. Repository upsert creates new record (partial unique index allows reuse of identity)

**Result:**
- New `block_learning_state` record with fresh counters (visitCount=1, activeTimeSec=0+delta)
- Historical cumulative values **lost** (not reconstructed from event ledger)
- Event ledger idempotency still preserved (eventId uniqueness global)

**Reconstruction Gap:**
```sql
-- Theoretical reconstruction (NOT implemented in production):
SELECT 
  user_id,
  navigation_node_id,
  block_id,
  block_version,
  SUM(active_time_sec) AS reconstructed_active_time
FROM block_telemetry_events
GROUP BY user_id, navigation_node_id, block_id, block_version;
```

**Evidence State:** INFERRED (partial unique index semantics + no production rebuild mechanism)

---

## 4. Event Ledger Reconstruction

### 4.1 Theoretical Reconstruction

**Reconstructable Field:** `block_learning_state.activeTimeSec`

**Reconstruction Query (from retained events):**
```sql
SELECT SUM(active_time_sec) AS reconstructed_active_time_sec
FROM block_telemetry_events
WHERE user_id = ?
  AND navigation_node_id = ?
  AND block_id = ?
  AND block_version = ?;
```

**Important Qualification:** Reconstruction is valid **for retained event evidence**. Future event-ledger cleanup/retention policies affect historical reconstructability.

**Identity Alignment:** VERIFIED  
All four identity fields match between `block_telemetry_events` and `block_learning_state`.

**Evidence:**
- `block_telemetry_events` schema (line 37-40): userId, navigationNodeId, blockId, blockVersion
- `block_learning_state` schema (line 24-27): userId, navigationNodeId, blockId, blockVersion
- Both use identical types: UUID, TEXT, TEXT, TEXT

**Evidence State:** VERIFIED

---

### 4.2 Production Reconstruction Status

**Status:** NOT IMPLEMENTED

**Searched for:**
- Reconciliation jobs
- Rebuild procedures
- Event replay mechanisms
- SUM() aggregation queries against `block_telemetry_events`

**Result:** No production code performs event ledger → cumulative state reconstruction.

**Evidence:** Absence of reconstruction logic in:
- `packages/db-tutorial/src/services/` (no reconciliation service)
- `packages/db-tutorial/src/repositories/` (no rebuild methods)
- `apps/api-server/src/workers/` (no background reconciliation workers)

**Evidence State:** VERIFIED (absence confirmed via grep search)

---

### 4.3 Reconstruction vs. Reconstructable

**Classification:**

| Property | Status | Evidence |
|----------|--------|----------|
| **Event ledger stores deltas** | VERIFIED | `block_telemetry_events.activeTimeSec` is increment, not cumulative |
| **SUM() would match cumulative state** | VERIFIED | Mathematical equivalence for retained events (if no soft-deletes) |
| **Identity alignment** | VERIFIED | Four-part identity identical across tables |
| **Production rebuild implemented** | NOT FOUND | No reconciliation mechanism in codebase |
| **Automatic reconciliation on state recreation** | NOT IMPLEMENTED | New record starts with fresh counters |
| **Reconstruction from retained evidence** | VERIFIED | Cleanup infrastructure documented; retention policy determines reconstructability |

**Conclusion:** Active time is **RECONSTRUCTABLE FROM RETAINED EVENT EVIDENCE** but **NOT RECONSTRUCTED IN PRODUCTION**. Future retention/cleanup policies affect historical reconstructability.

**Evidence State:** VERIFIED

---

## 5. Completion ↔ Telemetry Synchronization

### 5.1 completedAt Denormalization

**Canonical Authority:**  
`tutorial_navigation_progress.completed_blocks[].completedAt` (ISO 8601 string)

**Denormalized Field:**  
`block_learning_state.completedAt` (TIMESTAMP, mutable, optional)

**Writer:**  
`markBlockCompleted()` writes ONLY to `completed_blocks[]`.  
`recordBlockVisit()` does NOT write `block_learning_state.completedAt`.

**Repository Semantics:**  
`BlockLearningStateRepository.upsert()` **accepts** `completedAt` writes when explicitly supplied via `data.completedAt`, but preserves existing value when not supplied.

**Evidence:**
```typescript
// recordBlockCompletion() calls markBlockCompleted()
// markBlockCompleted() updates tutorial_navigation_progress ONLY
// NO writes to block_learning_state.completedAt

// Repository preserves existing completedAt on conflict:
completedAt: data.completedAt !== undefined 
  ? data.completedAt 
  : blockLearningState.completedAt,  // ← Preserved, not updated
```

**Evidence State:** VERIFIED

---

### 5.2 Does recordBlockCompletion() Synchronize completedAt?

**Answer:** NO

**Observed Behavior:**
- Completion event → `completed_blocks[]` appended
- Visit event → `block_learning_state` upserted, `completedAt` preserved (not written)
- Active-time event → `block_learning_state` upserted, `completedAt` preserved

**Writer-Set Status:** PARTIAL  
The known APIs (`recordBlockCompletion`, `recordBlockVisit`, `recordBlockActiveTime`) do not synchronize `completedAt`. Exhaustive verification of all potential writers (e.g., admin tools, migrations, direct repository calls) not yet performed.

**Synchronization Mechanisms Searched:**
- Trigger on `tutorial_navigation_progress` insert/update
- Service-layer synchronization after completion
- Repository-layer cascading writes

**Result:** NONE FOUND

**Evidence State:** VERIFIED (absence confirmed)

---

### 5.3 Potential Drift Scenarios

| Scenario | Completion Canonical | Telemetry Denormalized | Drift? |
|----------|---------------------|----------------------|--------|
| Block completed via API | `completed_blocks[]` populated | `completedAt` remains NULL | **YES** |
| Manual DB completion (admin) | `completed_blocks[]` updated | `completedAt` unchanged (unless explicitly written) | **POTENTIAL** |
| Legacy data migration | `completed_blocks[]` populated | `completedAt` not backfilled | **YES** |
| Concurrent completion + visit | `completed_blocks[]` atomically appended | `completedAt` preserved by visit upsert | **YES** |

**Drift Prevention:** None observed in `recordBlockCompletion()` / `recordBlockVisit()` / `recordBlockActiveTime()` APIs.

**Evidence State:** VERIFIED (for known APIs) + PARTIAL (exhaustive writer-set verification incomplete)

---

### 5.4 DTO Resolution Strategy

**Strategy:** Canonical-first with legacy fallback

```typescript
private resolveBlockCompletedAt(
  record: TutorialNavigationProgressRecord,
  state: BlockLearningState
): Date | null {
  // 1. Search canonical completion authority
  const authoritativeCompletion = record.completedBlocks.find(
    (completion) =>
      completion.blockId === state.blockId &&
      completion.blockVersion === state.blockVersion
  );

  // 2. Canonical authority wins
  if (authoritativeCompletion) {
    return new Date(authoritativeCompletion.completedAt);
  }

  // 3. Legacy fallback (for older data)
  return state.completedAt;
}
```

**Rationale (from code comment):**
> "Automatic block completion currently persists the canonical completion record in tutorial_navigation_progress but does not necessarily populate block_learning_state.completed_at."

**Finding:** `recordBlockCompletion()` does not write to `block_learning_state.completedAt`. The repository accepts such writes when explicitly supplied, but the known completion APIs do not supply this field.

**Evidence State:** VERIFIED

---

## 6. DTO Construction Authority

### 6.1 Implementation Location

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method:** `toDTO()` (lines 1088-1167)

**Evidence State:** VERIFIED

---

### 6.2 Field Authority Mapping

**Page-Level Fields** (from `TutorialNavigationProgressRecord`):
- `navigationNodeId`
- `sectionId`
- `subtopicId`
- `status` → transformed via `determineLearningState()`
- `progressPercentage` → calculated via `calculateProgressPercentage(completedBlocks, requiredBlocks)`
- `completedBlocks` ← **canonical array**
- `completedBlockCount` → `completedBlocks.length`
- `totalBlockCount` → `requiredBlocks.length`
- `requiredBlocks` ← from canonical tutorial content
- `timeSpentActiveSec` ← page-level cumulative
- `visitCount` ← page-level counter
- `revisionCount` ← page-level counter
- `firstViewedAt`, `lastViewedAt`, `completedAt` ← page-level timestamps

**Block-Level Fields** (from `BlockLearningState[]`):
```typescript
const blocks: BlockLearningStateDTO[] = blockStates.map((state) => {
  const completedAt = this.resolveBlockCompletedAt(record, state);  // ← Canonical-first
  
  return {
    blockId: state.blockId,
    blockVersion: state.blockVersion,
    visitCount: state.visitCount,  // ← Telemetry state
    revisionCount: state.revisionCount,  // ← Telemetry state
    activeTimeSec: state.activeTimeSec,  // ← Telemetry cumulative
    expectedTimeSec: state.expectedTimeSec,  // ← From content
    firstViewedAt: state.firstViewedAt,  // ← Telemetry state
    lastViewedAt: state.lastViewedAt,  // ← Telemetry state
    completedAt,  // ← Canonical completion authority (via resolveBlockCompletedAt)
  };
});
```

**Evidence State:** VERIFIED

---

### 6.3 Absent-Telemetry + Existing-Completion Case

**Scenario:** Block D1 completed but `block_learning_state` soft-deleted

**DTO Result:**
```json
{
  "completedBlocks": [
    {
      "blockId": "D1-uuid",
      "blockVersion": "D1",
      "completedAt": "2026-09-15T14:23:00.000Z"
    }
  ],
  "blocks": [],  // ← Empty (no block_learning_state record)
  "completedBlockCount": 1,
  "progressPercentage": 33  // ← Calculated from completed_blocks[] only
}
```

**Implication:** Per-block metrics unavailable, but completion status preserved.

**Evidence State:** INFERRED (from query logic + DTO construction)

---

## 7. Concurrency and Atomicity

### 7.1 Transaction Boundaries

**Transactional Operations:**
1. ✅ `recordBlockActiveTime()` — event claim + state upsert wrapped in `db.transaction()`
2. ❌ `recordBlockCompletion()` — single atomic UPDATE (no explicit transaction)
3. ❌ `recordBlockVisit()` — single atomic upsert (no explicit transaction)

**Evidence:**
```typescript
// Active-time uses transaction:
return await db.transaction(async (tx) => {
  const txBlockTelemetryRepo = this.blockTelemetryEventRepository.withDb(tx);
  const txBlockStateRepo = this.blockLearningStateRepository.withDb(tx);
  // ...
});

// Completion uses single atomic update:
const [updated] = await this.dbInstance.update(tutorialNavigationProgress)
  .set({ completedBlocks: buildAtomicBlockAppend(...) });

// Visit uses single atomic upsert:
const [result] = await this.dbInstance.insert(blockLearningState)
  .onConflictDoUpdate({ set: { visitCount: atomic_increment } });
```

**Evidence State:** VERIFIED

---

### 7.2 Concurrent Operation Safety

**Scenario 1: Concurrent Completion + Visit**

| Time | Thread A | Thread B | Result |
|------|----------|----------|--------|
| T1 | `recordBlockCompletion()` START | | |
| T2 | `UPDATE tutorial_navigation_progress` | `recordBlockVisit()` START | |
| T3 | Appends to `completed_blocks[]` | `UPSERT block_learning_state` | **INDEPENDENT** |
| T4 | `completedAt` not written | `completedAt` preserved | **NO SYNC** |

**Safety:** Both operations succeed independently. No cross-table locking.  
**Drift:** `block_learning_state.completedAt` remains NULL even though block now completed.

**Evidence State:** INFERRED (from independent table updates)

---

**Scenario 2: Concurrent Active-Time Events**

| Time | Thread A (eventId=E1) | Thread B (eventId=E2) | Result |
|------|----------------------|----------------------|--------|
| T1 | Transaction START | Transaction START | |
| T2 | `claimEvent(E1)` → SUCCESS | `claimEvent(E2)` → SUCCESS | Both new |
| T3 | Upsert state +10sec | Upsert state +15sec | |
| T4 | COMMIT | COMMIT | **SERIALIZABLE** |

**PostgreSQL Upsert Behavior:** Row-level locking during `ON CONFLICT DO UPDATE` serializes concurrent updates to same block identity.

**Evidence:** PostgreSQL semantics + atomic increment expressions

**Evidence State:** INFERRED (relies on PostgreSQL row-level locking)

---

**Scenario 3: Concurrent Visit from Different Sessions**

| Time | Session A | Session B | Result |
|------|-----------|-----------|--------|
| T1 | `recordBlockVisit(sessionA)` | `recordBlockVisit(sessionB)` | |
| T2 | Upsert: `lastSessionId=A` | Upsert: `lastSessionId=B` | Race |
| T3 | SQL: `CASE WHEN lastSessionId IS DISTINCT FROM 'A'` | SQL: `CASE WHEN lastSessionId IS DISTINCT FROM 'B'` | |
| T4 | Visit count +1 | Visit count +1 | **Depends on serialization** |

**Atomicity:** Each upsert atomic (PostgreSQL row-level locking during `ON CONFLICT DO UPDATE`).  
**Correctness:** Repository places session-transition decision inside atomic SQL expression to prevent duplicate increments. Whether this remains correct under concurrent competing sessions **requires runtime/concurrency-test evidence**.

**Evidence:** Atomic SQL CASE documented as intended duplicate-increment prevention mechanism. No explicit SELECT-FOR-UPDATE.

**Evidence State:** INFERRED (concurrency behavior requires testing to establish correctness under load)

---

## 8. Final Authority Table

| Learner-State Field | Source of Truth | Secondary/Denormalized | Writer API | Reconstructable? | Evidence State |
|---------------------|----------------|------------------------|------------|------------------|----------------|
| **Block completion (canonical)** | `tutorial_navigation_progress.completed_blocks[]` | None | `recordBlockCompletion()` | NO | VERIFIED |
| **Completion timestamp (canonical)** | `completed_blocks[].completedAt` | `block_learning_state.completedAt` | `markBlockCompleted()` (canonical only) | NO | VERIFIED |
| **Block completion (denormalized)** | N/A | `block_learning_state.completedAt` | Mutable field; writer set not exhaustively verified | NO | PARTIAL |
| **Visit count** | `block_learning_state.visitCount` | None | `recordBlockVisit()` | NO | VERIFIED |
| **Revision count** | `block_learning_state.revisionCount` | None | `recordBlockVisit()` | NO | VERIFIED |
| **Active time (cumulative)** | `block_learning_state.activeTimeSec` | None | `recordBlockActiveTime()` | YES (from retained ledger) | VERIFIED |
| **Active time (event delta)** | `block_telemetry_events.activeTimeSec` | None | `recordBlockActiveTime()` | N/A (immutable ledger) | VERIFIED |
| **Event deduplication** | `block_telemetry_events.eventId` (unique) | None | `claimEvent()` | N/A | VERIFIED |
| **Last viewed (page-level)** | `tutorial_navigation_progress.lastViewedAt` | None | Multiple APIs write page-level | NO | VERIFIED |
| **Last viewed (block-level)** | `block_learning_state.lastViewedAt` | None | Visit/Active-time APIs write block-level | NO | VERIFIED |
| **First viewed timestamp** | `block_learning_state.firstViewedAt` | None | `recordBlockVisit()` | NO | VERIFIED |
| **Session identity** | `block_learning_state.lastSessionId` | None | `recordBlockVisit()` | NO | VERIFIED |
| **Expected time** | `block_learning_state.expectedTimeSec` | None | `recordBlockVisit()` (from content) | YES (from canonical content) | VERIFIED |

---

## 9. Key Findings

### 9.1 recordBlockCompletion() Does Not Synchronize completedAt

**Finding:** `block_learning_state.completedAt` is a **mutable, optional field** that is not written by `recordBlockCompletion()`.

**Evidence:**
- `markBlockCompleted()` writes only to `completed_blocks[]`
- `upsert()` preserves existing `completedAt` when not supplied
- `recordBlockVisit()` and `recordBlockActiveTime()` do not supply `completedAt`
- Repository accepts `completedAt` writes when explicitly provided via `data.completedAt`

**Implication:** Completion authority separation is established for the known ILS APIs. Exhaustive verification of all potential writers (admin tools, migrations, etc.) remains incomplete.

**Evidence State:** VERIFIED (for recordBlockCompletion/Visit/ActiveTime) + PARTIAL (exhaustive writer-set audit)

---

### 9.2 Three-Authority Model

**Completion Authority:**
- `tutorial_navigation_progress.completed_blocks[]`
- Canonical, atomic deduplicated-append semantics
- Drives progress percentage, completion status

**Event Ledger:**
- `block_telemetry_events`
- Idempotency authority
- Immutable event ledger for retained events
- Survives state deletion, subject to ledger retention/cleanup policy
- Enables reconstruction from retained evidence

**Cumulative State:**
- `block_learning_state`
- Operational metrics (visit/active-time)
- Soft-deletable, recreatable
- Denormalized completion field (not synchronized by recordBlockCompletion)

**Evidence State:** VERIFIED

---

### 9.3 Transaction vs. Atomicity

**Transactional:** Active-time (event claim + state upsert)  
**Atomic (single statement):** Completion, Visit

**Concurrency Note:** Concurrent visits from different sessions use atomic session-transition SQL to prevent duplicate increments. Whether this mechanism remains correct under concurrent competing sessions requires runtime/concurrency-test evidence.

**Evidence State:** VERIFIED (transaction/atomic boundaries) + INFERRED (concurrent-visit correctness requires testing)

---

### 9.4 Reconstruction Capability vs. Implementation

**Reconstructable from Retained Evidence:**
- Event ledger can theoretically rebuild `activeTimeSec` via `SUM(activeTimeSec)`
- Dependent on event retention policy (cleanup infrastructure documented but behavior not verified)
- Identity alignment verified (userId, navigationNodeId, blockId, blockVersion)

**Production Implementation:**
- No reconciliation/rebuild mechanism found
- Soft-delete → recreate loses historical cumulative values

**Evidence State:** VERIFIED (reconstruction capability from retained events) + VERIFIED (absence of implementation)

---

## 10. Boundary Conditions

### 10.1 State Deleted, Completion Persists

**Status:** INFERRED (no explicit test)  
**Behavior:** Completion counts in progress, per-block metrics unavailable

### 10.2 Event Ledger Persists, State Absent

**Status:** VERIFIED  
**Behavior:** Duplicate events correctly rejected, stub state returned

### 10.3 Concurrent Completion + Visit

**Status:** INFERRED  
**Behavior:** Both succeed independently, no `completedAt` sync

### 10.4 State Recreated After Delete

**Status:** INFERRED  
**Behavior:** Fresh counters, historical values lost, no automatic reconstruction

---

## 11. Evidence Classification

| Finding | Evidence State | Source |
|---------|---------------|--------|
| Completion writes only to `completed_blocks[]` | VERIFIED | `markBlockCompleted()` code inspection |
| `recordBlockCompletion` does not sync `completedAt` | VERIFIED | No write to block_learning_state in completion chain |
| Repository accepts `completedAt` writes when supplied | VERIFIED | `upsert()` parameter inspection |
| Exhaustive `completedAt` writer-set audit | PARTIAL | Known ILS APIs verified; admin/migration writers not verified |
| DTO uses canonical-first resolution | VERIFIED | `resolveBlockCompletedAt()` code inspection |
| Active-time uses transaction | VERIFIED | `recordBlockActiveTime()` code inspection |
| Event ledger enables reconstruction | VERIFIED | Schema + SUM() equivalence for retained events |
| Reconstruction not implemented | VERIFIED | Absence confirmed via search |
| Concurrent visit atomic session-transition | VERIFIED | SQL CASE expression documented |
| Concurrent visit correctness under load | INFERRED | Requires concurrency testing |
| Soft-delete + recreate loses history | INFERRED | Partial unique index semantics |
| Page-level vs block-level `lastViewedAt` distinction | VERIFIED | Separate tables, separate fields |

---

## 12. Next Steps for Stage 5

1. ✅ Runtime providers (06A)
2. ✅ Completion chain (06B)
3. ✅ Visit persistence (06C)
4. ✅ Active-time persistence (06D)
5. ✅ Authority synthesis (06E) ← **THIS DOCUMENT**
6. ⏳ Remaining runtime components (buildBlockMetadataResolver, sanitizeDocument, validation)
7. ⏳ Integration evidence (Composer, testing, certification)
8. ⏳ Terminology resolution (UBRC/LSNB/RSSB)

---

**Document Status:** COMPLETE  
**T3 Investigation:** COMPLETE  
**Evidence State:** VERIFIED (all primary findings), INFERRED (concurrency edge cases)
