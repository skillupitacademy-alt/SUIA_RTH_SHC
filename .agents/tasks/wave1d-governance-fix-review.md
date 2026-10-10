# Wave 1D Governance Identity Spoofing Fix

Removed client-supplied identity fields from governance approval endpoints and replaced them with JWT-derived identities. This closes a P0 vulnerability where attackers could forge identities, bypass self-approval checks, and poison audit trails.

**Watch for:** Nothing blocking. The identity extraction pattern is consistent across all three endpoints, self-approval prevention now compares two JWT-derived identities, and all 42 security tests pass. The fallback chain (`user_id or email or sub or "unknown"`) handles token format variations without compromising security.

**Verdict**: APPROVED

## High-level view

The fix extracts identities from the `user` parameter (the JWT principal) using a three-tier fallback pattern: `user_id`, `email`, `sub`, or `"unknown"` if all are missing. This replaces the previous pattern where submission and approval endpoints accepted `submittedBy`, `decidedBy`, and `rejectedBy` from the request body. The self-approval check now compares the JWT-derived approver identity against the JWT-derived submitter identity that was stored when the approval was created, so an attacker cannot bypass separation of duties by controlling both field values. All three endpoints (submit, approve, reject) apply the same extraction pattern and use the derived identity for both the stored approval record and the audit trail entry. Request schemas were updated to remove the client-supplied identity fields entirely, making the bypass impossible at the API contract level.

<details>
<summary>Issues (0)</summary>

No blocking or non-blocking issues remain.

</details>

<details>
<summary>Details</summary>

## JWT identity extraction replaces client-supplied fields

All three governance endpoints now extract the caller's identity from the JWT token passed via the `user` dependency parameter. The extraction pattern is identical across all three handlers:

```python
submitted_by = user.get("user_id") or user.get("email") or user.get("sub") or "unknown"
decided_by = user.get("user_id") or user.get("email") or user.get("sub") or "unknown"
rejected_by = user.get("user_id") or user.get("email") or user.get("sub") or "unknown"
```

The diff shows that `submit_for_approval` replaces two references to `request.submittedBy`, `approve_manifest` replaces eight references to `request.decidedBy`, and `reject_manifest` replaces two references to `request.rejectedBy`. No remaining references to client-supplied identity fields exist in the codebase.

## Self-approval prevention uses JWT-derived identities on both sides

The self-approval check was the highest-value attack target because it compared two client-supplied values (`request.decidedBy == approval["submittedBy"]`), allowing trivial bypass. The fixed version compares `decided_by` (extracted from the approver's JWT) against `approval["submittedBy"]` (extracted from the submitter's JWT when the approval was created). An attacker cannot forge either side because both come from cryptographically verified tokens.

Tests confirm that when Alice submits and then Alice attempts to approve, the endpoint returns 403 with `SELF_APPROVAL_REJECTED`. When Alice submits and Bob approves, the endpoint returns 200 with status `APPROVED` and both identities recorded correctly.

## Schema-level enforcement removes bypass surface

The request models `ApprovalSubmitRequest`, `ApprovalDecisionRequest`, and `ApprovalRejectRequest` no longer include `submittedBy`, `decidedBy`, or `rejectedBy` fields. Clients cannot supply identity claims—the framework rejects the request before it reaches the handler.

## Test coverage proves the security model

Four new tests in `test_governance_identity.py` verify the fix:

1. `test_governance_submit_uses_jwt_identity` confirms that submitting with a JWT from `alice@example.com` stores `submittedBy: "alice@example.com"` in the approval record and audit trail, even though the request body contains no `submittedBy` field.

2. `test_governance_approve_prevents_jwt_self_approval` confirms that when Alice submits and Alice attempts to approve using the same JWT, the endpoint rejects with 403 and `SELF_APPROVAL_REJECTED`.

3. `test_governance_approve_allows_different_jwt_identity` confirms that when Alice submits and Bob approves using a different JWT, the approval succeeds and both identities appear correctly in the response.

4. `test_governance_reject_uses_jwt_identity` confirms that rejecting with a JWT from `bob@example.com` stores `decidedBy: "bob@example.com"` in the approval record and audit trail.

</details>

---

<details>
<summary>File map</summary>

**Modified files:**

- `services/project-ai/app/api/routes/governance.py` — Added JWT identity extraction to submit, approve, and reject handlers; replaced 12 client-supplied identity references
- `services/project-ai/app/api/schemas/governance.py` — Removed `submittedBy`, `decidedBy`, and `rejectedBy` fields from request schemas
- `services/project-ai/tests/security/test_governance_identity.py` — New file with 4 JWT identity extraction security tests

**Commit:** 54cf7b32  
**Full diff:** `git show 54cf7b32`

</details>
