# ILS Phase 4 - STEP 4: ActiveBlockContext Lifecycle Audit

**Date:** 2026-09-05  
**Phase:** Phase 4 - Block Learning State & Telemetry Foundation  
**Status:** STEP 4 Complete - Lifecycle analyzed for telemetry integration

---

## Objective

Audit ActiveBlockContext lifecycle behavior to design telemetry integration points that:
1. Detect block enter/exit events for visit tracking
2. Track active time without coupling to block selection logic
3. Maintain ActiveBlockContext as pure selection mechanism (Phase 3 contract)
4. Work automatically for ANY block type (D1, C1, S1, I1, O1, future blocks)

---

## ActiveBlockContext Architecture

### Core Responsibility

**From source comments:**
> "Uses existing Phase 2 DOM identity (data-block-id, data-block-type, data-block-version)"  
> "Does NOT introduce wrapper elements"  
> "Does NOT call ILS APIs"  
> "Does NOT persist state"  
> "Does NOT track time or visits"  
> "Does NOT render UI"

**Phase 3 Established:** Pure block selection mechanism  
**Phase 4 Requirement:** DO NOT modify ActiveBlockContext selection logic

---

## Lifecycle States

### State 1: No Active Block

```typescript
activeBlock = null
```

**Conditions:**
- No blocks visible in viewport
- All blocks scrolled out of view
- Provider unmounted

**Telemetry Action:**
- Flush any pending active time for previous block
- Do NOT record visit (no block is active)

---

### State 2: Block Active

```typescript
activeBlock = {
  blockId: "381048c3-ae87-4a32-aef5-b3b5656fee64",
  blockType: "definition",
  blockVersion: "D1"
}
```

**Conditions:**
- Block intersects viewport anchor zone (top 25%)
- Highest intersection height in anchor zone
- IntersectionObserver detected visibility

**Telemetry Action:**
- Record block visit (with sessionId for session-aware increment)
- Start active time tracking
- Set firstViewedAt (if never viewed before)

---

### State 3: Block Changed

```typescript
// Before:
activeBlock = { blockId: "block-d1", blockType: "definition", blockVersion: "D1" }

// After:
activeBlock = { blockId: "block-c1", blockType: "code", blockVersion: "C1" }
```

**Conditions:**
- User scrolled to different block
- Previous block left anchor zone
- New block entered anchor zone

**Telemetry Actions:**
1. **For previous block (D1):**
   - Flush accumulated active time
   - Update lastViewedAt

2. **For new block (C1):**
   - Record block visit (with sessionId)
   - Start active time tracking
   - Set firstViewedAt (if never viewed)

---

## Selection Algorithm (DO NOT MODIFY)

### Deterministic Policy

**Source:** `determineActiveBlock()` method

**Steps:**
1. Calculate anchor zone: `[0, viewportHeight * 0.25]` (top 25%)
2. For each visible block, calculate intersection HEIGHT with anchor zone
3. Select block with highest intersection HEIGHT
4. Tie-breaker: earliest DOM order (first block in `blockElementsRef`)

**Fallback (no anchor intersection):**
- Select topmost visible block by `boundingClientRect.top`

**Edge Cases:**
- No blocks visible → `activeBlock = null`
- Single block visible → that block is active
- Multiple blocks → deterministic selection

**Critical for Phase 4:**
> This algorithm is PROVEN and TESTED. Phase 4 telemetry MUST NOT modify it.

---

## IntersectionObserver Lifecycle

### Mount (useEffect)

**Trigger:** Component mount or `containerRef` change

**Actions:**
1. Query blocks: `:scope > [data-block-id]` (top-level only, not nested children)
2. Store canonical DOM order in `blockElementsRef`
3. Create single `IntersectionObserver` for ALL blocks
4. Observe all blocks with threshold: `[0, 0.1, 0.25, 0.5, 0.75, 1.0]`

**Telemetry Integration Point:**
> Do NOT create telemetry observer. Consume `activeBlock` state changes via React context.

