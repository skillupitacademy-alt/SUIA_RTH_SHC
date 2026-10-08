# PROJECT LLM — Runtime Compliance Matrix

**Status:** Canonical (v1.0 — post-HAA-consolidation)  
**Date:** January 20, 2025  
**Authority:** HAA Decisions + reconciliation-implementation-status.md + TutorialBlockRenderer.tsx  
**Source:** consolidation-plan.md (132 versions, 18 families, 3 verified implementations)

---

## Executive Summary

### Architectural Overview

- **18 Educational Block Families** in architectural taxonomy
- **132 documented versions** across 18 families (126 verified specifications + 6 incomplete/gap)
- **3 verified implementations** (I1, C1, D1) — full UBRC compliance
- **1 incomplete implementation** (S1) — partial UBRC compliance, NOT counted as implemented
- **15 families:** PLANNED (no runtime components yet)
- **15 Implementation Primitives:** Unversioned by design (no data-block-version field)

### UBRC Compliance Summary

| Category | Total | Full Compliance | Incomplete | Planned |
|----------|-------|-----------------|------------|---------|
| Educational Block Families | 18 | 3 (I1, C1, D1) | 1 (S1) | 14 |
| Implementation Primitives | 15 | 15 | 0 | 0 |
| **TOTAL** | **33** | **18** | **1** | **14** |

---

## UBRC Compliance Definition

### Universal Block Runtime Context (UBRC)

UBRC is a standardized DOM identity boundary that enables runtime tracking without requiring blocks to know about tracking infrastructure.

### Full UBRC Compliance Requirements

Full UBRC compliance requires **ALL 3 attributes** on the root element:

1. **`data-block-id`:** Unique identifier for the block instance (e.g., "intro-123")
2. **`data-block-type`:** The block family identifier (e.g., "introduction")
3. **`data-block-version`:** The version number (e.g., "I1")

**PLUS:** Version routing logic in the renderer or component (switch/map on block version)

### UBRC for Unversioned Primitives

Implementation primitives require only **2 attributes** (no version by design):

1. **`data-block-id`:** Unique identifier
2. **`data-block-type`:** Block type identifier

---

## Runtime Compliance Matrix

### Educational Block Families (18 Families)

| Family | Version | React Component | data-block-type | data-block-family | data-block-version | Version Routing | Overall Status |
|--------|---------|-----------------|-----------------|-------------------|-------------------|-----------------|----------------|
| **I** (Introduction) | **I1** | ✅ IntroductionBlock.tsx | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED | **FULL COMPLIANCE** |
| **C** (Code) | **C1** | ✅ CodeC1Block.tsx | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED | **FULL COMPLIANCE** |
| **D** (Definition) | **D1** | ✅ DefinitionBlock.tsx | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED | ✅ VERIFIED | **FULL COMPLIANCE** |
| **S** (Summary) | **S1** | ⚠️ SummaryBlock.tsx | ✅ VERIFIED | ✅ VERIFIED | ❌ MISSING | ❌ MISSING | **INCOMPLETE** |
| O (Objective) | O1-O5 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| V (Visual) | V1-V8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| CP (Comparison) | CP1-CP8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| E (Execution) | E1-E8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| M (Memory) | M1-M8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| MT (Mistake) | MT1-MT8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| BP (BestPractice) | BP1-BP7 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| Q (Question) | Q1-Q8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| EX (Exercise) | EX1-EX8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| T (Task) | T1-T8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| INT (Interactive) | INT1-INT6 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| QZ (Quiz) | QZ1-QZ8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| IV (Interview) | IV1-IV7 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |
| P (Project) | P1-P8 | ❌ NOT_EVIDENCED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | ⏸️ PLANNED | **PLANNED** |

### Version Count by Family

