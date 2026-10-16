# Package A2 Fix — Implementation Plan

## Context

This plan addresses three critical review findings in the Package A2 integration test fixtures:

1. **CRITICAL**: `db_session_factory` returns the same session on every call, breaking the restart-simulation contract
2. **HIGH**: `_verify_database_environment` uses fragile string splitting instead of URL parsing
3. **MEDIUM**: External rollback verification should be automated within the test itself

The plan is grounded in actual code from:
- `services/project-ai/tests/integration/conftest.py`
- `services/project-ai/tests/integration/test_transaction_rollback.py`
- `services/project-ai/app/persistence/models.py`

**Build system**: Python 3.11+ with pytest and pytest-asyncio  
**Test command**: `pytest tests/integration/ -v`  
**Key constraint**: The `db_session` fixture must NOT be modified — it already has the correct design.

---

## Required WorkflowModel Fields

From `app/persistence/models.py`, a minimal valid `WorkflowModel` requires:

```python
WorkflowModel(
    workflow_id=uuid.uuid4(),           # UUID (auto-generated if omitted)
    specification_id=uuid.uuid4(),      # UUID, required
    target_family="string",              # String(100), required
    target_version="string",             # String(100), required
    requester_id="string",               # String(255), required
    current_state="REQUESTED",           # String(100), required (use CanonicalWorkflowState enum)
    created_at=datetime.now(timezone.utc),   # DateTime(timezone=True), has default
    updated_at=datetime.now(timezone.utc),   # DateTime(timezone=True), has default
)
```

All other fields are nullable or have defaults.

---

## Implementation Steps

### Step 1: Fix `_verify_database_environment` to use URL parsing

**What to do**: Replace string splitting with `urllib.parse.urlparse`. Add a docstring explaining what the guard checks (database name, allow-list) and what it does NOT check (role privileges, write access).

**Files**: `services/project-ai/tests/integration/conftest.py`

**Changes**:

```python
# BEFORE (line ~40):
def _verify_database_environment(db_url: str) -> None:
    """
    Log database identity and guard against accidental wrong-DB runs.

    tutorial_prod is approved for development testing (user-confirmed).
    This check catches accidental misconfiguration, not production data.
    """
    db_name = db_url.split("/")[-1].split("?")[0]
    at_idx = db_url.find("@")
    slash_after_host = db_url.find("/", at_idx + 1) if at_idx >= 0 else -1
    host = db_url[at_idx + 1 : slash_after_host] if at_idx >= 0 and slash_after_host > 0 else "unknown"
    print(f"[integration] Targeting database '{db_name}' on host '{host}'")
    allowed = {"tutorial_prod", "project_ai_test", "tutorial_test"}
    if db_name not in allowed:
        pytest.fail(
            f"Unexpected database name '{db_name}'. "
            f"Allowed: {', '.join(sorted(allowed))}. "
            "Set DATABASE_URL_TUTORIAL to an approved database."
        )

# AFTER:
from urllib.parse import urlparse

def _verify_database_environment(db_url: str) -> None:
    """
    Parse the database URL and verify the database name against an allow-list.

    WHAT THIS CHECKS:
    - Database name is one of: tutorial_prod, project_ai_test, tutorial_test
    - Basic URL structure is valid (can be parsed)

    WHAT THIS DOES NOT CHECK:
    - The actual connected database identity (checked in integration_db_engine)
    - Role privileges or table permissions
    - Whether the database has the required schema

    This is a misconfiguration guard, not a security enforcement layer.
    """
    try:
        parsed = urlparse(db_url)
        # Extract database name from path (remove leading slash)
        db_name = parsed.path.lstrip("/").split("?")[0] if parsed.path else "unknown"
        host = parsed.hostname or "unknown"
    except Exception as e:
        pytest.fail(f"Failed to parse DATABASE_URL_TUTORIAL: {e}")

    print(f"[integration] Targeting database '{db_name}' on host '{host}'")
    
    allowed = {"tutorial_prod", "project_ai_test", "tutorial_test"}
    if db_name not in allowed:
        pytest.fail(
            f"Unexpected database name '{db_name}'. "
            f"Allowed: {', '.join(sorted(allowed))}. "
            "Set DATABASE_URL_TUTORIAL to an approved database."
        )
```

**Verify**: Run `pytest tests/integration/test_transaction_rollback.py -v -s` — should print the database name and pass the allow-list check.

---

### Step 2: Add actual connected database identity check in `integration_db_engine`

