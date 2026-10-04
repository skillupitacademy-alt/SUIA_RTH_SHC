# PROJECT LLM — 18 Educational Block Corpus Registry

**Status:** Canonical (v1.0 — post-HAA-consolidation)  
**Date:** 2025-01-20  
**Authority:** HAA Decisions + TypeScript version registries + PLANNED-UBRC-BLOCKS-INVENTORY.md

---

## Executive Summary

This canonical registry documents the complete **18 Educational Block Family** architecture for the PROJECT LLM Tutorial Composer system. The architecture represents a comprehensive pedagogical framework designed for universal application across Python, JavaScript, TypeScript, Java, C++, SQL, Data Science, ML, Full Stack, Cybersecurity, and other technical domains.

### Key Metrics

- **18 Educational Block Families** (architectural taxonomy)
- **133 versions documented** across 18 families
- **3 families with verified implementations:** I (Introduction), C (Code), D (Definition)
- **15 families planned** but not yet implemented
- **15 Implementation Primitives** (building blocks used BY Educational Blocks, NOT separate families)

### Corrections Applied

Multiple reconciliation investigations resolved contradictions between initial reports and authoritative repository evidence:

- **Total version count corrected:** 133 versions (not 141 as initially claimed, arithmetic error in original summation corrected)
- **Definition family range corrected:** D1-D6 (6 versions, not D1-D8)
- **Visual family range corrected:** V1-V8 (8 versions, not V1-V10)
- **Taxonomy clarified:** 18 Educational Block Families separated from 15 Implementation Primitives
- **Implementation status verified:** 3 families fully implemented (I1, C1, D1), S1 reclassified as INCOMPLETE

Content was rephrased for compliance with licensing restrictions.

---

## 18-Family Registry Table

| # | Family Name | Shorthand | Versions | Version Range | Status | Notes |
|---|------------|-----------|----------|---------------|--------|-------|
| 1 | IntroductionBlock | I | 6 | I1-I6 | VERIFIED (I1) | I1 implemented with version routing + UBRC |
| 2 | ObjectiveBlock | O | 5 | O1-O5 | PLANNED | Learning goals specification |
| 3 | DefinitionBlock | D | 6 | D1-D6 | VERIFIED (D1) | D1 implemented, D7-D8 removed (not in type system) |
| 4 | CodeBlock | C | 10 | C1-C10 | VERIFIED (C1) | C1 implemented with version routing + UBRC |
| 5 | VisualBlock | V | 8 | V1-V8 | PLANNED | V9-V10 removed (not evidenced) |
| 6 | ComparisonBlock | CP | 8 | CP1-CP8 | PLANNED | Concept comparison/differentiation |
| 7 | ExecutionBlock | E | 8 | E1-E8 | PLANNED | Runtime behavior visualization |
| 8 | MemoryBlock | M | 8 | M1-M8 | PLANNED | Internal state/memory models |
| 9 | MistakeBlock | MT | 8 | MT1-MT8 | PLANNED | Error identification/debugging |
| 10 | BestPracticeBlock | BP | 7 | BP1-BP7 | PLANNED | Coding standards/practices |
| 11 | SummaryBlock | S | 6 | S1-S6 | PLANNED | Concept revision/summary |
| 12 | QuestionBlock | Q | 8 | Q1-Q8 | PLANNED | Concept checking questions |
| 13 | ExerciseBlock | EX | 8 | EX1-EX8 | PLANNED | Guided practice activities |
| 14 | TaskBlock | T | 8 | T1-T8 | PLANNED | Practical application tasks |
| 15 | InteractiveBlock | INT | 6 | INT1-INT6 | PLANNED | Hands-on learning interactions |
| 16 | QuizBlock | QZ | 8 | QZ1-QZ8 | PLANNED | Assessment/evaluation |
| 17 | InterviewBlock | IV | 7 | IV1-IV7 | PLANNED | Interview preparation |
| 18 | ProjectBlock | P | 8 | P1-P8 | PLANNED | Real-world project application |
| | **TOTAL** | | **133** | | **3 VERIFIED, 15 PLANNED** | |

**Calculation Verification:**
```
6 + 5 + 6 + 10 + 8 + 8 + 8 + 8 + 8 + 7 + 6 + 8 + 8 + 8 + 6 + 8 + 7 + 8 = 133
```

---

## Per-Family Specifications

### Family 1: IntroductionBlock (I)

