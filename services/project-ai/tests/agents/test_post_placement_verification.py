"""Tests for post-placement verification agent."""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import patch, AsyncMock

from app.agents.post_placement_verification import execute_post_placement_verification
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


def create_executor_result():
    """Create mock placement executor result."""
    return AgentResult(
        agent_id="placement_executor",
        status=AgentStatus.SUCCESS,
        outputs={
            "files_created": 1,
            "files_updated": 0,
            "files_skipped": 0,
            "execution_result": {
                "status": "executed",
                "action": "ADD",
                "targetPath": "packages/blocks/quiz",
                "filesWritten": 1,
                "branch": "candidate/candidate-001",
                "commit": "commit123"
            },
            "target_path": "packages/blocks/quiz"
        },
        evidence_ids=["evidence-001"],
        errors=[],
        warnings=[]
    )


def create_manifest_result():
    """Create mock placement manifest result."""
    return AgentResult(
        agent_id="placement_manifest",
        status=AgentStatus.SUCCESS,
        outputs={
            "manifest": {
                "manifestId": "manifest-001",
                "candidateId": "candidate-001",
                "decision": "ADD",
                "targetPath": "packages/blocks/quiz",
                "blockFamily": "ASSESSMENT",
                "blockVersion": "1.0.0",
                "requiredChanges": ["Add new block"],
                "evidenceIds": ["evidence-001"],
                "manifestHash": "hash123",
                "createdAt": "2025-01-30T12:00:00Z"
            }
        },
        evidence_ids=["evidence-001"],
        errors=[],
        warnings=[]
    )


@pytest.mark.asyncio
async def test_verification_success():
    """Test successful post-placement verification."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_executor": create_executor_result(),
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock git diff to return changed files
    with patch("app.agents.post_placement_verification._get_git_diff_files", new_callable=AsyncMock) as mock_diff:
        mock_diff.return_value = ["packages/blocks/quiz/Quiz.tsx"]
        
        with patch("app.agents.post_placement_verification._compute_placed_file_hashes", new_callable=AsyncMock) as mock_hash:
            mock_hash.return_value = {"packages/blocks/quiz/Quiz.tsx": "filehash123"}
            
            result = await execute_post_placement_verification(context)
            
            assert result.agent_id == "post_placement_verification"
            assert result.status == AgentStatus.SUCCESS
            assert result.outputs["verification_status"] == "VERIFIED"
            assert result.outputs["diff_matches_manifest"] is True
            assert len(result.outputs["changed_files"]) > 0


@pytest.mark.asyncio
async def test_git_diff_parsing():
    """Test git diff output parsing."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_executor": create_executor_result(),
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock git diff with multiple files
    with patch("app.agents.post_placement_verification._get_git_diff_files", new_callable=AsyncMock) as mock_diff:
        mock_diff.return_value = [
            "packages/blocks/quiz/Quiz.tsx",
            "packages/blocks/quiz/Quiz.module.css"
        ]
        
        with patch("app.agents.post_placement_verification._compute_placed_file_hashes", new_callable=AsyncMock) as mock_hash:
            mock_hash.return_value = {
                "packages/blocks/quiz/Quiz.tsx": "hash1",
                "packages/blocks/quiz/Quiz.module.css": "hash2"
            }
            
            result = await execute_post_placement_verification(context)
            
            assert result.status == AgentStatus.SUCCESS
            assert len(result.outputs["changed_files"]) == 2
            assert len(result.outputs["placed_file_hashes"]) == 2


@pytest.mark.asyncio
async def test_manifest_match_validation():
    """Test validation that changes match manifest."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_executor": create_executor_result(),
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock git diff with files matching manifest target path
    with patch("app.agents.post_placement_verification._get_git_diff_files", new_callable=AsyncMock) as mock_diff:
        mock_diff.return_value = ["packages/blocks/quiz/Quiz.tsx"]
        
        with patch("app.agents.post_placement_verification._compute_placed_file_hashes", new_callable=AsyncMock) as mock_hash:
            mock_hash.return_value = {"packages/blocks/quiz/Quiz.tsx": "hash123"}
            
            result = await execute_post_placement_verification(context)
            
            assert result.outputs["diff_matches_manifest"] is True
            assert result.outputs["verification_status"] == "VERIFIED"


@pytest.mark.asyncio
async def test_file_hash_computation():
    """Test file hash computation for placed files."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_executor": create_executor_result(),
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    with patch("app.agents.post_placement_verification._get_git_diff_files", new_callable=AsyncMock) as mock_diff:
        mock_diff.return_value = ["packages/blocks/quiz/Quiz.tsx"]
        
        with patch("app.agents.post_placement_verification._compute_placed_file_hashes", new_callable=AsyncMock) as mock_hash:
            # SHA-256 hash should be 64 hex characters
            mock_hash.return_value = {
                "packages/blocks/quiz/Quiz.tsx": "a" * 64
            }
            
            result = await execute_post_placement_verification(context)
            
            assert result.status == AgentStatus.SUCCESS
            file_hash = result.outputs["placed_file_hashes"]["packages/blocks/quiz/Quiz.tsx"]
            assert len(file_hash) == 64


@pytest.mark.asyncio
async def test_verification_fails_with_no_changes():
    """Test verification fails when no changes detected."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_executor": create_executor_result(),
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock git diff with no changes
    with patch("app.agents.post_placement_verification._get_git_diff_files", new_callable=AsyncMock) as mock_diff:
        mock_diff.return_value = []
        
        with patch("app.agents.post_placement_verification._compute_placed_file_hashes", new_callable=AsyncMock) as mock_hash:
            mock_hash.return_value = {}
            
            result = await execute_post_placement_verification(context)
            
            assert result.status == AgentStatus.FAILED
            assert result.outputs["verification_status"] == "NO_CHANGES_DETECTED"
            assert "No git changes" in result.errors[0]


@pytest.mark.asyncio
async def test_verification_fails_with_path_mismatch():
    """Test verification fails when changed files don't match manifest path."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "candidate-001"}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_executor": create_executor_result(),
            "placement_manifest": create_manifest_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock git diff with files in wrong location
    with patch("app.agents.post_placement_verification._get_git_diff_files", new_callable=AsyncMock) as mock_diff:
        mock_diff.return_value = ["packages/blocks/WRONG_PATH/File.tsx"]
        
        with patch("app.agents.post_placement_verification._compute_placed_file_hashes", new_callable=AsyncMock) as mock_hash:
            mock_hash.return_value = {"packages/blocks/WRONG_PATH/File.tsx": "hash"}
            
            result = await execute_post_placement_verification(context)
            
            assert result.status == AgentStatus.FAILED
            assert result.outputs["verification_status"] == "MISMATCH"
            assert result.outputs["diff_matches_manifest"] is False
