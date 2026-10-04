# New Block Architecture Source-of-Truth Audit

**Date:** 2026-10-04  
**Repository authority:** Local git repository at `E:\onlinewebsites\quiz-platform`  
**Requested window:** 2026-09-29 through 2026-10-04  
**Reference reconciliation file:** `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md`  
**Status:** Audit complete; implementation remains gated by Human Architecture Authority approval of the reconciliation decision.

---

## 1. Audit Scope and Inventory Finding

The existing untracked report `MARKDOWN_FILES_CREATED_LAST_6_DAYS.md` was treated as a comparison artifact, not as source of truth.

Git was queried directly for markdown files added from `2026-09-29 00:00:00 +05:30` to the current local HEAD.

**Direct git result:**

| Metric | Result |
|---|---:|
| Unique markdown paths added in requested window | 145 |
| Added markdown paths still present in current tree | 144 |
| Added path no longer present because it was moved | 1 |

**Moved/deleted current-path exception:**

- `.analysis/stage-5/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md`
  - Created first in `.analysis/stage-5/`
  - Later moved to `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md`

**Current-tree category count for added markdown files:**

| Category | Count |
|---|---:|
| `.analysis/stage-5` | 6 |
| `docs/ubrc` | 50 |
| `docs/ubrc/phase-1a` | 18 |
| `ILS_UI_UX/docs` root | 2 |
| `ILS_UI_UX/docs/blocksmdfiles` root corpus | 21 |
| `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM` corpus | 23 |
| Stage-5 investigations under `OneAIModelForProjectLLM/stage-5` | 23 |
| Other | 1 |

**Important correction:** the local repository does contain `ILS_UI_UX/docs/PROJECT_LLM_GUI_FIRST_STRATEGY.md`, added by commit `875a26b2` on 2026-10-04. Any report saying this file is absent does not match this local snapshot.

---

## 2. Source Documents Read for This Audit

This audit used the newly created six-day markdown corpus plus the standing architecture documents that control new-block work.

Primary source documents:

- `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md`
- `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md`
- `ILS_UI_UX/docs/PROJECT_LLM_GUI_FIRST_STRATEGY.md`
- `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md`
- `docs/ubrc/PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1.md`
- `docs/ubrc/PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md`
- `docs/ubrc/PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md`
- `docs/ubrc/PHASE-0.6-EVIDENCE-AND-CERTIFICATION-CONTRACT-V1.md`
- `docs/ubrc/PHASE-0.7-VALIDATION-AND-TESTING-CONTRACT-V1.md`
- `docs/ubrc/PHASE-0.8-STOP-CONDITIONS-CONTRACT-V1.md`
- `docs/ubrc/UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`
- `docs/ubrc/UBRC-MULTI-BRAND-THEME-CONTRACT.md`
- `ILS_UI_UX/docs/04-Universal-Component-Brand-Architecture.md`
- `ILS_UI_UX/docs/05-RSSB-ILS-Data-Contract.md`
- `ILS_UI_UX/docs/06-Gate-3C1-Universal-Block-Telemetry-Audit.md`
- `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/stage-5/07_COMPOSER_AND_CREATION_PIPELINE.md`
- `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/stage-5/08_TESTING_VALIDATION_AND_CERTIFICATION.md`
- `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/stage-5/10_FINDINGS_GAPS_AND_CONTRADICTIONS.md`

Code evidence inspected:

- `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
- `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`
- `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`
- `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`
- `packages/db-tutorial/src/services/canonical-block-builder.ts`
- `packages/db-tutorial/migrations/schema.ts`
- `packages/db-tutorial/src/schema/tutorial-page-content-v2.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/hooks/useTutorialSave.ts`

---

## 3. Controlling Architecture Decision

`PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md` is the controlling document for the current conflict.

It defines three options and recommends **Option 3: Phased Architecture**:

- Phase 1B remains the narrow Foundation Layer.
- Phase 1B implements only Introduction I1 generation.
- The broader Project LLM Integration & Certification Engine remains Phase 2+.
- Phase 1B must be designed so later phases can add candidate workflows, GUI surfaces, quality gates, certification, and publishing.

**Current status:** DRAFT, awaiting Human Architecture Authority approval.

**Audit conclusion:** Phase 1B coding must not be treated as fully authorized until this reconciliation decision is approved. The local docs align that Phase 1B can remain valid only if it is explicitly interpreted as a foundation layer.

---

## 4. Authoritative End-to-End New Block Chain

The consolidated source-of-truth chain is:

```text
External AI
  -> Candidate block package
  -> Project LLM repository audit
  -> D1/C1 pattern extraction
  -> Adaptation to actual repo architecture
  -> TypeScript/React block implementation
  -> TutorialBlock union update
  -> TutorialBlockRenderer registration
  -> Composer registry/editor support
  -> Human approval
  -> Canonical TutorialDocument.blocks[]
  -> Universal Tutorial Page
  -> ActiveBlockProvider + ILSProvider + BlockTelemetryProvider
  -> LSNB page/navigation progress
  -> RSSB / LearningProgressSidebar block metrics
  -> Validation and evidence
  -> Human final certification
