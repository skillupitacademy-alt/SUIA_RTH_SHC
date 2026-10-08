# FILE 13 — ExerciseBlock: REVIEWED AND RECONCILED

I reviewed the actual attached **`ExerciseBlock(1).md`** as the source of truth. The file is **277,048 bytes / 15,087 lines** and contains the complete EX1–EX8 development, including individual version specifications and a final consolidated architecture.

The source itself closes ExerciseBlock at **EX8**.

---

# 1. Authoritative version declaration

The actual file opens Block 13 with this committed sequence:

| Version | Presentation | Primary purpose |
|---|---|---|
| **EX1** | **Fill in the Blank** | Complete a missing concept/code element |
| **EX2** | **Complete the Code** | Finish partially written code |
| **EX3** | **Predict the Output** | Execute/predict a result through practice |
| **EX4** | **Fix the Code** | Identify and correct broken code |
| **EX5** | **Guided Exercise** | Solve with structured guidance |
| **EX6** | **Independent Exercise** | Solve independently |
| **EX7** | **Challenge Exercise** | Solve a difficult practical problem |
| **EX8** | **Progressive Exercise Set** | Solve increasingly difficult exercises |

The file explicitly distinguishes ExerciseBlock from QuestionBlock:

> **QuestionBlock is primarily about questioning and thinking, while ExerciseBlock is about doing.**

Its high-level learning progression is:

```text
LEARN
  ↓
UNDERSTAND
  ↓
QUESTION
  ↓
PRACTICE
  ↓
APPLY
  ↓
MASTER
```

So the defining semantic of the family is **practice through learner action**, not merely answering questions.

---

# 2. QuestionBlock vs ExerciseBlock — important boundary

The file deliberately allows apparently similar presentations.

For example:

```text
QuestionBlock Q5
Predict the Output
```

and:

```text
ExerciseBlock EX3
Predict the Output
```

are **not duplicates**.

The distinction is:

```text
Q5
Concept checking
      ↓
"Can you predict this?"

EX3
Practice
      ↓
"Perform this prediction exercise yourself."
```

This is a very important corpus rule.

Therefore:

> **Presentation name alone does not determine family identity.**

The educational role does.

That aligns directly with the semantic version-classification method we've been using for the earlier files.

---

# 3. Complete ExerciseBlock progression

The file defines the practice ladder as:

```text
EX1
Fill in the Blank
      ↓
Small completion

EX2
Complete the Code
      ↓
Partial implementation

EX3
Predict the Output
      ↓
Execution practice

EX4
Fix the Code
      ↓
Debugging practice

EX5
Guided Exercise
      ↓
Supported problem solving

EX6
Independent Exercise
      ↓
Independent application

EX7
Challenge Exercise
      ↓
Advanced problem solving

EX8
Progressive Exercise Set
      ↓
Mastery through progression
```

The final consolidated pedagogical progression is:

```text
RECALL
   ↓
IMPLEMENT
   ↓
TRACE
   ↓
DEBUG
   ↓
GUIDED BUILDING
   ↓
INDEPENDENT BUILDING
   ↓
ADVANCED PROBLEM SOLVING
   ↓
PROGRESSIVE MASTERY
```

That is the authoritative semantic progression for File 13.

---

# 4. EX1 — Fill in the Blank

## Core purpose

EX1 is the smallest ExerciseBlock unit.

The learner receives an incomplete:

- statement
- expression
- sentence
- code fragment
- terminology item
- syntax element

and must actively provide the missing part.

The mental model is:

```text
PARTIAL KNOWLEDGE
       ↓
RECALL
       ↓
COMPLETE
       ↓
VERIFY
```

The file emphasizes **active production**, rather than recognition.

Examples include:

```text
A Python list is ______.
```

or:

```python
numbers = [1, 2]
numbers.______(3)
```

with the missing concept being `append`.

## Appropriate EX1 content

The file identifies EX1 as suitable for:

- terminology
- syntax
- keywords
- operators
- function names
- values
- expressions
- short code fragments
- simple rules
- conceptual statements

## EX1 boundary

EX1 should not become:

- a full implementation problem
- debugging
- a complex scenario
- an open-ended essay
- a project
- formal assessment

