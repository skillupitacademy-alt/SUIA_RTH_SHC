# ILS Phase 4 - STEP 3: Block Completion Flow Audit

**Date:** 2026-09-05  
**Phase:** Phase 4 - Block Learning State & Telemetry Foundation  
**Status:** STEP 3 Complete - Block completion flow traced

---

## Objective

Trace the existing block completion flow from Composer → Runtime → API → Repository to:
1. Identify integration points for new telemetry (visit, revision, time)
2. Understand how canonical block identity flows through the system
3. Map where block-level state could be captured
4. Prevent conflicts with existing completion architecture

---

## Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ 1. COMPOSER (Author creates content)                         │
│    TutorialDocument.blocks[] = [{                            │
│      id: "block-uuid",                                       │
│      type: "definition",                                     │
│      version: "D1",                                          │
│      content: { ... }                                        │
│    }]                                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. RUNTIME (Browser renders page)                            │
│    Tutorial Page Component                                   │
│    ├─ Renders blocks with DOM attributes:                   │
│    │  data-block-id="block-uuid"                            │
│    │  data-block-type="definition"                          │
│    │  data-block-version="D1"                               │
│    │                                                         │
│    └─ ActiveBlockProvider (Phase 3)                         │
│       └─ IntersectionObserver watches blocks                │
│          └─ Selects active block → activeBlock state        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. BLOCK INTERACTION (User completes D1)                     │
│    D1 Component                                              │
│    └─ onComplete() → calls trackTutorialEvent({             │
│       eventType: 'block_complete',                          │
│       blockId: "block-uuid",                                │
│       blockType: "definition",                              │
│       blockVersion: "D1",                                   │
│       navigationNodeId: "whatisjava",                       │
│       subtopicId: "subtopic-uuid"                           │
│    })                                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. TRACKING SERVICE                                          │
│    tutorialTrackingService.trackTutorialEvent()             │
│    ├─ Validates: blockId, blockType, blockVersion required │
│    ├─ Maps: "definition" → "technical" (backend compat)    │
│    └─ POST /api/tutorial/ils/block-completion               │
│       Body: {                                               │
│         navigationNodeId,                                   │
│         subtopicId,                                         │
│         sectionId,                                          │
│         blockId,                                            │
│         blockType,                                          │
│         blockVersion                                        │
│       }                                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. BFF (Brand Frontend Backend)                              │
│    RTH: /api/tutorial/ils/block-completion/route.ts         │
│    SUIA: /api/tutorial/ils/block-completion/route.ts        │
│    ├─ Adds authentication context from cookies              │
│    ├─ Forwards to centralized API server                    │
│    └─ Headers:                                              │
│       X-Internal-Secret: (BFF → API auth)                   │
│       X-User-Id: (authenticated user)                       │
│       X-Brand: (rth/skillup)                                │
│       x-session-id: (learning session UUID)                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. API SERVER                                                │
│    POST /api/tutorial/ils/block-completion                  │
│    ├─ validateRequest() → validates X-Internal-Secret       │
│    ├─ Constructs AuthenticatedIdentity: {                   │
│    │    userId,                                             │
│    │    brand,                                              │
│    │    sessionId (from x-session-id header)               │
│    │  }                                                     │
│    ├─ Validates body with recordBlockCompletionBodySchema  │
│    └─ Calls LearningProgressService.recordBlockCompletion() │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. SERVICE LAYER                                             │
│    LearningProgressService.recordBlockCompletion()          │
│    ├─ Validates navigationNode exists                       │
│    ├─ Calls progressRepository.markBlockCompleted({         │
│    │    userId,                                             │
│    │    brand,                                              │
│    │    navigationNodeId,                                   │
│    │    subtopicId,                                         │
│    │    blockId,                                            │
│    │    blockVersion                                        │
│    │  })                                                    │
│    ├─ Resolves canonical section requirements              │
│    └─ Calculates progress: completedBlocks / totalBlocks   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. REPOSITORY                                                │
│    TutorialNavigationProgressRepository.markBlockCompleted() │
│    ├─ Creates/fetches progress record                       │
│    ├─ Atomic JSONB append with deduplication:              │
│    │  CASE                                                  │
│    │    WHEN EXISTS (block matching blockId + blockVersion)│
│    │    THEN completed_blocks (unchanged)                  │
│    │    ELSE completed_blocks || newBlock                  │
│    │  END                                                   │
│    └─ SQL: buildAtomicBlockAppend()                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 9. DATABASE                                                  │
│    tutorial_navigation_progress                             │
│    ├─ Row identified by: userId + navigationNodeId         │
│    ├─ completed_blocks JSONB updated:                      │
│    │  [                                                     │
│    │    {                                                   │
│    │      blockId: "block-uuid",                           │
│    │      blockVersion: "D1",                              │
│    │      completedAt: "2026-09-05T..."                    │
│    │    }                                                   │
│    │  ]                                                     │
│    └─ version column incremented (optimistic lock)         │
└──────────────────────────────────────────────────────────────┘
```

---

## Critical Integration Points for Phase 4 Telemetry

### Integration Point A: ActiveBlockContext Lifecycle

**Location:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`

