"""
Unit tests for WorkflowGovernanceService - M2.9 Wave 0

Tests governance service for workflow creation, state transition validation,
authorization gates, approval registration, and artifact binding.
"""

import pytest
from datetime import datetime, timezone

from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.implementation_approval import (
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
        requester_id="user_alice",
        purpose="Test workflow"
    )


@pytest.fixture
def sample_approval():
    """Create a sample ImplementationApproval for testing."""
    return create_implementation_approval(
        workflow_id="wf_test",
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="user_bob",
        workflow_requester="user_alice",
        status=ImplementationApprovalStatus.APPROVED
    )


def test_create_workflow(governance_service):
    """Test create_workflow() returns workflow in REQUESTED state with valid workflow_id."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        purpose="Create new intro block"
    )
    
    assert workflow.workflow_id is not None
    assert len(workflow.workflow_id) > 0
    assert workflow.specification_id == "I7"
    assert workflow.target_family == "Introduction"
    assert workflow.target_version == "I7"
    assert workflow.requester_id == "user_alice"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert len(workflow.state_history) == 1
    assert workflow.state_history[0].to_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[0].triggered_by == "system"
    assert workflow.gate_results["purpose"] == "Create new intro block"


def test_create_workflow_without_purpose(governance_service):
    """Test create_workflow() without optional purpose parameter."""
    workflow = governance_service.create_workflow(
        target_family="Concept",
        target_version="C3",
        requester_id="user_bob"
    )
    
    assert workflow.workflow_id is not None
    assert workflow.specification_id == "C3"
    assert workflow.target_family == "Concept"
    assert workflow.target_version == "C3"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert "purpose" not in workflow.gate_results


def test_get_workflow(governance_service, sample_workflow):
    """Test get_workflow() returns correct workflow."""
    retrieved = governance_service.get_workflow(sample_workflow.workflow_id)
    
    assert retrieved is not None
    assert retrieved.workflow_id == sample_workflow.workflow_id
    assert retrieved.specification_id == sample_workflow.specification_id
    assert retrieved.current_state == sample_workflow.current_state


def test_get_workflow_not_found(governance_service):
    """Test get_workflow() returns None for missing workflow_id."""
    retrieved = governance_service.get_workflow("nonexistent_workflow")
    
    assert retrieved is None


def test_validate_transition_valid(governance_service, sample_workflow):
    """Test validate_transition() accepts valid transitions."""
    # REQUESTED -> DISCOVERY is valid
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is True
    assert reason == ""


def test_validate_transition_invalid_state_machine(governance_service, sample_workflow):
    """Test validate_transition() rejects invalid transitions per state machine."""
    # REQUESTED -> IMPLEMENTING is invalid (skips states)
    is_valid, reason = governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.IMPLEMENTING
    )
    
    assert is_valid is False
    assert "Invalid transition" in reason
    assert "REQUESTED -> IMPLEMENTING" in reason


def test_validate_transition_workflow_not_found(governance_service):
    """Test validate_transition() fails for nonexistent workflow."""
    is_valid, reason = governance_service.validate_transition(
        "nonexistent_workflow",
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is False
    assert "Workflow not found" in reason


def test_validate_transition_from_terminal_state(governance_service):
    """Test validate_transition() blocks transitions from terminal states."""
    # Create workflow in CERTIFIED terminal state
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Manually set to terminal state for testing
    workflow.current_state = CanonicalWorkflowState.CERTIFIED
    workflow.final_status = "CERTIFIED"
    
    # Attempt transition from terminal state
    is_valid, reason = governance_service.validate_transition(
        workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is False
    assert "terminal state" in reason
    assert "CERTIFIED" in reason


def test_transition_state_success(governance_service, sample_workflow):
    """Test transition_state() updates current_state and appends to state_history."""
    initial_update_time = sample_workflow.updated_at
    
    updated_workflow = governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.DISCOVERY,
        triggered_by="system",
        evidence_id="ev_123",
        reason="Discovery completed"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.DISCOVERY
    assert len(updated_workflow.state_history) == 2
    assert updated_workflow.state_history[1].from_state == CanonicalWorkflowState.REQUESTED
    assert updated_workflow.state_history[1].to_state == CanonicalWorkflowState.DISCOVERY
    assert updated_workflow.state_history[1].triggered_by == "system"
    assert updated_workflow.state_history[1].evidence_id == "ev_123"
    assert updated_workflow.state_history[1].reason == "Discovery completed"
    assert updated_workflow.updated_at > initial_update_time


def test_transition_state_sets_final_status(governance_service, sample_workflow):
    """Test transition_state() sets final_status for terminal states."""
    # Manually advance to a state that can transition to REJECTED
    sample_workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_1
    
    updated_workflow = governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by="user_alice",
        reason="User rejected"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.REJECTED
    assert updated_workflow.final_status == "REJECTED"
    assert updated_workflow.is_terminal() is True


def test_transition_state_invalid_raises_error(governance_service, sample_workflow):
    """Test transition_state() raises ValueError on invalid transition."""
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=sample_workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )
    
    assert "Invalid transition" in str(exc_info.value)


def test_transition_to_implementing_requires_authorization(governance_service):
    """Test transition to IMPLEMENTING calls can_transition_to_implementing()."""
    # Create workflow and advance to AWAITING_IMPLEMENTATION_APPROVAL
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Manually set state for testing (normally done through proper flow)
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "a" * 64
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Attempt transition without approval - should fail
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )
    
    assert "Authorization failed" in str(exc_info.value)
    assert "No implementation approval found" in str(exc_info.value)


def test_transition_to_implementing_with_approval_succeeds(governance_service):
    """Test transition to IMPLEMENTING succeeds with valid approval."""
    # Create workflow and advance to AWAITING_IMPLEMENTATION_APPROVAL
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Set required artifacts
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "a" * 64
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Create and register approval
    approval = create_implementation_approval(
        workflow_id=workflow.workflow_id,
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="user_bob",
        workflow_requester="user_alice",
        status=ImplementationApprovalStatus.APPROVED
    )
    governance_service.register_approval(workflow.workflow_id, approval)
    
    # Now transition should succeed
    updated_workflow = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.IMPLEMENTING,
        triggered_by="system"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.IMPLEMENTING


def test_transition_to_implementing_rejects_hash_mismatch(governance_service):
    """Test IMPLEMENTING transition rejects if candidate hash mismatches."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    workflow.candidate_sha256 = "wrong_hash"  # Wrong hash
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "b" * 64
    
    # Create approval with correct hash
    approval = create_implementation_approval(
        workflow_id=workflow.workflow_id,
        candidate_sha256="a" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        approved_by="user_bob",
        workflow_requester="user_alice",
        status=ImplementationApprovalStatus.APPROVED
    )
    governance_service.register_approval(workflow.workflow_id, approval)
    
    # Transition should fail due to hash mismatch
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )
    
    assert "Authorization failed" in str(exc_info.value)
    assert "Candidate hash mismatch" in str(exc_info.value)


