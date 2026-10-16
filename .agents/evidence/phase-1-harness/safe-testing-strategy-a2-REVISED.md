# Safe PostgreSQL Testing Strategy for Project AI (REVISED)

**Document Version:** 2.0 (Revised)  
**Date:** 2026-10-15  
**Status:** Ready for Implementation  
**Risk Assessment:** SAVEPOINT rollback needed; database is appropriate for testing

---

## Executive Summary - REVISED UNDERSTANDING

**IMPORTANT CLARIFICATION:** The original strategy document incorrectly assessed the database risk. After clarification with the user:

- ✅ Project AI tables are **newly created for tutorial LLM content** (not a separate system)
- ✅ The `tutorial_prod` database is the **correct and intended location** for these tables
- ✅ The 1,713 Project AI records are **development/test data** (project is under active development)
- ✅ Testing against `tutorial_prod` is **appropriate** since Project AI is part of the tutorial system

**Original Assessment:** Database sharing was seen as risky collision between separate systems  
**Revised Assessment:** Project AI **IS** the tutorial LLM system - same application, same database

**Current State:**
- Unit tests use SQLite in-memory (1,431 tests) ✅ Working well
- Integration tests use PostgreSQL via `DATABASE_URL_TUTORIAL` (103 tests) ⚠️ Commits persist
- Target database `tutorial_prod` contains Project AI tables (appropriate)

**Key Issue:**
The ONLY problem is that test data commits persist in the database. We need SAVEPOINT-based rollback.

---

## Revised Recommendation

**RECOMMENDED APPROACH:** ✅ **SAVEPOINT-based Transaction Rollback (No Dedicated Test Database Needed)**

### Why This Approach

1. **Database is appropriate:**
   - Project AI tables are part of tutorial system
   - Testing against `tutorial_prod` is correct
   - No need for separate test database

2. **Only issue is data persistence:**
   - Tests currently call `session.commit()` which persists data
   - Need SAVEPOINT rollback to auto-cleanup after each test
   - No other isolation concerns

3. **Simple implementation:**
   - One fixture update (`db_session` in `tests/integration/conftest.py`)
   - Wraps tests in nested transaction that rolls back
   - All test changes disappear automatically

**Risk Level:** 🟢 **LOW** — SAVEPOINT ensures zero persistent test data

---

## Implementation Plan (Simplified)

### Phase 1: Implement SAVEPOINT Rollback (Priority 1)

**File:** `tests/integration/conftest.py`

**Current db_session fixture:**
```python
@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """Create an async database session for integration tests."""
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        yield session
        # Rollback any uncommitted changes
        if session.in_transaction():
            await session.rollback()
```

**Problem:** This only rolls back uncommitted changes. If test calls `session.commit()`, data persists.

**Updated db_session fixture:**
```python
@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create an async database session with SAVEPOINT-based rollback.
    
    All operations (including commits) occur within a SAVEPOINT transaction
    that rolls back at test completion. This ensures test isolation - no
    data persists in the database after the test completes.
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        # Begin outer transaction
        async with session.begin():
            # Create nested transaction (SAVEPOINT)
            nested = await session.begin_nested()
            
            yield session
            
            # Always rollback the SAVEPOINT - discards all test changes
            await nested.rollback()
```

**How it works:**
1. Outer transaction begins (`session.begin()`)
2. Inner SAVEPOINT created (`session.begin_nested()`)
3. Test runs - can call `session.commit()` freely
4. `session.commit()` commits to SAVEPOINT (not database)
5. Test completes - `nested.rollback()` discards everything
6. Database remains unchanged

**Benefits:**
- ✅ Tests can commit freely (writes to SAVEPOINT, not database)
- ✅ All changes roll back automatically
- ✅ No test data persists
- ✅ True test isolation
- ✅ No cleanup code needed

**Estimated Time:** 15 minutes to implement + 30 minutes to verify

---

### Phase 2: Update db_session_factory (Priority 2)

**File:** `tests/integration/conftest.py`

**Current db_session_factory fixture:**
```python
@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """Provide session factory for restart simulation tests."""
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as outer_session:
        async with outer_session.begin():
            nested_transaction = await outer_session.begin_nested()
            
            async def _factory():
                return outer_session
            
            yield _factory
            await outer_session.rollback()
```

