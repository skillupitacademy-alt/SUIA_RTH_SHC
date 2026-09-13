# ILS Phase 4 - STEP 6: Architecture Finalization

**Date:** 2026-09-05  
**Status:** AWAITING DECISIONS  
**Phase:** Phase 4 - Block Learning State & Telemetry Foundation

---

## Purpose

Finalize the architectural decisions required before Phase 4 implementation begins.

**Audit Complete:** Steps 1-5 have established what exists, what's needed, and evaluated storage options.

**Now Required:** Explicit decisions on open architectural questions.

---

## Core Architectural Principle (Established)

```
Tutorial Composer
       ↓
   Creates page with blocks
       ↓
Tutorial Document (canonical)
       ↓
   block.id + block.version (instance identity)
       ↓
Tutorial Page Runtime
       ↓
ActiveBlockContext (identifies active block)
       ↓
Generic ILS Telemetry (works for ANY block type)
       ↓
   Page Learning State + Block Learning State
       ↓
ILS API
       ↓
ILSProvider
       ↓
RSSB
```

**Key Requirement:**
> Adding S1, I1, O1, or future blocks to Composer should NOT require new ILS code.

---

## Decision 1: Storage Model

**Question:** Where should block telemetry be stored?

**Options Evaluated (ADR):**
- **Option A:** Extend `completed_blocks` JSONB
- **Option B:** Dedicated `block_learning_state` table

**ADR Recommendation:** Option B (wins 7-3 on criteria)

**Advantages:**
- **Better queryability:** Direct index lookups vs JSONB array scans (exact performance gain to be benchmarked)
- **No lock contention:** Independent row locks vs page-level lock for all block updates
- **Simple SQL:** Reuses proven atomic patterns from page-level ILS
- **Extensible for Phase 5+:** Clean foundation for attempts, interactions, analytics
- **Separation of concerns:** Telemetry (visits, time) distinct from completion state

**Tradeoffs:**
- Migration complexity (backfill required)
- 30% more storage
- Must synchronize `completed_at`

### ✅ DECISION REQUIRED:

**[ ] Approve Option B** - Proceed with dedicated table  
**[ ] Choose Option A** - Use JSONB extension instead  
**[ ] Request alternative** - Propose different approach

**Decision By:** _______________  
**Rationale:** _______________

---

## Decision 2: Expected Time Source

**Question:** Where does `expectedTimeSec` originate?

**Current State:**
- ❌ NOT in TutorialDocument schema
- ❌ NOT in database
- ❌ NOT in Composer UI
- ❌ NO registry exists
- ⚠️ RSSB prototype shows time comparison

**Options:**

### Option 2A: Composer Content Metadata
```typescript
// TutorialDocument
{
  blocks: [
    {
      id: "block-uuid",
      type: "definition",
      version: "D1",
      expectedTimeSec: 180,  // Author configures
      content: { ... }
    }
  ]
}
```

**Pros:**
- Author controls per-instance
- Different D1 blocks can have different times
- Stored with content

**Cons:**
- Couples content with learning expectations
- Composer must expose configuration UI
- Requires TutorialDocument schema change
- Migration for existing blocks

---

### Option 2B: Block Version Registry
```typescript
// Server-side config
export const BLOCK_EXPECTED_TIMES: Record<string, number> = {
  'D1': 180,  // All D1 blocks: 3 minutes
  'C1': 300,  // All C1 blocks: 5 minutes
  'S1': 120,  // All S1 blocks: 2 minutes
};
```

**Pros:**
- Simple, centralized
- Uniform per block version
- No content schema changes
- Easy to adjust globally

**Cons:**
- Cannot vary per instance
- Server configuration not author-controlled
- Hard-coded values

---

### Option 2C: Database Configuration
```sql
CREATE TABLE block_expected_times (
  block_version TEXT PRIMARY KEY,
  expected_time_sec INT NOT NULL,
  brand brand_type
);
```

**Pros:**
- Configurable per brand
- Can vary by deployment
- No code changes to adjust

**Cons:**
- Requires admin UI
- Another configuration table
- Not version-controlled

---

### Option 2D: Analytics-Derived
```sql
-- Calculate median actual time per block version
SELECT block_version, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY active_time_sec)
FROM block_learning_state
WHERE completed_at IS NOT NULL
GROUP BY block_version;
```

**Pros:**
- Data-driven
- Automatically adjusts
- Reflects real learner behavior

**Cons:**
- Requires significant data before reliable
- New block versions have no baseline
- May perpetuate existing issues

---

### Option 2E: Defer Decision
- Implement telemetry WITHOUT expected time
- Add `expected_time_sec INT` column (NULL allowed)
- Time comparison returns NULL when unavailable
- RSSB handles missing expectedTimeSec gracefully
- Decide source in future phase when Composer requirements clear

**Pros:**
- Unblocks Phase 4 implementation
- Allows experimentation with different sources
- Doesn't commit to wrong model

**Cons:**
- **Time comparison incomplete** - RSSB prototype shows this feature
- **RSSB shows partial data** - May not meet Phase 5 requirements
- **Decision postponed, not resolved** - Will need to be addressed eventually

**Critical Question:**
> If RSSB time comparison is a Phase 5 requirement, deferring this decision means Phase 4 delivers incomplete foundation for Phase 5. Is that acceptable?

