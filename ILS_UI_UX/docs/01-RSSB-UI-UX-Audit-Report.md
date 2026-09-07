# ILS MACRO 1 / GATE 1 - CURRENT ARCHITECTURE AUDIT REPORT

**Date:** 2026-09-07  
**Objective:** Establish exact current architecture before defining UBRC or implementing RSSB React/TypeScript conversion  
**Status:** READ-ONLY INVESTIGATION COMPLETE ✅

---

## 📊 GIT STATUS

**Current HEAD:** `f5d40c95` - Merge phase-4.6-console-cleanup  
**Branch:** `main`  
**Working Tree:** Clean (except next-env.d.ts changes and cleanup script)

---

## 🏗️ ARCHITECTURE FINDINGS

### A. UNIVERSAL TUTORIAL LEARNER PAGE ✅ EXISTS

**Location:**
```
apps/skillup-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx
apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx
```

**Evidence:**
- ✅ Brand-specific routes (SkillUp, RTH)
- ✅ Dynamic route parameters for full hierarchy
- ✅ Authentication/authorization integration
- ✅ Runtime context resolution via `resolveRuntimeContext()`
- ✅ Canonical URL redirect handling (Phase 2.6)
- ✅ Renders `<TutorialPageShell>` with `payload` and `runtimeContext`

**Key Integration Points:**
- Uses `TutorialPageShell` component for actual rendering
- Passes `runtimeContext` to shell for ILS integration
- Extracts `learnerId` from middleware headers
- Performs navigation hierarchy validation

---

### B. TUTORIAL PAGE COMPOSER ⚠️ PARTIALLY IDENTIFIED

**Admin/Composer Location:**
```
apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-block-composer/page.tsx
apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/page.tsx
```

**Evidence:**
- ✅ Block composer admin tool exists
- ✅ Page content builder exists
- ⚠️ Need to investigate how blocks are assembled into pages
- ⚠️ Need to verify if Composer performs ILS wiring

**Status:** Requires deeper investigation in Gate 2

---

### C. UNIVERSAL LSNB ❌ NOT FOUND AS "LSNB"

**Alternative Names Found:**
```
src/share-branding/LearningExperience/navigation/Sidebar.tsx
src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx
```

**Status:** 
- ❌ No component named "LSNB"
- ✅ Sidebar navigation components exist
- ⚠️ Need to identify which component shows block-level learning state
- ⚠️ Need to identify red/yellow/green logic location

**Hypothesis:** LSNB might be:
1. Part of TutorialLeftSidebar
2. Integrated into Sidebar.tsx
3. Not yet implemented as universal component
4. Called by different name in codebase

---

### D. UNIVERSAL ILS RUNTIME ✅ EXISTS & COMPREHENSIVE

**Core Components Found:**

#### 1. **ILSProvider** ✅
**Location:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

**Capabilities:**
- ✅ Page-level progress tracking
- ✅ Block-level progress tracking
- ✅ Overall learning state calculation
- ✅ Completion tracking
- ✅ API integration for navigation progress
- ✅ Real-time progress updates

**Key Types:**
```typescript
LearningState = 'not_started' | 'in_progress' | 'completed' | 'revision'

interface ILSOverallProgress {
  status: LearningState;
  progressPercentage: number; // 0-100
  completedBlockCount: number;
  totalBlockCount: number;
}

interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  isCompleted: boolean;
  visitCount: number;
  activeTimeSec: number;
}
```

**Hook:**
```typescript
function useILS(): ILSContextValue
```

---

#### 2. **ActiveBlockContext** ✅
**Location:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`

**Capabilities:**
- ✅ Tracks currently visible/active block
- ✅ Intersection Observer integration
- ✅ Block identity management
- ✅ Lifecycle hooks

**Key Types:**
```typescript
interface ActiveBlockIdentity {
  blockId: string;
  blockType: string;
  blockVersion: string;
}

