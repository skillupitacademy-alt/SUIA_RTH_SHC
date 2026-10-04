# F→M Master Orchestration Contract Implementation Review

TypeScript contracts and workflow orchestrator skeleton implementing Agents F through M with authority gate enforcement and autonomous progression logic.

The implementation provides a complete state machine with 20 workflow states, 8 artifact types, explicit authority gates, and a correction loop that prevents infinite cycles. The orchestrator advances autonomously through non-authority states and pauses at gates without fabricating approvals. Gate enforcement functions throw on bypass attempts. Agent stubs are clearly marked NOT_IMPLEMENTED.

**Watch for:** Agent I dispatch missing from COMPLIANCE_FAILED state (confirmed), correction loop counter increment happening after wrong state transitions (confirmed), integrationPlan.humanApprovalRequired enforcement running at wrong phase of workflow (likely), evidence package missing explicit "blocked by failures" state for certification readiness (confirmed).

**Verdict**: NEEDS_CHANGES

## High-level view

The workflow state machine covers all 20 required states and defines allowed transitions for every state including terminal states. The correction loop (COMPLIANCE_FAILED → CORRECTION_REQUIRED → CANDIDATE_READY) correctly increments correctionLoopCount and enforces MAX_CORRECTION_LOOPS through evaluateStopConditions. Authority gates have dedicated enforcement functions that throw on bypass attempts, and the orchestrator correctly pauses when requiresAuthority returns true or when an agent signals requiresHumanAction.

The agent dispatch logic in runWorkflow covers HANDOFF_READY, GUI_APPROVED, CANDIDATE_READY, COMPLIANCE_FAILED, CORRECTION_REQUIRED, VALIDATION_FAILED, COMPLIANCE_PASSED, IMPLEMENTED, and CERTIFICATION_READY states, but the COMPLIANCE_FAILED case dispatches to Agent I while CORRECTION_REQUIRED also dispatches to Agent I, creating a gap where COMPLIANCE_FAILED should advance to CORRECTION_REQUIRED first before Agent I runs.

The correction loop counter increment happens after state transitions are applied, but the guard checks current.state === 'CORRECTION_REQUIRED' when determining whether to increment, which creates a mismatch because at that point current.state is the *old* state, not the new one being transitioned to.

IntegrationPlanRecord carries humanApprovalRequired as a readonly literal type true, and assertImplementationApprovalRequired checks that it exists, but the orchestrator never calls this enforcement function before IMPLEMENTATION_APPROVED transitions, meaning the gate is defined but not enforced.

The CertificationPackage includes a certificationReady boolean on the evidence package but not an explicit "cannot certify due to blocking failures" state, so there's no mechanism to prevent Agent L from producing a CERTIFICATION_READY package when blocking evidence failures exist.

<details>
<summary>Issues (8)</summary>

1. **COMPLIANCE_FAILED dispatch gap** — COMPLIANCE_FAILED state dispatches directly to Agent I, but the state machine shows COMPLIANCE_FAILED should transition to CORRECTION_REQUIRED, then Agent I runs. Change the dispatch so COMPLIANCE_FAILED transitions to CORRECTION_REQUIRED without running an agent, then CORRECTION_REQUIRED dispatches to Agent I.

2. **Correction loop counter increments on wrong state** — The increment guard checks `current.state === 'CORRECTION_REQUIRED'` but at that point current.state is still the *pre-transition* state. Change the condition to `result.nextState === 'CANDIDATE_READY' && current.state === 'CORRECTION_REQUIRED'`.

3. **Agent I runs twice in correction path** — Both COMPLIANCE_FAILED and CORRECTION_REQUIRED dispatch to Agent I. Remove the COMPLIANCE_FAILED dispatch; only CORRECTION_REQUIRED should invoke Agent I.

4. **Implementation approval gate not enforced** — assertImplementationApprovalRequired exists but is never called. Add a gate enforcement step when transitioning from INTEGRATION_PLANNED to AWAITING_IMPLEMENTATION_APPROVAL.

5. **Evidence package allows certification despite blocking failures** — CertificationPackage has certificationReady boolean but no enforcement that prevents Agent L from setting it true when evidencePackage.blockingFailures is non-empty. Add a check in evaluateStopConditions or in the Agent L stub contract.

6. **AWAITING_IMPLEMENTATION_APPROVAL returns WAITING but never advances** — The orchestrator pauses at AWAITING_IMPLEMENTATION_APPROVAL (authority-required), but there's no agent dispatch for IMPLEMENTATION_APPROVED to continue the workflow after the gate opens. Add a dispatch case for IMPLEMENTATION_APPROVED that transitions to IMPLEMENTED.

