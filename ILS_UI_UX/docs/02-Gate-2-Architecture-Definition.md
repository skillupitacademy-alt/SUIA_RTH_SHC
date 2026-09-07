# ILS MACRO 2 / GATE 2 - ARCHITECTURE DEFINITION REPORT

**Date:** 2026-09-07  
**Objective:** Define UBRC based on verified existing architecture  
**Status:** INVESTIGATION COMPLETE ✅

---

## 🎯 EXECUTIVE SUMMARY

**CRITICAL DISCOVERY:** The Universal ILS Runtime is **ALREADY CORRECTLY WIRED** and operational!

The investigation reveals that:
1. ✅ **LSNB EXISTS** - `TutorialLeftSidebar` is the universal navigation component
2. ✅ **ILS Runtime is COMPLETE** - Full provider composition already implemented
3. ✅ **Passive Observer Architecture VALIDATED** - External observation is intentional and correct
4. ⚠️ **UBRC should NOT add lifecycle hooks** - Would duplicate existing infrastructure
5. ✅ **RSSB data contract is clear** - Maps directly to existing ILS state

---

## 📊 GATE 2A: LSNB FORENSIC AUDIT ✅

### Component Identification

**LSNB = TutorialLeftSidebar** ✅

**Location:** `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`

### Capabilities

#### 1. **Navigation Tree Rendering** ✅
```typescript
interface TutorialLeftSidebarProps {
  tree: TutorialNavigationTree;      // Full hierarchy
  activeUrl?: string;                 // Current page
  completedUrls?: Set<string>;        // Completed navigation nodes
  onNavigate?: (url: string, node: TutorialNavigationNode) => void;
}
```

#### 2. **Learning State Display** ✅

**Three-State System:**
```typescript
type TutorialNodeStatus = 'not-started' | 'in-progress' | 'completed'
```

**Visual Indicators:**
- ✅ **Green checkmark** - Completed (`status === 'completed'`)
- ✅ **Hollow circle with colored ring** - In Progress (`status === 'in-progress'`)
- ✅ **Gray hollow circle** - Not Started (`status === 'not-started'`)

**Logic Location:**
```typescript
function StatusMark({ status, colors }: { 
  status: TutorialNodeStatus; 
  colors: TutorialNavigationTree['theme'] 
})
```

#### 3. **Page-Level Progress** ✅
```typescript
// Displays overall progress bar
<section aria-label="Tutorial progress">
  <div>Your Progress</div>
  <div>{progress}%</div>
  <div role="progressbar" aria-valuenow={progress}>
    <div style={{ width: `${progress}%` }} />
  </div>
</section>
```

#### 4. **Brand Theming** ✅
```typescript
interface TutorialNavigationTree {
  theme: {
    primary: string;        // Primary brand color
    secondary: string;      // Secondary brand color
    completed: string;      // Completion indicator color
    activeBackground: string;
  };
  brand: {
    name: string;
    shortName: string;
    logoUrl?: string;
    tagline: string;
  };
}
```

### Current State Logic

**Effective Status Calculation:**
```typescript
function getEffectiveStatus(
  node: TutorialNavigationNode, 
  activeUrl?: string, 
  completedUrls?: Set<string>
): TutorialNodeStatus {
  // 1. Check if completed
  if (isNodeCompleted(node, completedUrls)) {
    return 'completed';
  }
  
  // 2. Check if current lesson or contains active incomplete child
  const isCurrentLesson = Boolean(node.url && node.url === activeUrl);
  const containsCurrentIncompleteLesson = hasActiveIncompleteChild(node, activeUrl, completedUrls);
  
  if (isCurrentLesson || containsCurrentIncompleteLesson) {
    return 'in-progress';
  }
  
  // 3. Default to not started
  return 'not-started';
}
```

### Data Source

**Current:** Page-level navigation completion
- Input: `completedUrls: Set<string>`
- Tracks: Navigation node URLs (page-level)
- Does NOT currently display: Block-level metrics within a page

**Future RSSB Integration:**
- LSNB shows **page-level** status (green/yellow/gray circle)
- RSSB shows **block-level** status (D1, C1, S1 individual progress)
- Both consume same underlying ILS state

### Red/Yellow/Green Logic

**Current Implementation:**
- ✅ **Green** = Completed (checkmark in colored circle)
- ✅ **Yellow/Colored ring** = In Progress (hollow circle with brand secondary color)
- ✅ **Gray** = Not Started (gray hollow circle)

**Colors from theme:**
- `theme.completed` → Green checkmark background
- `theme.secondary` → In-progress ring color
- Hardcoded gray → Not started

---

## 📊 GATE 2B: ILS RUNTIME COMPOSITION AUDIT ✅

### VERIFIED: Complete Runtime Chain Exists!

**Location:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

