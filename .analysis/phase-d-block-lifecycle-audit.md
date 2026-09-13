# Phase D: Block Lifecycle Architecture Audit

**Gate:** 3C.1R Phase D  
**Date:** 2026-09-10  
**Purpose:** Audit existing IntersectionObserver → ActiveBlockContext → active time → completion path to evaluate universal 70% threshold completion model  

---

## Executive Summary

**Proposed Universal Completion Model:**
```
Block observed by IntersectionObserver
    AND
activeTimeSec >= expectedTimeSec × 0.70
    OR
Explicit completion
    ↓
Block Completed
```

**Audit Goal:** Determine if this model can be implemented universally using existing architecture

---

## Current Architecture — Layer by Layer

### Layer 1: IntersectionObserver (Viewport Tracking)

**File:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`

**Purpose:** Determines which block is "active" based on viewport position

**How it Works:**

1. **Observes ALL blocks** with `data-block-id` attribute
2. **Anchor Zone:** Top 25% of viewport (natural reading position)
3. **Selection Policy:**
   - Calculates intersection of each visible block with anchor zone
   - Selects block with highest intersection HEIGHT in anchor zone
   - Tie-breaker: First block in DOM order
   - No intersection: Selects topmost visible block

**State Exposed:**
```typescript
interface ActiveBlockIdentity {
  blockId: string;
  blockType: string;
  blockVersion?: string;
}

type ActiveBlockState = ActiveBlockIdentity | null;
```

**Critical Characteristics:**
- ✅ Deterministic (same scroll position always selects same block)
- ✅ No side effects (pure observation)
- ✅ Does NOT track time
- ✅ Does NOT call APIs
- ✅ Does NOT persist state
- ✅ Emits only block identity changes

**Lifecycle Events:**
```
Block enters anchor zone → activeBlock = {blockId, blockType, blockVersion}
Block leaves anchor zone → activeBlock = null (or next block)
```

**What It Does NOT Provide:**
- ❌ Explicit START/STOP timestamps
- ❌ ENTER/LEAVE events
- ❌ Pause/resume signals
- ❌ Active time accumulation

**Answer to Audit Question 1-2:**

1. **When does a block start?**
   - When `activeBlock` changes FROM null or different block TO this block
   
2. **When does it stop?**
   - When `activeBlock` changes FROM this block TO null or different block

---

### Layer 2: BlockTelemetryProvider (Time Tracking & Emission)

**File:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

**Purpose:** Converts activeBlock changes into timed telemetry events

**How it Works:**

1. **Consumes** `activeBlock` from ActiveBlockContext
2. **Tracks timing** using `performance.now()` (not heartbeat ticks)
3. **Emits visit** when block becomes active (deduplicated)
4. **Accumulates active time** while block is active
5. **Flushes active time** periodically (30s heartbeat) and on block changes
6. **Pauses timing** when tab/window becomes hidden

**Timing State:**
```typescript
interface TimingState {
  blockId: string;
  blockVersion: string;
  startTime: number;           // performance.now() when started
  accumulatedMs: number;        // accumulated time between flushes
  isPaused: boolean;            // true when tab hidden
}
```

**Critical Architecture:**
```
activeBlock changes
    ↓
Start timing: startTime = performance.now()
    ↓
Heartbeat (30s)
    ↓
Calculate delta: performance.now() - startTime + accumulatedMs
    ↓
Emit: recordBlockActiveTime(delta / 1000) ← INCREMENT, not cumulative
    ↓
Reset: accumulatedMs = 0, startTime = performance.now()
    ↓
Repeat until block changes
    ↓
Block changes
    ↓
Flush remaining time
    ↓
Start timing new block
```

**Hidden Tab Behavior:**
```
Document visibility changes to 'hidden'
    ↓
isPaused = true
    ↓
accumulatedMs += performance.now() - startTime
    ↓
Stop accumulating (time frozen)
    ↓
Document visibility changes to 'visible'
    ↓
isPaused = false
    ↓
