# Phase 4.5 Preflight Report - Runtime Integration

**Date:** 2026-09-05  
**Phase:** 4.5 - Runtime Integration (Block-Level ILS)  
**Status:** Preflight Inspection Complete - AWAITING AUTHORIZATION

---

## Baseline Verification

✅ **Branch:** main  
✅ **Commit:** `f3405900` - Phase 4.4 API Layer certified  
✅ **Working Tree:** Clean  
✅ **Foundation:**
- Phase 4.1: ✅ Schema + Migration
- Phase 4.2: ✅ BlockLearningStateRepository
- Phase 4.3: ✅ LearningProgressService block methods
- Phase 4.4: ✅ Block-level API endpoints (visit + active-time)

---

## Current Runtime Architecture Discovery

### 1. Existing Runtime Components (FOUND)

**Location:** `packages/ui/src/tutorial/runtime/`

#### ActiveBlockContext.tsx
**Purpose:** Viewport-based active block detection  
**Status:** ✅ Implemented (Phase 3)  
**Mechanism:** IntersectionObserver with anchor zone (top 25% viewport)

**Key Features:**
- Tracks which block is currently "active" based on viewport position
- Extracts block identity from DOM attributes (`data-block-id`, `data-block-type`, `data-block-version`)
- Deterministic selection algorithm (anchor zone intersection)
- Does NOT call APIs
- Does NOT track time or visits
- Does NOT persist state

**Exposed via:**
```typescript
const { activeBlock } = useActiveBlock();
// activeBlock: { blockId, blockType, blockVersion? } | null
```

#### ILSProvider.tsx
**Purpose:** Data context layer (bridge ActiveBlockContext → ILS API)  
**Status:** ✅ Implemented (Phase 4) - **BUT NOT INTEGRATED INTO PAGES**  
**Responsibility:** Fetches navigation-level progress data from API

**Key Features:**
- Provides `overallProgress` (navigation-level metrics)
- Provides `activeBlockProgress` (completion status only)
- Does NOT track visits
- Does NOT track time
- Does NOT call block-level APIs (only page-level)
- Has `refresh()` method for manual updates

**Exposed via:**
```typescript
const { overallProgress, activeBlockProgress, loading, refresh } = useILS();
```

**IMPORTANT FINDING:** Comments in ILSProvider indicate:
```typescript
// CURRENT API LIMITATIONS (Phase 4):
// ✅ Available: navigation-level progress, block completion status
// ❌ Not available: per-block visitCount, per-block activeTimeSec, timeComparison
```

This means ILSProvider was written BEFORE Phase 4.4 APIs existed!

### 2. Block DOM Identity (Phase 2)

**Mechanism:** Every block renders these attributes:
```tsx
<div
  id={block.id}
  data-block-id={block.id}
  data-block-type="paragraph"  // or "code", "definition", etc.
  data-block-version="D1"      // Optional, for versioned blocks
>
```

**Source:** Block components in `packages/ui/src/tutorial/blocks/`

**Example:** ParagraphBlock.tsx
```tsx
export function ParagraphBlock({ block }: BlockComponentProps<IParagraphBlock>) {
  return (
    <p
      id={block.id}
      data-block-id={block.id}
      data-block-type="paragraph"
    >
      {block.content.text}
    </p>
  );
}
```

### 3. Tutorial Page Context

**File:** `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`

**URL Structure:**
```
/learn/{domainSlug}/{subjectSlug}/{topicSlug}/{subtopicSlug}
```

**Available Context:**
- ✅ `params.subtopicSlug` (slug, NOT UUID)
- ✅ `subtopicId` (UUID from database)
- ✅ `content` (TutorialContentJSON with blocks)
- ✅ `hierarchy` (domain/subject/topic/subtopic names and IDs)

**Rendered Component:** `<TutorialExperience />`

**CRITICAL FINDING:** Tutorial pages do NOT currently use:
- ❌ `ActiveBlockProvider`
- ❌ `ILSProvider`
- ❌ Any block-level telemetry

**Current "tracking":** `LearningActivityTracker` only saves last visited page to localStorage (no API calls)

---

