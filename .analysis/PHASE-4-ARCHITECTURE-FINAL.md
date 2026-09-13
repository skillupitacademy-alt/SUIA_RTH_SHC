# ILS Phase 4 - Standing Architectural Record

**Date:** 2026-09-05  
**Status:** 🔒 ARCHITECTURE FROZEN - IMPLEMENTATION READY  
**Phase:** Block Learning State & Telemetry Foundation

---

## Purpose

This document establishes the **frozen architectural decisions** for ILS Phase 4. These decisions are final and form the non-negotiable basis for implementation.

**Critical Distinction:** This separates frozen decisions from implementation details that must be verified against actual repository code.

---

## 🔒 Frozen Architectural Decisions

These decisions are **FINAL** and must be preserved in all implementations:

### Block Telemetry Storage
**Decision:** Dedicated `block_learning_state` table

**Rationale:** Telemetry ≠ Completion. Block learning state encompasses visits, revisions, active time, and comparisons - not just completion status. Separate table enables independent lifecycle, better queryability, and extensibility for future features.

---

### Block Identity
**Decision:** `block.id + block.version`, scoped to tutorial page/navigation context

**Database Identity:** `(userId, navigationNodeId, blockId, blockVersion)`

**Rationale:** 
- `blockId` = canonical block instance (UUID)
- `blockVersion` = content version (e.g., "D1", "C1", "S1")
- `blockType` = metadata only (NOT part of identity)
- `userId` = already brand/platform scoped via existing identity model
- `brand` = NOT a separate column (userId provides scope)
- Scoped to page: same block on different pages = separate telemetry

**Critical:** DO NOT create second identity system. Reuse canonical block identity from TutorialDocument.

---

### expectedTimeSec Source
**Decision:** 🔒 FROZEN - Instructional block capability (see: `.analysis/phase-4-expectedTimeSec-placement-decision.md`)

**`expectedTimeSec` is an optional authored metadata capability of instructional block schemas, NOT a universal block property.**

**Applies to:** D1, C1, S1, I1, O1 (learning-bearing blocks)  
**Does NOT apply to:** Structural/presentational blocks (2-column, timeline, card-grid, etc.)

**Schema Contract:**

Instructional block schemas explicitly include:
```typescript
{
  id: string,
  type: string,
  version: string,
  expectedTimeSec?: number,  // Optional: AI-proposed, Composer-validated
  content: { ... }
}
```

**TypeScript:** MAY use BaseBlock inheritance for convenience (if safe)  
**Zod:** MUST explicitly add to each instructional block schema

**Architectural Flow:**
```
AI Content Model
   ↓
Generates: block content + expectedTimeSec
   ↓
Tutorial Composer
   ↓
Validates + allows author review
   ↓
Published TutorialDocument (stores authoritative value)
   ↓
ILS Runtime
   ↓
Reads expectedTimeSec from published block
   ↓
Measures actual time, compares with expected
```

**Missing Expected Time:**
```
expectedTimeSec = null/undefined
   ↓
time comparison status = "unknown"
   ↓
ILS never invents the missing value
```

**Rationale:**
- AI knows the actual content it generated
- Two C1 blocks can have vastly different complexity/time
- Block version registry ("C1 = 180s") insufficient
- Per-instance estimates more accurate
- Repository has no universal BaseBlock - each schema implements convention

**Critical:** ILS never guesses or owns expected time. Only compares actual vs published expected.

---

### Runtime Authority
**Decision:** Published TutorialDocument is authoritative for expectedTimeSec

**NOT:** AI's ongoing opinion  
**NOT:** ILS-calculated estimate  
**NOT:** Registry default

**Rationale:** Once published, the expected time is frozen as part of that block version. Changes require republishing.

---

### Completion Synchronization
**Decision:** Transactional denormalized copy

**Pattern:**
- `tutorial_navigation_progress.completed_blocks` = authoritative source
- `block_learning_state.completed_at` = denormalized copy for queryability
- Transaction ensures both updated or neither

**Rationale:** Preserves existing completion architecture while enabling fast block state queries without JOINs.

---

