# M2.9 Canonical Project LLM Wiring — Implementation Plan

**Task ID:** m2-9-canonical-project-llm-wiring  
**Base Branch:** `project-ai-gui` (HEAD: 44d4928d)  
**Target Branch:** `m2-project-ai-canonical-wiring` (to be created from `project-ai-gui`)  
**Status:** Ready for implementation  
**Date:** 2026-10-07

## Executive Summary

This plan implements the M2.9 Canonical Project LLM Wiring phase, establishing a controlled multi-agent engineering pipeline with explicit ownership, dependency-aware waves, sequential gates, mandatory tests, machine-readable evidence logs, and git commits per wave.

The implementation addresses the audit findings that the current system has:
- Multiple competing workflow authorities (WorkflowEngine vs TaskState vs CreationMode)
- Disconnected frontend and backend
- Static/hardcoded GUI state
- 55 failing backend tests
- No real file upload flow
- Mix & Match mode that bypasses canonical workflow

## Foundation Analysis

### Current State Discovery

**Branch Status:**
- Current branch: `project-ai-gui` (HEAD: 44d4928d)
- Recent M1 baseline: `main` at 9b272567 (commit from M2 spec)
- Project structure: TypeScript monorepo + Python FastAPI service

**Existing Architecture:**
- **Orchestration Layer:** `services/project-ai/app/orchestration/`
  - `workflow_engine.py` - defines WorkflowStep with TaskState transitions
  - `agent_coordinator.py` - DAG-based agent execution framework
  - `agent_registry.py` - 15 specialized agents
  - `gate_controller.py` - gate enforcement (not inspected in detail)

**Competing Authorities Found:**
1. `TaskState` enum in `app/models/task_state.py`:
   - States: CREATED, DISCOVERY, PLANNING, WAITING_FOR_APPROVAL, IMPLEMENTING, TESTING, VERIFYING, COMPLETED, FAILED, BLOCKED, REJECTED
2. `WorkflowStatus` enum in `app/models/creation.py`:
   - States: CREATED, VALIDATING, CERTIFYING, CERTIFIED, FAILED
3. `CreationMode` enum in `app/models/creation.py`:
   - I2_ONLY, MIX_AND_MATCH, NEW_CANDIDATE (referenced in `api/routes/creation.py` line 98)

**Agent Stubs:**
- `app/agents/intake.py` - REAL implementation (classify candidate, compare to canonical)
- `app/agents/placement.py` - REAL implementation (generate manifest with hash)
- `app/agents/final_gate.py` - REAL implementation (verdict generation, evidence binding)
- No obvious stubs found; most agents have real logic

**Contracts Layer:**
- `app/models/candidate.py` - BlockFamily, PlacementDecision, CandidatePackage, PlacementManifest
- `app/models/creation.py` - CreationMode, WorkflowStatus, CertificationGate
- `app/models/task_state.py` - TaskState
- No `contracts/` directory found; contracts are in models

**Evidence Directory:**
- `docs/project-llm/evidence/` does NOT exist
- Evidence implementation in `services/project-ai/app/evidence/`
- Evidence exists in `services/project-ai/.evidence/` (local to Python service)

**Canonical References:**
- IntroductionI1Block.tsx: NOT FOUND
- CodeC1Block.tsx: EXISTS at `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- DefinitionD1Block.tsx: NOT FOUND
- Canonical blocks may not follow I1/C1/D1 naming convention in codebase

**Test Status:**
- Discovery package: 32 test files, 245 tests PASS
- Python service: 55 failed, 269 passed, 6 skipped (see test output above)
- Major failures in certification gate tests due to manifest validation precedence

**M2 Specification Baseline:**
- M1 commit: 9b272567
- M2 phases: Evidence lifecycle (V3), Evidence binding (V8), Toolchain, Composer/API/Schema, Dependency graph, UBRC, Runtime/Browser, Project AI/FastAPI
- Key rule: Python NEVER scans repository directly; only consumes TypeScript snapshot

**Audit Findings (PROJECT_LLM_IMPLEMENTATION_ALIGNMENT_MATRIX_2026-10-07.md):**
- Frontend not connected to backend (no fetch/axios calls found)
- Candidate upload UI is visual only
- Compliance brief is static text, not backend-generated
- Backend certification tests failing (55 tests)
- CreationMode.MIX_AND_MATCH and I2_ONLY exist but should use unified workflow
- Placement executor can write files/commit (risky without isolation)
- Versioning mismatch: manifest uses "1.0.0", UI uses "I7"

## Architectural Decisions

### Decision 1: Single Canonical Workflow State Machine

**Problem:** Three competing state enums (TaskState, WorkflowStatus, CreationMode) create ambiguity.

**Decision:** Establish `CanonicalWorkflowState` as the single authority for Project LLM lifecycle. Map existing states to canonical states:

```python
class CanonicalWorkflowState(str, Enum):
    """Canonical workflow states for Project LLM M2.9 architecture."""
    REQUESTED = "REQUESTED"                                  # User initiates workflow
    DISCOVERY = "DISCOVERY"                                  # Repository evidence gathering
    BRIEF_READY = "BRIEF_READY"                             # Compliance brief generated
    AWAITING_GATE_1 = "AWAITING_GATE_1"                     # GUI prototype approval pending
    GUI_APPROVED = "GUI_APPROVED"                            # Gate 1 passed
    CANDIDATE_REQUESTED = "CANDIDATE_REQUESTED"              # External AI implementation requested
    CANDIDATE_RECEIVED = "CANDIDATE_RECEIVED"                # Candidate package uploaded
    CANDIDATE_AUDIT = "CANDIDATE_AUDIT"                      # Running compliance gates
    INTEGRATION_PLANNED = "INTEGRATION_PLANNED"              # Placement manifest generated
    AWAITING_IMPLEMENTATION_APPROVAL = "AWAITING_IMPLEMENTATION_APPROVAL"  # Gate 2 pending
    IMPLEMENTING = "IMPLEMENTING"                            # Executing placement
    IMPLEMENTED = "IMPLEMENTED"                              # Files written, committed
    VERIFYING = "VERIFYING"                                  # Runtime/browser verification
    CERTIFICATION_READY = "CERTIFICATION_READY"              # All gates passed
    AWAITING_GATE_2 = "AWAITING_GATE_2"                     # Final HAA certification pending
    CERTIFIED = "CERTIFIED"                                  # HAA approved, ready for merge
    REJECTED = "REJECTED"                                    # Workflow rejected at any gate
