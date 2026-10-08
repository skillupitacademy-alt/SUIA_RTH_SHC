# M2.9 W4-R1 Security Remediation Implementation Plan

## Executive Summary

W4 implementation passed automated gates (54/54 tests) but independent security review identified **3 confirmed authorization bypasses**. This plan provides surgical fixes to close these gaps without expanding scope beyond the authorization boundary.

**Finding A (HIGH)**: Self-approval bypass when `workflow_requester` is None  
**Finding B (HIGH)**: Hash verification bypass via empty-string defaults  
**Finding C (MEDIUM)**: Expiry documentation drift (no actual requirement found)

All fixes maintain W4 scope: authorization boundary only, no repository placement, no runtime verification, no W5 work.

---

## Investigation Summary

### Canonical Contract Analysis

**Reviewed:**
- `.agents/specs/m2-implementation-specification.md` — No approval expiry requirement
- `ILS_UI_UX/docs/PROJECT_LLM_MVP_IMPLEMENTATION_CONTRACT.md` — References "implementation approval" but no expiry/TTL
- `services/project-ai/README.md` — W3 and W4 architecture, no expiry mentioned
- `.agents/tasks/m2-9-w4-review.json` — 3 findings confirmed
- `.agents/tasks/m2-9-w4-evidence.json` — 54 tests passed, all claiming PASS

**Conclusion:** No M2.9 canonical requirement for approval expiry. The `approval_checker.py` docstring saying "Must not be expired (if expiry exists in approval model)" is **documentation drift** — a conditional that was never fulfilled. The correct remediation is to **remove the expiry claim**, not implement expiry.

### Security Bypass Confirmation

**Finding A — Self-Approval Bypass:**
```python
# implementation_approval.py line ~90
def verify_not_self_approved(self, requester_id: str) -> bool:
    if self.workflow_requester:
        return self.approved_by != self.workflow_requester
    
    # BYPASS: if workflow_requester is None and requester_id is "", returns True
    return self.approved_by != requester_id
```

**Finding B — Hash Verification Bypass:**
```python
# canonical_workflow.py line ~340+
def can_transition_to_implementing(
    workflow_id: str,
    approvals_store: dict,
    requester_id: str = "",  # ← empty default
    candidate_sha256: str = "",  # ← empty default
    manifest_id: str = "",  # ← empty default
    manifest_sha256: str = ""  # ← empty default
) -> tuple[bool, str]:
    # ...
    # BYPASS: if candidate_sha256 and ... evaluates False for "", skipping check
    if candidate_sha256 and not approval.verify_candidate_hash(candidate_sha256):
        return (False, "Candidate hash mismatch: ...")
```

Test `test_transition_without_optional_parameters` **validates the bypass as acceptable**, which confirms the test contract itself was too permissive.

### Test Coverage Gaps

Current W4 tests (45 collected):
- **13** `test_implementation_approval.py` — hash verification, self-approval, validation
- **9** `test_workflow_transitions.py` — transition guards, includes bypass validation
- **11** `test_authorization_checker.py` — authorization hook, includes skip validation
- **12** `test_approval_gate.py` — endpoint integration tests

**Missing tests:**
- Self-approval bypass when `workflow_requester=None` AND `requester_id=""`
- Hash verification rejection when ANY hash parameter is missing
- Authorization checker blocking missing requester (not just skipping)
- Expiry claim removal verification

---

## Implementation Plan

### ☐ 1. Fix Self-Approval Fail-Closed (Finding A)

**What:** Remove fallback logic in `verify_not_self_approved()` that bypasses self-approval check when `workflow_requester` is None. Make `workflow_requester` mandatory.

**Files to modify:**