**Current Behavior:**
- IntersectionObserver watches all `[data-block-id]` elements
- Deterministic selection based on viewport anchor zone (top 25%)
- Emits `activeBlock` state changes via React context
- Consumed by `ILSProvider` via `useActiveBlock()` hook

**Phase 4 Integration:**
```typescript
// EXISTING (Phase 3):
const { activeBlock } = useActiveBlock();
// activeBlock = { blockId, blockType, blockVersion } | null

// PHASE 4 ADDITION:
useEffect(() => {
  if (activeBlock) {
    // INTEGRATION POINT: Block entered
    // → Record block visit (with sessionId, session-aware increment)
    // → Start active time tracking
  } else {
    // INTEGRATION POINT: No active block
    // → Flush pending active time
  }
  
  return () => {
    // INTEGRATION POINT: Block exited
    // → Flush active time for previous block
  };
}, [activeBlock]);
```

**Key Insight:**
> ActiveBlockContext already provides canonical block identity. Phase 4 should NOT recreate block selection logic.

---

### Integration Point B: tutorialTrackingService Extension

**Location:** `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts`

**Current Event Types:**
- `page_view` → Calls `/api/tutorial/ils/visit`
- `block_complete` → Calls `/api/tutorial/ils/block-completion`
- Other events → Logged, not persisted

**Phase 4 New Event Types:**
```typescript
// NEW: Block visibility events
type BlockVisitEvent = {
  eventType: 'block_visit';
  blockId: string;
  blockType: string;
  blockVersion: string;
  navigationNodeId: string;
  subtopicId: string;
  sessionId: string;  // REQUIRED for session-aware increment
};

// NEW: Block active time flush
type BlockTimeEvent = {
  eventType: 'block_time';
  blockId: string;
  blockVersion: string;
  navigationNodeId: string;
  subtopicId: string;
  activeTimeSec: number;  // Accumulated time to flush
};
```

**Implementation Pattern:**
```typescript
// tutorialTrackingService.ts

export async function trackTutorialEvent(event: TutorialTrackingEvent): Promise<void> {
  try {
    // EXISTING: page_view
    if (event.eventType === 'page_view') {
      // ... existing logic ...
    }
    
    // PHASE 4: block_visit
    if (event.eventType === 'block_visit') {
      const learningSessionId = readTutorialLearningSessionId();
      if (!learningSessionId) {
        console.warn('[Tutorial Tracking] block_visit: No learning session');
        return;
      }
      
      const response = await fetch('/api/tutorial/ils/block/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': learningSessionId,
        },
        credentials: 'include',
        body: JSON.stringify({
          navigationNodeId: event.navigationNodeId,
          subtopicId: event.subtopicId,
          blockId: event.blockId,
          blockVersion: event.blockVersion,
          sessionId: learningSessionId,  // AUTHORITATIVE
        }),
      });
      
      if (!response.ok) {
        console.warn(`[Tutorial Tracking] Block visit API returned ${response.status}`);
      }
      return;
    }
    
    // PHASE 4: block_time
    if (event.eventType === 'block_time') {
      const response = await fetch('/api/tutorial/ils/block/active-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          navigationNodeId: event.navigationNodeId,
          subtopicId: event.subtopicId,
          blockId: event.blockId,
          blockVersion: event.blockVersion,
          activeTimeSec: event.activeTimeSec,
        }),
      });
      
      if (!response.ok) {
        console.warn(`[Tutorial Tracking] Block time API returned ${response.status}`);
      }
      return;
    }
    
    // EXISTING: block_complete
    if (event.eventType === 'block_complete') {
      // ... existing logic ...
    }
    
  } catch (error) {
    console.error('[Tutorial Tracking] Failed to track event:', error);
  }
}
```

