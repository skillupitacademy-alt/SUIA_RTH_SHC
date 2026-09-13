# Tutorial Block Creation Workflow

**Date:** 2026-09-13  
**Status:** AUTHORITATIVE REFERENCE  
**Based on:** D1/C1 proven integration pattern investigation  
**Purpose:** Convert AI-generated HTML/CSS/JS/JSON prototypes into valid Tutorial Composer blocks

---

## Executive Summary

**The Rule:**
> Free AI creates the visual prototype.  
> Project AI converts it into the exact D1/C1 block contract.  
> Tutorial Composer assembles it under an existing Navigation Node ID.  
> The block becomes eligible for UBRC/ILS/RSSB pipeline when it satisfies the contract; runtime participation must be verified.

**What We Do NOT Do:**
- ❌ Redesign UBRC (already works)
- ❌ Redesign ILS (already works)
- ❌ Redesign LSNB (already works)
- ❌ Redesign RSSB (already works)
- ❌ Redesign page runtime (already works)

**What We DO:**
- ✅ Follow D1/C1 proven pattern
- ✅ Convert prototype to React component
- ✅ Add to TutorialBlock union
- ✅ Register with TutorialBlockRenderer
- ✅ Expose DOM identity (3 data-attributes)
- ✅ Use existing theme
- ✅ Verify contract satisfaction enables UBRC/ILS/RSSB participation

---

## The Architecture (Already Proven)

```
LSNB Navigation Node (navigationNodeId)
  ↓
Tutorial Page / TutorialDocument
  ↓
Ordered block list
  ├── D1 (definition)
  ├── C1 (code)
  ├── New Block ← YOU ARE HERE
  └── Other Blocks
  ↓
TutorialBlockRenderer (type-based dispatch)
  ↓
Block Component (renders DOM with identity)
  ↓
UBRC Passive Observation (ActiveBlockContext)
  ↓
BlockTelemetryProvider (POST /api/ils/block-visit)
  ↓
ILS Service (recordBlockVisit, recordBlockActiveTime)
  ↓
PostgreSQL (block_learning_state table)
  ↓
RSSB UI (useILS() hook → metrics display)
```

**Your block participates by:**
1. Rendering root element with `data-block-id`, `data-block-type`, `data-block-version`
2. Satisfying the established block contract (type system, props, rendering)
3. Runtime participation must be verified through testing

**CRITICAL:** The block becomes **eligible** for the pipeline. Actual runtime behavior (visit tracking, active time, completion) must be verified through integration tests, not assumed.

---

## Step 1: Generate the Prototype (Free AI)

**Use any free AI service to generate:**

```
prototype/
├── index.html       # Visual structure
├── styles.css       # Styling and layout
├── script.js        # Interactions and behavior
└── data.json        # Sample data structure
```

**The prototype should demonstrate:**
- ✅ What the block looks like
- ✅ What information it displays
- ✅ What interactions it supports
- ✅ What data it requires
- ✅ What states it has (expanded, collapsed, active, etc.)

**The prototype does NOT need to know about:**
- ❌ ILS / RSSB / LSNB / UBRC
- ❌ Navigation Node IDs
- ❌ Tutorial Composer
- ❌ PostgreSQL schema
- ❌ React / TypeScript
- ❌ Telemetry or tracking

**Acceptable prototype characteristics:**
- Static HTML (will become React JSX)
- Arbitrary CSS classes (will become Tailwind + theme)
- Vanilla JavaScript (will become React hooks)
- Hardcoded colors (will become theme.primary/secondary)
- Sample IDs (will become block.id)
- Browser-specific code (will become SSR-safe)

**Example prompt for free AI:**
```
Create an interactive learning block for [concept].
Include:
- Title and introduction
- Main content area
- Interactive elements (tabs, accordions, buttons)
- Visual feedback for user actions
- Sample data in JSON format
Provide: HTML, CSS, JavaScript, and data.json
```

---

## Step 2: Inspect D1/C1 Reference Implementation (Project AI)

**⚠️ CRITICAL: Verify Actual Repository Paths**

The paths shown below are examples based on investigation. Before implementation:
1. **Locate actual files** in current repository
2. **Do NOT create duplicate files** based only on these examples
3. **Verify file structure** matches current monorepo layout
4. **Check if patterns still apply** (architecture may have evolved)

### 2.1 Read D1 Implementation

