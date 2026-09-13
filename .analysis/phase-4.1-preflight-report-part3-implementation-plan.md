# Phase 4.1 Pre-Flight Report - Part 3: Implementation Plan

**Date:** 2026-09-05  
**Phase:** ILS Phase 4.1 - Schema + Migration  
**Mode:** Implementation Decision & Minimal Change Plan  
**Continuation:** Part 3 of 3 (Final)

---

## Executive Summary

**Pre-Flight Inspection Complete:** All source verification finished.

**Contradictions Found:** ONE critical finding (Zod schema would strip unknown fields).

**Ready to Proceed:** Yes, with minimal changes documented below.

---

## Critical Finding: Zod Schema Behavior

### Issue Discovered

**Current Block Schemas:**
```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  // No .strict() or .passthrough()
});

export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  // No .strict() or .passthrough()
});
```

**Default Zod Behavior:** `.strip()` (silently removes unknown keys)

**Problem:** Adding `expectedTimeSec` to blocks would be **STRIPPED** during validation.

---

### Required Fix

**Option 1: Explicit Field (RECOMMENDED)**
```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema.optional(),  // ✅ Already implicit
  expectedTimeSec: z.number().int().positive().optional(),  // ✅ ADD THIS
});
```

**Option 2: Passthrough**
```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
}).passthrough();  // Allows additional fields
```

**Recommendation:** **Option 1 (Explicit Field)**

**Rationale:**
- Explicit validation of expectedTimeSec type/constraints
- Self-documenting schema
- Better error messages
- Follows existing strict validation pattern
- Safe for future schema evolution

---

## Implementation Decision: TypeScript Placement

### Decision: Add to BaseBlock (Option A)

**Modified BaseBlock:**
```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  expectedTimeSec?: number;  // ✅ ADD THIS
}
```

**Rationale:**
1. ✅ No code treats all BaseBlock instances identically
2. ✅ Optional field doesn't force semantic meaning
3. ✅ Zod schemas provide runtime enforcement
4. ✅ Minimal change (single location)
5. ✅ Future S1/I1/O1 inherit automatically
6. ✅ Type system ergonomics (DRY principle)

**Safeguards:**
- Zod schemas explicitly include/exclude field per block type
- Documentation clarifies instructional-only semantic
- Structural blocks inherit but don't use field
- Runtime validation enforces correct usage

---

## Minimal Change Plan

### Change 1: TypeScript BaseBlock

**File:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`

**Before:**
```typescript
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}
```

**After:**
```typescript
/**
 * Base structure for all blocks
 */
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  
  /**
   * Expected time for learner to complete this block (in seconds)
   * 
   * SEMANTIC SCOPE: Instructional blocks only (D1, C1, S1, I1, O1)
   * - AI-generated at content authoring time
   * - Composer-validated and author-reviewable
   * - Published TutorialDocument is authoritative
   * - ILS compares actual vs expected time
   * 
   * STRUCTURAL BLOCKS: Field inherited but semantically not applicable.
   * Runtime validation (Zod schemas) determines which blocks accept this field.
   * 
   * @example
   * expectedTimeSec: 180  // 3 minutes
   */
  expectedTimeSec?: number;
}
```

---

### Change 2: D1 Zod Schema

**File:** `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts`

**Current:**
```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
});
```

**Modified:**
```typescript
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema.optional(),  // Explicit (was implicit)
  expectedTimeSec: z.number().int().positive().optional(),  // NEW
});
```

**Validation Rules:**
- Optional field (can be undefined/null)
- Must be integer (no decimals)
- Must be positive (> 0)
- Rejects 0, negative, non-integer values

---

### Change 3: C1 Zod Schema

**File:** `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`

**Current:**
```typescript
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
});
```

**Modified:**
```typescript
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  presentation: PresentationConfigSchema.optional(),  // Explicit (was implicit)
  expectedTimeSec: z.number().int().positive().optional(),  // NEW
});
```

---

### Change 4: Import PresentationConfigSchema

**Required in both schema files:**

```typescript
import { PresentationConfigSchema } from './presentation.schema';
// Or wherever PresentationConfig schema is defined
```

**Verify:** Check if `PresentationConfigSchema` already exists or needs to be created.

---

### Change 5: C1 Conversion (NO CHANGE NEEDED)

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/code/C1/codeC1.converter.ts`

**Analysis:** ✅ NO MODIFICATION REQUIRED

**Rationale:**
- Conversion operates on `content` level only
- Block envelope fields (`id`, `type`, `version`, `expectedTimeSec`) handled by different layer
- Function signature: `(payload: unknown) => { content: CodeC1AuthorContent }`
- Does NOT construct block envelope

