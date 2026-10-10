# Wave 1C Implementation Plan: Authorization Enforcement

**Goal**: Enforce authorization boundaries to prevent brand boundary violations (cross-tenant access) and identity spoofing (client-supplied userId/roles bypassing JWT claims).

**Context**: Wave 1B (commit ac2f0a78) extracts full identity claims from SHC JWT tokens. The `AuthenticatedPrincipal` model already carries `userId`, `roles`, `brandId`, `platforms`, `subscriptions`, `brand`, `email`, `portalIdentity`, and `isAdmin`. Wave 1C adds brand isolation enforcement and identity spoofing prevention.

---

## Implementation Steps

- [ ] 1. **Create `app/auth/authorization.py` with brand access verification**
      
      Add `verify_brand_access(principal: AuthenticatedPrincipal, resource_brand: Optional[str]) -> None` that:
      - Raises `HTTPException(403, "Cross-brand access denied")` when `principal["brand"]` is not None and does not match `resource_brand`
      - Allows access when `principal["brand"]` is None (infrastructure/super_admin tokens with no brand restriction)
      - Allows access when `resource_brand` is None (brand-agnostic resources)
      - Logs warning for missing brand claim on non-infrastructure tokens
      
      **Files**: `services/project-ai/app/auth/authorization.py` (new file)
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_verify_brand_access_* -v` — 4 new tests pass (same-brand approval, cross-brand rejection, None-brand bypass, None-resource bypass)

- [ ] 2. **Audit and document identity spoofing vectors in route files**
      
      Review all three route files (`candidate.py`, `workflows.py`, `governance.py`) and document findings:
      - `candidate.py` line 327: Uses `user.get("user_id", "unknown")` for `triggered_by` (SAFE — extracts from JWT)
      - `workflows.py` line 599: Uses `user.get("email") or user.get("sub") or user.get("id") or "unknown"` for `approved_by` (SAFE — extracts from JWT)
      - `governance.py` line 460: Compares `payload.approved_by` (client-supplied) against `workflow_requester` (stored in DB) for self-approval check (VULNERABLE — accepts client-supplied approver identity)
      - `workflows.py` CreateWorkflowRequest: accepts `requester_id` from client (VULNERABLE — should use JWT user_id)
      - No `roles` or `actor` fields found in request bodies (SAFE)
      
      **Files**: Document findings in `.agents/tasks/wave1c-identity-audit.md` (new file)
      
      **Verify**: Manual review — document exists with all findings listed

- [ ] 3. **Fix identity spoofing in `governance.py` POST /approve-implementation**
      
      Replace client-supplied `payload.approved_by` with JWT-extracted identity:
      - Remove `approved_by` field from `ImplementationApprovalPayload` schema (line 293)
      - Extract approver from JWT: `approved_by = user.get("user_id") or user.get("email") or "unknown"` (after line 360, before approval creation)
      - Update self-approval check to use extracted identity (line 460)
      - Update all `payload.approved_by` references to use `approved_by` variable
      
      **Files**: `services/project-ai/app/api/routes/governance.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_approver_identity_extraction_from_jwt -v` — new test passes, verifying approver is extracted from JWT not request body

- [ ] 4. **Fix identity spoofing in `workflows.py` POST /workflows**
      
      Replace client-supplied `request.requester_id` with JWT-extracted identity:
      - Remove `requester_id` field from `CreateWorkflowRequest` schema in `app/api/schemas/workflow.py` (line 93)
      - Extract requester from JWT in `create_workflow` handler: `requester_id = user["user_id"]` (line 149, before `governance_service.create_workflow`)
      - Pass extracted `requester_id` to `governance_service.create_workflow()`
      
      **Files**: `services/project-ai/app/api/schemas/workflow.py`, `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_requester_identity_extraction_from_jwt -v` — new test passes, verifying requester is extracted from JWT not request body

- [ ] 5. **Add brand enforcement to `workflows.py` GET /workflows/{workflow_id}`**
      
      Workflows are brand-scoped resources. Add brand verification after workflow retrieval:
      - Extract workflow's brand from `workflow.target_family` metadata or add `brand` field to workflow model (check existing schema)
      - If workflow model lacks brand field, skip brand enforcement for now (note in TODO comment)
      - If brand field exists, call `verify_brand_access(user, workflow.brand)` after line 190
      
      **Files**: `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_workflow_brand_enforcement -v` — new test passes (cross-brand GET rejected)

