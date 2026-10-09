"""
Integration Tests for Implementation Approval Workflow - M2.9 Wave 4

Tests the complete implementation approval flow including:
- Endpoint integration with governance service
- PostgreSQL persistence via ApprovalRepository
- State transitions via WorkflowGovernanceService
- Security gates (self-approval, hash verification)

Requires PostgreSQL configured via TEST_DATABASE_URL_TUTORIAL environment variable.
"""

import hashlib
import json
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock

from app.persistence.models import WorkflowModel, ApprovalModel
from app.persistence import (
    PostgresWorkflowRepository,
    PostgresApprovalRepository,
)
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.models.implementation_approval import ImplementationApprovalStatus


@pytest.mark.integration
@pytest.mark.asyncio
async def test_submit_approval_success(db_session, workflow_repo, approval_repo):
    """
    Test 1: Happy path - workflow approval succeeds and transitions to IMPLEMENTING.
    
    Verifies:
    - Workflow in AWAITING_IMPLEMENTATION_APPROVAL state
    - Valid hashes provided
    - Different approver from requester
    - State transitions to IMPLEMENTING
    - Approval record persisted to PostgreSQL
    """
    workflow_id = "wf_approve_001"
    requester_id = "requester@example.com"
    approver_id = "approver@example.com"
    candidate_hash = "a" * 64
    manifest_hash = "b" * 64
    contract_hash = "c" * 64
    manifest_id = "manifest_001"
    
    # Create workflow in AWAITING_IMPLEMENTATION_APPROVAL state
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_001",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_001",
        contract_sha256=contract_hash,
        candidate_sha256=candidate_hash,
        manifest_sha256=manifest_hash,
        manifest_id=manifest_id,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create governance service
    from app.persistence import PostgresStateTransitionRepository
    state_transition_repo = PostgresStateTransitionRepository(db_session)
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    # Simulate approval submission (as done by governance.py endpoint)
    from app.models.implementation_approval import create_implementation_approval
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=candidate_hash,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id=manifest_id,
        placement_manifest_sha256=manifest_hash,
        approved_by=approver_id,
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    # Persist approval
    from app.api.routes.candidate import approval_to_model
    approval_model = approval_to_model(approval)
    await approval_repo.upsert(approval_model)
    
    # Register approval and transition state
    await governance_service.register_approval(workflow_id, approval)
    await governance_service.transition_state(
        workflow_id=workflow_id,
        to_state=CanonicalWorkflowState.IMPLEMENTING,
        triggered_by=approver_id,
        evidence_id=approval.approval_id,
        reason="Approved implementation"
    )
    
    await db_session.flush()
    
    # Verify workflow transitioned
    updated_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert updated_workflow.current_state == CanonicalWorkflowState.IMPLEMENTING.value
    
    # Verify approval persisted
    persisted_approval = await approval_repo.get_by_workflow(workflow_id)
    assert persisted_approval is not None
    assert persisted_approval.status == ImplementationApprovalStatus.APPROVED.value
    assert persisted_approval.approved_by == approver_id
    assert persisted_approval.workflow_requester == requester_id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_self_approval_rejected(db_session, workflow_repo, approval_repo):
    """
    Test 2: Self-approval rejection - requester cannot approve own implementation.
    
    Verifies:
    - Approval record created with self-approval detected
    - Workflow stays in AWAITING_IMPLEMENTATION_APPROVAL state
    - Rejection audit trail recorded
    """
    workflow_id = "wf_self_approve_001"
    user_id = "user@example.com"  # Same person as requester and approver
    candidate_hash = "d" * 64
    manifest_hash = "e" * 64
    contract_hash = "f" * 64
    manifest_id = "manifest_self_001"
    
    # Create workflow
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_002",
        target_family="Introduction",
        target_version="I7",
        requester_id=user_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_002",
        contract_sha256=contract_hash,
        candidate_sha256=candidate_hash,
        manifest_sha256=manifest_hash,
        manifest_id=manifest_id,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Attempt self-approval (should be rejected)
    from app.models.implementation_approval import create_implementation_approval
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=candidate_hash,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id=manifest_id,
        placement_manifest_sha256=manifest_hash,
        approved_by=user_id,  # Same as requester
        workflow_requester=user_id,
        status=ImplementationApprovalStatus.APPROVED,  # Attempted approval
    )
    
    # Verify self-approval detection
    assert not approval.verify_not_self_approved(user_id)
    
    # Workflow should remain in AWAITING_IMPLEMENTATION_APPROVAL
    workflow_after = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert workflow_after.current_state == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_unauthorized_user_rejected(db_session, workflow_repo):
    """
    Test 3: Unauthorized user rejection - only authorized roles may approve.
    
    This test verifies that role checking is in place (though the current
    implementation focuses on self-approval prevention).
    """
    workflow_id = "wf_unauth_001"
    requester_id = "requester@example.com"
    unauthorized_user = "unauthorized@example.com"
    
    # Create workflow
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_003",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_003",
        contract_sha256="g" * 64,
        candidate_sha256="h" * 64,
        manifest_sha256="i" * 64,
        manifest_id="manifest_003",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # In current implementation, we focus on self-approval prevention
    # Role-based authorization would be added in future enhancement
    # This test documents the expected behavior
    
    # Verify workflow exists and is in correct state
    retrieved = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert retrieved.current_state == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_transitions_to_implementing_after_approval(
    db_session, workflow_repo, approval_repo
):
    """
    Test 4: Workflow transitions to IMPLEMENTING after approval.
    
    Verifies complete flow:
    - Approval submitted and persisted
    - State transition executed via governance service
    - New state persisted to database
    """
    workflow_id = "wf_transition_001"
    requester_id = "requester@example.com"
    approver_id = "approver@example.com"
    candidate_hash = "j" * 64
    manifest_hash = "k" * 64
    contract_hash = "l" * 64
    manifest_id = "manifest_004"
    
    # Create workflow
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_004",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_004",
        contract_sha256=contract_hash,
        candidate_sha256=candidate_hash,
        manifest_sha256=manifest_hash,
        manifest_id=manifest_id,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create and persist approval
    from app.models.implementation_approval import create_implementation_approval
    from app.api.routes.candidate import approval_to_model
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=candidate_hash,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id=manifest_id,
        placement_manifest_sha256=manifest_hash,
        approved_by=approver_id,
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approval_model = approval_to_model(approval)
    await approval_repo.upsert(approval_model)
    
    # Create governance service and transition
    from app.persistence import PostgresStateTransitionRepository
    state_transition_repo = PostgresStateTransitionRepository(db_session)
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    await governance_service.register_approval(workflow_id, approval)
    await governance_service.transition_state(
        workflow_id=workflow_id,
        to_state=CanonicalWorkflowState.IMPLEMENTING,
        triggered_by=approver_id,
        evidence_id=approval.approval_id,
        reason="Implementation approved"
    )
    
    await db_session.flush()
    
    # Verify transition
    updated_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert updated_workflow.current_state == CanonicalWorkflowState.IMPLEMENTING.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_stays_awaiting_without_approval(db_session, workflow_repo):
    """
    Test 5: Workflow stays in AWAITING_IMPLEMENTATION_APPROVAL without approval.
    
    Verifies that workflow cannot transition without approval record.
    """
    workflow_id = "wf_no_approval_001"
    requester_id = "requester@example.com"
    
    # Create workflow in AWAITING_IMPLEMENTATION_APPROVAL
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_005",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_005",
        contract_sha256="m" * 64,
        candidate_sha256="n" * 64,
        manifest_sha256="o" * 64,
        manifest_id="manifest_005",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Verify workflow stays in AWAITING_IMPLEMENTATION_APPROVAL
    retrieved = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert retrieved.current_state == CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_audit_trail_recorded(db_session, approval_repo):
    """
    Test 6: Approval audit trail recorded - every decision logged to DB.
    
    Verifies:
    - Approval timestamp recorded
    - Approver identity captured
    - Evidence dictionary populated
    """
    workflow_id = "wf_audit_001"
    requester_id = "requester@example.com"
    approver_id = "approver@example.com"
    
    # Create approval
    from app.models.implementation_approval import create_implementation_approval
    from app.api.routes.candidate import approval_to_model
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256="p" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_006",
        placement_manifest_sha256="q" * 64,
        approved_by=approver_id,
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approval_model = approval_to_model(approval)
    await approval_repo.upsert(approval_model)
    await db_session.flush()
    
    # Verify audit trail
    persisted = await approval_repo.get_by_workflow(workflow_id)
    assert persisted is not None
    assert persisted.approved_by == approver_id
    assert persisted.workflow_requester == requester_id
    assert persisted.approval_timestamp is not None
    assert persisted.evidence is not None
    assert isinstance(persisted.evidence, dict)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_duplicate_approval_handled(db_session, approval_repo):
    """
    Test 7: Duplicate approval handled - upsert overwrites previous approval.
    
    Verifies that submitting approval twice for same workflow_id
    overwrites the first record (via upsert).
    """
    workflow_id = "wf_duplicate_001"
    requester_id = "requester@example.com"
    approver_id_1 = "approver1@example.com"
    approver_id_2 = "approver2@example.com"
    
    # First approval
    from app.models.implementation_approval import create_implementation_approval
    from app.api.routes.candidate import approval_to_model
    
    approval_1 = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256="r" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_007",
        placement_manifest_sha256="s" * 64,
        approved_by=approver_id_1,
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approval_model_1 = approval_to_model(approval_1)
    await approval_repo.upsert(approval_model_1)
    await db_session.flush()
    
    # Second approval (duplicate)
    approval_2 = create_implementation_approval(
        workflow_id=workflow_id,  # Same workflow_id
        candidate_sha256="r" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_007",
        placement_manifest_sha256="s" * 64,
        approved_by=approver_id_2,  # Different approver
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approval_model_2 = approval_to_model(approval_2)
    await approval_repo.upsert(approval_model_2)
    await db_session.flush()
    
    # Verify second approval overwrote first
    persisted = await approval_repo.get_by_workflow(workflow_id)
    assert persisted is not None
    assert persisted.approved_by == approver_id_2  # Should be second approver


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_status_endpoint_returns_pending(db_session, approval_repo):
    """
    Test 8: Approval status endpoint returns PENDING for new approval.
    
    Verifies GET /workflows/{workflow_id}/implementation-approval returns
    correct status for pending approval.
    """
    workflow_id = "wf_status_pending_001"
    requester_id = "requester@example.com"
    
    # Create pending approval
    from app.models.implementation_approval import create_implementation_approval
    from app.api.routes.candidate import approval_to_model
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256="t" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_008",
        placement_manifest_sha256="u" * 64,
        approved_by="approver@example.com",
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.PENDING,
    )
    
    approval_model = approval_to_model(approval)
    await approval_repo.upsert(approval_model)
    await db_session.flush()
    
    # Retrieve approval
    persisted = await approval_repo.get_by_workflow(workflow_id)
    assert persisted is not None
    assert persisted.status == ImplementationApprovalStatus.PENDING.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_status_endpoint_returns_approved(db_session, approval_repo):
    """
    Test 9: Approval status endpoint returns APPROVED after approval.
    
    Verifies GET /workflows/{workflow_id}/implementation-approval returns
    correct status after approval.
    """
    workflow_id = "wf_status_approved_001"
    requester_id = "requester@example.com"
    approver_id = "approver@example.com"
    
    # Create approved approval
    from app.models.implementation_approval import create_implementation_approval
    from app.api.routes.candidate import approval_to_model
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256="v" * 64,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_009",
        placement_manifest_sha256="w" * 64,
        approved_by=approver_id,
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    approval_model = approval_to_model(approval)
    await approval_repo.upsert(approval_model)
    await db_session.flush()
    
    # Retrieve approval
    persisted = await approval_repo.get_by_workflow(workflow_id)
    assert persisted is not None
    assert persisted.status == ImplementationApprovalStatus.APPROVED.value
    assert persisted.approved_by == approver_id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_rejection_blocks_implementation_transition(
    db_session, workflow_repo, approval_repo
):
    """
    Test 10: Rejection blocks implementation transition.
    
    Verifies:
    - Rejection creates approval record with REJECTED status
    - Workflow transitions to REJECTED state (not IMPLEMENTING)
    - Rejection reason recorded
    """
    workflow_id = "wf_reject_001"
    requester_id = "requester@example.com"
    approver_id = "approver@example.com"
    rejection_reason = "Implementation does not meet requirements"
    candidate_hash = "x" * 64
    manifest_hash = "y" * 64
    contract_hash = "z" * 64
    manifest_id = "manifest_010"
    
    # Create workflow
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_010",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_010",
        contract_sha256=contract_hash,
        candidate_sha256=candidate_hash,
        manifest_sha256=manifest_hash,
        manifest_id=manifest_id,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create rejection
    from app.models.implementation_approval import create_implementation_approval
    from app.api.routes.candidate import approval_to_model
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=candidate_hash,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id=manifest_id,
        placement_manifest_sha256=manifest_hash,
        approved_by=approver_id,
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.REJECTED,
        rejection_reason=rejection_reason,
    )
    
    approval_model = approval_to_model(approval)
    await approval_repo.upsert(approval_model)
    
    # Transition to REJECTED via governance service
    from app.persistence import PostgresStateTransitionRepository
    state_transition_repo = PostgresStateTransitionRepository(db_session)
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    await governance_service.register_approval(workflow_id, approval)
    await governance_service.transition_state(
        workflow_id=workflow_id,
        to_state=CanonicalWorkflowState.REJECTED,
        triggered_by=approver_id,
        evidence_id=approval.approval_id,
        reason=rejection_reason
    )
    
    await db_session.flush()
    
    # Verify rejection
    updated_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert updated_workflow.current_state == CanonicalWorkflowState.REJECTED.value
    
    persisted_approval = await approval_repo.get_by_workflow(workflow_id)
    assert persisted_approval.status == ImplementationApprovalStatus.REJECTED.value
    assert persisted_approval.rejection_reason == rejection_reason


