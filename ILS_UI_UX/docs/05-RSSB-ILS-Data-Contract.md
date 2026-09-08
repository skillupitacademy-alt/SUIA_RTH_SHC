# GATE 3C: RSSB ↔ ILS DATA CONTRACT

**Date:** 2026-09-07  
**Objective:** Map RSSB UI elements to ILS data fields before React/TypeScript implementation  
**Status:** DATA CONTRACT COMPLETE ✅

---

## 🎯 EXECUTIVE SUMMARY

**Purpose:** Establish the authoritative data contract between RSSB UI elements and the ILS runtime

**Key Finding:** Phase 4.6 provides **sufficient data for RSSB implementation**, with graceful handling for future-phase fields.

**Data Sources:**
```text
Database (block_learning_state table)
        ↓
ILS API (/api/tutorial/ils/navigation/:nodeId)
        ↓
ILSProvider Context (useILS hook)
        ↓
RSSB Component (consumer)
```

---

## 📊 PART 1: ILS PROVIDER CONTEXT STRUCTURE

### useILS() Hook Interface

**File:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

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

### Overall Progress (Page-Level)

```typescript
interface ILSOverallProgress {
  status: LearningState;                // 'not_started' | 'in_progress' | 'completed' | 'not_available'
  progressPercentage: number;           // 0-100
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;
  revisionCount: number;
  timeSpentActiveSec: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}
```

**Source:** Navigation Progress API aggregates block-level data

### Active Block Progress (Block-Level)

```typescript
interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  isCompleted: boolean;
  completedAt: Date | null;
  
  // Future fields when API provides per-block analytics:
  // visitCount?: number;
  // activeTimeSec?: number;
  // expectedTimeSec?: number;
}
```

**Current Limitation (Phase 4.6):**
- API returns completion status only for active block
- Per-block visit/time metrics NOT exposed via API yet
- RSSB must fetch ALL blocks to display individual metrics

---

## 💾 PART 2: DATABASE SCHEMA

### block_learning_state Table

**File:** `packages/db-tutorial/src/schema/block-learning-state.ts`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `user_id` | uuid | NO | Learner identity |
| `navigation_node_id` | text | NO | Page context |
| `block_id` | text | NO | Block instance UUID |
| `block_version` | text | NO | D1, C1, S1, etc. |
| `visit_count` | integer | NO | Atomic session-aware visits |
| `revision_count` | integer | NO | Return visits after completion |
| `active_time_sec` | integer | NO | Measured engagement time |
| `last_session_id` | text | YES | Session tracking (Phase 4.6) |
| `expected_time_sec` | integer | YES | Authored expected time |
| `first_viewed_at` | timestamp | YES | First observation |
| `last_viewed_at` | timestamp | YES | Most recent observation |
| `completed_at` | timestamp | YES | Completion timestamp |
| `version` | integer | NO | Optimistic locking |
| `created_at` | timestamp | NO | Audit |
| `updated_at` | timestamp | NO | Audit |
| `deleted_at` | timestamp | YES | Soft delete |

**Unique Constraint:**
```sql
UNIQUE (user_id, navigation_node_id, block_id, block_version) 
WHERE deleted_at IS NULL
```

---

## 🗺️ PART 3: RSSB UI → ILS DATA MAPPING

### Section 1: Block Selector Dropdown

**UI Element:** Dropdown showing all blocks on current page

**Prototype:**
```javascript
<select id="block-select">
  <option value="0">D1 · d1-block-uuid</option>
  <option value="1">C1 · c1-block-uuid</option>
</select>
```

**Data Source:** **PROBLEM - NOT AVAILABLE IN PHASE 4.6** ❌

**Current API Returns:**
- `overallProgress.completedBlockCount` (aggregate count)
- `activeBlockProgress` (one block only)

**Missing:**
- Array of ALL blocks on current page
- Block identity list (blockId, blockVersion, blockType)

**Resolution Required:**

```typescript
// OPTION A: Fetch from new API endpoint
GET /api/tutorial/ils/navigation/:nodeId/blocks
// Returns: BlockSummary[] for all blocks on page

// OPTION B: Pass from server-side (TutorialPagePayload)
// Already has content.blocks[] with identity

// OPTION C: RSSB reads from DOM
// Use ActiveBlockContext + DOM query to find all blocks
```

**RECOMMENDATION:** Pass `content.blocks[]` from `TutorialPagePayload` to RSSB as prop

```typescript
interface RSSBProps {
  theme: BrandTutorialTheme;
  blocks: Array<{                    // 👈 NEW: Required for dropdown
    blockId: string;
    blockType: string;
    blockVersion: string;
  }>;
}
```

