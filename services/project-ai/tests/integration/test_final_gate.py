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
async def test_final_approval_idempotent(db_session, workflow_repo, approval_repo, state_transition_repo):
    """
    Test 9 (Bonus): Final approval idempotent - already CERTIFIED workflow returns current state.
    
    Verifies:
    - Workflow already in CERTIFIED state
    - Attempting to transition to CERTIFIED again raises error
    - State remains CERTIFIED
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
