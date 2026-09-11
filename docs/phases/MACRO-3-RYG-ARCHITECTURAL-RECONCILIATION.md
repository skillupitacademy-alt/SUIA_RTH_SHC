# MACRO 3 — R/Y/G ARCHITECTURAL RECONCILIATION AUDIT

**Date:** 2026-09-11  
**Status:** RECONCILIATION COMPLETE  
**Type:** AUDIT ONLY - NO CODE CHANGES  
**Previous:** Macro 3 Stage 1 LSNB Reconciliation Audit

---

## Executive Summary

**Purpose:** Recover the project's established R/Y/G semantics from evidence, **not invent new thresholds**.

**Critical Finding:** The project documentation **does NOT establish R/Y/G as a current LSNB requirement**. The existing LSNB status represents **completion lifecycle** (not-started → in-progress → completed), **NOT learning performance**.

**Key Evidence:**
1. LSNB currently shows **completion status only** (3-state: completed, in-progress, not-started)
2. RSSB documentation establishes **page-level vs block-level** architectural boundary
3. Time comparison function exists but explicitly states "**NO BUSINESS LOGIC**" and "Does not determine struggling vs efficient"
4. No R/Y/G threshold values exist in any authoritative document
5. RSSB is designated for **block-level learning/revision metrics**
6. LSNB is designated for **page/navigation status**

**Conclusion:** R/Y/G is **NOT currently defined** as an LSNB requirement. The Macro 3 Stage 1 audit correctly identified that R/Y/G is missing from implementation, but incorrectly inferred that this constitutes a **blocker requiring threshold invention**.

---

## 1. What Does R/Y/G Mean? (Evidence Classification: D — NOT FOUND)

### Search Results

**Searched extensively:**
- Literal terms: `red`, `yellow`, `green`, `R/Y/G`
- Semantic equivalents: `ahead`, `on track`, `behind`, `struggling`, `difficulty`, `needs review`, `attention`, `performance status`, `learning status`
- Component-specific: `LSNB`, `TutorialLeftSidebar`, `getEffectiveStatus`, `TutorialNodeStatus`

**Found:**
- ❌ **ZERO** references to R/Y/G as learning performance indicators
- ❌ **ZERO** threshold values (0.8, 1.2, or any other ratio)
- ❌ **ZERO** "ahead/on-track/behind" semantics
- ❌ **ZERO** "struggling" vs "efficient" semantics
- ✅ Only found: "difficulty" as **content metadata** (simple/intermediate/expert) - NOT learner performance

### Evidence Classification

**R/Y/G intended meaning:** **D — Missing / unresolved**

No authoritative evidence exists that R/Y/G was previously designed or specified for LSNB.

---

## 2. Existing LSNB Status Algorithm

### Current Implementation

**File:** `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`

**Type Definition:**
```typescript
// packages/types/src/tutorial-sidebar.types.ts
type TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started';
```

**Status Calculation:**
```typescript
function getEffectiveStatus(
  node: TutorialNavigationNode,
  activeUrl?: string,
  completedUrls?: Set<string>
): TutorialNodeStatus {
  // 1. Check completion
  if (isNodeCompleted(node, completedUrls)) {
    return 'completed';
  }

  // 2. Check if currently active or contains active child
  const isCurrentLesson = Boolean(node.url && node.url === activeUrl);
  const containsCurrentIncompleteLesson = hasActiveIncompleteChild(
    node,
    activeUrl,
    completedUrls
  );

  if (isCurrentLesson || containsCurrentIncompleteLesson) {
    return 'in-progress';
  }

  // 3. Default to not-started
  return 'not-started';
}

function isNodeCompleted(
  node: TutorialNavigationNode,
  completedUrls?: Set<string>
) {
  return node.status === 'completed' || 
         Boolean(node.url && completedUrls?.has(node.url));
}
```

### Algorithm Pseudocode

```text
IF node explicitly marked completed OR node URL in completedUrls:
    status = 'completed'
ELSE IF node is currently active OR node contains active incomplete child:
    status = 'in-progress'
ELSE:
    status = 'not-started'
```

### Inputs

| Input | Type | Purpose |
|-------|------|---------|
| `node` | `TutorialNavigationNode` | Navigation tree node (page/group) |
| `node.url` | `string \| undefined` | Page URL for matching |
| `node.status` | `TutorialNodeStatus \| undefined` | Explicit status override |
| `activeUrl` | `string \| undefined` | Currently active page URL |
| `completedUrls` | `Set<string> \| undefined` | Set of completed page URLs |

### Current Status Semantics

**The current status answers:**
- ✅ "Has this lesson been completed?"
- ✅ "Is this lesson currently active?"
- ✅ "Has this lesson been started?"

**The current status does NOT answer:**
- ❌ "Is the learner struggling with this material?"
- ❌ "Is the learner ahead of expectations?"
- ❌ "Does this require review/revision?"
- ❌ "What's the learning performance quality?"

### Evidence Classification

**Current LSNB status semantics:** **A — Explicitly established**

