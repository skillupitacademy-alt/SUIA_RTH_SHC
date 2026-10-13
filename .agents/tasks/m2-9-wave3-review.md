# Wave 3 Candidate Pipeline — Intake, Comparison, Placement

This wave completes the candidate pipeline with server-side integrity verification (B05), real canonical comparison logic (B06), and artifact placement policy that prevents duplicate file creation (B07).

**Watch for:** No blocking concerns. All required functionality is implemented. *confirmed*

**Verdict**: APPROVED

## High-level view

B05 implements contract binding through `CandidateManifest` and server-side hash verification via `verify_candidate_integrity`. The integrity check compares stored contract hashes rather than trusting client declarations, raising `CandidateIntegrityError` on any mismatch or incomplete target binding.

B06 removes the stub comparison logic and introduces `ComparisonResult` with PASS/FAIL/BLOCKED semantics. The comparator verifies family and version match, detects missing required artifacts, and distinguishes between failures (wrong version) and warnings (unexpected files). Wrong-version requests correctly return FAIL status.

B07 establishes the five-action placement policy (ADD/UPDATE/EXTEND/REUSE/REJECT) with semantic matching that strips version suffixes. The `find_semantic_match` function ensures ObjectiveBlockV2.tsx maps to UPDATE action against existing ObjectiveBlock.tsx rather than creating a duplicate file.

Cross-wave imports follow the architecture: B06 imports `WorkflowTarget` from `app.models.workflow_target`, and all models use absolute imports from their respective modules.

<details>
<summary>Issues (0)</summary>

No blocking issues found.

</details>

<details>
<summary>Details</summary>

## Contract binding and integrity verification in B05

The intake agent now requires every candidate to carry a `CandidateManifest` that binds it to its source workflow, engineering contract, and target specification. The manifest includes four required fields: `workflow_id`, `contract_id`, `contract_hash` (SHA-256), and `target` (dict with family, version, block_type).

The `verify_candidate_integrity` function implements server-side verification with a critical principle documented in the code: "NEVER trust client-declared hashes." The function accepts three arguments — the candidate manifest, a path to the candidate files, and the stored contract hash from the server's contract store. It compares the manifest's declared `contract_hash` against the `stored_contract_hash` parameter, not against data the client controls.

When verification fails, the function raises `CandidateIntegrityError` with a message that includes both the candidate-declared hash and the server-stored hash, making hash mismatches immediately traceable. The function also validates that target binding is complete (family and version present) and that workflow_id and contract_id are non-empty strings.

Tests in `test_candidate_intake.py` confirm the happy path (matching hashes pass silently), the failure path (mismatched hashes raise with diagnostic message), and the validation paths (missing target.family, missing target.version, empty workflow_id, empty contract_id all raise with specific error messages).

## Canonical comparison with real PASS/FAIL/BLOCKED logic in B06

The `ComparisonResult` model defines three status values: PASS (target matches and required artifacts present), FAIL (version mismatch or missing required artifacts), and BLOCKED (contract unavailable). The model includes `target_match` boolean, per-artifact `ArtifactComparison` list, `missing_requirements`, `unexpected_artifacts`, and `conflicts`. An `is_approved` property returns True only when status is PASS.

`CanonicalComparator.compare()` accepts candidate artifacts, required artifact names, target family and version, and an optional `RepositoryBlockContract`. The method first checks contract availability — if None, it returns BLOCKED status. Then it compares the contract's family and version against the requested target; any mismatch results in FAIL with a conflict message identifying what mismatched.

When family and version match, the comparator checks for missing required artifacts using flexible keyword matching. For example, "React/TypeScript implementation" matches candidate files containing "tsx", "react", or "implementation" in their names. This prevents false negatives when candidate filenames don't exactly match requirement strings.

Unexpected artifacts (files not matching any expected keywords) are noted in the result but do not cause failure — they generate a warning but leave status as PASS if all required artifacts are present.

The comparator extracts evidence IDs from the contract's references and includes them in the result, maintaining traceability to the canonical blocks that informed the comparison.

Tests verify wrong-version detection (I8 requested, I7 in contract → FAIL), wrong-family detection (Tutorial requested, Introduction in contract → FAIL), missing required artifacts (incomplete file set → FAIL with artifact in `missing_requirements`), all-match case (→ PASS), unavailable contract (→ BLOCKED), and unexpected-artifacts case (extra file → PASS with warning).