---

### Intersection Callback

**Trigger:** Block enters/exits viewport or intersection changes

**Actions:**
1. Update `visibleBlocksRef` map (add intersecting, remove non-intersecting)
2. Call `updateActiveBlock()` → schedules via `requestAnimationFrame`
3. `determineActiveBlock()` runs deterministic policy
4. `setActiveBlock()` updates state (only if actually changed)

**Optimization:**
- Single observer for all blocks (not one per block)
- requestAnimationFrame throttling prevents excessive updates
- State only updates if block identity changed (deep equality check)

**Telemetry Integration Point:**
> Subscribe to `activeBlock` state changes via `useEffect` in consuming component.

---

### Unmount

**Trigger:** Component unmount

**Actions:**
1. Cancel pending `requestAnimationFrame`
2. Disconnect `IntersectionObserver`
3. Clear `visibleBlocksRef` map
4. Clear `blockElementsRef` array

**Telemetry Integration Point:**
> Flush pending active time before unmount cleanup.

---

## Identity Extraction (DO NOT MODIFY)

### From DOM Attributes

**Source:** `extractBlockIdentity()` method

```typescript
const blockId = element.getAttribute('data-block-id');      // REQUIRED
const blockType = element.getAttribute('data-block-type');  // REQUIRED
const blockVersion = element.getAttribute('data-block-version') || undefined; // OPTIONAL
```

**Returns:**
```typescript
{
  blockId: string,     // UUID - canonical block instance
  blockType: string,   // "definition", "code", "summary", etc.
  blockVersion?: string // "D1", "C1", "S1", etc. (optional)
}
```

**Validation:**
- Missing `blockId` OR `blockType` → returns `null` (block not observed)
- Missing `blockVersion` → returns `undefined` for that field

**Phase 4 Design:**
> Telemetry MUST use this exact identity. DO NOT create second identity system.

---

## State Update Optimization

### Deep Equality Check

**Source:** `setActiveBlock()` callback

```typescript
setActiveBlock((current) => {
  // Both null → no change
  if (!current && !newActiveBlock) return current;
  
  // One null, one not → change
  if (!current || !newActiveBlock) return newActiveBlock;
  
  // Deep equality: blockId, blockType, blockVersion
  if (
    current.blockId === newActiveBlock.blockId &&
    current.blockType === newActiveBlock.blockType &&
    current.blockVersion === newActiveBlock.blockVersion
  ) {
    return current; // No actual change
  }
  
  return newActiveBlock; // Identity changed
});
```

**Prevents:**
- Unnecessary React re-renders
- Duplicate telemetry events
- Race conditions in telemetry tracking

**Phase 4 Benefit:**
> Telemetry `useEffect` dependency on `activeBlock` fires ONLY on real changes.

---

## Telemetry Integration Architecture

### Pattern: Consumer-Based Telemetry

**DO NOT:** Modify `ActiveBlockProvider` to call telemetry APIs

**DO:** Create telemetry consumer that subscribes to `activeBlock` changes

```typescript
// WRONG (violates Phase 3 contract):
export function ActiveBlockProvider({ children }) {
  const [activeBlock, setActiveBlock] = useState(null);
  
  useEffect(() => {
    if (activeBlock) {
      // ❌ DO NOT ADD ILS API CALLS HERE
      trackBlockVisit(activeBlock);
    }
  }, [activeBlock]);
  
  return <ActiveBlockContext.Provider value={{ activeBlock }}>...</ActiveBlockContext.Provider>;
}
```

```typescript
// CORRECT (Phase 4 pattern):
export function ILSProvider({ children, navigationNodeId, subtopicId }) {
  const { activeBlock } = useActiveBlock(); // Consume Phase 3 context
  
  useEffect(() => {
    if (activeBlock) {
      // ✅ Telemetry logic in CONSUMER, not provider
      recordBlockVisit(activeBlock, navigationNodeId, subtopicId);
    }
  }, [activeBlock, navigationNodeId, subtopicId]);
  
  return <ILSContext.Provider>...</ILSContext.Provider>;
}
```