startTime = performance.now()
    ↓
Resume accumulating
```

**Critical Constraints:**
- ✅ `activeTimeSec` is an INCREMENT (delta), not cumulative
- ✅ Hidden tab time is excluded
- ✅ Flushes are serialized (no double-counting)
- ✅ Pending time survives block transitions (queued for delivery)
- ✅ Failures do NOT break learner UX

**API Calls:**
```typescript
// Visit (once per block per session)
POST /api/tutorial/ils/block-visit
{
  blockId,
  blockVersion,
  sessionId,
  ...
}

// Active Time (periodic, incremental)
POST /api/tutorial/ils/block-active-time
{
  blockId,
  blockVersion,
  activeTimeSec: 30,  // ← INCREMENT
  ...
}
```

**What It Does NOT Do:**
- ❌ Calculate completion eligibility
- ❌ Check 70% threshold
- ❌ Trigger completion
- ❌ Know about `expectedTimeSec`

**Answer to Audit Questions 3-5:**

3. **How is active time accumulated?**
   - Uses `performance.now()` to measure actual elapsed duration
   - Flushes every 30 seconds as INCREMENT to backend
   - Backend sums increments to get cumulative `activeTimeSec`

4. **Is hidden-tab time excluded?**
   - ✅ YES - pauses when document visibility = 'hidden'
   - Resumes when visibility = 'visible'

5. **How do multiple enter/leave cycles behave?**
   - Each block change flushes remaining time
   - New block starts fresh timing
   - Pending time survives transitions (delivery queue)

---

### Layer 3: Backend — Active Time Accumulation

**Service:** `LearningProgressService.recordBlockActiveTime()`
**Repository:** `BlockLearningStateRepository.upsert()`

**SQL Logic:**
```sql
INSERT INTO block_learning_state (
  ...,
  active_time_sec
) VALUES (
  ...,
  NEW.active_time_sec
)
ON CONFLICT (...) DO UPDATE SET
  active_time_sec = block_learning_state.active_time_sec + EXCLUDED.active_time_sec,
  updated_at = now()
```

**Critical:** Atomic accumulation in database (not service layer)

**Current State:**
- ✅ `activeTimeSec` accumulates correctly (atomic +=)
- ✅ Multiple flushes from same block sum correctly
- ✅ Concurrency-safe (PostgreSQL atomic UPDATE)

**What It Does NOT Do:**
- ❌ Compare `activeTimeSec` to `expectedTimeSec`
- ❌ Calculate completion eligibility
- ❌ Trigger completion when threshold reached

---

### Layer 4: Expected Time Source

**Schema:** `block_learning_state.expectedTimeSec`

**Source:** Canonical tutorial content (TutorialDocument)

**Storage:**
```typescript
// When block content is published
{
  blockId: uuid,
  blockType: 'definition' | 'code' | ...,
  blockVersion: 'D1' | 'C1' | ...,
  expectedTimeSec: 180,  // ← Authored metadata
  content: { ... }
}
```

**How It Gets to Telemetry:**

Currently: **UNKNOWN** (needs investigation)

**Evidence:**
- Schema has `expectedTimeSec: integer('expected_time_sec')` (nullable)
- Provisioning script sets values (D1: 180s, C1: 240s)
- Backend upsert accepts `expectedTimeSec` parameter
- Tests verify it persists correctly

**What We Don't Know:**
- ❓ How does frontend discover `expectedTimeSec` for a block?
- ❓ Is it embedded in TutorialDocument JSON?
- ❓ Is it fetched from a separate API?
- ❓ Is it sent during block visit/active-time calls?

**Answer to Audit Question 6:**

6. **How is `expectedTimeSec` obtained?**
   - ⚠️ **NEEDS INVESTIGATION** - current flow unclear
   - Likely: Embedded in canonical TutorialDocument content
   - Possibly: Sent by backend when visit recorded
   - May require: Frontend to extract from content and send to backend

---

### Layer 5: Completion Decision (CURRENTLY MISSING)

**Current State:**

There is **NO automatic completion based on 70% threshold**.

**Explicit Completion Only:**
```typescript
// Manual completion trigger (currently undefined in lifecycle)
POST /api/tutorial/ils/block-completion
{
  blockId,
  blockVersion,
  ...
}
```

**What Triggers Explicit Completion:**
- ❓ **UNKNOWN** - no evidence found in UI layer
- No button clicks
- No form submissions
- No automatic triggers based on time
- No 70% threshold checks

**Current Completion Flow:**
```
??? → recordBlockCompletion() → tutorial_navigation_progress.completed_blocks[]
```

**What's Missing:**
```
activeTimeSec >= expectedTimeSec × 0.70
    ↓
