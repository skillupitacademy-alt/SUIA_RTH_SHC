# Wave 3C artifact policy integration

Wave 3C adds canonical artifact placement policy to prevent duplicate file creation. The approach: normalize artifact names, find semantic matches in the repository, and choose ADD/REUSE/EXTEND/UPDATE/REJECT actions. The goal is to prevent ObjectiveBlockV2.tsx when ObjectiveBlock.tsx exists—route the update to the existing file instead.

**Watch for**: artifact_policy is complete and well-tested, but manifest generation doesn't call it (confirmed). The wiring step was skipped. All placement decisions currently bypass duplicate prevention.

**Verdict**: NEEDS_CHANGES

## High-level view

The artifact_policy module implements comprehensive name normalization (V2, v2, _v3, .variant suffixes), repository indexing from discovery snapshots, semantic matching, and action determination. Tests cover all five actions, multiple version patterns, and the full duplicate-prevention flow. The manifest generator imports artifact_policy and has _load_repository_index infrastructure, but _generate_file_paths never calls determine_action—it hardcodes action: "write" for every file. Manifest validation correctly rejects REJECT actions, checks path traversal, enforces allowed directories, and validates family/version match. SHA-256 binding is computed correctly over serialized manifest content excluding the hash field itself. Tests confirm hash stability, tampering detection, and all four validation checks.

<details>
<summary>Issues (4)</summary>

1. **Manifest generator doesn't call artifact_policy** — _generate_file_paths hardcodes action: "write" instead of calling determine_action per artifact. Duplicate prevention is bypassed. Wire artifact_policy into _generate_file_paths: build repository index, call find_semantic_match and determine_action for each file, and populate action field with ADD/UPDATE/EXTEND/REUSE/REJECT.

2. **Validation detects REJECT but generation never produces it** — validate_manifest correctly flags REJECT actions, but _generate_file_paths can't generate them because it doesn't call determine_action. Once wired, this check will catch genuine rejects. No action needed beyond wiring.

3. **No test coverage for artifact_policy integration in manifest generation** — test_placement_manifest.py tests manifest structure, validation, and sealing, but never exercises artifact_policy integration (no test passes a snapshot, no test verifies duplicate prevention affected manifest actions). Add integration test: pass snapshot with existing ObjectiveBlock.tsx, generate manifest for ObjectiveBlockV2.tsx candidate, assert action is UPDATE and target is ObjectiveBlock.tsx.

4. **_load_repository_index returns empty list when snapshot missing** — silently returns [] if snapshot_path is None or file not found. This means duplicate prevention degrades to always-ADD in production if snapshot isn't provided. Either require snapshot_path in __init__ (fail fast) or log warning when snapshot is missing so operators know duplicate prevention is disabled.

</details>

<details>
<summary>Details</summary>

## REJECT action unreachable

determine_action's docstring claims "Quality/compatibility issue → REJECT (manual review required)" but no quality checks are implemented—the function never returns REJECT. REJECT exists in the PlacementDecision enum and validate_manifest correctly flags it as an error, but no code path produces it. This isn't a Wave 3C bug (REJECT is reserved for future quality gates), but the docstring overpromises.

## Wiring gap between artifact_policy and manifest generation

PlacementManifestGenerator imports artifact_policy, declares _repository_index field, and implements _load_repository_index (loads snapshot JSON, calls artifact_policy.build_repository_index, caches result). But _generate_file_paths never calls _load_repository_index, find_semantic_match, or determine_action. It hardcodes:

```python
file_paths.append({
    "source": component_file,
    "target": component_target,
    "type": "component",
    "action": "write",  # Hardcoded, should be ADD/UPDATE/EXTEND/REUSE
    "backup_required": True
})
```

Every artifact gets action: "write" regardless of repository state. The entire artifact_policy module is bypassed. This is the blocking issue.

To wire it: in _generate_file_paths, after constructing component_file and component_target, load the repository index, call find_semantic_match(component_file, repository_index), compute candidate content hash (from validation evidence or candidate data), call determine_action(candidate_content, component_file, match), and set action field to the PlacementDecision enum value (ADD/UPDATE/EXTEND/REUSE/REJECT). Repeat for schema_file and types. If action is REJECT, either omit the file from file_paths or include it with action: "REJECT" so manifest validation will catch it (current validate_manifest logic will fail the manifest if any REJECT actions are present, which is correct—REJECT means the manifest should not be approved).

The _generate_file_paths signature may need candidate data to compute content hashes. Currently it only receives validation (which has sha256 of the whole candidate but not per-file hashes). Either pass candidate files separately or extract per-file hashes from validation.evidence. The test fixtures in test_placement_manifest.py use MockValidationResult with evidence containing artifact_count but no per-file data. The wiring will need richer validation evidence or direct access to candidate files.

## Manifest validation completeness

validate_manifest checks actions present, no REJECT actions, path traversal (../ and leading /), allowed directory prefixes, and family/version match. Tests verify path traversal ("../../../etc/passwd"), absolute paths ("/absolute/path"), disallowed directories ("packages/malicious"), family mismatch, and version mismatch are all caught. The REJECT check is present but unreachable until artifact_policy is wired.

## SHA-256 manifest binding

_compute_manifest_seal converts manifest to dict via asdict, pops manifest_sha256 field, serializes to JSON with sort_keys=True, and computes SHA-256. Tests verify hash stability (recomputing produces same value) and tampering detection (mutating fields invalidates the seal).

## Integration test gap

test_artifact_policy.py has 26 tests covering all five actions, duplicate prevention, and normalization. test_placement_manifest.py has 22 tests for manifest structure, validation, sealing, and rollback. But no test verifies artifact_policy is called from manifest generation. test_placement_manifest.py never passes a snapshot_path, never constructs a scenario where repository artifacts affect the manifest, and never asserts action field contains UPDATE/ADD/REUSE. The integration gap exists in production code and tests.

## Architectural duplication

app/agents/placement_manifest.py and app/intake/placement_manifest.py both implement placement manifest generation with different APIs (PlacementAction enum vs. PlacementDecision enum, different function signatures). Not a regression (both are new files), but a design concern. Tests import from app.intake, so that's the active path. The agents/ version appears unused in tests.

</details>

<details>
<summary>File map</summary>

**New files:**

- `services/project-ai/app/placement/artifact_policy.py` — normalize_artifact_name, build_repository_index, find_semantic_match, determine_action, get_target_path; 242 lines
- `services/project-ai/tests/test_artifact_policy.py` — 26 tests across 7 test classes covering all actions, duplicate prevention, normalization; 418 lines
- `services/project-ai/tests/test_placement_manifest.py` — 22 tests for manifest generation, validation, sealing, rollback, tampering detection; 477 lines
- `services/project-ai/app/intake/placement_manifest.py` — PlacementManifestGenerator, imports artifact_policy but doesn't call it; 424 lines
- `services/project-ai/app/placement/__init__.py` — exports for placement module
- `services/project-ai/app/agents/placement_manifest.py` — duplicate implementation (not used in tests, architectural concern)

**Modified files:** None (all placement/ files are new)

Full diff: `git diff main m2-project-ai-canonical-wiring`

</details>
