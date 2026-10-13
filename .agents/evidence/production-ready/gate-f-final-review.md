# Gate F Integration Verification — Single Domain Failure Blocks Release

Gate F tests the five W6 security domains against the combined changes from Gates D, E-1, and E-2. Four domains pass cleanly. Domain 2 (RBAC Authorization) fails due to a schema mismatch between tests and models: tests expect brand tracking columns that don't exist.

**Watch for:** Database schema gap (confirmed) — 7 authorization tests fail because `CandidateModel` and `WorkflowModel` lack `uploader_brand` and `requester_brand` columns required for multi-tenant brand boundary enforcement.

**Verdict**: CHANGES_REQUESTED

---

## High-level view

Domain 1 (JWT Identity) confirms that governance routes extract user identity from JWT tokens and prevent self-approval using that identity. Domain 3 (W7 Evidence Enforcement) verifies all evidence type requirements, verdict validation, digest checks, and audit trails. Domain 4 (W3C Artifact Policy) validates the full deduplication pipeline including content hashing, version conflict resolution, and canonical selection. Domain 5 (W5 Placement Authorization) confirms placement operations enforce contract admin roles, brand boundaries, and evidence policy at final gates.

Domain 2 (RBAC Authorization) blocks the gate: 12 of 19 tests pass (JWT extraction and malformed token handling work), but 7 tests fail when trying to write brand tracking fields to the database. The tests call `CandidateModel(uploader_brand=...)` and `WorkflowModel(requester_brand=...)`, but SQLAlchemy raises `TypeError: 'uploader_brand' is an invalid keyword argument` because those columns don't exist in `services/project-ai/app/persistence/models.py`.

<details>
<summary>Issues (1)</summary>

1. **Database schema missing brand columns** — Add `uploader_brand: Optional[str]` to `CandidateModel` and `requester_brand: Optional[str]` to `WorkflowModel` in `services/project-ai/app/persistence/models.py`, then create a migration to add these columns to the database schema.

</details>

<details>
<summary>Details</summary>

## Domain 2 schema mismatch blocks 7 authorization tests

Domain 2 tests exercise brand boundary enforcement across candidate upload, workflow execution, and cross-brand access. The JWT extraction tests and malformed token tests pass (12/19), confirming the identity plumbing works. The brand enforcement tests fail because the SQLAlchemy models don't match what the tests expect.

The failures cluster into three categories:

**Candidate brand tracking** — `test_candidate_upload_captures_brand`, `test_candidate_execute_same_brand_succeeds`, `test_candidate_execute_cross_brand_denied` all fail when constructing `CandidateModel(uploader_brand=brand)`. The model doesn't have an `uploader_brand` field.

**Workflow brand tracking** — `test_same_brand_workflow_approval_succeeds` fails when constructing `WorkflowModel(requester_brand=brand)`. The model doesn't have a `requester_brand` field.

**Privileged bypass logic** — `test_null_brand_candidate_requires_privileged_role`, `test_candidate_execute_infrastructure_bypass`, `test_infrastructure_user_cross_brand_access_succeeds` fail for the same reason: they try to set brand fields that don't exist.

The error message is consistent across all failures: `TypeError: 'uploader_brand' is an invalid keyword argument for CandidateModel`. This is SQLAlchemy rejecting unknown kwargs. The tests were written assuming these columns exist; the models don't have them.

The fix is surgical: add the two missing columns to the models and write a migration. No logic changes required. The tests already cover the authorization checks; they just can't run until the schema matches.



</details>

<details>
<summary>File map</summary>

No files were changed in this review pass. This is a verification gate reading captured test output.

**Evidence artifacts:**
- `.agents/evidence/gate-f-w6-domain-results-final.json` — Domain pass/fail summary
- `.agents/tasks/gate-f-integration-report-final.md` — Detailed integration report
- `.agents/evidence/gate-f-full-test-output-final.txt` — Raw pytest output

</details>
