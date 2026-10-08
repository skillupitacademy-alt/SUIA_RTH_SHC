# 18-Family Educational Pattern Catalog

**Document Type:** Reusable Semantic Patterns  
**Input Authority:** Stage 2 (Family Matrix) + Stage 3 (Composition Matrix)  
**Status:** Stage 4 — Pattern Catalog  
**Date:** 2026-10-02  

---

## Purpose

This catalog extracts **reusable semantic patterns** observed across the 18 educational block families and their composition relationships.

**Critical Discipline:**

```
Pattern ≠ Family
Pattern ≠ Version
Pattern ≠ Canonical Sequence
Pattern ≠ Runtime Contract
```

A pattern is a **recurring educational structure or teaching technique** that may appear across multiple families/versions, but does NOT:

- Create a new canonical family
- Create a new canonical version
- Replace existing family/version definitions
- Establish production/runtime requirements
- Define mandatory tutorial ordering

Patterns are **descriptive observations**, not **prescriptive requirements**.

---

## Pattern Classification

Patterns are organized into four categories:

| Category | Description |
|---|---|
| **Cognitive Patterns** | Learning progression structures (recall → apply → synthesize) |
| **Structural Patterns** | Content organization templates (problem → solution, before → after) |
| **Pedagogical Patterns** | Teaching techniques (scaffolding, worked examples, reflection) |
| **Composition Patterns** | How families/versions combine (concept → practice, teach → assess) |

---

## Pattern Documentation Format

Each pattern documents:

1. **Pattern Name** — Descriptive identifier
2. **Category** — Cognitive / Structural / Pedagogical / Composition
3. **Description** — What the pattern represents
4. **Educational Purpose** — Why this pattern exists
5. **Manifestations** — Where it appears across families/versions
6. **NOT a New Family/Version** — Explicit boundary statement
7. **Usage Guidance** — When to recognize/apply this pattern

---

# Cognitive Patterns

These patterns represent learner cognitive progression structures.

---

## CP-01: Recall → Understand → Apply

**Category:** Cognitive Pattern

**Description:**
Progressive deepening from remembering facts, to comprehending meaning, to applying knowledge in new contexts.

**Educational Purpose:**
Supports Bloom's taxonomy lower-to-middle cognitive levels; builds foundational understanding before application.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| QuestionBlock | Q1 → Q2 → Q3 | Recall → Comprehension → Application questions |
| DefinitionBlock | D1 → D2 → D3 | Define → Explain → Example |
| CodeBlock | C1 → C2 → C6 | Show code → Explain → Practice |
| ObjectiveBlock | O1 → O2 → O3 | State → Outcomes → Application |

**NOT a New Family/Version:**
This is a **cognitive progression pattern**, not a new educational family. It describes how versions within existing families (or across families) can support progressive cognitive development.

**Usage Guidance:**
- When designing learning sequences, recognize this pattern helps learners build from concrete recall to abstract application
- Can span multiple families: DefinitionBlock D2 → VisualBlock V2 → CodeBlock C2 → QuestionBlock Q2
- Pattern appears naturally in tutorial flow but doesn't mandate specific family ordering

---

## CP-02: Observe → Analyze → Act → Verify

**Category:** Cognitive Pattern

**Description:**
Cycle of observation, analysis, action, and verification that supports experiential learning.

**Educational Purpose:**
Promotes active learning through experimentation and reflection; common in scientific method and engineering design.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| InteractiveBlock | INT2-INT4 | Observe system → Analyze → Experiment → Verify results |
| ExecutionBlock | E1 → E4 → E5 | Trace → Observe state → Predict → Verify |
| ExerciseBlock | EX2 → EX4 → EX7 | Guided practice → Challenge → Reflection |
| TaskBlock | T2 → T5 → T7 | Instructional → Challenge → Reflective |
| MemoryBlock | M1 → M4 → M6 | Visualize → Track lifecycle → Track mutations |

**NOT a New Family/Version:**
This is a **learning cycle pattern**, not a new block family. It describes an iterative learning approach observable across multiple families.

**Usage Guidance:**
- Recognize this pattern when learners need hands-on experimentation
- Can combine: ExecutionBlock E4 + InteractiveBlock INT2 + QuestionBlock Q4
- Pattern supports inquiry-based learning but doesn't replace existing families

---

## CP-03: Problem → Need → Solution

**Category:** Cognitive Pattern

**Description:**
Problem-based learning structure that establishes real-world need before introducing solution.

**Educational Purpose:**
Motivates learning by answering "Why do I need this?" before "What is this?"; increases relevance and engagement.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| IntroductionBlock | I2 | Problem-Based Introduction explicitly uses this pattern |
| ObjectiveBlock | O2 | Objectives with Outcomes connects learning to results |
| DefinitionBlock | D2 | Definition with Explanation can contextualize need |
| BestPractices | BP2 → BP5 | Guideline → Rationale → Context |
| ComparisonBlock | CP4 → CP5 | When to Use (need) → Trade-offs (solution constraints) |

**NOT a New Family/Version:**
This is a **motivational pattern**, not a new family. IntroductionBlock I2 already implements it; other families can adopt similar structure.

**Usage Guidance:**
- Lead with problem/need when introducing new technical concepts
- Can open tutorial: IntroductionBlock I2 → ObjectiveBlock O2 → DefinitionBlock D2
- Pattern increases motivation but doesn't mandate all tutorials use problem-based approach

---

## CP-04: Concept → Explanation → Example

**Category:** Cognitive Pattern

**Description:**
Classic teaching sequence: introduce concept, explain meaning, provide concrete example.

**Educational Purpose:**
Moves from abstract to concrete; supports understanding through exemplification.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| DefinitionBlock | D1 → D2 → D3 | Definition → Explanation → Example |
| CodeBlock | C1 → C2 | Basic Example → With Explanation |
| VisualBlock | V1 → V2 → V3 | Basic Visual → Labels → Explanation |
| BestPractices | BP1 → BP2 → BP3 | Guideline → Rationale → Example |

