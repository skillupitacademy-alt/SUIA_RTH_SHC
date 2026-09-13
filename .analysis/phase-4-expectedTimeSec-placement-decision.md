# Phase 4 - `expectedTimeSec` Placement Decision

**Date:** 2026-09-05  
**Status:** 🔒 FROZEN  
**Decision Type:** Implementation Strategy

---

## Executive Summary

**DECISION:** `expectedTimeSec` is an **optional authored metadata capability of instructional block schemas**, NOT a universal block property.

---

## The Question

Given source verification confirms `BaseBlock` exists as TypeScript interface:

```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}
```

**Where should `expectedTimeSec` be placed?**

**Options:**
- **A:** Add to `BaseBlock` → All blocks inherit (universal property)
- **B:** Add explicitly to instructional block schemas only (D1, C1, S1, I1, O1)
- **C:** Runtime calculates on-the-fly (no schema field)

---

## 🔒 FROZEN DECISION: Option B (Conceptual) with TypeScript Nuance

### Core Rule

> **`expectedTimeSec` is an instructional-block capability, not a universal block requirement.**

**Applies to:** D1 (Definition), C1 (Code), S1 (Summary), I1 (Interactive), O1 (Output), future learning-bearing blocks

**Does NOT apply to:** Structural/presentational blocks (2-column, 3-column, card-grid, timeline, etc.)

---

## Semantic Meaning

```text
expectedTimeSec
    =
Estimated learner effort for THIS instructional block instance
```

**NOT:**
```text
expectedTimeSec
    =
Generic property of every TutorialBlock
```

---

## Implementation Strategy

### 1. TypeScript Layer (Optional Convenience)

**MAY** add to `BaseBlock` as optional field for type-level convenience:

```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  expectedTimeSec?: number;  // Optional capability
}

// Instructional blocks inherit
interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1Page;
  // expectedTimeSec inherited from BaseBlock
}

// Structural blocks also inherit but semantically don't use it
interface TwoColumnBlock extends BaseBlock {
  type: 'two-column';
  // expectedTimeSec inherited but not semantically meaningful
}
```

**CAUTION:** Only adopt this if existing code doesn't treat every `BaseBlock` as semantically equivalent. Must verify no code assumes all BaseBlock instances are learning-bearing.

**Alternative:** Explicit per-block interface definition if inheritance creates semantic confusion.

---

### 2. Zod Schema Layer (Explicit Control)

**MUST** explicitly add to instructional block schemas:

```typescript
// Definition D1 Schema
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1PageSchema,
  presentation: PresentationConfigSchema.optional(),
  expectedTimeSec: z.number().int().positive().optional(),  // ✅ EXPLICIT
});

// Code C1 Schema
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1PageSchema,
  presentation: PresentationConfigSchema.optional(),
  expectedTimeSec: z.number().int().positive().optional(),  // ✅ EXPLICIT
});

// Two Column Schema (Structural - NO expectedTimeSec)
export const TwoColumnBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('two-column'),
  // NO expectedTimeSec field
  leftColumn: z.array(TutorialBlockSchema),
  rightColumn: z.array(TutorialBlockSchema),
});
```

**Rationale:**
- Zod schemas are self-contained (verified in source)
- Runtime validation determines which blocks accept the field
- Explicit schema control = explicit semantic meaning
- Prevents accidental validation of meaningless values

---

## Architectural Flow (Unchanged)

```text
AI Content Generation
   ↓
Generates: Block content + expectedTimeSec (for instructional blocks)
   ↓
Tutorial Composer
   ↓
Validates with Zod schema (only instructional blocks accept it)
   ↓
Author reviews/overrides
   ↓
Published TutorialDocument (frozen authoritative value)
   ↓
Tutorial Runtime
   ↓
Reads expectedTimeSec from published block (if present)
   ↓
ILS measures actual time
   ↓
Compares actual vs expected (if expected exists)
   ↓
Status: ahead | on_track | behind | unknown
```

---

## Field Location: Block Envelope, Not Content

`expectedTimeSec` belongs at the **block metadata/envelope level**, NOT inside learner-facing `content`.

**Correct:**
```typescript
{
  id: "uuid",
  type: "code",
  version: "C1",
  expectedTimeSec: 180,  // ✅ Block-level metadata
  content: {
    // Learner-facing instructional content
    title: "...",
    code: "...",
    explanation: "..."
  }
}
```

**Incorrect:**
```typescript
{
  id: "uuid",
  type: "code",
  version: "C1",
  content: {
    expectedTimeSec: 180,  // ❌ Wrong level
    title: "...",
    code: "..."
  }
}
```

**Rationale:** `expectedTimeSec` is **authored/published metadata about the learning task**, not part of the instructional content itself.

---

## C1 Conversion Boundary

