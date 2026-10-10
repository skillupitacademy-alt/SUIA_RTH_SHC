# Gate E-2: W5 Placement Engine Remediation Implementation Plan

## Overview

This plan addresses route-level authorization consistency enforcement for the W5 Placement Engine, ensuring all 22 mutating routes identified in the RBAC matrix use `require_contract_admin` instead of `get_current_user`. Currently only 4/40 routes enforce contract_admin authorization, creating a critical security gap.

## Exploration Findings

### Current Authorization State
- **Total routes audited**: 40 routes from gate-b-route-rbac-matrix.csv
- **Routes using require_contract_admin**: 2/40
  - POST /workflows (create_workflow)
  - POST /workflows/{id}/approve-final (approve_final_certification)
- **Security gap**: 20+ mutating routes use `get_current_user` (authenticated only) instead of `require_contract_admin`

### Placement Engine Components
Located in `services/project-ai/app/placement/`:
- `placement_engine.py` - Core matching and scoring engine
- `matcher.py` - Candidate-to-manifest matching logic
- `scorer.py` - Placement scoring algorithms
- `artifact_policy.py` - ADD/REUSE/EXTEND/UPDATE/REJECT policy (✓ exists)
- `approval_enforcer.py` - Approval workflow enforcement
- `comparator.py` - Semantic comparison
- `executor.py` - Placement execution
- `repository_adapter.py` - Data access layer
- `worktree_manager.py` - Git worktree management

### Policy Integration Status
- ✅ `app/placement/artifact_policy.py` - Fully implemented, integrated with placement engine
- ✅ `app/governance/evidence_policy.py` - Fully implemented, integrated with final gate approval
- ✅ Both policies imported and used in workflow routes

### Testing Infrastructure
- Framework: pytest with pytest-asyncio
- Test command: `pytest` (from services/project-ai/)
- Test location: `services/project-ai/tests/`
- Existing patterns: 
  - Unit tests in `tests/unit/`
  - Integration tests in `tests/`
  - Security tests in `tests/security/`
  - RBAC tests exist at `tests/security/test_rbac.py` (91 lines, covers dependency enforcement)

## Implementation Plan

---

### Phase 1: Route Authorization Audit and Enforcement

- [ ] 1. **Audit all workflow routes in workflows.py for authorization consistency**
      
      Read `services/project-ai/app/api/routes/workflows.py` and identify all route handlers. Document which currently use `get_current_user` vs `require_contract_admin`. Cross-reference with the RBAC matrix to identify the 22 mutating routes.
      
      **Files**: 
      - `services/project-ai/app/api/routes/workflows.py` (read only, document findings)
      - `.agents/evidence/gate-e2-authorization-audit.json` (create - structured audit report)
      
      **Verify**: Document contains JSON with route_path, http_method, handler_function, current_auth, required_auth, needs_change boolean for all routes.

---

- [ ] 2. **Enforce require_contract_admin on POST /workflows/{id}/placement (create_placement)**
      
      Replace `user: AuthenticatedPrincipal = Depends(get_current_user)` with `user: AuthenticatedPrincipal = Depends(require_contract_admin)` in the `create_placement` handler (line ~430). This is a privileged operation that creates placement decisions requiring matching and scoring.
      
      **Rationale**: Per RBAC matrix row 24, `POST /workflows/{id}/placement` requires `contract_admin` role as it creates placement decisions that bind candidates to manifests - a privileged governance operation.
      
      **Files**: 
      - `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: Run `pytest tests/security/test_rbac.py -v` - all existing RBAC tests pass. Run `pytest tests/ -k placement -v` - all placement tests pass.

---

- [ ] 3. **Enforce require_contract_admin on POST /workflows/{id}/placement/override (override_placement)**
      
      Replace `user: AuthenticatedPrincipal = Depends(get_current_user)` with `user: AuthenticatedPrincipal = Depends(require_contract_admin)` in the `override_placement` handler (line ~470). Manual overrides are critical governance operations requiring admin approval.
      
      **Rationale**: Per RBAC matrix row 25, placement overrides require `contract_admin` with mandatory reason for audit trail. This is an Override/Emergency operation with separation of duties enforcement.
      
      **Files**: 
      - `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: Run `pytest tests/security/test_rbac.py -v` - all RBAC tests pass.

