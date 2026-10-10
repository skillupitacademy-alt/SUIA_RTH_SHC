# Gate B: W3C/W5 Requirements Specification

**Project:** Quiz Platform - Project AI Service  
**Branch:** m2-project-ai-canonical-wiring  
**Date:** 2026-01-30  
**Status:** Policy Definition (No Implementation)  
**Purpose:** Define comprehensive requirements for W3C Canonical Artifact Policy and W5 Placement Engine authorization consistency

---

## Executive Summary

This document defines the **complete requirements** for W3C Canonical Artifact Management and W5 Placement Engine Authorization Consistency. These two work streams are critical for ensuring:

1. **W3C:** Artifact deduplication, version conflict resolution, and provenance tracking
2. **W5:** Route-level RBAC consistency across all 40 routes in the system

**Key Principles:**
- **W3C:** Single source of truth for each artifact type; no duplicate artifacts
- **W5:** Every route in the 40-route RBAC matrix must have consistent authorization enforcement
- **Integration:** W3C canonical artifacts feed into W5 placement decisions
- **Compliance:** Both W3C and W5 are mandatory for W7 final gate certification

---

## Section 1: W3C Canonical Artifact Policy Requirements

### 1.1 Purpose and Scope

The W3C Canonical Artifact Policy ensures:
- **Artifact Deduplication:** Prevention of duplicate artifacts serving the same purpose
- **Version Conflict Resolution:** Clear policy for handling multiple versions of the same artifact
- **Provenance Tracking:** Full audit trail from artifact creation through certification
- **Discovery Efficiency:** Agents can quickly locate the canonical source of truth

**In Scope:**
- All documentation artifacts (plans, specifications, reports)
- All code artifacts (implementation files, test files, configuration)
- All evidence artifacts (test results, security scans, UBRC verification)
- All registry artifacts (route inventories, RBAC matrices, block corpus registries)

**Out of Scope:**
- User-generated content (quiz questions, user profiles)
- Runtime data (database records, cache entries)
- External dependencies (npm packages, Docker images)

### 1.2 Canonical Artifact Definition

A **canonical artifact** is:
1. The authoritative source of truth for a specific type of information
2. Referenced by all agents requiring that information
3. Updated in place rather than duplicated
4. Versioned through git history, not filename suffixes
5. Documented in the Canonical Artifacts Registry

**Example:** 
- ✅ Canonical: `.agents/tasks/gate-b-route-rbac-matrix.csv` (40-route RBAC mapping)
- ❌ Non-Canonical: `.agents/tasks/gate-b-route-rbac-matrix-v2.csv` (duplicate with version suffix)

### 1.3 Artifact Discovery Requirements

Before creating any new artifact, agents MUST:

1. **Search the repository** using file search tools
2. **Search the discovery snapshot** at `.agents/evidence/baseline/route-inventory.csv`
3. **Search evidence records** in `.agents/evidence/`
4. **Identify existing artifacts** serving the same or overlapping purpose
5. **Determine canonical artifact** from the Canonical Artifacts Registry

**Acceptance Criteria:**
- All agents include artifact discovery step in workflow logs
- No duplicate artifacts created when canonical version exists
- All new artifacts documented in Canonical Artifacts Registry within 24 hours

### 1.4 Duplicate Artifact Handling

**Policy:** When duplicate artifacts are detected:

1. **Identify versions:** Compare creation timestamps, content hashes, last-modified dates
2. **Determine canonical version:**
   - Most recent timestamp (if content is equivalent)
   - Most complete content (if timestamps are similar)
   - Most referenced by other artifacts (highest inbound references)
3. **Consolidate content:** Merge unique information from duplicates into canonical
4. **Deprecate duplicates:** Add deprecation header to non-canonical versions
5. **Update references:** Redirect all references to canonical version
6. **Archive duplicates:** Move to `.agents/archive/duplicates/` with consolidation reason

**Deprecation Header Format:**
```markdown
# [DEPRECATED] This artifact is deprecated

**Canonical Version:** `.agents/tasks/canonical-artifact-name.md`  
**Deprecation Date:** 2026-01-30  
**Reason:** Duplicate of canonical artifact. Content consolidated.  
**Action Required:** Use canonical version for all references.
```

