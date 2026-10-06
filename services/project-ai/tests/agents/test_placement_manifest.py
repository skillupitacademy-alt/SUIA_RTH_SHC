"""Tests for placement manifest agent."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.placement_manifest import execute_placement_manifest
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily


def create_test_snapshot():
    """Create test snapshot with verified blocks."""
    return {
        "schemaVersion": "1.1.0",
        "blocks": {
            "verified": [
                {
                    "blockId": "quiz-001",
                    "blockType": "quiz",
                    "implementationPath": "packages/blocks/quiz",
                    "evidenceId": "evidence-quiz-001"
                }
            ]
        }
    }


def create_classification_result(family: str = "Assessment", confidence: float = 0.85):
    """Create mock classification result."""
    return AgentResult(
        agent_id="classification",
        status=AgentStatus.SUCCESS,
        outputs={
            "block_family": family,
            "confidence": confidence,
            "reasoning": "Test classification",
            "similar_canonical_blocks": ["quiz-001"]
        },
        evidence_ids=["evidence-001"],
        errors=[],
        warnings=[]
    )


@pytest.mark.asyncio
async def test_manifest_generation_success():
    """Test successful manifest generation."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-001",
                "blockType": "quiz",
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
        prior_agent_outputs={
            "classification": create_classification_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_manifest(context)
    
    assert result.agent_id == "placement_manifest"
    assert result.status == AgentStatus.SUCCESS
    assert "manifest" in result.outputs
    assert "evidence_ids" in result.outputs
    
    manifest = result.outputs["manifest"]
    assert manifest["manifestId"]
    assert manifest["candidateId"] == "candidate-001"
    assert manifest["blockFamily"] == BlockFamily.ASSESSMENT.value
    assert manifest["manifestHash"]


@pytest.mark.asyncio
async def test_manifest_hash_computation():
    """Test manifest hash is computed correctly."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-002",
                "blockType": "quiz",
                "files": [
                    {
                        "filename": "Quiz.tsx",
                        "content": "content",
                        "contentType": "text/typescript",
                        "hash": "def456"
                    }
                ]
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "classification": create_classification_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_manifest(context)
    
    assert result.status == AgentStatus.SUCCESS
    manifest = result.outputs["manifest"]
    
    # Manifest hash should be 64-character hex string (SHA-256)
    assert len(manifest["manifestHash"]) == 64
    assert all(c in '0123456789abcdef' for c in manifest["manifestHash"])


@pytest.mark.asyncio
async def test_placement_entry_creation():
    """Test placement entries are created correctly."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-003",
                "blockType": "introduction",
                "files": [
                    {
                        "filename": "Intro.tsx",
                        "content": "intro content",
                        "contentType": "text/typescript",
                        "hash": "ghi789"
                    }
                ]
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "classification": create_classification_result("Introduction", 0.9)
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_manifest(context)
    
    assert result.status == AgentStatus.SUCCESS
    manifest = result.outputs["manifest"]
    
    assert manifest["decision"] in ["ADD", "UPDATE", "EXTEND", "REUSE", "REJECT"]
    assert manifest["targetPath"]
    assert "requiredChanges" in manifest
    assert isinstance(manifest["requiredChanges"], list)


@pytest.mark.asyncio
async def test_evidence_binding():
    """Test evidence IDs are bound to manifest."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-004",
                "blockType": "quiz",
                "files": [
                    {
                        "filename": "Quiz.tsx",
                        "content": "content",
                        "contentType": "text/typescript",
                        "hash": "jkl012"
                    }
                ]
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "classification": create_classification_result()
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_manifest(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert len(result.evidence_ids) > 0
    
    manifest = result.outputs["manifest"]
    assert "evidenceIds" in manifest
    assert isinstance(manifest["evidenceIds"], list)


@pytest.mark.asyncio
async def test_manifest_blocked_without_classification():
    """Test manifest generation is blocked without classification."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {"candidateId": "test-001", "blockType": "quiz", "files": []}
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},  # No classification
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement_manifest(context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "Classification agent" in result.errors[0]
