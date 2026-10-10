# Gate E-2 W5 Placement Engine Authorization Remediation

This implementation addresses route-level authorization gaps identified in the RBAC audit, specifically upgrading three governance approval routes from authenticated-only access to role-based enforcement. The changes tighten access control for the approval workflow without introducing new features or changing business logic.

**Watch for:** Authorization discrepancy between RBAC matrix and implementation (confirmed) — three governance routes were documented as requiring `contract_reviewer` in the matrix but implemented with `require_contract_admin` instead. This creates a role hierarchy inconsistency where only admins can approve/reject manifests, potentially blocking legitimate reviewer workflows.

**Verdict**: NEEDS_CHANGES

---

## High-level view

Three governance routes were upgraded from `get_current_user` to `require_contract_admin`: listing the pending approval queue, approving manifests, and rejecting manifests. The authorization change is correctly applied at the route decorator level with proper dependency injection. However, the RBAC matrix specified `contract_reviewer` as the required role for these operations, while the implementation enforces `contract_admin` — this mismatch means reviewers without admin privileges cannot perform their documented function. The separation-of-duties logic within `approve_manifest` remains intact and continues to prevent self-approval regardless of role. Hash verification for tamper detection works correctly. The test suite includes 28 authorization tests covering role enforcement, brand boundaries, and policy integration, though 13 tests fail due to mock configuration issues rather than authorization defects. Policy integration points (artifact_policy.py and evidence_policy.py) were verified as correctly wired with no bypass paths.

---

<details>
<summary>Issues (6)</summary>

1. **RBAC matrix mismatch** (confirmed) — Governance routes implemented with `require_contract_admin` but RBAC matrix rows 12, 14, 15 specify `contract_reviewer` role. Either update the implementation to accept `contract_reviewer` OR update the matrix to reflect the admin-only policy. Without resolution, reviewers cannot access the approval workflow.

2. **No require_contract_reviewer dependency** (confirmed) — The codebase uses `require_contract_admin` for all three governance routes but lacks a `require_contract_reviewer` dependency in `app/auth/dependencies.py`. If reviewers are intended to approve manifests (per RBAC matrix), implement role hierarchy where reviewer OR admin roles both satisfy the requirement.

3. **Self-approval bypass for non-admin approvers** (possible) — The self-approval prevention logic in `approve_manifest` (line 191) compares `decided_by == approval["submittedBy"]`, but if the implementation switches to `contract_reviewer`, verify that submitters cannot also hold reviewer role on the same manifest. Test scenario: user with both submitter and reviewer roles.

4. **Brand boundary enforcement missing on approval routes** (confirmed) — RBAC matrix row 12 specifies `brand_check: Yes` for `/approvals/pending`, but the implementation has no brand filtering. An admin from Brand A can see pending approvals for Brand B. The `get_pending_approvals` function returns all pending approvals from the `_approvals` dict without brand scoping.

5. **Legacy in-memory storage for approvals** (confirmed) — The `_approvals` dict at line 43 stores manifest approvals in memory, marked as "legacy" for M2.9 transition. This creates data loss risk on service restart and prevents horizontal scaling. The comment indicates PostgreSQL repositories exist but these routes haven't migrated yet.

6. **Test mock failures obscure coverage gaps** (confirmed) — 13 of 28 authorization tests fail due to Pydantic validation errors and mock configuration issues. While the passing tests verify role enforcement correctly, the failing tests may mask real gaps in placement engine integration (e.g., `test_create_placement_requires_contract_admin`, `test_override_placement_requires_contract_admin`). Fix mocks to validate full authorization flow.

</details>

---

<details>
<summary>Details</summary>

## Authorization enforcement in governance.py

Three functions in the newly created `governance.py` file enforce `require_contract_admin`:

**`get_pending_approvals` (line 102)**: Lists all pending approvals. Changed from `get_current_user` to `require_contract_admin` per the implementation report. However, the RBAC matrix row 12 specifies `contract_reviewer` as the required role. The implementation now blocks users with only the `contract_reviewer` role from viewing the approval queue they're meant to process.

