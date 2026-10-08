# Migration Guide: Legacy /creation to Canonical Workflow

**Version:** M2.9 Wave 1C  
**Status:** Complete  
**Branch:** m2-project-ai-canonical-wiring

## Overview

The legacy `/creation` endpoints bypassed the canonical workflow lifecycle by allowing mode-based shortcuts (`I2_ONLY`, `MIX_AND_MATCH`). These endpoints are now deprecated and return `405 METHOD_NOT_ALLOWED`. All workflows must follow the `CanonicalWorkflowState` lifecycle (17 states) defined in `app/orchestration/canonical_workflow.py`.

## Deprecation Timeline

- **M2.9 Wave 0 (Complete):** Legacy endpoints disabled, return 405 errors
- **M2.9 Wave 1C (Current):** Explicit deprecation markers added, migration guide published
- **M2.10 (Planned):** Legacy code removal after all clients migrated

## Endpoint Mapping

### 1. Workflow Creation

**Legacy:**
```python
POST /creation/workflows
{
  "design_source": "REPOSITORY_CANONICAL",
  "composition": {
    "base": "I2",
    "structure": "I2",
    "hero": "I2",
    "footer": "I2"
  },
  "candidateBlocks": []
}
```

**Canonical:**
```python
POST /tasks/plan
{
  "project_id": "proj_123",
  "requirements": "E-commerce site with product catalog and cart",
  "design_hints": {
    "preferred_blocks": ["I2", "I3"],
    "design_source": "REPOSITORY_CANONICAL"
  }
}
```

**Key Changes:**
- No direct composition specification - workflow discovers appropriate blocks
- `design_source` becomes a hint, not a constraint
- Workflow follows full REQUESTED → DISCOVERY → BRIEF_READY → ... → CERTIFIED lifecycle
- No mode-based bypass shortcuts

### 2. Workflow Status

**Legacy:**
```python
GET /creation/workflows/{workflow_id}
# Returns: WorkflowStatus (CREATED, VALIDATING, CERTIFYING, CERTIFIED, FAILED)
```

**Canonical:**
```python
GET /tasks/{task_id}
# Returns: CanonicalWorkflowState (17 states)
# Examples: REQUESTED, DISCOVERY, BRIEF_READY, AWAITING_GATE_1, CANDIDATE_AUDIT, etc.
```

**State Mapping:**
- `CREATED` → `REQUESTED` or `DISCOVERY`
- `VALIDATING` → `CANDIDATE_AUDIT`
- `CERTIFYING` → `CERTIFICATION_READY`
- `CERTIFIED` → `CERTIFIED`
- `FAILED` → `REJECTED`

### 3. Workflow Validation

**Legacy:**
```python
POST /creation/workflows/{workflow_id}/validate
# Explicit validation step
```

**Canonical:**
```python
# Validation happens automatically in workflow lifecycle:
# - DISCOVERY state: Repository contract extraction
# - CANDIDATE_AUDIT state: Compliance gates (UBRC, brand, theme)
# - VERIFYING state: Runtime/browser verification
# No explicit validation endpoint needed
```

**Key Changes:**
- Validation is continuous, not a single step
- Multiple validation phases (discovery, audit, verification)
- Gates execute automatically based on state transitions

### 4. Workflow Certification

**Legacy:**
```python
POST /creation/workflows/{workflow_id}/certify
# Runs all 6 certification gates
```

**Canonical:**
```python
# Certification is multi-phase:
# 1. CANDIDATE_AUDIT state: All 6 gates execute automatically
# 2. CERTIFICATION_READY state: Gates passed, awaiting approval
# 3. POST /governance/{approval_id}/approve: Human final approval
# 4. CERTIFIED state: Workflow complete

GET /tasks/{task_id}
# Check certificationGates array in response
```

**Key Changes:**
- Certification gates execute automatically during workflow
- Human approval required at AWAITING_GATE_2
- No explicit "certify" endpoint - state machine drives certification

## Design Source vs Creation Mode

### Legacy CreationMode (REMOVED)

```python
class CreationMode(str, Enum):
    I2_ONLY = "I2_ONLY"  # ❌ Bypassed workflow by forcing I2 blocks
    MIX_AND_MATCH = "MIX_AND_MATCH"  # ❌ Bypassed workflow by mixing canonical + candidate
    CANDIDATE_ONLY = "CANDIDATE_ONLY"  # ❌ Bypassed workflow by skipping discovery
```

