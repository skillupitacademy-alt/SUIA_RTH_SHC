"""
Unit tests for Repair Reviewer Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.repair_reviewer import execute_repair_reviewer


@pytest.mark.asyncio
async def test_repair_reviewer_logs_evidence():
    """Test that repair reviewer agent logs to evidence ledger."""
    prior_outputs = {
        "repair_planner": AgentResult(
            agent_id="repair_planner",
            status=AgentStatus.SUCCESS,
            outputs={"repair_plan": {"actions": []}},
        ),
    }
    
    context = AgentContext(
        task_id="test_workflow_001",
            run_id="test_workflow_001-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_outputs,
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_repair_reviewer(context)
    
    assert result is not None
    assert result.agent_id == "repair_reviewer"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_repair_reviewer_blocks_without_planner():
    """Test that repair reviewer blocks when planner hasn't completed."""
    context = AgentContext(
        task_id="test_workflow_002",
            run_id="test_workflow_002-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_repair_reviewer(context)
    
    assert result.status == AgentStatus.BLOCKED


@pytest.mark.asyncio
async def test_repair_reviewer_approves_safe_actions():
    """Test that repair reviewer approves safe schema-preserving actions."""
    prior_outputs = {
        "repair_planner": AgentResult(
            agent_id="repair_planner",
            status=AgentStatus.SUCCESS,
            outputs={
                "repair_plan": {
                    "actions": [
                        {
                            "finding_id": "test_1",
                            "proposed_action": "add_if_not_exists",
                            "schema_preserving": True,
                            "risk_level": "low",
                        }
                    ]
                }
            },
        ),
    }
    
    context = AgentContext(
        task_id="test_workflow_003",
            run_id="test_workflow_003-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_outputs,
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_repair_reviewer(context)
    
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs.get("verdict") == "APPROVED"