### Timestamps
**Decision:** Include both `firstViewedAt` and `lastViewedAt`

**Rationale:**
- Parallels page-level ILS pattern
- Enables complete RSSB display
- Useful for analytics ("never revisited" blocks)
- Minimal storage cost

---

### Page vs Block Time Aggregation
**Decision:** Independent scopes - DO NOT reconcile

**Architectural Invariant:**
> **Page telemetry MUST NOT be calculated by summing block telemetry, and block telemetry MUST NOT be calculated by subtracting from page telemetry.**

**Rationale:**
- `page.timeSpentActiveSec` = independently measured page-level engagement
- `SUM(block.activeTimeSec)` = independently measured block-level engagement
- These are different measurement semantics, not reconcilable values
- Page time may include intro, scrolling, between-blocks, or other non-block time
- Block time only measures when specific block is active (via ActiveBlockContext)

**Example (Typical):**
- User spends 60s reading page intro (no active block)
- User spends 120s on D1 (block active)
- User spends 30s scrolling (no active block)
- User spends 180s on C1 (block active)

**Result:**
- `page.timeSpentActiveSec = 390s`
- `SUM(block.activeTimeSec) = 300s` (D1 + C1)

**Critical:** Do NOT attempt to force mathematical relationship. They are independent metrics.

---

### ActiveBlockContext Role
**Decision:** Pure selection mechanism - DO NOT MODIFY

**Phase 3 Responsibility:**
- ✅ Identify which block is active via IntersectionObserver
- ✅ Expose `{blockId, blockType, blockVersion}` via React context

**Phase 4 MUST NOT:**
- ❌ Add ILS API calls to ActiveBlockProvider
- ❌ Add time tracking logic to ActiveBlockContext
- ❌ Modify selection algorithm

**Rationale:** Separation of concerns. ActiveBlockContext = selection. ILSProvider = telemetry consumer.

---

### Generic ILS Implementation
**Decision:** NO block-type-specific telemetry code

**Architecture:**
```
Any TutorialBlock (D1, C1, S1, I1, O1, ...)
   ↓
Canonical block identity
   ↓
ActiveBlockContext (generic)
   ↓
ILS Telemetry (generic)
   ↓
block_learning_state
```

**Critical Acceptance Criterion:**
> Adding S1, I1, O1 tomorrow should require:
> - ✅ S1 renderer with correct DOM attributes
> - ❌ NO new ILS code

**Rationale:** 18 block types planned. ILS must work automatically for all via canonical identity, not type-specific implementations.

---

### Cross-Page Block Telemetry
**Decision:** Separate telemetry per navigation node

**Identity includes:** `navigationNodeId`

**Rationale:**
- Learning context differs per page
- Enables page-level aggregation
- Matches existing tutorial architecture (page = learning unit)

---

## 🔒 Core Architectural Principle

### The Three Relationships

**1. Composer establishes content relationship:**
```
Navigation Node
   ↓
Tutorial Page
   ↓
TutorialDocument
   ↓
blocks[] (with canonical identity)
```

**2. Runtime establishes learner relationship:**
```
Published Page
   ↓
Block DOM (data-block-id, data-block-type, data-block-version)
   ↓
ActiveBlockContext (identifies active block)
   ↓
Generic ILS telemetry (consumes active block)
```

**3. Database establishes learning-state relationship:**
```
(userId + navigationNodeId + blockId + blockVersion)
   ↓
block_learning_state
   ↓
visits, revisions, time, completion, ...
```

Note: `userId` already provides brand/platform scope. No separate `brand` column.

**Critical:** NO manual "attach ILS" step. Automatic via canonical identity.

---

## 🔒 Telemetry vs Completion Separation

### Existing: Block Completion
```
Block X → completed (boolean state)
```

Stored in: `tutorial_navigation_progress.completed_blocks`

### Phase 4: Block Learning Telemetry
```
Block X
 ├── visitCount
 ├── revisionCount
 ├── activeTimeSec
 ├── firstViewedAt
 ├── lastViewedAt
 ├── completedAt (denormalized)
 └── expectedTimeSec
```