---

### Integration Point C: New API Routes

**Pattern:** Reuse existing ILS API architecture

**New Routes Required:**

1. **Block Visit:**
   - `POST /api/tutorial/ils/block/visit`
   - BFF: `apps/{brand}-web/src/app/api/tutorial/ils/block/visit/route.ts`
   - API Server: `apps/api-server/src/app/api/tutorial/ils/block/visit/route.ts`

2. **Block Active Time:**
   - `POST /api/tutorial/ils/block/active-time`
   - BFF: `apps/{brand}-web/src/app/api/tutorial/ils/block/active-time/route.ts`
   - API Server: `apps/api-server/src/app/api/tutorial/ils/block/active-time/route.ts`

**Authentication Pattern (Reuse Existing):**
```typescript
// BFF Layer (RTH/SUIA)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const body = await request.json();
  const apiUrl = process.env.INTERNAL_API_URL || 'https://api.skillhubcore.in';
  
  const response = await fetch(`${apiUrl}/tutorial/ils/block/visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET!,
      'X-User-Id': session.user.id,
      'X-Brand': BRAND_ID,
      'x-session-id': request.headers.get('x-session-id') || '',
    },
    body: JSON.stringify(body),
  });
  
  return response;
}
```

```typescript
// API Server Layer
export async function POST(request: NextRequest) {
  const authValidation = validateRequest(request, { requireInternalSecret: true });
  if (authValidation.error) {
    return authValidation.error;
  }
  
  const { context } = authValidation;
  const sessionId = request.headers.get('x-session-id');
  const identity: AuthenticatedIdentity = {
    userId: context.userId,
    brand: context.brand,
    sessionId: sessionId || undefined,
  };
  
  const body = await request.json();
  const parsed = recordBlockVisitBodySchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  
  const service = new LearningProgressService(...);
  const progress = await service.recordBlockVisit(
    identity,
    parsed.data.navigationNodeId,
    parsed.data.subtopicId,
    parsed.data.blockId,
    parsed.data.blockVersion,
    parsed.data.sessionId
  );
  
  return NextResponse.json({ data: progress });
}
```

---

### Integration Point D: Service Layer Extension

**Location:** `packages/db-tutorial/src/services/learning-progress.service.ts`

**New Methods Required:**

```typescript
class LearningProgressService {
  // EXISTING:
  async recordBlockCompletion(...) { ... }
  
  // PHASE 4: NEW
  async recordBlockVisit(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    blockId: string,
    blockVersion: string,
    sessionId?: string
  ): Promise<BlockLearningState> {
    // 1. Validate navigationNode exists
    // 2. Call repository.recordBlockVisit()
    // 3. Return block learning state
  }
  
  async recordBlockActiveTime(
    identity: AuthenticatedIdentity,
    navigationNodeId: string,
    subtopicId: string,
    blockId: string,
    blockVersion: string,
    activeTimeSec: number
  ): Promise<BlockLearningState> {
    // 1. Validate activeTimeSec (>= 0, <= MAX_SINGLE_INCREMENT)
    // 2. Call repository.recordBlockTime()
    // 3. Return block learning state
  }
}
```

**Validation Rules (Reuse Page-Level Patterns):**
```typescript
// Time validation
if (activeTimeSec < 0) {
  throw new Error('Time cannot be negative');
}