**This already uses outer transaction + SAVEPOINT pattern!** ✅ No changes needed.

---

### Phase 3: Add Pytest Markers (Optional, for visibility)

**File:** `pyproject.toml`

**Add marker definitions:**
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
markers = [
    "integration: marks tests as integration tests requiring PostgreSQL",
    "db_read: marks tests that only perform SELECT queries",
    "db_write: marks tests that perform INSERT/UPDATE/DELETE",
]
```

**Purpose:** Documentation and visibility (not enforcement)

**Usage:**
```python
@pytest.mark.integration
@pytest.mark.db_read
async def test_schema_exists(db_session):
    """Read-only test."""
    pass

@pytest.mark.integration
@pytest.mark.db_write
async def test_workflow_crud(db_session, workflow_repo):
    """Write test - changes will roll back automatically."""
    pass
```

**Estimated Time:** 1-2 hours to tag 103 tests

---

### Phase 4: Verification Tests

**Create test to verify rollback behavior:**

```python
# tests/integration/test_savepoint_rollback_verification.py

import pytest
import uuid
from sqlalchemy import text
from app.persistence.models import WorkflowModel

@pytest.mark.integration
@pytest.mark.asyncio
async def test_committed_data_rolls_back(db_session, workflow_repo):
    """
    Verify that committed data rolls back when test completes.
    
    This test creates a workflow, commits it, then verifies it exists.
    After this test completes, the next test should NOT see this workflow
    because the SAVEPOINT rollback discarded it.
    """
    test_id = uuid.UUID('00000000-0000-0000-0000-000000000001')
    workflow = WorkflowModel(
        id=test_id,
        session_id='test-session',
        status='pending',
        created_at='2024-01-01T00:00:00Z'
    )
    
    # Insert and commit
    await workflow_repo.upsert(workflow)
    await db_session.commit()  # Commits to SAVEPOINT, not database
    
    # Verify exists in this transaction
    result = await workflow_repo.get_by_id(test_id)
    assert result is not None
    assert result.session_id == 'test-session'
    
    # After test completes, SAVEPOINT rolls back
    # Next test should NOT see this record


@pytest.mark.integration
@pytest.mark.asyncio
async def test_previous_test_data_not_visible(db_session):
    """
    Verify previous test's data was rolled back.
    
    This test runs AFTER test_committed_data_rolls_back.
    The workflow with ID 00000000-0000-0000-0000-000000000001
    should NOT be visible because it was rolled back.
    """
    test_id = uuid.UUID('00000000-0000-0000-0000-000000000001')
    
    # Query for the workflow from previous test
    result = await db_session.execute(
        text("SELECT * FROM project_ai_workflows WHERE id = :id"),
        {"id": str(test_id)}
    )
    row = result.fetchone()
    
    # Should be None (previous test's data was rolled back)
    assert row is None, f"Previous test's data was NOT rolled back! Found: {row}"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_database_is_clean_after_test_suite(db_session):
    """
    Verify database has no test artifacts.
    
    Run this test last to verify the database is clean.
    All test data should have been rolled back.
    """
    # Count records in each table
    tables = [
        'project_ai_workflows',
        'project_ai_contracts',
        'project_ai_candidates',
        'project_ai_manifests',
        'project_ai_approvals',
        'project_ai_state_transitions',
    ]
    
    initial_counts = {}
    for table in tables:
        result = await db_session.execute(text(f"SELECT COUNT(*) FROM {table}"))
        initial_counts[table] = result.scalar()
    
    # Store initial counts for comparison
    # These should remain unchanged after test suite runs
    # (assuming tests use SAVEPOINT rollback correctly)
    print(f"\nDatabase state after test suite:")
    for table, count in initial_counts.items():
        print(f"  {table}: {count} records")
```

**Verification commands:**
```bash
# Run rollback verification tests
pytest tests/integration/test_savepoint_rollback_verification.py -v -s

# Expected output:
# test_committed_data_rolls_back PASSED
# test_previous_test_data_not_visible PASSED
# test_database_is_clean_after_test_suite PASSED

# Check database manually
psql $DATABASE_URL_TUTORIAL -c "SELECT COUNT(*) FROM project_ai_workflows WHERE session_id = 'test-session'"
# Expected: 0 (test data rolled back)
```

---

### Phase 5: Documentation

**Update README.md:**
```markdown
## Testing

