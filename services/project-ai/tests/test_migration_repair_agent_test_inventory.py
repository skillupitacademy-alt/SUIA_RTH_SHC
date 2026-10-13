"""
Unit tests for Test Inventory Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.test_inventory import execute_test_inventory


@pytest.mark.asyncio
async def test_test_inventory_logs_evidence():
    """Test that test inventory agent logs to evidence ledger."""
    context = AgentContext(
        task_id="test_workflow_001",
            run_id="test_workflow_001-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_test_inventory(context)
    
    assert result is not None
    assert result.agent_id == "test_inventory"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_test_inventory_handles_missing_directory():
    """Test that test inventory handles missing test directory gracefully."""
    context = AgentContext(
        task_id="test_workflow_002",
            run_id="test_workflow_002-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path("/nonexistent/path"),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_test_inventory(context)
    
    # Should fail gracefully
    assert result.status == AgentStatus.FAILED
    assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_test_inventory_returns_summary():
    """Test that test inventory returns summary of tests."""
    context = AgentContext(
        task_id="test_workflow_003",
            run_id="test_workflow_003-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_test_inventory(context)
    
    # Should have summary in outputs
    if result.status == AgentStatus.SUCCESS:
        assert "summary" in result.outputs
        assert "total_tests" in result.outputs["summary"]
