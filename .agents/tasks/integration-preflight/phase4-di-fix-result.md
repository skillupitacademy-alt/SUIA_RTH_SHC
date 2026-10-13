# Phase 4: WorkflowGovernanceService DI Fix Result

## What Was Broken

The `WorkflowGovernanceService` constructor requires 4 arguments:
- `workflow_repo`: WorkflowRepository
- `approval_repo`: ApprovalRepository  
- `state_transition_repo`: StateTransitionRepository
- `session`: AsyncSession

However, the test file `test_w2_contract_generation.py` had a `governance_service` fixture that was instantiating it with **zero arguments**:

```python
@pytest.fixture
def governance_service():
    """Fixture for governance service."""
    return WorkflowGovernanceService()  # ❌ Missing all 4 required args
```

This caused immediate DI (Dependency Injection) errors when the fixture tried to instantiate the service.

## What Was Changed

### 1. Fixed the `governance_service` fixture (test_w2_contract_generation.py)

**Changed from:**
```python
@pytest.fixture
def governance_service():
    """Fixture for governance service."""
    return WorkflowGovernanceService()
```

**Changed to:**
```python
@pytest_asyncio.fixture
async def governance_service(workflow_repo, approval_repo, state_transition_repo, db_session):
    """Fixture for governance service."""
    return WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
```

### 2. Updated fixture to be async
- Changed decorator from `@pytest.fixture` to `@pytest_asyncio.fixture`
- Made fixture function async (`async def`)
- Added dependency injection of the 4 required fixtures

### 3. Added pytest_asyncio import
```python
import pytest_asyncio
```

### 4. Fixed dependent fixtures
Updated `test_workflow` fixture to be async and await the async `create_workflow()` call:

**Changed from:**
```python
@pytest.fixture
def test_workflow(governance_service):
    workflow = governance_service.create_workflow(...)
    return workflow
```

**Changed to:**
```python
@pytest_asyncio.fixture
async def test_workflow(governance_service):
    workflow = await governance_service.create_workflow(...)
    return workflow
```

### 5. Fixed test method calls
Updated 3 test methods to await async calls to `governance_service.create_workflow()`:
- `test_contract_fails_if_target_family_empty`
- `test_same_inputs_produce_same_hash`  
- `test_contract_generation_fails_without_evidence`

## Commit SHA

**Commit:** `b441d2ba`

## Test Output Summary

**Result:** 2 failed, 8 errors in 36.61s

**DI Error Status:** ✅ **RESOLVED** - The constructor argument DI errors are fixed.

**New Error Discovered:** ❌ **Database Schema Mismatch**

All 10 tests now fail with a **different error** (not DI-related):

```
psycopg.errors.InvalidTextRepresentation: invalid input syntax for type uuid: "I1"
CONTEXT: unnamed portal parameter $2 = '...'
```

### Root Cause of New Error

The `project_ai_workflows` table has `specification_id` column defined as `UUID` type, but the `WorkflowGovernanceService.create_workflow()` method is setting it to `target_version` (e.g., "I1"), which is a **string**, not a UUID.

**Location:** `app/orchestration/workflow_governance.py:228`
```python
# Specification ID is the target version (e.g., "I7", "C3")
specification_id = target_version  # ❌ Setting string to UUID field
```

**Database Schema:** `app/persistence/models.py:57`
```python
specification_id = Column(UUID(as_uuid=True), nullable=False)  # Expects UUID
```

### Test Error Breakdown
- **8 errors:** Tests failed during setup (test_workflow fixture) due to UUID mismatch
- **2 failed:** Tests that create workflows inline also hit the UUID mismatch error

### Next Steps Required

The DI fix is complete, but to make tests pass, one of these must be done:

1. **Change database schema:** Alter `specification_id` column from UUID to VARCHAR in database migration
2. **Change application code:** Generate a UUID for `specification_id` instead of using `target_version` string
3. **Change domain model:** Map string `specification_id` to UUID in `_domain_to_workflow_model()` converter

This is a **database schema vs. code contract mismatch** that requires a product decision on what `specification_id` should represent.

## Conclusion

✅ **Task Objective Met:** The WorkflowGovernanceService DI constructor argument issue is **completely resolved**.

⚠️ **Tests Still Failing:** Due to an **unrelated database schema issue** that was hidden behind the DI errors.

The DI fix reveals that there are ~10 tests affected by the UUID/string type mismatch in the `specification_id` field.
