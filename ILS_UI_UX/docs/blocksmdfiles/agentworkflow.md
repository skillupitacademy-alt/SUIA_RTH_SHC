I'll investigate the existing codebase to understand the Project LLM architecture and produce a concrete implementation plan for the F→M orchestration contract deliverables.Great! I can see `project-llm` directory already exists. Let me investigate it:Now let me check if the deliverable files already exist:Let me read the existing compliance.ts to understand what's already there:Now let me look at the .kiro/steering directory for contribution guidelines:Now let me check the project structure to see what test commands are available:Perfect. Now let me look at one more file to understand reference pattern:Now I have enough information. Let me create the implementation plan:# Implementation Plan: F→M Orchestration Contract (Agents F through M)

## Summary of Existing Code Patterns

### Architecture Context
- **Monorepo**: TypeScript workspace with packages and apps (pnpm workspaces)
- **Types Package**: Domain contracts in `packages/types/src/project-llm/`
- **Admin Library**: Business logic in `apps/skillhubcore-admin/src/lib/project-llm/`
- **Test Framework**: Vitest with `describe()`/`it()` pattern, `*.test.ts` suffix
- **Import Aliases**: `@quiz/types` for packages/types, `@/lib` for app-local libraries
- **Build System**: Turbo monorepo with pnpm workspaces
- **Type-check**: `pnpm --filter @quiz/types type-check` and `pnpm --filter @quiz/skillhubcore-admin type-check`
- **Linting**: ESLint with `--max-warnings=0` (blocks on any warning)

### Existing Project LLM Infrastructure (Agent E Already Complete)
**Implemented Contracts** (in `packages/types/src/project-llm/`):
1. `lifecycle.ts` — ProjectLlmLifecycleStatus enum
2. `corpus.ts` — Corpus registry and family/version taxonomy
3. `runtime.ts` — Implementation status tracking
4. `request.ts` — ProjectLlmBlockRequest, HaaApprovalStatus, request lifecycle states
5. `compliance.ts` — ComplianceFinding, ComplianceVerdict, CorrectionInstruction, IntegrationPlan, IntegrationStep
6. `repository-intelligence.ts` — ReferenceImplementationPattern, primitives
7. `creation-brief.ts` — CreationBrief, CreationBriefRequest (Agent E complete)

**Library Implementations** (in `apps/skillhubcore-admin/src/lib/project-llm/`):
1. `projectLlmBlockCorpus.ts` — 18 families, 133 versions
2. `projectLlmRepositoryIntelligence.ts` — Intelligence aggregator
3. `projectLlmReferencePatterns.ts` — I1/C1/D1 reference patterns
4. `projectLlmCreationBrief.ts` — Agent E engine with test suite

### Code Patterns to Match
- **TypeScript strict mode**: Readonly properties, const assertions, explicit types, no `any`
- **Compile-time validation**: Use constants and throw errors if mismatches detected
- **Functional/deterministic**: Pure functions, no side effects
- **Evidence-based**: All data references source files/paths
- **Export barrel pattern**: Re-export from index.ts files
- **Status enums**: Union types for state machines (e.g., `'PENDING' | 'IN_PROGRESS' | 'COMPLETED'`)
- **ISO 8601 timestamps**: All date fields as strings
- **Readonly interfaces**: For immutable data structures

### Lint and Build Requirements (from CONTRIBUTING.md)
- **No `any`**: `@typescript-eslint/no-explicit-any` is error
- **Strict boolean checks**: Always handle null/empty explicitly
- **Type/value imports**: Use `import type` for types
- **No floating promises**: Always `await` or `.catch()`
- **Console blocked**: No `console.log` in production code
- **Complexity limit**: Max 20 cyclomatic complexity per function
- **File size warning**: 500 lines (extract helpers if approaching)

### Verification Commands
- **Type-check types package**: `pnpm --filter @quiz/types type-check`
- **Type-check admin app**: `pnpm --filter @quiz/skillhubcore-admin type-check`
- **Run tests for types**: `pnpm --filter @quiz/types test`
- **Run tests for admin**: `pnpm --filter @quiz/skillhubcore-admin test`
- **Lint all**: `pnpm lint:all` (fails on warnings)

---

## Design Decisions

### 1. Contract-First Implementation Strategy
**Decision**: Create TypeScript interfaces for ALL agent boundaries (F through M) BEFORE implementing any agent logic.

