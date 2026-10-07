"""
Evidence Ledger

Append-only JSONL writer for M2.9 wave-based multi-agent pipeline evidence.

CONTRACT:
- All functions append one JSON line to the appropriate ledger file
- Never truncate or modify existing content
- Never raise on JSONL parse errors in existing content
- All ledgers are machine-readable and intended for auditing
- Ledgers live in docs/project-llm/evidence/ at repo root
"""

import json
from pathlib import Path
from typing import Any, TypedDict

# Relative to repository root
EVIDENCE_ROOT = Path(__file__).parent.parent.parent.parent.parent / "docs" / "project-llm" / "evidence"


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
    Append a JSON line to the specified ledger file.
    
    Args:
        file_name: Name of the JSONL file in EVIDENCE_ROOT
        data: Dictionary to serialize as JSON
    """
    file_path = EVIDENCE_ROOT / file_name
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False) + "\n")


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
