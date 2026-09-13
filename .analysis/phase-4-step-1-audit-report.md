# ILS Phase 4 - Repository Audit Report

**Date:** 2026-09-04  
**Phase:** ILS Phase 4 - Page/Block Learning State & Telemetry Foundation  
**Status:** STEP 1 Complete - Repository Audit

---

## Executive Summary

The repository contains **substantial existing ILS infrastructure**. Phase 3 has already established Active Block Context. Page-level persistence exists via `tutorial_navigation_progress`. Block completion tracking exists via `completed_blocks` JSONB array. **Phase 4 does NOT need to redesign these foundations.**

The missing piece is: **block-level telemetry beyond completion** (visitCount, revisionCount, activeTimeSec, expectedTimeSec, timeComparison).

---

## Existing Architecture Inventory

### ✅ FOUND: Canonical Tutorial Document Model

**Location:** `packages/types/src/tutorial-rich-document`

**Key Findings:**
- `TutorialDocumentSchema` is canonical and validated
- `blocks[]` array contains tutorial blocks
- Each block has:
  - `block.id` (UUID, system-generated, validated for uniqueness)
  - `block.type` (e.g., 'definition', 'code')
  - `block.version` (e.g., 'D1', 'C1')
- Validation enforces unique `block.id` across document
- Multiple blocks of same version (e.g., two C1 blocks) CAN coexist with different IDs

**Evidence:**
```typescript
// packages/types/src/tutorial-rich-document/validation.ts
if (blockIds.has(block.id)) {
  errors.push({
    code: 'DUPLICATE_BLOCK_ID',
    message: `Duplicate block ID: ${block.id}`,
    blockId: block.id,
    path: `${path}[${i}]`,
  });
}
blockIds.add(block.id);
```

**Architectural Verdict:** ✅ Use canonical `block.id + blockVersion` - DO NOT invent separate ILS block identity

---

### ✅ FOUND: Block Version Registry

**Key Findings:**
- Block versions are NOT identity fields
- Block versions define **schema/contract** (e.g., D1 = Definition Block schema v1)
- Multiple instances of same version have different `block.id` values
- System assigns `block.id`, not AI/author content

**Evidence:**
```typescript
// Multiple C1 blocks verified in audit-05-block-version-semantics.ts
'Multiple C1 blocks can coexist with unique block.id'
```

**Architectural Verdict:** ✅ `blockId + blockVersion` is correct identity for learner state

---

### ✅ FOUND: Page-Level ILS Persistence

**Location:** `packages/db-tutorial/src/schema/tutorial-navigation-progress.ts`

**Table:** `tutorial_navigation_progress`

**Key Columns:**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
navigation_node_id TEXT NOT NULL -- Phase 1: Textual node IDs supported
section_id UUID              -- May be null if content not created
subtopic_id UUID NOT NULL
status TEXT NOT NULL DEFAULT 'not_started'
completed_blocks JSONB NOT NULL DEFAULT '[]'
time_spent_active_sec INTEGER NOT NULL DEFAULT 0
visit_count INTEGER NOT NULL DEFAULT 0
revision_count INTEGER NOT NULL DEFAULT 0
last_session_id TEXT          -- JWT family ID or client session UUID
first_viewed_at TIMESTAMP
last_viewed_at TIMESTAMP
completed_at TIMESTAMP
version INTEGER NOT NULL DEFAULT 1
```

**Constraints:**
```sql
UNIQUE INDEX uq_navigation_progress_user_node 
  ON (user_id, navigation_node_id) 
  WHERE deleted_at IS NULL
```

**Architectural Verdict:** ✅ Page-level ILS exists and is operational

---

### ✅ FOUND: Block Completion Model

**Location:** `completed_blocks` JSONB column in `tutorial_navigation_progress`

**Schema:**
```typescript
export interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string; // e.g., "D1", "C1", "S1"
  completedAt: string;  // ISO timestamp
}
```

**Storage Pattern:**
```typescript
completedBlocks: jsonb('completed_blocks')
  .$type<CompletedBlockRecord[]>()
  .notNull()
  .default([])
```

**Update Mechanism:**
- Atomic JSONB append with EXISTS deduplication
- Prevents lost updates AND duplicates
- Preserves block version for content revision tracking

**Architectural Verdict:** ✅ Block completion exists - DO NOT create competing system

---

### ✅ FOUND: Active Block Context (Phase 3)

**Location:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`

**Capabilities:**
- IntersectionObserver-based viewport tracking
- Deterministic active block selection (top 25% anchor zone)
- Extracts block identity from DOM:
  ```typescript
  export interface ActiveBlockIdentity {
    blockId: string;
    blockType: string;
    blockVersion?: string;
  }
  ```
- Uses Phase 2 DOM attributes: `data-block-id`, `data-block-type`, `data-block-version`
- Does NOT track time, visits, or persist state
- Does NOT call ILS APIs
- Does NOT render UI

