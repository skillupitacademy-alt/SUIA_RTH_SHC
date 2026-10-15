"""
Transaction rollback verification for the db_session fixture.

Verifies that ALL writes — including those committed with session.commit() —
are absent from the database after test teardown.

How it works:
  1. Generate a UUID-based workflow_id unique to this run.
  2. Upsert a WorkflowModel record and call session.commit() explicitly.
  3. Assert the record is visible within the same session.
  4. Print the workflow_id so the external verify_rollback.py script can check it.
  5. Test teardown: the db_session fixture rolls back the connection transaction.
  6. External verification confirms the record is absent.
"""

import uuid
import pytest
import pytest_asyncio
from datetime import datetime, timezone

from app.persistence.models import WorkflowModel
from app.orchestration.canonical_workflow import CanonicalWorkflowState


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transaction_rollback_verification(db_session, workflow_repo):
    """
    Write a record, commit it, confirm it exists in-session, print its ID.

    After this test completes the db_session fixture rolls back the outer
    connection transaction. Run verify_rollback.py with the printed workflow_id
    to confirm the record is absent from the database.
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

    # Print the ID for the external verification script
    print(f"\nROLLBACK_VERIFICATION_ID={workflow_id}")
