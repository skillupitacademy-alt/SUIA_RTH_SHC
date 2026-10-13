"""
Unit tests for Test Reviewer Agent
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC

from app.orchestration.agent_coordinator import AgentContext, AgentStatus, AgentResult
from app.workflows.migration_repair.agents.test_reviewer import execute_test_reviewer


@pytest.mark.asyncio
async def test_test_reviewer_logs_evidence():
    """Test that test reviewer agent logs to evidence ledger."""
    prior_outputs = {
        "test_inventory": AgentResult(
            agent_id="test_inventory",
            status=AgentStatus.SUCCESS,
            outputs={
                "test_files": [],
                "migration_tests": [],
                "integration_tests": [],
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
    
    result = await execute_test_reviewer(context)
    
    assert result is not None
    assert result.agent_id == "test_reviewer"
    assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_test_reviewer_blocks_without_inventory():
    """Test that test reviewer blocks when inventory hasn't completed."""
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
    
    result = await execute_test_reviewer(context)
    
    assert result.status == AgentStatus.BLOCKED


@pytest.mark.asyncio
async def test_test_reviewer_returns_coverage_analysis():
    """Test that test reviewer returns test coverage analysis."""
    prior_outputs = {
        "test_inventory": AgentResult(
            agent_id="test_inventory",
            status=AgentStatus.SUCCESS,
            outputs={
                "test_files": ["tests/test_example.py"],
                "migration_tests": [],
                "integration_tests": [],
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
    
    result = await execute_test_reviewer(context)
    
    # Should have coverage analysis
    assert "test_coverage" in result.outputs
    assert "findings" in result.outputs
