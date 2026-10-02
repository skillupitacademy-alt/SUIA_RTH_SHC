# BLOCK 16 — QuizBlock

## QZ1 — Single Question

Yes. We start **Block 16 with only the first version**, exactly as you requested. We will proceed one version at a time.

The committed QuizBlock sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| **QZ1** | **Single Question** | 🔵 **CURRENT** |
| QZ2     | Multiple Choice     | ⏳              |
| QZ3     | Multiple Select     | ⏳              |
| QZ4     | True / False        | ⏳              |
| QZ5     | Code Output Quiz    | ⏳              |
| QZ6     | Scenario Quiz       | ⏳              |
| QZ7     | Adaptive Quiz       | ⏳              |
| QZ8     | Complete Topic Quiz | ⏳              |

And one architectural rule is **locked**:

> **QuizBlock is a Tutorial Engine presentation layer that integrates with the existing Exam/Assessment Engine. It must not create a second assessment engine.**

---

# 1. What Is QZ1 — Single Question?

**QZ1 — Single Question** is the simplest QuizBlock presentation.

It presents:

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

The important point is:

> **QZ1 is a single-question presentation, not a separate quiz engine.**

The Tutorial Engine is responsible for:

* displaying the question
* displaying the response interface
* collecting the learner interaction
* sending the response to the assessment system
* displaying the returned result

The existing assessment architecture remains responsible for:

* question identity
* correct answer
* evaluation
* scoring
* attempt tracking
* assessment rules
* mastery
* analytics
* result persistence

---

# 2. Why QZ1 Exists

The learner may be reading a tutorial and reach a point where the author wants to ask:

> **Do you understand this concept?**

A complete exam is unnecessary.

A full multi-question quiz is unnecessary.

One focused question is enough.

For example:

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

QZ1 provides a lightweight assessment checkpoint inside the tutorial.

---

# 3. QZ1 Is Different From QuestionBlock

This distinction must remain locked.

You already defined:

> **QuestionBlock** = question-oriented learning interaction.

QZ1 is:

> **QuizBlock** = assessment-oriented question presentation integrated with the assessment engine.

Therefore:

### QuestionBlock

```text
Question
   ↓
Think
   ↓
Respond
   ↓
Discuss / Explain
```

### QZ1

```text
Assessment Question
   ↓
Answer
   ↓
Evaluate
   ↓
Assessment Result
```

---

# 4. QuestionBlock vs QZ1

For example:

### QuestionBlock

> What happens if we modify a list while another variable references the same list?

The learner may write:

> Both variables observe the same underlying list because they reference the same object.

The purpose is reasoning and learning.

### QZ1

> What happens when `a.append(4)` is executed after `b = a`?

```text
○ b remains unchanged
○ b also reflects the change
○ b becomes None
○ Error
```

The purpose is assessment.

---

# 5. QZ1 Does Not Own Assessment Logic

This is one of the most important architectural rules.

Do **not** build:

```text
Tutorial Engine
 └── Quiz Engine
      ├── scoring
      ├── attempts
      ├── answers
      ├── mastery
      └── results
```

Instead:

```text
Tutorial Engine
      │
      │ presents
      ▼
QuizBlock QZ1
      │
      │ submits response
      ▼
Existing Assessment Engine
      │
      ├── evaluates
      ├── scores
      ├── records attempt
      ├── calculates result
      └── returns assessment state
```

This prevents duplicated assessment architecture.

---

# 6. Architectural Ownership

The separation should be:

| Responsibility        | Owner             |
| --------------------- | ----------------- |
| Question presentation | Tutorial Engine   |
| QZ1 UI                | Tutorial Engine   |
| Response interaction  | Tutorial Engine   |
| Question identity     | Assessment Engine |
| Correct answer        | Assessment Engine |
| Evaluation            | Assessment Engine |
| Scoring               | Assessment Engine |
| Attempt               | Assessment Engine |
| Result                | Assessment Engine |
| Mastery               | Assessment Engine |
| Assessment analytics  | Assessment Engine |
| Tutorial progress     | Tutorial Engine   |
| Block completion      | Tutorial Engine   |

This separation keeps the architecture clean.

---

# 7. QZ1 Basic Presentation

A simple QZ1 can look like:

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ What does `len([10, 20, 30])` return?        │
│                                              │
│ [ Your Answer __________________________ ]   │
│                                              │
│                 [ Submit ]                   │
└──────────────────────────────────────────────┘
```

The exact response control depends on the question definition.

QZ1 itself does not necessarily mean text input.

It means:

> **One assessment question presented at a time.**

---

# 8. QZ1 Question Types

QZ1 can support a simple response depending on the assessment question configuration.

For example:

### Text response

```text
Your answer:
[________________]
```

### Single selection

```text
○ True
○ False
```

### Single-choice options

```text
○ A
○ B
○ C
○ D
```

However, when a question's primary presentation becomes specifically:

> Multiple Choice

that belongs to **QZ2**.

Therefore QZ1 should remain the minimal single-question presentation.

---

# 9. QZ1 Core Flow

```text
┌───────────────┐
│ Tutorial Page │
└───────┬───────┘
        ↓
┌───────────────┐
│ QZ1 Block     │
└───────┬───────┘
        ↓
┌───────────────┐
│ Load Question │
└───────┬───────┘
        ↓
┌───────────────┐
│ Learner       │
│ Responds      │
└───────┬───────┘
        ↓
┌───────────────┐
│ Submit        │
└───────┬───────┘
        ↓
┌────────────────────┐
│ Assessment Engine  │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Evaluation Result  │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ QZ1 Feedback       │
└────────────────────┘
```

---

# 10. QZ1 Example — Python

Suppose the tutorial is explaining lists.

The block presents:

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ What is the result of:                       │
│                                              │
│ len([10, 20, 30])                            │
│                                              │
│ ○ 2                                          │
│ ○ 3                                          │
│ ○ 4                                          │
│ ○ Error                                      │
│                                              │
│ [ Submit Answer ]                            │
└──────────────────────────────────────────────┘
```

The learner selects:

```text
3
```

QZ1 submits the response.

The Assessment Engine evaluates it.

Result:

```text
✓ Correct
```

---

# 11. QZ1 Example — Concept Question

For Python references:

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ If:                                          │
│                                              │
│ a = [1, 2, 3]                                │
│ b = a                                        │
│                                              │
│ What does `a is b` return?                   │
│                                              │
│ ○ True                                       │
│ ○ False                                      │
│                                              │
│ [ Submit ]                                   │
└──────────────────────────────────────────────┘
```

The question itself is stored and evaluated by the assessment architecture.

---

# 12. QZ1 Example — Exception Handling

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ Which exception is raised by:                │
│                                              │
│ int("hello")                                 │
│                                              │
│ ○ TypeError                                  │
│ ○ ValueError                                 │
│ ○ IndexError                                 │
│ ○ KeyError                                   │
│                                              │
│ [ Submit ]                                   │
└──────────────────────────────────────────────┘
```

Again:

```text
QZ1
 ↓
Assessment Engine
 ↓
Evaluation
```

---

# 13. QZ1 Example — OOP

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ Which method resolution order does Python    │
│ use when resolving inherited attributes?     │
│                                              │
│ [ learner response ]                         │
│                                              │
│ [ Submit ]                                   │
└──────────────────────────────────────────────┘
```

The assessment engine determines the evaluation rules.

---

# 14. QZ1 Question Identity

The Tutorial Engine should reference an assessment question.

For example:

```json
{
  "type": "quiz",
  "version": "QZ1",
  "questionId": "question_12345"
}
```

The important part is:

> **The question is identified by the assessment system rather than duplicated inside the tutorial block.**

---

# 15. QZ1 Question Reference

Conceptually:

```text
Tutorial Content
      │
      ▼
QZ1
      │
      │ questionId
      ▼
Assessment Question
```

The question record can contain:

```text
Question ID
Question text
Question type
Options
Correct answer
Difficulty
Topic
Skill
Explanation
Scoring metadata
```

QZ1 only consumes what it needs for presentation.

---

# 16. QZ1 Does Not Duplicate Question Data

Avoid:

```json
{
  "questionId": "123",
  "question": "What is...",
  "correctAnswer": "B"
}
```

inside the tutorial block if the assessment engine already owns that question.

Prefer:

```json
{
  "type": "quiz",
  "version": "QZ1",
  "questionId": "123"
}
```

This creates a single source of truth.

---

# 17. Why This Matters

Suppose a question is used in:

```text
Tutorial
Exam
Practice
Assessment
Review
```

If each system stores its own copy:

```text
Tutorial Question
Exam Question
Practice Question
Review Question
```

they can drift apart.

Instead:

```text
              Assessment Question
               /      |      \
              /       |       \
        Tutorial     Exam    Practice
           QZ1
```

One question definition can serve multiple experiences.

---

# 18. QZ1 Submission

The Tutorial Engine sends something conceptually like:

```json
{
  "questionId": "question_12345",
  "response": "B"
}
```

The assessment layer handles evaluation.

It may return:

```json
{
  "correct": true,
  "score": 1
}
```

The exact API contract should follow the existing assessment architecture rather than inventing a new one specifically for QuizBlock.

---

# 19. QZ1 Result

The UI can display:

```text
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ `len([10, 20, 30])` returns `3`.             │
│                                              │
│ [ Continue → ]                               │
└──────────────────────────────────────────────┘
```

The explanation should ideally come from the assessment question configuration.

---

# 20. QZ1 Incorrect Response

```text
┌──────────────────────────────────────────────┐
│ ✕ Not quite                                 │
│                                              │
│ The correct answer is 3.                    │
│                                              │
│ `len()` returns the number of elements in    │
│ the list.                                    │
│                                              │
│ [ Continue → ]                               │
└──────────────────────────────────────────────┘
```

Again, QZ1 is displaying the assessment result rather than independently calculating it.

---

# 21. QZ1 Feedback Ownership

Recommended:

```text
Question definition
      ↓
Assessment Engine
      ↓
Result + feedback metadata
      ↓
QZ1
      ↓
Presentation
```

The Tutorial Engine should not independently decide:

```text
if answer === correctAnswer
```

when the assessment engine already owns evaluation.

---

# 22. QZ1 Attempt

If the assessment architecture already supports attempts, QZ1 should use that mechanism.

For example:

```text
QZ1
 ↓
Assessment Attempt
 ↓
Question Response
 ↓
Evaluation
 ↓
Result
```

No parallel:

```text
tutorial_quiz_attempts
```

should be introduced simply for QZ1.

---

# 23. QZ1 Tutorial Progress

There is still a Tutorial Engine concern:

> Did the learner complete this block?

For example:

```json
{
  "blockId": "block_42",
  "status": "completed"
}
```

This is different from:

```text
Assessment Result
```

Therefore:

```text
Assessment Engine
→ Did the learner answer correctly?

Tutorial Engine
→ Did the learner complete this tutorial block?
```

---

# 24. QZ1 Completion Policies

The author can configure how the block completes.

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
Returns completion decision
```

The third approach is useful when the assessment architecture already has established rules.

---

# 25. Recommended Default

For a lightweight tutorial checkpoint:

```text
Question answered
        ↓
QZ1 complete
```

Correctness remains available as assessment data.

Why?

Because a tutorial should generally allow the learner to continue learning after making a mistake.

---

# 26. QZ1 Retry

Retry behavior should follow the assessment architecture.

Possible:

```text
[ Try Again ]
```

or:

```text
[ Review ]
```

or:

```text
[ Continue ]
```

QZ1 should not invent its own attempt policy if the assessment engine already defines one.

---

# 27. QZ1 Assessment Context

The tutorial can provide context:

```text
Tutorial:
Python Lists → Indexing
```

The question may belong to:

```text
Topic:
Python Lists

Skill:
Indexing
```

But the authoritative assessment metadata remains in the assessment system.

---

# 28. QZ1 Analytics

QZ1 can emit tutorial-level events:

```text
quiz_block_viewed
quiz_response_started
quiz_response_submitted
quiz_block_completed
```

The assessment engine independently tracks:

```text
question_attempted
answer_correct
answer_incorrect
score
difficulty
mastery
```

This maintains clear ownership.

---

# 29. QZ1 Analytics Architecture

```text
                    QZ1
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
 Tutorial Analytics      Assessment Analytics
          │                     │
          ▼                     ▼
Block completion       Question attempt
Tutorial progress      Correctness
Engagement             Score
                       Mastery
```

This avoids duplicate analytics.

---

# 30. QZ1 Loading State

When the question is being retrieved:

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ Loading question...                          │
│                                              │
│ ███████████████████                          │
└──────────────────────────────────────────────┘
```

The UI should avoid flashing incomplete question data.

---

# 31. QZ1 Error State

If the assessment service cannot provide the question:

```text
┌──────────────────────────────────────────────┐
│ Unable to load this question.                │
│                                              │
│ Please try again.                            │
│                                              │
│ [ Retry ]                                    │
└──────────────────────────────────────────────┘
```

The Tutorial Engine should not fabricate question content.

---

# 32. QZ1 Submission Error

If submission fails:

```text
┌──────────────────────────────────────────────┐
│ We couldn't submit your answer.              │
│                                              │
│ Your answer has not been recorded.           │
│                                              │
│ [ Try Again ]                                │
└──────────────────────────────────────────────┘
```

The response should not be silently marked complete.

---

# 33. QZ1 Network Recovery

A robust flow:

```text
Answer
 ↓
Submit
 ↓
Network failure
 ↓
Retry
 ↓
Assessment Engine
 ↓
Result
```

The frontend should prevent accidental duplicate submissions where possible.

---

# 34. QZ1 Submit State

After clicking Submit:

```text
[ Submitting... ]
```

The button should become temporarily disabled.

This prevents:

```text
double-click
      ↓
duplicate submission
```

---

# 35. QZ1 Question Lock

After submission:

```text
Question
   ↓
Response locked
   ↓
Assessment result
```

If the assessment engine allows retries, a new attempt should be explicitly initiated.

---

# 36. QZ1 Accessibility

The block should support:

```text
Keyboard navigation
Screen readers
Visible focus states
Semantic labels
Accessible form controls
Error announcements
Result announcements
```

For example:

```text
Question
 ↓
Answer control
 ↓
Submit
 ↓
Feedback
```

should have a logical keyboard order.

---

# 37. QZ1 Responsive Design

Desktop:

```text
┌─────────────────────────────────────────┐
│ Question                                │
│                                         │
│ Answer                                  │
│                                         │
│                [ Submit ]               │
└─────────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────┐
│ Question             │
│                      │
│ Answer               │
│                      │
│ [ Submit ]           │
└──────────────────────┘
```

The interaction should remain simple.

---

# 38. QZ1 Visual Design

Using the established Tutorial Engine design language:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Use:

* light background
* white question card
* dark blue question text
* pink primary action
* subtle borders
* soft shadows
* clear response controls
* no gradients
* no dark theme

The visual emphasis should be on:

```text
QUESTION
   ↓
RESPONSE
   ↓
RESULT
```

---

# 39. QZ1 UI Anatomy

```text
┌─────────────────────────────────────────────┐
│ 🔵 QUICK CHECK                              │
│                                             │
│ Question                                    │
│ ─────────────────────────────────────────── │
│                                             │
│ What does `len([1,2,3])` return?            │
│                                             │
│ ○ 2                                         │
│ ○ 3                                         │
│ ○ 4                                         │
│                                             │
│                           [ Submit ]         │
└─────────────────────────────────────────────┘
```

The label can simply be:

> **Quick Check**

rather than presenting it as a full exam.

---

# 40. QZ1 Progress Indicator

Because there is only one question:

```text
Question 1
```

is enough.

Avoid:

```text
Question 1 of 50
```

because that implies a larger quiz when QZ1 is simply a single-question block.

---

# 41. QZ1 Question Number

The block itself may optionally display:

```text
Question
```

rather than:

```text
Q1
```

because **QZ1 is a technical version identifier**, not necessarily a learner-facing label.

---

# 42. QZ1 Explanation

If the assessment system returns explanation metadata:

```text
✓ Correct

Why?

`len()` returns the number of elements
contained in the list.
```

The Tutorial Engine presents it.

It does not own the explanation logic.

---

# 43. QZ1 Feedback Modes

Possible assessment result states:

```text
correct
incorrect
partially_correct
not_evaluated
```

QZ1 should render the state returned by the assessment architecture.

---

# 44. QZ1 Partial Correctness

If the assessment system supports partial scoring:

```text
Your score:
0.5 / 1
```

QZ1 can display it.

But QZ1 itself should not implement partial scoring rules.

---

# 45. QZ1 Assessment Result

Conceptually:

```json
{
  "questionId": "question_12345",
  "response": "B",
  "correct": true,
  "score": 1,
  "feedback": "Correct."
}
```

This is illustrative.

The actual structure should follow your existing assessment API contract.

---

# 46. QZ1 Tutorial Block Data

The Tutorial Engine should keep its block definition small:

```json
{
  "type": "quiz",
  "version": "QZ1",
  "questionId": "question_12345"
}
```

Optional presentation configuration:

```json
{
  "type": "quiz",
  "version": "QZ1",
  "questionId": "question_12345",
  "presentation": {
    "showFeedback": true,
    "allowRetry": true
  }
}
```

But these settings must not duplicate assessment rules.

---

# 47. QZ1 Full Flow

```text
Tutorial Content
      │
      ▼
QZ1 Block
      │
      ▼
Question ID
      │
      ▼
Assessment Engine
      │
      ▼
Question Definition
      │
      ▼
QZ1 renders question
      │
      ▼
Learner responds
      │
      ▼
Assessment Submission
      │
      ▼
Assessment Engine
      │
      ├── Evaluate
      ├── Record Attempt
      ├── Calculate Score
      └── Produce Result
      │
      ▼
QZ1 renders Result
      │
      ▼
Tutorial Block Completion
```

---

# 48. QZ1 Example End-to-End

### Tutorial

> Python Lists — Indexing

### QZ1

> What is the last valid index of a list containing three elements?

Response:

```text
○ 1
○ 2
○ 3
○ 4
```

Learner selects:

```text
2
```

Submission:

```text
QZ1
 ↓
Assessment Engine
```

Result:

```text
✓ Correct
```

Feedback:

> Python uses zero-based indexing, so the indexes are `0`, `1`, and `2`.

Then:

```text
[ Continue → ]
```

---

# 49. QZ1 Example — Incorrect

Learner selects:

```text
3
```

Assessment result:

```text
✕ Incorrect
```

Feedback:

> A three-element list has indexes `0`, `1`, and `2`.

Tutorial state:

```text
Answered: Yes
Correct: No
```

Depending on completion policy:

```text
Block: Complete
```

or:

```text
Block: Requires Retry
```

The assessment engine remains the authority for correctness.

---

# 50. QZ1 Example — Concept Check

Tutorial explanation:

> A variable in Python refers to an object rather than containing the object itself.

Then:

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ What does this expression evaluate to?       │
│                                              │
│ a = [1, 2]                                   │
│ b = a                                        │
│ a is b                                       │
│                                              │
│ ○ True                                       │
│ ○ False                                      │
│                                              │
│ [ Submit ]                                   │
└──────────────────────────────────────────────┘
```

This provides an assessment checkpoint immediately after the explanation.

---

# 51. QZ1 Authoring

The author should select an existing assessment question:

```text
Question:
Q-1024

Presentation:
QZ1
```

rather than recreate the question inside the Tutorial Composer.

This is a critical architectural principle.

---

# 52. QZ1 Composer UI

A Tutorial Composer could expose:

```text
┌──────────────────────────────────────────────┐
│ QuizBlock                                    │
│                                              │
│ Version                                      │
│ [ QZ1 — Single Question ▼ ]                 │
│                                              │
│ Assessment Question                          │
│ [ Search question...                     🔍 ]│
│                                              │
│ Selected                                    │
│ Q-1024                                       │
│ "What does a refer to in Python?"            │
│                                              │
│ [ Use Question ]                             │
└──────────────────────────────────────────────┘
```

The composer selects the assessment question.

---

# 53. QZ1 Question Search

The author could search:

```text
Python references
```

and receive:

```text
Q-1024
What does `a is b` test?

Q-1088
What happens when two variables reference
the same list?
```

The author selects one.

The question remains owned by the assessment system.

---

# 54. QZ1 Question Reuse

The same assessment question could theoretically appear in:

```text
Tutorial A → QZ1
Tutorial B → QZ1
Practice → Assessment
Exam → Assessment
```

The question remains a single entity.

This is precisely why QuizBlock should integrate with the existing assessment architecture.

---

# 55. QZ1 Question Versioning

If the assessment engine supports question versioning:

```text
Question Q-1024
     ↓
Version 1
Version 2
Version 3
```

QZ1 should reference the appropriate assessment question/version according to the existing assessment contract.

The Tutorial Engine should not implement its own question versioning system.

---

# 56. QZ1 Security

QZ1 does not execute arbitrary code.

Therefore its security model is simpler than InteractiveBlock.

However:

```text
Question data
Answer submission
Assessment result
```

must still respect authentication and authorization rules.

---

# 57. QZ1 Authentication

For an authenticated learner:

```text
Tutorial
   ↓
QZ1
   ↓
Assessment API
   ↓
Authenticated request
```

The Tutorial Engine should use the existing authentication/session mechanism.

It should not introduce another quiz-specific authentication mechanism.

---

# 58. QZ1 Anonymous Mode

If your existing assessment architecture supports anonymous attempts, QZ1 can use that.

Otherwise:

```text
QZ1
 ↓
Login required
```

The Tutorial Engine should follow the assessment system's existing policy rather than inventing one.

---

# 59. QZ1 Authorization

Question access may depend on:

```text
User
Course
Tutorial
Assessment
Subscription
Role
```

Again:

> **The existing authorization architecture remains authoritative.**

QZ1 should request access through the appropriate assessment API.

---

# 60. QZ1 Assessment Boundary

The clean architecture is:

```text
┌───────────────────────────────┐
│ Tutorial Engine               │
│                               │
│ QZ1 Presentation              │
│ Block Progress                │
│ UI                            │
└───────────────┬───────────────┘
                │
                │ Assessment API
                ▼
┌───────────────────────────────┐
│ Existing Assessment Engine    │
│                               │
│ Questions                     │
│ Attempts                      │
│ Answers                       │
│ Evaluation                    │
│ Scoring                       │
│ Results                       │
│ Mastery                       │
│ Analytics                     │
└───────────────────────────────┘
```

This boundary should remain stable through QZ8.

---

# 61. QZ1 and Tutorial Progress

Tutorial progress may store:

```text
tutorialId
tutorialVersion
blockId
userId
completedAt
```

It should not store:

```text
correctAnswer
score
questionAttempt
```

because those belong to the assessment system.

Instead, it can reference:

```text
assessmentAttemptId
```

if needed.

---

# 62. QZ1 Completion Example

```json
{
  "blockId": "block-quiz-01",
  "status": "completed",
  "assessmentAttemptId": "attempt-789"
}
```

This provides a clean relationship:

```text
Tutorial Progress
       │
       └── references Assessment Attempt
```

rather than duplicating it.

---

# 63. QZ1 Failure Handling

If the assessment engine returns:

```text
Question unavailable
```

QZ1 should display:

```text
This assessment question is currently unavailable.

[ Retry ]
```

If evaluation fails:

```text
We couldn't evaluate your answer.

Please try again.
```

The system should not guess whether the learner was correct.

---

# 64. QZ1 Loading Question vs Evaluation

These are separate states:

```text
LOADING QUESTION
      ↓
QUESTION READY
      ↓
ANSWERING
      ↓
SUBMITTING
      ↓
EVALUATING
      ↓
RESULT
```

This gives the UI predictable behavior.

---

# 65. QZ1 State Machine

```text
┌─────────────┐
│   LOADING   │
└──────┬──────┘
       ↓
┌─────────────┐
│    READY    │
└──────┬──────┘
       ↓
┌─────────────┐
│  ANSWERING  │
└──────┬──────┘
       ↓
┌─────────────┐
│ SUBMITTING  │
└──────┬──────┘
       ↓
┌─────────────┐
│  EVALUATING │
└──────┬──────┘
       ↓
┌─────────────┐
│    RESULT   │
└──────┬──────┘
       ↓
┌─────────────┐
│  COMPLETED  │
└─────────────┘
```

---

# 66. QZ1 Optional Retry State

If retry is enabled:

```text
RESULT
  ↓
TRY AGAIN
  ↓
NEW ATTEMPT
  ↓
ANSWERING
```

The assessment engine owns the attempt rules.

---

# 67. QZ1 Does Not Need a Local Question Database

This is worth making explicit.

Do **not** create:

```text
tutorial_questions
tutorial_answers
tutorial_quiz_attempts
tutorial_quiz_results
```

just to support QZ1.

Instead:

```text
Tutorial Content
     ↓
questionId
     ↓
Existing Assessment Engine
```

The Tutorial Engine stores the reference.

---

# 68. QZ1 Minimal JSON

The cleanest possible block:

```json
{
  "type": "quiz",
  "version": "QZ1",
  "questionId": "question_12345"
}
```

That is enough for the basic presentation.

---

# 69. QZ1 Extended Presentation Configuration

Optional presentation-only configuration:

```json
{
  "type": "quiz",
  "version": "QZ1",
  "questionId": "question_12345",

  "presentation": {
    "showQuestionLabel": true,
    "showFeedback": true,
    "showExplanation": true,
    "allowRetry": true
  }
}
```

These should remain **presentation preferences**, not assessment rules.

---

# 70. QZ1 Final Architecture

```text
                    TUTORIAL
                       │
                       ▼
                 ┌──────────┐
                 │   QZ1    │
                 │ Single   │
                 │ Question │
                 └────┬─────┘
                      │
                 questionId
                      │
                      ▼
             ┌─────────────────┐
             │   ASSESSMENT    │
             │     ENGINE      │
             ├─────────────────┤
             │ Question        │
             │ Attempt         │
             │ Response        │
             │ Evaluation      │
             │ Scoring         │
             │ Result          │
             │ Mastery         │
             └────────┬────────┘
                      │
                      ▼
                 QZ1 Result
                      │
                      ▼
              Tutorial Progress
```

---

# 71. QZ1 Technical Specification

| Area                        | QZ1 Decision                            |
| --------------------------- | --------------------------------------- |
| **Block**                   | **QuizBlock**                           |
| **Version**                 | **QZ1**                                 |
| **Presentation**            | **Single Question**                     |
| **Question count**          | **One**                                 |
| **Primary purpose**         | Lightweight assessment checkpoint       |
| **Question ownership**      | **Existing Assessment Engine**          |
| **Evaluation ownership**    | **Existing Assessment Engine**          |
| **Scoring ownership**       | **Existing Assessment Engine**          |
| **Attempt ownership**       | **Existing Assessment Engine**          |
| **Mastery ownership**       | **Existing Assessment Engine**          |
| **Question ID**             | Required                                |
| **Question duplication**    | ❌                                       |
| **Local assessment engine** | ❌                                       |
| **Local scoring**           | ❌                                       |
| **Local question database** | ❌                                       |
| **Response UI**             | Tutorial Engine                         |
| **Result UI**               | Tutorial Engine                         |
| **Tutorial completion**     | Tutorial Engine                         |
| **Assessment result**       | Assessment Engine                       |
| **Retry policy**            | Assessment Engine                       |
| **Feedback**                | Assessment metadata → QZ1               |
| **Authentication**          | Existing platform auth                  |
| **Authorization**           | Existing assessment rules               |
| **Persistence**             | Existing assessment + tutorial progress |
| **Analytics**               | Assessment + tutorial analytics         |
| **Responsive**              | ✅                                       |
| **Accessible**              | ✅                                       |
| **Light theme**             | ✅                                       |
| **Primary**                 | **#F54A8D**                             |
| **Secondary**               | **#0B1B3D**                             |
| **Gradient**                | ❌                                       |
| **Dark theme**              | ❌                                       |
| **JSON-driven**             | ✅                                       |

---

# 72. QuizBlock Progress

We have now started Block 16:

```text
QZ1 — Single Question
        ↓
QZ2 — Multiple Choice
        ↓
QZ3 — Multiple Select
        ↓
QZ4 — True / False
        ↓
QZ5 — Code Output Quiz
        ↓
QZ6 — Scenario Quiz
        ↓
QZ7 — Adaptive Quiz
        ↓
QZ8 — Complete Topic Quiz
```

