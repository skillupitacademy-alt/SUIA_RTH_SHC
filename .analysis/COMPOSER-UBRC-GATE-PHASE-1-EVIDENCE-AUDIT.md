# Composer → UBRC Universal Integration Gate
## Phase 1: Detailed Composer Evidence Audit

**Date:** September 13, 2026  
**Mode:** READ-ONLY EVIDENCE AUDIT  
**Status:** IN PROGRESS

---

## Evidence Classification Legend

- **VERIFIED COMPLIANT** - Evidence confirms correct behavior
- **VERIFIED GAP** - Evidence confirms missing/incorrect behavior requiring fix
- **VERIFIED DEFECT** - Evidence confirms behavior violates established contract
- **DOCUMENTATION GAP** - Implementation correct, documentation missing/inconsistent
- **OPTIONAL HARDENING** - Possible improvement, not required
- **UNVERIFIED** - Insufficient evidence to conclude

---

## 1. Canonical Block Builder Evidence

### 1.1 Definition D1 Block Builder

**File:** `packages/db-tutorial/src/services/canonical-block-builder.ts`  
**Function:** `buildCanonicalDefinitionD1Block()`  
**Lines:** 33-43

**Source Code:**
```typescript
export function buildCanonicalDefinitionD1Block(
  authorContent: DefinitionD1AuthorContent,
  blockId?: string
): DefinitionD1Block {
  return {
    id: blockId || randomUUID(),
    type: 'definition',
    version: 'D1',
    content: authorContent,
  };
}
```

**Evidence:**
- ✅ ID: Uses `blockId` parameter if provided, otherwise generates UUID via `randomUUID()`
- ✅ Type: Hardcoded literal `'definition'`
- ✅ Version: Hardcoded literal `'D1'`
- ✅ Content: Author content preserved as-is
- ✅ No hierarchy metadata added
- ✅ No brand/theme metadata added

**ID Stability Assessment:**
- Source: `crypto.randomUUID()` (Node.js built-in, cryptographically secure)
- Type: UUID v4
- Collision probability: Negligible (2^122)
- Stability: ✅ UUIDs are stable identifiers (not array indexes, not timestamps)

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

### 1.2 Code C1 Block Builder

**File:** `packages/db-tutorial/src/services/canonical-block-builder.ts`  
**Function:** `buildCanonicalCodeC1Block()`  
**Lines:** 57-71

**Source Code:**
```typescript
export function buildCanonicalCodeC1Block(
  authorContent: CodeC1AuthorContent,
  blockId?: string
): CodeC1Block {
  return {
    id: blockId || randomUUID(),
    type: 'code',
    version: 'C1',
    content: {
      page: authorContent.page,
    },
  };
}
```

**Evidence:**
- ✅ ID: Uses `blockId` parameter if provided, otherwise generates UUID
- ✅ Type: Hardcoded literal `'code'`
- ✅ Version: Hardcoded literal `'C1'`
- ✅ Content: Only `page` field extracted (security: prevents field injection)
- ✅ No hierarchy metadata added
- ✅ No brand/theme metadata added

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

## 2. Document Builder Evidence

### 2.1 TutorialDocument Assembly

**File:** `packages/db-tutorial/src/services/tutorial-document-builder.ts`  
**Function:** `buildTutorialDocument()`  
**Lines:** 28-35

**Source Code:**
```typescript
export function buildTutorialDocument(
  blocks: TutorialBlock[],
  metadata?: TutorialDocument['metadata']
): TutorialDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blocks,
    ...(metadata && { metadata }),
  };
}
```

**Evidence:**
- ✅ Blocks array: Preserved as-is (no transformation)
- ✅ Schema version: Constant (currently `1`)
- ✅ Metadata: Optional, preserved if provided
- ✅ No block ID mutation
- ✅ No block type mutation
- ✅ No block version mutation
- ✅ Array order preserved

**Block Identity Preservation:**
- Input: `TutorialBlock[]` with IDs
- Output: Same `TutorialBlock[]` with same IDs
- Transformation: **NONE** (pass-through)

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

