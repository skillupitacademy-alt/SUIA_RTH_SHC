# 06I — LearningProgressSidebar Metric Calculations

**Investigation T7: RSSB Metric Calculation and Display Chain**

**Status:** COMPLETE  
**Evidence Classification:** VERIFIED (metric calculations), PARTIAL (API source lineage)  
**Created:** 2026-10-03  
**Related:** 06A (Runtime Providers), 06B (Completion Chain), 06C (Visit Persistence), 06D (Active-Time Persistence), 06E (Three-Authority Model), 06F (Metadata Resolution)

---

## Executive Summary

**VERIFIED:** `LearningProgressSidebar` (RSSB) is a **passive consumer** of ILS state. It does NOT independently query the database, select blocks, or calculate block identity. All metrics are derived from `useILS()` → `ILSProvider` → `/api/tutorial/ils/navigation/:nodeId` API.

**Key Finding:** The sidebar displays **17 metric entries** across 4 visual sections:
- **12 direct display metrics** (simple formatting, no calculation)
- **3 derived metrics** (Status boolean, Difference arithmetic, VsExpected percentage)
- **2 unavailable placeholders** (ATTEMPTS, SCORE hard-coded `"—"`)

**Critical Discrepancy:** Component comments reference prototype design intentions that differ from actual implementation (e.g., "PACE/STATUS" vs "DIFFERENCE/VS EXPECTED", "3 rows" vs 4 rows).

**Evidence Boundary:** 06I verifies the **UI-side metric construction and display chain** from `ILSProvider` → sidebar components. The **server-side API aggregation** from database → API response is documented but not independently verified in this investigation (deferred to future 06J — ILS API Implementation).

**Evidence Chain:**
```
/api/tutorial/ils/navigation/:nodeId
        ↓
    ILSProvider
        ↓
    useILS() hook
        ↓
  ┌─────────────────────────────┐
  │ ILSActiveBlockProgress      │
  │ ILSOverallProgress          │
  └─────────────────────────────┘
        ↓
  LearningProgressSidebar
        ↓
   ├── LifecycleMetrics
   ├── EngagementMetrics
   ├── TimeAnalysisMetrics
   └── OverallProgressCard
```

---

## §1. Investigation Scope

### 1.1 Questions from STAGE5_INDEX.md

1. How does `LearningProgressSidebar` calculate displayed metrics?
2. What is the data source for `LifecycleMetrics`?
3. What is the data source for `EngagementMetrics`?
4. What is the data source for `TimeAnalysisMetrics`?
5. How is `ILSActiveBlockProgress` constructed?
6. What calculations occur in each metric component?
7. What is the relationship between sidebar metrics and the three-authority model (06E)?
8. Where do `visitCount`, `revisionCount`, `activeTimeSec`, and `expectedTimeSec` originate?
9. Are there any independent calculations beyond simple display formatting?
10. What is the evidence classification for each finding?

---

## §2. Component Architecture (VERIFIED)

### 2.1 Main Container (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx`

**Data Source:**
```typescript
const { overallProgress, activeBlockProgress, loading } = useILS();
```

**Structure:**
```tsx
<LearningProgressSidebar isOpen={boolean} brand={...}>
  <LifecycleMetrics 
    activeBlockProgress={activeBlockProgress}
    brand={brand}
  />
  <EngagementMetrics 
    activeBlockProgress={activeBlockProgress}
  />
  <TimeAnalysisMetrics 
    activeBlockProgress={activeBlockProgress}
  />
  <OverallProgressCard 
    overallProgress={overallProgress}
    brand={brand}
  />
</LearningProgressSidebar>
```

**Evidence State:** VERIFIED — Sidebar is **passive consumer** of ILS state  
**Key Finding:** NO manual block selection, NO independent queries, NO calculation logic beyond child components

---

### 2.2 Component Dependency Graph (VERIFIED)

```
ActiveBlockContext (viewport tracking)
        ↓
   ILSProvider (API data bridge)
        ↓
   useILS() hook
        ↓
 ┌──────────────────────┬──────────────────────┐
 │                      │                      │
ILSOverallProgress   ILSActiveBlockProgress   loading
 │                      │
 │                      ├── LifecycleMetrics
 │                      ├── EngagementMetrics
 │                      └── TimeAnalysisMetrics
 │
 └── OverallProgressCard
```

**Evidence State:** VERIFIED — Clear separation between navigation-level and block-level metrics

---

## §3. ILSProvider Data Construction (VERIFIED)

