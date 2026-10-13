# Phase 6: Full Test Suite Results

**Date:** 2025-01-XX  
**Branch:** m2-project-ai-canonical-wiring  
**Context:** DI fix and CORS alignment complete, running full test suite

---

## 1. Security Tests

**Command:**
```bash
cd e:\onlinewebsites\quiz-platform\services\project-ai
python -m pytest tests/security/ -v --tb=line 2>&1
```

**Summary Counts:**
- **Passed:** 89
- **Failed:** 2
- **Error:** 0
- **Skipped:** 0
- **Warnings:** 1
- **Total Runtime:** 3.84s

**Failed Tests:**
1. `tests/security/test_authorization.py::TestIdentityExtractionFromJWT::test_requester_identity_extraction_from_jwt`
   - Error: `sqlalchemy.exc.StatementError: (builtins.AttributeError) 'str' object has no attribute 'hex'`
   - Root cause: UUID type mismatch in workflow_id parameter binding

2. `tests/security/test_authorization.py::TestIdentityExtractionFromJWT::test_client_supplied_user_id_ignored`
   - Error: `sqlalchemy.exc.StatementError: (builtins.AttributeError) 'str' object has no attribute 'hex'`
   - Root cause: Same UUID type issue

**Last 50 Lines of Output:**
```
tests/security/test_w7_evidence_enforcement.py::test_denial_creates_audit_event PASSED       [ 95%]
tests/security/test_w7_evidence_enforcement.py::test_certification_ready_verdict_accepted PASSED [ 96%]
tests/security/test_w7_evidence_enforcement.py::test_mixed_accepted_verdicts PASSED          [ 97%]
tests/security/test_w7_evidence_enforcement.py::test_naive_timestamp_rejected PASSED         [ 98%]
tests/security/test_w7_evidence_enforcement.py::test_empty_verdict_rejected PASSED           [100%]
============================================ FAILURES =============================================
E   AttributeError: 'str' object has no attribute 'hex'
The above exception was the direct cause of the following exception:
E   sqlalchemy.exc.StatementError: (builtins.AttributeError) 'str' object has no attribute 'hex'
    [SQL: SELECT project_ai_workflows.version 
    FROM project_ai_workflows 
    WHERE project_ai_workflows.workflow_id = ?]
    [parameters: [{}]]
C:\Users\RealTutorialHub\AppData\Roaming\Python\Python313\site-packages\sqlalchemy\sql\sqltypes.py:3941: sqlalchemy.exc.StatementError
===================================== short test summary info =====================================
FAILED tests/security/test_authorization.py::TestIdentityExtractionFromJWT::test_requester_identity_extraction_from_jwt
FAILED tests/security/test_authorization.py::TestIdentityExtractionFromJWT::test_client_supplied_user_id_ignored
======================================== warnings summary =========================================
C:\Users\RealTutorialHub\AppData\Roaming\Python\Python313\site-packages\fastapi\testclient.py:1
  StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
============================= 2 failed, 89 passed, 1 warning in 3.84s =============================
```

---

## 2. Unit Tests

**Command:**
```bash
cd e:\onlinewebsites\quiz-platform\services\project-ai
python -m pytest tests/unit/ -v --tb=line 2>&1
```

**Summary Counts:**
- **Passed:** 326
- **Failed:** 0
- **Error:** 0
- **Skipped:** 13
- **Warnings:** 60 (DeprecationWarning for datetime.utcnow())
- **Total Runtime:** 8.72s

**Last 50 Lines of Output:**
```
tests/unit/test_repository_intelligence.py::TestSnapshotBasedBuildContract::test_build_contract_deterministic_output
tests/unit/test_repository_intelligence.py::TestNoFilesystemAccess::test_build_contract_no_file_operations
tests/unit/test_repository_intelligence.py::TestNoFilesystemAccess::test_build_contract_with_nonexistent_path
tests/unit/test_repository_intelligence.py::TestMetadataExtraction::test_build_contract_extracts_metadata
  E:\onlinewebsites\quiz-platform\services\project-ai\app\contracts\repository_intelligence.py:629: DeprecationWarning: datetime.datetime.utcnow() is deprecated
tests/unit/test_repository_intelligence.py::TestSnapshotBasedBuildContract::test_build_contract_with_valid_snapshot
tests/unit/test_repository_intelligence.py::TestSnapshotBasedBuildContract::test_build_contract_introduction_i1
tests/unit/test_repository_intelligence.py::TestSnapshotBasedBuildContract::test_build_contract_definition_d1
tests/unit/test_repository_intelligence.py::TestSnapshotBasedBuildContract::test_build_contract_deterministic_output
[... repeated warnings omitted ...]
-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
========================== 326 passed, 13 skipped, 60 warnings in 8.72s ===========================
```

---

## 3. Integration Tests

**Command:**
```bash
cd e:\onlinewebsites\quiz-platform\services\project-ai
python -m pytest tests/integration/ -v --tb=no -q 2>&1
```

**Summary Counts:**
- **Passed:** 24
- **Failed:** 19
- **Error:** 84
- **Skipped:** 3
- **Warnings:** 11
- **Total Tests:** 130
- **Total Runtime:** 333.08s (5 minutes 33 seconds)