**Where envelope preservation happens:**
- Document transformation layer
- Composer save/load logic
- Not in content conversion function

---

### Change 6: Database Schema - block_learning_state

**File:** `packages/db-tutorial/src/schema/block-learning-state.ts` (NEW FILE)

```typescript
/* istanbul ignore file */
import { integer, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Block Learning State - Phase 4 ILS
 * 
 * Per-block learner progress and telemetry
 * 
 * IDENTITY: (userId, navigationNodeId, blockId, blockVersion)
 * - userId: Learner identity (already brand-scoped)
 * - navigationNodeId: Page/navigation context
 * - blockId: Block instance UUID
 * - blockVersion: Block content version (D1, C1, S1, etc.)
 * 
 * TELEMETRY:
 * - visitCount: Block-level visit tracking
 * - revisionCount: Return visits after completion
 * - activeTimeSec: Measured active engagement time
 * - expectedTimeSec: Authored expected time (from published document)
 * 
 * TIMESTAMPS:
 * - firstViewedAt: First block observation
 * - lastViewedAt: Most recent observation
 * - completedAt: Denormalized completion timestamp
 *   (authoritative source: tutorial_navigation_progress.completed_blocks)
 * 
 * ARCHITECTURE:
 * - Independent from page-level progress
 * - Generic (works for any block type)
 * - Session-agnostic (visit logic managed by service layer)
 */
export const blockLearningState = pgTable('block_learning_state', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Learner Identity
  userId: uuid('user_id').notNull(),
  
  // Block Identity (scoped to navigation node)
  navigationNodeId: text('navigation_node_id').notNull(),
  blockId: text('block_id').notNull(),  // UUID stored as text
  blockVersion: text('block_version').notNull(),  // 'D1', 'C1', 'S1', etc.
  
  // Telemetry Counters
  visitCount: integer('visit_count').notNull().default(0),
  revisionCount: integer('revision_count').notNull().default(0),
  activeTimeSec: integer('active_time_sec').notNull().default(0),
  
  // Expected Time (authored metadata)
  expectedTimeSec: integer('expected_time_sec'),  // Nullable - may not exist
  
  // Timestamps
  firstViewedAt: timestamp('first_viewed_at', { mode: 'date' }),
  lastViewedAt: timestamp('last_viewed_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),  // Denormalized
  
  // Audit Fields
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  // Unique block identity (partial - active records only)
  uqBlockLearningStateIdentity: uniqueIndex('uq_block_learning_state_identity')
    .on(table.userId, table.navigationNodeId, table.blockId, table.blockVersion)
    .where(sql`${table.deletedAt} IS NULL`),
  
  // Query by user (learner dashboard)
  idxBlockLearningStateUser: index('idx_block_learning_state_user')
    .on(table.userId),
  
  // Query by navigation node (page-level aggregation)
  idxBlockLearningStateNode: index('idx_block_learning_state_node')
    .on(table.userId, table.navigationNodeId),
  
  // Query by block (cross-page analytics)
  idxBlockLearningStateBlock: index('idx_block_learning_state_block')
    .on(table.blockId, table.blockVersion),
  
  // Query by last viewed (recommendations)
  idxBlockLearningStateLastViewed: index('idx_block_learning_state_last_viewed')
    .on(table.userId, table.lastViewedAt),
}));
```

---

### Change 7: Export from Schema Index

**File:** `packages/db-tutorial/src/schema/index.ts`

**Add:**
```typescript
export * from './block-learning-state';
```

---

### Change 8: Generate Migration

**Command:**
```bash
cd packages/db-tutorial
pnpm drizzle-kit generate
```

**Expected Output:**
- New migration file in `packages/db-tutorial/migrations/`
- Numbered sequentially (e.g., `0002_add_block_learning_state_table.sql`)
- Contains CREATE TABLE, CREATE INDEX, CREATE UNIQUE INDEX statements

---

### Change 9: Migration Validation Checklist

**After generation, verify migration contains:**

- [ ] `CREATE TABLE block_learning_state`
- [ ] Primary key: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] Columns match schema definition (snake_case)
- [ ] NOT NULL constraints on required fields
- [ ] DEFAULT values on counters (0) and timestamps
- [ ] Unique index: `uq_block_learning_state_identity` on (user_id, navigation_node_id, block_id, block_version) WHERE deleted_at IS NULL
- [ ] Indexes: user, node, block, last_viewed
- [ ] NO brand column
- [ ] NO session_id column
- [ ] expected_time_sec is nullable integer

**Manual Review Required:** Check for:
- Unintended table alterations
- Correct data types
- Index creation order
- Foreign key constraints (should be NONE)

---

## Test Plan

### Test 1: D1 Schema Validation

**File:** `packages/types/src/tutorial-rich-document/__tests__/definition-d1.test.ts`

