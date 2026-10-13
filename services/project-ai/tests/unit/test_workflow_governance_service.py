"""
Unit tests for WorkflowGovernanceService - M2.9 R3

Tests governance service for workflow creation, state transition validation,
authorization gates, approval registration, and artifact binding.

R3 Updates:
- Service now requires repository dependencies
- All operations async
- Mocked repositories for unit testing
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.implementation_approval import (
    ImplementationApprovalStatus,
    create_implementation_approval
)
from app.persistence import WorkflowModel, ApprovalModel, StateTransitionModel


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
    repo.list_by_state = AsyncMock(return_value=[])
    repo.list_by_requester = AsyncMock(return_value=[])
    repo.delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_approval_repo():
    """Create a mock ApprovalRepository."""
    repo = AsyncMock()
    repo.get = AsyncMock(return_value=None)
    repo.get_by_workflow = AsyncMock(return_value=None)
    repo.upsert = AsyncMock()
    repo.list_by_status = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def mock_state_transition_repo():
    """Create a mock StateTransitionRepository."""
    repo = AsyncMock()
    repo.get = AsyncMock(return_value=None)
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


@pytest.fixture
async def sample_workflow(governance_service):
    """Create a sample workflow for testing."""
    return await governance_service.create_workflow(
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


@pytest.mark.asyncio
async def test_create_workflow(governance_service):
    """Test create_workflow() returns workflow in REQUESTED state with valid workflow_id."""
    workflow = await governance_service.create_workflow(
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


@pytest.mark.asyncio
async def test_create_workflow_without_purpose(governance_service):
    """Test create_workflow() without optional purpose parameter."""
    workflow = await governance_service.create_workflow(
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


@pytest.mark.asyncio
async def test_get_workflow(governance_service, sample_workflow, mock_workflow_repo):
    """Test get_workflow() returns correct workflow."""
    # Configure mock to return a workflow model
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    retrieved = await governance_service.get_workflow(sample_workflow.workflow_id)
    
    assert retrieved is not None
    assert retrieved.workflow_id == sample_workflow.workflow_id
    assert retrieved.specification_id == sample_workflow.specification_id
    assert retrieved.current_state == sample_workflow.current_state


@pytest.mark.asyncio
async def test_get_workflow_not_found(governance_service, mock_workflow_repo):
    """Test get_workflow() returns None for missing workflow_id."""
    mock_workflow_repo.get.return_value = None
    
    retrieved = await governance_service.get_workflow("nonexistent_workflow")
    
    assert retrieved is None


@pytest.mark.asyncio
async def test_validate_transition_valid(governance_service, sample_workflow, mock_workflow_repo):
    """Test validate_transition() accepts valid transitions."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # REQUESTED -> DISCOVERY is valid
    is_valid, reason = await governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is True
    assert reason == ""


@pytest.mark.asyncio
async def test_validate_transition_invalid_state_machine(governance_service, sample_workflow, mock_workflow_repo):
    """Test validate_transition() rejects invalid transitions per state machine."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # REQUESTED -> IMPLEMENTING is invalid (skips states)
    is_valid, reason = await governance_service.validate_transition(
        sample_workflow.workflow_id,
        CanonicalWorkflowState.IMPLEMENTING
    )
    
    assert is_valid is False
    assert "Invalid transition" in reason
    assert "REQUESTED -> IMPLEMENTING" in reason


@pytest.mark.asyncio
async def test_validate_transition_workflow_not_found(governance_service, mock_workflow_repo):
    """Test validate_transition() fails for nonexistent workflow."""
    mock_workflow_repo.get.return_value = None
    
    is_valid, reason = await governance_service.validate_transition(
        "nonexistent_workflow",
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is False
    assert "Workflow not found" in reason


@pytest.mark.asyncio
async def test_validate_transition_from_terminal_state(governance_service, mock_workflow_repo):
    """Test validate_transition() blocks transitions from terminal states."""
    # Create workflow in CERTIFIED terminal state
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Mock repository to return workflow in terminal state
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
    
    # Attempt transition from terminal state
    is_valid, reason = await governance_service.validate_transition(
        workflow.workflow_id,
        CanonicalWorkflowState.DISCOVERY
    )
    
    assert is_valid is False
    assert "terminal state" in reason
    assert "CERTIFIED" in reason


@pytest.mark.asyncio
async def test_transition_state_success(governance_service, sample_workflow, mock_workflow_repo, mock_state_transition_repo):
    """Test transition_state() updates current_state and appends to state_history."""
    initial_update_time = sample_workflow.created_at
    
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Mock state transition creation
    mock_state_transition_repo.create.return_value = StateTransitionModel(
        workflow_id=sample_workflow.workflow_id,
        from_state=CanonicalWorkflowState.REQUESTED.value,
        to_state=CanonicalWorkflowState.DISCOVERY.value,
        timestamp=datetime.now(timezone.utc),
        triggered_by="system",
        evidence_id="ev_123",
        reason="Discovery completed"
    )
    
    updated_workflow = await governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.DISCOVERY,
        triggered_by="system",
        evidence_id="ev_123",
        reason="Discovery completed"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.DISCOVERY
    # State history includes the new transition
    assert any(t.to_state == CanonicalWorkflowState.DISCOVERY for t in updated_workflow.state_history)
    assert any(t.from_state == CanonicalWorkflowState.REQUESTED for t in updated_workflow.state_history)
    assert updated_workflow.updated_at >= initial_update_time
    # Verify state transition was created
    assert mock_state_transition_repo.create.called


@pytest.mark.asyncio
async def test_transition_state_sets_final_status(governance_service, sample_workflow, mock_workflow_repo):
    """Test transition_state() sets final_status for terminal states."""
    # Mock repository to return workflow in AWAITING_GATE_1 state
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=CanonicalWorkflowState.AWAITING_GATE_1.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    updated_workflow = await governance_service.transition_state(
        workflow_id=sample_workflow.workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by="user_alice",
        reason="User rejected"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.REJECTED
    assert updated_workflow.final_status == "REJECTED"
    assert updated_workflow.is_terminal() is True


@pytest.mark.asyncio
async def test_transition_state_invalid_raises_error(governance_service, sample_workflow, mock_workflow_repo):
    """Test transition_state() raises ValueError on invalid transition."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    with pytest.raises(ValueError) as exc_info:
        await governance_service.transition_state(
            workflow_id=sample_workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )
    
    assert "Invalid transition" in str(exc_info.value)


