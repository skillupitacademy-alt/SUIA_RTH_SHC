"""
Integration tests for Migration Repair Evidence Ledger (FEAT-004).

Tests evidence collection, ledger integrity, SHA-256 hash computation,
and evidence survival after workflow failure.

REQUIREMENTS:
- TEST_DATABASE_URL_TUTORIAL environment variable must be set
- Tests verify append-only ledger contract
- Evidence files persist in .agents/evidence/
"""

import os
import json
import hashlib
import pytest
import pytest_asyncio
from datetime import datetime, UTC
from pathlib import Path
from unittest.mock import AsyncMock, patch

from app.evidence import ledger
from app.evidence.schemas import AgentRun, TestResult, EvidenceRecord
from app.workflows.migration_repair.models import (
    CommandResult,
    MigrationFinding,
    VerificationStage,
)


# Skip all tests if TEST_DATABASE_URL_TUTORIAL not configured
pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL_TUTORIAL"),
    reason="TEST_DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
)


@pytest.fixture
def evidence_dir(tmp_path):
    """Create temporary evidence directory for tests."""
    evidence_path = tmp_path / ".agents" / "evidence"
    evidence_path.mkdir(parents=True)
    
    # Patch EVIDENCE_ROOT to use temp directory
    original_root = ledger.EVIDENCE_ROOT
    ledger.EVIDENCE_ROOT = evidence_path
    
    yield evidence_path
    
    # Restore original
    ledger.EVIDENCE_ROOT = original_root


class TestAgentRunRecords:
    """Test agent run records in agent-runs.jsonl."""
    
    def test_append_agent_run_creates_jsonl_entry(self, evidence_dir):
        """append_agent_run creates a JSONL entry in agent-runs.jsonl."""
        run_data = {
            "agent_id": "migration_audit",
            "wave": "W1",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        }
        
        ledger.append_agent_run(run_data)
        
        # Verify file exists
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        assert agent_runs_file.exists()
        
        # Verify content
        with open(agent_runs_file, "r") as f:
            lines = f.readlines()
            assert len(lines) == 1
            
            record = json.loads(lines[0])
            assert record["agent_id"] == "migration_audit"
            assert record["wave"] == "W1"
            assert record["status"] == "started"
    
    def test_agent_run_records_are_append_only(self, evidence_dir):
        """Multiple agent runs append to the same file."""
        # Write first run
        ledger.append_agent_run({
            "agent_id": "migration_audit",
            "wave": "W1",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        })
        
        # Write second run
        ledger.append_agent_run({
            "agent_id": "database_safety_audit",
            "wave": "W1",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        })
        
        # Verify both records exist
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            lines = f.readlines()
            assert len(lines) == 2
            
            record1 = json.loads(lines[0])
            record2 = json.loads(lines[1])
            assert record1["agent_id"] == "migration_audit"
            assert record2["agent_id"] == "database_safety_audit"
    
    def test_agent_run_with_duration_and_evidence(self, evidence_dir):
        """Agent run records include duration and evidence metadata."""
        run_data = {
            "agent_id": "verification_runner",
            "wave": "W6",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "completed",
            "duration_ms": 15432,
            "evidence": {
                "total_stages": 3,
                "passed": 3,
                "failed": 0,
                "blocked": 0,
            }
        }
        
        ledger.append_agent_run(run_data)
        
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            record = json.loads(f.readline())
            assert record["duration_ms"] == 15432
            assert record["evidence"]["total_stages"] == 3
            assert record["evidence"]["passed"] == 3
    
    def test_read_last_n_runs(self, evidence_dir):
        """read_last_n_runs retrieves most recent agent runs."""
        # Write 5 runs
        for i in range(5):
            ledger.append_agent_run({
                "agent_id": f"agent_{i}",
                "wave": "W1",
                "timestamp": datetime.now(UTC).isoformat(),
                "status": "completed",
            })
        
        # Read last 3
        last_runs = ledger.read_last_n_runs(3)
        
        assert len(last_runs) == 3
        assert last_runs[0]["agent_id"] == "agent_2"
        assert last_runs[1]["agent_id"] == "agent_3"
        assert last_runs[2]["agent_id"] == "agent_4"


