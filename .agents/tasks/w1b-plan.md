# Implementation Plan: Repository Intelligence Service Enhancement (Wave 1B)

## Context

Wave 0 established the canonical workflow authority freeze. Wave 1B enhances the existing `app/contracts/repository_intelligence.py` module to extract comprehensive block contract metadata from repository evidence, replacing hardcoded fixtures with derived canonical contracts.

**Base Branch**: `m2-project-ai-canonical-wiring` (base commit: 5acbd7b3, Wave 0 complete)

**Architecture Rule**: Python NEVER scans repository files directly. All data comes from TypeScript snapshot evidence.

## Key Findings from Exploration

1. **Existing module**: `app/contracts/repository_intelligence.py` already has `RepositoryBlockContract`, `CanonicalReference`, `RuntimeContract`, and `build_contract()` function
2. **Canonical blocks** (I1/C1/D1) at:
   - `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx` (I1)
   - `packages/ui/src/tutorial/blocks/CodeC1Block.tsx` (C1)
   - `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx` (D1)
3. **UBRC attributes** in TSX: `data-block-id`, `data-block-type`, `data-block-version`
4. **Runtime context**: `TutorialBlockRuntimeContext` interface defined in `packages/ui/src/tutorial/types.ts` with fields: `learnerId`, `navigationNodeId`, `sectionId`, `blockId`, `blockType`, `blockVersion`, `subtopicId`
5. **Theme system**: `DomainTheme` interface with `primary`, `secondary`, `primaryDark`, and semantic color scales (slate, gray, blue, emerald, amber, rose, teal)
6. **Test framework**: pytest with `pytest-asyncio`, tests in `services/project-ai/tests/`
7. **Build command**: `pytest services/project-ai/tests/` (from pyproject.toml dev dependencies)

---

## Implementation Steps

### 1. Enhance `RepositoryEvidence` model to capture block metadata

**What**: Add fields to `RepositoryEvidence` in `app/contracts/repository_intelligence.py` to capture UBRC attributes, theme requirements, and ILS/LSNB/RSSB integration.

**Files**: `services/project-ai/app/contracts/repository_intelligence.py`

**Changes**:
- Add optional fields to `RepositoryEvidence`: `ubrc_attributes`, `theme_props`, `runtime_context_fields`, `ils_passive`, `lsnb_page_level`, `rssb_page_level`
- Update docstrings to reflect these are derived from TypeScript snapshot evidence, not direct file scanning

**Verify**: Run `pytest services/project-ai/tests/unit/test_canonical_contracts.py` (will create in step 3) - imports succeed, models instantiate correctly

---

### 2. Implement `discover_canonical_blocks()` function

**What**: Create function that extracts all canonical_block evidence from snapshot for a given family (Introduction, Code, Definition).

**Files**: `services/project-ai/app/contracts/repository_intelligence.py`

**Function Signature**:
```python
def discover_canonical_blocks(snapshot: Dict[str, Any], family: str) -> List[CanonicalReference]
```

