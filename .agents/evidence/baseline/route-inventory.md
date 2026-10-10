# Route Inventory - FastAPI Project AI Service

**Generated:** 2025-01-10  
**Service:** project-ai (FastAPI)  
**Total Routes:** 39

---

## Route Inventory Table

| Route Path | HTTP Method | Handler | Auth Dependency | Mutating | File |
|------------|-------------|---------|-----------------|----------|------|
| / | GET | root | get_current_user | false | app/main.py |
| /health | GET | health_check | none | false | app/api/routes/health.py |
| /snapshot | GET | get_snapshot | get_current_user | false | app/api/routes/snapshot.py |
| /snapshot/metadata | GET | get_snapshot_metadata | get_current_user | false | app/api/routes/snapshot.py |
| /evidence/{evidence_id} | GET | get_evidence_by_id | get_current_user | false | app/api/routes/evidence.py |
| /evidence | GET | get_all_evidence | get_current_user | false | app/api/routes/evidence.py |
| /tasks/plan | POST | create_planning_task | get_current_user | true | app/api/routes/tasks.py |
| /tasks/{task_id} | GET | get_task_status | get_current_user | false | app/api/routes/tasks.py |
| /tasks/{task_id}/approve | POST | approve_task | get_current_user | true | app/api/routes/tasks.py |
| /tasks/{task_id}/reject | POST | reject_task | get_current_user | true | app/api/routes/tasks.py |
| /approvals/submit | POST | submit_for_approval | get_current_user | true | app/api/routes/governance.py |
| /approvals/pending | GET | get_pending_approvals | get_current_user | false | app/api/routes/governance.py |
| /approvals/{approval_id} | GET | get_approval_status | get_current_user | false | app/api/routes/governance.py |
| /approvals/{approval_id}/approve | POST | approve_manifest | get_current_user | true | app/api/routes/governance.py |
| /approvals/{approval_id}/reject | POST | reject_manifest | get_current_user | true | app/api/routes/governance.py |
| /approvals/workflows/{workflow_id}/approve-placement | POST | approve_placement | require_contract_admin | true | app/api/routes/governance.py |
| /approvals/workflows/{workflow_id}/implementation-approval | GET | get_implementation_approval | get_current_user | false | app/api/routes/governance.py |
| /workflows | POST | create_workflow | require_contract_admin | true | app/api/routes/workflows.py |
| /workflows/{workflow_id} | GET | get_workflow | get_current_user | false | app/api/routes/workflows.py |
| /workflows/{workflow_id}/transition | POST | transition_workflow | get_current_user | true | app/api/routes/workflows.py |
| /workflows/{workflow_id}/history | GET | get_workflow_history | get_current_user | false | app/api/routes/workflows.py |
| /workflows/{workflow_id}/artifacts | POST | bind_artifact | get_current_user | true | app/api/routes/workflows.py |
| /workflows | GET | list_workflows | get_current_user | false | app/api/routes/workflows.py |
| /workflows/{workflow_id}/placement | POST | create_placement | get_current_user | true | app/api/routes/workflows.py |
| /workflows/{workflow_id}/placement/override | POST | override_placement | get_current_user | true | app/api/routes/workflows.py |
| /workflows/{workflow_id}/placement/conflicts | GET | list_placement_conflicts | get_current_user | false | app/api/routes/workflows.py |
| /workflows/{workflow_id}/approve-final | POST | approve_final_certification | require_contract_admin | true | app/api/routes/workflows.py |
| /workflows/{workflow_id}/engineering-contract | POST | create_engineering_contract | get_current_user | true | app/api/routes/contract.py |
| /workflows/{workflow_id}/engineering-contract | GET | get_engineering_contract | get_current_user | false | app/api/routes/contract.py |
| /agents | GET | list_agents | get_current_user | false | app/api/routes/agents.py |
| /agents/{agent_type} | GET | get_agent | get_current_user | false | app/api/routes/agents.py |
| /candidates/upload | POST | upload_candidate | get_current_user | true | app/api/routes/candidate.py |
| /candidates/{candidate_id}/classify | POST | classify_candidate | get_current_user | true | app/api/routes/candidate.py |
| /candidates/{candidate_id}/compare | POST | compare_candidate | get_current_user | true | app/api/routes/candidate.py |
| /candidates/{candidate_id}/manifest | POST | generate_manifest | get_current_user | true | app/api/routes/candidate.py |
| /candidates/{candidate_id}/manifest | GET | get_manifest | get_current_user | false | app/api/routes/candidate.py |
| /creation/workflows | POST | create_workflow | none | true | app/api/routes/creation.py |
| /creation/workflows/{workflow_id} | GET | get_workflow | none | false | app/api/routes/creation.py |
| /creation/workflows/{workflow_id}/validate | POST | validate_workflow | none | true | app/api/routes/creation.py |
| /creation/workflows/{workflow_id}/certify | POST | certify_workflow | none | true | app/api/routes/creation.py |

