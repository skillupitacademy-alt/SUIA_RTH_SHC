"""
Tests for workflow transition authorization - M2.9 Wave 4

Tests can_transition_to_implementing() function with approval verification.
"""

import pytest

from app.orchestration.canonical_workflow import can_transition_to_implementing
from app.models.implementation_approval import (
    ImplementationApprovalStatus,
    create_implementation_approval,
)


def test_transition_requires_approval():
    """Test transition blocked when no approval exists."""
    approvals_store = {}
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="user@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "No implementation approval found" in reason


def test_transition_blocked_without_approval():
    """Test transition blocked when approval status is PENDING."""
    approval = create_implementation_approval(
        workflow_id="wf-123",
        candidate_sha256="abc123",
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest-456",
        placement_manifest_sha256="def456",
        approved_by="reviewer@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.PENDING,
    )
    
    approvals_store = {"wf-123": approval}
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "PENDING" in reason
    assert "expected APPROVED" in reason


def test_transition_blocked_on_candidate_hash_mismatch():
    """Test transition blocked when candidate hash doesn't match."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="wrong-hash",  # Mismatch
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "Candidate hash mismatch" in reason


def test_transition_blocked_on_manifest_hash_mismatch():
    """Test transition blocked when manifest hash doesn't match."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="wrong-hash",  # Mismatch
    )
    
    assert can_transition is False
    assert "Manifest hash mismatch" in reason


def test_transition_blocked_on_manifest_id_mismatch():
    """Test transition blocked when manifest ID doesn't match."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="wrong-id",  # Mismatch
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "Manifest ID mismatch" in reason


def test_transition_blocked_on_self_approval():
    """Test transition blocked when approval is self-approved."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="user@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "Self-approval detected" in reason


def test_authorized_transition_succeeds():
    """Test transition succeeds when all verifications pass."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is True
    assert reason == ""


def test_transition_blocked_on_rejected_status():
    """Test transition blocked when approval status is REJECTED."""
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
    )
    
    approvals_store = {"wf-123": approval}
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "REJECTED" in reason


def test_transition_blocked_missing_requester_id():
    """Test transition blocked when requester_id is missing."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="",  # Empty/missing
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "Missing required parameter: requester_id" in reason


def test_transition_blocked_missing_candidate_sha256():
    """Test transition blocked when candidate_sha256 is missing."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="",  # Empty/missing
        manifest_id="manifest-456",
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "Missing required parameter: candidate_sha256" in reason


def test_transition_blocked_missing_manifest_id():
    """Test transition blocked when manifest_id is missing."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="",  # Empty/missing
        manifest_sha256="def456",
    )
    
    assert can_transition is False
    assert "Missing required parameter: manifest_id" in reason


def test_transition_blocked_missing_manifest_sha256():
    """Test transition blocked when manifest_sha256 is missing."""
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
    
    can_transition, reason = can_transition_to_implementing(
        workflow_id="wf-123",
        approvals_store=approvals_store,
        requester_id="requester@example.com",
        candidate_sha256="abc123",
        manifest_id="manifest-456",
        manifest_sha256="",  # Empty/missing
    )
    
    assert can_transition is False
    assert "Missing required parameter: manifest_sha256" in reason