def test_register_approval(governance_service, sample_workflow, sample_approval):
    """Test register_approval() sets approval_id on workflow."""
    governance_service.register_approval(sample_workflow.workflow_id, sample_approval)
    
    workflow = governance_service.get_workflow(sample_workflow.workflow_id)
    assert workflow.approval_id == sample_approval.approval_id


def test_register_approval_workflow_not_found(governance_service, sample_approval):
    """Test register_approval() raises ValueError if workflow not found."""
    with pytest.raises(ValueError) as exc_info:
        governance_service.register_approval("nonexistent_workflow", sample_approval)
    
    assert "Workflow not found" in str(exc_info.value)


def test_bind_artifact_contract(governance_service, sample_workflow):
    """Test bind_artifact() sets contract ID and hash."""
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
    """Test bind_artifact() sets candidate ID and hash."""
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
    """Test bind_artifact() sets manifest ID and hash."""
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
    """Test bind_artifact() sets snapshot ID and hash."""
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
    """Test bind_artifact() raises ValueError for invalid artifact type."""
    with pytest.raises(ValueError) as exc_info:
        governance_service.bind_artifact(
            workflow_id=sample_workflow.workflow_id,
            artifact_type="invalid_type",
            artifact_id="artifact_123",
            artifact_sha256="e" * 64
        )
    
    assert "Invalid artifact type" in str(exc_info.value)
    assert "invalid_type" in str(exc_info.value)


def test_bind_artifact_workflow_not_found(governance_service):
    """Test bind_artifact() raises ValueError if workflow not found."""
    with pytest.raises(ValueError) as exc_info:
        governance_service.bind_artifact(
            workflow_id="nonexistent_workflow",
            artifact_type="contract",
            artifact_id="contract_abc",
            artifact_sha256="a" * 64
        )
    
    assert "Workflow not found" in str(exc_info.value)


def test_list_workflows(governance_service):
    """Test list_workflows() returns all workflows."""
    # Create multiple workflows
    wf1 = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    wf2 = governance_service.create_workflow(
        target_family="Concept",
        target_version="C3",
        requester_id="user_bob"
    )
    
    wf3 = governance_service.create_workflow(
        target_family="Demo",
        target_version="D1",
        requester_id="user_charlie"
    )
    
    workflows = governance_service.list_workflows()
    
    assert len(workflows) == 3
    workflow_ids = {wf.workflow_id for wf in workflows}
    assert wf1.workflow_id in workflow_ids
    assert wf2.workflow_id in workflow_ids
    assert wf3.workflow_id in workflow_ids