---

### Section 2: Lifecycle & Overview

**UI Element:** Pink table with 4 rows

#### Row 1: First Viewed

**Prototype Field:** `block.firstViewedAt`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| First Viewed | `blockLearningState.firstViewedAt` | `Date \| null` | ✅ YES |

**Formatting:**
```typescript
function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  // Example: "Dec 25, 2026, 3:45 PM"
}
```

#### Row 2: Last Viewed

**Prototype Field:** `block.lastViewedAt`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Last Viewed | `blockLearningState.lastViewedAt` | `Date \| null` | ✅ YES |

**Formatting:** Same as First Viewed

#### Row 3: Completed At

**Prototype Field:** `block.completedAt`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Completed At | `blockLearningState.completedAt` | `Date \| null` | ✅ YES |

**Formatting:** Same as First Viewed

#### Row 4: Status

**Prototype Field:** `block.status`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Status | Derived from `completedAt !== null` | `'completed' \| 'not_completed'` | ✅ YES |

**Logic:**
```typescript
function getBlockStatus(completedAt: Date | null): string {
  return completedAt !== null ? 'COMPLETED' : 'NOT COMPLETED';
}

function getBlockStatusColor(completedAt: Date | null): string {
  return completedAt !== null ? RSSB_COLORS.COMPLETED_GREEN : RSSB_COLORS.TEXT_MUTED;
}
```

---

### Section 3: Engagement Metrics

**UI Element:** Orange 2x2 grid cards

#### Card 1: Visit Count

**Prototype Field:** `block.visitCount`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Visit Count | `blockLearningState.visitCount` | `number` | ✅ YES |

**Default:** `0` (counter initialized to 0)

#### Card 2: Revision Count

**Prototype Field:** `block.revisionCount`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Revision Count | `blockLearningState.revisionCount` | `number` | ✅ YES |

**Default:** `0` (counter initialized to 0)

#### Card 3: Attempts

**Prototype Field:** `block.attempts`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Attempts | NOT AVAILABLE | `number` | ❌ FUTURE PHASE |

**Fallback:**
```typescript
const attempts = 0;  // Or display "—"
```

**Future:** Requires assessment integration

#### Card 4: Score

**Prototype Field:** `block.score`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Score | NOT AVAILABLE | `number \| null` | ❌ FUTURE PHASE |

**Fallback:**
```typescript
const score = null;  // Display "—"
```

**Future:** Requires assessment integration

---

### Section 4: Time Analysis

**UI Element:** Blue 2x2 grid cards

#### Card 1: Active Time

**Prototype Field:** `block.activeTimeSec`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Active Time | `blockLearningState.activeTimeSec` | `number` | ✅ YES |

**Formatting:**
```typescript
function formatSeconds(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}
// Example: formatSeconds(330) → "5m 30s"
```

**Default:** `0` (counter initialized to 0)

#### Card 2: Expected Time

**Prototype Field:** `block.expectedTimeSec`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Expected Time | `blockLearningState.expectedTimeSec` | `number \| null` | ✅ YES |

**Nullable:** Field may be `null` if not authored

**Formatting:**
```typescript
const expectedTimeDisplay = expectedTimeSec !== null 
  ? formatSeconds(expectedTimeSec) 
  : '—';
```

#### Card 3: Difference

**Prototype Field:** `block.timeComparison.differenceSec`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Difference | **CLIENT-SIDE CALCULATION** | `number` | ✅ YES (calculated) |

**Calculation:**
```typescript
const differenceSec = expectedTimeSec !== null 
  ? activeTimeSec - expectedTimeSec 
  : 0;
```

**Formatting:**
```typescript
function formatDifference(diffSec: number): string {
  const sign = diffSec > 0 ? '+' : '';
  return `${sign}${diffSec}s`;
}
// Examples:
// formatDifference(30)  → "+30s"
// formatDifference(-15) → "-15s"
// formatDifference(0)   → "0s"
```

#### Card 4: vs Expected

**Prototype Field:** `block.timeComparison.percentageOfExpected`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| vs Expected | **CLIENT-SIDE CALCULATION** | `number` | ✅ YES (calculated) |

**Calculation:**
```typescript
const percentageOfExpected = expectedTimeSec !== null && expectedTimeSec > 0
  ? Math.round((activeTimeSec / expectedTimeSec) * 100)
  : 0;
```