1. **`services/project-ai/app/models/implementation_approval.py`**
   - Change `verify_not_self_approved()` to fail-closed when `workflow_requester` is None:
     ```python
     def verify_not_self_approved(self, requester_id: str) -> bool:
         """
         Verify approval is not self-approval.
         
         Enforces separation of duties: approver must differ from workflow requester.
         
         Args:
             requester_id: Workflow requester identity (for evidence only)
             
         Returns:
             True if not self-approved, False if self-approved or requester missing
         """
         # Fail-closed: missing workflow_requester means we cannot verify separation of duties
         if not self.workflow_requester:
             return False
         
         return self.approved_by != self.workflow_requester
     ```
   - Update docstring in `ImplementationApproval` class to state `workflow_requester` is mandatory for approval verification
   - Update `is_valid_for_implementation()` docstring to clarify that missing `workflow_requester` causes validation failure

2. **`services/project-ai/app/models/implementation_approval.py` (factory function)**
   - Make `workflow_requester` parameter required (remove `Optional`, remove default `None`):
     ```python
     def create_implementation_approval(
         workflow_id: str,
         candidate_sha256: str,
         target_family: str,
         target_version: str,
         placement_manifest_id: str,
         placement_manifest_sha256: str,
         approved_by: str,
         workflow_requester: str,  # ← REQUIRED, no Optional, no default
         status: ImplementationApprovalStatus = ImplementationApprovalStatus.PENDING,
         rejection_reason: Optional[str] = None
     ) -> ImplementationApproval:
     ```

3. **`services/project-ai/app/api/routes/governance.py`**
   - Ensure `approve_placement()` endpoint always provides `workflow_requester` from `workflow.get("requester")` but **fail with 500** if requester is missing:
     ```python
     workflow_requester = workflow.get("requester")
     if not workflow_requester:
         raise HTTPException(
             status_code=500,
             detail={
                 "error": "WORKFLOW_REQUESTER_MISSING",
                 "message": "Workflow requester field is required but missing",
                 "workflow_id": workflow_id
             }
         )
     ```

**New tests to add:**

4. **`services/project-ai/tests/test_implementation_approval.py`**
   - `test_missing_workflow_requester_rejected()`:
     ```python
     def test_missing_workflow_requester_rejected():
         """Test verify_not_self_approved returns False when workflow_requester is None."""
         approval = ImplementationApproval(
             approval_id="test-id",
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             approval_timestamp=datetime.now(timezone.utc).isoformat(),
             status=ImplementationApprovalStatus.APPROVED,
             workflow_requester=None,  # Missing
             evidence={}
         )
         
         # Should fail-closed when workflow_requester is missing
         assert approval.verify_not_self_approved("any@example.com") is False
     ```
   
   - `test_is_valid_for_implementation_fails_missing_requester()`:
     ```python
     def test_is_valid_for_implementation_fails_missing_requester():
         """Test is_valid_for_implementation returns False when workflow_requester is None."""
         approval = ImplementationApproval(
             approval_id="test-id",
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             approval_timestamp=datetime.now(timezone.utc).isoformat(),
             status=ImplementationApprovalStatus.APPROVED,
             workflow_requester=None,  # Missing
             evidence={}
         )
         
         is_valid = approval.is_valid_for_implementation(
             requester_id="requester@example.com",
             candidate_sha256="abc123",
             manifest_id="manifest-456",
             manifest_sha256="def456",
         )
         
         assert is_valid is False
     ```

**Existing tests to update:**

5. **`services/project-ai/tests/test_implementation_approval.py`**
   - All 13 tests must pass `workflow_requester` parameter to `create_implementation_approval()` (change from optional to required)
   - Update any tests that rely on the fallback behavior to expect failure

6. **`services/project-ai/tests/test_workflow_transitions.py`**
   - All 9 tests must ensure workflow requester is populated
   
7. **`services/project-ai/tests/test_authorization_checker.py`**
   - All 11 tests must ensure workflow requester is populated

8. **`services/project-ai/tests/unit/test_approval_gate.py`**
   - All 12 tests must ensure workflow requester is populated

**Verify:** 
```bash
cd services/project-ai
python -m pytest tests/test_implementation_approval.py -v -k "missing_requester or self_approval"
```
Expected: 2 new tests pass, existing self-approval tests still pass with updated contract.

---

### ☐ 2. Fix Mandatory Hash Verification (Finding B)

