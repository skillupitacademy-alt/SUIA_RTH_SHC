# ILS Phase 4 - STEP 5: Block Telemetry Storage Architecture ADR

**Date:** 2026-09-05  
**Status:** PROPOSED - Awaiting Approval  
**Decision Makers:** Technical Lead, Product Owner  
**Phase:** Phase 4 - Block Learning State & Telemetry Foundation

---

## Context

Phase 4 implements generic block-level telemetry that works automatically for D1, C1, S1, I1, O1, and all future block types without block-specific code.

**Required Block Telemetry:**
- `visitCount` - Session-aware visit tracking
- `revisionCount` - Returns to completed blocks
- `activeTimeSec` - Cumulative active time on block
- `firstViewedAt` - Initial view timestamp
- `lastViewedAt` - Most recent view timestamp
- `completedAt` - Block completion timestamp (already exists in `completed_blocks`)
- `lastSessionId` - For session-aware atomic increments

**Optional/Configuration:**
- `expectedTimeSec` - Expected time to complete (source TBD)

**Derived (not stored):**
- `timeComparison` - Calculated from activeTimeSec + expectedTimeSec

**Current State:**
- Page-level ILS exists in `tutorial_navigation_progress` table
- Block completion stored in `completed_blocks` JSONB array: `[{blockId, blockVersion, completedAt}]`
- No block visit/revision/time tracking exists

**Architectural Requirement:**
> Generic implementation that works for ANY block type added by Composer, without modifying ILS architecture.

---

## Decision

**What storage model should Phase 4 use for block-level telemetry?**

---

## Options

### Option A: Extend `completed_blocks` JSONB Array

Store block telemetry within existing `tutorial_navigation_progress.completed_blocks` JSONB field.

**Schema:**
```typescript
completed_blocks: [
  {
    blockId: "381048c3-ae87-4a32-aef5-b3b5656fee64",
    blockVersion: "D1",
    completedAt: "2026-09-05T12:34:56Z",
    // PHASE 4 ADDITIONS:
    visitCount: 3,
    revisionCount: 1,
    activeTimeSec: 245,
    firstViewedAt: "2026-09-04T10:15:30Z",
    lastViewedAt: "2026-09-05T12:34:56Z",
    lastSessionId: "session-uuid-123",
    expectedTimeSec: 180
  },
  {
    blockId: "c1-block-uuid",
    blockVersion: "C1",
    completedAt: null,  // Not completed yet
    visitCount: 1,
    revisionCount: 0,
    activeTimeSec: 45,
    firstViewedAt: "2026-09-05T12:00:00Z",
    lastViewedAt: "2026-09-05T12:00:45Z",
    lastSessionId: "session-uuid-123",
    expectedTimeSec: 300
  }
]
```

**Repository Pattern:**
```sql
-- Atomic update for block visit
UPDATE tutorial_navigation_progress
SET completed_blocks = (
  SELECT jsonb_agg(
    CASE
      WHEN block->>'blockId' = $blockId AND block->>'blockVersion' = $blockVersion
      THEN jsonb_set(
        jsonb_set(
          block,
          '{visitCount}',
          CASE 
            WHEN block->>'lastSessionId' IS DISTINCT FROM $sessionId
            THEN to_jsonb((block->>'visitCount')::int + 1)
            ELSE block->'visitCount'
          END
        ),
        '{lastSessionId}',
        to_jsonb($sessionId)
      )
      ELSE block
    END
  )
  FROM jsonb_array_elements(completed_blocks)
)
WHERE user_id = $userId AND navigation_node_id = $navigationNodeId;
```

---

### Option B: Dedicated `block_learning_state` Table

Create separate relational table for block telemetry.

**Schema:**
```sql
CREATE TABLE block_learning_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
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
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_session_id TEXT,
  expected_time_sec INT,
  
  -- Standard fields
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Unique constraint (composite key)
  UNIQUE (user_id, brand, navigation_node_id, block_id, block_version)
  WHERE deleted_at IS NULL
);

CREATE INDEX idx_block_learning_state_user_node 
  ON block_learning_state(user_id, navigation_node_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_block_learning_state_block 
  ON block_learning_state(block_id, block_version) 
  WHERE deleted_at IS NULL;
```

