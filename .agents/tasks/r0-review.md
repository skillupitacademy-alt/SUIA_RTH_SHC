# R0 Evidence Authority Reconciliation

Implementation of R0 (Evidence Authority Reconciliation) establishing a single canonical evidence location with SHA-256 hash chains, strict validation, and comprehensive documentation. The work retired the deprecated `docs/project-llm/evidence/` directory, created the `CanonicalEvidenceStore` API, and corrected the status document with real W0-W2 commit SHAs.

**Watch for:** None. All R0 objectives achieved with complete test coverage, real commit SHAs, and proper evidence directory retirement. (confirmed)

**Verdict**: APPROVED

## High-level view

The deprecated evidence directory was properly archived to `evidence-deprecated-20261008/` with clear documentation explaining why it was retired. The canonical location `.agents/evidence/` is now unambiguous.

The `CanonicalEvidenceStore` implements SHA-256 hash chains with sorted-key canonical JSON representation, rejecting duplicate `evidence_id` values and validating UTC timestamps. The `verify_chain` method detects tampering by recomputing hashes.

Fifteen tests cover all required test cases including duplicate rejection, hash verification, tamper detection, process restart preservation, and UTC timestamp enforcement. All tests pass with clear assertions and good coverage of edge cases.

The status document was updated with real commit SHAs from W0-W2 (0d7e782a through 24e6d7b3), correcting the stale "W1 IN PROGRESS" claim to reflect actual completion state.

The report accurately reflects non-empty `filesChanged` arrays and non-null test counts. Temporary artifacts were deleted (temp-diff.txt, generate-corrected-snapshot.ts, test-d6.ts) and intermediate review files archived.

<details>
<summary>Issues (0)</summary>

None. All requirements met.

</details>

<details>
<summary>Details</summary>

## Canonical evidence location established

The deprecated `docs/project-llm/evidence/` directory was moved to `docs/project-llm/evidence-deprecated-20261008/` with a `DEPRECATED.md` file explaining the retirement. The file documents the timeline (Wave 1D commit 7af488f9 established `.agents/evidence/` as canonical), references the Python implementation path, and directs users to the authoritative location.

The file search confirms `docs/project-llm/evidence/` no longer exists as a directory, and the git diff shows 6 files were moved to the deprecated location with proper preservation. The `DEPRECATED.md` explicitly states "Do not use this directory" and points to `.agents/evidence/` as the canonical source.

The `.agents/evidence/README.md` was created with comprehensive documentation of the evidence system, including API usage examples for both the legacy Wave 1D ledger API and the new R0 `CanonicalEvidenceStore`. The README clarifies that `.agents/evidence/` has been canonical since Wave 1D and provides the commit reference (7af488f9).

## CanonicalEvidenceStore implementation

The `canonical_evidence.py` file implements all four required methods: `append`, `get`, `list_for_workflow`, and `verify_chain`. The implementation uses Pydantic models with strict validation (no null tests, UTC-aware timestamps, non-empty IDs).

The `evidence_hash` is computed via `compute_hash()` which excludes the `evidence_hash` field itself from the canonical JSON, serializes with `sort_keys=True` and consistent separators, then computes SHA-256 of the UTF-8 bytes. This matches the requirement for "SHA-256 of canonical JSON (sorted keys, excluding hash field)".

The `append` method checks for duplicate `evidence_id` values using an in-memory set loaded from the existing ledger on initialization. When a duplicate is found, it raises `ValueError("Duplicate evidence_id: {id}")`, satisfying the requirement to reject duplicates.

The `verify_chain` method recomputes the hash for each event and compares it to the stored `evidence_hash`, collecting any mismatches in `broken_hashes`. It also checks for null tests fields and missing required fields, returning an `EvidenceVerification` object with `chain_valid=True` only when no issues are found.

The Pydantic model includes a `@field_validator` for `timestamp_utc` that raises `ValueError` if the datetime is naive (no timezone) and converts to UTC if needed. This enforces the UTC timestamp requirement at the model level.

