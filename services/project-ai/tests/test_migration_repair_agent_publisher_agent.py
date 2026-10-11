"""
Unit tests for Publisher Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.publisher_agent import execute_publisher_agent
from app.workflows.migration_repair.models import CheckStatus


@pytest.mark.asyncio
async def test_publisher_agent_logs_evidence():
    """Test that publisher agent logs to evidence ledger."""
    prior_outputs = {
        "final_gate_agent": AgentResult(
            agent_id="final_gate_agent",
            status=AgentStatus.SUCCESS,
            outputs={"gate_verdict": CheckStatus.PASS.value},
        ),
        "repair_implementer": AgentResult(
            agent_id="repair_implementer",
            status=AgentStatus.SUCCESS,
            outputs={"commit_after": "abc123"},
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
    
    result = await execute_publisher_agent(context)
    
    assert result is not None
    assert result.agent_id == "publisher_agent"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_publisher_agent_blocks_without_gate_pass():
    """Test that publisher agent blocks when gate doesn't pass."""
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
    
    result = await execute_publisher_agent(context)
    
    assert result.status == AgentStatus.BLOCKED


@pytest.mark.asyncio
async def test_publisher_agent_does_not_push():
    """Test that publisher agent does not push to remote per policy."""
    prior_outputs = {
        "final_gate_agent": AgentResult(
            agent_id="final_gate_agent",
            status=AgentStatus.SUCCESS,
            outputs={"gate_verdict": CheckStatus.PASS.value},
        ),
        "repair_implementer": AgentResult(
            agent_id="repair_implementer",
            status=AgentStatus.SUCCESS,
            outputs={"commit_after": "abc123"},
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
    
    result = await execute_publisher_agent(context)
    
    # Should succeed but not actually push
    if result.status == AgentStatus.SUCCESS:
        assert result.outputs.get("published") == False