**Logic**:
- Filter `snapshot['evidence']` where `kind == 'canonical_block'`
- Match against known block patterns:
  - `("Introduction", "I1")` → `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
  - `("Code", "C1")` → `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
  - `("Definition", "D1")` → `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- Extract `contentHash` (SHA-256), `evidenceId`, `path` from snapshot evidence
- Return list of `CanonicalReference` objects with populated `RepositoryEvidence`

**Verify**: Unit test (step 3) confirms function extracts correct evidence from mock snapshot

---

### 3. Implement `analyze_block_patterns()` function

**What**: Parse TypeScript AST or source text from snapshot evidence to extract UBRC attributes, theme usage, and runtime context patterns.

**Files**: `services/project-ai/app/contracts/repository_intelligence.py`

**Function Signature**:
```python
def analyze_block_patterns(snapshot: Dict[str, Any], family: str, version: str) -> Dict[str, Any]
```

**Logic**:
- Locate canonical block evidence for (family, version) from snapshot
- If snapshot evidence includes `sourceText` or `metadata` fields, parse for:
  - UBRC attributes: `data-block-id`, `data-block-type`, `data-block-version` 
  - Theme props: `theme.primary`, `theme.secondary`, `theme.primaryDark`
  - Runtime context: `runtimeContext?.blockId`, `runtimeContext?.blockType`, etc.
  - ILS/LSNB/RSSB references in code
- Return dict with keys: `ubrc_required`, `theme_props`, `runtime_context_fields`, `ils_passive`, `lsnb_page_level`, `rssb_page_level`
- If source text not available in snapshot, return sensible defaults based on known canonical patterns (I1/C1/D1 all require UBRC, theme, passive ILS, page-level LSNB/RSSB)

**Verify**: Unit test confirms function extracts correct patterns from mock evidence with representative TSX snippets

---

### 4. Enhance `build_repository_contract()` function

**What**: Refactor existing `build_contract()` to use `discover_canonical_blocks()` and `analyze_block_patterns()` instead of hardcoded patterns.

**Files**: `services/project-ai/app/contracts/repository_intelligence.py`

**Changes**:
- Replace inline block pattern matching with call to `discover_canonical_blocks(snapshot, family)`
- Add call to `analyze_block_patterns(snapshot, family, version)` to populate runtime contract fields
- Update `RuntimeContract` instantiation to use derived values, not hardcoded `True` defaults
- Preserve backward compatibility: if snapshot lacks detailed evidence, fall back to canonical defaults for I1/C1/D1
- Update docstring: "This function derives block contracts from TypeScript snapshot evidence. ARCHITECTURAL BOUNDARY: never scans repository files."

**Verify**: Run existing tests in `services/project-ai/tests/` - all passing tests remain passing

---

### 5. Create comprehensive unit tests

**What**: Create unit tests for the three new/enhanced functions.

**Files**: `services/project-ai/tests/unit/test_repository_intelligence.py`

**Test Coverage**:
- `test_discover_canonical_blocks_i1()`: Mock snapshot with IntroductionBlock evidence, verify extraction
- `test_discover_canonical_blocks_c1()`: Mock snapshot with CodeC1Block evidence, verify extraction  
- `test_discover_canonical_blocks_d1()`: Mock snapshot with DefinitionBlock evidence, verify extraction
- `test_discover_canonical_blocks_missing()`: Empty snapshot, verify graceful handling (empty list)
- `test_analyze_block_patterns_with_source()`: Mock evidence with TSX source text, verify UBRC/theme/ILS extraction
- `test_analyze_block_patterns_without_source()`: Mock evidence without source, verify fallback defaults
- `test_build_repository_contract_enhanced()`: Full integration test with snapshot evidence, verify complete contract
- `test_build_repository_contract_backward_compat()`: Verify legacy behavior preserved when snapshot lacks detailed evidence

**Test Pattern**: Follow existing pattern from `services/project-ai/tests/test_evidence.py`:
```python
import pytest
from unittest.mock import MagicMock
from app.contracts.repository_intelligence import discover_canonical_blocks, analyze_block_patterns, build_contract
```

**Verify**: Run `pytest services/project-ai/tests/unit/test_repository_intelligence.py -v` - all tests pass

---

### 6. Update `__init__.py` exports

**What**: Ensure new functions are exported from the contracts module.

**Files**: `services/project-ai/app/contracts/__init__.py`

**Changes**:
- Add exports: `discover_canonical_blocks`, `analyze_block_patterns` (if not already exported)
- Verify `build_contract` export exists

**Verify**: Run `python -c "from app.contracts import discover_canonical_blocks, analyze_block_patterns, build_contract; print('OK')"` from `services/project-ai/` - prints "OK"

---

### 7. Integration test with mock snapshot

**What**: Create integration test that simulates complete flow from snapshot evidence to contract.

**Files**: `services/project-ai/tests/integration/test_repository_intelligence_integration.py`

**Test Scenario**:
- Create mock snapshot with evidence for all three blocks (I1, C1, D1) including `contentHash`, `evidenceId`, `path`, and minimal `sourceText` with UBRC attributes
- Call `build_contract(snapshot, "Introduction", "I1")`
- Verify returned `RepositoryBlockContract` has:
  - Correct `family`, `version`, `block_type`
  - Non-empty `references` list with valid evidence
  - `runtime.ub_rc_required == True`
  - `runtime.passive_ils == True`
  - `runtime.page_level_lsnb == True`
  - `runtime.page_level_rssb == True`
  - `runtime.theme_injected == True`
  - `runtime.brand_independent == True`
  - Populated `renderer_contract`, `composer_contract`, `schema_contract`
  - Non-empty `acceptance_criteria` list
- Repeat for C1 and D1

**Verify**: Run `pytest services/project-ai/tests/integration/test_repository_intelligence_integration.py -v` - all tests pass

---

### 8. Documentation update

**What**: Update module docstring and function docstrings to reflect Wave 1B enhancements.

**Files**: `services/project-ai/app/contracts/repository_intelligence.py`

**Changes**:
- Module docstring: Add "Wave 1B: Enhanced to derive canonical block contracts from TypeScript snapshot evidence, extracting UBRC attributes, theme requirements, ILS/LSNB/RSSB integration patterns."
- Document that `discover_canonical_blocks()`, `analyze_block_patterns()`, and `build_contract()` form the three-tier intelligence pipeline
- Update `build_contract()` docstring with examples showing (family, version) → contract mapping for I1/C1/D1

**Verify**: Run `python -m pydoc app.contracts.repository_intelligence` from `services/project-ai/` - renders without errors, shows updated docstrings

---

### 9. Run full test suite

**What**: Verify all existing tests still pass with enhanced implementation.

**Files**: All test files in `services/project-ai/tests/`

**Command**: `pytest services/project-ai/tests/ -v --tb=short`

**Expected**: All tests pass (or failures are pre-existing, not introduced by this wave)

**Verify**: Test run completes with 0 new failures

---

### 10. Commit with Wave 1B evidence

**What**: Commit the changes following project conventions.

**Files**: All modified files from steps 1-8

**Commit Message**:
```
M2.9 W1B: Enhance RepositoryIntelligenceService with derived canonical contracts

