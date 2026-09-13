# Phase 4.1 Pre-Flight Report - Part 1: Source Inspection

**Date:** 2026-09-05  
**Phase:** ILS Phase 4.1 - Schema + Migration  
**Mode:** Pre-Implementation Verification  
**Status:** Inspection Complete - No Modifications Made

---

## Executive Summary

**Purpose:** Verify actual repository structure before implementing Phase 4.1 schema changes.

**Approach:** Controlled inspection sequence per Phase 4.1 protocol (inspect → verify → decide → implement).

**Result:** All source locations verified. Ready to proceed to implementation decision and minimal change plan.

---

## STEP 1: TutorialDocument Location

### TypeScript Interface

**Location:** `packages/types/src/tutorial-rich-document/document.ts`

```typescript
export interface TutorialDocument {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  blocks: TutorialBlock[];
  metadata?: TutorialDocumentMetadata;
}
```

**Key Facts:**
- ✅ Stored in `tutorial_sections.content` (JSONB column)
- ✅ `blocks` array uses `TutorialBlock` union type
- ✅ Metadata is optional document-level structure
- ✅ `schemaVersion` uses constant (not hardcoded literal)

---

### Zod Schema

**Location:** `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`

```typescript
export const TutorialDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  blocks: z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT),
  metadata: TutorialDocumentMetadataSchema,
});
```

**Key Facts:**
- ✅ Uses `TutorialBlockSchema` discriminated union
- ✅ Max blocks constraint exists (`MAX_BLOCKS_PER_DOCUMENT`)
- ✅ Metadata validation is separate schema
- ✅ Self-contained (no schema inheritance)

---

### Block Array Structure

**How blocks are represented:**
- Array of discriminated union (`TutorialBlock`)
- Each block has `type` discriminator
- Versioned blocks include `version` field
- Union defined in `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`

**Verified:** D1 and C1 are direct members of the union.

---

## STEP 2: BaseBlock Inspection

### Location

**File:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`

```typescript
/**
 * Base structure for all blocks
 */
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}
```

---

### All Extending Interfaces

**Instructional Blocks:**
- ✅ `DefinitionD1Block extends BaseBlock`
- ✅ `CodeC1Block extends BaseBlock`

**Structural/Presentational Blocks:**
- ✅ `HeadingBlock extends BaseBlock`
- ✅ `ParagraphBlock extends BaseBlock`
- ✅ `ListBlock extends BaseBlock`
- ✅ `CodeBlock extends BaseBlock` (legacy, unversioned)
- ✅ `TableBlock extends BaseBlock`
- ✅ `ImageBlock extends BaseBlock`
- ✅ `CalloutBlock extends BaseBlock`
- ✅ `ExampleBlock extends BaseBlock`
- ✅ `QuoteBlock extends BaseBlock`
- ✅ `SummaryBlock extends BaseBlock`

**Container Blocks:** (verified from schemas)
- ✅ `TwoColumnBlock extends BaseBlock`
- ✅ `ThreeColumnBlock extends BaseBlock`
- ✅ `CardGridBlock extends BaseBlock`
- ✅ `TimelineBlock extends BaseBlock`

---

### Code Usage Analysis

**Finding:** No code was found that assumes all `BaseBlock` instances are instructional/learning-bearing.

**Renderer Pattern:**
- Each block type has specific renderer component
- Renderers receive typed props (not generic `BaseBlock`)
- DOM attributes set per block type
- No universal "learning block" assumption in rendering

**Type Safety:**
- Discriminated union prevents treating all blocks identically
- Type guards check specific block types
- No polymorphic "treat any BaseBlock as instructional" code found

---

### TypeScript Placement Decision Factors

**Option A: Add `expectedTimeSec?: number` to BaseBlock**

**Pros:**
- ✅ Single location for TypeScript definition
- ✅ All instructional blocks inherit automatically
- ✅ Minimal duplication
- ✅ Future instructional blocks get field automatically

**Cons:**
- ⚠️ Structural blocks also inherit the field
- ⚠️ Semantic implication that all blocks could have learning time
- ⚠️ Type system allows meaningless `TwoColumnBlock.expectedTimeSec`

**Mitigation:**
- Field is optional (`?`)
- Semantic meaning enforced at Zod schema level (not TypeScript)
- Documentation clarifies instructional-only intent

---

**Option B: Explicit per-interface definition**

**Pros:**
- ✅ Clear semantic distinction
- ✅ No field on structural blocks
- ✅ Explicit is better than implicit

**Cons:**
- ⚠️ Must duplicate for each instructional block (D1, C1, S1, I1, O1)
- ⚠️ More maintenance overhead
- ⚠️ Potential inconsistency across blocks

---

**RECOMMENDATION: Option A (BaseBlock extension)**

**Rationale:**
1. No code treats all BaseBlock instances identically
2. Optional field doesn't force semantic meaning
3. Zod schemas provide runtime enforcement
4. Minimal change principle
5. Future S1/I1/O1 get field automatically
6. Type system ergonomics (DRY)

**Critical Safeguard:** Zod schemas explicitly control which blocks accept the field at runtime.

---

## STEP 3: D1 (Definition) Block Inspection

### TypeScript Interface

**Location:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`