**Rationale**: The user's original message emphasizes building the "orchestration contract first" to prevent F from inventing interfaces that G later has to break. This plan creates types only — no implementations.

### 2. Workflow State Machine Design
**Decision**: Model the F→M workflow as a strict state machine with explicit gates, transitions, and blocking conditions.

**Rationale**: The original message shows a clear workflow:
```
F (Handoff) → GUI_APPROVAL_GATE → G (Candidate) → H (Compliance) → [I (Corrections) loop] → J (Integration) → K (Validation) → L (Evidence) → HAA_CERTIFICATION_GATE → M (Finalize)
```

Gates are deterministic checkpoints, not human intervention points. The AI can evaluate gates automatically but cannot forge approval.

### 3. Agent Boundaries as Type Contracts
**Decision**: Each agent (F, G, H, I, J, K, L, M) has:
- **Input contract**: What data it receives
- **Output contract**: What artifact it produces
- **Status contract**: What states it can be in
- **Transition rules**: What moves it from state to state

**Rationale**: Following the existing pattern from Agent E (creation-brief.ts), each agent gets its own contract file. This makes boundaries explicit and testable.

### 4. Gate Enforcement as Readonly Status Checks
**Decision**: Gates (GUI_APPROVAL, HAA_CERTIFICATION) are modeled as readonly status fields that the workflow checks, not as permissions the AI can modify.

**Rationale**: The original message states: "The AI workflow can pause internally at a gate, evaluate the gate deterministically, and continue automatically when the gate condition is satisfied. It must not invent a human approval or HAA certification."

### 5. Correction Loop as Explicit Return Path
**Decision**: Agent I (Corrections) converts compliance findings into correction instructions and returns to Agent G (Candidate), creating a cycle: G → H → [I → G if FAIL] → J.

**Rationale**: The original message explicitly defines Agent I as "converting findings into correction instructions and the workflow returning toward candidate review."

### 6. Extend Existing compliance.ts Instead of Replacing
**Decision**: `compliance.ts` already exists with ComplianceFinding, ComplianceVerdict, CorrectionInstruction, IntegrationPlan. Extend it rather than duplicate.

**Rationale**: Agent E already created compliance contracts. We extend with Agent H's review record structure and Agent I's correction workflow.

### 7. Workflow Coordinator as Orchestrator Skeleton
**Decision**: Create `projectLlmWorkflowCoordinator.ts` in the admin library as a skeleton orchestrator that defines state transitions and gate checks but does NOT implement agent logic.

**Rationale**: This is the architectural contract deliverable. Agent implementations come later. The coordinator defines the contract: "if status is X and gate is Y, transition to state Z."

### 8. Master Orchestration Report as Governance Document
**Decision**: Create `.agents/tasks/project-llm-master-orchestration-report.md` documenting the complete workflow contract, state machine, gates, and agent boundaries.

**Rationale**: This is the authoritative design document for F→M. Future implementers read this to understand the workflow before writing code.

---

## Confirmation: Deliverables Do NOT Yet Exist

**Verified non-existent files** (PowerShell checks confirmed):
1. `packages/types/src/project-llm/handoff.ts` — FALSE
2. `packages/types/src/project-llm/candidate.ts` — FALSE
3. `packages/types/src/project-llm/corrections.ts` — FALSE
4. `packages/types/src/project-llm/integration.ts` — FALSE
5. `packages/types/src/project-llm/evidence.ts` — FALSE
6. `packages/types/src/project-llm/certification.ts` — FALSE
7. `packages/types/src/project-llm/workflow.ts` — FALSE
8. `apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts` — FALSE
9. `.agents/tasks/project-llm-master-orchestration-report.md` — FALSE

**Existing files to extend** (NOT replace):
- `packages/types/src/project-llm/compliance.ts` — HAS ComplianceFinding, ComplianceVerdict, CorrectionInstruction, IntegrationPlan, IntegrationStep
- `packages/types/src/project-llm/request.ts` — HAS ProjectLlmBlockRequest, HaaApprovalStatus
- `packages/types/src/project-llm/lifecycle.ts` — HAS ProjectLlmLifecycleStatus

---

## Implementation Plan

### Phase 1: Agent F (Handoff Record) Contract

