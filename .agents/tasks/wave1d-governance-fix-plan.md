# Wave 1D Governance Identity Spoofing Fix - Implementation Plan

## Vulnerability Summary

**CRITICAL P0 SECURITY ISSUE**: Governance endpoints trust client-supplied identity fields instead of verified JWT principals, enabling:
- Identity forgery in approval workflows
- Self-approval bypass (comparing two client-supplied values)
- Audit trail poisoning with false identities
- Privilege escalation through identity forgery

## Investigation Findings

### 1. Vulnerable Code Locations in governance.py

**Line 70-91: submit_for_approval endpoint**
- Records `request.submittedBy` (client-supplied) in audit trail line 80
- Stores `request.submittedBy` in approval record line 87
- VULNERABILITY: Any client can claim any identity

**Line 187-308: approve_manifest endpoint**
- Uses `request.decidedBy` (client-supplied) for self-approval check line 225
- Records `request.decidedBy` in audit trail lines 237, 259, 279, 299
- Stores `request.decidedBy` in approval record lines 235, 257, 277, 297
- VULNERABILITY: Self-approval check compares two client-supplied values; attacker can forge both

**Line 638-683: reject_manifest endpoint**
- Uses `request.rejectedBy` (client-supplied) for decision identity line 671
- Records `request.rejectedBy` in audit trail line 675
- Stores `request.rejectedBy` in approval record line 670
- VULNERABILITY: Any client can claim any identity for rejection

### 2. Schema Classes with Identity Fields

**File: app/api/schemas/governance.py**

- `ApprovalSubmitRequest` (lines 10-20): Contains `submittedBy: str` field
- `ApprovalDecisionRequest` (lines 23-34): Contains `decidedBy: str` field
- `ApprovalRejectRequest` (lines 37-47): Contains `rejectedBy: str` field

All three fields must be removed; identities will be derived from JWT instead.

### 3. JWT Identity Extraction

**File: app/auth/dependencies.py**

`get_current_user()` returns `AuthenticatedPrincipal` with:
- `user_id: str` - Primary identity (extract from `user["user_id"]`)
- Guaranteed non-empty by JWT validation (line 165 comment)

**File: app/auth/types.py**

`AuthenticatedPrincipal` TypedDict defines `user_id` as the primary identity claim.

### 4. Existing RBAC Dependencies Applied

Current governance.py endpoints:
- `submit_for_approval` (line 68): Uses `Depends(get_current_user)` - authenticated only, no role enforcement
- `get_pending_approvals` (line 124): Uses `Depends(get_current_user)` - authenticated only
- `get_approval_status` (line 142): Uses `Depends(get_current_user)` - authenticated only
- `approve_manifest` (line 175): Uses `Depends(get_current_user)` - authenticated only
- `reject_manifest` (line 626): Uses `Depends(get_current_user)` - authenticated only

**FINDING**: No role-based access control is enforced on governance endpoints. This is a separate P1 issue (Wave 1D scope expansion).

### 5. Test Patterns

**File: tests/security/test_rbac.py** - Unit tests for RBAC utilities
**File: tests/security/test_identity_extraction.py** - Unit tests for JWT claim extraction
**File: tests/test_governance.py** - Integration tests using FastAPI TestClient with in-memory approval storage

Test command: `pytest services/project-ai/tests/security/` (from workspace root)

## Implementation Plan

### Prerequisites Verification

- [x] Read governance.py and map all identity field usages
- [x] Read governance schemas and identify fields to remove
- [x] Read dependencies.py and confirm JWT identity extraction
- [x] Read test_rbac.py to understand test patterns
- [x] Confirm RBAC dependencies are defined but not applied

---

## Step 1: Remove client-supplied identity fields from schemas

**What**: Remove `submittedBy`, `decidedBy`, and `rejectedBy` fields from Pydantic request schemas.

**Why**: These fields allow clients to forge identities. After this change, endpoints will fail to compile, forcing us to extract identities from JWT in the next step.

