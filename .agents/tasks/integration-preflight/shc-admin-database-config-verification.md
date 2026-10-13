# SHC-admin Database Configuration Verification

**Created**: 2025-02-01  
**Purpose**: Verify canonical DATABASE_URL_TUTORIAL convention across SHC-admin and Project AI  
**Status**: VERIFICATION COMPLETE

---

## Executive Summary

**FINDING**: `DATABASE_URL_TUTORIAL` is the canonical environment variable used across the entire monorepo.

**COMPLIANCE STATUS**:
- ✅ SHC-admin: Uses `DATABASE_URL_TUTORIAL` (via `@quiz/db-tutorial` package)
- ✅ Project AI Application: Uses `DATABASE_URL_TUTORIAL` correctly
- ❌ Project AI Integration Tests: **INCORRECTLY** references `TEST_DATABASE_URL_TUTORIAL` in documentation comments
- ✅ Project AI Test Conftest: **CORRECTLY** uses `DATABASE_URL_TUTORIAL` in actual code

**CRITICAL DEFECT IDENTIFIED**: The failing test `test_env_var_name_is_consistent` asserts the **wrong** variable name. The test expects `TEST_DATABASE_URL_TUTORIAL`, but the codebase canonically uses `DATABASE_URL_TUTORIAL`.

---

## 1. .env.local Configuration (Canonical Source)

### Actual Configuration (Password Redacted)

```bash
DATABASE_URL_TUTORIAL="postgresql://neondb_owner:npg_[REDACTED]@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require"
```

### Key Properties

| Property | Value | Notes |
|----------|-------|-------|
| **Variable Name** | `DATABASE_URL_TUTORIAL` | Canonical across monorepo |
| **Database** | `tutorial_prod` | Production tutorial database |
| **Host** | `ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech` | Neon PostgreSQL (Asia Pacific Southeast 1) |
| **Connection Pool** | Yes (pooler endpoint) | |
| **SSL Mode** | `require` | Secure connections enforced |
| **TEST_DATABASE_URL_TUTORIAL** | **NOT PRESENT** | Does not exist in .env.local |

**VERIFICATION**: `TEST_DATABASE_URL_TUTORIAL` does **NOT** exist in the environment configuration.

---

## 2. TypeScript/JavaScript Database Configuration

### Package: `@quiz/db-tutorial`

**Location**: `packages/db-tutorial/`

#### Drizzle Configuration (`drizzle.config.ts`)

```typescript
export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL_TUTORIAL ?? process.env.DATABASE_URL_TUTORIAL ?? '',
  },
});
```

**Hierarchy**:
1. `DATABASE_DIRECT_URL_TUTORIAL` (direct connection, bypasses pooler)
2. `DATABASE_URL_TUTORIAL` (pooled connection)
3. Empty string (throws error if neither present)

#### Database Client Factory (`src/db.ts`)

```typescript
const databaseUrl =
  type === 'direct'
    ? process.env.DATABASE_DIRECT_URL_TUTORIAL
    : process.env.DATABASE_URL_TUTORIAL;

// For integration tests: if DATABASE_URL_TUTORIAL is set, use real database even in test mode
if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  if (process.env.NODE_ENV === 'test') {
    return createTestDb();
  }
  throw new Error(
    type === 'direct'
      ? 'DATABASE_DIRECT_URL_TUTORIAL environment variable is required'
      : 'DATABASE_URL_TUTORIAL environment variable is required'
  );
}

// DATABASE_URL_TUTORIAL is set, use real database (even in test mode for integration tests)
```

**Design Pattern**: 
- Production/Development: `DATABASE_URL_TUTORIAL` required
- Test Mode: Falls back to test stub **only if** `DATABASE_URL_TUTORIAL` is undefined
- Integration Tests: Uses `DATABASE_URL_TUTORIAL` even in test mode

**VERIFICATION**: TypeScript codebase **NEVER** references `TEST_DATABASE_URL_TUTORIAL`.

---

## 3. Tutorial Database Schema

### Tables in `tutorial_prod` Database

**Schema Files**: `packages/db-tutorial/src/schema/`

#### Relevant Tables

1. **`tutorial_page_content_v2`** (`tutorial-page-content-v2.ts`)
   - Used by: SHC-admin Tutorial Page Content Builder
   - Primary Key: `id` (uuid)
   - Scope: `brandId`, `domainId`, `subjectId`, `topicId`, `subtopicId`
   - Content: `contentType`, `payload`, `sourceFormat`, `sourceContent`
   
