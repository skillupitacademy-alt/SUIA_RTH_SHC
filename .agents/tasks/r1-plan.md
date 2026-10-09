# Implementation Plan: R1 - Repository Intelligence Consolidation

## Objective
Consolidate two repository intelligence implementations to one snapshot-based architecture. Remove filesystem-scanning version and migrate all callsites to the snapshot-based implementation.

## Architecture Decision
**Keep:** `app/contracts/repository_intelligence.py` (snapshot-based, CORRECT)  
**Remove:** `app/intelligence/repository_intelligence.py` (filesystem-scanning, VIOLATES architecture)

**Rationale:** The architecture rule is "TypeScript discovery → snapshot → Python consumption." The contracts version correctly consumes TypeScript snapshots without filesystem access, while the intelligence version violates this boundary by scanning files directly.

## Implementation Steps

- [ ] 1. **Add fail-closed logic to `build_contract` in `app/contracts/repository_intelligence.py`**
      
      Create new exception class `RepositoryEvidenceBlocked` and add validation to `build_contract()` to raise it when:
      - Unknown block version requested (not I1, C1, or D1)
      - No evidence found in snapshot for the requested family/version
      - Snapshot missing or empty evidence array
      - Evidence missing required fields (contentHash, evidenceId)
      
      This ensures the system fails closed when evidence is missing rather than returning empty contracts.
      
      **Files:**
      - `services/project-ai/app/contracts/repository_intelligence.py`
      
      **Changes:**
      - Add `RepositoryEvidenceBlocked(Exception)` class at top of file
      - Modify `build_contract()` to validate snapshot structure and raise `RepositoryEvidenceBlocked` with descriptive messages
      - Validate version is in known set: {"I1", "C1", "D1"}
      - Validate evidence exists in snapshot['evidence'] for the requested block
      - Validate evidence has non-empty contentHash and evidenceId
      
      **Verify:**
      ```bash
      cd services/project-ai
      pytest tests/unit/test_repository_intelligence.py -v -k "test_build_contract"
      ```
      Expected: Tests pass showing fail-closed behavior

- [ ] 2. **Migrate test file from intelligence to contracts namespace**
      
      The test file `tests/intelligence/test_repository_intelligence.py` tests the filesystem-scanning implementation. These tests need to be rewritten to test the snapshot-based implementation or removed if redundant with existing contract tests.
      
      **Files:**
      - `services/project-ai/tests/intelligence/test_repository_intelligence.py` (migrate/remove)
      - `services/project-ai/tests/unit/test_repository_intelligence.py` (expand)
      
      **Changes:**
      - Review tests in `tests/intelligence/test_repository_intelligence.py`
      - Identify which test cases are still relevant (pattern extraction, version detection, etc.)
      - Rewrite relevant tests to use mock snapshot data instead of filesystem scanning
      - Add new tests to `tests/unit/test_repository_intelligence.py` for snapshot-based pattern extraction
      - Delete `tests/intelligence/test_repository_intelligence.py` after migration
      
      **Verify:**
      ```bash
      cd services/project-ai
      pytest tests/unit/test_repository_intelligence.py -v
      ```
      Expected: All tests pass with snapshot-based implementation

- [ ] 3. **Add comprehensive test cases for R1 requirements**
      
      Add new test cases to `tests/unit/test_repository_intelligence.py` covering:
      - Snapshot-based contract generation (mock snapshot → contract)
      - I1/C1/D1 canonical discovery from snapshot evidence
      - Unknown version → RepositoryEvidenceBlocked
      - Missing evidence → RepositoryEvidenceBlocked
      - Stale snapshot detection (if snapshot timestamp older than threshold)
      - No filesystem access validation (ensure no Path operations in production code path)
      - Deterministic output from same snapshot (call build_contract twice, compare results)
      
      **Files:**
      - `services/project-ai/tests/unit/test_repository_intelligence.py`
      
      **Changes:**
      - Add `TestFailClosedBehavior` class with test methods:
        - `test_unknown_version_raises_blocked`
        - `test_missing_evidence_raises_blocked`
        - `test_empty_snapshot_raises_blocked`
        - `test_incomplete_evidence_raises_blocked`
      - Add `TestDeterministicOutput` class with test methods:
        - `test_same_snapshot_same_contract`
        - `test_deterministic_evidence_ids`
      - Add `TestNoFilesystemAccess` class with test method:
        - `test_build_contract_no_file_operations` (verify no Path.exists(), .read_text(), etc.)
      
      **Verify:**
      ```bash
      cd services/project-ai
      pytest tests/unit/test_repository_intelligence.py::TestFailClosedBehavior -v
      pytest tests/unit/test_repository_intelligence.py::TestDeterministicOutput -v
      pytest tests/unit/test_repository_intelligence.py::TestNoFilesystemAccess -v
      ```
      Expected: All new tests pass

