# Gate E-1: W3C Canonical Artifact Policy Remediation - Implementation Plan

**Project:** Quiz Platform - Project AI Service  
**Branch:** m2-project-ai-canonical-wiring  
**Date:** 2026-01-30  
**Status:** Ready for Implementation  
**Purpose:** Implement W3C Canonical Artifact Policy enforcement with duplicate detection, version conflict resolution, and canonical selection

---

## Executive Summary

This plan implements the W3C Canonical Artifact Policy requirements from `.agents/tasks/gate-b-w3c-w5-requirements.md`. The current `artifact_policy.py` file provides foundational duplicate prevention for versioned filenames (e.g., `ObjectiveBlockV2.tsx` → `ObjectiveBlock.tsx`), but lacks:

1. **Duplicate detection by content hash** across semantically equivalent artifacts
2. **Version conflict resolution** when multiple versions exist with conflicting data
3. **Canonical selection algorithm** with deterministic timestamp-based ordering
4. **Rejection policy** for duplicate submissions
5. **Provenance metadata tracking** (SHA-256, timestamps, references)
6. **Artifact registry integration** for canonical artifact discovery

**Current State Analysis:**
- ✅ Artifact normalization logic exists (`normalize_artifact_name`)
- ✅ Repository index building from snapshot exists (`build_repository_index`)
- ✅ Semantic matching exists (`find_semantic_match`)
- ✅ Basic placement decisions exist (`determine_action`)
- ❌ No content-based duplicate detection across different filenames
- ❌ No version conflict resolution for conflicting artifacts
- ❌ No canonical selection algorithm
- ❌ No provenance metadata tracking
- ❌ No rejection policy for duplicates
- ❌ Test coverage is 12 tests (need minimum 15, targeting 20+)

**Key Design Decisions:**
1. **Canonical selection**: Earliest timestamp wins (deterministic, audit-friendly)
2. **Conflict resolution**: Content hash comparison + timestamp ordering
3. **Duplicate rejection**: Return REJECT decision with reason when duplicate detected
4. **No breaking changes**: Extend existing PlacementDecision enum, maintain API compatibility
5. **W7 integration**: Evidence IDs must be collected from TypeScript discovery snapshot (no synthetic IDs)

---

## Project Context

**Project Type:** FastAPI (Python 3.11+) service for AI orchestration  
**Language:** Python 3.11+  
**Build System:** pip with pyproject.toml  
**Test Framework:** pytest with pytest-asyncio  
**Build Command:** `pip install -e .` (from services/project-ai)  
**Test Command:** `pytest tests/` (from services/project-ai)  
**Quick Test Command:** `pytest tests/test_artifact_policy.py -v` (focused test)  
**Coverage Command:** `pytest tests/test_artifact_policy.py --cov=app/placement --cov-report=term`

**Environment Constraints:**
- Never modify git config
- All file paths relative to workspace root: `e:\onlinewebsites\quiz-platform`
- Project-ai service root: `e:\onlinewebsites\quiz-platform\services\project-ai`
- Tests run from `services/project-ai` directory using relative imports
- Snapshot location: `packages/project-llm-discovery/output/snapshot.json` (TypeScript-generated)

**Contribution Requirements from Documentation:**
- Docstrings required for all public APIs (Args, Returns, Raises)
- Test coverage target: 80%+
- Follow existing test patterns (pytest fixtures, descriptive test names)
- Use HTTPException for route errors
- Log important decisions at WARNING level for audit trail
- Evidence IDs must come from TypeScript snapshot (never synthetic)
- SHA-256 hashing for all content verification

**Key Patterns from Codebase:**
- Pydantic v2 models with Field(...) descriptors
- Dataclass for internal structures (e.g., RepositoryArtifact)
- Enum for decision types (e.g., PlacementDecision)
- SHA-256 hashing: `hashlib.sha256(content.encode('utf-8')).hexdigest()`
- Test organization: TestClassName for each function/feature
- Evidence extraction: `snapshot.get('evidence', [])` pattern

**Relevant Files to Modify:**
- `services/project-ai/app/placement/artifact_policy.py` (core logic)
- `services/project-ai/tests/test_artifact_policy.py` (test suite)
- `services/project-ai/app/models/candidate.py` (extend PlacementDecision if needed)

**Relevant Files to Study:**
- `.agents/tasks/gate-b-w3c-w5-requirements.md` (requirements specification)
- `.agents/policies/canonical-artifact-policy.md` (policy definition)
- `services/project-ai/README.md` (test commands, architecture)

