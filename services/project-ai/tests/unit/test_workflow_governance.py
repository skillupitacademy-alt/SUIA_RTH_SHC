"""
Unit Tests for WorkflowGovernanceService - M2.9 Wave 0

Tests for workflow governance service including workflow creation, state transitions,
validation, authorization gates, approval registration, and artifact binding.
"""

import pytest
from datetime import datetime, timezone

from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
    create_implementation_approval
)


@pytest.fixture
def governance_service():
    """Create a fresh WorkflowGovernanceService for each test."""
    return WorkflowGovernanceService()


@pytest.fixture
def sample_workflow(governance_service):
    """Create a sample workflow for testing."""
    return governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        purpose="Test workflow"
    )


@pytest.fixture
def sample_approval():
    """Create a sample ImplementationApproval for testing."""
    return create_implementation_approval(
        workflow_id="test_workflow_id",
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="approver_456",
        workflow_requester="user_123",
        status=ImplementationApprovalStatus.APPROVED
    )


def test_workflow_creation(governance_service):
    """Test create_workflow() returns workflow in REQUESTED state with valid workflow_id."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        purpose="Create enhanced intro block"
    )
    
    assert workflow.workflow_id is not None
    assert len(workflow.workflow_id) > 0
    assert workflow.specification_id == "I7"  # Target version (e.g., "I7", "C3")
    assert workflow.target_family == "Introduction"
    assert workflow.target_version == "I7"
    assert workflow.requester_id == "user_123"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert workflow.gate_results["purpose"] == "Create enhanced intro block"
    assert len(workflow.state_history) == 1
    assert workflow.state_history[0].to_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[0].triggered_by == "system"


def test_workflow_retrieval(governance_service, sample_workflow):
    """Test get_workflow() returns correct workflow, returns None for missing ID."""
    # Test successful retrieval
    retrieved = governance_service.get_workflow(sample_workflow.workflow_id)
    assert retrieved is not None
    assert retrieved.workflow_id == sample_workflow.workflow_id
    assert retrieved.target_family == "Introduction"
    
    # Test missing workflow
    missing = governance_service.get_workflow("nonexistent_id")
    assert missing is None


def test_transition_validation_valid(governance_service, sample_workflow):
    """Test validate_transition() accepts valid transitions."""
    # REQUESTED -> DISCOVERY is valid
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    assert is_valid is True
    assert reason == ""


def test_transition_validation_invalid(governance_service, sample_workflow):
    """Test validate_transition() rejects invalid transitions."""
    # REQUESTED -> IMPLEMENTING is invalid (skips states)
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.IMPLEMENTING
    )
    assert is_valid is False
    assert "Invalid transition" in reason


def test_transition_validation_terminal(governance_service):
    """Test validate_transition() blocks transitions from terminal states."""
    # Create workflow in CERTIFIED state
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Force to terminal state
    workflow.current_state = CanonicalWorkflowState.CERTIFIED
    
    # Try to transition from CERTIFIED (should fail)
    is_valid, reason = governance_service.validate_transition(
        workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    assert is_valid is False
    assert "terminal state" in reason


def test_state_transition_execution(governance_service, sample_workflow):
    """Test transition_state() updates current_state, appends to state_history, sets updated_at."""
    initial_updated_at = sample_workflow.updated_at
    
    # Transition from REQUESTED to DISCOVERY
    updated_workflow = governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.DISCOVERY,
        triggered_by="system",
        evidence_id="evidence_123",
        reason="Discovery agents completed"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.DISCOVERY
    assert len(updated_workflow.state_history) == 2
    assert updated_workflow.state_history[-1].from_state == CanonicalWorkflowState.REQUESTED
    assert updated_workflow.state_history[-1].to_state == CanonicalWorkflowState.DISCOVERY
    assert updated_workflow.state_history[-1].triggered_by == "system"
    assert updated_workflow.state_history[-1].evidence_id == "evidence_123"
    assert updated_workflow.updated_at > initial_updated_at


def test_state_transition_terminal_status(governance_service, sample_workflow):
    """Test transition_state() sets final_status for terminal states."""
    # Transition to CERTIFIED
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Force to AWAITING_GATE_2 (allows transition to CERTIFIED)
    workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    
    # Transition to CERTIFIED
    updated = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.CERTIFIED,
        triggered_by="user_123",
        reason="Final approval granted"
    )
    
    assert updated.current_state == CanonicalWorkflowState.CERTIFIED
    assert updated.final_status == "CERTIFIED"


def test_implementing_authorization_missing_approval(governance_service):
    """Test transition_state() to IMPLEMENTING blocks if approval missing."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Force to AWAITING_IMPLEMENTATION_APPROVAL
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "a" * 64
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Try to transition to IMPLEMENTING without approval
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system",
            reason="Attempting implementation"
        )
    
    assert "Authorization failed" in str(exc_info.value)
    assert "No implementation approval" in str(exc_info.value)