## **QZ1 — Single Question: COMPLETE** ✅

The key architectural principle for the entire QuizBlock family is now established:

```text
                    QUIZBLOCK
                       │
             Presentation Layer
                       │
                       ▼
              EXISTING ASSESSMENT
                    ENGINE
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Question       Evaluation      Results
     Attempts        Scoring        Mastery
```

**QuizBlock presents assessment experiences; it does not become a second assessment system.**

The next version is **QZ2 — Multiple Choice**.



```python

```

# BLOCK 16 — QuizBlock

## QZ2 — Multiple Choice

Yes. We continue with **only QZ2**, exactly one version at a time.

The committed QuizBlock sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| QZ1     | Single Question     | ✅ Complete     |
| **QZ2** | **Multiple Choice** | 🔵 **CURRENT** |
| QZ3     | Multiple Select     | ⏳              |
| QZ4     | True / False        | ⏳              |
| QZ5     | Code Output Quiz    | ⏳              |
| QZ6     | Scenario Quiz       | ⏳              |
| QZ7     | Adaptive Quiz       | ⏳              |
| QZ8     | Complete Topic Quiz | ⏳              |

And the architectural rule from QZ1 remains locked:

> **QuizBlock is a presentation layer over the existing Exam/Assessment Engine. It does not create a second assessment engine.**

---

# 1. What Is QZ2 — Multiple Choice?

**QZ2 — Multiple Choice** presents **one assessment question with multiple available options where the learner selects exactly one answer**.

The fundamental interaction is:

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

> **One question → multiple options → exactly one selected answer.**

---

# 2. QZ1 → QZ2

The distinction between the first two versions must remain very clear.

### QZ1 — Single Question

QZ1 establishes:

```text
ONE QUESTION
     ↓
ONE RESPONSE
```

The emphasis is on the **single-question assessment checkpoint**.

### QZ2 — Multiple Choice

QZ2 establishes:

```text
ONE QUESTION
     ↓
MULTIPLE OPTIONS
     ↓
ONE SELECTED OPTION
```

Therefore:

> **QZ1 describes the assessment unit.**

> **QZ2 defines the multiple-choice presentation of that assessment unit.**

---

# 3. QZ2 Basic Example

Suppose the tutorial is teaching Python lists.

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ What is the last valid index of a list       │
│ containing three elements?                   │
│                                              │
│ ○ 1                                          │
│                                              │
│ ○ 2                                          │
│                                              │
│ ○ 3                                          │
│                                              │
│ ○ 4                                          │
│                                              │
│                  [ Submit Answer ]           │
└──────────────────────────────────────────────┘
```

The learner can select:

```text
○ 2
```

but cannot select:

```text
○ 2
○ 3
```

because QZ2 permits **one choice**.

---

# 4. QZ2 Core Interaction

The learner journey is:

```text
┌───────────────┐
│ Read Question │
└───────┬───────┘
        ↓
┌────────────────┐
│ Review Options │
└───────┬────────┘
        ↓
┌────────────────┐
│ Select ONE     │
└───────┬────────┘
        ↓
┌────────────────┐
│ Submit         │
└───────┬────────┘
        ↓
┌────────────────────┐
│ Assessment Engine  │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Evaluation Result  │
└────────────────────┘
```

---

# 5. QZ2 Is Not QZ3

This distinction is essential.

### QZ2

Exactly **one** answer:

```text
○ A
○ B
○ C
○ D
```

### QZ3

Potentially **multiple** answers:

```text
☐ A
☐ B
☐ C
☐ D
```

Therefore:

```text
QZ2 → Single Selection
QZ3 → Multiple Selection
```

---

# 6. QZ2 Is Not True / False

True / False is deliberately separated into:

> **QZ4 — True / False**

Even though a True / False question technically has two choices, QZ4 exists because it is a distinct presentation pattern.

So:

```text
QZ2
→ Multiple Choice

QZ4
→ Explicit True / False
```

We should not collapse them into one version.

---

# 7. QZ2 Is Not QuestionBlock

QuestionBlock is learning-oriented.

QZ2 is assessment-oriented.

### QuestionBlock

```text
Question
 ↓
Think
 ↓
Respond
 ↓
Reason
```

### QZ2

```text
Question
 ↓
Select answer
 ↓
Submit
 ↓
Evaluate
```

The assessment engine is involved in QZ2.

---

# 8. QZ2 Is Not ExerciseBlock

ExerciseBlock asks the learner to practice a skill.

QZ2 asks the learner to select an assessed answer.

```text
ExerciseBlock
→ Practice a skill

QZ2
→ Demonstrate knowledge
```

---

# 9. QZ2 Is Not Quiz Engine

Again:

```text
Tutorial Engine
      │
      ▼
QuizBlock QZ2
      │
      ▼
Existing Assessment Engine
```

Not:

```text
Tutorial Engine
      │
      ▼
QuizBlock
      │
      ▼
New Quiz Engine
```

---

# 10. QZ2 Architecture

```text
┌───────────────────────────────┐
│ Tutorial Engine               │
│                               │
│ QZ2 UI                        │
│ Question presentation         │
│ Option selection              │
│ Submit interaction            │
└───────────────┬───────────────┘
                │
                │ assessment request
                ▼
┌───────────────────────────────┐
│ Existing Assessment Engine    │
│                               │
│ Question                      │
│ Options                       │
│ Correct answer                │
│ Evaluation                   │
│ Attempts                      │
│ Scoring                       │
│ Results                       │
│ Mastery                       │
│ Analytics                     │
└───────────────────────────────┘
```

---

# 11. QZ2 Question Reference

The Tutorial Engine should reference an existing assessment question.

Example:

```json
{
  "type": "quiz",
  "version": "QZ2",
  "questionId": "question_12345"
}
```

The assessment engine owns:

```text
questionId
question text
options
correct option
explanation
difficulty
skill
topic
scoring
```

QZ2 owns the **presentation**.

---

# 12. Why Options Should Remain Assessment-Owned

Avoid duplicating:

```json
{
  "questionId": "question_12345",
  "options": [
    "A",
    "B",
    "C",
    "D"
  ],
  "correctAnswer": "B"
}
```

inside Tutorial Content if these already exist in the assessment system.

Instead:

```json
{
  "type": "quiz",
  "version": "QZ2",
  "questionId": "question_12345"
}
```

The Tutorial Engine retrieves the question definition through the appropriate assessment contract.

---

# 13. Single Source of Truth

The architecture becomes:

```text
                  Assessment Question
                         │
              ┌──────────┼───────────┐
              ▼          ▼           ▼
            QZ2        Exam       Practice
              │
              ▼
       Multiple Choice UI
```

The same assessment question can be reused.

This prevents question drift.

---

# 14. QZ2 Basic UI

A clean presentation:

```text
┌────────────────────────────────────────────────┐
│ QUICK CHECK                                    │
│                                                │
│ What does `len([10, 20, 30])` return?          │
│                                                │
│  ◯ 2                                           │
│                                                │
│  ◯ 3                                           │
│                                                │
│  ◯ 4                                           │
│                                                │
│  ◯ Error                                       │
│                                                │
│                    [ Submit Answer ]           │
└────────────────────────────────────────────────┘
```

The circular control communicates:

> **Choose one.**

---

# 15. QZ2 Selected State

Before submission:

```text
┌──────────────────────────────────────────────┐
│ What does `len([10, 20, 30])` return?        │
│                                              │
│ ◯ 2                                          │
│                                              │
│ ◉ 3                                          │
│                                              │
│ ◯ 4                                          │
│                                              │
│ ◯ Error                                      │
│                                              │
│              [ Submit Answer ]               │
└──────────────────────────────────────────────┘
```

Only one option can be selected.

Selecting another option automatically deselects the previous option.

---

# 16. QZ2 Option Interaction

Conceptually:

```text
Option A
   │
   ├── selected
   │
   ▼
Option B selected
   │
   ▼
Option A deselected
```

The learner never reaches:

```text
A = selected
B = selected
```

in QZ2.

That behavior belongs to QZ3.

---

# 17. QZ2 Submit Validation

If no option is selected:

```text
┌──────────────────────────────────────────────┐
│ Please select an answer before submitting.   │
└──────────────────────────────────────────────┘
```

The assessment request should not be sent until a valid response exists.

---

# 18. QZ2 Question State

The state model can be:

```text
LOADING
   ↓
READY
   ↓
ANSWERING
   ↓
OPTION_SELECTED
   ↓
SUBMITTING
   ↓
EVALUATING
   ↓
RESULT
```

This is similar to QZ1 but introduces the explicit:

> **OPTION_SELECTED**

state.

---

# 19. QZ2 State Machine

```text
┌─────────────┐
│   LOADING   │
└──────┬──────┘
       ↓
┌─────────────┐
│    READY    │
└──────┬──────┘
       ↓
┌─────────────┐
│  ANSWERING  │
└──────┬──────┘
       ↓
┌──────────────────┐
│ OPTION SELECTED  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│    SUBMITTING    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│    EVALUATING    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│      RESULT      │
└──────────────────┘
```

---

# 20. QZ2 Submission Payload

Conceptually:

```json
{
  "questionId": "question_12345",
  "response": {
    "selectedOption": "B"
  }
}
```

The exact request format should follow the existing assessment API.

The important semantic meaning is:

```text
questionId
+
one selected option
```

---

# 21. QZ2 Assessment Evaluation

The Assessment Engine receives:

```text
Question:
Q-12345

Selected:
B
```

It determines:

```text
Correct?
Score?
Feedback?
Attempt?
```

QZ2 does not independently compare:

```text
selectedOption === correctOption
```

if that evaluation belongs to the assessment system.

---

# 22. QZ2 Correct Result

```text
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ `len()` returns the number of elements in     │
│ the list.                                    │
│                                              │
│                    [ Continue → ]            │
└──────────────────────────────────────────────┘
```

---

# 23. QZ2 Incorrect Result

```text
┌──────────────────────────────────────────────┐
│ ✕ Incorrect                                  │
│                                              │
│ A three-element list has indexes 0, 1, and 2│
│ and `len()` returns 3.                       │
│                                              │
│                    [ Continue → ]            │
└──────────────────────────────────────────────┘
```

The feedback content should be sourced from the assessment system where possible.

---

# 24. QZ2 Correct Answer Highlighting

After evaluation, the UI may show:

```text
○ 2

◉ 3   ✓ Correct

○ 4

○ Error
```

Or, after an incorrect response:

```text
○ 2

◉ 4   ✕

○ 3   ✓ Correct

○ Error
```

Whether the correct answer is revealed depends on the assessment configuration.

QZ2 should respect that configuration.

---

# 25. QZ2 Feedback Policies

The assessment system can define whether to show:

```text
Immediate feedback
Delayed feedback
Correct answer
Explanation
Score
```

QZ2 simply presents the allowed result.

---

# 26. QZ2 Retry

If the assessment policy permits retry:

```text
Result
  ↓
[ Try Again ]
  ↓
New Attempt
```

The new attempt is created by the assessment architecture.

QZ2 should not maintain its own attempt counter.

---

# 27. QZ2 Tutorial Completion

As with QZ1, distinguish:

```text
Assessment Result
```

from:

```text
Tutorial Block Completion
```

For example:

```text
Learner answers incorrectly
        ↓
Assessment Engine:
Incorrect
        ↓
Tutorial Engine:
Block completed
```

if the tutorial's completion policy is:

> "Answer the question."

Or:

```text
Incorrect
        ↓
Block remains incomplete
```

if the author requires correctness.

---

# 28. QZ2 Completion Configuration

Presentation-level configuration can be:

```json
{
  "type": "quiz",
  "version": "QZ2",
  "questionId": "question_12345",

  "presentation": {
    "completionPolicy": "answered"
  }
}
```

Possible policies could be:

```text
answered
correct
assessment_defined
```

But the semantics should align with the existing assessment architecture.

---

# 29. QZ2 Example — Python References

Question:

> If `b = a`, where `a` is a list, what does `a is b` return?

```text
○ True

○ False

○ None

○ Error
```

Learner selects:

```text
True
```

Assessment Engine:

```text
Correct
```

QZ2:

```text
✓ Correct

Both variables refer to the same list object.
```

---

# 30. QZ2 Example — Exception Handling

Question:

> Which exception is raised by `int("hello")`?

```text
○ TypeError

○ ValueError

○ IndexError

○ KeyError
```

Correct:

```text
ValueError
```

The learner gets a focused assessment immediately after learning the concept.

---

# 31. QZ2 Example — OOP

Question:

> Which mechanism determines the method lookup order in Python multiple inheritance?

```text
○ Garbage collection

○ MRO

○ Reference counting

○ Serialization
```

Correct:

```text
MRO
```

Again, QZ2 is an assessment presentation.

---

# 32. QZ2 Example — Memory

Question:

> Which statement best describes a Python variable?

```text
○ A variable always contains a raw copy of the object

○ A variable refers to an object

○ A variable is always stored on the stack

○ A variable is the same thing as the object
```

Correct:

```text
A variable refers to an object
```

This works particularly well after an M2/M3 MemoryBlock explanation.

---

# 33. QZ2 Option Ordering

The assessment engine may define:

```text
Fixed order
Randomized order
```

QZ2 should respect the returned option ordering.

If randomization is performed by the assessment engine:

```text
Assessment Engine
       ↓
Option order
       ↓
QZ2
```

QZ2 should not independently randomize options.

This avoids inconsistencies between assessment records and presentation.

---

# 34. Option Identity

Options should have stable identifiers.

For example:

```json
{
  "id": "opt_b",
  "label": "ValueError"
}
```

rather than relying only on:

```text
B
```

Why?

Because option ordering can change.

Stable IDs allow:

```text
opt_b
```

to remain the same answer even if the UI displays it in a different position.

---

# 35. QZ2 Assessment Data

Conceptually:

```json
{
  "questionId": "Q-1001",

  "options": [
    {
      "id": "opt_1",
      "text": "TypeError"
    },
    {
      "id": "opt_2",
      "text": "ValueError"
    },
    {
      "id": "opt_3",
      "text": "IndexError"
    },
    {
      "id": "opt_4",
      "text": "KeyError"
    }
  ]
}
```

The correct option remains assessment-owned.

---

# 36. QZ2 UI Should Not Expose Correct Answer

Before submission:

```text
Option data
```

should not expose to the client:

```text
isCorrect: true
```

if the existing assessment architecture expects server-side evaluation.

Instead:

```text
QZ2
 ↓
User response
 ↓
Server
 ↓
Assessment evaluation
```

This is especially important for assessed content.

---

# 37. QZ2 Security Boundary

```text
Browser
│
├── Question
├── Options
└── Learner Selection
       │
       ▼
Assessment API
       │
       ├── Correct Answer
       ├── Evaluation
       └── Score
```

The correct answer should not unnecessarily be exposed in client-side data.

---

# 38. QZ2 Authentication

QZ2 uses the existing platform authentication/session architecture.

There should not be:

```text
quizToken
quizSession
quizAuth
```

created solely for QuizBlock.

Instead:

```text
Existing authenticated session
        ↓
Assessment API
```

---

# 39. QZ2 Authorization

Access should respect existing rules around:

```text
learner
course
tutorial
assessment
subscription
role
```

The Tutorial Engine does not bypass assessment authorization simply because the question is being displayed inside a tutorial.

---

# 40. QZ2 Analytics

Tutorial-level events:

```text
quiz_qz2_viewed
quiz_qz2_option_selected
quiz_qz2_submitted
quiz_qz2_completed
```

Assessment-level events:

```text
question_attempted
option_selected
answer_correct
answer_incorrect
score_recorded
```

The exact event names should follow your existing analytics conventions.

---

# 41. QZ2 Analytics Flow

```text
                    QZ2
                     │
            ┌────────┴─────────┐
            ▼                  ▼
      Tutorial Events    Assessment Events
            │                  │
            ▼                  ▼
       Engagement          Attempts
       Progress            Correctness
                           Score
                           Mastery
```

No duplicate scoring analytics should be created in Tutorial Engine.

---

# 42. QZ2 Accessibility

Because options are mutually exclusive, the semantic control should behave like a **radio group**.

Conceptually:

```text
Question
  ↓
Radio Group
  ├── Option A
  ├── Option B
  ├── Option C
  └── Option D
  ↓
Submit
```

Keyboard users should be able to:

```text
Tab
Arrow keys
Space
Enter
```

according to the implementation's accessible radio-group behavior.

---

# 43. QZ2 Screen Reader Structure

A semantic structure should communicate:

```text
Question:
What does len([1,2,3]) return?

Options:
2
3
4
Error
```

Then:

```text
Submit Answer
```

And after submission:

```text
Correct
```

or:

```text
Incorrect
```

The result should be announced appropriately.

---

# 44. QZ2 Responsive Design

Desktop:

```text
┌───────────────────────────────────────┐
│ Question                              │
│                                       │
│ ◯ Option A                            │
│ ◉ Option B                            │
│ ◯ Option C                            │
│ ◯ Option D                            │
│                                       │
│             [ Submit ]                │
└───────────────────────────────────────┘
```

Mobile:

```text
┌───────────────────────┐
│ Question              │
│                       │
│ ◯ Option A            │
│                       │
│ ◉ Option B            │
│                       │
│ ◯ Option C            │
│                       │
│ ◯ Option D            │
│                       │
│ [ Submit ]            │
└───────────────────────┘
```

---

# 45. QZ2 Visual Design

Use the established light Tutorial Engine design system:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Recommended:

* white card
* dark-blue text
* pink selected/primary action
* subtle option borders
* clear hover/focus state
* soft shadows
* no gradient
* no dark theme

The selected option should be immediately recognizable.

---

# 46. QZ2 Option States

Each option should have clear states:

```text
Default
Hover
Focus
Selected
Disabled
Correct
Incorrect
```

Example:

```text
○ Default

◉ Selected

✓ Correct

✕ Incorrect
```

These states should remain visually and semantically distinguishable.

---

# 47. QZ2 Disabled State

While submitting:

```text
◉ ValueError

[ Submitting... ]
```

Options should temporarily become disabled to prevent accidental changes while evaluation is occurring.

---

# 48. QZ2 Result State

After evaluation:

```text
Question
   ↓
Options locked
   ↓
Correct / Incorrect
   ↓
Explanation
   ↓
Continue
```

The learner should clearly understand that the attempt has been recorded.

---

# 49. QZ2 Loading State

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ Loading question...                          │
│                                              │
│ ○ ─────────────────                         │
│ ○ ─────────────────                         │
│ ○ ─────────────────                         │
└──────────────────────────────────────────────┘
```

A skeleton or equivalent can be used.

---

# 50. QZ2 Error State

If the question cannot be retrieved:

```text
┌──────────────────────────────────────────────┐
│ We couldn't load this question.              │
│                                              │
│ Please try again.                            │
│                                              │
│ [ Retry ]                                    │
└──────────────────────────────────────────────┘
```

No fabricated question should appear.

---

# 51. QZ2 Submission Error

If the assessment API fails:

```text
┌──────────────────────────────────────────────┐
│ Your answer could not be submitted.          │
│                                              │
│ Please try again.                            │
│                                              │
│ [ Retry Submission ]                         │
└──────────────────────────────────────────────┘
```

The learner's selected option can remain in the UI so they do not have to select it again.

---

# 52. QZ2 Double Submission Protection

The flow:

```text
Select
 ↓
Submit
 ↓
Submitting
 ↓
Button disabled
 ↓
Result
```

prevents:

```text
Submit
Submit
Submit
```

from creating multiple accidental attempts.

---

# 53. QZ2 Retry Architecture

If retry is permitted:

```text
Attempt 1
   ↓
Incorrect
   ↓
Try Again
   ↓
Attempt 2
```

The Assessment Engine should create/track the new attempt.

QZ2 merely starts the next interaction.

---

# 54. QZ2 Tutorial Progress and Retry

Suppose:

```text
Attempt 1 → Incorrect
Attempt 2 → Correct
```

Tutorial progress can ultimately record:

```text
Block completed
```

while assessment analytics retain:

```text
Attempt 1: Incorrect
Attempt 2: Correct
```

This is a good example of why the two systems must remain separate.

---

# 55. QZ2 Question Explanation

After submission:

```text
✓ Correct

Why?

`int("hello")` raises `ValueError`
because the string cannot be converted
to an integer.
```

The explanation should ideally be authored once in the assessment question.

---

# 56. QZ2 Question Reuse

A question can appear:

```text
Python Exception Tutorial
       ↓
QZ2
       ↓
Question Q-1024
```

and later:

```text
Exception Practice Assessment
       ↓
Question Q-1024
```

Both use the same authoritative question definition.

---

# 57. QZ2 Composer

The Tutorial Composer can provide:

```text
┌──────────────────────────────────────────────┐
│ QuizBlock                                    │
│                                              │
│ Version                                      │
│ [ QZ2 — Multiple Choice ▼ ]                 │
│                                              │
│ Assessment Question                          │
│ [ Search assessment questions... ]           │
│                                              │
│ Selected Question                            │
│ Q-1024                                       │
│                                              │
│ Preview                                      │
│ ──────────────────────────────────────────── │
│ Which exception does int("hello") raise?     │
│                                              │
│ ○ TypeError                                  │
│ ○ ValueError                                 │
│ ○ IndexError                                 │
│ ○ KeyError                                   │
└──────────────────────────────────────────────┘
```

The preview is presentation-oriented.

The source of truth remains the assessment system.

---

# 58. QZ2 Composer Does Not Edit Correct Answer

The Tutorial Composer should not provide:

```text
Correct Answer:
[ ValueError ▼ ]
```

if the assessment system already owns that field.

Instead:

```text
Question:
Q-1024
```

and the assessment authoring system owns the question definition.

This prevents accidental inconsistency.

---

# 59. QZ2 JSON — Minimal

```json
{
  "type": "quiz",
  "version": "QZ2",
  "questionId": "question_12345"
}
```

That is the preferred minimal representation.

---

# 60. QZ2 JSON — Presentation Configuration

```json
{
  "type": "quiz",
  "version": "QZ2",
  "questionId": "question_12345",

  "presentation": {
    "showFeedback": true,
    "showExplanation": true,
    "allowRetry": true
  }
}
```

Again, these are presentation preferences.

They should not replace assessment rules.

---

# 61. QZ2 Validation

The block itself only needs to validate the interaction state:

```text
Has option been selected?
```

The assessment engine validates:

```text
Is the answer correct?
What is the score?
What attempt is this?
```

This distinction is extremely important.

---

# 62. QZ2 Local Validation

Allowed:

```text
if noOptionSelected:
    show "Select an answer"
```

Not appropriate:

```text
if selectedOption === correctOption:
    score = 1
```

when evaluation is owned by the assessment engine.

---

# 63. QZ2 End-to-End Architecture

```text
                    TUTORIAL
                       │
                       ▼
              ┌─────────────────┐
              │ QuizBlock QZ2   │
              │                 │
              │ Multiple Choice │
              └────────┬────────┘
                       │
                  questionId
                       │
                       ▼
             ┌───────────────────┐
             │ Assessment Engine │
             └─────────┬─────────┘
                       │
               Question + Options
                       │
                       ▼
                    QZ2 UI
                       │
                  Learner selects
                       │
                       ▼
                 Submit Response
                       │
                       ▼
             ┌───────────────────┐
             │ Assessment Engine │
             │                   │
             │ Evaluate          │
             │ Record Attempt     │
             │ Score             │
             │ Result            │
             └─────────┬─────────┘
                       │
                       ▼
                    QZ2 UI
                       │
                       ▼
                  Feedback
                       │
                       ▼
              Tutorial Progress
```

---

# 64. QZ2 Example — Complete Flow

Tutorial content:

> Python's `is` operator checks object identity rather than value equality.

Then QZ2:

```text
What does this print?

a = [1, 2]
b = a

print(a is b)
```

Options:

```text
○ True

○ False

○ None

○ Error
```

Learner:

```text
True
```

Assessment:

```text
Correct
Score: 1
```

QZ2:

```text
✓ Correct

`a` and `b` reference the same object.
```

Tutorial:

```text
Block completed
```

---

# 65. QZ2 Code Question vs QZ5

An important boundary:

QZ2 can **contain code in the question**, for example:

```python
x = 10
print(x)
```

and ask a conceptual multiple-choice question.

But:

> **QZ5 — Code Output Quiz**

is specifically dedicated to output prediction.

Therefore:

### QZ2

```text
Multiple-choice assessment
```

### QZ5

```text
Predict code output
```

The content may overlap, but the presentation purpose is different.

---

# 66. QZ2 Scenario Question vs QZ6

QZ2 can mention a scenario:

> Which exception should be handled here?

But QZ6 specifically establishes:

> **Scenario Quiz**

where scenario-driven decision making becomes the primary presentation.

Therefore QZ2 should remain focused on:

```text
Question
+
Multiple options
+
One selection
```

---

# 67. QZ2 Adaptive Behavior vs QZ7

QZ2 is:

```text
Fixed question
```

QZ7 is:

```text
Adaptive question selection
```

QZ2 should not independently decide:

```text
"What question should come next?"
```

That belongs to the assessment architecture and eventually QZ7.

---

# 68. QZ2 and Existing Exam Architecture

The relationship should remain:

```text
                         ASSESSMENT ENGINE
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
      Exam Engine         Practice Engine       Tutorial
                                                    │
                                                    ▼
                                                QuizBlock
                                                    │
                                  ┌─────────────────┼──────────────┐
                                  ▼                 ▼              ▼
                                 QZ1               QZ2            QZ3
```

QuizBlock becomes another **consumer/presentation channel** for the assessment system.

It does not replace it.

---

# 69. QZ2 Why This Architecture Is Better

It gives you:

```text
One question bank
One evaluation system
One scoring system
One attempt system
One mastery system
One analytics system
Multiple presentation experiences
```

That means:

```text
QZ1
QZ2
QZ3
QZ4
QZ5
QZ6
QZ7
QZ8
```

can all reuse the same underlying assessment infrastructure.

---

# 70. QZ2 Final Technical Specification

| Area                         | QZ2 Decision                                    |
| ---------------------------- | ----------------------------------------------- |
| **Block**                    | **QuizBlock**                                   |
| **Version**                  | **QZ2**                                         |
| **Presentation**             | **Multiple Choice**                             |
| **Question count**           | One assessment question                         |
| **Option count**             | Multiple                                        |
| **Selection**                | **Exactly one**                                 |
| **Question ownership**       | Existing Assessment Engine                      |
| **Option ownership**         | Existing Assessment Engine                      |
| **Correct answer ownership** | Existing Assessment Engine                      |
| **Evaluation**               | Existing Assessment Engine                      |
| **Scoring**                  | Existing Assessment Engine                      |
| **Attempts**                 | Existing Assessment Engine                      |
| **Mastery**                  | Existing Assessment Engine                      |
| **Analytics**                | Existing Assessment Engine + Tutorial Analytics |
| **UI ownership**             | Tutorial Engine                                 |
| **Response state**           | One selected option                             |
| **Submission**               | Assessment API                                  |
| **Retry**                    | Assessment policy                               |
| **Question duplication**     | ❌                                               |
| **Local scoring**            | ❌                                               |
| **Local assessment engine**  | ❌                                               |
| **Local question bank**      | ❌                                               |
| **Correct answer in client** | ❌ Prefer server-side evaluation                 |
| **Accessibility**            | Radio-group semantics                           |
| **Keyboard navigation**      | ✅                                               |
| **Responsive**               | ✅                                               |
| **Light theme**              | ✅                                               |
| **Primary**                  | **#F54A8D**                                     |
| **Secondary**                | **#0B1B3D**                                     |
| **Gradient**                 | ❌                                               |
| **Dark theme**               | ❌                                               |
| **JSON-driven**              | ✅                                               |

---

# 71. QuizBlock Progress

We have now completed:

```text
QZ1 — Single Question
        ↓
QZ2 — Multiple Choice
        ↓
QZ3 — Multiple Select
        ↓
QZ4 — True / False
        ↓
QZ5 — Code Output Quiz
        ↓
QZ6 — Scenario Quiz
        ↓
QZ7 — Adaptive Quiz
        ↓
QZ8 — Complete Topic Quiz
```

