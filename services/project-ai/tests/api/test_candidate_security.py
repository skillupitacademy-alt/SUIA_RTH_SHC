"""
API-level security regression tests for W5-R2 remediation.

These tests verify the W4/W5 authorization boundary is enforced at the API layer:
- No execution without approval
- Legacy ApprovalStatus enum rejected
- All bindings verified (candidate_sha256, manifest_id, manifest_sha256)
- Self-approval blocked
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.candidate import BlockFamily, CandidateFile, CandidatePackage
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
    create_implementation_approval,
)
from app.api.routes.candidate import _approvals_store, _candidates_store, _manifests_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_stores():
    """Clear in-memory stores before each test."""
    _approvals_store.clear()
    _candidates_store.clear()
    _manifests_store.clear()
    yield
    _approvals_store.clear()
    _candidates_store.clear()
    _manifests_store.clear()


@pytest.fixture
def sample_candidate():
    """Create sample candidate package."""
    html_content = """
    <div class="tutorial-container" data-block-type="tutorial">
        <h1>Security Test Tutorial</h1>
        <div data-step="1">Step 1</div>
    </div>
    """
    
    files = [
        CandidateFile(
            filename="tutorial.html",
            content=html_content,
            contentType="text/html",
            hash=hashlib.sha256(html_content.encode('utf-8')).hexdigest()
        )
    ]
    
    package = CandidatePackage(
        candidateId="test-security-001",
        files=files,
        uploadedAt=datetime.now(timezone.utc).isoformat() + "Z",
        uploadedBy="test-user"
    )
    
    # Compute candidate SHA-256
    sha256_hash = hashlib.sha256()
    for file in sorted(files, key=lambda f: f.filename):
        content_bytes = file.content.encode('utf-8')
        file_hash = hashlib.sha256(content_bytes)
        sha256_hash.update(file_hash.digest())
    candidate_sha256 = sha256_hash.hexdigest()
    
    return package, candidate_sha256


@pytest.fixture
def sample_manifest(sample_candidate):
    """Create sample placement manifest."""
    package, _ = sample_candidate
    
    manifest_data = {
        "manifestId": "manifest-security-001",
        "candidateId": "test-security-001",
        "decision": "ADD",
        "targetPath": "packages/tutorial-blocks/TutorialT1Block",
        "blockFamily": "Tutorial",
        "blockVersion": "T1",
        "requiredChanges": ["Create new block package"],
        "evidenceIds": ["evidence-001"],
        "createdAt": datetime.now(timezone.utc).isoformat() + "Z"
    }
    
    manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
    manifest_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    
    from app.models.candidate import PlacementManifest, PlacementDecision
    
    manifest = PlacementManifest(
        manifestId=manifest_data["manifestId"],
        candidateId=manifest_data["candidateId"],
        decision=PlacementDecision.ADD,
        targetPath=manifest_data["targetPath"],
        blockFamily=BlockFamily.TUTORIAL,
        blockVersion=manifest_data["blockVersion"],
        requiredChanges=manifest_data["requiredChanges"],
        evidenceIds=manifest_data["evidenceIds"],
        manifestHash=manifest_hash,
        createdAt=manifest_data["createdAt"]
    )
    
    # Add workflow binding metadata
    manifest._workflow_id = "wf-security-001"
    manifest._requester_id = "requester@example.com"
    
    return manifest, manifest_hash


def test_placement_rejected_without_approval(sample_candidate, sample_manifest):
    """Test placement execution rejected when no approval exists."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Try to execute without approval
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    assert "approval enforcement failed" in response.json()["detail"].lower()


def test_placement_rejected_with_legacy_approval_status(sample_candidate, sample_manifest):
    """Test that legacy ApprovalStatus enum is rejected (no longer accepted)."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Try to attach legacy ApprovalStatus (this pattern should no longer work)
    from app.models.governance import ApprovalStatus
    manifest._approval_status = ApprovalStatus.APPROVED
    
    # Execute should still fail - no ImplementationApproval in store
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    assert "approval enforcement failed" in response.json()["detail"].lower()


def test_placement_rejected_candidate_hash_mismatch(sample_candidate, sample_manifest):
    """Test placement rejected when candidate hash doesn't match approval."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval with WRONG candidate hash
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256="wrong-hash-0000000000000000000000000000000000000000000000000000000000000000",
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256=manifest_hash,
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with hash mismatch
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "candidate" in detail or "hash" in detail


def test_placement_rejected_manifest_id_mismatch(sample_candidate, sample_manifest):
    """Test placement rejected when manifest ID doesn't match approval."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval with WRONG manifest ID
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id="wrong-manifest-id",
        placement_manifest_sha256=manifest_hash,
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with manifest ID mismatch
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "manifest" in detail


def test_placement_rejected_manifest_hash_mismatch(sample_candidate, sample_manifest):
    """Test placement rejected when manifest hash doesn't match approval."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval with WRONG manifest hash
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256="wrong-hash-0000000000000000000000000000000000000000000000000000000000000000",
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with hash mismatch
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "hash" in detail


def test_placement_rejected_self_approval(sample_candidate, sample_manifest):
    """Test placement rejected when self-approval detected."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval where approved_by == workflow_requester (self-approval)
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256=manifest_hash,
        approved_by="requester@example.com",  # Same as workflow_requester!
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with self-approval error
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "self" in detail or "approval" in detail


def test_placement_success_all_bindings_valid(sample_candidate, sample_manifest, monkeypatch):
    """Test placement succeeds when ALL bindings are valid."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create VALID approval with ALL correct bindings
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256=manifest_hash,
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Mock PlacementExecutor to avoid actual file system operations
    class MockExecutor:
        def __init__(self, *args, **kwargs):
            pass
        
        def execute_placement(self, *args, **kwargs):
            return {
                "status": "executed",
                "action": "ADD",
                "targetPath": "packages/tutorial-blocks/TutorialT1Block",
                "filesWritten": 1,
                "branch": "candidate/test-security-001",
                "commit": "mock-commit-hash",
                "message": "Mock placement successful"
            }
        
        def trigger_discovery_refresh(self):
            return {"status": "success", "message": "Mock discovery refresh"}
    
    # Patch PlacementExecutor
    import app.api.routes.candidate
    original_executor = None
    try:
        # Import and patch the executor
        from app.placement import executor
        original_executor = executor.PlacementExecutor
        executor.PlacementExecutor = MockExecutor
        
        # Execute should succeed (approval enforcement passes, mock executor succeeds)
        response = client.post(f"/candidates/{package.candidateId}/execute")
        
        # Should NOT be 403 Forbidden (approval enforcement passed)
        assert response.status_code != 403
        # Should succeed with mock executor
        assert response.status_code == 200
        assert response.json()["status"] == "executed"
    finally:
        # Restore original executor
        if original_executor:
            executor.PlacementExecutor = original_executor
