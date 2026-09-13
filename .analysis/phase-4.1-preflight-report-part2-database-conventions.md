# Phase 4.1 Pre-Flight Report - Part 2: Database Conventions

**Date:** 2026-09-05  
**Phase:** ILS Phase 4.1 - Schema + Migration  
**Mode:** Pre-Implementation Verification  
**Continuation:** Part 2 of 3

---

## STEP 6: Drizzle Configuration & Migration Conventions

### Drizzle Config

**Location:** `packages/db-tutorial/drizzle.config.ts`

```typescript
export default defineConfig({
  schema: './src/schema/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL_TUTORIAL ?? process.env.DATABASE_URL_TUTORIAL ?? '',
  },
});
```

**Key Facts:**
- ✅ Schema glob: `./src/schema/*.ts` (all files)
- ✅ Migration output: `./migrations` directory
- ✅ Dialect: PostgreSQL
- ✅ Database URL from environment variables

---

### Migration Directory Structure

**Location:** `packages/db-tutorial/src/migrations`

```
migrations/
├── 0001_drop_layman_table.sql
├── manual/
└── p1-p0-foundation/
```

**Observations:**
- ✅ SQL migration files (not TypeScript)
- ✅ Numbered prefix convention (`0001_`, `0002_`, etc.)
- ✅ Descriptive names
- ✅ Manual migrations supported (subdirectory)
- ✅ Phase-organized migrations (`p1-p0-foundation/`)

**Migration Generation:**
- Repository uses Drizzle Kit to generate migrations
- Command: `drizzle-kit generate` (inferred from config)
- Migrations are SQL files, not hand-written

---

### Migration Naming Convention

**Pattern:** `[number]_[descriptive_name].sql`

**Example:** `0001_drop_layman_table.sql`

**For Phase 4.1:**
- Suggested name: `[next_number]_add_block_learning_state_table.sql`
- Or: `[next_number]_ils_phase_4_block_telemetry.sql`

---

## STEP 7: Database Schema Conventions

### Primary Key Convention

**Inspected:** `tutorial-navigation-progress.ts` and 20+ other schema files

**Pattern:**
```typescript
id: uuid('id').primaryKey().defaultRandom()
```

**Consistent across all tables:**
- ✅ Column name: `id`
- ✅ Type: `uuid`
- ✅ Constraint: `.primaryKey()`
- ✅ Default: `.defaultRandom()` (Postgres UUID generation)

---

### Column Naming Convention

**Pattern:** `camelCase` in Drizzle → `snake_case` in database

**Examples:**
```typescript
userId: uuid('user_id')
navigationNodeId: text('navigation_node_id')
timeSpentActiveSec: integer('time_spent_active_sec')
firstViewedAt: timestamp('first_viewed_at')
completedAt: timestamp('completed_at')
```

**Verified Consistency:** All 50+ schema files use this pattern.

---

### User Identity Type

**From:** `tutorial-navigation-progress.ts`

```typescript
userId: uuid('user_id').notNull()
```

**Facts:**
- ✅ Type: `uuid`
- ✅ NOT NULL constraint
- ✅ No foreign key defined (user management outside db-tutorial package)
- ✅ Consistent across all learner-state tables

---

### Navigation Node Identity Type

**From:** `tutorial-navigation-progress.ts`

```typescript
navigationNodeId: text('navigation_node_id').notNull()
```

**Facts:**
- ✅ Type: `text` (NOT uuid)
- ✅ NOT NULL constraint
- ✅ Represents sidebar node / URL identity
- ✅ Opaque string identifier

---

### Block Identity Types

**From:** `tutorial-navigation-progress.ts` JSONB structure

```typescript
completedBlocks: jsonb('completed_blocks').$type<CompletedBlockRecord[]>()

interface CompletedBlockRecord {
  blockId: string;        // UUID
  blockVersion: string;   // 'D1', 'C1', etc.
  completedAt: string;    // ISO timestamp
}
```