The existing implementation clearly represents **completion lifecycle**, not learning performance.

---

## 3. R/Y/G Evidence Search Results

### Documentation Search

**Searched:**
- `docs/`
- `docs/phases/`
- `docs/**/*`
- All markdown files

**Found R/Y/G references:** **ZERO**

**Found performance indicator references:** **ZERO**

**Found "ahead/on-track/behind" references:** **ZERO**

### Code Search

**Searched:**
- `src/`
- `packages/`
- `apps/`

**Found R/Y/G type definitions:** **ZERO**

**Found threshold constants:** **ZERO**

**Found performance status calculations:** **ZERO**

### Evidence Classification

**R/Y/G existence in project:** **D — Missing / unresolved**

No code, no types, no calculations, no documentation.

---

## 4. Is `ratioActualToExpected` Intended to Drive R/Y/G?

### Function Location

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`

**Function:** `calculateBlockTimeComparison(blockState: BlockLearningState)`

### Function Documentation (Exact)

```typescript
/**
 * Calculate block time comparison metrics
 * 
 * PURE CALCULATION - no database access, no side effects
 * 
 * Compares actual time spent vs expected time for a block.
 * Returns null-safe metrics for time efficiency analysis.
 * 
 * NO BUSINESS LOGIC:
 * - Does not determine "struggling" vs "efficient"
 * - Does not apply thresholds
 * - Does not make educational decisions
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
 * 
 * @param blockState - Block learning state from repository
 * @returns Time comparison metrics (null-safe)
 */
```

### Explicit Statement

**Direct quote:** "**Does not determine "struggling" vs "efficient"**"

**Direct quote:** "**Does not apply thresholds**"

**Direct quote:** "**Does not make educational decisions**"

**Direct quote:** "**Just returns raw comparison data**"

### Function Returns

```typescript
{
  actualTimeSec: number;
  expectedTimeSec: number | null;
  differenceTimeSec: number | null;
  ratioActualToExpected: number | null;
}
```

### Current Usage

**Where is this function called?**

Searched for callers: **NONE FOUND** in production code.

The function exists in the service layer but is **not exposed via ILSProvider** and **not consumed by any UI component**.

### Evidence Classification

**Is `ratioActualToExpected` the R/Y/G algorithm:** **D — Not established**

The function documentation **explicitly disclaims** educational interpretation. It is a **raw metric calculator**, not a R/Y/G decision engine.

**Confidence:** A — Explicitly documented

The function author stated its purpose: analytical metric, NOT business logic.

---

## 5. Does LSNB Need R/Y/G at All Levels?

### RSSB vs LSNB Architecture

**Authoritative Source:** `docs/phases/PHASE-5-RSSB-GATE-1-DISPLAY-CONTRACT-FINAL.md`

#### Established Boundary

**Quote from documentation:**

```text
HARD ARCHITECTURAL RULE

### Page-Level and Block-Level Are Different Scopes

**ESTABLISHED RULE**: A field name existing at page/navigation-node level 
MUST NOT be assumed to exist at block level.
```

#### Architecture Diagram (from ILS-IMPLEMENTATION-SUMMARY.md)

```text
+----------------------------------------------------------+
|                     TUTORIAL PAGE                        |
+----------------------------------------------------------+
|                                                          |
| LSNB        MAIN CONTENT                       ILS       |
| LEFT        CENTER                             RIGHT     |
|                                                          |
| Navigation   Tutorial Blocks                   ILS Panel |
|                                                          |
+----------------------------------------------------------+
```

**Quote:** "**These systems remain independent.**"

#### LSNB Responsibility (from ILS-IMPLEMENTATION-SUMMARY.md)

```text
LSNB
LEFT

