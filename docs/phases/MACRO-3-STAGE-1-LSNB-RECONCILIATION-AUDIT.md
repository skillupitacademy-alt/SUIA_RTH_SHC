# MACRO 3 STAGE 1 — LSNB RECONCILIATION AUDIT

**Date:** 2026-09-11  
**Status:** AUDIT COMPLETE - Implementation Reconciliation Required  
**Gate:** Macro 3 Universal LSNB Enhancement  
**Stage:** Stage 1 (Reconciliation Audit - No Code Changes)

---

## Executive Summary

**Finding:** The codebase has **partial LSNB** functionality but lacks the universal enhancement specified in Macro 3. Current architecture shows clear separation between ILS (data), LSNB (navigation state), and future RSSB (revision recommendations).

**Key Insight:** ILS data layer is **complete and ready** (Gate 3C.1R verified). LSNB visual component **exists** but only consumes completion status, not learning performance metrics.

**Critical Blocker:** No R/Y/G (Red/Yellow/Green) threshold contract exists. Cannot implement performance indicators without approved thresholds.

---

## ILS Foundation - Verified Tests (Gate 3C.1R Phase D-2)

### Test Suite Results

All ILS foundation tests **PASSED** before Macro 3 audit:

#### 1. UI TypeScript Verification
```bash
cd packages/ui
pnpm type-check
```
**Result:** ✅ PASS (No TypeScript errors)

#### 2. Provider Integration Tests (4/4 PASS)
```bash
cd packages/ui
pnpm vitest run src/tutorial/runtime/__tests__/d2-provider.integration.test.tsx
```

**Tests Verified:**
- ✅ **F2:** Same-block in-flight accumulation (30s → +10s during delivery)
- ✅ **F3:** Retry with identical eventId on network failure
- ✅ **F3:** alreadyProcessed acknowledgement (no spurious retry)
- ✅ **F4:** 1250-second time splitting (600 + 600 + 50 with distinct eventIds)

**Evidence:**
```
Test Files  1 passed (1)
Tests       4 passed (4)
Duration    4.23s
```

#### 3. Production Helper Tests (22/22 PASS)
```bash
cd packages/ui
pnpm vitest run src/tutorial/runtime/__tests__/d2-production-verification.test.ts
```

**Tests Verified:**
- Event ID stability (UUID v4)
- Delivery event creation
- Time splitting logic (600-second boundary)
- Queue management
- In-flight accumulation
- Retry semantics

**Evidence:**
```
Test Files  1 passed (1)
Tests       22 passed (22)
Duration    2.25s
```

#### 4. Phase 4.3 Regression Tests (19/19 PASS)
```bash
cd packages/db-tutorial
pnpm vitest run src/services/__tests__/learning-progress-phase-4.3.test.ts
```

**Tests Verified:**
- Session-aware visit tracking
- Revision counting
- Block learning state lifecycle
- Identity isolation
- Telemetry accumulation

**Evidence:**
```
Test Files  1 passed (1)
Tests       19 passed (19)
Duration    3.45s
```

#### 5. Backend D2 Integration Tests (11/11 PASS)
```bash
cd packages/db-tutorial
pnpm vitest run src/__tests__/d2-idempotent-delivery.integration.test.ts
```

**Tests Verified:**
- D2-1: First event processes once
- D2-2: Sequential duplicate idempotent
- D2-3: Payload conflict rejected
- D2-4: Different events accumulate
- D2-5: Real PostgreSQL rollback proven
- D2-6: Concurrent duplicate handling proven
- D2-7: Identity isolation verified
- D2-8: Block isolation verified
- D2-9: Soft-delete replay idempotent
- D2-10: 600-second boundary enforced
- D2-11: Zero-second event persisted

**Evidence:**
```
Test Files  1 passed (1)
Tests       11 passed (11)
Duration    16.24s
```

### ILS Foundation Status

**Gate 3C.1R Phase D-2:** ✅ **Implementation Verification GREEN**

All ILS infrastructure tests passed:
- Frontend provider integration: 4/4
- Production helpers: 22/22
- Phase 4.3 regression: 19/19
- Backend D2 integration: 11/11
- TypeScript compilation: PASS

**Total:** 56/56 tests PASS

---

## 1. Current LSNB Implementation

### Component Location
- **File:** `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`
- **Type:** Client-side React component
- **Purpose:** Tutorial navigation sidebar with progress tracking

### Current Functionality

✅ **Working Features:**
- Visual navigation tree rendering
- Hierarchical topic/lesson structure (unlimited depth)
- Expand/collapse navigation nodes
- Active page highlighting
- Progress bar with percentage display
- Status badges (completed, in-progress, not-started)
- Responsive layout
- Accessibility (ARIA labels, keyboard navigation)

### Current Status Calculation

