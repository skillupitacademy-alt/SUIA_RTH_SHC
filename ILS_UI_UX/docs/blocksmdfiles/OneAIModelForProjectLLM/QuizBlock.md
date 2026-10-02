# FILE 16 — `QuizBlock.md` — REVIEW COMPLETE

I reviewed the **actual uploaded `QuizBlock.md`**, not the older architecture register.

### Actual source

- **File:** `QuizBlock.md`
- **Size:** 300,908 bytes
- **Total lines:** 15,258
- **Library file ID:** `libfile_c1f3d136710881918752ffb4a1c7fe0a`

This file is substantially larger than the previous InteractiveBlock file and, importantly, it **does fully close the family at QZ8**.

The actual source explicitly says:

> **BLOCK 16 — QuizBlock: COMPLETE**  
> All **8 versions — QZ1 through QZ8 — are now defined**. 

---

# 1. Authoritative QuizBlock version register

The actual file establishes exactly **8 versions**:

| Version | Presentation | Status |
|---|---|---|
| **QZ1** | **Single Question** | ✅ Complete |
| **QZ2** | **Multiple Choice** | ✅ Complete |
| **QZ3** | **Multiple Select** | ✅ Complete |
| **QZ4** | **True / False** | ✅ Complete |
| **QZ5** | **Code Output Quiz** | ✅ Complete |
| **QZ6** | **Scenario Quiz** | ✅ Complete |
| **QZ7** | **Adaptive Quiz** | ✅ Complete |
| **QZ8** | **Complete Topic Quiz** | ✅ Complete |

The opening sequence explicitly lists QZ1–QZ8, and the end explicitly closes the family. 

So unlike FILE 15:

```text
InteractiveBlock
→ INT1–INT4 complete
→ INT5–INT6 declared

QuizBlock
→ QZ1–QZ8 complete
→ FAMILY CLOSED
```

**Do not invent QZ9.**

---

# 2. The most important architectural rule

This is the strongest and most repeated rule in the entire file:

> **QuizBlock is a Tutorial Engine presentation layer that integrates with the existing Exam/Assessment Engine. It must not create a second assessment engine.** 

This means QuizBlock is fundamentally different from a standalone quiz/assessment backend.

The architecture is:

```text
                    QuizBlock
                       │
               Presentation Layer
                       │
                       ▼
             EXISTING ASSESSMENT
                   ENGINE
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Questions      Evaluation      Results
    Attempts        Scoring        Mastery
```

The Tutorial Engine presents the assessment.

The Assessment Engine remains authoritative.

---

# 3. What belongs to the Assessment Engine

The file explicitly assigns the following responsibilities to the existing assessment infrastructure:

- question identity
- question definition
- correct answer
- answer evaluation
- scoring
- attempt tracking
- assessment rules
- mastery
- assessment analytics
- result persistence
- assessment session
- difficulty
- adaptive decisions
- question selection

This creates a very clean ownership boundary.

```text
QuizBlock
    ↓
Presentation / interaction
    ↓
Assessment API
    ↓
Assessment Engine
    ↓
Authoritative assessment result
```

---

# 4. What belongs to the Tutorial Engine

QuizBlock itself handles presentation and tutorial integration:

```text
Question presentation
        ↓
Response interface
        ↓
Learner interaction
        ↓
Submission
        ↓
Returned assessment result
        ↓
Tutorial presentation
```

It can also have tutorial-level completion.

This creates an important distinction:

```text
Assessment Engine
→ Did the learner answer correctly?

Tutorial Engine
→ Did the learner complete this tutorial block?
```

The file explicitly warns against confusing those two concepts. 

---

# 5. QZ1 — Single Question

## Purpose

QZ1 is the smallest QuizBlock assessment presentation.

Core flow:

```text
ONE QUESTION
     ↓
ONE RESPONSE
     ↓
SUBMIT
     ↓
ASSESSMENT ENGINE
     ↓
RESULT / FEEDBACK
```

It is intended for a lightweight assessment checkpoint embedded directly into tutorial learning.

Example:

```text
Python List
    ↓
Explanation
    ↓
Example
    ↓
QZ1
    ↓
"Can a list contain duplicate values?"
    ↓
Learner answers
```

---

# 6. QZ1 vs QuestionBlock

This boundary is explicitly locked.

### QuestionBlock

```text
Question-oriented learning interaction
```

Learner thinks, explains, reasons, predicts, etc.

### QuizBlock QZ1

```text
Assessment-oriented question presentation
```

It is connected to the assessment engine.

Therefore:

```text
QuestionBlock
= learning interaction

QuizBlock
= assessment interaction
```

This is one of the most important distinctions in the corpus.

---

# 7. QZ1 must NOT create its own assessment database

The file explicitly rejects creating something like:

```text
tutorial_quiz_attempts
```

merely for QZ1.

The existing assessment infrastructure should remain authoritative.

The same principle applies to:

```text
question
correct answer
score
attempt
mastery
analytics
```

Do not duplicate these responsibilities inside QuizBlock.

---

# 8. QZ1 completion

The file distinguishes tutorial completion from assessment correctness.

Possible tutorial completion policies include:

### Answered

```text
Learner submits response
        ↓
Block complete
```

### Correct

```text
Learner submits
        ↓
Correct
        ↓
Block complete
```

### Assessment-defined

```text
Assessment Engine
        ↓
Completion decision
```

The recommended lightweight tutorial default is:

```text
Question answered
        ↓
QZ1 complete
```

while correctness remains assessment data.

---

# 9. QZ1 analytics

The file separates tutorial analytics from assessment analytics.

Tutorial-level examples:

```text
quiz_block_viewed
quiz_response_started
quiz_response_submitted
quiz_block_completed
```

Assessment-level examples:

```text
question_attempted
answer_correct
answer_incorrect
score
difficulty
mastery
```

That separation is architecturally valuable.

---

# 10. QZ1 final specification

The file's QZ1 specification establishes:

| Area | QZ1 |
|---|---|
| Block | QuizBlock |
| Version | QZ1 |
| Presentation | Single Question |
| Question count | One |
| Primary purpose | Lightweight assessment checkpoint |
| Question ownership | Existing Assessment Engine |
| Evaluation | Existing Assessment Engine |
| Scoring | Existing Assessment Engine |
| Attempts | Existing Assessment Engine |
| Mastery | Existing Assessment Engine |
| Question ID | Required |
| Question duplication | ❌ |
| Local assessment engine | ❌ |
| Local scoring | ❌ |
| Local question DB | ❌ |
| Response UI | Tutorial Engine |
| Result UI | Tutorial Engine |
| Tutorial completion | Tutorial Engine |
| Assessment result | Assessment Engine |
| Retry policy | Assessment Engine |
| Authentication | Existing platform auth |
| Authorization | Existing assessment rules |
| Persistence | Existing assessment + tutorial progress |
| Analytics | Assessment + tutorial analytics |
| Responsive | ✅ |
| Accessible | ✅ |
| Light theme | ✅ |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark theme | ❌ |
| JSON-driven | ✅ |

The file then marks QZ1 complete and moves to QZ2. 

---

# 11. QZ2 — Multiple Choice

QZ2 introduces a specific response presentation:

```text
QUESTION
   ↓
MULTIPLE OPTIONS
   ↓
SELECT ONE
   ↓
SUBMIT
   ↓
ASSESSMENT ENGINE
   ↓
RESULT
```

The defining rule is:

```text
ONE QUESTION
+
MULTIPLE OPTIONS
+
EXACTLY ONE SELECTION
```

---

# 12. QZ2 is NOT QZ3

This distinction is explicitly preserved.

### QZ2

```text
○ A
○ B
○ C
○ D
```

Exactly one selection.

### QZ3

```text
☐ A
☐ B
☐ C
☐ D
```

Potentially multiple selections.

The file explicitly says these must remain distinct versions.

---

# 13. QZ2 is NOT QZ4

Even though True/False technically has two choices, the file deliberately keeps:

```text
QZ2 → Multiple Choice
QZ4 → Explicit True / False
```

as separate presentation patterns.

