# 06G: TutorialDocumentSchema Runtime Validation

**Investigation Type:** T5 - Runtime Schema Validation Boundary  
**Created:** 2026-10-02  
**Evidence Status:** VERIFIED  
**Baseline Documents:** 06A-F

---

## Executive Summary

**Primary Finding:** `TutorialDocumentSchema` is a **real runtime Zod schema** with comprehensive validation for the block-based document model.

**Key Discoveries:**
1. ✅ `BlockProgressRoleSchema` exists: `z.enum(['instructional', 'structural', 'assessment', 'media'])`
2. ✅ `expectedTimeSec` defined in versioned block schemas (D1, I1, C1, S1)
3. ✅ `progressRole` defined in versioned block schemas with `default('instructional')`
4. ✅ Comprehensive test coverage for schema validation

**Critical Architectural Boundary:**
```text
Runtime Document Schema (defines expectedTimeSec + progressRole)
        ≠
Metadata Extraction Path (extracts only expectedTimeSec)
        ≠
Persistence Model (persists only expected_time_sec)
```

This is **NOT a contradiction**—it is a **layer boundary**.

---

## Resolution of 06F Apparent Contradiction

**06F Finding:** "`progressRole` NOT FOUND in metadata extraction path"  
**06G Finding:** "`BlockProgressRoleSchema` EXISTS in runtime schema"

**Resolution:** Both statements are correct. They describe different layers:

| Layer | expectedTimeSec | progressRole | Evidence |
|-------|----------------|--------------|----------|
| **Runtime Schema** | ✅ Defined (optional positive int) | ✅ Defined (enum, default 'instructional') | VERIFIED |
| **Metadata Extraction** | ✅ Extracted from content | ❌ Not extracted | VERIFIED (06F) |
| **Persistence** | ✅ Persisted (`expected_time_sec`) | ❌ Not persisted | VERIFIED (06C) |

**Conclusion:** Runtime schema classification and persistence model serve **different responsibilities**. No correction to 06F needed—its scope was properly bounded to the metadata extraction path.

---

## Investigation Scope

**Searched For:**
- `TutorialDocumentSchema` definition
- `TutorialBlockSchema` structure
- `BlockProgressRoleSchema` definition
- `expectedTimeSec` schema validation
- `progressRole` schema validation
- Validation test coverage
- Runtime validation invocation points

**Evidence State:** VERIFIED

---

## 1. TutorialDocumentSchema Definition

### Location

**File:** `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`

### Implementation

```typescript
import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, MAX_BLOCKS_PER_DOCUMENT } from '../constants';
import { TutorialBlockSchema } from './blocks.schema';

const TutorialDocumentMetadataSchema = z.object({
  estimatedReadTime: z.number().int().positive().optional(),
  learningObjectives: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  prerequisites: z.array(z.string().min(1)).optional(),
  complexityScore: z.number().int().min(1).max(10).optional(),
  isInteractive: z.boolean().optional(),
  audience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  custom: z.record(z.unknown()).optional(),
}).optional();

export const TutorialDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  blocks: z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT),
  metadata: TutorialDocumentMetadataSchema,
});
```

**Evidence State:** VERIFIED

---

### Validated Fields

| Field | Schema | Required | Evidence |
|-------|--------|----------|----------|
| `schemaVersion` | `z.literal(CURRENT_SCHEMA_VERSION)` | YES | VERIFIED |
| `blocks` | `z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT)` | YES | VERIFIED |
| `metadata` | Document-level metadata object | NO (optional) | VERIFIED |

**Evidence State:** VERIFIED

---

## 2. TutorialBlockSchema Structure

### Location

**File:** `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`

### Implementation

```typescript
export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // Content blocks
    HeadingBlockSchema,
    ParagraphBlockSchema,
    ListBlockSchema,
    TableBlockSchema,
    ImageBlockSchema,
    CalloutBlockSchema,
    DefinitionBlockSchema,      // D1
    IntroductionI1BlockSchema,  // I1
    ExampleBlockSchema,
    QuoteBlockSchema,
    SummaryBlockSchema,
    DiagramBlockSchema,
    ComparisonBlockSchema,
    
    // Code blocks (legacy + versioned)
    CodeBlockUnionSchema,       // Legacy + C1
    
    // Container blocks (recursive)
    TwoColumnBlockSchema,
    ThreeColumnBlockSchema,
    CardGridBlockSchema,
    TimelineBlockSchema,
  ])
);
```