Automatic completion decision
    ↓
recordBlockCompletion()
```

**Answer to Audit Questions 7-8:**

7. **Whether the 70% calculation can be universal?**
   - ✅ YES - the logic is block-type-agnostic:
     ```typescript
     isCompletionEligible = 
       activeTimeSec >= (expectedTimeSec × 0.70)
     ```
   - Works for D1, C1, I1, O1, S1, X1 without branching

8. **Where should the completion decision live?**
   - **Option A (Frontend):** BlockTelemetryProvider checks threshold after each flush
   - **Option B (Backend):** LearningProgressService checks threshold in `recordBlockActiveTime()`
   - **Recommendation:** Backend (authoritative, no race conditions, works even if user navigates away)

---

## Proposed Universal Architecture

### New Completion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: IntersectionObserver + ActiveBlockContext             │
│                                                                   │
│ Block enters viewport → activeBlock = {blockId, ...}            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: BlockTelemetryProvider                                 │
│                                                                   │
│ Start timing (performance.now())                                 │
│ Heartbeat: Flush activeTimeSec increment every 30s              │
│ Hidden tab: Pause timing                                         │
│ Block change: Flush remaining time                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ POST /api/tutorial/ils/block-active-time
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: LearningProgressService.recordBlockActiveTime()        │
│                                                                   │
│ 1. Atomic accumulation:                                          │
│    activeTimeSec += increment                                    │
│                                                                   │
│ 2. ✨ NEW: Check completion eligibility:                         │
│    if (activeTimeSec >= expectedTimeSec × 0.70)                 │
│       AND NOT already completed                                  │
│       AND observedByIntersectionObserver (implicit via visit)   │
│    then:                                                          │
│       await recordBlockCompletion(...)                           │
│                                                                   │
│ 3. Return updated state                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: recordBlockCompletion()                                 │
│                                                                   │
│ 1. Mark in tutorial_navigation_progress.completed_blocks[]      │
│ 2. ✨ NEW: Sync block_learning_state.completedAt                │
│ 3. Enable revision tracking                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Three-State Model

```typescript
// State 1: Active (transient)
activeBlock !== null

// State 2: Completion Eligible (persistent)
activeTimeSec >= expectedTimeSec × 0.70

