# Objective O1 Block - Authoritative Contract

**Status:** APPROVED  
**Version:** O1  
**Date:** 2025-01-28  
**Purpose:** Single source of truth for Objective O1 block implementation, validation, and integration

---

## 1. Executive Summary

This document establishes the authoritative contract for the **Objective O1** block type. All implementation agents must follow this contract exactly. The contract reconciles six source artifacts:

1. **ObjectiveO1Block.tsx** - React component (runtime consumer)
2. **objective-o1.schema.json** - JSON Schema (AI validation)
3. **objective-o1.schema.ts** - TypeScript/Zod schema (CANDIDATE - needs implementation)
4. **ObjectiveO1Block.test.tsx** - Unit tests
5. **block.integration.json** - Metadata and default payload
6. **Canonical patterns** - Code C1, Introduction I1, Definition D1 schemas

**Critical Finding:** The candidate `objective-o1.schema.ts` file contains only a TypeScript interface (`ObjectiveO1BlockContract`), NOT a Zod runtime schema. This violates the canonical pattern and will cause runtime validation failures.

---

## 2. Canonical Block Envelope Contract

All versioned blocks follow this envelope structure. The Objective O1 block MUST conform exactly:

```typescript
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});
```

### 2.1 Envelope Fields

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | string | Yes | UUID v4 format | Unique block identifier |
| `type` | string | Yes | Literal `'objective'` | Block type discriminator |
| `version` | string | Yes | Literal `'O1'` | Version discriminator for union dispatch |
| `content` | object | Yes | See Section 3 | Nested content payload |
| `presentation` | object | No | PresentationConfigSchema | Layout and styling hints |
| `expectedTimeSec` | number | No | Positive integer | Estimated completion time |
| `progressRole` | enum | No | Default: `'instructional'` | Learning progression category |

### 2.2 Envelope Pattern Rules

1. **Individual schema definition** - Do NOT use `BaseBlock.extend()` pattern
2. **No top-level `.strict()`** - Allow optional envelope fields like `presentation`, `expectedTimeSec`
3. **UUID validation** - Use `z.string().uuid()` for `id` field
4. **Literal discriminators** - Use `z.literal()` for `type` and `version` to enable union discrimination
5. **Content nesting** - Always wrap content in `content: { page: {...} }` structure

---

## 3. Canonical Content Payload Contract

The content structure is based on reconciliation of the component interface, default payload, and canonical patterns.

### 3.1 Content Structure

```typescript
export const ObjectiveO1PageSchema = z.object({
  eyebrow: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  titleHighlight: z.string().min(1).max(100).optional(),
  introduction: z.string().min(1).max(1000).optional(),
  subtitle: z.string().min(1).max(500).optional(),
  objectives: z.array(ObjectiveO1ItemSchema).min(1).max(20),
  note: z.union([
    z.string().min(1).max(1000),
    ObjectiveO1NoteSchema,
  ]).optional(),
}).strict();

export const ObjectiveO1ItemSchema = z.object({
  id: z.string().min(1).max(50),
  verb: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  text: z.string().min(1).max(500),
  description: z.string().min(1).max(1000).optional(),
  badge: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
}).passthrough(); // Allow additional fields per component expectation

export const ObjectiveO1NoteSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  text: z.string().min(1).max(1000),
}).strict();

export const ObjectiveO1AuthorContentSchema = z.object({
  page: ObjectiveO1PageSchema,
}).strict();
```

### 3.2 Page-Level Fields

| Field | Type | Required | Default | Component Usage |
|-------|------|----------|---------|----------------|
| `eyebrow` | string | No | `"LEARNING OBJECTIVES"` | Header badge text |
| `title` | string | Yes | — | Main heading |
| `titleHighlight` | string | No | Auto-detect `"Will Develop"` | Underlined portion of title |
| `introduction` | string | No | `"By the end of this lesson..."` | Introductory paragraph |
| `subtitle` | string | No | — | Secondary heading (unused in current component) |
| `objectives` | array | Yes | — | List of learning objectives |
| `note` | string or object | No | Default text | Bottom callout box |

### 3.3 Objective Item Fields

Each item in the `objectives` array:

| Field | Type | Required | Component Usage |
|-------|------|----------|----------------|
| `id` | string | Yes | React key, must be unique |
| `text` | string | Yes | Primary content, used as fallback for title |
| `verb` | string | No | Explicit action verb (extracted from title if absent) |
| `title` | string | No | Full objective heading (preferred over `text`) |
| `description` | string | No | Secondary explanatory text |
| `badge` | string | No | Category pill text (defaults to pattern) |
| `category` | string | No | Alternative to `badge` |
| `icon` | string | No | Icon key: `create`, `access`, `extract`, `modify`, `use`, `explain` |