**What:** Remove empty-string defaults from `can_transition_to_implementing()` and make all security-critical parameters required. Return explicit failure when any parameter is missing.

**Files to modify:**

1. **`services/project-ai/app/orchestration/canonical_workflow.py`**
   - Remove default values for security-critical parameters in `can_transition_to_implementing()`:
     ```python
     def can_transition_to_implementing(
         workflow_id: str,
         approvals_store: dict,
         requester_id: str,  # ← REQUIRED, no default
         candidate_sha256: str,  # ← REQUIRED, no default
         manifest_id: str,  # ← REQUIRED, no default
         manifest_sha256: str  # ← REQUIRED, no default
     ) -> tuple[bool, str]:
         """
         Check if workflow can transition to IMPLEMENTING state.
         
         AUTHORIZATION GATES:
         - ImplementationApproval must exist for workflow_id
         - Approval status must be APPROVED
         - Candidate hash must match approval record (REQUIRED)
         - Manifest ID must match approval record (REQUIRED)
         - Manifest hash must match approval record (REQUIRED)
         - Must not be self-approved (REQUIRED)
         
         Args:
             workflow_id: Workflow identifier
             approvals_store: Dictionary of ImplementationApproval records (keyed by workflow_id)
             requester_id: Workflow requester identity (REQUIRED for self-approval check)
             candidate_sha256: Candidate hash to verify (REQUIRED)
             manifest_id: Placement manifest ID to verify (REQUIRED)
             manifest_sha256: Placement manifest hash to verify (REQUIRED)
             
         Returns:
             Tuple of (can_transition: bool, reason: str)
             - (True, "") if transition authorized
             - (False, reason) if transition blocked
         """
         # Check if approval exists
         if workflow_id not in approvals_store:
             return (False, f"No implementation approval found for workflow {workflow_id}")
         
         approval = approvals_store[workflow_id]
         
         # Check if approval status is APPROVED
         from app.models.implementation_approval import ImplementationApprovalStatus
         if approval.status != ImplementationApprovalStatus.APPROVED:
             return (False, f"Approval status is {approval.status.value}, expected APPROVED")
         
         # REQUIRED: Verify requester_id provided
         if not requester_id:
             return (False, "Missing required parameter: requester_id")
         
         # REQUIRED: Verify candidate hash provided
         if not candidate_sha256:
             return (False, "Missing required parameter: candidate_sha256")
         
         # REQUIRED: Verify manifest ID provided
         if not manifest_id:
             return (False, "Missing required parameter: manifest_id")
         
         # REQUIRED: Verify manifest hash provided
         if not manifest_sha256:
             return (False, "Missing required parameter: manifest_sha256")
         
         # Verify candidate hash matches
         if not approval.verify_candidate_hash(candidate_sha256):
             return (
                 False,
                 f"Candidate hash mismatch: expected {approval.candidate_sha256}, got {candidate_sha256}"
             )
         
         # Verify manifest ID matches
         if approval.placement_manifest_id != manifest_id:
             return (
                 False,
                 f"Manifest ID mismatch: expected {approval.placement_manifest_id}, got {manifest_id}"
             )
         
         # Verify manifest hash matches
         if not approval.verify_manifest_hash(manifest_sha256):
             return (
                 False,
                 f"Manifest hash mismatch: expected {approval.placement_manifest_sha256}, got {manifest_sha256}"
             )
         
         # Verify not self-approved
         if not approval.verify_not_self_approved(requester_id):
             return (
                 False,
                 f"Self-approval detected: approver '{approval.approved_by}' is the workflow requester"
             )
         
         # All checks passed
         return (True, "")
     ```

**New tests to add:**

