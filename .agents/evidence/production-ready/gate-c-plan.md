# Implementation Plan: Gate C W7 Evidence Enforcement

**Task**: Implement evidence_policy.py with W7 certification evidence enforcement for the project-ai service final gate approval endpoint.

**Context**: W7 certification is COMPLETE. The approve-final endpoint exists at `POST /workflows/{workflow_id}/approve-final` and calls `FinalGateController.compute_verdict()`. Current evidence validation uses gate_results dict keys directly. This task adds explicit evidence policy enforcement with artifact binding, staleness checks, and fail-closed validation.

**Baseline**: Branch `m2-project-ai-canonical-wiring` at SHA `59f15424`

**Test Framework**: pytest with pytest-asyncio for integration tests  
**Build Command**: `pytest tests/` (runs all tests)  
**Verification Pattern**: Run affected test modules after each change

---

## Implementation Steps

- [ ] 1. Create evidence_policy.py module with domain models and validation logic
      
      **What**: Create `services/project-ai/app/governance/evidence_policy.py` with:
      - `EvidenceResult` dataclass: evidence_type (str), verdict (str), workflow_id (str), artifact_sha256 (str), created_at (datetime), evidence_id (str)
      - `EvidencePolicy` dataclass: required_types (frozenset[str]), max_age_seconds (int)
      - `FINAL_GATE_POLICY` constant: required_types={"certification_gates", "runtime_verification", "canonical_comparison", "placement_approval"}, max_age_seconds=86400 (24 hours)
      - `validate_final_gate_evidence()` function implementing all validation rules:
        * Missing required types → error
        * Unaccepted verdict values (accepted: PASS, APPROVED, CERTIFICATION_READY) → error
        * Workflow ID mismatch (evidence.workflow_id != expected) → error
        * Artifact SHA256 mismatch (evidence.artifact_sha256 != expected) → error
        * Staleness (now - created_at > max_age_seconds) → error
        * Future timestamps (created_at > now) → error
        * Fail-closed: any validation error blocks approval
      - Return type: list[str] (empty list if valid, error messages if invalid)
      
      **Files**: 
      - `services/project-ai/app/governance/evidence_policy.py` (create new)
      
      **Verify**: 
      ```bash
      python -c "from app.governance.evidence_policy import EvidenceResult, EvidencePolicy, validate_final_gate_evidence, FINAL_GATE_POLICY; print('Module loads successfully')"
      ```
      Expected: No import errors, prints success message

- [ ] 2. Add unit tests for evidence_policy module
      
      **What**: Create `services/project-ai/tests/unit/test_evidence_policy.py` with test scenarios:
      - test_valid_evidence_passes_all_checks: All evidence valid → empty error list
      - test_missing_required_type_fails: Missing "certification_gates" → error
      - test_invalid_verdict_fails: verdict="FAIL" → error (only PASS/APPROVED/CERTIFICATION_READY accepted)
      - test_workflow_id_mismatch_fails: evidence.workflow_id != expected → error
      - test_artifact_sha256_mismatch_fails: evidence.artifact_sha256 != expected → error
      - test_stale_evidence_fails: created_at 25 hours ago → error (max 24 hours)
      - test_future_timestamp_fails: created_at in future → error
      - test_multiple_errors_accumulated: Multiple violations → all errors returned
      - test_final_gate_policy_constants: FINAL_GATE_POLICY has correct required_types and max_age
      
      Use pytest fixtures for mock evidence objects. Follow pattern from `tests/unit/test_workflow_governance.py`.
      
      **Files**: 
      - `services/project-ai/tests/unit/test_evidence_policy.py` (create new)
      
      **Verify**: 
      ```bash
      pytest tests/unit/test_evidence_policy.py -v
      ```
      Expected: All 9 unit tests pass

