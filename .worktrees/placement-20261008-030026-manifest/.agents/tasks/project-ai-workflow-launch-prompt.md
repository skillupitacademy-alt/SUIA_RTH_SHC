# PROJECT AI WORKFLOW AGENT — LAUNCH PROMPT
## Complete Project LLM Implementation from Current Repository State

**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Branch:** `m2-project-ai-foundation`  
**Current HEAD:** `7c6b607f` (2026-01-XX M3 Foundation)  
**Target:** Project LLM Certification-Ready State

---

## 0. CRITICAL EXECUTION RULES

You are **Project AI Workflow Orchestrator**. Your responsibility is to complete the remaining Project LLM implementation using controlled workflow agents that extend existing canonical artifacts.

### Fundamental Constraints

1. **DO NOT redesign the architecture.** Implement the approved architecture documented in `.agents/specs/m2-implementation-specification.md` and related canonical documents.

2. **DO NOT recreate existing implementations.** The repository already contains:
   - `services/project-ai/` with FastAPI foundation
   - Candidate Intake API
   - Governance API with manifest hash verification
   - Agent Registry with 15 agents defined
   - Creation Workflow API (I2/Mix-and-Match models)
   - Six certification gate definitions
   - M2 deterministic foundation (TS/Node)
   - Evidence system
   - UBRC verification
   - Snapshot/discovery infrastructure

3. **DO extend and complete existing implementations.** Your task is to transform the current M3 foundation into production-ready certification capability.

4. **DO NOT invent repository facts.** Every claim about the codebase must be verified from actual repository inspection or evidence.

5. **DO NOT declare CERTIFIED.** You may prepare `CERTIFICATION_READY`. Only human authority certifies.

6. **DO use the canonical-artifact policy.** Before creating any file:
   - Search repository
   - Search snapshot
   - Search evidence
   - Find existing canonical artifact
   - Extend/update it when possible
   - Create new artifact only when genuinely necessary
   - Never create duplicate plans, specifications, registries, tests, or documentation

7. **DO stop when human approval is required.** The workflow explicitly requires human gates at:
   - M2 completion review
   - Architecture changes to universal infrastructure
   - Security boundary changes
   - Final certification

---

## 1. CURRENT REPOSITORY STATE (Verified from GitHub HEAD 7c6b607f)

### ✅ Complete

- M1 deterministic repository discovery
- M2.1 evidence lifecycle
- M2.2 strict evidence binding
- M2 security (`shell: false`)
- M2 UBRC (13/13 block types)
- M2 documentation hygiene
- Python artifact hygiene
- FastAPI service foundation at `services/project-ai/`
- Candidate Intake API (`/candidate/intake`, `/candidate/compare`)
- Governance API (`/governance/approve`)
- Manifest hash verification (SHA-256)
- 15-agent registry (Gate Controller → Documentation)
- I2_ONLY workflow model
- MIX_AND_MATCH workflow model
- Six certification gate definitions (CONTRACT, ILS, LSNB, RSSB, UBRC, BRAND_INDEPENDENCE)
- TypeScript/Node deterministic layer (221 tests passing)
- Python test suite foundation (69 tests passing, 4 skipped)

### ⚠️ Foundation Implemented, Production Logic Incomplete

- **Certification gates:** Defined but not executing real verification
  - Current: `for gate in gates: gate.status = PASS`
  - Required: Real deterministic checks per gate type
  
- **Candidate comparison:** HTML classification exists, but not evidence-backed canonical placement
  - Current: Hard-coded similarity scores
  - Required: Repository snapshot → canonical artifact → exact placement decision

- **Evidence binding:** Evidence ID fields exist, but not linked to authoritative TS evidence system
  - Current: `f"candidate-{id}-classification"`
  - Required: Real evidence IDs from deterministic discovery

- **Agent implementations:** 15 agents registered, capabilities declared, but not implemented
  - Current: Registry entries with capability strings
  - Required: Functioning implementations for each capability

