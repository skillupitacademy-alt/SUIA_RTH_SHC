# Implementation Plan: M2.9 Wave 1A - Target Binding

## Problem Statement
The Engineering Contract route creates placeholder targets (Introduction/I7) rather than retrieving the actual workflow target. Candidates lose their requested family/version identity when bound to workflows.

## Objective
Bind workflow target (family/version) from creation through certification, preventing version drift.

## Context
- Project: Quiz Platform monorepo with Python/FastAPI backend service
- Service: `services/project-ai` - Project LLM workflow orchestration
- Test Framework: pytest (v9.1.1)
- Build Command: `python -m pytest` from service directory
- Current State: W0 complete on branch m2-project-ai-canonical-wiring (base: 5acbd7b3)
- Key Models: ProjectLLMWorkflow already has target_family/target_version fields (Wave 0)
- Key Services: WorkflowGovernanceService manages workflow creation and state

## Implementation Steps

- [ ] 1. Verify ProjectLLMWorkflow model has target binding fields (already exists from Wave 0).
      Review `services/project-ai/app/models/workflow.py` to confirm target_family, target_version fields.
      Files: services/project-ai/app/models/workflow.py
      Verify: Grep for target_family and target_version fields in ProjectLLMWorkflow - both should exist.

- [ ] 2. Update workflow creation endpoint to capture and store target binding.
      Modify POST /workflows endpoint in `services/project-ai/app/api/routes/workflows.py`.
      The CreateWorkflowRequest schema already has target_family and target_version fields.
      Ensure WorkflowGovernanceService.create_workflow passes these fields to ProjectLLMWorkflow.
      Files: services/project-ai/app/api/routes/workflows.py, services/project-ai/app/orchestration/workflow_governance.py
      Verify: `python -m pytest services/project-ai/tests/test_governance.py -v` - existing tests should pass.

- [ ] 3. Wire Engineering Contract to retrieve target from workflow instead of using placeholder.
      Modify `services/project-ai/app/api/routes/contract.py`:
      - Replace placeholder target creation (lines ~160-167) with workflow lookup
      - Call governance_service.get_workflow(workflow_id) to retrieve workflow
      - Extract target.family and target.version from workflow.target_family and workflow.target_version
      - Use these values for build_repo_contract and EngineeringContract creation
      - Handle 404 error if workflow not found
      Files: services/project-ai/app/api/routes/contract.py
      Verify: `python -m pytest services/project-ai/tests -k contract -v` - contract tests should pass.

- [ ] 4. Bind candidate package to workflow target at upload.
      Modify POST /upload endpoint in `services/project-ai/app/api/routes/candidate.py`:
      - Add workflow_id to CandidatePackage model or as separate field in request
      - Retrieve workflow via governance_service.get_workflow(workflow_id)
      - Extract target_family and target_version from workflow
      - Store these on the candidate package (add fields if needed)
      - Ensure target_version is available for manifest generation (fixes B07 issue on line ~380)
      Files: services/project-ai/app/api/routes/candidate.py, services/project-ai/app/models/candidate.py
      Verify: `python -m pytest services/project-ai/tests/test_candidate.py -v` - candidate intake tests should pass.

- [ ] 5. Fix manifest generation to use workflow target_version instead of UNKNOWN_VERSION sentinel.
      Update generate_manifest function in `services/project-ai/app/api/routes/candidate.py` (lines ~374-390):
      - Remove fallback to UNKNOWN_VERSION sentinel
      - Retrieve target_version from candidate's workflow binding
      - Ensure blockVersion in PlacementManifest matches workflow.target_version
      - Add validation that target_version is present (raise 400 if missing)
      Files: services/project-ai/app/api/routes/candidate.py
      Verify: `python -m pytest services/project-ai/tests/test_placement_manifest.py -v` - manifest tests should pass.

- [ ] 6. Add integration tests for target binding across workflow lifecycle.
      Create new test file `services/project-ai/tests/test_target_binding.py`:
      - Test workflow creation captures target_family and target_version
      - Test contract retrieves correct target from workflow (not placeholder)
      - Test candidate upload binds to workflow target
      - Test manifest generation uses workflow target_version
      - Test version mismatch detection (candidate vs workflow)
      Files: services/project-ai/tests/test_target_binding.py (new file)
      Verify: `python -m pytest services/project-ai/tests/test_target_binding.py -v` - all new tests pass.

- [ ] 7. Run full test suite to verify no regressions.
      Execute complete test suite for project-ai service.
      Files: All modified files
      Verify: `python -m pytest services/project-ai/tests -v` - all tests pass.

- [ ] 8. Commit changes with conventional commit message.
      Stage all modified files and commit with message: 'feat(project-llm): bind workflow target family/version identity'.
      Include Wave 1A completion note in commit body.
      Files: All modified files
      Verify: `git log -1 --oneline` shows commit with correct message.

- [ ] 9. Push to remote branch m2-project-ai-canonical-wiring.
      Push committed changes to origin/m2-project-ai-canonical-wiring.
      Files: N/A
      Verify: `git status` shows branch up to date with remote after push.

## Dependencies
- Step 2 must complete before step 3 (contract needs workflow service integration)
- Step 3 must complete before step 4 (candidate binding needs working workflow retrieval)
- Step 4 must complete before step 5 (manifest needs candidate workflow binding)
- Steps 1-5 must complete before step 6 (integration tests need all components)
- Step 6 must complete before step 7 (new tests must exist before full suite run)
- Step 7 must pass before step 8 (no commit until tests pass)
- Step 8 must complete before step 9 (no push until commit exists)

## Key Design Decisions

**Decision 1: Reuse existing ProjectLLMWorkflow fields**
Wave 0 already added target_family and target_version to ProjectLLMWorkflow. This work extends their usage to candidate binding and manifest generation rather than adding new schema fields.

**Decision 2: Workflow ID in candidate upload**
Candidates must include workflow_id at upload to bind target identity. This follows the existing pattern where workflow_id is already used in contract generation.

**Decision 3: Remove UNKNOWN_VERSION sentinel**
The B07 TODO (line ~380 in candidate.py) suggests missing workflow binding. Instead of tolerating unknown versions, enforce workflow binding at upload and fail fast if missing.

**Decision 4: Contract service integration**
Engineering Contract route should depend on WorkflowGovernanceService to retrieve target, maintaining single source of truth. Import governance_service instance from workflows.py or create new instance.

**Decision 5: Version mismatch detection**
Integration tests should verify that candidate target_version matches workflow target_version, catching drift at upload time rather than at manifest generation.
