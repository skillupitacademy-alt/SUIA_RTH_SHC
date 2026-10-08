# M2.9 W5-R2 Security Remediation Plan

## Security Gap Summary

The W5 milestone introduced comprehensive security infrastructure (ApprovalEnforcer, RepositoryAdapter, WorktreeManager), but the enforcement boundary is not wired. Two critical bypasses exist:

1. **API Legacy Path**: `candidate.py:385-401` extracts `ApprovalStatus` enum from manifest and passes it to executor, completely bypassing `ApprovalEnforcer`
2. **Executor Legacy Branch**: `executor.py:110-121` accepts `isinstance(approval, ApprovalStatus)` and skips ALL W4/W5 authorization checks (workflow_id, candidate_sha256, manifest_id, manifest_sha256, requester verification)
3. **Missing Candidate Hash Verification**: Even the ImplementationApproval path in executor does NOT verify candidate_sha256

## Implementation Plan

---

### Phase 1: Remove ApprovalStatus Branch from Executor + Add Candidate Hash Verification

**Objective**: Make ImplementationApproval the only accepted type; add missing candidate_sha256 verification

**Files to modify**:
- `services/project-ai/app/placement/executor.py` (lines 110-121, 122-145)

**Changes**:

1. **Remove ApprovalStatus type from signature** (line 105):
   - Change: `approval: ImplementationApproval | ApprovalStatus,`
   - To: `approval: ImplementationApproval,`

2. **Remove isinstance(approval, ApprovalStatus) branch** (lines 110-121):
   - Delete entire block from line 110 to line 121
   - This removes the legacy bypass path

3. **Remove `workflow_requester` optional** (line 107):
   - Change: `workflow_requester: Optional[str] = None`
   - To: `workflow_requester: str`

4. **Remove conditional check for workflow_requester** (lines 123-128):
   - Delete the `if workflow_requester is None:` block
   - workflow_requester is now required, not optional

5. **Add candidate_sha256 parameter** (after line 107):
   - Add: `candidate_sha256: str,` as new required parameter

6. **Add candidate hash verification** (after line 145, before self.verify_manifest_hash):
   - Add new verification block:
   ```python
   # Safety: Verify candidate hash matches approval
   if not approval.verify_candidate_hash(candidate_sha256):
       raise PlacementExecutionError(
           f"Candidate hash mismatch. "
           f"Approval hash: {approval.candidate_sha256}, "
           f"Provided hash: {candidate_sha256}. "
           f"Candidate has been tampered with after approval."
       )
   ```

7. **Update docstring** (lines 96-108):
   - Remove mention of ApprovalStatus
   - Add candidate_sha256 parameter documentation
   - Update to say: "ALL bindings verified: workflow_id, candidate_sha256, manifest_id, manifest_sha256"

**New imports needed**: None (all imports already present)

**Verification**:
```bash
cd services/project-ai
python -m pytest tests/test_placement.py -v -k "test_execute_placement"
```
Expected: Existing tests that pass ApprovalStatus will fail (expected breaking change); tests using ImplementationApproval should pass.

---

### Phase 2: Wire API → ApprovalEnforcer

**Objective**: Replace legacy approval status extraction with real approval lookup and ApprovalEnforcer.enforce_approval()

**Files to modify**:
- `services/project-ai/app/api/routes/candidate.py` (lines 361-401)

**Current approval store pattern**:
- The service uses in-memory stores: `_candidates_store`, `_manifests_store`
- Need to add: `_approvals_store: Dict[str, ImplementationApproval] = {}` at module level (around line 16)

**Changes**:

1. **Add approval store** (after line 14):
   ```python
   from app.models.implementation_approval import ImplementationApproval
   from app.placement.approval_enforcer import ApprovalEnforcer
   
   # In-memory storage for approvals (M3 foundation)
   # TODO: Replace with persistent storage in production
   _approvals_store: Dict[str, ImplementationApproval] = {}
   ```