2. **`services/project-ai/tests/test_workflow_transitions.py`**
   
   - `test_transition_blocked_missing_requester_id()`:
     ```python
     def test_transition_blocked_missing_requester_id():
         """Test transition blocked when requester_id is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         can_transition, reason = can_transition_to_implementing(
             workflow_id="wf-123",
             approvals_store=approvals_store,
             requester_id="",  # Empty/missing
             candidate_sha256="abc123",
             manifest_id="manifest-456",
             manifest_sha256="def456",
         )
         
         assert can_transition is False
         assert "Missing required parameter: requester_id" in reason
     ```
   
   - `test_transition_blocked_missing_candidate_sha256()`:
     ```python
     def test_transition_blocked_missing_candidate_sha256():
         """Test transition blocked when candidate_sha256 is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         can_transition, reason = can_transition_to_implementing(
             workflow_id="wf-123",
             approvals_store=approvals_store,
             requester_id="requester@example.com",
             candidate_sha256="",  # Empty/missing
             manifest_id="manifest-456",
             manifest_sha256="def456",
         )
         
         assert can_transition is False
         assert "Missing required parameter: candidate_sha256" in reason
     ```
   
   - `test_transition_blocked_missing_manifest_id()`:
     ```python
     def test_transition_blocked_missing_manifest_id():
         """Test transition blocked when manifest_id is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         can_transition, reason = can_transition_to_implementing(
             workflow_id="wf-123",
             approvals_store=approvals_store,
             requester_id="requester@example.com",
             candidate_sha256="abc123",
             manifest_id="",  # Empty/missing
             manifest_sha256="def456",
         )
         
         assert can_transition is False
         assert "Missing required parameter: manifest_id" in reason
     ```
   
   - `test_transition_blocked_missing_manifest_sha256()`:
     ```python
     def test_transition_blocked_missing_manifest_sha256():
         """Test transition blocked when manifest_sha256 is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         can_transition, reason = can_transition_to_implementing(
             workflow_id="wf-123",
             approvals_store=approvals_store,
             requester_id="requester@example.com",
             candidate_sha256="abc123",
             manifest_id="manifest-456",
             manifest_sha256="",  # Empty/missing
         )
         
         assert can_transition is False
         assert "Missing required parameter: manifest_sha256" in reason
     ```

**Existing tests to update:**

3. **`services/project-ai/tests/test_workflow_transitions.py`**
   - **DELETE** `test_transition_without_optional_parameters()` — this test validates the bypass as acceptable, which is the security gap
   - Update all remaining 8 tests to provide all required parameters

**Verify:**
```bash
cd services/project-ai
python -m pytest tests/test_workflow_transitions.py -v
```
Expected: 4 new tests pass (missing parameter rejections), 8 existing tests still pass, 1 test deleted.

---

### ☐ 3. Update Authorization Checker (Finding B extension)

**What:** Update `check_implementation_approval()` to match the new fail-closed contract from `can_transition_to_implementing()`.

**Files to modify:**

