# E2 Test Migration Analysis: Placement Test Failures

**Investigation Date:** 2025-02-08  
**Scope:** Read-only analysis of placement test failures after execute_placement() signature change

---

## Executive Summary

- **test_placement.py:** 3 tests failing
- **test_placement_executor.py:** 12 tests failing
- **Root Cause:** execute_placement() signature changed to require additional parameters:
  - `approval: ImplementationApproval` (replaces old `ApprovalStatus`)
  - `workflow_requester: str` (new)
  - `candidate_sha256: str` (new)

---

## Current execute_placement() Signature

**File:** `app/placement/executor.py:97`

```python
def execute_placement(
    self,
    manifest: PlacementManifest,
    approval: ImplementationApproval,      # Changed from ApprovalStatus
    candidate_files: List[Any],
    workflow_requester: str,               # NEW
    candidate_sha256: str                  # NEW
) -> Dict[str, Any]:
```

---

## Test File 1: tests/test_placement.py

### Failing Tests (3)

#### 1. `TestPlacementExecutor::test_executor_rejects_unapproved_manifest`
- **Location:** Line 447-457
- **Current Call:**
  ```python
  executor.execute_placement(
      sample_manifest,
      ApprovalStatus.PENDING,  # Wrong: expects ImplementationApproval object
      sample_candidate_files
  )
  ```
- **Missing Arguments:**
  - `approval` - needs ImplementationApproval object instead of ApprovalStatus enum
  - `workflow_requester` - missing
  - `candidate_sha256` - missing

- **Recommended Fixture Values:**
  ```python
  # Create PENDING approval object
  pending_approval = ImplementationApproval(
      approval_id="approval-pending-test",
      workflow_id="wf-test-123",
      candidate_sha256="test-candidate-hash-123",
      target_family="Introduction",
      target_version="1.0.0",
      placement_manifest_id=sample_manifest.manifestId,
      placement_manifest_sha256=sample_manifest.manifestHash,
      approved_by="test-approver@example.com",
      approval_timestamp=datetime.now(timezone.utc).isoformat(),
      status=ImplementationApprovalStatus.PENDING,  # Key: PENDING status
      workflow_requester="test-requester@example.com"
  )
  
  executor.execute_placement(
      manifest=sample_manifest,
      approval=pending_approval,
      candidate_files=sample_candidate_files,
      workflow_requester="test-requester@example.com",
      candidate_sha256="test-candidate-hash-123"
  )
  ```

#### 2. `TestPlacementExecutor::test_executor_verifies_manifest_hash`
- **Location:** Line 459-491
- **Current Call:**
  ```python
  executor.execute_placement(
      tampered_manifest,
      ApprovalStatus.APPROVED,  # Wrong: expects ImplementationApproval object
      sample_candidate_files
  )
  ```
- **Missing Arguments:**
  - `approval` - needs ImplementationApproval object instead of ApprovalStatus enum
  - `workflow_requester` - missing
  - `candidate_sha256` - missing

- **Recommended Fixture Values:**
  ```python
  # Create approval with WRONG manifest hash (to trigger tamper detection)
  approval_with_wrong_hash = ImplementationApproval(
      approval_id="approval-hash-test",
      workflow_id="wf-test-456",
      candidate_sha256="test-candidate-hash-456",
      target_family="Introduction",
      target_version="1.0.0",
      placement_manifest_id=sample_manifest.manifestId,
      placement_manifest_sha256="WRONG-HASH-12345",  # Intentionally wrong
      approved_by="test-approver@example.com",
      approval_timestamp=datetime.now(timezone.utc).isoformat(),
      status=ImplementationApprovalStatus.APPROVED,
      workflow_requester="test-requester@example.com"
  )
  
  executor.execute_placement(
      manifest=tampered_manifest,
      approval=approval_with_wrong_hash,
      candidate_files=sample_candidate_files,
      workflow_requester="test-requester@example.com",
      candidate_sha256="test-candidate-hash-456"
  )
  ```

