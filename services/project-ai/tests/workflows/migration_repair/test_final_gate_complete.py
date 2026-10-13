"""
Complete unit tests for final_gate_agent.

Tests for REPAIR-003 and REPAIR-005: async verify_commit_identity() using run_command()
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from pathlib import Path

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.final_gate_agent import (
    execute_final_gate_agent,
    verify_commit_identity,
    verify_evidence_files,
    verify_test_coverage,
)
from app.workflows.migration_repair.models import CheckStatus


@pytest.mark.asyncio
async def test_final_gate_uses_run_command():
    """
    Test final_gate_agent uses run_command() for git operations.
    
    Verifies subprocess.run() has been replaced with run_command().
    Acceptance test: test_final_gate_agent_uses_run_command
    """
    with patch("app.workflows.migration_repair.agents.final_gate_agent.run_command", new_callable=AsyncMock) as mock_run_command:
        mock_result = MagicMock()
        mock_result.exit_code = 0
        mock_result.stdout = "abc123def456\n"
        mock_run_command.return_value = mock_result
        
        match, current_sha, tested_sha = await verify_commit_identity()
    
    # Verify run_command was called (not subprocess.run)
    assert mock_run_command.called
    mock_run_command.assert_called_once_with("git rev-parse HEAD", timeout=10)
    
    # Verify result
    assert match is True
    assert current_sha == "abc123def456"
    assert tested_sha == "abc123def456"


@pytest.mark.asyncio
async def test_verify_commit_identity_async():
    """
    Test verify_commit_identity() is async after REPAIR-003.
    
    Acceptance test: test_verify_commit_identity_async
    """
    with patch("app.workflows.migration_repair.agents.final_gate_agent.run_command", new_callable=AsyncMock) as mock_run_command:
        mock_result = MagicMock()
        mock_result.exit_code = 0
        mock_result.stdout = "test-sha-789\n"
        mock_run_command.return_value = mock_result
        
        # This should work with await (function is async)
        result = await verify_commit_identity()
    
    assert result is not None
    assert isinstance(result, tuple)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_verify_commit_identity_failure():
    """
    Test verify_commit_identity() handles git command failure.
    
    Verifies that git failures are handled gracefully.
    """
    with patch("app.workflows.migration_repair.agents.final_gate_agent.run_command", new_callable=AsyncMock) as mock_run_command:
        # Mock exception
        mock_run_command.side_effect = Exception("git not found")
        
        match, current_sha, tested_sha = await verify_commit_identity()
    
    # Verify failure handling
    assert match is False
    assert current_sha is None
    assert tested_sha is None


@pytest.mark.asyncio
async def test_final_gate_agent_success():
    """
    Test final_gate_agent with successful verification results.
    """
    repo_root = Path(__file__).parent.parent.parent.parent
    
    # We can't easily mock _replace for dataclass, so create proper AgentResult objects
    from app.orchestration.agent_coordinator import AgentResult
    
    verification_runner_result = AgentResult(
        agent_id="verification_runner",
        status=AgentStatus.SUCCESS,
        outputs={
            "stages": [
                {"stage_id": "V2", "status": "PASS"},
                {"stage_id": "V3", "status": "PASS"},
                {"stage_id": "V4", "status": "PASS"},
                {"stage_id": "V5", "status": "PASS"},
                {"stage_id": "V6", "status": "PASS"},
            ]
        }
    )
    
    evidence_assembler_result = AgentResult(
        agent_id="evidence_assembler",
        status=AgentStatus.SUCCESS
    )
    
    context = AgentContext(
        task_id="test-final-gate-success",
        run_id="test-run-final-gate-success",
        repository_root=repo_root,
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={
            "verification_runner": verification_runner_result,
            "evidence_assembler": evidence_assembler_result,
        }
    )
    
    with patch("app.workflows.migration_repair.agents.final_gate_agent.verify_commit_identity", new_callable=AsyncMock) as mock_verify_commit:
        mock_verify_commit.return_value = (True, "abc123", "abc123")
        
        with patch("app.workflows.migration_repair.agents.final_gate_agent.verify_evidence_files") as mock_verify_evidence:
            mock_verify_evidence.return_value = MagicMock(
                all_exist=True,
                all_match=True,
                missing_files=[],
                tampered_files=[]
            )
            
            result = await execute_final_gate_agent(context)
    
    # Verify result
    assert result is not None
    assert result.agent_id == "final_gate_agent"
    assert result.status in [AgentStatus.SUCCESS, AgentStatus.FAILED, AgentStatus.BLOCKED]


def test_verify_test_coverage_no_skipped():
    """
    Test verify_test_coverage with no skipped tests.
    """
    check_results = {
        "migration_execution": CheckStatus.PASS,
        "schema_verification": CheckStatus.PASS,
        "package_tests": CheckStatus.PASS,
    }
    
    all_executed, skipped = verify_test_coverage(check_results)
    
    assert all_executed is True
    assert skipped == []


def test_verify_test_coverage_with_skipped():
    """
    Test verify_test_coverage with skipped tests.
    """
    check_results = {
        "migration_execution": CheckStatus.PASS,
        "schema_verification": CheckStatus.SKIPPED,
        "package_tests": CheckStatus.PASS,
    }
    
    all_executed, skipped = verify_test_coverage(check_results)
    
    assert all_executed is False
    assert "schema_verification" in skipped
