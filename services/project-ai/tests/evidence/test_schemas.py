"""Tests for evidence schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.evidence.schemas import AgentRun, TestResult, EvidenceRecord


class TestTestResult:
    """Tests for TestResult schema."""
    
    def test_valid_test_result(self):
        """Test valid TestResult creation."""
        result = TestResult(
            passed=10,
            failed=2,
            skipped=1,
            duration=5.5
        )
        assert result.passed == 10
        assert result.failed == 2
        assert result.skipped == 1
        assert result.duration == 5.5
    
    def test_test_result_missing_fields(self):
        """Test TestResult validation with missing required fields."""
        with pytest.raises(ValidationError):
            TestResult(passed=10, failed=2)  # Missing skipped and duration
    
    def test_test_result_serialization(self):
        """Test TestResult JSON serialization."""
        result = TestResult(passed=5, failed=0, skipped=0, duration=2.3)
        data = result.model_dump(mode="json")
        assert data["passed"] == 5
        assert data["failed"] == 0
        assert data["duration"] == 2.3


class TestEvidenceRecord:
    """Tests for EvidenceRecord schema."""
    
    def test_valid_evidence_record(self):
        """Test valid EvidenceRecord creation."""
        now = datetime.now()
        record = EvidenceRecord(
            id="ev-001",
            type="test",
            workflowId="wf-123",
            artifactPath="/path/to/artifact",
            sha256="abc123def456",
            timestamp=now
        )
        assert record.id == "ev-001"
        assert record.type == "test"
        assert record.workflowId == "wf-123"
        assert record.artifactPath == "/path/to/artifact"
        assert record.sha256 == "abc123def456"
        assert record.timestamp == now
    
    def test_evidence_record_missing_fields(self):
        """Test EvidenceRecord validation with missing required fields."""
        with pytest.raises(ValidationError):
            EvidenceRecord(id="ev-001", type="test")  # Missing other fields
    
    def test_evidence_record_serialization(self):
        """Test EvidenceRecord JSON serialization."""
        now = datetime.now()
        record = EvidenceRecord(
            id="ev-001",
            type="commit",
            workflowId="wf-abc",
            artifactPath="/evidence/commit.json",
            sha256="hash123",
            timestamp=now
        )
        data = record.model_dump(mode="json")
        assert data["id"] == "ev-001"
        assert data["type"] == "commit"
        assert isinstance(data["timestamp"], str)  # ISO format


class TestAgentRun:
    """Tests for AgentRun schema."""
    
    def test_valid_agent_run_with_tests(self):
        """Test valid AgentRun creation with test results."""
        tests = TestResult(passed=10, failed=0, skipped=0, duration=3.2)
        run = AgentRun(
            runId="W1-W1A-abc123",
            agentId="W1A",
            wave="W1",
            commitBefore="commit1",
            commitAfter="commit2",
            filesChanged=["file1.py", "file2.py"],
            tests=tests,
            evidence=[],
            status="completed"
        )
        assert run.runId == "W1-W1A-abc123"
        assert run.agentId == "W1A"
        assert run.wave == "W1"
        assert run.tests.passed == 10
        assert len(run.filesChanged) == 2
        assert run.status == "completed"
    
    def test_valid_agent_run_without_tests(self):
        """Test valid AgentRun creation without test results."""
        run = AgentRun(
            runId="W0-setup-xyz",
            agentId="setup",
            wave="W0",
            commitBefore="initial",
            commitAfter="after-setup",
            filesChanged=["config.yml"],
            tests=None,
            evidence=[],
            status="completed"
        )
        assert run.tests is None
        assert run.status == "completed"
    
    def test_agent_run_with_evidence(self):
        """Test AgentRun with evidence records."""
        now = datetime.now()
        evidence_record = EvidenceRecord(
            id="ev-001",
            type="artifact",
            workflowId="wf-123",
            artifactPath="/artifacts/output.json",
            sha256="hash789",
            timestamp=now
        )
        run = AgentRun(
            runId="run-001",
            agentId="agent-1",
            wave="W1",
            commitBefore="before",
            commitAfter="after",
            filesChanged=["main.py"],
            tests=None,
            evidence=[evidence_record],
            status="completed"
        )
        assert len(run.evidence) == 1
        assert run.evidence[0].id == "ev-001"
    
    def test_agent_run_missing_fields(self):
        """Test AgentRun validation with missing required fields."""
        with pytest.raises(ValidationError):
            AgentRun(runId="run-001", agentId="agent-1")  # Missing other fields
    
    def test_agent_run_serialization(self):
        """Test AgentRun JSON serialization."""
        tests = TestResult(passed=5, failed=1, skipped=0, duration=2.1)
        run = AgentRun(
            runId="test-run",
            agentId="test-agent",
            wave="W1",
            commitBefore="abc",
            commitAfter="def",
            filesChanged=["test.py"],
            tests=tests,
            evidence=[],
            status="completed"
        )
        data = run.model_dump(mode="json")
        assert data["runId"] == "test-run"
        assert data["tests"]["passed"] == 5
        assert data["tests"]["duration"] == 2.1
        assert data["filesChanged"] == ["test.py"]