2. **`project_ai_workflows`** (`project-ai-persistence.ts`)
   - Used by: Project AI workflow engine
   - Primary Key: `workflow_id` (uuid)
   - Foreign Keys: All use uuid type
   
3. **`project_ai_contracts`** (`project-ai-persistence.ts`)
   - Primary Key: `contract_id` (uuid)
   - Foreign Key: `workflow_id` (uuid)
   
4. **`project_ai_candidates`** (`project-ai-persistence.ts`)
   - Primary Key: `candidate_id` (uuid)
   - Foreign Key: `workflow_id` (uuid)
   
5. **`project_ai_manifests`** (`project-ai-persistence.ts`)
   - Primary Key: `manifest_id` (uuid)
   - Foreign Key: `candidate_id` (uuid)
   
6. **`project_ai_approvals`** (`project-ai-persistence.ts`)
   - Primary Key: `approval_id` (uuid)
   - Foreign Keys: `workflow_id`, `placement_manifest_id` (both uuid)

**VERIFICATION**: All project_ai_* tables use `uuid` type for identifier columns (confirmed by Drizzle schema).

---

## 4. SHC-admin Usage Pattern

### Tutorial Page Content Builder

**Location**: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/`

**Database Integration**:
- SHC-admin **does NOT directly reference** `DATABASE_URL_TUTORIAL` in its TypeScript code
- SHC-admin imports `@quiz/db-tutorial` package
- `@quiz/db-tutorial` package loads `DATABASE_URL_TUTORIAL` transparently
- Tutorial Page Content Builder interacts with `tutorial_page_content_v2` table via Drizzle ORM

**Code Evidence**:
- ✅ TypeScript type imports: `TutorialPageContentType`, `TutorialSidebarBrandId`
- ✅ No direct environment variable access in SHC-admin
- ✅ Database abstraction via shared package

**Pattern**: SHC-admin follows **package-mediated database access** pattern, not direct environment variable access.

---

## 5. Project AI Configuration

### Application Code (`app/persistence/database.py`)

```python
def get_database_url() -> str:
    """
    Get database URL from environment.
    
    Uses DATABASE_URL_TUTORIAL to match TypeScript convention.
    
    Returns:
        str: PostgreSQL connection URL
        
    Raises:
        ValueError: If DATABASE_URL_TUTORIAL not set
    """
    database_url = os.environ.get("DATABASE_URL_TUTORIAL")
    
    if not database_url:
        raise ValueError(
            "DATABASE_URL_TUTORIAL environment variable not set. "
            "Expected format: postgresql://user:pass@host:port/tutorial_prod"
        )
```

**Status**: ✅ **CORRECT** — Uses `DATABASE_URL_TUTORIAL` as documented.

### Integration Test Configuration (`tests/integration/conftest.py`)

**ACTUAL CODE** (Lines 32-41):

```python
# Check for test database configuration
TEST_DB_URL = os.environ.get("DATABASE_URL_TUTORIAL")

# Pytest collection hook to skip entire module if database not configured
def pytest_collection_modifyitems(config, items):
    """Skip all integration tests if DATABASE_URL_TUTORIAL not configured."""
    if not TEST_DB_URL:
        skip_marker = pytest.mark.skip(
            reason="DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
        )
```

**Status**: ✅ **CORRECT** — Actually uses `DATABASE_URL_TUTORIAL` in code.

**MISLEADING DOCUMENTATION** (Lines 5-11):

```python
CRITICAL: These tests require a real PostgreSQL database.
The test database MUST be configured via DATABASE_URL_TUTORIAL environment variable.
...
If DATABASE_URL_TUTORIAL is not configured, tests will skip with a clear error message.
```

**Status**: ✅ **CORRECT** — Documentation correctly states `DATABASE_URL_TUTORIAL`.

### Test File Documentation Comments

**INCORRECT DOCUMENTATION** found in:
- `tests/integration/test_implementation_approval.py:10`
- `tests/integration/test_final_gate.py:11`
- `tests/integration/test_security_integration.py:7`

Example:
```python
"""
Requires PostgreSQL configured via TEST_DATABASE_URL_TUTORIAL environment variable.
"""
```

**Status**: ❌ **INCORRECT** — Documentation comments reference `TEST_DATABASE_URL_TUTORIAL` (wrong), but actual code uses `DATABASE_URL_TUTORIAL` (correct).

---

## 6. Failing Test Analysis

### Test: `test_env_var_name_is_consistent`

**File**: `tests/integration/test_conftest_skip_behavior.py` (Lines 128-143)

```python
def test_env_var_name_is_consistent():
    """
    Test that the environment variable name is consistent across conftest.
    """
    # The environment variable name should be TEST_DATABASE_URL_TUTORIAL
    # This matches the convention from FEAT-000 discovery
    expected_env_var = "TEST_DATABASE_URL_TUTORIAL"
    
    # Import conftest to verify it uses the correct variable
    import tests.integration.conftest as conftest
    import inspect
    
    # Check that conftest.py source contains the expected variable name
    source = inspect.getsource(conftest)
    
    assert expected_env_var in source, "conftest should use TEST_DATABASE_URL_TUTORIAL"
