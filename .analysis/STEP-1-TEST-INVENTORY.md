# STEP 1 — TEST INVENTORY COMPLETE

**Date:** September 4, 2026  
**Status:** INVENTORY ONLY - NO CODE CHANGED

---

## Existing Playwright Tests

### 1. `tests/e2e/ils-tutorial-session.spec.ts`
- **Purpose:** ILS Step 1 - Tutorial Learning Session E2E Certification
- **Brand:** SUIA + RTH  
- **Tests:**
  - TC1: First tutorial visit creates valid session ID
  - TC2: Session persists across same-tab navigation
  - TC3: Session persists across page reload
  - TC4: New tab/context creates new independent session
- **First known execution:** Unknown (created in commit `213d979f feat(ILS): Implement Step 1`)
- **First known successful execution:** Unknown - not established from repository evidence
- **Latest result:** Not run during current investigation
- **Status:** **ACTIVE** - Original ILS session management test
- **Coverage:** sessionStorage, session ID generation, persistence, isolation

---

### 2. `tests/e2e/ils-phase2-visit-persistence.spec.ts`
- **Purpose:** ILS Phase 2 - page_view → VisitEvent Persistence with DB forensic validation
- **Brand:** SUIA + RTH
- **Tests:**
  - A: First visit persists session UUID to database
  - B: Same-session deduplication (visitCount unchanged)
  - C: New-session increment
  - D: block_complete regression
  - E: Identity separation
  - F: Failure isolation
- **First known execution:** Created in commit `ac888aec ILS Phase 2: Fix middleware 403 + add E2E diagnostics`
- **First known successful execution:** **NEVER** - Always blocked by middleware/CSRF issues
- **Latest result:** **403 Forbidden - CSRF validation failed** (SUIA test, current session)
- **Status:** **BLOCKED** - Created to test end-to-end persistence but blocked at BFF layer
- **Coverage:** Visit API request/response capture, database row verification, session persistence
- **Issues:** 
  - Originally blocked by middleware not allowing `/api/tutorial/ils/*` → FIXED
  - Originally blocked by `/api/api/` URL duplication → FIXED
  - Currently blocked by CSRF validation (browser fetch without CSRF token)

---

### 3. `tests/e2e/rth-student-role-verification.spec.ts`
- **Purpose:** RTH test account role verification - reconcile DB role vs JWT token roles
- **Brand:** RTH only
- **Tests:**
  - Verify RTH test account has student role after login
  - Verify token contains correct roles array
  - Verify token accepted by authenticated endpoints
  - Handle tutorial page access with student role
- **First known execution:** Created in commit `dd743608 Fix RTH user role backward compatibility`
- **First known successful execution:** **NEVER RUN** - Created but not executed during investigation
- **Latest result:** **Login timeout** (test aborted after 30s)
- **Status:** **TEMPORARY DIAGNOSTIC** - Created to debug role discrepancy
- **Coverage:** Login flow, JWT decoding, role verification, endpoint access
- **Purpose:** Investigate discrepancy between earlier log `roles:["user"]` vs DB `role='student'`
- **Resolution:** Discrepancy explained (old token vs fresh token), DB verified correct

---

### 4. Other E2E Tests (Not ILS-related)
- `tests/e2e/smoke.spec.ts` - General smoke tests
- `tests/e2e/onboarding-profile.spec.ts` - Onboarding flow
- `tests/e2e/phase1-learner-page-identity.spec.ts` - Page identity verification
- `tests/e2e/tutorial-composer-phase2-hydration.spec.ts` - Tutorial composer

---

## Existing Diagnostic Scripts

### ILS Investigation Scripts (Created Sept 4, 2026)

#### 1. `scripts/add-student-role-rth-test.mjs`
- **Purpose:** Add student role to RTH test account (`ajayshah@gmail.com`)
- **Permanent/Temporary:** **UTILITY** - Can remain as role management tool
- **Related test:** `rth-student-role-verification.spec.ts`
- **Result:** User already had `student` role (no action needed)
- **Created:** Commit `95a54e7b`

