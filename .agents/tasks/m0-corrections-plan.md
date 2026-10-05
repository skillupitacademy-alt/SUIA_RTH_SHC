# M0 CORRECTIONS PLAN

**Document Type:** Correction Plan  
**Date:** 2026-10-05  
**Purpose:** Precise correction plan to align `workflow.ts` with M0 canonical architecture  
**Status:** READY_FOR_IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

This plan addresses the critical state name drift between the TypeScript workflow state machine (`packages/types/src/project-llm/workflow.ts`) and the M0 canonical architecture documents. The audit identified one **CRITICAL** state rename that MUST be applied (`REQUEST_CREATED → REQUESTED`), and zero additional renames confirmed by the canonical documents.

**Key Finding:** The M0 canonical architecture EXPLICITLY uses `REQUESTED` as the initial state throughout all four authority documents. However, the M0 Report provides a terminology mapping table stating "M0 does not change workflow runtime behavior" which creates ambiguity about whether the mapping is prescriptive (must be applied) or descriptive (documents current drift).

**Conservative Interpretation:** Only `REQUEST_CREATED → REQUESTED` is confirmed as a canonical requirement based on explicit usage in the lifecycle diagrams. The other proposed renames (BRIEF_READY → BRIEF_GENERATED, etc.) are NOT explicitly used in the canonical documents' lifecycle definitions, appearing only in the mapping table or in older superseded documents.

---

## CONFIRMED STATE RENAMES

### CRITICAL: REQUEST_CREATED → REQUESTED

**Justification:**
The M0 canonical architecture EXPLICITLY and CONSISTENTLY uses `REQUESTED` as the initial state:

1. **PROJECT_LLM_CANONICAL_ARCHITECTURE_V1.md** (Section 5, line 82-83):
   ```text
   REQUESTED
       ↓
   DISCOVERY
   ```

2. **PROJECT_LLM_MVP_IMPLEMENTATION_CONTRACT.md** (line 75-77):
   ```text
   REQUESTED
       ↓
   DISCOVERY
   ```

3. **PROJECT_LLM_M0_REPORT.md** (line 69):
   | REQUEST_CREATED | REQUESTED |

**Current Runtime State:**
- File: `packages/types/src/project-llm/workflow.ts`
- Line 24: `| 'REQUEST_CREATED'`
- Line 75: `REQUEST_CREATED: ['BRIEF_READY']`

**Impact:**
- M0 canonical documents define the lifecycle starting with `REQUESTED`
- Runtime code uses `REQUEST_CREATED`
- This is the ONLY state where the canonical documents explicitly use different terminology in their lifecycle diagrams (not just mapping tables)

**Resolution Required:**
Update runtime code to use `REQUESTED` to align with M0 canonical authority.

---

## RENAMES NOT CONFIRMED

The following proposed renames from the audit findings are **NOT CONFIRMED** by the canonical documents:

### 1. BRIEF_READY → BRIEF_GENERATED

**Status:** NOT CONFIRMED  
**Reason:** 
- M0 canonical lifecycle (CANONICAL_ARCHITECTURE_V1.md, line 84-87) uses: `DISCOVERY ↓ BRIEF_READY`
- The term `BRIEF_GENERATED` appears in older documents (`PROJECT_LLM_PHASE_1_IMPLEMENTATION_MASTER_PROMPT.md`) but NOT in M0 canonical lifecycle
- The M0 Report mapping table lists `BRIEF_READY` unchanged, not mapped to a new term

**Conclusion:** The canonical M0 lifecycle uses `BRIEF_READY`. No rename required.

### 2. HANDOFF_READY → HANDOFF_GENERATED

**Status:** NOT CONFIRMED  
**Reason:**
- M0 canonical lifecycle does not explicitly list a "HANDOFF_READY" or "HANDOFF_GENERATED" state
- The term `HANDOFF_MARKED_COMPLETE` appears in older workbench spec but not in M0 canonical lifecycle
- Current runtime uses `HANDOFF_READY` which is not contradicted by M0 documents

**Conclusion:** M0 does not specify this state explicitly. No rename confirmed.

### 3. CANDIDATE_READY → CANDIDATE_RECEIVED