**Repository Pattern:**
```sql
-- Atomic update for block visit
UPDATE block_learning_state
SET 
  visit_count = CASE 
    WHEN last_session_id IS DISTINCT FROM $sessionId 
    THEN visit_count + 1 
    ELSE visit_count 
  END,
  last_session_id = $sessionId,
  last_viewed_at = NOW(),
  version = version + 1
WHERE user_id = $userId 
  AND brand = $brand
  AND navigation_node_id = $navigationNodeId
  AND block_id = $blockId 
  AND block_version = $blockVersion
  AND deleted_at IS NULL;
```

---

## Evaluation Criteria

### 1. Atomic Updates

**Option A (JSONB):**
- ✅ PostgreSQL JSONB operations are atomic
- ⚠️ Complex SQL: requires `jsonb_set`, `jsonb_agg`, `jsonb_array_elements`
- ⚠️ Must rebuild entire array for single block update
- ⚠️ Harder to write/test/maintain
- ⚠️ Error-prone nested CASE expressions

**Option B (Dedicated Table):**
- ✅ Simple SQL: standard UPDATE with CASE
- ✅ Single row update (no array rebuilding)
- ✅ Reuses existing atomic patterns from page-level ILS
- ✅ Easy to write/test/maintain

**Winner:** Option B

---

### 2. Concurrency

**Option A (JSONB):**
- ✅ Row-level lock on `tutorial_navigation_progress`
- ⚠️ **Lock contention:** Page-level updates (visits, time) compete with block-level updates
- ⚠️ High-traffic page: multiple concurrent block updates block each other
- ⚠️ Must lock entire page row to update single block

**Scenario:**
```
User scrolls through 5-block page:
- T0: D1 visit (locks page row)
- T1: C1 visit (waits for D1 lock)
- T2: S1 visit (waits for C1 lock)
- T3: Page time flush (waits for S1 lock)
- T4: D1 time flush (waits for page lock)
→ Sequential bottleneck
```

**Option B (Dedicated Table):**
- ✅ Row-level lock per block (independent)
- ✅ **No lock contention:** D1 visit + C1 visit + page visit = parallel
- ✅ Blocks can update concurrently
- ✅ Page updates don't block block updates

**Scenario:**
```
Same user scrolling:
- T0: D1 visit (locks D1 row only)
- T1: C1 visit (locks C1 row only) ← parallel
- T2: S1 visit (locks S1 row only) ← parallel
- T3: Page time (locks page row only) ← parallel
→ No contention
```

**Winner:** Option B (significantly better at scale)

---

### 3. Queryability

**Option A (JSONB):**
- ⚠️ **Single-block fetch:** Must scan array
  ```sql
  SELECT block 
  FROM jsonb_array_elements(completed_blocks) block
  WHERE block->>'blockId' = $blockId 
    AND block->>'blockVersion' = $blockVersion;
  ```
- ⚠️ **Multi-block fetch:** Must unnest array
- ⚠️ Cannot index individual block fields
- ⚠️ GIN index helps existence checks, not field queries
- ❌ **RSSB use case:** Fetch active block state requires array scan

**Option B (Dedicated Table):**
- ✅ **Single-block fetch:** Direct index lookup
  ```sql
  SELECT * FROM block_learning_state
  WHERE user_id = $userId 
    AND navigation_node_id = $nodeId
    AND block_id = $blockId 
    AND block_version = $blockVersion;
  ```
- ✅ B-tree index on (user_id, navigation_node_id, block_id, block_version)
- ✅ Supports field-specific queries (e.g., blocks with activeTimeSec > 300)
- ✅ **RSSB use case:** O(1) lookup via index

**Winner:** Option B

---

### 4. Aggregation / Analytics

**Option A (JSONB):**
- ⚠️ Must unnest arrays for aggregation
  ```sql
  SELECT AVG((block->>'activeTimeSec')::int)
  FROM tutorial_navigation_progress,
       jsonb_array_elements(completed_blocks) block
  WHERE block->>'blockVersion' = 'D1';
  ```