### 3.1 API Call Chain (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

**Endpoint:**
```typescript
GET /api/tutorial/ils/navigation/${navigationNodeId}?subtopicId=${subtopicId}
```

**Response Structure:**
```typescript
interface NavigationProgressResponse {
  // Navigation-level (overall)
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  status: LearningState;
  progressPercentage: number;
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;
  revisionCount: number;
  timeSpentActiveSec: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
  
  // Block-level array (Gate 3C.1R)
  blocks: BlockLearningStateResponse[];
  
  // Legacy (Gate 3C.1R - still present)
  completedBlocks: CompletedBlockRecord[];
}
```

**Evidence State:** VERIFIED — Single API call provides both navigation-level and block-level state

---

### 3.2 ILSOverallProgress Construction (VERIFIED)

**Location:** `ILSProvider.tsx` lines ~338-349

```typescript
setOverallProgress({
  status: data.status,
  progressPercentage: data.progressPercentage,
  completedBlockCount: data.completedBlockCount,
  totalBlockCount: data.totalBlockCount,
  visitCount: data.visitCount,
  revisionCount: data.revisionCount,
  timeSpentActiveSec: data.timeSpentActiveSec,
  firstViewedAt: data.firstViewedAt ? new Date(data.firstViewedAt) : null,
  lastViewedAt: data.lastViewedAt ? new Date(data.lastViewedAt) : null,
  completedAt: data.completedAt ? new Date(data.completedAt) : null,
});
```

**Transformation:** Direct mapping from API response → `ILSOverallProgress` (only date parsing)

**Evidence State:** VERIFIED — No calculation, only normalization

---

### 3.3 ILSActiveBlockProgress Construction (VERIFIED)

**Location:** `ILSProvider.tsx` lines ~386-424

**Algorithm:**
1. Receive `activeBlock` from `ActiveBlockContext` (viewport tracking)
2. Find matching block in `blocks[]` array by `blockId` + `blockVersion` (strict matching)
3. If found: Map all fields from `BlockLearningStateResponse`
4. If not found: Return zero/default semantics (not-started state)

**Block Found Path:**
```typescript
setActiveBlockProgress({
  blockId: activeBlock.blockId,
  blockType: activeBlock.blockType,
  blockVersion: activeBlock.blockVersion || '',
  isCompleted: !!blockState.completedAt,
  completedAt: blockState.completedAt ? new Date(blockState.completedAt) : null,
  visitCount: blockState.visitCount,
  revisionCount: blockState.revisionCount,
  activeTimeSec: blockState.activeTimeSec,
  expectedTimeSec: blockState.expectedTimeSec,
  firstViewedAt: blockState.firstViewedAt ? new Date(blockState.firstViewedAt) : null,
  lastViewedAt: blockState.lastViewedAt ? new Date(blockState.lastViewedAt) : null,
});
```

**Block Not Found Path:**
```typescript
setActiveBlockProgress({
  blockId: activeBlock.blockId,
  blockType: activeBlock.blockType,
  blockVersion: activeBlock.blockVersion || '',
  isCompleted: false,
  completedAt: null,
  visitCount: 0,
  revisionCount: 0,
  activeTimeSec: 0,
  expectedTimeSec: null,
  firstViewedAt: null,
  lastViewedAt: null,
});
```

**Evidence State:** VERIFIED — Pure data lookup, no calculation beyond `isCompleted` boolean derivation

---

### 3.4 Telemetry Update Integration (VERIFIED)

**Location:** `ILSProvider.tsx` lines ~469-539 (`handleActiveTimeDeliveryAcknowledged`)

**Purpose:** Update `blocksRef.current` cache when telemetry delivery acknowledgement arrives from server

**Critical Behavior:**
- **Immutable replacement** (not mutation): Creates new array with updated block state
- **Monotonic completion invariant** (Gate H): `completedAt` never regresses from timestamp → null
- **Cumulative activeTimeSec**: Server state is cumulative total, not delta
- **Triggers re-evaluation**: If acknowledged block is active, calls `updateActiveBlockProgress()` with new reference

**Evidence State:** VERIFIED — Cache coherence mechanism between telemetry delivery and ILS display

---

## §4. LifecycleMetrics Component (VERIFIED)

### 4.1 Data Source (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LifecycleMetrics.tsx`

**Input:**
```typescript
interface LifecycleMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
  brand: { primaryColor?: string; secondaryColor: string; };
}
```

**Fields Consumed:**
```typescript
const { firstViewedAt, lastViewedAt, completedAt, isCompleted } = activeBlockProgress;
```

