# Foundation Branch Audit — Complete Report

## Executive Summary

The foundation branch (m2-project-ai-foundation) introduces a **comprehensive 15-agent DAG architecture** for Project AI's block certification workflow, adding 111,854 lines across 78 files in 9 unique commits. This is NOT an incremental change — it represents a fundamentally different orchestration approach compared to canonical-wiring. The branches implement **incompatible architectural patterns** (DAG-based vs workflow-engine-based) that cannot be merged without choosing one architecture over the other. **Recommendation: RECONCILE** — Merge canonical-wiring to main first, then evaluate foundation's unique DAG features for selective cherry-pick or complete rebase, depending on strategic architectural direction.

## 1. Branch Comparison

- **Unique commits:** 9 commits
- **Lines added:** +111,854
- **Lines deleted:** -1,993
- **Net addition:** +109,861 lines
- **Files changed:** 78

### Divergence Analysis
- **Foundation HEAD:** `0d7b4684c204fb76d34072908b9b6258c875c34b`
- **Canonical-Wiring HEAD:** `2e49b2a9f14e15b8f12ba230bb0dc88ce10d0d6f`
- **Merge Base (Common Ancestor):** `b035c3034ecb01f11270ee4fdbcc0e5500ecac9f`
- **Divergence Point:** Both branches diverged from the same ancestor and evolved independently

### File Change Breakdown
- **New Agent Files:** 13 agent implementations
- **New Model Files:** 5 data model definitions (agent_result, certification, gate_result, placement, specification)
- **New Test Files:** 21 test files (18 agent tests, 2 integration tests, 1 DAG test)
- **Modified Core Files:** 13 files (agents, orchestration, models)
- **Documentation/Planning:** 16 design and review documents (2,809+ lines of technical specs)
- **Database Schemas:** 2 SQL migration files (approval_requests, certification_reviews tables)
- **Helper Scripts:** 3 test fix scripts

## 2. Architectural Analysis

### 2.1 Foundation: 15-Agent DAG Architecture

Foundation implements a **strict sequential/parallel agent orchestration system** with explicit dependencies:

```
Foundation Sequence (Agents 1-4):
01. Repository Auditor → 02. Snapshot Authority → 03. Evidence Freeze → 04. Block Specification

Candidate Pipeline (Agents 5-7):
05. Candidate Intake → 06. Candidate Classification → 07. Canonical Comparison

Placement Sequence (Agents 8-11):
08. Placement Manifest → 09. Human Approval → 10. Placement Executor → 11. Post-Placement Snapshot

Certification & Verification (Agents 12-15):
12. Certification Controller (orchestrates 7-11 gates in parallel)
13. Runtime Verification (Agent 12K) → 14. Browser Verification (Agent 12L) → 15. Final Gate Controller
```

**Key Architectural Principles:**
1. **Agent Separation:** Each agent has focused, single responsibility
2. **Evidence-Driven:** All decisions backed by evidence IDs and snapshot binding
3. **No File Re-reading:** Agents consume frozen snapshots only
4. **Manifest Enforcement:** PlacementManifest required for all certification gates (no bypass)
5. **Human-in-the-Loop:** Database polling for approval (Agent 09) and certification (Agent 15)
6. **Layer Boundaries:** TypeScript discovery, Python orchestration, Node Playwright execution

### 2.2 Canonical-Wiring Architecture

Canonical-wiring uses **workflow-engine-based coordination** with:
- Agent registry for dynamic agent lookup
- `canonical_workflow.py` and `workflow_governance.py` for workflow definition
- Implementation approval process (not database polling)
- Separate `browser_verification.py` and `runtime_verification.py` modules
- Evidence ledger and integration systems
- More flexible workflow definition via workflow/workflow_target models

### 2.3 Architectural Incompatibility

**Core Conflict:** Foundation's `workflow_dag.py` (191 lines defining strict 15-agent sequence) is **incompatible** with canonical-wiring's `canonical_workflow.py` + `workflow_governance.py` approach. These represent two different answers to "how should agents be orchestrated?"

**Major Modified Files (Conflict Expected):**
- `agent_coordinator.py`: 221 changes in foundation
- `agent_registry.py`: 249 changes in foundation
- `workflow_engine.py`: 163 changes in foundation
- `gates.py`: 214 additions in foundation