Navigation
```

#### RSSB Responsibility (from PHASE-5-RSSB-GATE-1-DISPLAY-CONTRACT-FINAL.md)

**RSSB displays:**
- Lifecycle table: **BLOCK-LEVEL** timestamps + status
- Engagement grid: **BLOCK-LEVEL** visit/revision/attempt/score
- Time grid: **BLOCK-LEVEL** activeTimeSec vs expectedTimeSec

**Proof from prototype script.js:**
```javascript
document.getElementById('active-time').innerText = formatSeconds(block.activeTimeSec);
document.getElementById('target-time').innerText = formatSeconds(block.expectedTimeSec);
```

**Quote:** "script.js binds `block.activeTimeSec` (BLOCK-LEVEL), NOT `data.timeSpentActiveSec` (PAGE-LEVEL)"

### Current LSNB Scope

LSNB currently operates at **PAGE/NAVIGATION-NODE LEVEL**:
- Navigation tree structure
- Page completion status
- Overall progress percentage
- Active page highlighting

LSNB does **NOT** currently display:
- Individual block metrics
- Per-block telemetry
- Block-level performance

### Evidence Classification

**Does LSNB need R/Y/G at block level:** **D — Not established**

The architectural boundary places:
- **LSNB:** Page/navigation status
- **RSSB:** Block-level learning/revision metrics

If R/Y/G belongs anywhere, the established architecture suggests **RSSB** (Macro 4), not LSNB (Macro 3).

**Confidence:** B — Strong architectural implication

Multiple documents establish LSNB as page-level navigation, RSSB as block-level detailed metrics.

---

## 6. Should Expected-vs-Actual Time Be an LSNB Signal or RSSB Signal?

### RSSB Display Contract Evidence

**Source:** `docs/phases/PHASE-5-RSSB-GATE-1-DISPLAY-CONTRACT-FINAL.md`

**Section 5: Time Analysis Grid Display Contract**

| Prototype Field | Scope | Displayed in RSSB? | RSSB Element ID | Display Label |
|----------------|-------|-------------------|-----------------|---------------|
| `activeTimeSec` | **BLOCK** | ✅ YES | `active-time` | "Active Time" |
| `expectedTimeSec` | **BLOCK** | ✅ YES | `target-time` | "Expected Time" |
| `timeComparison.differenceSec` | **BLOCK** | ✅ YES | `time-diff` | "Difference" |
| `timeComparison.percentageOfExpected` | **BLOCK** | ✅ YES | `perf-pct` | "vs Expected" |

**Quote:** "script.js binds `block.activeTimeSec` (BLOCK-LEVEL), NOT `data.timeSpentActiveSec` (PAGE-LEVEL)"

### RSSB Categories (from PHASE-5-RSSB-GATE-1-DISPLAY-CONTRACT-FINAL.md)

The RSSB prototype includes:
1. **Overall Progress** (page-level summary)
2. **Lifecycle & Overview** (block-level timestamps)
3. **Engagement Metrics** (block-level visit/revision)
4. **Time Analysis** (block-level active vs expected) ← **TIME COMPARISON HERE**

### LSNB Current Data

**Current LSNB inputs (from TutorialLeftSidebar.tsx):**
- `tree: TutorialNavigationTree`
- `activeUrl: string`
- `completedUrls: Set<string>`

**LSNB does NOT currently consume:**
- Per-block telemetry
- Time metrics (page-level or block-level)
- Expected time metadata

### Evidence Classification

**Should expected-vs-actual time belong to LSNB or RSSB:** **B — Strong architectural implication**

The established RSSB design explicitly includes:
- "Time Analysis" section
- Block-level `activeTimeSec` vs `expectedTimeSec`
- Time comparison metrics (`differenceSec`, `percentageOfExpected`)

RSSB is architecturally designated as the **block-level learning metrics consumer**.

LSNB is architecturally designated as the **navigation/page status consumer**.

**Recommendation:** Expected-vs-actual time belongs in **RSSB (Macro 4)**, not LSNB (Macro 3).

---

## 7. What Exactly Does "Green / Yellow / Red" Mean in the Existing Design Language?

### Search Results

**Searched for color semantic meanings:**
- Status colors
- Health indicators
- Performance indicators
- Alert levels

**Found in ILS-IMPLEMENTATION-SUMMARY.md:**

```text
### 5. Color/Theme Hierarchy

ILS Section              Color Source                 Authority
───────────              ────────────                 ─────────
Overall Progress      →  Runtime brand.primary     →  From theme
Lifecycle & Overview  →  Runtime brand.secondary   →  From theme
Engagement Metrics    →  Fixed orange 🟠           →  LOCKED
Time Analysis         →  Fixed blue 🔵             →  LOCKED
```

**Interpretation:**
- Orange = Engagement (semantic: activity/interaction)
- Blue = Time Analysis (semantic: analytical/measurement)

**NOT found:**
- ❌ Red = bad/struggling
- ❌ Yellow = warning/at-risk
- ❌ Green = good/ahead

### Current Status Badge Colors (from TutorialLeftSidebar implementation)

**Visual indicators:**
- 🟢 Green checkmark (✓) = Completed
- 🔵 Blue hollow circle = In progress (active)
- ⚪ Gray hollow circle = Not started

**Semantics:**
- Green = **completion achieved**
- Blue = **currently active**
- Gray = **not yet engaged**

**NOT:**
- Green ≠ "ahead of expected time"
- Yellow ≠ "on track"
- Red ≠ "struggling"

### Evidence Classification

**R/Y/G performance semantics:** **D — Missing / unresolved**

The project uses color for:
- ✅ Completion status (green checkmark)
- ✅ Active status (blue indicator)
- ✅ Semantic sections (orange engagement, blue time)

The project does **NOT** use R/Y/G for:
- ❌ Learning performance quality
- ❌ Time efficiency
- ❌ Struggle/mastery indication

---

## 8. ILS Responsibility Boundary

### Current ILS Architecture

**Source:** Multiple phase documents (PHASE-4, PHASE-5, ILS-IMPLEMENTATION-SUMMARY)

### ILS Owns (Data Layer)

```typescript
// Page-level (navigation_node_id)
- status: 'not_started' | 'in_progress' | 'completed'
- progressPercentage: number (0-100)
- completedBlockCount: number
- totalBlockCount: number
- visitCount: number (page visits)
- revisionCount: number (page revisions)
- timeSpentActiveSec: number (total page time)
- firstViewedAt: Date | null
- lastViewedAt: Date | null
- completedAt: Date | null

