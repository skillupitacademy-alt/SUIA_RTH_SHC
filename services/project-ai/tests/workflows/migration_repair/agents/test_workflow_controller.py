"""
Unit tests for Workflow Controller Agent (W0)
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import patch, MagicMock

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.workflow_controller import execute_workflow_controller


@pytest.mark.asyncio
async def test_workflow_controller_logs_evidence():
    """Test that workflow controller agent logs to evidence ledger."""
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
    
    result = await execute_workflow_controller(context)
    
    assert result is not None
    assert result.agent_id == "workflow_controller"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_workflow_controller_returns_success():
    """Test that workflow controller returns SUCCESS status."""
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
    
    result = await execute_workflow_controller(context)
    
    # Should succeed
    assert result.status == AgentStatus.SUCCESS
    assert "run_manifest" in result.outputs
    
    # Check run_manifest structure
    manifest = result.outputs["run_manifest"]
    assert "workflow_id" in manifest
    assert "baseline_sha" in manifest
    assert "timestamp" in manifest
    assert "file_ownership_map" in manifest
    assert "execution_plan" in manifest
    
    # Check file ownership map
    assert "W0" in manifest["file_ownership_map"]
    assert "W4" in manifest["file_ownership_map"]
    
    # Check execution plan
    assert "W0" in manifest["execution_plan"]


@pytest.mark.asyncio
async def test_workflow_controller_handles_errors():
    """Test that workflow controller handles errors gracefully."""
    # Create context with invalid repository root
    invalid_path = Path("/nonexistent/invalid/path/12345")
    
    context = AgentContext(
        task_id="test_workflow_003",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=invalid_path,
        timestamp=datetime.now(UTC)
    )
    
    # Should not crash even with invalid path
    result = await execute_workflow_controller(context)
    
    # Should handle gracefully - either succeed with 'unknown' SHA or fail gracefully
    assert result.agent_id == "workflow_controller"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED]
    
    if result.status == AgentStatus.SUCCESS:
        # If it succeeds, baseline_sha should be 'unknown'
        manifest = result.outputs.get("run_manifest", {})
        assert manifest.get("baseline_sha") == "unknown"
    else:
        # If it fails, should have error message
        assert len(result.errors) > 0