- [ ] 3. Integrate evidence_policy into approve-final endpoint
      
      **What**: Modify `services/project-ai/app/api/routes/workflows.py` POST `/{workflow_id}/approve-final` handler:
      - Import: `from app.governance.evidence_policy import validate_final_gate_evidence, FINAL_GATE_POLICY, EvidenceResult`
      - Add validation BEFORE `FinalGateController.compute_verdict()` call (line ~550, after getting workflow, before evidence verification)
      - Convert gate_results dict entries to EvidenceResult objects:
        ```python
        evidence_list = []
        for evidence_type, evidence_data in (workflow.gate_results or {}).items():
            if isinstance(evidence_data, dict):
                evidence_list.append(EvidenceResult(
                    evidence_type=evidence_type,
                    verdict=evidence_data.get('status', 'UNKNOWN'),
                    workflow_id=workflow_id,
                    artifact_sha256=workflow.candidate_sha256 or "",
                    created_at=evidence_data.get('timestamp', datetime.now(timezone.utc)),
                    evidence_id=evidence_data.get('evidence_id', f"ev-{evidence_type}")
                ))
        ```
      - Call validate_final_gate_evidence(workflow_id, workflow.candidate_sha256 or "", evidence_list, FINAL_GATE_POLICY)
      - If validation errors returned, raise HTTPException(409, detail={code: "FINAL_GATE_EVIDENCE_REJECTED", errors: [...], workflow_id: workflow_id})
      - Existing FinalGateController.compute_verdict() call remains unchanged
      
      **Design Decision**: Add evidence validation as explicit step before existing gate verdict computation. This creates defense-in-depth: evidence_policy enforces artifact binding/staleness/workflow binding, FinalGateController enforces gate pass/fail logic. Both checks must pass.
      
      **Files**: 
      - `services/project-ai/app/api/routes/workflows.py` (modify)
      
      **Verify**: 
      ```bash
      python -c "from app.api.routes.workflows import router; print('Routes module loads successfully')"
      pytest tests/integration/test_final_gate.py::test_final_approval_submission_success -v
      ```
      Expected: Module loads, existing integration test still passes

- [ ] 4. Add security tests for evidence enforcement
      
      **What**: Create `services/project-ai/tests/security/test_evidence_enforcement.py` with 17 test scenarios:
      
      **Test Function Names** (following pattern from test_authorization.py):
      - test_ev01_valid_evidence_all_gates_pass: All evidence valid, verdicts PASS → approve succeeds
      - test_ev02_missing_certification_gates_rejected: certification_gates missing → HTTP 409
      - test_ev03_missing_runtime_verification_rejected: runtime_verification missing → HTTP 409
      - test_ev04_missing_canonical_comparison_rejected: canonical_comparison missing → HTTP 409
      - test_ev05_missing_placement_approval_rejected: placement_approval missing → HTTP 409
      - test_ev06_invalid_verdict_fail_rejected: verdict="FAIL" → HTTP 409
      - test_ev07_invalid_verdict_blocked_rejected: verdict="BLOCKED" → HTTP 409
      - test_ev08_workflow_id_mismatch_rejected: evidence.workflow_id != request workflow_id → HTTP 409
      - test_ev09_artifact_sha256_mismatch_rejected: evidence.artifact_sha256 != workflow.candidate_sha256 → HTTP 409
      - test_ev10_stale_evidence_rejected: created_at 25 hours ago → HTTP 409
      - test_ev11_future_timestamp_rejected: created_at in future → HTTP 409
      - test_ev12_multiple_violations_all_reported: Multiple errors → HTTP 409 with all errors in response
      - test_ev13_partial_evidence_rejected: Only 2 of 4 required types → HTTP 409
      - test_ev14_approved_verdict_accepted: verdict="APPROVED" → approve succeeds
      - test_ev15_certification_ready_verdict_accepted: verdict="CERTIFICATION_READY" → approve succeeds
      - test_ev16_concurrent_certification_race_condition: Two concurrent approval requests with same evidence → one succeeds (idempotent)
      - test_ev17_idempotent_retry_after_success: Retry approval after CERTIFIED → returns existing approval (not error)
      
      **Fixtures** (create in test file):
      - mock_workflow_awaiting_gate2: WorkflowModel in AWAITING_GATE_2 state with valid gate_results
      - mock_evidence_list: List of EvidenceResult objects with all required types
      - mock_governance_service: Mock WorkflowGovernanceService
      
      **Concurrency Test Implementation** (test_ev16):
      - Use asyncio.gather() to send two POST requests simultaneously
      - One should succeed (transitions to CERTIFIED), one should get idempotent response
      - Verify no OptimisticLockError raised, verify final state is CERTIFIED
      
      **Files**: 
      - `services/project-ai/tests/security/test_evidence_enforcement.py` (create new)
      
      **Verify**: 
      ```bash
      pytest tests/security/test_evidence_enforcement.py -v
      ```
      Expected: All 17 security tests pass

