# Evidence harness for M2.9 Wave 1D

Adds append-only JSONL evidence ledger with Pydantic schemas, concurrency-safe writers, and integration helpers for wave agents. The implementation provides thread and multi-process safety through dual locking (threading.Lock + platform-specific file locks), validates all records through Pydantic models, and includes a convenience wrapper for wave completion recording.

**Watch for:** Windows 1MB locking limitation is documented but not enforced until write time (confirmed). Commit message doesn't match expected format `feat(project-llm): add evidence harness` — it's `feat(m2.9/W1/B14): extend evidence harness + canonical docs` which indicates this was an extension rather than the initial implementation (confirmed).

**Verdict**: NEEDS_CHANGES

## High-level view

The evidence ledger uses a two-tier locking strategy: thread locks prevent in-process races, and file locks (fcntl on Unix, msvcrt on Windows) prevent cross-process corruption. Windows file locking has a hard 1MB limit per lock call, which the code validates at write time but doesn't prevent at construction time. The Pydantic schemas enforce field types and required/optional distinctions correctly, with datetime fields using timezone-aware timestamps after review fixes. Test coverage spans schema validation, JSONL append operations, concurrent writes (both threaded and multiprocess), and retrieval functions. The integration helper generates unique run IDs and records wave completions with UTC timestamps. Prior review passes caught and fixed Windows locking byte count, timezone-naive datetimes, scope creep in __init__.py exports, and missing multiprocess tests.

<details>
<summary>Issues (2)</summary>

1. **Commit message mismatch** — Expected `feat(project-llm): add evidence harness` but found `feat(m2.9/W1/B14): extend evidence harness + canonical docs`. Verify the implementation completeness or adjust expectations to match the "extend" framing.
2. **Windows 1MB size check timing** — The 1MB validation happens at write time in `_append_jsonl`, but a caller could construct an oversized record and only discover the issue when writing. Consider adding a validator to the Pydantic models or documenting this as accepted risk.

</details>

<details>
<summary>Details</summary>

## Pydantic schema correctness

The `AgentRun.status` field documents expected values as a string ("completed", "failed", "in-progress") but doesn't enforce them with an enum or Literal type. The field is informational and the ledger never queries on it, so the loose typing is acceptable for W1D scope.

Timestamps use `datetime` without timezone constraints in the model, but `integration.py` constructs them with `datetime.now(timezone.utc)` after a review fix. This asymmetry means the schema would accept timezone-naive datetimes if called directly, but the integration helper enforces UTC. The prior review pass fixed the helper but didn't add a validator to the schema. Since direct schema usage is internal-only, the gap is acceptable for W1D.

## Concurrency safety and locking strategy

The ledger protects concurrent writes with two layers: thread-level locks (one per file name, managed by `_get_file_lock`) and file-level locks (fcntl.flock on Unix, msvcrt.locking on Windows).

On Unix, `fcntl.flock(fd, LOCK_EX)` locks the entire file descriptor. On Windows, `msvcrt.locking(fd, LK_LOCK, 1024*1024)` locks exactly 1MB starting from the current file position. The code validates at write time: if a serialized JSON line exceeds 1MB on Windows, `_append_jsonl` raises ValueError before acquiring the lock. The validation happens after serialization, so the caller doesn't know until write time whether a record is too large.

The 1MB limit is unlikely to be hit in practice (typical agent run records are a few KB), but the gap between "construct a valid Pydantic model" and "fail to write it" could surprise callers. The code documents the limitation in a docstring comment and in the evidence report, but doesn't enforce it at the Pydantic layer.

The multiprocess concurrency test (`test_multiprocess_writes_no_corruption`) was added in a prior review pass after the initial implementation used only threading locks.

## Test coverage completeness

Four test files cover the evidence harness:

- `test_schemas.py`: Pydantic validation (valid models, missing fields, serialization). Covers nested models (TestResult inside AgentRun, EvidenceRecord list inside AgentRun). **Not tested:** timezone-aware vs timezone-naive datetimes, AgentRun.status value constraints (no enum enforcement), field description metadata.