**Error Analysis:**
- **Root Cause for 84 Errors:** Database connection failure - `OSError: [Errno 10061] Connect call failed ('::1', 5432, 0, 0)`
  - PostgreSQL database not running on port 5432
  - Affects all tests requiring database fixtures: test_final_gate.py, test_implementation_approval.py, test_repositories_integration.py, test_restart_persistence.py, test_security_integration.py, test_w2_contract_generation.py

**Failed Test Breakdown:**

### test_certification_negative.py (18 failures):
1. `test_missing_evidence_blocks_certification` - Assertion: expected 'unavailable' or 'no evidence' in message
2. `test_missing_registry_fails` - Registry verification gate assertion failure
3. `test_missing_renderer_fails` - Expected 'renderer' or 'rendered' in message
4. `test_renderer_mismatch_fails` - UBRC gate should fail when renderer mismatches
5. `test_schema_mismatch_fails` - Composer gate should fail when schema invalid
6. `test_composer_failure_blocks` - Composer gate should fail when block not registered
7. `test_runtime_failure_blocks` - Expected 'runtime' or 'error' in message
8. `test_browser_failure_blocks` - Browser gate should fail when browser errors occur
9. `test_brand_coupling_fails` - Brand independence gate assertion
10. `test_theme_mismatch_fails` - Theme compatibility gate assertion
11. `test_manifest_tampering_rejected` - Expected 200, got 422
12. `test_unapproved_mutation_blocked` - Expected 200, got 422
13. `test_self_approval_rejected` - Expected 200, got 422
14. `test_missing_canonical_artifact_detected` - Expected 200, got 422
15. `test_duplicate_artifact_rejected` - Expected 200, got 422
16. `test_invalid_workflow_id_returns_404` - Expected 404, got 405
17. `test_invalid_candidate_id_returns_404` - Expected 404, got 422
18. `test_workflow_with_empty_composition` - Expected 200, got 422

### test_placement_engine.py (1 failure):
19. `test_override_placement_manual` - ValueError: Workflow wf-001 not found

**Passed Integration Tests (24):**
- test_conftest_skip_behavior.py: 4 passed
- test_certification_negative.py: 2 passed (test_wrong_block_version_fails, test_invalid_mix_and_match_blocked)
- test_placement_engine.py: 17 passed
- test_i2_e2e_certification.py: 3 skipped (database required)

**Last 100 Lines Summary:**
```
tests\integration\test_certification_negative.py F.FFFFFFFFFFF.FFFFFF.                       [ 16%]
tests\integration\test_conftest_skip_behavior.py ....                                        [ 19%]
tests\integration\test_final_gate.py EEEEEEEEEEEE                                            [ 28%]
tests\integration\test_i2_e2e_certification.py sss                                           [ 30%]
tests\integration\test_implementation_approval.py EEEEEEEEEEEEE                              [ 40%]
tests\integration\test_placement_engine.py ............F.....                                [ 54%]
tests\integration\test_repositories_integration.py EEEEEEEEEEEEEEEEEE                        [ 68%]
tests\integration\test_restart_persistence.py EEEEE                                          [ 72%]
tests\integration\test_security_integration.py EEEEEEEEEEEEEEEEEEEEEEEEEE                    [ 92%]
tests\integration\test_w2_contract_generation.py EEEEEEEEEE                                  [100%]

========== 19 failed, 24 passed, 3 skipped, 11 warnings, 84 errors in 333.08s (0:05:33) ===========
```

---

## Overall Summary

| Test Suite | Passed | Failed | Error | Skipped | Runtime |
|------------|--------|--------|-------|---------|---------|
| Security   | 89     | 2      | 0     | 0       | 3.84s   |
| Unit       | 326    | 0      | 0     | 13      | 8.72s   |
| Integration| 24     | 19     | 84    | 3       | 333.08s |
| **Total**  | **439**| **21** | **84**| **16**  | **345.64s** |

---

## Critical Issues

### 1. Database Connection Required (84 errors)
- PostgreSQL not running on localhost:5432
- Blocks 6 integration test modules (84 tests)
- **Action Required:** Start PostgreSQL service or configure DATABASE_URL

### 2. UUID Type Mismatch (2 security test failures)
- SQLAlchemy UUID parameter binding issue
- Affects JWT identity extraction tests
- **Action Required:** Fix UUID string-to-bytes conversion in repository layer

### 3. Certification Negative Test Failures (18 failures)
- Gate validation messages don't match expected assertions
- HTTP status code mismatches (422 vs 200, 405 vs 404)
- **Action Required:** Review certification gate implementation and error handling

### 4. Placement Engine Test Failure (1 failure)
- Workflow not found in override test
- **Action Required:** Fix test data setup or workflow creation

---

## Next Steps

1. **High Priority:** Start PostgreSQL and re-run integration tests to get accurate database-dependent test results
2. **Medium Priority:** Fix UUID type conversion in security tests (2 failures)
3. **Low Priority:** Review and fix certification negative test expectations (18 failures)
4. **Documentation:** Update datetime.utcnow() to datetime.now(datetime.UTC) to resolve deprecation warnings (60 occurrences)

---

**Notes:**
- Unit tests are in excellent shape: 326/326 passing (excluding skipped)
- Security tests are mostly passing: 89/91 (97.8% pass rate)
- Integration test infrastructure issues (database) mask the true health of integration logic
- CORS alignment from previous phases not directly testable in these suites
