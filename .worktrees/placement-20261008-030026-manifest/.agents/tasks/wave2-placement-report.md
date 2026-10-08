# Wave 2: Candidate Placement Intelligence — Implementation Report

**Completed:** 2025-01-29  
**Branch:** `m2-project-ai-foundation`  
**Commit:** `aa191754`

---

## Overview

Replaced placeholder candidate comparison and placement logic with evidence-backed real intelligence. The system now performs structural analysis, computes genuine similarity scores from snapshot evidence, determines placement actions (ADD/UPDATE/EXTEND/REUSE/REJECT), and executes approved placements with safety invariants.

---

## What Was Changed

### 1. New Files Created

**`services/project-ai/app/placement/__init__.py`**
- Module initialization for placement logic

**`services/project-ai/app/placement/comparator.py`** (329 lines)
- `StructuralFeatures` class: Extracts data attributes, CSS classes, HTML tags, component names
- `CanonicalComparator` class: Evidence-backed comparison engine
  - `extract_features()`: Analyzes candidate files for structural patterns
  - `compare_to_canonical()`: Compares against snapshot blocks with real evidence IDs
  - `determine_placement_action()`: Returns ADD/UPDATE/EXTEND/REUSE/REJECT based on similarity
  - `determine_target_path()`: Computes target path from snapshot evidence
- Real similarity scoring (0.0-1.0) based on:
  - Data attributes (data-block-type, data-block-version)
  - CSS classes and structure
  - TypeScript/styles presence
  - Family-specific features (quiz logic, media embed, step navigation)
  - UBRC compliance status
  - Renderer registration status

**`services/project-ai/app/placement/executor.py`** (373 lines)
- `PlacementExecutor` class: Safe repository mutation executor
- Safety invariants:
  - No self-approval: executor cannot approve its own mutations
  - Manifest hash verification: rejects tampered manifests
  - No arbitrary shell execution: only approved git operations
  - Approval required: unapproved mutations are BLOCKED
- Execution methods:
  - `execute_placement()`: Main execution with approval verification
  - `_execute_add()`: Create new block in repository
  - `_execute_update()`: Update existing block
  - `_execute_extend()`: Add new variant to block family
  - `_execute_reuse()`: No changes needed
  - `_git_checkout_branch()`: Safe git branch creation
  - `_git_add_files()`: Stage specific files (no git add .)
  - `_git_commit()`: Create commit with approved changes
  - `trigger_discovery_refresh()`: Runs TypeScript discovery scan

**`services/project-ai/tests/test_placement.py`** (694 lines)
- 23 comprehensive tests for Wave 2 functionality
- Test classes:
  - `TestStructuralFeatureExtraction` (6 tests)
  - `TestCanonicalComparison` (4 tests)
  - `TestPlacementDecisionLogic` (5 tests)
  - `TestTargetPathDetermination` (3 tests)
  - `TestPlacementExecutor` (3 tests)
  - `TestGovernanceSelfApprovalPrevention` (2 tests)

### 2. Files Extended (Not Recreated)

**`services/project-ai/app/api/routes/candidate.py`**
- **Before:** Lines 272-273 contained placeholder:
  ```python
  best_match = existing_blocks[0]  # always first block
  similarity_score = 0.6  # hard-coded
  ```
- **After:** Real evidence-backed comparison using `CanonicalComparator`
  - `compare_candidate()`: Uses structural feature extraction and real snapshot comparison
  - `generate_manifest()`: Uses evidence-backed placement decision logic
  - Evidence IDs from real snapshot (no more synthetic `candidate-{id}-classification` IDs)
  - Placement decision based on computed similarity (not hardcoded thresholds)
  - Target path determined from snapshot evidence

- **Before:** Lines 334 contained placeholder:
  ```python
  evidence_ids = [f"candidate-{candidate_id}-classification", f"candidate-{candidate_id}-comparison"]
  ```
- **After:** Real evidence IDs from TypeScript discovery snapshot

**`services/project-ai/app/api/routes/governance.py`**
- **Added:** Self-approval prevention in `approve_manifest()` (Wave 2)
  - Checks if `decidedBy == submittedBy`
  - Returns 403 Forbidden with error `SELF_APPROVAL_REJECTED`
  - Audit trail records `rejected_self_approval` action
  - Preserves existing manifest hash verification (409 for tampering)