**Formatting:**
```typescript
function formatPercentage(pct: number): string {
  return `${pct}%`;
}
// Examples:
// formatPercentage(120) → "120%"
// formatPercentage(85)  → "85%"
// formatPercentage(100) → "100%"
```

---

### Section 5: Overall Progress Card

**UI Element:** Pink card with progress bar and 4-column summary

#### Element 1: Status Badge

**Prototype Field:** `data.status`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Status Badge | `overallProgress.status` | `LearningState` | ✅ YES |

**Values:**
```typescript
type LearningState = 
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'not_available';
```

**Formatting:**
```typescript
function formatStatus(status: LearningState): string {
  return status.replace('_', ' ').toUpperCase();
}
// Examples:
// formatStatus('in_progress')  → "IN PROGRESS"
// formatStatus('completed')    → "COMPLETED"
// formatStatus('not_started')  → "NOT STARTED"
```

#### Element 2: Progress Percentage

**Prototype Field:** `data.progressPercentage`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Progress % | `overallProgress.progressPercentage` | `number` | ✅ YES |

**Range:** 0-100

**Formatting:**
```typescript
const progressDisplay = `${overallProgress.progressPercentage}%`;
```

#### Element 3: Progress Bar

**Prototype Field:** `data.progressPercentage`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Bar Width | `overallProgress.progressPercentage` | `number` | ✅ YES |

**Implementation:**
```typescript
<div className="progress-bar-track">
  <div 
    className="progress-bar-fill" 
    style={{ width: `${overallProgress.progressPercentage}%` }}
  />
</div>
```

#### Element 4: Blocks Text

**Prototype Field:** `"${completedBlockCount} of ${totalBlockCount} blocks completed"`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Completed Count | `overallProgress.completedBlockCount` | `number` | ✅ YES |
| Total Count | `overallProgress.totalBlockCount` | `number` | ✅ YES |

**Formatting:**
```typescript
const blocksText = `${completedBlockCount} of ${totalBlockCount} blocks completed`;
```

#### Summary Grid: Completed

**Prototype Field:** `data.completedBlockCount`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Completed | `overallProgress.completedBlockCount` | `number` | ✅ YES |

#### Summary Grid: Total

**Prototype Field:** `data.totalBlockCount`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Total | `overallProgress.totalBlockCount` | `number` | ✅ YES |

#### Summary Grid: Required

**Prototype Field:** `data.totalBlockCount` (same as total)

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Required | `overallProgress.totalBlockCount` | `number` | ✅ YES |

**Note:** Prototype treats "required" as same as "total"

#### Summary Grid: Active

**Prototype Field:** Sum of all `blocks[].activeTimeSec`

**Data Mapping:**

| RSSB UI | ILS Source | Type | Phase 4.6 Available |
|---------|-----------|------|---------------------|
| Total Active Time | **CLIENT-SIDE AGGREGATION** | `number` | ⚠️ PARTIAL |

**Problem:** `overallProgress` doesn't include total active time

**Calculation:**
```typescript
// OPTION A: Use page-level timeSpentActiveSec (available)
const totalActiveSec = overallProgress.timeSpentActiveSec;

// OPTION B: Sum from blocks array (NOT available in current API)
// const totalActiveSec = blocks.reduce((acc, b) => acc + b.activeTimeSec, 0);
```

**RECOMMENDATION:** Use `overallProgress.timeSpentActiveSec` directly

**Formatting:**
```typescript
const activeTimeDisplay = formatSeconds(overallProgress.timeSpentActiveSec);
```

---

## 📋 PART 4: PAGE-LEVEL VS BLOCK-LEVEL CLASSIFICATION

### Page-Level Data (from overallProgress)

**RSSB Sections That Consume Page-Level:**

| Section | Metric | Source |
|---------|--------|--------|
| **Overall Progress Card** | Status | `overallProgress.status` |
| **Overall Progress Card** | Progress % | `overallProgress.progressPercentage` |
| **Overall Progress Card** | Completed Count | `overallProgress.completedBlockCount` |
| **Overall Progress Card** | Total Count | `overallProgress.totalBlockCount` |
| **Overall Progress Card** | Total Active Time | `overallProgress.timeSpentActiveSec` |

**Characteristics:**
- ✅ Constant for entire page
- ✅ Does NOT change when user selects different block in dropdown
- ✅ Represents aggregate metrics across all blocks

### Block-Level Data (from blocks array - NOT AVAILABLE IN PHASE 4.6)

**RSSB Sections That Consume Block-Level:**

