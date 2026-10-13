# Evidence Data Quality Notes

**Last Updated**: 2026-10-08 (M2.9 R0)

## agent-runs.jsonl W2 Duplicate Entries

### Issue

Lines recording W2 agent runs between 2026-10-08T17:03:01 and 2026-10-08T17:05:03 have:
- `filesChanged: []` (empty array, no files changed)
- `tests: null` (no test results)
- `commitBefore` == `commitAfter` (no actual git changes)
- `status: "completed"` (claims completion despite no work)

Example:
```json
{
  "runId": "w2-engineering-contract-225682bb-bf66-4c5f-8611-eba9cd64afda",
  "agentId": "W2",
  "wave": "W2",
  "commitBefore": "3051a540a2a624c0d5bec8acff5428610bfe4c64",
  "commitAfter": "3051a540a2a624c0d5bec8acff5428610bfe4c64",
  "filesChanged": [],
  "tests": null,
  "evidence": [],
  "status": "completed",
  "timestamp": "2026-10-08T17:03:01.927070Z"
}
```

### Count

40+ spurious entries were written in a 2-minute window.

### Root Cause

Evidence recording bug during batch W2 execution. These entries appear to be from a loop that recorded evidence events without actual work being performed.

### Canonical Source

The accurate W2 implementation evidence is in:
- **Structured report**: `.agents/tasks/w2-engineering-contract-report.json`
  - Real commit: `24e6d7b3` (after review fixes)
  - Real files changed: 5 files (contract.py, engineering_contract.py, pyproject.toml, test files)
  - Real tests: 46 unit passed + 9 integration passed = 55 total passed, 0 failed
- **Git commits**:
  - `3051a540` — W2 implementation
  - `24e6d7b3` — W2 review fixes

### Resolution

Per append-only ledger contract, these entries **cannot be removed**. Consumers should:
1. **Prefer structured reports** in `.agents/tasks/w*-report.json` over raw JSONL for authoritative evidence
2. **Filter spurious entries** by checking `filesChanged` is non-empty OR `tests` is non-null
3. **Use the evidence.jsonl** canonical ledger (R0+) for verified evidence with hash chains

### Impact

- **Low**: Spurious entries do not affect W2 completion verdict (APPROVED)
- **Cosmetic**: JSONL ledger is cluttered but git history and structured reports are authoritative
- **Mitigated**: R0 introduces `CanonicalEvidenceStore` with strict validation to prevent this in future waves

---

## Evidence Location History

### Current Canonical Location

**`.agents/evidence/`** (since Wave 1D, commit 7af488f9)

Python implementation reference:
```python
# services/project-ai/app/evidence/ledger.py line 18
EVIDENCE_ROOT = Path(__file__).parent.parent.parent.parent.parent / ".agents" / "evidence"
```

### Deprecated Location

**`docs/project-llm/evidence-deprecated-20261008/`** (archived 2026-10-08)

This was the original evidence location from early M2.9 development. It was superseded by `.agents/evidence/` when the evidence harness was refactored in Wave 1D.

**Do not use the deprecated location**. It has only 4 entries in agent-runs.jsonl and stops at 2026-10-07.

---

## Evidence Contract

### Append-Only Ledger

1. **Never truncate or modify existing entries** — once written, evidence is immutable
2. **Never raise on JSONL parse errors** — skip malformed lines gracefully
3. **Concurrency-safe writes** — thread-level + file-level locking (fcntl on Unix, msvcrt on Windows)
4. **UTC timestamps** — all timestamps must be timezone-aware and in UTC

### R0+ Enhanced Contract

Starting with R0 (Evidence Authority Reconciliation), the `CanonicalEvidenceStore` adds:
1. **SHA-256 hash chains** — each evidence event has a computed hash for tamper detection
2. **Strict validation** — reject invalid data at write time (tests cannot be null, timestamps must be UTC)
3. **Duplicate detection** — reject duplicate `evidence_id` values
4. **Verification API** — `verify_chain()` checks evidence integrity

---

## Quality Guidelines for Future Waves

To avoid data quality issues like the W2 spurious entries:

1. **Record evidence ONLY for actual work** — do not record "completed" status unless files changed OR tests ran
2. **Use real commit SHAs** — never use placeholder or repeated SHAs (commitBefore == commitAfter should be rare)
3. **Include test results** — if tests were run, populate the `tests` field with real counts
4. **Use CanonicalEvidenceStore** (R0+) — the R0 evidence system enforces these rules at write time
5. **Verify before committing** — run `store.verify_chain(workflow_id)` to check evidence integrity

---

**References**:
- Evidence audit: `.agents/tasks/r0-evidence-audit.md`
- Evidence system documentation: `.agents/evidence/README.md`
- R0 implementation: `services/project-ai/app/evidence/canonical_evidence.py`
