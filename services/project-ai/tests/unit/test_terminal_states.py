"""
Unit Tests for Terminal State Enforcement - M2.9 R3

Tests for terminal state detection, immutability enforcement, and evidence requirements.

R3 Updates:
- Service now requires repository dependencies
- All operations async
- Mocked repositories for unit testing
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock

from app.orchestration.canonical_workflow import (
    CanonicalWorkflowState,
    is_terminal_state,
    is_gate_state
)
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.persistence import WorkflowModel


@pytest.fixture
def mock_session():
    """Create a mock async session."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


@pytest.fixture
def mock_workflow_repo():
    """Create a mock WorkflowRepository."""
    repo = AsyncMock()
    repo.get = AsyncMock(return_value=None)
    repo.upsert = AsyncMock()
    return repo


@pytest.fixture
def mock_approval_repo():
    """Create a mock ApprovalRepository."""
    repo = AsyncMock()
    repo.get_by_workflow = AsyncMock(return_value=None)
    repo.upsert = AsyncMock()
    return repo


@pytest.fixture
def mock_state_transition_repo():
    """Create a mock StateTransitionRepository."""
    repo = AsyncMock()
    repo.list_by_workflow = AsyncMock(return_value=[])
    repo.create = AsyncMock()
    return repo


@pytest.fixture
def governance_service(mock_workflow_repo, mock_approval_repo, mock_state_transition_repo, mock_session):
    """Create a fresh WorkflowGovernanceService with mocked dependencies."""
    return WorkflowGovernanceService(
        workflow_repo=mock_workflow_repo,
        approval_repo=mock_approval_repo,
        state_transition_repo=mock_state_transition_repo,
        session=mock_session
    )


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


@pytest.mark.asyncio
async def test_terminal_state_immutability_certified(governance_service, mock_workflow_repo):
    """Test validate_transition() rejects all transitions from CERTIFIED state."""
    # Create workflow and force to CERTIFIED
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Mock repository to return workflow in CERTIFIED state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.CERTIFIED.value,
        final_status="CERTIFIED",
        created_at=workflow.created_at,
        updated_at=workflow.updated_at
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Try various transitions from CERTIFIED (all should fail)
    target_states = [
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.REJECTED,
    ]
    
    for target_state in target_states:
        is_valid, reason = await governance_service.validate_transition(
            workflow.workflow_id,
            target_state
        )
        assert is_valid is False
        assert "terminal state" in reason


@pytest.mark.asyncio
async def test_terminal_state_immutability_rejected(governance_service, mock_workflow_repo):
    """Test validate_transition() rejects all transitions from REJECTED state."""
    # Create workflow and force to REJECTED
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Mock repository to return workflow in REJECTED state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.REJECTED.value,
        final_status="REJECTED",
        created_at=workflow.created_at,
        updated_at=workflow.updated_at
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Try various transitions from REJECTED (all should fail)
    target_states = [
        CanonicalWorkflowState.REQUESTED,
        CanonicalWorkflowState.DISCOVERY,
        CanonicalWorkflowState.IMPLEMENTING,
        CanonicalWorkflowState.CERTIFIED,
    ]
    
    for target_state in target_states:
        is_valid, reason = await governance_service.validate_transition(
            workflow.workflow_id,
            target_state
        )
        assert is_valid is False
        assert "terminal state" in reason


@pytest.mark.asyncio
async def test_transition_state_raises_from_terminal(governance_service, mock_workflow_repo):
    """Test transition_state raises ValueError when attempting to transition from terminal state."""
    # Create workflow and force to CERTIFIED
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Mock repository to return workflow in CERTIFIED state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.CERTIFIED.value,
        final_status="CERTIFIED",
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Attempt transition should raise ValueError
    with pytest.raises(ValueError) as exc_info:
        await governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.DISCOVERY,
            triggered_by="system",
            reason="Trying to escape terminal state"
        )
    
    assert "terminal state" in str(exc_info.value)


@pytest.mark.asyncio
async def test_final_status_set_on_certified(governance_service, mock_workflow_repo):
    """Test final_status set correctly when transitioning to CERTIFIED state."""
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Mock repository to return workflow in AWAITING_GATE_2 state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.AWAITING_GATE_2.value,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Transition to CERTIFIED
    updated = await governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.CERTIFIED,
        triggered_by="user_123",
        reason="Final approval granted"
    )
    
    assert updated.final_status == "CERTIFIED"
    assert updated.is_terminal() is True


@pytest.mark.asyncio
async def test_final_status_set_on_rejected(governance_service, mock_workflow_repo):
    """Test final_status set correctly when transitioning to REJECTED state."""
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_123"
    )
    
    # Mock repository to return workflow in AWAITING_GATE_1 state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.AWAITING_GATE_1.value,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Transition to REJECTED
    updated = await governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by="user_123",
        reason="User rejected GUI prototype"
    )
    
    assert updated.final_status == "REJECTED"
    assert updated.is_terminal() is True


@pytest.mark.asyncio
async def test_evidence_binding(governance_service):
    """Test workflows can accumulate evidence_ids list."""
    workflow = await governance_service.create_workflow(
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
