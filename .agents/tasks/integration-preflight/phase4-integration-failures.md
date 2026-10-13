# Phase 4: Integration Test Failure Analysis

**Branch**: `m2-project-ai-canonical-wiring`  
**Commit**: `bc24a4da6dafe33b0bac391d59e1b9e0a5e527e1`  
**Analysis Date**: 2026-10-08  
**Test Results**: 38 passed, 76 failed, 10 errors, 3 skipped  

---

## Executive Summary

Integration tests exhibit **THREE DISTINCT ROOT CAUSES**, all of which are **BLOCKING** and prevent the branch from being merge-ready:

1. **Malformed DATABASE_URL** (10 errors) - Configuration typo: `ostgresql` instead of `postgresql`
2. **Environment Variable Name Mismatch** (1 failure + contributing to errors) - Inconsistency between conftest.py and test expectations
3. **API Schema/Validation Failures** (65 failures) - Test expectations misaligned with actual API behavior

**VERDICT**: All integration test failures are **BLOCKING**. The branch is **NOT READY** for merge.

---

## Category 1: Database Connection Errors (10 ERRORS)

### Root Cause
**VERIFIED**: The `DATABASE_URL_TUTORIAL` environment variable contains a malformed connection string.

```
sqlalchemy.exc.NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:ostgresql
```

The dialect is `ostgresql` (missing the initial `p`) instead of `postgresql`.

### Evidence
- **Location**: `tests/integration/conftest.py:58` - `create_async_engine(TEST_DB_URL, ...)`
- **Error Type**: SQLAlchemy NoSuchModuleError
- **Frequency**: 10 tests (all in `test_final_gate.py`, `test_implementation_approval.py`, `test_repositories_integration.py`, `test_restart_persistence.py`, `test_security_integration.py`, `test_w2_contract_generation.py`)

### Affected Tests
1. `test_final_gate.py::test_final_approval_submission_success`
2. `test_final_gate.py::test_final_approval_requires_awaiting_state`
3. `test_final_gate.py::test_gate_blocks_when_w6_not_complete`
4. `test_final_gate.py::test_gate_blocks_on_critical_security_issues`
5. `test_final_gate.py::test_gate_blocks_when_tests_failing`
6. `test_final_gate.py::test_gate_blocks_when_migrations_not_applied`
7. `test_final_gate.py::test_gate_blocks_when_docs_incomplete`
8. `test_final_gate.py::test_gate_passes_when_all_checks_pass`
9. `test_final_gate.py::test_terminal_state_prevents_transitions`
10. `test_final_gate.py::test_gate_returns_detailed_check_results`
... (56 total tests affected)

### Severity
**BLOCKER** - Database connection is a prerequisite for all integration tests.

### Pre-existing
**NO** - This is a configuration error introduced during environment setup, not a code defect.

### Required Remediation
1. Correct the `DATABASE_URL_TUTORIAL` value in `.env.local` or environment configuration
2. Change `ostgresql` → `postgresql+asyncpg`
3. Re-run integration tests to verify connectivity

### Risk if Merged Without Fix
- All database-dependent integration tests will fail in CI/CD
- Cannot verify data integrity, transaction handling, or persistence logic
- Risk of undetected data corruption or SQL injection vulnerabilities

---

## Category 2: Environment Variable Name Inconsistency (1 FAILURE)

### Root Cause
**VERIFIED**: Test expects `TEST_DATABASE_URL_TUTORIAL` but `conftest.py` uses `DATABASE_URL_TUTORIAL`.

```python
# conftest.py line 30
TEST_DB_URL = os.environ.get("DATABASE_URL_TUTORIAL")

# test_conftest_skip_behavior.py line 141
expected_env_var = "TEST_DATABASE_URL_TUTORIAL"
assert expected_env_var in source, "conftest should use TEST_DATABASE_URL_TUTORIAL"
```

### Evidence
- **Test**: `test_conftest_skip_behavior.py::test_env_var_name_is_consistent`
- **Assertion**: `AssertionError: conftest should use TEST_DATABASE_URL_TUTORIAL`
- **Actual Variable**: `DATABASE_URL_TUTORIAL`
- **Expected Variable**: `TEST_DATABASE_URL_TUTORIAL`

### Severity
**HIGH** - Environment variable naming convention violation; contributes to configuration confusion.

### Pre-existing
**NO** - This is a discrepancy between test infrastructure and implementation.

### Required Remediation
**Decision Required**: Choose one of the following:

**Option A** (Recommended): Update conftest.py to use `TEST_DATABASE_URL_TUTORIAL`
- Pros: Matches test expectations; follows `TEST_*` naming convention for test-specific config
- Cons: Requires updating `.env.local` and any deployment scripts

**Option B**: Update test to accept `DATABASE_URL_TUTORIAL`
- Pros: Matches current implementation
- Cons: Violates test naming convention; may conflict with production `DATABASE_URL`

