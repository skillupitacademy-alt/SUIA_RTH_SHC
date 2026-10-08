# Stage 5 — Findings, Gaps, and Contradictions

**Status:** IN PROGRESS  
**Last Updated:** 2026-10-02  

---

## Summary

**Frozen Educational Corpus (Stages 1-4):**
- 18 block families
- 132 versioned reference implementations

**Production Implementation Status:**
- **132** total frozen reference-version entries
- **3** complete production implementations: IntroductionI1, DefinitionD1, CodeC1
- **1** partial implementation: SummaryS1 (type exists, renderer incomplete)
- **127** with no production implementation
- Therefore **128 are not fully implemented**

**Implementation rate:** 3 of 132 complete (2.3%)

---

## VERIFIED FINDINGS

### Educational Block Implementations

**3 COMPLETE VERSIONED EDUCATIONAL IMPLEMENTATIONS:**

| Version | Semantic Alignment | Evidence |
|---|---|---|
| **IntroductionBlock I1** | ✅ FULL ALIGNMENT | Canonical locked UI, 9 sections, brand theme, icon registry, matches frozen I1 cognitive journey |
| **DefinitionBlock D1** | ✅ FULL ALIGNMENT | Canonical locked UI, 6 sections, characteristics grid, matches frozen D1 pedagogical contract |
| **CodeBlock C1** | ✅ FULL ALIGNMENT | Historical UI restored, memoryModel rendering, explanation steps, matches frozen C1 specification |

**Evidence Location:**
- `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
- `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`  
- `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- Semantic verification: Sections 10.1, 10.2, 10.3 of original evidence document

---

### Block-Based Architecture

| Finding | Evidence State | Evidence Location |
|---|---|---|
| TutorialDocument structure | ✅ VERIFIED | `packages/types/src/tutorial-rich-document/document.ts` |
| TutorialBlock discriminated union | ✅ VERIFIED | `packages/types/src/tutorial-rich-document/blocks/index.ts` |
| schemaVersion field | ✅ VERIFIED | CURRENT_SCHEMA_VERSION = 1 |
| blocks[] ordered array | ✅ VERIFIED | TutorialDocument.blocks: TutorialBlock[] |
| ContentBlockExtended types | ✅ VERIFIED | 11+ structural/specialized primitives |
| ContainerBlock types | ✅ VERIFIED | TwoColumn, ThreeColumn, CardGrid, Timeline |
| Versioned block types | ✅ VERIFIED | I1, D1, C1, S1 type definitions |

---

### Runtime Infrastructure

| Component | Status | Evidence |
|---|---|---|
| **TutorialRenderer** | ✅ VERIFIED | Iterates document.blocks[], renders via TutorialBlockRenderer |
| **TutorialBlockRenderer** | ✅ VERIFIED | Switch-case dispatcher, version enforcement, depth tracking |
| **Container renderChild** | ✅ VERIFIED | Recursive callback pattern for context propagation |
| **ActiveBlockContext** | ✅ VERIFIED | Viewport tracking via IntersectionObserver, DOM attribute extraction |
| **ILSProvider** | ✅ VERIFIED | In-Lesson System, navigation progress, per-block telemetry |
| **DOM identity contract** | ✅ VERIFIED | data-block-id, data-block-type, data-block-version mandatory |

---

### ILS (In-Lesson System)

**Acronym Expansion:** ✅ VERIFIED as **In-Lesson System** (from source documentation)

**Data Contract:**
- ✅ navigationNodeId + subtopicId identifiers
- ✅ API endpoint: `/api/tutorial/ils/navigation/:nodeId`
- ✅ Overall progress (navigation-level metrics)
- ✅ Active block progress (per-block telemetry)
- ✅ Block identification via blockId + blockVersion (strict matching)
- ✅ Telemetry fields: visitCount, revisionCount, activeTimeSec, expectedTimeSec
- ✅ Completion tracking: isCompleted, completedAt

---

### Composition & Nesting

| Rule | Status | Evidence |
|---|---|---|
| MAX_NESTING_DEPTH = 3 | ✅ VERIFIED | `packages/types/src/tutorial-rich-document/constants.ts` |
| MAX_BLOCKS_PER_DOCUMENT = 500 | ✅ VERIFIED | Constants file |
| Container recursive TutorialBlock[] | ✅ VERIFIED | Type system |
| Runtime recursive rendering | ✅ VERIFIED | renderChild callback in TwoColumnBlock.tsx |
| Depth increment at each level | ✅ VERIFIED | depth + 1 in renderChild calls |

---

### Learner Rendering Path (PARTIAL)

**VERIFIED SO FAR:**

```text
URL: /tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]
  ↓
Route: apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx
  ↓
Authentication: accessToken cookie verification
  ↓
resolveRuntimeContext: navigationNodeId, subtopicId, learnerId
  ↓
TutorialPageShell: payload + runtimeContext
  ↓
Runtime Providers: ILSProvider, ActiveBlockProvider, BlockTelemetryProvider
  ↓
[CONTINUING INVESTIGATION...]
```

