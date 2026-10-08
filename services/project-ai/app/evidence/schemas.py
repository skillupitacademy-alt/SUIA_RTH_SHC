"""
Pydantic schemas for evidence harness.

These models define the structure for test and evidence recording
in the M2.9 multi-agent workflow pipeline.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TestResult(BaseModel):
    """Test execution results for a wave run."""
    
    passed: int = Field(description="Number of tests that passed")
    failed: int = Field(description="Number of tests that failed")
    skipped: int = Field(description="Number of tests that were skipped")
    duration: float = Field(description="Total test execution duration in seconds")


class EvidenceRecord(BaseModel):
    """Individual evidence artifact record."""
    
    id: str = Field(description="Unique evidence record identifier")
    type: str = Field(description="Evidence type (e.g., 'test', 'commit', 'artifact')")
    workflowId: str = Field(description="Associated workflow identifier")
    artifactPath: str = Field(description="Path to the evidence artifact")
    sha256: str = Field(description="SHA-256 hash of the artifact")
    timestamp: datetime = Field(description="Timestamp when evidence was recorded")


class AgentRun(BaseModel):
    """Complete agent run record with test results and evidence."""
    
    runId: str = Field(description="Unique run identifier")
    agentId: str = Field(description="Agent identifier (e.g., 'W1A', 'W1B')")
    wave: str = Field(description="Wave identifier (e.g., 'W0', 'W1')")
    commitBefore: str = Field(description="Git commit SHA before changes")
    commitAfter: str = Field(description="Git commit SHA after changes")
    filesChanged: list[str] = Field(description="List of files modified in this run")
    tests: Optional[TestResult] = Field(
        default=None,
        description="Test results for this run"
    )
    evidence: list[EvidenceRecord] = Field(
        default_factory=list,
        description="Evidence artifacts collected during this run"
    )
    status: str = Field(description="Run status (e.g., 'completed', 'failed', 'in-progress')")
