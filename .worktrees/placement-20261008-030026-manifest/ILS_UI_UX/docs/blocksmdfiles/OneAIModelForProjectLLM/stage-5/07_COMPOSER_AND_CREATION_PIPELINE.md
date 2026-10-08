# Investigation 07: Composer and Creation Pipeline

**Date**: 2026-10-03  
**Status**: ✅ COMPLETE  
**Scope**: Tutorial authoring layer, composition rules enforcement, validation workflow, External AI integration

---

## Executive Summary

Investigation 07 establishes **VERIFIED** evidence for production Composer architecture, composition rule enforcement, and validation workflow. The Composer exists as server-side service (`TutorialComposerService`) with explicit validation, block registry (18 registered types), and publish workflow. **MAX_NESTING_DEPTH = 3** is enforced via schema validation layer. Container nesting is supported via type system but specific semantic restrictions (e.g., versioned blocks inside containers) remain **NOT VERIFIED**. Service-layer authorization enforcement is **NOT VERIFIED** (explicit TODOs observed in 5 mutation methods). External AI integration points and Project LLM verification boundary are **NOT FOUND in the inspected Composer/creation-pipeline surface**.

---

## 1. Composer Location and Architecture

### Evidence State: ✅ VERIFIED

**Primary Service**: `packages/db-tutorial/src/services/tutorial-composer.service.ts`

```typescript
export class TutorialComposerService {
  // Document lifecycle
  async createTutorial(params: CreateTutorialParams): Promise<Tutorial>
  async getTutorial(id: string): Promise<Tutorial | null>
  async updateTutorialContent(id: string, updates: UpdateTutorialContentParams): Promise<Tutorial>
  async updateTutorialStatus(id: string, status: TutorialStatus, userId?: string): Promise<Tutorial>
  
  // Block composition
  async appendBlockToTutorial(tutorialId: string, block: TutorialBlock): Promise<Tutorial>

  // Publication workflow
  async publishTutorial(tutorialId: string, params?: PublishParams): Promise<Tutorial>
  async archiveTutorial(tutorialId: string): Promise<Tutorial>
}
```

**Status Field**: `TutorialStatus = 'draft' | 'deployed' | 'archived'` (V2 implementation)

**Key Methods**:

1. **`createTutorial()`**:
   - Creates new tutorial document
   - Validates TutorialDocumentSchema via `safeParse()`
   - Checks hierarchy (domainId/subjectId/topicId/subtopicId resolution)
   - Initializes as `status: 'draft'`

2. **`appendBlockToTutorial()`**:
   - Appends block to existing tutorial
   - Re-validates entire document with updated blocks array
   - Returns updated Tutorial record
   - **Authorization**: Contains explicit TODO for authorization check

3. **`publishTutorial()`**:
   - Transitions status `draft → deployed`
   - Validates document before publishing
   - Rejects empty documents
   - Records publication timestamp
   - **Authorization**: Contains explicit TODO for authorization check

**Evidence**: Complete service implementation read from source.

---

## 2. Block Registry and Registration Mechanism

### Evidence State: ✅ VERIFIED

**Registry Location**: `packages/types/src/tutorial-rich-document/registry.ts`

**Registry Structure** (from actual source):

```typescript
export interface BlockRegistryEntry {
  type: BlockType;
  label: string;
  description: string;
  category: BlockCategory;
  icon?: string;
  supportsChildren: boolean;
  maxChildren?: number;
  allowedChildTypes?: BlockType[];
  isExperimental?: boolean;
  tags?: string[];
}

export type BlockCategory = 
  | 'text'           // Heading, Paragraph
  | 'list'           // List
  | 'code'           // Code, Example
  | 'media'          // Image, Diagram
  | 'structure'      // Table, Comparison
  | 'emphasis'       // Callout, Quote
  | 'educational'    // Definition, Summary
  | 'layout';        // TwoColumn, ThreeColumn, CardGrid, Timeline
```

**Registry Entries** (18 total):

**Text blocks (2)**:
- `heading`: Heading, section heading (H1-H6)
- `paragraph`: Paragraph, text paragraph

**List blocks (1)**:
- `list`: List, ordered or unordered list