**Status:** PARTIALLY CONFIRMED IN MAPPING TABLE ONLY  
**Reason:**
- M0 canonical lifecycle (CANONICAL_ARCHITECTURE_V1.md, line 92-95) uses: `CANDIDATE_REQUESTED ↓ CANDIDATE_RECEIVED`
- M0 Report mapping table (line 72): `CANDIDATE_READY | CANDIDATE_RECEIVED`
- However, the M0 Report explicitly states: "M0 does not change workflow runtime behavior. This is a canonical terminology mapping for architecture alignment."

**Ambiguity:** The mapping table suggests the rename, but the disclaimer says M0 does NOT change runtime behavior. The lifecycle diagram uses `CANDIDATE_RECEIVED` but the current runtime state `CANDIDATE_READY` may represent a different position in the flow.

**Conservative Conclusion:** Not confirmed as a required change in M0. This appears to be a deferred alignment task, not an M0 correction requirement.

### 4. AWAITING_GUI_APPROVAL → GUI_APPROVAL_PENDING or AWAITING_GATE_1

**Status:** NOT CONFIRMED  
**Reason:**
- M0 canonical lifecycle uses: `AWAITING_GATE_1` (not `GUI_APPROVAL_PENDING`)
- M0 Report mapping table (line 70): `AWAITING_GUI_APPROVAL | AWAITING_GATE_1`
- However, M0 explicitly states this is a "terminology mapping" without runtime changes
- The term `GUI_APPROVAL_PENDING` does NOT appear in M0 canonical documents

**Conservative Conclusion:** M0 canonical uses `AWAITING_GATE_1` in documentation but explicitly defers runtime changes. Not confirmed as M0 correction requirement.

### 5. AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTATION_APPROVAL_PENDING

**Status:** NOT CONFIRMED  
**Reason:**
- M0 canonical lifecycle uses: `AWAITING_IMPLEMENTATION_APPROVAL` (unchanged)
- M0 Report mapping table (line 77): `AWAITING_IMPLEMENTATION_APPROVAL | AWAITING_IMPLEMENTATION_APPROVAL` (no change)
- The term `IMPLEMENTATION_APPROVAL_PENDING` does NOT appear in M0 canonical documents

**Conclusion:** M0 canonical KEEPS the current name. No rename required.

### 6. CERTIFICATION_READY → CERTIFICATION_PENDING

**Status:** NOT CONFIRMED  
**Reason:**
- M0 canonical lifecycle uses: `CERTIFICATION_READY` (unchanged)
- M0 Report mapping table (line 82): `CERTIFICATION_READY | CERTIFICATION_READY` (no change)
- PL-005 explicitly uses the term `CERTIFICATION_READY`

**Conclusion:** M0 canonical KEEPS the current name. No rename required.

---

## FILES TO MODIFY

### 1. packages/types/src/project-llm/workflow.ts

**Changes Required:**

#### Change 1: Update type definition (line 24)
```typescript
// BEFORE:
export type ProjectLlmWorkflowState =
  | 'REQUEST_CREATED'
  | 'BRIEF_READY'

// AFTER:
export type ProjectLlmWorkflowState =
  | 'REQUESTED'
  | 'BRIEF_READY'
```

#### Change 2: Update ALLOWED_TRANSITIONS mapping (line 75)
```typescript
// BEFORE:
export const ALLOWED_TRANSITIONS: Readonly<Record<ProjectLlmWorkflowState, readonly ProjectLlmWorkflowState[]>> = {
  REQUEST_CREATED: ['BRIEF_READY'],
  BRIEF_READY: ['HANDOFF_READY'],

// AFTER:
export const ALLOWED_TRANSITIONS: Readonly<Record<ProjectLlmWorkflowState, readonly ProjectLlmWorkflowState[]>> = {
  REQUESTED: ['BRIEF_READY'],
  BRIEF_READY: ['HANDOFF_READY'],
```

**Total Changes in workflow.ts:** 2 lines

---

### 2. Search Results for Other References

Based on the codebase search, the following files reference the state names:

#### Files Referencing REQUEST_CREATED:
- `packages/types/src/project-llm/workflow.ts` (lines 24, 75) — **WILL BE UPDATED**

**Total additional files:** 0

**Note:** The grep search found only the workflow.ts file references REQUEST_CREATED in TypeScript code. No other .ts, .tsx, .js, or .jsx files reference this state.

---

### 3. Test Files (If Any)

**Search for test files:**
No test files found in the grep results that directly reference `REQUEST_CREATED`.

**Action Required:**
After making changes, run the type-checking and build process to confirm no indirect references exist through type inference.