---

### ✅ DECISION MADE: Option 2A - AI-Generated Block Instance Metadata

**Decision:** `expectedTimeSec` is **AI-generated authoring metadata** with Composer-controlled persistence and publication authority.

**Architecture:**
```
AI Content Generation Model
       ↓
   Receives: navigationNodeId, subtopic, block type/version,
             learning objective, content requirements,
             interaction complexity
       ↓
   Generates: Block JSON + expectedTimeSec
       ↓
Tutorial Composer
       ↓
   Validates + Persists + Allows Author Review
       ↓
Published TutorialDocument
       ↓
   Authoritative Value (frozen in published version)
       ↓
ILS Runtime
       ↓
   Records: actual activeTimeSec
   Compares: actual vs expected
       ↓
RSSB
       ↓
   Displays: time comparison
```

**Responsibility Separation:**

| Layer | Responsibility |
|-------|---------------|
| **AI** | Estimate/propose based on generated content |
| **Composer** | Validate + persist + allow author review |
| **Published Document** | Authoritative value |
| **ILS** | Measure actual time + compare (never guesses) |
| **RSSB** | Consume/display |

**Rationale:**
1. **AI knows the content** - Can estimate based on actual generated text, code examples, complexity
2. **Block instances vary** - Two C1 blocks can have vastly different complexity/time
3. **Version registry insufficient** - "C1 = 180s" ignores content variation
4. **Composer validates** - Author can review AI estimate before publication
5. **ILS remains generic** - Never needs to guess or own expected time

**Schema Integration:**
```typescript
// Existing BaseBlock structure
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

// PHASE 4 ADDITION:
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  expectedTimeSec?: number;  // AI-generated, optional for backward compat
}
```

**AI Generation Prompt Enhancement:**
```
Generate block content including estimation of expected learner completion time.

Consider:
- Reading time (actual text/code volume)
- Code inspection complexity
- Example comprehension
- Interaction requirements
- Block type instructional complexity

Return estimation in seconds as `expectedTimeSec` field.
Do not estimate based solely on word count.
```

**Decision By:** Technical Lead + Product Owner  
**Date:** 2026-09-05

---

## Decision 3: Completion Synchronization

**Question:** How do `completed_blocks` and `block_learning_state.completed_at` stay consistent?

**Challenge:**
- `completed_blocks` JSONB: existing, proven, used for page-level completion
- `block_learning_state.completed_at`: new, needed for block telemetry queries

**Options:**

### Option 3A: Dual-Write (Transactional)
```typescript
await db.transaction(async (tx) => {
  // Write to both
  await progressRepo.markBlockCompleted(tx, ...);
  await blockStateRepo.updateCompletedAt(tx, ...);
});
```

**Pros:**
- Strongly consistent
- Both sources updated atomically

**Cons:**
- Transaction overhead
- Two writes per completion

---

### Option 3B: Single Source (completed_blocks authoritative)
```typescript
// block_learning_state.completed_at derived on read
SELECT 
  bls.*,
  (SELECT block->>'completedAt' 
   FROM jsonb_array_elements(tnp.completed_blocks) block
   WHERE block->>'blockId' = bls.block_id 
     AND block->>'blockVersion' = bls.block_version
  ) AS completed_at
FROM block_learning_state bls
JOIN tutorial_navigation_progress tnp ...
```

**Pros:**
- No synchronization complexity
- Single source of truth

**Cons:**
- JOIN on every read
- More complex queries
- Performance hit

---

### Option 3C: Single Source (block_learning_state authoritative)
```typescript
// block_learning_state.completed_at is truth
// completed_blocks stores only {blockId, blockVersion} (no completedAt)
// Page completion logic queries block_learning_state
```

**Pros:**
- Clean separation
- No duplication

**Cons:**
- Breaking change
- Must migrate existing completed_blocks
- Page completion logic must change

---

### Option 3D: Denormalized Copy
```typescript
// completed_blocks remains authoritative for completion
// block_learning_state.completed_at is denormalized copy for queryability
// Updated via transaction when block completed
await db.transaction(async (tx) => {
  const completedAt = await progressRepo.markBlockCompleted(tx, ...);
  await blockStateRepo.syncCompletedAt(tx, blockId, version, completedAt);
});
```

**Pros:**
- Clear ownership (completed_blocks = source)
- Fast queries (no JOIN)
- Existing logic unchanged

**Cons:**
- Denormalization maintenance
- Transaction required

---

### ✅ DECISION REQUIRED:

**[ ] Option 3A** - Dual-write transactional  
**[ ] Option 3B** - completed_blocks authoritative, JOIN on read  
**[ ] Option 3C** - block_learning_state authoritative (breaking change)  
**[ ] Option 3D** - Denormalized copy (transaction sync)  

**Decision By:** _______________  
**Rationale:** _______________

**Recommended:** Option 3D (denormalized) - Preserves existing architecture, enables fast queries

---

## Decision 4: First/Last Viewed At Timestamps

**Question:** Should block telemetry include `firstViewedAt` and `lastViewedAt`?

**Evidence FOR:**
- RSSB prototype displays them
- Parallel to page-level ILS fields
- Useful for analytics ("never revisited blocks")
- Storage cost minimal (~16MB per million blocks)