So versioning is based on **semantic/presentation intent**, not merely the number of choices.

This is consistent with our corpus rule:

> Version families are not generated simply by combining existing UI controls.

---

# 14. QZ2 architecture

QZ2 remains completely dependent on the existing Assessment Engine.

The source's final architecture is effectively:

```text
Assessment Engine
       │
       ├── question
       ├── options
       ├── correct answer
       ├── evaluation
       ├── scoring
       ├── attempts
       └── mastery
                ↓
             QuizBlock
                ↓
               QZ2
```

The final specification explicitly says:

- question ownership → Assessment Engine
- option ownership → Assessment Engine
- correct answer → Assessment Engine
- evaluation → Assessment Engine
- scoring → Assessment Engine
- attempts → Assessment Engine
- mastery → Assessment Engine
- submission → Assessment API
- UI → Tutorial Engine
- local scoring → ❌
- local assessment engine → ❌
- local question bank → ❌



---

# 15. QZ3 — Multiple Select

QZ3 changes the response semantics:

```text
ONE QUESTION
     ↓
MULTIPLE OPTIONS
     ↓
SELECT MULTIPLE
     ↓
SUBMIT
     ↓
ASSESSMENT ENGINE
     ↓
RESULT
```

The defining characteristic is:

```text
Multiple correct selections may be required.
```

This is not merely QZ2 with checkboxes.

The underlying assessment definition must be able to express multiple correct answers.

---

# 16. QZ3 ownership

The file explicitly preserves the same architecture:

```text
Question definition
       ↓
Assessment Engine

Answer evaluation
       ↓
Assessment Engine

Scoring
       ↓
Assessment Engine

Attempts
       ↓
Assessment Engine

Mastery
       ↓
Assessment Engine
```

QZ3 is only the presentation mode.

This principle is explicitly stated in the file.

---

# 17. QZ3 and QZ8

The source makes an important scope distinction:

```text
QZ3
→ one multiple-select question
```

versus:

```text
QZ8
→ complete topic-level assessment
```

So QZ8 is not merely “QZ3 with more questions.”

It changes the **assessment scope**.

---

# 18. QZ4 — True / False

QZ4 is explicitly part of the committed sequence:

```text
QZ4 — True / False
```

The important point is that QZ4 exists as a **dedicated semantic presentation mode** even though True/False could technically be represented as a two-option multiple-choice question.

Therefore:

```text
QZ2
→ Multiple Choice

QZ4
→ Explicit True / False
```

The actual file establishes this distinction.

### Important source limitation

I did **not** find a standalone `"QZ4 Final Technical Specification"` / `"QZ4 Final Mental Model"` heading in the converted source.

So I will **not invent a detailed QZ4 contract beyond what the file explicitly supports**.

What is safely established:

- QZ4 exists.
- Presentation = True / False.
- It is intentionally distinct from QZ2.
- It belongs to the same centralized Assessment Engine architecture.
- It is part of the final QZ1–QZ8 family sequence.

That is a source-faithful treatment.

---

# 19. QZ5 — Code Output Quiz

QZ5 introduces code as the assessment stimulus.

The learner receives:

```text
CODE
 ↓
PREDICT OUTPUT
 ↓
SUBMIT ANSWER
 ↓
ASSESSMENT ENGINE
 ↓
RESULT
```

The file explicitly states that QZ5 is a **presentation mode for code-output assessment**.

It does **not** become an execution engine.

---

# 20. QZ5 vs InteractiveBlock

This is one of the most important cross-family boundaries.

### QZ5

```text
Read Code
    ↓
Predict Output
    ↓
Submit
    ↓
Assessment Engine
    ↓
Correct / Incorrect
```

### InteractiveBlock INT4

```text
Read Code
    ↓
Predict
    ↓
RUN ACTUAL CODE
    ↓
Actual Result
    ↓
Compare
    ↓
Understand
```

Therefore:

```text
QZ5
= assessed prediction

Interactive INT4
= experiential prediction + actual runtime verification
```

Do not merge them.

The source explicitly identifies QZ5 as dedicated to output prediction and keeps the assessment engine authoritative.

