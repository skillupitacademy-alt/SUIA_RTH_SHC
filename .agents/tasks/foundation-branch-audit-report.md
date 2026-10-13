# Foundation Branch Audit Report

**Branch:** `origin/m2-project-ai-foundation`  
**Comparison Base:** `origin/m2-project-ai-canonical-wiring`  
**Audit Date:** 2025-01-31  
**Audit Type:** READ-ONLY (no code modifications, no merges, no pushes)

---

## Executive Summary

The foundation branch implements a **complete architectural redesign** introducing a 15-agent DAG (Directed Acyclic Graph) workflow with 111,854 lines added across 9 commits. This is not an incremental enhancement—it represents a fundamentally different orchestration model than canonical-wiring.

### Key Metrics

| Metric | Foundation | Canonical-Wiring | Foundation-Only |
|--------|-----------|------------------|-----------------|
| **Agents** | 23 files | 13 files | 13 new agents |
| **Agent Tests** | 22 files | 9 files | 13 new tests |
| **Data Models** | 11 files | 9 files | 5 DAG models |
| **Verification Modules** | 8 files | 9 files | dependency.py |
| **Evidence Modules** | 4 files | 8 files | (4 removed) |
| **Orchestration** | 6 files | 7 files | workflow_dag.py |
| **Integration Tests** | 4 files | 12 files | 1 new, 8 removed |
| **Lines Changed** | +111,854 / -1,993 | (baseline) | 78 files |

---

## Architecture Comparison

### Foundation: 15-Agent DAG Architecture

**Orchestration Model:** Explicit dependency graph with parallel execution groups defined in `workflow_dag.py`

**Agent Sequence:**
1. **Repository Auditor** - Validates git repository state (clean working directory, valid branch)
2. **Snapshot Authority** - Generates TypeScript discovery snapshot ONCE, frozen for workflow
3. **Evidence Freeze** - Validates evidence structure, creates evidence index, NO hash recomputation
4. **Block Specification** - Parses candidate structure and generates CandidateBlockSpecification
5. **Candidate Intake** - Validates package structure and computes hashes
6. **Candidate Classification** - Classifies block family with confidence scoring (0.0-1.0)
7. **Canonical Comparison** - Compares with canonical artifacts
8. **Placement Manifest** - Generates placement manifest with manifest_hash
9. **Human Approval** - Database polling approval workflow (polls `approval_requests` table every 30s)
10. **Placement Executor** - Executes approved placement manifest
11. **Post-Placement Snapshot** - Verifies placement using git diff
12. **Certification Controller** - Orchestrates all 11 certification gates
13. **Runtime Agent (12K)** - Verifies blocks at runtime by starting application
14. **Playwright Browser Agent (12L)** - Orchestrates Node Playwright (NOT Python Playwright)
15. **Human Certification** - Final human certification (polls `certification_reviews` table)

**Human-in-Loop Gates:**
- **Agent 09 (Approval):** Polls `approval_requests` table with `manifest_hash` validation
- **Agent 15 (Human Certification):** Polls `certification_reviews` table for final sign-off

**Key Architectural Rules:**
- Python NEVER recomputes TypeScript-generated hashes
- Snapshot generated ONCE by Agent 02, frozen for entire workflow
- Repository Auditor (Agent 01) BLOCKS all downstream agents if git state is dirty
- No evidence_ids = BLOCKED status (not PASS)
- Governance separation: Placement Manifest (08) generates manifest, Approval (09) gates it, Executor (10) applies it

### Canonical-Wiring: Workflow Engine Architecture

**Orchestration Model:** Agent registry with workflow engine coordination via `canonical_workflow.py` and `workflow_governance.py`

**Key Differences:**
- Unified placement agent (not separated into manifest/approval/executor)
- Implementation approval workflow with governance models
- Evidence ledger and integration systems (canonical_evidence, ledger, schemas)
- Browser and runtime verification as separate certification modules
- Classification and specification integrated into other agents
- Snapshot generation integrated in workflow engine

---

## Foundation-Only Features (13 New Agents)

