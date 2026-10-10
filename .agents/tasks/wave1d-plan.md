# Wave 1D Implementation Plan: RBAC Enforcement + P0 Governance Identity Spoofing Fix

**Goal**: Implement role-based access control (RBAC) to prevent unauthorized users from performing privileged operations PLUS fix critical P0 identity spoofing vulnerability in governance endpoints.

**Context**: Wave 1C (commit 76aaba51) completed identity spoofing prevention and brand boundary enforcement. `AuthenticatedPrincipal` now carries complete identity context including `roles` list. FastAPI dependencies `require_contract_admin`, `require_contract_reviewer`, and `require_contract_viewer` already exist in `app/auth/dependencies.py` but are not yet applied to privileged routes.

**🚨 P0 CRITICAL SECURITY FIX**: GitHub audit identified identity spoofing in legacy governance endpoints (`POST /submit`, `POST /{id}/approve`, `POST /{id}/reject`) that accept client-supplied `submittedBy`, `decidedBy`, and `rejectedBy` fields. This allows clients to forge identities in approval workflows and bypass self-approval checks. Wave 1D MUST fix this vulnerability before approval.

**Workspace**: `e:\onlinewebsites\quiz-platform/services/project-ai`

---

## Existing Roles in System

Extracted from JWT by `AuthenticatedPrincipal`:
- `contract_admin` — Can approve workflows, certify implementations, execute placements
- `contract_reviewer` — Can review but not approve workflows
- `contract_viewer` — Can view workflows and candidates
- `super_admin` — Infrastructure-level access (bypasses restrictions)
- Regular users — No privileged roles

---

## Privileged Routes Requiring RBAC

| Route | Line | Required Role | Current State |
|-------|------|---------------|---------------|
| `POST /workflows` | 149 | `contract_admin` | ✅ Has `get_current_user`, needs upgrade |
| `POST /workflows/{workflow_id}/approve-final` | 505 | `contract_admin` | ✅ Has `get_current_user`, needs upgrade |
| `POST /approvals/workflows/{id}/approve-placement` | 331 | `contract_admin` | ✅ ALREADY HAS `require_contract_admin` ✅ |
| `POST /candidates/{candidate_id}/execute` | 806 | `contract_admin` | ✅ Has `get_current_user`, needs upgrade |

**Note**: The workflow placement approval endpoint is already properly secured with `require_contract_admin` and extracts identity from JWT (line 463). The P0 vulnerability is in the **legacy governance manifest approval endpoints** (`/approvals/submit`, `/approvals/{id}/approve`, `/approvals/{id}/reject`), not the workflow endpoints.

---

## Legacy Governance Endpoints with P0 Vulnerability

| Endpoint | Vulnerable Field | Line | Security Impact |
|----------|------------------|------|-----------------|
| `POST /approvals/submit` | `submittedBy` | 22-25 (schema), 70, 79 (usage) | Client can forge submitter identity |
| `POST /approvals/{id}/approve` | `decidedBy` | 31-34 (schema), 187, 191, etc. | Client can forge approver identity, bypass self-approval check |
| `POST /approvals/{id}/reject` | `rejectedBy` | 49-52 (schema), 638, 642 (usage) | Client can forge rejecter identity |

---

## Implementation Steps

### FEAT-001: Add RBAC Helper Functions to `authorization.py`

- [ ] 1. **Add role-checking utility functions to `app/auth/authorization.py`**
      
      Add three new functions to the existing authorization module:
      
      - `require_role(principal: AuthenticatedPrincipal, required_role: str) -> None`: Checks if principal has the exact role. Raises `HTTPException(403)` if not. Case-insensitive role matching. Empty roles list denies by default. Logs denial at WARNING level with audit message including `user_id`, `required_role`, and timestamp.
      
      - `require_any_role(principal: AuthenticatedPrincipal, required_roles: list[str]) -> None`: Checks if principal has ANY of the required roles. Raises `HTTPException(403)` if none match. Case-insensitive role matching. Empty roles list denies by default. Logs denial at WARNING level.
      
      - `is_super_admin(principal: AuthenticatedPrincipal) -> bool`: Returns `True` if user has `super_admin` role OR `portal_identity == "super_admin"` OR `portal_identity == "infrastructure"`. Used for infrastructure bypass logic.
      
      Each function must:
      - Use case-insensitive role comparison (`role.lower()`)
      - Return immediately if `is_super_admin()` returns `True` (super_admin bypass)
      - Log WARNING-level denial messages: `f"RBAC denial: user={principal['user_id']}, required_roles={required_roles}, user_roles={principal.get('roles', [])}"`
      - Include comprehensive docstrings with Args, Returns, Raises, and usage examples
      
      **Files**: `services/project-ai/app/auth/authorization.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::TestRoleChecking -v` — 5 new tests pass (require_role, require_any_role, is_super_admin, super_admin_bypass, case_insensitive_matching)

