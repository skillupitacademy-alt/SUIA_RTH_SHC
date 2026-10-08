# E1-A-2: Self-Approval Forensic Investigation Report

**Investigation Date:** 2025-01-29  
**Investigator:** Forensic Analysis Agent  
**Target Test:** `test_approval_gate_fails_with_self_approval`  
**Test Location:** `services/project-ai/tests/certification/test_certification_gates.py::TestApprovalGate::test_approval_gate_fails_with_self_approval`

---

## Executive Summary

**Test Status:** FAILING (expects FAIL, receives PASS)

**Root Cause:** FIXTURE_DEFECT

**Severity:** Medium (Test does not represent self-approval scenario; production gate logic is correct)

The test fixture creates an ImplementationApproval where `approved_by="approver-user"` and `workflow_requester="requester-user"`, but then passes `requester_id="approver-user"` to the gate executor. This creates a mismatch between the actual requester recorded in the approval object and the requester_id parameter, causing the gate to pass when it should fail.

---

## Investigation Findings

### 1. Approval Gate Implementation Analysis

**File:** `services/project-ai/app/certification/gates.py`  
**Method:** `execute_approval_gate()` (lines 261-330)

The approval gate correctly implements self-approval checking:

```python
# Verify not self-approved
if not approval.verify_not_self_approved(requester_id):
    blockers.append(
        f"Self-approval detected: approver '{approval.approved_by}' matches requester"
    )
```

**Key Observation:** The gate calls `approval.verify_not_self_approved(requester_id)` which compares `approval.approved_by` against `approval.workflow_requester` (NOT the `requester_id` parameter).

---

### 2. ImplementationApproval Schema Analysis

**File:** `services/project-ai/app/models/implementation_approval.py`  
**Method:** `verify_not_self_approved()` (lines 64-79)

The schema contains both required fields:

- `approved_by: str` — Identity of the approver
- `workflow_requester: Optional[str]` — Identity of the workflow requester (for self-approval prevention)

**Implementation:**

```python
def verify_not_self_approved(self, requester_id: str) -> bool:
    """
    Verify approval is not self-approval.
    
    Enforces separation of duties: approver must differ from workflow requester.
    Fail-closed: missing workflow_requester causes verification failure.
    
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

**Critical Finding:** The `requester_id` parameter is marked as **"for evidence only"** and is NOT used in the comparison. The actual comparison is:

```python
self.approved_by != self.workflow_requester
```

This means the gate compares the `approved_by` field against the `workflow_requester` field stored in the approval record itself, NOT the `requester_id` passed to the gate.

---

### 3. Test Fixture Analysis

**File:** `services/project-ai/tests/certification/test_certification_gates.py`  
**Method:** `test_approval_gate_fails_with_self_approval()` (lines 212-227)

**Fixture Setup (mock_approvals_store):**

```python
approval = ImplementationApproval(
    approval_id="approval-001",
    workflow_id="test-workflow-001",
    candidate_sha256="a" * 64,
    target_family="Introduction",
    target_version="I7",
    placement_manifest_id="manifest-001",
    placement_manifest_sha256="m" * 64,
    approved_by="approver-user",              # ← Approver identity
    approval_timestamp="2025-01-29T10:00:00Z",
    status=ImplementationApprovalStatus.APPROVED,
    workflow_requester="requester-user"       # ← Requester identity (DIFFERENT)
)
```

**Test Call:**

```python
result = executor.execute_approval_gate(
    workflow_id="test-workflow-001",
    approvals_store=mock_approvals_store,
    requester_id="approver-user",  # ← Test passes THIS as requester
    candidate_sha256="a" * 64,
    manifest_id="manifest-001",
    manifest_sha256="m" * 64
)
```

**Root Cause Analysis:**

The test creates an approval where:
- `approval.approved_by = "approver-user"`
- `approval.workflow_requester = "requester-user"` (DIFFERENT → not self-approved)

Then passes `requester_id="approver-user"` to the gate, expecting this to trigger self-approval detection.

**Why This Fails:**

The gate ignores the `requester_id` parameter and instead compares:
```python
approval.approved_by ("approver-user") != approval.workflow_requester ("requester-user")
```

Result: `True` (not self-approved) → Gate PASSES

The test fixture does NOT represent a self-approval scenario because the approval record itself has different requester and approver identities.

---

### 4. Missing workflow_requester Behavior

The `verify_not_self_approved()` method implements fail-closed behavior:

```python
if not self.workflow_requester:
    return False