1. **`services/project-ai/app/authorization/approval_checker.py`**
   - Remove default values for required parameters:
     ```python
     def check_implementation_approval(
         workflow_id: str,
         candidate_sha256: str,  # ← REQUIRED, no default
         manifest_sha256: str,  # ← REQUIRED, no default
         approvals_store: Dict[str, ImplementationApproval],
         requester_id: str  # ← REQUIRED, no default
     ) -> AuthorizationResult:
         """
         Check if implementation is authorized for a workflow.
         
         PLACEMENT EXECUTOR CONTRACT:
         - Executor MUST call this before any repository write
         - Executor MUST abort if authorized=False
         - Executor MUST NOT proceed with graceful degradation
         
         AUTHORIZATION CHECKS:
         1. Approval record exists for workflow_id
         2. Approval status is APPROVED
         3. Candidate hash matches approval record (REQUIRED)
         4. Manifest hash matches approval record (REQUIRED)
         5. Not self-approved (REQUIRED - requester_id must be provided)
         
         Args:
             workflow_id: Workflow identifier
             candidate_sha256: Candidate hash to verify (REQUIRED)
             manifest_sha256: Placement manifest hash to verify (REQUIRED)
             approvals_store: Dictionary of ImplementationApproval records
             requester_id: Workflow requester identity (REQUIRED for self-approval check)
             
         Returns:
             AuthorizationResult with authorization decision and evidence
         """
         checked_at = datetime.now(timezone.utc).isoformat()
         
         # Validate required parameters
         if not candidate_sha256:
             return AuthorizationResult(
                 authorized=False,
                 approval_id=None,
                 checked_at=checked_at,
                 failure_reason="Missing required parameter: candidate_sha256",
                 evidence={
                     "workflow_id": workflow_id,
                     "parameter_validation": "FAIL",
                     "missing_parameter": "candidate_sha256",
                     "checked_at": checked_at,
                 }
             )
         
         if not manifest_sha256:
             return AuthorizationResult(
                 authorized=False,
                 approval_id=None,
                 checked_at=checked_at,
                 failure_reason="Missing required parameter: manifest_sha256",
                 evidence={
                     "workflow_id": workflow_id,
                     "parameter_validation": "FAIL",
                     "missing_parameter": "manifest_sha256",
                     "checked_at": checked_at,
                 }
             )
         
         if not requester_id:
             return AuthorizationResult(
                 authorized=False,
                 approval_id=None,
                 checked_at=checked_at,
                 failure_reason="Missing required parameter: requester_id",
                 evidence={
                     "workflow_id": workflow_id,
                     "parameter_validation": "FAIL",
                     "missing_parameter": "requester_id",
                     "checked_at": checked_at,
                 }
             )
         
         # ... rest of existing checks unchanged ...
     ```

   - Update self-approval check to never skip:
     ```python
     # Verify not self-approved (REQUIRED - no longer optional)
     if not approval.verify_not_self_approved(requester_id):
         return AuthorizationResult(
             authorized=False,
             approval_id=approval.approval_id,
             checked_at=checked_at,
             failure_reason=(
                 f"Self-approval detected or workflow requester missing"
             ),
             evidence={
                 "workflow_id": workflow_id,
                 "approval_id": approval.approval_id,
                 "approval_found": True,
                 "status": approval.status.value,
                 "self_approval_check": "FAIL",
                 "approved_by": approval.approved_by,
                 "workflow_requester": approval.workflow_requester,
                 "checked_at": checked_at,
             }
         )
     ```

   - Update success evidence to reflect mandatory checks:
     ```python
     # All checks passed - authorized
     return AuthorizationResult(
         authorized=True,
         approval_id=approval.approval_id,
         checked_at=checked_at,
         failure_reason=None,
         evidence={
             "workflow_id": workflow_id,
             "approval_id": approval.approval_id,
             "approval_found": True,
             "status": approval.status.value,
             "status_check": "PASS",
             "candidate_hash_check": "PASS",
             "manifest_hash_check": "PASS",
             "self_approval_check": "PASS",  # ← No longer "SKIPPED"
             "candidate_sha256": approval.candidate_sha256,
             "manifest_sha256": approval.placement_manifest_sha256,
             "approved_by": approval.approved_by,
             "workflow_requester": approval.workflow_requester,
             "approval_timestamp": approval.approval_timestamp,
             "checked_at": checked_at,
         }
     )
     ```

**New tests to add:**

2. **`services/project-ai/tests/test_authorization_checker.py`**
   
   - `test_authorization_blocks_missing_candidate_hash()`:
     ```python
     def test_authorization_blocks_missing_candidate_hash():
         """Test authorization fails when candidate_sha256 is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         result = check_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="",  # Empty/missing
             manifest_sha256="def456",
             approvals_store=approvals_store,
             requester_id="requester@example.com",
         )
         
         assert result.authorized is False
         assert "Missing required parameter: candidate_sha256" in result.failure_reason
         assert result.evidence["parameter_validation"] == "FAIL"
     ```
   
   - `test_authorization_blocks_missing_manifest_hash()`:
     ```python
     def test_authorization_blocks_missing_manifest_hash():
         """Test authorization fails when manifest_sha256 is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         result = check_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             manifest_sha256="",  # Empty/missing
             approvals_store=approvals_store,
             requester_id="requester@example.com",
         )
         
         assert result.authorized is False
         assert "Missing required parameter: manifest_sha256" in result.failure_reason
         assert result.evidence["parameter_validation"] == "FAIL"
     ```
   
   - `test_authorization_blocks_missing_requester_id()`:
     ```python
     def test_authorization_blocks_missing_requester_id():
         """Test authorization fails when requester_id is missing."""
         approval = create_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             target_family="Introduction",
             target_version="I7",
             placement_manifest_id="manifest-456",
             placement_manifest_sha256="def456",
             approved_by="reviewer@example.com",
             workflow_requester="requester@example.com",
             status=ImplementationApprovalStatus.APPROVED,
         )
         
         approvals_store = {"wf-123": approval}
         
         result = check_implementation_approval(
             workflow_id="wf-123",
             candidate_sha256="abc123",
             manifest_sha256="def456",
             approvals_store=approvals_store,
             requester_id="",  # Empty/missing
         )
         
         assert result.authorized is False
         assert "Missing required parameter: requester_id" in result.failure_reason
         assert result.evidence["parameter_validation"] == "FAIL"
     ```