**Files to modify**:
- `services/project-ai/app/api/schemas/governance.py`

**Specific changes**:
1. Remove lines 15-18 from `ApprovalSubmitRequest`:
   ```python
   submittedBy: str = Field(
       description="Identity of person/agent submitting for approval",
       min_length=1
   )
   ```

2. Remove lines 28-31 from `ApprovalDecisionRequest`:
   ```python
   decidedBy: str = Field(
       description="Identity of person making approval decision",
       min_length=1
   )
   ```

3. Remove lines 42-45 from `ApprovalRejectRequest`:
   ```python
   rejectedBy: str = Field(
       description="Identity of person rejecting the manifest",
       min_length=1
   )
   ```

**Verify**: Run `python -m py_compile services/project-ai/app/api/schemas/governance.py` from workspace root. Expected: compilation succeeds (no syntax errors). Expected: governance.py routes will fail to compile (references to removed fields).

---

## Step 2: Extract submitter identity from JWT in submit_for_approval

**What**: Replace `request.submittedBy` with `user["user_id"]` in the submit_for_approval endpoint.

**Why**: This enforces that the submitter identity comes from the verified JWT token, preventing forgery.

**Files to modify**:
- `services/project-ai/app/api/routes/governance.py`

**Specific changes** (line numbers from current file):

1. **Line 80**: Change audit_entry "by" field from client-supplied to JWT-derived:
   ```python
   # OLD:
   "by": request.submittedBy,
   
   # NEW:
   "by": user["user_id"],
   ```

2. **Line 87**: Change approval record "submittedBy" field from client-supplied to JWT-derived:
   ```python
   # OLD:
   "submittedBy": request.submittedBy,
   
   # NEW:
   "submittedBy": user["user_id"],
   ```

**Rationale**: The `user` parameter is already provided by `Depends(get_current_user)`, which returns an `AuthenticatedPrincipal` with a verified `user_id` claim. Direct dictionary access is safe per the comment on line 165 of dependencies.py: "Direct access safe because decode_access_token() guarantees userId claim exists."

**Verify**: Run `python -m py_compile services/project-ai/app/api/routes/governance.py` from workspace root. Expected: compilation succeeds.

---

## Step 3: Extract approver identity from JWT in approve_manifest

**What**: Replace all uses of `request.decidedBy` with `user["user_id"]` in the approve_manifest endpoint.

**Why**: This enforces that approver identity comes from the verified JWT token and makes the self-approval check secure (comparing JWT identity vs stored JWT identity).

**Files to modify**:
- `services/project-ai/app/api/routes/governance.py`

**Specific changes** (line numbers from current file):

1. **Line 225**: Change self-approval check to compare JWT identity vs stored identity:
   ```python
   # OLD:
   if request.decidedBy == approval["submittedBy"]:
   
   # NEW:
   if user["user_id"] == approval["submittedBy"]:
   ```

2. **Line 235**: Change decidedBy field in rejected self-approval record:
   ```python
   # OLD:
   approval["decidedBy"] = request.decidedBy
   
   # NEW:
   approval["decidedBy"] = user["user_id"]
   ```

3. **Line 237**: Change self-approval rejection audit entry:
   ```python
   # OLD:
   audit_entry = {
       "action": "rejected_self_approval",
       "by": request.decidedBy,
       ...
   
   # NEW:
   audit_entry = {
       "action": "rejected_self_approval",
       "by": user["user_id"],
       ...
   ```

4. **Line 244**: Change HTTPException detail for self-approval rejection:
   ```python
   # OLD:
   detail={
       ...
       "attemptedBy": request.decidedBy
   }
   
   # NEW:
   detail={
       ...
       "attemptedBy": user["user_id"]
   }
   ```

5. **Line 257**: Change decidedBy field in hash mismatch rejection:
   ```python
   # OLD:
   approval["decidedBy"] = request.decidedBy
   
   # NEW:
   approval["decidedBy"] = user["user_id"]
   ```

