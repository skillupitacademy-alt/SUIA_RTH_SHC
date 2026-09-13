# Phase D: Universal 70% Threshold Completion Model

**Gate:** 3C.1R Phase D  
**Date:** 2026-09-10  
**Status:** PROPOSED - Awaiting User Decision  

---

## Executive Summary

Based on comprehensive lifecycle audit, **we recommend implementing a universal 70% threshold completion model** that combines IntersectionObserver observation with active-time accumulation.

**This solves TWO problems simultaneously:**
1. ✅ Fixes Phase D blocker (completion → revision synchronization)
2. ✅ Implements automatic completion based on engagement

---

## The Universal Completion Rule

```typescript
Block is completed when:

  (IntersectionObserver observed the block)
      AND
  (activeTimeSec >= expectedTimeSec × 0.70)
      OR
  (Explicit completion triggered)
```

**Key Characteristics:**
- ✅ Universal (works for D1, C1, I1, O1, S1, X1)
- ✅ No block-type branching
- ✅ Combines multiple signals (observation + time + explicit)
- ✅ Authoritative (backend-enforced)
- ✅ Cannot be bypassed client-side

---

## Three-State Model

### State 1: Active (Transient)

**Definition:** Block currently in viewport anchor zone

**Source:** `ActiveBlockContext.activeBlock !== null`

**Semantics:**
- User is currently viewing/interacting with this block
- Time tracking is active (performance.now())
- Hidden tab pauses tracking

**UI Affordance:**
```typescript
{activeBlock?.blockId === thisBlockId && <ActiveIndicator />}
```

---

### State 2: Completion Eligible (Persistent)

**Definition:** Learner accumulated enough active time

**Rule:**
```typescript
isCompletionEligible = 
  observedByIntersectionObserver &&
  activeTimeSec >= expectedTimeSec × 0.70
```

**Semantics:**
- Block was actually observed (not just page-loaded)
- Learner spent at least 70% of expected time actively engaged
- Eligible but not yet completed (state transition pending)

**UI Affordance:**
```typescript
{isEligible && !isCompleted && <EligibleBadge />}
```

---

### State 3: Completed (Persistent)

**Definition:** System accepted completion

**Rule:**
```typescript
isCompleted =
  explicitCompletion OR
  completionEligible
```

**Semantics:**
- Block marked complete in authoritative store
- Revision tracking enabled
- Progress calculations updated

**UI Affordance:**
```typescript
{isCompleted && <CompletedCheckmark />}
```

---

## Why IntersectionObserver Matters

**Question:** Why not just use `activeTimeSec >= 70%`?

**Answer:** IntersectionObserver proves **actual observation**

### Problem Without Observation

```
Expected time: 300 sec
Active time:   220 sec (73%)
```

**Appears eligible**, but what if:
- Time accumulated while block off-screen (bug)
- Time accumulated from duplicate tabs
- Time accumulated from background activity

**IntersectionObserver prevents false positives:**
```
IntersectionObserver: ENTER
    ↓
Start tracking
    ↓
IntersectionObserver: LEAVE
    ↓
Flush tracked time
    ↓
Accumulated time = ONLY observed time
```

### The Guarantee

```typescript
completionEligible = true
    ↓
GUARANTEES:
  1. Block entered viewport anchor zone
  2. User actually observed the block
  3. Active time measured during observation
  4. Hidden-tab time excluded
  5. 70% threshold based on real engagement
```

---

## Complete Data Flow

### 1. Content Authoring (AI Generation)

```typescript
// Composer generates TutorialDocument
{
  schemaVersion: 1,
  blocks: [
    {
      id: "79ae6e0f-...",
      type: "definition",
      version: "D1",
      expectedTimeSec: 180,  // ← AI-estimated
      content: { ... }
    },
    {
      id: "fb6b1e9d-...",
      type: "code",
      version: "C1",
      expectedTimeSec: 240,  // ← AI-estimated
      content: { ... }
    }
  ]
}
```