**Purpose:** Context and orientation for learning topics  
**Primary Question:** "What are we learning and why does this topic matter?"  
**Position:** Tutorial opening/orientation  
**Distinction:** Provides context (vs ObjectiveBlock which states measurable outcomes)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| I1 | Basic Topic Introduction | VERIFIED | Topic orientation with 9-section pedagogical structure. IMPLEMENTED with version routing + UBRC compliance. |
| I2 | Problem → Need → Topic | PLANNED | Motivation through problem identification |
| I3 | What → Why → Where | PLANNED | Comprehensive orientation (definition, importance, applications) |
| I4 | Topic → Context → Roadmap | PLANNED | Structured learning path preview |
| I5 | Real-World Introduction | PLANNED | Practical context establishment |
| I6 | Complete Lesson Introduction | PLANNED | Comprehensive lesson orientation (integrates I1-I5 components) |

**Evidence Sources:**
- TypeScript: `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
- Renderer: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (lines 93-106)
- Composer: `apps/skillhubcore-admin/.../introduction.registry.ts`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Introduction.md`

---

### Family 2: ObjectiveBlock (O)

**Purpose:** Learning goals and measurable outcomes  
**Primary Question:** "What should you know, understand, or be able to do after learning?"  
**Position:** After introduction, before content  
**Distinction:** States measurable outcomes (vs IntroductionBlock which provides context)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| O1 | Simple Learning Goals | PLANNED | 3-5 basic learning goals (unordered list) |
| O2 | Know → Understand → Apply | PLANNED | Cognitive progression framework (three tiers) |
| O3 | Skill-Based Objectives | PLANNED | Observable skill outcomes with action verbs |
| O4 | Beginner → Intermediate → Advanced | PLANNED | Progressive difficulty levels |
| O5 | Complete Learning Outcomes | PLANNED | Comprehensive outcome specification (integrates O1-O4) |

**Evidence Sources:**
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Objective.md`
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`

---

### Family 3: DefinitionBlock (D) — CORRECTED

**Purpose:** Concept explanation and definition  
**Primary Question:** "What exactly is this concept?"  
**Position:** Core content (after orientation)  
**Distinction:** Explains "what" (vs CodeBlock showing "how", VisualBlock showing structure)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| D1 | Classic Definition | VERIFIED | Basic concept definition with brief explanation. IMPLEMENTED with version routing + UBRC compliance. |
| D2 | Definition + Key Characteristics | PLANNED | Definition with 4-6 properties/characteristics |
| D3 | Definition + Real-World Analogy | PLANNED | Conceptual understanding through analogy |
| D4 | Definition + Why It Matters | PLANNED | Context and importance statement |
| D5 | Definition + Visual Concept | PLANNED | Visual-enhanced understanding |
| D6 | Definition + Technical Breakdown | PLANNED | Deep technical understanding (FAANG-level) |

**CRITICAL CORRECTION:**
- **Original Claims:** D1-D8 (8 versions) in Corpus Registry report
- **TypeScript Registry Evidence:** D1-D6 ONLY (6 versions) in `definition-versions.ts`
- **Authoritative Inventory:** D1-D6 (6 versions) in PLANNED-UBRC-BLOCKS-INVENTORY.md
- **Reconciliation Verdict:** D1-D6 is correct; D7-D8 documented in .ipynb files but NOT implemented in type system
- **Reason:** TypeScript registry is runtime contract and takes precedence over aspirational documentation

**Evidence Sources:**
- TypeScript Registry: `packages/types/src/tutorial-rich-document/registries/definition-versions.ts` (AUTHORITATIVE)
- Component: `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Definition.md` (Note: Documents D1-D8 but D7-D8 not in type system)

---

### Family 4: CodeBlock (C)

**Purpose:** Code demonstration and syntax teaching  
**Primary Question:** "What does this code do?"  
**Position:** Core content (demonstration)  
**Distinction:** Shows syntax/behavior (vs ExecutionBlock showing runtime, VisualBlock showing structure)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| C1 | Basic Code Example | VERIFIED | Simple code demonstration (1-10 lines with output). IMPLEMENTED with version routing + UBRC compliance. |
| C2 | Syntax + Explanation | PLANNED | Code with syntax highlighting and brief explanation |
| C3 | Annotated Code | PLANNED | Code with inline annotations/comments |
| C4 | Code + Output | PLANNED | Code with expected output and explanation |
| C5 | Code Walkthrough | PLANNED | Step-by-step execution explanation |
| C6 | Before / After Code | PLANNED | Version comparison (what changed) |
| C7 | Common Mistake | PLANNED | Incorrect code → error → correction |
| C8 | Multiple Examples | PLANNED | Pattern identification across examples |
| C9 | Code + Explanation + Output | PLANNED | Complete three-part presentation |
| C10 | Interactive / Playground | PLANNED | Hands-on experimentation (requires runtime integration) |