### 1. Repository Auditor (Agent 01)
**Purpose:** Validates git repository state before workflow proceeds  
**Validation:** Clean working directory, valid branch, no merge conflicts, remote reachable  
**Status:** Returns BLOCKED if repository is dirty or remote unreachable  
**Lines:** 280

### 2. Snapshot Authority (Agent 02)
**Purpose:** Generates TypeScript discovery snapshot ONCE and establishes frozen evidence baseline  
**Method:** Calls `pnpm tsx .agents/scripts/regenerate-m1-snapshot.mjs`  
**Architecture Rule:** Python NEVER recomputes snapshot—trusts TypeScript canonicalHash  
**Creates:** Run directory at `.project-ai/runs/{commit-sha}-{snapshot-hash}/`  
**Lines:** 229

### 3. Evidence Freeze (Agent 03)
**Purpose:** Validates evidence structure from frozen snapshot  
**Validation:** Required fields, SHA-256 hash format, no duplicates, valid lifecycle  
**Architecture Rule:** NO file recomputation—trusts TypeScript contentHash values  
**Creates:** Evidence index for fast lookup by downstream agents  
**Lines:** 290

### 4. Block Specification (Agent 04)
**Purpose:** Generates CandidateBlockSpecification by parsing candidate structure  
**Method:** Uses CanonicalComparator for evidence-backed comparison  
**Outputs:** StructuralRequirement list, block_family, detected_type  
**Lines:** 355

### 5. Classification (Agent 06)
**Purpose:** Classifies candidate blocks into BlockFamily enum with confidence scoring  
**Method:** Extracts structural features, compares against canonical blocks  
**Outputs:** block_family, confidence (0.0-1.0), reasoning, similar_canonical_blocks  
**Threshold:** Confidence >= 0.6 required for SUCCESS status  
**Lines:** 249

### 6. Placement Manifest (Agent 08)
**Purpose:** Generates placement manifest with cryptographic hash  
**Outputs:** manifestId, manifestHash, placement instructions  
**Lines:** 236

### 7. Approval (Agent 09)
**Purpose:** Human approval workflow with database polling  
**Method:** Polls `approval_requests` table every 30 seconds  
**Validation:** Validates `manifest_hash` matches on approval  
**Timeout:** Reads `PROJECT_AI_APPROVAL_TIMEOUT_SEC` (default 86400 = 24 hours)  
**Status:** Returns BLOCKED until APPROVED, BLOCKED on REJECTED/TIMEOUT  
**Lines:** 284

### 8. Placement Executor (Agent 10)
**Purpose:** Executes approved placement manifest  
**Governance:** Separated from manifest generation and approval for audit trail  
**Lines:** 193

### 9. Post-Placement Verification (Agent 11)
**Purpose:** Verifies placement using git diff  
**Method:** Validates actual file changes match placement manifest  
**Lines:** 243

### 10. Runtime Agent (Agent 12K)
**Purpose:** Verifies blocks at runtime by starting application  
**Method:** Uses `pnpm --filter <target> dev`, performs health checks  
**Architecture Rule:** Approved toolchain commands only, no arbitrary shell execution  
**Lines:** 169

### 11. Playwright Browser Agent (Agent 12L)
**Purpose:** Orchestrates Node Playwright for browser verification  
**Method:** Calls `pnpm exec playwright test --config=playwright.project-ai.config.ts`  
**Architecture Rule:** NO Python Playwright library—orchestrates Node Playwright via subprocess  
**Environment Variables:**
  - `PROJECT_AI_BASE_URL`
  - `PROJECT_AI_RUN_ID`
  - `PROJECT_AI_COMMIT_SHA`
  - `PROJECT_AI_SNAPSHOT_HASH`
  - `PROJECT_AI_CANDIDATE_BLOCKS`
**Lines:** 269

### 12. Human Certification (Agent 15)
**Purpose:** Final human certification review with database polling  
**Method:** Polls `certification_reviews` table every 30 seconds  
**Timeout:** Reads `PROJECT_AI_CERTIFICATION_TIMEOUT_SEC` (default 86400)  
**Status:** Returns BLOCKED until CERTIFIED, BLOCKED on REJECTED/TIMEOUT  
**Lines:** 304

