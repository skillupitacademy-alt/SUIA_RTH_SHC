"""
Tests for authorization checker - M2.9 Wave 4

Tests check_implementation_approval() and produce_authorization_evidence()
functions for placement executor authorization.
"""

import pytest

from app.authorization.approval_checker import (
    AuthorizationResult,
    check_implementation_approval,
    produce_authorization_evidence,
)
from app.models.implementation_approval import (
    ImplementationApprovalStatus,
    create_implementation_approval,
)


def test_authorization_with_valid_approval():
    """Test authorization succeeds with valid approval."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
    )
    
    assert result.authorized is True
    assert result.approval_id == approval.approval_id
    assert result.failure_reason is None
    assert result.checked_at is not None
    
    # Verify evidence populated
    assert result.evidence["workflow_id"] == "wf-123"
    assert result.evidence["approval_id"] == approval.approval_id
    assert result.evidence["approval_found"] is True
    assert result.evidence["status"] == "APPROVED"
    assert result.evidence["status_check"] == "PASS"
    assert result.evidence["candidate_hash_check"] == "PASS"
    assert result.evidence["manifest_hash_check"] == "PASS"
    assert result.evidence["self_approval_check"] == "PASS"


def test_authorization_blocks_missing_approval():
    """Test authorization fails when no approval exists."""
    approvals_store = {}
    
    result = check_implementation_approval(
        workflow_id="wf-nonexistent",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    assert result.authorized is False
    assert result.approval_id is None
    assert "No implementation approval found" in result.failure_reason
    
    # Verify evidence populated
    assert result.evidence["workflow_id"] == "wf-nonexistent"
    assert result.evidence["approval_found"] is False


def test_authorization_blocks_pending_status():
    """Test authorization fails when approval status is PENDING."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        status=ImplementationApprovalStatus.PENDING,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    assert result.authorized is False
    assert result.approval_id == approval.approval_id
    assert "PENDING" in result.failure_reason
    
    # Verify evidence populated
    assert result.evidence["status"] == "PENDING"
    assert result.evidence["status_check"] == "FAIL"


def test_authorization_blocks_rejected_status():
    """Test authorization fails when approval status is REJECTED."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        status=ImplementationApprovalStatus.REJECTED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    assert result.authorized is False
    assert "REJECTED" in result.failure_reason


def test_authorization_blocks_candidate_hash_mismatch():
    """Test authorization fails when candidate hash doesn't match."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="wrong-hash",  # Mismatch
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    assert result.authorized is False
    assert "Candidate hash mismatch" in result.failure_reason
    
    # Verify evidence populated
    assert result.evidence["candidate_hash_check"] == "FAIL"
    assert result.evidence["expected_candidate_hash"] == "abc123"
    assert result.evidence["provided_candidate_hash"] == "wrong-hash"


def test_authorization_blocks_manifest_hash_mismatch():
    """Test authorization fails when manifest hash doesn't match."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="wrong-hash",  # Mismatch
        approvals_store=approvals_store,
    )
    
    assert result.authorized is False
    assert "Manifest hash mismatch" in result.failure_reason
    
    # Verify evidence populated
    assert result.evidence["manifest_hash_check"] == "FAIL"
    assert result.evidence["expected_manifest_hash"] == "def456"
    assert result.evidence["provided_manifest_hash"] == "wrong-hash"


def test_authorization_blocks_self_approval():
    """Test authorization fails when approval is self-approved."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="user@example.com",
        workflow_requester="user@example.com",  # Self-approval
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
        requester_id="user@example.com",
    )
    
    assert result.authorized is False
    assert "Self-approval detected" in result.failure_reason
    
    # Verify evidence populated
    assert result.evidence["self_approval_check"] == "FAIL"
    assert result.evidence["approved_by"] == "user@example.com"
    assert result.evidence["workflow_requester"] == "user@example.com"


def test_authorization_evidence_populated():
    """Test authorization evidence is fully populated (W3 pattern: no empty dicts)."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
    )
    
    # Verify evidence fully populated
    assert result.evidence is not None
    assert len(result.evidence) > 0
    assert "workflow_id" in result.evidence
    assert "approval_id" in result.evidence
    assert "approval_found" in result.evidence
    assert "status" in result.evidence
    assert "status_check" in result.evidence
    assert "candidate_hash_check" in result.evidence
    assert "manifest_hash_check" in result.evidence
    assert "self_approval_check" in result.evidence
    assert "candidate_sha256" in result.evidence
    assert "manifest_sha256" in result.evidence
    assert "approved_by" in result.evidence
    assert "approval_timestamp" in result.evidence
    assert "checked_at" in result.evidence


def test_produce_authorization_evidence_format():
    """Test produce_authorization_evidence converts to machine-readable format."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    evidence = produce_authorization_evidence(result, "wf-123")
    
    # Verify evidence structure
    assert evidence["workflow_id"] == "wf-123"
    assert "authorization_check" in evidence
    assert evidence["authorization_check"]["authorized"] is True
    assert evidence["authorization_check"]["approval_id"] == approval.approval_id
    assert evidence["authorization_check"]["checked_at"] is not None
    assert evidence["authorization_check"]["failure_reason"] is None
    assert "verification_details" in evidence
    assert "timestamp" in evidence


def test_authorization_without_requester_id():
    """Test authorization check works without requester_id (skips self-approval check)."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approvals_store = {"wf-123": approval}
    
    # Call without requester_id
    result = check_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    assert result.authorized is True
    # Self-approval check should be skipped
    assert result.evidence["self_approval_check"] == "SKIPPED"


def test_authorization_evidence_on_failure():
    """Test authorization evidence populated even on failure."""
    approvals_store = {}
    
    result = check_implementation_approval(
        workflow_id="wf-missing",
        candidate_sha256="abc123",
        manifest_sha256="def456",
        approvals_store=approvals_store,
    )
    
    assert result.authorized is False
    assert result.evidence is not None
    assert len(result.evidence) > 0
    assert result.evidence["workflow_id"] == "wf-missing"
    assert result.evidence["approval_found"] is False
