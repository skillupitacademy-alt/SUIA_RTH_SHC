# M2.9 Wave 4 Implementation Plan: Human Implementation Approval Gate

**Branch:** m2-project-ai-canonical-wiring  
**W3 Baseline Commits:** 5aca876b (preflight fix), 22214ef6 (W3 implementation)  
**Service Root:** e:\onlinewebsites\quiz-platform/services/project-ai/

---

## Preflight Summary

**Status:** PASS  
**W3 Verified:** Commits 5aca876b and 22214ef6 exist. W3 gate shows PASS with all components (CandidateValidator, CanonicalComparator, PlacementManifestGenerator) fully implemented with real validation logic, evidence population, and manifest sealing.

**Key Findings:**
- CanonicalWorkflowState already defines AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING transition
- governance.py already has a stub approve-placement endpoint with WAVE 4 comment marker
- Stub includes correct verification gates: manifest hash, contract hash, state enforcement, self-approval prevention
- No ImplementationApproval model exists yet (must create)
- No app/authorization/ module exists yet (must create)
- PlacementManifest.manifest_sha256 seal exists (W3 implementation)
- ValidationResult.sha256 hash exists (W3 implementation)

---

## Implementation Plan

### Phase 1: ImplementationApproval Domain Model

- [ ] 1. Create ImplementationApproval domain model in services/project-ai/app/models/implementation_approval.py
      
      **What to implement:**
      - Create Python dataclass `ImplementationApproval` with fields:
        * `approval_id: str` (UUID, primary key)
        * `workflow_id: str` (UUID, foreign key to workflow)
        * `candidate_sha256: str` (must match ValidationResult.sha256)
        * `target_family: str` (e.g., "Introduction")
        * `target_version: str` (e.g., "I7")
        * `placement_manifest_id: str` (UUID from PlacementManifest.manifest_id)
        * `placement_manifest_sha256: str` (must match PlacementManifest.manifest_sha256)
        * `approved_by: str` (approver identity, cannot equal workflow requester)
        * `approval_timestamp: datetime` (ISO 8601 UTC)
        * `status: ApprovalStatus` (enum: PENDING, APPROVED, REJECTED)
        * `evidence: Dict[str, Any]` (machine-readable approval evidence)
        * `rejection_reason: Optional[str]` (populated if status=REJECTED)
      
      - Create enum `ApprovalStatus` with values: PENDING, APPROVED, REJECTED
      
      - Add validation methods:
        * `verify_manifest_hash(manifest: PlacementManifest) -> bool`: Compare placement_manifest_sha256 with manifest.manifest_sha256
        * `verify_candidate_hash(validation: ValidationResult) -> bool`: Compare candidate_sha256 with validation.sha256
        * `verify_not_self_approved(requester: str) -> bool`: Ensure approved_by != requester
        * `is_valid_for_implementation() -> bool`: All hashes match AND status=APPROVED AND not self-approved
      
      - Add evidence population method:
        * `to_evidence_dict() -> Dict[str, Any]`: Convert to machine-readable evidence format matching W3 pattern
      
      **Files:**
      - CREATE: services/project-ai/app/models/implementation_approval.py
      - UPDATE: services/project-ai/app/models/__init__.py (add imports)
      
      **Architectural notes:**
      - Follow W3 evidence pattern: all evidence fields populated, no empty dicts on success
      - Timestamp in ISO 8601 format with timezone (datetime.now(timezone.utc).isoformat())
      - Immutable fields after approval granted: all hash/ID fields
      - Follow dataclass pattern from placement_manifest.py and candidate_validator.py
      
      **Verify:**
      ```bash
      pytest tests/test_implementation_approval.py::test_approval_model_creation -v
      pytest tests/test_implementation_approval.py::test_hash_verification -v
      pytest tests/test_implementation_approval.py::test_self_approval_detection -v
      ```

---

### Phase 2: Approval API Endpoint Completion

