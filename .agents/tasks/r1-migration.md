# R1 Migration Report: Repository Intelligence Consolidation

## Migration Date
Task R1 - M2.9 Wave 1B

## Objective
Consolidate two repository intelligence implementations to one snapshot-based architecture by removing filesystem-scanning implementation and strengthening the snapshot-based version.

## Files Archived

### 1. `app/intelligence/repository_intelligence.py` → `.archived`
**Reason:** Violates architectural boundary (Python must not scan repository)

**Functionality Removed:**
- `discover_canonical_blocks()` - dynamic filesystem scanning via `Path.glob()`
- `analyze_block_patterns()` - TSX file reading and regex pattern extraction
- `build_repository_contract()` - combines discovery + analysis
- `_remove_comments()` - TSX comment removal helper

**Why Removed:**
- TypeScript discovery is responsible for repository scanning
- Python must only consume snapshot evidence
- Regex-based TSX parsing is fragile and maintenance-heavy
- Creates race conditions between TypeScript and Python state

### 2. `tests/intelligence/test_repository_intelligence.py` → `.archived`
**Reason:** Tests the archived filesystem-scanning implementation

**Test Cases Archived:**
- `test_discover_i1_block()` - dynamic block discovery
- `test_discover_c1_block()` - dynamic block discovery
- `test_discover_d1_block()` - dynamic block discovery
- `test_extract_schema()` - schema extraction (not implemented)
- `test_analyze_i1_runtime()` - pattern extraction via regex
- `test_analyze_c1_runtime()` - pattern extraction via regex
- `test_analyze_d1_runtime()` - pattern extraction via regex
- `test_build_contract_i1()` - full contract build from filesystem
- `test_build_contract_c1()` - full contract build from filesystem
- `test_build_contract_d1()` - full contract build from filesystem
- `test_missing_block_graceful()` - graceful failure for missing blocks
- `test_theme_extraction()` - theme pattern extraction
- `test_runtime_context_detection()` - runtime context detection

## Files Strengthened

### 1. `app/contracts/repository_intelligence.py`
**Changes Made:**

#### Added Exception Class
```python
class RepositoryEvidenceBlocked(Exception):
    """
    Raised when repository evidence is missing, incomplete, or invalid.
    """
    pass
```

#### Strengthened `build_contract()` with Fail-Closed Logic

**Validation Added:**
1. **Version Validation**
   - Known versions: {"I1", "C1", "D1"}
   - Raises `RepositoryEvidenceBlocked` for unknown versions

2. **Snapshot Structure Validation**
   - Snapshot must not be None or empty
   - Snapshot must have 'evidence' key
   - 'evidence' must be a list

3. **Evidence Availability Validation**
   - Expected canonical path must be defined for (family, version)
   - Matching evidence must exist in snapshot
   - Raises `RepositoryEvidenceBlocked` with descriptive message if missing

4. **Evidence Completeness Validation**
   - 'contentHash' must be present and non-empty
   - 'evidenceId' must be present and non-empty
   - Raises `RepositoryEvidenceBlocked` if fields missing

**Error Messages:**
- "Unknown block version 'X9'. Known versions: ['C1', 'D1', 'I1']"
- "Snapshot is missing or empty"
- "Snapshot missing 'evidence' array"
- "Snapshot 'evidence' must be a list"
- "No canonical path defined for {family}/{version}"
- "No canonical evidence for {family}/{version}. Expected path: {path}. Run TypeScript discovery scan to generate evidence."
- "Evidence for {family}/{version} missing 'contentHash' field"
- "Evidence for {family}/{version} missing 'evidenceId' field"

## Architecture Compliance

### Before Migration
- ✅ Contracts version: Snapshot-based (CORRECT)
- ❌ Intelligence version: Filesystem-scanning (VIOLATES BOUNDARY)

### After Migration
- ✅ Single snapshot-based implementation
- ✅ Fail-closed behavior on missing evidence
- ✅ No filesystem access in production path
- ✅ Deterministic evidence IDs from TypeScript

## Callsite Migration

**Search Command:**
```bash
grep -r "from app.intelligence.repository_intelligence" services/project-ai --include="*.py"
```

**Results:**
- Found: 1 import in `tests/intelligence/test_repository_intelligence.py`
- Action: Archived entire test file (tests filesystem-scanning implementation)
- Result: Zero active imports after archival

**No Production Code Affected:**
The intelligence version was never imported by production code, only by its own test file.

## Test Strategy