**Architecture:**
```
ActiveBlockProvider (Phase 3)
      ↓
   provides activeBlock
      ↓
ILSProvider (Phase 4)
      ↓
   consumes activeBlock
      ↓
   triggers telemetry
```

---

## Block Enter Event Design

### Trigger

**React useEffect dependency:** `activeBlock` changes from `null` OR different block

```typescript
const { activeBlock } = useActiveBlock();
const previousBlockRef = useRef<ActiveBlockIdentity | null>(null);

useEffect(() => {
  // Block entered
  if (activeBlock) {
    const isNewBlock = 
      !previousBlockRef.current ||
      previousBlockRef.current.blockId !== activeBlock.blockId ||
      previousBlockRef.current.blockVersion !== activeBlock.blockVersion;
    
    if (isNewBlock) {
      // INTEGRATION POINT: Block entered
      handleBlockEntered(activeBlock);
    }
  }
  
  // Block exited
  if (!activeBlock && previousBlockRef.current) {
    // INTEGRATION POINT: Block exited
    handleBlockExited(previousBlockRef.current);
  }
  
  previousBlockRef.current = activeBlock;
}, [activeBlock]);
```

### Actions on Block Entered

1. **Record Visit:**
   ```typescript
   await trackTutorialEvent({
     eventType: 'block_visit',
     blockId: activeBlock.blockId,
     blockVersion: activeBlock.blockVersion,
     blockType: activeBlock.blockType,
     navigationNodeId,
     subtopicId,
     sessionId: readTutorialLearningSessionId()
   });
   ```

2. **Start Time Tracking:**
   ```typescript
   activeBlockTimeTracker.onBlockEntered(activeBlock, {
     navigationNodeId,
     subtopicId
   });
   ```

---

## Block Exit Event Design

### Trigger

**React useEffect dependency:** `activeBlock` changes to `null` OR different block

```typescript
useEffect(() => {
  return () => {
    // Cleanup: Block exited (component unmount OR activeBlock changed)
    if (previousBlockRef.current) {
      handleBlockExited(previousBlockRef.current);
    }
  };
}, [activeBlock]);
```

### Actions on Block Exited

1. **Flush Active Time:**
   ```typescript
   activeBlockTimeTracker.onBlockExited();
   // Internally: accumulate time, flush to API, reset timer
   ```

2. **No Visit Increment:**
   > Exiting a block does NOT increment visitCount. Only entering in a new session does.

---

## Active Time Tracking Strategy

### Separate Module

**DO NOT:** Put time tracking inside `ActiveBlockProvider`

**DO:** Create dedicated `activeBlockTimeTracker` module

**Rationale:**
- Separation of concerns (selection ≠ telemetry)
- Reusable across different ILS consumers
- Testable independently

### Tracking Requirements

**Start Timer When:**
- Block entered (activeBlock changed to new block)
- Page became visible (after being hidden)

**Pause Timer When:**
- Block exited (activeBlock changed OR null)
- Page became hidden (tab/window not visible)
- Component unmounted

**Flush Timer When:**
- Periodic interval (e.g., every 30s)
- Block exited
- Page became hidden
- Component unmounted

**Accumulation Pattern:**
```typescript
class ActiveBlockTimeTracker {
  private startTime: number | null = null;
  private accumulated: number = 0;
  
  start() {
    this.startTime = Date.now();
  }
  
  pause() {
    if (this.startTime) {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.accumulated += elapsed;
      this.startTime = null;
    }
  }
  
  async flush() {
    if (this.accumulated > 0) {
      await trackTutorialEvent({
        eventType: 'block_time',
        activeTimeSec: this.accumulated,
        ...blockIdentity
      });
      this.accumulated = 0;
    }
  }
}
```

---

## Visibility Change Handling

### Page Visibility API

