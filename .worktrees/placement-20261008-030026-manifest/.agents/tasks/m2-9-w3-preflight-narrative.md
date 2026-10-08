# M2.9 W3 Preflight Verification Narrative

**Branch**: m2-project-ai-canonical-wiring (HEAD 996824fa)  
**Date**: 2026-10-08  
**Verifier**: Preflight Agent  
**Status**: ⚠️ BLOCKED (1 blocker, 5/6 checks passed)

---

## Executive Summary

This verification assessed whether W1/W2 prerequisites for the M2.9 W3 implementation are genuinely present in the codebase. Of six architectural requirements, five passed verification by reading actual source files. One blocker was identified: hardcoded version fallback in the compatibility verification module.

---

## Check 1: CanonicalWorkflowState is Sole Lifecycle Authority

**Status**: ✅ PASS

### Evidence

**File**: `services/project-ai/app/orchestration/canonical_workflow.py`

1. **CanonicalWorkflowState enum defined** with complete lifecycle:
   - REQUESTED → DISCOVERY → BRIEF_READY → AWAITING_GATE_1 → GUI_APPROVED
   - CANDIDATE_REQUESTED → CANDIDATE_RECEIVED → CANDIDATE_AUDIT
   - INTEGRATION_PLANNED → AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTING
   - IMPLEMENTED → VERIFYING → CERTIFICATION_READY → AWAITING_GATE_2
   - CERTIFIED (success terminal) / REJECTED (failure terminal)

2. **Architectural authority explicitly declared** in module docstring:
   ```python
   """
   ARCHITECTURAL RULE:
   - CanonicalWorkflowState is the ONLY workflow state machine for Project LLM
   - All other state enums must map to or derive from these canonical states
   - Frontend must consume these states; frontend must NOT create another state machine
   - External AI receives contracts based on these states, not internal TaskState
   """
   ```

3. **State machine enforcement** via `VALID_TRANSITIONS` dict mapping each state to valid next states

4. **Helper functions provided**:
   - `is_valid_transition(from_state, to_state) -> bool`
   - `is_gate_state(state) -> bool` (identifies human approval gates)
   - `is_terminal_state(state) -> bool` (CERTIFIED/REJECTED)

5. **No competing lifecycle authority** found in codebase search

### Verdict

CanonicalWorkflowState is correctly positioned as the single source of truth for Project LLM lifecycle. The architectural boundary is clearly documented and enforced through state transition validation.

---

## Check 2: CreationMode Retired, /creation Routes Return 405

**Status**: ✅ PASS

### Evidence

**Search Results**: Searched entire `services/project-ai/` for `CreationMode` references

1. **CreationMode enum removed** — no active definition found
2. **Only historical references remain**:
   - Comment in `canonical_workflow.py` docstring: "resolving multiple competing state authorities (TaskState, WorkflowStatus, CreationMode)"
   - Deprecation notice in `app/models/creation.py`: "M2.9 Wave 0 / Agent B13: CreationMode REMOVED"
   - Error messages in `app/api/routes/creation.py` explaining why endpoints are disabled

3. **/creation routes correctly return 405**:
   - `POST /creation/workflows` → 405 with message: "POST /creation/workflows is deprecated (M2.9 Wave 0). Use canonical workflow endpoints."
   - `GET /creation/workflows/{workflow_id}` → 405
   - `POST /creation/workflows/{workflow_id}/validate` → 405
   - `POST /creation/workflows/{workflow_id}/certify` → 405

4. **Tests updated**: Legacy tests marked with `@pytest.mark.skip(reason="Legacy /creation endpoints disabled in M2.9 Wave 0")`

5. **New tests verify 405 behavior** in `tests/test_creation.py`:
   ```python
   def test_create_workflow_returns_405():
       """Test that POST /creation/workflows returns 405 (deprecated)"""
       response = client.post("/creation/workflows", json={...})
       assert response.status_code == 405
   ```

### Verdict

CreationMode has been successfully retired. All /creation endpoints return 405 METHOD_NOT_ALLOWED with explanatory error messages directing users to canonical workflow endpoints. CreationMode is not used for lifecycle gating.

---

## Check 3: projectLlmWorkflowCoordinator.ts Deleted

**Status**: ✅ PASS

### Evidence

**File Search**: `file_search(query="projectLlmWorkflowCoordinator.ts")`

Result:
```
You searched for projectLlmWorkflowCoordinator.ts and received the following complete results:
---
No files found matching your search.
---
```

### Verdict

