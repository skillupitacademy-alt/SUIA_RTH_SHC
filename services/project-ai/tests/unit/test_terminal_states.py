"""
Unit tests for terminal state enforcement and evidence requirements - M2.9 Wave 0

Tests terminal state detection, immutability, final_status setting, evidence binding,
and gate state detection.
"""

import pytest

from app.orchestration.canonical_workflow import (
    CanonicalWorkflowState,
    is_terminal_state,
    is_gate_state
)
from app.orchestration.workflow_governance import WorkflowGovernanceService


@pytest.fixture
def governance_service():
    """Create a fresh governance service for each test."""
    return WorkflowGovernanceService()


@pytest.mark.parametrize("state,expected", [
    (CanonicalWorkflowState.CERTIFIED, True),
    (CanonicalWorkflowState.REJECTED, True),
    (CanonicalWorkflowState.REQUESTED, False),
    (CanonicalWorkflowState.DISCOVERY, False),
    (CanonicalWorkflowState.AWAITING_GATE_1, False),
    (CanonicalWorkflowState.IMPLEMENTING, False),
])
def test_is_terminal_state(state, expected):
    """Test is_terminal_state returns True only for CERTIFIED and REJECTED."""
    assert is_terminal_state(state) == expected


def test_terminal_state_certified_immutability(governance_service):
    """Test validate_transition rejects all transitions from CERTIFIED state."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Manually set to CERTIFIED (terminal state)
    workflow.current_state = CanonicalWorkflowState.CERTIFIED
    
    # Try to transition to various states - all should be rejected
    test_states = [
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.REJECTED,
        CanonicalWorkflowState.IMPLEMENTING,
    ]
    
    for target_state in test_states:
        is_valid, reason = governance_service.validate_transition(
            workflow.workflow_id,
            target_state
        )
        assert is_valid is False
        assert "terminal state" in reason


def test_terminal_state_rejected_immutability(governance_service):
    """Test validate_transition rejects all transitions from REJECTED state."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Manually set to REJECTED (terminal state)
    workflow.current_state = CanonicalWorkflowState.REJECTED
    
    # Try to transition to various states - all should be rejected
    test_states = [
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.CERTIFIED,
        CanonicalWorkflowState.IMPLEMENTING,
    ]
    
    for target_state in test_states:
        is_valid, reason = governance_service.validate_transition(
            workflow.workflow_id,
            target_state
        )
        assert is_valid is False
        assert "terminal state" in reason


def test_transition_state_raises_from_terminal(governance_service):
    """Test transition_state raises ValueError when attempting transition from terminal state."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Set to terminal state
    workflow.current_state = CanonicalWorkflowState.CERTIFIED
    
    with pytest.raises(ValueError, match="terminal state"):
        governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.DISCOVERY,
            triggered_by="system"
        )


def test_final_status_certified(governance_service):
    """Test final_status set correctly when transitioning to CERTIFIED."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Advance to a state that can transition to CERTIFIED
    workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_2
    
    workflow = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.CERTIFIED,
        triggered_by="approver_456",
        reason="HAA certified"
    )
    
    assert workflow.current_state == CanonicalWorkflowState.CERTIFIED
    assert workflow.final_status == "CERTIFIED"


def test_final_status_rejected(governance_service):
    """Test final_status set correctly when transitioning to REJECTED."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Advance to a state that can transition to REJECTED
    workflow.current_state = CanonicalWorkflowState.AWAITING_GATE_1
    
    workflow = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by="user_123",
        reason="User rejected GUI"
    )
    
    assert workflow.current_state == CanonicalWorkflowState.REJECTED
    assert workflow.final_status == "REJECTED"


def test_evidence_binding(governance_service):
    """Test workflows can accumulate evidence_ids list."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Initially empty
    assert workflow.evidence_ids == []
    
    # Add evidence
    workflow.evidence_ids.append("evidence_1")
    workflow.evidence_ids.append("evidence_2")
    workflow.evidence_ids.append("evidence_3")
    
    assert len(workflow.evidence_ids) == 3
    assert workflow.evidence_ids == ["evidence_1", "evidence_2", "evidence_3"]


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
def test_is_gate_state(state, expected):
    """Test all three gate states properly identified by is_gate_state()."""
    assert is_gate_state(state) == expected


def test_transition_with_evidence_id(governance_service):
    """Test state transition can attach evidence_id for audit trail."""
    workflow = governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    workflow = governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.DISCOVERY,
        triggered_by="system",
        evidence_id="evidence_discovery_123",
        reason="Discovery completed with evidence"
    )
    
    # Check that evidence_id is recorded in state history
    assert len(workflow.state_history) == 2
    assert workflow.state_history[1].evidence_id == "evidence_discovery_123"
    assert workflow.state_history[1].reason == "Discovery completed with evidence"