```

**Rationale:** This matches the user scenario in the original request and audit document. Each state maps to a distinct responsibility boundary.

**File to create:** `services/project-ai/app/models/canonical_workflow_state.py`

**Existing models to alias:**
- `TaskState` → keep for backward compatibility, map to CanonicalWorkflowState
- `WorkflowStatus` → keep for creation endpoints, map to CanonicalWorkflowState
- Deprecate direct use in new code

### Decision 2: Remove CreationMode; Use Single Workflow

**Problem:** CreationMode.MIX_AND_MATCH and I2_ONLY bypass canonical workflow.

**Decision:** Remove CreationMode enum. All candidate workflows follow the same canonical lifecycle. The selected block family and version determine behavior, not a mode enum.

**Rationale:** Audit identified this as allowing unauthorized workflow circumvention. A mode should not change the engineering pipeline; it should change the *content* of the compliance brief.

**File to modify:** `services/project-ai/app/models/creation.py`
- Remove `CreationMode` enum
- Add `DesignSource` enum: REPOSITORY_CANONICAL, EXTERNAL_AI_PROTOTYPE, USER_SPECIFICATION
- Replace `mode: CreationMode` fields with `designSource: DesignSource`

**File to modify:** `services/project-ai/app/api/routes/creation.py`
- Remove line 98 check for `CreationMode.I2_ONLY`
- Replace with canonical workflow state transitions

### Decision 3: Evidence Directory Structure

**Problem:** No canonical evidence directory for Project LLM workflow runs.

**Decision:** Establish `.agents/evidence/` as the machine-readable evidence ledger for all M2.9+ workflow runs.

**Structure:**
```
.agents/evidence/
├── runs/
│   ├── run-{YYYYMMDD-HHMMSS}-{workflow-id}/
│   │   ├── manifest.json          # Run metadata
│   │   ├── discovery.json         # Repository snapshot reference
│   │   ├── gates/
│   │   │   ├── gate-1-approval.json
│   │   │   ├── ubrc-verification.json
│   │   │   ├── brand-independence.json
│   │   │   ├── theme-compatibility.json
│   │   │   └── ... (one file per gate)
│   │   ├── candidate/
│   │   │   ├── package-manifest.json
│   │   │   └── hashes.json
│   │   └── verdict.json           # Final certification verdict
│   └── ...
└── README.md
```

**Rationale:** Machine-readable JSON allows automation and audit. One run = one directory = complete audit trail.

### Decision 4: Engineering Contract Model

**Problem:** No explicit EngineeringContract model for External AI handoff.

**Decision:** Create `EngineeringContract` model that includes:
- Selected block family and version
- Repository evidence (canonical blocks, schemas, composer wiring)
- Compliance requirements (UBRC, brand, theme, ILS, LSNB, RSSB)
- File structure template
- Test requirements
- External AI prompt text

**File to create:** `services/project-ai/app/models/engineering_contract.py`

**API endpoint:** `POST /api/project-ai/contract/generate`
- Input: block family, target version, repository snapshot ID
- Output: EngineeringContract JSON + downloadable Markdown prompt

### Decision 5: Target Binding Model

**Problem:** No explicit WorkflowTarget or CandidateBinding model.

**Decision:** Create models to bind candidate to user-selected family/version:

```python
class WorkflowTarget(BaseModel):
    blockFamily: str  # e.g., "Introduction"
    targetVersion: str  # e.g., "I7"
    repositorySnapshotId: str
    existingVersions: list[str]
    canonicalReferences: list[str]  # Evidence IDs for canonical blocks

class CandidateBinding(BaseModel):
    candidateId: str
    target: WorkflowTarget
    packageHash: str
    uploadedAt: str
    uploadedBy: str