**Directory Structure:**
```
services/project-ai/
├── app/
│   ├── placement/
│   │   └── artifact_policy.py          # Core implementation
│   ├── models/
│   │   └── candidate.py                # PlacementDecision enum
│   └── api/routes/                     # API endpoints (future integration)
├── tests/
│   └── test_artifact_policy.py         # Test suite
└── pyproject.toml                      # Dependencies
```

---

## Implementation Plan

### FEAT-001: Content-Based Duplicate Detection

**Type:** feat  
**Description:** Implement duplicate detection across semantically different filenames using content hash comparison. Detects when multiple artifacts serve the same purpose even if named differently.

**Steps:**

1. Add `detect_content_duplicates(repository_index: List[RepositoryArtifact]) -> Dict[str, List[RepositoryArtifact]]` function to `artifact_policy.py`
   - Group artifacts by content hash
   - Return dict mapping content_hash → list of artifacts with that hash
   - Only include hashes with 2+ artifacts (actual duplicates)
   - Document algorithm: "Content-based duplicate detection using SHA-256 hash grouping"

2. Add `is_content_duplicate(candidate_content: str, repository_index: List[RepositoryArtifact]) -> Optional[List[RepositoryArtifact]]` function
   - Compute candidate hash
   - Check if hash exists in repository (any artifact with matching hash)
   - Return list of matching artifacts if found, None otherwise
   - Used by placement logic to detect duplicate submissions

3. Update `determine_action()` to check for content duplicates before semantic matching
   - Add content duplicate check before existing repository_match logic
   - If content duplicate found with different filename → return REJECT with reason
   - Reason format: "Content duplicate detected: identical to existing artifacts at [paths]"
   - This enforces "no duplicate artifacts serving same purpose" rule

**Files:**
- `services/project-ai/app/placement/artifact_policy.py`

**Acceptance Criteria:**
- `detect_content_duplicates()` correctly groups artifacts by hash
- `is_content_duplicate()` detects duplicates across different filenames
- `determine_action()` rejects content duplicates with clear reason
- All functions have comprehensive docstrings with Args/Returns/Examples

**Verification:**
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestContentDuplicateDetection -v
```
Expected: 4+ new tests pass (detect empty, detect single, detect multiple, reject duplicate)

---

### FEAT-002: Version Conflict Resolution

**Type:** feat  
**Description:** Implement version conflict resolution when multiple versions of same artifact exist with different content. Uses timestamp-based canonical selection (earliest wins) with content consistency validation.

**Steps:**

1. Add `VersionConflict` dataclass to `artifact_policy.py`
   - Fields: `base_name: str`, `artifacts: List[RepositoryArtifact]`, `conflict_type: str`, `resolution: str`
   - conflict_type: "CONTENT_CONFLICT" | "TEMPORAL_CONFLICT" | "SCHEMA_CONFLICT"
   - resolution: "CANONICAL_SELECTED" | "MERGE_REQUIRED" | "ESCALATE_TO_HUMAN"

2. Add `detect_version_conflicts(repository_index: List[RepositoryArtifact]) -> List[VersionConflict]` function
   - Group artifacts by normalized base_name
   - For each group with 2+ artifacts and different content hashes → version conflict
   - Classify conflict type based on content differences
   - Return list of VersionConflict objects

3. Add `select_canonical_artifact(artifacts: List[RepositoryArtifact]) -> RepositoryArtifact` function
   - Apply canonical selection algorithm: earliest timestamp wins
   - For timestamp ties: shortest path wins (fewer directory levels = more central)
   - For path length ties: alphabetically first wins (deterministic)
   - Document rationale: "Deterministic selection ensures consistent behavior across runs"

4. Add `resolve_version_conflict(conflict: VersionConflict) -> VersionConflict` function
   - Select canonical using `select_canonical_artifact()`
   - Set resolution field based on content analysis
   - Return updated conflict with resolution and canonical artifact identified
   - Log resolution decision at WARNING level for audit trail

**Files:**
- `services/project-ai/app/placement/artifact_policy.py`

**Acceptance Criteria:**
- `detect_version_conflicts()` identifies conflicts correctly
- `select_canonical_artifact()` uses deterministic timestamp ordering
- Tie-breaking rules (path length, alphabetical) work correctly
- `resolve_version_conflict()` produces valid resolutions
- All conflict resolutions logged for audit

**Verification:**
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestVersionConflictResolution -v
```
Expected: 5+ new tests pass (detect conflicts, select canonical, tie-breaking, resolve conflict, logging)

