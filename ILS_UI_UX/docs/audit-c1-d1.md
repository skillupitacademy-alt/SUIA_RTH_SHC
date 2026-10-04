# C1 (Code Block) and D1 (Definition Block) Full Audit

**Audit Date:** 2024
**Architecture:** UBRC (Universal Block Runtime Context)
**Purpose:** Deep individual block audits for C1 and D1 lifecycle tracing

---

# C1 (Code Block) Full Audit

## Implementation Evidence

- **Component:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- **Export:** `CodeC1Block` (named export)
- **Type Contract:** `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`
- **Status:** COMPLETE - Canonical locked UI implementation

## Lifecycle Trace

| Step | Status | Evidence (file:line) |
|------|--------|----------------------|
| **Type contract** | ✅ IMPLEMENTED | `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts:94-102` - `CodeC1BlockSchema` with id, type='code', version='C1', content, presentation, expectedTimeSec, progressRole |
| **Registry** | ✅ IMPLEMENTED | `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/code.registry.ts:9-17` - Registered as `id: 'code'`, version code `'C1'` |
| **Editor** | ✅ IMPLEMENTED | `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/code/C1/codeC1.examples.ts` - Example payload with complete structure including memoryModel |
| **Composer integration** | ✅ IMPLEMENTED | `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts:18-26` - `getBlockTypes()`, `getBlockType()`, `getDefaultPayload()` API |
| **TutorialDocument** | ✅ IMPLEMENTED | `packages/types/src/tutorial-rich-document/document.ts:23-26` - `blocks: TutorialBlock[]` where `TutorialBlock` includes `CodeC1Block` |
| **Renderer dispatch** | ✅ IMPLEMENTED | `packages/ui/src/tutorial/TutorialBlockRenderer.tsx:63-74` - Routes `type='code'` + `version='C1'` to `CodeC1Block`, rejects non-C1 versions |
| **UBRC identity** | ✅ IMPLEMENTED | `packages/ui/src/tutorial/blocks/CodeC1Block.tsx:126-130` - Renders `data-block-id={block.id}`, `data-block-type="code"`, `data-block-version="C1"` |
| **ILS participation** | ✅ PASSIVE | `packages/ui/src/tutorial/runtime/ILSProvider.tsx:320-335` - Block does NOT call ILS APIs; ILS tracks via UBRC attributes passively |
| **LSNB creation** | ✅ PAGE-LEVEL | `src/share-branding/LearningExperience/components/TutorialPageShell.tsx:52-68` - LSNB (Left Sidebar Navigation Bar) created at page level, not by individual blocks |
| **RSSB creation** | ✅ PAGE-LEVEL | `src/share-branding/LearningExperience/components/TutorialPageShell.tsx:419-426` - RSSB (Right Sidebar) created at page level via `LearningProgressSidebar`, not by individual blocks |

## Content Schema

```typescript
// From: packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts

/**
 * Code C1 Block Schema
 * Validates canonical block with version envelope
 */
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});

/**
 * Code C1 Author Content Schema
 * CANONICAL format: {page: {...}}
 */
export const CodeC1AuthorContentSchema = z.object({
  page: CanonicalCodeC1PageSchema,
}).strict();

/**
 * Canonical Code C1 Page Schema
 * This is the CANONICAL storage format after conversion
 */
export const CanonicalCodeC1PageSchema = z.object({
  type: z.literal('code'),
  title: z.string(),
  introduction: z.string(),
  language: z.string(),
  code: z.string(),
  filename: z.string().optional(),
  explanation: z.array(z.object({
    focus: z.string(),
    description: z.string(),
  })),
  output: z.object({
    value: z.string(),
    description: z.string().optional(),
  }).optional(),
  takeaway: z.string(),
  practiceHint: z.string().optional(),
  memoryModel: HistoricalMemoryModelSchema.optional(),
}).strict();
```

**Schema Key Points:**
- **Top-level envelope:** `id`, `type`, `version`, `content`, `presentation`, `expectedTimeSec`, `progressRole`
- **Content structure:** Nested `page` object with all C1-specific fields
- **Memory model:** Optional visual representation with columns, nodes, connections
- **Explanation:** Array of `{focus, description}` step-by-step breakdown
- **Output:** Optional code execution result with description
- **Takeaway:** Required summary string (parsed as newline-separated items in UI)

## UBRC Compliance

**Status:** ✅ FULLY COMPLIANT

