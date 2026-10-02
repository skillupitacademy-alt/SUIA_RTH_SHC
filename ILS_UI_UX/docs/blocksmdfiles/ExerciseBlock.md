# BLOCK 13 — ExerciseBlock

## EX1–EX8 — Complete 8-Version Architecture

Yes. We will now move to **#13 ExerciseBlock**, while keeping the exact sequence you have committed to.

| Version | Presentation                 | Primary Purpose                                      |
| ------- | ---------------------------- | ---------------------------------------------------- |
| **EX1** | **Fill in the Blank**        | Complete a missing concept/code element              |
| **EX2** | **Complete the Code**        | Finish partially written code                        |
| **EX3** | **Predict the Output**       | Execute and predict a result through practice        |
| **EX4** | **Fix the Code**             | Identify and correct broken code                     |
| **EX5** | **Guided Exercise**          | Solve with structured guidance                       |
| **EX6** | **Independent Exercise**     | Solve independently                                  |
| **EX7** | **Challenge Exercise**       | Solve a difficult practical problem                  |
| **EX8** | **Progressive Exercise Set** | Solve a sequence of increasingly difficult exercises |

The important distinction is that **QuestionBlock is primarily about questioning and thinking**, while **ExerciseBlock is about doing**.

---

# 1. What Is ExerciseBlock?

The ExerciseBlock is the **practice engine of the Tutorial Engine**.

Its learning progression is:

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

QuestionBlock asks:

> **Can you explain or reason about this?**

ExerciseBlock asks:

> **Can you actually perform the task?**

---

# 2. QuestionBlock vs ExerciseBlock

This separation should remain locked.

### QuestionBlock

```text
Q5
Predict the Output
```

The learner is primarily answering a question.

### ExerciseBlock

```text
EX3
Predict the Output
```

The learner is given a **practice task** where they must perform the operation.

The presentation name can be similar, but the **educational role is different**.

---

# 3. Why EX3 Can Also Be "Predict the Output"

You specifically committed to:

> **EX3 — Predict the Output**

This is perfectly valid.

The distinction is:

```text
QuestionBlock Q5
        ↓
Concept checking
        ↓
"Can you predict this?"

ExerciseBlock EX3
        ↓
Practice
        ↓
"Perform this prediction exercise yourself."
```

The same interaction pattern can therefore exist in both blocks without making them duplicates.

---

# 4. Complete EX1 → EX8 Progression

The eight ExerciseBlock versions create a deliberate practice ladder:

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

This is a strong sequence.

---

# 5. EX1 — Fill in the Blank

## Purpose

EX1 is the smallest exercise unit.

The learner receives an incomplete statement, expression, or code fragment and must fill the missing part.

The mental model:

```text
PARTIAL KNOWLEDGE
       ↓
RECALL
       ↓
COMPLETE
       ↓
VERIFY
```

---

## Example — Python

```python
name = ______
print(name)
```

Question:

> Fill in the blank so that the program prints `Python`.

Expected:

```python
"Python"
```

---

## Example — List

```python
numbers = [1, 2]
numbers.______(3)
```

Expected:

```text
append
```

---

## Example — Conditional

```python
x = 10

if x _____ 5:
    print("Large")
```

Expected:

```text
>
```

---

## EX1 JSON

```json
{
  "type": "exercise",
  "version": "EX1",
  "presentation": "Fill in the Blank",

  "content": {
    "instruction": "Fill in the blank so that the code prints Python.",
    "code": "name = ______\nprint(name)",
    "language": "python",
    "blanks": [
      {
        "id": "blank1",
        "expectedAnswers": ["\"Python\"", "'Python'"]
      }
    ],
    "explanation": "The variable must contain the string Python.",
    "keyConcepts": [
      "variables",
      "strings",
      "assignment"
    ]
  }
}
```

---

# 6. EX1 Interaction

```text
┌──────────────────────────────────────────────┐
│ EXERCISE                                     │
│ FILL IN THE BLANK                            │
├──────────────────────────────────────────────┤
│                                              │
│ Complete the code:                           │
│                                              │
│ name = ┌──────────────┐                      │
│        │              │                      │
│        └──────────────┘                      │
│ print(name)                                  │
│                                              │
│ [ Check Answer ]                             │
└──────────────────────────────────────────────┘
```

After completion:

```text
✓ Correct

name contains the string "Python".
```

---

# 7. EX2 — Complete the Code

EX2 moves beyond one missing element.

The learner receives **partially implemented code** and must complete the missing logic.

```text
PARTIAL IMPLEMENTATION
        ↓
UNDERSTAND REQUIREMENT
        ↓
WRITE CODE
        ↓
VERIFY
```

---

## Example

```python
def add(a, b):
    ______

print(add(2, 3))
```

Task:

> Complete the function so that it returns the sum of `a` and `b`.

Expected:

```python
return a + b
```

---

## More Advanced Example

```python
def is_even(number):
    if __________:
        return True
    return False
```

Expected:

```python
number % 2 == 0
```

---

# 8. EX2 JSON

```json
{
  "type": "exercise",
  "version": "EX2",
  "presentation": "Complete the Code",

  "content": {
    "instruction": "Complete the function so that it returns the sum of a and b.",
    "starterCode": "def add(a, b):\n    # complete here\n\nprint(add(2, 3))",
    "language": "python",
    "expectedBehavior": "The function returns a + b.",
    "referenceSolution": "def add(a, b):\n    return a + b",
    "keyConcepts": [
      "functions",
      "parameters",
      "return"
    ]
  }
}
```

---

# 9. EX2 vs EX1

```text
EX1
Missing piece
    ↓
Fill it

EX2
Missing implementation
    ↓
Build it
```

EX1 tests **completion**.

EX2 tests **implementation**.

---

# 10. EX3 — Predict the Output

EX3 provides a code sample and asks the learner to determine the output as a **practice exercise**.

```text
CODE
 ↓
MENTALLY EXECUTE
 ↓
PREDICT
 ↓
SUBMIT
 ↓
VERIFY
```

---

## Example

```python
items = [1, 2]
items.append(3)

print(items)
```

Task:

> Predict the exact output.

Expected:

```text
[1, 2, 3]
```

---

## More Advanced EX3

```python
a = [1, 2]
b = a

b.append(3)

print(a)
print(b)
```

Expected:

```text
[1, 2, 3]
[1, 2, 3]
```

---

# 11. EX3 JSON

```json
{
  "type": "exercise",
  "version": "EX3",
  "presentation": "Predict the Output",

  "content": {
    "instruction": "Predict the exact output before running the code.",
    "code": "a = [1, 2]\nb = a\nb.append(3)\nprint(a)\nprint(b)",
    "language": "python",
    "expectedOutput": "[1, 2, 3]\n[1, 2, 3]",
    "explanation": "Both variables reference the same mutable list.",
    "keyConcepts": [
      "references",
      "aliasing",
      "mutation"
    ]
  }
}
```

---

# 12. EX3 vs QuestionBlock Q5

This is important.

```text
Q5
Question
"What will this code print?"

EX3
Exercise
"Practice predicting the output of this code."
```

The underlying interaction may be similar, but:

```text
Q5
→ Concept verification

EX3
→ Skill practice
```

Exercise completion can also contribute to:

* practice progress
* mastery
* retry
* hints
* exercise sequencing

without becoming a quiz score.

---

# 13. EX4 — Fix the Code

EX4 introduces **repair**.

The learner receives broken code and must identify and correct it.

```text
BROKEN CODE
    ↓
IDENTIFY PROBLEM
    ↓
UNDERSTAND CAUSE
    ↓
MODIFY CODE
    ↓
VERIFY
```

---

## Example

```python
numbers = [1, 2, 3]

for i in range(len(numbers)):
    print(numbers[i + 1])
```

Task:

> Fix the code so every element is printed without causing an error.

One solution:

```python
for i in range(len(numbers)):
    print(numbers[i])
```

---

# 14. EX4 Another Example

Broken:

```python
def add(a, b):
    print(a + b)

result = add(2, 3)
print(result)
```

Task:

> Fix the function so `result` contains the calculated value.

Expected correction:

```python
def add(a, b):
    return a + b
```

---

# 15. EX4 JSON

```json
{
  "type": "exercise",
  "version": "EX4",
  "presentation": "Fix the Code",

  "content": {
    "instruction": "Fix the code so that it prints every list element.",
    "buggyCode": "numbers = [1, 2, 3]\n\nfor i in range(len(numbers)):\n    print(numbers[i + 1])",
    "language": "python",
    "expectedBehavior": "Print 1, 2, and 3 without raising an exception.",
    "referenceSolution": "numbers = [1, 2, 3]\n\nfor i in range(len(numbers)):\n    print(numbers[i])",
    "explanation": "The original code accesses index len(numbers), which is outside the valid index range.",
    "keyConcepts": [
      "indexing",
      "range",
      "IndexError"
    ]
  }
}
```

---

# 16. EX4 vs MistakeBlock

Another important distinction:

### MistakeBlock

```text
Here is the mistake.
Why is it wrong?
How should it be corrected?
```

### EX4

```text
Here is broken code.
YOU fix it.
```

Therefore:

```text
MistakeBlock
→ TEACH ABOUT THE MISTAKE

ExerciseBlock EX4
→ PRACTICE FIXING THE MISTAKE
```

---

# 17. EX5 — Guided Exercise

EX5 moves from small tasks into structured problem solving.

The learner receives **progressive guidance**.

```text
PROBLEM
  ↓
HINT 1
  ↓
STEP 1
  ↓
HINT 2
  ↓
STEP 2
  ↓
SOLUTION
```

The learner still performs the work.

---

# 18. EX5 Example

Task:

> Write a function that returns the largest number in a list.

Guidance:

### Step 1

> What variable should store the largest value found so far?

### Step 2

> What should its initial value be?

### Step 3

> How should each list element be compared?

### Step 4

> What should the function return?

The learner gradually constructs:

```python
def find_max(numbers):
    largest = numbers[0]

    for number in numbers:
        if number > largest:
            largest = number

    return largest
```

---

# 19. EX5 Guidance Levels

```text
Level 0
No hint

Level 1
Concept hint

Level 2
Strategic hint

Level 3
Implementation hint

Level 4
Near-solution guidance
```

The system can reveal hints progressively.

---

# 20. EX5 JSON

```json
{
  "type": "exercise",
  "version": "EX5",
  "presentation": "Guided Exercise",

  "content": {
    "instruction": "Write a function that returns the largest number in a list.",

    "language": "python",

    "starterCode": "def find_max(numbers):\n    # write your solution here\n",

    "guidance": [
      {
        "level": 1,
        "hint": "You need to keep track of the largest value found so far."
      },
      {
        "level": 2,
        "hint": "Start with one value from the list as the current largest value."
      },
      {
        "level": 3,
        "hint": "Loop through the remaining values and compare each one with largest."
      }
    ],

    "referenceSolution": "def find_max(numbers):\n    largest = numbers[0]\n    for number in numbers[1:]:\n        if number > largest:\n            largest = number\n    return largest",

    "keyConcepts": [
      "loops",
      "comparison",
      "variables",
      "functions"
    ]
  }
}
```

---

# 21. EX6 — Independent Exercise

EX6 removes the scaffolding.

The learner receives:

```text
PROBLEM
   ↓
THEIR OWN PLAN
   ↓
THEIR OWN IMPLEMENTATION
   ↓
TEST
   ↓
VERIFY
```

The learner should not be given step-by-step hints by default.

---

# 22. EX6 Example

> Write a function called `count_even(numbers)` that returns the number of even integers in the list.

Example:

```python
count_even([1, 2, 3, 4, 6])
```

Expected:

```text
3
```

The learner must decide:

* iteration strategy
* condition
* counter
* return value

---

# 23. EX6 JSON

```json
{
  "type": "exercise",
  "version": "EX6",
  "presentation": "Independent Exercise",

  "content": {
    "instruction": "Write a function that returns the number of even integers in a list.",

    "language": "python",

    "starterCode": "def count_even(numbers):\n    # write your solution here\n",

    "examples": [
      {
        "input": "[1, 2, 3, 4, 6]",
        "expectedOutput": "3"
      },
      {
        "input": "[1, 3, 5]",
        "expectedOutput": "0"
      }
    ],

    "constraints": [
      "Return an integer.",
      "Do not modify the input list."
    ],

    "referenceSolution": "def count_even(numbers):\n    count = 0\n    for number in numbers:\n        if number % 2 == 0:\n            count += 1\n    return count",

    "keyConcepts": [
      "loops",
      "conditionals",
      "modulo",
      "functions"
    ]
  }
}
```

---

# 24. EX5 vs EX6

```text
EX5
Guided
 ↓
Hints
 ↓
Structured steps
 ↓
Learner solves

EX6
Independent
 ↓
Problem
 ↓
Learner decides strategy
 ↓
Learner solves
```

This is an important progression.

---

# 25. EX7 — Challenge Exercise

EX7 introduces a more demanding problem.

The learner should combine multiple concepts.

```text
MULTIPLE CONCEPTS
       ↓
COMPLEX REQUIREMENT
       ↓
DESIGN SOLUTION
       ↓
IMPLEMENT
       ↓
TEST
```

---

# 26. EX7 Example

> Build a function that receives a list of integers and returns a dictionary containing:
>
> * `count`
> * `sum`
> * `average`
> * `minimum`
> * `maximum`

Example:

```python
analyze([10, 20, 30])
```

Expected:

```python
{
    "count": 3,
    "sum": 60,
    "average": 20.0,
    "minimum": 10,
    "maximum": 30
}
```

This requires multiple concepts.

---

# 27. EX7 Another Example — Authentication

> Implement a permission-checking function that determines whether an authenticated user may perform an action on a resource.

Possible inputs:

```text
user
resource
action
```

The learner must reason about:

```text
identity
permissions
action
resource
authorization
```

This is considerably more demanding than EX6.

---

# 28. EX7 JSON

```json
{
  "type": "exercise",
  "version": "EX7",
  "presentation": "Challenge Exercise",

  "content": {

    "instruction": "Build a function that analyzes a list of integers and returns count, sum, average, minimum, and maximum.",

    "language": "python",

    "starterCode": "def analyze(numbers):\n    # implement your solution\n",

    "examples": [
      {
        "input": "[10, 20, 30]",
        "expectedOutput": {
          "count": 3,
          "sum": 60,
          "average": 20.0,
          "minimum": 10,
          "maximum": 30
        }
      }
    ],

    "constraints": [
      "Handle an empty list appropriately.",
      "Do not modify the input.",
      "Return a dictionary."
    ],

    "keyConcepts": [
      "iteration",
      "aggregation",
      "conditionals",
      "functions",
      "data structures"
    ],

    "referenceSolution": ""
  }
}
```

For a challenge, the reference solution can be hidden from the learner until the exercise is completed or the learner explicitly requests the solution.

---

# 29. EX7 Challenge Characteristics

A strong EX7 should contain:

```text
✓ Multiple concepts
✓ Meaningful constraints
✓ More than one implementation decision
✓ Edge cases
✓ Testing requirements
✓ Realistic complexity
```

But it should **not become a full project**.

That distinction belongs to ProjectBlock.

---

# 30. EX7 vs ProjectBlock

```text
EX7
Challenge
 ↓
One substantial problem
 ↓
Practice

ProjectBlock
 ↓
Larger real-world system
 ↓
Multiple components
 ↓
Architecture
 ↓
Deliverable
```

So EX7 remains an exercise.

---

# 31. EX8 — Progressive Exercise Set

EX8 is the most comprehensive ExerciseBlock version.

Instead of one exercise, the learner completes a **sequence of exercises that progressively increases in difficulty**.

```text
EX8
│
├── Exercise 1 — Foundation
├── Exercise 2 — Basic Application
├── Exercise 3 — Intermediate
├── Exercise 4 — Advanced
└── Exercise 5 — Challenge
```

This creates a complete practice journey.

---

# 32. EX8 Example — Python Lists

### Exercise 1

Create a list.

```python
numbers = [1, 2, 3]
```

### Exercise 2

Append an element.

```python
numbers.append(4)
```

### Exercise 3

Remove an element.

### Exercise 4

Write a function that filters values.

### Exercise 5

Write a function that processes a large list efficiently.

The learner progresses through increasing complexity.

---

# 33. EX8 Example — Exception Handling

A progressive set could be:

### EX8.1

Catch a `ValueError`.

### EX8.2

Handle multiple exception types.

### EX8.3

Use `finally`.

### EX8.4

Create a custom exception.

### EX8.5

Design exception handling across function boundaries.

This aligns naturally with the teaching framework.

---

# 34. EX8 JSON

```json
{
  "type": "exercise",
  "version": "EX8",
  "presentation": "Progressive Exercise Set",

  "content": {

    "title": "Python Exception Handling Practice",

    "instruction": "Complete each exercise in order. Each exercise introduces an additional level of complexity.",

    "exercises": [
      {
        "id": "EX8-1",
        "title": "Catch a ValueError",
        "difficulty": "easy",
        "type": "code",
        "concepts": [
          "try",
          "except"
        ]
      },
      {
        "id": "EX8-2",
        "title": "Handle Multiple Exceptions",
        "difficulty": "easy-medium",
        "concepts": [
          "multiple exception types"
        ]
      },
      {
        "id": "EX8-3",
        "title": "Use Finally",
        "difficulty": "medium",
        "concepts": [
          "finally",
          "cleanup"
        ]
      },
      {
        "id": "EX8-4",
        "title": "Create a Custom Exception",
        "difficulty": "medium-hard",
        "concepts": [
          "custom exceptions",
          "inheritance"
        ]
      },
      {
        "id": "EX8-5",
        "title": "Design Exception Propagation",
        "difficulty": "challenge",
        "concepts": [
          "exception propagation",
          "abstraction boundaries",
          "error handling"
        ]
      }
    ]

  }
}
```

---

# 35. EX8 Progression Model

```text
                    EX8
                     │
                     ▼
             ┌──────────────┐
             │ Exercise 1   │
             │ Foundation   │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ Exercise 2   │
             │ Application  │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ Exercise 3   │
             │ Intermediate │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ Exercise 4   │
             │ Advanced     │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ Exercise 5   │
             │ Challenge    │
             └──────────────┘
```

---

# 36. EX8 Completion Rule

By default, the next exercise should become available after the current exercise is sufficiently completed.

Possible modes:

```text
strict
recommended
free_navigation
```

### Strict

```text
EX8.1
 ↓
complete
 ↓
EX8.2
```

### Recommended

Learner can continue but receives guidance.

### Free Navigation

All exercises remain accessible.

The content author can choose the mode.

---

# 37. ExerciseBlock Hint System

Hints are especially important for EX5–EX7.

Possible structure:

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

---

# 38. ExerciseBlock Attempts

Unlike QuizBlock, exercises can support repeated attempts naturally.

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

The goal is **learning through iteration**.

---

# 39. ExerciseBlock Progress

Exercise completion can be represented as:

```text
○ Not Started
◐ In Progress
✓ Completed
↻ Retry
```

For EX8:

```text
EX8 Progressive Set

✓ Exercise 1
✓ Exercise 2
◐ Exercise 3
○ Exercise 4
○ Exercise 5
```

---

# 40. ExerciseBlock Does Not Need Quiz Scoring

