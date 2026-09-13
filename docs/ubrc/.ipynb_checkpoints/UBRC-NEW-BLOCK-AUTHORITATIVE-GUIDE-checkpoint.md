# UBRC New Block Development - Authoritative Guide

**Date:** 2026-09-13  
**Status:** PRODUCTION-AUTHORITATIVE  
**Location:** `docs/ubrc/UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`  
**Purpose:** Official guide for converting AI-generated prototypes into Tutorial Composer blocks

---

## Document Organization

This guide consolidates the UBRC new block development process. Supporting documents:

- **This file:** Authoritative rules and workflow
- **`TUTORIAL-BLOCK-CREATION-WORKFLOW.md`:** Detailed step-by-step implementation guide
- **`NEW-BLOCK-QUICK-START-CHECKLIST.md`:** Fast-track reference for experienced developers
- **`CORRECTIONS-APPLIED.md`:** Change log and production-readiness verification
- **`UBRC-IMPLEMENTATION-PHASE-0-REPO-AUDIT.md`:** Original UBRC contract investigation

---

## Core Principles (Non-Negotiable)

### 1. Free AI Creates Only Prototypes

**Free AI generates:**
- ✅ HTML structure (visual layout)
- ✅ CSS styling (appearance and interactions)
- ✅ JavaScript behavior (interactions and state)
- ✅ JSON data structure (content model)

**Free AI does NOT create:**
- ❌ Production TypeScript types
- ❌ React components
- ❌ Tutorial Composer integration
- ❌ UBRC contract implementation
- ❌ ILS/RSSB/LSNB integration
- ❌ Database schemas

**The prototype is source material, not production code.**

---

### 2. Project AI Performs D1/C1 Conversion

**Project AI responsibilities:**
1. **Inspect D1/C1 reference implementations** (actual files, not assumptions)
2. **Extract proven integration patterns** (types, props, registration, DOM identity)
3. **Convert prototype to TypeScript/React** following D1/C1 pattern exactly
4. **Add to existing TutorialBlock union** (no new unions)
5. **Register with existing TutorialBlockRenderer** (no new renderers)
6. **Verify contract satisfaction** (test every integration point)

**Project AI must NOT:**
- ❌ Redesign UBRC architecture
- ❌ Redesign ILS integration
- ❌ Redesign LSNB structure
- ❌ Redesign RSSB contracts
- ❌ Create separate composers per block
- ❌ Add lifecycle hooks to blocks
- ❌ Create block-specific telemetry

---

### 3. Blocks Must Not Directly Call ILS/RSSB/LSNB/Telemetry/APIs/Databases

**Blocks are pure UI components:**
```typescript
// ✅ ALLOWED in blocks
- Render JSX from content prop
- Use local React state (useState, useReducer)
- Handle user interactions (onClick, onChange)
- Consume theme prop (theme.primary, theme.secondary)
- Render DOM identity attributes (data-block-id, data-block-type, data-block-version)

// ❌ FORBIDDEN in blocks
- fetch('/api/tutorial/ils/...') 
- useILS() or useRSSB() hooks
- database queries
- telemetry emission
- navigation state manipulation
- LSNB record creation
- completion state management (unless universal contract verified)
```

**Why:** Passive observation architecture. Blocks expose identity via DOM; runtime observes and tracks.

---

### 4. Blocks Render Inside Existing TutorialDocument

**Block creation flow:**
```
1. LSNB record exists (navigationNodeId created on first page visit)
   ↓
2. TutorialDocument exists (JSONB in tutorial_content.content)
   ↓
3. New block added to TutorialDocument.blocks[] array
   ↓
4. TutorialBlockRenderer dispatches to type-specific component
   ↓
5. Block renders with DOM identity
   ↓
6. ActiveBlockContext observes via IntersectionObserver
   ↓
7. BlockTelemetryProvider emits telemetry
   ↓
8. ILS service persists to block_learning_state table
   ↓
9. RSSB displays metrics via useILS() hook
```

