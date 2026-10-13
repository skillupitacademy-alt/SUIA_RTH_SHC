# R1 Audit: Repository Intelligence Consolidation

## Audit Date
$(date)

## Files Audited
1. `services/project-ai/app/contracts/repository_intelligence.py` (snapshot-based, KEEP)
2. `services/project-ai/app/intelligence/repository_intelligence.py` (filesystem-scanning, REMOVE)

## Key Findings

### Contracts Version (CORRECT - Snapshot-Based)
**File:** `app/contracts/repository_intelligence.py`

**Architecture Compliance:** ✅ CORRECT
- Consumes TypeScript snapshot from `snapshot['evidence']` array
- No direct repository filesystem access in production `build_contract()` function
- Extracts SHA-256 hashes from snapshot, never recomputes
- Uses evidence IDs from TypeScript discovery
- Clean architectural boundary

**Current State:**
- Main function: `build_contract(snapshot, family, version)`
- Extracts `canonical_block` evidence from snapshot
- Maps (family, version) to expected paths via `block_patterns` dictionary
- Returns `RepositoryBlockContract` with evidence from snapshot
- Has legacy functions for backward compatibility: `build_contract_legacy()`, `compute_sha256()`

**Missing Elements (need to add):**
- ❌ No `RepositoryEvidenceBlocked` exception class
- ❌ No fail-closed validation logic
- ❌ No validation for unknown versions (currently silently accepts any version)
- ❌ No validation for missing snapshot evidence (returns empty references list)
- ❌ No stale snapshot detection
- ❌ Function accepts and processes invalid data without raising exceptions

**Legacy Code Present:**
- `build_contract_legacy()` - filesystem scanning (marked DEPRECATED)
- `compute_sha256()` - file hash computation (marked DEPRECATED)
- Both preserved for test backward compatibility

### Intelligence Version (INCORRECT - Filesystem-Scanning)
**File:** `app/intelligence/repository_intelligence.py`

**Architecture Compliance:** ❌ VIOLATES BOUNDARY
- Directly scans repository files via `Path.glob()`, `Path.exists()`, `.read_text()`
- Uses dynamic filesystem discovery via `blocks_dir.glob("*Block.tsx")`
- Reads TSX files and parses content with regex
- No snapshot consumption at all
- Violates "TypeScript discovery → snapshot → Python consumption" rule

**Functionality:**
- `discover_canonical_blocks()` - dynamically scans `packages/ui/src/tutorial/blocks/`
- `analyze_block_patterns()` - reads TSX files and extracts patterns via regex
- `build_repository_contract()` - combines discovery + analysis
- `_remove_comments()` - helper for TSX parsing

**Data Extracted:**
- Block version from JSX attributes, switch statements, or variable declarations
- UBRC patterns (data-block-id, data-block-type, data-block-version)
- ILS patterns (ActiveBlockContext, runtimeContext)
- Theme patterns (theme.primary, theme.secondary, etc.)
- Brand independence markers (CANONICAL LOCKED comments)
- RSSB page-level patterns (runtimeContext prop)

**Why This Must Be Removed:**
1. Violates architectural boundary (Python scanning repository)
2. Duplicates functionality that TypeScript discovery already provides
3. Creates race conditions (Python sees different state than TypeScript)
4. No SHA-256 tracking or evidence IDs
5. Pattern extraction via regex is fragile and maintenance-heavy
6. TypeScript snapshot is the single source of truth

## Architecture Decision Rationale

**Why Keep Contracts Version:**
- Respects architectural boundary
- Consumes canonical snapshot evidence from TypeScript
- No filesystem access in production path
- Evidence IDs and SHA-256 hashes are deterministic
- Snapshot is single source of truth

**Why Remove Intelligence Version:**
- Violates architectural boundary (Python must not scan repository)
- Duplicates TypeScript discovery responsibility
- Creates maintenance burden (regex pattern matching)
- No evidence tracking or deterministic IDs
- TypeScript is better suited for TSX parsing

## Migration Strategy