def test_implementing_authorization_hash_mismatch(governance_service):
    """Test transition_state() to IMPLEMENTING blocks on hash mismatch."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Set up workflow
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "a" * 64
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Create approval with DIFFERENT hash
    approval = create_implementation_approval(
        workflow_id=workflow.workflow_id,
        candidate_sha256="x" * 64,  # Mismatched hash
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="approver_456",
        workflow_requester="user_123",
        status=ImplementationApprovalStatus.APPROVED
    )
    governance_service.register_approval(workflow.workflow_id, approval)
    
    # Try to transition (should fail due to hash mismatch)
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system",
            reason="Attempting implementation"
        )
    
    assert "Authorization failed" in str(exc_info.value)
    assert "hash mismatch" in str(exc_info.value).lower()


def test_implementing_authorization_self_approval(governance_service):
    """Test transition_state() to IMPLEMENTING blocks self-approval."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Set up workflow
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "a" * 64
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Create approval with SAME user as requester (self-approval)
    approval = create_implementation_approval(
        workflow_id=workflow.workflow_id,
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="user_123",  # Same as requester
        workflow_requester="user_123",
        status=ImplementationApprovalStatus.APPROVED
    )
    governance_service.register_approval(workflow.workflow_id, approval)
    
    # Try to transition (should fail due to self-approval)
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system",
            reason="Attempting implementation"
        )
    
    assert "Authorization failed" in str(exc_info.value)


def test_implementing_authorization_success(governance_service):
    """Test transition_state() to IMPLEMENTING succeeds with valid approval."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Set up workflow
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "a" * 64
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Create valid approval
    approval = create_implementation_approval(
        workflow_id=workflow.workflow_id,
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="approver_456",  # Different from requester
        workflow_requester="user_123",
        status=ImplementationApprovalStatus.APPROVED
    )
    governance_service.register_approval(workflow.workflow_id, approval)
    
    # Transition should succeed
    updated = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.IMPLEMENTING,
        triggered_by="system",
        reason="Authorization passed"
    )
    
    assert updated.current_state == CanonicalWorkflowState.IMPLEMENTING


def test_approval_registration(governance_service, sample_workflow, sample_approval):
    """Test register_approval() sets approval_id on workflow."""
    governance_service.register_approval(sample_workflow.workflow_id, sample_approval)
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.approval_id == sample_approval.approval_id


def test_artifact_binding_contract(governance_service, sample_workflow):
    """Test bind_artifact() sets correct ID and hash for contract."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="contract",
        artifact_id="contract_abc123",
        artifact_sha256="a" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.contract_id == "contract_abc123"
    assert workflow.contract_sha256 == "a" * 64


def test_artifact_binding_candidate(governance_service, sample_workflow):
    """Test bind_artifact() sets correct ID and hash for candidate."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="candidate",
        artifact_id="candidate_xyz789",
        artifact_sha256="b" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.candidate_id == "candidate_xyz789"
    assert workflow.candidate_sha256 == "b" * 64


def test_artifact_binding_manifest(governance_service, sample_workflow):
    """Test bind_artifact() sets correct ID and hash for manifest."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="manifest",
        artifact_id="manifest_def456",
        artifact_sha256="c" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.manifest_id == "manifest_def456"
    assert workflow.manifest_sha256 == "c" * 64


def test_artifact_binding_snapshot(governance_service, sample_workflow):
    """Test bind_artifact() sets correct ID and hash for snapshot."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="snapshot",
        artifact_id="snapshot_ghi789",
        artifact_sha256="d" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.snapshot_id == "snapshot_ghi789"
    assert workflow.snapshot_sha256 == "d" * 64


def test_artifact_binding_invalid_type(governance_service, sample_workflow):
    """Test bind_artifact() raises ValueError for invalid artifact type."""
    with pytest.raises(ValueError) as exc_info:
        governance_service.bind_artifact(
            workflow_id=sample_workflow.workflow_id,
            artifact_type="invalid_type",
            artifact_id="some_id",
            artifact_sha256="e" * 64
        )
    
    assert "Invalid artifact type" in str(exc_info.value)


def test_artifact_binding_missing_workflow(governance_service):
    """Test bind_artifact() raises ValueError for missing workflow."""
    with pytest.raises(ValueError) as exc_info:
        governance_service.bind_artifact(
            workflow_id="nonexistent_workflow",
            artifact_type="contract",
            artifact_id="contract_123",
            artifact_sha256="f" * 64
        )
    
    assert "Workflow not found" in str(exc_info.value)
