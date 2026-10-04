# PROJECT LLM — PHASE 1 IMPLEMENTATION MASTER PROMPT

## 0. EXECUTION AUTHORITY

You are implementing **Project LLM / Project AI Workbench — Phase 1** inside the existing SkillHubCore / Tutorial Engine repository.

The authoritative product contract is:

**`PROJECT_LLM_BLOCK_CREATION_WORKBENCH_SPEC.md` — Revision 2**

Revision 2 is the **locked Phase 1 implementation contract**.

Do not redesign, reinterpret, broaden, or replace the architecture defined by Revision 2.

Your responsibility is to implement the approved contract against the existing repository.

If the repository differs from the assumptions in this prompt, **inspect the repository first** and report the discrepancy before changing architecture.

Do not silently invent replacement architecture.

---

# 1. PRIMARY OBJECTIVE

Implement the first production-quality vertical slice of Project LLM:

> **Existing I1 reference block → Project LLM repository/context analysis → Creation Brief → External AI handoff → I2 candidate intake → compliance review → correction instructions if necessary → integration plan → validation/evidence → `CERTIFICATION_READY` → Human Architecture Authority certification.**

The Phase 1 pilot is:

- **I1 = existing reference block**
- **I2 = new pilot block**

The purpose of the pilot is to prove that Project LLM can safely guide the creation and integration of one new block using an existing reference implementation without bypassing the existing Tutorial Engine architecture.

Do NOT attempt to implement the entire future block-generation platform.

---

# 2. NON-NEGOTIABLE ARCHITECTURE

Project LLM is a:

> **repository-aware AI workbench for block specification, compliance review, integration planning, validation, evidence collection, and certification readiness.**

It is NOT:

- a replacement for Tutorial Composer
- a replacement for Tutorial Page
- an autonomous coding agent
- an autonomous repository mutation system
- an autonomous deployment system
- a replacement for ILS
- an LSNB engine
- an RSSB engine
- a new tutorial runtime
- a second block-rendering architecture
- a new authentication platform
- a generic AI coding IDE

The system must work **with** the existing architecture.

---

# 3. AUTHORITATIVE RESPONSIBILITY MODEL

## 3.1 Project LLM

Project LLM is responsible for:

- repository/context discovery
- architecture-context presentation
- reference block analysis
- Creation Brief generation
- External AI handoff preparation
- candidate intake
- repository-aware compliance review
- correction instruction generation
- integration planning
- validation planning
- evidence collection
- certification-readiness recommendation
- audit trail
- workflow/state management

Project LLM may use an LLM for analysis and recommendations.

Project LLM must NOT autonomously:

- approve architecture
- certify a block
- modify repository files
- commit changes
- push changes
- deploy production
- bypass human approval
- change UBRC
- change ILS architecture
- change LSNB architecture
- change RSSB architecture

---

# 4. HUMAN ARCHITECTURE AUTHORITY

The Human Architecture Authority (HAA) remains the final authority.

There are three governance gates.

## Gate 1 — Pre-Implementation

HAA approves:

- Phase 1 implementation scope
- architecture
- services
- database model
- workflow
- technology choices
- pilot definition
- repository boundaries

Do not bypass Gate 1.

## Gate 2 — Pilot Certification

During the I2 pilot, HAA reviews:

- candidate
- compliance results
- integration plan
- validation evidence
- runtime evidence
- certification package

HAA decides whether I2 becomes certified.

This is the required final gate for the Phase 1 pilot.

## Gate 3 — Post-Pilot

HAA approves:

- Phase 2+
- additional block families
- broader automation
- technology additions
- provider selection expansion
- additional repository capabilities

Do not implement Phase 2 capabilities as hidden Phase 1 features.

---

# 5. TECHNOLOGY CONTRACT

Phase 1 must use:

- Node.js
- TypeScript
- React
- Next.js
- existing SkillHubCore Admin application
- existing project architecture
- existing authentication/authorization
- existing database access patterns
- existing repository conventions

Do NOT introduce Python/FastAPI for Phase 1.

Do NOT create a parallel Python service.

Do NOT introduce a second backend stack.

A future Python/FastAPI service may only be introduced through a new architecture decision and HAA approval if a concrete requirement justifies it.

---

# 6. LLM PROVIDER CONTRACT

Phase 1 uses:

> **ONE operational server-side LLM provider.**

Provider configuration must remain internal.

Do NOT build Phase 1 provider-selection UI.

Do NOT implement a multi-provider abstraction merely for theoretical future use.

The architecture may keep provider integration cleanly isolated so Phase 2 can expand it, but Phase 1 must operate with one approved provider.

The server must own provider credentials.

Never expose provider secrets to the browser.

Never send API keys to the client.

---

# 7. REPOSITORY MUTATION CONTRACT

Project LLM has:

> **NO autonomous repository mutation authority.**

Project LLM may:

- inspect repository evidence
- identify files
- identify patterns
- produce proposed file changes
- produce integration plans
- produce correction instructions
- produce validation commands
- produce evidence requirements

Project LLM must NOT:

- create files
- modify files
- delete files
- commit
- push
- merge
- deploy

Human/authorized engineering tooling performs repository changes.

If the UI contains a future-looking "apply" concept, it must NOT execute repository writes in Phase 1.

Use wording such as:

- "Generate Integration Plan"
- "Generate Correction Instructions"
- "Copy Plan"
- "Export Plan"

Do not present autonomous repository mutation as a Phase 1 capability.

---

# 8. PRODUCTION DEPLOYMENT CONTRACT

Project LLM must never autonomously deploy production.

The production lifecycle is:

```text
Project LLM
    ↓
CERTIFICATION_READY recommendation
    ↓
Human Architecture Authority
    ↓
CERTIFIED
    ↓
Human executes deployment
    ↓
Production verification
```

The I2 pilot may only be deployed by a human after HAA certification.

---

# 9. PROJECT LLM WORKSPACE ARCHITECTURE

The system consists of:

## Global surfaces

1. Project LLM Dashboard
2. Settings / Provider Configuration

## Integrated Block Request Workspace

The following are tabs/panels within one Block Request workspace:

3. New Block Request
4. Repository / Architecture Context
5. Creation Brief
6. External AI Handoff
7. Candidate Intake
8. Compliance Review
9. Correction Instructions
10. Integration Plan
11. Validation & Evidence
12. Certification Review

Do NOT implement these as twelve unrelated applications.

They belong to a single workflow.

---

# 10. CORE WORKFLOW STATE MACHINE

Implement explicit workflow state.

At minimum support:

```text
REQUEST_CREATED
    ↓
CONTEXT_READY
    ↓
BRIEF_READY
    ↓
EXTERNAL_AI_HANDOFF_READY
    ↓
CANDIDATE_RECEIVED
    ↓
COMPLIANCE_REVIEW
    ↓
COMPLIANCE_FAILED
    ↓
CORRECTION_REQUIRED
    ↓
CORRECTION_READY
    ↓
CANDIDATE_RESUBMITTED
    ↓
COMPLIANCE_REVIEW
```

Successful path:

```text
COMPLIANCE_REVIEW
    ↓
COMPLIANCE_PASSED
    ↓
INTEGRATION_PLANNED
    ↓
VALIDATION
    ↓
EVIDENCE_COLLECTED
    ↓
CERTIFICATION_READY
    ↓
HAA_CERTIFIED
```

The UI and database must preserve these states.

Do not collapse them into a generic "completed" state.

---

# 11. PILOT IDENTITIES

Phase 1 pilot:

### Reference

```text
I1
```

I1 is an existing block used as the reference implementation.

### Candidate

```text
I2
```

I2 is the new pilot block.

Do not treat I1 as a Project LLM-generated block.

I1 predates Project LLM.

The dashboard must therefore NOT falsely report I1 as "Recently Certified by Project LLM."

The pilot relationship is:

```text
I1
Existing Reference
      ↓
Project LLM Analysis
      ↓
Creation Brief
      ↓
External AI
      ↓
I2
New Candidate
```

---

# 12. BLOCK FAMILY SCOPE

Phase 1 is deliberately narrow.

Implement the pilot for:

> I1 reference → I2 candidate.

Do not build support for:

- I3+
- all future block families
- all 18 block families
- generalized autonomous block generation
- generalized multi-agent coding
- automated repository mutation

Those belong to future phases unless explicitly approved.

---

# 13. REPOSITORY INTELLIGENCE

Before implementing the workflow, inspect the actual repository.

Discover and document evidence for:

- existing block types
- TutorialBlock union/types
- canonical TutorialDocument
- block registry
- TutorialBlockRenderer
- Composer registration
- editor registration
- builder/normalizer
- save/publish flow
- Tutorial Page rendering
- theme/brand resolution
- ActiveBlockProvider
- ILSProvider
- BlockTelemetryProvider
- LSNB integration
- RSSB / LearningProgressSidebar
- existing tests
- existing certification/evidence mechanisms
- existing auth/authz
- existing database conventions
- existing SkillHubCore Admin patterns

Repository discovery must be:

> **evidence-based**

Never claim a file, component, endpoint, table, or contract exists merely because it is expected.

Every important architectural discovery should record:

- repository path
- symbol/component
- purpose
- evidence
- relevance to I2

---

# 14. REFERENCE BLOCK ANALYSIS

Project LLM must inspect I1 as an actual repository artifact.

Extract:

- component structure
- TypeScript types
- data model
- content JSON shape
- rendering behavior
- styling conventions
- responsive behavior
- accessibility patterns
- DOM identity
- theme handling
- registry integration
- Composer integration
- builder/normalizer requirements
- telemetry integration
- tests
- runtime dependencies

Separate:

### Pattern

What I2 should learn from I1.

### Dependency

What I2 actually depends on.

### Legacy behavior

What exists in I1 but should NOT be copied.

### Runtime contract

What must remain compatible with the current platform.

Do not blindly clone I1.

---

# 15. CREATION BRIEF

The Creation Brief is the primary artifact handed to the External AI.

It must contain:

## Block identity

- block ID
- block family
- version
- pilot identifier
- reference block

## Product intent

- purpose
- learner outcome
- placement
- expected interaction

## Visual requirements

- layout
- hierarchy
- typography
- spacing
- responsive behavior
- accessibility expectations
- brand constraints

## Content/data requirements

- JSON structure
- required fields
- optional fields
- validation requirements
- example data

## Runtime requirements

- DOM identity
- theme handling
- renderer expectations
- Composer expectations
- canonical document compatibility
- ILS compatibility
- RSSB compatibility
- LSNB compatibility

## Explicit prohibitions

The brief must tell the External AI:

- do not create ILS
- do not call ILS APIs directly
- do not create LSNB
- do not create RSSB
- do not create new telemetry infrastructure
- do not modify auth
- do not modify DB architecture unless explicitly required
- do not create a parallel block architecture
- do not introduce a new theme system
- do not invent unsupported runtime APIs

---

# 16. EXTERNAL AI HANDOFF

Project LLM must generate a copyable External AI prompt.

The handoff must include:

1. objective
2. reference block
3. repository-derived constraints
4. visual requirements
5. data contract
6. runtime contract
7. explicit prohibitions
8. expected deliverable
9. acceptance criteria

The External AI should first produce:

```text
HTML
CSS
JavaScript
JSON data
```

for visual review.

Human reviews the GUI.

Only after GUI approval should the External AI produce:

```text
React
TypeScript
```

candidate implementation.

Do not merge these stages into one automatic process.

---

# 17. CANDIDATE INTAKE

Candidate Intake must accept the human-returned candidate.

The system should record:

- candidate identity
- block type
- candidate version
- source/handoff ID
- submitted files/content
- submission timestamp
- author/source metadata
- reference I1
- target I2
- current workflow state

Candidate intake is an evidence boundary.

Do not assume the candidate is compliant merely because it was generated by an external AI.

---

# 18. COMPLIANCE REVIEW

Compliance Review is one of the most important Phase 1 capabilities.

The review must inspect:

## Architecture

- correct block model
- current tutorial architecture
- no deprecated six-block assumptions
- correct canonical document compatibility

## React/TypeScript

- correct component structure
- correct types
- no unnecessary architecture
- no unsafe assumptions

## DOM contract

Verify:

```text
data-block-id
data-block-type
data-block-version
```

where required by the current runtime contract.

## Runtime

Verify compatibility with:

- TutorialBlockRenderer
- Tutorial Page
- ActiveBlockProvider
- ILSProvider
- BlockTelemetryProvider
- LSNB
- RSSB

## Telemetry

The block must NOT directly own telemetry infrastructure.

The page/runtime owns telemetry.

## Brand

Verify:

- RTH compatibility
- SkillUp compatibility
- no hardcoded brand identity
- runtime theme resolution
- semantic content/data

## Accessibility

Verify applicable:

- semantic HTML
- keyboard behavior
- focus behavior
- ARIA
- contrast
- responsive behavior

## Testing

Verify required tests exist or are planned.

---

# 19. COMPLIANCE RESULT

Compliance Review must produce:

```text
PASS
```

or

```text
FAIL
```

Do not use vague confidence percentages as a governance decision.

If FAIL:

```text
COMPLIANCE_FAILED
    ↓
CORRECTION_REQUIRED
```

Generate explicit correction instructions.

If PASS:

```text
COMPLIANCE_PASSED
    ↓
INTEGRATION_PLANNED
```

The LLM can assess and recommend.

The LLM cannot certify.

---

# 20. CORRECTION INSTRUCTIONS

Correction Instructions must be actionable.

Each correction should contain:

- issue ID
- severity
- category
- evidence
- affected file/component
- problem
- required correction
- rationale
- acceptance criterion

Example:

```text
CR-001

Category:
Runtime Contract

Severity:
BLOCKING

Evidence:
Candidate component does not expose required block identity attributes.

Required correction:
Add data-block-id, data-block-type, and data-block-version
using the existing block identity supplied by the page/runtime.

Do not:
Create a new telemetry provider.

Acceptance:
The rendered root block element exposes the required runtime identity
without introducing a new telemetry mechanism.
```

Do not allow the correction engine to invent architectural changes.

---

# 21. INTEGRATION PLAN

The Integration Plan is:

> descriptive, reviewable, and human-executable.

It must identify:

- files to add
- files to modify
- components to register
- types to extend
- registry changes
- renderer changes
- Composer changes
- builder/normalizer changes
- tests
- migration requirements if any
- runtime verification
- rollback considerations

The plan must NOT execute these changes.

Human engineering performs them.

---

# 22. EXISTING RUNTIME CONTRACTS

Treat the following as existing platform infrastructure.

Do NOT recreate them inside I2.

## ILS

Existing telemetry infrastructure includes:

- `ils_block_visits`
- `ils_block_active_time`
- `block_learning_state`
- relevant ILS APIs
- existing page-level providers

## LSNB

Learning Session Navigation Behavior is page/navigation-level.

Do not implement LSNB inside the block.

## RSSB

RSSB / LearningProgressSidebar consumes learning state.

Do not implement RSSB inside the block.

## Universal Block Runtime Contract

The new block must be a passive runtime participant.

It must integrate with the existing page/runtime infrastructure.

---

# 23. BLOCK PASSIVITY RULE

I2 must NOT:

- call ILS endpoints directly
- create telemetry providers
- create session management
- create LSNB
- create RSSB
- create independent learning state
- create duplicate navigation state
- create independent completion infrastructure

I2 should receive runtime context from the existing platform.

The architecture must remain:

```text
Tutorial Page
    ↓
Page-level providers
    ↓
Universal runtime
    ↓
I2 Block
```

not:

```text
I2 Block
    ↓
new telemetry system
    ↓
new learning system
    ↓
new navigation system
```

---

# 24. VALIDATION

Validation must cover at least:

## Static

- TypeScript
- lint
- build
- schema validation
- component tests

## Integration

- registry
- renderer
- Composer
- save
- publish
- canonical TutorialDocument
- Tutorial Page

## Runtime

Verify:

- block renders
- DOM identity
- active block behavior
- ILS telemetry
- learning state
- RSSB visibility
- navigation
- responsive behavior
- accessibility

## Brand

Run against:

- SkillUp
- Real Tutorial Hub

The same block implementation must remain valid across both brands.

---

# 25. EVIDENCE PACKAGE

Validation must generate structured evidence.

Evidence should include:

- evidence ID
- evidence version
- evidence type
- source
- timestamp
- result
- relevant artifact
- validation output
- repository path where applicable
- test result
- runtime result
- screenshots or other evidence where applicable
- certification relationship

Evidence packages are versioned.

Once the workflow reaches:

```text
CERTIFICATION_READY
```

the relevant evidence package becomes frozen.

Record:

- evidence ID
- evidence version
- frozen status
- frozenAt
- certification ID when available

Do not mutate frozen evidence.