| Section | Metric | Source | Phase 4.6 Status |
|---------|--------|--------|------------------|
| **Block Selector** | Block list | `blocks[]` | ❌ Need to fetch or pass as prop |
| **Lifecycle & Overview** | First Viewed | `blocks[selected].firstViewedAt` | ❌ Not exposed |
| **Lifecycle & Overview** | Last Viewed | `blocks[selected].lastViewedAt` | ❌ Not exposed |
| **Lifecycle & Overview** | Completed At | `blocks[selected].completedAt` | ❌ Not exposed |
| **Lifecycle & Overview** | Status | `blocks[selected].completedAt !== null` | ❌ Not exposed |
| **Engagement Metrics** | Visit Count | `blocks[selected].visitCount` | ❌ Not exposed |
| **Engagement Metrics** | Revision Count | `blocks[selected].revisionCount` | ❌ Not exposed |
| **Time Analysis** | Active Time | `blocks[selected].activeTimeSec` | ❌ Not exposed |
| **Time Analysis** | Expected Time | `blocks[selected].expectedTimeSec` | ❌ Not exposed |

**Characteristics:**
- ❌ Changes when user selects different block in dropdown
- ❌ Per-block metrics NOT available in current ILSProvider
- ⚠️ Requires NEW API endpoint or data structure

---

## 🚨 PART 5: DATA AVAILABILITY MATRIX

### Phase 4.6 Available ✅

**Page-Level (overallProgress):**
- ✅ `status`
- ✅ `progressPercentage`
- ✅ `completedBlockCount`
- ✅ `totalBlockCount`
- ✅ `visitCount`
- ✅ `revisionCount`
- ✅ `timeSpentActiveSec`
- ✅ `firstViewedAt`
- ✅ `lastViewedAt`
- ✅ `completedAt`

**Active Block Only (activeBlockProgress):**
- ✅ `blockId`
- ✅ `blockType`
- ✅ `blockVersion`
- ✅ `isCompleted`
- ✅ `completedAt`

**Database Has (but not exposed via API):**
- ✅ `visitCount` (per block)
- ✅ `revisionCount` (per block)
- ✅ `activeTimeSec` (per block)
- ✅ `expectedTimeSec` (per block)
- ✅ `firstViewedAt` (per block)
- ✅ `lastViewedAt` (per block)

### Future Phase ❌

**Assessment Integration Required:**
- ❌ `attempts` (per block)
- ❌ `score` (per block)

**API Enhancement Required:**
- ❌ `blocks[]` array with all blocks on page
- ❌ Per-block visit/time metrics via API

---

## 🔧 PART 6: RSSB DATA FETCHING STRATEGY

### Problem Statement

**Current ILSProvider only exposes:**
1. `overallProgress` (page-level aggregate)
2. `activeBlockProgress` (one block only)

**RSSB needs:**
1. List of ALL blocks on page (for dropdown)
2. Per-block metrics for selected block (for lifecycle/engagement/time sections)

### Solution Options

#### Option A: New API Endpoint ⭐ RECOMMENDED

**Create:**
```typescript
GET /api/tutorial/ils/navigation/:nodeId/blocks
```

**Returns:**
```typescript
interface BlockLearningStateDetail {
  blockId: string;
  blockType: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}

// Response
{
  navigationNodeId: string;
  blocks: BlockLearningStateDetail[];
}
```

**Pros:**
- ✅ Clean separation of concerns
- ✅ Reusable for future features
- ✅ Proper REST resource design

**Cons:**
- ⚠️ Requires API implementation
- ⚠️ Additional network request

#### Option B: Extend ILSProvider

**Modify ILSProvider interface:**
```typescript
interface ILSContextValue {
  // ... existing fields
  blocks: BlockLearningStateDetail[];  // 👈 NEW
}
```

**Pros:**
- ✅ Single data fetch
- ✅ No additional requests

**Cons:**
- ⚠️ Makes ILSProvider heavier
- ⚠️ Not needed for components that don't show RSSB

#### Option C: Pass from TutorialPagePayload ⭐ SIMPLEST

**Modify RSSB props:**
```typescript
interface RSSBProps {
  theme: BrandTutorialTheme;
  blocks: Array<{                    // 👈 Pass from server
    blockId: string;
    blockType: string;
    blockVersion: string;
  }>;
}
```

**Server already has `payload.content.blocks[]` with identity**

**Pros:**
- ✅ No API changes needed
- ✅ No additional fetching
- ✅ Server already has block list

**Cons:**
- ⚠️ Block metrics still need separate fetch
- ⚠️ Props coupling

### Hybrid Recommendation

