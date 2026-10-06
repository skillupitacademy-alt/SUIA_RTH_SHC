"""Tests for dependency agent handler."""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.agents.dependency import execute_dependency
from app.orchestration.agent_coordinator import AgentContext, AgentStatus


def create_test_snapshot_with_dependencies():
    """Create test snapshot with dependency data."""
    return {
        "schemaVersion": "1.1.0",
        "repository": {
            "owner": "test",
            "name": "test-repo",
            "commitSha": "abc123",
            "scanTimestamp": "2025-01-30T12:00:00Z"
        },
        "dependencies": {
            "nodes": [
                {"id": "pkg-a", "package": "package-a", "version": "1.0.0"},
                {"id": "pkg-b", "package": "package-b", "version": "2.0.0"},
                {"id": "pkg-c", "package": "package-c", "version": "1.0.0"}
            ],
            "edges": [
                {"from": "pkg-a", "to": "pkg-b"},
                {"from": "pkg-b", "to": "pkg-c"}
            ]
        },
        "evidence": [
            {
                "evidenceId": "evidence-dep-001",
                "scannerName": "d5-dependencies-scanner",
                "timestamp": "2025-01-30T12:00:00Z",
                "path": "package.json",
                "kind": "dependency-declaration",
                "claim": "Dependency declared",
                "locator": "file:package.json",
                "contentHash": "hash123",
                "lifecycle": "current"
            }
        ]
    }


@pytest.mark.asyncio
async def test_execute_dependency_success():
    """Test dependency agent executes successfully."""
    snapshot = create_test_snapshot_with_dependencies()
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
    
    result = await execute_dependency(context)
    
    assert result.agent_id == "dependency"
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['node_count'] == 3
    assert result.outputs['edge_count'] == 2


@pytest.mark.asyncio
async def test_execute_dependency_detects_cycles():
    """Test dependency agent detects circular dependencies."""
    snapshot = create_test_snapshot_with_dependencies()
    # Add circular dependency
    snapshot['dependencies']['edges'].append({"from": "pkg-c", "to": "pkg-a"})
    
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
    
    result = await execute_dependency(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['cycles_detected'] > 0
    assert len(result.warnings) > 0


@pytest.mark.asyncio
async def test_execute_dependency_detects_version_conflicts():
    """Test dependency agent detects version conflicts."""
    snapshot = create_test_snapshot_with_dependencies()
    # Add version conflict
    snapshot['dependencies']['nodes'].append(
        {"id": "pkg-a-v2", "package": "package-a", "version": "2.0.0"}
    )
    
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
    
    result = await execute_dependency(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['version_conflicts'] > 0
    assert len(result.warnings) > 0