## 3. Feature Inventory

### 3.1 Agents

| Metric | Foundation | Canonical-Wiring | Notes |
|--------|-----------|------------------|-------|
| **Total Agents** | 23 | 13 | Foundation has 13 new agents |
| **Unique to Foundation** | 13 | 1 | Foundation adds comprehensive DAG agents |
| **Present in Both** | 9 | 9 | Core agents shared |
| **Modified in Foundation** | 2 | — | final_gate.py, intake.py |

**13 New Agents in Foundation:**
1. `repository_auditor.py` (280 lines) — Git repository state validation
2. `snapshot_authority.py` (229 lines) — Snapshot generation, run directory creation
3. `evidence_freeze.py` (290 lines) — Evidence structure validation from snapshot
4. `block_specification.py` (355 lines) — Candidate structure parsing, requirement generation
5. `classification.py` (249 lines) — Block family classification with confidence scoring
6. `placement_manifest.py` (236 lines) — Placement manifest generation with hash
7. `approval.py` (284 lines) — Human approval database polling workflow
8. `placement_executor.py` (193 lines) — Approved placement manifest execution
9. `post_placement_verification.py` (243 lines) — Post-placement verification using git diff
10. `runtime_agent.py` (169 lines) — Runtime verification agent
11. `playwright_browser_agent.py` (269 lines) — Playwright orchestration agent
12. `final_evidence_freeze.py` (225 lines) — Final evidence aggregation and validation
13. `human_certification.py` (304 lines) — Human certification database polling workflow

### 3.2 Verification Modules

| Metric | Foundation | Canonical-Wiring |
|--------|-----------|------------------|
| **Total Modules** | 8 | 9 |
| **Unique to Foundation** | `dependency.py` (dependency graph verification) | — |
| **Unique to Canonical** | — | `browser_verifier.py`, `runtime_verifier.py` |
| **Present in Both** | 7 modules | 7 modules |

**Note:** Foundation integrates browser/runtime verification into dedicated agents (Agent 13, 14) rather than separate verifier modules.

### 3.3 Certification Gates

**Foundation Approach:** Agent 12 (Certification Controller) orchestrates all gates as methods in `gates.py` (214 additions):
- Contract Gate, UBRC Gate, Registry Gate, Renderer Gate, Composer Gate, Tests Gate
- Runtime Gate, Browser Gate, Brand Gate, Theme Gate, Dependency Gate

**Canonical-Wiring Approach:** Separate `browser_verification.py` and `runtime_verification.py` modules in `certification/` directory

### 3.4 Evidence Systems

| Metric | Foundation | Canonical-Wiring |
|--------|-----------|------------------|
| **Total Modules** | 4 | 8 |
| **Unique to Canonical** | — | `canonical_evidence.py`, `integration.py`, `ledger.py`, `schemas.py` |
| **Present in Both** | 4 modules | 4 modules |

**Note:** Foundation consolidates evidence handling into `logger.py` (14 additions) and removes/consolidates canonical-wiring's 4 additional evidence modules. Foundation emphasizes frozen evidence baseline over ledger/integration approach.

### 3.5 Data Models

| Metric | Foundation | Canonical-Wiring |
|--------|-----------|------------------|
| **Total Models** | 11 | 9 |
| **Unique to Foundation** | 5 | — |
| **Unique to Canonical** | — | 3 |
| **Present in Both** | 6 | 6 |

**5 New Models in Foundation (DAG-specific):**
- `agent_result.py` — AgentResult, AgentStatus, GateStatus
- `certification.py` — FinalCertification, CertificationVerdict, HumanCertificationDecision
- `gate_result.py` — GateResult, GateVerdict
- `placement.py` — PlacementAction, PlacementEntry, extended PlacementManifest
- `specification.py` — CandidateBlockSpecification, StructuralRequirement

**3 Models in Canonical-Wiring (not in Foundation):**
- `implementation_approval.py` — Implementation approval workflow
- `workflow.py` — Flexible workflow definition
- `workflow_target.py` — Workflow targeting

### 3.6 Orchestration

**Foundation adds:**
- `workflow_dag.py` (191 lines) — AGENT_WORKFLOW_DAG dictionary defining 15 agents with dependencies