**Evidence Sources:**
- TypeScript Registry: `packages/types/src/tutorial-rich-document/registries/code-versions.ts`
- Component: `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- Renderer: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (lines 72-81)
- Composer: `apps/skillhubcore-admin/.../code.registry.ts`
- Tests: `packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx` (475+ lines, 50+ test cases)
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Code.md`

---

### Family 5: VisualBlock (V) — CORRECTED

**Purpose:** Visual learning and structural explanation  
**Primary Question:** "What does this concept look like?"  
**Position:** Core content (structural explanation)  
**Distinction:** Shows structure/relationships (vs CodeBlock showing behavior, ExecutionBlock showing runtime)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| V1 | Basic Visual | PLANNED | Simple visual concept representation (diagrams, flows, relationships) |
| V2 | Flow | PLANNED | Process flow diagram with steps |
| V3 | Relationship | PLANNED | Entity relationship diagram |
| V4 | State Transition | PLANNED | State machine diagram |
| V5 | Memory Model | PLANNED | Memory layout visualization |
| V6 | Execution Model | PLANNED | Runtime execution visualization |
| V7 | Comparison / Decision | PLANNED | Decision tree or comparison matrix visual |
| V8 | Hierarchy / Structure | PLANNED | Hierarchical organization diagram |

**CRITICAL CORRECTION:**
- **Original Claims:** V1-V10 (10 versions) in Corpus Registry and Provenance reports
- **Authoritative Matrix Evidence:** V1-V8 ONLY (8 versions), "V9, V10 NOT EVIDENCED (contradicts historical register)"
- **Reconciliation Verdict:** V1-V8 is correct; V9-V10 claimed in old reports but NOT in authoritative specification
- **Status:** V9-V10 removed from count (historical claims only, no specifications found)

**Evidence Sources:**
- Architecture: `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/FAMILY_VERSION_MATRIX.md` (AUTHORITATIVE)
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Visual.md`

---

### Family 6: ComparisonBlock (CP)

**Purpose:** Concept comparison and differentiation  
**Primary Question:** "How are A and B different when looking at them side by side?"  
**Position:** Core content (differentiation)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| CP1 | Side-by-Side Comparison | PLANNED | Direct parallel comparison (2 concepts) |
| CP2 | Feature Comparison Table | PLANNED | Feature-by-feature matrix comparison |
| CP3 | Similarities vs Differences | PLANNED | Similarities section → Differences section |
| CP4 | When to Use A vs B | PLANNED | Decision criteria for selection |
| CP5 | Advantages vs Limitations | PLANNED | Pros and cons comparison |
| CP6 | Decision Tree | PLANNED | Flow-based decision guidance |
| CP7 | Selection Matrix | PLANNED | Multi-criteria decision matrix |
| CP8 | Complete Comparison Guide | PLANNED | Comprehensive comparison reference |

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Comparison.md`

---

### Family 7: ExecutionBlock (E)

**Purpose:** Runtime behavior visualization  
**Primary Question:** "What happens when this code/operation executes?"  
**Position:** Core content (runtime behavior)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| E1 | Execution Flow | PLANNED | Chronological execution sequence |
| E2 | Step-by-Step Execution | PLANNED | Detailed step-by-step breakdown |
| E3 | Execution Flow Diagram | PLANNED | Visual flow representation with branching (PARTIAL specification) |
| E4 | Function Call Execution | PLANNED | Function invocation → parameter binding → execution → return |
| E5 | Stack / Frame Execution | PLANNED | Call stack visualization during execution |
| E6 | Runtime Pipeline | PLANNED | Multi-stage pipeline execution |
| E7 | Before → During → After | PLANNED | Three-phase execution state visualization |
| E8 | Complete Execution Model | PLANNED | Comprehensive runtime model (advanced/FAANG) |