**Facts:**
- ✅ `blockId`: String (UUID format)
- ✅ `blockVersion`: String (version literal)
- ✅ Stored as JSONB in existing table

**For new table:**
- `blockId`: Should use `text` (stores UUID as string)
- `blockVersion`: Should use `text` (stores version literal)

---

### Timestamp Convention

**Pattern:**
```typescript
timestamp('column_name', { mode: 'date' })
```

**Facts:**
- ✅ Type: `timestamp`
- ✅ Mode: `'date'` (JavaScript Date object, not string)
- ⚠️ **NO timezone specification** in most tables
- ✅ Nullable by default (use `.notNull()` explicitly)

**Created/Updated Timestamps:**
```typescript
createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
```

**Learning Timestamps:**
```typescript
firstViewedAt: timestamp('first_viewed_at', { mode: 'date' })
lastViewedAt: timestamp('last_viewed_at', { mode: 'date' })
completedAt: timestamp('completed_at', { mode: 'date' })
```

**No `.notNull()` on learning timestamps (nullable until event occurs)**

---

### Integer Convention

**From:** `tutorial-navigation-progress.ts`

```typescript
timeSpentActiveSec: integer('time_spent_active_sec').notNull().default(0)
visitCount: integer('visit_count').notNull().default(0)
revisionCount: integer('revision_count').notNull().default(0)
version: integer('version').notNull().default(1)
```

**Facts:**
- ✅ Type: `integer` (standard SQL integer)
- ✅ Counters default to `0`
- ✅ Optimistic version defaults to `1`
- ✅ NOT NULL with explicit default

---

### JSONB Convention

**Pattern:**
```typescript
jsonb('column_name').$type<TypeScriptType>()
```

**Example:**
```typescript
completedBlocks: jsonb('completed_blocks').$type<CompletedBlockRecord[]>().notNull().default([])
```

**Facts:**
- ✅ Use `.$type<>()` for TypeScript type safety
- ✅ Default value as JSON (e.g., `[]` for arrays)
- ✅ NOT NULL with default for required fields

---

### Index Naming Convention

**Pattern:** `idx_[table]_[columns]` or `idx_[table]_[purpose]`

**Examples:**
```typescript
idxNavigationProgressUser: index('idx_navigation_progress_user')
  .on(table.userId)

idxNavigationProgressSubtopic: index('idx_navigation_progress_subtopic')
  .on(table.userId, table.subtopicId)

idxNavigationProgressLastViewed: index('idx_navigation_progress_last_viewed')
  .on(table.userId, table.lastViewedAt)
```

**Facts:**
- ✅ Prefix: `idx_`
- ✅ Include table name (abbreviated acceptable)
- ✅ Descriptive suffix
- ✅ No `_idx` suffix

---

### Unique Constraint Naming Convention

**Pattern:** `uq_[table]_[columns]` or `uq_[table]_[purpose]`

**Example:**
```typescript
uqNavigationProgressUserNode: uniqueIndex('uq_navigation_progress_user_node')
  .on(table.userId, table.navigationNodeId)
  .where(sql`${table.deletedAt} IS NULL`)
```

**Facts:**
- ✅ Prefix: `uq_`
- ✅ Include table name (abbreviated)
- ✅ Partial unique index with WHERE clause for soft-delete
- ✅ Uses Drizzle's `uniqueIndex()` helper

---

### Foreign Key Convention

**From multiple schemas:**

```typescript
subtopicId: uuid('subtopic_id')
  .references(() => tutorialSubtopics.id)
  .notNull()
```

**Facts:**
- ✅ Use `.references(() => table.column)`
- ✅ NOT NULL constraint separate from reference
- ✅ No explicit ON DELETE/UPDATE (uses database defaults)
- ⚠️ **IMPORTANT:** Many tables have NO foreign keys defined

**For Phase 4.1:**
- ✅ `userId`: No foreign key (external identity system)
- ✅ `navigationNodeId`: No foreign key (navigation configuration)
- ✅ `blockId`: No foreign key (stored in JSONB document)
- ⚠️ Consider `navigationNodeId` foreign key to navigation table IF it exists

