"""Tests for placement executor agent."""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import patch, MagicMock

from app.agents.placement_executor import execute_placement_executor
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


def create_approval_result(manifest_hash: str = "test_hash_123"):
    """Create mock approval result."""
    return AgentResult(
        agent_id="approval",
        status=AgentStatus.SUCCESS,
        outputs={
            "approval_status": "APPROVED",
            "approved_manifest_hash": manifest_hash,
            "reviewer": "test_reviewer"
        },
        evidence_ids=["evidence-001"],
        errors=[],
        warnings=[]
    )


def create_manifest_result(manifest_hash: str = "test_hash_123"):
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
                "blockFamily": "Assessment",
                "blockVersion": "1.0.0",
                "requiredChanges": ["Add new block"],
                "evidenceIds": ["evidence-001"],
                "manifestHash": manifest_hash,
                "createdAt": "2025-01-30T12:00:00Z"
            },
            "evidence_ids": ["evidence-001"]
        },
        evidence_ids=["evidence-001"],
        errors=[],
        warnings=[]
    )


@pytest.mark.asyncio
async def test_execution_success():
    """Test successful placement execution."""
    manifest_hash = "test_hash_123"
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-001",
                "files": [
                    {
                        "filename": "Quiz.tsx",
                        "content": "quiz content",
                        "contentType": "text/typescript",
                        "hash": "abc123"
                    }
                ]
            }
        },
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "approval": create_approval_result(manifest_hash),
            "placement_manifest": create_manifest_result(manifest_hash)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock PlacementExecutor
    with patch("app.agents.placement_executor.PlacementExecutor") as mock_executor_class:
        mock_executor = MagicMock()
        mock_executor.execute_placement.return_value = {
            "status": "executed",
            "action": "ADD",
            "targetPath": "packages/blocks/quiz",
            "filesWritten": 1,
            "filesUpdated": 0,
            "branch": "candidate/candidate-001",
            "commit": "commit123",
            "message": "Added quiz block"
        }
        mock_executor_class.return_value = mock_executor
        
        result = await execute_placement_executor(context)
        
        assert result.agent_id == "placement_executor"
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs["files_created"] == 1
        assert result.outputs["branch"] == "candidate/candidate-001"


@pytest.mark.asyncio
async def test_manifest_hash_verification():
    """Test manifest hash verification before execution."""
    approved_hash = "approved_hash_123"
    manifest_hash = "different_hash_456"
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {"candidateId": "candidate-001", "files": []}
        },
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "approval": create_approval_result(approved_hash),
            "placement_manifest": create_manifest_result(manifest_hash)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_executor(context)
    
    assert result.status == AgentStatus.FAILED
    assert "hash mismatch" in result.errors[0].lower()


@pytest.mark.asyncio
async def test_file_create_operation():
    """Test file creation operation."""
    manifest_hash = "test_hash_123"
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-001",
                "files": [
                    {
                        "filename": "NewBlock.tsx",
                        "content": "new content",
                        "contentType": "text/typescript",
                        "hash": "new123"
                    }
                ]
            }
        },
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "approval": create_approval_result(manifest_hash),
            "placement_manifest": create_manifest_result(manifest_hash)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    with patch("app.agents.placement_executor.PlacementExecutor") as mock_executor_class:
        mock_executor = MagicMock()
        mock_executor.execute_placement.return_value = {
            "status": "executed",
            "action": "ADD",
            "targetPath": "packages/blocks/new",
            "filesWritten": 1,
            "filesUpdated": 0,
            "branch": "candidate/candidate-001",
            "commit": "commit456"
        }
        mock_executor_class.return_value = mock_executor
        
        result = await execute_placement_executor(context)
        
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs["files_created"] > 0


@pytest.mark.asyncio
async def test_file_update_operation():
    """Test file update operation."""
    manifest_hash = "test_hash_123"
    
    # Create manifest with UPDATE decision
    manifest_result = create_manifest_result(manifest_hash)
    manifest_result.outputs["manifest"]["decision"] = "UPDATE"
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-001",
                "files": [
                    {
                        "filename": "ExistingBlock.tsx",
                        "content": "updated content",
                        "contentType": "text/typescript",
                        "hash": "update123"
                    }
                ]
            }
        },
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "approval": create_approval_result(manifest_hash),
            "placement_manifest": manifest_result
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    with patch("app.agents.placement_executor.PlacementExecutor") as mock_executor_class:
        mock_executor = MagicMock()
        mock_executor.execute_placement.return_value = {
            "status": "executed",
            "action": "UPDATE",
            "targetPath": "packages/blocks/existing",
            "filesWritten": 0,
            "filesUpdated": 1,
            "branch": "candidate/candidate-001",
            "commit": "commit789"
        }
        mock_executor_class.return_value = mock_executor
        
        result = await execute_placement_executor(context)
        
        assert result.status == AgentStatus.SUCCESS
        assert result.outputs["files_updated"] > 0


@pytest.mark.asyncio
async def test_rollback_on_failure():
    """Test rollback behavior on execution failure."""
    manifest_hash = "test_hash_123"
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {"candidateId": "candidate-001", "files": []}
        },
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "approval": create_approval_result(manifest_hash),
            "placement_manifest": create_manifest_result(manifest_hash)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    # Mock PlacementExecutor to raise error
    with patch("app.agents.placement_executor.PlacementExecutor") as mock_executor_class:
        mock_executor = MagicMock()
        from app.placement.executor import PlacementExecutionError
        mock_executor.execute_placement.side_effect = PlacementExecutionError("Execution failed")
        mock_executor_class.return_value = mock_executor
        
        result = await execute_placement_executor(context)
        
        assert result.status == AgentStatus.FAILED
        assert "Execution failed" in result.errors[0]


@pytest.mark.asyncio
async def test_executor_blocked_without_approval():
    """Test executor is blocked without approval."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate": {"candidateId": "test-001", "files": []}},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "placement_manifest": create_manifest_result()
            # No approval result
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_executor(context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "Approval agent" in result.errors[0]