### Actual Runtime Composition

```typescript
export function TutorialPageShell({ payload, runtimeContext }) {
  return (
    <main>
      <TutorialHeader />
      
      <TutorialLeftSidebar />  // ← LSNB
      
      <ActiveBlockProvider containerRef={contentContainerRef}>
        <ILSProvider
          navigationNodeId={runtimeContext.navigationNodeId}
          subtopicId={runtimeContext.hierarchy.subtopicId}
          sectionId={runtimeContext.sectionId}
        >
          <BlockTelemetryProvider
            navigationNodeId={runtimeContext.navigationNodeId}
            subtopicId={runtimeContext.hierarchy.subtopicId}
            sectionId={runtimeContext.sectionId}
            sessionId={tutorialSessionId}  // ← Session-aware
          >
            <div ref={contentContainerRef}>
              {payload.content.blocks.map((block) => (
                <TutorialBlockRenderer 
                  block={block}
                  runtimeContext={blockRuntimeContext}
                  theme={payload.theme}
                />
              ))}
            </div>
          </BlockTelemetryProvider>
        </ILSProvider>
      </ActiveBlockProvider>
    </main>
  );
}
```

### Provider Responsibilities

#### 1. **ActiveBlockProvider** ✅
```typescript
// Observes DOM via IntersectionObserver
// Tracks: Currently visible block
// Updates: activeBlock identity
// Location: packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx
```

**Provides:**
```typescript
{
  activeBlock: {
    blockId: string;
    blockType: string;
    blockVersion: string;
  } | null
}
```

#### 2. **ILSProvider** ✅
```typescript
// Manages: Page-level and block-level progress
// Fetches: Navigation progress from API
// Calculates: Overall learning state
// Location: packages/ui/src/tutorial/runtime/ILSProvider.tsx
```

**Provides:**
```typescript
{
  overall: {
    status: LearningState;
    progressPercentage: number;
    completedBlockCount: number;
    totalBlockCount: number;
  };
  activeBlock: {
    blockId: string;
    blockType: string;
    blockVersion: string;
    isCompleted: boolean;
    visitCount: number;
    activeTimeSec: number;
  } | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}
```

#### 3. **BlockTelemetryProvider** ✅
```typescript
// Emits: Block visit events
// Tracks: Active time per block
// Sends: POST /api/tutorial/ils/block-visit
// Location: packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx
```

**Capabilities:**
- ✅ Session-aware visit tracking (Phase 4.6 validated)
- ✅ Active time measurement
- ✅ Same-session deduplication
- ✅ Queue-based telemetry with flush on transition
- ✅ Automatic block transition detection

### Session Initialization ✅

```typescript
// Step 1: Get or create session UUID
useEffect(() => {
  if (sessionInitializedRef.current) return;
  sessionInitializedRef.current = true;
  
  const sessionId = getOrCreateTutorialLearningSessionId();
  setTutorialSessionId(sessionId);
  
  // Stored in: sessionStorage["tutorialLearningSessionId"]
}, []);
```

### Runtime Context Flow ✅

```
Universal Learner Page (SSR)
  ↓ resolveRuntimeContext()
TutorialPageShell (Client)
  ↓ Session initialization
  ↓ Provider composition
ActiveBlockProvider
  ↓ DOM observation
ILSProvider
  ↓ Progress tracking
BlockTelemetryProvider
  ↓ Visit/time telemetry
TutorialBlockRenderer
  ↓ runtimeContext prop
Individual Blocks (D1, C1, etc.)
```

**Status:** ✅ **COMPLETE AND OPERATIONAL**

---

## 📊 GATE 2C: RSSB DATA CONTRACT ✅

### RSSB Prototype Data Structure

**Source:** `ILS_UI_UX/data.json`

```typescript
interface RSSBData {
  // Page-level context
  navigationNodeId: string;
  sectionId: string;
  subtopicId: string;
  
  // Page-level metrics
  status: 'not_started' | 'in_progress' | 'completed' | 'revision';
  progressPercentage: number;
  completedBlockCount: number;
  totalBlockCount: number;
  
  // Block-level metrics
  blocks: RSSBBlockMetric[];
}

interface RSSBBlockMetric {
  blockId: string;
  blockVersion: string;
  status: 'completed' | 'not_completed';
  
  // Core metrics (Phase 4.6 validated)
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number;
  
  // Time comparison
  timeComparison: {
    differenceSec: number;
    percentageOfExpected: number;
    belowExpected: boolean;
  };
  
  // Interaction history (future phase)
  interactionHistory: Array<{
    type: 'view' | 'expand' | 'copy' | 'complete';
    occurredAt: string;
  }>;
  
  // Assessment metrics (future phase)
  attempts: number;
  score: number | null;
  
  // Timestamps (Phase 4.6 validated)
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}
```

