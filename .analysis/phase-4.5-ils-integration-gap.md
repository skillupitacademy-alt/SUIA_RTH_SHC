# Phase 4.5 - ILS Integration Gap Analysis

## Database Audit Results

### ✅ WORKING - Composer Storage
- **Table**: `tutorial_sections.content` (JSONB)
- **Section**: 1 row for "whatisjava" (navigationNodeId)
- **Blocks**: 2 blocks in content
- **expectedTimeSec**: ✅ Present in first block (`180s`)

```javascript
{
  schemaVersion: 1,
  blocks: [
    {
      id: "79ae6e0f-0374-4dfe-8d76-cefbe42f8996",
      type: "definition",
      version: "D1",
      expectedTimeSec: 180,  // ✅ PRESENT
      content: {...}
    }
  ]
}
```

### ✅ WORKING - ILS Schema
- **Page tracking**: `tutorial_navigation_progress` (3 rows exist)
- **Block tracking**: `block_learning_state` (0 rows - not used yet)
- **Schema**: Has `expected_time_sec` column (integer, nullable) ✅

### ❌ GAP FOUND - ILS Ingestion

**File**: `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method**: `recordBlockVisit()` (Line 544)

**Current behavior**:
```typescript
async recordBlockVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string
): Promise<BlockLearningState> {
  // ... validation ...
  
  // Creates/updates block_learning_state BUT:
  return await this.blockLearningStateRepository.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    visitCount: 1,
    revisionCount: 0,
    activeTimeSec: 0,
    // ❌ expectedTimeSec NOT SET
    firstViewedAt: now,
    lastViewedAt: now,
  });
}
```

**What's missing**:
1. Does NOT fetch tutorial content from `tutorial_sections`
2. Does NOT extract `expectedTimeSec` from block
3. Does NOT pass `expectedTimeSec` to repository

## Required Fix

### 1. Fetch Tutorial Content

```typescript
async recordBlockVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string
): Promise<BlockLearningState> {
  // ... existing validation ...
  
  // NEW: Fetch tutorial content to get expectedTimeSec
  const section = await this.sectionRepository.getTutorialByPageIdentity(
    subtopicId,
    navigationNodeId,
    identity.brand
  );
  
  if (!section || !section.content?.blocks) {
    throw new Error('Tutorial content not found');
  }
  
  // NEW: Find the specific block
  const block = section.content.blocks.find(
    b => b.id === blockId && b.version === blockVersion
  );
  
  const expectedTimeSec = block?.expectedTimeSec ?? null;
  
  // ... existing visit logic ...
  
  return await this.blockLearningStateRepository.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    visitCount: 1,
    revisionCount: 0,
    activeTimeSec: 0,
    expectedTimeSec,  // ✅ NOW POPULATED
    firstViewedAt: now,
    lastViewedAt: now,
  });
}
```

### 2. Type Safety

Ensure `TutorialBlock` type includes `expectedTimeSec`:

```typescript
// Already exists in packages/types
interface TutorialBlock {
  id: string;
  type: string;
  version: string;
  content: unknown;
  presentation?: unknown;
  expectedTimeSec?: number;  // ✅ Already present
}
```

## Testing Required

1. **Unit Test**: Service populates `expectedTimeSec` from content
2. **Integration Test**: Block visit creates record with correct `expected_time_sec`
3. **API Test**: GET block state returns `expectedTimeSec`

## Architecture Confirmed

```
Composer
  ↓
tutorial_sections.content.blocks[].expectedTimeSec = 180
  ↓
Learner visits block
  ↓
recordBlockVisit() 
  ↓ (NEW: fetch content)
Extracts expectedTimeSec from block
  ↓
block_learning_state.expected_time_sec = 180
  ↓
ILS API returns expectedTimeSec for time comparison
```

## Next Actions

1. Implement `expectedTimeSec` extraction in `recordBlockVisit()`
2. Add tests for the integration
3. Verify with real learner visit
4. Check ILS API returns the field

## Status

- ✅ Phase 4.5 Composer: Complete
- ✅ Database schema: Ready
- ❌ ILS ingestion: Missing expectedTimeSec extraction
- ⏸ ILS API: Untested (depends on ingestion)
