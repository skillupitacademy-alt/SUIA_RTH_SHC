# GATE 3C.1R - PHASE A STUDY FINDINGS
## Database Connection, UUID, and Working Test Patterns

**Date:** 2026-09-09  
**Purpose:** Study successful test patterns before Phase B execution

---

## KEY FINDINGS

### 1. ACTUAL DATABASE SCHEMA (Migration 0023 + 0024)

```sql
CREATE TABLE "block_learning_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "navigation_node_id" text NOT NULL,
  "block_id" text NOT NULL,
  "block_version" text NOT NULL,
  "visit_count" integer DEFAULT 0 NOT NULL,
  "revision_count" integer DEFAULT 0 NOT NULL,
  "active_time_sec" integer DEFAULT 0 NOT NULL,
  "expected_time_sec" integer,
  "first_viewed_at" timestamp,
  "last_viewed_at" timestamp,
  "completed_at" timestamp,
  "last_session_id" text,  -- Added in migration 0024
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
```

**CRITICAL NOTES:**
- ❌ NO `brand` column
- ❌ NO `subtopic_id` column
- ✅ Column is `active_time_sec` NOT `cumulative_active_time_sec`
- ✅ Has `last_session_id` (Phase 4.6)

### 2. CORRECT UUID FORMAT

**WRONG:**
```typescript
const testUserId = '00000000-0000-0000-0000-test1c1ruser01';  // ❌ Invalid UUID
```

**CORRECT:**
```typescript
const testUserId = '00000000-0000-0000-0000-0000000test1';   // ✅ Valid UUID (36 chars)
```

**Pattern:** UUID must be exactly 36 characters with proper format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3. DATABASE CONNECTION PATTERNS

#### Pattern A: Direct pg Client (gate-4k script)
```javascript
import { Client } from 'pg';

const client = new Client({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL 
});

await client.connect();
const result = await client.query('SELECT * FROM ...', [params]);
await client.end();
```

#### Pattern B: Drizzle ORM (repository)
```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  webSocketConstructor: ws as any
});

const db = drizzle(pool);

// Use with repository
const repo = new BlockLearningStateRepository(db);
```

### 4. WORKING TEST DATA PATTERNS

From repository tests:
```typescript
const makeBlockState = (overrides = {}) => ({
  id: 'block-state-1',                    // ✅ Any string ID
  userId: 'user-1',                       // ✅ Simple test UUID
  navigationNodeId: 'what-is-java',       // ✅ Text slug
  blockId: 'block-123',                   // ✅ Simple block ID
  blockVersion: 'D1',                     // ✅ Version code
  visitCount: 0,
  revisionCount: 0,
  activeTimeSec: 0,
  expectedTimeSec: null,
  firstViewedAt: null,
  lastViewedAt: null,
  completedAt: null,
  lastSessionId: null,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});
```

From gate-4k (but with wrong column names):
```javascript
// ✅ Good navigation node ID
navigationNodeId: 'whatisjava'

// ✅ Good subtopic ID (but not in block_learning_state schema!)
subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499'

// ✅ Good block ID pattern
blockId: 'gate-4k-certification-block'

// ✅ Good version
blockVersion: 'D1'
```

### 5. REPOSITORY UPSERT SIGNATURE

```typescript
interface UpsertBlockLearningStateInput {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  lastSessionId?: string | null;
  expectedTimeSec?: number | null;
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}

await repo.upsert({
  userId: 'user-1',
  navigationNodeId: 'test-node',
  blockId: 'test-block-id',
  blockVersion: 'D1',
  lastSessionId: 'session-123',      // ✅ For session-aware visits
  expectedTimeSec: 120,               // ✅ Optional
});
```

### 6. SQL GENERATION VERIFICATION PATTERN

The existing `_inspect_sql_only.ts` script shows the correct verification:

```typescript
const sqlData = query.toSQL();
const sqlText = sqlData.sql.toLowerCase();

// Check WHERE clause position
const onConflictIdx = sqlText.indexOf('on conflict');
const doUpdateIdx = sqlText.indexOf('do update');
const whereIdx = sqlText.indexOf('where');

if (whereIdx > onConflictIdx && whereIdx < doUpdateIdx) {
  console.log('✅ CORRECT: WHERE between ON CONFLICT and DO UPDATE');
} else {
  console.log('❌ INCORRECT: 42P10 will occur');
}
```

**Result from script:**
```
VARIANT B: Using `targetWhere` parameter
✅ CORRECT: WHERE is between ON CONFLICT and DO UPDATE
SQL pattern: ON CONFLICT (...) WHERE ... DO UPDATE ...
```

### 7. ERROR LESSONS FROM GATE-4K SCRIPT

The gate-4k script has these issues:
1. ❌ Queries `brand` column (doesn't exist in block_learning_state)
2. ❌ Queries `subtopic_id` column (doesn't exist in block_learning_state)
3. ❌ Queries `cumulative_active_time_sec` (actual column is `active_time_sec`)

**Correct query pattern:**
```sql
SELECT * FROM block_learning_state
WHERE user_id = $1
  AND navigation_node_id = $2
  AND block_id = $3
  AND block_version = $4
  AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 1;
```

### 8. ENVIRONMENT VARIABLES NEEDED

```bash
DATABASE_URL_TUTORIAL=postgresql://...
DATABASE_URL_PEOPLE=postgresql://...  # For user ID lookup (if needed)
```

---

## CORRECT TEST SCRIPT PATTERN

Based on study, here's the correct pattern:

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  webSocketConstructor: ws as any
});

const db = drizzle(pool);
const repo = new BlockLearningStateRepository(db);

// ✅ Valid test UUID
const testUserId = '00000000-0000-0000-0000-000000000001';

// ✅ Test D1 visit
const d1Result = await repo.upsert({
  userId: testUserId,
  navigationNodeId: 'test-node',
  blockId: 'test-d1-block',
  blockVersion: 'D1',
  lastSessionId: 'session-001',
  expectedTimeSec: 120,
});

console.log('Visit count:', d1Result.visitCount);
console.log('Active time:', d1Result.activeTimeSec);

// ✅ Cleanup
await db.execute(
  `DELETE FROM block_learning_state WHERE user_id = '${testUserId}'`
);

await pool.end();
```

---

## PHASE B READINESS ASSESSMENT

✅ **READY TO PROCEED** with Phase B using correct patterns:

1. ✅ Understand actual database schema
2. ✅ Know correct UUID format
3. ✅ Have working database connection pattern
4. ✅ Know repository upsert signature
5. ✅ Understand SQL generation verification
6. ✅ Have correct column names
7. ✅ Have cleanup pattern

**CRITICAL:**
- Use `active_time_sec` NOT `cumulative_active_time_sec`
- DO NOT query `brand` or `subtopic_id` columns
- Use proper UUID format (36 chars)
- Use `targetWhere` in repository (already correct)

---

## NEXT: PHASE B EXECUTION

With these patterns verified, Phase B can now:
1. Create correct test script with proper UUIDs
2. Execute repository upsert tests
3. Verify NO 42P10 error occurs
4. Confirm D1/C1 work generically
5. Verify session-aware visit counting
6. Verify active time accumulation

**Expected Result:** Repository already uses `targetWhere` correctly, so 42P10 should NOT occur.