---

# 21. QZ5 does NOT execute the assessment

The source's architectural rule is very clear:

> QZ5 does not execute assessment logic or create a separate quiz engine.

The Assessment Engine owns:

- question definition
- expected answer
- evaluation
- scoring
- attempts
- results
- analytics

The Tutorial Engine owns the presentation.

---

# 22. QZ5 final specification

The source has a formal final technical specification at approximately line 8048.

The major decisions include:

```text
Block
→ QuizBlock

Version
→ QZ5

Presentation
→ Code Output Quiz
```

with assessment ownership remaining centralized.

The file also contains a Composer-oriented reference presentation where an author selects:

```text
QuizBlock
    ↓
Version
    ↓
QZ5 — Code Output Quiz
    ↓
Assessment Question
    ↓
Selected question
```

Again, this is **reference Composer behavior**, not evidence that the current production Composer already implements QZ5.

---

# 23. QZ6 — Scenario Quiz

QZ6 changes the assessment context.

Instead of merely presenting a question, the learner is placed into a realistic situation.

The file defines the concept as:

> A Scenario Quiz places the learner inside a realistic situation and asks them to determine the appropriate technical decision, behavior, diagnosis, or solution.

Conceptually:

```text
SCENARIO
   ↓
CONTEXT
   ↓
PROBLEM
   ↓
QUESTION
   ↓
LEARNER THINKS
   ↓
ANSWER
   ↓
ASSESSMENT ENGINE
   ↓
RESULT
```

---

# 24. QZ6 is not TaskBlock T4

This is an important boundary.

### TaskBlock T4

```text
Scenario
 ↓
Interpret
 ↓
Decide
 ↓
ACT
 ↓
Accomplish task
```

### QuizBlock QZ6

```text
Scenario
 ↓
Interpret
 ↓
Answer
 ↓
Assessment
```

So:

```text
T4
= scenario-based accomplishment

QZ6
= scenario-based assessment
```

A QZ6 scenario can ask the learner to select or explain a decision, but its primary role remains assessment.

---

# 25. QZ6 assessment ownership

The source explicitly keeps:

- question data,
- answer evaluation,
- scoring,
- attempts,
- results,
- mastery,
- assessment analytics

inside the existing Assessment Engine.

The scenario is a presentation/assessment format, not a second scenario engine.

---

# 26. QZ6 final specification

The formal specification is at approximately line 10036.

The major contract is:

```text
Block
→ QuizBlock

Version
→ QZ6

Presentation
→ Scenario Quiz

Purpose
→ scenario-based assessment
```

The Tutorial Engine renders the scenario.

The Assessment Engine remains authoritative for evaluation and assessment state.

---

# 27. QZ7 — Adaptive Quiz

QZ7 is a major architectural expansion.

It changes the assessment sequence from fixed to dynamic.

The core loop is:

```text
START ASSESSMENT
        ↓
GET NEXT QUESTION
        ↓
PRESENT ITEM
        ↓
LEARNER ANSWERS
        ↓
SUBMIT
        ↓
ASSESSMENT ENGINE
        ↓
EVALUATE
        ↓
UPDATE PERFORMANCE
        ↓
SELECT NEXT ITEM
        ↓
QZ7
```

The next question can depend on demonstrated performance.

---

# 28. QZ7 does NOT contain the adaptive algorithm

This is extremely important.

The file explicitly says the Tutorial Engine must not own:

```text
Adaptive algorithm
Question selection
Scoring
Mastery calculation
Question bank
```

Instead:

```text
QuizBlock QZ7
      ↓
Assessment Session
      ↓
Assessment Engine
      ↓
Adaptive decision
      ↓
Next question
```

The source says the authoritative reference for the dynamic assessment should be the assessment/session context rather than simply a fixed question ID.

---

# 29. QZ7 security/authority boundary

The client must never be the authority for:

```text
correctAnswer
score
mastery
difficulty
nextQuestion
completion
```

The source's intended architecture is:

```text
Client
  ↓
Answer
  ↓
Assessment API
  ↓
Assessment Engine
  ↓
Authoritative Result
```