**Architecture:** Recursive discriminated union with `z.lazy()` for container nesting support.

**Evidence State:** VERIFIED

---

## 3. BlockProgressRoleSchema

### Location

**File:** `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts`

### Implementation

```typescript
export const BlockProgressRoleSchema = z.enum([
  'instructional',
  'structural',
  'assessment',
  'media'
]);
```

**Allowed Values:**
- `instructional` — Educational content blocks requiring learner engagement
- `structural` — Layout/organizational blocks (headings, containers)
- `assessment` — Quiz/exam blocks (future use)
- `media` — Standalone media blocks (images, diagrams)

**Evidence State:** VERIFIED

---

## 4. Versioned Block Schema Pattern

### Definition D1 Block

**File:** `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts`

```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media'])
    .default('instructional')
    .optional(),
});
```

**Evidence State:** VERIFIED

---

### Introduction I1 Block

**File:** `packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema.ts`

```typescript
export const IntroductionI1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('introduction'),
  version: z.literal('I1'),
  content: IntroductionI1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media'])
    .default('instructional')
    .optional(),
});
```

**Evidence State:** VERIFIED

---

### Code C1 Block

**File:** `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`

```typescript
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media'])
    .default('instructional')
    .optional(),
});
```

**Evidence State:** VERIFIED

---

### Summary S1 Block

**File:** `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts`

```typescript
export const SummaryS1BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('summary'),
  version: z.literal('S1'),
  content: SummaryS1AuthorContentSchema,
  presentation: PresentationConfigSchema.optional(),
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: BlockProgressRoleSchema.default('instructional').optional(),
}).strict();
```

**Evidence State:** VERIFIED

---

## 5. Schema Field Constraints

### expectedTimeSec

**Schema:** `z.number().int().positive().optional()`

**Constraints:**
- Type: Integer
- Range: Positive (> 0)
- Required: NO (optional field)
- Rejection: Zero, negative, decimal values rejected

**Test Coverage:**
- ✅ Valid positive integer accepted
- ✅ Missing value accepted (optional)
- ✅ Zero rejected
- ✅ Negative rejected
- ✅ Decimal rejected

**Evidence State:** VERIFIED (schema + tests)

---

### progressRole

**Schema:** `z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional()`

**Constraints:**
- Type: Enum
- Allowed: `instructional`, `structural`, `assessment`, `media`
- Default: `instructional`
- Required: NO (optional field with default)

**Behavior:**
- Present and valid → use supplied value
- Present and invalid → schema validation fails
- Absent → defaults to `'instructional'`

**Evidence State:** VERIFIED (schema definition)

---

## 6. Schema vs Persistence Model

### Runtime Schema Fields (TutorialBlock)

```typescript
{
  id: string (UUID),
  type: string,
  version?: string,
  content: { ... },
  presentation: { ... },
  expectedTimeSec?: number,      // ← Runtime schema field
  progressRole?: BlockProgressRole, // ← Runtime schema field
}
```

**Evidence State:** VERIFIED

---

### Persistence Model Fields (block_learning_state)

```sql
CREATE TABLE block_learning_state (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  block_version TEXT NOT NULL,
  visit_count INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  active_time_sec INTEGER DEFAULT 0,
  expected_time_sec INTEGER,     -- ← Persisted
  last_session_id TEXT,
  first_viewed_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  -- NO progressRole column
);
```

**Evidence State:** VERIFIED

---

### Field Mapping

| Runtime Schema Field | Extracted (06F) | Persisted (06C) | Evidence |
|---------------------|-----------------|----------------|----------|
| `id` | ❌ | ✅ (block_id) | VERIFIED |
| `type` | ❌ | ❌ | VERIFIED |
| `version` | ❌ | ✅ (block_version) | VERIFIED |
| `expectedTimeSec` | ✅ | ✅ (expected_time_sec) | VERIFIED |
| `progressRole` | ❌ | ❌ | VERIFIED |

**Architectural Boundary:** Runtime schema defines fields; metadata extraction selectively extracts; persistence model stores subset.

**Evidence State:** VERIFIED

---

## 7. progressRole Semantics

### Default Behavior