**Evidence:**
```typescript
// From: packages/ui/src/tutorial/blocks/CodeC1Block.tsx:126-130
<article 
  className="w-full bg-white px-[5%] py-10 text-[#0b1b3d]"
  data-block-id={block.id}
  data-block-type="code"
  data-block-version="C1"
>
```

**Attributes rendered:**
- ✅ `data-block-id`: UUID from `block.id`
- ✅ `data-block-type`: Literal `"code"`
- ✅ `data-block-version`: Literal `"C1"`

**Test Evidence:**
- `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx:121-148` - Verifies all three UBRC attributes are present
- `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx:253-273` - Verifies version routing and attribute presence

## ILS Participation Model

**Type:** ✅ PASSIVE (block does not directly call ILS APIs)

**Architecture:**
```
CodeC1Block (render only)
    ↓ (UBRC attributes in DOM)
ActiveBlockContext (viewport detection)
    ↓ (activeBlock identity)
ILSProvider (progress tracking)
    ↓ (API calls)
ILS Backend (/api/tutorial/ils/*)
```

**Evidence:**
1. **Block does NOT import ILS hooks:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx` - No `useILS()` import
2. **ILS detects via UBRC attributes:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx:320-335` - Reads `data-block-id`, `data-block-type`, `data-block-version` from DOM
3. **ActiveBlockContext provides identity:** Block identity propagated through `activeBlock` state from IntersectionObserver
4. **BlockTelemetryProvider handles tracking:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx:392-407` - Wraps all blocks with telemetry

**Participation Flow:**
1. C1 block renders with UBRC attributes (passive identity exposure)
2. `ActiveBlockContext` detects block in viewport via IntersectionObserver
3. `ILSProvider` receives `activeBlock` identity from context
4. `BlockTelemetryProvider` tracks time and sends telemetry
5. ILS backend processes completion criteria (time-based + manual)
6. ILS updates returned via `activeBlockProgress` state

**Critical Design:** C1 blocks remain **presentation-only**. All tracking logic lives in universal runtime providers.

## Tests

### Test Files
1. **UBRC Identity:** `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
2. **Routing:** `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx`
3. **Clipboard:** `packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.clipboard.test.tsx`

### Coverage

**BlockDOMIdentity.test.tsx (lines 121-148):**
- ✅ Verifies `data-block-id` matches block.id
- ✅ Verifies `data-block-type` is `"code"`
- ✅ Verifies `data-block-version` is `"C1"`
- ✅ Confirms all three attributes rendered

**TutorialRendererRouting.test.tsx (lines 253-355):**
- ✅ **TEST R1:** Routes `code/C1` to `CodeC1Block` renderer
- ✅ **TEST R2:** Rejects legacy code without version (strict C1 architecture)
- ✅ **TEST R3:** Does not route C1 block to legacy renderer
- ✅ **TEST R4:** Rejects unsupported code version (C999)
- ✅ Verifies C1-specific structure (title, introduction, explanation sections)
- ✅ Verifies semantic heading structure (H1 for title)

**CodeC1Block.clipboard.test.tsx:**
- ✅ Tests copy-to-clipboard functionality for code snippets
- ✅ Verifies clipboard permissions handling
- ✅ Tests user feedback (copied state transition)

**What Tests Cover:**
- ✅ DOM attribute identity (UBRC compliance)
- ✅ Version routing enforcement
- ✅ C1-specific UI structure
- ✅ Interactive features (clipboard)
- ✅ Error states (unsupported versions, missing data)

**What Tests DO NOT Cover:**
- ❌ ILS API integration (tested separately in ILS runtime tests)
- ❌ Telemetry delivery (tested in BlockTelemetryProvider tests)
- ❌ Memory model rendering (visual validation only)
- ❌ Theme customization (visual validation only)

## Status

**CURRENT** - C1 is the canonical Code block implementation

**Rationale:**
- Fully integrated across all lifecycle stages
- Complete UBRC compliance
- Registry entry active
- Test coverage comprehensive
- Production-ready UI
- Passive ILS participation model implemented
- No breaking changes since canonical lock

**Version Architecture:**
- C1 is **canonical locked** (UI frozen, only theme colors vary by brand)
- Future C2/C3 versions will be separate implementations
- TutorialBlockRenderer enforces strict version routing

## Reference Quality

**REFERENCE-QUALITY** - C1 serves as the canonical example for versioned block implementation

**Rationale:**

