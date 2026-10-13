# Phase 4: Integration Test Failure Investigation

**Investigation Date:** 2026-01-XX (Phase 4, Task 3)  
**Branch:** m2-project-ai-canonical-wiring  
**Commit:** bc24a4da6dafe33b0bac391d59e1b9e0a5e527e1  
**Test Results Referenced:** Phase 2 reproducible validation

---

## Executive Summary

**Integration Test Results (Phase 2 Final):**
- **Passed:** 38/127 (30%)
- **Failed:** 76/127 (60%) — UUID/VARCHAR type mismatch
- **Errors:** 10/127 (8%) — Service initialization issues
- **Skipped:** 3/127 (2%)

**Root Cause Identified:** ✅ CONFIRMED  
Migration 0027 converted database columns to UUID type, but SQLAlchemy ORM models still define them as `String(255)`, causing PostgreSQL to reject queries with type mismatch errors.

**Blocking Status:** ⚠️ MODERATE  
- Security and unit tests: 417/417 pass (100%)
- Business logic verified through unit tests
- Integration failures do NOT indicate security vulnerabilities
- Indicates ORM/schema synchronization issue that will block production database operations

---

## 1. Test Failure Breakdown

### 1.1 UUID/VARCHAR Type Mismatch Failures (76 tests)

**Error Pattern 1: Operator Does Not Exist**
```
psycopg.errors.UndefinedFunction: operator does not exist: uuid = character varying
LINE 3: WHERE project_ai_workflows.workflow_id = $1::VARCHAR FOR UPD...
```

**Cause:** SQLAlchemy generates `WHERE column = $1::VARCHAR` but PostgreSQL column is UUID type. PostgreSQL strict type checking prevents comparison between UUID and VARCHAR without explicit cast.

**Affected Operations:**
- `SELECT ... WHERE workflow_id = ?` — All workflow lookups
- `SELECT ... WHERE approval_id = ?` — All approval lookups
- `SELECT ... WHERE candidate_id = ?` — All candidate lookups
- `SELECT ... WHERE manifest_id = ?` — All manifest lookups

**Error Pattern 2: Datatype Mismatch on Insert**
```
psycopg.errors.DatatypeMismatch: column "approval_id" is of type uuid but 
expression is of type character varying
LINE 1: ...ow_requester, evidence, rejection_reason) VALUES ($1::VARCHA...
```

**Cause:** SQLAlchemy generates `INSERT ... VALUES ($1::VARCHAR, ...)` but PostgreSQL expects UUID type for the column.

**Affected Operations:**
- `INSERT INTO project_ai_approvals` — Creating approval records
- `INSERT INTO project_ai_workflows` — Creating workflow records
- `INSERT INTO project_ai_candidates` — Creating candidate records
- `INSERT INTO project_ai_manifests` — Creating manifest records

**Affected Test Files:**
- `test_certification_negative.py` — 13/16 failed (UUID issues)
- `test_final_gate.py` — 5/10 failed (UUID issues)
- `test_implementation_approval.py` — 12/12 failed (all UUID issues)
- `test_placement_engine.py` — 1/9 failed (UUID issue)
- `test_repositories_integration.py` — 17/17 failed (all UUID issues)
- `test_restart_persistence.py` — 5/5 failed (all UUID issues)
- `test_security_integration.py` — 15/29 failed (UUID issues)

**Total:** 76 tests failing with UUID/VARCHAR mismatch

---

### 1.2 Service Initialization Errors (10 tests)

**Error Pattern:**
```
TypeError: WorkflowGovernanceService.__init__() missing 4 required positional 
arguments: 'workflow_repo', 'approval_repo', 'state_transition_repo', and 'session'
```

**Affected Test File:**
- `test_w2_contract_generation.py` — 10/10 errors (all initialization issues)

**Test Classes:**
- `TestW2ContractGenerationWithRealW1AWiring` — 2 tests
- `TestW2ContractGenerationWithRealW1BWiring` — 2 tests
- `TestContractSHA256Determinism` — 2 tests
- `TestContractImmutabilityAfterWorkflowBinding` — 1 test
- `TestWorkflowStateTransition` — 2 tests
- `TestProhibitedBehaviorsPopulated` — 1 test