- **Multi-agent orchestration:** Workflow engine exists, but not coordinating specialized agents
  - Current: Generic workflow state machine
  - Required: DAG execution with specialized agent delegation

### 🔴 Not Yet Implemented

- M2.3 real toolchain execution (approved operations registry incomplete)
- M2.4 deep Composer/API/schema discovery (beyond M2 foundation)
- M2.5 complete dependency graph with evidence
- M2.6 UBRC verification wired into certification
- M2.7 runtime/browser verification (Playwright integration)
- M2 final deterministic certification gate
- Candidate Placement executor (approved manifest → repository mutation)
- External AI handoff contract generation
- ILS/LSNB/RSSB certification checks
- Registry/Renderer certification checks
- Tutorial Composer certification workflow
- Runtime verification workflow
- Browser/Playwright verification workflow
- Brand Independence verification execution
- Theme Compatibility verification execution
- Production Candidate Block certification end-to-end
- I2 certification workflow (beyond API foundation)
- I2 Mix-and-Match compatibility validation
- Project AI UI in SkillHubCore Admin

---

## 2. ARCHITECTURAL FOUNDATION (Canonical Source of Truth)

### Hierarchy

```text
HUMAN (authority/approval)
    │
    ▼
PROJECT AI (orchestrator/verification/certification-readiness)
    │
    ├── TypeScript/Node Deterministic Layer
    │   ├── Repository discovery
    │   ├── Evidence generation
    │   ├── Snapshot
    │   └── Validators
    │
    └── Python/FastAPI AI Control Plane
        ├── Workflow orchestration
        ├── Agent coordination
        ├── Governance enforcement
        ├── Certification readiness
        └── Evidence reconciliation
```

### Boundaries

**TypeScript/Node OWNS:**
- Filesystem discovery
- AST analysis (ts-morph)
- Package analysis
- Dependency parsing
- Git operations
- Evidence hashing
- Deterministic snapshots
- Validators
- Serialization

**Python/FastAPI OWNS:**
- Workflow orchestration
- Agent coordination
- Planning
- Task state
- Approvals
- AI/LLM reasoning
- Semantic reconciliation
- Evidence queries
- Multi-agent coordination
- Governance
- Certification readiness

**MUST NOT:**
- Replace existing Next.js/React platform with Python
- Replace existing Hono APIs with FastAPI
- Allow TypeScript to own AI reasoning
- Allow Python to own deterministic discovery
- Modify Composer authority
- Modify authentication/authorization
- Modify database architecture
- Modify deployment architecture
- ...without explicit human approval

---

## 3. IMPLEMENTATION WAVES

Execute in this exact order. Each wave must complete and be verified before the next begins.

### WAVE 0: Repository Baseline Verification

**PA-00: Orchestrator Initialization**
- Read current branch/commit
- Verify working tree clean
- Load canonical architecture documents
- Build capability inventory from existing code
- Generate `REPOSITORY_BASELINE.json`

**PA-01: Architecture Guardian Initialization**
- Load approved architecture
- Load ADRs
- Load Runtime Integration Status
- Load canonical policies
- Build architecture compliance ruleset

**PA-02: Current State Audit**
- Verify M1/M2.1/M2.2 status
- Verify existing FastAPI implementation
- Verify existing agent registry
- Verify existing workflow APIs
- Document gaps between foundation and production
- Output: `CURRENT_STATE_AUDIT.json`

**Success Criteria:**
- Audit report generated
- No working tree conflicts
- All existing tests still passing
- Baseline evidence collected

---

### WAVE 1: M2.3 Toolchain Completion

**PA-03: Toolchain Agent**

**Objective:** Complete real toolchain execution capability.

**Extend (do not replace):**
- `packages/project-llm-discovery/src/contracts/repository-adapter.ts`
- `packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.ts`

