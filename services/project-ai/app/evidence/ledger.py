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
from typing import Any

# Relative to repository root
EVIDENCE_ROOT = Path(__file__).parent.parent.parent.parent.parent / "docs" / "project-llm" / "evidence"


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