Do not automatically turn:

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
Mastered
```

If formal scoring is required, **QuizBlock** is the appropriate block.

---

# 41. Exercise Completion

Possible completion criteria:

```json
{
  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

For a non-code exercise:

```json
{
  "completion": {
    "mode": "response-submitted"
  }
}
```

For EX1:

```text
expected answer
```

For EX2–EX7:

```text
tests
```

For EX8:

```text
exercise-set progression
```

---

# 42. Code Exercise Testing

For executable exercises, the architecture should support:

```text
Learner Code
    ↓
Test Cases
    ↓
Execution Environment
    ↓
Results
    ↓
Feedback
```

Example:

```text
Test 1
Input: [1, 2, 3]
Expected: 6
Result: ✓

Test 2
Input: []
Expected: 0
Result: ✓

Test 3
Input: [-1, 5]
Expected: 4
Result: ✓
```

---

# 43. Important Security Boundary

As with Q5/Q6, arbitrary learner code should **not execute inside the main API server**.

Conceptually:

```text
Browser
   ↓
Tutorial API
   ↓
Exercise Execution Service
   ↓
Isolated Sandbox
   ↓
Tests
   ↓
Results
```

This should be treated as a separate execution capability.

The ExerciseBlock content model should not assume that code execution is always available.

---

# 44. ExerciseBlock Component Architecture

```text
ExerciseBlock
│
├── ExerciseHeader
│
├── InstructionPanel
│
├── ProblemPanel
│
├── CodeEditor / AnswerInput
│
├── HintPanel
│
├── TestPanel
│
├── Submit / Run Button
│
├── ResultPanel
│
├── ExplanationPanel
│
├── ReferenceSolution
│
├── ProgressPanel
│
└── CompletionPanel
```

Different versions activate different components.

---

# 45. Version → Component Mapping

| Component          |      EX1 |      EX2 |      EX3 |      EX4 |      EX5 |      EX6 |      EX7 |           EX8 |
| ------------------ | -------: | -------: | -------: | -------: | -------: | -------: | -------: | ------------: |
| Instruction        |        ✅ |        ✅ |        ✅ |        ✅ |        ✅ |        ✅ |        ✅ |             ✅ |
| Blank Input        |        ✅ |        ❌ |        ❌ |        ❌ |        ❌ |        ❌ |        ❌ |             ❌ |
| Code Editor        | Optional |        ✅ |        ❌ |        ✅ |        ✅ |        ✅ |        ✅ |             ✅ |
| Output Input       |        ❌ | Optional |        ✅ | Optional | Optional | Optional | Optional |      Optional |
| Hints              | Optional | Optional | Optional | Optional |        ✅ | Optional | Optional |   Progressive |
| Tests              | Optional |        ✅ |        ❌ |        ✅ |        ✅ |        ✅ |        ✅ |             ✅ |
| Reference Solution |        ✅ |        ✅ |        ✅ |        ✅ |        ✅ |        ✅ | Optional |      Optional |
| Progress           |    Basic |    Basic |    Basic |    Basic |    Basic |    Basic | Advanced | **Set-level** |
| Multiple Exercises |        ❌ |        ❌ |        ❌ |        ❌ |        ❌ |        ❌ |        ❌ |             ✅ |

---

# 46. ExerciseBlock UI Pattern

The common visual hierarchy should be:

```text
EXERCISE
   ↓
TITLE
   ↓
INSTRUCTION
   ↓
PROBLEM
   ↓
WORK AREA
   ↓
HINT / HELP
   ↓
CHECK / RUN
   ↓
FEEDBACK
   ↓
NEXT
```

---

# 47. EX1 UI

```text
┌───────────────────────────────────────┐
│ EXERCISE                              │
│ FILL IN THE BLANK                     │
├───────────────────────────────────────┤
│ Complete the code:                    │
│                                       │
│ name = [____________]                 │
│ print(name)                           │
│                                       │
│ [ Check ]                             │
└───────────────────────────────────────┘
```

---

# 48. EX2 UI

```text
┌───────────────────────────────────────┐
│ COMPLETE THE CODE                     │
├───────────────────────────────────────┤
│ Write the missing function logic.     │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ def add(a, b):                    │ │
│ │     # your code                   │ │
│ └───────────────────────────────────┘ │
│                                       │
│ [ Run Tests ]                         │
└───────────────────────────────────────┘
```

---

# 49. EX4 UI

```text
┌───────────────────────────────────────┐
│ FIX THE CODE                          │
├───────────────────────────────────────┤
│ The following code contains a bug.    │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ buggy code                        │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Fix it below:                         │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ your corrected code               │ │
│ └───────────────────────────────────┘ │
│                                       │
│ [ Run Tests ]                         │
└───────────────────────────────────────┘
```

---

# 50. EX5 UI

```text
┌─────────────────────────────────────────────┐
│ GUIDED EXERCISE                             │
├─────────────────────────────────────────────┤
│ TASK                                        │
│ Write a function that finds the maximum.   │
│                                             │
│ STEP 1                                      │
│ What value should you track first?          │
│                                             │
│ [ Show Hint ]                               │
│                                             │
│ YOUR CODE                                   │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Run Tests ]                               │
└─────────────────────────────────────────────┘
```

---

# 51. EX6 UI

EX6 should deliberately feel less guided:

```text
┌─────────────────────────────────────────────┐
│ INDEPENDENT EXERCISE                        │
├─────────────────────────────────────────────┤
│ TASK                                        │
│ Write count_even(numbers).                  │
│                                             │
│ REQUIREMENTS                                │
│ • Return an integer                         │
│ • Do not modify the input                   │
│                                             │
│ YOUR SOLUTION                               │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Run Tests ]                               │
└─────────────────────────────────────────────┘
```

---

# 52. EX7 UI

EX7 should emphasize the challenge:

```text
┌─────────────────────────────────────────────┐
│ ⚡ CHALLENGE EXERCISE                       │
├─────────────────────────────────────────────┤
│                                             │
│ PROBLEM                                     │
│ Build a reusable permission-checking        │
│ function for the following requirements.    │
│                                             │
│ CONSTRAINTS                                 │
│ • Multiple roles                            │
│ • Multiple permissions                      │
│ • Unknown permission must fail safely       │
│                                             │
│ YOUR IMPLEMENTATION                         │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Run Tests ]                               │
└─────────────────────────────────────────────┘
```

---

# 53. EX8 UI

```text
┌─────────────────────────────────────────────┐
│ PROGRESSIVE EXERCISE SET                    │
├─────────────────────────────────────────────┤
│                                             │
│ ✓ 1  Foundation                             │
│ ✓ 2  Basic Application                      │
│ ◐ 3  Intermediate                           │
│ ○ 4  Advanced                               │
│ ○ 5  Challenge                              │
│                                             │
├─────────────────────────────────────────────┤
│ CURRENT EXERCISE                            │
│                                             │
│ Exercise 3 — Intermediate                   │
│                                             │
│ [ Problem ]                                 │
│                                             │
│ [ Code / Answer Area ]                      │
│                                             │
│ [ Run Tests ]                               │
└─────────────────────────────────────────────┘
```

---

# 54. ExerciseBlock Data Model

A common envelope can be used:

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

The renderer selects the appropriate presentation from:

```text
type + version
```

---

# 55. EX1–EX8 Completion Modes

| Version | Typical Completion                      |
| ------- | --------------------------------------- |
| **EX1** | Correct blank(s)                        |
| **EX2** | Required tests pass                     |
| **EX3** | Correct predicted output                |
| **EX4** | Tests pass after correction             |
| **EX5** | Guided task completed                   |
| **EX6** | Independent solution passes tests       |
| **EX7** | Challenge requirements satisfied        |
| **EX8** | Progressive exercise sequence completed |

---

# 56. Difficulty Progression

The eight versions should not be interpreted as simply:

```text
easy → hard
```

They represent **different practice modes**.

The progression is better understood as:

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

---

# 57. ExerciseBlock and Other Tutorial Blocks

ExerciseBlock naturally consumes knowledge from other blocks.

Example:

```text
DefinitionBlock
      ↓
Explain concept
      ↓
CodeBlock
      ↓
Show implementation
      ↓
ExecutionBlock
      ↓
Explain runtime
      ↓
MistakeBlock
      ↓
Show common error
      ↓
BestPracticeBlock
      ↓
Show correct approach
      ↓
ExerciseBlock
      ↓
Learner practices
```

This is exactly where ExerciseBlock fits into the overall Tutorial Engine.

---

# 58. ExerciseBlock and QuestionBlock

A strong lesson can use them together:

```text
Definition
   ↓
Code
   ↓
Question Q1
   ↓
Question Q3
   ↓
Question Q5
   ↓
Exercise EX1
   ↓
Exercise EX2
   ↓
Exercise EX4
   ↓
Exercise EX5
   ↓
Exercise EX6
```

The learner moves from:

> **understanding**

to:

> **doing**.

---

# 59. ExerciseBlock and QuizBlock

The recommended sequence can be:

```text
LEARN
 ↓
QUESTION
 ↓
EXERCISE
 ↓
QUIZ
```

For example:

```text
DefinitionBlock
     ↓
QuestionBlock
     ↓
ExerciseBlock
     ↓
QuizBlock
```

The exercise provides practice before formal assessment.

---

# 60. ExerciseBlock and ProjectBlock

Later:

```text
Exercise EX6
      ↓
Exercise EX7
      ↓
ProjectBlock
```

EX7 should prepare the learner for project work without becoming the project itself.

---

# 61. ExerciseBlock Analytics

ExerciseBlock can produce useful learning signals:

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

These are **learning analytics**, not necessarily assessment scores.

---

# 62. Mastery Signal

For example:

```text
EX1 ✓
EX2 ✓
EX3 ✓
EX4 ✓
EX5 ✓
EX6 ✓
EX7 ✓
```

The system could infer:

```text
Practice proficiency
        ↑
Strong
```

But this should not automatically equal:

> "Mastered."

Mastery should ideally consider other evidence such as QuizBlock and later application.

---

# 63. ExerciseBlock Authoring Rules

Content authors should:

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

---

# 64. ExerciseBlock Final Mental Model

```text
                    EXERCISEBLOCK
                          │
                          ▼
             ┌──────────────────────┐
             │ EX1                  │
             │ Fill in Blank        │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX2                  │
             │ Complete Code        │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX3                  │
             │ Predict Output       │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX4                  │
             │ Fix Code             │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX5                  │
             │ Guided               │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX6                  │
             │ Independent          │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX7                  │
             │ Challenge            │
             └──────────┬───────────┘
                        ↓
             ┌──────────────────────┐
             │ EX8                  │
             │ Progressive Set      │
             └──────────────────────┘
```

---

# 65. Final EX1–EX8 Technical Specification

| Version | Presentation                 | Primary Interaction       | Guidance    | Difficulty       |
| ------- | ---------------------------- | ------------------------- | ----------- | ---------------- |
| **EX1** | **Fill in the Blank**        | Complete missing element  | High        | Easy             |
| **EX2** | **Complete the Code**        | Implement missing logic   | Medium      | Easy–Medium      |
| **EX3** | **Predict the Output**       | Predict execution result  | Low         | Easy–Medium      |
| **EX4** | **Fix the Code**             | Repair implementation     | Medium      | Medium           |
| **EX5** | **Guided Exercise**          | Solve with scaffolding    | High        | Medium           |
| **EX6** | **Independent Exercise**     | Solve independently       | Low         | Medium–Hard      |
| **EX7** | **Challenge Exercise**       | Multi-concept problem     | Minimal     | Hard             |
| **EX8** | **Progressive Exercise Set** | Multiple escalating tasks | Progressive | Easy → Challenge |

---

# 66. Final ExerciseBlock Architecture

### **EX1 — Fill in the Blank**

> Complete a missing piece.

### **EX2 — Complete the Code**

> Finish a partial implementation.

### **EX3 — Predict the Output**

> Practice mentally executing code.

### **EX4 — Fix the Code**

> Repair broken implementation.

### **EX5 — Guided Exercise**

> Solve with progressive hints.

### **EX6 — Independent Exercise**

> Solve independently.

### **EX7 — Challenge Exercise**

> Combine multiple concepts to solve a demanding problem.

### **EX8 — Progressive Exercise Set**

> Complete an intentionally sequenced set of exercises from foundational to challenging.

---

# 67. Block 13 Status

## **ExerciseBlock — 8 Versions**

| Version                            | Status     |
| ---------------------------------- | ---------- |
| **EX1 — Fill in the Blank**        | ✅ Complete |
| **EX2 — Complete the Code**        | ✅ Complete |
| **EX3 — Predict the Output**       | ✅ Complete |
| **EX4 — Fix the Code**             | ✅ Complete |
| **EX5 — Guided Exercise**          | ✅ Complete |
| **EX6 — Independent Exercise**     | ✅ Complete |
| **EX7 — Challenge Exercise**       | ✅ Complete |
| **EX8 — Progressive Exercise Set** | ✅ Complete |

So **#13 ExerciseBlock is now fully defined with the exact 8 versions you committed to.**

The next block in your locked 18-block sequence is:

> **#14 — TaskBlock — 8 Versions (T1–T8)**.



```python

```

Yes — you are correct. **I misunderstood your workflow in the previous response.**

We will **not define all 8 ExerciseBlock versions at once**.

We will follow exactly the same process we used for the previous blocks:

> **One version → fully design/specify it → you say "yes please" → next version.**

So for **#13 ExerciseBlock**, we start only with:

# 13. ExerciseBlock

## EX1 — Fill in the Blank

The committed sequence remains:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| **EX1** | **Fill in the Blank**    | 🔵 **CURRENT** |
| EX2     | Complete the Code        | ⏳              |
| EX3     | Predict the Output       | ⏳              |
| EX4     | Fix the Code             | ⏳              |
| EX5     | Guided Exercise          | ⏳              |
| EX6     | Independent Exercise     | ⏳              |
| EX7     | Challenge Exercise       | ⏳              |
| EX8     | Progressive Exercise Set | ⏳              |

---

# EX1 — Fill in the Blank

## 1. Purpose

**EX1** is the simplest ExerciseBlock version.

The learner is given an incomplete statement, sentence, expression, or code fragment and must supply the missing part.

The fundamental learning flow is:

```text
LEARNED CONCEPT
      ↓
RECALL
      ↓
IDENTIFY MISSING PART
      ↓
COMPLETE
      ↓
CHECK
      ↓
FEEDBACK
```

The key idea is:

> **The learner must actively produce the missing answer rather than simply recognize it.**

---

# 2. What EX1 Is Designed to Test

EX1 is appropriate for testing:

* terminology
* syntax
* keywords
* operators
* function names
* values
* expressions
* short code fragments
* simple rules
* conceptual statements

Examples:

```text
A Python list is ______.

Expected:
mutable
```

or:

```python
numbers = [1, 2]
numbers.______(3)
```

Expected:

```text
append
```

---

# 3. EX1 Is NOT a QuestionBlock

This distinction is important because we already completed QuestionBlock.

### QuestionBlock

```text
Q1

What method adds an item to the
end of a Python list?
```

The learner answers a question.

### ExerciseBlock

```text
EX1

numbers = [1, 2]
numbers.______(3)
```

The learner **performs a completion task**.

So:

```text
QuestionBlock
    ↓
Question / thinking

ExerciseBlock
    ↓
Action / practice
```

---

# 4. EX1 Learning Model

```text
┌─────────────────────┐
│     CONCEPT         │
│                     │
│  list.append()      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     INCOMPLETE      │
│                     │
│ numbers.______(3)   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│      LEARNER        │
│                     │
│ types: append       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│       CHECK         │
└──────────┬──────────┘
           ↓
      ✓ Correct
```

---

# 5. Types of EX1

EX1 should not be limited to code.

There are several useful forms.

## Type A — Code Blank

```python
numbers = [1, 2]
numbers.______(3)
```

Answer:

```text
append
```

---

## Type B — Syntax Blank

```python
if x _____ 10:
    print(x)
```

Answer:

```text
>
```

---

## Type C — Keyword Blank

```python
_____ x in numbers:
    print(x)
```

Answer:

```text
for
```

---

## Type D — Concept Blank

> A Python list is a ______ collection.

Answer:

> mutable

---

## Type E — Definition Blank

> An exception that occurs when a list index does not exist is called an ______.

Answer:

```text
IndexError
```

---

## Type F — Statement Completion

> Python variables are names that ______ objects.

Expected:

> reference

---

# 6. EX1 Example — Basic Python

### Exercise

Complete the blank:

```python
name = ______
print(name)
```

Instruction:

> Fill in the blank so that the program prints `Python`.

Answer:

```python
"Python"
```

---

# 7. EX1 Example — List

```python
numbers = [10, 20]
numbers.______(30)

print(numbers)
```

Instruction:

> Fill in the missing method so that `30` is added to the end of the list.

Answer:

```text
append
```

Expected output:

```text
[10, 20, 30]
```

---

# 8. EX1 Example — Conditional

```python
age = 20

if age _____ 18:
    print("Adult")
```

Expected:

```text
>=
```

This tests operator recall.

---

# 9. EX1 Example — Loop

```python
numbers = [1, 2, 3]

_____ number in numbers:
    print(number)
```

Expected:

```text
for
```

---

# 10. EX1 Example — Function

```python
def calculate(a, b):
    _____ a + b
```

Expected:

```text
return
```

---

# 11. EX1 Example — Exception Handling

```python
try:
    value = int(input())
except _____:
    print("Invalid number")
```

Expected:

```text
ValueError
```

This is especially useful after teaching exception types.

---

# 12. EX1 Example — Memory

> A variable is better understood as a ______ that refers to an object.

Expected:

```text
name
```

Or:

> Two variables referring to the same object create ______.

Expected:

```text
aliasing
```

This allows EX1 to reinforce conceptual material as well as code.

---

# 13. EX1 Example — Authentication

> Authentication establishes the ______ of the requester.

Expected:

```text
identity
```

Then:

> Authorization determines what that identity is ______ to access.

Expected:

```text
permitted
```

This is useful for terminology reinforcement.

---

# 14. Multiple Blanks

EX1 can contain more than one blank when the blanks form a single coherent task.

Example:

```python
def ______(a, b):
    _____ a + b
```

Expected:

```text
add
return
```

This is still EX1 because the learner is completing a small missing fragment rather than implementing an entire solution.

---

# 15. Blank Difficulty

EX1 itself can have difficulty levels.

### Easy

```python
numbers.______(3)
```

### Medium

```python
if number % _____ == 0:
```

### Harder

```python
result = [x for x in numbers if x _____ 0]
```

The version remains:

> **EX1**

Difficulty does not require a new version.

---

# 16. Answer Types

EX1 should support different answer types.

```text
text
number
operator
keyword
identifier
expression
code fragment
multiple blanks
```

For example:

```json
{
  "answerType": "keyword"
}
```

or:

```json
{
  "answerType": "code-fragment"
}
```

---

# 17. EX1 Exact vs Flexible Answers

Some blanks require an exact answer.

Example:

```python
numbers.______(3)
```

Expected:

```text
append
```

Other blanks may allow equivalent answers.

Example:

```python
name = ______
```

Possible valid answers:

```text
"Python"
'Python'
```

Therefore the content model should allow:

```json
{
  "expectedAnswers": [
    "\"Python\"",
    "'Python'"
  ]
}
```

---

# 18. EX1 Case Sensitivity

The author should explicitly define whether matching is case-sensitive.

For programming keywords:

```text
case-sensitive = true
```

For natural-language conceptual answers, it may be:

```text
case-sensitive = false
```

Example:

```text
Expected:
mutable

Accept:
Mutable
MUTABLE
```

if the author chooses case-insensitive matching.

---

# 19. EX1 Whitespace Handling

For code fragments, the evaluator should normally normalize unnecessary surrounding whitespace.

For example:

```text
append
```

and:

```text
  append
```

should generally be treated as equivalent.

But whitespace-sensitive languages or exercises can explicitly disable normalization.

---

# 20. EX1 Feedback

The feedback should be educational.

### Correct

```text
✓ Correct

append() adds the new element to the
end of the list.
```

### Incorrect

Instead of only:

```text
✗ Wrong
```

use:

```text
Not quite.

Think about the list method that adds
one element to the end of an existing list.
```

---

# 21. EX1 Hint

Hints should not immediately reveal the answer.

Example:

### Exercise

```python
numbers.______(3)
```

### Hint 1

> Think about the list method used to add one element.

### Hint 2

> It starts with the letter `a`.

### Hint 3

> The method name is `append`.

The final hint may reveal the answer, depending on the lesson configuration.

---

# 22. EX1 Hint Model

```text
No Hint
   ↓
Hint 1 — Conceptual
   ↓
Hint 2 — Directional
   ↓
Hint 3 — Strong
   ↓
Answer Reveal
```

This gives the ExerciseBlock a reusable support mechanism.

---

# 23. EX1 UI

A clean UI should focus attention on the missing element.

```text
┌────────────────────────────────────────────┐
│ EXERCISE                                   │
│ FILL IN THE BLANK                          │
├────────────────────────────────────────────┤
│                                            │
│ Complete the code.                         │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ numbers = [1, 2]                       │ │
│ │ numbers. [________] (3)                │ │
│ │                                        │ │
│ │ print(numbers)                          │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [ Show Hint ]        [ Check Answer ]      │
└────────────────────────────────────────────┘
```

---

# 24. EX1 After Correct Answer

```text
┌────────────────────────────────────────────┐
│ ✓ CORRECT                                  │
├────────────────────────────────────────────┤
│                                            │
│ numbers.append(3)                          │
│                                            │
│ append() adds one element to the end of    │
│ the list.                                  │
│                                            │
│ [ Continue ]                               │
└────────────────────────────────────────────┘
```

---

# 25. EX1 After Incorrect Answer

```text
┌────────────────────────────────────────────┐
│ TRY AGAIN                                  │
├────────────────────────────────────────────┤
│                                            │
│ Your answer: extend                        │
│                                            │
│ Think about a method that adds ONE         │
│ element to the end of the list.            │
│                                            │
│ [ Try Again ]       [ Show Hint ]          │
└────────────────────────────────────────────┘
```

This is better than immediately showing the solution.

---

# 26. EX1 Completion Flow

```text
NOT STARTED
     ↓
ANSWERING
     ↓
CHECK
     │
     ├───────────────┐
     ↓               ↓
 INCORRECT         CORRECT
     ↓               ↓
 RETRY             COMPLETE
     │               │
     └──→ CHECK      ↓
                  CONTINUE
```

---

# 27. EX1 State Model

```text
INITIAL
  ↓
ACTIVE
  ↓
ANSWER_ENTERED
  ↓
SUBMITTED
  │
  ├── incorrect → RETRY
  │
  └── correct → COMPLETED
```

Optional:

```text
ACTIVE
  ↓
HINT_REQUESTED
  ↓
ACTIVE
```

---

# 28. EX1 JSON Structure

The base structure should be simple.

```json
{
  "type": "exercise",
  "version": "EX1",
  "presentation": "Fill in the Blank",

  "content": {
    "instruction": "",
    "prompt": "",
    "language": "python",
    "template": "",
    "blanks": []
  }
}
```

---

# 29. EX1 Complete JSON Example

```json
{
  "type": "exercise",
  "version": "EX1",
  "presentation": "Fill in the Blank",

  "content": {
    "instruction": "Complete the code so that 30 is added to the end of the list.",

    "language": "python",

    "template": "numbers = [10, 20]\nnumbers.______(30)\n\nprint(numbers)",

    "blanks": [
      {
        "id": "blank-1",
        "answerType": "identifier",
        "expectedAnswers": [
          "append"
        ],
        "caseSensitive": true
      }
    ],

    "hints": [
      {
        "level": 1,
        "text": "Think about the list method used to add one element."
      },
      {
        "level": 2,
        "text": "The method name begins with 'app'."
      }
    ],

    "explanation": "The append() method adds one element to the end of a list.",

    "keyConcepts": [
      "lists",
      "append",
      "mutation"
    ]
  },

  "metadata": {
    "difficulty": "easy",
    "estimatedMinutes": 2
  },

  "completion": {
    "mode": "answer-match"
  }
}
```

---

# 30. EX1 Multiple-Blank JSON

```json
{
  "type": "exercise",
  "version": "EX1",
  "presentation": "Fill in the Blank",

  "content": {
    "instruction": "Complete the function.",

    "language": "python",

    "template": "def add(a, b):\n    _____ a + b",

    "blanks": [
      {
        "id": "blank-1",
        "answerType": "keyword",
        "expectedAnswers": [
          "return"
        ]
      }
    ]
  },

  "completion": {
    "mode": "answer-match"
  }
}
```

---

# 31. EX1 Conceptual JSON Example

EX1 does not have to be code.

```json
{
  "type": "exercise",
  "version": "EX1",
  "presentation": "Fill in the Blank",

  "content": {
    "instruction": "Complete the statement.",

    "template": "Authentication establishes the ______ of the requester.",

    "blanks": [
      {
        "id": "blank-1",
        "answerType": "text",
        "expectedAnswers": [
          "identity"
        ],
        "caseSensitive": false
      }
    ],

    "explanation": "Authentication establishes or verifies the identity of the requester."
  },

  "completion": {
    "mode": "answer-match"
  }
}
```

---

# 32. EX1 Component Architecture

```text
ExerciseEX1
│
├── ExerciseHeader
│   ├── BlockLabel
│   └── VersionLabel
│
├── InstructionPanel
│
├── BlankExercise
│   ├── Prompt
│   ├── BlankInput
│   └── OptionalCodeDisplay
│
├── HintPanel
│
├── CheckAnswerButton
│
├── FeedbackPanel
│
├── ExplanationPanel
│
└── CompletionPanel
```

---

# 33. EX1 Authoring Architecture

The content author should primarily define:

```text
Instruction
Prompt / Template
Blank(s)
Expected Answer(s)
Hint(s)
Explanation
Key Concepts
Difficulty
```

The renderer handles:

```text
Input
Validation
Feedback
Retry
Progress
Completion
```

This keeps the block JSON-driven.

---

# 34. EX1 Validation Model

```text
Learner Answer
      ↓
Normalize
      ↓
Validate
      ↓
Compare Expected Answers
      ↓
Result
```

For example:

```text
" append "
     ↓
trim
     ↓
"append"
     ↓
compare
     ↓
✓
```

---

# 35. EX1 Accessibility

The blank must not rely only on visual styling.

Use:

```text
label
aria-label
keyboard focus
visible focus state
```

The learner should be able to:

```text
Tab
 ↓
Blank
 ↓
Type
 ↓
Enter
 ↓
Check
```

without requiring a mouse.

---

# 36. EX1 Responsive Behavior

Desktop:

```text
Question
   ↓
Code / prompt
   ↓
Input
   ↓
Actions
```

Mobile:

```text
Question

Code / prompt

Input

[ Check ]

[ Hint ]
```

The blank should remain visually obvious without becoming excessively large.

---

# 37. EX1 Difficulty Rules

### Easy

One obvious blank:

```python
x = _____
```

### Medium

A blank requiring concept understanding:

```python
numbers.______(10)
```

### Advanced

A blank requiring contextual reasoning:

```python
result = [
    number
    for number in numbers
    if number _____ 0
]
```

Still:

> **EX1**

---

# 38. EX1 Good Exercise Design

A good EX1:

```text
✓ Tests one focused concept
✓ Has a clear answer
✓ Provides enough context
✓ Is quick to complete
✓ Gives useful feedback
✓ Can be retried
```

Avoid:

```text
❌ Huge missing sections
❌ Multiple unrelated concepts
❌ Ambiguous answers
❌ Hidden requirements
❌ Trick questions
```

---

# 39. EX1 Should Be Small

EX1 is intentionally the **lowest-complexity ExerciseBlock**.

It should not ask:

> Build an authentication system.

Instead:

> Complete the missing permission check.

For example:

```python
if user._____('admin'):
    allow_access()
```

Expected:

```text
has_permission
```

The learner is practicing a small unit before moving to EX2 and beyond.

---

# 40. EX1 Relationship to the Later Versions

```text
EX1
Fill in the Blank
        ↓
Small completion
        ↓
EX2
Complete the Code
        ↓
Larger implementation
```

Therefore EX1 should remain deliberately constrained.

It prepares the learner for **EX2**, where they will have to complete more substantial code.

---

# 41. EX1 Final Specification

| Area                        | EX1 Decision                     |
| --------------------------- | -------------------------------- |
| **Block**                   | **ExerciseBlock**                |
| **Version**                 | **EX1**                          |
| **Presentation**            | **Fill in the Blank**            |
| **Purpose**                 | Active recall + small completion |
| **Input**                   | Text/code fragment               |
| **Blanks**                  | One or more                      |
| **Answer matching**         | Exact or configured flexible     |
| **Hints**                   | Optional                         |
| **Retry**                   | ✅                                |
| **Explanation**             | Recommended                      |
| **Tests**                   | Optional                         |
| **Scoring**                 | ❌ Not a QuizBlock score          |
| **Progress**                | ✅                                |
| **Completion**              | Answer match                     |
| **Difficulty**              | Easy → Advanced                  |
| **Code required**           | ❌                                |
| **Code execution required** | ❌                                |
| **Theme**                   | Light                            |
| **Primary**                 | **#F54A8D**                      |
| **Secondary**               | **#0B1B3D**                      |
| **Gradient**                | ❌                                |
| **Dark theme**              | ❌                                |
| **Responsive**              | ✅                                |
| **Accessible**              | ✅                                |
| **JSON-driven**             | ✅                                |

---

# 42. EX1 Status

## **EX1 — Fill in the Blank**

**Complete.** ✅

We will **stop here** rather than moving ahead automatically.

The next version, only when you say **"yes please"**, will be:

> **EX2 — Complete the Code**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX2 — Complete the Code

Yes. We continue **one version at a time**, exactly as you requested.

The committed ExerciseBlock sequence remains:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| EX1     | Fill in the Blank        | ✅ Complete     |
| **EX2** | **Complete the Code**    | 🔵 **CURRENT** |
| EX3     | Predict the Output       | ⏳              |
| EX4     | Fix the Code             | ⏳              |
| EX5     | Guided Exercise          | ⏳              |
| EX6     | Independent Exercise     | ⏳              |
| EX7     | Challenge Exercise       | ⏳              |
| EX8     | Progressive Exercise Set | ⏳              |

---

# 1. What Is EX2?

**EX2 — Complete the Code** asks the learner to take a **partially implemented program/function** and complete the missing implementation so that it satisfies the stated requirement.

The key difference from EX1 is the **size and responsibility of the missing part**.

```text
EX1
Small missing element
        ↓
Fill it

EX2
Partial implementation
        ↓
Understand requirement
        ↓
Write missing logic
        ↓
Test
        ↓
Complete
```

So EX2 is the first ExerciseBlock version where the learner is expected to write a meaningful piece of implementation.

---

# 2. EX1 → EX2 Progression

This progression should remain clear.

### EX1

```python
numbers = [1, 2]
numbers.______(3)
```

The learner supplies:

```text
append
```

Only one missing element.

### EX2

```python
def add(a, b):
    # complete the function
```

Now the learner must construct:

```python
return a + b
```

The learner has to understand the requirement and produce executable logic.

Therefore:

```text
EX1 → Recall / Completion

EX2 → Implementation / Completion
```

---

# 3. Primary Objective

EX2 should test whether the learner can:

* understand a stated requirement
* understand existing starter code
* determine what is missing
* write the missing logic
* preserve the existing structure
* produce the expected behavior
* pass the relevant tests

The learner is no longer simply recalling syntax.

They are **implementing**.

---

# 4. EX2 Core Learning Model

```text
REQUIREMENT
     ↓
STARTER CODE
     ↓
UNDERSTAND WHAT IS MISSING
     ↓
DESIGN SMALL SOLUTION
     ↓
WRITE CODE
     ↓
RUN / CHECK
     ↓
FEEDBACK
```

---

# 5. EX2 Example — Simple Function

### Task

> Complete the function so that it returns the sum of `a` and `b`.

Starter code:

```python
def add(a, b):
    # complete here
```

Learner writes:

```python
def add(a, b):
    return a + b
```

This is the simplest form of EX2.

---

# 6. EX2 Example — Conditional Logic

### Task

> Complete the function so that it returns `True` when the number is even and `False` otherwise.

Starter:

```python
def is_even(number):
    # complete here
```

Learner:

```python
def is_even(number):
    return number % 2 == 0
```

The learner must construct the expression rather than fill a predefined blank.

---

# 7. EX2 Example — List Processing

### Task

> Complete the function so that it returns the number of elements in the list that are greater than 10.

Starter:

```python
def count_large(numbers):
    count = 0

    # complete here

    return count
```

Possible solution:

```python
def count_large(numbers):
    count = 0

    for number in numbers:
        if number > 10:
            count += 1

    return count
```

This is clearly more substantial than EX1.

---

# 8. EX2 Example — String Processing

### Task

> Complete the function so that it returns the number of vowels in a string.

Starter:

```python
def count_vowels(text):
    count = 0

    # complete here

    return count
```

The learner must decide how to:

```text
iterate
   ↓
identify vowels
   ↓
increment counter
```

---

# 9. EX2 Example — Exception Handling

### Task

> Complete the function so that invalid integer input returns `None` instead of raising `ValueError`.

Starter:

```python
def parse_number(value):
    # complete here
```

Possible solution:

```python
def parse_number(value):
    try:
        return int(value)
    except ValueError:
        return None
```

This is an excellent EX2 after teaching exception handling.

---

# 10. EX2 Example — Authentication / Authorization

### Task

> Complete the function so that it returns `True` only when the user has the requested permission.

Starter:

```python
def can_access(user, permission):
    # complete here
```

Possible implementation:

```python
def can_access(user, permission):
    return permission in user.permissions
```

The learner applies the concept directly.

---

# 11. EX2 Example — More Structured Code

Starter:

```python
def calculate_average(numbers):

    if not numbers:
        return None

    # complete here
```

Task:

> Complete the function so that it returns the average of the numbers.

Possible solution:

```python
def calculate_average(numbers):

    if not numbers:
        return None

    return sum(numbers) / len(numbers)
```

The starter code already establishes an important constraint, while the learner supplies the missing implementation.

---

# 12. EX2 Should Provide a Clear Contract

A good EX2 should define what the code must do.

For example:

```text
Task:
Complete count_even(numbers).

Requirements:
• Return the number of even values.
• Do not modify the input list.
• Return 0 for an empty list.
```

This gives the learner a **behavioral contract**.

---

# 13. EX2 Contract Structure

```text
┌─────────────────────────────────────┐
│ REQUIREMENT                         │
├─────────────────────────────────────┤
│ What must the code do?              │
│                                     │
│ INPUT                               │
│ What does it receive?               │
│                                     │
│ OUTPUT                              │
│ What must it return?                │
│                                     │
│ CONSTRAINTS                         │
│ What rules must be followed?        │
│                                     │
│ EDGE CASES                          │
│ What special cases matter?          │
└─────────────────────────────────────┘
```

This is particularly important once EX2 becomes moderately difficult.

---

# 14. EX2 Starter Code

The starter code should give the learner enough structure to focus on the intended concept.

For example:

```python
def count_even(numbers):
    count = 0

    # Your implementation

    return count
```

This is preferable to:

```python
# Write a complete program from scratch.
```

because that would start moving toward **EX6 — Independent Exercise**.

---

# 15. EX2 Should Have a Defined Boundary

EX2 should be:

> **Complete an existing implementation.**

It should not become:

> **Design the entire solution from scratch.**

Therefore:

```text
EX2
Partial structure
+
Missing implementation
```

while:

```text
EX6
Problem statement
+
Learner designs implementation
```

This distinction is important for the architecture.

---

# 16. EX2 vs EX1

| Area              | EX1           | EX2            |
| ----------------- | ------------- | -------------- |
| Missing content   | Small         | Meaningful     |
| Recall            | High          | Medium         |
| Implementation    | Minimal       | Required       |
| Starter structure | Very high     | High           |
| Reasoning         | Low           | Medium         |
| Code writing      | Tiny fragment | Function/logic |
| Tests             | Optional      | Recommended    |
| Typical duration  | 1–3 min       | 3–10 min       |

---

# 17. EX2 vs EX6

This distinction is even more important.

### EX2

```text
Here is the structure.
Complete the missing implementation.
```

### EX6

```text
Here is the problem.
Design and implement your own solution.
```

Therefore:

```text
EX2 = structured implementation

EX6 = independent implementation
```

---

# 18. EX2 vs CodeBlock

CodeBlock teaches:

> **How does this code work?**

ExerciseBlock EX2 asks:

> **Can you write the missing code yourself?**

Example:

### CodeBlock

```python
def add(a, b):
    return a + b
```

Explanation:

> `return` sends the calculated value back to the caller.

### EX2

```python
def add(a, b):
    # complete here
```

Task:

> Complete the function.

The learner now has to produce the implementation.

---

# 19. EX2 vs QuestionBlock Q6

### Q6 — Code Reasoning

> Explain what happens when this function executes.

### EX2 — Complete the Code

> Complete the missing implementation so the function works correctly.

Therefore:

```text
Q6
→ Understand / explain code

EX2
→ Produce code
```

---

# 20. EX2 Testing

Because EX2 contains executable implementation, testing is strongly recommended.

The flow becomes:

```text
Learner Code
     ↓
Run Tests
     ↓
Test 1
     ↓
Test 2
     ↓
Test 3
     ↓
Result
```

---

# 21. EX2 Test Example

For:

```python
def is_even(number):
    # complete here
```

Tests:

```text
Input: 2
Expected: True
Result: ✓

Input: 7
Expected: False
Result: ✓

Input: 0
Expected: True
Result: ✓

Input: -4
Expected: True
Result: ✓
```

The learner gets behavior-oriented feedback.

---

# 22. EX2 Test Cases Should Be Hidden or Visible

Both modes can be supported.

### Visible examples

Useful for teaching:

```text
is_even(2) → True
is_even(5) → False
```

### Hidden tests

Useful for preventing hardcoded answers:

```text
Hidden:
is_even(-10)
is_even(0)
is_even(101)
```

The content model should support both.

---

# 23. EX2 Test Model

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

---

# 24. EX2 Feedback

If all tests pass:

```text
✓ All tests passed

Your implementation satisfies the
required behavior.
```

If some tests fail:

```text
2 of 4 tests passed.

Review the behavior for negative
and boundary values.
```

Avoid immediately revealing the complete solution.

---

# 25. EX2 Feedback Levels

A useful progression is:

```text
Attempt 1
   ↓
Basic failure information

Attempt 2
   ↓
More targeted feedback

Attempt 3
   ↓
Conceptual hint

Solution requested
   ↓
Reference solution
```

This supports learning through iteration.

---

# 26. EX2 Hint System

EX2 can have optional hints, but unlike EX5, hints should not normally be the central experience.

Example:

### Hint 1

> Think about what condition determines whether a number is even.

### Hint 2

> Consider the remainder after division by 2.

### Hint 3

> Use the `%` operator.

The learner still writes:

```python
return number % 2 == 0
```

---

# 27. EX2 Hint Configuration

```json
{
  "hints": [
    {
      "level": 1,
      "text": "Think about the condition that identifies an even number."
    },
    {
      "level": 2,
      "text": "Consider the remainder after division by 2."
    },
    {
      "level": 3,
      "text": "The modulo operator can help."
    }
  ]
}
```

The important distinction:

```text
EX2
Hints = optional assistance

EX5
Hints = part of the learning design
```

---

# 28. EX2 UI

```text
┌──────────────────────────────────────────────────┐
│ EXERCISE                                         │
│ COMPLETE THE CODE                                │
├──────────────────────────────────────────────────┤
│                                                  │
│ TASK                                             │
│                                                  │
│ Complete the function so that it returns True   │
│ when the number is even.                         │
│                                                  │
├──────────────────────────────────────────────────┤
│ REQUIREMENTS                                     │
│                                                  │
│ • Return True for even numbers.                  │
│ • Return False for odd numbers.                  │
│                                                  │
├──────────────────────────────────────────────────┤
│ YOUR CODE                                        │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ def is_even(number):                         │ │
│ │     # complete here                          │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Run Tests ]        [ Show Hint ]              │
└──────────────────────────────────────────────────┘
```

---

# 29. EX2 Test Result UI

```text
┌──────────────────────────────────────────────────┐
│ TEST RESULTS                                     │
├──────────────────────────────────────────────────┤
│                                                  │
│ ✓ Test 1    2 → True                             │
│ ✓ Test 2    5 → False                            │
│ ✓ Test 3    0 → True                             │
│ ✗ Test 4    -7 → False                           │
│                                                  │
│ 3 / 4 tests passed                               │
│                                                  │
│ Review how your condition handles negative      │
│ numbers.                                         │
└──────────────────────────────────────────────────┘
```

---

# 30. EX2 Correct State

```text
┌──────────────────────────────────────────────────┐
│ ✓ EXERCISE COMPLETED                             │
├──────────────────────────────────────────────────┤
│                                                  │
│ All tests passed.                                │
│                                                  │
│ You successfully completed the implementation.   │
│                                                  │
│ KEY CONCEPT                                      │
│ The modulo operator can be used to determine     │
│ whether a number is evenly divisible by 2.       │
│                                                  │
│ [ Continue ]                                     │
└──────────────────────────────────────────────────┘
```

---

# 31. EX2 State Model

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

Optional:

```text
EDITING
   ↓
HINT_REQUESTED
   ↓
EDITING
```

---

# 32. EX2 Component Architecture

```text
ExerciseEX2
│
├── ExerciseHeader
│
├── InstructionPanel
│
├── RequirementPanel
│   ├── Input
│   ├── Output
│   └── Constraints
│
├── StarterCodePanel
│
├── CodeEditor
│
├── HintPanel
│
├── RunTestsButton
│
├── TestResultsPanel
│
├── ExplanationPanel
│
├── ReferenceSolution
│
└── CompletionPanel
```

---

# 33. EX2 JSON Structure

```json
{
  "type": "exercise",
  "version": "EX2",
  "presentation": "Complete the Code",

  "content": {
    "instruction": "",
    "problem": "",
    "language": "python",
    "starterCode": "",
    "requirements": [],
    "examples": [],
    "tests": [],
    "hints": [],
    "referenceSolution": "",
    "explanation": "",
    "keyConcepts": []
  },

  "metadata": {
    "difficulty": "easy",
    "estimatedMinutes": 5
  },

  "completion": {
    "mode": "tests-pass"
  }
}
```

---

# 34. Complete EX2 JSON Example

```json
{
  "type": "exercise",
  "version": "EX2",
  "presentation": "Complete the Code",

  "content": {
    "instruction": "Complete the function so that it returns the number of even integers in the list.",

    "problem": "Implement the missing logic without modifying the input list.",

    "language": "python",

    "starterCode": "def count_even(numbers):\n    count = 0\n\n    # complete the implementation\n\n    return count",

    "requirements": [
      "Return the number of even integers.",
      "Return 0 when the list is empty.",
      "Do not modify the input list."
    ],

    "examples": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "2"
      },
      {
        "input": "[1, 3, 5]",
        "expectedOutput": "0"
      }
    ],

    "tests": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "2",
        "visible": true
      },
      {
        "input": "[]",
        "expectedOutput": "0",
        "visible": true
      },
      {
        "input": "[-2, -1, 0, 5]",
        "expectedOutput": "2",
        "visible": false
      }
    ],

    "hints": [
      {
        "level": 1,
        "text": "Loop through the numbers and determine which values are even."
      },
      {
        "level": 2,
        "text": "The modulo operator can help determine whether a number is divisible by 2."
      }
    ],

    "referenceSolution": "def count_even(numbers):\n    count = 0\n\n    for number in numbers:\n        if number % 2 == 0:\n            count += 1\n\n    return count",

    "explanation": "The function loops through the list and increments count whenever a number has a remainder of zero when divided by 2.",

    "keyConcepts": [
      "loops",
      "conditionals",
      "modulo",
      "functions",
      "return values"
    ]
  },

  "metadata": {
    "difficulty": "easy-medium",
    "estimatedMinutes": 5
  },

  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

---

# 35. EX2 Reference Solution Behavior

The reference solution should normally **not be visible immediately**.

Recommended flow:

```text
Learner starts
      ↓
Writes code
      ↓
Runs tests
      ↓
Fails
      ↓
Retries
      ↓
Hints
      ↓
Still stuck
      ↓
Requests solution
      ↓
Reference solution
```

This preserves the practice value.

---

# 36. EX2 Reference Solution Is Not the Only Valid Solution

This is important.

For:

```python
def count_even(numbers):
```

the learner might use:

```python
count = 0

for number in numbers:
    if number % 2 == 0:
        count += 1

return count
```

or:

```python
return sum(number % 2 == 0 for number in numbers)
```

Both can be valid if they satisfy the contract.

Therefore testing should primarily evaluate:

```text
behavior
```

rather than:

```text
exact source-code equality
```

---

# 37. EX2 Behavioral Testing

The ideal architecture is:

```text
Learner Implementation
        ↓
Execute
        ↓
Input
        ↓
Function
        ↓
Output
        ↓
Compare Expected
```

rather than:

```text
Learner Code
    ↓
String comparison
    ↓
Reference Code
```

This allows multiple correct implementations.

---

# 38. EX2 Edge Cases

A good EX2 should include relevant edge cases.

For:

```python
count_even(numbers)
```

consider:

```text
[]
[1]
[2]
[1, 2, 3, 4]
[-2, -1, 0, 5]
```

This teaches the learner that implementation correctness is broader than one example.

---

# 39. EX2 Difficulty Levels

### EX2 Easy

One small function:

```python
def is_even(number):
    # complete
```

### EX2 Medium

Existing structure + loop + condition:

```python
def count_even(numbers):
    count = 0
    # complete
    return count
```

### EX2 Advanced

Existing architecture with multiple requirements:

```python
def summarize(numbers):
    if not numbers:
        return None

    # complete implementation

    return result
```

Still EX2 because the learner is completing a prepared implementation structure.

---

# 40. EX2 Should Not Become EX5

If the exercise starts providing:

```text
Step 1
Step 2
Step 3
Step 4
```

with progressively revealed guidance, it is moving toward:

> **EX5 — Guided Exercise**

EX2 should primarily be:

```text
Task
+
Starter Code
+
Requirements
+
Optional Hints
```

---

# 41. EX2 Should Not Become EX7

If the learner receives:

```text
large system
+
multiple requirements
+
many edge cases
+
multiple concepts
+
complex constraints
```

then it is moving toward:

> **EX7 — Challenge Exercise**

EX2 should remain a **focused implementation completion task**.

---

# 42. EX2 Learning Progression Inside a Tutorial

A typical tutorial could use:

```text
CodeBlock
    ↓
"Here is how a function works."
    ↓
QuestionBlock Q6
    ↓
"Explain what the function does."
    ↓
ExerciseBlock EX1
    ↓
"Fill in the missing return keyword."
    ↓
ExerciseBlock EX2
    ↓
"Complete the function implementation."
```

This is an excellent transition from understanding to doing.

---

# 43. EX2 Analytics

Useful metrics include:

```text
attempts
testsPassed
testsFailed
timeSpent
hintsUsed
solutionViewed
completed
```

Example:

```json
{
  "exerciseAnalytics": {
    "attempts": 2,
    "testsPassed": 5,
    "testsFailed": 2,
    "hintsUsed": 1,
    "solutionViewed": false,
    "completed": true
  }
}
```

Again, these are **practice analytics**, not automatically an assessment score.

---

# 44. EX2 Accessibility

The code editor and controls should support:

```text
keyboard navigation
focus indicators
screen-reader labels
accessible test results
accessible error messages
```

For example:

```text
Tab
 ↓
Code editor
 ↓
Run Tests
 ↓
Show Hint
```

The test-result state should be announced meaningfully:

> "Three of four tests passed."

rather than only changing a visual color.

---

# 45. EX2 Responsive Layout

### Desktop

```text
┌──────────────────────────────┬───────────────────────┐
│ Problem + Code Editor        │ Requirements / Tests  │
│                              │                       │
│                              │                       │
└──────────────────────────────┴───────────────────────┘
```

### Mobile

```text
Problem

Requirements

Code Editor

Run Tests

Test Results

Hints
```

The code editor should remain usable without excessive horizontal scrolling.

---

# 46. EX2 Design Language

Continue the established Tutorial Engine visual language:

* light theme
* clean educational layout
* **#f54a8d** primary
* **#0B1B3D** secondary
* no dark theme
* no gradient requirement
* strong content hierarchy
* soft cards/shadows where appropriate
* clear success/error states

The visual design should emphasize the **code workspace**, not decorative elements.

---

# 47. EX2 Final Technical Specification

| Area                           | EX2 Decision                    |
| ------------------------------ | ------------------------------- |
| **Block**                      | **ExerciseBlock**               |
| **Version**                    | **EX2**                         |
| **Presentation**               | **Complete the Code**           |
| **Primary purpose**            | Partial implementation practice |
| **Starter code**               | Required                        |
| **Requirements**               | Required                        |
| **Code editor**                | Required for code EX2           |
| **Tests**                      | Recommended                     |
| **Hidden tests**               | Supported                       |
| **Hints**                      | Optional                        |
| **Reference solution**         | Supported                       |
| **Multiple valid solutions**   | ✅                               |
| **Behavioral testing**         | ✅ Recommended                   |
| **Retry**                      | ✅                               |
| **Progress**                   | ✅                               |
| **Completion**                 | Typically tests-pass            |
| **Quiz score**                 | ❌                               |
| **Guided steps**               | ❌ Primary mechanism             |
| **Independent from scratch**   | ❌                               |
| **Challenge-level complexity** | ❌                               |
| **Theme**                      | Light                           |
| **Primary**                    | **#F54A8D**                     |
| **Secondary**                  | **#0B1B3D**                     |
| **Gradient**                   | ❌                               |
| **Dark theme**                 | ❌                               |
| **Responsive**                 | ✅                               |
| **Accessible**                 | ✅                               |
| **JSON-driven**                | ✅                               |

---

# 48. EX2 Status

## **EX2 — Complete the Code**

**Complete.** ✅

We stop here.

The next version, when you say **"yes please"**, will be only:

> **EX3 — Predict the Output**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX3 — Predict the Output

Yes. We continue with **only one version**, exactly as agreed.

The committed sequence is:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| EX1     | Fill in the Blank        | ✅ Complete     |
| EX2     | Complete the Code        | ✅ Complete     |
| **EX3** | **Predict the Output**   | 🔵 **CURRENT** |
| EX4     | Fix the Code             | ⏳              |
| EX5     | Guided Exercise          | ⏳              |
| EX6     | Independent Exercise     | ⏳              |
| EX7     | Challenge Exercise       | ⏳              |
| EX8     | Progressive Exercise Set | ⏳              |

---

# 1. What Is EX3?

**EX3 — Predict the Output** is an exercise where the learner must determine what a given program will produce **before relying on actual execution**.

The core learning cycle is:

```text
CODE
  ↓
READ
  ↓
TRACE
  ↓
REASON
  ↓
PREDICT
  ↓
SUBMIT
  ↓
VERIFY
```

The purpose is not simply to test whether the learner can recognize an answer.

It is to practice **mentally executing code**.

---

# 2. EX3 vs QuestionBlock Q5

This distinction must remain clear because both use the same presentation concept.

### QuestionBlock Q5

> What will this code print?

Its primary purpose is:

```text
Concept checking
```

### ExerciseBlock EX3

> Practice predicting the output of this code before running it.

Its primary purpose is:

```text
Execution reasoning practice
```

So:

```text
Q5
Question → verify understanding

EX3
Exercise → practice execution reasoning
```

The same code pattern can appear in both blocks, but the **learning role is different**.

---

# 3. EX3 Position in ExerciseBlock

EX1 and EX2 establish a natural progression:

```text
EX1
Fill in the Blank
      ↓
Recall / completion
      ↓
EX2
Complete the Code
      ↓
Implementation
      ↓
EX3
Predict the Output
      ↓
Execution reasoning
```

The learner moves from:

> **What code belongs here?**

to:

> **Can I write the missing logic?**

to:

> **Can I predict what this code will actually do?**

---

# 4. Primary Objective

EX3 should develop the learner's ability to:

* trace statements
* follow variable changes
* track object state
* understand control flow
* reason about conditions
* follow loops
* understand function calls
* reason about return values
* track references
* predict exceptions
* predict final program state
* identify exact output

The learner should build an internal execution model.

---

# 5. EX3 Mental Model

```text
┌─────────────────────┐
│       SOURCE CODE   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   TRACE EXECUTION   │
│                     │
│ line 1              │
│ line 2              │
│ condition           │
│ loop                │
│ function            │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  PREDICT RESULT     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     VERIFY          │
└─────────────────────┘
```

---

# 6. EX3 Basic Example

```python
numbers = [1, 2, 3]

print(numbers)
```

Task:

> Predict the exact output.

Learner enters:

```text
[1, 2, 3]
```

Then the system verifies it.

---

# 7. EX3 Variable Example

```python
x = 10
x = x + 5

print(x)
```

Expected:

```text
15
```

This tests basic state tracking.

---

# 8. EX3 Conditional Example

```python
x = 10

if x > 5:
    print("Large")
else:
    print("Small")
```

Expected:

```text
Large
```

The learner must determine which branch executes.

---

# 9. EX3 Multiple Statements

```python
x = 5
y = 2

x = x + y
y = x * 2

print(x)
print(y)
```

Expected:

```text
7
14
```

The learner must track the changing state.

---

# 10. EX3 Loop Example

```python
for i in range(3):
    print(i)
```

Expected:

```text
0
1
2
```

This tests understanding of `range()` and iteration.

---

# 11. EX3 Accumulator Example

```python
total = 0

for number in [1, 2, 3]:
    total += number

print(total)
```

Expected:

```text
6
```

The learner must mentally maintain:

```text
total = 0
   ↓
total = 1
   ↓
total = 3
   ↓
total = 6
```

---

# 12. EX3 Function Example

```python
def add(a, b):
    return a + b

result = add(2, 3)

print(result)
```

Expected:

```text
5
```

The learner must trace:

```text
add(2, 3)
    ↓
a = 2
b = 3
    ↓
return 5
    ↓
result = 5
```

---

# 13. EX3 Nested Function Example

```python
def double(x):
    return x * 2

def calculate(x):
    return double(x) + 1

print(calculate(3))
```

Trace:

```text
calculate(3)
      ↓
double(3)
      ↓
6
      ↓
6 + 1
      ↓
7
```

Expected:

```text
7
```

This is a stronger EX3.

---

# 14. EX3 List Mutation Example

```python
numbers = [1, 2]

numbers.append(3)

print(numbers)
```

Expected:

```text
[1, 2, 3]
```

This can reinforce the list concepts taught earlier.

---

# 15. EX3 Aliasing Example

This is particularly useful for the memory/reference material.

```python
a = [1, 2]
b = a

b.append(3)

print(a)
print(b)
```

Expected:

```text
[1, 2, 3]
[1, 2, 3]
```

The learner must understand:

```text
a ─────┐
       ↓
    [1, 2]
       ↑
       │
b ─────┘
```

Then:

```text
b.append(3)
       ↓
same object changes
```

---

# 16. EX3 Rebinding Example

```python
a = [1, 2]
b = a

b = [3, 4]

print(a)
print(b)
```

Expected:

```text
[1, 2]
[3, 4]
```

This is an excellent exercise because it contrasts:

```text
mutation
```

with:

```text
rebinding
```

---

# 17. EX3 String Example

```python
text = "Python"

print(text[0])
print(text[-1])
```

Expected:

```text
P
n
```

---

# 18. EX3 Slicing Example

```python
numbers = [0, 1, 2, 3, 4]

print(numbers[1:4])
```

Expected:

```text
[1, 2, 3]
```

---

# 19. EX3 Dictionary Example

```python
user = {
    "name": "Alex",
    "role": "admin"
}

print(user["role"])
```

Expected:

```text
admin
```

---

# 20. EX3 Exception Example

EX3 can also ask the learner to predict an exception.

```python
numbers = [10, 20]

print(numbers[2])
```

Expected result:

```text
IndexError
```

This is more advanced than simply predicting printed output.

The task can explicitly say:

> Predict the result, including whether an exception occurs.

---

# 21. EX3 Exception Flow

```text
CODE
 ↓
TRACE
 ↓
EXCEPTION?
 ├── No → Predict output
 │
 └── Yes → Predict exception
```

This allows EX3 to reinforce Exception Handling lessons.

---

# 22. EX3 Output Types

EX3 should support several result categories.

### Printed output

```text
Hello
```

### Multiple lines

```text
1
2
3
```

### Returned value

For a function exercise:

```text
42
```

### Collection representation

```text
[1, 2, 3]
```

### Boolean

```text
True
```

### Exception

```text
IndexError
```

### No output

For example:

```python
x = 10
```

Expected:

```text
No output
```

---

# 23. Exact Output Matters

For EX3, output should normally be treated as an exact behavioral result.

For example:

```text
Expected:

Hello
World
```

is different from:

```text
World
Hello
```

Likewise:

```text
[1, 2, 3]
```

is different from:

```text
[1,3,2]
```

unless the exercise explicitly defines order as irrelevant.

---

# 24. EX3 Input Interface

The simplest interface is a text output field.

```text
┌──────────────────────────────────────────┐
│ PREDICT THE OUTPUT                       │
├──────────────────────────────────────────┤
│                                          │
│ What will this code print?               │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ code                                 │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ YOUR PREDICTION                          │
│ ┌──────────────────────────────────────┐ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [ Check Prediction ]                     │
└──────────────────────────────────────────┘
```

---

# 25. EX3 Should Encourage Prediction Before Execution

The key learning behavior is:

```text
Read code
   ↓
Predict
   ↓
Submit prediction
   ↓
Run/verify
```

Do not make the execution result visible before the learner submits.

Otherwise the exercise loses much of its value.

---

# 26. Optional "Run Code" After Submission

After the learner submits a prediction, the UI can reveal:

```text
YOUR PREDICTION
      ↓
ACTUAL OUTPUT
      ↓
COMPARE
```

Example:

```text
┌──────────────────────────────────────────┐
│ YOUR PREDICTION                          │
│ [1, 2, 3]                                │
├──────────────────────────────────────────┤
│ ACTUAL OUTPUT                            │
│ [1, 2, 3]                                │
├──────────────────────────────────────────┤
│ ✓ Correct                                │
└──────────────────────────────────────────┘
```

This makes the exercise highly educational.

---

# 27. EX3 Incorrect Prediction

```text
┌──────────────────────────────────────────┐
│ YOUR PREDICTION                          │
│ [1, 2]                                   │
├──────────────────────────────────────────┤
│ ACTUAL OUTPUT                            │
│ [1, 2, 3]                                │
├──────────────────────────────────────────┤
│ Not quite.                               │
│                                          │
│ Review the line where append() is called.│
└──────────────────────────────────────────┘
```

The feedback should point toward the reasoning mistake without necessarily giving the complete answer immediately.

---

# 28. EX3 Optional Trace

For teaching purposes, after submission the system can optionally reveal a trace.

Example:

```text
numbers = [1, 2]
       ↓
b = numbers
       ↓
b.append(3)
       ↓
shared list becomes [1, 2, 3]
       ↓
print(a)
       ↓
[1, 2, 3]
```

This is especially useful for difficult EX3 exercises.

---

# 29. EX3 Hint System

Hints can target the **execution process** rather than the answer.

Example:

### Hint 1

> Trace the value of `x` after each assignment.

### Hint 2

> What is the value of `x` after `x = x + 5`?

### Hint 3

> The final value is used by `print()`.

This teaches the learner **how to predict**, not simply what to answer.

---

# 30. EX3 JSON Structure

```json
{
  "type": "exercise",
  "version": "EX3",
  "presentation": "Predict the Output",

  "content": {
    "instruction": "",
    "question": "",
    "language": "python",
    "code": "",
    "expectedOutput": "",
    "hints": [],
    "explanation": "",
    "keyConcepts": []
  },

  "metadata": {
    "difficulty": "easy",
    "estimatedMinutes": 3
  },

  "completion": {
    "mode": "output-match"
  }
}
```

---

# 31. Complete EX3 JSON Example

```json
{
  "type": "exercise",
  "version": "EX3",
  "presentation": "Predict the Output",

  "content": {
    "instruction": "Predict the exact output before checking the result.",

    "question": "What will this code print?",

    "language": "python",

    "code": "numbers = [1, 2]\nb = numbers\nb.append(3)\n\nprint(numbers)\nprint(b)",

    "expectedOutput": "[1, 2, 3]\n[1, 2, 3]",

    "hints": [
      {
        "level": 1,
        "text": "Ask whether numbers and b refer to the same list."
      },
      {
        "level": 2,
        "text": "The append() operation changes the existing list."
      }
    ],

    "explanation": "Both variables refer to the same list object. Mutating the list through b is therefore visible through numbers as well.",

    "keyConcepts": [
      "references",
      "aliasing",
      "mutation",
      "object identity"
    ]
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 4
  },

  "completion": {
    "mode": "output-match"
  }
}
```

---

# 32. EX3 Output Normalization

The system needs a controlled comparison strategy.

For example:

```text
Learner:
[1, 2, 3]

Expected:
[1, 2, 3]
```

→ correct.

But for output:

```text
Hello
World
```

the newline structure matters.

The content should specify the comparison mode.

```json
{
  "comparison": {
    "mode": "exact"
  }
}
```

---

# 33. Supported Comparison Modes

EX3 can support:

### Exact

```text
"Hello\nWorld"
```

### Trimmed

Ignores leading/trailing whitespace.

### Numeric

Useful when output is a number.

### Structured

Useful when the expected result is represented as JSON or another structured value.

The default for normal console-output exercises should be **exact or carefully normalized text**.

---

# 34. EX3 Output With Exceptions

Example:

```json
{
  "expectedResult": {
    "type": "exception",
    "name": "IndexError"
  }
}
```

The learner could enter:

```text
IndexError
```

or select:

```text
Exception occurs
→ IndexError
```

depending on the presentation configuration.

---

# 35. EX3 UI — Exception Variant

```text
┌──────────────────────────────────────────┐
│ PREDICT THE RESULT                       │
├──────────────────────────────────────────┤
│                                          │
│ What happens when this code runs?        │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ numbers = [1, 2]                     │ │
│ │ print(numbers[2])                    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ○ Prints a value                         │
│ ○ No output                              │
│ ○ Raises an exception                    │
│                                          │
│ Exception: [____________]                │
│                                          │
│ [ Check ]                                │
└──────────────────────────────────────────┘
```

This remains EX3 because the learner is predicting execution behavior.

---

# 36. EX3 Difficulty

### Easy

Simple assignment:

```python
x = 5
print(x)
```

### Medium

Conditional or loop:

```python
for i in range(3):
    print(i)
```

### Harder

Functions:

```python
def double(x):
    return x * 2

print(double(4))
```

### Advanced

References / mutation:

```python
a = []
b = a
b.append(1)
print(a)
```

### Advanced+

Multiple concepts:

```text
function
+
loop
+
mutation
+
conditional
+
exception
```

The version remains EX3.

---

# 37. EX3 Should Not Become ExecutionBlock

This distinction matters because **ExecutionBlock is later in your 18-block sequence**.

EX3:

> Predict what the code will do.

ExecutionBlock:

> Teach and visualize **runtime behavior and execution flow**.

So:

```text
EX3
→ Learner prediction exercise

ExecutionBlock
→ Runtime behavior teaching
```

---

# 38. EX3 Should Not Become MemoryBlock

For example:

```python
a = [1]
b = a
```

EX3 might ask:

> What will `print(b)` produce after `a.append(2)`?

The learner is predicting output.

MemoryBlock teaches:

> Why do `a` and `b` observe the same object?

Thus:

```text
EX3
→ Practice the behavior

MemoryBlock
→ Explain the underlying model
```

---

# 39. EX3 Feedback Model

A strong feedback cycle:

```text
PREDICTION
    ↓
SUBMIT
    ↓
COMPARE
    ↓
CORRECT?
 ┌──┴──┐
Yes    No
 ↓      ↓
Explain  Explain
why      mismatch
```

---

# 40. EX3 Correct Feedback

```text
✓ Correct

Your prediction matches the actual
program output.

Key concept:
b and numbers reference the same
mutable list.
```

---

# 41. EX3 Incorrect Feedback

```text
Not quite.

Your prediction:
[1, 2]

Actual output:
[1, 2, 3]

Think about what happens when
append() mutates the list.
```

This is preferable to:

```text
✗ Wrong
```

because the purpose is learning.

---

# 42. EX3 Completion Flow

```text
NOT STARTED
      ↓
READ CODE
      ↓
MAKE PREDICTION
      ↓
SUBMIT
      ↓
COMPARE
      │
      ├───────────────┐
      ↓               ↓
INCORRECT           CORRECT
      ↓               ↓
RETRY / HINT       COMPLETED
      │
      └──────→ CHECK AGAIN
```

---

# 43. EX3 Component Architecture

```text
ExerciseEX3
│
├── ExerciseHeader
│
├── InstructionPanel
│
├── CodePanel
│
├── PredictionInput
│
├── HintPanel
│
├── CheckPredictionButton
│
├── ResultComparison
│   ├── LearnerPrediction
│   ├── ActualOutput
│   └── Correctness
│
├── TraceExplanation
│
├── KeyConcepts
│
└── CompletionPanel
```

---

# 44. EX3 Data Model

```json
{
  "type": "exercise",
  "version": "EX3",

  "content": {
    "instruction": "",
    "code": "",
    "language": "python",

    "expectedResult": {
      "type": "output",
      "value": ""
    },

    "comparison": {
      "mode": "exact"
    },

    "hints": [],

    "explanation": "",

    "keyConcepts": []
  }
}
```

---

# 45. EX3 Result Model

After submission:

```json
{
  "prediction": "[1, 2, 3]",
  "actualOutput": "[1, 2, 3]",
  "isCorrect": true
}
```

For an exception:

```json
{
  "prediction": "IndexError",
  "actualResult": {
    "type": "exception",
    "name": "IndexError"
  },
  "isCorrect": true
}
```

---

# 46. EX3 Analytics

Useful practice signals:

```text
attempts
timeToPrediction
correctFirstAttempt
hintsUsed
actualOutputViewed
completed
```

Example:

```json
{
  "exerciseAnalytics": {
    "attempts": 2,
    "correctFirstAttempt": false,
    "hintsUsed": 1,
    "completed": true
  }
}
```

A particularly useful metric is:

> **Correct on first prediction**

because it measures execution reasoning directly.

---

# 47. EX3 Accessibility

The learner must be able to:

```text
Tab
 ↓
Code
 ↓
Prediction field
 ↓
Check
```

The actual output should be announced after submission.

For example:

> "Prediction incorrect. Actual output: 1, 2, 3."

Code should remain readable to screen readers where possible.

---

# 48. EX3 Responsive UI

### Desktop

```text
┌───────────────────────────────┬──────────────────────┐
│ Code                          │ Prediction            │
│                               │                      │
│                               │ [ Answer ]            │
│                               │                      │
│                               │ [ Check ]             │
└───────────────────────────────┴──────────────────────┘
```

### Mobile

```text
Code

↓

Your Prediction

[ Answer ]

↓

[ Check ]

↓

Result
```

The learner should never have to constantly switch between distant parts of the page.

---

# 49. EX3 Authoring Rules

A strong EX3 should:

* contain a meaningful execution path
* be deterministic
* have a clearly defined expected result
* be answerable from concepts already taught
* encourage tracing
* avoid arbitrary tricks
* provide useful feedback
* increase complexity appropriately

Avoid:

* undefined behavior
* ambiguous output
* environment-dependent output
* randomness unless seeded
* timing-dependent behavior
* hidden external state

---

# 50. EX3 Determinism

This is particularly important.

Avoid:

```python
import random

print(random.randint(1, 10))
```

unless the random state is deliberately controlled.

Avoid exercises where output depends on:

```text
current time
machine environment
external network
filesystem state
randomness
```

unless those dependencies are explicitly part of the exercise.

EX3 should normally have a **deterministic answer**.

---

# 51. EX3 RealTutorialHub Tutorial Flow

A strong tutorial could now progress:

```text
DefinitionBlock
       ↓
CodeBlock
       ↓
QuestionBlock Q5
       ↓
ExerciseBlock EX1
       ↓
ExerciseBlock EX2
       ↓
ExerciseBlock EX3
```

The learner experiences:

```text
Understand
   ↓
Recognize
   ↓
Complete
   ↓
Implement
   ↓
Predict
```

That is a very strong instructional progression.

---

# 52. EX3 Final Technical Specification

| Area                             | EX3 Decision                 |
| -------------------------------- | ---------------------------- |
| **Block**                        | **ExerciseBlock**            |
| **Version**                      | **EX3**                      |
| **Presentation**                 | **Predict the Output**       |
| **Primary purpose**              | Execution reasoning practice |
| **Code**                         | Required for standard EX3    |
| **Prediction input**             | Required                     |
| **Expected result**              | Required                     |
| **Output comparison**            | Configurable                 |
| **Exceptions**                   | Supported                    |
| **Hints**                        | Optional                     |
| **Trace explanation**            | Optional                     |
| **Actual execution**             | Supported                    |
| **Retry**                        | ✅                            |
| **Progress**                     | ✅                            |
| **First-attempt metric**         | ✅                            |
| **Quiz score**                   | ❌                            |
| **Random output**                | ❌ unless deterministic       |
| **Environment-dependent output** | ❌ by default                 |
| **Theme**                        | Light                        |
| **Primary**                      | **#F54A8D**                  |
| **Secondary**                    | **#0B1B3D**                  |
| **Gradient**                     | ❌                            |
| **Dark theme**                   | ❌                            |
| **Responsive**                   | ✅                            |
| **Accessible**                   | ✅                            |
| **JSON-driven**                  | ✅                            |

---

# 53. EX3 Final Mental Model

```text
                 EX3
        PREDICT THE OUTPUT
                 │
                 ▼
             READ CODE
                 │
                 ▼
          TRACE EXECUTION
                 │
                 ▼
          FORM PREDICTION
                 │
                 ▼
              SUBMIT
                 │
                 ▼
            VERIFY RESULT
                 │
          ┌──────┴──────┐
          ▼             ▼
       CORRECT        INCORRECT
          │             │
          ▼             ▼
      COMPLETE       HINT / RETRY
```

---

# 54. EX3 Status

## **EX3 — Predict the Output**

**Complete.** ✅

We stop here.

The next version, only when you say **"yes please"**, is:

> **EX4 — Fix the Code**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX4 — Fix the Code

Yes. We continue with **only EX4**, one version at a time.

The committed sequence remains:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| EX1     | Fill in the Blank        | ✅ Complete     |
| EX2     | Complete the Code        | ✅ Complete     |
| EX3     | Predict the Output       | ✅ Complete     |
| **EX4** | **Fix the Code**         | 🔵 **CURRENT** |
| EX5     | Guided Exercise          | ⏳              |
| EX6     | Independent Exercise     | ⏳              |
| EX7     | Challenge Exercise       | ⏳              |
| EX8     | Progressive Exercise Set | ⏳              |

---

# 1. What Is EX4?

**EX4 — Fix the Code** is an exercise where the learner receives **incorrect or broken code** and must diagnose and repair it so that it satisfies the stated requirements.

The core learning cycle is:

```text
BROKEN CODE
     ↓
OBSERVE
     ↓
IDENTIFY THE PROBLEM
     ↓
UNDERSTAND THE CAUSE
     ↓
MODIFY THE CODE
     ↓
RUN / TEST
     ↓
VERIFY
```

The key difference from EX2 is:

> **EX2 starts with incomplete code. EX4 starts with code that exists but does not work correctly.**

---

# 2. EX2 → EX4 Progression

### EX2 — Complete the Code

```python
def add(a, b):
    # missing implementation
```

The learner asks:

> What code should I add?

### EX4 — Fix the Code

```python
def add(a, b):
    return a - b
```

The learner asks:

> What is wrong with this existing implementation, and how do I correct it?

Therefore:

```text
EX2
Missing implementation
        ↓
Build

EX4
Incorrect implementation
        ↓
Diagnose + repair
```

---

# 3. EX4 Is Not MistakeBlock

This distinction is especially important because you already defined **MistakeBlock**.

### MistakeBlock

> Teaches the learner about a common mistake.

Example:

```text
Incorrect
   ↓
Why it is wrong
   ↓
Correct version
```

### EX4

> Gives the learner broken code and asks **the learner to fix it**.

Example:

```text
Broken code
   ↓
YOU diagnose it
   ↓
YOU modify it
   ↓
YOU test it
```

So:

```text
MistakeBlock
→ LEARN about mistakes

EX4
→ PRACTICE fixing mistakes
```

---

# 4. EX4 Is Not CodeBlock

### CodeBlock

Shows correct implementation and explains it.

### EX4

Deliberately gives an incorrect implementation.

```text
CodeBlock
     ↓
Correct code
     ↓
Understand

EX4
     ↓
Broken code
     ↓
Diagnose
     ↓
Repair
```

---

# 5. Primary Objective

EX4 should develop the learner's ability to:

* read unfamiliar code
* identify incorrect behavior
* interpret error messages
* locate likely fault areas
* understand why the code fails
* make minimal corrections
* preserve already-correct code
* test the correction
* verify behavior

The learner should learn that debugging is not simply:

> "Find something that looks wrong."

It is:

> **Observe → reason → modify → verify.**

---

# 6. EX4 Core Learning Model

```text
             BROKEN PROGRAM
                    │
                    ▼
              OBSERVE FAILURE
                    │
                    ▼
             IDENTIFY SYMPTOM
                    │
                    ▼
             FIND ROOT CAUSE
                    │
                    ▼
             APPLY CORRECTION
                    │
                    ▼
                RUN TESTS
                    │
              ┌─────┴─────┐
              ▼           ▼
           FAIL          PASS
              │           │
              ▼           ▼
          DEBUG AGAIN   COMPLETE
```

---

# 7. EX4 Example — Wrong Operator

### Task

> Fix the function so that it returns the sum of `a` and `b`.

Broken code:

```python
def add(a, b):
    return a - b
```

The learner must identify:

```text
- 
```

should be:

```text
+
```

Correct:

```python
def add(a, b):
    return a + b
```

This is the simplest EX4.

---

# 8. EX4 Example — Off-by-One Error

Broken:

```python
numbers = [10, 20, 30]

for i in range(len(numbers) + 1):
    print(numbers[i])
```

The code eventually raises:

```text
IndexError
```

The learner must determine that:

```python
range(len(numbers))
```

is appropriate.

Correct:

```python
for i in range(len(numbers)):
    print(numbers[i])
```

---

# 9. EX4 Example — Wrong Condition

Task:

> Print only even numbers.

Broken:

```python
numbers = [1, 2, 3, 4]

for number in numbers:
    if number % 2 != 0:
        print(number)
```

The learner must recognize that the condition selects odd numbers.

Correct:

```python
for number in numbers:
    if number % 2 == 0:
        print(number)
```

---

# 10. EX4 Example — Missing Return

Broken:

```python
def multiply(a, b):
    print(a * b)

result = multiply(2, 3)

print(result)
```

The output is:

```text
6
None
```

Task:

> Fix the function so that `result` contains the calculated value.

Correct:

```python
def multiply(a, b):
    return a * b
```

This teaches the distinction between:

```text
print()
```

and:

```text
return
```

---

# 11. EX4 Example — Mutation / Rebinding

Suppose the requirement is:

> Add `3` to the existing list.

Broken:

```python
numbers = [1, 2]

numbers = numbers + [3]

print(numbers)
```

This code may actually produce the required visible result, so it should **not** be used as an EX4 merely because the implementation differs from the author's preferred solution.

This illustrates an important rule:

> **EX4 should test incorrect behavior, not merely a different coding style.**

---

# 12. EX4 Example — Exception Handling

Task:

> Return `None` when the input cannot be converted to an integer.

Broken:

```python
def parse_number(value):
    try:
        return int(value)
    except TypeError:
        return None
```

Input:

```text
"abc"
```

The actual exception is:

```text
ValueError
```

The learner must replace:

```python
except TypeError:
```

with:

```python
except ValueError:
```

---

# 13. EX4 Example — Reference / Aliasing

Suppose the requirement is:

> Create an independent copy of the list.

Broken:

```python
original = [1, 2, 3]
copy = original

copy.append(4)
```

The learner must identify that:

```python
copy = original
```

creates another reference to the same object.

A possible correction:

```python
copy = original.copy()
```

This is a strong EX4 because the learner must understand the underlying concept rather than merely syntax.

---

# 14. EX4 Example — Authentication

Task:

> Only users with the required permission should be allowed to access the resource.

Broken:

```python
def can_access(user, permission):
    return True
```

The learner must recognize that the function grants access regardless of the user's permissions.

A possible correction:

```python
def can_access(user, permission):
    return permission in user.permissions
```

This is useful when teaching authorization concepts.

---

# 15. EX4 Example — Authorization Boundary

Broken architecture:

```text
User
 ↓
Frontend
 ↓
"Admin button hidden"
 ↓
Admin API
```

Task:

> Fix the authorization design so that hiding the button is not the final security boundary.

The learner should identify that authorization must be enforced by the protected backend resource.

This can be an architectural EX4 rather than only a code-level EX4.

---

# 16. EX4 Error Types

EX4 can contain different categories of mistakes.

### A. Syntax Error

```python
if x > 5
    print(x)
```

Missing:

```text
:
```

---

### B. Runtime Error

```python
numbers[10]
```

when the list does not contain that index.

---

### C. Logic Error

```python
return a - b
```

when the requirement is addition.

---

### D. API Misuse

```python
numbers.add(10)
```

when `numbers` is a list.

---

### E. State / Reference Error

```python
copy = original
```

when an independent copy is required.

---

### F. Error Handling Error

```python
except TypeError:
```

when the actual failure is `ValueError`.

---

### G. Security / Authorization Error

```python
return True
```

where permission verification is required.

---

# 17. EX4 Must Clearly Define the Failure

The learner should have enough information to debug.

A good exercise provides:

```text
Task
+
Broken code
+
Expected behavior
+
Observed behavior / error
```

For example:

```text
TASK

Return the sum of two numbers.

OBSERVED

add(5, 3) returns 2.

CODE

def add(a, b):
    return a - b
```

Now the learner has enough information to diagnose the problem.

---

# 18. EX4 Problem Structure

```text
┌──────────────────────────────────────┐
│ TASK                                 │
├──────────────────────────────────────┤
│ What should the program do?          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ OBSERVED BEHAVIOR                    │
├──────────────────────────────────────┤
│ What is currently happening?         │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ BROKEN CODE                          │
├──────────────────────────────────────┤
│ Existing implementation              │
└──────────────────────────────────────┘
```

---

# 19. EX4 Should Not Reveal the Exact Fault

Avoid:

> The problem is the `-` operator. Replace it with `+`.

That removes the debugging exercise.

Instead:

> `add(5, 3)` produces `2`, but the function is expected to return `8`. Fix the implementation.

Now the learner has to diagnose the cause.

---

# 20. EX4 Optional Error Message

Error messages are valuable debugging evidence.

Example:

```text
ERROR

IndexError: list index out of range
```

The learner must use the evidence to locate the problem.

This aligns with the previously committed MistakeBlock concept:

> **Error Message → Cause → Fix**

But EX4 turns that teaching pattern into a practical activity.

---

# 21. EX4 Debugging Evidence

The exercise can provide:

```text
Observed Output
Error Message
Failing Test
Input
Expected Output
```

Example:

```text
Input:
[10, 20, 30]

Expected:
30

Actual:
IndexError
```

The learner must determine why.

---

# 22. EX4 Tests

Testing is central to EX4.

The flow should be:

```text
Broken Code
    ↓
Learner Fix
    ↓
Run Tests
    ↓
Results
    ↓
Still Broken?
 ┌──────┴──────┐
Yes            No
 ↓              ↓
Retry         Complete
```

---

# 23. EX4 Test Example

For:

```python
def add(a, b):
    return a - b
```

Tests:

```text
Test 1
add(2, 3)
Expected: 5
Actual: -1
✗

Test 2
add(10, 5)
Expected: 15
Actual: 5
✗
```

After correction:

```text
Test 1 ✓
Test 2 ✓
```

---

# 24. Hidden Tests

EX4 should support hidden tests.

Visible:

```text
add(2, 3) → 5
```

Hidden:

```text
add(-5, 10) → 5
add(0, 0) → 0
add(100, -25) → 75
```

This prevents the learner from fixing only the visible example.

---

# 25. EX4 Behavioral Validation

The system should normally validate:

```text
Expected behavior
        vs
Actual behavior
```

rather than comparing the learner's source code to one predefined solution.

This permits multiple legitimate fixes.

For example:

```python
return a + b
```

and another equivalent implementation could both pass if the behavior is correct.

---

# 26. EX4 Multiple Valid Fixes

This is particularly important.

Suppose the requirement is:

> Return the square of a number.

The learner might write:

```python
return number * number
```

or:

```python
return number ** 2
```

Both can be correct.

Therefore:

```text
EX4
→ Behavioral correctness
```

not:

```text
EX4
→ Exact source-code matching
```

---

# 27. EX4 Hint System

Hints should help the learner debug progressively.

### Hint 1 — Observation

> Compare the expected result with the actual result.

### Hint 2 — Location

> Look at the arithmetic operation inside the function.

### Hint 3 — Concept

> The function is subtracting when it should combine the values.

### Hint 4 — Strong hint

> Check the operator used between `a` and `b`.

The final answer can be revealed only if configured.

---

# 28. EX4 Hint Model

```text
No Hint
   ↓
Observation Hint
   ↓
Location Hint
   ↓
Concept Hint
   ↓
Strong Hint
   ↓
Solution
```

This makes debugging an active learning process.

---

# 29. EX4 UI

```text
┌──────────────────────────────────────────────────┐
│ EXERCISE                                         │
│ FIX THE CODE                                     │
├──────────────────────────────────────────────────┤
│                                                  │
│ TASK                                             │
│ Fix the function so that it returns the sum      │
│ of a and b.                                      │
│                                                  │
├──────────────────────────────────────────────────┤
│ OBSERVED BEHAVIOR                                │
│                                                  │
│ add(5, 3) returns 2.                             │
│ Expected: 8                                      │
│                                                  │
├──────────────────────────────────────────────────┤
│ BROKEN CODE                                      │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ def add(a, b):                               │ │
│ │     return a - b                             │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ FIX THE CODE                                     │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ def add(a, b):                               │ │
│ │     ...                                      │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Run Tests ]        [ Show Hint ]              │
└──────────────────────────────────────────────────┘
```

---

# 30. Why Show Broken Code Separately?

The UI can show:

```text
BROKEN CODE
```

and:

```text
YOUR CORRECTION
```

separately.

This makes the learning task explicit:

```text
Observe what exists
        ↓