**Example path (verify in repo):**
```
File: packages/types/src/tutorial-rich-document/blocks/content.ts
Lines: ~177-210 (verify actual lines)
```

**Must extract:**
- DefinitionD1Page interface
- DefinitionD1AuthorContent interface
- DefinitionD1Block interface
- BaseBlock inheritance pattern
- Version literal usage
```

**Example path (verify in repo):**
```
File: packages/ui/src/tutorial/blocks/DefinitionBlock.tsx
Lines: ~1-177 (verify actual lines)
```

**Must extract:**
- Version router pattern
- BlockComponentProps usage
- DOM identity pattern (data-block-id, data-block-type, data-block-version)
- Theme consumption (theme.primary, theme.secondary)
- Root element structure
```

### 2.2 Read C1 Implementation

**Example path (verify in repo):**
```
File: packages/types/src/tutorial-rich-document/blocks/content-blocks.ts
Lines: ~124-240 (verify actual lines)
```

**Must extract:**
- CodeC1Page interface
- CodeC1AuthorContent interface
- CodeC1Block interface
- Complex nested structures (memoryModel, explanation array)
```

**Example path (verify in repo):**
```
File: packages/ui/src/tutorial/blocks/CodeC1Block.tsx
Lines: ~1-280 (verify actual lines)
```

**Must extract:**
- Complex UI patterns (terminal windows, syntax highlighting)
- Local state management (useState for copy button)
- Conditional rendering
- Rich interaction handling
```

### 2.3 Identify Common Patterns
Answer these questions from actual code:

1. **Type Structure:** How are Page/AuthorContent/Block interfaces related?
2. **Version Naming:** What convention is used? (D1, C1, S1, etc.)
3. **BaseBlock:** What fields does BaseBlock provide?
4. **Props Signature:** What is BlockComponentProps<T>?
5. **DOM Root:** Where do data-attributes go?
6. **Theme Usage:** How are theme.primary/secondary used?
7. **Registration:** How is the block added to TutorialBlockRenderer switch?
8. **Union Type:** How is it added to TutorialBlock union?
9. **Canonical Builder:** Does a `buildCanonicalXXX1Block` pattern exist? Is it required?
10. **Tests:** What tests verify DOM identity?

**⚠️ Verification Required:**
- Check if D1/C1 actually use a canonical builder pattern
- Identify where Composer creates block objects
- Determine if Zod validation is used
- Confirm builder pattern is necessary before creating one

---

## Step 3: Convert Prototype to Production Block

### 3.1 Define Type Interfaces

**Based on data.json, create TypeScript interfaces:**

```typescript
// File: packages/types/src/tutorial-rich-document/blocks/content-blocks.ts

/**
 * [BlockName]1 - Page Structure
 * [Brief description of pedagogical purpose]
 */
export interface [BlockName]1Page {
  type: '[block-type]';  // e.g., 'summary', 'quiz', 'interactive'
  
  // Required fields from data.json
  title: string;
  // ... map other fields from prototype data.json
  
  // Optional fields
  introduction?: string;
  // ... other optional fields
}

/**
 * [BlockName]1 - Author Content
 * Wraps page structure in content.page
 */
export interface [BlockName]1AuthorContent {
  page: [BlockName]1Page;
}

/**
 * [BlockName]1 Block
 * Canonical block with version envelope
 */
export interface [BlockName]1Block extends BaseBlock {
  type: '[block-type]';
  version: '[BlockName]1';  // e.g., 'S1', 'Q1', 'I1'
  content: [BlockName]1AuthorContent;
}

/**
 * [BlockName] Block (Version Union)
 * All [BlockName] block versions
 */
export type [BlockName]Block = [BlockName]1Block;
// Future versions:
// | [BlockName]2Block
// | [BlockName]3Block
```

**Mapping Rules:**
- `data.json` → `[BlockName]1Page` interface
- Flat structure preferred (avoid deep nesting unless necessary)
- Arrays for repeating elements
- Optional fields marked with `?`
- NO hierarchy fields (subtopicId, domainId, etc.)
- NO brand/theme fields (brandId, colors, etc.)

### 3.2 Register Type in Union

**File: packages/types/src/tutorial-rich-document/blocks/index.ts**