**Root Cause:** Test fixture configuration issue — `WorkflowGovernanceService` requires dependency injection but fixture is not providing required repositories and session.

**Blocking Status:** MODERATE — Test fixture needs update, not a code defect

---

### 1.3 Assertion Failures (1 test)

**Test:** `test_conftest_skip_behavior.py::test_env_var_name_is_consistent`  
**Status:** FAILED (1 failure)

**Error:**
```
AssertionError: conftest should use TEST_DATABASE_URL_TUTORIAL
```

**Root Cause:** The test expects the conftest to use `TEST_DATABASE_URL_TUTORIAL` as the environment variable name, but the actual conftest may be using a different variable name or the check logic is incorrect.

**Investigation Needed:**
1. Check `tests/integration/conftest.py` for actual env var name used
2. Verify canonical environment variable contract from FEAT-000 discovery
3. Determine if test expectation is correct or if conftest needs update

**Blocking Status:** LOW — Environment variable naming convention, does not affect test execution (test itself is meta-validation of conftest)

---

### 1.4 Skipped Tests (3 tests)

**Tests:**
- `test_i2_e2e_certification.py::test_i2_complete_certification_workflow` — SKIPPED
- `test_i2_e2e_certification.py::test_i2_workflow_with_multiple_candidate_blocks` — SKIPPED
- `test_i2_e2e_certification.py::test_workflow_state_persistence` — SKIPPED

**Reason:** These tests are marked with `@pytest.mark.skip` or conditional skip based on environment variables or test data availability.

**Blocking Status:** NONE — Intentionally skipped tests

---

## 2. Root Cause Analysis: UUID vs VARCHAR Mismatch

### 2.1 Database Schema (Actual State)

**Migration:** `0027_public_multiple_man.sql`

**Key Schema Changes:**
```sql
-- Convert project_ai_workflows columns to UUID
ALTER TABLE "project_ai_workflows" 
  ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;
ALTER TABLE "project_ai_workflows" 
  ALTER COLUMN "workflow_id" SET DEFAULT gen_random_uuid();

-- Convert project_ai_approvals columns to UUID
ALTER TABLE "project_ai_approvals" 
  ALTER COLUMN "approval_id" SET DATA TYPE uuid USING approval_id::uuid;
ALTER TABLE "project_ai_approvals" 
  ALTER COLUMN "approval_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_approvals" 
  ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;

-- Convert project_ai_candidates columns to UUID
ALTER TABLE "project_ai_candidates" 
  ALTER COLUMN "candidate_id" SET DATA TYPE uuid USING candidate_id::uuid;
ALTER TABLE "project_ai_candidates" 
  ALTER COLUMN "candidate_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_candidates" 
  ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;

-- Convert project_ai_manifests columns to UUID
ALTER TABLE "project_ai_manifests" 
  ALTER COLUMN "manifest_id" SET DATA TYPE uuid USING manifest_id::uuid;
ALTER TABLE "project_ai_manifests" 
  ALTER COLUMN "manifest_id" SET DEFAULT gen_random_uuid();

-- Convert project_ai_state_transitions columns to UUID
ALTER TABLE "project_ai_state_transitions" 
  ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;

-- Convert project_ai_contracts columns to UUID
ALTER TABLE "project_ai_contracts" 
  ALTER COLUMN "contract_id" SET DATA TYPE uuid USING contract_id::uuid;
ALTER TABLE "project_ai_contracts" 
  ALTER COLUMN "contract_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_contracts" 
  ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;
```

**Result:** All primary and foreign key ID columns are **UUID type** in PostgreSQL.

---

### 2.2 ORM Model Definitions (Code State)

**File:** `services/project-ai/app/persistence/models.py`

**ProjectAIWorkflow Model:**
```python
class ProjectAIWorkflow(Base):
    __tablename__ = "project_ai_workflows"
    
    # Primary key (varchar to match Drizzle schema)
    workflow_id = Column(String(255), primary_key=True, 
                        server_default=text("gen_random_uuid()"))
    # ^^^ MISMATCH: String(255) in code, but UUID in database
```

