# ILS Phase 4 - Implementation Contract (FINAL)

**Date:** 2026-09-05  
**Status:** APPROVED - Ready for Implementation  
**Phase:** Block Learning State & Telemetry Foundation

---

## Architecture Freeze

The following architectural decisions are **FINAL** and form the basis for Phase 4 implementation.

---

## Final Decisions

| Decision | Final Choice | Rationale |
|----------|-------------|-----------|
| **Storage Model** | Dedicated `block_learning_state` table | Better queryability, no lock contention, extensible |
| **expectedTimeSec Source** | AI-generated per block instance, persisted by Composer | Accounts for content variation, AI knows actual complexity |
| **Runtime Authority** | Published canonical TutorialDocument | Frozen authoritative value, not AI's ongoing opinion |
| **Completion Sync** | Transactional denormalized copy | `completed_blocks` authoritative, block_learning_state.completed_at is denormalized |
| **First/Last Viewed** | Include both timestamps | Parallels page-level, enables complete RSSB, useful for analytics |
| **Page/Block Aggregation** | Independent scopes | `page.timeSpentActiveSec ≥ SUM(block.activeTimeSec)` (accounts for non-block time) |
| **Cross-Page Blocks** | Separate telemetry per navigation node | Learning context differs per page, enables page-level aggregation |
| **ActiveBlockContext** | Do NOT modify | Pure selection mechanism, Phase 4 consumes via context |
| **Block-Specific ILS** | None | Generic telemetry works for ALL block types automatically |
| **Anonymous Support** | Follow existing page-level identity/session mechanism | Do NOT invent second identity model |
| **Soft Delete** | Yes, consistent with parent lifecycle | Matches page-level pattern, enables data recovery |
| **Expected-Time Fallback** | No guessing by ILS - `null`/`unknown` until supplied | ILS never owns or estimates expected time |

---

## Core Architectural Principle

### The Three Relationships

**1. Composer establishes the content relationship:**
```
Tutorial Page
   ↓
TutorialDocument.blocks[]
   ↓
D1, C1, I1, O1, S1, ... (canonical identity)
```

**2. Runtime establishes the learner relationship:**
```
Published Page
   ↓
Block DOM (data-block-id, data-block-type, data-block-version)
   ↓
ActiveBlockContext (identifies active block)
   ↓
Generic ILS telemetry (consumes active block)
```

**3. Database establishes the learning-state relationship:**
```
(userId + brand + navigationNodeId + blockId + blockVersion)
   ↓
block_learning_state
   ↓
visitCount, revisionCount, activeTimeSec, ...
```

**NO manual "attach ILS" step** - automatic via canonical identity.

---

## Complete Flow

```
AI Content Generation
   ↓
Generates: Block JSON + expectedTimeSec
   ↓
Tutorial Composer
   ↓
Validates + Persists + Allows Author Review
   ↓
Published TutorialDocument (frozen authoritative version)
   ↓
Tutorial Page Renders
   ↓
Block DOM with data-block-* attributes
   ↓
ActiveBlockContext (Phase 3)
   ↓
Identifies active block generically
   ↓
Generic ILS Telemetry (Phase 4)
   ↓
Records visits, time, revisions automatically
   ↓
block_learning_state (persists learner state)
   ↓
ILS API (exposes state + time comparison)
   ↓
ILSProvider (React context)
   ↓
RSSB (Phase 5)
   ↓
Displays learning state
```

---

## Critical Success Criterion

### Adding S1 Tomorrow Should NOT Require New ILS Code

**When Composer integrates S1:**
```
Page A
  ↓
blocks[]
  ↓
[D1, C1, S1]
```

**Expected Result:**
- ✅ S1 receives canonical `block.id`
- ✅ S1 rendered with correct DOM attributes
- ✅ ActiveBlockContext identifies S1
- ✅ ILS automatically tracks S1 (visits, time, revisions)
- ✅ RSSB displays S1 learning state
- ❌ NO new ILS code written for S1

**This proves the architecture is generic and extensible.**

---

## Schema Contract

### Block Instance Structure

**DO NOT assume `BaseBlock` exists** - it doesn't in the repository.

**Instead, establish schema convention for instructional blocks:**

```typescript
// D1 Block
{
  id: "block-uuid",          // Canonical identity
  type: "definition",         // Block type
  version: "D1",              // Block version
  expectedTimeSec: 120,       // AI-generated, Composer-validated
  content: { ... }            // Block-specific content
}

// C1 Block
{
  id: "block-uuid",
  type: "code",
  version: "C1",
  expectedTimeSec: 240,
  content: { ... }
}

// S1 Block (future)
{
  id: "block-uuid",
  type: "summary",
  version: "S1",
  expectedTimeSec: 90,
  content: { ... }
}
```