Stored in: `block_learning_state` (dedicated table)

**Rationale:** Telemetry encompasses more than completion. Separate table enables richer state without overloading completion mechanism.

---

## 🔒 Complete Flow (Frozen)

```
AI Content Generation
   ↓
Generates: Block JSON + expectedTimeSec (estimates based on actual content)
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
ActiveBlockContext (Phase 3 - Pure Selection)
   ↓
Identifies active block generically
   ↓
Generic ILS Telemetry (Phase 4 - Consumer)
   ↓
Records visits, time, revisions automatically
   ↓
block_learning_state (persists learner state)
   ↓
ILS API (exposes state + time comparison)
   ↓
ILSProvider (React context)
   ↓
RSSB (Phase 5 - Presentation)
   ↓
Displays learning state
```

---

## ✅ Verified Facts (From Pre-Implementation Audit)

These are **confirmed facts** from the repository source verification:

### Source Verification Complete (2026-09-05)
All 10 checkpoints verified. See: `.analysis/phase-4-source-verification.md`

1. ✅ **TutorialDocument Schema:** `packages/types/src/tutorial-rich-document/schemas/document.schema.ts` + TypeScript interface
2. ✅ **BaseBlock Exists:** TypeScript interface with `{ id, presentation }` at `blocks/content-blocks.ts` (CORRECTED from earlier claim)
3. ✅ **D1/C1 Version Fields:** Both have `version: 'D1'|'C1'` in schema and interface
4. ✅ **DOM Attributes:** All renderers expose `data-block-id`, `data-block-type`, `data-block-version`
5. ✅ **ActiveBlockContext:** Pure selector providing `ActiveBlockIdentity`, no telemetry methods
6. ✅ **Composer Save Path:** `updateTutorialContent()` with atomic version increment, single UPDATE transaction
7. ✅ **Page-Level SQL:** `recordVisit()` uses atomic CASE for session transitions, `recordTime()` uses atomic accumulation
8. ✅ **Block Completion TX:** `markBlockCompleted()` single atomic UPDATE with JSONB deduplication
9. ✅ **ILS Authentication:** `validateRequest()` with `X-Internal-Secret + X-User-ID + X-Brand` headers
10. ✅ **User/Session Identity:** JWT family ID (authenticated) or client UUID (anonymous) in `lastSessionId`
11. ✅ **ILSProvider Structure:** Data context layer, exposes `ILSOverallProgress` + `ILSActiveBlockProgress`
12. ✅ **Session Ownership:** Only `recordVisit()` modifies `lastSessionId`, `visitCount`, `revisionCount`

### Verified Architectural Patterns

### Verified Architectural Patterns

**Atomic SQL Operations (Verified in source):**
```typescript
// Session-aware visit increment (tutorial-navigation-progress.repository.ts)
visitCount: sql`
  CASE 
    WHEN ${lastSessionId} IS DISTINCT FROM ${newSessionId}
    THEN ${visitCount} + 1
    ELSE ${visitCount}
  END
`

// Time accumulation (tutorial-navigation-progress.repository.ts)
timeSpentActiveSec: sql`${timeSpentActiveSec} + ${increment}`

// JSONB deduplication (tutorial-navigation-progress.repository.ts)
completedBlocks: sql`
  CASE
    WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(...))
    THEN ${completedBlocks}
    ELSE ${completedBlocks} || ${newRecord}::jsonb
  END
`
```

**Block Identity Structure (Verified in source):**
```typescript
// From packages/types/src/tutorial-rich-document/blocks/content-blocks.ts
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1Page;
}

interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
  content: CodeC1Page;
}
```

**Completion Record Structure (Verified in source):**
```typescript
// From tutorial-navigation-progress.repository.ts
interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string;
  completedAt: string; // ISO timestamp
}
```

**Authentication Pattern (Verified in source):**
```typescript
// All ILS routes use this pattern (apps/api-server/src/middleware/internal-auth.middleware.ts)
const authValidation = validateRequest(request, { requireInternalSecret: true });
if (authValidation.error) return authValidation.error;
const { userId, brand } = authValidation.context!;
```

