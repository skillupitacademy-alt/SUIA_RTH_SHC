"""Tests for evidence ledger operations."""

import json
import multiprocessing
import threading
from datetime import datetime
from pathlib import Path

import pytest

from app.evidence.schemas import AgentRun, TestResult, EvidenceRecord
from app.evidence import ledger


def _multiprocess_write_worker(evidence_root: Path, process_id: int, writes_per_process: int):
    """Worker function for multiprocessing test - must be at module level for pickling."""
    # Re-apply the monkeypatch in child process
    from app.evidence import ledger
    ledger.EVIDENCE_ROOT = evidence_root
    
    for i in range(writes_per_process):
        data = {"process": process_id, "write": i}
        ledger._append_jsonl("multiprocess.jsonl", data)


@pytest.fixture
def temp_evidence_root(tmp_path, monkeypatch):
    """Mock EVIDENCE_ROOT to use temporary directory."""
    evidence_dir = tmp_path / "evidence"
    evidence_dir.mkdir()
    monkeypatch.setattr(ledger, "EVIDENCE_ROOT", evidence_dir)
    return evidence_dir


class TestJSONLAppend:
    """Tests for JSONL append operations."""
    
    def test_append_creates_file(self, temp_evidence_root):
        """Test that _append_jsonl creates file if it doesn't exist."""
        data = {"test": "value"}
        ledger._append_jsonl("test.jsonl", data)
        
        file_path = temp_evidence_root / "test.jsonl"
        assert file_path.exists()
    
    def test_append_writes_valid_json_line(self, temp_evidence_root):
        """Test that _append_jsonl writes valid JSON line."""
        data = {"key": "value", "number": 42}
        ledger._append_jsonl("test.jsonl", data)
        
        file_path = temp_evidence_root / "test.jsonl"
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        parsed = json.loads(line)
        assert parsed["key"] == "value"
        assert parsed["number"] == 42
    
    def test_append_multiple_lines(self, temp_evidence_root):
        """Test appending multiple JSON lines."""
        ledger._append_jsonl("test.jsonl", {"line": 1})
        ledger._append_jsonl("test.jsonl", {"line": 2})
        ledger._append_jsonl("test.jsonl", {"line": 3})
        
        file_path = temp_evidence_root / "test.jsonl"
        with open(file_path, "r") as f:
            lines = f.readlines()
        
        assert len(lines) == 3
        assert json.loads(lines[0])["line"] == 1
        assert json.loads(lines[1])["line"] == 2
        assert json.loads(lines[2])["line"] == 3


class TestSchemaValidation:
    """Tests for schema validation in record_* functions."""
    
    def test_record_agent_run_valid(self, temp_evidence_root):
        """Test recording valid AgentRun."""
        tests = TestResult(passed=5, failed=0, skipped=0, duration=1.5)
        now = datetime.now()
        run = AgentRun(
            runId="test-run",
            agentId="test-agent",
            wave="W1",
            commitBefore="abc123",
            commitAfter="def456",
            filesChanged=["file.py"],
            tests=tests,
            evidence=[],
            status="completed",
            timestamp=now
        )
        
        ledger.record_agent_run(run)
        
        file_path = temp_evidence_root / "agent-runs.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["runId"] == "test-run"
        assert data["agentId"] == "test-agent"
        assert data["tests"]["passed"] == 5
        assert isinstance(data["timestamp"], str)  # ISO format
    
    def test_record_test_results_valid(self, temp_evidence_root):
        """Test recording valid TestResult."""
        result = TestResult(passed=10, failed=2, skipped=1, duration=3.5)
        
        ledger.record_test_results(result)
        
        file_path = temp_evidence_root / "test-results.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["passed"] == 10
        assert data["failed"] == 2
        assert data["skipped"] == 1
        assert data["duration"] == 3.5
    
    def test_record_evidence_valid(self, temp_evidence_root):
        """Test recording valid EvidenceRecord."""
        now = datetime.now()
        evidence = EvidenceRecord(
            id="ev-001",
            type="test",
            workflowId="wf-123",
            artifactPath="/path/to/artifact",
            sha256="hash123",
            timestamp=now
        )
        
        ledger.record_evidence(evidence)
        
        file_path = temp_evidence_root / "evidence.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r") as f:
            line = f.read().strip()
        
        data = json.loads(line)
        assert data["id"] == "ev-001"
        assert data["type"] == "test"
        assert data["sha256"] == "hash123"