Its semantic role is:

> **Complete the missing element.**

### Classification

**EX1 = RECALL / COMPLETION**

---

# 5. EX2 — Complete the Code

EX2 is the first substantial implementation exercise.

The learner receives partially written code and must implement the missing logic.

The key transition is:

```text
EX1
Complete a missing element
        ↓
EX2
Implement missing logic
```

A representative exercise in the file is a function such as:

```python
def is_even(number):
    # complete here
```

The learner must produce the implementation.

The file introduces test-driven validation:

```text
Input
  ↓
Learner code
  ↓
Tests
  ↓
Pass / Fail
  ↓
Feedback
  ↓
Retry
```

## EX2 test model

The file supports visible and hidden tests.

Example:

```json
{
  "tests": [
    {
      "input": "2",
      "expectedOutput": "True",
      "visible": true
    },
    {
      "input": "5",
      "expectedOutput": "False",
      "visible": true
    },
    {
      "input": "-10",
      "expectedOutput": "True",
      "visible": false
    }
  ]
}
```

This is particularly important because it prevents the exercise from being reduced to matching the visible examples.

## EX2 state model

```text
INITIAL
   ↓
READ_TASK
   ↓
EDITING
   ↓
RUNNING
   ↓
TEST_RESULTS
   │
   ├── FAIL → EDITING
   │
   └── PASS → COMPLETED
```

Hints are supported but are not the central experience.

The file explicitly contrasts:

```text
EX2
Hints = optional assistance

EX5
Hints = part of the learning design
```

### Classification

**EX2 = IMPLEMENT**

---

# 6. EX3 — Predict the Output

EX3 has the same presentation phrase as QuestionBlock Q5, but the educational role is different.

QuestionBlock Q5:

> tests whether the learner can predict.

ExerciseBlock EX3:

> gives the learner practice performing prediction.

The file emphasizes that EX3 should contain:

- meaningful execution path
- deterministic behavior
- clearly defined expected result
- concepts already taught
- tracing opportunity
- useful feedback

It explicitly warns against:

- undefined behavior
- ambiguous output
- environment-dependent output
- unseeded randomness
- timing-dependent behavior
- hidden external state
- arbitrary tricks

## EX3 interaction

Conceptually:

```text
CODE
 ↓
MENTAL TRACE
 ↓
PREDICTION
 ↓
CHECK
 ↓
ACTUAL OUTPUT
 ↓
FEEDBACK
```

The actual output is revealed **after submission/checking**, not immediately.

## Responsive intent

Desktop:

```text
Code              Prediction
                 [ Answer ]
                 [ Check ]
```

Mobile:

```text
Code
 ↓
Your Prediction
 ↓
Check
 ↓
Result
```

The file explicitly wants the code and prediction area to remain close enough that the learner does not have to constantly move between distant parts of the page.

### Classification

**EX3 = EXECUTION-UNDERSTANDING / TRACE PRACTICE**

---

# 7. EX4 — Fix the Code

EX4 moves from prediction into **repair**.

The learner receives broken code and must identify/correct the implementation.

The important distinction from MistakeBlock is:

```text
MistakeBlock
    ↓
Teach the mistake
    ↓
Explain why it is wrong
    ↓
Show correction

Exercise EX4
    ↓
Give learner broken implementation
    ↓
Learner fixes it
    ↓
Tests validate repair
```

Therefore EX4 is an **active debugging exercise**, not a mistake explanation block.

The file's EX4 model involves:

```text
BROKEN CODE
     ↓
OBSERVE FAILURE
     ↓
UNDERSTAND BEHAVIOR
     ↓
IDENTIFY FAULT
     ↓
MODIFY
     ↓
TEST
     ↓
VERIFY
```

The exercise can support:

- reference solution
- multiple valid fixes
- behavioral validation
- retry
- progress

But:

> **Quiz score = ❌**

and:

> **Teaching the mistake = ❌ Primary role**

while:

> **Practicing the fix = ✅**

That is a very useful boundary with File 09 — MistakeBlock.

### Classification

**EX4 = DEBUG / REPAIR PRACTICE**

---

# 8. EX5 — Guided Exercise

EX5 is the transition from individual coding operations into **structured problem solving**.

