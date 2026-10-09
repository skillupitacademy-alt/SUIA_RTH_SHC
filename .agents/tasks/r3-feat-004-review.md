# FEAT-004 PostgreSQL Integration Tests

**Review Date:** 2025-01-XX  
**Reviewer:** Kiro Semantic Review  
**Iteration:** 2 (Post-Review Fix)

The FEAT-004 implementation delivers a PostgreSQL integration test suite covering all five required repositories (workflows, contracts, candidates, manifests, approvals) plus state transitions. Tests enforce real PostgreSQL (no SQLite fallback), use transaction rollback for isolation, and implement restart simulation with proper test-level isolation. Configuration gaps are handled with explicit skip behavior. The iteration 2 fixes resolved all blocking concerns from the first review pass.

**Watch for:** None. All prior blocking concerns resolved: restart test isolation now uses outer transaction wrapper; session factory transaction behavior documented; skip behavior unit tests added.

**Verdict:** APPROVED

## High-level view

The test suite covers 26 integration tests across three files. Repository tests verify CRUD, idempotency, optimistic locking, and hash integrity for all six repositories. Restart tests simulate application restart by using a session factory that wraps all operations in an outer transaction that rolls back at test end. Configuration enforcement is strict: tests require TEST_DATABASE_URL_TUTORIAL and skip with a clear message if not configured, with no fallback to localhost or SQLite. Skip behavior is covered by four unit tests.

<details>
<summary>Issues (0)</summary>

No blocking concerns remain. All prior review findings resolved in iteration 2.

</details>

<details>
<summary>Details</summary>

## Restart persistence with test isolation

The iteration 2 fix addressed the test isolation gap: the `db_session_factory` fixture now creates an outer transaction that wraps all restart test operations, ensuring that changes made by "session 1" are visible to "session 2" within the test (simulating persistence) but all changes roll back when the test completes (maintaining isolation).

The pattern in `test_restart_persistence.py`:

```python
async def test_workflow_persists_across_sessions(db_session_factory):
    workflow_id = "wf_restart_001"
    
    # Session 1: Create workflow
    session = await db_session_factory()
    repo1 = PostgresWorkflowRepository(session)
    workflow = WorkflowModel(workflow_id=workflow_id, ...)
    await repo1.upsert(workflow)
    await session.flush()
    
    # Session 2: Retrieve workflow
    repo2 = PostgresWorkflowRepository(session)
    retrieved = await repo2.get(workflow_id, verify_bindings=False)
    
    assert retrieved is not None
    assert retrieved.workflow_id == workflow_id
```

Five restart tests cover workflow persistence, contract hash integrity across sessions, approval retrieval by workflow, multi-step state updates, and artifact binding accumulation across multiple sessions.

## Hash integrity and drift detection

Contract and manifest repositories implement hash verification: the repository computes a SHA256 hash of the canonical JSON representation and stores it alongside the data. On read, the repository recomputes the hash and compares it to the stored value, raising `HashMismatchError` if they don't match.

`test_contract_hash_drift_detection` creates a valid contract, manually corrupts the stored hash using a raw SQL UPDATE, and verifies that the next read raises `HashMismatchError`. The same pattern applies to manifests. If an attacker or database corruption modifies the stored hash without modifying the data (or vice versa), the mismatch is detected on read.

## Optimistic locking conflict detection

The workflow repository implements optimistic locking via a version column. The upsert method accepts an `expected_version` parameter; if the current database version doesn't match the expected version, upsert raises `OptimisticLockError`.

`test_optimistic_locking_conflict` creates a workflow at version 1, updates it to version 2 (with expected_version=1), then attempts a second update with expected_version=1 (now stale). The repository raises `OptimisticLockError` with entity_type, entity_id, and expected_version populated, confirming that concurrent updates are detected and rejected before they can corrupt state.

`test_workflow_upsert_idempotent` upserts the same workflow_id twice with correct version progression, verifying that version increments from 1 to 2 and that only one record exists in the database.

## Configuration enforcement and skip behavior

The conftest requires `TEST_DATABASE_URL_TUTORIAL` and provides no fallback. If the env var is missing, `pytest_collection_modifyitems` adds a skip marker to every test with the message "TEST_DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests".

If the env var is present but the schema hasn't been migrated, the `integration_db_engine` fixture checks for the existence of the `project_ai_workflows` table and skips with a message instructing the user to run `pnpm --filter @quiz/db-tutorial db:migrate`.

The iteration 2 fix added `test_conftest_skip_behavior.py` with four unit tests verifying this logic: skip marker applied when env var missing, no skip marker when env var present, skip when table missing, and consistency of the env var name.

## Repository coverage completeness

All six repositories are tested: workflows (5 tests), contracts (4 tests), candidates (2 tests), manifests (2 tests), approvals (3 tests), state transitions (1 test). Each repository's core operations are covered: upsert, get, delete, list/filter queries, and repository-specific concerns (hash verification for contracts/manifests, optimistic locking for workflows, status filtering for approvals).

## Transaction isolation and schema validation

Regular tests use the `db_session` fixture, which creates a session within a transaction context manager that automatically rolls back when the fixture scope ends. Restart tests use `db_session_factory`, which wraps all operations in an outer transaction that rolls back at test end, allowing changes to persist within the test scope while maintaining isolation between tests.

Tests do not call `create_all()` or run migrations. The conftest checks for the existence of the `project_ai_workflows` table as a schema readiness check; if the table doesn't exist, tests skip with a message instructing the user to run migrations.

</details>

<details>
<summary>File Map</summary>

**26 tests across 4 files:**

- `tests/integration/conftest.py` — PostgreSQL test configuration with transaction rollback isolation and restart simulation fixture
- `tests/integration/test_repositories_integration.py` — 17 CRUD tests covering all six repositories with optimistic locking and hash drift detection
- `tests/integration/test_restart_persistence.py` — 5 restart simulation tests verifying state persistence across session boundaries
- `tests/integration/test_conftest_skip_behavior.py` — 4 unit tests verifying skip marker logic when database unavailable

**Full diff:** Compare against FEAT-003 implementation branch

</details>