```typescript
function getEffectiveStatus(
  node: TutorialNavigationNode,
  activeUrl?: string,
  completedUrls?: Set<string>
): TutorialNodeStatus {
  // Returns: 'completed' | 'in-progress' | 'not-started'
  
  if (isNodeCompleted(node, completedUrls)) {
    return 'completed';
  }

  const isCurrentLesson = Boolean(node.url && node.url === activeUrl);
  const containsCurrentIncompleteLesson = hasActiveIncompleteChild(node, activeUrl, completedUrls);

  if (isCurrentLesson || containsCurrentIncompleteLesson) {
    return 'in-progress';
  }

  return 'not-started';
}
```

**Logic:**
1. Node is explicitly completed OR its URL is in `completedUrls` → `'completed'`
2. Node is currently active OR contains active incomplete child → `'in-progress'`
3. Otherwise → `'not-started'`

### Visual Indicators

**Current Status Badges:**
- 🟢 **Green checkmark (✓)** = Completed
- 🔵 **Blue hollow circle** = In progress (active)
- ⚪ **Gray hollow circle** = Not started

**Progress Bar:**
- Percentage-based (0-100%)
- Color: Brand primary color
- Location: Below subject header, above navigation tree

### Type Definitions

```typescript
// packages/types/src/tutorial-sidebar.types.ts
type TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started';

interface TutorialNavigationNode {
  id: string;
  name: string;
  type?: 'group' | 'page';
  description?: string;
  icon?: string;
  expanded?: boolean;
  slug?: string;
  status?: TutorialNodeStatus;  // Optional - computed if missing
  url?: string;
  children?: TutorialNavigationNode[];
}
```

---

## 2. Current Data Flow

### Architecture

```
TutorialPageShell (Client Component)
        ↓
  ┌─────┴────────┐
  ↓              ↓
ILSProvider   ActiveBlockContext
  ↓              ↓
[Data Layer]  [Current Block]
  ↓
GET /api/tutorial/ils/navigation/:nodeId?subtopicId=...
  ↓
NavigationProgressResponse {
  status: LearningState
  progressPercentage: number
  completedBlocks: CompletedBlockRecord[]
  blocks: BlockLearningStateResponse[]  // Gate 3C.1R: Per-block telemetry
  timeSpentActiveSec: number
  visitCount: number
  revisionCount: number
  firstViewedAt: string | null
  lastViewedAt: string | null
  completedAt: string | null
}
  ↓
TutorialLeftSidebar {
  tree: TutorialNavigationTree
  activeUrl: string
  completedUrls: Set<string>  // Derived from completedBlocks
  onNavigate: (url, node) => void
}
```

### Data Sources

**ILSProvider Inputs:**
- `navigationNodeId` (from page context)
- `subtopicId` (from hierarchy)
- `sectionId` (optional)

**ILSProvider Outputs:**
```typescript
interface ILSContextValue {
  // Navigation context
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  
  // Progress data
  overallProgress: ILSOverallProgress | null;
  activeBlockProgress: ILSActiveBlockProgress | null;
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
}
```

**LSNB Currently Consumes:**
- ✅ `completedUrls: Set<string>` (which blocks/pages are complete)
- ✅ `tree.progress.percentage: number` (overall completion %)
- ✅ `activeUrl: string` (current page for highlighting)

**LSNB Does NOT Consume:**
- ❌ `expectedTimeSec` vs `activeTimeSec` comparison
- ❌ `visitCount` / `revisionCount` per block
- ❌ Block-level telemetry metrics
- ❌ Any R/Y/G performance indicators

---

## 3. ILS Data Available (Gate 3C.1R)

### ILSProvider API (via useILS() hook)

**Overall Progress (Page-Level):**
```typescript
interface ILSOverallProgress {
  status: LearningState;              // 'not_started' | 'in_progress' | 'completed' | 'not_available'
  progressPercentage: number;          // 0-100
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;                  // Page-level visits
  revisionCount: number;               // Page-level revisions
  timeSpentActiveSec: number;          // Total active time on page
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}
```

**Active Block Progress (Block-Level):**
```typescript
interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;                   // 'D1', 'C1', etc.
  blockVersion: string;
  isCompleted: boolean;
  completedAt: Date | null;
  
  // Gate 3C.1R: Block-level telemetry metrics (AVAILABLE but not consumed by LSNB)
  visitCount: number;                  // Block-specific visits
  revisionCount: number;               // Block-specific revisions
  activeTimeSec: number;               // Actual time spent on block
  expectedTimeSec: number | null;      // Authored expected time (nullable)
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
}
```

### Database Schema (block_learning_state)

```sql
-- packages/db-tutorial/src/schema/block-learning-state.ts
CREATE TABLE block_learning_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity (universal block identity)
  user_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,
  block_id TEXT NOT NULL,              -- UUID stored as text
  block_version TEXT NOT NULL,         -- 'D1', 'C1', 'S1', etc.
  
  -- Telemetry Counters
  visit_count INTEGER NOT NULL DEFAULT 0,
  revision_count INTEGER NOT NULL DEFAULT 0,
  active_time_sec INTEGER NOT NULL DEFAULT 0,
  
  -- Session Tracking (Phase 4.6)
  last_session_id TEXT,
  
  -- Expected Time (authored metadata)
  expected_time_sec INTEGER,           -- NULLABLE - may not exist for all blocks
  
  -- Timestamps
  first_viewed_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,              -- Denormalized from completed_blocks
  
  -- Audit
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Unique constraint (partial - active records only)
  CONSTRAINT uq_block_learning_state_identity 
    UNIQUE (user_id, navigation_node_id, block_id, block_version)
    WHERE deleted_at IS NULL
);
```