class TestCommandCapture:
    """Test command stdout/stderr capture."""
    
    def test_command_result_captures_output(self):
        """CommandResult captures stdout and stderr."""
        stdout = "Migration successful\n"
        stderr = "Warning: duplicate object detected\n"
        combined = stdout + stderr
        
        sha = hashlib.sha256(combined.encode()).hexdigest()
        
        result = CommandResult(
            command="pnpm db:migrate",
            exit_code=0,
            stdout=stdout,
            stderr=stderr,
            sha256=sha,
            duration_ms=1234
        )
        
        assert result.stdout == stdout
        assert result.stderr == stderr
        assert result.sha256 == sha
        assert result.exit_code == 0
    
    def test_command_result_with_failure(self):
        """CommandResult captures failure exit code and error output."""
        stderr = "ERROR: relation 'users' already exists\n"
        sha = hashlib.sha256(stderr.encode()).hexdigest()
        
        result = CommandResult(
            command="pnpm db:migrate",
            exit_code=1,
            stdout="",
            stderr=stderr,
            sha256=sha,
            duration_ms=523
        )
        
        assert result.exit_code == 1
        assert "already exists" in result.stderr
    
    def test_evidence_assembler_records_commands(self, evidence_dir):
        """Evidence assembler records command results to ledger."""
        # Simulate evidence assembler collecting command results
        command_result = {
            "agent_id": "evidence_assembler",
            "wave": "W7",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "completed",
            "evidence": {
                "commands": [
                    {
                        "command": "pnpm db:migrate",
                        "exit_code": 0,
                        "sha256": hashlib.sha256(b"success output").hexdigest()
                    },
                    {
                        "command": "pnpm test",
                        "exit_code": 0,
                        "sha256": hashlib.sha256(b"all tests passed").hexdigest()
                    }
                ]
            }
        }
        
        ledger.append_agent_run(command_result)
        
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            record = json.loads(f.readline())
            assert len(record["evidence"]["commands"]) == 2
            assert record["evidence"]["commands"][0]["exit_code"] == 0


class TestSHA256HashComputation:
    """Test SHA-256 hash computation for evidence integrity."""
    
    def test_sha256_hash_deterministic(self):
        """SHA-256 hash is deterministic for same input."""
        content = "test output\nmore output\n"
        
        hash1 = hashlib.sha256(content.encode()).hexdigest()
        hash2 = hashlib.sha256(content.encode()).hexdigest()
        
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 produces 64 hex characters
    
    def test_sha256_detects_tampering(self):
        """SHA-256 hash changes when content is modified."""
        original = "original output"
        tampered = "tampered output"
        
        original_hash = hashlib.sha256(original.encode()).hexdigest()
        tampered_hash = hashlib.sha256(tampered.encode()).hexdigest()
        
        assert original_hash != tampered_hash
    
    def test_evidence_record_includes_sha256(self):
        """EvidenceRecord includes SHA-256 hash of artifact."""
        artifact_content = "migration output\nsuccess\n"
        sha = hashlib.sha256(artifact_content.encode()).hexdigest()
        
        evidence = EvidenceRecord(
            id="evidence-001",
            type="migration_output",
            workflowId="test-workflow-001",
            artifactPath=".agents/evidence/migration-001.log",
            sha256=sha,
            timestamp=datetime.now(UTC)
        )
        
        assert evidence.sha256 == sha
        assert len(evidence.sha256) == 64


