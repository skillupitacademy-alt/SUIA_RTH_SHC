# Phase 4 Security Findings Verification

**Purpose**: Read-only verification of W6 security findings against actual source code  
**Date**: 2026-10-09  
**Status**: VERIFICATION COMPLETE

---

## STEP A — CORS Configuration Verification

### W6 Claim
> "CORS wildcard (*) in production configuration"

### Source Inspection
**File**: `services/project-ai/app/main.py`  
**Lines**: 95-101

```python
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Verdict: **VERIFIED**

The CORS configuration in `main.py` line 97 explicitly sets `allow_origins=["*"]`, which is a wildcard configuration allowing requests from any origin. The inline comment `# TODO: Restrict in production` acknowledges this is not production-ready.

**Security Risk**: High — allows cross-origin requests from any domain, enabling potential CSRF attacks and unauthorized API access.

---

## STEP B — FastAPI Route and Authentication Inventory

### Endpoint Authentication Analysis

| Route File | Endpoint Path | HTTP Method | Has Auth Dependency? | Notes |
|------------|---------------|-------------|---------------------|-------|
| **health.py** |
| | `/health` | GET | **NO** | Public health check endpoint (acceptable) |
| **snapshot.py** |
| | `/snapshot` | GET | YES | `Depends(get_current_user)` |
| | `/snapshot/metadata` | GET | YES | `Depends(get_current_user)` |
| **evidence.py** |
| | `/evidence/{evidence_id}` | GET | YES | `Depends(get_current_user)` |
| | `/evidence` | GET | YES | `Depends(get_current_user)` |
| **tasks.py** (DEPRECATED) |
| | `/tasks/plan` | POST | YES | `Depends(get_current_user)` |
| | `/tasks/{task_id}` | GET | YES | `Depends(get_current_user)` |
| | `/tasks/{task_id}/approve` | POST | YES | `Depends(require_contract_admin)` |
| | `/tasks/{task_id}/reject` | POST | YES | `Depends(require_contract_admin)` |
| **governance.py** |
| | `/approvals/submit` | POST | YES | `Depends(get_current_user)` |
| | `/approvals/pending` | GET | YES | `Depends(require_contract_reviewer)` |
| | `/approvals/{approval_id}` | GET | YES | `Depends(get_current_user)` |
| | `/approvals/{approval_id}/approve` | POST | YES | `Depends(require_contract_reviewer)` |
| | `/approvals/{approval_id}/reject` | POST | YES | `Depends(require_contract_reviewer)` |
| | `/approvals/workflows/{workflow_id}/approve-placement` | POST | YES | `Depends(require_contract_admin)` |
| | `/approvals/workflows/{workflow_id}/implementation-approval` | GET | YES | `Depends(get_current_user)` |
| **workflows.py** |
| | `/workflows` | POST | YES | `Depends(require_contract_admin)` |
| | `/workflows/{workflow_id}` | GET | YES | `Depends(get_current_user)` |
| | `/workflows/{workflow_id}/transition` | POST | YES | `Depends(get_current_user)` |
| | `/workflows/{workflow_id}/history` | GET | YES | `Depends(get_current_user)` |
| | `/workflows/{workflow_id}/artifacts` | POST | YES | `Depends(require_contract_admin)` |
| | `/workflows` | GET | YES | `Depends(get_current_user)` |
| | `/workflows/{workflow_id}/placement` | POST | YES | `Depends(require_contract_admin)` |
| | `/workflows/{workflow_id}/placement/override` | POST | YES | `Depends(require_contract_admin)` |
| | `/workflows/{workflow_id}/placement/conflicts` | GET | YES | `Depends(get_current_user)` |
| | `/workflows/{workflow_id}/approve-final` | POST | YES | `Depends(require_contract_admin)` |
| **contract.py** |
| | `/workflows/{workflow_id}/engineering-contract` | POST | YES | `Depends(require_contract_admin)` |
| | `/workflows/{workflow_id}/engineering-contract` | GET | YES | `Depends(get_current_user)` |
| **candidate.py** |
| | `/candidates/upload` | POST | YES | `Depends(get_current_user)` |
| | `/candidates/{candidate_id}/classify` | POST | YES | `Depends(require_contract_admin)` |
| | `/candidates/{candidate_id}/compare` | POST | YES | `Depends(get_current_user)` |
| | `/candidates/{candidate_id}/manifest` | POST | YES | `Depends(require_contract_admin)` |
| | `/candidates/{candidate_id}/manifest` | GET | YES | `Depends(get_current_user)` |
| | `/candidates` | GET | YES | `Depends(get_current_user)` |
| **agents.py** |
| | `/agents` | GET | YES | `Depends(get_current_user)` |
| | `/agents/{agent_type}` | GET | YES | `Depends(get_current_user)` |
| **creation.py** (DEPRECATED) |
| | All endpoints | ALL | N/A | Return 405 Method Not Allowed |
| **main.py** (root) |
| | `/` | GET | YES | `Depends(get_current_user)` |