### ✅ Strengths
1. **Complete lifecycle implementation:** Every stage from type contract to runtime rendering fully implemented
2. **UBRC exemplar:** Perfect implementation of Universal Block Runtime Context pattern
3. **Passive architecture:** Clean separation between presentation (block) and behavior (runtime providers)
4. **Schema rigor:** Zod validation schemas enforce canonical structure at authoring and delivery boundaries
5. **Version enforcement:** TutorialBlockRenderer rejects non-C1 versions (strict version routing)
6. **Theme abstraction:** UI locked except for `theme.primary` and `theme.secondary` brand colors
7. **Test coverage:** DOM identity, routing, clipboard interactions all tested
8. **Historical preservation:** Maintains `TutorialCodePayload` compatibility via schema passthrough

### 📋 Documentation
- Schema comments explain historical contract preservation
- Component comments identify canonical locked UI status
- Registry metadata describes C1 capabilities
- Example payload demonstrates complete structure including memoryModel

### 🎯 Use Cases for Reference
- **New versioned blocks:** Follow C1 pattern for D2, I2, S2, O1 implementations
- **UBRC compliance:** Copy attribute rendering pattern
- **Passive ILS:** Example of block that doesn't import tracking hooks
- **Version routing:** Registry + TutorialBlockRenderer pattern
- **Theme customization:** Brand-agnostic UI with theme injection

---

# D1 (Definition Block) Full Audit

## Implementation Evidence

- **Component:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- **Export:** `DefinitionBlock` (named export, version router) + `DefinitionD1View` (internal canonical renderer)
- **Type Contract:** `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts`
- **Status:** COMPLETE - Canonical locked UI implementation with version router

## Lifecycle Trace

| Step | Status | Evidence (file:line) |
|------|--------|----------------------|
| **Type contract** | ✅ IMPLEMENTED | `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts:38-47` - `DefinitionD1BlockSchema` with id, type='definition', version='D1', content, presentation, expectedTimeSec, progressRole |
| **Registry** | ✅ IMPLEMENTED | `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/definition.registry.ts:9-17` - Registered as `id: 'definition'`, version code `'D1'` |
| **Editor** | ✅ IMPLEMENTED | `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/definition/D1/definitionD1.examples.ts` - Example payload with complete definition structure |
| **Composer integration** | ✅ IMPLEMENTED | `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts:18-26` - Same `getBlockTypes()` API as C1 |
| **TutorialDocument** | ✅ IMPLEMENTED | `packages/types/src/tutorial-rich-document/document.ts:23-26` - `blocks: TutorialBlock[]` where `TutorialBlock` includes `DefinitionD1Block` |
| **Renderer dispatch** | ✅ IMPLEMENTED | `packages/ui/src/tutorial/TutorialBlockRenderer.tsx:79-80` - Routes `type='definition'` to `DefinitionBlock` (which internally routes version='D1' to `DefinitionD1View`) |
| **UBRC identity** | ✅ IMPLEMENTED | `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx:73-77` - Renders `data-block-id={block.id}`, `data-block-type="definition"`, `data-block-version={block.version}` |
| **ILS participation** | ✅ PASSIVE | `packages/ui/src/tutorial/runtime/ILSProvider.tsx:320-335` - Block does NOT call ILS APIs; ILS tracks via UBRC attributes passively |
| **LSNB creation** | ✅ PAGE-LEVEL | `src/share-branding/LearningExperience/components/TutorialPageShell.tsx:52-68` - LSNB created at page level, not by individual blocks |
| **RSSB creation** | ✅ PAGE-LEVEL | `src/share-branding/LearningExperience/components/TutorialPageShell.tsx:419-426` - RSSB created at page level, not by individual blocks |

## Content Schema

```typescript
// From: packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts

/**
 * Definition D1 Block Schema
 * Validates canonical block with version envelope
 */
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});

/**
 * Definition D1 Author Content Schema
 * Validates AI output: { page: {...} }
 */
export const DefinitionD1AuthorContentSchema = z.object({
  page: DefinitionD1PageSchema,
}).strict();

/**
 * Definition D1 Page Schema
 * Validates the page.* structure
 */
export const DefinitionD1PageSchema = z.object({
  type: z.literal('definition'),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  intro: z.string().min(1).max(1000),
  definition: z.string().min(1).max(3000),
  explanation: z.array(z.string().min(1).max(2000)).min(1),
  example: z.object({
    language: z.string().min(1).max(50),
    code: z.string().min(1),
  }).strict(),
  characteristics: z.array(
    z.object({
      icon: z.string().min(1).max(20),
      title: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
    }).strict()
  ),
  takeaway: z.string().min(1).max(1000),
}).strict();
```