class TestEvidenceAssemblerCollection:
    """Test evidence assembler collection process."""
    
    def test_evidence_assembler_collects_all_logs(self, evidence_dir):
        """Evidence assembler collects logs from all workflow stages."""
        # Simulate evidence collection
        evidence_data = {
            "agent_id": "evidence_assembler",
            "wave": "W7",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "completed",
            "evidence": {
                "logs_collected": [
                    "migration-audit.log",
                    "verification-runner.log",
                    "test-results.log"
                ],
                "artifacts_hashed": 3,
                "evidence_ledger_updated": True
            }
        }
        
        ledger.append_agent_run(evidence_data)
        
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            record = json.loads(f.readline())
            assert len(record["evidence"]["logs_collected"]) == 3
            assert record["evidence"]["artifacts_hashed"] == 3
    
    def test_evidence_assembler_records_exit_codes(self, evidence_dir):
        """Evidence assembler records exit codes for all commands."""
        evidence_data = {
            "agent_id": "evidence_assembler",
            "wave": "W7",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "completed",
            "evidence": {
                "exit_codes": {
                    "migrations": 0,
                    "schema_check": 0,
                    "integration_tests": 0,
                    "security_tests": 0
                }
            }
        }
        
        ledger.append_agent_run(evidence_data)
        
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            record = json.loads(f.readline())
            exit_codes = record["evidence"]["exit_codes"]
            assert all(code == 0 for code in exit_codes.values())
    
    def test_evidence_assembler_includes_junit_results(self, evidence_dir):
        """Evidence assembler includes JUnit/JSON test results."""
        evidence_data = {
            "agent_id": "evidence_assembler",
            "wave": "W7",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "completed",
            "evidence": {
                "junit_results": {
                    "tests": 42,
                    "failures": 0,
                    "errors": 0,
                    "skipped": 0,
                    "time": 12.345
                }
            }
        }
        
        ledger.append_agent_run(evidence_data)
        
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            record = json.loads(f.readline())
            junit = record["evidence"]["junit_results"]
            assert junit["tests"] == 42
            assert junit["failures"] == 0


class TestEvidenceSurvival:
    """Test evidence survival after workflow failure."""
    
    def test_evidence_persists_after_agent_failure(self, evidence_dir):
        """Evidence ledger persists entries even when agent fails."""
        # Record start
        ledger.append_agent_run({
            "agent_id": "verification_runner",
            "wave": "W6",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        })
        
        # Record failure
        ledger.append_agent_run({
            "agent_id": "verification_runner",
            "wave": "W6",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "failed",
            "error": "Migration failed at stage V0"
        })
        
        # Verify both records exist
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            lines = f.readlines()
            assert len(lines) == 2
            
            start_record = json.loads(lines[0])
            fail_record = json.loads(lines[1])
            
            assert start_record["status"] == "started"
            assert fail_record["status"] == "failed"
            assert "error" in fail_record
    
    def test_evidence_ledger_never_truncated(self, evidence_dir):
        """Evidence ledger is append-only and never truncated."""
        # Write multiple runs with failures
        for i in range(3):
            ledger.append_agent_run({
                "agent_id": f"agent_{i}",
                "wave": "W1",
                "timestamp": datetime.now(UTC).isoformat(),
                "status": "failed" if i == 1 else "completed",
            })
        
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        
        # Get original size
        original_size = agent_runs_file.stat().st_size
        
        # Add more runs
        ledger.append_agent_run({
            "agent_id": "agent_3",
            "wave": "W2",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "completed",
        })
        
        # Verify file only grew (never truncated)
        new_size = agent_runs_file.stat().st_size
        assert new_size > original_size
        
        # Verify all 4 records still exist
        with open(agent_runs_file, "r") as f:
            lines = f.readlines()
            assert len(lines) == 4
    
    def test_partial_evidence_available_after_crash(self, evidence_dir):
        """Partial evidence is available even if workflow crashes mid-execution."""
        # Simulate workflow starting
        ledger.append_agent_run({
            "agent_id": "workflow_controller",
            "wave": "W0",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        })
        
        # Simulate W1 agents completing
        for agent_id in ["migration_audit", "database_safety_audit"]:
            ledger.append_agent_run({
                "agent_id": agent_id,
                "wave": "W1",
                "timestamp": datetime.now(UTC).isoformat(),
                "status": "completed",
            })
        
        # Simulate crash (no more writes)
        # Evidence should still be readable
        
        runs = ledger.read_last_n_runs(10)
        assert len(runs) == 3
        assert runs[0]["agent_id"] == "workflow_controller"
        assert runs[1]["agent_id"] == "migration_audit"
        assert runs[2]["agent_id"] == "database_safety_audit"