**Implement:**
- Approved operation registry (node, pnpm, tsc, vitest, playwright versions)
- `executeApprovedOperation()` with timeout/security
- Evidence generation for each execution
- Integration with existing D2 runtime scanner

**Security Rule:** NEVER allow:
```typescript
exec(userProvidedCommand)
shell: true
LLM → arbitrary executable
```

**Tests Required:**
- Approved command execution
- Stdout/stderr capture
- Exit code capture
- Timeout handling
- Rejected arbitrary commands
- Evidence generation

**Output:**
- `M2.3_TOOLCHAIN_EVIDENCE.json`
- Updated tests passing
- No regression in existing M2 tests

---

### WAVE 2: M2.4/M2.5 Discovery Depth (Parallel where safe)

**PA-04: Composer/API/Schema Agent**

**Extend:**
- `packages/project-llm-discovery/src/scanners/d4-composer-scanner.ts`

**Implement:**
- Real HTTP method detection (AST-based)
- Real Drizzle table discovery
- Real Zod schema discovery
- Real Composer block usage discovery
- `DiscoveryStatus` enum (KNOWN/UNKNOWN/UNABLE_TO_DETERMINE)
- Replace shallow placeholders with evidence-backed results

**Tests:**
- HTTP methods detected from source
- Tables detected from Drizzle
- Schemas detected from Zod
- Block usage detected from components
- UNKNOWN handled correctly (not fabricated as empty array)

**PA-05: Dependency Graph Agent**

**Extend:**
- `packages/project-llm-discovery/src/scanners/d5-dependencies-scanner.ts`

**Implement:**
- Workspace dependency resolution
- Lockfile resolution
- External dependency resolution
- `DependencyEdge` with evidence IDs
- Directed graph generation

**Tests:**
- Workspace dependencies resolved
- Lockfile versions resolved
- Edges generated with evidence
- Circular dependencies detected

**Coordination:** PA-04 and PA-05 may run in parallel if they do not modify the same files.

---

### WAVE 3: M2.6 UBRC Integration

**PA-06: UBRC Agent**

**Objective:** Wire existing UBRC verification into certification pipeline.

**Context:** Repository already has 13/13 UBRC implementations. Task is integration, not reimplementation.

**Extend:**
- `packages/project-llm-discovery/src/verification/ubrc.ts`
- `services/project-ai/app/certification/gates.py`

**Implement:**
- Python adapter calling TS UBRC verification
- `verifyUBRC()` integration into certification gate
- Evidence collection from UBRC results
- Test suite for UBRC gate execution

**Critical:** Do NOT modify UBRC definitions to make candidates pass. If a block fails UBRC, STOP and report the violation.

**Tests:**
- UBRC verification called during certification
- Valid blocks pass
- Invalid blocks fail with specific UBRC status
- Evidence IDs captured

---

### WAVE 4: Evidence Reconciliation

**PA-08: Evidence Reconciliation Agent**

**Objective:** Reconcile M2.3-M2.6 evidence into coherent graph.

**Extend:**
- `services/project-ai/app/evidence/graph.py`
- `services/project-ai/app/evidence/query.py`

**Implement:**
- Evidence graph builder from TS discovery results
- Missing evidence detection
- Orphan evidence detection
- Duplicate evidence detection
- Evidence binding validation
- `M2_EVIDENCE_RECONCILIATION.json`

**Tests:**
- Evidence graph generated from snapshot
- Missing evidence detected
- Duplicate evidence detected
- Evidence IDs resolve to actual TS evidence records

---

### WAVE 5: M2.7 Runtime/Browser Verification

**PA-07: Runtime/Browser Agent**

**Objective:** Implement Playwright-based runtime verification.

**Create (this is new):**
- `services/project-ai/app/verification/runtime.py`
- `services/project-ai/app/verification/browser.py`
- Integration with Playwright

**Implement:**
- Application startup verification
- Health check
- Route navigation
- Block location (data-block-type, data-block-version)
- DOM inspection
- Console error capture
- Network error capture
- Screenshot capture
- Runtime evidence generation