The learner still solves a meaningful problem, but the system deliberately provides scaffolding.

Conceptually:

```text
PROBLEM
 ↓
STEP 1
 ↓
STEP 2
 ↓
STEP 3
 ↓
STEP 4
 ↓
WORKING SOLUTION
```

The file repeatedly emphasizes that the guidance should help the learner construct the solution rather than simply reveal it.

A guided exercise can include:

- requirements
- progressive steps
- hints
- checkpoints
- expected intermediate states
- examples
- validation
- feedback

The learner is still doing the work.

This is why EX5 remains ExerciseBlock rather than becoming a tutorial explanation.

## EX5 → EX6 boundary

This is one of the most important transitions in the family:

```text
EX5
Guided construction
       ↓
EX6
Independent construction
```

### Classification

**EX5 = GUIDED PROBLEM SOLVING**

---

# 9. EX6 — Independent Exercise

EX6 is where the learner receives a defined problem but must determine the solution approach independently.

The file's core flow is:

```text
PROBLEM
   ↓
UNDERSTAND REQUIREMENTS
   ↓
PLAN SOLUTION
   ↓
IMPLEMENT
   ↓
TEST
   ↓
DEBUG
   ↓
VERIFY
   ↓
COMPLETE
```

The most important characteristic is:

> **The learner decides how to solve the problem.**

## EX5 vs EX6

### EX5

```text
Goal
 ↓
Step 1
 ↓
Step 2
 ↓
Step 3
 ↓
Step 4
```

### EX6

```text
Goal
 ↓
Requirements
 ↓
Examples
 ↓
Constraints
 ↓
YOU DESIGN THE SOLUTION
```

That is a genuine semantic transition, not merely an increase in difficulty.

## EX6 validation

The file describes code exercises where the learner:

- writes the solution
- runs tests
- receives failure information
- retries
- uses optional assistance
- ultimately verifies the solution

But the system should not guide the learner through every implementation step.

### Classification

**EX6 = INDEPENDENT PROBLEM SOLVING**

---

# 10. EX7 — Challenge Exercise

EX7 is explicitly a **single difficult practical problem**.

The key distinction is:

```text
EX7
ONE
complex
problem
```

versus EX8:

```text
MULTIPLE
progressively difficult
problems
```

## EX7 requirements

The file expects:

- meaningful problem
- explicit requirements
- constraints
- realistic complexity
- independent reasoning
- sophisticated testing
- important edge cases

It explicitly says:

> **No guided steps.**

Do not turn EX7 into:

```text
Step 1
Create function

Step 2
Create list

Step 3
Add loop

Step 4
Add condition
```

because that would move it back toward EX5.

Instead:

```text
Problem
+
Requirements
+
Constraints
+
Examples
```

then:

```text
YOU DESIGN THE SOLUTION
```

## EX7 test strategy

The file calls for richer testing:

```text
normal cases
+
boundary cases
+
conflicting cases
+
invalid cases
+
hidden cases
```

For example, an authorization challenge might test:

- unauthenticated user
- authenticated user without permission
- permitted user
- resource owner
- administrator
- invalid user
- missing resource
- unknown action

The file also allows failure categories such as:

- Logic Failure
- Edge Case Failure
- Validation Failure
- Exception Handling Failure
- Performance Failure
- Security Requirement Failure

Again, this is **practice feedback**, not necessarily formal assessment scoring.

### Classification

**EX7 = ADVANCED / CHALLENGE PROBLEM SOLVING**

---

# 11. EX8 — Progressive Exercise Set

EX8 is the final ExerciseBlock version and the family capstone.

The file defines a critical distinction:

> **EX8 is not one large exercise.**

Instead:

> **EX8 is a sequence of exercises that gradually moves the learner from simpler application to advanced application.**

Conceptually:

```text
Exercise 1
   ↓
Exercise 2
   ↓
Exercise 3
   ↓
Exercise 4
   ↓
...
   ↓
Advanced Exercise
```

## EX8 internal progression

The file provides a strong default:

```text
Exercise 1
Recognition / basic application
        ↓
Exercise 2
Direct application
        ↓
Exercise 3
Debugging / modification
        ↓
Exercise 4
Independent implementation
        ↓
Exercise 5
Advanced challenge
```

