# Gate F Schema Fix Report
**Date:** 2025-01-XX  
**Task:** Fix database schema mismatch in project-ai service  
**Status:** ✅ COMPLETE

## Executive Summary
Successfully resolved 7 failing brand enforcement tests in Domain 2 (RBAC Authorization) by adding two missing database columns to support multi-tenant brand isolation in the project-ai service.

**Result:** All 160 W6 verification suite tests passing (previously 153/160)

---

## Schema Changes

### 1. CandidateModel: Added `uploader_brand` Column
**File:** `services/project-ai/app/persistence/models.py`

**Column Definition:**
```python
uploader_brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
```

**Purpose:** Tracks which brand uploaded the candidate for multi-tenant brand isolation and cross-brand access control.

**Location:** Added after the existing `brand` column (line ~287), before `candidate_sha256`.

**Characteristics:**
- Type: String (VARCHAR)
- Nullable: True (existing rows will have NULL)
- No default value required

---

### 2. WorkflowModel: Added `requester_brand` Column
**File:** `services/project-ai/app/persistence/models.py`

**Column Definition:**
```python
requester_brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
```

**Purpose:** Tracks which brand created the workflow for cross-brand access control and approval workflow enforcement.

**Location:** Added after `requester_id` (line ~68), before the "Lifecycle state" section.

**Characteristics:**
- Type: String (VARCHAR)
- Nullable: True (existing rows will have NULL)
- No default value required

---

## Repository Updates

### 3. PostgresCandidateRepository.upsert()
**File:** `services/project-ai/app/persistence/repositories.py`

**Changes:**
- Added `brand` and `uploader_brand` to `.values()` clause (INSERT)
- Added `brand` and `uploader_brand` to `.on_conflict_do_update()` `set_` dict (UPDATE)

**Impact:** Ensures brand fields are persisted during candidate upload and execute operations.

---

### 4. PostgresWorkflowRepository.upsert()
**File:** `services/project-ai/app/persistence/repositories.py`

**Changes:**
- Added `requester_brand` to `.values()` clause in the atomic update section

**Impact:** Ensures requester brand is captured and preserved during workflow lifecycle transitions.

---

## Import Updates

### 5. SQLAlchemy ORM Imports
**File:** `services/project-ai/app/persistence/models.py`

**Added:**
```python
from sqlalchemy.orm import relationship, declarative_base, Mapped, mapped_column
```

**Previous:**
```python
from sqlalchemy.orm import relationship, declarative_base
```

**Rationale:** Added `Mapped` and `mapped_column` imports to support the new type-safe column definitions using SQLAlchemy 2.0 style.

---

## Migration Status

**Migration Created:** ❌ NO

**Reason:** No migration directory found in `services/project-ai/`. The project does not use Alembic or a conventional migrations directory.

**Schema Creation Method:** The test suite uses SQLAlchemy's `Base.metadata.create_all()` in `tests/conftest.py` to create tables from ORM models in an in-memory SQLite database.

**Production Deployment Note:** If this service uses a live PostgreSQL database, manual migration steps will be required:

```sql
-- Add uploader_brand to candidates table
ALTER TABLE project_ai_candidates 
ADD COLUMN uploader_brand VARCHAR(255) NULL;

-- Add requester_brand to workflows table
ALTER TABLE project_ai_workflows 
ADD COLUMN requester_brand VARCHAR(255) NULL;
```

**Documentation Note:** The models.py file comments explicitly state: "Schema changes ONLY through Drizzle migrations (no create_all())" which suggests the production environment may use Drizzle for migrations, not Alembic.

---

## Test Results

### Domain 1: Governance Identity
**File:** `services/project-ai/tests/security/test_governance_identity.py`  
**Result:** ✅ 4/4 PASSED

**Tests:**
- test_governance_submit_uses_jwt_identity
- test_governance_approve_prevents_jwt_self_approval
- test_governance_approve_allows_different_jwt_identity
- test_governance_reject_uses_jwt_identity

**Status:** No change from baseline (was already passing)

---

### Domain 2: RBAC Authorization ⭐ (Fixed)
**File:** `services/project-ai/tests/security/test_authorization.py`  
**Result:** ✅ 19/19 PASSED  
**Previous:** 12/19 FAILED

**Newly Fixed Tests (7):**
1. ✅ `test_candidate_upload_captures_brand` - Verifies uploader's brand captured during candidate upload
2. ✅ `test_candidate_execute_same_brand_succeeds` - Same-brand candidate execution allowed
3. ✅ `test_candidate_execute_cross_brand_denied` - Cross-brand candidate execution denied
4. ✅ `test_candidate_execute_infrastructure_bypass` - Infrastructure role bypasses brand boundaries
5. ✅ `test_null_brand_candidate_requires_privileged_role` - NULL brand candidates require privileged role
6. ✅ `test_same_brand_workflow_approval_succeeds` - Same-brand workflow approval succeeds
7. ✅ `test_infrastructure_user_cross_brand_access_succeeds` - Infrastructure users can access cross-brand

**Previously Passing Tests (12):**
- test_verify_brand_access_same_brand_allowed
- test_verify_brand_access_cross_brand_denied
- test_verify_brand_access_none_user_brand_allowed
- test_verify_brand_access_none_resource_brand_allowed
- test_verify_brand_access_both_none_allowed
- test_infrastructure_bypass_requires_privileged_role
- test_approver_identity_extraction_from_jwt
- test_requester_identity_extraction_from_jwt
- test_client_supplied_user_id_ignored
- test_self_approval_prevention_with_jwt_identity
- test_forged_super_admin_role_rejected
- test_missing_user_id_claim_rejected

---

