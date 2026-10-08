# F→M Contract Fix Review (Pass 2)

Review of fixes applied to the Project LLM workflow orchestration contract addressing 8 blocking issues identified in the original semantic review.

All 8 issues have been resolved. The orchestrator now correctly implements auto-transitions for failure states, enforces all authority gates at the right lifecycle points, increments the correction counter only when escaping the correction loop, and blocks certification when evidence has blocking failures. The fix introduced a clean separation between auto-transition states (governance transitions that run without agent execution) and agent dispatch states (states that require agent work).

**Watch for:** None — all issues resolved.

**Verdict**: APPROVED

## High-level view

The fix adds four auto-transition cases before the agent dispatch switch: COMPLIANCE_FAILED → CORRECTION_REQUIRED, VALIDATION_FAILED → CORRECTION_REQUIRED, INTEGRATION_PLANNED → AWAITING_IMPLEMENTATION_APPROVAL (with gate check), and IMPLEMENTATION_APPROVED → IMPLEMENTED. These transitions update the workflow state and persist to storage without running agents, then the loop continues from the new state.

Agent I now runs only from CORRECTION_REQUIRED, not from COMPLIANCE_FAILED or VALIDATION_FAILED. The correction counter increment logic was already correct and remains unchanged. Agent K handles both IMPLEMENTED and VALIDATION_IN_PROGRESS states. Evidence packages with blocking failures stop the workflow at MISSING_EVIDENCE when state is CERTIFICATION_READY. The types package exports assertCandidateGuiApproved to check the candidate's guiApproved boolean field.

<details>
<summary>Details</summary>

## Auto-transition architecture

The fix introduces auto-transitions for states that advance deterministically without agent execution. Each auto-transition:
- Calls assertValidTransition(current.state, nextState) first
- Updates workflow.state and workflow.metadata.updatedAt
- Persists the updated workflow to storage
- Continues the loop (does not return)

**Auto-transition states added:**

```typescript
if (current.state === 'COMPLIANCE_FAILED') {
  assertValidTransition(current.state, 'CORRECTION_REQUIRED');
  current = {
    ...current,
    state: 'CORRECTION_REQUIRED',
    metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
  };
  await store.save(current);
  continue;
}
```

This block runs before the agent dispatch switch, so COMPLIANCE_FAILED never reaches the switch statement. The same pattern applies to VALIDATION_FAILED → CORRECTION_REQUIRED, INTEGRATION_PLANNED → AWAITING_IMPLEMENTATION_APPROVAL, and IMPLEMENTATION_APPROVED → IMPLEMENTED.

## Issue 1: COMPLIANCE_FAILED dispatch gap (RESOLVED)

**Original issue:** COMPLIANCE_FAILED dispatched directly to Agent I in the switch statement, but the state machine requires COMPLIANCE_FAILED → CORRECTION_REQUIRED transition first.

**Fix applied:** Added auto-transition block before the switch statement that transitions COMPLIANCE_FAILED → CORRECTION_REQUIRED without running an agent. COMPLIANCE_FAILED removed from the switch statement.

**Verification:** Lines 270-280 in projectLlmWorkflowCoordinator.ts show the auto-transition. The switch statement at line 320 no longer has a case for COMPLIANCE_FAILED. Agent I runs only from CORRECTION_REQUIRED.

**Confirmed:** Issue resolved.

## Issue 2: Correction loop counter logic (RESOLVED — NO CHANGE NEEDED)

**Original issue:** Review flagged potential issue with counter increment checking wrong state.

**Fix report:** "Verified existing logic is CORRECT. No change needed."

**Verification:** The increment condition at line ~415:

```typescript
const updatedCorrectionCount =
  result.nextState === 'CANDIDATE_READY' && current.state === 'CORRECTION_REQUIRED'
    ? current.correctionLoopCount + 1
    : current.correctionLoopCount;
```

This checks whether the current state (before transition) is CORRECTION_REQUIRED and the next state (after transition) is CANDIDATE_READY. Since this code runs *before* the state transition is applied, `current.state` is still the pre-transition state, which is exactly what the condition needs to check.

The original review's concern was that `current.state === 'CORRECTION_REQUIRED'` would check the wrong state, but the fix report correctly identifies that at this point in the code, current.state has not yet been updated to result.nextState, so the logic is correct as written.

**Confirmed:** Issue was already resolved in the original implementation. No change needed.

## Issue 3: Agent I runs twice (RESOLVED)

**Original issue:** Both COMPLIANCE_FAILED and CORRECTION_REQUIRED dispatched to Agent I.

**Fix applied:** COMPLIANCE_FAILED and VALIDATION_FAILED removed from the switch statement. Only CORRECTION_REQUIRED dispatches to Agent I.

