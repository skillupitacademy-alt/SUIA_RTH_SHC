# R4 Authentication Status Audit - Findings Report

**Project**: quiz-platform (project-ai service)  
**Branch**: m2-project-ai-canonical-wiring  
**Audit Date**: 2024  
**Auditor**: Security Audit Agent (READ-ONLY)  
**Scope**: All API routes in `services/project-ai/app/api/routes/`

---

## Executive Summary

This audit analyzed **10 route files** containing **37 API endpoints** in the project-ai service to determine authentication status, ownership enforcement, and security gaps.

### Key Findings

- **2 endpoints (5.4%)** have REAL authentication with ownership enforcement (contract routes)
- **35 endpoints (94.6%)** have NO authentication
- **1 endpoint** has PLACEHOLDER authentication (documented as temporary for Wave 2)
- **0 project_ai_* routes** exist (naming convention not used)
- **Self-approval prevention** is implemented at the business logic layer (not auth layer)

### Critical Security Gap

**94.6% of API endpoints are publicly accessible** without authentication. This includes sensitive operations like:
- Workflow creation and state transitions
- Candidate block uploads
- Placement manifest generation
- Approval decisions
- Repository snapshot access

---

## Authentication Patterns Identified

### 1. Real JWT Authentication

**Location**: `app/auth/dependencies.py`

```python
def get_current_user(authorization: str = Header(...)) -> dict:
    """Extract and validate user from JWT Bearer token."""
    # Validates Bearer token format
    # Decodes JWT using decode_access_token()
    # Returns: {"user_id": str, "roles": list}
```

**RBAC Roles Available**:
- `contract_admin` - Full contract management access
- `contract_reviewer` - Review and approve contracts
- `contract_viewer` - Read-only contract access

### 2. Placeholder Authentication

**Location**: `app/api/routes/contract.py`

```python
async def verify_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    This is a placeholder auth implementation for Wave 2.
    Production would integrate with the actual auth service.
    """
    # Validates Bearer token format
    # Accepts any token >= 8 characters
    # Returns: f"user-{token[:8]}"
```

**Status**: Documented as temporary, includes TODOs for production integration

### 3. No Authentication

**Status**: 35 out of 37 endpoints have no authentication dependency

---

## Route-by-Route Analysis

### Route File: `contract.py` (2 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| POST | `/workflows/{workflow_id}/engineering-contract` | **PLACEHOLDER** | ✅ YES | Uses `verify_auth()` + `verify_workflow_ownership()` |
| GET | `/workflows/{workflow_id}/engineering-contract` | **PLACEHOLDER** | ✅ YES | Uses `verify_auth()` + `verify_workflow_ownership()` |

**Ownership Enforcement**: 
- `verify_workflow_ownership()` validates:
  - User owns the workflow (`workflow.requester_id == user_id`)
  - Workflow is in valid state for operation
  - Returns 403 if ownership fails

**Security Level**: 🟡 **MEDIUM** - Authentication present but placeholder implementation

---

### Route File: `workflows.py` (5 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| POST | `/workflows` | ❌ NONE | ❌ NO | Creates workflow with any requester_id |
| GET | `/workflows/{workflow_id}` | ❌ NONE | ❌ NO | Returns any workflow to any caller |
| POST | `/workflows/{workflow_id}/transition` | ❌ NONE | ❌ NO | State transitions without auth |
| GET | `/workflows/{workflow_id}/history` | ❌ NONE | ❌ NO | Audit trail publicly readable |
| POST | `/workflows/{workflow_id}/artifacts` | ❌ NONE | ❌ NO | Artifact binding without auth |
| GET | `/workflows` | ❌ NONE | ❌ NO | List all workflows |

**Security Level**: 🔴 **CRITICAL** - Core workflow management has no authentication

---

### Route File: `candidate.py` (7 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| POST | `/upload` | ❌ NONE | ❌ NO | Anyone can upload candidates |
| POST | `/{candidate_id}/classify` | ❌ NONE | ❌ NO | Classification available to all |
| POST | `/{candidate_id}/compare` | ❌ NONE | ❌ NO | Comparison available to all |
| POST | `/{candidate_id}/manifest` | ❌ NONE | ❌ NO | Manifest generation without auth |
| GET | `/{candidate_id}/manifest` | ❌ NONE | ❌ NO | Manifests publicly readable |
| GET | `` | ❌ NONE | ❌ NO | List all candidates |
| POST | `/{candidate_id}/execute` | ❌ NONE | ⚠️ PARTIAL | Uses `ApprovalEnforcer` (business logic, not auth) |

