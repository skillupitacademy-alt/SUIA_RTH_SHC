"""
Unit Tests for ProjectLLMWorkflow Model - M2.9 Wave 0

Tests for workflow model data structures, terminal state detection,
gate state detection, artifact binding, and serialization.
"""

import pytest
from datetime import datetime, timezone

from app.models.workflow import ProjectLLMWorkflow, StateTransition
from app.orchestration.canonical_workflow import CanonicalWorkflowState


def test_workflow_creation():
    """Test ProjectLLMWorkflow initialization with all required fields."""
    workflow_id = "wf_test_123"
    now = datetime.now(timezone.utc)
    
    workflow = ProjectLLMWorkflow(
        workflow_id=workflow_id,
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        created_at=now,
        updated_at=now
    )
    
    assert workflow.workflow_id == workflow_id
    assert workflow.specification_id == "I7"
    assert workflow.target_family == "Introduction"
    assert workflow.target_version == "I7"
    assert workflow.requester_id == "user_123"
    assert workflow.current_state == CanonicalWorkflowState.REQUESTED
    assert workflow.created_at == now
    assert workflow.updated_at == now
    assert workflow.state_history == []
    assert workflow.contract_id is None
    assert workflow.candidate_id is None
    assert workflow.manifest_id is None
    assert workflow.snapshot_id is None
    assert workflow.approval_id is None
    assert workflow.gate_results == {}
    assert workflow.evidence_ids == []
    assert workflow.final_status is None


def test_terminal_state_detection():
    """Test is_terminal() returns True for CERTIFIED/REJECTED, False otherwise."""
    now = datetime.now(timezone.utc)
    
    # Test CERTIFIED is terminal
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
    
    # Test REJECTED is terminal
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
    
    # Test REQUESTED is not terminal
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
    
    # Test IMPLEMENTING is not terminal
    workflow_implementing = ProjectLLMWorkflow(
        workflow_id="wf_impl",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.IMPLEMENTING,
        created_at=now,
        updated_at=now
    )
    assert workflow_implementing.is_terminal() is False


def test_gate_state_detection():
    """Test requires_approval() returns True for gate states."""
    now = datetime.now(timezone.utc)
    
    # Test AWAITING_GATE_1 requires approval
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
    
    # Test AWAITING_IMPLEMENTATION_APPROVAL requires approval
    workflow_impl_approval = ProjectLLMWorkflow(
        workflow_id="wf_ia",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL,
        created_at=now,
        updated_at=now
    )
    assert workflow_impl_approval.requires_approval() is True
    
    # Test AWAITING_GATE_2 requires approval
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
    
    # Test REQUESTED does not require approval
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
    assert workflow_requested.requires_approval() is False


def test_artifact_binding():
    """Test artifact binding (set contract_id, candidate_id, manifest_id, snapshot_id with hashes)."""
    now = datetime.now(timezone.utc)
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_bind",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        created_at=now,
        updated_at=now
    )
    
    # Bind contract
    workflow.contract_id = "contract_abc123"
    workflow.contract_sha256 = "a" * 64
    assert workflow.contract_id == "contract_abc123"
    assert workflow.contract_sha256 == "a" * 64
    
    # Bind candidate
    workflow.candidate_id = "candidate_xyz789"
    workflow.candidate_sha256 = "b" * 64
    assert workflow.candidate_id == "candidate_xyz789"
    assert workflow.candidate_sha256 == "b" * 64
    
    # Bind manifest
    workflow.manifest_id = "manifest_def456"
    workflow.manifest_sha256 = "c" * 64
    assert workflow.manifest_id == "manifest_def456"
    assert workflow.manifest_sha256 == "c" * 64
    
    # Bind snapshot
    workflow.snapshot_id = "snapshot_ghi789"
    workflow.snapshot_sha256 = "d" * 64
    assert workflow.snapshot_id == "snapshot_ghi789"
    assert workflow.snapshot_sha256 == "d" * 64


def test_state_history():
    """Test state history tracking (append StateTransition records)."""
    now = datetime.now(timezone.utc)
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_history",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.REQUESTED,
        created_at=now,
        updated_at=now
    )
    
    # Add initial transition
    transition1 = StateTransition(
        from_state=None,
        to_state=CanonicalWorkflowState.REQUESTED,
        timestamp=now,
        triggered_by="system",
        reason="Workflow created"
    )
    workflow.state_history.append(transition1)
    
    assert len(workflow.state_history) == 1
    assert workflow.state_history[0].from_state is None
    assert workflow.state_history[0].to_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[0].triggered_by == "system"
    
    # Add second transition
    transition2 = StateTransition(
        from_state=CanonicalWorkflowState.REQUESTED,
        to_state=CanonicalWorkflowState.DISCOVERY,
        timestamp=now,
        triggered_by="system",
        evidence_id="evidence_123",
        reason="Discovery agents completed"
    )
    workflow.state_history.append(transition2)
    
    assert len(workflow.state_history) == 2
    assert workflow.state_history[1].from_state == CanonicalWorkflowState.REQUESTED
    assert workflow.state_history[1].to_state == CanonicalWorkflowState.DISCOVERY
    assert workflow.state_history[1].evidence_id == "evidence_123"


def test_serialization():
    """Test to_dict() serialization includes all fields with correct structure."""
    now = datetime.now(timezone.utc)
    
    workflow = ProjectLLMWorkflow(
        workflow_id="wf_serial",
        specification_id="I7",
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123",
        current_state=CanonicalWorkflowState.BRIEF_READY,
        created_at=now,
        updated_at=now,
        contract_id="contract_123",
        contract_sha256="a" * 64,
        approval_id="approval_456",
        gate_results={"purpose": "Test workflow"},
        evidence_ids=["evidence_1", "evidence_2"]
    )
    
    result = workflow.to_dict()
    
    assert result["workflow_id"] == "wf_serial"
    assert result["specification_id"] == "I7"
    assert result["target"]["family"] == "Introduction"
    assert result["target"]["version"] == "I7"
    assert result["requester_id"] == "user_123"
    assert result["state"]["current"] == "BRIEF_READY"
    assert result["state"]["is_terminal"] is False
    assert result["state"]["requires_approval"] is False
    assert result["artifacts"]["contract"]["id"] == "contract_123"
    assert result["artifacts"]["contract"]["sha256"] == "a" * 64
    assert result["artifacts"]["candidate"]["id"] is None
    assert result["artifacts"]["manifest"]["id"] is None
    assert result["artifacts"]["snapshot"]["id"] is None
    assert result["approval_id"] == "approval_456"
    assert result["gate_results"]["purpose"] == "Test workflow"
    assert result["evidence_ids"] == ["evidence_1", "evidence_2"]
    assert result["created_at"] == now.isoformat()
    assert result["updated_at"] == now.isoformat()
    assert result["final_status"] is None