```typescript
export interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1AuthorContent;
}

export interface DefinitionD1AuthorContent {
  page: DefinitionD1Page;
}

export interface DefinitionD1Page {
  type: 'definition';
  category: string;
  title: string;
  intro: string;
  definition: string;
  explanation: string[];
  example: {
    language: string;
    code: string;
  };
  characteristics: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  takeaway: string;
}
```

---

### Zod Schema

**Location:** `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts`

**Page Schema:**
```typescript
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

**Author Content Schema:**
```typescript
export const DefinitionD1AuthorContentSchema = z.object({
  page: DefinitionD1PageSchema,
}).strict();
```

**Block Schema:**
```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
});
```

---

### Key Facts

**Structure:**
- ✅ Block envelope: `{ id, type, version, content }`
- ✅ Content wraps page: `{ page: {...} }`
- ✅ Page contains instructional content
- ✅ Version field: `'D1'` (literal)
- ✅ Type field: `'definition'` (literal)
- ✅ ID field: UUID string

**Validation:**
- ✅ Strict mode (no unknown fields)
- ✅ String length constraints
- ✅ Required fields enforced
- ✅ Nested object validation

**Current Fields at Block Level:**
- `id` (from BaseBlock)
- `presentation` (optional, from BaseBlock)
- `type`
- `version`
- `content`

**Field Location for expectedTimeSec:**
- ✅ Block envelope level (next to `id`, `type`, `version`)
- ❌ NOT inside `content.page`

---

### Test Coverage

**Location:** `packages/types/src/tutorial-rich-document/__tests__/definition-d1.test.ts`

**Existing Tests:**
- ✅ Valid D1 page validation
- ✅ Valid D1 author content validation
- ✅ Valid D1 canonical block validation
- ✅ Version field enforcement (`'D1'` literal)
- ✅ Type field enforcement (`'definition'` literal)
- ✅ UUID validation for `id`
- ✅ Strict mode enforcement (rejects unknown fields)

**Test Pattern:**
```typescript
expect(() => DefinitionD1BlockSchema.parse(validBlock)).not.toThrow();
expect(() => DefinitionD1BlockSchema.parse(invalidBlock)).toThrow(ZodError);
```

---

## STEP 4: C1 (Code) Block Inspection

### TypeScript Interface

**Location:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`

```typescript
export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
  content: CodeC1AuthorContent;
}

export interface CodeC1AuthorContent {
  page: CodeC1Page;
}

export interface CodeC1Page {
  type: 'code';
  title: string;
  introduction: string;
  language: string;
  code: string;
  filename?: string;
  explanation: Array<{
    focus: string;
    description: string;
  }>;
  output?: {
    value: string;
    description?: string;
  };
  takeaway: string;
  practiceHint?: string;
  memoryModel?: CodeC1MemoryModel;
}
```

---

### Zod Schema

**Location:** `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`