### Critical Finding

**ILS ALREADY PROVIDES** all data needed for R/Y/G calculation:
- ✅ `activeTimeSec` (actual time spent)
- ✅ `expectedTimeSec` (authored expected time)
- ✅ Per-block metrics available
- ✅ Universal block identity (works for all block types)

**But LSNB DOES NOT CONSUME** this telemetry data yet.

---

## 4. R/Y/G Status - NOT FOUND

### Search Results

**Searched for:**
- `RED` / `YELLOW` / `GREEN` constants
- `TutorialNodeStatus = 'red' | 'yellow' | 'green'`
- R/Y/G threshold definitions
- Performance status types
- Learning quality indicators

**Found:**
- ❌ **NONE** - No R/Y/G implementation exists

### Current Status Types

**TutorialNodeStatus (LSNB):**
```typescript
type TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started';
```

**LearningState (ILS):**
```typescript
type LearningState = 'not_started' | 'in_progress' | 'completed' | 'not_available';
```

**Both represent:** COMPLETION LIFECYCLE  
**NOT:** Learning performance/quality

### What This Means

Current status indicators answer:
- ✅ "Is this lesson completed?"
- ✅ "Is this lesson in progress?"
- ✅ "Has the learner started this lesson?"

R/Y/G would answer:
- ❓ "Is the learner struggling with this material?" (RED)
- ❓ "Is the learner on track?" (YELLOW)
- ❓ "Is the learner ahead of expectations?" (GREEN)

**This distinction is critical for Macro 3 design decisions.**

---

## 5. Time Comparison Logic EXISTS (But Not Used by LSNB)

### Location
`packages/db-tutorial/src/services/learning-progress.service.ts`

### Function

```typescript
/**
 * Calculate block time comparison
 * 
 * COMPARISON ROLE:
 * - Service compares actual vs expected time
 * - Just returns raw comparison data
 * 
 * EXPECTED TIME SOURCE:
 * - Must come from published tutorial document
 * - Service does NOT calculate or invent this value
 * - Future phase will resolve from canonical content
 * 
 * NULL SEMANTICS:
 * - expectedTimeSec = null → ratio = null (no comparison possible)
 * - activeTimeSec = 0 → ratio = 0 (no time spent yet)
 */
calculateBlockTimeComparison(blockState: BlockLearningState): {
  actualTimeSec: number;
  expectedTimeSec: number | null;
  differenceTimeSec: number | null;         // actual - expected
  ratioActualToExpected: number | null;     // actual / expected
}
```

### Implementation

```typescript
const actualTimeSec = blockState.activeTimeSec;
const expectedTimeSec = blockState.expectedTimeSec;

// Null-safe calculations
if (expectedTimeSec === null) {
  return {
    actualTimeSec,
    expectedTimeSec: null,
    differenceTimeSec: null,
    ratioActualToExpected: null,
  };
}

const differenceTimeSec = actualTimeSec - expectedTimeSec;
const ratioActualToExpected = expectedTimeSec > 0 
  ? actualTimeSec / expectedTimeSec 
  : 0;

return {
  actualTimeSec,
  expectedTimeSec,
  differenceTimeSec,
  ratioActualToExpected,
};
```

### Current Status

- ✅ Function exists in service layer
- ✅ Handles null-safe comparison
- ✅ Returns ratio for threshold evaluation
- ❌ NOT exposed via ILSProvider
- ❌ NOT consumed by LSNB
- ❌ NO thresholds defined for R/Y/G mapping

### Example Ratio Interpretation (Hypothetical)

```typescript
// EXAMPLE ONLY - NOT APPROVED THRESHOLDS
ratio = 0.5  // Took 50% of expected time → GREEN (ahead)
ratio = 0.9  // Took 90% of expected time → YELLOW (on track)
ratio = 1.5  // Took 150% of expected time → RED (struggling)
```

**⚠️ These are examples only. No approved thresholds exist.**

---

## 6. Page-Level Aggregation

### Current Implementation

**Overall Progress (Page-Level):**
```typescript
interface ILSOverallProgress {
  status: LearningState;                    // Aggregated status
  progressPercentage: number;               // Completion %
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;                       // Page visits
  revisionCount: number;                    // Page revisions
  timeSpentActiveSec: number;               // Total page time
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}
```

### Aggregation Functions (Phase 2.6-A3)

**Location:** `packages/db-tutorial/src/services/learning-progress.aggregation.ts`

#### 1. Determine Learning State
```typescript
export function determineLearningState(
  status: 'not_started' | 'in_progress' | 'completed'
): LearningState {
  // Direct mapping for Phase 2.6-A3
  return status;
}
```

