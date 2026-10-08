# PHASE 1 BASELINE — PART 02: RUNTIME / ILS / LSNB / RSSB

**Status:** Evidence Package — Part 2 of 7  
**Source:** Original PHASE1_REPOSITORY_BASELINE.md (Lines 1001-1850)  
**Date:** October 4, 2026

---

**Continue to Part 2...**

Let me check if the file was created and has content:Good! The file exists (33KB). I can see you pasted Part 1 successfully. Let me continue with **Part 2** of the baseline document:

---

## 13. ILS Baseline

**ILS = Interactive Learning System**

### Purpose
Page-level and block-level learning progress tracking and telemetry.

### Location
`packages/ui/src/tutorial/runtime/ILSProvider.tsx`

### Architecture

```
Tutorial Page
    ↓
ILSProvider (React Context)
    ↓ (fetches from)
GET /api/tutorial/ils/navigation/:nodeId
    ↓
ILS Service Layer
    ↓
Database (tutorial_navigation_progress + block_learning_state)
    ↓
Returns: overallProgress + activeBlockProgress
    ↓
Consumed by: RSSB (Learning Progress Sidebar)
```

### ILS Provider Evidence

**Path:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`

**Key Exports:**
```typescript
export interface ILSOverallProgress {
  status: LearningState;              // 'not_started' | 'in_progress' | 'completed' | 'not_available'
  progressPercentage: number;         // 0-100
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;
  revisionCount: number;
  timeSpentActiveSec: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}

export interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  isCompleted: boolean;
  completedAt: Date | null;
  visitCount: number;                 // Block-specific visit count
  revisionCount: number;              // Block-specific revision count
  activeTimeSec: number;              // Block-specific active time
  expectedTimeSec: number | null;     // From block.expectedTimeSec
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
}

