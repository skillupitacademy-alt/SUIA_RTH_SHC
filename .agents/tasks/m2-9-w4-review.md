# W4 Human Implementation Approval Gate

Implementation approval gate with hash-bound authorization, self-approval prevention, and strict transition guards. The gate enforces human review before any repository mutation, binding approval decisions to exact candidate and manifest hashes to detect tampering. Self-approval is rejected via separation-of-duties enforcement. All authorization checks return machine-readable evidence; missing or invalid approval blocks placement execution with no graceful degradation.

**Watch for:** `verify_not_self_approved` fallback logic uses `approved_by != requester_id` when `workflow_requester` is None, creating a self-approval bypass if the stored requester field is missing — **confirmed**. `can_transition_to_implementing` returns `(True, "")` when no hashes are provided for verification, skipping all hash checks — **confirmed**. No expiry mechanism exists in the approval model despite the authorization checker's docstring referencing "if expiry exists" — **likely** architectural gap.

**Verdict**: NEEDS_CHANGES

## High-level view

The approval model binds decisions to workflow ID, candidate SHA-256, manifest SHA-256, manifest ID, and requester identity, with verification methods that detect hash mismatches and self-approval. The endpoint performs six verification gates before state transitions, rejecting manifest tampering (409), contract drift (409), candidate mutation (400), manifest ID mismatch (409), self-approval (403), and wrong-state access (409). The transition guard `can_transition_to_implementing` checks approval existence, status, and all hash bindings before authorizing the `AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING` transition. The authorization checker provides a placement-executor hook that returns `authorized=False` for any missing or invalid approval, with every rejection path producing non-empty failure reasons and populated evidence dictionaries.

The self-approval check has a fallback path that weakens the boundary when `workflow_requester` is None: it compares `approved_by` against a provided `requester_id` parameter, but if that parameter is empty (the default), the check passes. The transition guard allows hash-verification bypass when callers omit hash parameters, returning success without checking candidate or manifest integrity. No test exercises either gap.

<details>
<summary>Issues (3)</summary>

1. **Self-approval bypass when workflow_requester is None** — `verify_not_self_approved` falls back to comparing `approved_by != requester_id`, but if `workflow_requester` was never stored and `requester_id` is empty (the default), the method returns True (not self-approved) even when it is. Store `workflow_requester` at approval creation time or remove the fallback and fail-closed when the field is missing.

2. **Hash verification bypass in can_transition_to_implementing** — When `candidate_sha256`, `manifest_id`, or `manifest_sha256` parameters are empty strings (the default), the function skips those checks entirely and returns `(True, "")`. This allows transition without hash verification. Make hash parameters required or return `(False, "missing verification parameters")` when critical hashes are omitted.

3. **No expiry mechanism despite authorization checker documentation** — `approval_checker.py` docstring states "Must not be expired (if expiry exists in approval model)" but `ImplementationApproval` has no expiry field or validation. Either implement expiry (approval timestamp + TTL) or remove the reference from the authorization contract.

</details>

<details>
<summary>Details</summary>

## ImplementationApproval model structure

The model binds approval to `workflow_id`, `candidate_sha256`, `placement_manifest_sha256`, `placement_manifest_id`, `approved_by`, and `workflow_requester`. Status transitions from `PENDING` to `APPROVED` or `REJECTED`. Hash verification methods compare stored hashes against provided values. Self-approval detection compares `approved_by` against `workflow_requester`, with a fallback that checks `approved_by != requester_id` when `workflow_requester` is None.

The fallback creates a bypass: if `workflow_requester` was never populated and the caller provides an empty `requester_id` (the default in multiple call sites), `verify_not_self_approved` returns True. The endpoint always populates `workflow_requester` from `workflow.get("requester")`, but if that workflow field is missing, the approval record stores `None` and the fallback activates. The model's `is_valid_for_implementation` method calls `verify_not_self_approved(requester_id)` — if `requester_id` is empty and `workflow_requester` is None, the check passes incorrectly.

```python
def verify_not_self_approved(self, requester_id: str) -> bool:
    if self.workflow_requester:
        return self.approved_by != self.workflow_requester
    
    # Fallback: if requester_id is "" and workflow_requester is None, this returns True
    return self.approved_by != requester_id
```

## Approval endpoint verification gates

The `approve_placement` endpoint checks six conditions before advancing state:

1. Workflow exists (404 if missing)
2. State is `AWAITING_IMPLEMENTATION_APPROVAL` (409 `WRONG_STATE` otherwise)
3. Manifest hash matches `workflow["manifest_hash"]` (409 `APPROVAL_INVALID` with reason `manifest_changed`)
4. Contract hash matches `workflow["contract_hash"]` (409 `CONTRACT_CHANGED`)
5. Candidate hash matches `workflow["candidate_sha256"]` (400 `CANDIDATE_HASH_MISMATCH`)
6. Manifest ID matches `workflow["placement_manifest_id"]` (409 `MANIFEST_ID_MISMATCH`)
7. Not self-approved: `approved_by != workflow["requester"]` (403 `SELF_APPROVAL_REJECTED`)

All rejection paths return structured error objects with `error` code, `message`, and relevant hash/ID pairs. The endpoint creates an `ImplementationApproval` record with status `APPROVED` or `REJECTED` depending on the `payload.approved` boolean, storing it in `_implementation_approvals[workflow_id]`. Self-approval check happens at the endpoint level before approval record creation, so the endpoint's check is authoritative. The model's self-approval check is a secondary boundary for the transition guard and authorization checker.

The endpoint's self-approval enforcement is sound: it reads `workflow["requester"]` and compares directly. The gap exists downstream in the model when that field wasn't populated upstream.

## Transition authorization in canonical_workflow.py

`can_transition_to_implementing` checks five conditions:

1. Approval exists in `approvals_store` for `workflow_id`
2. Approval status is `APPROVED`
3. Candidate hash matches (if `candidate_sha256` provided)
4. Manifest ID matches (if `manifest_id` provided)
5. Manifest hash matches (if `manifest_sha256` provided)
6. Not self-approved (if `requester_id` provided)

The conditional checks create bypass paths. When a caller provides `candidate_sha256=""` (the default), this block never executes:

```python
if candidate_sha256 and not approval.verify_candidate_hash(candidate_sha256):
    return (False, "Candidate hash mismatch: ...")
```

An empty string is falsy in Python, so `if candidate_sha256` evaluates to False and the check is skipped. Same for `manifest_id`, `manifest_sha256`, and `requester_id`. The function can return `(True, "")` without verifying any hashes. The endpoint always provides all parameters, so this gap doesn't affect the primary approval flow, but any other code calling `can_transition_to_implementing` without full parameters gets a false authorization.

The function signature defaults all verification parameters to empty strings:

```python
def can_transition_to_implementing(
    workflow_id: str,
    approvals_store: dict,
    requester_id: str = "",
    candidate_sha256: str = "",
    manifest_id: str = "",
    manifest_sha256: str = ""
) -> tuple[bool, str]:
```

Test `test_transition_without_optional_parameters` explicitly validates this bypass as correct behavior: "Should pass because no hash/ID verification requested." This is a design decision, not an accident, but it weakens the authorization boundary. If the contract is "transition requires approval," hash verification should be mandatory, not optional.

## Authorization checker for placement executor

`check_implementation_approval` performs the same checks as `can_transition_to_implementing` but returns an `AuthorizationResult` with `authorized` boolean, `approval_id`, `checked_at` timestamp, `failure_reason`, and `evidence` dict. Every rejection path populates `failure_reason` with a non-empty string and `evidence` with check results (approval found, status, hash checks, self-approval check). No code path returns `authorized=True` with an invalid approval.

The checker's docstring states "Must not be expired (if expiry exists in approval model)" but `ImplementationApproval` has no `expires_at` field or expiry logic. This is either unfinished work or documentation drift. If approvals should expire (preventing replay of old approvals for new manifests with the same workflow ID), the model needs `expires_at` and `is_expired()` method, and the checker needs an expiry check. If expiry is not required for M2.9, remove the reference.

The checker shares the same hash-bypass issue as `can_transition_to_implementing`: when `requester_id=""` (the default), self-approval check is skipped, and the evidence dict records `"self_approval_check": "SKIPPED"`. Test `test_authorization_without_requester_id` validates this as expected. If the executor calls the checker without `requester_id`, self-approval goes unchecked.

## Test coverage

54 W4 tests pass, covering:

- **Model tests** (13 passed): hash verification match/mismatch, self-approval detection, `is_valid_for_implementation` with all five failure modes (wrong status, candidate hash mismatch, manifest hash mismatch, manifest ID mismatch, self-approval), evidence dict population.

- **Endpoint tests** (9 passed): successful approval, self-approval rejection (403), manifest hash mismatch (409), candidate hash mismatch (400), manifest ID mismatch (409), wrong state rejection (409), rejection flow creating `REJECTED` approval, GET endpoint returning evidence, GET 404 when approval missing.