#### 3. `TestPlacementExecutor::test_executor_rejects_reject_decision`
- **Location:** Line 493-540
- **Current Call:**
  ```python
  executor.execute_placement(
      reject_manifest,
      ApprovalStatus.APPROVED,  # Wrong: expects ImplementationApproval object
      sample_candidate_files
  )
  ```
- **Missing Arguments:**
  - `approval` - needs ImplementationApproval object instead of ApprovalStatus enum
  - `workflow_requester` - missing
  - `candidate_sha256` - missing

- **Recommended Fixture Values:**
  ```python
  # Create APPROVED approval for REJECT manifest (to test rejection logic)
  reject_approval = ImplementationApproval(
      approval_id="approval-reject-test",
      workflow_id="wf-test-789",
      candidate_sha256="test-candidate-hash-789",
      target_family="Custom",
      target_version="1.0.0",
      placement_manifest_id=reject_manifest.manifestId,
      placement_manifest_sha256=reject_manifest.manifestHash,
      approved_by="test-approver@example.com",
      approval_timestamp=datetime.now(timezone.utc).isoformat(),
      status=ImplementationApprovalStatus.APPROVED,
      workflow_requester="test-requester@example.com"
  )
  
  executor.execute_placement(
      manifest=reject_manifest,
      approval=reject_approval,
      candidate_files=sample_candidate_files,
      workflow_requester="test-requester@example.com",
      candidate_sha256="test-candidate-hash-789"
  )
  ```

### Test Fixture Data Analysis

**Existing Fixtures:**
- `sample_manifest` (PlacementManifest) - Lines 400-425
- `sample_candidate_files` (List[CandidateFile]) - Lines 382-398
- `temp_repository` - Lines 358-380

**Missing Fixture:**
- No ImplementationApproval fixture exists in this file
- Import needed: `from app.models.implementation_approval import ImplementationApproval, ImplementationApprovalStatus`

---

## Test File 2: tests/placement/test_placement_executor.py

### Failing Tests (12)

All 12 tests have the **SAME missing argument**: `candidate_sha256`

The tests already pass:
- ✅ `manifest` (PlacementManifest)
- ✅ `approval` (ImplementationApproval)
- ✅ `candidate_files` (List[CandidateFile])
- ✅ `workflow_requester` (str)

Missing:
- ❌ `candidate_sha256` (str)

#### Test Class: TestAuthorizationChecks (7 tests)

1. **test_blocks_missing_approval** (Line 113-139)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

2. **test_blocks_invalid_workflow_id** (Line 141-173)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