**Blocks do NOT:**
- ❌ Create their own pages
- ❌ Create their own navigation nodes
- ❌ Create their own LSNB records
- ❌ Manage their own persistence

**Blocks participate in existing page architecture.**

---

### 5. Existing navigationNodeId Must Be Preserved

**LSNB Relationship (Critical):**

**Page-level (LSNB):**
- Table: `tutorial_navigation_progress`
- Scope: Page/navigation-level progress
- Created: First page visit
- Tracks: Page status, visit count, time spent, completed_blocks array
- Key: (user_id, navigation_node_id)

**Block-level:**
- Table: `block_learning_state`
- Scope: Block-level learning metrics
- Created: First block view
- Tracks: Visit count, active time, completion per block
- Key: (user_id, navigation_node_id, block_id, block_version)
- Foreign key: `navigation_node_id` links to page

**Rule:**
> A new block does NOT create or modify LSNB records. It is rendered inside a TutorialDocument already associated with an existing navigationNodeId. LSNB remains page/navigation-level. The block contributes block-level identity for runtime observation.

---

### 6. No Redesign of Composer/ILS/LSNB/RSSB Architecture

**Existing infrastructure is frozen for block development:**

**Never modify these files:**
- ❌ `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`
- ❌ `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`
- ❌ `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- ❌ `packages/db-tutorial/src/services/learning-progress.service.ts`
- ❌ `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`
- ❌ `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`
- ❌ `packages/db-tutorial/migrations/schema.ts`
- ❌ API route files

**Exception:** If genuine universal contract gap discovered affecting ALL blocks:
1. Document gap with evidence from D1/C1
2. Propose universal enhancement (not block-specific)
3. Verify gap isn't already addressed
4. Get architectural approval before modifying shared infrastructure

---

### 7. Completion and Telemetry Behavior Must Be Verified

**NOT assumptions, requirements:**

**Default support (verify in your implementation):**
- ✅ Visit tracking (first view detection)
- ✅ Active time measurement (viewport observation)
- ✅ Revision count (session-based revisit)

**NOT automatic (verify D1/C1 behavior first):**
- ⚠️ Completion detection (universal contract may not exist)
- ⚠️ Interaction telemetry (button clicks, expansions)
- ⚠️ Assessment results (quiz scoring, validation)

**Rule:**
> If the existing runtime has no universal completion contract for arbitrary blocks, your new block must NOT claim to support completion automatically. Verify D1/C1 completion behavior before assuming yours will work.

**Completion types to investigate:**
- Implicit completion (time-based, end-of-block)
- Explicit completion (user clicks "Mark Complete")
- Assessment completion (quiz/exercise validation)
- Passive completion (inferred from engagement)

**Your block must NOT invent completion semantics. Follow D1/C1 exactly or omit completion.**

---

## The Authoritative Workflow

### Phase 1: Repository Path Verification (MANDATORY)

**Before any implementation:**

```bash
# 1. Verify TutorialBlock union location
# Search: "export type TutorialBlock"
# Expected: packages/types/src/tutorial-rich-document/blocks/index.ts

# 2. Verify existing block components
# Search: DefinitionBlock.tsx, CodeC1Block.tsx
# Expected: packages/ui/src/tutorial/blocks/

# 3. Verify renderer registration
# Search: TutorialBlockRenderer
# Expected: packages/ui/src/tutorial/TutorialBlockRenderer.tsx

# 4. Verify canonical builder (if exists)
# Search: buildCanonicalDefinitionD1Block
# Expected: packages/db-tutorial/src/services/canonical-block-builder.ts (or may not exist)

