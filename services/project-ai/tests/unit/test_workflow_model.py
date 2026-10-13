"""
Unit tests for ProjectLLMWorkflow model - M2.9 Wave 0

Tests workflow data model including state transitions, terminal state detection,
gate state detection, artifact binding, and serialization.
"""

import pytest
from datetime import datetime, timezone

from app.models.workflow import ProjectLLMWorkflow, StateTransition
from app.orchestration.canonical_workflow import CanonicalWorkflowState


def test_state_transition_creation():
    """Test StateTransition dataclass creation and fields."""
    now = datetime.now(timezone.utc)
    transition = StateTransition(
        from_state=CanonicalWorkflowState.REQUESTED,
        to_state=CanonicalWorkflowState.DISCOVERY,
        timestamp=now,
        triggered_by="system",
        evidence_id="ev_123",
        reason="Discovery completed"
    )
    
    assert transition.from_state == CanonicalWorkflowState.REQUESTED
    assert transition.to_state == CanonicalWorkflowState.DISCOVERY
    assert transition.timestamp == now
    assert transition.triggered_by == "system"
    assert transition.evidence_id == "ev_123"
    assert transition.reason == "Discovery completed"


def test_state_transition_serialization():
    """Test StateTransition to_dict() serialization."""
    now = datetime.now(timezone.utc)
    transition = StateTransition(
        from_state=CanonicalWorkflowState.REQUESTED,
        to_state=CanonicalWorkflowState.DISCOVERY,
        timestamp=now,
        triggered_by="system",
        evidence_id="ev_123",
        reason="Discovery completed"
    )
    
    transition_dict = transition.to_dict()
    
    assert transition_dict["from_state"] == "REQUESTED"
    assert transition_dict["to_state"] == "DISCOVERY"
    assert transition_dict["timestamp"] == now.isoformat()
    assert transition_dict["triggered_by"] == "system"
    assert transition_dict["evidence_id"] == "ev_123"
    assert transition_dict["reason"] == "Discovery completed"


def test_state_transition_no_from_state():
    """Test StateTransition with None from_state (initial transition)."""
    now = datetime.now(timezone.utc)
    transition = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system",
        reason="Workflow created"
    )
    
    transition_dict = transition.to_dict()
    assert transition_dict["from_state"] is None
    assert transition_dict["to_state"] == "REQUESTED"


def test_workflow_creation():
    """Test ProjectLLMWorkflow initialization with all required fields."""
    now = datetime.now(timezone.utc)
    transition = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system",
        reason="Workflow created"
    )
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.REQUESTED,
        state_history=[transition],
        created_at=now,
        updated_at=now
    )
    
    assert workflow.workflow_id == "wf_123"
    assert workflow.specification_id == "I7"
    assert workflow.target_family == "Introduction"
    assert workflow.target_version == "I7"
    assert workflow.requester_id == "user_alice"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert len(workflow.state_history) == 1
    assert workflow.created_at == now
    assert workflow.updated_at == now


def test_is_terminal_certified():
    """Test is_terminal() returns True for CERTIFIED state."""
    now = datetime.now(timezone.utc)
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.CERTIFIED,
        created_at=now,
        updated_at=now
    )
    
    assert workflow.is_terminal() is True


def test_is_terminal_rejected():
    """Test is_terminal() returns True for REJECTED state."""
    now = datetime.now(timezone.utc)
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.REJECTED,
        created_at=now,
        updated_at=now
    )
    
    assert workflow.is_terminal() is True


def test_is_terminal_non_terminal_state():
    """Test is_terminal() returns False for non-terminal states."""
    now = datetime.now(timezone.utc)
    non_terminal_states = [
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.BRIEF_READY,
        CanonicalWorkflowState.AWAITING_GATE_1,
        CanonicalWorkflowState.GUI_APPROVED,
        CanonicalWorkflowState.IMPLEMENTING,
    ]
    
    for state in non_terminal_states:
        workflow = ProjectLLMWorkflow(
            workflow_id="wf_123",
            specification_id="I7",
            target_family="Introduction",
            target_version="I7",
            requester_id="user_alice",
            current_state=state,
            created_at=now,
            updated_at=now
        )
        
        assert workflow.is_terminal() is False, f"State {state.value} should not be terminal"


def test_requires_approval_gate_states():
    """Test requires_approval() returns True for all gate states."""
    now = datetime.now(timezone.utc)
    gate_states = [
        CanonicalWorkflowState.AWAITING_GATE_1,
        CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL,
        CanonicalWorkflowState.AWAITING_GATE_2,
    ]
    
    for state in gate_states:
        workflow = ProjectLLMWorkflow(
            workflow_id="wf_123",
            specification_id="I7",
            target_family="Introduction",
            target_version="I7",
            requester_id="user_alice",
            current_state=state,
            created_at=now,
            updated_at=now
        )
        
        assert workflow.requires_approval() is True, f"State {state.value} should require approval"


def test_requires_approval_non_gate_states():
    """Test requires_approval() returns False for non-gate states."""
    now = datetime.now(timezone.utc)
    non_gate_states = [
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.BRIEF_READY,
        CanonicalWorkflowState.GUI_APPROVED,
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.CERTIFIED,
        CanonicalWorkflowState.REJECTED,
    ]
    
    for state in non_gate_states:
        workflow = ProjectLLMWorkflow(
            workflow_id="wf_123",
            specification_id="I7",
            target_family="Introduction",
            target_version="I7",
            requester_id="user_alice",
            current_state=state,
            created_at=now,
            updated_at=now
        )
        
        assert workflow.requires_approval() is False, f"State {state.value} should not require approval"