**Additional properties:** The component interface uses `[key: string]: unknown`, so `.passthrough()` allows extensibility.

### 3.4 Note Field

Accepts two formats:

1. **String:** Plain text displayed in callout box
2. **Object:** 
   - `title` (optional): Callout heading
   - `text` (required): Callout body

---

## 4. Required Zod Schema Export Signature

The runtime schema file MUST export a Zod schema, NOT a TypeScript interface.

### 4.1 File Location

```
packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts
```

### 4.2 Required Exports

```typescript
/**
 * Objective O1 - Zod Validation Schemas
 * 
 * Learning Objectives Block provides a structured overview of skills
 * learners will develop, with categorized badges and iconography.
 */

import { z } from 'zod';
import { PresentationConfigSchema } from './presentation.schema';

// Item schema (export for reuse)
export const ObjectiveO1ItemSchema = z.object({
  id: z.string().min(1).max(50),
  verb: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  text: z.string().min(1).max(500),
  description: z.string().min(1).max(1000).optional(),
  badge: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
}).passthrough();

// Note schema (export for clarity)
export const ObjectiveO1NoteSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  text: z.string().min(1).max(1000),
}).strict();

// Page schema (canonical structure)
export const ObjectiveO1PageSchema = z.object({
  eyebrow: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  titleHighlight: z.string().min(1).max(100).optional(),
  introduction: z.string().min(1).max(1000).optional(),
  subtitle: z.string().min(1).max(500).optional(),
  objectives: z.array(ObjectiveO1ItemSchema).min(1).max(20),
  note: z.union([
    z.string().min(1).max(1000),
    ObjectiveO1NoteSchema,
  ]).optional(),
}).strict();

// Author content schema (AI output wrapper)
export const ObjectiveO1AuthorContentSchema = z.object({
  page: ObjectiveO1PageSchema,
}).strict();

// CRITICAL: This must be a Zod schema, NOT a TypeScript interface
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});

// Validator function (optional but recommended)
export function validateObjectiveO1AIOutput(
  output: unknown
): z.infer<typeof ObjectiveO1AuthorContentSchema> {
  return ObjectiveO1AuthorContentSchema.parse(output);
}
```

### 4.3 Export Requirements Checklist

- [ ] File contains `import { z } from 'zod';`
- [ ] Exports `ObjectiveO1BlockSchema` as a **Zod schema** (not interface/type)
- [ ] Schema is a `z.object(...)` with literal discriminators
- [ ] Uses `z.string().uuid()` for id validation
- [ ] Imports and uses `PresentationConfigSchema`
- [ ] Follows canonical `{ content: { page: {...} } }` nesting
- [ ] No top-level `.strict()` on block schema
- [ ] Item schema uses `.passthrough()` for extensibility
- [ ] Page schema uses `.strict()` to prevent arbitrary fields

---

## 5. Import Path Resolution Requirements

### 5.1 Schema File Discovery

The patcher/comparator must locate candidate schemas via:

```python
CANDIDATE_SCHEMA_PATTERNS = [
    "packages/types/src/tutorial-rich-document/schemas/{type}-{version}.schema.ts",
    "packages/types/src/tutorial-rich-document/schemas/{type}.{version}.schema.ts",
    "packages/types/src/tutorial-rich-document/schemas/{type}/{version}.schema.ts",
]
```

For Objective O1:
- `type='objective'`
- `version='o1'` (lowercase in filename)
- Primary path: `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts`

### 5.2 Import Statement Requirements

```typescript
// In blocks.schema.ts
import { ObjectiveO1BlockSchema } from './objective-o1.schema';
```

### 5.3 Re-export Requirements

```typescript
// In blocks.schema.ts
export * from './objective-o1.schema';
```

### 5.4 Safety Constraints

- **No path traversal:** Reject paths containing `..`, absolute paths, or paths outside workspace
- **Workspace-relative only:** All paths must be relative to workspace root
- **Extension validation:** Only `.ts` files allowed
- **Export validation:** Comparator must verify `ObjectiveO1BlockSchema` is a Zod schema, not an interface

---

## 6. Union Member Registration Requirements

The Objective O1 block must be registered in the discriminated union for runtime dispatch.

### 6.1 Union Registration Location

```
packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts
```

### 6.2 Required Changes