Therefore EX8 can internally reuse the educational patterns developed across EX1–EX7.

That is intentional.

---

# 12. EX8 progression and completion

The file supports multiple progression modes:

### Strict

```text
EX8.1
 ↓
complete
 ↓
EX8.2
```

### Recommended

The learner can continue but receives guidance.

### Free navigation

All exercises remain accessible.

The content author chooses the mode.

Importantly, the file says:

> **Do not make adaptive difficulty mandatory.**

So adaptive behavior is optional, not part of the mandatory EX8 contract.

---

# 13. EX8 failure and retry model

A failure in one exercise should not erase previous progress.

Example:

```text
Exercise 1 ✓
Exercise 2 ✓
Exercise 3 ✗
```

The learner retries Exercise 3.

Previous completion remains.

The state model is:

```text
Current Exercise
      ↓
Attempt
      ↓
Fail
      ↓
Feedback
      ↓
Retry
      ↓
Pass
      ↓
Next Exercise
```

This reinforces that ExerciseBlock is designed around **iterative practice**.

---

# 14. ExerciseBlock hints

The family supports a progressive hint model.

Example from the file:

```json
{
  "hints": [
    {
      "level": 1,
      "text": "Think about the data structure you need."
    },
    {
      "level": 2,
      "text": "A dictionary can associate each key with a value."
    },
    {
      "level": 3,
      "text": "Try initializing the dictionary before the loop."
    }
  ]
}
```

But the semantic role changes by version:

```text
EX1 → high guidance
EX2 → optional hints
EX3 → limited assistance
EX4 → debugging feedback
EX5 → structured guidance
EX6 → low scaffolding
EX7 → minimal guidance
EX8 → progressively decreasing scaffolding
```

That is an important family-wide design pattern.

---

# 15. ExerciseBlock attempts

Unlike a formal quiz, repeated attempts are natural.

The file gives:

```text
Attempt 1
 ↓
Incorrect
 ↓
Hint
 ↓
Attempt 2
 ↓
Incorrect
 ↓
More guidance
 ↓
Attempt 3
 ↓
Correct
```

This reinforces:

> **learning through iteration**

rather than:

> one attempt → score.

---

# 16. ExerciseBlock progress model

The file proposes:

```text
○ Not Started
◐ In Progress
✓ Completed
↻ Retry
```

For an EX8 set:

```text
EX8 Progressive Set

✓ Exercise 1
✓ Exercise 2
◐ Exercise 3
○ Exercise 4
○ Exercise 5
```

This is a **practice-progress representation**, not automatically an assessment result.

---

# 17. ExerciseBlock does not require quiz scoring

The file explicitly warns against automatically turning:

```text
Exercise
```

into:

```text
Score = 8/10
```

Instead:

```text
Practice Progress
    ↓
Completed
    ↓
Practice proficiency
```

If formal scoring is required:

> **QuizBlock is the appropriate block.**

This is another strong boundary between Files 13 and 16.

---

# 18. Exercise completion

The file allows different completion criteria.

For code exercises, one example is:

```json
{
  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

The final consolidated completion modes are:

| Version | Typical completion |
|---|---|
| EX1 | Correct blank(s) |
| EX2 | Required tests pass |
| EX3 | Correct predicted output |
| EX4 | Tests pass after correction |
| EX5 | Guided task completed |
| EX6 | Independent solution passes tests |
| EX7 | Challenge requirements satisfied |
| EX8 | Progressive exercise sequence completed |

This is a useful canonical distinction for later content modeling.

---

# 19. Common ExerciseBlock data envelope

The actual file provides a common conceptual envelope:

```json
{
  "type": "exercise",
  "version": "EX1",
  "presentation": "Fill in the Blank",

  "content": {},

  "metadata": {
    "difficulty": "easy",
    "estimatedMinutes": 5,
    "keyConcepts": [],
    "relatedBlocks": []
  },

  "completion": {
    "mode": "answer-match"
  }
}
```

The file states that the renderer selects the appropriate presentation from:

```text
type + version
```

Again, this is **reference architecture/content modeling in the Markdown**.

It does **not** prove that the current repository's production renderer uses exactly this envelope.

---

# 20. ExerciseBlock analytics

The file provides a useful conceptual analytics model:

```text
attempts
hintsUsed
timeSpent
testsPassed
testsFailed
retries
completion
solutionViewed
```

Example:

```json
{
  "exerciseAnalytics": {
    "attempts": 3,
    "hintsUsed": 1,
    "testsPassed": 8,
    "testsFailed": 2,
    "solutionViewed": false,
    "completed": true
  }
}
```

The file explicitly classifies these as:

> **learning analytics, not necessarily assessment scores.**

This distinction is important when later reconciling with ILS.

We should **not** take this as evidence that these analytics are already stored by ILS.

---

# 21. Important mastery boundary

The file gives an example:

```text
EX1 ✓
EX2 ✓
EX3 ✓
EX4 ✓
EX5 ✓
EX6 ✓
EX7 ✓
```

It says the system could infer:

> Practice proficiency

but warns that this should not automatically equal:

> "Mastered."

The file recommends that mastery ideally consider other evidence, such as:

- QuizBlock
- later application

Therefore:

```text
Exercise completion
        ≠