| Family | Documented Versions | Implemented Versions | Status |
|--------|---------------------|----------------------|--------|
| Introduction (I) | 6 (I1-I6) | 1 (I1) | I1 VERIFIED |
| Objective (O) | 5 (O1-O5) | 0 | PLANNED |
| Definition (D) | 6 (D1-D6) | 1 (D1) | D1 VERIFIED |
| Code (C) | 10 (C1-C10) | 1 (C1) | C1 VERIFIED |
| Visual (V) | 8 (V1-V8) | 0 | PLANNED |
| Comparison (CP) | 8 (CP1-CP8) | 0 | PLANNED |
| Execution (E) | 8 (E1-E8) | 0 | PLANNED |
| Memory (M) | 8 (M1-M8) | 0 | PLANNED |
| Mistake (MT) | 8 (MT1-MT8) | 0 | PLANNED |
| BestPractice (BP) | 7 (BP1-BP7) | 0 | PLANNED |
| Summary (S) | 6 (S1-S6) | 0 | S1 INCOMPLETE |
| Question (Q) | 8 (Q1-Q8) | 0 | PLANNED |
| Exercise (EX) | 8 (EX1-EX8) | 0 | PLANNED |
| Task (T) | 8 (T1-T8) | 0 | PLANNED |
| Interactive (INT) | 6 (INT1-INT6) | 0 | PLANNED |
| Quiz (QZ) | 8 (QZ1-QZ8) | 0 | PLANNED |
| Interview (IV) | 7 (IV1-IV7) | 0 | PLANNED |
| Project (P) | 8 (P1-P8) | 0 | PLANNED |
| **TOTAL** | **132** | **3** | **3 VERIFIED** |

---

## Detailed Evidence — Verified Implementations

### I1 — Introduction Block v1

**React Component:** `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`

**UBRC Attributes:**
- `data-block-id={block.id}` — Present (line 117)
- `data-block-type="introduction"` — Present (line 118)
- `data-block-version={block.version}` — Present (line 119, renders "I1")

**Version Routing:**
- Component-level version router: Lines 30-39
- Validation logic: `if (block.version !== 'I1') throw new Error(...)`
- Renderer-level validation: TutorialBlockRenderer.tsx lines 96-108
- Error message: "Unsupported Introduction version. I1 is required."

**Pedagogical Structure:**
- 9-section educational structure (hero, learning goal, topic, where fit, solution, where used, roadmap, why matters, key takeaway)
- Canonical content pattern: `content: { page: {...} }`
- Theme-aware rendering (requires `theme.primary`, `theme.secondary`)

**Test Coverage:**
- `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx` (lines 88-92)
- `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` (UBRC attribute verification)
- Schema validation, version routing, UBRC attributes, theme validation, 9-section rendering

**Composer Integration:**
- Registry: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/introduction.registry.ts`
- Available in admin authoring tool

**Verdict:** **REFERENCE QUALITY** — Most sophisticated UI, complete implementation, comprehensive test coverage

---

### C1 — Code Block v1

**React Component:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`

**UBRC Attributes:**
- `data-block-id={block.id}` — Present (line 98)
- `data-block-type="code"` — Present (line 99)
- `data-block-version="C1"` — Present (line 100, hardcoded string literal)

**Version Routing:**
- Renderer-level version enforcement: TutorialBlockRenderer.tsx lines 76-86
- Validation logic: `if (block.version !== 'C1') throw new Error('Unsupported code block version. Code C1 is required.')`
- Strictest version enforcement pattern (renderer-level)

**Pedagogical Structure:**
- Code example with syntax highlighting
- Explanation table with line-by-line walkthrough
- Output terminal display
- Memory model visualization
- Key takeaway section
- Canonical content pattern: `content: { page: {...} }`

**Test Coverage:**
- Dedicated test file: `packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx` (475+ lines, 50+ test cases)
- Test categories: Rendering, XSS protection, accessibility, code display, explanation table, output terminal, memory model, takeaway
- `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` (lines 287-316)

**Composer Integration:**
- Registry: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/code.registry.ts`
- Available in admin authoring tool

**Verdict:** **REFERENCE QUALITY** — Most comprehensive test coverage, strict version enforcement, complete implementation

---

### D1 — Definition Block v1

**React Component:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`

**UBRC Attributes:**
- `data-block-id={block.id}` — Present (line 82)
- `data-block-type="definition"` — Present (line 83)
- `data-block-version={block.version}` — Present (line 84, renders "D1")

