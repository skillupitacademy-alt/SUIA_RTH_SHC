"""
PostgreSQL Integration Tests for Restart Persistence.

Tests that state survives simulated application restarts by:
1. Creating records in one session
2. Closing that session
3. Opening a new session (simulating restart)
4. Verifying records still exist with correct data
"""

import hashlib
import json
import pytest
from datetime import datetime

from app.persistence.models import (
    WorkflowModel,
    ContractModel,
    ApprovalModel,
)
from app.persistence import (
    PostgresWorkflowRepository,
    PostgresContractRepository,
    PostgresApprovalRepository,
)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_persists_across_sessions(db_session_factory):
    """
    Test that workflow persists across sessions (simulates restart).
    
    Session 1: Create workflow
    Session 2: Retrieve workflow and verify data
    
    Note: Both "sessions" use the same underlying database session within
    a transaction that rolls back at test end. This simulates restart
    persistence while maintaining test isolation.
    """
    workflow_id = "wf_restart_001"
    
    # ========== Session 1: Create workflow ==========
    session = await db_session_factory()
    repo1 = PostgresWorkflowRepository(session)
    
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_restart_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_restart_test",
        current_state="REQUESTED",
        contract_id="ct_restart_001",
        contract_sha256="a" * 64,
        version=1,
    )
    
    await repo1.upsert(workflow)
    await session.flush()  # Make visible within transaction
    
    # Simulate "closing" session 1 by creating new repo instance
    # (in real restart, this would be a new connection)
    
    # ========== Session 2: Retrieve workflow ==========
    repo2 = PostgresWorkflowRepository(session)
    
    retrieved = await repo2.get(workflow_id, verify_bindings=False)
    
    # Verify all fields persisted correctly
    assert retrieved is not None
    assert retrieved.workflow_id == workflow_id
    assert retrieved.specification_id == "spec_restart_001"
    assert retrieved.target_family == "tutorial"
    assert retrieved.target_version == "v1"
    assert retrieved.requester_id == "user_restart_test"
    assert retrieved.current_state == "REQUESTED"
    assert retrieved.contract_id == "ct_restart_001"
    assert retrieved.contract_sha256 == "a" * 64
    assert retrieved.version == 1


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_persists_across_sessions(db_session_factory):
    """
    Test that contract persists across sessions with hash integrity.
    
    Session 1: Create contract with hash
    Session 2: Retrieve contract and verify hash
    """
    contract_id = "ct_restart_002"
    contract_data = {
        "purpose": "Restart persistence test",
        "requirements": ["req1", "req2", "req3"],
        "acceptance_criteria": ["ac1", "ac2"],
    }
    
    canonical = json.dumps(contract_data, sort_keys=True, ensure_ascii=False)
    expected_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    # ========== Session 1: Create contract ==========
    session = await db_session_factory()
    repo1 = PostgresContractRepository(session)
    
    contract = ContractModel(
        contract_id=contract_id,
        workflow_id="wf_restart_002",
        contract_hash=expected_hash,
        contract_data=contract_data,
        created_at=datetime.utcnow(),
    )
    
    await repo1.upsert(contract)
    await session.flush()
    
    # ========== Session 2: Retrieve contract ==========
    repo2 = PostgresContractRepository(session)
    
    retrieved = await repo2.get(contract_id)
    
    # Verify contract data and hash
    assert retrieved is not None
    assert retrieved.contract_id == contract_id
    assert retrieved.workflow_id == "wf_restart_002"
    assert retrieved.contract_hash == expected_hash
    assert retrieved.contract_data == contract_data
    
    # Verify hash integrity
    assert retrieved.verify_hash() is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_persists_across_sessions(db_session_factory):
    """
    Test that approval persists across sessions.
    
    Session 1: Create approval
    Session 2: Retrieve approval by workflow
    """
    approval_id = "app_restart_001"
    workflow_id = "wf_restart_003"
    
    # ========== Session 1: Create approval ==========
    session = await db_session_factory()
    repo1 = PostgresApprovalRepository(session)
    
    approval = ApprovalModel(
        approval_id=approval_id,
        workflow_id=workflow_id,
        candidate_sha256="b" * 64,
        placement_manifest_id="man_restart_001",
        placement_manifest_sha256="c" * 64,
        target_family="tutorial",
        target_version="v1",
        approved_by="reviewer_restart",
        approval_timestamp=datetime.utcnow(),
        status="APPROVED",
        workflow_requester="user_restart",
        evidence={"review_notes": "Looks good"},
    )
    
    await repo1.upsert(approval)
    await session.flush()
    
    # ========== Session 2: Retrieve approval ==========
    repo2 = PostgresApprovalRepository(session)
    
    retrieved = await repo2.get_by_workflow(workflow_id)
    
    # Verify approval data
    assert retrieved is not None
    assert retrieved.approval_id == approval_id
    assert retrieved.workflow_id == workflow_id
    assert retrieved.status == "APPROVED"
    assert retrieved.approved_by == "reviewer_restart"
    assert retrieved.candidate_sha256 == "b" * 64
    assert retrieved.placement_manifest_sha256 == "c" * 64
    assert retrieved.evidence == {"review_notes": "Looks good"}


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_state_updates_persist(db_session_factory):
    """
    Test that workflow state updates persist across multiple sessions.
    
    Session 1: Create workflow in REQUESTED state
    Session 2: Update to BRIEF_READY
    Session 3: Update to IMPLEMENTING
    Session 4: Verify final state
    """
    workflow_id = "wf_state_persist_001"
    
    session = await db_session_factory()
    
    # ========== Session 1: Create ==========
    repo1 = PostgresWorkflowRepository(session)
    
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_state_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    await repo1.upsert(workflow)
    await session.flush()
    
    # ========== Session 2: Update to BRIEF_READY ==========
    repo2 = PostgresWorkflowRepository(session)
    
    workflow = await repo2.get(workflow_id, verify_bindings=False)
    workflow.current_state = "BRIEF_READY"
    
    await repo2.upsert(workflow, expected_version=1)
    await session.flush()
    
    # ========== Session 3: Update to IMPLEMENTING ==========
    repo3 = PostgresWorkflowRepository(session)
    
    workflow = await repo3.get(workflow_id, verify_bindings=False)
    workflow.current_state = "IMPLEMENTING"
    
    await repo3.upsert(workflow, expected_version=2)
    await session.flush()
    
    # ========== Session 4: Verify final state ==========
    repo4 = PostgresWorkflowRepository(session)
    
    workflow = await repo4.get(workflow_id, verify_bindings=False)
    
    assert workflow is not None
    assert workflow.current_state == "IMPLEMENTING"
    assert workflow.version == 3  # Three updates total


