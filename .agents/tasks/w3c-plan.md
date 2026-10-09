# Implementation Plan: M2.9 Wave 3C — Placement Manifest Integration

**Branch:** m2-project-ai-canonical-wiring  
**Task:** Integrate canonical artifact policy into placement manifest generation  
**Target:** services/project-ai/app/placement/

---

## Implementation Steps

- [ ] 1. Create `services/project-ai/app/placement/artifact_policy.py` implementing ADD/REUSE/EXTEND/UPDATE/REJECT action logic with repository matching.
      
      **What to do:**
      - Create new Python module `artifact_policy.py` in `services/project-ai/app/placement/`
      - Import `PlacementDecision` from `app.models.candidate` (existing enum with ADD/UPDATE/EXTEND/REUSE/REJECT)
      - Implement `normalize_artifact_name(filename: str) -> str` function that strips version suffixes (V2, v2, _v2) and extensions, returning base name (e.g., "ObjectiveBlockV2.tsx" → "ObjectiveBlock")
      - Implement `RepositoryArtifact` dataclass with fields: `path: str`, `base_name: str`, `content_hash: str`, `artifact_type: str`
      - Implement `find_semantic_match(candidate_filename: str, repository_index: List[RepositoryArtifact]) -> Optional[RepositoryArtifact]` that normalizes candidate filename and matches against normalized base_name in repository index
      - Implement `determine_action(candidate_content: str, candidate_filename: str, repository_match: Optional[RepositoryArtifact]) -> PlacementDecision`:
        * No match → ADD
        * Match with identical hash → REUSE
        * Match with variant indicator (.variant., -variant.) → EXTEND
        * Match with different content → UPDATE
        * Quality/compatibility issue → REJECT
      - Implement `build_repository_index(snapshot: Dict[str, Any]) -> List[RepositoryArtifact]` that extracts artifacts from snapshot['evidence'], computing base_name for each via normalize_artifact_name
      - Add comprehensive docstrings explaining duplicate prevention logic
      
      **Files:**
      - Create: `services/project-ai/app/placement/artifact_policy.py`
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_artifact_policy.py -v
      ```
      Expected: Unit tests for normalize_artifact_name, find_semantic_match, determine_action pass (will create tests in step 6).

- [ ] 2. Wire `artifact_policy.py` into existing placement manifest generator so each artifact gets action determined by repository match.
      
      **What to do:**
      - Open `services/project-ai/app/intake/placement_manifest.py` (existing manifest generator from Wave 3 Phase 2C)
      - Import `artifact_policy` module: `from app.placement import artifact_policy`
      - Modify `PlacementManifestGenerator.generate()` method:
        * Load discovery snapshot via discovery_client (already available in codebase at `app.repository.discovery_client`)
        * Call `artifact_policy.build_repository_index(snapshot)` to get repository artifacts
        * For each candidate file in validation result, call `artifact_policy.determine_action()` to get placement decision
        * Replace hardcoded decision logic with action from artifact_policy
        * Set manifest.decision to the determined action
        * Store repository match evidence in manifest for audit trail
      - Ensure manifest still computes SHA-256 seal after all fields populated (existing logic preserved)
      - Add snapshot_path parameter to PlacementManifestGenerator.__init__() to pass discovery snapshot location
      
      **Files:**
      - Modify: `services/project-ai/app/intake/placement_manifest.py`
      - Modify: `services/project-ai/app/placement/__init__.py` (add artifact_policy exports)
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_placement_manifest.py -v -k "test_generate_manifest"
      ```
      Expected: Existing manifest generation tests pass with new action determination logic.

