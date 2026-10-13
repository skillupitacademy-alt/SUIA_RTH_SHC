# Project AI Migration Repair Plan

## Executive Summary

Migration 0026 is missing all CREATE TABLE statements for the 6 `project_ai_*` tables. The current file `0026_steady_caretaker.sql` contains only ALTER TABLE statements that assume the tables already exist. Migration 0027 continues with more ALTERs, causing immediate CI failure.

**Root Cause**: Commit `67baa785` replaced the original `0026_complex_mandarin.sql` (which contained all CREATE TABLE statements) with `0026_steady_caretaker.sql` (which contains only ALTER TABLE statements). The CREATE TABLE migration was deleted entirely instead of being preserved as a prerequisite step.

**Impact**: Fresh database migrations fail at line 1 of migration 0026 with `relation "project_ai_approvals" does not exist`.

---

## Investigation Findings

### 1. Missing Tables

All 6 project_ai_* tables are missing CREATE TABLE statements:

1. **project_ai_workflows** - PRIMARY, referenced by all others
2. **project_ai_state_transitions** - references workflows
3. **project_ai_contracts** - references workflows (1:1)
4. **project_ai_candidates** - references workflows (optional)
5. **project_ai_manifests** - references candidates
6. **project_ai_approvals** - references workflows (1:1)

### 2. Migration History

| Commit | Migration File | Content | Status |
|--------|---------------|---------|--------|
| `d03b4054` | `0026_complex_mandarin.sql` | CREATE TABLE for all 6 tables + indexes + foreign keys | ✅ Original (116 lines) |
| `67baa785` | `0026_steady_caretaker.sql` | ALTER TABLE to convert text → varchar(N) (50 lines) | ❌ Replaced original |
| `7e63f1b1` | `0027_public_multiple_man.sql` | ALTER TABLE to convert varchar → UUID (61 lines) | ❌ Assumes tables exist |

**The Problem**: Commit `67baa785` deleted `0026_complex_mandarin.sql` and created `0026_steady_caretaker.sql` with the same idx=26 in `_journal.json`. This is a migration *replacement* when it should have been migration *chaining*.

### 3. Current Migration Chain Expects

- Migration 0026: Create 6 tables with text primary keys
- Migration 0027: Convert text → varchar(N) 
- Migration 0028: Convert varchar → UUID

But the actual chain is:

- Migration 0026: ❌ ALTER non-existent tables (text → varchar)
- Migration 0027: ❌ ALTER non-existent tables (varchar → UUID)

### 4. Original CREATE TABLE Statements

Recovered from commit `d03b4054`, the original migration contains:

```sql
-- 6 CREATE TABLE statements (text PKs, jsonb columns, timestamps)
-- 27 CREATE INDEX statements (btree indexes for queries)
-- 5 ALTER TABLE ADD CONSTRAINT statements (foreign keys with cascade rules)
```

Full SQL is 116 lines and creates all tables with:
- Text primary keys (approval_id, candidate_id, contract_id, manifest_id, workflow_id)
- Integer primary key for state_transitions (GENERATED ALWAYS AS IDENTITY)
- Proper foreign key cascade rules
- All indexes for query performance
- JSONB columns with proper defaults

---

## Repair Options Analysis

### Option A: Restore Original + Renumber Later Migrations ✅ RECOMMENDED

**Approach**: 
1. Restore `0026_complex_mandarin.sql` from git commit `d03b4054`
2. Renumber current `0026_steady_caretaker.sql` → `0027_steady_caretaker.sql`
3. Renumber current `0027_public_multiple_man.sql` → `0028_public_multiple_man.sql`
4. Update `_journal.json` to reflect correct sequence

**Pros**:
- Preserves all three logical migration steps
- Clean separation of concerns (CREATE → varchar sizing → UUID conversion)
- Full git history preserved
- Matches original design intent

**Cons**:
- Requires renumbering 2 files + journal updates
- Snapshot files need regeneration (0027, 0028)

**Risk**: Low — straightforward file operations with clear verification steps

---

### Option B: Prepend CREATE TABLE to 0026 ❌ NOT RECOMMENDED

**Approach**: 
1. Insert CREATE TABLE statements at top of `0026_steady_caretaker.sql`
2. Keep ALTER TABLE statements below

**Pros**:
- No renumbering required
- Single file change

