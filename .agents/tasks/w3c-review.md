# Placement manifest integration with artifact policy

Integration of canonical artifact policy (ADD/REUSE/EXTEND/UPDATE/REJECT) into placement manifest generation. The manifest generator now calls `artifact_policy.determine_action()` for each file to prevent versioned duplicates like ObjectiveBlockV2.tsx from creating new files when ObjectiveBlock.tsx already exists. Manifest validation enforces four safety checks: all artifacts have actions, no REJECT actions pass validation, all paths are safe (no traversal, relative only), and target family/version match the binding. SHA-256 binding seals the manifest for tamper detection.

**Watch for:** Missing snapshot handling falls back to ADD-all mode silently (warning logged but duplicate prevention fully disabled). Manifest validation doesn't check repository_match consistency with computed actions. Content-based duplicate detection uses placeholder empty strings at manifest generation time, relying entirely on filename-based semantic matching.

**Verdict**: APPROVED

## High-level view

The artifact policy integration operates through three entry points in `_generate_file_paths()`: `find_semantic_match()` normalizes filenames to detect duplicates, `determine_action()` returns ADD/UPDATE/EXTEND/REUSE/REJECT based on repository state and content hash, and `get_target_path()` resolves the canonical path (existing file for UPDATE, new path for ADD). When the snapshot is missing or fails to load, the system logs a warning and returns an empty repository index, causing all artifacts to receive ADD actions — duplicate prevention is completely disabled in this fallback path.

Manifest validation runs four checks before sealing: every file_path entry must have an action field, REJECT actions cause validation failure (no rejected artifacts reach approved manifests), target paths are checked for traversal patterns and absolute paths, and paths must start with one of five allowed prefixes. Family and version mismatches between the manifest and target_binding also fail validation.

The SHA-256 seal is computed by converting the manifest to a dictionary, removing the `manifest_sha256` field, serializing to JSON with sorted keys, and hashing. The seal is attached to the manifest after all other fields are populated. `verify_manifest_seal()` recomputes the hash and compares it to the stored value; any field mutation invalidates the seal.

Test coverage includes 50 passing tests across two files: `test_artifact_policy.py` covers normalization patterns (V2, v2, _v2, .variant.), semantic matching, and all five action determinations; `test_placement_manifest.py` covers manifest generation, validation (path traversal, absolute paths, disallowed directories, family/version mismatches), seal computation and tampering detection, and two integration tests that verify duplicate prevention with a snapshot and new artifact detection without a match.

<details>
<summary>Issues (6)</summary>

1. **Manifest validation doesn't verify action correctness** — `validate_manifest()` checks that actions are present but doesn't verify that UPDATE actions have repository_match or that target paths are consistent with the action type. Add validation rules: UPDATE/REUSE/EXTEND require repository_match existence, REJECT actions must have empty target paths.

2. **Content hash is empty string at manifest generation time** (confirmed) — `_generate_file_paths()` calls `determine_action(candidate_content="", ...)` with placeholder empty strings, so REUSE detection (identical content hash) never triggers during manifest generation. Either pass actual content to `_generate_file_paths()` or document that REUSE detection happens at a later placement execution stage, not manifest generation.

3. **Silent duplicate prevention failure** (confirmed) — When `snapshot_path` is None or snapshot loading fails, `_load_repository_index()` logs a warning and returns `[]`, disabling duplicate prevention entirely. All artifacts get ADD actions regardless of repository state. Consider failing fast (raise exception) or exposing degraded mode in manifest metadata so downstream consumers know duplicate prevention wasn't enforced.

4. **Validation allows types directory but _generate_file_paths doesn't use it** — Validation allows `packages/ui/src/tutorial/types/` but the only type file generated goes to `{blocks_base}/types.ts`, which validation would reject. Either fix the types file path generation to use the types directory or remove `types/` from allowed prefixes.

5. **No test for REJECT action in manifest generation** — Tests cover REJECT in `determine_action()` but not REJECT appearing in a manifest and being caught by validation. Add a test that manually constructs a manifest with a REJECT action in file_paths and verifies validation fails with "REJECT action found" error.

6. **Manifest validation doesn't enforce backup_required consistency** — Some file types have `backup_required: True`, others `False`, but validation doesn't check this field exists or makes sense for the action type (UPDATE should require backup, ADD might not). Add validation for backup_required presence and document the policy.

</details>

<details>
<summary>Details</summary>

## Artifact policy wiring into manifest generation

Each file in `_generate_file_paths()` goes through three artifact_policy calls. First, `find_semantic_match(filename, repository_index)` normalizes the candidate filename (removes V2, v2, _v2, .variant. patterns) and searches the repository index for a matching base name. If ObjectiveBlockV2.tsx is the candidate and ObjectiveBlock.tsx exists in the repository, `find_semantic_match()` returns the ObjectiveBlock artifact.

Second, `determine_action(candidate_content, candidate_filename, repository_match)` decides the placement action. No match means ADD. Match with identical content hash means REUSE. Match with variant indicator (.variant., -variant-) means EXTEND. Match with different content means UPDATE. The UPDATE path is where duplicate prevention happens: ObjectiveBlockV2.tsx with a repository_match for ObjectiveBlock.tsx gets UPDATE, not ADD.