```typescript
// Add import
import { ObjectiveO1BlockSchema } from './objective-o1.schema';

// Add re-export
export * from './objective-o1.schema';

// Add to union
export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // ... existing blocks ...
    IntroductionI1BlockSchema,
    DefinitionBlockSchema,
    ObjectiveO1BlockSchema,  // <-- ADD HERE
    ExampleBlockSchema,
    // ... rest of blocks ...
  ])
);
```

### 6.3 Union Position

Insert after `IntroductionI1BlockSchema` and before container blocks for logical grouping of instructional content blocks.

---

## 7. Validation Test Requirements

### 7.1 Valid Payload Tests

Test cases must validate:

1. **Minimal valid payload:**
```json
{
  "id": "12345678-1234-1234-1234-123456789012",
  "type": "objective",
  "version": "O1",
  "content": {
    "page": {
      "title": "Learning Objectives",
      "objectives": [
        {
          "id": "obj-1",
          "text": "Understand basic concepts"
        }
      ]
    }
  }
}
```

2. **Full payload with all optional fields:**
```json
{
  "id": "12345678-1234-1234-1234-123456789012",
  "type": "objective",
  "version": "O1",
  "content": {
    "page": {
      "eyebrow": "LEARNING OBJECTIVES",
      "title": "Skills You Will Develop in This Lesson",
      "titleHighlight": "Will Develop",
      "introduction": "By the end of this lesson, you will have the following practical skills:",
      "objectives": [
        {
          "id": "obj-1",
          "verb": "Create",
          "title": "Create and initialize lists",
          "text": "Create Python lists using different methods and initialize them with values.",
          "description": "Additional explanation of the skill",
          "badge": "Practical Skill",
          "icon": "create"
        }
      ],
      "note": {
        "title": "Note",
        "text": "These are observable, practical skills you will develop in this lesson."
      }
    }
  },
  "presentation": {
    "width": "normal",
    "spacing": "relaxed"
  },
  "expectedTimeSec": 180,
  "progressRole": "instructional"
}
```

3. **Default payload from block.integration.json**

### 7.2 Invalid Payload Tests

Test rejection of:

1. **Wrong type:** `"type": "introduction"`
2. **Wrong version:** `"version": "O2"`
3. **Missing required fields:** No `title`, no `objectives`, empty `objectives` array
4. **Invalid UUID:** `"id": "not-a-uuid"`
5. **Invalid objective item:** Missing `id` or `text`
6. **Content structure violation:** No `content.page` nesting
7. **Constraint violations:** Title exceeds 200 chars, empty strings, negative `expectedTimeSec`

### 7.3 Component-Schema Parity Tests

1. **All component props must be valid schema inputs**
2. **All default payload fields must pass schema validation**
3. **Schema must accept all fields the component expects**
4. **Schema must reject invalid inputs the component cannot handle**

---

## 8. Component-Schema-Default Parity Checklist

### 8.1 Component Interface Compatibility

- [x] Component `ObjectiveO1BlockContent` interface matches schema page structure
- [x] Component accepts `objectives` array with flexible fields
- [x] Component handles optional `eyebrow`, `introduction`, `titleHighlight`, `note`
- [x] Component normalizes both string and object `note` formats
- [x] Component extracts `verb` from `title` if not explicitly provided
- [x] Component uses `title` preferentially, falls back to `text`
- [x] Component supports additional fields via `[key: string]: unknown`

### 8.2 Default Payload Compatibility

- [x] Default payload in `block.integration.json` passes schema validation
- [x] Default payload includes all required fields
- [x] Default payload demonstrates optional features (badge, icon, verb)
- [x] Default payload note format matches schema union

### 8.3 JSON Schema Compatibility

**Reconciliation findings:**

| Field | JSON Schema | Component | Zod Schema | Status |
|-------|-------------|-----------|------------|--------|
| `title` | required | required | required | ✅ Aligned |
| `objectives` | required | required | required | ✅ Aligned |
| `objectives[].id` | required | required | required | ✅ Aligned |
| `objectives[].text` | required | required | required | ✅ Aligned |
| `eyebrow` | optional | optional | optional | ✅ Aligned |
| `introduction` | optional | optional | optional | ✅ Aligned |
| `titleHighlight` | optional | optional | optional | ✅ Aligned |
| `objectives[].verb` | optional | optional | optional | ✅ Aligned |
| `objectives[].title` | optional | optional | optional | ✅ Aligned |
| `objectives[].badge` | optional | optional | optional | ✅ Aligned |
| `objectives[].icon` | optional | optional | optional | ✅ Aligned |
| `note` | type: object (weak) | string or object | union | ⚠️ Zod more precise |
| `additionalProperties` | true | allowed | passthrough | ✅ Aligned |

