"""
Unit tests for Evidence Assembler Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.evidence_assembler import execute_evidence_assembler


@pytest.mark.asyncio
async def test_evidence_assembler_logs_evidence():
    """Test that evidence assembler agent logs to evidence ledger."""
    prior_outputs = {
        "migration_audit": AgentResult(
            agent_id="migration_audit",
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
    
    result = await execute_evidence_assembler(context)
    
    assert result is not None
    assert result.agent_id == "evidence_assembler"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_evidence_assembler_creates_workflow_evidence():
    """Test that evidence assembler creates workflow-specific evidence file."""
    prior_outputs = {
        "test_agent": AgentResult(
            agent_id="test_agent",
            status=AgentStatus.SUCCESS,
            outputs={"test": "data"},
        ),
    }
    
    context = AgentContext(
        task_id="test_workflow_002",
            run_id="test_workflow_002-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs=prior_outputs,
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_evidence_assembler(context)
    
    # Should create workflow-specific evidence file
    assert "evidence_file" in result.outputs
    assert "test_workflow_002" in result.outputs["evidence_file"]


@pytest.mark.asyncio
async def test_evidence_assembler_handles_errors():
    """Test that evidence assembler handles errors without crashing."""
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
    
    result = await execute_evidence_assembler(context)
    
    # Should handle gracefully
    assert result.agent_id == "evidence_assembler"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED]