---

## STEP 8: Soft Delete Convention

### Consistent Pattern Across All Tables

**Field Definition:**
```typescript
deletedAt: timestamp('deleted_at', { mode: 'date' })
```

**Facts:**
- ✅ Column name: `deletedAt` (camelCase) → `deleted_at` (snake_case)
- ✅ Type: `timestamp` with mode `'date'`
- ✅ **NULLABLE** (no `.notNull()`)
- ✅ **NO DEFAULT** (null until soft-deleted)
- ✅ Consistent across ALL 30+ inspected tables

---

### Partial Index Pattern

**For unique constraints:**
```typescript
uqNavigationProgressUserNode: uniqueIndex('uq_navigation_progress_user_node')
  .on(table.userId, table.navigationNodeId)
  .where(sql`${table.deletedAt} IS NULL`)
```

**Pattern:**
```sql
WHERE deleted_at IS NULL
```

**Purpose:**
- Allows duplicate "deleted" records (deletedAt NOT NULL)
- Enforces uniqueness only for active records (deletedAt IS NULL)
- Standard soft-delete partial index pattern

---

### Application-Level Filtering

**From repository:**
```typescript
const activeProgress = isNull(tutorialNavigationProgress.deletedAt);

// All queries filter active records
.where(and(
  eq(tutorialNavigationProgress.userId, userId),
  activeProgress  // ← Filters deletedAt IS NULL
))
```

**Facts:**
- ✅ Repository defines `activeProgress` helper
- ✅ All queries include soft-delete filter
- ✅ No database-level view/trigger
- ✅ Application enforces filtering

---

### Soft Delete Semantics

**Not Deleted:**
- `deletedAt: null`
- Appears in queries with `WHERE deleted_at IS NULL`
- Unique constraints apply

**Soft Deleted:**
- `deletedAt: [timestamp]`
- Filtered out by application queries
- Unique constraints don't apply (can have "duplicates")
- Data preserved for audit/recovery

---

### Phase 4.1 Soft Delete Decision

**VERIFIED CONVENTION:**
```typescript
deletedAt: timestamp('deleted_at', { mode: 'date' })
```

**Must Include:**
1. ✅ Nullable timestamp field
2. ✅ Partial unique index: `.where(sql`${table.deletedAt} IS NULL`)`
3. ✅ Repository helper: `const activeBlockState = isNull(blockLearningState.deletedAt)`
4. ✅ All queries filter by active state

**No Contradiction with Frozen Architecture:** Soft-delete is standard repository pattern.

---

## STEP 9: Existing ILS Table Pattern

### Inspected Table: tutorial_navigation_progress

**Location:** `packages/db-tutorial/src/schema/tutorial-navigation-progress.ts`

**Full Schema:**
```typescript
export const tutorialNavigationProgress = pgTable('tutorial_navigation_progress', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Learner Identity
  userId: uuid('user_id').notNull(),
  
  // Navigation Identity
  navigationNodeId: text('navigation_node_id').notNull(),
  
  // Content Identity
  sectionId: uuid('section_id'),
  subtopicId: uuid('subtopic_id').notNull(),
  
  // Progress State
  status: tutorialProgressStatusEnum('status').notNull().default('not_started'),
  
  // Block Completion
  completedBlocks: jsonb('completed_blocks').$type<CompletedBlockRecord[]>().notNull().default([]),
  
  // Time Tracking
  timeSpentActiveSec: integer('time_spent_active_sec').notNull().default(0),
  
  // Session Tracking
  visitCount: integer('visit_count').notNull().default(0),
  revisionCount: integer('revision_count').notNull().default(0),
  lastSessionId: text('last_session_id'),
  
  // Timestamps
  firstViewedAt: timestamp('first_viewed_at', { mode: 'date' }),
  lastViewedAt: timestamp('last_viewed_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  
  // Audit Fields
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  // Unique constraint (partial - active records only)
  uqNavigationProgressUserNode: uniqueIndex('uq_navigation_progress_user_node')
    .on(table.userId, table.navigationNodeId)
    .where(sql`${table.deletedAt} IS NULL`),
  
  // Query indexes
  idxNavigationProgressUser: index('idx_navigation_progress_user')
    .on(table.userId),
  
  idxNavigationProgressSubtopic: index('idx_navigation_progress_subtopic')
    .on(table.userId, table.subtopicId),
  
  idxNavigationProgressNode: index('idx_navigation_progress_node')
    .on(table.navigationNodeId),
  
  idxNavigationProgressLastViewed: index('idx_navigation_progress_last_viewed')
    .on(table.userId, table.lastViewedAt),
}));
```