**Version Routing:**
- Component-level version router: Lines 20-29
- Validation logic: `switch (block.version) { case 'D1': return <DefinitionD1View />; default: throw new Error('Unsupported Definition version'); }`
- Error message: "Unsupported Definition version"
- Theme validation: `if (!theme?.primary || !theme?.secondary) throw new Error(...)`

**Pedagogical Structure:**
- Definition display with term and explanation
- Visual concept section
- Key characteristics
- Canonical content pattern: `content: { page: {...} }`
- Theme-aware rendering

**Test Coverage:**
- `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` (lines 319-356)
- `packages/ui/src/tutorial/__tests__/TutorialRenderer.test.tsx` (basic rendering tests)
- Version routing, UBRC attributes, theme validation

**Composer Integration:**
- Registry: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/definition.registry.ts`
- TypeScript registry: `packages/types/src/tutorial-rich-document/registries/definition-versions.ts` (D1-D6)
- Available in admin authoring tool

**Authoritative Version Range:** D1-D6 (6 versions documented, only D1 implemented)

**Verdict:** **REFERENCE QUALITY** — Complete implementation, component-level version routing, theme validation

---

## Incomplete Implementation — S1

### Summary S1 Status: INCOMPLETE

**React Component:** `packages/ui/src/tutorial/blocks/SummaryBlock.tsx` (34 lines)

**UBRC Attributes Present:**
- ✅ `data-block-id={block.id}` — Present (line 8)
- ✅ `data-block-type="summary"` — Present (line 9)
- ❌ `data-block-version` — **MISSING** (not rendered)

**UBRC Compliance:** **2/3 attributes** (missing `data-block-version`)

**Version Routing:**
- ❌ NO version routing in component (no switch statement)
- ❌ NO version routing in renderer (TutorialBlockRenderer.tsx line 113 routes directly without validation)
- ❌ Component directly renders content without version discrimination

**What Makes S1 Incomplete:**

1. **Missing UBRC Attribute:** `data-block-version` attribute not rendered (required for versioned blocks)
2. **No Version Enforcement:** Renderer routes all 'summary' blocks to SummaryBlock without version check
3. **Forward Compatibility Risk:** Cannot distinguish S1 from future S2 in runtime
4. **Flat Content Schema:** Uses `content: { title?, points[] }` instead of canonical `content: { page: {...} }` pattern
5. **No Version Router Component:** Direct rendering breaks version isolation pattern used by I1/C1/D1

**Test Evidence:**
- File: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` (lines 154-171)
- Explicit Test: `expect(element?.getAttribute('data-block-version')).toBeNull();`
- Verdict: Test confirms NO version attribute (intentional omission in current implementation)

**HAA Decision:** S1 does NOT count as implemented per UBRC standards

**Required to Achieve Full Compliance:**
1. Add `data-block-version` attribute to root element (e.g., `data-block-version="S1"`)
2. Add version routing to component or renderer (switch statement with error handling)
3. Migrate to canonical content pattern: `content: { page: {...} }`
4. Update tests to verify 3/3 attributes

**Composer Integration:**
- Registry: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/summary.registry.ts`
- TypeScript registry: `packages/types/src/tutorial-rich-document/registries/summary-versions.ts` (S1-S6)
- Available in admin authoring tool (but generates incomplete blocks)

**Evidence Source:**
- React Component: `packages/ui/src/tutorial/blocks/SummaryBlock.tsx`
- Renderer: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (line 113)
- Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`

---

## Implementation Primitives — Runtime Role

### 15 Primitives (Unversioned by Design)

Implementation primitives are renderer-internal building blocks used to compose educational blocks. They do NOT carry `data-block-version` attributes (no version enforcement by design).

| Primitive | Component | UBRC Attributes | Version Field | Pedagogical Structure | Purpose |
|-----------|-----------|-----------------|---------------|----------------------|---------|
| heading | HeadingBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | H1-H6 semantic headings |
| paragraph | ParagraphBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Text paragraphs |
| list | ListBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Ordered/unordered lists |
| table | TableBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Data tables |
| image | ImageBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Image display with caption |
| callout | CalloutBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Info boxes (tip/warning/info) |
| example | ExampleBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Example container |
| quote | QuoteBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Blockquote renderer |
| summary | SummaryBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Bullet list renderer |
| diagram | DiagramBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Diagram container |
| comparison | ComparisonBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Comparison table |
| two-column | TwoColumnBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | 2-column layout container |
| three-column | ThreeColumnBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | 3-column layout container |
| card-grid | CardGridBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Card grid layout |
| timeline | TimelineBlock.tsx | 2/2 (id, type) | ❌ NO | ❌ NO | Timeline visualization |

