# Repository Intelligence Consolidation to Snapshot-Based Architecture

Consolidates two competing repository intelligence implementations to a single snapshot-based architecture. The filesystem-scanning implementation in `app/intelligence/` was archived, and the snapshot-based implementation in `app/contracts/` was strengthened with fail-closed validation that raises `RepositoryEvidenceBlocked` when evidence is missing or invalid. The change eliminates an architectural boundary violation where Python was scanning the repository directly instead of consuming TypeScript snapshot evidence.

**Watch for:** None — all blocking issues from iteration 1 were resolved in the fix commit (9454ff53). Runtime guards prevent production use of legacy filesystem functions, and the intelligence module's broken imports were cleared.

**Verdict**: APPROVED

## High-level view

The consolidation removed `app/intelligence/repository_intelligence.py` which violated the architectural boundary by using `Path.glob()`, `read_text()`, and filesystem scanning to discover canonical blocks. The snapshot-based `build_contract()` in `app/contracts/repository_intelligence.py` now validates all inputs and raises `RepositoryEvidenceBlocked` for unknown versions (anything other than I1, C1, D1), missing snapshots, empty evidence arrays, missing canonical evidence for the requested family/version, or incomplete evidence missing `contentHash` or `evidenceId` fields.

Legacy functions `build_contract_legacy()` and `compute_sha256()` were preserved for test backward compatibility but protected with runtime guards that check for `PYTEST_CURRENT_TEST` or `ALLOW_LEGACY_FILESYSTEM_ACCESS` environment variables — production calls raise `RuntimeError`. The contract route in `app/api/routes/contract.py` catches `RepositoryEvidenceBlocked` and returns HTTP 503 with guidance to run TypeScript discovery.

Comprehensive test coverage validates all fail-closed scenarios: unknown versions, missing snapshots, empty evidence, missing contentHash/evidenceId fields, and deterministic output from identical snapshots. Tests confirm no filesystem access occurs in the production `build_contract()` path.

<details>
<summary>Details</summary>

## Filesystem-scanning implementation archived

The `app/intelligence/repository_intelligence.py` file was moved to `.archived` extension. This implementation used `Path.glob("*Block.tsx")` to dynamically discover canonical blocks, `Path.read_text()` to read TSX files, and regex patterns to extract block versions and runtime requirements. The migration report documents that this approach violated the architectural boundary: TypeScript discovery is responsible for repository scanning, and Python must only consume the snapshot evidence produced by TypeScript.

The test file `tests/intelligence/test_repository_intelligence.py` was also archived, as it tested the filesystem-scanning behavior. All 14 test cases validated dynamic discovery patterns, regex-based pattern extraction, and filesystem-based contract building — functionality that's now prohibited.

A grep search confirmed zero active imports from `app.intelligence.repository_intelligence` after the archival. The only import was in the archived test file itself. No production code was affected.

## Intelligence module cleared

The `app/intelligence/__init__.py` module originally imported from `.repository_intelligence`, which would cause `ModuleNotFoundError` after archival. The fix commit (9454ff53) cleared all imports, set `__all__ = []`, and added deprecation guidance explaining the migration to `app.contracts.repository_intelligence`. Any future code attempting to import from `app.intelligence` will find an empty module with clear migration instructions, not a runtime failure.

## Snapshot-based implementation strengthened

The `build_contract()` function in `app/contracts/repository_intelligence.py` was enhanced with fail-closed validation logic. The function now performs five validation checks before attempting to build a contract:

1. **Version validation** — Only I1, C1, and D1 are recognized. Unknown versions raise `RepositoryEvidenceBlocked` with message: "Unknown block version 'X'. Known versions: ['C1', 'D1', 'I1']".

2. **Snapshot presence** — Raises if snapshot is None or empty dict: "Snapshot is missing or empty".

3. **Evidence array structure** — Raises if 'evidence' key is missing: "Snapshot missing 'evidence' array". Raises if 'evidence' is not a list: "Snapshot 'evidence' must be a list".

4. **Evidence availability** — Searches for canonical_block evidence matching the expected path for the requested (family, version) pair. Raises if not found: "No canonical evidence for Code/C1. Expected path: packages/ui/src/tutorial/blocks/CodeC1Block.tsx. Run TypeScript discovery scan to generate evidence."