**Acceptance Criteria:**
- No active duplicate artifacts in `.agents/tasks/` or `.agents/policies/`
- All deprecated artifacts include deprecation header
- All references updated to point to canonical version

### 1.5 Version Conflict Resolution Policy

**Scenario:** Multiple versions of the same artifact exist with conflicting information.

**Resolution Process:**

1. **Identify conflict type:**
   - **Content Conflict:** Different data in same fields (e.g., two RBAC matrices with different role assignments for same route)
   - **Schema Conflict:** Different structure/format (e.g., CSV vs JSON)
   - **Temporal Conflict:** Newer version contradicts older version

2. **Apply resolution rules:**
   - **For Content Conflicts:** Most recent timestamp wins IF content is internally consistent
   - **For Schema Conflicts:** Format specified in canonical artifact registry wins
   - **For Temporal Conflicts:** Newer version supersedes older version UNLESS newer version is incomplete

3. **Validation checks:**
   - Internal consistency: No contradictions within the winning version
   - External consistency: No contradictions with dependent artifacts
   - Completeness: Winning version has all required fields/sections

4. **Conflict resolution verdict:**
   - `RESOLVED_CANONICAL` - One version declared canonical, others archived
   - `RESOLVED_MERGE` - Unique information from all versions merged into canonical
   - `UNRESOLVED_ESCALATE` - Conflict requires human decision (logged to `.agents/evidence/artifact-conflicts.jsonl`)

**Acceptance Criteria:**
- All version conflicts documented in conflict log
- Resolution verdict recorded with rationale
- Winning version meets completeness and consistency checks
- Losing versions archived with conflict resolution metadata

### 1.6 Artifact Provenance Tracking Requirements

Every canonical artifact MUST include provenance metadata:

**Metadata Structure:**
```yaml
---
artifact_type: route_rbac_matrix
canonical_path: .agents/tasks/gate-b-route-rbac-matrix.csv
created_by: gate-b-rbac-agent
created_at: 2026-01-29T10:00:00Z
last_modified_by: gate-b-remediation-agent
last_modified_at: 2026-01-30T08:00:00Z
version_control: git
artifact_sha256: abc123...
supersedes: null
superseded_by: null
references:
  - .agents/evidence/baseline/route-inventory.csv
  - .agents/tasks/gate-d-plan.md
referenced_by:
  - .agents/tasks/gate-b-w3c-w5-requirements.md
  - .agents/tasks/gate-b-w7-evidence-contract.md
---
```

