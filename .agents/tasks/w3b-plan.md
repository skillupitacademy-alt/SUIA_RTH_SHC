# Implementation Plan: M2.9 Wave 3B — Wire Agent 7 to Real CanonicalComparator

## Context

Wave 3 (M2.9-W3) implemented three core intake components:
1. **CandidateValidator** — validates uploaded candidates (already wired to intake agent)
2. **CanonicalComparator** — compares candidates against canonical blocks (✅ implemented, ❌ not yet wired)
3. **PlacementManifestGenerator** — generates placement manifests (already wired to placement agent)

**Current State:**
- `app/intake/canonical_comparator.py` contains the real `CanonicalComparator` class
- `app/agents/canonical_comparison.py` contains `execute_canonical_comparison()` async handler
- Tests in `tests/unit/test_canonical_comparison.py` pass (12/12)
- Agent coordinator currently has NO handler for canonical_comparison agent — falls through to stub

**This Task (W3B):**
Wire the existing `execute_canonical_comparison` handler into `agent_coordinator.py` so that Agent 7 (canonical_comparison) calls the real comparison logic instead of the stub.

## Architecture Notes

**Import Path:**
- Real comparator: `app.intake.canonical_comparator.CanonicalComparator`
- Agent handler: `app.agents.canonical_comparison.execute_canonical_comparison`

**Method Signature:**
```python
# app/intake/canonical_comparator.py
class CanonicalComparator:
    def compare(
        self,
        candidate_artifacts: List[Dict[str, Any]],
        required_artifacts: List[str],
        target_family: str,
        target_version: str,
        contract: RepositoryBlockContract = None
    ) -> ComparisonReport
```

**Agent Handler:**
```python
# app/agents/canonical_comparison.py
async def execute_canonical_comparison(context: AgentContext) -> AgentResult
```

**ComparisonResult Model Fields:**
- `status`: Literal["PASS", "FAIL", "BLOCKED"]
- `target_match`: bool (family/version match)
- `artifacts`: List[ArtifactComparison]
- `missing_requirements`: List[str] (required artifacts missing)
- `unexpected_artifacts`: List[str] (artifacts not in contract)
- `conflicts`: List[str] (conflicts detected)
- `evidence_ids`: List[str] (evidence IDs used)

