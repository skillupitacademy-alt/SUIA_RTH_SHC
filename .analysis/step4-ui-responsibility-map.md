# Step 4: UI Responsibility Mapping

**Date:** 2026-08-23  
**Current State:** Steps 1–3 frozen  
**Component Size:** 1,144 lines (reduced from ~1,600)  
**Objective:** Map remaining responsibilities before extracting UI

---

## Frozen Milestones

| Step | Module | Status | Commit |
|------|--------|--------|--------|
| 1 | C1 Converter | 🔒 FROZEN | `21b1e8f1` |
| 2 | Document Transformation | 🔒 FROZEN | `c9541096` |
| 3 | Block Registry & Examples | 🔒 FROZEN | `d4a168ea` |

---

## Component Responsibility Analysis

### A. Shared Composer UI (Infrastructure)

**Responsibilities that apply to ALL block types/versions:**

1. **Page Header** (Lines ~597-618)
   - Title: "Tutorial Page Builder"
   - Document block count indicator
   - Loading state indicator

2. **Hierarchy Selection Toolbar** (Lines ~620-753)
   - Domain dropdown
   - Subject dropdown (filtered by domain)
   - Topic dropdown (filtered by subject)
   - Subtopic dropdown (filtered by topic)
   - State: 4-level cascade with `HierarchyState`
   - **Ownership:** Shared infrastructure

3. **Block Type & Version Selection** (Lines ~755-798)
   - Block type dropdown (Definition/Code/Summary)
   - Version dropdown (D1/C1/S1)
   - Format selector (JSON/Markdown)
   - **Ownership:** Shared infrastructure + Registry integration

4. **Document Block List** (Lines ~888-970)
   - Displays all BlockInstance[] in order
   - Shows: block number, title, version code, ID
   - Actions: Load into editor, Remove
   - **Ownership:** Shared infrastructure

5. **Preview Mode Switcher** (Lines ~975-1000)
   - Toggle: "Full Document" vs "Active Block"
   - **Ownership:** Shared infrastructure

6. **Messages & Warnings** (Lines ~872-886)
   - Success/error messages
   - Memory model warning (C1-specific logic, shared UI)
   - **Ownership:** Shared UI with block-specific concerns

---

### B. Block-Specific Authoring UI

**Responsibilities that vary by block type/version:**

1. **JSON Editor** (Lines ~810-860)
   - Currently: Generic textarea for all blocks
   - Future: Could be version-specific editors
   - **Current:** Shared generic editor
   - **Future:** Version-specific authoring components?

2. **Preview Rendering** (Lines ~1003-1040)
   - Definition: Uses `TutorialBlockRenderer`
   - Code: Uses `TutorialBlockRenderer` + C1 converter
   - Summary: Uses `TutorialSummaryContent`
   - **Ownership:** Block/version-specific rendering logic

3. **AI Instructions Container** (Lines 1045-1144, Component: `AiInstructionContainer`)
   - Generates block-specific prompts
   - Different schema for D1/C1/S1
   - Collapsible UI
   - Copy button
   - **Ownership:** Block/version-specific content, shared container UI

---

### C. State & Business Logic

**Pure logic that orchestrates data flow:**

1. **Form State Management** (Lines 172-188)
   - `FormState` interface: brandId, hierarchy IDs, blockType, versionId
   - `updateForm()` handler with cascade logic
   - **Ownership:** Shared state logic

2. **Document State** (Lines 189-192)
   - `documentBlocks: BlockInstance[]`
   - `isLoadingDocument`
   - `loadedSectionId`
   - `hasUnsavedLocalChangesRef`
   - **Ownership:** Shared document orchestration

3. **Editor State** (Lines 175-183)
   - `sourceFormat`, `sourceContent`, `activeBlockPreview`
   - `previewMode`
   - `message`, `memoryModelWarning`
   - `isSaving`
   - **Ownership:** Shared editor state

4. **Hierarchy Data Loading** (Lines 195-237)
   - `useEffect` to fetch domains/subjects/topics/subtopics
   - **Ownership:** Infrastructure

5. **Document Loading** (Lines 362-454)
   - `loadExistingTutorial()` - fetches from API
   - Calls `tutorialBlocksToInstances()` from Step 2
   - **Ownership:** Document orchestration