**Integration:**
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Page became visible → resume timer
      if (activeBlock) {
        activeBlockTimeTracker.resume();
      }
    } else {
      // Page became hidden → pause timer
      activeBlockTimeTracker.pause();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [activeBlock]);
```

**Prevents:**
- Tracking time when tab is backgrounded
- Tracking time when window is minimized
- Inflated active time metrics

---

## React Strict Mode Resilience

### Double Effect Invocation

**Challenge:** React Strict Mode (development) calls effects twice

**ActiveBlockContext Behavior:**
- Observer created twice → second creation cleans up first
- No duplicate observers in production
- State remains consistent

**Phase 4 Telemetry Requirement:**
- Visit tracking MUST be idempotent (same sessionId → no duplicate increment)
- Time tracking MUST handle cleanup → flush before recreating tracker
- API calls MUST NOT duplicate (session-aware deduplication)

**Solution:**
```typescript
useEffect(() => {
  // Visit tracking: idempotent via sessionId
  recordBlockVisit(activeBlock, sessionId);
  
  // Time tracking: cleanup-aware
  const tracker = new ActiveBlockTimeTracker(activeBlock);
  tracker.start();
  
  return () => {
    tracker.flush(); // Flushes accumulated time
    tracker.cleanup();
  };
}, [activeBlock]);
```

---

## Component Unmount Handling

### Cleanup Sequence

**ActiveBlockProvider unmount:**
1. Cancel pending `requestAnimationFrame`
2. Disconnect `IntersectionObserver`
3. Clear internal refs

**Phase 4 Telemetry Consumer unmount:**
1. Flush pending active time for current block
2. Clear timers/intervals
3. Do NOT record "block exited" visit (not a learner action)

**Critical:**
> Unmount cleanup MUST flush time to prevent data loss during navigation.

---

## Integration with ILSProvider

### Architecture

```typescript
function ILSProvider({ 
  children, 
  navigationNodeId, 
  subtopicId 
}: ILSProviderProps) {
  const { activeBlock } = useActiveBlock(); // Phase 3 context
  
  // Page-level ILS state (existing)
  const [overallProgress, setOverallProgress] = useState<ILSOverallProgress | null>(null);
  
  // PHASE 4: Block-level telemetry integration
  const trackerRef = useRef<ActiveBlockTimeTracker | null>(null);
  
  // Fetch page progress (existing)
  useEffect(() => {
    fetchNavigationProgress(navigationNodeId).then(setOverallProgress);
  }, [navigationNodeId]);
  
  // PHASE 4: Track active block
  useEffect(() => {
    if (!activeBlock) {
      // No active block → flush previous tracker
      if (trackerRef.current) {
        trackerRef.current.flush();
        trackerRef.current = null;
      }
      return;
    }
    
    // Active block changed → record visit + start time tracking
    const sessionId = readTutorialLearningSessionId();
    
    // Record visit (idempotent, session-aware)
    trackTutorialEvent({
      eventType: 'block_visit',
      blockId: activeBlock.blockId,
      blockVersion: activeBlock.blockVersion,
      blockType: activeBlock.blockType,
      navigationNodeId,
      subtopicId,
      sessionId,
    });
    
    // Start time tracking
    const tracker = new ActiveBlockTimeTracker({
      block: activeBlock,
      navigationNodeId,
      subtopicId,
    });
    tracker.start();
    trackerRef.current = tracker;
    
    // Cleanup: flush time when block changes
    return () => {
      tracker.flush();
    };
  }, [activeBlock, navigationNodeId, subtopicId]);
  
  // PHASE 4: Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!trackerRef.current) return;
      
      if (document.visibilityState === 'visible') {
        trackerRef.current.resume();
      } else {
        trackerRef.current.pause();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Provide ILS context (existing + Phase 4)
  return (
    <ILSContext.Provider value={{ overallProgress, activeBlock }}>
      {children}
    </ILSContext.Provider>
  );
}
```

---

## Generic Block Support (Critical Requirement)

### Current Support

**ActiveBlockContext already supports:**
- D1: `data-block-type="definition" data-block-version="D1"`
- C1: `data-block-type="code" data-block-version="C1"`
- S1: `data-block-type="summary" data-block-version="S1"`
- Unversioned blocks: `data-block-type="heading"` (no version attribute)
- Container blocks: `data-block-type="two-column"` with nested children

**Test Evidence:**
```typescript
it('preserves blockVersion for D1 block', async () => {
  render(
    <ActiveBlockProvider>
      <div data-block-id="def-1" data-block-type="definition" data-block-version="D1">
        D1 Block
      </div>
    </ActiveBlockProvider>
  );
  // ✅ Passes - D1 works
});

it('handles unversioned blocks (no data-block-version)', async () => {
  render(
    <ActiveBlockProvider>
      <div data-block-id="summary-1" data-block-type="summary">
        Summary Block
      </div>
    </ActiveBlockProvider>
  );
  // ✅ Passes - Unversioned blocks work
});
```

### Phase 4 Guarantee

**When Composer adds S1 tomorrow:**
```html
<div 
  data-block-id="new-s1-uuid" 
  data-block-type="summary" 
  data-block-version="S1"
>
  <!-- S1 content -->
</div>
```

**ActiveBlockContext automatically provides:**
```typescript
{
  blockId: "new-s1-uuid",
  blockType: "summary",
  blockVersion: "S1"
}
```

**ILS telemetry automatically records:**
```json
{
  "eventType": "block_visit",
  "blockId": "new-s1-uuid",
  "blockVersion": "S1",
  "navigationNodeId": "whatisjava",
  "subtopicId": "..."
}
```

**No code changes required** in:
- ❌ ActiveBlockContext (selection logic)
- ❌ ILSProvider (telemetry consumer)
- ❌ tutorialTrackingService (API caller)
- ❌ API routes
- ❌ Service layer
- ❌ Repository

**Only block renderer required:**
- ✅ S1 component that renders with correct DOM attributes

---

## Testing Considerations

### Existing Tests (DO NOT BREAK)

**Phase 3 ActiveBlockContext tests:**
- 19 test cases covering selection, scrolling, edge cases
- All must continue passing after Phase 4 integration

**Phase 2 ILS tests:**
- 6/6 page-level ILS persistence tests
- Must not be affected by block telemetry

### Phase 4 New Tests Required

**Unit Tests:**
1. Block visit triggered on activeBlock change
2. Block visit NOT triggered on same-session reload
3. Active time accumulates correctly
4. Active time pauses on visibility hidden
5. Active time flushes on block change
6. Active time flushes on unmount

**Integration Tests:**
1. D1 → C1 transition records both telemetries
2. Rapid scrolling doesn't duplicate visits
3. React Strict Mode doesn't duplicate API calls
4. Page navigation flushes pending time

**E2E Tests:**
1. RTH: Block visit persisted to database
2. SUIA: Block visit persisted to database
3. Block active time persisted to database
4. Session-aware visit increment verified

---

## Critical Design Decisions for STEP 5 ADR

### Decision 1: Storage Model

**Where to store block telemetry?**

**Option A:** Extend `completed_blocks` JSONB
```json
{
  "blockId": "...",
  "blockVersion": "D1",
  "completedAt": "...",
  "visitCount": 3,
  "revisionCount": 1,
  "activeTimeSec": 245,
  "firstViewedAt": "...",
  "lastViewedAt": "..."
}
```

**Option B:** Dedicated `block_learning_state` table
```sql
CREATE TABLE block_learning_state (
  user_id, brand, navigation_node_id, block_id, block_version,
  visit_count, revision_count, active_time_sec,
  first_viewed_at, last_viewed_at, completed_at,
  last_session_id, ...
);
```

**Evaluate in ADR:**
- Atomic updates
- Concurrent writes
- Queryability (RSSB needs to fetch active block state)
- Aggregation (analytics)
- Page ↔ Block synchronization
- Migration complexity

---

### Decision 2: Expected Time Source

**Where does `expectedTimeSec` come from?**

**Options:**
- A: TutorialDocument content metadata (Composer-authored)
- B: Server-side registry (per block version, e.g., D1=180s)
- C: Database per-instance configuration
- D: Defer to future phase

**Impact:**
- Time comparison calculation depends on this
- RSSB prototype shows time comparison
- Must be decided before implementing time APIs

---

### Decision 3: Completion Synchronization

**How do `completed_blocks` and block telemetry stay consistent?**

**Options:**
- A: `completed_blocks` authoritative, block telemetry copies completedAt
- B: Block telemetry authoritative, completed_blocks remains legacy
- C: Dual-write with transaction boundary
- D: Eventual consistency (async sync job)

**Critical:**
- Existing block completion MUST continue working
- No data inconsistency allowed

---

### Decision 4: First/Last Viewed At

**Are these fields genuinely required?**

**Evidence FOR:**
- RSSB prototype displays them
- Phase 4 planning mentions them
- Parallel to page-level fields

**Evidence AGAINST:**
- Not used in any current calculation
- Adds 2 timestamp fields per block
- Queryability/analytics use case unclear

**ADR should evaluate:**
- Actual RSSB requirements (Phase 5)
- Analytics requirements
- Storage cost (millions of blocks × 2 timestamps)

---

## Summary: Telemetry Integration Points

| Event | Trigger | Telemetry Action | API Call |
|-------|---------|------------------|----------|
| **Block Entered** | `activeBlock` changed to new block | Record visit (sessionId), start timer | `POST /api/tutorial/ils/block/visit` |
| **Block Exited** | `activeBlock` changed to null/different | Flush time, stop timer | `POST /api/tutorial/ils/block/active-time` |
| **Visibility Hidden** | `document.visibilityState === 'hidden'` | Pause timer | None |
| **Visibility Visible** | `document.visibilityState === 'visible'` | Resume timer | None |
| **Periodic Flush** | setInterval (every 30s) | Flush accumulated time | `POST /api/tutorial/ils/block/active-time` |
| **Unmount** | Component cleanup | Flush time, cleanup | `POST /api/tutorial/ils/block/active-time` |

---

## Architectural Principles (Phase 4)

### ✅ DO:

1. **Consume `activeBlock` via `useActiveBlock()` hook**
2. **Record telemetry in ILSProvider (consumer), not ActiveBlockProvider (selector)**
3. **Use separate ActiveBlockTimeTracker module for time accumulation**
4. **Reuse canonical block identity: blockId + blockVersion**
5. **Reuse page-level sessionId for block visits**
6. **Make telemetry generic (works for D1/C1/S1/future without code changes)**
7. **Handle visibility changes to pause/resume timer**
8. **Flush time on block change, unmount, visibility hidden**
9. **Make APIs idempotent (same sessionId = no duplicate visit increment)**

### ❌ DO NOT:

1. **Modify ActiveBlockContext selection algorithm**
2. **Add ILS API calls inside ActiveBlockProvider**
3. **Create second block identity system**
4. **Track time inside ActiveBlockContext**
5. **Make block-type-specific telemetry (D1Service, C1Service, etc.)**
6. **Assume storage model before ADR**
7. **Break Phase 3 ActiveBlockContext tests**
8. **Break Phase 2 page-level ILS tests**

---

## Evidence Quality

**All findings verified from:**
- ✅ ActiveBlockContext.tsx source (327 lines)
- ✅ ActiveBlockRuntime.test.tsx (19 test cases)
- ✅ ActiveBlockIntegration.test.tsx (integration tests)
- ✅ ILSProvider.test.tsx (Phase 3 → Phase 4 contract tests)

**No assumptions or invented patterns.**

---

**STEP 4 Status:** ✅ Complete  
**Next Action:** STEP 5 - Create Architecture Decision Record (ADR) for storage model  
**Critical Decision:** JSONB extension vs dedicated `block_learning_state` table  
**Hard Stop:** DO NOT implement storage until ADR approved
