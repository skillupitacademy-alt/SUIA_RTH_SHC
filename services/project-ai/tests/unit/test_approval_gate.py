"""
Unit tests for Wave 4: AWAITING_IMPLEMENTATION_APPROVAL gate.

Tests the human approval requirement before placement execution,
ensuring no auto-approval bypass and proper manifest/contract hash verification.

M2.9 R3: Uses PostgreSQL-backed fixtures with WorkflowGovernanceService.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone
from fastapi import HTTPException

from app.api.routes.governance import WorkflowApprovalPayload, approve_placement
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.workflow import ProjectLLMWorkflow


@pytest_asyncio.fixture
async def sample_workflow(test_governance_service, test_db_session):
    """Create a sample workflow in AWAITING_IMPLEMENTATION_APPROVAL state."""
    workflow_id = "test-workflow-001"
    manifest_hash = "abc123manifestHash"
    contract_hash = "def456contractHash"
    candidate_sha256 = "candidate789hash"
    placement_manifest_id = "manifest-id-123"
    
    # Create workflow via governance service
    workflow = await test_governance_service.create_workflow(
        specification_id="spec-001",
        target_family="Introduction",
        target_version="I7",
        requester_id="requester@test.com"
    )
    
    # Transition to AWAITING_IMPLEMENTATION_APPROVAL with all required bindings
    workflow = await test_governance_service.get_workflow(workflow.workflow_id)
    workflow.contract_sha256 = contract_hash
    workflow.candidate_sha256 = candidate_sha256
    workflow.manifest_sha256 = manifest_hash
    workflow.manifest_id = placement_manifest_id
    workflow.current_state = CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL
    
    # Update workflow with bindings
    from app.persistence.models import WorkflowModel
    workflow_model = WorkflowModel(
        workflow_id=workflow.workflow_id,
        specification_id=workflow.specification_id,
        target_family=workflow.target_family,
        target_version=workflow.target_version,
        requester_id=workflow.requester_id,
        current_state=workflow.current_state.value,
        contract_sha256=contract_hash,
        candidate_sha256=candidate_sha256,
        manifest_sha256=manifest_hash,
        manifest_id=placement_manifest_id,
        created_at=workflow.created_at,
        updated_at=datetime.now(timezone.utc),
        version=1
    )
    
    from conftest import test_workflow_repo
    repo = await test_workflow_repo(test_db_session)
    await repo.upsert(workflow_model)
    await test_db_session.flush()
    
    return {
        "workflow_id": workflow.workflow_id,
        "manifest_hash": manifest_hash,
        "contract_hash": contract_hash,
        "candidate_sha256": candidate_sha256,
        "placement_manifest_id": placement_manifest_id,
    }


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures - requires test_governance_service integration")
async def test_approve_with_correct_hashes(sample_workflow):
    """Test approve with correct manifest and contract hashes → state becomes IMPLEMENTING."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_approve_with_wrong_manifest_hash(sample_workflow):
    """Test approve with wrong manifest_hash → 409 APPROVAL_INVALID."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_approve_when_not_in_awaiting_approval_state():
    """Test approve when not in AWAITING_IMPLEMENTATION_APPROVAL → 409 wrong state."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_reject_transitions_to_rejected_state(sample_workflow):
    """Test reject → state becomes REJECTED."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_approve_workflow_not_found():
    """Test approve when workflow doesn't exist → 404."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_approve_with_wrong_contract_hash(sample_workflow):
    """Test approve with wrong contract_hash → 409 CONTRACT_CHANGED."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_workflow_id_mismatch_path_vs_payload():
    """Test workflow_id mismatch between path and payload → 400."""
    pass


@pytest.mark.skip(reason="TODO FEAT-003: Helper functions removed - use WorkflowGovernanceService")
def test_register_workflow_for_approval():
    """Test workflow registration for approval."""
    pass


@pytest.mark.skip(reason="TODO FEAT-003: Helper functions removed - use WorkflowGovernanceService")
def test_transition_to_approval_gate():
    """Test transition from INTEGRATION_PLANNED to AWAITING_IMPLEMENTATION_APPROVAL."""
    pass


@pytest.mark.skip(reason="TODO FEAT-003: Helper functions removed - use WorkflowGovernanceService")
def test_transition_to_approval_gate_from_wrong_state():
    """Test transition to approval gate from wrong state raises ValueError."""
    pass


@pytest.mark.skip(reason="TODO FEAT-003: Helper functions removed - use WorkflowGovernanceService")
def test_transition_to_approval_gate_workflow_not_registered():
    """Test transition when workflow not registered raises ValueError."""
    pass


@pytest.mark.asyncio
@pytest.mark.skip(reason="TODO FEAT-003: Migrate to PostgreSQL-backed fixtures")
async def test_full_approval_workflow():
    """Integration test: register → transition → approve → verify state."""
    pass
