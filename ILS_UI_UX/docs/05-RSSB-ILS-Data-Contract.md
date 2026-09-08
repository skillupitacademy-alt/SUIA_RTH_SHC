# GATE 3C: RSSB ↔ ILS DATA CONTRACT (REVISED)

**Date:** 2026-09-08  
**Status:** ⚠️ ARCHITECTURE CORRECTED - IMPLEMENTATION PENDING

---

## ⚠️ CRITICAL ARCHITECTURAL CORRECTION

**Previous Error:** Gate 3C incorrectly proposed a "block selector dropdown" allowing users to choose which block RSSB displays.

**Correct Architecture:**
```text
IntersectionObserver (viewport tracking)
        ↓
ActiveBlockContext (runtime determines active block)
        ↓
ILSProvider (fetches metrics for active block)
        ↓
RSSB (passive observer - displays active block only)
```

**Key Principle:** **RSSB NEVER SELECTS THE BLOCK.** The viewport determines which block is active. RSSB passively reflects that state.

---

## 🔍 CRITICAL IMPLEMENTATION CLARIFICATION

**THE BACKEND METRICS INFRASTRUCTURE ALREADY EXISTS.**

This is **NOT** a greenfield implementation. This is a **READ-PATH ENHANCEMENT**.

**Already Implemented (Phase 4.6):**
- ✅ `block_learning_state` database table with all required fields
- ✅ `BlockLearningStateRepository` with upsert/write operations
- ✅ `LearningProgressService` recording methods (recordBlockActiveTime, recordBlockVisit, etc.)
- ✅ Block metric persistence (visit_count, revision_count, active_time_sec, etc.)
- ✅ Runtime integration (IntersectionObserver → ActiveBlockContext → telemetry)

**Evidence:** Runtime logs show `BlockLearningStateRepository.upsert()` executing with block identities (D1, C1) and metric values (active_time_sec: 14, etc.)

**What's Missing:**
- ❌ Repository READ method for block states (may exist but underutilized)
- ❌ `getNavigationProgress()` querying block_learning_state table
- ❌ Navigation API exposing full block metrics
- ❌ ILSProvider mapping complete metrics to activeBlockProgress

**Implementation Mandate:**
> **INVESTIGATE FIRST. REUSE EXISTING INFRASTRUCTURE. DO NOT REBUILD THE BACKEND.**

This task is primarily about **exposing existing persisted data through the ILS read contract**, not creating new metric recording logic.

---

## 🎯 EXECUTIVE SUMMARY

**Purpose:** Establish the authoritative data contract between RSSB and ILS runtime

**Current State (Phase 4.6):**
- ✅ ActiveBlockContext exists and works correctly
- ✅ ILSProvider exists and consumes ActiveBlockContext
- ⚠️ ILSProvider exposes **only completion status** for active block
- ❌ ILSProvider does NOT expose full block metrics (visit count, time, etc.)

**Data Gap Identified:**
```typescript
// Current (insufficient)
interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  isCompleted: boolean;
  completedAt: Date | null;
}

// Required for RSSB
interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  visitCount: number;              // ❌ Missing
  revisionCount: number;           // ❌ Missing
  activeTimeSec: number;           // ❌ Missing
  expectedTimeSec: number | null;  // ❌ Missing
  firstViewedAt: Date | null;      // ❌ Missing
  lastViewedAt: Date | null;       // ❌ Missing
  completedAt: Date | null;        // ✅ Exists
  isCompleted: boolean;            // ✅ Exists
}
```

---

## 📐 PART 1: CORRECT ARCHITECTURE

### Verified Runtime Flow

**File Locations:**
- ActiveBlockContext: `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`
- ILSProvider: `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- LearningProgressService: `packages/db-tutorial/src/services/learning-progress.service.ts`
- block_learning_state schema: `packages/db-tutorial/src/schema/block-learning-state.ts`

**Actual Data Flow:**
```text
1. DOM blocks have data-block-id, data-block-type, data-block-version
        ↓
2. IntersectionObserver watches viewport
        ↓
3. ActiveBlockContext exposes: { blockId, blockType, blockVersion } | null
        ↓