## Semantic artifact placement that prevents duplicates in B07

The placement policy implements five actions via `PlacementAction` enum: ADD (new artifact, no match), UPDATE (replace existing artifact), EXTEND (add to existing family), REUSE (identical to existing, no changes), REJECT (does not meet criteria).

`normalize_artifact_name` strips version suffixes (V2, V3, v2, _v2) and extensions to produce a base name for matching. Examples from tests: ObjectiveBlockV2.tsx → ObjectiveBlock, ObjectiveBlock_v3.tsx → ObjectiveBlock, ObjectiveBlock.tsx → ObjectiveBlock.

`find_semantic_match` takes a candidate artifact and repository index, normalizes the candidate's filename, and searches the index for an artifact with matching `base_name`. This ensures ObjectiveBlockV2.tsx finds the existing ObjectiveBlock.tsx rather than treating it as unrelated. The function returns the matching `RepositoryArtifact` or None if no match exists.

Decision logic flows through helper functions:

- `artifacts_are_identical` compares SHA-256 hashes of content
- `can_extend_artifact` returns True if candidate filename contains ".variant." or "-variant.", indicating it adds functionality rather than replaces
- `can_update_artifact` returns True if semantic match exists, candidate is not identical, and extension is not more appropriate

`build_placement_manifest` applies this logic to each artifact in a candidate package. For each artifact, it finds a semantic match, then applies action rules: no match → ADD, identical → REUSE, can extend → EXTEND, can update → UPDATE, otherwise → REJECT. Each placement includes `candidate_path`, `action`, `target_path` (resolved to existing file path for UPDATE/EXTEND/REUSE), `reason`, `requires_approval` flag, and `existing_artifact_hash` when relevant.

The manifest includes a computed SHA-256 hash of its own content (excluding the hash field itself), enabling tamper detection.

Tests cover the critical cases: new artifact (QuizBlock.tsx with no match → ADD with target_path = candidate_path), version suffix match (ObjectiveBlockV2.tsx with existing ObjectiveBlock.tsx → UPDATE with target_path = existing path), identical content (→ REUSE with `requires_approval=False`), variant indicator (ObjectiveBlock.variant.tsx → EXTEND), missing filename (→ REJECT with reason "No filename provided"), and multi-artifact packages with mixed actions.

`build_repository_index` constructs the artifact index from snapshot evidence, extracting path, hash, kind, and computing base_name via `normalize_artifact_name` for each evidence entry.

## Cross-wave import structure

B06 imports `WorkflowTarget` from `app.models.workflow_target` using absolute path `from app.models.workflow_target import WorkflowTarget`, consistent with Wave 1 and Wave 2 module organization.

B07 defines `PlacementManifest` and related types internally. B05 defines `CandidateManifest` and `CandidateIntegrityError` within `app/agents/intake.py`. No conflicts with other wave definitions.

</details>

---

<details>
<summary>File map</summary>

**Services / project-ai / app / agents**
- `intake.py` — CandidateManifest model, verify_candidate_integrity function, CandidateIntegrityError exception, sha256_file utility
- `canonical_comparison.py` — ComparisonResult model, CanonicalComparator class with real PASS/FAIL/BLOCKED logic, execute_canonical_comparison agent function
- `placement_manifest.py` — PlacementAction enum, normalize_artifact_name, find_semantic_match, build_placement_manifest, artifact decision logic

**Services / project-ai / tests / unit**
- `test_candidate_intake.py` — Integrity verification tests, hash mismatch detection, target binding validation
- `test_canonical_comparison.py` — Wrong-version test, wrong-family test, missing-artifact test, PASS/FAIL/BLOCKED coverage
- `test_placement_manifest.py` — ObjectiveBlockV2 → UPDATE test, semantic matching tests, action decision tests

**Services / project-ai / app / models**
- `workflow_target.py` — WorkflowTarget and CandidateBinding models (Wave 2 output, imported by B06)

Full diff: `git diff main services/project-ai/app/agents/intake.py services/project-ai/app/agents/canonical_comparison.py services/project-ai/app/agents/placement_manifest.py services/project-ai/tests/unit/test_candidate_intake.py services/project-ai/tests/unit/test_canonical_comparison.py services/project-ai/tests/unit/test_placement_manifest.py`

</details>
