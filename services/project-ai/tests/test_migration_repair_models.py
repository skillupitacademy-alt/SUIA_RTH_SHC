"""
Unit tests for migration repair workflow models.

Tests all enums and dataclasses in models.py.
"""

import pytest
from datetime import datetime

from app.workflows.migration_repair.models import (
    RunStatus,
    CheckStatus,
    AgentResult,
    CommandResult,
    MigrationFinding,
    VerificationStage,
)


def test_run_status_enum():
    """Test RunStatus enum values."""
    assert RunStatus.PENDING == "PENDING"
    assert RunStatus.RUNNING == "RUNNING"
    assert RunStatus.PASS == "PASS"
    assert RunStatus.FAIL == "FAIL"
    assert RunStatus.BLOCKED == "BLOCKED"
    
    # Test all values are present
    assert len(RunStatus) == 5


def test_check_status_enum():
    """Test CheckStatus enum values."""
    assert CheckStatus.PASS == "PASS"
    assert CheckStatus.FAIL == "FAIL"
    assert CheckStatus.SKIPPED == "SKIPPED"
    assert CheckStatus.BLOCKED == "BLOCKED"
    
    # Test all values are present
    assert len(CheckStatus) == 4


def test_agent_result_minimal():
    """Test AgentResult with minimal required fields."""
    result = AgentResult(
        agent_id="Agent1",
        status=RunStatus.PASS
    )
    
    assert result.agent_id == "Agent1"
    assert result.status == RunStatus.PASS
    assert result.findings == []
    assert result.artifacts == {}
    assert result.error is None
    assert result.duration_ms is None
    assert isinstance(result.timestamp, datetime)


def test_agent_result_full():
    """Test AgentResult with all fields populated."""
    timestamp = datetime(2024, 1, 15, 10, 30, 0)
    result = AgentResult(
        agent_id="W1-Agent1",
        status=RunStatus.FAIL,
        findings=["Duplicate table 'users'", "Missing snapshot"],
        artifacts={"migration_file": "0001_init.sql"},
        timestamp=timestamp,
        duration_ms=1500,
        error="Migration failed: duplicate object"
    )
    
    assert result.agent_id == "W1-Agent1"
    assert result.status == RunStatus.FAIL
    assert len(result.findings) == 2
    assert result.artifacts["migration_file"] == "0001_init.sql"
    assert result.timestamp == timestamp
    assert result.duration_ms == 1500
    assert result.error == "Migration failed: duplicate object"


def test_command_result():
    """Test CommandResult dataclass."""
    timestamp = datetime(2024, 1, 15, 10, 30, 0)
    result = CommandResult(
        command="pytest tests/ -v",
        exit_code=0,
        stdout="All tests passed",
        stderr="",
        sha256="abc123def456",
        timestamp=timestamp,
        duration_ms=2500
    )
    
    assert result.command == "pytest tests/ -v"
    assert result.exit_code == 0
    assert result.stdout == "All tests passed"
    assert result.stderr == ""
    assert result.sha256 == "abc123def456"
    assert result.timestamp == timestamp
    assert result.duration_ms == 2500


def test_command_result_failure():
    """Test CommandResult for failed command."""
    result = CommandResult(
        command="npm run invalid",
        exit_code=1,
        stdout="",
        stderr="Error: Script 'invalid' not found",
        sha256="error123hash",
        duration_ms=100
    )
    
    assert result.exit_code == 1
    assert result.stderr != ""
    assert "Error" in result.stderr


def test_migration_finding_minimal():
    """Test MigrationFinding with minimal fields."""
    finding = MigrationFinding(
        finding_type="duplicate_object",
        severity="critical",
        description="Duplicate table 'users' detected"
    )
    
    assert finding.finding_type == "duplicate_object"
    assert finding.severity == "critical"
    assert finding.description == "Duplicate table 'users' detected"
    assert finding.migration_file is None
    assert finding.object_name is None
    assert finding.recommended_action is None


def test_migration_finding_full():
    """Test MigrationFinding with all fields."""
    finding = MigrationFinding(
        finding_type="duplicate_object",
        severity="critical",
        migration_file="drizzle/0002_add_users.sql",
        object_name="users",
        description="Table 'users' already exists in 0001_init.sql",
        recommended_action="Remove duplicate CREATE TABLE statement"
    )
    
    assert finding.finding_type == "duplicate_object"
    assert finding.severity == "critical"
    assert finding.migration_file == "drizzle/0002_add_users.sql"
    assert finding.object_name == "users"
    assert finding.recommended_action == "Remove duplicate CREATE TABLE statement"


def test_verification_stage_default():
    """Test VerificationStage with defaults."""
    stage = VerificationStage(
        stage_id="V0",
        name="Setup Test Database"
    )
    
    assert stage.stage_id == "V0"
    assert stage.name == "Setup Test Database"
    assert stage.status == CheckStatus.SKIPPED
    assert stage.command is None
    assert stage.exit_code is None
    assert stage.output is None
    assert stage.timestamp is None
    assert stage.duration_ms is None
    assert stage.blocked_reason is None


def test_verification_stage_passed():
    """Test VerificationStage in PASS state."""
    timestamp = datetime(2024, 1, 15, 10, 30, 0)
    stage = VerificationStage(
        stage_id="V2",
        name="Run Migrations",
        status=CheckStatus.PASS,
        command="pnpm db:migrate",
        exit_code=0,
        output="Migrations completed successfully",
        timestamp=timestamp,
        duration_ms=3000
    )
    
    assert stage.stage_id == "V2"
    assert stage.status == CheckStatus.PASS
    assert stage.exit_code == 0
    assert stage.output == "Migrations completed successfully"
    assert stage.duration_ms == 3000
    assert stage.blocked_reason is None


def test_verification_stage_blocked():
    """Test VerificationStage in BLOCKED state."""
    stage = VerificationStage(
        stage_id="V5",
        name="Integration Tests",
        status=CheckStatus.BLOCKED,
        blocked_reason="Previous stage V4 failed"
    )
    
    assert stage.stage_id == "V5"
    assert stage.status == CheckStatus.BLOCKED
    assert stage.blocked_reason == "Previous stage V4 failed"
    assert stage.exit_code is None
