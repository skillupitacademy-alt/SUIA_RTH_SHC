"""
Unit tests for Evidence Audit Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.evidence_audit import execute_evidence_audit


@pytest.mark.asyncio
async def test_evidence_audit_logs_evidence():
    """Test that evidence audit agent logs to evidence ledger."""
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
    
    result = await execute_evidence_audit(context)
    
    assert result is not None
    assert result.agent_id == "evidence_audit"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_evidence_audit_handles_missing_evidence_dir():
    """Test that evidence audit handles missing evidence directory gracefully."""
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
    
    result = await execute_evidence_audit(context)
    
    # Should succeed even if directory doesn't exist
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs.get("evidence_dir_exists") == False


@pytest.mark.asyncio
async def test_evidence_audit_returns_validation_results():
    """Test that evidence audit returns validation results."""
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
    
    result = await execute_evidence_audit(context)
    
    # Should have validation results
    assert "valid_records" in result.outputs
    assert "invalid_records" in result.outputs
