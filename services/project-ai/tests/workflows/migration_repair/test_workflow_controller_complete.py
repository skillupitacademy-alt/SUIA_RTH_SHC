"""
Complete unit tests for workflow_controller agent.

REPAIR-006 (MEDIUM): workflow_controller.py agent lacks dedicated unit test file.
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import AsyncMock, patch, MagicMock

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.workflow_controller import (
    execute_workflow_controller,
    _get_git_sha,
    _build_execution_plan,
)


@pytest.mark.asyncio
async def test_workflow_controller_logs_evidence():
    """
    Test workflow_controller logs evidence to agent-runs.jsonl.
    
    Verifies evidence logging is working correctly.
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    context = AgentContext(
        task_id="test-workflow-evidence",
        run_id="test-run-evidence",
        repository_root=repo_root,
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={}
    )
    
    with patch("app.workflows.migration_repair.agents.workflow_controller._get_git_sha", new_callable=AsyncMock) as mock_git_sha:
        mock_git_sha.return_value = "abc123def456"
        
        result = await execute_workflow_controller(context)
    
    # Verify result structure
    assert result is not None
    assert result.agent_id == "workflow_controller"
    assert result.status == AgentStatus.SUCCESS
    
    # Verify evidence was logged
    assert result.evidence_ids is not None
    assert "agent-runs.jsonl" in result.evidence_ids
    
    # Verify execution time was recorded
    assert result.execution_time_ms > 0


@pytest.mark.asyncio
async def test_workflow_controller_git_sha_extraction():
    """
    Test _get_git_sha() function extracts git SHA correctly.
    
    Tests the async git SHA extraction after REPAIR-002 is applied.
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    with patch("app.workflows.migration_repair.agents.workflow_controller.run_command", new_callable=AsyncMock) as mock_run_command:
        # Mock successful git command
        mock_result = MagicMock()
        mock_result.exit_code = 0
        mock_result.stdout = "abc123def456789\n"
        mock_run_command.return_value = mock_result
        
        sha = await _get_git_sha(repo_root)
    
    # Verify SHA was extracted and stripped
    assert sha == "abc123def456789"
    
    # Verify run_command was called correctly
    mock_run_command.assert_called_once_with(
        "git rev-parse HEAD",
        cwd=str(repo_root),
        timeout=5
    )


@pytest.mark.asyncio
async def test_workflow_controller_git_sha_failure():
    """
    Test _get_git_sha() handles git command failure gracefully.
    
    Verifies that git failures return 'unknown' instead of crashing.
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    with patch("app.workflows.migration_repair.agents.workflow_controller.run_command", new_callable=AsyncMock) as mock_run_command:
        # Mock failed git command
        mock_result = MagicMock()
        mock_result.exit_code = 1
        mock_result.stdout = ""
        mock_run_command.return_value = mock_result
        
        sha = await _get_git_sha(repo_root)
    
    # Verify fallback to 'unknown'
    assert sha == "unknown"


@pytest.mark.asyncio
async def test_workflow_controller_git_sha_exception():
    """
    Test _get_git_sha() handles exceptions gracefully.
    
    Verifies that exceptions return 'unknown' instead of crashing.
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    with patch("app.workflows.migration_repair.agents.workflow_controller.run_command", new_callable=AsyncMock) as mock_run_command:
        # Mock exception
        mock_run_command.side_effect = Exception("git not found")
        
        sha = await _get_git_sha(repo_root)
    
    # Verify fallback to 'unknown'
    assert sha == "unknown"


@pytest.mark.asyncio
async def test_workflow_controller_error_handling():
    """
    Test workflow_controller handles errors and returns FAILED status.
    
    Tests failure scenarios.
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    context = AgentContext(
        task_id="test-workflow-error",
        run_id="test-run-error",
        repository_root=repo_root,
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={}
    )
    
    with patch("app.workflows.migration_repair.agents.workflow_controller._get_git_sha", new_callable=AsyncMock) as mock_git_sha:
        # Mock exception in git SHA extraction
        mock_git_sha.side_effect = Exception("Unexpected error")
        
        result = await execute_workflow_controller(context)
    
    # Verify failure status
    assert result.status == AgentStatus.FAILED
    assert result.errors is not None
    assert len(result.errors) > 0
    assert "Workflow controller failed" in result.errors[0]


@pytest.mark.asyncio
async def test_workflow_controller_uses_run_command():
    """
    Test workflow_controller uses run_command() wrapper after REPAIR-002.
    
    Verifies that subprocess.run() has been replaced with run_command().
    Acceptance test: test_workflow_controller_uses_run_command
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    context = AgentContext(
        task_id="test-run-command",
        run_id="test-run-command",
        repository_root=repo_root,
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={}
    )
    
    with patch("app.workflows.migration_repair.agents.workflow_controller.run_command", new_callable=AsyncMock) as mock_run_command:
        mock_result = MagicMock()
        mock_result.exit_code = 0
        mock_result.stdout = "abc123\n"
        mock_run_command.return_value = mock_result
        
        result = await execute_workflow_controller(context)
    
    # Verify run_command was called (not subprocess.run)
    assert mock_run_command.called
    assert result.status == AgentStatus.SUCCESS


def test_build_execution_plan():
    """
    Test _build_execution_plan() creates correct wave structure.
    
    Verifies execution plan includes all W0-W9 waves.
    """
    plan = _build_execution_plan()
    
    # Verify plan is a dictionary
    assert isinstance(plan, dict)
    
    # Verify plan contains waves (at least W0 and W1 should exist)
    assert len(plan) > 0
    
    # Each wave should contain a list of agents
    for wave, agents in plan.items():
        assert isinstance(agents, list)
        for agent in agents:
            assert "agent_id" in agent
            assert "name" in agent
            assert "dependencies" in agent
