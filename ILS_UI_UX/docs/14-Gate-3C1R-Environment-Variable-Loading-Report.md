# GATE 3C.1R - ENVIRONMENT VARIABLE LOADING REPORT
## How Successful Scripts Resolved DATABASE_URL_TUTORIAL Errors

**Date:** 2026-09-10  
**Purpose:** Document proven patterns for loading .env.local in test scripts

---

## ERROR ENCOUNTERED

```
Error: DATABASE_URL_TUTORIAL environment variable is required
    at getTutorialDb (E:\onlinewebsites\quiz-platform\packages\db-tutorial\src\db.ts:67:11)
```

**Cause:** The centralized `db` instance from `packages/db-tutorial/src/db.ts` requires environment variables to be loaded BEFORE importing the module.

---

## ROOT CAUSE ANALYSIS

### The Centralized DB Module

**File:** `packages/db-tutorial/src/db.ts` (line 67)

```typescript
export function getTutorialDb(): ReturnType<typeof drizzle> {
  const url = process.env.DATABASE_URL_TUTORIAL;
  
  if (!url) {
    throw new Error('DATABASE_URL_TUTORIAL environment variable is required');
  }
  
  // ... create connection
}
```

**Critical Requirement:**  
`process.env.DATABASE_URL_TUTORIAL` must exist **BEFORE** the `db` module is imported.

### Import Order Matters

❌ **WRONG (Causes Error):**
```typescript
import { db } from '../packages/db-tutorial/src/db'; // ← DB imported FIRST
import { config } from 'dotenv';
config({ path: '.env.local' }); // ← TOO LATE!
```

✅ **CORRECT:**
```typescript
import { config } from 'dotenv';
config({ path: '.env.local' }); // ← ENV loaded FIRST
import { db } from '../packages/db-tutorial/src/db'; // ← THEN import db
```

---

## SUCCESSFUL PATTERNS FROM CODEBASE

### Pattern 1: Named Import from dotenv (Simpler)

**Used by:**
- `scripts/_gate_3c1r_test_write_path.ts` (Phase B - SUCCESSFUL)
- `scripts/_gate_3c1r_test_phase_c_repository.ts` (Phase C - SUCCESSFUL)
- `scripts/_inspect_sql_only.ts`
- `scripts/_test_drizzle_generated_sql.ts`

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });

// NOW safe to import modules that need env vars
import { db } from '../packages/db-tutorial/src/db';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
```

**Path Resolution:**
- `'.env.local'` resolves relative to current working directory (CWD)
- Works when script is run from workspace root: `npx tsx scripts/my-script.ts`

### Pattern 2: Default Import with path.resolve (More Explicit)

**Used by:**
- `scripts/_query_rth_block_visit.ts` (Phase 4.6 RTH - SUCCESSFUL)
- `scripts/_delete_rth_block_visit.ts`
- `scripts/_query_suia_block_visit.ts`
- `scripts/_cleanup_integration_test_data.ts`

```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// NOW safe to import modules that need env vars
import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
```

**Path Resolution:**
- `__dirname` = directory where the script file is located
- `path.resolve(__dirname, '../.env.local')` = absolute path to .env.local

**Why This Works Better:**
- Works regardless of current working directory
- More explicit and safer for nested script locations

### Pattern 3: process.cwd() Resolution (Alternative)

**Used by:**
- `scripts/verify-layman-removal.ts`
- `scripts/verify-current-db-state.ts`
- `scripts/phase-a3-final-closure.ts`

```typescript
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '@quiz/db-tutorial';
```

**Path Resolution:**
- `process.cwd()` = current working directory (where command was run)
- Same as Pattern 1 but more explicit

---

## COMPARISON: TWO WORKING DATABASE CONNECTION APPROACHES

### Approach A: Centralized DB Instance (Phase 4.6 Pattern)

✅ **RECOMMENDED FOR PRODUCTION-LIKE TESTS**

```typescript
import dotenv from 'dotenv';
import path from 'path';