4. ILSProvider calls: GET /api/tutorial/ils/navigation/:nodeId
        ↓
5. API returns: NavigationProgressResponse
        ↓
6. ILSProvider derives activeBlockProgress from completedBlocks[]
        ↓
7. useILS() exposes: { overallProgress, activeBlockProgress, loading, error }
        ↓
8. RSSB consumes useILS()
```

**What RSSB Does NOT Do:**
- ❌ Select which block to display
- ❌ Maintain `selectedBlockId` state
- ❌ Query DOM for blocks
- ❌ Call ILS APIs directly
- ❌ Fetch block metrics independently
- ❌ Use `useBlockMetrics()` hook
- ❌ Receive `blocks[]` prop for selection
- ❌ Render a dropdown/selector

---

## 📊 PART 2: CURRENT API RESPONSE (Phase 4.6)

### Navigation Progress API

**Endpoint:** `GET /api/tutorial/ils/navigation/:nodeId?subtopicId=xxx`

**Current Response Structure:**
```typescript
interface NavigationProgressWithCalculatedDTO {
  // Navigation identity
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  
  // Page-level learning state
  status: LearningState;
  progressPercentage: number;
  
  // Block completion (minimal)
  completedBlocks: Array<{
    blockId: string;
    blockVersion: string;
    completedAt: string;  // ISO timestamp
  }>;
  completedBlockCount: number;
  totalBlockCount: number;
  requiredBlocks: Array<{
    blockId: string;
    blockVersion: string;
  }>;
  
  // Page-level metrics
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}
```

**What's Missing:**
- ❌ Per-block `visitCount`
- ❌ Per-block `revisionCount`
- ❌ Per-block `activeTimeSec`
- ❌ Per-block `expectedTimeSec`
- ❌ Per-block `firstViewedAt`
- ❌ Per-block `lastViewedAt`

**These fields exist in `block_learning_state` table but are NOT exposed via API.**

---

## 💾 PART 3: DATABASE SCHEMA (Verified)

### block_learning_state Table

**Has ALL required fields:**

| Column | Type | Nullable | Available |
|--------|------|----------|-----------|
| `user_id` | uuid | NO | ✅ |
| `navigation_node_id` | text | NO | ✅ |
| `block_id` | text | NO | ✅ |
| `block_version` | text | NO | ✅ |
| `visit_count` | integer | NO | ✅ |
| `revision_count` | integer | NO | ✅ |
| `active_time_sec` | integer | NO | ✅ |
| `expected_time_sec` | integer | YES | ✅ |
| `first_viewed_at` | timestamp | YES | ✅ |
| `last_viewed_at` | timestamp | YES | ✅ |
| `completed_at` | timestamp | YES | ✅ |

**Unique Constraint:**
```sql
UNIQUE (user_id, navigation_node_id, block_id, block_version)
WHERE deleted_at IS NULL
```

**Conclusion:** Database has the data. API doesn't expose it.

---

## 🗺️ PART 4: RSSB UI → DATA MAPPING

### Page-Level (overallProgress)

| RSSB Section | Metric | Source | Available |
|--------------|--------|--------|-----------|
| **Overall Progress Card** | Status | `overallProgress.status` | ✅ |
| **Overall Progress Card** | Progress % | `overallProgress.progressPercentage` | ✅ |
| **Overall Progress Card** | Completed Count | `overallProgress.completedBlockCount` | ✅ |
| **Overall Progress Card** | Total Count | `overallProgress.totalBlockCount` | ✅ |
| **Overall Progress Card** | Total Active Time | `overallProgress.timeSpentActiveSec` | ✅ |

### Block-Level (activeBlockProgress - REQUIRED)

| RSSB Section | Metric | Required Field | Currently Available |
|--------------|--------|----------------|---------------------|
| **Lifecycle & Overview** | First Viewed | `firstViewedAt` | ❌ |
| **Lifecycle & Overview** | Last Viewed | `lastViewedAt` | ❌ |
| **Lifecycle & Overview** | Completed At | `completedAt` | ✅ |
| **Lifecycle & Overview** | Status | `isCompleted` | ✅ |
| **Engagement Metrics** | Visit Count | `visitCount` | ❌ |
| **Engagement Metrics** | Revision Count | `revisionCount` | ❌ |
| **Engagement Metrics** | Attempts | N/A (future) | ❌ |
| **Engagement Metrics** | Score | N/A (future) | ❌ |
| **Time Analysis** | Active Time | `activeTimeSec` | ❌ |
| **Time Analysis** | Expected Time | `expectedTimeSec` | ❌ |
| **Time Analysis** | Difference | `activeTimeSec - expectedTimeSec` | ❌ |
| **Time Analysis** | vs Expected | `(activeTimeSec / expectedTimeSec) * 100` | ❌ |

**Legend:**
- ✅ Currently available in `activeBlockProgress`
- ❌ Exists in database but NOT exposed via ILSProvider

---

## 🚨 PART 5: THE CORE PROBLEM

**CRITICAL CLARIFICATION:** The backend block-level metrics infrastructure **ALREADY EXISTS**.

### Write Path (ALREADY IMPLEMENTED ✅)

```text
IntersectionObserver
        ↓