automatic mastery
```

This is an important semantic rule for later LSNB/RSSB reconciliation.

---

# 22. ExerciseBlock authoring rules

The file provides explicit authoring rules:

### Rule 1
Every exercise must have a clear objective.

### Rule 2
The learner must actually perform something.

### Rule 3
Requirements should be explicit.

### Rule 4
Examples should clarify expected behavior.

### Rule 5
Tests should cover normal and important edge cases.

### Rule 6
Hints should help without immediately revealing the solution.

### Rule 7
EX6 should minimize scaffolding.

### Rule 8
EX7 should combine concepts.

### Rule 9
EX8 should progressively increase difficulty.

These rules are part of the **reference educational design**, not a production runtime contract.

---

# 23. ExerciseBlock relationship to other families

The file gives this conceptual learning chain:

```text
DefinitionBlock
      ↓
Explain concept

CodeBlock
      ↓
Show implementation

ExecutionBlock
      ↓
Explain runtime

MistakeBlock
      ↓
Show common error

BestPracticeBlock
      ↓
Show correct approach

ExerciseBlock
      ↓
Learner practices
```

This is a very useful cross-family composition pattern.

It also gives:

```text
LEARN
 ↓
QUESTION
 ↓
EXERCISE
 ↓
QUIZ
```

and later:

```text
EX6
 ↓
EX7
 ↓
ProjectBlock
```

So ExerciseBlock occupies the **practice layer between conceptual learning/questioning and formal assessment/project work**.

---

# 24. EX8 as capstone — but not ProjectBlock

The file explicitly maintains:

```text
EX8
Progressive mastery
        ↓
ProjectBlock
Real-world creation
```

Therefore EX8 should not silently expand into a project.

Likewise:

```text
EX7
One complex challenge
```

is not:

```text
ProjectBlock
Large real-world deliverable
```

This is another important boundary.

---

# 25. Difficulty is not simply Easy → Hard

This is one of the most useful statements in the actual file.

The eight versions should **not** be interpreted simply as:

```text
easy → hard
```

Instead:

```text
EX1
Recall / completion
      ↓
EX2
Implementation
      ↓
EX3
Execution understanding
      ↓
EX4
Repair
      ↓
EX5
Supported problem solving
      ↓
EX6
Independent problem solving
      ↓
EX7
Advanced problem solving
      ↓