- [ ] 3. Implement duplicate prevention: never create ObjectiveBlockV2.tsx when ObjectiveBlock.tsx exists (generalize the pattern).
      
      **What to do:**
      - In `artifact_policy.py`, ensure `normalize_artifact_name()` handles all version suffix patterns:
        * Uppercase: V2, V3, V10
        * Lowercase: v2, v3
        * Underscore prefix: _v2, _V2, _v3
        * Mixed case edge cases
      - In `find_semantic_match()`, add validation that prevents creating new file when semantic match exists
      - Add `get_target_path(action: PlacementDecision, candidate_path: str, repository_match: Optional[RepositoryArtifact]) -> str` function:
        * ADD → use candidate_path
        * UPDATE → use repository_match.path
        * EXTEND → use repository_match.path (adds to existing family)
        * REUSE → use repository_match.path
        * REJECT → empty string
      - Integrate get_target_path into manifest generation so target paths always point to canonical locations
      - Add explicit check: if action is UPDATE or REUSE or EXTEND, target_path MUST be repository_match.path, not candidate_path
      
      **Files:**
      - Modify: `services/project-ai/app/placement/artifact_policy.py`
      - Modify: `services/project-ai/app/intake/placement_manifest.py`
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_artifact_policy.py -v -k "duplicate"
      ```
      Expected: Test showing ObjectiveBlockV2.tsx maps to UPDATE action with target_path = "existing/ObjectiveBlock.tsx" passes.

- [ ] 4. Add manifest validation: all artifacts have actions, no REJECT actions pass through, safe paths only, target version matches.
      
      **What to do:**
      - In `placement_manifest.py`, add `validate_manifest(manifest: PlacementManifest) -> Tuple[bool, List[str]]` function:
        * Check all artifacts in manifest have non-empty action field
        * Check no artifact has action=REJECT (REJECT candidates should not be in approved manifests)
        * Check all target_path values are relative paths (no absolute paths, no '../' traversal)
        * Check all target_path values start with allowed prefixes from `RepositoryAdapter.ALLOWED_TARGET_DIRS`
        * Check manifest.blockVersion matches target_binding.target_version
        * Check manifest.blockFamily matches target_binding.target_family
        * Return (is_valid: bool, errors: List[str])
      - Call validate_manifest() at end of PlacementManifestGenerator.generate() before returning manifest
      - If validation fails, raise `PlacementExecutionError` with error list
      - Ensure rejected artifacts are recorded in separate field (manifest.rejected_artifacts) and not included in placements
      
      **Files:**
      - Modify: `services/project-ai/app/intake/placement_manifest.py`
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_placement_manifest.py -v -k "validation"
      ```
      Expected: Tests for path traversal detection, REJECT filtering, version mismatch detection pass.