**NOT a New Family/Version:**
This is a **teaching sequence pattern** observable across multiple families. It's not a new canonical structure.

**Usage Guidance:**
- Widely applicable pattern for introducing technical concepts
- Can span families: DefinitionBlock D2 + VisualBlock V3 + CodeBlock C2
- Pattern is descriptive, not prescriptive

---

## CP-05: Scaffolded Learning (Simple → Complex)

**Category:** Cognitive Pattern

**Description:**
Progressive complexity where learner starts with simplified version and gradually adds complexity.

**Educational Purpose:**
Manages cognitive load; prevents overwhelming learner with full complexity immediately.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ExerciseBlock | EX1 → EX5 | Basic Practice → Scaffolded Exercise |
| TaskBlock | T1 → T4 | Basic Task → Guided Task |
| CodeBlock | C1 → C10 | Basic Example → Complete Code Learning |
| InteractiveBlock | INT1 → INT4 | Basic Interactive → Interactive Scenario |
| ExecutionBlock | E1 → E8 | Basic Trace → Complete Execution Model |
| **All Families** | V1-type → V8-type | General progression pattern |

**NOT a New Family/Version:**
This is a **complexity management pattern**. It describes version progressions within families, not a new family itself.

**Usage Guidance:**
- Natural progression observable in most families
- Lower versions (V1, CP1, Q1, etc.) typically simpler than higher versions
- Tutorial designers can start simple and add complexity incrementally
- Pattern is inherent to version progressions documented in Stage 2

---

## CP-06: Compare → Decide → Act

**Category:** Cognitive Pattern

**Description:**
Decision-making progression: compare alternatives, make informed decision, act on decision.

**Educational Purpose:**
Supports critical thinking and informed choice; teaches decision-making as a skill.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ComparisonBlock | CP1-CP3 → CP4-CP7 | Compare → Decide (When to Use / Selection) |
| TaskBlock | T4-T5 | Guided → Challenge (requires decision) |
| ProjectBlock | P2 → P3 | Planning → Building (design decisions) |
| BestPractices | BP4 → BP5 | Comparison → Contextual (when to apply) |

**NOT a New Family/Version:**
This is a **decision-making pattern**, not a new family. ComparisonBlock implements it explicitly; other families support decision-making contexts.

**Usage Guidance:**
- When teaching requires choosing between alternatives
- ComparisonBlock is dedicated family for comparison reasoning
- Can support: ComparisonBlock CP4 → TaskBlock T4 → ProjectBlock P2
- Pattern describes pedagogical need, not mandatory sequence

---

## CP-07: Recall → Explain → Apply → Analyze → Evaluate → Create

**Category:** Cognitive Pattern

**Description:**
Full Bloom's taxonomy progression from lower-order to higher-order thinking.

**Educational Purpose:**
Comprehensive cognitive development from foundational knowledge to creative synthesis.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| QuestionBlock | Q1 → Q2 → Q3 → Q4 → Q5 → Q6 | Explicitly maps to Bloom's levels |
| DefinitionBlock → BestPractices | D1-D3 → BP1-BP7 | Recall/understand → Apply/analyze |
| CodeBlock → ExerciseBlock → ProjectBlock | C1-C2 → EX1-EX6 → P1-P8 | Understand → Apply → Create |
| ObjectiveBlock | O1 → O5 | State objectives → Integrated objectives |

**NOT a New Family/Version:**
This is a **cognitive development pattern** recognized in learning science. It's not a new block family or mandatory tutorial sequence.

**Usage Guidance:**
- QuestionBlock Q1-Q6 explicitly implements Bloom's taxonomy
- Other families support various cognitive levels
- Not every tutorial must address all six levels
- Pattern provides cognitive framework, not prescriptive ordering

---

# Structural Patterns

These patterns represent content organization templates.

---

## SP-01: Before → Change → After

**Category:** Structural Pattern

**Description:**
Transformation structure showing initial state, intervention/change, and resulting state.

**Educational Purpose:**
Clarifies impact of actions, operations, or transformations; shows cause and effect.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ExecutionBlock | E1, E4 | State before → execution step → state after |
| MemoryBlock | M4, M6 | Memory state → allocation/mutation → new state |
| CodeBlock | C3 | Code before refactoring → change → code after |
| ComparisonBlock | CP1-CP2 | Compare state A vs state B |
| MistakeBlock | MT3 | Wrong code → correction → correct code |

**NOT a New Family/Version:**
This is a **transformation pattern**, not a new family. Multiple families use this structure internally.

**Usage Guidance:**
- Useful when teaching operations that transform state
- ExecutionBlock and MemoryBlock naturally use this structure
- Can combine: CodeBlock C1 (before) → ExecutionBlock E4 (change) → MemoryBlock M6 (after)
- Pattern is descriptive observation, not new canonical version

---

## SP-02: Problem → Diagnosis → Solution

**Category:** Structural Pattern

**Description:**
Troubleshooting structure: identify problem, diagnose root cause, apply solution.

**Educational Purpose:**
Teaches debugging and problem-solving methodology; develops diagnostic thinking.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| MistakeBlock | MT1 → MT2 → MT3 | Identify → Explain why wrong → Correct |
| IntroductionBlock | I2 | Problem-Based Introduction |
| BestPractices | BP6 | Best Practice with Anti-Patterns (problem avoidance) |
| ProjectBlock | P4 | Iterative Project (identify issues → improve) |

**NOT a New Family/Version:**
This is a **troubleshooting pattern**. MistakeBlock implements it explicitly; other families can adopt diagnostic approach.

**Usage Guidance:**
- Critical for teaching debugging and error correction
- MistakeBlock is dedicated family for error-based learning
- Can combine: MistakeBlock MT2 + CodeBlock C2 + BestPractices BP6
- Pattern supports problem-solving pedagogy

