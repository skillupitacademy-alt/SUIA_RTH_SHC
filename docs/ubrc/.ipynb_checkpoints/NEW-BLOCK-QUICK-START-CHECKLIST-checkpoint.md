# New Tutorial Block Quick-Start Checklist

**Based on:** D1/C1 Integration Pattern Investigation  
**Date:** 2026-09-13  
**Purpose:** Fast-track checklist for implementing new Tutorial Composer blocks

---

## 5-Minute Overview

**What blocks DO:**
- ✅ Render UI from content JSON
- ✅ Expose DOM identity (data-block-id, data-block-type, data-block-version)
- ✅ Use runtime theme (theme.primary, theme.secondary)

**What blocks DON'T DO:**
- ❌ Call ILS/RSSB APIs
- ❌ Emit telemetry events
- ❌ Create LSNB records
- ❌ Store hierarchy (subtopicId, etc.) in JSON
- ❌ Store brand/theme in JSON
- ❌ Access database

**Architecture:**
```
Block renders DOM with identity
  ↓
ActiveBlockContext observes via IntersectionObserver
  ↓
BlockTelemetryProvider emits telemetry
  ↓
ILS Service persists to block_learning_state table
  ↓
RSSB displays metrics via useILS() hook
```

---

## Prerequisites Before You Start

### Required Knowledge
- [ ] Read D1 type definition (`packages/types/.../blocks/content.ts`, lines 177-210)
- [ ] Read D1 renderer (`packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`)
- [ ] Understand UBRC contract (3 data-attributes on root element)

### Design Decisions
- [ ] Block type name (e.g., `summary`, `quiz`, `interactive`)
- [ ] Version identifier (e.g., `S1`, `Q1`, `I1`)
- [ ] Page structure (what fields does author provide?)
- [ ] Required vs optional fields
- [ ] Does `expectedTimeSec` apply? (YES for instructional, NO for structural)

### Confirmed Boundaries
- [ ] NO hierarchy metadata in JSON (subtopicId, domainId, etc.)
- [ ] NO brand/theme data in JSON
- [ ] NO separate database table
- [ ] NO lifecycle hooks (onMount, onView, etc.)
- [ ] NO direct API calls

---

## Implementation Steps (2-4 hours)

### Step 1: Type Definition (~30 min)

**File:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`

```typescript
/**
 * XYZ1 - Page Structure
 */
export interface XYZ1Page {
  type: 'xyz';
  title: string;
  // ... your fields
}

/**
 * XYZ1 - Author Content
 */
export interface XYZ1AuthorContent {
  page: XYZ1Page;
}

/**
 * XYZ1 Block
 */
export interface XYZ1Block extends BaseBlock {
  type: 'xyz';
  version: 'XYZ1';
  content: XYZ1AuthorContent;
}

/**
 * XYZ Block (Version Union)
 */
export type XYZBlock = XYZ1Block;
// Future: | XYZ2Block | XYZ3Block ...
```

**Checklist:**
- [ ] Page interface defines content structure
- [ ] AuthorContent wraps page in `.content.page`
- [ ] Block interface extends BaseBlock
- [ ] Block has `type`, `version`, `content` fields
- [ ] Version union created for future extensibility

---

### Step 2: Type Registration (~5 min)

**File:** `packages/types/src/tutorial-rich-document/blocks/index.ts`

```typescript
// Export your types
export type {
  XYZ1Page,
  XYZ1AuthorContent,
  XYZ1Block,
  XYZBlock,
} from './content-blocks';

// TutorialBlock union already includes ContentBlockExtended
// Your block is automatically included via ContentBlock union
```

**Checklist:**
- [ ] Types exported from index.ts
- [ ] TypeScript compilation passes (`pnpm typecheck`)

---

### Step 3: Renderer Component (~1-2 hours)

**File:** `packages/ui/src/tutorial/blocks/XYZBlock.tsx`

```typescript
import React from 'react';
import type { BlockComponentProps } from '../types';
import type { XYZ1Block as XYZ1BlockType } from '@quiz/types';

