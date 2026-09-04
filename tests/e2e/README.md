# E2E Test Inventory

**Last Updated:** 2026-09-04  
**Governance Policy:** One authoritative test per feature area. Diagnostic scripts are temporary.

---

## Authoritative Test Suites

### ILS (Intelligent Learning System)

| Test File | Purpose | Brand Coverage | Status | First Success | Current Blocker |
|-----------|---------|----------------|--------|---------------|-----------------|
| `ils/ils-tutorial-session.spec.ts` | ILS session tracking and basic visit flow | SUIA, RTH | ✅ Active | Unknown | None |
| `ils/ils-phase2-visit-persistence.spec.ts` | ILS Phase 2: visit persistence with session UUID, revision detection | SUIA, RTH | 🔴 Blocked | Never passed | CSRF 403 (investigation complete) |

**Phase 2 Test Coverage:**
- ✅ First visit persists session UUID
- ✅ Session continuity across page navigation
- ✅ Revision detection (new session after threshold)
- ✅ Multiple visits increment count
- ✅ Cross-brand isolation (SUIA ↔ RTH)
- ⏳ Active-time tracking (planned extension)
- ⏳ Block-completion tracking (planned extension)

**Extension Policy:**  
When Phase 2 CSRF issue is resolved, extend `ils-phase2-visit-persistence.spec.ts` to cover active-time and block-completion. Do NOT create separate test files.

### Authentication & Authorization

| Test File | Purpose | Brand Coverage | Status | First Success |
|-----------|---------|----------------|--------|---------------|
| `ils/rth-student-role-verification.spec.ts` | RTH role diagnostic (temporary) | RTH | 🟡 Diagnostic | N/A |

**Note:** This test was created to investigate RTH role discrepancy. Evidence captured, ready for cleanup after documentation transfer.

---

## Diagnostic Scripts (Temporary)

These scripts are NOT permanent test infrastructure. They exist to investigate specific issues and should be removed once evidence is documented and permanent tests pass.

| Script | Purpose | Status | Evidence Location | Ready for Cleanup |
|--------|---------|--------|-------------------|-------------------|
| `verify-rth-token-roles.mjs` | Investigate RTH role mismatch | Completed | `.analysis/` | ⏳ After final verification |
| `test-bff-ils-visit.mjs` | Test BFF proxy reachability | Completed | `.analysis/STEP-2-ILS-CSRF-INVESTIGATION-REPORT.md` | ⏳ After ILS fix |
| `test-ils-endpoint-local.mjs` | Test api-server ILS endpoint directly | Completed | Same as above | ⏳ After ILS fix |
| `test-ils-endpoint-direct.mjs` | Test api-server ILS endpoint (variant) | Completed | Same as above | ⏳ After ILS fix |

**Cleanup Policy:**  
1. Document findings in `.analysis/` reports
2. Ensure authoritative test covers same scenario
3. Verify authoritative test passes
4. Delete diagnostic script
5. Remove from this inventory

---

## Test Execution History

### ILS Phase 2 Visit Persistence

**Created:** Unknown (check git history)  
**First Executed:** Unknown  
**First Successful Execution:** Never passed  
**Latest Failure:** 2026-09-04  
**Failure Mode:** 403 CSRF validation failed  
**Root Cause:** Internal auth header mismatch (see `.analysis/STEP-2-ILS-CSRF-INVESTIGATION-REPORT.md`)  
**Resolution Status:** Investigation complete, implementation pending approval

---

## Known Issues & Blockers

### ILS CSRF 403 (CRITICAL) - ARCHITECTURE VALIDATED

**Issue:** ILS Phase 2 tests fail with 403 CSRF validation error  
**Root Cause:** BFF sends `X-Internal-Secret`, CSRF middleware expects `x-internal-key`  
**Impact:** Blocks all ILS Phase 2 E2E testing  
**Investigation:**  
- `.analysis/STEP-2-ILS-CSRF-INVESTIGATION-REPORT.md` (root cause)  
- `.analysis/STEP-3-CREDENTIAL-ARCHITECTURE-VALIDATION.md` (security validation)

**Rejected Fix:** Option B (accept both credentials in CSRF) - violates credential separation  
**Approved Fix:** Option D (BFF sends both headers) - follows existing auth route pattern  
**Status:** **Awaiting implementation approval**

**Security Notes:**
- `INTERNAL_API_KEY` (128 chars) = system-level bypass credential
- `INTERNAL_API_SECRET` (64 chars) = BFF → api-server user-scoped credential
- Two credentials serve different trust boundaries (validated in STEP 3)
- Auth routes already send both headers successfully

### `/api/tutorial/progress` 401 (MEDIUM)

**Issue:** GET requests to tutorial progress endpoint return 401  
**Root Cause:** Unknown (separate investigation required)  
**Impact:** Progress retrieval in E2E tests  
**Status:** Not yet investigated (separate work item)

---

## Test Governance Rules

### Creating New Tests

1. ✅ **DO:** Extend existing authoritative test when adding coverage to same feature
2. ✅ **DO:** Create new test file for genuinely new feature area
3. ❌ **DON'T:** Create duplicate test for same workflow with different name
4. ❌ **DON'T:** Create separate test because existing test is temporarily blocked

### Diagnostic Scripts

1. ✅ **DO:** Create temporary diagnostic script for investigation
2. ✅ **DO:** Document purpose and expected lifespan
3. ✅ **DO:** Add to "Diagnostic Scripts" table in this README
4. ❌ **DON'T:** Let diagnostic scripts become permanent infrastructure
5. ❌ **DON'T:** Delete diagnostic script before documenting findings

### Test Naming

- **Feature-based:** `{feature}-{aspect}.spec.ts` (e.g., `ils-phase2-visit-persistence.spec.ts`)
- **NOT implementation-based:** Avoid `test-csrf.spec.ts`, `test-debug.spec.ts`, `final-test.spec.ts`
- **Brand-specific only when necessary:** Most tests should cover all brands

### Test Maintenance

- Update this README when creating/removing tests
- Document first successful execution in "Test Execution History"
- Record blockers in "Known Issues & Blockers"
- Update test table status regularly

---

## Playwright Configuration

**Config File:** `playwright.config.ts`  
**Base URL:** Configured per brand (SUIA, RTH, SHC)  
**Browsers:** Chromium (default), Firefox, WebKit (on demand)  
**Parallelization:** Enabled  
**Retries:** 1 (on CI), 0 (local)

**Running Tests:**

```bash
# All E2E tests
pnpm test:e2e

# Specific test file
pnpm playwright test tests/e2e/ils/ils-phase2-visit-persistence.spec.ts

# Specific brand
BRAND=realtutorialhub pnpm playwright test tests/e2e/ils/

# Debug mode
pnpm playwright test --debug tests/e2e/ils/ils-phase2-visit-persistence.spec.ts
```

---

## Investigation Reports

All investigation findings are documented in `.analysis/`:

- `STEP-2-ILS-CSRF-INVESTIGATION-REPORT.md` - Complete ILS CSRF investigation
- (Add new reports as investigations complete)

**Policy:** Major investigation should produce a report in `.analysis/` before proceeding to implementation.

---

**END OF TEST INVENTORY**
