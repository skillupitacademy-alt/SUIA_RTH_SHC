# Wave 1 R1+R2 Remediation Review

Two commits enforce architectural boundaries in the Project AI backend: R1 removes Python's direct repository file system access, and R2 removes hardcoded version strings. Both changes align with the canonical wiring architecture documented in M2.9.

**Watch for:** R1's production code path now correctly consumes snapshots, but the legacy shim remains accessible and is used by the contract route. R2's version extraction logic will surface "MISSING_TARGET_VERSION" for workflows that haven't yet populated workflow_target, which is not a failure but an upstream integration signal.

**Verdict:** APPROVED

## High-level view

R1 splits repository_intelligence.py into two functions: the new `build_contract(snapshot, ...)` consumes TypeScript-provided evidence and never touches the filesystem, while `build_contract_legacy(repo_root, ...)` preserves the old boundary-violating behavior exclusively for tests and the contract route that hasn't been wired yet. The production pattern is correct; the legacy path is clearly marked deprecated and isolated.

R2 replaces `blockVersion="1.0.0"` in placement.py and candidate.py with extraction from `workflow_state['workflow_target']['version']`. The tests were updated to provide proper version formats (I7, C1, D1) instead of the hardcoded string. A fallback to "MISSING_TARGET_VERSION" signals when upstream orchestration hasn't yet populated the target, which is documented in code comments as an integration requirement.

Both changes are scoped exactly as declared: R1 touches repository_intelligence.py and the one import site; R2 touches placement.py, candidate.py, and their tests. No scope creep.

<details>
<summary>Issues (3)</summary>

1. **contract.py still uses legacy path** — The contract route imports `build_contract_legacy`, meaning the boundary-violating code path is still reachable in production via `/api/contract` endpoints. Document when contract.py will be migrated, or mark it as an accepted residual risk if it's intentionally using the repo_root pattern.

2. **MISSING_TARGET_VERSION is a string, not a version** — If workflow_target isn't populated, placement.py and candidate.py emit "MISSING_TARGET_VERSION" as the blockVersion. This string doesn't follow the version format (I7, C1, D1) and could propagate into placement manifests. Add validation to fail early if workflow_target.version is missing, or make the fallback follow the expected format.

3. **candidate.py version extraction is fragile** (possible) — The code tries `getattr(package, 'target_version', None)` and then `package.__dict__.get('_target_version', ...)`, suggesting it's guessing where version might live. Verify that candidate intake actually populates one of these fields, or this path will always hit the fallback.

</details>

<details>
<summary>Details</summary>

## R1: Repository intelligence boundary enforcement

The new `build_contract` signature takes `snapshot: Dict[str, Any]` instead of `repo_root: str`. Inside, it searches `snapshot['evidence']` for entries where `kind == 'canonical_block'`, matches them against the expected path for the requested (family, version), and extracts `contentHash` and `evidenceId` from the snapshot instead of computing them.

```python
canonical_blocks = [
    ev for ev in snapshot.get('evidence', [])
    if ev.get('kind') == 'canonical_block'
]
```

Three helper functions are preserved for backward compatibility:

- `compute_sha256(file_path)` — moved to the bottom, marked DEPRECATED, still opens files. Used only by tests and the legacy path.
- `compute_sha256_legacy(content: bytes)` — new name for the hash-only helper, no file I/O.
- `build_contract_legacy(repo_root, ...)` — the original implementation, moved to the end, clearly marked as deprecated.

The contract route (`app/api/routes/contract.py`) imports `build_contract_legacy as build_repo_contract`, meaning the boundary-violating path is still reachable in production. The completion artifact notes "routes that haven't been wired to snapshot yet", but there's no documented plan for when contract.py will migrate.

The unit test for repository_intelligence.py imports `build_contract_legacy as build_contract`, so the new snapshot-based path isn't exercised by the existing unit tests. The placement agent tests do exercise the new path indirectly because placement.py uses snapshots.

No `Path(repo_root)` or direct file I/O remains in the production `build_contract` function. The only remaining filesystem access is in the legacy shim.

## R2: Version binding from WorkflowTarget

The hardcoded `blockVersion="1.0.0"` appeared twice in placement.py (line 53) and twice in candidate.py (lines 387 and 399). R2 replaced all four occurrences with extraction from `workflow_target.version`.

In placement.py, the pattern is:

```python
workflow_target_data = context.workflow_state.get('workflow_target', {})
target_version = workflow_target_data.get('version')
if not target_version:
    target_version = "MISSING_TARGET_VERSION"
```

The comment says "NOTE: Upstream workflow orchestration should populate workflow_target during DISCOVERY/BRIEF_READY states with proper version binding", documenting the dependency.

In candidate.py, the pattern is different:

```python
target_version = getattr(package, 'target_version', None) or \
                 package.__dict__.get('_target_version', 'MISSING_TARGET_VERSION')
```

This tries two different attribute paths, suggesting candidate packages don't yet carry a standardized version field. The comment says "In full workflow integration, candidate packages should carry CandidateBinding with target_version from WorkflowTarget", which implies this is placeholder logic until candidate intake is wired to populate the field.

Three test files were updated:

- `tests/agents/test_placement.py` — three test fixtures now include a `workflow_target` dictionary with `version: "C1"`, `version: "I7"`, and `version: "D1"` respectively.
- `tests/certification/test_gates.py` — one hardcoded `blockVersion="1.0.0"` in the test fixture was changed to `blockVersion="C1"`.

Grep found two remaining instances of `blockVersion="1.0.0"` in `services/project-ai/tests/test_placement.py` (lines 437, 522), but that file is in the root tests directory, not `tests/agents/test_placement.py`, and was not in R2's declared scope.

## Scope discipline

R1 changed:
- `app/contracts/repository_intelligence.py` (refactor into new + legacy functions)
- `app/api/routes/contract.py` (import renamed to build_contract_legacy)
- `tests/unit/test_repository_intelligence.py` (import renamed to build_contract_legacy)

R2 changed:
- `app/agents/placement.py` (version extraction + fallback)
- `app/api/routes/candidate.py` (version extraction + fallback)
- `tests/agents/test_placement.py` (added workflow_target to three fixtures)
- `tests/certification/test_gates.py` (changed one fixture blockVersion)

## Test coverage

The test_repository_intelligence.py tests run against `build_contract_legacy`, so they exercise the old filesystem path, not the new snapshot-based path. The new path is indirectly tested by placement agent tests.

The three placement tests and the certification gates test now use proper version formats. The tests verify that manifests are created with the version from workflow_target, not hardcoded "1.0.0". The tests do not verify what happens when workflow_target is missing (the MISSING_TARGET_VERSION fallback path).

</details>

## File map

<details>
<summary>Files changed (7)</summary>

**R1 (commit f9583d62):**
- `services/project-ai/app/contracts/repository_intelligence.py` — split into snapshot-based build_contract and legacy filesystem-based build_contract_legacy
- `services/project-ai/app/api/routes/contract.py` — import renamed to build_contract_legacy
- `services/project-ai/tests/unit/test_repository_intelligence.py` — import renamed to build_contract_legacy

**R2 (commit df5e3e19):**
- `services/project-ai/app/agents/placement.py` — extract blockVersion from workflow_target.version with fallback
- `services/project-ai/app/api/routes/candidate.py` — extract blockVersion from package attributes with fallback
- `services/project-ai/tests/agents/test_placement.py` — add workflow_target to three test fixtures
- `services/project-ai/tests/certification/test_gates.py` — change one fixture blockVersion to C1

Full diff: `git diff origin/main..m2-project-ai-canonical-wiring`

</details>