**`approve_manifest` (line 147)**: Approves a submitted manifest. Changed from `get_current_user` to `require_contract_admin`. The RBAC matrix row 14 specifies `contract_reviewer` with separation of duties. The self-approval prevention logic (lines 191-218) remains intact and correctly rejects attempts where `decided_by == submittedBy`. Hash verification (lines 221-248) detects manifest mutation by comparing `request.manifestHash` against `approval["manifestHash"]`. Both gates return 403 for self-approval and 409 for hash mismatch.

**`reject_manifest` (line 609)**: Rejects a pending manifest. Changed from `get_current_user` to `require_contract_admin`. The RBAC matrix row 15 specifies `contract_reviewer`. The function correctly extracts `rejected_by` from the JWT token and prevents identity spoofing.

All three functions use proper dependency injection with `Depends(require_contract_admin)`. The authorization check happens before route handler execution. The implementation is syntactically correct but semantically misaligned with the RBAC matrix.

## RBAC matrix and role hierarchy discrepancy

The audit JSON (`.agents/evidence/gate-e2-authorization-audit.json`) identifies three gaps where `required_auth: contract_reviewer` doesn't match `current_auth: get_current_user`. The implementation report claims these routes were fixed by applying `require_contract_admin`, but this substitutes a different role rather than implementing the documented requirement.

The RBAC matrix distinguishes between two governance roles:
- `contract_admin`: Can create workflows, bind artifacts, create placements, approve final certifications (rows 18, 22, 24, 27)
- `contract_reviewer`: Can approve/reject manifests, view pending approvals (rows 12, 14, 15)

By enforcing `contract_admin` on approval operations, the implementation conflates these roles. If the project intends a single admin role, the RBAC matrix should be updated. If reviewer and admin are separate roles with different privileges (separation of concerns), the implementation needs a `require_contract_reviewer` dependency that accepts either `contract_reviewer` or `contract_admin` (role hierarchy).

The implementation report mentions "may need to create `require_contract_reviewer` if not already exists (check `app/auth/dependencies.py`)" but does not confirm whether this was investigated or implemented.

## Separation of duties enforcement

The `approve_manifest` function (lines 191-218) prevents self-approval:

```python
if decided_by == approval["submittedBy"]:
    approval["status"] = ApprovalStatus.REJECTED
    approval["decidedBy"] = decided_by
    approval["decidedAt"] = now
    approval["reason"] = (
        f"Self-approval rejected. "
        f"User '{decided_by}' cannot approve their own submission. "
        f"Separation of duties required."
    )
    raise HTTPException(status_code=403, detail={...})
```

This correctly enforces separation of duties at the identity level (`user_id` comparison). However, the logic assumes identity extraction from JWT is trustworthy:

```python
decided_by = user.get("user_id") or user.get("email") or user.get("sub") or "unknown"
```

If `user_id` is absent, the function falls back to `email`, then `sub`, then `"unknown"`. The fallback to `"unknown"` creates a bypass: if two requests arrive without `user_id`, both get `decided_by = "unknown"` and the self-approval check passes vacuously (both are the same string). The `require_contract_admin` dependency should guarantee JWT validation, but the fallback suggests defensive coding against malformed tokens. If tokens can legitimately lack `user_id`, the route should reject them with 401 rather than allowing `"unknown"`.

The `approve_placement` function (line 322) for workflow-bound approvals correctly enforces stricter identity requirements:

```python
if not (approved_by := user.get("user_id")):
    raise HTTPException(401, "Missing user_id claim")
```

This pattern should be applied to `approve_manifest` and `reject_manifest`.

## Hash verification and tamper detection

The `approve_manifest` function verifies manifest integrity by comparing hashes (lines 221-248):