**Schema Key Points:**
- **Top-level envelope:** `id`, `type`, `version`, `content`, `presentation`, `expectedTimeSec`, `progressRole`
- **Content structure:** Nested `page` object with all D1-specific fields
- **Category:** Domain classification (e.g., "Python Fundamentals")
- **Definition:** Authoritative definition text (max 3000 chars)
- **Explanation:** Array of paragraph strings for detailed breakdown
- **Example:** Code snippet with language metadata
- **Characteristics:** Grid of key features with icon, title, description
- **Takeaway:** Summary statement (max 1000 chars)

## UBRC Compliance

**Status:** ✅ FULLY COMPLIANT

**Evidence:**
```typescript
// From: packages/ui/src/tutorial/blocks/DefinitionBlock.tsx:73-77
<article 
  className={`w-full bg-white px-[5%] py-10 ${className}`} 
  style={{ color: secondary }}
  data-block-id={block.id}
  data-block-type="definition"
  data-block-version={block.version}
>
```

**Attributes rendered:**
- ✅ `data-block-id`: UUID from `block.id`
- ✅ `data-block-type`: Literal `"definition"`
- ✅ `data-block-version`: Dynamic from `block.version` (validated as `"D1"` by router)

**Test Evidence:**
- `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx:150-179` - Verifies all three UBRC attributes are present for D1 blocks
- Test validates: `data-block-id="def-d1-014"`, `data-block-type="definition"`, `data-block-version="D1"`

## ILS Participation Model

**Type:** ✅ PASSIVE (block does not directly call ILS APIs)

**Architecture:**
```
DefinitionBlock → DefinitionD1View (render only)
    ↓ (UBRC attributes in DOM)
ActiveBlockContext (viewport detection)
    ↓ (activeBlock identity)
ILSProvider (progress tracking)
    ↓ (API calls)
ILS Backend (/api/tutorial/ils/*)
```

**Evidence:**
1. **Block does NOT import ILS hooks:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx` - No `useILS()` import
2. **ILS detects via UBRC attributes:** Same passive detection as C1
3. **Version router pattern:** `DefinitionBlock` checks version field and routes to `DefinitionD1View`
4. **Theme requirement enforced:** D1View throws error if `theme.primary` or `theme.secondary` missing

**Participation Flow:** Identical to C1 (passive identity exposure → universal runtime tracking)

**Critical Design:**
- D1 blocks remain **presentation-only**
- Version routing happens at block level (different from C1 which routes in TutorialBlockRenderer)
- Theme validation ensures brand consistency

## Tests

### Test Files
1. **UBRC Identity:** `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
2. **Persistence Integration:** `packages/db-tutorial/src/services/__tests__/phase-1h-definition-d1-persistence.integration.test.ts`
3. **AI Contract:** `packages/db-tutorial/src/services/__tests__/phase-1i-definition-d1-ai-contract.test.ts`
4. **Certification:** `packages/db-tutorial/src/services/__tests__/phase2b13-certification-verification.test.ts`

### Coverage

**BlockDOMIdentity.test.tsx (lines 150-179):**
- ✅ Verifies `data-block-id` matches block.id
- ✅ Verifies `data-block-type` is `"definition"`
- ✅ Verifies `data-block-version` is `"D1"`
- ✅ Tests with theme injection (primary, secondary colors)
- ✅ Confirms all three UBRC attributes rendered

**phase-1h-definition-d1-persistence.integration.test.ts:**
- ✅ **End-to-end D1 pipeline:** AI output → validation → canonical block → persistence → delivery
- ✅ Tests round-trip integrity (save → load → identical structure)
- ✅ Validates JSONB storage in `tutorial_sections.content`
- ✅ Verifies hierarchy stored in columns (NOT in JSONB)
- ✅ Tests malicious metadata rejection
- ✅ Confirms delivery returns canonical D1 without admin metadata

**phase-1i-definition-d1-ai-contract.test.ts:**
- ✅ Validates AI-generated definition payload
- ✅ Tests schema validation boundaries
- ✅ Verifies `validateDefinitionD1AIOutput()` function
- ✅ Tests `buildCanonicalDefinitionD1Block()` conversion