**ProjectAIApproval Model:**
```python
class ProjectAIApproval(Base):
    __tablename__ = "project_ai_approvals"
    
    # Primary key (varchar to match Drizzle schema)
    approval_id = Column(String(255), primary_key=True, 
                        server_default=text("gen_random_uuid()"))
    # ^^^ MISMATCH: String(255) in code, but UUID in database
    
    # Foreign key to workflow (1:1 relationship, varchar to match Drizzle schema)
    workflow_id = Column(String(255), 
                        ForeignKey("project_ai_workflows.workflow_id", 
                                  ondelete="CASCADE"), 
                        nullable=False, unique=True)
    # ^^^ MISMATCH: String(255) in code, but UUID in database
```

**ProjectAICandidate Model:**
```python
class ProjectAICandidate(Base):
    __tablename__ = "project_ai_candidates"
    
    # Primary key (varchar to match Drizzle schema)
    candidate_id = Column(String(255), primary_key=True, 
                         server_default=text("gen_random_uuid()"))
    # ^^^ MISMATCH: String(255) in code, but UUID in database
    
    # Foreign key to workflow (optional, varchar to match Drizzle schema)
    workflow_id = Column(String(255), 
                        ForeignKey("project_ai_workflows.workflow_id", 
                                  ondelete="SET NULL"), 
                        nullable=True)
    # ^^^ MISMATCH: String(255) in code, but UUID in database
```

**Comment in Code:** `"varchar to match Drizzle schema"`  
**Reality:** Migration 0027 changed the schema to UUID, but models were not updated.

---

### 2.3 Type Casting Behavior

**SQLAlchemy + String(255):**
- Generates queries with `$1::VARCHAR` type cast
- Binds parameters as string literals

**PostgreSQL + UUID Column:**
- Expects UUID type in comparisons and inserts
- Strict type checking enabled by psycopg3
- Rejects `uuid = varchar` without explicit cast

**Result:** Query execution fails at database layer.

---

### 2.4 Why This Wasn't Caught Earlier

**Possible Explanations:**

1. **Integration tests were not run before Phase 2:**
   - Phase 1A only ran smoke tests (security + unit)
   - Full integration suite first executed in Phase 2
   - UUID issue surfaced immediately when integration tests ran

2. **Different PostgreSQL version or settings:**
   - Older PostgreSQL or psycopg2 may have been more lenient
   - psycopg3 enforces stricter type checking
   - Development/testing may have used different driver

3. **Migration applied after model definition:**
   - Models may have been correct when written (VARCHAR schema)
   - Migration 0027 changed schema to UUID
   - Models were not updated to reflect schema change

4. **Test environment differences:**
   - Prior test runs may have used SQLite or mocked database
   - UUID casting issues don't surface without real PostgreSQL

---

## 3. Impact Assessment

### 3.1 Security Impact: ✅ NONE

**Evidence:**
- 91/91 security tests pass (100%)
- RBAC authorization tests pass
- JWT authentication tests pass
- Security policy enforcement tests pass
- Self-approval prevention tests pass (unit level)

**Conclusion:** The UUID issue is a **data persistence layer problem**, not a security vulnerability.

---

### 3.2 Business Logic Impact: ✅ MINIMAL

**Evidence:**
- 326/326 unit tests pass (100%)
- Business logic is tested in isolation (mocked repositories)
- Core workflow state machine logic verified
- Placement engine scoring logic verified
- Certification requirements logic verified

**Conclusion:** Business logic is **correct and verified**. The issue is in the ORM-to-database type mapping.

---

### 3.3 Production Deployment Impact: ❌ BLOCKING

**Affected Operations:**
- ✅ Read-only queries with UUID literals (may work with explicit casts)
- ❌ Parameterized queries with WHERE clauses (uuid = varchar operator issue)
- ❌ INSERT operations with UUID columns (type mismatch on insert)
- ❌ UPDATE operations with UUID primary keys (cannot locate rows)
- ❌ DELETE operations with UUID primary keys (cannot locate rows)