### FEAT-002: Apply RBAC to Privileged Routes

- [ ] 2. **Replace `get_current_user` with `require_contract_admin` in workflow creation endpoint**
      
      In `services/project-ai/app/api/routes/workflows.py`:
      - Line 142: Change function signature from `user: AuthenticatedPrincipal = Depends(get_current_user)` to `user: AuthenticatedPrincipal = Depends(require_contract_admin)`
      - Add import at top: Update existing import line to include `require_contract_admin` from `app.auth.dependencies`
      - No other changes needed — identity extraction on line 156 (`requester_id = user["user_id"]`) remains unchanged
      
      This enforces that only `contract_admin` users can create workflows.
      
      **Files**: `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::test_workflow_creation_requires_contract_admin -v` — new test passes

- [ ] 3. **Replace `get_current_user` with `require_contract_admin` in final certification approval endpoint**
      
      In `services/project-ai/app/api/routes/workflows.py`:
      - Line 505: In `async def approve_final_certification(...)`, change `user: AuthenticatedPrincipal = Depends(get_current_user)` to `user: AuthenticatedPrincipal = Depends(require_contract_admin)`
      - Add `require_contract_admin` to imports at top if not already present
      - No other changes needed — endpoint already extracts approver identity from JWT (line 555: `user.get("email") or user.get("sub") or user.get("id") or "unknown"`)
      
      This enforces that only `contract_admin` users can approve final certification.
      
      **Files**: `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::test_final_approval_requires_contract_admin -v` — new test passes

- [ ] 4. **Replace `get_current_user` with `require_contract_admin` in placement approval endpoint**
      
      In `services/project-ai/app/api/routes/governance.py`:
      - Find the `POST /approvals/workflows/{id}/approve-placement` endpoint (approximately line 330-340)
      - Change function signature from `user: AuthenticatedPrincipal = Depends(get_current_user)` to `user: AuthenticatedPrincipal = Depends(require_contract_admin)`
      - Add import at top: Update existing import to include `require_contract_admin` from `app.auth.dependencies`
      - No other changes needed — endpoint already extracts approver identity from JWT
      
      This enforces that only `contract_admin` users can approve placement.
      
      **Files**: `services/project-ai/app/api/routes/governance.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::test_placement_approval_requires_contract_admin -v` — new test passes

- [ ] 5. **Replace `get_current_user` with `require_contract_admin` in candidate execution endpoint**
      
      In `services/project-ai/app/api/routes/candidate.py`:
      - Line 806: In `async def execute_placement(...)`, change `user: AuthenticatedPrincipal = Depends(get_current_user)` to `user: AuthenticatedPrincipal = Depends(require_contract_admin)`
      - Add import at top: Update existing import line to include `require_contract_admin` from `app.auth.dependencies`
      - No other changes needed — endpoint already performs brand enforcement after this check
      
      This enforces that only `contract_admin` users can execute placement.
      
      **Files**: `services/project-ai/app/api/routes/candidate.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::test_candidate_execution_requires_contract_admin -v` — new test passes

### FEAT-003: Comprehensive RBAC Test Suite

