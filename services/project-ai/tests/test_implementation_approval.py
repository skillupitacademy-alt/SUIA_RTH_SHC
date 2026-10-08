"""
Tests for ImplementationApproval model - M2.9 Wave 4

Tests approval model creation, hash verification, self-approval detection,
and validation logic.
"""

import pytest
from datetime import datetime, timezone

from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
    create_implementation_approval,
)


def test_approval_model_creation():
    """Test ImplementationApproval model creation with all required fields."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
    )
    
    assert approval.workflow_id == "wf-123"
    assert approval.candidate_sha256 == "abc123"
    assert approval.target_family == "Introduction"
    assert approval.target_version == "I7"
    assert approval.placement_manifest_id == "manifest-456"
    assert approval.placement_manifest_sha256 == "def456"
    assert approval.approved_by == "reviewer@example.com"
    assert approval.workflow_requester == "requester@example.com"
    assert approval.status == ImplementationApprovalStatus.PENDING
    assert approval.approval_id is not None
    assert approval.approval_timestamp is not None
    assert approval.evidence is not None
    assert approval.rejection_reason is None


def test_hash_verification_match():
    """Test hash verification methods with matching hashes."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
    )
    
    # Test manifest hash verification (match)
    assert approval.verify_manifest_hash("def456") is True
    
    # Test candidate hash verification (match)
    assert approval.verify_candidate_hash("abc123") is True


def test_hash_verification_mismatch():
    """Test hash verification methods with mismatched hashes."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
    )
    
    # Test manifest hash verification (mismatch)
    assert approval.verify_manifest_hash("wrong-hash") is False
    
    # Test candidate hash verification (mismatch)
    assert approval.verify_candidate_hash("wrong-hash") is False


def test_self_approval_detection():
    """Test self-approval detection prevents approver == requester."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="user@example.com",
        workflow_requester="user@example.com",  # Same as approved_by
    )
    
    # Self-approval should be detected
    assert approval.verify_not_self_approved("user@example.com") is False


def test_not_self_approved():
    """Test that different approver and requester passes verification."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
    )
    
    # Different approver and requester should pass
    assert approval.verify_not_self_approved("requester@example.com") is True


def test_is_valid_for_implementation_success():
    """Test is_valid_for_implementation with all checks passing."""
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
    
    # All checks should pass
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert is_valid is True


def test_is_valid_for_implementation_wrong_status():
    """Test is_valid_for_implementation fails when status != APPROVED."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.PENDING,  # Not APPROVED
    )
    
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert is_valid is False


def test_is_valid_for_implementation_candidate_hash_mismatch():
    """Test is_valid_for_implementation fails on candidate hash mismatch."""
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
    
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="wrong-hash",  # Mismatch
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert is_valid is False


def test_is_valid_for_implementation_manifest_hash_mismatch():
    """Test is_valid_for_implementation fails on manifest hash mismatch."""
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
    
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="wrong-hash",  # Mismatch
    )
    
    assert is_valid is False


def test_is_valid_for_implementation_manifest_id_mismatch():
    """Test is_valid_for_implementation fails on manifest ID mismatch."""
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
    
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="wrong-id",  # Mismatch
        manifest_sha256="def456",
    )
    
    assert is_valid is False


def test_is_valid_for_implementation_self_approval():
    """Test is_valid_for_implementation fails on self-approval."""
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
    
    is_valid = approval.is_valid_for_implementation(
        requester_id="user@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert is_valid is False


def test_to_evidence_dict():
    """Test evidence dict population follows W3 pattern."""
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
    
    evidence = approval.to_evidence_dict()
    
    # Verify all required fields present
    assert evidence["approval_id"] == approval.approval_id
    assert evidence["workflow_id"] == "wf-123"
    assert evidence["candidate_sha256"] == "abc123"
    assert evidence["target_family"] == "Introduction"
    assert evidence["target_version"] == "I7"
    assert evidence["placement_manifest_id"] == "manifest-456"
    assert evidence["placement_manifest_sha256"] == "def456"
    assert evidence["approved_by"] == "reviewer@example.com"
    assert evidence["status"] == "APPROVED"
    assert evidence["workflow_requester"] == "requester@example.com"
    
    # Verify verification_results populated (W3 pattern: no empty dicts)
    assert "verification_results" in evidence
    assert evidence["verification_results"]["manifest_hash_verified"] is True
    assert evidence["verification_results"]["candidate_hash_verified"] is True
    assert evidence["verification_results"]["self_approval_check_performed"] is True
    assert evidence["verification_results"]["status_check_performed"] is True


def test_approval_with_rejection():
    """Test creating approval with REJECTED status."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.REJECTED,
        rejection_reason="Does not meet requirements",
    )
    
    assert approval.status == ImplementationApprovalStatus.REJECTED
    assert approval.rejection_reason == "Does not meet requirements"
    
    # Rejected approval should not be valid for implementation
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert is_valid is False


def test_missing_workflow_requester_rejected():
    """Test verify_not_self_approved returns False when workflow_requester is None."""
    approval = ImplementationApproval(
        approval_id="test-id",
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        approval_timestamp=datetime.now(timezone.utc).isoformat(),
        status=ImplementationApprovalStatus.APPROVED,
        workflow_requester=None,  # Missing
        evidence={}
    )
    
    # Should fail-closed when workflow_requester is missing
    assert approval.verify_not_self_approved("any@example.com") is False


def test_is_valid_for_implementation_fails_missing_requester():
    """Test is_valid_for_implementation returns False when workflow_requester is None."""
    approval = ImplementationApproval(
        approval_id="test-id",
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        approval_timestamp=datetime.now(timezone.utc).isoformat(),
        status=ImplementationApprovalStatus.APPROVED,
        workflow_requester=None,  # Missing
        evidence={}
    )
    
    is_valid = approval.is_valid_for_implementation(
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert is_valid is False