---

## COMPLETE FILE REFERENCE LIST

All files that reference the old state name `REQUEST_CREATED`:

1. `packages/types/src/project-llm/workflow.ts` — Line 24 (type definition), Line 75 (ALLOWED_TRANSITIONS)

**Other state names confirmed to remain unchanged:**
- `BRIEF_READY` — used in workflow.ts, no change required
- `HANDOFF_READY` — used in workflow.ts and projectLlmWorkflowCoordinator.ts, no change required
- `CANDIDATE_READY` — used in workflow.ts and projectLlmWorkflowCoordinator.ts, no change required
- `AWAITING_GUI_APPROVAL` — used in workflow.ts, no change required
- `AWAITING_IMPLEMENTATION_APPROVAL` — used in workflow.ts and projectLlmWorkflowCoordinator.ts, no change required (M0 canonical keeps this name)
- `CERTIFICATION_READY` — used in workflow.ts, certification.ts, and projectLlmWorkflowCoordinator.ts, no change required (M0 canonical keeps this name)

---

## ARCHITECTURE DECISION RECORD ADDITION

Add the following to `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_DECISION_RECORD.md` after PL-011:

```markdown
---

## PL-012 — Workflow State Naming Alignment

**Decision:** The TypeScript workflow state machine uses `REQUESTED` as the initial state, aligning with M0 canonical lifecycle terminology. Other state names remain unchanged pending M1+ broader alignment review.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Rationale:** M0 canonical architecture explicitly defines the lifecycle starting with `REQUESTED`. The M0 Report provides a terminology mapping table but explicitly states "M0 does not change workflow runtime behavior." However, the initial state name `REQUEST_CREATED` vs. `REQUESTED` creates immediate confusion when reading M0 lifecycle diagrams. Aligning the initial state name resolves the most visible drift without requiring wholesale state machine refactoring. Other state names (BRIEF_READY, HANDOFF_READY, CANDIDATE_READY, etc.) are either unchanged in M0 canonical documents or appear only in mapping tables with ambiguous prescriptive vs. descriptive intent. These deferred alignment opportunities remain open for M1+ review.

**Consequence:** 
- Runtime code initial state changes from `REQUEST_CREATED` to `REQUESTED`
- M0 canonical lifecycle diagrams and runtime code align on initial state terminology
- No behavioral changes to workflow transitions
- Other state naming differences remain (AWAITING_GUI_APPROVAL vs. AWAITING_GATE_1, CANDIDATE_READY vs. CANDIDATE_RECEIVED, etc.) as deferred terminology alignment candidates
- Future M1+ implementations must consult both the canonical state names and the runtime state machine until full alignment is completed

```

**Insertion Point:**
After line 118 (after PL-011 section, before "Open Architecture Decisions" section)

---

## VERIFICATION STEPS

### Step 1: Build and Type-Check

```bash
# From repository root:
pnpm --filter @realtutorialhub/types build
```

**Expected Outcome:**
- Build completes successfully
- No TypeScript errors
- Type definitions exported correctly

### Step 2: Type-Check Dependent Packages

```bash
# Check the main consumer of the types package:
pnpm --filter skillhubcore-admin type-check
```

**Expected Outcome:**
- Type-checking passes
- No errors related to ProjectLlmWorkflowState
- All references to workflow states resolve correctly

### Step 3: Full Workspace Type-Check

```bash
# From repository root:
pnpm type-check
```

**Expected Outcome:**
- All packages type-check successfully
- No workflow-state-related errors

### Step 4: Search for Runtime References (Post-Change Verification)

```bash
# Verify no residual REQUEST_CREATED references in code:
grep -r "REQUEST_CREATED" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" packages/ apps/
```

**Expected Outcome:**
- No matches (or only matches in comments/documentation)

### Step 5: Test Suite (If Available)

```bash
# Run any existing Project LLM tests:
pnpm test -- project-llm
```

**Expected Outcome:**
- All tests pass
- No test failures related to workflow states

---

## CONSERVATIVE RATIONALE

**Why only REQUEST_CREATED → REQUESTED?**

1. **Explicit Canonical Usage:** The M0 canonical documents EXPLICITLY use `REQUESTED` in lifecycle diagrams (not just mapping tables). This is the only state where the canonical lifecycle diagram uses different terminology than the current runtime.