**Canonical-Wiring has:**
- `canonical_workflow.py` — Canonical workflow orchestration
- `workflow_governance.py` — Workflow governance rules

**Both modified (heavy changes in foundation):**
- `agent_coordinator.py`, `agent_registry.py`, `gate_controller.py`, `workflow_engine.py`

## 4. Test Coverage

### 4.1 Test File Counts

- **Test files in canonical-wiring:** 112 test files
- **Test files in foundation:** 49 test files
- **New test files in foundation:** 15 files (A = Added)
- **Modified test files in foundation:** 7 files (M = Modified)

### 4.2 New Test Files in Foundation

**Agent Tests (13 files):**
1. `test_approval.py` (241 lines) — Database polling, pending/approved/rejected/timeout workflows
2. `test_block_specification.py` (373 lines) — Candidate structure parsing
3. `test_classification.py` (231 lines) — Block family classification
4. `test_evidence_freeze.py` (340 lines) — Evidence structure validation
5. `test_final_evidence_freeze.py` (138 lines) — Final evidence aggregation
6. `test_human_certification.py` (195 lines) — Human certification workflow
7. `test_placement_executor.py` (294 lines) — Placement execution
8. `test_placement_manifest.py` (236 lines) — Manifest generation and hashing
9. `test_playwright_browser_agent.py` (326 lines) — Playwright orchestration
10. `test_post_placement_verification.py` (254 lines) — Post-placement git diff verification
11. `test_repository_auditor.py` (205 lines) — Git repository validation
12. `test_runtime_agent.py` (257 lines) — Runtime verification
13. `test_snapshot_authority.py` (252 lines) — Snapshot generation

**Integration Tests (1 file):**
14. `test_full_certification_workflow.py` (380 lines) — Complete 15-agent DAG end-to-end test

**Orchestration Tests (1 file):**
15. `test_workflow_dag_execution.py` (350 lines) — Sequential/parallel execution, dependency resolution

### 4.3 Test Quality Assessment

**Strengths:**
- ✅ Proper async/await patterns with `@pytest.mark.asyncio`
- ✅ Comprehensive mocking using `AsyncMock`, `patch`
- ✅ Realistic fixtures mirroring production evidence/snapshot schemas
- ✅ Status verification (SUCCESS, BLOCKED, FAILURE)
- ✅ Evidence ID propagation tracking
- ✅ Error handling for timeout, missing data, failure paths

**Coverage Focus:**
- **Unit tests:** 13 agent-level isolation tests
- **Integration tests:** 2 workflow coordination tests
- **Orchestration tests:** 1 DAG structure validation test
- **E2E tests:** Coverage through `test_full_certification_workflow.py`

**Test Count Context:**
Foundation has fewer test files (49 vs 112) because it's a **focused implementation of the 15-agent DAG workflow**, not a full regression suite. Canonical-wiring contains accumulated tests from all prior phases including security, placement, governance, and evidence subdirectories.

### 4.4 Documented Test Results

**From `.agents/tasks/` artifacts:**
- **m2-phase7-test-gate-report.md:** TypeScript 220/220 (100%), Python 15/16 (93.8%, 1 skipped)
- **wave10-integration-testing-report.md:** 22 passed, 2 skipped (snapshot unavailable)
- **Foundation last reported run:** 370 tests passing ✅, 83 tests failing ❌, 6 skipped

**Test Improvement:** +7 more tests passing after integration fixes (from 363 to 370)

**Remaining Failures (83 tests):**
- **Category 1:** Manifest validation failures (majority) — Tests using mock manifests with empty evidenceIds
- **Category 2:** Integration test failures — AssertionError on certification status
- **Category 3:** Theme compatibility gate failures

**Note:** Test report indicates failures are primarily **test-related manifest validation issues**, not production code bugs.

## 5. Outstanding Issues

### 5.1 From W0 Baseline Audit

**Foundation Branch Known Issues:**
1. **Playwright not installed** — Browser verification degrades gracefully ✅
2. **TypeScript snapshot not automated** — Manual regeneration required ⚠️
3. **6 stub handlers** — Not all agents fully implemented ⚠️
4. **297 datetime.utcnow deprecation warnings** — Technical debt ⚠️

### 5.2 From Canonical-Wiring (Gate F W6)

