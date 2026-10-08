# Target binding from workflow creation through certification

M2.9 Wave 1A replaces the placeholder target identity (Introduction/I7) with real workflow-bound target fields that flow from workflow creation through the Engineering Contract to candidate upload. The change prevents version drift by binding family and version at workflow creation and enforcing that identity through every artifact generation point.

**Watch for:** Candidate upload without workflow_id returns a clear 400 error (confirmed), but the manifest generation fallback error message suggests re-uploading the candidate — that's never the right recovery path since missing target_version means the candidate is already in the store without binding and re-uploading would hit the duplicate-ID check. Manifest generation should reject candidates uploaded before Wave 1A with a different error or force-delete and re-upload flow (likely).

**Verdict**: NEEDS_CHANGES

## High-level view

The workflow creation endpoint captures target_family and target_version in the CreateWorkflowRequest schema and persists them to the workflow object. The Engineering Contract route retrieves the workflow via governance_service.get_workflow() and extracts those fields into a WorkflowTarget object instead of using the hardcoded Introduction/I7 placeholder, confirming the placeholder removal. Candidate upload now requires workflow_id, retrieves the workflow, and binds target_family and target_version from the workflow to the CandidatePackage at upload time. Manifest generation reads target_version from the candidate package (which inherited it from the workflow) instead of using the UNKNOWN_VERSION sentinel. The CandidatePackage model was extended with three optional fields: workflow_id, target_family, target_version. Test coverage includes 44 passing tests for target/binding patterns, representing 98% pass rate for the feature scope. The one failing test is pre-existing and unrelated to Wave 1A.

<details>
<summary>Issues (3)</summary>

1. **Manifest error recovery path suggests impossible action** — Manifest generation returns 400 with "Re-upload candidate with workflow_id to bind target identity" when target_version is missing, but re-upload would fail with 400 duplicate candidateId. The candidate is already in the store without binding. Correct recovery is to delete and re-upload or reject with a different message. (likely)

2. **No version-mismatch detection between workflow and contract** — The contract route retrieves workflow.target_version and workflow.target_family, but if the workflow object's target fields were somehow modified after workflow creation (e.g., by a bug or a future admin endpoint), the contract would silently use the modified version instead of detecting the drift. Add a consistency check or make target fields immutable on the workflow object. (possible)

3. **Candidate upload binds target but doesn't validate it** — The upload_candidate route copies workflow.target_family and workflow.target_version to the CandidatePackage without checking whether those values are non-empty or match any known block family/version in the repository. An empty target_version from a malformed workflow would propagate to the candidate and cause a deferred failure at manifest generation instead of failing fast at upload. Add validation that target_family and target_version are non-empty and well-formed. (likely)

</details>

<details>
<summary>Details</summary>

## Workflow creation captures target identity

The `CreateWorkflowRequest` schema in `workflow.py` includes `target_family` and `target_version` as required string fields with min_length=1. The `create_workflow` endpoint passes these fields to `governance_service.create_workflow()`, which persists them to the `ProjectLLMWorkflow` object.

## Engineering Contract retrieves real target from workflow

The contract route (`contract.py` lines 207-224) imports `governance_service` from the workflows module, calls `governance_service.get_workflow(workflow_id)`, and extracts `workflow_obj.target_family` and `workflow_obj.target_version` into a `WorkflowTarget` object. The placeholder target (Introduction/I7) that previously appeared around line 160 is gone.

## Candidate upload enforces workflow binding

The `upload_candidate` route (`candidate.py` lines 54-107) checks that `package.workflow_id` is present and returns 400 if missing. It retrieves the workflow via `governance_service.get_workflow()` and returns 404 if the workflow doesn't exist. After confirming the workflow exists, it binds `package.target_family = workflow.target_family` and `package.target_version = workflow.target_version`.

**Gap:** The route doesn't validate that `workflow.target_family` and `workflow.target_version` are non-empty or well-formed. If the workflow object has empty strings for these fields (e.g., from a bug in workflow creation), the candidate would inherit empty values and fail later at manifest generation instead of failing fast at upload.

## Manifest generation uses workflow-bound version

Manifest generation (`candidate.py` lines 405-410) reads `package.target_version` and raises 400 if it's missing or empty. The error message says "Re-upload candidate with workflow_id to bind target identity," but that's not a valid recovery path — the candidate is already in `_candidates_store` and re-uploading the same `candidateId` would fail with a 400 duplicate error.

## Test coverage for target binding

The test suite includes 44 passing tests that match the pattern "target or binding" (per the evidence report). Representative tests include `test_validate_missing_target_version` and `test_validate_missing_target_family` in `test_candidate_validator.py`, `test_upload_candidate_success` in `test_candidate.py` (creates a workflow with Tutorial/T5, uploads a candidate, asserts the response includes those values), and contract route tests that create workflows and mock snapshot dependencies to isolate target binding logic. The one failing test (1/45) is described in the evidence report as "pre-existing test assertion about error message wording, unrelated to Wave 1A changes."

## No version-mismatch detection

The contract route retrieves the workflow and immediately uses its target fields. If the workflow object's target fields were modified after workflow creation (e.g., by a future admin endpoint or a bug), the contract would use the modified version without detecting the inconsistency. Since the contract is immutable (same workflow_id returns the same contract), the first contract generation locks in the target, but nothing prevents a workflow's target fields from drifting after the contract is generated.

</details>

<details>
<summary>File map</summary>

**Core implementation:**
- `services/project-ai/app/api/schemas/workflow.py` — Added `target_family` and `target_version` to `CreateWorkflowRequest` and `WorkflowTarget` schemas
- `services/project-ai/app/api/routes/workflows.py` — Passes target fields to governance service on workflow creation
- `services/project-ai/app/api/routes/contract.py` — Retrieves workflow and extracts real target instead of using placeholder
- `services/project-ai/app/api/routes/candidate.py` — Enforces workflow_id at upload, binds target from workflow, uses target_version in manifest
- `services/project-ai/app/models/candidate.py` — Extended `CandidatePackage` with `workflow_id`, `target_family`, `target_version` fields

**Test coverage:**
- `services/project-ai/tests/test_candidate.py` — Tests candidate upload with workflow binding and target field propagation
- `services/project-ai/tests/test_candidate_validator.py` — Tests validation of target_family and target_version presence
- `services/project-ai/tests/unit/test_contract_routes.py` — Tests contract generation with workflow-bound target
- `services/project-ai/tests/unit/test_workflow_governance.py` — Tests workflow creation with target fields

Full diff: `git diff origin/main...origin/m2-project-ai-canonical-wiring`

</details>