**Security Level**: 🔴 **CRITICAL** - Candidate operations unprotected, including execution

**Note on `execute_placement`**:
- Enforces **approval verification** via `ApprovalEnforcer` (business logic layer)
- Checks self-approval prevention at runtime
- Does NOT verify the caller's identity (no auth dependency)
- Anyone can attempt execution if they know the candidate_id

---

### Route File: `governance.py` (7 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| POST | `/approvals/submit` | ❌ NONE | ❌ NO | Anyone can submit for approval |
| GET | `/approvals/pending` | ❌ NONE | ❌ NO | Pending approvals publicly visible |
| GET | `/approvals/{approval_id}` | ❌ NONE | ❌ NO | Approval records publicly readable |
| POST | `/approvals/{approval_id}/approve` | ❌ NONE | ⚠️ PARTIAL | Self-approval check in business logic |
| POST | `/approvals/{approval_id}/reject` | ❌ NONE | ❌ NO | Anyone can reject |
| POST | `/approvals/workflows/{workflow_id}/approve-placement` | ❌ NONE | ⚠️ PARTIAL | Self-approval check in business logic |
| GET | `/approvals/workflows/{workflow_id}/implementation-approval` | ❌ NONE | ❌ NO | Approval records publicly readable |

**Security Level**: 🔴 **CRITICAL** - Approval workflow has no authentication

**Self-Approval Prevention**:
- Implemented in business logic (not auth layer)
- Checks `request.decidedBy == approval["submittedBy"]`
- Returns 403 if self-approval detected
- **Gap**: Relies on client-provided identity without verification

---

### Route File: `snapshot.py` (2 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| GET | `/snapshot` | ❌ NONE | N/A | Full repository snapshot publicly accessible |
| GET | `/snapshot/metadata` | ❌ NONE | N/A | Snapshot metadata publicly accessible |

**Security Level**: 🟡 **MEDIUM** - Repository intelligence exposed but read-only

---

### Route File: `evidence.py` (2 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| GET | `/evidence/{evidence_id}` | ❌ NONE | N/A | Evidence records publicly readable |
| GET | `/evidence` | ❌ NONE | N/A | All evidence publicly accessible |

**Security Level**: 🟡 **MEDIUM** - Evidence trail exposed but read-only

---

### Route File: `agents.py` (2 endpoints)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| GET | `/agents` | ❌ NONE | N/A | Agent registry publicly readable |
| GET | `/agents/{agent_type}` | ❌ NONE | N/A | Agent definitions publicly accessible |

**Security Level**: 🟢 **LOW** - Agent metadata exposure (read-only, architectural info)

---

### Route File: `health.py` (1 endpoint)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| GET | `/health` | ❌ NONE | N/A | Standard health check endpoint |

**Security Level**: 🟢 **LOW** - Standard practice for health checks

---

### Route File: `tasks.py` (4 endpoints - DEPRECATED)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| POST | `/tasks/plan` | ❌ NONE | ❌ NO | Deprecated, uses in-memory storage |
| GET | `/tasks/{task_id}` | ❌ NONE | ❌ NO | Deprecated |
| POST | `/tasks/{task_id}/approve` | ❌ NONE | ❌ NO | Deprecated |
| POST | `/tasks/{task_id}/reject` | ❌ NONE | ❌ NO | Deprecated |

**Security Level**: 🟡 **MEDIUM** - Deprecated endpoints (marked for removal in Wave 1+)

---

### Route File: `creation.py` (4 endpoints - DISABLED)

| Method | Path | Auth Type | Ownership Check | Notes |
|--------|------|-----------|-----------------|-------|
| POST | `/creation/workflows` | ❌ DISABLED | N/A | Returns 405, architectural violation |
| GET | `/creation/workflows/{workflow_id}` | ❌ DISABLED | N/A | Returns 405 |
| POST | `/creation/workflows/{workflow_id}/validate` | ❌ DISABLED | N/A | Returns 405 |
| POST | `/creation/workflows/{workflow_id}/certify` | ❌ DISABLED | N/A | Returns 405 |