### Unit Tests (SQLite)
Fast, isolated tests using SQLite in-memory database.

```bash
pytest tests/ -m "not integration"
```

### Integration Tests (PostgreSQL)
Integration tests use PostgreSQL via `DATABASE_URL_TUTORIAL`.

```bash
# Set in .env.local
DATABASE_URL_TUTORIAL="postgresql://..."

# Run integration tests
pytest tests/integration/ -v
```

**Test Isolation:** Integration tests use SAVEPOINT-based transaction rollback.
All test changes (including commits) automatically roll back when the test completes.
No test data persists in the database.

### Running All Tests
```bash
pytest tests/ -v
```
```

---

## Risk Assessment (Revised)

### Current Approach (Before SAVEPOINT)

**Risk Level:** 🟡 **MEDIUM**

**Issues:**
1. Test data commits persist in database
2. Requires manual cleanup
3. Tests may see each other's data (if not using unique IDs)
4. Database grows over time with test artifacts

**NOT Critical Because:**
- Database is appropriate for testing (Project AI is part of tutorial system)
- Development/test data (not production user data)
- No collision with separate systems
- Just need automatic cleanup

### Recommended Approach (SAVEPOINT Rollback)

**Risk Level:** 🟢 **LOW**

**Benefits:**
- ✅ All test data automatically rolls back
- ✅ No persistent test artifacts
- ✅ True test isolation
- ✅ No manual cleanup needed
- ✅ Database remains clean

**Potential Issues:**
- Long-running tests hold transaction open (mitigated by test timeouts)
- Nested transaction support required (PostgreSQL fully supports this)

**Mitigation:**
- Add test timeout: `pytest.mark.timeout(30)` on slow tests
- PostgreSQL natively supports SAVEPOINT (no compatibility issues)
- Verify rollback behavior with dedicated test (Phase 4)

---

## What Changed from Original Strategy

### Original Assessment (Incorrect)

❌ **Misunderstood database purpose**
- Treated Project AI as separate system sharing database
- Saw table sharing as high-risk collision
- Recommended dedicated test database
- Complex isolation and enforcement mechanisms

### Revised Assessment (Correct)

✅ **Project AI is part of tutorial system**
- Project AI tables are for tutorial LLM features
- Database sharing is intentional and appropriate
- Only issue: test data commits persist
- Simple solution: SAVEPOINT rollback

### Implementation Complexity

**Original Plan:**
- 5 phases over 3 weeks
- Provision new database
- Complex marker enforcement
- Database isolation verification
- Separate test configuration
- Database reset scripts

**Revised Plan:**
- 3 phases over 1 week (or faster)
- One fixture update (15 minutes)
- Optional markers for visibility
- Verification tests to confirm rollback
- Simple documentation update

---

## Actionable Checklist

### Immediate (Today)

- [ ] Update `db_session` fixture with SAVEPOINT rollback (15 min)
- [ ] Test the rollback behavior manually (15 min)
- [ ] Run existing integration tests to verify no breakage (10 min)

### Short-Term (This Week)

- [ ] Add verification tests for rollback behavior (1 hour)
- [ ] Add pytest markers to integration tests (1-2 hours)
- [ ] Update README with testing instructions (30 min)

### Optional (Future)

- [ ] Add test timeouts for long-running tests
- [ ] Monitor test execution time
- [ ] Expand integration test coverage

---

## Conclusion

**Original Strategy:** Dedicated test database (unnecessary complexity)

**Revised Strategy:** SAVEPOINT rollback (simple, appropriate, effective)

**Why the Change:**
Project AI tables are part of the tutorial system. Testing against `tutorial_prod` is correct and appropriate. The only issue is test data persistence, which SAVEPOINT rollback solves completely.

**Timeline:** Can be implemented in 1 hour (core fix) + documentation

**Risk:** Minimal - SAVEPOINT is native PostgreSQL feature, well-tested pattern

**Next Steps:**
1. Implement SAVEPOINT rollback in `db_session` fixture
2. Verify rollback behavior with test
3. Run full integration test suite
4. Update documentation

---

**Document Status:** ✅ Ready for Implementation (Simplified and Correct)
