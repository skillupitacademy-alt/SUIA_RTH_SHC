# Project LLM Schema Integration - Multi-Agent Workflow Plan

**Branch:** `feature/patch-blocks-schema-integration`  
**Date:** 2026-10-30  
**Objective:** Implement PATCH_BLOCKS_SCHEMA capability with full verification

---

## Workflow Architecture

### Phase 1: SEQUENTIAL - Schema Contract Investigation (Pre-Implementation Audit)
**Agent:** `wf-planner` (Investigation & Architecture)  
**Duration:** ~30 min  
**Blocking:** Must complete before Phase 2

**Tasks:**
1. Read all 18 identified files completely (no partial reads)
2. Verify package dependencies: packages/types ↔ packages/ui
3. Identify actual schema consumers (save/publish paths)
4. Trace TutorialBlockSchema usage across codebase
5. Verify ObjectiveO1Schema vs ObjectiveO1BlockSchema naming
6. Map existing documentation structure
7. Identify canonical schema location (types vs ui)
8. Document schema export contract
9. Report conflicts with supplied guides
10. Produce: **Schema Contract Report** with approved canonical path

**Output Artifact:** `.agents/tasks/schema-contract-audit-report.md`

---

### Phase 2: PARALLEL - Core Implementation (3 parallel agents)

#### Agent 2A: `wf-coder` - Patcher & Enum Implementation
**Duration:** ~45 min  
**Depends on:** Phase 1 (Schema Contract Report)

**Tasks:**
1. Add `PATCH_BLOCKS_SCHEMA` to `PlacementFileAction` enum
2. Implement `patch_blocks_schema()` function in patcher.py
3. Follow existing patcher patterns (idempotent, fail-closed)
4. Handle import statements (alphabetically sorted)
5. Handle re-export statements
6. Handle z.union([...]) member insertion
7. Duplicate detection with PatchError
8. Pre-condition validation
9. Preserve existing union members
10. Produce: **Patcher Implementation** with inline docs

**Files Modified:**
- `services/project-ai/app/models/candidate.py`
- `services/project-ai/app/placement/patcher.py`

---

#### Agent 2B: `wf-coder` - Comparator & Operation Generation
**Duration:** ~40 min  
**Depends on:** Phase 1 (Schema Contract Report)

**Tasks:**
1. Update `derive_file_operations()` in comparator.py
2. Add blocks_schema_rel_path constant
3. Generate PATCH_BLOCKS_SCHEMA operation
4. Extract schema filename from integration_metadata
5. Derive schema export name from family/version
6. Include expected_pre_hash validation
7. Set patch_strategy = "UNION_MEMBER"
8. Fix schema file path (packages/types NOT packages/ui)
9. Validate integration_metadata contract
10. Produce: **Comparator Enhancement** with operation generation

**Files Modified:**
- `services/project-ai/app/placement/comparator.py`

---

#### Agent 2C: `wf-coder` - Executor & Dispatch Integration
**Duration:** ~50 min  
**Depends on:** Phase 1 (Schema Contract Report)

**Tasks:**
1. Import `patch_blocks_schema` in executor.py
2. Add `PATCH_BLOCKS_SCHEMA` dispatch branch
3. Validate target file exists (fail if missing)
4. Enforce mandatory expected_pre_hash check
5. Validate current hash matches expected_pre_hash
6. Extract schema metadata from integration_metadata
7. Call patch_blocks_schema() with validated params
8. Add patched content to staged_writes
9. Include in changed-file tracking
10. Preserve atomic execution guarantees
11. Produce: **Executor Integration** with dispatch handler

**Files Modified:**
- `services/project-ai/app/placement/executor.py`

---

### Phase 3: SEQUENTIAL - Test Implementation & Validation
**Agent:** `wf-coder` (Testing Specialist)  
**Duration:** ~60 min  
**Depends on:** Phase 2 (All parallel agents complete)

**Tasks:**
1. Extend `test_file_operations_placement.py`
2. Add patcher unit tests (8 test cases)
3. Add comparator operation generation tests
4. Add executor dispatch tests
5. Add idempotency tests
6. Add failure scenario tests (missing target, stale hash)
7. Add duplicate detection tests
8. Run Python test suite
9. Verify all tests pass
10. Produce: **Test Evidence Report**

**Files Modified:**
- `services/project-ai/tests/test_file_operations_placement.py`

---

### Phase 4: PARALLEL - Verification & Documentation (2 parallel agents)

#### Agent 4A: `wf-design` - Schema Contract Resolution
**Duration:** ~30 min  
**Depends on:** Phase 3 (Tests passing)