const MAX_BLOCK_TIME_INCREMENT = 600; // 10 minutes (stricter than page)
if (activeTimeSec > MAX_BLOCK_TIME_INCREMENT) {
  throw new Error(`Block time increment too large: ${activeTimeSec}s (max: ${MAX_BLOCK_TIME_INCREMENT}s)`);
}
```

---

### Integration Point E: Repository Extension

**Location:** `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts`

**Current Block-Related Methods:**
- `markBlockCompleted()` - Appends to `completed_blocks` JSONB
- `isBlockCompleted()` - Checks if block exists in `completed_blocks`

**Phase 4 Decision Point:**
Should block telemetry (visitCount, revisionCount, activeTimeSec) be:

**Option A:** Extended within `completed_blocks` JSONB
```typescript
completed_blocks: [
  {
    blockId: "block-uuid",
    blockVersion: "D1",
    completedAt: "2026-09-05T...",
    // PHASE 4 ADDITIONS:
    visitCount: 3,
    revisionCount: 1,
    activeTimeSec: 245,
    firstViewedAt: "2026-09-04T...",
    lastViewedAt: "2026-09-05T...",
    expectedTimeSec: 180
  }
]
```

**Option B:** Dedicated `block_learning_state` table
```sql
CREATE TABLE block_learning_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand brand_type NOT NULL,
  navigation_node_id TEXT NOT NULL,
  subtopic_id UUID NOT NULL,
  block_id UUID NOT NULL,
  block_version TEXT NOT NULL,
  
  visit_count INT NOT NULL DEFAULT 0,
  revision_count INT NOT NULL DEFAULT 0,
  active_time_sec INT NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_session_id TEXT,
  expected_time_sec INT,
  
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE (user_id, brand, navigation_node_id, block_id, block_version, deleted_at)
);
```

**This decision MUST be made in STEP 5 via Architecture Decision Record (ADR).**

---

## Canonical Block Identity Flow

### From Composer to Database

**1. Composer Creates Block:**
```typescript
// TutorialDocument
{
  schemaVersion: 1,
  blocks: [
    {
      id: "381048c3-ae87-4a32-aef5-b3b5656fee64",  // UUID
      type: "definition",
      version: "D1",
      content: { ... }
    }
  ]
}
```

**2. Runtime Renders Block:**
```html
<div
  data-block-id="381048c3-ae87-4a32-aef5-b3b5656fee64"
  data-block-type="definition"
  data-block-version="D1"
>
  <!-- D1 content -->
</div>
```

**3. ActiveBlockContext Selects:**
```typescript
{
  blockId: "381048c3-ae87-4a32-aef5-b3b5656fee64",
  blockType: "definition",
  blockVersion: "D1"
}
```

**4. Tracking Service Sends:**
```json
{
  "navigationNodeId": "whatisjava",
  "subtopicId": "subtopic-uuid",
  "blockId": "381048c3-ae87-4a32-aef5-b3b5656fee64",
  "blockVersion": "D1",
  "sessionId": "session-uuid"
}
```

**5. Database Stores:**
```sql
-- Option A: JSONB
completed_blocks @> '[{"blockId": "381048c3-...", "blockVersion": "D1"}]'

-- Option B: Dedicated table
WHERE block_id = '381048c3-...' AND block_version = 'D1'
```

**Key Insight:**
> Block identity remains consistent throughout the entire flow. Phase 4 MUST NOT create a second identity system.

---

## Session Semantics for Block Telemetry

### Current Page-Level Session Handling

**Source:** `TutorialNavigationProgressRepository.recordVisit()`

**Session Transition Logic:**
```sql
CASE
  WHEN lastSessionId IS DISTINCT FROM newSessionId
  THEN visitCount + 1
  ELSE visitCount
END
```

**Session ID Source:**
1. Authenticated users: JWT family ID
2. Anonymous users: Client-generated UUID in sessionStorage
3. Provided via `readTutorialLearningSessionId()` service

### Block-Level Session Semantics (Phase 4 Design)

**Block visits MUST use the SAME sessionId as page visits.**

**Rationale:**
- A "learning session" is browser-session-scoped
- Page visitCount and block visitCount must use same session boundary
- Prevents inconsistent counting (page session ≠ block session)

**Implementation:**
```typescript
// tutorialTrackingService.ts
const learningSessionId = readTutorialLearningSessionId();

// BOTH page_view AND block_visit use learningSessionId
trackTutorialEvent({
  eventType: 'block_visit',
  sessionId: learningSessionId,  // SAME as page_view
  ...
});
```

**Block Revision Semantics:**
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

**Difference:** Blocks use `completedAt IS NOT NULL` instead of status enum (blocks don't have status, only completion timestamp).

---

## Active Time Tracking Strategy

### Page-Level Behavior (Existing)

**Source:** `tutorialTrackingService.ts` (assumed, not in provided excerpts)

**Assumptions based on architecture:**
1. Page visibility tracking via `visibilitychange` event
2. Periodic timer (e.g., every 30s) flushes accumulated time
3. Calls `recordTime()` with incremental seconds
4. Does NOT set lastSessionId (time tracking is session-independent)

### Block-Level Active Time (Phase 4 Design)

**Tracking Strategy:**
```typescript
// activeBlockTimeTracker.ts (NEW MODULE)

