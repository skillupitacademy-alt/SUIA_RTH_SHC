# ILS Phase 4 - Current Status

**Date:** 2026-09-05  
**Phase:** Block Learning State & Telemetry Foundation  
**Status:** Architecture Audit Complete - Awaiting Final Decisions

---

## Completed Work ✅

### STEP 1: Repository Audit
- ✅ Documented 12 repository methods
- ✅ Identified atomic SQL patterns
- ✅ Confirmed canonical block identity: `block.id + block.version`
- ✅ Verified no existing `block_learning_state` table

### STEP 2: Page ILS Patterns Audit
- ✅ Documented visit/revision/time semantics
- ✅ Identified reusable atomic patterns
- ✅ Mapped session-aware increment logic
- ✅ Confirmed independent page/block scopes

### STEP 3: Block Completion Flow Audit
- ✅ Traced complete flow: Composer → Runtime → API → Repository → DB
- ✅ Identified 7 integration points
- ✅ Mapped existing completion architecture
- ✅ Confirmed canonical block identity flows correctly

### STEP 4: ActiveBlockContext Lifecycle Audit
- ✅ Confirmed pure selection mechanism (DO NOT MODIFY)
- ✅ Documented enter/exit/visibility lifecycle
- ✅ Designed consumer-based telemetry pattern
- ✅ Verified generic support for ANY block type

### STEP 5: Storage Architecture ADR
- ✅ Evaluated JSONB extension vs dedicated table
- ✅ Scored criteria: Option B wins 7-3
- ✅ Documented tradeoffs and risks
- ✅ Proposed dedicated `block_learning_state` table

### STEP 6: Architecture Finalization
- ✅ 10 architectural assertions documented
- ✅ 8 technical review questions formulated
- ✅ Complete implementation contracts defined
- ✅ Approval gate checklist established

---

## Key Architectural Decisions

### Decision 2: expectedTimeSec Source ✅ FINALIZED

**Decision:** AI-generated block instance metadata

**Architecture:**
```
AI Content Model → generates expectedTimeSec
       ↓
Tutorial Composer → validates + persists
       ↓
Published Document → authoritative value
       ↓
ILS Runtime → measures actual vs expected
       ↓
RSSB → displays time comparison
```

**Responsibility Separation:**
- **AI:** Estimate based on generated content
- **Composer:** Validate + allow author review
- **Published Document:** Frozen authoritative value
- **ILS:** Measure actual time + compare (never guesses)
- **RSSB:** Display result

**Schema Impact:**
```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  expectedTimeSec?: number;  // NEW: AI-generated
}
```

**Rationale:**
- Two C1 blocks can have vastly different complexity
- AI knows the actual content it generated
- Block version registry ("C1 = 180s") insufficient
- Per-instance estimates more accurate

**Status:** ✅ CLOSED

---

## Remaining Decisions (Awaiting Approval)

### Decision 1: Storage Model ⏳

**Question:** JSONB extension vs dedicated `block_learning_state` table?

**ADR Recommendation:** Dedicated table (Option B)

**Key Advantages:**
- Better queryability (direct index lookups)
- No lock contention (independent row locks)
- Simple SQL (reuses proven patterns)
- Extensible for Phase 5+ features

**Considerations:**
- Migration complexity (backfill required)
- ~30% more storage
- Must synchronize `completed_at`

**Requires:** Explicit approval to proceed with dedicated table

---

### Decision 3: Completion Synchronization ⏳

**Question:** How to keep `completed_blocks` and `block_learning_state.completed_at` consistent?

**Options:**
- A: Dual-write (transactional)
- B: Single source (completed_blocks authoritative, JOIN on read)
- C: Single source (block_learning_state authoritative, breaking change)
- D: Denormalized copy (transaction sync)

**Recommended:** Option D (denormalized copy)
- `completed_blocks` remains authoritative
- `block_learning_state.completed_at` is denormalized for fast queries
- Transaction ensures consistency

**Requires:** Approval of synchronization pattern

---

### Decision 4: First/Last Viewed Timestamps ⏳

**Question:** Include `firstViewedAt` and `lastViewedAt`?

**Options:**
- A: Include both (parallels page-level ILS)
- B: Include only lastViewedAt
- C: Defer to Phase 5

**Recommended:** Option A (include both)
- RSSB prototype displays them
- Matches page-level pattern
- Useful for analytics
- Minimal storage cost

**Requires:** Confirmation of timestamp fields

