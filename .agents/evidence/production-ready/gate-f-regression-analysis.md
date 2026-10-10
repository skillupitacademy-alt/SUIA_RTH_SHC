# Gate F Regression Analysis

**Branch:** m2-project-ai-canonical-wiring  
**Baseline:** Gate A (891 passed, 94 failed, 39 skipped)  
**Current:** Gate F (146 passed in domain tests, 2 failed, 13 errors, 1286 skipped in full suite)

---

## New Failures vs Baseline

**Note:** Direct comparison to Gate A baseline is not possible due to environment configuration differences. Gate A ran with full database setup; Gate F ran with TEST_DATABASE_URL_TUTORIAL not set, causing mass test skipping.

### Security Domain Failures (Zero-Tolerance)

#### Domain 1: JWT Identity Extraction

**1. test_governance_approve_prevents_jwt_self_approval**
- **Location:** `services/project-ai/tests/security/test_governance_identity.py:115`
- **Error:** `TypeError: string indices must be integers, not 'str'`
- **Code:** `assert error_detail["error"] == "SELF_APPROVAL_REJECTED"`
- **Root Cause:** `error_detail` is a string, not a dictionary. API response format changed or test expectation incorrect.
- **Security Impact:** HIGH - Self-approval prevention is a critical security control. If test cannot verify behavior, self-approval bypass may be possible.
- **Regression Status:** UNKNOWN (cannot compare to Gate A due to environment differences)

**2. test_governance_reject_uses_jwt_identity**
- **Location:** `services/project-ai/tests/security/test_governance_identity.py:185`
- **Error:** `assert 403 == 200` (HTTP Forbidden vs HTTP OK)
- **Root Cause:** Rejection endpoint returns 403 Forbidden instead of 200 OK. Either endpoint logic changed or test expectation incorrect.
- **Security Impact:** MEDIUM - Authorized rejection operation is being denied. Workflow cannot progress if legitimate rejections are blocked.
- **Regression Status:** UNKNOWN (cannot compare to Gate A)

#### Domain 2: RBAC Authorization

**3-5. JWT Identity Extraction Integration Tests (3 errors)**
- **Tests:**
  - `test_approver_identity_extraction_from_jwt`
  - `test_requester_identity_extraction_from_jwt`
  - `test_client_supplied_user_id_ignored`
- **Location:** `services/project-ai/tests/security/test_authorization.py`
- **Error:** `fixture 'db_session' not found`
- **Available Fixtures:** test_db_session, mock_db_session, test_db_engine (but not `db_session`)
- **Root Cause:** Tests marked `@pytest.mark.integration` expect a fixture named `db_session`, but only `test_db_session` is provided in conftest.py.
- **Security Impact:** HIGH - These integration tests verify end-to-end JWT identity extraction cannot be overridden by client-supplied data. Without these tests, identity spoofing vulnerabilities may go undetected.
- **Fix:** Rename fixture references from `db_session` to `test_db_session` or add `db_session` alias to conftest.py

**6-15. RBAC Authorization Integration Tests (10 errors)**
- **Location:** `services/project-ai/tests/security/test_authorization.py`
- **Error:** `fixture 'db_session' not found` (same as above)
- **Tests Affected:** 10 tests in TestBrandEnforcementInRoutes and TestValidPathSmokeTests
- **Security Impact:** HIGH - Brand boundary enforcement and cross-brand access controls cannot be verified
- **Fix:** Same as #3-5

---

## Fixed Tests

**None Identified.**

No tests that were failing at Gate A baseline are now passing at Gate F.

---

## Test Count Comparison

| Metric | Gate A Baseline | Gate F Current | Delta |
|--------|----------------|----------------|-------|
| Passed | 891 | 146* | -745 |
| Failed | 94 | 2* | -92 |
| Errors | 0 | 13* | +13 |
| Skipped | 39 | 1286 | +1247 |
| **Total** | 1024 | 1447 | +423 |

\* Domain tests only (full suite skipped all 1286 tests)

**Analysis:** Test count increased by 423 tests (likely new tests added in Gates C, D, E-1, E-2). However, environment configuration prevents proper execution comparison.

---

## Security Domain Status (Zero-Tolerance Policy)

| Domain | Status | Passed | Failed | Errors | Blocker? |
|--------|--------|--------|--------|--------|----------|
| D1: JWT | ❌ FAIL | 5 | 2 | 3 | **YES** |
| D2: RBAC | ❌ FAIL | 9 | 0 | 10 | **YES** |
| D3: W7 Evidence | ✅ PASS | 21 | 0 | 0 | No |
| D4: W3C Artifact | ✅ PASS | 87 | 0 | 0 | No |
| D5: W5 Placement | ✅ PASS | 29 | 0 | 0 | No |

**Blockers:** 2 domains failing (D1, D2)

**Zero-Tolerance Rule:** ANY security domain failure blocks gate approval.

---

## Coverage Regression

**Baseline:** 67%  
**Current:** 29%  
**Delta:** -38 percentage points

**Root Cause:** 1,286 tests skipped due to TEST_DATABASE_URL_TUTORIAL not set. Skipped tests do not execute code, resulting in artificially low coverage.

**Expected Coverage After Fix:** Should return to ≥67% baseline once environment is properly configured.

---

## Root Cause Summary

**Primary Issue:** Test environment not properly configured for Gate F execution.

**Contributing Factors:**
1. **Missing Environment Variable:** TEST_DATABASE_URL_TUTORIAL not set
2. **Fixture Naming Mismatch:** Integration tests expect `db_session`, but conftest.py provides `test_db_session`
3. **API Response Format Change:** JWT self-approval test expects dict, receives string
4. **Endpoint Behavior Change:** Rejection endpoint returns 403 instead of 200

**Recommendation:** 
1. Set TEST_DATABASE_URL_TUTORIAL environment variable
2. Fix fixture references in integration tests (db_session → test_db_session)
3. Investigate JWT self-approval endpoint response format
4. Investigate rejection endpoint HTTP status code logic

---

## Remediation Priority

**P0 (Blocker):**
1. Fix `db_session` fixture errors (13 tests) - Security domain tests cannot execute
2. Fix `test_governance_approve_prevents_jwt_self_approval` TypeError - Self-approval bypass risk
3. Fix `test_governance_reject_uses_jwt_identity` 403 error - Rejection workflow blocked

**P1 (High):**
4. Set TEST_DATABASE_URL_TUTORIAL to enable integration test suite
5. Re-run full test suite after environment configuration

**P2 (Medium):**
6. Investigate coverage regression root cause
7. Verify coverage returns to ≥67% after fixes

---

## Verdict Impact

**Gate F Verdict:** ❌ **CHANGES_REQUESTED**

**Blockers:**
- Security domain failures (Domains 1 & 2)
- Coverage below baseline (29% vs 67%)

**Non-Blockers (Acceptable):**
- Integration test skips (per prompt: acceptable if TEST_DATABASE_URL_TUTORIAL not set)

**Gate Cannot Advance Until:**
- All 5 W6 domains pass (currently 3/5)
- Coverage returns to ≥67%
- Zero security regressions

---

**Analysis Generated:** Gate F Regression Analysis  
**Certified By:** Gate F Integration Agent  
**Workflow:** wf_cedd495b3c1d4b2e