- [ ] 6. **Create comprehensive RBAC test suite in `tests/security/test_rbac.py`**
      
      Create new test file with 15 tests organized into 3 categories:
      
      **Category 1: RBAC Helper Functions (5 tests)**
      - `test_require_role_success`: User with exact role passes
      - `test_require_role_denial`: User without role gets 403
      - `test_require_any_role_success`: User with one of multiple roles passes
      - `test_require_any_role_denial`: User with none of the roles gets 403
      - `test_is_super_admin_detection`: Correctly identifies super_admin via role, portal_identity "super_admin", or portal_identity "infrastructure"
      - `test_super_admin_bypass`: super_admin bypasses role checks
      - `test_case_insensitive_role_matching`: "Contract_Admin" matches "contract_admin"
      
      **Category 2: Route-Level RBAC Enforcement (4 tests)**
      - `test_workflow_creation_requires_contract_admin`: POST /workflows with contract_viewer gets 403
      - `test_final_approval_requires_contract_admin`: POST /workflows/{id}/approve-final with contract_reviewer gets 403
      - `test_placement_approval_requires_contract_admin`: POST /approvals/workflows/{id}/approve-placement with contract_viewer gets 403
      - `test_candidate_execution_requires_contract_admin`: POST /candidates/{id}/execute with contract_reviewer gets 403
      
      **Category 3: Valid Path Smoke Tests (4 tests)**
      - `test_contract_admin_can_create_workflow`: User with contract_admin role successfully creates workflow
      - `test_contract_admin_can_approve_final`: User with contract_admin role successfully approves certification
      - `test_super_admin_bypasses_all_checks`: User with super_admin role can perform all privileged operations
      - `test_empty_roles_list_denies_access`: User with empty roles list gets 403 on all privileged routes
      
      All tests use pytest fixtures for token creation (reuse patterns from `test_identity_extraction.py`). Tests mock database dependencies where needed to isolate RBAC logic.
      
      **Files**: `services/project-ai/tests/security/test_rbac.py` (new file)
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py -v --tb=short` — all 15 tests pass

### FEAT-004: Fix Governance Identity Spoofing (P0 Security Issue)

- [ ] 7. **Remove client-supplied identity fields from governance approval schemas**
      
      **CRITICAL P0 VULNERABILITY**: Legacy governance endpoints (`POST /submit`, `POST /{approval_id}/approve`, `POST /{approval_id}/reject`) accept client-supplied `submittedBy`, `decidedBy`, and `rejectedBy` fields, allowing identity spoofing in audit trails and self-approval bypass.
      
      In `services/project-ai/app/api/schemas/governance.py`:
      - Remove `submittedBy: str` field from `ApprovalSubmitRequest` (line 22-25)
      - Remove `decidedBy: str` field from `ApprovalDecisionRequest` (line 31-34)
      - Remove `rejectedBy: str` field from `ApprovalRejectRequest` (line 49-52)
      - Update docstrings to note: "Identity extracted from JWT token"
      - Keep `submittedBy`, `decidedBy` in response model `ApprovalRecord` (these are stored values, not client input)
      
      **Files**: `services/project-ai/app/api/schemas/governance.py`
      
      **Verify**: Schema compilation succeeds (no Pydantic errors)

- [ ] 8. **Replace client-supplied identities with JWT extraction in governance route handlers**
      
      In `services/project-ai/app/api/routes/governance.py`:
      
      **POST /submit endpoint** (line 45):
      - Line 70: Replace `"by": request.submittedBy` with `"by": user.get("user_id") or user.get("email") or "unknown"`
      - Line 79: Replace `"submittedBy": request.submittedBy` with `"submittedBy": user.get("user_id") or user.get("email") or "unknown"`
      
      **POST /{approval_id}/approve endpoint** (line 147):
      - Extract decider at start: `decided_by = user.get("user_id") or user.get("email") or "unknown"`
      - Line 187: Replace `if request.decidedBy == approval["submittedBy"]:` with `if decided_by == approval["submittedBy"]:`
      - Line 191: Replace `approval["decidedBy"] = request.decidedBy` with `approval["decidedBy"] = decided_by`
      - Line 195: Replace `f"User '{request.decidedBy}' cannot approve"` with `f"User '{decided_by}' cannot approve"`
      - Line 201: Replace `"by": request.decidedBy` with `"by": decided_by`
      - Line 214: Replace `"attemptedBy": request.decidedBy` with `"attemptedBy": decided_by`
      - Line 223: Replace `approval["decidedBy"] = request.decidedBy` with `approval["decidedBy"] = decided_by`
      - Line 234: Replace `"by": request.decidedBy` with `"by": decided_by`
      - Line 253: Replace `approval["decidedBy"] = request.decidedBy` with `approval["decidedBy"] = decided_by`
      - Line 259: Replace `"by": request.decidedBy` with `"by": decided_by`
      
      **POST /{approval_id}/reject endpoint** (line 595):
      - Extract rejecter at start: `rejected_by = user.get("user_id") or user.get("email") or "unknown"`
      - Line 638: Replace `approval["decidedBy"] = request.rejectedBy` with `approval["decidedBy"] = rejected_by`
      - Line 642: Replace `"by": request.rejectedBy` with `"by": rejected_by`
      
      **NOTE**: The `POST /workflows/{id}/approve-placement` endpoint (line 331) already extracts approver from JWT correctly (line 463: `approved_by = user.get("user_id")`). This endpoint is NOT vulnerable.
      
      **Files**: `services/project-ai/app/api/routes/governance.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::TestGovernanceIdentitySpoofing -v` — 3 new tests pass

- [ ] 9. **Add governance identity spoofing prevention tests to RBAC test suite**
      
      Add to `services/project-ai/tests/security/test_rbac.py`:
      
      **Category 4: Governance Identity Spoofing Prevention (3 tests)**
      - `test_governance_submit_ignores_client_supplied_submitter`: Call `POST /approvals/submit` with JWT user_id="user123". Verify stored `submittedBy` is "user123", NOT the value from request body (if one was sent).
      
      - `test_governance_approve_ignores_client_supplied_decider`: Call `POST /approvals/{id}/approve` with JWT user_id="admin456". Verify stored `decidedBy` is "admin456", NOT from request body.
      
      - `test_governance_self_approval_uses_jwt_identity`: Submit manifest with user A (JWT), attempt approve with same user A (JWT). Verify self-approval is rejected with error code `SELF_APPROVAL_REJECTED`, proving the check uses JWT identity not request body.
      
      These tests prove clients cannot forge identities in governance approval workflows.
      
      **Files**: `services/project-ai/tests/security/test_rbac.py`
      
      **Verify**: `pytest services/project-ai/tests/security/test_rbac.py::TestGovernanceIdentitySpoofing -v` — all 3 tests pass

### FEAT-005: Documentation and Verification

- [ ] 10. **Update README.md with RBAC documentation**
      
      In `services/project-ai/README.md`:
      - Add new section "## Role-Based Access Control (Wave 1D)" after the "Authorization Enforcement (Wave 1C)" section
      - Document all four roles: `contract_admin`, `contract_reviewer`, `contract_viewer`, `super_admin`
      - List privileged operations requiring `contract_admin`:
        - Workflow creation
        - Final certification approval
        - Placement approval
        - Candidate execution
      - Document super_admin bypass logic
      - Add code example showing `require_contract_admin` usage in route handlers
      - Add security note: "All privileged routes enforce RBAC at the FastAPI dependency level. Users without required roles receive HTTP 403 Forbidden with role requirement detail."
      
      **Files**: `services/project-ai/README.md`
      
      **Verify**: Manual review — section exists with all RBAC rules documented

- [ ] 11. **Run full security test suite and verify coverage**
      
      Execute complete security test suite to verify no regressions:
      ```bash
      cd services/project-ai
      pytest tests/security/ -v --cov=app/auth --cov=app/api/routes/governance --cov-report=term-missing
      ```
      
      Expected results:
      - `test_identity_extraction.py`: 15 tests pass (Wave 1B baseline)
      - `test_authorization.py`: 20 tests pass (Wave 1C baseline)
      - `test_rbac.py`: 18 tests pass (Wave 1D: 15 RBAC + 3 governance identity spoofing)
      - Total: 53 security tests pass with 0 failures
      - Auth module coverage: ≥94% (up from 82% in Wave 1C)
      - Governance routes coverage: ≥85% (up from current baseline)
      
      **Files**: N/A (test execution)
      
      **Verify**: All 53 security tests pass; coverage report shows ≥94% for `app/auth/` and ≥85% for `app/api/routes/governance.py`

---

## Test Plan Summary

### FEAT-001: RBAC Helper Functions Tests (7 tests)

1. **`test_require_role_success`**
   - Setup: Principal with `roles=["contract_admin"]`, require `"contract_admin"`
   - Action: `require_role(principal, "contract_admin")`
   - Expected: No exception raised

2. **`test_require_role_denial`**
   - Setup: Principal with `roles=["contract_viewer"]`, require `"contract_admin"`
   - Action: `require_role(principal, "contract_admin")`
   - Expected: `HTTPException(403, detail="Requires contract_admin role")`

3. **`test_require_any_role_success`**
   - Setup: Principal with `roles=["contract_reviewer"]`, require `["contract_admin", "contract_reviewer"]`
   - Action: `require_any_role(principal, ["contract_admin", "contract_reviewer"])`
   - Expected: No exception raised

4. **`test_require_any_role_denial`**
   - Setup: Principal with `roles=["contract_viewer"]`, require `["contract_admin", "contract_reviewer"]`
   - Action: `require_any_role(principal, ["contract_admin", "contract_reviewer"])`
   - Expected: `HTTPException(403)`

5. **`test_is_super_admin_detection`**
   - Test 3 cases:
     - Principal with `roles=["super_admin"]` → `is_super_admin()` returns `True`
     - Principal with `portal_identity="super_admin"` → `True`
     - Principal with `portal_identity="infrastructure"` → `True`
     - Principal with neither → `False`

6. **`test_super_admin_bypass`**
   - Setup: Principal with `roles=["super_admin"]`, require `"contract_admin"`
   - Action: `require_role(principal, "contract_admin")`
   - Expected: No exception raised (super_admin bypasses check)

7. **`test_case_insensitive_role_matching`**
   - Setup: Principal with `roles=["Contract_Admin"]`, require `"contract_admin"`
   - Action: `require_role(principal, "contract_admin")`
   - Expected: No exception raised (case-insensitive match)

### FEAT-002: Route-Level RBAC Tests

8. **`test_workflow_creation_requires_contract_admin`**
   - Setup: Create token with `roles=["contract_viewer"]`
   - Action: `POST /workflows` with viewer token
   - Expected: `HTTPException(403, detail="Requires contract_admin role")`

9. **`test_final_approval_requires_contract_admin`**
   - Setup: Create workflow, token with `roles=["contract_reviewer"]`
   - Action: `POST /workflows/{id}/approve-final` with reviewer token
   - Expected: `HTTPException(403)`

10. **`test_placement_approval_requires_contract_admin`**
    - Setup: Create workflow, token with `roles=["contract_viewer"]`
    - Action: `POST /approvals/workflows/{id}/approve-placement` with viewer token
    - Expected: `HTTPException(403)`

11. **`test_candidate_execution_requires_contract_admin`**
    - Setup: Create candidate, token with `roles=["contract_reviewer"]`
    - Action: `POST /candidates/{id}/execute` with reviewer token
    - Expected: `HTTPException(403)`

### FEAT-003: Valid Path Tests (4 tests)

12. **`test_contract_admin_can_create_workflow`**
    - Setup: Token with `roles=["contract_admin"]`
    - Action: `POST /workflows` with admin token
    - Expected: 200 OK, workflow created

13. **`test_contract_admin_can_approve_final`**
    - Setup: Workflow in AWAITING_GATE_2 state, token with `roles=["contract_admin"]`
    - Action: `POST /workflows/{id}/approve-final` with admin token
    - Expected: 200 OK, workflow transitions to CERTIFIED

14. **`test_super_admin_bypasses_all_checks`**
    - Setup: Token with `roles=["super_admin"]`
    - Action: Perform all 4 privileged operations
    - Expected: All succeed (super_admin bypasses role checks)

15. **`test_empty_roles_list_denies_access`**
    - Setup: Token with `roles=[]`
    - Action: Try all 4 privileged operations
    - Expected: All return 403

### FEAT-004: Governance Identity Spoofing Prevention (3 tests)

16. **`test_governance_submit_ignores_client_supplied_submitter`**
    - Setup: JWT token with `user_id="user123"`
    - Action: `POST /approvals/submit` (if test attempts to send `submittedBy` field, it should fail schema validation or be ignored)
    - Expected: Stored approval has `submittedBy="user123"` from JWT, not from any client-supplied value

17. **`test_governance_approve_ignores_client_supplied_decider`**
    - Setup: Create pending approval, JWT token with `user_id="admin456"`
    - Action: `POST /approvals/{id}/approve` (if test attempts to send `decidedBy` field, it should fail schema validation or be ignored)
    - Expected: Stored approval has `decidedBy="admin456"` from JWT, not from any client-supplied value

18. **`test_governance_self_approval_uses_jwt_identity`**
    - Setup: Submit manifest with JWT user_id="user123", attempt approve with same JWT user_id="user123"
    - Action: Self-approval attempt
    - Expected: `HTTPException(403, error="SELF_APPROVAL_REJECTED")`, proving JWT identity is used for self-approval check

---

## Verification Commands

### Run RBAC Tests Only
```bash
cd services/project-ai
pytest tests/security/test_rbac.py -v --tb=short
```

### Run Full Security Suite
```bash
cd services/project-ai
pytest tests/security/ -v --cov=app/auth --cov=app/api/routes/governance --cov-report=term-missing
```

### Run All Tests (Includes Unit, Integration, Security)
```bash
cd services/project-ai
pytest tests/ -v --cov=app --cov-report=html
```

---

## Authorization Function Signatures

### New Functions in `authorization.py`

```python
def require_role(
    principal: AuthenticatedPrincipal,
    required_role: str
) -> None:
    """
    Verify principal has the required role.
    
    Case-insensitive role matching. Empty roles list denies by default.
    super_admin bypass: Users with super_admin role bypass this check.
    
    Args:
        principal: Authenticated user from JWT token
        required_role: Role identifier required for access
        
    Raises:
        HTTPException: 403 if user lacks required role
    """