**Lifecycle:**
1. Queries DOM for blocks with `data-block-id`
2. Creates single IntersectionObserver for all blocks
3. Updates `activeBlock` state based on visibility + anchor zone
4. Exposes via `useActiveBlock()` hook

**Architectural Verdict:** ✅ Active block detection exists - REUSE for telemetry

---

### ✅ FOUND: ILS Provider (Phase 4 foundation)

**Location:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

**Purpose:** Bridges ActiveBlockContext → ILS API

**Current Interface:**
```typescript
export interface ILSOverallProgress {
  status: LearningState;
  progressPercentage: number;
  completedBlockCount: number;
  totalBlockCount: number;
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}

export interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion?: string;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface ILSContextValue {
  navigationNodeId: string;
  subtopicId: string;
  overallProgress: ILSOverallProgress | null;
  activeBlockProgress: ILSActiveBlockProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Current Behavior:**
1. Mounts with `navigationNodeId + subtopicId`
2. Calls `GET /api/tutorial/ils/navigation/:nodeId`
3. Subscribes to `ActiveBlockContext`
4. Derives `activeBlockProgress` from `completedBlocks[]` array

**Architectural Verdict:** ✅ Provider exists - EXTEND to support block telemetry

---

### ✅ FOUND: ILS API Routes

**BFF Routes (SUIA + RTH):**
- `GET /api/tutorial/ils/navigation/:nodeId` - Get page progress
- `POST /api/tutorial/ils/visit` - Record visit
- `POST /api/tutorial/ils/block-completion` - Complete block
- `POST /api/tutorial/ils/active-time` - Update active time
- `POST /api/tutorial/ils/complete-node` - Complete navigation node
- `GET /api/tutorial/ils/subtopic/:subtopicId/progress` - Get subtopic progress

**API Server Routes:**
- All BFF routes proxy to `api-server`
- Centralized implementation in `apps/api-server/src/app/api/tutorial/ils`

**Architectural Verdict:** ✅ ILS API infrastructure exists - EXTEND for block telemetry

---

### ✅ FOUND: Tutorial Tracking Service

**Location:** `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts`

**Current Block Completion:**
```typescript
// Already calls ILS API with complete block identity
fetch('/api/tutorial/ils/block-completion', {
  method: 'POST',
  body: JSON.stringify({
    navigationNodeId,
    subtopicId,
    sectionId,
    blockId,
    blockType,
    blockVersion,
    sessionId,
  }),
});
```

**Architectural Verdict:** ✅ Block completion tracking exists - EXTEND for visit/active time

---

### ✅ FOUND: Repository Pattern

**Location:** `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts`

**Current Methods:**
```typescript
// Actual repository implementation (verified from source)
class TutorialNavigationProgressRepository {
  // Core CRUD
  findById(id: string): Promise<TutorialNavigationProgressRecord | undefined>;
  getProgress(userId: string, navigationNodeId: string): Promise<TutorialNavigationProgressRecord | null>;
  getProgressForSubtopic(userId: string, subtopicId: string): Promise<TutorialNavigationProgressRecord[]>;
  createProgress(data: TutorialNavigationProgressCreateInput): Promise<TutorialNavigationProgressRecord>;
  
  // Block completion
  markBlockCompleted(event: TutorialBlockCompletionEvent): Promise<TutorialNavigationProgressRecord>;
  isBlockCompleted(userId: string, navigationNodeId: string, blockId: string, blockVersion?: string): Promise<boolean>;
  
  // Time & visit tracking
  recordTime(event: TutorialTimeUpdateEvent): Promise<TutorialNavigationProgressRecord>;
  recordVisit(event: TutorialVisitEvent): Promise<TutorialNavigationProgressRecord>;
  incrementRevision(userId: string, navigationNodeId: string): Promise<TutorialNavigationProgressRecord>;
  
  // Node completion
  completeNode(userId: string, navigationNodeId: string): Promise<TutorialNavigationProgressRecord>;
  getCompletedNodes(userId: string, subtopicId: string): Promise<string[]>;
  isNodeComplete(userId: string, navigationNodeId: string): Promise<boolean>;
  