// STEP 1: Load env vars FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// STEP 2: Import centralized db instance
import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { eq, and, isNull } from 'drizzle-orm';

// STEP 3: Use it directly
const records = await db
  .select()
  .from(blockLearningState)
  .where(
    and(
      eq(blockLearningState.userId, userId),
      isNull(blockLearningState.deletedAt)
    )
  );
```

**Advantages:**
- Uses same db instance as production code
- Consistent connection pooling
- Easier to maintain
- Matches repository pattern

**Proven Success:**
- Phase 4.6 RTH E2E verification (commit 159441e9)
- Phase C repository test (100% success)

### Approach B: Manual Pool Creation (Phase B Pattern)

✅ **USED WHEN TESTING RAW REPOSITORY BEHAVIOR**

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';

// Manual pool creation
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  webSocketConstructor: ws as any
});

const db = drizzle(pool);

// Pass to repository
const repo = new BlockLearningStateRepository(db);

// Don't forget cleanup
await pool.end();
```

**Advantages:**
- Full control over connection lifecycle
- Explicit cleanup
- Can test edge cases (connection failures, etc.)

**Proven Success:**
- Phase B write path verification (commit 5b1487c7)

---

## EXECUTION COMMANDS THAT WORK

### From Workspace Root

```powershell
# Pattern 1 (simple path)
npx tsx scripts/_gate_3c1r_test_phase_c_repository.ts

# Pattern 2 (__dirname resolution)
npx tsx scripts/_query_rth_block_visit.ts
```

### From Subdirectory (requires Pattern 2)

```powershell
cd scripts
npx tsx _query_rth_block_visit.ts  # ✅ Works (uses __dirname)
npx tsx _gate_3c1r_test_write_path.ts  # ❌ May fail (uses relative '.env.local')
```

---

## INLINE EXECUTION PATTERN

### ❌ FAILS (What You Tried)

```powershell
npx tsx -e "import { db } from './packages/db-tutorial/src/db'; ..."
```

**Why It Fails:**
- No opportunity to load .env.local BEFORE importing db
- `-e` flag executes code immediately
- Import happens before env vars can be set

### ✅ WORKAROUND (If Inline Needed)

Create a dedicated script file:

```typescript
// scripts/_check_navigation_node.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../packages/db-tutorial/src/db';
import { tutorialSections } from '../packages/db-tutorial/src/schema/tutorial-sections';
import { eq } from 'drizzle-orm';

(async () => {
  const sections = await db
    .select()
    .from(tutorialSections)
    .where(eq(tutorialSections.navigationNodeId, 'whatisjava'))
    .limit(1);
  
  console.log(JSON.stringify(sections, null, 2));
})();
```

Then run:
```powershell
npx tsx scripts/_check_navigation_node.ts
```

---

## RECOMMENDED PATTERN FOR NEW SCRIPTS

**Use Pattern 2 (Phase 4.6 Style) for Maximum Reliability:**

```typescript
/**
 * Script Purpose: [describe what it does]
 * 
 * Environment: Requires .env.local with DATABASE_URL_TUTORIAL
 */

import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment variables BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// NOW safe to import modules that depend on env vars
import { db } from '../packages/db-tutorial/src/db';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';

// Your script logic here
(async () => {
  try {
    const repo = new BlockLearningStateRepository(db);
    // ... do work
    
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  }
})();
```

---

## ENVIRONMENT FILE LOCATION

**Expected Location:** `e:\onlinewebsites\quiz-platform\.env.local`

**Required Variables:**
```bash
DATABASE_URL_TUTORIAL=postgresql://user:password@host:port/database
DATABASE_URL_PEOPLE=postgresql://user:password@host:port/database
# ... other vars
```

**Verification:**
```powershell
# Check if .env.local exists
Test-Path .env.local

# Check if it has DATABASE_URL_TUTORIAL
Select-String -Path .env.local -Pattern "DATABASE_URL_TUTORIAL"
```