**Canonical Page Schema:**
```typescript
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

**Block Schema:**
```typescript
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
});
```

---

### Key Facts

**Structure:** (Same pattern as D1)
- ✅ Block envelope: `{ id, type, version, content }`
- ✅ Content wraps page: `{ page: {...} }`
- ✅ Version field: `'C1'` (literal)
- ✅ Type field: `'code'` (literal)

**Validation:**
- ✅ Strict mode on canonical page
- ⚠️ **PERMISSIVE:** No min/max string length constraints (intentional for lossless conversion)
- ✅ Required fields enforced
- ✅ Optional fields supported

**Current Fields at Block Level:**
- `id` (from BaseBlock)
- `presentation` (optional, from BaseBlock)
- `type`
- `version`
- `content`

**Field Location for expectedTimeSec:**
- ✅ Block envelope level (next to `id`, `type`, `version`)
- ❌ NOT inside `content.page`

---

### Test Coverage

**Location:** `packages/types/src/tutorial-rich-document/__tests__/code-c1.test.ts`

**Extensive Test Suite:**
- ✅ Canonical page validation (permissive contract)
- ✅ Structural validation (required fields)
- ✅ Version field enforcement
- ✅ Type field enforcement
- ✅ UUID validation
- ✅ Historical payload validation
- ✅ Conversion validation
- ✅ Block schema validation

**Test Pattern:** Same as D1 (parse/throw checks)

---

## Summary: D1 & C1 Schema Structure

### Consistent Pattern Verified

**Block Envelope (Common to Both):**
```typescript
{
  id: string (UUID),
  type: 'definition' | 'code',
  version: 'D1' | 'C1',
  presentation?: PresentationConfig,  // Optional, from BaseBlock
  content: {
    page: {
      // Instructional content
    }
  }
}
```

**Where expectedTimeSec Belongs:**
```typescript
{
  id: "...",
  type: "...",
  version: "...",
  expectedTimeSec: 180,  // ✅ HERE (block envelope level)
  content: {
    page: {
      // NOT here
    }
  }
}
```

**This matches the frozen architectural decision.**

---

## STEP 5: C1 Conversion Boundary Inspection

### Conversion Function Location

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/code/C1/codeC1.converter.ts`

**Function:** `toCanonicalCodeC1(payload: unknown): CanonicalCodeC1Result`

---

### Conversion Flow

```typescript
export function toCanonicalCodeC1(payload: unknown): CanonicalCodeC1Result {
  // 1. Check if already canonical
  const canonicalCheck = CodeC1AuthorContentSchema.safeParse(payload);
  if (canonicalCheck.success) {
    return { content: canonicalCheck.data };  // ✅ Already canonical
  }

  // 2. Try historical format
  const historicalCheck = HistoricalTutorialCodePayloadSchema.safeParse(payload);
  if (!historicalCheck.success) {
    throw new Error('Validation failed');
  }

  // 3. Transform historical → canonical
  const legacy = historicalCheck.data;
  const canonical: CodeC1AuthorContent = {
    page: {
      type: 'code' as const,
      title: legacy.page.title,
      introduction: legacy.page.introduction,
      language: legacy.code.language.toLowerCase(),
      code: legacy.code.source,
      filename: undefined,
      explanation: legacy.explanation?.steps.map(...) ?? [],
      output: legacy.output ? { ... } : undefined,
      takeaway: legacy.takeaway?.items.join('\n\n') ?? '',
      practiceHint: legacy.tip?.text,
      memoryModel: legacy.memoryModel,  // ✅ PRESERVED
    },
  };

  // 4. Validate constructed canonical
  const finalValidation = CodeC1AuthorContentSchema.safeParse(canonical);
  if (!finalValidation.success) {
    throw new Error('Canonical validation failed');
  }

  return { content: finalValidation.data };
}
```

---

### Key Preservation Patterns

**What IS Currently Preserved:**
- ✅ `memoryModel` - Explicitly preserved from historical format
- ✅ All educational content (title, introduction, code, explanation, takeaway)
- ✅ Optional fields (practiceHint, output)

**Current Behavior:**
- Schema validation happens at content level (`{ page: {...} }`)
- Block envelope fields (`id`, `type`, `version`) not part of conversion
- Conversion operates on content structure only

---

### expectedTimeSec Preservation Analysis

**Current State:**
- Conversion function operates on `content` level
- Block envelope fields handled elsewhere
- `expectedTimeSec` would be block envelope field (not inside content)

**Impact:**
- ✅ Conversion function **does NOT need modification**
- ✅ Block envelope preservation handled by different layer
- ✅ Schema validation allows unknown fields at envelope level (if using `.passthrough()`)
- ⚠️ **MUST VERIFY:** Block-level schema uses `.strict()` or `.passthrough()`

**Current Block Schema:**
```typescript
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  // ❌ No .strict() or .passthrough() specified
});
```

**Default Zod Behavior:** `.strip()` (removes unknown keys)

**⚠️ CRITICAL FINDING:** Current schema would STRIP `expectedTimeSec` if added to block envelope.

**Required Change:** Must add `.passthrough()` or explicitly add `expectedTimeSec` field to schema.

---

### Conversion Usage Location

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts`

```typescript
const result = toCanonicalCodeC1(instance.payload);
```

**Usage Context:**
- Document transformation/normalization
- Converts legacy payloads to canonical format
- Used during Composer operations

---

## Next Steps

Continue to Part 2 for database conventions, migration patterns, and soft-delete analysis.

---

**Status:** Part 1 Complete - Source Structure Verified  
**Next:** Part 2 - Database Conventions & Migration Analysis
