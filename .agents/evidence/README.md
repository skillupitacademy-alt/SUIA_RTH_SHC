# Canonical Evidence System

**Location**: `.agents/evidence/`  
**Status**: CANONICAL (since Wave 1D, commit 7af488f9)  
**Updated**: 2026-10-08 (M2.9 R0 — Evidence Authority Reconciliation)

This directory contains the **single source of truth** for M2.9 wave-based multi-agent pipeline evidence.

---

## Directory Contents

All evidence is recorded as append-only JSONL files:

- **`agent-runs.jsonl`** — Agent execution records (Wave 3-6 legacy format)
- **`test-results.jsonl`** — Test suite results
- **`gate-results.jsonl`** — Gate decisions (GATE_1, GATE_2)
- **`certification-results.jsonl`** — Certification outcomes
- **`workflow-events.jsonl`** — Workflow state transitions
- **`evidence.jsonl`** — **Canonical evidence events (R0+)** with SHA-256 hash chains

---

## Python API

### Low-Level Ledger API (Wave 1D)

```python
from app.evidence import ledger

# Append raw evidence
ledger.append_agent_run(run_data)
ledger.append_test_result(result_data)
ledger.append_gate_result(gate_data)

# Read evidence
last_10_runs = ledger.read_last_n_runs(10)
```

### High-Level API (Wave 1D)

```python
from app.evidence import record_wave_completion, TestResult

# Record wave completion
record_wave_completion(
    wave="W1A",
    agent_id="W1A-TargetBinding",
    commit_before="abc123",
    commit_after="def456",
    files=["file1.py", "file2.py"],
    tests=TestResult(passed=10, failed=0, skipped=0, duration=5.2),
    status="completed"
)
```

### Canonical Evidence Store (R0+)

```python
from app.evidence import CanonicalEvidenceStore, EvidenceEvent, TestSummary
from datetime import datetime, timezone

# Initialize store
store = CanonicalEvidenceStore()

# Create evidence event
event = EvidenceEvent(
    evidence_id="r0-evidence-001",
    workflow_id="r0-remediation",
    agent_id="R0",
    wave="R0",
    repository="quiz-platform",
    branch="m2-project-ai-canonical-wiring",
    base_sha="f589c0b3",
    final_sha="abc1234",
    timestamp_utc=datetime.now(timezone.utc),
    event_type="wave_completion",
    status="PASS",
    files_changed=["file1.py", "file2.py"],
    tests=TestSummary(passed=10, failed=0, skipped=0)
)

# Append to ledger (computes SHA-256 hash)
evidence_hash = store.append(event)

# Retrieve evidence
retrieved = store.get("r0-evidence-001")

# List all evidence for a workflow
events = store.list_for_workflow("r0-remediation")

# Verify evidence integrity
verification = store.verify_chain("r0-remediation")
assert verification.chain_valid  # True if no tampering detected
```

---

## Evidence Contract

### Append-Only Ledger

1. **Never truncate or modify existing entries** — evidence is immutable once written
2. **Machine-readable** — all files are valid JSONL (one JSON object per line)
3. **Concurrency-safe** — file-level locking (fcntl on Unix, msvcrt on Windows) protects against multi-process writes
4. **Timezone-aware** — all timestamps use UTC (ISO 8601 format)

### R0+ Canonical Evidence Contract

Starting with R0, the `CanonicalEvidenceStore` enforces:

1. **SHA-256 hash chains** — each event has a computed hash for tamper detection
2. **Strict validation**:
   - Tests cannot be null (use `TestSummary(passed=0, failed=0)` if no tests)
   - Timestamps must be UTC-aware (use `datetime.now(timezone.utc)`)
   - `workflow_id`, `agent_id`, `wave`, `branch` cannot be empty
   - Commit SHAs must be at least 7 characters
3. **Duplicate detection** — `evidence_id` must be unique
4. **Verification API** — `verify_chain()` detects hash tampering and missing fields

---

## Structured Reports

In addition to raw JSONL, canonical evidence for each wave is recorded in **structured JSON reports** in `.agents/tasks/`:

- `w0-architecture-freeze-report.json`
- `w1a-target-binding-report.json`
- `w1b-repository-intelligence-report.json`
- `w1c-legacy-cleanup-report.json`
- `w1d-evidence-harness-report.json`
- `w2-engineering-contract-report.json`

**When in doubt, prefer structured reports over raw JSONL for authoritative evidence.**

See `.agents/evidence/DATA_QUALITY.md` for known issues with JSONL entries (e.g., W2 spurious entries).

---

## History

- **Early M2.9**: Evidence location was `docs/project-llm/evidence/`
- **Wave 1D (commit 7af488f9)**: Evidence harness refactored to use `.agents/evidence/` as canonical location
- **2026-10-08 (R0)**: Evidence authority reconciliation — deprecated location archived, `CanonicalEvidenceStore` created

---

## References

- **Evidence audit**: `.agents/tasks/r0-evidence-audit.md`
- **Data quality notes**: `.agents/evidence/DATA_QUALITY.md`
- **R0 canonical store**: `services/project-ai/app/evidence/canonical_evidence.py`
- **Status document**: `docs/project-llm/canonical-implementation-status.md`

---

**Evidence authority is now unambiguous**: `.agents/evidence/` is the single source of truth.