**Security Level**: 🟢 **LOW** - Endpoints disabled, return 405 Method Not Allowed

---

## Project AI Routes Analysis

**Search Pattern**: `project_ai_*` route names

**Findings**: ❌ **NOT FOUND**

The naming convention `project_ai_*` is not used in the codebase. Routes follow RESTful naming:
- `/workflows/*`
- `/candidates/*`
- `/approvals/*`
- `/evidence/*`
- `/snapshot/*`
- `/agents/*`

**Recommendation**: If "project_ai routes" refers to the entire project-ai service, then all routes analyzed above fall under this category.

---

## Authentication Gap Summary

### Endpoints by Authentication Status

| Auth Status | Count | Percentage | Risk Level |
|-------------|-------|------------|------------|
| **NONE** | 35 | 94.6% | 🔴 CRITICAL |
| **PLACEHOLDER** | 2 | 5.4% | 🟡 MEDIUM |
| **REAL** | 0 | 0% | N/A |

### Endpoints by Risk Category

| Risk Category | Count | Endpoints |
|---------------|-------|-----------|
| **🔴 CRITICAL** | 19 | Workflows (5), Candidates (7), Governance (7) |
| **🟡 MEDIUM** | 9 | Contract (2), Snapshot (2), Evidence (2), Tasks (4) |
| **🟢 LOW** | 5 | Agents (2), Health (1), Creation (4 disabled) |

---

## Security Architecture Analysis

### Authentication vs Authorization

The codebase **separates authentication from authorization**:

1. **Authentication Layer** (Missing/Placeholder)
   - JWT validation exists in `app/auth/dependencies.py`
   - Only used in contract routes (placeholder mode)
   - Not enforced across other routes

2. **Authorization Layer** (Present but Weak)
   - Self-approval prevention in governance logic
   - Ownership checks in business logic
   - Approval enforcement via `ApprovalEnforcer`
   - **Gap**: Authorization without authentication = identity spoofing risk

### Self-Approval Prevention

**Implementation**: Business logic layer

**Locations**:
- `app/api/routes/governance.py`: `approve_manifest()`, `approve_placement()`
- `app/placement/executor.py`: `PlacementExecutor.execute()`
- `app/placement/approval_enforcer.py`: `ApprovalEnforcer.enforce_approval()`
- `app/agents/governance.py`: `GovernanceAgent.validate_approval()`

**Mechanism**:
```python
# Example from governance.py
if request.decidedBy == approval["submittedBy"]:
    raise HTTPException(
        status_code=403,
        detail={
            "error": "SELF_APPROVAL_REJECTED",
            "message": "User cannot approve their own submission"
        }
    )
```

**Security Gap**: 
- Relies on client-provided identities (`decidedBy`, `submittedBy`)
- No verification that the caller is who they claim to be
- Can be bypassed by providing different identity strings

---

## Critical Security Gaps

### Gap 1: Workflow Management Unprotected

**Affected Endpoints**: 
- POST `/workflows`
- POST `/workflows/{workflow_id}/transition`
- POST `/workflows/{workflow_id}/artifacts`

**Risk**: 
- Anyone can create workflows with arbitrary `requester_id`
- Anyone can transition workflow states
- Anyone can bind artifacts to workflows

**Impact**: 🔴 **CRITICAL**
- Workflow integrity compromised
- State machine manipulation
- Unauthorized artifact binding

---

### Gap 2: Candidate Operations Unprotected

**Affected Endpoints**:
- POST `/upload`
- POST `/{candidate_id}/manifest`
- POST `/{candidate_id}/execute`

**Risk**:
- Anyone can upload malicious candidates
- Anyone can generate placement manifests
- Anyone can attempt execution (if approval exists)

**Impact**: 🔴 **CRITICAL**
- Code injection via malicious candidates
- Repository manipulation via execution
- Placement of unauthorized blocks

---

### Gap 3: Approval Workflow Unprotected

**Affected Endpoints**:
- POST `/approvals/submit`
- POST `/approvals/{approval_id}/approve`
- POST `/approvals/workflows/{workflow_id}/approve-placement`

