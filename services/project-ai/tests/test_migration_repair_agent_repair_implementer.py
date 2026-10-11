"""
Unit tests for Repair Implementer Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.repair_implementer import execute_repair_implementer


@pytest.mark.asyncio
async def test_repair_implementer_logs_evidence():
    """Test that repair implementer agent logs to evidence ledger."""
    prior_outputs = {
        "repair_reviewer": AgentResult(
            agent_id="repair_reviewer",
            status=AgentStatus.SUCCESS,
            outputs={
                "verdict": "APPROVED",
                "approved_actions": [],
            },
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
    
    result = await execute_repair_implementer(context)
    
    assert result is not None
    assert result.agent_id == "repair_implementer"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_repair_implementer_blocks_without_approval():
    """Test that repair implementer blocks without reviewer approval."""
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
    
    result = await execute_repair_implementer(context)
    
    assert result.status == AgentStatus.BLOCKED


@pytest.mark.asyncio
async def test_repair_implementer_handles_errors():
    """Test that repair implementer handles errors without crashing."""
    prior_outputs = {
        "repair_reviewer": AgentResult(
            agent_id="repair_reviewer",
            status=AgentStatus.SUCCESS,
            outputs={
                "verdict": "APPROVED",
                "approved_actions": [],
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
    
    result = await execute_repair_implementer(context)
    
    # Should handle gracefully
    assert result.agent_id == "repair_implementer"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED, AgentStatus.BLOCKED]
