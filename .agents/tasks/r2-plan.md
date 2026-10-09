# Implementation Plan: R2 - Engineering Contract Derivation Completion

**Task:** Make engineering contract fully repository-derived, not hardcoded

**Branch:** m2-project-ai-canonical-wiring  
**Base:** d2bbdcbc (R0 complete)  
**Workspace:** e:\onlinewebsites\quiz-platform

---

## Problem Statement

The Engineering Contract in `services/project-ai/app/contracts/engineering_contract.py` contains hardcoded values instead of being fully derived from repository snapshot evidence:

**Hardcoded fields in `create_engineering_contract()` (contract.py lines 327-407):**
- `difficulty_level = "intermediate"` (line 335)
- `language = "TypeScript"` (line 338)
- `framework = "React"` (line 339)
- `style = "CSS Modules"` (line 340)
- File paths in `file_structure` dict (lines 341-346)
- Type strictness flags (lines 349-351)
- Test requirements list (lines 399-406)

**Architecture requirement:** All contract fields must be evidence-backed from repository snapshot, NOT assumptions.

---

## Implementation Plan

- [ ] 1. **Audit hardcoded contract fields**
      Create a comprehensive audit document listing every hardcoded value in engineering contract construction vs. snapshot-derived values.
      **Files:**
      - Read: `services/project-ai/app/api/routes/contract.py` (lines 219-470)
      - Read: `services/project-ai/app/contracts/engineering_contract.py`
      - Read: `services/project-ai/app/contracts/repository_intelligence.py`
      - Write: `e:\onlinewebsites\quiz-platform\.agents\tasks\r2-contract-audit.md`
      **Verify:** Audit file exists and contains sections for: (1) currently hardcoded fields, (2) currently snapshot-derived fields, (3) gap analysis, (4) evidence sources needed from snapshot

- [ ] 2. **Implement ContractFieldEvidence model**
      Create Pydantic model to track evidence provenance for each contract field. This provides auditability and debugging capability.
      **Files:**
      - Modify: `services/project-ai/app/contracts/repository_intelligence.py`
        - Add `ContractFieldEvidence` class with fields: `field_name`, `value`, `evidence_source` (snapshot path or "snapshot.metadata"), `evidence_id`, `derived_at` (timestamp)
        - Add `EvidenceBackedContract` base class or mixin that includes `field_evidence: dict[str, ContractFieldEvidence]` to track provenance
      **Verify:** Run `python -m pytest tests/unit/test_repository_intelligence.py -v` - new unit tests for ContractFieldEvidence model pass

- [ ] 3. **Extract repository metadata from snapshot**
      Enhance `build_contract()` in repository_intelligence.py to extract language, framework, style, test patterns from snapshot metadata and evidence.
      **Files:**
      - Modify: `services/project-ai/app/contracts/repository_intelligence.py`
        - Update `build_contract(snapshot, family, version)` to extract:
          - Language from snapshot['metadata']['language'] or evidence file extensions
          - Framework from snapshot['metadata']['framework'] or package.json dependencies
          - Style approach from snapshot evidence (look for .module.css, styled-components, etc.)
          - Difficulty level from block complexity heuristics or snapshot metadata
          - Test patterns from existing test files in snapshot evidence
        - Return these in RepositoryBlockContract with evidence IDs
      **Verify:** Run `python -m pytest tests/unit/test_repository_intelligence.py::test_build_contract_extracts_metadata -v` - test passes showing metadata extraction from snapshot

- [ ] 4. **Derive file paths from snapshot structure**
      Replace hardcoded file path patterns with paths derived from snapshot evidence and project structure conventions.
      **Files:**
      - Modify: `services/project-ai/app/contracts/repository_intelligence.py`
        - Add `derive_file_paths(snapshot, family, version)` function that:
          - Searches snapshot evidence for existing block files matching family/version pattern
          - Extracts directory structure conventions from existing blocks
          - Generates expected paths following discovered conventions
          - Returns dict with component, schema, types, tests paths AND evidence IDs
        - Update `build_contract()` to call this function and include results in contract
      **Verify:** Run `python -m pytest tests/unit/test_repository_intelligence.py::test_derive_file_paths -v` - test passes showing paths derived from snapshot structure