**Code blocks (2)**:
- `code`: Code, code block with syntax highlighting
- `example`: Example, code example with explanation

**Media blocks (2)**:
- `image`: Image, image with caption
- `diagram`: Diagram, diagram or flowchart

**Structure blocks (2)**:
- `table`: Table, data table
- `comparison`: Comparison, feature comparison table

**Emphasis blocks (2)**:
- `callout`: Callout, important notice or tip
- `quote`: Quote, quotation block

**Educational blocks (3)**:
- `definition`: Definition, term definition
- `introduction`: Introduction, complete roadmap-style overview
- `summary`: Summary, key points summary

**Layout blocks (4)** — containers with `supportsChildren: true`:
- `two-column`: Two Column, two-column layout
- `three-column`: Three Column, three-column layout
- `card-grid`: Card Grid, grid of cards (maxChildren: 20)
- `timeline`: Timeline, timeline with events (maxChildren: 50)

**Registry API**:
- `getBlockInfo(type: BlockType)` → returns BlockRegistryEntry
- `getBlocksByCategory(category: BlockCategory)` → returns entries by category
- `getContainerBlocks()` → returns entries with `supportsChildren: true`
- `getContentBlocks()` → returns entries with `supportsChildren: false`
- `searchBlocksByTag(tag: string)` → returns entries matching tag

**Evidence**: Complete registry read from `packages/types/src/tutorial-rich-document/registry.ts`.

---

## 3. Container and Nesting Restrictions Enforced by Composer

### Evidence State: ✅ VERIFIED (MAX_NESTING_DEPTH via schema validation), ⏳ NOT VERIFIED (semantic restrictions)

**3A. Nesting Depth Enforcement via Schema Validation**

**Constant Declaration**: `packages/types/src/tutorial-rich-document/constants.ts`

```typescript
export const MAX_NESTING_DEPTH = 3;
export const MAX_BLOCKS_PER_DOCUMENT = 500;
```

**Validation Logic**: `packages/types/src/tutorial-rich-document/validation.ts`

```typescript
export function validateTutorialDocument(document: TutorialDocument): ValidationResult {
  const errors: ValidationError[] = [];

  // Check nesting depth
  const depth = calculateNestingDepth(document.blocks);
  if (depth > MAX_NESTING_DEPTH) {
    errors.push({
      code: 'MAX_NESTING_EXCEEDED',
      message: `Nesting depth ${depth} exceeds maximum ${MAX_NESTING_DEPTH}`,
      path: 'blocks',
    });
  }

  // ... other validations
}
```

**Depth Calculation**: `packages/types/src/tutorial-rich-document/blocks/index.ts`

```typescript
export function calculateNestingDepth(blocks: TutorialBlock[], currentDepth = 0): number {
  let maxDepth = currentDepth;

  for (const block of blocks) {
    if (isContainerBlock(block)) {
      const childDepth = calculateNestingDepth(getChildBlocks(block), currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  }

  return maxDepth;
}
```

**Runtime Enforcement**: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

```typescript
export function TutorialBlockRenderer({ blocks, depth = 0 }: Props) {
  // Enforce maximum recursion depth
  if (depth > MAX_NESTING_DEPTH) {
    return <NestingLimitState depth={depth} />;
  }

  // ... render logic
}
```

**Evidence Classification**: ✅ VERIFIED — Composer invokes TutorialDocumentSchema validation, and that validation enforces `MAX_NESTING_DEPTH = 3`. Runtime rendering (from Investigation 04) independently has the corresponding fail-safe. Composer does not enforce nesting depth directly—it delegates to schema validation layer.

**3B. Container Types Supporting Nested Blocks**

Four container types support nested `TutorialBlock[]`:

1. **TwoColumnBlock**: `{ leftBlocks: TutorialBlock[], rightBlocks: TutorialBlock[] }`
2. **ThreeColumnBlock**: `{ leftBlocks: TutorialBlock[], centerBlocks: TutorialBlock[], rightBlocks: TutorialBlock[] }`
3. **CardGridBlock**: `{ cards: Array<{ title?, description?, blocks: TutorialBlock[] }> }`
4. **TimelineBlock**: `{ items: Array<{ id, title, date?, description?, blocks?: TutorialBlock[] }> }`