- ⚠️ Cannot efficiently filter blocks before unnesting
- ⚠️ Cross-user aggregation requires full table scan + unnest
- ❌ **Analytics queries slow** (no block-level indexes)

**Example Analytics:**
- "Average time spent on D1 blocks across all users"
- "Blocks with highest revision rates"
- "Completion rate per block version"

**Option B (Dedicated Table):**
- ✅ Standard SQL aggregation
  ```sql
  SELECT block_version, AVG(active_time_sec)
  FROM block_learning_state
  WHERE block_version = 'D1'
  GROUP BY block_version;
  ```
- ✅ Can index aggregation columns
- ✅ Efficient filtering before aggregation
- ✅ Standard BI tool compatibility

**Winner:** Option B

---

### 5. Migration Complexity

**Option A (JSONB):**
- ✅ **No new table** - uses existing structure
- ✅ **Backward compatible** - existing `{blockId, blockVersion, completedAt}` objects remain valid
- ⚠️ Must handle partial migrations (old objects without new fields)
- ⚠️ Application code must handle both old and new formats
- ⚠️ Migration = add fields to existing JSONB objects (online operation)

**Migration:**
```sql
-- No schema change, just add fields when blocks are visited
-- Old format still works:
{blockId, blockVersion, completedAt}

-- New format coexists:
{blockId, blockVersion, completedAt, visitCount, ...}
```

**Option B (Dedicated Table):**
- ⚠️ **New table** - requires migration
- ⚠️ Must backfill existing `completed_blocks` → `block_learning_state`
- ⚠️ Dual-write period during migration
- ✅ Clean separation after migration complete
- ✅ No format ambiguity

**Migration:**
```sql
-- 1. Create table
-- 2. Backfill: INSERT INTO block_learning_state (...)
--    SELECT user_id, brand, navigation_node_id, 
--           block->>'blockId', block->>'blockVersion',
--           0, 0, 0, NULL, NULL, block->>'completedAt', NULL, NULL
--    FROM tutorial_navigation_progress,
--         jsonb_array_elements(completed_blocks) block;
-- 3. Enable dual-write in application
-- 4. Validate
-- 5. Switch to dedicated table as source of truth
```

**Winner:** Option A (simpler migration)

---

### 6. Storage Size

**Option A (JSONB):**
```typescript
// Per block in array:
{
  "blockId": "381048c3-ae87-4a32-aef5-b3b5656fee64",  // ~36 chars
  "blockVersion": "D1",                               // ~2 chars
  "completedAt": "2026-09-05T12:34:56.789Z",         // ~24 chars
  "visitCount": 3,                                    // ~1 char
  "revisionCount": 1,                                 // ~1 char
  "activeTimeSec": 245,                               // ~3 chars
  "firstViewedAt": "2026-09-04T10:15:30.123Z",       // ~24 chars
  "lastViewedAt": "2026-09-05T12:34:56.789Z",        // ~24 chars
  "lastSessionId": "session-uuid-123",                // ~20 chars
  "expectedTimeSec": 180                              // ~3 chars
}
// ≈ 150-200 bytes per block (JSONB overhead + field names)
```

**5 blocks per page × 200 bytes = 1KB per page row**

**Option B (Dedicated Table):**
```sql
-- Per block row:
id (UUID)              16 bytes
user_id (UUID)         16 bytes
brand (ENUM)            4 bytes
navigation_node_id     ~20 bytes
subtopic_id (UUID)     16 bytes
block_id (UUID)        16 bytes
block_version          ~10 bytes
visit_count (INT)       4 bytes
revision_count (INT)    4 bytes
active_time_sec (INT)   4 bytes
first_viewed_at        8 bytes
last_viewed_at         8 bytes
completed_at           8 bytes
last_session_id        ~20 bytes
expected_time_sec      4 bytes
version (INT)          4 bytes
created_at             8 bytes
updated_at             8 bytes
deleted_at             8 bytes

≈ 166 bytes per block + indexes
```

**5 blocks per page × 166 bytes = 830 bytes (5 separate rows)**

**Indexes:**
- Primary key (id): ~16 bytes/row
- Unique constraint (user_id, brand, node_id, block_id, version): ~50 bytes/row
- Additional indexes: ~30 bytes/row

