# Project LLM Complete Roadmap & Evidence Analysis
**Generated:** 2026-10-12  
**Scope:** All .agents files modified in last 4 days  
**Purpose:** Complete audit of existing work and actionable roadmap

---

## Executive Summary

**Current State:** Project LLM has substantial implementation already complete across 5 branches with extensive evidence collection from last 4 days of intensive work.

**Key Finding:** We should NOT start fresh. The repository contains:
- ✅ 14 of 25 requirements VERIFIED (56%)
- ✅ 11 of 14 capabilities SOLID
- ✅ Complete evidence trails from migration-repair workflow
- ⚠️ 7 test failures in canonical-wiring branch due to missing DB columns
- ⚠️ Schema fix workflow currently running (needs status check)

**Recommendation:** Follow Option C (Reconcile), with conditional Option A (schema fix) after validation.

---

## Part 1: W0 Baseline Audit Files (Created Today)

### Location: `.agents/evidence/w0-baseline-audit/`

#### 1.1 Primary Audit Files

**File: `w0-summary.md`** (9 sections, 51 pages equivalent)
- **Purpose:** Executive summary of entire W0 audit
- **Key Sections:**
  - Branch Status Table (6 branches analyzed)
  - Requirements Coverage (R01-R25)
  - Implementation Inventory (14 capabilities)
  - Migration-Repair Assessment
  - 10 Critical Findings
  - Recommended Next Steps
- **Critical Data:**
  - main: 9b272567 (205/205 tests pass)
  - m2-project-ai-canonical-wiring: 2e49b2a9 (153/160 tests, 7 failures)
  - project-llm-e2e-implementation: 506366fe (316 commits, Stage 6 blocked)
- **Action Items Identified:**
  1. Fix uploader_brand/requester_brand schema issue
  2. Confirm backend route handlers (R09, R14, R15)
  3. Verify E2E lifecycle without mocks
  4. Resolve branch merge strategy

**File: `branch-audit.json`** (Technical data)
- **Purpose:** Machine-readable branch comparison
- **Contains:**
  - HEAD SHAs for all 6 branches
  - Commits ahead/behind main
  - Unique vs duplicate implementations
  - Test results per branch
  - File ownership conflicts
  - Merge strategy recommendations
- **Critical Finding:** All branches share same merge base (no git conflicts), but logical integration conflicts exist

**File: `requirements-matrix.json` & `.csv`** (25 requirements mapped)
- **Purpose:** Map every requirement to actual code
- **Status Distribution:**
  - VERIFIED: 14 (R01-R08 discovery/contract, R17-R23 certification)
  - PARTIAL: 7 (R09-R10 candidate intake, R14-R16 integration)
  - MISSING: 3
  - UNKNOWN: 1 (R25 Mix & Match)
- **Critical Gaps:**
  - R09: Candidate upload backend routes not confirmed
  - R14: Human approval enforcement unclear
  - R15: Repository write operations not verified
  - R16: Post-placement rediscovery trigger missing
  - R24: I2-Only workflow orchestration incomplete
  - R25: Mix & Match boundary undefined

**File: `implementation-inventory.json`** (14 capabilities assessed)
- **SOLID (11):**
  - Repository Intelligence (TypeScript discovery)
  - Contract Generation (Python FastAPI)
  - Placement Planning (artifact_policy.py)
  - Tutorial Composer Integration
  - Block Registries/Schemas
  - Renderer Runtime Connection
  - Browser E2E Tests
  - Evidence Collection (append-only JSONL)
  - Migration Repair Workflow
  - ILS/LSNB/RSSB
  - Theme/Brand System
  - Agent Registry (28 agents)
  - Canonical Documentation
- **PARTIAL (1):**
  - Candidate Upload/Validation (frontend exists, backend routes unclear)

**File: `migration-repair-assessment.md`** (6-stage workflow analysis)
- **Purpose:** Evaluate what to keep/archive from migration-repair
- **Stages Documented:**
  1. Investigation (Gates A-D): Drizzle snapshot chain analysis
  2. Surgical Fix: Removed 46 duplicate statements from migration 0012
  3. Idempotent Patches: Fixed migrations 0017-0021
  4. Comprehensive Repair Discovery
  5. Migration Sequence Restoration
  6. Evidence Collection & Final Status
- **Reusable Patterns:**
  - ✅ Evidence ledger system (append-only, SHA-256 chains)
  - ✅ Gate-based workflow progression
  - ✅ Forensic investigation methodology
  - ✅ Final status report structure
- **Archive (Migration-Specific):**
  - ❌ SQL parsing logic (Drizzle-specific)
  - ❌ Migration 0012 surgical fix details
  - ❌ Backup files (.backup artifacts)
