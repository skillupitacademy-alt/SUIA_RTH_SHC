# Phase 4.5 - Current ILS Metrics (READ-ONLY INSPECTION)

## PAGE-LEVEL METRICS (tutorial_navigation_progress)

### Schema Location
`packages/db-tutorial/src/schema/tutorial-navigation-progress.ts`

### Identity
- `userId` (uuid, NOT NULL)
- `navigationNodeId` (text, NOT NULL) ← Page identity
- `subtopicId` (uuid, NOT NULL)
- `sectionId` (uuid, nullable)

### Current Metrics Tracked

**Session/Visit Tracking:**
- `visitCount` (integer, default 0) - Total distinct visits/sessions
- `revisionCount` (integer, default 0) - Returns after completion
- `lastSessionId` (text, nullable) - Session UUID for deduplication

**Time Tracking:**
- `timeSpentActiveSec` (integer, default 0) - Active engagement time (tab visible)
- ❌ **NO expectedTimeSec at page level** (correctly scoped to blocks)

**Completion Tracking:**
- `status` (enum: not_started, in_progress, completed, mastered)
- `completedBlocks` (jsonb array) - `{blockId, blockVersion, completedAt}[]`
- `firstViewedAt` (timestamp, nullable)
- `lastViewedAt` (timestamp, nullable)
- `completedAt` (timestamp, nullable)

### Service Method: `recordVisit()`
**File**: `learning-progress.service.ts` Line 245

**What it does:**
```typescript
async recordVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  sessionId: string,
  sectionId?: string | null
)
```

**Metrics updated:**
1. Validates hierarchy
2. Ensures progress row exists
3. Calls `progressRepository.recordVisit()` with:
   - `userId`
   - `navigationNodeId`
   - `subtopicId`
   - `sessionId`
   - `occurredAt` timestamp
4. Repository handles atomic session transition (visit vs same-session)
5. Returns DTO with calculated fields

**Does NOT track:**
- ❌ expectedTimeSec (correct - not page-level)
- ❌ Individual block times (correct - block-level concern)

---

## BLOCK-LEVEL METRICS (block_learning_state)

### Schema Location
`packages/db-tutorial/src/schema/block-learning-state.ts`

### Identity
- `userId` (uuid, NOT NULL)
- `navigationNodeId` (text, NOT NULL) ← Page context
- `blockId` (text, NOT NULL) ← Block UUID
- `blockVersion` (text, NOT NULL) ← 'D1', 'C1', 'S1'

### Current Metrics Tracked

**Session/Visit Tracking:**
- `visitCount` (integer, default 0) - Block-level visits
- `revisionCount` (integer, default 0) - Returns after completion

**Time Tracking:**
- `activeTimeSec` (integer, default 0) - Measured active time
- ✅ **`expectedTimeSec` (integer, nullable)** ← EXISTS IN SCHEMA

**Completion Tracking:**
- `firstViewedAt` (timestamp, nullable)
- `lastViewedAt` (timestamp, nullable)
- `completedAt` (timestamp, nullable) - Denormalized from page-level

### Service Method: `recordBlockVisit()`
**File**: `learning-progress.service.ts` Line 544

**What it does:**
```typescript
async recordBlockVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string
)
```

**Current behavior:**
1. Validates inputs
2. Validates navigation hierarchy
3. Checks if block state exists
4. **Session detection** (30-minute window):
   - Same session → update `lastViewedAt` only
   - New session → increment `visitCount`
   - New session + already completed → increment `revisionCount`

**Metrics updated:**
```typescript
// First visit
upsert({
  userId,
  navigationNodeId,
  blockId,
  blockVersion,
  visitCount: 1,
  revisionCount: 0,
  activeTimeSec: 0,
  // ❌ expectedTimeSec: NOT SET
  firstViewedAt: now,
  lastViewedAt: now,
})

// Subsequent visits (new session)
upsert({
  userId,
  navigationNodeId,
  blockId,
  blockVersion,
  visitCount: 1,  // Increment
  revisionCount: isCompleted ? 1 : 0,
  activeTimeSec: 0,
  // ❌ expectedTimeSec: NOT SET
  lastViewedAt: now,
})
```