6. **Line 259**: Change hash mismatch audit entry:
   ```python
   # OLD:
   audit_entry = {
       "action": "rejected_hash_mismatch",
       "by": request.decidedBy,
       ...
   
   # NEW:
   audit_entry = {
       "action": "rejected_hash_mismatch",
       "by": user["user_id"],
       ...
   ```

7. **Line 277**: Change decidedBy field in successful approval:
   ```python
   # OLD:
   approval["decidedBy"] = request.decidedBy
   
   # NEW:
   approval["decidedBy"] = user["user_id"]
   ```

8. **Line 279**: Change approval audit entry:
   ```python
   # OLD:
   audit_entry = {
       "action": "approved",
       "by": request.decidedBy,
       ...
   
   # NEW:
   audit_entry = {
       "action": "approved",
       "by": user["user_id"],
       ...
   ```

**Rationale**: There are 8 references to `request.decidedBy` in this endpoint. All must be replaced to close the vulnerability. The self-approval check on line 225 is now secure because it compares the JWT-derived approver identity against the JWT-derived submitter identity (stored when the approval was created).

**Verify**: Run `python -m py_compile services/project-ai/app/api/routes/governance.py` from workspace root. Expected: compilation succeeds.

---

## Step 4: Extract rejecter identity from JWT in reject_manifest

**What**: Replace all uses of `request.rejectedBy` with `user["user_id"]` in the reject_manifest endpoint.

**Why**: This enforces that rejecter identity comes from the verified JWT token.

**Files to modify**:
- `services/project-ai/app/api/routes/governance.py`

**Specific changes** (line numbers from current file):

1. **Line 670**: Change decidedBy field in rejection record:
   ```python
   # OLD:
   approval["decidedBy"] = request.rejectedBy
   
   # NEW:
   approval["decidedBy"] = user["user_id"]
   ```

2. **Line 675**: Change rejection audit entry:
   ```python
   # OLD:
   audit_entry = {
       "action": "rejected",
       "by": request.rejectedBy,
       ...
   
   # NEW:
   audit_entry = {
       "action": "rejected",
       "by": user["user_id"],
       ...
   ```

**Rationale**: There are 2 references to `request.rejectedBy` in this endpoint. Both must be replaced to close the vulnerability.

**Verify**: Run `python -m py_compile services/project-ai/app/api/routes/governance.py` from workspace root. Expected: compilation succeeds.

---

## Step 5: Create security tests for JWT-derived identities

**What**: Add 3 new test cases to `tests/security/test_identity_extraction.py` (or new file `tests/security/test_governance_identity.py`) that prove governance endpoints extract identities from JWT, not request bodies.

**Why**: These tests demonstrate the fix prevents identity spoofing.

**Files to create/modify**:
- `services/project-ai/tests/security/test_governance_identity.py` (NEW FILE)

**Test case 1: test_governance_submit_uses_jwt_identity**

Proves submit endpoint ignores client-supplied identity and uses JWT identity.

```python
"""Test that submit_for_approval extracts identity from JWT."""
from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt import create_access_token

client = TestClient(app)

def test_governance_submit_uses_jwt_identity():
    """Test that submit endpoint uses JWT user_id, not client-supplied submittedBy."""
    # Create JWT for alice@example.com
    token_data = {
        "userId": "alice@example.com",
        "originalUserId": "alice@example.com",
        "shadowUserId": "alice@example.com",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"]
    }
    token = create_access_token(token_data)
    
    # Submit with JWT from alice but NO submittedBy field (removed from schema)
    request_data = {
        "manifestId": "manifest-123",
        "manifestHash": "abc123def456"
    }
    
    response = client.post(
        "/approvals/submit",
        json=request_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    approval_id = response.json()["approvalId"]
    
    # Verify stored approval record has JWT identity
    status_response = client.get(
        f"/approvals/{approval_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    approval_data = status_response.json()
    assert approval_data["submittedBy"] == "alice@example.com"  # From JWT, not request
    assert approval_data["auditTrail"][0]["by"] == "alice@example.com"  # From JWT
```