#### 2. Aggregate Parent State
```typescript
export function aggregateParentState(childStates: LearningState[]): LearningState {
  // Roll-up logic:
  // - Empty children → 'not_available'
  // - All children 'not_available' → 'not_available'
  // - All available children 'completed' → 'completed'
  // - Any available child 'in_progress' → 'in_progress'
  // - Some completed + some not started → 'in_progress'
  // - All available 'not_started' → 'not_started'
}
```

#### 3. Calculate Progress Percentage
```typescript
export function calculateProgressPercentage(
  completedBlocks: CompletedBlockRecord[],
  requiredBlocks: Array<{ blockId: string; blockVersion: string }>
): number {  // 0-100
  // Formula: (completedRequiredBlocks / totalRequiredBlocks) × 100
  // Zero required blocks → 100% (vacuously complete)
}
```

### What Exists

Page-level aggregation **currently works** for:
- ✅ Completion status roll-up (not-started → in-progress → completed)
- ✅ Completion percentage (0-100%)
- ✅ Total time spent aggregation
- ✅ Visit/revision counters

### What's Missing

Page-level aggregation **does NOT exist** for:
- ❌ R/Y/G performance aggregation (block-level → page-level)
- ❌ Average time ratio across blocks
- ❌ Worst-case performance indicator
- ❌ Performance badge for entire page

**Example Questions (No Current Answers):**
- If page has 5 blocks: 3 GREEN, 1 YELLOW, 1 RED → what's the page status?
- Should page status be worst-case (RED)?
- Should page status be average?
- Should page show count (3 GREEN / 1 YELLOW / 1 RED)?

---

## 7. RSSB Boundary

### Evidence Found

**Documentation:**
- 📄 `docs/phases/PHASE-5-RSSB-PHASE-3-EVIDENCE-COMPLETION.md`
- 📄 `docs/phases/PHASE-5-RSSB-PHASE-1-PROTOTYPE-FORENSICS.md`
- 📄 `docs/phases/PHASE-5-RSSB-GATE-1-DISPLAY-CONTRACT-FINAL.md`
- 📄 `docs/phases/PHASE-5-RSSB-FINAL-API-SERVICE-TRACE.md`
- 📄 Multiple audit and forensics reports

**Code Search:**
- ❌ NO React/TypeScript RSSB component found
- ❌ NO `<RightSidebar>` for revision recommendations
- ❌ NO RSSB integration in current Tutorial Page

**Revision Recommendation References:**
- `PracticeTestContent.tsx` has `revisionRecommendations` (practice test context)
- Schema includes `revision_recommendations` JSONB field
- But NO universal RSSB UI component for Tutorial Pages

### RSSB vs LSNB Distinction

**LSNB (Left Sidebar Navigation Bar):**
- Navigation tree
- Page/lesson structure
- Completion status
- Progress tracking
- **Future:** R/Y/G learning performance

**RSSB (Right Sidebar - Revision/Study/Spaced-repetition Bar):**
- Recommended review blocks
- Spaced repetition scheduling
- Weakness detection
- Personalized learning path
- Block-level revision metrics

### Critical Boundary Finding

- RSSB implementation is **Macro 4** (not yet started)
- Current Tutorial Page layout does NOT include RSSB
- LSNB and RSSB are **architecturally separate concerns**
- RSSB will consume ILS data (same as LSNB) but render differently

**Architecture (Future):**
```
        ILSProvider
       /           \
      ↓             ↓
    LSNB          RSSB
 (navigation)  (revision)
   R/Y/G       recommendations
 page-level    block-level
```

---

## 8. UBRC Status

### Search Results

**Searched for:**
- UBRC implementation
- Universal Block Runtime Contract
- `@quiz/ubrc` package
- Standardized block identity/lifecycle

**Found:**
- ❌ **NONE** - No UBRC implementation exists

### Current Block Architecture

**Components:**
- ✅ `TutorialBlockRenderer.tsx` (renders blocks)
- ✅ `ActiveBlockContext` (provides current block identity)
- ✅ `BlockTelemetryProvider` (handles telemetry)

**Block Identity:**
```typescript
interface ActiveBlockIdentity {
  blockId: string;           // UUID
  blockType: string;         // 'D1', 'C1', 'S1', etc.
  blockVersion: string;      // Version identifier
}
```

### Universal Behavior Verification

**Block types in use:**
- I1 (Introduction/Information)
- O1 (Objective)
- D1 (Definition)
- C1 (Code)
- S1 (Summary)
- X1 (Exercise/Practice)

**Telemetry Schema (Universal):**
```sql
-- Applies to ALL block types
(userId, navigationNodeId, blockId, blockVersion)
  visitCount, revisionCount, activeTimeSec, expectedTimeSec
```

**Finding:** Block identity and telemetry are **already universal** (no block-type-specific branches).

### UBRC Status

**UBRC is Macro 2 work** (separate/parallel track).

