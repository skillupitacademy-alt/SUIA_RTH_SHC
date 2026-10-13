"""
Unit tests for PlacementExecutor agent (WAVE 5).

Tests verify that the executor:
1. Only executes approved manifests
2. Verifies approval hash matches manifest hash
3. Correctly handles different placement actions
4. Uses RepositoryAdapter interface (no shell commands)
"""

import pytest
from unittest.mock import Mock, call

from app.agents.placement_executor import (
    PlacementExecutor,
    ApprovalPayload,
    PlacementExecutionResult,
    RepositoryAdapter
)
from app.agents.placement_manifest import (
    PlacementManifest,
    PlacementAction,
    ArtifactPlacement
)


@pytest.fixture
def mock_repo_adapter():
    """Create mock repository adapter."""
    adapter = Mock(spec=RepositoryAdapter)
    return adapter


@pytest.fixture
def sample_approval():
    """Create sample approval payload."""
    return ApprovalPayload(
        manifest_hash="abc123hash",
        approved_by="admin@example.com",
        approved_at="2025-01-29T12:00:00Z",
        reason="Approved for testing"
    )


@pytest.fixture
def approved_manifest():
    """Create approved manifest with multiple placements."""
    return PlacementManifest(
        workflow_id="wf-001",
        manifest_hash="abc123hash",
        placements=[
            ArtifactPlacement(
                candidate_path="ObjectiveBlock.tsx",
                action=PlacementAction.ADD,
                target_path="packages/blocks/intro/ObjectiveBlock.tsx",
                reason="New block",
                requires_approval=True
            ),
            ArtifactPlacement(
                candidate_path="ExistingBlock.tsx",
                action=PlacementAction.REUSE,
                target_path="packages/blocks/existing/ExistingBlock.tsx",
                reason="Reuse existing",
                requires_approval=False,
                existing_artifact_hash="def456"
            )
        ],
        rejected=[],
        status="APPROVED"
    )