---

## SP-03: Input → Process → Output

**Category:** Structural Pattern

**Description:**
Functional transformation: what goes in, how it's processed, what comes out.

**Educational Purpose:**
Clarifies function behavior; abstracts systems thinking; useful for teaching algorithms, APIs, data pipelines.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ExecutionBlock | E1, E5 | Input values → execution trace → output/result |
| CodeBlock | C2, C5 | Function signature → implementation → return value |
| VisualBlock | V4 | Input → flow steps → output |
| DefinitionBlock | D6 | Specification includes input/output contracts |
| InteractiveBlock | INT2-INT3 | User input → system behavior → observable result |

**NOT a New Family/Version:**
This is a **functional pattern** observable when teaching computational processes. Not a new family.

**Usage Guidance:**
- Useful for teaching functions, methods, algorithms, data transformations
- Multiple families can represent: DefinitionBlock D6 (specification) + CodeBlock C5 (implementation) + ExecutionBlock E1 (trace) + VisualBlock V4 (flow)
- Pattern is general systems thinking, not block-specific

---

## SP-04: Part → Whole → Composition

**Category:** Structural Pattern

**Description:**
Compositional structure: understand individual parts, then how they compose into whole.

**Educational Purpose:**
Teaches modular thinking; shows how components integrate into systems.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| VisualBlock | V2 → V7 → V8 | Labels (parts) → Annotations (parts) → Complete Model (whole) |
| CodeBlock | C4 → C7 → C10 | Commented parts → Analysis → Complete model |
| DefinitionBlock | D1-D4 → D7 | Individual concepts → Related concepts → Complete definition |
| ProjectBlock | P3 → P5 → P8 | Build components → Collaborative (integration) → Complete |
| ComparisonBlock | CP2 → CP8 | Features (parts) → Complete Comparison (integrated) |

**NOT a New Family/Version:**
This is a **compositional pattern** reflecting systems thinking. Not a new canonical family.

**Usage Guidance:**
- Useful for teaching modular systems, architectures, composed solutions
- Many V8/final versions use this pattern (V8, C10, P8, CP8)
- Pattern describes part-whole relationship pedagogy
- Not mandatory structure for all teaching

---

## SP-05: Rule → Example → Application

**Category:** Structural Pattern

**Description:**
Teaching sequence: state rule/principle, show example, guide application.

**Educational Purpose:**
Moves from abstract principle to concrete instantiation to independent use.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| BestPractices | BP1 → BP3 → BP5 | Guideline → Example → Contextual application |
| DefinitionBlock | D1 → D3 → D4 | Definition → Example → Related concepts |
| CodeBlock | C1 → C2 → C6 | Example → Explanation → Challenge (apply) |
| ExerciseBlock | EX2 → EX3 → EX4 | Guided → Structured → Challenge |

**NOT a New Family/Version:**
This is a **instructional pattern** observed across teaching families. Not a new family.

**Usage Guidance:**
- Classic teaching structure: principle → instantiation → practice
- Can span: BestPractices BP1 → CodeBlock C2 → ExerciseBlock EX3
- Pattern is pedagogical observation, not prescriptive requirement

---

## SP-06: Concept A → Concept B → Relationship

**Category:** Structural Pattern

**Description:**
Comparative structure: introduce concept A, introduce concept B, explain relationship.

**Educational Purpose:**
Teaches relational thinking; clarifies how concepts connect/differ/interact.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ComparisonBlock | CP1-CP3 | A vs B → Similarities/Differences → Relationship |
| DefinitionBlock | D4 | Definition with Related Concepts |
| VisualBlock | V5-V6 | Concept Map (relationships) / Comparison |
| CodeBlock | C3 | Code Comparison |

**NOT a New Family/Version:**
This is a **relational pattern**. ComparisonBlock implements it explicitly; other families support relational teaching.

**Usage Guidance:**
- Critical when teaching multiple related concepts
- ComparisonBlock is dedicated family for comparison/relationship reasoning
- Can combine: DefinitionBlock D4 (multiple concepts) → ComparisonBlock CP3 → VisualBlock V5 (concept map)
- Pattern describes relational pedagogy

---

## SP-07: Context → Action → Consequence

**Category:** Structural Pattern

**Description:**
Conditional structure: given context/situation, take action, observe consequence.

**Educational Purpose:**
Teaches contextual decision-making; shows how actions depend on and affect context.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ComparisonBlock | CP4, CP6 | Given situation → Choose A/B → Reasoning/outcome |
| ExecutionBlock | E2 | Condition → Branch → Result |
| BestPractices | BP5 | Context → Contextual practice → Outcome |
| TaskBlock | T4 | Guided Task with contextual guidance |
| ProjectBlock | P2-P3 | Plan (context) → Build (action) → Result |

**NOT a New Family/Version:**
This is a **contextual decision pattern**. Not a new family; describes conditional reasoning pedagogy.

**Usage Guidance:**
- Teaches "when" questions: when to use, when to apply, when to choose
- ComparisonBlock CP4/CP6 explicitly teach contextual decisions
- Can combine: ComparisonBlock CP4 → TaskBlock T4 → ProjectBlock P2
- Pattern supports situational learning

---

# Pedagogical Patterns

These patterns represent teaching techniques and instructional strategies.

---

## PP-01: Worked Example

**Category:** Pedagogical Pattern

**Description:**
Instructional technique showing complete worked solution that learner studies before attempting similar problem.

**Educational Purpose:**
Reduces cognitive load; provides mental model; supports learning through observation; cognitive load theory principle.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| CodeBlock | C1-C4 | Code examples that learners study |
| ExecutionBlock | E1 | Complete execution trace to study |
| MemoryBlock | M1-M4 | Memory state visualizations to study |
| VisualBlock | V1-V8 | Visual representations to study |
| ComparisonBlock | CP1-CP8 | Comparison examples to study |
| MistakeBlock | MT3 | Correction as worked example |