Produce a corrected version
```

For more advanced exercises, the learner can edit the broken code directly.

Both interaction modes should be supported.

---

# 31. Two EX4 Editing Modes

## Mode A — Direct Repair

The learner modifies the provided code.

```text
Broken code
    ↓
Edit directly
    ↓
Run
```

## Mode B — Corrected Copy

The original remains visible.

```text
Broken code
     ↓
Reference
     ↓
Your corrected code
```

Mode B is especially useful for teaching because the learner can compare before/after.

---

# 32. EX4 Before / After View

After successful completion:

```text
┌───────────────────────┬────────────────────────┐
│ BEFORE                │ AFTER                  │
├───────────────────────┼────────────────────────┤
│ return a - b          │ return a + b           │
└───────────────────────┴────────────────────────┘
```

The explanation:

> The original implementation performed subtraction instead of addition.

This reinforces the debugging lesson.

---

# 33. EX4 Correct Feedback

```text
✓ All tests passed

You correctly identified and repaired
the implementation.

Why the original failed:
The function used subtraction instead
of addition.

Correct behavior:
a + b
```

---

# 34. EX4 Incorrect Feedback

```text
Not fixed yet.

2 of 4 tests still fail.

The function works for some inputs,
but the required behavior is not yet
satisfied.

Review the failing test cases.
```

This encourages further debugging.

---

# 35. EX4 State Model

```text
INITIAL
   ↓
