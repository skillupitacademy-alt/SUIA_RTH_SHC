"""
Unit tests for Database Safety Audit Agent
"""

import pytest
import os
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.database_safety_audit import execute_database_safety_audit


@pytest.mark.asyncio
async def test_database_safety_audit_logs_evidence():
    """Test that database safety audit agent logs to evidence ledger."""
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
    
    result = await execute_database_safety_audit(context)
    
    assert result is not None
    assert result.agent_id == "database_safety_audit"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_database_safety_audit_handles_missing_env():
    """Test that database safety audit handles missing DATABASE_URL gracefully."""
    # Ensure env var is not set
    os.environ.pop("DATABASE_URL_TUTORIAL", None)
    os.environ.pop("TEST_DATABASE_URL_TUTORIAL", None)
    
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
    
    result = await execute_database_safety_audit(context)
    
    # Should succeed but report DB not configured
    assert result.status == AgentStatus.SUCCESS
    assert result.outputs.get("db_configured") == False


@pytest.mark.asyncio
async def test_database_safety_audit_detects_production():
    """Test that database safety audit detects production databases."""
    # Set a production-looking database URL
    os.environ["DATABASE_URL_TUTORIAL"] = "postgresql://user:pass@localhost:5432/tutorial_prod"
    
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
    
    result = await execute_database_safety_audit(context)
    
    # Should fail due to production database
    assert result.status == AgentStatus.FAILED
    assert result.outputs.get("is_production") == True
    
    # Cleanup
    os.environ.pop("DATABASE_URL_TUTORIAL", None)


@pytest.mark.asyncio
async def test_database_safety_audit_handles_errors():
    """Test that database safety audit handles errors without crashing."""
    # Set invalid database URL
    os.environ["DATABASE_URL_TUTORIAL"] = "not-a-valid-url"
    
    context = AgentContext(
        task_id="test_workflow_004",
            run_id="test_workflow_004-run",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    result = await execute_database_safety_audit(context)
    
    # Should handle gracefully (may succeed or fail depending on URL parsing)
    assert result.agent_id == "database_safety_audit"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED]
    assert "agent-runs.jsonl" in result.evidence_ids
    
    # Cleanup
    os.environ.pop("DATABASE_URL_TUTORIAL", None)