**Schema Definition:**
```typescript
progressRole: z.enum([...]).default('instructional').optional()
```

**Semantic:**
- When author omits `progressRole` → defaults to `'instructional'`
- When author supplies invalid value → validation fails
- When author supplies valid value → stored in runtime document

**Evidence State:** VERIFIED

---

### Classification Intent

**Important Qualification:** The schema defines `progressRole` as an **explicit classification mechanism**, distinct from `expectedTimeSec`:

- `progressRole` → **What role the block serves** (instructional, structural, assessment, media)
- `expectedTimeSec` → **Authored expected duration** (independent of role)
- `activeTimeSec` → **Observed learner engagement** (telemetry)

**These are conceptually distinct fields serving different purposes.**

**Evidence State:** VERIFIED (field definitions), INFERRED (semantic interpretation)

---

## 8. Test Coverage

### expectedTimeSec Validation Tests

**Files:**
- `packages/types/src/tutorial-rich-document/__tests__/definition-d1.test.ts`
- `packages/types/src/tutorial-rich-document/__tests__/code-c1.test.ts`
- `packages/types/src/tutorial-rich-document/__tests__/introduction-i1.schema.test.ts`
- `packages/types/src/tutorial-rich-document/__tests__/expectedTimeSec-flow.test.ts`

**Test Cases (D1):**
```typescript
it('accepts valid expectedTimeSec', () => {
  const block = { ...validBlock, expectedTimeSec: 180 };
  expect(() => DefinitionD1BlockSchema.parse(block)).not.toThrow();
});

it('accepts missing expectedTimeSec (optional)', () => {
  expect(() => DefinitionD1BlockSchema.parse(validBlock)).not.toThrow();
});

it('rejects zero expectedTimeSec', () => {
  const block = { ...validBlock, expectedTimeSec: 0 };
  expect(() => DefinitionD1BlockSchema.parse(block)).toThrow(ZodError);
});

it('rejects negative expectedTimeSec', () => {
  const block = { ...validBlock, expectedTimeSec: -10 };
  expect(() => DefinitionD1BlockSchema.parse(block)).toThrow(ZodError);
});

it('rejects decimal expectedTimeSec', () => {
  const block = { ...validBlock, expectedTimeSec: 180.5 };
  expect(() => DefinitionD1BlockSchema.parse(block)).toThrow(ZodError);
});
```

**Coverage:** Valid, missing, zero, negative, decimal cases tested for D1, C1, I1

**Evidence State:** VERIFIED

---

### Phase 4.5 Flow Tests

**File:** `packages/types/src/tutorial-rich-document/__tests__/expectedTimeSec-flow.test.ts`

**Test Coverage:**
- ✅ `expectedTimeSec` at block root level (not in content.page)
- ✅ TypeScript inference (`number | undefined`)
- ✅ Optional field behavior
- ✅ D1, C1 block flow

**Evidence State:** VERIFIED

---

## 9. Runtime Validation Invocation

### Where is safeParse() Called?

**Status:** NOT YET VERIFIED in this investigation

**Deferred:** Actual production invocation points for `TutorialDocumentSchema.safeParse()` or `.parse()` not traced in T5.

**Recommended Follow-Up:** Trace where schema validation occurs in learner rendering path (likely in `sanitizeDocument()` or content delivery layer).

**Evidence State:** SCHEMA VERIFIED, INVOCATION NOT YET VERIFIED

---

## 10. Schema vs TypeScript Types

### TypeScript Interface (document.ts)

```typescript
export interface TutorialDocument {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  blocks: TutorialBlock[];
  metadata?: TutorialDocumentMetadata;
}
```

**Evidence State:** VERIFIED

---

### Zod Schema (document.schema.ts)

```typescript
export const TutorialDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  blocks: z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT),
  metadata: TutorialDocumentMetadataSchema,
});
```

**Evidence State:** VERIFIED

---

### Relationship

**Pattern:** TypeScript types define compile-time structure; Zod schemas provide runtime validation.

**Alignment:** Schema structure matches TypeScript interface.

**Evidence State:** VERIFIED

---

## 11. Unknown Field Behavior

### Schema Strictness

**Versioned Blocks (D1, I1, C1):**
- Top-level block: **NOT strict** (allows `presentation`, `expectedTimeSec`, `progressRole`)
- `content.page`: **Strict** (`.strict()` applied to author content schema)