def require_any_role(
    principal: AuthenticatedPrincipal,
    required_roles: list[str]
) -> None:
    """
    Verify principal has at least one of the required roles.
    
    Case-insensitive role matching. Empty roles list denies by default.
    super_admin bypass: Users with super_admin role bypass this check.
    
    Args:
        principal: Authenticated user from JWT token
        required_roles: List of role identifiers (any one grants access)
        
    Raises:
        HTTPException: 403 if user lacks all required roles
    """


def is_super_admin(principal: AuthenticatedPrincipal) -> bool:
    """
    Check if principal has super_admin privileges.
    
    Returns True if any of:
    - Has 'super_admin' role (case-insensitive)
    - Has portal_identity == 'super_admin'
    - Has portal_identity == 'infrastructure'
    
    Args:
        principal: Authenticated user from JWT token
        
    Returns:
        True if user has super_admin privileges
    """
```

### Usage Example in Routes

```python
from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import require_contract_admin
from app.auth.types import AuthenticatedPrincipal

router = APIRouter()

@router.post("/workflows")
async def create_workflow(
    request: CreateWorkflowRequest,
    user: AuthenticatedPrincipal = Depends(require_contract_admin),  # RBAC enforcement here
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Create new workflow (requires contract_admin role).
    
    RBAC: Only contract_admin users can create workflows.
    Identity: Requester extracted from JWT token to prevent spoofing.
    """
    requester_id = user["user_id"]
    
    workflow = await governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=requester_id,
        purpose=request.purpose
    )
    await session.commit()
    
    return _workflow_to_response(workflow)
```

---

## Dependencies Between Steps

- Step 1 (add RBAC helpers) must complete before steps 2-5 (route enforcement)
- Steps 2-5 (route changes) are independent and can be done in any order
- Step 6 (test suite) depends on steps 1-5 (all implementation complete)
- Step 7 (README) can be done in parallel with implementation
- Step 8 (full test run) depends on step 6 (test suite exists)

---

## Project Context

### Build System
- **Language**: Python 3.13.7
- **Framework**: FastAPI + Pydantic v2
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

### Verification Command
```bash
cd services/project-ai
pytest tests/security/ -v --cov=app/auth --cov-report=term-missing
```

### Key Patterns
1. **FastAPI Dependencies**: Use `Depends()` for auth enforcement — change `get_current_user` to `require_contract_admin` in route signatures
2. **TypedDict Identity**: `AuthenticatedPrincipal` is a TypedDict, behaves like dict at runtime
3. **HTTPException**: Raise `HTTPException(status_code=403, detail="Requires contract_admin role")` for RBAC denials
4. **Async/Await**: All route handlers and repository methods are async
5. **Test Fixtures**: Reuse JWT token creation patterns from `test_identity_extraction.py`
6. **Logging**: Use `logging.warning()` for RBAC denials with user_id and required role

### Relevant Files
- **Auth layer**: 
  - `app/auth/dependencies.py` — Already has `require_contract_admin`, `require_contract_reviewer`, `require_contract_viewer`
  - `app/auth/authorization.py` — Add new RBAC helper functions here
  - `app/auth/types.py` — `AuthenticatedPrincipal` type definition
- **Route handlers**: 
  - `app/api/routes/workflows.py` — Lines 142, 505 need `require_contract_admin`
  - `app/api/routes/governance.py` — Find approve-placement endpoint, add `require_contract_admin`
  - `app/api/routes/candidate.py` — Line 806 needs `require_contract_admin`
- **Tests**:
  - `tests/security/test_identity_extraction.py` — Wave 1B baseline (15 tests)
  - `tests/security/test_authorization.py` — Wave 1C baseline (20 tests)
  - `tests/security/test_rbac.py` — Wave 1D new file (15 tests)
  - `tests/unit/test_auth_dependencies.py` — Existing tests for `require_contract_admin` FastAPI dependencies

### Environment Constraints
- PostgreSQL connection required for integration tests (`TEST_DATABASE_URL_TUTORIAL`)
- JWT secrets must be set (`JWT_SECRET`, `ADMIN_JWT_SECRET`)
- Unit tests run without database

### Contribution Requirements
- Type hints required for all functions
- Docstrings required for public APIs (include Args, Returns, Raises)
- Test coverage target: 80%+
- Follow existing test patterns (pytest fixtures, async tests)
- Use `HTTPException` for route errors, not plain exceptions
- Log RBAC denials at WARNING level for security audit trail

---

## Acceptance Criteria

- [ ] All 18 new RBAC tests pass (15 RBAC + 3 governance identity spoofing)
- [ ] All 15 existing Wave 1B identity extraction tests still pass
- [ ] All 20 existing Wave 1C authorization tests still pass
- [ ] `require_contract_admin` dependency applied to all 4 privileged routes
- [ ] RBAC helper functions added with 100% test coverage
- [ ] super_admin bypass implemented and tested
- [ ] Case-insensitive role matching implemented and tested
- [ ] **P0 FIX**: Client-supplied identity fields removed from governance schemas
- [ ] **P0 FIX**: All governance endpoints extract identities from JWT tokens
- [ ] **P0 FIX**: Self-approval checks use JWT-derived identities
- [ ] Auth test coverage ≥94% (up from 82% in Wave 1C)
- [ ] Governance routes coverage ≥85%
- [ ] README documents RBAC rules and identity extraction with examples
- [ ] No regressions in existing route functionality

---

## Notes

- **P0 Security Issue**: The governance identity spoofing vulnerability (FEAT-004) is a **critical priority** and must be fixed before Wave 1D approval. This vulnerability allows clients to forge `submittedBy`, `decidedBy`, and `rejectedBy` identities, bypassing self-approval checks and poisoning audit trails.

- **Existing Dependencies Available**: `require_contract_admin`, `require_contract_reviewer`, and `require_contract_viewer` already exist in `app/auth/dependencies.py` and are well-tested in `test_auth_dependencies.py`. We're just applying them to routes.
  
- **Helper Functions Purpose**: The new RBAC helper functions (`require_role`, `require_any_role`, `is_super_admin`) are utilities for more flexible role checking in business logic, not replacements for the FastAPI dependencies. Use FastAPI dependencies for route-level enforcement.

- **super_admin Bypass**: Infrastructure users with `super_admin` role, `portal_identity="super_admin"`, or `portal_identity="infrastructure"` bypass all role checks. This is intentional — platform administrators need unrestricted access.

- **Case-Insensitive Matching**: Role names in JWT tokens may have inconsistent casing. All role comparisons use `.lower()` to ensure "Contract_Admin" matches "contract_admin".

- **Audit Logging**: All RBAC denials log at WARNING level with format: `"RBAC denial: user={user_id}, required_roles={required_roles}, user_roles={user_roles}"`. This provides security audit trail.

- **Empty Roles Deny**: Users with empty roles list (`roles=[]`) are denied access to all privileged routes. This is the secure default — no roles = no privileges.

- **No Database Schema Changes**: Wave 1D is purely code changes. No migrations required.

---

## Architecture Notes

### RBAC Enforcement Strategy

Wave 1D applies **defense-in-depth** authorization:

1. **Layer 1: Identity Extraction (Wave 1B)**: JWT token validation and claim extraction
2. **Layer 2: Brand Boundary (Wave 1C)**: Tenant isolation for candidate resources
3. **Layer 3: Role-Based Access (Wave 1D)**: Privileged operation enforcement

All three layers stack:
- Candidate execution requires: valid JWT + same brand + contract_admin role
- Workflow creation requires: valid JWT + contract_admin role (no brand check — platform resource)
- Final certification requires: valid JWT + contract_admin role

### When to Use Each Dependency

| Dependency | Use Case | Example Route |
|------------|----------|---------------|
| `get_current_user` | Read-only operations, identity extraction | `GET /workflows/{id}` |
| `require_contract_viewer` | View workflows and candidates | `GET /candidates` |
| `require_contract_reviewer` | Review but not approve | `GET /workflows/{id}/review` |
| `require_contract_admin` | Approve, certify, execute | `POST /workflows/{id}/approve-final` |

### Role Hierarchy

- `contract_admin` ⊃ `contract_reviewer` ⊃ `contract_viewer`
- Admins can do everything reviewers can do
- Reviewers can do everything viewers can do
- Implemented in existing `require_contract_reviewer` dependency (checks for both reviewer and admin roles)

### Infrastructure Bypass

Infrastructure users bypass **role checks** but still respect **identity extraction**:
- super_admin can perform privileged operations without contract_admin role
- super_admin approvals still record their actual identity from JWT (not "unknown")
- super_admin still respects brand boundaries for brand-scoped resources (unless brand=None in their token)

---

## Risk Assessment

### Vulnerabilities Fixed ✅
- **Unprivileged Workflow Creation**: Regular users can no longer create workflows
- **Unprivileged Approval**: Reviewers can no longer approve workflows (view-only)
- **Unprivileged Certification**: Non-admins can no longer certify implementations
- **Unprivileged Placement Execution**: Regular users can no longer execute placements
- **P0: Governance Identity Spoofing**: Clients can no longer forge `submittedBy`, `decidedBy`, or `rejectedBy` identities
- **P0: Self-Approval Bypass**: Self-approval checks now use JWT-derived identities, preventing client-side override
- **P0: Audit Trail Poisoning**: All governance audit trails now record JWT-verified identities

### Security Impact
- **Privilege Escalation Risk**: Reduced from HIGH to LOW ✅
- **Identity Spoofing in Governance**: Reduced from HIGH to LOW ✅ (P0 fix)
- **Self-Approval Bypass**: Reduced from HIGH to LOW ✅ (P0 fix)
- **Audit Trail Integrity**: Reduced from MEDIUM to LOW ✅ (P0 fix)
- **Audit Logging**: RBAC denials logged at WARNING level ✅
- **Defense-in-Depth**: Three authorization layers (identity, brand, role) ✅
- **Overall Security Posture**: Significantly Hardened ✅

---

## Commit Message Template

```
feat(wave1d): implement RBAC enforcement + fix governance identity spoofing (P0)

Apply contract_admin role requirement to 4 privileged operations:
- Workflow creation (POST /workflows)
- Final certification approval (POST /workflows/{id}/approve-final)
- Placement approval (POST /approvals/workflows/{id}/approve-placement)
- Candidate execution (POST /candidates/{id}/execute)

Add RBAC helper functions to authorization.py:
- require_role(): Check exact role with super_admin bypass
- require_any_role(): Check multiple roles with super_admin bypass
- is_super_admin(): Detect infrastructure privilege

P0 Security Fix - Governance Identity Spoofing:
- Remove client-supplied submittedBy, decidedBy, rejectedBy from schemas
- Extract all governance identities from JWT tokens
- Self-approval checks now use JWT-derived identities
- Prevents identity forgery in approval workflows

Features:
- Case-insensitive role matching
- super_admin bypass for infrastructure users
- WARNING-level audit logging for RBAC denials
- Empty roles list denies by default
- Tamper-proof audit trails with JWT-verified identities

Tests: 18 new tests (15 RBAC + 3 governance), 53 total security tests passing
Coverage: 94% auth module (up from 82%), 85% governance routes
No regressions in Wave 1B/1C tests
```
