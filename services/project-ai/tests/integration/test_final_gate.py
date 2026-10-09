"""
Integration Tests for Final Gate (W7) - M2.9 Wave 7

Tests the complete final approval workflow including:
- Final approval endpoint integration with governance service
- FinalGateController evidence verification
- State transitions (AWAITING_GATE_2 → CERTIFIED/REJECTED)
- Evidence verification and gate check integration
- PostgreSQL persistence via repositories

Requires PostgreSQL configured via TEST_DATABASE_URL_TUTORIAL environment variable.
"""

import pytest
from datetime import datetime, timezone

from app.persistence.models import WorkflowModel
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.orchestration.workflow_governance import WorkflowGovernanceService
from app.agents.final_gate import FinalGateController


@pytest.mark.integration
@pytest.mark.asyncio
async def test_final_approval_submission_success(db_session, workflow_repo, approval_repo, state_transition_repo):
    """
    Test 1: Complete workflow - all gates pass → CERTIFICATION_READY → CERTIFIED.
    
    Verifies:
    - Workflow in AWAITING_GATE_2 state
    - All gates return PASS
    - Final approval transitions to CERTIFIED
    - Approval decision persisted with audit trail
    """
    workflow_id = "wf_final_approve_001"
    requester_id = "requester@example.com"
    approver_id = "haa@example.com"
    
    # Gate results: all PASS
    gate_results = {
        "certification_gates": {"status": "PASS", "tests_passing": 38, "tests_total": 38},
        "runtime_verification": {"status": "PASS", "checks": ["http_health_check"]},
        "canonical_comparison": {"status": "PASS", "similarity": 0.95},
        "placement_approval": {"status": "PASS", "approved_by": approver_id}
    }
    
    # Create workflow in AWAITING_GATE_2 state
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_final_001",
        target_family="Introduction",
        target_version="I7",
        requester_id=requester_id,
        current_state=CanonicalWorkflowState.AWAITING_GATE_2.value,
        contract_id="ct_final_001",
        contract_sha256="a" * 64,
        candidate_sha256="b" * 64,
        manifest_sha256="c" * 64,
        manifest_id="manifest_final_001",
        gate_results=gate_results,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create governance service
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, gate_results)
    
    assert verdict_result.verdict == "CERTIFICATION_READY"
    assert len(verdict_result.missing_evidence) == 0
    assert len(verdict_result.failed_gates) == 0
    
    # Simulate final approval
    await governance_service.transition_state(
        workflow_id=workflow_id,
        to_state=CanonicalWorkflowState.CERTIFIED,
        triggered_by=approver_id,
        evidence_id=None,
        reason="All gates passed, HAA approved"
    )
    
    await db_session.flush()
    
    # Verify workflow transitioned to CERTIFIED
    updated_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert updated_workflow.current_state == CanonicalWorkflowState.CERTIFIED.value
    assert updated_workflow.final_status == "CERTIFIED"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_final_approval_requires_awaiting_state(db_session, workflow_repo, approval_repo, state_transition_repo):
    """
    Test 2: Cannot approve from wrong state - must be in AWAITING_GATE_2.
    
    Verifies:
    - Workflow in VERIFYING state (not AWAITING_GATE_2)
    - Transition to CERTIFIED fails with error
    - State remains unchanged
    """
    workflow_id = "wf_final_wrong_state_001"
    
    # Create workflow in VERIFYING state (wrong state)
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_final_002",
        target_family="Introduction",
        target_version="I7",
        requester_id="requester@example.com",
        current_state=CanonicalWorkflowState.VERIFYING.value,
        contract_id="ct_final_002",
        contract_sha256="d" * 64,
        candidate_sha256="e" * 64,
        manifest_sha256="f" * 64,
        manifest_id="manifest_final_002",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create governance service
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    # Attempt to transition to CERTIFIED from wrong state
    with pytest.raises(ValueError, match="Invalid transition"):
        await governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.CERTIFIED,
            triggered_by="haa@example.com",
            evidence_id=None,
            reason="Invalid transition attempt"
        )
    
    await db_session.flush()
    
    # Verify workflow state unchanged
    unchanged_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert unchanged_workflow.current_state == CanonicalWorkflowState.VERIFYING.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_blocks_when_w6_not_complete(db_session, workflow_repo):
    """
    Test 3: Missing evidence → BLOCKED verdict.
    
    Verifies:
    - Missing required evidence (e.g., runtime_verification missing)
    - FinalGateController returns BLOCKED verdict
    - Lists missing evidence keys
    """
    workflow_id = "wf_final_blocked_001"
    
    # Gate results: missing runtime_verification
    incomplete_gate_results = {
        "certification_gates": {"status": "PASS"},
        # runtime_verification missing
        "canonical_comparison": {"status": "PASS"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, incomplete_gate_results)
    
    assert verdict_result.verdict == "BLOCKED"
    assert "runtime_verification" in verdict_result.missing_evidence
    assert len(verdict_result.failed_gates) == 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_blocks_on_critical_security_issues(db_session, workflow_repo):
    """
    Test 4: One gate fails → FAIL verdict.
    
    Verifies:
    - One gate returns FAIL status
    - FinalGateController returns FAIL verdict
    - Lists failed gates
    """
    workflow_id = "wf_final_fail_001"
    
    # Gate results: runtime_verification FAIL
    failed_gate_results = {
        "certification_gates": {"status": "PASS"},
        "runtime_verification": {"status": "FAIL", "error": "HTTP health check failed"},
        "canonical_comparison": {"status": "PASS"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, failed_gate_results)
    
    assert verdict_result.verdict == "FAIL"
    assert "runtime_verification" in verdict_result.failed_gates
    assert len(verdict_result.missing_evidence) == 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_blocks_when_tests_failing(db_session, workflow_repo):
    """
    Test 5: Certification gates failing → FAIL verdict.
    
    Verifies:
    - Certification gates return FAIL status
    - FinalGateController returns FAIL verdict
    """
    workflow_id = "wf_final_tests_fail_001"
    
    # Gate results: certification_gates FAIL
    failed_gate_results = {
        "certification_gates": {"status": "FAIL", "tests_passing": 30, "tests_total": 38},
        "runtime_verification": {"status": "PASS"},
        "canonical_comparison": {"status": "PASS"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, failed_gate_results)
    
    assert verdict_result.verdict == "FAIL"
    assert "certification_gates" in verdict_result.failed_gates


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_blocks_when_migrations_not_applied(db_session, workflow_repo):
    """
    Test 6: Blocked gates → BLOCKED verdict.
    
    Verifies:
    - One gate returns BLOCKED status
    - FinalGateController returns BLOCKED verdict
    - Lists blocked gates
    """
    workflow_id = "wf_final_blocked_gate_001"
    
    # Gate results: canonical_comparison BLOCKED
    blocked_gate_results = {
        "certification_gates": {"status": "PASS"},
        "runtime_verification": {"status": "PASS"},
        "canonical_comparison": {"status": "BLOCKED", "reason": "Migrations not applied"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, blocked_gate_results)
    
    assert verdict_result.verdict == "BLOCKED"
    assert "canonical_comparison" in verdict_result.blocked_gates
    assert len(verdict_result.failed_gates) == 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_blocks_when_docs_incomplete(db_session, workflow_repo):
    """
    Test 7: Multiple blocked gates → BLOCKED verdict.
    
    Verifies:
    - Multiple gates return BLOCKED status
    - FinalGateController returns BLOCKED verdict
    - Lists all blocked gates
    """
    workflow_id = "wf_final_multi_blocked_001"
    
    # Gate results: multiple BLOCKED
    multi_blocked_gate_results = {
        "certification_gates": {"status": "BLOCKED", "reason": "Documentation incomplete"},
        "runtime_verification": {"status": "PASS"},
        "canonical_comparison": {"status": "BLOCKED", "reason": "Schema validation pending"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, multi_blocked_gate_results)
    
    assert verdict_result.verdict == "BLOCKED"
    assert "certification_gates" in verdict_result.blocked_gates
    assert "canonical_comparison" in verdict_result.blocked_gates
    assert len(verdict_result.blocked_gates) == 2


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_passes_when_all_checks_pass(db_session, workflow_repo):
    """
    Test 8: All gates pass → CERTIFICATION_READY verdict.
    
    Verifies:
    - All required gates present
    - All gates return PASS status
    - FinalGateController returns CERTIFICATION_READY verdict
    - No missing, failed, or blocked gates
    """
    workflow_id = "wf_final_all_pass_001"
    
    # Gate results: all PASS
    all_pass_gate_results = {
        "certification_gates": {"status": "PASS", "tests_passing": 38, "tests_total": 38},
        "runtime_verification": {"status": "PASS", "checks": ["http_health_check"]},
        "canonical_comparison": {"status": "PASS", "similarity": 0.95},
        "placement_approval": {"status": "PASS", "approved_by": "approver@example.com"}
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, all_pass_gate_results)
    
    assert verdict_result.verdict == "CERTIFICATION_READY"
    assert len(verdict_result.missing_evidence) == 0
    assert len(verdict_result.failed_gates) == 0
    assert len(verdict_result.blocked_gates) == 0
    assert verdict_result.reason == "all_gates_passed_awaiting_human_gate_2"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_terminal_state_prevents_transitions(db_session, workflow_repo, approval_repo, state_transition_repo):
    """
    Test 9 (Bonus): Terminal state prevents new transitions through governance service.
    
    Verifies:
    - Workflow already in CERTIFIED state
    - Attempting to transition to CERTIFIED again via governance service raises error
    - State remains CERTIFIED
    - Tests non-idempotence of underlying state machine
    """
    workflow_id = "wf_final_idempotent_001"
    
    # Create workflow already CERTIFIED
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_final_003",
        target_family="Introduction",
        target_version="I7",
        requester_id="requester@example.com",
        current_state=CanonicalWorkflowState.CERTIFIED.value,
        contract_id="ct_final_003",
        contract_sha256="g" * 64,
        candidate_sha256="h" * 64,
        manifest_sha256="i" * 64,
        manifest_id="manifest_final_003",
        final_status="CERTIFIED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create governance service
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    # Attempt to transition CERTIFIED → CERTIFIED (invalid transition)
    with pytest.raises(ValueError, match="Invalid transition"):
        await governance_service.transition_state(
            workflow_id=workflow_id,
            to_state=CanonicalWorkflowState.CERTIFIED,
            triggered_by="haa@example.com",
            evidence_id=None,
            reason="Redundant approval attempt"
        )
    
    await db_session.flush()
    
    # Verify workflow state unchanged
    unchanged_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert unchanged_workflow.current_state == CanonicalWorkflowState.CERTIFIED.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_gate_returns_detailed_check_results(db_session, workflow_repo):
    """
    Test 10 (Bonus): Gate check results include detailed evidence summary.
    
    Verifies:
    - FinalGateController returns evidence_summary
    - Evidence summary contains all gate results
    - Can be used for detailed reporting
    """
    workflow_id = "wf_final_detailed_001"
    
    # Gate results with detailed information
    detailed_gate_results = {
        "certification_gates": {
            "status": "PASS",
            "tests_passing": 38,
            "tests_total": 38,
            "duration_ms": 1523
        },
        "runtime_verification": {
            "status": "PASS",
            "checks": ["http_health_check", "service_startup"],
            "duration_ms": 2341
        },
        "canonical_comparison": {
            "status": "PASS",
            "similarity": 0.95,
            "matched_files": 12
        },
        "placement_approval": {
            "status": "PASS",
            "approved_by": "approver@example.com",
            "timestamp": "2026-01-30T10:00:00Z"
        }
    }
    
    # Verify evidence using FinalGateController
    final_gate = FinalGateController()
    verdict_result = final_gate.compute_verdict(workflow_id, detailed_gate_results)
    
    assert verdict_result.verdict == "CERTIFICATION_READY"
    assert verdict_result.evidence_summary == detailed_gate_results
    
    # Verify detailed gate information preserved
    assert verdict_result.evidence_summary["certification_gates"]["tests_passing"] == 38
    assert verdict_result.evidence_summary["runtime_verification"]["duration_ms"] == 2341
    assert verdict_result.evidence_summary["canonical_comparison"]["similarity"] == 0.95


@pytest.mark.integration
@pytest.mark.asyncio
async def test_endpoint_blocks_approval_when_evidence_fails(db_session, workflow_repo, approval_repo, state_transition_repo):
    """
    Test 11: Endpoint blocks approval when evidence verification fails.
    
    Verifies:
    - Workflow in AWAITING_GATE_2 state with failed gates
    - Endpoint rejects approval with 400 error
    - Error message indicates evidence verification failure
    - State remains AWAITING_GATE_2
    
    This test verifies that the endpoint enforces evidence verification,
    not just reports it informationaly.
    """
    from app.api.routes.workflows import approve_final_certification
    from app.api.schemas.workflow import FinalApprovalRequest
    from fastapi import HTTPException
    from unittest.mock import MagicMock
    
    workflow_id = "wf_endpoint_block_001"
    
    # Gate results: runtime_verification FAIL
    failed_gate_results = {
        "certification_gates": {"status": "PASS"},
        "runtime_verification": {"status": "FAIL", "error": "HTTP health check failed"},
        "canonical_comparison": {"status": "PASS"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Create workflow in AWAITING_GATE_2 state with failed gates
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_endpoint_block_001",
        target_family="Introduction",
        target_version="I7",
        requester_id="requester@example.com",
        current_state=CanonicalWorkflowState.AWAITING_GATE_2.value,
        contract_id="ct_endpoint_block_001",
        contract_sha256="x" * 64,
        candidate_sha256="y" * 64,
        manifest_sha256="z" * 64,
        manifest_id="manifest_endpoint_block_001",
        gate_results=failed_gate_results,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create governance service
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    # Create mock user
    mock_user = {"email": "haa@example.com", "sub": "haa-001"}
    
    # Attempt to approve despite failed evidence
    approval_request = FinalApprovalRequest(
        approved=True,
        reason="Attempting approval despite failed gates"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await approve_final_certification(
            workflow_id=workflow_id,
            request=approval_request,
            user=mock_user,
            governance_service=governance_service,
            session=db_session
        )
    
    assert exc_info.value.status_code == 400
    assert "evidence verification failed" in exc_info.value.detail.lower()
    assert "FAIL" in exc_info.value.detail or "fail" in exc_info.value.detail
    
    # Verify state remains AWAITING_GATE_2
    unchanged_workflow = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert unchanged_workflow.current_state == CanonicalWorkflowState.AWAITING_GATE_2.value


@pytest.mark.integration
@pytest.mark.asyncio
async def test_endpoint_idempotent_for_repeated_approval(db_session, workflow_repo, approval_repo, state_transition_repo):
    """
    Test 12: Endpoint is truly idempotent for repeated identical requests.
    
    Verifies:
    - First approval succeeds and transitions to CERTIFIED
    - Second identical approval returns 200 with existing state
    - No error raised for idempotent request
    - State remains CERTIFIED
    
    This is true idempotence: multiple identical requests produce the same
    result without error, allowing safe retries.
    """
    from app.api.routes.workflows import approve_final_certification
    from app.api.schemas.workflow import FinalApprovalRequest
    
    workflow_id = "wf_endpoint_idempotent_001"
    
    # Gate results: all PASS
    all_pass_gate_results = {
        "certification_gates": {"status": "PASS", "tests_passing": 38, "tests_total": 38},
        "runtime_verification": {"status": "PASS"},
        "canonical_comparison": {"status": "PASS"},
        "placement_approval": {"status": "PASS"}
    }
    
    # Create workflow in AWAITING_GATE_2 state
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_endpoint_idempotent_001",
        target_family="Introduction",
        target_version="I7",
        requester_id="requester@example.com",
        current_state=CanonicalWorkflowState.AWAITING_GATE_2.value,
        contract_id="ct_endpoint_idempotent_001",
        contract_sha256="p" * 64,
        candidate_sha256="q" * 64,
        manifest_sha256="r" * 64,
        manifest_id="manifest_endpoint_idempotent_001",
        gate_results=all_pass_gate_results,
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.flush()
    
    # Create governance service
    governance_service = WorkflowGovernanceService(
        workflow_repo=workflow_repo,
        approval_repo=approval_repo,
        state_transition_repo=state_transition_repo,
        session=db_session
    )
    
    # Create mock user
    mock_user = {"email": "haa@example.com", "sub": "haa-001"}
    
    # First approval - should succeed
    approval_request = FinalApprovalRequest(
        approved=True,
        reason="All gates passed, certifying workflow"
    )
    
    response1 = await approve_final_certification(
        workflow_id=workflow_id,
        request=approval_request,
        user=mock_user,
        governance_service=governance_service,
        session=db_session
    )
    
    assert response1.approved == True
    assert response1.new_state == CanonicalWorkflowState.CERTIFIED.value
    assert response1.evidence_verified == True
    
    await db_session.commit()
    
    # Refresh workflow to simulate second request
    workflow_after_first = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert workflow_after_first.current_state == CanonicalWorkflowState.CERTIFIED.value
    
    # Second identical approval - should return 200 with existing state (idempotent)
    response2 = await approve_final_certification(
        workflow_id=workflow_id,
        request=approval_request,
        user=mock_user,
        governance_service=governance_service,
        session=db_session
    )
    
    # Should return successful response without error
    assert response2.approved == True
    assert response2.new_state == CanonicalWorkflowState.CERTIFIED.value
    
    # Verify state still CERTIFIED
    workflow_after_second = await workflow_repo.get(workflow_id, verify_bindings=False)
    assert workflow_after_second.current_state == CanonicalWorkflowState.CERTIFIED.value