## 3. Composer Service Evidence

### 3.1 Tutorial Creation (Persistence)

**File:** `packages/db-tutorial/src/services/tutorial-composer.service.ts`  
**Method:** `TutorialComposerService.createTutorial()`  
**Lines:** 87-169

**Key Steps:**
1. Validate `TutorialDocument` schema via `TutorialDocumentSchema.safeParse()`
2. Check for duplicate tutorial
3. Call `repository.createTutorial()` with validated document

**Schema Validation:**
```typescript
const parseResult = TutorialDocumentSchema.safeParse(input.content);
if (!parseResult.success) {
  throw new TutorialDocumentValidationError([...]);
}
const document: TutorialDocument = parseResult.data as TutorialDocument;
```

**Evidence:**
- ✅ Schema validation: Zod parse before persistence
- ✅ Document passed as-is: `content: document`
- ✅ No block transformation after validation
- ✅ No block ID regeneration
- ✅ No block-type filtering

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

### 3.2 Tutorial Retrieval

**File:** `packages/db-tutorial/src/services/tutorial-composer.service.ts`  
**Method:** `TutorialComposerService.getTutorial()`  
**Lines:** 176-195

**Key Steps:**
1. Retrieve tutorial from repository
2. Validate stored content via `TutorialDocumentSchema.safeParse()`
3. Return tutorial with validated content

**Schema Re-validation:**
```typescript
const parseResult = TutorialDocumentSchema.safeParse(tutorial.content);
if (!parseResult.success) {
  throw new TutorialDocumentValidationError([...]);
}
return tutorial;
```

**Evidence:**
- ✅ Stored content re-validated on retrieval
- ✅ No content transformation
- ✅ JSONB deserialization preserves structure
- ✅ Block IDs preserved from storage
- ✅ Block types preserved from storage
- ✅ Block versions preserved from storage

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

## 4. Repository Layer Evidence (Database Persistence)

### 4.1 Tutorial Creation (JSONB Storage)

**File:** `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`  
**Method:** `TutorialSectionRepository.createTutorial()`  
**Lines:** 320-379

**Key Persistence Step:**
```typescript
const values: NewTutorialSection = {
  subtopicId: input.subtopicId,
  navigationNodeId: input.navigationNodeId,
  brandId: (input.brandId || 'shared') as any,
  content: input.content as any, // TutorialDocument stored as JSONB
  orderIndex: input.orderIndex ?? 0,
  status: 'draft',
  version: 1,
  // ... other fields
};

const [row] = await this.dbInstance
  .insert(tutorialSections)
  .values(values)
  .returning();
```

**Evidence:**
- ✅ Content stored as-is: `content: input.content as any`
- ✅ JSONB column type: Preserves structure
- ✅ No pre-serialization transformation
- ✅ Block IDs remain unchanged
- ✅ Block array order preserved
- ✅ Type/version metadata preserved

**Database Schema (Inferred):**
- Table: `tutorial_sections`
- Column: `content` (JSONB type)
- Storage: Complete `TutorialDocument` structure
- Indexed: No (content is document, not searchable fields)

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

### 4.2 Tutorial Retrieval (JSONB Deserialization)

**File:** `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`  
**Method:** `TutorialSectionRepository.getTutorialByPageIdentity()`  
**Lines:** 122-143

**Key Retrieval Step:**
```typescript
const rows = await this.dbInstance
  .select()
  .from(tutorialSections)
  .where(
    and(
      eq(tutorialSections.subtopicId, subtopicId),
      eq(tutorialSections.navigationNodeId, navigationNodeId),
      or(
        eq(tutorialSections.brandId, brandId as any),
        eq(tutorialSections.brandId, 'shared')
      ),
      isNull(tutorialSections.deletedAt)
    )
  )
  .limit(1);

return rows[0];
```