ActiveBlockContext
        ↓
Block activity tracking
        ↓
LearningProgressService.recordBlockActiveTime()
LearningProgressService.recordBlockVisit()
        ↓
BlockLearningStateRepository.upsert()
        ↓
block_learning_state table
        ↓
METRICS PERSISTED:
- visit_count
- revision_count
- active_time_sec
- expected_time_sec
- first_viewed_at
- last_viewed_at
- completed_at
```

**Evidence:** Runtime logs show `BlockLearningStateRepository.upsert()` executing with block identity (D1, C1, etc.) and `active_time_sec` values.

### Read Path (INCOMPLETE ❌)

```text
block_learning_state table
        ↓
BlockLearningStateRepository (read method?)
        ↓
LearningProgressService.getNavigationProgress()
        ↓
    ⚠️ Currently returns limited block data
        ↓
NavigationProgressResponse
        ↓
    ⚠️ Only includes completedBlocks[] (minimal)
        ↓
ILSProvider
        ↓
    ⚠️ Only exposes isCompleted + completedAt
        ↓
RSSB
        ↓
    ❌ Cannot render most sections
```

### The Gap

**NOT MISSING:**
- ✅ Database schema
- ✅ Metric recording logic
- ✅ Repository upsert operations
- ✅ Service write methods
- ✅ Block-level persistence

**MISSING:**
- ❌ Repository read method for block states (or underutilized existing method)
- ❌ Service querying block_learning_state in getNavigationProgress()
- ❌ API exposing full block metrics
- ❌ ILSProvider mapping complete metrics to activeBlockProgress

### What Gate 3C Actually Needs

```text
INVESTIGATE:
        ↓
Existing BlockLearningStateRepository
        ↓
Does read method exist?
        │
        ├─ YES → Reuse it
        └─ NO  → Add minimal read method
        ↓
ENHANCE:
        ↓
LearningProgressService.getNavigationProgress()
        ↓
Query existing block_learning_state records
        ↓
Map to blocks[] DTO
        ↓
EXPOSE:
        ↓
Navigation API returns blocks[]
        ↓
ILSProvider stores blocks[] internally
        ↓
ILSProvider resolves activeBlockProgress from blocks[]
        ↓
RSSB consumes complete activeBlockProgress
```

**This is a READ-SIDE enhancement, NOT a backend rebuild.**

---

## 💡 PART 6: SOLUTION (RECOMMENDED)

### Option A: Extend Navigation API Response ⭐

**Modify:** `LearningProgressService.getNavigationProgress()`

**Add Query:**
```typescript
// After getting navigation progress, query block states
const blockStates = await this.blockRepository.getBlockStates(
  identity.userId,
  navigationNodeId,
  requiredBlocks.map(b => ({ blockId: b.blockId, blockVersion: b.blockVersion }))
);
```

**Enhanced Response:**
```typescript
interface NavigationProgressWithCalculatedDTO {
  // ... existing page-level fields
  