```

**File to create:** `services/project-ai/app/models/workflow_target.py`

**Rationale:** Binds every candidate to its intended place in the repository taxonomy. Prevents version mismatch like "I7" vs "1.0.0".

## Wave-by-Wave Implementation Plan

### WAVE 0 — Architecture Authority (Sequential)

#### B01 — Architecture Authority Agent

**Responsibility:** Freeze canonical workflow lifecycle, establish single authority, remove competing enums.

**Implementation Steps:**

1. **Create CanonicalWorkflowState enum**
   - File: `services/project-ai/app/models/canonical_workflow_state.py`
   - Content: 17 states as defined in Decision 1
   - Include docstrings for each state explaining its purpose and gate requirements

2. **Create state mapping utilities**
   - File: `services/project-ai/app/orchestration/state_mapper.py`
   - Functions:
     - `task_state_to_canonical(TaskState) -> CanonicalWorkflowState`
     - `workflow_status_to_canonical(WorkflowStatus) -> CanonicalWorkflowState`
     - `canonical_to_task_state(CanonicalWorkflowState) -> TaskState` (best-effort)

3. **Update WorkflowEngine to use CanonicalWorkflowState**
   - File: `services/project-ai/app/orchestration/workflow_engine.py`
   - Replace `from_state: TaskState` with `from_state: CanonicalWorkflowState`
   - Replace `to_state: TaskState` with `to_state: CanonicalWorkflowState`
   - Update `_define_workflow_steps()` to match canonical lifecycle
   - Add deprecation warnings when TaskState is used directly

4. **Create architecture freeze report**
   - File: `.agents/tasks/m2-9-wave0-architecture-freeze.json`
   - Content:
```json
{
  "waveId": "W0-B01",
  "title": "Architecture Authority - Workflow State Freeze",
  "completedAt": "ISO-8601 timestamp",
  "changes": [
    "Created CanonicalWorkflowState enum with 17 states",
    "Created state mapper utilities",
    "Updated WorkflowEngine to use CanonicalWorkflowState",
    "Deprecated direct TaskState usage in orchestration"
  ],
  "competingAuthoritiesResolved": [
    "TaskState -> alias to CanonicalWorkflowState",
    "WorkflowStatus -> alias to CanonicalWorkflowState"
  ],
  "testsModified": [],
  "testsAdded": ["test_canonical_workflow_state.py", "test_state_mapper.py"]
}
```

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/orchestration/test_workflow_engine.py -v
python -m pytest tests/test_canonical_workflow_state.py -v
```

**Expected:** New tests pass; existing workflow engine tests pass with mapper; no regressions.

**Commit Message:**
```
feat(project-ai): establish CanonicalWorkflowState as single workflow authority [M2.9 W0]

- Create CanonicalWorkflowState enum with 17 lifecycle states
- Add state_mapper.py for TaskState/WorkflowStatus compatibility
- Update WorkflowEngine to use canonical states
- Document competing authorities resolution in wave0 report

Resolves: M2.9 Architecture Authority requirement
Wave: W0-B01
```

---

### WAVE 1 — Foundation Layer (Parallel: B03, B04, B13, B14)

**Dependencies:** WAVE 0 complete (CanonicalWorkflowState exists)

#### B03 — Repository Contract Intelligence Agent

**Responsibility:** Derive repository contract from TypeScript snapshot (canonical blocks, schemas, composer wiring).

**Implementation Steps:**

1. **Create RepositoryContract model**
   - File: `services/project-ai/app/models/repository_contract.py`
   - Fields:
     - `contractId: str`
     - `snapshotId: str`
     - `canonicalBlocks: list[CanonicalBlockReference]`
     - `composerSchema: dict`
     - `rendererWiring: dict`
     - `runtimeContracts: dict`  # ILS, LSNB, RSSB
     - `generatedAt: str`

2. **Create CanonicalBlockReference model** (in same file)
   - Fields:
     - `blockFamily: str`
     - `version: str`
     - `implementationPath: str`
     - `evidenceId: str`
     - `ubrcCompliant: bool`
     - `brandIndependent: bool`
     - `themeCompatible: bool`

3. **Create repository contract extractor**
   - File: `services/project-ai/app/contracts/repository_contract_extractor.py`
   - Function: `extract_contract(snapshot: dict) -> RepositoryContract`
   - Logic:
     - Read `snapshot['blocks']['implementations']`
     - Read `snapshot['composer']`
     - Read `snapshot['evidence']` and filter for canonical blocks
     - Never open files; only consume snapshot JSON

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/contracts/test_repository_contract.py -v
```

**Expected:** Contract extractor produces valid RepositoryContract from test snapshot fixture.

**Commit Message:**
```
feat(project-ai): add RepositoryContract intelligence from snapshot [M2.9 W1-B03]

- Create RepositoryContract and CanonicalBlockReference models
- Implement repository_contract_extractor.py
- Extract canonical blocks, composer, renderer from snapshot only
- Never scan repository files (M2 architectural rule)

Wave: W1-B03
```

---

#### B04 — Target Binding Agent

**Responsibility:** Create WorkflowTarget and CandidateBinding models.

**Implementation Steps:**

1. **Create WorkflowTarget and CandidateBinding models**
   - File: `services/project-ai/app/models/workflow_target.py`
   - Content as defined in Decision 5

2. **Add target binding to workflow initialization**
   - File: `services/project-ai/app/orchestration/workflow_engine.py`
   - Update `execute_step()` for "discovery" step to create WorkflowTarget
   - Store in `task_context['workflow_target']`

3. **Update CandidatePackage to include binding**
   - File: `services/project-ai/app/models/candidate.py`
   - Add optional field: `binding: Optional[CandidateBinding]`

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/models/test_workflow_target.py -v
python -m pytest tests/orchestration/test_workflow_engine.py::test_discovery_creates_target -v
```

**Expected:** WorkflowTarget created during discovery step; CandidateBinding attaches to uploaded candidate.

**Commit Message:**
```
feat(project-ai): add WorkflowTarget and CandidateBinding models [M2.9 W1-B04]

- Create WorkflowTarget with blockFamily, targetVersion, snapshotId
- Create CandidateBinding to link candidate to workflow target
- Update discovery step to generate WorkflowTarget
- Prevent version mismatch (I7 vs 1.0.0 issue)

Wave: W1-B04
```

---

#### B13 — Legacy Cleanup Agent