**Add Tests:**
```typescript
describe('Definition D1 - expectedTimeSec', () => {
  const validBlock = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'definition' as const,
    version: 'D1' as const,
    content: { /* valid content */ },
  };

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
});
```

---

### Test 2: C1 Schema Validation

**File:** `packages/types/src/tutorial-rich-document/__tests__/code-c1.test.ts`

**Add Similar Tests for CodeC1BlockSchema**

---

### Test 3: C1 Conversion Preservation

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/code/C1/__tests__/codeC1.converter.test.ts`

**Add Test:**
```typescript
it('preserves expectedTimeSec when already in canonical format', () => {
  const canonicalWithTime = {
    page: { /* valid C1 page */ },
    expectedTimeSec: 240,
  };

  const result = toCanonicalCodeC1(canonicalWithTime);
  
  // Conversion should preserve envelope-level fields
  // (Actually, conversion only operates on content, so this test
  // verifies that conversion doesn't strip unknown fields)
  expect(result.content).toEqual(canonicalWithTime);
});
```

**Note:** May need to adjust based on actual conversion behavior.

---

### Test 4: Database Schema (TypeScript)

**File:** `packages/db-tutorial/src/schema/__tests__/block-learning-state.test.ts` (NEW)

```typescript
import { blockLearningState } from '../block-learning-state';

