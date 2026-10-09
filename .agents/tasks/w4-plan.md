# W4 Implementation Plan: Human Gate 2 - Implementation Approval

**Task:** Add implementation approval endpoints and integrate with M2.9 canonical workflow.

**Context:** The approval logic, domain models, and database schema already exist. The workflow state machine includes `AWAITING_IMPLEMENTATION_APPROVAL` state with transitions to `IMPLEMENTING` (approved) or `REJECTED` (rejected). The `can_transition_to_implementing_async()` guard function exists in `canonical_workflow.py`. The approval endpoint `/approvals/workflows/{workflow_id}/approve-placement` exists in `governance.py` and already implements the full approval flow with PostgreSQL persistence. This task verifies completeness and adds comprehensive integration tests.

## Implementation Plan

- [ ] 1. **Verify existing approval endpoint completeness in `governance.py`**
      
      Review `/approvals/workflows/{workflow_id}/approve-placement` endpoint to ensure it covers all requirements:
      - POST endpoint accepts `WorkflowApprovalPayload` with workflow_id, manifest_hash, contract_hash, candidate_sha256, placement_manifest_id, approved (bool), approved_by, reason
      - Validates workflow is in `AWAITING_IMPLEMENTATION_APPROVAL` state
      - Verifies manifest hash, contract hash, candidate hash, and manifest ID match workflow bindings
      - Rejects self-approval (approved_by != workflow_requester)
      - Creates `ImplementationApproval` record with PostgreSQL persistence via `ApprovalRepository`
      - Transitions workflow to `IMPLEMENTING` (if approved=True) or `REJECTED` (if approved=False) via `WorkflowGovernanceService`
      - Returns `WorkflowApprovalResponse` with verification results
      - GET endpoint `/approvals/workflows/{workflow_id}/implementation-approval` retrieves approval record
      
      **Files:** `services/project-ai/app/api/routes/governance.py`
      
      **Verify:** Read the file and confirm all logic exists. No changes needed if complete.

- [ ] 2. **Add approval status query endpoint (if missing)**
      
      If not present, add GET endpoint to check approval status before submission. Endpoint: `GET /approvals/workflows/{workflow_id}/status` returning `{"workflow_id": str, "state": str, "has_approval": bool, "approval_status": str | null, "approved_by": str | null}`.
      
      Uses `WorkflowGovernanceService.get_workflow()` to get current state and `ApprovalRepository.get_by_workflow()` to check for existing approval.
      
      **Files:** `services/project-ai/app/api/routes/governance.py`
      
      **Verify:** `pytest services/project-ai/tests/unit/ -k approval -v` — unit tests pass.

- [ ] 3. **Create Pydantic response schemas for approval endpoints**
      
      Create `services/project-ai/app/api/schemas/governance.py` if missing, or verify it contains:
      - `ApprovalSubmitRequest` (already exists for manifest approval)
      - `ApprovalSubmitResponse` (already exists)
      - `ApprovalDecisionRequest` (already exists)
      - `ApprovalRecord` (already exists)
      - `ApprovalRejectRequest` (already exists)
      - `WorkflowApprovalStatusResponse` (add if status endpoint created in step 2)
      
      Match patterns from `app/api/schemas/workflow.py` (uses Pydantic BaseModel with Field descriptions).
      
      **Files:** `services/project-ai/app/api/schemas/governance.py`
      
      **Verify:** `python -c "from app.api.schemas.governance import WorkflowApprovalStatusResponse; print('OK')"` succeeds.

