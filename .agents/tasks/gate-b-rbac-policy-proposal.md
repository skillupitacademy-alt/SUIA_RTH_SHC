# Gate B: Route-to-Role RBAC Policy Proposal

**Project:** Quiz Platform - Project AI Service  
**Branch:** m2-project-ai-canonical-wiring  
**Date:** 2024  
**Status:** Policy Design (No Implementation)

---

## Executive Summary

This document defines the comprehensive Role-Based Access Control (RBAC) policy for all 40 registered routes in the Project AI service. The policy enforces three security principles:

1. **Tenant Isolation** - Brand boundary enforcement via `verify_brand_access`
2. **Role-Based Authorization** - Four-tier role hierarchy with minimum required roles per operation
3. **Separation of Duties** - Prevention of self-approval in governance operations

The analysis identified **3 security gaps** requiring immediate attention and **2 policy decisions** requiring owner input.

---

## Role Hierarchy

The system implements a four-tier role hierarchy where higher roles inherit permissions from lower roles:

```
super_admin (bypass all restrictions)
    ↓
contract_admin (create workflows, approve, bind artifacts)
    ↓
contract_reviewer (approve manifests, view approval queue)
    ↓
contract_viewer (read-only access to contract workflows)
    ↓
authenticated (basic read-own operations)
```

### Role Definitions

| Role | Purpose | Key Permissions |
|------|---------|----------------|
| **super_admin** | Infrastructure operators and platform administrators | Bypass all brand checks, bypass all role checks, access unclassified resources |
| **contract_admin** | Workflow governance administrators | Create workflows, bind artifacts, approve placements, final certifications, state transitions |
| **contract_reviewer** | Approval reviewers | Approve/reject manifests, view approval queue, participate in governance |
| **contract_viewer** | Read-only observers | View workflows, manifests, evidence within their brand |
| **authenticated** | Basic authenticated users | Upload candidates, submit for approval, read own records |

---

## Classification Framework

### Public Operations (No Authentication)

**Policy:** No authentication required. Available to monitoring systems and health checks.

**Routes:**
- `GET /health` - Health check endpoint

**Rationale:** Health checks must be available for load balancers and monitoring systems without authentication overhead.

---

### Authenticated Read Operations (get_current_user)

**Policy:** Requires valid JWT token. User can read their own records and records within their brand boundary.

**Routes:**
- `GET /` - Root endpoint showing authenticated user context
- `GET /snapshot` - Read snapshot data
- `GET /snapshot/metadata` - Read snapshot metadata
- `GET /evidence/{evidence_id}` - Read evidence records
- `GET /evidence` - List all evidence
- `GET /tasks/{task_id}` - Read task status
- `GET /approvals/{approval_id}` - Read approval status
- `GET /approvals/workflows/{workflow_id}/implementation-approval` - Read implementation approval evidence
- `GET /workflows/{workflow_id}` - Read workflow state
- `GET /workflows/{workflow_id}/history` - Read audit trail
- `GET /workflows` - List workflows
- `GET /workflows/{workflow_id}/placement/conflicts` - Read placement conflicts
- `GET /workflows/{workflow_id}/engineering-contract` - Read engineering contract
- `GET /agents` - List available agents (platform-wide configuration)
- `GET /agents/{agent_type}` - Read agent configuration (platform-wide configuration)
- `GET /candidates/{candidate_id}/manifest` - Read placement manifest
- `POST /candidates/{candidate_id}/compare` - Compare candidate to canonical (analysis operation)

**Brand Check:** Required for all tenant-scoped data. Not required for platform-wide configuration (agents).

**Rationale:** Basic authenticated users need read access to monitor their workflows and understand system state. Brand isolation prevents cross-tenant data leakage.

---

### Tenant-Scoped Create Operations (get_current_user + brand check)

**Policy:** Authenticated users can create records within their brand boundary.

**Routes:**
- `POST /approvals/submit` - Submit manifest for approval
- `POST /candidates/upload` - Upload candidate package

