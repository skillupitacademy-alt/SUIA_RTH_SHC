# Checkpoint 5 - Database Connection Fix

## Issue Identified

Initial E2E test attempted to use vanilla `pg.Client` with local PostgreSQL config, which failed because:

1. **Project uses Neon Serverless** - not local PostgreSQL
2. **Multi-database architecture** - not a single database
3. **Wrong connection pattern** - should use `drizzle-orm/neon-http` with `@neondatabase/serverless`

## Errors Encountered

### Error 1: AggregateError (empty context)
- **Cause**: Using `pg.Client` instead of Neon client
- **Fix**: Switched to `neon()` + `drizzle()`

### Error 2: `DATABASE_URL not configured`
- **Cause**: Playwright not loading `.env.local`
- **Fix**: Added `dotenv.config({ path: resolve(process.cwd(), '.env.local') })`

### Error 3: `relation "User" does not exist`
- **Cause**: Wrong database - `User` table is in `people_prod`, not `quiz_platform_prod`
- **Fix**: Use TWO database connections

## Correct Architecture

The project uses **multiple Neon databases**:

| Database | Env Var | Contains |
|----------|---------|----------|
| **people_prod** | `DATABASE_URL_PEOPLE` | `User` table (authentication/identity) |
| **tutorial_prod** | `DATABASE_URL_TUTORIAL` | `tutorial_navigation_progress` (ILS tracking) |
| quiz_platform_prod | `DATABASE_URL` | Main quiz data |
| rth_prod | `DATABASE_URL_RTH` | RealTutorialHub brand data |
| skillup_prod | `DATABASE_URL_SKILLUP` | SkillUp brand data |

## Corrected Test Pattern

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// TWO database connections
const PEOPLE_DATABASE_URL = process.env.DATABASE_URL_PEOPLE;
const TUTORIAL_DATABASE_URL = process.env.DATABASE_URL_TUTORIAL;

// Query User table (people_prod)
async function getLearnerId(email: string): Promise<string | null> {
  const sqlClient = neon(PEOPLE_DATABASE_URL);
  const db = drizzle(sqlClient);
  const result = await db.execute(sql`SELECT id FROM "User" WHERE email = ${email}`);
  return result.rows[0]?.id || null;
}

// Query tutorial_navigation_progress (tutorial_prod)
async function queryProgress(learnerId, nodeId, subtopicId): Promise<ProgressRow | null> {
  const sqlClient = neon(TUTORIAL_DATABASE_URL);
  const db = drizzle(sqlClient);
  const result = await db.execute(sql`
    SELECT * FROM tutorial_navigation_progress 
    WHERE learner_id = ${learnerId} AND navigation_node_id = ${nodeId}
  `);
  return result.rows[0] || null;
}
```

## Reference Scripts

Existing scripts that use this pattern:
- `scripts/.tmp-gate-2.3-db-forensic.mjs` - Uses `neon()` + `drizzle()` with `DATABASE_URL`
- `scripts/phase1-db-verification-gate.mjs` - Uses `DATABASE_URL_TUTORIAL` for tutorial tables
- `scripts/check-skillhubcore-users.mjs` - Uses `DATABASE_URL_PEOPLE` for User table
- `scripts/audit-db-people.mjs` - Uses `DATABASE_URL_PEOPLE` with Neon Pool

## Status

✅ **FIXED** - Test now uses correct Neon connection pattern with proper database routing

Ready to execute E2E tests with database forensic validation.