```

The critical rule is that a new block participates through the existing canonical pipeline. It must not create parallel telemetry, page, navigation, RSSB, ILS, database, or composer infrastructure.

---

## 5. Answers to the 18 Required Questions

### 1. How a new block is created

Authoritative answer:

1. External AI may create a candidate/prototype package.
2. Project LLM inspects actual repository D1/C1 implementations.
3. Project LLM adapts the candidate into repository-compliant TypeScript/React.
4. Human Architecture Authority approves required gates.
5. The block is registered into the existing composer, renderer, and canonical document pipeline.

`UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` is explicit that prototypes are source material, not production code. Project AI performs conversion and verification.

Actual implementation today:

- The active composer registry currently exposes four block families: definition, code, summary, introduction.
- Registry evidence: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts` imports `definitionRegistry`, `codeRegistry`, `summaryRegistry`, and `introductionRegistry`.

### 2. How HTML/CSS/JS/JSON becomes React/TypeScript

Authoritative answer:

The prototype is translated into:

- typed author-content interfaces,
- a versioned block interface extending the shared base block pattern,
- a React component that consumes `BlockComponentProps`,
- renderer registration,
- composer registry/editor support,
- validation and tests.

Actual code evidence:

- `content-blocks.ts` defines `DefinitionD1Block`, `CodeC1Block`, `SummaryS1Block`, and `IntroductionI1Block` as versioned block contracts.
- `canonical-block-builder.ts` builds canonical D1 and C1 blocks from validated author content, adding system metadata (`id`, `type`, `version`) and explicitly keeping hierarchy/brand/theme outside block JSON.
- `documentTransformation.ts` maps editor `BlockInstance` state into canonical `TutorialBlock` documents and preserves/normalizes existing blocks during hydration.

Gap:

- `canonical-block-builder.ts` currently has builders for D1 and C1 only. New families need equivalent builder/normalization support where the actual repo pattern requires it.

### 3. How the block remains brand-independent

Authoritative answer:

Block JSON must contain semantic content only. It must not contain `brandId`, theme, color tokens, navigation identity, or persistence data.

Actual code evidence:

- `canonical-block-builder.ts` states the block does not contain hierarchy, brand/theme, or schema version.
- `TutorialPageShell.tsx` passes `payload.theme` into `TutorialBlockRenderer`.
- D1 uses `theme.primary` and `theme.secondary` and adds DOM identity attributes.
- C1 uses theme tokens extensively but currently has a fallback theme if none is provided.

Audit note:

- D1 is stricter than C1. D1 requires theme presence; C1 can fallback. Multi-brand certification should verify C1 under both brand contexts and decide whether fallback is acceptable only for preview contexts.

### 4. How SkillUp and RTH consume the same block

Authoritative answer:

Both brands consume the same block implementation. Brand/theme is resolved at runtime and passed as props. No brand-specific block components should exist.

Actual code evidence:

- `TutorialPageShell.tsx` is a universal shell.
- It renders the same `TutorialBlockRenderer` for `payload.content.blocks`.
- It passes `payload.theme` into the renderer and passes brand colors into `LearningProgressSidebar`.
- `04-Universal-Component-Brand-Architecture.md` establishes the same universal component pattern for LSNB/RSSB.

Gap:

- Cross-brand visual proof is not included in this audit because no browser run or database-backed page verification was requested/executed. Certification still requires both brands to be tested against the same block.

### 5. How the block is registered in the Composer

Authoritative answer:

The block must be added to the existing composer registry, not a separate composer.

Actual code evidence:

- `registry/index.ts` exposes `getBlockTypes()`, `getBlockType()`, `getVersions()`, and `getDefaultPayload()`.
- Individual registries exist for introduction I1, definition D1, code C1, and summary S1.
- `tutorialSaveService.ts` sends the assembled `TutorialDocument` to `/api/tutorial-composer/sections`.

Current implementation:

- Composer support is present for four families, not for all 18 documented block families.

### 6. How Composer produces the canonical TutorialDocument

Authoritative answer:

Composer state becomes a single `TutorialDocument` with `blocks[]`.

Actual code evidence:

- `documentTransformation.ts` explicitly converts between `TutorialBlock[]` and editor `BlockInstance[]`.
- `tutorialSaveService.ts` sends `content: tutorialDocument` with `subtopicId`, `navigationNodeId`, and `brandId`.
- `useTutorialSave.ts` calls publish via `/api/tutorial-composer/sections/{sectionId}/publish`.

Important boundary:

- The TutorialDocument contains ordered blocks.
- Brand/navigation identity lives outside the block content, in request/table/runtime context.

### 7. How Tutorial Page renders it

Authoritative answer:

The Universal Tutorial Page reads the published TutorialDocument and renders `blocks[]` through `TutorialBlockRenderer`.

Actual code evidence:

- `TutorialPageShell.tsx` checks `payload.content.blocks`.
- It maps each block to `TutorialBlockRenderer`.
- It constructs per-block runtime context with block id/type/version.
- It passes the runtime brand theme into each block.

### 8. How ILS recognizes and tracks it

Authoritative answer:

ILS recognizes blocks by DOM identity attributes and runtime context. Blocks are passive participants.

Actual code evidence:

- D1 root renders `data-block-id`, `data-block-type`, and `data-block-version`.
- C1 root renders the same identity attributes.
- `TutorialPageShell.tsx` wraps content in `ActiveBlockProvider`, `ILSProvider`, and `BlockTelemetryProvider`.

Rule:

- New blocks must expose identity attributes; they must not call ILS APIs directly.

### 9. How LSNB relates to it

Authoritative answer:

LSNB is page/navigation-level. It is not created by a block. Blocks contribute block-level runtime identity and progress that can be reflected in page progress.

Actual code evidence:

- `TutorialPageShell.tsx` renders `TutorialLeftSidebar` with `payload.sidebar`, active URL, active navigation node id, and ILS-derived page progress.
- `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` states a new block does not create or modify LSNB records.

### 10. How RSSB consumes runtime/telemetry information

Authoritative answer:

RSSB/Learning Progress Sidebar consumes ILS state, not block-owned APIs.

Actual code evidence:

- `TutorialPageShell.tsx` renders `LearningProgressSidebar` inside `ILSProvider`.
- It passes brand colors from `payload.theme`.
- Stage-5 runtime docs identify `ILSProvider`, telemetry, visit persistence, active time persistence, metadata resolution, and sidebar metrics as the runtime evidence chain.

Implementation note:

- The current component name in code is `LearningProgressSidebar`, while the architecture documents use RSSB terminology. They refer to the same right-side learning/status concept in this audit.

### 11. How validation occurs at each stage

Authoritative answer:

Validation must cover:

- schema/type validation,
- TypeScript,
- lint/build,
- renderer registration,
- browser rendering,
- DOM identity,
- ActiveBlock/telemetry,
- database persistence,
- RSSB visibility,
- regression tests,
- cross-brand tests,
- evidence package review.

Governance evidence:

- Phase 0.7 defines validation/testing governance.
- Phase 0.8 defines STOP conditions when validation cannot be completed or architecture conflicts appear.
- `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` requires explicit tests for DOM identity, telemetry, database, RSSB, and regressions.

### 12. How evidence is produced

Authoritative answer:

Evidence is a required certification artifact and must be generated from actual repository/test/browser/database results.

Governance evidence:

- Phase 0.1 says Project LLM produces certification reports, verification logs, test results, and compliance documentation.
- Phase 0.6 controls evidence and certification.
- Phase 0.8 treats fabricated or incomplete evidence as a STOP condition.

Expected evidence package:

- changed file list,
- typecheck/lint/build logs,
- unit/integration/E2E test results,
- screenshots or browser observations,
- DOM identity proof,
- network/API telemetry proof,
- database record proof,
- cross-brand verification,
- final human approval record.

### 13. Where human approval occurs

Authoritative answer:

Human Architecture Authority controls:

- prototype approval,
- architecture changes,
- STOP-condition resolution,
- final production approval,
- Project LLM reconciliation decision,
- Phase 1B proceed/no-proceed decision.

Current controlling gate:

- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md` is still DRAFT and requires approval before treating Phase 1B implementation as unlocked.

### 14. What Project AI owns vs External AI vs Human

Authoritative answer:

| Actor | Owns | Does not own |
|---|---|---|
| External AI | Candidate/prototype generation package | Repository modification, final certification, architecture authority |
| Project AI / Project LLM | Repository audit, adaptation, integration, validation, evidence package | Autonomous universal architecture changes, bypassing human approval |
| Human | Architecture authority, gate approval, final decision | Routine mechanical conversion work unless overriding process |

Important reconciliation:

- Phase 1B narrows Project LLM to I1 generation service only.
- The lifecycle docs define Project LLM more broadly as Integration & Certification Engine.
- The reconciliation decision resolves this by phase separation, pending approval.

### 15. What is actually implemented today vs only documented

Actually implemented today:

- Shared `TutorialBlockRenderer`.
- D1 and C1 production block components.
- Introduction I1 and Summary S1 type/registry support.
- Universal `TutorialPageShell`.
- Runtime providers: `ActiveBlockProvider`, `ILSProvider`, `BlockTelemetryProvider`.
- Learning progress sidebar/RSSB-equivalent component integration.
- Composer save/publish flow through `/api/tutorial-composer/sections`.
- `tutorial_sections` schema fields for AI metadata (`generatedByAi`, `aiModelUsed`, `generationJobId`, `qualityScore`, `hallucinationScore`, `regenerationCount`) in migration schema.
- Brand-scoped tutorial content records through `brand_id` in schema/migrations.

Documented or partial:

- Full 18-family corpus and 100+ block-version vision.
- Full Project LLM Integration & Certification Engine.
- 12 GUI surfaces.
- Candidate workflow, candidate persistence, quality scoring, hallucination scoring, regeneration loops.
- Complete cross-brand certification chain for every new block.
- Full implementation for all 18 block families.

### 16. What must be added before the first genuinely new block can be certified

Minimum additions before certification:

1. Human approval of the Project LLM reconciliation decision.
2. Selection of one pilot block and its authoritative block family/version identity.
3. Actual path verification against the current repo.
4. Type interfaces and schema validation for the new block.
5. React component with DOM identity and theme prop usage.
6. Renderer registration in `TutorialBlockRenderer`.
7. Composer registry/editor support.
8. Canonical builder/normalizer support where needed.
9. Unit tests for schema/component behavior.
10. Composer save/publish verification.
11. Tutorial Page render verification.
12. ILS telemetry verification.
13. RSSB/LearningProgressSidebar verification.
14. SkillUp and RTH visual/runtime verification.
15. Evidence package.
16. Final Human Architecture Authority approval.

### 17. How both brands are proven against the same block

Required proof:

- Same block `id/type/version/content` shape, with no brand/theme in block JSON.
- Same React component path and renderer case used for both brands.
- RTH page renders with RTH theme.
- SkillUp page renders with SUIA theme.
- ILS/RSSB state is isolated by brand/runtime context.
- No brand-specific component branches.
- Screenshots or browser evidence for both brands.

Current audit status:

- Architecture and code path support the same-block model.
- Full cross-brand runtime proof still must be generated during certification.

### 18. What the final certification chain must look like

Final certification chain:

```text
Candidate package received
  -> Repository path verification completed
  -> D1/C1/reference patterns extracted
  -> New block implemented without parallel infrastructure
  -> Type/schema validation passed
  -> Renderer registration passed
  -> Composer registry/editor integration passed
  -> TutorialDocument save/publish passed
  -> Universal Tutorial Page render passed
  -> DOM identity observed
  -> ActiveBlock detection passed
  -> ILS visit/active-time persistence passed
  -> LSNB page progress unaffected/compatible
  -> RSSB metrics visible and correct
  -> RTH brand proof passed
  -> SUIA brand proof passed
  -> Regression suite passed
  -> Evidence package assembled
  -> Human Architecture Authority final approval
```

---

## 6. Project LLM Phase 1B Decision

**Do not start Phase 1B implementation as if reconciliation is already approved.**

The correct status is:

- Phase 1B implementation contract: approved/locked as a narrow I1 generation contract.
- Architecture reconciliation decision: DRAFT, awaiting Human Architecture Authority approval.
- GUI-first strategy: present in this local repo, but still strategy/guidance, not implementation authorization.
- Full Integration & Certification Engine: documented future phase, not implemented in Phase 1B.

Recommended next human decision:

1. Approve or revise `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md`.
2. If approved, update Phase 1B contract headers to state "Foundation Layer".
3. Only then begin Phase 1B implementation or GUI-01 specification.

---

## 7. Final Source-of-Truth Position

The actual local repository supports the following architecture:

```text
Shared canonical block
  -> Same type contract
  -> Same React component
  -> Same TutorialBlockRenderer
  -> Same Composer pipeline
  -> Same TutorialDocument.blocks[]
  -> Same Universal Tutorial Page
  -> Same ILS/RSSB runtime path
  -> Runtime brand/theme context differs per brand
```

The repo does not yet support treating all documented block families as production-ready. It supports a smaller implemented subset and a larger documented roadmap. The next certified new block must prove the whole pipeline with evidence, not by reference to documentation alone.

**Authoritative verdict:** architecture is aligned, implementation is partial, reconciliation approval is still the controlling gate.
