"""
Transaction rollback verification for the db_session fixture.

Verifies that ALL writes — including those committed with session.commit() —
are absent from the database after test teardown.

How it works (two-test approach per fixture):
  WRITE test:
    1. Generate a UUID-based workflow_id unique to this run.
    2. Upsert a WorkflowModel record and call session.commit() explicitly.
    3. Assert the record is visible within the same session.
    4. Store workflow_id in module-level list for later verification.
    5. Return (pytest fixture teardown rolls back outer transaction AFTER function exits).
  
  VERIFY test:
    1. Read workflow_id from module-level list.
    2. Open independent connection via integration_db_engine.
    3. Query for the workflow_id and assert it is ABSENT.
    4. This proves fixture teardown rolled back the outer transaction.

This timing ensures the independent connection check happens AFTER fixture
teardown completes, not BEFORE as in the previous implementation.
"""

import uuid
import pytest
import pytest_asyncio
from datetime import datetime, timezone
from sqlalchemy import text

from app.persistence.models import WorkflowModel
from app.orchestration.canonical_workflow import CanonicalWorkflowState


# Module-level storage for workflow IDs to verify across test pairs
_rollback_test_workflow_ids: list[uuid.UUID] = []
_restart_test_workflow_ids: list[uuid.UUID] = []


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transaction_rollback_write(db_session, workflow_repo):
    """
    WRITE phase: Create a workflow, commit it, and store the ID for verification.
    
    This test writes a record and commits it within the db_session fixture's
    outer transaction. It does NOT verify rollback — that happens in the
    companion VERIFY test after this function returns and pytest fixture
    teardown completes.
    
    Timing:
    1. This test function writes and commits (SAVEPOINT, not real COMMIT).
    2. Test function returns.
    3. Pytest fixture teardown rolls back the outer transaction.
    4. The VERIFY test runs and checks that the record is absent.
    """
    print("\n[WRITE] Starting transaction rollback WRITE test")
    
    unique_id = str(uuid.uuid4())
    workflow_id = uuid.uuid4()
    
    # Create a workflow with all required fields
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id=uuid.uuid4(),
        target_family="Introduction",
        target_version="I7",
        requester_id=f"test_rollback_requester_{unique_id}",
        current_state=CanonicalWorkflowState.REQUESTED.value,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    await workflow_repo.upsert(workflow)
    await db_session.commit()  # SAVEPOINT in connection-level tx; must NOT persist

    # Confirm record is visible within the same session/transaction
    found = await workflow_repo.get(str(workflow_id))
    assert found is not None, "Workflow should be visible within the test session"
    assert found.workflow_id == workflow_id

    # Store workflow_id for verification test
    _rollback_test_workflow_ids.append(workflow_id)
    
    # Print the ID for backwards compatibility with external verification script
    print(f"ROLLBACK_VERIFICATION_ID={workflow_id}")
    print(f"[WRITE] Workflow {workflow_id} committed. Returning now.")
    print("[WRITE] Pytest fixture teardown will roll back the outer transaction after this function exits.")
    
    # Return here — pytest fixture teardown happens AFTER this function completes


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transaction_rollback_verify(integration_db_engine):
    """
    VERIFY phase: Confirm the workflow from WRITE test is absent after rollback.
    
    This test runs AFTER test_transaction_rollback_write and its fixture
    teardown have completed. It opens an independent connection (NOT using
    db_session fixture) and verifies the workflow_id is absent from the
    database.
    
    This proves that the db_session fixture's teardown correctly rolled back
    the outer transaction.
    """
    print("\n[VERIFY] Starting transaction rollback VERIFY test")
    print("[VERIFY] This test runs AFTER the WRITE test's fixture teardown completed.")
    
    # Read workflow_id from module-level storage
    assert len(_rollback_test_workflow_ids) > 0, (
        "No workflow_id found — test_transaction_rollback_write must run first"
    )
    workflow_id = _rollback_test_workflow_ids[0]
    
    print(f"[VERIFY] Checking if workflow {workflow_id} is absent...")
    
    # Open independent connection (NOT using db_session fixture)
    async with integration_db_engine.connect() as ind_conn:
        result = await ind_conn.execute(
            text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
            {"id": str(workflow_id)},
        )
        row = result.fetchone()
    
    assert row is None, (
        f"ROLLBACK FAILED: workflow {workflow_id} still exists after fixture teardown. "
        "The db_session fixture did not roll back the outer transaction correctly."
    )
    
    print(f"[VERIFY] SUCCESS: Workflow {workflow_id} is ABSENT — rollback worked correctly.")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_restart_simulation_write(db_session_factory):
    """
    WRITE phase: Simulate restart with two sessions, store ID for verification.
    
    Verifies that db_session_factory creates distinct sessions that share the
    same outer connection transaction. A workflow committed in session 1 is
    visible in session 2, simulating cross-restart visibility.
    
    This test does NOT verify rollback — that happens in the companion VERIFY
    test after fixture teardown completes.
    
    Timing:
    1. Session 1: insert workflow, commit (SAVEPOINT), close.
    2. Session 2: query workflow, verify visible, close.
    3. Test function returns.
    4. Pytest fixture teardown rolls back the outer transaction.
    5. The VERIFY test runs and checks that the workflow is absent.
    """
    print("\n[WRITE] Starting restart simulation WRITE test")
    
    unique_id = str(uuid.uuid4())
    workflow_id = uuid.uuid4()

    # Session 1: insert and commit
    print("[WRITE] Creating session 1...")
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
    await session1.commit()  # SAVEPOINT, not real COMMIT
    print(f"[WRITE] Session 1: workflow {workflow_id} committed (SAVEPOINT)")
    await session1.close()

    # Session 2: verify the workflow is visible in the same outer transaction
    print("[WRITE] Creating session 2...")
    session2 = await db_session_factory()
    
    # Verify sessions are DISTINCT objects (regression check)
    assert session1 is not session2, (
        "db_session_factory must return DISTINCT session objects on each call"
    )
    print("[WRITE] Session 2: confirmed distinct from session 1")
    
    from sqlalchemy import select
    result = await session2.execute(
        select(WorkflowModel).where(WorkflowModel.workflow_id == workflow_id)
    )
    found = result.scalar_one_or_none()
    
    assert found is not None, (
        "Workflow should be visible in session 2 within the same outer transaction"
    )
    assert found.workflow_id == workflow_id
    print(f"[WRITE] Session 2: workflow {workflow_id} is visible (cross-session within same outer transaction)")
    await session2.close()

    # Store workflow_id for verification test
    _restart_test_workflow_ids.append(workflow_id)
    
    print(f"[WRITE] Restart simulation complete. Workflow {workflow_id} stored for verification.")
    print("[WRITE] Returning now. Pytest fixture teardown will roll back the outer transaction.")
    
    # Return here — pytest fixture teardown happens AFTER this function completes