```typescript
// Export your new types
export type {
  [BlockName]1Page,
  [BlockName]1AuthorContent,
  [BlockName]1Block,
  [BlockName]Block,
} from './content-blocks';

// TutorialBlock union automatically includes your block via ContentBlockExtended
```

### 3.3 Create React Component

**File: packages/ui/src/tutorial/blocks/[BlockName]Block.tsx**

```typescript
'use client';

import React, { useState } from 'react';
import type { BlockComponentProps, DomainTheme } from '../types';
import type { [BlockName]1Block as [BlockName]1BlockType } from '@quiz/types';
// Import icons from lucide-react as needed
import { Icon1, Icon2 } from 'lucide-react';

/**
 * [BlockName] Block - Version Router
 */
export function [BlockName]Block({ 
  block, 
  theme,
  className = '' 
}: BlockComponentProps<[BlockName]1BlockType>) {
  // Version validation
  if (!block.version) {
    throw new Error(`[[BlockName]Block] Missing version field for block ${block.id}`);
  }

  // Version routing
  switch (block.version) {
    case '[BlockName]1':
      return <[BlockName]1View block={block} theme={theme} className={className} />;
    default:
      throw new Error(`[[BlockName]Block] Unsupported [BlockName] version: ${block.version}`);
  }
}

/**
 * [BlockName]1 View
 * 
 * Converts HTML/CSS/JS prototype into React component
 * Uses project theme instead of hardcoded colors
 * Maintains prototype's visual design and interactions
 */
function [BlockName]1View({
  block,
  theme,
  className = ''
}: {
  block: [BlockName]1BlockType;
  theme?: DomainTheme;
  className?: string;
}) {
  const page = block.content.page;

  // Theme validation
  if (!theme?.primary || !theme?.secondary) {
    throw new Error(`[[BlockName]1View] Missing required theme for block ${block.id}`);
  }

  // Local state (converted from prototype's JavaScript)
  const [activeTab, setActiveTab] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  // ... other state from prototype

  // Helper functions (converted from prototype's script.js)
  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <article
      // ↓ CRITICAL: UBRC Contract (3 required attributes)
      data-block-id={block.id}
      data-block-type="[block-type]"
      data-block-version={block.version}
      // ↓ Layout/styling (converted from prototype CSS)
      className={`w-full bg-white px-[5%] py-10 ${className}`}
      style={{ color: theme.secondary }}
    >
      {/* Header - converted from prototype HTML */}
      <header className="mb-6">
        <h1 
          className="text-4xl font-extrabold leading-tight"
          style={{ color: theme.primary }}
        >
          {page.title}
        </h1>
        {page.introduction && (
          <p className="mt-3 text-lg font-medium" style={{ color: theme.secondary }}>
            {page.introduction}
          </p>
        )}
      </header>

      {/* Main content - converted from prototype HTML/CSS/JS */}
      {/* Replace hardcoded colors with theme.primary/secondary */}
      {/* Replace vanilla JS interactions with React state */}
      {/* Replace arbitrary CSS classes with Tailwind utilities */}
      
      {/* Example: Tabs (if prototype had tabs) */}
      {page.sections && page.sections.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 border-b" style={{ borderColor: theme.primary + '33' }}>
            {page.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(index)}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === index ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === index ? theme.primary : theme.secondary,
                  borderColor: activeTab === index ? theme.primary : 'transparent'
                }}
              >
                {section.title}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {page.sections[activeTab] && (
              <div>{page.sections[activeTab].content}</div>
            )}
          </div>
        </div>
      )}

      {/* Rest of converted prototype UI */}
    </article>
  );
}
```

**Conversion Checklist:**
- [ ] `index.html` structure → JSX
- [ ] `styles.css` classes → Tailwind utilities + inline styles
- [ ] Hardcoded colors → `theme.primary`, `theme.secondary`
- [ ] `script.js` interactions → React state + event handlers
- [ ] `data.json` → TypeScript interface + typed props
- [ ] DOM identity attributes on root element
- [ ] No direct API calls
- [ ] No telemetry logic
- [ ] No lifecycle tracking

### 3.4 Register Renderer

**File: packages/ui/src/tutorial/TutorialBlockRenderer.tsx**