**Convention:** Instructional blocks (D1, C1, S1, I1, O1, etc.) include `expectedTimeSec` field.

**Validation:** Added to block schemas during AI integration.

---

## Database Schema (Final)

```sql
CREATE TABLE block_learning_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity (composite natural key)
  user_id UUID NOT NULL,
  brand brand_type NOT NULL,
  navigation_node_id TEXT NOT NULL,
  subtopic_id UUID NOT NULL,
  block_id UUID NOT NULL,
  block_version TEXT NOT NULL,
  
  -- Telemetry
  visit_count INT NOT NULL DEFAULT 0,
  revision_count INT NOT NULL DEFAULT 0,
  active_time_sec INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,  -- Denormalized from completed_blocks
  
  -- Session tracking
  last_session_id TEXT,
  
  -- Configuration
  expected_time_sec INT,  -- From published block, nullable
  
  -- Standard fields
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE (user_id, brand, navigation_node_id, block_id, block_version)
  WHERE deleted_at IS NULL,
  
  FOREIGN KEY (user_id, brand, navigation_node_id) 
    REFERENCES tutorial_navigation_progress(user_id, brand, navigation_node_id)
    ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_block_learning_state_user_node 
  ON block_learning_state(user_id, navigation_node_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_block_learning_state_lookup 
  ON block_learning_state(user_id, brand, navigation_node_id, block_id, block_version) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_block_learning_state_analytics 
  ON block_learning_state(block_version, brand) 
  WHERE deleted_at IS NULL;
```

---

## API Contract

### Record Block Visit (Session-Aware)

```typescript
POST /api/tutorial/ils/block/visit

Request:
{
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string  // REQUIRED - from readTutorialLearningSessionId()
}

Response:
{
  data: BlockLearningState
}

Logic:
- Atomic increment: visitCount += 1 IF lastSessionId IS DISTINCT FROM sessionId
- Update: lastSessionId = sessionId, lastViewedAt = NOW()
- Initialize: firstViewedAt = NOW() IF lastSessionId IS NULL
- Revision: revisionCount += 1 IF completedAt IS NOT NULL AND session changed
```

---

### Record Block Active Time

```typescript
POST /api/tutorial/ils/block/active-time

Request:
{
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  activeTimeSec: number  // Increment to add (accumulated since last flush)
}

Response:
{
  data: BlockLearningState
}

Logic:
- Atomic increment: activeTimeSec += request.activeTimeSec
- Update: lastViewedAt = NOW()
- Validation: 0 ≤ activeTimeSec ≤ 600 (max 10 minutes per flush)
```

---

### Fetch Block State (RSSB)

```typescript
GET /api/tutorial/ils/block-state?navigationNodeId=...&blockId=...&blockVersion=...

Response:
{
  data: {
    ...BlockLearningState,
    timeComparison: {
      activeTimeSec: number,
      expectedTimeSec: number | null,
      differenceSec: number | null,
      percentageOfExpected: number | null,
      status: 'under' | 'on-track' | 'over' | 'unknown'
    }
  }
}

Logic:
- Fetch block_learning_state row
- Calculate time comparison (single source of truth in service layer)
- Return complete state
```

---

## Time Comparison Contract (Single Source of Truth)

**Calculated by:** `LearningProgressService.calculateTimeComparison()`

**NOT calculated by:** ILSProvider, RSSB, or any client

```typescript
interface TimeComparison {
  activeTimeSec: number;
  expectedTimeSec: number | null;
  differenceSec: number | null;        // actual - expected
  percentageOfExpected: number | null; // (actual / expected) * 100
  status: 'under' | 'on-track' | 'over' | 'unknown';
}

function calculateTimeComparison(
  activeTimeSec: number,
  expectedTimeSec: number | null
): TimeComparison {
  if (expectedTimeSec === null || expectedTimeSec === 0) {
    return {
      activeTimeSec,
      expectedTimeSec: null,
      differenceSec: null,
      percentageOfExpected: null,
      status: 'unknown',  // No expected time available
    };
  }
  
  const differenceSec = activeTimeSec - expectedTimeSec;
  const percentageOfExpected = (activeTimeSec / expectedTimeSec) * 100;
  
  let status: 'under' | 'on-track' | 'over';
  if (percentageOfExpected < 80) {
    status = 'under';  // Faster than expected
  } else if (percentageOfExpected <= 120) {
    status = 'on-track';  // Within ±20%
  } else {
    status = 'over';  // Taking longer
  }
  
  return {
    activeTimeSec,
    expectedTimeSec,
    differenceSec,
    percentageOfExpected,
    status,
  };
}
```