**❌ GAP: Does NOT populate `expectedTimeSec`**

---

## WHAT'S MISSING

### Block-Level: expectedTimeSec Population

**Current Flow:**
```
Learner visits block
  ↓
recordBlockVisit(blockId, blockVersion)
  ↓
Creates/updates block_learning_state
  ↓
❌ expectedTimeSec remains NULL
```

**Required Flow:**
```
Learner visits block
  ↓
recordBlockVisit(blockId, blockVersion)
  ↓
Fetch tutorial content from tutorial_sections
  ↓
Find block by blockId + blockVersion
  ↓
Extract block.expectedTimeSec
  ↓
Pass to repository.upsert({ expectedTimeSec })
  ↓
✅ block_learning_state.expected_time_sec populated
```

---

## DATA SOURCES

### Where expectedTimeSec Lives

**Composer Storage:**
```javascript
// tutorial_sections.content (JSONB)
{
  schemaVersion: 1,
  blocks: [
    {
      id: "79ae6e0f-0374-4dfe-8d76-cefbe42f8996",
      type: "definition",
      version: "D1",
      expectedTimeSec: 180,  // ← SOURCE
      content: {...}
    }
  ]
}
```

**ILS Target:**
```sql
-- block_learning_state table
expected_time_sec INTEGER NULL  -- ← TARGET (currently unpopulated)
```

---

## REPOSITORY CAPABILITY CHECK

### BlockLearningStateRepository.upsert()

**File**: `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

**Interface:**
```typescript
interface UpsertBlockLearningStateInput {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  expectedTimeSec?: number | null;  // ✅ SUPPORTED
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}
```

**Verdict**: ✅ Repository ALREADY SUPPORTS `expectedTimeSec` parameter

**Tests exist**: 
- `block-learning-state.repository.test.ts` Line 223: "creates with expectedTimeSec"
- `block-learning-state.repository.test.ts` Line 244: "creates without expectedTimeSec (nullable)"
- `block-learning-state.repository.test.ts` Line 341: "updates expectedTimeSec"
- `block-learning-state.repository.test.ts` Line 480: "handles expectedTimeSec in upsert"

---

## ARCHITECTURE SUMMARY

### ✅ CORRECT SEPARATION

**Page-level** (`tutorial_navigation_progress`):
- Tracks page visits, sessions, overall time
- Tracks WHICH blocks completed (array)
- NO expectedTimeSec (correct - blocks have varying times)

**Block-level** (`block_learning_state`):
- Tracks per-block visits, sessions, active time
- HAS expectedTimeSec schema field
- ❌ But service doesn't populate it yet

### 📊 METRICS COMPARISON

| Metric | Page-Level | Block-Level | Notes |
|--------|------------|-------------|-------|
| visitCount | ✅ | ✅ | Independent counters |
| revisionCount | ✅ | ✅ | Independent counters |
| activeTimeSec | ✅ (timeSpentActiveSec) | ✅ | Can compare |
| expectedTimeSec | ❌ (N/A) | ✅ (schema only) | Block-specific |
| sessionId | ✅ (lastSessionId) | ❌ | Page tracks, block uses time window |
| completedBlocks | ✅ (array) | ❌ | Page is authority |
| completedAt | ✅ | ✅ (denormalized) | Page → Block |
| status | ✅ (enum) | ❌ | Page-level only |

---

## NEXT STEPS

1. ✅ Verified schemas have correct scope
2. ✅ Verified repository supports expectedTimeSec
3. ✅ Identified gap: service doesn't fetch/populate it
4. ⏭️ Implement: Extract expectedTimeSec in `recordBlockVisit()`
5. ⏭️ Test: Service + API + real learner visit
6. ⏭️ Verify: DB audit shows populated values

---

## DECISION RECORD

**❌ DO NOT:**
- Add expectedTimeSec to page-level (incorrect scope)
- Calculate/invent expectedTimeSec in ILS (Composer is authority)
- Assume all blocks have expectedTimeSec (nullable, optional metadata)

**✅ DO:**
- Fetch from `tutorial_sections.content.blocks[]`
- Pass to `blockLearningStateRepository.upsert({ expectedTimeSec })`
- Handle null/missing gracefully
- Preserve existing session/visit logic