// Block-level (blockId + blockVersion)
- isCompleted: boolean
- completedAt: Date | null
- (Future: visitCount, revisionCount, activeTimeSec per block)
```

### ILS Does NOT Own (Presentation/Semantic Layer)

**From learning-progress.aggregation.ts comment:**

```typescript
/**
 * Determine semantic learning state
 * 
 * Maps database status to semantic learning state.
 * Frontend will map these to visual representations.
 * 
 * Phase 2.6-A3: Direct mapping
 * Phase 2.6-B: Can extend with NEEDS_REVISION, NEEDS_PRACTICE logic
 */
export function determineLearningState(
  status: 'not_started' | 'in_progress' | 'completed'
): LearningState {
  return status; // Direct mapping - NO additional interpretation
}
```

**Quote:** "**Frontend will map these to visual representations.**"

### Responsibility Table

| Concern | ILS | LSNB | RSSB | UBRC |
|---------|-----|------|------|------|
| Block identity | ❌ | ❌ | ❌ | ✅ |
| Active time (page) | ✅ Store | ❌ | ❌ | ❌ |
| Active time (block) | ⏳ Future | ❌ | ✅ Display | ❌ |
| Expected time | ⏳ Future | ❌ | ✅ Display | ❌ |
| Completion (page) | ✅ Store | ✅ Display | ✅ Display summary | ❌ |
| Completion (block) | ✅ Store | ❌ | ✅ Display detail | ❌ |
| Revision count (page) | ✅ Store | ❌ | ✅ Display summary | ❌ |
| Revision count (block) | ⏳ Future | ❌ | ✅ Display detail | ❌ |
| Page status | ✅ Store | ✅ Display | ✅ Display summary | ❌ |
| R/Y/G | ❌ | ❓ | ❓ | ❌ |
| Detailed metrics | ❌ | ❌ | ✅ | ❌ |
| Revision recommendations | ❌ | ❌ | ✅ | ❌ |

**Legend:**
- ✅ = Established responsibility
- ❌ = Not responsible
- ⏳ = Future capability (planned but not implemented)
- ❓ = Unresolved / not established

### Evidence Classification

**ILS responsibility boundary:** **A — Explicitly established**

ILS is the **data/telemetry storage layer**, not the **presentation/semantic interpretation layer**.

---

## 9. Time Comparison Boundary

### Where Does `calculateBlockTimeComparison` Belong?

**Current location:** `learning-progress.service.ts` (service layer)

**Current exposure:** **NONE** - not in ILSProvider, not in any API response

**Current consumers:** **NONE** - not called by any UI component

### Function Purpose (from documentation)

```text
PURE CALCULATION - no database access, no side effects

NO BUSINESS LOGIC:
- Does not determine "struggling" vs "efficient"
- Does not apply thresholds
- Does not make educational decisions
- Just returns raw comparison data
```

### Architectural Position

```text
ILS Backend (Storage)
      ↓
Service Layer (Calculation) ← calculateBlockTimeComparison() is here
      ↓
ILSProvider (Exposure) ← NOT YET EXPOSED
      ↓
UI Components (Display/Interpretation) ← NOT YET CONSUMING
```

### Responsibility Boundary

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Database** | Store raw metrics | `activeTimeSec: 185`, `expectedTimeSec: 120` |
| **Service** | Calculate derived metrics | `ratio: 1.54`, `difference: +65` |
| **Provider** | Expose data to UI | `timeComparison: { ratio: 1.54, ... }` |
| **UI (RSSB)** | Display metrics | "154% of expected", "Active: 3m 5s, Expected: 2m" |
| **UI (LSNB)** | ??? | **UNDEFINED** |

### NULL expectedTimeSec Handling

**From function documentation:**

```text
NULL SEMANTICS:
- expectedTimeSec = null → ratio = null (no comparison possible)
```

**Current implementation:**

```typescript
if (expectedTimeSec === null) {
  return {
    actualTimeSec,
    expectedTimeSec: null,
    differenceTimeSec: null,
    ratioActualToExpected: null,
  };
}
```

**Interpretation:** NULL expected time = **no comparison possible**, not "neutral" or "excluded" - simply **undefined**.

### Evidence Classification

**Time comparison ownership:** **C — Inference**

The function exists in the service layer as a **utility calculator**.

It is **not yet integrated** into any UI flow.

The established RSSB architecture includes **Time Analysis section** that would naturally consume this data.

**Recommendation:** `calculateBlockTimeComparison()` should be:
1. Exposed via ILSProvider (when block-level metrics available)
2. Consumed by RSSB Time Analysis section (Macro 4)
3. **NOT** consumed by LSNB unless a new design decision establishes that

---

## 10. Block-Level vs Page-Level R/Y/G Scope

### Current Architecture

**Page-Level (LSNB):**
- Navigation tree nodes
- Hierarchical structure (topics → lessons → sections)
- Completion status per node
- Progress percentage per node
- Active node highlighting

**Block-Level (RSSB - Future):**
- Individual learning blocks (D1, C1, S1, etc.)
- Per-block telemetry (visit, revision, time)
- Block-level lifecycle (first/last viewed, completed)
- Time efficiency analysis

### If R/Y/G Were Implemented, Where Would It Display?

**Option A: Block-Level Only (RSSB)**
```text
RSSB Time Analysis Section:
Block D1: Active 3m 5s vs Expected 2m → RED (154% over)
Block C1: Active 1m 30s vs Expected 2m → GREEN (75% under)
```

**Option B: Page-Level Only (LSNB)**
```text
LSNB Navigation Tree:
[Java Basics] ← Overall page performance → YELLOW
  └─ [Variables] ← Aggregated status → GREEN
