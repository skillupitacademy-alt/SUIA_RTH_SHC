# Implementation Plan: Fix Package A2 Rollback Verification Timing Gap

## Current Test Structure

The file `services/project-ai/tests/integration/test_transaction_rollback.py` contains two tests:

1. **`test_transaction_rollback_verification`** - Uses fixtures: `db_session`, `workflow_repo`, `integration_db_engine`
   - Writes a workflow record using `workflow_repo.upsert()`
   - Calls `session.commit()` (creates SAVEPOINT, not real COMMIT)
   - Verifies record exists within same session
   - **PROBLEM**: Calls `db_session.close()` then immediately opens independent connection to verify absence
   - The independent check happens BEFORE pytest fixture teardown runs, so it sees "absent" because the outer transaction hasn't committed, not because rollback worked

2. **`test_restart_simulation_rollback`** - Uses fixtures: `db_session_factory`, `integration_db_engine`
   - Creates two distinct sessions via factory
   - Commits in session 1, verifies visible in session 2
   - **SAME PROBLEM**: Independent connection check happens inside test function, before fixture teardown

## Required Fix: Two-Test Approach

Split each test into WRITE + VERIFY pairs:

### Test 1a: `test_transaction_rollback_write`
- **Purpose**: Write a workflow record, commit it, store the workflow_id for later verification
- **Fixtures**: `db_session`, `workflow_repo`
- **Actions**:
  1. Generate unique workflow_id
  2. Create and upsert WorkflowModel
  3. Call `session.commit()`
  4. Verify record exists within same session
  5. Store workflow_id in module-level list `_rollback_test_workflow_ids`
  6. Return (fixture teardown rolls back outer transaction)
- **Verification**: None in this test (pytest fixture teardown happens after function returns)

### Test 1b: `test_transaction_rollback_verify`
- **Purpose**: Confirm the workflow_id from WRITE test is absent after fixture rollback
- **Fixtures**: `integration_db_engine` ONLY (no db_session)
- **Actions**:
  1. Read workflow_id from `_rollback_test_workflow_ids[0]`
  2. Open independent connection via `integration_db_engine.connect()`
  3. Query `project_ai_workflows` table
  4. Assert row is None
- **Verification**: Proves fixture teardown rolled back the outer transaction

### Test 2a: `test_restart_simulation_write`
- **Purpose**: Simulate restart with two sessions, store workflow_id for verification
- **Fixtures**: `db_session_factory`
- **Actions**:
  1. Generate unique workflow_id
  2. Session 1: create workflow, commit, close
  3. Session 2: query same workflow_id, verify visible, close
  4. Assert sessions are distinct objects
  5. Store workflow_id in `_restart_test_workflow_ids`
  6. Return (fixture teardown rolls back)
- **Verification**: None in this test

### Test 2b: `test_restart_simulation_verify`
- **Purpose**: Confirm the workflow_id from restart simulation is absent after rollback
- **Fixtures**: `integration_db_engine` ONLY
- **Actions**:
  1. Read workflow_id from `_restart_test_workflow_ids[0]`
  2. Open independent connection
  3. Query and assert absence
- **Verification**: Proves db_session_factory fixture rolled back correctly

## Module-Level Storage

Add at the top of the file (after imports, before tests):

```python
# Module-level storage for workflow IDs to verify across test pairs
_rollback_test_workflow_ids: list[uuid.UUID] = []
_restart_test_workflow_ids: list[uuid.UUID] = []
```

## Test Ordering Guarantee

**Pytest executes tests in file order by default.** Since all four tests are in the same file and we're not using randomization, the WRITE test will always run before its corresponding VERIFY test.

To make this explicit and robust:
- Name tests with `_write` and `_verify` suffixes so lexical ordering matches execution order
- The VERIFY tests check that the module-level list is non-empty and fail fast if the WRITE test didn't run

**No pytest plugins needed** - file order is sufficient.

## Fixture Usage Verification