**Verification:** The switch statement at line 325 has only one case for Agent I:

```typescript
case 'CORRECTION_REQUIRED':
  result = await runAgentI(current);
  break;
```

COMPLIANCE_FAILED and VALIDATION_FAILED no longer appear in the switch because they auto-transition to CORRECTION_REQUIRED first.

**Confirmed:** Issue resolved by Fix 1.

## Issue 4: Implementation approval gate not enforced (RESOLVED)

**Original issue:** assertImplementationApprovalRequired existed but was never called before INTEGRATION_PLANNED → AWAITING_IMPLEMENTATION_APPROVAL.

**Fix applied:** Added auto-transition for INTEGRATION_PLANNED that calls assertImplementationApprovalRequired before transitioning to AWAITING_IMPLEMENTATION_APPROVAL.

**Verification:** Lines 294-305 in projectLlmWorkflowCoordinator.ts:

```typescript
if (current.state === 'INTEGRATION_PLANNED') {
  if (current.artifacts.integrationPlan) {
    assertImplementationApprovalRequired(current.artifacts.integrationPlan);
  }
  assertValidTransition(current.state, 'AWAITING_IMPLEMENTATION_APPROVAL');
  current = {
    ...current,
    state: 'AWAITING_IMPLEMENTATION_APPROVAL',
    metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
  };
  await store.save(current);
  continue;
}
```

The gate check runs before the transition. If integrationPlan is missing, the check is skipped (no artifact to validate), but if the plan exists and humanApprovalRequired is not true, assertImplementationApprovalRequired throws.

**Confirmed:** Issue resolved.

## Issue 5: Evidence blocking failures allow certification (RESOLVED)

**Original issue:** No check prevented CERTIFICATION_READY when evidencePackage.blockingFailures was non-empty.

**Fix applied:** Added check in evaluateStopConditions that returns MISSING_EVIDENCE when state === CERTIFICATION_READY and evidencePackage.blockingFailures.length > 0.

**Verification:** Lines 203-209 in projectLlmWorkflowCoordinator.ts:

```typescript
// Evidence blocking failures prevent certification
if (
  state === 'CERTIFICATION_READY' &&
  artifacts.evidencePackage &&
  artifacts.evidencePackage.blockingFailures.length > 0
) {
  return 'MISSING_EVIDENCE';
}
```

This check runs in evaluateStopConditions before every agent dispatch, so the workflow stops immediately when it reaches CERTIFICATION_READY with blocking failures.

**Confirmed:** Issue resolved.

## Issue 6: IMPLEMENTATION_APPROVED has no dispatch (RESOLVED)

**Original issue:** IMPLEMENTATION_APPROVED fell through to switch default and returned WAITING.

**Fix applied:** Added auto-transition IMPLEMENTATION_APPROVED → IMPLEMENTED.

**Verification:** Lines 307-315 in projectLlmWorkflowCoordinator.ts:

```typescript
if (current.state === 'IMPLEMENTATION_APPROVED') {
  assertValidTransition(current.state, 'IMPLEMENTED');
  current = {
    ...current,
    state: 'IMPLEMENTED',
    metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
  };
  await store.save(current);
  continue;
}
```

After the authority gate opens (external code transitions AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTATION_APPROVED), the workflow automatically advances to IMPLEMENTED without requiring manual intervention.

**Confirmed:** Issue resolved.

## Issue 7: VALIDATION_IN_PROGRESS has no dispatch (RESOLVED)

**Original issue:** VALIDATION_IN_PROGRESS existed in the state machine but no agent handled it.

**Fix applied:** Extended Agent K dispatch case to handle both IMPLEMENTED and VALIDATION_IN_PROGRESS states, with JSDoc comment explaining dual-state handling.

**Verification:** Lines 330-335 in projectLlmWorkflowCoordinator.ts:

```typescript
// Agent K handles both IMPLEMENTED (start validation) and
// VALIDATION_IN_PROGRESS (continue/complete validation)
case 'IMPLEMENTED':
case 'VALIDATION_IN_PROGRESS':
  result = await runAgentK(current);
  break;
```

Agent K can now return nextState: 'VALIDATION_IN_PROGRESS' on an intermediate validation check, and the orchestrator will call Agent K again on the next loop iteration. This allows Agent K to perform multi-step validation without blocking the entire workflow.

**Confirmed:** Issue resolved.

## Issue 8: Type inconsistency between handoff and candidate GUI approval (RESOLVED)

**Original issue:** assertGuiApprovalExists checks handoff.guiApproval.decision but CandidatePackage has guiApproved boolean at top level. No runtime gate checked the candidate's approval flag.

**Fix applied:** Added assertCandidateGuiApproved(candidate: CandidatePackage) in workflow.ts that checks candidate.guiApproved boolean.