```typescript
// 1. Add import at top
import { [BlockName]Block } from './blocks/[BlockName]Block';

// 2. Add case to switch statement (find existing switch)
export function TutorialBlockRenderer({ block, depth = 0, theme, className = '', runtimeContext }: BlockComponentProps) {
  // ... existing code ...
  
  switch (block.type) {
    // ... existing cases ...
    
    case '[block-type]':
      return <[BlockName]Block 
        block={block} 
        depth={depth} 
        theme={theme} 
        className={className} 
        runtimeContext={runtimeContext} 
        renderChild={renderChild} 
      />;
    
    // ... rest of cases ...
  }
}
```

### 3.5 Create Canonical Builder (If Required)

**⚠️ CONDITIONAL STEP - Verify D1/C1 Pattern First**

Before creating a builder:
1. **Check if D1/C1 use this pattern** in current repository
2. **Identify where blocks are actually created** (Composer? API? Service?)
3. **Verify validation approach** (Zod? Database? Runtime?)
4. **Only create if pattern exists** in reference implementations

**If canonical builder pattern exists:**

**Example file path (verify in repo):**
```
File: packages/db-tutorial/src/services/canonical-block-builder.ts
```

```typescript
import type {
  [BlockName]1AuthorContent,
  [BlockName]1Block,
} from '@quiz/types';
import { randomUUID } from 'crypto';

/**
 * Build Canonical [BlockName]1 Block
 * 
 * Transforms validated AI author content into canonical block format
 * 
 * @param authorContent - Validated [BlockName]1AuthorContent (already passed Zod)
 * @param blockId - Optional UUID; if not provided, system generates one
 * @returns [BlockName]1Block with system metadata
 */
export function buildCanonical[BlockName]1Block(
  authorContent: [BlockName]1AuthorContent,
  blockId?: string
): [BlockName]1Block {
  return {
    id: blockId || randomUUID(),
    type: '[block-type]',
    version: '[BlockName]1',
    content: authorContent,
    // expectedTimeSec can be added by caller if applicable
  };
}
```

---

## Step 4: Integration with Tutorial Composer

### 4.1 Add to Existing Tutorial Page

**The block is added to a TutorialDocument associated with an existing navigationNodeId:**

```typescript
// Get existing tutorial content for a page
const section = await tutorialSectionRepository.getTutorialByPageIdentity(
  subtopicId,
  navigationNodeId,
  brandId
);

// Create new block
const newBlock = buildCanonical[BlockName]1Block({
  page: {
    type: '[block-type]',
    title: "Example Title",
    // ... other fields from AI generation or composer
  }
});

// Add to document
const document: TutorialDocument = section.content;
document.blocks.push(newBlock);

// Update tutorial content
await tutorialSectionRepository.update(section.id, {
  content: document,
  updatedAt: new Date()
});
```

### 4.2 LSNB Connection (Contract-Based)

**CRITICAL RULE: Blocks Do Not Create or Modify LSNB Records**

A new block:
- ❌ Does NOT create LSNB records
- ❌ Does NOT modify navigation progress
- ❌ Does NOT manage page-level state
- ✅ IS rendered inside a TutorialDocument already associated with an existing navigationNodeId
- ✅ Shares the page's navigationNodeId for block-level identity
- ✅ Participates in block-level tracking via block_learning_state table

**LSNB Scope:**
- **LSNB (tutorial_navigation_progress):** Page/navigation-level progress
  - Created on first page visit
  - Tracks page status, visit count, completion
  - Stores completed_blocks JSONB array

**Block Scope:**
- **block_learning_state:** Block-level learning metrics
  - Created on first block view
  - Tracks per-block visit count, active time, completion
  - Foreign key to navigationNodeId (links to page)

**The Integration Flow (Contract-Based Participation):**

1. ✅ LSNB record exists for navigationNodeId (created on first page visit)
2. ✅ Tutorial page renders all blocks via TutorialBlockRenderer
3. ✅ Your block renders with DOM identity attributes (satisfies UBRC contract)
4. ✅ ActiveBlockContext observes your block via IntersectionObserver (if contract satisfied)
5. ✅ BlockTelemetryProvider emits visit event (if observation successful)
6. ✅ ILS service records to block_learning_state table (if telemetry received)
7. ✅ RSSB displays metrics via useILS() hook (if data persisted)

**⚠️ VERIFICATION REQUIRED:**
Each step must be verified through testing. Contract satisfaction makes participation **possible**, not guaranteed.

**What is NOT automatic:**
- ❌ Block completion behavior (unless universal completion contract exists)
- ❌ Custom interaction telemetry (not supported by default)
- ❌ Assessment/quiz scoring (requires explicit support)

