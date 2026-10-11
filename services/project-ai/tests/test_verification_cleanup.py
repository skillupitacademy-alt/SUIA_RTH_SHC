"""
Unit tests for verification cleanup guarantees (FEAT-003).

Verifies that cleanup always runs in finally block, cleanup is verified,
and failed cleanup marks stage as BLOCKED.
"""

import json
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from datetime import datetime

from app.workflows.migration_repair.verification import (
    run_verification_pipeline,
    ensure_cleanup,
    verify_database_dropped,
)
from app.workflows.migration_repair.models import (
    CheckStatus,
    CommandResult,
    CleanupResult,
)


@pytest.mark.asyncio
async def test_cleanup_runs_in_finally_on_success():
    """Test that cleanup runs even when all stages succeed."""
    
    # Mock run_command to succeed for all stages
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.return_value = CommandResult(
            command="test",
            exit_code=0,
            stdout="success",
            stderr="",
            sha256="abc123",
            timestamp=datetime.now(),
            duration_ms=100
        )
        
        # Mock ensure_cleanup
        with patch("app.workflows.migration_repair.verification.ensure_cleanup") as mock_cleanup:
            mock_cleanup.return_value = CleanupResult(
                success=True,
                verified=True,
                log_path=".agents/evidence/runs/cleanup-test.jsonl",
                timestamp=datetime.now()
            )
            
            # Run pipeline
            stages = await run_verification_pipeline(cwd="/test")
            
            # Verify cleanup was called
            mock_cleanup.assert_called_once()
            assert mock_cleanup.call_args[1]["cwd"] == "/test"
            
            # Verify V10 stage has cleanup_status
            v10_stage = next((s for s in stages if s.stage_id == "V10"), None)
            assert v10_stage is not None
            assert v10_stage.cleanup_status == CheckStatus.PASS


@pytest.mark.asyncio
async def test_cleanup_runs_in_finally_on_exception():
    """Test that cleanup runs even when a stage raises exception."""
    
    # Mock run_command to raise exception on first stage
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.side_effect = Exception("Test failure")
        
        # Mock ensure_cleanup
        with patch("app.workflows.migration_repair.verification.ensure_cleanup") as mock_cleanup:
            mock_cleanup.return_value = CleanupResult(
                success=True,
                verified=True,
                log_path=".agents/evidence/runs/cleanup-test.jsonl",
                timestamp=datetime.now()
            )
            
            # Run pipeline
            stages = await run_verification_pipeline(cwd="/test")
            
            # Verify cleanup was called despite exception
            mock_cleanup.assert_called_once()
            
            # Verify at least V0 stage exists and failed
            v0_stage = next((s for s in stages if s.stage_id == "V0"), None)
            assert v0_stage is not None
            assert v0_stage.status == CheckStatus.FAIL


@pytest.mark.asyncio
async def test_ensure_cleanup_verifies_database_dropped():
    """Test that ensure_cleanup verifies database is actually dropped."""
    
    # Mock run_command for teardown
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.return_value = CommandResult(
            command="docker-compose down test-postgres",
            exit_code=0,
            stdout="Stopping test-postgres ... done",
            stderr="",
            sha256="abc123",
            timestamp=datetime.now(),
            duration_ms=100
        )
        
        # Mock verify_database_dropped
        with patch("app.workflows.migration_repair.verification.verify_database_dropped") as mock_verify:
            mock_verify.return_value = True
            
            # Mock file operations
            with patch("builtins.open", mock_open()) as mock_file:
                with patch("pathlib.Path.mkdir"):
                    # Run cleanup
                    result = await ensure_cleanup(cwd="/test", evidence_dir="/test/evidence")
                    
                    # Verify database drop was checked
                    mock_verify.assert_called_once()
                    
                    # Verify result
                    assert result.success is True
                    assert result.verified is True
                    assert "cleanup-" in result.log_path


@pytest.mark.asyncio
async def test_cleanup_failure_marks_blocked():
    """Test that failed cleanup marks V10 stage as BLOCKED."""
    
    # Mock run_command to succeed for all stages
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.return_value = CommandResult(
            command="test",
            exit_code=0,
            stdout="success",
            stderr="",
            sha256="abc123",
            timestamp=datetime.now(),
            duration_ms=100
        )
        
        # Mock ensure_cleanup to return failed verification
        with patch("app.workflows.migration_repair.verification.ensure_cleanup") as mock_cleanup:
            mock_cleanup.return_value = CleanupResult(
                success=True,
                verified=False,  # Cleanup command succeeded but verification failed
                log_path=".agents/evidence/runs/cleanup-test.jsonl",
                timestamp=datetime.now()
            )
            
            # Run pipeline
            stages = await run_verification_pipeline(cwd="/test")
            
            # Find V10 stage
            v10_stage = next((s for s in stages if s.stage_id == "V10"), None)
            assert v10_stage is not None
            
            # Verify stage is BLOCKED due to cleanup failure
            assert v10_stage.status == CheckStatus.BLOCKED
            assert v10_stage.blocked_reason == "Cleanup verification failed - test database may still exist"
            assert v10_stage.cleanup_status == CheckStatus.FAIL