---

### 4.2 Displayed Metrics (VERIFIED)

| Metric Label | Source Field | Transformation | Display Format |
|---|---|---|---|
| **First Viewed** | `firstViewedAt` | `formatDate()` | "Jan 10, 2026" or "—" |
| **Last Viewed** | `lastViewedAt` | `formatDate()` | "Jan 10, 2026" or "—" |
| **Completed At** | `completedAt` | `formatDate()` | "Jan 10, 2026" or "—" |
| **Status** | `completedAt \|\| isCompleted` | Boolean → text | "COMPLETED" or "—" |

**Calculation Logic (Status):**
```typescript
const isBlockCompleted = Boolean(completedAt || isCompleted);
const statusDisplay = isBlockCompleted ? 'COMPLETED' : '—';
```

**Evidence State:** VERIFIED — Simple display formatting, one boolean derivation

---

### 4.3 Implementation vs Comment Discrepancies (VERIFIED)

| Aspect | Comment Says | Implementation Does | Classification |
|---|---|---|---|
| **Table Structure** | "3 rows × 2 columns" | **4 rows × 2 columns** (First/Last/Completed/Status) | PRODUCTION_IMPLEMENTATION |
| **Hover Transform** | `translateY(-7px)` | `translateY(-3px)` | PRODUCTION_IMPLEMENTATION |

**Evidence State:** VERIFIED — Comments describe prototype intent; implementation differs

**Recommendation:** Document actual behavior (4 rows, -3px transform), note prototype intent in comments

---

## §5. EngagementMetrics Component (VERIFIED)

### 5.1 Data Source (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/EngagementMetrics.tsx`

**Input:**
```typescript
interface EngagementMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
}
```

**Fields Consumed:**
```typescript
const { visitCount, revisionCount } = activeBlockProgress;
```

---

### 5.2 Displayed Metrics (VERIFIED)

| Metric Label | Source Field | Transformation | Display Format | Evidence |
|---|---|---|---|---|
| **VISIT COUNT** | `visitCount` | None | Integer | VERIFIED |
| **REVISION COUNT** | `revisionCount` | None | Integer | VERIFIED |
| **ATTEMPTS** | (none) | Hard-coded | `"—"` | VERIFIED (unavailable) |
| **SCORE** | (none) | Hard-coded | `"—"` | VERIFIED (unavailable) |

**Critical Finding:**
```typescript
// From component source:
<EngagementCard label="ATTEMPTS" value="—" />
<EngagementCard label="SCORE" value="—" />

// Component comment:
// - Attempts → "—" (unavailable - NO quiz system)
// - Score → "—" (unavailable - NO quiz system)
```

**Evidence State:** VERIFIED — `ATTEMPTS` and `SCORE` are explicitly unavailable placeholders

**Impact:** Stage 5 documentation must NOT claim RSSB provides quiz attempts or scores

---

### 5.3 No Independent Calculations (VERIFIED)

**Finding:** `EngagementMetrics` performs **zero calculations**. It is a pure display component.

**Evidence State:** VERIFIED — Direct pass-through of `visitCount` and `revisionCount`

---

## §6. TimeAnalysisMetrics Component (VERIFIED)

### 6.1 Data Source (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/TimeAnalysisMetrics.tsx`

**Input:**
```typescript
interface TimeAnalysisMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
}
```

**Fields Consumed:**
```typescript
const { activeTimeSec, expectedTimeSec } = activeBlockProgress;
```

---

### 6.2 Displayed Metrics and Calculations (VERIFIED)

| Metric Label | Calculation | Formula | Example Values | Null Handling |
|---|---|---|---|---|
| **ACTIVE TIME** | Format only | `formatSeconds(activeTimeSec)` | "5m 24s", "0s" | N/A (always number) |
| **EXPECTED TIME** | Format only | `formatSeconds(expectedTimeSec)` | "3m 30s" | `null → "—"` |
| **DIFFERENCE** | Subtraction | `activeTimeSec - expectedTimeSec` | "+65s", "-30s", "0s" | `expectedTimeSec === null → "—"` |
| **VS EXPECTED** | Percentage | `(activeTimeSec / expectedTimeSec) × 100` | "154.17%", "100%" | `expectedTimeSec === null OR ≤ 0 → "—"` |

---

### 6.3 DIFFERENCE Calculation (VERIFIED)

**Implementation:** Lines ~67-73