---

## Authentication Dependencies Summary

### Auth Dependency Types Found

- **get_current_user**: Requires valid JWT Bearer token, extracts full user identity
- **require_contract_admin**: Requires contract_admin role (privileged operations)
- **none**: No authentication required (public endpoint or deprecated endpoint)

### Authorization Boundaries

**require_contract_admin** protects these privileged operations:
- POST /workflows (workflow creation)
- POST /approvals/workflows/{workflow_id}/approve-placement (placement approval)
- POST /workflows/{workflow_id}/approve-final (final certification)

---

## Route Classification

### By Authentication

- **Protected Routes (require authentication)**: 35
- **Public Routes (no auth)**: 4 (all in /creation - DEPRECATED endpoints)

### By Mutation Type

- **Mutating Operations** (POST/PUT/PATCH/DELETE): 22
- **Read-Only Operations** (GET): 17

### By Security Sensitivity

**High Privilege (require_contract_admin):**
- POST /workflows
- POST /approvals/workflows/{workflow_id}/approve-placement
- POST /workflows/{workflow_id}/approve-final

**Standard Authenticated:**
- All other routes except /creation routes

**Deprecated/Public:**
- All /creation routes (return 405 Method Not Allowed)

---

## Critical Security Routes

### Approval Gates (require human authorization)

1. **POST /approvals/{approval_id}/approve** - Approve manifest (Wave 2)
   - Self-approval prevention
   - Manifest hash verification
   
2. **POST /approvals/workflows/{workflow_id}/approve-placement** - Approve placement (Wave 4)
   - Self-approval prevention (requester ≠ approver)
   - Manifest hash verification
   - Contract hash verification
   - Candidate SHA-256 verification
   - State machine enforcement (AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING/REJECTED)

3. **POST /workflows/{workflow_id}/approve-final** - Final certification (Gate 2/Gate 3)
   - Evidence verification (all gates PASS)
   - State machine enforcement (AWAITING_GATE_2 → CERTIFIED/REJECTED)

### Workflow State Mutations

- **POST /workflows** - Create workflow (requires require_contract_admin)
- **POST /workflows/{workflow_id}/transition** - Transition state
- **POST /workflows/{workflow_id}/artifacts** - Bind artifact with SHA-256

### Candidate Operations

- **POST /candidates/upload** - Upload candidate package
  - Workflow binding enforcement
  - SHA-256 computation server-side
  - State transition (CANDIDATE_REQUESTED → CANDIDATE_RECEIVED)
  
- **POST /candidates/{candidate_id}/manifest** - Generate placement manifest
  - Evidence-backed placement decision
  - Manifest hash computation

---

## Deprecated Endpoints

The following routes are **DEPRECATED** (M2.9 Wave 0) and return HTTP 405:

- POST /creation/workflows
- GET /creation/workflows/{workflow_id}
- POST /creation/workflows/{workflow_id}/validate
- POST /creation/workflows/{workflow_id}/certify

**Migration:** Use canonical workflow endpoints (/workflows, /candidates, /approvals)

---

## Notes

- **Total registered routers:** 10 (health, snapshot, evidence, tasks, governance, workflows, agents, candidate, creation, contract)
- **Architectural boundary:** Python READS TypeScript snapshots; does NOT scan repository directly
- **State machine:** All workflows follow CanonicalWorkflowState (17 states)
- **Security:** JWT Bearer token required for all authenticated routes
- **Hash verification:** Manifests, contracts, and candidates use SHA-256 for tamper detection