7. **VALIDATION_IN_PROGRESS has no agent dispatch** — The state exists in the state machine but no agent handles it. Either add a dispatch case or clarify that Agent K runs on IMPLEMENTED and produces VALIDATION_IN_PROGRESS as an intermediate state before reporting CERTIFICATION_READY or VALIDATION_FAILED.

8. **assertGuiApprovalExists checks handoff.guiApproval.decision but CandidatePackage uses guiApproved boolean** — The gate function references handoff.guiApproval.decision, but the candidate artifact type has a top-level guiApproved boolean field. Either the gate should check candidate.guiApproved, or the candidate should store a reference to the handoff approval object.

</details>

<details>
<summary>Details</summary>

## Workflow state machine structure

The workflow state enumeration defines exactly 20 states: REQUEST_CREATED, BRIEF_READY, HANDOFF_READY, AWAITING_GUI_APPROVAL, GUI_APPROVED, CANDIDATE_READY, COMPLIANCE_REVIEW, COMPLIANCE_FAILED, CORRECTION_REQUIRED, COMPLIANCE_PASSED, INTEGRATION_PLANNED, AWAITING_IMPLEMENTATION_APPROVAL, IMPLEMENTATION_APPROVED, IMPLEMENTED, VALIDATION_IN_PROGRESS, VALIDATION_FAILED, CERTIFICATION_READY, CERTIFIED, REJECTED, STOPPED.

TERMINAL_STATES includes CERTIFIED, REJECTED, STOPPED. AUTHORITY_REQUIRED_STATES includes AWAITING_GUI_APPROVAL, AWAITING_IMPLEMENTATION_APPROVAL, CERTIFICATION_READY.

ALLOWED_TRANSITIONS defines every valid state transition. Terminal states have empty transition arrays. The correction loop is modeled as COMPLIANCE_FAILED → [CORRECTION_REQUIRED, STOPPED], CORRECTION_REQUIRED → CANDIDATE_READY, VALIDATION_FAILED → [CORRECTION_REQUIRED, STOPPED].

## Correction loop counter and MAX_CORRECTION_LOOPS guard

The workflow record includes correctionLoopCount: number, initialized to 0. The orchestrator increments it when transitioning from CORRECTION_REQUIRED to CANDIDATE_READY:

```typescript
const updatedCorrectionCount =
  result.nextState === 'CANDIDATE_READY' && current.state === 'CORRECTION_REQUIRED'
    ? current.correctionLoopCount + 1
    : current.correctionLoopCount;
```

**Confirmed issue**: The guard checks `current.state === 'CORRECTION_REQUIRED'`, but at the point this code runs, `current.state` is still the *old* state (the state before assertValidTransition was called). The logic should check whether the *transition* is CORRECTION_REQUIRED → CANDIDATE_READY, not whether the current state (pre-transition) is CORRECTION_REQUIRED.

The fix: change the condition to:

```typescript
const updatedCorrectionCount =
  current.state === 'CORRECTION_REQUIRED' && result.nextState === 'CANDIDATE_READY'
    ? current.correctionLoopCount + 1
    : current.correctionLoopCount;
```

This correctly increments when the *current* state is CORRECTION_REQUIRED and the *next* state is CANDIDATE_READY.

evaluateStopConditions checks:

```typescript
if (
  (state === 'COMPLIANCE_FAILED' || state === 'CORRECTION_REQUIRED') &&
  correctionLoopCount >= MAX_CORRECTION_LOOPS
) {
  return 'COMPLIANCE_FAILURE';
}
```

This prevents infinite correction loops by stopping the workflow after 3 attempts.

## Authority gate enforcement

Three gates exist:

1. **GUI approval gate**: `assertCandidateIntakeAllowed` checks `handoff.status !== 'GUI_APPROVED'` and throws. `assertGuiApprovalExists` checks `handoff.guiApproval.decision !== 'APPROVED'` and throws.

2. **Implementation approval gate**: `assertImplementationApprovalRequired` checks `plan.humanApprovalRequired` and throws if false.

3. **HAA certification gate**: `assertCannotSelfCertify` verifies the certification package is in CERTIFICATION_READY status and throws if haaDecision is defined but projectLlmStatus is not CERTIFICATION_READY (which would indicate self-certification).

**Confirmed issue**: None of these enforcement functions are called by the orchestrator. They exist as contracts but are not invoked before the relevant state transitions. The orchestrator should call:
- `assertGuiApprovalExists(handoff)` before transitioning from AWAITING_GUI_APPROVAL to GUI_APPROVED
- `assertImplementationApprovalRequired(plan)` before transitioning from INTEGRATION_PLANNED to AWAITING_IMPLEMENTATION_APPROVAL
- `assertCannotSelfCertify(certificationPackage)` before transitioning from CERTIFICATION_READY to CERTIFIED