The file `projectLlmWorkflowCoordinator.ts` does not exist in the workspace. This prerequisite is satisfied.

---

## Check 4: Repository Boundary — Contract from Snapshot, Not Path(repo_root)

**Status**: ✅ PASS

### Evidence

**File**: `services/project-ai/app/contracts/repository_intelligence.py`

1. **Snapshot-based contract generation**:
   ```python
   def build_contract(snapshot: Dict[str, Any], family: str, version: str) -> RepositoryBlockContract:
       """
       Build a repository block contract from TypeScript snapshot evidence.
       
       ARCHITECTURAL BOUNDARY:
       This function must NEVER open, read, or walk repository files.
       All data comes from the snapshot['evidence'] array provided by TypeScript discovery.
       """
   ```

2. **Evidence extraction from snapshot**:
   ```python
   canonical_blocks = [
       ev for ev in snapshot.get('evidence', [])
       if ev.get('kind') == 'canonical_block'
   ]
   ```

3. **Uses snapshot-provided hashes and IDs**:
   ```python
   evidence = RepositoryEvidence(
       path=ev.get('path', expected_path),
       sha256=ev.get('contentHash', ''),    # From snapshot, not computed
       role="canonical_block",
       evidence_id=ev.get('evidenceId', '')  # From snapshot, deterministic
   )
   ```

4. **Module docstring explicitly prohibits file scanning**:
   ```python
   """
   CONTRACT:
   - Never scan repository files directly (architectural boundary violation)
   - All evidence must be derived from TypeScript snapshot
   - SHA-256 is extracted from snapshot evidence, never recomputed
   - Missing evidence is noted, not fabricated
   """
   ```

5. **Legacy function preserved for tests only**:
   - `build_contract_legacy(repo_root, family, version)` marked DEPRECATED
   - `compute_sha256(file_path)` marked DEPRECATED with warning: "This function violates the architectural boundary"
   - These are kept only for backward compatibility with existing tests

6. **Production route uses snapshot-based contract**:
   - `app/api/routes/contract.py` line 233-238:
   ```python
   repo_contract = build_repo_contract(
       snapshot=snapshot,
       family=target.family,
       version=target.version
   )
   ```

### Verdict

Repository intelligence contract is correctly derived from TypeScript snapshot evidence (D1-D8), NOT from direct file scanning. The architectural boundary is enforced: Python consumes TypeScript snapshots only, never walks repository files.

---

## Check 5: Version Binding — Dynamic from WorkflowTarget.version, Not Hardcoded

**Status**: ❌ FAIL (BLOCKER)

### Evidence

**Model Definition**: `services/project-ai/app/models/workflow_target.py`

1. **WorkflowTarget model correctly defines version field**:
   ```python
   class WorkflowTarget(BaseModel):
       workflow_id: str
       family: str
       version: str = Field(..., description="Target version (e.g., 'I7', not '1.0.0')")
       block_type: str
       specification_id: str
       source_snapshot_id: str
   ```

2. **Version is dynamically used in contract generation**:
   - `app/api/routes/contract.py` line 237: `version=target.version`
   - File paths constructed dynamically line 264-267:
   ```python
   "component": f"packages/ui/src/tutorial/blocks/{target.family}{target.version}Block.tsx",
   "schema": f"packages/ui/src/tutorial/schemas/{target.family}{target.version}Schema.ts",
   ```

3. **BLOCKER IDENTIFIED**: `app/verification/compatibility.py` line 178:
   ```python
   # Get component version
   component_version = component.get("version", "1.0.0")
   ```

   This hardcoded fallback could reintroduce the I7 vs 1.0.0 mismatch that WorkflowTarget was designed to prevent.

4. **Additional hardcoded versions found** (NOT blockers):
   - Line 248 in `contract.py`: `contract_version="1.0"` — this is the contract schema version, not the block version (acceptable)
   - Line 63 in `compatibility.py`: `"version": "1.0.0"` for preset metadata (I1/I2 presets, acceptable as preset metadata)

### Verdict

Version binding is MOSTLY dynamic via `target.version`, but a critical hardcoded fallback remains in compatibility verification. This violates the W1/W2 prerequisite that version must come from `WorkflowTarget.version` dynamically.

**Recommendation**: 
- Pass `target.version` through to compatibility verification functions
- Remove unsafe `"1.0.0"` fallback or explicitly fail with error if version is missing
- Ensure all verification code paths use the authoritative version from WorkflowTarget

---

## Check 6: WorkflowEngine/TaskState Boundary