This is an important security rule for the eventual implementation.

---

# 30. QZ7 remediation loop

The file describes a broader learning loop:

```text
Concept
  ↓
Example
  ↓
QZ7
  ↓
Weakness
  ↓
Tutorial remediation
  ↓
QZ7
  ↓
Mastery
```

This is not saying that QZ7 itself becomes the remediation engine.

Rather, it illustrates how the assessment system and Tutorial Engine can cooperate.

---

# 31. QZ7 final specification

The actual formal specification establishes:

| Area | QZ7 |
|---|---|
| Presentation | Adaptive Quiz |
| Primary purpose | Personalize assessment path |
| Sequence | Dynamic |
| Question selection | Assessment Engine |
| Question pool | Assessment Engine |
| Difficulty adaptation | Assessment Engine |
| Skill adaptation | Assessment Engine |
| Topic adaptation | Assessment Engine |
| Mastery | Assessment Engine |
| Stopping rule | Assessment Engine |
| Assessment session | Assessment Engine |
| Scoring | Assessment Engine |
| Attempts | Assessment Engine |
| Analytics | Assessment Engine |
| Tutorial progress | Tutorial Engine |
| UI rendering | Tutorial Engine |
| Question reference | Assessment/session ID |
| Fixed question ID | Usually insufficient as primary reference |
| Adaptive algorithm in Tutorial Engine | ❌ |
| Local scoring | ❌ |
| Local mastery calculation | ❌ |
| Local question selection | ❌ |
| Local question bank | ❌ |
| Code execution | ❌ |
| Authentication | Existing platform auth |
| Authorization | Existing assessment rules |
| Session recovery | Server-side assessment session |
| Responsive | ✅ |
| Accessibility | ✅ |
| Light theme | ✅ |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark overall theme | ❌ |
| JSON-driven | ✅ |

The source then marks QZ7 complete and moves to QZ8. 

---

# 32. QZ8 — Complete Topic Quiz

QZ8 is the final version.

It changes the assessment scope from:

```text
one question
```

or:

```text
one specialized assessment experience
```

to:

```text
ENTIRE TOPIC
```

The source explicitly defines it as the complete-topic assessment presentation/orchestration mode.

---

# 33. QZ8 is not simply “many QZ1 blocks”

This distinction matters.

QZ8 has its own assessment-level concerns:

```text
Topic
 ↓
Assessment Blueprint
 ↓
Question Pool
 ↓
Coverage
 ↓
Difficulty
 ↓
Question Selection
 ↓
Questions
 ↓
Answers
 ↓
Evaluation
 ↓
Score
 ↓
Mastery
 ↓
Topic-Level Result
```

The Assessment Engine controls the assessment definition and orchestration.

The Tutorial Engine presents the result and connects it back to learning/remediation.

---

# 34. QZ8 minimal block representation

The file gives a deliberately small reference representation:

```json
{
  "type": "quiz",
  "version": "QZ8",
  "assessmentId": "python_lists_complete"
}
```

This is significant.

The Tutorial Engine does **not** need to embed:

```text
20 questions
3 reference questions
2 slicing questions
5 beginner questions
...
```

inside the block itself.

Those belong to the assessment definition.

That reinforces the architecture:

```text
Tutorial Block
→ points to assessment

Assessment Engine
→ owns assessment
```

---

# 35. QZ8 final specification

The actual source establishes:

| Area | QZ8 |
|---|---|
| Block | QuizBlock |
| Version | QZ8 |
| Presentation | Complete Topic Quiz |
| Primary purpose | Assess complete topic understanding |
| Scope | Entire topic |
| Reference | Assessment ID |
| Question count | Assessment-defined |
| Question pool | Assessment Engine |
| Assessment blueprint | Assessment Engine |
| Coverage rules | Assessment Engine |
| Difficulty rules | Assessment Engine |
| Question ordering | Assessment Engine |
| Question selection | Assessment Engine |
| Evaluation | Assessment Engine |
| Scoring | Assessment Engine |
| Attempts | Assessment Engine |
| Mastery | Assessment Engine |
| Assessment analytics | Assessment Engine |
| Topic analytics | Existing Analytics Architecture |
| Tutorial progress | Tutorial Engine |
| Question presentation | Existing QuizBlock renderers |
| Multiple Choice | Supported |
| Multiple Select | Supported if assessment supports it |
| True / False | Supported |
| Code Output | Supported |
| Scenario | Supported |
| Adaptive behavior | Only through existing Assessment Engine |
| Local question bank | ❌ |
| Local blueprint | ❌ |
| Local scoring | ❌ |
| Local mastery calculation | ❌ |
| Question duplication | ❌ |
| Authentication | Existing platform auth |
| Authorization | Existing assessment rules |
| Session recovery | Server-side assessment session |
| Review navigation | Assessment policy |
| Retry | Assessment policy |
| Feedback | Assessment result |
| Remediation | Tutorial/assessment integration |
| Accessibility | ✅ |
| Keyboard navigation | ✅ |
| Responsive | ✅ |
| Light theme | ✅ |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark overall theme | ❌ |
| JSON-driven | ✅ |



---

# 36. QZ8 final learning loop

The source gives the final role as:

```text
REVISE
  ↓
QZ8
  ↓
ASSESS
  ↓
ANALYZE
  ↓
REMEDIATE
  ↓
REASSESS
  ↓
MASTER
```

This is important because QZ8 is not merely a final screen.

It is intended to connect assessment results back into the learning process.

But again:

**“Remediation” here is an architectural learning-flow concept in the reference document, not proof that the current production Tutorial Engine already implements this entire loop.**

---

# 37. Complete QuizBlock architecture

The actual file closes the family with this conceptual structure:

```text
                         QuizBlock
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
   Fixed Questions      Specialized          Complete
      QZ1–QZ6            Assessment            Topic
                            │                    │
                            ▼                    ▼
                           QZ7                  QZ8
                            │                    │
                            └─────────┬──────────┘
                                      ▼
                            EXISTING ASSESSMENT
                                  ENGINE
                                      │
                  ┌───────────────────┼───────────────────┐
                  ▼                   ▼                   ▼
              Questions           Evaluation           Analytics
                  │                   │                   │
                  ▼                   ▼                   ▼
                Scoring            Attempts            Mastery
                                      │                   │
                                      └────────┬──────────┘
                                               ▼
                                         Tutorial Engine
                                               │
                                      ┌────────┴────────┐
                                      ▼                 ▼
                                  Progress         Remediation
```

The family is explicitly closed at QZ8. 

---

# 38. The semantic progression of QuizBlock

The eight versions are not random UI variants.

A useful source-derived interpretation is:

```text
QZ1
FOCUSED ASSESSMENT
       ↓
QZ2
SINGLE-SELECTION ASSESSMENT
       ↓
QZ3
MULTI-SELECTION ASSESSMENT
       ↓
QZ4
BINARY STATEMENT ASSESSMENT
       ↓
QZ5
CODE-BEHAVIOR ASSESSMENT
       ↓
QZ6
SCENARIO APPLICATION ASSESSMENT
       ↓
QZ7
ADAPTIVE ASSESSMENT
       ↓
QZ8
COMPLETE TOPIC ASSESSMENT
```

So the progression is not simply:

```text
easy → hard
```

It moves across **assessment form and scope**:

```text
single item
→ response modality
→ specialized technical reasoning
→ contextual application
→ dynamic assessment
→ topic-level orchestration
```

---

# 39. Very important boundary: QuestionBlock vs QuizBlock

This is probably the most important cross-family distinction for your corpus.

## QuestionBlock

```text
KNOW
 ↓
EXPLAIN
 ↓
REASON
 ↓
PREDICT
 ↓
ANALYZE
 ↓
APPLY
 ↓
SYNTHESIZE
```

QuestionBlock is primarily **learning interaction**.

## QuizBlock

```text
QUESTION
 ↓
ANSWER
 ↓
EVALUATE
 ↓
SCORE / RESULT
 ↓
MASTERY / ANALYTICS
```

QuizBlock is **assessment interaction**.

Therefore:

> A question-looking UI does not determine whether something belongs to QuestionBlock or QuizBlock.

The **assessment ownership and semantic purpose** determine the family.

---

# 40. Very important boundary: QuizBlock vs ExerciseBlock

### ExerciseBlock

```text
Learner performs work
        ↓
Practice
        ↓
Validation
        ↓
Skill development
```

### QuizBlock

```text
Learner answers assessment item
        ↓
Assessment Engine
        ↓
Evaluation
        ↓
Score / result / mastery
```

The ExerciseBlock file explicitly positioned itself as the practice engine.

QuizBlock is the assessment presentation layer.

So:

```text
Exercise ≠ Quiz
```

even if both can contain questions, code, answers, or validation.

---

# 41. Very important boundary: QuizBlock vs InteractiveBlock

This one is especially important because QZ5 and INT4 can look superficially similar.

### QZ5

```text
CODE
 ↓
PREDICT
 ↓
SUBMIT
 ↓
ASSESSMENT ENGINE
 ↓
CORRECT / INCORRECT
```

### INT4

```text
CODE
 ↓
PREDICT
 ↓
RUN
 ↓
ACTUAL RESULT
 ↓
COMPARE
 ↓
UNDERSTAND
```

Therefore:

```text
QZ5 = assessed prediction

INT4 = runtime learning experiment
```

Do not combine them into one version.

---

# 42. Very important boundary: QuizBlock vs TaskBlock

### TaskBlock

```text
Objective
 ↓
Perform
 ↓
Accomplish
 ↓
Verify
```

### QuizBlock

```text
Question
 ↓
Answer
 ↓
Assessment
 ↓
Result
```

A scenario is therefore not automatically T4 or QZ6.

The deciding factor is whether the learner is:

```text
accomplishing a task
```

or:

```text
being assessed
```

---

# 43. Very important boundary: QuizBlock vs MistakeBlock

MistakeBlock:

```text
Mistake
 ↓
Why
 ↓
Correction
 ↓
Debugging knowledge
```

QuizBlock QZ6 may ask:

```text
Scenario
 ↓
What should you do?
 ↓
Assessment
```

The latter assesses knowledge; it does not necessarily teach the mistake.

---

# 44. The central single-source-of-truth rule

The strongest architectural principle from FILE 16 is:

```text
                         QUIZBLOCK
                             │
                       Presentation
                             │
                             ▼
                    Assessment Engine
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
       Questions          Evaluation         Analytics
          │                  │                  │
          ▼                  ▼                  ▼
       Attempts           Scoring            Mastery
```

The Tutorial Engine should **not** create parallel versions of these.

This means we should not eventually implement:

```text
QuizBlockQuestionService
QuizBlockScoringEngine
QuizBlockMasteryEngine
QuizBlockQuestionBank
```

simply because QuizBlock exists.

The actual source explicitly argues against that architectural duplication.

---

# 45. Production/runtime evidence check

I searched the actual QuizBlock source for:

- `UBRC`
- `LSNB`
- `RSSB`
- `TutorialBlockRenderer`
- `tutorial_sections`
- `navigationNodeId`
- `certification`

The actual file returned **no matches** for these terms.

Therefore the file does **not** establish that QuizBlock is already integrated with:

```text
UBRC
ILS
LSNB
RSSB
TutorialBlockRenderer
tutorial_sections
navigationNodeId
production certification
```

That remains a separate repository/runtime audit.

---

# 46. What FILE 16 DOES establish

| Area | Evidence |
|---|---|
| QuizBlock family | ✅ |
| QZ1 | ✅ |
| QZ2 | ✅ |
| QZ3 | ✅ |
| QZ4 | ✅ |
| QZ5 | ✅ |
| QZ6 | ✅ |
| QZ7 | ✅ |
| QZ8 | ✅ |
| QZ8 final | ✅ |
| Family closure | ✅ |
| Assessment Engine ownership | ✅ |
| Tutorial presentation ownership | ✅ |
| Assessment/Tutorial completion distinction | ✅ |
| Specialized assessment patterns | ✅ |
| Adaptive assessment concept | ✅ |
| Topic-level assessment concept | ✅ |
| JSON/reference modeling | ✅ |
| Accessibility | ✅ |
| Responsive design | ✅ |
| SUIA visual rules | ✅ |

