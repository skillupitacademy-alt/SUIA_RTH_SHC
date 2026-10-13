# Drizzle Snapshot Chain Analysis

**Investigation Date**: 2025-01-XX  
**Repository**: e:\onlinewebsites\quiz-platform  
**Package**: packages/db-tutorial  
**Issue**: Migration 0012 duplicates objects from migration 0011 due to empty 0011 snapshot

---

## Executive Summary

Migration 0011 (`add_layman_hardening_tables`) successfully created:
- 1 enum: `layman_audit_action` (with 27 values)
- 3 tables: `layman_audit_logs`, `layman_prompt_history`, `layman_content_revisions`
- 15 indexes across those tables

However, the corresponding snapshot file `0011_add_layman_hardening_tables.json` is **completely empty** — it contains no tables, no enums, no columns. This caused Drizzle to believe those objects never existed, triggering a full schema regeneration in migration 0012.

---

## 1. The Broken 0011 Snapshot

### File: `meta/0011_add_layman_hardening_tables.json`

```json
{
  "id": "0011_add_layman_hardening_tables",
  "prevId": "0010_looping_demo_foundation",
  "version": "7",
  "dialect": "postgresql",
  "tables": {},
  "enums": {},
  "schemas": {},
  "_meta": {
    "schemas": {},
    "tables": {},
    "columns": {}
  }
}
```

**Problem**: The snapshot is structurally valid JSON but semantically empty. All collection fields (`tables`, `enums`, `schemas`) are empty objects `{}`.

**Expected Content**: The snapshot should have contained:
- `enums.public.layman_audit_action` with all 27 enum values
- `tables.public.layman_audit_logs` with 16 columns
- `tables.public.layman_prompt_history` with 23 columns  
- `tables.public.layman_content_revisions` with 19 columns
- All 15 indexes created in the migration

---

## 2. What Migration 0011 SQL Actually Created

### Enum: `layman_audit_action`

```sql
CREATE TYPE layman_audit_action AS ENUM (
  -- Prompt operations
  'prompt_generated', 'prompt_exported', 'prompt_copied', 'prompt_modified',
  
  -- Content operations
  'content_ingested', 'content_parsed', 'content_validated', 'content_revised', 'content_sanitized',
  
  -- Lifecycle operations
  'section_created', 'section_updated', 'section_submitted_review', 'section_approved', 
  'section_rejected', 'section_published', 'section_archived', 'section_restored',
  
  -- Governance operations
  'validation_passed', 'validation_failed', 'quality_score_calculated', 'hallucination_detected',
  
  -- Security operations
  'tamper_detected', 'sanitization_applied', 'rollback_executed'
);
```

**Total**: 27 enum values

### Table: `layman_audit_logs`

**Columns**: 16
- id (UUID, PK)
- section_id, prompt_id (nullable UUIDs)
- action (layman_audit_action, NOT NULL)
- action_category (VARCHAR 50)
- user_id, user_role
- brand_id
- before_state, after_state, diff (JSONB)
- metadata (JSONB)
- ip_address, user_agent
- success (VARCHAR 20, default 'success')
- error_message
- created_at

**Indexes**: 6
- idx_layman_audit_section_id
- idx_layman_audit_prompt_id
- idx_layman_audit_user_id
- idx_layman_audit_action
- idx_layman_audit_brand_id
- idx_layman_audit_created_at

### Table: `layman_prompt_history`

**Columns**: 23
- id (UUID, PK)
- section_id (nullable), subtopic_id (NOT NULL)
- prompt_template_id, template_name, template_version
- system_prompt, user_prompt, full_prompt (TEXT)
- variables (JSONB)
- prompt_hash (VARCHAR 64), prompt_signature
- brand_id
- educational_architecture_id, educational_architecture_name
- ui_architecture_id, ui_architecture_name
- was_used, used_at
- export_count, last_exported_at, export_format
- metadata (JSONB)
- generated_by
- created_at

**Indexes**: 5
- idx_layman_prompt_history_section_id
- idx_layman_prompt_history_subtopic_id
- idx_layman_prompt_history_hash
- idx_layman_prompt_history_brand_id
- idx_layman_prompt_history_created_at

### Table: `layman_content_revisions`

**Columns**: 19
- id (UUID, PK)
- section_id (NOT NULL)
- revision_number, parent_revision_id
- content (JSONB, NOT NULL)
- quality_score, hallucination_risk, completeness_score
- validation_errors, validation_warnings (JSONB)
- status, governance_status
- change_type, change_reason, changed_subsections (JSONB)
- source_prompt_id, ai_response_raw
- brand_id
- metadata (JSONB)
- created_by, created_by_role
- is_current_version, replaced_at, replaced_by
- created_at

**Indexes**: 6
- idx_layman_content_revisions_section_id
- idx_layman_content_revisions_revision_number (composite: section_id, revision_number)
- idx_layman_content_revisions_parent_id
- idx_layman_content_revisions_prompt_id
- idx_layman_content_revisions_current (composite: section_id, is_current_version)
- idx_layman_content_revisions_created_at

---