**NOT a New Family/Version:**
This is a **cognitive load reduction technique**, not a new family. Multiple families provide worked examples.

**Usage Guidance:**
- Lower-numbered versions often function as worked examples
- Precedes practice: CodeBlock C2 (worked example) → ExerciseBlock EX1 (practice)
- Technique is fundamental to many families but doesn't define new canonical structure
- Stage 3 PREDECESSOR relationships often reflect worked example → practice flow

---

## PP-02: Scaffolding

**Category:** Pedagogical Pattern

**Description:**
Temporary support structure that guides learner and gradually removes as competence develops.

**Educational Purpose:**
Supports zone of proximal development; enables learner to accomplish more with guidance than alone.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ExerciseBlock | EX2, EX5 | Guided Exercise / Scaffolded Exercise explicitly named |
| TaskBlock | T2, T4 | Instructional Task / Guided Task |
| InteractiveBlock | INT1-INT4 | Progressive interaction complexity |
| CodeBlock | C6 | Code Challenge with implicit scaffolding |
| ProjectBlock | P1-P8 | Progressive project complexity |

**NOT a New Family/Version:**
This is a **support strategy**, not a new family. Multiple families provide scaffolded learning.

**Usage Guidance:**
- ExerciseBlock EX2/EX5 and TaskBlock T2/T4 explicitly implement scaffolding
- Can structure tutorial: CodeBlock C2 → ExerciseBlock EX2 (scaffolded) → ExerciseBlock EX6 (open-ended)
- Technique is pedagogical strategy observable across families
- Not mandatory for all practice blocks

---

## PP-03: Reflection

**Category:** Pedagogical Pattern

**Description:**
Metacognitive technique where learner explicitly thinks about their own learning, understanding, or process.

**Educational Purpose:**
Develops metacognition; deepens understanding; supports transfer; critical for expert development.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| QuestionBlock | Q7 | Reflection Question explicitly named |
| ExerciseBlock | EX7 | Reflective Exercise explicitly named |
| TaskBlock | T7 | Reflective Task explicitly named |
| InterviewBlock | IV3-IV6 | Interview Analysis / Evaluation |
| ProjectBlock | P6*, P7 | Reflective/Evaluative Project (P6 gap) / Presentation |
| SummaryBlock | S1-S6 | Summary itself is reflective activity |

**NOT a New Family/Version:**
This is a **metacognitive technique**, not a new family. Multiple families support reflection.

**Usage Guidance:**
- V7 versions in practice families (Q7, EX7, T7) explicitly implement reflection
- Can follow practice: ExerciseBlock EX4 → QuestionBlock Q7 (reflection)
- Technique supports deeper learning but not mandatory for all tutorials
- SummaryBlock often functions as reflective consolidation

---

## PP-04: Progressive Disclosure

**Category:** Pedagogical Pattern

**Description:**
Information revelation technique that introduces complexity gradually rather than all at once.

**Educational Purpose:**
Manages cognitive load; prevents overwhelm; allows mental model to form before adding detail.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| DefinitionBlock | D1 → D7 | Basic definition → Complete technical definition |
| CodeBlock | C1 → C10 | Basic example → Complete code model |
| VisualBlock | V1 → V8 | Basic visual → Complete visual model |
| ExecutionBlock | E1 → E8 | Basic trace → Complete execution model |
| **All Families** | Version progressions | Natural characteristic of version sequences |

**NOT a New Family/Version:**
This is a **complexity management technique**. It describes how version progressions work, not a new family.

**Usage Guidance:**
- Fundamental principle underlying version progressions in Stage 2
- Lower versions typically disclose less; higher versions more complete
- Tutorial can sequence: DefinitionBlock D1 → D3 → D6 (progressive disclosure within family)
- Technique is inherent to educational reference corpus structure

---

## PP-05: Anchoring (Prior Knowledge Connection)

**Category:** Pedagogical Pattern

**Description:**
Instructional technique connecting new learning to learner's existing knowledge.

**Educational Purpose:**
Facilitates learning transfer; builds on existing mental models; increases relevance and retention.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| IntroductionBlock | I3 | Connection-Based Introduction explicitly named |
| DefinitionBlock | D4 | Definition with Related Concepts |
| ComparisonBlock | CP1-CP8 | Comparison to known concepts |
| VisualBlock | V5 | Concept Map (shows relationships to known) |

**NOT a New Family/Version:**
This is an **instructional technique**, not a new family. Multiple families support prior knowledge activation.

**Usage Guidance:**
- IntroductionBlock I3 explicitly implements anchoring
- Can open tutorial: IntroductionBlock I3 → DefinitionBlock D4 → ComparisonBlock CP1
- Technique increases learning efficiency but not mandatory
- Assumes learner has prerequisite knowledge to anchor to

---

## PP-06: Formative Assessment

**Category:** Pedagogical Pattern

**Description:**
Low-stakes assessment during learning to check understanding and guide instruction.

**Educational Purpose:**
Provides feedback during learning (not just at end); helps learner and teacher identify gaps; supports adjustment.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| QuestionBlock | Q1-Q8 | Questions throughout tutorial = formative assessment |
| ExerciseBlock | EX1-EX8 | Practice with feedback = formative |
| TaskBlock | T1-T8 | Tasks with verification = formative |
| InteractiveBlock | INT1-INT4 | Interactive feedback = formative |
| QuizBlock | QZ1-QZ2 | Basic/Explanation Quiz can be formative (vs summative) |

**NOT a New Family/Version:**
This is an **assessment strategy**. Multiple families support formative assessment; not a new canonical structure.

**Usage Guidance:**
- QuestionBlock throughout tutorial = formative assessment
- QuizBlock at end = typically summative assessment (MUST REMAIN DISTINCT from QuestionBlock)
- Stage 3 distinguishes: QuestionBlock (learning/formative) ≠ QuizBlock (formal/summative)
- Technique guides when to use QuestionBlock vs QuizBlock