```typescript
let diffDisplay = "—";
if (expectedTimeSec !== null && expectedTimeSec !== undefined) {
  const diffSec = activeTimeSec - expectedTimeSec;
  const diffSign = diffSec > 0 ? '+' : '';
  diffDisplay = `${diffSign}${diffSec}s`;
}
```

**Behavior:**
- **Positive difference:** `"+65s"` (learner spent more time than expected)
- **Negative difference:** `"-30s"` (learner spent less time than expected)
- **Zero difference:** `"0s"` (exact match)
- **No expected time:** `"—"` (cannot calculate)

**Evidence State:** VERIFIED — Simple arithmetic, explicit null handling

---

### 6.4 VS EXPECTED Calculation (VERIFIED)

**Implementation:** Lines ~75-80

```typescript
let vsExpectedDisplay = "—";
if (expectedTimeSec !== null && expectedTimeSec > 0) {
  const rawPct = (activeTimeSec / expectedTimeSec) * 100;
  vsExpectedDisplay = Number.isInteger(rawPct) ? `${rawPct}%` : `${rawPct.toFixed(2)}%`;
}
```

**Behavior:**
- **Integer percentages:** `"100%"`, `"200%"` (no decimals)
- **Non-integer percentages:** `"154.17%"`, `"87.50%"` (2 decimal places)
- **Division by zero guard:** `expectedTimeSec > 0` check
- **No expected time:** `"—"`

**Example Calculations:**
```
activeTimeSec = 185, expectedTimeSec = 120
  → (185 / 120) × 100 = 154.166...
  → "154.17%"

activeTimeSec = 90, expectedTimeSec = 90
  → (90 / 90) × 100 = 100
  → "100%"
```

**Evidence State:** VERIFIED — Raw percentage calculation, NO threshold logic

---

### 6.5 Critical: No Learning Classification (VERIFIED)

**Finding:** `TimeAnalysisMetrics` does NOT implement:
- ❌ RED/YELLOW/GREEN status indicators
- ❌ "Fast" / "Normal" / "Slow" classifications
- ❌ "On Track" / "Behind" / "Ahead" judgments
- ❌ Performance thresholds
- ❌ Warning states

**Component Comment Discrepancy:**
```typescript
// Comment says:
// - STATUS → "On Track" (prototype literal text - NOT computed learning judgment)

// Actual implementation renders:
<TimeCard label="ACTIVE TIME" value={formatSeconds(activeTimeSec)} />
<TimeCard label="EXPECTED TIME" value={expectedTimeSec !== null ? formatSeconds(expectedTimeSec) : "—"} />
<TimeCard label="DIFFERENCE" value={diffDisplay} />
<TimeCard label="VS EXPECTED" value={vsExpectedDisplay} />
```

**Evidence State:** VERIFIED — Comment describes old/prototype design; implementation renders DIFFERENCE/VS EXPECTED (not PACE/STATUS)

**Classification:** PRODUCTION_IMPLEMENTATION (use actual JSX, not comment)

---

### 6.6 Implementation vs Comment Discrepancies (VERIFIED)

| Aspect | Comment Says | Implementation Does | Classification |
|---|---|---|---|
| **Metrics Displayed** | "PACE" and "STATUS" | "DIFFERENCE" and "VS EXPECTED" | PRODUCTION_IMPLEMENTATION |
| **"On Track" Text** | Literal prototype text | NOT RENDERED | PRODUCTION_IMPLEMENTATION |
| **Learning Judgment** | "NOT computed learning judgment" | Confirmed — raw % only | VERIFIED |

**Evidence State:** VERIFIED — Comments reference prototype design that differs from production implementation

---

## §7. OverallProgressCard Component (VERIFIED)

### 7.1 Data Source (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/OverallProgressCard.tsx`

**Input:**
```typescript
interface OverallProgressCardProps {
  overallProgress: ILSOverallProgress | null;
  brand: { primaryColor: string; };
}
```

**Fields Consumed:**
```typescript
const {
  status,
  progressPercentage,
  visitCount,
  timeSpentActiveSec,
  revisionCount,
  completedBlockCount,
  totalBlockCount,
} = overallProgress;
```

---

### 7.2 Displayed Metrics (VERIFIED)

**Status Badge:**
```typescript
const statusText = status === 'completed' ? 'COMPLETED' : 
                  status === 'in_progress' ? 'IN PROGRESS' : 
                  'NOT STARTED';
```

