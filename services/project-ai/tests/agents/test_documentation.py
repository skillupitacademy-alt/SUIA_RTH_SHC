"""Tests for documentation agent handler."""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import Mock, patch

from app.agents.documentation import execute_documentation
from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


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
        "evidence": [
            {
                "evidenceId": "evidence-doc-001",
                "scannerName": "d1-structure-scanner",
                "timestamp": "2025-01-30T12:00:00Z",
                "path": "README.md",
                "kind": "file",
                "claim": "Documentation file",
                "locator": "file:README.md",
                "contentHash": "hash123",
                "lifecycle": "current"
            }
        ]
    }


@pytest.mark.asyncio
async def test_execute_documentation_builds_summary():
    """Test documentation agent builds certification summary."""
    snapshot = create_test_snapshot()
    
    # Mock prior agent results
    prior_results = {
        "toolchain": AgentResult(
            agent_id="toolchain",
            status=AgentStatus.SUCCESS,
            outputs={},
            evidence_ids=[],
            errors=[],
            warnings=[],
            execution_time_ms=100,
            timestamp=datetime.now(UTC)
        ),
        "dependency": AgentResult(
            agent_id="dependency",
            status=AgentStatus.SUCCESS,
            outputs={},
            evidence_ids=[],
            errors=[],
            warnings=[],
            execution_time_ms=150,
            timestamp=datetime.now(UTC)
        )
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_results,
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_documentation(context)
    
    assert result.agent_id == "documentation"
    assert result.status == AgentStatus.SUCCESS
    assert 'summary' in result.outputs
    assert result.outputs['summary']['agents_executed'] == 2
    assert result.outputs['summary']['agents_passed'] == 2
    assert result.outputs['summary']['agents_failed'] == 0


@pytest.mark.asyncio
async def test_execute_documentation_handles_failures():
    """Test documentation agent handles failed agents."""
    snapshot = create_test_snapshot()
    
    prior_results = {
        "toolchain": AgentResult(
            agent_id="toolchain",
            status=AgentStatus.SUCCESS,
            outputs={},
            evidence_ids=[],
            errors=[],
            warnings=[],
            execution_time_ms=100,
            timestamp=datetime.now(UTC)
        ),
        "governance": AgentResult(
            agent_id="governance",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=["Self-approval detected"],
            warnings=[],
            execution_time_ms=50,
            timestamp=datetime.now(UTC)
        )
    }
    
    context = AgentContext(
        task_id="test-task",
        workflow_state={},
        repository_snapshot=snapshot,
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_results,
        repository_root=Path("/test"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_documentation(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs['summary']['agents_failed'] == 1


@pytest.mark.asyncio
async def test_execute_documentation_collects_evidence():
    """Test documentation agent collects evidence."""
    snapshot = create_test_snapshot()
    
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
    
    result = await execute_documentation(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert len(result.evidence_ids) > 0