- **WRITE tests**: Use `db_session` or `db_session_factory` (triggers rollback on teardown)
- **VERIFY tests**: Use `integration_db_engine` ONLY (no session fixtures, no automatic rollback)
- VERIFY tests manually open/close connections and DO NOT use `db_session` fixture

## Imports and Helpers

Current imports are sufficient:
- `uuid` for workflow_id generation
- `pytest`, `pytest_asyncio` for async test support
- `datetime, timezone` for timestamps
- `sqlalchemy.text` for raw SQL queries
- `app.persistence.models.WorkflowModel`
- `app.orchestration.canonical_workflow.CanonicalWorkflowState`

No new imports needed.

## Implementation Plan

- [ ] 1. Add module-level storage lists at top of test file after imports.
      Files: `services/project-ai/tests/integration/test_transaction_rollback.py`
      Verify: File syntax is valid Python (no linting errors).

- [ ] 2. Refactor `test_transaction_rollback_verification` into TWO tests:
      - `test_transaction_rollback_write`: Create workflow, commit, append workflow_id to `_rollback_test_workflow_ids`, return (no independent verification)
      - `test_transaction_rollback_verify`: Read workflow_id from `_rollback_test_workflow_ids[0]`, use `integration_db_engine` to open independent connection, query and assert absence
      Remove the `db_session.close()` and independent connection check from the WRITE test.
      Files: `services/project-ai/tests/integration/test_transaction_rollback.py`
      Verify: Run `python -m pytest services/project-ai/tests/integration/test_transaction_rollback.py::test_transaction_rollback_write -v` and confirm it passes.

- [ ] 3. Refactor `test_restart_simulation_rollback` into TWO tests:
      - `test_restart_simulation_write`: Create two sessions, commit in first, verify visible in second, append workflow_id to `_restart_test_workflow_ids`, return
      - `test_restart_simulation_verify`: Read workflow_id from `_restart_test_workflow_ids[0]`, open independent connection, assert absence
      Remove the independent connection check from the WRITE test.
      Files: `services/project-ai/tests/integration/test_transaction_rollback.py`
      Verify: Run `python -m pytest services/project-ai/tests/integration/test_transaction_rollback.py::test_restart_simulation_write -v` and confirm it passes.

- [ ] 4. Run all four tests in sequence and confirm VERIFY tests pass.
      Files: `services/project-ai/tests/integration/test_transaction_rollback.py`
      Verify: Run `python -m pytest services/project-ai/tests/integration/test_transaction_rollback.py -v` and confirm all four tests pass with descriptive output showing the timing gap is fixed.

- [ ] 5. Capture raw test output showing workflow IDs and verification results.
      Files: `services/project-ai/tests/integration/test_transaction_rollback.py`
      Verify: Save full pytest output to a file and confirm it includes workflow_id values and explicit "ABSENT after teardown" messages.

## Commit Message

```
fix(project-ai): correct rollback verification timing in integration tests

Split test_transaction_rollback.py tests into WRITE/VERIFY pairs to ensure
independent connection checks happen AFTER pytest fixture teardown completes
outer transaction rollback.

Previous implementation checked for record absence INSIDE the test function,
before fixture teardown ran. The check always passed because the outer
transaction was uncommitted, not because rollback worked.

New approach:
- WRITE test: commits record, stores workflow_id, returns (triggers teardown)
- VERIFY test: opens independent connection and confirms record is absent

This proves fixture teardown actually rolled back the outer transaction.

Addresses Package A2 review finding: "The test checks whether the record is
absent using an independent database connection before the fixture has
finished tearing down and rolling back its outer transaction."
```

## Notes

- **Do NOT modify conftest.py** - fixture definitions remain unchanged
- **Do NOT change fixture signatures** - only split test functions
- Tests use `@pytest.mark.integration` and `@pytest.mark.asyncio` decorators (preserve these)
- Module-level lists are intentionally mutable and shared across test execution
- The WRITE tests print workflow_id for backwards compatibility with external verification scripts
- File order guarantees WRITE runs before VERIFY (no pytest-ordering plugin needed)