**Evidence:**
- ✅ JSONB column automatically deserialized by Drizzle ORM
- ✅ No post-retrieval transformation
- ✅ Block IDs preserved from database
- ✅ Block types preserved from database
- ✅ Block versions preserved from database
- ✅ Array order preserved

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

## 5. Schema Validation Evidence

### 5.1 TutorialDocument Schema

**File:** `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`  
**Lines:** 20-24

**Zod Schema:**
```typescript
export const TutorialDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  blocks: z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT),
  metadata: TutorialDocumentMetadataSchema,
});
```

**Evidence:**
- ✅ `blocks`: Array of `TutorialBlockSchema` (discriminated union)
- ✅ Max blocks: Enforced at schema level (`MAX_BLOCKS_PER_DOCUMENT`)
- ✅ No block transformation during validation
- ✅ `TutorialBlockSchema` validates block structure (recursive for nested blocks)

**Block Identity in Schema:**
- Each block MUST have `id` field (enforced by `TutorialBlockSchema`)
- Each block MUST have `type` field (discriminator)
- Versioned blocks MUST have `version` field (enforced by versioned schemas)

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

## 6. Renderer Dispatch Evidence

### 6.1 TutorialBlockRenderer Switch Statement

**File:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`  
**Function:** `TutorialBlockRenderer`  
**Lines:** 52-120

**Dispatch Mechanism:**
```typescript
switch (block.type) {
  case 'heading':
    return <HeadingBlock block={block} ... />;
  case 'paragraph':
    return <ParagraphBlock block={block} ... />;
  // ... 15 more cases
  case 'timeline':
    return <TimelineBlock block={block} ... />;
  default: {
    const _exhaustiveCheck: never = block;
    return <UnknownBlockState type={(_exhaustiveCheck as any)?.type || 'unknown'} />;
  }
}
```

**Evidence:**
- ✅ Centralized dispatcher: All blocks routed through single switch
- ✅ Type-based routing: Uses `block.type` discriminator
- ✅ No block ID inspection: Routing independent of ID
- ✅ No block version inspection: Routing independent of version
- ✅ TypeScript exhaustiveness check: `never` type ensures all known types handled
- ⚠️ Default case: Falls through to `UnknownBlockState`

**Block Identity Preservation:**
- Input: `block` prop with `{ id, type, version?, content }`
- Pass-through: Entire `block` object passed to component
- No transformation: Component receives original block

**Classification:** **VERIFIED COMPLIANT** (dispatch mechanism)  
**Note:** Fallback behavior requires separate assessment (see Section 6.2)  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

---

### 6.2 Unknown Block Fallback

**File:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`  
**Function:** `UnknownBlockState`  
**Lines:** 26-35

**Fallback Component:**
```typescript
function UnknownBlockState({ type }: { type: string }) {
  return (
    <div
      role="alert"
      className="my-3 p-3 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2"
    >
      <span>⚠️</span>
      <span>Unsupported or unrecognized block type: <code>{type}</code></span>
    </div>
  );
}
```

**CRITICAL FINDING - UBRC CONTRACT VIOLATION:**

**Props Received:**
- ✅ `type`: string (block type for display)
- ❌ `block`: **NOT RECEIVED** - original block object not passed
- ❌ `id`: **NOT AVAILABLE** - block ID not accessible
- ❌ `version`: **NOT AVAILABLE** - block version not accessible

**Rendered DOM:**
- ❌ `data-block-id`: **MISSING**
- ❌ `data-block-type`: **MISSING**
- ❌ `data-block-version`: **MISSING**
- ❌ No UBRC metadata attributes attached

**UBRC Contract:**
```
REQUIRED: data-block-id (stable UUID from content model)
REQUIRED: data-block-type (block type discriminator)
OPTIONAL: data-block-version (for versioned blocks)
```

**Consequence:**
1. Unknown blocks rendered without UBRC identity
2. ActiveBlockContext **CANNOT** discover unknown blocks (selector: `[data-block-id]`)
3. ILS telemetry **CANNOT** track unknown blocks (no blockId available)
4. Unknown blocks become **invisible** to runtime observation
5. Learning state **LOST** for unknown block types