**Cons**:
- Creates a "mega-migration" that mixes CREATE and ALTER concerns
- Loses the clean separation of CREATE (0026) → varchar (0027) → UUID (0028)
- Snapshot 0026 would be inconsistent with journal metadata
- Future schema evolution becomes harder to reason about

**Risk**: Medium — introduces technical debt

---

### Option C: Create New 0025.5 Migration ❌ NOT FEASIBLE

**Approach**: 
Insert a new migration between 0025 and 0026

**Cons**:
- Drizzle migration naming is sequential; inserting breaks the chain
- Would require renaming ALL migrations 26-27 anyway
- No benefit over Option A

**Risk**: High — violates migration ordering invariants

---

## Selected Approach: Option A (Restore + Renumber)

This approach preserves the original design intent, maintains clean migration boundaries, and produces a maintainable schema evolution history.

---

## Implementation Plan

### STEP 1: Restore Original Migration 0026
**Goal**: Recreate `0026_complex_mandarin.sql` with all CREATE TABLE statements

**Actions**:
1. Run: `git -C e:\onlinewebsites\quiz-platform show d03b4054:packages/db-tutorial/migrations/0026_complex_mandarin.sql > packages\db-tutorial\migrations\0026_complex_mandarin.sql`
2. Verify file contains 116 lines with 6 CREATE TABLE, 27 CREATE INDEX, 5 ALTER TABLE ADD CONSTRAINT

**Files**: 
- `packages/db-tutorial/migrations/0026_complex_mandarin.sql` (create)

**Verify**: 
```powershell
Select-String -Path packages/db-tutorial/migrations/0026_complex_mandarin.sql -Pattern "CREATE TABLE.*project_ai" | Measure-Object
# Expected: 6 matches
```

---

### STEP 2: Rename Current 0026 → 0027
**Goal**: Move varchar conversion to correct sequence position