READ_FAILURE
   ↓
INSPECT_CODE
   ↓
EDITING
   ↓
RUN_TESTS
   ↓
RESULT
   │
   ├── FAIL → INSPECT_CODE
   │
   └── PASS → COMPLETED
```

Optional:

```text
EDITING
   ↓
HINT_REQUESTED
   ↓
EDITING
```

---

# 36. EX4 Component Architecture

```text
ExerciseEX4
│
├── ExerciseHeader
│
├── TaskPanel
│
├── ExpectedBehaviorPanel
│
├── ObservedBehaviorPanel
│
├── ErrorMessagePanel
│
├── BrokenCodePanel
│
├── CodeEditor
│
├── HintPanel
│
├── RunTestsButton
│
├── TestResultsPanel
│
├── BeforeAfterPanel
│
├── ExplanationPanel
│
├── ReferenceSolution
│
└── CompletionPanel
```

Not every exercise needs every component.

For example, a logic error may not have an error message.

---

# 37. EX4 JSON Structure

```json
{
  "type": "exercise",
  "version": "EX4",
  "presentation": "Fix the Code",

  "content": {
    "instruction": "",
    "problem": "",
    "language": "python",

    "brokenCode": "",

    "expectedBehavior": "",

    "observedBehavior": "",

    "errorMessage": null,

    "tests": [],

    "hints": [],

    "referenceSolution": "",

    "explanation": "",

    "keyConcepts": []
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 7
  },

  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

---

# 38. Complete EX4 JSON Example

```json
{
  "type": "exercise",
  "version": "EX4",
  "presentation": "Fix the Code",

  "content": {
    "instruction": "Fix the function so that it returns the sum of a and b.",

    "problem": "The current implementation produces incorrect results.",

    "language": "python",

    "brokenCode": "def add(a, b):\n    return a - b",

    "expectedBehavior": "The function must return the sum of a and b.",

    "observedBehavior": "add(5, 3) returns 2 instead of 8.",

    "errorMessage": null,

    "tests": [
      {
        "input": "add(5, 3)",
        "expectedOutput": "8",
        "visible": true
      },
      {
        "input": "add(10, 20)",
        "expectedOutput": "30",
        "visible": true
      },
      {
        "input": "add(-5, 10)",
        "expectedOutput": "5",
        "visible": false
      },
      {
        "input": "add(0, 0)",
        "expectedOutput": "0",
        "visible": false
      }
    ],

    "hints": [
      {
        "level": 1,
        "text": "Compare the operation performed by the function with the required operation."
      },
      {
        "level": 2,
        "text": "Look at the operator between a and b."
      }
    ],

    "referenceSolution": "def add(a, b):\n    return a + b",

    "explanation": "The original implementation used subtraction. The requirement is addition, so the arithmetic operator must be changed from - to +.",

    "keyConcepts": [
      "functions",
      "return values",
      "arithmetic operators",
      "debugging"
    ]
  },

  "metadata": {
    "difficulty": "easy",
    "estimatedMinutes": 4
  },

  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

---

# 39. EX4 Error-Based JSON Example

For an actual runtime error:

```json
{
  "type": "exercise",
  "version": "EX4",
  "presentation": "Fix the Code",

  "content": {
    "instruction": "Fix the code so that every list element is printed.",

    "language": "python",

    "brokenCode": "numbers = [10, 20, 30]\n\nfor i in range(len(numbers) + 1):\n    print(numbers[i])",

    "expectedBehavior": "Print 10, 20, and 30 without raising an exception.",

    "observedBehavior": "The program prints the three values and then raises IndexError.",

    "errorMessage": "IndexError: list index out of range",

    "tests": [
      {
        "input": "[10, 20, 30]",
        "expectedOutput": "10\n20\n30",
        "visible": true
      }
    ],

    "explanation": "The loop executes one iteration too many because range(len(numbers) + 1) produces an index equal to len(numbers), which is outside the valid index range."
  },

  "completion": {
    "mode": "tests-pass"
  }
}
```

---

# 40. EX4 Reference Solution

The reference solution is useful, but it should normally be hidden until:

```text
learner succeeds
```

or:

```text
learner explicitly requests solution
```

The system should not reveal the answer after the first failed attempt.

---

# 41. EX4 Multiple Fixes

As with EX2, multiple technically correct solutions must be accepted when they satisfy the behavioral contract.

For example, to fix:

```python
for i in range(len(numbers) + 1):
    print(numbers[i])
```

a learner might write:

```python
for i in range(len(numbers)):
    print(numbers[i])
```

or:

```python
for number in numbers:
    print(number)
```

Both can be correct.

Therefore:

> **The test contract determines correctness, not source-code similarity.**

---

# 42. EX4 Minimal Fix Principle

A useful instructional goal is to encourage the learner to make the **smallest necessary correction** when appropriate.

For example:

```text
Broken:
return a - b
```

The learner should recognize that only the operator needs correction.

This teaches:

> Don't rewrite working code unnecessarily when a focused correction is sufficient.

However, this should be a teaching preference rather than a hard restriction unless the exercise explicitly requires it.

---

# 43. EX4 Debugging Evidence Hierarchy

A useful mental model is:

```text
Expected behavior
       ↓
Observed behavior
       ↓
Difference
       ↓
Likely fault
       ↓
Correction
       ↓
Verification
```

This prevents random code modification.

---

# 44. EX4 Example — List Mutation

Task:

> The function should return a new list without modifying the original.

Broken:

```python
def add_item(numbers, item):
    numbers.append(item)
    return numbers
```

The learner must identify:

```text
append()
```

mutates the original list.

One correction:

```python
def add_item(numbers, item):
    return numbers + [item]
```

This is an excellent EX4 because it requires understanding of mutation.

---

# 45. EX4 Example — Dictionary

Task:

> Return `"unknown"` if the key does not exist.

Broken:

```python
def get_role(user):
    return user["role"]
```

A safer implementation:

```python
def get_role(user):
    return user.get("role", "unknown")
```

The learner must understand the failure mode of direct dictionary indexing.

---

# 46. EX4 Example — Authentication

Broken:

```python
def authenticate(user, password):
    return True
```

Requirement:

> Authentication should succeed only when the supplied credentials are valid.

The learner must identify that the implementation performs no meaningful verification.

This type of EX4 is useful after explaining authentication.

---

# 47. EX4 Example — Authorization

Broken:

```python
def authorize(user, resource):
    if user:
        return True

    return False
```

The learner should recognize:

```text
authenticated identity
≠
authorization permission
```

The function must verify the appropriate permission rather than merely checking whether a user exists.

---

# 48. EX4 Example — Exception Propagation

Broken:

```python
def load_user():
    try:
        return database.get_user()
    except Exception:
        return None
```

Task:

> Preserve meaningful failures instead of silently converting every exception into `None`.

The learner might need to:

* narrow the exception
* propagate unexpected exceptions
* handle only the failure it can actually recover from

This can become an advanced EX4.

---

# 49. EX4 Complexity Levels

### Easy

One obvious incorrect operator.

### Medium

One logical or runtime defect.

### Hard

Multiple interacting lines or state changes.

### Advanced

A conceptual or architectural bug.

The version remains:

> **EX4 — Fix the Code**

---

# 50. EX4 Should Normally Have One Primary Bug

For a normal EX4, prefer:

```text
ONE PRIMARY BUG
```

rather than:

```text
five unrelated bugs
```

Why?

Because EX4 is about practicing debugging.

Multiple bugs are more appropriate later in:

> **EX7 — Challenge Exercise**

or:

> **EX8 — Progressive Exercise Set**

---

# 51. EX4 vs EX7

```text
EX4
One focused defect
       ↓
Diagnose
       ↓
Repair

EX7
Complex problem
       ↓
Multiple concepts
       ↓
Potentially multiple defects
       ↓
Design + implement + debug
```

This keeps the versions pedagogically distinct.

---

# 52. EX4 Analytics

Useful metrics include:

```text
attempts
timeToFirstFix
testsBeforeSuccess
hintsUsed
solutionViewed
firstFixSuccessful
completed
```

Especially useful:

> **First-fix success rate**

This measures whether the learner can correctly diagnose a defect without repeated trial-and-error.

---

# 53. EX4 Learning Analytics Example

```json
{
  "exerciseAnalytics": {
    "attempts": 3,
    "testsBeforeSuccess": 2,
    "hintsUsed": 1,
    "solutionViewed": false,
    "firstFixSuccessful": false,
    "completed": true
  }
}
```

These metrics can later support learning insights without turning EX4 into a formal quiz.

---

# 54. EX4 Accessibility

The debugging interface should support:

* keyboard navigation
* accessible code editor
* visible focus
* accessible test results
* accessible error messages
* screen-reader-friendly status updates

For example:

> "Two of four tests passed. Two tests failed."

rather than only showing colored indicators.

---

# 55. EX4 Responsive Design

### Desktop

```text
┌───────────────────────────┬──────────────────────────┐
│ Broken / Editable Code    │ Task + Error + Tests     │
│                           │                          │
│                           │                          │
└───────────────────────────┴──────────────────────────┘
```

### Mobile

```text
Task

Observed Behavior

Error

Code Editor

Run Tests

Results

Hints
```

The learner's editing area should remain the dominant workspace.

---

# 56. EX4 Design Language

Continue the established Tutorial Engine visual system:

* **Light theme**
* Primary: **#F54A8D**
* Secondary: **#0B1B3D**
* no dark theme
* no gradient requirement
* clear code/editor area
* clear error/success states
* educational rather than gaming-oriented
* responsive
* accessible

The visual distinction between:

```text
BROKEN
```

and:

```text
FIXED
```

should be obvious but not overly decorative.

---

# 57. EX4 Authoring Rules

A strong EX4 should:

```text
✓ Have a clearly defined expected behavior
✓ Have reproducible incorrect behavior
✓ Contain a meaningful defect
✓ Give enough evidence to diagnose it
✓ Require the learner to make the correction
✓ Provide tests
✓ Allow retry
✓ Explain the root cause after completion
```

Avoid:

```text
❌ Arbitrary style differences
❌ Bugs that depend on environment
❌ Ambiguous expected behavior
❌ Five unrelated bugs in a basic EX4
❌ Giving away the exact correction immediately
```

---

# 58. EX4 Final Mental Model

```text
                  EX4
             FIX THE CODE
                   │
                   ▼
             BROKEN CODE
                   │
                   ▼
            OBSERVE FAILURE
                   │
                   ▼
             FIND THE CAUSE
                   │
                   ▼
             MODIFY CODE
                   │
                   ▼
               RUN TESTS
                   │
             ┌─────┴─────┐
             ▼           ▼
           FAIL         PASS
             │           │
             ▼           ▼
          DEBUG       COMPLETE
           AGAIN
```

---

# 59. EX4 Final Technical Specification

| Area                      | EX4 Decision                   |
| ------------------------- | ------------------------------ |
| **Block**                 | **ExerciseBlock**              |
| **Version**               | **EX4**                        |
| **Presentation**          | **Fix the Code**               |
| **Primary purpose**       | Debugging practice             |
| **Starting code**         | Broken/incorrect code          |
| **Expected behavior**     | Required                       |
| **Observed behavior**     | Recommended                    |
| **Error message**         | Optional                       |
| **Primary defect**        | Usually one                    |
| **Code editor**           | Required for code EX4          |
| **Tests**                 | Recommended / usually required |
| **Hidden tests**          | Supported                      |
| **Hints**                 | Optional                       |
| **Before/After**          | Optional                       |
| **Reference solution**    | Supported                      |
| **Multiple valid fixes**  | ✅                              |
| **Behavioral validation** | ✅                              |
| **Retry**                 | ✅                              |
| **Progress**              | ✅                              |
| **Quiz score**            | ❌                              |
| **Teaching the mistake**  | ❌ Primary role                 |
| **Practicing the fix**    | ✅                              |
| **Theme**                 | Light                          |
| **Primary**               | **#F54A8D**                    |
| **Secondary**             | **#0B1B3D**                    |
| **Gradient**              | ❌                              |
| **Dark theme**            | ❌                              |
| **Responsive**            | ✅                              |
| **Accessible**            | ✅                              |
| **JSON-driven**           | ✅                              |

---

# 60. ExerciseBlock Progress So Far

We have now completed **four versions**, one at a time:

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
```

This creates:

```text
RECALL
  ↓
IMPLEMENT
  ↓
TRACE
  ↓
DEBUG
```

That is a very strong first half of ExerciseBlock.

---

# 61. EX4 Status

## **EX4 — Fix the Code**

**Complete.** ✅

We stop here.

The next version, only when you say **"yes please"**, will be:

> **EX5 — Guided Exercise**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX5 — Guided Exercise

Yes. We continue with **only EX5**, one version at a time.

The committed sequence remains:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| EX1     | Fill in the Blank        | ✅ Complete     |
| EX2     | Complete the Code        | ✅ Complete     |
| EX3     | Predict the Output       | ✅ Complete     |
| EX4     | Fix the Code             | ✅ Complete     |
| **EX5** | **Guided Exercise**      | 🔵 **CURRENT** |
| EX6     | Independent Exercise     | ⏳              |
| EX7     | Challenge Exercise       | ⏳              |
| EX8     | Progressive Exercise Set | ⏳              |

---

# 1. What Is EX5?

**EX5 — Guided Exercise** is an exercise where the learner completes a practical task with **structured guidance provided step by step**.

The important idea is:

> **The learner performs the work, but the system provides a learning path that prevents them from getting lost.**

The progression is:

```text
TASK
 ↓
STEP 1
 ↓
STEP 2
 ↓
STEP 3
 ↓
STEP 4
 ↓
VERIFY
 ↓
COMPLETE
```

Unlike EX2, the learner is not simply given starter code and told to complete it.

Unlike EX6, the learner is not expected to independently design the entire solution.

---

# 2. EX5's Position in ExerciseBlock

We now have:

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
```

The learning progression becomes:

```text
RECALL
  ↓
IMPLEMENT
  ↓
TRACE
  ↓
DEBUG
  ↓
BUILD WITH GUIDANCE
```

This is an important transition.

---

# 3. EX5 vs EX2

### EX2

The learner receives:

```text
Starter Code
+
Requirements
```

Then implements the missing code.

### EX5

The learner receives:

```text
Goal
+
Step 1
+
Step 2
+
Step 3
+
Step 4
```

The learner is progressively guided through the implementation.

Therefore:

```text
EX2
→ Complete existing implementation

EX5
→ Build something through guided steps
```

---

# 4. EX5 vs EX6

This distinction is even more important.

### EX5

> "I'll guide you through the solution."

### EX6

> "Here is the problem. Solve it yourself."

So:

```text
EX5
GUIDED
  ↓
Support is intentionally provided

EX6
INDEPENDENT
  ↓
Learner determines the solution path
```

---

# 5. EX5 vs Tutorial Explanation

A CodeBlock can explain:

> "Here is how a loop works."

EX5 asks:

> "Now build something using that loop, and I'll guide you through the implementation."

Therefore:

```text
CodeBlock
→ Learn

EX5
→ Do with guidance
```

---

# 6. Primary Objective

EX5 should develop the learner's ability to:

* break a problem into smaller steps
* apply previously learned concepts
* implement incrementally
* verify intermediate results
* understand why each step exists
* recover from mistakes
* gradually reduce dependence on explanation

The ultimate goal is to prepare the learner for **EX6 — Independent Exercise**.

---

# 7. EX5 Core Learning Model

```text
                 GOAL
                  │
                  ▼
          UNDERSTAND TASK
                  │
                  ▼
             STEP 1
                  │
              CHECK
                  │
                  ▼
             STEP 2
                  │
              CHECK
                  │
                  ▼
             STEP 3
                  │
              CHECK
                  │
                  ▼
             STEP 4
                  │
              CHECK
                  │
                  ▼
             COMPLETE
```

The learner should not be overwhelmed by the entire problem at once.

---

# 8. EX5 Example — Simple Function

### Goal

> Build a function that calculates the average of a list of numbers.

Instead of giving the complete task immediately, EX5 guides the learner.

---

## Step 1 — Create the Function

```python id="4wq9tv"
def calculate_average(numbers):
    pass
```

Instruction:

> Create the function that accepts a list called `numbers`.

---

## Step 2 — Handle Empty Input

Guidance:

> What should happen when the list contains no values?

Starter:

```python id="zgnj7h"
def calculate_average(numbers):
    if not numbers:
        return None
```

---

## Step 3 — Calculate the Total

Guidance:

> Now calculate the sum of all values.

The learner adds:

```python id="ym7z9b"
total = sum(numbers)
```

---

## Step 4 — Calculate the Average

Guidance:

> The average is the total divided by the number of values.

The learner adds:

```python id="x7c4tm"
return total / len(numbers)
```

---

## Final Result

```python id="5b3d5p"
def calculate_average(numbers):
    if not numbers:
        return None

    total = sum(numbers)
    return total / len(numbers)
```

The learner has built the solution incrementally.

---

# 9. EX5 Step Design

Each step should answer:

> **What is the learner supposed to accomplish right now?**

A step can contain:

```text
Instruction
Context
Starter Code
Expected Action
Hint
Validation
Explanation
```

---

# 10. EX5 Step Anatomy

```text id="x5p6u4"
┌──────────────────────────────────────┐
│ STEP 2                               │
├──────────────────────────────────────┤
│ GOAL                                 │
│ Handle an empty list.                │
│                                      │
│ WHY                                  │
│ Avoid division by zero.              │
│                                      │
│ YOUR TASK                            │
│ Add the appropriate condition.       │
│                                      │
│ CODE                                 │
│ ┌──────────────────────────────────┐ │
│ │ def calculate_average(numbers):  │ │
│ │     ...                          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [ Check Step ]    [ Hint ]           │
└──────────────────────────────────────┘
```

---

# 11. EX5 Should Reveal Steps Progressively

A strong interaction is:

```text id="6gjk4b"
Step 1
  ↓
Complete
  ↓
Step 2 unlocked
  ↓
Complete
  ↓
Step 3 unlocked
```

This prevents the learner from being presented with a huge wall of instructions.

---

# 12. EX5 Step Progress UI

```text id="20j2yn"
Exercise Progress

● Step 1 — Create Function
✓ Step 2 — Handle Empty Input
○ Step 3 — Calculate Total
○ Step 4 — Calculate Average

          2 / 4 complete
```

Or:

```text id="e8w2ci"
[██████████░░░░░░░░] 50%
```

The textual step labels are important for accessibility and clarity.

---

# 13. EX5 Step Completion

A step should normally have its own validation.

For example:

```text id="6w2r5o"
STEP 1
Create function
      ↓
Check
      ↓
✓ Correct
      ↓
Unlock Step 2
```

This means the learner receives immediate feedback.

---

# 14. EX5 Example — List Filtering

### Goal

> Build a function that returns only the even numbers from a list.

### Step 1

Create the function:

```python id="9g2x7a"
def get_even_numbers(numbers):
    pass
```

### Step 2

Create an empty result list:

```python id="9y8zty"
result = []
```

### Step 3

Loop through the input:

```python id="jy9q1b"
for number in numbers:
```

### Step 4

Check whether the number is even:

```python id="gk3mnc"
if number % 2 == 0:
```

### Step 5

Add it to the result:

```python id="0b2w2h"
result.append(number)
```

### Step 6

Return the result:

```python id="3f5znp"
return result
```

This is a larger exercise than EX2, but the learner is guided through the construction.

---

# 15. EX5 Does Not Have to Be Only Code

Guided exercises can also be conceptual.

For example, after teaching authentication:

### Goal

> Build an authentication flow.

Steps:

```text
Step 1
Identify the user

Step 2
Collect credentials

Step 3
Validate credentials

Step 4
Create authenticated session

Step 5
Handle invalid credentials
```

The learner can complete each conceptual step.

However, because this is an **ExerciseBlock**, each step should involve learner action rather than simply reading an explanation.

---

# 16. EX5 Example — Authentication

### Step 1

> Identify what the authentication function needs.

Learner selects:

```text
username
password
```

### Step 2

> Compare the supplied credentials with the stored credential representation.

Learner completes code.

### Step 3

> Return success only after verification.

Learner implements:

```python id="qf7d3k"
return authenticated
```

### Step 4

> Handle invalid credentials.

Learner adds the failure path.

The exercise therefore teaches the learner to build the process rather than merely describe it.

---

# 17. EX5 Example — Authorization

Goal:

> Implement a permission check.

### Step 1

Identify the required inputs:

```text
user
permission
```

### Step 2

Inspect the user's permissions.

### Step 3

Check whether the requested permission exists.

### Step 4

Return the authorization result.

### Step 5

Test allowed and denied cases.

This is a natural guided exercise for an Authentication & Authorization tutorial.

---

# 18. EX5 Example — Exception Handling

Goal:

> Build a function that safely converts input to an integer.

### Step 1

Create the function:

```python id="q8h7h2"
def safe_int(value):
    pass
```

### Step 2

Attempt conversion:

```python id="xgrbqk"
int(value)
```

### Step 3

Identify the expected conversion failure.

### Step 4

Add the appropriate `try/except`.

### Step 5

Return `None` when conversion fails.

The learner builds the solution while understanding why each part is necessary.

---

# 19. EX5 Guidance Levels

Guidance itself can have levels.

### Level 1 — Goal

> What are we trying to accomplish?

### Level 2 — Direction

> Which concept should you use?

### Level 3 — Structure

> Here is the code structure.

### Level 4 — Strong Hint

> Consider using a `for` loop.

### Level 5 — Partial Solution

> Start the loop with `for number in numbers:`.

This gives the author control over how much support the learner receives.

---

# 20. EX5 Should Not Give the Answer Too Early

A guided exercise should not become:

```text id="9xj3fl"
Instruction
+
Complete Code
+
"Type this"
```

That would reduce the exercise to imitation.

Instead:

```text id="3c1t9b"
Goal
 ↓
Think
 ↓
Attempt
 ↓
Hint if necessary
 ↓
Implement
 ↓
Verify
```

---

# 21. EX5 Hints

Hints should be attached to specific steps.

Example:

```json id="pr9r0m"
{
  "stepId": "step-3",
  "hints": [
    {
      "level": 1,
      "text": "You need to examine every value in the list."
    },
    {
      "level": 2,
      "text": "Which Python construct lets you visit each item?"
    },
    {
      "level": 3,
      "text": "Use a for loop."
    }
  ]
}
```

This is more useful than one global hint system.

---

# 22. EX5 Step Validation

Different steps can use different validation mechanisms.

### Code step

Run tests.

### Multiple-choice step

Check selected option.

### Text step

Compare answer.

### Output step

Run code and compare result.

### Architecture step

Validate required elements.

Therefore:

```text id="h1j5q7"
EX5
→ Multi-step
→ Each step can have its own validation
```

---

# 23. EX5 Validation Example

```text id="1i5j6k"
Step 1
Function exists
        ↓
Validation

Step 2
Empty case handled
        ↓
Validation

Step 3
Loop implemented
        ↓
Validation

Step 4
Correct result returned
        ↓
Final tests
```

---

# 24. EX5 Final Validation

Even when every individual step passes, the complete exercise should normally run an end-to-end test.

```text id="5grh6d"
STEP VALIDATION
      ↓
STEP VALIDATION
      ↓
STEP VALIDATION
      ↓
STEP VALIDATION
      ↓
FINAL TEST SUITE
      ↓
COMPLETE
```

This ensures that the pieces work together.

---

# 25. EX5 UI — Overall

```text id="q6wy6a"
┌──────────────────────────────────────────────────┐
│ EXERCISE                                         │
│ GUIDED EXERCISE                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Build a function that returns even numbers.      │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ ✓ Step 1  Create the function               │ │
│ │ ● Step 2  Create the result list             │ │
│ │ ○ Step 3  Loop through the numbers           │ │
│ │ ○ Step 4  Check for even values              │ │
│ │ ○ Step 5  Return the result                  │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ STEP 2                                           │
│                                                  │
│ Create an empty list that will store the        │
│ matching numbers.                                │
│                                                  │
│ [ Code Editor ]                                  │
│                                                  │
│ [ Check Step ]      [ Hint ]                     │
└──────────────────────────────────────────────────┘
```

---

# 26. EX5 Step Workspace

When the learner opens a step:

```text id="y7v49v"
┌────────────────────────────────────────────┐
│ STEP 3 OF 5                                │
│ Loop Through the Numbers                   │
├────────────────────────────────────────────┤
│                                            │
│ GOAL                                       │
│ Visit every number in the input list.      │
│                                            │
│ WHY                                        │
│ We need to inspect each value before       │
│ deciding whether to keep it.               │
│                                            │
│ YOUR TASK                                  │
│ Complete the loop.                         │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ def get_even_numbers(numbers):         │ │
│ │     result = []                        │ │
│ │                                        │ │
│ │     ______________________________     │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [ Check Step ]      [ Hint ]               │
└────────────────────────────────────────────┘
```

---

# 27. EX5 Step Unlocking

Recommended default:

```text id="n4zq9h"
Step 1
  ↓
must pass
  ↓
Step 2 unlocks
  ↓
must pass
  ↓
Step 3 unlocks
```

But the author can configure whether learners may:

```text id="vq8q8p"
preview later steps
```

without completing them.

This can be useful for advanced learners.

---

# 28. EX5 Navigation Modes

Two modes can be supported.

### Sequential

```text id="m26ujp"
Step 1 → Step 2 → Step 3
```

### Flexible

```text id="o1oqtu"
All steps visible
Learner can navigate between them
```

Default for EX5 should be:

> **Sequential guided progression.**

---

# 29. EX5 Why Sequential Should Be Default

Because the purpose is guided learning.

The learner should experience:

```text id="kw0vye"
One problem
 ↓
One manageable action
 ↓
Feedback
 ↓
Next action
```

This reduces cognitive overload.

---

# 30. EX5 Code Editor Behavior

For code-based EX5, the editor should:

* preserve starter code
* highlight the relevant region
* allow editing
* provide syntax highlighting
* provide indentation support
* allow run/check
* retain learner progress

The system should avoid wiping the learner's work after a failed step.

---

# 31. EX5 Step Persistence

If the learner completes:

```text id="8j8d4a"
Step 1 ✓
Step 2 ✓
Step 3 active
```

and leaves the page, returning should restore:

```text id="h7i2x8"
Step 3
```

with previous progress preserved.

This makes EX5 appropriate for longer practical exercises.

---

# 32. EX5 Progress Model

```json id="z9j19b"
{
  "progress": {
    "currentStep": 3,
    "completedSteps": [
      "step-1",
      "step-2"
    ],
    "totalSteps": 5
  }
}
```

---

# 33. EX5 Step State Model

```text id="14lyfs"
LOCKED
   ↓
AVAILABLE
   ↓
ACTIVE
   ↓
CHECKING
   │
   ├── FAIL → ACTIVE
   │
   └── PASS → COMPLETED
                    ↓
                 NEXT STEP
```

---

# 34. EX5 Complete Exercise State

```text id="s0c9tm"
NOT_STARTED
      ↓
IN_PROGRESS
      ↓
STEP_1_COMPLETE
      ↓
STEP_2_COMPLETE
      ↓
STEP_3_COMPLETE
      ↓
...
      ↓
FINAL_VALIDATION
      ↓
COMPLETED
```

---

# 35. EX5 JSON Structure

```json id="l7pjcm"
{
  "type": "exercise",
  "version": "EX5",
  "presentation": "Guided Exercise",

  "content": {
    "title": "",
    "goal": "",
    "introduction": "",

    "steps": [
      {
        "id": "",
        "order": 1,
        "title": "",
        "objective": "",
        "why": "",
        "instruction": "",
        "starterCode": "",
        "taskType": "",
        "hints": [],
        "validation": {},
        "explanation": ""
      }
    ],

    "finalTests": [],

    "completionMessage": "",
    "keyConcepts": []
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 15
  },

  "completion": {
    "mode": "all-steps-and-final-tests"
  }
}
```

---

# 36. Complete EX5 JSON Example

```json id="j9px6n"
{
  "type": "exercise",
  "version": "EX5",
  "presentation": "Guided Exercise",

  "content": {
    "title": "Build an Even Number Filter",

    "goal": "Build a function that returns a new list containing only the even numbers from the input list.",

    "introduction": "You will build the solution one step at a time. Each step focuses on one part of the implementation.",

    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create the Function",
        "objective": "Create a function that accepts a list called numbers.",
        "why": "The function provides the entry point for the exercise.",
        "instruction": "Create the function with the required parameter.",
        "starterCode": "def get_even_numbers(numbers):\n    pass",
        "taskType": "code",
        "hints": [
          {
            "level": 1,
            "text": "Start with a function definition."
          }
        ],
        "validation": {
          "mode": "syntax-and-signature"
        },
        "explanation": "The function receives the list that we need to process."
      },

      {
        "id": "step-2",
        "order": 2,
        "title": "Create the Result List",
        "objective": "Create an empty list for the values that pass the condition.",
        "why": "We need a separate result rather than modifying the original list.",
        "instruction": "Create an empty list named result.",
        "starterCode": "def get_even_numbers(numbers):\n    result = []",
        "taskType": "code",
        "hints": [
          {
            "level": 1,
            "text": "The result should start as an empty list."
          }
        ],
        "validation": {
          "mode": "state-check"
        },
        "explanation": "The new list allows the function to return filtered values without changing the input."
      },

      {
        "id": "step-3",
        "order": 3,
        "title": "Loop Through the Numbers",
        "objective": "Visit every number in the input list.",
        "why": "Each value must be examined.",
        "instruction": "Add a loop that visits every value in numbers.",
        "starterCode": "for number in numbers:\n    pass",
        "taskType": "code",
        "hints": [
          {
            "level": 1,
            "text": "Use a for loop."
          },
          {
            "level": 2,
            "text": "The loop variable can be called number."
          }
        ],
        "validation": {
          "mode": "behavioral"
        },
        "explanation": "The loop allows the function to inspect each element."
      },

      {
        "id": "step-4",
        "order": 4,
        "title": "Check for Even Values",
        "objective": "Identify whether the current number is even.",
        "why": "Only even numbers should be added to the result.",
        "instruction": "Add a condition that is true when number is even.",
        "starterCode": "if number % 2 == 0:\n    pass",
        "taskType": "code",
        "hints": [
          {
            "level": 1,
            "text": "An even number is divisible by 2."
          }
        ],
        "validation": {
          "mode": "behavioral"
        },
        "explanation": "A remainder of zero when dividing by 2 identifies an even number."
      },

      {
        "id": "step-5",
        "order": 5,
        "title": "Add and Return",
        "objective": "Add matching values to result and return the completed list.",
        "why": "The caller needs the filtered list.",
        "instruction": "Append the matching number and return result after the loop.",
        "starterCode": "result.append(number)\n\nreturn result",
        "taskType": "code",
        "hints": [
          {
            "level": 1,
            "text": "Use append() to add the current number."
          }
        ],
        "validation": {
          "mode": "behavioral"
        },
        "explanation": "append() stores each matching value, and return sends the final list to the caller."
      }
    ],

    "finalTests": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "[2, 4]",
        "visible": true
      },
      {
        "input": "[1, 3, 5]",
        "expectedOutput": "[]",
        "visible": true
      },
      {
        "input": "[-2, -1, 0, 5]",
        "expectedOutput": "[-2, 0]",
        "visible": false
      }
    ],

    "completionMessage": "You successfully built the even-number filter step by step.",

    "keyConcepts": [
      "functions",
      "lists",
      "for loops",
      "conditionals",
      "modulo",
      "append",
      "return values"
    ]
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 15
  },

  "completion": {
    "mode": "all-steps-and-final-tests"
  }
}
```

---

# 37. EX5 Step Types

A guided exercise does not need every step to be identical.

Supported step types can include:

```text id="vuxv4j"
code
text
multiple-choice
prediction
debugging
selection
ordering
terminal
architecture
```

For example:

```text id="7p8j4c"
Step 1 → Choose the correct approach
Step 2 → Write the function
Step 3 → Predict behavior
Step 4 → Implement condition
Step 5 → Run tests
```

This makes EX5 much more powerful than simply a sequence of code blanks.

---

# 38. EX5 Step Type Architecture

```json id="x3d0m8"
{
  "taskType": "code"
}
```

or:

```json id="f8s7oe"
{
  "taskType": "multiple-choice"
}
```

or:

```json id="gk73a5"
{
  "taskType": "prediction"
}
```

The ExerciseBlock renderer can select the appropriate interaction based on `taskType`.

---

# 39. EX5 Guidance vs Hand-Holding

There is an important boundary.

Good guidance:

> "Which Python construct allows you to process every item?"

Too much guidance:

> "Write `for number in numbers:`."

The author should generally move from:

```text
conceptual hint
```

toward:

```text
specific hint
```

only when needed.

---

# 40. EX5 Progressive Hint Model

```text id="vcm0o4"
Attempt
  ↓