## **QZ2 — Multiple Choice: COMPLETE** ✅

The key distinction is now locked:

```text
QZ2
────
ONE QUESTION
MULTIPLE OPTIONS
ONE SELECTION
ASSESSMENT ENGINE EVALUATES
```

And the next committed version is:

> **QZ3 — Multiple Select**



```python

```

# BLOCK 16 — QuizBlock

## QZ3 — Multiple Select

Yes. We continue with **only QZ3**, one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| QZ1     | Single Question     | ✅ Complete     |
| QZ2     | Multiple Choice     | ✅ Complete     |
| **QZ3** | **Multiple Select** | 🔵 **CURRENT** |
| QZ4     | True / False        | ⏳              |
| QZ5     | Code Output Quiz    | ⏳              |
| QZ6     | Scenario Quiz       | ⏳              |
| QZ7     | Adaptive Quiz       | ⏳              |
| QZ8     | Complete Topic Quiz | ⏳              |

And the architectural rule remains locked:

> **QZ3 is only a presentation mode. Question definition, answer evaluation, scoring, attempts, mastery, and assessment analytics remain owned by the existing Assessment Engine.**

---

# 1. What Is QZ3 — Multiple Select?

**QZ3 — Multiple Select** presents one assessment question where **more than one option may be correct**, and the learner can select multiple options before submitting.

The fundamental interaction is:

```text
QUESTION
   ↓
MULTIPLE OPTIONS
   ↓
SELECT ONE OR MORE
   ↓
SUBMIT
   ↓
ASSESSMENT ENGINE
   ↓
EVALUATE SELECTION SET
   ↓
RESULT
```

The defining rule is:

> **One question → multiple options → multiple selections allowed.**

---

# 2. QZ2 → QZ3

This distinction must remain very explicit.

### QZ2 — Multiple Choice

```text
ONE QUESTION
      ↓
A / B / C / D
      ↓
SELECT EXACTLY ONE
```

### QZ3 — Multiple Select

```text
ONE QUESTION
      ↓
A / B / C / D
      ↓
SELECT MULTIPLE
```

Therefore:

```text
QZ2 → Single selection
QZ3 → Multiple selection
```

---

# 3. Why QZ3 Is Necessary

Some concepts cannot be accurately assessed using one correct option.

For example:

> Which of the following are mutable Python objects?

Possible answers:

```text
☐ list
☐ tuple
☐ set
☐ dictionary
```

Correct:

```text
list
set
dictionary
```

A single-choice question cannot naturally represent this assessment.

QZ3 can.

---

# 4. QZ3 Basic Example

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ Which of the following are mutable objects   │
│ in Python?                                   │
│                                              │
│ ☐ list                                       │
│                                              │
│ ☐ tuple                                      │
│                                              │
│ ☐ set                                        │
│                                              │
│ ☐ dictionary                                 │
│                                              │
│                    [ Submit Answer ]         │
└──────────────────────────────────────────────┘
```

The learner may select:

```text
☑ list
☐ tuple
☑ set
☑ dictionary
```

That entire **set of selections** becomes the response.

---

# 5. QZ3 Is Not QZ2

The UI control is different.

### QZ2

Use radio-style semantics:

```text
○ A
○ B
○ C
○ D
```

Only one can be active.

### QZ3

Use checkbox-style semantics:

```text
☐ A
☐ B
☐ C
☐ D
```

Multiple can be active.

This is not merely a visual distinction. It is a different response model.

---

# 6. QZ3 Is Not QZ4

QZ4 is:

> **True / False**

Even though technically two possible responses exist, QZ4 is a dedicated presentation pattern.

QZ3 is specifically:

> **Multiple selectable alternatives where more than one may be correct.**

---

# 7. QZ3 Is Not QuestionBlock

QuestionBlock:

```text
Ask
 ↓
Think
 ↓
Explain
```

QZ3:

```text
Assess
 ↓
Select multiple
 ↓
Submit
 ↓
Evaluate
```

The assessment engine is the authority for correctness.

---

# 8. QZ3 Is Not ExerciseBlock

ExerciseBlock:

> Practice a specific skill.

QZ3:

> Demonstrate knowledge through a multi-answer assessment question.

---

# 9. QZ3 Is Not a New Assessment Engine

The architecture remains:

```text
┌───────────────────────────────┐
│ Tutorial Engine               │
│                               │
│ QZ3 Multiple Select UI        │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Existing Assessment Engine    │
│                               │
│ Question                      │
│ Options                       │
│ Correct selection set         │
│ Evaluation                    │
│ Scoring                       │
│ Attempts                      │
│ Results                       │
│ Mastery                       │
│ Analytics                     │
└───────────────────────────────┘
```

---

# 10. QZ3 Response Model

QZ2 submits:

```text
one selected option
```

QZ3 submits:

```text
a collection of selected options
```

Conceptually:

### QZ2

```json
{
  "selectedOption": "opt_2"
}
```

### QZ3

```json
{
  "selectedOptions": [
    "opt_1",
    "opt_3",
    "opt_4"
  ]
}
```

The exact API contract must follow your existing Assessment Engine.

---

# 11. Selection Set Is the Answer

This is the most important technical concept in QZ3.

The answer is not:

```text
option A
```

It is:

```text
{A, C, D}
```

Conceptually:

```text
Learner Selection
      ↓
{opt_1, opt_3, opt_4}
```

The Assessment Engine compares the submitted selection set against its authoritative answer definition.

---

# 12. Exact Set Matching

Suppose the correct answer is:

```text
{A, C, D}
```

### Learner selects

```text
{A, C, D}
```

Result:

```text
✓ Correct
```

### Learner selects

```text
{A, C}
```

Result:

```text
✕ Incorrect / Partially Correct
```

depending on the assessment scoring policy.

### Learner selects

```text
{A, B, C, D}
```

Result:

```text
✕ Incorrect / Partially Correct
```

again according to assessment policy.

---

# 13. QZ3 Scoring Must Remain Assessment-Owned

QZ3 must not decide:

```text
3 correct selections = 3 points
```

or:

```text
2 / 3 = 66%
```

unless the existing assessment engine defines that scoring model.

Possible assessment policies include:

```text
exact_match
partial_credit
all_or_nothing
negative_marking
weighted_options
```

QZ3 simply submits the selection set.

---

# 14. Exact Match

Example:

Correct:

```text
{A, C, D}
```

Learner:

```text
{A, C, D}
```

Result:

```text
1 / 1
```

But:

```text
{A, C}
```

could receive:

```text
0 / 1
```

under exact-match scoring.

---

# 15. Partial Credit

The assessment engine may support:

```text
Correct selections:
A, C, D

Learner:
A, C
```

and return:

```text
2 / 3
```

QZ3 simply displays:

```text
Partially correct
Score: 2 / 3
```

if that is what the assessment engine returns.

---

# 16. Negative Selection

Some assessments may penalize incorrect selections.

Example:

```text
Correct:
A, C

Learner:
A, B, C
```

The assessment engine may calculate:

```text
Score:
0.5
```

or:

```text
0
```

depending on the configured policy.

Again:

> **QZ3 does not implement the scoring formula.**

---

# 17. QZ3 Example — Python Data Structures

Question:

> Which of the following Python data structures are mutable?

```text
☐ list
☐ tuple
☐ set
☐ dictionary
```

Correct:

```text
list
set
dictionary
```

Learner:

```text
☑ list
☐ tuple
☑ set
☑ dictionary
```

Submit:

```text
Assessment Engine
        ↓
Selection set
        ↓
Evaluate
```

---

# 18. QZ3 Example — Exception Handling

Question:

> Which of the following are built-in Python exceptions?

```text
☐ ValueError
☐ TypeError
☐ Exception
☐ InvalidPythonError
```

Correct:

```text
ValueError
TypeError
Exception
```

The learner can select all three.

---

# 19. QZ3 Example — OOP

Question:

> Which statements about Python inheritance are true?

```text
☐ A class can inherit from multiple classes.
☐ Python uses MRO for method lookup.
☐ A subclass cannot override a parent method.
☐ `super()` can be used to access parent-class behavior.
```

Correct:

```text
A
B
D
```

This is an excellent QZ3 question because several statements are independently correct.

---

# 20. QZ3 Example — Memory

Question:

> Which statements about Python variables and objects are correct?

```text
☐ Variables can refer to objects.
☐ Two variables can refer to the same object.
☐ Assignment always creates a new object.
☐ `is` checks object identity.
```

Correct:

```text
A
B
D
```

This fits naturally into the Memory learning sequence.

---

# 21. QZ3 Example — Exception Propagation

Question:

> Which statements about exception propagation are true?

```text
☐ An exception can propagate through function calls.
☐ A matching `except` block can stop propagation.
☐ Every exception must be handled where it is raised.
☐ An unhandled exception can reach the caller.
```

Correct:

```text
A
B
D
```

This is much more expressive than a single-choice question.

---

# 22. QZ3 UI — Initial State

```text
┌──────────────────────────────────────────────┐
│ QUICK CHECK                                  │
│                                              │
│ Which are mutable Python objects?            │
│                                              │
│ ☐ list                                       │
│                                              │
│ ☐ tuple                                      │
│                                              │
│ ☐ set                                        │
│                                              │
│ ☐ dictionary                                 │
│                                              │
│                  [ Submit Answer ]           │
└──────────────────────────────────────────────┘
```

---

# 23. QZ3 UI — Selection State

```text
┌──────────────────────────────────────────────┐
│ Which are mutable Python objects?            │
│                                              │
│ ☑ list                                       │
│                                              │
│ ☐ tuple                                      │
│                                              │
│ ☑ set                                        │
│                                              │
│ ☑ dictionary                                 │
│                                              │
│                  [ Submit Answer ]           │
└──────────────────────────────────────────────┘
```

Multiple selections remain active simultaneously.

---

# 24. QZ3 UI — Submission

After clicking:

```text
[ Submitting... ]
```

All selection controls become temporarily disabled.

Then:

```text
Assessment Engine
       ↓
Evaluation
       ↓
Result
```

---

# 25. QZ3 Correct Result

```text
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ You selected all three mutable data          │
│ structures.                                  │
│                                              │
│ Score: 1 / 1                                 │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

---

# 26. QZ3 Partially Correct Result

If partial credit is supported:

```text
┌──────────────────────────────────────────────┐
│ ◐ Partially Correct                          │
│                                              │
│ You identified two of the three correct      │
│ options.                                     │
│                                              │
│ Score: 2 / 3                                 │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

The actual score and wording come from the assessment system.

---

# 27. QZ3 Incorrect Result

```text
┌──────────────────────────────────────────────┐
│ ✕ Incorrect                                  │
│                                              │
│ Your selection does not match the expected   │
│ answer.                                      │
│                                              │
│ Explanation                                 │
│ A list, set, and dictionary are mutable.     │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

Whether the correct options are explicitly revealed is controlled by assessment policy.

---

# 28. QZ3 Option States

Each checkbox should support:

```text
Default
Hover
Focus
Selected
Disabled
Correct
Incorrect
```

For example:

```text
☐ Default
☑ Selected
✓ Correct
✕ Incorrect
```

---

# 29. QZ3 Accessibility

Because multiple answers are allowed, the semantic interaction should use a **checkbox group**.

Conceptually:

```text
Question
  ↓
Checkbox Group
  ├── Option A
  ├── Option B
  ├── Option C
  └── Option D
  ↓
Submit
```

Keyboard users should be able to navigate and toggle each option.

---

# 30. QZ3 Screen Reader Experience

The learner should hear something equivalent to:

```text
Question:
Which are mutable Python objects?

Checkbox:
List, not checked

Checkbox:
Tuple, not checked

Checkbox:
Set, not checked

Checkbox:
Dictionary, not checked
```

After selection:

```text
List, checked
```

This provides clear semantic feedback.

---

# 31. QZ3 No Selection

If the assessment requires at least one selection:

```text
Please select at least one answer.
```

This is local interaction validation.

It is not correctness evaluation.

---

# 32. QZ3 Minimum / Maximum Selections

Some assessment questions may specify:

```text
minimumSelections = 2
maximumSelections = 3
```

For example:

> Select the two correct statements.

The UI can prevent or report invalid selection counts.

But these rules should originate from the assessment question definition.

---

# 33. QZ3 Selection Constraint

For example:

```json
{
  "selectionPolicy": {
    "min": 1,
    "max": 3
  }
}
```

The Assessment Engine can return this metadata to QZ3.

QZ3 uses it for interaction behavior.

---

# 34. QZ3 Exact Number of Selections

A question might say:

> Select exactly two correct answers.

The UI can display:

```text
Select 2 answers
```

and optionally:

```text
Selected: 1 / 2
```

or:

```text
Selected: 2 / 2
```

This is useful feedback without revealing correctness.

---

# 35. QZ3 Selection Counter

Example:

```text
Which statements are true?

Selected: 2 / 3
```

This means:

> The learner has selected two options.

It does **not** mean:

> Two selected answers are correct.

The UI must not create that ambiguity.

---

# 36. QZ3 Assessment Metadata

Conceptually:

```json
{
  "questionId": "Q-2001",

  "responseType": "multiple_select",

  "selectionPolicy": {
    "min": 1,
    "max": 3
  }
}
```

This metadata belongs to the assessment question.

---

# 37. QZ3 Question Reference

Tutorial block:

```json
{
  "type": "quiz",
  "version": "QZ3",
  "questionId": "Q-2001"
}
```

The Tutorial Engine does not need:

```text
correctOptions
scoringRule
attemptRule
```

inside the block.

---

# 38. QZ3 Response

Conceptually:

```json
{
  "questionId": "Q-2001",
  "response": {
    "selectedOptions": [
      "opt_a",
      "opt_c",
      "opt_d"
    ]
  }
}
```

The actual API payload should follow your existing Assessment Engine contract.

---

# 39. QZ3 Correctness Evaluation

The Assessment Engine may conceptually evaluate:

```text
Expected:
{A, C, D}

Received:
{A, C, D}

→ Correct
```

Or:

```text
Expected:
{A, C, D}

Received:
{A, C}

→ Partial / Incorrect
```

The evaluation implementation remains outside QZ3.

---

# 40. QZ3 Ordering

For multiple-select questions, option ordering can be randomized.

For example:

Original:

```text
A
B
C
D
```

Displayed:

```text
C
A
D
B
```

The selected option identity must remain:

```text
opt_c
opt_a
opt_d
```

rather than relying on display position.

The assessment engine should own any randomization.

---

# 41. QZ3 Stable Option IDs

Recommended:

```json
{
  "id": "opt_001",
  "text": "list"
}
```

rather than using:

```text
index = 0
```

as the identity.

This protects against randomized presentation order.

---

# 42. QZ3 Client Security

Before submission, the browser can know:

```text
Question
Options
```

but should not receive:

```text
correctOptionIds
```

unless the assessment architecture intentionally permits client-side evaluation.

Preferred:

```text
QZ3
 ↓
selectedOptions
 ↓
Assessment API
 ↓
server-side evaluation
```

---

# 43. QZ3 Feedback

After evaluation:

```text
✓ Correct
```

or:

```text
◐ Partially Correct
```

or:

```text
✕ Incorrect
```

Then optionally:

```text
Explanation
```

The feedback can come from the assessment result.

---

# 44. QZ3 Retry

If allowed:

```text
Result
 ↓
[ Try Again ]
 ↓
New Assessment Attempt
```

The assessment system tracks:

```text
Attempt 1
Attempt 2
Attempt 3
```

QZ3 should not maintain independent attempt records.

---

# 45. QZ3 Tutorial Completion

Again:

```text
Assessment:
Incorrect
```

does not automatically mean:

```text
Tutorial:
Incomplete
```

unless that is the configured completion policy.

Possible:

```text
answered
correct
assessment_defined
```

The tutorial system owns the block completion state.

---

# 46. QZ3 Analytics

Tutorial-level:

```text
qz3_viewed
qz3_selection_started
qz3_submitted
qz3_completed
```

Assessment-level:

```text
question_attempted
selected_options
correctness
score
attempt_number
```

This separation remains consistent with QZ1 and QZ2.

---

# 47. QZ3 Useful Analytics

The Assessment Engine can determine:

```text
Most frequently selected wrong option
Most frequently omitted correct option
Average number of selections
Partial-credit frequency
Question difficulty
```

For example:

```text
Expected:
A, C, D

Most common learner response:
A, B, D
```

This can reveal:

> Option B is a strong distractor.

That is valuable assessment analytics.

---

# 48. QZ3 Distractor Analysis

For a question:

```text
☐ list
☐ tuple
☐ set
☐ dictionary
```

Suppose learners frequently select:

```text
tuple
```

incorrectly.

The assessment analytics system can identify:

```text
High distractor selection:
tuple
```

This can help question authors improve the assessment item.

QZ3 itself only presents the options.

---

# 49. QZ3 Example — Multiple Correct Statements

Question:

> Which statements about Python references are correct?

```text
☐ Two variables can reference the same object.
☐ Assignment always creates a copy.
☐ `is` checks object identity.
☐ Mutating a shared object can be visible through multiple references.
```

Correct:

```text
A
C
D
```

Learner selects:

```text
☑ A
☐ B
☑ C
☑ D
```

Assessment:

```text
Correct
```

This is a strong conceptual QZ3.

---

# 50. QZ3 Example — Exception Handling

Question:

> Which statements about Python exception handling are correct?

```text
☐ `except` can handle a matching exception.
☐ `finally` is used for cleanup logic.
☐ Every exception must be caught.
☐ An exception can propagate to a caller.
```

Correct:

```text
A
B
D
```

This allows assessment of multiple concepts simultaneously.

---

# 51. QZ3 Example — Lists

Question:

> Which operations can add elements to a Python list?

```text
☐ append()
☐ extend()
☐ insert()
☐ remove()
```

Correct:

```text
append()
extend()
insert()
```

This tests conceptual understanding rather than memorizing one answer.

---

# 52. QZ3 Example — OOP

Question:

> Which statements about method overriding are true?

```text
☐ A subclass can redefine a parent method.
☐ The subclass method can replace the inherited implementation for that class.
☐ Method overriding requires multiple inheritance.
☐ Polymorphism can involve overridden methods.
```

Correct:

```text
A
B
D
```

Again, multiple-select is the natural presentation.

---

# 53. QZ3 Example — Memory

Question:

> Which can cause two Python variables to refer to the same object?

```text
☐ b = a
☐ Passing the same object to another function
☐ Creating a shallow reference alias
☐ Every assignment creates an independent copy
```

Correct:

```text
A
B
C
```

This works well with your MemoryBlock progression.

---

# 54. QZ3 UI — Selection Count

If exactly three choices are expected:

```text
Which statements are correct?

Select 3 answers

Selected: 0 / 3
```

After selections:

```text
Selected: 2 / 3
```

After third:

```text
Selected: 3 / 3
```

The count reflects selection state only.

---

# 55. QZ3 Maximum Selection

If maximum selections are limited to three:

```text
Selected: 3 / 3
```

A fourth unchecked option can become temporarily unavailable:

```text
☐ Option D
```

or the UI can show:

> You can select up to 3 answers.

The exact behavior should be determined by the assessment UX contract.

---

# 56. QZ3 Minimum Selection

If at least two answers are required:

```text
Selected: 1 / 2 minimum
```

Submit can remain disabled until the minimum is satisfied, or the system can show validation feedback.

---

# 57. QZ3 Submission Validation vs Correctness

These must remain separate.

### Local UI validation

```text
Did the learner select enough options?
```

### Assessment validation

```text
Are those options correct?
How much should they score?
```

This architectural separation prevents QZ3 from becoming an assessment engine.

---

# 58. QZ3 State Machine

```text
LOADING
   ↓
READY
   ↓
ANSWERING
   ↓
SELECTING
   ↓
VALIDATE RESPONSE
   ↓
SUBMITTING
   ↓
EVALUATING
   ↓
RESULT
   ↓
COMPLETED
```

If the learner has not selected enough options:

```text
SELECTING
   ↓
INVALID RESPONSE
   ↓
SELECTING
```

---

# 59. QZ3 Complete Flow

```text
Tutorial
   ↓
QZ3
   ↓
Load Assessment Question
   ↓
Display Multiple Options
   ↓
Learner selects A
   ↓
Learner selects C
   ↓
Learner selects D
   ↓
Submit
   ↓
Assessment Engine
   ↓
Evaluate {A,C,D}
   ↓
Score / Result
   ↓
QZ3 Feedback
   ↓
Tutorial Progress
```

---

# 60. QZ3 Composer

The Tutorial Composer should allow:

```text
QuizBlock
Version:
[ QZ3 — Multiple Select ▼ ]

Assessment Question:
[ Search... ]

Selected:
Q-2001

Preview:
──────────────────────────
Which are mutable objects?

☐ list
☐ tuple
☐ set
☐ dictionary
```

The author is selecting an assessment question.

---

# 61. QZ3 Composer Should Not Have

Avoid providing:

```text
Correct Answers:
☑ list
☐ tuple
☑ set
☑ dictionary
```

inside the Tutorial Composer if the Assessment Engine owns this data.

The composer can preview the question but should not become a duplicate question-authoring system.

---

# 62. QZ3 Minimal JSON

```json
{
  "type": "quiz",
  "version": "QZ3",
  "questionId": "question_2001"
}
```

This is the preferred core representation.

---

# 63. QZ3 Presentation Configuration

Optional:

```json
{
  "type": "quiz",
  "version": "QZ3",
  "questionId": "question_2001",

  "presentation": {
    "showSelectionCount": true,
    "showFeedback": true,
    "showExplanation": true,
    "allowRetry": true
  }
}
```

These settings affect presentation only.

---

# 64. QZ3 Extended Interaction Metadata

If the assessment engine returns:

```json
{
  "responseType": "multiple_select",
  "selectionPolicy": {
    "min": 2,
    "max": 3
  }
}
```

QZ3 can render:

```text
Select 2–3 answers
```

The rule is not independently authored by the Tutorial Engine.

---

# 65. QZ3 No Local Correct Answer

Do not put:

```json
{
  "correctOptions": [
    "opt_1",
    "opt_3",
    "opt_4"
  ]
}
```

into tutorial content.

Instead:

```text
Tutorial
   ↓
questionId
   ↓
Assessment Engine
   ↓
Correctness
```

This preserves the single source of truth.

---

# 66. QZ3 Assessment Reuse

The same multiple-select assessment item could appear in:

```text
Tutorial A
    ↓
QZ3

Practice Assessment
    ↓
Same question

Exam
    ↓
Same question
```

The presentation can differ while the underlying question remains authoritative.

---

# 67. QZ3 and QZ7

QZ3 itself does not decide the next question.

It presents the question supplied by the assessment context.

QZ7 will eventually handle:

```text
learner performance
      ↓
difficulty selection
      ↓
next question
```

So QZ3 remains a fixed presentation.

---

# 68. QZ3 and QZ8

QZ3 presents:

```text
one multiple-select question
```

QZ8 will eventually represent:

```text
complete topic-level assessment
```

Therefore QZ3 does not own:

```text
quiz session
question sequencing
topic completion
overall score
```

Those remain assessment responsibilities.

---

# 69. QZ3 Visual Design Rules

Use:

```text
Primary: #F54A8D
Secondary: #0B1B3D
```

Recommended:

* white card
* dark-blue typography
* pink submit button
* pink selected checkbox
* subtle border
* clear focus state
* comfortable option spacing
* soft shadow
* no gradients
* no dark theme

The checkboxes should be visually obvious.

---

# 70. QZ3 Option Layout

For short options:

```text
☐ list
☐ tuple
☐ set
☐ dictionary
```

For long options:

```text
☐ A variable can refer to an object.

☐ Assignment always creates a new object.

☐ Multiple variables can refer to one object.

☐ `is` checks object identity.
```

Long options should have adequate vertical spacing.

---

# 71. QZ3 Mobile Layout

```text
┌──────────────────────────────┐
│ QUICK CHECK                  │
│                              │
│ Which statements are true?   │
│                              │
│ ☐ Option A                   │
│                              │
│ ☐ Option B                   │
│                              │
│ ☐ Option C                   │
│                              │
│ ☐ Option D                   │
│                              │
│ Selected: 0 / 2              │
│                              │
│ [ Submit Answer ]            │
└──────────────────────────────┘
```

Touch targets should be sufficiently large.

---

# 72. QZ3 Desktop Layout

```text
┌─────────────────────────────────────────────────┐
│ QUICK CHECK                                     │
│                                                 │
│ Which statements about references are true?     │
│                                                 │
│ ☐ A variable can refer to an object.            │
│                                                 │
│ ☐ Assignment always creates a copy.             │
│                                                 │
│ ☐ Multiple variables can share one object.      │
│                                                 │
│ ☐ `is` checks object identity.                  │
│                                                 │
│ Selected: 0 / 3                                 │
│                         [ Submit Answer ]        │
└─────────────────────────────────────────────────┘
```

---

# 73. QZ3 Final Technical Specification

| Area                             | QZ3 Decision                               |
| -------------------------------- | ------------------------------------------ |
| **Block**                        | **QuizBlock**                              |
| **Version**                      | **QZ3**                                    |
| **Presentation**                 | **Multiple Select**                        |
| **Question count**               | One                                        |
| **Options**                      | Multiple                                   |
| **Selection**                    | **Multiple allowed**                       |
| **Response**                     | Selection set                              |
| **Question ownership**           | Existing Assessment Engine                 |
| **Option ownership**             | Existing Assessment Engine                 |
| **Correct selection set**        | Existing Assessment Engine                 |
| **Evaluation**                   | Existing Assessment Engine                 |
| **Scoring**                      | Existing Assessment Engine                 |
| **Partial credit**               | Supported if assessment engine supports it |
| **Negative marking**             | Supported if assessment engine supports it |
| **Selection limits**             | Assessment-defined                         |
| **Minimum selection**            | Assessment-defined                         |
| **Maximum selection**            | Assessment-defined                         |
| **Attempt tracking**             | Existing Assessment Engine                 |
| **Mastery**                      | Existing Assessment Engine                 |
| **Assessment analytics**         | Existing Assessment Engine                 |
| **Tutorial analytics**           | Tutorial Engine                            |
| **UI**                           | Tutorial Engine                            |
| **Response control**             | Checkbox semantics                         |
| **Local validation**             | Selection-state validation only            |
| **Local correctness evaluation** | ❌                                          |
| **Local scoring**                | ❌                                          |
| **Local question bank**          | ❌                                          |
| **Correct answers duplicated**   | ❌                                          |
| **Question duplication**         | ❌                                          |
| **Retry**                        | Assessment policy                          |
| **Authentication**               | Existing platform auth                     |
| **Authorization**                | Existing assessment rules                  |
| **Accessibility**                | Checkbox-group semantics                   |
| **Keyboard navigation**          | ✅                                          |
| **Responsive**                   | ✅                                          |
| **Light theme**                  | ✅                                          |
| **Primary**                      | **#F54A8D**                                |
| **Secondary**                    | **#0B1B3D**                                |
| **Gradient**                     | ❌                                          |
| **Dark theme**                   | ❌                                          |
| **JSON-driven**                  | ✅                                          |

---

# 74. QZ3 Final Mental Model

```text
                         QZ3
                   MULTIPLE SELECT
                          │
                          ▼
                     ONE QUESTION
                          │
                          ▼
                   MULTIPLE OPTIONS
                          │
                          ▼
                  SELECT ONE OR MORE
                          │
                          ▼
                    SUBMIT SET
                          │
                          ▼
                ASSESSMENT ENGINE
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Evaluate       Score       Attempt
             │            │            │
             └────────────┼────────────┘
                          ▼
                       RESULT
                          │
                          ▼
                     QZ3 FEEDBACK
```

The core idea is:

> **QZ3 turns a single assessment question into a multi-answer selection experience while keeping all assessment intelligence inside the existing Assessment Engine.**

---

# 75. QuizBlock Progress

We have now completed:

```text
QZ1 — Single Question
        ↓
QZ2 — Multiple Choice
        ↓
QZ3 — Multiple Select
        ↓
QZ4 — True / False
        ↓
QZ5 — Code Output Quiz
        ↓
QZ6 — Scenario Quiz
        ↓
QZ7 — Adaptive Quiz
        ↓
QZ8 — Complete Topic Quiz
```