**Classification:** **VERIFIED DEFECT**  
**Severity:** HIGH  
**Impact:** Breaks universal block contract  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

**Required Fix:**
```typescript
function UnknownBlockState({ block, type }: { block: TutorialBlock; type: string }) {
  // Extract version safely
  const version = ('version' in block && typeof block.version === 'string')
    ? block.version
    : undefined;

  return (
    <div
      // UBRC metadata attributes - CRITICAL for runtime observation
      data-block-id={block.id}
      data-block-type={type}
      {...(version && { 'data-block-version': version })}
      role="alert"
      className="..."
    >
      <span>⚠️</span>
      <span>Unsupported or unrecognized block type: <code>{type}</code></span>
    </div>
  );
}
```

**Invocation Site Fix Required:**
```typescript
default: {
  const _exhaustiveCheck: never = block;
  return <UnknownBlockState 
    block={block}  // Pass full block, not just type
    type={(_exhaustiveCheck as any)?.type || 'unknown'} 
  />;
}
```

---

### 6.3 Error Fallback

**File:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`  
**Lines:** 119-125

**Error Boundary (try/catch):**
```typescript
catch (err) {
  console.error(`[TutorialBlockRenderer] Failed rendering block ${block.id} (${block.type}):`, err);
  return (
    <div role="alert" className="my-2 p-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900">
      Error rendering block: {block.id}
    </div>
  );
}
```

**CRITICAL FINDING - UBRC CONTRACT VIOLATION:**

**Rendered DOM:**
- ❌ `data-block-id`: **MISSING**
- ❌ `data-block-type`: **MISSING**
- ❌ `data-block-version`: **MISSING**
- ✅ Displays `block.id` in content (but not as metadata attribute)

**Consequence:**
1. Blocks with rendering errors lose UBRC identity
2. ActiveBlockContext cannot observe failed blocks
3. ILS telemetry cannot track failed blocks
4. Learning state lost for blocks that throw errors

**Classification:** **VERIFIED DEFECT**  
**Severity:** HIGH  
**Impact:** Breaks universal block contract for error cases  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

**Required Fix:**
```typescript
catch (err) {
  console.error(`[TutorialBlockRenderer] Failed rendering block ${block.id} (${block.type}):`, err);
  
  // Extract version safely
  const version = ('version' in block && typeof block.version === 'string')
    ? block.version
    : undefined;
  
  return (
    <div 
      // UBRC metadata attributes - preserve identity even on error
      data-block-id={block.id}
      data-block-type={block.type}
      {...(version && { 'data-block-version': version })}
      role="alert" 
      className="..."
    >
      Error rendering block: {block.id}
    </div>
  );
}
```

---

## 7. ActiveBlockContext Discovery Evidence

### 7.1 Block Discovery Selector

**File:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx`  
**Lines:** 340-360

**Discovery Query:**
```typescript
if (container) {
  // Production mode: Query only top-level blocks (direct children of container)
  blocks = container.querySelectorAll(':scope > [data-block-id]');
} else {
  // Test/fallback mode: Query all blocks in document
  blocks = document.querySelectorAll('[data-block-id]');
}
```

**Evidence:**
- ✅ Selector: `[data-block-id]` (attribute-based, not type-specific)
- ✅ Top-level only: `:scope >` ensures direct children (nested blocks excluded)
- ✅ Universal: No block-type filtering in query
- ✅ No hardcoded block types: Discovery via DOM contract only

**Block Identity Extraction:**
```typescript
const extractBlockIdentity = (element: Element): ActiveBlockIdentity | null => {
  const blockId = element.getAttribute('data-block-id');
  const blockType = element.getAttribute('data-block-type');
  
  if (!blockId || !blockType) {
    return null;
  }
  
  const blockVersion = element.getAttribute('data-block-version') || undefined;
  
  return { blockId, blockType, blockVersion };
};
```