**Responsibility:** Remove CreationMode enum; reclassify Mix & Match workflow.

**Implementation Steps:**

1. **Add DesignSource enum**
   - File: `services/project-ai/app/models/creation.py`
   - Content:
```python
class DesignSource(str, Enum):
    REPOSITORY_CANONICAL = "REPOSITORY_CANONICAL"  # Copy existing I1-I6
    EXTERNAL_AI_PROTOTYPE = "EXTERNAL_AI_PROTOTYPE"  # User + External AI created
    USER_SPECIFICATION = "USER_SPECIFICATION"  # User requirements only
```

2. **Remove CreationMode enum**
   - File: `services/project-ai/app/models/creation.py`
   - Delete `CreationMode` class
   - Replace `mode: CreationMode` with `designSource: DesignSource` in `CompositionSpec`

3. **Remove CreationMode usage in routes**
   - File: `services/project-ai/app/api/routes/creation.py`
   - Remove line 98: `if mode == CreationMode.I2_ONLY:`
   - Replace with canonical workflow state check

4. **Update tests**
   - File: `services/project-ai/tests/test_creation.py`
   - Replace CreationMode references with DesignSource
   - Ensure all 3 design sources follow same workflow

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/test_creation.py -v
python -m pytest tests/api/test_creation_routes.py -v
```

**Expected:** No CreationMode references remain; DesignSource used instead; all tests pass.

**Commit Message:**
```
refactor(project-ai): remove CreationMode, add DesignSource [M2.9 W1-B13]

- Remove CreationMode enum (I2_ONLY, MIX_AND_MATCH, NEW_CANDIDATE)
- Add DesignSource enum (REPOSITORY_CANONICAL, EXTERNAL_AI_PROTOTYPE, USER_SPECIFICATION)
- All workflows follow canonical lifecycle regardless of design source
- Remove mode-based workflow bypass (audit finding)

Wave: W1-B13
```

---

#### B14 — Test/Evidence Harness Agent

**Responsibility:** Create machine-readable evidence directory structure and helper module.

**Implementation Steps:**

1. **Create evidence directory structure**
   - Directory: `.agents/evidence/runs/`
   - File: `.agents/evidence/README.md`
   - Content: Explain directory structure, JSON schemas, run ID format

2. **Create evidence logger module**
   - File: `services/project-ai/app/evidence/run_logger.py`
   - Functions:
     - `create_run(workflow_id: str, snapshot_id: str) -> str` (returns run_id)
     - `log_gate_result(run_id: str, gate_name: str, result: dict)`
     - `log_discovery(run_id: str, discovery: dict)`
     - `log_candidate(run_id: str, candidate: dict)`
     - `log_verdict(run_id: str, verdict: dict)`
     - `get_run_dir(run_id: str) -> Path`

3. **Integrate with existing evidence logger**
   - File: `services/project-ai/app/evidence/logger.py` (exists)
   - Extend to call run_logger for workflow runs

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/evidence/test_run_logger.py -v
ls ../.agents/evidence/runs/
```

**Expected:** Run directories created; gate results logged as JSON; manifest/discovery/verdict written.

**Commit Message:**
```
feat(project-ai): add machine-readable evidence harness [M2.9 W1-B14]

- Create .agents/evidence/runs/ directory structure
- Implement run_logger.py for workflow evidence
- Log discovery, gates, candidate, verdict as JSON
- Enable audit trail for every workflow run

Wave: W1-B14
```

---

### WAVE 2 — Engineering Contract (Sequential: B02)

**Dependencies:** WAVE 1 complete (B03 RepositoryContract, B04 WorkflowTarget exist)

#### B02 — Engineering Contract Agent

**Responsibility:** Generate EngineeringContract for External AI, backed by repository evidence.

**Implementation Steps:**

1. **Create EngineeringContract model**
   - File: `services/project-ai/app/models/engineering_contract.py`
   - Fields:
     - `contractId: str`
     - `workflowTarget: WorkflowTarget`
     - `repositoryContract: RepositoryContract`
     - `complianceRequirements: list[ComplianceRequirement]`
     - `fileStructureTemplate: dict`
     - `testRequirements: list[str]`
     - `externalAiPrompt: str`
     - `generatedAt: str`

2. **Create ComplianceRequirement model** (in same file)
   - Fields:
     - `requirementId: str`
     - `category: str`  # UBRC, Brand, Theme, ILS, LSNB, RSSB, Composer
     - `description: str`
     - `evidenceIds: list[str]`
     - `mandatory: bool`

3. **Create contract generator**
   - File: `services/project-ai/app/contracts/contract_generator.py`
   - Function: `generate_contract(target: WorkflowTarget, repo_contract: RepositoryContract) -> EngineeringContract`
   - Logic:
     - Build compliance requirements from snapshot evidence
     - Generate External AI prompt with:
       - Target block family/version
       - Canonical block examples (from repo_contract)
       - UBRC/brand/theme rules
       - ILS/LSNB/RSSB runtime contracts
       - File structure (TSX, schema, renderer, tests, docs)
       - Test requirements

4. **Create API endpoint**
   - File: `services/project-ai/app/api/routes/contract.py` (new)
   - Endpoint: `POST /api/project-ai/contract/generate`
   - Input: `{ "blockFamily": "Introduction", "targetVersion": "I7", "snapshotId": "..." }`
   - Output: EngineeringContract JSON
   - Also endpoint: `GET /api/project-ai/contract/{contractId}/download` (Markdown)

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/contracts/test_contract_generator.py -v
python -m pytest tests/api/test_contract_routes.py -v
```

**Expected:** Contract generated with real evidence IDs; prompt includes canonical examples; Markdown download works.

**Commit Message:**
```
feat(project-ai): implement EngineeringContract generator [M2.9 W2-B02]