No hint
  ↓
Learner struggles
  ↓
Hint 1
  ↓
Still struggles
  ↓
Hint 2
  ↓
Still struggles
  ↓
Hint 3
```

This preserves learner agency.

---

# 41. EX5 Completion Criteria

Default:

```text id="5i6n5h"
ALL REQUIRED STEPS
       +
FINAL TESTS PASS
       ↓
COMPLETE
```

But the author can configure:

```text id="8e0bpl"
requiredSteps
optionalSteps
finalTestsRequired
```

For example:

```json id="mbf6cg"
{
  "completion": {
    "requiredSteps": "all-required",
    "finalTests": "all"
  }
}
```

---

# 42. EX5 Optional Steps

Some steps can be optional extensions.

Example:

```text id="k2g2su"
✓ Step 1
✓ Step 2
✓ Step 3
✓ Step 4

Optional Challenge
○ Optimize the implementation
```

That allows guided exercises to introduce small extensions without turning into EX7.

---

# 43. EX5 Difficulty

### Easy

3–4 guided steps.

```text
Create
→ Modify
→ Return
```

### Medium

5–7 steps.

```text
Plan
→ Create
→ Process
→ Condition
→ Handle edge case
→ Test
```

### Advanced

Several conceptual stages, but still with explicit guidance.

The exercise should not become a completely independent project.

---

# 44. EX5 Should Not Become EX6

A good boundary is:

### EX5

The learner receives:

```text
Goal
+
Step structure
+
Hints
+
Intermediate validation
```

### EX6

The learner receives:

```text
Goal
+
Requirements
+
Examples
+
Constraints
```

and determines:

```text
solution structure
implementation steps
```

independently.

---

# 45. EX5 Should Not Become EX8

EX8 is:

> **Progressive Exercise Set**

which is a collection of exercises that increase in complexity.

EX5 is:

> **One guided exercise with internal steps.**

So:

```text
EX5
One exercise
  ↓
