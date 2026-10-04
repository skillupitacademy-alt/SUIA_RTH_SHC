# PROJECT LLM WORKFLOW AGENT ROADMAP

**Document Type:** Implementation Roadmap / Workflow-Agent Execution Plan  
**Date:** 2026-10-04  
**Repository:** `E:\onlinewebsites\quiz-platform`  
**Latest Checked Commit:** `7fa4267a` — `refactor: Migrate investigation/reconciliation reports to canonical docs location`  
**Status:** READY TO USE AS PHASE 1 IMPLEMENTATION ORCHESTRATION PLAN  

---

## 1. Purpose

This roadmap divides Project LLM implementation into multiple workflow-agent streams.

Project LLM will be created as a project-specific AI workbench for educational block creation. It will support Tutorial Composer and produce candidates that remain compatible with:

- UBRC
- Tutorial Composer
- TutorialDocument
- Tutorial Page runtime
- ILS passive runtime participation
- LSNB navigation/progress consumption
- RSSB runtime/progress consumption
- SkillUp and RTH brand/theme behavior

Project LLM must not become a general ChatGPT clone. It must be a controlled project-aware AI workbench for creating, reviewing, correcting, integrating, validating, and certifying Tutorial Page blocks.

---

## 2. Confirmed Implementation Home

The implementation should begin inside the existing Node.js / TypeScript / React stack.

Primary app:

```text
apps/skillhubcore-admin
```

Primary neighboring systems:

```text
apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content
apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-block-composer
apps/skillhubcore-admin/src/app/api/tutorial-composer
packages/types/src/tutorial-composer
packages/types/src/tutorial-rich-document
packages/ui/src/tutorial/blocks
packages/db-tutorial/src/services
```

Project LLM Phase 1 must extend these systems. It must not create a separate Python/FastAPI service.

---

## 3. Correct System Understanding

The implementation goal is:

```text
Project LLM Workbench
    ↓
Repository-aware block creation brief
    ↓
External AI creates HTML/CSS/JS/JSON prototype
    ↓
Human approves GUI
    ↓
External AI creates React/TypeScript candidate
    ↓
Project LLM ingests candidate
    ↓
Compliance review against UBRC / Composer / ILS / LSNB / RSSB
    ↓
Correction instructions
    ↓
Integration plan
    ↓
Validation and evidence
    ↓
HAA certification decision
```

The block will be used by Tutorial Composer, and after integration the canonical TutorialDocument/Tutorial Page path allows ILS, LSNB, RSSB, and UBRC to recognize/consume it.

Project LLM does not directly create ILS, LSNB, RSSB, or UBRC architecture. It verifies that the candidate block participates correctly in those existing architectures.

---

## 4. Workflow-Agent Model

Implementation should be divided across the following workflow agents.

These are execution roles for AI-assisted implementation. A single AI model can perform them sequentially, but each agent must produce its own bounded deliverables and evidence.

---

## 5. Agent A — Repository Cartographer

**Mission:** Build exact implementation map before code changes.

**Inputs:**

- Workbench spec
- Gate-1 readiness review
- existing Tutorial Composer directories
- registry files
- API routes
- existing block implementations

**Tasks:**

1. Map current admin routing and sidebar navigation.
2. Map Tutorial Page Content tool structure.
3. Map Tutorial Composer APIs.
4. Map block registries and examples.
5. Map existing I1/C1/D1 implementation patterns.
6. Identify exact insertion points for Project LLM workbench.

**Deliverables:**

```text
PROJECT_LLM_AGENT_A_REPOSITORY_IMPLEMENTATION_MAP.md
```

**Exit Criteria:**

- Exact directories identified
- Exact route path proposed
- Exact shared components/patterns identified
- No guessed architecture

---

## 6. Agent B — Workbench Shell Builder

**Mission:** Create the first Project LLM UI shell inside SkillHubCore Admin.

**Likely route:**

```text
apps/skillhubcore-admin/src/app/(admin)/tools/project-llm
```

**Tasks:**

1. Add Project LLM admin route.
2. Add left sidebar entry.
3. Create workbench layout.
4. Add read-only dashboard.
5. Add workflow status panel.
6. Add links/placeholders for the 12 workbench screens.

**Screens in shell:**

```text
Dashboard
New Block Request
Repository Context
Creation Brief Builder
External AI Handoff
Candidate Intake
Compliance Review
Correction Instructions
Integration Plan
Validation & Evidence
Certification Review
Settings
```

**Deliverables:**

```text
apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx
apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/components/*
sidebar navigation update
```

**Exit Criteria:**

- Project LLM route loads
- UI is consistent with admin app
- No backend mutation
- No LLM provider integration yet

---

## 7. Agent C — Project LLM Domain Contracts

**Mission:** Define TypeScript contracts for the workbench workflow.

**Likely location:**

