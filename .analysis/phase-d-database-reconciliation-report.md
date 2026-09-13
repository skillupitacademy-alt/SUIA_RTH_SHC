# PHASE D DATABASE RECONCILIATION REPORT

**Date:** 2026-09-10  
**Gate:** 3C.1R Phase D  
**Checkpoint:** Database Inspection Schema Reconciliation

---

## EXECUTIVE SUMMARY

✅ **DATABASE SCHEMA IS CORRECT AND MATCHES SOURCE CONTRACT**

The database inspection script failed 8 type tests because it expected different PostgreSQL types than what the authoritative Drizzle schema and migrations actually define.

**Critical Finding:** The repository's ON CONFLICT target is fully supported by the existing partial unique index. No database changes required.

---

## RECONCILIATION MATRIX

| Column             | Drizzle Declaration | Migration SQL | Actual PostgreSQL | Status |
|--------------------|---------------------|---------------|-------------------|--------|
| id                 | `uuid('id').primaryKey().defaultRandom()` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `uuid` | ✅ MATCH |
| user_id            | `uuid('user_id').notNull()` | `uuid NOT NULL` | `uuid` | ✅ MATCH |
| navigation_node_id | `text('navigation_node_id').notNull()` | `text NOT NULL` | `text` | ✅ MATCH |
| block_id           | `text('block_id').notNull()` | `text NOT NULL` | `text` | ✅ MATCH |
| block_version      | `text('block_version').notNull()` | `text NOT NULL` | `text` | ✅ MATCH |
| visit_count        | `integer('visit_count').notNull().default(0)` | `integer DEFAULT 0 NOT NULL` | `integer` | ✅ MATCH |
| revision_count     | `integer('revision_count').notNull().default(0)` | `integer DEFAULT 0 NOT NULL` | `integer` | ✅ MATCH |
| active_time_sec    | `integer('active_time_sec').notNull().default(0)` | `integer DEFAULT 0 NOT NULL` | `integer` | ✅ MATCH |
| expected_time_sec  | `integer('expected_time_sec')` | `integer` (nullable) | `integer` nullable | ✅ MATCH |
| first_viewed_at    | `timestamp('first_viewed_at', { mode: 'date' })` | `timestamp` | `timestamp without time zone` | ✅ MATCH |
| last_viewed_at     | `timestamp('last_viewed_at', { mode: 'date' })` | `timestamp` | `timestamp without time zone` | ✅ MATCH |
| last_session_id    | `text('last_session_id')` | `text` (added in migration 0024) | `text` nullable | ✅ MATCH |
| completed_at       | `timestamp('completed_at', { mode: 'date' })` | `timestamp` | `timestamp without time zone` | ✅ MATCH |
| version            | `integer('version').notNull().default(1)` | `integer DEFAULT 1 NOT NULL` | `integer` | ✅ MATCH |
| created_at         | `timestamp('created_at', { mode: 'date' }).notNull().defaultNow()` | `timestamp DEFAULT now() NOT NULL` | `timestamp without time zone` | ✅ MATCH |
| updated_at         | `timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()` | `timestamp DEFAULT now() NOT NULL` | `timestamp without time zone` | ✅ MATCH |
| deleted_at         | `timestamp('deleted_at', { mode: 'date' })` | `timestamp` | `timestamp without time zone` | ✅ MATCH |

---

## DETAILED FINDINGS

### 1. PRIMARY KEY

**Actual:** `id` (single column UUID)

**Source:** 
```typescript
// Drizzle schema
id: uuid('id').primaryKey().defaultRandom()
```

```sql
-- Migration 0023
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
```

**Status:** ✅ CORRECT

The architecture intentionally uses a surrogate key primary key pattern, not a composite natural key.

---

### 2. UNIQUE CONFLICT INDEX

**Actual:** `uq_block_learning_state_identity`

**Definition:**
```sql
CREATE UNIQUE INDEX "uq_block_learning_state_identity" 
ON "block_learning_state" 
USING btree ("user_id","navigation_node_id","block_id","block_version") 
WHERE "block_learning_state"."deleted_at" IS NULL
```