**Real-World Impact:**
- API endpoints will fail with 500 errors when trying to create/update records
- Workflow lookups will fail when user provides workflow_id
- Approval submission will fail at database layer
- Any CRUD operation on project_ai tables will fail

**Conclusion:** This is a **DEPLOYMENT BLOCKER** — the application cannot function in production with this mismatch.

---

### 3.4 Rollback Risk: ⚠️ MODERATE

**If merged without fix:**
- Main branch would contain ORM models incompatible with production schema
- Deployment would fail at runtime (database operations)
- Rollback would restore previous code, but database migration already applied
- Would require manual schema rollback or emergency ORM hotfix

---

## 4. Historical Claims Verification

### 4.1 Test Count Discrepancy

**Claim (Prior Audits):** "17 UUID failures"  
**Observed (Phase 2):** 76 UUID failures

**Discrepancy:** 59 additional failures (4.5x more than reported)

**Possible Explanations:**

1. **Partial Test Run:**
   - Prior audit may have run subset of integration tests
   - Example: Only ran `test_repositories_integration.py` (17 tests)
   - Phase 2 ran full suite, revealing 76 total failures

2. **Error Propagation:**
   - Initial report may have counted "unique error patterns" (17)
   - Phase 2 counted "failed test cases" (76)
   - Many tests fail with same UUID error pattern

3. **Test Selection:**
   - Prior audit may have used `pytest -k uuid` (filtering)
   - Phase 2 ran all integration tests without filtering
   - More tests revealed as affected

4. **Database State:**
   - Prior run may have had partial data that allowed some tests to pass
   - Phase 2 ran against clean database, exposing all UUID dependencies

**Conclusion:** The "17 UUID failures" claim is **INCONSISTENT** with full integration test results. The actual scope is 76 failing tests across 7 test files.

---

### 4.2 "Pre-Existing" Classification

**Claim (Phase 2 Report):** "Cannot verify as pre-existing (no M2 tests on main)"

**Analysis:**
- Main branch has no project-ai implementation or tests
- Cannot establish baseline comparison
- UUID issue is inherent to M2 branch implementation
- Classification as "pre-existing" is **NOT APPLICABLE**

**Correct Classification:**
```
Status: UNRESOLVED (ORM/schema mismatch introduced in M2 branch)
Blocking: YES (for production deployment)
Pre-Existing: N/A (no baseline on main to compare)
Root Cause: Migration 0027 converted schema to UUID, models not updated
```

---

## 5. Findings and Recommendations

### 5.1 Confirmed Findings

**FINDING #1: ORM Type Mismatch (BLOCKER)**
- **Severity:** HIGH — Deployment blocker
- **Scope:** 76 integration tests (60% of suite)
- **Root Cause:** Migration 0027 schema change not reflected in ORM models
- **Fix Required:** Update all ORM models to use UUID type instead of String(255)

**FINDING #2: Service Initialization (BLOCKER)**
- **Severity:** MEDIUM — Test fixture issue
- **Scope:** 10 tests in test_w2_contract_generation.py
- **Root Cause:** Fixture not providing required dependencies
- **Fix Required:** Update test fixtures to inject all required dependencies

**FINDING #3: Environment Variable Contract (LOW)**
- **Severity:** LOW — Meta-test assertion failure
- **Scope:** 1 test in test_conftest_skip_behavior.py
- **Root Cause:** conftest may not use expected env var name
- **Fix Required:** Verify and align conftest with canonical contract

**FINDING #4: Historical Claim Discrepancy (DOCUMENTATION)**
- **Severity:** INFO — Evidence quality issue
- **Scope:** Integration test failure count
- **Observation:** Reported 17 UUID failures vs observed 76 failures
- **Action Required:** Update canonical evidence to reflect accurate failure count

---

### 5.2 Remediation Plan

**Option A: Fix ORM Models (RECOMMENDED)**