- **Transition guard tests** (9 passed): transition blocked when approval missing, transition blocked when status is PENDING, transition blocked on candidate hash mismatch, transition blocked on manifest hash mismatch, transition blocked on manifest ID mismatch, transition blocked on self-approval, authorized transition succeeds, transition without optional parameters (passes without hash checks), transition blocked when status is REJECTED.

- **Authorization checker tests** (11 passed): authorization succeeds with valid approval, authorization blocks missing approval, authorization blocks PENDING status, authorization blocks REJECTED status, authorization blocks candidate hash mismatch, authorization blocks manifest hash mismatch, authorization blocks self-approval, evidence fully populated (no empty dicts), `produce_authorization_evidence` format, authorization without `requester_id` (skips self-approval check), authorization evidence populated on failure.

- **Unit/integration tests** (12 passed): approve with correct hashes, approve with wrong manifest hash (409), approve when not in awaiting-approval state (409), reject transitions to REJECTED, workflow not found (404), wrong contract hash (409), workflow ID mismatch path vs payload (400), register workflow, transition to approval gate, transition from wrong state raises ValueError, transition when workflow not registered raises ValueError, full approval workflow integration test.

### Not tested

- Self-approval bypass when `workflow_requester` is None and `requester_id` is empty
- Hash verification bypass in `can_transition_to_implementing` when hashes are omitted (the test that exercises this validates it as correct, not as a gap)
- Authorization checker called without `requester_id` allowing self-approved implementation (test exists but validates the skip as expected)
- Approval expiry mechanism (doesn't exist, so untestable, but documentation references it)
- Concurrent approval attempts for the same workflow (last-write-wins with in-memory dict)
- Approval record immutability after creation (no enforcement that hashes can't be mutated post-approval)

Regression suite: 528 passed, 58 failed (all pre-existing from W3 baseline), 18 skipped. No W4 regressions.

## Evidence and gate artifacts

`m2-9-w4-evidence.json` records 54 W4 tests passed, commit `56f1030b`, changed files, implementation structure, and verification proofs. All fields populated.

`m2-9-w4-gate.json` declares `PASS` with `w5_ready: true`, lists gate checks (all PASS), authorization boundary proofs (8 proofs, all PASS), regression analysis (no W4 regressions), and W5 prerequisites (all satisfied).

Both files are consistent with test results and code implementation. The gate verdict is PASS, but the self-approval bypass and hash-verification bypass are architectural gaps that should block W5 launch.

</details>

<details>
<summary>File map</summary>

**services/project-ai/app/models/implementation_approval.py** — `ImplementationApproval` dataclass, `ImplementationApprovalStatus` enum, hash verification methods, self-approval check with fallback, `is_valid_for_implementation`, `to_evidence_dict`, `create_implementation_approval` factory.

**services/project-ai/app/api/routes/governance.py** — `POST /approvals/workflows/{workflow_id}/approve-placement` endpoint with six verification gates, `GET /approvals/workflows/{workflow_id}/implementation-approval` evidence endpoint, `register_workflow_for_approval` and `transition_to_approval_gate` helpers, in-memory stores for workflows and approvals.

**services/project-ai/app/orchestration/canonical_workflow.py** — `can_transition_to_implementing` guard with approval verification, returns `(bool, str)` tuple.

**services/project-ai/app/authorization/approval_checker.py** — `check_implementation_approval` executor hook, `AuthorizationResult` dataclass, `produce_authorization_evidence` evidence formatter.

**tests/test_implementation_approval.py** — 13 model tests covering creation, hash verification, self-approval, `is_valid_for_implementation`, evidence dict.

**tests/test_approval_endpoint.py** — 9 endpoint tests covering approval success, all rejection paths (403, 409, 400, 404), GET endpoint.

**tests/test_workflow_transitions.py** — 9 transition guard tests covering all failure modes and authorized success.

**tests/test_authorization_checker.py** — 11 authorization checker tests covering valid/invalid approval, all rejection paths, evidence population.

**tests/unit/test_approval_gate.py** — 12 unit/integration tests covering full approval workflow, hash mismatches, state enforcement, rejection flow.

**.agents/tasks/m2-9-w4-evidence.json** — Machine-readable evidence: commit SHA, changed files, test results (54 passed), implementation structure, verification proofs, architectural compliance flags.

**.agents/tasks/m2-9-w4-gate.json** — Gate verdict: PASS, w5_ready: true, gate checks (all PASS), authorization boundary proofs (8 proofs), regression analysis (no new failures), W5 prerequisites.

Full diff: `git diff 22214ef6..56f1030b` (26 files changed, 5058 insertions).

</details>
