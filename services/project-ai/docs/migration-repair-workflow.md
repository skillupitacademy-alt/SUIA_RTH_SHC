# Migration Repair Workflow System

## Overview

The Migration Repair Workflow System is an autonomous execution framework that discovers repository state, understands migration chains, plans repairs, executes them in isolated environments, runs tests, captures complete evidence, reviews its own work through independent agents, and publishes approved changes.

### Key Principles

1. **Evidence-Based Verification**: Success is established through authenticated execution records, database identity verification, migration ledger state, command exit codes, and test output—not just claim assertions.

2. **Fail-Closed Design**: A successful migration command is not sufficient. The system must establish that the intended schema exists, the migration chain is consistent, required tests actually ran, and the evidence belongs to the exact commit being reviewed.

3. **Independent Review**: Multiple independent agents review work without trusting prior agent conclusions.

4. **Immutable Evidence**: All evidence is recorded in append-only JSONL ledgers with artifact hashing for tamper detection.

5. **Safety-First**: Production databases are never mutated automatically. All verification uses disposable test databases.

## Architecture

### Execution DAG

The workflow is organized into 10 sequential waves (W0-W9) containing 13 specialized agents. Agents within the same wave can execute in parallel when their file ownership and inputs are independent.

```
W0: Workflow Controller (Agent 0)
    ↓
W1: Parallel Audit Agents
    ├─ Migration Audit (Agent 1)
    ├─ DB Safety Audit (Agent 2)
    ├─ Test Inventory (Agent 3)
    └─ Evidence Audit (Agent 4)
    ↓
W2: Repair Planner (Agent 5)
    ↓
W3: Independent Repair Review (Agent 6)
    ↓
W4: Repair Implementer (Agent 7)
    ↓
W5: Parallel Pre-Verification
    ├─ Static Review (Agent 8)
    └─ Test Review (Agent 9)
    ↓
W6: Verification Runner (Agent 10)
    ↓
W7: Evidence Assembler (Agent 11)
    ↓
W8: Final Independent Gate (Agent 12)
    ↓
W9: Publisher (Agent 13)
```

### Dependency Rules

- **W1 agents** run in parallel (read-only baseline audit)
- **W2** runs after all W1 agents complete
- **W3** reviews W2 output; may return to W2 if rejected
- **W4** runs only after W3 approval
- **W5 agents** run in parallel after W4 completes
- **W6** runs sequentially (migrations → schema checks → tests)
- **W7** runs after W6 produces outputs
- **W8** runs after W7 assembles evidence
- **W9** runs only after W8 approval
- Failed prerequisites block dependent work (marked as `BLOCKED`)

## Agent Responsibilities

### Agent 0: Workflow Controller

**Wave**: W0  
**Type**: Sequential  
**Capabilities**:
- Load existing project instructions and canonical docs
- Load current workflow state and permissions
- Create workflow run record with unique workflow_id
- Generate baseline SHA for version binding
- Create file ownership map to prevent conflicts
- Build execution plan and dependency graph
- Persist workflow state for resumption

**Outputs**:
- `workflow_id`: Unique identifier for this repair run
- `baseline_sha`: Git commit SHA at workflow start
- `file_ownership_map`: Which agents own which files
- `execution_plan`: Ordered list of agents to execute

**Safety Constraints**:
- Read-only operations only
- Never mutates repository or database
- Establishes immutable baseline for evidence binding

---

### Agent 1: Migration Audit

**Wave**: W1  
**Type**: Parallel (with Agents 2-4)  
**Capabilities**:
- Scan migration SQL files in chronological order
- Parse CREATE TABLE, ALTER TABLE, DROP statements
- Detect duplicate object definitions (tables, indexes, constraints)
- Verify Drizzle journal consistency
- Check snapshot metadata matches migration files
- Analyze dependency order between migrations

**Outputs**:
- `migrations_scanned`: List of migration files with timestamps
- `duplicate_objects`: Objects defined multiple times
- `journal_consistent`: Boolean indicating journal/SQL alignment
- `snapshot_consistent`: Boolean indicating snapshot/SQL alignment
- `dependency_violations`: Migrations referencing non-existent objects

**Evidence Requirements**:
- Migration file paths and line numbers for duplicates
- Journal entries with timestamps
- Snapshot metadata version

**Safety Constraints**:
- Read-only; never modifies migration files in W1
- Does not execute migrations
- Does not connect to database

---

### Agent 2: Database Safety Audit

**Wave**: W1  
**Type**: Parallel (with Agents 1, 3-4)  
**Capabilities**:
- Validate database connection string format
- Verify database identity (name, host, port)
- Check environment (development, test, production)
- Verify user privileges (DDL, DML permissions)
- Assess backup/restore capability
- Enforce target database safety rules

