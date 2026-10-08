# Other Block Families Audit

## Discovery Result

Found **13 unversioned block families** beyond the 4 versioned instructional blocks (C1, D1, I1, S1):

### Content Blocks (10 types)
1. HeadingBlock
2. ParagraphBlock
3. ListBlock
4. TableBlock
5. ImageBlock
6. CalloutBlock
7. ExampleBlock
8. QuoteBlock
9. DiagramBlock
10. ComparisonBlock

### Container Blocks (3 types)
11. TwoColumnBlock
12. ThreeColumnBlock
13. CardGridBlock
14. TimelineBlock

**Note:** All unversioned blocks are intentionally version-free by architectural design. The versioned blocks (C1/D1/I1/S1) represent complex instructional components with locked canonical UIs, while unversioned blocks are simpler content primitives.

---

## HeadingBlock Audit

- **Type string:** `'heading'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/HeadingBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (HeadingBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema definition with Zod validation
  - ✅ React component implementation
  - ✅ UBRC attributes (data-block-id, data-block-type)
  - ✅ TutorialBlockRenderer integration (direct routing)
  - ✅ DOM identity tests
  - ❌ No admin registry entry (by design - not editable in admin tool)
  - ❌ No version tracking (unversioned by design)
- **Notable differences:**
  - Unversioned (no data-block-version attribute)
  - Not registered in admin tool - only C1/D1/I1/S1 are author-editable
  - Simple content block with level-based rendering (h1-h6)
  - Supports 6 heading levels with responsive typography
  - No theme customization (uses default Tailwind classes)

---

## ParagraphBlock Audit

- **Type string:** `'paragraph'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/ParagraphBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (ParagraphBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema definition with Zod validation
  - ✅ React component implementation
  - ✅ UBRC attributes (data-block-id, data-block-type)
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry (unversioned content primitive)
  - ❌ No version tracking
- **Notable differences:**
  - Simplest block type - single text field
  - No rich formatting or nested content
  - Direct rendering without version checks
  - Dark mode support with Tailwind utilities

---

## ListBlock Audit

- **Type string:** `'list'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/ListBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (ListBlockSchema, ListItemSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with recursive ListItem support
  - ✅ Component with nested list rendering
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - Supports recursive nested lists (children property)
  - Lazy Zod schema for recursive validation
  - Handles both ordered and unordered styles
  - MAX_LIST_ITEMS constraint from constants

---

## TableBlock Audit

- **Type string:** `'table'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/TableBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (TableBlockSchema, TableColumnSchema, TableRowSchema, TableCellSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Complex schema with columns/rows/cells structure
  - ✅ Full-featured table component with alignment, header, caption
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - Most complex unversioned block (multi-schema composition)
  - Column-based layout with cell-to-column mapping
  - Configurable alignment per column (left/center/right)
  - MAX_TABLE_COLUMNS and MAX_TABLE_ROWS limits
  - Optional header row and caption
  - Hover effects and responsive scrolling

---

## ImageBlock Audit

- **Type string:** `'image'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/ImageBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (ImageBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with assetId, alt, caption, aspectRatio
  - ✅ Component with asset resolution and error handling
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - Asset resolution logic: handles URLs or asset API paths
  - Graceful fallback on image load error (shows asset ID as text)
  - Optional aspect ratio control
  - Lazy loading for performance
  - Uses `/api/assets/{assetId}` endpoint for asset retrieval

---

## CalloutBlock Audit

- **Type string:** `'callout'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/CalloutBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (CalloutBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with variant enum (6 types)
  - ✅ Component with variant-specific styling
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - 6 variants: info, warning, tip, important, success, danger
  - Each variant has unique color scheme, icon, and default title
  - Semantic ARIA role="note" for accessibility
  - Border-left accent style pattern
  - Most visually diverse unversioned block

---

## ExampleBlock Audit

- **Type string:** `'example'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/ExampleBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (ExampleBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with code, explanation, output, notes
  - ✅ Component with multi-section layout
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - Simplified alternative to CodeC1Block for basic examples
  - Includes code + expected output + notes sections
  - No interactive features (unlike C1's memory model and step-through)
  - Uses language parameter for syntax highlighting label
  - Lightweight terminal-style code display

---

## QuoteBlock Audit

- **Type string:** `'quote'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/QuoteBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (QuoteBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with text, attribution, source
  - ✅ Component with semantic figure/blockquote/figcaption
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - Proper semantic HTML5 structure
  - Italic text styling for quote convention
  - Optional attribution and source citation
  - Border-left accent similar to callouts

---

## DiagramBlock Audit

- **Type string:** `'diagram'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/DiagramBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (DiagramBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with diagramType enum (mermaid, asset, svg)
  - ✅ Component with type-specific rendering
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - 3 rendering modes: inline SVG, Mermaid source display, or asset reference
  - Mermaid mode shows raw source (client-side rendering not implemented)
  - Asset mode uses same resolution logic as ImageBlock
  - Error handling for broken asset references
  - Caption support for all diagram types

---

## ComparisonBlock Audit

- **Type string:** `'comparison'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/ComparisonBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (ComparisonBlockSchema, ComparisonFeatureSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Complex schema with entities, features, recommendation
  - ✅ Feature comparison table component
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - Purpose-built for side-by-side comparisons (e.g., framework comparison)
  - Matrix structure: entities (columns) × features (rows)
  - 2-5 entities, 1-20 features per schema constraints
  - Optional recommendation callout with emerald accent
  - Hover effects on rows for usability

---

## TwoColumnBlock Audit

- **Type string:** `'two-column'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/TwoColumnBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts` (TwoColumnBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with left/right block arrays (recursive lazy schema)
  - ✅ Component with grid layout and ratio control
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ✅ Recursive rendering via renderChild prop
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - **CONTAINER BLOCK** - can nest other blocks (including versioned blocks)
  - 5 ratio options: 50-50, 60-40, 70-30, 40-60, 30-70
  - Uses 12-column grid system for responsive layout
  - Phase 2.5 runtime context propagation via renderChild
  - Throws error if renderChild prop missing (safety check)

---

## ThreeColumnBlock Audit

- **Type string:** `'three-column'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/ThreeColumnBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts` (ThreeColumnBlockSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with tuple of 3 column arrays (Zod tuple validation)
  - ✅ Component with equal-width 3-column grid
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ✅ Recursive rendering via renderChild
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - **CONTAINER BLOCK** - recursive nesting support
  - Fixed 3-column layout (no ratio options like TwoColumnBlock)
  - Collapses to single column on mobile via grid-cols-1
  - Requires renderChild prop with error checking

---

## CardGridBlock Audit

- **Type string:** `'card-grid'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/CardGridBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts` (CardGridBlockSchema, CardSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with card array (max MAX_CARD_GRID_ITEMS)
  - ✅ Component with configurable column count (2, 3, 4)
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ✅ Recursive rendering via renderChild
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - **CONTAINER BLOCK** - each card contains nested blocks
  - 3 column layouts: 2-col, 3-col (default), 4-col
  - Each card has optional title and border styling
  - Responsive breakpoints: mobile (1 col) → tablet (2 col) → desktop (4 col for 4-col layout)
  - Uses items-stretch for equal height cards

---

## TimelineBlock Audit

- **Type string:** `'timeline'`
- **File paths:**
  - Component: `packages/ui/src/tutorial/blocks/TimelineBlock.tsx`
  - Schema: `packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts` (TimelineBlockSchema, TimelineItemSchema)
  - Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- **Status:** COMPLETE
- **Lifecycle coverage summary:**
  - ✅ Schema with items array (max MAX_TIMELINE_ITEMS), orientation
  - ✅ Component with vertical/horizontal layouts
  - ✅ UBRC attributes
  - ✅ TutorialBlockRenderer integration
  - ✅ DOM identity tests
  - ✅ Recursive rendering via renderChild
  - ❌ No admin registry
  - ❌ Unversioned
- **Notable differences:**
  - **CONTAINER BLOCK** - each timeline item can contain nested blocks
  - 2 orientations: vertical (default, left-aligned) and horizontal (scrollable)
  - Visual timeline connectors: vertical border-left or horizontal dots
  - Each item has title, optional date, optional description, optional nested blocks
  - Indigo color scheme with ring decorations on timeline dots

---

## Pattern Observations

### Architectural Consistency

**All unversioned blocks follow the same lightweight pattern:**

1. **UBRC Attributes:** All 13 blocks expose `data-block-id` and `data-block-type` (no `data-block-version`)
2. **Schema Location:** Content blocks in `content-blocks.schema.ts`, containers in `container-blocks.schema.ts`
3. **Component Location:** All in `packages/ui/src/tutorial/blocks/`
4. **Renderer Integration:** Direct routing in TutorialBlockRenderer without version checks
5. **No Admin Registry:** None are registered in admin tool's block registry (only C1/D1/I1/S1 are)
6. **Test Coverage:** All have DOM identity tests in `BlockDOMIdentity.test.tsx`

### Key Differences from Versioned Blocks (C1/D1/I1/S1)

| Aspect | Versioned (C1/D1/I1/S1) | Unversioned (13 blocks) |
|--------|-------------------------|-------------------------|
| **Version Attribute** | ✅ data-block-version | ❌ No version tracking |
| **Admin Registry** | ✅ Registered with examples | ❌ Not editable in admin |
| **Schema File** | Dedicated files (e.g., code-c1.schema.ts) | Shared schema files |
| **Complexity** | High (locked canonical UIs) | Low-Medium (content primitives) |
| **Theme Customization** | ✅ theme.primary/secondary | ❌ Static Tailwind classes |
| **Lifecycle** | Full (fixtures, examples, integration tests) | Basic (schema, component, DOM tests) |
| **ILS Integration** | ✅ expectedTimeSec, progressRole | ❌ Not instructional |
| **Version Registry** | ✅ Version-specific registries | N/A |

### Container Block Pattern

4 container blocks (TwoColumnBlock, ThreeColumnBlock, CardGridBlock, TimelineBlock) share unique characteristics:

- **Recursive rendering:** Use `renderChild` prop to render nested blocks
- **Runtime context propagation:** Pass through ILS context to children (Phase 2.5 feature)
- **Safety checks:** Throw errors if renderChild is missing
- **Lazy schemas:** Use `TutorialBlockSchemaLazy` for recursive block validation
- **Layout focus:** Provide structure, not instructional content

### Schema Architecture

- **Content blocks:** 10 types in `content-blocks.schema.ts` + 2 versioned imports (D1, I1)
- **Container blocks:** 4 types in `container-blocks.schema.ts` with recursive lazy schemas
- **Versioned blocks:** Dedicated schema files with version union types
- **Discriminated unions:** Both use Zod discriminatedUnion for type-safe parsing

### Test Coverage Gap

While all blocks have DOM identity tests, unversioned blocks lack:
- Integration tests with ILS runtime
- Clipboard/copy-paste tests (only C1 has these)
- AI contract tests (only D1 has these)
- Persistence tests (only D1 has these)
- E2E tests (only versioned blocks have Playwright coverage)

This is **by design** - unversioned blocks are simpler content primitives without complex lifecycle requirements.

### Naming Convention

- Versioned blocks: `{Name}{Version}Block` pattern (CodeC1Block, DefinitionD1Block, etc.)
- Unversioned blocks: `{Name}Block` pattern (HeadingBlock, ParagraphBlock, etc.)
- Type strings: All lowercase, hyphenated for multi-word types ('two-column', 'card-grid')

### Rendering Strategy

**Versioned blocks:** Version-gated routing with error throwing
```typescript
case 'code': {
  if (!('version' in block) || block.version !== 'C1') {
    throw new Error('Unsupported code block version. Code C1 is required.');
  }
  return <CodeC1Block block={block as any} />;
}
```

**Unversioned blocks:** Direct routing without version checks
```typescript
case 'heading':
  return <HeadingBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} />;
```

### Design Philosophy

The corpus exhibits a clear **two-tier architecture:**

1. **Versioned Instructional Blocks (4):** Complex, locked UIs for pedagogy (C1/D1/I1/S1)
   - Author-editable in admin tool
   - Full lifecycle with examples and fixtures
   - Theme-aware with brand customization
   - ILS-integrated with progress tracking

2. **Unversioned Content Blocks (13):** Simple, flexible primitives for content structure
   - Not exposed in admin tool (programmatic use only)
   - Minimal lifecycle (schema + component + tests)
   - Static styling with Tailwind
   - No ILS integration (passive content)

This separation enables **rapid content authoring** (via unversioned blocks) while maintaining **pedagogical quality control** (via versioned canonical blocks).