**Evidence:**
```typescript
// D1 Block - no .strict() at top level
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum([...]).default('instructional').optional(),
}); // ← No .strict()

// Author content - strict
export const DefinitionD1AuthorContentSchema = z.object({
  page: DefinitionD1PageSchema,
}).strict(); // ← Rejects unknown fields
```

**Behavior:**
- Unknown fields at block root → **Silently stripped** (Zod default behavior without `.strict()`)
- Unknown fields in `content.page` → **Validation fails** (`.strict()` enforced)

**Evidence State:** VERIFIED

---

## 12. Nested/Container Validation

### Recursive Schema Support

```typescript
export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // ... content blocks ...
    TwoColumnBlockSchema,
    ThreeColumnBlockSchema,
    CardGridBlockSchema,
    TimelineBlockSchema,
  ])
);
```

**Container Block Example (TwoColumnBlock):**
```typescript
export const TwoColumnBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('twoColumn'),
  content: z.object({
    leftColumn: z.object({
      children: z.lazy(() => z.array(TutorialBlockSchema)), // ← Recursive
    }),
    rightColumn: z.object({
      children: z.lazy(() => z.array(TutorialBlockSchema)), // ← Recursive
    }),
  }),
  presentation: ContainerPresentationConfigSchema,
});
```

**Recursion Mechanism:** `z.lazy()` defers schema resolution for recursive structures.

**Evidence State:** VERIFIED

---

## 13. Version Validation

### Block Version Constraints

**Versioned Blocks:**
```typescript
version: z.literal('D1')  // DefinitionD1Block
version: z.literal('I1')  // IntroductionI1Block
version: z.literal('C1')  // CodeC1Block
version: z.literal('S1')  // SummaryS1Block
```

**Behavior:** Schema enforces exact version literal. Invalid versions rejected.

**Evidence State:** VERIFIED

---

### schemaVersion Constraint

```typescript
schemaVersion: z.literal(CURRENT_SCHEMA_VERSION)
```

**Behavior:** Document must use current schema version literal. Future schema evolution requires version migration.

**Evidence State:** VERIFIED

---

## 14. Validation Failure Behavior

### Zod Error Structure

**When validation fails:**
```typescript
try {
  TutorialDocumentSchema.parse(untrustedData);
} catch (error) {
  // error is ZodError with structured issues[]
}
```

**safeParse Alternative:**
```typescript
const result = TutorialDocumentSchema.safeParse(untrustedData);
if (!result.success) {
  // result.error contains ZodError
}
```

**Production Usage:** NOT YET VERIFIED (invocation points deferred to sanitizeDocument investigation)

**Evidence State:** SCHEMA BEHAVIOR VERIFIED, PRODUCTION USAGE NOT YET VERIFIED

---

## 15. Contradictions with Frozen Corpus

**Stage 1-4 Frozen Corpus:**
- Defines educational block families (I1-I6, D1-D7, C1-C10, etc.)
- Establishes semantic contracts for educational content

**Production Schema:**
- Implements D1, I1, C1, S1 (partial) with Zod validation
- Includes `expectedTimeSec` and `progressRole` fields
- Uses version literals for exact matching

**Divergence:** NONE  
Schema implementation aligns with frozen corpus architecture. Unimplemented versions (I2-I6, D2-D7, C2-C10) are expected—frozen corpus defines **what can eventually exist**, not what must be implemented now.

**Evidence State:** VERIFIED (no contradiction)

---

## 16. Summary of Findings

| Finding | Evidence State |
|---------|---------------|
| `TutorialDocumentSchema` exists | VERIFIED |
| `TutorialBlockSchema` recursive union | VERIFIED |
| `BlockProgressRoleSchema` exists | VERIFIED |
| Allowed roles: instructional, structural, assessment, media | VERIFIED |
| `expectedTimeSec` in D1, I1, C1, S1 schemas | VERIFIED |
| `expectedTimeSec` constraint: optional positive integer | VERIFIED |
| `progressRole` in D1, I1, C1, S1 schemas | VERIFIED |
| `progressRole` default: `'instructional'` | VERIFIED |
| Schema test coverage for `expectedTimeSec` | VERIFIED |
| Runtime schema vs persistence model distinction | VERIFIED |
| `progressRole` NOT persisted in `block_learning_state` | VERIFIED |
| `progressRole` NOT extracted during `recordBlockVisit()` | VERIFIED (06F) |
| Runtime validation invocation points | NOT YET VERIFIED |
| Production `safeParse()` usage | NOT YET VERIFIED |