```

**Status**: ❌ **TEST DEFECT** — This test asserts the **wrong** expectation.

**Actual Behavior**:
- `conftest.py` source contains: `os.environ.get("DATABASE_URL_TUTORIAL")`
- Test expects: `"TEST_DATABASE_URL_TUTORIAL"` in source
- Result: **Assertion fails** (correctly, because the test is wrong)

**Root Cause**: The test comment claims "This matches the convention from FEAT-000 discovery", but FEAT-000 discovery established `DATABASE_URL_TUTORIAL` as the canonical variable, not `TEST_DATABASE_URL_TUTORIAL`.

---

## 7. Deviation Summary

| Component | Expected Variable | Actual Variable | Status |
|-----------|------------------|-----------------|--------|
| **.env.local** | `DATABASE_URL_TUTORIAL` | `DATABASE_URL_TUTORIAL` | ✅ CORRECT |
| **TypeScript (@quiz/db-tutorial)** | `DATABASE_URL_TUTORIAL` | `DATABASE_URL_TUTORIAL` | ✅ CORRECT |
| **SHC-admin** | `DATABASE_URL_TUTORIAL` (via package) | `DATABASE_URL_TUTORIAL` (via package) | ✅ CORRECT |
| **Project AI Application** | `DATABASE_URL_TUTORIAL` | `DATABASE_URL_TUTORIAL` | ✅ CORRECT |
| **Project AI Integration Conftest Code** | `DATABASE_URL_TUTORIAL` | `DATABASE_URL_TUTORIAL` | ✅ CORRECT |
| **Project AI Integration Test Docstrings** | `DATABASE_URL_TUTORIAL` | `TEST_DATABASE_URL_TUTORIAL` | ❌ **INCORRECT** |
| **test_env_var_name_is_consistent** | `DATABASE_URL_TUTORIAL` | Asserts `TEST_DATABASE_URL_TUTORIAL` | ❌ **TEST DEFECT** |

**Total Deviations**: 2 (both in test code, not production code)

---

## 8. Canonical Convention

### Official Convention (Monorepo-Wide)

**Environment Variable**: `DATABASE_URL_TUTORIAL`

**Usage Pattern**:
1. Set in `.env.local` at repository root
2. Loaded by Next.js/Turbo for all workspace packages
3. TypeScript: `process.env.DATABASE_URL_TUTORIAL`
4. Python: `os.environ.get("DATABASE_URL_TUTORIAL")`
5. Database: `tutorial_prod` on Neon PostgreSQL
6. Tables: `tutorial_page_content_v2`, `project_ai_*`

**Test Convention**:
- **NO separate test database URL variable**
- Integration tests use the **same** `DATABASE_URL_TUTORIAL` as production
- Test isolation achieved via transaction rollback in `conftest.py`
- If `DATABASE_URL_TUTORIAL` not set, tests skip (do not fail)

---

## 9. Required Corrections

### High Priority (Test Failures)

1. **Fix `test_env_var_name_is_consistent`**
   - Location: `tests/integration/test_conftest_skip_behavior.py:132`
   - Change: `expected_env_var = "TEST_DATABASE_URL_TUTORIAL"` → `expected_env_var = "DATABASE_URL_TUTORIAL"`
   - Impact: Fixes 1 failing test

2. **Update Test Docstrings**
   - Files:
     - `tests/integration/test_implementation_approval.py:10`
     - `tests/integration/test_final_gate.py:11`
     - `tests/integration/test_security_integration.py:7`
   - Change: `TEST_DATABASE_URL_TUTORIAL` → `DATABASE_URL_TUTORIAL`
   - Impact: Documentation accuracy (does not affect test execution)

### Low Priority (Consistency)

3. **Update Test Module Mocks**
   - Location: `tests/integration/test_conftest_skip_behavior.py:40, 82`
   - Change: Mock dictionary keys from `TEST_DATABASE_URL_TUTORIAL` → `DATABASE_URL_TUTORIAL`
   - Impact: Test fixture consistency

---

## 10. Compliance Matrix

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Use DATABASE_URL_TUTORIAL (not TEST_DATABASE_URL_TUTORIAL)** | ✅ MET | `.env.local`, `conftest.py:32`, `database.py:37` |
| **Follow SHC-admin convention** | ✅ MET | SHC-admin uses `@quiz/db-tutorial` which loads `DATABASE_URL_TUTORIAL` |
| **Connect to tutorial_prod database** | ✅ MET | Connection string verified: `/tutorial_prod` |
| **Use Neon PostgreSQL** | ✅ MET | Host: `ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech` |
| **Access project_ai_* tables** | ✅ MET | Schema defined in `project-ai-persistence.ts` |
| **Document variable correctly in tests** | ❌ **NOT MET** | 3 test docstrings reference wrong variable |
| **Test assertions use correct variable** | ❌ **NOT MET** | `test_env_var_name_is_consistent` asserts wrong variable |

---

## 11. Integration Test Behavior

### Current Behavior (CORRECT)

```python
# conftest.py line 32
TEST_DB_URL = os.environ.get("DATABASE_URL_TUTORIAL")