- [ ] 5. Add manifest SHA-256 binding: bind manifest hash to workflow output.
      
      **What to do:**
      - Existing manifest generation already computes SHA-256 in `_compute_manifest_seal()` (verified in test_placement_manifest.py)
      - Add `bind_manifest_to_workflow(manifest: PlacementManifest, workflow_id: str) -> Dict[str, Any]` function:
        * Creates binding record with workflow_id, manifest_id, manifest_sha256, timestamp
        * Returns binding dictionary for workflow evidence storage
      - Ensure manifest hash is computed AFTER all fields populated but BEFORE approval status set
      - Add `verify_manifest_integrity(manifest: PlacementManifest, expected_hash: str) -> bool` to detect tampering
      - Integration point: when executor receives manifest, verify hash before execution (already exists in executor.py verify_manifest_hash method, ensure it's called)
      
      **Files:**
      - Modify: `services/project-ai/app/intake/placement_manifest.py`
      - Verify: `services/project-ai/app/placement/executor.py` (already has verify_manifest_hash, ensure it's used)
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_placement_manifest.py -v -k "seal"
      ```
      Expected: Tests showing manifest seal integrity and tamper detection pass (already exist from Wave 3 Phase 2C).

- [ ] 6. Create tests in `services/project-ai/tests/test_artifact_policy.py` covering all action logic, duplicate prevention, and manifest binding.
      
      **What to do:**
      - Create `services/project-ai/tests/test_artifact_policy.py` following pytest patterns from existing test files
      - Test normalize_artifact_name with cases: "ObjectiveBlockV2.tsx", "ObjectiveBlock_v3.tsx", "ObjectiveBlockv2.tsx", "ObjectiveBlock.variant.tsx"
      - Test find_semantic_match with:
        * Exact match (same base name)
        * No match (different base name)
        * Version suffix match (ObjectiveBlockV2 → ObjectiveBlock)
      - Test determine_action with:
        * No repository match → ADD
        * Match with identical hash → REUSE
        * Match with variant indicator → EXTEND
        * Match with different content → UPDATE
        * Quality criteria fail → REJECT
      - Test duplicate prevention: ObjectiveBlockV2.tsx with existing ObjectiveBlock.tsx → UPDATE action with target_path pointing to existing file
      - Test build_repository_index with mock snapshot evidence
      - All tests must use real validation logic (no mocked PASS without evidence)
      
      **Files:**
      - Create: `services/project-ai/tests/test_artifact_policy.py`
      - Modify: `services/project-ai/tests/test_placement_manifest.py` (extend with integration tests using artifact_policy)
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_artifact_policy.py tests/test_placement_manifest.py -v
      ```
      Expected: All new tests pass (20+ tests covering artifact_policy + placement_manifest integration).

- [ ] 7. Update existing tests in `services/project-ai/tests/test_placement.py` to use artifact_policy for action determination.
      
      **What to do:**
      - Review `services/project-ai/tests/test_placement.py` (existing tests for Wave 2 placement logic)
      - Update tests that mock placement decisions to use artifact_policy.determine_action()
      - Ensure tests for PlacementExecutor still pass with new manifest structure
      - Verify tests for canonical comparison (CanonicalComparator) still work with artifact_policy integration
      - Fix any broken tests due to signature changes in placement_manifest.py
      - Add integration test: end-to-end flow from candidate upload → validation → comparison → manifest generation with artifact_policy → execution
      
      **Files:**
      - Modify: `services/project-ai/tests/test_placement.py`
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/test_placement.py -v
      ```
      Expected: All 40+ existing placement tests pass with artifact_policy integration.

- [ ] 8. Run full test suite to ensure no regressions in existing functionality.
      
      **What to do:**
      - Run complete test suite for project-ai service
      - Fix any import errors or signature mismatches
      - Ensure all test files pass:
        * tests/test_artifact_policy.py (new)
        * tests/test_placement_manifest.py (modified)
        * tests/test_placement.py (modified)
        * tests/test_canonical_comparator.py (existing)
        * tests/test_candidate_validator.py (existing)
        * All other existing test files
      - Verify test count: should be 220+ tests passing (was 220 after M2 Phase 4, adding ~20 new tests)
      - Check for any warnings about deprecated imports or API changes
      
      **Files:**
      - All test files in `services/project-ai/tests/`
      
      **Verify:**
      ```bash
      cd services/project-ai
      python -m pytest tests/ -v --tb=short
      ```
      Expected: 240+ tests passing, 0 failures, 0 errors.

- [ ] 9. Commit changes with message 'feat(project-llm): integrate canonical artifact policy'.
      
      **What to do:**
      - Stage all modified and new files:
        * `services/project-ai/app/placement/artifact_policy.py` (new)
        * `services/project-ai/app/placement/__init__.py` (modified exports)
        * `services/project-ai/app/intake/placement_manifest.py` (modified)
        * `services/project-ai/tests/test_artifact_policy.py` (new)
        * `services/project-ai/tests/test_placement_manifest.py` (modified)
        * `services/project-ai/tests/test_placement.py` (modified)
      - Create commit with conventional commit format: `feat(project-llm): integrate canonical artifact policy`
      - Commit message body:
        ```
        - Create artifact_policy.py with ADD/REUSE/EXTEND/UPDATE/REJECT logic
        - Wire artifact policy into placement manifest generator
        - Implement duplicate prevention (ObjectiveBlockV2.tsx → UPDATE ObjectiveBlock.tsx)
        - Add manifest validation: reject REJECT actions, validate paths and versions
        - Bind manifest SHA-256 hash to workflow for tamper detection
        - Add comprehensive test coverage (60+ tests total)
        
        Refs: M2.9 Wave 3C canonical artifact policy integration
        ```
      - Do NOT push yet (will push in step 10)
      
      **Files:**
      - All modified/created files in services/project-ai/
      
      **Verify:**
      ```bash
      git status
      git log -1 --stat
      ```
      Expected: Commit created with all changed files staged, message follows conventional commit format.

- [ ] 10. Push to origin/m2-project-ai-canonical-wiring and write evidence to `.agents/tasks/w3c-placement-manifest-report.json`.
      
      **What to do:**
      - Push commit to remote branch: `git push origin m2-project-ai-canonical-wiring`
      - Create evidence report JSON file at `e:\onlinewebsites\quiz-platform\.agents\tasks\w3c-placement-manifest-report.json`
      - Report structure:
        ```json
        {
          "wave": "M2.9 Wave 3C",
          "task": "Placement Manifest Integration",
          "status": "COMPLETED",
          "branch": "m2-project-ai-canonical-wiring",
          "commit_hash": "<git rev-parse HEAD>",
          "completion_timestamp": "<ISO 8601 timestamp>",
          "files_created": [
            "services/project-ai/app/placement/artifact_policy.py",
            "services/project-ai/tests/test_artifact_policy.py"
          ],
          "files_modified": [
            "services/project-ai/app/placement/__init__.py",
            "services/project-ai/app/intake/placement_manifest.py",
            "services/project-ai/tests/test_placement_manifest.py",
            "services/project-ai/tests/test_placement.py"
          ],
          "test_results": {
            "total_tests": 240,
            "passed": 240,
            "failed": 0,
            "coverage": "artifact_policy: 100%, placement_manifest: 95%"
          },
          "key_features": [
            "ADD/REUSE/EXTEND/UPDATE/REJECT action determination",
            "Duplicate prevention via semantic matching",
            "Manifest validation (paths, versions, reject filtering)",
            "SHA-256 manifest binding for tamper detection"
          ],
          "verification_evidence": {
            "duplicate_prevention_test": "ObjectiveBlockV2.tsx → UPDATE ObjectiveBlock.tsx",
            "manifest_validation_test": "Path traversal rejected, REJECT actions filtered",
            "hash_binding_test": "Manifest seal verified, tampering detected"
          }
        }
        ```
      - Compute actual commit hash: `git rev-parse HEAD`
      - Get test results: `python -m pytest tests/ --tb=no -q` and capture output
      
      **Files:**
      - Create: `e:\onlinewebsites\quiz-platform\.agents\tasks\w3c-placement-manifest-report.json`
      
      **Verify:**
      ```bash
      git log origin/m2-project-ai-canonical-wiring -1 --oneline
      cat .agents/tasks/w3c-placement-manifest-report.json
      ```
      Expected: Branch pushed to origin, evidence report JSON exists with all required fields populated.

---

## Verification Summary

After completing all steps, the following should be true:

1. **artifact_policy.py exists** with normalize_artifact_name, find_semantic_match, determine_action, build_repository_index functions
2. **placement_manifest.py wired** to artifact_policy for action determination
3. **Duplicate prevention works**: ObjectiveBlockV2.tsx maps to UPDATE action with target_path pointing to existing ObjectiveBlock.tsx
4. **Manifest validation enforced**: REJECT actions filtered, paths validated, versions checked
5. **SHA-256 binding implemented**: manifest hash computed and verified
6. **Tests comprehensive**: 240+ tests passing covering all artifact_policy logic
7. **Commit created**: conventional commit format with descriptive message
8. **Branch pushed**: m2-project-ai-canonical-wiring updated on origin
9. **Evidence report**: JSON file with completion timestamp, test results, verification evidence

**Final verification command:**
```bash
cd services/project-ai
python -m pytest tests/ -v --tb=short | grep -E "(PASSED|FAILED|ERROR)"
git log -1 --oneline
cat ../.agents/tasks/w3c-placement-manifest-report.json
```

Expected output:
- 240+ tests PASSED
- Commit message: "feat(project-llm): integrate canonical artifact policy"
- Evidence report JSON with status="COMPLETED"