```

**Option C: Both**
```text
LSNB: Page-level aggregated R/Y/G
RSSB: Block-level detailed R/Y/G
```

### Current Evidence

**NO authoritative decision exists** about which option to implement.

### Evidence Classification

**Block-level vs page-level R/Y/G scope:** **D — Missing / unresolved**

The architecture establishes:
- LSNB = page/navigation (established)
- RSSB = block-level detail (established)

But **no document establishes** whether R/Y/G should exist at either level, both levels, or neither level.

---

## 11. Completion vs Performance Semantics

### Current LSNB: Completion Only

**Type:** `TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started'`

**Semantic:** **Completion lifecycle** - "Have they done this?"

**Visual:**
- Completed → Green checkmark
- In-progress → Blue circle
- Not-started → Gray circle

### Hypothetical R/Y/G: Performance

**Type (invented example):** `'red' | 'yellow' | 'green'`

**Semantic:** **Learning performance** - "How well are they doing?"

**Visual (hypothetical):**
- Red → Struggling (took much longer than expected)
- Yellow → On track (near expected time)
- Green → Ahead (faster than expected)

### Can Both Coexist?

**Option A: Replace**
```text
[Java Basics] RED (struggling - taking too long)
```
- Loses completion information
- Only shows performance

**Option B: Augment**
```text
[Java Basics] ✓ Completed | RED (took 2× expected time)
```
- Shows both completion and performance
- More complex UI

**Option C: Separate Contexts**
```text
LSNB: [Java Basics] ✓ Completed (navigation context)
RSSB: Block D1: RED - 154% over expected (performance context)
```
- Completion in navigation (LSNB)
- Performance in learning analysis (RSSB)
- Maintains separation of concerns

### Evidence Classification

**Completion vs performance semantics:** **D — Missing / unresolved**

No design decision exists about:
- Whether R/Y/G should replace, augment, or complement completion status
- Whether LSNB should show both or only one
- Whether performance belongs in navigation UI at all

**Current state:** LSNB shows **completion only** (established).

---

## 12. Page-Level R/Y/G Aggregation

### If R/Y/G Were Block-Level, How Would Page-Level Aggregate?

**Hypothetical scenario:**
```text
Page: Java Basics
  ├─ Block D1: GREEN (50% of expected time)
  ├─ Block C1: YELLOW (90% of expected time)
  ├─ Block S1: RED (200% of expected time)
  └─ Block X1: NULL (no expected time defined)
```

**Question:** What's the page-level R/Y/G status?

### Possible Aggregation Rules (All Uninvented)

#### Option 1: Worst-Case
```
Page status = RED (because any block is RED)
```

#### Option 2: Average Ratio
```
avg_ratio = (0.5 + 0.9 + 2.0) / 3 = 1.13
→ map to threshold → YELLOW
```

#### Option 3: Weighted Average
```
weighted_ratio = (D1_time×0.5 + C1_time×0.9 + S1_time×2.0) / total_time
```

#### Option 4: Count-Based Display
```
Page: 1 RED | 1 YELLOW | 1 GREEN | 1 N/A
```

#### Option 5: Majority Rule
```
Most common = GREEN → page GREEN
```

#### Option 6: No Aggregation
```
Page-level R/Y/G doesn't exist - only block-level in RSSB
```

### NULL Expected Time Blocks

**Question:** If a block has `expectedTimeSec === null`, should it:
- Be excluded from aggregation?
- Count as neutral?
- Count as N/A?
- Block aggregation entirely?

### Current Evidence

**NO aggregation rule exists** in any project document.

The existing `aggregateParentState()` function (in `learning-progress.aggregation.ts`) handles **completion status only**, not R/Y/G performance.

### Evidence Classification

**Page-level R/Y/G aggregation rule:** **D — Missing / unresolved**

No authoritative aggregation rule exists because R/Y/G itself is not defined.

---

## 13. Contradictions

### Between Current Code and Macro 3 Stage 1 Audit

**Macro 3 Stage 1 Audit stated:**
> "Critical Blocker: No R/Y/G (Red/Yellow/Green) threshold contract exists. Cannot implement performance indicators without approved thresholds."