- [ ] 4. **Create integration test file with 10+ test cases**
      
      Create `services/project-ai/tests/integration/test_implementation_approval.py` covering:
      
      1. **Happy path: Approve placement** — Workflow in `AWAITING_IMPLEMENTATION_APPROVAL`, valid hashes, different approver, transitions to `IMPLEMENTING`, approval record persisted
      2. **Happy path: Reject placement** — Same setup, approved=False, transitions to `REJECTED`, rejection reason recorded
      3. **Self-approval rejection** — approved_by == workflow_requester, returns 403, workflow stays in `AWAITING_IMPLEMENTATION_APPROVAL`, rejection audit trail recorded
      4. **Wrong state rejection** — Workflow in `REQUESTED` (not `AWAITING_IMPLEMENTATION_APPROVAL`), returns 409 with WRONG_STATE error
      5. **Manifest hash mismatch** — provided manifest_hash != workflow.manifest_sha256, returns 409 with APPROVAL_INVALID error
      6. **Contract hash mismatch** — provided contract_hash != workflow.contract_sha256, returns 409 with CONTRACT_CHANGED error
      7. **Candidate hash mismatch** — provided candidate_sha256 != workflow.candidate_sha256, returns 400 with CANDIDATE_HASH_MISMATCH error
      8. **Manifest ID mismatch** — provided placement_manifest_id != workflow.manifest_id, returns 409 with MANIFEST_ID_MISMATCH error
      9. **Workflow not found** — workflow_id doesn't exist, returns 404
      10. **Approval record retrieval** — GET `/approvals/workflows/{workflow_id}/implementation-approval` returns persisted approval evidence after approval
      11. **State transition audit trail** — After approval, workflow.state_history contains transition record with evidence_id = approval_id
      12. **Approval persistence across sessions** — Approve workflow, close session, reopen, verify approval record still exists with correct data (tests restart persistence)
      
      Use `@pytest.mark.integration` and `@pytest.mark.asyncio` decorators. Follow pattern from `tests/integration/test_restart_persistence.py` using `db_session_factory` fixture.
      
      **Files:** `services/project-ai/tests/integration/test_implementation_approval.py`
      
      **Verify:** `pytest services/project-ai/tests/integration/test_implementation_approval.py -v --tb=short` — all 12 tests pass (or skip if TEST_DATABASE_URL_TUTORIAL not configured).

- [ ] 5. **Add unit tests for `can_transition_to_implementing_async()` guard**
      
      Create `services/project-ai/tests/unit/test_canonical_workflow_guards.py` with tests for:
      
      1. Guard passes when all conditions met (approval exists, status=APPROVED, hashes match, not self-approved)
      2. Guard fails when approval missing
      3. Guard fails when approval status != APPROVED
      4. Guard fails when candidate hash mismatch
      5. Guard fails when manifest hash mismatch
      6. Guard fails when manifest ID mismatch
      7. Guard fails when self-approved (approved_by == workflow_requester)
      8. Guard fails when requester_id parameter missing
      9. Guard fails when candidate_sha256 parameter missing
      10. Guard fails when manifest_id parameter missing
      11. Guard fails when manifest_sha256 parameter missing
      
      Use mock `ApprovalRepository` to control approval record responses. Follow pattern from `tests/unit/test_approval_gate.py`.
      
      **Files:** `services/project-ai/tests/unit/test_canonical_workflow_guards.py`
      
      **Verify:** `pytest services/project-ai/tests/unit/test_canonical_workflow_guards.py -v` — all tests pass.

- [ ] 6. **Verify authorization checker integration**
      
      Review `app/authorization/approval_checker.py` to confirm `check_implementation_approval_async()` is used by placement executor. The function should:
      - Accept workflow_id, candidate_sha256, manifest_sha256, approval_repo, requester_id
      - Return `AuthorizationResult` with authorized=True/False
      - Validate all required parameters present
      - Query approval via `approval_repo.get_by_workflow(workflow_id)`
      - Verify approval status, candidate hash, manifest hash, manifest ID, and self-approval check
      - Return failure_reason and evidence dict on any check failure
      
      Confirm placement executor imports and calls this function before writing files.
      
      **Files:** `services/project-ai/app/authorization/approval_checker.py`, `services/project-ai/app/placement/` (find placement executor)
      
      **Verify:** `grep -r "check_implementation_approval_async" services/project-ai/app/placement/` shows usage. If not found, document finding in plan output.

- [ ] 7. **Add API documentation and examples**
      
      Update `services/project-ai/README.md` with Wave 4 section documenting:
      - Implementation approval endpoints (POST approve-placement, GET implementation-approval, GET status if added)
      - Request/response examples with curl commands
      - Security gates (self-approval prevention, hash verification)
      - State transitions (AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING/REJECTED)
      - Error codes (403 self-approval, 409 hash mismatch, 404 not found, 400 wrong state)
      
      Follow format of existing "M2.9 Wave 3" section in README.
      
      **Files:** `services/project-ai/README.md`
      
      **Verify:** Read the updated section and confirm clarity. No automated check.

