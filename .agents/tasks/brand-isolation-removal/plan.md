# Brand Isolation Removal Implementation Plan

## Executive Summary

This plan removes the **unused brand isolation security layer** from Project AI service under **Scenario B: Super-Admin Model**. SkillHubCore admin operates as a single unified team with unrestricted access to all tenant data. The SHC-admin JWT contains `brand=null` and does NOT include tenant-specific claims, confirming that brand-level enforcement is dead code.

**What This Plan Removes:**
- `verify_brand_access()` function and all call sites
- `brand`, `requester_brand`, and `uploader_brand` columns from models
- All BRAND_BOUNDARY_VIOLATION error handling
- 10 brand isolation unit tests + 5 brand integration tests

**What This Plan PRESERVES:**
- All RBAC role-based security (`require_role`, `require_contract_admin`)
- Brand independence certification (`app/verification/brand.py`, `CertificationGateType.BRAND_INDEPENDENCE`)
- Infrastructure/super_admin bypass logic
- Identity extraction from JWT (user_id, roles, etc.)
- Self-approval prevention

---

## File Analysis & Line-Level Changes

### 1. app/auth/authorization.py

**Lines to REMOVE:**

- **Lines 1-107**: The entire `verify_brand_access()` function including docstring
  - Function signature: `def verify_brand_access(principal: AuthenticatedPrincipal, resource_brand: Optional[str]) -> None:`
  - All internal logic checking user_brand vs resource_brand
  - All BRAND_BOUNDARY_VIOLATION logging and exceptions

**Lines to KEEP:**

- **Lines 110-154**: `is_super_admin()` function — required by RBAC
- **Lines 157-191**: `require_role()` function — core RBAC enforcement
- **Lines 194-243**: `require_any_role()` function — core RBAC enforcement
- **Lines 1-15**: Module docstring and imports (except remove any verify_brand_access references)

**Verification:** After removal, the file should contain only RBAC functions (is_super_admin, require_role, require_any_role). No brand-checking logic.

---

### 2. app/api/routes/governance.py

**Lines to REMOVE:**

**submit_for_approval() endpoint:**
- **Line 42**: `user_brand = user.get("brand")`
- **Line 49**: `"brand": user_brand,  # Store brand for boundary enforcement`

**get_pending_approvals() endpoint:**
- **Lines 76-89**: Entire brand filtering block:
  ```python
  user_brand = user.get("brand")
  
  # Super admins bypass brand boundary
  from app.auth.authorization import is_super_admin
  if is_super_admin(user):
      pending = [...]
  else:
      # Filter by brand boundary
      pending = [...]
  ```
  Replace with simple unfiltered query (no brand check)

**approve_manifest() endpoint:**
- **Lines 152-166**: Entire brand boundary enforcement block:
  ```python
  # CRITICAL: Enforce brand boundary (unless super_admin)
  from app.auth.authorization import is_super_admin
  if not is_super_admin(user):
      approval_brand = approval.get("brand")
      if approval_brand != user_brand:
          raise HTTPException(
              status_code=403,
              detail={
                  "error": "BRAND_BOUNDARY_VIOLATION",
                  ...
              }
          )
  ```

**reject_manifest() endpoint:**
- **Lines 415-429**: Entire brand boundary enforcement block (similar to approve_manifest)

**Lines to KEEP:**

- All RBAC enforcement (`require_contract_admin`, `require_contract_reviewer`)
- Self-approval prevention logic (lines checking `decided_by == approval["submittedBy"]`)
- Manifest hash verification
- All workflow approval logic in `approve_placement()` endpoint

**Verification:** Search for `brand` and `BRAND_BOUNDARY_VIOLATION` — should find zero occurrences after removal.

---

### 3. app/api/routes/candidate.py

**Lines to REMOVE:**

**upload_candidate() endpoint:**
- **Lines 168-171**: Brand capture block:
  ```python
  # Wave 1C: Capture uploader's brand for tenant-scoped resource ownership
  # Candidates are tenant data (RTH/SUIA artifacts), even though workflows
  # are platform-scoped. Store the uploader's brand to enforce tenant
  # boundaries on execute/access operations.
  package.brand = user.get("brand")
  ```