- [ ] 4. **Update contract route to handle RepositoryEvidenceBlocked**
      
      The contract generation endpoint in `app/api/routes/contract.py` calls `build_repo_contract()`. Add exception handling to catch `RepositoryEvidenceBlocked` and return HTTP 503 (Service Unavailable) with a clear message.
      
      **Files:**
      - `services/project-ai/app/api/routes/contract.py`
      
      **Changes:**
      - Import `RepositoryEvidenceBlocked` from `app.contracts.repository_intelligence`
      - Wrap `build_repo_contract()` call in try/except block
      - Catch `RepositoryEvidenceBlocked` and raise `HTTPException(status_code=503, detail="Repository evidence missing or incomplete. Run TypeScript discovery scan and retry.")`
      - Add comment explaining why 503 (evidence must be generated before contracts)
      
      **Verify:**
      ```bash
      cd services/project-ai
      pytest tests/unit/test_contract_routes.py -v -k "contract"
      ```
      Expected: Tests pass, including new test for blocked scenario

- [ ] 5. **Add integration test for blocked contract generation**
      
      Add test to `tests/integration/test_w2_contract_generation.py` that verifies contract generation fails gracefully when evidence is missing.
      
      **Files:**
      - `services/project-ai/tests/integration/test_w2_contract_generation.py`
      
      **Changes:**
      - Add new test class `TestContractGenerationBlockedScenarios`
      - Add test method `test_contract_blocked_when_evidence_missing` that:
        - Mocks snapshot with empty evidence array
        - Calls `create_engineering_contract()`
        - Asserts HTTPException 503 raised
        - Verifies error message mentions evidence missing
      - Add test method `test_contract_blocked_with_unknown_version` that:
        - Creates workflow with version="X9" (unknown)
        - Mocks snapshot with valid structure
        - Calls `create_engineering_contract()`
        - Asserts HTTPException 503 raised
      
      **Verify:**
      ```bash
      cd services/project-ai
      pytest tests/integration/test_w2_contract_generation.py::TestContractGenerationBlockedScenarios -v
      ```
      Expected: Both tests pass

- [ ] 6. **Remove filesystem-scanning implementation**
      
      Delete `app/intelligence/repository_intelligence.py` and its test file. Verify no other files import from it.
      
      **Files:**
      - `services/project-ai/app/intelligence/repository_intelligence.py` (delete)
      - `services/project-ai/tests/intelligence/test_repository_intelligence.py` (delete if not already migrated in step 2)
      
      **Changes:**
      - Delete both files
      - Verify grep returns no results for imports from `app.intelligence.repository_intelligence`
      
      **Verify:**
      ```bash
      cd services/project-ai
      grep -r "from app.intelligence.repository_intelligence" . --include="*.py"
      ```
      Expected: No matches found (all imports removed/migrated)

- [ ] 7. **Remove intelligence directory if empty**
      
      After deleting `repository_intelligence.py`, check if `app/intelligence/` directory is empty or only contains `__init__.py`. If so, remove the directory.
      
      **Files:**
      - `services/project-ai/app/intelligence/` (potentially remove)
      - `services/project-ai/tests/intelligence/` (potentially remove)
      
      **Changes:**
      - List contents of both directories
      - If empty or only `__init__.py` exists, delete the directories
      - If other modules exist, leave the directory and just document what remains
      
      **Verify:**
      ```bash
      ls services/project-ai/app/intelligence/
      ls services/project-ai/tests/intelligence/
      ```
      Expected: Directories removed or documented as containing other modules