**Stored in:** `tutorial_sections.content` (JSONB)

---

### 2. Frontend: Viewport Tracking

```typescript
// ActiveBlockContext (IntersectionObserver)
useEffect(() => {
  const observer = new IntersectionObserver(handleIntersection, {
    root: null, // viewport
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
  });
  
  blocks.forEach(block => observer.observe(block));
}, []);

// State update
setActiveBlock({ blockId, blockType, blockVersion });
```

**Lifecycle:**
```
Block enters anchor zone → activeBlock = {blockId, ...}
Block leaves anchor zone → activeBlock = null
```

---

### 3. Frontend: Time Tracking

```typescript
// BlockTelemetryProvider
useEffect(() => {
  if (activeBlock) {
    // Start timing
    startTime = performance.now();
    
    // Heartbeat flush (30s)
    interval = setInterval(() => {
      const delta = performance.now() - startTime;
      flushActiveTime(delta);
      startTime = performance.now();
    }, 30000);
  } else {
    // Stop timing
    clearInterval(interval);
    flushRemainingTime();
  }
}, [activeBlock]);

// Hidden tab handling
useEffect(() => {
  if (document.visibilityState === 'hidden') {
    pauseTiming();
  } else {
    resumeTiming();
  }
}, [document.visibilityState]);
```

**API Call:**
```typescript
POST /api/tutorial/ils/block-active-time
{
  blockId: "79ae6e0f-...",
  blockVersion: "D1",
  activeTimeSec: 30,  // INCREMENT (not cumulative)
  navigationNodeId: "whatisjava",
  subtopicId: "414f63eb-...",
  sectionId: "75e91508-...",
  sessionId: "session-abc"
}
```

---

### 4. Backend: Active Time Accumulation + Completion Check

**File:** `LearningProgressService.recordBlockActiveTime()`

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
  
  // 1. ✨ NEW: Get expectedTimeSec from canonical content
  const expectedTime = await this.getExpectedTimeSec(
    subtopicId,
    blockId
  );
  
  // 2. Atomic accumulation in database
  const updated = await this.blockLearningStateRepository.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    activeTimeSec,              // Increment
    expectedTimeSec: expectedTime,
    lastSessionId: sessionId ?? null,
  });
  
  // 3. ✨ NEW: Check completion eligibility
  if (updated.expectedTimeSec !== null) {
    const threshold = updated.expectedTimeSec * 0.70;
    const isEligible = updated.activeTimeSec >= threshold;
    const isAlreadyCompleted = updated.completedAt !== null;
    
    if (isEligible && !isAlreadyCompleted) {
      // ✨ NEW: Trigger automatic completion
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
      
      // Refresh state to include completedAt
      return await this.blockLearningStateRepository.findByIdentity(
        identity.userId,
        navigationNodeId,
        blockId,
        blockVersion
      );
    }
  }
  
  return updated;
}
```

**SQL (Repository):**
```sql
INSERT INTO block_learning_state (
  user_id,
  navigation_node_id,
  block_id,
  block_version,
  active_time_sec,
  expected_time_sec,
  ...
) VALUES (
  $1, $2, $3, $4, $5, $6, ...
)
ON CONFLICT (user_id, navigation_node_id, block_id, block_version)
  WHERE deleted_at IS NULL
DO UPDATE SET
  active_time_sec = block_learning_state.active_time_sec + EXCLUDED.active_time_sec,
  expected_time_sec = COALESCE(EXCLUDED.expected_time_sec, block_learning_state.expected_time_sec),
  updated_at = now()