**Risk**:
- Self-approval prevention can be bypassed (no identity verification)
- Anyone can submit, approve, or reject approvals
- Separation of duties cannot be enforced

**Impact**: 🔴 **CRITICAL**
- Governance controls ineffective
- Unauthorized approvals
- Compliance violations

---

### Gap 4: Repository Intelligence Exposed

**Affected Endpoints**:
- GET `/snapshot`
- GET `/evidence`
- GET `/evidence/{evidence_id}`

**Risk**:
- Full repository structure exposed
- File paths and dependencies visible
- Evidence trails publicly readable

**Impact**: 🟡 **MEDIUM**
- Information disclosure
- Attack surface mapping
- Internal architecture exposed

---

## Recommendations

### Priority 1: Implement Authentication (CRITICAL)

**Action**: Add JWT authentication to all sensitive endpoints

**Approach**:
```python
# Apply to all workflow, candidate, and governance routes
@router.post("/workflows")
async def create_workflow(
    request: CreateWorkflowRequest,
    user: dict = Depends(get_current_user),  # ← Add this
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
):
    # Extract requester_id from authenticated user
    request.requester_id = user["user_id"]
    # ... rest of implementation
```

**Endpoints to Protect**:
1. All `/workflows/*` endpoints
2. All `/candidates/*` endpoints (except maybe classify/compare for internal use)
3. All `/approvals/*` endpoints
4. Contract endpoints (replace placeholder with real auth)

---

### Priority 2: Replace Placeholder Auth (HIGH)

**Action**: Replace `verify_auth()` in `contract.py` with real JWT validation

**Current**:
```python
async def verify_auth(authorization: Optional[str] = Header(None)) -> str:
    # Placeholder: accepts any token >= 8 characters
    user_id = f"user-{token[:8]}"
    return user_id
```

**Recommended**:
```python
async def verify_auth(
    authorization: str = Header(...),
    user: dict = Depends(get_current_user)
) -> str:
    return user["user_id"]
```

---

### Priority 3: Enforce Ownership at Auth Layer (HIGH)

**Action**: Move ownership checks from business logic to auth dependencies

**Current Pattern**:
```python
# Ownership check in route handler
workflow = await governance_service.get_workflow(workflow_id)
if workflow.requester_id != user_id:
    raise HTTPException(status_code=403, detail="Access denied")
```

**Recommended Pattern**:
```python
# Create ownership-checking dependency
async def verify_workflow_owner(
    workflow_id: str,
    user: dict = Depends(get_current_user),
    governance_service: WorkflowGovernanceService = Depends(get_governance_service)
) -> dict:
    workflow = await governance_service.get_workflow(workflow_id)
    if workflow.requester_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not workflow owner")
    return workflow

# Use in routes
@router.post("/workflows/{workflow_id}/transition")
async def transition_workflow(
    workflow_id: str,
    workflow: dict = Depends(verify_workflow_owner),  # ← Ownership enforced here
    request: TransitionRequest
):
    # ... implementation
```

---

### Priority 4: Protect Read Endpoints (MEDIUM)

**Action**: Add authentication to snapshot and evidence endpoints

**Consideration**: Determine if these should be:
- Public (current state)
- Authenticated only
- Role-based (e.g., require `repository_viewer` role)

**Recommendation**: At minimum, require authentication to prevent abuse and track usage

---

### Priority 5: RBAC Expansion (MEDIUM)

**Action**: Define additional roles for non-contract operations

**Current Roles**: `contract_admin`, `contract_reviewer`, `contract_viewer`

**Recommended Additional Roles**:
- `workflow_owner` - Create/manage own workflows
- `workflow_admin` - Manage all workflows
- `approver` - Approve placements (distinct from submitter)
- `repository_viewer` - View snapshots/evidence
- `system_admin` - Full access

---

### Priority 6: Audit Trail Enhancement (LOW)

**Action**: Log authenticated user for all operations

**Current**: Operations log `triggered_by`, `decidedBy` (client-provided)

**Recommended**: Log from JWT token (`user["user_id"]`) after authentication

---

## Testing Recommendations

### Security Test Cases