## **QZ3 — Multiple Select: COMPLETE** ✅

The next committed version is:

> **QZ4 — True / False**



```python

```

# BLOCK 16 — QuizBlock

## QZ5 — Code Output Quiz

Yes. We continue with **only QZ5**, one version at a time.

The committed sequence remains:

| Version | Presentation         | Status         |
| ------- | -------------------- | -------------- |
| QZ1     | Single Question      | ✅ Complete     |
| QZ2     | Multiple Choice      | ✅ Complete     |
| QZ3     | Multiple Select      | ✅ Complete     |
| QZ4     | True / False         | ✅ Complete     |
| **QZ5** | **Code Output Quiz** | 🔵 **CURRENT** |
| QZ6     | Scenario Quiz        | ⏳              |
| QZ7     | Adaptive Quiz        | ⏳              |
| QZ8     | Complete Topic Quiz  | ⏳              |

The architectural rule remains locked:

> **QZ5 is a presentation mode for code-output assessment. It does not execute the assessment logic or create a separate quiz engine. The existing Assessment Engine remains responsible for question definition, expected answer, evaluation, scoring, attempts, results, and analytics.**

---

# 1. What Is QZ5 — Code Output Quiz?

**QZ5 — Code Output Quiz** presents a code snippet and asks the learner to **predict what the code will produce**.

The fundamental interaction is:

```text
CODE
  ↓
READ / REASON
  ↓
PREDICT OUTPUT
  ↓
SUBMIT
  ↓
ASSESSMENT ENGINE
  ↓
COMPARE / EVALUATE
  ↓
RESULT
```

The defining rule is:

> **The learner predicts the result of executing code without actually executing it as part of the learner interaction.**

---

# 2. Why QZ5 Exists Separately

Code-output questions are common in technical learning and interviews.

They test whether the learner can mentally execute:

```text
variables
references
operators
control flow
functions
exceptions
object behavior
```

For example:

```python id="q5-basic"
x = 10
y = 20

print(x + y)
```

Question:

> What will this code print?

```text id="q5-options"
○ 10
○ 20
○ 30
○ Error
```

This is specifically a **Code Output Quiz**.

---

# 3. QZ5 vs QZ2

QZ2:

```text id="q5-qz2"
QUESTION
   ↓
MULTIPLE CHOICE
   ↓
SELECT ONE
```

QZ5:

```text id="q5-qz5"
CODE
   ↓
PREDICT EXECUTION RESULT
   ↓
ANSWER
```

QZ5 may use multiple-choice options, but its **primary purpose is code-output reasoning**.

Therefore:

> **The presentation version is determined by the learning intent, not merely by the response control.**

---

# 4. QZ5 vs InteractiveBlock

This distinction is particularly important.

### QZ5 — Code Output Quiz

```text id="q5-quiz"
Read Code
    ↓
Predict
    ↓
Submit
    ↓
Assessment
```

### InteractiveBlock

```text id="q5-interactive"
Edit Code
    ↓
Run Code
    ↓
Observe Output
```

QZ5 asks:

> **Can you predict what the code does?**

InteractiveBlock asks:

> **Can you experiment with the code and observe what happens?**

They must remain separate.

---

# 5. QZ5 Does Not Execute Learner Code

This is an important architectural boundary.

QZ5 should **not** become:

```text
Code Editor
     ↓
Execute Code
     ↓
Sandbox
     ↓
Output
```

That is the responsibility of **InteractiveBlock**, especially INT1–INT6.

QZ5 is:

```text
Code
 ↓
Prediction
 ↓
Assessment
```

---

# 6. QZ5 Basic Presentation

```text id="q5-ui-basic"
┌──────────────────────────────────────────────┐
│ CODE OUTPUT QUIZ                             │
│                                              │
│ What will this code print?                  │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                     │ │
│ │ print(len(numbers))                     │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ○ 2                                          │
│ ○ 3                                          │
│ ○ 4                                          │
│ ○ Error                                      │
│                                              │
│              [ Submit Answer ]               │
└──────────────────────────────────────────────┘
```

The learner predicts:

```text
3
```

without running the code.

---

# 7. QZ5 Core Flow

```text id="q5-flow"
┌──────────────────┐
│ Tutorial Content │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ QZ5 Block        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Display Code     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Learner Predicts │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Submit Answer    │
└────────┬─────────┘
         ↓
┌──────────────────────┐
│ Assessment Engine    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Evaluate Prediction  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Result + Feedback    │
└──────────────────────┘
```

---

# 8. QZ5 Question Structure

Conceptually, the assessment question contains:

```text id="q5-question"
Question
   │
   ├── Prompt
   ├── Code
   ├── Response Type
   ├── Expected Answer
   ├── Explanation
   ├── Difficulty
   ├── Topic
   └── Skill
```

QZ5 renders the presentation.

The Assessment Engine owns the authoritative answer and evaluation.

---

# 9. QZ5 Minimal Block Definition

The Tutorial Engine should reference the assessment question:

```json id="q5-json-min"
{
  "type": "quiz",
  "version": "QZ5",
  "questionId": "question_5001"
}
```

That keeps the block definition clean.

---

# 10. QZ5 Example — Simple Arithmetic

```python id="q5-code-1"
x = 10
y = 5

print(x - y)
```

Question:

> What will this code print?

```text id="q5-options-1"
○ 5
○ 10
○ 15
○ Error
```

Correct:

```text
5
```

---

# 11. QZ5 Example — List Length

```python id="q5-code-2"
numbers = [10, 20, 30, 40]

print(len(numbers))
```

Options:

```text id="q5-options-2"
○ 3
○ 4
○ 5
○ Error
```

Correct:

```text
4
```

This is a straightforward beginner-level QZ5.

---

# 12. QZ5 Example — Indexing

```python id="q5-code-3"
numbers = [10, 20, 30]

print(numbers[1])
```

Options:

```text id="q5-options-3"
○ 10
○ 20
○ 30
○ IndexError
```

Correct:

```text
20
```

This assesses zero-based indexing.

---

# 13. QZ5 Example — Mutation

```python id="q5-code-4"
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

Options:

```text id="q5-options-4"
○ [1, 2, 3]
○ [1, 2, 3, 4]
○ [4, 1, 2, 3]
○ Error
```

Correct:

```text
[1, 2, 3, 4]
```

---

# 14. QZ5 Example — References

This is especially useful for your Memory curriculum.

```python id="q5-code-5"
a = [1, 2, 3]
b = a

b.append(4)

print(a)
```

Options:

```text id="q5-options-5"
○ [1, 2, 3]
○ [1, 2, 3, 4]
○ [4]
○ Error
```

Correct:

```text
[1, 2, 3, 4]
```

The learner must understand:

```text
a ─────┐
       ▼
     [1,2,3]
       ▲
       │
b ─────┘
```

This is an excellent QZ5 after an M3 Reference Model block.

---

# 15. QZ5 Example — Identity

```python id="q5-code-6"
a = [1, 2]
b = a

print(a is b)
```

Options:

```text id="q5-options-6"
○ True
○ False
○ None
○ Error
```

Correct:

```text
True
```

This directly tests object identity.

---

# 16. QZ5 Example — Equality vs Identity

```python id="q5-code-7"
a = [1, 2]
b = [1, 2]

print(a == b)
print(a is b)
```

Options:

```text id="q5-options-7"
○ True, True
○ True, False
○ False, True
○ False, False
```

Correct:

```text
True, False
```

This is a higher-value conceptual QZ5 because the learner must distinguish:

```text
==
```

from:

```text
is
```

---

# 17. QZ5 Example — String Output

```python id="q5-code-8"
name = "Python"

print("Hello", name)
```

Output:

```text
Hello Python
```

Possible options:

```text id="q5-options-8"
○ HelloPython
○ Hello Python
○ "Hello Python"
○ Error
```

---

# 18. QZ5 Example — Conditional

```python id="q5-code-9"
x = 10

if x > 5:
    print("A")
else:
    print("B")
```

Options:

```text id="q5-options-9"
○ A
○ B
○ A B
○ Nothing
```

Correct:

```text
A
```

---

# 19. QZ5 Example — Loop

```python id="q5-code-10"
for i in range(3):
    print(i)
```

The learner predicts:

```text id="q5-output-10"
0
1
2
```

This can be represented as multiple-choice or another supported assessment response type.

---

# 20. QZ5 Example — Function

```python id="q5-code-11"
def add(a, b):
    return a + b

print(add(2, 3))
```

Options:

```text id="q5-options-11"
○ 2
○ 3
○ 5
○ Error
```

Correct:

```text
5
```

---

# 21. QZ5 Example — Mutable Default Argument

A more advanced question:

```python id="q5-code-12"
def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item(1))
print(add_item(2))
```

Options:

```text id="q5-options-12"
○ [1] / [2]
○ [1] / [1, 2]
○ [2] / [1, 2]
○ Error
```

Correct:

```text
[1]
[1, 2]
```

This becomes a strong interview-level QZ5.

---

# 22. QZ5 Example — Exception

```python id="q5-code-13"
numbers = [1, 2, 3]

print(numbers[5])
```

Options:

```text id="q5-options-13"
○ None
○ 5
○ IndexError
○ ValueError
```

Correct:

```text
IndexError
```

This tests both execution reasoning and exception understanding.

---

# 23. QZ5 Example — Exception Handling

```python id="q5-code-14"
try:
    print(10 / 0)
except ZeroDivisionError:
    print("Error")
```

Options:

```text id="q5-options-14"
○ 0
○ Error
○ ZeroDivisionError
○ Nothing
```

Correct:

```text
Error
```

---

# 24. QZ5 Example — Finally

```python id="q5-code-15"
try:
    print("A")
finally:
    print("B")
```

Output:

```text
A
B
```

This is a useful exception-handling QZ5.

---

# 25. QZ5 Example — Object Mutation

```python id="q5-code-16"
x = [1, 2]
y = x

x.append(3)

print(y)
```

Correct:

```text
[1, 2, 3]
```

The learner needs to reason about shared references.

---

# 26. QZ5 Example — Rebinding

Compare:

```python id="q5-code-17"
x = [1, 2]
y = x

x = [3, 4]

print(y)
```

Output:

```text
[1, 2]
```

This is an excellent question because it contrasts:

```text
mutation
```

with:

```text
rebinding
```

---

# 27. QZ5 Memory Learning Progression

QZ5 can reinforce your MemoryBlock versions:

```text
M1 Simple Memory Concept
        ↓
M2 Variable → Object
        ↓
M3 Reference Model
        ↓
M4 Stack / Heap
        ↓
M5 Object Memory Layout
        ↓
M6 Memory Before / After
        ↓
M7 Lifecycle
        ↓
M8 Complete Memory Model
```

For example:

```text
M3 Reference Model
        ↓
QZ5
        ↓
a = [...]
b = a
b.append(...)
print(a)
```

The learner must apply the reference model.

---

# 28. QZ5 Code Display

Code should be displayed as code, not ordinary paragraph text.

```python id="q5-display"
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

Recommended presentation:

* syntax highlighting
* monospace font
* readable line spacing
* line numbers when useful
* copy button optionally available
* no editing by default

---

# 29. QZ5 Code Is Read-Only

The standard QZ5 experience should be:

```text
READ CODE
```

not:

```text
EDIT CODE
```

If the learner is supposed to edit code:

> That belongs to **InteractiveBlock**.

Therefore QZ5 should not accidentally turn into INT2.

---

# 30. QZ5 Copy Code

A copy button may optionally be available:

```text
[ Copy Code ]
```

But this should not imply that the learner is expected to execute the code.

It can simply help learners inspect the snippet.

---

# 31. QZ5 No Run Button

The standard QZ5 should **not** have:

```text
[ Run ]
```

because that would undermine the purpose of prediction.

Instead:

```text
[ Submit Answer ]
```

The learner must commit to a prediction.

---

# 32. QZ5 Prediction Before Evaluation

The learner sees:

```text
Code
```

and:

```text
What will this code output?
```

Then:

```text
Answer
```

The actual execution result should not be revealed before submission.

---

# 33. QZ5 Result

After submission:

```text id="q5-result"
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ Expected output:                             │
│                                              │
│ [1, 2, 3, 4]                                 │
│                                              │
│ Your prediction matched the result.          │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

Whether to reveal expected output depends on the assessment feedback policy.

---

# 34. QZ5 Incorrect Result

```text id="q5-result-wrong"
┌──────────────────────────────────────────────┐
│ ✕ Incorrect                                  │
│                                              │
│ Your prediction was not correct.             │
│                                              │
│ Expected output:                             │
│ [1, 2, 3, 4]                                 │
│                                              │
│ Why?                                         │
│ `append()` modifies the existing list.       │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

The explanation is educationally important.

---

# 35. QZ5 Output Representation

Output may be:

### Single value

```text
5
```

### Multiple lines

```text
0
1
2
```

### Collection

```text
[1, 2, 3]
```

### String

```text
Hello Python
```

### Exception

```text
IndexError
```

The assessment question defines what constitutes the expected response.

---

# 36. QZ5 Exact Output vs Semantic Output

The Assessment Engine may need to distinguish:

```text
5
```

from:

```text
5.0
```

or:

```text
[1, 2, 3]
```

from:

```text
[1,2,3]
```

Therefore output normalization/evaluation should remain an assessment concern.

QZ5 should not invent its own answer-comparison algorithm.

---

# 37. QZ5 Response Types

QZ5 can conceptually support different assessment response formats.

### Multiple choice

```text
○ 10
○ 20
○ 30
○ Error
```

### Text prediction

```text
[________________]
```

### Structured output

```text
[ Output prediction ]
```

The response type should come from the assessment question definition.

The defining characteristic remains:

> **The question asks the learner to predict code output.**

---

# 38. QZ5 With Multiple Choice

This is likely the most common initial implementation:

```text
Code
 ↓
Question
 ↓
Multiple output choices
 ↓
Select one
 ↓
Submit
```

This combines:

```text
QZ5 presentation intent
```

with:

```text
single-select response
```

It does not become QZ2 because the content purpose is code-output prediction.

---

# 39. QZ5 With Text Answer

Example:

```python id="q5-text-code"
x = 5
y = 2

print(x * y)
```

Question:

> Predict the output.

```text id="q5-text-input"
Your prediction:

[________________________]
```

Submit:

```text
[ Submit Prediction ]
```

The assessment engine evaluates the response according to the question's answer rules.

---

# 40. QZ5 Code Output With Multiple Lines

Example:

```python id="q5-multi-code"
for i in range(3):
    print(i * 2)
```

Question:

> What will be printed?

```text id="q5-multi-answer"
[________________________]

[________________________]

[________________________]
```

Expected:

```text
0
2
4
```

Again, exact response handling belongs to the Assessment Engine.

---

# 41. QZ5 Code + Explanation

The block can display:

```text id="q5-code-explanation"
What will this code print?

┌───────────────────────────────────────┐
│ a = [1, 2]                            │
│ b = a                                 │
│ b.append(3)                           │
│ print(a)                              │
└───────────────────────────────────────┘

○ [1, 2]
○ [1, 2, 3]
○ [3]
○ Error
```

After evaluation:

```text
Why?

`a` and `b` reference the same list.
```

This makes QZ5 useful for conceptual reinforcement.

---

# 42. QZ5 Question Difficulty

QZ5 can naturally progress from:

### Beginner

```text
x = 2
print(x + 3)
```

to:

### Intermediate

```text
a = [1,2]
b = a
b.append(3)
print(a)
```

to:

### Advanced

```text
def f(x=[]):
    x.append(1)
    return x

print(f())
print(f())
```

The Assessment Engine can own difficulty metadata.

---

# 43. QZ5 FAANG-Level Usage

QZ5 can test:

```text
Variable binding
Reference semantics
Mutation
Rebinding
Scope
Closures
Default arguments
Generators
Iterators
Exceptions
MRO
Descriptors
Decorators
Evaluation order
Short-circuiting
```

For example:

```python id="q5-faang"
x = [1, 2]

def f(value):
    value.append(3)
    return value

y = f(x)

print(x is y)
print(x)
```

Expected:

```text
True
[1, 2, 3]
```

This is much more valuable than simple syntax recall.

---

# 44. QZ5 Assessment Metadata

Conceptually:

```json id="q5-metadata"
{
  "questionId": "Q-5001",
  "responseType": "single_select",
  "contentType": "code_output"
}
```

The exact schema should follow your existing assessment model.

The important semantic distinction is:

```text
contentType = code_output
```

or the equivalent representation in your architecture.

---

# 45. QZ5 Minimal Tutorial JSON

```json id="q5-min-json"
{
  "type": "quiz",
  "version": "QZ5",
  "questionId": "question_5001"
}
```

The block remains extremely small.

---

# 46. QZ5 Presentation Configuration

Optional:

```json id="q5-presentation-json"
{
  "type": "quiz",
  "version": "QZ5",
  "questionId": "question_5001",

  "presentation": {
    "showLineNumbers": true,
    "showFeedback": true,
    "showExplanation": true,
    "allowRetry": true
  }
}
```

These settings affect presentation.

They do not define correctness.

---

# 47. QZ5 Composer

The Tutorial Composer can provide:

```text id="q5-composer"
┌──────────────────────────────────────────────┐
│ QuizBlock                                    │
│                                              │
│ Version                                      │
│ [ QZ5 — Code Output Quiz ▼ ]                │
│                                              │
│ Assessment Question                          │
│ [ Search question... ]                       │
│                                              │
│ Selected                                     │
│ Q-5001                                       │
│                                              │
│ Preview                                      │
│ ──────────────────────────────────────────── │
│ What will this code print?                  │
│                                              │
│ numbers = [1, 2, 3]                          │
│ print(len(numbers))                          │
│                                              │
│ ○ 2   ○ 3   ○ 4   ○ Error                   │
└──────────────────────────────────────────────┘
```

---

# 48. QZ5 Composer Should Not Execute Code

The Composer should not need:

```text
[ Run Code ]
```

to author a QZ5 question.

The assessment question should already contain its expected answer.

If code execution is needed to author or validate the assessment item, that belongs to the assessment/question-authoring infrastructure, not the learner-facing QZ5 presentation.

---

# 49. QZ5 Security

This is especially important because code is involved.

QZ5 should treat the code snippet as **display content**.

It should not execute arbitrary code in the browser.

Therefore:

```text
QZ5
 ↓
Display code
 ↓
Learner prediction
```

not:

```text
QZ5
 ↓
Execute arbitrary learner/system code
```

This keeps QZ5 much safer and simpler than a playground.

---

# 50. QZ5 vs InteractiveBlock Security

### QZ5

```text
Code → Display → Predict
```

No execution required.

### InteractiveBlock

```text
Code → Execute → Output
```

Requires a secure execution/sandbox architecture.

This is a major architectural difference.

---

# 51. QZ5 Authentication

QZ5 uses the existing authentication/session system.

No separate:

```text
quiz_auth
code_quiz_auth
```

should be created.

---

# 52. QZ5 Authorization

The existing assessment authorization rules apply.

For example:

```text
Learner
 ↓
Tutorial access
 ↓
Question access
 ↓
QZ5
```

The QuizBlock should not bypass assessment access controls.

---

# 53. QZ5 Attempts

A learner may have:

```text
Attempt 1 → Incorrect
Attempt 2 → Correct
```

The Assessment Engine tracks those attempts.

QZ5 does not maintain its own:

```text
localAttempts
```

as the authoritative record.

---

# 54. QZ5 Tutorial Completion

Same architectural distinction:

```text
Assessment Result
       ≠
Tutorial Progress
```

Example:

```text
QZ5 answered
      ↓
Assessment: Incorrect
      ↓
Tutorial completion policy:
"answered"
      ↓
Block completed
```

This allows learning to continue without losing assessment data.

---

# 55. QZ5 Analytics

Tutorial events:

```text
qz5_viewed
qz5_prediction_started
qz5_submitted
qz5_completed
```

Assessment analytics:

```text
question_attempted
prediction
correctness
score
attempt
difficulty
```

The Assessment Engine can additionally analyze:

```text
common wrong predictions
```

---

# 56. QZ5 Misconception Analytics

For:

```python id="q5-misconception-code"
a = [1, 2]
b = a

b.append(3)

print(a)
```

Suppose many learners select:

```text
[1, 2]
```

instead of:

```text
[1, 2, 3]
```

This strongly suggests a misunderstanding of:

> shared references and mutation.

The assessment analytics can surface this to content authors.

---

# 57. QZ5 Before / After Learning

A useful tutorial sequence:

```text
M3 Reference Model
       ↓
Example
       ↓
QZ5 Code Output
       ↓
Learner predicts
       ↓
Feedback
       ↓
M6 Memory Before / After
```

This makes QZ5 a bridge between conceptual understanding and practical reasoning.

---

# 58. QZ5 Accessibility

Code should remain accessible.

Recommended:

* semantic code container
* readable monospace font
* sufficient contrast
* keyboard-accessible answer controls
* accessible question label
* accessible submit button
* result announcement
* no information conveyed by color alone

---

# 59. QZ5 Code Accessibility

If line numbers are displayed:

```text id="q5-line-numbers"
1  numbers = [1, 2, 3]
2  numbers.append(4)
3  print(numbers)
```

the line numbers should not interfere with screen-reader interpretation of the code.

The actual code content should remain semantically accessible.

---

# 60. QZ5 Responsive Design

Desktop:

```text id="q5-desktop"
┌──────────────────────────────────────────────┐
│ CODE OUTPUT QUIZ                             │
│                                              │
│ What will this code print?                  │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                     │ │
│ │ print(len(numbers))                     │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ○ 2    ○ 3    ○ 4    ○ Error                │
│                                              │
│                  [ Submit ]                  │
└──────────────────────────────────────────────┘
```

Mobile:

```text id="q5-mobile"
┌─────────────────────────────┐
│ CODE OUTPUT QUIZ            │
│                             │
│ What will this code print? │
│                             │
│ ┌─────────────────────────┐ │
│ │ numbers = [1, 2, 3]    │ │
│ │ print(len(numbers))    │ │
│ └─────────────────────────┘ │
│                             │
│ ○ 2                         │
│ ○ 3                         │
│ ○ 4                         │
│ ○ Error                     │
│                             │
│ [ Submit Answer ]           │
└─────────────────────────────┘
```

---

# 61. QZ5 Visual Design

Use the established Tutorial Engine style:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Recommended:

* white content card
* dark-blue headings
* dark code panel
* clear syntax highlighting
* pink selected/primary action
* subtle shadows
* readable code
* no gradient
* no dark overall page theme

The **code panel may naturally use a darker code-editor-style surface**, while the overall Tutorial Engine remains a light theme.

---

# 62. QZ5 Code Panel

Example:

```text id="q5-code-panel"
┌──────────────────────────────────────────────┐
│ Python                                       │
├──────────────────────────────────────────────┤
│ 1  numbers = [1, 2, 3]                       │
│ 2  numbers.append(4)                         │
│ 3  print(numbers)                             │
└──────────────────────────────────────────────┘
```

The code area is read-only.

---

# 63. QZ5 No Output Before Submission

Before answering:

```text id="q5-before"
Code
Question
Options
Submit
```

Do not show:

```text
Output:
[1,2,3,4]
```

because that would reveal the answer.

After evaluation, it may be displayed according to the feedback policy.

---

# 64. QZ5 Result Presentation

A strong result design:

```text id="q5-result-design"
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ Your prediction                              │
│ [1, 2, 3, 4]                                 │
│                                              │
│ Expected output                              │
│ [1, 2, 3, 4]                                 │
│                                              │
│ Why?                                         │
│ `append()` modifies the existing list.       │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

For incorrect answers:

```text id="q5-result-wrong-design"
┌──────────────────────────────────────────────┐
│ ✕ Incorrect                                  │
│                                              │
│ Your prediction                              │
│ [1, 2, 3]                                    │
│                                              │
│ Expected output                              │
│ [1, 2, 3, 4]                                 │
│                                              │
│ Why?                                         │
│ `append(4)` mutates the existing list.        │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

---

# 65. QZ5 Code Output and Execution

There is an important distinction between:

```text
Expected Output
```

and:

```text
Actual Runtime Output
```

For QZ5, the assessment question may have been authored with an expected output.

The learner is **predicting** that output.

QZ5 itself does not need to execute the snippet at runtime.

---

# 66. QZ5 Question Authoring Validation

The backend/question-authoring process may independently validate that:

```text
Code
+
Expected Answer
```

are consistent.

But this is an authoring/assessment concern.

It does not turn QZ5 into an interactive code execution environment.

---

# 67. QZ5 Code Execution Boundary

```text
              QZ5
               │
               │ display only
               ▼
             CODE
               │
               │ learner reasoning
               ▼
          PREDICTION
               │
               ▼
      ASSESSMENT ENGINE
```

Whereas InteractiveBlock:

```text
          InteractiveBlock
                │
                ▼
          Editable Code
                │
                ▼
         Secure Execution
                │
                ▼
             Output
```

This distinction should remain locked.

---

# 68. QZ5 and Existing Exam Architecture

```text id="q5-exam-architecture"
                 EXISTING ASSESSMENT ENGINE
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
      EXAMS            PRACTICE           TUTORIAL
                                             │
                                             ▼
                                        QuizBlock
                                             │
                           ┌─────────────────┼─────────────────┐
                           ▼                 ▼                 ▼
                          QZ1               QZ2               QZ3
                                                                │
                                                                ▼
                                                               QZ4
                                                                │
                                                                ▼
                                                               QZ5
```

The assessment engine remains centralized.

---

# 69. QZ5 Reuse

The same code-output question can potentially be used in:

```text
Tutorial → QZ5
Practice → Assessment
Exam → Assessment
Review → Assessment
```

The question remains a single authoritative assessment item.

---

# 70. QZ5 Question Versioning

If the Assessment Engine supports question versions:

```text
Q-5001
 ├── Version 1
 ├── Version 2
 └── Version 3
```

QZ5 references the appropriate assessment question/version according to the existing assessment contract.

The Tutorial Engine does not create an independent question-versioning system.

---

# 71. QZ5 Error Handling

### Question load failure

```text
Unable to load this code-output question.

[ Retry ]
```

### Submission failure

```text
Your prediction could not be submitted.

[ Retry Submission ]
```

### Assessment evaluation failure

```text
We couldn't evaluate your answer.

Please try again.
```

Do not falsely display:

```text
Correct
```

when evaluation has not succeeded.

---

# 72. QZ5 Submission Protection

```text
Prediction selected
       ↓
Submit
       ↓
Submitting...
       ↓
Disable response
       ↓
Assessment evaluation
       ↓
Result
```

This prevents duplicate attempts caused by repeated clicks.

---

# 73. QZ5 Retry

If allowed:

```text
Incorrect
   ↓
[ Try Again ]
   ↓
New Assessment Attempt
```

The Assessment Engine tracks the attempts.

---

# 74. QZ5 Tutorial Completion

The Tutorial Engine can record:

```text
blockId
status
completedAt
assessmentAttemptId
```

while the Assessment Engine records:

```text
questionId
response
correctness
score
attempt
```

This preserves the boundary.

---

# 75. QZ5 Minimal Data Model

Tutorial:

```json id="q5-data-model"
{
  "type": "quiz",
  "version": "QZ5",
  "questionId": "Q-5001"
}
```

Assessment:

```text id="q5-assessment-data"
Q-5001
 ├── code
 ├── prompt
 ├── responseType
 ├── options / expected output
 ├── correct answer
 ├── explanation
 ├── difficulty
 ├── topic
 └── skill
```

Only the first object belongs to the Tutorial Content.

---

# 76. QZ5 Final Technical Specification