# 5. Verify UBRC contract implementation
# Search: data-block-id, ActiveBlockContext
# Expected: packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx
```

**⚠️ DO NOT assume paths from documentation. Locate actual files in current repository.**

**If paths differ:**
- Update your working notes with actual paths
- Follow actual repository structure
- Report discrepancies for documentation update

---

### Phase 2: D1/C1 Pattern Extraction

**Inspect actual D1 implementation:**
1. Type definition structure (Page/AuthorContent/Block interfaces)
2. Version literal usage ('D1' in type field)
3. BaseBlock inheritance pattern
4. DOM identity attributes (data-block-id, data-block-type, data-block-version)
5. Theme consumption (theme.primary, theme.secondary)
6. BlockComponentProps signature
7. Version router pattern (switch on block.version)
8. TutorialBlockRenderer registration (case statement)

**Inspect actual C1 implementation:**
1. Complex content structure (arrays, nested objects)
2. Local state management (useState for interactions)
3. Conditional rendering patterns
4. Rich UI components (terminals, syntax highlighting)

**Extract common patterns:**
1. All blocks extend BaseBlock
2. All blocks have type/version literals
3. All blocks render 3 DOM identity attributes on root element
4. All blocks accept BlockComponentProps<T>
5. All blocks use theme prop (not hardcoded colors)
6. All blocks registered in single TutorialBlockRenderer switch
7. All blocks added to TutorialBlock union

---

### Phase 3: Prototype Conversion

**Input:** HTML/CSS/JS/JSON prototype from free AI

**Output:** TypeScript/React production block

**Steps:**

#### 3.1 Define Type Interfaces
```typescript
// Based on data.json structure
export interface [BlockName]1Page {
  type: '[block-type]';
  title: string;
  // ... map data.json fields
}

export interface [BlockName]1AuthorContent {
  page: [BlockName]1Page;
}

export interface [BlockName]1Block extends BaseBlock {
  type: '[block-type]';
  version: '[BlockName]1';
  content: [BlockName]1AuthorContent;
}

export type [BlockName]Block = [BlockName]1Block;
```

#### 3.2 Create React Component
```typescript
export function [BlockName]Block({ block, theme }: BlockComponentProps<[BlockName]1BlockType>) {
  // Version router
  if (!block.version) throw new Error('Missing version');
  switch (block.version) {
    case '[BlockName]1': return <[BlockName]1View block={block} theme={theme} />;
    default: throw new Error(`Unsupported version: ${block.version}`);
  }
}

function [BlockName]1View({ block, theme }: { block: [BlockName]1BlockType; theme?: DomainTheme }) {
  const page = block.content.page;
  if (!theme?.primary || !theme?.secondary) throw new Error('Missing theme');
  
  // Convert prototype JavaScript to React hooks
  const [state, setState] = useState(initialValue);
  
  return (
    <article
      // ↓ CRITICAL: UBRC Contract
      data-block-id={block.id}
      data-block-type="[block-type]"
      data-block-version={block.version}
      className="w-full bg-white px-[5%] py-10"
      style={{ color: theme.secondary }}
    >
      {/* Convert prototype HTML to JSX */}
      {/* Replace hardcoded colors with theme.primary/secondary */}
      {/* Replace vanilla JS with React state/handlers */}
    </article>
  );
}
```

#### 3.3 Register in TutorialBlockRenderer
```typescript
// Add import
import { [BlockName]Block } from './blocks/[BlockName]Block';

// Add case to switch
case '[block-type]':
  return <[BlockName]Block block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