1. **Test: Unauthenticated Access**
   - Attempt workflow creation without Authorization header
   - Expected: 401 Unauthorized (currently: 200 OK ❌)

2. **Test: Invalid Token**
   - Send request with malformed JWT
   - Expected: 401 Unauthorized

3. **Test: Ownership Enforcement**
   - User A creates workflow
   - User B attempts to modify workflow
   - Expected: 403 Forbidden

4. **Test: Self-Approval Prevention**
   - User creates workflow
   - Same user attempts to approve
   - Expected: 403 Forbidden (currently works if identity strings differ ❌)

5. **Test: Token Expiration**
   - Use expired JWT token
   - Expected: 401 Unauthorized

6. **Test: RBAC Enforcement**
   - User with `contract_viewer` role attempts to create contract
   - Expected: 403 Forbidden

---

## Compliance Considerations

### Separation of Duties

**Requirement**: Submitter ≠ Approver

**Current State**: 
- ✅ Implemented in business logic
- ❌ Not enforced at auth layer
- ❌ Can be bypassed with identity spoofing

**Required**: Authentication + business logic enforcement

---

### Audit Trail Integrity

**Requirement**: Tamper-proof audit logs with verified identities

**Current State**:
- ✅ State transitions logged
- ❌ User identities not verified (client-provided)
- ⚠️ Audit trail accessible without auth

**Required**: JWT-verified identities in audit logs

---

### Data Access Controls

**Requirement**: Users can only access their own workflows/candidates

**Current State**:
- ❌ No access controls
- ❌ All workflows visible to everyone
- ❌ Anyone can read/modify any resource

**Required**: Row-level security based on `requester_id`

---

## Conclusion

The project-ai service has **comprehensive business logic for governance and security**, but lacks **authentication enforcement at the API layer**. This creates a critical security gap where:

1. All workflows, candidates, and approvals are publicly accessible
2. Self-approval prevention can be bypassed via identity spoofing
3. Ownership and access controls are not enforced
4. Repository intelligence is exposed without authentication

**Overall R4 Authentication Status**: 🔴 **CRITICAL - 94.6% of endpoints unprotected**

### Immediate Actions Required

1. ✅ Add `Depends(get_current_user)` to all sensitive endpoints
2. ✅ Replace placeholder auth in contract routes with real JWT validation
3. ✅ Extract `requester_id` from JWT token (not request body)
4. ✅ Add ownership-checking dependencies for resource access
5. ✅ Protect repository intelligence endpoints (snapshot/evidence)

### Timeline Recommendation

- **Phase 1 (Immediate)**: Auth on workflows, candidates, governance routes
- **Phase 2 (Short-term)**: Replace placeholder auth, add ownership checks
- **Phase 3 (Medium-term)**: RBAC expansion, audit trail enhancement
- **Phase 4 (Long-term)**: Advanced access controls, rate limiting, API keys

---

## Appendix: Authentication Dependency Usage

### Available Auth Dependencies

From `app/auth/dependencies.py`:

```python
# Extract user from JWT token
user: dict = Depends(get_current_user)
# Returns: {"user_id": str, "roles": list}

# Require specific roles
admin: dict = Depends(require_contract_admin)
reviewer: dict = Depends(require_contract_reviewer)
viewer: dict = Depends(require_contract_viewer)
```

### Example Implementation

**Before (No Auth)**:
```python
@router.post("/workflows")
async def create_workflow(request: CreateWorkflowRequest):
    workflow = await governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=request.requester_id,  # ❌ Client-provided
        purpose=request.purpose
    )
    return workflow
```

**After (With Auth)**:
```python
@router.post("/workflows")
async def create_workflow(
    request: CreateWorkflowRequest,
    user: dict = Depends(get_current_user)  # ✅ JWT-verified
):
    workflow = await governance_service.create_workflow(
        target_family=request.target_family,
        target_version=request.target_version,
        requester_id=user["user_id"],  # ✅ Verified from JWT
        purpose=request.purpose
    )
    return workflow
```

---

**End of Report**

*Generated by Security Audit Agent - R4 Authentication Status Audit*  
*Branch: m2-project-ai-canonical-wiring*  
*Workspace: e:/onlinewebsites/quiz-platform*