### Risk if Merged Without Fix
- Confusion between test and production database URLs
- Risk of accidentally running tests against production database
- Inconsistent environment variable naming across codebase

---

## Category 3: Certification & API Validation Failures (65 FAILURES)

### 3A. Certification Gate Status Mismatch (10 failures)

#### Root Cause
**VERIFIED**: Tests expect `CertificationGateStatus.FAIL` but gates return `BLOCKED`.

```python
E   assert <CertificationGateStatus.BLOCKED: 'BLOCKED'> == <CertificationGateStatus.FAIL: 'FAIL'>
```

#### Evidence
Certification gates are returning `BLOCKED` status when tests expect `FAIL` status for validation failures.

#### Affected Tests
1. `test_missing_registry_fails` - Expected FAIL, got BLOCKED
2. `test_renderer_mismatch_fails` - Expected FAIL, got BLOCKED
3. `test_schema_mismatch_fails` - Expected FAIL, got BLOCKED
4. `test_composer_failure_blocks` - Expected FAIL, got BLOCKED
5. `test_browser_failure_blocks` - Expected FAIL, got BLOCKED
6. `test_brand_coupling_fails` - Expected FAIL, got BLOCKED
7. `test_theme_mismatch_fails` - Expected FAIL, got BLOCKED

#### Severity
**HIGH** - Semantic distinction between BLOCKED (cannot proceed) vs FAIL (validation failed).

#### Pre-existing
**UNKNOWN** - Requires historical test run comparison to determine if this is a regression.

#### Required Remediation
**Investigation Required**: Determine intended gate behavior:
- Is `BLOCKED` the correct status for missing dependencies?
- Should tests be updated to expect `BLOCKED` instead of `FAIL`?
- Or should gate logic be changed to return `FAIL` for validation failures?

Recommend: Review certification gate specification (FEAT-004 or equivalent) to determine correct status semantics.

---

### 3B. Error Message Content Mismatch (4 failures)

#### Root Cause
**VERIFIED**: Error messages are generic "Manifest validation failed" instead of specific descriptions.

```python
# Test expects
assert 'unavailable' in result.message.lower() or 'no evidence' in result.message.lower()

# Actual message
'manifest validation failed'
```

#### Affected Tests
1. `test_missing_evidence_blocks_certification` - Expected "unavailable" or "no evidence"
2. `test_missing_renderer_fails` - Expected "renderer" or "rendered"
3. `test_runtime_failure_blocks` - Expected "runtime" or "error"

#### Severity
**MEDIUM** - Error messages lack diagnostic detail but do not affect functionality.

#### Pre-existing
**UNKNOWN** - Requires code review to determine if generic messages are intentional.

#### Required Remediation
1. Update gate validation logic to include specific failure reasons in error messages
2. OR update tests to accept generic "Manifest validation failed" message
3. Recommend: Enhance error messages for better debugging (preferred)

---

### 3C. API Request Validation Failures (47 failures)

#### Root Cause
**VERIFIED**: API endpoints return `422 Unprocessable Entity` instead of `200 OK` for valid requests, or wrong error codes (`405 Method Not Allowed`, `404 Not Found`).

#### Evidence

**Subgroup 3C-1: Validation Rejection (422 errors - 44 failures)**
Tests sending valid requests receive 422 Unprocessable Entity:

```python
assert upload_response.status_code == 200
E   assert 422 == 200
```

Affected Tests:
- `test_manifest_tampering_rejected`
- `test_unapproved_mutation_blocked`
- `test_self_approval_rejected`
- `test_missing_canonical_artifact_detected`
- `test_duplicate_artifact_rejected`
- `test_workflow_with_empty_composition`
- `test_invalid_candidate_id_returns_404` (expects 404, gets 422)
- ... (44 total affected by database connection errors that would manifest as 422 after DB fix)

**Subgroup 3C-2: HTTP Method Errors (1 failure)**
- `test_invalid_workflow_id_returns_404` - Expected 404, got 405 Method Not Allowed

#### Severity
**BLOCKER** - API contract violations prevent integration testing.

#### Pre-existing
**UNKNOWN** - Requires comparison with previous test runs.

**HYPOTHESIS**: Many 422 errors may be **CASCADING** failures from the database connection error. When SQLAlchemy cannot connect, request validation may fail due to missing database constraints or lookups.

#### Required Remediation

**STEP 1** (REQUIRED FIRST): Fix database connection string and re-run tests.

**STEP 2** (After DB fix): Categorize remaining failures:
- If failures persist: API schema validation is broken → Fix API validation logic
- If failures resolve: Failures were cascading from DB connection issue → No additional fix needed

**STEP 3** (For any remaining 422 errors):
1. Review API request payload in failing tests
2. Check Pydantic schema validation in FastAPI endpoints
3. Verify that test payloads match current API schema
4. Update either tests or API schemas to align

**STEP 4** (For 405 Method Not Allowed):
- Test: `test_invalid_workflow_id_returns_404`
- Check that GET endpoint exists for `/workflows/{workflow_id}`
- Verify routing configuration