```text
packages/types/src/project-llm
```

or, if the repo prefers app-local contracts first:

```text
apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/contracts
```

**Tasks:**

1. Define request lifecycle states.
2. Define block family/version references.
3. Define repository context contracts.
4. Define creation brief contracts.
5. Define candidate intake contracts.
6. Define compliance review contracts.
7. Define correction/integration/evidence contracts.
8. Define HAA approval status contracts.

**Key status vocabulary:**

```text
DOCUMENTED
DESIGNED
PROTOTYPED
IMPLEMENTED
RUNTIME_INTEGRATED
VALIDATED
CERTIFIED
UNKNOWN
```

**Exit Criteria:**

- Zod schemas or typed contracts exist
- States align with workbench spec
- Contracts do not imply autonomous certification

---

## 8. Agent D — Repository Intelligence Service

**Mission:** Expose read-only project intelligence to the workbench.

**Tasks:**

1. Load canonical Project LLM docs.
2. Load 18-family registry summary.
3. Load family/version matrix summary.
4. Load component provenance summary.
5. Load runtime compliance summary.
6. Expose I1/C1/D1 reference patterns.
7. Expose S1 warning as non-reference-quality.

**Possible Phase 1 implementation style:**

```text
static TypeScript intelligence fixtures derived from docs
```

Do not add vector DB or semantic search in Phase 1.

**Deliverables:**

```text
projectLlmRepositoryIntelligence.ts
projectLlmBlockCorpus.ts
projectLlmReferencePatterns.ts
```

**Exit Criteria:**

- UI can display repository context
- I1 is visible as Introduction reference
- I2 is visible as pilot target
- ILS/LSNB/RSSB/UBRC expectations are visible

---

## 9. Agent E — Creation Brief Engine

**Mission:** Generate the Project LLM handoff brief for External AI.

**Tasks:**

1. Build New Block Request form.
2. Generate I2 creation brief from I1 reference and matrices.
3. Include GUI prototype instructions.
4. Include human GUI approval requirement.
5. Include React/TypeScript conversion instructions after approval.
6. Include forbidden actions.
7. Include compliance checklist.

**Brief must tell External AI:**

```text
First create HTML/CSS/JS/JSON GUI prototype.
Wait for human GUI approval.
Only after approval create React/TypeScript candidate files.
Do not modify UBRC, ILS, LSNB, RSSB, Composer, database, or platform architecture.
```

**Exit Criteria:**

- Human can copy brief to ChatGPT/Gemini/Claude
- Brief is complete enough for candidate block creation
- Brief is brand-independent

---

## 10. Agent F — External AI Handoff Workspace

**Mission:** Support the human copy/paste workflow with External AI.

**Tasks:**

1. Show generated brief.
2. Provide copy button.
3. Track handoff status.
4. Track GUI approval status.
5. Capture external AI provider name.
6. Capture notes and decision.

**Phase 1 boundary:**

```text
Project LLM does not call external free AI websites directly.
Human performs handoff manually.
```

**Exit Criteria:**

- Human can record GUI approved / rejected / needs correction
- Candidate intake is blocked until GUI approval is marked

---

## 11. Agent G — Candidate Intake

**Mission:** Accept candidate artifacts returned from External AI.

**Tasks:**

1. Accept pasted file list.
2. Accept pasted React/TypeScript code.
3. Accept candidate JSON/data contract.
4. Accept notes about GUI approval.
5. Normalize candidate into review package.
6. Do read-only validation first.

**Phase 1 boundary:**

```text
Candidate intake does not auto-write files into production paths.
```

**Exit Criteria:**

- Candidate package can be reviewed
- Missing artifacts are identified
- Human sees exact candidate status

---

## 12. Agent H — Compliance Review Engine

**Mission:** Review candidate against repository rules.

**Review categories:**

```text
Architecture
Block family/version
Tutorial Composer
TutorialDocument
Tutorial Page Renderer
UBRC DOM identity
ILS passive runtime participation
LSNB relationship
RSSB relationship
Multi-brand theme
Security
Accessibility
Testing
Evidence
```

**Checks must include:**

- No direct ILS API calls inside block
- No sidebar/progress UI inside block
- No RSSB infrastructure inside block
- No brand hardcoding
- UBRC attributes present
- Version identity present
- Composer registry impact identified
- TutorialDocument schema impact identified
- Test plan identified

**Exit Criteria:**

- Candidate receives PASS / FAIL / WARNING / UNKNOWN findings
- Findings are evidence-linked
- Project LLM does not certify by itself

---

## 13. Agent I — Correction Instruction Engine

**Mission:** Convert compliance findings into precise instructions for External AI or human implementation.

**Tasks:**

1. Group findings by severity.
2. Generate external AI correction prompt.
3. Generate human implementation notes.
4. Preserve original intent and GUI approval.
5. Separate required corrections from improvements.