**Lines to KEEP:**

- Workflow binding logic (target_family, target_version)
- SHA-256 hash computation
- Package validation
- State transition to CANDIDATE_RECEIVED
- All other endpoint logic

**Verification:** `package.brand` assignment should be completely removed. No brand field population.

---

### 4. app/persistence/models.py

**Lines to REMOVE:**

**WorkflowModel class:**
- **Line 60**: `requester_brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)`

**CandidateModel class:**
- **Lines 342-343**:
  ```python
  # Wave 1C: Tenant ownership tracking
  # Candidates are tenant-scoped resources - track which brand uploaded them
  brand = Column(String(100), nullable=True)
  uploader_brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
  ```

**Lines to KEEP:**

- All other workflow columns (specification_id, target_family, target_version, requester_id, etc.)
- All other candidate columns (workflow_id, files, uploaded_by, target_family, target_version, candidate_sha256)
- All approval, contract, manifest models (no brand fields in these)
- All relationships, indexes, and hash verification methods

**Verification:** Grep for `brand` in models.py — should find ZERO occurrences after removal (except in comments about brand independence certification, which is different).

---

### 5. app/persistence/repositories.py

**Lines to REMOVE:**

**PostgresWorkflowRepository.upsert():**
- **Line 402**: `requester_brand=workflow.requester_brand,` (in UPDATE VALUES clause)

**PostgresCandidateRepository.upsert():**
- **Lines 613, 623**: 
  ```python
  brand=candidate.brand,
  uploader_brand=candidate.uploader_brand,
  ```
  (appears in both INSERT values and ON CONFLICT UPDATE set_ dict)

**Lines to KEEP:**

- All other repository logic
- Optimistic locking
- Hash verification
- All SELECT, INSERT, UPDATE statements (minus the brand columns)

**Verification:** No brand column references in any SQL statement generation.

---

### 6. app/models/candidate.py

**Lines to REMOVE:**

**CandidatePackage class:**
- **Lines 57-58**:
  ```python
  # Wave 1C: Tenant ownership
  brand: Optional[str] = Field(None, description="Brand (tenant) that owns this candidate")
  ```

**Lines to KEEP:**

- All other fields (candidateId, files, uploadedAt, uploadedBy, workflow_id, target_family, target_version, contract_sha256)
- All enums (BlockFamily, PlacementDecision)
- All other Pydantic models (CandidateFile, ClassificationResult, CanonicalComparison, PlacementManifest)

**Verification:** CandidatePackage should have NO brand field.

---

### 7. tests/security/test_authorization.py

**REMOVE ENTIRE TEST CLASSES/FUNCTIONS:**

**TestVerifyBrandAccess class (lines 12-134):**
1. `test_verify_brand_access_same_brand_allowed` (lines 15-30)
2. `test_verify_brand_access_cross_brand_denied` (lines 32-51)
3. `test_verify_brand_access_none_user_brand_allowed` (lines 53-73)
4. `test_verify_brand_access_none_resource_brand_allowed` (lines 75-106)
5. `test_verify_brand_access_both_none_allowed` (lines 108-120)
6. `test_infrastructure_bypass_requires_privileged_role` (lines 122-134)

**TestBrandEnforcementInRoutes class (lines 485-760):**
7. `test_candidate_upload_captures_brand` (lines 492-533)
8. `test_candidate_execute_same_brand_succeeds` (lines 535-590)
9. `test_candidate_execute_cross_brand_denied` (lines 592-642)
10. `test_candidate_execute_infrastructure_bypass` (lines 644-690)

**TestValidPathSmokeTests class (lines 763-869):**
11. `test_same_brand_workflow_approval_succeeds` (lines 768-819)
12. `test_infrastructure_user_cross_brand_access_succeeds` (lines 821-869)

**RENAME (keep logic, remove brand references):**

**TestIdentityExtractionFromJWT class:**
- Lines 138-483: KEEP all tests but remove any brand assertions
- These tests verify JWT identity extraction (user_id, roles), not brand isolation

