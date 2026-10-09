"""
PostgreSQL Integration Tests for Repository CRUD Operations.

Tests each repository's operations against real PostgreSQL database:
- CRUD operations (create, read, update, delete)
- Idempotent upsert behavior
- Optimistic locking conflicts
- Hash integrity verification
- Hash drift detection
"""

import hashlib
import json
import pytest
from datetime import datetime

from app.persistence.models import (
    WorkflowModel,
    ContractModel,
    CandidateModel,
    ManifestModel,
    ApprovalModel,
    StateTransitionModel,
)
from app.persistence.repositories import (
    OptimisticLockError,
    HashMismatchError,
)


# ============================================================================
# Workflow Repository Tests
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_upsert_and_get(db_session, workflow_repo):
    """Test workflow upsert creates record and get retrieves it."""
    # Create workflow
    workflow = WorkflowModel(
        workflow_id="wf_test_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        version=1,
    )
    
    # Upsert
    result = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    assert result.workflow_id == "wf_test_001"
    assert result.specification_id == "spec_001"
    assert result.current_state == "REQUESTED"
    assert result.version == 1
    
    # Get
    retrieved = await workflow_repo.get("wf_test_001", verify_bindings=False)
    
    assert retrieved is not None
    assert retrieved.workflow_id == "wf_test_001"
    assert retrieved.specification_id == "spec_001"
    assert retrieved.current_state == "REQUESTED"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_upsert_idempotent(db_session, workflow_repo):
    """Test upserting same workflow_id twice increments version."""
    # First upsert
    workflow = WorkflowModel(
        workflow_id="wf_idempotent_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    result1 = await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    assert result1.version == 1
    
    # Second upsert with updated state (expect version to increment)
    workflow.current_state = "BRIEF_READY"
    workflow.version = 1  # Expect this version
    
    result2 = await workflow_repo.upsert(workflow, expected_version=1)
    await db_session.commit()
    
    assert result2.version == 2
    assert result2.current_state == "BRIEF_READY"
    
    # Verify only one record exists
    retrieved = await workflow_repo.get("wf_idempotent_001", verify_bindings=False)
    assert retrieved.version == 2


@pytest.mark.integration
@pytest.mark.asyncio
async def test_optimistic_locking_conflict(db_session, workflow_repo):
    """Test that concurrent update with wrong version raises OptimisticLockError."""
    # Create workflow
    workflow = WorkflowModel(
        workflow_id="wf_lock_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Simulate first update (version 1 → 2)
    workflow.current_state = "BRIEF_READY"
    await workflow_repo.upsert(workflow, expected_version=1)
    await db_session.commit()
    
    # Simulate second concurrent update with stale version
    workflow.current_state = "IMPLEMENTING"
    
    with pytest.raises(OptimisticLockError) as exc_info:
        await workflow_repo.upsert(workflow, expected_version=1)  # Wrong version
    
    assert exc_info.value.entity_type == "Workflow"
    assert exc_info.value.entity_id == "wf_lock_001"
    assert exc_info.value.expected_version == 1


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_list_by_state(db_session, workflow_repo):
    """Test listing workflows by state."""
    # Create workflows in different states
    wf1 = WorkflowModel(
        workflow_id="wf_list_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    wf2 = WorkflowModel(
        workflow_id="wf_list_002",
        specification_id="spec_002",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    wf3 = WorkflowModel(
        workflow_id="wf_list_003",
        specification_id="spec_003",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="IMPLEMENTING",
        version=1,
    )
    
    await workflow_repo.upsert(wf1)
    await workflow_repo.upsert(wf2)
    await workflow_repo.upsert(wf3)
    await db_session.commit()
    
    # List workflows in REQUESTED state
    requested = await workflow_repo.list_by_state("REQUESTED")
    
    requested_ids = [wf.workflow_id for wf in requested]
    assert "wf_list_001" in requested_ids
    assert "wf_list_002" in requested_ids
    assert "wf_list_003" not in requested_ids


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_delete(db_session, workflow_repo):
    """Test workflow deletion."""
    # Create workflow
    workflow = WorkflowModel(
        workflow_id="wf_delete_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Delete
    deleted = await workflow_repo.delete("wf_delete_001")
    await db_session.commit()
    
    assert deleted is True
    
    # Verify deleted
    retrieved = await workflow_repo.get("wf_delete_001", verify_bindings=False)
    assert retrieved is None
    
    # Delete non-existent
    deleted_again = await workflow_repo.delete("wf_delete_001")
    assert deleted_again is False


# ============================================================================
# Contract Repository Tests
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_upsert_and_get(db_session, contract_repo):
    """Test contract upsert and retrieval with hash verification."""
    # Create contract
    contract_data = {
        "purpose": "Test contract",
        "requirements": ["req1", "req2"],
    }
    
    canonical = json.dumps(contract_data, sort_keys=True, ensure_ascii=False)
    contract_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    contract = ContractModel(
        contract_id="ct_test_001",
        workflow_id="wf_test_001",
        contract_hash=contract_hash,
        contract_data=contract_data,
        created_at=datetime.utcnow(),
    )
    
    # Upsert
    result = await contract_repo.upsert(contract)
    await db_session.commit()
    
    assert result.contract_id == "ct_test_001"
    assert result.contract_hash == contract_hash
    
    # Get with automatic hash verification
    retrieved = await contract_repo.get("ct_test_001")
    
    assert retrieved is not None
    assert retrieved.contract_id == "ct_test_001"
    assert retrieved.contract_data == contract_data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_hash_integrity_stored_and_verified(db_session, contract_repo):
    """Test that contract hash is computed correctly and verified on read."""
    contract_data = {
        "purpose": "Hash integrity test",
        "blocks": ["block1", "block2"],
    }
    
    # Compute expected hash
    canonical = json.dumps(contract_data, sort_keys=True, ensure_ascii=False)
    expected_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    contract = ContractModel(
        contract_id="ct_hash_001",
        workflow_id="wf_hash_001",
        contract_hash=expected_hash,
        contract_data=contract_data,
        created_at=datetime.utcnow(),
    )
    
    await contract_repo.upsert(contract)
    await db_session.commit()
    
    # Read back and verify hash matches
    retrieved = await contract_repo.get("ct_hash_001")
    
    assert retrieved.contract_hash == expected_hash
    assert retrieved.verify_hash() is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_hash_drift_detection(db_session, contract_repo):
    """Test that manually corrupted contract_hash raises HashMismatchError."""
    contract_data = {
        "purpose": "Drift detection test",
    }
    
    canonical = json.dumps(contract_data, sort_keys=True, ensure_ascii=False)
    correct_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    contract = ContractModel(
        contract_id="ct_drift_001",
        workflow_id="wf_drift_001",
        contract_hash=correct_hash,
        contract_data=contract_data,
        created_at=datetime.utcnow(),
    )
    
    await contract_repo.upsert(contract)
    await db_session.commit()
    
    # Manually corrupt the hash in the database
    await db_session.execute(
        """
        UPDATE project_ai_contracts
        SET contract_hash = 'corrupted_hash_00000000000000000000000000000000'
        WHERE contract_id = 'ct_drift_001'
        """
    )
    await db_session.commit()
    
    # Attempt to read - should raise HashMismatchError
    with pytest.raises(HashMismatchError) as exc_info:
        await contract_repo.get("ct_drift_001")
    
    assert exc_info.value.entity_type == "Contract"
    assert exc_info.value.entity_id == "ct_drift_001"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_contract_get_by_workflow(db_session, contract_repo):
    """Test retrieving contract by workflow_id."""
    contract_data = {"purpose": "Test by workflow"}
    canonical = json.dumps(contract_data, sort_keys=True, ensure_ascii=False)
    contract_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    contract = ContractModel(
        contract_id="ct_wf_001",
        workflow_id="wf_contract_001",
        contract_hash=contract_hash,
        contract_data=contract_data,
        created_at=datetime.utcnow(),
    )
    
    await contract_repo.upsert(contract)
    await db_session.commit()
    
    # Get by workflow
    retrieved = await contract_repo.get_by_workflow("wf_contract_001")
    
    assert retrieved is not None
    assert retrieved.contract_id == "ct_wf_001"
    assert retrieved.workflow_id == "wf_contract_001"


# ============================================================================
# Candidate Repository Tests
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_candidate_upsert_and_get(db_session, candidate_repo):
    """Test candidate upsert and retrieval."""
    files_data = {
        "file1.ts": {"content": "console.log('test')"},
        "file2.ts": {"content": "export const x = 1"},
    }
    
    candidate = CandidateModel(
        candidate_id="cand_test_001",
        workflow_id="wf_test_001",
        files=files_data,
        uploaded_at=datetime.utcnow(),
        uploaded_by="user_test",
        target_family="tutorial",
        target_version="v1",
    )
    
    # Upsert (should compute hash automatically)
    result = await candidate_repo.upsert(candidate)
    await db_session.commit()
    
    assert result.candidate_id == "cand_test_001"
    assert result.candidate_sha256 is not None
    assert len(result.candidate_sha256) == 64  # SHA256 hex length
    
    # Get
    retrieved = await candidate_repo.get("cand_test_001")
    
    assert retrieved is not None
    assert retrieved.candidate_id == "cand_test_001"
    assert retrieved.files == files_data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_candidate_list_by_workflow(db_session, candidate_repo):
    """Test listing candidates by workflow."""
    cand1 = CandidateModel(
        candidate_id="cand_list_001",
        workflow_id="wf_cand_001",
        files={"file1.ts": {"content": "test1"}},
        uploaded_at=datetime.utcnow(),
        uploaded_by="user_test",
        target_family="tutorial",
        target_version="v1",
    )
    
    cand2 = CandidateModel(
        candidate_id="cand_list_002",
        workflow_id="wf_cand_001",
        files={"file2.ts": {"content": "test2"}},
        uploaded_at=datetime.utcnow(),
        uploaded_by="user_test",
        target_family="tutorial",
        target_version="v1",
    )
    
    cand3 = CandidateModel(
        candidate_id="cand_list_003",
        workflow_id="wf_cand_002",
        files={"file3.ts": {"content": "test3"}},
        uploaded_at=datetime.utcnow(),
        uploaded_by="user_test",
        target_family="tutorial",
        target_version="v1",
    )
    
    await candidate_repo.upsert(cand1)
    await candidate_repo.upsert(cand2)
    await candidate_repo.upsert(cand3)
    await db_session.commit()
    
    # List by workflow
    candidates = await candidate_repo.list_by_workflow("wf_cand_001")
    
    candidate_ids = [c.candidate_id for c in candidates]
    assert len(candidate_ids) == 2
    assert "cand_list_001" in candidate_ids
    assert "cand_list_002" in candidate_ids
    assert "cand_list_003" not in candidate_ids


# ============================================================================
# Manifest Repository Tests
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_manifest_upsert_and_get(db_session, manifest_repo):
    """Test manifest upsert and retrieval with hash verification."""
    manifest_data = {
        "decision": "ACCEPT",
        "target_path": "/test/path",
        "block_family": "tutorial",
        "block_version": "v1",
        "required_changes": [],
        "evidence_ids": ["ev1"],
    }
    
    canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
    manifest_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    manifest = ManifestModel(
        manifest_id="man_test_001",
        candidate_id="cand_test_001",
        manifest_hash=manifest_hash,
        decision="ACCEPT",
        target_path="/test/path",
        block_family="tutorial",
        block_version="v1",
        required_changes=[],
        evidence_ids=["ev1"],
        created_at=datetime.utcnow(),
    )
    
    # Upsert
    result = await manifest_repo.upsert(manifest)
    await db_session.commit()
    
    assert result.manifest_id == "man_test_001"
    assert result.manifest_hash == manifest_hash
    
    # Get with automatic hash verification
    retrieved = await manifest_repo.get("man_test_001")
    
    assert retrieved is not None
    assert retrieved.manifest_id == "man_test_001"
    assert retrieved.decision == "ACCEPT"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_manifest_hash_drift_detection(db_session, manifest_repo):
    """Test that corrupted manifest hash is detected on read."""
    manifest_data = {
        "decision": "ACCEPT",
        "target_path": "/test",
        "block_family": "tutorial",
        "block_version": "v1",
        "required_changes": [],
        "evidence_ids": [],
    }
    
    canonical = json.dumps(manifest_data, sort_keys=True, ensure_ascii=False)
    correct_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    manifest = ManifestModel(
        manifest_id="man_drift_001",
        candidate_id="cand_drift_001",
        manifest_hash=correct_hash,
        decision="ACCEPT",
        target_path="/test",
        block_family="tutorial",
        block_version="v1",
        required_changes=[],
        evidence_ids=[],
        created_at=datetime.utcnow(),
    )
    
    await manifest_repo.upsert(manifest)
    await db_session.commit()
    
    # Corrupt the hash
    await db_session.execute(
        """
        UPDATE project_ai_manifests
        SET manifest_hash = 'corrupted_hash'
        WHERE manifest_id = 'man_drift_001'
        """
    )
    await db_session.commit()
    
    # Should raise HashMismatchError
    with pytest.raises(HashMismatchError) as exc_info:
        await manifest_repo.get("man_drift_001")
    
    assert exc_info.value.entity_type == "Manifest"


# ============================================================================
# Approval Repository Tests
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_upsert_and_get(db_session, approval_repo):
    """Test approval upsert and retrieval."""
    approval = ApprovalModel(
        approval_id="app_test_001",
        workflow_id="wf_test_001",
        candidate_sha256="abc123" * 10 + "abcd",  # 64 chars
        placement_manifest_id="man_test_001",
        placement_manifest_sha256="def456" * 10 + "defg",  # 64 chars
        target_family="tutorial",
        target_version="v1",
        approved_by="reviewer_test",
        approval_timestamp=datetime.utcnow(),
        status="APPROVED",
        workflow_requester="user_test",
    )
    
    # Upsert
    result = await approval_repo.upsert(approval)
    await db_session.commit()
    
    assert result.approval_id == "app_test_001"
    assert result.status == "APPROVED"
    
    # Get
    retrieved = await approval_repo.get("app_test_001")
    
    assert retrieved is not None
    assert retrieved.approval_id == "app_test_001"
    assert retrieved.status == "APPROVED"
    assert retrieved.approved_by == "reviewer_test"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_get_by_workflow(db_session, approval_repo):
    """Test retrieving approval by workflow_id."""
    approval = ApprovalModel(
        approval_id="app_wf_001",
        workflow_id="wf_approval_001",
        candidate_sha256="abc" * 20 + "abcd",
        target_family="tutorial",
        target_version="v1",
        approved_by="reviewer",
        approval_timestamp=datetime.utcnow(),
        status="APPROVED",
        workflow_requester="user",
    )
    
    await approval_repo.upsert(approval)
    await db_session.commit()
    
    # Get by workflow
    retrieved = await approval_repo.get_by_workflow("wf_approval_001")
    
    assert retrieved is not None
    assert retrieved.approval_id == "app_wf_001"
    assert retrieved.workflow_id == "wf_approval_001"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_approval_list_by_status(db_session, approval_repo):
    """Test listing approvals by status."""
    app1 = ApprovalModel(
        approval_id="app_status_001",
        workflow_id="wf_001",
        candidate_sha256="a" * 64,
        target_family="tutorial",
        target_version="v1",
        approved_by="reviewer",
        approval_timestamp=datetime.utcnow(),
        status="APPROVED",
        workflow_requester="user",
    )
    
    app2 = ApprovalModel(
        approval_id="app_status_002",
        workflow_id="wf_002",
        candidate_sha256="b" * 64,
        target_family="tutorial",
        target_version="v1",
        approved_by="reviewer",
        approval_timestamp=datetime.utcnow(),
        status="PENDING",
        workflow_requester="user",
    )
    
    await approval_repo.upsert(app1)
    await approval_repo.upsert(app2)
    await db_session.commit()
    
    # List approved
    approved = await approval_repo.list_by_status("APPROVED")
    approved_ids = [a.approval_id for a in approved]
    
    assert "app_status_001" in approved_ids
    assert "app_status_002" not in approved_ids


# ============================================================================
# State Transition Repository Tests
# ============================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_state_transition_create_and_list(db_session, workflow_repo, state_transition_repo):
    """Test creating state transitions and listing by workflow."""
    # Create workflow first
    workflow = WorkflowModel(
        workflow_id="wf_trans_001",
        specification_id="spec_001",
        target_family="tutorial",
        target_version="v1",
        requester_id="user_test",
        current_state="REQUESTED",
        version=1,
    )
    
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    
    # Create transitions
    trans1 = StateTransitionModel(
        workflow_id="wf_trans_001",
        from_state="REQUESTED",
        to_state="BRIEF_READY",
        timestamp=datetime.utcnow(),
        triggered_by="system",
    )
    
    trans2 = StateTransitionModel(
        workflow_id="wf_trans_001",
        from_state="BRIEF_READY",
        to_state="IMPLEMENTING",
        timestamp=datetime.utcnow(),
        triggered_by="user_test",
    )
    
    result1 = await state_transition_repo.create(trans1)
    result2 = await state_transition_repo.create(trans2)
    await db_session.commit()
    
    assert result1.id is not None
    assert result2.id is not None
    
    # List transitions
    transitions = await state_transition_repo.list_by_workflow("wf_trans_001")
    
    assert len(transitions) == 2
    assert transitions[0].from_state == "REQUESTED"
    assert transitions[1].from_state == "BRIEF_READY"