- Implement discover_canonical_blocks() to extract I1/C1/D1 evidence from snapshot
- Implement analyze_block_patterns() to parse UBRC/theme/ILS patterns
- Enhance build_contract() to use derived evidence, not hardcoded fixtures
- Add comprehensive unit tests in tests/unit/test_repository_intelligence.py
- Add integration tests in tests/integration/test_repository_intelligence_integration.py
- Preserve architectural boundary: Python reads TypeScript snapshots, never scans files
- Maintains backward compatibility with existing contract consumers

Wave 1B complete - canonical block contracts now derived from repository evidence.
```

**Verify**: `git log -1 --stat` shows commit with expected file changes

---

## Acceptance Criteria

1. **Evidence-driven**: All three canonical blocks (I1, C1, D1) have contracts derived from TypeScript snapshot evidence, not hardcoded defaults
2. **UBRC extraction**: UBRC attributes (data-block-id, data-block-type, data-block-version) correctly identified in block patterns
3. **Theme extraction**: Theme requirements (primary, secondary, semantic scales) correctly identified
4. **Runtime extraction**: ILS/LSNB/RSSB integration patterns correctly identified
5. **Test coverage**: ≥90% coverage for `repository_intelligence.py` module
6. **No regressions**: All existing tests pass
7. **Architectural compliance**: Zero file system reads in production code paths (only snapshot reads)
8. **Backward compatibility**: Legacy `build_contract_legacy()` remains functional for existing test fixtures

---

## Notes

- This is a single-module enhancement, not a multi-feature decomposition
- The existing `repository_intelligence.py` has most infrastructure already
- Main work is adding pattern extraction logic and comprehensive tests
- TypeScript snapshot schema is assumed stable (from Wave 0 discovery service)
- If snapshot evidence lacks source text, sensible defaults for I1/C1/D1 are acceptable (all require UBRC, theme, passive ILS, page-level LSNB/RSSB)