- [ ] 8. **Run full test suite to verify no regressions**
      
      Execute complete test suite for project-ai service including unit tests, integration tests (if PostgreSQL configured), and approval-specific tests.
      
      **Verify:** 
      - `pytest services/project-ai/tests/unit/ -v --tb=short` — all unit tests pass
      - `pytest services/project-ai/tests/integration/ -v --tb=short` — integration tests pass or skip gracefully
      - `pytest services/project-ai/tests/ -k "approval" -v` — all approval-related tests pass

- [ ] 9. **Generate test execution report**
      
      Run pytest with coverage and JUnit XML output to document test results:
      
      ```bash
      cd services/project-ai
      pytest tests/ -v --tb=short --junitxml=test-results-w4.xml --cov=app --cov-report=html --cov-report=term
      ```
      
      Save test report to `.agents/tasks/w4-test-report.txt` containing:
      - Test summary (passed/failed/skipped counts)
      - Coverage percentage for approval-related modules
      - Any failures or errors with details
      
      **Files:** `.agents/tasks/w4-test-report.txt` (test output), `services/project-ai/test-results-w4.xml` (JUnit format)
      
      **Verify:** Test report exists and shows >80% coverage for approval modules.

- [ ] 10. **Verify database schema alignment**
      
      Confirm `project_ai_approvals` table exists in PostgreSQL with columns matching `ApprovalModel` ORM in `app/persistence/models.py`:
      - approval_id (varchar primary key)
      - workflow_id (varchar unique index)
      - candidate_sha256 (varchar)
      - placement_manifest_id (varchar)
      - placement_manifest_sha256 (varchar)
      - target_family (varchar)
      - target_version (varchar)
      - approved_by (varchar)
      - approval_timestamp (timestamp)
      - status (varchar)
      - workflow_requester (varchar)
      - evidence (jsonb)
      - rejection_reason (text nullable)
      - created_at, updated_at (timestamps)
      
      Check Drizzle schema in `packages/db-tutorial/src/schema/project-ai-persistence.ts` matches ORM.
      
      **Files:** `packages/db-tutorial/src/schema/project-ai-persistence.ts`, `services/project-ai/app/persistence/models.py`
      
      **Verify:** Read both files and confirm column names and types match. Document any mismatches.

## Test Execution Commands

All tests use pytest. Integration tests require PostgreSQL with `TEST_DATABASE_URL_TUTORIAL` environment variable set.

```bash
# Change to project-ai directory
cd services/project-ai

# Run all unit tests
pytest tests/unit/ -v --tb=short

# Run integration tests (requires PostgreSQL)
pytest tests/integration/ -v --tb=short

# Run approval-specific tests
pytest tests/ -k "approval" -v

# Run new W4 integration tests
pytest tests/integration/test_implementation_approval.py -v --tb=short

# Run with coverage
pytest tests/ --cov=app.api.routes.governance --cov=app.authorization.approval_checker --cov=app.orchestration.canonical_workflow --cov-report=term --cov-report=html

# Generate test report for W4
pytest tests/ -v --tb=short --junitxml=test-results-w4.xml --cov=app --cov-report=html --cov-report=term > ../../.agents/tasks/w4-test-report.txt 2>&1
```

## Verification Summary

Each step includes a "Verify" command. After implementation:

1. All endpoints exist and are routed correctly (FastAPI /docs shows them)
2. Unit tests pass for guard functions and authorization checker
3. Integration tests pass (12 tests covering happy path, rejections, hash mismatches, self-approval)
4. No regressions in existing tests (full suite passes)
5. Test coverage >80% for approval modules
6. Database schema matches ORM models
7. README documentation complete with examples

## Dependencies

- **Existing code:** approval_checker.py, implementation_approval.py, canonical_workflow.py, governance.py, ApprovalRepository, WorkflowGovernanceService all exist
- **Database:** PostgreSQL with project_ai_approvals table (migration 0026 already applied)
- **Test infrastructure:** pytest, asyncio support, db_session_factory fixture in conftest.py

## Notes

- The approval endpoint `/approvals/workflows/{workflow_id}/approve-placement` already exists and implements the full flow
- The main work is adding comprehensive integration tests and verifying completeness
- If any endpoint is missing, add it following existing patterns in governance.py
- All state transitions go through WorkflowGovernanceService for audit trail consistency
- Approval records use PostgreSQL persistence (no in-memory fallback for production paths)