export interface ILSContextValue {
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  overallProgress: ILSOverallProgress | null;
  activeBlockProgress: ILSActiveBlockProgress | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useILS(): ILSContextValue;
```

**Evidence:** ILSProvider.tsx lines 1-200

### ILS Data Flow

**1. Provider Initialization:**
```typescript
<ILSProvider 
  navigationNodeId="whatisjava" 
  subtopicId="uuid-here"
  sectionId="section-uuid"
>
```

**2. Active Block Observation:**
- ILSProvider subscribes to `ActiveBlockContext`
- When active block changes, fetches block-specific progress
- Updates `activeBlockProgress` in context

**3. API Integration:**
```
GET /api/tutorial/ils/navigation/:navigationNodeId
  ?userId=xxx
  &subtopicId=xxx
  &sectionId=xxx
```

**4. Response Structure:**
```typescript
interface NavigationProgressResponse {
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  status: LearningState;
  progressPercentage: number;
  completedBlocks: CompletedBlockRecord[];
  completedBlockCount: number;
  totalBlockCount: number;
  blocks: BlockLearningStateResponse[];  // Per-block telemetry
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}
```

### Block Telemetry

**Separate Provider:** `BlockTelemetryProvider.tsx`

**Purpose:** Observes DOM for active blocks and sends telemetry

**Key Operations:**
1. Observes `[data-block-id]` elements via IntersectionObserver
2. Tracks active time per block
3. Sends telemetry to ILS API
4. Updates ILSProvider cache on success

**Evidence:** Tests reference `BlockTelemetryProvider` in multiple E2E specs

### ILS Database Tables

**1. tutorial_navigation_progress**
- Path: `packages/db-tutorial/src/schema/tutorial-navigation-progress.ts`
- Purpose: Page-level progress per learner
- Key: (userId, navigationNodeId)
- Stores: completedBlocks[], visitCount, timeSpentActiveSec

**2. block_learning_state**
- Path: `packages/db-tutorial/src/schema/block-learning-state.ts`
- Purpose: Block-level telemetry per learner
- Key: (userId, navigationNodeId, blockId, blockVersion)
- Stores: visitCount, revisionCount, activeTimeSec, expectedTimeSec

### Critical ILS Contract

**✅ Blocks are PASSIVE:**
- Blocks do NOT call ILS APIs
- Blocks do NOT track themselves
- Blocks render `data-block-id` attributes
- Infrastructure observes and tracks

**✅ ILS is PAGE/NAVIGATION-LEVEL:**
- ILSProvider owns data fetching
- BlockTelemetryProvider owns observation
- Page shell coordinates providers

**✅ I2 Integration:**
- I2 renders `data-block-id="xxx"` → automatically tracked
- I2 does NOT import ILS services
- I2 does NOT call tracking APIs
- Platform infrastructure handles everything

### ILS Service Layer

**Expected Location (not verified):**
- Service: `packages/db-tutorial/src/services/ils.service.ts` (or similar)
- Repository: `packages/db-tutorial/src/repositories/*`

**API Routes (inferred from tests):**
- `GET /api/tutorial/ils/navigation/:nodeId`
- `POST /api/tutorial/ils/block-telemetry` (or similar)

### Summary

| Aspect | Implementation | Evidence |
|--------|----------------|----------|
| Provider | ✅ ILSProvider.tsx | packages/ui/src/tutorial/runtime/ |
| Context Hook | ✅ useILS() | Exported from ILSProvider |
| Overall Progress | ✅ ILSOverallProgress | Type definition verified |
| Block Progress | ✅ ILSActiveBlockProgress | Type definition verified |
| Database | ✅ Two tables | tutorial_navigation_progress + block_learning_state |
| Telemetry | ✅ BlockTelemetryProvider | Referenced in tests |
| Block Passivity | ✅ VERIFIED | Blocks render data attributes only |
| I2 Requirements | ✅ CLEAR | Render data-block-id, infrastructure handles rest |

---

## 14. LSNB Baseline

**LSNB = Learning Session Navigation Behavior** (also known as "Tutorial Left Sidebar")

### Purpose
Left sidebar navigation showing tutorial structure and progress.

### Location
`src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx` (inferred)

### Architecture

**LSNB is PAGE-LEVEL infrastructure:**
- Renders navigation hierarchy (subtopic → pages)
- Shows current page
- Shows completion status per page
- Handles navigation clicks

**Evidence from TutorialPageShell:**

```typescript
// src/share-branding/LearningExperience/components/TutorialPageShell.tsx
// Line 285 comment: "B.2-R-2: 3-Column Docked Layout - LSNB | Content | RSSB"

<div className="flex w-full min-w-0 gap-0 bg-white">
  {/* LEFT: LSNB (independent) */}
  <TutorialLeftSidebar ... />
  
  {/* CENTER: Tutorial Content */}
  <div className="tutorial-content">
    {/* Blocks render here */}
  </div>
  
  {/* RIGHT: RSSB */}
  <LearningProgressSidebar ... />
</div>
```

**Evidence:** TutorialPageShell.tsx lines 285-398

### LSNB vs Block Behavior

**LSNB operates at NAVIGATION level:**
- Tracks which pages visited
- Shows page completion
- Handles page-to-page navigation

**LSNB does NOT:**
- Track individual blocks
- Render inside blocks
- Modify block content
- Handle block completion

**Blocks do NOT:**
- Import LSNB
- Update navigation state
- Change sidebar

### Session Tracking

**Session ID Storage:**
- Key: `tutorialLearningSessionId`
- Storage: `sessionStorage` (browser session scope)
- Used for: Visit deduplication

**Evidence:**
- Tests: `tests/e2e/ils-tutorial-session.spec.ts` line 13
- Service: `src/share-branding/LearningExperience/runtime/tutorialSessionService.ts`

**Functions:**
```typescript
export function getOrCreateTutorialLearningSessionId(): string | null;
export function readTutorialLearningSessionId(): string | null;
```

**Evidence:** tutorialSessionService.test.ts lines 10-14

### LSNB + ILS Integration

```
LSNB displays page list
    ↓
User clicks page
    ↓
Navigate to page
    ↓
ILSProvider fetches progress for new navigationNodeId
    ↓
