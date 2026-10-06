"""Tests for placement agent handler."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.placement import execute_placement
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus
from app.models.candidate import BlockFamily, PlacementDecision


def create_test_snapshot():
    """Create test snapshot."""
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
                }
            ]
        },
        "evidence": [
            {
                "evidenceId": "evidence-placement-001",
                "scannerName": "d3-blocks-scanner",
                "timestamp": "2025-01-30T12:00:00Z",
                "path": "packages/blocks/src/test/Block.tsx",
                "kind": "type-definition",
                "claim": "Block type defined",
                "locator": "file:packages/blocks/src/test/Block.tsx",
                "contentHash": "hash123",
                "lifecycle": "current"
            }
        ]
    }


@pytest.mark.asyncio
async def test_execute_placement_new_block():
    """Test placement agent generates manifest for new block."""
    snapshot = create_test_snapshot()
    
    # Mock intake result
    intake_result = AgentResult(
        agent_id="intake",
        status=AgentStatus.SUCCESS,
        outputs={
            "detected_family": BlockFamily.CUSTOM.value,
            "confidence": 0.8
        },
        evidence_ids=[],
        errors=[],
        warnings=[],
        execution_time_ms=100,
        timestamp=datetime.now(UTC)
    )
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-new-001",
                "blockType": "custom-block",
                "files": []
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={"intake": intake_result},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement(context)
    
    assert result.agent_id == "placement"
    assert result.status == AgentStatus.SUCCESS
    assert 'manifest' in result.outputs
    assert result.outputs['decision'] == PlacementDecision.ADD.value
    assert len(result.outputs['manifest_hash']) == 64  # SHA-256 hash


@pytest.mark.asyncio
async def test_execute_placement_existing_block():
    """Test placement agent updates existing block."""
    snapshot = create_test_snapshot()
    
    intake_result = AgentResult(
        agent_id="intake",
        status=AgentStatus.SUCCESS,
        outputs={
            "detected_family": BlockFamily.INTRODUCTION.value,
            "confidence": 0.9
        },
        evidence_ids=[],
        errors=[],
        warnings=[],
        execution_time_ms=100,
        timestamp=datetime.now(UTC)
    )
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-intro-update",
                "blockType": "introduction",  # Already exists
                "files": []
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={"intake": intake_result},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['decision'] == PlacementDecision.UPDATE.value


@pytest.mark.asyncio
async def test_execute_placement_no_path_inference():
    """Test placement agent does not infer path from block name."""
    snapshot = create_test_snapshot()
    
    intake_result = AgentResult(
        agent_id="intake",
        status=AgentStatus.SUCCESS,
        outputs={"detected_family": BlockFamily.CUSTOM.value, "confidence": 0.7},
        evidence_ids=[],
        errors=[],
        warnings=[],
        execution_time_ms=100,
        timestamp=datetime.now(UTC)
    )
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={
            "candidate": {
                "candidateId": "candidate-test-block",
                "blockType": "test-block",
                "files": []
            }
        },
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={"intake": intake_result},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_placement(context)
    
    assert result.status == AgentStatus.SUCCESS
    # Should NOT infer path from "test-block" name
    assert result.outputs['target_path'] == "REQUIRES_HUMAN_APPROVAL"