**Problems:**
- Allowed workflow bypass (different lifecycles for different modes)
- Mixed workflow state with content sourcing
- Violated architectural rule: all candidates follow same lifecycle

### Canonical DesignSource (CURRENT)

```python
class DesignSource(str, Enum):
    """
    Indicates where block design originates, WITHOUT bypassing canonical workflow.
    
    All design sources follow the same CanonicalWorkflowState lifecycle.
    DesignSource controls WHAT is discovered, not HOW workflow proceeds.
    """
    REPOSITORY_CANONICAL = "REPOSITORY_CANONICAL"
    # Design from existing canonical blocks (I1-I6, C1-C5)
    
    EXTERNAL_AI_PROTOTYPE = "EXTERNAL_AI_PROTOTYPE"
    # Design created by External AI based on requirements + repository context
    
    USER_SPECIFICATION = "USER_SPECIFICATION"
    # Design specified directly by user with explicit requirements
```

**Usage:**
```python
# DesignSource is an INPUT hint, not a workflow state
POST /tasks/plan
{
  "design_hints": {
    "design_source": "REPOSITORY_CANONICAL",
    "preferred_blocks": ["I2", "I3"]
  }
}

# Workflow still follows full lifecycle:
# REQUESTED → DISCOVERY → BRIEF_READY → AWAITING_GATE_1 → ...
```

**Key Difference:**
- **CreationMode:** Controlled workflow state (bypass shortcuts) ❌
- **DesignSource:** Indicates content origin (same workflow for all) ✅

## Complete Migration Example

### Before (Legacy /creation)

```python
import httpx

# Create workflow with I2-only mode
response = httpx.post("http://api/creation/workflows", json={
    "mode": "I2_ONLY",
    "composition": {
        "base": "I2",
        "structure": "I2",
        "hero": "I2",
        "footer": "I2"
    },
    "candidateBlocks": []
})
workflow = response.json()
workflow_id = workflow["workflowId"]

# Validate
httpx.post(f"http://api/creation/workflows/{workflow_id}/validate")

# Certify
httpx.post(f"http://api/creation/workflows/{workflow_id}/certify")

# Check status
status = httpx.get(f"http://api/creation/workflows/{workflow_id}")
```

### After (Canonical Workflow)

```python
import httpx
import time

# 1. Initiate workflow
response = httpx.post("http://api/tasks/plan", json={
    "project_id": "proj_123",
    "requirements": "E-commerce site with product catalog",
    "design_hints": {
        "design_source": "REPOSITORY_CANONICAL",
        "preferred_blocks": ["I2"]
    }
})
task = response.json()
task_id = task["task_id"]

# 2. Wait for AWAITING_GATE_1 (GUI prototype ready)
while True:
    task = httpx.get(f"http://api/tasks/{task_id}").json()
    if task["state"] == "AWAITING_GATE_1":
        break
    time.sleep(1)

# 3. Approve GUI prototype
approval_id = task["pending_approvals"][0]["approval_id"]
httpx.post(f"http://api/governance/{approval_id}/approve", json={
    "decision": "APPROVE",
    "notes": "GUI looks good"
})

# 4. Upload candidate package
httpx.post("http://api/candidates/upload", files={
    "package": open("candidate.zip", "rb")
}, data={
    "task_id": task_id
})

# 5. Wait for CERTIFICATION_READY (all gates passed)
while True:
    task = httpx.get(f"http://api/tasks/{task_id}").json()
    if task["state"] == "CERTIFICATION_READY":
        break
    time.sleep(1)

# 6. Approve final certification
approval_id = task["pending_approvals"][0]["approval_id"]
httpx.post(f"http://api/governance/{approval_id}/approve", json={
    "decision": "APPROVE",
    "notes": "All gates passed, approve certification"
})

# 7. Wait for CERTIFIED state
while True:
    task = httpx.get(f"http://api/tasks/{task_id}").json()
    if task["state"] == "CERTIFIED":
        break
    time.sleep(1)

print(f"Workflow certified: {task_id}")
```

**Key Differences:**
- No mode-based shortcuts - full workflow lifecycle required
- Multiple human approval gates (GUI, placement, certification)
- Validation/certification happen automatically based on state
- More granular state visibility (17 states vs 5)

## Certification Gates

All workflows now execute the same 6 certification gates:

1. **UBRC_COMPLIANCE** - Universal Block Registry Contract compliance
2. **BRAND_INDEPENDENCE** - No hard-coded brand/visual data
3. **THEME_COMPATIBILITY** - Renders correctly with all themes
4. **REGISTRY_VERIFICATION** - Block registered with valid metadata
5. **RENDERER_VERIFICATION** - Runtime verification (browser tests)
6. **EVIDENCE_BINDING** - All evidence artifacts bound to workflow

Gates execute automatically during `CANDIDATE_AUDIT` state. No explicit "certify" call required.

## Common Migration Scenarios

### Scenario 1: I2-Only Workflow

**Legacy:**
```python
POST /creation/workflows
{"mode": "I2_ONLY", "composition": {"base": "I2", "hero": "I2"}}
```

**Migration:**
```python
POST /tasks/plan
{
  "requirements": "Landing page with hero section",
  "design_hints": {
    "design_source": "REPOSITORY_CANONICAL",
    "preferred_blocks": ["I2"]
  }
}
# Discovery phase will find I2 blocks based on hints
```

### Scenario 2: Mix & Match Workflow

**Legacy:**
```python
POST /creation/workflows
{
  "mode": "MIX_AND_MATCH",
  "composition": {"base": "I2", "hero": "CANDIDATE"},
  "candidateBlocks": ["T13"]
}
```

**Migration:**
```python
# Step 1: Initiate workflow
POST /tasks/plan
{
  "requirements": "Landing page with custom hero",
  "design_hints": {
    "design_source": "MIX_AND_MATCH",  # Hint only
    "base_blocks": ["I2"],
    "candidate_blocks": ["hero"]
  }
}

# Step 2: Upload candidate for hero
POST /candidates/upload
{
  "task_id": "task_123",
  "placement": {"hero": "T13"}
}

# Workflow validates candidate + canonical blocks together
# No workflow bypass - follows full lifecycle
```

### Scenario 3: Candidate-Only Workflow

**Legacy:**
```python
POST /creation/workflows
{"mode": "CANDIDATE_ONLY", "candidateBlocks": ["T13", "T14"]}
```

**Migration:**
```python
POST /tasks/plan
{
  "requirements": "Custom blocks for product page",
  "design_hints": {
    "design_source": "USER_SPECIFICATION"
  }
}

POST /candidates/upload
{
  "task_id": "task_123",
  "blocks": ["T13", "T14"]
}

# Candidates go through full certification lifecycle
# No shortcut to CERTIFIED state
```

## Error Handling

### Legacy Endpoint Errors

All `/creation` endpoints now return:

```json
{
  "detail": {
    "error": "LEGACY_ENDPOINT_DISABLED",
    "message": "POST /creation/workflows is deprecated (M2.9 Wave 0). Use canonical workflow endpoints.",
    "canonical_workflow": {
      "initiate": "POST /tasks/plan",
      "status": "GET /tasks/{task_id}",
      "upload": "POST /candidates/upload",
      "approve": "POST /governance/{approval_id}/approve"
    },
    "reason": "CreationMode allowed workflow bypass (I2_ONLY, MIX_AND_MATCH), violating architectural requirement that all candidates follow same lifecycle."
  }
}
```

### Migration Strategy

1. **Update client code** to use canonical endpoints
2. **Remove mode logic** - all workflows follow same lifecycle
3. **Add approval handlers** for human gates (AWAITING_GATE_1, AWAITING_GATE_2)
4. **Update state checks** from 5 WorkflowStatus values to 17 CanonicalWorkflowState values
5. **Test thoroughly** - canonical workflow has more states and approval points

## Architectural Benefits

### Before (Legacy /creation)
- ❌ Multiple workflow paths (I2_ONLY, MIX_AND_MATCH, CANDIDATE_ONLY)
- ❌ Different certification rules per mode
- ❌ Workflow bypass shortcuts
- ❌ Mixed state authorities (WorkflowStatus, TaskState, CreationMode)

### After (Canonical Workflow)
- ✅ Single workflow path for all candidates
- ✅ Uniform certification (6 gates for all)
- ✅ No workflow bypass - full lifecycle always
- ✅ Single state authority (CanonicalWorkflowState, 17 states)

## Support

For migration assistance, see:
- Canonical workflow specification: `app/orchestration/canonical_workflow.py`
- State transition rules: `CanonicalWorkflowState` enum docstrings
- Example tests: `tests/test_workflows.py`
- Architecture decisions: `.agents/tasks/w0-canonical-state-report.json`

**Questions?** Contact the architecture team or file an issue referencing M2.9 Wave 1C.