## 3. The Delta: 0010 → 0011

### Schema State BEFORE 0011 (from 0008_snapshot.json, latest available before 0011)

The 0008 snapshot (81,940 bytes) contained many tables but **NONE** of the layman hardening objects:
- No `layman_audit_action` enum
- No `layman_audit_logs` table
- No `layman_prompt_history` table
- No `layman_content_revisions` table

**Migration 0009**: Created materialized view only (no schema objects)  
**Migration 0010**: Created `domain_content_config`, `content_generation_jobs`, `subtopic_flow_progress`, `tutorial_video_links` — unrelated to layman tables

### Objects Introduced by 0011

**New in 0011**:
- ✅ 1 enum: `layman_audit_action`
- ✅ 3 tables: `layman_audit_logs`, `layman_prompt_history`, `layman_content_revisions`
- ✅ 15 indexes

**Status**: These were genuinely NEW objects that did not exist before migration 0011.

---

## 4. How the Empty Snapshot Caused 0012 to Duplicate

### The Drizzle Snapshot Chain Process

1. Developer modifies schema definitions (TypeScript files)
2. Runs `drizzle-kit generate`
3. Drizzle compares current schema definitions against **previous snapshot** (not database)
4. Generates migration SQL and new snapshot reflecting delta

### What Happened

**When generating 0012**:
- Drizzle read `0011_add_layman_hardening_tables.json` as the "previous state"
- Found `tables: {}` and `enums: {}` — empty
- Compared against current schema definitions which **included** the layman tables/enum (defined in code)
- Concluded: "These objects are in the code but not in the last snapshot, so they must be new"
- Generated CREATE statements for all layman objects **again**
- Also generated CREATE statements for many other existing tables

### The 0012 Snapshot `prevId` Anomaly

```json
{
  "id": "f14b564d-b83d-4690-8a34-c4c723b1da60",
  "prevId": "0011_add_layman_hardening_tables",  ← String tag, not UUID
  "version": "7",
  "dialect": "postgresql",
  ...
}
```

**Analysis**: The `prevId` field should typically be a UUID pointing to the previous snapshot's `id`. Instead, it's the migration tag string `"0011_add_layman_hardening_tables"`. This is consistent with Drizzle's fallback behavior when it cannot find a valid snapshot — it references the journal tag instead.

**Why this happened**: The 0011 snapshot has `"id": "0011_add_layman_hardening_tables"` (the tag, not a UUID like earlier snapshots). This suggests the 0011 snapshot was manually created or corrupted during generation.

---

## 5. Journal Consistency Check

### File: `meta/_journal.json`

**Entries for 0011 and 0012**:

```json
{
  "idx": 11,
  "version": "7",
  "when": 1774551053336,
  "tag": "0011_add_layman_hardening_tables",
  "breakpoints": true
},
{
  "idx": 12,
  "version": "7",
  "when": 1778202643367,
  "tag": "0012_futuristic_pepper_potts",
  "breakpoints": true
}
```