- **Safety Concerns:**
  - ⚠️ No SQL operation allowlist found
  - ⚠️ Workflow not idempotent (can't run twice safely)
  - ⚠️ Evidence ID linking uses synthetic IDs

**File: `canonical-docs-map.json`** (51 authoritative documents)
- **Purpose:** Index all sources of truth
- **Categories:**
  - 22 Architecture specs
  - 10 Block specifications (I1, C1, D1 patterns)
  - 6 Evidence schemas
  - 10 Governance contracts (Phase 0.1-0.10, all FROZEN)
  - 2 API contracts
  - 2 Project LLM specs
- **Top 10 Most Important:**
  1. `docs/ubrc/ARCHITECTURE-DOCUMENTATION-INDEX.md` (master index)
  2. `docs/ubrc/NEW-BLOCK-DEVELOPMENT-READING-ORDER.md` (27-doc sequence)
  3. `docs/ubrc/governance-contracts-index.md` (all Phase 0 contracts)
  4. `docs/ubrc/PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md` (authority boundaries)
  5. `docs/ubrc/PHASE-0.6-EVIDENCE-AND-CERTIFICATION-CONTRACT-V1.md` (maturity levels)
  6. `docs/ubrc/PHASE-0.7-VALIDATION-AND-TESTING-CONTRACT-V1.md` (L0-L8 validation)
  7. `docs/ubrc/definition-block-version-architecture.md` (D1-D6 reference)
  8. `docs/ubrc/UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` (prototype → Composer)
  9. `.agents/specs/m2-implementation-specification.md` (M2 foundation)
  10. `.agents/evidence/README.md` (evidence system overview)

---

## Part 2: Migration-Repair Evidence (Last 4 Days)

### Location: `.agents/evidence/runs/migration-repair-20261011-143539-06936246/`

#### 2.1 Stage Evidence Files

**Stage 1-5 Evidence:**
- `v0-preflight.json` - Safety checks (PASS)
- `v1-database-setup.json` - BLOCKED (Docker unavailable)
- `v2-migration-execution.json` - BLOCKED (cascade from V1)
- `v3-schema-verification.json` - BLOCKED
- `v4-package-tests.json` - BLOCKED
- `v5-integration-tests.json` - BLOCKED
- `v6-security-tests.json` - BLOCKED
- `v7-performance-baseline.json` - BLOCKED
- `v8-evidence-manifest.json` - Collected all V0-V7 hashes
- `v9-cleanup.json` - PASS (no cleanup needed)
- `v10-verification-summary.json` - Overall: BLOCKED

**Stage 5 Review Evidence:**
- `stage5-gate.json` - CHANGES_REQUESTED (17 findings: 3 HIGH, 8 MEDIUM, 6 LOW)
- `stage5-w5a-static-security.json` - NEEDS_CHANGES (5 issues, 1 HIGH)
- `stage5-w5b-test.json` - NEEDS_CHANGES (7 blocking issues)
- `stage5-w5c-artifact-consistency.json` - NEEDS_CHANGES (5/7 criteria passed)

**Stage 5 HIGH Severity Fixes:**
- `stage5-high-severity-fixes.json` - 3 fixes applied (commit 61d8b253)
- `stage5-final-gate.json` - APPROVED after fixes
- `stage5-final-w5a-static-security.json` - APPROVED
- `stage5-final-w5b-test.json` - APPROVED
- `stage5-final-w5c-artifact-consistency.json` - APPROVED

**Stage 6 Isolated Test Evidence:**
- `stage6-setup.json` - BLOCKED (Docker not running)
- `stage6-migrations.json` - SKIPPED
- `stage6-tests.json` - SKIPPED
- `stage6-cleanup.json` - PASS
- `stage6-verification.json` - Overall: BLOCKED

**Commit Message Wiring Evidence:**
- `commit-wiring-plan.json` - Implementation plan
- `commit-wiring-plan.md` - Human-readable plan
- `commit-wiring-review.json` - APPROVED (9/9 checks passed)
- `commit-wiring-review.md` - Detailed review
- `commit-message-wiring.json` - Evidence file

---

## Part 3: Recent Task Files (Last 4 Days)

### Location: `.agents/tasks/`

#### 3.1 Gate Review Documents

**Gate F (Final Integration):**
- `gate-f-review-doc.md` - Integration assessment
- `gate-f-regression-analysis.md` - 153/160 tests pass analysis
- `gate-f-integration-report.md` - Initial integration findings
- `gate-f-fix-plan.md` - Fix strategy for 7 failures
- `gate-f-fix-report.md` - Fix implementation
- `gate-f-fix-review.md` - Fix validation
- `gate-f-schema-fix-report.md` - Schema issue diagnosis
- `gate-f-integration-report-final.md` - Post-fix integration
- `gate-f-final-review.md` - Final gate verdict
- `gate-f-w6-domain-results.json` - Test results (initial)
- `gate-f-w6-domain-results-final.json` - Test results (post-fix)
- `gate-f-full-test-output.txt` - Raw test logs (initial)
- `gate-f-full-test-output-final.txt` - Raw test logs (post-fix)

**Gate G (Publication Gate):**
- `gate-g-review.md` - Publication readiness review
- `gate-g-final-report.md` - Publication decision

**Gate E1 & E2 (Authorization & Policy):**
- `gate-e1-final-review.md` - Authorization review
- `gate-e1-fix-report.md` - Authorization fixes
- `gate-e2-fix-plan.md` - Policy integration plan
- `gate-e2-fix-report.md` - Policy fixes
- `gate-e2-final-review.md` - Policy verification
- `gate-e2-authorization-audit.json` - Detailed audit
- `gate-e2-policy-integration.json` - Integration results

**Gate C (Testing Gate):**
- `gate-c-test-results.json` - Test execution results
- `gate-c-test-output.txt` - Raw test logs

#### 3.2 Stage 5 Fix Documents

**Stage 5 High Severity Fixes:**
- `stage5-fixes-plan.md` - Plan for 3 HIGH severity issues
- `stage5-fixes-review.md` - Review of fixes
- `stage5-fixes-review.json` - Review verdict

**Commit Message Wiring:**
- `commit-wiring-plan.md` - Implementation plan
- `commit-wiring-review.md` - Code review
- `commit-wiring-review.json` - Review verdict

---

## Part 4: Evidence Ledger Files

### Location: `.agents/evidence/`

#### 4.1 Append-Only Ledgers

**File: `agent-runs.jsonl`** (Append-only log)
- **Purpose:** Record every agent execution
- **Last Modified:** 2026-10-12 06:53:26 (TODAY)
- **Schema:** One JSON object per line
- **Contains:**
  - agent_id, wave, timestamp, status
  - duration_ms, commit_hash
  - tests_passed, tests_failed
  - evidence IDs, file changes

**File: `evidence.jsonl`** (Append-only log)
- **Last Modified:** 2026-10-08 23:17:18
- **Purpose:** Record evidence artifacts with SHA-256 hashes
- **Schema:** Links artifacts to commits and agent runs

**File: `gate-results.jsonl`** (Append-only log)
- **Last Modified:** 2026-10-08 19:33:19
- **Purpose:** Record gate verdicts (PASS/FAIL/BLOCKED)

**File: `test-results.jsonl`** (Append-only log)
- **Last Modified:** 2026-10-08 19:33:18
- **Purpose:** Record test execution results

#### 4.2 Evidence Documentation

**File: `README.md`** (Evidence system overview)
- **Last Modified:** 2026-10-08 23:15:23
- **Purpose:** Document evidence collection system
- **Contents:**
  - Append-only JSONL format
  - SHA-256 hash chains
  - R0+ canonical store
  - Evidence schemas

**File: `DATA_QUALITY.md`** (Known issues)
- **Last Modified:** 2026-10-08 23:15:00
- **Purpose:** Document evidence data quality issues
- **Known Issues:**
  - 40+ spurious W2 entries with empty filesChanged
  - Synthetic evidence IDs instead of linked IDs
  - Local verification dependencies

**File: `FINAL-STATUS-REPORT.md`** (Migration repair summary)
- **Last Modified:** 2026-10-11 07:11:51
- **Purpose:** Final status of migration-repair workflow
- **Status:** ✅ All 28 migrations execute successfully
- **Test Results:** 637/791 non-skipped tests pass (80.6%)

---

## Part 5: Critical Findings Analysis

### 5.1 Schema Issue (Blocking canonical-wiring merge)

**Problem:** 7 test failures due to missing database columns
**Columns:** `uploader_brand`, `requester_brand`
**Location:** Likely in `CandidateModel` or `WorkflowModel`
**Branch:** m2-project-ai-canonical-wiring (2e49b2a9)
**Current Test Status:** 153/160 tests passing (93.75%)

**Investigation Required:**
1. Find actual schema definition (SQLAlchemy models)
2. Determine correct field types (likely string, FK to brand table)
3. Check if authorization logic requires these fields
4. Verify migration strategy
5. Test in isolated environment BEFORE merging
6. Confirm RBAC prevents cross-brand access

**Schema Fix Workflow Status:**
- **Launched:** wf_69e83a12839ed565
- **Name:** fix-canonical-wiring-schema
- **Status:** NEEDS VERIFICATION (no completion notification yet)
- **Action:** Check status and abort if needed for Option C review

### 5.2 Backend Integration Gaps

**R09: Candidate Upload Backend Routes**
- **Status:** PARTIAL
- **Frontend:** ✅ Exists at `apps/skillhubcore-admin/.../candidate-upload`
- **Backend:** ⚠️ Python route handlers not confirmed in W0 audit
- **Required:** Verify or implement `/api/candidate/upload` endpoint
- **Agent:** CANDIDATE_INTAKE registered with capabilities

**R14: Human Approval Enforcement**
- **Status:** PARTIAL
- **Frontend:** ✅ AWAITING_IMPLEMENTATION_APPROVAL state exists
- **Backend:** ⚠️ Enforcement mechanism not fully confirmed
- **Required:** Verify fail-closed behavior (blocks writes until approval)
- **Critical:** Must not trust client-supplied approval flags

**R15: Repository Write Operations**
- **Status:** PARTIAL
- **Agent:** CANDIDATE_PLACEMENT can propose placement
- **Backend:** ⚠️ Actual file creation and git operations not verified
- **Required:** Verify safe repository modification with authorization

**R16: Post-Placement Rediscovery Trigger**
- **Status:** PARTIAL
- **Scanner:** ✅ D3-blocks-scanner can rediscover
- **Trigger:** ⚠️ Automated trigger after placement not confirmed
- **Decision:** Manual rediscovery may be acceptable if documented

### 5.3 I2-Only and Mix & Match

**R24: I2-Only Workflow Orchestration**
- **Status:** PARTIAL
- **Creation Brief:** ✅ Supports family/version targeting
- **Orchestration:** ⚠️ Full workflow gates/states/certification unclear
- **Required:** Clarify if separate workflow or uses canonical block lifecycle

**R25: Mix & Match Boundary**
- **Status:** UNKNOWN
- **Test File:** ✅ `tests/e2e/project-ai/mix-match-composition.spec.ts` exists
- **Boundary:** ⚠️ Distinction between "design input" vs "certification workflow" unclear
- **Decision:** Product owner must decide scope

### 5.4 Migration-Repair Safety Concerns

**SQL Operation Allowlist:**
- **Status:** MISSING
- **Severity:** HIGH (if Project LLM generates SQL)
- **Current:** Manual SQL review only
- **Required:** Programmatic allowlist for DDL operations
- **Blocklist:** DROP DATABASE, TRUNCATE, etc.

**Workflow Idempotency:**
- **Status:** GAP
- **Issue:** Surgical fix stages modify files without checking if already applied
- **Risk:** Running twice would fail or corrupt
- **Required:** Idempotency checks before file modifications

**Evidence ID Linking:**
- **Status:** GAP (LOW SEVERITY)
- **Issue:** Synthetic IDs like `candidate-{id}-classification`
- **Impact:** Breaks evidence chain traceability
- **Fix:** Link to actual discovery evidence IDs

---

## Part 6: Complete Roadmap - Option C (Recommended)

### Phase 0: Immediate Actions (TODAY)

**Action 0.1: Check Schema Fix Workflow Status**
```bash
# Check if workflow is still running
wf_69e83a12839ed565 status check required

# If running: Pause and review plan before proceeding
# If completed: Review changes before merge
# If failed: Investigate failure reason
```

**Action 0.2: Commit W0 Audit Evidence**
```bash
git add .agents/evidence/w0-baseline-audit/
git commit -m "docs: W0 baseline audit evidence

Complete audit of Project LLM implementation:
- 6 branches analyzed
- 25 requirements mapped (14 VERIFIED, 7 PARTIAL)
- 14 capabilities assessed (11 SOLID, 1 PARTIAL)
- Migration-repair patterns evaluated
- 51 canonical documents indexed

No code changes. Evidence only.

Run-ID: w0-baseline-20261012"
```

**Action 0.3: Preserve Current State**
- ✅ Do NOT merge any branches yet
- ✅ Do NOT delete or archive branches
- ✅ Do NOT modify production database
- ✅ Preserve all evidence files (append-only)

### Phase 1: Reconciliation (Day 1-2)

**Goal:** Understand what actually exists and resolve contradictions

#### Task 1.1: Branch Ownership Matrix
**Owner:** Agent A (Branch Audit)
**Input:** `branch-audit.json`, all 6 branch HEADs
**Output:** `branch-ownership-matrix.md` + `.json`

**Deliverables:**
```
For each file/feature, identify:
- Primary owner branch
- Duplicate implementations (if any)
- Conflicts (logical, not just textual)
- Dependencies
- Test coverage
- Recommended action (KEEP/MERGE/ARCHIVE/NEEDS_FIX)
```

**Example Output:**
| Feature | Main | M2-Foundation | M2-Canonical | GUI | E2E-Impl | Owner | Action |
|---------|------|--------------|-------------|-----|----------|-------|--------|
| Repository Discovery | ✅ 9b272567 | - | - | - | - | main | KEEP |
| Contract Generation | - | ✅ 0d7b4684 | ✅ 2e49b2a9 | - | - | canonical-wiring | MERGE after fix |
| Candidate Upload UI | - | - | ✅ 2e49b2a9 | ✅ 44d4928d | - | canonical-wiring | MERGE, resolve conflict |

#### Task 1.2: Requirements Matrix Reconciliation
**Owner:** Agent B (Requirements Audit)
**Input:** `requirements-matrix.json`, all branch code
**Output:** `requirements-matrix-reconciled.csv` + `.json`

**Fix Contradictions:**
1. Count discrepancies (14 VERIFIED vs actual count)
2. Date inconsistencies (January vs October 2026)
3. Status disagreements between JSON/CSV/MD files
4. Evidence maturity levels (DECLARED→OBSERVED→MEASURED→VERIFIED→CERTIFIED)

**For Each Requirement:**
```json
{
  "id": "R09",
  "title": "Candidate Upload Backend",
  "status": "PARTIAL",
  "evidence_maturity": "OBSERVED",
  "branches": {
    "main": "NOT_FOUND",
    "m2-canonical-wiring": "FRONTEND_ONLY",
    "m2-foundation": "AGENT_REGISTERED"
  },
  "implementation_files": [
    "apps/skillhubcore-admin/.../candidate-upload/page.tsx",
    "services/project-ai/app/orchestration/agent_registry.py"
  ],
  "missing_files": [
    "services/project-ai/app/api/routes/candidate.py"
  ],
  "test_coverage": "NONE",
  "blocker": "Backend route handler not implemented",
  "acceptance_criteria": "File upload endpoint accepts ZIP, validates, returns candidate ID"
}
```

#### Task 1.3: Schema Investigation
**Owner:** Agent C (Database/RBAC Audit)
**Input:** All branches, database schema files
**Output:** `schema-analysis-report.md` + `schema-fix-proposal.json`

**Investigation Steps:**
1. **Find Schema Definitions:**
   ```
   - services/project-ai/app/models/candidate.py
   - services/project-ai/app/models/workflow.py
   - packages/db-tutorial/src/schema.ts (TypeScript schema)
   ```

2. **Analyze Missing Columns:**
   ```python
   # Expected in CandidateModel or WorkflowModel:
   uploader_brand: str  # FK to brand table
   requester_brand: str  # FK to brand table
   
   # Questions:
   - Nullable or required?
   - Default value?
   - Index needed?
   - Constraints?
   ```

3. **Trace Authorization:**
   ```
   - Who supplies brand identity? (user auth vs workflow context)
   - Can user specify arbitrary brand? (security risk)
   - Cross-brand access prevention logic
   - Existing RBAC tests
   ```

4. **Migration Strategy:**
   ```
   - Alembic migration number (next in sequence)
   - Backfill strategy for existing records
   - Rollback safety
   - Test database target (NOT production)
   ```

**Deliverable: Schema Fix Proposal**
```json
{
  "columns": [
    {
      "table": "candidates",
      "column": "uploader_brand",
      "type": "String(50)",
      "nullable": false,
      "foreign_key": "brands.id",
      "default": null,
      "index": true,
      "migration_id": "add_brand_columns_to_candidates"
    }
  ],
  "authorization_changes": [
    "Add brand_id validation in CandidateService.create()",
    "Verify user has access to specified brand",
    "Block cross-brand queries in CandidateRepository.list()"
  ],
  "test_plan": [
    "test_candidate_creation_with_valid_brand",
    "test_candidate_creation_rejects_invalid_brand",
    "test_cross_brand_access_denied",
    "test_existing_records_after_migration"
  ],
  "risk_assessment": "MEDIUM - adds required field, needs backfill strategy"
}
```

#### Task 1.4: Lifecycle E2E Verification
**Owner:** Agent D (Lifecycle Audit)
**Input:** All branches, existing E2E tests
**Output:** `lifecycle-execution-matrix.md`

**Trace Each Step:**
```
1. Target Selection → IMPLEMENTED? (frontend component)
2. Repository Discovery → IMPLEMENTED (packages/project-llm-discovery)
3. Contract Generation → IMPLEMENTED (services/project-ai/app/contracts/)
4. Candidate Upload → PARTIAL (frontend yes, backend unclear)
5. Candidate Validation → PARTIAL (classification logic exists)
6. Placement Proposal → IMPLEMENTED (artifact_policy.py)
7. Human Approval → PARTIAL (frontend gate, backend enforcement unclear)
8. Repository Integration → PARTIAL (propose exists, actual write unclear)
9. Rediscovery → PARTIAL (scanner exists, trigger unclear)
10. Certification → IMPLEMENTED (evidence collection complete)
```

**For Each Step, Document:**
- Frontend component path
- Backend API route
- Service layer implementation
- Database persistence (if needed)
- Authorization checks
- Test coverage
- Mocks/stubs/skips
- Status: SOLID/PARTIAL/STUB/MISSING

#### Task 1.5: Test Framework Standardization
**Owner:** Agent E (Test/Evidence Audit)
**Input:** Existing test commands, evidence ledgers
**Output:** `test-execution-standard.md` + reference implementation

**Deliverables:**
1. **Standard Test Result Schema** (if doesn't exist)
2. **Command Capture Utility** (reuse existing or create)
3. **Evidence Ledger Integration** (link to agent-runs.jsonl)
4. **Test Index:** All test commands with coverage mapping

**Example Test Index:**
```json
{
  "test_suites": [
    {
      "id": "typescript-discovery",
      "command": "pnpm --filter @quiz/project-llm-discovery test",
      "coverage": ["R01", "R02"],
      "last_run": "RUN-20261012-0001",
      "status": "PASS",
      "exit_code": 0
    },
    {
      "id": "python-contract-generation",
      "command": "cd services/project-ai && pytest tests/integration/test_w2_contract_generation.py",
      "coverage": ["R03", "R08"],
      "last_run": "RUN-20261012-0002",
      "status": "PASS",
      "exit_code": 0
    }
  ]
}
```

#### Task 1.6: Architecture Validation
**Owner:** Agent F (Architecture/UI Audit)
**Input:** All source code, API routes, UI components
**Output:** `architecture-compliance-report.md`

**Verify Boundaries:**
```
TypeScript/Node.js (Repository Intelligence):
  ✅ packages/project-llm-discovery/src/scanners/d3-blocks-scanner.ts
  ✅ Produces deterministic snapshots
  ✅ No Python code directly scans repository

Python/FastAPI (Orchestration):
  ✅ services/project-ai/app/contracts/
  ✅ Consumes TypeScript snapshots
  ✅ Does NOT scan repository directly
  ⚠️ Some route handlers need verification

React/TypeScript/Next.js (UI):
  ✅ apps/skillhubcore-admin/.../project-llm/
  ⚠️ Some components may call unimplemented backends
  ⚠️ Success states may be optimistic (need verification)

Boundaries Preserved:
  ✅ ILS/LSNB/RSSB not replaced by Project LLM
  ✅ Tutorial Composer remains authoritative for block authoring
  ✅ TutorialBlockRenderer not duplicated
  ✅ Multi-brand theme system respected
```

### Phase 2: Schema Fix Implementation (Day 3)

**Prerequisite:** Phase 1 complete, schema proposal approved

#### Task 2.1: Implement Schema Changes
**Owner:** Agent C (Schema Owner)
**Branch:** Create new branch from `m2-project-ai-canonical-wiring`
**Branch Name:** `schema-fix-brand-columns`

**Steps:**
1. **Create Alembic Migration:**
   ```python
   # services/project-ai/alembic/versions/XXXX_add_brand_columns.py
   def upgrade():
       op.add_column('candidates',
           sa.Column('uploader_brand', sa.String(50), nullable=False)
       )
       op.add_column('candidates',
           sa.Column('requester_brand', sa.String(50), nullable=False)
       )
       op.create_foreign_key(...)
   
   def downgrade():
       op.drop_column('candidates', 'requester_brand')
       op.drop_column('candidates', 'uploader_brand')
   ```

2. **Update Models:**
   ```python
   # services/project-ai/app/models/candidate.py
   class CandidateModel(Base):
       uploader_brand: Mapped[str] = mapped_column(String(50), nullable=False)
       requester_brand: Mapped[str] = mapped_column(String(50), nullable=False)
   ```

3. **Add Authorization:**
   ```python
   # services/project-ai/app/services/candidate_service.py
   def create_candidate(self, data: CandidateCreate, user: User):
       # Verify user has access to specified brand
       if data.uploader_brand not in user.accessible_brands:
           raise UnauthorizedError("User cannot upload for this brand")
   ```

4. **Write Tests:**
   ```python
   # services/project-ai/tests/test_candidate_brand_isolation.py
   def test_candidate_creation_with_valid_brand():
       ...
   
   def test_cross_brand_access_denied():
       ...
   ```

#### Task 2.2: Run Schema Tests
**Environment:** Isolated test database (NOT production)
**Database:** `tutorial_test` on localhost (verify with safety checks)

**Test Sequence:**
1. Run migration against empty test DB
2. Create test records with brand columns
3. Run authorization tests
4. Run full test suite (should be 160/160)
5. Test migration rollback
6. Document results

#### Task 2.3: Review Schema Changes
**Owner:** Agent C + Independent Reviewer
**Input:** Schema fix branch, test results
**Output:** Schema fix approval or CHANGES_REQUESTED

**Review Checklist:**
- [ ] Columns match proposal
- [ ] Authorization prevents cross-brand access
- [ ] All 160 tests pass
- [ ] Migration is idempotent
- [ ] Rollback works
- [ ] No production database touched
- [ ] Evidence complete (test logs, exit codes)

### Phase 3: Backend Integration (Day 4-5)

**Goal:** Implement confirmed missing backend pieces

#### Task 3.1: Candidate Upload Backend
**Owner:** New agent or existing CANDIDATE_INTAKE agent
**Requirement:** R09
**Status Change:** PARTIAL → VERIFIED

**Implementation:**
```python
# services/project-ai/app/api/routes/candidate.py
from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/api/candidate")

@router.post("/upload")
async def upload_candidate(
    file: UploadFile = File(...),
    family: str,
    version: str,
    user: User = Depends(get_current_user)
):
    # 1. Validate file size/type
    # 2. Extract to temp directory
    # 3. Compute SHA-256 hash
    # 4. Validate against contract
    # 5. Store candidate record
    # 6. Return candidate ID
    pass
```

**Tests:**
```python
def test_upload_valid_candidate():
    ...

def test_upload_rejects_invalid_archive():
    ...

def test_upload_enforces_file_size_limit():
    ...
```

#### Task 3.2: Human Approval Enforcement
**Owner:** Agent C (Authorization specialist)
**Requirement:** R14
**Status Change:** PARTIAL → VERIFIED

**Implementation:**
```python
# services/project-ai/app/services/placement_service.py
def execute_placement(self, placement_id: str, user: User):
    placement = self.repo.get_placement(placement_id)
    
    # CRITICAL: Verify approval exists and is valid
    if not placement.approval:
        raise Unauthorized("Placement not approved")
    
    if placement.approval.status != ApprovalStatus.APPROVED:
        raise Unauthorized("Placement rejected or pending")
    
    if placement.approval.approved_by != user.id and not user.is_admin:
        raise Unauthorized("Only approver or admin can execute")
    
    # Verify manifest hash matches approval
    if placement.manifest_hash != placement.approval.manifest_hash:
        raise IntegrityError("Manifest changed after approval")
    
    # Now safe to execute
    self._execute_placement_operations(placement)
```

**Tests:**
```python
def test_placement_blocked_without_approval():
    ...

def test_placement_blocked_with_rejected_approval():
    ...

def test_placement_blocked_if_manifest_changed():
    ...

def test_placement_succeeds_with_valid_approval():
    ...
```

#### Task 3.3: Repository Write Operations
**Owner:** Agent specialized in file operations
**Requirement:** R15
**Status Change:** PARTIAL → VERIFIED

**Implementation:**
```python
# services/project-ai/app/services/repository_writer.py
class RepositoryWriter:
    def write_files(self, placement: PlacementManifest, target_dir: Path):
        for item in placement.items:
            if item.action == "ADD":
                self._add_file(item, target_dir)
            elif item.action == "UPDATE":
                self._update_file(item, target_dir)
            elif item.action == "EXTEND":
                self._extend_file(item, target_dir)
            # REUSE and REJECT require no file operations
```

**Tests:**
```python
def test_add_file_creates_new_file():
    ...

def test_update_file_modifies_existing():
    ...

def test_extend_file_appends_content():
    ...

def test_rejects_operations_outside_approved_scope():
    ...
```

### Phase 4: Integration Testing (Day 6)

**Goal:** Prove E2E lifecycle works

#### Task 4.1: Run Full Test Suite
**Owner:** Agent E (Test coordinator)
**Environment:** All branches after Phase 2-3 changes

**Test Execution:**
```bash
# 1. TypeScript discovery tests
cd packages/project-llm-discovery
pnpm test > test-results/discovery-$(date +%Y%m%d).log 2>&1
echo $? > test-results/discovery-exit-code.txt

# 2. Python backend tests
cd services/project-ai
pytest tests/ -v --junitxml=test-results/backend-junit.xml

# 3. Integration tests
pytest tests/integration/ -v

# 4. E2E tests (if can run)
cd ../..
pnpm test:e2e
```

**Capture All Results:**
- Exit codes
- Test counts (passed/failed/skipped)
- Duration
- Raw logs
- Commit SHA
- Branch name

#### Task 4.2: E2E Lifecycle Test
**Owner:** Agent D (Lifecycle specialist)
**Goal:** Demonstrate real workflow WITHOUT mocks

**Test Scenario:**
```
1. Start with clean test database
2. User selects "Introduction I2" target
3. System runs TypeScript discovery → produces snapshot
4. System generates contract from snapshot
5. User uploads candidate ZIP file
6. System validates candidate
7. System proposes placement (ADD/UPDATE/EXTEND)
8. Human reviews and approves (real approval, not simulated)
9. System executes approved placement
10. System triggers rediscovery
11. System runs regression tests
12. System produces certification evidence
```

**Evidence Required:**
- Screenshots/logs of each step
- Database state before/after
- API request/response logs
- Approval record
- File modifications (git diff)
- Final certification verdict

**Identify ANY:**
- Mocked services
- Simulated approvals
- In-memory storage
- Skipped steps
- Stubbed handlers

### Phase 5: Branch Integration (Day 7)

**Goal:** Merge verified work to main

#### Task 5.1: Prepare Integration Branch
**Owner:** Coordinator
**Strategy:** Sequential merge, not all-at-once

**Merge Order:**
```
1. main (baseline) - already has M1
2. schema-fix-brand-columns (from Phase 2)
3. m2-project-ai-canonical-wiring (after schema fix applied)
4. backend-integration-r09-r14-r15 (from Phase 3)
5. m2-project-ai-foundation (unique features only)
6. project-ai-gui (after backend compatibility verified)
```

**For Each Merge:**
1. Create PR with full test evidence
2. Run CI checks
3. Independent review
4. Require approval
5. Merge only after tests pass
6. Re-run tests on main after merge
7. Document in evidence ledger

#### Task 5.2: Archive Migration-Repair Work
**Decision:** Keep evidence, archive workflow-specific code

**Actions:**
```bash
# Keep:
- .agents/evidence/runs/migration-repair-20261011-143539-06936246/
- All evidence files (append-only, never delete)
- Gate patterns and workflow structure
- Final status report

# Archive (move to archive branch):
- Migration 0012 surgical fix scripts
- Duplicate detection SQL queries
- Drizzle-specific parsing logic

# Document in:
- .agents/evidence/migration-repair-assessment.md
```

### Phase 6: Final Certification (Day 8)

**Goal:** Evidence-backed certification

#### Task 6.1: Run Certification Checks

**Checklist:**
- [ ] All 25 requirements have status (VERIFIED/PARTIAL/MISSING/BLOCKED)
- [ ] R09, R14, R15 status upgraded from PARTIAL to VERIFIED
- [ ] Schema fix applied and tested (160/160 tests)
- [ ] E2E lifecycle demonstrated without mocks
- [ ] All evidence tied to correct commit SHAs
- [ ] No fabricated PASS results
- [ ] Security checks pass (RBAC, brand isolation)
- [ ] Documentation updated (not duplicated)
- [ ] Evidence ledgers append-only (no historical rewrites)

#### Task 6.2: Final Evidence Package

**Contents:**
```
.agents/evidence/final-integration/
  - reconciled-requirements-matrix.csv
  - branch-integration-log.md
  - test-execution-summary.json
  - e2e-lifecycle-evidence.md
  - schema-fix-verification.json
  - backend-integration-verification.json
  - certification-decision.json
```

**Certification Decision:**
```json
{
  "verdict": "CERTIFIED" | "CHANGES_REQUIRED" | "BLOCKED",
  "date": "2026-10-XX",
  "tested_commit_sha": "exact-40-char-sha",
  "requirements_verified": 20,
  "requirements_partial": 3,
  "requirements_blocked": 2,
  "test_results": {
    "total_suites": 15,
    "passed": 14,
    "failed": 0,
    "blocked": 1
  },
  "remaining_work": [...],
  "unresolved_risks": [...],
  "approval_required": [...]
}
```

---

## Part 7: Decision Matrix

### When to Use Each Option

**Option A (Fix & Merge canonical-wiring):**
✅ Use IF:
- Schema investigation (Phase 1 Task 1.3) confirms fix is straightforward
- All 160 tests pass after schema fix
- No logical conflicts with other branches
- Backend integrations (R09, R14, R15) verified on this branch

❌ Do NOT use IF:
- Schema fix requires breaking changes
- Other branches have newer implementations
- Backend routes still missing after schema fix
- E2E lifecycle has unresolved mocks

**Option B (Start Fresh from main):**
✅ Use IF:
- Branch reconciliation (Phase 1) shows irreconcilable conflicts
- Feature branches have too much duplicate/obsolete code
- main already has most critical features
- Risk of losing work is acceptable

❌ Do NOT use IF:
- Phase 1 shows valuable unique work in feature branches
- Time to re-implement is unacceptable
- Evidence trails would be lost

**Option C (Reconcile - RECOMMENDED):**
✅ Use ALWAYS as first step:
- Understand what exists before deciding
- Preserve all valuable work
- Make evidence-backed decisions
- Can transition to A or B after reconciliation

**Current Recommendation: C → Conditional A**
1. Complete Phase 1 (Reconciliation) FIRST
2. IF schema investigation confirms straightforward fix → Option A
3. ELSE continue with Phase 3-6 reconciliation approach

---

## Part 8: Immediate Next Steps

### TODAY (2026-10-12):

**Step 1: Check Schema Fix Workflow** ⏰ URGENT
```bash
# Determine status of wf_69e83a12839ed565
# If running: Pause for review
# If completed: Review changes before ANY merge
# If failed: Investigate why

# Command (if workflow tools available):
inspect_workflow wf_69e83a12839ed565
```

**Step 2: Commit W0 Evidence**
```bash
git add .agents/evidence/w0-baseline-audit/
git add .agents/evidence/w0-baseline-audit/COMPLETE-ROADMAP.md
git commit -m "docs: W0 baseline audit + complete roadmap"
git push origin project-llm-e2e-implementation
```

**Step 3: Create Phase 1 Work Branch**
```bash
git checkout main
git checkout -b w1-reconciliation
# All Phase 1 work happens here (read-only investigation)
```

**Step 4: Launch Phase 1 Agents**
```
Parallel (all read-only):
- Agent A: Branch ownership matrix
- Agent B: Requirements reconciliation
- Agent C: Schema investigation
- Agent D: Lifecycle E2E trace
- Agent E: Test framework audit
- Agent F: Architecture validation

Expected Duration: 4-6 hours
Deliverables: 6 reports (see Phase 1 tasks above)
```

### TOMORROW (2026-10-13):

**Review Phase 1 Results Together**
- Reconciled requirements matrix
- Branch ownership decisions
- Schema fix proposal
- Backend integration gaps identified
- Test standards established

**Decide:**
- Continue with Option C (recommended)
- Or pivot to Option A if schema fix is validated

**Then Launch Phase 2-3**
- Schema fix (if Option C → A)
- Backend integration
- All on isolated branches with full testing

---

## Part 9: Risk Assessment

### HIGH Risks

**Risk H1: Schema Fix Breaks Something**
- **Probability:** Medium
- **Impact:** High (blocks merge of most advanced branch)
- **Mitigation:**
  - Phase 1 Task 1.3 (thorough investigation)
  - Test in isolated database only
  - Independent review before merge
  - Rollback plan documented

**Risk H2: Backend Routes Not Actually Missing**
- **Probability:** Medium (W0 audit was read-only)
- **Impact:** Medium (wasted implementation effort)
- **Mitigation:**
  - Phase 1 Task 1.2 (requirements audit with code search)
  - Check all branches, not just main
  - Grep for route definitions before implementing

**Risk H3: Merging Loses Work from Other Branches**
- **Probability:** High if Option A used prematurely
- **Impact:** High (weeks of work lost)
- **Mitigation:**
  - ALWAYS do Phase 1 reconciliation first
  - Branch ownership matrix prevents loss
  - Sequential merge with verification

### MEDIUM Risks

**Risk M1: Tests Pass Locally But Fail in CI**
- **Probability:** Medium
- **Impact:** Medium (delays integration)
- **Mitigation:**
  - Phase 4 runs full test suite
  - Capture environment differences
  - Test on clean checkout

**Risk M2: E2E Lifecycle Has More Mocks Than Expected**
- **Probability:** Medium
- **Impact:** Medium (not truly end-to-end)
- **Mitigation:**
  - Phase 1 Task 1.4 explicitly identifies mocks
  - Phase 4 Task 4.2 requires real execution
  - Document remaining stubs clearly

**Risk M3: Evidence Files Become Too Large**
- **Probability:** Low
- **Impact:** Medium (git performance)
- **Mitigation:**
  - Use Git LFS for large logs
  - Compress old evidence
  - Link to GitHub Actions artifacts instead of committing raw logs

### LOW Risks

**Risk L1: Date Inconsistencies in Reports**
- **Probability:** High (already observed)
- **Impact:** Low (cosmetic)
- **Mitigation:**
  - Phase 1 Task 1.2 fixes dates
  - Use UTC timestamps consistently

**Risk L2: Branch Naming Confusion**
- **Probability:** Medium
- **Impact:** Low (documentation issue)
- **Mitigation:**
  - Clear branch naming in roadmap
  - Update branch descriptions on GitHub

---

## Part 10: Success Criteria

### Phase 1 Success (Reconciliation Complete)
- [ ] All 6 branches analyzed with ownership matrix
- [ ] Requirements matrix reconciled (no contradictions)
- [ ] Schema fix proposal approved
- [ ] E2E lifecycle gaps identified
- [ ] Test standards documented
- [ ] Architecture boundaries verified
- [ ] Decision made: Continue with C, or pivot to A/B

### Phase 2 Success (Schema Fixed)
- [ ] Schema proposal implemented
- [ ] All 160 tests pass on canonical-wiring
- [ ] Authorization prevents cross-brand access
- [ ] Migration tested in isolated database
- [ ] Evidence complete (logs, exit codes, commit SHA)
- [ ] Independent review: APPROVED

### Phase 3 Success (Backend Complete)
- [ ] R09 status: PARTIAL → VERIFIED (upload backend works)
- [ ] R14 status: PARTIAL → VERIFIED (approval enforced)
- [ ] R15 status: PARTIAL → VERIFIED (repository writes work)
- [ ] Tests cover all new code
- [ ] No security gaps in authorization

### Phase 4 Success (E2E Verified)
- [ ] Full test suite passes
- [ ] E2E lifecycle demonstrated WITHOUT mocks
- [ ] All stubs/skips explicitly documented
- [ ] Evidence tied to correct commit SHA

### Phase 5 Success (Integration Complete)
- [ ] Canonical-wiring merged to main
- [ ] Backend integration merged
- [ ] All tests still pass on main
- [ ] No work lost from other branches
- [ ] Evidence ledgers updated

### Phase 6 Success (Certification)
- [ ] 20+ requirements VERIFIED (target: 80%)
- [ ] 3 or fewer PARTIAL (acceptable gap)
- [ ] 0 MISSING on critical path
- [ ] E2E lifecycle certified
- [ ] Evidence package complete
- [ ] Final certification decision: CERTIFIED or CHANGES_REQUIRED

---

## Appendix A: File Reference Index

### W0 Audit Files
| File | Purpose | Size | Status |
|------|---------|------|--------|
| `w0-summary.md` | Executive summary | ~50KB | ✅ Complete |
| `branch-audit.json` | Technical branch data | ~200KB | ✅ Complete |
| `branch-audit-summary.md` | Human-readable branch analysis | ~30KB | ✅ Complete |
| `requirements-matrix.json` | Req-to-code mapping | ~150KB | ⚠️ Needs reconciliation |
| `requirements-matrix.csv` | Same, CSV format | ~50KB | ⚠️ Needs reconciliation |
| `requirements-matrix-summary.md` | Human-readable | ~40KB | ⚠️ Needs reconciliation |
| `implementation-inventory.json` | Capability assessment | ~100KB | ✅ Complete |
| `migration-repair-assessment.md` | Migration-repair analysis | ~80KB | ✅ Complete |
| `canonical-docs-map.json` | 51 authoritative docs | ~120KB | ✅ Complete |

### Evidence Ledgers
| File | Type | Last Updated | Entries |
|------|------|--------------|---------|
| `agent-runs.jsonl` | Append-only | 2026-10-12 06:53 | ~500+ |
| `evidence.jsonl` | Append-only | 2026-10-08 23:17 | ~300+ |
| `gate-results.jsonl` | Append-only | 2026-10-08 19:33 | ~50+ |
| `test-results.jsonl` | Append-only | 2026-10-08 19:33 | ~100+ |

### Recent Task Files (Top 20)
| File | Type | Date | Purpose |
|------|------|------|---------|
| `commit-wiring-review.md` | Review | 2026-10-11 | Commit message wiring review |
| `commit-wiring-plan.md` | Plan | 2026-10-11 | Wiring implementation plan |
| `stage5-fixes-plan.md` | Plan | 2026-10-11 | HIGH severity fixes plan |
| `gate-g-review.md` | Gate | 2026-10-10 | Publication gate review |
| `gate-g-final-report.md` | Gate | 2026-10-10 | Publication decision |
| `gate-f-schema-fix-report.md` | Gate | 2026-10-10 | Schema issue diagnosis |
| `gate-f-final-review.md` | Gate | 2026-10-10 | Final integration review |
| `gate-e2-final-review.md` | Gate | 2026-10-10 | Policy integration review |
| `gate-e1-final-review.md` | Gate | 2026-10-10 | Authorization review |

---

## Appendix B: Command Reference

### Check Workflow Status
```bash
# If workflow tools available:
inspect_workflow wf_69e83a12839ed565

# If need to abort:
update_workflow wf_69e83a12839ed565 abort

# Check running processes:
list_processes
```

### Git Commands
```bash
# Check current branch and status
git branch
git status

# List all branches with last commit
git branch -v

# Check specific branch without switching
git log m2-project-ai-canonical-wiring -1

# View branch differences
git diff main..m2-project-ai-canonical-wiring --stat
```

### Test Commands (from package.json and pytest)
```bash
# TypeScript discovery tests
cd packages/project-llm-discovery
pnpm test

# Python backend tests
cd services/project-ai
pytest tests/ -v

# Specific test file
pytest tests/integration/test_w2_contract_generation.py -v

# E2E tests (if available)
pnpm test:e2e
```

### Evidence Collection
```bash
# Recent evidence files
Get-ChildItem -Path .agents/evidence -Recurse | 
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-4) } |
  Sort-Object LastWriteTime -Descending

# Validate JSONL files
Get-Content .agents/evidence/agent-runs.jsonl | ForEach-Object { 
  $_ | ConvertFrom-Json 
} | Measure-Object

# Check evidence integrity
python .agents/scripts/verify-migration-fix.py
```

---

## Appendix C: Contact Points & Approvals

### Required Approvals

**Schema Changes:**
- [ ] Database schema owner
- [ ] Security reviewer
- [ ] Product owner (if affects data model)

**Backend API Changes:**
- [ ] API contract owner
- [ ] Security reviewer (if auth changes)
- [ ] Frontend team (for contract compatibility)

**Branch Merges:**
- [ ] Code owner of target branch
- [ ] Independent reviewer
- [ ] CI checks must pass
- [ ] Evidence must be complete

**Final Certification:**
- [ ] Human Architecture Authority
- [ ] Product owner
- [ ] All mandatory gates PASS

### Escalation Path

**Technical Blocker:**
1. Document in `.agents/evidence/blockers/`
2. Create GitHub issue with "blocker" label
3. Notify team lead

**Architectural Decision:**
1. Document options with evidence
2. Present to Architecture Authority
3. Record decision in governance docs

**Security Concern:**
1. Immediate escalation
2. No merge until resolved
3. Document in security audit log

---

## End of Roadmap

**Next Action:** Wait for user decision on:
1. Check schema fix workflow status
2. Confirm Option C approach
3. Launch Phase 1 reconciliation

**Do NOT proceed with ANY merges, schema changes, or destructive operations until user confirms approach.**