```

#### 3.4 Add to Type Union
```typescript
// packages/types/.../blocks/index.ts
export type {
  [BlockName]1Page,
  [BlockName]1AuthorContent,
  [BlockName]1Block,
  [BlockName]Block,
} from './content-blocks';
```

#### 3.5 Create Canonical Builder (ONLY if D1/C1 use this pattern)
```typescript
// Verify this pattern exists first!
export function buildCanonical[BlockName]1Block(
  authorContent: [BlockName]1AuthorContent,
  blockId?: string
): [BlockName]1Block {
  return {
    id: blockId || randomUUID(),
    type: '[block-type]',
    version: '[BlockName]1',
    content: authorContent,
  };
}
```

---

### Phase 4: Integration Verification (MANDATORY)

**Each step must be tested, not assumed:**

#### 4.1 TypeScript Compilation
```bash
pnpm typecheck
# ✅ PASS: No TypeScript errors
```

#### 4.2 Linting
```bash
pnpm lint
# ✅ PASS: No ESLint errors
```

#### 4.3 Build
```bash
pnpm build
# ✅ PASS: All packages build
```

#### 4.4 Render Test
1. Create TutorialDocument with your block
2. Load page in browser
3. **Verify:** Block renders without errors
4. **Verify:** No console errors

#### 4.5 DOM Identity Test
1. Open browser DevTools → Elements
2. Inspect your block's root element
3. **Verify:** `data-block-id` present with UUID value
4. **Verify:** `data-block-type` present with correct type
5. **Verify:** `data-block-version` present with correct version

#### 4.6 ActiveBlockContext Test
1. Open browser DevTools → Console
2. Scroll block into viewport
3. **Verify:** No errors in console
4. **Optional:** Check for ActiveBlock detection logs (if debug enabled)

#### 4.7 Telemetry Test
1. Open browser DevTools → Network tab
2. Scroll block into viewport (first time in session)
3. **Verify:** POST request to `/api/tutorial/ils/block-visit`
4. **Verify:** Request payload contains:
   - navigationNodeId
   - subtopicId
   - blockId (your block's UUID)
   - blockType (your block's type)
   - blockVersion (your block's version)
   - sessionId

#### 4.8 Database Test
```sql
SELECT 
  block_id, 
  block_type, 
  block_version, 
  visit_count, 
  active_time_sec
FROM block_learning_state
WHERE block_type = '[your-block-type]'
  AND block_version = '[your-block-version]'
ORDER BY created_at DESC
LIMIT 5;
```
**Verify:**
- ✅ Record exists after first view
- ✅ block_id matches your block's UUID
- ✅ block_type matches your type literal
- ✅ block_version matches your version literal
- ✅ visit_count increments on page refresh
- ✅ active_time_sec increases during viewport observation

#### 4.9 RSSB Test
1. Navigate to RSSB/progress UI
2. **Verify:** Your block appears in metrics
3. **Verify:** Visit count displayed
4. **Verify:** Time spent displayed
5. **Verify:** Completion status (if supported)

**If any metric missing:**
- Check ActiveBlockContext detection
- Check BlockTelemetryProvider POST request
- Check block_learning_state database record
- Compare with D1/C1 behavior on same page
- Do NOT assume "automatic" operation

#### 4.10 Regression Test
```bash
# Run existing tests
pnpm test

# ✅ PASS: All existing tests still pass
# ✅ PASS: D1 and C1 blocks unaffected
# ✅ PASS: No regressions in other blocks
```

---

## Files Typically Modified

**⚠️ Verify paths in actual repository**

| File | Action | Verify First |
|------|--------|--------------|
| `packages/types/.../content-blocks.ts` | Add interfaces | File exists? |
| `packages/types/.../blocks/index.ts` | Export types | Correct location? |
| `packages/ui/src/tutorial/blocks/[Name]Block.tsx` | NEW FILE | Correct directory? |
| `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` | Add case | File exists? |
| `packages/db-tutorial/.../canonical-block-builder.ts` | Add function | Pattern exists in D1/C1? |

**Total:** ~200-500 lines across 4-5 files

---

## Files NEVER Modified (Without Universal Contract Gap)

- ❌ ActiveBlockContext.tsx
- ❌ BlockTelemetryProvider.tsx
- ❌ ILSProvider.tsx
- ❌ learning-progress.service.ts
- ❌ block-learning-state.repository.ts
- ❌ tutorial-section.repository.ts
- ❌ Database migration files
- ❌ API route files

---

## Common Anti-Patterns (Forbidden)

### ❌ Lifecycle Hooks for Tracking
```typescript
// WRONG
useEffect(() => {
  trackBlockView(block.id);
}, []);
```

### ❌ Direct API Calls
```typescript
// WRONG
await fetch('/api/tutorial/ils/block-complete', {...});
```

### ❌ Custom Telemetry Events
```typescript
// WRONG
window.dispatchEvent(new CustomEvent('blockInteraction', {...}));
```

### ❌ Hierarchy in Block JSON
```typescript
// WRONG
interface MyBlock1Page {
  subtopicId: string;  // NO!
}
```

### ❌ Theme in Block JSON
```typescript
// WRONG
interface MyBlock1Page {
  brandId: string;  // NO!
  primaryColor: string;  // NO!
}
```

### ❌ Missing DOM Identity
```typescript
// WRONG
return <article>{/* Missing data-attributes */}</article>;
```

---

## Quick Reference Card

**The Pattern:**
```
Free AI → HTML/CSS/JS/JSON prototype
    ↓