interface ActiveBlockContextValue {
  activeBlock: ActiveBlockIdentity | null;
}
```

**Hook:**
```typescript
function useActiveBlock(): ActiveBlockContextValue
```

---

#### 3. **Block Telemetry System** ✅
**Location:** `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`

**Capabilities:**
- ✅ Block visit tracking
- ✅ Active time measurement
- ✅ Session-aware visit counting
- ✅ Duplicate visit prevention
- ✅ API integration (`/api/tutorial/ils/block-visit`)
- ✅ Queue-based telemetry with flush on transition

**Evidence from previous investigation:**
- Emits visit events to BFF
- Tracks active time per block
- Session UUID integration
- Same-session deduplication

---

### E. RUNTIME CONTEXT ✅ EXISTS

**Location:** Found in TutorialV2SubtopicPage component

**Runtime Context Resolution:**
```typescript
const result = await resolveRuntimeContext({
  brandId: 'skillup',
  learnerId,
  ...resolved,
});

// Returns:
{
  success: boolean;
  payload: { hierarchy, content, ... };
  context: { /* runtime context */ };
}
```

**Usage:**
```typescript
<TutorialPageShell 
  payload={result.payload} 
  runtimeContext={result.context} 
/>
```

**Status:** ✅ Runtime context exists and flows through component tree

---

### F. BLOCK RENDERER ✅ UNIVERSAL & COMPLETE

**Location:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

**Capabilities:**
- ✅ Universal block rendering switch
- ✅ Supports 19+ block types
- ✅ Runtime context propagation
- ✅ Depth/nesting control
- ✅ Theme support
- ✅ Error boundaries

**Supported Blocks:**
- Heading, Paragraph, List
- Code (C1 only), Table, Image
- Callout, **Definition**, Example
- Quote, Summary, Diagram
- Comparison, TwoColumn, ThreeColumn
- CardGrid, Timeline

**Key Pattern:**
```typescript
export function TutorialBlockRenderer({ 
  block, 
  depth = 0, 
  theme, 
  className = '', 
  runtimeContext  // ✅ Runtime context received
}: BlockComponentProps)
```

**Evidence:** All blocks receive `runtimeContext` prop

---

### G. D1 INTEGRATION ✅ EXISTS

**Block:** Definition D1  
**Location:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`

**Implementation:**
```typescript
export function DefinitionBlock({ 
  block, 
  className = '',
  theme,
  runtimeContext  // ✅ Receives runtime context
}: BlockComponentProps<IDefinitionBlock>)

// Routes to version-specific implementation:
function DefinitionD1View({ block, theme, className })
```

**Integration Status:**
- ✅ Receives `runtimeContext` from BlockRenderer
- ✅ Version-aware routing (D1)
- ✅ Theme integration
- ✅ Canonical locked UI
- ⚠️ **Does NOT appear to use ActiveBlockContext directly**
- ⚠️ **Does NOT appear to emit ILS events directly**

**Current Architecture:**
```
TutorialBlockRenderer 
  ↓ (passes runtimeContext)
DefinitionBlock
  ↓
DefinitionD1View (renders UI only)
```

**Missing ILS Integration:**
- ❌ No direct visit tracking
- ❌ No active time measurement
- ❌ No completion signaling
- ❌ No LSNB/RSSB metric updates

**Hypothesis:** D1 relies on **external observers** (ActiveBlockContext + BlockTelemetryProvider) rather than internal integration.

---

### H. C1 INTEGRATION ✅ EXISTS

**Block:** Code C1  
**Location:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`

**Implementation:**
```typescript
export function CodeC1Block({ 
  block, 
  theme, 
  className,
  runtimeContext  // ✅ Receives runtime context
}: BlockComponentProps<ICodeC1Block>)
```

**Integration Status:**
- ✅ Receives `runtimeContext` from BlockRenderer
- ✅ Version enforcement (C1 only)
- ✅ Interactive features (copy to clipboard)
- ✅ Syntax highlighting
- ⚠️ **Does NOT appear to use ActiveBlockContext directly**
- ⚠️ **Does NOT appear to emit ILS events directly**

**Current Architecture:** Same as D1 - passive rendering only

---

### I. BLOCK LEARNING STATE ✅ COMPLETE

**Phase 4.6 Implementation:**

#### Repository
**Location:** `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