**Brand Check:** Yes - enforce brand ownership on created records.

**Rationale:** Users should be able to initiate work (upload candidates, submit for approval) within their tenant without requiring privileged roles. The work then enters a governance workflow requiring higher roles to progress.

---

### Privileged Mutations (require specific role)

**Policy:** Requires `contract_admin` role (or higher in hierarchy). Mutations that create binding decisions, state transitions, or bind artifacts.

**Routes:**
- `POST /tasks/plan` - Initiate workflow (admin-only)
- `POST /tasks/{task_id}/reject` - Reject task (admin-only)
- `POST /workflows` - Create new workflow (admin-only)
- `POST /workflows/{workflow_id}/artifacts` - Bind artifact with integrity hash (admin-only)
- `POST /workflows/{workflow_id}/placement` - Create placement decision (admin-only)
- `POST /workflows/{workflow_id}/engineering-contract` - Create engineering contract (admin-only)
- `POST /candidates/{candidate_id}/classify` - Classify candidate (admin-only)
- `POST /candidates/{candidate_id}/manifest` - Generate placement manifest (admin-only)

**Brand Check:** Yes - all operations are tenant-scoped.

**Rationale:** These operations create binding decisions, consume resources, or alter system state in ways that require governance oversight. Limiting to `contract_admin` ensures accountability and prevents unauthorized mutations.

---

### Approval/Governance (require role + separation of duties)

**Policy:** Requires `contract_reviewer` (for manifest approvals) or `contract_admin` (for workflow approvals). **Enforces separation of duties** - approver must not be the submitter/requester.

**Routes:**
- `POST /approvals/{approval_id}/approve` - Approve manifest (reviewer role + different submitter)
- `POST /approvals/{approval_id}/reject` - Reject manifest (reviewer role)
- `POST /tasks/{task_id}/approve` - Approve task (admin role + different requester)
- `POST /approvals/workflows/{workflow_id}/approve-placement` - Approve placement manifest (admin role + different requester + hash verification)
- `POST /workflows/{workflow_id}/approve-final` - Final certification gate (admin role + different requester + evidence verification)

**Brand Check:** Yes - approvals are tenant-scoped.

**Separation of Duties:** Yes - prevent self-approval by comparing `approved_by` to `submitted_by` or `workflow.requester_id`.

**Additional Checks:**
- Hash verification: Manifest hash must match stored hash (prevent TOCTOU attacks)
- Evidence verification: All gates must pass before final certification

**Rationale:** Approval operations are governance gates that enforce separation of duties. A user cannot approve their own work. Hash verification prevents time-of-check-time-of-use attacks where a manifest is modified between submission and approval.

---

### Override/Emergency (require_contract_admin + reason + audit)

**Policy:** Requires `contract_admin` role. Mandatory `reason` field for audit trail. Used for manual interventions and conflict resolution.

**Routes:**
- `POST /workflows/{workflow_id}/placement/override` - Manual placement override (admin role + mandatory reason)

**Brand Check:** Yes - overrides are tenant-scoped.

**Separation of Duties:** Recommended - should verify override is not for user's own submission.

**Rationale:** Manual overrides bypass automated placement logic and represent emergency interventions. Requiring a mandatory reason creates an audit trail for compliance review.

---

### Approval Queue Visibility

**Policy:** Only `contract_reviewer` and `contract_admin` can see the approval queue.

**Routes:**
- `GET /approvals/pending` - List pending approvals (reviewer role or higher)

**Rationale:** The approval queue contains sensitive governance data. Only users who can act on approvals (reviewers and admins) should see the queue.

---

## Super-Admin Bypass Boundaries

### Operations Super-Admin CAN Bypass

1. **Brand Boundary Checks** - Super-admin can access any brand's resources
2. **Role Checks** - Super-admin can perform operations requiring any role (contract_admin, contract_reviewer, contract_viewer)
3. **Unclassified Resource Access** - Super-admin can access resources with `brand=None`

