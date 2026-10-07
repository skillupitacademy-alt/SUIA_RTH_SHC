# M2.9 Phase 3C: Target/Version Binding Comparison

**Investigation Date:** 2025-01-16  
**Branches Compared:**
- **Local:** `backup/local-m2-9-remediation`
- **GitHub:** `backup/github-m2-9`

---

## Executive Summary

**CRITICAL FINDING:** The local branch contains the correct M2.9 remediation, while the GitHub branch retains the architectural defect M2.9 was designed to fix.

### Key Differences

| Component | Local Branch | GitHub Branch | Status |
|-----------|--------------|---------------|--------|
| WorkflowTarget model | ✅ Present | ✅ Present | EQUIVALENT |
| CandidateBinding model | ✅ Present | ✅ Present | EQUIVALENT |
| **Placement agent blockVersion** | ✅ **Dynamic (from workflow_target)** | ❌ **Hardcoded "1.0.0"** | **DEFECT IN GITHUB** |
| **Candidate route blockVersion** | ✅ **Dynamic (from target_version)** | ❌ **Hardcoded "1.0.0"** | **DEFECT IN GITHUB** |
| EngineeringContract routes | ✅ Present | ✅ Present | EQUIVALENT |

---

## Detailed Analysis

### 1. WorkflowTarget Model ✅ BOTH_EQUIVALENT

**Location:** `services/project-ai/app/models/workflow_target.py`

**Definition (identical in both branches):**
```python
class WorkflowTarget(BaseModel):
    workflow_id: str
    family: str  # e.g., 'Introduction'
    version: str  # e.g., 'I7', not '1.0.0'
    block_type: str
    specification_id: str
    source_snapshot_id: str
```

**Status:** ✅ Models are identical  
**Risk:** LOW  
**Action:** Keep either (no conflict)

---

### 2. CandidateBinding Model ✅ BOTH_EQUIVALENT

**Location:** `services/project-ai/app/models/workflow_target.py`

**Definition (identical in both branches):**
```python
class CandidateBinding(BaseModel):
    workflow_id: str
    target_family: str
    target_version: str  # e.g., 'I7'
    specification_id: str
    contract_hash: str = ""
```

**Status:** ✅ Models are identical  
**Risk:** LOW  
**Action:** Keep either (no conflict)

**Note:** Both branches have the foundation models. The defect is in *usage*, not *definition*.

---

### 3. Placement Agent blockVersion ⚠️ CRITICAL DEFECT IN GITHUB

**Location:** `services/project-ai/app/agents/placement.py`

#### GitHub Branch (DEFECT):
```python
# Line 53 - HARDCODED
manifest = PlacementManifest(
    manifestId=f"manifest-{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}",
    candidateId=candidate_data.get('candidateId', 'unknown'),
    decision=decision,
    targetPath=_determine_target_path(candidate_data, decision),
    blockFamily=detected_family,
    blockVersion="1.0.0",  # ❌ HARDCODED
    requiredChanges=_determine_required_changes(decision),
    evidenceIds=evidence_ids,
    manifestHash="",
    createdAt=datetime.now(UTC).isoformat()
)
```

#### Local Branch (REMEDIATED):
```python
# Lines 46-53 - EXTRACT FROM WORKFLOW CONTEXT
workflow_target_data = context.workflow_state.get('workflow_target', {})
target_version = workflow_target_data.get('version')
if not target_version or target_version == '':
    # Fallback for workflows that haven't populated target yet
    target_version = "UNKNOWN_VERSION"

# Line 63 - DYNAMIC VERSION
manifest = PlacementManifest(
    manifestId=f"manifest-{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}",
    candidateId=candidate_data.get('candidateId', 'unknown'),
    decision=decision,
    targetPath=_determine_target_path(candidate_data, decision),
    blockFamily=detected_family,
    blockVersion=target_version,  # ✅ DYNAMIC
    requiredChanges=_determine_required_changes(decision),
    evidenceIds=evidence_ids,
    manifestHash="",
    createdAt=datetime.now(UTC).isoformat()
)
```