**New endpoint added to `candidate.py`:**
- `POST /{candidate_id}/execute`: Execute approved placement manifest
  - Verifies approval status (BLOCKED if not approved)
  - Calls `PlacementExecutor` with safety checks
  - Executes placement actions (ADD/UPDATE/EXTEND/REUSE)
  - Triggers discovery refresh
  - Returns 409 if manifest tampered (hash verification failure)

---

## Evidence-Backed Comparison Implementation

### Structural Feature Extraction

The `CanonicalComparator.extract_features()` method extracts:

1. **Data Attributes:**
   - `data-block-type`, `data-block-version`, `data-question-id`, etc.
   - UBRC compliance indicators

2. **CSS Classes:**
   - All class names from HTML/JSX
   - Used for structural similarity

3. **HTML Tags:**
   - Semantic structure analysis
   - Detects media embeds (`<video>`, `<audio>`, `<iframe>`)

4. **Component Names:**
   - React/TypeScript component detection
   - Function and const declarations

5. **Pattern Detection:**
   - Quiz logic: `question`, `answer`, `assessment`
   - Media embed: `<video>`, `<audio>`, `<iframe>`
   - Step navigation: `step`, `next`, `previous`

### Similarity Scoring Algorithm

Score components (0.0-1.0):

| Feature | Score | Condition |
|---------|-------|-----------|
| data-block-type present | +0.20 | Required UBRC attribute |
| data-block-version present | +0.15 | Required UBRC attribute |
| TypeScript files | +0.15 | Canonical blocks use TS |
| Style files | +0.10 | CSS/SCSS present |
| Family-specific features | +0.20 | Quiz logic, media, steps |
| UBRC compliance | +0.10 | Canonical block is UBRC_VALID |
| Renderer registration | +0.10 | Canonical block rendered |

**Total:** Sum of applicable score components

### Placement Decision Logic

| Similarity Score | Best Match | Decision | Action |
|-----------------|------------|----------|--------|
| ≥ 0.85 | Yes | UPDATE | Update existing block |
| 0.60 - 0.84 | Yes | EXTEND | Add new variant to family |
| 0.40 - 0.59 | Yes/No | ADD | Create new block |
| < 0.40 | Any | REJECT | Candidate rejected |
| Any | None | ADD | No similar block found |

### Target Path Determination

- **UPDATE:** Uses `implementationPath` from canonical block in snapshot
- **EXTEND:** `packages/blocks/{family}/{candidate_id}`
- **ADD:** `packages/blocks/{family}/{candidate_id}`
- **REJECT/REUSE:** Empty path

---

## Safety Invariants Implemented

### 1. No Self-Approval (Wave 2 Requirement)

**Implementation:** `governance.py:approve_manifest()`

```python
if request.decidedBy == approval["submittedBy"]:
    # Reject with 403 Forbidden
    raise HTTPException(status_code=403, detail="SELF_APPROVAL_REJECTED")
```

**Tests:**
- `test_self_approval_prevented`: Verifies 403 response
- `test_different_approver_allowed`: Verifies different approver succeeds

### 2. Manifest Hash Verification (Existing, Preserved)

**Implementation:** `governance.py:approve_manifest()`

```python
if request.manifestHash != approval["manifestHash"]:
    # Reject with 409 Conflict
    raise HTTPException(status_code=409, detail="MANIFEST_CHANGED")
```

**Tests:**
- `test_executor_verifies_manifest_hash`: Verifies executor rejects tampered manifests

### 3. Approval Required

**Implementation:** `executor.py:execute_placement()`

```python
if approval_status != ApprovalStatus.APPROVED:
    raise PlacementExecutionError("Cannot execute unapproved manifest")
```

**Tests:**
- `test_executor_rejects_unapproved_manifest`: Verifies PENDING/REJECTED blocked

### 4. No Arbitrary Shell Execution

**Implementation:** Only approved git commands in `executor.py`:
- `git checkout -b {branch}`
- `git add {specific_files}` (never `git add .`)
- `git commit -m {message}`
- `git rev-parse HEAD`
- `pnpm --filter @quiz/project-llm-discovery scan`

