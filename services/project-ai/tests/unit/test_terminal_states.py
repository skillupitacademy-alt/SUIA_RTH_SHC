"""
Unit Tests for Terminal State Enforcement - M2.9 Wave 0

Tests for terminal state detection, immutability enforcement, and evidence requirements.
"""

import pytest
from datetime import datetime, timezone

from app.orchestration.canonical_workflow import (
    CanonicalWorkflowState,
    is_terminal_state,
    is_gate_state
)
from app.orchestration.workflow_governance import WorkflowGovernanceService


@pytest.fixture
def governance_service():
    """Create a fresh WorkflowGovernanceService for each test."""
    return WorkflowGovernanceService()


@pytest.mark.parametrize("state,expected", [
    (CanonicalWorkflowState.CERTIFIED, True),
    (CanonicalWorkflowState.REJECTED, True),
    (CanonicalWorkflowState.REQUESTED, False),
    (CanonicalWorkflowState.DISCOVERY, False),
    (CanonicalWorkflowState.IMPLEMENTING, False),
    (CanonicalWorkflowState.AWAITING_GATE_1, False),
])
def test_terminal_state_detection(state, expected):
    """Test is_terminal_state() returns True for CERTIFIED and REJECTED only."""
    assert is_terminal_state(state) == expected


def test_terminal_state_immutability_certified(governance_service):
    """Test validate_transition() rejects all transitions from CERTIFIED state."""
    # Create workflow and force to CERTIFIED
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    workflow.current_state = CanonicalWorkflowState.CERTIFIED
    
    # Try various transitions from CERTIFIED (all should fail)
    target_states = [
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.REJECTED,
    ]
    
    for target_state in target_states:
        is_valid, reason = governance_service.validate_transition(
            workflow.workflow_id,
            target_state
        )
        assert is_valid is False
        assert "terminal state" in reason


def test_terminal_state_immutability_rejected(governance_service):
    """Test validate_transition() rejects all transitions from REJECTED state."""
    # Create workflow and force to REJECTED
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    workflow.current_state = CanonicalWorkflowState.REJECTED
    
    # Try various transitions from REJECTED (all should fail)
    target_states = [
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.CERTIFIED,
    ]
    
    for target_state in target_states:
        is_valid, reason = governance_service.validate_transition(
            workflow.workflow_id,
            target_state
        )
        assert is_valid is False
        assert "terminal state" in reason


def test_transition_state_raises_from_terminal(governance_service):
    """Test transition_state raises ValueError when attempting to transition from terminal state."""
    # Create workflow and force to CERTIFIED
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    workflow.current_state = CanonicalWorkflowState.CERTIFIED
    
    # Attempt transition should raise ValueError
    with pytest.raises(ValueError) as exc_info:
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.DISCOVERY,
            triggered_by="system",
            reason="Trying to escape terminal state"
        )
    
    assert "terminal state" in str(exc_info.value)


def test_final_status_set_on_certified(governance_service):
    """Test final_status set correctly when transitioning to CERTIFIED state."""
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
    
    assert updated.final_status == "CERTIFIED"
    assert updated.is_terminal() is True


def test_final_status_set_on_rejected(governance_service):
    """Test final_status set correctly when transitioning to REJECTED state."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Force to AWAITING_GATE_1 (allows transition to REJECTED)
    workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_1
    
    # Transition to REJECTED
    updated = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by="user_123",
        reason="User rejected GUI prototype"
    )
    
    assert updated.final_status == "REJECTED"
    assert updated.is_terminal() is True


def test_evidence_binding(governance_service):
    """Test workflows can accumulate evidence_ids list."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Add evidence IDs
    workflow.evidence_ids.append("evidence_discovery_1")
    workflow.evidence_ids.append("evidence_discovery_2")
    workflow.evidence_ids.append("evidence_compliance_1")
    
    assert len(workflow.evidence_ids) == 3
    assert "evidence_discovery_1" in workflow.evidence_ids
    assert "evidence_discovery_2" in workflow.evidence_ids
    assert "evidence_compliance_1" in workflow.evidence_ids


@pytest.mark.parametrize("state,expected", [
    (CanonicalWorkflowState.AWAITING_GATE_1, True),
    (CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL, True),
    (CanonicalWorkflowState.AWAITING_GATE_2, True),
    (CanonicalWorkflowState.REQUESTED, False),
    (CanonicalWorkflowState.DISCOVERY, False),
    (CanonicalWorkflowState.IMPLEMENTING, False),
    (CanonicalWorkflowState.CERTIFIED, False),
    (CanonicalWorkflowState.REJECTED, False),
])
def test_gate_state_detection(state, expected):
    """Test all three gate states properly identified by is_gate_state()."""
    assert is_gate_state(state) == expected