**Assertion logic**: The stored approval record must contain the JWT-derived identity ("alice@example.com") in both the submittedBy field and the audit trail.

---

**Test case 2: test_governance_approve_prevents_jwt_self_approval**

Proves approve endpoint prevents self-approval using JWT identities (not client-supplied).

```python
def test_governance_approve_prevents_jwt_self_approval():
    """Test that approve endpoint prevents self-approval using JWT identities."""
    # Alice submits
    alice_token_data = {
        "userId": "alice@example.com",
        "originalUserId": "alice@example.com",
        "shadowUserId": "alice@example.com",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"]
    }
    alice_token = create_access_token(alice_token_data)
    
    submit_response = client.post(
        "/approvals/submit",
        json={
            "manifestId": "manifest-self-approve",
            "manifestHash": "hash123"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    approval_id = submit_response.json()["approvalId"]
    
    # Alice attempts to approve her own submission
    approve_response = client.post(
        f"/approvals/{approval_id}/approve",
        json={
            "reason": "Looks good",
            "manifestHash": "hash123"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    # Self-approval must be rejected
    assert approve_response.status_code == 403
    error_detail = approve_response.json()["detail"]
    assert error_detail["error"] == "SELF_APPROVAL_REJECTED"
    assert error_detail["submittedBy"] == "alice@example.com"
    assert error_detail["attemptedBy"] == "alice@example.com"
```

**Assertion logic**: When the same JWT is used to submit and approve, the endpoint must reject with 403 and SELF_APPROVAL_REJECTED error, proving both identities came from JWT.

---

**Test case 3: test_governance_approve_allows_different_jwt_identity**

Proves approve endpoint allows approval when JWT identities differ (legitimate case).

```python
def test_governance_approve_allows_different_jwt_identity():
    """Test that approve endpoint allows approval when JWT identities differ."""
    # Alice submits
    alice_token_data = {
        "userId": "alice@example.com",
        "originalUserId": "alice@example.com",
        "shadowUserId": "alice@example.com",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_viewer"]
    }
    alice_token = create_access_token(alice_token_data)
    
    submit_response = client.post(
        "/approvals/submit",
        json={
            "manifestId": "manifest-legitimate",
            "manifestHash": "hash456"
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    
    approval_id = submit_response.json()["approvalId"]
    
    # Bob approves (different JWT)
    bob_token_data = {
        "userId": "bob@example.com",
        "originalUserId": "bob@example.com",
        "shadowUserId": "bob@example.com",
        "aud": "user",
        "tokenType": "user",
        "roles": ["contract_admin"]
    }
    bob_token = create_access_token(bob_token_data)
    
    approve_response = client.post(
        f"/approvals/{approval_id}/approve",
        json={
            "reason": "Approved",
            "manifestHash": "hash456"
        },
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    
    # Approval must succeed
    assert approve_response.status_code == 200
    approval_data = approve_response.json()
    assert approval_data["status"] == "APPROVED"
    assert approval_data["submittedBy"] == "alice@example.com"
    assert approval_data["decidedBy"] == "bob@example.com"
    assert approval_data["auditTrail"][1]["by"] == "bob@example.com"
```

**Assertion logic**: When different JWTs are used (alice submits, bob approves), the endpoint must succeed with 200, and the stored record must contain both JWT-derived identities.

---

**Files to create**:
- `services/project-ai/tests/security/test_governance_identity.py`

**Test structure**: Follow the pattern in test_identity_extraction.py:
- Import `create_access_token` from `app.auth.jwt`
- Use `TestClient(app)` for HTTP tests
- Set JWT_SECRET in fixture (copy from test_identity_extraction.py lines 11-21)
- Clear approval storage before each test (copy from test_governance.py lines 14-18)