Current architecture has universal block support at data layer, but no formal UBRC contract layer.

---

## 9. Tutorial Composer Status

### Evidence Found

**Admin Tools:**
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/TutorialBlockSelector.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-left-sidebar/components/TutorialLeftSidebar.tsx`

**Purpose:** Content authoring/selection tools for admin users.

**Finding:** Composer tools exist for content creation, but NO production Tutorial Composer integration with runtime ILS/LSNB.

### Composer Integration Status

**Tutorial Composer integration is Macro 6** (later phase).

The intended architecture:
```
Tutorial Composer (authoring)
        ↓
  Create/assemble Tutorial
        ↓
Publish canonical block instances
        ↓
       UBRC
        ↓
  Tutorial Runtime
        ↓
       ILS
        ↓
  LSNB + RSSB
```

Currently: Composer authoring tools exist, but NOT integrated with runtime learning state.

---

## 10. Architecture Boundaries (Current State)

### Current Data Flow

```
┌─────────────────────────┐
│   TutorialPageShell     │ (Client Component)
│   - Session init        │
│   - Progress fetch      │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    ↓                ↓
┌─────────┐    ┌──────────────┐
│   ILS   │    │ActiveBlock   │
│Provider │    │Context       │
└────┬────┘    └──────┬───────┘
     │                │
     │   [ILS Data]   │ [Current Block]
     │                │
     └────────┬───────┘
              ↓
    ┌─────────────────┐
    │TutorialLeftSide │ (LSNB)
    │bar              │
    ├─────────────────┤
    │✅ Completion    │
    │✅ Progress %    │
    │❌ R/Y/G        │
    └─────────────────┘
              
    ┌─────────────────┐
    │      RSSB       │
    │(not implemented)│ ← Macro 4
    └─────────────────┘