---

### Decision 5: Page/Block Aggregation ⏳

**Question:** Relationship between `page.timeSpentActiveSec` and `SUM(block.activeTimeSec)`?

**Options:**
- A: Independent scopes (page ≥ sum of blocks)
- B: Blocks exhaustive (page = sum of blocks)

**Recommended:** Option A (independent)
- Page time includes intro, scrolling, between-blocks
- Block time = time when specific block active
- More accurate accounting

**Requires:** Confirmation of aggregation model

---

## Core Architectural Principles (Established)

### 1. Generic Block Telemetry
**Principle:** New block types require ZERO ILS code changes

**Contract:**
```html
<div 
  data-block-id="uuid" 
  data-block-type="summary" 
  data-block-version="S1"
>
  <!-- S1 content -->
</div>
```

**Result:**
- ✅ ActiveBlockContext identifies it
- ✅ ILS telemetry tracks it
- ✅ RSSB displays it
- ❌ NO new ILS code required

---

### 2. Canonical Block Identity
**Principle:** `block.id + block.version` is sufficient identity for ILS

**Identity Components:**
```typescript
{
  blockId: string,        // UUID - unique per instance
  blockVersion: string,   // e.g., "D1", "C1", "S1"
  blockType: string       // Metadata only (not part of identity)
}
```

**Scoped to Page:**
```
(userId, brand, navigationNodeId, blockId, blockVersion)
```

**Rationale:**
- Same block on different pages = separate telemetry
- Matches existing tutorial architecture
- Enables page-level aggregation

---

### 3. Separation of Concerns

**ActiveBlockContext (Phase 3):**
- ✅ Block selection/identification
- ❌ NO telemetry logic
- ❌ NO ILS API calls
- ❌ NO time tracking

**ILS Telemetry (Phase 4):**
- ✅ Consumer of ActiveBlockContext
- ✅ Triggers visit/time tracking
- ✅ Generic for all block types

**RSSB (Phase 5):**
- ✅ Consumer of ILS state
- ❌ NO learning state calculation
- ❌ NO time comparison calculation

---

### 4. Composer → Runtime → ILS Flow

```
Tutorial Composer
       ↓
   Creates canonical TutorialDocument
       ↓
   blocks[] with id + version + expectedTimeSec
       ↓
Tutorial Page Runtime
       ↓
   Renders blocks with DOM attributes
       ↓
ActiveBlockContext
       ↓
   Identifies active block (generic)
       ↓
ILS Telemetry
       ↓
   Records visits, time, revisions (generic)
       ↓
Block Learning State
       ↓
   Persists telemetry
       ↓
ILS API
       ↓
   Exposes state + time comparison
       ↓
ILSProvider
       ↓
   React context for RSSB
       ↓
RSSB
       ↓
   Displays learning state
```

**No manual "attach ILS" step required** - automatic via canonical identity

---

## Success Criteria (Phase 4 Complete)

### Primary Criterion: Generic Block Support

**Test:**
1. Add new block type "X1" to Composer
2. X1 renderer provides correct DOM attributes
3. Open tutorial page containing X1
4. Verify ILS automatically tracks X1

**Expected:**
- ❌ NO new code in: ActiveBlockContext, ILSProvider, APIs, Repository
- ✅ ONLY new code: X1 renderer component

**Proof:** S1, I1, O1 support without block-specific ILS implementation

---

### Other Acceptance Criteria

1. ✅ Block visit tracking (session-aware)
2. ✅ Block active time tracking (visibility-aware)
3. ✅ Block revision detection (completion + new session)
4. ✅ Time comparison calculation (when expectedTimeSec available)
5. ✅ RSSB data access (complete block state)
6. ✅ No breaking changes (Phase 2/3 tests passing)
7. ✅ Multi-brand support (RTH + SUIA independent)
8. ✅ Concurrent safety (no lost updates)
9. ✅ Migration success (data preserved)
10. ✅ Database evidence (telemetry persisted)

---

## Open Technical Questions

### Q1: Composer Integration
Does Composer need ILS-specific configuration when creating blocks?

**Answer:** NO - canonical block identity sufficient

---

### Q2: Anonymous User Support
Should block telemetry work for anonymous users?

**Recommendation:** YES - use client UUID (matches page-level)

---

### Q3: Soft Delete / Data Retention
What happens to block telemetry when page deleted?

**Options:**
- Cascade delete (foreign key)
- Soft delete (deleted_at)
- Archive to separate table

