"""Tests for intake agent handler."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.intake import execute_intake
from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.models.candidate import BlockFamily


def create_test_snapshot_with_blocks():
    """Create test snapshot with block data."""
    return {
        "schemaVersion": "1.1.0",
        "repository": {
            "owner": "test",
            "name": "test-repo",
            "commitSha": "abc123",
            "scanTimestamp": "2025-01-30T12:00:00Z"
        },
        "blocks": {
            "implementations": [
                {
                    "type": "introduction",
                    "implementationPath": "packages/blocks/src/introduction/Introduction.tsx"
                },
                {
                    "type": "quiz",
                    "implementationPath": "packages/blocks/src/quiz/Quiz.tsx"
                }
            ]
        },
        "evidence": [
            {
                "evidenceId": "evidence-block-001",
                "scannerName": "d3-blocks-scanner",
                "timestamp": "2025-01-30T12:00:00Z",
                "path": "packages/blocks/src/introduction/Introduction.tsx",
                "kind": "type-definition",
                "claim": "Block type defined",
                "locator": "file:packages/blocks/src/introduction/Introduction.tsx",
                "contentHash": "hash123",
                "lifecycle": "current"
            }
        ]
    }


@pytest.mark.asyncio
async def test_execute_intake_introduction():
    """Test intake agent classifies introduction block."""
    snapshot = create_test_snapshot_with_blocks()
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-intro-001",
                "blockType": "introduction",
                "files": []
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_intake(context)
    
    assert result.agent_id == "intake"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['detected_family'] == BlockFamily.INTRODUCTION.value
    assert result.outputs['confidence'] > 0.8


@pytest.mark.asyncio
async def test_execute_intake_assessment():
    """Test intake agent classifies assessment block."""
    snapshot = create_test_snapshot_with_blocks()
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-quiz-001",
                "blockType": "quiz",
                "files": []
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_intake(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['detected_family'] == BlockFamily.ASSESSMENT.value


@pytest.mark.asyncio
async def test_execute_intake_finds_similar_blocks():
    """Test intake agent finds similar blocks."""
    snapshot = create_test_snapshot_with_blocks()
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-intro-002",
                "blockType": "introduction",
                "files": []
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_intake(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert 'similar_blocks' in result.outputs


@pytest.mark.asyncio
async def test_execute_intake_extended_validation():
    """Test intake agent with extended validation and file hashing."""
    snapshot = create_test_snapshot_with_blocks()
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-quiz-002",
                "blockType": "quiz",
                "uploadedAt": "2025-01-30T12:00:00Z",
                "uploadedBy": "test_user",
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
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_intake(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['candidate_validation_status'] == 'VALID'
    assert 'file_hashes' in result.outputs
    assert 'metadata' in result.outputs
    assert result.outputs['metadata']['file_count'] == 1


@pytest.mark.asyncio
async def test_execute_intake_validation_failure():
    """Test intake agent fails with invalid candidate package."""
    snapshot = create_test_snapshot_with_blocks()
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                # Missing candidateId
                "blockType": "quiz",
                "files": [
                    {
                        # Missing filename and content
                        "contentType": "text/typescript"
                    }
                ]
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_intake(context)
    
    assert result.status == AgentStatus.FAILED
    assert result.outputs.get('candidate_validation_status') == 'INVALID'
    assert len(result.errors) > 0