**phase2b13-certification-verification.test.ts:**
- ✅ Certifies D1 block structure
- ✅ Validates version metadata
- ✅ Tests characteristics grid structure
- ✅ Verifies example code format

**What Tests Cover:**
- ✅ DOM attribute identity (UBRC compliance)
- ✅ Full persistence lifecycle
- ✅ AI authoring contract
- ✅ Schema validation boundaries
- ✅ Round-trip integrity
- ✅ Theme requirement enforcement
- ✅ Version routing

**What Tests DO NOT Cover:**
- ❌ Responsive grid behavior (visual validation only)
- ❌ Icon rendering fallback
- ❌ ILS API integration (tested separately)
- ❌ Telemetry delivery (tested separately)

## Status

**CURRENT** - D1 is the canonical Definition block implementation

**Rationale:**
- Fully integrated across all lifecycle stages
- Complete UBRC compliance
- Registry entry active
- Comprehensive test coverage including persistence integration
- Production-ready UI with responsive characteristics grid
- Passive ILS participation model implemented
- Version router pattern established
- AI authoring contract certified

**Version Architecture:**
- D1 is **canonical locked** (UI frozen, only theme colors vary by brand)
- Version routing handled inside `DefinitionBlock` component (different from C1)
- Future D2/D3 versions will add new cases to router
- TutorialBlockRenderer delegates to `DefinitionBlock` which handles version switching

## Reference Quality

**REFERENCE-QUALITY** - D1 serves as the canonical example for definition blocks and demonstrates version router pattern

**Rationale:**

### ✅ Strengths
1. **Complete lifecycle with persistence tests:** End-to-end integration testing from AI output to delivery
2. **Version router pattern:** Demonstrates internal version routing (alternative to TutorialBlockRenderer routing)
3. **AI contract certification:** Validates AI-generated content structure and conversion pipeline
4. **Theme enforcement:** Explicit validation that theme is provided (ensures brand consistency)
5. **Responsive design:** Characteristics grid adapts from 1 to 4 columns based on viewport
6. **Rich content model:** Combines definition, explanation, example, characteristics, takeaway
7. **Schema strictness:** `.strict()` validation prevents field pollution
8. **UBRC compliance:** Clean attribute rendering with dynamic version

### 📋 Documentation
- Schema comments explain AI validation pipeline
- Component comments identify canonical locked UI and version routing
- Registry metadata describes D1 capabilities
- Example payload demonstrates complete structure
- Persistence tests document storage architecture

### 🎯 Use Cases for Reference
- **Version router pattern:** Alternative to renderer-level routing (useful for blocks with complex version logic)
- **AI authoring pipeline:** D1 demonstrates validation → canonicalization → persistence flow
- **Theme validation:** Example of required theme enforcement
- **Persistence integration:** Tests show how blocks persist to JSONB and round-trip
- **Responsive grid layout:** Characteristics grid demonstrates adaptive column layout
- **Rich instructional content:** Multi-section structure for comprehensive concept explanation

### ⚖️ Architectural Comparison: C1 vs D1

| Aspect | C1 (Code Block) | D1 (Definition Block) |
|--------|-----------------|----------------------|
| **Version routing** | TutorialBlockRenderer | Internal DefinitionBlock router |
| **Theme handling** | Fallback default provided | Required, throws error if missing |
| **Test emphasis** | UI + routing | Persistence + AI contract |
| **Content sections** | 6 (header, code, explanation, output, memory, takeaway) | 8 (header, definition, explanation, example, characteristics, takeaway) |
| **Responsive features** | Horizontal scroll for code | Grid breakpoints for characteristics |
| **Historical compatibility** | Preserves TutorialCodePayload | N/A (new in canonical architecture) |

Both are **REFERENCE-QUALITY** implementations suitable for use as templates for new versioned blocks.

---

# Cross-Block Architecture Summary

## Universal Patterns (C1 and D1)

### ✅ Lifecycle Compliance
Both blocks implement **complete lifecycle** from type contract through runtime rendering:
1. Zod schema validation (authoring + delivery boundaries)
2. Registry entry (admin tool integration)
3. Example payloads (composer defaults)
4. TutorialDocument.blocks[] representation
5. TutorialBlockRenderer routing
6. UBRC attribute rendering
7. Passive ILS participation
8. Page-level LSNB/RSSB integration

### ✅ UBRC Architecture
Both blocks expose **Universal Block Runtime Context** attributes:
- `data-block-id`: UUID
- `data-block-type`: Block family name
- `data-block-version`: Version code (C1, D1)