@pytest.mark.asyncio
async def test_transition_to_implementing_requires_authorization(governance_service, mock_workflow_repo, mock_approval_repo):
    """Test transition to IMPLEMENTING calls can_transition_to_implementing()."""
    # Create workflow and advance to AWAITING_IMPLEMENTATION_APPROVAL
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Mock repository to return workflow in AWAITING_IMPLEMENTATION_APPROVAL state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        candidate_sha256="a" * 64,
        manifest_id="manifest_123",
        manifest_sha256="b" * 64,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    mock_approval_repo.get_by_workflow.return_value = None  # No approval
    
    # Attempt transition without approval - should fail
    with pytest.raises(ValueError) as exc_info:
        await governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )
    
    assert "Authorization failed" in str(exc_info.value)
    assert "No implementation approval found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_transition_to_implementing_with_approval_succeeds(governance_service, mock_workflow_repo, mock_approval_repo):
    """Test transition to IMPLEMENTING succeeds with valid approval."""
    # Create workflow
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Mock repository to return workflow in AWAITING_IMPLEMENTATION_APPROVAL state
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        candidate_sha256="a" * 64,
        manifest_id="manifest_123",
        manifest_sha256="b" * 64,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Create approval model
    approval_model = ApprovalModel(
        approval_id="approval_123",
        workflow_id=workflow.workflow_id,
        candidate_sha256="a" * 64,
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        target_family="Introduction",
        target_version="I7",
        approved_by="user_bob",
        approval_timestamp=datetime.now(timezone.utc),
        status=ImplementationApprovalStatus.APPROVED.value,
        workflow_requester="user_alice"
    )
    mock_approval_repo.get_by_workflow.return_value = approval_model
    
    # Now transition should succeed
    updated_workflow = await governance_service.transition_state(
        workflow_id=workflow.workflow_id,
        to_state=CanonicalWorkflowState.IMPLEMENTING,
        triggered_by="system"
    )
    
    assert updated_workflow.current_state == CanonicalWorkflowState.IMPLEMENTING


@pytest.mark.asyncio
async def test_transition_to_implementing_rejects_hash_mismatch(governance_service, mock_workflow_repo, mock_approval_repo):
    """Test IMPLEMENTING transition rejects if candidate hash mismatches."""
    workflow = await governance_service.create_workflow(
        target_family="Introduction",
        target_version="I7",
        requester_id="user_alice"
    )
    
    # Mock repository to return workflow with wrong hash
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        candidate_sha256="wrong_hash",  # Wrong hash
        manifest_id="manifest_123",
        manifest_sha256="b" * 64,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    # Create approval with correct hash
    approval_model = ApprovalModel(
        approval_id="approval_123",
        workflow_id=workflow.workflow_id,
        candidate_sha256="a" * 64,  # Correct hash
        placement_manifest_id="manifest_123",
        placement_manifest_sha256="b" * 64,
        target_family="Introduction",
        target_version="I7",
        approved_by="user_bob",
        approval_timestamp=datetime.now(timezone.utc),
        status=ImplementationApprovalStatus.APPROVED.value,
        workflow_requester="user_alice"
    )
    mock_approval_repo.get_by_workflow.return_value = approval_model
    
    # Transition should fail due to hash mismatch
    with pytest.raises(ValueError) as exc_info:
        await governance_service.transition_state(
            workflow_id=workflow.workflow_id,
            to_state=CanonicalWorkflowState.IMPLEMENTING,
            triggered_by="system"
        )
    
    assert "Authorization failed" in str(exc_info.value)
    assert "Candidate hash mismatch" in str(exc_info.value)