```

### Current ILS → LSNB Boundary

**ILS Provides:**
- ✅ Completion data (`completedBlocks[]`)
- ✅ Overall progress percentage
- ✅ Block-level telemetry (visitCount, revisionCount, activeTimeSec, expectedTimeSec)
- ✅ Page-level metrics (timeSpent, visits, revisions)

**LSNB Consumes:**
- ✅ `completedUrls: Set<string>`
- ✅ `tree.progress.percentage: number`
- ✅ `activeUrl: string`

**LSNB Does NOT Consume:**
- ❌ Per-block telemetry metrics
- ❌ `activeTimeSec` / `expectedTimeSec`
- ❌ Time comparison ratios
- ❌ Performance indicators

**LSNB Renders:**
- ✅ Navigation tree (hierarchical)
- ✅ Status badges (completed/in-progress/not-started)
- ✅ Progress bar (percentage)
- ❌ R/Y/G performance badges (not implemented)

### Missing ILS → LSNB Integration

1. **Block-level performance data** available in ILS but not consumed by LSNB
2. **Time comparison** exists in service but not exposed through ILSProvider
3. **R/Y/G calculation** function doesn't exist
4. **Performance aggregation** (block → page) not defined

---

## 11. Critical Missing Contracts

### A. R/Y/G Threshold Definition

**BLOCKER:** No approved threshold contract exists.

#### Questions Requiring User Decisions

1. **What ratio values map to RED/YELLOW/GREEN?**
   
   Example (hypothetical - NOT APPROVED):
   ```typescript
   // ratio = activeTimeSec / expectedTimeSec
   
   ratio < 0.8     → GREEN  (ahead - took less than expected)
   0.8 ≤ ratio ≤ 1.2 → YELLOW (on track)
   ratio > 1.2     → RED    (struggling - took more than expected)
   ```

2. **What happens when `expectedTimeSec === null`?**
   
   Options:
   - Show no R/Y/G indicator (neutral/gray state)
   - Exclude block from R/Y/G system entirely
   - Show special "no baseline" indicator
   - Use alternative metric (visitCount? revisionCount?)

3. **Should thresholds be configurable?**
   - Per-brand (SkillUp vs RTH)?
   - Per-subject (programming vs math)?
   - Per-difficulty level?
   - Or universal fixed thresholds?

4. **Edge cases:**
   - `activeTimeSec = 0` (not yet engaged) → ?
   - `expectedTimeSec = 0` (divide by zero) → ?
   - `ratio = ∞` (expected zero but actual non-zero) → ?

### B. LSNB Semantic Distinction

**Current:** LSNB shows **completion status** (lifecycle)
- not-started → in-progress → completed

**Macro 3 requires:** LSNB shows **learning performance** (quality)
- RED → YELLOW → GREEN

#### Design Questions

1. **Should LSNB show BOTH or REPLACE?**
   
   Option A: **BOTH** (two separate indicators)
   ```
   [Lesson Name]  [✓ Completed] [🟢 GREEN]
   ```
   
   Option B: **REPLACE** completion with R/Y/G
   ```
   [Lesson Name]  [🟢 GREEN]
   ```
   
   Option C: **AUGMENT** (R/Y/G badge on completed lessons only)
   ```
   [Lesson Name]  [✓ GREEN]
   ```

2. **What about in-progress lessons?**
   - Show R/Y/G while in-progress?
   - Wait until completed?
   - Show preliminary R/Y/G (subject to change)?

3. **Visual design:**
   - Color-coded badges?
   - Icons (✓ checkmark, ⚠ warning, ✗ alert)?
   - Text labels ("Ahead", "On Track", "Review Needed")?
   - Match existing SUIA/RTH design system?

### C. Page-Level R/Y/G Aggregation

**If page has multiple blocks with mixed R/Y/G status:**

Example page:
- Block A: GREEN
- Block B: GREEN  
- Block C: YELLOW
- Block D: GREEN
- Block E: RED

**What's the page status?**

#### Aggregation Options

1. **Worst-case:**
   ```
   Page status = RED (because at least one block is RED)
   ```

2. **Average ratio:**
   ```
   Page status = calculate average ratio across all blocks
   ```

3. **Weighted average:**
   ```
   Page status = weight by expectedTimeSec
   ```

4. **Count-based:**
   ```
   Page shows: 3 GREEN / 1 YELLOW / 1 RED
   ```

5. **Majority rule:**
   ```
   Page status = most common status (GREEN in example)
   ```

**No aggregation rule currently approved.**

### D. NULL Expected Time Handling

Many blocks don't have `expectedTimeSec` defined:
- Information blocks (I1)
- Summary blocks (S1)
- Some definition blocks (D1)

**Questions:**
1. Should these blocks participate in R/Y/G system?
2. Should page R/Y/G ignore blocks with null expected time?
3. Should there be a visual distinction?

---

## 12. Universal Block Behavior Verification

### Block Types Verified

**Current block types in production:**
- **I1** - Introduction/Information
- **O1** - Objective
- **D1** - Definition
- **C1** - Code
- **S1** - Summary
- **X1** - Exercise/Practice

### Identity Verification

**Block Identity (Universal):**
```typescript
interface ActiveBlockIdentity {
  blockId: string;           // UUID (canonical instance ID)
  blockType: string;         // 'D1', 'C1', 'S1', etc.
  blockVersion: string;      // Version identifier
}
```

**Composite Key in Database:**
```sql
(userId, navigationNodeId, blockId, blockVersion)
```

**Finding:** ✅ Identity system is **already universal** (no block-type-specific logic).

### Telemetry Verification

**Schema (block_learning_state):**
```sql
CREATE TABLE block_learning_state (
  -- Same schema applies to ALL block types
  user_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  
  visit_count INTEGER NOT NULL DEFAULT 0,
  revision_count INTEGER NOT NULL DEFAULT 0,
  active_time_sec INTEGER NOT NULL DEFAULT 0,
  expected_time_sec INTEGER,  -- NULLABLE (not all blocks have expected time)
  
  -- ... timestamps, audit fields
);
```

**Finding:** ✅ Telemetry is **generic** (no block-type-specific columns).

### Code Inspection

**Searched for block-type-specific logic in:**
- `block_learning_state` schema ✅ (no D1/C1 branches)
- `BlockLearningStateRepository` ✅ (no block-type switches)
- `ILSProvider` data fetching ✅ (no block-type filtering)
- `BlockTelemetryProvider` ✅ (generic telemetry)
- `TutorialLeftSidebar` ✅ (no block-type branches)

**Finding:** ✅ NO block-type-specific branches found.

### Universal Architecture Confirmed

**The universal contract already exists at data layer:**
- Identity: (blockId, blockVersion)
- Telemetry: visitCount, revisionCount, activeTimeSec, expectedTimeSec
- Lifecycle: firstViewedAt, lastViewedAt, completedAt

**Future blocks (X2, X3, etc.) will automatically work** with existing:
- ILS data storage
- Telemetry collection
- Block learning state
- Completion tracking

**Only missing:** R/Y/G calculation and visualization layer.

---

## 13. Gaps Summary

| Requirement | Current State | Status | Gap Description |
|-------------|---------------|--------|-----------------|
| **LSNB Component** | Exists | ⚠️ Partial | Visual only, no R/Y/G |
| **Completion Status** | Working | ✅ Complete | Badges functional |
| **Progress Percentage** | Working | ✅ Complete | Bar display functional |
| **R/Y/G Indicators** | Missing | ❌ **BLOCKED** | **No threshold contract** |
| **Time Comparison** | Exists in service | ⚠️ Not exposed | Function exists but not in ILSProvider |
| **Block-level R/Y/G** | Missing | ❌ Needs implementation | Calculation + UI |
| **Page-level R/Y/G** | Missing | ❌ Needs implementation | Aggregation rule undefined |
| **ILS Data Layer** | Complete | ✅ Ready | Gate 3C.1R verified (56/56 tests pass) |
| **Universal Block Support** | Complete | ✅ Ready | Generic identity/telemetry |
| **UBRC** | Not found | ⏳ Separate track | Macro 2 work |
| **RSSB** | Not implemented | ⏳ Future | Macro 4 work |
| **Composer Integration** | Not ready | ⏳ Future | Macro 6 work |

---

## 14. Test Evidence Summary

### All ILS Foundation Tests: ✅ PASS

**Total Tests Passed:** 56/56

#### Breakdown by Test Suite

1. **UI TypeScript** - ✅ PASS
   - No compilation errors
   - All type definitions valid

2. **Provider Integration** - 4/4 ✅ PASS
   - F2: In-flight accumulation
   - F3: Retry with same eventId
   - F3: alreadyProcessed acknowledgement
   - F4: Time splitting (600s boundary)

3. **Production Helpers** - 22/22 ✅ PASS
   - Event ID generation
   - Delivery event creation
   - Time splitting logic
   - Queue management
   - Retry semantics

4. **Phase 4.3 Regression** - 19/19 ✅ PASS
   - Session-aware visit tracking
   - Revision counting
   - Block lifecycle
   - Identity isolation

5. **Backend D2 Integration** - 11/11 ✅ PASS
   - Idempotent event delivery
   - Conflict detection
   - PostgreSQL rollback
   - Soft-delete replay
   - Time boundary enforcement

### Test Command Summary

```bash
# All commands executed successfully
cd packages/ui
pnpm type-check                          # ✅ PASS
pnpm vitest run src/tutorial/runtime/__tests__/d2-provider.integration.test.tsx  # ✅ 4/4
pnpm vitest run src/tutorial/runtime/__tests__/d2-production-verification.test.ts  # ✅ 22/22