For Code C1 blocks specifically, the AI/raw → canonical conversion must preserve `expectedTimeSec`:

```typescript
// Historical/Raw format (from AI)
{
  type: "code",
  // ... raw fields
  expectedTimeSec: 180
}
   ↓
// Canonical C1 format (published)
{
  id: "uuid",
  type: "code",
  version: "C1",
  expectedTimeSec: 180,  // ✅ Preserved through conversion
  content: { ... }
}
```

The source audit identifies this conversion boundary as something to account for.

---

## Missing Value Semantics

```text
expectedTimeSec = null | undefined
        ↓
Time comparison status = "unknown"
        ↓
ILS displays: "No estimate available"
        ↓
ILS never invents/calculates the missing value
```

**This is valid and expected behavior.**

Not all blocks will have estimates initially. The system gracefully handles absence.

---

## 🎯 S1 Litmus Test (Unchanged)

**Goal:** Add S1 block with ZERO new ILS code

```text
1. Define S1 schema with expectedTimeSec field
2. Create S1 renderer with data-block-* attributes
3. AI generates S1 content + expectedTimeSec
4. Composer validates/publishes
5. Runtime identifies S1 via ActiveBlockContext
6. Generic ILS records telemetry
7. block_learning_state persists state
8. RSSB displays S1 learning state

✅ ZERO S1-specific ILS implementation
```

**This proves the architecture is generic.**

---

## Rules Summary

### Frozen Rules

1. ✅ AI proposes `expectedTimeSec` based on actual generated content
2. ✅ Composer validates and exposes for author review/override
3. ✅ Published TutorialDocument becomes authoritative
4. ✅ ILS reads published value; never estimates one
5. ✅ Instructional block schemas explicitly support the field
6. ✅ Structural/presentational blocks do NOT require it
7. ✅ Missing value → comparison status = "unknown"
8. ✅ Field belongs at block envelope level, NOT inside content
9. ✅ C1 conversion must preserve the field
10. ✅ Generic ILS consumes value; NO block-type-specific time logic

### Implementation Tasks (Before Phase 4.1)

- [ ] Inspect actual D1/C1 TypeScript interfaces
- [ ] Inspect actual D1/C1 Zod schemas
- [ ] Verify no code treats all BaseBlock instances as learning-bearing
- [ ] Decide TypeScript inheritance vs explicit per-block definition
- [ ] Document chosen pattern for future blocks (S1, I1, O1)

---

## Why This Preserves Generic ILS

**Generic ILS operates on:**
- `(blockId, blockVersion)` identity tuple
- `expectedTimeSec` metadata (if present)
- Actual measured time
- Status calculation: `actual vs expected`

**Generic ILS does NOT:**
- ❌ Switch on `blockType`
- ❌ Have D1-specific or C1-specific time logic
- ❌ Guess missing `expectedTimeSec` values
- ❌ Apply block-version defaults ("C1 = 180s")

**Adding S1 requires:**
- ✅ S1 schema with `expectedTimeSec` field
- ✅ S1 renderer with DOM attributes
- ❌ NO new ILS code

**This is the frozen principle.**

---

## Comparison with Alternatives

### ❌ Option A: Universal BaseBlock Property

**Problem:**
- Structural blocks (timeline, card-grid) inherit meaningless learning-time
- Semantic confusion: "How long does a 2-column layout take to learn?"
- Encourages treating all blocks as instructional
- Violates separation: learning metadata vs presentation structure

### ❌ Option C: Runtime Calculates

**Problem:**
- ILS doesn't know content complexity
- Two C1 blocks can have vastly different difficulty
- AI generated the content; AI knows the estimate
- Runtime calculation = guessing
- Violates "Composer establishes authored metadata" principle

### ✅ Option B: Instructional Block Capability

**Advantages:**
- Semantic clarity: only learning-bearing blocks have learning-time
- AI-generated estimates match actual content
- Published value is authoritative
- Generic ILS just compares actual vs expected
- Adding new instructional block = add field to schema (explicit)
- Structural blocks remain presentation-only

---

## Architectural Invariant (Unchanged)

> **Composer establishes the block's identity and authored metadata. Runtime identifies the active block generically. ILS records actual learner behavior and compares against published metadata. RSSB consumes the resulting state.**

`expectedTimeSec` is **authored metadata** established by Composer.

---

## 🔒 Decision Status

**FROZEN:** `expectedTimeSec` is an optional instructional-block capability, explicitly added to learning-bearing block schemas (D1, C1, S1, I1, O1), NOT a universal block property.

**Next Action:** Verify TypeScript/Zod implementation pattern before Phase 4.1 schema work.

---

**Decision Date:** 2026-09-05  
**Authority:** Phase 4 Architectural Record  
**Compliance:** Required for Phase 4.1+ implementation  
**Litmus Test:** S1 requires schema field, NOT new ILS code