- Create EngineeringContract and ComplianceRequirement models
- Implement contract_generator.py using RepositoryContract
- Add POST /contract/generate and GET /contract/{id}/download endpoints
- Generate evidence-backed External AI prompt
- Address audit finding: replace static compliance brief

Depends: W1-B03, W1-B04
Wave: W2-B02
```

---

### WAVE 3 — Candidate Pipeline (Parallel: B05, B06, B07)

**Dependencies:** WAVE 2 complete (EngineeringContract exists)

#### B05 — Candidate Intake Enhancement

**Responsibility:** Accept real file uploads, compute server-side hashes, enforce target binding.

**Implementation Steps:**

1. **Update candidate upload endpoint**
   - File: `services/project-ai/app/api/routes/candidate.py`
   - Change `POST /candidate/upload` from JSON to multipart/form-data
   - Accept files: ZIP archive OR individual files
   - Compute SHA-256 hashes server-side (never trust uploaded hash)
   - Validate file extensions: .tsx, .ts, .json, .css, .md only
   - Reject path traversal, symlinks, executables

2. **Update CandidatePackage handling**
   - Extract files from archive
   - Build `CandidateFile` list with server-computed hashes
   - Attach `CandidateBinding` using workflow_target from context

3. **Integrate with intake agent**
   - File: `services/project-ai/app/agents/intake.py` (already real implementation)
   - No major changes; ensure it receives CandidatePackage with binding

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/api/test_candidate_upload.py -v
# Manual test: upload ZIP through Postman/curl
```

**Expected:** Real file upload works; hashes computed server-side; candidate bound to target.

**Commit Message:**
```
feat(project-ai): implement real candidate file upload [M2.9 W3-B05]

- Change /candidate/upload to multipart/form-data
- Accept ZIP archive or individual files
- Compute SHA-256 hashes server-side (never trust client)
- Validate file extensions and reject unsafe paths
- Attach CandidateBinding on upload
- Address audit finding: no real file upload

Wave: W3-B05
```

---

#### B06 — Canonical Comparison Enhancement

**Responsibility:** Enhance canonical comparison to use RepositoryContract.

**Implementation Steps:**

1. **Update canonical comparison**
   - File: `services/project-ai/app/agents/canonical_comparison.py` (if exists) OR create new handler
   - Use `RepositoryContract.canonicalBlocks` for comparison
   - Compare candidate against target family's existing versions
   - Generate similarity scores based on:
     - Structural similarity (props, schema)
     - Evidence similarity (same evidence IDs)
     - Version proximity (I6 vs I7 more similar than I1 vs I7)

2. **Integrate with placement agent**
   - File: `services/project-ai/app/agents/placement.py` (already real implementation)
   - Update `_determine_placement_decision()` to use RepositoryContract
   - Use canonical comparison results

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/agents/test_canonical_comparison.py -v
python -m pytest tests/agents/test_placement.py -v
```

**Expected:** Comparison uses repository evidence; placement decisions based on real canonical blocks.

**Commit Message:**
```
feat(project-ai): enhance canonical comparison with RepositoryContract [M2.9 W3-B06]

- Update canonical_comparison to use RepositoryContract
- Compare candidate against target family canonical blocks
- Generate evidence-backed similarity scores
- Improve placement decision quality

Depends: W1-B03
Wave: W3-B06
```

---

#### B07 — Placement Manifest Enhancement

**Responsibility:** Use correct version (I7 not 1.0.0), enforce REQUIRES_HUMAN_APPROVAL paths.

**Implementation Steps:**

1. **Update PlacementManifest generation**
   - File: `services/project-ai/app/agents/placement.py`
   - Line ~90: Change `blockVersion="1.0.0"` to `blockVersion=target.targetVersion`
   - Use `WorkflowTarget` to get correct version like "I7"

2. **Enforce path approval requirement**
   - Update `_determine_target_path()` to ALWAYS return "REQUIRES_HUMAN_APPROVAL" unless explicit path provided
   - Never infer path from block name or candidateId (audit finding from Finding #7)

3. **Add manifest validation**
   - Reject manifests with version mismatch
   - Reject manifests with inferred paths

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/agents/test_placement.py::test_version_from_target -v
python -m pytest tests/agents/test_placement.py::test_requires_path_approval -v
```

**Expected:** Manifest uses "I7" not "1.0.0"; paths require human approval unless explicit.

**Commit Message:**
```
fix(project-ai): use correct version in PlacementManifest [M2.9 W3-B07]

- Use WorkflowTarget.targetVersion (e.g., "I7") in manifest
- Never infer path from candidateId or block name
- Enforce REQUIRES_HUMAN_APPROVAL for all paths unless explicit
- Address audit finding: version mismatch I7 vs 1.0.0

Depends: W1-B04
Wave: W3-B07
```

---

### WAVE 4 — Human Gate (Sequential)

**Dependencies:** WAVE 3 complete (PlacementManifest exists)

#### Human Implementation Approval Gate

**Responsibility:** Enforce AWAITING_IMPLEMENTATION_APPROVAL state; create approval API.

**Implementation Steps:**

1. **Create approval models**
   - File: `services/project-ai/app/models/approval.py` (or extend governance.py)
   - Models:
     - `ImplementationApproval`
       - `approvalId: str`
       - `manifestId: str`
       - `manifestHash: str`
       - `candidateId: str`
       - `approvedBy: str`
       - `approvedAt: str`
       - `decision: ApprovalDecision`  # APPROVED, REJECTED, CHANGES_REQUESTED
       - `comments: str`

