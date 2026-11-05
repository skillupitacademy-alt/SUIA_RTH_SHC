# Sol Corrections Applied - Summary

**Final HEAD:** 76713132  
**Review Baseline:** 9ed39f2d (Sol review document)  
**Implementation Baseline:** a239ca39 (handover baseline)  
**Date:** 2026-11-05  
**Review Document:** audit/W1_W3_Sol_Sonnet_Handover_Feedback_9ed39f2d.md

## Sol Disposition: PARTIAL → Corrections Required

Sol's feedback required corrections before group acceptance. This document records all corrections applied.

## Priority 1 Corrections Applied

### ✅ 1. FND13 HTTP Attribution Corrected (Commits: 7e050c4f)

**Problem:** placement-http-truth.test.ts tests helper layer (getSkillupPlacement with mocked adapters), NOT HTTP authorization

**Solution:**
- Updated FND13 section in W1_W3_Terra_Consolidated_Handoff.md
- Changed heading from "placement HTTP truth" to "placement helper-layer evidence"
- Added explicit statement: "These tests characterize helper behavior with mocked adapters, NOT HTTP authentication, authorization or route handler composition"
- Kept fallback/calibration and public response compatibility as unresolved
- Added note that actual isolated HTTP caller composition requires declared manifest
- Updated commit reference from original 3d5de543 to rewritten 068fa5af

**Principle Applied:** Passing a descriptive test of an existing fabricated match cannot accept that behavior

### ✅ 2. FND16 Server Contracts / Scope Violation Corrected (Commits: 9a107c39)

**Problem:**
- Draft assumed HTTP OK cannot confirm persistence without evidence
- EnquiryEditForm is SkillUp-admin CRM runtime, NOT in assignment scope

**Solution:**
- Inspected actual server contract: `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/route.ts` DOES await `db.transaction`, returns `{updated: true, detail}` with HTTP 200
- Removed EnquiryEditForm from FND16 implementation (out of scope)
- Updated FND16 manifest with server contract inspection principle
- Documented EnquiryEditForm as out-of-scope, requiring explicit manifest
- Added distinction: committed server success vs async work vs rejection vs unknown transport
- Completed in-scope RTH newsletter work only

**Files Changed:**
- apps/realtutorialhub-site/components/footer/FooterBrand.tsx (removed fabricated subscription)
- apps/realtutorialhub-site/components/footer/__tests__/newsletter-truth.test.tsx (NEW)
- audit/FND16_Form_Action_Inventory_And_Persistence_Manifest.md (corrected scope, added contract principle)

### ✅ 3. SkillUp-admin Scope Made Explicit (Commits: 9a107c39, 41095842)

**Problem:** EnquiryEditForm runtime edit is different CRM path, requires explicit authorization

**Solution:**
- Marked EnquiryEditForm as OUT OF SCOPE in FND16 manifest
- Documented that SkillUp-admin CRM runtime changes require explicit root-cause evidence, manifest and Sol disposition
- Assignment permits admission/email consumer inspection and isolated tests ONLY
- Independent in-scope FND16 marketing work (RTH newsletter) continues

## Priority 2 Corrections Applied

### ⚠️ 4. Reconcile Existing Fixes - NOT COMPLETED

**Status:** DEFERRED pending combined provider suite run

**Problem:** Terra's 1e4fde2a already added StrictMode visit, 347ebacd already keyed report by examId. Sonnet b5a4e05d/c16ad550 may add duplicate mechanisms.

**Required Actions (Outstanding):**
- Reconcile existing fix, retain ONE readable identity-reset mechanism
- Prove retry/cancellation behavior
- Run combined provider suite and deferred transition controls before claiming changed scheduling necessary

**Note:** Commits b5a4e05d and c16ad550 remain in history (from before Sol feedback) but reconciliation deferred pending broader provider run

### ✅ 5. Evidence Portability Corrected (Commits: 41095842, 76713132)

**Missing Files Addressed:**

1. **audit/Claude_Sonnet45_W1_W3_Detailed_Implementation_Handover_a239ca39.md**
   - Action: Removed reference from FND16 manifest
   - Replaced with actual existing documents

2. **audit/W1_W3_FND15_Certificate_Verification_Authority_Manifest.md**
   - Action: Updated reference to commit 178ad8b4 with "test file serves as manifest"
   - Commit message and test file contain actual scope/limitations