- `test_ledger.py`: JSONL append, schema-based recording, concurrent writes, retrieval. Tests `_append_jsonl` (file creation, valid JSON line, multiple appends), `record_agent_run`/`record_test_results`/`record_evidence` (schema validation integration), threaded concurrency (10 threads × 5 writes), multiprocess concurrency (5 processes × 3 writes), and `read_last_n_runs` (empty file, fewer than N, exact N, more than N, malformed line skipping). **Not tested:** Windows-specific 1MB limit enforcement (would require mocking platform.system or a 1MB+ payload), file lock contention timing, behavior when EVIDENCE_ROOT is unwritable.

- `test_integration.py`: Wave completion recording via `record_wave_completion`. Tests with and without TestResult, with failed status, multiple calls (verifying unique run IDs), empty files list. **Not tested:** exception propagation when ledger write fails, run ID collision (uses uuid4 so astronomically unlikely), logger output.

- **No tests for** `append_test_result`, `append_gate_result`, `append_certification_result`, `append_workflow_event` (the untyped dict-based append functions). These are lower-level than the schema-based `record_*` functions and are likely legacy or intended for later waves. Their absence from tests is acceptable for W1D since the schema-based functions are the public API.

All four test categories from the review brief are covered: append (test_ledger.py TestJSONLAppend), schema validation (test_schemas.py), retrieval (test_ledger.py TestEvidenceRetrieval), concurrent writes (test_ledger.py TestConcurrentWrites including multiprocess).

## Evidence report and commit history

The W1D evidence report at `.agents/tasks/w1d-evidence-harness-report.json` documents 5 review findings from prior passes (Windows locking byte count, missing multiprocess test, __init__.py scope creep, timezone-naive datetime, Windows locking asymmetry docs). The report shows 40 tests passed, 0 failed, but doesn't list all files introduced in the original implementation—it focuses on review fix iterations.

The commit referenced as the latest (7af488f9) has message `fix(project-llm): address W1D review findings - scope, timezone, locking docs`, which is a fix commit. The original evidence harness commit is 2c511329 (`feat(m2.9/W1/B14): extend evidence harness + canonical docs`), which modified only `ledger.py` and `test_evidence_ledger.py`. The schemas, integration helper, and __init__.py were added elsewhere. The evidence module didn't exist on main, so this is the first introduction.

The review brief expects commit message `feat(project-llm): add evidence harness`. The actual commit uses `feat(m2.9/W1/B14): extend evidence harness + canonical docs`, which says "extend" rather than "add". This is a documentation mismatch, not a code issue, but could confuse reviewers expecting the exact format.

</details>

---

<details>
<summary>File map</summary>

**services/project-ai/app/evidence/schemas.py** — Pydantic models (TestResult, EvidenceRecord, AgentRun)  
**services/project-ai/app/evidence/ledger.py** — JSONL append with threading + file locks, schema-based record_* functions, retrieval  
**services/project-ai/app/evidence/integration.py** — record_wave_completion helper with UUID run ID generation  
**services/project-ai/app/evidence/__init__.py** — Public API exports (schemas, integration, ledger functions)  
**services/project-ai/tests/evidence/__init__.py** — Test module marker  
**services/project-ai/tests/evidence/test_schemas.py** — Schema validation tests (17 test cases)  
**services/project-ai/tests/evidence/test_ledger.py** — JSONL append, concurrency, retrieval tests (16 test cases)  
**services/project-ai/tests/evidence/test_integration.py** — Wave completion helper tests (7 test cases)  
**.agents/evidence/agent-runs.jsonl** — Evidence ledger file (append-only, 4 pre-existing records from other waves)  
**.agents/evidence/evidence.jsonl** — Empty placeholder  
**.agents/evidence/gate-results.jsonl** — Empty placeholder  
**.agents/evidence/test-results.jsonl** — Empty placeholder  

Full diff: `git diff main`

</details>