**Verify**: Run `pytest services/project-ai/tests/security/test_governance_identity.py -v` from workspace root. Expected: 3 tests pass.

---

## Step 6: Update existing governance tests

**What**: Update tests in `tests/test_governance.py` to remove client-supplied identity fields from request payloads and add JWT authentication headers.

**Why**: Existing tests will fail after Step 1 because they send identity fields that no longer exist in schemas. They also don't include JWT tokens, so they'll get 401 Unauthorized.

**Files to modify**:
- `services/project-ai/tests/test_governance.py`

**Changes required**:

1. **Import JWT utilities** (add at top of file):
   ```python
   from app.auth.jwt import create_access_token
   import os
   ```

2. **Add JWT secret fixture** (add after imports):
   ```python
   @pytest.fixture(autouse=True)
   def set_jwt_env():
       """Set JWT_SECRET for all tests in this module."""
       os.environ["JWT_SECRET"] = "test_secret_key_at_least_32_characters_long_for_testing"
       os.environ["ADMIN_JWT_SECRET"] = "admin_secret_key_at_least_32_characters_long_for_testing"
       yield
       if "JWT_SECRET" in os.environ:
           del os.environ["JWT_SECRET"]
       if "ADMIN_JWT_SECRET" in os.environ:
           del os.environ["ADMIN_JWT_SECRET"]
   ```

3. **Add helper function to create test tokens** (add after fixtures):
   ```python
   def create_test_token(user_id: str, roles: list[str] = None):
       """Helper to create test JWT tokens."""
       if roles is None:
           roles = ["contract_viewer"]
       
       data = {
           "userId": user_id,
           "originalUserId": user_id,
           "shadowUserId": user_id,
           "aud": "user",
           "tokenType": "user",
           "roles": roles
       }
       return create_access_token(data)
   ```

4. **Update ALL test functions** (18 functions total) to:
   - Remove `submittedBy`, `decidedBy`, `rejectedBy` fields from request JSON
   - Add `headers={"Authorization": f"Bearer {token}"}` to ALL client.post() and client.get() calls
   - Create tokens using `create_test_token("user@example.com")` at the start of each test

**Example transformation** for `test_submit_approval_request`:
```python
# OLD:
def test_submit_approval_request():
    request_data = {
        "manifestId": "manifest-123",
        "manifestHash": "abc123def456",
        "submittedBy": "alice@example.com"  # REMOVED
    }
    response = client.post("/approvals/submit", json=request_data)  # NO AUTH

# NEW:
def test_submit_approval_request():
    token = create_test_token("alice@example.com")
    request_data = {
        "manifestId": "manifest-123",
        "manifestHash": "abc123def456"
        # submittedBy removed - comes from JWT
    }
    response = client.post(
        "/approvals/submit",
        json=request_data,
        headers={"Authorization": f"Bearer {token}"}
    )
```

**Assertion updates**: Tests that assert on `submittedBy`, `decidedBy` values must now expect the JWT-derived identities, not the old client-supplied ones.

**Verify**: Run `pytest services/project-ai/tests/test_governance.py -v` from workspace root. Expected: All existing tests pass with JWT authentication.

---

## Step 7: Run full security test suite

**What**: Run all security tests to confirm no regressions.

**Why**: The changes affect authentication and authorization, so we must verify existing RBAC tests still pass.

**Command**: 
```bash
pytest services/project-ai/tests/security/ -v
```

**Expected results**:
- `test_rbac.py`: All 14 tests pass (unchanged - tests RBAC utilities, not governance routes)
- `test_identity_extraction.py`: All 18 tests pass (unchanged - tests JWT extraction, not governance)
- `test_authorization.py`: All tests pass (if file exists)
- `test_governance_identity.py`: All 3 NEW tests pass

**Total expected**: 35+ tests pass, 0 failures