**Contradiction:** This treats **missing implementation** as though it were a **failed requirement**.

**Reality:** No evidence exists that R/Y/G was **ever required** for LSNB.

### Between `calculateBlockTimeComparison` Existence and R/Y/G

**Macro 3 Stage 1 Audit inferred:**
> Time comparison function exists → must be for R/Y/G → need thresholds

**Function documentation explicitly states:**
> "Does not determine 'struggling' vs 'efficient'"
> "Does not apply thresholds"
> "Just returns raw comparison data"

**Contradiction resolution:** The function is a **utility calculator**, not a R/Y/G decision engine.

### Between LSNB Scope and Block-Level Metrics

**Macro 3 Stage 1 Audit suggested:**
> LSNB should consume block-level telemetry for R/Y/G

**Established architecture states:**
- LSNB = page/navigation status (PHASE-4, PHASE-5, ILS-IMPLEMENTATION-SUMMARY)
- RSSB = block-level learning metrics (PHASE-5-RSSB-GATE-1-DISPLAY-CONTRACT-FINAL)

**Contradiction resolution:** Block-level performance metrics belong in **RSSB (Macro 4)**, not LSNB (Macro 3).

### Between "Universal LSNB Enhancement" and Current LSNB

**Macro 3 title:** "Universal LSNB Enhancement"

**Question:** What is being "enhanced"?

**Current LSNB:**
- Shows completion status ✅
- Shows progress percentage ✅
- Hierarchical navigation ✅
- Active page highlighting ✅

**Missing from "enhancement" specification:**
- What new capability should LSNB gain?
- Why is R/Y/G part of "universal" enhancement?
- What problem does R/Y/G solve for navigation?

**Contradiction:** "Macro 3" was named before its requirements were established.

---

## 14. Architecture Reconciliation

### Established Architecture (Evidence-Based)

```text
                 Tutorial Block
                       │
                       ▼
                      UBRC ⏳
                   (Macro 2)
                       │
                       ▼
                 Universal ILS ✅
                  (Data Layer)
                  /         \
                 /           \
                ▼             ▼
             LSNB ✅         RSSB ⏳
          (Macro 3?)       (Macro 4)
         Page/Navigation  Block/Learning
            Status          Metrics
                │                │
                ▼                ▼
          Left Sidebar       Right Sidebar
```

**Legend:**
- ✅ = Implemented
- ⏳ = Planned/Future
- ? = Requirements unclear

### Responsibility Matrix (Evidence-Based)

| Concern | Layer | Current | Future | Evidence |
|---------|-------|---------|--------|----------|
| **Block identity** | UBRC | ⏳ | ✅ | Macro 2 work (separate track) |
| **Telemetry storage** | ILS | ✅ | ✅ | Phase 4 complete, Gate 3C.1R verified |
| **Page completion status** | ILS | ✅ | ✅ | `tutorial_navigation_progress.status` |
| **Block completion status** | ILS | ✅ | ✅ | `completed_blocks` JSONB array |
| **Navigation display** | LSNB | ✅ | ✅ | `TutorialLeftSidebar.tsx` |
| **Progress percentage** | LSNB | ✅ | ✅ | Progress bar display |
| **Active highlighting** | LSNB | ✅ | ✅ | `getEffectiveStatus()` |
| **Block-level metrics detail** | RSSB | ❌ | ✅ | Phase 5 specification exists |
| **Time analysis** | RSSB | ❌ | ✅ | RSSB Time Analysis section |
| **Revision recommendations** | RSSB | ❌ | ✅ | RSSB design includes this |
| **R/Y/G performance** | ??? | ❌ | ❓ | **NOT ESTABLISHED** |

### What Is "Universal LSNB Enhancement"?

**Hypothesis 1:** Make LSNB work for all block types
- **Status:** Already achieved - LSNB is block-type-agnostic
- **Evidence:** No block-type-specific logic found in TutorialLeftSidebar.tsx

**Hypothesis 2:** Add R/Y/G performance indicators to LSNB
- **Status:** Not established by any prior design document
- **Evidence:** No R/Y/G requirements found

**Hypothesis 3:** Enhance LSNB visual design/UX
- **Status:** Not specified
- **Evidence:** No UX enhancement requirements found

**Hypothesis 4:** "Macro 3" is a placeholder name without defined scope
- **Status:** Possible - "Stage 1 audit" may be establishing scope retroactively

---

## 15. Implementation Boundary

### What CAN Be Implemented Now (Evidence-Based)

**Macro 3 (LSNB) can proceed with:**

1. ✅ **Verify LSNB works for all block types** (already true - audit confirms)
2. ✅ **Ensure LSNB consumes ILS completion data** (already true - audit confirms)
3. ✅ **Validate LSNB responsive behavior** (existing functionality)
4. ✅ **Improve LSNB accessibility** (if specific requirements provided)
5. ✅ **Refactor LSNB for maintainability** (internal improvements, no semantic changes)