- [ ] 5. **Replace hardcoded contract construction**
      Refactor `create_engineering_contract()` to use evidence-backed values from repository intelligence instead of hardcoded strings.
      **Files:**
      - Modify: `services/project-ai/app/api/routes/contract.py` (lines 327-407)
        - Replace `difficulty_level: "intermediate"` with value from `repo_contract.difficulty_level`
        - Replace `language: "TypeScript"` with value from `repo_contract.language`
        - Replace `framework: "React"` with value from `repo_contract.framework`
        - Replace `style: "CSS Modules"` with value from `repo_contract.style`
        - Replace hardcoded `file_structure` dict with `repo_contract.file_paths`
        - Replace hardcoded type strictness with values from `repo_contract.type_strictness`
        - Replace hardcoded `tests_required` list with `repo_contract.test_requirements`
        - Remove all hardcoded default values - use only repo_contract data
      **Verify:** Run `python -m pytest tests/integration/test_w2_contract_generation.py::TestW2ContractGenerationWithRealW1BWiring -v` - all tests pass with snapshot-derived values

- [ ] 6. **Implement deterministic contract sealing**
      Rename `calculate_contract_hash()` to `seal_contract()` and ensure it produces deterministic SHA-256 hash excluding contract_id field (contract_hash already excluded).
      **Files:**
      - Modify: `services/project-ai/app/contracts/engineering_contract.py`
        - Rename `calculate_contract_hash()` to `seal_contract()`
        - Update docstring to clarify: "Seals contract with deterministic SHA-256 hash excluding contract_id and contract_hash"
        - Verify exclude parameter: `exclude={"contract_id", "contract_hash"}` (currently only excludes contract_hash)
        - Add comment explaining why contract_id is excluded: "contract_id is a unique identifier, not part of contract content"
        - Ensure JSON serialization uses `sort_keys=True` for determinism (already implemented)
      - Update all imports:
        - `services/project-ai/app/api/routes/contract.py`: update import and call sites (3 locations)
        - `services/project-ai/tests/unit/test_engineering_contract.py`: update import and 15 call sites
        - `services/project-ai/tests/unit/test_contract_routes.py`: update import and call sites
        - `services/project-ai/tests/integration/test_w2_contract_generation.py`: update import and 5 call sites
        - `services/project-ai/tests/e2e/test_m2_9_golden_e2e.py`: update import and 2 call sites
      **Verify:** Run `python -m pytest tests/unit/test_engineering_contract.py::TestContractHash -v` - all hash tests pass with new seal_contract name and contract_id exclusion

- [ ] 7. **Add evidence traceability tests**
      Write comprehensive tests verifying contract immutability, evidence traceability, and snapshot determinism.
      **Files:**
      - Modify: `services/project-ai/tests/unit/test_engineering_contract.py`
        - Add `test_same_snapshot_produces_same_hash()`: verify identical snapshot → identical hash
        - Add `test_modified_snapshot_produces_different_hash()`: verify changed snapshot → different hash
        - Add `test_all_contract_fields_have_evidence()`: verify every non-default field has evidence entry
        - Add `test_no_hardcoded_values_in_contract()`: verify no string literals like "intermediate", "TypeScript" in contract construction
        - Add `test_seal_contract_excludes_contract_id()`: verify contract_id exclusion from hash
      - Create: `services/project-ai/tests/unit/test_contract_evidence.py`
        - Add `test_contract_field_evidence_model()`: test ContractFieldEvidence construction
        - Add `test_evidence_provenance_tracking()`: verify evidence chain from snapshot to contract field
        - Add `test_missing_evidence_raises_error()`: verify contract generation blocks when required evidence missing
      **Verify:** Run `python -m pytest tests/unit/test_engineering_contract.py tests/unit/test_contract_evidence.py -v` - all new tests pass

- [ ] 8. **Update integration tests for evidence-backed contracts**
      Update existing integration tests to verify evidence-backed contract generation end-to-end.
      **Files:**
      - Modify: `services/project-ai/tests/integration/test_w2_contract_generation.py`
        - Update mock_snapshot fixture to include metadata fields (language, framework, difficulty)
        - Update all test assertions to verify snapshot-derived values, not hardcoded expectations
        - Add `test_contract_reflects_snapshot_metadata()`: verify metadata propagates from snapshot to contract
        - Add `test_contract_generation_fails_without_evidence()`: verify graceful failure when evidence missing
      **Verify:** Run `python -m pytest tests/integration/test_w2_contract_generation.py -v` - all integration tests pass with evidence-backed contracts

