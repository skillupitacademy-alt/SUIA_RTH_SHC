# Database Schema Verification Report - W6-V2

**Script:** verify-database-schema.py
**Timestamp:** 2026-10-09T12:03:35.055183+00:00
**Workspace:** E:\onlinewebsites\quiz-platform
**Migration Directory:** E:\onlinewebsites\quiz-platform\packages\db-tutorial\migrations

## Summary

- Expected tables: 6
- Tables found: 6
- Tables missing: 0
- Total indexes defined in schema: 27 (23 regular + 4 unique)
- Total foreign keys: 5

## M2.9 Canonical Tables Verified

All 6 M2.9 canonical tables exist and are properly defined:

### 1. project_ai_workflows

- **Purpose:** Workflow lifecycle state, artifact bindings, approval tracking
- **Primary Key:** workflow_id (UUID)
- **Indexes (8 defined in schema):**
  - idx_workflow_state (current_state)
  - idx_workflow_requester (requester_id)
  - idx_workflow_target (target_family, target_version)
  - idx_workflow_contract_sha (contract_sha256)
  - idx_workflow_candidate_sha (candidate_sha256)
  - idx_workflow_manifest_sha (manifest_sha256)
  - idx_workflow_created_at (created_at)
  - uniq_workflow_idempotency (idempotency_key, UNIQUE)
- **Foreign Keys:** None (parent table)

### 2. project_ai_state_transitions

- **Purpose:** Audit trail for state changes
- **Primary Key:** id (SERIAL)
- **Foreign Keys (1):** fk_state_transitions_workflow_id → project_ai_workflows(workflow_id) ON DELETE CASCADE
- **Indexes (2 defined in schema):**
  - idx_transition_workflow (workflow_id)
  - idx_transition_timestamp (timestamp)

### 3. project_ai_contracts

- **Purpose:** Immutable engineering contracts (1:1 with workflows)
- **Primary Key:** contract_id (UUID)
- **Foreign Keys (1):** fk_contracts_workflow_id → project_ai_workflows(workflow_id) ON DELETE CASCADE
- **Indexes (4 defined in schema):**
  - idx_contract_workflow (workflow_id)
  - idx_contract_hash (contract_hash)
  - uniq_contract_workflow (workflow_id, UNIQUE)
  - uniq_contract_hash (contract_hash, UNIQUE)

### 4. project_ai_candidates

- **Purpose:** Candidate block packages for evaluation
- **Primary Key:** candidate_id (UUID)
- **Foreign Keys (1):** fk_candidates_workflow_id → project_ai_workflows(workflow_id) ON DELETE SET NULL
- **Indexes (3 defined in schema):**
  - idx_candidate_workflow (workflow_id)
  - idx_candidate_uploaded_at (uploaded_at)
  - idx_candidate_sha256 (candidate_sha256)

### 5. project_ai_manifests

- **Purpose:** Placement decisions and integration instructions
- **Primary Key:** manifest_id (UUID)
- **Foreign Keys (1):** fk_manifests_candidate_id → project_ai_candidates(candidate_id) ON DELETE CASCADE
- **Indexes (4 defined in schema):**
  - idx_manifest_candidate (candidate_id)
  - idx_manifest_hash (manifest_hash)
  - idx_manifest_decision (decision)
  - uniq_manifest_hash (manifest_hash, UNIQUE)

### 6. project_ai_approvals

- **Purpose:** Hash-bound implementation approval records (1:1 with workflows)
- **Primary Key:** approval_id (UUID)
- **Foreign Keys (1):** fk_approvals_workflow_id → project_ai_workflows(workflow_id) ON DELETE CASCADE
- **Indexes (5 defined in schema):**
  - idx_approval_workflow (workflow_id)
  - idx_approval_status (status)
  - idx_approval_candidate_sha (candidate_sha256)
  - idx_approval_manifest_sha (placement_manifest_sha256)
  - uniq_approval_workflow (workflow_id, UNIQUE)

## Schema File Analysis

- **Path:** packages/db-tutorial/src/schema/project-ai-persistence.ts
- **Status:** ✅ EXISTS
- **Tables Defined:** All 6 M2.9 canonical tables
- **Migration Authority:** Drizzle ORM (confirmed)
- **Architecture Notes:** 
  - All tables use project_ai_* namespace
  - Proper foreign key relationships with ON DELETE actions
  - Comprehensive indexing strategy on foreign keys, hash fields, and query patterns
  - UUID primary keys with gen_random_uuid() defaults
  - JSONB columns for flexible data structures

## Migration Files Verified

- **0026_steady_caretaker.sql:** Type conversions to varchar (pre-UUID migration)
- **0027_public_multiple_man.sql:** UUID conversion + foreign key recreation
- Tables are managed through Drizzle schema, indexes created inline during table creation

## Verification Result

✅ **PASS** - All M2.9 canonical schema requirements met:
- All 6 tables exist and are properly defined
- Foreign key relationships verified
- Comprehensive indexes defined in schema
- Proper ON DELETE cascade/set null behaviors
- Hash-based integrity fields present