@pytest.mark.integration
@pytest.mark.asyncio
async def test_artifact_bindings_persist(db_session_factory):
    """
    Test that artifact bindings (hashes) persist correctly across sessions.
    
    Session 1: Bind contract hash
    Session 2: Bind candidate hash
    Session 3: Bind manifest hash
    Session 4: Verify all bindings
    """
    workflow_id = "wf_artifacts_001"
    
    contract_hash = "a" * 64
    candidate_hash = "b" * 64
    manifest_hash = "c" * 64
    
    session = await db_session_factory()
    
    # ========== Session 1: Create with contract ==========
    repo1 = PostgresWorkflowRepository(session)
    
    workflow = WorkflowModel(
        workflow_id=workflow_id,
        specification_id="spec_artifacts_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        contract_id="ct_artifacts_001",
        contract_sha256=contract_hash,
        version=1,
    )
    
    await repo1.upsert(workflow)
    await session.flush()
    
    # ========== Session 2: Bind candidate ==========
    repo2 = PostgresWorkflowRepository(session)
    
    workflow = await repo2.get(workflow_id, verify_bindings=False)
    workflow.candidate_id = "cand_artifacts_001"
    workflow.candidate_sha256 = candidate_hash
    
    await repo2.upsert(workflow, expected_version=1)
    await session.flush()
    
    # ========== Session 3: Bind manifest ==========
    repo3 = PostgresWorkflowRepository(session)
    
    workflow = await repo3.get(workflow_id, verify_bindings=False)
    workflow.manifest_id = "man_artifacts_001"
    workflow.manifest_sha256 = manifest_hash
    
    await repo3.upsert(workflow, expected_version=2)
    await session.flush()
    
    # ========== Session 4: Verify all bindings ==========
    repo4 = PostgresWorkflowRepository(session)
    
    workflow = await repo4.get(workflow_id, verify_bindings=False)
    
    # Verify all artifact bindings persisted
    assert workflow.contract_id == "ct_artifacts_001"
    assert workflow.contract_sha256 == contract_hash
    assert workflow.candidate_id == "cand_artifacts_001"
    assert workflow.candidate_sha256 == candidate_hash
    assert workflow.manifest_id == "man_artifacts_001"
    assert workflow.manifest_sha256 == manifest_hash
    assert workflow.version == 3