**Outputs**:
- `database_identity`: Name, host, environment classification
- `privileges`: List of granted SQL privileges
- `is_production`: Boolean flag (MUST be false for auto-repair)
- `backup_available`: Boolean indicating backup capability
- `safety_verdict`: SAFE, UNSAFE, or UNKNOWN

**Evidence Requirements**:
- `SELECT version()` output
- `SELECT current_database()` output
- Connection string (redacted credentials)
- Environment variable values

**Safety Constraints**:
- Rejects production databases automatically
- Never allows mutation without explicit test environment confirmation
- Logs all connection attempts to evidence ledger

**Non-Negotiable Rule**: The system MUST NOT repeat migrations against a production database or claim they passed unless it can produce authenticated execution records with database identity, migration ledger state, command exit codes, and test output.

---

### Agent 3: Test Inventory

**Wave**: W1  
**Type**: Parallel (with Agents 1-2, 4)  
**Capabilities**:
- Discover test scripts in package.json and pytest configuration
- Identify test fixtures and data files
- Catalog integration tests requiring database
- Catalog security tests
- Map test coverage to migration files
- Detect test discovery patterns (pytest, vitest)

**Outputs**:
- `test_scripts`: List of discovered test commands
- `integration_tests`: Tests requiring TEST_DATABASE_URL_TUTORIAL
- `security_tests`: Tests in tests/security/ or tests/integration/
- `test_fixtures`: Data files used by tests
- `coverage_map`: Which tests cover which migrations

**Evidence Requirements**:
- package.json `scripts` section
- pytest.ini or pyproject.toml test configuration
- List of test file paths

**Safety Constraints**:
- Read-only discovery phase
- Does not execute tests in W1

---

### Agent 4: Evidence Audit

**Wave**: W1  
**Type**: Parallel (with Agents 1-3)  
**Capabilities**:
- Check existing evidence JSONL ledgers
- Validate ledger format (one JSON object per line)
- Identify missing evidence for prior runs
- Verify artifact locations exist
- Check evidence timestamps for staleness

**Outputs**:
- `ledgers_found`: List of JSONL files in .agents/evidence/
- `missing_evidence`: Expected evidence not found
- `stale_evidence`: Evidence older than 24 hours
- `ledger_valid`: Boolean indicating JSONL format correctness

**Evidence Requirements**:
- Ledger file paths
- Record counts per ledger
- Timestamp of most recent entry

**Safety Constraints**:
- Read-only; never truncates or modifies ledgers
- Append-only ledger contract enforcement

---

### Agent 5: Repair Planner

**Wave**: W2  
**Type**: Sequential (depends on W1 completion)  
**Capabilities**:
- Aggregate findings from W1 agents
- Map each duplicate object finding to exact migration file
- Propose minimal schema-preserving patches
- Assess risk (low, medium, high) for each repair
- Generate rollback plan
- Produce single unified repair plan

**Outputs**:
- `repair_plan`: List of corrections with file, line, object, intended fix
- `risk_assessment`: Risk level per correction
- `rollback_plan`: Steps to revert changes if needed
- `affected_migrations`: List of migration files to modify

**Evidence Requirements**:
- Exact line numbers and SQL statements
- Justification for each proposed change
- Evidence references to W1 findings

**Safety Constraints**:
- No edits until plan is reviewed (W3)
- Only proposes changes; does not apply them
- Plans must preserve existing schema semantics

---

### Agent 6: Independent Repair Review

**Wave**: W3  
**Type**: Sequential (depends on W2 completion)  
**Capabilities**:
- Review repair plan independently
- Check if earlier migrations already create the object
- Reject destructive changes (DROP, TRUNCATE without justification)
- Reject speculative changes (not backed by W1 findings)
- Verify schema preservation
- Return to W2 with specific findings if rejected

**Outputs**:
- `review_verdict`: APPROVED, REJECTED, or NEEDS_REVISION
- `review_findings`: List of issues found (if rejected)
- `approved_corrections`: Subset of plan approved for implementation

**Evidence Requirements**:
- Independent verification of duplicate detection
- Cross-reference with earlier migrations
- Justification for approval or rejection

**Safety Constraints**:
- Cannot approve own work (must be independent from Agent 5)
- Rejects if W1 evidence is missing or insufficient
- Returns to W2 instead of proceeding to W4 if rejected

---

### Agent 7: Repair Implementer

**Wave**: W4  
**Type**: Sequential (depends on W3 approval)  
**Capabilities**:
- Apply approved minimal patches to migration files
- Update canonical docs if migration semantics changed
- Update test specifications if new test coverage needed
- Maintain disposable git branch/worktree isolation
- Preserve file ownership (only designated owner edits migrations)

**Outputs**:
- `files_modified`: List of file paths changed
- `patch_diff`: Git diff of changes
- `branch_name`: Isolated branch name
- `commit_sha_before`: SHA before changes
- `commit_sha_after`: SHA after changes (temporary)