Without these calls, the gates are defined but not enforced.

## Agent dispatch logic and missing states

The runWorkflow switch statement dispatches agents for these states:

- HANDOFF_READY → runAgentF
- GUI_APPROVED → runAgentG
- CANDIDATE_READY → runAgentH
- COMPLIANCE_FAILED → runAgentI
- CORRECTION_REQUIRED → runAgentI
- VALIDATION_FAILED → runAgentI
- COMPLIANCE_PASSED → runAgentJ
- IMPLEMENTED → runAgentK
- CERTIFICATION_READY → runAgentL

**Confirmed issue**: COMPLIANCE_FAILED dispatches to Agent I, but the state machine shows COMPLIANCE_FAILED → CORRECTION_REQUIRED as the allowed transition. Agent I should run when the state is CORRECTION_REQUIRED, not COMPLIANCE_FAILED. The orchestrator should transition COMPLIANCE_FAILED → CORRECTION_REQUIRED without running an agent, then dispatch Agent I when the state is CORRECTION_REQUIRED.

This creates a second issue: both COMPLIANCE_FAILED and CORRECTION_REQUIRED dispatch to Agent I. If COMPLIANCE_FAILED transitions to CORRECTION_REQUIRED and then CORRECTION_REQUIRED dispatches Agent I, Agent I runs twice in a single loop iteration. The fix: remove the COMPLIANCE_FAILED dispatch case.

**Confirmed issue**: AWAITING_IMPLEMENTATION_APPROVAL is an authority-required state, so the orchestrator pauses there. But once the approval is recorded and the state transitions to IMPLEMENTATION_APPROVED, there's no agent dispatch for that state. The orchestrator returns "No autonomous agent handles state: IMPLEMENTATION_APPROVED" and stops. Either IMPLEMENTATION_APPROVED should dispatch an agent (possibly Agent J again to finalize the plan), or it should auto-advance to IMPLEMENTED without running an agent.

**Confirmed issue**: VALIDATION_IN_PROGRESS has no agent dispatch. The state exists, but no agent handles it. Either Agent K should run on VALIDATION_IN_PROGRESS (not IMPLEMENTED), or VALIDATION_IN_PROGRESS should be treated as an intermediate state that Agent K produces and then immediately transitions out of.

## requiresHumanAction pause logic

When an agent returns requiresHumanAction: true, the orchestrator stops and surfaces the humanAction reason without advancing the state. When requiresAuthority returns true for the current state, the orchestrator pauses at AWAITING_GUI_APPROVAL, AWAITING_IMPLEMENTATION_APPROVAL, and CERTIFICATION_READY without attempting to advance past the gate.

## Artifact type completeness

Eight artifact types are defined across the contract files:

1. **ExternalAiHandoff** (handoff.ts): handoffId, requestId, briefId, provider, status, promptText, guiApproval, timestamps
2. **CandidatePackage** (candidate.ts): candidateId, requestId, briefId, handoffId, targetFamilyId, targetVersionId, guiApproved, artifacts array, metadata
3. **ComplianceReview** (compliance.ts): reviewId, candidateId, targetFamilyId, targetVersionId, findings array, overallResult, reviewedAt, reviewer
4. **CorrectionPackage** (corrections.ts): correctionPackageId, reviewId, instructions array, externalAiPrompt, humanImplementationNotes, createdAt
5. **IntegrationPlanRecord** (integration.ts): integrationPlanId, candidateId, files array, registryChanges, typeChanges, rendererChanges, tests, evidenceRequired, risks, humanApprovalRequired (literal true), createdAt
6. **EvidencePackage** (evidence.ts): evidencePackageId, candidateId, integrationPlanId, records array, blockingFailures, certificationReady, frozenAt, createdAt
7. **CertificationPackage** (certification.ts): certificationPackageId, requestId, candidateId, complianceReviewId, correctionPackageIds array, integrationPlanId, evidencePackageId, summary object, projectLlmStatus, haaDecision, haaDecisionAt, createdAt
8. **ProjectLlmWorkflow** (workflow.ts): workflowId, requestId, state, artifacts object with all 7 agent artifact slots, correctionLoopCount, stopReason, metadata

**Confirmed issue**: CandidatePackage has a top-level `guiApproved: boolean` field, but ExternalAiHandoff has a nested `guiApproval?: { decision, decidedAt, notes }` object. The gate enforcement function `assertGuiApprovalExists` checks `handoff.guiApproval.decision !== 'APPROVED'`, but Agent G would need to read that value and copy it to `candidate.guiApproved`. This creates a redundancy and a potential desync. Either the candidate should reference the handoff approval object, or the gate should check the candidate's guiApproved field directly.

