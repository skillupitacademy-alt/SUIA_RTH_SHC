# Checkpoint 5 - Gate Validation Complete

## Gates 1-6: ALL PASS ✅

**INCLUDING Gate 5A: Active-row semantics filter added**

### Gate 1: Environment Variables
```
DATABASE_URL_PEOPLE = SET (in .env.local)
DATABASE_URL_TUTORIAL = SET (in .env.local)
```

### Gate 2: Database Identity
```
DATABASE_URL_PEOPLE → people_prod ✅
DATABASE_URL_TUTORIAL → tutorial_prod ✅
```

### Gate 3: Table Identity
```
people_prod.users ✅ (NOT "User")
tutorial_prod.tutorial_navigation_progress ✅
```

### Gate 4: Variable Name Fixes
```typescript
// BEFORE (WRONG):
const PEOPLE_DATABASE_URL = process.env.PEOPLE_DATABASE_URL;
const TUTORIAL_DATABASE_URL = process.env.TUTORIAL_DATABASE_URL;

// AFTER (CORRECT):
const PEOPLE_DATABASE_URL = process.env.DATABASE_URL_PEOPLE;
const TUTORIAL_DATABASE_URL = process.env.DATABASE_URL_TUTORIAL;
```

### Gate 5: Table & Column Name Fixes

**People DB Fix:**
```sql
-- BEFORE (WRONG):
SELECT id FROM "User" WHERE email = ...

-- AFTER (CORRECT):
SELECT id FROM users WHERE email = ...
```

**Tutorial DB Fix:**
```typescript
// BEFORE (WRONG):
interface ProgressRow {
  learner_id: string;
  ...
}
SELECT learner_id FROM tutorial_navigation_progress WHERE learner_id = ...

// AFTER (CORRECT):
interface ProgressRow {
  user_id: string;
  ...
}
SELECT user_id FROM tutorial_navigation_progress WHERE user_id = ...
```

### Gate 5A: Active-Row Semantics ✅
**Forensic Query Hardening:**
```sql
-- Added deleted_at IS NULL to match partial unique index
SELECT user_id, navigation_node_id, subtopic_id, last_session_id, 
       visit_count, revision_count, updated_at
FROM tutorial_navigation_progress
WHERE user_id = ${learnerId} 
  AND navigation_node_id = ${navigationNodeId} 
  AND subtopic_id = ${subtopicId}
  AND deleted_at IS NULL  ⬅ ACTIVE ROW FILTER
```

**Rationale:** Schema uses partial unique index `uqNavigationProgressUserNode` on active rows. E2E forensic query must target same active-row semantics to prevent soft-deleted historical rows from contaminating assertions.

### Gate 6: Learner Lookup Test
```
SUIA (student@skillupitacademy.com):
  ✅ Found: YES
  ID: afc355ca-6bae-4165-89dd-198494a62f85

RTH (ajayshah@gmail.com):
  ✅ Found: YES
  ID: 54726a2e-fca5-4d93-abc6-e7cee97a86f8
```

## Critical Findings Summary

### Finding 1: Variable Name Mismatch
- **Root Cause**: Test used `PEOPLE_DATABASE_URL` instead of `DATABASE_URL_PEOPLE`
- **Impact**: Environment variables not found, connection failed
- **Fix**: Updated to match project's canonical naming convention

### Finding 2: Wrong Table Name
- **Root Cause**: Assumed legacy `"User"` table, actual is `users`
- **Impact**: `relation "User" does not exist` error
- **Fix**: Changed to lowercase `users` table

### Finding 3: Wrong Column Name
- **Root Cause**: Assumed `learner_id`, actual is `user_id`
- **Impact**: Would fail column selection
- **Fix**: Updated interface and queries to use `user_id`

## Schema Verification

### people_prod.users
```
id               | uuid
email            | text
password_hash    | text
role             | USER-DEFINED
platform         | USER-DEFINED
is_active        | boolean
external_id      | uuid
external_brand   | text
created_at       | timestamp with time zone
updated_at       | timestamp with time zone
deleted_at       | timestamp with time zone
```

### tutorial_prod.tutorial_navigation_progress
```
id                      | uuid
user_id                 | uuid ⬅ KEY COLUMN
navigation_node_id      | text
section_id              | uuid
subtopic_id             | uuid
status                  | USER-DEFINED
completed_blocks        | jsonb
time_spent_active_sec   | integer
visit_count             | integer ⬅ KEY COLUMN
revision_count          | integer ⬅ KEY COLUMN
last_session_id         | text ⬅ KEY COLUMN
first_viewed_at         | timestamp
last_viewed_at          | timestamp
completed_at            | timestamp
created_at              | timestamp
updated_at              | timestamp
deleted_at              | timestamp
```

## Next: Gate 7 - Run E2E Tests Serially

Ready to execute with:
```powershell
npx playwright test tests/e2e/ils-phase2-visit-persistence.spec.ts `
  --project=chromium `
  --workers=1 `
  --timeout=120000 `
  --reporter=line
```

**Critical**: `--workers=1` ensures tests run serially to prevent concurrent modification of same progress rows.