**Evidence:**
- ✅ Reads: `data-block-id`, `data-block-type`, `data-block-version`
- ✅ Graceful: Returns `null` if attributes missing (no crash)
- ✅ Optional version: `blockVersion` can be `undefined`
- ✅ No block-type validation: Accepts any type string

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection

**Implication of Defects Found:**
- Unknown blocks (Section 6.2) **WILL NOT BE DISCOVERED** (missing `data-block-id`)
- Error blocks (Section 6.3) **WILL NOT BE DISCOVERED** (missing `data-block-id`)
- ActiveBlockContext discovery is universal IF blocks expose UBRC metadata

---

## 8. ILS Integration Evidence

### 8.1 Block Active Time Recording

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method:** `LearningProgressService.recordBlockActiveTime()`  
**Lines:** 726-874

**Method Signature:**
```typescript
async recordBlockActiveTime(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  eventId: string,
  activeTimeSec: number
): Promise<{...}>
```

**Evidence:**
- ✅ Parameters: `blockId`, `blockVersion` (no `blockType`)
- ✅ No block-type conditionals: Searched pattern `if.*blockType.*===` → **No matches**
- ✅ Universal validation: Same validation for all blocks
- ✅ Universal persistence: Same upsert for all blocks
- ✅ Idempotency: Event ledger prevents duplicate processing
- ✅ Atomicity: Transaction ensures consistency

**Database Operations:**
```typescript
const claimedEvent = await txBlockTelemetryRepo.claimEvent({
  eventId,
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  activeTimeSec,
});

if (claimedEvent) {
  const updatedState = await txBlockStateRepo.upsert({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
    activeTimeSec,
    lastViewedAt: now,
  });
  
  return { state: updatedState, wasProcessed: true, wasAlreadyProcessed: false };
}
```

**Evidence:**
- ✅ Storage: `block_learning_state` table (generic columns)
- ✅ No block-type column: Identity via `(userId, navigationNodeId, blockId, blockVersion)`
- ✅ No type-specific logic: Upsert logic identical for all blocks
- ✅ Event ledger: `block_telemetry_events` table (prevents duplicates)

**Classification:** **VERIFIED COMPLIANT**  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection + grep search (no type conditionals found)

---

## 9. Extension Point Analysis

### 9.1 Adding a New Block Type (e.g., "X1")

**Required Changes Identified:**

#### Change 1: Type System
**File:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`  
**Action:** Add interface for new block type  
**Reason:** TypeScript type definitions

Example:
```typescript
export interface X1Block extends BaseBlock {
  type: 'newtype';
  version: 'X1';
  content: X1AuthorContent;
}
```

#### Change 2: Block Schema
**File:** `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts`  
**Action:** Add Zod schema for new block  
**Reason:** Runtime validation

Example:
```typescript
export const X1BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('newtype'),
  version: z.literal('X1'),
  content: X1AuthorContentSchema,
  presentation: PresentationConfigSchema,
});
```

#### Change 3: Block Union
**File:** `packages/types/src/tutorial-rich-document/blocks/index.ts`  
**Action:** Add new block to `TutorialBlock` union  
**Reason:** Discriminated union type

Example:
```typescript
export type ContentBlockExtended = 
  | HeadingBlock
  | ParagraphBlock
  // ... existing blocks
  | X1Block;  // Add here