3. **test_blocks_hash_mismatch** (Line 175-206)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="WRONG-HASH"` (to test hash mismatch detection)

4. **test_blocks_manifest_id_mismatch** (Line 208-243)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

5. **test_blocks_manifest_sha256_mismatch** (Line 245-278)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

6. **test_blocks_self_approval** (Line 280-312)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

7. **test_blocks_pending_status** (Line 314-339)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

#### Test Class: TestDryRunBeforeMutation (1 test)

8. **test_dry_run_called_before_execute** (Line 346-367)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

#### Test Class: TestHappyPathIntegration (2 tests)

9. **test_full_happy_path** (Line 374-390)
   - Missing: `candidate_sha256`
   - Recommended: `candidate_sha256="candidate-hash-abc123"`

10. **test_happy_path_with_dry_run** (Line 392-410)
    - Missing: `candidate_sha256`
    - Recommended: `candidate_sha256="candidate-hash-abc123"`

#### Test Class: TestManifestHashVerification (1 test)

11. **test_detects_tampered_manifest** (Line 417-443)
    - Missing: `candidate_sha256`
    - Recommended: `candidate_sha256="candidate-hash-abc123"`

#### Test Class: TestEvidenceProduction (1 test)

12. **test_produces_evidence_records** (Line 450-469)
    - Missing: `candidate_sha256`
    - Recommended: `candidate_sha256="candidate-hash-abc123"`

### Test Fixture Data Analysis

**Existing Fixtures:**
- ✅ `temp_repo` (Path) - Creates temporary repository with directory structure
- ✅ `valid_placement_manifest` (PlacementManifest) - Lines 48-71
- ✅ `valid_candidate_files` (List[CandidateFile]) - Lines 74-84
- ✅ `valid_approval` (ImplementationApproval) - Lines 87-101

**Note:** All necessary fixtures exist. Only need to add `candidate_sha256` parameter to all execute_placement() calls.

---

## Migration Table

### test_placement.py (3 tests)

| Test Name | Missing Args | Recommended Fixture Values |
|-----------|-------------|---------------------------|
| `test_executor_rejects_unapproved_manifest` | `approval` (object)<br>`workflow_requester`<br>`candidate_sha256` | `approval=pending_approval` (PENDING status)<br>`workflow_requester="test-requester@example.com"`<br>`candidate_sha256="test-candidate-hash-123"` |
| `test_executor_verifies_manifest_hash` | `approval` (object)<br>`workflow_requester`<br>`candidate_sha256` | `approval=approval_with_wrong_hash` (WRONG hash)<br>`workflow_requester="test-requester@example.com"`<br>`candidate_sha256="test-candidate-hash-456"` |
| `test_executor_rejects_reject_decision` | `approval` (object)<br>`workflow_requester`<br>`candidate_sha256` | `approval=reject_approval` (APPROVED status)<br>`workflow_requester="test-requester@example.com"`<br>`candidate_sha256="test-candidate-hash-789"` |

### test_placement_executor.py (12 tests)

| Test Name | Missing Args | Recommended Fixture Values |
|-----------|-------------|---------------------------|
| `test_blocks_missing_approval` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_blocks_invalid_workflow_id` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_blocks_hash_mismatch` | `candidate_sha256` | `candidate_sha256="WRONG-HASH"` (intentional mismatch) |
| `test_blocks_manifest_id_mismatch` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_blocks_manifest_sha256_mismatch` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_blocks_self_approval` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_blocks_pending_status` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_dry_run_called_before_execute` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_full_happy_path` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_happy_path_with_dry_run` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_detects_tampered_manifest` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |
| `test_produces_evidence_records` | `candidate_sha256` | `candidate_sha256="candidate-hash-abc123"` |

---

## Migration Complexity Assessment

### test_placement.py: MEDIUM COMPLEXITY
- Need to create ImplementationApproval objects (currently using ApprovalStatus enum)
- Need to add import for ImplementationApproval and ImplementationApprovalStatus
- Need to construct approval objects with proper status and hash values
- 3 tests need full parameter reconstruction

### test_placement_executor.py: LOW COMPLEXITY
- All tests already have proper approval objects
- Only need to add single parameter: `candidate_sha256="candidate-hash-abc123"`
- Simple mechanical change across 12 tests
- Can use existing `valid_approval` fixture's candidate_sha256 value as reference

---

## Error Output Examples

### test_placement.py Error
```
TypeError: PlacementExecutor.execute_placement() missing 2 required positional arguments: 
'workflow_requester' and 'candidate_sha256'
```

### test_placement_executor.py Error
```
TypeError: PlacementExecutor.execute_placement() missing 1 required positional argument: 
'candidate_sha256'
```

---

## Recommended Migration Approach

### Phase 1: test_placement_executor.py (Low-hanging fruit)
1. Add `candidate_sha256="candidate-hash-abc123"` to all 12 execute_placement() calls
2. For `test_blocks_hash_mismatch`, use `candidate_sha256="WRONG-HASH"` to test mismatch detection
3. Run tests to verify all pass

### Phase 2: test_placement.py (More complex)
1. Add imports: `from app.models.implementation_approval import ImplementationApproval, ImplementationApprovalStatus`
2. Create approval fixtures for each test scenario:
   - PENDING approval for unapproved manifest test
   - Approval with wrong hash for tamper detection test
   - APPROVED approval for REJECT decision test
3. Replace `ApprovalStatus` enum with `ImplementationApproval` objects
4. Add `workflow_requester` and `candidate_sha256` parameters
5. Run tests to verify all pass

---

## End of Analysis
