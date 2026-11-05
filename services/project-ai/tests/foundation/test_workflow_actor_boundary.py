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

def test_invalid_state_has_no_transition_or_commit(monkeypatch):
    import builtins
    import pytest
    from fastapi import HTTPException

    service = AsyncMock()
    session = AsyncMock()
    with pytest.raises(HTTPException) as error:
        builtins._foundation_test_loop.run_until_complete(
            workflows.transition_workflow(
                "fixture-workflow",
                TransitionRequest(to_state="NOT_A_STATE", triggered_by="verified"),
                {"user_id": "verified"}, service, session,
            )
        )
    assert error.value.status_code == 400
    service.transition_state.assert_not_awaited()
    session.commit.assert_not_awaited()

def test_service_rejection_rolls_back_with_verified_actor():
    import builtins
    import pytest
    from fastapi import HTTPException

    service = AsyncMock()
    service.transition_state.side_effect = ValueError("denied")
    session = AsyncMock()
    with pytest.raises(HTTPException) as error:
        builtins._foundation_test_loop.run_until_complete(
            workflows.transition_workflow(
                "fixture-workflow",
                TransitionRequest(to_state="CANDIDATE_REQUESTED", triggered_by="forged", reason="reason", evidence_id="evidence"),
                {"user_id": "verified"}, service, session,
            )
        )
    assert error.value.status_code == 400
    assert service.transition_state.await_args.kwargs["triggered_by"] == "verified"
    assert service.transition_state.await_args.kwargs["reason"] == "reason"
    assert service.transition_state.await_args.kwargs["evidence_id"] == "evidence"
    session.rollback.assert_awaited_once()
    session.commit.assert_not_awaited()