**Repository ON CONFLICT Target:**
```typescript
.onConflictDoUpdate({
  target: [
    blockLearningState.userId,
    blockLearningState.navigationNodeId,
    blockLearningState.blockId,
    blockLearningState.blockVersion,
  ],
  targetWhere: sql`${blockLearningState.deletedAt} IS NULL`,
  // ...
})
```

**Status:** ✅ PERFECT MATCH

The partial unique index exactly matches the repository's ON CONFLICT specification.

---

### 3. ON CONFLICT COMPATIBILITY

**Result:** ✅ PASS

The PostgreSQL partial unique index provides the exact conflict detection surface required by `BlockLearningStateRepository.upsert()`.

No 42P10 risk detected.

---

### 4. DRIZZLE VS POSTGRESQL

**Result:** ✅ MATCH

All columns match their Drizzle declarations exactly.

---

### 5. MIGRATION VS POSTGRESQL

**Result:** ✅ MATCH

The applied migrations (0023 + 0024) match the current PostgreSQL schema exactly.

---

### 6. navigation_node_id

**Contract:** `text` (Drizzle uses `text()` for string columns)  
**DB:** `text`  
**Status:** ✅ MATCH

**Why text, not varchar?**
- Drizzle ORM uses `text()` as the default string type
- PostgreSQL `text` is unlimited length, more flexible than `varchar`
- Navigation node IDs are string identifiers of variable length
- This is intentional and correct

---

### 7. block_id

**Contract:** `text` (not UUID)  
**DB:** `text`  
**Status:** ✅ MATCH

**Why text, not UUID?**

From the Drizzle schema comments:
```typescript
// Block Identity (scoped to navigation node)
blockId: text('block_id').notNull(),  // UUID stored as text (canonical block identity)
```

**Critical architectural decision:** Block IDs are stored as text to support the **universal block architecture**. While current D1/C1 blocks use UUID format, the system must remain generic and support any block identifier format.

This is **intentional universality**, not a defect.

---

### 8. block_version

**Contract:** `text`  
**DB:** `text`  
**Status:** ✅ MATCH

Block versions are string identifiers ('D1', 'C1', 'S1', etc.), not enums or integers. Text is the correct type.

---

### 9. timestamp columns

**Contract:** `timestamp without time zone` (Drizzle default)  
**DB:** `timestamp without time zone`  
**Status:** ✅ MATCH

**Why without time zone?**

Drizzle's `timestamp('name', { mode: 'date' })` generates PostgreSQL `timestamp` type (without time zone) by default.

The migration confirms this:
```sql
"first_viewed_at" timestamp,
"last_viewed_at" timestamp,
"created_at" timestamp DEFAULT now() NOT NULL,
"updated_at" timestamp DEFAULT now() NOT NULL,
"deleted_at" timestamp
```

The application handles timezone conversions at the serialization boundary (API responses, DTO layer).

This is a **valid architectural pattern** and matches the rest of the codebase's timestamp handling.

---

### 10. last_session_id

**Contract:** `text` (not UUID)  
**DB:** `text`  
**Status:** ✅ MATCH

**Why text, not UUID?**

From Drizzle schema:
```typescript
// Session Tracking (Phase 4.6 - Atomic session-aware metrics)
lastSessionId: text('last_session_id'),  // Nullable - NULL = no prior session
```

Migration 0024:
```sql
ALTER TABLE "block_learning_state" ADD COLUMN "last_session_id" text;
```

While session IDs may be UUID-shaped in current implementation, the schema intentionally uses `text` to support flexible session identifier formats. This is **generic by design**.

---

### 11. 42P10 RISK

**Status:** ✅ CLEAR

The partial unique index:
```
(user_id, navigation_node_id, block_id, block_version) 
WHERE deleted_at IS NULL
```

exactly matches the repository's ON CONFLICT target. No conflict detection errors expected.

---

### 12. DATABASE INSPECTION SCRIPT

**Current Status:** ❌ FAIL (8 type mismatches)

**Root Cause:** The inspection script expected types that don't match the authoritative Drizzle schema

**Required Action:** Update inspection script to validate against actual contract, not assumptions

**Specific Corrections Needed:**