---

## PP-07: Spaced Repetition

**Category:** Pedagogical Pattern

**Description:**
Learning technique where concepts are revisited at increasing intervals to strengthen retention.

**Educational Purpose:**
Supports long-term retention; counters forgetting curve; evidence-based learning strategy.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| SummaryBlock | S1-S6 | Reviews/revisits learned concepts |
| QuestionBlock | Q1-Q8 | Questions can revisit earlier concepts |
| IntroductionBlock | I3 | Can reference prior tutorial concepts |
| ComparisonBlock | CP3-CP8 | Can compare new vs previously-learned concepts |

**NOT a New Family/Version:**
This is a **retention strategy**, not a new family. Pattern describes how tutorial structure can support spaced repetition.

**Usage Guidance:**
- SummaryBlock naturally revisits concepts from earlier in tutorial
- Multiple tutorials can build spaced repetition: Tutorial 1 (learn) → Tutorial 2 IntroductionBlock I3 (revisit) → Tutorial 3 ComparisonBlock (compare)
- Technique operates at tutorial sequence level, not single-block level
- Pattern is learning science principle, not canonical block structure

---

## PP-08: Collaborative Learning

**Category:** Pedagogical Pattern

**Description:**
Learning technique where learners work together, leveraging peer interaction and discussion.

**Educational Purpose:**
Develops communication skills; exposes multiple perspectives; peer teaching reinforces learning.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| TaskBlock | T6 | Collaborative Task explicitly named |
| ProjectBlock | P5 | Collaborative Project explicitly named |
| ExerciseBlock | EX6 | Open-Ended Exercise (can be collaborative) |

**NOT a New Family/Version:**
This is a **social learning strategy**, not a new family. Some versions explicitly support collaboration.

**Usage Guidance:**
- TaskBlock T6 and ProjectBlock P5 explicitly implement collaboration
- Collaboration is delivery/facilitation concern, not always visible in block content itself
- Pattern is pedagogical strategy available for some versions
- Not applicable to all families (e.g., DefinitionBlock is inherently individual learning)

---

## PP-09: Mistake-Driven Learning

**Category:** Pedagogical Pattern

**Description:**
Learning technique that explicitly uses errors as teaching opportunities.

**Educational Purpose:**
Normalizes mistakes; develops error detection/correction skills; shows common pitfalls; supports debugging mindset.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| MistakeBlock | MT1-MT7 | Entire family dedicated to mistake-driven learning |
| BestPractices | BP6 | Best Practice with Anti-Patterns |
| CodeBlock | C9 | Code Exercise (may include debugging) |
| InterviewBlock | IV3 | Interview Analysis (analyzing answers, including mistakes) |

**NOT a New Family/Version:**
This is an **error-based pedagogy**, not a new family. MistakeBlock is dedicated family; other families can incorporate error awareness.

**Usage Guidance:**
- MistakeBlock is primary family for mistake-driven learning
- Can combine: CodeBlock C2 → MistakeBlock MT3 → BestPractices BP6 → ExerciseBlock EX3
- Technique is particularly effective for debugging, error handling, edge cases
- Pattern is pedagogical approach, not mandatory for all tutorials

---

## PP-10: Authenticity (Real-World Context)

**Category:** Pedagogical Pattern

**Description:**
Learning technique using real-world problems, scenarios, or applications rather than artificial exercises.

**Educational Purpose:**
Increases motivation; supports transfer; prepares for professional practice; shows relevance.

**Manifestations:**

| Family | Version | How Pattern Appears |
|---|---|---|
| ProjectBlock | P1-P8 | Entire family emphasizes authentic projects |
| IntroductionBlock | I2 | Problem-Based Introduction (real problems) |
| TaskBlock | T1-T8 | Tasks can be authentic real-world tasks |
| InterviewBlock | IV1-IV7 | Authentic interview preparation |
| BestPractices | BP1-BP7 | Professional practices (authentic context) |

**NOT a New Family/Version:**
This is a **relevance strategy**, not a new family. Multiple families support authentic learning contexts.

**Usage Guidance:**
- ProjectBlock and InterviewBlock emphasize authenticity
- IntroductionBlock I2 can ground tutorial in real-world problem
- Authenticity is pedagogical goal, not mandatory for all content
- Some concepts need foundational understanding before authentic application

---

# Composition Patterns

These patterns represent how families and versions combine in practice.

---

## CoP-01: Teach → Practice → Assess

**Category:** Composition Pattern

**Description:**
Fundamental instructional sequence: teach concept, provide practice, assess understanding.

**Educational Purpose:**
Complete learning cycle; ensures concept introduction, application, and verification.

**Manifestations:**

| Teaching Phase | Practice Phase | Assessment Phase |
|---|---|---|
| DefinitionBlock D1-D7 | ExerciseBlock EX1-EX8 | QuestionBlock Q1-Q8 |
| CodeBlock C1-C5 | CodeBlock C6-C9 | QuizBlock QZ1-QZ8 |
| VisualBlock V1-V8 | InteractiveBlock INT1-INT4 | SummaryBlock S1-S6 |
| ComparisonBlock CP1-CP8 | TaskBlock T1-T8 | InterviewBlock IV1-IV7 |

**NOT a New Family/Version:**
This is a **tutorial sequence pattern** describing how Zone 2 (teaching) → Zone 3 (practice) → Zone 4 (assessment) compose. Not a new family.

**Usage Guidance:**
- Fundamental pattern in Stage 3 Zone-based organization
- Can manifest as: DefinitionBlock D3 → ExerciseBlock EX2 → QuestionBlock Q2
- Pattern is descriptive of common tutorial flow, not prescriptive requirement
- Not every tutorial must include all three phases

---