EX8
Sustained progressive practice
```

So EX1–EX8 represent **different practice modes**, with increasing independence and complexity.

---

# 26. Final EX1–EX8 technical architecture

The actual final consolidated table is:

| Version | Presentation | Primary interaction | Guidance | Difficulty |
|---|---|---|---|---|
| **EX1** | Fill in the Blank | Complete missing element | High | Easy |
| **EX2** | Complete the Code | Implement missing logic | Medium | Easy–Medium |
| **EX3** | Predict the Output | Predict execution result | Low | Easy–Medium |
| **EX4** | Fix the Code | Repair implementation | Medium | Medium |
| **EX5** | Guided Exercise | Solve with scaffolding | High | Medium |
| **EX6** | Independent Exercise | Solve independently | Low | Medium–Hard |
| **EX7** | Challenge Exercise | Multi-concept problem | Minimal | Hard |
| **EX8** | Progressive Exercise Set | Multiple escalating tasks | Progressive | Easy → Challenge |

This is the strongest consolidated version declaration in the file.

---

# 27. Final EX8 technical specification

The actual file gives EX8:

| Area | EX8 decision |
|---|---|
| Block | ExerciseBlock |
| Version | EX8 |
| Presentation | Progressive Exercise Set |
| Primary purpose | Progressive skill mastery |
| Exercises | Multiple related exercises |
| Relationship | Same learning goal / skill |
| Difficulty | Progressively increasing |
| Scaffolding | Progressively decreasing |
| Exercise types | Can vary |
| Sequential progression | ✅ Default |
| Open progression | Supported |
| Individual validation | ✅ |
| Hidden tests | Supported |
| Hints | Progressive |
| Progress persistence | ✅ |
| Adaptive difficulty | Optional |
| Mastery review | Recommended |
| Quiz score | ❌ |
| Random exercise collection | ❌ |
| Project scope | ❌ |
| Theme | Light |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark theme | ❌ |
| Responsive | ✅ |
| Accessible | ✅ |
| JSON-driven | ✅ |

This is the family capstone specification.

---

# 28. Final family closure

The file explicitly closes ExerciseBlock with:

```text
EX1
Fill in the Blank
        ↓
EX2
Complete the Code
        ↓
EX3
Predict the Output
        ↓
EX4
Fix the Code
        ↓
EX5
Guided Exercise
        ↓
EX6
Independent Exercise
        ↓
EX7
Challenge Exercise
        ↓
EX8
Progressive Exercise Set
```

and:

> **Block #13 — ExerciseBlock is now fully defined from EX1 through EX8.**

The next family is explicitly:

> **#14 — TaskBlock — 8 Versions (T1–T8)**

Therefore:

## **Do not invent EX9.**

Any future EX9 would require a deliberate new architecture/content decision.

---

# 29. Production / UBRC / ILS / LSNB / RSSB evidence check

I specifically searched the actual ExerciseBlock file for the production/runtime terms.

| Contract / implementation | Evidence in actual file |
|---|---|
| UBRC | ❌ Not found |
| ILS | ⚠️ Word appears incidentally, not as architecture |
| LSNB | ❌ Not found |
| RSSB | ❌ Not found |
| `TutorialBlockRenderer` | ❌ Not found |
| `tutorial_sections` | ❌ Not found |
| `navigationNodeId` | ❌ Not found |
| `subtopicId` | ❌ Not found |
| `runtimeContext` | ❌ Not found |
| production certification | ❌ Not found |

The four incidental `ILS` matches are ordinary textual uses around exercise behavior/code examples, not an ILS architectural contract.

Therefore I would **not** interpret those occurrences as evidence of ILS integration.

---

# 30. Important distinction about analytics

There is a particularly important potential trap here.

The file describes:

```text
attempts
hintsUsed
timeSpent
testsPassed
testsFailed
retries
completion
solutionViewed
```

and calls these learning analytics.

That does **not** establish:

```text
ExerciseBlock
      ↓
ILS API
      ↓
ils_block_visits
ils_block_active_time
```

The Markdown doesn't establish that connection.

So for our evidence register:

> **Exercise analytics are a verified reference requirement/pattern. ILS persistence is not verified by this file.**

This follows exactly the evidence boundary we've been applying to the previous families.

---

# 31. Important distinction about renderer

The file says:

> “The renderer selects the appropriate presentation from `type + version`.”

That is a **reference rendering concept**.

It does not establish that your actual production `TutorialBlockRenderer` currently supports:

```text
exercise + EX1
exercise + EX2
...
exercise + EX8
```

That requires repository/runtime evidence later.

Therefore:

```text
Markdown renderer description
        ≠