  // Utility
  withDb(dbClient: TutorialDbClientLike): this;
}
```

**Key Methods for Phase 4:**
- `recordTime()` - Template for block-level active time tracking
- `recordVisit()` - Template for block-level visit semantics  
- `incrementRevision()` - Relevant for block revision decision
- `markBlockCompleted()` - Existing block completion (preserve compatibility)

**Architectural Verdict:** ✅ Repository exists with 12 methods - EXTEND for block-level telemetry

---

## Missing Pieces - Phase 4 Scope

### ❌ MISSING: Block-Level Telemetry Beyond Completion

**What Exists:**
- ✅ Block completion tracking (`completedAt`)
- ✅ Page-level `visitCount`, `revisionCount`, `activeTimeSec`

**What's Missing:**
- ❌ **Per-block** `visitCount`
- ❌ **Per-block** `revisionCount`
- ❌ **Per-block** `activeTimeSec`
- ❌ **Per-block** `firstViewedAt` / `lastViewedAt`
- ❌ `expectedTimeSec` (configuration)
- ❌ Derived `timeComparison` (analytics)

**Architectural Decision Required:** Extend `completed_blocks` JSONB vs. create `block_learning_state` table

---

### ❌ MISSING: Block Visit/Active Time Tracking

**Current State:**
- `ActiveBlockContext` identifies current active block ✅
- No mechanism to track **when** learner enters/exits a block
- No mechanism to accumulate active time **per block**
- No mechanism to track **block-level visits**

**Phase 4 Requirement:**
- Track block lifecycle: enter → active → exit
- Record block visits (idempotent)
- Accumulate active time per block
- Sync with page-level active time

---

### ❌ MISSING: Expected Time Configuration

**Current State:**
- No `expectedTimeSec` in TutorialBlock schema
- No learning time estimates stored
- No time comparison logic

**Phase 4 Requirement:**
- Introduce `expectedTimeSec` at correct architectural boundary
- Support time comparison analytics
- Keep separate from learner state

---

### ❌ MISSING: Block-Level API Response

**Current API Response:**
```json
{
  "navigationNodeId": "...",
  "status": "in_progress",
  "progressPercentage": 50,
  "completedBlocks": [
    {"blockId": "...", "blockVersion": "D1", "completedAt": "..."}
  ],
  "timeSpentActiveSec": 120,
  "visitCount": 2
}
```

**Missing:** Block-level metrics in response:
```json
{
  "blocks": [
    {
      "blockId": "...",
      "blockVersion": "D1",
      "visitCount": 3,
      "revisionCount": 1,
      "activeTimeSec": 45,
      "firstViewedAt": "...",
      "lastViewedAt": "...",
      "completedAt": "..."
    }
  ]
}
```

---

## Architectural Decisions Required

### Decision 1: Storage Model for Block Telemetry

**Option A: Extend completed_blocks JSONB**
```typescript
interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string;
  completedAt: string;
  // NEW:
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  firstViewedAt?: string;
  lastViewedAt?: string;
}
```

**Pros:**
- No migration required
- Keeps block data together
- Simpler queries (single row per page)

**Cons:**
- JSONB updates more complex
- Harder to index/query block metrics
- Larger JSONB payload

**Option B: New block_learning_state table**
```sql
CREATE TABLE block_learning_state (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  visit_count INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  active_time_sec INTEGER DEFAULT 0,
  first_viewed_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE (user_id, navigation_node_id, block_id, block_version)
);
```

**Pros:**
- Queryable, indexable
- Simpler atomic updates
- Better analytics
- Future-proof for richer telemetry

**Cons:**
- Requires migration
- More table joins
- Must maintain referential integrity

**Recommendation:** **Option B** - Dedicated table
- Better queryability for analytics
- Cleaner atomic updates
- Supports future assessment/interaction history
- Aligns with relational model best practices

---

### Decision 2: Expected Time Location

**Option A: Add to TutorialBlock schema**
```typescript
interface TutorialBlock {
  id: string;
  type: string;
  version: string;
  content: {...};
  expectedTimeSec?: number; // NEW
}
```

**Cons:**
- Mixes content with learning configuration
- Different blocks of same type might have different expectations
- Content is immutable, expectations might change

**Option B: Separate learning configuration**
```typescript
// New: Learning configuration service/table
interface BlockLearningConfig {
  blockType: string;
  blockVersion: string;
  expectedTimeSec: number;
}
```

**Pros:**
- Separates content from learning analytics
- Can adjust expectations without changing content
- Supports block-type-level defaults

**Recommendation:** **Option B** - Separate configuration
- Cleaner separation of concerns
- Easier to adjust learning expectations
- Can have per-type defaults (e.g., all D1 blocks → 60 sec)

---

### Decision 3: Visit Semantics

**Page Visit:**
- Currently: New `sessionId` different from `lastSessionId`
- Idempotent: Same session = no visit increment

**Block Visit:**
- **Option A:** Every block activation = visit
  - Cons: Too noisy, page reload = multiple visits
- **Option B:** First activation per block per session = visit
  - Pros: Matches page visit semantics, idempotent
- **Option C:** Only count if block was previously exited
  - Pros: True "revisit" semantic
  - Cons: Complex state tracking

**Recommendation:** **Option B** - First activation per session
- Consistent with page visit semantics
- Idempotent, prevents double-counting
- Simple to implement: check if block already visited in current session

---

### Decision 4: Revision Semantics

**Page Revision:**
- Return to previously completed node in new session

**Block Revision:**
- **Option A:** Return to previously completed block in new session
- **Option B:** Any visit after completion = revision
- **Option C:** Separate from completion (track independently)

**Recommendation:** **Option A** - Consistent with page semantics
- Revision = return after completion
- Automatically detected: block completed + new session + new visit
- Aligns with existing page-level definition

---

## Implementation Scope - Phase 4

### IN SCOPE:

1. **Database:**
   - Create `block_learning_state` table
   - Migrate existing `completed_blocks` data
   - Add `block_learning_config` table for expected times

2. **Repository:**
   - Extend `TutorialNavigationProgressRepository` with block methods:
     - `getBlockProgress(userId, navigationNodeId, blockId, blockVersion)`
     - `recordBlockVisit(event)`
     - `updateBlockActiveTime(event)`
     - `getPageWithBlocks(userId, navigationNodeId)` - combined query

3. **Service:**
   - Create `BlockLearningStateService`:
     - `trackBlockVisit()`
     - `trackBlockActiveTime()`
     - `getBlockProgress()`
     - `getTimeComparison()` - derived calculation

4. **API:**
   - Extend `GET /api/tutorial/ils/navigation/:nodeId` response:
     - Add `blocks[]` array with per-block metrics
   - Add `POST /api/tutorial/ils/block/visit`
   - Add `POST /api/tutorial/ils/block/active-time`

5. **Runtime:**
   - Extend `tutorialTrackingService.ts`:
     - Track block enter/exit lifecycle
     - Call block visit API
     - Track block active time
     - Sync with `ActiveBlockContext`

6. **Provider:**
   - Extend `ILSProvider`:
     - Consume block-level API response
     - Expose block metrics via context
     - Update on active block change

7. **Types:**
   - Add block telemetry types
   - Update API schemas
   - Update ILS context interfaces

### OUT OF SCOPE (Future Phases):

- ❌ Interaction history (clicks, scrolls, interactions)
- ❌ Assessment attempts/scores
- ❌ Block-specific UI components
- ❌ Rich RSSB sidebar features
- ❌ Advanced analytics dashboards
- ❌ Machine learning / adaptive learning

---

## Key Architectural Invariants

### DO NOT:

1. ❌ Create second block identity system - USE `block.id + blockVersion`
2. ❌ Duplicate completion tracking - EXTEND existing model
3. ❌ Build block-type-specific telemetry - BUILD GENERIC
4. ❌ Modify TutorialDocument schema for telemetry - KEEP SEPARATE
5. ❌ Make `ActiveBlockContext` track time/visits - KEEP PURE SELECTION
6. ❌ Put learner state in immutable content - MAINTAIN SEPARATION

### DO:

1. ✅ Reuse canonical `block.id + blockVersion`
2. ✅ Reuse `ActiveBlockContext` for block selection
3. ✅ Extend existing ILS API patterns
4. ✅ Build generic block telemetry (works for D1, C1, S1, future types)
5. ✅ Maintain page ↔ block synchronization
6. ✅ Keep content, configuration, and learner state separate

---

## File Size Constraints

**Current Status:**
- ✅ `ActiveBlockContext.tsx`: ~327 lines (within 600 limit)
- ✅ `ILSProvider.tsx`: ~400 lines (within 600 limit)
- ✅ `tutorialTrackingService.ts`: ~300 lines (within 600 limit)

**Phase 4 Requirement:**
- All new files must be ≤ 600 lines
- If approaching limit, extract cohesive modules

---

## Next Steps

**STEP 2:** Audit existing page ILS implementation
- Document exact visit/revision/time tracking
- Identify reusable patterns for blocks

**STEP 3:** Audit existing block completion flow
- Trace Composer → Runtime → API → Repository
- Identify integration points for telemetry

**STEP 4:** Review ActiveBlockContext lifecycle
- Document exact enter/exit events
- Design block telemetry integration

**STEP 5:** Design BlockLearningState architecture
- Create ADR (Architecture Decision Record)
- Define storage model
- Define service contracts

---

## Audit Conclusion

✅ **Canonical foundations exist**  
✅ **Phase 3 active block detection operational**  
✅ **Page-level ILS persistence proven**  
✅ **Block completion tracking certified**  
✅ **No competing systems to reconcile**

**Phase 4 can proceed with confidence:**
- Extend existing models (do not redesign)
- Reuse ActiveBlockContext (do not duplicate)
- Build generic block telemetry (future-proof)
- Maintain architectural boundaries (content ≠ state ≠ analytics)

**Critical Path:** Design block_learning_state table → Implement service → Extend API → Integrate runtime

---

**Report Status:** STEP 1 Complete  
**Next Action:** Proceed to STEP 2 - Existing Page ILS Audit