- [ ] 8. **Run full test suite to verify no regressions**
      
      Run the complete test suite to ensure all changes integrate correctly and no tests are broken by the consolidation.
      
      **Files:**
      - All test files in `services/project-ai/tests/`
      
      **Changes:**
      - None (verification only)
      
      **Verify:**
      ```bash
      cd services/project-ai
      pytest tests/ -v --tb=short
      ```
      Expected: All tests pass (or only pre-existing failures remain)

- [ ] 9. **Update documentation if needed**
      
      Check if `services/project-ai/README.md` or any architecture docs mention the intelligence module. Update references to clarify the single snapshot-based implementation.
      
      **Files:**
      - `services/project-ai/README.md`
      - Any `.md` files in `services/project-ai/docs/` (if they exist)
      
      **Changes:**
      - Search for mentions of "repository_intelligence" or "intelligence" module
      - Update to reflect consolidation to contracts module
      - Add note about architectural boundary: Python consumes TypeScript snapshots only
      
      **Verify:**
      ```bash
      grep -i "intelligence" services/project-ai/README.md
      ```
      Expected: Documentation accurate and reflects current architecture

- [ ] 10. **Commit changes with standardized message**
      
      Stage all changes and commit with the specified commit message.
      
      **Files:**
      - All modified/deleted files from above steps
      
      **Changes:**
      - Git add all changes
      - Commit with message: `fix(project-llm): consolidate repository intelligence to snapshot-based [R1]`
      
      **Verify:**
      ```bash
      git log -1 --oneline
      git diff HEAD~1 --stat
      ```
      Expected: Commit created with correct message, changes include deletions and modifications

## Key Architectural Points

1. **Snapshot Authority**: All repository facts come from TypeScript-generated snapshots at `packages/project-llm-discovery/output/snapshot.json`

2. **No Filesystem Access**: The production code path in `build_contract()` must never call `Path.exists()`, `.read_text()`, `.glob()`, or any filesystem operation on the repository

3. **Fail-Closed**: When evidence is missing, the system raises `RepositoryEvidenceBlocked` rather than returning empty/partial contracts

4. **Deterministic**: Given the same snapshot, `build_contract()` returns identical output (same hashes, same evidence IDs)

5. **Known Versions**: Only I1 (Introduction), C1 (Code), and D1 (Definition) are supported. Other versions raise `RepositoryEvidenceBlocked`

## Testing Strategy

- **Unit tests**: Mock snapshot data, verify contract generation logic
- **Integration tests**: Verify HTTP endpoints handle blocked scenarios correctly
- **Negative tests**: Verify fail-closed behavior with missing/invalid evidence
- **Determinism tests**: Verify same input produces same output

## Files Modified Summary

**Modified:**
- `services/project-ai/app/contracts/repository_intelligence.py` (add fail-closed logic)
- `services/project-ai/app/api/routes/contract.py` (handle RepositoryEvidenceBlocked)
- `services/project-ai/tests/unit/test_repository_intelligence.py` (expand coverage)
- `services/project-ai/tests/integration/test_w2_contract_generation.py` (add blocked scenario tests)
- `services/project-ai/README.md` (update if needed)

**Deleted:**
- `services/project-ai/app/intelligence/repository_intelligence.py`
- `services/project-ai/tests/intelligence/test_repository_intelligence.py`
- `services/project-ai/app/intelligence/` (if empty)
- `services/project-ai/tests/intelligence/` (if empty)

## Rollback Plan

If issues arise:
1. Revert commit: `git revert <commit-sha>`
2. The `build_contract_legacy()` function in contracts version provides backward compatibility during transition
3. Tests remain in place to verify rollback works

## Commit Message

```
fix(project-llm): consolidate repository intelligence to snapshot-based [R1]

- Remove filesystem-scanning implementation from app/intelligence/
- Consolidate to snapshot-based implementation in app/contracts/
- Add fail-closed logic: raise RepositoryEvidenceBlocked when evidence missing
- Add validation for known versions (I1, C1, D1)
- Add contract route handling for blocked scenarios (HTTP 503)
- Add comprehensive test coverage for blocked/missing evidence cases
- Enforce architectural boundary: Python consumes snapshots, never scans repository

BREAKING: Unknown block versions now raise RepositoryEvidenceBlocked
BREAKING: Missing snapshot evidence now raises exception instead of returning empty contracts
```