**Tasks:**
1. Create/move canonical schema to packages/types
2. Verify schema export name matches patcher expectations
3. Update imports in blocks.schema.ts
4. Add ObjectiveO1BlockSchema to union
5. Run TypeScript type-check
6. Verify schema compiles
7. Test schema accepts valid O1 payload
8. Test schema rejects invalid O1 payload
9. Produce: **Schema Integration Evidence**

**Files Modified:**
- `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts` (new/moved)
- `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`

---

#### Agent 4B: `wf-design` - Documentation & Architecture Update
**Duration:** ~25 min  
**Depends on:** Phase 3 (Tests passing)

**Tasks:**
1. Update existing placement documentation
2. Document PATCH_BLOCKS_SCHEMA capability
3. Update workflow lifecycle docs (if needed)
4. Document schema contract decisions
5. Update integration guide
6. Document testing strategy
7. Create implementation summary
8. Produce: **Documentation Updates**

**Files Modified:**
- Existing architecture/placement docs (TBD based on repo structure)

---

### Phase 5: SEQUENTIAL - End-to-End Integration Test
**Agent:** `bundled://investigate` (E2E Validation)  
**Duration:** ~40 min  
**Depends on:** Phase 4 (Both parallel agents complete)

**Tasks:**
1. Simulate candidate upload with ObjectiveO1
2. Verify manifest contains PATCH_BLOCKS_SCHEMA operation
3. Verify operation has correct target_path
4. Verify operation has expected_pre_hash
5. Trace operation through executor
6. Verify worktree isolation works
7. Verify commit includes schema changes
8. Verify no main branch contamination
9. Inspect diff for correctness
10. Produce: **E2E Integration Evidence**

**Output Artifact:** `.agents/tasks/e2e-integration-test-report.md`

---

### Phase 6: SEQUENTIAL - Final Review & Merge Readiness
**Agent:** `wf-code-reviewer` (Quality Gate)  
**Duration:** ~30 min  
**Depends on:** Phase 5 (E2E validation complete)

**Tasks:**
1. Review all code changes
2. Verify no main branch modifications
3. Check all files on feature branch
4. Verify atomic commit structure
5. Review test coverage
6. Check documentation completeness
7. Verify schema location is canonical
8. Verify no reverse dependencies introduced
9. Check for security issues
10. Produce: **Final Review Verdict**

**Output Artifact:** `.agents/tasks/final-review-verdict.md`

---

## Workflow Execution Strategy

### Sequential Dependencies
```
Phase 1 (Investigation)
    ↓
Phase 2 (Implementation) - 3 parallel agents
    ↓
Phase 3 (Testing)
    ↓
Phase 4 (Verification) - 2 parallel agents
    ↓
Phase 5 (E2E Testing)
    ↓
Phase 6 (Final Review)
```

### Parallel Execution Groups

**Group A (Phase 2):** Can run simultaneously
- Agent 2A: Patcher + Enum
- Agent 2B: Comparator
- Agent 2C: Executor

**Group B (Phase 4):** Can run simultaneously
- Agent 4A: Schema Resolution
- Agent 4B: Documentation

---

## Success Criteria Checklist

### Code Quality
- [ ] PATCH_BLOCKS_SCHEMA enum added
- [ ] patch_blocks_schema() implemented with fail-closed design
- [ ] Comparator generates operation correctly
- [ ] Executor dispatches operation with safety checks
- [ ] All Python tests pass
- [ ] TypeScript builds successfully
- [ ] Schema validates O1 payloads

### Safety & Governance
- [ ] No changes to main branch
- [ ] Isolated worktree execution preserved
- [ ] Pre-image hash validation enforced
- [ ] Approval checks intact
- [ ] Atomic placement behavior maintained
- [ ] Idempotent operation verified

### Documentation & Evidence
- [ ] Schema contract documented
- [ ] Implementation guide updated
- [ ] Test evidence captured
- [ ] E2E integration verified
- [ ] Final review completed
- [ ] Merge readiness confirmed

---

## Rollback Strategy

If any phase fails:
1. Stop workflow immediately
2. Do NOT merge to main
3. Report failure details
4. Keep feature branch for debugging
5. User approves next action

---

## Estimated Total Duration

- Phase 1: 30 min
- Phase 2: 50 min (parallel)
- Phase 3: 60 min
- Phase 4: 30 min (parallel)
- Phase 5: 40 min
- Phase 6: 30 min

**Total: ~4 hours** (sequential execution would be ~5.5 hours)

---

## Git Branch Safety

**Current Branch:** `feature/patch-blocks-schema-integration`  
**Protected Branch:** `main` (no modifications allowed)  
**Merge Strategy:** User approval required after Phase 6 success

All work isolated to feature branch until user authorizes merge.