Project AI → Inspect D1/C1 actual files
    ↓
Convert → TypeScript interfaces + React component
    ↓
Register → TutorialBlock union + TutorialBlockRenderer
    ↓
Verify → DOM identity + telemetry + database + RSSB
    ↓
Test → All integration points explicitly
```

**The Contract:**
```typescript
<RootElement
  data-block-id={block.id}
  data-block-type={block.type}
  data-block-version={block.version}
>
  {/* Use theme.primary, theme.secondary */}
  {/* NO API calls */}
  {/* NO telemetry */}
  {/* NO lifecycle hooks */}
</RootElement>
```

**The Rule:**
> Contract satisfaction enables UBRC/ILS/RSSB participation.  
> Actual participation must be verified through testing.

---

## Next Actions (In Order)

### 1. Repository Audit (Before Implementation)
**Deliverable:** Audit report documenting:
- Actual file paths for D1/C1
- Current block architecture
- Current renderer registration mechanism
- Current Composer insertion flow
- Current UBRC enforcement
- Current telemetry/completion capabilities
- Any mismatch between documentation and repository

**No implementation during audit phase.**

### 2. Select Pilot Block
**Criteria:**
- Simple prototype (text + basic interactions)
- No complex state management
- No assessment/scoring
- No nested blocks
- Examples: Summary card, highlight block, code explanation panel

**Avoid starting with:**
- Complex interactive quizzes
- Nested container blocks
- Assessment blocks with scoring
- Blocks requiring custom telemetry

### 3. Implement Pilot Block
Follow Phase 1-4 workflow exactly:
- Verify paths
- Extract D1/C1 patterns
- Convert prototype
- Verify integration at every step

### 4. Document Lessons Learned
After pilot block completion:
- What worked as documented?
- What paths were incorrect?
- What patterns differed from documentation?
- What additional verification was needed?
- Update this guide with corrections

### 5. Scale to Additional Blocks
Once pilot succeeds and lessons documented:
- Apply proven pattern to next blocks
- Maintain consistency with D1/C1
- Continue verification at every step
- Update guide as patterns evolve

---

## Support Resources

**Primary References:**
- This file (authoritative guide)
- `TUTORIAL-BLOCK-CREATION-WORKFLOW.md` (detailed steps)
- `NEW-BLOCK-QUICK-START-CHECKLIST.md` (fast reference)
- Actual D1/C1 implementation files (ground truth)

**D1 Reference Implementation:**
- Types: Search for `DefinitionD1Block` in repository
- Renderer: Search for `DefinitionBlock.tsx` in repository
- Registration: Check TutorialBlockRenderer switch statement

**C1 Reference Implementation:**
- Types: Search for `CodeC1Block` in repository
- Renderer: Search for `CodeC1Block.tsx` in repository
- Complex patterns: Check C1 for state management, interactions

---

## Document Status

**Version:** 1.0 (Production-Authoritative)  
**Last Updated:** 2026-09-13  
**Review Status:** All corrections applied  
**Ready For:** Operational use in block development

**Change History:**
- 2026-09-13: Initial production-authoritative version
- All 5 critical corrections applied
- Repository path verification mandatory
- Canonical builder conditional
- Runtime behavior verification required
- Completion NOT assumed universal
- LSNB relationship explicit

---

**Next Step:** Run repository audit to verify all paths and patterns before implementing first new block.