### Domain 3: Evidence Enforcement
**File:** `services/project-ai/tests/security/test_w7_evidence_enforcement.py`  
**Result:** ✅ 21/21 PASSED

**Coverage:**
- All required evidence validation
- Super admin evidence bypass
- Missing evidence rejection
- Failed/blocked/partial verdict handling
- Wrong workflow/artifact digest rejection
- Stale/future evidence rejection
- Evidence repository unavailability handling
- Concurrent certification prevention
- Audit event creation

**Status:** No change from baseline (was already passing)

---

### Domain 4: Artifact Policy (W3C)
**Files:**
- `services/project-ai/tests/test_artifact_policy.py`
- `services/project-ai/tests/governance/test_w3c_artifact_policy.py`

**Result:** ✅ 87/87 PASSED

**Coverage Areas:**
- Artifact name normalization (7 tests)
- Repository index building (4 tests)
- Semantic matching (4 tests)
- Action determination (5 tests)
- Target path resolution (5 tests)
- Duplicate prevention (2 tests)
- Content duplicate detection (15 tests)
- Version conflict resolution (18 tests)
- Rejection policy (6 tests)
- Provenance tracking (5 tests)
- Canonical registry (6 tests)
- Edge cases (10 tests)

**Status:** No change from baseline (was already passing)

---

### Domain 5: Placement Authorization (W5)
**File:** `services/project-ai/tests/security/test_w5_placement_authorization.py`  
**Result:** ✅ 29/29 PASSED

**Coverage:**
- Placement creation authorization (3 tests)
- Placement override authorization (3 tests)
- Conflict listing (1 test)
- Super admin bypass (1 test)
- Artifact binding authorization (4 tests)
- Candidate classification authorization (2 tests)
- Manifest generation authorization (2 tests)
- Placement execution authorization (1 test)
- State transition authorization (4 tests)
- Brand boundary enforcement (4 tests)
- Policy enforcement (4 tests)

**Status:** No change from baseline (was already passing)

---

## Overall W6 Verification Suite Results

| Domain | Description | Tests | Status | Change |
|--------|-------------|-------|--------|--------|
| Domain 1 | Governance Identity | 4/4 | ✅ PASS | No change |
| Domain 2 | RBAC Authorization | 19/19 | ✅ PASS | **+7 fixed** |
| Domain 3 | Evidence Enforcement | 21/21 | ✅ PASS | No change |
| Domain 4 | Artifact Policy (W3C) | 87/87 | ✅ PASS | No change |
| Domain 5 | Placement Authorization (W5) | 29/29 | ✅ PASS | No change |
| **TOTAL** | **All Domains** | **160/160** | **✅ PASS** | **+7 fixed** |

**Execution Time:** 1.63 seconds  
**Test Framework:** pytest 9.1.1, Python 3.13.5

---

## Files Modified

1. `services/project-ai/app/persistence/models.py`
   - Added `Mapped` and `mapped_column` imports
   - Added `uploader_brand` column to `CandidateModel`
   - Added `requester_brand` column to `WorkflowModel`

2. `services/project-ai/app/persistence/repositories.py`
   - Updated `PostgresCandidateRepository.upsert()` to persist `brand` and `uploader_brand`
   - Updated `PostgresWorkflowRepository.upsert()` to persist `requester_brand`

**Total Files Modified:** 2  
**Total Lines Changed:** ~10 additions

---

## Verification Commands

Run Domain 2 tests only:
```bash
pytest services/project-ai/tests/security/test_authorization.py -v
```

Run all W6 verification suite tests:
```bash
pytest services/project-ai/tests/security/test_governance_identity.py \
       services/project-ai/tests/security/test_authorization.py \
       services/project-ai/tests/security/test_w7_evidence_enforcement.py \
       services/project-ai/tests/test_artifact_policy.py \
       services/project-ai/tests/governance/test_w3c_artifact_policy.py \
       services/project-ai/tests/security/test_w5_placement_authorization.py -v
```

---

## Constraints Satisfied

✅ **Schema-only changes:** Added columns only, no business logic modified  
✅ **Nullable columns:** Both columns are nullable, existing rows will have NULL  
✅ **No breaking changes:** All existing passing tests remain passing  
✅ **Repository consistency:** Updated upsert methods to persist new columns  
✅ **Type safety:** Used SQLAlchemy 2.0 `Mapped` type hints for new columns  

---

## Next Steps for Production Deployment

1. **Review Migration Strategy:**
   - Confirm whether Drizzle is used for production migrations
   - If yes, create equivalent Drizzle migration files
   - If no, apply manual ALTER TABLE statements to production database

2. **Database Backfill (Optional):**
   - Consider backfilling `uploader_brand` and `requester_brand` for existing records
   - Query existing `CandidateModel.brand` and `WorkflowModel` relationships to determine historical values

3. **API Integration:**
   - Verify that candidate upload routes capture `uploader_brand` from JWT claims
   - Verify that workflow creation routes capture `requester_brand` from JWT claims

4. **Monitoring:**
   - Monitor for NULL brand values in brand enforcement checks
   - Add metrics for cross-brand access attempts

---

## Conclusion

The schema fix successfully resolved all 7 failing brand enforcement tests by adding the necessary database columns to support multi-tenant brand isolation. The implementation:

- Uses nullable columns to avoid breaking existing data
- Maintains backward compatibility with existing code
- Follows SQLAlchemy 2.0 best practices
- Preserves all 153 previously passing tests
- Achieves 160/160 test pass rate for the W6 verification suite

**Gate F Integration Testing:** ✅ READY TO PROCEED

---

**Report Generated:** 2025-01-XX  
**Author:** Kiro AI Workflow Agent  
**Workflow:** gate-f-schema-fix