---

### FEAT-003: Enhanced Rejection Policy

**Type:** feat  
**Description:** Extend PlacementDecision.REJECT with structured rejection reasons. Enforces duplicate prevention and version conflict policies with clear, actionable feedback.

**Steps:**

1. Add `RejectionReason` dataclass to `artifact_policy.py`
   - Fields: `reason_code: str`, `message: str`, `conflicting_artifacts: List[str]`, `recommended_action: str`
   - reason_code values: "CONTENT_DUPLICATE" | "VERSION_CONFLICT" | "QUALITY_ISSUE" | "POLICY_VIOLATION"
   - recommended_action: guidance for resolving rejection (e.g., "Update existing artifact at path X")

2. Update `determine_action()` to return tuple `(PlacementDecision, Optional[RejectionReason])`
   - For REJECT decisions, populate RejectionReason with specifics
   - For non-REJECT decisions, return None for reason
   - Maintain backward compatibility: callers that ignore reason still work

3. Add `format_rejection_message(reason: RejectionReason) -> str` function
   - Create human-readable rejection message from RejectionReason
   - Include reason code, message, conflicting paths, and recommended action
   - Format for console output and API responses

**Files:**
- `services/project-ai/app/placement/artifact_policy.py`

**Acceptance Criteria:**
- RejectionReason captures all necessary information
- `determine_action()` returns structured reasons for all rejections
- `format_rejection_message()` produces clear, actionable messages
- Backward compatibility maintained for existing callers

**Verification:**
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestRejectionPolicy -v
```
Expected: 3+ new tests pass (rejection reason creation, formatting, backward compatibility)

---

### FEAT-004: Provenance Metadata Tracking

**Type:** feat  
**Description:** Add provenance metadata to RepositoryArtifact for audit trail and traceability. Tracks creation timestamp, last modified timestamp, references, and version history.

**Steps:**

1. Extend `RepositoryArtifact` dataclass with provenance fields (optional to maintain backward compatibility)
   - `created_at: Optional[str]` - ISO 8601 timestamp
   - `last_modified_at: Optional[str]` - ISO 8601 timestamp
   - `references: Optional[List[str]]` - Paths to artifacts this depends on
   - `referenced_by: Optional[List[str]]` - Paths to artifacts that depend on this
   - `supersedes: Optional[str]` - Path to previous version (if any)
   - `superseded_by: Optional[str]` - Path to newer version (if superseded)

2. Update `build_repository_index()` to extract provenance metadata from snapshot evidence
   - Look for timestamp fields in evidence records
   - Extract reference information if available in snapshot
   - Populate provenance fields when data available
   - Handle missing fields gracefully (None values)

3. Add `compute_artifact_graph(repository_index: List[RepositoryArtifact]) -> Dict[str, Any]` function
   - Build reference graph from artifact dependencies
   - Return dict with nodes (artifacts) and edges (references)
   - Format: `{"nodes": [{"path": str, "hash": str}], "edges": [{"from": str, "to": str}]}`
   - Used for impact analysis and dependency tracking

4. Add `get_artifact_lineage(artifact: RepositoryArtifact, repository_index: List[RepositoryArtifact]) -> List[RepositoryArtifact]` function
   - Follow supersedes chain backward to find artifact history
   - Return list ordered from oldest to newest
   - Handles circular references gracefully (max depth: 100)

**Files:**
- `services/project-ai/app/placement/artifact_policy.py`

**Acceptance Criteria:**
- RepositoryArtifact extended with optional provenance fields
- `build_repository_index()` extracts timestamps from snapshot
- `compute_artifact_graph()` builds valid reference graph
- `get_artifact_lineage()` traces version history correctly
- No breaking changes to existing code (fields are optional)

**Verification:**
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestProvenanceTracking -v
```
Expected: 4+ new tests pass (provenance extraction, graph building, lineage tracing, backward compatibility)

---

### FEAT-005: Canonical Artifact Registry Integration

**Type:** feat  
**Description:** Implement canonical artifact discovery that searches repository, snapshot evidence, and canonical registry before creating new artifacts. Aligns with policy: "Search before creating."

**Steps:**