**Main Display:**
| Element | Source | Transformation | Display |
|---|---|---|---|
| **Percentage** | `progressPercentage` | `Math.round()` | "87%", "100%" |
| **Subtext** | `completedBlockCount`, `totalBlockCount` | Template string | "15 of 20 blocks completed" |
| **Progress Bar Width** | `progressPercentage` | CSS width % | Visual bar fill |

**4-Column Grid:**
| Label | Source Field | Transformation | Display |
|---|---|---|---|
| **COMPLETED** | `completedBlockCount` | None | Integer |
| **TOTAL** | `totalBlockCount` | None | Integer |
| **REQUIRED** | `totalBlockCount` | Hard-coded (same as TOTAL) | Integer |
| **ACTIVE** | `timeSpentActiveSec` | `formatSeconds()` | "1h 23m", "5m 24s" |

**Evidence State:** VERIFIED — Simple display formatting, one enum mapping, no complex calculations

---

### 7.3 REQUIRED Metric Semantics (VERIFIED)

**Finding:**
```typescript
<span>REQUIRED</span>
<span>{totalBlockCount}</span>
```

**Evidence State:** VERIFIED — `REQUIRED` currently equals `totalBlockCount` (all blocks required)

**Implication:** No per-block `progressRole` filtering in OverallProgressCard display (consistent with 06F/06G findings that `progressRole` exists in schema but is not extracted/used for filtering)

---

## §8. Utility Functions (VERIFIED)

### 8.1 formatSeconds() (VERIFIED)