2. **M0 Report Ambiguity:** The M0 Report states "M0 does not change workflow runtime behavior. This is a canonical terminology mapping for architecture alignment." This creates ambiguity:
   - **Interpretation A (Prescriptive):** The mapping table prescribes future alignment, but M0 defers implementation
   - **Interpretation B (Descriptive):** The mapping table documents current drift for reference only

3. **Risk Mitigation:** Changing multiple state names introduces risk of:
   - Breaking existing integrations
   - Introducing bugs in state transition logic
   - Creating cascade failures in dependent code
   - Requiring extensive regression testing

4. **Minimal Viable Alignment:** Changing only `REQUEST_CREATED → REQUESTED` achieves:
   - Alignment with the most visible state (initial state) in lifecycle diagrams
   - Minimal code surface area change (2 lines in 1 file)
   - Clear canonical authority (explicit usage in lifecycle diagrams)
   - Reduced risk of unintended consequences

5. **Deferred Broader Alignment:** Other state renames can be evaluated in M1+ when:
   - The intent of the M0 mapping table is clarified (prescriptive vs. descriptive)
   - Broader codebase refactoring is planned
   - Comprehensive regression testing is available
   - The cost/benefit of wholesale terminology alignment is assessed

**Conservative Principle:** When canonical documents show ambiguity between "architecture mapping" and "runtime changes not in M0 scope," prefer minimal changes that resolve explicit conflicts while deferring broader refactoring to later milestones with clearer requirements.

---

## IMPLEMENTATION NOTES

### For the Coder:

1. **Read the M0 canonical documents first** to understand the architecture context
2. **Make only the two changes specified** in the workflow.ts file
3. **Run all verification steps** to ensure no breakage
4. **Add PL-012 to the ADR** as specified
5. **Commit with a clear message** referencing M0 alignment
6. **Do not refactor other state names** unless explicitly instructed

### Commit Message Template:

```
fix(types): align initial workflow state with M0 canonical architecture

- Rename REQUEST_CREATED → REQUESTED in workflow.ts
- Add PL-012 architecture decision to ADR
- Aligns with M0 canonical lifecycle terminology
- No behavioral changes to workflow transitions

Refs: PROJECT_LLM_CANONICAL_ARCHITECTURE_V1.md
Refs: m0-corrections-plan.md
```

---

## DEFERRED ALIGNMENT CANDIDATES

The following state renames were identified in the audit but are **NOT CONFIRMED** for M0 implementation. These remain as **deferred alignment candidates** for M1+ review:

1. `AWAITING_GUI_APPROVAL` → `AWAITING_GATE_1` (M0 canonical uses AWAITING_GATE_1 in docs but defers runtime change)
2. `CANDIDATE_READY` → `CANDIDATE_RECEIVED` (appears in mapping table but with "no runtime changes" disclaimer)
3. `COMPLIANCE_REVIEW` → `CANDIDATE_AUDIT` (mapping table only)
4. `COMPLIANCE_FAILED` → `REVISION_REQUIRED` / `BLOCKED` (mapping table only)
5. `CORRECTION_REQUIRED` → `REVISION_REQUIRED` (mapping table only)
6. `VALIDATION_IN_PROGRESS` → `VERIFYING` (mapping table only)
7. `VALIDATION_FAILED` → `REVISION_REQUIRED` / `BLOCKED` (mapping table only)

**Future Decision Point:** Clarify whether the M0 Report mapping table is:
- **Prescriptive:** Must be implemented in M1+
- **Descriptive:** Documents current drift for reference, with alignment optional based on cost/benefit analysis

---

## SUMMARY

**Total State Renames Confirmed:** 1  
**Total Files to Modify:** 2 (workflow.ts + ADR)  
**Total Lines Changed in Code:** 2  
**Total Risk Level:** LOW  
**Verification Method:** Build + type-check  
**Expected Duration:** < 30 minutes  

**Critical Path:**
1. Update workflow.ts (2 line changes)
2. Add PL-012 to ADR
3. Build types package
4. Type-check dependent packages
5. Commit with clear message

**Conservative Outcome:**
- M0 canonical lifecycle and runtime code align on initial state
- Minimal code changes reduce risk
- Other state naming differences documented as deferred alignment candidates
- Clear path forward for M1+ broader alignment review

---

**Plan Status:** READY_FOR_IMPLEMENTATION  
**Next Step:** Hand off to coding agent for implementation