**Status:** ❌ GitHub has architectural defect  
**Risk:** **HIGH** - This is the primary M2.9 defect  
**Action:** **KEEP LOCAL**

**Impact:** When placement agent runs in GitHub branch, it produces `PlacementManifest` with `blockVersion="1.0.0"` regardless of user's requested target (I7, C2, D3, etc.).

---

### 4. Candidate Routes blockVersion ⚠️ CRITICAL DEFECT IN GITHUB

**Location:** `services/project-ai/app/api/routes/candidate.py`

#### GitHub Branch (DEFECT):
```python
# Lines 379, 395 - HARDCODED
manifest_data = {
    "manifestId": manifest_id,
    "candidateId": candidate_id,
    "decision": decision.value,
    "targetPath": target_path,
    "blockFamily": classification.detectedFamily.value,
    "blockVersion": "1.0.0",  # ❌ Initial version for new blocks
    "requiredChanges": required_changes,
    "evidenceIds": evidence_ids,
    "createdAt": created_at
}
# ...
manifest = PlacementManifest(
    # ...
    blockVersion="1.0.0",  # ❌ HARDCODED
    # ...
)
```

#### Local Branch (REMEDIATED):
```python
# Lines 376-382 - EXTRACT FROM PACKAGE BINDING
# B07 fix: Extract target version from candidate binding/workflow
# NOTE: In full workflow integration, candidate packages should carry
# CandidateBinding with target_version from WorkflowTarget
target_version = getattr(package, 'target_version', None)

if not target_version or target_version == '':
    # No valid version found - this indicates missing workflow binding
    target_version = 'UNKNOWN_VERSION'
    # TODO Wave 3: Add schema validation at intake to enforce target_version presence

# Lines 391, 407 - DYNAMIC VERSION
manifest_data = {
    "manifestId": manifest_id,
    "candidateId": candidate_id,
    "decision": decision.value,
    "targetPath": target_path,
    "blockFamily": classification.detectedFamily.value,
    "blockVersion": target_version,  # ✅ DYNAMIC
    "requiredChanges": required_changes,
    "evidenceIds": evidence_ids,
    "createdAt": created_at
}
# ...
manifest = PlacementManifest(
    # ...
    blockVersion=target_version,  # ✅ DYNAMIC
    # ...
)
```

**Status:** ❌ GitHub has architectural defect  
**Risk:** **HIGH** - Direct API endpoint defect  
**Action:** **KEEP LOCAL**

**Impact:** When External AI calls `/candidates/{id}/generate_manifest`, GitHub returns hardcoded `"1.0.0"` instead of user-requested version from workflow binding.

---

### 5. EngineeringContract Routes ✅ BOTH_EQUIVALENT

**Location:** `services/project-ai/app/api/routes/contract.py`

Both branches have identical implementations:
- `load_repository_snapshot()` for TypeScript integration
- `contracts_store` in-memory storage
- `verify_auth()` and `verify_workflow_ownership()` dependency injection
- Contract generation endpoints

**Status:** ✅ Identical  
**Risk:** LOW  
**Action:** Keep either (no conflict)

**Note:** Contract routes populate `CandidateBinding.contract_hash`, not `blockVersion`. Version binding happens in workflow orchestration and candidate intake.

---

### 6. Test Fixtures

Both branches have identical test patterns:
- `test_certification_gates.py` uses `blockVersion="I1"`, `blockVersion="C1"` (UBRC format) ✅
- `test_placement.py` uses `blockVersion="1.0.0"` as test fixtures (acceptable for structure validation)

**Status:** ✅ Equivalent  
**Risk:** LOW  
**Note:** Test fixtures with "1.0.0" are acceptable. Integration tests validating dynamic extraction would be future enhancement.

---

## M2.9 Requirement Verification

### Objective
> Bind every workflow and candidate to target block family/version, preventing version mismatches (e.g., I7 requested but 1.0.0 hardcoded).

### Verification Matrix