**What to do**: After the engine is created and connectivity is verified, query `SELECT current_database(), current_user` via a real connection. Compare the actual connected database name against the expected name from the URL. Log the identity (host, db name, user) without printing credentials. Fail if the actual database differs from expected.

**Files**: `services/project-ai/tests/integration/conftest.py`

**Changes**:

Add this after the table existence check (around line 120):

```python
# AFTER the table existence check, ADD:
        # Verify actual connected database identity
        result = await conn.execute(text("SELECT current_database(), current_user"))
        actual_db, actual_user = result.fetchone()
        
        # Compare actual vs. expected database name
        parsed = urlparse(db_url_raw)
        expected_db = parsed.path.lstrip("/").split("?")[0] if parsed.path else "unknown"
        
        print(f"[integration] Connected to database '{actual_db}' as user '{actual_user}'")
        
        if actual_db != expected_db:
            await engine.dispose()
            pytest.fail(
                f"Database identity mismatch: expected '{expected_db}', connected to '{actual_db}'. "
                "Check DATABASE_URL_TUTORIAL configuration."
            )
```

**Import additions needed**:
```python
from urllib.parse import urlparse  # Already added in Step 1
```

**Verify**: Run `pytest tests/integration/test_transaction_rollback.py -v -s` — should print the actual database name and user, and pass if they match.

---

### Step 3: Refactor `db_session_factory` to create distinct sessions on one outer connection transaction

**What to do**: Replace the current implementation that returns the same `outer_session` on every call. The new design:
1. Open one explicit `engine.connect()` connection per test
2. Start one outer transaction on that connection with `connection.begin()`
3. Create an `async_sessionmaker` bound to that connection with `join_transaction_mode="create_savepoint"`
4. The `_factory()` callable creates and returns a NEW `AsyncSession` from that factory on each call
5. Callers close sessions themselves (sessions can call `commit()`, which issues SAVEPOINT/RELEASE)
6. At fixture teardown, roll back the outer connection transaction — discards all writes

**Files**: `services/project-ai/tests/integration/conftest.py`

**Changes**:

```python
# BEFORE (starting around line 145):
@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """
    Provide a session factory for tests that need to simulate restarts.
    
    Returns a callable that creates new sessions, allowing tests to
    close one session and open another to simulate application restart.
    
    TRANSACTION ISOLATION:
    This fixture wraps all restart test operations in an outer transaction
    that automatically rolls back at test completion. Individual sessions
    created by the factory can commit their changes (making them visible
    to subsequent sessions in the same test), but all changes are rolled
    back when the test completes.
    
    Usage pattern:
        async with await db_session_factory() as session1:
            # Session 1 operations
            await session1.commit()  # Makes changes visible to session 2
        
        async with await db_session_factory() as session2:
            # Session 2 sees session 1's committed changes
            # but all changes roll back at test end
    """
    # Create outer transaction for test-level isolation
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    # Start outer transaction
    async with async_session_factory() as outer_session:
        async with outer_session.begin():
            # Create a savepoint for nested transaction support
            nested_transaction = await outer_session.begin_nested()
            
            async def _factory():
                """
                Return the outer session for all restart test operations.
                
                This ensures all operations across multiple "sessions" (restart simulation)
                happen within the same transaction and are rolled back at test end.
                """
                return outer_session
            
            yield _factory
            
            # Rollback outer transaction at test end
            await outer_session.rollback()

# AFTER:
@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """
    Provide a session factory for tests that need to simulate restarts.
    
    Returns a callable that creates NEW sessions on each call, allowing tests
    to close one session and open another to simulate application restart.
    
    TRANSACTION ISOLATION:
    All sessions are bound to a single connection-level transaction that
    rolls back at test completion. Individual sessions created by the factory
    can commit their changes (SAVEPOINT/RELEASE within the outer transaction),
    making them visible to subsequent sessions in the same test. All changes
    are discarded when the outer connection transaction rolls back at test end.
    
    Usage pattern:
        session1 = await db_session_factory()
        # Session 1 operations
        await session1.commit()  # SAVEPOINT/RELEASE (not real COMMIT)
        await session1.close()
        
        session2 = await db_session_factory()
        # Session 2 sees session 1's committed changes
        # but all changes roll back at test end
        await session2.close()
    
    DESIGN NOTES:
    - Each _factory() call creates a DISTINCT AsyncSession object
    - All sessions share one connection and one outer transaction
    - join_transaction_mode="create_savepoint" makes session.commit() safe
    - Callers MUST close sessions themselves (not a context manager)
    """
    # Open one explicit connection per test
    async with integration_db_engine.connect() as connection:
        # Start one outer transaction on that connection
        async with connection.begin() as transaction:
            # Create session factory bound to this connection with SAVEPOINT support
            session_factory = async_sessionmaker(
                bind=connection,
                class_=AsyncSession,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            )
            
            async def _factory():
                """
                Create and return a NEW AsyncSession bound to the outer connection.
                
                Each call creates a distinct session object. The caller is responsible
                for closing the session after use.
                """
                return session_factory()
            
            yield _factory
            
            # Rollback outer connection transaction at test end — discards ALL writes
            await transaction.rollback()
```

