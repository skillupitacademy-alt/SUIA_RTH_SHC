"""Tests for classification agent."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.classification import execute_classification
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily


def create_test_snapshot():
    """Create test snapshot with verified blocks."""
    return {
        "schemaVersion": "1.1.0",
        "blocks": {
            "verified": [
                {
                    "blockId": "quiz-block-001",
                    "blockType": "quiz",
                    "implementationPath": "packages/blocks/quiz",
                    "ubrcDetails": {"ubrcStatus": "UBRC_VALID"},
                    "evidenceId": "evidence-quiz-001"
                },
                {
                    "blockId": "intro-block-001",
                    "blockType": "introduction",
                    "implementationPath": "packages/blocks/introduction",
                    "ubrcDetails": {"ubrcStatus": "UBRC_VALID"},
                    "evidenceId": "evidence-intro-001"
                }
            ]
        }
    }


def create_intake_result(candidate_id: str, family: str = "ASSESSMENT"):
    """Create mock intake result."""
    return AgentResult(
        agent_id="intake",
        status=AgentStatus.SUCCESS,
        outputs={
            "candidate_id": candidate_id,
            "detected_family": family,
            "confidence": 0.85
        },
        evidence_ids=["evidence-intake-001"],
        errors=[],
        warnings=[]
    )


@pytest.mark.asyncio
async def test_classification_success():
    """Test successful classification of quiz block."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-quiz-001",
                "blockType": "quiz",
                "files": [
                    {
                        "filename": "Quiz.tsx",
                        "content": "const Quiz = () => { return <div data-block-type='quiz'>question</div>; }",
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
            "intake": create_intake_result("candidate-quiz-001")
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_classification(context)
    
    assert result.agent_id == "classification"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["block_family"] == BlockFamily.ASSESSMENT.value
    assert result.outputs["confidence"] >= 0.6
    assert "reasoning" in result.outputs
    assert "similar_canonical_blocks" in result.outputs


@pytest.mark.asyncio
async def test_high_confidence_match():
    """Test classification with high confidence match."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-quiz-002",
                "blockType": "quiz-advanced",
                "files": [
                    {
                        "filename": "QuizAdvanced.tsx",
                        "content": "quiz question answer assessment",
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
            "intake": create_intake_result("candidate-quiz-002")
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_classification(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["confidence"] >= 0.8


@pytest.mark.asyncio
async def test_low_confidence_fail():
    """Test classification fails when confidence is too low."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-unknown-001",
                "blockType": "unknown",
                "files": [
                    {
                        "filename": "Unknown.tsx",
                        "content": "empty block",
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
            "intake": create_intake_result("candidate-unknown-001", "CUSTOM")
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_classification(context)
    
    # Low confidence should result in FAILED status
    assert result.status == AgentStatus.FAILED or result.outputs["confidence"] < 0.6
    assert result.outputs["block_family"] == BlockFamily.CUSTOM.value


@pytest.mark.asyncio
async def test_multiple_family_candidates():
    """Test classification with multiple potential family matches."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-media-001",
                "blockType": "media-tutorial",
                "files": [
                    {
                        "filename": "MediaTutorial.tsx",
                        "content": "<video src='test.mp4' /> step navigation tutorial",
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
            "intake": create_intake_result("candidate-media-001", "MEDIA")
        },
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_classification(context)
    
    assert result.status == AgentStatus.SUCCESS
    # Should classify as MEDIA (has media embed) or TUTORIAL (has navigation)
    assert result.outputs["block_family"] in [
        BlockFamily.MEDIA.value,
        BlockFamily.TUTORIAL.value
    ]


@pytest.mark.asyncio
async def test_classification_blocked_without_intake():
    """Test classification is blocked without intake result."""
    snapshot = create_test_snapshot()
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {"candidateId": "test-001", "blockType": "quiz", "files": []}
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},  # No intake result
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_classification(context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "Intake agent" in result.errors[0]