**Evidence Requirements**:
- Full git diff
- Line-by-line change justification
- Mapping to approved repair plan items

**Safety Constraints**:
- Only applies changes approved by Agent 6
- Never modifies files outside approved scope
- Uses isolated worktree to prevent contamination
- Does not push changes (publication happens in W9)

---

### Agent 8: Static Reviewer

**Wave**: W5  
**Type**: Parallel (with Agent 9)  
**Capabilities**:
- Check SQL syntax patterns for errors
- Verify migration order preserved
- Validate snapshot/journal consistency after changes
- Review diff scope (ensure only intended files changed)
- Detect unintended side effects

**Outputs**:
- `syntax_valid`: Boolean indicating SQL syntax correctness
- `order_preserved`: Boolean indicating migration order unchanged
- `consistency_maintained`: Snapshot/journal still aligned
- `diff_scope_correct`: Only approved files changed

**Evidence Requirements**:
- SQL syntax check results
- Journal diff before/after
- Snapshot diff before/after

**Safety Constraints**:
- Static analysis only; does not execute SQL
- Fails closed on any inconsistency

---

### Agent 9: Test Reviewer

**Wave**: W5  
**Type**: Parallel (with Agent 8)  
**Capabilities**:
- Ensure tests cover the exact duplicate-object failure
- Validate downstream checks (integration, security tests)
- Verify test completeness (no gaps in coverage)
- Check that new tests are runnable

**Outputs**:
- `duplicate_test_exists`: Boolean indicating test for duplicate error
- `downstream_tests_valid`: Boolean indicating integration/security coverage
- `test_coverage_complete`: Boolean indicating no gaps
- `new_tests_added`: List of new test files (if any)

**Evidence Requirements**:
- Test file paths covering the duplicate scenario
- Test command that reproduces the original failure
- Expected test output before and after repair

**Safety Constraints**:
- Does not execute tests; reviews test existence and correctness
- W6 will execute tests

---

### Agent 10: Verification Runner

**Wave**: W6  
**Type**: Sequential (depends on W5 completion)  
**Capabilities**:
- Execute full migration chain against fresh disposable PostgreSQL
- Verify schema state matches expected (tables, columns, indexes exist)
- Run package tests (pytest tests/)
- Run backend integration tests (requires TEST_DATABASE_URL_TUTORIAL)
- Run security tests
- Sequential dependency: migrations must pass before tests are valid

**Outputs**:
- `migration_exit_code`: Exit code from migration command
- `schema_verified`: Boolean indicating schema matches expected
- `tests_exit_code`: Exit code from test command
- `tests_passed`: Number of tests passed
- `tests_failed`: Number of tests failed
- `integration_tests_passed`: Number of integration tests passed
- `security_tests_passed`: Number of security tests passed

**Evidence Requirements**:
- Complete stdout/stderr logs from migration execution
- Database schema dump after migrations
- Complete test output (JUnit XML or JSON)
- Exit codes for all commands

**Safety Constraints**:
- Uses disposable test database only (never production)
- Fresh database for each run (no state contamination)
- If migrations fail, downstream tests are marked BLOCKED (not RUN)
- Logs all commands executed to evidence ledger

**Non-Negotiable Rule**: If migration execution fails, workflow must mark downstream database integration tests as `BLOCKED`, not silently skip them or report an overall pass.

---

### Agent 11: Evidence Assembler

**Wave**: W7  
**Type**: Sequential (depends on W6 completion)  
**Capabilities**:
- Collect raw logs and exit codes from W6
- Capture test results (JUnit/JSON format)
- Perform database schema checks
- Record commit identity (SHA-256)
- Hash all artifacts for tamper detection
- Write to evidence ledger (append-only JSONL)

**Outputs**:
- `evidence_bundle`: Complete evidence package
- `artifact_hashes`: SHA-256 hashes of all artifacts
- `ledger_entries`: List of JSONL entries written
- `schema_dump_path`: Path to schema snapshot file

**Evidence Requirements**:
- Raw command logs (stdout, stderr)
- Exit codes for every command
- Test results (passed, failed, skipped counts)
- Database schema dump
- Commit SHA of tested code
- Artifact hashes (migration files, test outputs)

**Safety Constraints**:
- Append-only writes to ledger (never truncates)
- All evidence timestamped with ISO 8601 UTC
- Evidence bound to exact commit SHA

---

### Agent 12: Final Independent Gate

**Wave**: W8  
**Type**: Sequential (depends on W7 completion)  
**Capabilities**:
- Review code changes independently
- Review test evidence independently
- Verify commit identity matches tested commit
- Cross-reference evidence with repair plan
- Issue verdict: PASS, FAIL, or BLOCKED
- Cannot promote to production-ready based on claim alone