**Database Schema Issues (7 test failures):**
- Missing `uploader_brand` column in `CandidateModel`
- Missing `requester_brand` column in `WorkflowModel`
- **Status:** CHANGES_REQUESTED
- **Resolution:** Add 2 database columns, rerun tests

### 5.3 Foundation-Specific Issues

**Integration Risks:**
1. **Test Skipping Issue Unresolved:** If canonical-wiring has 1,270 skipped tests, foundation inherits that technical debt
2. **Helper/Fix Scripts in Production Branch:** `fix_gate_tests.py`, `fix_gate_tests_v2.py`, `fix_old_gate_tests.py` should be removed or moved to dev-only directory
3. **Large Metadata Files in Git:** `.agents/tasks/full-diff.txt` (+96,084 insertions) may not belong in version control

**Missing External Dependencies:**
- Playwright Python bindings and browsers
- Levenshtein library (for edit distance in path inference detection)
- Database migrations for `approval_requests` and `certification_reviews` tables
- Environment variables: `PROJECT_AI_CERTIFICATION_TIMEOUT_SEC`, `PROJECT_AI_APPROVAL_TIMEOUT_SEC`

**TypeScript Discovery Integration:**
- Foundation assumes `app/repository/discovery_client.py` is available (inherited from base)
- No evidence TypeScript discovery layer is complete

## 6. Merge Strategy Decision

### Scenario Assessment

**Scenario A (Foundation is Subset):** ❌ NO
- Foundation has 13 unique agents, 111,854 lines added
- This is NOT a subset; it's a comprehensive architectural enhancement

**Scenario B (Unique Features):** ✅ YES
- 13 new agents not in canonical-wiring
- Complete 15-agent DAG architecture
- Database-polling human-in-loop workflows
- Frozen evidence baseline architecture
- Different orchestration philosophy

**Scenario C (Parallel Implementations):** ✅ YES
- Both branches implement Project AI certification but with **fundamentally different architectures**
- DAG-based (foundation) vs workflow-engine-based (canonical-wiring)
- Incompatible orchestration models (`workflow_dag.py` vs `canonical_workflow.py + workflow_governance.py`)

**Scenario D (Breaking Changes):** ⚠️ PARTIAL
- Model conflicts: foundation's DAG models (agent_result, certification, gate_result) vs canonical's workflow models (workflow, workflow_target, implementation_approval)
- Evidence system conflicts: frozen baseline vs ledger/integration
- Orchestration conflicts: 3 core files heavily modified in both branches (agent_coordinator, agent_registry, workflow_engine)

### Recommendation

**Chosen Scenario:** **Scenario B + C** (Unique Features + Parallel Implementations)

**Decision:** **RECONCILE**

Foundation and canonical-wiring represent **two architecturally incompatible approaches** to the same problem (Project AI certification). They cannot be merged in the traditional sense without choosing one architecture and discarding the other.