**Recommendation:** Soft delete (matches page-level pattern)

---

### Q4: Cross-Page Block Reuse
If same block.id appears on multiple pages, should telemetry be shared or separate?

**Recommendation:** SEPARATE (navigationNodeId is part of identity)

**Rationale:**
- Learning context differs per page
- Page-level aggregation requires block data for THAT page
- Matches existing architecture

---

### Q5: Performance Benchmarking
Should we benchmark JSONB vs dedicated table before implementation?

**Recommendation:** Qualitative advantages sufficient, proceed with dedicated table

**Rationale:**
- Queryability/concurrency benefits clear
- Phase 4 timeline prioritized
- Can benchmark in staging before production rollout

---

### Q6: Migration Risk Tolerance
How much risk acceptable for backfill migration?

**Recommendation:** Medium risk (online backfill, dual-write period, validation)

**Approach:**
1. Create table (no blocking)
2. Backfill as background job
3. Dual-write period (validate consistency)
4. Switch to dedicated table
5. Monitor for inconsistencies

---

### Q7: Analytics Requirements
What analytics queries should Phase 4 support?

**Recommendation:** Optimize for RSSB, defer advanced analytics to future phase

**Required Now:**
- Single block state fetch (RSSB)
- Page-level block aggregation
- Completion queries

**Future:**
- Cross-user analytics
- Cohort analysis
- Learning path optimization

---

### Q8: Soft Delete Strategy
Should block_learning_state use soft delete?

**Recommendation:** YES (consistency with page-level ILS)

**Tradeoffs:**
- ✅ Enables data recovery
- ✅ Matches existing pattern
- ⚠️ Complicates queries (WHERE deleted_at IS NULL)
- ⚠️ Table size grows indefinitely (needs archival strategy)

---

## Implementation Readiness

### Ready to Implement ✅
- Repository patterns (reuses page-level)
- Service layer extensions
- API routes (follows existing conventions)
- Runtime integration (consumer pattern)
- Time comparison calculation
- ILSProvider extension

### Requires Schema Decisions ⏳
- `block_learning_state` table structure (pending Decision 1)
- Completion sync pattern (pending Decision 3)
- Timestamp fields (pending Decision 4)

### Requires Composer Changes 🔄
- `BaseBlock.expectedTimeSec` schema addition
- AI prompt enhancement
- Validation UI for author review

---

## Next Steps

### Immediate (Awaiting Your Input)

1. **Review & Approve Decision 1** - Storage model (dedicated table recommended)
2. **Review & Approve Decision 3** - Completion sync (denormalized copy recommended)
3. **Review & Approve Decision 4** - Timestamps (include both recommended)
4. **Review & Approve Decision 5** - Aggregation (independent scopes recommended)
5. **Answer Open Questions** - Q1-Q8 (recommendations provided)

### After Approval

1. **Phase 4.1:** Create `block_learning_state` schema + migration
2. **Phase 4.2:** Implement repository layer
3. **Phase 4.3:** Implement service layer
4. **Phase 4.4:** Implement API routes
5. **Phase 4.5:** Implement runtime integration
6. **Phase 4.6:** Implement time comparison service
7. **Phase 4.7:** E2E certification (RTH + SUIA)
8. **Phase 4.8:** Documentation

### Future Phases

- **Phase 5:** RSSB (Right Sidebar ILS UI)
- **Phase 6+:** Advanced analytics, assessment attempts, adaptive learning

---

## Risk Summary

**Low Risk:**
- ✅ Repository/Service patterns proven
- ✅ Generic architecture well-designed
- ✅ Backward compatible schema changes

**Medium Risk:**
- ⚠️ Migration backfill (mitigated via online migration)
- ⚠️ Completion synchronization (mitigated via transaction)

**High Risk:**
- ❌ None identified (proper audit completed)

---

## Timeline Estimate (Post-Approval)

**Phase 4.1-4.6 Implementation:** 2-3 weeks  
**Phase 4.7 E2E Testing:** 1 week  
**Phase 4.8 Documentation:** 3-5 days  

**Total:** ~4 weeks from approval to Phase 4 complete

---

**Current Status:** 🟡 Awaiting Architectural Decisions  
**Blocker:** Decisions 1, 3, 4, 5 + Q1-Q8 answers  
**Ready to Implement:** Yes (once approved)  
**Risk Level:** Low-Medium  
**Confidence:** High (thorough audit completed)