- [ ] 1. Create `packages/types/src/project-llm/handoff.ts` defining Agent F contracts.
      Includes: HandoffRecord (Agent F output), GuiPrototype (external AI artifact), GuiApprovalStatus, GuiApprovalGate, HandoffValidationResult.
      Files: `packages/types/src/project-llm/handoff.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 2: Agent G (Candidate Package) Contract

- [ ] 2. Create `packages/types/src/project-llm/candidate.ts` defining Agent G contracts.
      Includes: CandidatePackage (Agent G output), CandidateArtifact (React/TypeScript files), CandidateMetadata, CandidateValidationResult, CandidateStatus.
      Files: `packages/types/src/project-llm/candidate.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 3: Agent H (Compliance Review) Contract Extension

- [ ] 3. Extend `packages/types/src/project-llm/compliance.ts` with Agent H contracts.
      Add: ComplianceReviewRecord (Agent H output with requestId, reviewedAt, verdict, findings array, evidencePaths), extend existing ComplianceFinding/ComplianceVerdict interfaces if needed. DO NOT duplicate existing types.
      Files: `packages/types/src/project-llm/compliance.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 4: Agent I (Corrections) Contract

- [ ] 4. Create `packages/types/src/project-llm/corrections.ts` defining Agent I contracts.
      Includes: CorrectionPackage (Agent I output), CorrectionTask, CorrectionStatus, CorrectionResult. References existing CorrectionInstruction from compliance.ts.
      Files: `packages/types/src/project-llm/corrections.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 5: Agent J (Integration Plan) Contract Extension

- [ ] 5. Extend `packages/types/src/project-llm/compliance.ts` with Agent J contracts.
      Add: IntegrationPlanRecord (Agent J output with planId, targetFiles, integrationSteps array, validationCriteria, status). Extends existing IntegrationPlan/IntegrationStep if needed.
      Files: `packages/types/src/project-llm/compliance.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 6: Agent K (Validation) and Agent L (Evidence Package) Contracts

- [ ] 6. Create `packages/types/src/project-llm/evidence.ts` defining Agent K and Agent L contracts.
      Includes: ValidationRecord (Agent K output with validationTests, results, status), EvidencePackage (Agent L output with evidenceItems, testResults, artifacts, certificationReadiness).
      Files: `packages/types/src/project-llm/evidence.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 7: HAA Certification Contract

- [ ] 7. Create `packages/types/src/project-llm/certification.ts` defining HAA certification contracts.
      Includes: CertificationPackage, CertificationStatus, CertificationDecision (APPROVED/REJECTED), CertificationCondition. References existing HaaApprovalStatus from request.ts.
      Files: `packages/types/src/project-llm/certification.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 8: Workflow State Machine Contract

- [ ] 8. Create `packages/types/src/project-llm/workflow.ts` defining the complete F→M workflow state machine.
      Includes: ProjectLlmWorkflowState (union type of all states), WorkflowStatus, WorkflowTransition, WorkflowGate (GUI_APPROVAL, HAA_CERTIFICATION), WorkflowPhase (enum: HANDOFF, CANDIDATE, COMPLIANCE, CORRECTIONS, INTEGRATION, VALIDATION, EVIDENCE, CERTIFICATION, FINALIZED), WorkflowRecord (complete workflow tracking with currentPhase, currentStatus, gates, history).
      Files: `packages/types/src/project-llm/workflow.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 9: Update Types Package Index

- [ ] 9. Update `packages/types/src/project-llm/index.ts` to export all new contracts.
      Add exports: handoff, candidate, corrections, evidence, certification, workflow. Existing exports: lifecycle, corpus, runtime, request, compliance, repository-intelligence, creation-brief.
      Files: `packages/types/src/project-llm/index.ts`
      Verify: `pnpm --filter @quiz/types type-check` — no errors

### Phase 10: Workflow Coordinator Skeleton