1. Add `CanonicalArtifactRegistry` dataclass to `artifact_policy.py`
   - Fields: `artifact_type: str`, `canonical_path: str`, `purpose: str`, `last_verified: str`
   - Represents canonical artifacts from `.agents/policies/canonical-artifact-policy.md`

2. Add `load_canonical_registry(registry_path: str) -> List[CanonicalArtifactRegistry]` function
   - Parse canonical artifact policy Markdown table
   - Extract artifact type, path, and purpose
   - Return list of registered canonical artifacts
   - Handle missing file gracefully (return empty list, log warning)

3. Add `find_canonical_artifact(purpose: str, registry: List[CanonicalArtifactRegistry]) -> Optional[str]` function
   - Search registry for artifact matching purpose
   - Use fuzzy matching on purpose field (contains, case-insensitive)
   - Return canonical path if found, None otherwise

4. Add `should_create_new_artifact(candidate_filename: str, candidate_content: str, repository_index: List[RepositoryArtifact], registry: List[CanonicalArtifactRegistry]) -> Tuple[bool, str]` function
   - Check 1: Semantic match in repository → should NOT create (return False + reason)
   - Check 2: Content duplicate → should NOT create
   - Check 3: Canonical registry match → should NOT create (update canonical instead)
   - Check 4: All checks pass → OK to create (return True + empty reason)
   - Return (bool, reason) tuple

**Files:**
- `services/project-ai/app/placement/artifact_policy.py`

**Acceptance Criteria:**
- Registry parsing handles real canonical-artifact-policy.md format
- `find_canonical_artifact()` matches purposes correctly
- `should_create_new_artifact()` enforces all policy checks
- Clear reasons provided when artifact creation denied

**Verification:**
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestCanonicalRegistry -v
```
Expected: 4+ new tests pass (load registry, find artifact, should create checks, policy enforcement)

---

### FEAT-006: Comprehensive Test Suite (20+ Tests)

**Type:** test  
**Description:** Expand test coverage to minimum 20 tests covering duplicate submission rejection, version conflict resolution, canonical artifact retrieval, edge cases (same timestamp, hash collisions), and integration with existing governance flow.

**Steps:**

1. Add `TestContentDuplicateDetection` test class
   - `test_detect_no_duplicates_empty_repository()` - empty repository returns empty dict
   - `test_detect_no_duplicates_unique_content()` - unique content artifacts return empty dict
   - `test_detect_single_duplicate()` - two artifacts, same hash, returns dict with 1 entry
   - `test_detect_multiple_duplicate_groups()` - 6 artifacts, 2 duplicate groups, returns dict with 2 entries
   - `test_reject_content_duplicate_different_filename()` - candidate with same content, different name → REJECT

2. Add `TestVersionConflictResolution` test class
   - `test_detect_version_conflicts_no_conflicts()` - unique artifacts return empty list
   - `test_detect_version_conflicts_multiple_versions()` - ObjectiveBlock + ObjectiveBlockV2 detected as conflict
   - `test_select_canonical_earliest_timestamp()` - earliest timestamp wins
   - `test_select_canonical_timestamp_tie_shortest_path()` - tie broken by path length
   - `test_select_canonical_full_tie_alphabetical()` - full tie broken alphabetically
   - `test_resolve_conflict_sets_canonical()` - conflict resolution identifies canonical artifact

3. Add `TestRejectionPolicy` test class
   - `test_rejection_reason_has_all_fields()` - RejectionReason contains code, message, conflicts, action
   - `test_format_rejection_message_readable()` - formatted message is human-readable
   - `test_backward_compatibility_ignore_reason()` - existing code ignoring reason still works

4. Add `TestProvenanceTracking` test class
   - `test_provenance_fields_optional()` - RepositoryArtifact works without provenance fields
   - `test_extract_provenance_from_snapshot()` - build_repository_index extracts timestamps
   - `test_compute_artifact_graph_nodes_edges()` - graph has correct nodes and edges
   - `test_get_artifact_lineage_traces_history()` - lineage follows supersedes chain

5. Add `TestCanonicalRegistry` test class
   - `test_load_registry_missing_file()` - missing file returns empty list, logs warning
   - `test_find_canonical_artifact_exact_match()` - exact purpose match found
   - `test_find_canonical_artifact_fuzzy_match()` - partial purpose match found
   - `test_should_create_semantic_match_blocks()` - semantic match prevents creation

6. Add `TestEdgeCases` test class
   - `test_same_timestamp_multiple_artifacts()` - deterministic selection with identical timestamps
   - `test_circular_supersedes_chain()` - lineage handles circular references without infinite loop
   - `test_malformed_snapshot_evidence()` - malformed evidence handled gracefully
   - `test_hash_collision_simulation()` - simulate hash collision handling (different content, same hash prefix)

**Files:**
- `services/project-ai/tests/test_artifact_policy.py`

**Acceptance Criteria:**
- Minimum 20 new tests added (targeting 25-30 total)
- All test classes follow existing naming convention (Test*)
- All tests use pytest fixtures where appropriate
- Test coverage for artifact_policy.py reaches 85%+
- All edge cases from requirements covered

**Verification:**
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py -v --tb=short
pytest tests/test_artifact_policy.py --cov=app/placement/artifact_policy --cov-report=term-missing
```
Expected: 32+ tests pass (12 existing + 20 new), coverage ≥85%