## CoP-02: Concept + Visual + Code (Multi-Modal)

**Category:** Composition Pattern

**Description:**
Multi-modal teaching that combines verbal (definition), visual, and code representations of same concept.

**Educational Purpose:**
Supports different learning styles; reinforces understanding through multiple representations; cognitive load theory.

**Manifestations:**

```
DefinitionBlock D2-D3
        +
VisualBlock V2-V3 (COMPLEMENTARY)
        +
CodeBlock C1-C2 (COMPLEMENTARY)
```

**NOT a New Family/Version:**
This is a **multi-modal teaching pattern**. Stage 3 documents these as COMPLEMENTARY relationships, not a new canonical family.

**Usage Guidance:**
- Leverages Stage 3 COMPLEMENTARY relationships
- DefinitionBlock + VisualBlock + CodeBlock can all teach same concept from different angles
- Blocks can appear in any order or subset (all three not mandatory)
- Pattern supports rich multi-modal learning but doesn't create new family

---

## CoP-03: Example → Practice → Challenge

**Category:** Composition Pattern

**Description:**
Progressive practice sequence: study worked example, do guided practice, face independent challenge.

**Educational Purpose:**
Gradual release of responsibility; cognitive apprenticeship model; scaffolded independence.

**Manifestations:**

```
CodeBlock C1-C2 (Example)
        ↓
ExerciseBlock EX2 (Guided Practice)
        ↓
ExerciseBlock EX4 (Challenge)
```

Or:

```
ExecutionBlock E1 (Example)
        ↓
InteractiveBlock INT2 (Experiment/Practice)
        ↓
TaskBlock T5 (Challenge)
```

**NOT a New Family/Version:**
This is a **scaffolded practice pattern** observable across Zone 2 → Zone 3 transitions. Not a new family.

**Usage Guidance:**
- Reflects PP-01 (Worked Example) + PP-02 (Scaffolding) pedagogical patterns
- Stage 3 PREDECESSOR/SUCCESSOR relationships often reflect this flow
- Can customize: vary example family, practice family, challenge complexity
- Pattern guides tutorial flow design, not prescriptive requirement

---

## CoP-04: Orient → Teach → Consolidate

**Category:** Composition Pattern

**Description:**
Complete tutorial arc: orient learner, teach content, consolidate learning.

**Educational Purpose:**
Complete learning experience with beginning (orientation), middle (teaching), end (consolidation).

**Manifestations:**

```
ZONE 1: IntroductionBlock I1-I6 + ObjectiveBlock O1-O5
        ↓
ZONE 2: Concept Teaching Families
        ↓
ZONE 4: SummaryBlock S1-S6 or QuizBlock QZ1-QZ8
```

**NOT a New Family/Version:**
This is a **tutorial structure pattern** describing Zone 1 → Zone 2 → Zone 4 composition. Stage 3 documents zone organization.

**Usage Guidance:**
- Reflects Stage 3 five-zone pedagogical organization
- Complete tutorial might use: IntroductionBlock I2 + ObjectiveBlock O3 + [teaching blocks] + SummaryBlock S5
- Pattern is high-level tutorial structure, not mandatory template
- Zone 3 (practice) often appears within Zone 2 (concept teaching), not always as separate phase

---

## CoP-05: Definition → Comparison → Selection

**Category:** Composition Pattern

**Description:**
Decision-making sequence: define alternatives, compare them, guide selection/decision.

**Educational Purpose:**
Supports informed decision-making; teaches critical evaluation; prepares for design choices.

**Manifestations:**

```
DefinitionBlock D1-D4 (multiple concepts)
        ↓
ComparisonBlock CP1-CP7
        ↓
TaskBlock T4 (contextual application)
        or
ProjectBlock P2 (design decision)
        or
BestPractices BP5 (contextual guideline)
```

**NOT a New Family/Version:**
This is a **decision support pattern**. Stage 3 documents ComparisonBlock PREDECESSOR relationships to decision-requiring families.

**Usage Guidance:**
- ComparisonBlock is dedicated family for comparison reasoning
- Can structure: DefinitionBlock D3 (A) + DefinitionBlock D3 (B) → ComparisonBlock CP4 → TaskBlock T4
- Pattern teaches "when to use what" decisions
- Common in architecture, tool selection, design pattern tutorials

---

## CoP-06: Code → Execution → Memory

**Category:** Composition Pattern

**Description:**
Deep code understanding sequence: show code structure, trace runtime execution, explain memory/state behavior.

**Educational Purpose:**
Develops complete mental model of code behavior beyond syntax; teaches what actually happens at runtime.

**Manifestations:**

```
CodeBlock C2-C5
        ↓
ExecutionBlock E1-E8 (COMPLEMENTARY)
        ↓
MemoryBlock M1-M8 (COMPLEMENTARY)
```

**NOT a New Family/Version:**
This is a **deep code teaching pattern**. Stage 3 documents these families as COMPLEMENTARY with clear boundaries.

**Usage Guidance:**
- Stage 3 establishes: CodeBlock (static) + ExecutionBlock (runtime) + MemoryBlock (state) are COMPLEMENTARY but distinct
- Can compose: CodeBlock C5 → ExecutionBlock E4 → MemoryBlock M6
- Pattern is deep technical teaching approach
- Not all code tutorials need execution and memory detail

---

## CoP-07: Mistake → Correction → Practice

**Category:** Composition Pattern

**Description:**
Error-based learning sequence: identify mistake, show correction, practice avoiding it.

**Educational Purpose:**
Develops error awareness and correction skills; prevents common mistakes through explicit teaching.

**Manifestations:**

```
MistakeBlock MT1-MT4
        ↓
BestPractices BP1-BP6 (guideline to prevent)
        ↓
ExerciseBlock EX2-EX4 (practice correctly)
```

**NOT a New Family/Version:**
This is an **error prevention pattern**. Stage 3 documents MistakeBlock composition relationships.