- [ ] 6. **Add brand enforcement to `workflows.py` POST /workflows/{workflow_id}/approve-final`**
      
      Final certification approval is brand-scoped. Add brand verification:
      - Extract workflow's brand (same logic as step 5)
      - Call `verify_brand_access(user, workflow.brand)` after line 528 (after workflow retrieval, before approval logic)
      
      **Files**: `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_final_approval_brand_enforcement -v` — new test passes (cross-brand approval rejected)

- [ ] 7. **Add brand enforcement to `candidate.py` POST /candidates/upload`**
      
      Candidate uploads are implicitly brand-scoped via workflow binding. Add brand verification:
      - After workflow retrieval (line 282), extract workflow's brand
      - Call `verify_brand_access(user, workflow.brand)` before candidate storage
      
      **Files**: `services/project-ai/app/api/routes/candidate.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_candidate_upload_brand_enforcement -v` — new test passes (cross-brand upload rejected)

- [ ] 8. **Add brand enforcement to `candidate.py` POST /candidates/{candidate_id}/execute`**
      
      Placement execution is brand-scoped. Add brand verification:
      - After candidate retrieval (line 826), extract candidate's workflow_id
      - Retrieve workflow from governance service to get brand
      - Call `verify_brand_access(user, workflow.brand)` before approval enforcement
      
      **Files**: `services/project-ai/app/api/routes/candidate.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py::test_placement_execution_brand_enforcement -v` — new test passes (cross-brand execution rejected)

- [ ] 9. **Create comprehensive security test suite in `tests/security/test_authorization.py`**
      
      Add test cases for:
      - **Brand enforcement** (8 tests):
        - `test_verify_brand_access_same_brand_allowed` — user with brand=skillhub can access skillhub resource
        - `test_verify_brand_access_cross_brand_denied` — user with brand=skillhub cannot access techskills resource
        - `test_verify_brand_access_none_user_brand_allowed` — user with brand=None (infrastructure) can access any brand
        - `test_verify_brand_access_none_resource_brand_allowed` — any user can access resource with brand=None
        - `test_workflow_brand_enforcement` — GET /workflows/{id} rejects cross-brand access
        - `test_final_approval_brand_enforcement` — POST /workflows/{id}/approve-final rejects cross-brand
        - `test_candidate_upload_brand_enforcement` — POST /candidates/upload rejects cross-brand
        - `test_placement_execution_brand_enforcement` — POST /candidates/{id}/execute rejects cross-brand
      
      - **Identity spoofing prevention** (3 tests):
        - `test_approver_identity_extraction_from_jwt` — POST /approve-implementation uses JWT user_id, not request body
        - `test_requester_identity_extraction_from_jwt` — POST /workflows uses JWT user_id, not request body
        - `test_client_supplied_user_id_ignored` — verify client cannot override JWT identity with request body fields
      
      - **Valid path smoke tests** (2 tests):
        - `test_same_brand_workflow_approval_succeeds` — end-to-end workflow with same brand
        - `test_infrastructure_user_cross_brand_access_succeeds` — user with brand=None can access all brands
      
      **Files**: `services/project-ai/tests/security/test_authorization.py` (new file)
      
      **Verify**: `pytest services/project-ai/tests/security/test_authorization.py -v --tb=short` — all 13 tests pass

- [ ] 10. **Update README.md with authorization guidance**
      
      Add "Authorization Enforcement (Wave 1C)" section after "Identity Claims (Wave 1B)" section:
      - Document brand isolation rules (same-brand access only, infrastructure bypass)
      - Document identity extraction from JWT (never trust request bodies for userId/roles/approved_by)
      - Add example of using `verify_brand_access()` in route handlers
      - Add security note: "Route handlers must extract user identity from JWT via `get_current_user()`. Never accept userId, roles, or approver identity from request bodies or query parameters."
      
      **Files**: `services/project-ai/README.md`
      
      **Verify**: Manual review — section exists with all authorization rules documented

- [ ] 11. **Run full security test suite and verify coverage**
      
      Run all security tests to verify no regressions:
      ```bash
      cd services/project-ai
      pytest tests/security/ -v --cov=app/auth --cov-report=term
      ```
      
      Expected results:
      - `test_identity_extraction.py`: 15 tests pass (existing Wave 1B tests)
      - `test_authorization.py`: 13 tests pass (new Wave 1C tests)
      - Total: 28 security tests pass
      - Auth coverage: ≥93% (up from 92% in Wave 1B)
      
      **Files**: N/A (test execution)
      
      **Verify**: All 28 security tests pass with no failures; coverage report shows ≥93% for `app/auth/` module

---

## Test Plan Summary

### Brand Enforcement Tests (`test_authorization.py`)

1. **`test_verify_brand_access_same_brand_allowed`**
   - Setup: User token with `brand="skillhub"`, resource `brand="skillhub"`
   - Action: Call `verify_brand_access(user, "skillhub")`
   - Expected: No exception raised

2. **`test_verify_brand_access_cross_brand_denied`**
   - Setup: User token with `brand="skillhub"`, resource `brand="techskills"`
   - Action: Call `verify_brand_access(user, "techskills")`
   - Expected: `HTTPException(403, "Cross-brand access denied")`

3. **`test_verify_brand_access_none_user_brand_allowed`**
   - Setup: User token with `brand=None` (infrastructure), resource `brand="skillhub"`
   - Action: Call `verify_brand_access(user, "skillhub")`
   - Expected: No exception raised

4. **`test_verify_brand_access_none_resource_brand_allowed`**
   - Setup: User token with `brand="skillhub"`, resource `brand=None`
   - Action: Call `verify_brand_access(user, None)`
   - Expected: No exception raised

5. **`test_workflow_brand_enforcement`**
   - Setup: Create workflow with brand="skillhub", user token with brand="techskills"
   - Action: `GET /workflows/{id}` with cross-brand user
   - Expected: `HTTPException(403)`

6. **`test_final_approval_brand_enforcement`**
   - Setup: Workflow with brand="skillhub", user token with brand="techskills"
   - Action: `POST /workflows/{id}/approve-final` with cross-brand user
   - Expected: `HTTPException(403)`

7. **`test_candidate_upload_brand_enforcement`**
   - Setup: Workflow with brand="skillhub", user token with brand="techskills"
   - Action: `POST /candidates/upload` with cross-brand user
   - Expected: `HTTPException(403)`

8. **`test_placement_execution_brand_enforcement`**
   - Setup: Candidate with workflow brand="skillhub", user token with brand="techskills"
   - Action: `POST /candidates/{id}/execute` with cross-brand user
   - Expected: `HTTPException(403)`

### Identity Spoofing Prevention Tests

9. **`test_approver_identity_extraction_from_jwt`**
   - Setup: Create token with `userId="admin123"`, POST body with no `approved_by` field
   - Action: `POST /approve-implementation` with JWT token
   - Expected: Approval record has `approved_by="admin123"` (from JWT, not request)

10. **`test_requester_identity_extraction_from_jwt`**
    - Setup: Create token with `userId="user456"`, POST body with no `requester_id` field
    - Action: `POST /workflows` with JWT token
    - Expected: Workflow record has `requester_id="user456"` (from JWT, not request)

11. **`test_client_supplied_user_id_ignored`**
    - Setup: Token with `userId="real_user"`, request body with `"userId": "fake_user"`
    - Action: Create workflow or approval
    - Expected: Uses `"real_user"` from JWT, ignores request body

### Valid Path Smoke Tests

12. **`test_same_brand_workflow_approval_succeeds`**
    - Setup: User token with brand="skillhub", workflow with brand="skillhub"
    - Action: Complete workflow: create → upload → approve → execute
    - Expected: All steps succeed with 20x responses

13. **`test_infrastructure_user_cross_brand_access_succeeds`**
    - Setup: User token with brand=None (infrastructure), workflows with various brands
    - Action: Access workflows across different brands
    - Expected: All accesses succeed (infrastructure bypass)

---

## Verification Commands

### Unit Tests (Fast)
```bash
cd services/project-ai
pytest tests/security/test_authorization.py -v --tb=short
```

### Full Security Suite
```bash
cd services/project-ai
pytest tests/security/ -v --cov=app/auth --cov-report=term
```

### Integration Tests (Requires PostgreSQL)
```bash
cd services/project-ai
pytest tests/integration/ -v -k authorization
```

---

## Authorization Function Signatures

### `verify_brand_access()`

```python
def verify_brand_access(
    principal: AuthenticatedPrincipal,
    resource_brand: Optional[str]
) -> None:
    """
    Verify user has access to resource within their brand boundary.
    
    RULES:
    1. If principal["brand"] is None → Allow (infrastructure/super_admin bypass)
    2. If resource_brand is None → Allow (brand-agnostic resource)
    3. If principal["brand"] == resource_brand → Allow
    4. Otherwise → Raise HTTPException(403, "Cross-brand access denied")
    
    Args:
        principal: Authenticated user from JWT token
        resource_brand: Brand identifier of the resource being accessed
        
    Raises:
        HTTPException: 403 if cross-brand access attempted
    """
