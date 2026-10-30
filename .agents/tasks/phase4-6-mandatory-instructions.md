# Phase 4-6 Mandatory Instructions

**Approved by User:** 2026-10-30  
**Scope:** Phases 4, 5, 6 on feature/patch-blocks-schema-integration branch

---

## ✅ Phases Approved to Proceed

| Phase | Status | Approval |
|-------|--------|----------|
| Phase 4 — Documentation | Proceed | ✅ Approved |
| Phase 5 — E2E test-loop | Proceed | ✅ Approved |
| Phase 6 — Review-loop | Proceed | ✅ Approved |

---

## 🔒 12 Mandatory Instructions

### 1. Branch Isolation
**RULE:** Work exclusively on `feature/patch-blocks-schema-integration`.  
**FORBIDDEN:** Do not modify main or running production application.

### 2. Preserve Existing Implementation
**RULE:** All Phase 2 code is approved and must not be recreated.  
**PRESERVE:** Patcher, comparator, executor, enum functionality.

### 3. Documentation Updates Only
**RULE:** Update existing Markdown documentation where suitable.  
**FORBIDDEN:** Do not create duplicate documentation files.

### 4. Phase 5 Real Testing Requirements
**MUST VERIFY:**
- Actual Objective O1 ZIP from `E:\notes\Python\objective-o1.zip`
- Runtime Zod schema export validation
- Schema placement in correct location
- Import/re-export registration
- Union registration in TutorialBlockSchema
- Idempotency (repeated patching doesn't duplicate)
- Pre-image hash protection works
- TypeScript compilation succeeds

### 5. Schema Validation Testing
**MUST VERIFY:**
- Valid O1 payloads pass TutorialBlockSchema
- Invalid O1 payloads fail TutorialBlockSchema
- Test against canonical TutorialDocumentSchema

### 6. End-to-End Integration Testing
**MUST VERIFY:**
- Composer insertion works
- Save operation succeeds (actual API call)
- Database retrieval works
- Reopening saved content works
- Publish works (if environment supports)
- Learner-facing rendering works (if environment supports)

**REPORTING:** If any stage cannot be executed, report as **NOT VERIFIED**, not PASS.

### 7. Test Failure Investigation
**REQUIRED:** Investigate and document BOTH failures from 13/15 test result.  
**FORBIDDEN:** Do not suppress, bypass, or automatically classify as harmless.  
**REPORT:** Root cause, impact, and remediation for each failure.

### 8. Safety Guarantees Preserved
**MUST MAINTAIN:**
- Worktree isolation
- Approval gates
- Manifest integrity
- Evidence hashes

### 9. Phase 6 Review Scope
**MUST REVIEW:**
- Implementation correctness
- Security vulnerabilities
- Architectural boundaries
- Regression risks
- Test evidence completeness

### 10. Iteration Limits
**RULE:** Maximum 2 iterations per approved test/review loop.  
**IF BLOCKER REMAINS:** Report it rather than making uncontrolled changes.

### 11. No Automatic Merge
**FORBIDDEN:** Do not automatically merge, deploy, certify, or modify production.  
**STOP AT:** Final merge-readiness report for human review.

### 12. Evidence Requirements
**MUST REPORT:**
- Exact branch name
- Commit SHA
- Files changed
- Tests executed (with commands)
- Pass/fail results (exact counts)
- Unresolved issues
- Evidence file locations

---

## 📋 Phase 5 Acceptance Criteria (Detailed)

### ZIP Analysis
- [ ] Extract E:\notes\Python\objective-o1.zip
- [ ] Verify all 6 files present
- [ ] Validate block.integration.json contract
- [ ] Confirm schema file is Zod schema (not TypeScript interface)
- [ ] Verify schema export name matches convention

### Schema Integration
- [ ] Schema placed in correct canonical location
- [ ] Import statement added to blocks.schema.ts
- [ ] Re-export statement added
- [ ] Schema added to z.union([...]) array
- [ ] No duplicate entries created

### Safety Validation
- [ ] Idempotency: Running twice produces same result
- [ ] Pre-image hash prevents concurrent modification
- [ ] Word-boundary regex prevents false matches
- [ ] TypeScript compiles without errors

### Runtime Validation
- [ ] Valid O1 block passes TutorialBlockSchema.parse()
- [ ] Invalid discriminator fails validation
- [ ] Invalid payload structure fails validation
- [ ] Existing schemas (I1, C1) still validate

### Composer Integration
- [ ] ObjectiveO1 appears in Composer dropdown
- [ ] Can insert O1 block into document
- [ ] Save button works (HTTP 200 response)
- [ ] Saved data persists to database
- [ ] Can retrieve and reopen saved document
- [ ] Publish works (if supported)
- [ ] Learner view renders correctly (if supported)

### Evidence Collection
- [ ] All test commands documented
- [ ] All HTTP responses captured
- [ ] Database queries logged
- [ ] TypeScript build output saved
- [ ] Error messages preserved

---

## 📊 Test Failure Investigation Requirement

**Current Status:** 13/15 tests passing, 2 failures

**REQUIRED INVESTIGATION:**

1. **Identify failing tests:**
   - Test name
   - Test file location
   - Failure message
   - Stack trace

2. **Categorize each failure:**
   - Pre-existing (not related to Phase 2/3 work)
   - Regression (caused by our changes)
   - Environmental (test infrastructure issue)

3. **Root cause analysis:**
   - Why did it fail?
   - What code is being tested?
   - Is it a real defect or test issue?

4. **Impact assessment:**
   - Does it block merge?
   - Does it affect PATCH_BLOCKS_SCHEMA functionality?
   - What's the risk if left unfixed?

5. **Remediation plan:**
   - How to fix (if needed)?
   - Can it be fixed in this PR?
   - Should it be tracked separately?

---

## 🎯 Final Deliverables

### Required Reports
1. ✅ Updated existing documentation (not new duplicates)
2. ✅ Phase 5 execution and test evidence
3. ✅ Phase 6 security and architecture review
4. ✅ Explanation of TWO previously failing tests
5. ✅ Remaining defects and risks
6. ✅ Final merge-readiness report
7. ✅ Explicit recommendation: **READY** or **NOT READY**

### Evidence Bundle Must Include
- Exact commit SHA
- Branch name verification
- Files changed (with line counts)
- Test execution logs
- Pass/fail breakdown
- TypeScript build output
- Composer API responses
- Database verification queries
- Unresolved issues list
- Risk assessment

---

## ⚠️ Critical Definition

**INTEGRATION IS NOT COMPLETE WHEN:**
- Block appears in Composer dropdown only
- Block shows in preview only
- Patcher tests pass only

**INTEGRATION IS COMPLETE WHEN:**
- All patcher tests pass ✓
- TypeScript compiles ✓
- Schema validates correctly ✓
- Composer insertion works ✓
- Save returns HTTP 200 ✓
- Data persists to database ✓
- Reopening works ✓
- Publish succeeds (if testable) ✓
- Learner view renders (if testable) ✓

---

## 🚫 Forbidden Actions

1. ❌ Modifying main branch
2. ❌ Recreating approved Phase 2 code
3. ❌ Creating duplicate documentation
4. ❌ Skipping tests due to time pressure
5. ❌ Marking "NOT VERIFIED" as "PASS"
6. ❌ Suppressing test failures
7. ❌ Automatic merge/deploy
8. ❌ Bypassing approval gates
9. ❌ Exceeding iteration limits without reporting
10. ❌ Claiming integration from patcher tests alone

---

## ✅ Success Criteria

**Phase 4:** Documentation updated, no duplicates created  
**Phase 5:** All acceptance criteria verified with evidence  
**Phase 6:** Complete review with READY/NOT READY recommendation

**Final Authority:** User approves merge after reviewing Phase 6 report.

---

**Timeline:** 75-minute ETA is an estimate, not a deadline that justifies skipping governance controls.
