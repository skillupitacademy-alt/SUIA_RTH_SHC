# Project LLM External AI Block Creation Workflow Decision

**Document Type:** Architecture Direction Closure / Feedback Resolution  
**Status:** DRAFT - Awaiting Human Architecture Authority Approval  
**Created:** 2026-10-04  
**Purpose:** Close the concern raised by the attached comparison/audit feedback and establish the authoritative workflow for how Project LLM, Human, External AI, Tutorial Composer, Tutorial Page, ILS, LSNB, and RSSB proceed from here.

---

## Executive Decision

Project LLM is **not primarily an in-app block GUI generator**.

Project LLM is a **repository-aware block specification, compliance review, integration, and certification workbench**.

The intended workflow is:

```text
Project LLM
  -> creates complete block creation brief
Human
  -> copies brief to external AI
External AI
  -> creates GUI prototype / HTML / CSS / JS / JSON during its own conversation
Human
  -> approves or rejects the GUI visually
External AI
  -> converts the approved GUI into React / TypeScript / Node.js-compatible component package
Human
  -> brings completed implementation back to Project LLM
Project LLM
  -> reviews against current repo architecture
  -> checks Composer, Tutorial Page, UBRC, ILS, LSNB, RSSB, brand/theme, validation, tests
  -> produces corrections or integration package
Human
  -> gives correction feedback to external AI if needed
Project LLM
  -> certifies readiness only after evidence passes
Human Architecture Authority
  -> gives final approval
Tutorial Composer
  -> receives approved/certified block through the existing canonical pipeline
```

This closes the concern that we may have drifted toward a different product.

---

## Feedback Concern Closure

### Concern 1: Project AI report file inventory does not match external GitHub audit

**Closure:** Inventory counts must not control the architecture decision.

For this local working repository, direct git inspection found:

| Item | Local finding |
|---|---:|
| Unique markdown paths added from 2026-09-29 through 2026-10-04 | 145 |
| Added markdown paths still present in current tree | 144 |
| Moved path exception | 1 |

The previously attached/report-style inventory that claimed 150 files is **not treated as authoritative** for this local repo. The earlier external audit that claimed 143 files is also not treated as authoritative for this local repo.

**Authoritative rule:** for implementation work, use the actual local repository state and direct git/file inspection.

### Concern 2: `PROJECT_LLM_GUI_FIRST_STRATEGY.md` was reported as absent in one audit

**Closure:** In this local repository snapshot, it is present:

```text
ILS_UI_UX/docs/PROJECT_LLM_GUI_FIRST_STRATEGY.md
```

Therefore absence claims from another repository snapshot must not drive local decisions.

### Concern 3: Broad Project LLM lifecycle conflicts with narrow Phase 1B I1 generation service

**Closure:** The broad lifecycle is the correct product direction. The narrow Phase 1B I1 generation contract is not sufficient to describe the Project LLM we are actually building.

The narrow I1 generation concept may remain useful as a future technical slice or provider-boundary experiment, but it must not override the intended external-AI block-creation workflow.

### Concern 4: Are we creating the wrong Project LLM?

**Closure:** We were at risk of doing so if we implemented only the "generate I1 candidate" flow. The corrected direction is now explicit:

```text
Project LLM = Creation Brief + Compliance Review + Integration + Certification
External AI = GUI/prototype/component candidate factory
Human = visual approval + architecture authority
Composer = canonical page composition and persistence
```

---

## Correct Responsibility Model

### Project LLM Owns

Before external AI:

- repository-aware block creation brief,
- current architecture discovery,
- existing block reference extraction,
- Composer requirements,
- TutorialDocument requirements,
- Tutorial Page rendering requirements,
- UBRC rules,
- ILS runtime rules,
- LSNB relationship rules,
- RSSB relationship rules,
- multi-brand/theme rules,
- validation and evidence requirements,
- explicit external-AI instruction package.

After external AI:

- component/package intake,
- current repository comparison,
- architecture compliance review,
- TypeScript/component boundary review,
- data contract review,
- Composer integration review,
- Tutorial Page render review,
- ILS/LSNB/RSSB participation review,
- brand independence review,
- remediation instructions,
- integration package,
- certification-ready evidence.

### External AI Owns

- GUI/web-page design exploration,
- HTML/CSS/JS/JSON prototype during its own conversation,
- iteration with Human until GUI approval,
- conversion into React/TypeScript/Node.js-compatible implementation,
- candidate tests and notes when requested.

External AI does **not** own:

- final repository integration authority,
- final UBRC/ILS/LSNB/RSSB certification,
- direct repository modification,
- architecture changes.

### Human Owns

- selecting the block objective,
- giving the Project LLM brief to external AI,
- approving/rejecting external AI GUI output,
- deciding whether to bring candidate code back to Project LLM,
- resolving architecture STOP conditions,
- final approval/certification.

### Tutorial Composer Owns