**Evidence AGAINST:**
- Not required for current calculations
- No immediate use case beyond display
- Adds complexity to every update

**Options:**

### Option 4A: Include Both Timestamps
```sql
first_viewed_at TIMESTAMPTZ,
last_viewed_at TIMESTAMPTZ,
```

**Update Logic:**
```sql
first_viewed_at = CASE WHEN last_session_id IS NULL THEN NOW() ELSE first_viewed_at END,
last_viewed_at = NOW()
```

---

### Option 4B: Include Only Last Viewed
```sql
last_viewed_at TIMESTAMPTZ,
```

**Rationale:** "Last viewed" sufficient for staleness checks

---

### Option 4C: Defer Both
- Omit from Phase 4
- Add later if RSSB Phase 5 requires

---

### ✅ DECISION REQUIRED:

**[ ] Option 4A** - Include both timestamps  
**[ ] Option 4B** - Include only lastViewedAt  
**[ ] Option 4C** - Defer to Phase 5  

**Decision By:** _______________  
**Rationale:** _______________

**Recommended:** Option 4A (include both) - Matches page-level pattern, enables complete RSSB

---

## Decision 5: Page ↔ Block Aggregation

**Question:** What is the relationship between page activeTime and block activeTime?

**Critical Question:**
```
page.timeSpentActiveSec === SUM(block.activeTimeSec) ?
```

**Options:**

### Option 5A: Independent Scopes
```
page.timeSpentActiveSec = total time on page (including scrolling, reading intro, etc.)
SUM(block.activeTimeSec) = time actively engaged with specific blocks
```

**Relationship:** `page.timeSpentActiveSec >= SUM(block.activeTimeSec)`

**Example:**
- User spends 60s reading page intro (no block active)
- User spends 120s on D1 (block active)
- User spends 30s scrolling between blocks (no block active)
- User spends 180s on C1 (block active)

**Result:**
- `page.timeSpentActiveSec = 390s`
- `SUM(block.activeTimeSec) = 300s` (D1 + C1)

---

### Option 5B: Blocks Are Exhaustive
```
page.timeSpentActiveSec === SUM(block.activeTimeSec)
```

**Assumption:** A block is ALWAYS active when page is visible

**Challenge:** Doesn't account for:
- Page intro/outro content
- Time between blocks
- Scrolling without block in viewport

---

### ✅ DECISION REQUIRED:

**[ ] Option 5A** - Independent scopes (page ≠ sum of blocks)  
**[ ] Option 5B** - Blocks exhaustive (page = sum of blocks)  

**Decision By:** _______________  
**Rationale:** _______________

**Recommended:** Option 5A (independent) - More accurate, accounts for non-block time

---

## Phase 4 Implementation Contract

### Hard Acceptance Criteria

**Phase 4 is complete when ALL of these are true:**

#### 1. Generic Block Support
```typescript
// Test: Add new block type "X1" to Composer
// Expected: ILS automatically tracks X1 WITHOUT new ILS code

// NO new code in:
- ActiveBlockContext
- ILSProvider
- tutorialTrackingService
- API routes
- Service layer
- Repository

// ONLY required:
- X1 renderer with correct DOM attributes:
  data-block-id, data-block-type, data-block-version
```

#### 2. Block Telemetry Persistence
```sql
-- For any block (D1, C1, S1, I1, O1, future):
SELECT 
  visit_count,
  revision_count,
  active_time_sec,
  first_viewed_at,
  last_viewed_at,
  completed_at
FROM block_learning_state
WHERE block_id = ? AND block_version = ?;

-- Returns accurate data
```

#### 3. Session-Aware Visits
```typescript
// Same sessionId, multiple page reloads
visitCount = 1  // Does NOT increment

// New sessionId
visitCount = 2  // Increments atomically
```

#### 4. Revision Detection
```typescript
// Block not completed, new session
revisionCount = 0  // Does NOT increment

// Block completed, new session
revisionCount = 1  // Increments
```

#### 5. Active Time Accuracy
```typescript
// User active on D1 for 60s
// User switches to C1
// D1 activeTimeSec += 60s (flushed)
// C1 activeTimeSec starts from 0

// User tabs away (page hidden)
// Timer pauses
// activeTimeSec does NOT increase while hidden
```

#### 6. RSSB Data Access
```typescript
// ILSProvider exposes:
const { activeBlock, activeBlockProgress } = useILS();

// activeBlockProgress contains:
{
  blockId,
  blockVersion,
  visitCount,
  revisionCount,
  activeTimeSec,
  firstViewedAt,
  lastViewedAt,
  completedAt,
  expectedTimeSec,  // May be null
  timeComparison: {
    differenceSec,
    percentageOfExpected,
    status: 'under' | 'on-track' | 'over'
  }
}
```

#### 7. No Breaking Changes
```typescript
// Phase 2 page-level ILS tests: 6/6 passing
// Phase 3 ActiveBlockContext tests: 19/19 passing
// Existing block completion: continues working
```

#### 8. Multi-Brand Support
```typescript
// RTH D1 telemetry
// SUIA D1 telemetry
// Independent, brand-scoped correctly
```

#### 9. Concurrent Safety
```typescript
// User scrolls rapidly through 5 blocks
// All block visits recorded correctly
// No lost updates
// No duplicate visits
```