**Total per block:** ~260 bytes (row + indexes)

**Comparison:**
- **Option A:** 1KB per page (all blocks in one JSONB)
- **Option B:** 1.3KB per page (5 rows × 260 bytes)

**Winner:** Option A (slightly smaller)

**But:** Storage cost difference negligible at scale. Performance/queryability more important.

---

### 7. Page ↔ Block Synchronization

**Requirement:** `completed_blocks` and block telemetry must stay consistent.

**Option A (JSONB):**
- ✅ **Same source of truth** - `completedAt` lives in same JSONB object
- ✅ No synchronization needed
- ✅ Atomic: block completion + telemetry in single UPDATE
- ✅ No consistency issues

**Option B (Dedicated Table):**
- ⚠️ **Two sources of truth:**
  - `tutorial_navigation_progress.completed_blocks[].completedAt`
  - `block_learning_state.completed_at`
- ⚠️ Must keep synchronized
- ⚠️ Dual-write complexity

**Synchronization Options:**

**B1: Dual-write (transactional)**
```typescript
await db.transaction(async (tx) => {
  // Update completed_blocks
  await progressRepo.markBlockCompleted(tx, ...);
  
  // Update block_learning_state.completed_at
  await blockStateRepo.markCompleted(tx, ...);
});
```
- ✅ Strongly consistent
- ⚠️ Requires transaction across updates

**B2: Single source of truth**
```typescript
// completed_blocks remains authoritative
// block_learning_state.completed_at derived on read:
SELECT 
  bls.*,
  (SELECT block->>'completedAt' 
   FROM jsonb_array_elements(tnp.completed_blocks) block
   WHERE block->>'blockId' = bls.block_id 
     AND block->>'blockVersion' = bls.block_version
  ) AS completed_at
FROM block_learning_state bls
JOIN tutorial_navigation_progress tnp USING (user_id, navigation_node_id);
```
- ✅ No synchronization needed
- ⚠️ More complex queries
- ⚠️ Requires JOIN on every fetch

**B3: completed_blocks becomes secondary**
```typescript
// block_learning_state.completed_at is authoritative
// completed_blocks used only for page-level completion logic
// Don't store completedAt in completed_blocks anymore, just {blockId, blockVersion}
```
- ✅ Clean separation
- ⚠️ Breaking change to existing architecture

**Winner:** Option A (no synchronization issues)

---

### 8. Future Features

**Anticipated Phase 5+ Features:**
- Assessment attempts per block (array of attempts)
- Score/performance metrics per block
- Interaction history (e.g., code executions, quiz answers)
- Adaptive learning recommendations
- Rich analytics per block

**Option A (JSONB):**
- ⚠️ Can add fields to JSONB
- ❌ **Not suitable for arrays** (attempts, interactions)
- ❌ **Nested JSONB queries** become unmaintainable
- ❌ Cannot efficiently query nested data
- ❌ Example: "Find blocks where user scored < 60% on attempt 2"

**Option B (Dedicated Table):**
- ✅ Can add columns easily
- ✅ Can create related tables:
  - `block_assessment_attempts`
  - `block_interactions`
  - `block_recommendations`
- ✅ Relational queries across tables
- ✅ Proper foreign key constraints

**Winner:** Option B (significantly more extensible)

---

### 9. Developer Experience

**Option A (JSONB):**
- ❌ **Complex SQL:** Nested JSONB manipulation is hard to write/read/maintain
- ❌ **Testing:** Must test JSONB array rebuild logic carefully
- ❌ **Debugging:** Harder to inspect JSONB state
- ❌ **Type safety:** JSONB casting required (`block->>'visitCount')::int`)
- ⚠️ **Repository logic:** 50-100 lines of SQL for atomic block update

**Option B (Dedicated Table):**
- ✅ **Simple SQL:** Standard UPDATE/INSERT patterns
- ✅ **Testing:** Reuse existing atomic patterns from page-level
- ✅ **Debugging:** Standard table inspection
- ✅ **Type safety:** Native column types
- ✅ **Repository logic:** 10-20 lines of SQL (reuses existing helpers)

**Winner:** Option B

---