---

### Pattern Analysis for Phase 4.1

**Fields to Mirror:**
- ✅ `userId: uuid` (learner identity)
- ✅ `visitCount: integer` (counter with default 0)
- ✅ `revisionCount: integer` (counter with default 0)
- ✅ `timeSpentActiveSec: integer` → translate to `activeTimeSec`
- ✅ `firstViewedAt: timestamp` (nullable)
- ✅ `lastViewedAt: timestamp` (nullable)
- ✅ `completedAt: timestamp` (nullable)
- ✅ `version: integer` (optimistic locking)
- ✅ `createdAt: timestamp` (NOT NULL, defaultNow)
- ✅ `updatedAt: timestamp` (NOT NULL, defaultNow)
- ✅ `deletedAt: timestamp` (nullable, soft-delete)

**Fields NOT to Include:**
- ❌ `status` enum (page-level concern, not block-level)
- ❌ `lastSessionId` (visit-owned state, managed by page-level ILS)
- ❌ `sectionId` (content resolution, not needed for block telemetry)

---

### Index Strategy Insights

**Required Indexes for block_learning_state:**

1. **Unique Identity (Partial):**
   ```typescript
   uqBlockLearningStateIdentity: uniqueIndex('uq_block_learning_state_identity')
     .on(table.userId, table.navigationNodeId, table.blockId, table.blockVersion)
     .where(sql`${table.deletedAt} IS NULL`)
   ```

2. **User Query (Dashboard):**
   ```typescript
   idxBlockLearningStateUser: index('idx_block_learning_state_user')
     .on(table.userId)
   ```

3. **Navigation Node Query (Page Aggregation):**
   ```typescript
   idxBlockLearningStateNode: index('idx_block_learning_state_node')
     .on(table.userId, table.navigationNodeId)
   ```

4. **Block Query (Cross-Page Block Analytics):**
   ```typescript
   idxBlockLearningStateBlock: index('idx_block_learning_state_block')
     .on(table.blockId, table.blockVersion)
   ```

5. **Last Viewed Query (Recommendations):**
   ```typescript
   idxBlockLearningStateLastViewed: index('idx_block_learning_state_last_viewed')
     .on(table.userId, table.lastViewedAt)
   ```

---

### Session Identity Analysis

**Observation:** Page-level ILS stores `lastSessionId` for visit tracking.

**Question:** Should block-level telemetry include `lastSessionId`?

**Analysis:**
- Page-level: Uses `lastSessionId` to detect session transitions (visit increment)
- Block-level: Visit semantics could be similar (first view in new session)
- Frozen architecture: Independent page/block metrics

**Recommendation:** ⚠️ **DO NOT include `lastSessionId` in Phase 4.1**

**Rationale:**
1. Visit detection belongs to page-level orchestration
2. Block-level visits can be derived from page visit context
3. Avoid session state duplication
4. Repository layer (Phase 4.2) can manage visit logic without storing session ID
5. Simpler schema for Phase 4.1
6. Can add later if needed

---

## Next Steps

Continue to Part 3 for implementation decision, proposed schema, and validation checklist.

---

**Status:** Part 2 Complete - Database Conventions Verified  
**Next:** Part 3 - Implementation Decision & Schema Design