- final page composition,
- canonical `TutorialDocument.blocks[]`,
- existing save/publish flow,
- persistence into the existing tutorial content pipeline.

Project LLM does not replace Tutorial Composer.

---

## Correct Workflow

### Phase A: Create External AI Block Brief

Project LLM produces a complete brief containing:

- block identity,
- intended learning purpose,
- target version/family,
- existing D1/C1/I1/S1 reference patterns as relevant,
- data/JSON shape rules,
- React/TypeScript conversion rules,
- multi-brand/theme rules,
- DOM identity requirements,
- no-direct-ILS/no-direct-RSSB/no-direct-database rules,
- Composer registration expectations,
- Tutorial Page rendering constraints,
- validation checklist,
- final output format expected from external AI.

Human copies this brief to the external AI.

### Phase B: External AI GUI Iteration

External AI produces prototype materials such as:

- HTML,
- CSS,
- JavaScript,
- JSON/data,
- mock assets,
- visual explanation.

Human approves or rejects the GUI in the external AI conversation.

Project LLM does not need to ingest this prototype as the formal handoff unless the Human wants it retained as reference evidence.

### Phase C: External AI Implementation

After GUI approval, external AI converts the approved prototype into:

- React component(s),
- TypeScript types,
- JSON/data contract,
- supporting utilities if needed,
- tests if requested,
- implementation notes.

Human brings this implementation package back to Project LLM.

### Phase D: Project LLM Review

Project LLM checks the returned implementation against:

- current repository paths,
- actual block type contracts,
- actual renderer registration,
- actual Composer registry,
- actual `TutorialDocument` structure,
- actual Tutorial Page runtime,
- DOM identity attributes,
- theme/brand independence,
- ILS telemetry compatibility,
- LSNB page/navigation relationship,
- RSSB/LearningProgressSidebar compatibility,
- no forbidden infrastructure changes,
- tests and evidence.

Result is one of:

```text
PASS -> prepare integration package
CHANGES REQUIRED -> generate correction instructions for external AI
STOP -> escalate to Human Architecture Authority
```

### Phase E: Integration and Certification

Only after Project LLM review passes:

- integrate into existing repo,
- run validation,
- produce evidence,
- verify both brands,
- verify Tutorial Composer,
- verify Tutorial Page,
- verify ILS/LSNB/RSSB participation,
- request final Human approval.

---

## What This Means for Phase 1B

The existing Phase 1B I1 generation service contract must be reclassified.

It is **not** the complete Project LLM product.

It can be retained only as one of these:

1. **Technical provider-boundary experiment**  
   Useful for proving service/provider abstraction and deterministic test provider behavior.

2. **Optional future helper**  
   Useful for generating candidate content for an existing I1 block after the core workbench model is approved.

3. **Not a blocker for the external-AI workflow**  
   The main Project LLM workflow does not require Project LLM to generate the GUI or content itself.

Therefore:

```text
Do not implement Phase 1B narrow I1 generation as the main Project LLM product.
```

Before implementation proceeds, the architecture must explicitly approve the workbench workflow described in this document.

---

## Correct Product Name / Mental Model

Recommended product framing:

```text
Project LLM Block Creation Workbench
```

Sub-capabilities:

1. **Creation Brief Builder**
2. **External AI Instruction Generator**
3. **Component Review Intake**
4. **Architecture Compliance Reviewer**
5. **Remediation Instruction Generator**
6. **Composer Integration Planner**
7. **Certification Evidence Builder**

Avoid product framing that implies:

```text
Project LLM = direct AI block generator
```

That framing is too narrow and risks building the wrong feature.

---

## Final Direction

We are going ahead with this model:

```text
Project LLM
  -> tells Human exactly what external AI must build
Human
  -> works with external AI until GUI is approved
External AI
  -> returns React/TypeScript implementation
Project LLM
  -> reviews and integrates against current repo architecture
Composer
  -> remains canonical page composition and persistence system
Tutorial Page / ILS / LSNB / RSSB
  -> remain existing runtime systems that the block must satisfy
Human
  -> remains final approval authority
```

This closes the attached feedback concern.

---

## Required Next Step

Create the detailed specification:

```text
PROJECT_LLM_BLOCK_CREATION_WORKBENCH_SPEC.md
```

That specification should define:

- pages/screens,
- user actions,
- brief sections,
- component review intake fields,
- compliance matrix,
- correction loop,
- integration package format,
- evidence package format,
- approval gates,
- STOP conditions,
- what belongs in Phase 1,
- what is deferred.

Only after that spec is approved should implementation prompts be written.

---

## Approval Request

Human Architecture Authority decision required:

- [ ] APPROVED - Project LLM proceeds as External AI Block Creation Workbench
- [ ] REJECTED - Revise workflow
- [ ] HOLD - More repository evidence required

**Approval Date:** Pending  
**Approval Authority:** Human Architecture Authority  
**Final Status:** Pending