```python
if request.manifestHash != approval["manifestHash"]:
    approval["status"] = ApprovalStatus.MANIFEST_CHANGED
    approval["decidedBy"] = decided_by
    approval["decidedAt"] = now
    approval["reason"] = (
        f"Manifest hash mismatch detected. "
        f"Expected: {approval['manifestHash']}, "
        f"Got: {request.manifestHash}. "
        f"Manifest was mutated after submission."
    )
    raise HTTPException(status_code=409, detail={...})
```

This correctly prevents time-of-check-time-of-use attacks where a manifest is submitted for approval, then modified before approval is granted. The hash is bound at submission time (`submit_for_approval` stores `manifestHash` in the approval record). The approval decision includes the hash in the request payload (`ApprovalDecisionRequest.manifestHash`), forcing the approver to verify the hash externally before approving.

One edge case: if the approval record is mutated in memory (the `_approvals` dict is not write-protected), an attacker with code execution could change `approval["manifestHash"]` to match a modified manifest. The legacy in-memory storage creates this vulnerability. Migration to PostgreSQL with proper access controls would close this gap.

## Brand boundary enforcement gaps

The RBAC matrix row 12 specifies `brand_check: Yes` for `/approvals/pending`, meaning users should only see pending approvals for their own brand. The implementation does not enforce this:

```python
@router.get("/pending", response_model=list[ApprovalRecord])
async def get_pending_approvals(user: AuthenticatedPrincipal = Depends(require_contract_admin)):
    pending = [
        ApprovalRecord(**approval)
        for approval in _approvals.values()
        if approval["status"] == ApprovalStatus.PENDING
    ]
    return pending
```

This returns all pending approvals regardless of brand. A contract admin for Brand A sees pending approvals for Brand B. The `user` principal contains `brand` claim from JWT, but it's not used for filtering.

Similarly, `approve_manifest` and `reject_manifest` do not verify that the approver's brand matches the approval's brand. The RBAC matrix rows 14 and 15 both specify `brand_check: Yes`. Brand enforcement would require storing `brand` in the approval record at submission time, then comparing against the approver's brand.

The `approve_placement` function for workflow-bound approvals does retrieve the workflow's brand:

```python
workflow = await governance_service.get_workflow(workflow_id)
target_family = workflow.target_family
```

But it doesn't verify brand boundaries either. The pattern exists elsewhere (e.g., `execute_placement` at `candidate.py` line 807 uses `verify_brand_access()`), but these three governance routes lack it.

## Test suite coverage and mock failures

The test suite (`test_w5_placement_authorization.py`) includes 28 tests across 6 categories. The implementation report states 15 tests pass and 13 fail due to mock issues, not authorization logic.

**Passing tests** correctly verify role enforcement:
- `test_create_placement_denies_authenticated_non_admin` (confirmed)
- `test_create_placement_denies_unauthenticated` (confirmed)
- `test_override_placement_denies_contract_viewer` (confirmed)
- `test_bind_artifact_denies_contract_reviewer` (confirmed)
- `test_classify_candidate_denies_authenticated` (confirmed)
- All category C tests (candidate routes) pass (confirmed)

**Failing tests** are attributed to mock configuration:
- `PlacementEngineResponse` schema expects `evidence: Dict` but mock returns `evidence: List`
- `WorkflowTarget` schema requires `family` and `version` fields
- `artifact_policy.determine_action()` signature mismatch

The report concludes "authorization logic is correct" but mock failures mean the tests don't exercise the full request-response cycle. For example, `test_create_placement_requires_contract_admin` fails, so we cannot confirm that an admin user successfully creates a placement end-to-end. The passing tests only verify that non-admin users are correctly rejected.

Two categories of tests are entirely mock failures:
- **Category A** (Placement Route Tests): 3 of 8 tests pass, 5 fail
- **Category D** (Workflow Transition Tests): 1 of 4 tests pass, 3 fail