**Provenance Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artifact_type` | string | Yes | Type identifier from artifact registry |
| `canonical_path` | string | Yes | Absolute path within repository |
| `created_by` | string | Yes | Agent or user who created the artifact |
| `created_at` | ISO 8601 | Yes | Creation timestamp (UTC) |
| `last_modified_by` | string | Yes | Agent or user who last modified |
| `last_modified_at` | ISO 8601 | Yes | Last modification timestamp (UTC) |
| `version_control` | string | Yes | Always `git` for code artifacts |
| `artifact_sha256` | string | Yes | SHA-256 hash of artifact content |
| `supersedes` | string | No | Path to previous canonical version (if any) |
| `superseded_by` | string | No | Path to newer canonical version (if superseded) |
| `references` | array | No | Artifacts this artifact depends on |
| `referenced_by` | array | No | Artifacts that depend on this artifact |

**Acceptance Criteria:**
- All canonical artifacts include provenance metadata
- Provenance metadata updated on every modification
- SHA-256 hash computed automatically on save
- Reference graph maintained in `.agents/evidence/artifact-graph.json`

### 1.7 Reference to Canonical Artifact Policy

This specification extends and implements the **Canonical Artifact Policy** defined in:
`.agents/policies/canonical-artifact-policy.md`

**Core Rule from Policy:**
> Before creating any new file, document, plan, specification, registry, report, test, configuration, or implementation artifact:
> 1. Search the repository
> 2. Search the current discovery snapshot
> 3. Search the evidence records
> 4. Identify existing artifacts serving the same purpose
> 5. Identify which artifact is canonical
> 6. Prefer updating/extending the canonical artifact
> 7. Create a new artifact ONLY when no suitable canonical artifact exists OR architecture explicitly requires a distinct artifact

**W3C Implementation:**
- All agents MUST reference canonical artifact policy before creating files
- All new artifacts MUST be justified in creation rationale
- All artifact creation logged to `.agents/evidence/artifact-creation.jsonl`

### 1.8 W3C Policy Compliance Acceptance Criteria

**AC-W3C-001: Artifact Discovery**
- ✅ All agents search for existing artifacts before creating new ones
- ✅ Search results logged to workflow evidence
- ✅ Justification provided for all new artifact creation

**AC-W3C-002: Duplicate Prevention**
- ✅ No duplicate artifacts exist for same purpose
- ✅ All duplicates discovered are consolidated or deprecated within 24 hours
- ✅ Deprecation headers include canonical path reference

**AC-W3C-003: Version Conflict Resolution**
- ✅ All version conflicts documented in conflict log
- ✅ Resolution verdict recorded with rationale
- ✅ Winning version meets completeness checks
- ✅ Losing versions archived with metadata

**AC-W3C-004: Provenance Tracking**
- ✅ All canonical artifacts include provenance metadata
- ✅ SHA-256 hash computed and stored for all artifacts
- ✅ Reference graph maintained and up-to-date
- ✅ Provenance metadata updated on every modification

**AC-W3C-005: Audit Trail**
- ✅ All artifact creation events logged to `.agents/evidence/artifact-creation.jsonl`
- ✅ All conflict resolutions logged to `.agents/evidence/artifact-conflicts.jsonl`
- ✅ All deprecations logged to `.agents/evidence/artifact-deprecations.jsonl`

---

## Section 2: W5 Placement Engine Requirements

### 2.1 Purpose and Scope

The W5 Placement Engine ensures:
- **Authorization Consistency:** Every route enforces RBAC according to the canonical RBAC matrix
- **Brand Isolation:** Cross-brand access is denied unless explicitly permitted
- **Role-Based Access:** Users can only perform operations their roles allow
- **Separation of Duties:** Self-approval and other SOD violations are prevented

**In Scope:**
- All 40 routes documented in `.agents/tasks/gate-b-route-rbac-matrix.csv`
- RBAC enforcement at route handler entry points
- Brand boundary checks for all tenant-scoped operations
- Identity extraction from JWT tokens
- Separation of duties enforcement for approval workflows

**Out of Scope:**
- Frontend authorization (handled by UI layer)
- Database-level access control (handled by row-level security)
- External API authentication (handled by API gateway)

### 2.2 RBAC Matrix Reference

The **canonical RBAC matrix** is located at:
`.agents/tasks/gate-b-route-rbac-matrix.csv`

**Matrix Structure:**
- 40 routes covering all API endpoints in `services/project-ai/app/api/routes/`
- Each route specifies:
  - `route_path` - API endpoint path
  - `http_method` - HTTP method (GET, POST, etc.)
  - `handler_function` - Route handler function name
  - `current_auth` - Current authentication dependency
  - `operation_type` - Operation classification (Read-only, Create, Approval, etc.)
  - `data_scope` - Data access scope (Public, Own records, Tenant/brand records, Platform-wide)
  - `required_role` - Role required to access route
  - `brand_check` - Whether brand isolation is enforced (Yes/No)
  - `separation_of_duties` - Whether SOD is required (Yes/No)
  - `rationale` - Justification for authorization policy
  - `tests_required` - Test scenarios that must pass

### 2.3 Route Authorization Consistency Checks

**Requirement:** W5 Placement Engine MUST verify that every route enforces authorization according to RBAC matrix.

**Consistency Check Process:**

1. **Load RBAC Matrix:** Read canonical matrix from `.agents/tasks/gate-b-route-rbac-matrix.csv`
2. **Discover Route Handlers:** Parse all route definitions from `app/api/routes/*.py`
3. **Match Routes to Matrix:** For each discovered route, find corresponding matrix entry
4. **Verify Authorization Logic:**
   - Check if `required_role` is enforced in handler or dependency
   - Check if `brand_check` is implemented when matrix specifies "Yes"
   - Check if `separation_of_duties` is implemented when matrix specifies "Yes"
5. **Report Inconsistencies:** Log all mismatches between implementation and matrix

**Consistency Verdicts:**

| Verdict | Meaning |
|---------|---------|
| `CONSISTENT` | Route implementation matches RBAC matrix exactly |
| `MISSING_ROLE_CHECK` | Matrix requires role, but handler does not check |
| `MISSING_BRAND_CHECK` | Matrix requires brand isolation, but handler does not check |
| `MISSING_SOD_CHECK` | Matrix requires separation of duties, but handler does not check |
| `OVERLY_PERMISSIVE` | Handler allows access matrix denies |
| `OVERLY_RESTRICTIVE` | Handler denies access matrix allows |
| `NOT_IN_MATRIX` | Route exists in code but not in RBAC matrix |
| `NOT_IN_CODE` | Matrix entry exists but no route handler found |

**Acceptance Criteria:**
- All 40 routes in RBAC matrix have `CONSISTENT` verdict
- No routes with `MISSING_*` verdicts
- No routes with `NOT_IN_MATRIX` or `NOT_IN_CODE` verdicts
- Consistency check runs automatically before W7 certification

### 2.4 Handling Edge Cases

#### 2.4.1 Unauthenticated Routes

**Example:** `/health` endpoint (monitoring systems)

**Requirements:**
- `current_auth: none` in RBAC matrix
- `required_role: NOT_APPLICABLE` in RBAC matrix
- No JWT token required
- No brand check required
- Returns 200 OK without authentication

**Implementation:**
```python
@router.get("/health")
async def health_check():
    """Public health check - no authentication required."""
    return {"status": "healthy"}
```

**Acceptance Criteria:**
- Health check returns 200 OK without Authorization header
- No authentication error logged
- Consistency check verdict: `CONSISTENT`

#### 2.4.2 Multi-Role Routes

**Example:** `/approvals/pending` endpoint (approval queue)

**Requirements:**
- `required_role: contract_reviewer` in RBAC matrix
- `tests_required: allow:contract_reviewer | allow:contract_admin | deny:contract_viewer | allow:super_admin`
- Authorization succeeds if user has ANY of: `contract_reviewer`, `contract_admin`, `super_admin`
- Authorization fails if user has only `contract_viewer` or no roles

**Implementation:**
```python
@router.get("/approvals/pending")
async def get_pending_approvals(principal: dict = Depends(get_current_user)):
    """List pending approvals - requires reviewer or admin role."""
    require_any_role(principal, ["contract_reviewer", "contract_admin"])
    # ... handler logic
```

**Acceptance Criteria:**
- Users with `contract_reviewer` role can access
- Users with `contract_admin` role can access
- Users with `contract_viewer` role receive 403 Forbidden
- Super admins can access (bypass role check)

#### 2.4.3 Admin-Only Routes

**Example:** `/workflows` POST endpoint (create workflow)

**Requirements:**
- `required_role: contract_admin` in RBAC matrix
- `current_auth: require_contract_admin` dependency
- Only users with `contract_admin` role can access
- Brand check required: workflow created in user's brand
- Super admin can access any brand

**Implementation:**
```python
@router.post("/workflows")
async def create_workflow(
    request: WorkflowCreateRequest,
    principal: dict = Depends(require_contract_admin)
):
    """Create workflow - requires contract_admin role."""
    # Brand check implicit in require_contract_admin dependency
    # ... handler logic
```

**Acceptance Criteria:**
- Users with `contract_admin` role can create workflows in their brand
- Users with `contract_viewer` role receive 403 Forbidden
- Cross-brand workflow creation denied (403 Forbidden)
- Super admin can create workflows in any brand

#### 2.4.4 Separation of Duties Routes

**Example:** `/approvals/{approval_id}/approve` endpoint (approve manifest)

**Requirements:**
- `required_role: contract_reviewer` in RBAC matrix
- `separation_of_duties: Yes` in RBAC matrix
- `tests_required: allow:contract_reviewer+different_submitter | deny:self_approval | deny:hash_mismatch | allow:super_admin`
- Approver must be different from submitter
- Manifest hash must match original hash (tamper detection)

**Implementation:**
```python
@router.post("/approvals/{approval_id}/approve")
async def approve_manifest(
    approval_id: str,
    principal: dict = Depends(get_current_user)
):
    """Approve manifest - requires reviewer role and separation of duties."""
    require_any_role(principal, ["contract_reviewer", "contract_admin"])
    
    approval = await approval_repo.get_by_id(approval_id)
    
    # Separation of duties check
    if approval.submitter_id == principal["user_id"]:
        raise HTTPException(status_code=403, detail="Self-approval not allowed")
    
    # Hash verification
    if approval.manifest_sha256 != compute_hash(approval.manifest_content):
        raise HTTPException(status_code=400, detail="Manifest hash mismatch - tamper detected")
    
    # ... approval logic
```

**Acceptance Criteria:**
- Approver can approve if different from submitter
- Self-approval attempt raises 403 Forbidden
- Tampered manifest (hash mismatch) raises 400 Bad Request
- Separation of duties violation logged to audit trail

#### 2.4.5 Deprecated Routes

**Example:** `/creation/workflows` endpoints

**Requirements:**
- `required_role: NOT_APPLICABLE` in RBAC matrix
- `operation_type: DEPRECATED` in RBAC matrix
- `tests_required: deny:all+405_response`
- All requests return 405 Method Not Allowed

**Implementation:**
```python
@router.post("/creation/workflows")
async def create_workflow_deprecated():
    """DEPRECATED - Use /workflows endpoint instead."""
    raise HTTPException(
        status_code=405,
        detail="This endpoint is deprecated. Use /workflows instead."
    )
```

**Acceptance Criteria:**
- All HTTP methods return 405 Method Not Allowed
- Error message includes migration guidance
- No authentication or authorization checks performed
- Consistency check verdict: `CONSISTENT` (correctly implements deprecated status)

### 2.5 Integration Points with W3C Canonical Artifacts

**Integration Requirement:** W5 Placement Engine MUST use canonical artifacts as source of truth.

**Integration Points:**

1. **RBAC Matrix → Authorization Logic**
   - W5 reads canonical RBAC matrix: `.agents/tasks/gate-b-route-rbac-matrix.csv`
   - W5 generates authorization enforcement code based on matrix
   - Any changes to matrix trigger W5 consistency re-check

2. **Route Inventory → Discovery**
   - W5 reads baseline route inventory: `.agents/evidence/baseline/route-inventory.csv`
   - W5 compares inventory to RBAC matrix to identify gaps
   - W5 reports routes in code but not in matrix

3. **Evidence Contract → Validation**
   - W5 reads evidence requirements: `.agents/tasks/gate-b-w7-evidence-contract.md`
   - W5 ensures authorization evidence is collected for each route
   - W5 validates that evidence binds to correct workflow and artifact

4. **Canonical Artifact Policy → Compliance**
   - W5 reads artifact policy: `.agents/policies/canonical-artifact-policy.md`
   - W5 ensures no duplicate RBAC matrices exist
   - W5 logs all artifact references to provenance tracking

**Acceptance Criteria:**
- W5 always reads from canonical artifact paths (no hardcoded alternatives)
- W5 verifies artifact SHA-256 hash before using content
- W5 logs all artifact accesses to audit trail
- W5 fails with clear error if canonical artifact is missing or stale

### 2.6 W5 Placement Engine Compliance Acceptance Criteria

**AC-W5-001: RBAC Matrix Coverage**
- ✅ All 40 routes in RBAC matrix have corresponding route handlers
- ✅ No route handlers exist without RBAC matrix entry
- ✅ All routes tested with required role scenarios

**AC-W5-002: Authorization Consistency**
- ✅ All routes enforce `required_role` from RBAC matrix
- ✅ All routes with `brand_check: Yes` enforce brand isolation
- ✅ All routes with `separation_of_duties: Yes` prevent self-approval
- ✅ Consistency check verdict: `CONSISTENT` for all 40 routes

**AC-W5-003: Edge Case Handling**
- ✅ Unauthenticated routes return 200 OK without token
- ✅ Multi-role routes accept any authorized role
- ✅ Admin-only routes deny non-admin users
- ✅ Separation of duties routes prevent self-approval
- ✅ Deprecated routes return 405 Method Not Allowed

**AC-W5-004: Integration with W3C**
- ✅ W5 reads canonical RBAC matrix (not duplicate)
- ✅ W5 verifies artifact SHA-256 before using
- ✅ W5 logs all artifact accesses to audit trail
- ✅ W5 fails gracefully if canonical artifact missing

**AC-W5-005: Test Coverage**
- ✅ All `tests_required` scenarios from RBAC matrix implemented
- ✅ All 40 routes have passing authorization tests
- ✅ All edge cases (unauthenticated, multi-role, admin-only, SOD, deprecated) tested
- ✅ Test suite runs in CI pipeline before merge

---

## Section 3: Combined Remediation Scope

### 3.1 Gap Analysis Summary

**Gaps Identified Between Current State and W3C/W5 Requirements:**

#### W3C Canonical Artifact Gaps

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| W3C-001 | Multiple RBAC matrices may exist with inconsistent data | P1 | To Investigate |
| W3C-002 | Provenance metadata not embedded in all artifacts | P1 | To Implement |
| W3C-003 | No artifact graph tracking references/dependencies | P2 | To Implement |
| W3C-004 | No automated duplicate detection tooling | P2 | To Implement |
| W3C-005 | Deprecation headers not standardized | P3 | To Document |

#### W5 Placement Engine Gaps

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| W5-001 | Not all 40 routes have authorization tests | P1 | To Implement |
| W5-002 | Separation of duties not enforced on all approval routes | P1 | To Investigate |
| W5-003 | Brand isolation checks missing on some tenant-scoped routes | P1 | To Investigate |
| W5-004 | No automated RBAC matrix consistency checker | P1 | To Implement |
| W5-005 | Edge case handling (deprecated routes) not standardized | P2 | To Implement |
| W5-006 | Hash verification for tamper detection incomplete | P2 | To Investigate |

### 3.2 Prioritized Remediation Items

#### Priority 1 (P1) - Blocking for W7 Certification

**W3C-001: RBAC Matrix Consolidation**
- **Action:** Search repository for all RBAC matrices, identify canonical version, deprecate duplicates
- **Owner:** Gate B RBAC Agent
- **Deliverable:** Single canonical RBAC matrix at `.agents/tasks/gate-b-route-rbac-matrix.csv`
- **Estimated Effort:** 2 hours
- **Acceptance Criteria:** No duplicate RBAC matrices in `.agents/tasks/` or `.agents/evidence/`

**W3C-002: Provenance Metadata Implementation**
- **Action:** Add YAML frontmatter with provenance metadata to all canonical artifacts
- **Owner:** Gate B W3C Agent
- **Deliverable:** All artifacts in `.agents/tasks/` and `.agents/policies/` include provenance
- **Estimated Effort:** 4 hours
- **Acceptance Criteria:** 100% of canonical artifacts have SHA-256 hash and timestamp metadata

**W5-001: Authorization Test Coverage**
- **Action:** Implement authorization tests for all 40 routes according to `tests_required` field in RBAC matrix
- **Owner:** Gate D Integration Test Agent
- **Deliverable:** Test suite at `tests/integration/test_w5_authorization_consistency.py`
- **Estimated Effort:** 8 hours
- **Acceptance Criteria:** All 40 routes have passing authorization tests

**W5-002: Separation of Duties Audit**
- **Action:** Audit all approval routes for separation of duties enforcement, implement missing checks
- **Owner:** Gate B Security Agent
- **Deliverable:** All approval routes prevent self-approval with 403 Forbidden
- **Estimated Effort:** 4 hours
- **Acceptance Criteria:** Self-approval tests fail with 403 for all approval endpoints

**W5-003: Brand Isolation Audit**
- **Action:** Audit all tenant-scoped routes for brand isolation, implement missing checks
- **Owner:** Gate B Security Agent
- **Deliverable:** All routes with `brand_check: Yes` enforce brand boundaries
- **Estimated Effort:** 6 hours
- **Acceptance Criteria:** Cross-brand access tests fail with 403 for all tenant-scoped endpoints

**W5-004: RBAC Consistency Checker**
- **Action:** Implement automated tool to verify route authorization matches RBAC matrix
- **Owner:** Gate B W5 Agent
- **Deliverable:** CLI tool: `python -m app.scripts.check_rbac_consistency`
- **Estimated Effort:** 6 hours
- **Acceptance Criteria:** Tool reports `CONSISTENT` for all 40 routes

#### Priority 2 (P2) - Required for Production Readiness

**W3C-003: Artifact Reference Graph**
- **Action:** Generate JSON graph of artifact dependencies
- **Owner:** Gate B W3C Agent
- **Deliverable:** `.agents/evidence/artifact-graph.json` with reference tracking
- **Estimated Effort:** 3 hours
- **Acceptance Criteria:** Graph includes all canonical artifacts and their references

**W3C-004: Duplicate Detection Tooling**
- **Action:** Implement automated duplicate detection based on content similarity
- **Owner:** Gate B W3C Agent
- **Deliverable:** CLI tool: `python -m app.scripts.detect_duplicate_artifacts`
- **Estimated Effort:** 4 hours
- **Acceptance Criteria:** Tool identifies duplicate artifacts with >80% content similarity

**W5-005: Deprecated Route Standardization**
- **Action:** Standardize all deprecated routes to return 405 with migration guidance
- **Owner:** Gate B W5 Agent
- **Deliverable:** All 4 deprecated `/creation/*` routes return 405 with consistent message
- **Estimated Effort:** 1 hour
- **Acceptance Criteria:** All deprecated routes include migration guidance in error message

**W5-006: Hash Verification Audit**
- **Action:** Audit all manifest approval routes for hash verification, implement missing checks
- **Owner:** Gate B Security Agent
- **Deliverable:** All manifest approvals verify SHA-256 hash before approval
- **Estimated Effort:** 3 hours
- **Acceptance Criteria:** Tamper detection tests pass for all manifest approval endpoints

#### Priority 3 (P3) - Nice to Have

**W3C-005: Deprecation Header Standardization**
- **Action:** Document standard deprecation header format and apply to all deprecated artifacts
- **Owner:** Documentation Agent
- **Deliverable:** All deprecated artifacts include standard deprecation header
- **Estimated Effort:** 2 hours
- **Acceptance Criteria:** Deprecation format documented in canonical artifact policy

### 3.3 Dependencies Between W3C and W5 Work Streams

**Dependency Graph:**

```
W3C-001 (RBAC Consolidation)
  ↓
W5-004 (Consistency Checker) ← depends on single canonical RBAC matrix
  ↓
W5-001 (Authorization Tests) ← depends on consistency check baseline
  ↓
W5-002 (SOD Audit) ← depends on test infrastructure
  ↓
W5-003 (Brand Isolation Audit) ← depends on test infrastructure
  ↓
W7 Certification ← depends on all P1 items complete
```

**Critical Path:**
1. **W3C-001** must complete first (blocks W5-004)
2. **W5-004** must complete before **W5-001** (need consistency baseline)
3. **W5-001** must complete before **W5-002** and **W5-003** (need test infrastructure)
4. All P1 items must complete before W7 certification can proceed

**Parallel Work:**
- **W3C-002** (Provenance) can run in parallel with W5 work stream
- **W3C-003** (Reference Graph) can run in parallel with W5 work stream
- **W5-005** (Deprecated Routes) can run in parallel with authorization audits

### 3.4 Remediation Timeline Estimate

**Total Estimated Effort:** 43 hours

**Breakdown by Priority:**
- P1 (Critical): 30 hours
- P2 (Important): 11 hours
- P3 (Nice to Have): 2 hours

**Recommended Sequencing:**

**Week 1 (Sprint 1):**
- Day 1-2: W3C-001 (RBAC Consolidation) - 2 hours
- Day 2-3: W3C-002 (Provenance Metadata) - 4 hours
- Day 3-5: W5-004 (Consistency Checker) - 6 hours

**Week 2 (Sprint 2):**
- Day 1-3: W5-001 (Authorization Tests) - 8 hours
- Day 3-4: W5-002 (SOD Audit) - 4 hours
- Day 4-5: W5-003 (Brand Isolation Audit) - 6 hours

**Week 3 (Sprint 3):**
- Day 1-2: W3C-003 (Reference Graph) - 3 hours
- Day 2-3: W3C-004 (Duplicate Detection) - 4 hours
- Day 3-4: W5-005 (Deprecated Routes) - 1 hour
- Day 4-5: W5-006 (Hash Verification) - 3 hours
- Day 5: W3C-005 (Deprecation Headers) - 2 hours

**Week 4 (Sprint 4):**
- Day 1-3: W7 Certification Evidence Collection
- Day 4-5: W7 Final Gate Review

---

## Appendix A: RBAC Matrix Summary

**Total Routes:** 40

**Route Categories:**
- **Read-Only Routes:** 16 (40%)
- **Mutating Routes:** 15 (37.5%)
- **Approval Routes:** 5 (12.5%)
- **Deprecated Routes:** 4 (10%)

**Role Distribution:**
- **Authenticated (any role):** 16 routes
- **Contract Admin:** 11 routes
- **Contract Reviewer:** 3 routes
- **Unauthenticated (public):** 1 route
- **NOT_APPLICABLE (deprecated):** 4 routes
- **NEEDS_DECISION:** 1 route

**Brand Check Distribution:**
- **Brand Check Required:** 28 routes (70%)
- **No Brand Check:** 12 routes (30%)

**Separation of Duties Distribution:**
- **SOD Required:** 5 routes (12.5%)
- **No SOD:** 34 routes (85%)
- **NEEDS_DECISION:** 1 route (2.5%)

---

## Appendix B: Evidence Types Summary

**From W7 Evidence Contract:**

1. **Security Verification Evidence** (`security_scan`)
   - Freshness: 24 hours
   - Accepted Verdicts: `PASS`, `APPROVED`, `CERTIFICATION_READY`
   - Mandatory: Yes

2. **UBRC Verification Evidence** (`ubrc_verification`)
   - Freshness: 24 hours
   - Accepted Verdicts: `PASS`, `APPROVED`, `CERTIFICATION_READY`
   - Mandatory: Yes

3. **Brand Certification Evidence** (`brand_certification`)
   - Freshness: 24 hours
   - Accepted Verdicts: `PASS`, `APPROVED`, `CERTIFICATION_READY`
   - Mandatory: Yes

4. **Theme Certification Evidence** (`theme_certification`)
   - Freshness: 24 hours
   - Accepted Verdicts: `PASS`, `APPROVED`, `CERTIFICATION_READY`
   - Mandatory: Yes

5. **Runtime Verification Evidence** (`runtime_verification`)
   - Freshness: 24 hours
   - Accepted Verdicts: `PASS`, `APPROVED`, `CERTIFICATION_READY`
   - Mandatory: Yes

---

## Appendix C: Reference Documents

**Canonical Artifact Policy:**
- `.agents/policies/canonical-artifact-policy.md`

**RBAC Matrix:**
- `.agents/tasks/gate-b-route-rbac-matrix.csv`

**Route Inventory:**
- `.agents/evidence/baseline/route-inventory.csv`

**Evidence Contract:**
- `.agents/tasks/gate-b-w7-evidence-contract.md`

**Gate D Plan (W3C Context):**
- `.agents/tasks/gate-d-plan.md`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-30 | Gate B W3C/W5 Policy Agent | Initial requirements specification |

---

**End of Document**