---

- [ ] 4. **Enforce require_contract_admin on POST /workflows/{id}/artifacts (bind_artifact)**
      
      Replace `user: AuthenticatedPrincipal = Depends(get_current_user)` with `user: AuthenticatedPrincipal = Depends(require_contract_admin)` in the `bind_artifact` handler (line ~280). Artifact binding with SHA-256 hash is a privileged operation affecting workflow integrity.
      
      **Rationale**: Per RBAC matrix row 22, artifact binding requires `contract_admin` as it associates artifacts (contract, candidate, manifest, snapshot) with SHA-256 hashes for integrity verification.
      
      **Files**: 
      - `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: Run `pytest tests/ -k artifact -v` - all artifact-related tests pass.

---

- [ ] 5. **Review and enforce authorization on POST /workflows/{id}/transition (transition_workflow)**
      
      This route currently uses `get_current_user` (line ~200). Per RBAC matrix row 20, state transitions need role policy per transition type. The route comment says "NEEDS_DECISION" for role requirements. 
      
      **Decision**: Keep `get_current_user` for now, but add internal authorization logic that checks the target state. For transitions to `IMPLEMENTING`, enforce `contract_admin` role. For other transitions, allow authenticated users. Document this decision in the handler's docstring.
      
      **Rationale**: State transitions have varying authorization requirements. Read-only transitions (REQUESTED→CANDIDATE_AUDIT) can be authenticated-only, but privileged transitions (→IMPLEMENTING) require admin role per governance gates.
      
      **Files**: 
      - `services/project-ai/app/api/routes/workflows.py`
      
      **Verify**: Run `pytest tests/ -k transition -v` - all transition tests pass.

---

### Phase 2: Candidate Routes Authorization (candidate.py)

- [ ] 6. **Audit candidate.py routes for authorization gaps**
      
      Read `services/project-ai/app/api/routes/candidate.py` and identify all mutating routes. Per the evidence file showing `execute_placement` at line 809 already uses `require_contract_admin`, verify which other routes need enforcement.
      
      **Files**: 
      - `services/project-ai/app/api/routes/candidate.py` (read only)
      - `.agents/evidence/gate-e2-authorization-audit.json` (update - add candidate routes)
      
      **Verify**: Audit JSON updated with candidate route findings.

---

- [ ] 7. **Enforce require_contract_admin on POST /candidates/{id}/classify (classify_candidate)**
      
      Per RBAC matrix row 33, classification is a privileged analysis operation requiring `contract_admin`. Locate the `classify_candidate` handler and replace `get_current_user` with `require_contract_admin`.
      
      **Files**: 
      - `services/project-ai/app/api/routes/candidate.py`
      
      **Verify**: Run `pytest tests/ -k candidate -v` - all candidate tests pass.

---

- [ ] 8. **Enforce require_contract_admin on POST /candidates/{id}/manifest (generate_manifest)**
      
      Per RBAC matrix row 35, manifest generation creates binding decisions requiring `contract_admin`. Locate the `generate_manifest` handler and replace `get_current_user` with `require_contract_admin`.
      
      **Rationale**: Manifest generation creates placement manifests that define where candidates will be placed - a privileged operation that binds deployment decisions.
      
      **Files**: 
      - `services/project-ai/app/api/routes/candidate.py`
      
      **Verify**: Run `pytest tests/ -k manifest -v` - all manifest tests pass.

---

### Phase 3: Governance Routes Authorization (governance.py)

- [ ] 9. **Audit governance.py routes for authorization consistency**
      
      Read `services/project-ai/app/api/routes/governance.py`. The evidence shows line 322 already uses `require_contract_admin` for `approve_placement_workflow`. Verify all approval and governance routes use appropriate authorization.
      
      **Files**: 
      - `services/project-ai/app/api/routes/governance.py` (read only)
      - `.agents/evidence/gate-e2-authorization-audit.json` (update - add governance routes)
      
      **Verify**: Audit JSON updated with governance route findings.

---

- [ ] 10. **Enforce authorization on remaining governance approval routes**
      
      Review approval routes from RBAC matrix:
      - Row 9: POST /tasks/{id}/approve - requires `contract_admin` with separation of duties
      - Row 10: POST /tasks/{id}/reject - requires `contract_admin`
      - Row 14: POST /approvals/{id}/approve - requires `contract_reviewer` with separation of duties
      - Row 15: POST /approvals/{id}/reject - requires `contract_reviewer`
      
      Apply appropriate role enforcement (admin or reviewer) to each handler.
      
      **Files**: 
      - `services/project-ai/app/api/routes/governance.py`
      - May need to create `require_contract_reviewer` if not already exists (check `app/auth/dependencies.py`)
      
      **Verify**: Run `pytest tests/security/test_rbac.py -v` - all RBAC tests pass.

---

### Phase 4: Test Suite Development (20-25 tests)

- [ ] 11. **Create test_w5_placement_authorization.py with 25 authorization tests**
      
      Create comprehensive test suite covering all placement engine route authorization patterns. Test file location: `services/project-ai/tests/security/test_w5_placement_authorization.py`
      
      **Test categories** (25 tests total):
      
      **A. Placement Route Tests (8 tests)**
      1. `test_create_placement_requires_contract_admin` - POST /workflows/{id}/placement with contract_admin succeeds
      2. `test_create_placement_denies_authenticated_non_admin` - authenticated user without admin role gets 403
      3. `test_create_placement_denies_unauthenticated` - missing token gets 401
      4. `test_override_placement_requires_contract_admin` - override with admin succeeds
      5. `test_override_placement_denies_contract_viewer` - viewer role gets 403
      6. `test_override_placement_requires_reason` - override without reason fails validation
      7. `test_list_conflicts_allows_authenticated` - GET /placement/conflicts allows authenticated users
      8. `test_placement_super_admin_bypass` - super_admin can access all placement routes
      
      **B. Artifact Binding Tests (4 tests)**
      9. `test_bind_artifact_requires_contract_admin` - artifact binding with admin succeeds
      10. `test_bind_artifact_denies_contract_reviewer` - reviewer role gets 403
      11. `test_bind_artifact_validates_artifact_type` - invalid artifact type fails
      12. `test_bind_artifact_validates_sha256_format` - malformed SHA-256 fails validation
      
      **C. Candidate Route Tests (5 tests)**
      13. `test_classify_candidate_requires_contract_admin` - classification with admin succeeds
      14. `test_classify_candidate_denies_authenticated` - authenticated non-admin gets 403
      15. `test_generate_manifest_requires_contract_admin` - manifest generation with admin succeeds
      16. `test_generate_manifest_denies_contract_viewer` - viewer role gets 403
      17. `test_execute_placement_requires_contract_admin` - placement execution with admin succeeds
      
      **D. Workflow Transition Tests (4 tests)**
      18. `test_transition_to_implementing_requires_contract_admin` - transition to IMPLEMENTING with admin succeeds
      19. `test_transition_to_implementing_denies_authenticated` - non-admin cannot transition to IMPLEMENTING
      20. `test_transition_to_candidate_audit_allows_authenticated` - non-privileged transitions allow authenticated users
      21. `test_transition_validates_state_machine` - invalid transitions rejected
      
      **E. Cross-Brand Boundary Tests (4 tests)**
      22. `test_placement_enforces_brand_boundary` - user from brand A cannot access brand B workflow
      23. `test_artifact_binding_enforces_brand_boundary` - cross-brand artifact binding fails
      24. `test_super_admin_bypasses_brand_boundary` - super_admin can access any brand
      25. `test_workflow_creation_sets_brand_from_token` - new workflow inherits requester's brand
      
      **Test infrastructure**: Use pytest fixtures for JWT token generation, mock repositories, and AsyncSession. Follow patterns from `tests/security/test_rbac.py` (lines 14-30 show fixture patterns).
      
      **Files**: 
      - `services/project-ai/tests/security/test_w5_placement_authorization.py` (create)
      
      **Verify**: Run `pytest tests/security/test_w5_placement_authorization.py -v` - all 25 tests pass (0 failures, 0 skipped).

---

### Phase 5: Integration with Evidence and Artifact Policies

- [ ] 12. **Verify artifact_policy.py integration with placement routes**
      
      Read `services/project-ai/app/placement/placement_engine.py` to confirm it imports and uses `artifact_policy.py` functions (`determine_action`, `get_target_path`, `find_semantic_match`). Verify the placement engine enforces ADD/REUSE/EXTEND/UPDATE/REJECT logic.
      
      **Files**: 
      - `services/project-ai/app/placement/placement_engine.py` (read only)
      - `.agents/evidence/gate-e2-policy-integration.json` (create - document integration points)
      
      **Verify**: Document shows artifact_policy import, function calls, and enforcement points.

---

- [ ] 13. **Verify evidence_policy.py integration with final gate approval**
      
      Already verified in workflows.py line 539: `from app.governance.evidence_policy import EvidenceResult, validate_final_gate_evidence, FINAL_GATE_POLICY`. The approve_final_certification handler (line ~520) calls `validate_final_gate_evidence` before FinalGateController. This integration is complete.
      
      Document the integration for Gate E-2 certification.
      
      **Files**: 
      - `.agents/evidence/gate-e2-policy-integration.json` (update - add evidence_policy integration)
      
      **Verify**: Document shows evidence_policy import at line 539, validation call before line 570, and fail-closed enforcement with 409 error on policy violation.

---

- [ ] 14. **Add policy enforcement tests to test suite**
      
      Add 3 integration tests to `test_w5_placement_authorization.py`:
      
      26. `test_placement_respects_artifact_policy` - placement engine calls artifact_policy.determine_action
      27. `test_final_gate_enforces_evidence_policy` - approve_final rejects if evidence_policy validation fails
      28. `test_stale_evidence_rejected` - evidence older than 24 hours rejected per FINAL_GATE_POLICY
      
      **Files**: 
      - `services/project-ai/tests/security/test_w5_placement_authorization.py` (update)
      
      **Verify**: Run `pytest tests/security/test_w5_placement_authorization.py -v` - all 28 tests pass.

---

### Phase 6: Documentation and Certification

- [ ] 15. **Create Gate E-2 implementation evidence report**
      
      Create structured evidence report documenting:
      - Authorization enforcement summary (routes changed, decorators applied)
      - Test suite results (28 tests, 100% pass rate)
      - Policy integration verification (artifact_policy and evidence_policy)
      - Security gaps closed (20+ routes now enforce contract_admin)
      - RBAC matrix compliance status (all 22 mutating routes enforced)
      
      **Files**: 
      - `.agents/evidence/gate-e2-implementation-report.json` (create)
      
      **Verify**: JSON report is valid, complete, and includes test execution timestamps.

---

- [ ] 16. **Update RBAC matrix with current authorization state**
      
      Update the `current_auth` column in gate-b-route-rbac-matrix.csv for all routes modified in this implementation. Change from `get_current_user` to `require_contract_admin` for routes 22, 24, 25, 33, 35, etc.
      
      **Files**: 
      - `.agents/tasks/gate-b-route-rbac-matrix.csv` (update - do NOT modify structure, only update current_auth column values)
      
      **Verify**: CSV file validates with same row count (40 routes), updated current_auth values match implementation.

---

- [ ] 17. **Run full test suite and generate final report**
      
      Execute comprehensive test run covering:
      - All security tests: `pytest tests/security/ -v`
      - All placement tests: `pytest tests/placement/ -v`
      - All route tests: `pytest tests/ -k "test_auth or test_rbac" -v`
      - Full suite: `pytest tests/ -v --tb=short`
      
      Capture test results (pass/fail/skip counts, execution time) for certification.
      
      **Files**: 
      - `.agents/evidence/gate-e2-test-results.txt` (create - capture pytest output)
      
      **Verify**: All tests pass with 0 failures. Report shows test count ≥ 28 for new authorization tests.

---

## Acceptance Criteria for Gate E-2 Certification

1. ✅ **Authorization Consistency**: All 22 mutating routes from RBAC matrix enforce `require_contract_admin`
2. ✅ **Security Gaps Closed**: No privileged operations (create, update, approve, override) use `get_current_user` only
3. ✅ **Test Coverage**: 25-28 authorization tests cover all route patterns and role boundaries
4. ✅ **Policy Integration**: artifact_policy.py and evidence_policy.py fully integrated and enforced
5. ✅ **Separation of Duties**: Approval routes enforce different approver/requester (existing in workflows.py)
6. ✅ **Brand Boundary**: Cross-brand access properly restricted (verified by tests)
7. ✅ **Super Admin Bypass**: super_admin role bypasses all role checks (existing in dependencies.py line 148)
8. ✅ **Audit Trail**: All privileged operations log requester identity from JWT token
9. ✅ **Test Execution**: Full test suite passes with 0 failures
10. ✅ **Documentation**: Implementation evidence report and updated RBAC matrix committed

## Risk Analysis and Mitigations

**Risk**: Changing authorization from `get_current_user` to `require_contract_admin` may break existing functionality if client code expects authenticated users to access these endpoints.

**Mitigation**: 
- Review existing test failures after enforcement changes
- If legitimate use cases exist for authenticated non-admin access, create separate read-only endpoints
- Ensure all mutating operations require admin; read operations can remain authenticated-only

**Risk**: State transition authorization policy is complex (role depends on target state).

**Mitigation**:
- Keep `get_current_user` at route level for transitions
- Add internal authorization logic based on target state
- Document the policy clearly in handler docstring
- Add specific tests for each transition type

**Risk**: Test suite may have dependencies on database state or running services.

**Mitigation**:
- Use pytest fixtures with mocked repositories (AsyncMock pattern)
- Follow existing test patterns from test_rbac.py
- Ensure tests are idempotent and don't require external services

## Implementation Notes

- All route handlers are in `services/project-ai/app/api/routes/`
- Authorization decorators are in `services/project-ai/app/auth/dependencies.py`
- Test fixtures follow pattern from `services/project-ai/tests/security/test_rbac.py`
- JWT environment variables required: `JWT_SECRET` and `ADMIN_JWT_SECRET`
- Database operations use AsyncSession with repository pattern
- All async routes must use `await session.commit()` after mutations
- Brand boundary enforcement happens via JWT token claims, not route-level checks

## Verification Commands

```bash
# From services/project-ai/ directory

# Run all security tests
pytest tests/security/ -v

# Run specific authorization tests
pytest tests/security/test_w5_placement_authorization.py -v

# Run all tests with coverage
pytest tests/ -v --tb=short

# Verify imports load without errors
python -c "from app.auth.dependencies import require_contract_admin; print('✓ Auth module OK')"
python -c "from app.placement.artifact_policy import determine_action; print('✓ Artifact policy OK')"
python -c "from app.governance.evidence_policy import validate_final_gate_evidence; print('✓ Evidence policy OK')"
```

## Definition of Done

- [ ] All 17 plan items completed
- [ ] 25-28 authorization tests pass with 0 failures
- [ ] Full test suite passes (`pytest tests/`)
- [ ] RBAC matrix updated to reflect current state
- [ ] Implementation evidence report created
- [ ] No security warnings from authorization audit
- [ ] All mutating routes enforce contract_admin role
- [ ] Policy integration verified and documented
- [ ] Code committed to branch `m2-project-ai-canonical-wiring`

---

**Plan Status**: Ready for implementation
**Estimated Effort**: 8-12 hours (3-4 hours authorization changes, 4-6 hours test development, 1-2 hours documentation)
**Dependencies**: None - all required modules exist
**Blockers**: None identified