**Tests:**
- Application starts
- Route navigates
- Block found
- Attributes verified
- Console errors captured
- Evidence generated

**Important:** Use real SkillHubCore application, not fake verification page.

---

### WAVE 6: M2 Final Deterministic Certification

**PA-09: M2 Deterministic Certification Agent**

**Objective:** Determine if M2 is complete and certification-ready.

**Verify:**
- M2.3 PASS
- M2.4 PASS
- M2.5 PASS
- M2.6 PASS
- M2.7 PASS
- All M2 tests passing
- Evidence complete
- Validators passing

**Output:**
```json
{
  "status": "M2_READY_FOR_HUMAN_REVIEW" | "M2_BLOCKED" | "M2_REQUIRES_CORRECTION",
  "gates": { ... },
  "evidence": [ ... ],
  "blockers": [ ... ]
}
```

**MUST NOT output:** `"CERTIFIED"`

---

### HUMAN GATE 1: M2 Architectural/Engineering Approval

**STOP HERE.**

Wait for human decision:
- APPROVE → proceed to M2.8
- APPROVE WITH CONDITIONS → implement conditions
- CORRECT → return to failed wave
- REJECT → report failure
- STOP → halt

---

### WAVE 7: Multi-Agent Framework Completion

**PA-11: Multi-Agent Framework Agent**

**Objective:** Transform agent registry into functioning orchestration system.

**Extend:**
- `services/project-ai/app/orchestration/workflow_engine.py`
- `services/project-ai/app/orchestration/agent_registry.py`

**Implement:**
- Agent capability execution (not just declaration)
- DAG-based agent coordination
- Parallel execution where safe
- Sequential execution where required
- Agent result collection
- Failure handling
- Retry policy
- State persistence

**Tests:**
- Sequential agents execute in order
- Parallel agents execute concurrently
- Failed agent blocks dependent agents
- Results collected
- State persisted

---

### WAVE 8: Governance Hardening

**PA-12: Governance Agent**

**Extend:**
- `services/project-ai/app/api/routes/governance.py`

**Implement:**
- Approval enforcement in workflow execution
- Manifest hash verification before repository mutation
- Rejection handling
- Correction loop
- Escalation
- Rollback capability

**Tests:**
- Approved workflow proceeds
- Rejected workflow blocked
- Tampered manifest rejected (409)
- Correction loop functional

---

### WAVE 9: Candidate Certification Gates (Real Execution)

**PA-16: Candidate Certification Agent**

**Objective:** Replace placeholder gate execution with real deterministic checks.

**Extend:**
- `services/project-ai/app/api/routes/creation.py` (certification endpoint)
- `services/project-ai/app/certification/gates.py`

**Current Problem:**
```python
for gate in workflow["certificationGates"]:
    gate["status"] = CertificationGateStatus.PASS  # ❌ placeholder
```

**Required:**
```python
for gate in workflow["certificationGates"]:
    result = execute_gate_verification(gate["gateType"], candidate)
    gate["status"] = result.status
    gate["evidence"] = result.evidence_ids
    gate["message"] = result.message
```

**Implement Real Gate Executors:**

1. **CONTRACT Gate:**
   - Verify TS types exist
   - Verify schema conformance
   - Verify props contract
   - Verify data contract

2. **ILS Gate:**
   - Load canonical ILS requirements from repository
   - Verify candidate against requirements
   - Generate evidence

3. **LSNB Gate:**
   - Load canonical LSNB requirements
   - Verify structural compliance
   - Verify naming compliance
   - Generate evidence

4. **RSSB Gate:**
   - Load canonical RSSB requirements
   - Verify runtime contract
   - Generate evidence

5. **UBRC Gate:**
   - Call PA-06 UBRC verification
   - Collect evidence