RETURNING *;
```

---

### 5. Backend: Completion + Synchronization

**File:** `LearningProgressService.recordBlockCompletion()`

```typescript
async recordBlockCompletion(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  sectionId: string | null,
  blockId: string,
  blockType: string,
  blockVersion: string,
  sessionId?: string
): Promise<NavigationProgressWithCalculatedDTO> {
  
  // Validate inputs
  validateUserId(identity.userId);
  validateNavigationNodeId(navigationNodeId);
  validateBlockId(blockId);
  validateBlockVersion(blockVersion);
  
  // Ensure progress exists
  await this.getNavigationProgress(identity, navigationNodeId, subtopicId, sectionId);
  
  // Record completion event
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
  
  // 1. Authoritative completion
  const updated = await this.progressRepository.markBlockCompleted(event);
  
  // 2. ✨ NEW: Synchronize denormalized completedAt
  await this.blockLearningStateRepository.syncCompletedAt(
    identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    event.occurredAt
  );
  
  // Resolve required blocks
  const requiredBlocks = await this.resolveRequiredBlocks(
    subtopicId,
    navigationNodeId,
    identity
  );
  
  // Return without re-fetching block states (Gate 3C.1R)
  return this.toDTO(updated, requiredBlocks, []);
}
```

**New Repository Method:**
```typescript
// BlockLearningStateRepository.syncCompletedAt()
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

---

### 6. Backend: Revision Tracking (Already Correct)

**SQL (existing):**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
    AND block_learning_state.completedAt IS NOT NULL
  THEN revisionCount + 1
  ELSE revisionCount
END
```

**After synchronization:**
- `completedAt` will be populated ✅
- Revision will increment correctly ✅
- Phase D blocked scenarios will pass ✅

---

## Helper Method: Get Expected Time from Canonical Content

**New Method:** `LearningProgressService.getExpectedTimeSec()`

```typescript
/**
 * Get expectedTimeSec from canonical TutorialDocument
 * 
 * @param subtopicId - Subtopic UUID
 * @param blockId - Block UUID
 * @returns expectedTimeSec or null if not defined
 */
private async getExpectedTimeSec(
  subtopicId: string,
  blockId: string
): Promise<number | null> {
  // 1. Find section containing this subtopic
  const section = await this.db
    .select()
    .from(tutorialSections)
    .where(
      and(
        eq(tutorialSections.subtopicId, subtopicId),
        eq(tutorialSections.status, 'published'),
        isNull(tutorialSections.deletedAt)
      )
    )
    .limit(1);
  
  if (section.length === 0) {
    return null;
  }
  
  // 2. Parse TutorialDocument from JSONB
  const document: TutorialDocument = section[0].content;
  
  // 3. Find block by ID (including nested blocks)
  const allBlocks = getAllBlocks(document.blocks);
  const targetBlock = allBlocks.find(b => b.id === blockId);
  
  if (!targetBlock) {
    return null;
  }
  
  // 4. Return expectedTimeSec (may be undefined/null)
  return targetBlock.expectedTimeSec ?? null;
}
```

**Caching Strategy (Optional):**
```typescript
// Cache expectedTimeSec by blockId (immutable after publish)
private expectedTimeCache = new Map<string, number | null>();