**Verify**: Run command from workspace root and confirm all tests pass.

---

## Step 8: Manual verification of the fix

**What**: Manually verify the vulnerability is closed by inspecting the code changes.

**Why**: Automated tests prove correct behavior, but manual inspection confirms no bypass paths remain.

**Verification checklist**:

- [ ] `ApprovalSubmitRequest` schema has NO `submittedBy` field
- [ ] `ApprovalDecisionRequest` schema has NO `decidedBy` field
- [ ] `ApprovalRejectRequest` schema has NO `rejectedBy` field
- [ ] `submit_for_approval` endpoint uses `user["user_id"]` in 2 places (audit trail, approval record)
- [ ] `approve_manifest` endpoint uses `user["user_id"]` in 8 places (self-check, 3 rejection paths, approval path)
- [ ] `reject_manifest` endpoint uses `user["user_id"]` in 2 places (rejection record, audit trail)
- [ ] All 3 endpoints have `user: AuthenticatedPrincipal = Depends(get_current_user)` parameter
- [ ] No new references to client-supplied identity fields exist in governance.py
- [ ] Self-approval check (line 225) compares JWT identity (`user["user_id"]`) against stored JWT identity (`approval["submittedBy"]`)

**How to verify**: 
1. Run `grep -n "request\.submittedBy\|request\.decidedBy\|request\.rejectedBy" services/project-ai/app/api/routes/governance.py` from workspace root
   - Expected: No matches (all references removed)

2. Run `grep -n 'user\["user_id"\]' services/project-ai/app/api/routes/governance.py` from workspace root
   - Expected: 12 matches (2 in submit, 8 in approve, 2 in reject)

3. Open governance.py and visually confirm line 225 reads:
   ```python
   if user["user_id"] == approval["submittedBy"]:
   ```

**Verify**: Complete checklist and confirm all grep commands return expected results.

---

## Summary

This plan remediates the P0 governance identity spoofing vulnerability by:

1. **Removing attack surface**: Delete client-supplied identity fields from request schemas
2. **Enforcing JWT-derived identities**: Replace all 12 references to client-supplied identities with `user["user_id"]` from verified JWT tokens
3. **Securing self-approval check**: Compare JWT identity against JWT identity (both server-controlled)
4. **Proving the fix**: Add 3 new security tests demonstrating identity extraction from JWT
5. **Regression testing**: Update existing tests and run full security suite

After implementation, governance endpoints will:
- ✅ Extract identities from cryptographically verified JWT tokens
- ✅ Prevent identity forgery (client cannot control identity)
- ✅ Prevent self-approval bypass (both identities come from JWT)
- ✅ Record accurate audit trails (all identities are JWT-derived)
- ✅ Maintain backward compatibility (JWT structure unchanged)

## Test Command

Run from workspace root:
```bash
pytest services/project-ai/tests/security/ -v
```

Expected: 35+ tests pass, 0 failures (includes 14 rbac + 18 identity_extraction + 3 new governance_identity tests).

Run full governance test suite:
```bash
pytest services/project-ai/tests/test_governance.py -v
```

Expected: 18 tests pass, 0 failures (all existing tests updated with JWT auth).

## Files Modified

1. `services/project-ai/app/api/schemas/governance.py` - Remove 3 identity fields
2. `services/project-ai/app/api/routes/governance.py` - Replace 12 identity references with JWT extraction
3. `services/project-ai/tests/test_governance.py` - Update 18 tests to use JWT auth
4. `services/project-ai/tests/security/test_governance_identity.py` - NEW FILE with 3 security tests

## Dependency Note

This fix does NOT address the separate P1 issue of missing RBAC enforcement on governance endpoints (Finding #4). That requires:
- Applying `Depends(require_contract_admin)` or `Depends(require_contract_reviewer)` to each endpoint
- Adding tests for role-based access control
- Documenting the role requirements

The P1 RBAC enforcement should be tracked as a separate work item in Wave 1D.