---

### FEAT-007: Documentation and W7 Evidence Integration

**Type:** docs  
**Description:** Document W3C policy implementation in code comments, update API documentation, and ensure compatibility with W7 evidence enforcement (Gate C).

**Steps:**

1. Add comprehensive module docstring to `artifact_policy.py`
   - W3C Canonical Artifact Policy overview
   - Duplicate detection strategy (content hash + semantic matching)
   - Version conflict resolution algorithm (timestamp-based canonical selection)
   - Rejection policy summary
   - Integration with W7 evidence enforcement
   - Examples of policy enforcement scenarios

2. Update function docstrings to W3C compliance level
   - All public functions: Args, Returns, Raises, Examples
   - Include W3C policy references where relevant
   - Document evidence ID usage (must be from TypeScript snapshot, never synthetic)
   - Cross-reference related functions

3. Add `docs/artifact-policy-w3c-compliance.md` documentation file
   - Policy requirements from gate-b-w3c-w5-requirements.md
   - Implementation approach for each requirement
   - Test coverage mapping (requirement → test cases)
   - Integration points with W5 placement engine and W7 evidence enforcement
   - Migration strategy for existing artifacts (if duplicates found)

4. Add inline comments for complex logic
   - Canonical selection algorithm tie-breaking rules
   - Content hash comparison edge cases
   - Registry parsing logic
   - Evidence ID extraction from snapshot

5. Verify W7 compatibility
   - Ensure all evidence IDs come from TypeScript snapshot (no synthetic IDs)
   - Document evidence binding requirements
   - Cross-check against `.agents/tasks/gate-b-w7-evidence-contract.md` if exists
   - Confirm SHA-256 usage aligns with W7 hash verification

**Files:**
- `services/project-ai/app/placement/artifact_policy.py`
- `services/project-ai/docs/artifact-policy-w3c-compliance.md` (new file)

**Acceptance Criteria:**
- Module docstring covers W3C policy completely
- All public functions have complete docstrings
- Documentation file created with requirements mapping
- W7 compatibility verified (evidence IDs from snapshot only)
- No synthetic evidence ID generation in code

**Verification:**
```bash
cd services/project-ai
# Manual review of docstrings and documentation
grep -r "evidence.*synthetic" app/placement/  # Should return nothing
grep -r "candidate-.*-classification" app/placement/  # Should return nothing (synthetic pattern)
pytest tests/test_artifact_policy.py -v  # All tests pass
```
Expected: Documentation complete, no synthetic evidence patterns in production code, all tests pass

---

## Integration Testing Strategy

After all FEATs complete, run integration verification:

### Integration Test 1: End-to-End Duplicate Prevention
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestDuplicatePrevention -v
```
**Scenario:** Upload ObjectiveBlock.tsx, then attempt ObjectiveBlockV2.tsx with same content
**Expected:** Second upload gets REJECT decision with "Content duplicate" reason

### Integration Test 2: Version Conflict Resolution
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestVersionConflictResolution -v
```
**Scenario:** Repository has ObjectiveBlock.tsx and ObjectiveBlockV2.tsx with different content
**Expected:** Conflict detected, earliest timestamp selected as canonical, resolution logged