5. **Evidence completeness** — Validates that `contentHash` and `evidenceId` fields are present and non-empty. Raises: "Evidence for Code/C1 missing 'contentHash' field" or "Evidence for Code/C1 missing 'evidenceId' field".

The exception class `RepositoryEvidenceBlocked` was added with a docstring explaining it signals missing or incomplete evidence and that the caller should trigger TypeScript discovery and retry.

The production `build_contract()` contains zero Path operations, no `.glob()`, no `.read_text()`, no `.exists()` checks. All data extraction happens from the `snapshot['evidence']` array. SHA-256 hashes are extracted from `ev['contentHash']`, never recomputed. Evidence IDs come from `ev['evidenceId']`, produced deterministically by TypeScript.

## Legacy filesystem functions guarded

Two functions remain that perform filesystem operations: `build_contract_legacy(repo_root, family, version)` and `compute_sha256(file_path)`. Both are marked DEPRECATED and preserved only for test backward compatibility.

The fix commit (9454ff53) added runtime guards to both functions. Each checks for `PYTEST_CURRENT_TEST` or `ALLOW_LEGACY_FILESYSTEM_ACCESS` environment variables. If neither is set, they raise `RuntimeError` with a message explaining the architectural violation and directing the caller to use snapshot-based alternatives. Pytest automatically sets `PYTEST_CURRENT_TEST` when running tests, so existing test cases continue to pass without modification.

The guard prevents accidental production use. If any production code attempts to call `build_contract_legacy()` or `compute_sha256()`, it will fail immediately with a clear error message, not silently violate the boundary.

## Contract route exception handling

The contract generation route in `app/api/routes/contract.py` imports `RepositoryEvidenceBlocked` and wraps the call to `build_repo_contract()` in a try/except block. When the exception is caught, the route returns HTTP 503 (Service Unavailable) with a clear error message indicating that repository evidence is missing and a TypeScript discovery scan is needed.

This fail-closed behavior ensures the API never returns a partially valid or fabricated contract when evidence is missing. The 503 status code correctly signals that the service cannot fulfill the request due to missing data, not a client error.

## Test coverage for fail-closed behavior

The test file `tests/unit/test_repository_intelligence.py` was expanded with three new test classes covering fail-closed behavior:

**TestSnapshotBasedBuildContract** validates successful contract building from valid snapshots. Four test cases cover: valid snapshot with Code C1 evidence, Introduction I1, Definition D1, and deterministic output from identical snapshots. These confirm the happy path works and produces repeatable results.

**TestFailClosedBehavior** validates all five failure modes. Eight test cases cover: unknown version (X9) raises with "Known versions" in message, missing snapshot (None) raises, empty snapshot ({}) raises, snapshot without 'evidence' key raises, 'evidence' not a list raises, missing evidence for requested family/version raises with "Run TypeScript discovery scan" message, missing contentHash raises, missing evidenceId raises. Each test uses `pytest.raises(RepositoryEvidenceBlocked)` and asserts the error message contains expected phrases.

**TestNoFilesystemAccess** validates that `build_contract()` doesn't perform filesystem operations. The test constructs a snapshot with a path that doesn't exist on the filesystem and confirms the function succeeds and uses the snapshot's contentHash and evidenceId values. This proves the function never checks file existence or reads file content.

