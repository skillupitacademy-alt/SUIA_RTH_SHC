# P0 Safety Fixes Implementation Plan

## Overview

Fix five critical security issues in the migration repair workflow:
1. Command injection vulnerability (runner.py)
2. Insufficient database validation (safety.py + verification_runner.py)
3. No guaranteed cleanup (verification.py)
4. Missing evidence verification (final_gate_agent.py)
5. No remote SHA confirmation (publisher_agent.py)

This plan adds strict validation, fail-closed behavior, and comprehensive unit tests.

---

## Current State Analysis

### runner.py
**Location**: `services/project-ai/app/workflows/migration_repair/runner.py`

**Current Pattern**: Uses `asyncio.create_subprocess_shell()` at line 82-86 which executes commands through the shell, enabling injection attacks via shell metacharacters.

**Issue**: User-supplied input or compromised commands could inject shell operators (`|`, `&`, `;`, `$()`, backticks, etc.) to execute arbitrary commands.

### safety.py
**Location**: `services/project-ai/app/workflows/migration_repair/safety.py`

**Current Pattern**: Only validates database names for "prod" markers (FORBIDDEN_PRODUCTION_MARKERS). Does not validate connection host, actual database allowlist, or credentials isolation.

**Issue**: Checking for 'prod' in database name is insufficient. An attacker could connect to production database with a different name, or to untrusted hosts.

### verification_runner.py
**Location**: `services/project-ai/app/workflows/migration_repair/agents/verification_runner.py`

**Current Pattern**: Calls `run_verification_pipeline()` without pre-connection database validation.

**Issue**: Database operations may execute against untrusted targets before validation occurs.

### verification.py
**Location**: `services/project-ai/app/workflows/migration_repair/verification.py`

**Current Pattern**: Runs V0-V10 stages sequentially. V10 is "Teardown Test Database" but there's no try/finally guarantee, no cleanup verification, no evidence logging.

**Issue**: If verification fails mid-pipeline (exception in V3-V9), cleanup never runs and test databases persist. No verification that cleanup succeeded.

### final_gate_agent.py
**Location**: `services/project-ai/app/workflows/migration_repair/agents/final_gate_agent.py`

**Current Pattern**: Maps stages from verification_runner outputs to check_results dictionary, calls `evaluate_final_gate()`. Does not verify evidence files exist, recompute hashes, or check commit SHA independently.

**Issue**: Trusts claims from prior agents without verification. Missing/tampered evidence files would not be detected. Commit identity assumed, not verified.

### publisher_agent.py
**Location**: `services/project-ai/app/workflows/migration_repair/agents/publisher_agent.py`

**Current Pattern**: Gets local SHA with `git rev-parse HEAD`, compares with tested SHA from implementer, but does NOT push (per instructions "Never push to remote"). Does not fetch remote SHA or verify publication.

**Issue**: If push is enabled in future, no verification that remote accepted the commit or that remote SHA matches local SHA. Publication could silently fail.

---

## Implementation Plan

### Feature 1: Fix Command Injection (FEAT-001)

- [ ] 1. **Replace shell execution with argument arrays in runner.py**
      
      Create `validate_argv()` function that rejects shell metacharacters: `|`, `&`, `;`, `$`, `` ` ``, `\`, `<`, `>`, `(`, `)`, `{`, `}`, `[`, `]`, `*`, `?`, `~`, `!`, `#`, newlines, quotes. Create `validate_executable()` to check against ALLOWED_COMMANDS. Replace `asyncio.create_subprocess_shell(command, ...)` at line 82 with `asyncio.create_subprocess_exec(*argv, ...)` where argv is validated argument array.
      
      Files: `services/project-ai/app/workflows/migration_repair/runner.py`
      
      Verify: `pytest services/project-ai/tests/test_runner_command_safety.py -v` passes all tests including test_rejects_pipe_metacharacter, test_rejects_semicolon, test_accepts_safe_command

- [ ] 2. **Create unit tests for command safety**
      
      Create `services/project-ai/tests/test_runner_command_safety.py` with 9+ tests covering: rejection of each shell metacharacter, acceptance of safe commands, executable allowlist validation. Tests use mocks to avoid actual execution.
      
      Files: `services/project-ai/tests/test_runner_command_safety.py` (new)
      
      Verify: `pytest services/project-ai/tests/test_runner_command_safety.py -v` shows 9+ tests passing

---

### Feature 2: Add Database Validation (FEAT-002)