**Status**: ✅ PASS

### Evidence

**Files**:
- `services/project-ai/app/models/task_state.py`
- `services/project-ai/app/orchestration/workflow_engine.py`

1. **TaskState explicitly scoped to agent execution**:
   ```python
   """Task state definitions for AI orchestration workflow.

   DEPRECATION NOTICE (M2.9):
   - TaskState is a SECONDARY authority for task-level (agent-level) state tracking
   - For workflow-level state, use CanonicalWorkflowState from app.orchestration.canonical_workflow
   - TaskState is NOT a workflow state machine; it tracks individual agent execution
   - Do not confuse TaskState (agent execution) with CanonicalWorkflowState (workflow lifecycle)

   ARCHITECTURAL CLARIFICATION:
   - CanonicalWorkflowState = User-facing workflow lifecycle (REQUESTED -> CERTIFIED)
   - TaskState = Internal agent execution state (CREATED -> COMPLETED)
   - A single workflow (CanonicalWorkflowState) may spawn multiple tasks (TaskState)
   - Example: DISCOVERY workflow state runs multiple agents, each with TaskState
   """
   ```

2. **WorkflowEngine uses TaskState for step transitions**:
   - `_define_workflow_steps()` creates `WorkflowStep` objects with `from_state` and `to_state` (both TaskState)
   - These are internal workflow steps (discovery → planning → approval → implementation)
   - No mechanism to control CanonicalWorkflowState transitions

3. **Clear separation of concerns**:
   - WorkflowEngine orchestrates agent execution (TaskState)
   - CanonicalWorkflowState tracks user-facing lifecycle
   - TaskState cannot drive CanonicalWorkflowState transitions

4. **No unauthorized lifecycle control found**:
   - Searched for TaskState driving CanonicalWorkflowState — none found
   - TaskState is purely internal to agent coordination

### Verdict

The TaskState boundary is correctly enforced. TaskState is scoped to agent-level execution tracking and does NOT control the canonical workflow lifecycle. CanonicalWorkflowState remains the sole authority for user-facing workflow state transitions.

---

## Overall Assessment

### Summary Table

| Check | Status | Blocker? |
|-------|--------|----------|
| CanonicalWorkflowState sole authority | ✅ PASS | No |
| CreationMode retired, /creation → 405 | ✅ PASS | No |
| projectLlmWorkflowCoordinator.ts deleted | ✅ PASS | No |
| Snapshot-based contract (not Path scan) | ✅ PASS | No |
| Dynamic version binding | ❌ FAIL | **YES** |
| TaskState boundary | ✅ PASS | No |

### Blockers

1. **Dynamic version binding (Check 5)**:
   - Location: `app/verification/compatibility.py` line 178
   - Issue: Hardcoded `"1.0.0"` fallback in `component.get("version", "1.0.0")`
   - Impact: Could reintroduce I7 vs 1.0.0 version mismatch
   - Fix required: Pass `target.version` to compatibility verification or fail explicitly if version is missing

### Recommendations

1. **Immediate (required for W3)**:
   - Modify `verify_component_compatibility()` to accept `target_version: str` parameter
   - Pass `target.version` from calling context (likely candidate audit phase)
   - Remove hardcoded `"1.0.0"` fallback or change to explicit validation error

2. **Code review (suggested)**:
   - Grep entire codebase for `"1.0.0"` and `"v1.0"` patterns to catch any other hardcoded versions
   - Ensure all version references trace back to `WorkflowTarget.version`

3. **Testing**:
   - Add integration test verifying version flows from user request → WorkflowTarget → EngineeringContract → PlacementManifest
   - Test that mismatched version triggers error (not silent fallback)

---

## Conclusion

**Verdict**: ⚠️ BLOCKED

W1/W2 prerequisites are 83% implemented (5/6 checks passed). The single blocker is tractable: a hardcoded version fallback in compatibility verification that undermines the WorkflowTarget version binding architecture. This must be fixed before W3 implementation proceeds.

Once the blocker is resolved, the architectural foundation for W3 will be solid:
- CanonicalWorkflowState is the sole lifecycle authority ✅
- CreationMode is fully retired ✅
- Repository boundary is correctly enforced ✅
- TaskState boundary is correctly scoped ✅
- Version binding will be fully dynamic ⚠️ (after fix)

**Next Steps**:
1. Fix `compatibility.py` line 178 hardcoded version
2. Re-run preflight verification
3. Proceed with W3 implementation once PASS status achieved