**Dependencies:**
1. Canonical-wiring MUST merge to main first (foundation depends on canonical-wiring's base cleanup work)
2. Foundation cannot merge until architectural direction is decided

**Risk Level:** **HIGH**

**Rationale:**
- 111,854 lines added represents fundamental architectural change
- Heavy modifications to 3 core orchestration files in both branches
- Incompatible models and orchestration patterns
- Requires strategic decision: DAG-based or workflow-engine-based future

**Timeline Estimate:** 2-4 weeks after canonical-wiring merge
- 1 week: Architectural review and decision
- 1-2 weeks: Rebase foundation on main (post-canonical merge), resolve conflicts
- 1 week: Integration testing, verify all 370+ tests pass

## 7. Integration Plan

### If RECONCILE with DAG Architecture Chosen (Foundation Primary):

**Prerequisite:**
1. ✅ Canonical-wiring merges to main first
2. ✅ Canonical-wiring database schema issues resolved (add 2 columns)
3. ✅ Canonical-wiring test suite passing

**Integration Steps:**
1. **Rebase foundation on updated main** (post-canonical merge)
2. **Architectural reconciliation:**
   - Keep foundation's `workflow_dag.py` as primary orchestration
   - Cherry-pick canonical's unique value: implementation approval models, evidence ledger/schemas, security integration tests
   - Resolve conflicts in `agent_coordinator.py`, `agent_registry.py`, `workflow_engine.py`
   - Decision: Keep DAG-based orchestration, remove `canonical_workflow.py` and `workflow_governance.py`
3. **Model reconciliation:**
   - Keep foundation's DAG models (agent_result, certification, gate_result)
   - Evaluate need for canonical's workflow/workflow_target models
   - Merge or choose between foundation's placement model vs canonical's approach
4. **Evidence system reconciliation:**
   - Decide: Frozen baseline (foundation) vs ledger/integration (canonical)
   - If ledger valuable, adapt to work with frozen baseline
5. **Test integration:**
   - Merge test suites (foundation's 49 + canonical's unique tests)
   - Resolve 83 failing tests in foundation
   - Add canonical's security integration tests, restart persistence tests
6. **Verification:**
   - Run full 15-agent DAG against test repository
   - Verify database polling workflows (approval, certification)
   - Test browser agent Playwright orchestration
   - End-to-end certification from repository audit through final certification
7. **Cleanup:**
   - Remove helper scripts (`fix_gate_tests*.py`)
   - Evaluate removing large metadata files (`.agents/tasks/full-diff.txt`)
   - Update `.gitignore` for evidence/metadata files
8. **Documentation:**
   - Document required environment variables
   - Update deployment docs for database migrations
   - Provide configuration templates
9. **Merge with --no-ff:** Create merge commit preserving foundation branch history

### If RECONCILE with Workflow-Engine Architecture Chosen (Canonical Primary):

**Integration Steps:**
1. Canonical-wiring merges to main (complete)
2. **Cherry-pick valuable features from foundation:**
   - Repository Auditor (Agent 01) — Git state validation
   - Snapshot Authority (Agent 02) — Snapshot generation with run directory
   - Evidence Freeze (Agent 03) — Evidence structure validation
   - Classification agent (Agent 06) — Block family classification with confidence
   - Post-Placement Verification (Agent 11) — Git diff verification
   - Playwright Browser Agent improvements (if better than canonical's browser_verification.py)
3. **Extract specific commits** from foundation-unique-commits.txt that add valuable standalone features
4. **Archive foundation branch** as experimental DAG architecture reference
5. **Document lessons learned** from DAG design for future orchestration improvements

### Known Conflict Areas

**High-probability conflicts during rebase:**
1. `services/project-ai/app/orchestration/agent_coordinator.py` — 221 changes in foundation
2. `services/project-ai/app/orchestration/agent_registry.py` — 249 changes in foundation
3. `services/project-ai/app/orchestration/workflow_engine.py` — 163 changes in foundation
4. `services/project-ai/app/certification/gates.py` — 214 additions in foundation
5. `services/project-ai/app/agents/final_gate.py` — Modified in both branches
6. `services/project-ai/app/agents/intake.py` — Modified in both branches

**Resolution strategy:** Manual conflict resolution required; cannot be automated due to architectural differences.

## 8. Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| **Code complexity** | HIGH | +111,854 lines, 15-agent DAG with explicit dependencies, 78 files changed |
| **Test coverage gaps** | MEDIUM | 370 passing but 83 failing tests; foundation has 49 vs canonical's 112 test files; missing security/governance test coverage |
| **Integration complexity** | HIGH | Incompatible orchestration models, 3 core files heavily modified in both branches, model conflicts, evidence system conflicts |
| **Breaking change risk** | HIGH | DAG models incompatible with workflow models, frozen baseline vs ledger, database polling vs implementation approval |
| **Timeline risk** | HIGH | 2-4 weeks post-canonical merge; depends on architectural decision timeline; conflict resolution complexity unknown until attempted |
| **Dependency risk** | MEDIUM | Requires Playwright, Levenshtein, database migrations, TypeScript discovery layer; some dependencies unverified |
| **Technical debt** | MEDIUM | 297 deprecation warnings, 83 failing tests, 6 stub handlers, helper scripts in production branch, large metadata files |
| **Regression risk** | HIGH | Cannot merge both branches without choosing architecture; wrong choice means re-implementation work |
| **Rollback complexity** | HIGH | 111,854 lines added makes rollback expensive; would require reverting entire architectural direction |

**Overall Risk Assessment:** **HIGH** — This is not a simple merge but a strategic architectural decision with significant implementation and testing effort required post-decision.

## 9. Unique Value Proposition

### 9.1 Foundation's Unique Value (Not in Canonical-Wiring)

1. **Complete 15-Agent DAG with Explicit Dependencies**
   - Parallel execution groups (certification gates)
   - Sequential agent ordering with dependency resolution
   - Cycle detection and validation
   - `workflow_dag.py` (191 lines) defining AGENT_WORKFLOW_DAG structure

2. **Human-in-Loop Database Polling Workflows**
   - Agent 09 (Approval): Polls `approval_requests` table with manifest_hash validation
   - Agent 15 (Human Certification): Polls `certification_reviews` table
   - Timeout handling and reviewer tracking
   - Self-approval prevention

3. **Repository Auditor (Agent 01)**
   - Enforces clean git state before workflow starts
   - Validates repository structure and integrity
   - Pre-flight checks for certification readiness

4. **Snapshot Authority + Evidence Freeze (Agents 02-03)**
   - Generates snapshot ONCE at workflow start
   - Freezes evidence baseline (no file re-reading)
   - Evidence ID semantic binding validation
   - Tamper detection via manifest hashing

5. **Dedicated Classification Agent (Agent 06)**
   - Block family classification with confidence scoring
   - Token-based comparison (>50% overlap)
   - Levenshtein edit distance (>70% similarity)
   - Multiple separator handling

6. **Block Specification System (Agent 04)**
   - Structural requirement extraction
   - Canonical artifact comparison
   - CandidateBlockSpecification model

7. **Placement Governance Separation (Agents 08-10)**
   - Placement Manifest generation (Agent 08) with SHA-256 hashing
   - Human Approval gate (Agent 09)
   - Placement Executor (Agent 10) — executes only approved manifests
   - Post-placement git diff verification (Agent 11)

8. **Playwright Browser Agent (Agent 14)**
   - Orchestrates Node Playwright (not Python Playwright)
   - Separate from verification modules
   - Layer boundary: TypeScript discovery → Python orchestration → Node Playwright

9. **Dependency Verification with Circular Detection**
   - `verification/dependency.py` (205 lines)
   - Circular dependency detection
   - Version conflict detection
   - Unlicensed package detection

10. **Comprehensive DAG Test Coverage**
    - 13 new agent-specific test files
    - 1 DAG execution test (350 lines)
    - 1 full workflow integration test (380 lines)
    - Total: 15 new test files for DAG-specific functionality

### 9.2 Canonical-Wiring's Unique Value (Not in Foundation)

1. **Implementation Approval Workflow**
   - `implementation_approval.py` model
   - Governance-based approval (not database polling)

2. **Flexible Workflow Definition Models**
   - `workflow.py` and `workflow_target.py` models
   - More flexible than rigid DAG structure

3. **Evidence Ledger and Integration Systems**
   - `canonical_evidence.py`, `integration.py`, `ledger.py`, `schemas.py`
   - Comprehensive evidence tracking beyond frozen baseline

4. **Comprehensive Integration Test Suite**
   - 9 additional integration tests not in foundation
   - `test_implementation_approval.py`
   - `test_placement_engine.py`
   - `test_repositories_integration.py`
   - `test_restart_persistence.py`
   - `test_security_integration.py`
   - `test_w2_contract_generation.py`

5. **Canonical Workflow Orchestration**
   - `canonical_workflow.py` + `workflow_governance.py`
   - Separation of workflow definition from execution

6. **Separate Browser/Runtime Verifier Modules**
   - `browser_verifier.py` and `runtime_verifier.py`
   - Modular verification (not agent-based)

### 9.3 Strategic Trade-offs

| Aspect | Foundation (DAG) | Canonical (Workflow-Engine) |
|--------|------------------|----------------------------|
| **Flexibility** | LOW (rigid 15-agent sequence) | HIGH (flexible workflow definition) |
| **Predictability** | HIGH (explicit dependencies) | MEDIUM (dynamic workflow) |
| **Human Workflows** | Database polling | Implementation approval |
| **Evidence Model** | Frozen baseline (immutable) | Ledger/integration (mutable) |
| **Complexity** | HIGH (111K lines, 15 agents) | MEDIUM (accumulated features) |
| **Test Coverage** | Focused (49 files, DAG-specific) | Comprehensive (112 files, full regression) |
| **Orchestration** | Explicit DAG | Workflow engine |

## 10. Strategic Questions for Decision-Makers

1. **Architectural Direction:** Is the future of Project AI certification a **rigid, predictable DAG** (foundation) or a **flexible, dynamic workflow engine** (canonical-wiring)?

2. **Human Workflow Philosophy:** Should approvals use **database polling** (foundation) or **implementation approval models** (canonical)?

3. **Evidence Philosophy:** Is evidence **frozen at workflow start** (foundation) or **continuously integrated via ledger** (canonical)?

4. **Complexity Trade-off:** Is 111,854 lines of DAG architecture justified for increased predictability, or is flexibility more valuable?

5. **Test Strategy:** Is **focused test coverage for DAG** (49 files) acceptable, or is **comprehensive regression suite** (112 files) required?

6. **Migration Path:** If foundation is chosen, how do we preserve valuable canonical features (security tests, restart persistence, evidence ledger)?

7. **Timeline Priority:** Can we afford 2-4 weeks post-canonical merge for foundation integration, or do we need to ship canonical now and defer DAG exploration?

## 11. Final Recommendation

### Recommended Action: **RECONCILE**

**Merge Strategy:**

**Phase 1: Canonical-Wiring Merge (Immediate)**
1. Fix canonical-wiring database schema issues (add 2 columns)
2. Rerun Gate F tests until passing
3. Merge canonical-wiring to main with `--no-ff`
4. Deploy and verify in staging/production
5. **Timeline:** 1 week

**Phase 2: Architectural Decision (Short-term)**
6. Conduct architectural review meeting with stakeholders
7. Present foundation DAG vs canonical workflow-engine trade-offs
8. Decide: DAG future or workflow-engine future?
9. Document decision rationale
10. **Timeline:** 1 week

**Phase 3A: If DAG Architecture Chosen**
11. Rebase foundation on main (post-canonical merge)
12. Resolve conflicts in 3 core orchestration files
13. Cherry-pick valuable canonical features (security tests, evidence ledger)
14. Fix 83 failing tests in foundation
15. Integration testing (full 15-agent DAG end-to-end)
16. Merge foundation to main with `--no-ff`
17. **Timeline:** 2-3 weeks

**Phase 3B: If Workflow-Engine Architecture Chosen**
11. Cherry-pick valuable foundation features:
    - Repository Auditor (Agent 01)
    - Snapshot Authority (Agent 02)
    - Evidence Freeze (Agent 03)
    - Classification agent (Agent 06)
    - Post-Placement Verification (Agent 11)
12. Archive foundation branch as experimental reference
13. Document DAG design lessons for future orchestration improvements
14. **Timeline:** 1-2 weeks

**Total Timeline:** 3-5 weeks from today

### Why RECONCILE (Not Other Options)

**Why Not ARCHIVE?**
- Foundation has 111,854 lines of valuable architectural work
- 13 new agents represent significant engineering investment
- DAG design has merit even if not immediately adopted
- Contains unique features worth preserving (Repository Auditor, Evidence Freeze, Classification, etc.)

**Why Not CHERRY-PICK?**
- 9 commits are too tightly coupled to extract individually
- DAG architecture is all-or-nothing (cannot cherry-pick partial DAG)
- Would require extensive refactoring to extract features from DAG context

**Why Not MERGE AFTER CANONICAL?**
- Architectural conflicts make automatic merge impossible
- Models are incompatible (DAG models vs workflow models)
- Orchestration files have 200+ line changes in both branches
- Cannot merge without choosing one architecture

**Why RECONCILE?**
- Requires strategic decision (DAG vs workflow-engine)
- Preserves optionality (can go either direction)
- Allows extraction of valuable features regardless of architectural choice
- Acknowledges this is a product/architecture decision, not a technical merge decision

### Blocking Issues

**Cannot proceed with foundation merge until:**
1. ✅ Canonical-wiring merged to main
2. ✅ Architectural direction decided (DAG vs workflow-engine)
3. ⬜ If DAG chosen: 83 failing tests fixed
4. ⬜ If DAG chosen: Database migrations tested
5. ⬜ If DAG chosen: Playwright infrastructure verified
6. ⬜ If DAG chosen: Conflicts in 3 core orchestration files resolved

### Success Criteria

**Merge Readiness Checklist:**
- ⬜ Canonical-wiring merged to main and deployed
- ⬜ Architectural decision documented
- ⬜ Foundation rebased on latest main (if DAG chosen)
- ⬜ All 370+ tests passing, 0 unexplained skipped tests
- ⬜ Database migrations tested in non-production environment
- ⬜ Playwright infrastructure verified (browsers installed, pnpm available)
- ⬜ Environment variables documented
- ⬜ Integration test against real repository passes
- ⬜ Code review completed (focus on orchestration conflicts)
- ⬜ Performance testing (15-agent DAG execution time benchmark)
- ⬜ Rollback plan documented
- ⬜ Deployment runbook updated

---

## Appendix A: Implementation Waves

Foundation followed a disciplined **wave-based implementation** strategy:

| Wave | Commit | Feature | Status |
|------|--------|---------|--------|
| **Wave A** | `d52e2cb8` | FEAT-001: Foundation contracts and DAG structure | ✅ Complete |
| **Wave B** | `8626882e` | FEAT-002: Foundation agents 01-04 | ✅ Complete |
| **Wave C** | `a4dae2ba` | FEAT-003: Candidate pipeline agents 05-11 | ✅ Complete |
| **Wave D+E** | `05b49e51` | FEAT-004: Certification gates and runtime chain | ✅ Complete |
| **Wave F** | `ae7e74c7` | FEAT-005: Final certification sequence and DAG orchestration | ✅ Complete |
| **Consolidation** | `3e242e66` | Consolidate to 15-agent architecture with DAG/Registry alignment | ✅ Complete |
| **Documentation** | `0d7b4684` | Add 15-agent DAG architecture final review | ✅ Complete |

---

## Appendix B: Key Documentation Artifacts

Foundation includes **extensive design documentation** (2,809+ lines of technical specs):

1. **`.agents/tasks/project-ai-dag-design.md`** (2,809 lines) — Complete technical design specification
2. **`.agents/tasks/project-ai-dag-plan.md`** (355 lines) — Implementation plan and wave breakdown
3. **`.agents/tasks/project-ai-dag-design-review.md`** (360 lines) — Design review findings and resolutions
4. **`.agents/tasks/project-ai-dag-design-verdict.json`** (141 lines) — Design review verdict and approval
5. **`.project-ai/runs/phase2/completion-report.md`** (229 lines) — Phase 2 completion report

Feature specifications in `.agents/tasks/project-ai-18-agent-dag/features/`:
- `FEAT-001.json` through `FEAT-005.json` (all marked status: "completed")

Review documents:
- `2025-01-30-120000-review.md` (261 lines)
- `2026-10-07-073810-review.md` (180 lines)
- `2026-10-07-184500-review.md` (259 lines)

---

## Appendix C: Top 20 Files Changed

| Rank | File | Changes | Type |
|------|------|---------|------|
| 1 | `.agents/tasks/full-diff.txt` | +96,084 | Metadata |
| 2 | `.agents/tasks/project-ai-dag-design.md` | 2,809 lines | Documentation |
| 3 | `.agents/tasks/m1-snapshot-test.json` | 1,758 changes | Evidence |
| 4 | `test_block_specification.py` | 373 lines | Test |
| 5 | `block_specification.py` | 355 lines | Agent |
| 6 | `test_full_certification_workflow.py` | 380 lines | Test |
| 7 | `test_workflow_dag_execution.py` | 350 lines | Test |
| 8 | `test_evidence_freeze.py` | 340 lines | Test |
| 9 | `test_playwright_browser_agent.py` | 326 lines | Test |
| 10 | `human_certification.py` | 304 lines | Agent |
| 11 | `test_placement_executor.py` | 294 lines | Test |
| 12 | `evidence_freeze.py` | 290 lines | Agent |
| 13 | `approval.py` | 284 lines | Agent |
| 14 | `repository_auditor.py` | 280 lines | Agent |
| 15 | `playwright_browser_agent.py` | 269 lines | Agent |
| 16 | `test_post_placement_verification.py` | 254 lines | Test |
| 17 | `test_runtime_agent.py` | 257 lines | Test |
| 18 | `test_snapshot_authority.py` | 252 lines | Test |
| 19 | `classification.py` | 249 lines | Agent |
| 20 | `agent_registry.py` | +249 changes | Orchestration |

---

**End of Foundation Branch Audit — Complete Report**