### Rendering Location

Implementation primitives are rendered **inside** Educational Block components, not directly in TutorialBlockRenderer.

**Example:** Introduction I1 uses primitives internally:
- Hero section uses heading + paragraph primitives
- Learning goal uses callout primitive
- Roadmap uses timeline primitive

**Evidence:** TutorialBlockRenderer.tsx dispatches primitives directly to components without version validation (lines 68-124).

### Composer Integration

Implementation primitives are NOT exposed in the admin authoring tool (programmatic use only within educational blocks).

---

## Taxonomy Clarification

### 18 Educational Block Families vs 15 Implementation Primitives

**Educational Block Families (18):**
- Versioned, UBRC-compliant, pedagogically-distinct block types
- Have `version` field (e.g., I1, D1, C1)
- Use canonical `content: { page: {...} }` structure
- Contain pedagogical sections (hero, learning goal, explanation, takeaway)
- Version routing enforced in renderer or component

**Implementation Primitives (15):**
- Renderer-level sub-components, not families, not versioned
- NO `version` field
- Simple, focused rendering logic
- NO canonical content envelope
- Composable building blocks for educational blocks

**Critical Distinction:**
- Primitives are NOT counted as separate families
- Conflating primitives with families inflates the family count
- HAA correction: 18 families only (not 18 + 15 = 33)

**Evidence Source:**
- Taxonomy Report: `reconciliation-taxonomy-separation.md`
- TutorialBlockRenderer.tsx: 18 renderer type keys (3 families + 15 primitives)

---

## Corrections Applied

### Version Count Corrections

| Original Claim | Corrected Value | Evidence Source | Reason |
|----------------|-----------------|-----------------|--------|
| 141 total versions | **132 total versions** | FAMILY_VERSION_MATRIX.md | D family overcounted (D1-D8 vs D1-D6), V family overcounted (V1-V10 vs V1-V8) |
| D1-D8 (8 versions) | **D1-D6 (6 versions)** | definition-versions.ts (TypeScript registry) | TypeScript registry defines D1-D6 ONLY; D7-D8 not in type system |
| V1-V10 (10 versions) | **V1-V8 (8 versions)** | FAMILY_VERSION_MATRIX.md | Authoritative matrix states "V9, V10 NOT EVIDENCED" |

### Implementation Status Corrections

| Original Claim | Corrected Value | Evidence Source | Reason |
|----------------|-----------------|-----------------|--------|
| 2 families implemented | **3 families implemented** | Implementation Status Report | I1 fully implemented, not "partial" |
| S1 implemented | **S1 INCOMPLETE** | BlockDOMIdentity.test.tsx | Missing `data-block-version` attribute + no version routing |
| D1 "no version routing" | **D1 HAS version routing** | DefinitionBlock.tsx lines 20-29 | Component-level version router exists with switch statement |

### Taxonomy Corrections

| Original Claim | Corrected Value | Evidence Source | Reason |
|----------------|-----------------|-----------------|--------|
| Primitives = families | **Primitives ≠ families** | Taxonomy Separation Report | 15 primitives are building blocks, NOT versioned educational units |
| 18 renderer types = 18 families | **3 families + 15 primitives = 18 renderer types** | TutorialBlockRenderer.tsx | Only 3 renderer types enforce version validation |

---

## Phase 1 Compliance Gaps

### S1 Completion Requirements

To achieve full UBRC compliance, S1 requires:

1. **Add `data-block-version` attribute:**
   ```typescript
   <section
     data-block-id={block.id}
     data-block-type="summary"
     data-block-version="S1"  // ← ADD THIS
   >
   ```

2. **Add version routing:**
   - Option A: Component-level (like D1)
   - Option B: Renderer-level (like C1)

3. **Migrate to canonical content pattern:**
   ```typescript
   // Current: content: { title?, points[] }
   // Canonical: content: { page: { hero, sections, takeaway } }
   ```