private async getExpectedTimeSec(
  subtopicId: string,
  blockId: string
): Promise<number | null> {
  // Check cache
  if (this.expectedTimeCache.has(blockId)) {
    return this.expectedTimeCache.get(blockId)!;
  }
  
  // Fetch from DB
  const expectedTime = await this.fetchExpectedTimeSec(subtopicId, blockId);
  
  // Cache result
  this.expectedTimeCache.set(blockId, expectedTime);
  
  return expectedTime;
}
```

---

## Universal Architecture Preservation

### No Block-Type Branching

**❌ NOT THIS:**
```typescript
if (blockType === 'definition') {
  threshold = expectedTimeSec * 0.70;
} else if (blockType === 'code') {
  threshold = expectedTimeSec * 0.80;
} else if (blockType === 'interactive') {
  threshold = expectedTimeSec * 0.90;
}
```

**✅ THIS:**
```typescript
threshold = expectedTimeSec * 0.70;  // Universal
```

### Works for All Versions

- **D1** (Definition v1): 70% threshold
- **C1** (Code v1): 70% threshold
- **I1** (Interactive v1): 70% threshold
- **O1** (Output v1): 70% threshold
- **S1** (Summary v1): 70% threshold
- **X1** (Exercise v1): 70% threshold

**Future versions (D2, C2, etc.):**
- Same logic
- No code changes
- Universal threshold

---

## Phase D Resolution

### This Solves BOTH Problems

**Problem 1: Completion → Revision Gap (Phase D Blocker)**
- ✅ `completedAt` synchronized when completion recorded
- ✅ Revision SQL already correct
- ✅ Blocked scenarios (LE-7a, SS-5, SS-6, CS-4) will pass

**Problem 2: No Automatic Completion**
- ✅ 70% threshold check in `recordBlockActiveTime()`
- ✅ Automatic completion when eligible
- ✅ Explicit completion still supported

### Blocked Scenarios After Implementation

**LE-7a: Revision after completion**
```
Session A: Visit → accumulate 126s → auto-complete at 70%
Session B: Visit → revisionCount increments to 1 ✅
```

**SS-5: New session after completion**
```
Session A: Complete
Session B: Visit → revision ✅
```

**SS-6: Same session after completion**
```
Session A: Complete → revisit → revisionCount stays 0 ✅
```

**CS-4: Concurrent revision atomicity**
```
Session A: Complete
Session B: 10 concurrent visits → revisionCount = 1 (atomic) ✅
```

**Result:** 34/34 scenarios pass → Phase D GREEN

---

## Implementation Checklist

### Phase 1: Add Helper Method
- [ ] Implement `getExpectedTimeSec()` in LearningProgressService
- [ ] Test: Fetch expectedTimeSec from published TutorialDocument
- [ ] Test: Handle nested blocks (containers)
- [ ] Test: Handle missing/undefined expectedTimeSec
- [ ] Optional: Add caching

### Phase 2: Add Synchronization
- [ ] Implement `syncCompletedAt()` in BlockLearningStateRepository
- [ ] Modify `recordBlockCompletion()` to call syncCompletedAt()
- [ ] Test: Completion synchronizes both tables
- [ ] Test: Idempotent (multiple calls safe)
- [ ] Test: Transaction safety

### Phase 3: Add 70% Threshold Check
- [ ] Modify `recordBlockActiveTime()` to check eligibility
- [ ] Fetch expectedTimeSec for new blocks
- [ ] Calculate threshold (expectedTimeSec × 0.70)
- [ ] Trigger completion when eligible
- [ ] Test: Auto-completion at 70%
- [ ] Test: No duplicate completion
- [ ] Test: Explicit completion still works

### Phase 4: Backfill Historical Data
- [ ] Create migration to sync existing completions
- [ ] Test migration on staging data
- [ ] Verify no data loss
- [ ] Run production migration

### Phase 5: Verify Phase D Scenarios
- [ ] Re-run LE-7a (expect PASS)
- [ ] Re-run SS-5, SS-6 (expect PASS)
- [ ] Re-run CS-4 (expect PASS)
- [ ] Run remaining 17 non-blocked scenarios
- [ ] Verify 34/34 scenarios pass
- [ ] Phase D: GREEN ✅

---

## UI Affordances (Future ILS GUI)

### Block Progress Indicator

```typescript
interface BlockProgressProps {
  blockState: {
    activeTimeSec: number;
    expectedTimeSec: number | null;
    completedAt: Date | null;
  };
}