- [ ] 3. **Add trusted host and database allowlists to safety.py**
      
      Add `TRUSTED_TEST_HOSTS = frozenset(['localhost', '127.0.0.1', 'test-postgres'])` and `TRUSTED_TEST_DATABASES = frozenset(['test_tutorial', 'test_quiz_platform', 'disposable_test_db'])` constants. Create `parse_database_url()` helper to extract host/database from PostgreSQL URLs. Create `validate_and_connect()` async function that validates target against allowlists before connecting.
      
      Files: `services/project-ai/app/workflows/migration_repair/safety.py`
      
      Verify: `pytest services/project-ai/tests/test_database_connection_validation.py -v` passes validation tests

- [ ] 4. **Update DatabaseTarget to validate host in VERIFY mode**
      
      Modify `DatabaseTarget.__post_init__()` to parse URL and check host against TRUSTED_TEST_HOSTS when mode is VERIFY. Add docstring warning: "Name pattern checking (prod in name) is NOT sufficient. Must validate against trusted host/database allowlists."
      
      Files: `services/project-ai/app/workflows/migration_repair/safety.py`
      
      Verify: `pytest services/project-ai/tests/test_migration_repair_safety.py -v` still passes, new tests in test_database_connection_validation.py pass

- [ ] 5. **Add pre-connection validation to verification_runner.py**
      
      Before calling `run_verification_pipeline()` in `execute_verification_runner()`, call `validate_and_connect()` from safety.py to validate database target. Fail with AgentStatus.BLOCKED if validation fails.
      
      Files: `services/project-ai/app/workflows/migration_repair/agents/verification_runner.py`
      
      Verify: `pytest services/project-ai/tests/test_migration_repair_agent_verification_runner.py -v` passes with new validation

- [ ] 6. **Create unit tests for database connection validation**
      
      Create `services/project-ai/tests/test_database_connection_validation.py` with 7+ tests covering: rejection of untrusted hosts, rejection of untrusted databases, acceptance of localhost + test_db, fail-closed on missing host, URL parsing, constants defined.
      
      Files: `services/project-ai/tests/test_database_connection_validation.py` (new)
      
      Verify: `pytest services/project-ai/tests/test_database_connection_validation.py -v` shows 7+ tests passing

---

### Feature 3: Guarantee Cleanup (FEAT-003)

- [ ] 7. **Add guaranteed cleanup with try/finally to verification.py**
      
      Create `ensure_cleanup()` async function that runs V10 teardown, verifies database dropped with `verify_database_dropped()`, logs to `.agents/evidence/runs/cleanup-{timestamp}.jsonl`. Wrap `run_verification_pipeline()` main logic in try/finally where finally always calls `ensure_cleanup()`. Mark stage as BLOCKED if cleanup fails.
      
      Files: `services/project-ai/app/workflows/migration_repair/verification.py`
      
      Verify: `pytest services/project-ai/tests/test_verification_cleanup.py -v` passes cleanup guarantee tests

- [ ] 8. **Add cleanup_status field to VerificationStage model**
      
      Update `VerificationStage` in `models.py` to include `cleanup_status: Optional[CheckStatus]` field for tracking cleanup verification.
      
      Files: `services/project-ai/app/workflows/migration_repair/models.py`
      
      Verify: `pytest services/project-ai/tests/test_migration_repair_models.py -v` passes with new field

- [ ] 9. **Create unit tests for cleanup guarantees**
      
      Create `services/project-ai/tests/test_verification_cleanup.py` with 6+ tests covering: cleanup runs in finally on success, cleanup runs on exception, cleanup verifies database dropped, failed cleanup marks BLOCKED, cleanup logs to evidence.
      
      Files: `services/project-ai/tests/test_verification_cleanup.py` (new)
      
      Verify: `pytest services/project-ai/tests/test_verification_cleanup.py -v` shows 6+ tests passing

---

### Feature 4: Verify Evidence (FEAT-004)

- [ ] 10. **Add evidence file verification to final_gate_agent.py**
      
      Create `verify_evidence_files()` async function that reads evidence manifest, checks each file exists, recomputes SHA-256 hashes, compares with claimed hashes. Create `verify_test_coverage()` to reject SKIPPED status for required tests. Create `verify_commit_identity()` to compare git SHA with tested SHA. Update `execute_final_gate_agent()` to call all verifications before gate evaluation.
      
      Files: `services/project-ai/app/workflows/migration_repair/agents/final_gate_agent.py`
      
      Verify: `pytest services/project-ai/tests/test_final_gate_verification.py -v` passes evidence verification tests

