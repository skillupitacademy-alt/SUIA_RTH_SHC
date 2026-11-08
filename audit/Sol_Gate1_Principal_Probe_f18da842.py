import builtins
from unittest.mock import AsyncMock
import pytest
from fastapi import HTTPException
from app.api.routes import workflows


def invoke(monkeypatch, token_type, is_admin):
    service, session = AsyncMock(), AsyncMock()
    service.approve_gate_1.return_value = object()
    monkeypatch.setattr(workflows, '_workflow_to_response', lambda _: {'ok': True})
    user = {
        'user_id': 'independent-approver', 'brand': 'skillhubcore',
        'roles': ['contract_admin'], 'token_type': token_type, 'is_admin': is_admin,
        'aud': 'shc-admin' if token_type == 'admin' else 'user',
    }
    error = None
    try:
        builtins._foundation_test_loop.run_until_complete(workflows.approve_gate_1_workflow(
            'workflow-test', workflows.Gate1ApprovalRequest(contract_id='contract-test', contract_sha256='a' * 64),
            user, service, session,
        ))
    except HTTPException as caught:
        error = caught
    return service, session, error


def test_legitimate_admin_principal_reaches_the_approval_service(monkeypatch):
    service, session, error = invoke(monkeypatch, 'admin', True)
    assert error is None
    service.approve_gate_1.assert_awaited_once()
    session.commit.assert_awaited_once()


def test_user_class_principal_cannot_approve_merely_by_holding_a_role(monkeypatch):
    service, session, error = invoke(monkeypatch, 'user', False)
    assert error is not None and error.status_code == 403
    service.approve_gate_1.assert_not_awaited()
    session.commit.assert_not_awaited()