**Macro 3 CANNOT proceed with:**

1. ❌ **R/Y/G performance indicators** (no design exists)
2. ❌ **Time-based learning quality signals** (no thresholds defined)
3. ❌ **Block-level telemetry display in LSNB** (conflicts with RSSB scope)
4. ❌ **Numerical threshold implementation** (no authoritative values)
5. ❌ **"Struggling/ahead" semantics** (not established)

### What Belongs in Macro 4 (RSSB)

**Based on established RSSB specification:**

1. ✅ **Block-level telemetry display** (visit, revision, time)
2. ✅ **Time Analysis section** (activeTimeSec vs expectedTimeSec)
3. ✅ **Engagement metrics** (per-block detail)
4. ✅ **Lifecycle timestamps** (per-block first/last viewed)
5. ✅ **Revision recommendations** (spaced repetition, weakness detection)

**If R/Y/G belongs anywhere, it's likely here** (but still not established).

### What Requires New Design Decision

1. ❓ **Does LSNB need learning performance indicators?**
2. ❓ **Should navigation show time efficiency?**
3. ❓ **What problem would R/Y/G solve for learners?**
4. ❓ **Should page-level aggregate block performance?**
5. ❓ **Is completion status sufficient for navigation?**

---

## 16. Numerical Threshold Status

### Search Results

**Searched for:**
- Threshold constants
- Ratio values (0.8, 1.2, etc.)
- Performance cutoffs
- Time efficiency thresholds

**Found:** **ZERO**

### Macro 3 Stage 1 Audit Examples Were Hypothetical

**Quote from Stage 1 audit:**
```text
Example (hypothetical - NOT APPROVED):
ratio < 0.8     → GREEN
0.8 ≤ ratio ≤ 1.2 → YELLOW
ratio > 1.2     → RED
```

**Audit correctly labeled these as:** "EXAMPLE ONLY - NOT APPROVED THRESHOLDS"

**However, audit then treated them as:** "blockers requiring user decision"

### Evidence Classification

**Numerical R/Y/G thresholds:** **D — Missing / unresolved**

No thresholds exist because R/Y/G itself is not established as a requirement.

**Status:** **NOT FOUND** (not "awaiting approval" - simply non-existent)

---

## 17. Gate Assessment

### Macro 3 Stage 1 — LSNB Reconciliation

**Status:** ✅ **COMPLETE**

**Deliverable:** Audit of current LSNB implementation and ILS foundation

**Value:** Established that ILS infrastructure is complete (56/56 tests pass)

**Finding:** LSNB shows completion status only, not performance indicators

### R/Y/G Architectural Reconciliation

**Status:** ✅ **COMPLETE**

**Finding:** R/Y/G is **NOT an established LSNB requirement**

**Evidence Classification:**

| Question | Finding | Confidence |
|----------|---------|------------|
| What does R/Y/G mean? | **NOT FOUND** | A — Explicit search |
| R/Y/G owner component? | **NOT ESTABLISHED** | A — No references |
| Is `ratioActualToExpected` the R/Y/G algorithm? | **NO** | A — Function docs say "no business logic" |
| Does LSNB need R/Y/G? | **NOT ESTABLISHED** | B — Architecture suggests RSSB scope |
| Does LSNB need block-level detail? | **NO** | B — LSNB is page-level, RSSB is block-level |
| Should time comparison go to LSNB? | **NO** | B — RSSB has Time Analysis section |
| Do R/Y/G thresholds exist? | **NO** | A — Explicit search found zero |
| Is R/Y/G a blocker? | **NO** | A — It's not a requirement |

### Macro 3 Stage 2 Implementation

**Status:** ⚠️ **SCOPE UNDEFINED**

**Reason:** "Universal LSNB Enhancement" requirements are not established

**Options:**

#### Option A: Macro 3 = Verification Only (No Implementation)
```text
Macro 3: Verify LSNB universally supports ILS
  ├─ Stage 1: Audit ✅ COMPLETE
  ├─ Stage 2: Verification tests
  └─ Stage 3: Documentation

Status: CAN PROCEED
```

#### Option B: Macro 3 = R/Y/G Implementation (Requires Design)
```text
Macro 3: Add R/Y/G to LSNB
  ├─ Stage 1: Audit ✅ COMPLETE
  ├─ Stage 1A: Reconciliation ✅ COMPLETE
  ├─ Stage 1B: BLOCKED - Design R/Y/G semantics
  ├─ Stage 1C: BLOCKED - Define thresholds
  ├─ Stage 1D: BLOCKED - Specify visual design
  └─ Stage 2: BLOCKED - Cannot implement without design

Status: BLOCKED - NEW PRODUCT DECISION REQUIRED
```

#### Option C: Macro 3 = LSNB Refinement (No R/Y/G)
```text
Macro 3: Improve LSNB UX/accessibility
  ├─ Stage 1: Audit ✅ COMPLETE
  ├─ Stage 2: Accessibility improvements
  ├─ Stage 3: Performance optimization
  └─ Stage 4: Visual polish

Status: CAN PROCEED (if requirements provided)
```