---

# 47. What FILE 16 does NOT establish

| Production question | Status |
|---|---|
| Current production QuizBlock schema | ❌ |
| Current `tutorial_sections` mapping | ❌ |
| Current `TutorialBlockRenderer` support | ❌ |
| Current Composer registration | ❌ |
| Current UBRC contract | ❌ |
| Current ILS integration | ❌ |
| Current LSNB integration | ❌ |
| Current RSSB integration | ❌ |
| Current assessment API implementation | ❌ |
| Current assessment database schema | ❌ |
| Current QZ1–QZ8 production implementation | ❌ |
| Current certification | ❌ |

This distinction is particularly important because the document sometimes describes an “existing Assessment Engine.” That establishes an **architectural dependency/ownership model in the reference**, but it does not prove the current repository implementation matches every detail.

---

# 48. Reference JSON ≠ production schema

The QuizBlock document contains JSON examples and structures.

For example, QZ8 can be as minimal as:

```json
{
  "type": "quiz",
  "version": "QZ8",
  "assessmentId": "python_lists_complete"
}
```

That is useful evidence for the intended block composition.

But we should not automatically translate that into:

```text
tutorial_sections.content JSON schema
```

until the repository/schema audit confirms the mapping.

This same rule applies to all 16 families we've reviewed so far.

---

# 49. Final FILE 16 corpus entry

I would now record the authoritative corpus entry as:

```text
16. QuizBlock

QZ1–QZ8 — ALL COMPLETE

QZ1 — Single Question
      Lightweight assessment checkpoint

QZ2 — Multiple Choice
      One selection from multiple options

QZ3 — Multiple Select
      Multiple selections

QZ4 — True / False
      Binary statement assessment

QZ5 — Code Output Quiz
      Assess predicted code behavior

QZ6 — Scenario Quiz
      Assess contextual technical decision/application

QZ7 — Adaptive Quiz
      Dynamically adapt assessment path

QZ8 — Complete Topic Quiz
      Assess entire topic
```

Core architectural rule:

```text
QuizBlock
    ↓
Tutorial Engine Presentation Layer
    ↓
Existing Assessment Engine
    ↓
Questions
Evaluation
Scoring
Attempts
Mastery
Assessment Analytics
```

Family progression:

```text
FOCUSED
   ↓
SINGLE SELECTION
   ↓
MULTI SELECTION
   ↓
BINARY
   ↓
CODE BEHAVIOR
   ↓
SCENARIO APPLICATION
   ↓
ADAPTIVE
   ↓
COMPLETE TOPIC
```

**QZ8 is final. No QZ9.**

---

# 50. Corpus status after FILE 16

```text
01 IntroductionBlock   ✅
02 ObjectiveBlock      ✅
03 DefinitionBlock     ✅
04 CodeBlock           ✅
05 VisualBlock         ✅
06 ComparisonBlock     ✅
07 ExecutionBlock      ✅
08 MemoryBlock         ✅
09 MistakeBlock        ✅
10 BestPracticeBlock   ✅
11 SummaryBlock        ✅
12 QuestionBlock       ✅
13 ExerciseBlock       ✅
14 TaskBlock           ✅
15 InteractiveBlock    ✅
16 QuizBlock           ✅  ← NOW
17 ProjectBlock        ⏭ NEXT
18 InterviewBlock
```

### Important difference from FILE 15

```text
InteractiveBlock
→ INT1–INT4 actually complete in source
→ INT5–INT6 declared only

QuizBlock
→ QZ1–QZ8 actually complete in source
→ QZ8 explicitly closes family
```

So **FILE 16 is a genuinely closed 8-version family**.

### Next actual source

**FILE 17 — `ProjectBlock.md`**

That file is especially important because we will need to carefully distinguish:

```text
Task T8 — Real-World Ownership
        ≠
ProjectBlock
```

rather than assuming every realistic implementation task is automatically a ProjectBlock.