**Evidence:** `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx`, partial read of `TutorialPageShell.tsx`

---

## PARTIAL FINDINGS

### SummaryBlock S1

**Status:** ⏳ PARTIAL IMPLEMENTATION

**What Exists:**
- ✅ SummaryS1Block type definition in type system
- ✅ SummaryBlock.tsx component file

**What Is Incomplete:**
- ❌ Current SummaryBlock.tsx is non-versioned utility (no version field check)
- ❌ Simple bullet list renderer (not canonical locked UI)
- ❌ No brand theme integration
- ❌ Does NOT satisfy frozen S1 educational contract

**Evidence:** `packages/ui/src/tutorial/blocks/SummaryBlock.tsx`, Section 10.4 of evidence

---

### expectedTimeSec Runtime Consumption

**Status:** ⏳ TYPE + ILS DATA VERIFIED; COMPLETE CONSUMPTION PATH NOT TRACED

**What Is VERIFIED:**
- ✅ expectedTimeSec exists in BaseBlock type
- ✅ Source comments reference ILS, AI-generation, Composer validation
- ✅ ILS API returns expectedTimeSec in block state
- ✅ ILSProvider exposes expectedTimeSec in activeBlockProgress

**What Is NOT VERIFIED:**
- ⏳ Exact path: TutorialDocument.blocks[].expectedTimeSec → persistence → ILS API
- ⏳ Whether Composer validates expectedTimeSec during authoring
- ⏳ Whether expectedTimeSec is stored in tutorial_sections or separate metadata

---

### Learner Rendering Path

**Status:** ⏳ IN PROGRESS (~60% traced)

**VERIFIED:**
- ✅ URL pattern and route structure
- ✅ Authentication and runtime context resolution
- ✅ TutorialPageShell component identified
- ✅ Runtime providers imported and used

**NOT YET VERIFIED:**
- ⏳ Complete TutorialPageShell rendering structure
- ⏳ Exact TutorialRenderer invocation
- ⏳ Data loader fetching tutorial_sections.content
- ⏳ TutorialDocument construction from database JSONB
- ⏳ Runtime provider wrapping order and configuration

---

## NOT YET INVESTIGATED

### Remaining Runtime Components

| Component | Status | Priority |
|---|---|---|
| BlockTelemetryProvider | ⏳ NOT YET INSPECTED | High (Phase 4.5) |
| InstructionalBlockCompletionOrchestrator | ⏳ NOT YET INSPECTED | High (Phase 2B.18) |
| LearningProgressSidebar (RSSB) | ⏳ NOT YET INSPECTED | Medium |

---

### Composer Integration

**Status:** ⏳ NOT YET INVESTIGATED

**Questions:**
- Which blocks does Composer palette expose?
- What composition restrictions does Composer enforce?
- How does Composer validate block content?
- Does Composer use same TutorialDocument structure?
- How does Composer handle version selection?
- What authoring UI exists for versioned blocks?

---

### Testing & Certification

**Status:** ⏳ NOT YET INVESTIGATED

**Questions:**
- Test coverage for block-based system?
- Tests for TutorialBlockRenderer?
- Tests for container recursion?
- Tests for ILS integration?
- Tests for ActiveBlock detection?
- Accessibility tests (WCAG compliance)?
- Certification frameworks?
- Validation that blocks satisfy educational contracts?

---

### Semantic Composition Rules

**Status:** ⏳ NOT YET VERIFIED

**Type-Level:** ✅ VERIFIED (containers accept TutorialBlock[])

**Runtime-Level:** ✅ VERIFIED (renderChild supports recursion)

**Semantic-Level:** ⏳ NOT YET VERIFIED

**Questions:**
- Can versioned educational blocks (I1, D1, C1) nest inside containers?
- Can structural primitives nest inside containers?
- Are there pedagogical restrictions beyond MAX_NESTING_DEPTH?
- Does runtime validate semantic appropriateness of composition?

---

## NOT FOUND

### UBRC

**Status:** ❌ NOT FOUND

**Search Performed:** Repository-wide grep for literal "UBRC"
**Result:** No occurrences found
**Classification:** NOT FOUND / NOT VERIFIED

**Note:** Do not invent expansion. Either find repository evidence or document as NOT FOUND.

---

### LSNB

**Status:** ❌ NOT FOUND

**Search Performed:** Repository-wide grep for literal "LSNB"
**Result:** No occurrences found
**Classification:** NOT FOUND / NOT VERIFIED

**Note:** Do not invent expansion. Either find repository evidence or document as NOT FOUND.

---

### RSSB Acronym Expansion

**Status:** ⏳ DECLARED / EXPANSION NOT VERIFIED