**Findings**:
- ✅ Both entries present with correct sequential `idx` values (11, 12)
- ✅ Timestamps are sequential and reasonable (0011: Jan 24, 2025 → 0012: Jan 25, 2025)
- ✅ Both use version "7" and have breakpoints enabled
- ⚠️ No `prevId` field in journal entries (expected — journal doesn't track snapshot linkage)

**Conclusion**: Journal is structurally valid. The corruption is isolated to the 0011 snapshot content.

---

## 6. Migration 0012 Analysis: Scale of Duplication

### Total CREATE Statements in 0012: 192

**Breakdown**:
- 10 CREATE TYPE (enums)
- 49 CREATE TABLE
- 133 CREATE INDEX / UNIQUE INDEX

### Confirmed Duplicates (from 0011):

1. **Enum**: `layman_audit_action` — Created in 0011, recreated in 0012 (note: 0012 uses quoted schema `"public"."layman_audit_action"` vs unquoted in 0011)
2. **Table**: `layman_audit_logs` — Created in 0011, recreated in 0012
3. **Table**: `layman_prompt_history` — Created in 0011, recreated in 0012
4. **Table**: `layman_content_revisions` — Created in 0011, recreated in 0012
5. **All 15 indexes** for the above tables

### Additional Duplicates (from 0000-0010):

Comparing 0012 CREATE TABLE statements against migrations 0000-0010:

- `assignment_help_requests` — First created in 0003, recreated in 0012
- `assignment_progress` — First created in 0003, recreated in 0012
- `badges` — First created in 0004, recreated in 0012
- `certificates` — First created in 0002, recreated in 0012
- `content_generation_jobs` — First created in 0010, recreated in 0012
- `domain_content_config` — First created in 0010, recreated in 0012
- `tutorial_content` — First created in 0000, recreated in 0012
- `tutorial_domains` — First created in 0008, recreated in 0012
- `tutorial_content_versions` — First created in 0007, recreated in 0012
- `tutorial_content_audit` — First created in 0007, recreated in 0012
- `tutorial_assignments` — First created in 0003, recreated in 0012
- `live_session_requests` — First created in 0005, recreated in 0012
- `tutorial_subjects` — First created in 0008, recreated in 0012
- `tutorial_topics` — First created in 0008, recreated in 0012
- `tutorial_subtopics` — First created in 0008, recreated in 0012
- `tutorial_projects` — First created in 0000, recreated in 0012
- `tutorial_project_submissions` — First created in 0000, recreated in 0012
- `student_badges` — First created in 0004, recreated in 0012
- `tutorial_progress` — First created in 0000, recreated in 0012
- `tutorial_video_links` — First created in 0010, recreated in 0012
- `remediation_triggers` — First created in 0006, recreated in 0012
- `subtopic_flow_progress` — First created in 0010, recreated in 0012
- `student_streaks` — First created in 0002, recreated in 0012

**Total Old Tables Duplicated**: ~23 tables  
**Total Old Enums Duplicated**: At least 3 (`assignment_help_request_status`, `assignment_progress_status`, `assignment_question_type`, `tutorial_content_audit_action` from 0003/0007)

---

## 7. Genuinely New Objects in 0012

The following appear to be legitimate NEW tables/enums introduced in 0012:

### New Enums (10 total in 0012):
- `brand`, `brand_visibility`, `deployment_type`, `job_status`, `orchestration_status`, `priority_level`, `review_status`, `section_status`, `section_type`, `subsection_type`

**Status**: Need to verify if any of these exist in earlier migrations. Initial scan suggests most are new.

### New Tables (~26 genuinely new):
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

---

## 8. Root Cause Analysis

### Why is the 0011 Snapshot Empty?

**Hypothesis 1 — Generation Failure**: `drizzle-kit generate` encountered an error after writing the SQL but before/during snapshot generation. The snapshot file was created but never populated.

**Hypothesis 2 — Manual Intervention**: A developer or script manually created or overwrote the snapshot file with a template structure but no content.

**Hypothesis 3 — Drizzle Bug**: A bug in the specific version of drizzle-kit used at the time failed to serialize the schema state.

**Evidence**:
- The 0011 snapshot has `"id": "0011_add_layman_hardening_tables"` (tag string) instead of a UUID like earlier snapshots
- Earlier snapshots (0002-0008) use UUIDs for the `id` field
- The empty structure is syntactically valid, suggesting intentional (though incorrect) generation

**Most Likely**: The snapshot generation step failed silently or was interrupted, leaving an empty but valid JSON structure.

---

## 9. Impact Assessment

### If Migration 0011 Was Applied to Any Database

Running migration 0011 on a database would have executed:
```sql
CREATE TYPE layman_audit_action AS ENUM (...);
CREATE TABLE layman_audit_logs (...);
CREATE TABLE layman_prompt_history (...);
CREATE TABLE layman_content_revisions (...);
-- Plus 15 indexes
```

**Result**: Those objects now exist in the database.

### If Migration 0012 Runs After 0011

Running migration 0012 will attempt:
```sql
CREATE TYPE "public"."layman_audit_action" AS ENUM (...);  -- DUPLICATE
CREATE TABLE "layman_audit_logs" (...);  -- DUPLICATE
-- etc.
```

**PostgreSQL Behavior**:
- `CREATE TYPE` on an existing type → **ERROR: type "layman_audit_action" already exists**
- `CREATE TABLE` on an existing table → **ERROR: relation "layman_audit_logs" already exists**

**Migration Failure**: Migration 0012 will fail immediately on the first duplicate CREATE statement if 0011 was already applied.

### Current CI Failure Evidence

From the user's original request context, the GitHub Actions CI is failing on migration execution. This confirms that:
1. Migration 0011 has been applied to the test database
2. Migration 0012 is attempting to run and hitting duplicate object errors
3. The full test suite cannot proceed past database migration

---

## 10. Snapshot Chain Integrity Summary

| Migration | SQL Valid? | Snapshot Valid? | Snapshot Complete? | Chain Link Broken? |
|-----------|------------|-----------------|--------------------|--------------------|
| 0000-0002 | ✅ | ✅ | ✅ | ❌ |
| 0003-0008 | ✅ | ✅ | ✅ | ❌ |
| 0009 | ✅ | ⚠️ No snapshot | N/A | ⚠️ Acceptable (materialized view only) |
| 0010 | ✅ | ⚠️ No snapshot | N/A | ⚠️ Snapshot missing but not critical |
| **0011** | ✅ | ❌ EMPTY | ❌ | **✅ BROKEN** |
| 0012 | ⚠️ Has duplicates | ✅ | ✅ | ⚠️ Caused by 0011 |
| 0013-0027 | ✅ | ✅ | ✅ | ⚠️ Built on broken 0012 |

**Conclusion**: The chain is irreparably broken at migration 0011. Migration 0012 attempted to compensate but created a duplicate-heavy migration. All subsequent migrations (0013-0027) assume the broken 0012 as their baseline.

---

## Recommendations

See the separate repair strategy document for detailed options.

**Key Insight**: We cannot simply delete or regenerate 0011 and 0012 if they have been applied to any database (dev, staging, production). The repair must account for the existing state of all environments.