**Outputs**:
- `final_verdict`: PASS, FAIL, or BLOCKED
- `gate_findings`: List of issues preventing PASS
- `certification_ready`: Boolean (true only if PASS)

**Evidence Requirements**:
- Independent verification of all W1-W7 outputs
- Evidence completeness check
- Commit SHA verification

**Safety Constraints**:
- Cannot pass without complete evidence bundle
- Cannot pass if commit SHA doesn't match tested code
- Cannot pass if any W6 tests failed
- Cannot pass if schema verification failed
- Independent from prior agents (does not trust their conclusions)

**Non-Negotiable Rule**: Certification CANNOT be granted merely because the repair agent says it succeeded. The gate must verify the intended schema exists, the migration chain is consistent, required tests actually ran, and the evidence belongs to the exact commit being reviewed.

---

### Agent 13: Publisher

**Wave**: W9  
**Type**: Sequential (depends on W8 approval)  
**Capabilities**:
- Commit verified changes with evidence references
- Publish evidence bundle to .agents/evidence/
- Confirm published SHA matches tested SHA
- Record publication audit trail
- Update workflow status to COMPLETED

**Outputs**:
- `published_commit_sha`: Git commit SHA of published changes
- `sha_match_verified`: Boolean indicating SHA matches tested code
- `evidence_published`: Boolean indicating evidence bundle published
- `publication_timestamp`: ISO 8601 timestamp of publication

**Evidence Requirements**:
- Publication audit record
- Commit message with evidence references
- SHA verification proof

**Safety Constraints**:
- Only publishes if W8 verdict is PASS
- Never pushes to remote automatically (manual push required)
- Does not certify the implementation itself (certification is W8 responsibility)
- Records publication as separate audit event

---

## Safety Constraints

### Production Database Protection

**Mandatory Safety Rules:**

1. **Never Mutate Production**: The system MUST reject any workflow that targets a production database (e.g., `tutorial_prod`, `neon-prod`).

2. **Explicit Test Environment**: All database operations during verification MUST use disposable test databases with explicit confirmation.

3. **Database Identity Verification**: Before any migration execution, Agent 2 verifies:
   - Database name matches expected test database
   - Connection string does not point to production
   - Environment classification is TEST or DEVELOPMENT
   - `is_production` flag is FALSE

4. **Authenticated Execution Records**: The system MUST NOT claim production migrations passed unless it can produce:
   - Database identity proof (SELECT current_database())
   - Migration ledger state (before/after comparison)
   - Command exit codes (all zero for success)
   - Test output (integration and security tests passed)
   - Commit SHA binding (evidence matches exact tested code)

### Fail-Closed Enforcement

**Fundamental Requirement**: `BLOCKED` or `SKIPPED` statuses NEVER resolve to `PASS`.

**Implementation:**

1. **Failed Prerequisites Block Dependents**: If Agent N fails or is blocked, all agents depending on Agent N are marked `BLOCKED` (not skipped, not passed).

2. **Migration Failure Blocks Tests**: If W6 migration execution fails (non-zero exit code), downstream tests are marked `BLOCKED` and the workflow CANNOT proceed to W7.

3. **Incomplete Evidence Blocks Gate**: If W7 cannot assemble complete evidence (missing logs, missing hashes, missing test results), W8 MUST issue `BLOCKED` verdict.

4. **Gate Rejection Stops Publication**: If W8 issues `FAIL` or `BLOCKED` verdict, W9 CANNOT run. The workflow terminates without publication.

### Allowed Commands

Migration repair workflow agents are restricted to these approved commands:

**Git Operations:**
- `git status`
- `git diff`
- `git log`
- `git show`
- `git add <files>`
- `git commit -m <message>`
- `git checkout -b <branch>`
- `git worktree add <path> <branch>`
- `git worktree remove <path>`

**Migration Operations:**
- `pnpm --filter @quiz/db-tutorial db:migrate` (test database only)
- `pnpm --filter @quiz/db-tutorial db:generate` (schema changes)

**Test Operations:**
- `pytest tests/`
- `pytest tests/ -v`
- `pytest tests/ --cov=app --cov-report=html`
- `pytest tests/integration/` (requires TEST_DATABASE_URL_TUTORIAL)
- `pytest tests/security/`

**Database Query (Read-Only):**
- `psql <connection> -c "SELECT version()"`
- `psql <connection> -c "SELECT current_database()"`
- `psql <connection> -c "\dt"` (list tables)

**Prohibited Commands:**
- Direct SQL execution (INSERT, UPDATE, DELETE, DROP) without migration
- `git push` (publication is manual step after W9)
- `git push --force` (absolutely forbidden)
- Commands targeting production databases
- Shell commands outside approved list

### How to Extend ALLOWED_COMMANDS

To add a new command to the allowed list:

1. **Justify Safety**: Document why the command is safe (read-only, idempotent, or properly gated).

2. **Update Documentation**: Add the command to this section with usage constraints.

3. **Update Agent Implementation**: Modify the relevant agent's command execution logic to include the new command.

4. **Add Test Coverage**: Write a test in `tests/security/` to verify the command is executed correctly and safely.

5. **Update Evidence Schema**: If the command produces new evidence types, update `app/evidence/schemas.py` and document the new evidence fields.

**Example: Adding a new database query command**

```python
# In Agent 2 (Database Safety Audit)
ALLOWED_READONLY_QUERIES = [
    "SELECT version()",
    "SELECT current_database()",
    "\\dt",  # List tables
    "\\d <table_name>",  # NEW: Describe table schema
]
```

Document in this section:

**Database Query (Read-Only):**
- `psql <connection> -c "\d <table>"` (describe table schema)

## Evidence Requirements

### Ledger Format

All evidence is recorded in append-only JSONL (JSON Lines) files located in `.agents/evidence/` at the repository root.

**Ledger Files:**

1. **agent-runs.jsonl**: Records each agent execution
2. **test-results.jsonl**: Records test execution results
3. **gate-results.jsonl**: Records gate decisions
4. **workflow-events.jsonl**: Records workflow state transitions
5. **evidence.jsonl**: Records artifact metadata

### Evidence Record Schema

**Agent Run Record (agent-runs.jsonl):**

```json
{
  "runId": "run_20240115_123456_agent5",
  "agentId": "repair_planner",
  "wave": "W2",
  "commitBefore": "abc123...",
  "commitAfter": "def456...",
  "filesChanged": ["packages/db-tutorial/migrations/0027_fix_duplicates.sql"],
  "tests": {
    "passed": 288,
    "failed": 0,
    "skipped": 0,
    "duration": 12.5
  },
  "evidence": [
    {
      "id": "evidence_20240115_123456_001",
      "type": "repair_plan",
      "workflowId": "workflow_20240115_123456",
      "artifactPath": ".agents/evidence/repair_plan_workflow_20240115_123456.json",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "timestamp": "2024-01-15T12:34:56.789Z"
    }
  ],
  "status": "completed",
  "timestamp": "2024-01-15T12:34:56.789Z"
}
```

**Field Descriptions:**

- `runId`: Unique identifier for this agent run (format: `run_<date>_<time>_<agentId>`)
- `agentId`: Agent identifier (e.g., `migration_audit`, `repair_planner`)
- `wave`: Wave identifier (W0-W9)
- `commitBefore`: Git commit SHA before agent execution
- `commitAfter`: Git commit SHA after agent execution (same as before if no changes)
- `filesChanged`: List of file paths modified by this agent
- `tests`: Test results (passed, failed, skipped, duration in seconds)
- `evidence`: Array of artifact records produced by this agent
- `status`: Execution status (`completed`, `failed`, `blocked`)
- `timestamp`: ISO 8601 timestamp in UTC

**Evidence Artifact Record (evidence.jsonl):**

```json
{
  "id": "evidence_20240115_123456_001",
  "type": "migration_logs",
  "workflowId": "workflow_20240115_123456",
  "artifactPath": ".agents/evidence/migration_logs_workflow_20240115_123456.txt",
  "sha256": "5d41402abc4b2a76b9719d911017c592",
  "timestamp": "2024-01-15T12:34:56.789Z"
}
```

**Field Descriptions:**

- `id`: Unique evidence identifier
- `type`: Evidence type (e.g., `migration_logs`, `test_results`, `schema_dump`, `repair_plan`)
- `workflowId`: Associated workflow identifier
- `artifactPath`: Relative path to artifact file from repository root
- `sha256`: SHA-256 hash of artifact content (for tamper detection)
- `timestamp`: ISO 8601 timestamp in UTC

**Test Result Record (test-results.jsonl):**

```json
{
  "suite": "integration_tests",
  "workflowId": "workflow_20240115_123456",
  "passed": 26,
  "failed": 0,
  "skipped": 0,
  "duration": 8.2,
  "exitCode": 0,
  "timestamp": "2024-01-15T12:35:10.123Z"
}
```

**Gate Result Record (gate-results.jsonl):**

```json
{
  "gateId": "final_gate",
  "workflowId": "workflow_20240115_123456",
  "decision": "PASS",
  "findings": [],
  "evidenceReviewed": [
    "evidence_20240115_123456_001",
    "evidence_20240115_123456_002"
  ],
  "timestamp": "2024-01-15T12:36:00.456Z"
}
```

### Evidence Completeness Requirements

For W8 Final Gate to issue a `PASS` verdict, the following evidence MUST be present:

1. **W1 Audit Evidence:**
   - Migration audit findings (duplicate objects, journal consistency)
   - Database safety report (identity, environment, privileges)
   - Test inventory (integration tests, security tests)
   - Evidence audit report (ledger validation)

2. **W2 Repair Plan Evidence:**
   - Complete repair plan with line numbers and justifications
   - Risk assessment for each proposed change
   - Rollback plan

3. **W3 Review Evidence:**
   - Independent review verdict (APPROVED)
   - Review findings (must be empty for approval)

4. **W4 Implementation Evidence:**
   - Git diff of changes
   - List of files modified
   - Commit SHA after changes

5. **W5 Pre-Verification Evidence:**
   - Static review results (syntax valid, order preserved)
   - Test review results (coverage complete)

6. **W6 Verification Evidence:**
   - Migration execution logs (stdout, stderr)
   - Migration exit code (must be 0)
   - Schema verification proof
   - Test execution logs (unit, integration, security)
   - Test exit codes (all must be 0)
   - Test counts (passed, failed, skipped)

7. **W7 Evidence Assembly:**
   - Artifact hashes (SHA-256 for all artifacts)
   - Ledger entries written
   - Schema dump file

### Hash-Bound Artifacts

All artifacts MUST be bound to their content hash (SHA-256) to enable tamper detection.

**Hash Computation:**

```python
import hashlib

def compute_artifact_hash(file_path: str) -> str:
    """Compute SHA-256 hash of artifact file."""
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()
```

**Hash Verification:**

Before using any artifact, verify its hash:

```python
def verify_artifact_hash(file_path: str, expected_hash: str) -> bool:
    """Verify artifact hash matches expected value."""
    actual_hash = compute_artifact_hash(file_path)
    return actual_hash == expected_hash
```

If hash verification fails, the artifact MUST be rejected and the workflow MUST be marked `BLOCKED`.

## Troubleshooting Guide

### Common Failures

#### 1. Migration Execution Failed (W6)

**Symptom**: Agent 10 (Verification Runner) reports non-zero exit code from migration command.

**Possible Causes:**
- SQL syntax error in repaired migration
- Database connection failure
- Permission denied on test database
- Duplicate object still exists (repair was incomplete)

**Resolution Steps:**
1. Check migration logs in evidence bundle: `.agents/evidence/migration_logs_<workflow_id>.txt`
2. Locate the failing migration file and line number
3. Verify repair was applied correctly (Agent 7 diff)
4. Return to W2 (Repair Planner) with findings from W6
5. Re-run workflow with revised repair plan

#### 2. Test Failures After Migration (W6)

**Symptom**: Migrations succeed but integration tests fail.

**Possible Causes:**
- Schema change broke existing code
- Test fixtures incompatible with new schema
- Missing test data for new tables/columns
- Connection string misconfigured (TEST_DATABASE_URL_TUTORIAL)

**Resolution Steps:**
1. Check test logs: `.agents/evidence/test_results_<workflow_id>.txt`
2. Identify which tests failed (pytest will show test names)
3. Verify schema matches expected (check schema dump)
4. Update test fixtures if schema changed intentionally
5. Add new tests to cover schema changes (Agent 9 responsibility)

#### 3. Final Gate Rejected (W8)

**Symptom**: Agent 12 issues `FAIL` or `BLOCKED` verdict.