class TestConcurrentWrites:
    """Tests for concurrent write operations."""
    
    def test_concurrent_writes_no_corruption(self, temp_evidence_root):
        """Test that concurrent writes don't corrupt JSONL file."""
        num_threads = 10
        writes_per_thread = 5
        
        def write_records(thread_id: int):
            for i in range(writes_per_thread):
                data = {"thread": thread_id, "write": i}
                ledger._append_jsonl("concurrent.jsonl", data)
        
        threads = []
        for thread_id in range(num_threads):
            thread = threading.Thread(target=write_records, args=(thread_id,))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # Verify all lines are valid JSON
        file_path = temp_evidence_root / "concurrent.jsonl"
        with open(file_path, "r") as f:
            lines = f.readlines()
        
        assert len(lines) == num_threads * writes_per_thread
        
        # Each line should be valid JSON
        for line in lines:
            data = json.loads(line.strip())
            assert "thread" in data
            assert "write" in data
    
    def test_concurrent_agent_run_records(self, temp_evidence_root):
        """Test concurrent AgentRun recording."""
        num_threads = 5
        
        def record_run(agent_id: int):
            tests = TestResult(passed=agent_id, failed=0, skipped=0, duration=1.0)
            now = datetime.now()
            run = AgentRun(
                runId=f"run-{agent_id}",
                agentId=f"agent-{agent_id}",
                wave="W1",
                commitBefore="before",
                commitAfter="after",
                filesChanged=["file.py"],
                tests=tests,
                evidence=[],
                status="completed",
                timestamp=now
            )
            ledger.record_agent_run(run)
        
        threads = []
        for i in range(num_threads):
            thread = threading.Thread(target=record_run, args=(i,))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # Verify all records written
        file_path = temp_evidence_root / "agent-runs.jsonl"
        with open(file_path, "r") as f:
            lines = f.readlines()
        
        assert len(lines) == num_threads
        
        # Each line should be valid JSON with correct structure
        for line in lines:
            data = json.loads(line.strip())
            assert "runId" in data
            assert "agentId" in data
            assert "tests" in data
            assert "timestamp" in data
    
    def test_multiprocess_writes_no_corruption(self, temp_evidence_root):
        """Test that concurrent writes from multiple processes don't corrupt JSONL file."""
        num_processes = 5
        writes_per_process = 3
        
        processes = []
        for process_id in range(num_processes):
            process = multiprocessing.Process(
                target=_multiprocess_write_worker,
                args=(temp_evidence_root, process_id, writes_per_process)
            )
            processes.append(process)
            process.start()
        
        for process in processes:
            process.join()
        
        # Verify all lines are valid JSON and no corruption occurred
        file_path = temp_evidence_root / "multiprocess.jsonl"
        with open(file_path, "r") as f:
            lines = f.readlines()
        
        assert len(lines) == num_processes * writes_per_process
        
        # Each line should be valid JSON (no interleaved writes)
        for line in lines:
            data = json.loads(line.strip())
            assert "process" in data
            assert "write" in data


class TestEvidenceRetrieval:
    """Tests for reading evidence from JSONL files."""
    
    def test_read_last_n_runs_empty_file(self, temp_evidence_root):
        """Test reading from non-existent file."""
        runs = ledger.read_last_n_runs(5)
        assert runs == []
    
    def test_read_last_n_runs_fewer_than_n(self, temp_evidence_root):
        """Test reading when fewer runs exist than requested."""
        # Write 3 runs
        for i in range(3):
            ledger.append_agent_run({"run_id": i})
        
        runs = ledger.read_last_n_runs(5)
        assert len(runs) == 3
    
    def test_read_last_n_runs_exact(self, temp_evidence_root):
        """Test reading exact number of runs."""
        # Write 5 runs
        for i in range(5):
            ledger.append_agent_run({"run_id": i})
        
        runs = ledger.read_last_n_runs(5)
        assert len(runs) == 5
        assert runs[-1]["run_id"] == 4  # Most recent
    
    def test_read_last_n_runs_more_than_n(self, temp_evidence_root):
        """Test reading subset when more runs exist."""
        # Write 10 runs
        for i in range(10):
            ledger.append_agent_run({"run_id": i})
        
        runs = ledger.read_last_n_runs(3)
        assert len(runs) == 3
        assert runs[0]["run_id"] == 7
        assert runs[1]["run_id"] == 8
        assert runs[2]["run_id"] == 9
    
    def test_read_last_n_runs_skips_malformed(self, temp_evidence_root):
        """Test that malformed JSON lines are skipped."""
        file_path = temp_evidence_root / "agent-runs.jsonl"
        
        with open(file_path, "w") as f:
            f.write('{"run_id": 1}\n')
            f.write('invalid json line\n')  # Malformed
            f.write('{"run_id": 2}\n')
        
        runs = ledger.read_last_n_runs(10)
        assert len(runs) == 2
        assert runs[0]["run_id"] == 1
        assert runs[1]["run_id"] == 2