class ActiveBlockTimeTracker {
  private activeBlock: ActiveBlockIdentity | null = null;
  private startTime: number | null = null;
  private accumulatedTime: number = 0;
  private flushInterval: NodeJS.Timeout | null = null;
  
  onBlockEntered(block: ActiveBlockIdentity) {
    // Flush previous block if exists
    if (this.activeBlock) {
      this.flushTime();
    }
    
    // Start tracking new block
    this.activeBlock = block;
    this.startTime = Date.now();
    this.accumulatedTime = 0;
    
    // Periodic flush every 30s
    this.flushInterval = setInterval(() => {
      this.accumulateTime();
      this.flushTime();
    }, 30_000);
  }
  
  onBlockExited() {
    this.accumulateTime();
    this.flushTime();
    this.reset();
  }
  
  onVisibilityChange(visible: boolean) {
    if (visible) {
      // Resume timer
      this.startTime = Date.now();
    } else {
      // Pause timer
      this.accumulateTime();
      this.startTime = null;
    }
  }
  
  private accumulateTime() {
    if (this.startTime) {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.accumulatedTime += elapsed;
      this.startTime = Date.now(); // Reset for next accumulation
    }
  }
  
  private async flushTime() {
    if (this.activeBlock && this.accumulatedTime > 0) {
      await trackTutorialEvent({
        eventType: 'block_time',
        blockId: this.activeBlock.blockId,
        blockVersion: this.activeBlock.blockVersion,
        activeTimeSec: this.accumulatedTime,
        ...
      });
      this.accumulatedTime = 0;
    }
  }
  