## Missing Runtime Pieces (Gap Analysis)

### 1. navigationNodeId Resolution ❌

**Problem:** Phase 4.4 APIs require `navigationNodeId` (string slug), but:
- Tutorial pages have `subtopicSlug` in URL params
- Service/API use `navigationNodeId` (which may or may not equal `subtopicSlug`)

**Question:** Are they the same? Need to verify navigation node vs subtopic slug relationship.

**Hypothesis:** `navigationNodeId` likely equals `subtopicSlug` for standard tutorial pages, but needs verification.

### 2. sectionId Resolution ❌

**Problem:** Phase 4.4 APIs accept optional `sectionId` parameter
- Tutorial pages have access to section data via `sectionsPayload`
- But not clear which `sectionId` corresponds to which navigationNode

**Question:** Is there one section per page, or multiple sections per page?

### 3. Learning Session ID ❌

**Problem:** Phase 4.4 block-visit API requires `sessionId`
- Phase 4.3 service uses 30-minute timeout to detect new sessions
- But runtime has NO session ID generation or management

**Question:** Where should learning sessionId come from?

**Options:**
1. Generate UUID on page mount, store in sessionStorage
2. Use existing JWT session ID (if available)
3. Create dedicated session management module

### 4. Active Block Change Detection ❌

**Problem:** Need to know WHEN active block changes to call block-visit API

**Current State:**
- `ActiveBlockContext` tracks `activeBlock` state
- State updates when viewport scrolling changes active block
- But NO consumer listens to these changes to trigger API calls

**Required:** `useEffect` hook that watches `activeBlock` and calls `/api/tutorial/ils/block-visit`

### 5. Active Time Accumulation ❌

**Problem:** Need to measure HOW LONG a block remains active

**Current State:**
- `ActiveBlockContext` knows which block is active
- But does NOT measure duration
- NO timer/heartbeat mechanism exists

**Required:**
1. Timer that starts when block becomes active
2. Timer that stops when block becomes inactive
3. Periodic accumulation (e.g., every 30 seconds)
4. Call `/api/tutorial/ils/block-active-time` with accumulated time

### 6. Visibility Handling ❌

**Problem:** Should NOT accumulate time when tab is hidden

**Current State:**
- NO visibility tracking
- NO Page Visibility API integration

**Required:**
1. Pause timer when `document.visibilityState === 'hidden'`
2. Resume timer when `document.visibilityState === 'visible'`
3. Flush accumulated time before pausing

### 7. Unmount/Navigation Handling ❌

**Problem:** Must flush accumulated time before leaving page

**Current State:**
- NO beforeunload handler
- NO navigation interceptor

**Required:**
1. Flush time on component unmount
2. Flush time on beforeunload (page close/refresh)
3. Flush time on Next.js navigation

### 8. Duplicate Request Prevention ❌

**Problem:** Rapid scrolling could trigger duplicate visit calls

**Current State:**
- NO debouncing
- NO request deduplication

**Required:**
1. Track last visited blockId
2. Only call visit API if blockId actually changed
3. Debounce rapid changes (e.g., 500ms)

### 9. Error Handling & Retry ❌

**Problem:** API calls can fail (network, auth, validation)

**Current State:**
- NO error handling for telemetry
- NO retry mechanism
- NO offline queue