**Evidence**: BLOCK_REGISTRY entries read from `packages/types/src/tutorial-rich-document/registry.ts`, CardGridBlock component verified in `packages/ui/src/tutorial/blocks/`.

**3C. Semantic Restrictions Beyond Depth**

**OPEN QUESTIONS** (not yet verified in source):

1. Can versioned blocks (I1, D1, C1) be placed inside container blocks?
2. Can structural primitives (ComparisonBlock, DiagramBlock) be placed inside container blocks?
3. Does Composer UI restrict certain block types from nesting?
4. Does `SECTION_BLOCK_PALETTES` enforce per-section composition rules?

**Evidence Classification**: ⏳ NOT VERIFIED — Type system permits nesting, but semantic/UI restrictions not confirmed from source inspection.

---

## 4. Stage 3 Composition Rules: Production Enforcement Status

### Evidence State: ✅ PARTIAL

**Stage 3 Matrix Context**: Stage 3 educational corpus documented composition rules (e.g., "Intro must precede Definition", "Code blocks require Prerequisites"). Investigation 07 must determine which rules production Composer enforces.

**Findings**:

| Rule Category | Enforcement Status | Evidence |
|---|---|---|
| MAX_NESTING_DEPTH = 3 | ✅ VERIFIED | Enforced via TutorialDocumentSchema validation + runtime fail-safe |
| Container recursion support | ✅ VERIFIED | TwoColumn/ThreeColumn/CardGrid/Timeline all accept `TutorialBlock[]` |
| MAX_BLOCKS_PER_DOCUMENT = 500 | ⏳ DECLARED / NOT VERIFIED | Constant declared, enforcement not inspected |
| Section-specific block palettes | ✅ DECLARED | `SECTION_BLOCK_PALETTES` exists, usage not traced |
| Educational ordering rules | ⏳ NOT VERIFIED | No evidence of "Intro before Definition" enforcement |
| Prerequisite block validation | ⏳ NOT VERIFIED | No evidence of prerequisite checking logic |
| Versioned block isolation rules | ⏳ NOT VERIFIED | No evidence of I1/D1/C1 isolation from containers |

**Composer Validation Entry Point**:

```typescript
// TutorialComposerService.createTutorial()
const validation = TutorialDocumentSchema.safeParse(tutorialDocument);
if (!validation.success) {
  throw new Error(`Invalid tutorial document: ${validation.error.message}`);
}
```

**TutorialDocumentSchema** (from Investigation 06G):
- Zod schema enforcing type system
- Validates block structure, required fields
- Does NOT encode educational ordering rules

**Evidence Classification**: ✅ PARTIAL — Type system and nesting limits verified. Educational composition rules from Stage 3 corpus NOT FOUND in production validation logic.

---

## 5. Draft/Save/Publish/Approval Workflow

### Evidence State: ✅ VERIFIED (status transitions), ⏳ NOT VERIFIED (authorization enforcement)

**Status Transitions (V2 Implementation)**:

V2 TutorialComposerService uses `TutorialStatus = 'draft' | 'deployed' | 'archived'`.

Status changes occur through dedicated methods:
- `publishTutorial()` transitions `draft → deployed` (with validation)
- `archiveTutorial()` transitions to `archived` status
- `updateTutorialStatus()` allows explicit status transitions with userId audit trail

**Workflow States**:

1. **Draft**: Initial state after `createTutorial()`
2. **Deployed**: After `publishTutorial()` (requires valid document, rejects empty documents)
3. **Archived**: After `archiveTutorial()` (soft delete)

**Authorization Status**: 
- Service methods accept `userId` parameter for audit trail
- **Authorization checks NOT VERIFIED**: Explicit TODOs observed in source:
  ```typescript
  // TODO: Add authorization check
  // await this.assertCanEditTutorial(...)
  ```
- Authorization TODOs observed in: `updateTutorialContent()`, `updateTutorialStatus()`, `publishTutorial()`, `archiveTutorial()`, `appendBlockToTutorial()`