### 13. Final Evidence Freeze (Agent 14)
**Purpose:** Final evidence validation before certification  
**Lines:** 225

---

## Foundation-Only Test Coverage

### Agent Tests (13 new test files)
1. `test_approval.py` (241 lines)
2. `test_block_specification.py` (373 lines)
3. `test_classification.py` (231 lines)
4. `test_evidence_freeze.py` (340 lines)
5. `test_final_evidence_freeze.py` (138 lines)
6. `test_human_certification.py` (195 lines)
7. `test_placement_executor.py` (294 lines)
8. `test_placement_manifest.py` (236 lines)
9. `test_playwright_browser_agent.py` (326 lines)
10. `test_post_placement_verification.py` (254 lines)
11. `test_repository_auditor.py` (205 lines)
12. `test_runtime_agent.py` (257 lines)
13. `test_snapshot_authority.py` (252 lines)

### Integration Tests (2 new test files)
1. `test_full_certification_workflow.py` (380 lines) - End-to-end DAG execution
2. `test_workflow_dag_execution.py` (350 lines) - DAG orchestration tests

### Modified Tests
- `test_final_gate.py` (123 changes)
- `test_intake.py` (72 additions)
- `test_certification_negative.py` (68 changes)

---

## Foundation-Only Infrastructure

### Database Schema
1. **`schema_certification_reviews.sql`** (32 lines)
   - Table: `certification_reviews`
   - Columns: `id`, `run_id`, `commit_sha`, `snapshot_hash`, `status`, `reviewer`, `comments`, `created_at`, `updated_at`
   - Status values: `PENDING`, `CERTIFIED`, `REJECTED`, `TIMEOUT`

2. **`001_approval_requests.sql`** (49 lines)
   - Table: `approval_requests`
   - Columns: `id`, `manifest_id`, `manifest_hash`, `candidate_id`, `status`, `reviewer`, `reviewed_at`, `created_at`, `updated_at`
   - Status values: `PENDING`, `APPROVED`, `REJECTED`, `TIMEOUT`

### Verification Module
**`verification/dependency.py`** (205 lines)
- Dependency graph verification from `snapshot.dependencies`
- Detects circular dependencies using DFS cycle detection
- Checks version conflicts with semver comparison
- Checks unlicensed packages against allowed list

### Orchestration
**`orchestration/workflow_dag.py`** (191 lines)
- Defines 15-agent DAG structure with explicit dependencies
- Parallel execution groups
- Agent definitions with `depends_on` and `parallel_group` fields

### Data Models (5 new models)
1. **`agent_result.py`** (79 lines) - Standardized AgentResult and AgentStatus
2. **`certification.py`** (94 lines) - Certification models
3. **`gate_result.py`** (61 lines) - GateResult and GateStatus
4. **`placement.py`** (104 lines) - Placement models
5. **`specification.py`** (82 lines) - CandidateBlockSpecification models

---

## Canonical-Wiring-Only Features

### Evidence System (4 modules removed in foundation)
1. **`canonical_evidence.py`** - Canonical evidence tracking
2. **`integration.py`** - Evidence integration framework
3. **`ledger.py`** - Evidence ledger system
4. **`schemas.py`** - Evidence schema definitions

### Data Models (3 models removed in foundation)
1. **`implementation_approval.py`** - Implementation approval workflow
2. **`workflow.py`** - Flexible workflow definitions
3. **`workflow_target.py`** - Workflow target models

### Orchestration (2 modules removed in foundation)
1. **`canonical_workflow.py`** - Canonical workflow definition
2. **`workflow_governance.py`** - Workflow governance rules

### Integration Tests (8 tests not in foundation)
1. `test_conftest_skip_behavior.py`
2. `test_final_gate.py` (different from agent test)
3. `test_implementation_approval.py`
4. `test_placement_engine.py`
5. `test_repositories_integration.py`
6. `test_restart_persistence.py`
7. `test_security_integration.py`
8. `test_w2_contract_generation.py`

### Certification Modules (2 separate modules in canonical-wiring, integrated in foundation)
1. **`browser_verification.py`** - Browser verification module
2. **`runtime_verification.py`** - Runtime verification module