### Integration Test 3: Canonical Registry Enforcement
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py::TestCanonicalRegistry -v
```
**Scenario:** Attempt to create new artifact when canonical version exists in registry
**Expected:** Creation prevented, canonical path returned in rejection reason

### Integration Test 4: W7 Evidence Binding
```bash
cd services/project-ai
pytest tests/ -k "evidence" -v
```
**Expected:** All evidence IDs extracted from snapshot, no synthetic IDs generated

### Full Test Suite
```bash
cd services/project-ai
pytest tests/test_artifact_policy.py -v --cov=app/placement/artifact_policy --cov-report=html
```
**Expected:** 32+ tests pass, coverage ≥85%, HTML report generated at htmlcov/index.html

---

## Migration Strategy for Existing Duplicates

If existing duplicate artifacts discovered during implementation:

1. **Identify duplicates:**
   ```python
   repository_index = build_repository_index(snapshot)
   duplicates = detect_content_duplicates(repository_index)
   conflicts = detect_version_conflicts(repository_index)
   ```

2. **For each duplicate group:**
   - Select canonical using `select_canonical_artifact()`
   - Log deprecation plan: canonical path + paths to deprecate
   - Do NOT automatically delete or modify files (manual review required)
   - Generate migration report: `.agents/evidence/w3c-duplicate-report.json`

3. **Report format:**
   ```json
   {
     "scan_date": "2026-01-30T10:00:00Z",
     "duplicates_found": 5,
     "conflicts_found": 3,
     "duplicate_groups": [
       {
         "content_hash": "abc123...",
         "canonical_path": "packages/ui/src/blocks/ObjectiveBlock.tsx",
         "duplicates": ["packages/ui/src/blocks/ObjectiveBlockV2.tsx"],
         "action": "UPDATE_OR_DEPRECATE"
       }
     ],
     "version_conflicts": [
       {
         "base_name": "Introduction",
         "canonical_path": "packages/ui/src/blocks/Introduction.tsx",
         "conflicting_versions": ["packages/ui/src/blocks/IntroductionV3.tsx"],
         "resolution": "CANONICAL_SELECTED",
         "rationale": "Earliest timestamp wins"
       }
     ]
   }
   ```

4. **Human review required:**
   - Do not auto-delete without approval
   - Verify canonical selection correct
   - Check for unique content in deprecated versions
   - Merge unique content into canonical before deprecation

---

## Constraints and Non-Breaking Changes

**Constraints:**

1. **No breaking changes to existing artifact APIs**
   - `PlacementDecision` enum: maintain existing values (ADD, UPDATE, EXTEND, REUSE, REJECT)
   - `determine_action()` signature can be extended to return tuple, but single return must still work
   - `RepositoryArtifact` dataclass: new fields must be optional (default None)

2. **Must be compatible with W7 evidence enforcement (Gate C)**
   - All evidence IDs must come from TypeScript discovery snapshot
   - No synthetic evidence ID generation (patterns like `candidate-*-classification` prohibited)
   - SHA-256 hashing must align with W7 hash verification
   - Evidence binding requirements from `.agents/tasks/gate-b-w7-evidence-contract.md`

3. **No modifications to TypeScript discovery layer**
   - Python reads snapshot, does not scan repository directly
   - Snapshot location: `packages/project-llm-discovery/output/snapshot.json`
   - Cannot add new scanners or modify existing D1-D8 scanners

4. **Backward compatibility with existing tests**
   - All 12 existing tests in `test_artifact_policy.py` must continue to pass
   - New features must not break existing functionality
   - Deprecated behavior (if any) must be clearly documented

**Non-Breaking Extension Strategy:**

- **Option 1:** Return tuple from `determine_action()` with optional second element
  ```python
  # Old: decision = determine_action(content, filename, match)
  # New: decision, reason = determine_action(content, filename, match)  # or just ignore reason
  ```

- **Option 2:** Add separate function for enhanced decisions
  ```python
  # New function: decision, reason = determine_action_with_reason(...)
  # Old function still works as-is
  ```

**Recommended:** Option 1 with backward-compatible tuple unpacking that allows ignoring second element.

---

## Acceptance Criteria Summary

**AC-E1-001: Duplicate Detection**
- ✅ Content duplicates detected across different filenames
- ✅ Duplicate detection works with empty repositories
- ✅ Multiple duplicate groups detected correctly
- ✅ Test coverage: 4+ tests

**AC-E1-002: Version Conflict Resolution**
- ✅ Conflicts detected when same base name, different content hashes
- ✅ Canonical selection uses earliest timestamp
- ✅ Tie-breaking rules: path length → alphabetical
- ✅ Resolution logged at WARNING level for audit
- ✅ Test coverage: 5+ tests

**AC-E1-003: Rejection Policy**
- ✅ REJECT decision includes structured reason
- ✅ Reason specifies conflicting artifact paths
- ✅ Recommended action provided for resolution
- ✅ Backward compatibility maintained
- ✅ Test coverage: 3+ tests

**AC-E1-004: Provenance Tracking**
- ✅ RepositoryArtifact extended with optional provenance fields
- ✅ Timestamps extracted from snapshot evidence
- ✅ Artifact reference graph computed correctly
- ✅ Version lineage traced through supersedes chain
- ✅ Test coverage: 4+ tests

**AC-E1-005: Canonical Registry**
- ✅ Registry loaded from canonical-artifact-policy.md
- ✅ Purpose-based artifact discovery works
- ✅ Should-create checks enforce policy
- ✅ Missing registry file handled gracefully
- ✅ Test coverage: 4+ tests

**AC-E1-006: Test Coverage**
- ✅ Minimum 20 new tests added
- ✅ Total test count ≥32 tests
- ✅ Coverage ≥85% for artifact_policy.py
- ✅ All edge cases covered (same timestamp, circular refs, malformed data)

**AC-E1-007: Documentation**
- ✅ Module docstring covers W3C policy
- ✅ All public functions have complete docstrings
- ✅ W3C compliance documentation file created
- ✅ W7 evidence compatibility verified
- ✅ No synthetic evidence ID patterns in code

**AC-E1-008: W7 Integration**
- ✅ All evidence IDs from TypeScript snapshot only
- ✅ SHA-256 hashing aligns with W7 verification
- ✅ Evidence binding requirements satisfied
- ✅ No synthetic evidence generation in production code

**AC-E1-009: No Breaking Changes**
- ✅ All 12 existing tests continue to pass
- ✅ PlacementDecision enum unchanged
- ✅ RepositoryArtifact backward compatible (optional fields)
- ✅ Existing API consumers unaffected

---

## Dependencies

**Internal Dependencies:**
- FEAT-002 depends on FEAT-001 (version conflict detection needs duplicate detection)
- FEAT-003 depends on FEAT-001 and FEAT-002 (rejection policy uses duplicate and conflict detection)
- FEAT-006 depends on FEAT-001 through FEAT-005 (tests verify all features)
- FEAT-007 depends on FEAT-001 through FEAT-006 (documents all features)

**External Dependencies:**
- TypeScript discovery snapshot must exist at `packages/project-llm-discovery/output/snapshot.json`
- Canonical artifact policy must exist at `.agents/policies/canonical-artifact-policy.md`
- pytest and pytest-asyncio must be installed (`pip install -e ".[dev]"`)

**Parallel Work Opportunities:**
- FEAT-001 and FEAT-004 can be developed in parallel (independent)
- FEAT-005 can be developed in parallel with FEAT-001/FEAT-002 (independent until integration)
- FEAT-007 documentation can start early (write requirements mapping while coding)

---

## Verification Commands

**Unit Tests (Per FEAT):**
```bash
cd services/project-ai