Production renderer implementation
```

---

# 32. ExerciseBlock evidence classification

Using the same evidence register we've been maintaining:

| Area | Status |
|---|---|
| ExerciseBlock family | ✅ Verified |
| EX1–EX8 | ✅ Verified |
| EX1 semantics | ✅ Verified |
| EX2 semantics | ✅ Verified |
| EX3 semantics | ✅ Verified |
| EX4 semantics | ✅ Verified |
| EX5 semantics | ✅ Verified |
| EX6 semantics | ✅ Verified |
| EX7 semantics | ✅ Verified |
| EX8 semantics | ✅ Verified |
| Final EX1–EX8 architecture | ✅ Verified |
| EX8 final | ✅ Verified |
| Family closure | ✅ Verified |
| Practice progression | ✅ Verified |
| Completion models | ✅ Verified |
| Hint model | ✅ Verified |
| Retry model | ✅ Verified |
| Exercise analytics concept | ✅ Verified |
| Mastery caution | ✅ Verified |
| QuestionBlock separation | ✅ Verified |
| QuizBlock separation | ✅ Verified |
| ProjectBlock separation | ✅ Verified |
| JSON/reference envelope | ✅ Verified |
| Accessibility intent | ✅ Verified |
| Responsive intent | ✅ Verified |
| SUIA visual contract | ✅ Verified |
| Production DB schema | ❌ Not established |
| `tutorial_sections` | ❌ Not established |
| Production renderer | ❌ Not established |
| Composer registration | ❌ Not established |
| UBRC | ❌ Not established |
| ILS | ❌ Not established |
| LSNB | ❌ Not established |
| RSSB | ❌ Not established |
| Production certification | ❌ Not established |

---

# 33. Authoritative corpus register after File 13

We can now record:

| # | Family | Versions | Semantic progression | Closure |
|---|---|---|---|---|
| **12** | QuestionBlock | Q1–Q8 | Recall → Explain → Reason → Predict → Trace → Analyze → Apply → Synthesize | Q8 final |
| **13** | **ExerciseBlock** | **EX1–EX8** | **Recall → Implement → Trace → Debug → Guided → Independent → Challenge → Progressive Mastery** | **EX8 final** |

The distinction between the two families is now very clear:

```text
QUESTIONBLOCK
      ↓
THINK
      ↓
EXPLAIN / REASON / PREDICT / ANALYZE / APPLY

EXERCISEBLOCK
      ↓
DO
      ↓
COMPLETE / BUILD / TRACE / FIX / PRACTICE / SOLVE
```

And the critical rule is:

> **Similar interaction patterns do not make the blocks duplicates when their educational roles differ.**

---

# 34. Final reconciliation

## **FILE 13 — ExerciseBlock — REVIEWED AND RECONCILED**

**Family:** ExerciseBlock  
**Family number:** 13  
**Authoritative versions:** **EX1–EX8**  
**Final version:** **EX8**  
**Family status:** **COMPLETE / CLOSED**

### Authoritative progression

```text
EX1  Fill in the Blank
     → RECALL

EX2  Complete the Code
     → IMPLEMENT

EX3  Predict the Output
     → TRACE

EX4  Fix the Code
     → DEBUG

EX5  Guided Exercise
     → GUIDED BUILDING

EX6  Independent Exercise
     → INDEPENDENT BUILDING

EX7  Challenge Exercise
     → ADVANCED PROBLEM SOLVING

EX8  Progressive Exercise Set
     → PROGRESSIVE MASTERY
```

### Established by the actual Markdown

- EX1–EX8
- individual learning semantics
- version boundaries
- practice progression
- completion models
- hints
- retries
- validation
- hidden tests
- analytics concepts
- mastery caution
- responsive/accessibility intent
- SUIA visual language
- JSON/reference structures
- relationship to QuestionBlock
- relationship to QuizBlock
- relationship to ProjectBlock
- EX8 family closure

### Not established by the actual Markdown

- production `tutorial_sections`
- production renderer implementation
- Tutorial Composer registration
- UBRC
- ILS integration
- LSNB integration
- RSSB integration
- production certification

So the authoritative corpus entry is:

> **FILE 13 — ExerciseBlock — EX1–EX8 — FULLY SPECIFIED — EX8 FINAL — FAMILY CLOSED — PRODUCTION/UBRC/ILS/LSNB/RSSB NOT ESTABLISHED BY THIS FILE.**

**Next: FILE 14 — `TaskBlock.md`, whose T-series must be reviewed independently rather than inferred from ExerciseBlock.**