**Status Semantics:**
- `BLOCKED`: No contract available (no gates to run)
- `FAIL`: Family/version mismatch OR missing required artifacts
- `PASS`: Target match + all required artifacts present (unexpected artifacts generate warnings but don't fail)

**Status Aggregation (for final gate):**
- No gates → BLOCKED
- Any FAIL → FAIL
- Any BLOCKED → BLOCKED (if gates exist)
- All PASS → PASS

## Stub Location

**File:** `app/orchestration/agent_coordinator.py`

**Lines to Replace:**
Lines 214-217 (approximate — exact line numbers verified during implementation):

```python
else:
    # For agents without implemented handlers yet, mark as success with stub
    result.warnings.append(f"Agent {agent.agentId} has no execution handler yet (stub)")
    result.outputs["status"] = "stub_execution"
```

**Replacement Strategy:**
Add a new `elif` branch BEFORE the `else` stub handler:

```python
elif agent.agentId == "canonical_comparison":
    from app.agents.canonical_comparison import execute_canonical_comparison
    return await execute_canonical_comparison(context)
```

This follows the existing pattern for other R4 agents (toolchain, dependency, intake, placement, governance, documentation, final-gate).

## Implementation Plan

### 1. Wire canonical_comparison agent handler in agent_coordinator.py

**What:** Add conditional branch to dispatch to `execute_canonical_comparison` when `agent.agentId == "canonical_comparison"`.

**Files:**
- `services/project-ai/app/orchestration/agent_coordinator.py`

**Changes:**
Add the following after line 188 (after `final-gate` handler, before existing handlers that use `agent.agentType`):

```python
elif agent.agentId == "canonical_comparison":
    from app.agents.canonical_comparison import execute_canonical_comparison
    return await execute_canonical_comparison(context)
```

**Verify:**
Run unit tests for agent coordinator:
```bash
cd services/project-ai
python -m pytest tests/unit/test_canonical_comparison.py -v
```
Expected: All 12 tests pass (status unchanged — tests already pass).

### 2. Verify integration with agent execution flow

**What:** Ensure canonical_comparison agent can be executed through the coordinator with proper context.

**Files:**
- `services/project-ai/tests/unit/test_canonical_comparison.py` (read to understand test coverage)
- Create new integration test: `services/project-ai/tests/integration/test_agent_coordinator_canonical.py` (optional)

**Verify:**
Run existing coordinator tests to ensure no regressions:
```bash
cd services/project-ai
python -m pytest tests/unit/ -k "agent_coordinator or canonical" -v
```
Expected: All existing tests pass, canonical_comparison no longer falls through to stub.

### 3. Update agent registry documentation (if needed)

**What:** Verify agent registry already includes canonical_comparison agent in its documentation.

**Files:**
- `services/project-ai/app/orchestration/agent_registry.py` (read-only verification)

**Expected State:** Agent registry does NOT yet define a canonical_comparison AgentType (it's called as an agentId like other R4 agents, not via AgentType enum).

**Verify:** Grep for canonical references:
```bash
cd services/project-ai
grep -rn "canonical" app/orchestration/agent_registry.py
```
Expected: No matches (canonical_comparison uses agentId pattern, not AgentType pattern).

### 4. Verify final_gate integration

**What:** Ensure final_gate expects `canonical_comparison` evidence and processes PASS/FAIL/BLOCKED correctly.

**Files:**
- `services/project-ai/app/agents/final_gate.py` (read-only verification)
- `services/project-ai/tests/unit/test_final_gate.py` (read to verify test coverage)

**Expected State:** final_gate.py already includes `"canonical_comparison"` in `REQUIRED_EVIDENCE` list (line 32).

**Verify:**
Run final gate tests:
```bash
cd services/project-ai
python -m pytest tests/unit/test_final_gate.py -v
```
Expected: All 14 tests pass (status unchanged — tests already expect canonical_comparison).

### 5. Run full test suite to confirm no regressions

**What:** Run complete test suite to verify wiring does not break existing functionality.

**Files:** All test files in `services/project-ai/tests/`

**Verify:**
```bash
cd services/project-ai
python -m pytest tests/unit/ -v --tb=short
```
Expected: All unit tests pass (currently ~288 tests passing based on README).

### 6. Commit and document the change

**What:** Commit the single-line change with descriptive message documenting the wiring.

**Files:** All modified files

**Commit Message:**
```
feat(m2.9-w3b): Wire canonical_comparison agent to real CanonicalComparator

Wire Agent 7 (canonical_comparison) to execute_canonical_comparison() handler
in agent_coordinator.py. Removes stub fallthrough for canonical_comparison.

Changes:
- app/orchestration/agent_coordinator.py: Add canonical_comparison dispatch

The CanonicalComparator implementation was added in W3 (commit 22214ef6) but
was not wired to the agent coordinator. This completes the integration.

Tests:
- Existing tests/unit/test_canonical_comparison.py: 12/12 pass
- Existing tests/unit/test_final_gate.py: 14/14 pass (expects canonical_comparison)
- Full unit suite: ~288 tests pass

Related:
- M2.9 Wave 3: Candidate Intake + Canonical Comparison + Placement Manifest
- .agents/tasks/m2-9-w3-gate.json: W3 gate passed
```

**Verify:**
```bash
cd e:\onlinewebsites\quiz-platform
git add services/project-ai/app/orchestration/agent_coordinator.py
git commit -m "feat(m2.9-w3b): Wire canonical_comparison agent to real CanonicalComparator"
git push origin HEAD
```
Expected: Commit succeeds, pushed to remote.

---

## Summary

This plan completes the integration of the CanonicalComparator (implemented in W3) by wiring it into the agent coordinator dispatch logic. The change is minimal (1 new elif branch, 3 lines of code) because:

1. The comparator implementation already exists (`app/intake/canonical_comparator.py`)
2. The agent handler already exists (`app/agents/canonical_comparison.py`)
3. The tests already exist and pass (`tests/unit/test_canonical_comparison.py`)
4. The final gate already expects canonical_comparison evidence (`app/agents/final_gate.py`)

**The only missing piece:** The dispatch from `agent_coordinator._execute_agent_capabilities()` to `execute_canonical_comparison()`.

This wiring enables the full W3 intake pipeline:
```
CANDIDATE_RECEIVED 
  → CandidateValidator validates upload
  → CANDIDATE_AUDIT

CANDIDATE_AUDIT 
  → CanonicalComparator runs compliance gates (✅ this task)
  → INTEGRATION_PLANNED (if PASS)
  → REJECTED (if FAIL)

INTEGRATION_PLANNED 
  → PlacementManifestGenerator creates manifest
  → AWAITING_IMPLEMENTATION_APPROVAL
```
