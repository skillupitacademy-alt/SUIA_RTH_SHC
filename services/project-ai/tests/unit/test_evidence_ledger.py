"""
Integration tests for Evidence Ledger

Tests the JSONL append-only evidence logging system.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from app.evidence import ledger


@pytest.fixture
def temp_evidence_root(tmp_path):
    """Create a temporary evidence directory for testing."""
    evidence_dir = tmp_path / "evidence"
    evidence_dir.mkdir()
    return evidence_dir


@pytest.fixture(autouse=True)
def mock_evidence_root(temp_evidence_root):
    """Mock the EVIDENCE_ROOT to use temp directory."""
    with patch.object(ledger, "EVIDENCE_ROOT", temp_evidence_root):
        yield temp_evidence_root


class TestAppendAgentRun:
    """Tests for append_agent_run function."""
    
    def test_writes_to_correct_file(self, temp_evidence_root):
        """Test that append_agent_run writes to agent-runs.jsonl."""
        run = {
            "agent_id": "B01",
            "wave": "W0",
            "timestamp": "2025-01-07T10:00:00Z",
            "status": "completed"
        }
        
        ledger.append_agent_run(run)
        
        file_path = temp_evidence_root / "agent-runs.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        assert json.loads(content.strip()) == run
    
    def test_multiple_appends_produce_multiple_lines(self, temp_evidence_root):
        """Test that multiple appends create multiple lines."""
        runs = [
            {"agent_id": "B01", "wave": "W0", "status": "started"},
            {"agent_id": "B01", "wave": "W0", "status": "completed"},
            {"agent_id": "B14", "wave": "W1", "status": "started"},
        ]
        
        for run in runs:
            ledger.append_agent_run(run)
        
        file_path = temp_evidence_root / "agent-runs.jsonl"
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        assert len(lines) == 3
        
        for i, line in enumerate(lines):
            assert json.loads(line.strip()) == runs[i]
    
    def test_existing_content_not_truncated(self, temp_evidence_root):
        """Test that appending does not truncate existing content."""
        file_path = temp_evidence_root / "agent-runs.jsonl"
        
        # Write initial content
        existing_run = {"agent_id": "B00", "wave": "W-1", "status": "legacy"}
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(existing_run) + "\n")
        
        # Append new content
        new_run = {"agent_id": "B01", "wave": "W0", "status": "completed"}
        ledger.append_agent_run(new_run)
        
        # Verify both lines exist
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        assert len(lines) == 2
        assert json.loads(lines[0].strip()) == existing_run
        assert json.loads(lines[1].strip()) == new_run


class TestAppendWorkflowEvent:
    """Tests for append_workflow_event function."""
    
    def test_writes_to_correct_file(self, temp_evidence_root):
        """Test that append_workflow_event writes to workflow-events.jsonl."""
        event = {
            "event_type": "state_transition",
            "from_state": "REQUESTED",
            "to_state": "DISCOVERY",
            "timestamp": "2025-01-07T10:00:00Z"
        }
        
        ledger.append_workflow_event(event)
        
        file_path = temp_evidence_root / "workflow-events.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        assert json.loads(content.strip()) == event


class TestReadLastNRuns:
    """Tests for read_last_n_runs function."""
    
    def test_returns_empty_list_when_file_missing(self, temp_evidence_root):
        """Test that read_last_n_runs returns empty list if file doesn't exist."""
        result = ledger.read_last_n_runs(5)
        assert result == []
    
    def test_returns_correct_number_of_records(self, temp_evidence_root):
        """Test that read_last_n_runs returns the correct number of records."""
        # Write 5 runs
        runs = [
            {"agent_id": f"B{i:02d}", "wave": "W0", "status": "completed"}
            for i in range(5)
        ]
        
        for run in runs:
            ledger.append_agent_run(run)
        
        # Read last 3
        result = ledger.read_last_n_runs(3)
        
        assert len(result) == 3
        assert result == runs[-3:]
    
    def test_returns_all_records_if_n_larger_than_file(self, temp_evidence_root):
        """Test that read_last_n_runs returns all records if n > file length."""
        runs = [
            {"agent_id": "B01", "wave": "W0", "status": "completed"},
            {"agent_id": "B14", "wave": "W1", "status": "completed"},
        ]
        
        for run in runs:
            ledger.append_agent_run(run)
        
        result = ledger.read_last_n_runs(10)
        
        assert len(result) == 2
        assert result == runs
    
    def test_skips_malformed_lines(self, temp_evidence_root):
        """Test that read_last_n_runs skips malformed JSON lines."""
        file_path = temp_evidence_root / "agent-runs.jsonl"
        
        # Write mix of valid and invalid lines
        with open(file_path, "w", encoding="utf-8") as f:
            f.write('{"agent_id": "B01", "wave": "W0"}\n')
            f.write('not valid json\n')
            f.write('{"agent_id": "B14", "wave": "W1"}\n')
            f.write('\n')  # Empty line
            f.write('{"agent_id": "B02", "wave": "W2"}\n')
        
        result = ledger.read_last_n_runs(10)
        
        # Should return only 3 valid records
        assert len(result) == 3
        assert result[0]["agent_id"] == "B01"
        assert result[1]["agent_id"] == "B14"
        assert result[2]["agent_id"] == "B02"


