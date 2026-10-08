"""
Evidence Ledger

Append-only JSONL writer for M2.9 wave-based multi-agent pipeline evidence.

CONTRACT:
- All functions append one JSON line to the appropriate ledger file
- Never truncate or modify existing content
- Never raise on JSONL parse errors in existing content
- All ledgers are machine-readable and intended for auditing
- Ledgers live in docs/project-llm/evidence/ at repo root
- File-level locking protects against multi-process concurrent writes
"""

import json
import platform
import threading
from pathlib import Path
from typing import Any, TypedDict

from .schemas import AgentRun, TestResult, EvidenceRecord

# Relative to repository root - now using .agents/evidence/
EVIDENCE_ROOT = Path(__file__).parent.parent.parent.parent.parent / ".agents" / "evidence"

# Module-level file locks for concurrency safety
_file_locks: dict[str, threading.Lock] = {}
_locks_lock = threading.Lock()

# Import platform-specific file locking
if platform.system() == "Windows":
    import msvcrt
else:
    import fcntl


def _get_file_lock(file_name: str) -> threading.Lock:
    """Get or create a lock for a specific file."""
    with _locks_lock:
        if file_name not in _file_locks:
            _file_locks[file_name] = threading.Lock()
        return _file_locks[file_name]


class EvidenceRunSchema(TypedDict, total=False):
    """
    Schema for an agent run record.
    
    Required fields:
        agent_id: Unique agent identifier (e.g., 'B01', 'F02', 'Q03')
        wave: Wave identifier (e.g., 'W0', 'W1', 'W2')
        timestamp: ISO 8601 timestamp
        status: Run status ('started', 'completed', 'failed')
    
    Optional fields:
        duration_ms: Execution duration in milliseconds
        files_modified: List of modified file paths
        tests_run: Number of tests executed
        tests_passed: Number of tests passed
        error: Error message if status is 'failed'
        commit_hash: Git commit hash if changes were committed
        evidence: Additional evidence metadata
    """
    agent_id: str
    wave: str
    timestamp: str
    status: str
    duration_ms: int
    files_modified: list[str]
    tests_run: int
    tests_passed: int
    error: str
    commit_hash: str
    evidence: dict[str, Any]


def _append_jsonl(file_name: str, data: dict[str, Any]) -> None:
    """
    Append a JSON line to the specified ledger file with concurrency safety.
    
    Uses both thread-level locks (threading.Lock) and file-level locks
    (fcntl/msvcrt) to protect against concurrent writes from multiple
    threads and multiple processes.
    
    Args:
        file_name: Name of the JSONL file in EVIDENCE_ROOT
        data: Dictionary to serialize as JSON
    """
    file_path = EVIDENCE_ROOT / file_name
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Acquire thread-level lock first
    thread_lock = _get_file_lock(file_name)
    with thread_lock:
        # Open file and acquire file-level lock for multi-process safety
        with open(file_path, "a", encoding="utf-8") as f:
            if platform.system() == "Windows":
                # Windows file locking
                msvcrt.locking(f.fileno(), msvcrt.LK_LOCK, 1)
                try:
                    f.write(json.dumps(data, ensure_ascii=False) + "\n")
                finally:
                    msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                # Unix/Linux file locking
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    f.write(json.dumps(data, ensure_ascii=False) + "\n")
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)


def append_agent_run(run: dict[str, Any]) -> None:
    """
    Append an agent run record to agent-runs.jsonl.
    
    Args:
        run: Agent run metadata (agent_id, wave, timestamp, status, etc.)
    """
    _append_jsonl("agent-runs.jsonl", run)


def append_test_result(result: dict[str, Any]) -> None:
    """
    Append a test result record to test-results.jsonl.
    
    Args:
        result: Test result metadata (suite, status, timestamp, errors, etc.)
    """
    _append_jsonl("test-results.jsonl", result)


def append_gate_result(result: dict[str, Any]) -> None:
    """
    Append a gate decision record to gate-results.jsonl.
    
    Args:
        result: Gate result metadata (gate_id, decision, timestamp, evidence, etc.)
    """
    _append_jsonl("gate-results.jsonl", result)


def append_certification_result(result: dict[str, Any]) -> None:
    """
    Append a certification result record to certification-results.jsonl.
    
    Args:
        result: Certification metadata (block_id, status, timestamp, checks, etc.)
    """
    _append_jsonl("certification-results.jsonl", result)


def append_workflow_event(event: dict[str, Any]) -> None:
    """
    Append a workflow event record to workflow-events.jsonl.
    
    Args:
        event: Workflow event metadata (event_type, state, timestamp, etc.)
    """
    _append_jsonl("workflow-events.jsonl", event)


def read_last_n_runs(n: int) -> list[dict[str, Any]]:
    """
    Read the last N agent run records from agent-runs.jsonl.
    
    Args:
        n: Number of records to read from the end
    
    Returns:
        List of agent run dictionaries (most recent last)
    """
    file_path = EVIDENCE_ROOT / "agent-runs.jsonl"
    
    if not file_path.exists():
        return []
    
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Take last N lines
    last_n_lines = lines[-n:] if len(lines) >= n else lines
    
    # Parse each line as JSON
    runs = []
    for line in last_n_lines:
        line = line.strip()
        if line:
            try:
                runs.append(json.loads(line))
            except json.JSONDecodeError:
                # Skip malformed lines (per contract: never raise on parse errors)
                continue
    
    return runs


def record_agent_run(run: AgentRun) -> None:
    """
    Record a validated agent run to agent-runs.jsonl.
    
    Args:
        run: AgentRun schema instance with validated fields
    """
    _append_jsonl("agent-runs.jsonl", run.model_dump(mode="json"))


def record_test_results(results: TestResult) -> None:
    """
    Record validated test results to test-results.jsonl.
    
    Args:
        results: TestResult schema instance with validated fields
    """
    _append_jsonl("test-results.jsonl", results.model_dump(mode="json"))


def record_evidence(evidence: EvidenceRecord) -> None:
    """
    Record a validated evidence artifact to evidence.jsonl.
    
    Args:
        evidence: EvidenceRecord schema instance with validated fields
    """
    _append_jsonl("evidence.jsonl", evidence.model_dump(mode="json"))