- [ ] 5. Add README documentation section
      
      **What**: Add section to `services/project-ai/README.md` after "## M2.9 R3: Durable Persistence Layer" section (around line 450):
      
      ```markdown
      ## Gate C: W7 Evidence Enforcement
      
      ### Evidence Policy Framework
      
      The final gate approval endpoint enforces strict evidence policies to ensure certification integrity:
      
      **Required Evidence Types:**
      - `certification_gates` — Automated compliance gates (UBRC, Brand, Theme)
      - `runtime_verification` — Runtime and browser verification results
      - `canonical_comparison` — Comparison against canonical reference blocks
      - `placement_approval` — Human approval of placement manifest
      
      **Validation Rules:**
      1. **Completeness**: All 4 required evidence types must be present
      2. **Verdict Acceptance**: Only `PASS`, `APPROVED`, or `CERTIFICATION_READY` verdicts accepted
      3. **Workflow Binding**: Evidence must bind to the approving workflow's ID
      4. **Artifact Binding**: Evidence must bind to workflow's candidate SHA-256 hash
      5. **Freshness**: Evidence must be less than 24 hours old (86400 seconds)
      6. **Timestamp Sanity**: Evidence timestamps cannot be in the future
      7. **Fail-Closed**: Any validation failure blocks approval with HTTP 409
      
      **Enforcement Point:**
      - Endpoint: `POST /workflows/{workflow_id}/approve-final`
      - Policy: `FINAL_GATE_POLICY` in `app/governance/evidence_policy.py`
      - Validation: Runs before `FinalGateController.compute_verdict()`
      
      **Error Response (HTTP 409):**
      ```json
      {
        "detail": {
          "code": "FINAL_GATE_EVIDENCE_REJECTED",
          "errors": [
            "Missing required evidence type: certification_gates",
            "Evidence for runtime_verification has stale timestamp (created 26.5 hours ago)"
          ],
          "workflow_id": "wf_abc123"
        }
      }
      ```
      
      **Security Properties:**
      - **Artifact Integrity**: SHA-256 binding prevents evidence from unrelated candidates
      - **Temporal Freshness**: 24-hour max age prevents stale evidence reuse
      - **Workflow Isolation**: Evidence cannot be reused across workflows
      - **Defense in Depth**: evidence_policy + FinalGateController both enforce gates
      
      **Testing:**
      ```bash
      # Unit tests for policy validation logic
      pytest tests/unit/test_evidence_policy.py -v
      
      # Security tests for enforcement
      pytest tests/security/test_evidence_enforcement.py -v
      
      # Integration tests for full workflow
      pytest tests/integration/test_final_gate.py -v
      ```
      ```
      
      **Files**: 
      - `services/project-ai/README.md` (modify, insert after R3 section)
      
      **Verify**: 
      ```bash
      grep -n "Gate C: W7 Evidence Enforcement" services/project-ai/README.md
      ```
      Expected: Line number printed showing section exists

- [ ] 6. Run full test suite and verify all tests pass
      
      **What**: Execute complete test suite to verify no regressions:
      - Unit tests (should include new test_evidence_policy.py)
      - Security tests (should include new test_evidence_enforcement.py)
      - Integration tests (existing test_final_gate.py should still pass)
      - Verify no import errors, no test failures
      
      **Files**: N/A (verification only)
      
      **Verify**: 
      ```bash
      pytest tests/unit/test_evidence_policy.py tests/security/test_evidence_enforcement.py tests/integration/test_final_gate.py -v --tb=short
      ```
      Expected: All tests pass (9 unit + 17 security + existing integration = 26+ tests passing)

