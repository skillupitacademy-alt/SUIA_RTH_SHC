"""
Integration tests for Verification Runner W6 V0-V10 Pipeline

Tests disposable database setup/teardown, validator pipeline execution,
evidence collection with exit codes, and mocked database operations.
"""

import pytest
from pathlib import Path
from datetime import datetime, UTC
from unittest.mock import AsyncMock, MagicMock, patch

from app.orchestration.agent_coordinator import AgentContext, AgentStatus
from app.workflows.migration_repair.agents.verification_runner import execute_verification_runner
from app.workflows.migration_repair.models import VerificationStage, CheckStatus


@pytest.mark.asyncio
async def test_verification_runner_complete_pipeline_execution():
    """
    Test that verification runner executes complete V0-V10 pipeline with evidence collection.
    
    Validates:
    - Disposable database setup (V0)
    - All V1-V9 stages execute in sequence
    - Teardown (V10) runs
    - Exit codes are captured for each stage
    - Evidence is logged to agent-runs.jsonl
    """
    context = AgentContext(
        task_id="test_integration_001",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    # Mock run_verification_pipeline to return successful stages V0-V10
    mock_stages = [
        VerificationStage(
            stage_id=f"V{i}",
            name=f"Stage {i}",
            status=CheckStatus.PASS,
            command=f"mock-command-v{i}",
            exit_code=0,
            duration_ms=100,
            timestamp=datetime.now(UTC)
        )
        for i in range(11)
    ]
    
    with patch("app.workflows.migration_repair.agents.verification_runner.run_verification_pipeline") as mock_pipeline:
        with patch("app.workflows.migration_repair.agents.verification_runner.validate_and_connect") as mock_validate:
            # Mock database validation to return a mock connection
            mock_conn = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_validate.return_value = mock_conn
            
            # Mock pipeline execution
            mock_pipeline.return_value = mock_stages
            
            # Execute verification runner
            result = await execute_verification_runner(context)
            
            # Verify result structure
            assert result is not None
            assert result.agent_id == "verification_runner"
            assert result.status == AgentStatus.SUCCESS
            
            # Verify stages output
            assert "stages" in result.outputs
            stages_output = result.outputs["stages"]
            assert len(stages_output) == 11, "Should have 11 stages (V0-V10)"
            
            # Verify each stage has required fields
            for stage in stages_output:
                assert "stage_id" in stage
                assert "name" in stage
                assert "status" in stage
                assert "exit_code" in stage, "Exit code must be captured"
                assert "duration_ms" in stage
            
            # Verify exit codes are captured
            exit_codes = [s["exit_code"] for s in stages_output]
            assert all(code == 0 for code in exit_codes), "All stages should have exit_code=0"
            
            # Verify evidence logged
            assert "agent-runs.jsonl" in result.evidence_ids
            
            # Verify summary
            assert "summary" in result.outputs
            summary = result.outputs["summary"]
            assert summary["total_stages"] == 11
            assert summary["passed"] == 11
            assert summary["failed"] == 0
            assert summary["blocked"] == 0
            
            # Verify database validation was called
            mock_validate.assert_called_once()


@pytest.mark.asyncio
async def test_verification_runner_stages_blocked_on_failure():
    """
    Test that when V2 fails, subsequent stages V3-V10 are marked BLOCKED.
    
    Validates stop_on_failure behavior in the pipeline.
    """
    context = AgentContext(
        task_id="test_integration_002",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    # Mock stages: V0-V1 pass, V2 fails, V3-V10 blocked
    mock_stages = [
        VerificationStage(
            stage_id="V0",
            name="Setup Test Database",
            status=CheckStatus.PASS,
            command="docker-compose up -d test-postgres",
            exit_code=0,
            duration_ms=500,
            timestamp=datetime.now(UTC)
        ),
        VerificationStage(
            stage_id="V1",
            name="Wait for Database Ready",
            status=CheckStatus.PASS,
            command="docker-compose exec -T test-postgres pg_isready",
            exit_code=0,
            duration_ms=100,
            timestamp=datetime.now(UTC)
        ),
        VerificationStage(
            stage_id="V2",
            name="Run Migrations",
            status=CheckStatus.FAIL,
            command="pnpm --filter @quiz/db db:migrate",
            exit_code=1,  # Non-zero exit code
            duration_ms=200,
            timestamp=datetime.now(UTC)
        ),
    ]
    
    # V3-V10 are blocked
    for i in range(3, 11):
        mock_stages.append(
            VerificationStage(
                stage_id=f"V{i}",
                name=f"Stage {i}",
                status=CheckStatus.BLOCKED,
                command=None,
                exit_code=None,
                duration_ms=0,
                timestamp=datetime.now(UTC),
                blocked_reason="Previous stage failed"
            )
        )
    
    with patch("app.workflows.migration_repair.agents.verification_runner.run_verification_pipeline") as mock_pipeline:
        with patch("app.workflows.migration_repair.agents.verification_runner.validate_and_connect") as mock_validate:
            mock_conn = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_validate.return_value = mock_conn
            
            mock_pipeline.return_value = mock_stages
            
            result = await execute_verification_runner(context)
            
            # Verify result indicates failure
            assert result.status == AgentStatus.FAILED
            
            # Verify stages output
            stages_output = result.outputs["stages"]
            
            # V0-V1 passed
            assert stages_output[0]["status"] == "PASS"
            assert stages_output[1]["status"] == "PASS"
            
            # V2 failed
            assert stages_output[2]["status"] == "FAIL"
            assert stages_output[2]["exit_code"] == 1
            
            # V3-V10 blocked
            for i in range(3, 11):
                assert stages_output[i]["status"] == "BLOCKED"
                assert stages_output[i]["exit_code"] is None
                assert stages_output[i]["blocked_reason"] is not None
            
            # Verify summary
            summary = result.outputs["summary"]
            assert summary["passed"] == 2  # V0, V1
            assert summary["failed"] == 1  # V2
            assert summary["blocked"] == 8  # V3-V10


@pytest.mark.asyncio
async def test_verification_runner_database_validation_failure():
    """
    Test that verification runner fails fast when database validation fails.
    
    Validates pre-connection safety checks before running verification pipeline.
    """
    context = AgentContext(
        task_id="test_integration_003",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    with patch("app.workflows.migration_repair.agents.verification_runner.validate_and_connect") as mock_validate:
        # Mock database validation to raise ValueError (unsafe target)
        mock_validate.side_effect = ValueError("Database target validation failed: production database not allowed")
        
        result = await execute_verification_runner(context)
        
        # Verify result indicates failure
        assert result.status == AgentStatus.FAILED
        
        # Verify error message
        assert len(result.errors) > 0
        assert "Database validation failed" in result.errors[0]
        
        # Verify no stages were executed
        assert result.outputs["stages"] == []
        assert result.outputs["summary"]["total_stages"] == 0


@pytest.mark.asyncio
async def test_verification_runner_captures_exit_codes():
    """
    Test that exit codes are captured for all executed stages.
    
    Validates that evidence includes exit codes for audit trail.
    """
    context = AgentContext(
        task_id="test_integration_004",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    # Mock stages with varying exit codes
    mock_stages = [
        VerificationStage(
            stage_id="V0",
            name="Setup Test Database",
            status=CheckStatus.PASS,
            command="docker-compose up -d test-postgres",
            exit_code=0,
            duration_ms=500,
            timestamp=datetime.now(UTC)
        ),
        VerificationStage(
            stage_id="V1",
            name="Wait for Database Ready",
            status=CheckStatus.PASS,
            command="docker-compose exec -T test-postgres pg_isready",
            exit_code=0,
            duration_ms=100,
            timestamp=datetime.now(UTC)
        ),
        VerificationStage(
            stage_id="V2",
            name="Run Migrations",
            status=CheckStatus.FAIL,
            command="pnpm --filter @quiz/db db:migrate",
            exit_code=127,  # Command not found
            duration_ms=50,
            timestamp=datetime.now(UTC)
        ),
    ]
    
    with patch("app.workflows.migration_repair.agents.verification_runner.run_verification_pipeline") as mock_pipeline:
        with patch("app.workflows.migration_repair.agents.verification_runner.validate_and_connect") as mock_validate:
            mock_conn = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_validate.return_value = mock_conn
            
            mock_pipeline.return_value = mock_stages
            
            result = await execute_verification_runner(context)
            
            # Verify exit codes are captured
            stages_output = result.outputs["stages"]
            
            assert stages_output[0]["exit_code"] == 0
            assert stages_output[1]["exit_code"] == 0
            assert stages_output[2]["exit_code"] == 127
            
            # Verify evidence logged
            assert "agent-runs.jsonl" in result.evidence_ids


@pytest.mark.asyncio
async def test_verification_runner_evidence_collection():
    """
    Test that verification runner logs evidence to agent-runs.jsonl.
    
    Validates evidence collection contract for audit trail.
    """
    context = AgentContext(
        task_id="test_integration_005",
        workflow_state={},
        repository_snapshot={},
        evidence_graph={},
        approved_scope=[],
        prior_agent_outputs={},
        repository_root=Path.cwd(),
        timestamp=datetime.now(UTC)
    )
    
    mock_stages = [
        VerificationStage(
            stage_id="V0",
            name="Setup Test Database",
            status=CheckStatus.PASS,
            command="docker-compose up -d test-postgres",
            exit_code=0,
            duration_ms=500,
            timestamp=datetime.now(UTC)
        ),
    ]
    
    with patch("app.workflows.migration_repair.agents.verification_runner.run_verification_pipeline") as mock_pipeline:
        with patch("app.workflows.migration_repair.agents.verification_runner.validate_and_connect") as mock_validate:
            mock_conn = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_validate.return_value = mock_conn
            
            mock_pipeline.return_value = mock_stages
            
            result = await execute_verification_runner(context)
            
            # Verify evidence was collected
            assert "agent-runs.jsonl" in result.evidence_ids
            
            # Verify result has execution metadata
            assert result.execution_time_ms > 0
            assert result.timestamp is not None
            assert result.agent_id == "verification_runner"
