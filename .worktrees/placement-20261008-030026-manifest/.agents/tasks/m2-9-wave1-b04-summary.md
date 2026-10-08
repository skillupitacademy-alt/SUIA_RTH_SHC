# M2.9 Wave 1 - B04: Target Binding - Completion Summary

**Agent:** B04 - Target Binding Agent  
**Wave:** W1  
**Date:** 2025-01-30  
**Status:** ✅ COMPLETED  
**Commit:** 76fed814

## Objective

Fix the critical gap where a candidate loses the requested family/version during its lifecycle. Every workflow and candidate must carry a binding to its target.

## Implementation

### Files Created

1. **`services/project-ai/app/models/workflow_target.py`**
   - Created `WorkflowTarget` model with fields:
     - `workflow_id`: Unique workflow identifier
     - `family`: Target block family (e.g., "Introduction")
     - `version`: Target version (e.g., "I7", not "1.0.0")
     - `block_type`: Block type classification
     - `specification_id`: User specification ID
     - `source_snapshot_id`: Repository snapshot ID
   - Created `CandidateBinding` model with fields:
     - `workflow_id`: Workflow this candidate belongs to
     - `target_family`: Target block family
     - `target_version`: Target version
     - `specification_id`: Specification this candidate implements
     - `contract_hash`: SHA-256 hash of EngineeringContract (default "", filled in Wave 2)

2. **`services/project-ai/tests/unit/test_workflow_target.py`**
   - 8 comprehensive unit tests
   - Tests model construction, validation, default values
   - Tests version mismatch prevention (I7 vs 1.0.0 issue)
   - Documents gap: empty family currently allowed (TODO for workflow integration)

### Files Modified

1. **`services/project-ai/app/agents/placement.py`** (line 53)
   - Added TODO comment: `# TODO(m2.9/B04): replace hardcoded version with WorkflowTarget.version`
   - Hardcoded `blockVersion="1.0.0"` remains but is now documented for Wave 3 fix

2. **`services/project-ai/app/api/routes/candidate.py`** (lines 379, 395)
   - Added TODO comments in two locations where `blockVersion="1.0.0"` is hardcoded
   - Documented for future replacement with WorkflowTarget.version

### Evidence

- Appended run record to `docs/project-llm/evidence/agent-runs.jsonl`
- Evidence includes:
  - Agent ID: B04
  - Wave: W1
  - Status: completed
  - Tests run: 8, Tests passed: 8
  - Files modified: 4
  - Addresses audit finding: Version mismatch (I7 vs 1.0.0)

## Test Results

### New Tests
```
services/project-ai/tests/unit/test_workflow_target.py::TestWorkflowTarget::test_valid_workflow_target PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestWorkflowTarget::test_workflow_target_uses_version_not_semver PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestWorkflowTarget::test_workflow_target_missing_required_field PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestCandidateBinding::test_valid_candidate_binding PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestCandidateBinding::test_candidate_binding_default_contract_hash PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestCandidateBinding::test_candidate_binding_empty_family_allowed PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestCandidateBinding::test_candidate_binding_missing_required_field PASSED
services/project-ai/tests/unit/test_workflow_target.py::TestWorkflowTargetIntegration::test_workflow_target_prevents_version_mismatch PASSED

8 passed in 0.24s
```

### Regression Tests
```
services/project-ai/tests/agents/test_placement.py::test_execute_placement_new_block PASSED
services/project-ai/tests/agents/test_placement.py::test_execute_placement_existing_block PASSED
services/project-ai/tests/agents/test_placement.py::test_execute_placement_no_path_inference PASSED

3 passed in 0.31s
```

## Audit Findings Addressed

✅ **Version mismatch (I7 vs 1.0.0)**
- Created WorkflowTarget model that carries user-requested version (e.g., "I7")
- Created CandidateBinding to link candidate to workflow target
- Documented hardcoded "1.0.0" locations for Wave 3 replacement

## Dependencies for Future Waves

### Wave 2 (B02 - Engineering Contract)
- `CandidateBinding.contract_hash` field ready for EngineeringContract hash

### Wave 3 (B07 - Placement Manifest Enhancement)
- TODO comments documented in placement.py and candidate.py
- WorkflowTarget.version should replace hardcoded "1.0.0"
- Integration: `blockVersion=target.version` instead of `blockVersion="1.0.0"`

## Behavior Change Assessment

✅ **No breaking changes**
- New models added, existing models unchanged
- No API contract changes
- Existing tests pass without modification
- TODO comments guide future integration

## Next Steps

1. **Wave 2 - B02 (Engineering Contract):** Will populate `CandidateBinding.contract_hash`
2. **Wave 3 - B07 (Placement Manifest Enhancement):** Will replace hardcoded "1.0.0" with `WorkflowTarget.version`
3. **Workflow Integration:** Update workflow engine discovery step to create WorkflowTarget from user request

## Commit Message

```
feat(m2.9/W1/B04): add WorkflowTarget + CandidateBinding models

- Create WorkflowTarget model with workflow_id, family, version, block_type, specification_id, source_snapshot_id
- Create CandidateBinding model to link candidate to workflow target
- Add TODO comments in placement.py and candidate.py routes to replace hardcoded '1.0.0' with WorkflowTarget.version
- Add 8 unit tests covering model construction, validation, and version mismatch prevention
- Append evidence to agent-runs.jsonl ledger

Addresses audit finding: version mismatch (I7 vs 1.0.0)
Wave: W1-B04
```

## Verification Checklist

- [x] Models created with proper Pydantic validation
- [x] Unit tests written and passing (8/8)
- [x] Existing tests still pass (no regressions)
- [x] TODO comments added for future integration
- [x] Evidence appended to ledger
- [x] Changes committed to git
- [x] Documentation complete

## Wave 1 - B04 Status: ✅ COMPLETE