| Requirement | Local | GitHub |
|-------------|-------|--------|
| WorkflowTarget model exists | ✅ | ✅ |
| CandidateBinding model exists | ✅ | ✅ |
| Placement agent extracts version dynamically | ✅ | ❌ |
| Candidate routes extract version dynamically | ✅ | ❌ |
| No hardcoded "1.0.0" in production code | ✅ | ❌ |

**Local satisfies M2.9:** ✅ YES  
**GitHub satisfies M2.9:** ❌ NO

---

## Reconciliation Plan

### Recommendation: **CHERRY_PICK_LOCAL_CHANGES**

The local branch contains the correct M2.9 remediation. GitHub branch retains the defect.

### Files to Preserve from Local:

1. **`services/project-ai/app/agents/placement.py`**
   - Lines 46-53: Extract `target_version` from `context.workflow_state.get('workflow_target', {}).get('version')`
   - Line 63: Assign `blockVersion=target_version` (replace hardcoded "1.0.0")

2. **`services/project-ai/app/api/routes/candidate.py`**
   - Lines 376-382: Extract `target_version` from `getattr(package, 'target_version', None)`
   - Lines 391, 407: Assign `blockVersion=target_version` (replace hardcoded "1.0.0")

### Files to Preserve from GitHub:
None - GitHub contains the defect.

### Conflict Risk:
**LOW** - The changes are:
- **Additive:** New version extraction logic
- **Substitutive:** Variable replacement (hardcoded → dynamic)
- No structural conflicts detected

### Testing Required After Reconciliation:

1. **Unit Tests:**
   ```bash
   pytest services/project-ai/tests/test_placement.py -v
   pytest services/project-ai/tests/test_candidate.py -v
   ```

2. **Integration Test (manual validation):**
   - Create workflow with `WorkflowTarget(version="I7")`
   - Upload candidate package
   - Generate placement manifest
   - **Verify:** `PlacementManifest.blockVersion == "I7"` (not "1.0.0")

3. **Certification Gates:**
   ```bash
   pytest services/project-ai/tests/certification/test_gates.py -v
   ```

---

## Architecture Traceability

### Data Flow (Local Branch - CORRECT):
```
User Request (family="Introduction", version="I7")
    ↓
WorkflowEngine creates WorkflowTarget(version="I7")
    ↓
context.workflow_state['workflow_target'] = {version: "I7"}
    ↓
Placement Agent: workflow_target_data.get('version') → "I7"
    ↓
PlacementManifest(blockVersion="I7")
    ↓
External AI receives manifest with correct version
```

### Data Flow (GitHub Branch - DEFECT):
```
User Request (family="Introduction", version="I7")
    ↓
WorkflowEngine creates WorkflowTarget(version="I7")  ← MODEL EXISTS
    ↓
context.workflow_state['workflow_target'] = {version: "I7"}  ← DATA EXISTS
    ↓
Placement Agent: IGNORES workflow_target, hardcodes "1.0.0"  ← DEFECT
    ↓
PlacementManifest(blockVersion="1.0.0")  ← WRONG
    ↓
External AI receives manifest with incorrect version
```

**Root Cause:** GitHub branch defines the models but doesn't use them for version binding in the placement logic.

---

## Conclusion

### Summary:
- **2 critical defects identified in GitHub branch** (placement agent + candidate routes)
- **0 defects in local branch** (correct M2.9 implementation)
- **Models are equivalent** (both have WorkflowTarget and CandidateBinding)
- **Implementation differs** (local uses models, GitHub ignores them)

### Recommendation:
**PRESERVE LOCAL IMPLEMENTATION** - The local remediation is the authoritative M2.9 fix. Cherry-pick local changes to reconciled branch.

### Next Steps:
1. Create reconciliation branch
2. Cherry-pick local changes for `placement.py` and `candidate.py`
3. Run test suite
4. Verify integration with workflow orchestration
5. Document version binding contract in engineering spec

---

**Investigation Complete**  
*Artifact: `.agents/tasks/m2-9-version-binding-comparison.json`*  
*Report: `.agents/tasks/m2-9-version-binding-comparison.md`*