6. **BRAND_INDEPENDENCE Gate:**
   - Scan for hard-coded colors
   - Scan for hard-coded logos
   - Scan for brand URLs
   - Scan for brand assets
   - Distinguish design tokens from brand coupling
   - Generate findings

**Tests:**
- Each gate executes real verification
- Valid candidate passes all gates
- Invalid candidate fails appropriate gates
- Evidence IDs are real (from TS system)
- Certification endpoint returns real status

---

### WAVE 10: Candidate Placement Executor

**PA-07: Candidate Placement Agent**

**Objective:** Transform approved manifest into safe repository mutation.

**Extend:**
- `services/project-ai/app/api/routes/candidate.py`

**Current Gap:** Placement manifest generated, approved, but not executed.

**Implement:**
- Placement executor (ADD/UPDATE/EXTEND/REUSE/REJECT actions)
- File system operations with rollback
- Git operations (branch, commit)
- Discovery refresh trigger
- Evidence generation

**Workflow:**
```text
Approved Manifest
    ↓
Verify approval hash
    ↓
Execute placement actions
    ↓
Commit changes
    ↓
Trigger discovery refresh
    ↓
Generate evidence
```

**Tests:**
- ADD creates new file at target path
- UPDATE modifies existing file
- EXTEND appends to canonical artifact
- REUSE links without duplication
- REJECT prevents placement
- Rollback on failure
- Discovery triggered after placement

---

### WAVE 11: Canonical Comparison Intelligence

**PA-13: Candidate Workflow Agent**

**Objective:** Replace hard-coded similarity scores with evidence-backed canonical comparison.

**Extend:**
- `services/project-ai/app/api/routes/candidate.py` (compare endpoint)

**Current Problem:**
```python
best_match = existing_blocks[0]
similarity_score = 0.6  # ❌ hard-coded
```

**Required:**
```python
snapshot = load_current_snapshot()
canonical_blocks = snapshot["blocks"]
evidence_graph = load_evidence_graph()

for canonical_block in canonical_blocks:
    structural_similarity = compare_structure(candidate, canonical_block)
    contract_compatibility = compare_contracts(candidate, canonical_block)
    
    if structural_similarity > threshold and contract_compatibility:
        action = determine_placement_action(candidate, canonical_block)
        target_path = determine_target_path(canonical_block, action)
        evidence_ids = collect_evidence_ids(canonical_block)
```

**Tests:**
- Comparison uses real snapshot
- Canonical artifacts identified
- Placement actions evidence-backed
- Target paths from repository structure
- Evidence IDs from TS system

---

### WAVE 12: External AI Handoff Contract

**PA-14: External AI Handoff Agent**

**Objective:** Generate implementation contract for External AI.

**Create:**
- `services/project-ai/app/external/contract_generator.py`

**Workflow:**
```text
Creation Brief
    ↓
Repository Analysis
    ↓
Canonical Block Family Discovery
    ↓
Contract Generation
    ↓
Implementation Contract
    ↓
External AI
```

**Contract Should Include:**
- Required files (exact paths)
- Required TypeScript types
- Required schemas
- Required tests
- Registry requirements
- Renderer requirements
- Composer requirements
- Evidence requirements
- Acceptance criteria

**Tests:**
- Contract generated from brief
- Contract includes repository-specific paths
- Contract includes canonical contracts
- Contract includes evidence requirements

---

### WAVE 13: Verification Pipeline Integration

**PA-15: Verification/Evidence Agent**

**Objective:** Coordinate L0-L8 verification levels.

**Implement:**
- L0: Requirement verification
- L1: Static verification (lint, type-check)
- L2: Unit verification
- L3: Component verification
- L4: Integration verification
- L5: Runtime verification
- L6: Browser/E2E verification
- L7: Quality attributes (brand, theme, accessibility)
- L8: Certification readiness

**Coordinate:**
- Static checks (existing TS toolchain)
- Unit tests (existing test suites)
- Component tests (existing test infrastructure)
- Integration tests (PA-07 runtime)
- Browser tests (PA-07 Playwright)
- Quality gates (PA-16 certification)