#### 10. Migration Success
```typescript
// Existing completed_blocks data preserved
// Backfill to block_learning_state complete
// No data loss
// Consistency validated
```

---

## Implementation Sequence (Once Approved)

### Phase 4.1: Schema & Migration
1. Create `block_learning_state` table (if Decision 1 = Option B)
2. Create indexes
3. Backfill existing `completed_blocks` data
4. Validate data consistency

### Phase 4.2: Repository Layer
1. `TutorialBlockLearningStateRepository` (new)
2. Methods: `recordVisit()`, `recordTime()`, `getBlockState()`
3. Reuse atomic SQL patterns from page-level
4. Unit tests

### Phase 4.3: Service Layer
1. Extend `LearningProgressService`
2. Methods: `recordBlockVisit()`, `recordBlockActiveTime()`
3. Validation logic
4. Unit tests

### Phase 4.4: API Layer
1. BFF routes: `/api/tutorial/ils/block/visit`, `/block/active-time`
2. API Server routes: same paths
3. Authentication via existing patterns
4. Integration tests

### Phase 4.5: Runtime Integration
1. Create `ActiveBlockTimeTracker` module
2. Extend `ILSProvider` to consume `activeBlock`
3. Trigger visit/time events
4. Handle visibility changes
5. Integration tests

### Phase 4.6: Time Comparison Service
1. Calculate `differenceSec`, `percentageOfExpected`, `status`
2. Handle missing `expectedTimeSec`
3. Single authoritative calculation
4. Unit tests

### Phase 4.7: E2E Certification
1. RTH: Block telemetry E2E tests
2. SUIA: Block telemetry E2E tests
3. Database evidence verification
4. Phase 2/3 regression tests
5. Generic block test (S1 or mock block)

### Phase 4.8: Documentation
1. API documentation
2. Integration guide for future blocks
3. Analytics query examples
4. Migration runbook

---

## Open Questions Requiring Answers

### Q1: Composer Integration Requirements
**When Composer creates a new tutorial page, does it need to:**
- Pre-create `block_learning_state` rows? (No - created on first visit)
- Configure `expectedTimeSec`? (Depends on Decision 2)
- Register blocks in any ILS index? (No - automatic via canonical identity)

**Answer:** _______________

---

### Q2: Anonymous User Support
**Should block telemetry work for anonymous users?**
- Yes: Use client-generated UUID as userId (like page-level)
- No: Require authentication

**Current State:** Page-level ILS supports anonymous (via session UUID)

**Answer:** _______________

---

### Q3: Soft-Delete / Data Retention
**When a tutorial page is deleted, what happens to block telemetry?**
- Cascade delete (foreign key)
- Soft delete (deleted_at)
- Archive to separate table
- Retain indefinitely for analytics

**Answer:** _______________

---

### Q4: Cross-Page Block Instances
**If the same block.id appears on multiple pages (reused), should telemetry:**
- Be per (page + block) - separate state per page
- Be per block globally - shared state across pages

**Current Page-Level Pattern:** `(userId, brand, navigationNodeId)`  
**Proposed Block Pattern:** `(userId, brand, navigationNodeId, blockId, blockVersion)`

**This implies:** Per-page scope - same block.id on different pages = separate telemetry

**Rationale:**
- Block learning context is page-specific
- "Visit" means "visited THIS block on THIS page"
- Supports page-level aggregation (sum block times for this page)
- Matches existing tutorial architecture (page = learning unit)

**Confirm this is correct:** _______________

---

## Risk Assessment

### Risk 1: Generic Implementation Fails
**Scenario:** New block type added, ILS doesn't work automatically

**Mitigation:**
- Hard acceptance criterion #1 validates this
- Test with mock/future block type before declaring complete

---

### Risk 2: Performance Degradation
**Scenario:** Block telemetry APIs slow down page load/interaction