These attributes enable:
- Viewport-based active block detection
- Progress tracking without block awareness
- Telemetry correlation
- Test observability

### ✅ Passive ILS Model
Neither block directly calls ILS APIs. Instead:
- Blocks render UBRC attributes (identity only)
- `ActiveBlockContext` detects viewport position
- `ILSProvider` tracks progress via identity
- `BlockTelemetryProvider` sends time metrics
- ILS backend processes completion

**Benefit:** Blocks remain stateless presentation components. Runtime providers handle all tracking logic.

### ✅ Page-Level Navigation
LSNB (Left Sidebar Navigation Bar) and RSSB (Right Sidebar) are created by `TutorialPageShell`, not individual blocks:
- LSNB shows topic hierarchy and current page progress
- RSSB shows block-level progress for current page
- Both consume ILS data via `useILS()` hook
- Blocks have zero sidebar logic

## Divergent Patterns

### Version Routing Strategy
- **C1:** TutorialBlockRenderer enforces version (rejects non-C1 at router level)
- **D1:** DefinitionBlock internal router switches on version (delegates to D1View)

**Trade-offs:**
- **Renderer routing (C1):** Centralized version control, explicit error handling
- **Component routing (D1):** Flexible for complex version logic, version-specific themes

### Theme Handling
- **C1:** Provides fallback default theme if not supplied
- **D1:** Throws error if theme.primary or theme.secondary missing

**Rationale:**
- C1 designed for flexibility (can preview without theme)
- D1 enforces brand consistency (definition must use brand colors)

### Test Philosophy
- **C1:** Focus on UI structure, routing, interactions (clipboard)
- **D1:** Focus on persistence, AI contract, round-trip integrity

**Rationale:**
- C1 has complex interactive UI (copy buttons, terminal windows)
- D1 represents AI-generated content pipeline (validation critical)

## Recommendations for New Versioned Blocks

When implementing new versioned blocks (I2, S2, O1, V1, etc.):

1. **Follow C1 for interactive UI blocks** with rich interactions (copy, expand, tabs)
2. **Follow D1 for AI-generated content** requiring strict validation
3. **Use renderer routing** for simple version switching (reject old versions)
4. **Use component routing** for complex version logic (feature flags, A/B tests)
5. **Always implement UBRC attributes** (non-negotiable for ILS)
6. **Keep blocks passive** (no direct ILS API calls)
7. **Write persistence integration tests** if AI-generated (like D1)
8. **Write interaction tests** if user-facing controls (like C1)

---

# Appendix: File Reference Index

## C1 (Code Block)
- **Schema:** `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`
- **Component:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- **Registry:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/code.registry.ts`
- **Examples:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/code/C1/codeC1.examples.ts`
- **Tests:** 
  - `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
  - `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx`
  - `packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.clipboard.test.tsx`

## D1 (Definition Block)
- **Schema:** `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts`
- **Component:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- **Registry:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/definition.registry.ts`
- **Examples:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/definition/D1/definitionD1.examples.ts`
- **Tests:**
  - `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
  - `packages/db-tutorial/src/services/__tests__/phase-1h-definition-d1-persistence.integration.test.ts`
  - `packages/db-tutorial/src/services/__tests__/phase-1i-definition-d1-ai-contract.test.ts`
  - `packages/db-tutorial/src/services/__tests__/phase2b13-certification-verification.test.ts`

## Infrastructure
- **TutorialBlockRenderer:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`
- **TutorialDocument:** `packages/types/src/tutorial-rich-document/document.ts`
- **TutorialPageShell:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`
- **ILSProvider:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx`
- **ActiveBlockContext:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`
- **Block Types:** `packages/types/src/tutorial-rich-document/blocks/index.ts`
- **Registry API:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts`

---

# Conclusion

**C1 (Code Block)** and **D1 (Definition Block)** are both **CURRENT, COMPLETE, REFERENCE-QUALITY** implementations of the versioned block architecture. They demonstrate:

- ✅ Full lifecycle integration from authoring to runtime
- ✅ Strict UBRC compliance for ILS participation
- ✅ Passive architecture (presentation-only blocks)
- ✅ Comprehensive test coverage (UI + persistence)
- ✅ Production-ready canonical locked UIs
- ✅ Two viable version routing strategies

Both blocks serve as templates for future versioned block development (I2, S2, O1, V1, etc.).