**Action required:** JSON schema allows `additionalProperties: true` at objective item level, which aligns with Zod `.passthrough()` and component `[key: string]: unknown`.

### 8.4 Runtime Type Safety

```typescript
// This must compile and pass:
import type { z } from 'zod';
import type { ObjectiveO1BlockSchema } from './objective-o1.schema';
import type { ObjectiveO1BlockData } from './ObjectiveO1Block';

type SchemaInferred = z.infer<typeof ObjectiveO1BlockSchema>;
type ComponentExpected = ObjectiveO1BlockData;

// Verify assignability
const testAssignment: ComponentExpected = {} as SchemaInferred;
```

---

## 9. Edge Cases and Error Handling

### 9.1 Content Normalization

The component performs defensive normalization:

1. **Empty objectives array:** Component returns null (no render)
2. **Missing verb:** Extracts first word from title/text
3. **Missing title:** Uses `text` field as fallback
4. **String note:** Wraps in object with default title `"Note"`
5. **Missing defaults:** Applies fallback values for eyebrow, introduction

**Schema decision:** Require at least 1 objective, allow normalization logic in component.

### 9.2 Field Length Constraints

Based on component rendering and UX constraints:

| Field | Max Length | Rationale |
|-------|-----------|-----------|
| `title` | 200 | Single-line heading |
| `introduction` | 1000 | Multi-sentence paragraph |
| `objectives[].text` | 500 | Card heading with wrapping |
| `objectives[].description` | 1000 | Supporting paragraph |
| `badge` | 50 | Compact pill |
| `icon` | 50 | Icon key identifier |

### 9.3 Icon Validation

Component supports specific icons via `ObjectiveSkillIcon` switch:
- `create`, `access`, `extract`, `modify`, `use`, `explain`
- Default fallback: `sparkles`

**Schema decision:** Allow any string for extensibility, component handles unknown icons gracefully.

---

## 10. Artifact Reconciliation Summary

### 10.1 Critical Mismatches Found

**BLOCKER: `objective-o1.schema.ts` is an interface, not a Zod schema**

```typescript
// CURRENT (INVALID):
export interface ObjectiveO1BlockContract {
  id: string;
  type: 'objective';
  version: 'O1';
  content: {
    title: string;
    objectives: Array<{ id: string; text: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// REQUIRED (VALID):
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,
  // ... rest of fields
});
```

**Impact:**
- Runtime validation will fail (no schema to parse against)
- Comparator will reject the file (no schema export found)
- Union registration will fail (cannot discriminate on literal types)
- Type inference will fail (no `z.infer<>` support)

### 10.2 Structural Mismatches

| Artifact | Content Structure | Status |
|----------|------------------|--------|
| Component | `block.content.{fields}` | ❌ Expects flat content |
| Default Payload | `{fields}` (flat) | ❌ Missing `page` wrapper |
| JSON Schema | Flat fields | ❌ Missing `page` wrapper |
| Candidate Schema | Flat content | ❌ Missing `page` wrapper |
| **Canonical Pattern** | `content.page.{fields}` | ✅ Authoritative |

**Resolution:** All artifacts must adopt canonical `content.page` nesting. The component currently expects flat content, which violates the established pattern. This is either:
1. A component bug (needs fixing), OR
2. A documentation error (needs clarifying)

**Decision:** Follow canonical pattern. Component must be updated to expect `block.content.page.{fields}`.

### 10.3 Default Payload Structure

The `block.integration.json` default payload must be wrapped:

```json
{
  "defaultPayload": {
    "page": {
      "eyebrow": "LEARNING OBJECTIVES",
      "title": "Skills You Will Develop in This Lesson",
      ...
    }
  }
}
```

---

## 11. Implementation Dependencies

### 11.1 Schema Implementation (Agent A)

**Input:** This contract document  
**Output:** `objective-o1.schema.ts` conforming to Section 4  
**Dependencies:** None (can start immediately)

### 11.2 Comparator Validation (Agent B)

**Input:** Schema implementation from Agent A  
**Output:** Validated schema file detection and export verification  
**Dependencies:** Agent A completion

### 11.3 Union Registration (Agent A or Coordinator)

**Input:** Validated schema from Agent B  
**Output:** Updated `blocks.schema.ts` with Objective O1 in union  
**Dependencies:** Agent B approval