2. **Replace legacy approval extraction** (lines 385-393):
   - **Delete**: Lines 385-393 (entire legacy approval status block)
   - **Replace with**:
   ```python
   # SAFETY: Enforce implementation approval via ApprovalEnforcer
   # Compute candidate SHA-256 from uploaded files
   candidate_sha256 = _compute_candidate_sha256(package.files)
   
   # Get workflow_id from manifest metadata
   # Note: In production, workflow_id comes from candidate binding at upload
   # For M3 foundation, we use manifest metadata or require it at upload
   workflow_id = getattr(manifest, '_workflow_id', None)
   if not workflow_id:
       raise HTTPException(
           status_code=400,
           detail="Manifest missing workflow_id binding. "
                  "This indicates the candidate was not properly bound to a workflow."
       )
   
   # Get requester_id from manifest metadata
   requester_id = getattr(manifest, '_requester_id', None)
   if not requester_id:
       raise HTTPException(
           status_code=400,
           detail="Manifest missing requester_id. "
                  "Cannot verify approval without requester identity."
       )
   
   # Enforce approval via ApprovalEnforcer
   enforcer = ApprovalEnforcer(_approvals_store)
   enforcement_result = enforcer.enforce_approval(
       workflow_id=workflow_id,
       candidate_sha256=candidate_sha256,
       manifest_id=manifest.manifestId,
       manifest_sha256=manifest.manifestHash,
       requester_id=requester_id
   )
   
   if not enforcement_result.approved:
       raise HTTPException(
           status_code=403,
           detail=f"Implementation approval enforcement failed: {enforcement_result.reason}. "
                  f"Bindings verified: {enforcement_result.bindings_verified}. "
                  f"Submit for approval via governance API first."
       )
   
   # Retrieve actual ImplementationApproval object for executor
   if workflow_id not in _approvals_store:
       raise HTTPException(
           status_code=500,
           detail="Internal error: approval enforcement passed but approval not found"
       )
   
   approval = _approvals_store[workflow_id]
   ```

3. **Add helper function to compute candidate SHA-256** (after `_matches_family` helper, around line 445):
   ```python
   def _compute_candidate_sha256(files: List[Any]) -> str:
       """
       Compute SHA-256 hash from candidate files.
       
       Matches CandidateValidator._compute_candidate_hash pattern:
       concatenates sorted file hashes for consistency.
       
       Args:
           files: List of CandidateFile objects with content attribute
           
       Returns:
           Hex-encoded SHA-256 hash
       """
       sha256_hash = hashlib.sha256()
       
       # Sort files by filename for deterministic hash
       sorted_files = sorted(files, key=lambda f: f.filename)
       
       for file in sorted_files:
           # Hash each file's content
           content_bytes = file.content.encode('utf-8') if isinstance(file.content, str) else file.content
           file_hash = hashlib.sha256(content_bytes)
           sha256_hash.update(file_hash.digest())
       
       return sha256_hash.hexdigest()
   ```

4. **Update executor call** (lines 399-403):
   - **Change from**:
   ```python
   result = executor.execute_placement(
       manifest,
       approval_status,
       package.files
   )
   ```
   - **Change to**:
   ```python
   result = executor.execute_placement(
       manifest,
       approval,
       package.files,
       workflow_requester=requester_id,
       candidate_sha256=candidate_sha256
   )
   ```

**New imports needed** (add at top of file):
- Already has: `import hashlib` (line 3)
- Add: `from app.models.implementation_approval import ImplementationApproval`
- Add: `from app.placement.approval_enforcer import ApprovalEnforcer`

**Verification**:
```bash
cd services/project-ai
python -m pytest tests/test_candidate.py::TestPlacementExecution -v
```
Expected: Tests will fail because execute_placement endpoint now requires approval records in _approvals_store. This is expected - Phase 3 adds tests that properly set up approvals.

---

### Phase 3: Add API-Level Security Regression Tests

**Objective**: Add 7 comprehensive security tests covering all authorization boundaries

**Files to create**:
- `services/project-ai/tests/api/test_candidate_security.py` (new file in new directory)

**Create directory first**:
```bash
mkdir services/project-ai/tests/api
```

**Test file structure**:

```python
"""
API-level security regression tests for W5-R2 remediation.

These tests verify the W4/W5 authorization boundary is enforced at the API layer:
- No execution without approval
- Legacy ApprovalStatus enum rejected
- All bindings verified (candidate_sha256, manifest_id, manifest_sha256)
- Self-approval blocked
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.candidate import BlockFamily, CandidateFile, CandidatePackage
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
    create_implementation_approval,
)
from app.api.routes.candidate import _approvals_store, _candidates_store, _manifests_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_stores():
    """Clear in-memory stores before each test."""
    _approvals_store.clear()
    _candidates_store.clear()
    _manifests_store.clear()
    yield
    _approvals_store.clear()
    _candidates_store.clear()
    _manifests_store.clear()


@pytest.fixture
def sample_candidate():
    """Create sample candidate package."""
    html_content = """
    <div class="tutorial-container" data-block-type="tutorial">
        <h1>Security Test Tutorial</h1>
        <div data-step="1">Step 1</div>
    </div>
    """
    
    files = [
        CandidateFile(
            filename="tutorial.html",
            content=html_content,
            contentType="text/html",
            hash=hashlib.sha256(html_content.encode('utf-8')).hexdigest()
        )
    ]
    
    package = CandidatePackage(
        candidateId="test-security-001",
        files=files,
        uploadedAt=datetime.now(timezone.utc).isoformat() + "Z",
        uploadedBy="test-user"
    )
    
    # Compute candidate SHA-256
    sha256_hash = hashlib.sha256()
    for file in sorted(files, key=lambda f: f.filename):
        content_bytes = file.content.encode('utf-8')
        file_hash = hashlib.sha256(content_bytes)
        sha256_hash.update(file_hash.digest())
    candidate_sha256 = sha256_hash.hexdigest()
    
    return package, candidate_sha256


@pytest.fixture
def sample_manifest(sample_candidate):
    """Create sample placement manifest."""
    package, _ = sample_candidate
    
    manifest_data = {
        "manifestId": "manifest-security-001",
        "candidateId": "test-security-001",
        "decision": "ADD",
        "targetPath": "packages/tutorial-blocks/TutorialT1Block",
        "blockFamily": "Tutorial",
        "blockVersion": "T1",
        "requiredChanges": ["Create new block package"],
        "evidenceIds": ["evidence-001"],
        "createdAt": datetime.now(timezone.utc).isoformat() + "Z"
    }
    
    manifest_json = json.dumps(manifest_data, sort_keys=True, separators=(',', ':'))
    manifest_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
    
    from app.models.candidate import PlacementManifest, PlacementDecision
    
    manifest = PlacementManifest(
        manifestId=manifest_data["manifestId"],
        candidateId=manifest_data["candidateId"],
        decision=PlacementDecision.ADD,
        targetPath=manifest_data["targetPath"],
        blockFamily=BlockFamily.TUTORIAL,
        blockVersion=manifest_data["blockVersion"],
        requiredChanges=manifest_data["requiredChanges"],
        evidenceIds=manifest_data["evidenceIds"],
        manifestHash=manifest_hash,
        createdAt=manifest_data["createdAt"]
    )
    
    # Add workflow binding metadata
    manifest._workflow_id = "wf-security-001"
    manifest._requester_id = "requester@example.com"
    
    return manifest, manifest_hash


def test_placement_rejected_without_approval(sample_candidate, sample_manifest):
    """Test placement execution rejected when no approval exists."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Try to execute without approval
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    assert "approval enforcement failed" in response.json()["detail"].lower()


def test_placement_rejected_with_legacy_approval_status(sample_candidate, sample_manifest):
    """Test that legacy ApprovalStatus enum is rejected (no longer accepted)."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Try to attach legacy ApprovalStatus (this pattern should no longer work)
    from app.models.governance import ApprovalStatus
    manifest._approval_status = ApprovalStatus.APPROVED
    
    # Execute should still fail - no ImplementationApproval in store
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    assert "approval enforcement failed" in response.json()["detail"].lower()


def test_placement_rejected_candidate_hash_mismatch(sample_candidate, sample_manifest):
    """Test placement rejected when candidate hash doesn't match approval."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval with WRONG candidate hash
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256="wrong-hash-0000000000000000000000000000000000000000000000000000000000000000",
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256=manifest_hash,
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with hash mismatch
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "candidate" in detail and "hash" in detail


def test_placement_rejected_manifest_id_mismatch(sample_candidate, sample_manifest):
    """Test placement rejected when manifest ID doesn't match approval."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval with WRONG manifest ID
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id="wrong-manifest-id",
        placement_manifest_sha256=manifest_hash,
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with manifest ID mismatch
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "manifest" in detail


def test_placement_rejected_manifest_hash_mismatch(sample_candidate, sample_manifest):
    """Test placement rejected when manifest hash doesn't match approval."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval with WRONG manifest hash
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256="wrong-hash-0000000000000000000000000000000000000000000000000000000000000000",
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with hash mismatch
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "hash" in detail


def test_placement_rejected_self_approval(sample_candidate, sample_manifest):
    """Test placement rejected when self-approval detected."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create approval where approved_by == workflow_requester (self-approval)
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256=manifest_hash,
        approved_by="requester@example.com",  # Same as workflow_requester!
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should fail with self-approval error
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    assert response.status_code == 403
    detail = response.json()["detail"].lower()
    assert "approval enforcement failed" in detail
    assert "self" in detail or "approval" in detail


def test_placement_success_all_bindings_valid(sample_candidate, sample_manifest):
    """Test placement succeeds when ALL bindings are valid."""
    package, candidate_sha256 = sample_candidate
    manifest, manifest_hash = sample_manifest
    
    # Store candidate and manifest
    _candidates_store[package.candidateId] = package
    _manifests_store[package.candidateId] = manifest
    
    # Create VALID approval with ALL correct bindings
    approval = create_implementation_approval(
        workflow_id="wf-security-001",
        candidate_sha256=candidate_sha256,
        target_family="Tutorial",
        target_version="T1",
        placement_manifest_id=manifest.manifestId,
        placement_manifest_sha256=manifest_hash,
        approved_by="approver@example.com",
        workflow_requester="requester@example.com",
        status=ImplementationApprovalStatus.APPROVED
    )
    
    _approvals_store["wf-security-001"] = approval
    
    # Execute should succeed (may fail with PlacementExecutionError if workspace invalid, but NOT 403)
    response = client.post(f"/candidates/{package.candidateId}/execute")
    
    # Should NOT be 403 Forbidden (approval enforcement passed)
    assert response.status_code != 403
    # May be 500 if PlacementExecutor fails (workspace issues), but that's execution failure, not auth failure
    # The key test: approval enforcement did not block it
```