**Mitigation:**
- Fire-and-forget API calls (async, no await)
- Failure isolation (telemetry failure doesn't break UI)
- Monitoring on API latency

---

### Risk 3: Data Inconsistency
**Scenario:** `completed_blocks` and `block_learning_state` drift out of sync

**Mitigation:**
- Transaction boundaries (Decision 3)
- Validation queries post-migration
- Monitoring/alerts on inconsistency

---

### Risk 4: Migration Complexity
**Scenario:** Backfill fails or causes downtime

**Mitigation:**
- Online migration (no downtime)
- Batched backfill (1000 rows at a time)
- Off-peak execution
- Rollback plan

---

## Success Definition

**Phase 4 succeeds when:**

1. ✅ Tomorrow you add S1 to Composer
2. ✅ S1 appears on tutorial page with correct DOM attributes
3. ✅ ILS automatically tracks S1 visits, time, completion
4. ✅ RSSB displays S1 learning state
5. ✅ NO new ILS code was written for S1

**This proves the architecture is generic and extensible.**

---

## Approval Checklist

Before proceeding to implementation:

- [ ] **Decision 1:** Storage model chosen
- [ ] **Decision 2:** Expected time source chosen (or deferred)
- [ ] **Decision 3:** Completion synchronization pattern chosen
- [ ] **Decision 4:** Timestamp fields decided
- [ ] **Decision 5:** Page/block aggregation relationship clarified
- [ ] **Open Questions:** Q1-Q4 answered
- [ ] **Acceptance Criteria:** Reviewed and approved
- [ ] **Risk Mitigation:** Strategies accepted
- [ ] **Technical Lead:** Approved
- [ ] **Product Owner:** Approved
- [ ] **DBA:** Schema reviewed (if applicable)

---

**STEP 6 Status:** ✅ Complete - Awaiting Decisions  
**Next Action:** Stakeholder review and decision approval  
**Once Approved:** Proceed to Phase 4.1 (Schema & Migration)


---

## Critical Architectural Assertions (Review Required)

Before approving implementation, verify these architectural principles are correct:

### Assertion 1: Canonical Block Identity
**Claim:** `block.id + block.version` is sufficient block identity for ILS

**Evidence:**
- ✅ Composer generates unique `block.id` (UUID) per instance
- ✅ `block.version` distinguishes D1 vs D2 of same block
- ✅ ActiveBlockContext exposes `{blockId, blockType, blockVersion}`
- ✅ Existing `completed_blocks` uses `{blockId, blockVersion, completedAt}`

**Verify:**
- [ ] Is `block.id` truly unique per block instance?
- [ ] Can same `block.id` appear on multiple pages? (Affects identity scope)
- [ ] Does `blockType` participate in identity? (Currently NO - only metadata)

---

### Assertion 2: Telemetry ≠ Completion
**Claim:** Block completion and block telemetry are separate concerns

**Evidence:**
- Completion = binary state (done/not done)
- Telemetry = ongoing learning behavior (visits, time, revisions)
- Completion happens once; telemetry accumulates continuously
- Different query patterns (completion = eligibility check; telemetry = analytics/RSSB)

**Verify:**
- [ ] Should `completed_at` exist in BOTH places? (Denormalization)
- [ ] Is completion the ONLY authoritative source from `completed_blocks`?
- [ ] Can telemetry exist without completion? (Yes - visited but not completed)

---

### Assertion 3: Generic Telemetry Contract
**Claim:** New block types require ZERO ILS code if they follow the contract

**Contract:**
```html
<!-- Block renderer MUST provide: -->
<div 
  data-block-id="uuid" 
  data-block-type="summary" 
  data-block-version="S1"
>
  <!-- Block content -->
</div>
```

**Then automatically:**
- ActiveBlockContext identifies it
- ILS telemetry tracks it
- RSSB displays it

**Verify:**
- [ ] Is this contract complete? (Any missing attributes?)
- [ ] Does block completion follow same pattern?
- [ ] Are there block-type-specific telemetry needs we haven't identified?

---

### Assertion 4: Page ↔ Block Relationship
**Claim:** Block telemetry is scoped to (page + block), not global block

**Identity:** `(userId, brand, navigationNodeId, blockId, blockVersion)`

**Example:**
- D1 block "What is Java?" appears on Page A
- Same D1 block "What is Java?" appears on Page B (reused content)
- **Two separate telemetry records** (different navigationNodeId)

**Rationale:**
- Learning context differs per page
- Page-level aggregation needs block-level data for THAT page
- Matches existing tutorial architecture

**Verify:**
- [ ] Is block reuse across pages actually possible?
- [ ] If yes, should telemetry be shared or separate?
- [ ] Does this match Composer's content model?

---

### Assertion 5: RSSB Data Flow
**Claim:** RSSB consumes ILS state, does NOT calculate it

**Architecture:**
```
ILS Repository (source of truth)
       ↓
ILS Service (business logic)
       ↓
ILS API (data access)
       ↓
ILSProvider (React context)
       ↓
RSSB (presentation)
```

**RSSB should NOT:**
- ❌ Calculate visitCount
- ❌ Calculate activeTimeSec
- ❌ Calculate timeComparison
- ❌ Determine revision status

**ILS should provide:**
- ✅ Complete block learning state
- ✅ Derived metrics (time comparison)
- ✅ Single source of truth

**Verify:**
- [ ] Does RSSB need any calculations ILS doesn't provide?
- [ ] Are there display-only derived values RSSB can calculate? (e.g., formatting)
- [ ] Is ILSProvider the correct boundary between ILS and RSSB?

---

### Assertion 6: Time Comparison Calculation
**Claim:** Time comparison should be calculated in ONE authoritative location

**Options:**
- A: Service layer (LearningProgressService.getBlockState())
- B: ILSProvider (React context)
- C: RSSB component
- D: Database (computed column/view)

**Recommendation:** Option A (Service layer)

**Rationale:**
- Consistent calculation across all consumers
- Testable business logic
- API returns complete state (no client-side calculation)
- Works for non-React consumers (analytics, reports)

**Verify:**
- [ ] Is service layer the correct boundary?
- [ ] Should calculation be cached/denormalized?
- [ ] What happens when expectedTimeSec is NULL?

---

### Assertion 7: Active Time Semantics
**Claim:** activeTimeSec tracks time when block is ACTIVE (via ActiveBlockContext)

**Definition:**
- Active = block is current activeBlock (viewport anchor zone)
- Paused when page hidden (visibilitychange)
- Flushed when block changes
- Accumulated over multiple visits

**NOT:**
- ❌ Total time on page
- ❌ Time since first view
- ❌ Time until completion

**Verify:**
- [ ] Is "active in viewport" the correct semantic?
- [ ] Should it account for tab-away time?
- [ ] How does this relate to page.timeSpentActiveSec?

---

### Assertion 8: Visit Semantics
**Claim:** visitCount increments when entering block in NEW session

**Session Transition:**
```sql
CASE 
  WHEN lastSessionId IS DISTINCT FROM newSessionId 
  THEN visitCount + 1 
  ELSE visitCount 
END
```

**Scenarios:**
- Same session, reload page → NO increment
- Same session, scroll to block again → NO increment
- New session, scroll to block → INCREMENT

**Verify:**
- [ ] Is session boundary correct? (JWT family ID / client UUID)
- [ ] Should rapid enter/exit/re-enter count as multiple visits?
- [ ] Does this match page-level visit semantics?

---

### Assertion 9: Revision Semantics
**Claim:** revisionCount increments when returning to COMPLETED block in new session

**Logic:**
```sql
CASE 
  WHEN lastSessionId IS DISTINCT FROM newSessionId 
    AND completedAt IS NOT NULL
  THEN revisionCount + 1 
  ELSE revisionCount 
END
```

**Scenarios:**
- Visit incomplete block, new session → NO revision
- Visit completed block, same session → NO revision
- Visit completed block, new session → REVISION

**Verify:**
- [ ] Is this the desired learning semantic?
- [ ] Should uncompleting a block reset revisionCount?
- [ ] Does this parallel page-level revision behavior?

---

### Assertion 10: Composer Integration
**Claim:** Composer does NOT need ILS-specific configuration when creating blocks

**Current Composer Responsibility:**
- Create TutorialDocument with blocks[]
- Assign unique block.id per instance
- Set block.type and block.version
- Publish content

**NOT Required:**
- ❌ Pre-create block_learning_state rows
- ❌ Register blocks in ILS index
- ❌ Configure ILS tracking

**Verify:**
- [ ] Is this accurate to Composer's architecture?
- [ ] Are there Composer features that DO require ILS awareness?
- [ ] Does expectedTimeSec (if Composer-authored) change this?

---

## Questions Requiring Technical Lead Review

### Q5: Performance Benchmarking
**Should we benchmark JSONB vs dedicated table before committing to dedicated table?**

**Approach:**
- Create test dataset (1M users × 5 pages × 5 blocks = 25M block states)
- Measure:
  - Single block fetch (RSSB use case)
  - Concurrent block updates (scrolling use case)
  - Aggregation queries (analytics use case)
- Compare actual performance, not theoretical

**Decision:**
- [ ] Yes - benchmark first, then decide
- [ ] No - qualitative advantages sufficient, proceed with dedicated table

---

### Q6: Migration Risk Tolerance
**How much risk is acceptable for the backfill migration?**

**Scenarios:**
- Low risk: Backfill during maintenance window, validate before enabling
- Medium risk: Online backfill, dual-write period, gradual rollout
- High risk: Direct cutover, assume data consistency

**Decision:**
- [ ] Low risk approach (extended timeline)
- [ ] Medium risk approach (dual-write complexity)
- [ ] High risk approach (fastest implementation)

---

### Q7: Analytics Requirements
**What analytics queries should Phase 4 support?**

**Examples:**
- Average time per block version
- Blocks with highest revision rates
- Completion rate by block type
- Learning path analysis
- Cohort performance comparison

**Decision:**
- [ ] Define analytics requirements now (influences schema design)
- [ ] Defer analytics to future phase (optimize for RSSB only)

---

### Q8: Soft Delete Strategy
**Should block_learning_state use soft delete (deleted_at)?**

**Considerations:**
- Matches page-level pattern (tutorial_navigation_progress has deleted_at)
- Enables data recovery
- Complicates queries (WHERE deleted_at IS NULL everywhere)
- Grows table size indefinitely

**Decision:**
- [ ] Yes - soft delete (consistency with page-level)
- [ ] No - hard delete (simpler queries, smaller table)
- [ ] Hybrid - soft delete with periodic hard-delete archival

---

## Final Architecture Contract (Pre-Approval)

This is the architectural contract Phase 4 implementation must satisfy:

### Block Identity Contract
```typescript
interface BlockIdentity {
  blockId: string;        // UUID - unique per instance
  blockVersion: string;   // e.g., "D1", "C1", "S1"
  blockType: string;      // Metadata only (not part of ILS identity)
}
```

### Block Learning State Contract
```typescript
interface BlockLearningState {
  // Identity
  userId: string;
  brand: string;
  navigationNodeId: string;
  subtopicId: string;
  blockId: string;
  blockVersion: string;
  
  // Telemetry
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  
  // Timestamps
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;  // Synced with completed_blocks
  
  // Session
  lastSessionId: string | null;
  
  // Configuration (future)
  expectedTimeSec: number | null;
}
```

### Block Telemetry API Contract
```typescript
// Record visit (session-aware)
POST /api/tutorial/ils/block/visit
{
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string  // REQUIRED
}

// Record active time
POST /api/tutorial/ils/block/active-time
{
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  activeTimeSec: number  // Increment to add
}

// Fetch block state (RSSB)
GET /api/tutorial/ils/block-state?navigationNodeId=...&blockId=...&blockVersion=...
Response: BlockLearningState + TimeComparison
```

### Time Comparison Contract
```typescript
interface TimeComparison {
  activeTimeSec: number;
  expectedTimeSec: number | null;
  differenceSec: number | null;        // actual - expected
  percentageOfExpected: number | null; // (actual / expected) * 100
  status: 'under' | 'on-track' | 'over' | 'unknown';
}

// Calculated by: LearningProgressService (single source of truth)
// Consumed by: ILSProvider → RSSB
// NULL values when expectedTimeSec unavailable
```

### Generic Block Support Contract
```typescript
// Phase 4 SUCCESS CRITERIA:
// When Composer adds new block type "X1":

// 1. Renderer provides DOM contract:
<div 
  data-block-id={block.id}
  data-block-type={block.type}
  data-block-version={block.version}
>
  {/* X1 content */}
</div>

// 2. Zero ILS code changes required
// 3. Telemetry works automatically
// 4. RSSB displays X1 state

// PROVE THIS with mock/test block before Phase 4 completion
```

---

## Approval Gate Checklist

Phase 4 implementation CANNOT proceed until:

### Technical Decisions
- [ ] **Storage model:** JSONB vs dedicated table (with rationale)
- [ ] **Expected time source:** Decided or explicitly deferred with Phase 5 impact acknowledged
- [ ] **Completion sync:** Pattern chosen and validated against existing architecture
- [ ] **Timestamps:** Include both, lastViewedAt only, or defer
- [ ] **Page/block aggregation:** Independent scopes vs exhaustive (with examples)

### Architectural Assertions
- [ ] **All 10 assertions reviewed** by technical lead
- [ ] **Conflicts identified** and resolved
- [ ] **Composer integration** validated against Composer's actual architecture
- [ ] **RSSB requirements** confirmed with Phase 5 owner

### Open Questions
- [ ] **Q1-Q8 answered** with explicit decisions or acknowledged risks
- [ ] **Cross-page block reuse** behavior confirmed
- [ ] **Anonymous user support** decided
- [ ] **Soft delete strategy** chosen

### Risk Assessment
- [ ] **Migration approach** selected (low/medium/high risk)
- [ ] **Performance assumptions** validated or accepted as hypothesis
- [ ] **Data consistency strategy** approved
- [ ] **Rollback plan** documented

### Success Criteria
- [ ] **Generic block test plan** defined
- [ ] **Acceptance criteria** reviewed and approved
- [ ] **Phase 2/3 regression** strategy confirmed

---

**STEP 6 Status:** ✅ REVISED - Ready for Architectural Review  
**Next Action:** Technical Lead & Product Owner review and approval  
**Timeline:** Implementation begins ONLY after approval received


---

## Schema Implementation Plan for expectedTimeSec

### Current Block Structure (Verified)

```typescript
// packages/types/src/tutorial-rich-document/blocks/content-blocks.ts
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

// All blocks extend BaseBlock:
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: { ... };
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: { ... };
}

// etc.
```

### Phase 4 Schema Addition

**Add to BaseBlock:**
```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  expectedTimeSec?: number;  // PHASE 4: AI-generated time estimate
}
```

**Backward Compatibility:**
- ✅ Optional field (`?`) - existing blocks without it remain valid
- ✅ No migration needed - blocks can gradually adopt
- ✅ `TutorialDocumentSchema` validates normally

**Zod Schema Update:**
```typescript
// packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts
const BaseBlockSchema = z.object({
  id: z.string().uuid(),
  presentation: PresentationConfigSchema.optional(),
  expectedTimeSec: z.number().int().positive().optional(),  // NEW
});
```

**Validation Rules:**
- Must be positive integer
- Reasonable bounds: 10s - 3600s (10 seconds to 1 hour)
- AI prompt should explain if value exceeds typical ranges

---

## AI Integration Requirements

### Content Generation Prompt Template

**Add to AI block generation prompts:**
```
EXPECTED TIME ESTIMATION:
After generating block content, estimate the expected time for a learner to:
- Read and comprehend the text
- Inspect and understand code examples
- View diagrams/visuals
- Complete any required interactions

Consider:
1. Actual content volume (not just word count)
2. Code complexity and examples
3. Conceptual difficulty
4. Block type instructional pattern
5. Expected learner actions

Return as integer seconds in `expectedTimeSec` field.

Typical ranges by block complexity:
- Simple concept (1-2 paragraphs, 1 example): 60-120s
- Medium concept (3-5 paragraphs, 2-3 examples): 120-240s
- Complex concept (detailed explanation, multiple code examples, diagram): 240-480s
- Code interaction block: 180-360s (reading + experimentation)

If your content falls outside typical ranges, ensure it's justified by actual content complexity.
```

### AI Response Format

```json
{
  "id": "block-uuid",
  "type": "code",
  "version": "C1",
  "expectedTimeSec": 240,
  "content": {
    "language": "python",
    "code": "...",
    "explanation": "...",
    "examples": [...]
  }
}
```

**Optional Enhancement (Future):**
```json
{
  "expectedTimeSec": 240,
  "expectedTimeRationale": "Complex exception-handling concept with 3 code examples, exception flow diagram, and common mistake examples. Requires code inspection and comprehension of error propagation patterns."
}
```

Rationale could be stored in Composer metadata for author review, not exposed to learners.

---

## Composer Workflow Integration

### Author Experience

**When AI generates block:**
1. AI proposes `expectedTimeSec`
2. Composer displays: **"Estimated learning time: 4 minutes"**
3. Author can:
   - Accept (most common)
   - Override (if estimate seems wrong)
   - Leave blank (falls back to null, time comparison unavailable)

**Validation:**
- Warn if `expectedTimeSec < 10` or `> 3600`
- Highlight blocks without estimates
- Show aggregate page expected time

### Draft Regeneration

**When author requests block regeneration:**
- AI generates new `expectedTimeSec` based on new content
- Composer highlights if estimate changed significantly (>50% change)

---

## ILS Integration (Phase 4 Implementation)

### Repository Layer

**Block state includes expected time:**
```typescript
interface BlockLearningState {
  // ... other fields
  expectedTimeSec: number | null;  // From published block
}
```

**On first visit:**
```sql
INSERT INTO block_learning_state (
  ...,
  expected_time_sec
)
SELECT
  ...,
  (SELECT block->>'expectedTimeSec'::int 
   FROM jsonb_array_elements(blocks) block
   WHERE block->>'id' = $blockId)
FROM published_tutorial_document;
```

**Handles missing value:**
- Block without `expectedTimeSec` → `expected_time_sec = NULL`
- Time comparison returns `status: 'unknown'`

---

### Time Comparison Service

**Service Layer (LearningProgressService):**
```typescript
interface TimeComparison {
  activeTimeSec: number;
  expectedTimeSec: number | null;
  differenceSec: number | null;
  percentageOfExpected: number | null;
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
      status: 'unknown',
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
    status = 'over';  // Taking longer than expected
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

**Single source of truth** - All consumers (ILSProvider, RSSB, analytics) use this.

---

### RSSB Display

**ILSProvider exposes:**
```typescript
const { activeBlock, activeBlockProgress } = useILS();

// activeBlockProgress includes:
{
  ...,
  timeComparison: {
    activeTimeSec: 245,
    expectedTimeSec: 180,
    differenceSec: 65,
    percentageOfExpected: 136,
    status: 'over'
  }
}
```

**RSSB displays:**
```
Time Spent: 4m 5s
Expected: 3m 0s
Status: Taking longer (+1m 5s, 136%)
```

**When expectedTimeSec missing:**
```
Time Spent: 4m 5s
Expected: Not available
```

---

## Migration Strategy

### Existing Blocks

**Phase 4.1: Schema Update**
- Add `expectedTimeSec?: number` to BaseBlock
- Deploy schema changes
- Existing blocks remain valid (optional field)

**Phase 4.2: Gradual Adoption**
- New AI-generated blocks include `expectedTimeSec`
- Existing blocks: `expectedTimeSec = null`
- Time comparison works for new blocks, shows "unknown" for old blocks

**Phase 4.3: Backfill (Optional, Future)**
- Run AI estimation on existing blocks
- Store results in Composer
- Republish tutorials with estimates
- No ILS database migration needed (values flow from published documents)

---

## Validation & Quality Control

### Composer Validation

```typescript
function validateExpectedTimeSec(
  blockType: string,
  contentLength: number,
  expectedTimeSec: number
): ValidationResult {
  // Hard bounds
  if (expectedTimeSec < 10 || expectedTimeSec > 3600) {
    return {
      valid: false,
      error: 'Expected time must be between 10s and 3600s (1 hour)'
    };
  }
  
  // Soft warnings (author can override)
  const warnings: string[] = [];
  
  // Very short content with long estimate
  if (contentLength < 100 && expectedTimeSec > 120) {
    warnings.push('Short content with long estimate - verify complexity');
  }
  
  // Very long content with short estimate
  if (contentLength > 1000 && expectedTimeSec < 120) {
    warnings.push('Long content with short estimate - verify estimate');
  }
  
  return { valid: true, warnings };
}
```

### Analytics Monitoring

**Track estimate accuracy (Phase 5+):**
```sql
-- Blocks where learners consistently exceed expected time
SELECT 
  block_version,
  AVG(active_time_sec) as avg_actual,
  AVG(expected_time_sec) as avg_expected,
  AVG(active_time_sec) / AVG(expected_time_sec) as ratio
FROM block_learning_state
WHERE completed_at IS NOT NULL
  AND expected_time_sec IS NOT NULL
GROUP BY block_version
HAVING AVG(active_time_sec) / AVG(expected_time_sec) > 1.5
ORDER BY ratio DESC;
```

Use to improve AI estimation model over time.

---

## Decision Summary: expectedTimeSec

**✅ DECIDED:**
- AI generates `expectedTimeSec` as block instance metadata
- Stored in TutorialDocument.blocks[].expectedTimeSec
- Composer validates and allows author review
- Published blocks freeze the value
- ILS measures actual time and compares
- Missing values handled gracefully (status: 'unknown')

**Schema Impact:** Minimal (optional field on BaseBlock)  
**Migration Impact:** None (gradual adoption)  
**Composer Impact:** AI prompt enhancement + validation UI  
**ILS Impact:** Extends existing time tracking with comparison  
**RSSB Impact:** Displays time comparison when available

**This decision closes the Phase 4 "expected time source" architectural question.**

---

**Status:** Decision 2 ✅ Complete  
**Remaining Decisions:** 1 (storage), 3 (completion sync), 4 (timestamps), 5 (aggregation)