@pytest.mark.asyncio
async def test_cleanup_logs_to_evidence():
    """Test that cleanup logs to evidence directory."""
    
    # Mock run_command for teardown
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.return_value = CommandResult(
            command="docker-compose down test-postgres",
            exit_code=0,
            stdout="Stopping test-postgres ... done",
            stderr="",
            sha256="abc123",
            timestamp=datetime.now(),
            duration_ms=100
        )
        
        # Mock verify_database_dropped
        with patch("app.workflows.migration_repair.verification.verify_database_dropped") as mock_verify:
            mock_verify.return_value = True
            
            # Capture file writes
            written_content = []
            
            def mock_write(content):
                written_content.append(content)
            
            mock_file_handle = MagicMock()
            mock_file_handle.write = mock_write
            mock_file_handle.__enter__ = MagicMock(return_value=mock_file_handle)
            mock_file_handle.__exit__ = MagicMock(return_value=False)
            
            with patch("builtins.open", return_value=mock_file_handle):
                with patch("pathlib.Path.mkdir"):
                    # Run cleanup
                    result = await ensure_cleanup(cwd="/test", evidence_dir="/test/evidence")
                    
                    # Verify log was written
                    assert len(written_content) > 0
                    
                    # Parse JSONL
                    log_entry = json.loads(written_content[0].strip())
                    
                    # Verify log fields
                    assert "timestamp" in log_entry
                    assert log_entry["stage_id"] == "V10"
                    assert log_entry["cleanup_attempted"] is True
                    assert log_entry["cleanup_verified"] is True
                    assert log_entry["database_dropped"] is True
                    assert log_entry["exit_code"] == 0
                    assert log_entry["success"] is True


@pytest.mark.asyncio
async def test_verify_database_dropped_checks_container():
    """Test that verify_database_dropped checks docker-compose ps output."""
    
    # Mock run_command to return container not running
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.return_value = CommandResult(
            command="docker-compose ps test-postgres",
            exit_code=0,
            stdout="",  # Empty output means container not running
            stderr="",
            sha256="abc123",
            timestamp=datetime.now(),
            duration_ms=50
        )
        
        # Check database dropped
        result = await verify_database_dropped(cwd="/test")
        
        # Should return True since container not in output
        assert result is True
        
        # Verify correct command was called
        mock_run.assert_called_once()
        assert "docker-compose ps test-postgres" in mock_run.call_args[0][0]


@pytest.mark.asyncio
async def test_verify_database_dropped_detects_running_container():
    """Test that verify_database_dropped returns False when container is running."""
    
    # Mock run_command to return container running
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        mock_run.return_value = CommandResult(
            command="docker-compose ps test-postgres",
            exit_code=0,
            stdout="test-postgres    Up 5 minutes",  # Container is Up
            stderr="",
            sha256="abc123",
            timestamp=datetime.now(),
            duration_ms=50
        )
        
        # Check database dropped
        result = await verify_database_dropped(cwd="/test")
        
        # Should return False since container is Up
        assert result is False


@pytest.mark.asyncio
async def test_cleanup_creates_stage_when_v10_not_reached():
    """Test that cleanup creates V10 stage if pipeline failed before reaching it."""
    
    # Mock run_command to fail on V0, so V10 never runs
    with patch("app.workflows.migration_repair.verification.run_command") as mock_run:
        async def side_effect(command, cwd=None):
            if "docker-compose up" in command:
                # V0 fails
                return CommandResult(
                    command=command,
                    exit_code=1,
                    stdout="",
                    stderr="Failed to start",
                    sha256="abc123",
                    timestamp=datetime.now(),
                    duration_ms=100
                )
            else:
                # Cleanup command
                return CommandResult(
                    command=command,
                    exit_code=0,
                    stdout="success",
                    stderr="",
                    sha256="abc123",
                    timestamp=datetime.now(),
                    duration_ms=100
                )
        
        mock_run.side_effect = side_effect
        
        # Mock verify_database_dropped
        with patch("app.workflows.migration_repair.verification.verify_database_dropped") as mock_verify:
            mock_verify.return_value = True
            
            # Mock file operations
            with patch("builtins.open", mock_open()) as mock_file:
                with patch("pathlib.Path.mkdir"):
                    # Run pipeline
                    stages = await run_verification_pipeline(cwd="/test")
                    
                    # V0 should have failed
                    v0_stage = next((s for s in stages if s.stage_id == "V0"), None)
                    assert v0_stage is not None
                    assert v0_stage.status == CheckStatus.FAIL
                    
                    # V10 should exist and have cleanup_status
                    v10_stage = next((s for s in stages if s.stage_id == "V10"), None)
                    assert v10_stage is not None
                    assert v10_stage.cleanup_status == CheckStatus.PASS