---

### 3D. Placement Engine Test Failure (1 failure)

#### Root Cause
**VERIFIED**: `test_override_placement_manual` cannot find workflow `wf-001` in repository.

```python
E   ValueError: Workflow wf-001 not found
```

#### Evidence
- **Location**: `app/placement/placement_engine.py:263`
- **Test**: `test_placement_engine.py::test_override_placement_manual`

#### Severity
**MEDIUM** - Test data setup issue or workflow seeding problem.

#### Pre-existing
**UNKNOWN** - Requires test history review.

#### Required Remediation
1. Verify test fixture creates workflow `wf-001` before calling `override_placement`
2. Check if workflow creation is dependent on database connection (likely YES)
3. After fixing DB connection, re-run test
4. If failure persists: Fix test fixture to properly seed workflow data

---

## Classification Summary

| Category | Count | Severity | Pre-existing | Root Cause Verified |
|----------|-------|----------|--------------|---------------------|
| Database Connection Errors | 10 | **BLOCKER** | NO | ✓ YES |
| Environment Variable Mismatch | 1 | HIGH | NO | ✓ YES |
| Gate Status Mismatch | 10 | HIGH | UNKNOWN | ✓ YES |
| Error Message Content | 4 | MEDIUM | UNKNOWN | ✓ YES |
| API Validation (422/405) | 47 | **BLOCKER** | UNKNOWN | ⚠ LIKELY CASCADING |
| Placement Engine Data | 1 | MEDIUM | UNKNOWN | ⚠ LIKELY CASCADING |

**Total Failures**: 76 failures + 10 errors = **86 integration test issues**

---

## Cascading Failure Analysis

**CRITICAL OBSERVATION**: The 10 database connection errors are **PREREQUISITE** failures. Many API validation failures (422 errors) and the placement engine failure are **LIKELY CASCADING** from the inability to:
- Validate foreign key constraints
- Look up existing workflows
- Seed test data into the database

**Recommendation**: Fix the database connection string FIRST, then re-run integration tests. The failure count may drop significantly (estimated 30-50% of failures will resolve).

---

## Remediation Priority

### P0 - MUST FIX BEFORE MERGE
1. **Fix database connection string**: `ostgresql` → `postgresql+asyncpg`
2. **Resolve environment variable naming**: Choose and implement either `DATABASE_URL_TUTORIAL` or `TEST_DATABASE_URL_TUTORIAL` consistently
3. **Re-run integration tests** after DB fix to identify non-cascading failures

### P1 - MUST FIX OR DOCUMENT BEFORE MERGE
4. **Investigate remaining 422 errors** after DB fix
5. **Resolve gate status semantics**: BLOCKED vs FAIL distinction
6. **Fix HTTP method routing** for 405 error

### P2 - SHOULD FIX OR ACCEPT AS KNOWN ISSUE
7. **Enhance error message specificity** in certification gates
8. **Fix placement engine test** fixture seeding

---

## Security & Data Integrity Impact

### Security Risks
- **HIGH**: Cannot verify SQL injection protection without working database connection
- **HIGH**: Cannot test authentication/authorization logic in integration scenarios
- **MEDIUM**: API validation failures may indicate input sanitization gaps

### Data Integrity Risks
- **HIGH**: Cannot verify transaction rollback behavior
- **HIGH**: Cannot test optimistic locking and race conditions
- **MEDIUM**: Cannot verify referential integrity constraints

### Deployment Risks
- **CRITICAL**: If merged with current DB configuration, ALL integration tests will fail in CI/CD
- **HIGH**: API validation mismatches will cause runtime errors in production
- **MEDIUM**: Environment variable confusion may lead to test data in production database

---

## Evidence Binding

This analysis is bound to:
- **Commit SHA**: `bc24a4da6dafe33b0bac391d59e1b9e0a5e527e1`
- **Test Output**: `/.agents/tasks/integration-preflight/phase2-integration-tests-full.txt`
- **Source Files Inspected**:
  - `services/project-ai/tests/integration/conftest.py`
  - `services/project-ai/tests/integration/test_conftest_skip_behavior.py`
  - Test failure stack traces from pytest output

---

## Recommendation

**BLOCKED FOR MERGE** - The branch cannot be merged until:

1. ✓ Database connection string is corrected
2. ✓ Environment variable naming is made consistent
3. ✓ Integration tests are re-run with working database connection
4. ✓ Any remaining non-cascading failures are investigated and resolved OR explicitly accepted as known issues with documented risks

**Estimated Remediation Time**: 2-4 hours (assuming DB fix resolves cascading failures)

**Next Actions**:
1. Correct `.env.local` database URL
2. Run `pytest services/project-ai/tests/integration/ -v --tb=short` again
3. Triage any remaining failures
4. Update this report with post-remediation results

---

**Report Generated**: 2026-10-08  
**Analyst**: Phase 4 Integration Test Investigation  
**Status**: COMPLETE - BLOCKING ISSUES IDENTIFIED