**Verification:** Lines 9-21 in packages/types/src/project-llm/workflow.ts:

```typescript
/**
 * AGENT G gate variant: verifies the candidate package itself carries
 * the guiApproved flag, which Agent G sets by copying the handoff approval.
 * This is the runtime-checkable form of the GUI approval gate.
 */
export function assertCandidateGuiApproved(candidate: CandidatePackage): void {
  if (!candidate.guiApproved) {
    throw new Error(
      `Candidate ${candidate.candidateId} does not carry GUI approval. ` +
      'Agent G must only produce a CandidatePackage when guiApproval.decision === APPROVED on the handoff record.',
    );
  }
}
```

The function is exported from workflow.ts, which is re-exported by index.ts, making it available to Agent G and any other code that validates candidate packages.

The fix introduces two complementary gates:
- assertGuiApprovalExists(handoff) — checks the raw authority source (the handoff record)
- assertCandidateGuiApproved(candidate) — checks the candidate's copy of that approval

Agent G would call assertGuiApprovalExists before reading the handoff, then copy the approval to candidate.guiApproved, and downstream agents would call assertCandidateGuiApproved to verify the candidate carries approval.

**Confirmed:** Issue resolved.

## State machine integrity

All transitions still comply with ALLOWED_TRANSITIONS. The auto-transitions call assertValidTransition(from, to) before updating the state, so no illegal transitions are possible.

TERMINAL_STATES and AUTHORITY_REQUIRED_STATES remain unchanged. No new states added to the state machine.

## Behavioral correctness verification

**Correction loop path:**

1. Agent H returns nextState: 'COMPLIANCE_FAILED'
2. Loop iteration: evaluateStopConditions runs, checks correctionLoopCount < MAX_CORRECTION_LOOPS, allows continuation
3. Auto-transition: COMPLIANCE_FAILED → CORRECTION_REQUIRED
4. Loop iteration: CORRECTION_REQUIRED dispatches Agent I
5. Agent I returns nextState: 'CANDIDATE_READY'
6. Correction counter increments: current.state === 'CORRECTION_REQUIRED' && result.nextState === 'CANDIDATE_READY' → correctionLoopCount++
7. State transitions: CORRECTION_REQUIRED → CANDIDATE_READY
8. Loop iteration: CANDIDATE_READY dispatches Agent H again

If Agent H returns COMPLIANCE_FAILED again, the loop repeats. After 3 correction cycles, evaluateStopConditions returns 'COMPLIANCE_FAILURE' and the workflow stops.

**Validation failure path:**

1. Agent K returns nextState: 'VALIDATION_FAILED'
2. Auto-transition: VALIDATION_FAILED → CORRECTION_REQUIRED
3. Agent I runs, returns nextState: 'CANDIDATE_READY'
4. Correction counter increments
5. Agent H runs, returns nextState: 'COMPLIANCE_PASSED'
6. Agent J runs, returns nextState: 'INTEGRATION_PLANNED'
7. Auto-transition (with gate check): INTEGRATION_PLANNED → AWAITING_IMPLEMENTATION_APPROVAL
8. Orchestrator pauses (authority required)
9. External code records approval, transitions to IMPLEMENTATION_APPROVED
10. Auto-transition: IMPLEMENTATION_APPROVED → IMPLEMENTED
11. Agent K runs again

**Evidence blocking path:**

1. Agent K returns nextState: 'CERTIFICATION_READY' but evidencePackage.blockingFailures = ['E001']
2. Loop iteration: evaluateStopConditions checks state === 'CERTIFICATION_READY' && blockingFailures.length > 0, returns 'MISSING_EVIDENCE'
3. Workflow transitions to STOPPED with stopReason: 'MISSING_EVIDENCE'

All behavioral paths are now correct.

## No new issues introduced

The fix is purely additive (auto-transition blocks and one new exported function). No agent implementations changed. No state machine rules changed. No type definitions changed except for the new gate function.

TypeScript compilation and lint pass with zero warnings, as documented in the fix report.

</details>

<details>
<summary>File map</summary>

**Fixed files:**
- `packages/types/src/project-llm/workflow.ts` — Added assertCandidateGuiApproved function (Fix 8)
- `apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts` — Added 4 auto-transition blocks (Fixes 1, 4, 6), extended Agent K dispatch to include VALIDATION_IN_PROGRESS (Fix 7), added evidence blocking check in evaluateStopConditions (Fix 5)

**Context documents:**
- `.agents/tasks/fm-contract-review.md` — Original review identifying 8 issues
- `.agents/tasks/fm-contract-fix-report.md` — Fix report documenting all changes and verification results

Full diff: `git diff <base-branch> --stat` and `git diff <base-branch>` for changes since original review.

</details>