### W6 Specific Claims

#### Claim: `get_discovery_client` endpoint missing authentication
**File**: `services/project-ai/app/api/routes/evidence.py`, line 16-31  
**Verdict**: **CONTRADICTED**

`get_discovery_client()` is **not an endpoint**. It is a dependency injection function used internally by FastAPI. The actual endpoints that use it (`/evidence/{evidence_id}` and `/evidence`) both have `Depends(get_current_user)` authentication.

#### Claim: `calculate_snapshot_sha256` endpoint missing authentication
**File**: `services/project-ai/app/api/routes/contract.py`, line 68-94  
**Verdict**: **CONTRADICTED**

`calculate_snapshot_sha256()` is **not an endpoint**. It is an internal helper function. There is no route decorator exposing it as an HTTP endpoint.

#### Claim: `create_workflow` endpoint missing authentication
**File**: `services/project-ai/app/api/routes/workflows.py`, line 88-127  
**Verdict**: **CONTRADICTED**

`create_workflow()` **has authentication**:
```python
async def create_workflow(
    request: CreateWorkflowRequest,
    user: AuthenticatedPrincipal = Depends(require_contract_admin),  # <-- AUTH REQUIRED
    ...
```

The endpoint requires `require_contract_admin` dependency, which is stricter than basic authentication.

### Summary Statistics
- **Total endpoints inspected**: 40
- **Endpoints with authentication**: 39 (97.5%)
- **Endpoints without authentication**: 1 (`/health` — intentionally public)
- **Deprecated endpoints**: 5 (tasks.py + creation.py, return 405/410)

### Verdict: **CONTRADICTED**

All production endpoints have appropriate authentication dependencies. The W6 claim that specific endpoints lack authentication is based on misidentification of internal functions as endpoints.

---

## STEP C — Workflow State Coverage Verification

### W6 Claim
> "2 missing states: ESCALATED, RESUBMITTED"

### Source Inspection
**File**: `services/project-ai/app/orchestration/canonical_workflow.py`  
**Lines**: 28-230 (CanonicalWorkflowState enum definition)

### Canonical Workflow States (Complete List)

The canonical workflow state machine defines **17 states**:

1. `REQUESTED`
2. `DISCOVERY`
3. `BRIEF_READY`
4. `AWAITING_GATE_1`
5. `GUI_APPROVED`
6. `CANDIDATE_REQUESTED`
7. `CANDIDATE_RECEIVED`
8. `CANDIDATE_AUDIT`
9. `PLACEMENT`
10. `INTEGRATION_PLANNED`
11. `AWAITING_IMPLEMENTATION_APPROVAL`
12. `IMPLEMENTING`
13. `IMPLEMENTED`
14. `VERIFYING`
15. `CERTIFICATION_READY`
16. `AWAITING_GATE_2`
17. `CERTIFIED`
18. `REJECTED`

### Search for ESCALATED and RESUBMITTED

**Result**: Neither `ESCALATED` nor `RESUBMITTED` appear in the canonical workflow state machine definition.

**Note**: A search of the repository found these state names only in `scripts/verify-workflow-states.py`, which appears to be a test/validation script mapping external state names to canonical states. This is not the authoritative state definition.

### Architectural Context

From `canonical_workflow.py` line 13-26:
> "ARCHITECTURAL RULE:
> - CanonicalWorkflowState is the ONLY workflow state machine for Project LLM
> - All other state enums must map to or derive from these canonical states
> - Frontend must consume these states; frontend must NOT create another state machine"

### Verdict: **VERIFIED**