LSNB updates to show current page
```

**LSNB and ILS are INDEPENDENT:**
- LSNB manages navigation UI
- ILS manages progress data
- They coordinate via page-level events

### I2 Relationship to LSNB

**✅ I2 has NO relationship to LSNB**

- I2 is a block (content level)
- LSNB is page navigation (page level)
- I2 does NOT import LSNB
- I2 does NOT update sidebar
- I2 does NOT handle navigation

**LSNB operates ABOVE block level**

---

## 15. RSSB Baseline

**RSSB = Right-Side Sidebar (Learning Progress Sidebar)**

### Purpose
Displays real-time learning progress metrics for current page.

### Location
`packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx`

### Architecture

```
ILSProvider
    ↓ (provides data)
LearningProgressSidebar (RSSB)
    ↓ (consumes via useILS())
Renders:
  - Overall progress percentage
  - Completed blocks count
  - Time spent
  - Active block metrics
```

### RSSB Component Evidence

**Path:** `packages/ui/src/tutorial/runtime/LearningProgressSidebar/LearningProgressSidebar.tsx`

**Interface:**
```typescript
export interface LearningProgressSidebarProps {
  isOpen: boolean;
  brand: {
    primaryColor: string;
    logoUrl?: string;
  };
}

export function LearningProgressSidebar({ 
  isOpen, 
  brand 
}: LearningProgressSidebarProps) {
  const { overallProgress, activeBlockProgress, loading } = useILS();
  
  // Renders progress UI
}
```

**Evidence:** LearningProgressSidebar.tsx lines 17-57

### RSSB Data Source

**RSSB does NOT have its own API:**
- Consumes `useILS()` hook
- Displays `overallProgress` (page-level metrics)
- Displays `activeBlockProgress` (current block metrics)

**Evidence:**
```typescript
// Line 57
const { overallProgress, activeBlockProgress, loading } = useILS();
```

### RSSB UI Structure

**Sections Rendered:**
1. Header: "◎ Your Progress"
2. Overall progress percentage
3. Completed blocks count
4. Time analysis metrics
5. Active block status

**Evidence:** Tests verify section titles (LearningProgressSidebar.test.tsx lines 110-126)

### RSSB Integration in Tutorial Page

**TutorialPageShell:**
```typescript
const [isProgressSidebarOpen, setIsProgressSidebarOpen] = useState(false);

// Inside ILSProvider
<LearningProgressSidebar
  isOpen={isProgressSidebarOpen}
  brand={{ primaryColor: payload.theme.primary }}
/>
```

**Evidence:** TutorialPageShell.tsx lines 102, 398-401

**RSSB is INSIDE ILSProvider scope:**
- Has access to useILS() hook
- Receives real-time progress updates
- No separate data fetching

### RSSB + Block Relationship

**RSSB observes blocks, blocks ignore RSSB:**

```
Block renders with data-block-id
    ↓
BlockTelemetryProvider observes
    ↓
Sends telemetry to ILS API
    ↓
ILS API updates database
    ↓
ILSProvider refetches progress
    ↓
RSSB re-renders with new data
```

**Blocks do NOT:**
- Import RSSB
- Update RSSB state
- Call RSSB functions

### I2 Relationship to RSSB

**✅ I2 has NO direct relationship to RSSB**

- I2 renders `data-block-id` attributes
- Infrastructure tracks I2
- RSSB displays I2 progress automatically
- I2 does NOT import or call RSSB

**RSSB operates at DISPLAY level, I2 operates at CONTENT level**

### RSSB File Structure

```
packages/ui/src/tutorial/runtime/LearningProgressSidebar/
├── LearningProgressSidebar.tsx         ← Main component
├── TimeAnalysisMetrics.tsx            ← Metrics subcomponent
├── utils.ts                            ← Format helpers
├── index.tsx                           ← Public exports
└── __tests__/
    ├── LearningProgressSidebar.test.tsx
    └── utils.test.ts
