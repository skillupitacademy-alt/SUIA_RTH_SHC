"""Tests for integration helpers."""

import json

import pytest

from app.evidence.schemas import TestResult
from app.evidence import ledger
from app.evidence.integration import record_wave_completion


@pytest.fixture
def temp_evidence_root(tmp_path, monkeypatch):
    """Mock EVIDENCE_ROOT to use temporary directory."""
    evidence_dir = tmp_path / "evidence"
    evidence_dir.mkdir()
    monkeypatch.setattr(ledger, "EVIDENCE_ROOT", evidence_dir)
    return evidence_dir


class TestRecordWaveCompletion:
    """Tests for record_wave_completion helper."""
    
    def test_record_wave_completion_with_tests(self, temp_evidence_root):
        """Test recording wave completion with test results."""
        tests = TestResult(passed=10, failed=1, skipped=0, duration=5.5)
        
        run = record_wave_completion(
            wave="W1",
            agent_id="W1A",
            commit_before="abc123",
            commit_after="def456",
            files=["file1.py", "file2.py"],
            tests=tests,
            status="completed"
        )
        
        # Verify return value
        assert run.wave == "W1"
        assert run.agentId == "W1A"
        assert run.commitBefore == "abc123"
        assert run.commitAfter == "def456"
        assert run.filesChanged == ["file1.py", "file2.py"]
        assert run.tests.passed == 10
        assert run.tests.failed == 1
        assert run.status == "completed"
        
        # Verify runId format
        assert run.runId.startswith("W1-W1A-")
        
        # Verify written to file
        file_path = temp_evidence_root / "agent-runs.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["wave"] == "W1"
        assert data["agentId"] == "W1A"
        assert data["tests"]["passed"] == 10
    
    def test_record_wave_completion_without_tests(self, temp_evidence_root):
        """Test recording wave completion without test results."""
        run = record_wave_completion(
            wave="W0",
            agent_id="setup",
            commit_before="initial",
            commit_after="setup-done",
            files=["config.yml"],
            tests=None,
            status="completed"
        )
        
        assert run.tests is None
        assert run.status == "completed"
        
        # Verify written to file
        file_path = temp_evidence_root / "agent-runs.jsonl"
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["tests"] is None
    
    def test_record_wave_completion_failed_status(self, temp_evidence_root):
        """Test recording failed wave completion."""
        tests = TestResult(passed=5, failed=3, skipped=0, duration=2.0)
        
        run = record_wave_completion(
            wave="W1",
            agent_id="W1B",
            commit_before="before",
            commit_after="after",
            files=["broken.py"],
            tests=tests,
            status="failed"
        )
        
        assert run.status == "failed"
        assert run.tests.failed == 3
        
        # Verify written to file
        file_path = temp_evidence_root / "agent-runs.jsonl"
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["status"] == "failed"
    
    def test_record_wave_completion_multiple_calls(self, temp_evidence_root):
        """Test multiple wave completion records."""
        tests1 = TestResult(passed=5, failed=0, skipped=0, duration=1.0)
        tests2 = TestResult(passed=8, failed=1, skipped=0, duration=2.5)
        
        run1 = record_wave_completion(
            wave="W1",
            agent_id="W1A",
            commit_before="a",
            commit_after="b",
            files=["file1.py"],
            tests=tests1,
            status="completed"
        )
        
        run2 = record_wave_completion(
            wave="W1",
            agent_id="W1B",
            commit_before="b",
            commit_after="c",
            files=["file2.py"],
            tests=tests2,
            status="completed"
        )
        
        # Verify unique run IDs
        assert run1.runId != run2.runId
        
        # Verify both written to file
        file_path = temp_evidence_root / "agent-runs.jsonl"
        with open(file_path, "r") as f:
            lines = f.readlines()
        
        assert len(lines) == 2
        
        data1 = json.loads(lines[0])
        data2 = json.loads(lines[1])
        
        assert data1["agentId"] == "W1A"
        assert data2["agentId"] == "W1B"
    
    def test_record_wave_completion_empty_files_list(self, temp_evidence_root):
        """Test recording with no files changed."""
        run = record_wave_completion(
            wave="W1",
            agent_id="W1C",
            commit_before="x",
            commit_after="y",
            files=[],
            tests=None,
            status="completed"
        )
        
        assert run.filesChanged == []
        
        file_path = temp_evidence_root / "agent-runs.jsonl"
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["filesChanged"] == []