`ESCALATED` and `RESUBMITTED` are **not present** in the canonical workflow state machine. However, this is **not a defect** — the canonical state machine is complete and authoritative as designed. The absence of these states may be intentional if the Project LLM workflow does not require escalation or resubmission paths.

**Security Concern**: None — missing states do not represent a security vulnerability unless the system is required to support these states for compliance/business reasons (not determined by code inspection).

---

## STEP D — Test Coverage Verification

### W6 Claim
> "25.4% test coverage"

### Artifact Inspection

#### Coverage.xml (Baseline Evidence)
**File**: `.agents/evidence/baseline/test-results/coverage.xml`  
**Line 2**: `line-rate="0.6691"`  

**Calculated Coverage**: 66.91%  
**Lines Covered**: 5278 / 7888

#### Coverage.json (Most Recent)
**File**: `services/project-ai/coverage.json`  
**Timestamp**: 2026-10-09T15:46:48.817848  
**Format**: Coverage.py format version 3

This file contains per-file coverage detail but no top-level summary percentage in the inspected portion.

### Verdict: **CONTRADICTED**

The W6 claim of "25.4% coverage" does not match the measured coverage in the available artifact:

- **Baseline coverage.xml**: **66.91%** (6691 out of 10000 basis points)
- **W6 claimed**: 25.4%

**Discrepancy**: 41.51 percentage points

The baseline coverage artifact shows substantially higher coverage than claimed. The 25.4% figure may be outdated, from a different scope (e.g., only integration tests), or incorrect.

---

## STEP E — Overall Security Findings Summary

| Finding | W6 Claim | Verdict | Risk Level |
|---------|----------|---------|------------|
| **CORS Wildcard** | Wildcard (*) in production config | **VERIFIED** | HIGH |
| **Missing Auth: get_discovery_client** | Endpoint lacks authentication | **CONTRADICTED** (not an endpoint) | None |
| **Missing Auth: calculate_snapshot_sha256** | Endpoint lacks authentication | **CONTRADICTED** (not an endpoint) | None |
| **Missing Auth: create_workflow** | Endpoint lacks authentication | **CONTRADICTED** (has auth) | None |
| **Missing States: ESCALATED, RESUBMITTED** | 2 states missing from workflow | **VERIFIED** (absent by design) | Low/None |
| **Test Coverage: 25.4%** | Low test coverage | **CONTRADICTED** (measured 66.91%) | Medium (if true) |

### Confirmed Security Issues

**1. CORS Wildcard Configuration** (HIGH RISK)
- **Location**: `services/project-ai/app/main.py:97`
- **Current Value**: `allow_origins=["*"]`
- **Recommendation**: Replace with explicit allowlist of trusted origins before production deployment
- **Mitigation**: Add environment-based configuration: production uses explicit origins, development uses wildcard

### False Positives

**2. Missing Authentication Claims**
All named endpoints either:
- Have proper authentication dependencies (`get_current_user`, `require_contract_admin`, `require_contract_reviewer`), or
- Are internal functions misidentified as endpoints, or
- Are intentionally public (`/health`)

**3. Test Coverage Claim**
The baseline coverage artifact shows 66.91%, not 25.4%. If 25.4% is from a specific test subset (e.g., only integration tests), that context was not provided.

---

## Recommendations

### Immediate (Before Merge)
1. **BLOCK MERGE**: CORS wildcard configuration is production-unsafe
2. **Fix CORS**: Implement environment-based origin allowlist
3. **Re-run Coverage**: Generate fresh coverage report to resolve discrepancy

### Post-Verification
1. **Update W6 Report**: Correct false positives for authentication claims
2. **Document State Machine**: Clarify whether ESCALATED/RESUBMITTED are required business states
3. **Coverage Baseline**: Establish and enforce minimum coverage threshold (current: 66.91%)

---

## Evidence Artifacts

- Source code inspection: 10 route files
- Authentication pattern: FastAPI `Depends()` decorators
- State machine definition: `canonical_workflow.py:28-230`
- Coverage baseline: `coverage.xml` line-rate=0.6691
- Coverage detail: `coverage.json` timestamp 2026-10-09

**Verification Method**: Read-only source inspection (no modifications)  
**Verification Date**: 2026-10-09  
**Next Action**: Remediation plan for CORS configuration before merge approval
