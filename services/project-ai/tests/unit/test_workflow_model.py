"""
Unit tests for ProjectLLMWorkflow model - M2.9 Wave 0

Tests workflow model creation, serialization, terminal state detection,
gate state detection, and artifact binding.
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
        evidence_id="evidence_123",
        reason="Discovery agents completed"
    )
    
    assert transition.from_state == CanonicalWorkflowState.REQUESTED
    assert transition.to_state == CanonicalWorkflowState.DISCOVERY
    assert transition.timestamp == now
    assert transition.triggered_by == "system"
    assert transition.evidence_id == "evidence_123"
    assert transition.reason == "Discovery agents completed"


def test_workflow_creation():
    """Test ProjectLLMWorkflow initialization with required fields."""
    now = datetime.now(timezone.utc)
    initial_transition = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system"
    )
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        state_history=[initial_transition],
        created_at=now,
        updated_at=now
    )
    
    assert workflow.workflow_id == "wf_123"
    assert workflow.specification_id == "I7"
    assert workflow.target_family == "Introduction"
    assert workflow.target_version == "I7"
    assert workflow.requester_id == "user_123"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert len(workflow.state_history) == 1
    assert workflow.created_at == now
    assert workflow.updated_at == now


def test_terminal_state_detection():
    """Test is_terminal() returns True for CERTIFIED and REJECTED."""
    now = datetime.now(timezone.utc)
    
    # CERTIFIED is terminal
    workflow_certified = ProjectLLMWorkflow(
        workflow_id="wf_cert",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.CERTIFIED,
        created_at=now,
        updated_at=now
    )
    assert workflow_certified.is_terminal() is True
    
    # REJECTED is terminal
    workflow_rejected = ProjectLLMWorkflow(
        workflow_id="wf_rej",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REJECTED,
        created_at=now,
        updated_at=now
    )
    assert workflow_rejected.is_terminal() is True
    
    # REQUESTED is not terminal
    workflow_requested = ProjectLLMWorkflow(
        workflow_id="wf_req",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        created_at=now,
        updated_at=now
    )
    assert workflow_requested.is_terminal() is False


def test_gate_state_detection():
    """Test requires_approval() returns True for gate states."""
    now = datetime.now(timezone.utc)
    
    # AWAITING_GATE_1 requires approval
    workflow_gate1 = ProjectLLMWorkflow(
        workflow_id="wf_g1",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.AWAITING_GATE_1,
        created_at=now,
        updated_at=now
    )
    assert workflow_gate1.requires_approval() is True
    
    # AWAITING_IMPLEMENTATION_APPROVAL requires approval
    workflow_impl = ProjectLLMWorkflow(
        workflow_id="wf_impl",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL,
        created_at=now,
        updated_at=now
    )
    assert workflow_impl.requires_approval() is True
    
    # AWAITING_GATE_2 requires approval
    workflow_gate2 = ProjectLLMWorkflow(
        workflow_id="wf_g2",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.AWAITING_GATE_2,
        created_at=now,
        updated_at=now
    )
    assert workflow_gate2.requires_approval() is True
    
    # DISCOVERY does not require approval
    workflow_discovery = ProjectLLMWorkflow(
        workflow_id="wf_disc",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.DISCOVERY,
        created_at=now,
        updated_at=now
    )
    assert workflow_discovery.requires_approval() is False


def test_artifact_binding():
    """Test artifact binding with IDs and hashes."""
    now = datetime.now(timezone.utc)
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        created_at=now,
        updated_at=now
    )
    
    # Initially no artifacts
    assert workflow.contract_id is None
    assert workflow.contract_sha256 is None
    
    # Bind contract
    workflow.contract_id = "contract_abc"
    workflow.contract_sha256 = "a" * 64
    assert workflow.contract_id == "contract_abc"
    assert workflow.contract_sha256 == "a" * 64
    
    # Bind candidate
    workflow.candidate_id = "candidate_xyz"
    workflow.candidate_sha256 = "b" * 64
    assert workflow.candidate_id == "candidate_xyz"
    assert workflow.candidate_sha256 == "b" * 64
    
    # Bind manifest
    workflow.manifest_id = "manifest_123"
    workflow.manifest_sha256 = "c" * 64
    assert workflow.manifest_id == "manifest_123"
    assert workflow.manifest_sha256 == "c" * 64
    
    # Bind snapshot
    workflow.snapshot_id = "snapshot_456"
    workflow.snapshot_sha256 = "d" * 64
    assert workflow.snapshot_id == "snapshot_456"
    assert workflow.snapshot_sha256 == "d" * 64


def test_state_history():
    """Test state history tracking with transitions."""
    now = datetime.now(timezone.utc)
    
    initial_transition = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system"
    )
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        state_history=[initial_transition],
        created_at=now,
        updated_at=now
    )
    
    # Initial state history has 1 entry
    assert len(workflow.state_history) == 1
    assert workflow.state_history[0].to_state == CanonicalWorkflowState.REQUESTED
    
    # Add transition to DISCOVERY
    discovery_transition = StateTransition(
        from_state=CanonicalWorkflowState.REQUESTED,
        to_state=CanonicalWorkflowState.DISCOVERY,
        timestamp=now,
        triggered_by="system",
        reason="Discovery agents completed"
    )
    workflow.state_history.append(discovery_transition)
    workflow.current_state = CanonicalWorkflowState.DISCOVERY
    
    assert len(workflow.state_history) == 2
    assert workflow.state_history[1].from_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[1].to_state == CanonicalWorkflowState.DISCOVERY


def test_serialization():
    """Test to_dict() serialization includes all fields."""
    now = datetime.now(timezone.utc)
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_123",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.AWAITING_GATE_1,
        created_at=now,
        updated_at=now
    )
    
    workflow.contract_id = "contract_abc"
    workflow.contract_sha256 = "a" * 64
    workflow.approval_id = "approval_123"
    workflow.gate_results = {"purpose": "Test workflow"}
    workflow.evidence_ids = ["evidence_1", "evidence_2"]
    
    data = workflow.to_dict()
    
    # Check structure
    assert data["workflow_id"] == "wf_123"
    assert data["specification_id"] == "I7"
    assert data["target"]["family"] == "Introduction"
    assert data["target"]["version"] == "I7"
    assert data["requester_id"] == "user_123"
    
    # Check state
    assert data["state"]["current"] == "AWAITING_GATE_1"
    assert data["state"]["is_terminal"] is False
    assert data["state"]["requires_approval"] is True
    
    # Check artifacts
    assert data["artifacts"]["contract"]["id"] == "contract_abc"
    assert data["artifacts"]["contract"]["sha256"] == "a" * 64
    assert data["artifacts"]["candidate"]["id"] is None
    
    # Check metadata
    assert data["approval_id"] == "approval_123"
    assert data["gate_results"] == {"purpose": "Test workflow"}
    assert data["evidence_ids"] == ["evidence_1", "evidence_2"]
    assert data["created_at"] == now.isoformat()
    assert data["updated_at"] == now.isoformat()
    assert data["final_status"] is None