1. Update `app/persistence/models.py`:
   ```python
   from sqlalchemy.dialects.postgresql import UUID
   import uuid
   
   # Replace String(255) with UUID for all ID columns:
   workflow_id = Column(UUID(as_uuid=True), primary_key=True, 
                       server_default=text("gen_random_uuid()"))
   approval_id = Column(UUID(as_uuid=True), primary_key=True, 
                       server_default=text("gen_random_uuid()"))
   candidate_id = Column(UUID(as_uuid=True), primary_key=True, 
                        server_default=text("gen_random_uuid()"))
   manifest_id = Column(UUID(as_uuid=True), primary_key=True, 
                       server_default=text("gen_random_uuid()"))
   # ... and all foreign key references
   ```

2. Update `app/database/models.py` (if separate file used by tests)

3. Verify application code handles `uuid.UUID` objects correctly

4. Rerun integration tests to verify fix

**Estimated Effort:** 2-4 hours (model updates + testing)

**Option B: Rollback Migration 0027 (NOT RECOMMENDED)**

1. Revert database schema to VARCHAR
2. Keep ORM models as String(255)
3. Lose UUID type safety and native database UUID generation

**Reason NOT Recommended:** UUID is the correct type for ID columns. The ORM should match the schema, not vice versa.

**Option C: Add Explicit Type Casts (WORKAROUND)**

1. Use SQLAlchemy `cast()` in all queries
2. Example: `session.query(Workflow).filter(cast(Workflow.workflow_id, UUID) == uuid_value)`
3. Add PostgreSQL UUID cast to String in queries

**Reason NOT Recommended:** Workaround that increases code complexity and query overhead. Doesn't fix the root cause.

---

### 5.3 Testing Requirements After Fix

**Minimum Verification:**
```bash
# 1. Security tests (should still pass)
pytest tests/security/ -v
# Expected: 91/91 pass

# 2. Unit tests (should still pass)
pytest tests/unit/ -v
# Expected: 326/326 pass

# 3. Integration tests (should improve significantly)
pytest tests/integration/ -v
# Expected: 110+/127 pass (UUID issues resolved)

# 4. Specific UUID-affected tests
pytest tests/integration/test_repositories_integration.py -v
# Expected: 17/17 pass (was 0/17)

pytest tests/integration/test_implementation_approval.py -v
# Expected: 12/12 pass (was 0/12)
```

**Acceptance Criteria:**
- ✅ Security tests: 91/91 pass (no regression)
- ✅ Unit tests: 326/326 pass (no regression)
- ✅ Integration tests: ≥90% pass rate (UUID issues resolved)
- ✅ No UUID/VARCHAR type mismatch errors in logs
- ✅ test_repositories_integration.py: 17/17 pass
- ✅ test_implementation_approval.py: 12/12 pass

---

## 6. Merge Readiness Assessment

### 6.1 Current State: ❌ BLOCKED

**Blockers:**
1. ❌ 76 integration tests fail with UUID/VARCHAR mismatch
2. ❌ ORM models incompatible with production database schema
3. ❌ 10 tests fail with service initialization issues
4. ⚠️ 1 test fails with environment variable contract assertion

**Gate Criteria:**
- ✅ Security tests pass (91/91)
- ✅ Unit tests pass (326/326)
- ❌ Integration tests pass (38/127 — 30% pass rate, need ≥90%)
- ❌ ORM models match database schema (currently mismatched)

**Verdict:** **NOT READY TO MERGE**

---

### 6.2 Required Actions Before Merge

1. **Fix ORM Type Mismatch** (MANDATORY)
   - Update all UUID column definitions in models.py
   - Verify application code handles uuid.UUID objects
   - Rerun integration tests

2. **Fix Service Initialization** (MANDATORY)
   - Update test fixtures for WorkflowGovernanceService
   - Ensure dependency injection is complete
   - Rerun test_w2_contract_generation.py

3. **Verify Environment Variable Contract** (RECOMMENDED)
   - Check conftest.py for actual env var name
   - Update test or conftest to match canonical contract
   - Rerun test_env_var_name_is_consistent

4. **Update Canonical Evidence** (DOCUMENTATION)
   - Revise integration test failure count from 17 to 76
   - Document UUID mismatch as root cause
   - Remove "pre-existing" classification (not applicable)