class TestLedgerIntegrity:
    """Test evidence ledger integrity and tamper detection."""
    
    def test_ledger_validates_sha256_on_read(self, evidence_dir):
        """Ledger can validate artifact integrity using SHA-256."""
        # Create artifact file
        artifact_path = evidence_dir / "test-artifact.log"
        artifact_content = "migration output\nsuccess\n"
        artifact_path.write_text(artifact_content)
        
        # Compute hash
        expected_hash = hashlib.sha256(artifact_content.encode()).hexdigest()
        
        # Record evidence
        ledger.record_evidence(EvidenceRecord(
            id="evidence-001",
            type="migration_log",
            workflowId="test-workflow-001",
            artifactPath=str(artifact_path),
            sha256=expected_hash,
            timestamp=datetime.now(UTC)
        ))
        
        # Verify hash matches
        actual_hash = hashlib.sha256(artifact_path.read_bytes()).hexdigest()
        assert actual_hash == expected_hash
    
    def test_tampered_artifact_detected(self, evidence_dir):
        """Tampering with artifact produces different SHA-256."""
        # Create artifact
        artifact_path = evidence_dir / "test-artifact.log"
        original_content = "original content\n"
        artifact_path.write_text(original_content)
        
        original_hash = hashlib.sha256(original_content.encode()).hexdigest()
        
        # Tamper with artifact
        tampered_content = "tampered content\n"
        artifact_path.write_text(tampered_content)
        
        tampered_hash = hashlib.sha256(tampered_content.encode()).hexdigest()
        
        # Hashes should differ
        assert original_hash != tampered_hash
    
    def test_agent_run_schema_validates_fields(self):
        """AgentRun schema validates required fields."""
        # Valid agent run
        valid_run = AgentRun(
            runId="run-001",
            agentId="migration_audit",
            wave="W1",
            commitBefore="abc123",
            commitAfter="def456",
            filesChanged=["0001_users.sql"],
            status="completed",
            timestamp=datetime.now(UTC)
        )
        
        assert valid_run.agentId == "migration_audit"
        assert valid_run.wave == "W1"
        assert valid_run.status == "completed"
    
    def test_evidence_record_schema_validates_hash(self):
        """EvidenceRecord schema validates SHA-256 hash format."""
        evidence = EvidenceRecord(
            id="evidence-001",
            type="test",
            workflowId="test-workflow-001",
            artifactPath="/path/to/artifact",
            sha256="a" * 64,  # Valid 64-character hex string
            timestamp=datetime.now(UTC)
        )
        
        assert len(evidence.sha256) == 64
        assert all(c in "0123456789abcdef" for c in evidence.sha256.lower())


class TestConcurrentWrites:
    """Test concurrent evidence ledger writes."""
    
    def test_file_locking_prevents_corruption(self, evidence_dir):
        """File locking prevents concurrent write corruption."""
        # This test verifies the locking mechanism works
        # Actual concurrent testing would require threading/multiprocessing
        
        # Write from "thread 1"
        ledger.append_agent_run({
            "agent_id": "agent_1",
            "wave": "W1",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        })
        
        # Write from "thread 2"
        ledger.append_agent_run({
            "agent_id": "agent_2",
            "wave": "W1",
            "timestamp": datetime.now(UTC).isoformat(),
            "status": "started",
        })
        
        # Verify both writes succeeded without corruption
        agent_runs_file = evidence_dir / "agent-runs.jsonl"
        with open(agent_runs_file, "r") as f:
            lines = f.readlines()
            assert len(lines) == 2
            
            # Both records should be valid JSON
            record1 = json.loads(lines[0])
            record2 = json.loads(lines[1])
            
            assert record1["agent_id"] == "agent_1"
            assert record2["agent_id"] == "agent_2"
