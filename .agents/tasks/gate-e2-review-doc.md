# W5 Placement Engine Authorization Remediation

Gate E-2 successfully closed authorization gaps by adding `@require_contract_admin` to three governance routes that were previously exposed to any authenticated user. All 12 placement mutating routes now enforce admin-level authorization per the RBAC matrix. The test suite demonstrates correct role enforcement, though mock-related failures obscure some coverage. The route coverage CSV contains critical inaccuracies that misrepresent the security posture.

**Watch for:** (1) Route coverage CSV incorrectly marks 6 protected routes as unprotected (confirmed HIGH) — this audit artifact directly contradicts the actual code and would mislead future reviewers. (2) Test suite has 13 mock configuration failures that prevent verification of several critical routes including `create_placement`, `override_placement`, and brand boundary enforcement (confirmed MEDIUM). (3) The implementation report claims "22 mutating routes" but only 12 are actually implemented and protected (confirmed LOW) — this discrepancy is explained but the gap between plan and reality was significant.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The three governance routes upgraded from `get_current_user` to `require_contract_admin` are confirmed in the code: `get_pending_approvals`, `approve_manifest`, and `reject_manifest` all now enforce admin role at lines 102, 150, and 612 respectively. This prevents authenticated users without governance roles from accessing the approval queue or making approval decisions.

The route coverage CSV (gate-e2-route-coverage-audit.csv) lists 22 routes but marks 6 routes that actually use `require_contract_admin` as `protected=false`. The CSV shows `/approvals/{approval_id}/approve`, `/approvals/{approval_id}/reject`, `/candidates/{candidate_id}/compare`, `/approvals/submit`, `/creation/workflows`, and `/creation/workflows/{workflow_id}/validate` as unprotected when code inspection confirms at least the approval routes ARE protected. This artifact cannot be trusted for audit purposes.

The test suite created 28 tests covering role enforcement, brand boundaries, and policy integration. 15 tests pass and verify authorization logic. The remaining 13 failures are all mock configuration issues (Pydantic schema mismatches, AsyncMock setup problems) rather than authorization logic failures. However, these mock failures prevent verification of critical routes including `create_placement`, `override_placement`, `bind_artifact`, and several brand boundary scenarios.

Policy integration with `artifact_policy.py` and `evidence_policy.py` was verified through code inspection and is correctly enforced in placement and final gate approval flows. The evidence policy enforces all 5 required gates, 24-hour freshness, artifact SHA-256 binding, and workflow isolation with fail-closed behavior (HTTP 409 on violation).

---

<details>
<summary>Issues (3)</summary>

1. **Route coverage CSV contains critical inaccuracies** — The CSV marks `/approvals/{approval_id}/approve` and `/approvals/{approval_id}/reject` as `protected=false` when code inspection confirms both routes use `require_contract_admin` at lines 150 and 612. At least 6 routes are misrepresented. This audit artifact directly contradicts the actual code and would mislead future security audits. Regenerate the CSV by parsing the actual route decorators, or remove it entirely and rely on the implementation report which accurately describes the changes.

2. **Mock failures block verification of critical placement routes** — 13 tests fail due to mock configuration (Pydantic `PlacementEngineResponse` expects `evidence: Dict` but mock returns `List`, `WorkflowTarget` schema requires `family` and `version` fields). These failures prevent verification of `create_placement`, `override_placement`, `bind_artifact`, and brand boundary enforcement. Fix the mock schemas to match production Pydantic models and rerun the suite to confirm authorization logic for all 12 protected routes.

3. **Reported "22 mutating routes" count doesn't match implementation** — The plan and several report sections reference "22 mutating routes" but only 12 routes are actually implemented and protected with `require_contract_admin`. The report acknowledges this discrepancy in one section ("RBAC Matrix Count Discrepancy") but continues to reference the higher number throughout. While this is explained as deprecated routes or routes not yet implemented, the gap between plan expectations and actual deliverables is significant and suggests incomplete discovery or scope creep during planning.

</details>

---

<details>
<summary>Details</summary>

## Authorization enforcement verified for three governance routes

Code inspection confirms the three governance routes now use `require_contract_admin`:

- `get_pending_approvals` (governance.py line 102)
- `approve_manifest` (governance.py line 150)
- `reject_manifest` (governance.py line 612)

The existing self-approval prevention logic (lines 189-211 in `approve_manifest`) continues to enforce separation of duties by comparing `decided_by` (extracted from JWT) against `approval["submittedBy"]`. If they match, the approval is auto-rejected with status `REJECTED` and reason "Self-approval rejected."

## Route coverage CSV is critically inaccurate

The route coverage audit CSV marks `/approvals/{approval_id}/approve` and `/approvals/{approval_id}/reject` as `protected=false` when code inspection confirms both use `require_contract_admin` (lines 150 and 612 in governance.py). The CSV also marks them as `decorator_added_this_gate=false`, contradicting the implementation report's claim that these were *upgraded* from `get_current_user` during Gate E-2.