**Possible Causes:**
- Incomplete evidence bundle (missing logs, hashes, or test results)
- Commit SHA mismatch (tested code doesn't match committed code)
- Test failures not addressed
- Schema verification failed

**Resolution Steps:**
1. Check gate findings: `.agents/evidence/gate_results_<workflow_id>.json`
2. Review evidence completeness (all required evidence types present?)
3. Verify commit SHA matches tested code (Agent 11 evidence)
4. Address any test failures or schema verification issues
5. Re-run workflow from W7 (Evidence Assembler) if evidence was incomplete

#### 4. Database Safety Audit Failed (W2)

**Symptom**: Agent 2 reports `UNSAFE` verdict or `is_production=true`.

**Possible Causes:**
- Connection string points to production database
- Environment variable incorrectly configured
- Database name matches production pattern

**Resolution Steps:**
1. Check database identity in evidence: `.agents/evidence/db_safety_<workflow_id>.json`
2. Verify `TEST_DATABASE_URL_TUTORIAL` environment variable is set correctly
3. Confirm database name is `tutorial_test` or similar test database
4. Never override safety checks to target production
5. If truly needed for production, use a separate manual workflow with explicit approvals

#### 5. Evidence Ledger Write Failed

**Symptom**: Agent execution succeeds but evidence not recorded in JSONL ledger.

**Possible Causes:**
- File permission denied on `.agents/evidence/` directory
- Disk space full
- Concurrent write conflict (should be prevented by file locking)
- Invalid JSON structure (shouldn't happen with Pydantic validation)

**Resolution Steps:**
1. Check file permissions: `ls -la .agents/evidence/`
2. Check disk space: `df -h`
3. Verify ledger files are not corrupted: `tail .agents/evidence/agent-runs.jsonl`
4. Re-run workflow; evidence appends should succeed on retry
5. If ledger is corrupted, restore from backup or create new ledger

### Debug Commands

**Check workflow status:**
```bash
cat .agents/evidence/workflow-events.jsonl | grep workflow_20240115_123456
```

**View agent run history:**
```bash
cat .agents/evidence/agent-runs.jsonl | grep workflow_20240115_123456 | jq .
```

**Check test results:**
```bash
cat .agents/evidence/test-results.jsonl | grep workflow_20240115_123456 | jq .
```

**Verify artifact hash:**
```python
import hashlib
import json

# Load evidence record
with open('.agents/evidence/evidence.jsonl') as f:
    for line in f:
        record = json.loads(line)
        if record['id'] == 'evidence_20240115_123456_001':
            expected_hash = record['sha256']
            artifact_path = record['artifactPath']
            
            # Compute actual hash
            hasher = hashlib.sha256()
            with open(artifact_path, 'rb') as af:
                hasher.update(af.read())
            actual_hash = hasher.hexdigest()
            
            print(f"Expected: {expected_hash}")
            print(f"Actual:   {actual_hash}")
            print(f"Match:    {expected_hash == actual_hash}")
```

**Inspect database after migration:**
```bash
psql $TEST_DATABASE_URL_TUTORIAL -c "\dt"  # List tables
psql $TEST_DATABASE_URL_TUTORIAL -c "\d project_ai_workflows"  # Describe table
```

### Getting Help

If troubleshooting steps don't resolve the issue:

1. **Collect Evidence Bundle**: Gather all `.agents/evidence/` files for the workflow
2. **Check Agent Logs**: Review stdout/stderr from each agent execution
3. **Verify Environment**: Confirm all environment variables are set correctly
4. **Test Isolation**: Run workflow in clean environment (fresh database, fresh git worktree)
5. **Manual Verification**: Manually execute the failing command to reproduce the issue

## How to Add New Verification Stages

To add a new verification stage (e.g., W10: Security Audit):

### Step 1: Define the Agent

Create a new agent type in `app/orchestration/agent_registry.py`:

```python
class AgentType(str, Enum):
    # ... existing agents ...
    SECURITY_AUDIT = "security_audit"  # NEW

# Add to agent registry
AgentType.SECURITY_AUDIT: Agent(
    agentId="security_audit",
    agentType=AgentType.SECURITY_AUDIT,
    name="Security Audit Agent",
    capabilities=["scan_for_vulnerabilities", "check_permissions", "verify_encryption"],
    status="active",
    description="Scans code for security vulnerabilities and verifies security best practices"
),
```

### Step 2: Create the Agent Implementation

Create `app/workflows/migration_repair/agents/security_audit.py`:

```python
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus

async def execute_security_audit(context: AgentContext) -> AgentResult:
    """Execute security audit verification."""
    result = AgentResult(
        agent_id="security_audit",
        status=AgentStatus.SUCCESS,
        outputs={},
        evidence_ids=[],
        errors=[],
        warnings=[]
    )
    
    # Implement security scanning logic
    # ...
    
    return result
```

### Step 3: Add Agent to Coordinator Dispatch

Update `app/orchestration/agent_coordinator.py`:

```python
elif agent.agentType == AgentType.SECURITY_AUDIT:
    from app.workflows.migration_repair.agents.security_audit import execute_security_audit
    return await execute_security_audit(context)
```

### Step 4: Update DAG Dependencies

Update workflow execution plan to include new agent:

```python
# In workflow controller
execution_plan = {
    # ... existing waves ...
    "W10": {
        "agents": ["security_audit"],
        "depends_on": ["W9"],  # Runs after publication
        "parallel": False
    }
}
```

### Step 5: Add Evidence Schema

Update `app/evidence/schemas.py` if new evidence types are needed:

```python
class SecurityAuditEvidence(BaseModel):
    """Security audit evidence record."""
    vulnerabilities_found: int
    severity_high: int
    severity_medium: int
    severity_low: int
    scan_timestamp: datetime
    scanner_version: str
```

### Step 6: Add Tests

Create `tests/workflows/migration_repair/test_security_audit.py`:

```python
import pytest
from app.workflows.migration_repair.agents.security_audit import execute_security_audit

@pytest.mark.asyncio
async def test_security_audit_no_vulnerabilities(mock_context):
    """Test security audit with no vulnerabilities."""
    result = await execute_security_audit(mock_context)
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["vulnerabilities_found"] == 0

@pytest.mark.asyncio
async def test_security_audit_finds_vulnerabilities(mock_context_with_vulns):
    """Test security audit detects vulnerabilities."""
    result = await execute_security_audit(mock_context_with_vulns)
    assert result.status == AgentStatus.FAILED
    assert result.outputs["vulnerabilities_found"] > 0
```

### Step 7: Update Documentation

Add the new agent to this document:

- Update the Architecture DAG diagram
- Add agent responsibility section (Agent 14: Security Audit)
- Update troubleshooting guide with new failure modes
- Update evidence requirements

### Step 8: Verify Integration

Test the new agent in the full workflow:

```bash
python scripts/run-migration-repair.py --dry-run
# Verify new agent appears in execution plan

python scripts/run-migration-repair.py
# Verify new agent executes and evidence is recorded
```

## Usage

See [CLI Usage Guide](#cli-usage) below for detailed usage examples.

---

## CLI Usage

The `run-migration-repair.py` script executes the migration repair workflow.

### Basic Usage

```bash
# Run full workflow
python scripts/run-migration-repair.py

# Preview execution plan without making changes
python scripts/run-migration-repair.py --dry-run

# Use custom database URL
python scripts/run-migration-repair.py --database-url postgresql://user:pass@localhost:55432/test_db

# Enable verbose logging
python scripts/run-migration-repair.py --verbose
```

### Command-Line Options

- `--dry-run`: Show execution plan without making changes
- `--database-url <url>`: Override TEST_DATABASE_URL_TUTORIAL environment variable
- `--verbose`: Enable verbose logging (DEBUG level)
- `--workflow-id <id>`: Resume existing workflow (default: create new)

### Output

The script logs progress to stdout and writes a final report to:
```
.agents/tasks/migration-repair-<workflow_id>-report.json
```

**Report Format:**

```json
{
  "workflow_id": "workflow_20240115_123456",
  "status": "COMPLETED",
  "agents_executed": [
    {
      "agent_id": "workflow_controller",
      "wave": "W0",
      "status": "SUCCESS",
      "execution_time_ms": 125.5
    },
    {
      "agent_id": "migration_audit",
      "wave": "W1",
      "status": "SUCCESS",
      "execution_time_ms": 2340.2
    }
    // ... all agents ...
  ],
  "evidence_paths": [
    ".agents/evidence/agent-runs.jsonl",
    ".agents/evidence/test-results.jsonl",
    ".agents/evidence/evidence.jsonl"
  ],
  "final_verdict": "PASS",
  "total_execution_time_ms": 45678.9,
  "timestamp": "2024-01-15T12:36:00.456Z"
}
```

### Interpreting Evidence Ledger

**View recent agent runs:**
```bash
tail -20 .agents/evidence/agent-runs.jsonl | jq .
```

**View test results:**
```bash
tail -10 .agents/evidence/test-results.jsonl | jq .
```

**View gate decisions:**
```bash
tail -10 .agents/evidence/gate-results.jsonl | jq .
```

**Filter by workflow ID:**
```bash
cat .agents/evidence/agent-runs.jsonl | grep workflow_20240115_123456 | jq .
```

### Example: Full Workflow Execution

```bash
# 1. Set environment variables
export TEST_DATABASE_URL_TUTORIAL="postgresql://user:pass@localhost:55432/tutorial_test"

# 2. Preview execution plan
python scripts/run-migration-repair.py --dry-run

# 3. Run workflow
python scripts/run-migration-repair.py --verbose

# 4. Check final report
cat .agents/tasks/migration-repair-<workflow_id>-report.json | jq .

# 5. View evidence
cat .agents/evidence/agent-runs.jsonl | tail -20 | jq .
```

### Example: Custom Database

```bash
# Run against specific test database
python scripts/run-migration-repair.py \
  --database-url postgresql://testuser:testpass@localhost:55432/my_test_db \
  --verbose
```

### Example: Resume Workflow

```bash
# Resume after W6 failure
python scripts/run-migration-repair.py \
  --workflow-id workflow_20240115_123456 \
  --verbose
```

---

## References

- [Agent Registry](../app/orchestration/agent_registry.py) - All agent definitions
- [Agent Coordinator](../app/orchestration/agent_coordinator.py) - DAG execution engine
- [Evidence Ledger](../app/evidence/ledger.py) - Append-only JSONL writers
- [Evidence Schemas](../app/evidence/schemas.py) - Pydantic models for evidence
- [Canonical Workflow](../app/orchestration/canonical_workflow.py) - State machine

## Contributing

When modifying the migration repair workflow:

1. **Preserve Fail-Closed Behavior**: Never change BLOCKED/SKIPPED to PASS
2. **Maintain Evidence Completeness**: All agents must populate evidence fields
3. **Update Documentation**: Keep this document in sync with code changes
4. **Add Tests**: Every agent must have unit and integration tests
5. **Verify Safety Constraints**: Never bypass production database protection

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Authors**: Project AI Team