**Verify**: Run `pytest tests/integration/test_restart_persistence.py -v` — all 5 restart tests should pass. The tests already verify that sessions are distinct and that rollback works.

---

### Step 4: Add internal rollback verification to `test_transaction_rollback_verification`

**What to do**: After `await db_session.close()`, open a fresh connection from `integration_db_engine` and query `project_ai_workflows` for the `workflow_id`. Assert the row is ABSENT. This makes the test fail automatically if rollback did not work — no external script needed.

**Files**: `services/project-ai/tests/integration/test_transaction_rollback.py`

**Changes**:

```python
# AFTER the existing test (around line 58), ADD before the end of the function:

    # Internal verification: open independent connection and confirm row is ABSENT
    async with integration_db_engine.connect() as independent_conn:
        from sqlalchemy import text
        result = await independent_conn.execute(
            text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
            {"id": str(workflow_id)},
        )
        row = result.fetchone()
        assert row is None, (
            f"ROLLBACK FAILED: workflow_id '{workflow_id}' still exists in database "
            "after fixture teardown. The outer connection transaction was not rolled back."
        )
    
    print(f"\n[INTERNAL VERIFICATION] Confirmed workflow_id '{workflow_id}' is ABSENT — rollback succeeded.")
```

**Import additions needed**:
```python
from sqlalchemy import text  # Add to imports at top of file
```

**Function signature update needed**:
```python
# Change function signature to accept integration_db_engine fixture:
async def test_transaction_rollback_verification(db_session, workflow_repo, integration_db_engine):
```

**Verify**: Run `pytest tests/integration/test_transaction_rollback.py::test_transaction_rollback_verification -v -s` — should print the internal verification success message and pass.

---

### Step 5: Add regression test for restart-simulation rollback

**What to do**: Add a new test `test_restart_simulation_rollback` to `test_transaction_rollback.py`. It must:
1. Call `db_session_factory()` twice, getting two separate session objects (assert they are distinct objects)
2. In session 1: insert a WorkflowModel with a unique `workflow_id`, call `commit()`, close the session
3. In session 2: query for that `workflow_id`, assert it is found (same outer connection transaction), close session 2
4. After the fixture tears down the outer transaction, use an independent connection from `integration_db_engine` to assert the row is ABSENT

**Files**: `services/project-ai/tests/integration/test_transaction_rollback.py`

**Changes**:

Add this new test after the existing test:

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_restart_simulation_rollback(db_session_factory, integration_db_engine, workflow_repo):
    """
    Verify that restart-simulation fixture creates distinct sessions and rolls back all commits.

    Tests the db_session_factory fixture contract:
    1. Each factory() call returns a DISTINCT session object
    2. Session 1 can commit(), and session 2 sees the changes (same outer transaction)
    3. After fixture teardown, the outer connection transaction is rolled back
    4. An independent connection confirms the row is ABSENT

    This is the regression test for the db_session_factory design fix.
    """
    unique_id = str(uuid.uuid4())
    workflow_id = uuid.uuid4()
    
    # Session 1: insert workflow and commit
    session1 = await db_session_factory()
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id=uuid.uuid4(),
        target_family="RestartTest",
        target_version="RT1",
        requester_id=f"test_restart_rollback_{unique_id}",
        current_state=CanonicalWorkflowState.REQUESTED.value,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session1.add(workflow)
    await session1.commit()  # SAVEPOINT/RELEASE (not real COMMIT)
    await session1.close()
    
    # Session 2: query for workflow (should be visible within same outer transaction)
    session2 = await db_session_factory()
    
    # Verify sessions are DISTINCT objects (regression check)
    assert session1 is not session2, (
        "db_session_factory must return DISTINCT session objects on each call"
    )
    
    from sqlalchemy import select
    result = await session2.execute(select(WorkflowModel).where(WorkflowModel.workflow_id == workflow_id))
    found = result.scalar_one_or_none()
    
    assert found is not None, (
        f"Workflow '{workflow_id}' should be visible in session2 "
        "(same outer connection transaction)"
    )
    assert found.workflow_id == workflow_id
    await session2.close()
    
    # After fixture teardown (happens automatically), verify rollback with independent connection
    # NOTE: This check runs AFTER the fixture's outer transaction has rolled back
    async with integration_db_engine.connect() as independent_conn:
        from sqlalchemy import text
        result = await independent_conn.execute(
            text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
            {"id": str(workflow_id)},
        )
        row = result.fetchone()
        assert row is None, (
            f"ROLLBACK FAILED: workflow_id '{workflow_id}' still exists after fixture teardown. "
            "The db_session_factory fixture did not roll back the outer connection transaction."
        )
    
    print(f"\n[RESTART SIMULATION VERIFIED] Two distinct sessions created, changes committed in session1, "
          f"visible in session2, and rolled back after fixture teardown. Workflow '{workflow_id}' is ABSENT.")