cd packages/db-tutorial
pnpm vitest run src/services/__tests__/learning-progress-phase-4.3.test.ts  # ✅ 19/19
pnpm vitest run src/__tests__/d2-idempotent-delivery.integration.test.ts  # ✅ 11/11
```

### Infrastructure Verification Status

**Gate 3C.1R Phase D-2: ✅ GREEN**

All ILS infrastructure is verified and production-ready:
- ✅ Frontend telemetry provider
- ✅ Block-level state tracking
- ✅ Idempotent event delivery
- ✅ Time accumulation
- ✅ Universal block identity
- ✅ Session-aware metrics

---

## 15. Recommended Implementation Path

**⚠️ CANNOT PROCEED WITHOUT THRESHOLD CONTRACT**

Once R/Y/G thresholds are defined, the implementation path is:

### Phase 1: Extend ILS Service Layer

```typescript
// packages/db-tutorial/src/services/learning-progress.aggregation.ts

export interface RYGThresholds {
  greenMaxRatio: number;      // e.g., 0.8 (took ≤80% of expected)
  yellowMaxRatio: number;     // e.g., 1.2 (took ≤120% of expected)
  // Above yellowMaxRatio = RED
}

export type PerformanceStatus = 'green' | 'yellow' | 'red' | 'neutral';

export function calculatePerformanceStatus(
  activeTimeSec: number,
  expectedTimeSec: number | null,
  thresholds: RYGThresholds
): {
  status: PerformanceStatus;
  ratio: number | null;
  differenceTimeSec: number | null;
} {
  // Null-safe calculation
  // Map ratio to R/Y/G based on thresholds
}
```

### Phase 2: Expose via ILSProvider

```typescript
// packages/ui/src/tutorial/runtime/ILSProvider.tsx

interface ILSActiveBlockProgress {
  // ... existing fields
  
  // NEW: Performance metrics
  performanceStatus: PerformanceStatus;
  timeRatio: number | null;
  timeComparison: {
    actualTimeSec: number;
    expectedTimeSec: number | null;
    differenceTimeSec: number | null;
  };
}
```

### Phase 3: Update LSNB to Consume Performance Data

```typescript
// src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx

// Add performance badge alongside or replacing completion badge
function PerformanceStatusBadge({ 
  status 
}: { 
  status: PerformanceStatus 
}) {
  // Render R/Y/G indicator
}
```

### Phase 4: Implement Page-Level R/Y/G Aggregation

```typescript
// packages/db-tutorial/src/services/learning-progress.aggregation.ts