**Note:** E3 flagged as PARTIAL specification in reconciliation reports but included in total count.

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Execution.md`

---

### Family 8: MemoryBlock (M)

**Purpose:** Internal state and memory models  
**Primary Question:** "Where does the data exist while the program runs?"  
**Position:** Core content (internal representation)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| M1 | Memory Fundamentals | PLANNED | Basic memory concept introduction |
| M2 | Variable → Object | PLANNED | Variable reference model visualization |
| M3 | Reference Model | PLANNED | Reference semantics explanation |
| M4 | Stack / Heap | PLANNED | Stack and heap memory regions |
| M5 | Object Memory Layout | PLANNED | Internal object structure |
| M6 | Memory Before / After | PLANNED | State changes during execution |
| M7 | Lifecycle / Allocation / Deallocation | PLANNED | Memory management visualization |
| M8 | Complete Memory Model | PLANNED | Comprehensive memory model |

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Memory.md`

---

### Family 9: MistakeBlock (MT)

**Purpose:** Error identification and debugging  
**Primary Question:** "What went wrong and how do I fix it?"  
**Position:** Core content (debugging/errors)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| MT1 | Basic Mistake Identification | PLANNED | Error → What went wrong → Correction |
| MT2 | Mistake with Explanation | PLANNED | Why the mistake happened |
| MT3 | Mistake with Correction | PLANNED | Step-by-step correction process |
| MT4 | Mistake with Prevention | PLANNED | How to avoid in future |
| MT5 | Mistake Comparison | PLANNED | Common vs uncommon errors |
| MT6 | Mistake Analysis | PLANNED | Root cause analysis |
| MT7 | Complete Mistake Learning Model | PLANNED | Comprehensive debugging approach |
| MT8 | Advanced/Systematic Debugging | PLANNED | Systematic debugging methodology (DECLARED/ABSENT specification) |

**Note:** MT8 flagged as DECLARED/ABSENT specification in reconciliation reports but included in total count.

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Mistake.md`

---

### Family 10: BestPracticeBlock (BP)

**Purpose:** Coding standards and practices  
**Primary Question:** "What's the recommended way to do this?"  
**Position:** Core content (standards/practices)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| BP1 | Basic Best Practice | PLANNED | Practice statement with brief rationale |
| BP2 | Best Practice with Rationale | PLANNED | Detailed reasoning |
| BP3 | Best Practice with Example | PLANNED | Code example demonstrating practice |
| BP4 | Best Practice Comparison | PLANNED | Good vs poor practice |
| BP5 | Contextual Best Practice | PLANNED | When to apply (context-dependent) |
| BP6 | Best Practice with Anti-Patterns | PLANNED | What to avoid |
| BP7 | Complete Best Practices Guide | PLANNED | Comprehensive practices reference (FINAL/CLOSED) |

**Note:** Family explicitly CLOSED at BP7 (no additional versions planned).

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/BestPractices.md`

---

### Family 11: SummaryBlock (S)

**Purpose:** Concept revision and summary  
**Primary Question:** "What are the key points to remember?"  
**Position:** Tutorial conclusion/revision

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| S1 | Basic Key Points Summary | PLANNED | 3-5 key points list (S1 has React component but INCOMPLETE - missing UBRC compliance) |
| S2 | Connected Summary | PLANNED | How concepts connect |
| S3 | Compressed Summary | PLANNED | Condensed review |
| S4 | Summary with Application | PLANNED | Key points + practical application |
| S5 | Review Summary | PLANNED | Structured review framework |
| S6 | Complete Learning Summary | PLANNED | Comprehensive summary (FINAL/CLOSED) |

**Note on S1 Implementation Status:**
- S1 has React component (`packages/ui/src/tutorial/blocks/SummaryBlock.tsx`)
- **INCOMPLETE:** Missing `data-block-version` attribute, no version routing
- **Does NOT meet UBRC compliance** for versioned Educational Blocks
- Classified as PLANNED (not VERIFIED) until version enforcement added

**Note:** Family explicitly CLOSED at S6 (no additional versions planned).