- [ ] 9. **Add deterministic serialization test**
      Ensure contract serialization is deterministic (same contract → same JSON → same hash) across Python versions and runs.
      **Files:**
      - Create: `services/project-ai/tests/unit/test_contract_serialization.py`
        - Add `test_contract_serialization_deterministic()`: create contract, serialize 10 times, verify identical output
        - Add `test_contract_hash_stable_across_runs()`: create identical contracts in loop, verify identical hashes
        - Add `test_json_key_ordering()`: verify JSON keys are sorted (required for determinism)
        - Add `test_unicode_handling()`: verify unicode strings serialize consistently
      **Verify:** Run `python -m pytest tests/unit/test_contract_serialization.py -v` - all serialization determinism tests pass

- [ ] 10. **Commit and push changes**
       Commit all changes with descriptive message following conventional commit format.
       **Files:** All modified files from steps 2-9
       **Commands:**
       ```bash
       git add services/project-ai/app/contracts/engineering_contract.py
       git add services/project-ai/app/contracts/repository_intelligence.py
       git add services/project-ai/app/api/routes/contract.py
       git add services/project-ai/tests/unit/test_engineering_contract.py
       git add services/project-ai/tests/unit/test_contract_evidence.py
       git add services/project-ai/tests/unit/test_contract_serialization.py
       git add services/project-ai/tests/unit/test_repository_intelligence.py
       git add services/project-ai/tests/integration/test_w2_contract_generation.py
       git add .agents/tasks/r2-contract-audit.md
       git commit -m "fix(project-llm): make engineering contract fully repository-derived [R2]

- Replace hardcoded difficulty_level, language, framework with snapshot-derived values
- Add ContractFieldEvidence model for evidence traceability
- Extract repository metadata from snapshot in build_contract()
- Derive file paths from snapshot structure, not hardcoded patterns
- Rename calculate_contract_hash() to seal_contract() for clarity
- Exclude contract_id from hash calculation for determinism
- Add comprehensive tests for evidence traceability and determinism
- Update all imports and test files for seal_contract rename

Closes R2 - Engineering Contract Derivation Completion"
       git push origin m2-project-ai-canonical-wiring
       ```
       **Verify:** 
       - Run `git log -1 --oneline` - shows commit with correct message
       - Run `git diff origin/m2-project-ai-canonical-wiring` - shows no uncommitted changes
       - Check GitHub/GitLab - commit appears on branch with all modified files

---

## Verification Strategy

**After each step:**
- Run relevant unit tests: `python -m pytest tests/unit/test_*.py -v -k <test_pattern>`
- Run integration tests: `python -m pytest tests/integration/ -v`

**Before commit (step 10):**
- Run full test suite: `python -m pytest tests/ -v`
- Verify no hardcoded strings in contract construction: `grep -n "intermediate\|TypeScript\|React\|CSS Modules" services/project-ai/app/api/routes/contract.py` (should find none in contract construction)
- Verify seal_contract works: `python -c "from app.contracts.engineering_contract import seal_contract; print('OK')"`

**After push:**
- Verify CI/CD pipeline passes (if configured)
- Verify all tests pass on remote branch

---

## Dependencies

- Python 3.11+
- pytest >= 8.0.0
- pydantic >= 2.7.0
- Repository snapshot from TypeScript discovery (snapshot.json)

---

## Risk Mitigation

1. **Snapshot structure changes:** If snapshot structure differs from expected, add defensive checks and fallbacks
2. **Missing evidence:** Implement graceful degradation with clear error messages indicating which evidence is missing
3. **Test failures:** If existing tests expect hardcoded values, update test assertions to match snapshot-derived values
4. **Hash instability:** If hash changes unexpectedly, verify JSON serialization is deterministic (sort_keys=True, consistent encoding)

---

## Success Criteria

✅ All contract fields derived from snapshot evidence, zero hardcoded values  
✅ ContractFieldEvidence model tracks provenance for every field  
✅ seal_contract() produces deterministic SHA-256 excluding contract_id and contract_hash  
✅ All existing tests pass with updated contract construction  
✅ New tests verify: evidence traceability, determinism, missing evidence handling  
✅ Commit pushed to branch with conventional commit message  
✅ No grep matches for hardcoded "intermediate", "TypeScript", "React" in contract construction