  blocks: Array<{                        // 👈 NEW
    blockId: string;
    blockVersion: string;
    blockType: string;                   // From requiredBlocks metadata
    visitCount: number;
    revisionCount: number;
    activeTimeSec: number;
    expectedTimeSec: number | null;
    firstViewedAt: string | null;
    lastViewedAt: string | null;
    completedAt: string | null;
  }>;
}
```

**Why This Approach:**
1. ✅ Single API call - all data loaded at page open
2. ✅ Instant block switching - no network request when scrolling
3. ✅ Clean architecture - ILSProvider has complete dataset
4. ✅ RSSB remains passive - just looks up active block in dataset
5. ✅ Backwards compatible - existing consumers unaffected

**Implementation Steps:**

**⚠️ CRITICAL: Investigate before implementing**

1. **Inspect existing `BlockLearningStateRepository`** - Does a read method already exist?
2. **Verify existing write path** - Confirm metrics are being recorded correctly
3. **Inspect `LearningProgressService.getNavigationProgress()`** - What does it currently do?
4. **Reuse or minimally extend** - Do NOT rebuild what exists
5. Add repository read for block states (only if needed)
6. Enhance `getNavigationProgress()` to query block states
7. Add `blocks[]` to DTO (backwards compatible)
8. Update `NavigationProgressResponse` interface
9. Update `ILSProvider` to store `blocks[]` internally
10. Enhance `ILSActiveBlockProgress` interface
11. ILSProvider resolves active block from internal `blocks[]` array

---

## 🎯 PART 7: ILSPROVIDER ENHANCEMENT

### Current Implementation

```typescript
// ILSProvider.tsx (simplified)
const { activeBlock } = useActiveBlock();

// Fetch navigation progress
const progress = await fetch(`/api/tutorial/ils/navigation/${nodeId}`);

// Derive active block progress
const completedBlock = progress.completedBlocks.find(
  b => b.blockId === activeBlock.blockId && b.blockVersion === activeBlock.blockVersion
);

setActiveBlockProgress({
  blockId: activeBlock.blockId,
  blockType: activeBlock.blockType,
  blockVersion: activeBlock.blockVersion,
  isCompleted: !!completedBlock,
  completedAt: completedBlock?.completedAt ?? null,
});
```

### Enhanced Implementation

```typescript
// ILSProvider.tsx (enhanced)
const { activeBlock } = useActiveBlock();

// Fetch navigation progress (now includes blocks[])
const progress = await fetch(`/api/tutorial/ils/navigation/${nodeId}`);

// Store blocks internally
const blocksRef = useRef(progress.blocks);

// Resolve active block progress
const activeBlockData = blocksRef.current.find(
  b => b.blockId === activeBlock.blockId && b.blockVersion === activeBlock.blockVersion
);