- [ ] 10. Create `apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts` as orchestrator skeleton.
      Includes: Type imports from @quiz/types/project-llm, workflow state transition functions (pure logic, no implementations), gate evaluation functions (checkGuiApprovalGate, checkHaaCertificationGate returning boolean), workflow phase resolver (determineNextPhase based on current state and gate status), state validation (isWorkflowInValidState). NO agent implementations. Only state machine logic.
      Files: `apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts`
      Verify: `pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

### Phase 11: Update Admin Library Index

- [ ] 11. Update `apps/skillhubcore-admin/src/lib/project-llm/index.ts` to export workflow coordinator.
      Add export: projectLlmWorkflowCoordinator. Existing exports: projectLlmBlockCorpus, projectLlmReferencePatterns, projectLlmRepositoryIntelligence, projectLlmCreationBrief.
      Files: `apps/skillhubcore-admin/src/lib/project-llm/index.ts`
      Verify: `pnpm --filter @quiz/skillhubcore-admin type-check` — no errors

### Phase 12: Master Orchestration Report

- [ ] 12. Create `.agents/tasks/project-llm-master-orchestration-report.md` documenting the complete F→M orchestration contract.
      Includes: Workflow overview, agent boundaries (F through M), state machine diagram (states, transitions, gates), gate definitions (GUI_APPROVAL, HAA_CERTIFICATION with evaluation rules), correction loop (G → H → I → G cycle), workflow phases, status enums, type contract reference, implementation guidance (what each agent must implement), verification requirements.
      Files: `.agents/tasks/project-llm-master-orchestration-report.md`
      Verify: Manual review — document is complete and readable

### Phase 13: Full Monorepo Type-Check

- [ ] 13. Run full type-check across both packages to confirm all contracts compile.
      Verify: `pnpm --filter @quiz/types type-check && pnpm --filter @quiz/skillhubcore-admin type-check` — both pass with zero errors

---

## TypeScript Compilation Strategy

### Build Order (Dependencies First)
1. `packages/types` — foundational contracts, no dependencies
2. `apps/skillhubcore-admin` — depends on `@quiz/types` via path alias

### Type-Check Commands
- **Types package only**: `pnpm --filter @quiz/types type-check`
- **Admin app only**: `pnpm --filter @quiz/skillhubcore-admin type-check`
- **Both in sequence**: `pnpm --filter @quiz/types type-check && pnpm --filter @quiz/skillhubcore-admin type-check`

### Avoiding Circular Dependencies
- Types package NEVER imports from apps
- Apps import from `@quiz/types` (one-way dependency)
- Each agent contract file can reference other contract files in same package (e.g., `workflow.ts` imports from `handoff.ts`, `candidate.ts`, etc.)

### Import Strategy
- **Type-only imports**: Use `import type { ... } from '...'` for types to avoid runtime imports
- **Cross-contract imports**: Use relative paths within `packages/types/src/project-llm/` (e.g., `import type { ComplianceFinding } from './compliance'`)
- **App imports from types**: Use `@quiz/types/project-llm` alias (e.g., `import type { WorkflowRecord } from '@quiz/types/project-llm'`)

### Lint Compliance
- All type files must pass `pnpm lint:all` with `--max-warnings=0`
- No `any` types allowed
- All status enums must be union types (e.g., `type Status = 'A' | 'B' | 'C'`)
- All timestamp fields must be `string` type with comment `// ISO 8601`
- All arrays must have explicit element types (e.g., `findings: ComplianceFinding[]`)

---

## Files to Create (Exact Paths)

### Type Contracts (packages/types/src/project-llm/)
1. `handoff.ts` — Agent F (Handoff Record)
2. `candidate.ts` — Agent G (Candidate Package)
3. `corrections.ts` — Agent I (Corrections)
4. `evidence.ts` — Agent K (Validation) and Agent L (Evidence)
5. `certification.ts` — HAA Certification
6. `workflow.ts` — Complete state machine

### Type Extensions (packages/types/src/project-llm/)
7. `compliance.ts` — Extend with Agent H and Agent J contracts (MODIFY existing file)

### Barrel Export (packages/types/src/project-llm/)
8. `index.ts` — Add new exports (MODIFY existing file)

### Orchestrator (apps/skillhubcore-admin/src/lib/project-llm/)
9. `projectLlmWorkflowCoordinator.ts` — State machine skeleton

### Library Export (apps/skillhubcore-admin/src/lib/project-llm/)
10. `index.ts` — Add coordinator export (MODIFY existing file)

### Documentation (.agents/tasks/)
11. `project-llm-master-orchestration-report.md` — Complete workflow contract document

---

## Verification Checklist