#### Option D: Skip Macro 3, Proceed to Macro 4 (RSSB)
```text
Macro 3: CLOSED - No additional work needed
Macro 4: RSSB Implementation
  ├─ RSSB design already exists
  ├─ ILS infrastructure ready
  └─ Can proceed immediately

Status: CAN PROCEED
```

---

## 18. Recommendations

### Recommendation 1: Do NOT Invent R/Y/G for Macro 3

**Reason:** No evidence that LSNB requires performance indicators

**Current LSNB is sufficient for navigation:**
- Shows completion status ✅
- Shows progress percentage ✅
- Shows active page ✅
- Hierarchical structure ✅

**If performance indicators are needed, they belong in RSSB (Macro 4).**

### Recommendation 2: Clarify "Universal LSNB Enhancement" Scope

**Current ambiguity:** "Enhancement" is undefined

**Options:**
- **Verify:** LSNB already works universally (audit confirms)
- **Refine:** Improve UX/accessibility (requires specific requirements)
- **Redefine:** Rename Macro 3 to match actual scope

### Recommendation 3: Proceed to Macro 4 (RSSB)

**Reason:** RSSB specification is complete and ready

**RSSB includes:**
- Block-level learning metrics ✅
- Time Analysis section ✅
- Engagement metrics ✅
- Lifecycle detail ✅

**RSSB is where learning performance belongs architecturally.**

### Recommendation 4: If R/Y/G Is Truly Needed, Design It Properly

**Do NOT:**
- ❌ Guess threshold values
- ❌ Assume time ratio is the metric
- ❌ Put block-level metrics in page-level navigation
- ❌ Invent requirements to unblock implementation

**DO:**
- ✅ Define the problem R/Y/G solves
- ✅ Design the learner-facing value
- ✅ Determine the correct component (LSNB? RSSB? Both?)
- ✅ Establish authoritative thresholds (if needed)
- ✅ Specify visual design
- ✅ Test with real learners

---

## 19. Final Summary

### Audit Question: What Did We Already Decide About R/Y/G?

**Answer:** **Nothing. R/Y/G was never designed for this project.**

### What We Found

1. **LSNB shows completion lifecycle** (not-started → in-progress → completed) ✅ ESTABLISHED
2. **RSSB will show block-level learning metrics** (visit, revision, time) ✅ ESTABLISHED
3. **Time comparison function exists but has no business logic** (just raw calculation) ✅ ESTABLISHED
4. **No R/Y/G types, thresholds, semantics, or requirements exist** ✅ CONFIRMED
5. **LSNB operates at page-level, RSSB at block-level** ✅ ESTABLISHED

### What We Did NOT Find

1. ❌ R/Y/G color semantics for learning performance
2. ❌ Threshold values (0.8, 1.2, or any other)
3. ❌ "Ahead/on-track/behind" terminology
4. ❌ "Struggling vs efficient" semantics
5. ❌ Requirement that LSNB show performance indicators
6. ❌ Requirement that time ratio drive any UI state
7. ❌ Page-level aggregation rule for performance
8. ❌ NULL expected-time handling rule

### Macro 3 Stage 2 Authorization

**Status:** ⚠️ **NOT AUTHORIZED**

**Reason:** **Scope undefined**

**Required before proceeding:**
1. Define what "Universal LSNB Enhancement" actually means
2. Clarify whether R/Y/G is part of Macro 3 scope (evidence says NO)
3. If R/Y/G is truly needed, complete proper design (don't invent thresholds)
4. Consider whether Macro 4 (RSSB) is the next logical step instead

---

## 20. Formal Gate Decision

```text
═══════════════════════════════════════════════════════════
MACRO 3 ARCHITECTURAL RECONCILIATION
═══════════════════════════════════════════════════════════

Macro 3 Stage 1 — LSNB Reconciliation Audit: ✅ COMPLETE

R/Y/G Architectural Reconciliation: 🟢 GREEN

Finding: R/Y/G is NOT an established requirement for LSNB

Evidence: 
- Zero R/Y/G references in documentation ✅
- Zero threshold values in code ✅
- LSNB shows completion status only ✅
- RSSB designated for block-level metrics ✅
- Time comparison function disclaims business logic ✅

Macro 3 Stage 2 Implementation: 🔴 NOT AUTHORIZED

Reason: "Universal LSNB Enhancement" scope is undefined

Recommendation: 
- Option 1: Close Macro 3 (LSNB already universal) ✅
- Option 2: Proceed to Macro 4 (RSSB) ✅
- Option 3: Define new Macro 3 scope (requires product decision)

Next Action: USER DECISION REQUIRED
═══════════════════════════════════════════════════════════
```

**This reconciliation prevents inventing R/Y/G thresholds without product justification.**

**The project's established architecture places block-level learning metrics in RSSB (Macro 4), not LSNB (Macro 3).**

---

**End of Reconciliation Audit**