---

## Modified Core Files (High Conflict Risk)

### Orchestration (633 total changes)
1. **`agent_coordinator.py`** - 221 changes
2. **`agent_registry.py`** - 249 changes
3. **`workflow_engine.py`** - 163 changes

### Certification
1. **`gates.py`** - 214 additions

### Evidence
1. **`logger.py`** - 14 additions

### Models
1. **`__init__.py`** - 44 additions (new model exports)

### Agents (Modified in Both Branches)
1. **`final_gate.py`** - 89 changes in foundation
2. **`intake.py`** - 154 changes in foundation

---

## Documentation (Foundation-Only)

### DAG Design Documents
1. **`project-ai-dag-design.md`** (2,809 lines) - Complete 15-agent DAG specification
2. **`project-ai-dag-plan.md`** (355 lines) - Implementation plan
3. **`project-ai-dag-design-review.md`** - Design review
4. **`project-ai-dag-design-verdict.json`** - Design approval verdict

### Feature Wave Documents (5 waves)
1. **`FEAT-001.json`** - Wave A: Foundation contracts and DAG structure
2. **`FEAT-002.json`** - Wave B: Foundation agents 01-04
3. **`FEAT-003.json`** - Wave C: Candidate pipeline agents 05-11
4. **`FEAT-004.json`** - Wave D+E: Certification gates and runtime chain
5. **`FEAT-005.json`** - Wave F: Final certification sequence and DAG orchestration

### Reviews and Completion
1. **`2025-01-30-120000-review.md`** - First review
2. **`2026-10-07-073810-review.md`** - Second review
3. **`2026-10-07-184500-review.md`** - Final review
4. **`completion-report.md`** (229 lines) - Phase 2 completion report
5. **`test-results.txt`** - Test execution results
6. **`verdict.json`** - Final approval verdict

---

## Requirements and Dependencies

### Foundation Branch Requirements

#### Database
- PostgreSQL tables: `approval_requests`, `certification_reviews`
- Schema migrations in `services/project-ai/migrations/`

#### Environment Variables
- `PROJECT_AI_APPROVAL_TIMEOUT_SEC` (default: 86400)
- `PROJECT_AI_CERTIFICATION_TIMEOUT_SEC` (default: 86400)
- `PROJECT_AI_BASE_URL` (for Playwright tests)
- `PROJECT_AI_RUN_ID` (for test execution)
- `PROJECT_AI_COMMIT_SHA` (for evidence tracking)
- `PROJECT_AI_SNAPSHOT_HASH` (for evidence binding)
- `PROJECT_AI_CANDIDATE_BLOCKS` (for browser verification)

#### Node/TypeScript Infrastructure
- Node Playwright installed and configured
- Playwright config: `playwright.project-ai.config.ts`
- TypeScript discovery script: `.agents/scripts/regenerate-m1-snapshot.mjs`
- pnpm workspace configured

#### Git Repository Requirements
- Clean working directory (enforced by Agent 01)
- Valid branch: `m2-project-ai-foundation` or `feature/*`
- No merge conflicts
- Remote reachable

#### Directory Structure
- `.project-ai/runs/{commit-sha}-{snapshot-hash}/` - Run directories
- `.project-ai/runs/current/results/playwright.json` - Playwright results
- Evidence directory structure for frozen evidence baseline

### Canonical-Wiring Requirements

#### Workflow Models
- Implementation approval workflow
- Workflow governance models
- Workflow and workflow_target models

#### Evidence System
- Canonical evidence schemas
- Evidence ledger system
- Evidence integration framework

---

## Merge Considerations

### ❌ Merge NOT RECOMMENDED

**Reason:** Fundamentally incompatible architectures. This is not a feature branch that can be reconciled with canonical-wiring—it's an architectural fork.

### Conflicts Expected (High Severity)

#### Core Orchestration (633 changes)
- `agent_coordinator.py` - 221 changes in foundation
- `agent_registry.py` - 249 changes in foundation
- `workflow_engine.py` - 163 changes in foundation

