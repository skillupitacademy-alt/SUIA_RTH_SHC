"""
Unit tests for Wave 4: AWAITING_IMPLEMENTATION_APPROVAL gate.

Tests the human approval requirement before placement execution,
ensuring no auto-approval bypass and proper manifest/contract hash verification.
"""

import pytest
from datetime import datetime, timezone
from fastapi import HTTPException

from app.api.routes.governance import (
    WorkflowApprovalPayload,
    approve_placement,
    register_workflow_for_approval,
    transition_to_approval_gate,
    _workflow_states,
)
from app.orchestration.canonical_workflow import CanonicalWorkflowState


@pytest.fixture(autouse=True)
def reset_workflow_states():
    """Reset in-memory workflow states before each test."""
    _workflow_states.clear()
    yield
    _workflow_states.clear()


@pytest.fixture
def sample_workflow():
    """Create a sample workflow registered for approval."""
    workflow_id = "test-workflow-001"
    manifest_hash = "abc123manifestHash"
    contract_hash = "def456contractHash"
    candidate_sha256 = "candidate789hash"
    placement_manifest_id = "manifest-id-123"
    
    register_workflow_for_approval(
        workflow_id=workflow_id,
        manifest_hash=manifest_hash,
        contract_hash=contract_hash,
        initial_state=CanonicalWorkflowState.INTEGRATION_PLANNED
    )
    
    # Add W4 fields to workflow state
    _workflow_states[workflow_id]["candidate_sha256"] = candidate_sha256
    _workflow_states[workflow_id]["placement_manifest_id"] = placement_manifest_id
    _workflow_states[workflow_id]["target_family"] = "Introduction"
    _workflow_states[workflow_id]["target_version"] = "I7"
    _workflow_states[workflow_id]["requester"] = "requester@test.com"
    
    # Transition to AWAITING_IMPLEMENTATION_APPROVAL
    transition_to_approval_gate(workflow_id)
    
    return {
        "workflow_id": workflow_id,
        "manifest_hash": manifest_hash,
        "contract_hash": contract_hash,
        "candidate_sha256": candidate_sha256,
        "placement_manifest_id": placement_manifest_id,
    }


@pytest.mark.asyncio
async def test_approve_with_correct_hashes(sample_workflow):
    """Test approve with correct manifest and contract hashes → state becomes IMPLEMENTING."""
    payload = WorkflowApprovalPayload(
        workflow_id=sample_workflow["workflow_id"],
        manifest_hash=sample_workflow["manifest_hash"],
        contract_hash=sample_workflow["contract_hash"],
        candidate_sha256=sample_workflow["candidate_sha256"],
        placement_manifest_id=sample_workflow["placement_manifest_id"],
        approved=True,
        approved_by="human-approver@test.com",
        reason="All gates passed, placement looks good"
    )
    
    response = await approve_placement(
        workflow_id=sample_workflow["workflow_id"],
        payload=payload
    )
    
    # Verify response
    assert response.workflow_id == sample_workflow["workflow_id"]
    assert response.previous_state == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value
    assert response.new_state == CanonicalWorkflowState.IMPLEMENTING.value
    assert response.approved is True
    assert response.approved_by == "human-approver@test.com"
    assert response.manifest_hash_verified is True
    assert response.contract_hash_verified is True
    assert response.candidate_sha256_verified is True
    assert response.manifest_id_verified is True
    assert "gates passed" in response.reason
    
    # Verify workflow state changed
    workflow = _workflow_states[sample_workflow["workflow_id"]]
    assert workflow["state"] == CanonicalWorkflowState.IMPLEMENTING.value
    assert workflow["approved_by"] == "human-approver@test.com"
    assert "approved_at" in workflow