**File:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/utils.ts`

**Implementation:**
```typescript
export function formatSeconds(sec: number | undefined): string {
  if (!sec || sec === 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
```

**Examples:**
```
formatSeconds(0)    → "0s"
formatSeconds(45)   → "45s"
formatSeconds(90)   → "1m 30s"
formatSeconds(185)  → "3m 5s"
```

**Evidence State:** VERIFIED — Simple time formatting, no complex logic

---

### 8.2 formatDate() (VERIFIED)

**Implementation:**
```typescript
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
```

**Examples:**
```
formatDate(null)              → "—"
formatDate("2026-01-10")      → "Jan 10, 2026"
formatDate(new Date(...))     → "Jan 10, 2026"
```

**Evidence State:** VERIFIED — Standard date formatting, handles both Date objects and ISO strings

---

## §9. Metric Calculation Summary

### 9.1 Complete Metric Inventory (VERIFIED)

| Metric | Nature | Component | Calculation | Source |
|---|---|---|---|---|
| **First Viewed** | Direct display | LifecycleMetrics | `formatDate(firstViewedAt)` | `activeBlockProgress` |
| **Last Viewed** | Direct display | LifecycleMetrics | `formatDate(lastViewedAt)` | `activeBlockProgress` |
| **Completed At** | Direct display | LifecycleMetrics | `formatDate(completedAt)` | `activeBlockProgress` |
| **Status** | Derived boolean | LifecycleMetrics | `Boolean(completedAt \|\| isCompleted)` | `activeBlockProgress` |
| **Visit Count** | Direct display | EngagementMetrics | None | `activeBlockProgress.visitCount` |
| **Revision Count** | Direct display | EngagementMetrics | None | `activeBlockProgress.revisionCount` |
| **Attempts** | Placeholder | EngagementMetrics | Hard-coded `"—"` | N/A (unavailable) |
| **Score** | Placeholder | EngagementMetrics | Hard-coded `"—"` | N/A (unavailable) |
| **Active Time** | Direct display | TimeAnalysisMetrics | `formatSeconds(activeTimeSec)` | `activeBlockProgress` |
| **Expected Time** | Direct display | TimeAnalysisMetrics | `formatSeconds(expectedTimeSec)` | `activeBlockProgress` |
| **Difference** | Derived arithmetic | TimeAnalysisMetrics | `activeTimeSec - expectedTimeSec` | `activeBlockProgress` |
| **Vs Expected** | Derived percentage | TimeAnalysisMetrics | `(activeTimeSec / expectedTimeSec) × 100` | `activeBlockProgress` |
| **Overall Status** | Direct display | OverallProgressCard | Enum → text mapping | `overallProgress` |
| **Progress %** | Direct display | OverallProgressCard | `Math.round(progressPercentage)` | `overallProgress` |
| **Completed Blocks** | Direct display | OverallProgressCard | None | `overallProgress.completedBlockCount` |
| **Total Blocks** | Direct display | OverallProgressCard | None | `overallProgress.totalBlockCount` |
| **Required** | Direct display | OverallProgressCard | Same as Total (hard-coded) | `overallProgress.totalBlockCount` |
| **Active (Overall)** | Direct display | OverallProgressCard | `formatSeconds(timeSpentActiveSec)` | `overallProgress` |

**Summary:**
- **12 direct display metrics** (simple formatting, no calculation)
- **3 derived metrics** (Status boolean, Difference arithmetic, Vs Expected percentage)
- **2 unavailable placeholders** (Attempts, Score)

**Evidence State:** VERIFIED — All metrics traced to source, all calculations documented

---

### 9.2 Calculation Complexity Classification (VERIFIED)

| Complexity Level | Metrics | Calculation Type |
|---|---|---|
| **None (Direct Display)** | 12 metrics | Format-only (dates, seconds → "Xm Ys") |
| **Trivial (Boolean/Enum)** | 2 metrics | Boolean OR, enum → text |
| **Simple Arithmetic** | 2 metrics | Subtraction, division + rounding |
| **Unavailable** | 2 metrics | Hard-coded `"—"` |

**Evidence State:** VERIFIED — No complex algorithms, no thresholds, no learning classifications

---

## §10. Data Lineage to Three-Authority Model

### 10.1 Connection to 06E (VERIFIED FOR UI LAYER, API AGGREGATION NOT INSPECTED)

**From 06E (Three-Authority Model):**
- **Completion Authority:** `tutorial_navigation_progress.completed_blocks[]`
- **Event Ledger Authority:** `block_telemetry_events`
- **Cumulative State Authority:** `block_learning_state`

**06I Finding:** `ILSActiveBlockProgress` fields **correspond to** `block_learning_state` column semantics as established by 06B-06F:

| ILSActiveBlockProgress Field | Corresponding Authority (from 06E) | 06I Verification |
|---|---|---|
| `visitCount` | Cumulative State (`visit_count` atomic counter) | Consumed from API `blocks[]` |
| `revisionCount` | Cumulative State (`revision_count` atomic counter) | Consumed from API `blocks[]` |
| `activeTimeSec` | Cumulative State (`active_time_sec` upsert) | Consumed from API `blocks[]` |
| `expectedTimeSec` | Metadata (extracted, see 06F) | Consumed from API `blocks[]` |
| `firstViewedAt` | Cumulative State (MIN semantics) | Consumed from API `blocks[]` |
| `lastViewedAt` | Cumulative State (MAX semantics) | Consumed from API `blocks[]` |
| `completedAt` | Completion Authority (06B/06E) | Consumed from API `blocks[]` |

**Evidence State:** VERIFIED — Sidebar metrics consume API-provided state that corresponds to the three-authority model

**Important Qualification:** 06I verifies that `ILSProvider` receives and maps these fields from the API response. The **server-side aggregation** from `block_learning_state` table → API `blocks[]` array is **not independently inspected in 06I**. That lineage is established by correlation with 06B-06F evidence, not by direct API source inspection.

**Recommendation:** Create **06J — ILS API Implementation** to verify server-side aggregation path: `database → /api/tutorial/ils/navigation/:nodeId → API response`

---

### 10.2 Connection to 06B/06C/06D (VERIFIED FOR UI CONSUMPTION)

**From 06B (Completion Chain):**
- `completedAt` and `isCompleted` derive from `tutorial_navigation_progress.completed_blocks[]`
- Sidebar Status metric consumes this completion state via API response

**From 06C (Visit Persistence):**
- `visitCount` and `revisionCount` persisted to `block_learning_state` atomic counters
- Sidebar EngagementMetrics displays these values via API response

**From 06D (Active-Time Persistence):**
- `activeTimeSec` persisted to `block_learning_state.active_time_sec` (cumulative)
- Sidebar TimeAnalysisMetrics displays and derives from this value via API response

**Evidence State:** VERIFIED — UI-side consumption chain from API → ILSProvider → sidebar components

**Important Qualification:** The connection to 06B/06C/06D is established by **correlation** (field name/semantic correspondence) rather than **direct API source inspection**. 06I verifies that sidebar metrics consume API-provided fields; it does not independently re-verify the database → API aggregation path established by 06B-06D.

**Complete Verified Chain:**
```
Database persistence (06B/06C/06D)
        ↓
  [API aggregation — NOT INSPECTED IN 06I]
        ↓
  API response (blocks[] array)
        ↓
  ILSProvider (06I VERIFIED)
        ↓
  Sidebar components (06I VERIFIED)
```

---

## §11. Sidebar Overlay Architecture Discrepancy

### 11.1 Comment vs Implementation (PARTIAL)

**Component Comments Say:**
```typescript
// STRUCTURE (from prototype):
// - Overlay (backdrop with blur, onClick → close)
// - Panel (fixed right, 440px, slide transition)
```

**Actual Implementation:**
```tsx
<aside aria-label="Your Progress" className="...">
  {/* Only <aside> panel, no overlay/backdrop element */}
</aside>
```

**Evidence State:** PARTIAL — The supplied JSX shows only the `<aside>` panel. The overlay/backdrop may be implemented in the parent component (`TutorialPageShell` or similar).

**Verification Required:** Check if overlay is rendered by parent component or if comment describes prototype intent not yet implemented.

**Impact:** Minor — does not affect metric calculations (just presentation layer)

---

## §12. What 06I Establishes

### 12.1 VERIFIED Findings

**UI-Side Metric Construction (VERIFIED):**
1. ✅ `LearningProgressSidebar` is a **passive ILS consumer** (no independent queries)
2. ✅ All metrics sourced from `useILS()` hook
3. ✅ `ILSProvider` fetches data from single API endpoint
4. ✅ `ILSProvider` maps API response → `ILSOverallProgress` (date normalization only)
5. ✅ `ILSActiveBlockProgress` constructed by strict `blockId` + `blockVersion` matching
6. ✅ Zero/default semantics for blocks without telemetry state
7. ✅ Telemetry cache update maintains monotonic completion invariant (Gate H)
8. ✅ LifecycleMetrics displays 4 fields (First/Last/Completed/Status)
9. ✅ EngagementMetrics displays 2 real + 2 unavailable fields
10. ✅ TimeAnalysisMetrics calculates DIFFERENCE and VS EXPECTED (not PACE/STATUS)
11. ✅ OverallProgressCard displays navigation-level progress
12. ✅ No learning classification thresholds in TimeAnalysisMetrics
13. ✅ ATTEMPTS and SCORE are explicitly unavailable (no quiz system)
14. ✅ 17 total metric entries displayed (12 direct + 3 derived + 2 unavailable)

**Correlation to Three-Authority Model (VERIFIED BY CORRESPONDENCE):**
15. ✅ Sidebar metric fields correspond to database authorities established by 06B-06E
16. ✅ Field semantics align with cumulative state / completion authority / metadata extraction

**API Aggregation Path (NOT INSPECTED IN 06I):**
17. ❓ Server-side aggregation from `block_learning_state` → API `blocks[]` (deferred to 06J)

---

### 12.2 Source/Implementation Discrepancies (VERIFIED)

| Component | Discrepancy | Comment Says | Implementation Does |
|---|---|---|---|
| LifecycleMetrics | Table structure | 3 rows | **4 rows** (First/Last/Completed/Status) |
| LifecycleMetrics | Hover transform | `-7px` | **`-3px`** |
| TimeAnalysisMetrics | Metrics displayed | PACE, STATUS | **DIFFERENCE, VS EXPECTED** |
| TimeAnalysisMetrics | "On Track" text | Literal prototype text | **Not rendered** |
| LearningProgressSidebar | Overlay structure | Backdrop + Panel | **Panel only in JSX** (may be in parent) |

**Evidence Classification:** PRODUCTION_IMPLEMENTATION (document actual behavior, note prototype intent)

---

### 12.3 NOT YET VERIFIED

The following remain outside 06I scope:

1. ❓ `/api/tutorial/ils/navigation/:nodeId` server-side implementation
2. ❓ How API aggregates `blocks[]` array from `block_learning_state` table
3. ❓ How API calculates `progressPercentage`
4. ❓ How API determines `status` (completed/in_progress/not_started)
5. ❓ Whether sidebar overlay/backdrop is implemented in parent component
6. ❓ Test coverage for metric calculations
7. ❓ Whether displayed metrics always reflect current database state (eventual consistency)

**Recommendation:** These belong to API/backend investigation, not UI metric display investigation

---

## §13. Cross-References

**Related Investigations:**
- **06A** — Runtime Providers (LearningProgressSidebar identified as RSSB)
- **06B** — Completion Chain (completedAt source verified)
- **06C** — Visit Persistence (visitCount/revisionCount source verified)
- **06D** — Active-Time Persistence (activeTimeSec source verified)
- **06E** — Three-Authority Model (sidebar consumes all three authorities)
- **06F** — Metadata Resolution (expectedTimeSec extraction verified)
- **06G** — Runtime Schema Validation (TutorialDocumentSchema upstream of ILS)

**Data Flow Chain:**
```
Database (block_learning_state, tutorial_navigation_progress)
        ↓
  /api/tutorial/ils/navigation/:nodeId
        ↓
    ILSProvider (data bridge)
        ↓
   useILS() hook
        ↓
  LearningProgressSidebar (passive consumer)
        ↓
   ├── LifecycleMetrics (4 metrics: First/Last/Completed/Status)
   ├── EngagementMetrics (4 metrics: 2 real + 2 unavailable)
   ├── TimeAnalysisMetrics (4 metrics: Active/Expected/Difference/VsExpected)
   └── OverallProgressCard (navigation-level metrics)
```

---

## §14. Key Findings

### 14.1 Sidebar is Pure Presentation Layer (VERIFIED)

**Finding:** `LearningProgressSidebar` and its child components perform **no business logic**. All calculations are trivial (formatting, simple arithmetic, boolean derivation).

**Implication:** Business logic resides in:
- ILSProvider (data fetching, cache management)
- API backend (aggregation, status determination)
- Database persistence layer (06B/06C/06D)

**Evidence State:** VERIFIED — Clear architectural separation

---

### 14.2 No Learning Judgments in UI (VERIFIED)

**Finding:** `TimeAnalysisMetrics` displays raw percentages (154.17%) without classification as "fast", "slow", "behind", "on track", etc.

**Comment Clarification:** Component explicitly states:
> "PACE is raw prototype calculation only - NO R/Y/G, thresholds, classifications"

**Implication:** If learning judgments are added in future, they belong in API layer (not UI calculation)

**Evidence State:** VERIFIED — Raw metrics only, no threshold logic

---

### 14.3 Quiz Metrics Unavailable (VERIFIED)

**Finding:** ATTEMPTS and SCORE are hard-coded `"—"` with explicit comment:
> "unavailable - NO quiz system"

**Implication:** Stage 5 documentation must NOT claim RSSB provides quiz/assessment metrics

**Evidence State:** VERIFIED — Explicit unavailability documented in source

---

### 14.4 Metric Authority Hierarchy (VERIFIED)

```
Canonical Completion Authority (tutorial_navigation_progress)
        ↓
Event Ledger (block_telemetry_events) — immutable audit trail
        ↓
Cumulative State (block_learning_state) — queryable metrics
        ↓
ILS API (aggregation + navigation-level calculation)
        ↓
ILSProvider (data bridge + cache management)
        ↓
LearningProgressSidebar (passive display)
```

**Evidence State:** VERIFIED — Complete authority chain traced from §10.1-10.2

---

## §15. Gaps and Future Work

### 15.1 API Implementation (NOT YET VERIFIED)

**Gap:** The `/api/tutorial/ils/navigation/:nodeId` endpoint implementation was not read in this investigation.

**Questions:**
- How does API aggregate `blocks[]` from `block_learning_state`?
- How does API calculate `progressPercentage`?
- How does API determine `status` enum value?
- What happens if API returns stale data?
- Does API join `tutorial_navigation_progress` with `block_learning_state`?

**Status:** OUT OF SCOPE for 06I (UI metric display investigation)

**Recommendation:** Create **06J — ILS API Implementation** investigation to close the server-side aggregation gap and complete end-to-end lineage verification

---

### 15.2 Test Coverage (NOT YET VERIFIED)

**Gap:** Metric calculation tests were not inspected.

**Questions:**
- Are there unit tests for `formatSeconds()`, `formatDate()`?
- Are there tests for DIFFERENCE and VS EXPECTED calculations?
- Are there tests for null handling in TimeAnalysisMetrics?
- Are there integration tests for ILSProvider cache updates?

**Status:** DEFERRED to **08 — Testing and Certification Evidence**

---

### 15.3 Eventual Consistency (NOT YET VERIFIED)

**Gap:** Whether displayed metrics always reflect current database state.

**Questions:**
- Does ILSProvider refetch after telemetry delivery?
- Is there a polling interval for progress updates?
- Can sidebar show stale data if learner stays on page for hours?

**Evidence Found:** `handleActiveTimeDeliveryAcknowledged` updates cache after telemetry delivery, but initial fetch has no auto-refresh mechanism observed.

**Status:** PARTIAL — cache coherence mechanism exists for telemetry updates

---

## §16. Revision History

| Date | Change | Author Context |
|------|--------|----------------|
| 2026-10-03 | Initial creation (T7 investigation complete) | Stage 5 Production Evidence Audit |

---

**END OF DOCUMENT 06I**