**Usage Guidance:**
- MistakeBlock is dedicated family for mistake-driven learning
- Can structure: CodeBlock C2 (correct) → MistakeBlock MT3 (error + correction) → ExerciseBlock EX3 (practice)
- Pattern supports debugging mindset development
- Particularly valuable for concepts with common misconceptions

---

## CoP-08: Concept → Practice → Project

**Category:** Composition Pattern

**Description:**
Comprehensive learning arc: teach foundational concepts, provide structured practice, apply in authentic project.

**Educational Purpose:**
Complete progression from understanding to application; prepares for real-world use.

**Manifestations:**

```
ZONE 2: Concept Teaching (Definition, Visual, Code, etc.)
        ↓
ZONE 3: Practice (Exercise, Task, Interactive)
        ↓
ZONE 5: ProjectBlock P1-P8 or InterviewBlock IV1-IV7
```

**NOT a New Family/Version:**
This is a **complete learning arc pattern** reflecting Zone 2 → Zone 3 → Zone 5 progression. Stage 3 documents zone relationships.

**Usage Guidance:**
- Stage 3 establishes ProjectBlock and InterviewBlock as advanced application families
- Can structure comprehensive tutorial: [Concept teaching] → [Practice] → ProjectBlock P8
- Pattern is ambitious tutorial structure, not requirement for all content
- Zone 5 families (Project, Interview) assume substantial prior learning

---

## CoP-09: Visual + Interaction

**Category:** Composition Pattern

**Description:**
Combination of static visual representation with interactive exploration capability.

**Educational Purpose:**
Allows learner to manipulate visual representation; supports inquiry-based learning; active engagement.

**Manifestations:**

```
VisualBlock V1-V8
        +
InteractiveBlock INT1-INT4 (COMPLEMENTARY)
```

**Critical Boundary:**
```
VisualBlock explicitly EXCLUDES interaction (Stage 2/Stage 3)
InteractiveBlock provides interaction capability
→ COMPLEMENTARY but architecturally distinct
```

**NOT a New Family/Version:**
This is a **static + dynamic teaching pattern**. Stage 3 establishes VisualBlock and InteractiveBlock as COMPLEMENTARY with architectural boundary.

**Usage Guidance:**
- VisualBlock = static visual teaching (interaction explicitly excluded)
- InteractiveBlock = interaction capability
- Can combine: VisualBlock V3 (static explanation) + InteractiveBlock INT2 (experiment with concept)
- Pattern leverages strengths of both families while respecting boundaries
- Do NOT merge into single "interactive visual" family (violates Stage 2/Stage 3 boundaries)

---

## CoP-10: Question → Summary (Reflection → Consolidation)

**Category:** Composition Pattern

**Description:**
Metacognitive sequence: reflection questions followed by summary consolidation.

**Educational Purpose:**
Combines active retrieval (questions) with organized review (summary); supports retention and synthesis.

**Manifestations:**

```
QuestionBlock Q1-Q8 (throughout tutorial)
        ↓
SummaryBlock S1-S6 (end of tutorial)
```

Or:

```
ExerciseBlock EX7 (Reflective Exercise)
        ↓
SummaryBlock S5-S6 (Review Summary)
```

**NOT a New Family/Version:**
This is a **metacognitive consolidation pattern**. Stage 3 documents these as Zone 3 → Zone 4 relationships.

**Usage Guidance:**
- QuestionBlock throughout tutorial provides retrieval practice
- SummaryBlock at end provides organized review
- Both support retention but serve different purposes (active retrieval vs organized review)
- Pattern combines PP-03 (Reflection) with consolidation

---

# Pattern Application Guidance

## When to Recognize Patterns

Patterns are **descriptive observations** that help:

1. **Tutorial Design:** "This tutorial needs comparison reasoning → use ComparisonBlock family"
2. **Family Selection:** "Learner needs worked examples before practice → CodeBlock C2 precedes ExerciseBlock EX2"
3. **Composition Decisions:** "Teaching complex concept → use multi-modal pattern (Definition + Visual + Code)"
4. **Quality Assessment:** "Tutorial jumps from definition to challenge without worked example → missing PP-01 pattern"

## When NOT to Use Patterns

Patterns should NOT:

1. **Create New Families:** "We see Problem → Solution pattern → let's create ProblemBlock family"
   - **Wrong:** Pattern ≠ Family; use existing families (IntroductionBlock I2, etc.)

2. **Create New Versions:** "We combined CP2 + CP4 → let's call it CP9"
   - **Wrong:** Derived composition ≠ new canonical version (Stage 3 Rule 2)

3. **Mandate Tutorial Structure:** "All tutorials must use CoP-04 (Orient → Teach → Consolidate)"
   - **Wrong:** Patterns are options, not requirements

4. **Override Family Boundaries:** "Visual + Interaction pattern → merge VisualBlock + InteractiveBlock"
   - **Wrong:** MUST REMAIN DISTINCT boundaries from Stage 2/Stage 3 must be preserved

5. **Establish Runtime Requirements:** "Spaced repetition pattern → build spaced repetition API"
   - **Wrong:** Educational patterns ≠ runtime/infrastructure requirements (Stage 5 concern)

## Pattern vs Family Decision Tree

```
Observed recurring structure?
        ↓
Is it already a family in Stage 2?
        ↓
    YES → Use that family (not a new pattern)
        ↓
    NO → Continue
        ↓
Does it appear across multiple families/versions?
        ↓
    NO → It's family-specific behavior, not a pattern
        ↓
    YES → Continue
        ↓
Does it describe HOW families/versions relate or compose?
        ↓
    YES → It's a Composition Pattern (CoP)
        ↓
    NO → Continue
        ↓
Does it describe a teaching technique or strategy?
        ↓
    YES → It's a Pedagogical Pattern (PP)
        ↓
    NO → Continue
        ↓
Does it describe content organization structure?
        ↓
    YES → It's a Structural Pattern (SP)
        ↓
    NO → Continue
        ↓
Does it describe cognitive progression?
        ↓
    YES → It's a Cognitive Pattern (CP)
        ↓
    NO → May not be a pattern; re-evaluate
```