**Actions**:
1. Delete existing `0026_steady_caretaker.sql`
2. Rename `0026_steady_caretaker.sql` → `0027_steady_caretaker.sql` (this step extracts from git, doesn't rename on disk)
3. Retrieve from git: `git -C e:\onlinewebsites\quiz-platform show 67baa785:packages/db-tutorial/migrations/0026_steady_caretaker.sql > packages\db-tutorial\migrations\0027_steady_caretaker.sql`

**Files**: 
- `packages/db-tutorial/migrations/0026_steady_caretaker.sql` (delete)
- `packages/db-tutorial/migrations/0027_steady_caretaker.sql` (create)

**Verify**: 
```powershell
Get-Item packages/db-tutorial/migrations/0027_steady_caretaker.sql
# File should exist and contain 50 ALTER TABLE statements
```

---

### STEP 3: Rename Current 0027 → 0028
**Goal**: Move UUID conversion to correct sequence position

**Actions**:
1. Rename `0027_public_multiple_man.sql` → `0028_public_multiple_man.sql`

**Files**: 
- `packages/db-tutorial/migrations/0027_public_multiple_man.sql` (delete)
- `packages/db-tutorial/migrations/0028_public_multiple_man.sql` (create)

**Verify**: 
```powershell
Get-Item packages/db-tutorial/migrations/0028_public_multiple_man.sql
# File should exist and contain UUID conversion logic
```

---

### STEP 4: Update Migration Journal
**Goal**: Register correct migration sequence in Drizzle metadata

**Actions**:
1. Read `packages/db-tutorial/migrations/meta/_journal.json`
2. Update entry at idx=26:
   ```json
   {
     "idx": 26,
     "version": "7",
     "when": 1791508000000,
     "tag": "0026_complex_mandarin",
     "breakpoints": true
   }
   ```
3. Update entry at idx=27:
   ```json
   {
     "idx": 27,
     "version": "7",
     "when": 1791508489695,
     "tag": "0027_steady_caretaker",
     "breakpoints": true
   }
   ```
4. Add new entry at idx=28:
   ```json
   {
     "idx": 28,
     "version": "7",
     "when": 1791510064024,
     "tag": "0028_public_multiple_man",
     "breakpoints": true
   }
   ```

**Files**: 
- `packages/db-tutorial/migrations/meta/_journal.json` (modify)

**Verify**: 
```powershell
(Get-Content packages/db-tutorial/migrations/meta/_journal.json | ConvertFrom-Json).entries | Where-Object { $_.idx -ge 26 } | Select-Object idx, tag
# Expected: idx=26 (0026_complex_mandarin), idx=27 (0027_steady_caretaker), idx=28 (0028_public_multiple_man)
```

---

### STEP 5: Regenerate Drizzle Snapshots
**Goal**: Create snapshot files for migrations 0026, 0027, 0028

**Actions**:
1. Run: `cd packages/db-tutorial && pnpm drizzle-kit generate`
2. This will regenerate:
   - `packages/db-tutorial/migrations/meta/0026_snapshot.json`
   - `packages/db-tutorial/migrations/meta/0027_snapshot.json`
   - `packages/db-tutorial/migrations/meta/0028_snapshot.json`

**Files**: 
- `packages/db-tutorial/migrations/meta/0026_snapshot.json` (regenerate)
- `packages/db-tutorial/migrations/meta/0027_snapshot.json` (regenerate)
- `packages/db-tutorial/migrations/meta/0028_snapshot.json` (regenerate)

**Verify**: 
```powershell
# Check that snapshot 0026 contains all 6 project_ai tables
(Get-Content packages/db-tutorial/migrations/meta/0026_snapshot.json | ConvertFrom-Json).tables.PSObject.Properties.Name | Select-String "project_ai"
# Expected: 6 matches (project_ai_workflows, project_ai_state_transitions, project_ai_contracts, project_ai_candidates, project_ai_manifests, project_ai_approvals)
```

---

### STEP 6: Verify Migration Sequence Against Fresh Database
**Goal**: Confirm all migrations apply cleanly from 0000 to 0028

**Actions**:
1. Run: `cd packages/db-tutorial && pnpm db:migrate`
2. Watch for successful application of migrations 0026, 0027, 0028
3. Verify all 6 project_ai_* tables exist with correct schemas

**Verify**: 
```powershell
# This requires database access; verify CI passes after push
# Expected: "Migration completed successfully" with no errors at 0026-0028
```

---

### STEP 7: Verify No ALTER Precedes CREATE
**Goal**: Ensure no migration ALTERs a table before it's CREATEd

**Actions**:
1. Search all migrations 0000-0028 for ALTER TABLE project_ai_* statements
2. Confirm first mention is in 0027 (after CREATE in 0026)

**Verify**: 
```powershell
Get-ChildItem packages/db-tutorial/migrations/*.sql | Select-String -Pattern "ALTER TABLE.*project_ai" | Select-Object -First 5
# Expected: First match should be in 0027_steady_caretaker.sql (not 0026 or earlier)
```

---

## Verification Commands Summary

### Local Verification (Before Push)
```powershell
# 1. Check migration files exist in correct sequence
Get-ChildItem packages/db-tutorial/migrations/002*.sql | Select-Object Name

# Expected output:
# 0026_complex_mandarin.sql
# 0027_steady_caretaker.sql
# 0028_public_multiple_man.sql

# 2. Verify 0026 creates all tables
Select-String -Path packages/db-tutorial/migrations/0026_complex_mandarin.sql -Pattern "CREATE TABLE" | Measure-Object
# Expected: Count = 6

# 3. Verify 0027 does NOT create tables (only ALTERs)
Select-String -Path packages/db-tutorial/migrations/0027_steady_caretaker.sql -Pattern "CREATE TABLE"
# Expected: No matches

# 4. Verify journal has 3 entries for 26-28
(Get-Content packages/db-tutorial/migrations/meta/_journal.json | ConvertFrom-Json).entries | Where-Object { $_.idx -ge 26 -and $_.idx -le 28 } | Measure-Object
# Expected: Count = 3

# 5. Check snapshot files exist
Get-ChildItem packages/db-tutorial/migrations/meta/002*_snapshot.json | Select-Object Name
# Expected: 0026_snapshot.json, 0027_snapshot.json, 0028_snapshot.json

# 6. Verify no ALTER precedes CREATE
Get-ChildItem packages/db-tutorial/migrations/*.sql | Select-String -Pattern "ALTER TABLE.*project_ai" | Select-Object -First 1 | Select-Object Filename
# Expected: Filename should be 0027_steady_caretaker.sql (NOT 0026 or earlier)
```

### CI Verification (After Push)
```bash
# Run in GitHub Actions PostgreSQL Integration Tests workflow
pnpm db:migrate

# Expected output:
# ✓ 0026_complex_mandarin.sql applied
# ✓ 0027_steady_caretaker.sql applied
# ✓ 0028_public_multiple_man.sql applied
# Migration completed successfully
```

---

## Success Criteria

1. ✅ Migration 0026 creates all 6 project_ai_* tables with text primary keys
2. ✅ Migration 0027 converts text columns to varchar(N) with explicit lengths
3. ✅ Migration 0028 converts varchar primary keys to UUID with USING clauses
4. ✅ Fresh database migration from 0000 to 0028 completes without errors
5. ✅ All CI tests pass including PostgreSQL Integration Tests
6. ✅ `grep -r "ALTER TABLE.*project_ai" migrations/00{00..25}*.sql` returns no matches
7. ✅ `_journal.json` entries 26-28 have correct tags and sequence

---

## Rollback Plan (If Needed)

If the repair introduces new issues:

1. **Revert files to current HEAD**:
   ```powershell
   git -C e:\onlinewebsites\quiz-platform checkout HEAD -- packages/db-tutorial/migrations/
   ```

2. **Alternative: Quick-fix with IF NOT EXISTS** (temporary workaround):
   - Prepend CREATE TABLE IF NOT EXISTS to 0026_steady_caretaker.sql
   - This allows CI to pass but leaves technical debt
   - Schedule proper fix per Option A for next sprint

---

## Post-Repair Actions

1. **Update Documentation**:
   - Add comment in 0026_complex_mandarin.sql explaining it's the original CREATE migration
   - Add comment in 0027_steady_caretaker.sql explaining it refines 0026 column types
   - Add comment in 0028_public_multiple_man.sql explaining UUID conversion

2. **Prevent Future Collisions**:
   - Never delete a migration file that has been committed
   - Never reuse a migration index (idx in _journal.json)
   - Always append new migrations, never replace existing ones
   - If schema needs correction, create a NEW migration that ALTERs the previous one

3. **Add Migration Chain Test**:
   - Create CI step that verifies migrations apply cleanly to empty database
   - Already exists in "PostgreSQL Integration Tests" workflow ✅

---

## Technical Details

### Why Not Squash Migrations?

While squashing 0026+0027+0028 into a single migration would work for fresh databases, it would break existing deployed databases that already ran the original 0026_complex_mandarin.sql (if any exist in staging/dev environments).

The renumbering approach preserves backward compatibility:
- Fresh databases: run 0026 (CREATE) → 0027 (varchar) → 0028 (UUID)
- Databases with old 0026: will see the new 0027+0028 as continuation (though they need manual reconciliation)

### Why Drizzle Snapshots Matter

Snapshot files (`meta/0026_snapshot.json`) are Drizzle's internal schema checkpoints. They must be regenerated after any migration file changes to ensure:
1. `drizzle-kit push` can diff correctly
2. Schema drift detection works
3. Future migrations generate correctly

### Migration Immutability Rules

Per Drizzle best practices:
- Never edit a migration SQL file after it's committed and deployed
- Never delete a migration file
- Never reorder migrations
- If a migration is wrong, create a NEW migration that fixes it

Our repair violates immutability (renaming files) because:
1. The broken migrations have NOT been deployed to production (CI is failing)
2. This is a recovery from an improper migration replacement
3. The alternative (prepending to 0026) creates worse technical debt

---

## Estimated Effort

- **Investigation**: ✅ Complete (1 hour)
- **Implementation**: 30 minutes (file operations + journal update)
- **Testing**: 15 minutes (local verification + CI run)
- **Documentation**: ✅ Complete (this plan)
- **Total**: ~45 minutes hands-on work + 10 minutes CI wait

---

## Dependencies

- Git access to commit `d03b4054` (verified available ✅)
- Write access to `packages/db-tutorial/migrations/` (assumed ✅)
- `pnpm` installed with `drizzle-kit` (project dependency ✅)
- PostgreSQL test database for migration verification (CI has it ✅)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Snapshot regeneration fails | Low | Medium | Run `pnpm drizzle-kit generate` before push; verify output |
| Journal idx collision | Low | High | Manual verification of idx sequence 26→27→28 |
| Existing database has old schema | Medium | High | Document that databases with old 0026 need reconciliation |
| CI still fails after fix | Low | High | Rollback plan ready; alternative quick-fix available |

---

## Contact & Questions

For questions about this plan:
- Review original commits: `d03b4054`, `67baa785`, `7e63f1b1`
- Check Drizzle docs: https://orm.drizzle.team/docs/migrations
- Review project docs: `packages/db-tutorial/README.md` (if exists)

---

**Plan Status**: ✅ READY FOR IMPLEMENTATION  
**Next Action**: Execute STEP 1 (Restore Original Migration 0026)