**Existing tests to update:**

3. **`services/project-ai/tests/test_authorization_checker.py`**
   - **DELETE** `test_authorization_without_requester_id()` — validates skip as acceptable, which is the security gap
   - Update all remaining 10 tests to provide all required parameters
   - Update assertions expecting `"self_approval_check": "SKIPPED"` to expect `"PASS"` or `"FAIL"`

**Verify:**
```bash
cd services/project-ai
python -m pytest tests/test_authorization_checker.py -v
```
Expected: 3 new tests pass (missing parameter rejections), 10 existing tests still pass (with updated assertions), 1 test deleted.

---

### ☐ 4. Remove Expiry Documentation Drift (Finding C)

**What:** Remove the expiry claim from authorization checker documentation since M2.9 has no expiry requirement and the model was never designed with expiry.

**Files to modify:**

1. **`services/project-ai/app/authorization/approval_checker.py`**
   - Update module docstring to remove expiry reference:
     ```python
     """
     Implementation Approval Authorization Checker - M2.9 Wave 4
     
     Authorization hook for placement executor to verify implementation approval.
     
     CRITICAL RULE:
     Placement executor MUST call check_implementation_approval() before any
     repository mutation. Executor MUST abort if authorized=False.
     
     AUTHORIZATION GATES:
     - Approval must exist for workflow_id
     - Approval status must be APPROVED
     - Candidate hash must match
     - Manifest hash must match
     - Manifest ID must match (W4-R1: added to enforce exact manifest binding)
     - Must not be self-approved
     
     NO GRACEFUL DEGRADATION:
     Missing or invalid approval MUST return authorized=False, NOT warning-then-True.
     """
     ```
   
   - Update `check_implementation_approval()` docstring to remove expiry:
     ```python
     """
     Check if implementation is authorized for a workflow.
     
     PLACEMENT EXECUTOR CONTRACT:
     - Executor MUST call this before any repository write
     - Executor MUST abort if authorized=False
     - Executor MUST NOT proceed with graceful degradation
     
     AUTHORIZATION CHECKS:
     1. Approval record exists for workflow_id
     2. Approval status is APPROVED
     3. Candidate hash matches approval record (REQUIRED)
     4. Manifest hash matches approval record (REQUIRED)
     5. Not self-approved (REQUIRED - requester_id must be provided)
     
     Args:
         workflow_id: Workflow identifier
         candidate_sha256: Candidate hash to verify (REQUIRED)
         manifest_sha256: Placement manifest hash to verify (REQUIRED)
         approvals_store: Dictionary of ImplementationApproval records
         requester_id: Workflow requester identity (REQUIRED for self-approval check)
         
     Returns:
         AuthorizationResult with authorization decision and evidence
     """
     ```

**No tests needed for documentation changes.**

**Verify:** 
```bash
grep -n "expir" services/project-ai/app/authorization/approval_checker.py
```
Expected: No matches found.

---

### ☐ 5. Update W4-R1 Evidence Artifact

**What:** Create machine-readable evidence artifact documenting all W4-R1 changes, security fixes, and test results.

**Files to create:**