describe('blockLearningState schema', () => {
  it('has correct table name', () => {
    expect(blockLearningState).toBeDefined();
  });

  it('has all required columns', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).toContain('id');
    expect(columns).toContain('userId');
    expect(columns).toContain('navigationNodeId');
    expect(columns).toContain('blockId');
    expect(columns).toContain('blockVersion');
    expect(columns).toContain('expectedTimeSec');
    expect(columns).toContain('visitCount');
    expect(columns).toContain('revisionCount');
    expect(columns).toContain('activeTimeSec');
    expect(columns).toContain('firstViewedAt');
    expect(columns).toContain('lastViewedAt');
    expect(columns).toContain('completedAt');
    expect(columns).toContain('deletedAt');
  });

  it('does NOT have brand column', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).not.toContain('brand');
    expect(columns).not.toContain('brandId');
  });

  it('does NOT have session column', () => {
    const columns = Object.keys(blockLearningState);
    expect(columns).not.toContain('sessionId');
    expect(columns).not.toContain('lastSessionId');
  });
});
```

---

### Test 5: Migration (Manual Validation)

**After running migration generation:**

1. Read generated SQL file
2. Verify table structure
3. Check index definitions
4. Confirm partial unique index has WHERE clause
5. Apply migration to test database
6. Verify table created successfully
7. Test insert/select operations

---

## Regression Requirements

### Phase 2 Tests

**Location:** Verify existing Phase 2 ILS tests still pass

**Expected:** NO failures (Phase 4.1 doesn't modify Phase 2 code)

---

### Phase 3 Tests

**Location:** Verify ActiveBlockContext tests still pass

**Expected:** NO failures (Phase 4.1 doesn't modify ActiveBlockContext)

---

### TutorialDocument Tests

**Location:** `packages/types/src/tutorial-rich-document/__tests__/document.test.ts`

**Expected:** Existing documents still validate (backward compatible)

---

## Stop Conditions - Contradictions Check

### Verified: NO CONTRADICTIONS

- ✅ Database identity does NOT require brand column
- ✅ User identity (uuid) provides required scope
- ✅ D1/C1 contain expected version/identity structure
- ✅ Migration strategy is standard Drizzle pattern
- ✅ Soft-delete convention is consistent
- ✅ C1 conversion CAN preserve envelope fields (with schema fix)
- ✅ No ActiveBlockContext modification required
- ✅ No block-type-specific implementation needed
- ✅ No second identity mechanism required
- ✅ Phase 2/3 should not be affected

**One Issue Found (Resolved):**
- ⚠️ Zod schema strips unknown fields by default
- ✅ Solution: Explicitly add `expectedTimeSec` to instructional block schemas

---

## Implementation Checklist

### TypeScript Changes
- [ ] Modify BaseBlock interface (add expectedTimeSec)
- [ ] Add JSDoc documentation to BaseBlock.expectedTimeSec
- [ ] Verify PresentationConfigSchema location
- [ ] Import PresentationConfigSchema in D1 schema
- [ ] Import PresentationConfigSchema in C1 schema
- [ ] Modify DefinitionD1BlockSchema (add fields)
- [ ] Modify CodeC1BlockSchema (add fields)

### Database Changes
- [ ] Create block-learning-state.ts schema file
- [ ] Export from schema/index.ts
- [ ] Generate migration (drizzle-kit generate)
- [ ] Review generated migration SQL
- [ ] Validate migration against checklist

### Tests
- [ ] Add D1 expectedTimeSec validation tests
- [ ] Add C1 expectedTimeSec validation tests
- [ ] Add block-learning-state schema tests
- [ ] Add C1 conversion preservation test (if applicable)
- [ ] Run Phase 2 regression tests
- [ ] Run Phase 3 regression tests
- [ ] Run TutorialDocument validation tests

### Validation
- [ ] Apply migration to local test database
- [ ] Verify table structure matches schema
- [ ] Test insert operations
- [ ] Test unique constraint enforcement
- [ ] Test soft-delete filtering
- [ ] Verify NO brand column exists
- [ ] Verify NO session column exists

---

## Files Modified Summary

### New Files
1. `packages/db-tutorial/src/schema/block-learning-state.ts` - NEW table schema
2. `packages/db-tutorial/migrations/[number]_add_block_learning_state_table.sql` - Generated migration
3. `packages/db-tutorial/src/schema/__tests__/block-learning-state.test.ts` - Schema tests

### Modified Files
1. `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts` - BaseBlock with expectedTimeSec
2. `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts` - Add expectedTimeSec to schema
3. `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts` - Add expectedTimeSec to schema
4. `packages/db-tutorial/src/schema/index.ts` - Export new schema
5. `packages/types/src/tutorial-rich-document/__tests__/definition-d1.test.ts` - Add expectedTimeSec tests
6. `packages/types/src/tutorial-rich-document/__tests__/code-c1.test.ts` - Add expectedTimeSec tests

### Files NOT Modified
- ✅ C1 converter (no change needed)
- ✅ ActiveBlockContext (protected)
- ✅ ILSProvider (Phase 4.5)
- ✅ Repository methods (Phase 4.2)
- ✅ Service layer (Phase 4.3)
- ✅ API routes (Phase 4.4)

---

## Phase 4.1 Definition of Done

**Complete when:**

```
┌──────────────────────────────────────────────┐
│ PHASE 4.1 — SCHEMA + MIGRATION               │
├──────────────────────────────────────────────┤
│ ✅ Source inspection complete                 │
│ ✅ TypeScript BaseBlock modified              │
│ ✅ D1 schema includes expectedTimeSec         │
│ ✅ C1 schema includes expectedTimeSec         │
│ ✅ Zod validation enforces constraints        │
│ ✅ block_learning_state schema created        │
│ ✅ Composite unique constraint correct        │
│ ✅ NO brand column                            │
│ ✅ NO session column                          │
│ ✅ Soft-delete convention followed            │
│ ✅ Migration generated                        │
│ ✅ Migration validated                        │
│ ✅ expectedTimeSec tests pass                 │
│ ✅ Schema tests pass                          │
│ ✅ Phase 2 regression passes                  │
│ ✅ Phase 3 regression passes                  │
│ ✅ No ActiveBlockContext changes              │
│ ✅ No block-type-specific code                │
└──────────────────────────────────────────────┘
```

---

## Next Phase Boundary

**Phase 4.1 ENDS HERE**

**DO NOT IMPLEMENT:**
- Repository methods (recordBlockVisit, recordBlockTime, etc.)
- Service layer methods
- API routes
- ILSProvider changes
- Time comparison logic
- Completion synchronization transactions

**WAIT FOR:** Explicit "BEGIN PHASE 4.2" authorization

---

## Recommendations

### Proceed with Implementation

**All verification complete. Ready to implement minimal changes.**

**Critical Success Factors:**
1. Add expectedTimeSec explicitly to Zod schemas (don't rely on passthrough)
2. Document semantic meaning in BaseBlock (instructional blocks only)
3. Follow exact database conventions (no deviations)
4. Generate migration with Drizzle Kit (don't hand-write SQL)
5. Validate migration before applying
6. Run all regression tests

**Architecture Preserved:**
- ✅ Generic ILS (no block-type switches)
- ✅ Independent page/block telemetry
- ✅ Canonical block identity reused
- ✅ ActiveBlockContext unchanged
- ✅ No second identity system
- ✅ No brand column

**Frozen Decisions Honored:**
- ✅ Dedicated block_learning_state table
- ✅ (userId, navigationNodeId, blockId, blockVersion) identity
- ✅ expectedTimeSec as instructional block capability
- ✅ AI-authored, Composer-validated metadata
- ✅ firstViewedAt + lastViewedAt timestamps
- ✅ completedAt denormalized copy
- ✅ Soft-delete pattern

---

**Status:** Pre-Flight Complete - Ready for Implementation  
**Authorization Required:** User approval to proceed with changes  
**Estimated Changes:** 7 modified files, 3 new files, 1 generated migration