6. **Block Operations** (Lines 277-361)
   - `handlePreviewCurrent()` - parse & preview
   - `handleAddBlockInstance()` - parse & append (calls C1 converter if needed)
   - `handleRemoveBlockInstance()` - remove from list
   - **Ownership:** Shared with block-specific conversion

7. **Save & Publish** (Lines 455-586)
   - `save()` - converts BlockInstance[] → TutorialBlock[], POSTs to API
   - Uses `toTutorialBlock()` from Step 2
   - **Ownership:** Document persistence orchestration

---

### D. Pure Helper Functions

**Stateless utilities:**

1. **`themeForBrand()`** (Lines 107-125)
   - Maps brand ID → BrandTutorialTheme
   - **Ownership:** Shared infrastructure
   - **Candidate for:** `theme/` module

2. **`parseSource()`** (Lines 127-170)
   - Converts JSON/Markdown → payload object
   - Block-type-specific logic
   - **Ownership:** Shared parsing
   - **Candidate for:** `document/sourceParser.ts`

3. **`appendTutorialBlock()`** (Lines 86-91)
   - Immutable document append helper
   - **Ownership:** Already exported, used by tests
   - **Keep as is:** Simple utility

---

## Architectural Boundaries

### Current Component Structure

```text
TutorialPageContentBuilderClient (1,144 lines)
│
├── Shared Infrastructure UI
│   ├── Header
│   ├── Hierarchy toolbar
│   ├── Block/version selection
│   ├── Document block list
│   └── Preview mode switcher
│
├── Block-Specific UI
│   ├── AI instruction prompts (D1/C1/S1)
│   ├── Preview rendering (D1/C1/S1)
│   └── JSON editor (currently shared)
│
├── State Orchestration
│   ├── Form state (hierarchy + block selection)
│   ├── Document state (BlockInstance[])
│   ├── Editor state (source, preview)
│   └── API state (loading, saving)
│
├── Business Logic
│   ├── Hierarchy loading
│   ├── Document loading/saving
│   ├── Block operations (add/remove/preview)
│   └── Conversion orchestration
│
└── Utilities
    ├── themeForBrand()
    ├── parseSource()
    └── appendTutorialBlock()
```

---

## Extraction Candidates

### High-Value Extractions (Next Steps)

1. **AI Instructions Component** → `blocks/{type}/{version}/` folders
   - Each version owns its prompt template
   - Shared container UI remains in composer
   - **Reason:** Prompts are version-specific knowledge

2. **Source Parser** → `document/sourceParser.ts`
   - Already block-type-aware
   - Pure function, testable
   - **Reason:** Document-level concern, not UI

3. **Theme Helper** → `theme/brandTheme.ts`
   - Pure function
   - Used by preview
   - **Reason:** Shared infrastructure utility

4. **Preview Rendering Logic** → Extract per-block rendering setup
   - Not the renderer itself (external `@quiz/ui`)
   - But the conversion/preparation logic
   - **Reason:** Block-specific preparation

### Medium Priority

5. **Hierarchy Management** → `hierarchy/` module
   - State, loading, filtering logic
   - Reusable across other admin tools
   - **Reason:** Separates domain navigation from block authoring

6. **Document State Hook** → `hooks/useDocumentState.ts`
   - Manages BlockInstance[] and operations
   - **Reason:** Reusable state management pattern

### Low Priority / Keep in Main Component

7. **Main Layout & Grid** - Keep
   - This is the actual "page" component
   - Composes all other pieces
   - **Reason:** Must remain as orchestrator

8. **Form Controls** - Keep for now
   - Could become `<HierarchySelector>` component later
   - But not urgent - current implementation works
   - **Reason:** UI is stable, low complexity

---

## Version-Specific Module Vision

### Future C1 Module Structure

```text
blocks/code/C1/
├── codeC1.converter.ts           🔒 Step 1
├── codeC1.examples.ts            🔒 Step 3
├── codeC1.aiPrompt.ts            ← Extract AI instruction template
├── CodeC1Authoring.tsx           ← Future: Custom authoring UI (optional)
└── CodeC1PreviewSetup.ts         ← Extract preview preparation logic
```

### Future D1 Module Structure