**Tests:**
- All verification levels execute
- Results aggregated
- Evidence collected
- Failures block progression

---

### WAVE 14: I2 Certification End-to-End

**PA-17: I2 + E2E Agent**

**Objective:** Complete first full Candidate Block certification workflow.

**Workflow:**
```text
I2 Requirement
    ↓
Creation Brief (PA-14)
    ↓
External AI Prototype
    ↓
Human GUI Approval (PA-12)
    ↓
Candidate Intake (existing API)
    ↓
Canonical Comparison (PA-13)
    ↓
Placement Manifest (PA-07)
    ↓
Human Approval (PA-12)
    ↓
Repository Mutation (PA-07)
    ↓
Discovery Refresh (existing)
    ↓
Certification Gates (PA-16)
    ↓
Runtime Verification (PA-07)
    ↓
Browser Verification (PA-07)
    ↓
Evidence Collection (PA-08)
    ↓
CERTIFICATION_READY
    ↓
Human Gate 2
    ↓
CERTIFIED
```

**Tests:**
- Full I2_ONLY workflow executes
- All gates execute real checks
- Valid I2 reaches CERTIFICATION_READY
- Invalid I2 blocked at appropriate gate
- Evidence complete
- No placeholder passes

---

### WAVE 15: Mix-and-Match Validation

**Objective:** Implement composition compatibility validation.

**Extend:**
- `services/project-ai/app/api/routes/creation.py` (validate endpoint)

**Current Problem:**
```python
# For now, pass validation
workflow["status"] = WorkflowStatus.CERTIFYING  # ❌ no actual validation
```

**Required:**
```python
composition = workflow["composition"]

for component_type, source in composition.items():
    component = resolve_component(source)
    
    # Type compatibility
    verify_types_compatible(component, composition)
    
    # Version compatibility
    verify_versions_compatible(component, composition)
    
    # Registry compatibility
    verify_registry_compatible(component, composition)
    
    # Renderer compatibility
    verify_renderer_compatible(component, composition)
    
    # Runtime compatibility
    verify_runtime_compatible(component, composition)

if all_compatible:
    workflow["status"] = WorkflowStatus.CERTIFYING
else:
    workflow["status"] = WorkflowStatus.BLOCKED
    workflow["blockers"] = compatibility_errors
```

**Tests:**
- Compatible composition validated
- Incompatible composition blocked
- Type conflicts detected
- Version conflicts detected
- Registry conflicts detected
- Renderer conflicts detected

---

### WAVE 16: Project AI UI (If Time Permits)

**Objective:** Integrate Project AI into SkillHubCore Admin.

**Important:** This should reuse existing SkillHubCore UI infrastructure, NOT create separate frontend.

**Location:**
- `apps/skillhubcore-admin/src/app/(authenticated)/project-ai/`

**Reuse:**
- `ClientShell`
- `LeftSidebar`
- `Header`
- `RightSidebar`
- Existing Tailwind theme
- Existing typography (Inter/Outfit)
- Existing color palette
- Existing card components

**Screens:**
1. Dashboard (status overview)
2. Create Block (wizard using Factory patterns)
3. Candidates (list/status)
4. Verification (gate results)
5. Evidence (evidence viewer)

**Tests:**
- UI renders
- Navigation works
- API integration works
- Approval flow works

---

## 4. AGENT ALLOCATION AND OWNERSHIP