If new corrections are required after freeze:

> create a new evidence package/version.

Retain previous versions in the audit trail.

---

# 26. CERTIFICATION

Project LLM can recommend:

```text
CERTIFICATION_READY
```

Project LLM cannot mark the block:

```text
CERTIFIED
```

Only HAA can certify.

The Certification Review screen must clearly distinguish:

### AI assessment

from

### Human decision.

The final state transition must be human-authorized.

---

# 27. AUDIT TRAIL

Every important workflow action must be auditable.

Record:

- actor
- action
- timestamp
- previous state
- new state
- reason where applicable
- artifact/version
- evidence relationship

AI recommendations must be distinguishable from human decisions.

Human overrides must require a reason.

Never hide an override.

---

# 28. OVERRIDE GOVERNANCE

If HAA or an authorized human overrides an AI recommendation:

require:

```text
overrideReason
```

and create an audit record.

Never represent an override as if the AI originally recommended the final outcome.

---

# 29. STOP CONDITIONS

The workflow must STOP rather than guess when:

- required repository evidence is unavailable
- reference implementation cannot be verified
- required runtime contract cannot be located
- candidate architecture conflicts with the repository
- required integration point cannot be confirmed
- compliance cannot be evaluated from evidence
- a required schema/type is ambiguous
- implementation would require an architecture change
- implementation would require changing ILS/LSNB/RSSB
- a new technology is required but not approved
- provider configuration is unavailable
- certification evidence is incomplete

STOP means:

> request human resolution with explicit evidence and reason.

Do not use a percentage confidence score as a substitute for a STOP decision.

---

# 30. DATABASE IMPLEMENTATION

Implement the database schema required by Revision 2.

The specification defines the Phase 1 data model.

Maintain the approved table count:

> **8 tables/interfaces as defined by Revision 2.**

Do not silently add additional persistent entities merely because they appear convenient.

Before creating migrations:

1. inspect existing schema conventions
2. inspect existing IDs
3. inspect timestamps
4. inspect audit conventions
5. inspect enums/status conventions
6. inspect existing authorization patterns
7. confirm no existing table already provides the required responsibility

Avoid duplication.

---

# 31. AUTHENTICATION AND AUTHORIZATION

Reuse existing SkillHubCore authentication and authorization.

Do not build a new auth system.

Project LLM actions must respect the existing admin/security model.

At minimum distinguish:

- authenticated Project LLM user
- authorized engineering user
- HAA
- read-only/reviewer where applicable

Human certification must be authorization-protected.

Do not expose repository intelligence or provider secrets to unauthorized clients.

---

# 32. UI IMPLEMENTATION

Use:

- React
- TypeScript
- existing Tailwind/UI primitives
- existing SkillHubCore Admin patterns

Visual requirements:

- white/light background
- professional enterprise SaaS
- Inter typography
- deep navy text
- SUIA pink accent
- no gradients
- no dark theme
- no decorative dashboard noise
- strong hierarchy
- clear workflow state
- explicit governance boundaries

The UI should communicate:

```text
AI recommends
Human decides
```

through labels, badges, buttons, and status indicators.

Do not create a misleading "AI Certified" button.

---

# 33. DASHBOARD

Dashboard should show:

- active block requests
- workflow status
- I2 pilot progress
- compliance status
- correction status
- validation status
- certification readiness
- pending HAA action

"Recently Certified" should refer to Project LLM outputs.

Do not display I1 as if Project LLM certified it.

The I2 pilot is the first Project LLM certification candidate.

---

# 34. CREATION REQUEST UI

The New Block Request flow should collect:

- block family
- target block identity
- reference block
- purpose
- learner intent
- visual requirements
- content/data requirements
- special constraints
- pilot metadata

For Phase 1, constrain the user to the approved I1 → I2 pilot where appropriate.

Do not expose future block-family functionality prematurely.

---

# 35. REPOSITORY CONTEXT UI

Show:

- detected repository paths
- components
- types
- registry
- renderer
- Composer
- runtime providers
- tests
- relevant database objects
- evidence

Each discovery should have a source/path.

Avoid unsupported claims.

---

# 36. CREATION BRIEF UI

Provide:

- structured brief
- human-readable view
- machine-readable view if required
- copy button
- version
- generation timestamp
- source evidence
- reference block
- acceptance criteria