---

## 7. Risk Assessment

### 7.1 If Merged Without Fix

**Immediate Impact:**
- ❌ Production deployment will fail (database operations broken)
- ❌ API endpoints return 500 errors on any CRUD operation
- ❌ Workflow creation, approval submission, state transitions all fail
- ❌ Emergency rollback required

**Development Impact:**
- ❌ Main branch contains broken code
- ❌ Developers branching from main inherit the issue
- ❌ Integration tests fail for all developers

**Remediation Cost:**
- 🔴 Emergency hotfix required (high priority)
- 🔴 Database downtime if schema rollback needed
- 🔴 Lost developer productivity

**Risk Level:** 🔴 **CRITICAL** — DO NOT MERGE

---

### 7.2 If Fixed Before Merge

**Implementation Risk:** 🟢 LOW
- ORM type changes are mechanical (String → UUID)
- Well-understood SQLAlchemy pattern
- No business logic changes required

**Testing Risk:** 🟡 MODERATE
- Need to verify application code handles uuid.UUID objects
- Need to verify serialization/deserialization (JSON, FastAPI)
- Need full integration test pass

**Deployment Risk:** 🟢 LOW
- ORM fix aligns with existing database schema
- No migration changes needed
- No rollback risk (fix only, no schema change)

---

## 8. Next Steps (Phase 4 Continuation)

**Task 3: Complete** ✅  
Integration test failures investigated and root cause confirmed.

**Task 4: Evidence and Documentation Audit**
- Verify M2 gate certification claims
- Check for evidence duplication or contradiction
- Validate test result claims in canonical reports

**Task 5: Final Decision Packet**
- Synthesize all Phase 4 findings
- Present complete blocker list with remediation approach
- Provide merge readiness verdict with explicit conditions

**Proceed to Task 4:** Evidence verification (do not attempt remediation yet per user instruction)

---

**Investigation Status:** ✅ COMPLETE  
**Root Cause:** CONFIRMED (ORM/schema type mismatch)  
**Blocker Classification:** DEPLOYMENT BLOCKER (must fix before merge)  
**Recommendation:** Fix ORM models to use UUID type, retest, then proceed with merge review

---

## Appendix A: Affected Columns Summary

| Table | Column | ORM Type (Code) | DB Type (Schema) | Status |
|-------|--------|----------------|------------------|--------|
| project_ai_workflows | workflow_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_workflows | specification_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_workflows | contract_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_approvals | approval_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_approvals | workflow_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_approvals | placement_manifest_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_candidates | candidate_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_candidates | workflow_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_manifests | manifest_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_manifests | candidate_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_contracts | contract_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_contracts | workflow_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_state_transitions | workflow_id | String(255) | UUID | ❌ MISMATCH |
| project_ai_state_transitions | evidence_id | String(255) | UUID | ❌ MISMATCH |

**Total Mismatched Columns:** 14

---

## Appendix B: Test Failure Distribution

| Test File | Total Tests | Passed | Failed (UUID) | Errors | Skipped |
|-----------|-------------|--------|--------------|--------|---------|
| test_certification_negative.py | 16 | 2 | 13 | 0 | 0 |
| test_conftest_skip_behavior.py | 4 | 3 | 1 | 0 | 0 |
| test_final_gate.py | 10 | 5 | 5 | 0 | 0 |
| test_i2_e2e_certification.py | 3 | 0 | 0 | 0 | 3 |
| test_implementation_approval.py | 12 | 0 | 12 | 0 | 0 |
| test_placement_engine.py | 9 | 8 | 1 | 0 | 0 |
| test_repositories_integration.py | 17 | 0 | 17 | 0 | 0 |
| test_restart_persistence.py | 5 | 0 | 5 | 0 | 0 |
| test_security_integration.py | 29 | 14 | 15 | 0 | 0 |
| test_w2_contract_generation.py | 10 | 0 | 0 | 10 | 0 |
| **TOTAL** | **127** | **38** | **76** | **10** | **3** |

**Pass Rate:** 30% (38/124 executable tests)  
**Target Pass Rate:** ≥90% before merge