// State 3: Completed (persistent)
explicitCompletion OR completionEligible
```

### Completion Rule

```typescript
// Universal completion decision (backend)
async recordBlockActiveTime(...) {
  // 1. Accumulate time atomically
  const updated = await repository.upsert({
    activeTimeSec: currentActive + increment,
    ...
  });

  // 2. Check eligibility
  const isEligible =
    updated.expectedTimeSec !== null &&
    updated.activeTimeSec >= updated.expectedTimeSec * 0.70;

  // 3. Check not already completed
  const isCompleted = await this.isBlockCompleted(
    userId,
    navigationNodeId,
    blockId,
    blockVersion
  );

  // 4. Trigger completion if eligible and not completed
  if (isEligible && !isCompleted) {
    await this.recordBlockCompletion(
      identity,
      navigationNodeId,
      subtopicId,
      sectionId,
      blockId,
      blockType,
      blockVersion,
      sessionId
    );
  }

  return updated;
}
```

---

## Answers to All 10 Audit Questions

### 1. Exactly when a block starts

**Answer:** When `activeBlock` state changes TO this block (IntersectionObserver detects it's in anchor zone)

**Evidence:** `ActiveBlockProvider` updates `activeBlock` state based on anchor zone intersection

---

### 2. Exactly when it stops

**Answer:** When `activeBlock` state changes FROM this block (leaves anchor zone or different block enters)

**Evidence:** `BlockTelemetryProvider` flushes remaining time on `activeBlock` change

---

### 3. How active time is accumulated

**Answer:** 
- **Frontend:** Uses `performance.now()` to measure elapsed duration
- **Backend:** Atomic SQL `+=` accumulation in `block_learning_state.active_time_sec`

**Evidence:**
- `BlockTelemetryProvider.tsx` lines tracking `startTime` and `accumulatedMs`
- Repository SQL: `active_time_sec = block_learning_state.active_time_sec + EXCLUDED.active_time_sec`

---

### 4. Whether hidden-tab time is excluded

**Answer:** ✅ YES

**Evidence:**
- `BlockTelemetryProvider` pauses timing when `document.visibilityState === 'hidden'`
- Resumes when visible
- Tests verify hidden time not counted

---

### 5. How multiple enter/leave cycles behave

**Answer:**
- Each block change flushes remaining time
- New block starts fresh timing
- Pending time survives transitions (queued for delivery)
- No time lost between cycles

**Evidence:** `BlockTelemetryProvider` maintains `pendingQueueRef` for undelivered time

---

### 6. How `expectedTimeSec` is obtained

**Answer:** ⚠️ **NEEDS INVESTIGATION**

**Current Evidence:**
- Schema stores it: `block_learning_state.expected_time_sec`
- Provisioning sets it: D1=180s, C1=240s
- Backend accepts it in upsert
- **Missing:** How frontend discovers and sends it

**Likely Flow:**
- TutorialDocument contains `expectedTimeSec` per block
- Frontend extracts from content
- Sends during first visit or active-time call

**Action Required:** Trace how `expectedTimeSec` flows from canonical content → backend

---

### 7. Whether the 70% calculation can be universal

**Answer:** ✅ YES - completely generic

**Reasoning:**
```typescript
isEligible = activeTimeSec >= expectedTimeSec × 0.70
```

No `if (blockType === 'definition')` needed.  
No `if (blockVersion === 'D1')` needed.

Works for ALL block types: D1, C1, I1, O1, S1, X1.

**Universal Architecture Preservation:** ✅ CONFIRMED

---

### 8. Where the completion decision should live

**Answer:** **Backend** (LearningProgressService)

**Reasoning:**

**Option A (Frontend):**
- ❌ Race conditions (multiple tabs/devices)
- ❌ User navigates away before completion fires
- ❌ Client-side manipulation possible
- ❌ Requires querying completion status from frontend

**Option B (Backend):**
- ✅ Authoritative (single source of truth)
- ✅ No race conditions (atomic DB checks)
- ✅ Works even if user closes tab (next heartbeat completes it)
- ✅ Cannot be bypassed client-side
- ✅ Completion and active-time update in same service call

**Recommendation:** Implement in `LearningProgressService.recordBlockActiveTime()`

---

### 9. How completion should synchronize with `tutorial_navigation_progress`

**Answer:** Use **Option A from architectural decision** (synchronize `completedAt`)

**Flow:**
```typescript
// In recordBlockActiveTime()
if (isEligible && !isCompleted) {
  // This already synchronizes both tables
  await this.recordBlockCompletion(...);
}

// recordBlockCompletion() implementation:
async recordBlockCompletion(...) {
  // 1. Authoritative completion
  await this.progressRepository.markBlockCompleted(event);
  
  // 2. ✨ NEW: Denormalized sync
  await this.blockLearningStateRepository.syncCompletedAt(
    userId,
    navigationNodeId,
    blockId,
    blockVersion,
    new Date()
  );
}
```

**This solves the Phase D blocker AND implements 70% threshold.**

---

### 10. How revision should consume the resulting completion state

**Answer:** Existing revision SQL is already correct

```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND block_learning_state.completedAt IS NOT NULL
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**After implementing sync:**
- `completedAt` will be populated (no longer NULL)
- Revision will increment correctly
- Phase D blocked scenarios will pass

