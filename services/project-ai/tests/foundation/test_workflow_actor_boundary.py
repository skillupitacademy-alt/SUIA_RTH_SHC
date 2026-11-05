from unittest.mock import AsyncMock
from app.api.routes import workflows
from app.api.schemas.workflow import TransitionRequest

def test_transition_uses_verified_actor_not_client_value(monkeypatch):
    import builtins
    service = AsyncMock()
    service.transition_state.return_value = object()
    session = AsyncMock()
    monkeypatch.setattr(workflows, "_workflow_to_response", lambda _: {"ok": True})
    result = builtins._foundation_test_loop.run_until_complete(workflows.transition_workflow("fixture-workflow", TransitionRequest(to_state="CANDIDATE_REQUESTED", triggered_by="forged"), {"user_id": "verified"}, service, session))
    assert result == {"ok": True}
    assert service.transition_state.await_args.kwargs["triggered_by"] == "verified"
    session.commit.assert_awaited_once()
