"""
Unit tests for WorkflowGovernanceService - M2.9 Wave 0

Tests workflow creation, retrieval, transition validation, state transitions,
IMPLEMENTING authorization, approval registration, and artifact binding.
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
    """Create a fresh governance service for each test."""
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
def sample_approval(sample_workflow):
    """Create a sample approval for testing."""
    return create_implementation_approval(
        workflow_id=sample_workflow.workflow_id,
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="approver_456",
        workflow_requester="user_123",
        status=ImplementationApprovalStatus.APPROVED
    )


def test_create_workflow(governance_service):
    """Test workflow creation returns workflow in REQUESTED state."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        purpose="Create new intro block"
    )
    
    assert workflow.workflow_id is not None
    assert len(workflow.workflow_id) > 0
    assert workflow.specification_id == "I7"
    assert workflow.target_family == "Introduction"
    assert workflow.target_version == "I7"
    assert workflow.requester_id == "user_123"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert len(workflow.state_history) == 1
    assert workflow.state_history[0].to_state == CanonicalWorkflowState.REQUESTED
    assert workflow.gate_results.get("purpose") == "Create new intro block"


def test_get_workflow(governance_service, sample_workflow):
    """Test workflow retrieval returns correct workflow."""
    retrieved = governance_service.get_workflow(sample_workflow.workflow_id)
    
    assert retrieved is not None
    assert retrieved.workflow_id == sample_workflow.workflow_id
    assert retrieved.current_state == CanonicalWorkflowState.REQUESTED


def test_get_workflow_missing(governance_service):
    """Test get_workflow returns None for missing workflow_id."""
    result = governance_service.get_workflow("nonexistent_id")
    assert result is None


def test_validate_transition_valid(governance_service, sample_workflow):
    """Test validate_transition accepts valid transitions."""
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is True
    assert reason == ""


def test_validate_transition_invalid(governance_service, sample_workflow):
    """Test validate_transition rejects invalid transitions."""
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.CERTIFIED  # Cannot go directly from REQUESTED to CERTIFIED
    )
    
    assert is_valid is False
    assert "Invalid transition" in reason


def test_validate_transition_terminal_state(governance_service, sample_workflow):
    """Test validate_transition blocks transitions from terminal states."""
    # Manually set workflow to terminal state
    sample_workflow.current_state = CanonicalWorkflowState.CERTIFIED
    
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is False
    assert "terminal state" in reason


def test_validate_transition_missing_workflow(governance_service):
    """Test validate_transition returns error for missing workflow."""
    is_valid, reason = governance_service.validate_transition(
        "nonexistent_id",
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is False
    assert "not found" in reason


def test_transition_state_success(governance_service, sample_workflow):
    """Test transition_state updates current_state and appends to history."""
    workflow = governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.DISCOVERY,
        triggered_by="system",
        reason="Discovery agents completed"
    )
    
    assert workflow.current_state == CanonicalWorkflowState.DISCOVERY
    assert len(workflow.state_history) == 2
    assert workflow.state_history[1].from_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[1].to_state == CanonicalWorkflowState.DISCOVERY
    assert workflow.state_history[1].triggered_by == "system"
    assert workflow.state_history[1].reason == "Discovery agents completed"


def test_transition_state_sets_final_status(governance_service, sample_workflow):
    """Test transition_state sets final_status for terminal states."""
    # Manually advance to a state that can transition to REJECTED
    sample_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_1
    
    workflow = governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by="user_123",
        reason="User rejected GUI"
    )
    
    assert workflow.current_state == CanonicalWorkflowState.REJECTED
    assert workflow.final_status == "REJECTED"


def test_transition_state_invalid_raises_error(governance_service, sample_workflow):
    """Test transition_state raises ValueError for invalid transitions."""
    with pytest.raises(ValueError, match="Invalid transition"):
        governance_service.transition_state(
            workflow_id=sample_workflow.workflow_id,
            to_state=CanonicalWorkflowState.CERTIFIED,
            triggered_by="system"
        )