**Supported by Default (Verify):**
- ✅ Visit tracking (first view detection)
- ✅ Active time measurement (viewport observation)
- ✅ Revision count (session-based revisit detection)

**NOT Automatic (Requires Verification):**
- ⚠️ Completion detection (check if universal contract exists)
- ⚠️ Interaction telemetry (e.g., button clicks, expansions)
- ⚠️ Assessment results (quiz scores, exercise validation)

**Rule:** If the existing runtime has no universal completion contract for arbitrary blocks, your new block must NOT claim to support completion automatically. Verify D1/C1 completion behavior before assuming yours will work the same way.
```sql
block_learning_state.navigation_node_id 
  → references tutorial_navigation_progress.navigation_node_id
  → references tutorial_content.navigation_node_id
```

Your block participates automatically because it shares the same navigationNodeId as the page.

---

## Step 5: Verification

### 5.1 Type Checking
```bash
pnpm typecheck
```
**Expected:** ✅ No TypeScript errors

### 5.2 Linting
```bash
pnpm lint
```
**Expected:** ✅ No ESLint errors

### 5.3 Build
```bash
pnpm build
```
**Expected:** ✅ All packages build successfully

### 5.4 Runtime Verification

**Create test page:**
1. Use Tutorial Composer to create TutorialDocument with your block
2. Publish to tutorial_content table
3. Associate with existing navigationNodeId

**Browser testing:**
```
1. Navigate to tutorial page containing your block
   → Block renders without errors
   
2. Open browser DevTools → Elements tab
   → Inspect your block's root element
   → Verify attributes exist:
     - data-block-id="[uuid]"
     - data-block-type="[block-type]"
     - data-block-version="[BlockName]1"
   
3. Open browser DevTools → Console tab
   → Scroll block into viewport
   → Look for ActiveBlockContext detection logs (if debug enabled)
   
4. Open browser DevTools → Network tab
   → Scroll block into viewport (first time in session)
   → Verify POST request: /api/tutorial/ils/block-visit
   → Check request payload:
     {
       "navigationNodeId": "...",
       "subtopicId": "...",
       "blockId": "[your-block-id]",
       "blockVersion": "[BlockName]1",
       "sessionId": "..."
     }
```

### 5.5 Database Verification