The archived tests tested filesystem-scanning behavior. New tests need to cover:

1. **Snapshot-based contract generation**
   - Valid snapshot with evidence → successful contract
   - Mock snapshot data, verify contract fields

2. **Fail-closed behavior**
   - Unknown version (X9) → raises `RepositoryEvidenceBlocked`
   - Missing evidence → raises `RepositoryEvidenceBlocked`
   - Empty snapshot → raises `RepositoryEvidenceBlocked`
   - Incomplete evidence (missing contentHash) → raises `RepositoryEvidenceBlocked`
   - Incomplete evidence (missing evidenceId) → raises `RepositoryEvidenceBlocked`

3. **Deterministic output**
   - Same snapshot → same contract
   - Same evidence → same evidence IDs

4. **No filesystem access**
   - Assert no Path operations in production code path
   - Verify contracts module doesn't call `.exists()`, `.read_text()`, `.glob()`

5. **I1/C1/D1 canonical discovery**
   - Mock snapshot with I1 evidence → finds Introduction block
   - Mock snapshot with C1 evidence → finds Code block
   - Mock snapshot with D1 evidence → finds Definition block

## Legacy Code Preserved

The following functions remain in `app/contracts/repository_intelligence.py` for backward compatibility:

1. `build_contract_legacy(repo_root, family, version)`
   - Marked DEPRECATED
   - Scans filesystem directly
   - Preserved for old tests that pass repo_root

2. `compute_sha256(file_path)`
   - Marked DEPRECATED
   - Reads files to compute hash
   - Preserved for old tests

3. `compute_sha256_legacy(content)`
   - Helper for tests
   - Computes hash from bytes
   - No filesystem access

**Important:** These legacy functions must NOT be used in production code. They violate the architectural boundary.

## Directories After Migration

### `app/intelligence/`
```
app/intelligence/
├── __init__.py
└── repository_intelligence.py.archived
```

**Status:** Directory remains (has __init__.py)

### `tests/intelligence/`
```
tests/intelligence/
├── __init__.py
└── test_repository_intelligence.py.archived
```

**Status:** Directory remains (has __init__.py)

## Breaking Changes

### For External Callers (if any existed)

**Old API (intelligence version):**
```python
from app.intelligence.repository_intelligence import build_repository_contract

contract = build_repository_contract('introduction', 'I1', repo_root='/path')
```

**New API (contracts version):**
```python
from app.contracts.repository_intelligence import build_contract, RepositoryEvidenceBlocked

try:
    contract = build_contract(snapshot, 'Introduction', 'I1')
except RepositoryEvidenceBlocked as e:
    # Trigger TypeScript discovery scan
    pass
```

**Key Differences:**
1. Function name: `build_repository_contract` → `build_contract`
2. Parameters: `(family, version, repo_root)` → `(snapshot, family, version)`
3. Family naming: `'introduction'` → `'Introduction'` (capitalized)
4. Returns: Same type but with snapshot evidence
5. Error handling: Now raises exceptions instead of returning empty contracts

## Rollback Plan

If issues arise:

1. **Restore archived files:**
   ```bash
   mv app/intelligence/repository_intelligence.py.archived app/intelligence/repository_intelligence.py
   mv tests/intelligence/test_repository_intelligence.py.archived tests/intelligence/test_repository_intelligence.py
   ```

2. **Revert commit:**
   ```bash
   git revert <commit-sha>
   ```

3. **Run tests to verify rollback:**
   ```bash
   pytest tests/intelligence/test_repository_intelligence.py -v
   ```

## Success Criteria

- ✅ Filesystem-scanning implementation archived
- ✅ Test file for filesystem-scanning implementation archived
- ✅ Zero active imports from `app.intelligence.repository_intelligence`
- ✅ `RepositoryEvidenceBlocked` exception class added
- ✅ Fail-closed validation implemented in `build_contract()`
- ✅ Known versions validated (I1, C1, D1)
- ✅ Snapshot structure validated
- ✅ Evidence completeness validated
- ⏳ Comprehensive tests for fail-closed behavior (next step)
- ⏳ Contract routes updated to handle `RepositoryEvidenceBlocked` (next step)
- ⏳ Full test suite passes (next step)

## Next Steps

1. Write comprehensive tests for fail-closed behavior
2. Update contract route to handle `RepositoryEvidenceBlocked` (HTTP 503)
3. Run full test suite
4. Commit changes
5. Push to branch
6. Write evidence report
