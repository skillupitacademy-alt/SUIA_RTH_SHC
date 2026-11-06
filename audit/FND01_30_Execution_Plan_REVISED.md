# FND01-FND30 Execution Plan - REVISED with File Ownership & Dependencies

**Authority:** audit/Claude_Sonnet45_W1_W3_Completion_Directive.md
**Starting HEAD:** bb8eb7f7
**Branch:** remediation/w1-2-batch-05-targeted
**Date:** 2026-11-06
**Status:** FND01 investigation running, awaiting revised plan approval before concurrent writers

---

## Key Corrections from Original Plan

**Issues identified by Sol:**
1. ❌ FND13 and FND19 marked complete - actually need verification
2. ❌ No file ownership analysis - concurrent edits would conflict
3. ❌ Assumed W3 domains are independent - they share schemas/callers
4. ❌ Unsupported 75-120 hour estimate - needs actual dependency analysis
5. ❌ Workflow reviewers cannot assign task acceptance - only Sol can

**Corrected approach:**
1. ✅ FND13/FND19 remain OPEN pending verification
2. ✅ Exclusive file ownership assigned per workflow
3. ✅ Sequential chains identified for shared files
4. ✅ No time estimate until inventory complete
5. ✅ Workflow reviewers recommend, Sol accepts

---

## Current Verified Status

### FND13 - SkillUp Placement
**Status:** IMPLEMENTED_UNVERIFIED (not complete)
**Commit:** 1f06ae15
**Tests:** 13 passing helper-level tests
**Remaining:** Verify against latest calibration clarification (f4a9bac5)
**Files modified:**
- apps/skillup-web/src/lib/skillup-types.ts
- apps/skillup-web/src/lib/skillup-data.ts
- apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts
- apps/skillup-web/src/lib/__tests__/placement-zero-control.test.ts

### FND19 - Taxonomy Domain Validation
**Status:** BOUNDED_VERIFICATION (not complete)
**Commit:** 60684170 (Sol verified bounded scope)
**Tests:** 29 passing (2 domain route + 27 schema)
**Remaining:** Full taxonomy integration, actual callers, five-entity consolidation
**Files modified:**
- apps/skillhubcore-admin/src/schemas/hierarchy.schemas.ts (domain validation only)
**Not addressed:** Taxonomy service integration, canonical schema owner, cross-app callers

---

## File Ownership Analysis Required Before Concurrent Work

Cannot launch concurrent code-writing workflows until we know:

### Shared Files That Create Conflicts

**Schema files (multiple workflows will edit):**
- packages/db-people schemas (FND03, FND05, FND11, FND18)
- packages/db-placement schemas (FND13 verification)
- apps/skillhubcore-admin schemas (FND06, FND19 full, FND20, FND21)
- Event schemas (FND23)

**Service files (multiple workflows will edit):**
- services/project-ai (FND08, FND22)
- Identity/auth services (FND03, FND06, FND11, FND18)
- Progress/completion services (FND05, FND07)