---

## Deliverables Checklist

- [ ] `services/project-ai/app/governance/evidence_policy.py` — EvidenceResult, EvidencePolicy, validate_final_gate_evidence(), FINAL_GATE_POLICY
- [ ] `services/project-ai/tests/unit/test_evidence_policy.py` — 9 unit tests for policy validation logic
- [ ] `services/project-ai/tests/security/test_evidence_enforcement.py` — 17 security tests for endpoint enforcement
- [ ] `services/project-ai/app/api/routes/workflows.py` — Modified approve-final endpoint with evidence validation
- [ ] `services/project-ai/README.md` — Gate C documentation section
- [ ] All tests passing (unit + security + integration)

---

## Design Decisions

**Decision 1**: Place evidence_policy in app/governance/ directory  
**Rationale**: Evidence policy is a governance concern (controls what evidence is acceptable for state transitions), not a certification concern. Aligns with existing WorkflowGovernanceService location.

**Decision 2**: Use dataclasses for EvidenceResult and EvidencePolicy  
**Rationale**: Follows project pattern (see StateTransition, ProjectLLMWorkflow in workflow.py use dataclasses). Not Pydantic models because these are domain objects, not API schemas.

**Decision 3**: Add evidence validation BEFORE FinalGateController.compute_verdict()  
**Rationale**: Creates defense-in-depth. evidence_policy enforces structural requirements (artifact binding, staleness, workflow isolation), FinalGateController enforces gate pass/fail logic. Both must pass. Fail fast on structural issues before gate logic.

**Decision 4**: Return HTTP 409 (Conflict) for evidence rejection  
**Rationale**: Evidence rejection is not a 400 (Bad Request) because the request itself is well-formed. It's a conflict between the workflow's evidence state and the policy requirements. Matches pattern from other gate enforcement endpoints.

**Decision 5**: Use frozen sets for required_types in EvidencePolicy  
**Rationale**: Required types are immutable configuration. frozenset prevents accidental mutation and allows use as dict keys or set operations if needed.

**Decision 6**: 24-hour staleness threshold (86400 seconds)  
**Rationale**: Balances freshness requirement with practical workflow timelines. Most certifications complete within hours; 24 hours allows for reasonable delays (weekends, reviews) without allowing stale evidence from prior iterations.

**Decision 7**: Fail-closed validation (any error blocks approval)  
**Rationale**: Security-critical operation (certification approval) must be conservative. Any evidence integrity issue should block approval rather than warn or continue.

**Decision 8**: Concurrent approval test uses asyncio.gather()  
**Rationale**: Tests real-world scenario where HAA might retry approval or multiple reviewers approve simultaneously. Verifies idempotent design and optimistic locking prevent duplicate state transitions.

---

## Risk Assessment

**Risk**: Evidence timestamp format inconsistency  
**Mitigation**: Accept datetime objects, ISO 8601 strings, or Unix timestamps in evidence conversion. Normalize to datetime in UTC before validation.

**Risk**: Existing gate_results dict format may not match expected structure  
**Mitigation**: Defensive evidence conversion with default values. If evidence_data missing 'status', default to 'UNKNOWN' (fails validation). If missing 'timestamp', use current time (fails staleness check for stale workflows).

**Risk**: HTTP 409 response might break existing clients  
**Mitigation**: This is new enforcement for existing endpoint. Document as breaking change if clients exist. Response structure clearly indicates reason (FINAL_GATE_EVIDENCE_REJECTED code).

**Risk**: Test fixtures may require PostgreSQL database  
**Mitigation**: Security tests marked with @pytest.mark.integration if they need database. Unit tests for evidence_policy module are pure Python (no database). Follow pattern from test_authorization.py (no database required).

---

## Notes

- This plan implements Gate C requirements based on W7 certification completion
- All validation logic is deterministic (no LLM calls, no external dependencies)
- Evidence enforcement is additive (does not modify existing FinalGateController behavior)
- Tests follow established project patterns (pytest with asyncio, fixtures in conftest or inline)
- README documentation provides operational guidance for evidence policy configuration