---

## Runtime Integration Contract

### ActiveBlockContext (DO NOT MODIFY)

**Phase 3 Responsibility:**
- Select active block via IntersectionObserver
- Expose `{blockId, blockType, blockVersion}` via React context
- Pure selection mechanism

**Phase 4 MUST NOT:**
- Add ILS API calls to ActiveBlockProvider
- Add time tracking to ActiveBlockContext
- Modify selection algorithm

---

### ILSProvider (Phase 4 Extension)

**Consumes:** `useActiveBlock()` from ActiveBlockContext

**Responsibilities:**
1. Detect block enter/exit events
2. Trigger block visit API (session-aware)
3. Manage active time tracking (via separate ActiveBlockTimeTracker module)
4. Handle visibility changes (pause/resume timer)
5. Flush time on block change, unmount, visibility hidden
6. Expose block learning state via `useILS()` hook

**Pattern:**
```typescript
const { activeBlock } = useActiveBlock();  // Phase 3
const previousBlockRef = useRef<ActiveBlockIdentity | null>(null);
const trackerRef = useRef<ActiveBlockTimeTracker | null>(null);

useEffect(() => {
  if (!activeBlock) {
    // Block exited → flush time
    if (trackerRef.current) {
      trackerRef.current.flush();
      trackerRef.current = null;
    }
    return;
  }
  
  // Block entered → record visit + start timer
  const sessionId = readTutorialLearningSessionId();
  
  trackTutorialEvent({
    eventType: 'block_visit',
    blockId: activeBlock.blockId,
    blockVersion: activeBlock.blockVersion,
    navigationNodeId,
    subtopicId,
    sessionId,
  });
  
  const tracker = new ActiveBlockTimeTracker({
    block: activeBlock,
    navigationNodeId,
    subtopicId,
  });
  tracker.start();
  trackerRef.current = tracker;
  
  return () => {
    tracker.flush();
  };
}, [activeBlock, navigationNodeId, subtopicId]);
```

---

### ActiveBlockTimeTracker (New Module)

**Responsibilities:**
- Accumulate time in-memory while block active
- Pause on visibility hidden
- Resume on visibility visible
- Flush to API periodically (every 30s) and on block change
- Prevent duplicate flushes

**NOT responsible for:**
- Block selection
- Visit tracking
- Session management

---

## Completion Synchronization Contract

### Pattern: Transactional Denormalized Copy

**Source of Truth:** `tutorial_navigation_progress.completed_blocks`

**Denormalized Copy:** `block_learning_state.completed_at`

**Synchronization:**
```typescript
async markBlockCompleted(blockId: string, blockVersion: string) {
  await db.transaction(async (tx) => {
    // Source of truth (existing)
    const completedAt = await progressRepo.markBlockCompleted(tx, blockId, blockVersion);
    
    // Denormalized copy (Phase 4)
    await blockStateRepo.syncCompletedAt(tx, blockId, blockVersion, completedAt);
  });
}
```

**On read (RSSB):**
- Fetch from `block_learning_state` (includes denormalized `completed_at`)
- No JOIN needed
- Fast query

**Consistency guarantee:** Transaction ensures both or neither

---

## Implementation Phases

### Pre-Implementation: Source Verification

**BEFORE creating schema, verify against actual repository:**

1. ✅ Exact `TutorialDocument` schema location and structure
2. ✅ Exact D1/C1 schema and version field locations
3. ✅ Exact Composer save/publish transaction path
4. ✅ Exact block DOM attributes produced by renderers
5. ✅ Exact `ActiveBlockContext` event lifecycle
6. ✅ Exact page-level `recordVisit()` / `recordTime()` SQL patterns
7. ✅ Exact `markBlockCompleted()` transaction boundary
8. ✅ Exact ILS API authentication patterns
9. ✅ Exact ILSProvider current structure
10. ✅ Exact user/session identity behavior

**Purpose:** Prevent implementing against audit assumptions - verify actual code.

---

### Phase 4.1: Schema + Migration

1. Create `block_learning_state` table
2. Create indexes
3. Backfill existing `completed_blocks` data (online, batched)
4. Validate consistency
5. **Deliverable:** Schema migration + backfill script

---

### Phase 4.2: Repository Layer

1. Create `TutorialBlockLearningStateRepository`
2. Methods: `recordVisit()`, `recordTime()`, `getBlockState()`, `syncCompletedAt()`
3. Reuse atomic SQL patterns from page-level
4. Unit tests
5. **Deliverable:** Repository with atomic operations

---

### Phase 4.3: Service Layer