| Wave | Agent ID | Scope | Write Permissions | Parallel? |
|------|----------|-------|-------------------|-----------|
| 0 | PA-00 | Orchestration | Audit reports only | No |
| 0 | PA-01 | Architecture | None (read-only) | No |
| 0 | PA-02 | State Audit | Audit reports only | No |
| 1 | PA-03 | M2.3 Toolchain | `packages/project-llm-discovery/src/toolchain/` | No |
| 2 | PA-04 | M2.4 Composer | `packages/project-llm-discovery/src/scanners/d4-*` | Yes* |
| 2 | PA-05 | M2.5 Dependency | `packages/project-llm-discovery/src/scanners/d5-*` | Yes* |
| 3 | PA-06 | M2.6 UBRC | `packages/project-llm-discovery/src/verification/ubrc.ts`, `services/project-ai/app/certification/` | No |
| 4 | PA-08 | Evidence | `services/project-ai/app/evidence/` | No |
| 5 | PA-07 | M2.7 Runtime | `services/project-ai/app/verification/` | No |
| 6 | PA-09 | M2 Cert | Audit reports only | No |
| 7 | PA-11 | Agent Framework | `services/project-ai/app/orchestration/` | Partial** |
| 8 | PA-12 | Governance | `services/project-ai/app/api/routes/governance.py` | No |
| 9 | PA-16 | Certification | `services/project-ai/app/certification/`, `services/project-ai/app/api/routes/creation.py` | No |
| 10 | PA-07 | Placement | `services/project-ai/app/api/routes/candidate.py` | No |
| 11 | PA-13 | Comparison | `services/project-ai/app/api/routes/candidate.py` | No |
| 12 | PA-14 | External AI | `services/project-ai/app/external/` | No |
| 13 | PA-15 | Verification | `services/project-ai/app/verification/` | No |
| 14 | PA-17 | I2 E2E | Integration tests only | No |
| 15 | - | Mix & Match | `services/project-ai/app/api/routes/creation.py` | No |
| 16 | - | UI | `apps/skillhubcore-admin/src/app/(authenticated)/project-ai/` | Yes*** |

\* PA-04 and PA-05 may run in parallel if file scopes do not overlap  
** PA-11 may run partially parallel with PA-10 if contracts are stable  
*** UI components may be developed in parallel if properly scoped

---

## 5. STOP CONDITIONS

**Any agent MUST STOP and escalate when:**

1. **Architecture Ambiguity:**
   - Approved architecture conflicts with required implementation
   - No documented decision resolves the conflict

2. **Universal Infrastructure Impact:**
   - Change would affect UBRC/ILS/LSNB/RSSB definitions
   - Change would affect Composer authority
   - Change would affect authentication/authorization
   - Change would affect database architecture
   - Change would affect deployment architecture
   - Change would affect gateway/routing

3. **Security Uncertainty:**
   - Credential exposure risk
   - Unsafe generated code execution
   - Unknown External AI trust boundary
   - Production access requirement
   - Dependency supply-chain risk
   - Prompt injection affecting authority

4. **Evidence Insufficiency:**
   - Cannot prove claim from repository evidence
   - Must report `NOT VERIFIED`, never guess

5. **Human Authority Required:**
   - Approval gate reached
   - Certification decision required
   - Architecture decision required
   - Security decision required

---

## 6. SUCCESS CRITERIA PER WAVE

Each wave must produce:

1. **Implementation:**
   - Code changes committed
   - Extends existing canonical artifacts (not duplicates)
   - Follows existing code style/conventions

2. **Tests:**
   - New tests for new functionality
   - Existing tests still passing
   - Integration tests where appropriate
   - Test coverage documented

3. **Evidence:**
   - Evidence IDs generated
   - Evidence linked to claims
   - Evidence bound to repository revision
   - Evidence reconciled into graph

4. **Documentation:**
   - Canonical documentation updated (not duplicated)
   - Changes documented
   - Rationale documented
   - Evidence referenced

5. **Gate Result:**
   - Status (PASS/FAIL/BLOCKED)
   - Evidence IDs
   - Test results
   - Errors/warnings
   - Next steps

---

## 7. VERIFICATION REQUIREMENTS

Before declaring any wave complete:

1. **All tests passing:**
   - TypeScript tests (existing + new)
   - Python tests (existing + new)
   - Integration tests
   - No skipped tests without justification

