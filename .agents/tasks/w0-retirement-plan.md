# Authority Retirement Plan - M2.9 Wave 0

**Purpose:** Document the deprecation and retirement strategy for competing workflow authorities  
**Date:** 2025-01-08  
**Status:** Wave 0 Complete (Deprecation Marked), Wave 1+ Execution Pending

---

## Overview

M2.9 Wave 0 establishes `CanonicalWorkflowState` as the single source of truth for Project LLM workflow lifecycle management. This document outlines the retirement strategy for competing authorities and the migration path for existing code.

**Key Principle:** The canonical workflow authority is now operational, but legacy systems remain for backwards compatibility. Future waves will complete the migration.

---

## Competing Authorities Identified

### 1. TaskState (Workflow-Level Usage)

**Current Status:** Partially deprecated  
**Location:** `app/models/task_state.py`, `app/api/routes/tasks.py`  
**Scope:** Workflow-level state tracking (task creation, approval, rejection)

**Decision:**
- **DEPRECATED for workflow-level operations** (marked in Wave 0)
- **PRESERVED for agent-level execution tracking** (internal agent orchestration)
- **Migration Path:** Replace workflow-level TaskState usage with CanonicalWorkflowState

**Retirement Timeline:**
- **Wave 0:** Deprecation warnings added to `/tasks` endpoints (✅ COMPLETE)
- **Wave 1:** Update task routes to internally delegate to `/workflows` endpoints
- **Wave 2+:** Remove `/tasks` endpoints entirely, return 410 GONE

**Impact:**
- Frontend using `/tasks` endpoints must migrate to `/workflows` endpoints
- Agent execution code (`AgentCoordinator`, `WorkflowEngine`) can continue using TaskState for internal tracking

---

### 2. Frontend State Machine (ProjectLlmContext)

**Current Status:** Not deprecated (Wave 0 is backend-only)  
**Location:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx`  
**Scope:** Frontend-local workflow state management using localStorage

**Decision:**
- **RETIRE independent frontend state machine**
- **REPLACE with backend state consumption via `/workflows` API**
- **Frontend should display backend state, not create its own**

**Retirement Timeline:**
- **Wave 0:** Backend API created, frontend integration documented but not implemented
- **Wave 1+:** Frontend implementation
  1. Replace localStorage state with API calls to `GET /workflows/{workflow_id}`
  2. Use `current_state` from backend as source of truth
  3. Map backend states to UI steps for display only (navigation aid, not authority)
  4. Call governance approval endpoints for gate progression

**Impact:**
- Frontend loses independent state management authority
- Frontend becomes a read-only view of backend state with user interaction endpoints
- Simplifies frontend logic, eliminates state synchronization bugs

**Migration Example:**
```typescript
// OLD (Wave 0): Frontend owns state
const [step, setStep] = useState(1);
const [workflowState, setWorkflowState] = useState("discovery");

