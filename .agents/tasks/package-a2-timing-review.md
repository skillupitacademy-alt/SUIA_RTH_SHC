# Package A2 timing fix: rollback verification now happens after fixture teardown

The original timing gap is closed. Independent-connection queries now happen in separate VERIFY tests that run after the WRITE tests' fixtures have torn down and rolled back their outer transactions. The test suite passes with correct execution order and timing statements confirming the fix.

**Watch for:** nothing blocking. The timing correction addresses the user's concern, the restart-simulation fixture creates distinct sessions, and the test output shows all four tests passing in the expected order.

**Verdict**: APPROVED

## High-level view

The test file splits each rollback verification into a WRITE test (insert, commit, return) and a VERIFY test (independent connection check after teardown). WRITE tests use `db_session` or `db_session_factory`; VERIFY tests use `integration_db_engine` directly. Module-level lists carry workflow IDs from WRITE to VERIFY tests. The restart simulation fixture returns `session_factory()`, which creates a new `AsyncSession` on each call with `join_transaction_mode="create_savepoint"`, and the test explicitly asserts that session1 and session2 are distinct objects. Test output confirms the four tests run in definition order (write1, verify1, write2, verify2) and all pass. The timing print statements show VERIFY tests acknowledge they run after WRITE teardown completes.

<details>
<summary>Issues (0)</summary>

No blocking issues.

</details>

<details>
<summary>Details</summary>

## Timing correctness: VERIFY tests open independent connections after WRITE teardown

Each WRITE test inserts a workflow, calls `session.commit()` (SAVEPOINT), stores the workflow_id in a module-level list, and returns. Pytest fixture teardown rolls back the outer transaction after the function exits. The companion VERIFY test then reads the workflow_id from the module-level list, opens an independent connection using `integration_db_engine.connect()`, queries for the workflow_id, and asserts it is absent.

Test output shows the execution order:

```
test_transaction_rollback_write PASSED
test_transaction_rollback_verify PASSED
test_restart_simulation_write PASSED
test_restart_simulation_verify PASSED
```

The independent connection query is inside the VERIFY test function, not inside the WRITE test function, so it happens after the outer transaction rollback.

## Session isolation: the factory returns distinct session objects

The `db_session_factory` fixture's `_factory()` function returns `session_factory()`, where `session_factory` is an `async_sessionmaker` configured with `join_transaction_mode="create_savepoint"`. Each call to `session_factory()` creates a new `AsyncSession` bound to the same connection.

The restart simulation WRITE test verifies session distinctness:

```python
session1 = await db_session_factory()
# ... insert and commit ...
await session1.close()

session2 = await db_session_factory()
assert session1 is not session2, (
    "db_session_factory must return DISTINCT session objects on each call"
)
```

Test output confirms: "[WRITE] Session 2: confirmed distinct from session 1".

## Module-level state safety

Two module-level lists (`_rollback_test_workflow_ids` and `_restart_test_workflow_ids`) carry workflow IDs from WRITE to VERIFY tests. If tests are rerun or run in parallel, the lists could accumulate IDs from prior runs or interleave data. The function-scoped fixtures prevent cross-test session leakage, but the module-level lists do not reset between test runs.

If pytest is invoked with `-k` filters or test discovery finds tests out of order, the VERIFY tests will fail with "No workflow_id found" rather than silently using the wrong ID. This is a safe failure mode for fixture validation tests.

## Test evidence

The test output shows all four tests pass in definition order with timing statements confirming VERIFY tests run after WRITE teardown. Workflow IDs are printed and used consistently (bd9c117f... for rollback, 5375a0f8... for restart). Database identity verification confirms connection to `tutorial_prod` as `neondb_owner`. Exit code 0.

</details>

<details>
<summary>File map</summary>

- **test_transaction_rollback.py** — split rollback verification into WRITE/VERIFY test pairs, added module-level lists for workflow ID passing, added timing print statements, added session distinctness assertion
- **package-a2-timing-fix-test-output.txt** — test run output showing all four tests passing in correct order with timing confirmation

</details>