# conftest.py line 36
def pytest_collection_modifyitems(config, items):
    """Skip all integration tests if DATABASE_URL_TUTORIAL not configured."""
    if not TEST_DB_URL:
        skip_marker = pytest.mark.skip(
            reason="DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
        )
```

**Result**: If `DATABASE_URL_TUTORIAL` is set, integration tests run. If not set, tests skip gracefully.

### TypeScript Parallel Behavior (CORRECT)

```typescript
// packages/db-tutorial/src/db.ts
if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  if (process.env.NODE_ENV === 'test') {
    return createTestDb(); // Returns mock/stub for unit tests
  }
  throw new Error('DATABASE_URL_TUTORIAL environment variable is required');
}
```

**Result**: TypeScript unit tests use stub, integration tests use real database via `DATABASE_URL_TUTORIAL`.

**VERIFICATION**: Python and TypeScript test strategies are **aligned**.

---

## 12. Conclusion

### Canonical Variable Confirmed

✅ **`DATABASE_URL_TUTORIAL`** is the canonical environment variable.

### SHC-admin Convention Confirmed

✅ SHC-admin loads `DATABASE_URL_TUTORIAL` via `@quiz/db-tutorial` package.  
✅ Project AI application code already follows this convention.  
✅ Project AI integration test conftest already follows this convention.

### Defects Identified

❌ `test_env_var_name_is_consistent` asserts the wrong variable name (test defect, not application defect).  
❌ 3 test file docstrings document the wrong variable name (documentation defect, not runtime defect).

### Compliance Status

**Project AI Compliance**: ✅ **COMPLIANT** (application code is correct)  
**Test Compliance**: ❌ **NON-COMPLIANT** (1 test assertion + 3 docstrings incorrect)

### Remediation Priority

1. **IMMEDIATE**: Fix `test_env_var_name_is_consistent` assertion (blocks integration tests)
2. **FOLLOW-UP**: Update test docstrings for documentation accuracy

---

## 13. Next Steps

**Approved to proceed with Phase 3 remediation**:
1. ✅ DATABASE_URL_TUTORIAL convention verified and documented
2. ✅ SHC-admin pattern confirmed (package-mediated access)
3. ✅ Project AI application code confirmed compliant
4. ⏭️ Proceed with UUID persistence fix (no DATABASE_URL_TUTORIAL changes required)
5. ⏭️ Fix `test_env_var_name_is_consistent` as part of ENV_VAR failure remediation

**No changes to DATABASE_URL_TUTORIAL configuration required.**

---

**Report Generated**: 2025-02-01  
**Verification Method**: Source inspection + environment configuration audit  
**Compliance**: DATABASE_URL_TUTORIAL is canonical across monorepo

