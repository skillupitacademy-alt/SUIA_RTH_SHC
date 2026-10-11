"""
Unit tests for Repair Planner Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.repair_planner import execute_repair_planner


@pytest.mark.asyncio
async def test_repair_planner_logs_evidence():
    """Test that repair planner agent logs to evidence ledger."""
    # Create mock prior agent outputs
    prior_outputs = {
        "migration_audit": AgentResult(
            agent_id="migration_audit",
            status=AgentStatus.SUCCESS,
            outputs={"findings": []},
        ),
        "database_safety_audit": AgentResult(
            agent_id="database_safety_audit",
            status=AgentStatus.SUCCESS,
            outputs={"is_production": False},
        ),
        "test_inventory": AgentResult(
            agent_id="test_inventory",
            status=AgentStatus.SUCCESS,
            outputs={},
        ),
        "evidence_audit": AgentResult(
            agent_id="evidence_audit",
            status=AgentStatus.SUCCESS,
            outputs={},
        ),
    }
    
    context = AgentContext(
        task_id="test_workflow_001",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_outputs,
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_repair_planner(context)
    
    assert result is not None
    assert result.agent_id == "repair_planner"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_repair_planner_blocks_on_missing_w1():
    """Test that repair planner blocks when W1 agents haven't completed."""
    context = AgentContext(
        task_id="test_workflow_002",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_repair_planner(context)
    
    # Should be blocked
    assert result.status == AgentStatus.BLOCKED
    assert len(result.errors) > 0


@pytest.mark.asyncio
async def test_repair_planner_handles_errors():
    """Test that repair planner handles errors without crashing."""
    # Create malformed prior outputs
    prior_outputs = {
        "migration_audit": AgentResult(
            agent_id="migration_audit",
            status=AgentStatus.SUCCESS,
            outputs=None,  # Invalid
        ),
    }
    
    context = AgentContext(
        task_id="test_workflow_003",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_outputs,
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_repair_planner(context)
    
    # Should handle gracefully
    assert result.agent_id == "repair_planner"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED, AgentStatus.BLOCKED]