---

**Previously Verified Facts:**
1. ✅ `ActiveBlockContext` exists and exposes `{blockId, blockType, blockVersion}`
2. ✅ Page-level ILS uses atomic SQL patterns (session-aware increments, CASE expressions)
3. ✅ `tutorial_navigation_progress` table exists with `completed_blocks` JSONB
4. ✅ Block completion flow: Composer → Runtime → API → Repository → DB
5. ✅ Existing completion uses `{blockId, blockVersion, completedAt}` structure
6. ✅ Repository has 12 methods including `recordVisit()`, `recordTime()`, `incrementRevision()`
7. ✅ Session-aware increment pattern: `CASE WHEN lastSessionId IS DISTINCT FROM newSessionId THEN count + 1 ELSE count END`
8. ✅ No `block_learning_state` table currently exists
9. ✅ TutorialDocument schema has `blocks[]` array
10. ✅ Phase 2 ILS certification: 6/6 tests passing

---

## ✅ Verified Implementation Facts

These are **confirmed facts** from pre-implementation source verification (2026-09-05):

### Schema Structure - CORRECTED

**VERIFIED:** `BaseBlock` interface DOES exist at `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`

```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

export interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1Page;
}

export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
  content: CodeC1Page;
}
```

**Key Findings:**
- ✅ TypeScript interfaces use inheritance (D1/C1 extend BaseBlock)
- ✅ Zod schemas are self-contained (no inheritance, explicit fields)
- ✅ Both patterns coexist: BaseBlock for TypeScript types, independent schemas for Zod validation
- ✅ D1 and C1 blocks inherit `id` and `presentation` from BaseBlock
- ✅ Each block schema must explicitly include all fields (Zod doesn't inherit)

**Implication for expectedTimeSec:**
- Could extend BaseBlock (affects TypeScript types for all blocks including structural)
- Must add explicitly to each Zod schema regardless
- **Recommendation:** Add to instructional block schemas only (D1, C1, S1, I1, O1) to keep learning metadata scoped

**Source Verification:** `.analysis/phase-4-source-verification.md` (Checkpoint 2)

---

## ⚠️ Implementation Cautions

These are **NOT verified facts** - must be validated during implementation:

---

### Performance Claims

**CAUTION:** Do NOT treat "5-10x faster" as established fact.

**Correct statement:** Dedicated table provides better queryability (direct index lookups vs JSONB array scans) and eliminates lock contention (independent row locks vs page-level lock).

**Verify with benchmarks** if performance is critical decision factor.

---

### Storage Size

**CAUTION:** Do NOT treat "~30% more storage" as established fact.

**Verify actual storage impact** based on real data volume and structure.

---

### Anonymous Users

**CAUTION:** Verify existing page-level ILS anonymous user handling before assuming block-level works identically.

**Implementation must:** Follow actual existing identity/session mechanism, not invent second model.

---

### Composer UI

**CAUTION:** Do NOT assume Composer already has author review UI for `expectedTimeSec`.

**Implementation must:** Determine if Composer changes required for validation/review workflow.

---

### All 18 Block Schemas

**CAUTION:** Do NOT assume all 18 planned blocks already have schemas.

**Implementation must:** Work with existing blocks (D1, C1), design generic pattern for future blocks.

---

## 🎯 Non-Negotiable Acceptance Criterion

### Generic Block Support Test

**Test:**
1. Add new block type "S1" to Composer
2. S1 renderer provides correct DOM attributes:
   ```html
   <div 
     data-block-id="uuid" 
     data-block-type="summary" 
     data-block-version="S1"
   >
     <!-- S1 content -->
   </div>
   ```
3. Open tutorial page containing S1
4. Verify ILS automatically tracks S1

**Expected Result:**
- ❌ NO new code in: ActiveBlockContext, ILSProvider, tutorialTrackingService, API routes, Service layer, Repository
- ✅ ONLY new code: S1 renderer component

**This proves the architecture is generic and extensible.**

---

## 📋 Implementation Checklist

### Before Schema Creation

**Pre-Implementation Source Verification:** ✅ COMPLETE
- [x] Verify exact TutorialDocument schema location
- [x] Verify exact D1/C1 block schema and version fields
- [x] Verify exact Composer save/publish path
- [x] Verify exact block DOM attributes from renderers
- [x] Verify exact ActiveBlockContext lifecycle
- [x] Verify exact page-level recordVisit()/recordTime() SQL
- [x] Verify exact markBlockCompleted() transaction
- [x] Verify exact ILS API authentication patterns
- [x] Verify exact user/session identity mechanism
- [x] Verify exact ILSProvider current structure

**expectedTimeSec Placement Decision:** 🔒 FROZEN
- [x] Decide TypeScript placement strategy
- [x] Decide Zod schema strategy
- [x] Verify instructional vs structural block distinction
- [x] Document C1 conversion boundary handling
- [x] Confirm generic ILS principle preserved

**Purpose:** Prevent implementing against assumptions; ensure Phase 4.1 works with actual repository structure.

---

### Phase Sequence

**✅ Phase 4.0:** Pre-Implementation Source Verification - **COMPLETE**
- Verified all 10 checkpoints against actual repository code
- Confirmed BaseBlock exists (corrected standing record)
- Documented atomic SQL patterns, authentication flow, block structure
- Result: Implementation facts aligned with frozen architecture

**⏭️ Next:**
1. **Phase 4.1:** Schema + Migration
2. **Phase 4.2:** Repository Layer
3. **Phase 4.3:** Service Layer
4. **Phase 4.4:** API Layer
5. **Phase 4.5:** Runtime Integration
6. **Phase 4.6:** Time Comparison
7. **Phase 4.7:** E2E Certification (D1/C1)
8. **Phase 4.8:** Generic Block Certification (S1 or test block)
9. **Phase 4.9:** Documentation + Freeze

---

### Hard Constraints

**MUST DO:**
1. ✅ Reuse atomic SQL patterns from page-level ILS
2. ✅ Follow existing API authentication patterns
3. ✅ Consumer-based telemetry (ILSProvider consumes ActiveBlockContext)
4. ✅ Generic implementation (works for ANY block type)
5. ✅ Transaction-safe completion sync
6. ✅ Validate against actual repository before implementing
7. ✅ Prove generic support with test/mock block
8. ✅ Database evidence for all claims

**MUST NOT DO:**
1. ❌ Modify ActiveBlockContext selection logic
2. ❌ Add ILS API calls inside ActiveBlockProvider
3. ❌ Create block-type-specific telemetry
4. ❌ Let ILS guess or own expectedTimeSec
5. ❌ Calculate time comparison in ILSProvider or RSSB
6. ❌ Break Phase 2/3 regression tests
7. ❌ Create second identity/session mechanism
8. ❌ Store learner state in immutable TutorialDocument

---

## 📊 Success Criteria

### Primary Criterion
✅ **Add S1 to Composer → ILS automatically tracks S1 → NO new ILS code written**

### Secondary Criteria
1. ✅ Block visit tracking (session-aware)
2. ✅ Block active time tracking (visibility-aware)
3. ✅ Block revision detection
4. ✅ Time comparison (when expectedTimeSec available)
5. ✅ RSSB data access (complete block state)
6. ✅ Phase 2/3 regression (all tests passing)
7. ✅ Multi-brand support
8. ✅ Concurrent safety
9. ✅ Migration success
10. ✅ Database evidence

---

## 🏛️ Standing Architectural Mental Model

```
Navigation Node
      ↓
Tutorial Composer
      ↓
   Creates TutorialDocument
      ↓
   blocks[] with:
    - block.id (canonical instance)
    - block.version (content version)
    - expectedTimeSec (AI-generated)
      ↓
   Published Document (frozen)
      ↓
Tutorial Page Runtime
      ↓
   Renders blocks with DOM attributes
      ↓
ActiveBlockContext
      ↓
   Identifies active block (generic)
      ↓
Generic ILS Telemetry
      ↓
   Records visits, time, revisions
      ↓
block_learning_state
      ↓
   Persists learner state
      ↓
ILS API
      ↓
   Exposes state + time comparison
      ↓
ILSProvider
      ↓
   React context
      ↓
RSSB
      ↓
   Displays learning state
```

---

## 🔐 Architectural Invariant

**The most important principle:**

> **Composer establishes the block's identity and authored metadata. Runtime identifies the active block generically. ILS records actual learner behavior. RSSB consumes the resulting state.**

**Critical corollary:**

> **Adding S1/I1/O1 tomorrow requires adding the block itself and its renderer/schema - NOT writing another ILS implementation.**

---

**This is the authoritative architectural record for ILS Phase 4. All decisions are frozen. Implementation must verify actual repository structure before proceeding, but architectural principles are non-negotiable.**

---

**Status:** 🔒 FROZEN  
**Authority:** Standing Architectural Record  
**Compliance:** Required for all Phase 4 implementations  
**Last Updated:** 2026-09-05


---

## 📋 Current Phase Status

```
PHASE 4 PROGRESS
│
├── Steps 1–6 Audit ................. ✅ COMPLETE
├── Architecture decisions .......... 🔒 FROZEN
├── expectedTimeSec ownership ....... 🔒 FROZEN
├── Storage decision ................ 🔒 FROZEN
├── Completion strategy ............. 🔒 FROZEN
├── Timestamp strategy .............. 🔒 FROZEN
├── Aggregation strategy ............ 🔒 FROZEN
├── Source verification ............. ✅ COMPLETE (10/10 checkpoints)
│
└── Implementation (Phase 4.1-4.9) .. 📅 READY TO BEGIN
```

**What Remains:**
- Phase 4.1: Schema + Migration
- Phase 4.2-4.9: Implementation sequence

**What Is Complete:**
- ✅ All architectural decisions frozen
- ✅ Pre-implementation source verification (10/10)
- ✅ BaseBlock existence confirmed and documented
- ✅ Core principles and constraints established
- ✅ Success criteria defined
- ✅ Generic block support requirement validated

---

## 🔐 Final Architectural Summary Table

| Area | Frozen Decision |
|------|-----------------|
| **Storage** | Dedicated `block_learning_state` table |
| **DB Identity** | `(userId, navigationNodeId, blockId, blockVersion)` |
| **Brand Column** | NO - userId already provides brand scope |
| **Expected Time Source** | AI-generated per instructional block instance |
| **Expected Time Authority** | Published TutorialDocument |
| **Missing Expected Time** | Nullable → comparison status = "unknown" |
| **Schema Convention** | Each instructional block MAY include `expectedTimeSec?` |
| **BaseBlock Type** | ✅ EXISTS - TypeScript interface with `{ id, presentation }` (CORRECTED) |
| **Block Inheritance** | TypeScript interfaces extend BaseBlock; Zod schemas independent |
| **Completion Source** | `completed_blocks` remains authoritative |
| **Completion Telemetry** | Transactional denormalized `completedAt` |
| **Timestamps** | `firstViewedAt` + `lastViewedAt` |
| **Page/Block Time** | Independent scopes - DO NOT reconcile |
| **Time Aggregation Rule** | Page ≠ calculated from blocks, blocks ≠ calculated from page |
| **ActiveBlockContext** | Selection only - DO NOT MODIFY |
| **ILS Role** | Generic consumer of ActiveBlockContext |
| **Block-Specific ILS** | NONE - generic implementation only |
| **Cross-Page Blocks** | Separate telemetry per navigationNodeId |
| **Identity Mechanism** | Reuse existing user/session - NO second mechanism |
| **Soft Delete** | Yes - `deletedAt` following existing pattern |
| **Future Blocks** | Renderer/schema only - NO new ILS implementation |

---

**Record Status:** 🔒 FROZEN - SOURCE VERIFIED  
**Authority:** Standing Architectural Foundation for Phase 4  
**Compliance:** Required for all implementations  
**Verification:** Complete (10/10 checkpoints - see `.analysis/phase-4-source-verification.md`)  
**Next Action:** Phase 4.1 - Schema + Migration  
**Last Updated:** 2026-09-05 (BaseBlock correction applied, source verification complete)