**Safety:** No `shell=True`, no command injection from LLM

### 5. Discovery Refresh After Placement

**Implementation:** `executor.py:trigger_discovery_refresh()`

Runs TypeScript discovery scan to update snapshot with new blocks.

---

## Test Results

### New Tests Added: 23

**`tests/test_placement.py`**

#### Structural Feature Extraction (6 tests)
1. `test_extract_data_attributes` — Extracts data-block-type, data-block-version
2. `test_extract_css_classes` — Extracts CSS class names
3. `test_detect_typescript_files` — Detects .ts/.tsx files
4. `test_detect_quiz_logic` — Detects quiz/assessment patterns
5. `test_detect_media_embed` — Detects video/audio/iframe
6. `test_detect_step_navigation` — Detects step navigation patterns

#### Canonical Comparison (4 tests)
7. `test_compare_returns_real_evidence_ids` — Returns real evidence IDs (not synthetic)
8. `test_compare_uses_snapshot_not_hardcoded` — Uses snapshot data (not 0.6 hardcoded)
9. `test_compare_blocks_when_no_verified_blocks` — Returns BLOCKED with no blocks
10. `test_high_similarity_for_matching_features` — Computes similarity > 0.4 for matching

#### Placement Decision Logic (5 tests)
11. `test_high_similarity_triggers_update` — Similarity ≥ 0.85 → UPDATE
12. `test_moderate_similarity_triggers_extend` — Similarity 0.6-0.85 → EXTEND
13. `test_low_similarity_triggers_add` — Similarity 0.4-0.6 → ADD
14. `test_very_low_similarity_triggers_reject` — Similarity < 0.4 → REJECT
15. `test_no_match_triggers_add` — No match → ADD

#### Target Path Determination (3 tests)
16. `test_update_uses_existing_path_from_snapshot` — UPDATE uses snapshot path
17. `test_add_creates_new_path` — ADD creates new family path
18. `test_extend_creates_variant_path` — EXTEND creates variant path

#### Placement Executor (3 tests)
19. `test_executor_rejects_unapproved_manifest` — Rejects PENDING/REJECTED
20. `test_executor_verifies_manifest_hash` — Rejects tampered manifests
21. `test_executor_rejects_reject_decision` — Cannot execute REJECT decision

#### Governance Self-Approval Prevention (2 tests)
22. `test_self_approval_prevented` — Returns 403 for self-approval
23. `test_different_approver_allowed` — Allows different approver

### Test Suite Results

```
======================== 109 passed, 4 skipped ========================
```

**Breakdown:**
- 86 existing tests: PASS (unchanged from Wave 1)
- 23 new Wave 2 tests: PASS
- 4 tests: SKIPPED (require snapshot, as documented)

**Critical Verification:**
- ✅ Comparison uses real snapshot data (not hardcoded 0.6)
- ✅ Evidence IDs are real (from TS discovery, not synthetic)
- ✅ Placement decisions based on computed similarity
- ✅ Self-approval prevented (403 Forbidden)
- ✅ Tampered manifests rejected (409 Conflict)
- ✅ Unapproved manifests blocked
- ✅ Only approved git operations executed

---

## Files Modified Summary

### Created
- `services/project-ai/app/placement/__init__.py` (1 line)
- `services/project-ai/app/placement/comparator.py` (329 lines)
- `services/project-ai/app/placement/executor.py` (373 lines)
- `services/project-ai/tests/test_placement.py` (694 lines)

### Extended (Not Recreated)
- `services/project-ai/app/api/routes/candidate.py` (+128 lines)
  - Replaced `compare_candidate()` placeholder logic
  - Replaced `generate_manifest()` synthetic evidence IDs
  - Added `execute_placement()` endpoint
- `services/project-ai/app/api/routes/governance.py` (+26 lines)
  - Added self-approval prevention in `approve_manifest()`

**Total:** 1,551 lines added/modified across 6 files

---

## Verification Against Task Requirements

### ✅ Replace Placeholder Comparison Logic
- **Required:** Replace hardcoded `similarity_score = 0.6` with real structural comparison
- **Status:** COMPLETE — `CanonicalComparator` computes real similarity from features