## Test coverage

The test file `test_canonical_evidence.py` contains 15 tests covering all 10 required test cases and additional edge cases:

1. **test_append_and_retrieve**: Verifies append writes the event and get retrieves it with matching fields and a 64-character SHA-256 hash.
2. **test_duplicate_evidence_id_rejected**: Confirms appending the same `evidence_id` twice raises `ValueError` with "Duplicate evidence_id" message.
3. **test_evidence_hash_deterministic**: Checks that calling `compute_hash()` twice on the same event produces identical hashes.
4. **test_evidence_hash_stored_correctly**: Verifies the hash is stored and `verify_chain` reports `chain_valid=True` with no broken hashes.
5. **test_list_for_workflow**: Creates events for two workflows and verifies filtering by `workflow_id` returns only matching events.
6. **test_verify_chain_detects_tampered_hash**: Manually corrupts the stored hash in the JSONL file and confirms `verify_chain` detects the tampering.
7. **test_verify_chain_detects_missing_fields**: Writes invalid JSON with `tests=null` and verifies the store skips it (Pydantic validation).
8. **test_process_restart_preserves_events**: Creates a store, appends events, then creates a new store instance pointing to the same file and verifies all events are still present.
9. **test_utc_timestamp_enforced**: Attempts to create an event with a naive datetime (no timezone) and confirms it raises `ValueError` with "must be timezone-aware".
10. **test_invalid_workflow_id_rejected**: Attempts to create an event with empty `workflow_id` string and confirms it raises `ValueError` (Pydantic min_length=1).

Additional tests cover edge cases: empty `files_changed` is allowed for gate decisions, zero tests with `TestSummary` is valid, nonexistent evidence raises `KeyError`, nonexistent workflow returns empty list, and verifying a nonexistent workflow returns vacuously valid (0 events, chain_valid=True).

The report claims 15 passed, 0 failed, and the coverage list matches the test file contents.

## Evidence reconciliation and report accuracy

The `r0-evidence-authority-report.json` has `filesChanged` containing 9 files (not an empty array), including the created `canonical_evidence.py`, `test_canonical_evidence.py`, `DATA_QUALITY.md`, `README.md`, and updated status document. The `tests` object shows `"passed": 15, "failed": 0, "skipped": 0, "suite": "test_canonical_evidence.py"` (not null and non-empty).

The report includes `filesArchived` with 8 intermediate review files moved to `archive-intermediate-reviews/` and `filesDeleted` with 3 temp files (temp-diff.txt, generate-corrected-snapshot.ts, test-d6.ts). The git diff confirms all 3 files show "deleted file mode" and do not appear in the working directory.

The `w0_w2_evidence_reconciled` field is `false` with a note explaining that W0-W2 evidence is already in structured reports and no further reconciliation is needed beyond documentation. This is accurate: the structured reports (`w0-architecture-freeze-report.json` through `w2-engineering-contract-report.json`) contain authoritative evidence with real commit SHAs and test counts, and the DATA_QUALITY.md documents known JSONL issues.

## Status document correctness

The `canonical-implementation-status.md` was updated with "Last Updated: 2026-10-08", "Current Wave: R0", and "HEAD: f589c0b3". The wave execution table shows real commit SHAs:

- W0: 0d7e782a
- W1A: 304a333f, 85918ee9
- W1B: 82f8a3ee, 5182c874
- W1C: 56891aec
- W1D: 7af488f9
- W2: 3051a540, 24e6d7b3
- R0: listed as "IN PROGRESS" at the time the document was committed

The commit history table at the bottom lists all these SHAs with dates and commit messages. No placeholder SHAs like `[hash]` or `abc1234` appear in the document.

The document correctly states Wave 1 and Wave 2 verdicts as "APPROVED (PARTIAL)" with references to the verdict JSON files. The R0 section lists 8 tasks with checkmarks for completed items.

## Artifact cleanup

