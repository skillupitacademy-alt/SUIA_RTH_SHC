# Final Gate API integration for W7

Integrates the final human approval gate (Human Gate 2/Gate 3) into the Project AI workflow API, adding an endpoint that transitions workflows from AWAITING_GATE_2 to CERTIFIED after HAA review. The implementation connects the existing FinalGateController evidence verification logic to the REST API surface, creating the final checkpoint before production certification.

The gate validates that all automated gates (UBRC, Brand, Theme, Runtime, Browser) have passed, then records the human approval decision with full audit trail. The endpoint blocks approval from any state except AWAITING_GATE_2, enforcing the state machine contract.

**Watch for:** Mismatch between review criteria expectations and actual implementation (confirmed) — the implementation doesn't add an AWAITING_FINAL_APPROVAL state or write final_gate.py; those already exist from prior waves. State machine confusion in routing (likely) — AWAITING_GATE_2 transitions directly to CERTIFIED, not through INTEGRATION_PLANNED as git diff suggests. Evidence verification is informational only (confirmed) — verdict is returned but doesn't block approval, creating a gap between gate checks and enforcement.

**Verdict**: NEEDS_CHANGES

## High-level view

The endpoint sits at POST /workflows/{workflow_id}/approve-final and enforces that workflows must be in AWAITING_GATE_2 state before approval. The approved/rejected decision transitions workflows to CERTIFIED or REJECTED terminal states, recording the approver identity and reason through the existing WorkflowGovernanceService and StateTransitionRepository.

Evidence verification runs through the existing FinalGateController but acts only as informational reporting — the endpoint returns evidence_verified flag and gate_results summary, but doesn't block approval when gates fail. This creates an architectural gap: a human can approve a workflow even when FinalGateController returns FAIL or BLOCKED verdicts.

The state machine topology in the git diff is misleading. The diff shows CANDIDATE_AUDIT transitioning to PLACEMENT, which then transitions to INTEGRATION_PLANNED — but the review criteria expect AWAITING_GATE_2 to transition directly to CERTIFIED. The canonical_workflow.py file needs inspection to confirm which state actually represents "awaiting final approval" and whether the diff is reviewing the wrong changes.

Integration tests cover 10 scenarios including blocking cases (wrong state, missing evidence, failed gates), but the endpoint doesn't actually enforce the blocking — it only reports verdict status. Tests verify that compute_verdict returns BLOCKED/FAIL, but they don't test that the endpoint rejects approval when verdict isn't CERTIFICATION_READY.

<details>
<summary>Issues (7)</summary>

1. **Review criteria mismatch** — Review expects AWAITING_FINAL_APPROVAL state, final_gate.py creation, and 8 tests, but implementation uses AWAITING_GATE_2 (already exists), reuses existing final_gate.py (W6 artifact), and has 10 tests. Clarify whether review criteria are stale or implementation targeted the wrong milestone.

2. **State machine confusion** — Git diff shows PLACEMENT state addition and CANDIDATE_AUDIT→PLACEMENT→INTEGRATION_PLANNED transitions, but review criteria expect AWAITING_GATE_2→CERTIFIED. Read canonical_workflow.py lines 200-300 to confirm AWAITING_GATE_2 exists, is reachable, and has valid transition to CERTIFIED.

3. **Evidence verification not enforced** — Endpoint returns evidence_verified and gate_results but doesn't block approval when FinalGateController returns FAIL or BLOCKED. Add validation after line 365 in workflows.py: `if not evidence_verified: raise HTTPException(status_code=400, detail=f"Evidence verification failed: {verdict_result.reason}")`.

4. **Missing blocking test coverage** — Integration tests verify compute_verdict returns BLOCKED/FAIL, but no test confirms the endpoint rejects approval when evidence verification fails. Add test_endpoint_blocks_approval_when_evidence_fails that calls approve_final_certification with failed gates and expects 400 error.

5. **Approver identity spoofing** — Endpoint accepts approved_by from client request, allowing any authenticated user to claim HAA identity. Extract approver from authenticated user token: `approved_by = user.get("email")` and remove approved_by from FinalApprovalRequest schema.

6. **Idempotent test mischaracterized** — Test 9 verifies that CERTIFIED→CERTIFIED transition raises ValueError, labeling this "idempotent". Idempotent means multiple identical requests produce the same result without error; this test verifies non-idempotence. Rename test or fix behavior to return 200 with current state when already CERTIFIED.