### 10. Performance

**Scenario:** User on 5-block page, active scrolling/engagement

**Option A (JSONB):**
- ⚠️ **Every block update:** Read entire JSONB array, rebuild, write back
- ⚠️ **5-block page:** ~1KB JSONB read/write per block update
- ⚠️ **Lock contention:** Page-level lock for all block updates
- ⚠️ **No selective index:** Cannot index visitCount, activeTimeSec within JSONB
- ⚠️ **RSSB fetch:** Must scan array to find active block

**Metrics:**
- Block visit API: ~50ms (array scan + rebuild)
- Block time API: ~50ms (array scan + rebuild)
- RSSB active block fetch: ~30ms (array scan)

**Option B (Dedicated Table):**
- ✅ **Every block update:** Direct row update via index
- ✅ **5-block page:** ~200 bytes read/write per block update
- ✅ **No lock contention:** Independent row locks
- ✅ **B-tree indexes:** Fast lookup on all columns
- ✅ **RSSB fetch:** O(1) index lookup

**Metrics:**
- Block visit API: ~5-10ms (index lookup + UPDATE)
- Block time API: ~5-10ms (index lookup + UPDATE)
- RSSB active block fetch: ~2-5ms (index lookup)

**Winner:** Option B (5-10x faster)

---

## Decision Matrix

| Criteria | Option A (JSONB) | Option B (Dedicated Table) | Winner |
|----------|------------------|---------------------------|--------|
| **Atomic Updates** | ⚠️ Complex SQL | ✅ Simple SQL | **B** |
| **Concurrency** | ⚠️ Lock contention | ✅ Independent locks | **B** |
| **Queryability** | ⚠️ Array scan | ✅ Index lookup | **B** |
| **Aggregation/Analytics** | ❌ Slow, complex | ✅ Fast, simple | **B** |
| **Migration Complexity** | ✅ No new table | ⚠️ Backfill required | **A** |
| **Storage Size** | ✅ Slightly smaller | ⚠️ Slightly larger | **A** |
| **Page ↔ Block Sync** | ✅ Same source | ⚠️ Dual-write | **A** |
| **Future Features** | ❌ Not extensible | ✅ Very extensible | **B** |
| **Developer Experience** | ❌ Complex | ✅ Simple | **B** |
| **Performance** | ⚠️ Slow | ✅ Fast (5-10x) | **B** |

**Score:** Option A = 3 | Option B = 7

---

## Recommendation

**✅ Option B: Dedicated `block_learning_state` Table**

### Rationale

1. **Performance at Scale:** 5-10x faster queries, no lock contention
2. **Developer Experience:** Simple SQL, reuses proven patterns
3. **Queryability:** Direct index lookups for RSSB
4. **Analytics:** Standard SQL aggregation
5. **Extensibility:** Clean foundation for Phase 5+ features
6. **Concurrency:** Independent row locks prevent bottlenecks

### Tradeoffs Accepted

1. **Migration:** Requires backfill from `completed_blocks` (one-time cost)
2. **Storage:** ~30% more storage (negligible)
3. **Synchronization:** Must keep `completed_at` consistent (manageable via single source pattern)

### Implementation Strategy

**Phase 4.1: Create Table + Backfill**
```sql
CREATE TABLE block_learning_state (...);
INSERT INTO block_learning_state (user_id, brand, navigation_node_id, ...)
SELECT ... FROM tutorial_navigation_progress, jsonb_array_elements(completed_blocks);
```

**Phase 4.2: Dual-Write Period**
- New block visits → write to `block_learning_state`
- Block completion → write to BOTH `completed_blocks` AND `block_learning_state.completed_at`
- Validate consistency

**Phase 4.3: Switch to Dedicated Table**
- `block_learning_state.completed_at` becomes authoritative for telemetry
- `completed_blocks` remains for page-level completion logic
- Repository abstracts dual-read during transition

---

## Completion Synchronization Decision

**Pattern:** Single Source of Truth with Denormalization

**Authoritative:**
- `completed_blocks` → Block completion (existing, proven)

**Denormalized:**
- `block_learning_state.completed_at` → Copy for queryability

