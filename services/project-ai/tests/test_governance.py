"""Tests for manifest-bound human approval governance API."""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.models.governance import ApprovalStatus


client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_approvals():
    """Clear approval storage before each test."""
    from app.api.routes import governance
    governance._approvals.clear()
    yield
    governance._approvals.clear()


def test_submit_approval_request():
    """Test submitting a manifest for approval."""
    request_data = {
        "manifestId": "manifest-123",
        "manifestHash": "abc123def456",
        "submittedBy": "alice@example.com"
    }
    
    response = client.post("/approvals/submit", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "approvalId" in data
    assert data["manifestId"] == "manifest-123"
    assert data["status"] == ApprovalStatus.PENDING
    assert "submittedAt" in data


def test_get_approval_status():
    """Test retrieving approval status by ID."""
    # Submit first
    submit_data = {
        "manifestId": "manifest-456",
        "manifestHash": "hash789",
        "submittedBy": "bob@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    # Get status
    response = client.get(f"/approvals/{approval_id}")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["approvalId"] == approval_id
    assert data["manifestId"] == "manifest-456"
    assert data["status"] == ApprovalStatus.PENDING
    assert data["submittedBy"] == "bob@example.com"
    assert data["manifestHash"] == "hash789"
    assert len(data["auditTrail"]) == 1
    assert data["auditTrail"][0]["action"] == "submitted"
    assert data["auditTrail"][0]["by"] == "bob@example.com"


def test_get_approval_not_found():
    """Test retrieving non-existent approval returns 404."""
    response = client.get("/approvals/nonexistent-id")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_pending_approvals():
    """Test retrieving all pending approvals."""
    # Submit multiple approvals
    for i in range(3):
        submit_data = {
            "manifestId": f"manifest-{i}",
            "manifestHash": f"hash-{i}",
            "submittedBy": f"user{i}@example.com"
        }
        client.post("/approvals/submit", json=submit_data)
    
    # Get pending
    response = client.get("/approvals/pending")
    
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 3
    assert all(approval["status"] == ApprovalStatus.PENDING for approval in data)


def test_get_pending_excludes_decided():
    """Test that pending endpoint only returns PENDING approvals."""
    # Submit and approve one
    submit_data = {
        "manifestId": "manifest-approved",
        "manifestHash": "hash-approved",
        "submittedBy": "alice@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    approve_data = {
        "decidedBy": "manager@example.com",
        "reason": "Looks good",
        "manifestHash": "hash-approved"
    }
    client.post(f"/approvals/{approval_id}/approve", json=approve_data)
    
    # Submit another pending one
    submit_data2 = {
        "manifestId": "manifest-pending",
        "manifestHash": "hash-pending",
        "submittedBy": "bob@example.com"
    }
    client.post("/approvals/submit", json=submit_data2)
    
    # Get pending - should only return the second one
    response = client.get("/approvals/pending")
    data = response.json()
    
    assert len(data) == 1
    assert data[0]["manifestId"] == "manifest-pending"


def test_approve_with_correct_hash():
    """Test approving a manifest with matching hash."""
    # Submit
    submit_data = {
        "manifestId": "manifest-to-approve",
        "manifestHash": "correct-hash-123",
        "submittedBy": "dev@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    # Approve with correct hash
    approve_data = {
        "decidedBy": "manager@example.com",
        "reason": "Approved for production",
        "manifestHash": "correct-hash-123"
    }
    response = client.post(f"/approvals/{approval_id}/approve", json=approve_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == ApprovalStatus.APPROVED
    assert data["decidedBy"] == "manager@example.com"
    assert data["reason"] == "Approved for production"
    assert data["decidedAt"] is not None
    
    # Verify audit trail
    assert len(data["auditTrail"]) == 2
    assert data["auditTrail"][0]["action"] == "submitted"
    assert data["auditTrail"][1]["action"] == "approved"
    assert data["auditTrail"][1]["by"] == "manager@example.com"
    assert data["auditTrail"][1]["reason"] == "Approved for production"


def test_approve_with_wrong_hash():
    """Test that approval fails when manifest hash doesn't match."""
    # Submit
    submit_data = {
        "manifestId": "manifest-mutated",
        "manifestHash": "original-hash",
        "submittedBy": "dev@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    # Attempt to approve with different hash
    approve_data = {
        "decidedBy": "manager@example.com",
        "reason": "Looks good",
        "manifestHash": "mutated-hash"  # Different!
    }
    response = client.post(f"/approvals/{approval_id}/approve", json=approve_data)
    
    # Should return 409 Conflict
    assert response.status_code == 409
    error_data = response.json()["detail"]
    
    assert error_data["error"] == "MANIFEST_CHANGED"
    assert "mismatch" in error_data["message"].lower()
    assert error_data["expectedHash"] == "original-hash"
    assert error_data["providedHash"] == "mutated-hash"
    
    # Verify the approval record was marked as MANIFEST_CHANGED
    status_response = client.get(f"/approvals/{approval_id}")
    status_data = status_response.json()
    
    assert status_data["status"] == ApprovalStatus.MANIFEST_CHANGED
    assert "mutated after submission" in status_data["reason"]
    assert len(status_data["auditTrail"]) == 2
    assert status_data["auditTrail"][1]["action"] == "rejected_hash_mismatch"


def test_approve_non_pending():
    """Test that approval fails if not in PENDING state."""
    # Submit and reject
    submit_data = {
        "manifestId": "manifest-rejected",
        "manifestHash": "hash-123",
        "submittedBy": "dev@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    reject_data = {
        "rejectedBy": "manager@example.com",
        "reason": "Not ready"
    }
    client.post(f"/approvals/{approval_id}/reject", json=reject_data)
    
    # Try to approve already-rejected
    approve_data = {
        "decidedBy": "manager@example.com",
        "reason": "Changed my mind",
        "manifestHash": "hash-123"
    }
    response = client.post(f"/approvals/{approval_id}/approve", json=approve_data)
    
    assert response.status_code == 400
    assert "expected PENDING" in response.json()["detail"]


def test_reject_approval():
    """Test rejecting a pending approval."""
    # Submit
    submit_data = {
        "manifestId": "manifest-to-reject",
        "manifestHash": "hash-xyz",
        "submittedBy": "dev@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    # Reject
    reject_data = {
        "rejectedBy": "manager@example.com",
        "reason": "Security concerns"
    }
    response = client.post(f"/approvals/{approval_id}/reject", json=reject_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == ApprovalStatus.REJECTED
    assert data["decidedBy"] == "manager@example.com"
    assert data["reason"] == "Security concerns"
    assert data["decidedAt"] is not None
    
    # Verify audit trail
    assert len(data["auditTrail"]) == 2
    assert data["auditTrail"][0]["action"] == "submitted"
    assert data["auditTrail"][1]["action"] == "rejected"
    assert data["auditTrail"][1]["by"] == "manager@example.com"
    assert data["auditTrail"][1]["reason"] == "Security concerns"


def test_reject_non_pending():
    """Test that rejection fails if not in PENDING state."""
    # Submit and approve
    submit_data = {
        "manifestId": "manifest-approved",
        "manifestHash": "hash-456",
        "submittedBy": "dev@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    approve_data = {
        "decidedBy": "manager@example.com",
        "reason": "Approved",
        "manifestHash": "hash-456"
    }
    client.post(f"/approvals/{approval_id}/approve", json=approve_data)
    
    # Try to reject already-approved
    reject_data = {
        "rejectedBy": "manager@example.com",
        "reason": "Wait, no"
    }
    response = client.post(f"/approvals/{approval_id}/reject", json=reject_data)
    
    assert response.status_code == 400
    assert "expected PENDING" in response.json()["detail"]


def test_audit_trail_captured():
    """Test that complete audit trail is captured throughout lifecycle."""
    # Submit
    submit_data = {
        "manifestId": "manifest-full-audit",
        "manifestHash": "audit-hash",
        "submittedBy": "alice@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    # Check initial audit trail
    response1 = client.get(f"/approvals/{approval_id}")
    data1 = response1.json()
    assert len(data1["auditTrail"]) == 1
    assert data1["auditTrail"][0]["action"] == "submitted"
    assert data1["auditTrail"][0]["by"] == "alice@example.com"
    assert "at" in data1["auditTrail"][0]
    
    # Approve
    approve_data = {
        "decidedBy": "bob@example.com",
        "reason": "LGTM",
        "manifestHash": "audit-hash"
    }
    client.post(f"/approvals/{approval_id}/approve", json=approve_data)
    
    # Check final audit trail
    response2 = client.get(f"/approvals/{approval_id}")
    data2 = response2.json()
    assert len(data2["auditTrail"]) == 2
    assert data2["auditTrail"][1]["action"] == "approved"
    assert data2["auditTrail"][1]["by"] == "bob@example.com"
    assert data2["auditTrail"][1]["reason"] == "LGTM"


def test_manifest_hash_is_security_boundary():
    """
    Integration test demonstrating manifest hash as security gate.
    
    Simulates an attack scenario where manifest is mutated between
    submission and approval.
    """
    # Legitimate submission
    submit_data = {
        "manifestId": "manifest-secure",
        "manifestHash": "legitimate-hash-abc123",
        "submittedBy": "developer@example.com"
    }
    submit_response = client.post("/approvals/submit", json=submit_data)
    approval_id = submit_response.json()["approvalId"]
    
    # Attacker mutates manifest (simulated by different hash at approval)
    malicious_approve = {
        "decidedBy": "manager@example.com",
        "reason": "Approved",
        "manifestHash": "malicious-hash-xyz789"  # DIFFERENT
    }
    attack_response = client.post(
        f"/approvals/{approval_id}/approve",
        json=malicious_approve
    )
    
    # Attack prevented by hash verification
    assert attack_response.status_code == 409
    assert attack_response.json()["detail"]["error"] == "MANIFEST_CHANGED"
    
    # Approval remains unapproved
    status_response = client.get(f"/approvals/{approval_id}")
    status_data = status_response.json()
    assert status_data["status"] == ApprovalStatus.MANIFEST_CHANGED
    
    # Audit trail records the attempted attack
    assert any(
        entry["action"] == "rejected_hash_mismatch"
        for entry in status_data["auditTrail"]
    )