Step 1 → Step 2 → Step 3

EX8
Exercise 1
  ↓
Exercise 2
  ↓
Exercise 3
  ↓
Exercise 4
```

This distinction should remain locked.

---

# 46. EX5 Analytics

Useful metrics:

```text id="7b65ph"
exerciseStarted
stepsStarted
stepsCompleted
currentStep
hintsUsed
attemptsPerStep
timePerStep
finalTestsPassed
completed
```

Especially useful:

> **Where did the learner get stuck?**

Example:

```json id="m3e7cq"
{
  "exerciseAnalytics": {
    "stepsCompleted": 3,
    "totalSteps": 5,
    "currentStep": 4,
    "hintsUsed": 2,
    "averageAttemptsPerStep": 1.6,
    "completed": false
  }
}
```

This can later help identify difficult concepts.

---

# 47. EX5 Persistence

Because EX5 can be longer, progress should be saved.

For example:

```text id="1h0g6j"
User leaves at Step 4
       ↓
Progress saved
       ↓
Returns later
       ↓
Resume Step 4
```

This is particularly important for the Tutorial Engine's broader progress model.

---

# 48. EX5 Accessibility

Every step should expose:

```text id="ojl3w4"
step number
step title
step state
task instructions
validation result
hint controls
```

For example:

> "Step 3 of 5, Loop Through the Numbers, active."

Completed steps should be communicated as completed without relying only on color or icons.

---

# 49. EX5 Responsive Design

### Desktop

```text id="l9c0vp"
┌───────────────────────────┬──────────────────────────┐
│ Step Workspace            │ Exercise Progress        │
│                           │                          │
│ Instructions              │ ✓ Step 1                │
│ Code Editor               │ ✓ Step 2                │
│                           │ ● Step 3                │
│                           │ ○ Step 4                │
│                           │ ○ Step 5                │
└───────────────────────────┴──────────────────────────┘
```

### Mobile

```text id="m5osws"
Exercise Progress
      ↓
Current Step
      ↓
Instructions
      ↓
Workspace
      ↓
Check
      ↓
Next Step
```

The current step should always remain obvious.

---

# 50. EX5 Design Language

Continue the established Tutorial Engine design:

* Light theme
* Primary **#F54A8D**
* Secondary **#0B1B3D**
* No dark theme
* No gradient
* clean educational cards
* clear step progress
* code editor where appropriate
* strong success/error feedback
* responsive
* accessible

The most important visual element is:

> **Where am I in the guided exercise?**

---

# 51. EX5 Authoring Rules

A strong EX5 should:

```text
✓ Have one clear practical goal
✓ Break the goal into meaningful steps
✓ Explain why important steps exist
✓ Require learner action at every step
✓ Provide validation
✓ Provide hints progressively
✓ Preserve learner progress
✓ Perform final end-to-end validation
```

Avoid:

```text
❌ Steps that merely repeat explanations
❌ Giving complete answers immediately
❌ Too many tiny meaningless steps
❌ Turning the exercise into a video/tutorial
❌ Requiring independent architecture decisions
❌ Combining unrelated concepts
```

---

# 52. EX5 Final Mental Model

```text id="4h9pxj"
                    EX5
              GUIDED EXERCISE
                     │
                     ▼
                    GOAL
                     │
                     ▼
                 STEP 1
                     │
                  CHECK
                     │
                     ▼
                 STEP 2
                     │
                  CHECK
                     │
                     ▼
                 STEP 3
                     │
                  CHECK
                     │
                     ▼
                 STEP N
                     │
                  CHECK
                     │
                     ▼
             FINAL TEST SUITE
                     │
                     ▼
                 COMPLETE
```

---

# 53. EX5 Final Technical Specification

| Area                      | EX5 Decision                      |
| ------------------------- | --------------------------------- |
| **Block**                 | **ExerciseBlock**                 |
| **Version**               | **EX5**                           |
| **Presentation**          | **Guided Exercise**               |
| **Primary purpose**       | Build through structured guidance |
| **Exercise goal**         | Required                          |
| **Steps**                 | Required                          |
| **Step ordering**         | Sequential by default             |
| **Step validation**       | ✅                                 |
| **Intermediate feedback** | ✅                                 |
| **Hints**                 | ✅ Recommended                     |
| **Progress persistence**  | ✅                                 |
| **Final tests**           | ✅ Recommended                     |
| **Code editor**           | Optional, depending on step type  |
| **Multiple task types**   | ✅                                 |
| **Retry**                 | ✅                                 |
| **Optional steps**        | Supported                         |
| **Quiz score**            | ❌                                 |
| **Independent design**    | ❌ Primary role                    |
| **Challenge complexity**  | ❌                                 |
| **Theme**                 | Light                             |
| **Primary**               | **#F54A8D**                       |
| **Secondary**             | **#0B1B3D**                       |
| **Gradient**              | ❌                                 |
| **Dark theme**            | ❌                                 |
| **Responsive**            | ✅                                 |
| **Accessible**            | ✅                                 |
| **JSON-driven**           | ✅                                 |

---

# 54. ExerciseBlock Progress

We now have:

```text id="2h6s6n"
EX1 — Fill in the Blank
        ↓
EX2 — Complete the Code
        ↓
EX3 — Predict the Output
        ↓
EX4 — Fix the Code
        ↓
EX5 — Guided Exercise
```

The pedagogical progression is now:

```text
RECALL
   ↓
IMPLEMENT
   ↓
TRACE
   ↓
DEBUG
   ↓
BUILD WITH GUIDANCE
```

That prepares the learner for the next major transition:

```text
GUIDED
   ↓
INDEPENDENT
```

---

# 55. EX5 Status

## **EX5 — Guided Exercise**

**Complete.** ✅

We stop here.

The next version, only when you say **"yes please"**, will be:

> **EX6 — Independent Exercise**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX6 — Independent Exercise

Yes. We continue with **only EX6**, one version at a time.

The committed sequence remains:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| EX1     | Fill in the Blank        | ✅ Complete     |
| EX2     | Complete the Code        | ✅ Complete     |
| EX3     | Predict the Output       | ✅ Complete     |
| EX4     | Fix the Code             | ✅ Complete     |
| EX5     | Guided Exercise          | ✅ Complete     |
| **EX6** | **Independent Exercise** | 🔵 **CURRENT** |
| EX7     | Challenge Exercise       | ⏳              |
| EX8     | Progressive Exercise Set | ⏳              |

---

# 1. What Is EX6?

**EX6 — Independent Exercise** is the point where the learner receives a clearly defined problem but must determine the **solution approach and implementation independently**.

The learner is no longer guided through individual implementation steps.

The core flow is:

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

---

# 2. EX5 → EX6 Transition

This is one of the most important transitions in the ExerciseBlock.

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

The system guides the learner.

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

Therefore:

```text
EX5
Guided construction

        ↓

EX6
Independent construction
```

---

# 3. EX6 Is Not EX2

Both may involve coding, but their learning roles are different.

### EX2

```python
def count_even(numbers):
    # complete here
```

The architecture already exists.

### EX6

```text
Build a function that accepts a list
of numbers and returns all even values.
```

The learner must decide:

```text
Should I use:
for loop?
list comprehension?
filter()?
another approach?
```

The learner chooses the implementation.

---

# 4. EX6 Is Not EX5

### EX5

> Step 1: create the list.

> Step 2: loop through the values.

> Step 3: check the condition.

### EX6

> Build the solution.

The learner decides the steps.

That is the defining characteristic of EX6.

---

# 5. EX6 Is Not EX7

This distinction must remain locked.

### EX6 — Independent Exercise

```text
One focused problem
+
Clear requirements
+
Learner chooses solution
```

### EX7 — Challenge Exercise

```text
Complex problem
+
Multiple concepts
+
More constraints
+
Higher reasoning requirement
+
Potentially ambiguous design decisions
```

So:

```text
EX6
Independent practice

EX7
Advanced challenge
```

---

# 6. Primary Objective

EX6 should develop the learner's ability to:

* interpret a problem independently
* identify relevant concepts
* choose an implementation strategy
* write code from scratch
* test their own solution
* debug independently
* consider edge cases
* verify requirements
* explain their solution

The learner should begin behaving like a developer rather than simply following instructions.

---

# 7. EX6 Core Learning Model

```text
              PROBLEM
                 │
                 ▼
        UNDERSTAND REQUIREMENTS
                 │
                 ▼
            PLAN SOLUTION
                 │
                 ▼
             WRITE CODE
                 │
                 ▼
             RUN TESTS
                 │
          ┌──────┴──────┐
          ▼             ▼
        FAIL           PASS
          │             │
          ▼             ▼
       DEBUG         VERIFY
          │             │
          └──────┐      │
                 ▼      ▼
              COMPLETE
```

The system provides the **problem and validation**, but not the solution path.

---

# 8. EX6 Example — Basic

### Problem

> Write a function called `is_even(number)` that returns `True` when the number is even and `False` otherwise.

The learner decides:

```python
def is_even(number):
    return number % 2 == 0
```

The system does not provide:

```text
Step 1
Use modulo.

Step 2
Divide by 2.

Step 3
Compare remainder.
```

That would make it EX5.

---

# 9. EX6 Example — List Filtering

### Problem

> Write a function `get_positive_numbers(numbers)` that returns a new list containing only positive numbers.

Requirements:

```text
• Do not modify the input list.
• Preserve the original order.
• Return [] when there are no positive values.
```

The learner decides the implementation.

Possible solution:

```python
def get_positive_numbers(numbers):
    return [number for number in numbers if number > 0]
```

But another valid implementation could be:

```python
def get_positive_numbers(numbers):
    result = []

    for number in numbers:
        if number > 0:
            result.append(number)

    return result
```

Both should pass.

---

# 10. EX6 Example — String Processing

### Problem

> Write a function that counts how many vowels appear in a string.

Requirements:

```text
• Count a, e, i, o, u.
• Treat uppercase and lowercase letters equally.
• Return 0 for an empty string.
```

The learner independently decides how to implement it.

---

# 11. EX6 Example — Dictionary

### Problem

> Write a function that receives a list of user records and returns the names of users whose role is `"admin"`.

Example input:

```python
users = [
    {"name": "A", "role": "admin"},
    {"name": "B", "role": "user"},
    {"name": "C", "role": "admin"}
]
```

Expected:

```python
["A", "C"]
```

The learner chooses the implementation strategy.

---

# 12. EX6 Example — Exception Handling

### Problem

> Write a function `safe_divide(a, b)` that returns the result of dividing `a` by `b`. If division by zero occurs, return `None`.

The learner decides whether to use:

```python
try:
    ...
except ZeroDivisionError:
    ...
```

or another valid approach.

The exercise evaluates the required behavior.

---

# 13. EX6 Example — Authentication

### Problem

> Implement a function that verifies whether the supplied username and password match a stored credential record.

Requirements might include:

```text
• Return True for valid credentials.
• Return False for invalid credentials.
• Do not expose the stored password.
• Handle an unknown username safely.
```

The learner determines the implementation.

This is a good bridge from conceptual authentication teaching to practical application.

---

# 14. EX6 Example — Authorization

### Problem

> Implement a function that determines whether a user has permission to perform an action.

Requirements:

```text
• User must have the requested permission.
• Missing permissions must result in False.
• The function must not grant access merely because a user exists.
```

The learner decides how to implement the check.

---

# 15. EX6 Problem Statement Structure

A strong EX6 should provide:

```text
Problem
Requirements
Input
Output
Examples
Constraints
Edge Cases
```

But it should **not provide the implementation steps**.

---

# 16. EX6 Problem UI

```text
┌──────────────────────────────────────────────────┐
│ EXERCISE                                         │
│ INDEPENDENT EXERCISE                             │
├──────────────────────────────────────────────────┤
│                                                  │
│ PROBLEM                                          │
│                                                  │
│ Write a function that returns all even numbers   │
│ from a list.                                    │
│                                                  │
├──────────────────────────────────────────────────┤
│ REQUIREMENTS                                     │
│                                                  │
│ • Return a new list.                             │
│ • Do not modify the input.                       │
│ • Preserve order.                                │
│ • Return [] when no values are even.             │
│                                                  │
├──────────────────────────────────────────────────┤
│ EXAMPLES                                         │
│                                                  │
│ [1,2,3,4] → [2,4]                                │
│ [1,3,5]   → []                                   │
│                                                  │
├──────────────────────────────────────────────────┤
│ YOUR SOLUTION                                    │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │                                              │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Run Tests ]        [ Submit ]                 │
└──────────────────────────────────────────────────┘
```

---

# 17. EX6 Optional Planning Area

Although EX6 should not provide a guided implementation, it can encourage planning.

For example:

```text
PLAN YOUR SOLUTION

Approach:
[________________________________]

Important edge cases:
[________________________________]
```

This should be **optional**, not a mandatory guided sequence.

The purpose is to teach independent problem solving.

---

# 18. EX6 Planning Is Not Guidance

This distinction is subtle but important.

The system may ask:

> "What approach will you use?"

But it should not say:

> "Step 1: create a result list."

The first encourages independent planning.

The second gives away the solution path.

Therefore:

```text
Planning prompt
✓ EX6

Implementation steps
→ EX5
```

---

# 19. EX6 Tests

Tests become extremely important because the learner is working independently.

The learner needs a reliable way to determine:

> "Does my solution actually satisfy the problem?"

The flow is:

```text
YOUR SOLUTION
      ↓
RUN TESTS
      ↓
RESULTS
```

---

# 20. EX6 Visible Tests

Example:

```text
Test 1
Input: [1,2,3,4]
Expected: [2,4]

Test 2
Input: [1,3,5]
Expected: []
```

These help the learner understand the contract.

---

# 21. EX6 Hidden Tests

Hidden tests verify that the learner has generalized the solution.

Example:

```text
Hidden:
[]
[-2,-4,-1]
[0,2,4]
[1,2,3,4,5,6]
```

This discourages hardcoding the visible examples.

---

# 22. EX6 Test Architecture

```text
                SOLUTION
                    │
                    ▼
              VISIBLE TESTS
                    │
                    ▼
               HIDDEN TESTS
                    │
                    ▼
             REQUIREMENT CHECK
                    │
             ┌──────┴──────┐
             ▼             ▼
           FAIL           PASS
             │             │
             ▼             ▼
          DEBUG         COMPLETE
```

---

# 23. EX6 Feedback

Feedback should not reveal the implementation.

### Incorrect

```text
2 of 5 tests passed.

Your implementation does not handle
empty input correctly.
```

This tells the learner **what behavior failed**, not exactly what code to write.

### Correct

```text
✓ All tests passed.

Your implementation satisfies the
required behavior.
```

---

# 24. EX6 Failed Tests

A useful result panel:

```text
┌──────────────────────────────────────────────┐
│ TEST RESULTS                                 │
├──────────────────────────────────────────────┤
│ ✓ [1,2,3,4] → [2,4]                          │
│ ✓ [1,3,5]   → []                             │
│ ✗ []        → expected []                    │
│ ✓ [0,2,4]   → [0,2,4]                        │
│ ✗ [-2,-4]   → expected []                    │
├──────────────────────────────────────────────┤
│ 3 / 5 tests passed                           │
└──────────────────────────────────────────────┘
```

The learner must diagnose the issue independently.

---

# 25. EX6 Hints

Hints can exist, but they should be **less direct than EX5**.

For example:

### Hint 1

> Think about what should happen when the input list contains no matching values.

### Hint 2

> Check whether your solution always creates a new result.

### Hint 3

> Consider how your condition handles negative values.

Notice that the system still does not give:

> "Write `result = []`."

That would move toward guided learning.

---

# 26. EX6 Hint Policy

Recommended:

```text
First attempt
→ No hint automatically

Learner requests help
→ Conceptual hint

Still stuck
→ Stronger conceptual hint

Repeated difficulty
→ Optional solution explanation
```

The learner remains responsible for the implementation.

---

# 27. EX6 Reference Solution

A reference solution can be shown after:

```text
✓ successful completion
```

or:

```text
learner explicitly requests solution
```

The reference solution should explain:

```text
Approach
Reasoning
Edge cases
Complexity
```

rather than simply dumping code.

---

# 28. EX6 Reference Solution Example

For the even-number exercise:

```python
def get_even_numbers(numbers):
    result = []

    for number in numbers:
        if number % 2 == 0:
            result.append(number)

    return result
```

Explanation:

> Iterate through each value, check divisibility by 2, append matching values to a new list, and return that list.

Complexity:

```text
Time: O(n)
Space: O(n) in the worst case
```

This can reinforce good engineering habits without turning EX6 into BestPracticeBlock.

---

# 29. EX6 Multiple Valid Solutions

This is critical.

For:

> Return all even numbers.

Valid:

```python
return [x for x in numbers if x % 2 == 0]
```

Also valid:

```python
result = []

for x in numbers:
    if x % 2 == 0:
        result.append(x)

return result
```

Therefore:

> **Behavioral tests determine correctness.**

Not:

> Exact source-code comparison.

---

# 30. EX6 Constraints

Constraints prevent ambiguity.

For example:

```text
• Do not modify the input list.
• Preserve element order.
• Do not use external libraries.
```

Constraints can also intentionally test algorithmic thinking.

Example:

> Solve the problem without using `set()`.

This is appropriate when the constraint is pedagogically relevant.

---

# 31. EX6 Edge Cases

A strong independent exercise should make important edge cases discoverable.

Example:

```text
Empty input
Single value
All matching
No matching
Negative values
Zero
Duplicate values
```

The learner should consider these without receiving a step-by-step solution.

---

# 32. EX6 Complexity Expectations

For suitable exercises, the author may specify:

```text
Expected complexity:
O(n)
```

But do not necessarily reveal the implementation.

Example:

> Your solution should process the list in linear time.

The learner then determines how.

---

# 33. EX6 Code Editor

The editor should begin relatively open.

Unlike EX2:

```text
def function(...):
    # complete here
```

EX6 can provide only the function signature:

```python
def get_even_numbers(numbers):
    pass
```

or even a blank editor when the problem requires a complete program.

The learner owns the implementation.

---

# 34. EX6 Editor Features

Recommended:

```text
syntax highlighting
auto indentation
bracket matching
code formatting
run tests
clear errors
keyboard shortcuts
```

Optional:

```text
autocomplete
documentation
language-specific help
```

Avoid overly powerful assistance if the exercise is intended to measure independent ability.

---

# 35. EX6 State Model

```text
NOT_STARTED
     ↓
READING
     ↓
PLANNING
     ↓
IMPLEMENTING
     ↓
TESTING
     │
     ├── FAIL → DEBUGGING
     │              ↓
     │          IMPLEMENTING
     │
     └── PASS → SUBMITTED
                    ↓
                 COMPLETE
```

---

# 36. EX6 Completion Flow

```text
Problem
  ↓
Learner writes solution
  ↓
Run tests
  ↓
All required tests pass?
  │
  ├── No → Continue debugging
  │
  └── Yes
       ↓
   Submit
       ↓
  Exercise Complete