---

## Missing Piece: expectedTimeSec Flow

### Current Gap

We need to trace:
```
TutorialDocument (canonical content)
    ↓
    ??? 
    ↓
block_learning_state.expected_time_sec
```

### Investigation Required

**Search for:**
1. How TutorialDocument is structured (JSON schema)
2. Whether `expectedTimeSec` is embedded in blocks
3. How frontend accesses TutorialDocument
4. When/how `expectedTimeSec` is sent to backend

**Files to Check:**
- Tutorial content loading (ILSProvider, content fetching)
- Block rendering (how blocks get their metadata)
- API call construction (where expectedTimeSec parameter comes from)

---

## Recommended Implementation Plan

### Phase 1: Trace expectedTimeSec Flow

1. Find TutorialDocument schema
2. Confirm `expectedTimeSec` is in canonical content
3. Trace how it reaches backend
4. Document the complete flow

### Phase 2: Implement Completion Eligibility (Backend)

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`

**Modify:** `recordBlockActiveTime()`

```typescript
async recordBlockActiveTime(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  activeTimeSec: number,
  sessionId?: string
): Promise<BlockLearningState> {
  // 1. Accumulate time atomically
  const updated = await this.blockLearningStateRepository.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    activeTimeSec,
    lastSessionId: sessionId ?? null,
    expectedTimeSec, // ← Need to determine how this is provided
  });

  // 2. ✨ NEW: Check completion eligibility
  if (updated.expectedTimeSec !== null) {
    const threshold = updated.expectedTimeSec * 0.70;
    const isEligible = updated.activeTimeSec >= threshold;

    if (isEligible && updated.completedAt === null) {
      // Trigger automatic completion
      await this.recordBlockCompletion(
        identity,
        navigationNodeId,
        subtopicId,
        null, // sectionId ← need to determine
        blockId,
        blockType, // ← need to determine
        blockVersion,
        sessionId
      );
    }
  }

  return updated;
}
```

### Phase 3: Implement completedAt Synchronization

**File:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

**Add:**
```typescript
async syncCompletedAt(
  userId: string,
  navigationNodeId: string,
  blockId: string,
  blockVersion: string,
  completedAt: Date
): Promise<void> {
  await this.db
    .update(blockLearningState)
    .set({
      completedAt,
      updatedAt: new Date(),
    })
    .where(and(
      eq(blockLearningState.userId, userId),
      eq(blockLearningState.navigationNodeId, navigationNodeId),
      eq(blockLearningState.blockId, blockId),
      eq(blockLearningState.blockVersion, blockVersion),
      isNull(blockLearningState.deletedAt)
    ))
    .execute();
}
```

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`

**Modify:** `recordBlockCompletion()`

```typescript
async recordBlockCompletion(...) {
  // ... existing validation ...

  // Record completion (authoritative)
  const updated = await this.progressRepository.markBlockCompleted(event);

  // ✨ NEW: Synchronize denormalized completedAt
  await this.blockLearningStateRepository.syncCompletedAt(
    identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    event.occurredAt
  );

  // ... existing return logic ...
}
```

### Phase 4: Backfill Historical Data

**Migration:**
```sql
-- Sync completedAt from completed_blocks for existing data
UPDATE block_learning_state bls
SET 
  completed_at = (
    SELECT (jsonb_array_elements(tnp.completed_blocks) ->> 'completedAt')::timestamp
    FROM tutorial_navigation_progress tnp
    WHERE tnp.user_id = bls.user_id
      AND tnp.navigation_node_id = bls.navigation_node_id
      AND deleted_at IS NULL
      AND jsonb_array_length(
        jsonb_path_query_array(
          tnp.completed_blocks,
          '$ ? (@.blockId == $blockId && @.blockVersion == $blockVersion)',
          jsonb_build_object('blockId', bls.block_id, 'blockVersion', bls.block_version)
        )
      ) > 0
    LIMIT 1
  ),
  updated_at = now()
WHERE bls.completed_at IS NULL
  AND bls.deleted_at IS NULL;
```