### Step 1: Strengthen Contracts Version
Add fail-closed logic to `build_contract()`:
1. Create `RepositoryEvidenceBlocked(Exception)` class
2. Validate version is in known set: {"I1", "C1", "D1"}
3. Validate snapshot structure (has 'evidence' key)
4. Validate evidence exists for requested family/version
5. Validate evidence has required fields: contentHash, evidenceId
6. Raise descriptive exceptions when validation fails

### Step 2: Search for Callsites
Run grep to find all imports:
```bash
grep -r "from app.intelligence.repository_intelligence" services/project-ai --include="*.py"
```

Expected result: No imports (this version is not currently used)

### Step 3: Remove Intelligence Version
- Move `app/intelligence/repository_intelligence.py` to `.archived` OR delete
- Check if `app/intelligence/` directory is empty after removal
- Remove directory if only `__init__.py` remains

### Step 4: Add Comprehensive Tests
Write tests for:
- Snapshot-based contract generation with valid evidence
- I1/C1/D1 canonical discovery from snapshot
- Unknown version → raises `RepositoryEvidenceBlocked`
- Missing evidence → raises `RepositoryEvidenceBlocked`
- Stale snapshot → raises `RepositoryEvidenceBlocked` (if stale detection added)
- NO filesystem access in production path (assert no Path operations)
- Deterministic output from same snapshot

### Step 5: Update Contract Routes
Modify `app/api/routes/contract.py` to handle `RepositoryEvidenceBlocked`:
- Catch exception
- Return HTTP 503 (Service Unavailable)
- Clear error message: "Repository evidence missing. Run TypeScript discovery scan."

## Data Model Comparison

### Contracts Version (Pydantic Models)
- `RepositoryEvidence` - path, sha256, role, evidence_id
- `CanonicalReference` - family, version, evidence[]
- `RuntimeContract` - runtime requirements (boolean flags)
- `RepositoryBlockContract` - complete contract with references, runtime, artifacts

### Intelligence Version (Dataclasses)
- `CanonicalReference` - family, version, source_files[], schema, renderer, registry
- `RuntimeContract` - ubrc{}, ils{}, lsnb{}, rssb{}, theme{}, brand{} (dict fields)
- `RepositoryBlockContract` - target, canonical_refs[], runtime, acceptance_criteria[]

**Key Difference:** Contracts version uses Pydantic (validation + serialization), intelligence version uses dataclasses (no validation).

## Risk Assessment

**Low Risk:**
- Intelligence version appears unused (no grep matches expected)
- Contracts version already used in production
- Tests exist for contracts version

**Medium Risk:**
- Need to ensure all callsites migrated before deletion
- Legacy functions in contracts version may be used by tests
- Need comprehensive test coverage for fail-closed behavior

**Mitigation:**
- Thorough grep search for imports
- Run full test suite before and after changes
- Keep legacy functions until all tests migrated
- Add fail-closed tests before strengthening validation

## Success Criteria

✅ All callsites migrated to `app.contracts.repository_intelligence`
✅ `RepositoryEvidenceBlocked` exception class added
✅ Fail-closed validation logic implemented
✅ Unknown version validation added
✅ Missing evidence validation added
✅ Intelligence version removed or archived
✅ All tests pass
✅ No filesystem access in production contract generation
✅ Contract routes handle blocked scenarios (HTTP 503)
✅ Documentation updated

## Files to Modify

**Add/Modify:**
- `services/project-ai/app/contracts/repository_intelligence.py` (add fail-closed logic)
- `services/project-ai/app/api/routes/contract.py` (handle RepositoryEvidenceBlocked)
- `services/project-ai/tests/unit/test_repository_intelligence.py` (expand coverage)
- `services/project-ai/tests/integration/test_w2_contract_generation.py` (add blocked tests)

**Remove:**
- `services/project-ai/app/intelligence/repository_intelligence.py` (archive or delete)
- `services/project-ai/tests/intelligence/test_repository_intelligence.py` (if exists)
- `services/project-ai/app/intelligence/` (if empty)
- `services/project-ai/tests/intelligence/` (if empty)

## Execution Plan

1. Audit complete ✅
2. Search for callsites → `grep` command
3. Strengthen fail-closed logic → modify contracts file
4. Remove filesystem implementation → archive/delete intelligence file
5. Add/update tests → test files
6. Run tests → verify all pass
7. Commit + push → git commands
8. Write evidence report → JSON file