1. `navigation_node_id`: expect `text`, not `character varying`
2. `block_id`: expect `text`, not `uuid`
3. `block_version`: expect `text`, not `character varying`
4. `first_viewed_at`: expect `timestamp without time zone`, not `timestamp with time zone`
5. `last_viewed_at`: expect `timestamp without time zone`, not `timestamp with time zone`
6. `last_session_id`: expect `text`, not `uuid`
7. `created_at`: expect `timestamp without time zone`, not `timestamp with time zone`
8. `updated_at`: expect `timestamp without time zone`, not `timestamp with time zone`

---

### 13. UNIVERSAL INSPECTION

**Status:** PENDING

Not yet executed. Next step after database inspection passes.

---

### 14. LIFECYCLE SEMANTICS

**Status:** REQUIRES DOCUMENTATION

Before implementing lifecycle tests, must inspect actual implementation of:

- `recordBlockVisit()` - session-aware visit counting
- `recordBlockActiveTime()` - independent time tracking
- `recordBlockCompletion()` - routes through TutorialNavigationProgressRepository
- Repository atomic SQL logic for visit/revision increments

---

### 15. PERMISSION TO IMPLEMENT LIFECYCLE TESTS

**Status:** ⏸️ NO - NOT YET

**Blockers:**
1. Database inspection script must pass (requires correction)
2. Universal inspection must run
3. Lifecycle semantics must be documented

**After these three steps complete:** YES

---

## ARCHITECTURAL OBSERVATIONS

### Text vs UUID Pattern

The schema intentionally uses `text` for:
- `navigation_node_id` - string identifier, variable length
- `block_id` - universal block identifier (UUID-shaped but generic)
- `block_version` - version label ('D1', 'C1', etc.)
- `last_session_id` - session identifier (UUID-shaped but generic)

This is **universal by design**. The architecture does not hardcode UUID types, allowing flexibility for different identifier formats across brands, block types, and session systems.

### Timestamp Pattern

All timestamps use `timestamp without time zone`. This is consistent with:
- Drizzle ORM defaults
- Existing migrations
- Application-level timezone handling

The pattern is: store UTC timestamps, convert at API boundary.

### Soft Delete Pattern

The partial unique index with `WHERE deleted_at IS NULL` supports soft deletes while maintaining uniqueness constraints only on active records. This is a proven PostgreSQL pattern.

### Surrogate Key Pattern

Using `id` as primary key (surrogate key) while maintaining business logic uniqueness through a separate unique index is a valid relational design pattern. It:
- Simplifies foreign key relationships
- Supports soft deletes with partial unique indexes
- Separates physical identity from logical identity

---

## VERDICT

### Database Schema: ✅ CORRECT

The PostgreSQL schema perfectly matches the authoritative Drizzle schema and applied migrations. No database changes required.

### Repository Contract: ✅ ALIGNED

The repository's ON CONFLICT target is fully supported by the partial unique index.

### Phase D Blocker: ✅ RESOLVED

The original concern about 42P10 errors is addressed. The unique index exists and matches the conflict target.

### Next Action: 🔧 FIX INSPECTION SCRIPT

The database inspection script must be corrected to validate against the **actual contract**, not incorrect assumptions.

After correction, proceed to universal inspection and lifecycle semantic documentation.

---

## RECOMMENDED NEXT STEPS

1. ✅ **COMPLETE:** Schema reconciliation
2. ⏭️ **NEXT:** Correct database inspection script expectations
3. ⏭️ **NEXT:** Re-run database inspection (must pass)
4. ⏭️ **NEXT:** Run universal architecture inspection
5. ⏭️ **NEXT:** Document lifecycle semantics from actual repository implementation
6. ⏭️ **NEXT:** Implement 34-scenario lifecycle runtime tests

**DO NOT:**
- ❌ Change database schema
- ❌ Change migrations  
- ❌ Change repository code
- ❌ Proceed to lifecycle tests without completing steps 2-5

---

## CONCLUSION

The Phase D database inspection revealed **no actual database defects**. The schema is correct, the migrations are correct, and the repository contract is satisfied.

The inspection script failure was due to **incorrect test expectations**, not database problems.

**Phase D remains GREEN for database architecture.**

Next checkpoint: Universal inspection + lifecycle semantic documentation.