| Area                          | QZ5 Decision                       |
| ----------------------------- | ---------------------------------- |
| **Block**                     | **QuizBlock**                      |
| **Version**                   | **QZ5**                            |
| **Presentation**              | **Code Output Quiz**               |
| **Question count**            | One                                |
| **Primary learner action**    | Predict output                     |
| **Code editing**              | ❌                                  |
| **Code execution by learner** | ❌                                  |
| **Run button**                | ❌                                  |
| **Question ownership**        | Existing Assessment Engine         |
| **Code content**              | Assessment question                |
| **Expected output**           | Assessment Engine                  |
| **Evaluation**                | Assessment Engine                  |
| **Scoring**                   | Assessment Engine                  |
| **Attempts**                  | Assessment Engine                  |
| **Mastery**                   | Assessment Engine                  |
| **Assessment analytics**      | Assessment Engine                  |
| **Tutorial analytics**        | Tutorial Engine                    |
| **Response**                  | Assessment-defined                 |
| **Multiple choice support**   | ✅                                  |
| **Text prediction support**   | ✅ if assessment engine supports it |
| **Exact output evaluation**   | Assessment Engine                  |
| **Output normalization**      | Assessment Engine                  |
| **Correct answer in client**  | ❌ Prefer server-side evaluation    |
| **Local scoring**             | ❌                                  |
| **Local question bank**       | ❌                                  |
| **Local execution sandbox**   | ❌                                  |
| **Question duplication**      | ❌                                  |
| **Authentication**            | Existing platform auth             |
| **Authorization**             | Existing assessment rules          |
| **Retry**                     | Assessment policy                  |
| **Feedback**                  | Assessment result                  |
| **Explanation**               | Assessment content/result          |
| **Accessibility**             | ✅                                  |
| **Responsive**                | ✅                                  |
| **Light theme**               | ✅                                  |
| **Primary**                   | **#F54A8D**                        |
| **Secondary**                 | **#0B1B3D**                        |
| **Gradient**                  | ❌                                  |
| **Dark overall theme**        | ❌                                  |
| **JSON-driven**               | ✅                                  |

---

# 77. QZ5 Final Mental Model

```text id="q5-final-model"
                         QZ5
                  CODE OUTPUT QUIZ
                          │
                          ▼
                    DISPLAY CODE
                          │
                          ▼
                 ASK FOR PREDICTION
                          │
                          ▼
                   LEARNER ANSWER
                          │
                          ▼
                       SUBMIT
                          │
                          ▼
                EXISTING ASSESSMENT
                      ENGINE
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           Evaluate      Score      Attempt
              │           │           │
              └───────────┼───────────┘
                          ▼
                        RESULT
                          │
                          ▼
                    QZ5 FEEDBACK
                          │
                          ▼
                   TUTORIAL PROGRESS
```

The central concept is:

> **QZ5 tests whether the learner can mentally execute and predict code behavior. It does not execute the learner's code.**

That keeps it clearly different from **InteractiveBlock**, while still allowing it to use the existing **Assessment Engine**.

---

# 78. QuizBlock Progress

```text
QZ1 — Single Question
        ↓
QZ2 — Multiple Choice
        ↓
QZ3 — Multiple Select
        ↓
QZ4 — True / False
        ↓
QZ5 — Code Output Quiz
        ↓
QZ6 — Scenario Quiz
        ↓
QZ7 — Adaptive Quiz
        ↓
QZ8 — Complete Topic Quiz
```

## **QZ5 — Code Output Quiz: COMPLETE** ✅

The next committed version is:

> **QZ6 — Scenario Quiz**



```python

```

# BLOCK 16 — QuizBlock

## QZ6 — Scenario Quiz

Yes. We continue with **only QZ6**, one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| QZ1     | Single Question     | ✅ Complete     |
| QZ2     | Multiple Choice     | ✅ Complete     |
| QZ3     | Multiple Select     | ✅ Complete     |
| QZ4     | True / False        | ✅ Complete     |
| QZ5     | Code Output Quiz    | ✅ Complete     |
| **QZ6** | **Scenario Quiz**   | 🔵 **CURRENT** |
| QZ7     | Adaptive Quiz       | ⏳              |
| QZ8     | Complete Topic Quiz | ⏳              |

The architectural rule remains locked:

> **QZ6 is a scenario-based presentation mode. The existing Assessment Engine remains responsible for question data, answer evaluation, scoring, attempts, results, mastery, and assessment analytics.**

---

# 1. What Is QZ6 — Scenario Quiz?

A **Scenario Quiz** places the learner inside a realistic situation and asks them to determine the appropriate technical decision, behavior, diagnosis, or solution.

Instead of asking:

> What is exception propagation?

QZ6 asks:

> A function raises an exception that is not handled locally. What happens next?

The learner must **apply knowledge to a situation**.

Core flow:

```text
SCENARIO
   ↓
UNDERSTAND CONTEXT
   ↓
ANALYZE PROBLEM
   ↓
SELECT / PROVIDE ANSWER
   ↓
ASSESSMENT ENGINE
   ↓
EVALUATE
   ↓
RESULT + EXPLANATION
```

---

# 2. Why QZ6 Is Different

The progression of the QuizBlock versions is intentional.

```text
QZ1
Simple assessment interaction
        ↓
QZ2
Choose one
        ↓
QZ3
Choose multiple
        ↓
QZ4
Evaluate a statement
        ↓
QZ5
Predict code behavior
        ↓
QZ6
Apply knowledge to a situation
```

So QZ6 moves from:

> **"Do you know this?"**

toward:

> **"Can you apply what you know?"**

---

# 3. QZ6 vs QZ5

### QZ5 — Code Output

```text
CODE
 ↓
PREDICT OUTPUT
```

Example:

```python
x = [1, 2]
y = x
y.append(3)

print(x)
```

### QZ6 — Scenario

```text
SITUATION
 ↓
ANALYZE WHAT SHOULD HAPPEN
 ↓
MAKE A DECISION
```

Example:

> A developer passes a list to a function. The function appends an item, and the caller unexpectedly sees the change. What explains this behavior?

The learner must apply the concept of shared references.

---

# 4. QZ6 vs QuestionBlock

This distinction is important.

### QuestionBlock

```text
QUESTION
 ↓
THINK
 ↓
ANSWER / EXPLAIN
```

It is primarily a **learning/question interaction**.

### QZ6

```text
SCENARIO
 ↓
ASSESS DECISION
 ↓
SUBMIT
 ↓
SCORE
```

It is a **formal assessment interaction**.

---

# 5. QZ6 vs TaskBlock

### TaskBlock

> Implement a function that removes duplicate elements from a list.

The learner actually performs the task.

### QZ6

> A production system receives duplicate records. Which approach should the developer choose to eliminate duplicates while preserving insertion order?

The learner makes a decision.

Therefore:

```text
TaskBlock → Do something
QZ6       → Decide what should be done
```

---

# 6. QZ6 vs ExerciseBlock

Exercise:

> Complete this code.

Scenario Quiz:

> You are debugging a production application and discover this behavior. Which explanation is correct?

Therefore:

```text
Exercise → Practice the skill
Scenario → Apply the skill to a situation
```

---

# 7. QZ6 Basic Presentation

```text
┌──────────────────────────────────────────────┐
│ SCENARIO QUIZ                               │
│                                              │
│ A developer creates a list and assigns it   │
│ to another variable. The second variable    │
│ modifies the list, and the first variable   │
│ also appears changed.                       │
│                                              │
│ Why does this happen?                       │
│                                              │
│ ○ The variables reference the same object.  │
│                                              │
│ ○ Python automatically copies the list.     │
│                                              │
│ ○ Lists cannot be modified.                 │
│                                              │
│ ○ The interpreter creates a new list.       │
│                                              │
│              [ Submit Answer ]               │
└──────────────────────────────────────────────┘
```

---

# 8. QZ6 Scenario Structure

A scenario should generally contain:

```text
CONTEXT
   ↓
SITUATION
   ↓
PROBLEM / DECISION
   ↓
QUESTION
   ↓
RESPONSE
```

For example:

```text
Context:
A developer is working with Python lists.

Situation:
Two variables reference a list.

Problem:
Changing one variable changes what is observed
through the other variable.

Question:
Why?
```

---

# 9. QZ6 Scenario Components

Conceptually:

```text
Scenario
├── Context
├── Situation
├── Problem
├── Question
├── Response Options
└── Assessment Metadata
```

The presentation can render these pieces.

The Assessment Engine remains authoritative for the assessment definition.

---

# 10. QZ6 Scenario Example — References

### Scenario

> A developer creates a list called `users`. They assign `active_users = users`. Later, the developer removes an item from `active_users`. They notice that `users` also changed.

Question:

> What is the most likely explanation?

```text
○ Both variables reference the same list object.
○ Python automatically duplicated the list.
○ Lists cannot be modified after creation.
○ The second variable contains only a snapshot.
```

Correct concept:

```text
Both variables reference the same list object.
```

---

# 11. QZ6 Scenario Example — Exception Handling

### Scenario

> A function performs a database operation. An exception occurs inside the function. There is no matching `except` block in that function, but the caller has a matching `except` block.

Question:

> What should happen?

```text
○ The exception can propagate to the caller.
○ Python automatically ignores the exception.
○ The program must terminate immediately.
○ The caller cannot handle exceptions raised by another function.
```

Correct:

```text
The exception can propagate to the caller.
```

This tests **exception propagation**, not just its definition.

---

# 12. QZ6 Scenario Example — Debugging

### Scenario

> A developer expects a list to remain unchanged after passing it to a function. The function uses `append()` and the original list changes.

Question:

> What should the developer investigate first?

```text
○ Whether the function received a reference to the same list.
○ Whether Python lists are immutable.
○ Whether append() creates a new list.
○ Whether Python variables always contain copies.
```

This assesses debugging reasoning.

---

# 13. QZ6 Scenario Example — OOP

### Scenario

> A subclass defines a method with the same name as a method in its parent class. When an instance of the subclass calls the method, the subclass implementation executes.

Question:

> Which concept best explains this behavior?

```text
○ Method overriding
○ Multiple inheritance
○ Encapsulation
○ Garbage collection
```

Correct:

```text
Method overriding
```

---

# 14. QZ6 Scenario Example — MRO

### Scenario

> A Python class inherits from multiple classes. More than one parent provides a method with the same name.

Question:

> Which mechanism determines the order in which Python searches for the method?

```text
○ MRO
○ Garbage collection
○ Reference counting
○ Exception propagation
```

Correct:

```text
MRO
```

---

# 15. QZ6 Scenario Example — Data Structures

### Scenario

> A developer needs a collection that prevents duplicate values and supports fast membership testing.

Question:

> Which Python data structure is the most appropriate starting choice?

```text
○ set
○ list
○ tuple
○ string
```

Correct:

```text
set
```

This tests **application**, not just:

> What is a set?

---

# 16. QZ6 Scenario Example — Lists

### Scenario

> A developer wants to add every element from one list into another list rather than adding the second list as a single nested element.

Question:

> Which operation should they consider?

```text
○ extend()
○ append()
○ remove()
○ pop()
```

Correct:

```text
extend()
```

---

# 17. QZ6 Scenario Example — Exception Choice

### Scenario

> A program expects the user to enter an integer. The user enters `"hello"`, and conversion with `int()` fails.

Question:

> Which exception should the developer expect?

```text
○ ValueError
○ TypeError
○ IndexError
○ KeyError
```

Correct:

```text
ValueError
```

This applies exception knowledge to a realistic situation.

---

# 18. QZ6 Scenario Example — Production Debugging

### Scenario

> A production service occasionally fails because a function receives data of an unexpected type. The developer wants the failure to be handled at the boundary where invalid input enters the system.

Question:

> Which design approach is most appropriate?

```text
○ Validate the input at the boundary and handle the expected failure.
○ Ignore the error and continue.
○ Catch every exception everywhere.
○ Remove all exception handling.
```

This tests architectural reasoning.

---

# 19. QZ6 Scenario Difficulty

QZ6 can progress through:

### Beginner

```text
Simple situation
      ↓
One obvious concept
```

### Intermediate

```text
Situation
 ↓
Several possible explanations
 ↓
Choose best explanation
```

### Advanced

```text
Realistic context
 ↓
Conflicting constraints
 ↓
Analyze trade-offs
 ↓
Choose best engineering decision
```

---

# 20. QZ6 FAANG-Level Scenario

For example:

> A service processes thousands of records. A developer uses a list for repeated membership checks, and the operation becomes increasingly slow as the dataset grows.

Question:

> Which change is most likely to improve membership-test performance when uniqueness is acceptable?

```text
○ Use a set.
○ Convert the list to another list.
○ Sort the list every time before searching.
○ Add more `if` statements.
```

The learner must connect:

```text
data structure
+
hashing
+
membership complexity
```

to a practical situation.

---

# 21. QZ6 Multi-Concept Scenario

QZ6 becomes particularly valuable when a scenario requires several concepts.

Example:

> A developer passes a mutable object into a function. The function modifies the object, and the caller sees the change. The developer then reassigns the local parameter to another object, but the caller's variable does not change.

Question:

> Which explanation best describes both observations?

This requires understanding:

```text
reference sharing
+
mutation
+
rebinding
```

That is much deeper than a simple definition question.

---

# 22. QZ6 Response Types

A Scenario Quiz should not be restricted to one response mechanism.

Depending on the assessment question:

### Single choice

```text
○ A
○ B
○ C
○ D
```

### Multiple select

```text
☐ A
☐ B
☐ C
☐ D
```

### True / False

```text
○ True
○ False
```

### Text response

```text
[________________________]
```

The assessment engine owns the response type.

QZ6 defines the **scenario-based presentation intent**.

---

# 23. QZ6 With Multiple Select

Example:

> A production application has slow membership checks against a large collection. Which changes could be appropriate?

```text
☐ Consider using a set for membership checks.
☐ Analyze the time complexity of the current approach.
☐ Automatically replace every list with a set.
☐ Consider whether ordering requirements prevent using a set.
```

This can be a scenario-based multiple-select assessment.

Again:

```text
QZ6 = scenario presentation
QZ3 = multiple-select presentation
```

The response mechanism may overlap, but the learning presentation is different.

---

# 24. QZ6 Scenario + Code

A scenario can include code.

Example:

> A developer reports that modifying `b` unexpectedly changes `a`.

```python
a = [1, 2]
b = a

b.append(3)
```

Question:

> Which explanation best describes the behavior?

```text
○ a and b reference the same list.
○ b contains an automatic copy of a.
○ append() creates a new object for b.
○ Lists cannot be shared.
```

This is still QZ6 because the question is framed as a scenario.

---

# 25. QZ6 Scenario + Error

Example:

> A user enters `"abc"` where the application expects an integer.

Code:

```python
age = int(user_input)
```

Question:

> The application raises `ValueError`. What is the most appropriate interpretation?

```text
○ The value has the wrong format for the requested conversion.
○ The variable does not exist.
○ The list index is invalid.
○ A dictionary key is missing.
```

This tests applied exception reasoning.

---

# 26. QZ6 Scenario + Error Message

QZ6 can present:

```text
┌──────────────────────────────────────────────┐
│ SCENARIO                                     │
│                                              │
│ A user enters "abc" into an age field.       │
│                                              │
│ The application reports:                     │
│                                              │
│ ValueError: invalid literal for int()        │
│                                              │
│ What is the most likely cause?               │
│                                              │
│ ○ Invalid numeric input                      │
│ ○ Missing dictionary key                     │
│ ○ Invalid list index                         │
│ ○ Missing function                           │
└──────────────────────────────────────────────┘
```

This is an excellent bridge between:

```text
MistakeBlock
+
Exception Handling
+
QuizBlock
```

---

# 27. QZ6 Scenario + Debugging

Example:

> A developer writes:

```python
items = [1, 2, 3]
for item in items:
    if item == 2:
        items.remove(item)
```

The developer expects the loop to process every original element.

Question:

> What should the developer investigate?

Possible options:

```text
○ Modifying a collection while iterating over it.
○ Python lists cannot be iterated.
○ `remove()` always removes all elements.
○ `for` loops cannot contain `if` statements.
```

This is scenario-based debugging.

---

# 28. QZ6 Scenario + Architecture

Scenario:

> An API endpoint receives malformed input from clients.

Question:

> Where should validation primarily occur?

Possible answers:

```text
○ At the API/input boundary.
○ Only inside the database.
○ Only in the frontend.
○ Nowhere; invalid input should be allowed.
```

This can assess software-engineering judgment.

---

# 29. QZ6 Scenario + Best Practice

Scenario:

> A developer catches every exception using:

```python
try:
    ...
except Exception:
    pass
```

The application appears to continue running, but failures are difficult to diagnose.

Question:

> What is the primary concern?

```text
○ Broadly swallowing exceptions can hide failures.
○ Python does not support exception handling.
○ `except Exception` only catches syntax errors.
○ `pass` automatically logs the exception.
```

This connects QZ6 with BestPracticeBlock.

---

# 30. QZ6 Scenario + Performance

Scenario:

> A developer repeatedly checks whether an item exists in a large list.

Question:

> What should the developer investigate first?

```text
○ Membership-test complexity and whether a set is appropriate.
○ Whether `print()` is faster than membership testing.
○ Whether converting every value to a string is required.
○ Whether lists always provide O(1) membership lookup.
```

The correct reasoning connects:

```text
algorithm
+
data structure
+
complexity
```

---

# 31. QZ6 Scenario Context Should Be Meaningful

Avoid fake scenarios such as:

> John has a list. What happens?

Prefer meaningful context:

> A backend service receives thousands of unique IDs and performs repeated membership checks before processing each request.

The scenario should add **reasoning context**, not unnecessary storytelling.

---

# 32. QZ6 Scenario Length

Use the smallest amount of context necessary.

### Too short

> Which data structure is best?

That is simply a QuestionBlock/QZ2-style question.

### Better

> A service repeatedly checks whether user IDs already exist in a large collection. Duplicate IDs are not required.

Then:

> Which data structure should the developer consider?

The context creates the scenario.

---

# 33. QZ6 Scenario Quality Rule

A strong scenario should have:

```text
REALISTIC CONTEXT
       +
RELEVANT CONSTRAINT
       +
TECHNICAL PROBLEM
       +
DECISION / DIAGNOSIS
```

Example:

```text
Large collection
       +
Repeated membership checks
       +
Performance concern
       ↓
Choose appropriate data structure
```

---

# 34. QZ6 Should Test Application

Weak:

> What is a set?

Better:

> A system needs unique values and frequent membership checks. Which structure should the developer consider?

The second requires:

```text
knowledge
   ↓
application
   ↓
decision
```

That is the core purpose of QZ6.

---

# 35. QZ6 Question Flow

```text
SCENARIO
   ↓
WHAT IS HAPPENING?
   ↓
WHAT CONCEPT APPLIES?
   ↓
WHAT SHOULD THE DEVELOPER DO?
   ↓
SUBMIT
```

This makes QZ6 useful for higher-order learning.

---

# 36. QZ6 Result

Correct:

```text
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ The function received a reference to the     │
│ same list object.                             │
│                                              │
│ This is why mutation is visible through      │
│ both variables.                              │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

---

# 37. QZ6 Incorrect Result

```text
┌──────────────────────────────────────────────┐
│ ✕ Incorrect                                  │
│                                              │
│ The variables can reference the same mutable │
│ object.                                      │
│                                              │
│ `b = a` does not automatically create an     │
│ independent list copy.                       │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

---

# 38. QZ6 Partial Credit

If the Assessment Engine supports partial credit:

```text
┌──────────────────────────────────────────────┐
│ ◐ Partially Correct                          │
│                                              │
│ You identified one important factor, but     │
│ missed the constraint related to ordering.   │
│                                              │
│ Score: 2 / 3                                 │
└──────────────────────────────────────────────┘
```

QZ6 does not calculate this score.

---

# 39. QZ6 Assessment Ownership

The architecture remains:

```text
                     QZ6
                      │
                      │ questionId
                      ▼
             Assessment Engine
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     Question       Options       Rules
        │             │             │
        └─────────────┼─────────────┘
                      ▼
                  Evaluation
                      │
             ┌────────┼────────┐
             ▼        ▼        ▼
           Score    Attempt   Result
```

---

# 40. QZ6 Minimal JSON

```json
{
  "type": "quiz",
  "version": "QZ6",
  "questionId": "question_6001"
}
```

The Tutorial Engine needs only the reference and presentation version.

---

# 41. QZ6 Optional Presentation Configuration

```json
{
  "type": "quiz",
  "version": "QZ6",
  "questionId": "question_6001",
  "presentation": {
    "showScenarioLabel": true,
    "showFeedback": true,
    "showExplanation": true,
    "allowRetry": true
  }
}
```

Again, these are presentation settings.

---

# 42. QZ6 Assessment Question Concept

Conceptually:

```text
Q-6001

Content Type:
scenario

Scenario:
A developer observes...

Question:
What should the developer investigate?

Response Type:
single_select

Options:
A
B
C
D

Evaluation:
Assessment Engine
```

The question authoring system owns this content.

---

# 43. QZ6 Composer

The Tutorial Composer can expose:

```text
┌──────────────────────────────────────────────┐
│ QuizBlock                                    │
│                                              │
│ Version                                      │
│ [ QZ6 — Scenario Quiz ▼ ]                   │
│                                              │
│ Assessment Question                          │
│ [ Search question... ]                       │
│                                              │
│ Selected                                     │
│ Q-6001                                       │
│                                              │
│ Preview                                      │
│ ──────────────────────────────────────────── │
│ SCENARIO                                     │
│                                              │
│ A developer notices that modifying `b` also │
│ changes `a`.                                 │
│                                              │
│ What explains this behavior?                │
│                                              │
│ ○ A  ○ B  ○ C  ○ D                          │
└──────────────────────────────────────────────┘
```

---

# 44. QZ6 Composer Should Not Duplicate Question Authoring

Do not create a second scenario-question database inside the Tutorial Engine.

Avoid:

```text
Tutorial Scenario Questions
```

when the Assessment Engine already owns:

```text
Assessment Questions
```

Instead:

```text
QuizBlock QZ6
      ↓
questionId
      ↓
Assessment Question
```

---

# 45. QZ6 Scenario Presentation

A strong visual hierarchy:

```text
┌──────────────────────────────────────────────┐
│ SCENARIO QUIZ                                │
│                                              │
│ Scenario                                     │
│ ──────────────────────────────────────────── │
│ A backend service receives thousands of      │
│ IDs and repeatedly checks membership.        │
│                                              │
│ Question                                     │
│ ──────────────────────────────────────────── │
│ Which data structure should be considered?   │
│                                              │
│ ○ list                                       │
│ ○ set                                        │
│ ○ tuple                                      │
│ ○ string                                     │
│                                              │
│                  [ Submit ]                  │
└──────────────────────────────────────────────┘
```

This makes the scenario visually distinct from QZ1–QZ5.

---

# 46. QZ6 Context Card

A scenario can use a separate context area:

```text
┌──────────────────────────────────────────────┐
│ Scenario                                     │
│                                              │
│ A service processes thousands of records and │
│ repeatedly checks membership.                │
└──────────────────────────────────────────────┘

Question

Which data structure should be considered?
```

This is particularly useful for longer scenarios.

---

# 47. QZ6 Long Scenario

For advanced questions:

```text
┌──────────────────────────────────────────────┐
│ Scenario                                     │
│                                              │
│ A production service receives requests from  │
│ multiple clients. Input validation currently │
│ occurs only after business logic begins.     │
│ Invalid input frequently causes exceptions   │
│ deep inside the call stack, making failures  │
│ difficult to diagnose.                       │
│                                              │
│ Question                                     │
│                                              │
│ What architectural improvement should be     │
│ considered first?                            │
│                                              │
│ ○ Validate at the input boundary             │
│ ○ Ignore invalid requests                    │
│ ○ Catch every exception globally              │
│ ○ Remove validation                           │
│                                              │
│                  [ Submit ]                  │
└──────────────────────────────────────────────┘
```

This is a true scenario assessment.

---

# 48. QZ6 Scenario Sections

For longer scenarios, optionally structure:

```text
Scenario
   │
   ├── Context
   ├── Environment
   ├── Problem
   ├── Constraint
   └── Question
```

Example:

```text
Context:
Production API

Problem:
Malformed input

Constraint:
Need predictable failure handling

Question:
Where should validation occur?
```

---

# 49. QZ6 Should Avoid Unnecessary Storytelling

Do not turn every question into:

> "Rahul joined a company on Monday. His manager asked him..."

The goal is technical assessment.

Prefer:

> "A production API receives malformed input from clients."

This keeps the content professional and FAANG-style.

---

# 50. QZ6 Scenario Categories

QZ6 can eventually support scenarios involving:

```text
Concept application
Debugging
Architecture
Performance
Security
Exception handling
Data structures
Algorithms
OOP
Memory
API design
Database behavior
System behavior
Best practices
Code review
Production incidents
```

The underlying assessment engine remains unchanged.

---

# 51. QZ6 Code Review Scenario

Example:

> During code review, a developer notices:

```python
try:
    process_request()
except Exception:
    pass
```

Question:

> What is the strongest concern with this implementation?

```text
○ It can silently hide failures.
○ Python does not allow `except Exception`.
○ `pass` automatically retries the operation.
○ It converts all exceptions into warnings.
```

This tests practical engineering judgment.

---

# 52. QZ6 Production Incident Scenario

Example:

> A service suddenly begins consuming more CPU. Investigation shows a large list is repeatedly scanned for membership.

Question:

> Which factor should be investigated first?

```text
○ Membership-test complexity and data structure choice.
○ Whether the list variable has a longer name.
○ Whether comments are missing.
○ Whether the application uses functions.
```

The scenario forces the learner to connect:

```text
symptom
 ↓
technical cause
 ↓
appropriate investigation
```

---

# 53. QZ6 Debugging Scenario

Example:

> A developer expects a function to leave the caller's list unchanged, but the caller observes a new element afterward.

Question:

> What should the developer inspect first?

```text
○ Whether the function mutates the passed list.
○ Whether Python variables are immutable.
○ Whether `print()` changes the list.
○ Whether functions cannot receive lists.
```

---

# 54. QZ6 Decision Scenario

Example:

> A developer needs to preserve insertion order while eliminating duplicate values.

Question:

> What should the developer consider?

This is intentionally more nuanced than:

> Which collection is unique?

The scenario may require the learner to consider:

```text
uniqueness
+
ordering
+
available data structures
```

This is where QZ6 becomes much more valuable than simple recall.

---

# 55. QZ6 Scenario Reasoning

A high-quality scenario should encourage this mental process:

```text
Observe
  ↓
Identify relevant facts
  ↓
Ignore irrelevant facts
  ↓
Recall concept
  ↓
Apply concept
  ↓
Choose solution
```

That is the primary educational purpose of QZ6.

---

# 56. QZ6 Analytics

The Assessment Engine can measure:

```text
Scenario success rate
Correct decision rate
Common wrong decision
Difficulty
Average attempts
Topic performance
Skill performance
```

For example:

```text
Scenario:
Shared Mutable References

Correct:
38%

Most common wrong answer:
"Python automatically copies the list."
```

This provides a strong signal that the concept needs reinforcement.

---

# 57. QZ6 Cross-Block Learning Loop

A powerful Tutorial Engine flow could be:

```text
ConceptBlock
     ↓
ExampleBlock
     ↓
QZ5 Code Output
     ↓
QZ6 Scenario
     ↓
MistakeBlock
     ↓
BestPracticeBlock
```

For example:

```text
Reference Model
      ↓
Code Output Prediction
      ↓
Production Scenario
      ↓
Common Mistake
      ↓
Best Practice
```

This creates a deeper learning progression.

---

# 58. QZ6 Retry

If assessment policy allows:

```text
Incorrect
   ↓
Explanation
   ↓
[ Try Again ]
   ↓
New Attempt
```

The Assessment Engine owns attempt history.

---

# 59. QZ6 Authentication

Uses the existing authentication infrastructure.

No separate scenario authentication system should be created.

```text
Existing User Session
        ↓
Assessment API
        ↓
QZ6
```

---

# 60. QZ6 Authorization

Existing authorization remains authoritative.

```text
User
 ↓
Tutorial Access
 ↓
Assessment Access
 ↓
QZ6
```

QZ6 does not introduce separate permissions.

---

# 61. QZ6 Security

Scenario text and answer options are content.

They should be treated as untrusted display data and safely rendered.

If a scenario contains code:

```python
try:
    process()
except Exception:
    pass
```

it is displayed as code.

It is **not executed**.

---

# 62. QZ6 Accessibility

The scenario should use a semantic structure:

```text
Heading
 ↓
Scenario description
 ↓
Question
 ↓
Response group
 ↓
Submit
```

For a single-choice question:

```text
Radio group
```

For multiple-select:

```text
Checkbox group
```

The underlying semantics are determined by the assessment response type.

---

# 63. QZ6 Keyboard Navigation

Example:

```text
Tab
 ↓
Scenario
 ↓
Question
 ↓
Option A
 ↓
Option B
 ↓
Option C
 ↓
Option D
 ↓
Submit
```

All interactive controls must be keyboard reachable.

---

# 64. QZ6 Responsive Design

Desktop:

```text
┌─────────────────────────────────────────────────┐
│ SCENARIO QUIZ                                  │
│                                                 │
│ Scenario                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ A production service repeatedly checks IDs. │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Which data structure should be considered?      │
│                                                 │
│ ○ list      ○ set      ○ tuple      ○ string    │
│                                                 │
│                     [ Submit ]                  │
└─────────────────────────────────────────────────┘
```

Mobile:

```text
┌─────────────────────────────┐
│ SCENARIO QUIZ               │
│                             │
│ Scenario                    │
│ ┌─────────────────────────┐ │
│ │ A service repeatedly    │ │
│ │ checks membership...    │ │
│ └─────────────────────────┘ │
│                             │
│ Which structure?            │
│                             │
│ ○ list                      │
│ ○ set                       │
│ ○ tuple                     │
│ ○ string                    │
│                             │
│ [ Submit Answer ]           │
└─────────────────────────────┘
```

---

# 65. QZ6 Visual Design

Use the established Tutorial Engine visual language:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Recommended:

* white outer page
* dark-blue headings
* scenario card
* clear "Scenario" label
* clear "Question" label
* readable answer controls
* pink selected state
* pink primary button
* subtle shadows
* no gradients
* no dark overall theme

---

# 66. QZ6 Scenario Label

A small visual label:

```text
SCENARIO
```

can immediately communicate that this is different from a normal question.

Example:

```text
┌──────────────────────────────────────────────┐
│ SCENARIO                                     │
│                                              │
│ A developer notices unexpected mutation...  │
└──────────────────────────────────────────────┘
```

Then:

```text
QUESTION

What should the developer investigate first?
```

---

# 67. QZ6 Result Design

Correct:

```text
┌──────────────────────────────────────────────┐
│ ✓ Correct                                    │
│                                              │
│ The list is mutable and both variables can   │
│ reference the same object.                   │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

Incorrect:

```text
┌──────────────────────────────────────────────┐
│ ✕ Incorrect                                  │
│                                              │
│ `b = a` does not create an independent copy. │
│ Both variables can reference the same list.  │
│                                              │
│                  [ Continue → ]              │
└──────────────────────────────────────────────┘
```

---

# 68. QZ6 Error State

Question loading:

```text
Unable to load this scenario.

[ Retry ]
```

Submission:

```text
Your answer could not be submitted.

[ Retry Submission ]
```

Assessment failure:

```text
We couldn't evaluate your answer.

Please try again.
```

The UI must distinguish **technical failure** from **incorrect answer**.

---

# 69. QZ6 Minimal Architecture

```text
Tutorial Content
      │
      ▼
QuizBlock
      │
      │ version = QZ6
      │ questionId
      ▼
Assessment Engine
      │
      ├── Scenario
      ├── Question
      ├── Response
      ├── Evaluation
      ├── Score
      ├── Attempt
      └── Result
```

---

# 70. QZ6 Final Technical Specification

| Area                             | QZ6 Decision                   |
| -------------------------------- | ------------------------------ |
| **Block**                        | **QuizBlock**                  |
| **Version**                      | **QZ6**                        |
| **Presentation**                 | **Scenario Quiz**              |
| **Primary purpose**              | Apply knowledge to a situation |
| **Question count**               | One assessment item            |
| **Scenario context**             | Yes                            |
| **Decision/problem context**     | Yes                            |
| **Response type**                | Assessment-defined             |
| **Single select**                | ✅                              |
| **Multiple select**              | ✅ if assessment supports it    |
| **True/False**                   | ✅ if assessment supports it    |
| **Text response**                | ✅ if assessment supports it    |
| **Code in scenario**             | ✅                              |
| **Code execution**               | ❌                              |
| **Question ownership**           | Existing Assessment Engine     |
| **Correct answer**               | Existing Assessment Engine     |
| **Evaluation**                   | Existing Assessment Engine     |
| **Scoring**                      | Existing Assessment Engine     |
| **Attempts**                     | Existing Assessment Engine     |
| **Mastery**                      | Existing Assessment Engine     |
| **Assessment analytics**         | Existing Assessment Engine     |
| **Tutorial analytics**           | Tutorial Engine                |
| **Local scoring**                | ❌                              |
| **Local correctness evaluation** | ❌                              |
| **Local question bank**          | ❌                              |
| **Question duplication**         | ❌                              |
| **Code sandbox**                 | ❌                              |
| **Authentication**               | Existing platform auth         |
| **Authorization**                | Existing assessment rules      |
| **Retry**                        | Assessment policy              |
| **Feedback**                     | Assessment result              |
| **Explanation**                  | Assessment content/result      |
| **Accessibility**                | ✅                              |
| **Keyboard navigation**          | ✅                              |
| **Responsive**                   | ✅                              |
| **Light theme**                  | ✅                              |
| **Primary**                      | **#F54A8D**                    |
| **Secondary**                    | **#0B1B3D**                    |
| **Gradient**                     | ❌                              |
| **Dark overall theme**           | ❌                              |
| **JSON-driven**                  | ✅                              |

---

# 71. QZ6 Final Mental Model

```text
                         QZ6
                   SCENARIO QUIZ
                          │
                          ▼
                      CONTEXT
                          │
                          ▼
                       PROBLEM
                          │
                          ▼
                      QUESTION
                          │
                          ▼
                    LEARNER THINKS
                          │
                          ▼
                     ANSWER
                          │
                          ▼
                       SUBMIT
                          │
                          ▼
                EXISTING ASSESSMENT
                      ENGINE
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Evaluate       Score       Attempt
             │            │            │
             └────────────┼────────────┘
                          ▼
                        RESULT
                          │
                          ▼
                    QZ6 FEEDBACK
                          │
                          ▼
                  TUTORIAL PROGRESS
```

The central idea is:

> **QZ6 tests whether the learner can apply a learned concept to a realistic technical situation, rather than merely recall a definition or predict a simple code output.**

---

# 72. QuizBlock Progress

```text
QZ1 — Single Question
        ↓
QZ2 — Multiple Choice
        ↓
QZ3 — Multiple Select
        ↓
QZ4 — True / False
        ↓
QZ5 — Code Output Quiz
        ↓
QZ6 — Scenario Quiz
        ↓
QZ7 — Adaptive Quiz
        ↓
QZ8 — Complete Topic Quiz
```

## **QZ6 — Scenario Quiz: COMPLETE** ✅

The next committed version is:

> **QZ7 — Adaptive Quiz**



```python

```

# BLOCK 16 — QuizBlock

## QZ7 — Adaptive Quiz

Yes. We continue with **only QZ7**, one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| QZ1     | Single Question     | ✅ Complete     |
| QZ2     | Multiple Choice     | ✅ Complete     |
| QZ3     | Multiple Select     | ✅ Complete     |
| QZ4     | True / False        | ✅ Complete     |
| QZ5     | Code Output Quiz    | ✅ Complete     |
| QZ6     | Scenario Quiz       | ✅ Complete     |
| **QZ7** | **Adaptive Quiz**   | 🔵 **CURRENT** |
| QZ8     | Complete Topic Quiz | ⏳              |

The architectural rule remains locked:

> **QZ7 is a presentation/orchestration mode inside QuizBlock. It must reuse the existing Assessment Engine and its question pool, difficulty, mastery, attempt, scoring, and analytics capabilities. The Tutorial Engine must not create a second adaptive-assessment engine.**

---

# 1. What Is QZ7 — Adaptive Quiz?

An **Adaptive Quiz** changes the next question based on the learner's previous performance.

Instead of:

```text
Q1
 ↓
Q2
 ↓
Q3
 ↓
Q4
```

where everyone receives the same sequence, QZ7 behaves more like:

```text
Q1
 ↓
Evaluate
 ↓
┌───────────────┐
│ Performance   │
└───────┬───────┘
        │
   ┌────┴────┐
   ▼         ▼
Strong     Weak
   │         │
   ▼         ▼
Harder    Easier
Question  Question
```

The core principle is:

> **The next assessment item is influenced by the learner's demonstrated performance.**

---

# 2. Why QZ7 Exists

The previous QuizBlock versions primarily define **how a question is presented**.

QZ7 introduces a different dimension:

> **How the assessment sequence responds to the learner.**

For example:

```text
QZ5
Code Output
```

asks:

> What will this code print?

QZ6:

```text
Scenario
```

asks:

> What should the developer do?

QZ7:

```text
Adaptive
```

asks:

> What question should this learner receive next based on what we now know about their performance?

---

# 3. QZ7 Is Not Just "Random Questions"

Random:

```text
Q1
 ↓
Random Q
 ↓
Random Q
 ↓
Random Q
```

Adaptive:

```text
Q1
 ↓
Performance
 ↓
Select next question
 ↓
Performance
 ↓
Select next question
```

Therefore:

```text
Randomization ≠ Adaptation
```

---

# 4. QZ7 Is Not a New Assessment Engine

This is critical.

Do **not** build:

```text
Tutorial Adaptive Engine
```

separate from:

```text
Existing Assessment Engine
```

Instead:

```text
Tutorial Engine
      ↓
QuizBlock
      ↓
QZ7
      ↓
Existing Assessment Engine
      ↓
Adaptive assessment capability
```

The Assessment Engine remains authoritative.

---

# 5. QZ7 High-Level Architecture

```text
                    TUTORIAL ENGINE
                          │
                          ▼
                    ┌──────────┐
                    │ QuizBlock│
                    │   QZ7    │
                    └────┬─────┘
                         │
                         ▼
                EXISTING ASSESSMENT
                      ENGINE
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Question Pool   Performance     Mastery
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Next Question
                         │
                         ▼
                      Learner
```

---

# 6. QZ7 Core Flow

```text
START
  ↓
Load Adaptive Assessment
  ↓
Select Initial Question
  ↓
Present Question
  ↓
Learner Answers
  ↓
Assessment Engine Evaluates
  ↓
Update Performance
  ↓
Determine Next Question
  ↓
Present Next Question
  ↓
Repeat
  ↓
Adaptive Completion Rule
  ↓
Final Result
```

---

# 7. QZ7 Example

Suppose the topic is:

> Python Lists

The system starts with:

```text
Q1 — Beginner
```

Learner answers correctly.

The engine determines:

```text
Performance → Strong
```

Next:

```text
Q2 — Intermediate
```

Learner gets it wrong.

The engine determines:

```text
Performance → Needs reinforcement
```

Next:

```text
Q3 — Beginner / foundational
```

Learner answers correctly.

Next:

```text
Q4 — Intermediate
```

This produces a personalized path.

---

# 8. QZ7 Example Flow

```text
Q1
"How do you create a list?"
        │
        ▼
     Correct
        │
        ▼
Q2
"Which operation modifies a list?"
        │
        ▼
     Correct
        │
        ▼
Q3
"Predict this list mutation"
        │
        ▼
    Incorrect
        │
        ▼
Q4
"Understand append()"
        │
        ▼
     Correct
        │
        ▼
Q5
"Predict mutation with aliases"
```

Notice:

> Q4 exists because Q3 revealed a weakness.

---

# 9. QZ7 Adaptive Dimension

Adaptation can occur based on:

```text
Difficulty
Topic
Skill
Concept
Previous correctness
Attempt history
Mastery
Response pattern
```

The exact adaptation algorithm belongs to the Assessment Engine.

QZ7 consumes the resulting next-question decision.

---

# 10. QZ7 Difficulty Adaptation

The simplest adaptive model:

```text
Correct
  ↓
Increase difficulty

Incorrect
  ↓
Decrease difficulty
```

For example:

```text
Beginner
   ↓ correct
Intermediate
   ↓ correct
Advanced
   ↓ incorrect
Intermediate
```

This is the simplest form of adaptation.

---

# 11. QZ7 Should Not Hard-Code Difficulty Logic

Avoid implementing this inside the Tutorial Engine:

```text
if correct:
    difficulty += 1
else:
    difficulty -= 1
```

That would create assessment logic inside Tutorial Engine.

Instead:

```text
Tutorial QZ7
     ↓
Submit Answer
     ↓
Assessment Engine
     ↓
Evaluate
     ↓
Adaptive Decision
     ↓
Next Question
```

---

# 12. QZ7 Question Pool

Adaptive assessment requires a pool of eligible questions.

Conceptually:

```text
Python Lists
│
├── Beginner
│   ├── Q1
│   ├── Q2
│   └── Q3
│
├── Intermediate
│   ├── Q4
│   ├── Q5
│   └── Q6
│
└── Advanced
    ├── Q7
    ├── Q8
    └── Q9
```

The Assessment Engine selects from this pool.

---

# 13. QZ7 Topic Adaptation

Adaptation does not have to mean only difficulty.

Suppose a learner performs poorly on:

```text
List Slicing
```

but performs well on:

```text
List Mutation
```

The next question can focus on:

```text
List Slicing
```

rather than simply becoming "easier."

This is a more meaningful form of adaptation.

---

# 14. QZ7 Skill Adaptation

A question can be associated with:

```text
Topic
Skill
Subskill
Difficulty
```

For example:

```text
Python Lists
   ↓
Mutation
   ↓
Aliasing
```

If the learner struggles with aliasing:

```text
Next question
→ aliasing-focused
```

This supports targeted remediation.

---

# 15. QZ7 Conceptual Adaptation

Example:

```text
Q1
Variable references object
       ↓
Incorrect
       ↓
Q2
Basic reference model
       ↓
Correct
       ↓
Q3
Mutation through alias
```

The system can move from:

```text
foundational concept
```

to:

```text
applied concept
```

based on performance.

---

# 16. QZ7 Remediation Path

A learner makes a mistake:

```text
Q1
Shared references
     ↓
Incorrect
```

Instead of immediately giving another difficult question:

```text
Q2
Advanced aliasing
```

the adaptive system may select:

```text
Q2
Basic reference model
```

Then:

```text
Q2 → Correct
```

and later:

```text
Q3
Applied mutation scenario
```

This creates a remediation loop.

---

# 17. QZ7 Advancement Path

The opposite can happen.

```text
Q1 → Correct
Q2 → Correct
Q3 → Correct
```

The engine may determine:

```text
Learner demonstrates mastery
```

and move to:

```text
Advanced question
```

or even skip easier questions.

---

# 18. QZ7 Avoids Wasting Learner Time

If a learner consistently demonstrates mastery:

```text
Easy
 ↓
Easy
 ↓
Easy
 ↓
Easy
```

is inefficient.

Adaptive assessment can instead move toward:

```text
Easy
 ↓
Intermediate
 ↓
Advanced
```

This makes the assessment more efficient.

---

# 19. QZ7 Avoids Overloading Struggling Learners

If a learner repeatedly fails:

```text
Advanced
 ↓
Incorrect
 ↓
Advanced
 ↓
Incorrect
```

the adaptive system should not blindly continue.

It can instead:

```text
Advanced
 ↓
Incorrect
 ↓
Intermediate
 ↓
Incorrect
 ↓
Foundational
```

The exact policy belongs to the Assessment Engine.

---

# 20. QZ7 Example — Python Exception Handling

Initial:

```text
Q1 — What is an exception?
```

Correct.

Next:

```text
Q2 — Predict exception type
```

Correct.

Next:

```text
Q3 — Exception propagation scenario
```

Incorrect.

Adaptive response:

```text
Q4 — Basic propagation concept
```

Correct.

Then:

```text
Q5 — Caller/callee propagation scenario
```

The system has identified a specific weakness rather than simply lowering overall difficulty.

---

# 21. QZ7 Example — OOP

Initial:

```text
Q1 — What is inheritance?
```

Correct.

```text
Q2 — Method overriding
```

Correct.

```text
Q3 — MRO
```

Incorrect.

Then:

```text
Q4 — Basic MRO ordering
```

rather than another advanced MRO question.

This is targeted adaptation.

---

# 22. QZ7 Example — Memory

```text
Q1
Variable → Object
       ↓
Correct

Q2
Reference sharing
       ↓
Incorrect

Q3
Basic reference diagram
       ↓
Correct

Q4
Mutation through alias
       ↓
Correct

Q5
Identity vs equality
```

The assessment path reflects demonstrated understanding.

---

# 23. QZ7 Question Presentation

The individual question displayed by QZ7 can use existing QuizBlock presentation styles.

For example:

```text
QZ7
 ↓
Current Assessment Item
 ↓
QZ2-style Multiple Choice
```

or:

```text
QZ7
 ↓
Current Assessment Item
 ↓
QZ5-style Code Output
```

or:

```text
QZ7
 ↓
Current Assessment Item
 ↓
QZ6-style Scenario
```

This is an important architectural insight.

---

# 24. QZ7 Is an Adaptive Orchestration Layer

Conceptually:

```text
QZ7
 │
 ├── Question 1
 │     └── QZ2 presentation
 │
 ├── Question 2
 │     └── QZ5 presentation
 │
 ├── Question 3
 │     └── QZ6 presentation
 │
 └── Question 4
       └── QZ4 presentation
```

The exact supported combinations depend on the Assessment Engine contract.

But the important idea is:

> **QZ7 controls the adaptive journey; individual question presentation can remain assessment-driven.**

---

# 25. QZ7 and Existing Quiz Versions

Conceptually:

```text
                    QUIZBLOCK
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Fixed          Fixed          Adaptive
     QZ1-QZ6          ...             QZ7
                                      │
                                      ▼
                              Assessment Engine
                                      │
                                      ▼
                              Next Question
```

QZ1–QZ6 can follow predetermined content.

QZ7 determines the path dynamically.

---

# 26. QZ7 Adaptive Session

An adaptive quiz should have an assessment session.

Conceptually:

```text
Adaptive Session
│
├── Session ID
├── Topic / Scope
├── Current Question
├── Questions Attempted
├── Performance State
├── Adaptation State
└── Completion State
```

The authoritative session should live in the Assessment system.

---

# 27. QZ7 Minimal Tutorial JSON

```json
{
  "type": "quiz",
  "version": "QZ7",
  "assessmentId": "adaptive_python_lists_01"
}
```

Notice that QZ7 may reference an **assessment/session definition**, rather than a single question.

That is because the next question is dynamic.

---

# 28. QZ7 Why It May Need assessmentId Instead of questionId

For QZ1–QZ6:

```text
questionId
```

is usually enough because the content is known.

For QZ7:

```text
assessmentId
```

is more appropriate conceptually:

```text
QZ7
 ↓
Adaptive Assessment
 ↓
Question 1
 ↓
Question 2
 ↓
Question 3
```

The Assessment Engine controls the sequence.

---

# 29. QZ7 Configuration

Conceptually:

```json
{
  "type": "quiz",
  "version": "QZ7",
  "assessmentId": "adaptive_python_lists_01",
  "presentation": {
    "showProgress": true,
    "showFeedback": true,
    "allowRetry": false
  }
}
```

These presentation settings do not define the adaptation algorithm.

---

# 30. QZ7 Adaptive Configuration

The Assessment Engine might conceptually own:

```text
Adaptive Assessment
├── Question Pool
├── Topic Scope
├── Difficulty Range
├── Selection Rules
├── Stopping Rules
├── Mastery Rules
└── Attempt Rules
```

QZ7 should not duplicate these.

---

# 31. QZ7 Starting Question

The adaptive engine needs an initial question.

Possible strategies include:

```text
Baseline difficulty
Diagnostic question
Previous mastery
Topic prerequisite
Randomized eligible question
```

The actual strategy belongs to the Assessment Engine.

QZ7 simply requests the next item.

---

# 32. QZ7 Next Question Request

Conceptually:

```text
QZ7
 ↓
Assessment API
 ↓
"Give me the next question"
 ↓
Assessment Engine
 ↓
Selects question
 ↓
Returns question
```

The Tutorial Engine does not decide:

```text
"Give me an intermediate question because the learner got the previous one right."
```

That logic remains centralized.

---

# 33. QZ7 Submission Flow

```text
Learner
   ↓
QZ7 Question
   ↓
Answer
   ↓
Submit
   ↓
Assessment API
   ↓
Evaluate
   ↓
Update learner performance
   ↓
Adaptive selection
   ↓
Next question
   ↓
QZ7 renders it
```

---

# 34. QZ7 Adaptive Loop

```text
┌──────────────────────┐
│ Get Next Question    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Present Question     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Learner Answers      │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Assessment Evaluation│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Update Performance   │
└──────────┬───────────┘
           ↓
     ┌─────┴─────┐
     ▼           ▼
 Continue       Stop
     │
     ▼
Get Next Question
```

---

# 35. QZ7 Stopping Rule

An adaptive quiz needs a completion condition.

Possible conditions:

```text
Maximum questions reached
Mastery achieved
Minimum confidence achieved
Maximum attempts reached
Assessment time exhausted
Question pool exhausted
```

The Assessment Engine should own the authoritative stopping rule.

---

# 36. QZ7 Example — Mastery Stopping

Suppose:

```text
Required mastery = 80%
```

Learner progresses:

```text
Q1 → Correct
Q2 → Correct
Q3 → Correct
Q4 → Correct
```

The engine determines:

```text
Mastery achieved
```

and finishes the adaptive assessment.

The learner does not need to answer unnecessary additional questions.

---

# 37. QZ7 Example — Maximum Questions

Configuration:

```text
Maximum questions = 10
```

The system may stop after:

```text
Q1
Q2
Q3
...
Q10
```

even if the learner has not achieved complete mastery.

---

# 38. QZ7 Progress Indicator

Because the total path may be dynamic, avoid misleading UI such as:

```text
Question 4 of 10
```

unless the assessment engine actually guarantees a fixed maximum of 10.

Better:

```text
Question 4
```

or:

```text
Progress
████████░░░░
```

if the assessment engine provides meaningful progress information.

---

# 39. QZ7 Adaptive Progress

Possible UI:

```text
┌──────────────────────────────────────────────┐
│ ADAPTIVE QUIZ                                │
│                                              │
│ Python Lists                                 │
│                                              │
│ Question 4                                   │
│                                              │
│ ███████████░░░░░                             │
│                                              │
│ Your next question is selected based on      │
│ your performance.                             │
└──────────────────────────────────────────────┘
```

This makes the adaptive nature explicit.

---

# 40. QZ7 Should We Tell the Learner It Is Adaptive?

Yes, preferably.

For example:

> **Adaptive Quiz**
> Questions adjust based on your responses.

This establishes the learner expectation.

Avoid exposing the internal algorithm:

```text
"You got Q3 wrong, so we reduced your difficulty from 0.62 to 0.48."
```

That is implementation detail.

---

# 41. QZ7 Adaptive Experience

The learner should feel:

```text
"Questions are responding to my understanding."
```

not:

```text
"The system is randomly changing questions."
```

---

# 42. QZ7 Result

At completion:

```text
┌──────────────────────────────────────────────┐
│ ADAPTIVE QUIZ COMPLETE                       │
│                                              │
│ Topic: Python Lists                          │
│                                              │
│ Questions answered: 8                        │
│ Mastery: 84%                                 │
│                                              │
│ Strong areas                                 │
│ • Indexing                                   │
│ • Mutation                                   │
│                                              │
│ Needs review                                 │
│ • Aliasing                                   │
│                                              │
│ [ Review Weak Areas ]                        │
│ [ Continue Tutorial ]                        │
└──────────────────────────────────────────────┘
```

The exact analytics come from the Assessment Engine.

---

# 43. QZ7 Result Must Not Invent Mastery

QZ7 should not calculate:

```text
mastery = correct / attempted
```

inside the Tutorial Engine if the platform already has a centralized mastery model.

Instead:

```text
Assessment Engine
 ↓
Mastery
 ↓
QZ7 Result
```

This keeps analytics consistent across:

```text
Tutorial
Practice
Exam
Adaptive Quiz
```

---

# 44. QZ7 Personalized Result

The result can expose:

```text
Strong Areas
Weak Areas
Recommended Review
Questions Attempted
Accuracy
Mastery
```

when supported by the existing analytics/assessment architecture.

---

# 45. QZ7 Recommended Review

If the Assessment Engine identifies:

```text
Weak skill:
List Aliasing
```

the Tutorial Engine can potentially route the learner to:

```text
Tutorial section:
Reference Model
```

or:

```text
MistakeBlock
```

or:

```text
SummaryBlock
```

This creates a powerful adaptive-learning loop.

---

# 46. QZ7 Tutorial Integration

Potential flow:

```text
Tutorial
   ↓
QZ7 Adaptive Quiz
   ↓
Weakness identified
   ↓
Assessment Result
   ↓
Tutorial Engine
   ↓
Recommended learning block
```

For example:

```text
QZ7
 ↓
Weak: Object References
 ↓
Navigate to:
MemoryBlock M3
Reference Model
```

---

# 47. QZ7 Adaptive Learning Loop

```text
LEARN
  ↓
ASSESS
  ↓
IDENTIFY WEAKNESS
  ↓
REMEDIATE
  ↓
REASSESS
  ↓
MASTER
```

This is one of the strongest reasons to have QZ7.

---

# 48. QZ7 and MistakeBlock

Suppose the learner repeatedly gets aliasing questions wrong.

The system could recommend:

```text
MistakeBlock
MT4 — Common Beginner Mistakes
```

Example:

> **Mistake:** Assuming `b = a` creates a copy.

Then:

```text
QZ7
 ↓
Reassess
```

This creates a closed learning loop.

---

# 49. QZ7 and SummaryBlock

If the learner struggles broadly with a topic:

```text
QZ7
 ↓
Weak performance
 ↓
S6 Complete Revision
 ↓
QZ7 again
```

The SummaryBlock becomes remediation content rather than simply an end-of-topic summary.

---

# 50. QZ7 and BestPracticeBlock

For engineering topics:

```text
QZ7
 ↓
Weak design decisions
 ↓
BP6 Industry / FAANG Practices
 ↓
QZ7 reassessment
```

This moves learning from:

```text
knowledge
```

to:

```text
professional judgment
```

---

# 51. QZ7 and ExerciseBlock

If the learner cannot apply a concept:

```text
QZ7
 ↓
Weakness detected
 ↓
EX5 Guided Exercise
 ↓
QZ7
```

This creates:

```text
Assessment
 → Practice
 → Assessment
```

---

# 52. QZ7 and TaskBlock

For higher-level learning:

```text
QZ7
 ↓
Weak implementation reasoning
 ↓
T6 Implementation Task
 ↓
QZ7
```

Again, QZ7 does not execute the task; it assesses the learner's understanding around it.

---

# 53. QZ7 Adaptive Question Types

An adaptive assessment can potentially select different question forms:

```text
Q1 → QZ2-style
Q2 → QZ5-style
Q3 → QZ6-style
Q4 → QZ4-style
```

For example:

```text
Q1
Multiple Choice
 ↓
Correct

Q2
Code Output
 ↓
Incorrect

Q3
Scenario
 ↓
Correct
```

The Assessment Engine decides what is appropriate.

---

# 54. QZ7 Should Not Create Presentation Duplication

The same renderer architecture can be reused:

```text
QuizBlock
├── QZ1Renderer
├── QZ2Renderer
├── QZ3Renderer
├── QZ4Renderer
├── QZ5Renderer
├── QZ6Renderer
└── QZ7Renderer
```

QZ7Renderer orchestrates the adaptive session.

It does not duplicate:

```text
assessment evaluation
question database
scoring
mastery
```

---

# 55. QZ7 State Machine

```text
┌──────────────┐
│ INITIALIZING │
└──────┬───────┘
       ↓
┌──────────────┐
│ READY        │
└──────┬───────┘
       ↓
┌──────────────┐
│ QUESTION     │
└──────┬───────┘
       ↓
┌──────────────┐
│ ANSWERING    │
└──────┬───────┘
       ↓
┌──────────────┐
│ SUBMITTING   │
└──────┬───────┘
       ↓
