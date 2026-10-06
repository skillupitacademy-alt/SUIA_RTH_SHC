"""Tests for toolchain agent handler."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.toolchain import execute_toolchain
from app.orchestration.agent_coordinator import AgentContext, AgentStatus


def create_test_snapshot_with_toolchains():
    """Create test snapshot with toolchain data."""
    return {
        "schemaVersion": "1.1.0",
        "repository": {
            "owner": "test",
            "name": "test-repo",
            "commitSha": "abc123",
            "scanTimestamp": "2025-01-30T12:00:00Z"
        },
        "runtime": {
            "toolchains": [
                {
                    "tool": "node",
                    "version": "20.11.0",
                    "detectedFrom": "package.json"
                },
                {
                    "tool": "pnpm",
                    "version": "8.15.1",
                    "detectedFrom": "package.json"
                }
            ]
        },
        "evidence": [
            {
                "evidenceId": "evidence-toolchain-001",
                "scannerName": "d2-runtime-scanner",
                "timestamp": "2025-01-30T12:00:00Z",
                "path": "package.json",
                "kind": "toolchain-detection",
                "claim": "Node version detected",
                "locator": "file:package.json",
                "contentHash": "hash123",
                "lifecycle": "current"
            }
        ]
    }


@pytest.mark.asyncio
async def test_execute_toolchain_success():
    """Test toolchain agent executes successfully with valid snapshot."""
    snapshot = create_test_snapshot_with_toolchains()
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_toolchain(context)
    
    assert result.agent_id == "toolchain"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['toolchain_count'] == 2
    assert len(result.outputs['toolchains']) == 2
    assert 'node' in result.outputs['toolchain_map']
    assert result.outputs['toolchain_map']['node'] == "20.11.0"


@pytest.mark.asyncio
async def test_execute_toolchain_empty():
    """Test toolchain agent with empty toolchain data."""
    snapshot = create_test_snapshot_with_toolchains()
    snapshot['runtime']['toolchains'] = []
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_toolchain(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['toolchain_count'] == 0


@pytest.mark.asyncio
async def test_execute_toolchain_collects_evidence():
    """Test toolchain agent collects evidence from snapshot."""
    snapshot = create_test_snapshot_with_toolchains()
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_toolchain(context)
    
    assert len(result.evidence_ids) > 0
    assert "evidence-toolchain-001" in result.evidence_ids