**Implementation:** `is_super_admin()` returns `True` for:
- Users with `super_admin` role
- Users with `portal_identity == 'super_admin'`
- Users with `portal_identity == 'infrastructure'`

**Audit Requirement:** All super-admin bypasses are logged with `logger.debug()`.

### Operations Super-Admin CANNOT Bypass (Never Bypassable)

These operations maintain their enforcement even for super-admin to preserve system integrity:

1. **Separation of Duties (Self-Approval Prevention)**
   - Super-admin still cannot approve their own workflow
   - Reason: Separation of duties is a compliance requirement, not a permission boundary
   - Routes affected: All approval endpoints

2. **Hash Verification**
   - Manifest hash verification still enforced
   - Reason: Integrity verification protects against TOCTOU attacks regardless of role
   - Routes affected: `/approvals/{approval_id}/approve`, `/approvals/workflows/{workflow_id}/approve-placement`

3. **Evidence Verification for Final Certification**
   - Gate results must all be PASS before certification
   - Reason: Certification represents compliance attestation; cannot be bypassed
   - Routes affected: `/workflows/{workflow_id}/approve-final`

4. **Audit Trail Integrity**
   - Super-admin cannot delete or modify audit trail entries
   - Reason: Audit immutability is regulatory requirement
   - Implementation: Audit trail is append-only

5. **State Machine Transitions**
   - Invalid state transitions are rejected for all users including super-admin
   - Reason: State machine integrity prevents corrupted workflow state
   - Routes affected: `/workflows/{workflow_id}/transition`

**Rationale:** These boundaries prevent super-admin from accidentally creating compliance violations or data integrity issues. Even infrastructure operators must follow governance rules that exist for regulatory compliance.

---

## Security Gaps Identified

### Gap 1: Unauthenticated Route with Mutations (CRITICAL)

**Route:** `/creation/workflows` (POST)  
**Current Auth:** `none`  
**Issue:** Allows unauthenticated workflow creation

**Status:** ✅ RESOLVED - Endpoint is deprecated and returns 405 Method Not Allowed. No security risk.

---

### Gap 2: State Transition Role Policy Undefined (NEEDS DECISION)

**Route:** `/workflows/{workflow_id}/transition` (POST)  
**Current Auth:** `get_current_user` (authenticated only)  
**Issue:** Some state transitions require governance approval (e.g., AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING), but no role enforcement exists at the route level.

**Current Implementation:** Governance enforcement happens inside `WorkflowGovernanceService.transition_state()` which checks for approval records, but there's no route-level role check.

**Options:**
1. **Keep current design** - Rely on service-layer governance checks (approval record must exist for IMPLEMENTING transition)
2. **Add route-level role check** - Change dependency to `require_contract_admin` 
3. **Transition-specific role mapping** - Add middleware to inspect `to_state` and enforce role based on transition type

**Recommendation:** Option 1 (keep current design) with enhanced documentation. The service layer already enforces governance via approval records. Adding route-level role checks would create redundant authorization logic.

**Action Required:** Document that certain transitions (IMPLEMENTING, CERTIFIED) require prior approval records, which themselves require admin role.

---

### Gap 3: Placement Override Missing Separation of Duties Check

**Route:** `/workflows/{workflow_id}/placement/override` (POST)  
**Current Auth:** `get_current_user`  
**Issue:** Manual placement override has no separation of duties check to prevent users from overriding their own placements.

**Risk:** User creates workflow → creates placement → overrides their own placement with different manifest.

**Recommendation:** Add separation of duties check comparing `user.user_id` to `workflow.requester_id` and reject if they match.

**Implementation Note:** Currently marked as `NEEDS_DECISION` in matrix with recommendation for separation of duties.

---

## NEEDS DECISION Items

### Decision 1: State Transition Role Policy

**Issue:** Should `/workflows/{workflow_id}/transition` require role-based authorization at the route level, or rely on service-layer governance checks?