setActiveBlockProgress(
  activeBlockData
    ? {
        blockId: activeBlockData.blockId,
        blockType: activeBlockData.blockType,
        blockVersion: activeBlockData.blockVersion,
        visitCount: activeBlockData.visitCount,
        revisionCount: activeBlockData.revisionCount,
        activeTimeSec: activeBlockData.activeTimeSec,
        expectedTimeSec: activeBlockData.expectedTimeSec,
        firstViewedAt: activeBlockData.firstViewedAt 
          ? new Date(activeBlockData.firstViewedAt) 
          : null,
        lastViewedAt: activeBlockData.lastViewedAt 
          ? new Date(activeBlockData.lastViewedAt) 
          : null,
        completedAt: activeBlockData.completedAt 
          ? new Date(activeBlockData.completedAt) 
          : null,
        isCompleted: activeBlockData.completedAt !== null,
      }
    : null
);
```

**Key Points:**
- ✅ `blocks[]` remains internal to ILSProvider
- ✅ RSSB never sees `blocks[]` array
- ✅ RSSB only receives `activeBlockProgress`
- ✅ No network request when active block changes (scroll)

---

## 📋 PART 8: RSSB DATA CONTRACT (FINAL)

### RSSB Props

```typescript
interface RSSBProps {
  theme: BrandTutorialTheme;  // From Gate 3B
  className?: string;
}
```

**NO `blocks[]` prop.**  
**NO `selectedBlockId` prop.**  
**NO selection mechanism.**

### RSSB Data Consumption

```typescript
export function RSSB({ theme, className }: RSSBProps) {
  // Consume ILS data
  const { overallProgress, activeBlockProgress, loading, error } = useILS();
  
  // Calculate derived metrics
  const timeComparison = useMemo(() => {
    if (!activeBlockProgress?.expectedTimeSec) return null;
    
    const diff = activeBlockProgress.activeTimeSec - activeBlockProgress.expectedTimeSec;
    const pct = Math.round(
      (activeBlockProgress.activeTimeSec / activeBlockProgress.expectedTimeSec) * 100
    );
    
    return { differenceSec: diff, percentageOfExpected: pct };
  }, [activeBlockProgress]);
  
  // Render sections
  return (
    <aside className={className}>
      {/* Lifecycle & Overview - uses activeBlockProgress */}
      {/* Engagement Metrics - uses activeBlockProgress */}
      {/* Time Analysis - uses activeBlockProgress + timeComparison */}
      {/* Overall Progress - uses overallProgress */}
    </aside>
  );
}
```

---

## ✅ PART 9: NULL/LOADING/ERROR SEMANTICS

### No Active Block

```typescript
activeBlockProgress = null
```

**RSSB Behavior:** Display "No block active" or empty state

### Loading State

```typescript
loading = true
```

**RSSB Behavior:** Show skeleton/loading indicators

### API Error

```typescript
error !== null
```

**RSSB Behavior:** Show error message, allow retry via `refresh()`

### Missing Expected Time

```typescript
activeBlockProgress.expectedTimeSec = null
```

**RSSB Behavior:** 
- Show "Active Time" value
- Show "Expected Time" as "—"
- Show "Difference" as "—"
- Show "vs Expected" as "—"

### Missing First/Last Viewed

```typescript
activeBlockProgress.firstViewedAt = null
activeBlockProgress.lastViewedAt = null
```

**RSSB Behavior:** Show "—"

### Not Completed

```typescript
activeBlockProgress.completedAt = null
activeBlockProgress.isCompleted = false
```

**RSSB Behavior:** Show status as "NOT COMPLETED"

---

## 🚀 PART 10: IMPLEMENTATION SEQUENCE

### Phase 1: Investigation ✅ COMPLETE

- [x] Verify ActiveBlockContext implementation
- [x] Verify ILSProvider implementation
- [x] Verify current API response
- [x] Verify database schema
- [x] Identify data gap

### Phase 2: Repository Investigation & Enhancement (NEXT)

- [ ] **INVESTIGATE:** Inspect `BlockLearningStateRepository` for existing read methods
- [ ] **INVESTIGATE:** Verify existing metric recording (write path)
- [ ] **INVESTIGATE:** Inspect `LearningProgressService.getNavigationProgress()` current implementation
- [ ] **REUSE OR EXTEND:** Add/enhance repository read method (only if needed)
- [ ] **ENHANCE:** Modify `getNavigationProgress()` to query block states
- [ ] Add `blocks[]` to navigation response DTO (backwards compatible)
- [ ] Update API response interface
- [ ] Write tests for enhanced read path
- [ ] Verify backwards compatibility
- [ ] Verify no regressions in write path

### Phase 3: ILSProvider Enhancement

- [ ] Update `NavigationProgressResponse` interface
- [ ] Store `blocks[]` internally in ILSProvider
- [ ] Enhance `ILSActiveBlockProgress` interface
- [ ] Update active block resolution logic
- [ ] Write tests for enhanced ILSProvider
- [ ] Verify no regressions

### Phase 4: Gate 3C Documentation

- [ ] Finalize this document
- [ ] Remove all selector/dropdown concepts
- [ ] Document complete data flow
- [ ] Define null/error semantics
- [ ] Define derived metric calculations
- [ ] Mark as FROZEN

### Phase 5: Gate 3D (NOT YET)

- [ ] RSSB React/TypeScript implementation
- [ ] Consume enhanced `activeBlockProgress`
- [ ] Implement all UI sections
- [ ] Apply brand theming (Gate 3B)
- [ ] Browser verification

---

## 📊 PART 11: DATA AVAILABILITY MATRIX

| Metric | Database | API | ILSProvider | RSSB | Status |
|--------|----------|-----|-------------|------|--------|
| **Page-Level** |
| Status | ✅ | ✅ | ✅ | ✅ | Ready |
| Progress % | ✅ | ✅ | ✅ | ✅ | Ready |
| Completed Count | ✅ | ✅ | ✅ | ✅ | Ready |
| Total Count | ✅ | ✅ | ✅ | ✅ | Ready |
| Page Visit Count | ✅ | ✅ | ✅ | ✅ | Ready |
| Page Revision Count | ✅ | ✅ | ✅ | ✅ | Ready |
| Page Active Time | ✅ | ✅ | ✅ | ✅ | Ready |
| **Block-Level** |
| Block ID | ✅ | ✅ | ✅ | ✅ | Ready |
| Block Type | ✅ | ✅ | ✅ | ✅ | Ready |
| Block Version | ✅ | ✅ | ✅ | ✅ | Ready |
| Completed At | ✅ | ✅ | ✅ | ✅ | Ready |
| Is Completed | ✅ | ✅ | ✅ | ✅ | Ready |
| Visit Count | ✅ | ❌ | ❌ | ❌ | **Needs API** |
| Revision Count | ✅ | ❌ | ❌ | ❌ | **Needs API** |
| Active Time | ✅ | ❌ | ❌ | ❌ | **Needs API** |
| Expected Time | ✅ | ❌ | ❌ | ❌ | **Needs API** |
| First Viewed At | ✅ | ❌ | ❌ | ❌ | **Needs API** |
| Last Viewed At | ✅ | ❌ | ❌ | ❌ | **Needs API** |
| Attempts | ❌ | ❌ | ❌ | ❌ | Future (assessment) |
| Score | ❌ | ❌ | ❌ | ❌ | Future (assessment) |

---

## 🎯 PART 12: ACCEPTANCE CRITERIA

### Gate 3C is FROZEN when:

**Architecture:**
- [ ] No dropdown/selector in RSSB
- [ ] No `selectedBlockId` state
- [ ] No `blocks[]` prop to RSSB
- [ ] No `useBlockMetrics()` API-fetching hook
- [ ] RSSB is passive consumer of `useILS()`
- [ ] ActiveBlockContext is authoritative for active block
- [ ] ILSProvider is authoritative for ILS data

**Data:**
- [ ] `activeBlockProgress` includes all required fields
- [ ] Navigation API returns enhanced response
- [ ] ILSProvider stores blocks internally
- [ ] ILSProvider resolves active block correctly
- [ ] Null/error semantics defined
- [ ] Derived metrics calculations defined

**Quality:**
- [ ] API tests pass
- [ ] ILSProvider tests pass
- [ ] No regressions in existing consumers
- [ ] TypeScript compiles
- [ ] Documentation complete

**Readiness:**
- [ ] Gate 3D can proceed with confidence
- [ ] No architectural debt introduced
- [ ] No premature RSSB implementation

---

## 📝 PART 13: KEY DECISIONS

### ✅ APPROVED

1. **RSSB shows ONLY active block** (viewport-determined)
2. **ILSProvider is the data boundary** (RSSB never calls APIs)
3. **Extend navigation API** (not create separate block endpoint)
4. **blocks[] stored internally** (not exposed to RSSB)
5. **Single fetch at page load** (no request per scroll)

### ❌ REJECTED

1. Block selector dropdown
2. User choosing which block to view
3. `selectedBlockId` state
4. `GET /api/tutorial/ils/blocks/:blockId` endpoint
5. `useBlockMetrics()` hook in RSSB
6. Passing `blocks[]` to RSSB as prop
7. RSSB making API calls

---

## 🚀 NEXT STEP

**DO NOT PROCEED TO GATE 3D YET.**

**Next Action:** Implement API/ILSProvider enhancements (Phase 2-3 above)

**After Implementation:** Freeze Gate 3C documentation and mark as ready for Gate 3D

---

**Report End** | Status: ARCHITECTURE CORRECTED - AWAITING IMPLEMENTATION ⚠️