```

### Usage Example

```python
from fastapi import Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.auth.authorization import verify_brand_access
from app.auth.types import AuthenticatedPrincipal

@router.get("/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    user: AuthenticatedPrincipal = Depends(get_current_user),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
):
    # Retrieve workflow
    workflow = await governance_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Enforce brand boundary
    verify_brand_access(user, workflow.brand)
    
    # Return workflow if brand check passes
    return _workflow_to_response(workflow)
```

---

## Identity Spoofing Vectors Found

### VULNERABLE: `governance.py` POST /approve-implementation

**Line 293**: `approved_by: str = Field(description="Identity of approver", min_length=1)`

**Issue**: Client supplies approver identity in request body. Attacker can claim to be any user.

**Fix**: Extract approver from JWT token:
```python
approved_by = user.get("user_id") or user.get("email") or "unknown"
```

### VULNERABLE: `workflows.py` POST /workflows

**Line 93 (schema)**: `requester_id: str = Field(min_length=1, description="Workflow requester identity")`

**Issue**: Client supplies requester identity. Attacker can claim to be any user, bypassing self-approval checks.

**Fix**: Extract requester from JWT token:
```python
requester_id = user["user_id"]
```

### SAFE: `candidate.py` line 327

```python
triggered_by=user.get("user_id", "unknown")
```

**Status**: Correctly extracts from JWT token, not client input.

### SAFE: `workflows.py` line 599

```python
approved_by = user.get("email") or user.get("sub") or user.get("id") or "unknown"
```

**Status**: Correctly extracts from JWT token, not client input.

---

## Project Context

### Build System
- **Language**: Python 3.11+
- **Framework**: FastAPI + Pydantic
- **Database**: PostgreSQL (asyncpg + SQLAlchemy)
- **Test Framework**: pytest + pytest-asyncio

### Build Command
```bash
cd services/project-ai
pip install -e ".[dev]"
```

### Test Command
```bash
cd services/project-ai
pytest tests/ -v --cov=app --cov-report=term
```

### Key Patterns
1. **Repository Pattern**: All DB access via `get_*_repository()` dependencies
2. **Dependency Injection**: FastAPI `Depends()` for auth, DB sessions, services
3. **TypedDict Identity**: `AuthenticatedPrincipal` is a TypedDict (not Pydantic), behaves like dict
4. **Async/Await**: All route handlers and repository methods are async
5. **HTTPException**: Raise `HTTPException(status_code, detail)` for errors
6. **JWT Claims**: Never trust request body for identity; always extract from `user: AuthenticatedPrincipal`

### Relevant Files
- Auth layer: `app/auth/dependencies.py`, `app/auth/types.py`, `app/auth/jwt.py`
- Route handlers: `app/api/routes/workflows.py`, `app/api/routes/candidate.py`, `app/api/routes/governance.py`
- Schemas: `app/api/schemas/workflow.py`, `app/api/schemas/placement.py`
- Models: `app/models/implementation_approval.py`, `app/models/candidate.py`
- Tests: `tests/security/test_identity_extraction.py` (Wave 1B baseline)

### Environment Constraints
- PostgreSQL connection required for integration tests (`TEST_DATABASE_URL_TUTORIAL`)
- JWT secrets must be set (`JWT_SECRET`, `ADMIN_JWT_SECRET`)
- Unit tests run without database

### Contribution Requirements
- Type hints required for all functions
- Docstrings required for public APIs
- Test coverage target: 80%+
- Follow existing test patterns (pytest fixtures, async tests)
- Use `HTTPException` for route errors, not plain exceptions

---

## Dependencies Between Steps

- Step 1 (create `authorization.py`) must complete before steps 5-8 (brand enforcement in routes)
- Steps 2-4 (identity spoofing fixes) are independent of brand enforcement (steps 5-8)
- Step 9 (test suite) depends on steps 1-8 (all implementation complete)
- Step 10 (README) can be done in parallel with implementation
- Step 11 (full test run) depends on step 9 (test suite exists)

## Acceptance Criteria

- [ ] All 13 new authorization tests pass
- [ ] All 15 existing Wave 1B identity extraction tests still pass
- [ ] No client-supplied `userId`, `roles`, or `approved_by` fields accepted in request bodies
- [ ] Cross-brand access rejected with 403 for all protected routes
- [ ] Infrastructure users (brand=None) can access all brands
- [ ] Auth test coverage ≥93%
- [ ] README documents authorization rules with examples

## Notes

- **Brand field availability**: If `workflow.brand` does not exist in the workflow model, step 5-6 must be adjusted to skip brand enforcement or add the field to the model first.
- **Infrastructure bypass**: Users with `brand=None` in their JWT token are infrastructure/super_admin accounts that bypass brand restrictions.
- **Self-approval prevention**: Already implemented in `governance.py` line 460, but currently uses client-supplied `approved_by` — Wave 1C fixes this by extracting from JWT.
- **No approvals.py file**: The plan referenced "approvals.py" but this file does not exist. Approval logic is in `governance.py` POST /approve-implementation endpoint.