### Mapping to Existing ILS State

**Page-Level (from ILSProvider):**
```typescript
// RSSB.status ← ILSProvider.overall.status
// RSSB.progressPercentage ← ILSProvider.overall.progressPercentage
// RSSB.completedBlockCount ← ILSProvider.overall.completedBlockCount
// RSSB.totalBlockCount ← ILSProvider.overall.totalBlockCount
```

**Block-Level (from Block Learning State Repository):**
```typescript
// RSSB.blocks[].blockId ← block_learning_state.block_id
// RSSB.blocks[].blockVersion ← block_learning_state.block_version
// RSSB.blocks[].visitCount ← block_learning_state.visit_count
// RSSB.blocks[].revisionCount ← block_learning_state.revision_count
// RSSB.blocks[].activeTimeSec ← block_learning_state.active_time_sec
// RSSB.blocks[].expectedTimeSec ← block_learning_state.expected_time_sec
// RSSB.blocks[].firstViewedAt ← block_learning_state.first_viewed_at
// RSSB.blocks[].lastViewedAt ← block_learning_state.last_viewed_at
// RSSB.blocks[].completedAt ← block_learning_state.completed_at
```

### Authoritative Production Data Source

**NOT `data.json`** - That is prototype/sample data only.

**Actual Source Chain:**
```
RSSB Component
  ↓ useILS() hook
ILSProvider
  ↓ Fetches from API
GET /api/tutorial/progress
  ↓ Calls service
LearningProgressService
  ↓ Queries repository
BlockLearningStateRepository
  ↓ PostgreSQL
block_learning_state table
```

### Metrics NOT Yet Available

From `data.json` prototype:

**Future Phase (Not Phase 4.6):**
- ❌ `interactionHistory[]` - Requires event sourcing
- ❌ `attempts` - Requires assessment integration
- ❌ `score` - Requires assessment integration
- ⚠️ `timeComparison` - Can be calculated client-side from existing data

**Phase 4.6 Provides:**
- ✅ `visitCount`
- ✅ `revisionCount`
- ✅ `activeTimeSec`
- ✅ `expectedTimeSec`
- ✅ `firstViewedAt`
- ✅ `lastViewedAt`
- ✅ `completedAt`

---

## 📊 GATE 2D: UBRC DEFINITION ✅

### Critical Architectural Decision

**DO NOT add lifecycle hooks to UBRC.**

**Reason:** The existing **passive observer architecture** is intentional and correct.

### Current Architecture (VALIDATED)

```
Block Components (D1, C1, etc.)
  ↓
Render UI ONLY
  ↓
Expose DOM identity via data-attributes
  ↓
External Observation
  ↓
ActiveBlockProvider (IntersectionObserver)
  ↓
BlockTelemetryProvider (visit/time tracking)
  ↓
ILSProvider (state aggregation)
  ↓
API / Repository / PostgreSQL
```

**Why This Is Correct:**

1. **Separation of Concerns** ✅
   - Blocks: UI rendering only
   - Runtime: Observation & telemetry
   - Backend: Persistence & aggregation

2. **Universal Applicability** ✅
   - Works for ALL block types automatically
   - No per-block custom integration code
   - New blocks participate automatically

3. **Resilience** ✅
   - Block render errors don't break telemetry
   - Telemetry failures don't break block rendering
   - Progressive enhancement architecture

4. **Already Operational** ✅
   - Phase 4.6 validated with 11/11 tests passing
   - SUIA + RTH runtime verified
   - Session-aware visit tracking working

### UBRC Final Specification

```typescript
/**
 * Universal Block Runtime Contract (UBRC)
 * 
 * This is the contract between a block component and the Universal ILS Runtime.
 * Blocks satisfying this contract automatically participate in ILS tracking.
 */
interface UniversalBlockRuntimeContract {
  // === IDENTITY (Required) ===
  // Block components MUST expose these via data-attributes
  'data-block-id': string;
  'data-block-type': string;
  'data-block-version': string;
  
  // === PROPS (Required) ===
  block: TutorialBlock;           // Block content
  theme: DomainTheme;             // Brand theming
  depth: number;                  // Nesting depth
  className?: string;             // Additional styling
  runtimeContext: TutorialBlockRuntimeContext;  // Runtime identity
  
  // === RENDERING (Required) ===
  renderChild?: (child: TutorialBlock, depth: number) => React.ReactNode;
  
  // === ILS INTEGRATION (Automatic via External Observation) ===
  // NO lifecycle hooks required
  // NO event emitters required
  // NO state management required
  // 
  // ILS tracking happens automatically when block:
  // 1. Renders with correct data-attributes
  // 2. Becomes visible (IntersectionObserver)
  // 3. Receives user interaction (implicit via visibility)
}

/**
 * Runtime Context provided to all blocks
 */
interface TutorialBlockRuntimeContext {
  learnerId: string;
  navigationNodeId: string;
  sectionId: string;
  subtopicId: string;
  blockId: string;
  blockType: string;
  blockVersion: string;
}

/**
 * DOM Identity Contract
 * 
 * Every block MUST render a root element with these attributes:
 */
const DOMIdentityContract = {
  'data-block-id': 'unique-block-id',
  'data-block-type': 'definition' | 'code' | 'summary' | ...,
  'data-block-version': 'D1' | 'C1' | 'S1' | ...,
};
```