3. **audit/W1_W3_FND15_Project_LLM_Governance_Truth_Manifest.md**
   - Action: Updated reference to commit 178ad8b4 with "test files serve as manifest"
   - Commit message and test files contain actual scope/limitations

**Whitespace:**
- Fixed committed trailing whitespace in placement-http-truth.test.ts and integration-certification-truth.test.tsx (Commit: 44d3ac1e)
- Fixed new trailing whitespace in newsletter-truth.test.tsx, FND16 manifest, working tree state doc (Commit: 76713132)
- **Verified:** `git diff --check a239ca39..HEAD` exits 0

**Working Tree State:**
- Recorded in audit/W1_W3_Working_Tree_State_7e050c4f.md
- Documents untracked files (.claude/, .codex/, AGENTS.md, graphify-out/, etc.)
- Lists git state and next actions

### ✅ 6. Certificate Test Qualification Added (Commit: 41095842)

**Problem:** Some tests mock SQL operators and assert operator called

**Solution:** Added qualification to FND15 certificate section in handoff:
> "**Note:** Some tests mock SQL operators and assert operator called (e.g., soft-delete injects empty result, checks isNull invoked) - these characterize query construction/mapper, NOT real deleted-row filtering or physical certificate authority."

**Principle Applied:** Keep limits in findings - test characterizes query construction/mapper behavior

## Combined Provider Run - NOT COMPLETED

**Status:** DEFERRED

**Required:**
- Reproduce wider selection with bounded runner timeout
- Diagnose outstanding timers or deferred transport
- Sol's six-file provider run with package config and absolute offline guard did NOT complete during review

**Note:** Eight-test lifecycle result completed independently

## Commit History Summary

```
76713132 style(audit): fix trailing whitespace in new files
41095842 docs(audit): correct missing manifest references and record working tree state
7e050c4f docs(audit): correct FND13 attribution to helper-layer evidence
9a107c39 fix(marketing): remove fabricated RTH newsletter subscription (FND16)
44d3ac1e style(test): remove trailing whitespace from certification control
178ad8b4 chore: FND15 remaining governance consumers and certificate authority truth
4b88c6cc docs(audit): record FND13 placement HTTP truth completion
068fa5af test(placement): add HTTP evidence and date truth controls (FND13)
c16ad550 fix(report): reset exam result state on examId change (FND14)
b5a4e05d fix(ui): emit initial block visit during StrictMode effect replay (FND07)
```

**Changes from original 9ed39f2d:**
- Rewritten history from c16ad550..HEAD to fix whitespace and apply corrections
- Original commits 3d5de543, 4dc2dd20, 9ed39f2d replaced with corrected versions
- New commit 23a723e7 (FND16 with EnquiryEditForm) was NOT pushed, removed during correction

## Success Criteria Status

| Criterion | Status |
|-----------|--------|
| FND13 attribution corrected to helper-layer evidence | ✅ DONE |
| FND16 draft reverted OR replaced with source-backed contract evidence | ✅ DONE (reverted EnquiryEditForm, kept in-scope RTH work) |
| SkillUp-admin CRM scope removed or manifested | ✅ DONE (marked out-of-scope, requires manifest) |
| Terra's existing fixes reconciled | ⚠️ DEFERRED (pending combined provider run) |
| Missing manifest files added or references corrected | ✅ DONE (references corrected to commits) |
| Whitespace fixed in branch range a239ca39..HEAD | ✅ DONE (exits 0) |
| Certificate test limitations documented | ✅ DONE |
| Working tree state recorded | ✅ DONE |
| Combined provider suite reproduces with timeout | ⚠️ NOT EXECUTED (deferred) |

## Outstanding Work

1. **Priority 1 Complete:** All three priority 1 corrections applied
2. **Priority 2 Partial:** Evidence portability and certificate qualifications done; fix reconciliation and combined provider run deferred
3. **Remaining Foundation Work:** All 30 tasks remain active pending Sol acceptance
4. **Next Steps:** Combined provider suite with bounded timeout, reconcile duplicate fix mechanisms, complete remaining FND01-FND30 work

## Verification Commands Used

All corrections verified with:
- `git diff --check a239ca39..HEAD` (whitespace)
- Test runners with offline guards
- TypeScript compilation checks
- Individual test file selections

## Notes

- No production traffic, live browser, or physical database used during corrections
- Mandatory offline guard preserved
- All failing security assertions preserved
- Branch `remediation/w1-2-batch-05-targeted` ahead of origin by 8 commits
- Not pushed (awaiting Sol review of corrections)
