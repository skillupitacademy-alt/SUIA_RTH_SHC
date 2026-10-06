"""Tests for Block Specification Agent (Agent 04)."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch
from datetime import datetime, UTC

from app.agents.block_specification import execute_block_specification
from app.orchestration.agent_coordinator import AgentContext
from app.models.agent_result import AgentStatus
from app.models.candidate import BlockFamily


@pytest.fixture
def mock_candidate_package():
    """Create mock candidate package."""
    return {
        "candidateId": "candidate-001",
        "files": [
            {
                "filename": "QuizBlock.tsx",
                "content": """
import React from 'react';

export function QuizBlock() {
    const [answer, setAnswer] = React.useState('');
    
    return (
        <div data-block-type="quiz" className="quiz-container">
            <div className="question">What is 2 + 2?</div>
            <input value={answer} onChange={e => setAnswer(e.target.value)} />
        </div>
    );
}
                """,
                "contentType": "text/typescript",
                "hash": "a" * 64
            },
            {
                "filename": "QuizBlock.module.css",
                "content": """
.quiz-container {
    padding: 20px;
}

.question {
    font-weight: bold;
}
                """,
                "contentType": "text/css",
                "hash": "b" * 64
            }
        ],
        "uploadedAt": "2024-01-01T00:00:00Z",
        "uploadedBy": "test-user"
    }


@pytest.fixture
def mock_snapshot():
    """Create mock snapshot with canonical blocks."""
    return {
        "canonicalHash": "test123",
        "blocks": {
            "verified": [
                {
                    "blockId": "quiz-001",
                    "blockType": "AssessmentQuiz",
                    "implementationPath": "packages/blocks/assessment/quiz.tsx",
                    "rendered": True,
                    "evidenceId": "evidence-quiz-001",
                    "ubrcDetails": {
                        "ubrcStatus": "UBRC_VALID"
                    }
                },
                {
                    "blockId": "intro-001",
                    "blockType": "IntroductionI1",
                    "implementationPath": "packages/blocks/intro/I1.tsx",
                    "rendered": True,
                    "evidenceId": "evidence-intro-001"
                }
            ]
        },
        "evidence": []
    }


@pytest.fixture
def mock_context(mock_candidate_package, mock_snapshot):
    """Create mock agent context."""
    return AgentContext(
        task_id="test-task",
        workflow_state={"candidate_package": mock_candidate_package},
        repository_snapshot=mock_snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )


@pytest.mark.asyncio
async def test_specification_generation_success(mock_context):
    """Test successful specification generation."""
    result = await execute_block_specification(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["block_family"] == BlockFamily.ASSESSMENT.value
    assert "specification" in result.outputs
    assert result.outputs["specification"]["candidateId"] == "candidate-001"
    assert result.outputs["detected_type"] == "QuizBlock"
    assert len(result.errors) == 0


@pytest.mark.asyncio
async def test_canonical_comparison(mock_context):
    """Test comparison to canonical blocks."""
    result = await execute_block_specification(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    specification = result.outputs["specification"]
    
    # Should match AssessmentQuiz canonical block
    assert specification["bestCanonicalMatch"] is not None
    assert specification["similarityScore"] > 0
    assert isinstance(specification["differences"], list)
    
    # Should have evidence IDs from canonical comparison
    assert len(result.evidence_ids) > 0


@pytest.mark.asyncio
async def test_structural_requirements_extraction(mock_context):
    """Test extraction of structural requirements."""
    result = await execute_block_specification(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    specification = result.outputs["specification"]
    requirements = specification["structuralRequirements"]
    
    # Should have requirements (likely UBRC compliance)
    assert isinstance(requirements, list)
    
    # Check for expected requirement categories
    categories = [req.get("category") for req in requirements]
    assert any(cat in ["UBRC", "Structure", "Toolchain"] for cat in categories)


@pytest.mark.asyncio
async def test_block_family_determination(mock_context):
    """Test block family determination."""
    result = await execute_block_specification(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    
    # QuizBlock should be classified as Assessment
    assert result.outputs["block_family"] == BlockFamily.ASSESSMENT.value
    
    # Check feature summary
    specification = result.outputs["specification"]
    features = specification["featureSummary"]
    
    assert features["hasTypeScript"] is True
    assert features["hasStyles"] is True
    assert features["hasQuizLogic"] is True
    assert features["fileCount"] == 2


@pytest.mark.asyncio
async def test_no_canonical_match():
    """Test handling when no canonical match is found."""
    # Empty snapshot
    empty_snapshot = {
        "canonicalHash": "test123",
        "blocks": {
            "verified": []
        },
        "evidence": []
    }
    
    candidate_package = {
        "candidateId": "candidate-002",
        "files": [
            {
                "filename": "CustomBlock.tsx",
                "content": "export function CustomBlock() { return <div>Custom</div>; }",
                "contentType": "text/typescript",
                "hash": "c" * 64
            }
        ],
        "uploadedAt": "2024-01-01T00:00:00Z",
        "uploadedBy": "test-user"
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate_package": candidate_package},
        repository_snapshot=empty_snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_block_specification(context)
    
    # Should still succeed, but with no canonical match
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["best_canonical_match"] is None
    assert result.outputs["similarity_score"] == 0.0


@pytest.mark.asyncio
async def test_no_candidate_package_blocked():
    """Test that agent is blocked when no candidate package is provided."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={},  # No candidate_package
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_block_specification(context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "No candidate_package" in result.errors[0]


@pytest.mark.asyncio
async def test_no_snapshot_blocked(mock_candidate_package):
    """Test that agent is blocked when no snapshot is available."""
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate_package": mock_candidate_package},
        repository_snapshot=None,  # No snapshot
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_block_specification(context)
    
    assert result.status == AgentStatus.BLOCKED
    assert "No snapshot available" in result.errors[0]


@pytest.mark.asyncio
async def test_tutorial_block_classification():
    """Test classification of tutorial block with step navigation."""
    tutorial_package = {
        "candidateId": "candidate-003",
        "files": [
            {
                "filename": "TutorialBlock.tsx",
                "content": """
export function TutorialBlock() {
    return (
        <div>
            <button className="step-navigation">Next Step</button>
            <button className="previous">Previous Step</button>
        </div>
    );
}
                """,
                "contentType": "text/typescript",
                "hash": "d" * 64
            }
        ],
        "uploadedAt": "2024-01-01T00:00:00Z",
        "uploadedBy": "test-user"
    }
    
    snapshot = {
        "canonicalHash": "test123",
        "blocks": {"verified": []},
        "evidence": []
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate_package": tutorial_package},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_block_specification(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["block_family"] == BlockFamily.TUTORIAL.value
    
    # Check that step navigation was detected
    specification = result.outputs["specification"]
    assert specification["featureSummary"]["hasStepNavigation"] is True


@pytest.mark.asyncio
async def test_media_block_classification():
    """Test classification of media block."""
    media_package = {
        "candidateId": "candidate-004",
        "files": [
            {
                "filename": "MediaBlock.tsx",
                "content": """
export function MediaBlock() {
    return (
        <div>
            <video src="video.mp4" />
            <iframe src="https://example.com/embed" />
        </div>
    );
}
                """,
                "contentType": "text/typescript",
                "hash": "e" * 64
            }
        ],
        "uploadedAt": "2024-01-01T00:00:00Z",
        "uploadedBy": "test-user"
    }
    
    snapshot = {
        "canonicalHash": "test123",
        "blocks": {"verified": []},
        "evidence": []
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={"candidate_package": media_package},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/mock/repo"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_block_specification(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs["block_family"] == BlockFamily.MEDIA.value
    
    # Check that media embed was detected
    specification = result.outputs["specification"]
    assert specification["featureSummary"]["hasMediaEmbed"] is True


@pytest.mark.asyncio
async def test_ubrc_requirement_generation(mock_context):
    """Test that UBRC requirements are generated when attributes are missing."""
    result = await execute_block_specification(mock_context)
    
    assert result.status == AgentStatus.SUCCESS
    specification = result.outputs["specification"]
    requirements = specification["structuralRequirements"]
    
    # Should have UBRC requirements since data-block-version is missing
    ubrc_reqs = [r for r in requirements if r.get("category") == "UBRC"]
    assert len(ubrc_reqs) > 0
