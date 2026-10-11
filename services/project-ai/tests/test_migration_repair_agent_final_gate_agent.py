"""
Unit tests for Final Gate Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.final_gate_agent import execute_final_gate_agent


@pytest.mark.asyncio
async def test_final_gate_agent_logs_evidence():
    """Test that final gate agent logs to evidence ledger."""
    prior_outputs = {
        "verification_runner": AgentResult(
            agent_id="verification_runner",
            status=AgentStatus.SUCCESS,
            outputs={"stages": []},
        ),
        "evidence_assembler": AgentResult(
            agent_id="evidence_assembler",
            status=AgentStatus.SUCCESS,
            outputs={},
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
    
    result = await execute_final_gate_agent(context)
    
    assert result is not None
    assert result.agent_id == "final_gate_agent"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_final_gate_agent_blocks_without_verification():
    """Test that final gate blocks when verification hasn't completed."""
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
    
    result = await execute_final_gate_agent(context)
    
    assert result.status == AgentStatus.BLOCKED


@pytest.mark.asyncio
async def test_final_gate_agent_returns_verdict():
    """Test that final gate agent returns gate verdict."""
    prior_outputs = {
        "verification_runner": AgentResult(
            agent_id="verification_runner",
            status=AgentStatus.SUCCESS,
            outputs={"stages": []},
        ),
        "evidence_assembler": AgentResult(
            agent_id="evidence_assembler",
            status=AgentStatus.SUCCESS,
            outputs={},
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
    
    result = await execute_final_gate_agent(context)
    
    # Should have gate verdict
    assert "gate_verdict" in result.outputs
    assert "check_results" in result.outputs


def test_format_commit_message_includes_run_id():
    """Test that format_commit_message includes Run-ID footer."""
    from app.workflows.migration_repair.agents.final_gate_agent import format_commit_message
    
    run_id = "migration-repair-20261011-143539-06936246"
    message = format_commit_message(run_id)
    
    assert "Run-ID: migration-repair-20261011-143539-06936246" in message
    assert len(message.split("\n")) >= 2  # At least summary + footer
    
    # Test with custom summary
    custom_message = format_commit_message(run_id, "Custom commit summary")
    assert "Custom commit summary" in custom_message
    assert "Run-ID: migration-repair-20261011-143539-06936246" in custom_message