class TestOtherAppendFunctions:
    """Tests for other append functions (test_result, gate_result, certification_result)."""
    
    def test_append_test_result(self, temp_evidence_root):
        """Test that append_test_result writes to test-results.jsonl."""
        result = {
            "suite": "backend_unit",
            "status": "passed",
            "tests_run": 42,
            "timestamp": "2025-01-07T10:00:00Z"
        }
        
        ledger.append_test_result(result)
        
        file_path = temp_evidence_root / "test-results.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        assert json.loads(content.strip()) == result
    
    def test_append_gate_result(self, temp_evidence_root):
        """Test that append_gate_result writes to gate-results.jsonl."""
        result = {
            "gate_id": "GATE_1",
            "decision": "approved",
            "timestamp": "2025-01-07T10:00:00Z"
        }
        
        ledger.append_gate_result(result)
        
        file_path = temp_evidence_root / "gate-results.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        assert json.loads(content.strip()) == result
    
    def test_append_certification_result(self, temp_evidence_root):
        """Test that append_certification_result writes to certification-results.jsonl."""
        result = {
            "block_id": "BLK_001",
            "status": "certified",
            "timestamp": "2025-01-07T10:00:00Z"
        }
        
        ledger.append_certification_result(result)
        
        file_path = temp_evidence_root / "certification-results.jsonl"
        assert file_path.exists()
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        assert json.loads(content.strip()) == result


class TestEvidenceRunSchema:
    """Tests for EvidenceRunSchema type definition."""
    
    def test_schema_accepts_all_fields(self):
        """Test that EvidenceRunSchema accepts all expected fields."""
        # This is primarily a type-checking test
        # At runtime, TypedDict doesn't enforce, but we verify it's properly defined
        
        full_run: ledger.EvidenceRunSchema = {
            "agent_id": "B01",
            "wave": "W0",
            "timestamp": "2025-01-07T10:00:00Z",
            "status": "completed",
            "duration_ms": 1234,
            "files_modified": ["file1.py", "file2.py"],
            "tests_run": 10,
            "tests_passed": 10,
            "error": "",
            "commit_hash": "abc123",
            "evidence": {"key": "value"}
        }
        
        # Should not raise any errors
        ledger.append_agent_run(full_run)
    
    def test_schema_accepts_minimal_fields(self):
        """Test that EvidenceRunSchema accepts minimal required fields."""
        minimal_run: ledger.EvidenceRunSchema = {
            "agent_id": "B01",
            "wave": "W0",
            "timestamp": "2025-01-07T10:00:00Z",
            "status": "started"
        }
        
        # Should not raise any errors
        ledger.append_agent_run(minimal_run)