**Context:** 
- Some transitions are informational (REQUESTED → DISCOVERY)
- Some transitions are governance gates (AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING)
- Service layer already enforces approval record requirements for sensitive transitions

**Options:**
1. **Status quo:** Keep `get_current_user` and rely on service-layer checks
2. **Uniform admin:** Change to `require_contract_admin` for all transitions
3. **Transition-specific:** Create middleware to enforce role based on target state

**Owner Input Required:** Which approach aligns with intended governance model?

---

### Decision 2: Placement Override Separation of Duties

**Issue:** Should manual placement overrides enforce separation of duties (prevent self-override)?

**Context:**
- Overrides bypass automated placement logic
- Current implementation requires `reason` field for audit trail
- No check that `approved_by ≠ workflow.requester_id`

**Options:**
1. **Enforce separation:** Reject override if user is workflow requester
2. **Allow self-override:** Trust audit trail (`reason` field) as sufficient governance
3. **Make configurable:** Add system setting to enable/disable self-override

**Recommendation:** Enforce separation (Option 1) for consistency with other approval operations.

**Owner Input Required:** Confirm separation of duties requirement for overrides.

---

## Test Coverage Requirements

Each route must have allow/deny test scenarios:

### Example Test Matrix for Approval Routes

| Route | Test Scenario | Expected Result |
|-------|--------------|-----------------|
| `POST /approvals/{approval_id}/approve` | Authenticated as contract_reviewer, approving someone else's manifest | 200 OK |
| `POST /approvals/{approval_id}/approve` | Authenticated as contract_reviewer, approving own manifest | 403 SELF_APPROVAL_REJECTED |
| `POST /approvals/{approval_id}/approve` | Authenticated as contract_viewer | 403 Forbidden (insufficient role) |
| `POST /approvals/{approval_id}/approve` | Unauthenticated | 401 Unauthorized |
| `POST /approvals/{approval_id}/approve` | Hash mismatch | 409 MANIFEST_CHANGED |
| `POST /approvals/{approval_id}/approve` | Cross-brand approval | 403 Forbidden (brand check) |
| `POST /approvals/{approval_id}/approve` | Super-admin bypassing role | 200 OK (but separation still enforced) |

### Test Categories by Operation Type

1. **Unauthenticated Access Tests**
   - Public routes should allow access
   - Protected routes should return 401

2. **Role-Based Access Tests**
   - Each role should access only permitted routes
   - Higher roles should inherit lower role permissions

3. **Brand Isolation Tests**
   - Same-brand access should succeed
   - Cross-brand access should fail with 403
   - Super-admin should bypass brand checks

4. **Separation of Duties Tests**
   - Self-approval attempts should fail with 403 SELF_APPROVAL_REJECTED
   - Different user approval should succeed

5. **Integrity Verification Tests**
   - Hash mismatch should fail with 409 MANIFEST_CHANGED
   - Hash match should succeed

6. **Super-Admin Bypass Tests**
   - Super-admin should bypass role checks
   - Super-admin should bypass brand checks
   - Super-admin should NOT bypass separation of duties
   - Super-admin should NOT bypass hash verification
   - Super-admin should NOT bypass evidence verification

---

## Implementation Roadmap

### Phase 1: Route-Level Authorization (Current State)

**Status:** ✅ Mostly Complete

- Authentication dependencies (`get_current_user`, `require_contract_admin`) in place
- Role hierarchy implemented in `dependencies.py`
- Super-admin bypass logic in `authorization.py`

**Remaining:**
- Add `require_contract_reviewer` and `require_contract_viewer` to applicable routes
- Update `/approvals/pending` to use `require_contract_reviewer`

---

### Phase 2: Brand Isolation Enforcement

**Status:** ✅ Complete

- `verify_brand_access()` implemented in `authorization.py`
- Brand boundary rules documented and enforced
- Unclassified resource protection (FEAT-002 fix) deployed