**Save Operations**:
- `updateTutorialContent()` updates tutorial content without changing status
- `appendBlockToTutorial()` appends block and re-validates document
- No explicit "approval" workflow found (single-user authoring model)

**Evidence**: Service methods and status transitions verified from source. Authorization enforcement explicitly marked as TODO in inspected mutation methods.

---

## 6. Validation Before Persistence

### Evidence State: ✅ VERIFIED

**Validation Entry Points**:

1. **At creation** (`createTutorial()`):
   ```typescript
   const validation = TutorialDocumentSchema.safeParse(tutorialDocument);
   if (!validation.success) {
     throw new Error(`Invalid tutorial document: ${validation.error.message}`);
   }
   ```

2. **At block append** (`appendBlockToTutorial()`):
   ```typescript
   const updatedDocument = { ...tutorial.document, blocks: [...tutorial.document.blocks, block] };
   const validation = TutorialDocumentSchema.safeParse(updatedDocument);
   if (!validation.success) {
     throw new Error('Appending block would create invalid document');
   }
   ```

3. **At publish** (`publishTutorial()`):
   ```typescript
   const validation = TutorialDocumentSchema.safeParse(tutorial.document);
   if (!validation.success) {
     throw new Error('Cannot publish invalid tutorial document');
   }
   ```

**Validation Coverage** (from Investigation 06G/06H):
- Type conformance (TutorialBlock discriminated union)
- Required fields per block type
- Nesting depth limits
- Content sanitization (HTML injection prevention)
- Schema versioning

**Evidence**: Validation logic traced through TutorialComposerService → TutorialDocumentSchema → validateTutorialDocument().

---

## 7. External AI Integration

### Evidence State: ❌ NOT FOUND in inspected Composer surface

**Search Coverage**:
- Searched for: `external.*ai`, `openai`, `anthropic`, `claude`, `gpt.*integration`, `ai.*candidate`, `ai.*workflow`
- Scanned: Composer service, API routes, repository layer, validation logic

**Findings**:
- No External AI service clients found in Composer codebase
- No "candidate block" submission endpoints
- No AI-generated content ingestion workflow
- Only incidental references: marketing copy mentioning "OpenAI API" as course topic

**Evidence Classification**: ❌ NOT FOUND in the inspected Composer/creation pipeline surface. No conclusion is made about AI functionality elsewhere in the repository or outside this production surface.

---

## 8. Project LLM Verification/Adapter Boundary

### Evidence State: ❌ NOT FOUND in inspected Composer surface

**Expected Boundary** (from Stage 5 steering):
- External AI generates candidate educational blocks
- Project LLM verifies educational quality, adapts to platform schemas
- Composer persists verified blocks

**Production Reality**: No evidence of Project LLM as verification layer in inspected Composer surface. Composer directly accepts TutorialBlock objects conforming to TutorialDocumentSchema.

**Validation Present**: TutorialDocumentSchema validation (06G/06H) ensures type safety and sanitization, but this is **not** AI-mediated educational verification—it's structural/security validation.

**Evidence Classification**: ❌ NOT FOUND in the inspected Composer/creation pipeline surface. No conclusion is made about AI functionality elsewhere in the repository or outside this production surface.

---

## 9. Composer UI Components

### Evidence State: ✅ PARTIAL