```

#### Change 4: Block Schema Union
**File:** `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`  
**Action:** Add new schema to discriminated union  
**Reason:** Zod validation union

Example:
```typescript
export const TutorialBlockSchema = z.lazy(() =>
  z.union([
    HeadingBlockSchema,
    // ... existing schemas
    X1BlockSchema,  // Add here
  ])
);
```

#### Change 5: Canonical Block Builder
**File:** `packages/db-tutorial/src/services/canonical-block-builder.ts`  
**Action:** Add builder function for new block  
**Reason:** Standardized block creation

Example:
```typescript
export function buildCanonicalX1Block(
  authorContent: X1AuthorContent,
  blockId?: string
): X1Block {
  return {
    id: blockId || randomUUID(),
    type: 'newtype',
    version: 'X1',
    content: authorContent,
  };
}
```

#### Change 6: Block Component
**File:** `packages/ui/src/tutorial/blocks/X1Block.tsx` (NEW FILE)  
**Action:** Create React component for new block  
**Reason:** Rendering implementation

Example:
```typescript
export function X1Block({ block, className = '' }: BlockComponentProps<X1Block>) {
  const version = block.version; // 'X1'
  
  return (
    <article
      data-block-id={block.id}
      data-block-type="newtype"
      data-block-version={version}
      className={className}
    >
      {/* Render block content */}
    </article>
  );
}
```

#### Change 7: Renderer Dispatch
**File:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`  
**Action:** Add case to switch statement  
**Reason:** Route new block type to component

Example:
```typescript
import { X1Block } from './blocks/X1Block';

// In switch statement:
case 'newtype':
  return <X1Block block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
```

**CRITICAL OBSERVATION:**
- ❌ Renderer dispatch **IS A REQUIRED CHANGE POINT**
- ❌ NOT automatically extensible without code modification
- ✅ Change is **LOCALIZED** to renderer only
- ✅ NO changes required in:
  - Composer service
  - Repository layer
  - Database schema
  - ILS service
  - ActiveBlockContext
  - ILSProvider
  - BlockTelemetryProvider

**Classification:** **VERIFIED - MINIMAL EXTENSION POINT**  
**Extensibility:** Requires TypeScript/schema/renderer changes, but NOT database/ILS changes  
**Confidence:** HIGH  
**Evidence Type:** Source code architecture analysis

---

## 10. Nested Block Identity Evidence

### 10.1 Container Block Rendering

**File:** `packages/ui/src/tutorial/blocks/TwoColumnBlock.tsx`  
**Lines:** 56-70 (example)

**Nested Rendering Pattern:**
```typescript
const renderBlockItem = (childBlock: TutorialBlock, idx: number, prefix: string) => {
  if (!renderChild) {
    throw new Error('TwoColumnBlock requires renderChild prop for runtime context propagation');
  }
  return (
    <React.Fragment key={childBlock.id || `${prefix}-${idx}`}>
      {renderChild(childBlock, depth + 1)}
    </React.Fragment>
  );
};

return (
  <div
    id={block.id}
    data-block-id={block.id}
    data-block-type="two-column"
    className={`...`}
  >
    <div className={`... ${leftColSpan}`}>
      {leftBlocks.map((childBlock, idx) => renderBlockItem(childBlock, idx, 'left'))}
    </div>
    <div className={`... ${rightColSpan}`}>
      {rightBlocks.map((childBlock, idx) => renderBlockItem(childBlock, idx, 'right'))}
    </div>
  </div>
);
```

**Evidence:**
- ✅ Container root: Has `data-block-id`, `data-block-type`
- ✅ Nested children: Recursively rendered via `renderChild()`
- ✅ Independent identity: Each child has own block ID
- ✅ Depth tracking: `depth + 1` passed to nested renderer
- ✅ No identity collision: Container ID ≠ child IDs

**ActiveBlockContext Observation:**
- Production selector: `:scope > [data-block-id]` (direct children only)
- Container observed: ✅ YES (direct child of content container)
- Nested children observed: ❌ NO (not direct children of content container)

**Intended Behavior:**
- Container blocks are the observable unit
- Nested children are presentation details within container
- ILS tracks container, not individual nested blocks

**Classification:** **VERIFIED COMPLIANT**  
**Design:** Container-level observation is intentional  
**Confidence:** HIGH  
**Evidence Type:** Source code inspection + ActiveBlockContext selector analysis

---

## 11. Test Execution Evidence

### 11.1 Existing Test Inventory