- [ ] 2. Complete the approve-placement endpoint stub in services/project-ai/app/api/routes/governance.py
      
      **What to implement:**
      - The stub endpoint `POST /approvals/workflows/{workflow_id}/approve-placement` already exists with correct structure
      - Extend WorkflowApprovalPayload to include additional fields:
        * `candidate_sha256: str` (for candidate hash verification)
        * `placement_manifest_id: str` (for manifest ID binding)
      - Update endpoint implementation:
        * Create ImplementationApproval record when approval granted
        * Store approval record in _workflow_states or new _implementation_approvals dict
        * Add candidate_sha256 verification (must match workflow's stored candidate hash)
        * Add placement_manifest_id verification (must match workflow's stored manifest ID)
        * Keep existing manifest_hash and contract_hash verification
        * Keep existing self-approval prevention logic
        * Populate evidence dict with verification results
      - Add GET endpoint for approval status: `GET /approvals/workflows/{workflow_id}/implementation-approval`
        * Returns ImplementationApproval record if exists
        * Returns 404 if no approval record found
      
      **Files:**
      - UPDATE: services/project-ai/app/api/routes/governance.py
      - UPDATE: services/project-ai/app/api/schemas/governance.py (if new response models needed)
      
      **Error responses to implement:**
      - 400: Invalid hash (candidate_sha256 or manifest_sha256 mismatch)
      - 403: Self-approval attempt (approved_by == workflow requester)
      - 409: Wrong state (workflow not in AWAITING_IMPLEMENTATION_APPROVAL)
      - 409: Manifest ID mismatch
      - 422: Validation error (missing fields)
      
      **Architectural notes:**
      - Reuse existing WorkflowApprovalResponse or extend it to include candidate_sha256_verified field
      - Store ImplementationApproval in _implementation_approvals dict for now (in-memory for M2.9, database in M3+)
      - Follow the pattern established by existing approve_manifest() function
      
      **Verify:**
      ```bash
      pytest tests/test_approval_endpoint.py::test_approve_placement_success -v
      pytest tests/test_approval_endpoint.py::test_reject_self_approval -v
      pytest tests/test_approval_endpoint.py::test_manifest_hash_mismatch -v
      pytest tests/test_approval_endpoint.py::test_candidate_hash_mismatch -v
      pytest tests/test_approval_endpoint.py::test_wrong_state_rejection -v
      ```

---

### Phase 3: Workflow Transition Authorization

- [ ] 3. Wire approval verification into canonical workflow transition AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING
      
      **What to implement:**
      - Create new function in services/project-ai/app/orchestration/canonical_workflow.py:
        * `can_transition_to_implementing(workflow_id: str, approvals_store: Dict) -> Tuple[bool, str]`
        * Returns (True, "") if valid approval exists
        * Returns (False, "reason") if approval missing, invalid, or verification fails
      - Add approval verification logic:
        * Check if ImplementationApproval record exists for workflow_id
        * Verify approval.status == APPROVED
        * Verify approval.workflow_id matches
        * Verify all hashes match (candidate_sha256, placement_manifest_sha256)
        * Verify not self-approved
      - Update existing transition validation to call this function before allowing AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING
      - Transition must be BLOCKED if approval is:
        * Missing (no record found)
        * PENDING or REJECTED status
        * Hash mismatch (candidate or manifest tampered)
        * Self-approved
        * Expired (if expiry field exists in approval model)
      
      **Files:**
      - UPDATE: services/project-ai/app/orchestration/canonical_workflow.py
      - MAY CREATE: services/project-ai/app/orchestration/transition_guards.py (if separating guard logic)
      
      **Architectural notes:**
      - Do not create a second workflow engine or state authority
      - CanonicalWorkflowState remains the ONLY lifecycle authority
      - TaskState (if used) remains internal agent execution state only
      - Approval verification is a guard on the existing transition, not a new state machine
      - Follow the pattern of is_valid_transition() but add approval checking
      
      **Verify:**
      ```bash
      pytest tests/test_workflow_transitions.py::test_transition_requires_approval -v
      pytest tests/test_workflow_transitions.py::test_transition_blocked_without_approval -v
      pytest tests/test_workflow_transitions.py::test_transition_blocked_on_hash_mismatch -v
      pytest tests/test_workflow_transitions.py::test_authorized_transition_succeeds -v
      ```

---

### Phase 4: Placement Executor Authorization Hook

- [ ] 4. Create authorization checker module for placement executor
      
      **What to implement:**
      - Create services/project-ai/app/authorization/ directory
      - Create services/project-ai/app/authorization/__init__.py
      - Create services/project-ai/app/authorization/approval_checker.py with:
        * Dataclass `AuthorizationResult` with fields:
          - `authorized: bool`
          - `approval_id: Optional[str]`
          - `checked_at: str` (ISO 8601 timestamp)
          - `failure_reason: Optional[str]`
          - `evidence: Dict[str, Any]` (verification details)
        * Function `check_implementation_approval(workflow_id: str, candidate_sha256: str, manifest_sha256: str, approvals_store: Dict) -> AuthorizationResult`
          - Looks up ImplementationApproval by workflow_id
          - Returns authorized=False if: approval absent, status != APPROVED, hash mismatch, expired (if expiry exists)
          - Returns authorized=True if: approval exists, status=APPROVED, all hashes match, not expired
          - Populates evidence dict with: approval_found, status, hash_matches, timestamp, checked_hashes
        * Function `produce_authorization_evidence(result: AuthorizationResult, workflow_id: str) -> Dict[str, Any]`
          - Converts AuthorizationResult to machine-readable evidence format
          - Returns dict matching W3 evidence pattern
      
      **Files:**
      - CREATE: services/project-ai/app/authorization/__init__.py
      - CREATE: services/project-ai/app/authorization/approval_checker.py
      
      **Architectural notes:**
      - This is the hook that W5 (placement executor) will call before any repository mutation
      - No repository changes in W4 — this is the authorization boundary only
      - Evidence must be machine-readable and include all verification steps
      - Follow W3 pattern: no empty evidence dicts, all fields populated
      - If expiry logic exists in current approval contract, implement expiry checking; otherwise skip
      
      **Verify:**
      ```bash
      pytest tests/test_authorization_checker.py::test_authorization_with_valid_approval -v
      pytest tests/test_authorization_checker.py::test_authorization_blocks_missing_approval -v
      pytest tests/test_authorization_checker.py::test_authorization_blocks_hash_mismatch -v
      pytest tests/test_authorization_checker.py::test_authorization_evidence_populated -v
      ```

---

### Phase 5: Test Suite

- [ ] 5. Create comprehensive W4 test suite
      
      **What to implement:**
      - CREATE: services/project-ai/tests/test_implementation_approval.py
        * Test approval model creation with all required fields
        * Test hash verification methods (verify_manifest_hash, verify_candidate_hash)
        * Test self-approval detection (verify_not_self_approved)
        * Test is_valid_for_implementation logic
        * Test evidence dict population (to_evidence_dict)
      
      - CREATE: services/project-ai/tests/test_approval_endpoint.py
        * Test approve-placement endpoint with valid approval
        * Test self-approval rejection (approved_by == requester)
        * Test manifest hash mismatch rejection
        * Test candidate hash mismatch rejection
        * Test manifest ID mismatch rejection
        * Test wrong state rejection (not in AWAITING_IMPLEMENTATION_APPROVAL)
        * Test GET implementation-approval endpoint (found and not found cases)
      
      - CREATE: services/project-ai/tests/test_workflow_transitions.py
        * Test transition AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING requires valid approval
        * Test transition blocked when approval missing
        * Test transition blocked when approval status != APPROVED
        * Test transition blocked when candidate hash mismatch
        * Test transition blocked when manifest hash mismatch
        * Test transition succeeds with valid approval
        * Test transition produces evidence
      
      - CREATE: services/project-ai/tests/test_authorization_checker.py
        * Test check_implementation_approval with valid approval (authorized=True)
        * Test check blocks missing approval (authorized=False)
        * Test check blocks wrong status (PENDING or REJECTED)
        * Test check blocks candidate hash mismatch
        * Test check blocks manifest hash mismatch
        * Test check blocks expired approval (if expiry exists)
        * Test authorization evidence population
        * Test produce_authorization_evidence format
      
      **Files:**
      - CREATE: services/project-ai/tests/test_implementation_approval.py
      - CREATE: services/project-ai/tests/test_approval_endpoint.py
      - CREATE: services/project-ai/tests/test_workflow_transitions.py
      - CREATE: services/project-ai/tests/test_authorization_checker.py
      
      **Test requirements:**
      - Follow W3 test pattern: use real assertions (pytest.raises, assert conditions)
      - No @pytest.mark.skip or @pytest.mark.xfail
      - No mocked passes without verification
      - Test both success and failure paths
      - Verify evidence dict is populated in all cases
      - Use pytest-asyncio for async endpoint tests
      - Use httpx.AsyncClient for API endpoint tests (pattern from existing tests)
      
      **Verify:**
      ```bash
      pytest tests/test_implementation_approval.py -v
      pytest tests/test_approval_endpoint.py -v
      pytest tests/test_workflow_transitions.py -v
      pytest tests/test_authorization_checker.py -v
      ```

---

### Phase 6: W4 Gate Evidence and Verification

- [ ] 6. Run W4 test suite and produce W4 gate evidence
      
      **What to implement:**
      - Run all W4-specific tests:
        ```bash
        pytest tests/test_implementation_approval.py tests/test_approval_endpoint.py tests/test_workflow_transitions.py tests/test_authorization_checker.py -v --tb=short
        ```
      - Run full regression suite:
        ```bash
        pytest tests/ -v --tb=short
        ```
      - Separate pre-existing failures from W4 regressions (W3 had 13 pre-existing failures)
      - Create W4 evidence file: .agents/tasks/m2-9-w4-evidence.json with structure:
        ```json
        {
          "status": "COMPLETE",
          "commit": "<git_sha>",
          "w3_baseline": {"commits": ["5aca876b", "22214ef6"], "verified": true},
          "test_results": {
            "implementation_approval": {"passed": N, "failed": 0, "output": "..."},
            "approval_endpoint": {"passed": N, "failed": 0, "output": "..."},
            "workflow_transitions": {"passed": N, "failed": 0, "output": "..."},
            "authorization_checker": {"passed": N, "failed": 0, "output": "..."},
            "full_suite": {"passed": N, "failed": N, "output": "pre-existing failures documented"}
          },
          "approval_example": {
            "approval_id": "uuid",
            "workflow_id": "uuid",
            "candidate_sha256": "hash",
            "placement_manifest_sha256": "hash",
            "approved_by": "user",
            "status": "APPROVED",
            "evidence": {...}
          },
          "authorization_example": {
            "authorized": true,
            "approval_id": "uuid",
            "checked_at": "ISO8601",
            "evidence": {...}
          },
          "transition_verification": {
            "unauthorized_blocked": true,
            "self_approval_blocked": true,
            "hash_mismatch_blocked": true,
            "valid_approval_succeeds": true
          },
          "architectural_compliance": {
            "no_pass_without_evidence": true,
            "no_test_weakening": true,
            "single_state_authority": true,
            "machine_readable_evidence": true
          }
        }
        ```
      - Create W4 gate review: .agents/tasks/m2-9-w4-gate.json with gate checks matching W3 pattern:
        * approval_model_non_stub
        * endpoint_completes_stub
        * transition_guarded
        * authorization_hook_created
        * tests_pass
        * no_graceful_degradation
        * no_test_weakening
        * evidence_populated
        * commit_exists
      
      **Files:**
      - CREATE: .agents/tasks/m2-9-w4-evidence.json
      - CREATE: .agents/tasks/m2-9-w4-gate.json
      - CREATE: .agents/tasks/m2-9-w4-gate-review.md (human-readable gate summary)
      
      **Architectural notes:**
      - Follow W3 evidence pattern exactly (structure, field names, completeness)
      - Record Git commit SHA after all changes committed
      - No graceful degradation: missing approval must return error, not PASS
      - Evidence must prove: self-approval rejected, hash binding verified, unauthorized transition blocked
      - Verification must cover canonical transition: AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING only with valid approval
      
      **Verify:**
      ```bash
      # Verify evidence files exist and are valid JSON
      python -m json.tool .agents/tasks/m2-9-w4-evidence.json
      python -m json.tool .agents/tasks/m2-9-w4-gate.json
      
      # Verify Git commit recorded
      git log -1 --oneline
      
      # Verify W4 gate verdict
      cat .agents/tasks/m2-9-w4-gate.json | grep '"w5_ready"'
      ```

---

## Verification Commands

After each phase:

1. **Unit tests for that phase:**
   ```bash
   pytest tests/test_<module>.py -v --tb=short
   ```

2. **Relevant regression tests:**
   ```bash
   pytest tests/ -k "<relevant_pattern>" -v
   ```

3. **Full test suite (end of W4):**
   ```bash
   pytest tests/ -v --tb=short
   ```

4. **Linting (if available):**
   ```bash
   cd services/project-ai
   flake8 app/models/implementation_approval.py app/authorization/ --max-line-length=100
   ```

5. **Type checking (if available):**
   ```bash
   cd services/project-ai
   mypy app/models/implementation_approval.py app/authorization/ --ignore-missing-imports
   ```

---

## W4 Completion Criteria

W4 is COMPLETE when:

1. ✅ ImplementationApproval model created with all required fields and validation methods
2. ✅ Approval endpoint completed/extended in governance.py with all security gates
3. ✅ Workflow transition AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING requires valid approval
4. ✅ Placement executor authorization hook created in app/authorization/approval_checker.py
5. ✅ All W4 tests pass (implementation_approval, approval_endpoint, workflow_transitions, authorization_checker)
6. ✅ No W4 regressions in full test suite (pre-existing failures documented separately)
7. ✅ Machine-readable evidence produced in .agents/tasks/m2-9-w4-evidence.json
8. ✅ W4 gate verdict produced in .agents/tasks/m2-9-w4-gate.json
9. ✅ Git commit created with W4 implementation
10. ✅ Evidence proves: self-approval rejected, hash binding verified, unauthorized transition blocked

---

## W4 Does NOT Include

**Out of scope for W4 (these belong to W5 or later):**

- ❌ Repository file placement (W5)
- ❌ Git worktree creation (W5)
- ❌ Git commit execution (W5)
- ❌ Runtime verification (W6)
- ❌ Browser verification (W6)
- ❌ Certification gates (W6)
- ❌ Final HAA gate (W7)
- ❌ Merge to main (W7)

W4 establishes the authorization boundary. W5 implements the repository mutation mechanism behind that boundary.

---

## Architectural Constraints

1. **Single State Authority:** CanonicalWorkflowState is the ONLY workflow lifecycle authority. TaskState (if used) remains internal agent execution state only. Do NOT create a second workflow engine.

2. **Evidence Requirements:** All approval decisions and authorization checks MUST produce machine-readable evidence. Missing or invalid evidence MUST NOT produce PASS. Follow W3 pattern: evidence dict always populated, no empty dicts on success.

3. **No Graceful Degradation:** Missing approval, invalid approval, hash mismatch, or self-approval MUST return error, NOT warning-then-PASS. Placement executor MUST NOT proceed without valid authorization.

4. **Hash Binding:** Approval is bound to exact candidate_sha256, placement_manifest_sha256, target_family, target_version, and workflow_id. Any mutation after approval invalidates the approval.

5. **Self-Approval Prevention:** approved_by MUST NOT equal workflow requester. This is enforced at endpoint level (403 error) AND at authorization checker level (authorized=False).

6. **Immutability:** All hash and ID fields in ImplementationApproval are immutable after approval granted. Manifest or candidate tampering detected via hash verification.

7. **No Repository Access:** W4 does NOT touch the repository, create worktrees, or write files. W4 only establishes the authorization boundary that W5 will respect.

---

## Notes

- Preflight PASS: W3 baseline verified, governance stub ready, canonical workflow states defined
- Existing stub quality: High (correct verification gates, security boundaries, state enforcement)
- Test framework: pytest with pytest-asyncio, following W3 patterns
- Evidence pattern: JSON files in .agents/tasks/ with status, commit, test_results, examples, architectural_compliance
- Branch: m2-project-ai-canonical-wiring (already checked out)
- W4 establishes authorization boundary; W5 implements repository mutation behind it