2. **Create approval endpoint**
   - File: `services/project-ai/app/api/routes/approval.py` (new) OR extend governance.py
   - Endpoint: `POST /api/project-ai/approval/implementation`
   - Input: `{ "manifestId": "...", "manifestHash": "...", "decision": "APPROVED", "approvedBy": "HAA", "comments": "..." }`
   - Validation:
     - Verify manifest exists
     - Verify manifestHash matches
     - Reject self-approval (if approvedBy == workflow creator)
     - Store approval durably

3. **Integrate with workflow engine**
   - File: `services/project-ai/app/orchestration/workflow_engine.py`
   - Add state transition: `INTEGRATION_PLANNED -> AWAITING_IMPLEMENTATION_APPROVAL`
   - Block transition to `IMPLEMENTING` until approval exists

4. **Connect approval to placement executor**
   - File: `services/project-ai/app/placement/executor.py`
   - Check approval before executing placement
   - Raise error if no approval found

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/api/test_approval_routes.py -v
python -m pytest tests/orchestration/test_workflow_engine.py::test_approval_gate -v
python -m pytest tests/placement/test_executor.py::test_requires_approval -v
```

**Expected:** Workflow blocks at AWAITING_IMPLEMENTATION_APPROVAL; executor checks approval; self-approval rejected.

**Commit Message:**
```
feat(project-ai): enforce implementation approval gate [M2.9 W4]

- Create ImplementationApproval model and API endpoint
- Add AWAITING_IMPLEMENTATION_APPROVAL state transition
- Block placement executor until approval exists
- Reject self-approval
- Address audit finding: governance approval not connected to execution

Wave: W4
```

---

### WAVE 5 — Placement Executor (Sequential)

**Dependencies:** WAVE 4 complete (approval enforced)

#### Placement Executor Enhancement

**Responsibility:** Safe file writing with isolated worktree, path allowlist, dry-run.

**Implementation Steps:**

1. **Create RepositoryAdapter interface**
   - File: `services/project-ai/app/placement/repository_adapter.py`
   - Methods:
     - `create_worktree(branch_name: str) -> Path`
     - `write_file(worktree: Path, relative_path: str, content: str)`
     - `git_add(worktree: Path, paths: list[str])`
     - `git_commit(worktree: Path, message: str) -> str`
     - `get_diff(worktree: Path) -> str`
     - `remove_worktree(worktree: Path)`

2. **Create path allowlist**
   - File: `services/project-ai/app/placement/path_policy.py`
   - Allowed prefixes:
     - `packages/ui/src/tutorial/blocks/`
     - `packages/ui/src/tutorial/schemas/`
     - `packages/ui/src/tutorial/renderers/`
     - `docs/tutorial/blocks/`
   - Reject any path outside allowlist

3. **Update PlacementExecutor**
   - File: `services/project-ai/app/placement/executor.py`
   - Add dry-run mode: generate diff without committing
   - Use RepositoryAdapter instead of direct file writes
   - Create isolated worktree for placement
   - Validate all paths against allowlist
   - Commit in worktree only (never current branch)

4. **Add dry-run API endpoint**
   - File: `services/project-ai/app/api/routes/placement.py` (new) OR extend candidate.py
   - Endpoint: `POST /api/project-ai/placement/dry-run`
   - Returns: diff preview, files to be added/modified

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/placement/test_repository_adapter.py -v
python -m pytest tests/placement/test_path_policy.py -v
python -m pytest tests/placement/test_executor.py::test_dry_run -v
python -m pytest tests/placement/test_executor.py::test_isolated_worktree -v
```

**Expected:** Placement uses isolated worktree; paths validated against allowlist; dry-run shows diff; no direct current-branch mutation.

**Commit Message:**
```
feat(project-ai): safe placement executor with isolated worktree [M2.9 W5]

- Create RepositoryAdapter for safe git operations
- Add path_policy.py with allowlist validation
- Implement dry-run placement (diff preview only)
- Use isolated worktree for all file writes
- Never mutate current branch directly
- Address audit finding: placement executor risky

Wave: W5
```

---

### WAVE 6 — Verification Gates (Parallel)

**Dependencies:** WAVE 5 complete (placement executed)

#### Parallel Verification Agents

**Agents to run in parallel:**
1. Runtime Verification (existing module: `app/verification/runtime.py`)
2. Browser Verification (existing module: `app/verification/browser.py`)
3. Brand Independence (existing module: `app/verification/brand.py`)
4. Theme Compatibility (existing module: `app/verification/theme.py`)

**Implementation Steps:**

1. **Fix existing verification tests**
   - Identify 55 failing tests (mostly certification gate precedence issues)
   - File: `services/project-ai/tests/certification/test_gates.py`
   - Issue: Manifest validation blocks specific gate results
   - Solution: Run specific gates BEFORE manifest validation

2. **Update gate execution order**
   - File: `services/project-ai/app/certification/gates.py`
   - New order:
     1. UBRC verification
     2. Brand independence
     3. Theme compatibility
     4. Composer integration
     5. Runtime verification
     6. Browser verification
     7. Manifest validation (last)
   - Return specific gate failures, not generic "BLOCKED"