#### Certification System
- `gates.py` - 214 additions in foundation
- Foundation: Gates orchestrated by Agent 12
- Canonical-wiring: Separate `browser_verification.py` and `runtime_verification.py` modules

#### Evidence System
- Foundation: Removes `canonical_evidence.py`, `integration.py`, `ledger.py`, `schemas.py`
- Canonical-wiring: Relies on these 4 modules

#### Models
- Foundation adds: `agent_result.py`, `certification.py`, `gate_result.py`, `placement.py`, `specification.py`
- Canonical-wiring has: `implementation_approval.py`, `workflow.py`, `workflow_target.py`
- `models/__init__.py` - 44 additions in foundation (export conflicts expected)

#### Agents (Modified in Both)
- `final_gate.py` - 89 changes in foundation vs canonical-wiring modifications
- `intake.py` - 154 changes in foundation vs canonical-wiring modifications

### Architectural Decisions Required

If merging is attempted (not recommended), these fundamental decisions must be made:

1. **Orchestration Model:** DAG-based (`workflow_dag.py`) vs workflow-engine-based (`canonical_workflow.py` + `workflow_governance.py`)
2. **Human-in-Loop:** Database polling (foundation) vs implementation approval (canonical-wiring)
3. **Evidence System:** Frozen baseline with Evidence Freeze (foundation) vs ledger/integration (canonical-wiring)
4. **Verification Architecture:** Dedicated agents (foundation) vs separate certification modules (canonical-wiring)
5. **Model Structure:** DAG-specific models (foundation) vs workflow models (canonical-wiring)
6. **Placement Workflow:** Separated manifest/approval/executor (foundation) vs unified placement (canonical-wiring)
7. **Snapshot Generation:** Snapshot Authority agent (foundation) vs integrated in workflow (canonical-wiring)

### Incompatible Features

#### Cannot Coexist
- `workflow_dag.py` (foundation) vs `canonical_workflow.py` + `workflow_governance.py` (canonical-wiring)
- Database polling agents (foundation) vs governance-based approval (canonical-wiring)
- Evidence Freeze agent (foundation) vs evidence integration system (canonical-wiring)
- Snapshot Authority agent (foundation) vs integrated snapshot generation (canonical-wiring)

#### Model Conflicts
- `agent_result.py`, `gate_result.py`, `certification.py` (foundation) vs `implementation_approval.py`, `workflow.py` (canonical-wiring)
- Different `AgentResult` structures expected by orchestration layers

---

## Recommendations

### Option 1: Keep Branches Separate (RECOMMENDED)
**Action:** Merge canonical-wiring to main, keep foundation as experimental DAG branch  
**Rationale:** Canonical-wiring appears closer to production readiness. Foundation represents a research/experimental architecture that can be evaluated separately.  
**Next Steps:**
1. Complete canonical-wiring validation and merge to main
2. Evaluate foundation DAG architecture independently
3. If DAG proves superior, plan migration in separate epic

### Option 2: Choose Foundation Architecture
**Action:** Merge foundation to main if DAG architecture is the chosen direction  
**Rationale:** If the 15-agent DAG with human-in-loop gates is the desired production architecture, commit to it fully  
**Next Steps:**
1. Cherry-pick valuable canonical-wiring features not in foundation:
   - Evidence ledger and integration framework (if needed)
   - Contract generation tests
   - Security integration tests
   - Restart persistence tests
2. Resolve test skipping issues in foundation
3. Merge foundation to main after validation

### Option 3: Create Foundation-v2 Branch
**Action:** Create new branch incorporating best of both  
**Rationale:** Preserve both architectures, build unified version  
**Next Steps:**
1. Branch from canonical-wiring
2. Port foundation's 15-agent DAG architecture
3. Retain canonical-wiring's evidence integration and governance models
4. Reconcile differences incrementally

---

## Agent Count Summary