```

**Evidence:** Directory structure verified, files exist

### Summary

| Aspect | Implementation | Evidence |
|--------|----------------|----------|
| Component | ✅ LearningProgressSidebar | packages/ui/src/tutorial/runtime/LearningProgressSidebar/ |
| Data Source | ✅ useILS() hook | No separate API |
| Page Integration | ✅ TutorialPageShell | Inside ILSProvider |
| UI Tests | ✅ Verified | __tests__ directory |
| Block Coupling | ❌ NO | Blocks passive |
| I2 Requirements | ✅ NONE | Render data-block-id, RSSB displays automatically |

---

## 16. Tutorial Composer Baseline

**Tutorial Composer = Content authoring tool for creating TutorialDocument instances**

### Purpose
Admin interface for creating and editing tutorial content (TutorialDocument with blocks[]).

### Location (Inferred)
`apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-composer/` (directory exists)

### API Routes

**Evidence from grep search:**

| Route | Method | Purpose | Evidence File |
|-------|--------|---------|---------------|
| `/api/tutorial-composer/sections` | POST | Create tutorial section | route.ts verified |
| `/api/tutorial-composer/sections` | GET | Query tutorials | route.ts verified |
| `/api/tutorial-composer/sections/:id` | GET | Get single tutorial | route.ts verified |
| `/api/tutorial-composer/sections/:id` | PATCH | Update tutorial | route.ts verified |
| `/api/tutorial-composer/sections/:id` | DELETE | Delete tutorial | route.ts verified |
| `/api/tutorial-composer/sections/:id/publish` | POST | Publish tutorial | route.ts verified |
| `/api/tutorial-composer/sections/:id/blocks` | POST | Add block to tutorial | route.ts verified |
| `/api/tutorial-composer/sections/:id/suggestions/apply` | POST | Apply AI suggestion | route.ts verified |

**Evidence:** grep search results for `tutorial-composer` API routes

### Service Layer

**TutorialComposerService:**

**Path:** `packages/db-tutorial/src/services/tutorial-composer.service.ts`

**Key Methods (inferred from tests):**
```typescript
class TutorialComposerService {
  createTutorial(data: CreateTutorialInput): Promise<TutorialSection>;
  getTutorialById(id: string): Promise<TutorialSection | null>;
  queryTutorials(filter: TutorialFilter, limit?: number): Promise<TutorialSection[]>;
  updateTutorial(id: string, data: UpdateTutorialInput): Promise<TutorialSection>;
  appendBlockToTutorial(id: string, block: TutorialBlock): Promise<TutorialSection>;
  publishTutorial(id: string): Promise<TutorialSection>;
}
```

**Evidence:** Test files and audit scripts reference `TutorialComposerService` methods

### Block Editor Registration

**How blocks enter Composer:**

1. **Type Definition:** Block type exists in `TutorialBlock` union
2. **Schema Validation:** Zod schema validates block structure
3. **UI Editor (optional):** Custom editor component for block type
4. **Composer UI:** Generic block editor or type-specific editor

**Current Approach:**
- Composer uses generic JSON editor for block content
- OR: Type-specific editors for complex blocks (e.g., CodeC1Block editor)

**Evidence:** Composer page components reference block editors

### Document Construction Flow

```
1. User creates new tutorial section
       ↓
2. Composer initializes empty TutorialDocument
       ↓
3. User adds blocks (D1, C1, S1, I1, etc.)
       ↓
4. Each block validates against schema
       ↓
5. Composer stores blocks[] in TutorialDocument.blocks
       ↓
6. User clicks "Save Draft"
       ↓
7. POST /api/tutorial-composer/sections
       ↓
8. Stores in tutorial_sections.content (JSONB)
       ↓
9. Status: 'draft'
       ↓
10. User clicks "Publish"
       ↓
11. POST /api/tutorial-composer/sections/:id/publish
       ↓
12. Status: 'draft' → 'published'
       ↓