---

# Pattern Catalog Summary

## Pattern Inventory

| Category | Count | Pattern IDs |
|---|---|---|
| **Cognitive Patterns** | 7 | CP-01 through CP-07 |
| **Structural Patterns** | 7 | SP-01 through SP-07 |
| **Pedagogical Patterns** | 10 | PP-01 through PP-10 |
| **Composition Patterns** | 10 | CoP-01 through CoP-10 |
| **TOTAL** | **34** | **34 documented patterns** |

## Cross-Pattern Relationships

Some patterns combine or relate:

- **CP-01 (Recall → Understand → Apply)** appears in **PP-04 (Progressive Disclosure)** and **CoP-01 (Teach → Practice → Assess)**
- **PP-01 (Worked Example)** supports **CoP-03 (Example → Practice → Challenge)**
- **PP-02 (Scaffolding)** relates to **CP-05 (Simple → Complex)** and **PP-04 (Progressive Disclosure)**
- **PP-03 (Reflection)** appears in **CoP-10 (Question → Summary)**
- **PP-09 (Mistake-Driven Learning)** manifests as **CoP-07 (Mistake → Correction → Practice)**

## Pattern Usage Statistics

Based on Stage 2 manifestations:

| Most Common Pattern Types | Families/Versions |
|---|---|
| **Progressive Disclosure** | All families with version progressions (18 families) |
| **Worked Example** | CodeBlock, ExecutionBlock, MemoryBlock, VisualBlock, ComparisonBlock (14+ versions) |
| **Scaffolding** | ExerciseBlock, TaskBlock, InteractiveBlock, ProjectBlock (8+ versions) |
| **Reflection** | QuestionBlock Q7, ExerciseBlock EX7, TaskBlock T7, SummaryBlock (10+ versions) |
| **Concept → Explanation → Example** | DefinitionBlock, CodeBlock, VisualBlock, BestPractices (20+ versions) |

---

# Critical Boundaries Preserved

This pattern catalog preserves all critical boundaries from Stage 2 and Stage 3:

## Educational vs Runtime

**Patterns are EDUCATIONAL observations**, not runtime/infrastructure specifications:

- Spaced repetition pattern ≠ spaced repetition scheduling API
- Formative assessment pattern ≠ ILS telemetry API
- Collaborative learning pattern ≠ real-time collaboration infrastructure
- Interactive pattern ≠ state persistence/RSSB

**Runtime concerns deferred to Stage 5 Architecture Audit.**

## Pattern vs Family vs Version

**Patterns do NOT create new families or versions:**

- Problem → Solution pattern ≠ new ProblemBlock family (use IntroductionBlock I2)
- Worked Example pattern ≠ new ExampleBlock family (use CodeBlock C1-C2, etc.)
- Reflection pattern ≠ new ReflectionBlock family (use QuestionBlock Q7, etc.)
- Multi-modal pattern ≠ new MultiModalBlock family (compose existing families)

## MUST REMAIN DISTINCT Boundaries

**Patterns respect family boundaries from Stage 3:**

- Visual + Interaction pattern = VisualBlock + InteractiveBlock (COMPLEMENTARY, not merged)
- Visual V6 + ComparisonBlock = separate families (MUST REMAIN DISTINCT)
- Visual V4 + ExecutionBlock = separate families (MUST REMAIN DISTINCT)
- QuestionBlock + QuizBlock = separate families (MUST REMAIN DISTINCT)

## Composition Patterns ≠ Mandatory Sequences

**Composition patterns are OPTIONS, not requirements:**

- CoP-01 (Teach → Practice → Assess) is common, not mandatory
- CoP-04 (Orient → Teach → Consolidate) is one structure, not universal template
- CoP-06 (Code → Execution → Memory) is deep teaching approach, not requirement
- Tutorials can use subset of patterns based on pedagogical need

---

# Stage 4 Completion Status

**Status:** COMPLETE  
**Input:** Stage 2 (Family Matrix) + Stage 3 (Composition Matrix)  
**Output:** 34 reusable educational patterns  

**Key Deliverables:**
1. ✅ 7 Cognitive Patterns (learner progression structures)
2. ✅ 7 Structural Patterns (content organization templates)
3. ✅ 10 Pedagogical Patterns (teaching techniques)
4. ✅ 10 Composition Patterns (family/version combinations)
5. ✅ Pattern application guidance
6. ✅ Pattern vs Family decision tree
7. ✅ Critical boundaries preserved (educational ≠ runtime, pattern ≠ family, etc.)
8. ✅ Cross-pattern relationships documented

**Patterns Extracted Without:**
- Creating new families
- Creating new versions
- Establishing production requirements
- Defining runtime contracts
- Mandating tutorial sequences

**Next Stage:** Stage 5 — Architecture Audit (Production Correlation)

---

# Authority Chain

```
Human Architecture Authority
        ↓
Corpus Governance / General.md
        ↓
18 Educational Family Specifications
        ↓
Stage 2: Family / Version / Semantic Progression Matrix
        ↓
Stage 3: Composition Matrix
        ↓
THIS DOCUMENT (Stage 4: Pattern Catalog)
        ↓
[Stage 5] Architecture Audit (Production Correlation)
        ↓
Project LLM Implementation Guidance
```

---

**Document Authority:** Educational Pattern Layer  
**Production Correlation:** NOT YET CONDUCTED (Stage 5)  
**Runtime Authority:** NOT ESTABLISHED BY THIS CATALOG  
**Last Updated:** 2026-10-02  

**Stage 4 Complete:** 34 patterns extracted from 18 families, 132 versions, and their composition relationships
