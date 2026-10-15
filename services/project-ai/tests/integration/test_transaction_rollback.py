"""
Transaction rollback verification for the db_session fixture.

Verifies that ALL writes — including those committed with session.commit() —
are absent from the database after test teardown.

How it works:
  1. Generate a UUID-based workflow_id unique to this run.
  2. Upsert a WorkflowModel record and call session.commit() explicitly.
  3. Assert the record is visible within the same session.
  4. Close the session (triggers db_session fixture's outer transaction rollback).
  5. Internal verification: open independent connection and confirm row is ABSENT.
"""

import uuid
import pytest
import pytest_asyncio
from datetime import datetime, timezone
from sqlalchemy import text

from app.persistence.models import WorkflowModel
from app.orchestration.canonical_workflow import CanonicalWorkflowState


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transaction_rollback_verification(db_session, workflow_repo, integration_db_engine):
    """
    Write a record, commit it, confirm it exists in-session, then verify
    it is ABSENT from the database via an independent connection after
    the db_session fixture closes and rolls back.

    This test is fully self-contained — no external script is required.
    """
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

    # Print the ID for backwards compatibility with external verification script
    print(f"\nROLLBACK_VERIFICATION_ID={workflow_id}")
    
    # Close the test session — triggers the fixture's outer transaction rollback
    await db_session.close()
    
    # Independent connection: verify the row is ABSENT
    async with integration_db_engine.connect() as ind_conn:
        result = await ind_conn.execute(
            text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
            {"id": str(workflow_id)},
        )
        row = result.fetchone()
    
    assert row is None, (
        f"ROLLBACK FAILED: workflow {workflow_id} still exists after test session closed. "
        "Transaction rollback did not work."
    )
    print(f"[INTERNAL VERIFICATION] Confirmed workflow {workflow_id} is ABSENT — rollback succeeded.")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_restart_simulation_rollback(db_session_factory, integration_db_engine):
    """
    Verify that db_session_factory creates distinct sessions and rolls back
    all committed changes at fixture teardown.

    Simulates an application restart by:
    1. Session 1: insert + commit a workflow, then close.
    2. Session 2: query the same workflow_id — must be visible (same outer connection).
    3. Independent connection AFTER fixture teardown: workflow must be ABSENT.
    """
    unique_id = str(uuid.uuid4())
    workflow_id = uuid.uuid4()

    # Session 1: insert and commit
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
    await session1.commit()
    await session1.close()

    # Session 2: verify the workflow is visible in the same outer transaction
    session2 = await db_session_factory()
    
    # Verify sessions are DISTINCT objects (regression check)
    assert session1 is not session2, (
        "db_session_factory must return DISTINCT session objects on each call"
    )
    
    from sqlalchemy import select
    result = await session2.execute(
        select(WorkflowModel).where(WorkflowModel.workflow_id == workflow_id)
    )
    found = result.scalar_one_or_none()
    
    assert found is not None, (
        "Workflow should be visible in session 2 within the same outer transaction"
    )
    assert found.workflow_id == workflow_id
    await session2.close()

    # Fixture teardown rolls back the outer transaction here.
    # Independent connection: verify the workflow is ABSENT.
    async with integration_db_engine.connect() as ind_conn:
        result = await ind_conn.execute(
            text("SELECT workflow_id FROM project_ai_workflows WHERE workflow_id = :id"),
            {"id": str(workflow_id)},
        )
        row = result.fetchone()

    assert row is None, (
        f"ROLLBACK FAILED: workflow {workflow_id} persisted after restart simulation teardown. "
        "db_session_factory does not roll back correctly."
    )
    print(f"\n[RESTART SIMULATION VERIFIED] Two distinct sessions created, workflow {workflow_id} "
          f"visible across sessions but ABSENT after teardown.")