1. Extend `LearningProgressService`
2. Methods: `recordBlockVisit()`, `recordBlockActiveTime()`, `calculateTimeComparison()`
3. Validation logic
4. Transaction handling for completion sync
5. Unit tests
6. **Deliverable:** Service layer with business logic

---

### Phase 4.4: API Layer

1. BFF routes: `/api/tutorial/ils/block/visit`, `/block/active-time`, `/block-state`
2. API Server routes: same paths
3. Authentication via existing patterns (X-Internal-Secret, X-User-Id, X-Brand)
4. Request validation
5. Integration tests
6. **Deliverable:** API routes with authentication

---

### Phase 4.5: Runtime Integration

1. Create `ActiveBlockTimeTracker` module
2. Extend `ILSProvider` to consume `activeBlock`
3. Implement enter/exit/visibility handling
4. Integrate with `tutorialTrackingService`
5. Integration tests
6. **Deliverable:** Runtime telemetry consumer

---

### Phase 4.6: Time Comparison

1. Implement `calculateTimeComparison()` in service layer
2. Return from block-state API
3. Expose via ILSProvider
4. Handle missing `expectedTimeSec` gracefully
5. Unit tests
6. **Deliverable:** Time comparison calculation

---

### Phase 4.7: E2E Certification (D1/C1)

1. RTH E2E: Block visit persisted
2. RTH E2E: Block active time persisted
3. SUIA E2E: Block visit persisted
4. SUIA E2E: Block active time persisted
5. Database evidence queries
6. Phase 2/3 regression: 6/6 page tests + 19/19 ActiveBlock tests passing
7. **Deliverable:** E2E test suite with database evidence

---

### Phase 4.8: Generic Block Certification (S1 or Mock)

1. Create test block type "X1" (or use S1 if available)
2. Verify ILS tracks X1 WITHOUT new ILS code
3. Prove generic architecture works
4. **Deliverable:** Generic block support proof

---

### Phase 4.9: Documentation + Freeze

1. API documentation
2. Integration guide for future blocks
3. Analytics query examples
4. Migration runbook
5. Architecture freeze document
6. **Deliverable:** Complete Phase 4 documentation

---

## Hard Constraints

### DO NOT

1. ❌ Modify `ActiveBlockContext` selection logic
2. ❌ Add ILS API calls inside `ActiveBlockProvider`
3. ❌ Create block-type-specific telemetry (D1Service, C1Service, etc.)
4. ❌ Let ILS guess or own `expectedTimeSec`
5. ❌ Calculate time comparison in ILSProvider or RSSB
6. ❌ Break Phase 2/3 tests (6/6 page + 19/19 ActiveBlock must pass)
7. ❌ Create second identity/session mechanism
8. ❌ Modify immutable TutorialDocument content to store learner state

### MUST DO

1. ✅ Reuse atomic SQL patterns from page-level ILS
2. ✅ Follow existing API authentication patterns
3. ✅ Consumer-based telemetry (ILSProvider consumes ActiveBlockContext)
4. ✅ Generic implementation (works for ANY block type)
5. ✅ Transaction-safe completion sync
6. ✅ Validate against actual repository code before implementation
7. ✅ Prove generic support with test/mock block
8. ✅ Database evidence for all claims

---

## Success Criteria (Phase 4 Complete)

### Primary

✅ **Add S1 to Composer → ILS automatically tracks S1 → NO new ILS code written**

### Secondary

1. ✅ Block visit tracking (session-aware, no duplicates)
2. ✅ Block active time (visibility-aware, accurate)
3. ✅ Block revision detection (completed + new session)
4. ✅ Time comparison (when expectedTimeSec available)
5. ✅ RSSB data access (complete block state via ILSProvider)
6. ✅ Phase 2/3 regression (all tests passing)
7. ✅ Multi-brand (RTH + SUIA independent)
8. ✅ Concurrent safety (no lost updates, no race conditions)
9. ✅ Migration success (data preserved, consistency validated)
10. ✅ Database evidence (telemetry persisted correctly)

---

## Timeline

**Phases 4.1-4.6:** 2-3 weeks  
**Phase 4.7:** 1 week  
**Phase 4.8:** 3-5 days  
**Phase 4.9:** 3-5 days  

**Total:** ~4 weeks from start to Phase 4 complete

---

**Contract Status:** ✅ FINAL - APPROVED  
**Ready for Implementation:** YES  
**Blocker:** None  
**Risk Level:** Low-Medium  
**Confidence:** High

---

**This contract is the authoritative basis for Phase 4 implementation. All architectural decisions are closed. Proceed with pre-implementation source verification, then execute phases 4.1-4.9 in order.**