# FEAT-001: Content Duplicate Detection
pytest tests/test_artifact_policy.py::TestContentDuplicateDetection -v

# FEAT-002: Version Conflict Resolution  
pytest tests/test_artifact_policy.py::TestVersionConflictResolution -v

# FEAT-003: Rejection Policy
pytest tests/test_artifact_policy.py::TestRejectionPolicy -v

# FEAT-004: Provenance Tracking
pytest tests/test_artifact_policy.py::TestProvenanceTracking -v

# FEAT-005: Canonical Registry
pytest tests/test_artifact_policy.py::TestCanonicalRegistry -v

# FEAT-006: Edge Cases
pytest tests/test_artifact_policy.py::TestEdgeCases -v
```

**Integration Tests:**
```bash
cd services/project-ai

# All artifact policy tests
pytest tests/test_artifact_policy.py -v

# With coverage report
pytest tests/test_artifact_policy.py --cov=app/placement/artifact_policy --cov-report=term-missing

# HTML coverage report (open htmlcov/index.html)
pytest tests/test_artifact_policy.py --cov=app/placement/artifact_policy --cov-report=html

# Verify no synthetic evidence patterns
grep -r "candidate-.*-classification" app/placement/
grep -r "evidence.*synthetic" app/placement/
```

**Expected Results:**
- ✅ 32+ tests pass (12 existing + 20 new)
- ✅ Coverage ≥85% for app/placement/artifact_policy.py
- ✅ No synthetic evidence patterns found in production code
- ✅ All existing tests continue to pass (backward compatibility)

---

## Risk Mitigation

**Risk 1: Breaking Existing Tests**
- **Mitigation:** Run existing tests after each FEAT
- **Verification:** `pytest tests/test_artifact_policy.py::TestDuplicatePrevention -v` (existing tests)

**Risk 2: W7 Evidence Incompatibility**
- **Mitigation:** Read W7 evidence contract early, verify SHA-256 usage aligns
- **Verification:** Grep for synthetic evidence patterns after each FEAT

**Risk 3: Performance Degradation with Large Repositories**
- **Mitigation:** Use efficient data structures (hash maps for content lookup)
- **Verification:** Benchmark with 1000+ artifact repository (if available)

**Risk 4: Incomplete TypeScript Snapshot Data**
- **Mitigation:** Handle missing fields gracefully (None defaults)
- **Verification:** Test with minimal snapshot fixture (empty evidence)

**Risk 5: Circular Reference in Supersedes Chain**
- **Mitigation:** Max depth limit (100) in `get_artifact_lineage()`
- **Verification:** Test with circular reference fixture

---

## Success Metrics

**Code Quality:**
- Test coverage ≥85% for artifact_policy.py
- All functions have comprehensive docstrings
- No synthetic evidence patterns in production code
- All 32+ tests pass

**Policy Compliance:**
- Duplicate detection prevents versioned file proliferation
- Version conflict resolution selects canonical deterministically
- Rejection policy provides clear, actionable feedback
- Canonical registry enforced before artifact creation

**W7 Integration:**
- All evidence IDs from TypeScript snapshot only
- SHA-256 hashing aligns with W7 verification
- Evidence binding requirements satisfied
- Compatible with W5 placement engine (Gate E-2)

**Backward Compatibility:**
- All 12 existing tests continue to pass
- No breaking changes to public APIs
- Existing consumers unaffected

---

## Next Steps (Post-Implementation)

After Gate E-1 completion:

1. **Gate E-2:** W5 Placement Engine RBAC Consistency (depends on E-1 for canonical RBAC matrix)
2. **Gate F:** Cross-FEAT integration testing (verify E-1 + E-2 work together)
3. **Gate G:** W7 evidence enforcement (verify E-1 evidence binding works with W7)
4. **Migration:** Run duplicate detection on existing repository, generate migration report
5. **Documentation:** Update canonical-artifact-policy.md with implementation details

---

## Estimated Effort

**Total Estimated Effort:** 12-16 hours

**Breakdown:**
- FEAT-001 (Duplicate Detection): 2 hours
- FEAT-002 (Conflict Resolution): 3 hours
- FEAT-003 (Rejection Policy): 1.5 hours
- FEAT-004 (Provenance Tracking): 2.5 hours
- FEAT-005 (Registry Integration): 2 hours
- FEAT-006 (Test Suite): 4 hours
- FEAT-007 (Documentation): 2 hours
- Integration Testing: 1 hour
- Buffer (edge cases, debugging): 2 hours

---

## References

**Requirements Documents:**
- `.agents/tasks/gate-b-w3c-w5-requirements.md` - W3C policy requirements (Section 1)
- `.agents/policies/canonical-artifact-policy.md` - Canonical artifact policy definition
- `.agents/tasks/gate-b-w7-evidence-contract.md` - W7 evidence binding requirements (if exists)

**Implementation Files:**
- `services/project-ai/app/placement/artifact_policy.py` - Current implementation
- `services/project-ai/tests/test_artifact_policy.py` - Current tests (12 tests)
- `services/project-ai/app/models/candidate.py` - PlacementDecision enum

**Related Work:**
- Gate B: W3C/W5 requirements specification (defines policy)
- Gate C: W7 evidence enforcement (evidence binding)
- Gate E-2: W5 placement engine (RBAC consistency, depends on E-1)
- Gate D: Integration testing (verifies E-1 + E-2 work together)

**Standards:**
- W3C Canonical Artifact Policy
- W5 Placement Engine Authorization
- W7 Evidence Enforcement
- SHA-256 content hashing
- ISO 8601 timestamps
- pytest test conventions

---

**Plan Status:** ✅ READY FOR IMPLEMENTATION  
**Dependencies Met:** ✅ All requirements documented, codebase analyzed, patterns identified  
**Risk Level:** LOW (no breaking changes, comprehensive tests, backward compatible)  
**Review Required:** NO (follows established patterns, aligns with requirements)

---

**End of Gate E-1 Implementation Plan**