7. **Test execution report contradicts review scope** — Report claims "no new database migrations required" and references W6 FinalGateController as "already deployed in earlier waves", but review criteria list final_gate.py as a file to review for W7. Confirm whether final_gate.py is new W7 work or pre-existing from W6.

</details>

<details>
<summary>Details</summary>

## State machine integration and reachability

The review criteria expect an AWAITING_FINAL_APPROVAL state to be added to the workflow state machine, but the implementation uses AWAITING_GATE_2, which according to the test execution report already exists in canonical_workflow.py from a prior wave. The git diff provided shows changes to canonical_workflow.py, but those changes add a PLACEMENT state with transitions from CANDIDATE_AUDIT (lines +140 to +316), not anything related to AWAITING_GATE_2 or final approval.

This creates confusion about what changes are actually being reviewed. Either the git diff is showing the wrong commits (PLACEMENT is unrelated W7 work), AWAITING_GATE_2 was added in a prior commit not included in the diff, or the review criteria are stale and reference a design that was superseded.

The test execution report claims "AWAITING_GATE_2 State: Already defined in canonical_workflow.py (lines 224-242)" and "Valid Transitions: AWAITING_GATE_2 → CERTIFIED | REJECTED", but without seeing the actual state enum definition and VALID_TRANSITIONS dict in canonical_workflow.py, this can't be verified. The endpoint code assumes AWAITING_GATE_2 exists and is valid (line 353 in workflows.py). If that state isn't properly wired into the state machine, the endpoint will fail at runtime with "Invalid state" errors.

Test 2 (test_final_approval_requires_awaiting_state) verifies that attempting VERIFYING→CERTIFIED raises ValueError, confirming transition enforcement works — but it doesn't test that AWAITING_GATE_2→CERTIFIED succeeds, which is the actual transition this endpoint enables.

## Evidence verification architecture gap

The endpoint calls FinalGateController.compute_verdict to validate that all required evidence is present and all gates have passed (lines 357-362 in workflows.py), extracting evidence_verified = (verdict_result.verdict == "CERTIFICATION_READY") to report verification status in the response (line 365).

But the endpoint proceeds with approval regardless of evidence_verified value. Lines 368-381 transition the workflow to CERTIFIED or REJECTED based solely on request.approved (the human decision), not on whether evidence verification passed. Gate checks are run but not enforced.

The review criteria explicitly state "Final gate endpoint validates prerequisites before approving" and "Approval correctly blocked when any check fails", which suggests enforcement was expected. Tests 3-7 verify that compute_verdict returns BLOCKED/FAIL for various failure scenarios (missing evidence, failed gates, blocked gates), but no test verifies that the endpoint returns 400 and blocks approval when compute_verdict returns anything other than CERTIFICATION_READY.

If evidence enforcement is desired, add after line 365:

```python
if not evidence_verified:
    raise HTTPException(
        status_code=400,
        detail=f"Cannot approve: evidence verification failed. Verdict: {verdict_result.verdict}, Reason: {verdict_result.reason}"
    )
```

If evidence is informational only (human approver can override automated checks), update the review criteria and docstring to clarify that approval can proceed regardless of gate status.

## State transition terminal enforcement

The endpoint transitions to CERTIFIED (approved) or REJECTED (rejected) based on request.approved (lines 368-371). These are terminal states — no further transitions allowed once reached.

Test 9 (test_final_approval_idempotent) attempts to transition from CERTIFIED back to CERTIFIED and expects ValueError with "Invalid transition". The test is misnamed: it verifies that terminal states reject all transitions, not that the endpoint is idempotent. True idempotence means calling approve_final_certification multiple times with the same approval decision returns 200 with the same result, not 400 with an error.

If a reviewer accidentally submits the approval twice, or a client retries on network failure, the second request will return 400 "Invalid state for approval: CERTIFIED", forcing clients to handle this case separately. Consider changing the state validation (line 350-355) to:

```python
if workflow.state.current == CanonicalWorkflowState.CERTIFIED:
    # Already approved, return existing approval response
    return FinalApprovalResponse(...)
elif workflow.state.current == CanonicalWorkflowState.REJECTED:
    # Already rejected, return existing rejection response
    return FinalApprovalResponse(...)
elif workflow.state.current != CanonicalWorkflowState.AWAITING_GATE_2:
    raise HTTPException(...)
```