2. **Evidence generated:**
   - Claims linked to evidence
   - Evidence IDs real (from TS system where applicable)
   - Evidence reconciled

3. **No regressions:**
   - Existing M2 tests still passing
   - Existing APIs still functional
   - No breaking changes without approval

4. **Documentation updated:**
   - Canonical artifacts updated
   - No duplicate documentation created
   - Changes explained

---

## 8. HUMAN GATES

### Human Gate 1: M2 Complete

**After:** Wave 6 (PA-09 M2 Certification)

**Decision Required:**
- APPROVE → proceed to Wave 7
- APPROVE WITH CONDITIONS → implement conditions first
- CORRECT → return to failed wave
- REJECT → halt and report
- STOP → halt

**Evidence Package:**
- M2 audit report
- All gate results
- All evidence
- All test results
- Blockers (if any)

### Human Gate 2: Project LLM Certification

**After:** Wave 14 (PA-17 I2 E2E)

**Decision Required:**
- CERTIFIED → mark complete
- CERTIFICATION_READY → requires changes
- BLOCKED → address blockers

**Evidence Package:**
- Full I2 workflow trace
- All certification gate results
- All evidence
- Runtime verification results
- Browser verification results

---

## 9. EXECUTION COMMAND

**To Project AI Orchestrator:**

> Execute the Project LLM completion program as specified above.
>
> Start with Wave 0 (Repository Baseline Verification).
>
> For each wave:
> 1. Audit current state
> 2. Identify canonical artifacts
> 3. Extend existing implementations
> 4. Implement missing functionality
> 5. Write/update tests
> 6. Generate evidence
> 7. Verify no regressions
> 8. Update canonical documentation
> 9. Report gate result
>
> Do NOT:
> - Skip waves
> - Run waves out of order (except approved parallel execution)
> - Recreate existing implementations
> - Create duplicate documentation
> - Declare CERTIFIED without human approval
> - Proceed past STOP conditions
>
> DO:
> - Extend existing canonical artifacts
> - Generate real evidence
> - Execute real deterministic checks
> - Stop at human gates
> - Report blockers immediately
>
> Begin with Wave 0: Repository Baseline Verification.

---

## 10. FINAL DELIVERABLE

When all waves complete successfully:

**Project LLM Status:** `CERTIFICATION_READY`

**Human Authority Required:** Final certification decision

**Evidence Package Should Contain:**
- Complete wave-by-wave audit trail
- All gate results with evidence
- All test results
- All generated evidence
- Complete I2 workflow demonstration
- Runtime verification results
- Browser verification results
- Security audit results
- Canonical documentation updates
- Blockers: [ ]

**Expected Repository State:**
- M2.3-M2.7 complete
- M2 deterministically certified
- M2.8 FastAPI operational
- Multi-agent framework operational
- Governance operational
- Candidate certification operational (real gates)
- I2_ONLY workflow operational
- MIX_AND_MATCH workflow operational
- Runtime verification operational
- Browser verification operational
- Evidence system operational
- All tests passing
- No regressions

---

## 11. CONTACT POINTS FOR ESCALATION

**Architecture Questions:**
- Reference: `.agents/specs/m2-implementation-specification.md`
- Reference: `Runtime Integration Status` documents
- Reference: ADRs in `.agents/`

**Evidence Questions:**
- Reference: M2.2 evidence architecture
- Reference: `packages/project-llm-discovery/src/evidence/`

**UBRC Questions:**
- Reference: Existing 13/13 UBRC implementations
- Reference: `packages/project-llm-discovery/src/verification/ubrc.ts`

**Stop Condition Triggered:**
- Report to PA-00 Orchestrator
- Generate STOP report with:
  - Condition triggered
  - Evidence/context
  - Required decision
  - Recommended next steps

---

## 12. LAUNCH

**Execute now.**

Wave 0 → Wave 1 → ... → Wave 14/15 → CERTIFICATION_READY → Human Gate 2