### Phase 5: Verify Phase D Scenarios

- Re-run LE-7a (expect PASS)
- Re-run SS-5, SS-6 (expect PASS)
- Re-run CS-4 (expect PASS)
- Run remaining 17 non-blocked scenarios
- **Phase D: GREEN**

---

## Universal Completion States for ILS GUI

### State Schema

```typescript
interface BlockCompletionState {
  // Transient
  isActive: boolean;                    // Currently in viewport
  
  // Persistent
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  
  // Computed
  isCompletionEligible: boolean;        // activeTimeSec >= 70%
  completionProgress: number;           // activeTimeSec / expectedTimeSec
  isCompleted: boolean;                 // explicit OR eligible
  
  // Timestamps
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}
```

### UI Affordances

```typescript
// Example: Block progress indicator
function BlockProgressIndicator({ blockState }: { blockState: BlockCompletionState }) {
  if (blockState.expectedTimeSec === null) {
    return <Badge>No expected time</Badge>;
  }

  const progress = Math.min(
    100,
    (blockState.activeTimeSec / blockState.expectedTimeSec) * 100
  );

  return (
    <div>
      <Progress value={progress} />
      {blockState.isCompletionEligible && !blockState.isCompleted && (
        <Badge>Eligible for completion</Badge>
      )}
      {blockState.isCompleted && (
        <Badge variant="success">Completed</Badge>
      )}
    </div>
  );
}
```

---

## Conclusion

### Can the 70% Model Be Implemented?

**Answer:** ✅ YES - with caveats

**What Works:**
- ✅ IntersectionObserver provides viewport tracking
- ✅ BlockTelemetryProvider provides accurate active time
- ✅ Backend accumulates activeTimeSec atomically
- ✅ Hidden tab time excluded
- ✅ Multiple enter/leave cycles handled
- ✅ 70% calculation is universal (no D1/C1 branching)

**What's Missing:**
- ⚠️ `expectedTimeSec` flow from canonical content → backend (needs investigation)
- ❌ Automatic completion trigger based on threshold
- ❌ `completedAt` synchronization (blocked Phase D scenarios)

**What Needs to be Built:**
1. Trace and document `expectedTimeSec` flow
2. Implement completion eligibility check in `recordBlockActiveTime()`
3. Implement `completedAt` synchronization in `recordBlockCompletion()`
4. Create backfill migration
5. Verify Phase D scenarios pass

**Universal Architecture:**
- ✅ PRESERVED (no block-type branching)
- ✅ D1/C1/X1 all use same logic
- ✅ Generic threshold calculation

**Recommendation:**
- Implement 70% threshold completion AFTER fixing `completedAt` sync
- Combine both fixes in single Phase D completion effort
- This solves Phase D blocker AND adds automatic completion feature

---

## Next Actions

1. **IMMEDIATE:** Investigate `expectedTimeSec` flow (trace canonical content → backend)
2. **DECIDE:** Confirm 70% threshold implementation is desired (user decision)
3. **IMPLEMENT:** If confirmed, build unified solution:
   - Fix `completedAt` synchronization (Option A)
   - Add 70% threshold check in `recordBlockActiveTime()`
   - Create backfill migration
4. **VERIFY:** Re-run Phase D scenarios (expect 34/34 pass)
5. **DOCUMENT:** Update Phase D status to GREEN

---

**Audit Status:** COMPLETE  
**Next Blocker:** `expectedTimeSec` flow investigation  
**Recommendation:** Implement unified completion model (sync + threshold)  
**Phase D:** Can proceed to GREEN after implementation