- [ ] All 7 new type files created in `packages/types/src/project-llm/`
- [ ] `compliance.ts` extended with Agent H and J contracts (NOT replaced)
- [ ] `packages/types/src/project-llm/index.ts` exports all new contracts
- [ ] `projectLlmWorkflowCoordinator.ts` created in admin library
- [ ] `apps/skillhubcore-admin/src/lib/project-llm/index.ts` exports coordinator
- [ ] Master orchestration report created in `.agents/tasks/`
- [ ] `pnpm --filter @quiz/types type-check` passes with zero errors
- [ ] `pnpm --filter @quiz/skillhubcore-admin type-check` passes with zero errors
- [ ] `pnpm lint:all` passes with zero warnings
- [ ] No circular dependencies introduced
- [ ] All imports use correct patterns (type imports where appropriate)
- [ ] All status fields are union types, not enums
- [ ] All timestamp fields are strings with ISO 8601 comments
- [ ] All arrays have explicit element types
- [ ] No `any` types present
- [ ] Readonly properties used where appropriate

---

## Key Architectural Invariants

These must remain true throughout implementation:

1. **Types package has no runtime dependencies** — only TypeScript interfaces/types
2. **Agents F-M boundaries are type contracts only** — no implementations in this plan
3. **Gates are readonly status checks** — AI evaluates, never modifies approval
4. **Correction loop is explicit** — G → H → [I → G if FAIL] → J
5. **State machine is deterministic** — given state + gate status, next phase is unambiguous
6. **Workflow coordinator is skeleton only** — defines transitions, not agent logic
7. **All dates are ISO 8601 strings** — no Date objects in contracts
8. **All status fields are union types** — for exhaustiveness checking
9. **Evidence-based pattern** — all records reference source paths/artifacts
10. **Compile-time validation** — mismatches throw errors, no silent failures

---

## Implementation Notes

### Agent F (Handoff Record)
- Receives: CreationBrief (from Agent E)
- Produces: HandoffRecord + GuiPrototype reference
- Gate: GUI_APPROVAL_GATE (blocks until GuiApprovalStatus = 'APPROVED')

### Agent G (Candidate Package)
- Receives: HandoffRecord (post-approval) OR CorrectionPackage (from Agent I)
- Produces: CandidatePackage (React/TypeScript files)
- Status: 'INITIAL' | 'CORRECTED' (to track correction loop iterations)

### Agent H (Compliance Review)
- Receives: CandidatePackage
- Produces: ComplianceReviewRecord
- Verdict: 'PASS' → proceed to J; 'FAIL' → proceed to I

### Agent I (Corrections)
- Receives: ComplianceReviewRecord (with findings)
- Produces: CorrectionPackage (instructions for G)
- Loop: Returns to Agent G, NOT a terminal state

### Agent J (Integration Plan)
- Receives: CandidatePackage (post-compliance)
- Produces: IntegrationPlanRecord
- Status: 'PLANNED' (ready for K to validate)

### Agent K (Validation)
- Receives: IntegrationPlanRecord
- Produces: ValidationRecord (test results)
- Status: 'PASSED' | 'FAILED' (failure may loop back to I or J)

### Agent L (Evidence Package)
- Receives: ValidationRecord
- Produces: EvidencePackage (certification-ready)
- Includes: Test results, artifacts, compliance evidence

### Agent M (Finalize)
- Receives: CertificationPackage (post-HAA approval)
- Produces: Final deployment/merge record
- Gate: HAA_CERTIFICATION_GATE (blocks until CertificationDecision = 'APPROVED')

---

## Success Criteria

This plan is complete when:
1. All 11 files listed above are created/modified
2. All type-checks pass (`pnpm --filter @quiz/types type-check && pnpm --filter @quiz/skillhubcore-admin type-check`)
3. All lints pass (`pnpm lint:all`)
4. Master orchestration report documents the complete workflow contract
5. Workflow coordinator skeleton compiles and exports state machine functions
6. No agent implementations exist yet (only contracts)
7. Future implementers can read the contracts and implement agents F-M independently

---

## What This Plan Does NOT Include (Out of Scope)

- Agent implementations (F through M logic)
- UI components for workflow visualization
- Database schemas for workflow persistence
- API endpoints for workflow execution
- LLM integration for external AI handoff
- Test suites for agent logic (no logic exists yet)
- HAA approval UI/workflow tooling
- Deployment/CI configuration

These are Phase 2+ deliverables after contracts are locked.