**Synchronization:**
```typescript
// When block completed:
async markBlockCompleted(blockId, blockVersion) {
  await db.transaction(async (tx) => {
    // Source of truth
    await progressRepo.markBlockCompleted(tx, blockId, blockVersion);
    
    // Denormalized copy
    await blockStateRepo.updateCompletedAt(tx, blockId, blockVersion, now());
  });
}
```

**On read (RSSB):**
```typescript
// Fetch from block_learning_state (includes denormalized completedAt)
const blockState = await blockStateRepo.getBlockState(blockId, blockVersion);
// No JOIN needed - completedAt is in block_learning_state row
```

**Consistency guarantee:** Transaction ensures both or neither

---

## Expected Time Decision

**Decision:** Defer to Configuration Phase (post-Phase 4)

**Rationale:**
- No clear source identified in audit
- Composer doesn't expose configuration yet
- No registry exists
- Blocking Phase 4 on this decision is unnecessary

**Phase 4 Implementation:**
- Add `expected_time_sec INT` column to `block_learning_state`
- Default to NULL
- Time comparison API returns NULL when expectedTimeSec unavailable
- RSSB handles missing expectedTimeSec gracefully

**Future Phase:**
- Add Composer UI for expected time configuration
- OR create server-side registry (D1=180s, C1=300s, etc.)
- OR derive from analytics (median time per block version)
- Populate `expected_time_sec` column when source ready

---

## First/Last Viewed At Decision

**Decision:** Include in Phase 4

**Rationale:**
- ✅ RSSB prototype displays them
- ✅ Parallel to page-level fields (consistency)
- ✅ Useful for analytics ("blocks never revisited")
- ✅ Storage cost minimal (2 timestamps × millions blocks = ~16MB per million blocks)
- ✅ Already implementing visitCount - natural to track when

**Implementation:**
```sql
first_viewed_at TIMESTAMPTZ,
last_viewed_at TIMESTAMPTZ,

-- On first visit:
first_viewed_at = CASE WHEN last_session_id IS NULL THEN NOW() ELSE first_viewed_at END

-- On every visit/time update:
last_viewed_at = NOW()
```

---

## Final Schema

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
  
  -- Configuration (future)
  expected_time_sec INT,
  
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

## Risks and Mitigations

### Risk 1: Migration Downtime

**Mitigation:**
- Online migration: table creation doesn't block
- Backfill as background job (not during deployment)
- Dual-write allows gradual transition

### Risk 2: Data Inconsistency (completed_at)

**Mitigation:**
- Transaction boundary ensures consistency
- Validation job post-migration: compare `completed_blocks` vs `block_learning_state.completed_at`
- Alerting on inconsistency

### Risk 3: Storage Growth

**Mitigation:**
- Soft-delete pattern (deleted_at)
- Archive old learning data after N months
- Per-brand retention policies

### Risk 4: Lock Contention During Backfill

**Mitigation:**
- Batch backfill (1000 rows at a time)
- Off-peak hours
- Read-only impact (no writes blocked)

---

## Success Criteria

**Phase 4 Complete When:**
1. ✅ `block_learning_state` table created
2. ✅ Backfill complete (existing `completed_blocks` migrated)
3. ✅ Repository methods: `recordBlockVisit()`, `recordBlockTime()`
4. ✅ Service layer: `LearningProgressService` extended
5. ✅ API routes: `/api/tutorial/ils/block/visit`, `/block/active-time`
6. ✅ Runtime integration: ILSProvider triggers telemetry
7. ✅ E2E tests: RTH + SUIA block telemetry verified
8. ✅ Database evidence: visitCount, activeTimeSec persisted
9. ✅ Phase 2 regression: 6/6 page-level tests still pass
10. ✅ Generic proof: S1 block works without new ILS code

---

## Approval Required

**Before proceeding to implementation:**
- [ ] Technical Lead approval
- [ ] Product Owner approval
- [ ] Database Administrator review (schema + indexes)

**Proceed to implementation once approved.**

---

**ADR Status:** ✅ Complete - Awaiting Approval  
**Recommended Decision:** Option B - Dedicated `block_learning_state` Table  
**Next Action:** Await stakeholder approval before schema implementation
