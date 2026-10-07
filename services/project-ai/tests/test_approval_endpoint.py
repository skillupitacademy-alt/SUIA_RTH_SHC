"""
Tests for approval endpoint - M2.9 Wave 4

Tests approve-placement endpoint with validation, self-approval prevention,
hash verification, and state enforcement.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.api.routes.governance import (
    _workflow_states,
    _implementation_approvals,
)
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.implementation_approval import ImplementationApprovalStatus


@pytest.fixture(autouse=True)
def clear_stores():
    """Clear in-memory stores before each test."""
    _workflow_states.clear()
    _implementation_approvals.clear()
    yield
    _workflow_states.clear()
    _implementation_approvals.clear()


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


def test_approve_placement_success(client):
    """Test successful placement approval with all verifications passing."""
    workflow_id = "wf-test-123"
    
    # Set up workflow in AWAITING_IMPLEMENTATION_APPROVAL state
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    # Approve placement
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "manifest-id-001",
            "approved": True,
            "approved_by": "reviewer@example.com",
            "reason": "Looks good",
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["workflow_id"] == workflow_id
    assert data["previous_state"] == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value
    assert data["new_state"] == CanonicalWorkflowState.IMPLEMENTING.value
    assert data["approved"] is True
    assert data["approved_by"] == "reviewer@example.com"
    assert data["manifest_hash_verified"] is True
    assert data["contract_hash_verified"] is True
    assert data["candidate_sha256_verified"] is True
    assert data["manifest_id_verified"] is True
    
    # Verify ImplementationApproval record created
    assert workflow_id in _implementation_approvals
    approval = _implementation_approvals[workflow_id]
    assert approval.status == ImplementationApprovalStatus.APPROVED
    assert approval.candidate_sha256 == "candidate-ghi789"
    assert approval.placement_manifest_sha256 == "manifest-abc123"


def test_reject_self_approval(client):
    """Test self-approval rejection (403 Forbidden)."""
    workflow_id = "wf-test-456"
    
    # Set up workflow with requester
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "user@example.com",  # Same as approved_by below
    }
    
    # Attempt self-approval
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "manifest-id-001",
            "approved": True,
            "approved_by": "user@example.com",  # Same as requester
            "reason": "Looks good",
        }
    )
    
    assert response.status_code == 403
    detail = response.json()["detail"]
    assert detail["error"] == "SELF_APPROVAL_REJECTED"
    assert "user@example.com" in detail["message"]


def test_manifest_hash_mismatch(client):
    """Test manifest hash mismatch rejection (409 Conflict)."""
    workflow_id = "wf-test-789"
    
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    # Submit with wrong manifest hash
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "wrong-hash",  # Mismatch
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "manifest-id-001",
            "approved": True,
            "approved_by": "reviewer@example.com",
            "reason": "Looks good",
        }
    )
    
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["error"] == "APPROVAL_INVALID"
    assert "manifest_changed" in detail["reason"]


def test_candidate_hash_mismatch(client):
    """Test candidate hash mismatch rejection (400 Bad Request)."""
    workflow_id = "wf-test-101"
    
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    # Submit with wrong candidate hash
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "wrong-candidate-hash",  # Mismatch
            "placement_manifest_id": "manifest-id-001",
            "approved": True,
            "approved_by": "reviewer@example.com",
            "reason": "Looks good",
        }
    )
    
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["error"] == "CANDIDATE_HASH_MISMATCH"


def test_manifest_id_mismatch(client):
    """Test manifest ID mismatch rejection (409 Conflict)."""
    workflow_id = "wf-test-102"
    
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    # Submit with wrong manifest ID
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "wrong-manifest-id",  # Mismatch
            "approved": True,
            "approved_by": "reviewer@example.com",
            "reason": "Looks good",
        }
    )
    
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["error"] == "MANIFEST_ID_MISMATCH"


def test_wrong_state_rejection(client):
    """Test approval rejection when workflow not in AWAITING_IMPLEMENTATION_APPROVAL."""
    workflow_id = "wf-test-103"
    
    # Set up workflow in wrong state
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.CANDIDATE_AUDIT.value,  # Wrong state
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "manifest-id-001",
            "approved": True,
            "approved_by": "reviewer@example.com",
            "reason": "Looks good",
        }
    )
    
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["error"] == "WRONG_STATE"
    assert detail["currentState"] == CanonicalWorkflowState.CANDIDATE_AUDIT.value


def test_get_implementation_approval_success(client):
    """Test GET implementation-approval endpoint returns approval evidence."""
    workflow_id = "wf-test-200"
    
    # First create an approval
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "manifest-id-001",
            "approved": True,
            "approved_by": "reviewer@example.com",
            "reason": "Approved",
        }
    )
    
    # Get approval status
    response = client.get(f"/approvals/workflows/{workflow_id}/implementation-approval")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["workflow_id"] == workflow_id
    assert data["status"] == "APPROVED"
    assert data["candidate_sha256"] == "candidate-ghi789"
    assert data["placement_manifest_sha256"] == "manifest-abc123"
    assert data["approved_by"] == "reviewer@example.com"
    assert "verification_results" in data


def test_get_implementation_approval_not_found(client):
    """Test GET implementation-approval endpoint returns 404 when not found."""
    response = client.get("/approvals/workflows/nonexistent/implementation-approval")
    
    assert response.status_code == 404
    assert "No implementation approval found" in response.json()["detail"]


def test_rejection_creates_rejected_approval(client):
    """Test rejecting placement creates REJECTED approval record."""
    workflow_id = "wf-test-300"
    
    _workflow_states[workflow_id] = {
        "workflow_id": workflow_id,
        "state": CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        "manifest_hash": "manifest-abc123",
        "contract_hash": "contract-def456",
        "candidate_sha256": "candidate-ghi789",
        "placement_manifest_id": "manifest-id-001",
        "target_family": "Introduction",
        "target_version": "I7",
        "requester": "requester@example.com",
    }
    
    # Reject placement
    response = client.post(
        f"/approvals/workflows/{workflow_id}/approve-placement",
        json={
            "workflow_id": workflow_id,
            "manifest_hash": "manifest-abc123",
            "contract_hash": "contract-def456",
            "candidate_sha256": "candidate-ghi789",
            "placement_manifest_id": "manifest-id-001",
            "approved": False,  # Rejecting
            "approved_by": "reviewer@example.com",
            "reason": "Does not meet requirements",
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["approved"] is False
    assert data["new_state"] == CanonicalWorkflowState.REJECTED.value
    
    # Verify REJECTED approval record created
    assert workflow_id in _implementation_approvals
    approval = _implementation_approvals[workflow_id]
    assert approval.status == ImplementationApprovalStatus.REJECTED
    assert approval.rejection_reason == "Does not meet requirements"