**Required:**
1. Silent failure (don't break UX)
2. Log errors for debugging
3. Optional: Queue failed requests for retry

### 10. Race Condition Prevention ❌

**Problem:** User could scroll away before visit API completes

**Current State:**
- NO request tracking
- NO cancellation

**Required:**
1. Track in-flight requests
2. Cancel obsolete requests (optional)
3. Ensure last state wins

---

## Phase 4.5 Implementation Contract

### Required Changes

#### 1. Create BlockTelemetryProvider (NEW)

**Location:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

**Responsibilities:**
- Watch `activeBlock` from `ActiveBlockContext`
- Generate/manage learning `sessionId`
- Detect active block changes
- Call `/api/tutorial/ils/block-visit` on change
- Measure active time duration
- Call `/api/tutorial/ils/block-active-time` periodically
- Handle visibility changes (pause/resume)
- Handle unmount/navigation (flush)
- Prevent duplicate requests
- Silent error handling

**Props:**
```typescript
interface BlockTelemetryProviderProps {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  children: React.ReactNode;
  heartbeatIntervalMs?: number;  // Default: 30000 (30s)
  enabled?: boolean;              // Default: true
}
```

**Key State:**
```typescript
- activeBlockId: string | null
- sessionId: string
- accumulatedTimeSec: number
- lastFlushTime: number
- isVisible: boolean
```

**Key Effects:**
1. **Initialize session** (on mount)
2. **Watch activeBlock** (call visit API on change)
3. **Measure time** (interval timer)
4. **Watch visibility** (pause/resume)
5. **Flush on unmount** (cleanup)

#### 2. Update TutorialExperience Component

**Location:** `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx`

**Change:** Wrap content with providers:

```tsx
export function TutorialExperience({ params, subtopicId, ... }) {
  // Resolve navigationNodeId from params
  const navigationNodeId = params.subtopicSlug; // Or proper resolution
  
  return (
    <ActiveBlockProvider>
      <BlockTelemetryProvider
        navigationNodeId={navigationNodeId}
        subtopicId={subtopicId}
        sectionId={null}  // Resolve properly
      >
        <ILSProvider
          navigationNodeId={navigationNodeId}
          subtopicId={subtopicId}
        >
          {/* Existing content */}
        </ILSProvider>
      </BlockTelemetryProvider>
    </ActiveBlockProvider>
  );
}
```

#### 3. Create Session Management Utility (NEW)

**Location:** `packages/ui/src/tutorial/runtime/session.ts`

**Responsibilities:**
- Generate learning session UUID
- Store in sessionStorage
- Persist across page navigations (within session)
- Clear on browser close

```typescript
export function getLearningSessionId(): string {
  const key = 'ils-learning-session-id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}
```

#### 4. Update ILSProvider (MODIFY)

**Location:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

**Changes:**
- Add support for block-level progress (when API calls return BlockLearningState)
- Update `activeBlockProgress` to include time metrics
- Add polling/refresh logic (optional)

**IMPORTANT:** ILSProvider should remain a **data context layer** - it should NOT handle telemetry. Telemetry belongs in BlockTelemetryProvider.

#### 5. Resolve navigationNodeId (INVESTIGATE)

**Question:** How to map `subtopicSlug` → `navigationNodeId`?

**Options:**
1. If they're the same: use `params.subtopicSlug` as `navigationNodeId`
2. If different: query from hierarchy data
3. If DB mapping needed: add to page props

**Action:** Inspect database schema and tutorial hierarchy to confirm relationship.

---

## Frozen Layers (MUST NOT MODIFY)

### Phase 4.1-4.4 Foundation
✅ **Schema:** `packages/db-tutorial/src/schema/block-learning-state.ts` - 🔒 FROZEN  
✅ **Migration:** `packages/db-tutorial/migrations/0023_lame_deathbird.sql` - 🔒 FROZEN  
✅ **Repository:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` - 🔒 FROZEN  
✅ **Service:** `packages/db-tutorial/src/services/learning-progress.service.ts` - 🔒 FROZEN  
✅ **API Routes:**
- `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts` - 🔒 FROZEN
- `apps/api-server/src/app/api/tutorial/ils/block-active-time/route.ts` - 🔒 FROZEN
- BFF routes (RTH/SkillUp) - 🔒 FROZEN

### Existing Runtime (MINIMIZE CHANGES)
✅ **ActiveBlockContext:** Minimize changes - only consume, don't modify core logic  
✅ **Block Components:** Do NOT modify block rendering or DOM identity  
✅ **TutorialExperience:** Add providers only, keep existing structure

---

## Files Proposed for Phase 4.5

### New Files (3)
1. ✅ `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx` (NEW)
2. ✅ `packages/ui/src/tutorial/runtime/session.ts` (NEW)
3. ✅ `packages/ui/src/tutorial/runtime/__tests__/BlockTelemetryProvider.test.tsx` (NEW)

### Modified Files (2-3)
4. ✅ `apps/realtutorialhub-web/src/components/content/TutorialExperience.tsx` (wrap with providers)
5. ✅ `apps/skillup-web/src/components/content/TutorialExperience.tsx` (if exists, same change)
6. ⚠️ `packages/ui/src/tutorial/runtime/ILSProvider.tsx` (OPTIONAL: enhance with block data)

### Investigation Required (1)
7. ❓ Resolve `navigationNodeId` vs `subtopicSlug` relationship

---

## Implementation Sequence

### STEP 1: Resolve navigationNodeId (INVESTIGATION)
- Inspect database schema for navigation_node vs subtopic relationship
- Check if `navigationNodeId` === `subtopicSlug` for standard pages
- Determine sectionId resolution strategy
- Document findings

### STEP 2: Create Session Management
- Implement `session.ts` utility
- sessionStorage-based UUID generation
- Test persistence across navigations

### STEP 3: Create BlockTelemetryProvider (CORE)
- Scaffold component structure
- Implement session initialization
- Implement activeBlock change detection
- Implement visit API calls
- Implement time measurement (timer)
- Implement heartbeat (periodic flush)
- Implement visibility handling
- Implement unmount handling
- Add error handling (silent)
- Add duplicate prevention

### STEP 4: Integrate into TutorialExperience
- Add ActiveBlockProvider wrapper
- Add BlockTelemetryProvider wrapper
- Pass required props (navigationNodeId, subtopicId, sectionId)
- Test integration

### STEP 5: Testing
- Unit tests for BlockTelemetryProvider
- Mock API calls
- Test visit detection
- Test time accumulation
- Test visibility changes
- Test unmount flush
- Integration test (E2E if available)

### STEP 6: Verification
- TypeScript check
- Existing runtime tests (ActiveBlockContext, ILSProvider)
- Phase 4.1-4.4 tests (no regression)
- Manual browser testing

### STEP 7: Documentation & Certification
- Create phase-4.5-final-certification-report.md
- Document runtime architecture
- Document session management
- Document telemetry flow

---

## Key Design Decisions

### 1. Separation of Concerns
**Decision:** Create separate `BlockTelemetryProvider` instead of adding telemetry to `ActiveBlockContext` or `ILSProvider`

**Rationale:**
- ActiveBlockContext: Pure viewport tracking (Phase 3) - should remain stateless
- ILSProvider: Data context layer - should not handle side effects
- BlockTelemetryProvider: Telemetry orchestration - dedicated responsibility

### 2. Session Management
**Decision:** sessionStorage-based UUID generation

**Rationale:**
- Persists across page navigations (within browser tab)
- Clears on browser close (matches "session" semantics)
- Simpler than server-side session management
- Aligns with Phase 4.3 30-minute timeout logic

### 3. Heartbeat Interval
**Decision:** Default 30-second intervals for time flush

**Rationale:**
- Balances API load vs data granularity
- Matches common analytics patterns
- Configurable via prop

### 4. Error Handling
**Decision:** Silent failures (log but don't throw)

**Rationale:**
- Telemetry should NEVER break learning experience
- Failures should be invisible to learners
- Errors logged for debugging only

### 5. Visibility Handling
**Decision:** Pause timer when tab hidden

**Rationale:**
- Only measure active engagement time
- Matches Phase 4.3 "active time" semantics
- Industry standard (Page Visibility API)

### 6. Duplicate Prevention
**Decision:** Track last blockId, only call API on actual change

**Rationale:**
- Prevents redundant API calls
- Service has its own 30-min session logic
- API should only be called when block actually changes

---

## Risks & Mitigations

### Risk 1: navigationNodeId Resolution Unclear
**Impact:** Cannot pass correct identity to APIs  
**Mitigation:** STEP 1 investigation required before implementation  
**Blocker:** YES - must resolve before coding

### Risk 2: Rapid Scrolling Performance
**Impact:** Too many API calls  
**Mitigation:** Debounce block changes (500ms)  
**Blocker:** NO - implement during STEP 3

### Risk 3: Network Failures
**Impact:** Lost telemetry data  
**Mitigation:** Silent failures, optional retry queue  
**Blocker:** NO - silent failure acceptable

### Risk 4: Browser Compatibility (sessionStorage)
**Impact:** Old browsers may not support  
**Mitigation:** Try/catch with fallback UUID in memory  
**Blocker:** NO - graceful degradation

### Risk 5: Timer Drift/Accuracy
**Impact:** Accumulated time may be slightly inaccurate  
**Mitigation:** Use performance.now() for precise timing  
**Blocker:** NO - reasonable accuracy sufficient

---

## Testing Strategy

### Unit Tests (BlockTelemetryProvider)
1. Session initialization
2. Active block change detection
3. Visit API called on block change
4. Time accumulation (mock timer)
5. Heartbeat flush
6. Visibility pause/resume
7. Unmount flush
8. Error handling (API failure)
9. Duplicate prevention

### Integration Tests (TutorialExperience)
1. Providers rendered in correct order
2. Props passed correctly
3. API integration (mocked fetch)

### Manual Browser Tests
1. Load tutorial page
2. Scroll through blocks
3. Verify visit calls in network tab
4. Wait 30s, verify time call
5. Switch tabs, verify pause
6. Return, verify resume
7. Close tab, verify flush (beforeunload)

---

## Scope Exclusions (NOT Phase 4.5)

❌ UI changes (learning progress display)  
❌ Right-side ILS panel enhancements  
❌ Analytics dashboards  
❌ Recommendation engine  
❌ Completion synchronization (page-level vs block-level)  
❌ Block-level "struggling" detection  
❌ Time comparison thresholds  
❌ Block completion workflow changes  
❌ Assignment/project integration  
❌ Quiz/practice telemetry  
❌ Multi-device session sync  
❌ Offline telemetry queue  
❌ Advanced retry logic  

---

## Open Questions (Require Investigation)

### Critical (Block Implementation)
1. **navigationNodeId resolution:** How to map `subtopicSlug` → `navigationNodeId`?
2. **sectionId resolution:** Where does `sectionId` come from in page context?
3. **Multi-brand BFF:** Do SkillUp pages have same structure as RTH?

### Important (Can Defer)
4. **Block version source:** Where does `blockVersion` come from in rendered blocks?
5. **Completion sync:** How do block completions (existing feature) relate to block visits?
6. **ILSProvider enhancement:** Should it fetch block-level data, or remain page-level only?

### Nice to Have (Future)
7. **Retry strategy:** Should failed telemetry be queued?
8. **Offline support:** Should telemetry work offline and sync later?
9. **Multi-tab coordination:** Should multiple tabs share same learning session?

---

## Phase 4.5 Preflight Status

✅ **Baseline verified:** Clean at `f3405900`  
✅ **Existing runtime discovered:** ActiveBlockContext, ILSProvider (not integrated)  
✅ **Block DOM identity confirmed:** `data-block-id`, `data-block-type`, `data-block-version`  
✅ **Tutorial page structure understood:** TutorialExperience component  
✅ **Gap analysis complete:** 10 missing pieces identified  
✅ **Implementation plan defined:** 7 sequential steps  
✅ **Files identified:** 3 new, 2-3 modified  
✅ **Frozen layers confirmed:** Phase 4.1-4.4 preserved  
✅ **Risks documented:** 5 risks with mitigations  
✅ **Test strategy defined:** Unit + integration + manual  

⚠️ **BLOCKED:** STEP 1 investigation required (navigationNodeId resolution)

---

## Recommendation

**DO NOT BEGIN IMPLEMENTATION UNTIL:**

1. ✅ navigationNodeId vs subtopicSlug relationship confirmed
2. ✅ sectionId resolution strategy confirmed
3. ✅ Explicit "BEGIN PHASE 4.5 IMPLEMENTATION" authorization received

**Next Action:** Investigate navigationNodeId resolution (database schema inspection)

**Alternative:** If investigation reveals architectural issues, stop and report findings before proceeding.

---

**Preflight Date:** 2026-09-05  
**Prepared By:** Kiro (Phase 4.5 Preflight Protocol)  
**Status:** AWAITING AUTHORIZATION ⏸️
