# M0 Corrections Applied: REQUEST_CREATED → REQUESTED

TypeScript state machine alignment with M0 canonical architecture. The correction removes the terminology drift between the runtime initial state and the M0 lifecycle diagrams.

**Watch for:** None — all critical checks pass, compilation succeeds, no residual references found.

**Verdict:** APPROVED

## High-level view

The state name `REQUEST_CREATED` was renamed to `REQUESTED` across two locations in `workflow.ts`: the type union definition and the `ALLOWED_TRANSITIONS` map. M0 canonical documents (CANONICAL_ARCHITECTURE_V1.md, MVP_IMPLEMENTATION_CONTRACT.md) explicitly use `REQUESTED` as the initial lifecycle state, making this the only state where canonical documentation diverged from runtime terminology. The correction plan conservatively deferred other proposed renames that appeared only in mapping tables with "no runtime behavior changes" disclaimers, or where M0 canonical documents used the same terminology as current runtime.

TypeScript compilation and all 220 tests pass. No hardcoded string references to the old state name exist in the codebase. The types package exports correctly, and dependent packages type-check without errors.

PL-012 was added to the Architecture Decision Record documenting the M0 correction loop policy: critical corrections block M1, recommended corrections may be batched into M0.1. The ADR entry explains why only the initial state was renamed while other mapping-table suggestions were deferred.

<details>
<summary>Issues (0)</summary>

No blocking issues found.

</details>

<details>
<summary>Details</summary>

## REQUEST_CREATED removed throughout

The old state name `REQUEST_CREATED` no longer appears anywhere in `workflow.ts`. Both occurrences were updated:

- Line 24: Type union definition changed from `| 'REQUEST_CREATED'` to `| 'REQUESTED'`
- Line 75: Transition map key changed from `REQUEST_CREATED: ['BRIEF_READY']` to `REQUESTED: ['BRIEF_READY']`

The grep search for residual references (from the verification note) returned no matches, confirming the rename is complete. Since TypeScript uses structural typing and the state values are string literals, any unconverted code referencing the old state would fail type-checking. The successful test run confirms no such code exists.

**Confidence:** confirmed — verified by reading the corrected file and checking the verification note's grep results.

## Canonical justification matches M0 documents

The correction plan cited two M0 canonical documents that explicitly use `REQUESTED` as the initial state:

1. `PROJECT_LLM_CANONICAL_ARCHITECTURE_V1.md` (Section 5, lines 82-83): lifecycle diagram shows `REQUESTED ↓ DISCOVERY`
2. `PROJECT_LLM_MVP_IMPLEMENTATION_CONTRACT.md` (lines 75-77): lifecycle diagram shows `REQUESTED ↓ DISCOVERY`

Reading the canonical architecture document confirms this: the lifecycle section uses `REQUESTED` as the first state, not `REQUEST_CREATED`. The M0 Report's terminology mapping table lists `REQUEST_CREATED | REQUESTED`, but the lifecycle diagrams themselves use `REQUESTED` consistently. This makes `REQUEST_CREATED → REQUESTED` the only state rename where the canonical documents explicitly chose different terminology in their lifecycle diagrams, not just in a mapping table.

**Confidence:** confirmed — canonical documents read, lifecycle diagrams verified.

## State consistency across union and transition map

The `REQUESTED` state appears in the union type (line 24), the `ALLOWED_TRANSITIONS` keys (line 75), and no other state's transition array. All 20 states in the union have corresponding keys in the transition map.

**Confidence:** confirmed — verified by reading the corrected file.

## TypeScript compilation passed

The verification note reports all 220 tests pass (10 test files, 1.47s duration). The grep search for `REQUEST_CREATED` after the correction returned no matches.

**Confidence:** confirmed — compilation result from verification note.

## No workflow logic changed

The correction modified only state name string literals. The transition structure is unchanged: the initial state still transitions to `BRIEF_READY` with no other changes to the transition map. No functions, guards, or helper logic were modified.

**Confidence:** confirmed — verified by reading the corrected file.

## PL-012 added to ADR

The Architecture Decision Record now includes PL-012 after PL-011 and before the "Open Architecture Decisions" section. The entry title is "M0 Correction Loop Policy", status is ACCEPTED, date is 2026-10-05. The rationale distinguishes critical corrections (blocking M1) from recommended corrections (can be batched), explains why only the initial state was renamed, and notes that other mapping-table suggestions remain deferred.

**Confidence:** confirmed — verified by reading the ADR.

## Recommended renames correctly deferred

The correction plan identified six proposed renames as NOT CONFIRMED by M0 canonical documents:

1. `BRIEF_READY → BRIEF_GENERATED`: M0 canonical uses `BRIEF_READY` in lifecycle diagrams
2. `HANDOFF_READY → HANDOFF_GENERATED`: M0 does not specify this state explicitly
3. `CANDIDATE_READY → CANDIDATE_RECEIVED`: mapping table only, with "no runtime changes" disclaimer
4. `AWAITING_GUI_APPROVAL → AWAITING_GATE_1`: M0 documentation uses `AWAITING_GATE_1` but defers runtime change
5. `AWAITING_IMPLEMENTATION_APPROVAL → IMPLEMENTATION_APPROVAL_PENDING`: M0 canonical keeps the current name unchanged
6. `CERTIFICATION_READY → CERTIFICATION_PENDING`: M0 canonical keeps the current name unchanged

Reading the corrected `workflow.ts` confirms none of these renames were applied. The file still uses `BRIEF_READY`, `HANDOFF_READY`, `CANDIDATE_READY`, `AWAITING_GUI_APPROVAL`, `AWAITING_IMPLEMENTATION_APPROVAL`, and `CERTIFICATION_READY`. The conservative principle was followed: apply only renames where M0 canonical lifecycle diagrams explicitly use different terminology, defer everything else.

**Confidence:** confirmed — verified by reading the corrected file and the canonical architecture document.

## No UI, Agent E, or orchestration changes

The correction touched only `workflow.ts` in the types package and the Architecture Decision Record. No UI files, no Agent E files, no orchestration logic, no database migrations, no API changes.

**Confidence:** confirmed — verified by reading the verification note.

</details>

<details>
<summary>File map</summary>

### Files modified (2)

- `packages/types/src/project-llm/workflow.ts` — Renamed initial state from REQUEST_CREATED to REQUESTED (type union + transition map)
- `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_DECISION_RECORD.md` — Added PL-012 documenting M0 correction loop policy

### Referenced for verification

- `ILS_UI_UX/docs/PROJECT_LLM_CANONICAL_ARCHITECTURE_V1.md` — Canonical lifecycle uses REQUESTED as initial state
- `.agents/tasks/m0-corrections-plan.md` — Correction plan identifying the critical rename and deferring other proposals
- `.agents/tasks/m0-corrections-verification.md` — Compilation result, test pass confirmation, grep search results

</details>