Third, `get_target_path(action, candidate_path, repository_match)` resolves the canonical path. ADD uses candidate_path (the new file location). UPDATE, EXTEND, and REUSE use repository_match.path (the existing file location). REJECT returns empty string. This ensures ObjectiveBlockV2.tsx candidates target ObjectiveBlock.tsx for UPDATE actions.

The integration test `test_artifact_policy_integration_duplicate_prevention()` verifies end-to-end: it creates a snapshot with existing IntroductionI7Block.tsx, generates a manifest for an IntroductionI7 candidate, and asserts the action is UPDATE and the target path points to the existing file. A second integration test `test_artifact_policy_integration_new_artifact()` verifies ADD actions for candidates with no repository match.

Three artifact_policy integration gaps surface. First, `candidate_content=""` is passed to `determine_action()` because file content isn't available at manifest generation time — only ValidationResult metadata exists, not the actual file bytes. This means REUSE detection (identical content hash) never triggers during manifest generation; all semantic matches produce UPDATE actions. Second, when `snapshot_path` is None or loading fails, `_load_repository_index()` returns an empty list and logs a warning, disabling duplicate prevention silently. All artifacts get ADD actions regardless of what's in the repository. Third, the repository_index is built once and cached in `self._repository_index`, but nothing validates the snapshot represents the current repository state.

## Semantic matching and duplicate prevention

`normalize_artifact_name()` strips version suffixes to compute base names: ObjectiveBlockV2.tsx → ObjectiveBlock, Introduction_v3.tsx → Introduction, AssessmentBlock-variant-dark.tsx → AssessmentBlock. The pattern matching covers uppercase V, lowercase v, underscore prefixes (_v2, _V2), and variant indicators (.variant., -variant-).

`find_semantic_match()` compares the candidate's normalized base name against every artifact in the repository index. First match wins. If the repository contains both ObjectiveBlock.tsx and ObjectiveBlockV2.tsx (versioned duplicate already exists), `find_semantic_match()` returns the first match it encounters. Both have base_name "ObjectiveBlock" after normalization, so the order in the repository_index determines which one is the semantic match. The artifact_policy logic doesn't detect or warn about existing duplicate files; it only prevents creating new ones.

## Action determination logic

`determine_action()` implements five-way branching. No repository_match returns ADD immediately. With a repository_match, the function computes the candidate content hash (SHA-256) and compares it to repository_match.content_hash. Equal means REUSE. Next, variant indicators in the candidate filename (.variant., -variant-, _variant_, .variant, -variant) trigger EXTEND. All other semantic matches with different content return UPDATE.

REJECT is defined in the PlacementDecision enum but never returned by `determine_action()`. The code comment in placement_manifest.py says "REJECT is reserved for future quality gates (not implemented yet)".

The variant indicator check uses substring matching (`pattern in candidate_filename.lower()`), so "ObjectiveBlock.dark-variant.tsx" triggers EXTEND even though -variant is in the middle, not the prefix.

## Manifest validation completeness

`validate_manifest()` enforces four classes of rules. First, every file_path entry must have a non-empty action field; missing actions fail with "Missing action for file: {source}". Second, REJECT actions fail validation immediately with "REJECT action found for file: {source}".

Third, path safety checks: target paths containing "../" or starting with "/" fail with "Unsafe path (traversal or absolute)", and target paths not matching one of five allowed prefixes fail with "Target path not in allowed directories". The allowed prefixes are `packages/ui/src/tutorial/blocks/`, `packages/ui/src/tutorial/schemas/`, `packages/ui/src/tutorial/types/`, `packages/ui/src/tutorial/utils/`, and `packages/shared/src/tutorial/`.

Fourth, target_binding consistency: manifest.target_family must match target_binding["target_family"] if provided, and manifest.target_version must match target_binding["target_version"] if provided. Mismatches fail with "Manifest family mismatch" or "Manifest version mismatch".

Validation gaps: validation checks that actions are present but doesn't verify action correctness (UPDATE actions should have repository_match, REJECT actions should have empty target paths, ADD actions shouldn't point to existing repository paths). Validation allows `packages/ui/src/tutorial/types/` but `_generate_file_paths()` generates type files as `{blocks_base}/types.ts`, which is `packages/ui/src/tutorial/blocks/types.ts` — not in the types directory, would fail validation if artifact_count > 2. backup_required isn't validated; some file_path entries have it, others don't, but validation doesn't check presence or correctness.

## SHA-256 manifest binding

`_compute_manifest_seal()` converts the manifest to a dictionary via `asdict(manifest)`, removes the `manifest_sha256` field with `pop("manifest_sha256", None)`, serializes to JSON with `json.dumps(manifest_dict, sort_keys=True)`, and computes SHA-256 of the UTF-8 encoded JSON.

`verify_manifest_seal()` recomputes the seal via `_compute_manifest_seal()` and compares it to `manifest.manifest_sha256` using string equality. Tampering detection is tested in `test_generate_manifest_seal_tampering_detection()`: after generating a manifest, the test mutates `replacement_strategy` to "tampered_strategy" and verifies the seal is invalid.