@pytest.mark.asyncio
async def test_register_approval(governance_service, sample_workflow, sample_approval, mock_workflow_repo):
    """Test register_approval() sets approval_id on workflow."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    await governance_service.register_approval(sample_workflow.workflow_id, sample_approval)
    
    # Verify upsert was called
    assert mock_workflow_repo.upsert.called


@pytest.mark.asyncio
async def test_register_approval_workflow_not_found(governance_service, sample_approval, mock_workflow_repo):
    """Test register_approval() raises ValueError if workflow not found."""
    mock_workflow_repo.get.return_value = None
    
    with pytest.raises(ValueError) as exc_info:
        await governance_service.register_approval("nonexistent_workflow", sample_approval)
    
    assert "Workflow not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_bind_artifact_contract(governance_service, sample_workflow, mock_workflow_repo):
    """Test bind_artifact() sets contract ID and hash."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    await governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="contract",
        artifact_id="contract_abc",
        artifact_sha256="a" * 64
    )
    
    # Verify upsert was called
    assert mock_workflow_repo.upsert.called


@pytest.mark.asyncio
async def test_bind_artifact_candidate(governance_service, sample_workflow, mock_workflow_repo):
    """Test bind_artifact() sets candidate ID and hash."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    await governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="candidate",
        artifact_id="candidate_xyz",
        artifact_sha256="b" * 64
    )
    
    # Verify upsert was called
    assert mock_workflow_repo.upsert.called


@pytest.mark.asyncio
async def test_bind_artifact_manifest(governance_service, sample_workflow, mock_workflow_repo):
    """Test bind_artifact() sets manifest ID and hash."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    await governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="manifest",
        artifact_id="manifest_123",
        artifact_sha256="c" * 64
    )
    
    # Verify upsert was called
    assert mock_workflow_repo.upsert.called


@pytest.mark.asyncio
async def test_bind_artifact_snapshot(governance_service, sample_workflow, mock_workflow_repo):
    """Test bind_artifact() sets snapshot ID and hash."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    await governance_service.bind_artifact(
        workflow_id=sample_workflow.workflow_id,
        artifact_type="snapshot",
        artifact_id="snapshot_456",
        artifact_sha256="d" * 64
    )
    
    # Verify upsert was called
    assert mock_workflow_repo.upsert.called


@pytest.mark.asyncio
async def test_bind_artifact_invalid_type(governance_service, sample_workflow, mock_workflow_repo):
    """Test bind_artifact() raises ValueError for invalid artifact type."""
    # Mock repository to return workflow
    workflow_model = WorkflowModel(
        workflow_id=sample_workflow.workflow_id,
        specification_id=sample_workflow.specification_id,
        target_family=sample_workflow.target_family,
        target_version=sample_workflow.target_version,
        requester_id=sample_workflow.requester_id,
        current_state=sample_workflow.current_state.value,
        created_at=sample_workflow.created_at,
        updated_at=sample_workflow.updated_at,
        version=1
    )
    workflow_model.state_transitions = []
    mock_workflow_repo.get.return_value = workflow_model
    
    with pytest.raises(ValueError) as exc_info:
        await governance_service.bind_artifact(
            workflow_id=sample_workflow.workflow_id,
            artifact_type="invalid_type",
            artifact_id="artifact_123",
            artifact_sha256="e" * 64
        )
    
    assert "Invalid artifact type" in str(exc_info.value)
    assert "invalid_type" in str(exc_info.value)


@pytest.mark.asyncio
async def test_bind_artifact_workflow_not_found(governance_service, mock_workflow_repo):
    """Test bind_artifact() raises ValueError if workflow not found."""
    mock_workflow_repo.get.return_value = None
    
    with pytest.raises(ValueError) as exc_info:
        await governance_service.bind_artifact(
            workflow_id="nonexistent_workflow",
            artifact_type="contract",
            artifact_id="contract_abc",
            artifact_sha256="a" * 64
        )
    
    assert "Workflow not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_list_workflows(governance_service, mock_workflow_repo):
    """Test list_workflows() returns all workflows."""
    # Mock repository to return workflow models
    mock_workflow_repo.list_by_state.return_value = []
    
    workflows = await governance_service.list_workflows()
    
    # With mocked empty list
    assert len(workflows) == 0