@pytest.mark.integration
@pytest.mark.asyncio
async def test_restart_simulation_verify(integration_db_engine):
    """
    VERIFY phase: Confirm the workflow from restart simulation is absent after rollback.
    
    This test runs AFTER test_restart_simulation_write and its fixture
    teardown have completed. It opens an independent connection and verifies
    the workflow_id is absent, proving that the db_session_factory fixture's
    teardown correctly rolled back the outer transaction.
    """
    print("\n[VERIFY] Starting restart simulation VERIFY test")
    print("[VERIFY] This test runs AFTER the WRITE test's fixture teardown completed.")
    
    # Read workflow_id from module-level storage
    assert len(_restart_test_workflow_ids) > 0, (
        "No workflow_id found — test_restart_simulation_write must run first"
    )
    workflow_id = _restart_test_workflow_ids[0]
    
    print(f"[VERIFY] Checking if workflow {workflow_id} is absent...")
    
    # Open independent connection (NOT using db_session or db_session_factory)
    async with integration_db_engine.connect() as ind_conn:
        result = await ind_conn.execute(
            text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
            {"id": str(workflow_id)},
        )
        row = result.fetchone()

    assert row is None, (
        f"ROLLBACK FAILED: workflow {workflow_id} persisted after restart simulation teardown. "
        "The db_session_factory fixture did not roll back correctly."
    )
    
    print(f"[VERIFY] SUCCESS: Workflow {workflow_id} is ABSENT — rollback worked correctly.")
    print("[VERIFY] Restart simulation verified: two distinct sessions created, workflow visible across sessions,")
    print("[VERIFY] but absent after fixture teardown.")