1. **`.agents/tasks/m2-9-w4-r1-evidence.json`**
   ```json
   {
     "wave": "W4-R1",
     "status": "COMPLETE",
     "commit_sha": "<commit SHA after W4-R1 implementation>",
     "w4_baseline": {
       "commit": "56f1030b",
       "review": ".agents/tasks/m2-9-w4-review.json",
       "verdict": "CHANGES_REQUESTED",
       "findings_count": 3
     },
     "changed_files": [
       "services/project-ai/app/models/implementation_approval.py",
       "services/project-ai/app/orchestration/canonical_workflow.py",
       "services/project-ai/app/authorization/approval_checker.py",
       "services/project-ai/tests/test_implementation_approval.py",
       "services/project-ai/tests/test_workflow_transitions.py",
       "services/project-ai/tests/test_authorization_checker.py"
     ],
     "security_fixes": [
       {
         "finding": "A",
         "severity": "high",
         "issue": "Self-approval bypass when workflow_requester is None",
         "fix": "Fail-closed when workflow_requester missing; made parameter required",
         "tests_added": [
           "test_missing_workflow_requester_rejected",
           "test_is_valid_for_implementation_fails_missing_requester"
         ],
         "verified": true
       },
       {
         "finding": "B",
         "severity": "high",
         "issue": "Hash verification bypass via empty-string defaults",
         "fix": "Made all security parameters required; removed defaults; added missing-parameter checks",
         "tests_added": [
           "test_transition_blocked_missing_requester_id",
           "test_transition_blocked_missing_candidate_sha256",
           "test_transition_blocked_missing_manifest_id",
           "test_transition_blocked_missing_manifest_sha256",
           "test_authorization_blocks_missing_candidate_hash",
           "test_authorization_blocks_missing_manifest_hash",
           "test_authorization_blocks_missing_requester_id"
         ],
         "tests_deleted": [
           "test_transition_without_optional_parameters",
           "test_authorization_without_requester_id"
         ],
         "verified": true
       },
       {
         "finding": "C",
         "severity": "medium",
         "issue": "Expiry documentation drift",
         "fix": "Removed expiry claim from approval_checker.py docstrings (no M2.9 expiry requirement found)",
         "tests_added": [],
         "verified": true
       }
     ],
     "test_results": {
       "w4_r1_new_tests": 9,
       "w4_r1_deleted_tests": 2,
       "w4_r1_total_tests": 52,
       "w4_r1_tests_passed": 52,
       "w4_r1_tests_failed": 0,
       "regression_tests_passed": 528,
       "regression_preexisting_failures": 58,
       "regression_new_failures": 0
     },
     "architectural_compliance": {
       "no_pass_without_evidence": true,
       "no_test_weakening": true,
       "single_state_authority": true,
       "machine_readable_evidence": true,
       "no_graceful_degradation": true,
       "evidence_always_populated": true,
       "self_approval_enforced": true,
       "hash_binding_enforced": true,
       "fail_closed_on_missing_parameters": true
     },
     "w4_r1_scope_compliance": {
       "no_repository_placement": true,
       "no_runtime_verification": true,
       "no_browser_verification": true,
       "no_certification": true,
       "authorization_boundary_only": true,
       "surgical_fixes_only": true,
       "no_scope_creep": true
     }
   }
   ```

**Verify:** Populate `commit_sha` after implementation complete, run full test suite, update test counts.

---

### ☐ 6. Run Full Verification

**What:** Execute complete test suite to verify all fixes work correctly and no regressions introduced.

**Commands to run:**

```bash
cd services/project-ai

# Run W4-R1 specific tests
python -m pytest tests/test_implementation_approval.py tests/test_workflow_transitions.py tests/test_authorization_checker.py tests/unit/test_approval_gate.py -v

# Run full Project AI test suite (regression check)
python -m pytest tests/ -v

# Generate coverage report
python -m pytest tests/ --cov=app --cov-report=term --cov-report=html
```

**Expected results:**
- 52 W4-R1 tests pass (45 baseline - 2 deleted + 9 new)
- 0 W4-R1 tests fail
- 528+ regression tests pass
- 58 pre-existing failures (unchanged from W4 baseline)
- 0 new regression failures
- Coverage ≥ 85% for modified modules