Human should be able to review before sending to External AI.

---

# 37. EXTERNAL AI HANDOFF UI

Provide:

- generated prompt
- copy button
- reference summary
- deliverable checklist
- constraints
- prohibited behavior
- expected response format

The system should explicitly show:

```text
Stage 1:
HTML/CSS/JS/JSON prototype

Human GUI Approval

Stage 2:
React/TypeScript candidate
```

Do not skip the human GUI approval checkpoint.

---

# 38. CANDIDATE INTAKE UI

Provide a clear submission mechanism.

Display:

- candidate version
- source
- files/artifacts
- reference
- submitted time
- current workflow state

Then expose:

```text
Start Compliance Review
```

Do not automatically certify.

---

# 39. COMPLIANCE MATRIX UI

Use categories such as:

| Category | Status | Evidence | Severity |
|---|---|---|---|
| Architecture | PASS/FAIL | repository evidence | blocking/non-blocking |
| Type System | PASS/FAIL | files/types | ... |
| DOM Contract | PASS/FAIL | rendered source | ... |
| Runtime | PASS/FAIL | runtime evidence | ... |
| ILS | PASS/FAIL | integration evidence | ... |
| LSNB | PASS/FAIL | page evidence | ... |
| RSSB | PASS/FAIL | page evidence | ... |
| Brand | PASS/FAIL | runtime evidence | ... |
| Accessibility | PASS/FAIL | test evidence | ... |
| Tests | PASS/FAIL | test output | ... |

The exact final matrix should follow Revision 2 and repository evidence.

---

# 40. INTEGRATION PLAN UI

Show a human-readable implementation plan.

For each file:

- action
- reason
- dependency
- expected result
- validation

Example:

```text
packages/ui/.../TutorialBlock.tsx

Action:
Modify

Reason:
Register I2 in the canonical block union.

Validation:
TypeScript + renderer test + Composer render.
```

Do not provide an "Execute Changes" button in Phase 1.

---

# 41. VALIDATION & EVIDENCE UI

Show:

- validation checks
- current result
- logs/output
- evidence attachments
- failed checks
- rerun requirements
- evidence version
- frozen status

The user must be able to see exactly why the system recommends `CERTIFICATION_READY`.

---

# 42. CERTIFICATION REVIEW UI

Certification page must clearly display:

## AI recommendation

```text
CERTIFICATION_READY
```

## Evidence

List all required evidence.

## Outstanding issues

Show none, or explicitly list them.

## Human decision

Provide:

```text
CERTIFY
```

or

```text
REJECT / REQUEST CHANGES
```

If rejected:

require a reason.

The certification action must be authorized and audited.

---

# 43. IMPLEMENTATION SEQUENCE

Do NOT build the application screen-by-screen in isolation.

Implement as a vertical slice.

## Step 1 — Repository reconnaissance

Inspect the repository.

Produce:

```text
PHASE1_REPOSITORY_BASELINE.md
```

containing:

- relevant paths
- architecture findings
- existing runtime contracts
- existing auth
- existing DB patterns
- existing UI patterns
- I1 location
- integration points
- risks
- unknowns

STOP if critical architecture cannot be confirmed.

---

## Step 2 — Phase 1 foundation

Implement:

- Project LLM domain types
- workflow state model
- authorization model
- audit model
- evidence model
- request model
- basic persistence
- server-side LLM provider integration
- API boundaries

Do not build future features.

---

## Step 3 — New Block Request

Implement request creation.

User creates:

```text
I2 pilot request
reference = I1
```

Persist request.

---

## Step 4 — Repository Context

Implement repository evidence collection/display.

Do not make unsupported assumptions.

---

## Step 5 — Creation Brief

Generate the I1 → I2 Creation Brief.

Human can review/edit/approve the brief for External AI handoff.

---

## Step 6 — External AI Handoff

Generate the external AI prompt.

Support copy/export.

Do not invoke arbitrary external AI automatically unless explicitly approved and integrated.

---

## Step 7 — Candidate Intake

Human submits the I2 candidate.

Persist candidate and version.

---

## Step 8 — Compliance Review

Run the compliance checks.

Produce:

```text
PASS
```

or

```text
FAIL
```

with evidence.

---

## Step 9 — Correction Loop

If FAIL:

generate correction instructions.