4. **Update tests to verify 3/3 attributes**

### Planned Families (14)

The following 14 families have no runtime components yet:

- O (Objective): O1-O5 (5 versions)
- V (Visual): V1-V8 (8 versions)
- CP (Comparison): CP1-CP8 (8 versions)
- E (Execution): E1-E8 (8 versions)
- M (Memory): M1-M8 (8 versions)
- MT (Mistake): MT1-MT8 (8 versions)
- BP (BestPractice): BP1-BP7 (7 versions)
- Q (Question): Q1-Q8 (8 versions)
- EX (Exercise): EX1-EX8 (8 versions)
- T (Task): T1-T8 (8 versions)
- INT (Interactive): INT1-INT6 (6 versions)
- QZ (Quiz): QZ1-QZ8 (8 versions)
- IV (Interview): IV1-IV7 (7 versions)
- P (Project): P1-P8 (8 versions)

**Total Planned Versions:** 129 versions (132 total - 3 implemented)

### Incomplete/Gap Versions

The following 5 versions require specification completion before implementation:

1. **E3** — Execution with Iteration/Loops (PARTIAL specification)
2. **MT8** — Advanced/Systematic Debugging (DECLARED/ABSENT specification)
3. **INT5** — Interactive Simulation (DECLARED/INCOMPLETE specification)
4. **INT6** — Interactive System (DECLARED/INCOMPLETE specification)
5. **P6** — Reflective/Evaluative Project (GAP / specification missing)

**Recommendation:** Complete specifications before implementing

---

## Evidence Sources

### Primary Evidence (Runtime Contracts)

1. **TypeScript Version Registries:**
   - `packages/types/src/tutorial-rich-document/registries/definition-versions.ts`
   - `packages/types/src/tutorial-rich-document/registries/code-versions.ts`
   - `packages/types/src/tutorial-rich-document/registries/summary-versions.ts`
   - `packages/types/src/tutorial-rich-document/registries/introduction-versions.ts`

2. **React Components:**
   - `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
   - `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
   - `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
   - `packages/ui/src/tutorial/blocks/SummaryBlock.tsx`

3. **Renderer:**
   - `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

### Test Evidence

1. **UBRC Attribute Tests:**
   - `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`

2. **Version Routing Tests:**
   - `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx`

3. **Component Tests:**
   - `packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx`
   - `packages/ui/src/tutorial/__tests__/TutorialRenderer.test.tsx`

### Reconciliation Evidence

1. **Consolidation Plan:** `.agents/tasks/consolidation-plan.md` (authoritative version count: 132)
2. **Implementation Status:** `.agents/tasks/reconciliation-implementation-status.md`
3. **Taxonomy Separation:** `.agents/tasks/reconciliation-taxonomy-separation.md`
4. **Runtime Compliance Investigation:** `.agents/tasks/runtime-compliance.md`

---

## Glossary

### Educational Block Family
A versioned pedagogical unit with canonical content structure, version routing, and educational contracts (e.g., Introduction, Definition, Code).

### Block Version
A specific variant within an Educational Block Family (e.g., I1, I2, I3 within Introduction family).

### Implementation Primitive
A reusable React component used to render content, with no version field, no pedagogical contracts, and no canonical content structure (e.g., heading, paragraph, list).

### UBRC (Universal Block Runtime Context)
Standardized DOM identity boundary that enables runtime tracking: `data-block-id`, `data-block-type`, `data-block-version`.

### Version Routing
Logic that validates block version and dispatches to version-specific renderer (enforced at renderer-level or component-level).

### Canonical Content Pattern
Standardized content structure: `content: { page: { hero, sections, takeaway } }` used by educational blocks.

### UBRC Compliance
- **Full Compliance (3/3):** All 3 attributes present + version routing (I1, C1, D1)
- **Partial Compliance (2/3):** Missing `data-block-version` or version routing (S1)
- **Primitive Compliance (2/2):** Only `data-block-id` and `data-block-type` (unversioned primitives)

---

**Document Version:** 1.0  
**Last Updated:** January 20, 2025  
**Authoritative Source:** consolidation-plan.md  
**Status:** CANONICAL — Ready for Project LLM corpus integration