```

---

# 37. EX6 Component Architecture

```text
ExerciseEX6
│
├── ExerciseHeader
│
├── ProblemPanel
│
├── RequirementsPanel
│
├── InputOutputPanel
│
├── ExamplesPanel
│
├── ConstraintsPanel
│
├── OptionalPlanningPanel
│
├── CodeEditor
│
├── HintPanel
│
├── RunTestsButton
│
├── TestResultsPanel
│
├── ReferenceSolution
│
├── ExplanationPanel
│
└── CompletionPanel
```

---

# 38. EX6 JSON Structure

```json
{
  "type": "exercise",
  "version": "EX6",
  "presentation": "Independent Exercise",

  "content": {
    "title": "",
    "problem": "",
    "language": "python",

    "requirements": [],

    "input": {
      "description": ""
    },

    "output": {
      "description": ""
    },

    "examples": [],

    "constraints": [],

    "starterCode": "",

    "tests": [],

    "hints": [],

    "referenceSolution": "",

    "explanation": "",

    "keyConcepts": []
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 15
  },

  "completion": {
    "mode": "tests-pass"
  }
}
```

---

# 39. Complete EX6 JSON Example

```json
{
  "type": "exercise",
  "version": "EX6",
  "presentation": "Independent Exercise",

  "content": {
    "title": "Filter Positive Numbers",

    "problem": "Write a function called get_positive_numbers(numbers) that returns a new list containing only positive numbers.",

    "language": "python",

    "requirements": [
      "Return a new list.",
      "Do not modify the input list.",
      "Preserve the original order.",
      "Return an empty list when there are no positive numbers."
    ],

    "input": {
      "description": "A list of integers."
    },

    "output": {
      "description": "A new list containing only positive integers."
    },

    "examples": [
      {
        "input": "[1, -2, 3, -4]",
        "expectedOutput": "[1, 3]"
      },
      {
        "input": "[-1, -2]",
        "expectedOutput": "[]"
      },
      {
        "input": "[5, 0, 2]",
        "expectedOutput": "[5, 2]"
      }
    ],

    "constraints": [
      "Do not modify the input list."
    ],

    "starterCode": "def get_positive_numbers(numbers):\n    pass",

    "tests": [
      {
        "input": "[1, -2, 3, -4]",
        "expectedOutput": "[1, 3]",
        "visible": true
      },
      {
        "input": "[-1, -2]",
        "expectedOutput": "[]",
        "visible": true
      },
      {
        "input": "[5, 0, 2]",
        "expectedOutput": "[5, 2]",
        "visible": true
      },
      {
        "input": "[]",
        "expectedOutput": "[]",
        "visible": false
      },
      {
        "input": "[-10, 10, -20, 20]",
        "expectedOutput": "[10, 20]",
        "visible": false
      }
    ],

    "hints": [
      {
        "level": 1,
        "text": "Think about how you can examine every value in the input."
      },
      {
        "level": 2,
        "text": "You need to keep only values that satisfy a condition."
      }
    ],

    "referenceSolution": "def get_positive_numbers(numbers):\n    return [number for number in numbers if number > 0]",

    "explanation": "The solution creates a new list containing only values greater than zero while preserving the original order and leaving the input list unchanged.",

    "keyConcepts": [
      "lists",
      "iteration",
      "conditions",
      "list comprehension",
      "immutability of input"
    ]
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 10
  },

  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

---

# 40. EX6 Optional Planning Model

For larger exercises:

```json
{
  "planning": {
    "enabled": true,
    "prompts": [
      "What approach will you use?",
      "What edge cases should you consider?"
    ],
    "required": false
  }
}
```

The planning area should help the learner develop professional problem-solving habits without revealing the solution.

---

# 41. EX6 Planning UI

```text
┌──────────────────────────────────────────────┐
│ PLAN YOUR SOLUTION                            │
├──────────────────────────────────────────────┤
│                                              │
│ What approach will you use?                  │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ What edge cases should you consider?         │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [ Start Coding ]                             │
└──────────────────────────────────────────────┘
```

This is optional because EX6 should not force every learner through the same thinking process.

---

# 42. EX6 Failure Handling

When the learner's code fails:

```text
Your solution failed 2 of 5 tests.
```

Then provide:

```text
Failing test
Input
Expected behavior
Actual behavior
```

Avoid automatically giving:

```text
Replace line 4 with:
...
```

because that would turn EX6 into guided debugging.

---

# 43. EX6 Debugging Philosophy

The learner should independently move through:

```text
Failure
 ↓
Observation
 ↓
Hypothesis
 ↓
Code change
 ↓
Test
```

This combines the earlier skills from:

```text
EX3 → Predict
EX4 → Debug
```

into an independent exercise.

---

# 44. EX6 Learning Progression

EX6 effectively combines several earlier skills:

```text
EX1
Recall
   +
EX2
Implementation
   +
EX3
Execution reasoning
   +
EX4
Debugging
   +
EX5
Guided construction
        ↓
      EX6
Independent problem solving
```

That is why EX6 is an important milestone.

---

# 45. EX6 Analytics

Useful metrics:

```text
timeSpent
attempts
testsRun
testsPassed
testsFailed
hintsUsed
solutionViewed
planningUsed
firstSubmissionPassed
completed
```

Especially important:

> **First-submission success**

and:

> **Time to successful solution**

Example:

```json
{
  "exerciseAnalytics": {
    "attempts": 4,
    "testsRun": 6,
    "hintsUsed": 1,
    "solutionViewed": false,
    "firstSubmissionPassed": false,
    "completed": true
  }
}
```

---

# 46. EX6 Mastery Signal

A learner who can:

```text
read requirement
   ↓
design solution
   ↓
implement
   ↓
test
   ↓
debug
   ↓
pass hidden tests
```

is demonstrating a significantly higher level of practical understanding than someone who can only fill blanks.

Therefore EX6 can become a strong **practice/mastery signal**, while still remaining an ExerciseBlock rather than a QuizBlock.

---

# 47. EX6 Accessibility

The interface should support:

* keyboard-first coding
* accessible problem description
* accessible test results
* visible focus
* screen-reader status updates
* keyboard-accessible hints
* accessible completion state

Example announcement:

> "Test run complete. Three of five tests passed."

---

# 48. EX6 Responsive Design

### Desktop

```text
┌─────────────────────────────┬──────────────────────┐
│ Problem                     │ Requirements         │
│                             │ Examples             │
│ Code Editor                 │ Tests                │
│                             │                      │
└─────────────────────────────┴──────────────────────┘
```

### Mobile

```text
Problem
   ↓
Requirements
   ↓
Examples
   ↓
Code Editor
   ↓
Run Tests
   ↓
Results
```

The code editor remains the main workspace.

---

# 49. EX6 Design Language

Continue the established Tutorial Engine visual language:

* Light theme
* Primary **#F54A8D**
* Secondary **#0B1B3D**
* No dark theme
* No gradient
* clean professional learning workspace
* minimal distraction
* clear test feedback
* responsive
* accessible

EX6 should feel more like a **developer workspace** than a simple question card.

---

# 50. EX6 Authoring Rules

A strong EX6 should:

```text
✓ Have one clear practical problem
✓ Provide precise requirements
✓ Provide examples
✓ Define input/output
✓ Define important constraints
✓ Allow implementation freedom
✓ Include hidden tests
✓ Encourage edge-case thinking
✓ Provide feedback without giving the solution
✓ Have a clear completion condition
```

Avoid:

```text
❌ Step-by-step implementation instructions
❌ Giving away the algorithm
❌ Excessive hints
❌ Ambiguous requirements
❌ Multiple unrelated problems
❌ Challenge-level complexity
```

---

# 51. EX6 Relationship to BestPracticeBlock

After completing EX6, a later BestPracticeBlock might explain:

> "A good solution should avoid mutating the input."

But EX6 should primarily let the learner **discover the importance of that requirement through implementation and testing**.

Thus:

```text
BestPracticeBlock
→ Explain the practice

EX6
→ Apply the practice independently
```

---

# 52. EX6 Relationship to QuestionBlock

QuestionBlock might ask:

> Why should a function avoid modifying its input?

EX6 might require:

> Implement a function that returns a new filtered list without modifying the input.

Thus:

```text
QuestionBlock
→ Explain

EX6
→ Implement
```

---

# 53. EX6 Relationship to ProjectBlock

This distinction is also important.

### EX6

```text
Focused problem
One meaningful skill
Short/medium duration
```

### ProjectBlock

```text
Larger real-world application
Multiple concepts
Multiple components
Longer implementation
```

Therefore EX6 should remain focused.

---

# 54. EX6 Difficulty Boundary

A useful rule:

```text
EX6
≈ one focused practical problem
```

For example:

> Implement a function that validates a password according to three requirements.

Good.

But:

> Build a complete authentication system with registration, login, password reset, sessions, roles, permissions, audit logs, and database integration.

That is no longer EX6.

It belongs closer to:

```text
ProjectBlock
```

or an advanced Challenge Exercise.

---

# 55. EX6 Final Mental Model

```text
                     EX6
            INDEPENDENT EXERCISE
                     │
                     ▼
                  PROBLEM
                     │
                     ▼
             UNDERSTAND REQUIREMENTS
                     │
                     ▼
               PLAN YOUR APPROACH
                     │
                     ▼
                 IMPLEMENT
                     │
                     ▼
                  TEST
                     │
              ┌──────┴──────┐
              ▼             ▼
            FAIL           PASS
              │             │
              ▼             ▼
           DEBUG         VERIFY
              │             │
              └──────┐      │
                     ▼      ▼
                   COMPLETE
```

---

# 56. EX6 Final Technical Specification

| Area                           | EX6 Decision                   |
| ------------------------------ | ------------------------------ |
| **Block**                      | **ExerciseBlock**              |
| **Version**                    | **EX6**                        |
| **Presentation**               | **Independent Exercise**       |
| **Primary purpose**            | Independent problem solving    |
| **Problem statement**          | Required                       |
| **Requirements**               | Required                       |
| **Input / Output**             | Required for coding tasks      |
| **Examples**                   | Recommended                    |
| **Constraints**                | Recommended                    |
| **Starter code**               | Optional/minimal               |
| **Implementation steps**       | ❌ Not provided                 |
| **Planning**                   | Optional                       |
| **Tests**                      | ✅ Required for code exercises  |
| **Hidden tests**               | ✅ Recommended                  |
| **Hints**                      | Optional, less direct than EX5 |
| **Reference solution**         | Supported                      |
| **Multiple valid solutions**   | ✅                              |
| **Behavioral validation**      | ✅                              |
| **Retry**                      | ✅                              |
| **Progress**                   | ✅                              |
| **Quiz score**                 | ❌                              |
| **Guided workflow**            | ❌                              |
| **Challenge-level complexity** | ❌                              |
| **Theme**                      | Light                          |
| **Primary**                    | **#F54A8D**                    |
| **Secondary**                  | **#0B1B3D**                    |
| **Gradient**                   | ❌                              |
| **Dark theme**                 | ❌                              |
| **Responsive**                 | ✅                              |
| **Accessible**                 | ✅                              |
| **JSON-driven**                | ✅                              |

---

# 57. ExerciseBlock Progress

We now have:

```text
EX1 — Fill in the Blank
        ↓
EX2 — Complete the Code
        ↓
EX3 — Predict the Output
        ↓
EX4 — Fix the Code
        ↓
EX5 — Guided Exercise
        ↓
EX6 — Independent Exercise
```

The learning progression is now:

```text
RECALL
   ↓
IMPLEMENT
   ↓
TRACE
   ↓
DEBUG
   ↓
BUILD WITH GUIDANCE
   ↓
BUILD INDEPENDENTLY
```

This is exactly the point where the learner is ready for the next difficulty jump.

---

# 58. EX6 Status

## **EX6 — Independent Exercise**

**Complete.** ✅

We stop here.

The next version, only when you say **"yes please"**, will be:

> **EX7 — Challenge Exercise**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX7 — Challenge Exercise

Yes. We continue with **only EX7**, exactly one version at a time.

The committed sequence remains:

| Version | Presentation             | Status         |
| ------- | ------------------------ | -------------- |
| EX1     | Fill in the Blank        | ✅ Complete     |
| EX2     | Complete the Code        | ✅ Complete     |
| EX3     | Predict the Output       | ✅ Complete     |
| EX4     | Fix the Code             | ✅ Complete     |
| EX5     | Guided Exercise          | ✅ Complete     |
| EX6     | Independent Exercise     | ✅ Complete     |
| **EX7** | **Challenge Exercise**   | 🔵 **CURRENT** |
| EX8     | Progressive Exercise Set | ⏳              |

---

# 1. What Is EX7?

**EX7 — Challenge Exercise** is the advanced exercise format where the learner must solve a **more complex, realistic problem by combining multiple concepts**.

The defining idea is:

> **The learner is given a challenging problem, but the solution path is intentionally not prescribed.**

The learner must:

```text
UNDERSTAND
   ↓
ANALYZE
   ↓
DESIGN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
DEBUG
   ↓
OPTIMIZE / REFINE
   ↓
VERIFY
```

EX7 is therefore the highest-complexity **single exercise** inside ExerciseBlock.

---

# 2. EX6 → EX7

The distinction must remain very clear.

### EX6 — Independent Exercise

```text
Focused problem
      ↓
Independent solution
      ↓
Tests
```

### EX7 — Challenge Exercise

```text
Complex problem
      ↓
Multiple concepts
      ↓
Design decisions
      ↓
Implementation
      ↓
Edge cases
      ↓
Testing
      ↓
Debugging
      ↓
Refinement
```

So:

```text
EX6
Independent Practice

        ↓

EX7
Advanced Challenge
```

---

# 3. EX7 Is Still One Exercise

This is important because **EX8** comes next.

EX7 is:

```text
ONE complex challenge
```

EX8 is:

```text
MULTIPLE exercises
progressively increasing in difficulty
```

Therefore:

```text
EX7
Challenge Exercise
        ↓
One substantial problem

EX8
Progressive Exercise Set
        ↓
Exercise 1
Exercise 2
Exercise 3
...
```

---

# 4. EX7 Is Not ProjectBlock

EX7 can be substantial, but it should remain smaller and more focused than a project.

### EX7

```text
One challenging problem
Multiple concepts
Limited scope
Short/medium duration
```

### ProjectBlock

```text
Real-world application
Multiple components
Broader requirements
Longer duration
Potentially multiple files/modules
```

A useful boundary is:

> **EX7 challenges the learner's problem-solving ability. ProjectBlock challenges the learner's ability to build an application.**

---

# 5. Primary Objective

EX7 should develop:

* advanced problem decomposition
* independent design decisions
* multi-concept integration
* edge-case reasoning
* debugging
* trade-off analysis
* defensive programming
* test design
* performance awareness
* code quality
* technical reasoning

The learner should be forced to think:

> "How should I solve this?"

rather than:

> "What line should I write next?"

---

# 6. EX7 Core Learning Model

```text
                  CHALLENGE
                     │
                     ▼
              UNDERSTAND PROBLEM
                     │
                     ▼
              IDENTIFY CONSTRAINTS
                     │
                     ▼
               DESIGN SOLUTION
                     │
                     ▼
                IMPLEMENT
                     │
                     ▼
                 TEST
                     │
              ┌──────┴──────┐
              ▼             ▼
            FAIL           PASS
              │             │
              ▼             ▼
           DEBUG         ANALYZE
              │             │
              └──────┐      │
                     ▼      ▼
                  REFINE
                     │
                     ▼
                  VERIFY
                     │
                     ▼
                 COMPLETE
```

---

# 7. EX7 Challenge Characteristics

A strong EX7 normally combines **two or more previously learned concepts**.

For example:

```text
Lists
+
Functions
+
Conditions
+
Exception Handling
```

or:

```text
Authentication
+
Authorization
+
Error Handling
+
Validation
```

or:

```text
References
+
Mutation
+
Copying
+
State Management
```

The challenge should feel like a natural application of the concepts already taught.

---

# 8. EX7 Example — Multi-Concept Python Challenge

### Problem

> Build a function that processes a list of user records and returns the names of users who are eligible for an admin operation.

Requirements:

```text
• Ignore malformed records.
• User must have an active status.
• User must contain the "admin" permission.
• Preserve input order.
• Do not modify the original list.
• Duplicate users should not appear twice.
```

Now the learner must reason about:

```text
lists
+
dictionaries
+
conditions
+
validation
+
duplicates
+
order preservation
+
immutability
```

This is clearly more demanding than EX6.

---

# 9. EX7 Example — Authentication Challenge

### Challenge

> Build a small credential-validation function that safely handles valid users, invalid credentials, unknown users, and malformed input.

Requirements:

```text
1. Unknown users must fail authentication.
2. Incorrect passwords must fail.
3. Valid credentials must succeed.
4. Malformed records must not crash the entire operation.
5. Sensitive credential information must not be returned.
6. The function should return a predictable result.
```

The learner must determine:

```text
validation
+
lookup
+
comparison
+
exception handling
+
result design
```

The implementation path is intentionally left open.

---

# 10. EX7 Example — Authorization Challenge

### Challenge

> Implement an authorization function that determines whether a user may perform an action on a resource.

The system provides:

```text
User
Resource
Requested Action
Permissions
```

Requirements may include:

```text
• User must be authenticated.
• Required permission must exist.
• Resource ownership may grant access.
• Admin permission may override normal restrictions.
• Missing permission must deny access.
• Invalid input must fail safely.
```

Now the learner must design the decision logic.

---

# 11. EX7 Decision Logic

A learner might independently design:

```text
Authenticated?
     │
 ┌───┴───┐
No      Yes
│         │
Deny    Admin?
          │
       ┌──┴──┐
      Yes    No
       │      │
      Allow  Owner?
              │
           ┌──┴──┐
          Yes    No
           │      │
         Allow  Permission?
                   │
                ┌──┴──┐
               Yes    No
                │      │
              Allow   Deny
```

The exercise does not have to provide this decision tree.

The learner should derive it.

---

# 12. EX7 Multiple Valid Architectures

EX7 should generally allow different valid implementations.

For example, authorization can be written using:

```text
nested conditions
```

or:

```text
guard clauses
```

or:

```text
helper functions
```

provided the behavioral contract is satisfied.

This encourages engineering judgment.

---

# 13. EX7 Complexity Comes From Reasoning

A challenge should not become difficult merely because it contains 200 lines of code.

Instead, difficulty should come from:

```text
multiple conditions
+
interactions
+
edge cases
+
constraints
+
design decisions
```

For example:

> "Write 300 lines of repetitive code."

is not a meaningful EX7.

But:

> "Design a permission evaluation function with conflicting permissions, ownership, and administrative override."

is.

---

# 14. EX7 Problem Statement

The problem should provide enough information to define success.

Recommended structure:

```text
Challenge
Problem
Context
Requirements
Inputs
Outputs
Examples
Constraints
Edge Cases
Performance Expectations
```

But **not implementation steps**.

---

# 15. EX7 UI

```text
┌──────────────────────────────────────────────────┐
│ EXERCISE                                         │
│ CHALLENGE EXERCISE                               │
├──────────────────────────────────────────────────┤
│                                                  │
│ 🔥 CHALLENGE                                     │
│                                                  │
│ Build a permission evaluator that determines     │
│ whether a user can perform an action on a        │
│ resource.                                        │
│                                                  │
├──────────────────────────────────────────────────┤
│ CONTEXT                                          │
│                                                  │
│ Users may receive access through permissions,    │
│ ownership, or administrative privileges.         │
│                                                  │
├──────────────────────────────────────────────────┤
│ REQUIREMENTS                                     │
│                                                  │
│ • Authentication is required.                    │
│ • Owners may access their resources.             │
│ • Admins may override normal restrictions.       │
│ • Missing permissions must deny access.           │
│ • Invalid input must fail safely.                 │
│                                                  │
├──────────────────────────────────────────────────┤
│ YOUR SOLUTION                                    │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │                                              │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Run Tests ]       [ Submit Challenge ]        │
└──────────────────────────────────────────────────┘
```

The visual language should communicate:

> **This is harder than a normal exercise.**

But it should remain professional rather than gamified.

---

# 16. EX7 Challenge Badge

A small badge is useful:

```text
CHALLENGE
```

or:

```text
ADVANCED
```

The badge should not dominate the page.

The learner should understand:

> This exercise requires independent reasoning.

---

# 17. EX7 No Guided Steps

This is one of the most important rules.

Do **not** structure the challenge as:

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

That would turn it back into EX5.

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

Then:

```text
YOU DESIGN THE SOLUTION
```

---

# 18. EX7 Optional Planning

Unlike EX5, planning can be useful but remains optional.

Example:

```text
┌─────────────────────────────────────────────┐
│ OPTIONAL: PLAN BEFORE CODING                │
├─────────────────────────────────────────────┤
│ What are the major cases?                   │
│                                             │
│ [                                         ] │
│                                             │
│ What approach will you use?                 │
│                                             │
│ [                                         ] │
└─────────────────────────────────────────────┘
```

This encourages expert behavior without prescribing the answer.

---

# 19. EX7 Edge Cases

Challenge exercises should deliberately include important edge cases.

For example, authorization:

```text
1. Unauthenticated user
2. Authenticated user without permission
3. User with permission
4. Resource owner
5. Admin
6. Invalid user object
7. Missing resource
8. Unknown action
```

The learner should reason through these cases.

---

# 20. EX7 Test Strategy

Testing should be more sophisticated than EX6.

Instead of:

```text
3 straightforward examples
```

use:

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

---

# 21. EX7 Test Matrix

For authorization:

| Case | Authenticated | Owner | Permission | Admin | Expected |
| ---- | ------------: | ----: | ---------: | ----: | -------- |
| 1    |            No |    No |         No |    No | Deny     |
| 2    |           Yes |    No |         No |    No | Deny     |
| 3    |           Yes |    No |        Yes |    No | Allow    |
| 4    |           Yes |   Yes |         No |    No | Allow    |
| 5    |           Yes |    No |         No |   Yes | Allow    |
| 6    |           Yes |    No |        Yes |   Yes | Allow    |
| 7    |       Invalid |     — |          — |     — | Deny     |

The learner must make their implementation satisfy the complete behavior.

---

# 22. EX7 Hidden Tests

Hidden tests should probe interactions.

For example:

```text
Owner + no permission
Admin + no permission
Authenticated + unknown action
Malformed permission list
Duplicate permissions
Missing resource
```

This is where EX7 becomes substantially harder than EX6.

---

# 23. EX7 Test Feedback

The system should provide enough information to debug without exposing the hidden tests.

Example:

```text
7 / 10 tests passed.

Failed behavior:
Resource owners are correctly handled,
but administrative override is not working.

Review your authorization logic.
```

This gives direction without revealing the implementation.

---

# 24. EX7 Failure Categories

The system can classify failures:

```text
Logic Failure
Edge Case Failure
Validation Failure
Exception Handling Failure
Performance Failure
Security Requirement Failure
```

For example:

```text
⚠ Authorization requirement failed

An unauthenticated request was allowed.
```

This is more informative than:

```text
Wrong answer.
```

---

# 25. EX7 Security-Sensitive Challenges

For authentication/authorization topics, EX7 should emphasize **behavioral security requirements**.

For example:

> The client interface must not be treated as the authorization boundary.

The challenge can require the learner to implement authorization at the protected operation.

This is appropriate for the project's Authentication & Authorization domain.

---

# 26. EX7 Example — Backend Authorization Challenge

### Problem

> Implement an authorization guard for an admin API operation.

Requirements:

```text
• Request must have an authenticated identity.
• Identity must contain the required role/permission.
• Missing identity must be rejected.
• Insufficient privileges must be rejected.
• Successful requests may continue.
• Authorization must be enforced server-side.
```

The learner decides the guard structure.

Possible conceptual result:

```text
Request
  ↓
Authenticate
  ↓
Identify user
  ↓
Check permission
  ↓
Allow / Deny
```

The exercise should test behavior rather than demand one exact implementation.

---

# 27. EX7 Multiple Concepts

A strong EX7 should normally require at least two or three concepts.

For example:

```text
Exception Handling
       +
Dictionary
       +
Functions
       +
Validation
```

or:

```text
Lists
       +
References
       +
Mutation
       +
Copying
```

or:

```text
Authentication
       +
Authorization
       +
Error Handling
       +
Input Validation
```

This makes the learner integrate knowledge.

---

# 28. EX7 Performance Consideration

Advanced challenges can include a performance requirement.

Example:

> The solution should process `n` records in O(n) time.

This encourages the learner to think beyond correctness.

However, performance requirements should only be used when they are pedagogically relevant.

---

# 29. EX7 Optimization

A challenge can optionally have a second stage:

```text
Correctness
     ↓
Optimization
```

Example:

> Your implementation passes all tests. Can you improve its time complexity?

This remains one EX7 if optimization is part of the challenge.

---

# 30. EX7 Quality Review

After passing tests, the learner can optionally review:

```text
Correctness ✓
Edge Cases ✓
Complexity ✓
Readability ✓
Maintainability ✓
```

This teaches professional engineering habits.

---

# 31. EX7 Self-Review

A useful final panel:

```text
┌──────────────────────────────────────────┐
│ CHALLENGE REVIEW                         │
├──────────────────────────────────────────┤
│ Did you handle invalid input?     [✓]    │
│ Did you consider edge cases?      [✓]    │
│ Did you avoid unnecessary work?   [✓]    │
│ Can you explain your approach?    [✓]    │
└──────────────────────────────────────────┘
```

This is reflection, not another quiz.

---

# 32. EX7 Explanation After Completion

After successful completion:

```text
Your solution passed all tests.

Review:

• Your approach
• Alternative approaches
• Edge cases
• Complexity
• Important design decisions
```

This allows the learner to compare their solution against a strong reference implementation.

---

# 33. EX7 Reference Solution

A reference solution should include:

```text
Solution
Reasoning
Why it works
Edge cases
Complexity
Alternative approach
```

Example:

```text
Reference Approach

1. Reject unauthenticated users.
2. Allow administrators.
3. Allow resource owners.
4. Check explicit permissions.
5. Deny otherwise.
```

Then the reference code.

---

# 34. EX7 Alternative Solutions

Because EX7 encourages design decisions, the system can optionally show:

```text
Approach A
Guard clauses

Approach B
Decision table

Approach C
Policy helper functions
```

This is highly educational.

The learner sees:

> There may be multiple good engineering solutions.

---

# 35. EX7 JSON Structure

```json
{
  "type": "exercise",
  "version": "EX7",
  "presentation": "Challenge Exercise",

  "content": {
    "title": "",
    "challenge": "",
    "context": "",

    "problem": "",

    "requirements": [],

    "inputs": [],
    "outputs": [],

    "examples": [],

    "constraints": [],
    "edgeCases": [],

    "performanceRequirements": [],

    "starterCode": "",

    "tests": [],

    "hints": [],

    "referenceSolution": "",

    "alternativeSolutions": [],

    "explanation": "",

    "reviewChecklist": [],

    "keyConcepts": []
  },

  "metadata": {
    "difficulty": "hard",
    "estimatedMinutes": 30
  },

  "completion": {
    "mode": "tests-pass"
  }
}
```

---

# 36. Complete EX7 JSON Example

```json
{
  "type": "exercise",
  "version": "EX7",
  "presentation": "Challenge Exercise",

  "content": {
    "title": "Build a Permission Evaluator",

    "challenge": "Design and implement an authorization function that determines whether a user can perform an action on a resource.",

    "context": "A system supports authenticated users, resource ownership, explicit permissions, and administrative privileges.",

    "problem": "Implement can_access(user, resource, action) so that access is granted only when the authorization rules are satisfied.",

    "requirements": [
      "The user must be authenticated.",
      "Administrators may access the resource.",
      "Resource owners may access their own resource.",
      "Users with the required permission may access the resource.",
      "Users without sufficient privileges must be denied.",
      "Invalid input must fail safely.",
      "The function must not modify the supplied objects."
    ],

    "inputs": [
      "user",
      "resource",
      "action"
    ],

    "outputs": [
      "True when access is allowed.",
      "False when access is denied."
    ],

    "examples": [
      {
        "description": "Unauthenticated user",
        "expectedOutput": "False"
      },
      {
        "description": "Resource owner",
        "expectedOutput": "True"
      },
      {
        "description": "User with required permission",
        "expectedOutput": "True"
      },
      {
        "description": "User without permission",
        "expectedOutput": "False"
      }
    ],

    "constraints": [
      "Do not modify user or resource objects.",
      "Return a boolean.",
      "Do not raise an exception for malformed authorization input."
    ],

    "edgeCases": [
      "Missing user",
      "Missing resource",
      "Missing permissions",
      "Unknown action",
      "Unauthenticated user",
      "Administrator",
      "Resource owner"
    ],

    "performanceRequirements": [
      "Authorization should execute in O(p), where p is the number of permissions inspected."
    ],

    "starterCode": "def can_access(user, resource, action):\n    pass",

    "tests": [
      {
        "name": "Unauthenticated user",
        "visible": true
      },
      {
        "name": "Resource owner",
        "visible": true
      },
      {
        "name": "Required permission",
        "visible": true
      },
      {
        "name": "Insufficient permission",
        "visible": true
      },
      {
        "name": "Administrator override",
        "visible": false
      },
      {
        "name": "Missing permissions",
        "visible": false
      },
      {
        "name": "Malformed user",
        "visible": false
      }
    ],

    "hints": [
      {
        "level": 1,
        "text": "List the authorization conditions that can independently grant access."
      },
      {
        "level": 2,
        "text": "Consider which conditions should immediately deny access and which can grant access."
      },
      {
        "level": 3,
        "text": "Think about authentication before authorization."
      }
    ],

    "referenceSolution": "def can_access(user, resource, action):\n    if not user or not user.get('authenticated'):\n        return False\n\n    if user.get('is_admin'):\n        return True\n\n    if resource and user.get('id') == resource.get('owner_id'):\n        return True\n\n    permissions = user.get('permissions', [])\n    return action in permissions",

    "alternativeSolutions": [
      {
        "name": "Guard Clause Approach",
        "description": "Evaluate deny conditions first and then evaluate authorization grants."
      },
      {
        "name": "Policy Helper Approach",
        "description": "Separate authentication, ownership, and permission checks into helper functions."
      }
    ],

    "explanation": "The authorization decision first requires an authenticated identity. Administrative privileges and ownership can grant access, while explicit permissions provide another authorization path. All other cases are denied.",

    "reviewChecklist": [
      "Does the implementation reject unauthenticated users?",
      "Does it handle administrators correctly?",
      "Does it handle resource ownership correctly?",
      "Does it handle explicit permissions correctly?",
      "Does it fail safely for malformed input?",
      "Does it avoid modifying input objects?"
    ],

    "keyConcepts": [
      "authentication",
      "authorization",
      "permissions",
      "conditions",
      "validation",
      "defensive programming"
    ]
  },

  "metadata": {
    "difficulty": "hard",
    "estimatedMinutes": 30
  },

  "completion": {
    "mode": "tests-pass",
    "requiredTests": "all"
  }
}
```

---

# 37. EX7 Hint Philosophy

Hints should preserve the challenge.

Good:

> What conditions can independently grant access?

Too direct:

> First write `if user.get('is_admin'):`.

The first preserves reasoning.

The second provides implementation.

Therefore:

```text
EX5
→ Detailed guidance

EX6
→ Light conceptual hints

EX7
→ Minimal strategic hints
```

---

# 38. EX7 Attempts

Multiple attempts are expected.

The system should not treat the first failed submission as a failure of the learner.

Instead:

```text
Attempt 1
   ↓
Test
   ↓
Analyze
   ↓
Attempt 2
   ↓
Test
   ↓
Refine
```

This mirrors real engineering work.

---

# 39. EX7 Debugging Feedback

Instead of:

> Wrong.

Use:

```text
8 / 12 tests passed.

Your solution correctly handles:
✓ authenticated users
✓ resource ownership

Remaining failures:
• administrator override
• malformed permission data
```

This gives useful evidence without giving away the solution.

---

# 40. EX7 Final Review

Once all tests pass:

```text
┌──────────────────────────────────────────┐
│ ✓ CHALLENGE COMPLETE                    │
├──────────────────────────────────────────┤
│ All required tests passed.              │
│                                          │
│ Your solution handled:                  │
│ ✓ Authentication                         │
│ ✓ Authorization                          │
│ ✓ Ownership                              │
│ ✓ Permissions                            │
│ ✓ Invalid input                          │
│                                          │
│ [ Review Solution ]                      │
│ [ Review Alternatives ]                  │
└──────────────────────────────────────────┘
```

---

# 41. EX7 Analytics

Useful metrics:

```text
attempts
timeSpent
testsRun
firstSubmissionPassed
hiddenTestsPassed
hintsUsed
solutionViewed
edgeCasesHandled
completed
```

Additional advanced metrics:

```text
refinementCount
performanceResult
solutionComplexity
```

The analytics should be used for learning insights rather than creating a competitive score.

---

# 42. EX7 Mastery Signal

A strong EX7 outcome is:

```text
Problem
   ↓
Learner designs solution
   ↓
Implementation
   ↓
Tests fail
   ↓
Learner diagnoses
   ↓
Refinement
   ↓
All tests pass
```

That demonstrates:

> **Transfer of knowledge into a new problem.**

This is the key educational value of EX7.

---

# 43. EX7 Accessibility

The challenge interface should support:

* keyboard navigation
* accessible code editor
* accessible test results
* semantic headings
* clear requirement sections
* screen-reader announcements
* accessible hints
* accessible completion status

Do not rely only on:

```text
green = passed
red = failed
```

Use explicit text such as:

> "8 of 10 tests passed."

---

# 44. EX7 Responsive Design

### Desktop

```text
┌──────────────────────────────┬─────────────────────┐
│ Challenge Problem            │ Requirements        │
│                              │ Test Results        │
│ Code Editor                  │ Hints               │
│                              │ Review              │
└──────────────────────────────┴─────────────────────┘
```

### Mobile

```text
Challenge
   ↓
Context
   ↓
Requirements
   ↓
Examples
   ↓
Code Editor
   ↓
Tests
   ↓
Feedback
   ↓
Review
```

---

# 45. EX7 Design Language

Continue the established Tutorial Engine design:

* Light theme
* Primary **#F54A8D**
* Secondary **#0B1B3D**
* No dark theme
* No gradient
* professional developer-workspace feel
* challenge badge
* clear requirement hierarchy
* strong test feedback
* responsive
* accessible

The UI should feel more advanced than EX6 without becoming visually complicated.

---

# 46. EX7 Authoring Rules

A strong EX7 should:

```text
✓ Be one substantial problem
✓ Require multiple concepts
✓ Require independent design
✓ Include meaningful constraints
✓ Include important edge cases
✓ Have visible and hidden tests
✓ Allow multiple valid implementations
✓ Encourage debugging
✓ Encourage refinement
✓ Provide useful post-completion analysis
```

Avoid:

```text
❌ Step-by-step implementation
❌ Giving away the algorithm
❌ Artificial difficulty
❌ Huge project scope
❌ Multiple unrelated exercises
❌ Exact-source-code matching
```

---

# 47. EX7 Boundary With ProjectBlock

Use this rule:

```text
EX7
One difficult problem
        ↓
Solve it

ProjectBlock
Real-world system/application
        ↓
Build it
```

For example:

### EX7

> Implement a robust permission evaluator.

### ProjectBlock

> Build a complete role-based access-control system with user management, roles, permissions, APIs, UI, persistence, and audit history.

The second is clearly a project.

---

# 48. EX7 Boundary With EX8

Use this rule:

```text
EX7
       ONE
   challenging
    exercise

EX8
       SET
       of
   exercises
      ↓
Easy
 ↓
Medium
 ↓
Hard
 ↓
Advanced
```

EX7 therefore completes the **single-exercise progression** before EX8 introduces a sequence of exercises.

---

# 49. EX7 Final Mental Model

```text
                     EX7
             CHALLENGE EXERCISE
                     │
                     ▼
               COMPLEX PROBLEM
                     │
                     ▼
              MULTIPLE CONCEPTS
                     │
                     ▼
              DESIGN YOUR APPROACH
                     │
                     ▼
                 IMPLEMENT
                     │
                     ▼
                  TEST
                     │
              ┌──────┴──────┐
              ▼             ▼
            FAIL           PASS
              │             │
              ▼             ▼
           DEBUG          REFINE
              │             │
              └──────┬──────┘
                     ▼
                  VERIFY
                     │
                     ▼
                 COMPLETE
```

---

# 50. EX7 Final Technical Specification

| Area                         | EX7 Decision                        |
| ---------------------------- | ----------------------------------- |
| **Block**                    | **ExerciseBlock**                   |
| **Version**                  | **EX7**                             |
| **Presentation**             | **Challenge Exercise**              |
| **Primary purpose**          | Advanced integrated problem solving |
| **Problem**                  | Required                            |
| **Multiple concepts**        | ✅                                   |
| **Implementation steps**     | ❌                                   |
| **Design freedom**           | ✅                                   |
| **Requirements**             | Required                            |
| **Constraints**              | Required/recommended                |
| **Edge cases**               | Required/recommended                |
| **Visible tests**            | ✅                                   |
| **Hidden tests**             | ✅                                   |
| **Multiple valid solutions** | ✅                                   |
| **Hints**                    | Optional/minimal                    |
| **Planning**                 | Optional                            |
| **Optimization**             | Optional                            |
| **Self-review**              | Recommended                         |
| **Reference solution**       | Supported                           |
| **Alternative solutions**    | Supported                           |
| **Retry**                    | ✅                                   |
| **Progress**                 | ✅                                   |
| **Quiz score**               | ❌                                   |
| **Project scope**            | ❌                                   |
| **Theme**                    | Light                               |
| **Primary**                  | **#F54A8D**                         |
| **Secondary**                | **#0B1B3D**                         |
| **Gradient**                 | ❌                                   |
| **Dark theme**               | ❌                                   |
| **Responsive**               | ✅                                   |
| **Accessible**               | ✅                                   |
| **JSON-driven**              | ✅                                   |

---

# 51. ExerciseBlock Progress

We now have:

```text
EX1 — Fill in the Blank
        ↓
EX2 — Complete the Code
        ↓
EX3 — Predict the Output
        ↓
EX4 — Fix the Code
        ↓
EX5 — Guided Exercise
        ↓
EX6 — Independent Exercise
        ↓
EX7 — Challenge Exercise
```

The learning progression is now:

```text
RECALL
   ↓
IMPLEMENT
   ↓
TRACE
   ↓
DEBUG
   ↓
BUILD WITH GUIDANCE
   ↓
BUILD INDEPENDENTLY
   ↓
SOLVE A COMPLEX PROBLEM
```

Only one version remains in **ExerciseBlock**:

> **EX8 — Progressive Exercise Set**

---

# 52. EX7 Status

## **EX7 — Challenge Exercise**

**Complete.** ✅

We stop here.

The next version, only when you say **"yes please"**, will be:

> **EX8 — Progressive Exercise Set**.



```python

```

# BLOCK 13 — ExerciseBlock

## EX8 — Progressive Exercise Set

Yes. We now complete the **final version of ExerciseBlock**, and as agreed, we are doing **only EX8**.

The committed sequence is:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| EX1     | Fill in the Blank            | ✅ Complete     |
| EX2     | Complete the Code            | ✅ Complete     |
| EX3     | Predict the Output           | ✅ Complete     |
| EX4     | Fix the Code                 | ✅ Complete     |
| EX5     | Guided Exercise              | ✅ Complete     |
| EX6     | Independent Exercise         | ✅ Complete     |
| EX7     | Challenge Exercise           | ✅ Complete     |
| **EX8** | **Progressive Exercise Set** | 🔵 **CURRENT** |

---

# 1. What Is EX8?

**EX8 — Progressive Exercise Set** is a structured collection of exercises where the learner solves **multiple exercises on the same concept or skill**, with difficulty increasing progressively.

The key idea is:

> **EX8 is not one large exercise. It is a sequence of exercises that gradually moves the learner from simpler application to advanced application.**

The learning flow is:

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

The difficulty increases as the learner progresses.

---

# 2. EX8 vs EX7

This distinction must remain locked.

### EX7 — Challenge Exercise

```text
ONE
complex
problem
```

### EX8 — Progressive Exercise Set

```text
EXERCISE 1
   ↓
EXERCISE 2
   ↓
EXERCISE 3
   ↓
EXERCISE 4
   ↓
EXERCISE 5
```

Therefore:

```text
EX7
→ depth

EX8
→ progression
```

---

# 3. EX8 Is Not Multiple Random Exercises

The exercises must be connected.

Bad EX8:

```text
Exercise 1 → Lists
Exercise 2 → Exceptions
Exercise 3 → Classes
Exercise 4 → Networking
```

There is no meaningful progression.

Good EX8:

```text
Exercise 1
Basic list filtering
       ↓
Exercise 2
List filtering with conditions
       ↓
Exercise 3
Filtering with functions
       ↓
Exercise 4
Edge cases
       ↓
Exercise 5
Complex filtering problem
```

The learner develops the same underlying skill progressively.

---

# 4. EX8 Is the Completion of ExerciseBlock

The complete ExerciseBlock progression is now:

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

This is a very deliberate progression.

---

# 5. Complete Pedagogical Progression

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

EX8 therefore acts as the **mastery sequence** for a concept.

---

# 6. Primary Objective

EX8 should help the learner:

* reinforce a concept repeatedly
* increase difficulty gradually
* transfer knowledge to new situations
* reduce dependency on hints
* handle more edge cases
* integrate multiple concepts
* develop confidence
* demonstrate mastery

The learner should feel:

> "Each exercise prepared me for the next one."

---

# 7. EX8 Core Learning Model

```text
              CONCEPT
                 │
                 ▼
          SIMPLE EXERCISE
                 │
                 ▼
          SLIGHTLY HARDER
                 │
                 ▼
          MODERATE EXERCISE
                 │
                 ▼
          COMPLEX EXERCISE
                 │
                 ▼
          ADVANCED EXERCISE
                 │
                 ▼
             MASTERY
```

---

# 8. EX8 Example — Python Lists

Suppose the tutorial teaches list filtering.

An EX8 set could be:

### Exercise 1 — Basic

> Return all even numbers.

```python
[1, 2, 3, 4]
→ [2, 4]
```

### Exercise 2 — Conditions

> Return all numbers greater than 10.

### Exercise 3 — Multiple Conditions

> Return numbers that are positive and even.

### Exercise 4 — Edge Cases

> Handle empty lists and duplicate values.

### Exercise 5 — Advanced

> Filter records based on multiple fields without modifying the original collection.

The learner progresses naturally.

---

# 9. EX8 Example — Exception Handling

A progressive set could be:

```text
Exercise 1
Catch ValueError

      ↓

Exercise 2
Handle multiple input cases

      ↓

Exercise 3
Use custom exception

      ↓

Exercise 4
Preserve exception context

      ↓

Exercise 5
Design exception propagation

      ↓

Exercise 6
Build robust error handling
```

Each exercise builds upon previous knowledge.

---

# 10. EX8 Example — Authentication & Authorization

A progressive set might be:

```text
Exercise 1
Validate credentials

      ↓

Exercise 2
Handle unknown users

      ↓

Exercise 3
Implement permission checking

      ↓

Exercise 4
Add roles

      ↓

Exercise 5
Handle authorization failures

      ↓

Exercise 6
Implement combined authentication
and authorization logic
```

This creates a natural skill ladder.

---

# 11. EX8 Example — Memory / References

A progressive set could be:

```text
Exercise 1
Predict aliasing

      ↓

Exercise 2
Distinguish mutation vs rebinding

      ↓

Exercise 3
Fix unintended mutation

      ↓

Exercise 4
Create independent copies

      ↓

Exercise 5
Analyze nested references

      ↓

Exercise 6
Solve a complex object-state problem
```

This reinforces the MemoryBlock concepts through practice.

---

# 12. EX8 Exercise Levels

A recommended progression is:

| Level       | Purpose                               |
| ----------- | ------------------------------------- |
| **Level 1** | Reinforce the basic concept           |
| **Level 2** | Apply the concept                     |
| **Level 3** | Combine the concept with another idea |
| **Level 4** | Handle edge cases                     |
| **Level 5** | Solve a complex problem               |
| **Level 6** | Demonstrate mastery                   |

Not every EX8 needs six exercises.

The author can configure the number.

---

# 13. EX8 Minimum Structure

A progressive set should normally contain at least:

```text
3 exercises
```

A stronger set may contain:

```text
4–6 exercises
```

An advanced set could contain:

```text
6–8 exercises
```

The exact number depends on the concept.

---

# 14. EX8 Should Not Be Arbitrarily Long

The goal is not:

> "Add as many exercises as possible."

The goal is:

> **Create a meaningful difficulty progression.**

If three exercises provide sufficient progression, three is better than eight repetitive exercises.

---

# 15. EX8 Set Structure

```text
┌──────────────────────────────────────────────┐
│ PROGRESSIVE EXERCISE SET                     │
├──────────────────────────────────────────────┤
│                                              │
│ Concept: List Filtering                      │
│                                              │
│ ✓ Exercise 1 — Basic Filtering              │
│ ✓ Exercise 2 — Conditional Filtering        │
│ ● Exercise 3 — Multiple Conditions          │
│ ○ Exercise 4 — Edge Cases                   │
│ ○ Exercise 5 — Advanced Filtering           │
│                                              │
│ Progress: 2 / 5                              │
└──────────────────────────────────────────────┘
```

---

# 16. EX8 Progression Indicator

The learner should clearly see:

```text
Exercise 1 ✓
Exercise 2 ✓
Exercise 3 ●
Exercise 4 ○
Exercise 5 ○
```

This communicates:

> **You are progressing through a skill ladder.**

---

# 17. EX8 Exercise Unlocking

Recommended default:

```text
Exercise 1
     ↓
complete
     ↓
Exercise 2 unlocks
     ↓
complete
     ↓
Exercise 3 unlocks
```

This ensures that progression is meaningful.

However, advanced learners may optionally be allowed to preview future exercises.

---

# 18. EX8 Unlocking Configuration

The author can configure:

```json
{
  "progression": {
    "mode": "sequential"
  }
}
```

or:

```json
{
  "progression": {
    "mode": "open"
  }
}
```

Default:

```text
sequential
```

because the primary purpose is progressive learning.

---

# 19. EX8 Difficulty Metadata

Each exercise should have its own difficulty.

Example:

```json
{
  "difficulty": "easy"
}
```

then:

```json
{
  "difficulty": "medium"
}
```

then:

```json
{
  "difficulty": "hard"
}
```

This allows the UI to communicate progression.

---

# 20. EX8 Difficulty Must Be Meaningful

Do not simply label exercises:

```text
Easy
Medium
Hard
```

without actually increasing complexity.

Difficulty can increase through:

```text
more conditions
more concepts
more edge cases
less scaffolding
larger input
stricter constraints
more design freedom
```

---

# 21. EX8 Scaffolding Should Decrease

This is one of the strongest features of EX8.

Early:

```text
Exercise 1
Starter code
Examples
Detailed hints
```

Later:

```text
Exercise 5
Minimal starter
Few hints
Complex requirements
```

So:

```text
Difficulty ↑
Scaffolding ↓
```

This gradually develops independence.

---

# 22. EX8 Example Scaffolding

### Exercise 1

```text
Starter code:
provided

Hints:
2–3

Tests:
visible
```

### Exercise 3

```text
Starter code:
minimal

Hints:
optional

Tests:
visible + hidden
```

### Exercise 5

```text
Starter code:
minimal/none

Hints:
strategic only

Tests:
mostly hidden
```

This is a powerful mastery design.

---

# 23. EX8 Exercise Types

Each exercise inside EX8 can use one of the earlier ExerciseBlock interaction patterns.

For example:

```text
EX8
│
├── Exercise 1 → EX2-style Complete Code
├── Exercise 2 → EX3-style Predict Output
├── Exercise 3 → EX4-style Fix Code
├── Exercise 4 → EX6-style Independent
└── Exercise 5 → EX7-style Challenge
```

This is allowed because EX8 is the **container/progression format**.

The individual exercises can use different interaction styles.

---

# 24. EX8 Important Distinction

The outer block is:

> **EX8 — Progressive Exercise Set**

Inside it, individual exercises can have different formats.

For example:

```text
Exercise 1
Complete the Code

Exercise 2
Predict the Output

Exercise 3
Fix the Code

Exercise 4
Independent Exercise

Exercise 5
Challenge
```

The progression is the defining characteristic.

---

# 25. EX8 JSON Architecture

A useful structure is:

```json
{
  "type": "exercise",
  "version": "EX8",
  "presentation": "Progressive Exercise Set",

  "content": {
    "title": "",
    "description": "",
    "learningGoal": "",

    "exercises": [
      {
        "id": "",
        "order": 1,
        "title": "",
        "version": "",
        "difficulty": "",
        "content": {}
      }
    ]
  }
}
```

---

# 26. EX8 Exercise Version

The internal exercise can specify its own presentation.

Example:

```json
{
  "id": "exercise-3",
  "order": 3,
  "version": "EX4",
  "presentation": "Fix the Code"
}
```

Another:

```json
{
  "id": "exercise-5",
  "order": 5,
  "version": "EX7",
  "presentation": "Challenge Exercise"
}
```

This provides considerable flexibility.

---

# 27. Complete EX8 JSON Example

```json
{
  "type": "exercise",
  "version": "EX8",
  "presentation": "Progressive Exercise Set",

  "content": {
    "title": "Progressive List Filtering Practice",

    "description": "Practice list filtering through increasingly difficult exercises.",

    "learningGoal": "Develop the ability to filter collections using conditions, edge-case handling, and multiple requirements.",

    "exercises": [
      {
        "id": "exercise-1",
        "order": 1,
        "title": "Filter Even Numbers",
        "version": "EX2",
        "presentation": "Complete the Code",
        "difficulty": "easy",
        "content": {
          "problem": "Complete the function so that it returns all even numbers.",
          "starterCode": "def get_even_numbers(numbers):\n    # complete here",
          "tests": [
            {
              "input": "[1,2,3,4]",
              "expectedOutput": "[2,4]"
            }
          ]
        }
      },

      {
        "id": "exercise-2",
        "order": 2,
        "title": "Predict Filter Behavior",
        "version": "EX3",
        "presentation": "Predict the Output",
        "difficulty": "easy-medium",
        "content": {
          "code": "numbers = [1,2,3,4]\nresult = [x for x in numbers if x % 2 == 0]\nprint(result)",
          "expectedOutput": "[2, 4]"
        }
      },

      {
        "id": "exercise-3",
        "order": 3,
        "title": "Fix the Filter",
        "version": "EX4",
        "presentation": "Fix the Code",
        "difficulty": "medium",
        "content": {
          "brokenCode": "def get_positive(numbers):\n    return [x for x in numbers if x < 0]",
          "expectedBehavior": "Return only positive numbers.",
          "tests": []
        }
      },

      {
        "id": "exercise-4",
        "order": 4,
        "title": "Build a Multi-Condition Filter",
        "version": "EX6",
        "presentation": "Independent Exercise",
        "difficulty": "hard",
        "content": {
          "problem": "Return positive even numbers without modifying the input list.",
          "requirements": [
            "Return a new list.",
            "Preserve order.",
            "Handle empty input."
          ],
          "tests": []
        }
      },

      {
        "id": "exercise-5",
        "order": 5,
        "title": "Advanced Record Filtering",
        "version": "EX7",
        "presentation": "Challenge Exercise",
        "difficulty": "advanced",
        "content": {
          "problem": "Filter records using multiple conditions while preserving order and handling malformed records.",
          "requirements": [
            "Do not modify the original collection.",
            "Ignore malformed records.",
            "Apply all required conditions."
          ],
          "tests": []
        }
      }
    ]
  },

  "progression": {
    "mode": "sequential",
    "minimumCompletion": "all"
  },

  "metadata": {
    "difficulty": "progressive",
    "estimatedMinutes": 35
  },

  "completion": {
    "mode": "all-exercises"
  }
}
```

---

# 28. EX8 Completion Model

The entire set should normally be completed when:

```text
Exercise 1 ✓
Exercise 2 ✓
Exercise 3 ✓
Exercise 4 ✓
Exercise 5 ✓
```

Then:

```text
PROGRESSIVE SET COMPLETE
```

---

# 29. EX8 Partial Progress

If the learner completes only:

```text
Exercise 1 ✓
Exercise 2 ✓
Exercise 3 ●
```

the system should save:

```json
{
  "currentExercise": 3,
  "completedExercises": [
    "exercise-1",
    "exercise-2"
  ]
}
```

The learner can return later.

---

# 30. EX8 Mastery Progress

The progress UI can communicate both exercise completion and difficulty.

```text
BEGINNER
   ✓

FOUNDATION
   ✓

INTERMEDIATE
   ✓

ADVANCED
   ●

MASTERY
   ○
```

But avoid excessive gamification.

The purpose is instructional progression.

---

# 31. EX8 Example Progress UI

```text
┌──────────────────────────────────────────────┐
│ PROGRESSIVE EXERCISE SET                     │
│                                              │
│ List Filtering                               │
│                                              │
│ ✓ 1  Basic Filtering             Easy        │
│ ✓ 2  Predict the Result          Easy        │
│ ✓ 3  Fix the Filter              Medium      │
│ ● 4  Multi-Condition Filter      Hard        │
│ ○ 5  Record Filtering Challenge  Advanced    │
│                                              │
│ Progress: 3 / 5                              │
└──────────────────────────────────────────────┘
```

---

# 32. EX8 Adaptive Hints

Hints can become progressively less direct.

```text
Exercise 1
Detailed hint

Exercise 2
Conceptual hint

Exercise 3
Debugging hint

Exercise 4
Strategic hint

Exercise 5
Minimal hint
```

This creates:

```text
Support ↓
Independence ↑
```

---

# 33. EX8 Adaptive Difficulty

The system can optionally support adaptive behavior.

For example:

If a learner completes:

```text
Exercise 1 ✓ first attempt
Exercise 2 ✓ first attempt
Exercise 3 ✓ first attempt
```

the system may offer:

> "Continue to the advanced exercise."

But the core EX8 definition should remain a **pre-authored progression**.

Do not make adaptive difficulty mandatory.

---

# 34. EX8 Exercise Failure

A failure in one exercise should normally not erase previous progress.

Example:

```text
Exercise 1 ✓
Exercise 2 ✓
Exercise 3 ✗
```

The learner retries Exercise 3.

Previous completed exercises remain complete.

---

# 35. EX8 Retry Model

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

---

# 36. EX8 Final Mastery Review

After completing the set, provide a concise review:

```text
┌──────────────────────────────────────────────┐
│ SET COMPLETE                                 │
├──────────────────────────────────────────────┤
│ Exercises completed: 5 / 5                   │
│                                              │
│ Skills practiced:                           │
│ ✓ Filtering                                  │
│ ✓ Conditions                                 │
│ ✓ Edge cases                                 │
│ ✓ Debugging                                  │
│ ✓ Independent problem solving                │
│                                              │
│ [ Review Solutions ]                         │
└──────────────────────────────────────────────┘
```

---

# 37. EX8 Analytics

Useful metrics:

```text
setStarted
exercisesStarted
exercisesCompleted
currentExercise
attemptsPerExercise
hintsPerExercise
timePerExercise
firstAttemptSuccess
setCompletion
```

More advanced:

```text
difficultyDropOff
```

For example:

```text
Exercise 1 → 98% completion
Exercise 2 → 94%
Exercise 3 → 90%
Exercise 4 → 72%
Exercise 5 → 41%
```

This can identify where learners struggle.

---

# 38. EX8 Mastery Signal

The most valuable metric is not simply:

```text
5 / 5 completed
```

but whether the learner progressively required less support.

For example:

```text
Exercise 1
2 hints

Exercise 2
1 hint

Exercise 3
1 hint

Exercise 4
0 hints

Exercise 5
0 hints
```

This suggests increasing independence.

---

# 39. EX8 Analytics Example

```json
{
  "exerciseSetAnalytics": {
    "exercisesCompleted": 5,
    "totalExercises": 5,

    "attempts": {
      "exercise-1": 1,
      "exercise-2": 1,
      "exercise-3": 2,
      "exercise-4": 2,
      "exercise-5": 3
    },

    "hintsUsed": {
      "exercise-1": 1,
      "exercise-2": 0,
      "exercise-3": 1,
      "exercise-4": 0,
      "exercise-5": 0
    },

    "completed": true
  }
}
```

---

# 40. EX8 Accessibility

The set should clearly communicate:

* current exercise
* completed exercises
* locked exercises
* difficulty
* progress
* test results
* completion

Example announcement:

> "Exercise 4 of 5, Multi-Condition Filter, active. Difficulty: hard."

Do not rely only on color.

---

# 41. EX8 Responsive Design

### Desktop

```text
┌────────────────────────────┬───────────────────────┐
│ Current Exercise           │ Exercise Progress     │
│                            │                       │
│ Problem                    │ ✓ Exercise 1          │
│ Code Editor                │ ✓ Exercise 2          │
│ Tests                      │ ✓ Exercise 3          │
│                            │ ● Exercise 4          │
│                            │ ○ Exercise 5          │
└────────────────────────────┴───────────────────────┘
```

### Mobile

```text
Exercise Progress
       ↓
Current Exercise
       ↓
Problem
       ↓
Workspace
       ↓
Tests
       ↓
Next Exercise
```

---

# 42. EX8 Navigation

Recommended:

```text
[ Previous Exercise ]
[ Current Exercise ]
[ Next Exercise ]
```

But:

```text
Next Exercise
```

should remain disabled until the current exercise meets its completion requirements when sequential progression is enabled.

---

# 43. EX8 Authoring Rules

A strong EX8 should:

```text
✓ Have one clearly defined learning goal
✓ Contain related exercises
✓ Increase difficulty progressively
✓ Reduce scaffolding over time
✓ Increase learner independence
✓ Include meaningful validation
✓ Include edge cases in later exercises
✓ End with a meaningful mastery exercise
```

Avoid:

```text
❌ Random exercises
❌ Repeating the same difficulty
❌ Artificially increasing code length
❌ Unrelated concepts
❌ Making every exercise identical
❌ Turning the set into a quiz
```

---

# 44. EX8 Difficulty Progression

A strong default pattern is:

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

Notice that EX8 can internally reuse the learning progression developed across EX1–EX7.

That is intentional.

---

# 45. EX8 Relationship to the Whole ExerciseBlock

The individual versions teach different behaviors:

```text
EX1
Fill

EX2
Build

EX3
Predict

EX4
Repair

EX5
Follow guidance

EX6
Work independently

EX7
Solve a challenge

EX8
Progress through all levels
```

Therefore EX8 acts as the **capstone format** of ExerciseBlock.

---

# 46. EX8 Relationship to Tutorial Flow

A tutorial can use:

```text
DefinitionBlock
      ↓
CodeBlock
      ↓
QuestionBlock
      ↓
ExerciseBlock EX1
      ↓
ExerciseBlock EX2
      ↓
ExerciseBlock EX5
      ↓
ExerciseBlock EX6
      ↓
ExerciseBlock EX8
```

Or, where appropriate, a single EX8 can provide the entire practice sequence.

The author does not need to use every ExerciseBlock version in every tutorial.

---

# 47. EX8 Relationship to QuizBlock

EX8 is still **practice**.

QuizBlock is **assessment**.

Therefore:

```text
EX8
→ Can the learner progressively apply the skill?

QuizBlock
→ Can the learner demonstrate knowledge under assessment conditions?
```

EX8 should not become a scored exam.

---

# 48. EX8 Relationship to ProjectBlock

EX8 ends with advanced exercises.

ProjectBlock moves into a real-world application.

```text
EX8
Progressive mastery
        ↓
ProjectBlock
Real-world creation
```

This is a natural transition in the Tutorial Engine.

---

# 49. EX8 Final Mental Model

```text
                         EX8
              PROGRESSIVE EXERCISE SET
                         │
                         ▼
                  EXERCISE 1
                    BASIC
                         │
                         ▼
                  EXERCISE 2
                  APPLICATION
                         │
                         ▼
                  EXERCISE 3
                    DEBUG
                         │
                         ▼
                  EXERCISE 4
                 INDEPENDENT
                         │
                         ▼
                  EXERCISE 5
                   ADVANCED
                         │
                         ▼
                     MASTERY
```

---

# 50. EX8 Final Technical Specification

| Area                           | EX8 Decision                 |
| ------------------------------ | ---------------------------- |
| **Block**                      | **ExerciseBlock**            |
| **Version**                    | **EX8**                      |
| **Presentation**               | **Progressive Exercise Set** |
| **Primary purpose**            | Progressive skill mastery    |
| **Exercises**                  | Multiple related exercises   |
| **Relationship**               | Same learning goal / skill   |
| **Difficulty**                 | Progressively increasing     |
| **Scaffolding**                | Progressively decreasing     |
| **Exercise types**             | Can vary                     |
| **Sequential progression**     | ✅ Default                    |
| **Open progression**           | Supported                    |
| **Individual validation**      | ✅                            |
| **Hidden tests**               | Supported                    |
| **Hints**                      | Progressive                  |
| **Progress persistence**       | ✅                            |
| **Adaptive difficulty**        | Optional                     |
| **Mastery review**             | Recommended                  |
| **Quiz score**                 | ❌                            |
| **Random exercise collection** | ❌                            |
| **Project scope**              | ❌                            |
| **Theme**                      | Light                        |
| **Primary**                    | **#F54A8D**                  |
| **Secondary**                  | **#0B1B3D**                  |
| **Gradient**                   | ❌                            |
| **Dark theme**                 | ❌                            |
| **Responsive**                 | ✅                            |
| **Accessible**                 | ✅                            |
| **JSON-driven**                | ✅                            |

---

# 51. ExerciseBlock — ALL 8 VERSIONS COMPLETE

We have now completed the entire committed **ExerciseBlock**:

|  # | Version | Presentation             | Status |
| -: | ------- | ------------------------ | ------ |
|  1 | **EX1** | Fill in the Blank        | ✅      |
|  2 | **EX2** | Complete the Code        | ✅      |
|  3 | **EX3** | Predict the Output       | ✅      |
|  4 | **EX4** | Fix the Code             | ✅      |
|  5 | **EX5** | Guided Exercise          | ✅      |
|  6 | **EX6** | Independent Exercise     | ✅      |
|  7 | **EX7** | Challenge Exercise       | ✅      |
|  8 | **EX8** | Progressive Exercise Set | ✅      |

The complete ExerciseBlock progression is:

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

And pedagogically:

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

## **EX8 — Progressive Exercise Set: COMPLETE** ✅

That means **Block #13 — ExerciseBlock is now fully defined from EX1 through EX8.**



```python

```


```python

```