/**
 * XYZ Block - Version Router
 */
export function XYZBlock({ block, theme }: BlockComponentProps<XYZ1BlockType>) {
  // Version check
  if (!block.version) {
    throw new Error(`[XYZBlock] Missing version field for block ${block.id}`);
  }

  // Version routing
  switch (block.version) {
    case 'XYZ1':
      return <XYZ1View block={block} theme={theme} />;
    default:
      throw new Error(`[XYZBlock] Unsupported XYZ version: ${block.version}`);
  }
}

/**
 * XYZ1 View
 */
function XYZ1View({
  block,
  theme,
  className = ''
}: {
  block: XYZ1BlockType;
  theme?: DomainTheme;
  className?: string;
}) {
  const page = block.content.page;

  // Theme required
  if (!theme?.primary || !theme?.secondary) {
    throw new Error(`[XYZ1View] Missing required theme for block ${block.id}`);
  }

  return (
    <article
      className={`w-full bg-white px-[5%] py-10 ${className}`}
      style={{ color: theme.secondary }}
      // ↓ CRITICAL: DOM Identity (UBRC Contract)
      data-block-id={block.id}
      data-block-type="xyz"
      data-block-version={block.version}
    >
      {/* Your UI here */}
      <h1 style={{ color: theme.primary }}>{page.title}</h1>
      {/* ... */}
    </article>
  );
}
```

**Critical Requirements:**
- [ ] Root element has 3 data-attributes: `data-block-id`, `data-block-type`, `data-block-version`
- [ ] Uses `theme.primary`, `theme.secondary` for colors
- [ ] NO API calls (no fetch, no mutations)
- [ ] NO ILS logic (no recordVisit, no trackTime)
- [ ] NO lifecycle hooks (no useEffect for tracking)
- [ ] Extracts content via `block.content.page`

**Common Patterns:**
- Use Tailwind for layout (`grid`, `flex`, `px-[5%]`, etc.)
- Use inline styles for theme colors: `style={{ color: theme.secondary }}`
- Use Lucide icons for visual elements
- Handle optional fields with conditional rendering: `{page.intro && <p>{page.intro}</p>}`

---

### Step 4: Renderer Registration (~5 min)

**File:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

```typescript
// 1. Import your component
import { XYZBlock } from './blocks/XYZBlock';

// 2. Add case to switch statement
switch (block.type) {
  // ... existing cases
  case 'xyz':
    return <XYZBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
  // ... other cases
}
```

**Checklist:**
- [ ] Import added at top of file
- [ ] Case added to switch with correct type string
- [ ] All props forwarded (block, depth, theme, className, runtimeContext, renderChild)

---

### Step 5: Canonical Builder (~15 min)

**File:** `packages/db-tutorial/src/services/canonical-block-builder.ts`

```typescript
import type {
  XYZ1AuthorContent,
  XYZ1Block,
} from '@quiz/types';
import { randomUUID } from 'crypto';

/**
 * Build Canonical XYZ1 Block
 */
export function buildCanonicalXYZ1Block(
  authorContent: XYZ1AuthorContent,
  blockId?: string
): XYZ1Block {
  return {
    id: blockId || randomUUID(),
    type: 'xyz',
    version: 'XYZ1',
    content: authorContent,
    // expectedTimeSec can be added later if needed
  };
}
```

**Checklist:**
- [ ] Function accepts authorContent + optional blockId
- [ ] Returns block with: id, type, version, content
- [ ] Uses `randomUUID()` if blockId not provided
- [ ] Type matches XYZ1Block interface

---

### Step 6: Verification (~30 min)

#### 6.1 TypeScript Compilation
```bash
pnpm typecheck
```
- [ ] No TypeScript errors

#### 6.2 Linting
```bash
pnpm lint
```
- [ ] No ESLint errors

#### 6.3 Build
```bash
pnpm build
```
- [ ] All packages build successfully

#### 6.4 Manual Testing

**Create test content:**
```typescript
const testBlock = buildCanonicalXYZ1Block({
  page: {
    type: 'xyz',
    title: 'Test XYZ Block',
    // ... other fields
  }
});