@pytest.mark.asyncio
async def test_approve_with_wrong_manifest_hash(sample_workflow):
    """Test approve with wrong manifest_hash → 409 APPROVAL_INVALID."""
    payload = WorkflowApprovalPayload(
        workflow_id=sample_workflow["workflow_id"],
        manifest_hash="WRONG_HASH_123",  # Incorrect hash
        contract_hash=sample_workflow["contract_hash"],
        candidate_sha256=sample_workflow["candidate_sha256"],
        placement_manifest_id=sample_workflow["placement_manifest_id"],
        approved=True,
        approved_by="human-approver@test.com",
        reason="Attempting to approve"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await approve_placement(
            workflow_id=sample_workflow["workflow_id"],
            payload=payload
        )
    
    # Verify 409 Conflict
    assert exc_info.value.status_code == 409
    assert "APPROVAL_INVALID" in str(exc_info.value.detail)
    assert "manifest_changed" in str(exc_info.value.detail)
    
    # Verify state did NOT change
    workflow = _workflow_states[sample_workflow["workflow_id"]]
    assert workflow["state"] == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value


@pytest.mark.asyncio
async def test_approve_when_not_in_awaiting_approval_state():
    """Test approve when not in AWAITING_IMPLEMENTATION_APPROVAL → 409 wrong state."""
    workflow_id = "test-workflow-wrong-state"
    
    # Register but don't transition to AWAITING_IMPLEMENTATION_APPROVAL
    register_workflow_for_approval(
        workflow_id=workflow_id,
        manifest_hash="hash123",
        contract_hash="contract456",
        initial_state=CanonicalWorkflowState.INTEGRATION_PLANNED  # Wrong state
    )
    
    # Add W4 fields
    _workflow_states[workflow_id]["candidate_sha256"] = "candidate789"
    _workflow_states[workflow_id]["placement_manifest_id"] = "manifest-id-456"
    
    payload = WorkflowApprovalPayload(
        workflow_id=workflow_id,
        manifest_hash="hash123",
        contract_hash="contract456",
        candidate_sha256="candidate789",
        placement_manifest_id="manifest-id-456",
        approved=True,
        approved_by="human-approver@test.com",
        reason="Trying to approve"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await approve_placement(workflow_id=workflow_id, payload=payload)
    
    # Verify 409 Conflict
    assert exc_info.value.status_code == 409
    assert "WRONG_STATE" in str(exc_info.value.detail)
    assert "INTEGRATION_PLANNED" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_reject_transitions_to_rejected_state(sample_workflow):
    """Test reject → state becomes REJECTED."""
    payload = WorkflowApprovalPayload(
        workflow_id=sample_workflow["workflow_id"],
        manifest_hash=sample_workflow["manifest_hash"],
        contract_hash=sample_workflow["contract_hash"],
        candidate_sha256=sample_workflow["candidate_sha256"],
        placement_manifest_id=sample_workflow["placement_manifest_id"],
        approved=False,  # Rejecting
        approved_by="human-approver@test.com",
        reason="Placement path is incorrect, needs revision"
    )
    
    response = await approve_placement(
        workflow_id=sample_workflow["workflow_id"],
        payload=payload
    )
    
    # Verify response
    assert response.workflow_id == sample_workflow["workflow_id"]
    assert response.previous_state == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value
    assert response.new_state == CanonicalWorkflowState.REJECTED.value
    assert response.approved is False
    assert response.approved_by == "human-approver@test.com"
    assert "incorrect" in response.reason
    
    # Verify workflow state changed to REJECTED
    workflow = _workflow_states[sample_workflow["workflow_id"]]
    assert workflow["state"] == CanonicalWorkflowState.REJECTED.value
    assert workflow["rejected_by"] == "human-approver@test.com"
    assert "rejected_at" in workflow


@pytest.mark.asyncio
async def test_approve_workflow_not_found():
    """Test approve when workflow doesn't exist → 404."""
    payload = WorkflowApprovalPayload(
        workflow_id="nonexistent-workflow",
        manifest_hash="hash123",
        contract_hash="contract456",
        candidate_sha256="candidate789",
        placement_manifest_id="manifest-id-789",
        approved=True,
        approved_by="human-approver@test.com",
        reason="Attempting to approve"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await approve_placement(workflow_id="nonexistent-workflow", payload=payload)
    
    # Verify 404 Not Found
    assert exc_info.value.status_code == 404
    assert "not found" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_approve_with_wrong_contract_hash(sample_workflow):
    """Test approve with wrong contract_hash → 409 CONTRACT_CHANGED."""
    payload = WorkflowApprovalPayload(
        workflow_id=sample_workflow["workflow_id"],
        manifest_hash=sample_workflow["manifest_hash"],
        contract_hash="WRONG_CONTRACT_HASH",  # Incorrect contract hash
        candidate_sha256=sample_workflow["candidate_sha256"],
        placement_manifest_id=sample_workflow["placement_manifest_id"],
        approved=True,
        approved_by="human-approver@test.com",
        reason="Attempting to approve"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await approve_placement(
            workflow_id=sample_workflow["workflow_id"],
            payload=payload
        )
    
    # Verify 409 Conflict
    assert exc_info.value.status_code == 409
    assert "CONTRACT_CHANGED" in str(exc_info.value.detail)
    
    # Verify state did NOT change
    workflow = _workflow_states[sample_workflow["workflow_id"]]
    assert workflow["state"] == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value


@pytest.mark.asyncio
async def test_workflow_id_mismatch_path_vs_payload():
    """Test workflow_id mismatch between path and payload → 400."""
    register_workflow_for_approval(
        workflow_id="workflow-A",
        manifest_hash="hash123",
        contract_hash="contract456",
        initial_state=CanonicalWorkflowState.INTEGRATION_PLANNED
    )
    
    # Add W4 fields
    _workflow_states["workflow-A"]["candidate_sha256"] = "candidate789"
    _workflow_states["workflow-A"]["placement_manifest_id"] = "manifest-id-789"
    
    transition_to_approval_gate("workflow-A")
    
    payload = WorkflowApprovalPayload(
        workflow_id="workflow-B",  # Mismatch
        manifest_hash="hash123",
        contract_hash="contract456",
        candidate_sha256="candidate789",
        placement_manifest_id="manifest-id-789",
        approved=True,
        approved_by="human-approver@test.com",
        reason="Attempting to approve"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await approve_placement(workflow_id="workflow-A", payload=payload)
    
    # Verify 400 Bad Request
    assert exc_info.value.status_code == 400
    assert "mismatch" in str(exc_info.value.detail).lower()


def test_register_workflow_for_approval():
    """Test workflow registration for approval."""
    workflow_id = "reg-test-001"
    manifest_hash = "manifest123"
    contract_hash = "contract456"
    
    register_workflow_for_approval(
        workflow_id=workflow_id,
        manifest_hash=manifest_hash,
        contract_hash=contract_hash
    )
    
    # Verify workflow registered
    assert workflow_id in _workflow_states
    workflow = _workflow_states[workflow_id]
    assert workflow["workflow_id"] == workflow_id
    assert workflow["manifest_hash"] == manifest_hash
    assert workflow["contract_hash"] == contract_hash
    assert workflow["state"] == CanonicalWorkflowState.INTEGRATION_PLANNED.value
    assert "registered_at" in workflow


def test_transition_to_approval_gate():
    """Test transition from INTEGRATION_PLANNED to AWAITING_IMPLEMENTATION_APPROVAL."""
    workflow_id = "transition-test-001"
    
    register_workflow_for_approval(
        workflow_id=workflow_id,
        manifest_hash="hash123",
        contract_hash="contract456"
    )
    
    # Initial state should be INTEGRATION_PLANNED
    workflow = _workflow_states[workflow_id]
    assert workflow["state"] == CanonicalWorkflowState.INTEGRATION_PLANNED.value
    
    # Transition to AWAITING_IMPLEMENTATION_APPROVAL
    transition_to_approval_gate(workflow_id)
    
    # Verify state changed
    workflow = _workflow_states[workflow_id]
    assert workflow["state"] == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value
    assert "transition_at" in workflow


def test_transition_to_approval_gate_from_wrong_state():
    """Test transition to approval gate from wrong state raises ValueError."""
    workflow_id = "wrong-state-test"
    
    register_workflow_for_approval(
        workflow_id=workflow_id,
        manifest_hash="hash123",
        contract_hash="contract456",
        initial_state=CanonicalWorkflowState.DISCOVERY  # Wrong state
    )
    
    with pytest.raises(ValueError) as exc_info:
        transition_to_approval_gate(workflow_id)
    
    assert "Cannot transition to approval gate" in str(exc_info.value)
    assert "DISCOVERY" in str(exc_info.value)


def test_transition_to_approval_gate_workflow_not_registered():
    """Test transition when workflow not registered raises ValueError."""
    with pytest.raises(ValueError) as exc_info:
        transition_to_approval_gate("nonexistent-workflow")
    
    assert "not registered" in str(exc_info.value)


# Integration test: full workflow from registration to approval
@pytest.mark.asyncio
async def test_full_approval_workflow():
    """Integration test: register → transition → approve → verify state."""
    workflow_id = "integration-test-001"
    manifest_hash = "full-test-manifest-hash"
    contract_hash = "full-test-contract-hash"
    candidate_sha256 = "full-test-candidate-hash"
    placement_manifest_id = "full-test-manifest-id"
    
    # Step 1: Register workflow
    register_workflow_for_approval(
        workflow_id=workflow_id,
        manifest_hash=manifest_hash,
        contract_hash=contract_hash
    )
    
    # Add W4 fields
    _workflow_states[workflow_id]["candidate_sha256"] = candidate_sha256
    _workflow_states[workflow_id]["placement_manifest_id"] = placement_manifest_id
    _workflow_states[workflow_id]["target_family"] = "Introduction"
    _workflow_states[workflow_id]["target_version"] = "I7"
    _workflow_states[workflow_id]["requester"] = "requester@test.com"
    
    # Verify initial state
    workflow = _workflow_states[workflow_id]
    assert workflow["state"] == CanonicalWorkflowState.INTEGRATION_PLANNED.value
    
    # Step 2: Transition to approval gate
    transition_to_approval_gate(workflow_id)
    
    # Verify gate state
    workflow = _workflow_states[workflow_id]
    assert workflow["state"] == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value
    
    # Step 3: Approve
    payload = WorkflowApprovalPayload(
        workflow_id=workflow_id,
        manifest_hash=manifest_hash,
        contract_hash=contract_hash,
        candidate_sha256=candidate_sha256,
        placement_manifest_id=placement_manifest_id,
        approved=True,
        approved_by="integration-test-approver",
        reason="Integration test approval"
    )
    
    response = await approve_placement(workflow_id=workflow_id, payload=payload)
    
    # Verify final state
    assert response.new_state == CanonicalWorkflowState.IMPLEMENTING.value
    workflow = _workflow_states[workflow_id]
    assert workflow["state"] == CanonicalWorkflowState.IMPLEMENTING.value
    assert workflow["approved_by"] == "integration-test-approver"