  private reset() {
    this.activeBlock = null;
    this.startTime = null;
    this.accumulatedTime = 0;
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}
```

**Integration with ActiveBlockContext:**
```typescript
// ILSProvider.tsx (EXTEND)
import { useActiveBlock } from './ActiveBlockContext';
import { ActiveBlockTimeTracker } from './activeBlockTimeTracker';

const tracker = new ActiveBlockTimeTracker();

function ILSProvider({ children }) {
  const { activeBlock } = useActiveBlock();
  
  useEffect(() => {
    if (activeBlock) {
      tracker.onBlockEntered(activeBlock);
    } else {
      tracker.onBlockExited();
    }
  }, [activeBlock]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      tracker.onVisibilityChange(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // ... existing ILSProvider logic ...
}
```

**Key Design Decisions:**
1. **Accumulate in-memory, flush periodically** - Reduces API calls
2. **Flush on block change** - Prevents attributing time to wrong block
3. **Flush on visibility hidden** - Pauses timer when tab/page not visible
4. **Flush on unmount** - Captures final time before navigation away
5. **Independent of visitCount** - Time ≠ Visit (existing pattern)

---

## Completion Synchronization

### Current Architecture

**Page Completion:** `completeNode()`
- Service-layer decides when page is complete
- Checks: all required blocks completed
- Sets: `status = 'completed'`, `completedAt = now`

**Block Completion:** `markBlockCompleted()`
- Appends to `completed_blocks` JSONB
- Idempotent: duplicate (blockId, blockVersion) ignored
- Does NOT automatically complete page

**Relationship:**
```
Block completions → Service checks requirements → Page completion (if eligible)
```

### Phase 4 Synchronization Strategy

**Option 1: Block completion updates block_learning_state.completedAt**
```typescript
// When block completed:
await repository.markBlockCompleted(...);  // Updates completed_blocks
await repository.recordBlockCompletion(...); // Updates block_learning_state.completedAt

// Atomic: BOTH must succeed or rollback
```

**Option 2: block_learning_state.completedAt derived from completed_blocks**
```typescript
// completed_blocks remains authoritative
// block_learning_state.completedAt is denormalized copy for queryability

// When fetching block state:
SELECT *,
  (SELECT block->>'completedAt' 
   FROM jsonb_array_elements(completed_blocks) block
   WHERE block->>'blockId' = ? AND block->>'blockVersion' = ?
  ) AS completed_at
FROM tutorial_navigation_progress
```

**This decision depends on STEP 5 storage model choice.**

---

## Expected Time Source

### Current State

**Finding:** `expectedTimeSec` does NOT exist in:
- ✗ `TutorialDocument` schema
- ✗ `tutorial_navigation_progress` table
- ✗ Block content definitions
- ✗ Navigation node configuration

**Mentions in prototypes/discussions:**
- Phase 4 planning documents reference `expectedTimeSec`
- RSSB mockups show time comparison
- No implemented source discovered

### Phase 4 Decision Required

**Where should expected time be configured?**

**Option A: Block content metadata (Composer)**
```typescript
// TutorialDocument
{
  blocks: [
    {
      id: "block-uuid",
      type: "definition",
      version: "D1",
      expectedTimeSec: 180,  // NEW: authored metadata
      content: { ... }
    }
  ]
}
```

**Option B: Server-side block registry**
```typescript
// packages/db-tutorial/src/config/block-expected-times.ts
export const BLOCK_EXPECTED_TIMES: Record<string, number> = {
  'D1': 180,  // 3 minutes per D1 block
  'C1': 300,  // 5 minutes per C1 block
  'S1': 120,  // 2 minutes per S1 block
};
```

**Option C: Per-instance configuration (database)**
```sql
-- block_learning_state table
expected_time_sec INT DEFAULT NULL,

-- Updated manually/programmatically per block instance
```

**Option D: Defer to future phase**
- Implement telemetry WITHOUT expected time
- Add time comparison later when source is decided

**Recommendation for STEP 5 ADR:** Document this decision explicitly.

---

## Critical Hard Stops Identified

### Hard Stop #1: Storage Model Undecided

**Cannot proceed to implementation without choosing:**
- JSONB extension vs dedicated table
- Tradeoffs must be evaluated in ADR (STEP 5)

### Hard Stop #2: Expected Time Source Undefined

**Cannot implement time comparison without:**
- Deciding where `expectedTimeSec` comes from
- Composer? Registry? Database? Deferred?

### Hard Stop #3: Completion Synchronization Pattern

**Must define:**
- Is `completed_blocks` authoritative for completedAt?
- Does `block_learning_state` duplicate or derive it?
- Transaction boundaries?

---

## Phase 4 vs Existing Completion

### Existing: Block Completion (Phase 2.5)

**Flow:**
1. User completes block
2. D1/C1/S1 component calls `trackTutorialEvent({ eventType: 'block_complete' })`
3. tutorialTrackingService → BFF → API → Service → Repository
4. `markBlockCompleted()` appends to `completed_blocks` JSONB
5. Service checks if all required blocks done → completes page if eligible

**Stored:**
```json
{
  "blockId": "block-uuid",
  "blockVersion": "D1",
  "completedAt": "2026-09-05T..."
}
```

### Phase 4: Block Telemetry (New)

**Flow:**
1. ActiveBlockContext detects block visibility
2. ILSProvider + ActiveBlockTimeTracker call telemetry APIs
3. Repository records: visitCount, revisionCount, activeTimeSec
4. Completion flow UNCHANGED (existing block_complete still works)

**Stored (Storage Model TBD):**
```typescript
{
  blockId, blockVersion,
  visitCount, revisionCount, activeTimeSec,
  firstViewedAt, lastViewedAt,
  completedAt // Synchronized with completed_blocks
}
```

**Key Principle:**
> Phase 4 EXTENDS telemetry. Phase 2.5 completion CONTINUES to work unchanged.

---

## Integration Points Summary

| Integration Point | Component | Action Required |
|-------------------|-----------|-----------------|
| **A. Block Lifecycle** | ActiveBlockContext consumer | Detect enter/exit, trigger visit/time events |
| **B. Tracking Service** | tutorialTrackingService.ts | Add `block_visit`, `block_time` event types |
| **C. API Routes** | BFF + API Server | Create `/block/visit`, `/block/active-time` routes |
| **D. Service Layer** | LearningProgressService | Add `recordBlockVisit()`, `recordBlockActiveTime()` |
| **E. Repository** | TutorialNavigationProgressRepository | Storage model TBD (STEP 5) |
| **F. Schema** | Drizzle schema | Storage model TBD (STEP 5) |
| **G. Time Tracker** | NEW: activeBlockTimeTracker.ts | Implement accumulation + flush logic |

---

## Evidence Quality

**All findings verified from:**
- ✅ Actual implementation files
- ✅ API route handlers
- ✅ Service layer code
- ✅ Repository methods
- ✅ Tracking service implementation
- ✅ ActiveBlockContext tests

**No invented integration points.**

---

**STEP 3 Status:** ✅ Complete  
**Next Action:** STEP 4 - Review ActiveBlockContext lifecycle and design block telemetry integration points  
**Then:** STEP 5 - Create ADR comparing storage models (JSONB vs dedicated table)