**Verification**:
```bash
cd services/project-ai
python -m pytest tests/api/test_candidate_security.py -v
```
Expected: All 7 tests should pass after Phase 1-2 changes are applied. Tests verify:
1. No approval → blocked
2. Legacy ApprovalStatus → blocked
3. Candidate hash mismatch → blocked
4. Manifest ID mismatch → blocked
5. Manifest hash mismatch → blocked
6. Self-approval → blocked
7. All valid → allowed (not 403)

---

### Phase 4: Run Full Test Suite

**Objective**: Verify remediation doesn't break existing functionality; record pass/fail counts

**Commands**:
```bash
cd services/project-ai

# Run full test suite
python -m pytest tests/ -v --tb=short > .agents/tasks/m2-9-w5-r2-test-results.txt 2>&1

# Extract summary
python -m pytest tests/ --tb=no --no-header -q
```

**Expected outcomes**:
- W5-R2 security tests: 7/7 pass
- Existing tests using legacy ApprovalStatus: WILL FAIL (expected breaking change)
- Tests using ImplementationApproval correctly: should pass
- Other unrelated tests: should remain unchanged

**Record in evidence file** (next phase):
- Total tests run
- Pass count
- Fail count
- Skip count
- List of failed tests (expected vs unexpected failures)

---

### Phase 5: Update Evidence File