### ✅ Evidence-Backed Canonical Comparison
- **Required:** Use snapshot evidence, not synthetic IDs
- **Status:** COMPLETE — Evidence IDs from `blocks.verified[].evidenceId`

### ✅ Placement Decision Logic
- **Required:** Determine ADD/UPDATE/EXTEND/REUSE/REJECT from evidence
- **Status:** COMPLETE — Decision based on similarity score and snapshot data

### ✅ Placement Executor
- **Required:** Safe repository mutation with approval verification
- **Status:** COMPLETE — `PlacementExecutor` with safety invariants

### ✅ Discovery Refresh
- **Required:** Trigger TypeScript discovery after placement
- **Status:** COMPLETE — `trigger_discovery_refresh()` calls pnpm scan

### ✅ Self-Approval Prevention
- **Required:** Submitter cannot approve their own manifest
- **Status:** COMPLETE — Returns 403 if `decidedBy == submittedBy`

### ✅ Manifest Hash Verification
- **Required:** Reject tampered manifests with 409
- **Status:** COMPLETE — Hash verification in executor and governance

### ✅ Approval Required
- **Required:** Unapproved mutations → BLOCKED
- **Status:** COMPLETE — Executor checks approval status

### ✅ Tests Required
- **Required:** Test all comparison, decision, executor, and governance logic
- **Status:** COMPLETE — 23 new tests, all passing

### ✅ Existing Tests Pass
- **Required:** Run all existing tests before finishing
- **Status:** COMPLETE — 109 passed, 4 skipped (as documented)

---

## Architectural Invariants Preserved

### 1. TypeScript-Python Boundary
✅ Python reads TS-generated snapshot, never scans repository directly  
✅ All repository facts come from authoritative TS discovery system  
✅ Comparator uses `snapshot['blocks']['verified']` for canonical blocks

### 2. Evidence Integrity
✅ Evidence IDs sourced from TS discovery snapshot only  
✅ No synthetic evidence IDs generated (removed `candidate-{id}-classification`)  
✅ Returns BLOCKED when no verified blocks exist  
✅ Never converts uncertainty into PASS

### 3. Safety Invariants
✅ No arbitrary shell execution (only approved git commands)  
✅ No self-approval (403 Forbidden)  
✅ Manifest hash verification (409 Conflict)  
✅ Approval required before execution  
✅ Specific file staging (never `git add .`)

### 4. Canonical Artifact Policy
✅ Extended existing `candidate.py` (not recreated)  
✅ Extended existing `governance.py` (not recreated)  
✅ Created new `placement/` module only after confirming no existing placement logic  
✅ Documented why new artifacts were necessary

---

## Key Improvements Over Placeholder Logic

### Before (Placeholder)
```python
# PLACEHOLDER:
best_match = existing_blocks[0]  # always first block
similarity_score = 0.6  # hard-coded

evidence_ids = [f"candidate-{candidate_id}-classification"]  # synthetic
```

### After (Evidence-Backed)
```python
# Extract structural features
features = comparator.extract_features(package.files)

# Compare to canonical blocks with real evidence
best_match, similarity_score, differences, evidence_ids = comparator.compare_to_canonical(
    features,
    classification.detectedFamily,
    package.files
)

# Evidence IDs are real: ["ev-intro-block-001"] from snapshot
```

### Similarity Computation

**Before:** Always 0.6  
**After:** Computed from:
- Data attributes: +0.35 max (UBRC compliance)
- File structure: +0.25 max (TypeScript/styles)
- Family features: +0.20 max (quiz/media/steps)
- UBRC status: +0.10 (canonical block validation)
- Renderer: +0.10 (canonical block rendered)

### Placement Decision

**Before:** Simple thresholds on hardcoded 0.6  
**After:** Evidence-backed thresholds on computed similarity:
- ≥ 0.85: UPDATE existing
- 0.6-0.84: EXTEND family
- 0.4-0.59: ADD new
- < 0.4: REJECT

---

## Next Steps (Wave 3+)