---

## TROUBLESHOOTING CHECKLIST

### ✅ Pre-Flight Checks

1. **File exists:**
   ```powershell
   Test-Path .env.local
   ```

2. **Contains required var:**
   ```powershell
   Select-String -Path .env.local -Pattern "DATABASE_URL_TUTORIAL"
   ```

3. **Import order correct:**
   - dotenv config FIRST
   - module imports AFTER

4. **Running from correct directory:**
   ```powershell
   Get-Location  # Should be workspace root
   ```

### ❌ Common Mistakes

1. **Importing db before loading env:**
   ```typescript
   import { db } from './packages/db-tutorial/src/db'; // ❌ TOO EARLY
   import { config } from 'dotenv';
   config({ path: '.env.local' });
   ```

2. **Wrong path to .env.local:**
   ```typescript
   config({ path: '.env' });  // ❌ Wrong file
   config({ path: '../.env.local' });  // ❌ Wrong relative path
   ```

3. **Using -e flag for complex imports:**
   ```powershell
   npx tsx -e "import { db } from '...'"  # ❌ Can't load env first
   ```

4. **Running from wrong directory:**
   ```powershell
   cd packages/db-tutorial
   npx tsx ../../scripts/my-script.ts  # ❌ CWD mismatch
   ```

---

## PROVEN SUCCESSFUL EXECUTION HISTORY

### Phase B Write Path (commit 5b1487c7)
```powershell
npx tsx scripts/_gate_3c1r_test_write_path.ts
# ✅ SUCCESS - All 6 tests passed
# Pattern: config({ path: '.env.local' })
# Connection: Manual pool
```

### Phase 4.6 RTH Verification (commit 159441e9)
```powershell
npx tsx scripts/_query_rth_block_visit.ts
# ✅ SUCCESS - All verification checks passed
# Pattern: dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
# Connection: Centralized db instance
```

### Phase C Repository Test (just executed)
```powershell
npx tsx scripts/_gate_3c1r_test_phase_c_repository.ts
# ✅ SUCCESS - All 8 tests passed
# Pattern: config({ path: '.env.local' })
# Connection: Centralized db instance
```

---

## SOLUTION FOR YOUR SPECIFIC CASE

To check if `whatisjava` navigation node exists, create this script:

**File:** `scripts/_check_whatisjava_node.ts`

```typescript
import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load env BEFORE importing db
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db } from '../packages/db-tutorial/src/db';
import { tutorialSections } from '../packages/db-tutorial/src/schema/tutorial-sections';
import { eq } from 'drizzle-orm';

(async () => {
  try {
    console.log('Checking for whatisjava navigation node...\n');
    
    const sections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.navigationNodeId, 'whatisjava'))
      .limit(1);
    
    if (sections.length > 0) {
      console.log('✅ Navigation node found:');
      console.log(JSON.stringify(sections[0], null, 2));
    } else {
      console.log('❌ Navigation node NOT found');
      console.log('Available nodes can be queried with a different script');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  }
})();
```

**Execution:**
```powershell
npx tsx scripts/_check_whatisjava_node.ts
```

---

## SUMMARY

**Two Proven Patterns:**

1. **Simple (Phase B/C):** `config({ path: '.env.local' })`
2. **Explicit (Phase 4.6):** `dotenv.config({ path: path.resolve(__dirname, '../.env.local') })`

**Critical Rule:**  
Environment loading MUST happen BEFORE any imports that depend on those variables.

**Recommended:**  
Use Pattern 2 (explicit path resolution) for maximum reliability across different execution contexts.

**All Successful Scripts Follow This Order:**
1. Import dotenv
2. Load .env.local
3. Import db and other modules
4. Execute logic
5. Cleanup if needed

This pattern has **100% success rate** across Phase B, Phase 4.6, and Phase C tests.