```

If `workflow_requester` is `None` or empty, the verification returns `False`, causing the gate to FAIL with the blocker:

```python
"Self-approval detected: approver '{approval.approved_by}' matches requester"
```

This is correct security behavior: if we cannot verify separation of duties, we fail closed.

---

### 5. Test Execution Output

```
FAILED tests/certification/test_certification_gates.py::TestApprovalGate::test_approval_gate_fails_with_self_approval
AssertionError: assert <CertificationGateStatus.PASS: 'PASS'> == <CertificationGateStatus.FAIL: 'FAIL'>
```

The gate returns PASS because the approval record legitimately represents non-self-approval (different requester and approver).

---

### 6. W5-R2 Security Contract Review

**Source:** `.agents/tasks/m2-9-w5-r2-review.md`

The W5-R2 security remediation explicitly states:

> **Self-approval check** (line 138-143): calls approval.verify_not_self_approved(workflow_requester) and rejects self-approval

The security contract confirms:
- Self-approval prevention is a stated security requirement
- The implementation in `executor.py:138-143` is verified correct
- The gate correctly calls `approval.verify_not_self_approved(workflow_requester)`

The production code correctly implements the security requirement. The test fixture does not correctly represent a self-approval scenario.

---

## Production Defect Analysis

**Question:** Does the gate actually compare workflow_requester vs approved_by fields?

**Answer:** YES. The gate calls `approval.verify_not_self_approved(requester_id)`, which internally compares:

```python
self.approved_by != self.workflow_requester
```

Both fields are read from the approval record.

**Question:** Does a missing workflow_requester cause the gate to fail closed or pass open?

**Answer:** FAIL CLOSED. If `workflow_requester` is missing, `verify_not_self_approved()` returns `False`, which triggers the blocker and causes the gate to FAIL.

**Conclusion:** The production gate implementation is CORRECT and secure. It properly prevents self-approval and fails closed on missing data.

---

## Test Fixture Defect Analysis

**Question:** Does the fixture actually set the same person as requester AND approver?

**Answer:** NO. The fixture sets:
- `approved_by="approver-user"`
- `workflow_requester="requester-user"` (DIFFERENT)

This represents a legitimate non-self-approved scenario, so the gate correctly PASSES.

**Correct Fixture Should Be:**

```python
approval = ImplementationApproval(
    approval_id="approval-001",
    workflow_id="test-workflow-001",
    candidate_sha256="a" * 64,
    target_family="Introduction",
    target_version="I7",
    placement_manifest_id="manifest-001",
    placement_manifest_sha256="m" * 64,
    approved_by="same-user",              # ← SAME identity
    approval_timestamp="2025-01-29T10:00:00Z",
    status=ImplementationApprovalStatus.APPROVED,
    workflow_requester="same-user"        # ← SAME identity (SELF-APPROVAL)
)
```

Then call the gate with ANY requester_id (it doesn't matter since it's not used):

```python
result = executor.execute_approval_gate(
    workflow_id="test-workflow-001",
    approvals_store=mock_approvals_store,
    requester_id="same-user",  # Can be anything - not used in comparison
    candidate_sha256="a" * 64,
    manifest_id="manifest-001",
    manifest_sha256="m" * 64
)
```

This would correctly trigger self-approval detection because:
```python
approval.approved_by ("same-user") == approval.workflow_requester ("same-user")
```

Result: `False` from `verify_not_self_approved()` → Gate FAILS

---

## Additional Evidence

### Test Contract Expectation

```python
def test_approval_gate_fails_with_self_approval(self, mock_snapshot_valid, test_manifest, mock_approvals_store):
    """Approval gate fails when self-approval detected."""
    # ...
    assert result.status == CertificationGateStatus.FAIL
    assert any('self' in b.lower() for b in result.blockers)
```

The test expects FAIL status and a blocker message containing "self".

### Related Tests

The passing test `test_approval_gate_passes_with_valid_approval` uses:
- `requester_id="requester-user"`
- `approval.workflow_requester="requester-user"`
- `approval.approved_by="approver-user"`

This correctly PASSES because requester and approver are different.

---

## Recommendations

1. **Fix the test fixture** to set `approved_by == workflow_requester` in the approval record
2. **Add a second test** for the missing `workflow_requester` case (fail-closed behavior)
3. **Add integration test** that verifies self-approval rejection at the API level (may already exist in `test_candidate_security.py`)
4. **Document** that the `requester_id` parameter to `execute_approval_gate()` is for evidence only and not used in self-approval checking

---

## VERDICT: FIXTURE_DEFECT

**Reason:** The test fixture creates an ImplementationApproval record with different `approved_by` and `workflow_requester` identities, which represents a legitimate non-self-approved scenario. The production gate correctly identifies this as valid and returns PASS. The test expects FAIL because it incorrectly assumes the `requester_id` parameter would be compared against `approved_by`, but the gate actually compares `approved_by` against `workflow_requester` from the approval record itself.

**Production Code Status:** CORRECT — Self-approval prevention is properly implemented and secured

**Test Code Status:** DEFECTIVE — Fixture does not represent actual self-approval

**Security Impact:** NONE — The security boundary is correctly enforced in production

---

## References

1. `services/project-ai/app/certification/gates.py` (lines 261-330) — Approval gate implementation
2. `services/project-ai/app/models/implementation_approval.py` (lines 64-79) — Self-approval verification logic
3. `services/project-ai/tests/certification/test_certification_gates.py` (lines 212-227) — Failing test
4. `.agents/tasks/m2-9-w5-r2-review.md` — W5-R2 security contract verification
5. Test execution output showing PASS vs FAIL assertion mismatch

---

**Report Generated:** 2025-01-29  
**Next Action:** Fix test fixture to set `approved_by == workflow_requester` in the approval record