| Category | Foundation | Canonical-Wiring | Foundation-Only |
|----------|-----------|------------------|-----------------|
| **Agent Handlers** | 23 | 13 | 13 |
| **Verification Modules** | 8 | 9 | 1 |
| **Certification Gates** | 2 files | 4 files | (consolidated) |
| **Evidence Modules** | 4 | 8 | (4 removed) |
| **Data Models** | 11 | 9 | 5 |
| **Orchestration Modules** | 6 | 7 | 1 |
| **Agent Test Files** | 22 | 9 | 13 |
| **Integration Tests** | 4 | 12 | 1 new, 8 removed |
| **Orchestration Tests** | 1 | 0 | 1 |

---

## Foundation-Only Agent List (13 Agents)

1. `approval.py` (284 lines) - Human approval with database polling
2. `block_specification.py` (355 lines) - Generate CandidateBlockSpecification
3. `classification.py` (249 lines) - Classify block family with confidence
4. `evidence_freeze.py` (290 lines) - Validate evidence structure
5. `final_evidence_freeze.py` (225 lines) - Final evidence validation
6. `human_certification.py` (304 lines) - Final human certification
7. `placement_executor.py` (193 lines) - Execute approved placement
8. `placement_manifest.py` (236 lines) - Generate placement manifest
9. `playwright_browser_agent.py` (269 lines) - Orchestrate Node Playwright
10. `post_placement_verification.py` (243 lines) - Verify placement with git diff
11. `repository_auditor.py` (280 lines) - Validate git repository state
12. `runtime_agent.py` (169 lines) - Runtime verification
13. `snapshot_authority.py` (229 lines) - Generate frozen snapshot

---

## Directories Present in Foundation, Absent from Canonical-Wiring

None - all directory structures exist in both branches. Foundation adds files within existing directories rather than creating new top-level directories.

---

## Unique Value Propositions

### Foundation's Unique Value
1. ✅ **Explicit DAG orchestration** with dependencies and parallel groups
2. ✅ **Repository Auditor** enforcing clean git state before workflow
3. ✅ **Snapshot Authority** with frozen evidence baseline (no hash recomputation)
4. ✅ **Evidence Freeze** validation creating evidence index
5. ✅ **Human-in-loop approval gates** with database polling and manifest_hash validation
6. ✅ **Governance separation:** Placement Manifest → Approval → Executor
7. ✅ **Classification with confidence scoring** (threshold: 0.6)
8. ✅ **Node Playwright orchestration** (not Python Playwright)
9. ✅ **Dependency graph verification** with circular dependency detection
10. ✅ **Comprehensive agent test coverage** (13 new agent tests)
11. ✅ **Architectural documentation** (2,809-line design doc + 5 feature wave specs)

### Canonical-Wiring's Unique Value
1. ✅ **Implementation approval workflow** with governance models
2. ✅ **Evidence ledger and integration framework**
3. ✅ **Canonical evidence schemas**
4. ✅ **More comprehensive integration tests** (9 additional tests)
5. ✅ **Restart persistence tests**
6. ✅ **Security integration tests**
7. ✅ **Contract generation tests**
8. ✅ **Workflow and workflow_target models** for flexible workflow definition
9. ✅ **Evidence integration system** (canonical_evidence, ledger, schemas)

---

## Files Generated by This Audit

1. **`foundation-vs-canonical-feature-matrix.json`** - Comprehensive feature comparison matrix (JSON)
2. **`foundation-branch-audit-report.md`** - This report (Markdown)

---

## Conclusion

The foundation branch is **not a merge candidate** for canonical-wiring. It represents a complete architectural redesign with 111,854 lines added, 13 new agents, 2 human-in-loop database polling gates, DAG orchestration, and frozen evidence baseline architecture.

**Key Finding:** These are two different solutions to the project-ai certification workflow problem. Foundation commits to a 15-agent DAG with strong governance and evidence immutability. Canonical-wiring commits to a flexible workflow engine with evidence integration and ledger systems.

**Decision Required:** Choose one architecture as the production path, not attempt to merge both.

**Immediate Gate:** The original task document notes that canonical-wiring test evidence shows 1,270 skipped tests, not 1,270 passing tests. That gate must be resolved before ANY merge decisions.

---

**Audit Completed:** 2025-01-31  
**Audited By:** Foundation Branch Audit Workflow Agent  
**Audit Scope:** READ-ONLY comparison (no modifications, no merges, no pushes)