Allow resubmission.

Repeat compliance review.

---

## Step 10 — Integration Plan

Once PASS:

generate descriptive integration plan.

No repository mutation.

---

## Step 11 — Validation

Human implements the plan.

Project LLM validates the resulting implementation using repository/runtime evidence.

---

## Step 12 — Evidence

Collect and freeze the certification evidence.

---

## Step 13 — Certification Ready

If all required gates pass:

```text
CERTIFICATION_READY
```

---

## Step 14 — HAA Certification

HAA makes the final decision.

Only after certification can human deployment occur.

---

# 44. IMPLEMENTATION DISCIPLINE

Before every significant change ask:

1. Is this required by Revision 2?
2. Is this already implemented elsewhere?
3. Does this duplicate an existing platform contract?
4. Does this cross the runtime boundary?
5. Does this require HAA approval?
6. Does this expand Phase 1 scope?
7. Can the same outcome be achieved using existing infrastructure?

If the change modifies:

- ILS
- LSNB
- RSSB
- authentication
- authorization architecture
- Tutorial Composer authority
- deployment authority
- repository mutation authority
- provider architecture
- technology stack

STOP and request architectural resolution.

---

# 45. NO SILENT ARCHITECTURE DRIFT

Never silently:

- add Python
- add FastAPI
- add another database
- add another telemetry system
- add another block renderer
- add another Composer
- add another tutorial runtime
- add autonomous Git operations
- add autonomous deployment
- add multi-provider support
- expand to all block families
- bypass HAA

If a requirement appears to require any of these:

```text
STOP
→ document discrepancy
→ show evidence
→ propose options
→ request HAA decision
```

---

# 46. TESTING REQUIREMENT

Every implemented workflow stage must have appropriate tests.

At minimum:

### Unit

- state transitions
- authorization
- evidence versioning
- compliance result handling
- audit trail
- provider boundary

### Integration

- request persistence
- candidate intake
- workflow transitions
- compliance
- correction loop
- evidence
- certification

### UI

- request creation
- brief display
- candidate intake
- compliance matrix
- integration plan
- validation
- certification gate

### Runtime

- I2 rendering
- Tutorial Page
- ILS
- RSSB
- LSNB
- brand runtime
- save/publish

---

# 47. SECURITY REQUIREMENTS

Never expose:

- LLM provider secrets
- internal repository credentials
- database credentials
- internal tokens
- privileged GitHub credentials

Validate all client-provided identifiers.

Do not trust workflow state transitions from the browser.

Server must enforce:

- authorization
- state transition rules
- certification permissions
- evidence freeze
- audit creation

---

# 48. OBSERVABILITY

Log meaningful workflow events.

Examples:

```text
PROJECT_LLM_REQUEST_CREATED
PROJECT_LLM_CONTEXT_GENERATED
PROJECT_LLM_BRIEF_GENERATED
PROJECT_LLM_CANDIDATE_RECEIVED
PROJECT_LLM_COMPLIANCE_STARTED
PROJECT_LLM_COMPLIANCE_FAILED
PROJECT_LLM_CORRECTION_GENERATED
PROJECT_LLM_COMPLIANCE_PASSED
PROJECT_LLM_INTEGRATION_PLAN_GENERATED
PROJECT_LLM_VALIDATION_COMPLETED
PROJECT_LLM_CERTIFICATION_READY
PROJECT_LLM_HAA_CERTIFIED
```

Do not log secrets or sensitive provider payloads unnecessarily.

---

# 49. DELIVERABLES

Phase 1 implementation should produce the following major deliverables:

1. Project LLM foundation
2. Workflow/state engine
3. Repository intelligence
4. Creation Brief system
5. External AI handoff
6. Candidate Intake
7. Compliance Review
8. Correction / Integration / Validation / Certification workflow

Keep the implementation aligned with the Revision 2 approved deliverable structure.

Do not create additional product scope simply to increase the apparent feature count.

---

# 50. REQUIRED ENGINEERING DOCUMENTATION

During implementation create or update:

```text
PHASE1_REPOSITORY_BASELINE.md
PHASE1_IMPLEMENTATION_PLAN.md
PHASE1_ARCHITECTURE_DECISIONS.md
PHASE1_VALIDATION_REPORT.md
PHASE1_I2_CERTIFICATION_EVIDENCE.md
```