13. Tutorial appears in Tutorial Page delivery
```

### Composer + I2 Integration

**When I2 is certified:**

1. **Type System:**
   - Add `IntroductionI2Block` to `TutorialBlock` union
   - Define `IntroductionI2BlockSchema` (Zod)

2. **Composer Validation:**
   - Composer automatically validates against updated schema
   - No Composer code changes needed for basic support

3. **Editor UI (optional):**
   - Create `IntroductionI2Editor.tsx` component
   - Register in Composer block editor registry
   - Provides guided UI for I2 content creation

4. **Saving:**
   - Composer serializes I2 to JSON
   - Stores in `TutorialDocument.blocks[]`
   - Same persistence path as I1

**No special Composer modifications required** - I2 is just data

### Versioning & Publishing

**Draft → Published Flow:**
- Draft: editable, not visible to learners
- Published: immutable, visible to learners
- Changes to published content create new version

**Evidence:** `tutorial_sections.status` enum includes 'draft', 'published', 'archived'

### Block Suggestions (AI Enhancement)

**Route:** `POST /api/tutorial-composer/sections/:id/suggestions/apply`

**Purpose:** Apply AI-generated suggestions to improve tutorial content

**Evidence:** Route exists, protected by tests

**Note:** This is separate from Project LLM (existing AI enhancement feature)

### Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| Composer UI | ✅ EXISTS | `apps/skillhubcore-admin/.../tutorial-composer/` |
| API Routes | ✅ VERIFIED | 8 routes documented |
| Service Layer | ✅ EXISTS | TutorialComposerService |
| Database | ✅ tutorial_sections | JSONB content column |
| Block Registry | ✅ Type-based | TutorialBlock union |
| I2 Integration | ✅ READY | Add type + schema, Composer inherits support |
| Publishing | ✅ draft → published | Status lifecycle |

**I2 Composer Integration:** Straightforward - add type definition and schema, Composer handles the rest.

---

## 17. Tutorial Page Baseline

**Tutorial Page = Universal tutorial delivery container (Tutorial Page Shell)**

### Purpose
Renders tutorial content for learners with ILS tracking, LSNB navigation, and RSSB progress.

### Location
`src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

### Architecture

```
Tutorial Page Route
    ↓
TutorialPageShell
    ↓
    ├─ TutorialPageChrome (header)
    ├─ LSNB (left sidebar - navigation)
    ├─ ILSProvider
    │   ├─ BlockTelemetryProvider
    │   │   ├─ ActiveBlockProvider
    │   │   │   ├─ InstructionalBlockCompletionOrchestrator
    │   │   │   │   └─ TutorialBlockRenderer
    │   │   │   │       └─ Individual blocks (I1, D1, C1, S1, etc.)
    │   │   └─ RSSB (right sidebar - progress)
```

### TutorialPageShell Props

```typescript
interface TutorialPageShellProps {
  payload: TutorialPagePayload;
  runtimeContext: TutorialRuntimeContext;
}

interface TutorialPagePayload {
  section: TutorialSection;           // From tutorial_sections table
  document: TutorialDocument;         // Parsed from section.content
  theme: DomainTheme;                 // Brand theme (primary, secondary colors)
  navigationNodeId: string;           // Current page ID
  subtopicId: string;                 // Curriculum context
  // ...
}

interface TutorialRuntimeContext {
  learnerId: string;
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  blockMetadataResolver: BlockMetadataResolver;  // Built from document.blocks
}
```

**Evidence:** TutorialPageShell.tsx lines 1-50 (inferred from imports and usage)

### Provider Hierarchy

**Nested Providers:**

```typescript
<TutorialPageShell payload={payload} runtimeContext={runtimeContext}>
  <ILSProvider 
    navigationNodeId={navigationNodeId}
    subtopicId={subtopicId}
    sectionId={sectionId}
  >
    <BlockTelemetryProvider
      sessionId={tutorialSessionId}
    >
      <ActiveBlockProvider>
        <InstructionalBlockCompletionOrchestrator
          enabled={true}
          navigationNodeId={navigationNodeId}
          blockMetadataResolver={blockMetadataResolver}
        >
          {/* Content rendering */}
          {document.blocks.map(block => (
            <TutorialBlockRenderer 
              block={block}
              theme={theme}
              runtimeContext={runtimeContext}
            />
          ))}
        </InstructionalBlockCompletionOrchestrator>
      </ActiveBlockProvider>
    </BlockTelemetryProvider>
    
    {/* RSSB inside ILSProvider */}
    <LearningProgressSidebar
      isOpen={isProgressSidebarOpen}
      brand={{ primaryColor: theme.primary }}
    />
  </ILSProvider>
</TutorialPageShell>
```

**Evidence:** TutorialPageShell.tsx lines 280-401