```

**Import additions needed**:
```python
from sqlalchemy import select, text  # Add to imports at top of file
```

**Verify**: Run `pytest tests/integration/test_transaction_rollback.py::test_restart_simulation_rollback -v -s` — should print the verification message and pass.

---

## Order of Implementation

1. **Step 1** (conftest.py: fix `_verify_database_environment`) — independent, can be done first
2. **Step 2** (conftest.py: add identity check) — depends on Step 1 (uses `urlparse`)
3. **Step 3** (conftest.py: refactor `db_session_factory`) — CRITICAL, must be done before Step 5
4. **Step 4** (test file: add internal verification) — independent, can be done any time
5. **Step 5** (test file: add regression test) — depends on Step 3 (tests the new factory design)

**Recommended order**: 1 → 2 → 3 → 4 → 5 (dependency order)

---

## What the Coder Must Watch Out For

1. **DO NOT modify `db_session` fixture** — it already has the correct connection-level design. Only fix `db_session_factory`.

2. **Callers must close sessions from `db_session_factory`** — the new design does not use context managers (no `async with`). Callers get a raw session and must call `await session.close()` when done.

3. **The regression test (Step 5) must assert sessions are distinct objects** — use `assert session1 is not session2` to verify the fix worked.

4. **Import `urlparse` at the top of conftest.py** — add `from urllib.parse import urlparse` to the imports section (around line 10).

5. **Import `text` and `select` in test_transaction_rollback.py** — add `from sqlalchemy import select, text` to the imports section (around line 10).

6. **The actual database identity check (Step 2) must handle connection errors gracefully** — if the query fails, dispose the engine and call `pytest.fail()` with a clear message.

7. **Test isolation**: All tests must pass individually and together. Run the full suite after all changes: `pytest tests/integration/test_transaction_rollback.py tests/integration/test_restart_persistence.py -v`

---

## Acceptance Criteria

- [ ] Step 1: `_verify_database_environment` uses `urlparse` and has complete docstring
- [ ] Step 2: `integration_db_engine` queries and verifies actual connected database identity
- [ ] Step 3: `db_session_factory` creates distinct sessions (new `async_sessionmaker` design)
- [ ] Step 4: `test_transaction_rollback_verification` includes internal independent-connection check
- [ ] Step 5: `test_restart_simulation_rollback` exists and passes (two sessions, distinct objects, rollback verified)
- [ ] All existing restart tests still pass: `pytest tests/integration/test_restart_persistence.py -v` (5 tests)
- [ ] All transaction rollback tests pass: `pytest tests/integration/test_transaction_rollback.py -v` (2 tests)
- [ ] No test prints errors or warnings about database identity mismatch
- [ ] The external `verify_rollback.py` script is now redundant (but can remain for manual checks)

---

## Final Verification Command

```bash
# Run all integration tests
pytest tests/integration/test_transaction_rollback.py tests/integration/test_restart_persistence.py -v -s

# Expected: 7 tests pass (2 rollback + 5 restart)
# Expected output includes:
# - [integration] Targeting database 'tutorial_prod' on host '...'
# - [integration] Connected to database 'tutorial_prod' as user '...'
# - [INTERNAL VERIFICATION] Confirmed workflow_id '...' is ABSENT — rollback succeeded.
# - [RESTART SIMULATION VERIFIED] Two distinct sessions created...
```

If all 7 tests pass with the expected output, the Package A2 fix is complete and ready for review.
