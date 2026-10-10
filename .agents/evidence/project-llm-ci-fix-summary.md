# Gate B: Migration 0012 Duplicate Enum Fix

## Summary

Successfully removed duplicate enum definitions from migration 0012 that were causing PostgreSQL CI test failures.

## What Was Removed

Two duplicate CREATE TYPE statements were removed from `packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql`:

1. **Line 11 (original):** `CREATE TYPE "public"."assignment_progress_status" AS ENUM('not_started', 'in_progress', 'self_completed');--> statement-breakpoint`
2. **Line 12 (original):** `CREATE TYPE "public"."assignment_question_type" AS ENUM('mcq', 'short_answer', 'code', 'open_ended');--> statement-breakpoint`

## Why These Were Duplicates

Both enums are already defined in `packages/db-tutorial/migrations/0003_flawless_surge.sql`:
- `assignment_progress_status` — Line 2 of 0003
- `assignment_question_type` — Line 3 of 0003

Since migrations execute in alphanumeric order (0003 runs before 0012), attempting to recreate these types in 0012 causes PostgreSQL error:
```
error: type "assignment_progress_status" already exists
SQLSTATE: 42710
```

## Verification Results

### ✅ Enum Definitions Still Present in 0003
Confirmed that `packages/db-tutorial/migrations/0003_flawless_surge.sql` still contains:
```sql
CREATE TYPE "public"."assignment_progress_status" AS ENUM('not_started', 'in_progress', 'self_completed');
CREATE TYPE "public"."assignment_question_type" AS ENUM('mcq', 'short_answer', 'code', 'open_ended');
```

### ✅ No Duplicate CREATE TYPE Statements in 0012
Search results confirm that 0012 no longer contains any CREATE TYPE statements for these enums.

### ✅ Table References Still Valid in 0012
The `assignment_progress` table in 0012 (line ~297) still correctly references the enum:
```sql
"status" "assignment_progress_status" DEFAULT 'not_started' NOT NULL,
```

This is valid because the enum is defined in the earlier migration 0003.

## Commit Details

- **Commit SHA:** `b9bcc27fe935693b00764064834b3c025713c60c`
- **Commit Message:** `fix(db): remove duplicate assignment_question_type enum from migration 0012`
- **Branch:** `project-llm-e2e-implementation-fix`
- **Files Changed:** 1 file, 2 deletions
- **File:** `packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql`

## Expected Impact

This fix resolves the CI failure in PostgreSQL Integration Tests. The migrations should now execute cleanly in order:
- Migration 0003 creates the enums
- Migration 0012 references them in table definitions without attempting to recreate them

## Related Issues

The investigation report (`.agents/evidence/project-llm-ci-investigation.md`) noted that:
1. A previous fix (commit 5872b981) successfully removed `assignment_help_request_status` duplicate
2. This fix addresses the remaining duplicates: `assignment_progress_status` and `assignment_question_type`
3. The investigation also noted a migration naming conflict (two files starting with `0012_`) which may require future attention

## Evidence Files

1. `project-llm-ci-fix-commit.txt` — Commit SHA
2. `project-llm-ci-fix-diff.txt` — Full git diff of the changes
3. `project-llm-ci-fix-summary.md` — This summary document