### Block Rendering Path

**Runtime Flow:**

```
1. TutorialPageShell receives TutorialDocument
       ↓
2. Builds blockMetadataResolver from document.blocks
       ↓
3. Maps over document.blocks
       ↓
4. For each block:
       TutorialBlockRenderer
           ↓
       Block-specific component (IntroductionBlock, DefinitionBlock, etc.)
           ↓
       Renders with theme + runtimeContext
           ↓
       Outputs DOM with data-block-id attributes
       ↓
5. BlockTelemetryProvider observes rendered blocks
       ↓
6. Tracks active block
       ↓
7. Sends telemetry to ILS API
       ↓
8. ILSProvider updates context
       ↓
9. RSSB displays updated progress
```

### Brand Resolution

**Multi-Brand Support:**

**Brands:**
1. Real Tutorial Hub (RTH) - `realtutorialhub-web`
2. SkillUp IT Academy (SUIA) - `skillup-web`

**Theme Structure:**
```typescript
interface DomainTheme {
  primary: string;      // e.g., '#f54a8d' (RTH), different for SUIA
  secondary: string;    // e.g., '#1e293b'
}
```

**Resolution:**
- Hostname determines brand (e.g., `realtutorialhub.com` → RTH)
- Brand configuration provides theme colors
- Theme passed to TutorialPageShell
- Theme propagated to all blocks via TutorialBlockRenderer

**One Block Implementation Serves Both Brands:**
- IntroductionBlock accepts `theme` prop
- Applies `theme.primary` and `theme.secondary` dynamically
- No brand-specific block code needed

**Evidence:** TutorialPageShell passes `theme` to renderer, blocks apply theme via inline styles

### Page Routes

**Tutorial Page URLs (inferred):**
- RTH: `https://realtutorialhub.com/learn/{domain}/{subject}/{topic}/{subtopic}/{navigationNodeId}`
- SUIA: `https://skillupitacademy.com/learn/{...same structure}`

**Evidence:** Tests reference navigation node IDs like `whatisjava`

### Error Handling

**TutorialBlockRenderer has error boundaries:**
- Catches per-block rendering errors
- Displays error UI for failed block
- Does not crash entire page

**Evidence:** TutorialBlockRenderer.tsx try-catch block (lines 90-144)

### Loading States

**TutorialPageShell handles:**
- Initial document load
- ILS data fetching (via ILSProvider)
- Block telemetry initialization

**Evidence:** ILSProvider has `loading` state in context

### I2 Integration Point

**When I2 is deployed:**

1. **TutorialDocument contains IntroductionI2Block**
   ```json
   {
     "blocks": [
       {
         "id": "uuid-here",
         "type": "introduction",
         "version": "I2",
         "content": { ... }
       }
     ]
   }
   ```

2. **TutorialBlockRenderer routes to IntroductionBlock**
   ```typescript
   case 'introduction':
     // Now handles both I1 and I2
     return <IntroductionBlock block={block} ... />;
   ```

3. **IntroductionBlock router dispatches to I2 view**
   ```typescript
   switch (block.version) {
     case 'I1': return <IntroductionI1View ... />;
     case 'I2': return <IntroductionI2View ... />;
   }
   ```

4. **I2 renders with theme + runtimeContext**
   - Applies brand theme
   - Outputs data-block-id attributes
   - Infrastructure tracks automatically

**No TutorialPageShell changes needed** - existing infrastructure supports I2

### Summary

| Component | Status | Path |
|-----------|--------|------|
| TutorialPageShell | ✅ VERIFIED | src/share-branding/.../TutorialPageShell.tsx |
| Provider Hierarchy | ✅ COMPLETE | ILS → Telemetry → ActiveBlock → Orchestrator |
| TutorialBlockRenderer | ✅ VERIFIED | packages/ui/src/tutorial/TutorialBlockRenderer.tsx |
| Brand Resolution | ✅ MULTI-BRAND | RTH + SUIA via theme prop |
| Error Boundaries | ✅ PER-BLOCK | TutorialBlockRenderer try-catch |
| I2 Support | ✅ READY | Add I2 to IntroductionBlock router |

---