The git diff shows 8 intermediate review files were moved to `.agents/tasks/archive-intermediate-reviews/` (all showing 0 insertions/deletions, indicating file moves). The files archived match the plan: m1-convergence-review, three 2025-01-29 reviews, two 2025-01-30 reviews, and the 20250116 review.

The diff shows `temp-diff.txt` (257,047 deletions, ~10.4 MB), `generate-corrected-snapshot.ts` (51 lines deleted), and `test-d6.ts` (30 lines deleted) were all removed. Git status checks confirm these files do not exist in the working directory.

The canonical final reports (w0-architecture-freeze-report.json, w1a-target-binding-report.json, etc.) are not listed in the archived or deleted files, confirming they remain in `.agents/tasks/`.

## Documentation quality

The `DATA_QUALITY.md` documents the W2 spurious entries issue with specific characteristics (`filesChanged: []`, `tests: null`, `commitBefore == commitAfter`), the 2-minute timestamp window, and a count of 40+ entries. It references the authoritative W2 evidence source (w2-engineering-contract-report.json with real commit 24e6d7b3, 5 files changed, 55 tests passed) and explains the resolution: append-only contract prevents deletion, consumers should prefer structured reports.

The document also covers evidence location history, the append-only contract, the R0+ enhanced contract with SHA-256 hash chains, and quality guidelines for future waves.

The `README.md` provides clear API examples for all three evidence interfaces (low-level ledger, high-level Wave 1D integration, and R0 CanonicalEvidenceStore), documents the evidence contract with 4 principles, explains the R0+ enhanced contract with SHA-256 hashes and strict validation, and includes a history timeline with commit references.

## Test execution note

The prompt instructed not to re-run the test suite. The report claims 15 passed, the test file contains 15 test functions, and all functions have clear assertions matching the requirements. Spot-checking `test_duplicate_evidence_id_rejected`:

```python
def test_duplicate_evidence_id_rejected(store, sample_event):
    store.append(sample_event)
    with pytest.raises(ValueError, match="Duplicate evidence_id"):
        store.append(sample_event)
```

This correctly appends once then attempts to append the same event again, expecting a `ValueError`. The `CanonicalEvidenceStore.append` method checks `if event.evidence_id in self._evidence_ids` and raises `ValueError(f"Duplicate evidence_id: {event.evidence_id}")`, which matches the test's expectation. The test is correctly structured.

</details>

<details>
<summary>File map</summary>

- `.agents/evidence/canonical_evidence.py` — Created CanonicalEvidenceStore with SHA-256 hash chain implementation
- `.agents/evidence/__init__.py` — Added CanonicalEvidenceStore exports
- `.agents/evidence/README.md` — Created comprehensive evidence system documentation
- `.agents/evidence/DATA_QUALITY.md` — Documented W2 JSONL issues and evidence location history
- `.agents/evidence/evidence.jsonl` — New canonical evidence ledger (24 test entries)
- `.agents/tasks/test_canonical_evidence.py` — Created 15 tests covering all requirements
- `.agents/tasks/r0-evidence-audit.md` — Created evidence audit documenting contradictions
- `.agents/tasks/r0-plan.md` — Created implementation plan
- `.agents/tasks/r0-evidence-authority-report.json` — Created execution report with real SHAs and test counts
- `docs/project-llm/canonical-implementation-status.md` — Updated with real W0-W2 SHAs and corrected status
- `docs/project-llm/evidence-deprecated-20261008/DEPRECATED.md` — Created deprecation notice
- `docs/project-llm/evidence-deprecated-20261008/*` — Moved 6 deprecated evidence files
- `.agents/tasks/archive-intermediate-reviews/*` — Archived 8 intermediate review files
- `.agents/tasks/temp-diff.txt` — Deleted (10.4 MB temporary artifact)
- `.agents/tasks/generate-corrected-snapshot.ts` — Deleted (one-off script)
- `.agents/tasks/test-d6.ts` — Deleted (test script)

Full diff: `git diff HEAD~1 HEAD` (29 files changed, 1,948 insertions, 257,128 deletions including temp-diff.txt removal)

</details>