---

## 17. Architectural Boundaries Established

### Layer 1: Runtime Document Schema

**Responsibility:** Define and validate TutorialDocument structure

**Fields:**
- `id`, `type`, `version`, `content`, `presentation`
- `expectedTimeSec` (optional positive integer)
- `progressRole` (enum with default `'instructional'`)

**Evidence State:** VERIFIED

---

### Layer 2: Metadata Extraction (06F)

**Responsibility:** Extract selective metadata during block visit recording

**Extracted:**
- `expectedTimeSec` (from canonical content)

**NOT Extracted:**
- `progressRole`
- `type`
- `presentation`

**Evidence State:** VERIFIED (06F)

---

### Layer 3: Persistence Model (06C)

**Responsibility:** Store learner telemetry and selective metadata

**Persisted:**
- Block identity (`block_id`, `block_version`)
- Telemetry (`visit_count`, `active_time_sec`)
- Extracted metadata (`expected_time_sec`)

**NOT Persisted:**
- `progressRole`
- `type`
- `content`
- `presentation`

**Evidence State:** VERIFIED (06C)

---

## 18. Key Clarifications

### 1. progressRole is Defined, Not Extracted

**Schema Layer:** `progressRole` exists in D1, I1, C1, S1 schemas  
**Extraction Layer:** `recordBlockVisit()` does NOT extract `progressRole`  
**Persistence Layer:** `block_learning_state` does NOT store `progressRole`

**Conclusion:** `progressRole` is a **runtime classification field** available in the canonical TutorialDocument, not part of the metadata extraction/persistence chain.

**Evidence State:** VERIFIED

---

### 2. expectedTimeSec vs progressRole are Distinct

**expectedTimeSec:**
- Authored expected duration
- Extracted during visit
- Persisted in `block_learning_state`
- Used by completion orchestrator (06A)

**progressRole:**
- Block classification (instructional/structural/assessment/media)
- NOT extracted during visit
- NOT persisted
- Available in runtime document for client-side classification

**Conclusion:** These fields serve **different purposes** and follow **different data flows**.

**Evidence State:** VERIFIED

---

### 3. Canonical Document Remains Authoritative

**Finding:** All block metadata originates from `TutorialDocument.content.blocks[]`

**Implication:**
- Runtime schema validates structure
- Metadata extraction selectively persists fields
- Canonical content is source of truth for `expectedTimeSec`, `progressRole`, `type`, `content`, `presentation`

**Evidence State:** VERIFIED

---

## 19. Remaining Questions (Deferred)

| Question | Status | Recommended Investigation |
|----------|--------|--------------------------|
| Where is `TutorialDocumentSchema.safeParse()` invoked? | NOT YET VERIFIED | Trace in content delivery/sanitization layer |
| Does `sanitizeDocument()` use schema validation? | NOT YET VERIFIED | Investigate 06H |
| Are all block types covered by schema? | PARTIAL | Cross-reference with 02_COMPONENT_AND_VERSION_AUDIT |
| What happens to invalid documents in production? | NOT YET VERIFIED | Trace error handling in delivery path |
| Is `progressRole` used by client-side runtime? | NOT YET VERIFIED | Investigate runtime providers/orchestrator |

---

## 20. Next Steps for Stage 5

This investigation establishes the **runtime schema validation boundary**:

✅ **Runtime schema: defines expectedTimeSec + progressRole**  
✅ **Metadata extraction: extracts only expectedTimeSec**  
✅ **Persistence: stores only expected_time_sec**  
✅ **06F/06G apparent contradiction: resolved (layer boundary)**

**Remaining investigations:**
1. sanitizeDocument() logic (06H) — **should reveal where schema validation is invoked**
2. LearningProgressSidebar metric calculations (06I)
3. Composer integration (07)
4. Testing/certification (08)

---

**Document Status:** COMPLETE  
**T5 Investigation:** COMPLETE  
**Evidence State:** VERIFIED (schema definitions + tests), PARTIAL (production invocation deferred to 06H)
