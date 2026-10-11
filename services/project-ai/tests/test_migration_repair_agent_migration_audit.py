"""
Unit tests for Migration Audit Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.migration_audit import execute_migration_audit


@pytest.mark.asyncio
async def test_migration_audit_logs_evidence():
    """Test that migration audit agent logs to evidence ledger."""
    context = AgentContext(
        task_id="test_workflow_001",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_migration_audit(context)
    
    # Should return AgentResult
    assert result is not None
    assert result.agent_id == "migration_audit"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED, AgentStatus.BLOCKED]
    
    # Should have evidence IDs
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_migration_audit_handles_missing_directory():
    """Test that migration audit handles missing migration directory gracefully."""
    context = AgentContext(
        task_id="test_workflow_002",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/nonexistent/path"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_migration_audit(context)
    
    # Should fail gracefully
    assert result.status == AgentStatus.FAILED
    assert len(result.errors) > 0
    assert "Migration directory not found" in result.errors[0]


@pytest.mark.asyncio
async def test_migration_audit_returns_populated_result():
    """Test that migration audit returns result with outputs."""
    context = AgentContext(
        task_id="test_workflow_003",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_migration_audit(context)
    
    # Should have outputs
    assert result.outputs is not None
    assert isinstance(result.outputs, dict)
    
    # Should have execution time
    assert result.execution_time_ms is not None
    assert result.execution_time_ms >= 0