### 11.4 Component Update (Separate Task)

**Input:** This contract document  
**Output:** Component expecting `content.page` structure  
**Dependencies:** None (parallel track)

### 11.5 Integration Testing (Workflow 4)

**Input:** All implementations complete  
**Output:** End-to-end validation (compose, save, retrieve, render)  
**Dependencies:** Agents A, B, C complete + component update

---

## 12. Approval Signatures

| Artifact | Source | Status | Notes |
|----------|--------|--------|-------|
| Block Envelope | Canonical patterns (I1, C1, D1) | ✅ Approved | Standard structure |
| Content Structure | Component + canonical pattern | ✅ Approved | Requires `content.page` nesting |
| Zod Schema Requirements | Canonical patterns | ✅ Approved | Must be runtime schema |
| Import Paths | Patcher requirements | ✅ Approved | Follows established conventions |
| Union Registration | `blocks.schema.ts` pattern | ✅ Approved | Add after other content blocks |
| Validation Tests | Standard test patterns | ✅ Approved | Cover valid/invalid/edge cases |

**Contract Approval:** This document is the authoritative Objective O1 contract. No implementation may deviate without explicit approval and contract amendment.

---

## 13. Open Questions and Assumptions

### 13.1 Resolved Questions

**Q1:** Should the component expect flat `content` or nested `content.page`?  
**A1:** RESOLVED - Follow canonical pattern: `content.page`. Component must be updated.

**Q2:** Is `objective-o1.types.ts` missing from the ZIP?  
**A2:** RESOLVED - TypeScript types are inferred via `z.infer<typeof ObjectiveO1BlockSchema>`. No separate types file needed.

**Q3:** Should objective items allow additional properties?  
**A3:** RESOLVED - Yes, use `.passthrough()` per component interface `[key: string]: unknown`.

### 13.2 Assumptions

1. **Assumption:** Component will be updated to expect `content.page` structure (per canonical pattern)
2. **Assumption:** Default payload in `block.integration.json` will be wrapped in `page` object
3. **Assumption:** JSON Schema is for AI validation only; Zod schema is authoritative for runtime
4. **Assumption:** Icon validation is permissive (any string accepted, component handles fallback)
5. **Assumption:** Legacy `goals` field support (component normalizes both `objectives` and `goals`) is preserved for backward compatibility

---

## 14. Contract Maintenance

**Version:** 1.0  
**Last Updated:** 2025-01-28  
**Next Review:** After Agent A schema implementation

**Change Log:**
- 2025-01-28: Initial contract established from artifact reconciliation

**Amendment Process:**
1. Identify contract deviation or ambiguity
2. Document finding and proposed resolution
3. Update contract with rationale
4. Notify all implementation agents
5. Increment version number

---

## Appendix A: Canonical Pattern Reference

### Introduction I1 Pattern

```typescript
export const IntroductionI1AuthorContentSchema = z.object({
  page: IntroductionI1PageSchema,
}).strict();

export const IntroductionI1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('introduction'),
  version: z.literal('I1'),
  content: IntroductionI1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['...']).default('instructional').optional(),
});
```

### Code C1 Pattern

```typescript
export const CodeC1AuthorContentSchema = z.object({
  page: CanonicalCodeC1PageSchema,
}).strict();

export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['...']).default('instructional').optional(),
});
```

### Definition D1 Pattern

```typescript
export const DefinitionD1AuthorContentSchema = z.object({
  page: DefinitionD1PageSchema,
}).strict();

export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['...']).default('instructional').optional(),
});
```

**Pattern Consistency:** All versioned blocks follow identical envelope structure with nested `content.page` payload.

---

## Appendix B: Test Data Examples

### B.1 Minimal Valid Test Case

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "objective",
  "version": "O1",
  "content": {
    "page": {
      "title": "Learning Goals",
      "objectives": [
        { "id": "1", "text": "Learn basics" }
      ]
    }
  }
}
```

### B.2 Comprehensive Valid Test Case

See Section 7.1, Test Case #2

### B.3 Invalid Test Cases

```json
// Invalid: Missing content.page wrapper
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "objective",
  "version": "O1",
  "content": {
    "title": "Learning Goals",
    "objectives": [...]
  }
}

// Invalid: Wrong version
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "objective",
  "version": "O2",
  "content": { "page": {...} }
}

// Invalid: Empty objectives
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "objective",
  "version": "O1",
  "content": {
    "page": {
      "title": "Goals",
      "objectives": []
    }
  }
}
```

---

**END OF CONTRACT**