This makes the endpoint truly idempotent for repeated identical requests.

## Test coverage gaps

The test execution report shows 10 integration tests created in tests/integration/test_final_gate.py, all currently skipped because TEST_DATABASE_URL_TUTORIAL environment variable is not configured.

Tests 3-8 verify FinalGateController.compute_verdict logic but don't test endpoint enforcement. They instantiate FinalGateController directly and call compute_verdict, confirming verdict calculation works, but they don't call the approve_final_certification endpoint to verify it blocks approval when verdict isn't CERTIFICATION_READY.

The review criteria expect "Tests cover the blocking cases (failing verifications should block approval)". The current tests cover verdict calculation blocking, not endpoint approval blocking. To satisfy the criteria, add:

```python
async def test_endpoint_blocks_approval_when_evidence_fails(db_session, workflow_repo, ...):
    # Create workflow in AWAITING_GATE_2 with failed gates
    gate_results = {
        "certification_gates": {"status": "FAIL"},
        "runtime_verification": {"status": "PASS"},
        ...
    }
    workflow = create_workflow_awaiting_gate_2(gate_results)
    
    # Attempt to approve despite failed evidence
    with pytest.raises(HTTPException) as exc_info:
        await approve_final_certification(
            workflow_id=workflow.workflow_id,
            request=FinalApprovalRequest(approved=True, ...),
            ...
        )
    
    assert exc_info.value.status_code == 400
    assert "evidence verification failed" in exc_info.value.detail.lower()
```

This test would currently fail because the endpoint doesn't enforce evidence verification.

## Approver identity spoofing risk

The endpoint signature uses get_current_user for authentication (line 339), ensuring only authenticated users can call the endpoint. But the implementation doesn't use the user object — it relies on request.approved_by for approver identity instead (line 374). Any authenticated user can submit an approval with any approved_by value, claiming to be the HAA.

Consider extracting approver identity from the authenticated user:

```python
user: dict = Depends(get_current_user),
...
approved_by = user.get("email") or user.get("sub") or user.get("id")
# Remove approved_by from FinalApprovalRequest, derive from auth token
```

This enforces that approvals are bound to the authenticated user's identity, not to a client-provided string.

## W6/W7 boundary confusion

The test execution report claims "AWAITING_GATE_2 State: Already defined in canonical_workflow.py (lines 224-242)" and "FinalGateController Integration: Endpoint uses existing compute_verdict() method", stating "All required tables exist from previous waves". But the review criteria list "services/project-ai/app/approval/final_gate.py (gate logic)" as a file to review for W7, implying it's new work. The actual file is at services/project-ai/app/agents/final_gate.py (not /approval/), and reading it shows comprehensive logic with FinalGateAgent, FinalGateController, and verdict calculation — substantial prior work, not new W7 changes.

The review criteria are stale or were copied from an earlier milestone design that was superseded. The actual W7 work appears to be:
1. FinalApprovalRequest/Response schemas (new in W7)
2. approve_final_certification endpoint (new in W7)
3. 10 integration tests (new in W7)

Everything else (AWAITING_GATE_2 state, FinalGateController, canonical_workflow.py state machine, persistence schema) is W6 or earlier work that W7 depends on.

</details>

---

## File map

<details>
<summary>Files changed (4 modified, 1 created)</summary>

**Modified:**
- `services/project-ai/app/api/schemas/workflow.py` — Added FinalApprovalRequest and FinalApprovalResponse schemas
- `services/project-ai/app/api/routes/workflows.py` — Added approve_final_certification endpoint at POST /workflows/{id}/approve-final
- `services/project-ai/app/orchestration/canonical_workflow.py` — Added PLACEMENT state and transitions (appears unrelated to W7 final gate work)

**Created:**
- `services/project-ai/tests/integration/test_final_gate.py` — 10 integration tests for final approval workflow (all currently skipped pending PostgreSQL config)

**Referenced (pre-existing):**
- `services/project-ai/app/agents/final_gate.py` — FinalGateController used for evidence verification
- `services/project-ai/app/orchestration/workflow_governance.py` — WorkflowGovernanceService used for state transitions

See full diff: `git diff m2-project-ai-canonical-wiring~5 m2-project-ai-canonical-wiring`

</details>
