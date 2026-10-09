# Implementation Plan: M2.9 Wave 3A — Candidate Intake

## Context

This plan implements the candidate intake pipeline for the Project AI service, connecting external AI output to the canonical workflow lifecycle with:
- Workflow state verification (CANDIDATE_REQUESTED → CANDIDATE_RECEIVED)
- Server-side SHA-256 hash calculation (never trust client)
- Workflow target binding (workflow_id, target_family, target_version, contract_sha256)
- Package validation (unsafe paths, empty packages, missing manifest)
- State transition enforcement

**Branch**: m2-project-ai-canonical-wiring  
**Workspace**: e:\onlinewebsites\quiz-platform  
**Service**: services/project-ai (Python 3.11+, FastAPI, pytest)

## Discovered Project Context

- **Build System**: Python with pip, pyproject.toml
- **Test Framework**: pytest with pytest-asyncio
- **Test Command**: `python -m pytest tests/ -v`
- **Project Structure**: FastAPI service with app/ (routes, models, intake, orchestration) and tests/
- **Key Files**:
  - Candidate models: `app/models/candidate.py`
  - Candidate routes: `app/api/routes/candidate.py`
  - Workflow state: `app/orchestration/canonical_workflow.py` (CanonicalWorkflowState enum)
  - Workflow governance: `app/orchestration/workflow_governance.py` (state transitions)
  - Validators: `app/intake/candidate_validator.py` (already exists with SHA-256 verification)
  - Comparator: `app/intake/canonical_comparator.py` (already exists)
  - Manifest generator: `app/intake/placement_manifest.py` (already exists)
- **Existing Tests**: 
  - `tests/test_candidate_validator.py` (unit tests for validator)
  - `tests/unit/test_candidate_intake.py` (integrity verification tests)
  - `tests/test_candidate.py` (route tests)

## Implementation Plan

- [ ] 1. Extend the CandidatePackage model to include contract_sha256 field in app/models/candidate.py. Add validation for SHA-256 format (64 hex characters). The model already has workflow_id, target_family, and target_version fields from Wave 1A.
      Files: services/project-ai/app/models/candidate.py
      Verify: `python -m pytest tests/test_candidate_validator.py -v` — model tests pass.

- [ ] 2. Wire the upload route (/candidates/upload) in app/api/routes/candidate.py to: (a) verify workflow state == CANDIDATE_REQUESTED via WorkflowGovernanceService; (b) calculate SHA-256 server-side from file content using CandidateValidator._compute_candidate_hash (never trust client-supplied hash); (c) bind candidate to workflow target using existing workflow.target_family and workflow.target_version; (d) validate target match against workflow; (e) transition state to CANDIDATE_RECEIVED via governance_service.transition_state. The route already retrieves workflow and validates target_family/target_version are non-empty.
      Files: services/project-ai/app/api/routes/candidate.py
      Verify: `python -m pytest tests/test_candidate.py::TestCandidateUpload -v` — upload route tests pass with state transition.

- [ ] 3. Add package validation to upload route: reject unsafe paths (paths with .. or absolute paths), reject empty packages (files list empty or all files have empty content), reject missing manifest (no component or schema file matching target_family+target_version pattern). Use CandidateValidator._validate_artifact_structure for structural checks.
      Files: services/project-ai/app/api/routes/candidate.py
      Verify: `python -m pytest tests/test_candidate.py -v -k "upload"` — upload validation tests pass (unsafe paths, empty packages, missing files rejected).

- [ ] 4. Create or extend pytest tests in tests/test_candidate.py covering: (a) upload with correct state transition (CANDIDATE_REQUESTED → CANDIDATE_RECEIVED); (b) upload rejection when workflow not in CANDIDATE_REQUESTED state; (c) server-side hash calculation (verify computed hash matches expected); (d) target validation (target_family and target_version match workflow); (e) package validation (unsafe paths, empty packages, missing manifest all rejected). Mock WorkflowGovernanceService for state checks.
      Files: services/project-ai/tests/test_candidate.py
      Verify: `python -m pytest tests/test_candidate.py -v` — all new tests pass.

- [ ] 5. Commit changes with message "feat(project-llm): implement candidate intake with binding" and push to origin/m2-project-ai-canonical-wiring. Verify no uncommitted changes remain.
      Files: (git operations)
      Verify: `git status` shows clean working tree, `git log -1 --oneline` shows commit on m2-project-ai-canonical-wiring branch.

- [ ] 6. Write evidence report to .agents/tasks/w3a-candidate-intake-report.json with: workflow_id, task_name, branch, commit_sha, files_modified (list), tests_added (list), tests_passed (boolean), verification_command, verification_output (summary), completion_timestamp (ISO 8601).
      Files: .agents/tasks/w3a-candidate-intake-report.json
      Verify: File exists and contains valid JSON with all required fields.

## Design Decisions

**Decision 1: Reuse existing CandidateValidator for SHA-256 calculation**  
Rationale: The CandidateValidator._compute_candidate_hash method already implements the correct hash calculation from file content (concatenating sorted file hashes for directories). This ensures consistency with validation logic and avoids duplicating hash computation.

**Decision 2: Use WorkflowGovernanceService for state verification and transition**  
Rationale: WorkflowGovernanceService is the single source of truth for workflow state management (per app/orchestration/workflow_governance.py docstring). All state transitions must flow through this service to ensure validation, authorization, and audit trail. The upload route will inject this service via dependency injection.

**Decision 3: Validation happens before state transition**  
Rationale: Package validation (unsafe paths, empty packages, missing files) must occur before transitioning to CANDIDATE_RECEIVED. If validation fails, workflow remains in CANDIDATE_REQUESTED and the client receives a 400 error with specific validation messages. This prevents invalid candidates from polluting the workflow state.

**Decision 4: Target binding validation uses workflow.target_family and workflow.target_version as authority**  
Rationale: These fields were bound during workflow creation (per app/models/workflow_target.py). The upload route already validates they are non-empty strings. We enforce that the candidate's files match the expected naming pattern (e.g., IntroductionI7Block.tsx for family=Introduction, version=I7).

## Verification Steps

After each step, run the specified verification command. All tests must pass before proceeding to the next step.

Final verification (after step 5):
```bash
cd services/project-ai
python -m pytest tests/test_candidate.py tests/test_candidate_validator.py -v
git log -1 --oneline
git status
```

Expected: All tests pass, commit exists on m2-project-ai-canonical-wiring, working tree clean.

## Notes

- The CandidateValidator, CanonicalComparator, and PlacementManifestGenerator already exist from Wave 3 Phase 2 (per README.md). This plan focuses on wiring the upload route to these components.
- The workflow state machine (CanonicalWorkflowState enum) defines CANDIDATE_REQUESTED and CANDIDATE_RECEIVED states with valid transition path (per app/orchestration/canonical_workflow.py).
- The upload route already binds workflow_id, target_family, and target_version from the workflow at upload time (Wave 1A work, per app/api/routes/candidate.py line 61-85).
- contract_sha256 is optional in Wave 3A (will be populated in Wave 3B after contract generation is wired).