#### 2. `scripts/verify-rth-token-roles.mjs`
- **Purpose:** Generate fresh JWT token and verify roles claim matches DB state
- **Permanent/Temporary:** **DIAGNOSTIC** - Temporary investigation script
- **Related test:** `rth-student-role-verification.spec.ts`
- **Result:** ✅ Token correctly contains `["user","student"]` when DB has `role='student'`
- **Created:** Commit `95a54e7b`
- **Status:** Proved token generation works correctly

#### 3. `scripts/test-bff-ils-visit.mjs`
- **Purpose:** Test BFF ILS visit endpoint with authenticated session (login + POST)
- **Permanent/Temporary:** **DIAGNOSTIC** - Temporary investigation script
- **Related test:** `ils-phase2-visit-persistence.spec.ts`
- **Result:** ✅ Role check passes → ❌ CSRF validation blocks (403)
- **Created:** Current session (not committed yet)
- **Status:** Identified CSRF as current blocker

#### 4. `scripts/test-ils-endpoint-local.mjs`
- **Purpose:** Test local api-server ILS endpoint directly (bypass BFF)
- **Permanent/Temporary:** **DIAGNOSTIC** - Temporary investigation script
- **Related test:** Direct api-server verification
- **Result:** ❌ CSRF validation failed (expected - needs proper headers)
- **Created:** Current session (not committed yet)
- **Status:** Confirmed endpoint exists, identified CSRF requirement

#### 5. `scripts/test-ils-endpoint-direct.mjs`
- **Purpose:** Test production api-server ILS endpoint directly
- **Permanent/Temporary:** **DIAGNOSTIC** - Temporary investigation script
- **Related test:** Direct api-server verification
- **Result:** ❌ 500 Internal Server Error (production endpoint)
- **Created:** Current session (not committed yet)
- **Status:** Confirmed route exists (500 proves route is reachable)

---

## Duplication Analysis

### Overlapping ILS Visit Coverage

#### GROUP A: Session Management
- **Primary:** `ils-tutorial-session.spec.ts` ✅
- **Purpose:** sessionStorage, session ID lifecycle, persistence, isolation
- **Status:** Keep - covers ILS Step 1 contract

#### GROUP B: Visit Persistence + Database
- **Primary:** `ils-phase2-visit-persistence.spec.ts` 🚫 (never passed)
- **Purpose:** Full E2E with DB forensic evidence
- **Status:** **Currently blocked by CSRF** - intended to extend GROUP A
- **Issue:** Tests browser→BFF→api-server→DB but blocked at BFF CSRF layer

#### GROUP C: Role Verification
- **Primary:** `rth-student-role-verification.spec.ts` 🚫 (never run)
- **Purpose:** Debug role discrepancy (roles:["user"] vs DB role='student')
- **Status:** **TEMPORARY** - Purpose achieved via scripts, can be removed
- **Resolution:** Discrepancy explained (stale token), not needed long-term

### Overlapping Diagnostic Scripts

#### Scripts Testing BFF→api-server Flow
1. `test-bff-ils-visit.mjs` - Authenticated BFF test (POST with cookies)
2. `test-ils-endpoint-local.mjs` - Direct api-server test (bypass BFF)
3. `test-ils-endpoint-direct.mjs` - Production api-server test

**Status:** All temporary investigation scripts  
**Keep:** None (diagnostic phase complete)  
**Action:** Can be removed after E2E test passes

#### Scripts Testing Role/Token
1. `add-student-role-rth-test.mjs` - DB role updater (utility)
2. `verify-rth-token-roles.mjs` - Token verification (diagnostic)

**Status:** 
- `add-student-role-rth-test.mjs` - **KEEP** (useful utility script)
- `verify-rth-token-roles.mjs` - **REMOVE** (temporary diagnostic)

---

## Existing Documentation

### Test Documentation
- **Location:** None found
- **Needed:** `tests/e2e/README.md` or `tests/E2E-TEST-INVENTORY.md`

### Test-Related Documentation
- `.analysis/ils-phase-2-role-fix-complete.md` - Investigation summary (not test inventory)
- `.analysis/STEP-1-TEST-INVENTORY.md` - **THIS FILE**