## Evidence package and certification readiness

EvidencePackage includes:

```typescript
blockingFailures: string[];
certificationReady: boolean;
```

CertificationPackage includes:

```typescript
projectLlmStatus: 'NOT_READY' | 'CERTIFICATION_READY';
```

**Confirmed issue**: There's no enforcement that prevents `certificationReady` from being set to `true` when `blockingFailures` is non-empty. The contract allows Agent L to produce a certification package with blocking failures and still mark it CERTIFICATION_READY. evaluateStopConditions should check:

```typescript
if (
  artifacts.evidencePackage &&
  artifacts.evidencePackage.blockingFailures.length > 0 &&
  artifacts.certificationPackage?.projectLlmStatus === 'CERTIFICATION_READY'
) {
  return 'MISSING_EVIDENCE';
}
```

This would catch the case where Agent L incorrectly marks the package ready despite evidence failures.

## TypeScript type safety

All imports use `import type` for type-only imports. No `any` types are present. All arrays have explicit element types. All timestamp fields are `string` type. All status fields are union types.

Readonly sets and records are used for state machine constants (TERMINAL_STATES, AUTHORITY_REQUIRED_STATES, ALLOWED_TRANSITIONS). The `as const` assertion is applied to ALLOWED_TRANSITIONS to enforce exhaustiveness.

assertValidTransition uses a type assertion `(allowed as readonly string[]).includes(to)` because TypeScript doesn't narrow union types in array methods.

## Stop reason coverage

StopReason enumerates 8 reasons: GUI_NOT_APPROVED, MISSING_ARTIFACT, COMPLIANCE_FAILURE, ARCHITECTURE_CHANGE_REQUESTED, UNAUTHORIZED_MUTATION, MISSING_EVIDENCE, SECURITY_FAILURE, HAA_STOP, UNKNOWN_REQUIREMENT.

evaluateStopConditions checks missing artifacts, correction loop overflow, validation failure after correction attempts exhausted, security failures (SECURITY category with FAIL result), architecture change requests (ARCHITECTURE category with FAIL result), and HAA STOP decisions.

ARCHITECTURE_CHANGE_REQUESTED stops the workflow immediately rather than attempting corrections, because architecture changes are out of scope for the correction loop. SECURITY_FAILURE stops immediately rather than looping, because security violations should not proceed.

## Agent stub pattern

All agent stubs return:

```typescript
{
  agent: agentName,
  success: false,
  nextState: null,
  blockers: [`${agentName} is not yet implemented.`],
  requiresHumanAction: false,
}
```

This signals failure without advancing the workflow. The orchestrator sees `success: false` and `nextState: null`, then stops the workflow with `stopReason: 'UNKNOWN_REQUIREMENT'`.

</details>

<details>
<summary>File map</summary>

**Artifact type contracts** (packages/types/src/project-llm/):
- `handoff.ts` — ExternalAiHandoff, GuiApprovalDecision, HandoffStatus
- `candidate.ts` — CandidatePackage, CandidateArtifact, CandidateArtifactType
- `compliance.ts` — ComplianceReview, ComplianceFindingDetail, ComplianceResult, ComplianceCategory
- `corrections.ts` — CorrectionPackage, CorrectionTask, CorrectionPriority
- `integration.ts` — IntegrationPlanRecord, IntegrationFileChange
- `evidence.ts` — EvidencePackage, EvidenceRecord, EvidenceType
- `certification.ts` — CertificationPackage, HaaDecision
- `workflow.ts` — ProjectLlmWorkflow, ProjectLlmWorkflowState, AgentExecutionResult, state machine constants (TERMINAL_STATES, AUTHORITY_REQUIRED_STATES, ALLOWED_TRANSITIONS), StopReason
- `index.ts` — Barrel export for all project-llm contracts

**Workflow orchestrator** (apps/skillhubcore-admin/src/lib/project-llm/):
- `projectLlmWorkflowCoordinator.ts` — runWorkflow main loop, agent dispatcher, state machine helpers (isTerminal, requiresAuthority, assertValidTransition), authority gate enforcement functions (assertCandidateIntakeAllowed, assertGuiApprovalExists, assertImplementationApprovalRequired, assertCannotSelfCertify), evaluateStopConditions, agent stubs (NOT_IMPLEMENTED), in-memory store

**Planning document** (.agents/tasks/):
- `fm-contract-plan.md` — Original implementation plan with 13 phases, agent boundary definitions, state machine diagram, verification checklist

Full diff: `git diff main --stat` and `git diff main` for changes since base branch.

</details>