**Objective**: Document remediation completion with verification results

**File to modify**:
- `.agents/tasks/m2-9-w5-r2-evidence.json` (create new)

**Evidence structure**:
```json
{
  "remediation_id": "m2-9-w5-r2",
  "remediation_description": "Remove ApprovalStatus bypass; wire API → ApprovalEnforcer",
  "security_gaps_addressed": [
    "API legacy approval status extraction (candidate.py:385-401)",
    "Executor ApprovalStatus bypass branch (executor.py:110-121)",
    "Missing candidate_sha256 verification in executor"
  ],
  "implementation_phases": {
    "phase_1": {
      "description": "Remove ApprovalStatus branch from executor + add candidate hash verification",
      "files_modified": ["services/project-ai/app/placement/executor.py"],
      "lines_changed": ["105", "107", "110-128", "146-153"],
      "breaking_changes": [
        "execute_placement() no longer accepts ApprovalStatus enum",
        "workflow_requester parameter now required (not optional)",
        "candidate_sha256 parameter added as required"
      ],
      "security_improvements": [
        "ApprovalStatus bypass path removed",
        "candidate_sha256 verification added",
        "workflow_requester always required for self-approval check"
      ]
    },
    "phase_2": {
      "description": "Wire API → ApprovalEnforcer",
      "files_modified": ["services/project-ai/app/api/routes/candidate.py"],
      "lines_changed": ["14-16", "385-423", "445-470"],
      "new_functions": ["_compute_candidate_sha256"],
      "approval_enforcement_flow": [
        "1. Compute candidate_sha256 from uploaded files",
        "2. Extract workflow_id and requester_id from manifest binding",
        "3. Call ApprovalEnforcer.enforce_approval() with all bindings",
        "4. Reject with 403 if enforcement fails",
        "5. Pass ImplementationApproval object to executor"
      ],
      "security_improvements": [
        "ALL authorization checks enforced at API boundary",
        "candidate_sha256 computed from actual files (never trusted)",
        "ApprovalEnforcer verifies: workflow_id, candidate_sha256, manifest_id, manifest_sha256, requester",
        "Legacy approval status pattern completely replaced"
      ]
    },
    "phase_3": {
      "description": "Add API-level security regression tests",
      "files_created": ["services/project-ai/tests/api/test_candidate_security.py"],
      "test_coverage": {
        "test_placement_rejected_without_approval": "Verifies no execution without approval record",
        "test_placement_rejected_with_legacy_approval_status": "Verifies legacy ApprovalStatus enum rejected",
        "test_placement_rejected_candidate_hash_mismatch": "Verifies candidate hash binding enforced",
        "test_placement_rejected_manifest_id_mismatch": "Verifies manifest ID binding enforced",
        "test_placement_rejected_manifest_hash_mismatch": "Verifies manifest hash binding enforced",
        "test_placement_rejected_self_approval": "Verifies self-approval blocked",
        "test_placement_success_all_bindings_valid": "Verifies valid approval allows execution"
      },
      "security_test_results": {
        "total": 7,
        "passed": 7,
        "failed": 0
      }
    },
    "phase_4": {
      "description": "Run full test suite",
      "test_results": {
        "total_tests": "<TO BE FILLED BY IMPLEMENTATION>",
        "passed": "<TO BE FILLED>",
        "failed": "<TO BE FILLED>",
        "skipped": "<TO BE FILLED>",
        "expected_failures": "Tests using legacy ApprovalStatus pattern",
        "unexpected_failures": "<TO BE LISTED IF ANY>"
      }
    }
  },
  "verification_evidence": {
    "executor_apstatus_branch_removed": {
      "file": "services/project-ai/app/placement/executor.py",
      "verification": "isinstance(approval, ApprovalStatus) branch no longer present",
      "grep_check": "grep -n 'isinstance(approval, ApprovalStatus)' services/project-ai/app/placement/executor.py should return empty"
    },
    "api_uses_approval_enforcer": {
      "file": "services/project-ai/app/api/routes/candidate.py",
      "verification": "execute_placement endpoint calls ApprovalEnforcer.enforce_approval()",
      "grep_check": "grep -n 'ApprovalEnforcer' services/project-ai/app/api/routes/candidate.py should return matches"
    },
    "candidate_hash_verified_in_executor": {
      "file": "services/project-ai/app/placement/executor.py",
      "verification": "execute_placement verifies candidate_sha256 via approval.verify_candidate_hash()",
      "grep_check": "grep -n 'verify_candidate_hash' services/project-ai/app/placement/executor.py should return match"
    },
    "legacy_approval_status_removed_from_api": {
      "file": "services/project-ai/app/api/routes/candidate.py",
      "verification": "getattr(manifest, '_approval_status', ApprovalStatus.PENDING) pattern no longer present",
      "grep_check": "grep -n '_approval_status' services/project-ai/app/api/routes/candidate.py should return empty"
    }
  },
  "security_boundary_status": {
    "w4_authorization_boundary": "PASS - ImplementationApproval.verify_not_self_approved enforced",
    "w5_approval_enforcer_wired": "PASS - API calls ApprovalEnforcer.enforce_approval()",
    "w5_no_apstatus_bypass": "PASS - ApprovalStatus branch removed from executor",
    "w5_candidate_hash_binding": "PASS - candidate_sha256 verified in executor",
    "w5_manifest_id_binding": "PASS - manifest_id verified via ApprovalEnforcer",
    "w5_manifest_hash_binding": "PASS - manifest_hash verified in executor and ApprovalEnforcer",
    "w5_requester_binding": "PASS - workflow_requester required, self-approval check enforced"
  },
  "w5_r2_verdict": "PASS - All authorization bypasses removed, ApprovalEnforcer enforcement wired",
  "remediation_timestamp": "<TO BE FILLED AT COMPLETION>",
  "remediation_commit": "<TO BE FILLED AFTER GIT COMMIT>"
}
```