**Exit Criteria:**

- Human can send correction prompt to External AI
- Corrections do not ask External AI to modify platform architecture

---

## 14. Agent J — Integration Planner

**Mission:** Produce a controlled integration plan for approved candidate artifacts.

**Tasks:**

1. Identify files to add.
2. Identify files to update.
3. Identify registry changes.
4. Identify type/schema changes.
5. Identify renderer changes if required.
6. Identify tests to add/update.
7. Identify evidence to collect.

**Phase 1 boundary:**

```text
Integration plan is generated before code mutation.
Human approval required before implementation.
```

**Exit Criteria:**

- Plan is reviewable
- No hidden architecture changes
- Composer/Tutorial Page/ILS/LSNB/RSSB impact is explicit

---

## 15. Agent K — Validation & Evidence

**Mission:** Prove the candidate participates correctly after implementation.

**Evidence categories:**

```text
TypeScript
unit tests
component tests
Composer authoring
TutorialDocument serialization
Tutorial Page rendering
UBRC DOM identity
ILS observation path
LSNB consumer path
RSSB consumer path
SkillUp brand
RTH brand
accessibility
security
```

**Exit Criteria:**

- Evidence package exists
- Failures are blocking unless HAA explicitly waives
- Certification readiness is evidence-based

---

## 16. Agent L — Certification & Governance

**Mission:** Prepare HAA decision package.

**Tasks:**

1. Summarize request.
2. Summarize candidate.
3. Summarize compliance review.
4. Summarize corrections.
5. Summarize integration plan.
6. Summarize test evidence.
7. Record HAA decision.

**Allowed decisions:**

```text
APPROVE
APPROVE_WITH_CONDITIONS
REJECT
CORRECT_AND_RESUBMIT
STOP
```

**Exit Criteria:**

- Project LLM can mark `CERTIFICATION_READY`
- Only HAA can mark `CERTIFIED`

---

## 17. Agent M — Implementation Coordinator

**Mission:** Orchestrate all workflow agents and protect sequencing.

**Tasks:**

1. Maintain implementation backlog.
2. Enforce dependencies.
3. Prevent coding before required approval.
4. Prevent direct mutation by candidate intake.
5. Track evidence.
6. Track STOP conditions.

**Exit Criteria:**

- No agent bypasses gates
- Work can be resumed by future AI model without reinterpreting architecture

---

## 18. Recommended Execution Sequence

### Phase 1.0 — Foundation

```text
Agent A → Repository map
Agent B → Workbench shell
Agent C → Domain contracts
Agent D → Static repository intelligence
```

### Phase 1.1 — Brief + Handoff

```text
Agent E → Creation brief engine
Agent F → External AI handoff workspace
```

### Phase 1.2 — Candidate Review

```text
Agent G → Candidate intake
Agent H → Compliance review engine
Agent I → Correction instruction engine
```

### Phase 1.3 — Integration Planning

```text
Agent J → Integration plan
Agent K → Validation/evidence checklist
```

### Phase 1.4 — I2 Pilot

```text
Use I1 reference
Generate I2 brief
External AI creates prototype
Human approves GUI
External AI creates candidate
Project LLM reviews
Human approves integration
Implement I2
Validate and collect evidence
HAA certifies or rejects
```

### Phase 1.5 — Certification Workflow

```text
Agent L → Certification package
Agent M → Governance tracking
```

---

## 19. First Implementation Slice

The first code implementation should be deliberately small:

```text
1. Add Project LLM route under SkillHubCore Admin tools.
2. Add sidebar link.
3. Create static workbench dashboard.
4. Create workflow-agent roadmap screen or panel.
5. Create New Block Request placeholder.
6. Create Repository Context placeholder using static Project LLM docs.
7. No database migration yet.
8. No LLM provider integration yet.
9. No candidate file mutation yet.
```

This gives the project a visible Project LLM home without risking Tutorial Composer, ILS, LSNB, RSSB, or UBRC runtime behavior.

---

## 20. Implementation Guardrails

Do not start with:

```text
database migrations
LLM provider API keys
autonomous code writing
Tutorial Renderer mutation
ILS mutation
LSNB mutation
RSSB mutation
Composer schema mutation
I2 production implementation
```

Start with:

```text
admin workbench shell
typed workflow contracts
static repository intelligence
creation brief generation
manual external AI handoff
candidate review shell
```

---

## 21. Confirmation

Yes, this roadmap matches the intended direction:

```text
Project LLM for educational block creation
→ used by Tutorial Composer
→ rendered through Tutorial Page
→ visible to UBRC
→ passively observed by ILS
→ consumed by LSNB/RSSB as part of page/runtime progress
→ governed by HAA certification
```

The workflow-agent model is correct as long as each agent works within its bounded responsibility and does not bypass human approval gates.