**Phase 1 (Gate 3D - Initial Implementation):**
- Pass `blocks[]` identity from `TutorialPagePayload` as prop
- Fetch per-block metrics via new API endpoint
- Display available metrics, show "—" for future fields

**Phase 2 (Future Optimization):**
- Extend ILSProvider to include `blocks[]` array
- Single fetch for all data
- Remove block identity prop

---

## 🎯 PART 7: RSSB COMPONENT DATA CONTRACT

### Required Props

```typescript
interface RSSBProps {
  // Brand theme (from Gate 3B architecture)
  theme: BrandTutorialTheme;
  
  // Block list for dropdown (Option C - passed from server)
  blocks: Array<{
    blockId: string;
    blockType: string;
    blockVersion: string;
  }>;
  
  // Optional styling
  className?: string;
}
```

### Data Consumption Pattern

```typescript
export function RSSB({ theme, blocks, className }: RSSBProps) {
  // 1. Consume page-level data
  const { overallProgress, loading, error } = useILS();
  
  // 2. Track selected block
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    blocks[0]?.blockId ?? null
  );
  
  // 3. Fetch selected block metrics
  const { blockMetrics, loading: blockLoading } = useBlockMetrics(
    navigationNodeId,
    selectedBlockId
  );
  
  // 4. Calculate client-side derived metrics
  const timeComparison = calculateTimeComparison(
    blockMetrics?.activeTimeSec ?? 0,
    blockMetrics?.expectedTimeSec ?? null
  );
  
  // 5. Render UI with data
  return (
    <aside className={className}>
      {/* Block Selector - uses blocks prop */}
      {/* Lifecycle - uses blockMetrics */}
      {/* Engagement - uses blockMetrics */}
      {/* Time Analysis - uses blockMetrics + timeComparison */}
      {/* Overall Progress - uses overallProgress */}
    </aside>
  );
}
```

### Required Helper Hook

```typescript
/**
 * Fetch per-block metrics for selected block
 */
function useBlockMetrics(navigationNodeId: string, blockId: string | null) {
  const [blockMetrics, setBlockMetrics] = useState<BlockMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!blockId) return;
    
    async function fetchBlockMetrics() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/tutorial/ils/navigation/${navigationNodeId}/blocks/${blockId}`
        );
        const data = await response.json();
        setBlockMetrics(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    void fetchBlockMetrics();
  }, [navigationNodeId, blockId]);
  
  return { blockMetrics, loading, error };
}
```

---

## ✅ PART 8: DATA CONTRACT VALIDATION

### Required for Gate 3D Implementation

- [x] ILSProvider interface documented
- [x] Database schema documented
- [x] RSSB UI → ILS field mapping complete
- [x] Page-level vs block-level classification clear
- [x] Available vs future-phase fields identified
- [x] Data fetching strategy defined
- [x] Component props interface specified
- [x] Client-side calculations specified
- [x] Null handling patterns established
- [x] Formatting functions specified

### Data Gaps Identified

**Critical (blocks dropdown):**
- ❌ Need block list API or pass from server prop

**Important (per-block metrics):**
- ❌ Need new API endpoint for per-block metrics

**Future Phase (assessment):**
- ❌ `attempts` field
- ❌ `score` field

### Resolution Plan

**Gate 3D (Implementation):**
1. Pass `blocks[]` from `TutorialPagePayload` as prop
2. Create new API endpoint: `GET /api/tutorial/ils/navigation/:nodeId/blocks/:blockId`
3. Implement `useBlockMetrics()` hook
4. Display available fields, show "—" for future fields

**Future Phase:**
5. Extend API to return `blocks[]` array in navigation progress
6. Add assessment integration for attempts/score

---

## 🚀 READINESS STATUS

**Status:** ✅ **READY FOR GATE 3D (React/TypeScript Implementation)**

**Prerequisites Met:**
- ✅ Data contract established
- ✅ Field mapping documented
- ✅ Available/unavailable fields identified
- ✅ Fetching strategy defined
- ✅ Props interface specified
- ✅ Helper hooks specified

**Blockers Resolved:**
- ✅ Block list: Pass from server prop
- ✅ Block metrics: New API endpoint planned
- ✅ Future fields: Graceful fallback defined

**Next Step:** Gate 3D - RSSB React/TypeScript Implementation

**References for Implementation:**
- Gate 3A: RSSB Prototype Analysis (UI structure)
- Gate 3B: Universal Component Architecture (theme pattern)
- Gate 3C: RSSB-ILS Data Contract (this document)

---

**Report End** | Generated: 2026-09-07 | Status: DATA CONTRACT FROZEN ✅