**Capabilities:**
- ✅ Session-aware visit counting
- ✅ Atomic INSERT/UPDATE
- ✅ Concurrency-safe operations
- ✅ firstViewedAt initialization
- ✅ lastSessionId tracking
- ✅ revisionCount tracking
- ✅ activeTimeSec accumulation

**Validated:** 11/11 integration tests passing ✅

#### Service
**Location:** `packages/db-tutorial/src/services/learning-progress.service.ts`

**Methods:**
- `recordBlockVisit()` - Session-tracked visit
- `recordBlockActiveTime()` - Time accumulation
- `getBlockLearningState()` - State retrieval

#### API
**Location:** `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts`

**Endpoint:** `POST /api/tutorial/ils/block-visit`

**Validated:** 
- ✅ SUIA runtime: visitCount=2, timestamps populated
- ✅ RTH runtime: visitCount=2, timestamps populated

---

### J. RSSB PROTOTYPE FILES ✅ PRESENT

**Location:** `ILS_UI_UX/`

**Files:**
- ✅ `index.html` (2,487 bytes)
- ✅ `style.css` (2,089 bytes)
- ✅ `script.js` (2,156 bytes)
- ✅ `data.json` (1,892 bytes)

**Status:** Approved UI prototype ready for React/TypeScript conversion

---

### K. BRANDING/THEMING ✅ EXISTS

**Theme System:**
```typescript
interface DomainTheme {
  primary: string;    // Brand primary color
  secondary: string;  // Brand secondary color
}
```

**Evidence:**
- ✅ Theme passed to all block components
- ✅ Brand-aware page shells
- ✅ SkillUp vs RTH differentiation
- ✅ Reusable theming infrastructure

**Brand Configuration:**
```
apps/skillup-web       → SkillUp brand
apps/realtutorialhub-web → RTH brand
```

---

## 🔍 CRITICAL ARCHITECTURAL DISCOVERIES

### 1. **Passive Block Architecture** ⚠️

**Current Pattern:**
```
Block Components (D1, C1, etc.)
  ↓
Render UI only
  ↓
NO direct ILS integration
```

**ILS Integration Happens Externally:**
```
ActiveBlockContext (observes DOM)
  ↓
BlockTelemetryProvider (emits events)
  ↓
API / Backend persistence
```

**Implication:** Blocks are **passively observed**, not **actively integrated**

---

### 2. **Runtime Context Flow** ✅

**Current Flow:**
```
Page Route
  ↓ resolveRuntimeContext()
TutorialPageShell
  ↓ runtimeContext prop
TutorialBlockRenderer
  ↓ runtimeContext prop
Individual Block Components
  (D1, C1, etc.)
```

**Status:** ✅ Runtime context propagates correctly

---

### 3. **Missing Universal Block Contract** ⚠️

**Current State:**
- ❌ No standardized block lifecycle interface
- ❌ No common ILS integration pattern
- ❌ No UBRC definition
- ⚠️ Each block type implemented independently

**What EXISTS:**
```typescript
interface BlockComponentProps<T = TutorialBlock> {
  block: T;
  depth: number;
  theme?: DomainTheme;
  className?: string;
  runtimeContext?: unknown;  // ⚠️ Untyped
  renderChild?: (child: TutorialBlock, depth: number) => React.ReactNode;
}
```

**What's MISSING:**
- Standardized `onMount()` lifecycle
- Standardized `onComplete()` callback
- Standardized `onActiveTimeUpdate()` callback
- Block-level ILS state access pattern
- RSSB metric integration contract

---

### 4. **LSNB Mystery** ❓

**Status:** Cannot confirm LSNB exists as Universal component

**Possibilities:**
1. Embedded in TutorialLeftSidebar
2. Part of Sidebar.tsx
3. Not yet implemented universally
4. Different naming convention

**Required for UBRC:** LSNB must exist to display block-level metrics

---

## 📋 WHAT EXISTS vs WHAT'S MISSING

### ✅ COMPLETE & VALIDATED