**Evidence Sources:**
- TypeScript Registry: `packages/types/src/tutorial-rich-document/registries/summary-versions.ts`
- Component: `packages/ui/src/tutorial/blocks/SummaryBlock.tsx` (partial/incomplete)
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Tests: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` (lines 154-171 confirm missing version attribute)

---

### Family 12: QuestionBlock (Q)

**Purpose:** Concept checking questions  
**Primary Question:** "Do you understand this concept?"  
**Position:** After content sections (formative assessment)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| Q1 | Basic Recall Question | PLANNED | Simple factual recall |
| Q2 | Comprehension Question | PLANNED | Understanding verification |
| Q3 | Application Question | PLANNED | Apply knowledge to scenario |
| Q4 | Analysis Question | PLANNED | Break down/analyze concept |
| Q5 | Evaluation Question | PLANNED | Assess/critique approach |
| Q6 | Synthesis Question | PLANNED | Combine concepts creatively |
| Q7 | Reflection Question | PLANNED | Reflect on learning process |
| Q8 | Complete Question Learning Model | PLANNED | Comprehensive questioning approach (FINAL/CLOSED) |

**Note:** Family explicitly CLOSED at Q8 (no additional versions planned).

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Question.md`

---

### Family 13: ExerciseBlock (EX)

**Purpose:** Guided practice activities  
**Primary Question:** "Can I practice this concept?"  
**Position:** After content sections (practice)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| EX1 | Basic Practice Exercise | PLANNED | Simple guided practice |
| EX2 | Guided Exercise | PLANNED | Step-by-step guidance |
| EX3 | Structured Exercise | PLANNED | Structured problem-solving |
| EX4 | Challenge Exercise | PLANNED | Higher difficulty challenge |
| EX5 | Scaffolded Exercise | PLANNED | Progressive difficulty scaffolding |
| EX6 | Open-Ended Exercise | PLANNED | Creative problem-solving |
| EX7 | Reflective Exercise | PLANNED | Practice with reflection |
| EX8 | Complete Exercise Learning Model | PLANNED | Comprehensive exercise approach (FINAL/CLOSED) |

**Note:** Family explicitly CLOSED at EX8 (no additional versions planned).

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Exercise.md`

---

### Family 14: TaskBlock (T)

**Purpose:** Practical application tasks  
**Primary Question:** "Can I apply this in a practical context?"  
**Position:** After content sections (application)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| T1 | Basic Task | PLANNED | Simple practical task |
| T2 | Instructional Task | PLANNED | Task with instructions |
| T3 | Verifiable Task | PLANNED | Task with verification criteria |
| T4 | Guided Task | PLANNED | Step-by-step task guidance |
| T5 | Challenge Task | PLANNED | Higher difficulty task |
| T6 | Collaborative Task | PLANNED | Team-based task |
| T7 | Reflective Task | PLANNED | Task with reflection component |
| T8 | Complete Task Learning Model | PLANNED | Comprehensive task approach (FINAL/CLOSED) |

**Note:** Family explicitly CLOSED at T8 (no additional versions planned).

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Task.md`

---

### Family 15: InteractiveBlock (INT)

**Purpose:** Hands-on learning interactions  
**Primary Question:** "Can I interact with this concept?"  
**Position:** Core content (interactive learning)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| INT1 | Basic Interactive Element | PLANNED | Simple interactive component |
| INT2 | Interactive Experiment | PLANNED | Experimentation interface |
| INT3 | Interactive Exploration | PLANNED | Exploratory learning interface |
| INT4 | Interactive Scenario | PLANNED | Scenario-based interaction |
| INT5 | Interactive Simulation | PLANNED | Simulation environment (DECLARED/INCOMPLETE specification) |
| INT6 | Interactive System | PLANNED | Complete system interaction (DECLARED/INCOMPLETE specification) |

**Note:** INT5-INT6 flagged as DECLARED/INCOMPLETE specifications in reconciliation reports but included in total count.

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Interactive.md`

---

### Family 16: QuizBlock (QZ)

**Purpose:** Assessment and evaluation  
**Primary Question:** "How well have I learned this?"  
**Position:** End of tutorial sections (summative assessment)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| QZ1 | Basic Quiz | PLANNED | Simple multiple-choice quiz |
| QZ2 | Quiz with Explanations | PLANNED | Answers with detailed explanations |
| QZ3 | Adaptive Quiz | PLANNED | Difficulty adapts to performance |
| QZ4 | Timed Quiz | PLANNED | Time-bound assessment |
| QZ5 | Progressive Quiz | PLANNED | Unlocks progressively |
| QZ6 | Diagnostic Quiz | PLANNED | Identifies knowledge gaps |
| QZ7 | Mastery Quiz | PLANNED | Comprehensive mastery assessment |
| QZ8 | Complete Assessment Model | PLANNED | Full assessment framework (FINAL/CLOSED) |

**Note:** Family explicitly CLOSED at QZ8 (no additional versions planned).

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Quiz.md`

---