**Composer UI Location**: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/`

**Key Components Found**:

1. **TutorialBlockSelector** (`components/TutorialBlockSelector.tsx`):
   - Allows selecting block types from BLOCK_REGISTRY
   - Displays block categories from BLOCK_REGISTRY

2. **Section API Routes** (`api/tutorial-composer/sections/`):
   - Create/update/delete section operations
   - Calls TutorialComposerService methods

3. **Block Registry UI** (`registry/` directory):
   - UI representations of BLOCK_REGISTRY entries
   - Block metadata display

**Not Inspected** (bounded scope):
- Complete UI composition workflow (drag-drop, block editing forms)
- Section ordering interface
- Preview/render modes
- Approval/review UI (if exists)

**Evidence Classification**: ✅ PARTIAL — Composer UI exists, basic structure verified, detailed workflow not inspected.

---

## 10. Gap Summary

### ✅ VERIFIED

1. TutorialComposerService architecture (create/append/publish/archive)
2. BLOCK_REGISTRY structure (18 registered block types observed in inspected registry source)
3. MAX_NESTING_DEPTH = 3 enforcement via TutorialDocumentSchema validation (Composer delegates to schema layer)
4. Container recursion support (TwoColumn/ThreeColumn/CardGrid/Timeline)
5. Draft → Deployed → Archived status workflow (V2 implementation)
6. Validation before persistence (TutorialDocumentSchema at all mutation points)
7. Append-based composition (multiple blocks of same type allowed)
8. Empty document rejection at publish

### ⏳ NOT VERIFIED / DECLARED

1. **MAX_BLOCKS_PER_DOCUMENT = 500**: Constant declared, enforcement not inspected
2. Semantic nesting restrictions (versioned blocks in containers?)
3. SECTION_BLOCK_PALETTES enforcement in Composer
4. Educational ordering rules from Stage 3 corpus
5. Complete Composer UI workflow (block editing forms, preview)
6. **Service-layer authorization enforcement** (explicit TODOs observed in: updateTutorialContent, updateTutorialStatus, publishTutorial, archiveTutorial, appendBlockToTutorial)

### ❌ NOT FOUND (in inspected Composer surface)

1. External AI integration points
2. Project LLM verification/adapter boundary
3. AI-generated candidate block ingestion workflow

---

## 11. Authority Boundary Clarification

**From Stage 5 Steering**:
> "Preserve authority boundary: External AI = candidate creator, Project LLM = verifier/adapter, Composer = authoring layer, Runtime = lifecycle/telemetry/progress authority"

**Production Reality**:

| Authority | Expected Role (Steering) | Actual Role (Production) |
|---|---|---|
| External AI | Candidate block creator | ❌ NOT FOUND in inspected Composer surface |
| Project LLM | Educational verifier/adapter | ❌ NOT FOUND in inspected Composer surface |
| Composer | Authoring layer, persistence | ✅ VERIFIED (human-authored blocks, schema validation) |
| Runtime | Lifecycle, telemetry, progress | ✅ VERIFIED (from 06A-06J) |

**Production Evidence**: No External AI → candidate block workflow or Project LLM verification/adapter boundary was found in the inspected Composer/creation-pipeline surface.

This investigation does not establish whether such functionality exists outside the inspected surface.

---

## 12. Cross-Reference to Prior Investigations

**Investigation 03 (Type Schema)**:
- Defined TutorialBlock discriminated union
- Documented container types with nested blocks
- Declared MAX_NESTING_DEPTH constant
- 07 confirms these types enforced by Composer validation

**Investigation 04 (Rendering Runtime)**:
- Documented TutorialBlockRenderer recursion with depth enforcement
- Showed container blocks calling renderChild(depth + 1)
- 07 confirms composition rules enforced at authoring layer mirror runtime constraints

**Investigation 06G (Schema Validation)**:
- Documented TutorialDocumentSchema Zod validation
- Showed validation at delivery layer
- 07 confirms same validation used by Composer before persistence

**Investigation 06H (Sanitization)**:
- Documented TutorialContentSanitizationService
- Showed HTML content sanitization before rendering
- 07 confirms sanitization is runtime concern, not Composer authoring concern (Composer persists unsanitized, runtime sanitizes on read)

---

## Conclusion

Investigation 07 establishes **complete evidence for production Composer architecture** as direct human authoring tool with schema-validated document persistence. Composition rule enforcement is **VERIFIED** for nesting depth limits (via schema validation layer) and container recursion, but **NOT VERIFIED** for educational ordering rules from Stage 3 corpus or service-layer authorization (explicit TODOs observed in 5 mutation methods). External AI integration and Project LLM verification boundary are **NOT FOUND in the inspected Composer/creation-pipeline surface**.

This investigation does not establish whether such functionality exists outside the inspected surface.

**V2 Status Lifecycle**: `draft → deployed → archived` (verified from actual TutorialComposerService source)

**Next Investigation**: 08 (Testing and Certification Evidence)

---

**Investigation Completed**: 2026-10-03  
**Evidence Quality**: VERIFIED (architecture/validation), NOT FOUND (AI integration)  
**Blockers**: None