**Composer Tests:**
- `packages/db-tutorial/src/services/__tests__/canonical-transformation.test.ts`
- `packages/db-tutorial/src/services/__tests__/phase-2c-code-c1-canonical-transformation.test.ts`
- `packages/db-tutorial/src/services/__tests__/phase-1h-definition-d1-persistence.integration.test.ts`

**Runtime Tests:**
- `packages/ui/src/tutorial/__tests__/ActiveBlockIntegration.test.tsx`
- `packages/ui/src/tutorial/__tests__/d2-production-verification.test.tsx`

**ILS Tests:**
- `packages/db-tutorial/src/__tests__/d2-idempotent-delivery.integration.test.ts`
- `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`

### 11.2 Test Execution (Deferred)

**Status:** NOT EXECUTED YET  
**Reason:** Audit-first approach - defer test execution until evidence gaps identified  
**Next Phase:** Execute relevant tests only after all source code evidence gathered

**Planned Execution:**
```bash
# UI tests (block rendering, UBRC contract)
pnpm --filter @quiz/ui test

# Composer tests (block assembly, persistence)
pnpm --filter @quiz/db-tutorial test

# Type checking (TypeScript compilation)
pnpm type-check
```

**Classification:** **DEFERRED TO PHASE 2**  
**Note:** Source code evidence sufficient to identify defects; test execution will confirm fixes

---

## 12. Summary of Findings

### 12.1 Verified Compliant

| Area | Evidence | Confidence |
|------|----------|------------|
| Canonical block builders | Source code (randomUUID, stable IDs) | HIGH |
| Document builder | Source code (pass-through, no transformation) | HIGH |
| Composer service | Source code (schema validation, no mutation) | HIGH |
| Repository persistence | Source code (JSONB storage, no pre/post transformation) | HIGH |
| Schema validation | Source code (Zod schemas preserve structure) | HIGH |
| Renderer dispatch mechanism | Source code (centralized switch, type-based routing) | HIGH |
| ActiveBlockContext discovery | Source code (attribute-based selector, universal) | HIGH |
| ILS service | Source code + grep (no block-type conditionals) | HIGH |
| Container block nesting | Source code (independent IDs, correct observation) | HIGH |

### 12.2 Verified Defects

| Defect | Severity | Impact | Evidence | Required Fix |
|--------|----------|--------|----------|--------------|
| `UnknownBlockState` missing UBRC metadata | HIGH | Unknown blocks invisible to runtime | Source line 26-35 | Add `data-block-id/type/version` attributes |
| Error fallback missing UBRC metadata | HIGH | Failed blocks invisible to runtime | Source line 119-125 | Add `data-block-id/type/version` attributes to error div |

### 12.3 Extension Point Requirements

**Adding New Block Type Requires:**
1. Type system update (interface)
2. Schema update (Zod)
3. Block union update (discriminated union)
4. Canonical builder function (standardization)
5. React component (rendering)
6. **Renderer dispatch case** (localized change point)

**Does NOT Require:**
- Database schema changes
- Repository changes
- Composer service changes
- ILS service changes
- ActiveBlockContext changes
- ILSProvider changes

**Assessment:** Extension requires **code changes but NOT architectural changes**. All changes are localized to type system and rendering layer.

---

## 13. Phase 1 Status

**PHASE 1 STATUS:** **COMPLETE**  
**COMPOSER → UBRC STATUS:** **VERIFIED GAP (2 DEFECTS)**  
**IMPLEMENTATION:** **MINIMAL CHANGE REQUIRED**

**Required Gaps:**
1. `UnknownBlockState` fallback must preserve UBRC metadata
2. Error fallback must preserve UBRC metadata

**Optional Hardening:**
- None identified (all other components compliant)

**Documentation Gaps:**
- None identified (architecture matches intent)

**Test Validation:**
- Deferred to Phase 2 (after fixes applied)

**NEXT GATE:** **Phase 2 - Implementation of Required Fixes**

---

**Phase 1 Audit Complete**  
**Date:** September 13, 2026  
**Evidence-Based Conclusion:** Universal integration exists with 2 fallback defects requiring minimal fixes