┌──────────────┐
│ EVALUATING   │
└──────┬───────┘
       ↓
   ┌───┴────┐
   ▼        ▼
NEXT      COMPLETE
   │        │
   ▼        ▼
QUESTION   RESULT
```

---

# 56. QZ7 Session Recovery

Adaptive assessments may be longer than normal single-question blocks.

Therefore, if the learner refreshes the page:

```text
Browser refresh
      ↓
Load adaptive assessment session
      ↓
Assessment Engine
      ↓
Restore current state
      ↓
Continue
```

The Tutorial Engine should not reconstruct the adaptive state from local browser storage.

The server-side assessment session should remain authoritative.

---

# 57. QZ7 Browser State

Temporary UI state can remain local:

```text
selectedOption
inputValue
loading
error
```

But authoritative state should remain server-side:

```text
currentQuestion
attempt
performance
adaptation state
completion
score
```

---

# 58. QZ7 Authentication

Existing platform authentication:

```text
User Session
    ↓
Assessment Session
    ↓
QZ7
```

No new authentication system.

---

# 59. QZ7 Authorization

Existing assessment authorization applies:

```text
User
 ↓
Tutorial Access
 ↓
Assessment Permission
 ↓
Adaptive Assessment
```

---

# 60. QZ7 Security

The client should not control:

```text
nextQuestionId
difficulty
mastery
score
correctAnswer
adaptiveDecision
```

For example, avoid trusting:

```json
{
  "nextQuestionId": "advanced_question"
}
```

sent by the browser.

The Assessment Engine should determine the next question.

---

# 61. QZ7 Client Flow

```text
Browser
   │
   │ Start adaptive assessment
   ▼
Assessment API
   │
   │ session
   ▼
QZ7
   │
   │ render current question
   ▼
Learner
   │
   │ answer
   ▼
Assessment API
   │
   │ evaluate + adapt
   ▼
Next question
   │
   ▼
QZ7
```

---

# 62. QZ7 API Concept

Conceptually:

```text
POST /assessment/sessions
```

starts the assessment.

Then:

```text
GET /assessment/sessions/{sessionId}/current
```

gets the current question.

Then:

```text
POST /assessment/sessions/{sessionId}/responses
```

submits the answer.

The exact endpoints must follow your existing API architecture.

These are conceptual examples, not new endpoint requirements.

---

# 63. QZ7 Assessment Engine Responsibilities

The Assessment Engine should own:

```text
Question pool
Question selection
Difficulty
Adaptive algorithm
Answer evaluation
Scoring
Attempts
Mastery
Stopping rule
Session state
Analytics
```

---

# 64. QZ7 Tutorial Engine Responsibilities

The Tutorial Engine should own:

```text
Block rendering
QZ7 presentation
Tutorial navigation
Tutorial progress
Loading state
Error state
Feedback presentation
Integration with tutorial flow
```

This maintains the existing architecture boundary.

---

# 65. QZ7 Does Not Own

```text
❌ Question bank
❌ Correct answers
❌ Scoring algorithm
❌ Adaptive algorithm
❌ Mastery algorithm
❌ Assessment attempts
❌ Assessment session authority
❌ Exam engine
```

---

# 66. QZ7 Analytics

A strong adaptive assessment can record:

```text
Question sequence
Question difficulty
Correctness
Attempt count
Time
Skill
Topic
Mastery progression
```

For example:

```text
Learner
 ↓
Q1 Beginner → Correct
 ↓
Q2 Intermediate → Correct
 ↓
Q3 Advanced → Incorrect
 ↓
Q4 Intermediate → Correct
 ↓
Q5 Advanced → Correct
```

This sequence itself can become valuable analytics.

---

# 67. QZ7 Adaptive Path Analytics

The system can understand:

```text
Starting level
Peak difficulty reached
Weakness encountered
Recovery
Final mastery
```

Example:

```text
Starting:
Beginner

Peak:
Advanced

Weakness:
Aliasing

Recovery:
Intermediate → Advanced

Final:
Mastery achieved
```

---

# 68. QZ7 Learner Experience

The UI should avoid exposing too much internal logic.

Good:

> **The next question is selected based on your performance.**

Less useful:

> Your Bayesian ability estimate has changed from 0.63 to 0.71.

The latter is assessment infrastructure, not learner-facing education.

---

# 69. QZ7 Adaptive Progress Message

While loading the next question:

```text
Analyzing your response...
```

Then:

```text
Next question
```

This can make the adaptive transition understandable.

---

# 70. QZ7 Loading State

```text
┌──────────────────────────────────────────────┐
│ ADAPTIVE QUIZ                                │
│                                              │
│ Analyzing your response...                   │
│                                              │
│ Preparing your next question.                │
└──────────────────────────────────────────────┘
```

---

# 71. QZ7 Error State

```text
┌──────────────────────────────────────────────┐
│ We couldn't load your next question.         │
│                                              │
│ Your previous answer has been saved.         │
│                                              │
│ [ Try Again ]                                │
└──────────────────────────────────────────────┘
```

This is particularly important because the learner's previous answer should not be lost merely because next-question retrieval failed.

---

# 72. QZ7 Completion State

```text
┌──────────────────────────────────────────────┐
│ ADAPTIVE QUIZ COMPLETE                       │
│                                              │
│ Your adaptive assessment is complete.        │
│                                              │
│ [ View Results ]                             │
│ [ Continue Tutorial ]                        │
└──────────────────────────────────────────────┘
```

---

# 73. QZ7 Accessibility

The adaptive transition should be announced appropriately.

For example:

```text
Current question completed.

Next question is ready.
```

The focus should move predictably to the new question without trapping keyboard users.

---

# 74. QZ7 Responsive Design

Desktop:

```text
┌──────────────────────────────────────────────┐
│ ADAPTIVE QUIZ                                │
│ Python Lists                                 │
│                                              │
│ Question 4                                   │
│                                              │
│ Scenario / Code / Question                   │
│                                              │
│ ○ Answer A                                   │
│ ○ Answer B                                   │
│ ○ Answer C                                   │
│ ○ Answer D                                   │
│                                              │
│              [ Submit Answer ]               │
└──────────────────────────────────────────────┘
```

Mobile:

```text
┌─────────────────────────────┐
│ ADAPTIVE QUIZ               │
│ Python Lists                │
│                             │
│ Question 4                  │
│                             │
│ Scenario                    │
│ ┌─────────────────────────┐ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ ○ Answer A                  │
│ ○ Answer B                  │
│ ○ Answer C                  │
│ ○ Answer D                  │
│                             │
│ [ Submit Answer ]           │
└─────────────────────────────┘
```

---

# 75. QZ7 Visual Design

Use the established Tutorial Engine design system:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Recommended:

* light overall interface
* dark-blue heading
* white assessment card
* pink primary action
* subtle progress indicator
* clear "Adaptive Quiz" badge
* soft shadows
* readable answer controls
* no gradients
* no dark overall theme

---

# 76. QZ7 Adaptive Badge

A small badge can communicate:

```text
ADAPTIVE
```

Example:

```text
┌────────────────────────────────────┐
│ ADAPTIVE QUIZ                      │
│                                    │
│ Questions adjust to your responses │
└────────────────────────────────────┘
```

This distinguishes QZ7 from fixed-sequence QuizBlock versions.

---

# 77. QZ7 JSON

A clean conceptual definition:

```json
{
  "type": "quiz",
  "version": "QZ7",
  "assessmentId": "adaptive_python_lists_01"
}
```

Optional presentation:

```json
{
  "type": "quiz",
  "version": "QZ7",
  "assessmentId": "adaptive_python_lists_01",
  "presentation": {
    "showAdaptiveLabel": true,
    "showProgress": true,
    "showFeedback": true
  }
}
```

---

# 78. QZ7 Composer

The Composer should look conceptually like:

```text
┌──────────────────────────────────────────────┐
│ QuizBlock                                    │
│                                              │
│ Version                                      │
│ [ QZ7 — Adaptive Quiz ▼ ]                   │
│                                              │
│ Adaptive Assessment                          │
│ [ Search assessment... ]                     │
│                                              │
│ Selected                                     │
│ adaptive_python_lists_01                    │
│                                              │
│ Scope                                        │
│ Python Lists                                 │
│                                              │
│ Preview                                      │
│ ──────────────────────────────────────────── │
│ ADAPTIVE QUIZ                                │
│                                              │
│ Questions will adjust based on learner       │
│ performance.                                 │
└──────────────────────────────────────────────┘
```

---

# 79. QZ7 Composer Should Not Configure the Algorithm Locally

Avoid putting tutorial-level logic such as:

```text
If correct → harder
If incorrect → easier
```

inside the JSON.

Instead:

```text
Adaptive Assessment
      ↓
Assessment Engine Configuration
```

The Composer selects the adaptive assessment.

---

# 80. QZ7 Configuration Ownership

### Tutorial Composer

```text
Which adaptive assessment?
How is it presented?
```

### Assessment Engine

```text
Which question next?
How difficult?
Why?
When to stop?
What is mastery?
```

This separation is essential.

---

# 81. QZ7 Example End-to-End

Topic:

> Python Object References

Start:

```text
Q1
What does assignment do?
```

Correct.

Assessment Engine:

```text
Move toward applied concept.
```

Q2:

```text
a = [1,2]
b = a
```

Predict behavior.

Correct.

Q3:

```text
Production scenario:
A function mutates a passed list.
Why does the caller see the change?
```

Incorrect.

Assessment Engine:

```text
Weakness detected:
Reference sharing
```

Q4:

```text
Foundational reference question
```

Correct.

Q5:

```text
Mutation scenario
```

Correct.

Q6:

```text
Advanced identity/equality question
```

The assessment has adapted to the learner.

---

# 82. QZ7 Full Adaptive Learning Loop

```text
              ┌─────────────────────┐
              │     LEARNER         │
              └──────────┬──────────┘
                         │
                         ▼
                ┌─────────────────┐
                │      QZ7        │
                │ Adaptive Quiz   │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Assessment      │
                │ Engine          │
                └────────┬────────┘
                         │
                  Evaluate answer
                         │
                         ▼
                Update performance
                         │
                         ▼
                 Select next item
                         │
                         ▼
                      QZ7
                         │
                         └──────────────┐
                                        │
                                        ▼
                                   Next Question
```

---

# 83. QZ7 Tutorial-Level Remediation

A complete learning loop can be:

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

This is much more powerful than simply presenting a fixed quiz at the end.

---

# 84. QZ7 Security Boundary

The client should never be the authority for:

```text
correctAnswer
score
mastery
difficulty
nextQuestion
completion
```

Instead:

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

---

# 85. QZ7 Final Technical Specification

| Area                                      | QZ7 Decision                                  |
| ----------------------------------------- | --------------------------------------------- |
| **Block**                                 | **QuizBlock**                                 |
| **Version**                               | **QZ7**                                       |
| **Presentation**                          | **Adaptive Quiz**                             |
| **Primary purpose**                       | Personalize assessment path                   |
| **Sequence**                              | Dynamic                                       |
| **Question selection**                    | Existing Assessment Engine                    |
| **Question pool**                         | Existing Assessment Engine                    |
| **Difficulty adaptation**                 | Existing Assessment Engine                    |
| **Skill adaptation**                      | Existing Assessment Engine                    |
| **Topic adaptation**                      | Existing Assessment Engine                    |
| **Mastery**                               | Existing Assessment Engine                    |
| **Stopping rule**                         | Existing Assessment Engine                    |
| **Assessment session**                    | Existing Assessment Engine                    |
| **Scoring**                               | Existing Assessment Engine                    |
| **Attempts**                              | Existing Assessment Engine                    |
| **Analytics**                             | Existing Assessment Engine                    |
| **Tutorial progress**                     | Tutorial Engine                               |
| **UI rendering**                          | Tutorial Engine                               |
| **Question reference**                    | Assessment/session ID                         |
| **Fixed question ID**                     | Usually insufficient as the primary reference |
| **Adaptive algorithm in Tutorial Engine** | ❌                                             |
| **Local scoring**                         | ❌                                             |
| **Local mastery calculation**             | ❌                                             |
| **Local question selection**              | ❌                                             |
| **Local question bank**                   | ❌                                             |
| **Code execution**                        | ❌                                             |
| **Authentication**                        | Existing platform auth                        |
| **Authorization**                         | Existing assessment rules                     |
| **Session recovery**                      | Server-side assessment session                |
| **Responsive**                            | ✅                                             |
| **Accessibility**                         | ✅                                             |
| **Light theme**                           | ✅                                             |
| **Primary**                               | **#F54A8D**                                   |
| **Secondary**                             | **#0B1B3D**                                   |
| **Gradient**                              | ❌                                             |
| **Dark overall theme**                    | ❌                                             |
| **JSON-driven**                           | ✅                                             |

---

# 86. QZ7 Final Mental Model

```text
                         QZ7
                  ADAPTIVE QUIZ
                         │
                         ▼
                  START ASSESSMENT
                         │
                         ▼
                  GET NEXT QUESTION
                         │
                         ▼
                    PRESENT ITEM
                         │
                         ▼
                    LEARNER ANSWERS
                         │
                         ▼
                       SUBMIT
                         │
                         ▼
                EXISTING ASSESSMENT
                      ENGINE
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Evaluate     Score      Performance
             │           │           │
             └───────────┼───────────┘
                         ▼
                 ADAPTIVE DECISION
                         │
                  ┌──────┴──────┐
                  ▼             ▼
               NEXT           STOP
              QUESTION        QUIZ
                  │             │
                  ▼             ▼
                 QZ7          RESULT
```

The central idea is:

> **QZ7 does not merely display a quiz. It provides the Tutorial Engine's presentation layer for an assessment whose next question is dynamically determined by the learner's demonstrated performance.**

---

# 87. QuizBlock Progress

```text
QZ1 — Single Question
        ↓
QZ2 — Multiple Choice
        ↓
QZ3 — Multiple Select
        ↓
QZ4 — True / False
        ↓
QZ5 — Code Output Quiz
        ↓
QZ6 — Scenario Quiz
        ↓
QZ7 — Adaptive Quiz
        ↓
QZ8 — Complete Topic Quiz
```

## **QZ7 — Adaptive Quiz: COMPLETE** ✅

The next and final version is:

> **QZ8 — Complete Topic Quiz**



```python

```

# BLOCK 16 — QuizBlock

## QZ8 — Complete Topic Quiz

Yes. We continue with **only QZ8**, the final version of QuizBlock.

The committed sequence is now:

| Version | Presentation            | Status                 |
| ------- | ----------------------- | ---------------------- |
| QZ1     | Single Question         | ✅ Complete             |
| QZ2     | Multiple Choice         | ✅ Complete             |
| QZ3     | Multiple Select         | ✅ Complete             |
| QZ4     | True / False            | ✅ Complete             |
| QZ5     | Code Output Quiz        | ✅ Complete             |
| QZ6     | Scenario Quiz           | ✅ Complete             |
| QZ7     | Adaptive Quiz           | ✅ Complete             |
| **QZ8** | **Complete Topic Quiz** | 🔵 **CURRENT / FINAL** |

The architectural rule remains locked:

> **QZ8 is the complete-topic assessment presentation/orchestration mode inside QuizBlock. It must reuse the existing Assessment Engine rather than creating a separate topic-quiz engine.**

---

# 1. What Is QZ8 — Complete Topic Quiz?

**QZ8 — Complete Topic Quiz** evaluates the learner's understanding of an **entire topic**, rather than testing one isolated concept.

For example, after completing:

```text
Python Lists
```

the learner may have studied:

```text
Introduction
    ↓
Creating Lists
    ↓
Indexing
    ↓
Slicing
    ↓
Updating
    ↓
append()
    ↓
extend()
    ↓
insert()
    ↓
Deletion
    ↓
Mutation
    ↓
References
    ↓
Memory
    ↓
Time Complexity
```

QZ8 brings the topic together into one formal assessment.

---

# 2. Core Idea

The difference is:

```text
QZ1–QZ7
    ↓
Assess a particular question / interaction / adaptive path
```

while:

```text
QZ8
    ↓
Assess the learner's understanding of the COMPLETE TOPIC
```

The learner should leave QZ8 knowing:

> **"How well do I understand this entire topic?"**

---

# 3. QZ8 Is Not Just "Many QZ2 Questions"

This distinction is important.

A random collection of questions:

```text
Q1
Q2
Q3
Q4
Q5
```

does not automatically become a Complete Topic Quiz.

QZ8 should have:

```text
Topic Scope
    +
Coverage
    +
Assessment Blueprint
    +
Question Selection
    +
Scoring
    +
Topic-Level Result
```

Therefore:

> **QZ8 assesses topic coverage, not merely question quantity.**

---

# 4. QZ8 vs QZ7

### QZ7 — Adaptive Quiz

The next question changes according to learner performance.

```text
Q1
 ↓
Performance
 ↓
Q2 selected dynamically
 ↓
Performance
 ↓
Q3 selected dynamically
```

### QZ8 — Complete Topic Quiz

The assessment is designed to cover the entire topic.

```text
Topic
 ↓
Assessment Blueprint
 ↓
Multiple concepts / skills
 ↓
Question Set
 ↓
Topic-Level Result
```

QZ8 can potentially **use adaptive behavior internally if the Assessment Engine supports it**, but its defining purpose remains:

> **Complete topic assessment.**

---

# 5. QZ8 vs QZ6

QZ6:

> A developer encounters a specific technical situation. What should they do?

QZ8:

> Demonstrate your understanding across the entire topic.

For example:

```text
QZ6
→ Shared reference scenario
```

while:

```text
QZ8
→ Lists:
   indexing
   slicing
   mutation
   references
   methods
   complexity
   memory
   debugging
```

---

# 6. QZ8 vs SummaryBlock

SummaryBlock:

> Review what you learned.

QZ8:

> Prove what you learned.

Therefore:

```text
SummaryBlock
      ↓
Revision
      ↓
QZ8
      ↓
Assessment
```

A strong end-of-topic learning flow is:

```text
Learn
 ↓
Practice
 ↓
Revise
 ↓
Complete Topic Quiz
 ↓
Analyze
 ↓
Remediate
```

---

# 7. QZ8 Complete Topic Flow

```text
┌──────────────────────┐
│ Topic Learning       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Topic Revision       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ QZ8 Complete Topic   │
│ Quiz                 │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Assessment Engine    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Topic-Level Result   │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Mastery / Weakness   │
└──────────────────────┘
```

---

# 8. QZ8 Example — Python Lists

Suppose the topic is:

> **Python Lists**

The Complete Topic Quiz could cover:

```text
1. Creating lists
2. Indexing
3. Negative indexing
4. Slicing
5. Updating
6. append()
7. extend()
8. insert()
9. remove()
10. pop()
11. del
12. slice assignment
13. Mutation
14. Aliasing
15. Copying
16. List memory behavior
17. Time complexity
18. Common mistakes
19. Debugging
20. Best practices
```

The learner's final result should reflect the **topic as a whole**.

---

# 9. QZ8 Assessment Blueprint

This is the most important architectural concept.

The Complete Topic Quiz should ideally be backed by an **assessment blueprint**.

Conceptually:

```text
Python Lists
│
├── Fundamentals
│   ├── Creating Lists
│   └── Accessing Lists
│
├── Indexing
│
├── Slicing
│
├── Mutation
│
├── List Methods
│
├── References
│
├── Memory
│
├── Complexity
│
└── Debugging
```

The Assessment Engine determines how many questions should represent each area.

---

# 10. QZ8 Coverage

Suppose the assessment blueprint requires:

| Area         | Questions |
| ------------ | --------: |
| Fundamentals |         2 |
| Indexing     |         2 |
| Slicing      |         2 |
| Mutation     |         3 |
| Methods      |         3 |
| References   |         2 |
| Complexity   |         2 |
| Debugging    |         2 |
| **Total**    |    **18** |

Now QZ8 genuinely evaluates the topic.

---

# 11. Why Coverage Matters

Imagine a 20-question quiz where:

```text
15 questions → append()
3 questions → indexing
1 question → slicing
1 question → references
```

A learner could score:

```text
90%
```

while still having no understanding of:

```text
slicing
references
```

That is a poor **complete-topic assessment**.

QZ8 should therefore be designed around:

> **coverage, not merely quantity.**

---

# 12. QZ8 Topic Scope

A QZ8 block should identify the assessment scope.

Conceptually:

```json
{
  "type": "quiz",
  "version": "QZ8",
  "assessmentId": "python_lists_complete"
}
```

The `assessmentId` points to the existing assessment definition.

---

# 13. Why QZ8 Should Use assessmentId

Unlike QZ1–QZ6, QZ8 is not fundamentally about one question.

It represents:

```text
Complete Topic Assessment
```

Therefore:

```text
questionId
```

is insufficient as the primary reference.

Instead:

```text
assessmentId
```

is more appropriate.

---

# 14. QZ8 Assessment Engine Responsibilities

The existing Assessment Engine should own:

```text
Topic scope
Question pool
Blueprint
Coverage
Difficulty
Question selection
Question ordering
Evaluation
Scoring
Attempts
Mastery
Analytics
Completion
```

QZ8 only presents and orchestrates the assessment experience.

---

# 15. QZ8 Tutorial Engine Responsibilities

Tutorial Engine owns:

```text
Block rendering
Assessment launch
Question presentation
Navigation UI
Progress UI
Result presentation
Tutorial completion
Tutorial routing
```

It does not own:

```text
Question selection
Scoring
Mastery
Assessment blueprint
```

---

# 16. QZ8 Question Sequence

A simple fixed complete-topic assessment might be:

```text
Q1 → Fundamentals
Q2 → Indexing
Q3 → Slicing
Q4 → Mutation
Q5 → Methods
Q6 → References
Q7 → Complexity
Q8 → Debugging
```

A more sophisticated assessment might randomize questions **within the blueprint constraints**.

The Assessment Engine controls this.

---

# 17. QZ8 Question Types

A Complete Topic Quiz can potentially contain different question presentation types.

For example:

```text
Q1 → QZ2 Multiple Choice
Q2 → QZ4 True / False
Q3 → QZ5 Code Output
Q4 → QZ3 Multiple Select
Q5 → QZ6 Scenario
Q6 → QZ5 Code Output
```

This creates a richer assessment.

The underlying Assessment Engine owns the question definitions.

---

# 18. QZ8 Should Not Become a Monolithic Renderer

Do not build:

```text
QZ8Renderer
 ├── its own MCQ engine
 ├── its own scoring
 ├── its own question database
 ├── its own code quiz system
 └── its own scenario engine
```

Instead:

```text
QZ8
 ↓
Assessment Engine
 ↓
Current Question
 ↓
Appropriate Quiz Presentation
```

This reuses the existing QuizBlock architecture.

---

# 19. QZ8 Presentation Architecture

Conceptually:

```text
                      QZ8
                       │
                       ▼
              Complete Topic
                Assessment
                       │
                       ▼
              Assessment Engine
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
             QZ2      QZ5      QZ6
             MCQ      Code    Scenario
```

This allows QZ8 to combine the strengths of previous versions.

---

# 20. QZ8 Example Question Sequence

```text
┌──────────────────────────────────────────┐
│ Question 1                               │
│ Multiple Choice                          │
└──────────────────────────────────────────┘

        ↓

┌──────────────────────────────────────────┐
│ Question 2                               │
│ True / False                             │
└──────────────────────────────────────────┘

        ↓

┌──────────────────────────────────────────┐
│ Question 3                               │
│ Code Output                              │
└──────────────────────────────────────────┘

        ↓

┌──────────────────────────────────────────┐
│ Question 4                               │
│ Scenario                                 │
└──────────────────────────────────────────┘
```

The learner experiences one unified Complete Topic Quiz.

---

# 21. QZ8 Topic Progress

A fixed assessment can show:

```text
Question 4 of 20
```

If the assessment engine provides a fixed total.

Visual:

```text
Progress
████████░░░░░░░░░░░░
4 / 20
```

If the assessment is dynamic, the UI should only show progress information that the Assessment Engine can guarantee.

---

# 22. QZ8 Topic Header

Recommended:

```text
┌──────────────────────────────────────────────┐
│ COMPLETE TOPIC QUIZ                         │
│                                              │
│ Python Lists                                 │
│                                              │
│ Test your understanding across the entire   │
│ topic.                                      │
└──────────────────────────────────────────────┘
```

This clearly communicates the purpose.

---

# 23. QZ8 Instructions

Before starting:

```text
┌──────────────────────────────────────────────┐
│ Complete Topic Quiz                          │
│                                              │
│ Topic: Python Lists                          │
│                                              │
│ This assessment covers the major concepts,  │
│ skills, and practical applications from     │
│ this topic.                                  │
│                                              │
│ Questions: 20                                │
│                                              │
│ [ Start Quiz ]                               │
└──────────────────────────────────────────────┘
```

The exact number should come from the Assessment Engine.

---

# 24. QZ8 Assessment Start

Flow:

```text
Topic
 ↓
Complete Topic Quiz
 ↓
Start
 ↓
Create / Resume Assessment Session
 ↓
Question 1
```

The assessment session should be authoritative on the server.

---

# 25. QZ8 Session

Conceptually:

```text
Complete Topic Session
│
├── sessionId
├── assessmentId
├── topic
├── currentQuestion
├── answeredQuestions
├── score
├── completion
└── attempt
```

The exact schema belongs to the existing Assessment Engine.

---

# 26. QZ8 Session Recovery

If the learner leaves and returns:

```text
Browser
 ↓
Tutorial
 ↓
QZ8
 ↓
Resume Assessment
 ↓
Existing Assessment Session
 ↓
Current Question
```

The browser should not reconstruct the assessment state.

---

# 27. QZ8 Navigation Model

There are two possible assessment policies.

### Sequential

```text
Q1
 ↓
Q2
 ↓
Q3
```

### Reviewable

```text
Q1 ─┐
Q2  │
Q3  ├── Question Navigator
Q4  │
Q5 ─┘
```

The assessment policy should determine whether back-navigation is permitted.

QZ8 should respect that policy.

---

# 28. QZ8 Question Navigator

If review is allowed:

```text
┌────────────────────────────┐
│ QUESTIONS                  │
│                            │
│ ✓ 1                        │
│ ✓ 2                        │
│ • 3                        │
│ ✓ 4                        │
│ ○ 5                        │
│ ○ 6                        │
│                            │
│ [ Review ]                 │
└────────────────────────────┘
```

Possible states:

```text
✓ Answered
• Current
○ Unanswered
```

The exact navigation behavior depends on the Assessment Engine policy.

---

# 29. QZ8 Review Mode

At the end:

```text
┌──────────────────────────────────────────────┐
│ REVIEW YOUR ANSWERS                         │
│                                              │
│ Question 1       ✓ Answered                 │
│ Question 2       ✓ Answered                 │
│ Question 3       ✓ Answered                 │
│ Question 4       ○ Unanswered               │
│                                              │
│ [ Return to Question 4 ]                    │
│                                              │
│ [ Submit Quiz ]                              │
└──────────────────────────────────────────────┘
```

Only implement this if the assessment policy supports review.

---

# 30. QZ8 Submission

Final submission:

```text
Review
 ↓
Submit Quiz
 ↓
Assessment Engine
 ↓
Evaluate all attempts
 ↓
Calculate result
 ↓
Calculate topic performance
 ↓
Return final result
```

---

# 31. QZ8 Final Result

A strong topic-level result might be:

```text
┌──────────────────────────────────────────────┐
│ COMPLETE TOPIC QUIZ COMPLETE                │
│                                              │
│ Python Lists                                 │
│                                              │
│ Score                                        │
│ 84%                                          │
│                                              │
│ Mastery                                      │
│ Strong                                       │
│                                              │
│ Questions                                    │
│ 17 / 20 correct                              │
└──────────────────────────────────────────────┘
```

The score and mastery come from the Assessment Engine.

---

# 32. QZ8 Topic Performance

The result should ideally go beyond one percentage.

Example:

```text
Topic Performance

Fundamentals       ██████████  100%
Indexing           █████████░   90%
Slicing            ███████░░░   70%
Mutation           █████████░   90%
References         █████░░░░░   50%
Complexity         ████████░░   80%
Debugging          ██████░░░░   60%
```

The actual analytics should come from the existing analytics/assessment infrastructure.

---

# 33. QZ8 Strong Areas

Example:

```text
Strong Areas