def test_artifact_binding():
    """Test setting artifact IDs and hashes."""
    now = datetime.now(timezone.utc)
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.REQUESTED,
        created_at=now,
        updated_at=now
    )
    
    # Bind contract
    workflow.contract_id = "contract_abc"
    workflow.contract_sha256 = "a" * 64
    
    # Bind candidate
    workflow.candidate_id = "candidate_xyz"
    workflow.candidate_sha256 = "b" * 64
    
    # Bind manifest
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "c" * 64
    
    # Bind snapshot
    workflow.snapshot_id = "snapshot_456"
    workflow.snapshot_sha256 = "d" * 64
    
    assert workflow.contract_id == "contract_abc"
    assert workflow.contract_sha256 == "a" * 64
    assert workflow.candidate_id == "candidate_xyz"
    assert workflow.candidate_sha256 == "b" * 64
    assert workflow.manifest_id == "manifest_123"
    assert workflow.manifest_sha256 == "c" * 64
    assert workflow.snapshot_id == "snapshot_456"
    assert workflow.snapshot_sha256 == "d" * 64


def test_state_history_tracking():
    """Test appending StateTransition records to state_history."""
    now = datetime.now(timezone.utc)
    
    transition1 = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system",
        reason="Workflow created"
    )
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.REQUESTED,
        state_history=[transition1],
        created_at=now,
        updated_at=now
    )
    
    # Add second transition
    transition2 = StateTransition(
        from_state=CanonicalWorkflowState.REQUESTED,
        to_state=CanonicalWorkflowState.DISCOVERY,
        timestamp=now,
        triggered_by="system",
        reason="Discovery started"
    )
    workflow.state_history.append(transition2)
    
    assert len(workflow.state_history) == 2
    assert workflow.state_history[0].to_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[1].to_state == CanonicalWorkflowState.DISCOVERY


def test_serialization():
    """Test to_dict() serialization includes all fields with correct structure."""
    now = datetime.now(timezone.utc)
    
    transition = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system",
        reason="Workflow created"
    )
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.REQUESTED,
        state_history=[transition],
        contract_id="contract_abc",
        contract_sha256="a" * 64,
        candidate_id="candidate_xyz",
        candidate_sha256="b" * 64,
        manifest_id="manifest_123",
        manifest_sha256="c" * 64,
        snapshot_id="snapshot_456",
        snapshot_sha256="d" * 64,
        approval_id="approval_789",
        gate_results={"purpose": "Test workflow"},
        evidence_ids=["ev_1", "ev_2"],
        created_at=now,
        updated_at=now,
        final_status=None
    )
    
    workflow_dict = workflow.to_dict()
    
    # Check top-level fields
    assert workflow_dict["workflow_id"] == "wf_123"
    assert workflow_dict["specification_id"] == "I7"
    assert workflow_dict["requester_id"] == "user_alice"
    assert workflow_dict["approval_id"] == "approval_789"
    assert workflow_dict["final_status"] is None
    
    # Check target
    assert workflow_dict["target"]["family"] == "Introduction"
    assert workflow_dict["target"]["version"] == "I7"
    
    # Check state
    assert workflow_dict["state"]["current"] == "REQUESTED"
    assert workflow_dict["state"]["is_terminal"] is False
    assert workflow_dict["state"]["requires_approval"] is False
    
    # Check artifacts
    assert workflow_dict["artifacts"]["contract"]["id"] == "contract_abc"
    assert workflow_dict["artifacts"]["contract"]["sha256"] == "a" * 64
    assert workflow_dict["artifacts"]["candidate"]["id"] == "candidate_xyz"
    assert workflow_dict["artifacts"]["candidate"]["sha256"] == "b" * 64
    assert workflow_dict["artifacts"]["manifest"]["id"] == "manifest_123"
    assert workflow_dict["artifacts"]["manifest"]["sha256"] == "c" * 64
    assert workflow_dict["artifacts"]["snapshot"]["id"] == "snapshot_456"
    assert workflow_dict["artifacts"]["snapshot"]["sha256"] == "d" * 64
    
    # Check gate results and evidence
    assert workflow_dict["gate_results"] == {"purpose": "Test workflow"}
    assert workflow_dict["evidence_ids"] == ["ev_1", "ev_2"]
    
    # Check state history
    assert len(workflow_dict["state_history"]) == 1
    assert workflow_dict["state_history"][0]["to_state"] == "REQUESTED"
    
    # Check timestamps
    assert workflow_dict["created_at"] == now.isoformat()
    assert workflow_dict["updated_at"] == now.isoformat()


def test_final_status_set_on_terminal_state():
    """Test final_status field for terminal states."""
    now = datetime.now(timezone.utc)
    
    # CERTIFIED workflow
    certified_workflow = ProjectLLMWorkflow(
        workflow_id="wf_cert",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.CERTIFIED,
        created_at=now,
        updated_at=now,
        final_status="CERTIFIED"
    )
    
    assert certified_workflow.final_status == "CERTIFIED"
    assert certified_workflow.is_terminal() is True
    
    # REJECTED workflow
    rejected_workflow = ProjectLLMWorkflow(
        workflow_id="wf_rej",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice",
        current_state=CanonicalWorkflowState.REJECTED,
        created_at=now,
        updated_at=now,
        final_status="REJECTED"
    )
    
    assert rejected_workflow.final_status == "REJECTED"
    assert rejected_workflow.is_terminal() is True