// Add to TutorialDocument
const document: TutorialDocument = {
  schemaVersion: "2.0",
  metadata: { /* ... */ },
  blocks: [testBlock]
};

// Save to tutorial_content table via admin interface
```

**Browser testing:**
- [ ] Block renders on tutorial page (no errors in console)
- [ ] Inspect element: verify `data-block-id`, `data-block-type`, `data-block-version` present
- [ ] Scroll block into view: check browser console for ActiveBlockContext detection
- [ ] Check Network tab: verify POST `/api/tutorial/ils/block-visit` fires
- [ ] Check database: verify `block_learning_state` record created with correct blockId/blockType/blockVersion

#### 6.5 ILS Verification

```sql
-- Query block_learning_state table
SELECT 
  block_id, 
  block_type, 
  block_version, 
  visit_count, 
  active_time_sec 
FROM block_learning_state 
WHERE user_id = '<test-user-id>' 
  AND navigation_node_id = '<test-page-node-id>'
  AND block_type = 'xyz';
```

- [ ] Record exists with your block's identity
- [ ] `visit_count` increments on page refresh
- [ ] `active_time_sec` increases as you view block

---

## Files Modified Summary

| File | Action | Estimated Lines |
|------|--------|-----------------|
| `packages/types/.../blocks/content-blocks.ts` | Add interfaces | 50-150 |
| `packages/types/.../blocks/index.ts` | Export types | 3-5 |
| `packages/ui/src/tutorial/blocks/XYZBlock.tsx` | NEW FILE | 100-300 |
| `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` | Add case | 3-5 |
| `packages/db-tutorial/.../canonical-block-builder.ts` | Add function | 10-15 |
| **TOTAL** | | **~200-500 lines** |

---

## Files You Should NEVER Modify

- ❌ `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`
- ❌ `packages/ui/src/tutorial/runtime/BlockTelemetryProvider.tsx`
- ❌ `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- ❌ `packages/db-tutorial/src/services/learning-progress.service.ts`
- ❌ `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`
- ❌ `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`
- ❌ `packages/db-tutorial/migrations/schema.ts`
- ❌ Any API route files

**Why:** These implement universal contracts that work generically for ALL block types. Modifying them would break existing blocks.

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Adding Lifecycle Hooks
```typescript
// ❌ WRONG
function XYZ1View({ block }) {
  useEffect(() => {
    // DON'T emit telemetry
    trackBlockView(block.id);
  }, []);
}
```

**Fix:** Remove the useEffect. ActiveBlockContext handles this automatically.

---

### ❌ Mistake 2: Calling ILS APIs
```typescript
// ❌ WRONG
function XYZ1View({ block }) {
  const handleComplete = async () => {
    await fetch('/api/tutorial/ils/block-complete', {
      method: 'POST',
      body: JSON.stringify({ blockId: block.id })
    });
  };
}
```

**Fix:** Remove API calls. ILS service handles completion logic.

---

### ❌ Mistake 3: Missing DOM Identity
```typescript
// ❌ WRONG
return (
  <article className="w-full">
    {/* Missing data-attributes! */}
  </article>
);
```

**Fix:** Add all 3 data-attributes to root element:
```typescript
<article
  data-block-id={block.id}
  data-block-type="xyz"
  data-block-version={block.version}
>
```

---

### ❌ Mistake 4: Storing Hierarchy in JSON
```typescript
// ❌ WRONG
export interface XYZ1Page {
  subtopicId: string;  // ❌ NO!
  domainId: string;    // ❌ NO!
}
```

**Fix:** Hierarchy lives in `tutorial_content` table columns, NOT in block JSON.

---

### ❌ Mistake 5: Storing Theme in JSON
```typescript
// ❌ WRONG
export interface XYZ1Page {
  brandId: string;     // ❌ NO!
  primaryColor: string; // ❌ NO!
}
```

**Fix:** Theme is resolved at runtime and passed as prop. Use `theme.primary`, `theme.secondary`.