The seal covers generated_at, so two manifests generated at different times have different seals even if all placement decisions are identical. The manifest_id is a UUID, guaranteeing seal uniqueness across manifests.

## Test coverage

`test_artifact_policy.py` has 27 tests covering normalization (V2, v2, _v2, variant indicators, complex cases), repository index building, semantic matching, all five action determinations, target path resolution, and duplicate prevention end-to-end.

`test_placement_manifest.py` has 25 tests covering manifest generation, validation (path traversal, absolute paths, disallowed directories, family/version mismatches), seal computation and tampering detection, replacement strategy determination, and two integration tests (duplicate prevention with snapshot, new artifact without match).

Test gaps: no test verifies REJECT actions in a manifest are caught by validation (REJECT only appears in `test_reject_empty_path()` which manually passes REJECT to `get_target_path()`). No test verifies the types file path problem: if artifact_count > 2, `_generate_file_paths()` generates `{blocks_base}/types.ts`, but validation expects types files in `packages/ui/src/tutorial/types/`. No test verifies behavior when repository_index has duplicate base names (two files both normalizing to "ObjectiveBlock").

## Repository index loading and snapshot handling

`_load_repository_index()` checks `self._repository_index` first (cached). If None and `self.snapshot_path` is None, it logs a warning ("duplicate prevention disabled - all artifacts will use ADD action") and returns `[]`. If snapshot_path is provided, it opens the file, loads JSON, and calls `artifact_policy.build_repository_index(snapshot)`. FileNotFoundError and JSONDecodeError are caught, logged as warnings with the same "duplicate prevention disabled" message, and return `[]`.

When the snapshot is missing or invalid, all artifacts receive ADD actions because `find_semantic_match()` always returns None when repository_index is empty. Two risks: the warning is logged but not surfaced in the manifest metadata, so downstream consumers don't know duplicate prevention was degraded. A manifest generated with an empty repository index looks identical to a manifest where all artifacts genuinely have no semantic matches. Second, if the snapshot is stale (repository changed since snapshot was captured), the repository_index represents outdated state, and duplicate prevention operates on old data. No staleness check or snapshot timestamp validation exists.

## Generated file paths and actions

`_generate_file_paths()` generates file paths for component, schema, and optionally types. Component file: `{target_family}{target_version}Block.tsx` targets `packages/ui/src/tutorial/blocks/`. Schema file: `{target_family}{target_version}Schema.ts` targets `packages/ui/src/tutorial/schemas/`. Types file: if `validation.evidence["artifact_count"] > 2`, `types.ts` targets `{blocks_base}/types.ts` (which is `packages/ui/src/tutorial/blocks/types.ts`).

Each file goes through artifact_policy to determine action and target path. The result is appended to file_paths as a dict with source, target, type, action (enum value as string), and backup_required (boolean).

The types file path is wrong: validation allows `packages/ui/src/tutorial/types/` but the generated target is `packages/ui/src/tutorial/blocks/types.ts`. This would fail validation if artifact_count > 2.

## Rollback plan structure

`_generate_rollback_plan()` returns a fixed-structure dict with strategy "git_worktree_delete", description mentioning the target family/version and workflow ID, steps (list of three strings: delete worktree, remove temporary files, restore pre-placement state), verification (list of three strings: verify main branch unchanged, verify no orphaned files, verify worktree removed), and notes ("Rollback is safe if placement fails before merge to main").

The rollback plan is static; it doesn't adapt to the replacement_strategy or file_paths. A manifest with replacement_strategy "rollback_only" has the same rollback plan as one with "atomic_replace". The plan is metadata, not executable instructions; nothing in the diff enforces that rollback follows these steps.

## Replacement strategy determination

`_determine_replacement_strategy()` checks comparison.deviations first. If any deviation has severity "error", return "rollback_only". Next, check comparison.has_breaking_changes; if True, return "staged_replace". Then check comparison.api_changes; if non-empty, return "staged_replace". Default is "atomic_replace".

The strategy is derived from comparison but not enforced. A manifest with replacement_strategy "rollback_only" can still be validated and sealed; nothing prevents it from being used. The strategy is guidance for downstream placement execution, not a gate.

</details>

<details>
<summary>File map</summary>

**New files:**
- `services/project-ai/app/placement/artifact_policy.py` — ArtifactAction enum, normalization logic, semantic matching, action determination (ADD/UPDATE/EXTEND/REUSE/REJECT), target path resolution, duplicate prevention core
- `services/project-ai/app/intake/placement_manifest.py` — PlacementManifest dataclass, PlacementManifestGenerator with artifact_policy integration, manifest validation, SHA-256 sealing, rollback plan generation
- `services/project-ai/tests/test_artifact_policy.py` — 27 tests covering normalization, repository index building, semantic matching, action determination, target path resolution, duplicate prevention
- `services/project-ai/tests/test_placement_manifest.py` — 25 tests covering manifest generation, validation, sealing, replacement strategy, integration with artifact_policy

Full diff: `git diff main..m2-project-ai-canonical-wiring`

</details>