export function aggregatePagePerformance(
  blockPerformances: Array<{
    status: PerformanceStatus;
    ratio: number | null;
    expectedTimeSec: number | null;
  }>,
  aggregationRule: 'worst-case' | 'average' | 'weighted-average'
): PerformanceStatus {
  // Implement approved aggregation rule
}
```

### Phase 5: Enhance LSNB Visual Design

- Update status badges to include R/Y/G
- Add page-level performance indicator
- Maintain accessibility (ARIA labels, screen reader support)
- Match SUIA/RTH design system

### Phase 6: Update Tests

Add test coverage for:
- R/Y/G calculation with various ratios
- NULL expected time handling
- Page-level aggregation
- Edge cases (zero time, infinite ratio, etc.)

---

## 16. Formal Gate Assessment

### Macro 3 Stage 1 Status

**AUDIT COMPLETE:** ✅

**Stage 1 Deliverable:** Reconciliation audit report (this document)

**Evidence Gathered:**
- ✅ Current LSNB implementation identified
- ✅ ILS data flow mapped
- ✅ Available telemetry data documented
- ✅ R/Y/G gap confirmed (not implemented)
- ✅ Time comparison function located
- ✅ Page aggregation logic reviewed
- ✅ RSSB/UBRC/Composer boundaries clarified
- ✅ Universal block support verified
- ✅ Test evidence from D-2 documented
- ✅ Missing contracts identified

### Blocker for Stage 2 Implementation

🔴 **RED - Missing R/Y/G Threshold Contract**

**Cannot proceed to Macro 3 Stage 2 (implementation) without:**

1. ✅ **Approved R/Y/G threshold values**
   - What ratio → GREEN?
   - What ratio → YELLOW?
   - What ratio → RED?

2. ✅ **NULL expected-time handling rule**
   - Show neutral indicator?
   - Exclude from R/Y/G?
   - Alternative metric?

3. ✅ **Visual design decision**
   - Show both completion + performance?
   - Replace completion with performance?
   - Augment completion status?

4. ✅ **Page-level aggregation rule**
   - Worst-case?
   - Average?
   - Weighted average?
   - Count display?

5. ✅ **Block-level vs page-level semantics**
   - Where does R/Y/G display?
   - Does page show aggregate R/Y/G?
   - Do individual nodes show R/Y/G?

### Ready for Implementation (Once Contract Defined)

✅ **Infrastructure Ready:**
- ILS data layer complete (Gate 3C.1R verified)
- Universal block architecture verified
- Time comparison function exists
- Aggregation framework exists
- LSNB component identified
- No block-type-specific branches found
- All foundation tests passing (56/56)

✅ **Clear Implementation Path:**
- Service layer extension defined
- ILSProvider API extension mapped
- LSNB UI enhancement scoped
- Test requirements outlined

---

## 17. Next Required Action

**User Decision Required:** Provide authoritative R/Y/G contract before Macro 3 Stage 2 implementation can begin.

### Required Contract Elements

1. **Threshold Definition:**
   ```typescript
   // Example - requires approval
   export const RYG_THRESHOLDS = {
     greenMaxRatio: 0.8,    // ≤80% of expected time
     yellowMaxRatio: 1.2,   // ≤120% of expected time
     // >120% = RED
   } as const;
   ```

2. **NULL Handling Rule:**
   ```typescript
   // Example - requires approval
   if (expectedTimeSec === null) {
     return { status: 'neutral', display: false };
   }
   ```

3. **Visual Design Specification:**
   - Badge placement in LSNB tree
   - Color scheme (match SUIA/RTH)
   - Icons or text labels
   - Accessibility requirements

4. **Aggregation Rule:**
   ```typescript
   // Example - requires approval
   function aggregatePagePerformance(blockStatuses) {
     // Worst-case rule: any RED → page RED
     // Or average rule?
     // Or weighted by expectedTimeSec?
   }
   ```

5. **Scope Definition:**
   - Block-level R/Y/G display?
   - Page-level R/Y/G display?
   - Both?

---

## Appendix A: File Inventory

### Files Inspected During Audit

**LSNB Components:**
- `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`
- `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

**ILS Provider:**
- `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- `packages/ui/src/tutorial/runtime/__tests__/ILSProvider.test.tsx`

**Database Schema:**
- `packages/db-tutorial/src/schema/block-learning-state.ts`
- `packages/db-tutorial/src/schema/block-telemetry-events.ts`

**Service Layer:**
- `packages/db-tutorial/src/services/learning-progress.service.ts`
- `packages/db-tutorial/src/services/learning-progress.aggregation.ts`

**Type Definitions:**
- `packages/types/src/tutorial-sidebar.types.ts`

**Test Suites:**
- `packages/ui/src/tutorial/runtime/__tests__/d2-provider.integration.test.tsx`
- `packages/ui/src/tutorial/runtime/__tests__/d2-production-verification.test.ts`
- `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`
- `packages/db-tutorial/src/__tests__/d2-idempotent-delivery.integration.test.ts`

---

## Appendix B: Glossary

**LSNB** - Left Sidebar Navigation Bar (Tutorial navigation tree with progress)

**RSSB** - Right Sidebar (future: revision/spaced-repetition recommendations)

**UBRC** - Universal Block Runtime Contract (Macro 2 standardization work)

**ILS** - Integrated Learning System (data/telemetry layer)

**R/Y/G** - Red / Yellow / Green (performance status indicators)

**LearningState** - Completion lifecycle status ('not_started' | 'in_progress' | 'completed' | 'not_available')

**TutorialNodeStatus** - LSNB status type ('completed' | 'in-progress' | 'not-started')

**PerformanceStatus** - Proposed R/Y/G type ('green' | 'yellow' | 'red' | 'neutral')

**activeTimeSec** - Actual measured active engagement time on block

**expectedTimeSec** - Authored expected time from published content (nullable)

**ratio** - activeTimeSec / expectedTimeSec (performance comparison metric)

---

**End of Report**