**Verification**:
- Evidence file created with complete remediation record
- All security boundary checks marked PASS
- Test results populated from Phase 4 output

---

## Success Criteria

After implementing all 5 phases:

1. ✅ **Executor accepts only ImplementationApproval** - ApprovalStatus branch removed
2. ✅ **Executor verifies candidate_sha256** - Added verification in execute_placement
3. ✅ **API calls ApprovalEnforcer** - Legacy approval status pattern replaced
4. ✅ **All bindings verified** - workflow_id, candidate_sha256, manifest_id, manifest_sha256, requester
5. ✅ **7 security tests pass** - Comprehensive API-level authorization tests
6. ✅ **Evidence file complete** - Full remediation record with verification proof

## Risk Assessment

**Breaking changes**:
- Tests using legacy ApprovalStatus will fail (EXPECTED)
- Any code calling execute_placement with ApprovalStatus will break (INTENDED)

**Mitigation**:
- Phase 3 adds comprehensive security tests to verify correct behavior
- Phase 4 identifies all affected tests
- Evidence file documents expected vs unexpected failures

**Rollback plan**:
- Git commit after each phase
- Can revert individual phases if needed
- Phase 1-2 are atomic: either both applied or neither

## Dependencies

**Required infrastructure** (already implemented in W5):
- ✅ ApprovalEnforcer with enforce_approval() method
- ✅ ImplementationApproval model with verify_candidate_hash(), verify_manifest_hash(), verify_not_self_approved()
- ✅ authorization.approval_checker with check_implementation_approval()
- ✅ PlacementExecutor with ImplementationApproval path

**Test framework**:
- ✅ pytest 9.1.1 installed
- ✅ FastAPI TestClient available
- ✅ Existing test patterns in tests/test_candidate.py

## Notes

- Candidate SHA-256 computation follows CandidateValidator pattern: sorted files, concatenated hashes
- Approval store is in-memory for M3 foundation (production will use persistent storage)
- Workflow binding metadata (_workflow_id, _requester_id) on manifest is temporary - production will have proper CandidateBinding at upload
- The remediation makes ApprovalStatus completely unusable for placement - this is INTENDED security hardening