✓ List indexing
✓ List mutation
✓ List methods
```

This tells the learner what they have mastered.

---

# 34. QZ8 Weak Areas

Example:

```text
Needs Review

⚠ Object references
⚠ Slice assignment
⚠ Debugging while iterating
```

This is more useful than simply:

> Score: 72%.

---

# 35. QZ8 Topic Mastery

The Assessment Engine may classify:

```text
Mastery
├── Not Started
├── Beginning
├── Developing
├── Proficient
└── Mastered
```

The exact mastery levels should follow your existing assessment/analytics architecture.

QZ8 should display the authoritative result rather than calculate its own.

---

# 36. QZ8 Recommended Next Action

The result can provide:

```text
┌──────────────────────────────────────────────┐
│ RECOMMENDED NEXT STEP                       │
│                                              │
│ Review Object References before continuing. │
│                                              │
│ [ Review Weak Area ]                        │
└──────────────────────────────────────────────┘
```

This allows QZ8 to connect assessment to learning.

---

# 37. QZ8 Remediation Flow

```text
Complete Topic Quiz
        ↓
Weakness detected
        ↓
Recommended Tutorial Content
        ↓
Review
        ↓
Practice
        ↓
Reassessment
```

This creates a complete learning loop.

---

# 38. QZ8 Example — Weak References

Suppose:

```text
References → 45%
```

The system can recommend:

```text
MemoryBlock
M3 — Reference Model
```

followed by:

```text
QZ5 — Code Output
```

and potentially:

```text
QZ7 — Adaptive Quiz
```

for targeted reassessment.

---

# 39. QZ8 Example — Weak Exception Handling

If:

```text
Exception Handling → 55%
```

the learner could be directed to:

```text
Exception Propagation
 ↓
MistakeBlock
 ↓
BestPracticeBlock
 ↓
QZ7
```

QZ8 becomes the diagnostic starting point for remediation.

---

# 40. QZ8 Complete Topic Coverage

A good Complete Topic Quiz should assess different cognitive levels.

For example:

```text
Recall
   ↓
Understand
   ↓
Apply
   ↓
Analyze
   ↓
Debug
   ↓
Evaluate
```

The assessment blueprint can determine the desired distribution.

---

# 41. QZ8 Cognitive Coverage Example

For Python Lists:

| Cognitive Level | Example                           |
| --------------- | --------------------------------- |
| Recall          | What does `append()` do?          |
| Understand      | Explain list mutability           |
| Apply           | Choose `extend()` for a situation |
| Analyze         | Predict aliasing behavior         |
| Debug           | Identify mutation-related bug     |
| Evaluate        | Choose appropriate data structure |

This produces a much stronger topic assessment.

---

# 42. QZ8 Difficulty Distribution

Example blueprint:

```text
Beginner       30%
Intermediate   50%
Advanced       20%
```

The Assessment Engine can enforce this distribution.

QZ8 simply renders the resulting questions.

---

# 43. QZ8 Question Distribution

Example:

```text
20 questions

Fundamentals        2
Indexing            2
Slicing             2
Mutation            3
Methods             3
References          3
Complexity          2
Debugging           3
```

This ensures broad topic coverage.

---

# 44. QZ8 Question Type Distribution

Potential blueprint:

```text
MCQ                6
True / False       2
Code Output        5
Multiple Select    3
Scenario           4
```

This gives variety.

Again, the assessment engine should own the blueprint.

---

# 45. QZ8 Does Not Require Every Question Type

A simpler topic may use:

```text
QZ2
+
QZ5
```

while a more advanced topic may use:

```text
QZ2
+
QZ3
+
QZ5
+
QZ6
```

QZ8 is defined by:

> **Complete topic assessment**

not by a fixed number of presentation types.

---

# 46. QZ8 Assessment Blueprint Example

Conceptually:

```json
{
  "assessmentId": "python_lists_complete",
  "scope": {
    "topicId": "python-lists"
  },
  "coverage": {
    "fundamentals": 2,
    "indexing": 2,
    "slicing": 2,
    "mutation": 3,
    "methods": 3,
    "references": 3,
    "complexity": 2,
    "debugging": 3
  }
}
```

This is **conceptual**. The actual schema should follow your existing assessment architecture.

---

# 47. QZ8 Tutorial JSON

The Tutorial Engine should remain simple:

```json
{
  "type": "quiz",
  "version": "QZ8",
  "assessmentId": "python_lists_complete"
}
```

That is the correct separation of concerns.

---

# 48. QZ8 Optional Presentation Configuration

```json
{
  "type": "quiz",
  "version": "QZ8",
  "assessmentId": "python_lists_complete",
  "presentation": {
    "showInstructions": true,
    "showProgress": true,
    "allowReview": true,
    "showFeedbackAfterCompletion": true,
    "showTopicBreakdown": true
  }
}
```

These settings affect presentation.

---

# 49. QZ8 Composer

The Tutorial Composer can expose:

```text
┌──────────────────────────────────────────────┐
│ QuizBlock                                    │
│                                              │
│ Version                                      │
│ [ QZ8 — Complete Topic Quiz ▼ ]             │
│                                              │
│ Assessment                                   │
│ [ Search assessment... ]                     │
│                                              │
│ Selected                                     │
│ python_lists_complete                        │
│                                              │
│ Scope                                        │
│ Python Lists                                 │
│                                              │
│ Coverage                                     │
│ ✓ Fundamentals                               │
│ ✓ Indexing                                   │
│ ✓ Slicing                                    │
│ ✓ Mutation                                   │
│ ✓ Methods                                    │
│ ✓ References                                 │
│ ✓ Complexity                                 │
│ ✓ Debugging                                  │
└──────────────────────────────────────────────┘
```

The Composer should retrieve this metadata from the Assessment system rather than duplicating it.

---

# 50. QZ8 Composer Should Not Build the Blueprint

Avoid:

```text
Tutorial Composer
 ↓
Create 20 questions
 ↓
Set difficulty
 ↓
Calculate score
```

Instead:

```text
Assessment Authoring
 ↓
Create Complete Topic Assessment
 ↓
Blueprint
 ↓
Question Pool
 ↓
Publish
 ↓
Tutorial Composer references assessment
```

This preserves the assessment architecture.

---

# 51. QZ8 Publishing Requirement

A QZ8 block should not be publishable if its referenced assessment is invalid.

For example:

```text
Assessment:
python_lists_complete
```

must be:

```text
Published
Valid
Question pool sufficient
Blueprint satisfiable
```

before the tutorial is published.

This is an important publishing gate.

---

# 52. QZ8 Assessment Availability

If the assessment is unavailable:

```text
┌──────────────────────────────────────────────┐
│ Complete Topic Quiz                          │
│                                              │
│ This assessment is currently unavailable.   │
│                                              │
│ Please try again later.                      │
└──────────────────────────────────────────────┘
```

The Tutorial Engine should not fabricate questions.

---

# 53. QZ8 Question Pool Sufficiency

Suppose the blueprint requires:

```text
References → 5 questions
```

but only 2 eligible questions exist.

The Assessment Engine should detect this before publishing/starting the assessment.

This connects directly to the broader:

> **Question Pool Sufficiency**

architecture.

QZ8 should not silently degrade coverage.

---

# 54. QZ8 Blueprint Validation

A valid assessment should satisfy:

```text
Required coverage
        ≤
Available eligible question pool
```

For example:

```text
Required:
References = 3

Available:
References = 8

✓ Valid
```

But:

```text
Required:
References = 5

Available:
References = 2

✕ Invalid
```

This validation belongs to the Assessment Engine.

---

# 55. QZ8 Assessment Lifecycle

```text
Draft
 ↓
Blueprint Defined
 ↓
Question Pool Attached
 ↓
Coverage Validated
 ↓
Assessment Published
 ↓
Tutorial References Assessment
 ↓
Learner Starts
 ↓
Assessment Session
 ↓
Questions
 ↓
Final Result
```

---

# 56. QZ8 Authentication

Uses the existing authentication system:

```text
Existing User Session
        ↓
Tutorial
        ↓
Assessment Session
        ↓
QZ8
```

No new authentication mechanism.

---

# 57. QZ8 Authorization

Uses existing assessment authorization:

```text
User
 ↓
Tutorial Access
 ↓
Assessment Access
 ↓
QZ8
```

No separate QZ8 authorization model.

---

# 58. QZ8 Security

The client should not be authoritative for:

```text
correct answers
score
mastery
question selection
coverage
completion
```

The flow remains:

```text
Browser
 ↓
Answer
 ↓
Assessment API
 ↓
Assessment Engine
 ↓
Authoritative Result
```

---

# 59. QZ8 Attempts

A Complete Topic Quiz may support:

```text
Attempt 1
Attempt 2
Attempt 3
```

depending on assessment policy.

The Assessment Engine owns:

```text
attempt number
attempt status
responses
score
result
```

QZ8 displays them.

---

# 60. QZ8 Attempt Result

Example:

```text
Attempt 1
Score: 68%
Status: Needs Review
```

Learner may later take:

```text
Attempt 2
Score: 84%
Status: Proficient
```

The assessment analytics can track improvement.

---

# 61. QZ8 Analytics

QZ8 provides a particularly valuable analytics event:

```text
topic_assessment_completed
```

with assessment-level data such as:

```text
topic
score
accuracy
mastery
attempt
time
coverage
skill performance
```

This can feed the platform's broader analytics architecture.

---

# 62. QZ8 Topic Performance

For example:

```text
Python Lists

Fundamentals       95%
Indexing            90%
Slicing             72%
Mutation            88%
References          54%
Complexity           81%
Debugging            63%
```

This is much more actionable than:

```text
Score = 78%
```

---

# 63. QZ8 Weakness Tree Integration

The existing weakness analytics can potentially receive:

```text
Python Lists
   ↓
References
   ↓
Aliasing
   ↓
Mutation through shared reference
```

Then:

```text
QZ8
 ↓
Weakness Tree
 ↓
Tutorial remediation
```

This makes QZ8 a major input into the analytics system.

---

# 64. QZ8 Mastery Trend

Repeated topic assessments could produce:

```text
Attempt 1 → 61%
Attempt 2 → 74%
Attempt 3 → 86%
```

This can feed the existing:

> **Mastery Trend**

analytics.

QZ8 should not create a separate charting system.

---

# 65. QZ8 Difficulty Accuracy

Because questions have difficulty metadata, the Assessment Engine can report:

```text
Beginner       95%
Intermediate   78%
Advanced       45%
```

This tells the learner:

> You understand the fundamentals but need deeper practice.

---

# 66. QZ8 Time Analysis

If the assessment tracks response time:

```text
Fundamentals       18 sec
Indexing           22 sec
References         61 sec
Debugging          74 sec
```

This can identify concepts requiring more reasoning.

Again, analytics belong to the existing analytics architecture.

---

# 67. QZ8 Completion

A QZ8 block can be considered complete based on the assessment result/status.

Conceptually:

```text
Assessment Completed
       ↓
Assessment Result
       ↓
Tutorial Block Completion
```

The exact completion policy should remain configurable.

---

# 68. QZ8 Completion Policies

Possible policies:

```text
Answered
Completed assessment
Passed
Mastery achieved
```

For example:

```text
Policy:
assessment_completed
```

means:

> Completing the assessment marks the block complete.

Whereas:

```text
Policy:
passed
```

means:

> The learner must achieve the configured passing threshold.

The Tutorial Engine should consume the policy/result rather than invent it.

---

# 69. QZ8 Retry / Reassessment

After an unsuccessful attempt:

```text
Result
 ↓
Review Weak Areas
 ↓
Learn
 ↓
Practice
 ↓
Retake
```

The retake remains an Assessment Engine operation.

---

# 70. QZ8 Complete Learning Architecture

This is where QZ8 becomes especially powerful:

```text
              LEARN
                │
                ▼
          PRACTICE
                │
                ▼
           REVISION
                │
                ▼
      QZ8 COMPLETE TOPIC
                │
                ▼
           ASSESSMENT
                │
        ┌───────┴────────┐
        ▼                ▼
     MASTERED         WEAKNESS
        │                │
        ▼                ▼
   NEXT TOPIC       REMEDIATION
                         │
                         ▼
                     PRACTICE
                         │
                         ▼
                       QZ7
                         │
                         ▼
                      MASTER
```

This creates the complete learning loop.

---

# 71. QZ8 Result → Remediation

Example:

```text
QZ8
 ↓
Score: 72%
 ↓
Weak:
References
Debugging
 ↓
Recommended:
M3 Reference Model
MT4 Common Mistakes
EX5 Guided Exercise
 ↓
QZ7 Adaptive Quiz
 ↓
Mastery
```

This is a much richer learning system than a traditional final quiz.

---

# 72. QZ8 Complete Topic Quiz UI

A complete experience could look like:

```text
┌─────────────────────────────────────────────────────┐
│ COMPLETE TOPIC QUIZ                                 │
│ Python Lists                                         │
│                                                     │
│ 4 / 20                                              │
│ ████████░░░░░░░░░░░░                                │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ QUESTION                                        │ │
│ │                                                 │ │
│ │ Which operation adds all elements from one      │ │
│ │ list into another list?                         │ │
│ │                                                 │ │
│ │ ○ append()                                      │ │
│ │ ○ extend()                                      │ │
│ │ ○ insert()                                      │ │
│ │ ○ pop()                                         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [ ← Previous ]                  [ Next → ]           │
└─────────────────────────────────────────────────────┘
```

The actual question presentation may vary according to the assessment item.

---

# 73. QZ8 Code Question Inside

```text
┌─────────────────────────────────────────────────────┐
│ QUESTION 8 / 20                                     │
│                                                     │
│ What will this code print?                          │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ a = [1, 2]                                      │ │
│ │ b = a                                           │ │
│ │ b.append(3)                                     │ │
│ │ print(a)                                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ○ [1, 2]                                            │
│ ○ [1, 2, 3]                                         │
│ ○ [3]                                               │
│ ○ Error                                             │
│                                                     │
│ [ ← Previous ]                  [ Next → ]           │
└─────────────────────────────────────────────────────┘
```

This is effectively a QZ5-style item inside QZ8.

---

# 74. QZ8 Scenario Question Inside

```text
┌─────────────────────────────────────────────────────┐
│ QUESTION 14 / 20                                    │
│                                                     │
│ SCENARIO                                             │
│                                                     │
│ A developer observes that modifying one variable    │
│ changes a list accessed through another variable.   │
│                                                     │
│ What should they investigate first?                 │
│                                                     │
│ ○ Shared object reference                            │
│ ○ Python copying all objects automatically           │
│ ○ List immutability                                  │
│ ○ String interning                                   │
│                                                     │
│ [ ← Previous ]                  [ Next → ]           │
└─────────────────────────────────────────────────────┘
```

This is effectively a QZ6-style item inside QZ8.

---

# 75. QZ8 Accessibility

The complete assessment must support:

* keyboard navigation
* semantic question headings
* accessible response groups
* visible focus
* screen-reader announcements
* accessible progress information
* accessible result summary
* no color-only meaning

---

# 76. QZ8 Keyboard Flow

For a sequential assessment:

```text
Tab
 ↓
Question
 ↓
Answer
 ↓
Next
```

For reviewable assessment:

```text
Tab
 ↓
Question navigation
 ↓
Question
 ↓
Answer
 ↓
Next / Previous
```

The exact behavior depends on assessment policy.

---

# 77. QZ8 Responsive Design

Desktop:

```text
┌─────────────────────────────────────────────────────┐
│ COMPLETE TOPIC QUIZ                                 │
│ Python Lists                                        │
│                                                     │
│ Progress: 8 / 20                                    │
│ ███████████░░░░░░░                                  │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Question                                       │ │
│ │                                               │ │
│ │ ...                                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [ Previous ]                         [ Next ]        │
└─────────────────────────────────────────────────────┘
```

Mobile:

```text
┌─────────────────────────────┐
│ COMPLETE TOPIC QUIZ         │
│ Python Lists                │
│                             │
│ 8 / 20                      │
│ ████████░░░░░░              │
│                             │
│ Question                   │
│ ┌─────────────────────────┐ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ ○ Answer A                  │
│ ○ Answer B                  │
│ ○ Answer C                  │
│ ○ Answer D                  │
│                             │
│ [ Previous ] [ Next ]      │
└─────────────────────────────┘
```

---

# 78. QZ8 Visual Design

Use the established Tutorial Engine visual system:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Recommended:

* light overall theme
* white assessment surface
* dark-blue typography
* pink primary actions
* subtle progress indicator
* soft shadows
* clear section hierarchy
* no gradient
* no dark overall theme

---

# 79. QZ8 Start Screen

A polished start screen:

```text
┌──────────────────────────────────────────────┐
│ COMPLETE TOPIC QUIZ                          │
│                                              │
│ Python Lists                                 │
│                                              │
│ Test your understanding across the complete │
│ topic.                                      │
│                                              │
│ Coverage                                     │
│ ✓ Fundamentals                               │
│ ✓ Indexing                                   │
│ ✓ Slicing                                    │
│ ✓ Mutation                                   │
│ ✓ References                                 │
│ ✓ Complexity                                 │
│ ✓ Debugging                                  │
│                                              │
│              [ Start Quiz ]                  │
└──────────────────────────────────────────────┘
```

---

# 80. QZ8 Completion Screen

```text
┌──────────────────────────────────────────────┐
│ ✓ TOPIC ASSESSMENT COMPLETE                  │
│                                              │
│ Python Lists                                 │
│                                              │
│ Score                 84%                    │
│ Mastery               Proficient             │
│ Correct               17 / 20                │
│                                              │
│ Strong Areas                                 │
│ ✓ Indexing                                   │
│ ✓ Mutation                                   │
│ ✓ List Methods                               │
│                                              │
│ Review Needed                                │
│ ⚠ References                                 │
│ ⚠ Debugging                                  │
│                                              │
│ [ Review Weak Areas ]                        │
│ [ Continue Tutorial ]                        │
└──────────────────────────────────────────────┘
```

---

# 81. QZ8 Error State

If the assessment cannot load:

```text
┌──────────────────────────────────────────────┐
│ Complete Topic Quiz                          │
│                                              │
│ This assessment could not be loaded.         │
│                                              │
│ [ Try Again ]                                │
└──────────────────────────────────────────────┘
```

If submission fails:

```text
┌──────────────────────────────────────────────┐
│ Your answers could not be submitted.         │
│                                              │
│ Please try again.                            │
│                                              │
│ [ Retry Submission ]                         │
└──────────────────────────────────────────────┘
```

Do not incorrectly mark the assessment as complete.

---

# 82. QZ8 Question Pool Failure

If the Assessment Engine detects insufficient questions:

```text
The assessment is currently unavailable because
its question pool does not satisfy the required
topic coverage.
```

This should ideally be detected during assessment publishing/validation, not discovered by the learner.

---

# 83. QZ8 Blueprint Validation

The Assessment Engine should validate:

```text
Topic exists
+
Assessment published
+
Blueprint valid
+
Question pool sufficient
+
Required coverage available
+
Difficulty requirements satisfiable
```

Only then should QZ8 be available.

---

# 84. QZ8 Assessment Publishing

The preferred lifecycle:

```text
Draft Assessment
      ↓
Define Topic Scope
      ↓
Define Blueprint
      ↓
Attach Question Pool
      ↓
Validate Coverage
      ↓
Validate Difficulty
      ↓
Publish Assessment
      ↓
Tutorial QZ8 references it
```

This prevents incomplete topic quizzes from reaching learners.

---

# 85. QZ8 Security Boundary

The browser should not determine:

```text
correct answers
score
topic mastery
question pool
blueprint
question ordering
passing status
```

Instead:

```text
Learner
 ↓
QZ8
 ↓
Assessment API
 ↓
Assessment Engine
 ↓
Authoritative Result
```

---

# 86. QZ8 Analytics Integration

QZ8 can feed:

```text
Score Distribution
Topic Performance
Mastery Trend
Skill Performance
Weakness Tree
Difficulty Accuracy
Time Analysis
```

This aligns directly with the existing analytics architecture.

---

# 87. QZ8 Topic Performance Example

```text
Python Lists

Overall
84%

By Dimension

Fundamentals       100%
Indexing             90%
Slicing              75%
Mutation             92%
Methods              88%
References           58%
Complexity           80%
Debugging            65%
```

The learner can immediately identify:

> References and debugging need more work.

---

# 88. QZ8 Weakness Tree Example

```text
Python
└── Data Structures
    └── Lists
        ├── Indexing          ✓
        ├── Slicing           ✓
        ├── Mutation          ✓
        ├── References        ⚠
        │   └── Aliasing      ⚠
        └── Debugging         ⚠
```

This is where QZ8 becomes valuable to the overall analytics architecture.

---

# 89. QZ8 Mastery Trend

After multiple attempts:

```text
Attempt 1 → 62%
Attempt 2 → 74%
Attempt 3 → 84%
Attempt 4 → 91%
```

The platform can visualize mastery progression.

QZ8 does not own the chart; it supplies assessment results to the existing analytics system.

---

# 90. QZ8 Difficulty Split

Example:

```text
Beginner       96%
Intermediate   82%
Advanced       54%
```

Interpretation:

> The learner has strong fundamentals but needs advanced practice.

This can feed the recommendation system.

---

# 91. QZ8 Recommended Learning Path

Example:

```text
QZ8 Result
    ↓
Advanced References weak
    ↓
M6 Memory Before / After
    ↓
EX7 Challenge Exercise
    ↓
QZ7 Adaptive Quiz
    ↓
Reassessment
```

This turns the Complete Topic Quiz into a gateway for personalized learning.

---

# 92. QZ8 End-to-End Architecture

```text
                    TUTORIAL
                       │
                       ▼
                  LEARNING BLOCKS
                       │
                       ▼
                  SUMMARY / REVISION
                       │
                       ▼
                       QZ8
                       │
                       ▼
              COMPLETE TOPIC ASSESSMENT
                       │
                       ▼
               ASSESSMENT ENGINE
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Question     Evaluation     Analytics
         Pool           │             │
          │             ▼             ▼
          │           Score        Mastery
          │                           │
          └──────────────┬────────────┘
                         ▼
                    TOPIC RESULT
                         │
               ┌─────────┴─────────┐
               ▼                   ▼
           MASTERED             WEAKNESS
               │                   │
               ▼                   ▼
          NEXT TOPIC          REMEDIATION
                                   │
                                   ▼
                              PRACTICE / QZ7
```

---

# 93. QZ8 Complete Topic Learning Cycle

```text
LEARN
  ↓
UNDERSTAND
  ↓
PRACTICE
  ↓
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

This is the final role of QZ8 within the Tutorial Engine.

---

# 94. QZ8 Minimal JSON

The cleanest block representation remains:

```json
{
  "type": "quiz",
  "version": "QZ8",
  "assessmentId": "python_lists_complete"
}
```

The Tutorial Engine does not need to know:

```text
20 questions
3 reference questions
2 slicing questions
5 beginner questions
```

Those belong to the assessment definition.

---

# 95. QZ8 Final Technical Specification

| Area                          | QZ8 Decision                                          |
| ----------------------------- | ----------------------------------------------------- |
| **Block**                     | **QuizBlock**                                         |
| **Version**                   | **QZ8**                                               |
| **Presentation**              | **Complete Topic Quiz**                               |
| **Primary purpose**           | Assess complete topic understanding                   |
| **Scope**                     | Entire topic                                          |
| **Reference**                 | Assessment ID                                         |
| **Question count**            | Assessment-defined                                    |
| **Question pool**             | Existing Assessment Engine                            |
| **Assessment blueprint**      | Existing Assessment Engine                            |
| **Coverage rules**            | Existing Assessment Engine                            |
| **Difficulty rules**          | Existing Assessment Engine                            |
| **Question ordering**         | Existing Assessment Engine                            |
| **Question selection**        | Existing Assessment Engine                            |
| **Evaluation**                | Existing Assessment Engine                            |
| **Scoring**                   | Existing Assessment Engine                            |
| **Attempts**                  | Existing Assessment Engine                            |
| **Mastery**                   | Existing Assessment Engine                            |
| **Assessment analytics**      | Existing Assessment Engine                            |
| **Topic analytics**           | Existing Analytics Architecture                       |
| **Tutorial progress**         | Tutorial Engine                                       |
| **Question presentation**     | Reuse existing QuizBlock renderers                    |
| **Multiple Choice**           | ✅                                                     |
| **Multiple Select**           | ✅ if supported                                        |
| **True / False**              | ✅ if supported                                        |
| **Code Output**               | ✅                                                     |
| **Scenario**                  | ✅                                                     |
| **Adaptive behavior**         | Only through existing Assessment Engine if configured |
| **Local question bank**       | ❌                                                     |
| **Local blueprint**           | ❌                                                     |
| **Local scoring**             | ❌                                                     |
| **Local mastery calculation** | ❌                                                     |
| **Question duplication**      | ❌                                                     |
| **Authentication**            | Existing platform auth                                |
| **Authorization**             | Existing assessment rules                             |
| **Session recovery**          | Server-side assessment session                        |
| **Review navigation**         | Assessment policy                                     |
| **Retry**                     | Assessment policy                                     |
| **Feedback**                  | Assessment result                                     |
| **Remediation**               | Tutorial/assessment integration                       |
| **Accessibility**             | ✅                                                     |
| **Keyboard navigation**       | ✅                                                     |
| **Responsive**                | ✅                                                     |
| **Light theme**               | ✅                                                     |
| **Primary**                   | **#F54A8D**                                           |
| **Secondary**                 | **#0B1B3D**                                           |
| **Gradient**                  | ❌                                                     |
| **Dark overall theme**        | ❌                                                     |
| **JSON-driven**               | ✅                                                     |

---

# 96. QZ8 Final Mental Model

```text
                         QZ8
                COMPLETE TOPIC QUIZ
                         │
                         ▼
                  TOPIC ASSESSMENT
                         │
                         ▼
                 ASSESSMENT BLUEPRINT
                         │
                         ▼
                   QUESTION POOL
                         │
                         ▼
              ┌─────────────────────┐
              │ Assessment Engine   │
              └──────────┬──────────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Coverage    Difficulty   Question
                                  Selection
             │           │           │
             └───────────┼───────────┘
                         ▼
                     QUESTIONS
                         │
                         ▼
                     ANSWERS
                         │
                         ▼
                     EVALUATION
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
           Score       Mastery    Analytics
             │           │           │
             └───────────┼───────────┘
                         ▼
                  TOPIC-LEVEL RESULT
                         │
                 ┌───────┴────────┐
                 ▼                ▼
              MASTERED         WEAKNESS
                 │                │
                 ▼                ▼
             NEXT TOPIC       REMEDIATION
```

The central idea is:

> **QZ8 is the final assessment layer that brings the entire topic together. It measures broad topic coverage, applies the existing assessment rules, produces topic-level mastery/weakness information, and feeds the learner back into the Tutorial Engine for remediation or progression.**

---

# 97. Complete QuizBlock — All 8 Versions

We have now completed the entire **QuizBlock**:

| Version | Presentation        | Core Purpose                                        |
| ------- | ------------------- | --------------------------------------------------- |
| **QZ1** | Single Question     | Assess one question                                 |
| **QZ2** | Multiple Choice     | Select one answer from alternatives                 |
| **QZ3** | Multiple Select     | Select multiple correct answers                     |
| **QZ4** | True / False        | Evaluate a statement                                |
| **QZ5** | Code Output Quiz    | Predict code behavior                               |
| **QZ6** | Scenario Quiz       | Apply knowledge to a situation                      |
| **QZ7** | Adaptive Quiz       | Dynamically adapt assessment to learner performance |
| **QZ8** | Complete Topic Quiz | Assess the entire topic                             |

---

# 98. QuizBlock Architecture — Final

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

## **BLOCK 16 — QuizBlock: COMPLETE** ✅

All **8 versions — QZ1 through QZ8 — are now defined** with the central architectural principle preserved:

> **QuizBlock provides the Tutorial Engine presentation and learning-flow layer; the existing Assessment Engine remains the single source of truth for assessment questions, evaluation, scoring, attempts, mastery, and assessment analytics.**



```python

```