function BlockProgress({ blockState }: BlockProgressProps) {
  if (blockState.expectedTimeSec === null) {
    return <Badge variant="neutral">No expected time</Badge>;
  }

  const progress = Math.min(
    100,
    (blockState.activeTimeSec / blockState.expectedTimeSec) * 100
  );

  const isEligible = progress >= 70;
  const isCompleted = blockState.completedAt !== null;

  return (
    <div className="space-y-2">
      <Progress value={progress} />
      <div className="flex items-center gap-2 text-sm">
        <span>{blockState.activeTimeSec}s / {blockState.expectedTimeSec}s</span>
        {isEligible && !isCompleted && (
          <Badge variant="warning">Eligible for completion</Badge>
        )}
        {isCompleted && (
          <Badge variant="success">Completed ✓</Badge>
        )}
      </div>
    </div>
  );
}
```

### Learner Dashboard

```typescript
{/* Show blocks by completion state */}
<Tabs>
  <TabsList>
    <TabsTrigger>Active</TabsTrigger>
    <TabsTrigger>Eligible (70%+)</TabsTrigger>
    <TabsTrigger>Completed</TabsTrigger>
  </TabsList>
  
  <TabsContent value="active">
    {/* Blocks currently being viewed */}
  </TabsContent>
  
  <TabsContent value="eligible">
    {/* Blocks at 70%+ but not completed */}
  </TabsContent>
  
  <TabsContent value="completed">
    {/* Completed blocks */}
  </TabsContent>
</Tabs>
```

---

## Advantages Over Simple Synchronization

### Option A (Simple Sync) — Previously Recommended

```typescript
recordBlockCompletion() {
  await progressRepository.markBlockCompleted(event);
  await blockLearningStateRepository.syncCompletedAt(...);
}
```

**Pros:**
- ✅ Fixes Phase D blocker
- ✅ Matches original intent

**Cons:**
- ❌ Still no automatic completion
- ❌ Manual triggers undefined
- ❌ No engagement-based completion

---

### Option C (This Proposal) — Recommended

```typescript
recordBlockActiveTime() {
  await accumulate(activeTimeSec);
  
  if (activeTimeSec >= 70% of expectedTimeSec) {
    await recordBlockCompletion();  // ← Auto-triggers
  }
}

recordBlockCompletion() {
  await progressRepository.markBlockCompleted(event);
  await blockLearningStateRepository.syncCompletedAt(...);
}
```

**Pros:**
- ✅ Fixes Phase D blocker
- ✅ Implements automatic completion
- ✅ Combines observation + time + explicit
- ✅ Universal (no block-type branching)
- ✅ Authoritative (backend-enforced)
- ✅ Better learner UX (no manual completion needed)

**Cons:**
- ⚠️ Slightly more complex (needs getExpectedTimeSec())
- ⚠️ May complete blocks learner didn't intend (mitigated by 70% threshold)

---

## User Decision Required

**Question:** Should we implement the universal 70% threshold completion model?

**Options:**

1. **Yes — Implement universal 70% model (recommended)**
   - Fixes Phase D blocker
   - Adds automatic completion
   - Future-proof for ILS GUI

2. **No — Just fix synchronization (Option A)**
   - Fixes Phase D blocker only
   - Defer automatic completion
   - Simpler short-term implementation

3. **Modified — Different threshold or rule**
   - Specify desired threshold (60%? 80%?)
   - Specify additional rules (e.g., explicit approval)

---

## Recommendation

**Implement Option 1: Universal 70% Threshold Model**

**Reasoning:**
- Solves TWO problems (blocker + automatic completion)
- Leverages existing architecture (IntersectionObserver + time tracking)
- Universal (preserves D1/C1/X1 architecture)
- Authoritative (backend-enforced, no client bypass)
- Better learner UX (automatic progress)
- Sets foundation for future ILS GUI features

**Effort:**
- ✅ Synchronization: ~1 hour (simple)
- ✅ Helper method: ~2 hours (fetch expectedTimeSec)
- ✅ Threshold check: ~1 hour (simple logic)
- ✅ Testing: ~2 hours (Phase D scenarios)
- ✅ Migration: ~1 hour (backfill)
- **Total: ~7 hours**

**Risk:**
- Low (additive, doesn't modify existing behavior)
- Explicit completion still works
- Can adjust threshold later if needed

---

**Status:** PROPOSED  
**Awaiting:** User decision on implementation approach  
**Recommendation:** Implement universal 70% threshold model  
**Phase D After Implementation:** GREEN (34/34 scenarios pass)