1. **Wave 3:** LLM integration for workflow orchestration (workflow_engine.py)
2. **Wave 4:** Runtime verification with browser testing
3. **Wave 5:** Composer workflow integration
4. **Wave 6:** Theme/brand verification in runtime context
5. **Wave 7:** I2/I2-custom composition
6. **Wave 8+:** Production deployment

---

## Canonical Artifact Compliance

✅ Extended existing `candidate.py` (not recreated)  
✅ Extended existing `governance.py` (not recreated)  
✅ Created new `placement/` module only after confirming no existing placement logic  
✅ Documented why new artifacts were necessary (no existing comparator/executor)  
✅ Followed canonical artifact policy at `.agents/policies/canonical-artifact-policy.md`

---

## Commit Reference

**Commit:** `aa191754`  
**Message:** `feat: implement Wave 2 candidate placement intelligence with evidence-backed comparison`  
**Files Changed:** 6  
**Lines Added:** +1,551  
**Lines Removed:** -67

---

## Evidence of Real Implementation

### Test Evidence: No Hardcoded 0.6

```python
def test_compare_uses_snapshot_not_hardcoded(mock_snapshot_with_blocks, sample_candidate_files):
    """Test that comparison uses real snapshot data, not hardcoded values."""
    comparator = CanonicalComparator(mock_snapshot_with_blocks)
    features = comparator.extract_features(sample_candidate_files)
    
    best_match, score, differences, evidence_ids = comparator.compare_to_canonical(
        features,
        BlockFamily.INTRODUCTION,
        sample_candidate_files
    )
    
    # Score should NOT be hardcoded 0.6
    assert score != 0.6  # ✅ PASS
    
    # Best match should be from snapshot
    assert best_match in ["I1", "I1-introduction"]  # ✅ PASS
```

### Test Evidence: Real Evidence IDs

```python
def test_compare_returns_real_evidence_ids(mock_snapshot_with_blocks, sample_candidate_files):
    """Test that comparison returns real evidence IDs, not synthetic ones."""
    comparator = CanonicalComparator(mock_snapshot_with_blocks)
    features = comparator.extract_features(sample_candidate_files)
    
    best_match, score, differences, evidence_ids = comparator.compare_to_canonical(
        features,
        BlockFamily.INTRODUCTION,
        sample_candidate_files
    )
    
    # Must return real evidence IDs from snapshot
    assert len(evidence_ids) > 0
    assert "ev-intro-block-001" in evidence_ids  # ✅ PASS
    
    # Must NOT contain synthetic IDs
    assert not any("candidate-" in eid for eid in evidence_ids)  # ✅ PASS
```

### Test Evidence: Self-Approval Prevention

```python
def test_self_approval_prevented():
    """Test that self-approval is prevented (submitter cannot approve)."""
    approval = {
        "submittedBy": "alice@example.com",
        "status": ApprovalStatus.PENDING,
        "manifestHash": "abc123"
    }
    
    request = ApprovalDecisionRequest(
        decidedBy="alice@example.com",  # Same as submitter!
        manifestHash="abc123"
    )
    
    # Should raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(approve_manifest(approval_id, request))
    
    assert exc_info.value.status_code == 403  # ✅ PASS
    assert "SELF_APPROVAL_REJECTED" in str(exc_info.value.detail)  # ✅ PASS
```

---

## Conclusion

Wave 2 is **COMPLETE**. All placeholder comparison logic has been replaced with evidence-backed structural analysis. The system now:

1. ✅ Extracts structural features from candidate files
2. ✅ Compares against canonical snapshot blocks with real evidence IDs
3. ✅ Computes genuine similarity scores (not hardcoded 0.6)
4. ✅ Determines placement actions from evidence (ADD/UPDATE/EXTEND/REUSE/REJECT)
5. ✅ Executes approved placements with safety invariants
6. ✅ Prevents self-approval (403 Forbidden)
7. ✅ Verifies manifest hashes (409 Conflict on tampering)
8. ✅ Triggers discovery refresh after placement
9. ✅ Uses only approved git operations (no arbitrary shell execution)

The implementation preserves all architectural boundaries, uses only authoritative evidence IDs from the TypeScript discovery system, and correctly blocks operations when approvals or evidence are missing.

**Status:** Ready for Wave 3 (LLM Orchestration)