3. **Ensure all gates produce evidence**
   - Each gate must return `evidenceIds` list
   - Log gate results to `.agents/evidence/runs/{run-id}/gates/{gate-name}.json`

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/certification/test_gates.py -v
python -m pytest tests/verification/ -v
```

**Expected:** All 55 previously failing tests now pass; specific gate results returned; evidence logged.

**Commit Message:**
```
fix(project-ai): resolve certification gate test failures [M2.9 W6]

- Fix gate execution order (specific gates before manifest validation)
- Return specific gate failures (UBRC, brand, theme, etc.) not generic BLOCKED
- Ensure all gates produce evidence IDs
- Log gate results to evidence directory
- Address audit finding: 55 failing certification tests

Wave: W6
```

---

### WAVE 7 — Final Gate (Sequential)

**Dependencies:** WAVE 6 complete (all verification gates passed)

#### Final Gate Enhancement

**Responsibility:** Distinguish CERTIFICATION_READY from CERTIFIED; require HAA approval.

**Implementation Steps:**

1. **Update final gate logic**
   - File: `services/project-ai/app/agents/final_gate.py` (already real implementation)
   - Current: generates verdict and appends to backlog
   - New behavior:
     - If all gates PASS → set state to `CERTIFICATION_READY`
     - Do NOT set `CERTIFIED` automatically
     - Write verdict to `.agents/evidence/runs/{run-id}/verdict.json`

2. **Create certification approval endpoint**
   - File: `services/project-ai/app/api/routes/certification.py` (new) OR extend governance.py
   - Endpoint: `POST /api/project-ai/certification/approve`
   - Input: `{ "runId": "...", "verdictHash": "...", "decision": "CERTIFIED" | "REJECTED", "approvedBy": "HAA" }`
   - Only accept if current state is `CERTIFICATION_READY`
   - Transition to `CERTIFIED` or `REJECTED`

3. **Update workflow engine**
   - File: `services/project-ai/app/orchestration/workflow_engine.py`
   - Add state: `CERTIFICATION_READY -> AWAITING_GATE_2 -> CERTIFIED`
   - Block final merge until `CERTIFIED` state reached

**Verification:**
```bash
cd services/project-ai
python -m pytest tests/agents/test_final_gate.py::test_certification_ready -v
python -m pytest tests/api/test_certification_routes.py -v
python -m pytest tests/orchestration/test_workflow_engine.py::test_final_certification -v
```

**Expected:** Final gate sets CERTIFICATION_READY; separate HAA approval required for CERTIFIED.

**Commit Message:**
```
feat(project-ai): separate CERTIFICATION_READY from CERTIFIED [M2.9 W7]

- Final gate sets CERTIFICATION_READY, not CERTIFIED
- Create /certification/approve endpoint for HAA decision
- Add AWAITING_GATE_2 state before CERTIFIED
- Require explicit HAA approval for final certification
- Address audit requirement: HAA as final authority

Wave: W7
```

---

## Cross-Cutting Changes

### Frontend-Backend Integration (Post-Wave Implementation)

**Files to modify:**
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/*`
- Create API client: `apps/skillhubcore-admin/src/lib/project-ai-client.ts`

**Changes:**
1. Replace hardcoded state with backend API calls
2. Connect compliance brief page to `/contract/generate` endpoint
3. Connect candidate upload to real multipart endpoint
4. Display real gate results from backend
5. Show workflow state from backend
6. Replace static validation checks with live backend results

**Note:** This is NOT part of the 7-wave backend implementation. Frontend integration should be a separate task/workflow after backend waves complete.

### Persistence (Deferred)

**Current:** In-memory dictionaries for workflows, candidates, approvals

**Recommendation:** Add database persistence AFTER backend test suite passes and schema is stable. Premature persistence adds migration complexity without value.

**Options:**
1. SQLite for simplicity
2. PostgreSQL for production
3. File-based JSON for MVP

**Defer to:** Post-M2.9, when frontend integration complete

---

## Test Strategy

### Unit Tests (per wave)

Each wave must add unit tests for:
- New models (Pydantic validation)
- New functions (pure logic)
- New endpoints (FastAPI TestClient)

### Integration Tests

After WAVE 7:
- End-to-end workflow test: REQUESTED → CERTIFIED
- Test all state transitions
- Test approval gates block correctly
- Test evidence logging

### Regression Tests

- M1 snapshot tests must still pass
- Existing discovery package tests must still pass
- No breaking changes to existing API contracts

### Test Commands

```bash
# Discovery package (TypeScript)
cd packages/project-llm-discovery
pnpm test
pnpm type-check

# Project AI service (Python)
cd services/project-ai
python -m pytest tests -v --tb=short

# Quick check (no verbose output)
python -m pytest tests -q

# Specific wave tests
python -m pytest tests/orchestration/ -v
python -m pytest tests/certification/ -v
python -m pytest tests/agents/ -v
```

---

## Risk Assessment

### High Risks

| Risk | Mitigation |
|------|------------|
| 55 failing tests may cascade | Fix WAVE 6 gate precedence first; run tests after each wave |
| Frontend not connected | Backend-first approach; frontend integration is separate task |
| Placement executor writes files | Isolated worktree, path allowlist, dry-run mode, approval gate |
| Breaking changes to existing APIs | State mapper provides compatibility; deprecation warnings |

### Medium Risks

| Risk | Mitigation |
|------|------------|
| Multiple state enums confuse developers | Clear documentation; deprecation warnings; single canonical authority |
| Evidence directory grows large | One directory per run; cleanup policy for old runs |
| Version mismatch (I7 vs 1.0.0) | WorkflowTarget binds version; validation in manifest |

### Low Risks

