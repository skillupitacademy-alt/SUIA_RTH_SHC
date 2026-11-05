from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import builtins
from app.models.workflow import ProjectLLMWorkflow
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.orchestration import workflow_governance

def test_gate1_cannot_advance_without_approval_evidence(monkeypatch):
    now = datetime.now(timezone.utc)
    workflow = ProjectLLMWorkflow(workflow_id='fixture', specification_id='I7', target_family='Introduction', target_version='I7', requester_id='requester', current_state=CanonicalWorkflowState.AWAITING_GATE_1, created_at=now, updated_at=now)
    repo, approvals, transitions, session = AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock()
    repo.get.return_value = MagicMock(version=1)
    service = workflow_governance.WorkflowGovernanceService(repo, approvals, transitions, session)
    service.get_workflow = AsyncMock(return_value=workflow)
    monkeypatch.setattr(workflow_governance, '_domain_to_workflow_model', lambda _: object())
    async def run():
        try:
            await service.transition_state('fixture', CanonicalWorkflowState.GUI_APPROVED, 'requester')
        except ValueError:
            pass
    builtins._foundation_test_loop.run_until_complete(run())
    assert repo.upsert.await_count == 0
    assert transitions.create.await_count == 0