def test_transition_to_implementing_without_approval(governance_service, sample_workflow):
    """Test transition to IMPLEMENTING fails without approval."""
    # Advance to AWAITING_IMPLEMENTATION_APPROVAL
    sample_workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    sample_workflow.candidate_sha256 = "a" * 64
    sample_workflow.manifest_id = "manifest_123"
    sample_workflow.manifest_sha256 = "b" * 64
    
    with pytest.raises(ValueError, match="Authorization failed"):
        governance_service.transition_state(
            workflow_id=sample_workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )


def test_transition_to_implementing_with_approval(governance_service, sample_workflow, sample_approval):
    """Test transition to IMPLEMENTING succeeds with valid approval."""
    # Register approval
    governance_service.register_approval(sample_workflow.workflow_id, sample_approval)
    
    # Set workflow state and artifacts
    sample_workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    sample_workflow.candidate_sha256 = "a" * 64
    sample_workflow.manifest_id = "manifest_123"
    sample_workflow.manifest_sha256 = "b" * 64
    
    workflow = governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.IMPLEMENTING,
        triggered_by="system"
    )
    
    assert workflow.current_state == CanonicalWorkflowState.IMPLEMENTING


def test_transition_to_implementing_hash_mismatch(governance_service, sample_workflow, sample_approval):
    """Test transition to IMPLEMENTING fails with hash mismatch."""
    governance_service.register_approval(sample_workflow.workflow_id, sample_approval)
    
    sample_workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    sample_workflow.candidate_sha256 = "wrong_hash"  # Mismatch!
    sample_workflow.manifest_id = "manifest_123"
    sample_workflow.manifest_sha256 = "b" * 64
    
    with pytest.raises(ValueError, match="Candidate hash mismatch"):
        governance_service.transition_state(
            workflow_id=sample_workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )


def test_register_approval(governance_service, sample_workflow, sample_approval):
    """Test register_approval sets approval_id on workflow."""
    governance_service.register_approval(sample_workflow.workflow_id, sample_approval)
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.approval_id == sample_approval.approval_id


def test_register_approval_missing_workflow(governance_service, sample_approval):
    """Test register_approval raises error for missing workflow."""
    with pytest.raises(ValueError, match="not found"):
        governance_service.register_approval("nonexistent_id", sample_approval)


def test_bind_artifact_contract(governance_service, sample_workflow):
    """Test bind_artifact sets contract ID and hash."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="contract",
        artifact_id="contract_abc",
        artifact_sha256="a" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.contract_id == "contract_abc"
    assert workflow.contract_sha256 == "a" * 64


def test_bind_artifact_candidate(governance_service, sample_workflow):
    """Test bind_artifact sets candidate ID and hash."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="candidate",
        artifact_id="candidate_xyz",
        artifact_sha256="b" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.candidate_id == "candidate_xyz"
    assert workflow.candidate_sha256 == "b" * 64


def test_bind_artifact_manifest(governance_service, sample_workflow):
    """Test bind_artifact sets manifest ID and hash."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="manifest",
        artifact_id="manifest_123",
        artifact_sha256="c" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.manifest_id == "manifest_123"
    assert workflow.manifest_sha256 == "c" * 64


def test_bind_artifact_snapshot(governance_service, sample_workflow):
    """Test bind_artifact sets snapshot ID and hash."""
    governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="snapshot",
        artifact_id="snapshot_456",
        artifact_sha256="d" * 64
    )
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.snapshot_id == "snapshot_456"
    assert workflow.snapshot_sha256 == "d" * 64


def test_bind_artifact_invalid_type(governance_service, sample_workflow):
    """Test bind_artifact raises error for invalid artifact type."""
    with pytest.raises(ValueError, match="Invalid artifact type"):
        governance_service.bind_artifact(
            workflow_id=sample_workflow.workflow_id,
            artifact_type="invalid_type",
            artifact_id="some_id",
            artifact_sha256="e" * 64
        )


def test_bind_artifact_missing_workflow(governance_service):
    """Test bind_artifact raises error for missing workflow."""
    with pytest.raises(ValueError, match="not found"):
        governance_service.bind_artifact(
            workflow_id="nonexistent_id",
            artifact_type="contract",
            artifact_id="contract_abc",
            artifact_sha256="a" * 64
        )