These categories exercise the placement engine and workflow governance service, both critical integration points. The mock failures may hide real authorization gaps in these services.

## Policy integration verification

The audit JSON (`.agents/evidence/gate-e2-policy-integration.json`) confirms two policy integrations:

**artifact_policy.py**: Imported in `placement_engine.py` and `comparator.py`. The `determine_action()` function enforces semantic and structural similarity thresholds:
- REUSE: semantic ≥ 0.95, structural ≥ 0.90
- UPDATE: semantic ≥ 0.85, structural ≥ 0.80
- EXTEND: semantic ≥ 0.70, structural ≥ 0.65
- ADD: semantic < 0.70
- REJECT: structural < 0.50

The policy is called during placement decision generation. The evidence JSON confirms "no bypass paths."

**evidence_policy.py**: Imported in `workflows.py` line 539. The `validate_final_gate_evidence()` function enforces:
- All 5 gates present (ubrc, brand, theme, runtime, browser)
- All gates verdict = PASS
- Evidence bound to correct `workflow_id` and `artifact_sha256`
- Evidence age ≤ 24 hours
- No duplicate evidence types

The `approve_final_certification` handler calls this before allowing approval. The enforcement is fail-closed: policy violation returns HTTP 409.

Both policies are correctly integrated. The governance route changes in this PR do not affect these integration points.

## Legacy storage and data persistence risk

The `_approvals` dict at line 43 stores manifest approvals in memory with a comment:

```python
# Legacy in-memory approval storage for M2.9 transition period
# These dicts remain for backward compatibility with existing tests that haven't been migrated
# Production code paths use PostgreSQL repositories exclusively
_approvals: Dict[str, Dict] = {}  # Legacy manifest approvals (Wave 2)
```

The comment claims "production code paths use PostgreSQL repositories exclusively," but the three routes modified in this PR (`get_pending_approvals`, `approve_manifest`, `reject_manifest`) all read/write the `_approvals` dict. There's no PostgreSQL repository usage in these functions.

In contrast, `approve_placement` (line 322) does use PostgreSQL:

```python
approval_repo: ApprovalRepository = Depends(get_approval_repository)
approval_model = approval_to_model(implementation_approval)
await approval_repo.upsert(approval_model)
```

The Wave 2 manifest approval routes are not yet migrated. This creates:
- **Data loss risk**: Service restart clears `_approvals`
- **Scaling limitation**: Multiple service instances don't share `_approvals`
- **Audit trail gap**: In-memory data not durably logged

The comment suggests migration is planned but not implemented in this PR.

## Reversibility and rollback safety

The changes are low-risk and fully reversible:
- Three function signatures changed (dependency injection)
- No database schema changes
- No external API contract changes
- No data migrations

Rollback requires changing `Depends(require_contract_admin)` back to `Depends(get_current_user)` in three locations. No cleanup needed.

The risk of the change itself is medium: tightening authorization from authenticated-only to admin-only could break existing client workflows if non-admin users currently approve manifests. However, since the approval workflow uses in-memory storage (non-production), production clients likely don't exist yet.

</details>

---

<details>
<summary>File map</summary>

**Files created:**
- `services/project-ai/app/api/routes/governance.py` — New file with approval workflow routes (659 lines). Three functions upgraded to `require_contract_admin`.
- `services/project-ai/tests/security/test_w5_placement_authorization.py` — New test suite with 28 authorization tests (500+ lines).
- `.agents/evidence/gate-e2-authorization-audit.json` — Audit report identifying 3 routes needing authorization changes.
- `.agents/evidence/gate-e2-policy-integration.json` — Policy integration verification (artifact_policy and evidence_policy).

**Files modified:**
- `.agents/tasks/gate-b-route-rbac-matrix.csv` — Updated `current_auth` column for rows 12, 14, 15 to reflect `require_contract_admin`.

Full diff: `git diff main --stat` shows 802 files changed across the branch, but only the governance routes are in scope for Gate E-2.

</details>