---

## Recommendations

### Tests to Keep
1. ✅ **`ils-tutorial-session.spec.ts`** - Authoritative ILS Step 1 test (session management)
2. 🔧 **`ils-phase2-visit-persistence.spec.ts`** - Needs CSRF fix, then becomes authoritative Phase 2 test

### Tests to Remove (After Verification)
1. ❌ **`rth-student-role-verification.spec.ts`** - Temporary diagnostic, purpose achieved

### Tests to Extend (Not Create New)
- **Extend** `ils-phase2-visit-persistence.spec.ts` with proper CSRF handling
- **Do NOT create** new test files for CSRF debugging
- **Do NOT create** separate RTH/SUIA test files (parameterize instead)

### Diagnostic Scripts to Keep
- ✅ `add-student-role-rth-test.mjs` - Useful utility for role management

### Diagnostic Scripts to Remove (After E2E Passes)
- ❌ `verify-rth-token-roles.mjs` - Temporary diagnostic
- ❌ `test-bff-ils-visit.mjs` - Temporary diagnostic
- ❌ `test-ils-endpoint-local.mjs` - Temporary diagnostic
- ❌ `test-ils-endpoint-direct.mjs` - Temporary diagnostic

### Documentation to Create
- 📄 **`tests/e2e/README.md`** - Test inventory with history and purpose
  - List all E2E tests
  - Document first successful execution (where known)
  - Document purpose and coverage
  - Note which tests are authoritative for each feature

---

## Test Consolidation Plan

### Current State
```
tests/e2e/
├── ils-tutorial-session.spec.ts          ← ILS Step 1 (session mgmt)
├── ils-phase2-visit-persistence.spec.ts  ← ILS Phase 2 (visit + DB) [BLOCKED]
└── rth-student-role-verification.spec.ts ← Temporary diagnostic
```

### Proposed Final State
```
tests/e2e/
├── ils-tutorial-session.spec.ts          ← ILS Step 1 (authoritative)
├── ils-visit-persistence.spec.ts         ← ILS Phase 2 (authoritative, CSRF-fixed)
└── README.md                             ← Test inventory
```

### Actions Required
1. Fix CSRF handling in `ils-phase2-visit-persistence.spec.ts`
2. Verify test passes for both SUIA and RTH
3. Remove `rth-student-role-verification.spec.ts` after verification
4. Remove temporary diagnostic scripts
5. Create `tests/e2e/README.md` with test inventory
6. Document first successful execution dates

---

## Critical Findings

### Test That Never Passed
**`ils-phase2-visit-persistence.spec.ts`** was created to test end-to-end ILS visit flow but has **NEVER SUCCESSFULLY EXECUTED** due to sequential blockers:

1. **First blocker:** Middleware didn't allow `/api/tutorial/ils/*` → **FIXED** (commit 8143a89d)
2. **Second blocker:** BFF constructed `/api/api/` URLs → **FIXED** (commit 9215cf68)
3. **Third blocker:** RTH role check rejected `roles:["user"]` → **FIXED** (commit dd743608)
4. **Current blocker:** CSRF validation blocks browser fetch without CSRF token → **ACTIVE ISSUE**

### Historical Context Important
- `ils-tutorial-session.spec.ts` was the **FIRST** ILS E2E test (commit `213d979f`)
- Unknown if it ever passed successfully
- Should check git history and CI/CD logs for first successful run

---

## NO APPLICATION CODE CHANGED
## NO PLAYWRIGHT TESTS CREATED  
## NO EXISTING TESTS DELETED
## NO DIAGNOSTIC SCRIPTS REMOVED

**This is an inventory-only checkpoint.**

---

## Next Steps (After Review)

1. **STOP** - Wait for review of this inventory
2. Do NOT create new tests until consolidation plan approved
3. Do NOT delete tests until replacements verified
4. Do NOT remove diagnostic scripts until E2E tests pass
5. Investigate CSRF handling for `ils-phase2-visit-persistence.spec.ts`
6. Decide on test consolidation strategy
7. Create test inventory documentation

