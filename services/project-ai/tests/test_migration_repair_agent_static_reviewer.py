"""
Unit tests for Static Reviewer Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.static_reviewer import execute_static_reviewer


@pytest.mark.asyncio
async def test_static_reviewer_logs_evidence():
    """Test that static reviewer agent logs to evidence ledger."""
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
    
    result = await execute_static_reviewer(context)
    
    assert result is not None
    assert result.agent_id == "static_reviewer"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_static_reviewer_handles_missing_directory():
    """Test that static reviewer handles missing migration directory gracefully."""
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
    
    result = await execute_static_reviewer(context)
    
    assert result.status == AgentStatus.FAILED


@pytest.mark.asyncio
async def test_static_reviewer_returns_syntax_results():
    """Test that static reviewer returns syntax check results."""
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
    
    result = await execute_static_reviewer(context)
    
    # Should have syntax check results
    if result.status != AgentStatus.FAILED:
        assert "syntax_issues" in result.outputs
        assert "journal_consistent" in result.outputs