- [ ] 11. **Update gate.py to explicitly reject SKIPPED status**
      
      Modify `evaluate_final_gate()` in `gate.py` to explicitly check for and reject SKIPPED status on any required check. Add comment: "SKIPPED mandatory tests are treated as BLOCKED".
      
      Files: `services/project-ai/app/workflows/migration_repair/gate.py`
      
      Verify: `pytest services/project-ai/tests/test_migration_repair_gate.py -v` passes with SKIPPED rejection

- [ ] 12. **Create unit tests for evidence verification**
      
      Create `services/project-ai/tests/test_final_gate_verification.py` with 9+ tests covering: evidence existence checks, hash recomputation, tampered file detection, SKIPPED test rejection, commit SHA verification, gate BLOCKED on missing/tampered evidence.
      
      Files: `services/project-ai/tests/test_final_gate_verification.py` (new)
      
      Verify: `pytest services/project-ai/tests/test_final_gate_verification.py -v` shows 9+ tests passing

---

### Feature 5: Confirm Publication (FEAT-005)

- [ ] 13. **Add PublicationState tracking to models.py**
      
      Create `PublicationState` dataclass in `models.py` with fields: approval_status, local_sha, push_attempted, push_succeeded, remote_sha, sha_match, timestamp. This tracks all four publication phases.
      
      Files: `services/project-ai/app/workflows/migration_repair/models.py`
      
      Verify: `pytest services/project-ai/tests/test_migration_repair_models.py -v` passes with new model

- [ ] 14. **Add remote SHA verification to publisher_agent.py**
      
      Create `fetch_remote_sha()` async function that runs `git ls-remote origin HEAD` and parses SHA. Create `record_publication()` to write publication.json to `.agents/evidence/runs/`. Update `execute_publisher_agent()` to fetch remote SHA after push, compare with local SHA, return FAILED if mismatch.
      
      Files: `services/project-ai/app/workflows/migration_repair/agents/publisher_agent.py`
      
      Verify: `pytest services/project-ai/tests/test_publisher_verification.py -v` passes SHA verification tests

- [ ] 15. **Create unit tests for publication verification**
      
      Create `services/project-ai/tests/test_publisher_verification.py` with 7+ tests covering: PublicationState records all phases, fetch_remote_sha parses output, publication fails on SHA mismatch, publication succeeds on match, record_publication writes JSON, publisher blocked without approval.
      
      Files: `services/project-ai/tests/test_publisher_verification.py` (new)
      
      Verify: `pytest services/project-ai/tests/test_publisher_verification.py -v` shows 7+ tests passing

---

## Verification Summary

After all features are implemented, run the full test suite:

```bash
# All new tests
pytest services/project-ai/tests/test_runner_command_safety.py -v
pytest services/project-ai/tests/test_database_connection_validation.py -v
pytest services/project-ai/tests/test_verification_cleanup.py -v
pytest services/project-ai/tests/test_final_gate_verification.py -v
pytest services/project-ai/tests/test_publisher_verification.py -v

# Existing tests that should still pass
pytest services/project-ai/tests/test_migration_repair_safety.py -v
pytest services/project-ai/tests/test_migration_repair_gate.py -v
pytest services/project-ai/tests/test_migration_repair_models.py -v

# Full migration repair test suite
pytest services/project-ai/tests/ -k migration_repair -v
```

Expected: 38+ new tests passing, all existing migration_repair tests still passing.

---

## Order of Operations

Dependencies between features:
- **FEAT-001** (command safety) is independent - can be implemented first
- **FEAT-002** (database validation) is independent but affects FEAT-003
- **FEAT-003** (cleanup) depends on FEAT-001 (uses safe command execution)
- **FEAT-004** (evidence verification) is independent
- **FEAT-005** (publication) depends on FEAT-001 (uses safe git commands)

**Recommended order**: FEAT-001 → FEAT-002 → FEAT-003 → FEAT-004 → FEAT-005

This ensures command safety is fixed before any feature uses command execution.

---

## Test Execution Without Database Operations

All tests use mocks and in-memory validation:
- `unittest.mock.AsyncMock` for subprocess calls
- No actual `docker-compose up` or database connections
- Validation logic tested with synthetic inputs
- File I/O mocked or uses temporary test directories
- Git commands mocked to return synthetic SHAs

Tests verify validation logic, not actual infrastructure operations.

---

## Evidence Collection

Each feature implementation should record:
- Test execution output to `.agents/evidence/runs/test-{feature}-{timestamp}.txt`
- Coverage reports (if applicable)
- Verification stage results in structured JSON

Final verification step creates comprehensive evidence manifest at:
`.agents/evidence/runs/p0-safety-fixes-manifest.json`