**Verify:**
- Self-approval bypass fixed: missing `workflow_requester` → authorization BLOCKED
- Hash verification bypass fixed: missing any hash parameter → authorization BLOCKED
- Expiry documentation drift fixed: no references to expiry remain
- All evidence dicts populated with actual values (no empty dicts)
- All authorization rejections produce machine-readable evidence

**Files to update after verification:**

1. **`.agents/tasks/m2-9-w4-r1-evidence.json`**
   - Update `commit_sha` with actual commit
   - Update `test_results` with actual counts
   - Confirm all `verified: true` flags accurate

---

## Test Command Summary

```bash
# Individual test module runs (for incremental verification)
cd services/project-ai

python -m pytest tests/test_implementation_approval.py -v
python -m pytest tests/test_workflow_transitions.py -v
python -m pytest tests/test_authorization_checker.py -v
python -m pytest tests/unit/test_approval_gate.py -v

# Full W4-R1 test suite
python -m pytest tests/test_implementation_approval.py tests/test_workflow_transitions.py tests/test_authorization_checker.py tests/unit/test_approval_gate.py -v

# Full regression suite
python -m pytest tests/ -v

# Coverage report
python -m pytest tests/ --cov=app --cov-report=term-missing
```

---

## Out of Scope (Do NOT implement)

- ✗ Approval expiry mechanism (no M2.9 requirement found)
- ✗ W5 RepositoryAdapter or file placement
- ✗ W6 Runtime or browser verification
- ✗ W7 Certification or HAA integration
- ✗ Database persistence for approvals (in-memory stores remain)
- ✗ Concurrent approval handling (last-write-wins remains acceptable for M2.9)
- ✗ Approval record immutability enforcement (not in W4 scope)

---

## Success Criteria

**W4-R1 is complete when:**

1. ✅ Self-approval bypass eliminated: `workflow_requester` required, fail-closed when missing
2. ✅ Hash verification bypass eliminated: all security parameters required, no empty-string defaults
3. ✅ Expiry documentation drift resolved: all expiry references removed
4. ✅ 9 new security tests added and passing
5. ✅ 2 insecure tests deleted (validated bypass as acceptable)
6. ✅ 52 total W4-R1 tests passing (0 failures)
7. ✅ 0 new regression failures (528+ pass, 58 pre-existing remain)
8. ✅ Machine-readable evidence artifact created: `.agents/tasks/m2-9-w4-r1-evidence.json`
9. ✅ All authorization rejections produce populated evidence dicts
10. ✅ Independent security review can re-run and verify fixes closed all 3 findings

---

## Decision Record

**Finding C Resolution: Remove Expiry Claim (NOT implement expiry)**

**Rationale:**
- Reviewed M2.9 canonical specification (`.agents/specs/m2-implementation-specification.md`)
- Reviewed Project LLM MVP contract (`ILS_UI_UX/docs/PROJECT_LLM_MVP_IMPLEMENTATION_CONTRACT.md`)
- Reviewed Project AI README and W3/W4 architecture documentation
- Reviewed W4 review and evidence artifacts
- **No M2.9 requirement for approval expiry found**
- The `approval_checker.py` docstring saying "if expiry exists" is a conditional that was never satisfied
- This is **documentation drift**, not missing functionality
- Implementing expiry would be **scope creep** (new feature, not security remediation)
- Correct surgical fix: remove the conditional claim, not implement the feature

**Alternative Considered:** Implement `expires_at` field + TTL validation
**Rejected Because:** No canonical requirement exists; would expand W4-R1 scope beyond security remediation; would require HAA decision on TTL value; treating documentation drift as missing functionality invites scope creep.

---

**Plan Complete**

This plan provides concrete, surgical fixes for all 3 W4 review findings while maintaining strict W4 scope boundaries. Every change is grounded in actual code inspection and test analysis. The remediation closes confirmed authorization bypasses without introducing new features or expanding beyond the authorization boundary.
