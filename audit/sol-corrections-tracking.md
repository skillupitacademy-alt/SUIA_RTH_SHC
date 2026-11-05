# Sol Corrections Tracking

Review document: audit/W1_W3_Sol_Sonnet_Handover_Feedback_9ed39f2d.md
Reviewed HEAD: 9ed39f2d
Current HEAD: 23a723e7 (includes FND16 draft that needs correction)

## Priority 1 Corrections

### 1. FND13 HTTP Attribution ❌ NOT STARTED
- PROBLEM: placement-http-truth.test.ts tests helper layer with mocked adapters, NOT HTTP authorization
- REQUIRED: Correct handoff heading and commit 4dc2dd20 language to "helper-layer evidence"
- KEEP: Fallback/calibration and public response compatibility as unresolved
- ADD: Note that actual isolated HTTP caller requires declared manifest
- FILES: audit/W1_W3_Terra_Consolidated_Handoff.md, commit message language

### 2. FND16 Server Contracts ❌ NOT STARTED
- PROBLEM: Draft assumes HTTP OK cannot confirm persistence
- EVIDENCE: enquiries/[id]/route.ts DOES await db.transaction, returns updated:true/detail with 200
- REQUIRED: Revert EnquiryEditForm changes OR replace with source-backed contract evidence
- REQUIRED: Distinguish committed server success vs async work vs rejection vs unknown transport
- DO NOT: Add automatic auth retries or alter login/signup from generic assumption
- FILES:
  - apps/skillup-admin/src/components/crm/EnquiryEditForm.tsx (revert to 9ed39f2d version)
  - apps/skillup-admin/src/components/crm/__tests__/fnd16-forms-acknowledgement.test.tsx (remove or update)
  - audit/W1_W3_FND16_Form_Action_Inventory_And_Persistence_Manifest.md (correct)

### 3. SkillUp-admin Scope ❌ NOT STARTED
- PROBLEM: EnquiryEditForm is SkillUp-admin CRM runtime, NOT in assignment scope
- SCOPE: Assignment permits admission/email consumer inspection and isolated tests ONLY
- REQUIRED: Supply exact root-cause evidence, manifest and proposed contract for Sol disposition BEFORE treating as authorized
- ALLOWED: Independent in-scope FND16 marketing work may continue
- ACTION: Remove EnquiryEditForm from FND16 work OR create explicit manifest for Sol review

## Priority 2 Corrections

### 4. Reconcile Existing Fixes ❌ NOT STARTED
- PROBLEM: Terra's 1e4fde2a already added StrictMode visit, 347ebacd already keyed report by examId
- ISSUE: Sonnet b5a4e05d changes visit scheduling again, c16ad550 adds duplicate loadedExamId
- REQUIRED: Reconcile existing fix, retain ONE readable identity-reset mechanism
- REQUIRED: Prove retry/cancellation behavior
- REQUIRED: Run combined provider suite and deferred transition controls
- FILES: Check lifecycle and report files for duplicate mechanisms

### 5. Evidence Portability ❌ NOT STARTED
- MISSING FILES:
  - audit/Claude_Sonnet45_W1_W3_Detailed_Implementation_Handover_a239ca39.md
  - audit/W1_W3_FND15_Certificate_Verification_Authority_Manifest.md
  - audit/W1_W3_FND15_Project_LLM_Governance_Truth_Manifest.md
- WHITESPACE: git diff --check a239ca39..9ed39f2d FAILS (25 trailing whitespace issues)
- REQUIRED: Fix branch-range whitespace
- REQUIRED: Record working tree state

### 6. Certificate Test Qualification ❌ NOT STARTED
- ISSUE: Some tests mock SQL operators and assert operator called
- REQUIRED: Keep limits in findings - characterizes query construction/mapper, NOT real deleted-row filtering
- FILES: Check certificate test files and their documentation

## Combined Provider Run
- Sol's six-file provider run did NOT complete
- REQUIRED: Reproduce wider selection with bounded runner timeout
- REQUIRED: Diagnose outstanding timers or deferred transport

## Success Criteria
- [ ] FND13 attribution corrected to helper-layer evidence
- [ ] FND16 draft reverted OR replaced with source-backed contract evidence
- [ ] SkillUp-admin CRM scope removed or manifested
- [ ] Terra's existing fixes reconciled
- [ ] Missing manifest files added or references corrected
- [ ] Whitespace fixed in branch range a239ca39..HEAD
- [ ] Certificate test limitations documented
- [ ] Working tree state recorded
- [ ] Combined provider suite reproduces with timeout

## Implementation Plan
1. Revert FND16 EnquiryEditForm changes (commit 23a723e7)
2. Fix whitespace in placement-http-truth.test.ts and integration-certification-truth.test.tsx
3. Correct FND13 attribution in handoff document
4. Add or correct missing manifest file references
5. Review and reconcile duplicate fix mechanisms
6. Document certificate test limitations
7. Record working tree state
8. Run combined provider suite
9. Commit corrections in logical groups