### Family 17: InterviewBlock (IV)

**Purpose:** Interview preparation  
**Primary Question:** "How would I answer this in an interview?"  
**Position:** End of tutorial sections (professional preparation)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| IV1 | Basic Interview Question | PLANNED | Common interview question |
| IV2 | Interview Q&A | PLANNED | Question with sample answer |
| IV3 | Interview Analysis | PLANNED | Answer analysis (strengths/weaknesses) |
| IV4 | Interview Preparation | PLANNED | Preparation guidance |
| IV5 | Interview Practice | PLANNED | Mock interview practice |
| IV6 | Interview Evaluation | PLANNED | Performance evaluation criteria |
| IV7 | Complete Interview Learning Model | PLANNED | Comprehensive interview prep (FINAL/CLOSED) |

**Note:** Family explicitly CLOSED at IV7 (no additional versions planned).

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Interview.md`

---

### Family 18: ProjectBlock (P)

**Purpose:** Real-world project application  
**Primary Question:** "How do I apply this in a real project?"  
**Position:** End of tutorial sections (capstone)

| Version | Name/Variant | Status | Description |
|---------|-------------|--------|-------------|
| P1 | Basic Project Definition | PLANNED | Project overview and goals |
| P2 | Project Planning | PLANNED | Project planning framework |
| P3 | Project Building | PLANNED | Step-by-step building guide |
| P4 | Iterative Project | PLANNED | Iterative development approach |
| P5 | Collaborative Project | PLANNED | Team project framework |
| P6 | Reflective/Evaluative Project | PLANNED | Project with reflection (GAP / specification missing) |
| P7 | Project Presentation | PLANNED | Project presentation guidance |
| P8 | Complete Project Learning Model | PLANNED | Comprehensive project framework (FINAL) |

**Note:** P6 flagged as GAP DOCUMENTED (semantic role identified but specification missing) in reconciliation reports but included in total count.

**Evidence Sources:**
- Architecture: `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
- Documentation: `ILS_UI_UX/docs/blocksmdfiles/Project.md`

---

## Implementation Primitives (15 Building Blocks)

### Important Distinction

Implementation Primitives are **NOT Educational Block Families**. They are renderer-level building blocks used inside Educational Block components or as standalone content elements.

### Key Differences from Educational Families

**Educational Block Families have:**
- ✅ `version` field (e.g., 'I1', 'D1', 'C1')
- ✅ Version validation in renderer or component
- ✅ Canonical `content.page` structure
- ✅ Pedagogical contracts (learning goals, takeaways, educational sections)
- ✅ Version router component
- ✅ "CANONICAL LOCKED UI" designation
- ✅ Theme-aware rendering

**Implementation Primitives have:**
- ❌ NO `version` field in schema
- ❌ NO version validation
- ❌ NO canonical content structure
- ❌ NO pedagogical purpose
- ✅ Simple, focused rendering logic
- ✅ Composable building blocks
- ✅ UBRC 2/2 attributes (id, type) — NO version by design

### Complete List of 15 Implementation Primitives

| # | Primitive Name | Purpose | Repository Component |
|---|---------------|---------|----------------------|
| 1 | heading | H1-H6 semantic headings | `HeadingBlock.tsx` |
| 2 | paragraph | Text paragraphs | `ParagraphBlock.tsx` |
| 3 | list | Ordered/unordered lists | `ListBlock.tsx` |
| 4 | table | Data tables | `TableBlock.tsx` |
| 5 | image | Image display with caption | `ImageBlock.tsx` |
| 6 | callout | Info boxes (tip/warning/info variants) | `CalloutBlock.tsx` |
| 7 | example | Example container (NOT ExerciseBlock) | `ExampleBlock.tsx` |
| 8 | quote | Blockquote renderer | `QuoteBlock.tsx` |
| 9 | summary | Bullet list renderer (NOT SummaryBlock S1-S6) | `SummaryBlock.tsx` (primitive use) |
| 10 | diagram | Diagram container | `DiagramBlock.tsx` |
| 11 | comparison | Comparison table (NOT ComparisonBlock CP1-CP8) | `ComparisonBlock.tsx` (primitive use) |
| 12 | two-column | 2-column layout container | `TwoColumnBlock.tsx` |
| 13 | three-column | 3-column layout container | `ThreeColumnBlock.tsx` |
| 14 | card-grid | Card grid layout | `CardGridBlock.tsx` |
| 15 | timeline | Timeline visualization | `TimelineBlock.tsx` |