Only create additional documents when they provide real implementation value.

---

# 51. PHASE 1 ACCEPTANCE CRITERIA

Phase 1 is successful when the following complete end-to-end path works:

```text
I1 existing reference
        ↓
New I2 request
        ↓
Repository context
        ↓
Creation Brief
        ↓
External AI handoff
        ↓
Human GUI approval
        ↓
React/TS I2 candidate
        ↓
Candidate Intake
        ↓
Compliance Review
        ↓
PASS
        ↓
Integration Plan
        ↓
Human implementation
        ↓
Validation
        ↓
Evidence Package
        ↓
CERTIFICATION_READY
        ↓
HAA review
        ↓
CERTIFIED
        ↓
Human deployment
```

The pilot does NOT require autonomous code generation, autonomous repository modification, autonomous certification, or autonomous deployment.

---

# 52. DEFINITION OF DONE

Do not declare Phase 1 complete merely because the UI renders.

Phase 1 is complete only when:

- Project LLM workspace works
- I1 reference is correctly represented
- I2 request can be created
- repository evidence can be collected
- Creation Brief can be generated
- External AI handoff can be generated
- I2 candidate can be submitted
- compliance can PASS/FAIL
- correction loop works
- integration plan is generated
- human implementation can be validated
- evidence can be collected
- evidence can be frozen
- `CERTIFICATION_READY` can be reached
- HAA certification is enforced
- certification is audited
- production deployment remains human-controlled
- I2 integrates with the existing Tutorial Engine
- I2 works with existing ILS
- I2 works with existing LSNB
- I2 works with existing RSSB
- I2 works for both RTH and SkillUp runtime contexts
- no existing runtime architecture was duplicated
- tests pass
- security boundaries pass
- no unauthorized repository mutation occurred

---

# 53. FAILURE / ESCALATION RULE

If implementation encounters an architectural conflict, do NOT solve it by inventing a new architecture.

Return:

```text
ARCHITECTURE STOP

Issue:
<precise issue>

Repository Evidence:
<paths/symbols>

Revision 2 Requirement:
<relevant requirement>

Conflict:
<why implementation cannot safely continue>

Impact:
<what would need to change>

Options:
A. <option>
B. <option>

Recommendation:
<recommendation>

Required Decision:
HAA
```

Wait for human architectural resolution.

---

# 54. FIRST RESPONSE REQUIRED FROM THE IMPLEMENTATION AI

Before writing production code, respond with:

## A. Repository Baseline

List the actual repository paths and symbols discovered.

## B. Revision 2 Mapping

Map each Phase 1 contract area to the repository implementation location.

## C. Existing Runtime Contracts

Identify the actual implementation of:

- TutorialBlock
- TutorialBlockRenderer
- Composer
- TutorialDocument
- ILS
- LSNB
- RSSB
- authentication
- authorization

## D. I1 Reference

Identify the exact I1 implementation.

## E. I2 Integration Surface

List every file/module that will likely need to participate.

## F. Phase 1 Implementation Plan

Provide a vertical-slice plan.

## G. Risks

List only evidence-backed risks.

## H. STOP Conditions

Identify anything that requires HAA clarification.

Do not start broad implementation until this baseline is reviewed.

---

# 55. FINAL OPERATING PRINCIPLE

The implementation must preserve this hierarchy:

```text
Human Architecture Authority
            ↓
Revision 2 Contract
            ↓
Project LLM Workflow
            ↓
Repository Evidence
            ↓
AI Recommendation
            ↓
Human Engineering Execution
            ↓
Validation
            ↓
HAA Certification
            ↓
Human Deployment
```

The most important rule is:

> **Project LLM is an intelligent, repository-aware implementation and certification workbench — not an autonomous owner of the repository or production system.**

The Phase 1 objective is not to build the final autonomous AI platform.

The objective is to prove, safely and measurably, that:

> **I1 can serve as a verified reference, Project LLM can guide creation of I2, the candidate can be reviewed against the existing architecture, the human can implement the integration plan, the result can be validated, evidence can be frozen, and HAA can certify the resulting I2 block without compromising UBRC, ILS, LSNB, RSSB, Composer, Tutorial Page, authentication, or deployment governance.**

---

**END OF MASTER IMPLEMENTATION PROMPT**