**Check block_learning_state table:**
```sql
SELECT 
  id,
  user_id,
  navigation_node_id,
  block_id,
  block_type,
  block_version,
  visit_count,
  active_time_sec,
  expected_time_sec,
  first_viewed_at,
  last_viewed_at
FROM block_learning_state
WHERE block_type = '[block-type]'
  AND block_version = '[BlockName]1'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ Record exists after first block view
- ✅ `block_id` matches your block's UUID
- ✅ `block_type` matches your type literal
- ✅ `block_version` matches your version literal
- ✅ `visit_count` increments on page refresh
- ✅ `active_time_sec` increases as user views block

### 5.6 RSSB Verification

**⚠️ Verify Actual Behavior, Don't Assume**

**Check RSSB UI:**
1. Navigate to tutorial page as student
2. View your block (scroll into viewport)
3. Navigate to RSSB/progress view
4. **Verify** your block appears in metrics:
   - Block type displayed
   - Visit count shown
   - Time spent shown
   - Completion status shown (if supported)

**If metrics don't appear:**
- Check ActiveBlockContext detection (console logs)
- Check BlockTelemetryProvider POST request (network tab)
- Check block_learning_state database record
- Verify DOM identity attributes are correct
- Compare with D1/C1 behavior in same page

**Expected vs Actual:**
- **Expected:** Block satisfies contract → metrics appear
- **Reality:** Contract satisfaction is necessary but may not be sufficient
- **Action:** Debug integration, don't assume automatic operation

---

## Basic Compliance Checklist

Every new block MUST pass all these checks:

### ✅ Content and Identity
- [ ] Has unique block ID (UUID)
- [ ] Has registered block type (string literal)
- [ ] Has explicit block version (string literal)
- [ ] Has typed payload (TypeScript interface)
- [ ] Content structure matches [BlockName]1Page interface

### ✅ Type System
- [ ] Included in TutorialBlock union
- [ ] TypeScript compilation passes
- [ ] No type errors in component
- [ ] Props match BlockComponentProps<T> signature

### ✅ Composer Integration
- [ ] Registered in TutorialBlockRenderer switch
- [ ] Can be included in TutorialDocument.blocks[]
- [ ] Works with existing navigationNodeId
- [ ] Canonical builder function exists

### ✅ UBRC Contract (Critical)
- [ ] Root element has `data-block-id={block.id}`
- [ ] Root element has `data-block-type="[block-type]"`
- [ ] Root element has `data-block-version={block.version}`
- [ ] Attributes on actual block root (not nested div)

### ✅ Runtime Safety
- [ ] NO direct ILS API calls (`fetch('/api/tutorial/ils/...')`)
- [ ] NO direct RSSB calls
- [ ] NO custom telemetry events (`dispatchEvent(...)`)
- [ ] NO persistence logic (`db.query(...)`)
- [ ] NO independent completion state management
- [ ] Uses `theme.primary`, `theme.secondary` (not hardcoded colors)
- [ ] NO hierarchy metadata in JSON (subtopicId, etc.)
- [ ] NO brand metadata in JSON (brandId, etc.)
- [ ] Does NOT claim completion support unless verified in D1/C1

### ✅ Code Quality
- [ ] ESLint passes
- [ ] TypeScript strict mode passes
- [ ] No console errors in browser
- [ ] No React warnings in console
- [ ] Accessible (semantic HTML, ARIA where needed)

### ✅ Integration Tests
- [ ] Block renders in browser
- [ ] DOM identity attributes present and correct
- [ ] ActiveBlockContext detects block (verify via console/network)
- [ ] Telemetry POST request fires (verify via network tab)
- [ ] block_learning_state record created (verify via database query)
- [ ] RSSB displays block metrics (verify UI shows data)
- [ ] Visit count increments on page refresh
- [ ] Active time increases during viewport observation
- [ ] Existing D1/C1 tests remain green
- [ ] No regression in other blocks

**⚠️ CRITICAL:** Each item above must be **actively verified**, not assumed. Contract satisfaction enables participation; actual participation requires testing.

---

## Files Normally Modified (Summary)

**⚠️ Verify actual paths in repository before creating files**

| File | Action | Lines | Verify First |
|------|--------|-------|--------------|
| `packages/types/.../content-blocks.ts` (example) | Add interfaces | 50-150 | ✅ File exists? Correct location? |
| `packages/types/.../blocks/index.ts` (example) | Export types | 3-5 | ✅ Correct export pattern? |
| `packages/ui/src/tutorial/blocks/[BlockName]Block.tsx` | NEW FILE | 100-300 | ✅ Correct directory? |
| `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (example) | Add case | 3-5 | ✅ File exists? Switch pattern? |
| `packages/db-tutorial/.../canonical-block-builder.ts` (example) | Add function | 10-15 | ✅ Pattern exists in D1/C1? |
| **TOTAL** | | **~200-500** | |

**Note:** "Example" paths must be verified against actual repository structure.

## Files NEVER Modified

**⚠️ Do not modify these unless you have explicit evidence of a universal contract gap affecting ALL blocks:**

