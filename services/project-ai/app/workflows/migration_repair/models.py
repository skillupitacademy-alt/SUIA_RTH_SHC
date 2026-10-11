"""
Data models for migration repair workflow.

Defines core type system for migration repair agents and workflow state.
"""

from enum import StrEnum
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RunStatus(StrEnum):
    """Run status values for agent execution."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PASS = "PASS"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"


class CheckStatus(StrEnum):
    """Check status values for verification gates."""
    PASS = "PASS"
    FAIL = "FAIL"
    SKIPPED = "SKIPPED"
    BLOCKED = "BLOCKED"


class AgentResult(BaseModel):
    """Result of an agent execution."""
    
    agent_id: str = Field(description="Agent identifier (e.g., 'W0-Agent0', 'W1-Agent1')")
    status: RunStatus = Field(description="Execution status")
    findings: list[str] = Field(default_factory=list, description="Findings or observations")
    artifacts: dict[str, Any] = Field(default_factory=dict, description="Output artifacts")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(), description="Execution timestamp")
    duration_ms: Optional[int] = Field(default=None, description="Execution duration in milliseconds")
    error: Optional[str] = Field(default=None, description="Error message if status is FAIL")


class CommandResult(BaseModel):
    """Result of a command execution."""
    
    command: str = Field(description="Command that was executed")
    exit_code: int = Field(description="Command exit code")
    stdout: str = Field(default="", description="Standard output")
    stderr: str = Field(default="", description="Standard error")
    sha256: str = Field(description="SHA-256 hash of stdout+stderr concatenated")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(), description="Execution timestamp")
    duration_ms: int = Field(description="Execution duration in milliseconds")


class MigrationFinding(BaseModel):
    """A finding from migration audit."""
    
    finding_type: str = Field(description="Type of finding (e.g., 'duplicate_object', 'missing_snapshot')")
    severity: str = Field(description="Severity level: 'critical', 'warning', 'info'")
    migration_file: Optional[str] = Field(default=None, description="Migration file path if applicable")
    object_name: Optional[str] = Field(default=None, description="Database object name if applicable")
    description: str = Field(description="Human-readable description of the finding")
    recommended_action: Optional[str] = Field(default=None, description="Recommended remediation")


class VerificationStage(BaseModel):
    """A stage in the verification pipeline."""
    
    stage_id: str = Field(description="Stage identifier (e.g., 'V0', 'V1')")
    name: str = Field(description="Human-readable stage name")
    status: CheckStatus = Field(default=CheckStatus.SKIPPED, description="Execution status")
    command: Optional[str] = Field(default=None, description="Command executed for this stage")
    exit_code: Optional[int] = Field(default=None, description="Exit code if command was run")
    output: Optional[str] = Field(default=None, description="Command output")
    timestamp: Optional[datetime] = Field(default=None, description="Execution timestamp")
    duration_ms: Optional[int] = Field(default=None, description="Execution duration in milliseconds")
    blocked_reason: Optional[str] = Field(default=None, description="Why stage was blocked if status is BLOCKED")