**BFF/API routes (multiple workflows will call):**
- apps/skillup-web/src/app/api/* (FND13, FND14, FND16, FND24)
- apps/realtutorialhub-web routes (FND16, FND24)
- apps/skillhubcore-admin routes (FND06, FND15, FND24)

### Required Sequential Chains

**Chain 1: Identity & Ownership (must be sequential)**
1. FND03 ownership architecture → establishes tenant/subject contracts
2. FND18 identity contracts → depends on FND03 decisions
3. FND06 admin policy → depends on FND03 classification
4. FND05 progress identity → depends on FND03 mapping
5. FND04 export ownership → depends on FND03 boundaries

**Chain 2: Email & People (sequential)**
1. FND11 people projection → establishes email/identity uniqueness
2. FND16 forms/actions → depends on FND11 auth contracts
3. FND18 identity integration → depends on FND11 canonical identity

**Chain 3: W3 Contracts (NOT independent, share callers)**
1. FND18 identity → base for all resource access
2. FND19 taxonomy → depends on canonical schema owner decision
3. FND20 questions → depends on FND19 taxonomy, FND18 identity
4. FND21 documents → depends on FND19 taxonomy (subject/topic refs)
5. FND22 artifacts → depends on FND08 actors, FND18 identity
6. FND23 events → depends on FND18 tenant identity, FND03 ownership

**Chain 4: Truth Corrections (some parallel possible)**
- FND13 placement (verify only) - touches skillup-web/lib
- FND14 reports - touches src/share-branding, packages/ui
- FND15 SHC operational - touches skillhubcore-admin
- FND16 forms - touches marketing-site, app forgot-password pages
- FND12+17 inventory (read-only) - no code changes

---

## Isolation Options for Parallel Work

### Option 1: Single Code Writer (Safest)
- Only one implementation workflow active at a time
- No merge conflicts, no integration overhead
- Sequential execution through all tasks
- **Slowest but lowest risk**

### Option 2: Separate Worktrees (Medium Risk)
- Each parallel workflow gets its own worktree
- Integration owner merges sequentially
- Requires re-running tests after each merge
- **Medium speed, medium complexity**

### Option 3: Separate Branches (High Risk)
- Workflows on feature branches
- Integration merges after workflow complete
- High conflict risk if file ownership wrong
- **Faster but needs perfect ownership analysis**

### Recommended: Option 1 + Read-Only Parallelism
- Run multiple READ-ONLY workflows in parallel (investigations, inventories)
- Run only ONE code-writing workflow at a time
- Submit each for review before starting next
- Lower speed, but manageable complexity

---

## Revised Execution Phases

### Phase 1: Foundation (Sequential, Read-Only)

**Wave 1A: FND01 Finding Register** ✅ IN PROGRESS
- Workflow: investigate (wf_5a6075ccc9ddc4b8)
- Type: Read-only investigation
- Files: audit documents only
- No conflicts possible

**Wave 1B: FND02 Baseline** (after FND01)
- Workflow: investigate or wf-coder (test execution only)
- Type: Test execution + diagnosis
- Files: None (just runs existing tests)
- No conflicts possible

**Wave 1C: FND12+17 Inventory** (parallel with 1B)
- Workflow: wf-planner (read-only)
- Type: Coverage mapping
- Files: audit documents only
- No conflicts possible

### Phase 2: Critical Path Implementation (Sequential)

**Must run in this exact order (shared files):**

**FND03: Ownership Architecture** → schema/migration decisions
- Editable: db-people schemas, migration files, auth services
- Blocks: FND04, FND05, FND06, FND18
- Duration: Unknown until FND01 complete

**FND11: People Projection** → email/identity uniqueness
- Editable: db-people user tables, auth services, admission flows
- Blocks: FND16, FND18
- Duration: Unknown

**FND18: Identity Contracts** → canonical identity runtime
- Editable: Identity services, BFF boundaries, token validation
- Blocks: FND20, FND21, FND22, FND23, FND24
- Duration: Unknown

**FND04: Export Ownership** (after FND03)
- Editable: Workflow dispatch, job download, export services
- Blocks: None
- Duration: Unknown

**FND05: Progress Identity** (after FND03)
- Editable: Progress services, completion tracking, ILS persistence
- Blocks: FND24
- Duration: Unknown

**FND06: Admin Policy** (after FND03)
- Editable: Admin routes, user/question resource guards
- Blocks: FND15, FND24
- Duration: Unknown

### Phase 3: Truth & Security (Some Parallelism Possible)

**Can run in parallel (different app roots):**

**Branch A: SkillUp Truth**
1. FND13 verification (skillup-web)
2. FND14 reports (share-branding, packages/ui)

**Branch B: Other Apps**
1. FND15 SHC operational (skillhubcore-admin)
2. FND16 forms (marketing-site, app pages)

**Branch C: Client Security**
1. FND07 client isolation (packages/ui, service workers)
2. FND08 Project AI actors (services/project-ai)

**But FND24 integration cannot start until ALL truth work complete**

### Phase 4: W3 Contracts (Sequential Chain)

Must run in order due to shared schemas/callers:
1. FND19 taxonomy full integration (after FND18)
2. FND20 questions (after FND19, FND18)
3. FND21 documents (after FND19)
4. FND22 artifacts (after FND08, FND18)
5. FND23 events (after FND18, FND03)

### Phase 5: Integration & Gates (Sequential)

1. FND24 integration (after ALL implementations)
2. FND25 adverse tests (after FND24)
3. FND09 Gate 1 (after FND08 actors)
4. FND10 runtime readiness (after FND02-09)
5. FND26 static gates (after FND24)
6. FND27 quality review (after FND24)

### Phase 6: Closure (Sequential)

1. FND28 re-audit packets (after all implementation)
2. FND29 W4 entry (after FND28)
3. FND30 closure package (after FND29)

---

## Workflow Ownership Matrix (To Be Completed After FND01)

| Task | Editable Files | Blocks | Blocked By | Can Run Parallel With |
|------|---------------|--------|------------|---------------------|
| FND01 | audit/* (done) | All others | None | Any read-only |
| FND02 | None (test run) | FND25, FND26 | FND01 | FND12, FND17 |
| FND03 | db-people schemas, auth services | FND04-06, FND18 | FND01 | FND12, FND17 |
| FND04 | Export services, workflow dispatch | None | FND03 | FND05, FND06 (if isolated) |
| FND05 | Progress services, ILS | FND24 | FND03 | FND04, FND06 (if isolated) |
| FND06 | Admin routes, resource guards | FND15, FND24 | FND03 | FND04, FND05 (if isolated) |
| FND07 | UI components, service workers | FND24 | FND02 | FND08, FND15, FND16 |
| FND08 | services/project-ai | FND09, FND22 | FND03 (actors) | FND07, FND15, FND16 |
| FND09 | Gate approval service | FND10 | FND08 | None (touches workflow) |
| FND10 | audit/* (readiness docs) | Phase 6 | FND02-09 | None (summary) |
| FND11 | db-people users, auth, admission | FND16, FND18 | FND03 | None (touches identity) |
| FND12 | audit/* (inventory) | FND17 | FND01, FND13-16 impl | Any read-only |
| FND13 | skillup-web/lib/* | FND24 | FND01 (verify) | FND14 |
| FND14 | share-branding, packages/ui | FND24 | FND01 | FND13 |
| FND15 | skillhubcore-admin/* | FND24 | FND01, FND06 | FND07, FND08, FND16 |
| FND16 | marketing-site, app/**/forgot-password | FND24 | FND01, FND11 | FND07, FND08, FND15 |
| FND17 | audit/* (coverage) | Phase 5+ | FND01, FND12, impl | Any read-only |
| FND18 | Identity services, BFF | FND20-24 | FND03, FND11 | None (base contract) |
| FND19 | Taxonomy service, all callers | FND20, FND21, FND24 | FND18 | None (full integration) |
| FND20 | Question services, schemas | FND24 | FND18, FND19 | None (depends on taxonomy) |
| FND21 | Document schemas, storage | FND24 | FND18, FND19 | None (depends on taxonomy) |
| FND22 | Artifact services, evidence | FND24 | FND08, FND18 | None (depends on identity) |
| FND23 | Event services, analytics | FND24 | FND03, FND18 | None (depends on identity) |
| FND24 | All app BFFs, integration | FND25-27 | ALL impl tasks | None (integrates all) |
| FND25 | Test files (adverse) | FND26 | FND02, FND24 | None (needs all code) |
| FND26 | None (gate execution) | FND27-30 | FND24, FND25 | None (validates all) |
| FND27 | audit/* (quality review) | FND28 | FND24, FND26 | None (reviews all) |
| FND28 | audit/* (re-audit packets) | FND29 | FND01-27 | None (packages all) |
| FND29 | audit/* (W4 entry) | FND30 | FND28 | None (assesses all) |
| FND30 | audit/*, handoff consolidation | Completion | FND01-29 | None (final package) |

---

## Critical Path Analysis (After FND01 Complete)

**Longest sequential chain determines minimum time:**
FND01 → FND03 → FND11 → FND18 → FND19 → FND20 → FND24 → FND25 → FND26 → FND27 → FND28 → FND29 → FND30

**Parallelism opportunities (if using worktrees/branches):**
- FND04, FND05, FND06 can run in parallel after FND03 (if isolated)
- FND07, FND08, FND15, FND16 can run in parallel (different roots)
- FND13, FND14 can run in parallel (different roots)
- FND21, FND22, FND23 might run in parallel (need ownership analysis)

**But: Without isolation, only ONE code writer at a time is safe**

---

## Revised Execution Strategy

### Immediate Next Steps

1. ✅ FND01 investigation running (wf_5a6075ccc9ddc4b8)
2. ⏳ Await FND01 findings + reconciled count
3. ⏳ Launch FND02 baseline (test execution only, no conflicts)
4. ⏳ Launch FND12+17 inventory in parallel (read-only)
5. ⏳ Update ownership matrix with exact file paths from FND01
6. ⏳ Decide: Single writer vs worktrees vs branches
7. ⏳ Get Sol approval for revised approach
8. ⏳ Launch FND03 (first code writer on critical path)

### Workflow Launch Order (Single Writer, Recommended)

**Read-only phase (parallel):**
- FND01 ← running now
- FND02, FND12, FND17 ← after FND01

**Implementation phase (sequential):**
1. FND03 ownership
2. FND11 people
3. FND18 identity
4. FND04 exports (or continue critical path)
5. FND05 progress (or continue critical path)  
6. FND06 admin (or continue critical path)
7. FND13 verification
8. FND14 reports
9. FND15 SHC
10. FND16 forms
11. FND07 client
12. FND08 actors
13. FND09 gate
14. FND19 taxonomy
15. FND20 questions
16. FND21 documents
17. FND22 artifacts
18. FND23 events
19. FND24 integration
20. FND25 adverse
21. FND10 readiness
22. FND26 gates
23. FND27 quality
24. FND28 re-audit
25. FND29 W4
26. FND30 closure

**Duration: Unknown until FND01 inventory complete and dependencies mapped**

---

## Evidence Submission Protocol

### Each Workflow Submits

1. Implementation commits (specific SHAs)
2. Test evidence (exact commands + outputs)
3. File ownership declaration (what was edited)
4. Remaining work (what's still incomplete)
5. Dependencies (what must come next)

### Integration Owner (Claude Sonnet 4.5) Maintains

1. This execution plan (updated after each workflow)
2. Consolidated handoff (master status document)
3. FND01-30 ledger (task status matrix)
4. Finding register (from FND01)

### Sol Independently Reviews

1. Implementation behavior through actual callers
2. Test evidence against actual test files
3. Task completion vs original requirements
4. Group acceptance (G1-G9)
5. W1-W3 closure decision

**Workflow reviewers recommend acceptance. Sol assigns VERIFIED/CLOSED.**

---

## Offline Guards & Authorization Gates (All Workflows)

### Every Implementation Workflow Must

1. Use pre-import network guard (`vi.stubGlobal('fetch', ...)`)
2. Clear environment variables (DATABASE_URL, REDIS_URL, etc.)
3. Use isolated fixtures with mocked dependencies
4. Distinguish helper/HTTP/browser evidence layers
5. Document physical test prerequisites as open gates

### Separately Authorized Operations

1. Physical database tests (requires running stores)
2. Physical browser tests (requires browser environment)
3. Schema migrations (requires reviewed artifact + authorization)
4. Deployment operations (requires deployment plan + authorization)
5. Server restarts (requires ops authorization)

**Workflows prepare execution recipes. Owner authorizes actual execution.**

---

## Self-Corrections Applied

### What I Was Doing Wrong

1. ❌ Claiming FND13/FND19 complete when verification incomplete
2. ❌ Not analyzing file conflicts before proposing parallel work
3. ❌ Inventing completion time estimates without dependency data
4. ❌ Treating workflow reviewer verdicts as task acceptance
5. ❌ Generating workflows/documents instead of reconciling actual source
6. ❌ Not distinguishing isolated fixtures from physical guarantees
7. ❌ Over-stating investigation/helper tests as full implementation

### What I'm Doing Now

1. ✅ Marking FND13/FND19 as IMPLEMENTED_UNVERIFIED (open)
2. ✅ Building file ownership matrix before parallel proposals
3. ✅ No time estimate until FND01 inventory complete
4. ✅ Workflow reviewers recommend, Sol accepts
5. ✅ Starting with actual source reconciliation (FND01)
6. ✅ Documenting test evidence layers explicitly
7. ✅ Distinguishing implemented behavior from investigation

### Commitment Going Forward

- Reconcile current source BEFORE editing
- Use approved test recipes with exact commands
- Stage explicit paths only (never `git add .` or `-A`)
- Submit stable slices for independent review
- Treat failing controls as unfinished requirements
- Preserve existing correct behavior
- Match project's existing patterns and libraries

---

## Status Summary

**Current work:**
- FND01 investigation running (wf_5a6075ccc9ddc4b8)
- Execution plan revised with ownership analysis
- Awaiting FND01 findings to complete dependency matrix

**Ready for Sol approval:**
- Revised sequential approach with single code writer
- Parallel read-only work (inventories, investigations)
- File ownership matrix framework
- Evidence submission protocol

**Next after approval:**
- Launch FND02 baseline + FND12/17 inventory (parallel read-only)
- Complete ownership matrix with FND01 file paths
- Begin FND03 ownership architecture (first code writer)

**No unsupported claims:**
- Duration: Unknown (awaiting FND01 + dependency analysis)
- Completion: Only Sol can assign VERIFIED/CLOSED
- Parallelism: Needs ownership analysis + isolation decision
- Independence: W3 workflows share schemas/callers (not independent)

---

**Revised by:** Claude Sonnet 4.5
**Date:** 2026-11-06
**Awaiting:** Sol approval to proceed with revised sequential approach