// NEW (Wave 1+): Backend owns state
const { data: workflow } = useQuery(['workflow', workflowId], 
  () => fetchWorkflowState(workflowId)
);
const step = getStepFromBackendState(workflow.state.current); // Display only
```

---

### 3. Creation Routes (`/creation` endpoints)

**Current Status:** Not deprecated yet (no competing routes found in codebase)  
**Location:** If exists, likely in `app/api/routes/creation.py`  
**Scope:** Alternative workflow creation endpoints using non-canonical states

**Decision:**
- **DEPRECATED if found** (not present in current codebase review)
- **MIGRATE to `/workflows` endpoints**

**Retirement Timeline:**
- **Wave 0:** No action (not found in repository)
- **Wave 1+:** If discovered, add deprecation warnings and migration path

**Impact:**
- Minimal (no usage found)

---

### 4. Legacy Workflow State Dictionaries

**Current Status:** Coexisting with canonical workflow (Wave 0)  
**Location:** `app/api/routes/governance.py` (`_workflow_states` dict)  
**Scope:** In-memory workflow state storage predating WorkflowGovernanceService

**Decision:**
- **ADAPTER LAYER created in Wave 0** (✅ COMPLETE)
- **Governance routes check both governance_service and _workflow_states for backwards compatibility**
- **Full migration to governance_service in Wave 1+**

**Retirement Timeline:**
- **Wave 0:** Governance routes updated to prioritize `governance_service`, fallback to `_workflow_states` (✅ COMPLETE)
- **Wave 1:** Migrate all workflow creation to use `governance_service.create_workflow()`
- **Wave 2+:** Remove `_workflow_states` dict, all workflows stored in governance service

**Impact:**
- Minimal (adapter layer provides compatibility)
- Existing workflows in `_workflow_states` continue to work during transition

---

## Files Affected

### Files Modified in Wave 0 (✅ COMPLETE)

1. **app/api/routes/tasks.py**
   - Status: Deprecated (router marked `deprecated=True`)
   - Action: Added deprecation warnings to all endpoints
   - Migration: No functional changes yet

2. **app/api/routes/governance.py**
   - Status: Adapter layer created
   - Action: Updated `approve_placement()` to use `WorkflowGovernanceService` with `_workflow_states` fallback
   - Migration: Prioritizes canonical workflows, supports legacy workflows

3. **app/models/workflow.py**
   - Status: Documentation clarified
   - Action: Fixed `specification_id` docstring to match implementation ("Target version" not "Block family + version")
   - Migration: No functional changes

### Files to Modify in Wave 1+

1. **app/orchestration/workflow_engine.py**
   - Status: Not modified in Wave 0
   - Action Required: Add `execute_workflow_stage(workflow_id)` method that reads canonical state from `governance_service`
   - Migration: Map canonical states to agent execution, call `governance_service.transition_state()` after completion

2. **app/orchestration/agent_coordinator.py**
   - Status: Not modified in Wave 0
   - Action Required: Wire to canonical workflow state transitions
   - Migration: After agent completion, call `governance_service.transition_state()` with evidence

3. **app/api/routes/creation.py** (if exists)
   - Status: Not found in Wave 0 codebase
   - Action Required: Deprecate or remove
   - Migration: Replace with `/workflows` endpoints

4. **apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx**
   - Status: Not modified in Wave 0 (backend-only wave)
   - Action Required: Replace localStorage state with backend API consumption
   - Migration: See frontend migration example above

---

## Database Persistence

**Current Status:** In-memory storage only (Wave 0)  
**Location:** `WorkflowGovernanceService._workflows` dict, `_approvals` dict

**Retirement Timeline:**
- **Wave 0:** In-memory storage (✅ COMPLETE)
- **Wave 1+:** Database persistence layer
  - Add database models for `ProjectLLMWorkflow`, `StateTransition`, `ImplementationApproval`
  - Update `WorkflowGovernanceService` to use database backend
  - Migrate existing in-memory workflows to database (if any)

**Impact:**
- Workflows survive service restarts
- Enables multi-instance deployment
- Audit trail persists permanently

---

## Test Migration

### Tests Modified in Wave 0

- **tests/unit/test_workflow_model.py** (NEW, 13 tests)
- **tests/unit/test_workflow_governance_service.py** (NEW, 23 tests)

All 36 new tests pass.

### Tests to Update in Wave 1+

1. **tests/test_workflow_engine_agents.py**
   - Update fixtures to create workflows via `governance_service.create_workflow()`
   - Update assertions to check `workflow.current_state` instead of `task["state"]`

2. **tests/test_agent_coordinator.py**
   - Update to verify state transitions through governance service
   - Test evidence attachment to workflow records

3. **tests/integration/test_workflow_routes.py** (if created)
   - Integration tests for complete workflow API

---

## Evidence Requirements

All authority retirement actions must produce evidence:

1. **Deprecation Evidence** (Wave 0): ✅ COMPLETE
   - Deprecation warnings in tasks.py docstrings
   - Router marked `deprecated=True`
   - Documentation updated in retirement plan

2. **Migration Evidence** (Wave 1+):
   - Before/after test counts showing migrated workflows
   - Git commits removing deprecated code
   - Evidence JSON documenting removed files

3. **Compatibility Evidence** (Wave 0): ✅ COMPLETE
   - Adapter layer in governance.py preserves legacy workflow support
   - No breaking changes to existing API consumers

---

## Risk Mitigation

### Wave 0 Risks (MITIGATED)

**Risk:** Breaking existing workflows using `/tasks` or `_workflow_states`  
**Mitigation:** ✅ Deprecation warnings only, no functional changes. Adapter layer provides compatibility.

**Risk:** Frontend breaks due to backend state changes  
**Mitigation:** ✅ Wave 0 is backend-only. Frontend untouched. No breaking changes.

### Wave 1+ Risks

**Risk:** Lost workflows during database migration  
**Mitigation:** Export in-memory workflows before migration, verify migration completeness

**Risk:** Frontend-backend state desynchronization  
**Mitigation:** Backend becomes single source of truth, frontend becomes read-only consumer

---

## Completion Criteria

### Wave 0 Completion (✅ ACHIEVED)

- ✅ CanonicalWorkflowState enum with 17 states created
- ✅ WorkflowGovernanceService implements state transition authority
- ✅ REST API `/workflows` endpoints created
- ✅ Task routes marked deprecated with warnings
- ✅ Governance routes integrated with governance_service (adapter layer)
- ✅ 36 new unit tests pass
- ✅ Retirement plan documented

### Wave 1+ Completion Criteria

- [ ] WorkflowEngine uses `execute_workflow_stage(workflow_id)`
- [ ] AgentCoordinator calls `governance_service.transition_state()` after agent completion
- [ ] Task routes removed or return 410 GONE
- [ ] Frontend consumes backend state via `/workflows` API
- [ ] Database persistence for workflows
- [ ] `_workflow_states` dict removed from governance.py
- [ ] All tests updated to use canonical workflow patterns

---

## Summary

**Wave 0 Outcome:** Canonical workflow authority established with zero breaking changes. Legacy systems remain functional via deprecation warnings and adapter layers.

**Next Steps (Wave 1+):** Complete integration by wiring WorkflowEngine, removing task routes, implementing frontend migration, and adding database persistence.

**Authority Status:**
- ✅ Canonical: `CanonicalWorkflowState` + `WorkflowGovernanceService`
- ⚠️ Deprecated: `/tasks` routes (functional with warnings)
- ⚠️ Legacy: `_workflow_states` dict (functional via adapter)
- 🔜 Future Migration: Frontend state machine, WorkflowEngine, AgentCoordinator
