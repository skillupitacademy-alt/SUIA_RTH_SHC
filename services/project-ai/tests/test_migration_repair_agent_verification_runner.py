"""
Unit tests for Verification Runner Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.verification_runner import execute_verification_runner


@pytest.mark.asyncio
async def test_verification_runner_logs_evidence():
    """Test that verification runner agent logs to evidence ledger."""
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
    
    result = await execute_verification_runner(context)
    
    assert result is not None
    assert result.agent_id == "verification_runner"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_verification_runner_returns_stage_results():
    """Test that verification runner returns verification stage results."""
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
    
    result = await execute_verification_runner(context)
    
    # Should have stage results
    assert "stages" in result.outputs
    assert "summary" in result.outputs


@pytest.mark.asyncio
async def test_verification_runner_handles_errors():
    """Test that verification runner handles errors without crashing."""
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
    
    result = await execute_verification_runner(context)
    
    # Should complete gracefully even if stages fail
    assert result.agent_id == "verification_runner"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED, AgentStatus.BLOCKED]