- ❌ `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`
- ❌ `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`
- ❌ `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- ❌ `packages/db-tutorial/src/services/learning-progress.service.ts`
- ❌ `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`
- ❌ `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`
- ❌ `packages/db-tutorial/migrations/schema.ts`
- ❌ Any API route files (`apps/*/src/app/api/tutorial/**`)

**Why:** These implement universal contracts. Modifying them breaks ALL existing blocks.

**Exception:** If you discover a genuine contract gap that ALL blocks need (not just yours), you must:
1. Document the gap with evidence from D1/C1
2. Propose a universal enhancement (not block-specific logic)
3. Verify the gap isn't already addressed by an existing mechanism
4. Get architectural approval before modifying shared infrastructure

---

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Lifecycle Hooks for Tracking

```typescript
// ❌ WRONG
function MyBlock({ block }) {
  useEffect(() => {
    // DON'T DO THIS
    trackBlockView(block.id);
    recordVisit(block.id);
    sendTelemetry({ type: 'view', blockId: block.id });
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

**Why Wrong:** Duplicates ActiveBlockContext's job, creates race conditions, breaks passive observation

**Fix:** Remove the useEffect. DOM identity attributes are sufficient.

---

### ❌ Anti-Pattern 2: Direct API Calls

```typescript
// ❌ WRONG
function MyBlock({ block }) {
  const handleComplete = async () => {
    // DON'T DO THIS
    await fetch('/api/tutorial/ils/block-complete', {
      method: 'POST',
      body: JSON.stringify({ blockId: block.id })
    });
  };
  
  return <button onClick={handleComplete}>Complete</button>;
}
```

**Why Wrong:** Bypasses ILS service layer, breaks transaction boundaries, creates tight coupling

**Fix:** Remove API call. ILS service handles completion based on block interaction patterns.

---

### ❌ Anti-Pattern 3: Custom Telemetry Events

```typescript
// ❌ WRONG
function MyBlock({ block }) {
  const handleInteraction = () => {
    // DON'T DO THIS
    window.dispatchEvent(new CustomEvent('blockInteraction', {
      detail: { blockId: block.id, action: 'clicked' }
    }));
  };
  
  return <button onClick={handleInteraction}>Click</button>;
}
```

**Why Wrong:** Creates non-standard telemetry, bypasses ILS contract, not persisted

**Fix:** Remove custom event. If interaction tracking is needed, propose universal contract extension.

---

### ❌ Anti-Pattern 4: Hierarchy in Block JSON

```typescript
// ❌ WRONG
export interface MyBlock1Page {
  title: string;
  content: string;
  subtopicId: string;    // ❌ NO!
  domainId: string;      // ❌ NO!
  navigationNodeId: string; // ❌ NO!
}
```

**Why Wrong:** Hierarchy is system-controlled, not author-editable. Lives in table columns, not JSON.

**Fix:** Remove hierarchy fields. They're provided via runtimeContext prop if needed.

---

### ❌ Anti-Pattern 5: Brand/Theme in Block JSON

```typescript
// ❌ WRONG
export interface MyBlock1Page {
  title: string;
  brandId: string;       // ❌ NO!
  primaryColor: string;  // ❌ NO!
  theme: {               // ❌ NO!
    primary: string;
    secondary: string;
  };
}
```

**Why Wrong:** Brand/theme resolved at runtime. Same content renders differently per brand.

**Fix:** Remove brand/theme fields. Use `theme` prop: `theme.primary`, `theme.secondary`

---

### ❌ Anti-Pattern 6: Missing DOM Identity

```typescript
// ❌ WRONG
function MyBlock({ block, theme }) {
  return (
    <article className="w-full">
      {/* Missing data-block-id, data-block-type, data-block-version! */}
      <h1>{block.content.page.title}</h1>
    </article>
  );
}
```

**Why Wrong:** ActiveBlockContext can't observe block. No telemetry. No ILS tracking.

**Fix:** Add 3 required attributes to root element.

---

## Reference Documents

**Full Analysis:**
- `.analysis/D1-C1-INTEGRATION-PATTERN-INVESTIGATION.md` (39KB, 20-point investigation)
- `.analysis/NEW-BLOCK-QUICK-START-CHECKLIST.md` (14KB, fast-track guide)

**Architecture Docs:**
- `docs/architecture/definition-block-version-architecture.md` (D1-D6 version architecture)
- `docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md` (15-step SOP, lines 1257+)
- `docs/ubrc/UBRC-IMPLEMENTATION-PHASE-0-REPO-AUDIT.md` (UBRC contract)
- `ILS_UI_UX/docs/02-Gate-2-Architecture-Definition.md` (runtime architecture)

**Reference Implementations:**
- `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx` (D1 pattern)
- `packages/ui/src/tutorial/blocks/CodeC1Block.tsx` (C1 pattern)

---

## The Golden Rule

```
The AI-generated HTML/CSS/JS/JSON is prototype source material, not production architecture.

The production block follows the D1/C1 proven pattern:
1. TypeScript interfaces (Page/AuthorContent/Block)
2. React component with BlockComponentProps
3. DOM identity (3 data-attributes)
4. Theme usage (theme.primary/secondary)
5. TutorialBlockRenderer registration
6. Canonical builder function (if D1/C1 pattern exists)