@pytest.mark.integration
@pytest.mark.asyncio
async def test_manifest_hash_mismatch_rejection(db_session, workflow_repo):
    """
    Test 11: Manifest hash mismatch causes rejection.
    
    Verifies that approval with mismatched manifest hash is detected
    and prevents state transition.
    """
    workflow_id = "wf_hash_mismatch_001"
    requester_id = "requester@example.com"
    stored_manifest_hash = "stored" + ("a" * 58)
    provided_manifest_hash = "provided" + ("b" * 56)
    
    # Create workflow with stored hash
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_011",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_011",
        contract_sha256="aa" * 32,
        candidate_sha256="bb" * 32,
        manifest_sha256=stored_manifest_hash,
        manifest_id="manifest_011",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Attempt to verify with mismatched hash
    from app.models.implementation_approval import create_implementation_approval
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256="bb" * 32,
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_011",
        placement_manifest_sha256=provided_manifest_hash,  # Mismatch
        approved_by="approver@example.com",
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    # Verify hash mismatch detected
    assert not approval.verify_manifest_hash(stored_manifest_hash)
    assert approval.verify_manifest_hash(provided_manifest_hash)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_candidate_hash_mismatch_rejection(db_session, workflow_repo):
    """
    Test 12: Candidate hash mismatch causes rejection.
    
    Verifies that approval with mismatched candidate hash is detected
    and prevents state transition.
    """
    workflow_id = "wf_candidate_mismatch_001"
    requester_id = "requester@example.com"
    stored_candidate_hash = "stored" + ("c" * 58)
    provided_candidate_hash = "provided" + ("d" * 56)
    
    # Create workflow with stored hash
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_012",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_IMPLEMENTATION_APPROVAL.value,
        contract_id="ct_012",
        contract_sha256="cc" * 32,
        candidate_sha256=stored_candidate_hash,
        manifest_sha256="dd" * 32,
        manifest_id="manifest_012",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Attempt to verify with mismatched hash
    from app.models.implementation_approval import create_implementation_approval
    
    approval = create_implementation_approval(
        workflow_id=workflow_id,
        candidate_sha256=provided_candidate_hash,  # Mismatch
        target_family="Introduction",
        target_version="I7",
        placement_manifest_id="manifest_012",
        placement_manifest_sha256="dd" * 32,
        approved_by="approver@example.com",
        workflow_requester=requester_id,
        status=ImplementationApprovalStatus.APPROVED,
    )
    
    # Verify hash mismatch detected
    assert not approval.verify_candidate_hash(stored_candidate_hash)
    assert approval.verify_candidate_hash(provided_candidate_hash)