### Relationship to Educational Block Families

Implementation Primitives are **used by** Educational Block Families:

- **IntroductionBlock (I1)** may use: heading, paragraph, image, callout, quote
- **DefinitionBlock (D1)** may use: heading, paragraph, list, diagram, callout
- **CodeBlock (C1)** may use: heading, paragraph, code highlighting (specialized)

Educational Blocks compose primitives into pedagogically structured learning experiences.

### Evidence Sources

- Renderer: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (no version validation for these types)
- Components: `packages/ui/src/tutorial/blocks/*.tsx` (simple rendering, no version field)
- Taxonomy Report: `reconciliation-taxonomy-separation.md` (complete classification)

---

## Corrections Applied

The following corrections were applied based on reconciliation investigations and authoritative repository evidence:

| # | Original Claim | Source Report | Corrected Value | Evidence | Reason |
|---|----------------|---------------|-----------------|----------|--------|
| 1 | **141 total versions** | Corpus Registry | **133 total versions** | FAMILY_VERSION_MATRIX.md aggregate count | Documentation drift — multiple families overcounted |
| 2 | **137 total versions** | Provenance, UBRC Inventory | **133 total versions** | FAMILY_VERSION_MATRIX.md + TypeScript registries | D family outdated + V9-V10 not evidenced |
| 3 | **D1-D8 (8 versions)** | Corpus Registry, Family Matrix | **D1-D6 (6 versions)** | `definition-versions.ts` (TypeScript registry — AUTHORITATIVE) | TypeScript registry defines D1-D6 ONLY. DefinitionBlock.ipynb documents D1-D8 but type system never implemented D7-D8. Runtime contract overrides documentation. |
| 4 | **V1-V10 (10 versions)** | Corpus Registry, Provenance | **V1-V8 (8 versions)** | FAMILY_VERSION_MATRIX.md: "V9, V10 NOT EVIDENCED (contradicts historical register)" | Authoritative specification explicitly states V9-V10 do not have specifications. Historical claims without verification. |
| 5 | **18 block families** (conflation with primitives) | Runtime Compliance | **18 families CORRECT (3 implemented, 15 planned)** | Taxonomy Separation Report + TutorialBlockRenderer.tsx | Correct family count, but primitives were conflated with families in some reports. Separation enforced: 18 families (versioned educational units) vs 15 primitives (building blocks). |
| 6 | **S1 implemented** | Some claims | **S1 INCOMPLETE** | BlockDOMIdentity.test.tsx + SummaryBlock.tsx | S1 has React component but missing `data-block-version` attribute + no version routing. Does NOT meet UBRC compliance for versioned blocks. |
| 7 | **D1 "no version routing"** | Family Version Matrix | **D1 HAS version routing** | DefinitionBlock.tsx lines 20-29 | Component-level version router exists with explicit switch statement and error handling. |

### Evidence Strength Hierarchy

When reconciling contradictions, the following hierarchy was applied:

**CRITICAL (Runtime Contracts):**
1. TypeScript version registries (`definition-versions.ts`, `code-versions.ts`, etc.)
2. React component version routing code (switch statements with error handling)
3. TutorialBlockRenderer version validation

**HIGH (Architecture):**
1. PLANNED-UBRC-BLOCKS-INVENTORY.md (authoritative architecture)
2. FAMILY_VERSION_MATRIX.md (reconciliation evidence ledger)

**MODERATE (Documentation):**
1. Markdown files in `ILS_UI_UX/docs/blocksmdfiles/` (may be aspirational, not implemented)
2. Investigation reports (may contain contradictions)

**Reconciliation Principle:**
- When TypeScript registry conflicts with documentation, TypeScript registry wins (runtime contract)
- When authoritative matrix conflicts with historical reports, matrix wins (evidence-based)
- When direct file evidence conflicts with report claims, file evidence wins (ground truth)

---

## Phase 1 Flags

The following items require attention before Phase 1 implementation:

### Incomplete/Gap Versions (5 Items)

| Version | Family | Issue | Status | Recommendation |
|---------|--------|-------|--------|----------------|
| E3 | ExecutionBlock | Execution with Iteration/Loops | PARTIAL specification | Complete specification before implementing |
| MT8 | MistakeBlock | Advanced/Systematic Debugging | DECLARED/ABSENT specification | Complete or remove from count |
| INT5 | InteractiveBlock | Interactive Simulation | DECLARED/INCOMPLETE specification | Complete specification before implementing |
| INT6 | InteractiveBlock | Interactive System | DECLARED/INCOMPLETE specification | Complete specification before implementing |
| P6 | ProjectBlock | Reflective/Evaluative Project | GAP / specification missing | Create specification or remove from count |