| Risk | Mitigation |
|------|------------|
| Encoding artifacts in UI text | Fix in frontend; not blocking backend |
| In-memory state lost on restart | Acceptable for development; add persistence later |

---

## Blockers and Dependencies

### External Dependencies

- None identified; all work is within existing repository

### Internal Dependencies

- WAVE 1 blocks WAVE 2 (RepositoryContract needed for EngineeringContract)
- WAVE 2 blocks WAVE 3 (EngineeringContract needed for candidate intake)
- WAVE 3 blocks WAVE 4 (PlacementManifest needed for approval)
- WAVE 4 blocks WAVE 5 (approval needed for executor)
- WAVE 5 blocks WAVE 6 (placement needed for verification)
- WAVE 6 blocks WAVE 7 (verification gates needed for final gate)

### Parallel Work Opportunities

- WAVE 1: B03, B04, B13, B14 can run in parallel (no conflicts)
- WAVE 3: B05, B06, B07 can run in parallel (different files)
- WAVE 6: All verification agents run in parallel (read-only)

---

## Success Criteria

### WAVE 0 Success

- [ ] CanonicalWorkflowState enum created with 17 states
- [ ] State mapper utilities work
- [ ] WorkflowEngine uses CanonicalWorkflowState
- [ ] Tests pass: `pytest tests/orchestration/test_workflow_engine.py`
- [ ] Commit created with evidence report

### WAVE 1 Success

- [ ] RepositoryContract extracted from snapshot
- [ ] WorkflowTarget and CandidateBinding models exist
- [ ] CreationMode removed, DesignSource added
- [ ] Evidence directory structure created
- [ ] Tests pass: `pytest tests/contracts/ tests/models/`
- [ ] 4 commits created (B03, B04, B13, B14)

### WAVE 2 Success

- [ ] EngineeringContract generated with real evidence
- [ ] API endpoint `/contract/generate` works
- [ ] External AI prompt includes canonical examples
- [ ] Tests pass: `pytest tests/contracts/test_contract_generator.py`
- [ ] 1 commit created (B02)

### WAVE 3 Success

- [ ] Real file upload accepts ZIP and individual files
- [ ] Server-side hashes computed
- [ ] Canonical comparison uses RepositoryContract
- [ ] PlacementManifest uses correct version (I7 not 1.0.0)
- [ ] Tests pass: `pytest tests/api/test_candidate_upload.py tests/agents/test_placement.py`
- [ ] 3 commits created (B05, B06, B07)

### WAVE 4 Success

- [ ] Implementation approval endpoint created
- [ ] Workflow blocks at AWAITING_IMPLEMENTATION_APPROVAL
- [ ] Self-approval rejected
- [ ] Approval connected to placement executor
- [ ] Tests pass: `pytest tests/api/test_approval_routes.py`
- [ ] 1 commit created

### WAVE 5 Success

- [ ] RepositoryAdapter with isolated worktree
- [ ] Path allowlist enforced
- [ ] Dry-run placement works
- [ ] No direct current-branch mutation
- [ ] Tests pass: `pytest tests/placement/`
- [ ] 1 commit created

### WAVE 6 Success

- [ ] All 55 failing certification tests now pass
- [ ] Specific gate results returned (not generic BLOCKED)
- [ ] Evidence logged for all gates
- [ ] Tests pass: `pytest tests/certification/ tests/verification/`
- [ ] 1 commit created

### WAVE 7 Success

- [ ] Final gate sets CERTIFICATION_READY
- [ ] Certification approval endpoint created
- [ ] CERTIFIED state requires HAA approval
- [ ] Tests pass: `pytest tests/agents/test_final_gate.py`
- [ ] 1 commit created

### Overall Success

- [ ] Python test suite passes: 0 failed, 324+ passed
- [ ] TypeScript discovery package tests still pass
- [ ] All 7 waves committed to `m2-project-ai-canonical-wiring` branch
- [ ] Evidence directory contains complete audit trail
- [ ] No CreationMode references remain
- [ ] Single CanonicalWorkflowState authority established
- [ ] Ready for frontend integration (separate task)

---

## Rollback Plan

### If WAVE N fails

1. Revert commit for WAVE N
2. Fix issues in separate feature branch
3. Re-run tests
4. Cherry-pick fixed commit back to main branch

### If tests never stabilize

1. Document root cause
2. Escalate to HAA
3. Consider architecture review
4. May need to redesign gate execution order

### If incompatible with M1 baseline

1. Verify M1 snapshot tests still pass
2. Check M2 spec compliance
3. Review state mapper compatibility
4. May need parallel M1/M2 support period

---

## Next Steps After Plan Approval

1. Create branch: `git checkout -b m2-project-ai-canonical-wiring project-ai-gui`
2. Execute WAVE 0 (B01 Architecture Authority)
3. Run tests, commit, create evidence report
4. Execute WAVE 1 in parallel (B03, B04, B13, B14)
5. Continue through WAVE 7
6. Create PR with all wave commits
7. Request HAA review
8. After merge, begin frontend integration (separate workflow)

---

## Evidence and Audit Trail

All implementation work will be tracked in:
- Git commits (one per wave, descriptive messages)
- `.agents/evidence/runs/` (machine-readable JSON)
- `.agents/tasks/m2-9-*.json` (wave reports)
- `.agents/tasks/m1-m2-backlog.md` (append completion summary)

Each wave commit message includes:
- Wave ID (W0-B01, W1-B03, etc.)
- What was changed
- Which audit finding it addresses
- Dependencies on prior waves

This plan is now ready for implementation by the wave coder agents.