### What Blocks MUST Do

1. ✅ **Render with DOM identity attributes**
   ```tsx
   <div
     data-block-id={block.id}
     data-block-type={block.type}
     data-block-version={block.version}
   >
     {/* Block content */}
   </div>
   ```

2. ✅ **Accept required props**
   ```tsx
   export function MyBlock({ 
     block, 
     theme, 
     depth, 
     className,
     runtimeContext,
     renderChild 
   }: BlockComponentProps<IMyBlock>) {
     // Implementation
   }
   ```

3. ✅ **Use theme for brand colors**
   ```tsx
   <div style={{ backgroundColor: theme.primary }}>
   ```

### What Blocks MUST NOT Do

1. ❌ **Call ILS APIs directly**
2. ❌ **Emit custom telemetry events**
3. ❌ **Manage completion state**
4. ❌ **Track visit counts**
5. ❌ **Measure active time**
6. ❌ **Implement lifecycle hooks**

### What Runtime Provides Automatically

1. ✅ **Visit tracking** (BlockTelemetryProvider)
2. ✅ **Active time measurement** (BlockTelemetryProvider)
3. ✅ **Session awareness** (TutorialPageShell)
4. ✅ **Active block detection** (ActiveBlockProvider)
5. ✅ **Progress aggregation** (ILSProvider)
6. ✅ **Persistence** (API → Service → Repository)

---

## 🎯 FINAL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│         TUTORIAL COMPOSER (Future)                  │
│         Assembles UBRC-compatible blocks            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         UNIVERSAL TUTORIAL LEARNER PAGE             │
│         tutorial-v2/[...]/[navigationNodeId]        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              TutorialPageShell                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  TutorialLeftSidebar (LSNB)                 │   │
│  │  - Page-level progress                      │   │
│  │  - Green/yellow/gray indicators             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  ActiveBlockProvider                        │   │
│  │  └─ ILSProvider                             │   │
│  │     └─ BlockTelemetryProvider               │   │
│  │        └─ TutorialBlockRenderer             │   │
│  │           └─ UBRC Blocks (D1, C1, S1, ...) │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────┐            ┌──────────┐
    │  LSNB  │            │   RSSB   │
    │ (Page) │            │ (Block)  │
    └────────┘            └──────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Universal ILS       │
         │   Runtime Providers   │
         └───────────────────────┘
```

---

## 🚨 KEY FINDINGS & RECOMMENDATIONS

### ✅ VALIDATED ARCHITECTURE

1. **ILS Runtime is COMPLETE** - No missing providers
2. **Passive observation is CORRECT** - Intentional design
3. **LSNB exists and works** - TutorialLeftSidebar
4. **Session tracking operational** - Phase 4.6 validated
5. **Block identity propagation working** - data-attributes exposed

### ⚠️ DO NOT IMPLEMENT

1. **Block lifecycle hooks** - Would duplicate external observation
2. **Per-block ILS integration** - Runtime handles automatically
3. **Custom telemetry emitters** - BlockTelemetryProvider provides this

### ✅ READY TO IMPLEMENT

1. **RSSB React/TypeScript Component**
   - Consume: `useILS()` hook
   - Display: Block-level metrics from ILS state
   - Theme: Use `DomainTheme` for brand colors

2. **RSSB ↔ ILS Integration**
   - Source: ILSProvider context
   - API: Already exists (GET /api/tutorial/progress)
   - State: Block learning state repository (Phase 4.6)

---

## 📊 GATE 2 COMPLETION STATUS

**All Sub-Gates Complete:** ✅

- ✅ **Gate 2A** - LSNB identified: `TutorialLeftSidebar`
- ✅ **Gate 2B** - ILS Runtime composition verified: Complete and operational
- ✅ **Gate 2C** - RSSB data contract mapped: Direct ILS state mapping
- ✅ **Gate 2D** - UBRC defined: Passive observer pattern validated

**Recommendation:** **FREEZE ARCHITECTURE & PROCEED TO RSSB IMPLEMENTATION**

---

**Next:** Gate 3 - RSSB React/TypeScript Implementation  
**Report End** | Generated: 2026-09-07 | Status: ARCHITECTURE FROZEN ✅