This artifact directly contradicts both the code and the implementation report. If used for compliance or audit purposes, it will mislead reviewers into believing routes are unprotected when they are not.

## Test suite demonstrates authorization logic but mock failures obscure coverage

The test suite (`test_w5_placement_authorization.py`) contains 28 tests across 6 categories. 15 tests pass, 13 fail due to mock issues.

**Passing tests verify:**

- `require_contract_admin` dependency raises 403 for users without admin role (tests: `test_create_placement_denies_authenticated_non_admin`, `test_override_placement_denies_contract_viewer`, `test_bind_artifact_denies_contract_reviewer`, `test_classify_candidate_denies_authenticated`, `test_generate_manifest_denies_contract_viewer`)
- `get_current_user` dependency raises 401 for missing JWT (test: `test_create_placement_denies_unauthenticated`)
- Super admin bypass works (test: `test_placement_super_admin_bypass`)
- All category C tests (5 candidate route tests) verify role enforcement via dependency mocking

**Failing tests (mock configuration issues):**

The report states 13 tests fail with "Pydantic validation, AsyncMock configuration" issues. Examples:
- `PlacementEngineResponse` schema expects `evidence: Dict` but mock returns `evidence: List`
- `WorkflowTarget` schema requires `family` and `version` fields in mock
- `artifact_policy.determine_action()` signature mismatch in test

These failures prevent verification of the actual route handlers for `create_placement`, `override_placement`, `bind_artifact`, and brand boundary enforcement. The passing tests confirm the *dependency* logic (that `require_contract_admin` raises 403 for non-admins), but they don't confirm the routes successfully call the placement engine, governance service, or enforce brand boundaries when given a valid admin user.

For example, `test_create_placement_requires_contract_admin` is listed in the report's Category A with a checkmark but no PASS/FAIL indicator. If this test is one of the 13 mock failures, then the critical happy path (admin user successfully creates placement) is not verified.

The test suite proves authorization logic is correct at the dependency level. It does not prove the routes work end-to-end.

## Policy integration verified through code inspection

Code inspection confirms `artifact_policy.py` and `evidence_policy.py` are integrated:

**Artifact Policy:** Imported in `placement_engine.py` and `comparator.py`, called to determine ADD/REUSE/EXTEND/UPDATE/REJECT based on similarity scores. Fail-closed: if scores below threshold, placement is rejected or downgraded.

**Evidence Policy:** Called in `approve_final_certification` before `FinalGateController`. Enforces 5 required gates (ubrc, brand, theme, runtime, browser), 24-hour staleness limit, artifact SHA-256 binding, and workflow isolation. Returns HTTP 409 on policy violation (`FINAL_GATE_EVIDENCE_REJECTED`). Test `test_stale_evidence_rejected` passes and confirms evidence older than 24 hours is rejected.

## Discrepancy between planned and actual route count

The Gate E-2 plan references "22 mutating routes" requiring protection but only 12 routes are actually implemented: `create_workflow`, `bind_artifact`, `create_placement`, `override_placement`, `approve_final_certification`, `classify_candidate`, `generate_manifest`, `execute_placement`, `approve_placement`, `approve_manifest`, `reject_manifest`, `get_pending_approvals`, `create_engineering_contract`, `approve_task`, `reject_task`.

The report explains this as "RBAC Matrix Count Discrepancy" and attributes the gap to deprecated or unimplemented routes. If 10 routes in the matrix don't exist in the codebase, the matrix is not an accurate representation of the system, suggesting incomplete discovery during Gate B.

## Brand boundary enforcement at workflow level, not route level

The test suite includes Category E (4 tests) for cross-brand boundary enforcement. However, tests `test_placement_enforces_brand_boundary` and `test_artifact_binding_enforces_brand_boundary` are documented as "would require brand boundary check" suggesting the enforcement is not currently implemented in the code being tested. Test `test_super_admin_bypasses_brand_boundary` passes.

Brand enforcement is not a Gate E-2 requirement, but the test suite's inclusion of these tests suggests this was considered in scope. The tests don't confirm end-to-end brand isolation because of mock failures.

## File map

All code changes in services/project-ai/:

- `app/api/routes/governance.py` — Changed 3 route decorators from `get_current_user` to `require_contract_admin` (lines 102, 150, 612)
- `tests/security/test_w5_placement_authorization.py` — Created 28 authorization tests (15 passing, 13 mock failures)
- `.agents/evidence/gate-e2-authorization-audit.json` — Structured audit of 39 routes from RBAC matrix (documentation artifact)
- `.agents/evidence/gate-e2-policy-integration.json` — Verification of artifact_policy and evidence_policy integration (documentation artifact)
- `.agents/tasks/gate-e2-route-coverage-audit.csv` — Route coverage audit (contains critical inaccuracies, see Issues #1)
- `.agents/tasks/gate-b-route-rbac-matrix.csv` — Updated 3 rows to reflect new decorator usage (documentation artifact)
- `.agents/tasks/gate-e2-implementation-report.md` — Comprehensive implementation report (this review's primary input)

Full diff: `git diff main services/project-ai/`

</details>