1. **Universal Tutorial Learner Page** ✅
2. **ILSProvider** (page-level + block-level progress) ✅
3. **ActiveBlockContext** (active block tracking) ✅
4. **BlockTelemetryProvider** (visit/active-time tracking) ✅
5. **Block Learning State Repository** (Phase 4.6 complete) ✅
6. **TutorialBlockRenderer** (universal rendering) ✅
7. **D1 Block** (Definition D1 rendering) ✅
8. **C1 Block** (Code C1 rendering) ✅
9. **Runtime Context Flow** ✅
10. **Brand/Theme System** ✅
11. **RSSB Prototype Files** ✅

### ⚠️ PARTIALLY COMPLETE

1. **Tutorial Page Composer** - exists but integration unclear
2. **LSNB** - sidebar exists but universal block-state display unclear

### ❌ MISSING / NEEDS DEFINITION

1. **Universal Block Runtime Contract (UBRC)** ❌
   - No standardized lifecycle
   - No completion callback pattern
   - No active ILS integration interface

2. **RSSB React/TypeScript Implementation** ❌
   - Prototype exists
   - React conversion not started

3. **Block-Level Metric Display in LSNB** ❓
   - Cannot confirm if LSNB shows per-block metrics
   - Cannot confirm red/yellow/green logic location

4. **RSSB ↔ ILS Integration** ❌
   - No integration exists (RSSB not yet React component)

5. **Unified Block ILS Integration Pattern** ❌
   - D1 and C1 are passively observed
   - No active integration
   - Future blocks will need manual wiring

---

## 🎯 UBRC REQUIREMENTS (Derived from Audit)

### Minimum UBRC Contract Should Include:

```typescript
interface UniversalBlockRuntimeContract {
  // Identity
  blockId: string;
  blockType: string;
  blockVersion: string;
  
  // Runtime Context
  runtimeContext: RuntimeContext;
  
  // ILS Lifecycle Hooks
  onBlockMount?: () => void;
  onBlockUnmount?: () => void;
  onBlockComplete?: () => void;
  onActiveTimeUpdate?: (seconds: number) => void;
  
  // State Access
  ilsState: {
    visitCount: number;
    revisionCount: number;
    activeTimeSec: number;
    isCompleted: boolean;
    firstViewedAt: Date | null;
    lastViewedAt: Date | null;
  };
  
  // Theme
  theme: DomainTheme;
  
  // Rendering
  renderChild?: (child: TutorialBlock, depth: number) => React.ReactNode;
  className?: string;
  depth: number;
}
```

---

## 🚨 RISKS & BLOCKERS

### HIGH PRIORITY

1. **LSNB Location Unknown** 🔴
   - Cannot define UBRC ↔ LSNB integration without identifying component
   - Risk: RSSB implementation blocked until LSNB architecture understood

2. **No Active Block Integration Pattern** 🔴
   - D1/C1 are passively observed
   - Future blocks will require custom wiring
   - Risk: UBRC cannot eliminate manual integration work

3. **Runtime Context Untyped** 🟡
   - `runtimeContext?: unknown`
   - Risk: Type safety issues during UBRC implementation

### MEDIUM PRIORITY

4. **Composer Integration Unclear** 🟡
   - Cannot verify if Composer auto-wires ILS
   - Risk: Manual metric wiring may still be required

5. **RSSB Metric Source Undefined** 🟡
   - `data.json` is prototype reference
   - Actual production data source not identified
   - Risk: RSSB may pull from wrong ILS state

---

## 📊 GATE 1 COMPLETION STATUS

**Audit Objective:** ✅ COMPLETE

**Key Findings:**
- ✅ Universal Tutorial Learner Page exists and functional
- ✅ ILS Runtime comprehensive and validated
- ✅ Block rendering universal
- ✅ D1/C1 blocks exist but passively integrated
- ⚠️ UBRC does not exist
- ⚠️ LSNB universal component not confirmed
- ❌ RSSB React/TS not implemented

**Recommendation:** **PROCEED TO GATE 2**

**Gate 2 Objectives:**
1. Locate/identify LSNB universal component
2. Define UBRC specification
3. Map RSSB prototype → ILS data sources
4. Design RSSB ↔ ILS integration contract

---

**Report End** | Generated: 2026-09-07 | Status: READY FOR GATE 2 ✅
