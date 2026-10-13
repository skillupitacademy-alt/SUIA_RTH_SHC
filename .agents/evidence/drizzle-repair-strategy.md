# Drizzle Migration Repair Strategy

**Date**: 2025-01-25  
**Issue**: Migration 0012 duplicates objects from 0011 and earlier migrations due to empty 0011 snapshot  
**Repository**: e:\onlinewebsites\quiz-platform\packages\db-tutorial

---

## Recommended Approach: **Option B — Surgical Fix of Migration 0012**

After analyzing all available options, **Option B** is the safest and most practical repair strategy.

---

## Option A: Regenerate 0011 Snapshot (❌ NOT RECOMMENDED)

### Description
Delete the empty `0011_add_layman_hardening_tables.json` and regenerate it by running:
```bash
cd packages/db-tutorial
npx drizzle-kit generate
```

This would regenerate the 0011 snapshot with proper content, then regenerate 0012 to remove duplicates.

### Why This Is NOT Safe

**Fatal Risk**: If migration 0011 has been applied to **any database** (dev, CI, staging, production), regenerating the snapshot breaks the contract:
- The database believes 0011 already ran
- The regenerated 0012 would assume 0011 never ran (because we'd delete/regenerate it)
- Result: Schema drift between database state and migration history

**Evidence migration 0011 was applied**:
- The user's original request mentioned CI failures on migration 0012
- This means migrations are being run sequentially: 0000 → 0001 → ... → 0011 → 0012 (fails)
- The database has migration 0011's objects already

**Verdict**: ❌ **DO NOT USE** unless you can guarantee 0011 never ran on any database (impossible at this stage).

---

## Option B: Surgically Fix Migration 0012 (✅ RECOMMENDED)

### Description

Keep migration 0011 and its empty snapshot intact (preserve history). Modify migration 0012 to:
1. Remove all duplicate CREATE statements for objects that existed before 0012
2. Keep only genuinely NEW objects introduced in 0012
3. Use `CREATE TYPE IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` for safety
4. Regenerate the 0012 snapshot to reflect the corrected state
5. Verify migrations 0013-0027 still work correctly

### Why This Is Safe

- ✅ **Preserves history**: 0011 remains untouched; databases that ran 0011 are unaffected
- ✅ **Idempotent**: Using `IF NOT EXISTS` makes 0012 safe to run whether 0011 ran or not
- ✅ **Minimal changes**: Only 0012 is modified; 0013-0027 may need snapshot regeneration but no SQL changes
- ✅ **Rollback possible**: We can restore the original 0012 if needed
- ✅ **CI-friendly**: After the fix, CI can run all migrations cleanly from 0000-0027

### Implementation Steps

#### Step 1: Back Up Current State

```bash
cd packages/db-tutorial/migrations
cp 0012_futuristic_pepper_potts.sql 0012_futuristic_pepper_potts.sql.backup
cp meta/0012_snapshot.json meta/0012_snapshot.json.backup
```

#### Step 2: Create the Corrected 0012 Migration

**Remove these duplicate CREATE statements** from `0012_futuristic_pepper_potts.sql`:

**Duplicates from 0011 (21 statements)**:
- `CREATE TYPE "public"."layman_audit_action"` → Already in 0011
- `CREATE TABLE "layman_audit_logs"` → Already in 0011
- `CREATE TABLE "layman_prompt_history"` → Already in 0011
- `CREATE TABLE "layman_content_revisions"` → Already in 0011
- All 15 indexes for the above tables (idx_layman_audit_*, idx_layman_prompt_history_*, idx_layman_content_revisions_*)
- All related UNIQUE INDEX statements

**Duplicates from 0000-0010 (25 tables + 4 enums + indexes)**:
- `CREATE TYPE "public"."assignment_help_request_status"` → From 0003
- `CREATE TYPE "public"."assignment_progress_status"` → From 0003
- `CREATE TYPE "public"."assignment_question_type"` → From 0003
- `CREATE TYPE "public"."tutorial_content_audit_action"` → From 0007
- `CREATE TABLE "assignment_help_requests"` → From 0003
- `CREATE TABLE "assignment_progress"` → From 0003
- `CREATE TABLE "badges"` → From 0004
- `CREATE TABLE "certificates"` → From 0002
- `CREATE TABLE "content_generation_jobs"` → From 0010
- `CREATE TABLE "domain_content_config"` → From 0010
- `CREATE TABLE "tutorial_content"` → From 0000
- `CREATE TABLE "tutorial_domains"` → From 0008
- `CREATE TABLE "tutorial_content_versions"` → From 0007
- `CREATE TABLE "tutorial_content_audit"` → From 0007
- `CREATE TABLE "tutorial_assignments"` → From 0003
- `CREATE TABLE "live_session_requests"` → From 0005
- `CREATE TABLE "tutorial_subjects"` → From 0008
- `CREATE TABLE "tutorial_topics"` → From 0008
- `CREATE TABLE "tutorial_subtopics"` → From 0008
- `CREATE TABLE "tutorial_projects"` → From 0000
- `CREATE TABLE "tutorial_project_submissions"` → From 0000
- `CREATE TABLE "student_badges"` → From 0004
- `CREATE TABLE "tutorial_progress"` → From 0000
- `CREATE TABLE "tutorial_video_links"` → From 0010
- `CREATE TABLE "remediation_triggers"` → From 0006
- `CREATE TABLE "subtopic_flow_progress"` → From 0010
- `CREATE TABLE "student_streaks"` → From 0002
- All indexes for the above tables

**Keep these NEW objects in 0012** (33 objects):

Enums (10):
- `CREATE TYPE "public"."brand"`
- `CREATE TYPE "public"."brand_visibility"`
- `CREATE TYPE "public"."deployment_type"`
- `CREATE TYPE "public"."job_status"`
- `CREATE TYPE "public"."orchestration_status"`
- `CREATE TYPE "public"."priority_level"`
- `CREATE TYPE "public"."review_status"`
- `CREATE TYPE "public"."section_status"`
- `CREATE TYPE "public"."section_type"`
- `CREATE TYPE "public"."subsection_type"`

Tables (23):
- `ai_generation_metrics`
- `ai_generation_orchestration`
- `ai_section_generation_jobs`
- `educational_architecture_performance`
- `prompt_template_performance`
- `ui_architecture_performance`
- `brand_performance_metrics`
- `deployment_cohort_metrics`
- `revenue_attribution_metrics`
- `subsection_engagement_metrics`
- `tutorial_learning_metrics`
- `content_deployments`
- `content_review_queue`
- `educational_architectures`
- `tutorial_sections`
- `tutorial_subsections`
- `code_interactions`
- `practice_test_answers`
- `quiz_answers`
- `section_completions`
- `visual_interactions`
- `ui_architectures`
- `prompt_templates`

Plus all indexes for these NEW tables.

#### Step 3: Regenerate 0012 Snapshot

After editing the SQL file:

```bash
cd packages/db-tutorial
npx drizzle-kit generate --name futuristic_pepper_potts
```

This will regenerate `meta/0012_snapshot.json` to reflect the corrected SQL.

**Important**: Verify the regenerated snapshot:
- Contains only the 10 new enums
- Contains only the 23 new tables
- Does NOT contain any layman_* tables (they should be in 0011 snapshot, not 0012)
- Has a valid UUID in the `id` field (not a tag string)
- `prevId` points to a valid snapshot

#### Step 4: Fix the 0011 Snapshot (Optional but Recommended)

Create a corrective snapshot for 0011 manually or by restoring from database introspection:

```bash
# Option 1: Introspect from a database that ran 0011
npx drizzle-kit introspect --out=./temp-introspection

# Extract layman_* objects from the introspection
# Manually construct the 0011 snapshot with proper structure
```

Alternatively, reconstruct `0011_add_layman_hardening_tables.json` manually using the schema from 0008 as a base and adding the layman objects.

**Critical**: Give it a proper UUID for the `id` field, not the tag string.

#### Step 5: Verify Against a Fresh Database

```bash
# Create a disposable test database
docker run -d --name test-drizzle-repair -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:15

# Run migrations 0000-0012 in sequence
export DATABASE_URL="postgresql://postgres:test@localhost:5433/postgres"
npx drizzle-kit migrate

# Check for errors
# Verify all expected tables exist
psql $DATABASE_URL -c "\dt" | grep layman
psql $DATABASE_URL -c "\dT" | grep layman
```

Expected results:
- All migrations run without errors
- `layman_audit_action` enum exists (from 0011)
- `layman_audit_logs`, `layman_prompt_history`, `layman_content_revisions` tables exist (from 0011)
- All 0012 NEW tables exist
- No duplicate errors

#### Step 6: Update Migrations 0013-0027 (If Necessary)

If 0013-0027 reference the broken 0012 snapshot, regenerate their snapshots:

```bash
# For each subsequent migration, verify its snapshot
# If any have `prevId` pointing to the old 0012 snapshot UUID, regenerate

cd packages/db-tutorial
# Checkout each migration's commit
# Run drizzle-kit generate for that migration
# Verify snapshot correctness
```

Typically, snapshots are immutable once committed, but since we're fixing a corruption, this is justified.

#### Step 7: Run Integration Tests

```bash
# Run the full test suite
cd packages/db-tutorial
npm run test

# Run database-specific tests
npm run test:db

# Verify GitHub Actions CI passes
git add migrations/0012_futuristic_pepper_potts.sql migrations/meta/0012_snapshot.json
git commit -m "fix(db): repair 0012 migration duplicates caused by empty 0011 snapshot"
git push
```

Monitor CI results for migration errors.

### Risks and Mitigation

**Risk 1**: Migrations 0013-0027 depend on the broken 0012 snapshot structure.

**Mitigation**: Regenerate affected snapshots. This is safe because snapshots are purely for diffing during generation, not for runtime.

**Risk 2**: Production database already ran the broken 0012 and has duplicate errors logged.

**Mitigation**: If 0012 never successfully ran (CI failed), production is unaffected. If it did run and failed, the database is still in the 0011 state, and the corrected 0012 will work.

**Risk 3**: We remove a genuinely new table from 0012 by accident.

**Mitigation**: Cross-reference every removed object against the 0000-0011 inventory (provided in the analysis JSON).

### Rollback Plan

If the repair causes issues:

```bash
# Restore backups
cd packages/db-tutorial/migrations
cp 0012_futuristic_pepper_potts.sql.backup 0012_futuristic_pepper_potts.sql
cp meta/0012_snapshot.json.backup meta/0012_snapshot.json

# Revert commit
git reset --hard HEAD~1

# Investigate further
```

---

## Option C: Create Corrective Migration 0028 (⚠️ LAST RESORT)

### Description

Leave 0011 and 0012 untouched. Create a new migration 0028 that uses idempotent syntax:

```sql
-- Migration 0028: Make schema idempotent (repair 0011/0012 duplication)

-- Layman objects from 0011 (safe if already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'layman_audit_action') THEN
    CREATE TYPE layman_audit_action AS ENUM (...);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS layman_audit_logs (...);
CREATE TABLE IF NOT EXISTS layman_prompt_history (...);
CREATE TABLE IF NOT EXISTS layman_content_revisions (...);

-- Indexes (PostgreSQL doesn't have CREATE INDEX IF NOT EXISTS in older versions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_layman_audit_section_id') THEN
    CREATE INDEX idx_layman_audit_section_id ON layman_audit_logs(section_id);
  END IF;
  -- Repeat for all 15 indexes
END $$;
```

### Why This Is NOT Preferred

- ❌ **Doesn't fix root cause**: 0011 and 0012 remain broken in the history
- ❌ **Adds complexity**: Future developers must understand why 0028 exists
- ❌ **Bloats migrations**: 0012 still has 192 statements, most redundant
- ⚠️ **Hard to maintain**: Every schema diff tool will be confused

**When to use**: Only if modifying 0012 causes unforeseen issues (e.g., other teams already deployed broken 0012 to production and can't roll back).

---

## Final Recommendation

**Execute Option B**: Surgically fix migration 0012 by removing duplicates and regenerating the snapshot.

### Why Option B Wins

1. **Surgical precision**: Only 0012 changes; 0011 preserved
2. **Database-safe**: Works whether 0011 was applied or not
3. **Clean history**: Future migrations built on correct foundation
4. **CI-friendly**: Passes automated checks after repair
5. **Minimal risk**: Backed up, reversible, testable

### Next Steps for Implementation Team

1. **Pre-flight checks**:
   - Verify which databases have run migrations 0011 and 0012
   - Confirm no production traffic depends on broken schema state
   - Back up all databases before repair

2. **Execute repair** (Steps 1-7 above)

3. **Post-repair validation**:
   - Run full test suite (unit, integration, E2E)
   - Verify GitHub Actions CI passes on the repaired branch
   - Deploy to staging and run smoke tests
   - Monitor for schema-related errors

4. **Documentation**:
   - Update migration README with lessons learned
   - Add a test to prevent empty snapshots in the future
   - Consider adding a pre-push hook to validate snapshot integrity

---

## Preventive Measures for Future

### 1. Snapshot Validation Script

```bash
#!/bin/bash
# .git/hooks/pre-commit (or CI check)

for snapshot in packages/db-tutorial/migrations/meta/*.json; do
  tables=$(jq '.tables | length' "$snapshot")
  if [ "$tables" -eq 0 ]; then
    echo "ERROR: Empty snapshot detected: $snapshot"
    exit 1
  fi
done
```

### 2. Migration Generation Checklist

Before committing a migration:
- [ ] SQL file contains expected CREATE statements
- [ ] Snapshot file is non-empty (`tables`, `enums` have content)
- [ ] Snapshot `id` is a UUID (not a tag string)
- [ ] Snapshot `prevId` points to previous snapshot UUID
- [ ] Journal updated with new entry
- [ ] Migration runs successfully on a fresh database

### 3. CI Migration Test

Add to GitHub Actions:
```yaml
- name: Test migrations on fresh DB
  run: |
    docker run -d --name test-pg -e POSTGRES_PASSWORD=test -p 5432:5432 postgres:15
    sleep 5
    npm run db:migrate
    npm run db:verify-schema
```

---

## Conclusion

The root cause is an empty 0011 snapshot file that caused Drizzle to regenerate the entire schema in 0012. **Option B (surgical fix of 0012)** is the safest, most maintainable repair strategy that preserves history while correcting the schema state.

**Estimated repair time**: 2-4 hours (including testing)  
**Risk level**: Low (with proper backups and testing)  
**Long-term benefit**: Clean migration history, no schema drift