```text
blocks/definition/D1/
├── definitionD1.examples.ts      🔒 Step 3
├── definitionD1.aiPrompt.ts      ← Extract AI instruction template
├── DefinitionD1Authoring.tsx     ← Future: Custom authoring UI (optional)
└── DefinitionD1PreviewSetup.ts   ← Extract preview preparation logic
```

### Future S1 Module Structure

```text
blocks/summary/S1/
├── summaryS1.examples.ts         🔒 Step 3
├── summaryS1.aiPrompt.ts         ← Extract AI instruction template
├── SummaryS1Authoring.tsx        ← Future: Custom authoring UI (optional)
└── SummaryS1PreviewSetup.ts      ← Extract preview preparation logic
```

---

## Critical Constraints

### What Must NOT Be Extracted

1. **Main Layout Orchestration**
   - The `<main>`, `<header>`, `<section>` structure
   - Grid layout between editor and preview
   - **Reason:** This IS the page component

2. **State Coordination**
   - How form state flows through the system
   - How document blocks are managed
   - **Reason:** Central orchestration responsibility

3. **API Integration Points**
   - `/api/tutorial-composer/*` calls
   - **Reason:** Composer owns the API contract

### What Must Remain Version-Agnostic

1. **Document Block List UI**
   - Shows BlockInstance[] generically
   - Works for any block type/version
   - **Reason:** Infrastructure responsibility

2. **Hierarchy Selection**
   - Domain/Subject/Topic/Subtopic navigation
   - **Reason:** Not block-specific

---

## Recommended Next Steps

### Step 5: Extract AI Prompts (Low Risk)

**Target:**
- Move D1/C1/S1 AI instruction templates to version folders
- Create `aiPrompt.ts` in each version folder
- Update `AiInstructionContainer` to query registry for prompts

**Why First:**
- Pure data extraction (strings)
- No UI component changes
- No state changes
- Can verify with TypeScript + E2E

**Files Created:**
```text
blocks/definition/D1/definitionD1.aiPrompt.ts
blocks/code/C1/codeC1.aiPrompt.ts
blocks/summary/S1/summaryS1.aiPrompt.ts
```

**Files Modified:**
```text
TutorialPageContentBuilderClient.tsx (remove inline prompts)
AiInstructionContainer (query prompts from registry)
registry/types.ts (add getAiPrompt capability)
```

---

### Step 6: Extract Source Parser (Medium Risk)

**Target:**
- Move `parseSource()` → `document/sourceParser.ts`
- Keep block-type awareness
- Update main component import

**Why Second:**
- Pure function
- Already block-type-aware
- Easy to test
- Document-level concern

---

### Step 7: Extract Theme Helper (Low Risk)

**Target:**
- Move `themeForBrand()` → `theme/brandTheme.ts`
- Update imports

**Why Third:**
- Pure function
- Shared infrastructure
- Used by preview

---

### Step 8+: Larger Extractions (Higher Risk)

After Steps 5–7 proven safe:
- Hierarchy management hook
- Document state hook
- Block-specific preview setup

---

## Success Criteria

After each step:
1. ✅ TypeScript compilation passes
2. ✅ E2E: 12/12 tests pass
3. ✅ Git commit
4. 🔒 Freeze the step

**No behavior changes. Only structural refactor.**

---

## Line Count Target

Not a goal, but expected trend:

```text
Current:  1,144 lines
Step 5:   ~1,050 lines (AI prompts → version folders)
Step 6:   ~1,000 lines (parseSource → document/)
Step 7:   ~980 lines  (themeForBrand → theme/)
Step 8+:  ~800-900 lines (hooks, larger extractions)
```

Final main component should be **orchestrator**, not **owner**.

---

## Architecture Vision

```text
TutorialPageContentBuilderClient (orchestrator)
            │
            ├── Hierarchy UI (Domain/Subject/Topic/Subtopic)
            ├── Block Selection UI (Type/Version)
            ├── Document Block List
            ├── Editor Panel
            ├── Preview Panel
            │
            ▼
        Registry API
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
   D1      C1      S1
    │       │       │
 examples examples examples
 prompts  prompts  prompts
 converter (only C1)
 preview   preview  preview
 authoring authoring authoring
```

Each version is **self-contained**, registry provides **discovery**, main component is **orchestrator**.

---

## End of Step 4 Analysis

**Next Action:** User approval for Step 5 (Extract AI Prompts) or alternative direction.