**Action Required:** Verify all tenant-scoped routes call `verify_brand_access()` after retrieving resources.

---

### Phase 3: Separation of Duties Enforcement

**Status:** ⚠️ Partially Complete

**Implemented:**
- Manifest approval: `approve_manifest()` checks `decided_by ≠ submitted_by`
- Placement approval: `approve_placement()` checks `approved_by ≠ workflow.requester_id`
- Final certification: `approve_final_certification()` enforces evidence verification

**Missing:**
- Task approval: `approve_task()` should check `approved_by ≠ task.requester_id`
- Placement override: Should check `override_by ≠ workflow.requester_id`

**Action Required:** Add separation of duties checks to remaining approval routes.

---

### Phase 4: Hash Verification and Integrity

**Status:** ✅ Complete

- Manifest hash verification in `approve_manifest()`
- Hash verification in `approve_placement()` (manifest_hash, contract_hash, candidate_sha256)
- Hash mismatch returns 409 MANIFEST_CHANGED or 409 CONTRACT_CHANGED

---

### Phase 5: Evidence Verification for Certification

**Status:** ✅ Complete

- Final gate controller (`FinalGateController`) computes verdict from gate results
- Evidence verification required before certification in `approve_final_certification()`
- Blocks approval if verdict ≠ CERTIFICATION_READY

---

## Audit and Compliance

### Audit Trail Requirements

All governance operations must log:
1. **Who** - User ID extracted from JWT token
2. **What** - Operation type (approve, reject, override, transition)
3. **When** - ISO 8601 timestamp with timezone
4. **Why** - Reason field (mandatory for rejections and overrides)
5. **Result** - Success or failure with reason

### Compliance Attestations

1. **Separation of Duties** - Self-approval prevention enforced via identity comparison
2. **Audit Immutability** - Audit trail is append-only, no deletion allowed
3. **Data Integrity** - Hash verification prevents TOCTOU attacks
4. **Tenant Isolation** - Brand boundary enforcement prevents cross-tenant access
5. **Role-Based Access** - Minimum required roles enforced per operation

---

## Appendix A: Route Inventory Summary

**Total Routes:** 40  
**Public Routes:** 1 (/health)  
**Deprecated Routes:** 4 (/creation/*)  
**Authenticated Routes:** 35  

**By Operation Type:**
- Read-only: 19
- Create: 8
- Update: 2
- Delete: 0
- State Transition: 3
- Approval: 7
- Override/Emergency: 1
- Deprecated: 4

**By Data Scope:**
- Public: 1
- Own records: 1
- Tenant/brand records: 33
- Platform-wide: 2
- Deprecated: 4

---

## Appendix B: Role Hierarchy Implementation

Current implementation in `app/auth/dependencies.py`:

```python
def require_contract_admin(user: AuthenticatedPrincipal = Depends(get_current_user)) -> AuthenticatedPrincipal:
    # Super admin bypass
    if is_super_admin(user):
        return user
    
    if "contract_admin" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Requires contract_admin role")
    
    return user
```

**Hierarchy enforcement:** Each role check function should allow higher roles:
- `require_contract_viewer` → allow viewer, reviewer, admin
- `require_contract_reviewer` → allow reviewer, admin (implemented)
- `require_contract_admin` → allow admin only (implemented)

---

## Appendix C: References

- Gate A Route Inventory: `e:\onlinewebsites\quiz-platform\.agents\evidence\baseline\route-inventory.csv`
- Authentication Dependencies: `services/project-ai/app/auth/dependencies.py`
- Authorization Logic: `services/project-ai/app/auth/authorization.py`
- JWT Token Types: `services/project-ai/app/auth/types.py`
- Workflow Governance Service: `services/project-ai/app/orchestration/workflow_governance.py`
- Governance Routes: `services/project-ai/app/api/routes/governance.py`
- Workflow Routes: `services/project-ai/app/api/routes/workflows.py`

---

**End of Policy Proposal**