### Removed from Corpus (No Longer Planned)

| Versions | Family | Reason | Evidence |
|----------|--------|--------|----------|
| V9-V10 | VisualBlock | NOT EVIDENCED (no specifications found) | FAMILY_VERSION_MATRIX.md explicitly states "V9, V10 NOT EVIDENCED (contradicts historical register)" |
| D7-D8 | DefinitionBlock | NOT IN TYPE SYSTEM (never implemented) | TypeScript registry `definition-versions.ts` defines D1-D6 ONLY. Documentation drift - .ipynb documented D1-D8 but type system never promoted D7-D8. |

### S1 Completion Requirements

**Summary S1** has a React component but does NOT meet UBRC compliance standards:

**Missing:**
1. `data-block-version` attribute (required for versioned blocks)
2. Version routing in renderer (no validation for summary case)
3. Version router component (no switch statement like I1/D1/C1)
4. Canonical `content.page` structure (uses flat content schema)

**Required for VERIFIED Status:**
1. Add `data-block-version="S1"` attribute to rendered output
2. Add version validation in TutorialBlockRenderer.tsx (throw error for S2-S6)
3. Convert to canonical content structure matching I1/D1/C1 pattern
4. Add version router component if S2-S6 are implemented

**Current Classification:** INCOMPLETE (not counted as implemented)

---

## Evidence Sources

This canonical registry is based on the following authoritative sources:

### Primary Evidence (CRITICAL)

1. **TypeScript Version Registries** (Runtime Contracts)
   - `packages/types/src/tutorial-rich-document/registries/definition-versions.ts`
   - `packages/types/src/tutorial-rich-document/registries/code-versions.ts`
   - `packages/types/src/tutorial-rich-document/registries/summary-versions.ts`
   - `packages/types/src/tutorial-rich-document/registries/introduction-versions.ts`

2. **Authoritative Architecture Documents**
   - `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
   - `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/FAMILY_VERSION_MATRIX.md`

3. **Implementation Evidence**
   - `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
   - `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
   - `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
   - `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

4. **Test Evidence**
   - `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx`
   - `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
   - `packages/ui/src/tutorial/blocks/__tests__/CodeC1Block.test.tsx`

### Secondary Evidence (HIGH)

5. **Reconciliation Reports**
   - `.agents/tasks/reconciliation-version-count.md`
   - `.agents/tasks/reconciliation-version-ranges.md`
   - `.agents/tasks/reconciliation-implementation-status.md`
   - `.agents/tasks/reconciliation-taxonomy-separation.md`

6. **Consolidation Plan**
   - `.agents/tasks/consolidation-plan.md` (authoritative source of truth)

7. **Investigation Reports** (May Contain Contradictions)
   - `.agents/tasks/corpus-registry-extraction.md`
   - `.agents/tasks/family-version-matrix.md`
   - `.agents/tasks/component-provenance.md`
   - `.agents/tasks/runtime-compliance.md`

### Documentation Sources (MODERATE)

8. **Block Family Documentation**
   - `ILS_UI_UX/docs/blocksmdfiles/*.md` (18 family specification files)
   - **Note:** NO .ipynb file references per user instructions
   - Markdown files in `ILS_UI_UX/docs/blocksmdfiles/` and subdirectories only

---

## Document Metadata

**Version:** 1.0 (Canonical Post-HAA-Consolidation)  
**Date:** 2025-01-20  
**Status:** CANONICAL  
**Authority:** HAA Decisions + TypeScript version registries + PLANNED-UBRC-BLOCKS-INVENTORY.md  
**Generated By:** Consolidation Workflow Step 1 (Corpus Registry)  
**Source Plan:** `.agents/tasks/consolidation-plan.md`  
**Verification:** All version counts, ranges, and implementation statuses verified against authoritative repository evidence  

**Total Educational Block Versions:** 133  
**Total Educational Block Families:** 18  
**Verified Implementations:** 3 (I1, C1, D1)  
**Planned Implementations:** 129 versions across 15 families  
**Implementation Primitives:** 15 (NOT counted as families)

---

**End of Canonical Corpus Registry**
