"""Security tests for governance identity extraction from JWT.

Tests verify that governance endpoints extract identities from verified JWT tokens
rather than trusting client-supplied identity fields, preventing identity spoofing attacks.
"""

import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.auth.jwt import create_access_token
from app.api.routes.governance import _approvals


@pytest.fixture(autouse=True)
def set_jwt_env():
    """Set JWT_SECRET for all tests in this module."""
    os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long_for_testing"
    os.environ["ADMIN_JWT_SECRET"] = "admin_secret_key_at_least_32_characters_long_for_testing"
    yield
    if "JWT_SECRET" in os.environ:
        del os.environ["JWT_SECRET"]
    if "ADMIN_JWT_SECRET" in os.environ:
        del os.environ["ADMIN_JWT_SECRET"]


@pytest.fixture(autouse=True)
def clear_approvals():
    """Clear in-memory approval storage before each test."""
    _approvals.clear()
    yield
    _approvals.clear()


client = TestClient(app)


def create_test_token(user_id: str, roles: list = None):
    """Helper to create test JWT tokens."""
    if roles is None:
        roles = ["contract_viewer"]
    
    data = {
        "userId": user_id,
        "originalUserId": user_id,
        "shadowUserId": user_id,
        "aud": "user",
        "tokenType": "user",
        "roles": roles
    }
    return create_access_token(data)


def test_governance_submit_uses_jwt_identity():
    """Test that submit endpoint uses JWT user_id, not client-supplied submittedBy."""
    # Create JWT for alice@example.com
    token = create_test_token("alice@example.com")
    
    # Submit with JWT from alice but NO submittedBy field (removed from schema)
    request_data = {
        "manifestId": "manifest-123",
        "manifestHash": "abc123def456"
    }
    
    response = client.post(
        "/approvals/submit",
        json=request_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    approval_id = response.json()["approvalId"]
    
    # Verify stored approval record has JWT identity
    status_response = client.get(
        f"/approvals/{approval_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    approval_data = status_response.json()
    assert approval_data["submittedBy"] == "alice@example.com"  # From JWT, not request
    assert approval_data["auditTrail"][0]["by"] == "alice@example.com"  # From JWT


def test_governance_approve_prevents_jwt_self_approval():
    """Test that approve endpoint prevents self-approval using JWT identities."""
    # Alice submits
    alice_token = create_test_token("alice@example.com")
    
    submit_response = client.post(
        "/approvals/submit",
        json={
            "manifestId": "manifest-self-approve",
            "manifestHash": "hash123"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    approval_id = submit_response.json()["approvalId"]
    
    # Alice attempts to approve her own submission
    approve_response = client.post(
        f"/approvals/{approval_id}/approve",
        json={
            "reason": "Looks good",
            "manifestHash": "hash123"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    # Self-approval must be rejected
    assert approve_response.status_code == 403
    error_detail = approve_response.json()["detail"]
    assert error_detail["error"] == "SELF_APPROVAL_REJECTED"
    assert error_detail["submittedBy"] == "alice@example.com"
    assert error_detail["attemptedBy"] == "alice@example.com"


def test_governance_approve_allows_different_jwt_identity():
    """Test that approve endpoint allows approval when JWT identities differ."""
    # Alice submits
    alice_token = create_test_token("alice@example.com")
    
    submit_response = client.post(
        "/approvals/submit",
        json={
            "manifestId": "manifest-legitimate",
            "manifestHash": "hash456"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    approval_id = submit_response.json()["approvalId"]
    
    # Bob approves (different JWT)
    bob_token = create_test_token("bob@example.com", roles=["contract_admin"])
    
    approve_response = client.post(
        f"/approvals/{approval_id}/approve",
        json={
            "reason": "Approved",
            "manifestHash": "hash456"
        },
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    
    # Approval must succeed
    assert approve_response.status_code == 200
    approval_data = approve_response.json()
    assert approval_data["status"] == "APPROVED"
    assert approval_data["submittedBy"] == "alice@example.com"
    assert approval_data["decidedBy"] == "bob@example.com"
    assert approval_data["auditTrail"][1]["by"] == "bob@example.com"


def test_governance_reject_uses_jwt_identity():
    """Test that reject endpoint uses JWT user_id, not client-supplied rejectedBy."""
    # Alice submits
    alice_token = create_test_token("alice@example.com")
    
    submit_response = client.post(
        "/approvals/submit",
        json={
            "manifestId": "manifest-reject-test",
            "manifestHash": "hash789"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    approval_id = submit_response.json()["approvalId"]
    
    # Bob rejects (different JWT)
    bob_token = create_test_token("bob@example.com")
    
    reject_response = client.post(
        f"/approvals/{approval_id}/reject",
        json={
            "reason": "Not meeting standards"
        },
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    
    # Rejection must succeed
    assert reject_response.status_code == 200
    approval_data = reject_response.json()
    assert approval_data["status"] == "REJECTED"
    assert approval_data["submittedBy"] == "alice@example.com"
    assert approval_data["decidedBy"] == "bob@example.com"  # From JWT, not request
    assert approval_data["auditTrail"][1]["by"] == "bob@example.com"  # From JWT