**What Is VERIFIED:**
- ✅ Component exists: LearningProgressSidebar
- ✅ Export comment: `// Macro 4: Learning Progress Sidebar (RSSB)`
- ✅ Component is exported from runtime module

**What Is NOT VERIFIED:**
- ⏳ Acronym expansion (do NOT assume "Real-time Section State Bridge")
- ⏳ Component implementation
- ⏳ Relationship to ILS
- ⏳ UI responsibilities

**Next Step:** Read LearningProgressSidebar component for actual evidence

---

## CONTRADICTIONS / DIVERGENCES

### 1. ComparisonBlock

**Status:** ✅ PRODUCTION/CORPUS DIVERGENCE VERIFIED

**Frozen Stage 2 Corpus:**
- CP1-CP8 (8 VERIFIED versions)
- Versioned educational family
- Semantic progression: SEE → COMPARE → UNDERSTAND → DECIDE → EVALUATE → FOLLOW LOGIC → SELECT → SYNTHESIZE
- Version-specific pedagogical contracts

**Production Implementation:**
- Non-versioned specialized component
- No version field in type definition
- Single comparison table utility
- Generic rendering (no version-specific logic)
- No brand theme integration (fixed colors)

**Evidence:**
- Type: `packages/types/src/tutorial-rich-document/blocks/specialized-blocks.ts`
- Component: `packages/ui/src/tutorial/blocks/ComparisonBlock.tsx`
- Corpus: `../ComparisonBlock.md`

**Classification:** Verified divergence between educational corpus and production architecture

**What Is NOT VERIFIED:**
- ⏳ Why production made this choice
- ⏳ Whether ComparisonBlock is intentionally a compositional primitive
- ⏳ Whether CP1-CP8 are planned for future implementation
- ⏳ Design rationale

---

### 2. SummaryBlock

**Status:** ✅ PRODUCTION/CORPUS DIVERGENCE VERIFIED

**Frozen Stage 2 Corpus:**
- S1-S6 (6 VERIFIED / CLOSED)
- Versioned educational family
- Semantic progression: RECALL → CONNECT → COMPRESS → APPLY → REVIEW → INTEGRATE

**Production Implementation:**
- Non-versioned structural component
- No version field
- Simple bullet list utility
- No canonical locked UI
- No brand theme integration

**Evidence:**
- Type: SummaryS1Block exists in types
- Component: `packages/ui/src/tutorial/blocks/SummaryBlock.tsx`
- Corpus: `../SummaryBlock.md`

**Classification:** Type exists, renderer does not satisfy frozen S1 contract

---

## FROZEN CORPUS ENTRIES NOT YET IMPLEMENTED

**127 of 132 frozen Stage 2 reference-version entries do NOT have production implementations.**

**Not Yet Implemented Families:**

1. ObjectiveBlock (O1-O5) - 5 versions
2. VisualBlock (V1-V8) - 8 versions
3. ComparisonBlock as educational family (CP1-CP8) - 8 versions
4. ExecutionBlock (E1-E8) - 8 entries
5. MemoryBlock (M1-M8) - 8 versions
6. MistakeBlock (MT1-MT8) - 8 entries
7. BestPractices (BP1-BP7) - 7 versions
8. SummaryBlock as educational family (S2-S6) - 5 versions
9. QuestionBlock (Q1-Q8) - 8 versions
10. ExerciseBlock (EX1-EX8) - 8 versions
11. TaskBlock (T1-T8) - 8 versions
12. InteractiveBlock (INT1-INT6) - 6 entries
13. QuizBlock (QZ1-QZ8) - 8 versions
14. ProjectBlock (P1-P8) - 8 entries
15. InterviewBlock (IV1-IV7) - 7 versions

**Additional versions of implemented families:**
- Introduction I2-I6 (5 versions)
- Definition D2-D8 (7 entries)
- Code C2-C10 (9 versions)

**CRITICAL DISTINCTION:**

These frozen corpus entries represent the **educational possibility space for Project LLM to create**, NOT 127 production deficiencies.

The frozen corpus defines what CAN eventually exist according to the educational authority. Project LLM will create implementations when pedagogically appropriate.

---

## SUMMARY STATISTICS

**Educational Implementations:**
- ✅ Complete: 3 versions (I1, D1, C1)
- ⏳ Partial: 1 version (S1)
- 🚨 Divergence: 2 families (ComparisonBlock, SummaryBlock)
- ❌ Not Implemented: 127 frozen corpus entries

**Runtime Architecture:**
- ✅ Verified: 12+ components/contracts
- ⏳ Partial: 3+ components
- ❌ Not Found: 2 acronyms (UBRC, LSNB)

**Audit Completion:**
- Overall: ~70%
- Core architecture: ~95%
- Learner path: ~60%
- Testing/certification: 0%
- Composer: 0%

**Readiness:** Substantial foundation verified, learner path completion required before Project LLM guideline finalization
