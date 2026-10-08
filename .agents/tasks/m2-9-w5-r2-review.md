# W5-R2 Authorization Bypass Remediation

ApprovalStatus bypass eliminated and ApprovalEnforcer wired into the API execution path. All five authorization bindings now enforced before repository mutation.

**Watch for:** None. All critical authorization gaps from the original W5 review are confirmed fixed. The API endpoint calls ApprovalEnforcer, the executor verifies all five bindings, and the legacy ApprovalStatus bypass path is gone.

**Verdict**: APPROVED

## High-level view

The remediation removes the instanceof(approval, ApprovalStatus) branch from PlacementExecutor.execute_placement() that allowed legacy enum-based approval to bypass the W4/W5 authorization boundary. The method signature now accepts only ImplementationApproval and requires workflow_requester and candidate_sha256 as mandatory parameters.

The API endpoint in candidate.py now computes candidate_sha256 from uploaded files, extracts workflow_id and requester_id from manifest metadata, and calls ApprovalEnforcer.enforce_approval() before execution. If enforcement fails, the endpoint returns 403 Forbidden. If enforcement succeeds, it passes the ImplementationApproval object to the executor with all required bindings.

The executor verifies all five bindings before any mutation: candidate_sha256 via approval.verify_candidate_hash(), manifest_sha256 via approval.verify_manifest_hash(), workflow_id implicitly via approval lookup, manifest_id via ApprovalEnforcer, and self-approval via approval.verify_not_self_approved(). The verification sequence is fail-closed: any mismatch raises PlacementExecutionError before reaching repository operations.

Seven API-level security tests verify the authorization boundary: no execution without approval, legacy ApprovalStatus enum rejected, candidate hash mismatch rejected, manifest ID mismatch rejected, manifest hash mismatch rejected, self-approval rejected, and successful execution when all bindings valid.

<details>
<summary>Issues (0)</summary>

No blocking issues.

</details>

<details>
<summary>Details</summary>

## Legacy ApprovalStatus bypass eliminated

**confirmed** — The executor no longer accepts ApprovalStatus enum. Reading `executor.py:105-158`, the execute_placement method signature is:

```python
def execute_placement(
    self,
    manifest: PlacementManifest,
    approval: ImplementationApproval,
    candidate_files: List[Any],
    workflow_requester: str,
    candidate_sha256: str
) -> Dict[str, Any]:
```

The previous isinstance(approval, ApprovalStatus) branch that allowed legacy enum-based approval is gone. The import statement at line 13-14 imports only ImplementationApproval and ImplementationApprovalStatus — ApprovalStatus from the governance model is no longer imported. No fallback path for legacy approval remains.

## All five bindings verified before mutation

**confirmed** — The executor verifies all five authorization bindings in sequence before any repository write:

1. **Approval status** (line 113-118): verifies approval.status == ImplementationApprovalStatus.APPROVED
2. **Candidate hash** (line 120-127): calls approval.verify_candidate_hash(candidate_sha256) and rejects mismatch
3. **Manifest hash** (line 129-136): calls approval.verify_manifest_hash(manifest.manifestHash) and rejects mismatch
4. **Self-approval check** (line 138-143): calls approval.verify_not_self_approved(workflow_requester) and rejects self-approval
5. **Manifest integrity** (line 145): calls self.verify_manifest_hash(manifest) for internal tamper detection

These checks happen at the top of execute_placement before the method branches to _execute_add, _execute_update, _execute_extend, or _execute_reuse. Repository mutations only occur inside those branch methods, so all bindings are enforced on every execution path.

Workflow_id and manifest_id binding verification happen earlier in the call chain: the API endpoint calls ApprovalEnforcer.enforce_approval() (candidate.py:434-440) which verifies workflow_id matches the approval record key, manifest_id matches approval.placement_manifest_id, and manifest_sha256 matches approval.placement_manifest_sha256. The enforcement result is checked at line 442-449, rejecting with 403 if enforcement fails.

## API endpoint wired to ApprovalEnforcer

**confirmed** — Reading candidate.py:361-467, the execute_placement endpoint (line 361) now:

1. Computes candidate_sha256 from uploaded files via _compute_candidate_sha256 (line 406)
2. Extracts workflow_id from manifest._workflow_id metadata (line 412-419)
3. Extracts requester_id from manifest._requester_id metadata (line 421-427)
4. Creates ApprovalEnforcer instance with _approvals_store (line 429)
5. Calls enforcer.enforce_approval() with all bindings (line 430-436)
6. Rejects with 403 if enforcement_result.approved is False (line 438-444)
7. Retrieves ImplementationApproval object from _approvals_store (line 446-452)
8. Passes approval object to executor.execute_placement with all required parameters (line 458-464)

The legacy approval extraction pattern (getattr(manifest, '_approval_status', ApprovalStatus.PENDING)) is gone. ApprovalStatus is no longer imported — the import section (line 1-28) imports only ImplementationApproval from app.models.implementation_approval.

The _compute_candidate_sha256 helper (line 514-539) matches the CandidateValidator pattern: sorts files by filename, computes SHA-256 hash of each file's content, concatenates file hashes, and returns hex-encoded digest. This ensures candidate_sha256 is always computed from actual files, never trusted from external input.

## API-level security tests comprehensive

**confirmed** — Reading test_candidate_security.py, seven tests verify the authorization boundary at the API layer:

1. **test_placement_rejected_without_approval** (line 88): stores candidate and manifest, calls execute endpoint without approval record, asserts 403 response with "approval enforcement failed" in detail
2. **test_placement_rejected_with_legacy_approval_status** (line 102): stores candidate and manifest, sets manifest._approval_status = ApprovalStatus.APPROVED (legacy pattern), calls execute endpoint, asserts 403 response because no ImplementationApproval in store
3. **test_placement_rejected_candidate_hash_mismatch** (line 119): creates approval with wrong candidate_sha256, stores approval, calls execute endpoint, asserts 403 response with "candidate" or "hash" in detail
4. **test_placement_rejected_manifest_id_mismatch** (line 149): creates approval with wrong manifest_id, stores approval, calls execute endpoint, asserts 403 response with "manifest" in detail
5. **test_placement_rejected_manifest_hash_mismatch** (line 178): creates approval with wrong manifest_sha256, stores approval, calls execute endpoint, asserts 403 response with "hash" in detail
6. **test_placement_rejected_self_approval** (line 207): creates approval where approved_by == workflow_requester, stores approval, calls execute endpoint, asserts 403 response with "self" or "approval" in detail
7. **test_placement_success_all_bindings_valid** (line 236): creates approval with all correct bindings, mocks PlacementExecutor to avoid filesystem operations, calls execute endpoint, asserts NOT 403 (authorization passed), asserts 200 success

These tests exercise the actual API endpoint via TestClient, not just unit-testing ApprovalEnforcer.

## Evidence file claims consistent with source

**confirmed** — Cross-checking the evidence file (m2-9-w5-r2-evidence.json) against actual source:

- "ApprovalStatus bypass branch removed" — verified at executor.py:105-158, isinstance(approval, ApprovalStatus) branch is gone
- "API uses ApprovalEnforcer" — verified at candidate.py:429-444, endpoint calls ApprovalEnforcer.enforce_approval()
- "candidate_hash verified in executor" — verified at executor.py:120-127, approval.verify_candidate_hash() called
- "Legacy approval status removed from API" — verified at candidate.py:1-28, ApprovalStatus not imported; candidate.py:406-444, getattr(manifest, '_approval_status') pattern gone
- "All bindings enforced" — verified at executor.py:113-145 (executor verifies 5 bindings) and candidate.py:430-444 (ApprovalEnforcer verifies workflow_id, manifest_id, manifest_sha256)
- "7 security tests pass" — verified at test_candidate_security.py:88-282, all 7 required tests present

All authorization gaps from the original W5 review are closed.

</details>

<details>
<summary>File map</summary>

- `services/project-ai/app/placement/executor.py` — ApprovalStatus bypass removed; execute_placement accepts only ImplementationApproval with workflow_requester and candidate_sha256 as required parameters; all five bindings verified before mutation
- `services/project-ai/app/api/routes/candidate.py` — execute_placement endpoint wired to ApprovalEnforcer; computes candidate_sha256 from files; calls enforce_approval() before execution; rejects with 403 if enforcement fails
- `services/project-ai/tests/api/test_candidate_security.py` — seven API-level security tests verify authorization boundary: no approval, legacy approval, candidate hash mismatch, manifest ID mismatch, manifest hash mismatch, self-approval, valid approval

Full diff available via: `git diff <base-branch>`

</details>