The test suite reports 34 passed tests, covering both legacy filesystem-based tests (still working under pytest's automatic environment variable) and the new snapshot-based tests.

## Canonical discovery verified

The `block_patterns` dictionary in `build_contract()` maps (family, version) tuples to expected canonical paths:

```
("Introduction", "I1"): "packages/ui/src/tutorial/blocks/IntroductionBlock.tsx"
("Code", "C1"): "packages/ui/src/tutorial/blocks/CodeC1Block.tsx"
("Definition", "D1"): "packages/ui/src/tutorial/blocks/DefinitionBlock.tsx"
```

The function searches `snapshot['evidence']` for a canonical_block with `ev['path']` matching the expected path. If found, it extracts the contentHash and evidenceId and constructs a `CanonicalReference` with one `RepositoryEvidence` entry. This implements the requirement for I1/C1/D1 canonical discovery from snapshot evidence.

Tests validate all three family/version combinations build contracts successfully when matching evidence exists in the snapshot.

## Deterministic output confirmed

The test `test_build_contract_deterministic_output` calls `build_contract()` twice with the same snapshot and asserts that family, version, block_type, references count, and the SHA-256/evidence_id values match exactly. This confirms the function produces deterministic output — no randomness, no timestamp-based variation, no filesystem state influencing results.

The evidence_id itself is deterministic because TypeScript discovery computes it as `sha256(path + contentHash)`, a pure function of the file path and content hash.

## Metadata and path derivation

Beyond the core fail-closed validation, the strengthened implementation includes helper functions to extract metadata, derive file paths, and identify test patterns from snapshot evidence.

`extract_metadata_from_snapshot()` searches `snapshot['metadata']` for explicit language/framework/style declarations, and falls back to inference from file extensions and patterns in `snapshot['evidence']`. If a `.tsx` file is found, language is inferred as TypeScript. If a `Block.tsx` pattern is found, framework is inferred as React. If `.module.css` files exist, style is inferred as CSS Modules.

`derive_file_paths()` searches `snapshot['evidence']` for files related to the requested family/version: the component file matching the canonical path, schema files containing "schema" and the family name, types files containing "types" and the family name, and test files in `__tests__` or with `.test.` patterns. Each found file is recorded with its path and evidenceId for traceability.

`extract_test_patterns()` scans evidence for test files and checks for patterns indicating unit tests, accessibility tests (a11y, wcag), and responsive design tests (mobile, tablet). It returns a list of test requirement strings describing the detected patterns.

These derivation functions consume only snapshot data, never touching the filesystem. They enrich the contract with contextual information TypeScript discovery provides implicitly through file structure and naming conventions.

## Field evidence tracking

The contract model includes a `field_evidence` dictionary mapping field names to `ContractFieldEvidence` objects. Each entry records the field name, value, evidence source description, evidence ID, and timestamp. This establishes an audit trail showing which snapshot evidence backs each contract field.

After building a contract, `build_contract()` populates `field_evidence` entries for language, framework, style, difficulty_level, file_paths, test_requirements, and type_strictness. The evidence_source field describes where the value came from: "snapshot.metadata.language or inferred from file extensions", "derived from snapshot.evidence canonical_block patterns", etc.

This traceability mechanism supports debugging when contract fields appear incorrect, and provides verification that no fields are hardcoded — every value originates from snapshot evidence.

</details>

<details>
<summary>File map</summary>

**Modified:**

- `services/project-ai/app/contracts/repository_intelligence.py` — Added RepositoryEvidenceBlocked exception, fail-closed validation in build_contract(), runtime guards on legacy functions, metadata extraction, path derivation, test pattern extraction, and field evidence tracking
- `services/project-ai/app/api/routes/contract.py` — Added RepositoryEvidenceBlocked import and exception handler returning HTTP 503
- `services/project-ai/app/intelligence/__init__.py` — Cleared broken imports, added deprecation guidance, set __all__ = []
- `services/project-ai/tests/unit/test_repository_intelligence.py` — Added TestSnapshotBasedBuildContract, TestFailClosedBehavior, TestNoFilesystemAccess test classes covering all fail-closed scenarios

**Archived:**

- `services/project-ai/app/intelligence/repository_intelligence.py.archived` — Filesystem-scanning implementation with Path.glob(), read_text(), regex-based TSX parsing
- `services/project-ai/tests/intelligence/test_repository_intelligence.py.archived` — Tests for filesystem-scanning implementation

**Created:**

- `.agents/tasks/r1-audit.md` — Pre-migration audit documenting both implementations and architectural violations
- `.agents/tasks/r1-migration.md` — Migration report documenting files archived, functionality removed, validation logic added, and success criteria
- `.agents/tasks/r1-fix-report.md` — Fix iteration report documenting resolution of import failure and runtime guard additions
- `.agents/tasks/r1-repository-intelligence-cleanup-report.json` — Machine-readable evidence report with test results, commit SHAs, and risk assessment

**Commits:**

- `1aa42319` — "fix(project-llm): consolidate repository intelligence to snapshot-based [R1]" (initial implementation)
- `9454ff53` — "fix(project-llm): resolve R1 review findings [R1-FIX]" (fix iteration)
- `8b84d8fb` — "chore(project-llm): update R1 evidence report with fix iteration [R1]" (evidence update)

Full diff: `git diff main -- services/project-ai/` (176 files changed, 48972 insertions)

</details>