class TestPlacementExecutorApprovalValidation:
    """Test approval validation logic."""
    
    def test_executor_rejects_non_approved_manifest(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that executing a non-approved manifest raises ValueError."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        # Create manifest with PENDING_APPROVAL status
        manifest = PlacementManifest(
            workflow_id="wf-002",
            manifest_hash="abc123hash",
            placements=[],
            rejected=[],
            status="PENDING_APPROVAL"  # Not approved!
        )
        
        with pytest.raises(ValueError) as exc_info:
            executor.execute(manifest, sample_approval)
        
        error_msg = str(exc_info.value).lower()
        assert "cannot execute non-approved manifest" in error_msg
        assert "pending_approval" in error_msg
    
    def test_executor_rejects_rejected_manifest(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that executing a rejected manifest raises ValueError."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        manifest = PlacementManifest(
            workflow_id="wf-003",
            manifest_hash="abc123hash",
            placements=[],
            rejected=[],
            status="REJECTED"  # Explicitly rejected!
        )
        
        with pytest.raises(ValueError) as exc_info:
            executor.execute(manifest, sample_approval)
        
        error_msg = str(exc_info.value).lower()
        assert "cannot execute non-approved manifest" in error_msg
    
    def test_executor_rejects_mismatched_approval_hash(
        self,
        mock_repo_adapter,
        approved_manifest
    ):
        """Test that mismatched approval hash raises ValueError."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        # Create approval with different hash
        wrong_approval = ApprovalPayload(
            manifest_hash="wrong_hash_xyz",  # Mismatch!
            approved_by="admin@example.com",
            approved_at="2025-01-29T12:00:00Z"
        )
        
        with pytest.raises(ValueError) as exc_info:
            executor.execute(approved_manifest, wrong_approval)
        
        error_msg = str(exc_info.value).lower()
        assert "approval manifest_hash does not match" in error_msg
        assert "abc123hash" in error_msg  # Expected hash
        assert "wrong_hash_xyz" in error_msg  # Got hash


class TestPlacementExecutorActions:
    """Test execution of different placement actions."""
    
    def test_reuse_action_does_not_call_repo_adapter(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that REUSE action does not call repo_adapter methods (mock)."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        manifest = PlacementManifest(
            workflow_id="wf-004",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="ReuseBlock.tsx",
                    action=PlacementAction.REUSE,
                    target_path="packages/blocks/reuse/ReuseBlock.tsx",
                    reason="Reuse existing",
                    requires_approval=False
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        # Verify REUSE does not call any repo_adapter methods
        mock_repo_adapter.add_file.assert_not_called()
        mock_repo_adapter.update_file.assert_not_called()
        mock_repo_adapter.extend_file.assert_not_called()
        
        # Verify execution succeeded
        assert result.status == "SUCCESS"
        assert len(result.executed_placements) == 1
        assert result.executed_placements[0]["action"] == "REUSE"
        assert result.executed_placements[0]["status"] == "success"
    
    def test_add_action_calls_repo_adapter_add_file(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that ADD action calls repo_adapter.add_file."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        manifest = PlacementManifest(
            workflow_id="wf-005",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="NewBlock.tsx",
                    action=PlacementAction.ADD,
                    target_path="packages/blocks/new/NewBlock.tsx",
                    reason="Add new block",
                    requires_approval=True
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        # Verify ADD calls add_file with correct arguments
        mock_repo_adapter.add_file.assert_called_once_with(
            "NewBlock.tsx",
            "packages/blocks/new/NewBlock.tsx"
        )
        
        # Verify execution succeeded
        assert result.status == "SUCCESS"
        assert len(result.executed_placements) == 1
        assert result.executed_placements[0]["action"] == "ADD"
    
    def test_update_action_calls_repo_adapter_update_file(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that UPDATE action calls repo_adapter.update_file."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        manifest = PlacementManifest(
            workflow_id="wf-006",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="UpdatedBlock.tsx",
                    action=PlacementAction.UPDATE,
                    target_path="packages/blocks/existing/UpdatedBlock.tsx",
                    reason="Update existing block",
                    requires_approval=True,
                    existing_artifact_hash="old_hash"
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        # Verify UPDATE calls update_file with correct arguments
        mock_repo_adapter.update_file.assert_called_once_with(
            "UpdatedBlock.tsx",
            "packages/blocks/existing/UpdatedBlock.tsx"
        )
        
        # Verify execution succeeded
        assert result.status == "SUCCESS"
    
    def test_extend_action_calls_repo_adapter_extend_file(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that EXTEND action calls repo_adapter.extend_file."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        manifest = PlacementManifest(
            workflow_id="wf-007",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="ExtendedBlock.tsx",
                    action=PlacementAction.EXTEND,
                    target_path="packages/blocks/family/ExtendedBlock.tsx",
                    reason="Extend block family",
                    requires_approval=True,
                    existing_artifact_hash="family_hash"
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        # Verify EXTEND calls extend_file with correct arguments
        mock_repo_adapter.extend_file.assert_called_once_with(
            "ExtendedBlock.tsx",
            "packages/blocks/family/ExtendedBlock.tsx"
        )
        
        # Verify execution succeeded
        assert result.status == "SUCCESS"


class TestPlacementExecutorResultHandling:
    """Test execution result handling and error recovery."""
    
    def test_successful_execution_returns_success_status(
        self,
        mock_repo_adapter,
        approved_manifest,
        sample_approval
    ):
        """Test that successful execution returns SUCCESS status."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        result = executor.execute(approved_manifest, sample_approval)
        
        assert result.status == "SUCCESS"
        assert result.workflow_id == "wf-001"
        assert result.manifest_hash == "abc123hash"
        assert len(result.executed_placements) == 2
        assert len(result.failed_placements) == 0
        assert result.evidence_id == "ev-placement-wf-001"
    
    def test_partial_failure_returns_partial_status(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that partial failure returns PARTIAL status."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        # Make update_file fail
        mock_repo_adapter.update_file.side_effect = ValueError("Update failed")
        
        manifest = PlacementManifest(
            workflow_id="wf-008",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="GoodBlock.tsx",
                    action=PlacementAction.ADD,
                    target_path="packages/blocks/good/GoodBlock.tsx",
                    reason="Should succeed",
                    requires_approval=True
                ),
                ArtifactPlacement(
                    candidate_path="BadBlock.tsx",
                    action=PlacementAction.UPDATE,
                    target_path="packages/blocks/bad/BadBlock.tsx",
                    reason="Will fail",
                    requires_approval=True
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        assert result.status == "PARTIAL"
        assert len(result.executed_placements) == 1
        assert len(result.failed_placements) == 1
        assert result.failed_placements[0]["action"] == "UPDATE"
        assert "Update failed" in result.failed_placements[0]["error"]
    
    def test_complete_failure_returns_failed_status(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that complete failure returns FAILED status."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        # Make add_file fail
        mock_repo_adapter.add_file.side_effect = ValueError("Add failed")
        
        manifest = PlacementManifest(
            workflow_id="wf-009",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="FailBlock.tsx",
                    action=PlacementAction.ADD,
                    target_path="packages/blocks/fail/FailBlock.tsx",
                    reason="Will fail",
                    requires_approval=True
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        assert result.status == "FAILED"
        assert len(result.executed_placements) == 0
        assert len(result.failed_placements) == 1
    
    def test_reject_action_in_placements_raises_error(
        self,
        mock_repo_adapter,
        sample_approval
    ):
        """Test that REJECT action in placements list raises error."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        # REJECT should never be in placements list (only in rejected list)
        manifest = PlacementManifest(
            workflow_id="wf-010",
            manifest_hash="abc123hash",
            placements=[
                ArtifactPlacement(
                    candidate_path="RejectedBlock.tsx",
                    action=PlacementAction.REJECT,
                    target_path="",
                    reason="Should not be in placements",
                    requires_approval=False
                )
            ],
            rejected=[],
            status="APPROVED"
        )
        
        result = executor.execute(manifest, sample_approval)
        
        # Should fail with error
        assert result.status == "FAILED"
        assert len(result.failed_placements) == 1
        assert "cannot execute reject action" in result.failed_placements[0]["error"].lower()


class TestPlacementExecutorEvidenceRecording:
    """Test evidence recording for audit trail."""
    
    def test_executor_records_evidence_id(
        self,
        mock_repo_adapter,
        approved_manifest,
        sample_approval
    ):
        """Test that executor records evidence ID for audit trail."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        result = executor.execute(approved_manifest, sample_approval)
        
        # Evidence ID should follow pattern ev-placement-{workflow_id}
        assert result.evidence_id.startswith("ev-placement-")
        assert result.evidence_id == f"ev-placement-{approved_manifest.workflow_id}"
    
    def test_executor_records_all_placement_details(
        self,
        mock_repo_adapter,
        approved_manifest,
        sample_approval
    ):
        """Test that executor records all placement details."""
        executor = PlacementExecutor(mock_repo_adapter)
        
        result = executor.execute(approved_manifest, sample_approval)
        
        # Verify all placements are recorded with details
        for i, placement in enumerate(approved_manifest.placements):
            executed = result.executed_placements[i]
            assert executed["action"] == placement.action.value
            assert executed["target_path"] == placement.target_path
            assert executed["status"] == "success"