---

## Quick Reference: Copy-Paste Template

**Minimal Working Block (Copy This):**

```typescript
// Type Definition (in content-blocks.ts)
export interface XYZ1Page {
  type: 'xyz';
  title: string;
}

export interface XYZ1AuthorContent {
  page: XYZ1Page;
}

export interface XYZ1Block extends BaseBlock {
  type: 'xyz';
  version: 'XYZ1';
  content: XYZ1AuthorContent;
}

export type XYZBlock = XYZ1Block;

// Renderer (new file XYZBlock.tsx)
import React from 'react';
import type { BlockComponentProps, DomainTheme } from '../types';
import type { XYZ1Block as XYZ1BlockType } from '@quiz/types';

export function XYZBlock({ block, theme }: BlockComponentProps<XYZ1BlockType>) {
  if (!block.version) throw new Error(`Missing version for block ${block.id}`);
  switch (block.version) {
    case 'XYZ1': return <XYZ1View block={block} theme={theme} />;
    default: throw new Error(`Unsupported XYZ version: ${block.version}`);
  }
}

function XYZ1View({ block, theme }: { block: XYZ1BlockType; theme?: DomainTheme }) {
  const page = block.content.page;
  if (!theme?.primary || !theme?.secondary) {
    throw new Error(`Missing theme for block ${block.id}`);
  }
  
  return (
    <article
      data-block-id={block.id}
      data-block-type="xyz"
      data-block-version={block.version}
      className="w-full bg-white px-[5%] py-10"
      style={{ color: theme.secondary }}
    >
      <h1 style={{ color: theme.primary }}>{page.title}</h1>
    </article>
  );
}

// Builder (in canonical-block-builder.ts)
export function buildCanonicalXYZ1Block(
  authorContent: XYZ1AuthorContent,
  blockId?: string
): XYZ1Block {
  return {
    id: blockId || randomUUID(),
    type: 'xyz',
    version: 'XYZ1',
    content: authorContent,
  };
}
```

---

## Next Steps After Implementation

### Production Deployment
1. Create tutorial content containing your block (via Composer or AI)
2. Publish to `tutorial_content` table
3. Test on live tutorial page
4. Verify LSNB record exists for that navigationNodeId
5. Verify block metrics appear in RSSB

### Multi-Version Support (Future)
When you need XYZ2:
1. Define `XYZ2Page`, `XYZ2AuthorContent`, `XYZ2Block` interfaces
2. Add `| XYZ2Block` to `XYZBlock` union
3. Add `case 'XYZ2': return <XYZ2View ... />` to version router
4. Add `buildCanonicalXYZ2Block()` function
5. NO changes to registration, observation, telemetry, ILS

### Documentation
- Update internal docs with new block type
- Add examples to Composer documentation
- Update AI prompts to generate new block type

---

## Support Resources

**Full Investigation Report:**
- `.analysis/D1-C1-INTEGRATION-PATTERN-INVESTIGATION.md` (20-point analysis)

**Reference Implementations:**
- D1: `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- C1: `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`

**Architecture Docs:**
- `docs/architecture/definition-block-version-architecture.md`
- `docs/architecture/TUTORIAL-PAGE-ENGINEERING-SOP.md`
- `docs/ubrc/UBRC-IMPLEMENTATION-PHASE-0-REPO-AUDIT.md`
- `ILS_UI_UX/docs/02-Gate-2-Architecture-Definition.md`

**Key Principles:**
1. Blocks are pure UI components
2. Observation is passive (via DOM attributes)
3. Telemetry is external (BlockTelemetryProvider)
4. ILS integration is generic (no per-block logic)
5. JSONB storage (no separate tables)
6. Theme runtime-resolved (no brand in JSON)
7. Hierarchy external (table columns, not JSON)

---

**Checklist Created:** 2026-09-13  
**Based on:** D1/C1 proven integration pattern  
**Estimated Implementation Time:** 2-4 hours for new block developer  
**Modification Size:** ~200-500 lines across 5 files