**TestMalformedJWT class:**
- Lines 275-356: KEEP — tests JWT secret validation
- Line 297: Remove `"brand": None` from forged_payload (or leave it, JWT layer doesn't enforce brand presence)

**Verification:** Run `pytest tests/security/test_authorization.py -v` — should have ~8-10 tests remaining (identity extraction, RBAC, JWT validation).

---

### 8. tests/integration/test_security_integration.py

**REMOVE ENTIRE TEST FUNCTIONS:**

**Domain 2 — Brand Isolation (lines 373-580):**
1. `test_same_brand_workflow_access_allowed` (lines 378-425)
2. `test_cross_brand_workflow_access_denied` (lines 428-467)
3. `test_infrastructure_user_cross_brand_bypass` (lines 470-506)
4. `test_brand_none_resource_requires_infrastructure` (lines 509-553)
5. `test_candidate_upload_captures_requester_brand` (lines 556-580)

**Lines to KEEP:**

**Domain 1 — RBAC Authorization (lines 22-370):**
- All 10 RBAC tests (contract_admin, contract_viewer, super_admin, case_insensitive, etc.)

**Domain 3 — Identity Extraction (lines 583-747):**
- All 5 identity tests (user_id, original_user_id, shadow_user_id, client_supplied rejection, missing user_id)

**Domain 4 — State Machine (lines 750-906):**
- All 5 state machine tests (initial state, transitions, approval, rejection, self-approval prevention)

**Verification:** Run `pytest tests/integration/test_security_integration.py -v` — should have 20 tests (10 RBAC + 5 identity + 5 state machine).

---

## Database Migration Required

**IMPORTANT:** This plan identifies code to remove, but **does NOT include database schema changes**. The `requester_brand`, `brand`, and `uploader_brand` columns in PostgreSQL tables will remain after this refactoring.

**Post-Implementation Decision:**
- **Option A (recommended):** Leave columns in schema as nullable, unpopulated (no writes, no reads). Zero impact on running code. Drop columns in future schema cleanup.
- **Option B:** Create Drizzle migration to `ALTER TABLE ... DROP COLUMN` for `requester_brand`, `brand`, `uploader_brand`. Requires coordination with database migration workflow.

This plan implements Option A (code-only removal). If Option B is desired, create a follow-up task for schema migration.

---

## Step-by-Step Implementation Sequence

### Step 1: Remove verify_brand_access() function

**File:** `app/auth/authorization.py`

**Action:**
- Delete lines 1-107 (entire verify_brand_access function)
- Remove any import of verify_brand_access from other files

**Verification:**
```bash
cd services/project-ai
pytest tests/security/test_authorization.py::TestIdentityExtractionFromJWT -v
```
Expected: All identity extraction tests pass (brand checks removed)

---

### Step 2: Remove brand enforcement from governance.py

**File:** `app/api/routes/governance.py`

**Actions:**
1. In `submit_for_approval()`:
   - Remove line 42: `user_brand = user.get("brand")`
   - Remove line 49: `"brand": user_brand` from approval dict

2. In `get_pending_approvals()`:
   - Replace lines 76-89 with simple unfiltered query:
     ```python
     pending = [
         ApprovalRecord(**approval)
         for approval in _approvals.values()
         if approval["status"] == ApprovalStatus.PENDING
     ]
     ```

3. In `approve_manifest()`:
   - Remove lines 152-166 (brand boundary enforcement block)
   - Remove `user_brand = user.get("brand")` if it exists

4. In `reject_manifest()`:
   - Remove lines 415-429 (brand boundary enforcement block)

**Verification:**
```bash
pytest tests/unit/test_governance.py -v
grep -n "BRAND_BOUNDARY_VIOLATION" services/project-ai/app/api/routes/governance.py
# Should return: no matches
```

---

### Step 3: Remove brand capture from candidate.py

**File:** `app/api/routes/candidate.py`

**Action:**
- In `upload_candidate()` endpoint, remove lines 168-171:
  ```python
  # Wave 1C: Capture uploader's brand...
  package.brand = user.get("brand")
  ```

**Verification:**
```bash
pytest tests/unit/test_candidate_upload.py -v
grep -n "package.brand" services/project-ai/app/api/routes/candidate.py
# Should return: no matches
```

---

### Step 4: Remove brand fields from models.py

**File:** `app/persistence/models.py`

**Actions:**
1. In `WorkflowModel` class:
   - Remove line 60: `requester_brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)`

2. In `CandidateModel` class:
   - Remove lines 342-343:
     ```python
     # Wave 1C: Tenant ownership tracking...
     brand = Column(String(100), nullable=True)
     uploader_brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
     ```

**Verification:**
```bash
cd services/project-ai
pytest tests/unit/test_models.py -v
grep -n "requester_brand\|uploader_brand\|brand = Column" app/persistence/models.py
# Should return: no matches (except brand independence certification comments)
```

---

### Step 5: Remove brand column writes from repositories.py

**File:** `app/persistence/repositories.py`

**Actions:**
1. In `PostgresWorkflowRepository.upsert()`:
   - Remove line 402: `requester_brand=workflow.requester_brand,`

2. In `PostgresCandidateRepository.upsert()`:
   - Remove lines 613, 623:
     ```python
     brand=candidate.brand,
     uploader_brand=candidate.uploader_brand,
     ```
     (in both INSERT values and ON CONFLICT UPDATE set_)

**Verification:**
```bash
pytest tests/integration/test_repositories_integration.py -v
grep -n "requester_brand\|uploader_brand" app/persistence/repositories.py
# Should return: no matches
```

---

### Step 6: Remove brand field from CandidatePackage model

**File:** `app/models/candidate.py`

**Action:**
- Remove lines 57-58:
  ```python
  # Wave 1C: Tenant ownership
  brand: Optional[str] = Field(None, description="Brand (tenant) that owns this candidate")
  ```

**Verification:**
```bash
pytest tests/unit/test_candidate_models.py -v
grep -n "brand:" app/models/candidate.py
# Should return: no matches
```

---

### Step 7: Remove brand isolation unit tests

**File:** `tests/security/test_authorization.py`

**Actions:**
1. Delete `TestVerifyBrandAccess` class (lines 12-134)
2. Delete brand enforcement tests from `TestBrandEnforcementInRoutes` class:
   - Lines 492-533: `test_candidate_upload_captures_brand`
   - Lines 535-590: `test_candidate_execute_same_brand_succeeds`
   - Lines 592-642: `test_candidate_execute_cross_brand_denied`
   - Lines 644-690: `test_candidate_execute_infrastructure_bypass`
   - Lines 693-752: `test_null_brand_candidate_requires_privileged_role`

3. Delete from `TestValidPathSmokeTests`:
   - Lines 768-819: `test_same_brand_workflow_approval_succeeds`
   - Lines 821-869: `test_infrastructure_user_cross_brand_access_succeeds`

4. Update remaining tests to remove brand field references:
   - In `TestIdentityExtractionFromJWT`, remove any `"brand": "skillhub"` from principal dicts OR leave them (doesn't matter, not checked anymore)

**Verification:**
```bash
pytest tests/security/test_authorization.py -v
# Expected: ~8-10 tests remaining (identity, RBAC, JWT validation)
```

---

### Step 8: Remove brand isolation integration tests

**File:** `tests/integration/test_security_integration.py`

**Actions:**
Delete Domain 2 — Brand Isolation section (lines 373-580):
1. `test_same_brand_workflow_access_allowed`
2. `test_cross_brand_workflow_access_denied`
3. `test_infrastructure_user_cross_brand_bypass`
4. `test_brand_none_resource_requires_infrastructure`
5. `test_candidate_upload_captures_requester_brand`

**Verification:**
```bash
pytest tests/integration/test_security_integration.py -v
# Expected: 20 tests (10 RBAC + 5 identity + 5 state machine)
```

---

### Step 9: Update documentation

**Files to update:**

1. **services/project-ai/README.md:**
   - Remove all references to "Brand Isolation" and "Wave 1C"
   - Update JWT Identity Claims section to remove `brand` field description
   - Update security notes to remove cross-brand access prevention

2. **ARCHITECTURE.md** (if exists):
   - Remove brand isolation security model
   - Update to reflect Scenario B (Super-Admin Model)

**Verification:**
```bash
grep -r "brand isolation\|Wave 1C\|cross-brand" services/project-ai/README.md
# Should return: no matches
```

---

### Step 10: Final verification run

**Run complete test suite:**
```bash
cd services/project-ai

# Unit tests
pytest tests/unit/ -v

# Security tests
pytest tests/security/test_authorization.py -v

# Integration tests (requires PostgreSQL)
pytest tests/integration/test_security_integration.py -v

# All tests
pytest tests/ -v --cov=app --cov-report=term
```

**Expected results:**
- All tests pass
- No references to `verify_brand_access`, `BRAND_BOUNDARY_VIOLATION`, `requester_brand`, `uploader_brand`, `package.brand`
- RBAC, identity extraction, state machine tests remain intact
- Brand independence certification tests remain (different concept)

**Manual verification checklist:**
- [ ] `verify_brand_access()` function removed
- [ ] No brand field writes in candidate upload
- [ ] No brand filtering in approval list
- [ ] No BRAND_BOUNDARY_VIOLATION errors raised
- [ ] 10 brand isolation unit tests removed
- [ ] 5 brand integration tests removed
- [ ] Models have no brand columns (code-level)
- [ ] Repositories have no brand column writes
- [ ] Documentation updated

---

## Files Preserved (DO NOT MODIFY)

These files contain brand independence **certification** logic, which is unrelated to the brand isolation **security** layer being removed:

1. **app/verification/brand.py** — Brand independence certification (tests that components don't hardcode tenant names)
2. **tests/test_certification_gates.py** — Tests for brand independence certification
3. **app/models/creation.py** — Contains `CertificationGateType.BRAND_INDEPENDENCE` enum

**Key distinction:**
- **Brand isolation (REMOVED):** JWT-based access control preventing cross-tenant data access
- **Brand independence (PRESERVED):** Code quality check ensuring no hardcoded tenant names in implementations

---

## Risk Assessment

**Low Risk:**
- Code removal only (no schema changes)
- Unused code path (SHC-admin JWT has brand=null, so brand checks never enforced anyway)
- Comprehensive test coverage ensures no regressions

**Medium Risk:**
- Database columns remain (nullable, unpopulated). Future schema cleanup required.

**Mitigation:**
- Run full test suite before and after removal
- Deploy to staging first, verify workflows function correctly
- Monitor logs for any unexpected "brand" references after deployment

---

## Deployment Notes

**Pre-deployment checklist:**
1. [ ] Verify SHC-admin JWT structure (confirm brand=null)
2. [ ] Run all tests in clean environment
3. [ ] Review code changes for any missed brand references

**Post-deployment verification:**
1. [ ] Create workflow as SHC-admin → succeeds
2. [ ] Upload candidate → succeeds
3. [ ] Approve manifest → succeeds
4. [ ] Check logs for any "brand" or "BRAND_BOUNDARY_VIOLATION" errors → zero occurrences

**Rollback plan:**
- Git revert commit
- No database rollback needed (columns unchanged)

---

## Summary Statistics

**Code removed:**
- 1 function: `verify_brand_access()` (~107 lines)
- 4 database columns (code-level): `requester_brand`, `brand`, `uploader_brand` (x2)
- 12 test functions (brand isolation tests)
- ~15 brand enforcement blocks in route handlers
- Total: ~400-500 lines removed

**Code preserved:**
- All RBAC functions (require_role, require_contract_admin, is_super_admin)
- All identity extraction (user_id, roles, original_user_id, shadow_user_id)
- All brand independence certification (app/verification/brand.py)
- All workflow state machine logic
- All self-approval prevention

**Test coverage after removal:**
- RBAC: 10 tests
- Identity extraction: 5 tests
- State machine: 5 tests
- JWT validation: 2 tests
- Total: ~22 tests remaining (down from ~37 tests)

---

## Completion Criteria

This refactoring is complete when:
1. ✅ All 10 steps executed successfully
2. ✅ All remaining tests pass (pytest tests/ -v)
3. ✅ No grep matches for: `verify_brand_access`, `BRAND_BOUNDARY_VIOLATION`, `requester_brand`, `uploader_brand`, `package.brand`
4. ✅ Documentation updated
5. ✅ Deployed to staging and verified
6. ✅ Deployed to production with monitoring

---

**Plan prepared:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") UTC  
**Target completion:** 1 development day  
**Estimated effort:** 4-6 hours (coding + testing)