Contract satisfaction enables UBRC/ILS/RSSB participation.
Actual participation must be verified through testing.
```

---

## Critical Clarifications (Production-Authoritative)

### 1. Path Verification is Mandatory

**Rule:** Locate actual files in repository. Do NOT create duplicate files based only on document examples.

**Process:**
```bash
# Before creating any file, verify:
1. Does this file already exist?
2. Is the path structure current?
3. Do D1/C1 actually use this pattern?
4. Has the architecture evolved since investigation?
```

### 2. Canonical Builder is Conditional

**Rule:** Only create canonical builder if D1/C1 use this pattern in current repository.

**Verification steps:**
1. Search for `buildCanonicalDefinitionD1Block` in codebase
2. Search for `buildCanonicalCodeC1Block` in codebase
3. If found: Copy the pattern exactly
4. If NOT found: Skip builder creation, find actual block creation mechanism
5. Check where Composer/API creates block objects
6. Follow the actual pattern, not the assumed one

### 3. Runtime Behavior Requires Verification

**Rule:** Contract satisfaction enables participation, does not guarantee it.

**Replace all instances of:**
- ❌ "ILS/RSSB work automatically"
- ❌ "Everything happens automatically"
- ❌ "Just add attributes and it works"

**With:**
- ✅ "Block becomes eligible for UBRC/ILS/RSSB pipeline"
- ✅ "Runtime participation must be verified"
- ✅ "Test each integration point explicitly"

**Why:** Previous investigations identified runtime/integration issues. Silent assumptions about "automatic" behavior can hide real problems.

### 4. Completion Behavior is NOT Universal

**Rule:** Do not claim completion support unless verified in D1/C1.

**Current understanding:**
- ✅ Visit tracking: Supported (first view detection)
- ✅ Active time: Supported (viewport observation)
- ✅ Revision count: Supported (session-based)
- ⚠️ Completion: Unknown without verification

**Action required:**
1. Check how D1 handles completion (if at all)
2. Check how C1 handles completion (if at all)
3. Only claim completion support if both show it
4. If completion is block-specific, document that clearly

**Completion types:**
- **Implicit completion:** User reaches end of block (time-based?)
- **Explicit completion:** User clicks "Mark Complete" (button exists?)
- **Assessment completion:** Quiz/exercise validation (different contract?)
- **Passive completion:** System infers from engagement (algorithm?)

**Your block must NOT invent completion semantics.** Follow D1/C1 exactly or omit completion.

### 5. LSNB Relationship Must Be Clear

**Explicit rule to add to all documentation:**

> **A new block does NOT create or modify LSNB records.**
>
> The block is rendered inside a TutorialDocument already associated with an existing `navigationNodeId`.
>
> **LSNB scope:** Page/navigation-level progress (tutorial_navigation_progress table)
> - Created on first page visit
> - Tracks page status, visit count, time spent, completed_blocks array
>
> **Block scope:** Block-level learning metrics (block_learning_state table)
> - Created on first block view
> - Tracks per-block visit count, active time, completion
> - Foreign key to navigationNodeId (links block to page)
>
> The block contributes block-level identity. LSNB provides page-level identity. They work together but serve different scopes.

### 6. Testing is Not Optional

**Rule:** Every checklist item marked ✅ must be verified through actual testing.

**NOT acceptable:**
- "Contract looks correct, assume it works"
- "D1 works, so this will too"
- "Types compile, integration is proven"

**Acceptable:**
1. Load page in browser → ✅ Block renders
2. Inspect element → ✅ Attributes present
3. Check console → ✅ ActiveBlock detection logged
4. Check network → ✅ POST request sent
5. Query database → ✅ Record exists with correct values
6. Check RSSB UI → ✅ Metrics displayed
7. Refresh page → ✅ Visit count incremented
8. Wait 10 seconds → ✅ Active time increased

**If any step fails:** Debug, don't assume. Compare with D1/C1 in same conditions.

---

## Production Readiness Checklist

Before marking this workflow as production-authoritative:

- [x] Path verification mandatory (Step 2)
- [x] Canonical builder conditional (Step 3.5)
- [x] Runtime behavior verification required (throughout)
- [x] Completion NOT assumed universal (Section 4.2, Checklist)
- [x] LSNB relationship explicit (Section 4.2)
- [x] Testing requirements clear (Section 5, Checklist)
- [x] "Automatic" language replaced with "contract-based participation"
- [x] Critical clarifications section added

**Status:** READY FOR PRODUCTION USE with corrections applied

---

**Workflow Established:** 2026-09-13  
**Status:** READY FOR PRODUCTION USE  
**Next Action:** Convert first prototype using this workflow
