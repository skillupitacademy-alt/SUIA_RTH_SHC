# BLOCK 18 — ProjectBlock

## P1 — Mini Project

Yes. We continue with **only the first version**, exactly as we did for the previous blocks.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| **P1**  | **Mini Project**               | 🔵 **CURRENT** |
| P2      | Guided Project                 | ⏳              |
| P3      | Step-by-Step Project           | ⏳              |
| P4      | Real-World Scenario            | ⏳              |
| P5      | Feature-Based Project          | ⏳              |
| P6      | Open-Ended Project             | ⏳              |
| P7      | Capstone Project               | ⏳              |
| P8      | Portfolio / Production Project | ⏳              |

---

# 1. What Is P1 — Mini Project?

**P1 — Mini Project** is the simplest project-oriented version of `ProjectBlock`.

The learner receives a **small, well-defined project** that requires them to combine the knowledge they have just learned into a working outcome.

The key progression is:

```text
Learn
  ↓
Understand
  ↓
Practice
  ↓
Build
```

P1 is the first point where the learner moves from isolated exercises to:

> **"Build something that actually works."**

---

# 2. P1 vs ExerciseBlock

This distinction is extremely important.

### ExerciseBlock

An exercise teaches or practices **one specific skill**.

Example:

> Write a function that removes duplicate values from a list.

```text
Skill
 ↓
Practice
 ↓
Finish
```

### ProjectBlock P1

A project combines multiple skills into a small working application.

Example:

> Build a simple contact manager that can add, search, update, and delete contacts.

```text
Multiple concepts
       ↓
Design
       ↓
Implementation
       ↓
Testing
       ↓
Working project
```

So:

> **Exercise = practice a skill.**

> **Project = combine skills to build something.**

---

# 3. P1 Core Mental Model

```text
                    P1
               MINI PROJECT
                    │
                    ▼
              Project Goal
                    │
                    ▼
             Requirements
                    │
                    ▼
              Learner Builds
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
        Code      Test      Debug
          │         │         │
          └─────────┼─────────┘
                    ▼
              Working Output
                    │
                    ▼
                 Review
```

The project should be **small enough to complete** but large enough to require integration of concepts.

---

# 4. Why P1 Exists

A learner can successfully complete:

```text
Question
Exercise
Code Example
Quiz
```

without actually knowing how to build something independently.

P1 introduces:

```text
Problem
 ↓
Design
 ↓
Implementation
 ↓
Testing
 ↓
Working Solution
```

This is the first meaningful bridge from:

```text
Learning
```

to:

```text
Building
```

---

# 5. P1 Should Be Small

A Mini Project should **not** become a capstone.

The learner should be able to understand:

```text
What am I building?
What are the requirements?
What concepts do I need?
What should the final result look like?
```

A good P1 project typically has:

```text
1 clear objective
+
small feature set
+
limited scope
+
well-defined success criteria
```

---

# 6. P1 Example — Python Lists

Suppose the tutorial topic is:

> Python Lists

A poor P1 would be:

> Build a complete e-commerce application using Python lists.

Too large.

A better P1:

> **Build a Simple Student Score Manager.**

Requirements:

```text
Add student score
Display scores
Calculate average
Find highest score
Find lowest score
```

This combines:

```text
lists
loops
functions
conditionals
basic aggregation
```

---

# 7. P1 Project Example

### Project

> **Student Score Manager**

### Input

```text
Student scores:
[78, 91, 65, 88, 72]
```

### Required operations

```text
Add score
Remove score
Display scores
Calculate average
Find highest score
Find lowest score
```

### Expected result

```text
Scores: [78, 91, 65, 88, 72]

Average: 78.8
Highest: 91
Lowest: 65
```

This is a real but intentionally small project.

---

# 8. P1 Project Structure

Every P1 project should preferably define:

```text
Project
├── Goal
├── Problem
├── Requirements
├── Inputs
├── Expected Output
├── Constraints
├── Suggested Concepts
├── Success Criteria
└── Submission
```

---

# 9. P1 — Project Goal

The learner should see a clear goal.

Example:

> Build a Python program that manages a collection of student scores and provides basic statistics.

The goal should answer:

> **What am I building?**

---

# 10. P1 — Problem Statement

The project should explain why the project exists.

Example:

> A teacher needs a simple program to store student scores and quickly calculate basic statistics.

This creates context rather than giving the learner an abstract coding assignment.

---

# 11. P1 — Requirements

Requirements should be explicit.

Example:

```text
1. Store scores in a list.
2. Allow a score to be added.
3. Allow a score to be removed.
4. Display all scores.
5. Calculate the average.
6. Display the highest score.
7. Display the lowest score.
```

---

# 12. P1 — Constraints

P1 can optionally include constraints.

Example:

```text
Use:
✓ Python list
✓ Functions
✓ Loops
✓ Conditional logic

Do not use:
✗ pandas
✗ NumPy
✗ external libraries
```

This ensures the project actually reinforces the current learning topic.

---

# 13. P1 — Expected Skills

The project can explicitly identify concepts being practiced.

```text
Concepts
────────
Lists
Functions
Loops
Conditionals
Built-in functions
Basic complexity
```

This allows the learner to understand the connection between:

```text
Tutorial Content
      ↓
Project
```

---

# 14. P1 — Success Criteria

The project should define what "done" means.

Example:

```text
✓ Scores can be added
✓ Scores can be removed
✓ Scores can be displayed
✓ Average is calculated correctly
✓ Maximum is calculated correctly
✓ Minimum is calculated correctly
✓ Invalid input is handled
```

This prevents ambiguity.

---

# 15. P1 — Project Output

The learner should know what a successful result could look like.

```text
┌──────────────────────────────────────────┐
│ Student Score Manager                   │
├──────────────────────────────────────────┤
│                                          │
│ Scores: 78, 91, 65, 88, 72              │
│                                          │
│ Average: 78.8                            │
│ Highest: 91                              │
│ Lowest: 65                               │
│                                          │
└──────────────────────────────────────────┘
```

The exact implementation remains the learner's responsibility.

---

# 16. P1 Should Encourage Independent Thinking

Do **not** provide the entire implementation.

The learner should receive:

```text
Problem
+
Requirements
+
Constraints
+
Success Criteria
```

not:

```text
Complete Solution
```

Otherwise it becomes an ExerciseBlock.

---

# 17. P1 Optional Starter Template

A starter template can be provided when appropriate.

Example:

```python
scores = []


def add_score(score):
    pass


def remove_score(score):
    pass


def calculate_average():
    pass


def display_statistics():
    pass
```

This is optional.

For a true mini project, the learner should increasingly be responsible for designing the structure.

---

# 18. P1 Difficulty Levels

P1 can support:

### Beginner Mini Project

```text
3–4 requirements
```

### Intermediate Mini Project

```text
5–7 requirements
```

### Advanced Mini Project

```text
multiple components
+
validation
+
error handling
```

But it remains smaller than P2–P8.

---

# 19. P1 Example — Exception Handling

After learning exception handling:

> **Build a Safe Calculator.**

Requirements:

```text
Addition
Subtraction
Multiplication
Division
```

Handle:

```text
division by zero
invalid input
unsupported operation
```

The learner applies:

```text
functions
+
input
+
exceptions
+
validation
```

---

# 20. P1 Example — OOP

After learning classes:

> **Build a Simple Bank Account Manager.**

Requirements:

```text
Create account
Deposit money
Withdraw money
Check balance
Display account information
```

Concepts:

```text
class
object
methods
attributes
encapsulation
validation
```

---

# 21. P1 Example — Dictionaries

> **Build a Simple Contact Manager.**

Requirements:

```text
Add contact
Search contact
Update contact
Delete contact
List contacts
```

Data:

```python
contacts = {
    "Rahul": "9876543210",
    "Priya": "9123456780"
}
```

The learner must decide how to structure the application.

---

# 22. P1 Example — Authentication

For your Authentication & Authorization curriculum:

> **Build a Basic Role Permission Checker.**

Input:

```text
User:
Alice

Role:
admin
```

Permissions:

```text
admin
→ create
→ read
→ update
→ delete
```

The learner implements:

```text
user
 ↓
role
 ↓
permissions
 ↓
authorization decision
```

This is still a mini project, not a production authentication system.

---

# 23. P1 Example — RBAC

A small project could be:

> Build a command-line RBAC permission checker.

Example:

```text
User: Alice
Role: faculty
Action: delete_tutorial

Result:
DENIED
```

The learner practices:

```text
roles
permissions
mapping
authorization checks
```

---

# 24. P1 Example — Tutorial Engine

A small project after learning content blocks:

> **Build a Simple Tutorial Renderer.**

Input:

```json
[
  {
    "type": "text",
    "content": "Python Lists"
  },
  {
    "type": "code",
    "language": "python",
    "code": "numbers = [1, 2, 3]"
  }
]
```

The learner builds:

```text
JSON
 ↓
Block type
 ↓
Renderer
 ↓
Output
```

This introduces the fundamental architecture without requiring the complete Tutorial Engine.

---

# 25. P1 Example — API

After learning APIs:

> **Build a Simple Tutorial API.**

Endpoints:

```text
GET /tutorials
GET /tutorials/:id
POST /tutorials
```

The project remains intentionally small.

The learner practices:

```text
routing
request handling
validation
response structure
error handling
```

---

# 26. P1 Example — Database

After learning database integration:

> **Build a Simple Student CRUD Application.**

Operations:

```text
Create
Read
Update
Delete
```

The learner integrates:

```text
API
+
database
+
validation
```

---

# 27. P1 Example — Caching

After learning caching:

> **Build a Simple Cached Tutorial Lookup.**

Flow:

```text
Request
 ↓
Cache?
 ├── HIT → return
 └── MISS
       ↓
    Database
       ↓
    Cache
       ↓
    Return
```

This demonstrates the concept without requiring a distributed production architecture.

---

# 28. P1 Example — Python Memory

After learning object references:

> **Build a Small Object Identity Demonstrator.**

The application demonstrates:

```python
a = [1, 2, 3]
b = a
c = a.copy()
```

and shows:

```text
a is b → True
a is c → False
```

The project becomes an interactive learning artifact.

---

# 29. P1 Project Lifecycle

The learner should experience:

```text
1. Understand
2. Plan
3. Build
4. Test
5. Debug
6. Submit
```

Not:

```text
Read solution
 ↓
Copy solution
 ↓
Done
```

---

# 30. P1 Planning Stage

Before coding, optionally ask the learner:

> What data structures will you use?

> What functions/components do you need?

> What are the main operations?

This encourages design thinking.

Example:

```text
Project:
Contact Manager

Possible design:

contacts
 ↓
add_contact()
search_contact()
update_contact()
delete_contact()
```

---

# 31. P1 Implementation Stage

The learner builds the project independently.

The system can provide:

```text
Editor
Terminal
Preview
Run
Test
```

depending on the project type.

---

# 32. P1 Testing Stage

The learner should test the project against defined requirements.

Example:

```text
Test 1
Add contact
Expected: contact stored
Result: PASS

Test 2
Search existing contact
Expected: contact returned
Result: PASS

Test 3
Search missing contact
Expected: appropriate message
Result: PASS
```

---

# 33. P1 Debugging Stage

If the learner's implementation fails:

```text
Project
 ↓
Test Failure
 ↓
Debug
 ↓
Fix
 ↓
Retest
```

This is an important difference from simply submitting an answer.

---

# 34. P1 Submission

A project submission can contain:

```text
Source Code
README
Test Results
Screenshots / Preview
Optional Explanation
```

For a simple Python project:

```text
project/
├── main.py
├── tests.py
└── README.md
```

The exact submission structure depends on the project type.

---

# 35. P1 Project Review

After submission:

```text
Requirements
     ↓
Implementation
     ↓
Tests
     ↓
Quality
     ↓
Feedback
```

The review can evaluate:

```text
Correctness
Structure
Readability
Requirements
Error Handling
Testing
```

---

# 36. P1 Evaluation Should Not Be Only "Works / Doesn't Work"

A project may work but still be poorly implemented.

Example:

```text
Correctness       90%
Requirements      100%
Code Quality       65%
Testing            55%
Error Handling     60%
```

This gives the learner useful feedback.

---

# 37. P1 Rubric

| Dimension      | Evaluation                                   |
| -------------- | -------------------------------------------- |
| Requirements   | Are all required features implemented?       |
| Correctness    | Does the project work correctly?             |
| Structure      | Is the code organized logically?             |
| Readability    | Is the implementation understandable?        |
| Validation     | Are invalid inputs handled?                  |
| Error Handling | Are failures handled appropriately?          |
| Testing        | Are important cases tested?                  |
| Completeness   | Does the submitted project satisfy the goal? |

---

# 38. P1 Feedback

Bad:

> Your project needs improvement.

Better:

> All required features are implemented, but invalid input is not handled. Add validation before converting user input to an integer and test the invalid-input path.

This turns project evaluation into learning.

---

# 39. P1 Hints

Hints can be progressive.

### Hint 1

> Think about what data structure should store the scores.

### Hint 2

> You need a collection that can grow as scores are added.

### Hint 3

> Consider using a Python list.

The learner still writes the implementation.

---

# 40. P1 "Reveal Solution"

A solution can optionally be available after submission.

But it should be presented as:

```text
Your Solution
      ↓
Compare
      ↓
Reference Solution
```

not:

```text
Reference Solution
      ↓
Copy
```

The learner should first attempt the project.

---

# 41. P1 Project Comparison

After completion:

```text
Your Design
───────────
contacts dictionary
functions

Reference Design
────────────────
contacts dictionary
class-based alternative
```

The system can explain:

> Both approaches satisfy the requirements. The reference solution demonstrates an alternative organization.

This teaches design flexibility.

---

# 42. P1 Multiple Valid Solutions

This is important for projects.

Unlike a simple exercise:

```text
one expected answer
```

a project may have:

```text
multiple valid implementations
```

Therefore evaluation should prioritize:

```text
requirements
correctness
quality
reasoning
```

rather than exact code matching.

---

# 43. P1 Project Constraints

Constraints can make projects educational.

Example:

```text
Build a contact manager.

Constraints:
✓ Use dictionaries
✓ Use functions
✓ No external libraries
✓ Handle missing contacts
```

This keeps the project aligned with the current curriculum.

---

# 44. P1 Project Variants

The same project can have variants.

Example:

```text
Mini Project A
Student Score Manager

Mini Project B
Employee Score Manager

Mini Project C
Product Price Manager
```

The underlying skill remains the same while reducing answer memorization.

---

# 45. P1 Project Scope Control

The system should prevent a P1 from silently growing into a P7.

For example:

### P1

```text
5 features
```

### P2

```text
5 features
+
guidance
+
milestones
```

### P3

```text
larger project
+
step-by-step implementation
```

### P7

```text
large integrated system
```

So P1 must remain:

> **Small, focused, achievable.**

---

# 46. P1 UI — Project Introduction

```text
┌──────────────────────────────────────────────────┐
│ MINI PROJECT                                     │
│                                                  │
│ Student Score Manager                            │
│                                                  │
│ Goal                                             │
│ Build a Python program that manages student      │
│ scores and calculates basic statistics.          │
│                                                  │
│ Concepts                                         │
│ • Lists                                          │
│ • Functions                                      │
│ • Loops                                          │
│ • Conditionals                                   │
│                                                  │
│ Difficulty                                       │
│ Beginner                                         │
│                                                  │
│ Estimated Effort                                 │
│ Small                                            │
│                                                  │
│ [ Start Project ]                                │
└──────────────────────────────────────────────────┘
```

---

# 47. P1 UI — Requirements

```text
┌──────────────────────────────────────────────────┐
│ PROJECT REQUIREMENTS                             │
│                                                  │
│ □ Add a score                                    │
│ □ Remove a score                                 │
│ □ Display scores                                 │
│ □ Calculate average                              │
│ □ Find highest score                             │
│ □ Find lowest score                              │
│                                                  │
│ Success Criteria                                 │
│ All six requirements must work correctly.        │
│                                                  │
│ [ Start Building ]                               │
└──────────────────────────────────────────────────┘
```

---

# 48. P1 UI — Build Workspace

```text
┌─────────────────────────────────────────────────────────┐
│ STUDENT SCORE MANAGER                                   │
├───────────────────────────────┬─────────────────────────┤
│ PROJECT FILES                 │ PREVIEW / OUTPUT        │
│                               │                         │
│ main.py                       │ Scores: [78, 91, 65]   │
│ tests.py                      │                         │
│ README.md                     │ Average: 78.0           │
│                               │                         │
│ ┌───────────────────────────┐ │                         │
│ │ Code Editor               │ │                         │
│ │                           │ │                         │
│ │ ...                       │ │                         │
│ └───────────────────────────┘ │                         │
│                               │                         │
│ [ Run ] [ Test ] [ Submit ]   │                         │
└───────────────────────────────┴─────────────────────────┘
```

The exact tools depend on whether the project is executable in-browser.

---

# 49. P1 Progress

A project can show:

```text
Project Progress

Requirements
████████░░ 80%

Implementation
██████░░░░ 60%

Testing
███░░░░░░░ 30%

Overall
██████░░░░ 60%
```

But progress should be based on meaningful project stages.

---

# 50. P1 Completion

Completion can require:

```text
✓ Project started
✓ Required features implemented
✓ Tests executed
✓ Required tests passing
✓ Submission completed
```

Again:

```text
Completion ≠ Perfect Score
```

A learner can submit a project with issues and receive feedback.

---

# 51. P1 Project Review Flow

```text
Submit
  ↓
Validate
  ↓
Run Tests
  ↓
Evaluate Requirements
  ↓
Evaluate Quality
  ↓
Generate Feedback
  ↓
Project Result
```

---

# 52. P1 Project Result

```text
┌──────────────────────────────────────────────────┐
│ PROJECT REVIEW                                   │
│                                                  │
│ Student Score Manager                            │
│                                                  │
│ Requirements       100%                          │
│ Correctness         92%                          │
│ Code Quality        78%                          │
│ Testing             65%                          │
│ Error Handling      60%                          │
│                                                  │
│ Overall             81%                          │
│                                                  │
│ STRENGTHS                                        │
│ ✓ Core functionality works                      │
│ ✓ Good function organization                    │
│                                                  │
│ IMPROVE                                          │
│ → Add invalid-input handling                    │
│ → Add more edge-case tests                      │
│                                                  │
│ [ Improve Project ]                              │
└──────────────────────────────────────────────────┘
```

---

# 53. P1 Improvement Loop

The learner can continue:

```text
Project
 ↓
Review
 ↓
Feedback
 ↓
Improve
 ↓
Retest
 ↓
Resubmit
```

This is much more educational than a one-time submission.

---

# 54. P1 Project History

The assessment/project system can record:

```text
Attempt 1
Score: 68%

Attempt 2
Score: 78%

Attempt 3
Score: 88%
```

This allows the learner to see project improvement.

---

# 55. P1 Versioning

Projects may evolve.

```text
Submission v1
 ↓
Feedback
 ↓
Submission v2
 ↓
Feedback
 ↓
Submission v3
```

The system can preserve previous submissions instead of overwriting them.

---

# 56. P1 Project Metadata

Conceptually:

```text
Project
├── projectId
├── title
├── goal
├── problemStatement
├── requirements
├── constraints
├── concepts
├── difficulty
├── successCriteria
├── starterFiles
├── tests
└── submissionRules
```

The project definition should live in the Project/Assessment content layer rather than being hardcoded into the renderer.

---

# 57. P1 Project Submission Metadata

```text
ProjectSubmission
├── submissionId
├── projectId
├── learnerId
├── attemptNumber
├── files
├── testResults
├── evaluation
├── score
├── feedback
├── submittedAt
└── status
```

---

# 58. P1 JSON

Minimal Tutorial Engine reference:

```json
{
  "type": "project",
  "version": "P1",
  "projectId": "python_student_score_manager_001"
}
```

Optional presentation:

```json
{
  "type": "project",
  "version": "P1",
  "projectId": "python_student_score_manager_001",
  "presentation": {
    "showGoal": true,
    "showRequirements": true,
    "showConstraints": true,
    "showHints": true,
    "allowRetry": true,
    "showEvaluation": true,
    "showProgress": true
  }
}
```

---

# 59. P1 Architecture

```text
                    Tutorial Engine
                           │
                           ▼
                     ProjectBlock
                           │
                           │ P1
                           ▼
                     Project Reference
                           │
                           ▼
                    Project Service
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Definition    Submission    Evaluation
              │            │            │
              └────────────┼────────────┘
                           ▼
                         Result
                           │
                           ▼
                        Analytics
```

The Tutorial Engine presents the project.

The Project/Assessment layer owns the project lifecycle.

---

# 60. P1 and Code Execution

For programming projects, execution should be isolated from the main application.

Conceptually:

```text
Learner Code
     ↓
Execution Service
     ↓
Sandbox
     ↓
Resource Limits
     ↓
Tests
     ↓
Results
```

The sandbox should control:

```text
CPU
Memory
Execution time
Network access
Filesystem access
```

where appropriate.

---

# 61. P1 and Automated Tests

Automated tests are highly valuable.

Example:

```text
Test: add_score()
Input: 85
Expected: [85]
Result: PASS
```

```text
Test: average()
Input: [80, 90]
Expected: 85
Result: PASS
```

This provides objective validation.

---

# 62. P1 and Hidden Tests

Some projects can include hidden tests.

The learner sees:

```text
Public Tests
```

while the evaluation system also executes:

```text
Hidden Tests
```

This prevents hardcoding the visible examples.

But hidden tests should remain appropriate to the stated requirements.

---

# 63. P1 Edge Cases

The project should encourage edge-case thinking.

Example:

```text
Empty list
One score
Duplicate scores
Invalid score
Negative score
Very large score
```

The learner can decide which are relevant based on the requirements.

---

# 64. P1 Example — Empty Data

Question:

> What should happen if the teacher asks for the average before entering any scores?

The learner must decide or follow the project requirement.

Possible behavior:

```text
No scores available.
```

This introduces defensive programming.

---

# 65. P1 Example — Invalid Input

Input:

```text
"eighty"
```

Expected:

```text
Invalid score. Please enter a number.
```

This can reinforce exception handling.

---

# 66. P1 Relationship With TaskBlock

This distinction is also important.

### TaskBlock

> Implement a function that calculates the average score.

The goal is a **specific accomplishment**.

### ProjectBlock P1

> Build a Student Score Manager.

The learner must determine:

```text
data model
functions
flow
validation
testing
```

A project has broader ownership.

---

# 67. P1 Relationship With ExerciseBlock

### Exercise

> Fill in the missing code.

### Project

> Build the complete application.

The learner moves from:

```text
guided skill practice
```

to:

```text
independent construction
```

---

# 68. P1 Relationship With InteractiveBlock

InteractiveBlock:

```text
Run
Observe
Modify
Experiment
```

ProjectBlock:

```text
Design
Build
Test
Submit
```

InteractiveBlock can support a project, but it does not replace it.

---

# 69. P1 Relationship With InterviewBlock

Project:

> Build a Student Score Manager.

Interview:

> Explain how you designed the Student Score Manager and why you chose the data structures.

The project creates an artifact.

The interview tests the learner's ability to explain it.

---

# 70. P1 Project-to-Interview Flow

```text
Project
 ↓
Build
 ↓
Submit
 ↓
Review
 ↓
InterviewBlock
 ↓
"Why did you choose this design?"
 ↓
"How would you scale it?"
```

This creates a powerful learning loop.

---

# 71. P1 Example — Project → Interview

Project:

> Build a contact manager.

Interview:

> Why did you choose a dictionary?

Then:

> What is the average complexity of contact lookup?

Then:

> What happens if you need case-insensitive search?

Then:

> How would you redesign it for millions of contacts?

This naturally progresses:

```text
P1
 ↓
IV5
 ↓
IV6
```

---

# 72. P1 Completion Certificate / Achievement

Optional presentation:

```text
┌──────────────────────────────────────────────┐
│ PROJECT COMPLETED                            │
│                                              │
│ Student Score Manager                       │
│                                              │
│ ✓ Requirements completed                    │
│ ✓ Tests passed                               │
│ ✓ Project submitted                          │
│                                              │
│ Score: 88%                                   │
│                                              │
│ [ Review Project ] [ Continue Learning ]     │
└──────────────────────────────────────────────┘
```

This should be treated as a learning achievement, not necessarily a formal professional certification.

---

# 73. P1 Design Principle

The most important P1 principle is:

> **The learner should feel that they built something.**

Not:

> "I completed another coding question."

Therefore the project should have:

```text
ownership
+
decision-making
+
implementation
+
testing
+
visible result
```

---

# 74. P1 Difficulty Boundary

P1 should **not** require:

```text
complex distributed architecture
large team workflow
production deployment
advanced observability
large-scale infrastructure
```

Those belong to later versions such as:

```text
P4
P5
P6
P7
P8
```

---

# 75. P1 Progression Toward P2

P1:

```text
Mini Project
```

P2 will become:

```text
Guided Project
```

The key difference:

### P1

> Here is the problem. Build it.

### P2

> Here is the problem. We will guide you through the project while you build it.

So P1 is intentionally the first step toward greater project independence.

---

# 76. Complete ProjectBlock Progression

Once all versions are completed, the progression will be:

```text
P1
Mini Project
    ↓
P2
Guided Project
    ↓
P3
Step-by-Step Project
    ↓
P4
Real-World Scenario
    ↓
P5
Feature-Based Project
    ↓
P6
Open-Ended Project
    ↓
P7
Capstone Project
    ↓
P8
Portfolio / Production Project
```

The difficulty and learner autonomy progressively increase.

---

# 77. P1 Final Technical Specification

| Area                             | P1 Decision                            |
| -------------------------------- | -------------------------------------- |
| **Block**                        | **ProjectBlock**                       |
| **Version**                      | **P1**                                 |
| **Presentation**                 | **Mini Project**                       |
| **Primary purpose**              | Build a small complete working project |
| **Scope**                        | Small and focused                      |
| **Requirements**                 | Explicit                               |
| **Constraints**                  | Optional                               |
| **Starter code**                 | Optional                               |
| **Hints**                        | Optional                               |
| **Guidance**                     | Minimal                                |
| **Independent decisions**        | ✅                                      |
| **Implementation**               | ✅                                      |
| **Testing**                      | ✅                                      |
| **Debugging**                    | ✅                                      |
| **Submission**                   | ✅                                      |
| **Evaluation**                   | ✅                                      |
| **Retry / improvement**          | ✅                                      |
| **Multiple valid solutions**     | ✅                                      |
| **Automated tests**              | Optional                               |
| **Hidden tests**                 | Optional                               |
| **Code execution**               | Optional by project type               |
| **Project definition ownership** | Project/Assessment layer               |
| **Submission ownership**         | Project/Assessment layer               |
| **Evaluation ownership**         | Project/Assessment layer               |
| **Analytics ownership**          | Project/Analytics layer                |
| **Tutorial ownership**           | Presentation/orchestration             |
| **Local project database**       | ❌                                      |
| **Local scoring authority**      | ❌                                      |
| **JSON-driven**                  | ✅                                      |
| **Authentication**               | Existing platform auth                 |
| **Authorization**                | Existing platform authorization        |
| **Accessibility**                | ✅                                      |
| **Keyboard navigation**          | ✅                                      |
| **Responsive**                   | ✅                                      |
| **Light theme**                  | ✅                                      |
| **Primary**                      | **#F54A8D**                            |
| **Secondary**                    | **#0B1B3D**                            |
| **Gradient**                     | ❌                                      |
| **Dark overall theme**           | ❌                                      |

---

# 78. P1 Final Mental Model

```text
                         P1
                    MINI PROJECT
                         │
                         ▼
                    PROJECT GOAL
                         │
                         ▼
                   PROBLEM STATEMENT
                         │
                         ▼
                    REQUIREMENTS
                         │
                         ▼
                     PLAN
                         │
                         ▼
                     BUILD
                         │
                         ▼
                     TEST
                         │
                         ▼
                    DEBUG
                         │
                         ▼
                    SUBMIT
                         │
                         ▼
                   EVALUATION
                         │
                         ▼
                    FEEDBACK
                         │
                         ▼
                     IMPROVE
```

The central idea is:

> **P1 transforms the learner from someone who solves isolated exercises into someone who can independently combine learned concepts to build, test, and submit a small working project.**

## **P1 — Mini Project: COMPLETE** ✅

Next:

> **P2 — Guided Project**



```python

```

# BLOCK 18 — ProjectBlock

## P2 — Guided Project

Yes. We continue with **only P2**, one version at a time.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| P1      | Mini Project                   | ✅ Complete     |
| **P2**  | **Guided Project**             | 🔵 **CURRENT** |
| P3      | Step-by-Step Project           | ⏳              |
| P4      | Real-World Scenario            | ⏳              |
| P5      | Feature-Based Project          | ⏳              |
| P6      | Open-Ended Project             | ⏳              |
| P7      | Capstone Project               | ⏳              |
| P8      | Portfolio / Production Project | ⏳              |

---

# 1. What Is P2 — Guided Project?

**P2 — Guided Project** is a project where the learner **builds the project themselves**, but the system provides structured guidance at important decision points.

The learner still owns the implementation.

The difference from P1 is:

```text
P1 — Mini Project
─────────────────
Understand requirements
        ↓
Plan
        ↓
Build independently
        ↓
Test
        ↓
Submit
```

P2:

```text
P2 — Guided Project
───────────────────
Understand
    ↓
Guided Planning
    ↓
Guided Design
    ↓
Build
    ↓
Guided Checkpoints
    ↓
Test
    ↓
Improve
    ↓
Submit
```

The central principle is:

> **P2 provides guidance without taking away the learner's responsibility to build the project.**

---

# 2. P2 vs P1

This distinction must remain clear.

### P1 — Mini Project

The learner receives:

```text
Goal
Requirements
Constraints
Success Criteria
```

Then independently decides how to implement the project.

### P2 — Guided Project

The learner receives all of the above **plus structured guidance**.

For example:

> What data structure could represent the contacts?

Then:

> What operations should the application expose?

Then:

> How could you separate storage logic from user interaction?

The system helps the learner think, but does not simply provide the answer.

---

# 3. P2 Core Mental Model

```text
                    P2
               GUIDED PROJECT
                     │
                     ▼
                Project Goal
                     │
                     ▼
               Requirements
                     │
                     ▼
              Guided Planning
                     │
                     ▼
               Guided Design
                     │
                     ▼
                 Build
                     │
             ┌───────┼───────┐
             ▼       ▼       ▼
          Check    Hint    Review
             │       │       │
             └───────┼───────┘
                     ▼
                   Test
                     │
                     ▼
                Improvement
                     │
                     ▼
                  Submit
```

---

# 4. Why P2 Exists

P1 assumes:

> "I understand the concepts enough to build a small project independently."

But many learners reach this point:

> "I understand the concepts, but I don't know how to start the project."

That is exactly where P2 fits.

It teaches:

```text
Concept
   ↓
How to approach a project
   ↓
How to break a problem down
   ↓
How to make implementation decisions
```

Therefore P2 teaches **project thinking**, not merely coding.

---

# 5. P2 Learning Objective

P2 should develop these abilities:

```text
Problem decomposition
Requirement interpretation
Basic design
Implementation planning
Decision making
Debugging
Testing
Self-correction
```

The learner gradually becomes less dependent on guidance.

---

# 6. P2 Example — Contact Manager

Suppose the project is:

> **Build a Simple Contact Manager**

Requirements:

```text
Add contact
Search contact
Update contact
Delete contact
List contacts
```

P1 would say:

> Build it.

P2 might guide the learner through the design.

---

# 7. P2 Guided Stage 1 — Understand the Problem

The system first asks:

> What information does a contact need?

Possible learner answer:

```text
Name
Phone
Email
```

Then:

> Which piece of information could uniquely identify a contact?

The learner reasons:

```text
Name
```

or perhaps:

```text
Contact ID
```

The system does not immediately force the answer.

---

# 8. P2 Guided Stage 2 — Choose Data Structure

Question:

> You need to quickly find a contact using a unique identifier. What Python data structure might be useful?

Hints:

```text
Hint 1:
Think about key-value relationships.

Hint 2:
You need to map an identifier to contact information.

Hint 3:
Consider a dictionary.
```

The learner arrives at:

```python
contacts = {}
```

This is guided learning.

---

# 9. P2 Guided Stage 3 — Design the Data

The system asks:

> How could one contact be represented?

Possible design:

```python
contact = {
    "name": "Rahul",
    "phone": "9876543210",
    "email": "rahul@example.com"
}
```

Then:

> How could multiple contacts be stored?

The learner might decide:

```python
contacts = {
    "rahul": {
        "name": "Rahul",
        "phone": "9876543210",
        "email": "rahul@example.com"
    }
}
```

The learner is designing the structure.

---

# 10. P2 Guided Stage 4 — Break Into Functions

The system asks:

> What operations does the application need?

Learner:

```text
add_contact()
search_contact()
update_contact()
delete_contact()
list_contacts()
```

Now the project starts to become manageable.

```text
Project
   │
   ├── add
   ├── search
   ├── update
   ├── delete
   └── list
```

This teaches decomposition.

---

# 11. P2 Guided Stage 5 — Implement One Feature

Instead of showing the complete application, the system focuses on:

> **Implement `add_contact()`.**

Prompt:

> What should happen when a new contact is added?

The learner writes the implementation.

Then tests it.

---

# 12. P2 Checkpoint

After the first feature:

```text
┌──────────────────────────────────────────────┐
│ PROJECT CHECKPOINT                           │
│                                              │
│ ✓ Data structure selected                    │
│ ✓ Contact model created                      │
│ ✓ add_contact() implemented                  │
│                                              │
│ Next                                         │
│ Implement search_contact()                   │
│                                              │
│ [ Continue ]                                 │
└──────────────────────────────────────────────┘
```

Checkpoints provide structure without doing the work for the learner.

---

# 13. P2 Guidance Levels

Guidance should be progressive.

### Level 1 — Question

> What data structure would be appropriate?

### Level 2 — Hint

> Think about key-value lookup.

### Level 3 — Concept Reminder

> Python dictionaries provide key-based lookup.

### Level 4 — Example

```python
contacts = {}
```

### Level 5 — Partial Template

```python
def add_contact(...):
    ...
```

The full solution should generally remain the final fallback.

---

# 14. P2 Should Avoid Over-Guidance

If the system says:

> Create a dictionary called `contacts`, then write `add_contact()`, then put the name in `contacts[name]`, then...

the learner is effectively following instructions line by line.

That starts becoming **P3 — Step-by-Step Project**.

So:

```text
P2
Guidance
```

must remain less prescriptive than:

```text
P3
Step-by-Step
```

---

# 15. P2 Key Boundary

### P2

> **"Here is a decision. Think about which approach you would use."**

### P3

> **"Step 1: Create the data model. Step 2: Implement the storage layer."**

That distinction is fundamental.

---

# 16. P2 Guided Planning

Before coding, the learner can complete a planning canvas:

```text
┌──────────────────────────────────────────────┐
│ PROJECT PLAN                                 │
│                                              │
│ What are we building?                        │
│ [                                          ] │
│                                              │
│ Main data structures                         │
│ [                                          ] │
│                                              │
│ Main operations                              │
│ [                                          ] │
│                                              │
│ Important edge cases                         │
│ [                                          ] │
│                                              │
│ [ Check My Plan ]                            │
└──────────────────────────────────────────────┘
```

The system can provide feedback on the plan.

---

# 17. P2 Planning Feedback

Example learner response:

> I'll store contacts in a list and search the list every time.

System:

> This approach can work for a small dataset. However, because the project frequently searches by a unique identifier, consider whether a dictionary would better match the access pattern.

This is guidance.

It does not simply replace the learner's thinking.

---

# 18. P2 Guided Design

A guided project can use questions like:

> What data needs to persist?

> Which operations are required?

> Which operations are frequent?

> What should happen when data does not exist?

> What happens when invalid data is provided?

These questions train engineering thinking.

---

# 19. P2 Example — Exception Handling Project

Project:

> **Build a Safe Calculator**

Requirements:

```text
Addition
Subtraction
Multiplication
Division
```

P2 guidance:

> Which operation can produce a special runtime failure?

Learner:

> Division.

Next:

> What exception should be considered when dividing by zero?

Learner:

> `ZeroDivisionError`.

Then:

> Where should you handle it?

The learner decides.

---

# 20. P2 Example — OOP Project

Project:

> **Build a Bank Account Manager**

P2 guidance:

> What entity does the program need to represent?

Learner:

> Bank account.

Then:

> What state does an account need?

Possible:

```text
account_number
owner
balance
```

Then:

> What behavior belongs to the account?

```text
deposit()
withdraw()
get_balance()
```

The learner constructs the class.

---

# 21. P2 Example — Authentication Project

Project:

> **Build a Basic RBAC Permission Checker**

P2 guidance:

> What are the two concepts that need to be represented?

Learner:

```text
users
roles
```

Next:

> What does a role contain?

Learner:

```text
permissions
```

Then:

```text
user
 ↓
role
 ↓
permissions
 ↓
authorization decision
```

The system guides the architecture without implementing it.

---

# 22. P2 Example — Tutorial Renderer

Project:

> **Build a Simple Tutorial Renderer**

The system asks:

> What information identifies the block type?

Learner:

> `type`.

Then:

> What should happen when `type` is `"text"`?

Learner:

> Render the text block.

Then:

> What should happen when an unknown type is encountered?

Learner needs to decide:

```text
error
fallback
ignore
```

Now they are thinking architecturally.

---

# 23. P2 Guidance Checkpoints

Good checkpoints include:

```text
Checkpoint 1
Requirements understood

Checkpoint 2
Data model selected

Checkpoint 3
Architecture planned

Checkpoint 4
Core feature implemented

Checkpoint 5
Edge cases considered

Checkpoint 6
Tests passing

Checkpoint 7
Project complete
```

---

# 24. P2 Checkpoint Evaluation

Each checkpoint can have:

```text
Complete
Needs Review
Blocked
```

Example:

```text
Data Model
──────────
✓ Complete

Feature Design
──────────────
⚠ Needs Review

Testing
───────
○ Not Started
```

This gives the learner project visibility.

---

# 25. P2 Guidance Based on Failure

If a learner repeatedly fails the same test:

```text
Test failure
    ↓
Detect repeated issue
    ↓
Offer targeted hint
```

Example:

> Your search operation fails when the contact does not exist. What should happen when the requested key is missing?

This is better than immediately revealing the solution.

---

# 26. P2 Hint Progression

```text
Attempt 1
No hint

Attempt 2
Conceptual hint

Attempt 3
More specific hint

Attempt 4
Partial implementation guidance
```

The exact policy should be configurable.

---

# 27. P2 "Ask for Help"

The UI can provide:

```text
[ Need a Hint? ]
```

When clicked:

```text
Hint 1
 ↓
Hint 2
 ↓
Hint 3
```

The learner controls when they need assistance.

---

# 28. P2 Hint Usage Analytics

Useful metrics:

```text
Hints requested
Hints per checkpoint
Most requested concept
Time before hint
Success after hint
```

This can identify where the project is difficult.

---

# 29. P2 Project Workspace

```text
┌─────────────────────────────────────────────────────┐
│ GUIDED PROJECT                                      │
│ Contact Manager                                     │
├─────────────────────────────────────────────────────┤
│ PROJECT STAGES                                      │
│                                                     │
│ ✓ Understand Requirements                           │
│ ✓ Choose Data Model                                 │
│ → Design Operations                                 │
│ ○ Implement                                         │
│ ○ Test                                              │
│ ○ Submit                                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│ CURRENT GUIDANCE                                    │
│                                                     │
│ What operation should happen when a contact         │
│ does not exist?                                     │
│                                                     │
│ [ Write Your Reasoning ]                            │
│                                                     │
│ [ Hint ]                                            │
└─────────────────────────────────────────────────────┘
```

---

# 30. P2 Build Workspace

After planning:

```text
┌─────────────────────────────────────────────────────┐
│ CONTACT MANAGER                                     │
├────────────────────────────┬────────────────────────┤
│ FILES                      │ TEST / OUTPUT          │
│                            │                        │
│ main.py                    │ Test Results           │
│ tests.py                   │                        │
│                            │ ✓ Add Contact          │
│ ┌────────────────────────┐ │ ✓ Search Contact      │
│ │ Code Editor            │ │ ✗ Delete Contact      │
│ │                        │ │                        │
│ │                        │ │                        │
│ └────────────────────────┘ │                        │
│                            │                        │
│ [ Run ] [ Test ] [ Hint ]  │                        │
└────────────────────────────┴────────────────────────┘
```

---

# 31. P2 Guided Testing

The system can provide test objectives without giving implementation.

Example:

> **Test 1:** Add a new contact.

> **Test 2:** Search for an existing contact.

> **Test 3:** Search for a contact that does not exist.

> **Test 4:** Update an existing contact.

> **Test 5:** Delete an existing contact.

The learner writes the code and observes the results.

---

# 32. P2 Test Failure Guidance

Example:

```text
Test:
Search missing contact

Result:
FAIL

Guidance:

Your implementation assumes that every requested
contact exists.

Consider what should happen when the identifier
is not found.
```

This teaches debugging.

---

# 33. P2 Debugging

The project should encourage:

```text
Observe
 ↓
Understand failure
 ↓
Form hypothesis
 ↓
Change code
 ↓
Retest
```

Not:

```text
Error
 ↓
Reveal answer
```

---

# 34. P2 Debugging Question

When a test fails:

> What did you expect?

> What actually happened?

> Which part of your implementation controls this behavior?

This is excellent debugging education.

---

# 35. P2 Design Review

Before submission:

> Review your project structure.

The learner should check:

```text
Functions
Naming
Duplication
Validation
Error handling
Testing
```

This introduces basic code review habits.

---

# 36. P2 Self-Review Checklist

```text
□ Does every requirement work?
□ Are function names meaningful?
□ Is duplicated logic minimized?
□ Are invalid inputs handled?
□ Are important edge cases tested?
□ Is the code readable?
□ Can another developer understand it?
```

---

# 37. P2 Submission

The learner submits:

```text
Source
+
Tests
+
Optional README
```

The project system evaluates the submission.

---

# 38. P2 Evaluation

Example:

| Dimension      | Score |
| -------------- | ----: |
| Requirements   |   94% |
| Correctness    |   90% |
| Structure      |   84% |
| Testing        |   76% |
| Error Handling |   70% |
| Readability    |   88% |

Then:

> **Overall: 84%**

---

# 39. P2 Guidance Impact

The system can separately record:

```text
Project Score: 84%

Guidance Usage:
Hints: 4
Checkpoint Reviews: 2
Retries: 3
```

This distinguishes:

```text
Final capability
```

from:

```text
Amount of assistance required
```

---

# 40. P2 Independence Indicator

An optional metric:

```text
Guidance Independence
──────────────────────
High
```

or:

```text
Low → High
```

For example:

```text
First project:
Many hints

Later project:
Few hints
```

This shows learning progress.

---

# 41. P2 Is Not Tutoring Every Line

A guided project should not say:

> Click here.

> Type this exact line.

> Now type this exact line.

That is too procedural.

Instead:

> What should this function be responsible for?

That teaches design thinking.

---

# 42. P2 vs P3 Boundary

This distinction should be locked into the ProjectBlock architecture.

| P2 — Guided           | P3 — Step-by-Step                    |
| --------------------- | ------------------------------------ |
| Guidance              | Explicit sequence                    |
| Questions             | Instructions                         |
| Hints                 | Detailed steps                       |
| Learner decides       | System defines path                  |
| Learner designs       | System teaches implementation stages |
| Moderate independence | Lower independence                   |
| "Think about..."      | "Now do..."                          |

This prevents the two versions from overlapping.

---

# 43. P2 Example of the Boundary

### P2

> How would you organize the application's contact operations?

Learner decides.

### P3

> **Step 1:** Create `add_contact()`.

> **Step 2:** Create `search_contact()`.

> **Step 3:** Create `update_contact()`.

> **Step 4:** Create `delete_contact()`.

That is P3.

---

# 44. P2 Example — Database Project

Project:

> Build a Student CRUD API.

Guidance:

> What entity are you storing?

> What fields does it require?

> What operations are needed?

> Which database operation corresponds to creating a record?

The learner designs the API.

P3 would instead explicitly guide:

```text
Step 1: Create students table
Step 2: Create GET endpoint
Step 3: Create POST endpoint
...
```

---

# 45. P2 Example — API Error Handling

The learner implements:

```text
GET /students/:id
```

Guidance:

> What should the API return when the student does not exist?

Possible reasoning:

```text
404
```

Then:

> What should the response body communicate?

The learner constructs the response.

---

# 46. P2 Example — Authentication

Project:

> Build a small role-based authorization service.

Guidance:

> Where should the authorization decision be made?

Learner:

> Backend.

Then:

> Why shouldn't the frontend be trusted to enforce authorization?

Learner explains:

> Client-side UI is not a security boundary.

Then:

> Implement the authorization check.

This combines project building with architectural reasoning.

---

# 47. P2 Example — Tutorial Engine

Project:

> Build a basic JSON-driven block renderer.

Guidance:

> How should the renderer determine which component to use?

Learner:

> Use the block `type`.

Then:

> How could the architecture make adding a new block type easier?

Learner may propose a registry or dispatch mechanism.

This is guided architectural learning.

---

# 48. P2 Guided Architecture Diagram

The learner can optionally create:

```text
                    Application
                         │
                         ▼
                    Block Parser
                         │
                         ▼
                    Block Type
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
            Text        Code       Quiz
           Renderer    Renderer   Renderer
```

The system can review whether the architecture satisfies the requirements.

---

# 49. P2 Project Milestones

P2 can expose milestones:

```text
M1 — Understand
M2 — Plan
M3 — Design
M4 — Build
M5 — Test
M6 — Review
M7 — Submit
```

But the learner decides the implementation inside each milestone.

---

# 50. P2 Milestone Completion

Example:

```text
M1 Understand       ✓
M2 Plan             ✓
M3 Design           ✓
M4 Build            60%
M5 Test             20%
M6 Review           —
M7 Submit           —
```

This helps learners who struggle with larger tasks.

---

# 51. P2 Project Resume

If the learner leaves:

```text
Project Progress
62%
```

they should be able to return to:

```text
Current checkpoint
```

rather than restarting.

---

# 52. P2 Autosave

Because project work can be lengthy:

```text
Learner changes
      ↓
Autosave
      ↓
Project submission draft
```

The system should preserve:

```text
draft
checkpoint
last successful test
```

This is especially important for browser-based coding projects.

---

# 53. P2 Submission States

Conceptually:

```text
DRAFT
  ↓
IN_PROGRESS
  ↓
READY_FOR_SUBMISSION
  ↓
SUBMITTED
  ↓
EVALUATED
  ↓
REVISION_REQUIRED / COMPLETED
```

This belongs to the project/submission system.

---

# 54. P2 Multiple Attempts

If the learner receives:

```text
Revision Required
```

they should be able to improve the same project.

```text
Attempt 1
 ↓
Feedback
 ↓
Attempt 2
 ↓
Feedback
 ↓
Attempt 3
```

This encourages iterative development.

---

# 55. P2 Project Review

The reviewer/evaluation system can say:

> Your project meets all functional requirements. The main improvement is separating input handling from business logic.

This teaches software engineering quality.

---

# 56. P2 Project Rubric

A more advanced P2 rubric can include:

```text
Requirements       20%
Correctness         25%
Design              15%
Code Quality        15%
Testing             10%
Error Handling      10%
Documentation        5%
```

The exact weights belong to the project definition.

---

# 57. P2 Multiple Valid Designs

Suppose one learner uses:

```text
functions
```

and another uses:

```text
classes
```

Both may be valid.

The evaluator should ask:

```text
Does the design satisfy the requirements?
Is it appropriate for the project scope?
Is it understandable?
```

rather than:

> Did the learner reproduce the reference architecture?

---

# 58. P2 Reference Solution

A reference solution can still exist.

But it should be used for:

```text
comparison
reflection
learning
```

Example:

> Your implementation uses a dictionary directly. The reference solution separates storage from business logic. For a small P2 project, both approaches can work, but the separation becomes more valuable as the project grows.

This teaches architectural evolution.

---

# 59. P2 Transition Toward Real Engineering

P2 is where the learner begins asking:

```text
What should I build?
How should I structure it?
Why should I choose this approach?
How should I test it?
What happens when it fails?
```

That is the beginning of engineering thinking.

---

# 60. P2 Relationship With P4–P8

The ProjectBlock progression now has a clear ladder:

```text
P1
Build a small project
        ↓
P2
Build with guidance
        ↓
P3
Build through explicit stages
        ↓
P4
Solve a realistic scenario
        ↓
P5
Build a feature-focused system
        ↓
P6
Design independently
        ↓
P7
Integrate many skills
        ↓
P8
Build something portfolio/production-oriented
```

---

# 61. P2 Final Architecture

```text
                       ProjectBlock
                            │
                            ▼
                           P2
                    Guided Project
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          Planning        Design          Build
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                       Checkpoints
                            │
                            ▼
                          Testing
                            │
                            ▼
                         Review
                            │
                            ▼
                         Submit
                            │
                            ▼
                        Evaluate
                            │
                            ▼
                         Improve
```

---

# 62. P2 JSON

A Tutorial Engine block should remain lightweight:

```json
{
  "type": "project",
  "version": "P2",
  "projectId": "python_contact_manager_001"
}
```

Optional presentation configuration:

```json
{
  "type": "project",
  "version": "P2",
  "projectId": "python_contact_manager_001",
  "presentation": {
    "showGuidance": true,
    "allowHints": true,
    "showCheckpoints": true,
    "allowRetry": true,
    "showProgress": true,
    "showEvaluation": true
  }
}
```

The project definition, checkpoints, evaluation criteria, and submissions should remain owned by the project/assessment layer.

---

# 63. P2 Technical Specification

| Area                                 | P2 Decision                                                                |
| ------------------------------------ | -------------------------------------------------------------------------- |
| **Block**                            | **ProjectBlock**                                                           |
| **Version**                          | **P2**                                                                     |
| **Presentation**                     | **Guided Project**                                                         |
| **Primary purpose**                  | Teach learners how to approach and build projects with structured guidance |
| **Project scope**                    | Small → moderate                                                           |
| **Requirements**                     | ✅                                                                          |
| **Planning**                         | ✅                                                                          |
| **Design guidance**                  | ✅                                                                          |
| **Implementation**                   | ✅                                                                          |
| **Checkpoints**                      | ✅                                                                          |
| **Hints**                            | ✅                                                                          |
| **Testing**                          | ✅                                                                          |
| **Debugging**                        | ✅                                                                          |
| **Submission**                       | ✅                                                                          |
| **Evaluation**                       | ✅                                                                          |
| **Revision**                         | ✅                                                                          |
| **Learner decision-making**          | ✅                                                                          |
| **Line-by-line instructions**        | ❌                                                                          |
| **Explicit implementation sequence** | ❌ — belongs to P3                                                          |
| **Multiple valid solutions**         | ✅                                                                          |
| **Automated tests**                  | Optional                                                                   |
| **Hidden tests**                     | Optional                                                                   |
| **Code execution**                   | Optional by project type                                                   |
| **Project definition ownership**     | Project/Assessment layer                                                   |
| **Submission ownership**             | Project/Assessment layer                                                   |
| **Evaluation ownership**             | Project/Assessment layer                                                   |
| **Tutorial ownership**               | Presentation/orchestration                                                 |
| **Local project engine**             | ❌                                                                          |
| **Local scoring authority**          | ❌                                                                          |
| **JSON-driven**                      | ✅                                                                          |
| **Authentication**                   | Existing platform auth                                                     |
| **Authorization**                    | Existing platform authorization                                            |
| **Autosave**                         | ✅ where project type requires it                                           |
| **Accessibility**                    | ✅                                                                          |
| **Keyboard navigation**              | ✅                                                                          |
| **Responsive**                       | ✅                                                                          |
| **Light theme**                      | ✅                                                                          |
| **Primary**                          | **#F54A8D**                                                                |
| **Secondary**                        | **#0B1B3D**                                                                |
| **Gradient**                         | ❌                                                                          |
| **Dark overall theme**               | ❌                                                                          |

---

# 64. P2 Final Mental Model

```text
                         P2
                  GUIDED PROJECT
                         │
                         ▼
                    UNDERSTAND
                         │
                         ▼
                       PLAN
                         │
                         ▼
                 MAKE DESIGN DECISIONS
                         │
                         ▼
                       BUILD
                         │
                         ▼
                CHECKPOINT / HINT
                         │
                         ▼
                       TEST
                         │
                         ▼
                      DEBUG
                         │
                         ▼
                      REVIEW
                         │
                         ▼
                      SUBMIT
                         │
                         ▼
                     EVALUATE
                         │
                         ▼
                      IMPROVE
```

The central idea is:

> **P2 teaches the learner not only how to build a project, but how to think through a project: understand the requirements, make design decisions, use guidance when necessary, implement independently, test the result, debug failures, and improve the final solution.**

## **P2 — Guided Project: COMPLETE** ✅

Next:

> **P3 — Step-by-Step Project**



```python

```

# BLOCK 18 — ProjectBlock

## P3 — Step-by-Step Project

Yes. We continue with **only P3**, one version at a time.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| P1      | Mini Project                   | ✅ Complete     |
| P2      | Guided Project                 | ✅ Complete     |
| **P3**  | **Step-by-Step Project**       | 🔵 **CURRENT** |
| P4      | Real-World Scenario            | ⏳              |
| P5      | Feature-Based Project          | ⏳              |
| P6      | Open-Ended Project             | ⏳              |
| P7      | Capstone Project               | ⏳              |
| P8      | Portfolio / Production Project | ⏳              |

---

# 1. What Is P3 — Step-by-Step Project?

**P3 — Step-by-Step Project** is a project presentation where the learner builds a complete project through an **explicit sequence of implementation steps**.

The major difference from P2 is:

> **P2 asks the learner to make many implementation decisions with guidance. P3 deliberately defines the implementation journey step by step.**

The progression is:

```text
P1
Mini Project
    ↓
"What can I build?"
    ↓
P2
Guided Project
    ↓
"How should I approach this?"
    ↓
P3
Step-by-Step Project
    ↓
"Let's build it one clearly defined step at a time."
```

---

# 2. P3 Core Mental Model

```text
                    P3
             STEP-BY-STEP PROJECT
                     │
                     ▼
                Project Goal
                     │
                     ▼
              Project Architecture
                     │
                     ▼
                  Step 1
                     │
                     ▼
                  Step 2
                     │
                     ▼
                  Step 3
                     │
                     ▼
                  Step 4
                     │
                     ▼
                  Step 5
                     │
                     ▼
                Integration
                     │
                     ▼
                  Testing
                     │
                     ▼
                Final Project
```

The learner is still **building the project**, but the system provides the implementation path.

---

# 3. Why P3 Exists

P2 can still leave some learners asking:

> "I understand the goal, but I'm not sure what I should implement first."

P3 solves that problem.

It teaches:

```text
Project
  ↓
Break into components
  ↓
Implement component 1
  ↓
Implement component 2
  ↓
Integrate
  ↓
Test
```

This is especially useful when the project introduces several concepts simultaneously.

---

# 4. P3 vs P1 vs P2

This distinction should remain **strictly locked**.

|                          | P1       | P2                    | P3                 |
| ------------------------ | -------- | --------------------- | ------------------ |
| Project                  | Small    | Small/Moderate        | Moderate           |
| Goal                     | ✅        | ✅                     | ✅                  |
| Requirements             | ✅        | ✅                     | ✅                  |
| Guidance                 | Minimal  | Guided                | Extensive          |
| Hints                    | Optional | ✅                     | ✅                  |
| Planning guidance        | Limited  | ✅                     | ✅                  |
| Explicit steps           | ❌        | ❌                     | **✅**              |
| Learner chooses sequence | ✅        | Mostly                | ❌                  |
| System defines sequence  | ❌        | ❌                     | **✅**              |
| Step completion          | Basic    | Checkpoints           | **Core**           |
| Integration guidance     | Limited  | Moderate              | **Detailed**       |
| Independence             | High     | Medium/High           | Lower              |
| Main purpose             | Build    | Learn how to approach | Learn how to build |

The key distinction:

> **P3 teaches the implementation process explicitly.**

---

# 5. Example Project

Let's use:

> **Build a Simple Student Management API**

The learner will eventually create:

```text
Student API
├── Create Student
├── Get Student
├── List Students
├── Update Student
└── Delete Student
```

P3 does not ask:

> "How would you design this?"

Instead it says:

```text
Step 1
Create the project structure

Step 2
Create the student model

Step 3
Create the database table

Step 4
Create GET endpoint

Step 5
Create POST endpoint

Step 6
Create UPDATE endpoint

Step 7
Create DELETE endpoint

Step 8
Add validation

Step 9
Add error handling

Step 10
Test the API
```

---

# 6. P3 Project Introduction

```text
┌──────────────────────────────────────────────────┐
│ STEP-BY-STEP PROJECT                             │
│                                                  │
│ Student Management API                           │
│                                                  │
│ Build a REST API for managing student records.   │
│                                                  │
│ You will build this project through 10          │
│ implementation steps.                            │
│                                                  │
│ Difficulty: Intermediate                         │
│                                                  │
│ Steps: 10                                        │
│                                                  │
│ [ Start Project ]                                │
└──────────────────────────────────────────────────┘
```

---

# 7. P3 Step Navigation

The learner sees the complete roadmap.

```text
┌──────────────────────────────────────────────────┐
│ PROJECT STEPS                                    │
├──────────────────────────────────────────────────┤
│ ✓ 1. Create Project Structure                    │
│ ✓ 2. Create Student Model                        │
│ → 3. Create Database Table                       │
│ ○ 4. Create GET Endpoint                         │
│ ○ 5. Create POST Endpoint                        │
│ ○ 6. Create UPDATE Endpoint                      │
│ ○ 7. Create DELETE Endpoint                      │
│ ○ 8. Add Validation                              │
│ ○ 9. Add Error Handling                           │
│ ○ 10. Test the API                               │
└──────────────────────────────────────────────────┘
```

This is one of the defining features of P3.

---

# 8. P3 Step Definition

Every step should have a clear structure:

```text
Step
├── Objective
├── Explanation
├── Instructions
├── Starting Point
├── Expected Result
├── Validation
├── Hint
└── Completion Criteria
```

---

# 9. P3 Step 1

### Objective

> Create the basic project structure.

### Instructions

```text
1. Create the project directory.
2. Initialize the application.
3. Create the main application file.
4. Start the development server.
```

### Expected result

```text
Server running successfully.
```

This is explicit instruction.

That is why this is P3 rather than P2.

---

# 10. P3 Step 2

### Objective

> Create the Student model.

### Instructions

Define:

```text
id
name
email
course
```

### Expected structure

```text
Student
├── id
├── name
├── email
└── course
```

The learner implements it.

---

# 11. P3 Step 3

### Objective

> Create the database table.

Instructions:

```text
1. Define the schema.
2. Create the migration.
3. Apply the migration.
4. Verify the table.
```

The learner follows the implementation sequence.

---

# 12. P3 Step 4

### Objective

> Implement the GET endpoint.

The project might explicitly provide:

```text
GET /students
```

Then:

> Return all students from the database.

Expected response:

```json
[
  {
    "id": 1,
    "name": "Rahul",
    "email": "rahul@example.com"
  }
]
```

---

# 13. P3 Step 5

### Objective

> Implement the POST endpoint.

Explicit route:

```text
POST /students
```

Expected request:

```json
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "course": "Python"
}
```

The learner implements the endpoint.

---

# 14. P3 Step 6

### Objective

> Implement student updates.

Explicit endpoint:

```text
PUT /students/:id
```

The learner is told what to build and what behavior is expected.

---

# 15. P3 Step 7

### Objective

> Implement deletion.

```text
DELETE /students/:id
```

Expected behavior:

```text
Student exists
    ↓
Delete
    ↓
Success response
```

---

# 16. P3 Step 8

### Objective

> Add request validation.

The project explicitly tells the learner to validate:

```text
name
email
course
```

For example:

```text
Missing name → validation error
Invalid email → validation error
Missing course → validation error
```

---

# 17. P3 Step 9

### Objective

> Add error handling.

The learner implements defined cases:

```text
Student not found
Invalid request
Database failure
Malformed input
```

Expected HTTP semantics can be provided.

For example:

```text
400 → invalid request
404 → student not found
500 → unexpected server error
```

---

# 18. P3 Step 10

### Objective

> Test the complete API.

The system provides a test checklist:

```text
✓ Create student
✓ Get student
✓ List students
✓ Update student
✓ Delete student
✓ Invalid request
✓ Missing student
```

The learner executes and verifies the tests.

---

# 19. P3 Step Completion

Each step has a completion condition.

```text
Step 4
GET /students

Completion:
✓ Endpoint exists
✓ Returns 200
✓ Returns valid JSON
✓ Returns expected student records
```

Once satisfied:

```text
[ Mark Step Complete ]
```

or automatically:

```text
Step validation → PASS
```

---

# 20. P3 Step Validation

A step should ideally have objective validation.

Examples:

```text
Code compilation
Automated tests
Database schema check
API response validation
Expected file existence
```

The system should not rely only on:

> "I think you completed this step."

---

# 21. P3 Step Failure

Example:

```text
Step 5 — POST /students

Status: FAILED

Test:
Create a valid student

Expected:
201 Created

Received:
500 Internal Server Error
```

Then:

```text
[ Review Step ]
[ Show Hint ]
[ Retry ]
```

---

# 22. P3 Hints

P3 can still provide hints.

But hints are associated with the **current step**.

Example:

> Your POST endpoint is returning 500. Check whether the request body is being parsed before accessing `name`.

The learner remains responsible for fixing it.

---

# 23. P3 Step Explanation

Before implementation:

```text
WHY THIS STEP EXISTS
```

Example:

> We are creating the database model before the API endpoints because the endpoints need a persistent representation of students.

This teaches architecture rather than blind instruction.

---

# 24. P3 Step Dependency

Steps can depend on previous steps.

```text
Step 1
Project Setup
   ↓
Step 2
Model
   ↓
Step 3
Database
   ↓
Step 4
GET
```

The learner should normally not be allowed to skip a required dependency.

---

# 25. P3 Dependency Graph

```text
                 Project Setup
                       │
                       ▼
                    Model
                       │
                       ▼
                   Database
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
           GET        POST       DELETE
            │          │          │
            └──────────┼──────────┘
                       ▼
                    UPDATE
                       │
                       ▼
                  Validation
                       │
                       ▼
                 Error Handling
                       │
                       ▼
                    Testing
```

This is more than a simple numbered list; it can represent actual implementation dependencies.

---

# 26. P3 Step Unlocking

Example:

```text
Step 1 ✓
   ↓
Step 2 unlocked

Step 2 ✓
   ↓
Step 3 unlocked

Step 3 ✓
   ↓
Steps 4–7 unlocked
```

This makes project progression understandable.

---

# 27. P3 Parallel Steps

Not every step needs to be sequential.

For example:

```text
Database
   │
   ├── GET
   ├── POST
   ├── PUT
   └── DELETE
```

The project system can allow those steps to be completed in any order if their dependencies permit it.

So P3 means:

> **Explicit implementation steps**, not necessarily an unnecessarily rigid linear workflow.

---

# 28. P3 Step Status

Useful states:

```text
LOCKED
AVAILABLE
IN_PROGRESS
PASSED
FAILED
SKIPPED
```

Example:

```text
✓ Step 1     PASSED
✓ Step 2     PASSED
→ Step 3     IN_PROGRESS
○ Step 4     LOCKED
```

---

# 29. P3 Project Progress

```text
Project Progress

████████████░░░░░░░░ 60%

6 / 10 steps completed
```

But also:

```text
Implementation
6 / 10

Tests
12 / 15 passing

Requirements
80%
```

Multiple progress dimensions are better than one percentage.

---

# 30. P3 Step Workspace

```text
┌────────────────────────────────────────────────────────┐
│ STEP 6 — UPDATE STUDENT                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Objective                                              │
│ Implement PUT /students/:id                            │
│                                                        │
│ Requirements                                           │
│ ✓ Accept student ID                                    │
│ ✓ Accept updated fields                                │
│ ✓ Update existing record                               │
│ ✓ Return updated student                               │
│ ✓ Return 404 if student does not exist                │
│                                                        │
│ ┌────────────────────────────┐ ┌────────────────────┐ │
│ │ Code Editor                │ │ Test Results       │ │
│ │                            │ │                    │ │
│ │                            │ │ ✓ Valid update     │ │
│ │                            │ │ ✗ Missing ID       │ │
│ └────────────────────────────┘ └────────────────────┘ │
│                                                        │
│ [ Run ] [ Test ] [ Hint ] [ Complete Step ]            │
└────────────────────────────────────────────────────────┘
```

---

# 31. P3 "What You Are Learning"

Each step can explicitly connect to the curriculum.

Example:

```text
CONCEPTS USED

REST API
HTTP methods
Database CRUD
Validation
Error handling
```

This answers:

> Why am I doing this step?

---

# 32. P3 Concept-to-Step Mapping

```text
Tutorial Concept
       ↓
Project Step
       ↓
Implementation
       ↓
Test
```

Example:

```text
HTTP GET
   ↓
Step 4
   ↓
GET /students
   ↓
GET endpoint tests
```

This makes the project reinforce the tutorial.

---

# 33. P3 Learning Context

P3 should provide enough context before each step.

Example:

> A GET request is generally used to retrieve resources. In this step, you will create an endpoint that retrieves all students.

Then:

```text
Implementation instructions
```

This prevents the project from becoming a disconnected coding sequence.

---

# 34. P3 Step Example — Python OOP

Project:

> Build a Bank Account Manager.

Steps:

```text
Step 1 — Create Account class
Step 2 — Add account attributes
Step 3 — Implement deposit()
Step 4 — Implement withdraw()
Step 5 — Add balance validation
Step 6 — Add transaction history
Step 7 — Test account behavior
```

The learner builds the project incrementally.

---

# 35. P3 Step Example — Exception Handling

Project:

> Build a Safe File Processor.

Steps:

```text
Step 1 — Accept filename
Step 2 — Open file
Step 3 — Handle FileNotFoundError
Step 4 — Read file
Step 5 — Handle invalid data
Step 6 — Add custom exception
Step 7 — Add logging
Step 8 — Test failure paths
```

This fits perfectly with your Exception Handling curriculum.

---

# 36. P3 Step Example — Authentication

Project:

> Build a Basic Authentication Service.

Steps:

```text
Step 1 — Create user model
Step 2 — Create registration endpoint
Step 3 — Hash passwords
Step 4 — Create login endpoint
Step 5 — Generate session/token
Step 6 — Add authentication middleware
Step 7 — Protect endpoint
Step 8 — Add authorization check
Step 9 — Test unauthorized access
Step 10 — Test authorized access
```

This is explicitly educational.

It should **not** be presented as production-ready authentication without the appropriate security architecture.

---

# 37. P3 Step Example — RBAC

Project:

> Build a Role-Based Access Control service.

Steps:

```text
1. Define users
2. Define roles
3. Define permissions
4. Map roles to permissions
5. Assign roles to users
6. Implement authorization check
7. Add protected resource
8. Test allowed access
9. Test denied access
10. Test role changes
```

The learner experiences RBAC as an integrated system.

---

# 38. P3 Step Example — Tutorial Engine

Project:

> Build a JSON-driven tutorial renderer.

Steps:

```text
1. Define block schema
2. Parse JSON
3. Identify block type
4. Create TextBlock renderer
5. Create CodeBlock renderer
6. Add renderer dispatch
7. Handle unsupported blocks
8. Render complete tutorial
9. Add validation
10. Test multiple block types
```

This directly demonstrates the architecture behind a block-based tutorial engine.

---

# 39. P3 Step Example — ProjectBlock Itself

A particularly useful meta-example:

> Build a simple project workflow engine.

Steps:

```text
Project
 ↓
Steps
 ↓
Step state
 ↓
Dependencies
 ↓
Completion
 ↓
Submission
```

The learner could build a miniature version of the same concept they are using.

---

# 40. P3 Guided Explanation vs P3 Instruction

P3 can contain both:

### Explanation

> Why this component is needed.

### Instruction

> Create the component and implement the following behavior.

The distinction is:

```text
Explanation → understand
Instruction → execute
```

Both are valid in P3.

---

# 41. P3 Step Templates

The project system can support reusable step types:

```text
Concept Step
Setup Step
Design Step
Coding Step
Database Step
API Step
Testing Step
Debugging Step
Integration Step
Review Step
```

This makes P3 projects easier to author.

---

# 42. P3 Step Authoring

Admin/composer could provide:

```text
┌──────────────────────────────────────────────┐
│ Add Project Step                             │
├──────────────────────────────────────────────┤
│ Step Number                                  │
│ [ 4 ]                                        │
│                                              │
│ Step Type                                    │
│ [ Coding Step ▼ ]                            │
│                                              │
│ Title                                        │
│ [ Create GET Endpoint ]                      │
│                                              │
│ Objective                                    │
│ [                                          ] │
│                                              │
│ Instructions                                 │
│ [                                          ] │
│                                              │
│ Expected Result                              │
│ [                                          ] │
│                                              │
│ Validation                                   │
│ [ Automated Tests ▼ ]                        │
│                                              │
│ [ Save Step ]                                │
└──────────────────────────────────────────────┘
```

---

# 43. P3 Step Authoring — Dependencies

A step can define:

```text
Depends On:
[ Step 3 — Database ]
```

Then the system knows:

```text
Step 4
LOCKED
```

until Step 3 passes.

---

# 44. P3 Step Authoring — Completion Criteria

Example:

```text
Completion Criteria

✓ GET /students exists
✓ Returns 200 for valid request
✓ Response is JSON
✓ Database records are returned
```

These criteria can be linked to automated tests.

---

# 45. P3 Automated Validation

For code projects:

```text
Learner Code
     ↓
Sandbox
     ↓
Automated Tests
     ↓
Step Validation
     ↓
PASS / FAIL
```

This should be isolated from the main Tutorial Engine.

---

# 46. P3 Project Evaluation Architecture

```text
                     ProjectBlock
                          │
                          ▼
                         P3
                          │
                          ▼
                  Step Definitions
                          │
                          ▼
                   Learner Work
                          │
                          ▼
                 Execution / Testing
                          │
                          ▼
                   Step Results
                          │
                          ▼
                 Project Evaluation
```

The Tutorial Engine presents the workflow.

The project/evaluation infrastructure executes and evaluates it.

---

# 47. P3 No Local Assessment Engine

As with QuizBlock and InterviewBlock:

```text
ProjectBlock
      │
      ▼
Project Service
      │
      ▼
Evaluation Infrastructure
```

Do not duplicate:

```text
question engine
attempt engine
scoring engine
evaluation engine
```

inside the Tutorial Engine.

---

# 48. P3 Submission Model

A project can be submitted after all required steps pass.

```text
Step 1 ✓
Step 2 ✓
Step 3 ✓
Step 4 ✓
Step 5 ✓
Step 6 ✓
Step 7 ✓
Step 8 ✓
Step 9 ✓
Step 10 ✓
        ↓
Project Ready
        ↓
Submit
```

But the author can configure whether every step must pass.

---

# 49. P3 Project Completion

Completion may require:

```text
Required Steps Passed
+
Required Tests Passed
+
Final Submission
```

For some projects:

```text
Final Submission
```

may itself be the final step.

---

# 50. P3 Revision

If the final project fails evaluation:

```text
Submission
   ↓
Evaluation
   ↓
Revision Required
   ↓
Return to failed step
   ↓
Fix
   ↓
Retest
   ↓
Resubmit
```

The learner should not necessarily restart the whole project.

---

# 51. P3 Revision Navigation

Example:

```text
Step 1 ✓
Step 2 ✓
Step 3 ✓
Step 4 ✓
Step 5 ⚠ Needs Revision
Step 6 ✓
Step 7 ✓
```

The learner can directly return to Step 5.

---

# 52. P3 Progress Preservation

When revising:

```text
Completed steps remain completed
```

unless the changed implementation invalidates dependent steps.

For example:

```text
Step 3 database schema changed
        ↓
Step 4 GET may require retesting
        ↓
Step 5 POST may require retesting
```

The system can intelligently invalidate dependent tests.

---

# 53. P3 Dependency-Aware Retesting

```text
Database Schema
       │
       ▼
GET Endpoint
       │
       ▼
Integration Tests
```

If the schema changes:

```text
Schema
  ↓
Affected steps
  ↓
Retest
```

This is a more realistic engineering workflow.

---

# 54. P3 Debugging Workflow

```text
Test Failure
      ↓
Identify Step
      ↓
Read Failure
      ↓
Inspect Implementation
      ↓
Fix
      ↓
Run Step Tests
      ↓
PASS
      ↓
Continue
```

The learner learns a repeatable debugging process.

---

# 55. P3 Step Notes

Each step can provide:

```text
WHY
WHAT
HOW
EXPECTED RESULT
COMMON MISTAKES
```

Example:

```text
WHY
We need a persistent student model.

WHAT
Create the student schema.

HOW
Use the project's database schema conventions.

EXPECTED
The migration creates the students table.
```

---

# 56. P3 Common Mistakes

A step can optionally expose common mistakes after failure.

Example:

> **Common mistake:** Returning the database object directly instead of converting it into the expected API response shape.

This is more useful than just showing an error.

---

# 57. P3 Step Completion Celebration

A small completion state can show:

```text
✓ STEP COMPLETE

GET /students

Tests Passed: 5/5

Next:
Create POST /students
```

This maintains momentum.

---

# 58. P3 Final Integration

Individual steps eventually become one system.

```text
Models
  +
Database
  +
API
  +
Validation
  +
Error Handling
  +
Tests
       ↓
Complete Application
```

This integration stage is essential.

---

# 59. P3 Integration Step

The final step might say:

> Run the complete application and verify that all components work together.

Checklist:

```text
✓ Application starts
✓ Database connects
✓ GET works
✓ POST works
✓ UPDATE works
✓ DELETE works
✓ Validation works
✓ Errors are handled
✓ Tests pass
```

---

# 60. P3 Final Project Review

```text
┌─────────────────────────────────────────────────┐
│ PROJECT COMPLETE                                 │
├─────────────────────────────────────────────────┤
│ Student Management API                           │
│                                                 │
│ Steps Completed        10 / 10                  │
│ Tests Passed           24 / 24                  │
│ Requirements           100%                     │
│                                                 │
│ Code Quality            86%                     │
│ Testing                 91%                     │
│ Error Handling          88%                     │
│                                                 │
│ Overall                 90%                     │
│                                                 │
│ [ Review Project ] [ Continue ]                 │
└─────────────────────────────────────────────────┘
```

---

# 61. P3 Learning Outcome

After completing P3, the learner should understand:

```text
How a larger problem is broken into steps
How components depend on one another
How implementation progresses
How to test each stage
How to integrate components
How to debug individual stages
How to validate the final system
```

That is the educational purpose of P3.

---

# 62. P3 Independence Level

The autonomy progression now becomes:

```text
P1
██████████
High independence

P2
████████░░
Guided independence

P3
██████░░░░
Structured implementation

P4+
██████████
Independence returns with greater complexity
```

P3 intentionally reduces ambiguity so the learner can focus on learning the construction process.

---

# 63. P3 Relationship to Real Development

P3 resembles:

```text
Requirements
 ↓
Design
 ↓
Implementation Tasks
 ↓
Integration
 ↓
Testing
 ↓
Review
```

This is closer to actual software development than a collection of exercises.

---

# 64. P3 Relationship With TaskBlock

A TaskBlock might say:

> Implement the `createStudent()` function.

P3 says:

```text
Build the Student Management API.

Step 1
Set up project

Step 2
Create model

Step 3
Create database

Step 4
Create API

...
```

TaskBlock focuses on:

> **What must be accomplished?**

P3 focuses on:

> **How the complete project is constructed through a defined implementation sequence.**

---

# 65. P3 Relationship With ExerciseBlock

ExerciseBlock:

```text
Practice:
Implement a POST request handler.
```

P3:

```text
Project:
Build Student API.

Step 5:
Implement POST /students
```

The exercise isolates a skill.

The project embeds that skill into a larger system.

---

# 66. P3 Relationship With InteractiveBlock

InteractiveBlock can support individual steps:

```text
P3 Step
  ↓
INT2 Edit → Run → Observe
  ↓
Understand behavior
  ↓
Return to P3
```

Therefore blocks can cooperate without becoming duplicates.

---

# 67. P3 Relationship With InterviewBlock

After completing the project:

```text
P3
 ↓
Complete Student API
 ↓
IV5
"Why did you separate validation?"
 ↓
IV6
"What happens when the database is unavailable?"
```

The learner moves from:

```text
Build
```

to:

```text
Explain
```

to:

```text
Defend
```

---

# 68. P3 Project Architecture

```text
                         Tutorial Engine
                                │
                                ▼
                          ProjectBlock
                                │
                               P3
                                │
                                ▼
                       Project Definition
                                │
                                ▼
                         Step Definitions
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
           Objective        Instructions       Validation
              │                 │                 │
              └─────────────────┼─────────────────┘
                                ▼
                          Learner Work
                                │
                                ▼
                       Execution / Testing
                                │
                                ▼
                         Step Results
                                │
                                ▼
                       Project Evaluation
                                │
                                ▼
                          Submission
```

---

# 69. P3 JSON

The Tutorial Engine should reference the project rather than embedding the complete project definition:

```json
{
  "type": "project",
  "version": "P3",
  "projectId": "student-management-api-001"
}
```

Optional presentation:

```json
{
  "type": "project",
  "version": "P3",
  "projectId": "student-management-api-001",
  "presentation": {
    "showStepNavigation": true,
    "showDependencies": true,
    "showProgress": true,
    "showHints": true,
    "showExpectedResults": true,
    "allowRetry": true,
    "showEvaluation": true
  }
}
```

---

# 70. P3 Technical Specification

| Area                                       | P3 Decision                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| **Block**                                  | **ProjectBlock**                                                           |
| **Version**                                | **P3**                                                                     |
| **Presentation**                           | **Step-by-Step Project**                                                   |
| **Primary purpose**                        | Teach complete project construction through explicit implementation stages |
| **Project scope**                          | Moderate                                                                   |
| **Project roadmap**                        | ✅                                                                          |
| **Explicit steps**                         | ✅                                                                          |
| **Step dependencies**                      | ✅                                                                          |
| **Step unlocking**                         | ✅                                                                          |
| **Step validation**                        | ✅                                                                          |
| **Hints**                                  | ✅                                                                          |
| **Expected results**                       | ✅                                                                          |
| **Testing**                                | ✅                                                                          |
| **Debugging**                              | ✅                                                                          |
| **Integration**                            | ✅                                                                          |
| **Final submission**                       | ✅                                                                          |
| **Revision**                               | ✅                                                                          |
| **Multiple valid solutions**               | ✅                                                                          |
| **Learner decision-making**                | Moderate                                                                   |
| **System-defined implementation sequence** | ✅                                                                          |
| **Line-by-line solution**                  | ❌                                                                          |
| **Full solution before learner attempts**  | ❌                                                                          |
| **Automated tests**                        | Recommended where applicable                                               |
| **Hidden tests**                           | Optional                                                                   |
| **Execution sandbox**                      | Optional by project type                                                   |
| **Project definition ownership**           | Project/Assessment layer                                                   |
| **Step definition ownership**              | Project/Assessment layer                                                   |
| **Submission ownership**                   | Project/Assessment layer                                                   |
| **Evaluation ownership**                   | Project/Assessment layer                                                   |
| **Tutorial ownership**                     | Presentation/orchestration                                                 |
| **Local project engine**                   | ❌                                                                          |
| **Local scoring authority**                | ❌                                                                          |
| **JSON-driven**                            | ✅                                                                          |
| **Authentication**                         | Existing platform auth                                                     |
| **Authorization**                          | Existing platform authorization                                            |
| **Autosave**                               | ✅ where applicable                                                         |
| **Accessibility**                          | ✅                                                                          |
| **Keyboard navigation**                    | ✅                                                                          |
| **Responsive**                             | ✅                                                                          |
| **Light theme**                            | ✅                                                                          |
| **Primary**                                | **#F54A8D**                                                                |
| **Secondary**                              | **#0B1B3D**                                                                |
| **Gradient**                               | ❌                                                                          |
| **Dark overall theme**                     | ❌                                                                          |

---

# 71. P3 Final Mental Model

```text
                         P3
                 STEP-BY-STEP PROJECT
                         │
                         ▼
                       GOAL
                         │
                         ▼
                    REQUIREMENTS
                         │
                         ▼
                  PROJECT ROADMAP
                         │
                         ▼
              ┌──────────────────────┐
              │      STEP 1          │
              │      STEP 2          │
              │      STEP 3          │
              │        ...           │
              │      STEP N          │
              └──────────────────────┘
                         │
                         ▼
                    INTEGRATION
                         │
                         ▼
                      TESTING
                         │
                         ▼
                      REVIEW
                         │
                         ▼
                     SUBMIT
                         │
                         ▼
                    EVALUATE
                         │
                         ▼
                     IMPROVE
```

### The essential definition

> **P3 — Step-by-Step Project is a structured project experience in which the learner builds a complete project through an explicit sequence of implementation steps, with each step providing its objective, instructions, expected result, validation, and completion criteria while still requiring the learner to write and understand the implementation.**

## **P3 — Step-by-Step Project: COMPLETE** ✅

Next version:

> **P4 — Real-World Scenario**



```python

```

    # BLOCK 18 — ProjectBlock

## P4 — Real-World Scenario

Yes. We continue with **only P4**, one version at a time.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| P1      | Mini Project                   | ✅ Complete     |
| P2      | Guided Project                 | ✅ Complete     |
| P3      | Step-by-Step Project           | ✅ Complete     |
| **P4**  | **Real-World Scenario**        | 🔵 **CURRENT** |
| P5      | Feature-Based Project          | ⏳              |
| P6      | Open-Ended Project             | ⏳              |
| P7      | Capstone Project               | ⏳              |
| P8      | Portfolio / Production Project | ⏳              |

---

# 1. What Is P4 — Real-World Scenario?

**P4 — Real-World Scenario** places the learner inside a realistic professional situation and asks them to build a solution for that situation.

The major change from P3 is:

> **P3 tells the learner how the project is constructed. P4 gives the learner a realistic problem and asks them to determine an appropriate solution.**

The progression is:

```text
P1
Mini Project
    ↓
Build something small
    ↓
P2
Guided Project
    ↓
Learn how to approach a project
    ↓
P3
Step-by-Step Project
    ↓
Learn how a project is constructed
    ↓
P4
Real-World Scenario
    ↓
Apply knowledge to a realistic situation
```

---

# 2. P4 Core Mental Model

```text
                    P4
             REAL-WORLD SCENARIO
                     │
                     ▼
              Business Context
                     │
                     ▼
              Real Problem
                     │
                     ▼
               Requirements
                     │
                     ▼
              Constraints
                     │
                     ▼
             Learner Analysis
                     │
                     ▼
              Solution Design
                     │
                     ▼
                 Build
                     │
                     ▼
               Test / Validate
                     │
                     ▼
              Present Solution
                     │
                     ▼
                 Review
```

The learner is no longer simply following a tutorial project.

They are solving a **contextual problem**.

---

# 3. Why P4 Exists

A learner may know:

```text
Python
APIs
Databases
Authentication
Testing
```

and still struggle when given:

> "A company needs this system. What should you build?"

That is a different skill.

P4 develops:

```text
Problem interpretation
Requirement analysis
Constraint analysis
Architecture decisions
Trade-offs
Implementation
Testing
Communication
```

The learner moves from:

> **"How do I implement this?"**

to:

> **"What should I implement, and why?"**

---

# 4. P4 vs P3

This is the critical boundary.

### P3

The project might say:

```text
Step 1 — Create database
Step 2 — Create model
Step 3 — Create API
Step 4 — Add validation
Step 5 — Add tests
```

The implementation sequence is predefined.

### P4

The scenario might say:

> A training company needs an API that allows instructors to manage tutorials and learners to access published tutorials.

The learner must determine:

```text
What entities are needed?
What endpoints are needed?
What roles exist?
What should be protected?
How should the data be structured?
How should errors be handled?
```

There is no prescribed implementation sequence.

---

# 5. P4 Real-World Context

A good P4 project begins with a **situation**, not merely a technical specification.

Example:

> **Scenario: Training Platform Tutorial Management**

A growing training company has hundreds of tutorials.

Instructors need to create and update tutorials.

Learners should only see published tutorials.

Administrators need to manage instructors and content.

The existing system is becoming difficult to maintain.

The team needs a new service.

---

# 6. Scenario Brief

The learner receives:

```text
┌──────────────────────────────────────────────┐
│ REAL-WORLD SCENARIO                           │
│                                              │
│ Tutorial Management Platform                │
│                                              │
│ A training company needs a system for        │
│ managing tutorials across multiple courses. │
│                                              │
│ Instructors create content.                  │
│ Learners consume published content.          │
│ Administrators manage the platform.          │
│                                              │
│ Your task:                                   │
│ Design and implement an appropriate          │
│ solution.                                    │
└──────────────────────────────────────────────┘
```

The learner must analyze the situation.

---

# 7. P4 Problem Statement

The problem should be realistic but bounded.

Example:

> The existing platform stores tutorial information inconsistently. Instructors sometimes modify content directly, learners occasionally see unpublished content, and administrators have difficulty controlling access.

The learner is asked to solve the problem.

---

# 8. P4 Requirements

Requirements can be divided into:

### Functional

```text
Create tutorial
Update tutorial
Publish tutorial
View published tutorial
```

### Security

```text
Only authorized instructors can edit
Only authorized users can publish
Learners cannot edit
```

### Reliability

```text
Invalid requests should not corrupt data
```

### Performance

```text
Published tutorials should load efficiently
```

The learner must interpret these requirements.

---

# 9. P4 Constraints

Real-world projects always have constraints.

Example:

```text
Constraints
───────────
Existing PostgreSQL database
REST API
Role-based authorization
Existing authentication system
Limited development time
Must support multiple brands
```

Now architecture decisions become meaningful.

---

# 10. P4 Learner Responsibilities

The learner should determine:

```text
Data model
API structure
Authorization boundaries
Validation
Error handling
Testing
Caching strategy
Project structure
```

The system should not immediately provide these answers.

---

# 11. P4 Analysis Stage

Before implementation, the learner analyzes:

```text
Who are the users?
What do they need?
What resources exist?
What operations are required?
What must be protected?
What could go wrong?
```

This teaches requirements engineering.

---

# 12. P4 Stakeholder Analysis

Example:

```text
Stakeholders
─────────────

Learner
→ Read published tutorials

Instructor
→ Create
→ Edit
→ Submit
→ Possibly publish

Admin
→ Manage content
→ Manage users
→ Control permissions
```

The learner derives authorization rules from the scenario.

---

# 13. P4 Entity Identification

The learner might identify:

```text
User
Role
Tutorial
TutorialVersion
Publication
```

The system can ask:

> What entities do you think the system needs?

The learner proposes the model.

---

# 14. P4 Data Model

A possible learner design:

```text
User
 │
 └── Role

Tutorial
 │
 ├── title
 ├── slug
 ├── status
 └── content

TutorialVersion
 │
 ├── version
 ├── content
 └── created_at
```

The learner must justify the design.

---

# 15. P4 Architecture

The learner might propose:

```text
Client
  ↓
API
  ↓
Authentication
  ↓
Authorization
  ↓
Tutorial Service
  ↓
Database
```

The architecture is a **solution to the scenario**, not a predefined lesson sequence.

---

# 16. P4 Authorization Reasoning

The scenario says:

> Learners must not modify tutorials.

The learner must determine:

```text
Authentication
→ Who are you?

Authorization
→ Are you allowed to perform this operation?
```

For example:

```text
POST /tutorials
       ↓
Authenticated?
       ↓
Role / permission?
       ↓
Allowed?
       ↓
Create tutorial
```

This directly connects the project to authentication and authorization concepts.

---

# 17. P4 Role Matrix

The learner could create:

| Operation               | Learner |   Instructor | Admin |
| ----------------------- | ------: | -----------: | ----: |
| View published tutorial |       ✅ |            ✅ |     ✅ |
| Create tutorial         |       ❌ |            ✅ |     ✅ |
| Edit tutorial           |       ❌ |            ✅ |     ✅ |
| Publish tutorial        |       ❌ | configurable |     ✅ |
| Delete tutorial         |       ❌ | configurable |     ✅ |

The exact permissions should be derived from the scenario.

---

# 18. P4 Implementation

After analysis, the learner implements the solution.

Unlike P3, the system does not say:

> Step 1: Create `tutorials` table.

Instead, the learner decides the implementation sequence based on their design.

That is the core difference.

---

# 19. P4 Example — Authentication Scenario

Scenario:

> A company is building an internal employee portal. Employees should access their own profile information. Managers can view profiles of employees in their department. HR administrators can manage all employee records.

The learner must determine:

```text
Authentication
Authorization
Roles
Permissions
Resource ownership
Department boundaries
```

---

# 20. P4 Authorization Challenge

Suppose:

```text
Employee A
Department: Engineering

Employee B
Department: Finance
```

Manager A requests:

```text
GET /employees/B
```

The learner must decide whether this should be allowed.

The important lesson:

> **Role alone may not be enough. Resource context can matter.**

This is a real-world authorization problem.

---

# 21. P4 Scenario — RBAC + Resource Rules

The learner may discover:

```text
Role-based permission
        +
Resource ownership / scope
```

For example:

```text
manager
    +
same department
        ↓
allowed
```

while:

```text
manager
    +
different department
        ↓
denied
```

This introduces more realistic authorization reasoning.

---

# 22. P4 Scenario — Tutorial Engine

Scenario:

> A tutorial platform supports multiple brands. Each brand has its own users, content, and administrators. Some platform services are shared.

The learner must think about:

```text
tenant/brand
identity
authorization
content ownership
routing
shared services
```

Possible architecture:

```text
Brand
 ├── RTH
 └── SUIA

Shared Identity
      │
      ▼
Tutorial Service
      │
      ├── Brand A Content
      └── Brand B Content
```

The learner determines the exact implementation.

---

# 23. P4 Scenario — Publishing

Scenario:

> An instructor is editing Tutorial A while learners are actively viewing the previous published version.

The learner must determine:

```text
Should editing replace published content?
Should drafts be separate?
Should versions exist?
When does a new version become visible?
```

A possible solution:

```text
Published Version
       │
       ├── Learners see this
       │
       ▼
Draft Version
       │
       ▼
Review
       │
       ▼
Publish
       │
       ▼
New Published Version
```

This creates a realistic versioning problem.

---

# 24. P4 Scenario — Concurrent Editing

Scenario:

> Two instructors open the same tutorial and make changes at the same time.

The learner must consider:

```text
Lost updates
Concurrency
Versioning
Conflict detection
Optimistic locking
```

The project becomes an engineering problem rather than a simple coding exercise.

---

# 25. P4 Scenario — Caching

Scenario:

> Published tutorials are requested thousands of times per hour, but instructors update them only occasionally.

The learner should reason about:

```text
Cache
   ↓
Published content
   ↓
Invalidation
```

Possible design:

```text
Request
 ↓
Cache
 ├── HIT → response
 └── MISS
       ↓
    Database
       ↓
     Cache
       ↓
    Response
```

The learner must determine where caching belongs.

---

# 26. P4 Scenario — Failure

Scenario:

> The database becomes temporarily unavailable while learners are requesting published tutorials.

The learner must consider:

```text
What happens?
Can cached content still be served?
Should the API retry?
How many retries?
What response should the learner receive?
How should the failure be logged?
```

This introduces production-style reasoning.

---

# 27. P4 Scenario — Security

Scenario:

> A learner modifies the request from:

```text
/tutorials/my-tutorial
```

to:

```text
/tutorials/other-user-private-tutorial
```

The learner must identify:

```text
Authorization check
+
resource ownership
```

The server must not trust the client.

---

# 28. P4 Threat Thinking

The project can ask:

> What could a malicious user attempt?

Potential considerations:

```text
Unauthorized access
IDOR / object-level authorization failure
Privilege escalation
Token misuse
Input manipulation
Data exposure
```

The learner should reason about defenses.

---

# 29. P4 Real-World Trade-Offs

Real projects rarely have one perfect answer.

The learner might compare:

```text
Option A
Simple architecture

Option B
More modular architecture
```

Then evaluate:

```text
Complexity
Maintainability
Performance
Security
Cost
Scalability
```

This is a major P4 capability.

---

# 30. P4 Decision Log

The project can require the learner to document important decisions.

```text
Decision:
Use optimistic locking.

Why:
Two instructors may edit the same tutorial.

Alternative:
Last-write-wins.

Rejected because:
It could silently overwrite another instructor's changes.
```

This teaches professional engineering communication.

---

# 31. P4 Architecture Decision Record

A lightweight ADR format:

```text
Decision
────────
Use versioned tutorial content.

Context
───────
Multiple users may edit tutorials.

Decision
────────
Store draft and published versions separately.

Reason
──────
Learners should always receive stable published content.
```

This is appropriate for P4 because real-world projects require explaining decisions.

---

# 32. P4 Project Workspace

```text
┌─────────────────────────────────────────────────────┐
│ REAL-WORLD SCENARIO                                 │
│ Tutorial Publishing Platform                        │
├─────────────────────────────────────────────────────┤
│ SCENARIO                                             │
│                                                     │
│ Instructors edit tutorials while learners consume  │
│ published versions.                                 │
│                                                     │
│ REQUIREMENTS                                        │
│ ✓ Draft editing                                     │
│ ✓ Publishing                                        │
│ ✓ Role-based access                                 │
│ ✓ Stable learner experience                         │
│                                                     │
│ YOUR DESIGN                                         │
│                                                     │
│ Architecture: [..................................] │
│ Data Model:  [..................................] │
│ Security:    [..................................] │
│                                                     │
│ [ Build Solution ]                                 │
└─────────────────────────────────────────────────────┘
```

---

# 33. P4 No Fixed Implementation Path

This is one of the most important properties.

P3:

```text
System-defined path
```

P4:

```text
Problem-defined requirements
        ↓
Learner-defined solution
```

The system evaluates whether the solution satisfies the scenario.

---

# 34. P4 Requirements Are More Important Than Exact Implementation

Suppose two learners build:

### Solution A

```text
REST API
PostgreSQL
Redis
```

### Solution B

```text
REST API
PostgreSQL
No Redis
```

If caching is not required by the scenario, both might be valid.

Therefore P4 evaluation should focus on:

```text
Requirements
Correctness
Security
Design suitability
Trade-offs
```

not exact architecture matching.

---

# 35. P4 Open Design Questions

Good P4 projects contain questions such as:

> How would you model this?

> What should happen if this fails?

> How should unauthorized access be handled?

> What would happen at larger scale?

> What trade-off are you making?

These questions create engineering reasoning.

---

# 36. P4 Implementation Constraints

The scenario can still define boundaries.

Example:

```text
Must use:
PostgreSQL
REST API
Existing authentication service

May use:
Redis

Cannot change:
Existing identity database
```

This forces realistic design decisions.

---

# 37. P4 Existing-System Integration

This is particularly valuable.

Real software is rarely built from zero.

A scenario may say:

> Authentication already exists. Your service must integrate with it.

The learner must understand:

```text
Existing Identity
      ↓
Authenticated Request
      ↓
Tutorial Service
      ↓
Authorization
```

This is much closer to professional engineering.

---

# 38. P4 Legacy System Scenario

Another strong scenario:

> You inherit a system that works but has inconsistent authorization checks.

The learner must:

```text
Audit
 ↓
Identify risks
 ↓
Design centralized authorization
 ↓
Migrate
 ↓
Test
```

This is a real-world engineering problem.

---

# 39. P4 Performance Scenario

Example:

> Tutorial reads increased from 10,000/day to 5 million/day while writes remained low.

The learner must consider:

```text
Caching
Database indexes
Read replicas
CDN
Payload size
Connection pooling
```

The goal is not to force every technology.

The goal is to make the learner reason about the bottleneck.

---

# 40. P4 Scalability Scenario

The system can introduce a future condition:

> The application currently serves 10,000 learners. It is expected to serve 1 million learners within a year.

The learner must evaluate:

```text
Current architecture
        ↓
Expected load
        ↓
Bottlenecks
        ↓
Scaling strategy
```

---

# 41. P4 Reliability Scenario

Example:

> The API must remain available even if one dependency experiences a temporary failure.

The learner considers:

```text
Timeouts
Retries
Circuit breakers
Caching
Fallbacks
Monitoring
```

Again, the learner decides what is appropriate.

---

# 42. P4 Observability Scenario

The learner can be asked:

> The support team reports that learners occasionally receive 500 errors. How would you investigate the issue?

Expected thinking:

```text
Logs
Metrics
Tracing
Request IDs
Error rates
Latency
Dependency failures
```

This introduces real operational thinking.

---

# 43. P4 Testing Strategy

The learner should determine:

```text
Unit tests
Integration tests
API tests
Authorization tests
Failure tests
```

For authentication projects especially:

```text
Allowed request
Denied request
Expired credential
Missing credential
Wrong role
Wrong resource scope
```

---

# 44. P4 Security Testing

Example:

```text
User A
 ↓
Request User B's resource
 ↓
Expected:
403 / appropriate denial
```

The learner must demonstrate that authorization is enforced server-side.

---

# 45. P4 Acceptance Criteria

The scenario can end with:

```text
Acceptance Criteria
────────────────────

✓ Authorized users can create tutorials
✓ Unauthorized users cannot edit
✓ Learners see only published versions
✓ Draft changes do not affect published content
✓ Publishing creates a new visible version
✓ Invalid requests are rejected
✓ Important failures are observable
```

These criteria become the project's evaluation contract.

---

# 46. P4 Evaluation

Evaluation can contain multiple dimensions:

| Dimension                | Example                                   |
| ------------------------ | ----------------------------------------- |
| Requirement Satisfaction | Does the system solve the stated problem? |
| Correctness              | Does it behave correctly?                 |
| Architecture             | Is the design appropriate?                |
| Security                 | Are access boundaries enforced?           |
| Reliability              | Are failures considered?                  |
| Performance              | Are major bottlenecks addressed?          |
| Testing                  | Are important scenarios tested?           |
| Reasoning                | Can the learner justify decisions?        |
| Communication            | Can the learner explain the solution?     |

---

# 47. P4 Evaluation Is Not Exact-Code Matching

This is critical.

For a real-world scenario:

```text
There may be multiple correct solutions.
```

Therefore:

```text
Solution ≠ Reference Implementation
```

Instead:

```text
Solution
   ↓
Requirements
   ↓
Constraints
   ↓
Trade-offs
   ↓
Evaluation
```

---

# 48. P4 Architecture Review

After submission, the learner can receive feedback such as:

> Your design correctly separates authentication from authorization. However, authorization is implemented only at the route level and does not consistently verify resource ownership.

That is meaningful professional feedback.

---

# 49. P4 Scenario Feedback

Example:

```text
STRENGTHS
─────────
✓ Correct role model
✓ Clear API boundaries
✓ Good validation
✓ Good test coverage

RISKS
─────
⚠ Resource-level authorization is incomplete
⚠ Cache invalidation is not defined

RECOMMENDATION
──────────────
Introduce explicit resource-scope authorization
and define cache invalidation behavior for publishing.
```

---

# 50. P4 Decision Evaluation

The evaluator can inspect not only:

```text
What did you build?
```

but:

```text
Why did you build it this way?
```

Example:

> Why did you choose versioned content rather than updating the published record directly?

Learner:

> Because learners should continue seeing a stable published version while instructors work on the next version.

That demonstrates understanding.

---

# 51. P4 Scenario Presentation

```text
┌────────────────────────────────────────────────────┐
│ REAL-WORLD SCENARIO                                │
│                                                    │
│ Tutorial Publishing Platform                      │
│                                                    │
│ CONTEXT                                            │
│ ───────                                            │
│ Instructors edit tutorials while learners         │
│ consume published content.                        │
│                                                    │
│ PROBLEM                                            │
│ ───────                                            │
│ Draft changes are sometimes visible to learners.  │
│                                                    │
│ YOUR MISSION                                       │
│ ───────────                                        │
│ Design and implement a solution.                  │
│                                                    │
│ CONSTRAINTS                                        │
│ • Existing authentication                         │
│ • PostgreSQL                                      │
│ • Multiple brands                                 │
│                                                    │
│ [ Analyze Scenario ]                               │
└────────────────────────────────────────────────────┘
```

---

# 52. P4 Analysis Workspace

```text
┌────────────────────────────────────────────────────┐
│ SCENARIO ANALYSIS                                  │
├────────────────────────────────────────────────────┤
│ Stakeholders                                       │
│ [................................................] │
│                                                    │
│ Requirements                                       │
│ [................................................] │
│                                                    │
│ Constraints                                        │
│ [................................................] │
│                                                    │
│ Risks                                              │
│ [................................................] │
│                                                    │
│ Key Design Decisions                               │
│ [................................................] │
│                                                    │
│ [ Review Analysis ]                                │
└────────────────────────────────────────────────────┘
```

---

# 53. P4 Architecture Workspace

```text
┌────────────────────────────────────────────────────┐
│ SOLUTION DESIGN                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│                 Client                             │
│                    │                               │
│                    ▼                               │
│                 API                                │
│                    │                               │
│          ┌─────────┴─────────┐                     │
│          ▼                   ▼                     │
│   Authentication       Authorization               │
│                              │                     │
│                              ▼                     │
│                       Tutorial Service             │
│                              │                     │
│                              ▼                     │
│                          Database                  │
│                                                    │
│ [ Validate Design ]                                │
└────────────────────────────────────────────────────┘
```

The learner creates the actual design.

The displayed architecture is only an illustrative example.

---

# 54. P4 Scenario Constraints

Constraints make the project realistic.

Possible categories:

```text
Technical
Budget
Time
Security
Compliance
Existing systems
Scale
Availability
Team capability
```

Example:

```text
Budget:
Limited

Existing:
Identity service

Scale:
100k daily users

Availability:
99.9%

Database:
PostgreSQL
```

The learner must make trade-offs.

---

# 55. P4 Trade-Off Analysis

Example:

### Option A

```text
Simple database queries
No caching
```

Pros:

```text
Simple
Easy to maintain
```

Cons:

```text
Potentially slower at scale
```

### Option B

```text
Database + Redis
```

Pros:

```text
Faster reads
```

Cons:

```text
More complexity
Cache invalidation
```

The learner decides which is appropriate.

---

# 56. P4 Scenario Evolution

A scenario can introduce changes during the project.

For example:

### Initial condition

```text
10,000 users
```

Then:

> User traffic increased tenfold.

The learner must revisit the design.

Then:

> A security incident occurred.

The learner revisits authorization.

This introduces dynamic problem solving.

---

# 57. P4 Change Request

A useful P4 feature:

```text
NEW REQUIREMENT

The platform now needs:
Multiple brands with isolated administrative access.
```

The learner must modify the solution.

This resembles real engineering work.

---

# 58. P4 Production Incident

Another scenario:

> After publishing a tutorial, some learners still see the old version while others see the new version.

The learner investigates:

```text
Cache
CDN
Database
Version selection
Invalidation
Consistency
```

This is excellent real-world reasoning.

---

# 59. P4 Incident Response

The project can ask the learner to produce:

```text
Root Cause
Impact
Immediate Fix
Long-Term Fix
Prevention
```

Example:

```text
Root Cause:
Stale cache entries were not invalidated after publishing.

Immediate Fix:
Invalidate affected cache keys.

Long-Term Fix:
Centralize publication-triggered invalidation.
```

---

# 60. P4 Documentation

A realistic project should require a small amount of documentation:

```text
README
Architecture
API behavior
Security assumptions
Testing strategy
Known limitations
```

This teaches professional communication.

---

# 61. P4 Project Deliverables

A typical P4 submission:

```text
Source Code
Architecture Diagram
README
Decision Log
Tests
API Documentation
Security Considerations
Known Limitations
```

Not every scenario needs every artifact.

The scenario defines what is appropriate.

---

# 62. P4 Final Presentation

The learner should be able to explain:

```text
Problem
 ↓
Requirements
 ↓
Solution
 ↓
Architecture
 ↓
Trade-offs
 ↓
Testing
 ↓
Limitations
```

This makes P4 naturally connect to InterviewBlock.

---

# 63. P4 → InterviewBlock

After completing a real-world scenario:

```text
P4
Real-World Scenario
        ↓
IV5
Why did you choose this design?
        ↓
IV6
What happens if the database fails?
        ↓
IV7
Complete Interview Preparation
```

The project becomes an interview artifact.

---

# 64. P4 → BestPracticeBlock

If the project reveals weak engineering practices:

```text
P4
    ↓
Weak Error Handling
    ↓
BP6 Industry / FAANG Practices
    ↓
Review
    ↓
Improve P4
```

Again, the blocks complement each other.

---

# 65. P4 → InteractiveBlock

A real-world scenario can use interactive experiments.

Example:

```text
P4
Caching Scenario
    ↓
INT2
Edit → Run → Observe
    ↓
Compare cached vs uncached behavior
```

The learner experiments before finalizing the architecture.

---

# 66. P4 → QuizBlock

After the project:

```text
QZ6
Scenario Quiz
```

can test whether the learner understands the decisions made.

Example:

> Which authorization boundary prevents a learner from modifying another user's tutorial?

This reinforces the project.

---

# 67. P4 Project State

Conceptually:

```text
SCENARIO_ASSIGNED
        ↓
ANALYSIS
        ↓
DESIGN
        ↓
IMPLEMENTATION
        ↓
TESTING
        ↓
REVIEW
        ↓
SUBMISSION
        ↓
EVALUATION
        ↓
REVISION / COMPLETED
```

---

# 68. P4 JSON

Tutorial Engine reference:

```json
{
  "type": "project",
  "version": "P4",
  "projectId": "tutorial-publishing-real-world-001"
}
```

Optional presentation:

```json
{
  "type": "project",
  "version": "P4",
  "projectId": "tutorial-publishing-real-world-001",
  "presentation": {
    "showScenario": true,
    "showStakeholders": true,
    "showConstraints": true,
    "showDecisionLog": true,
    "showArchitectureWorkspace": true,
    "showProgress": true,
    "allowHints": true,
    "allowRevision": true,
    "showEvaluation": true
  }
}
```

The scenario definition, acceptance criteria, evaluation rubric, submission, and project lifecycle remain outside the Tutorial Engine presentation layer.

---

# 69. P4 Technical Specification

| Area                              | P4 Decision                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| **Block**                         | **ProjectBlock**                                             |
| **Version**                       | **P4**                                                       |
| **Presentation**                  | **Real-World Scenario**                                      |
| **Primary purpose**               | Apply technical knowledge to realistic professional problems |
| **Context**                       | Business / technical scenario                                |
| **Requirements**                  | ✅                                                            |
| **Constraints**                   | ✅                                                            |
| **Stakeholder analysis**          | ✅                                                            |
| **Problem analysis**              | ✅                                                            |
| **Architecture decisions**        | ✅                                                            |
| **Trade-offs**                    | ✅                                                            |
| **Implementation**                | ✅                                                            |
| **Testing**                       | ✅                                                            |
| **Security analysis**             | As applicable                                                |
| **Failure analysis**              | As applicable                                                |
| **Observability**                 | As applicable                                                |
| **Decision log**                  | Optional / recommended                                       |
| **Architecture documentation**    | Recommended                                                  |
| **Fixed implementation sequence** | ❌                                                            |
| **Multiple valid solutions**      | ✅                                                            |
| **Learner autonomy**              | High                                                         |
| **Automated tests**               | Recommended                                                  |
| **Scenario changes**              | Optional                                                     |
| **Incident simulation**           | Optional                                                     |
| **Revision**                      | ✅                                                            |
| **Submission**                    | ✅                                                            |
| **Evaluation**                    | ✅                                                            |
| **Tutorial ownership**            | Presentation/orchestration                                   |
| **Project ownership**             | Project/Assessment layer                                     |
| **Evaluation ownership**          | Project/Assessment layer                                     |
| **Local project engine**          | ❌                                                            |
| **Local scoring authority**       | ❌                                                            |
| **JSON-driven**                   | ✅                                                            |
| **Authentication**                | Existing platform auth                                       |
| **Authorization**                 | Existing platform authorization                              |
| **Accessibility**                 | ✅                                                            |
| **Keyboard navigation**           | ✅                                                            |
| **Responsive**                    | ✅                                                            |
| **Light theme**                   | ✅                                                            |
| **Primary**                       | **#F54A8D**                                                  |
| **Secondary**                     | **#0B1B3D**                                                  |
| **Gradient**                      | ❌                                                            |
| **Dark overall theme**            | ❌                                                            |

---

# 70. P4 Final Mental Model

```text
                         P4
                 REAL-WORLD SCENARIO
                         │
                         ▼
                      CONTEXT
                         │
                         ▼
                      PROBLEM
                         │
                         ▼
                   REQUIREMENTS
                         │
                         ▼
                    CONSTRAINTS
                         │
                         ▼
                  LEARNER ANALYSIS
                         │
                         ▼
                  SOLUTION DESIGN
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Security   Performance  Reliability
              │          │          │
              └──────────┼──────────┘
                         ▼
                      BUILD
                         │
                         ▼
                       TEST
                         │
                         ▼
                  REVIEW / DEFEND
                         │
                         ▼
                      SUBMIT
                         │
                         ▼
                    EVALUATE
                         │
                         ▼
                      IMPROVE
```

## P4's essential definition

> **P4 — Real-World Scenario is a project experience in which the learner receives a realistic professional problem, its stakeholders, requirements, constraints, and acceptance criteria, then independently analyzes the situation, designs an appropriate solution, implements it, validates it, explains the trade-offs, and improves the solution based on evaluation.**

The defining shift is:

```text
P3
"Follow this implementation path."

        ↓

P4
"Here is the real problem.
What is the right solution?"
```

## **P4 — Real-World Scenario: COMPLETE** ✅

Next:

> **P5 — Feature-Based Project**



```python

```

# BLOCK 18 — ProjectBlock

## P5 — Feature-Based Project

Yes. We continue with **only P5**, one version at a time.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| P1      | Mini Project                   | ✅ Complete     |
| P2      | Guided Project                 | ✅ Complete     |
| P3      | Step-by-Step Project           | ✅ Complete     |
| P4      | Real-World Scenario            | ✅ Complete     |
| **P5**  | **Feature-Based Project**      | 🔵 **CURRENT** |
| P6      | Open-Ended Project             | ⏳              |
| P7      | Capstone Project               | ⏳              |
| P8      | Portfolio / Production Project | ⏳              |

---

# 1. What Is P5 — Feature-Based Project?

**P5 — Feature-Based Project** focuses the learner on designing, implementing, testing, and integrating **one or more meaningful features** into an existing application or project.

The important shift is:

> **P4 asks the learner to solve a realistic scenario. P5 asks the learner to build a substantial feature that belongs to a larger system.**

The learner is no longer simply building an isolated project.

They are working with:

```text
Existing System
      ↓
Existing Architecture
      ↓
New Feature
      ↓
Integration
      ↓
Testing
      ↓
Regression Verification
```

This is much closer to how professional software development actually works.

---

# 2. P5 Core Mental Model

```text
                     P5
             FEATURE-BASED PROJECT
                      │
                      ▼
               Existing System
                      │
                      ▼
               Feature Request
                      │
                      ▼
             Understand Existing
                 Architecture
                      │
                      ▼
              Define Feature
                      │
                      ▼
                Design Change
                      │
                      ▼
                 Implement
                      │
                      ▼
                Integrate
                      │
                      ▼
             Test New Feature
                      │
                      ▼
             Regression Testing
                      │
                      ▼
                  Review
                      │
                      ▼
                 Submit
```

The word **existing** is central to P5.

---

# 3. Why P5 Exists

In earlier project versions, the learner mostly starts with:

```text
Empty Project
      ↓
Build
```

But professional developers frequently work like this:

```text
Existing Application
      ↓
Business Request
      ↓
Understand Existing Code
      ↓
Modify Existing System
      ↓
Preserve Existing Behavior
      ↓
Ship Feature
```

P5 teaches this skill.

---

# 4. P5 vs P4

This distinction should be kept very clear.

### P4 — Real-World Scenario

The learner receives:

> A company has this problem. Design a solution.

The learner can potentially design the system from the ground up.

### P5 — Feature-Based Project

The learner receives:

> Here is an existing application. Add this feature without breaking the existing system.

The learner must work **inside an existing architecture**.

---

# 5. P5 vs P3

### P3

```text
Project
 ↓
Step 1
 ↓
Step 2
 ↓
Step 3
 ↓
...
```

The system teaches the learner how to construct the application.

### P5

```text
Existing Project
       ↓
Feature Request
       ↓
Learner investigates
       ↓
Learner decides where/how to integrate
```

There is no need for a predefined implementation sequence.

---

# 6. P5 Example

Suppose the existing application is:

> Tutorial Management System

Existing capabilities:

```text
Create Tutorial
Edit Tutorial
View Tutorial
Delete Tutorial
```

New requirement:

> **Add Tutorial Version History.**

The learner must determine how to add:

```text
Version 1
Version 2
Version 3
...
```

without breaking the existing tutorial system.

---

# 7. Existing System

The learner receives an existing codebase.

Conceptually:

```text
tutorial-system/
├── api/
├── services/
├── db/
├── auth/
├── components/
└── tests/
```

The learner must first understand the existing architecture.

That is an important part of P5.

---

# 8. Feature Request

Example:

> **Feature: Tutorial Version History**

### Business requirement

Instructors need to see previous versions of tutorials so they can review changes and restore an earlier version when necessary.

### Functional requirements

```text
View version history
View a specific version
Create a new version
Restore a previous version
```

### Constraints

```text
Existing tutorial URLs must continue working.

Existing published tutorials must remain available.

Existing authentication must be reused.

Existing tests must continue passing.
```

---

# 9. P5 Feature Analysis

Before coding, the learner investigates:

```text
Where is tutorial data stored?
Where is tutorial editing implemented?
How is publishing handled?
Where is authentication checked?
Where are API routes defined?
Where are tests located?
```

This is effectively **codebase navigation**.

---

# 10. P5 Codebase Exploration

The project can provide a workspace:

```text
┌──────────────────────────────────────────────────────┐
│ EXISTING PROJECT                                     │
├──────────────────────────────────────────────────────┤
│ FILES                                                │
│                                                      │
│ apps/                                                │
│ ├── api/                                             │
│ ├── web/                                             │
│ └── admin/                                           │
│                                                      │
│ services/                                            │
│ ├── tutorial-service/                                │
│ └── identity-service/                                │
│                                                      │
│ db/                                                  │
│ tests/                                               │
│                                                      │
│ [ Explore Architecture ]                             │
└──────────────────────────────────────────────────────┘
```

The learner should inspect the system before modifying it.

---

# 11. P5 Architecture Understanding

The learner might discover:

```text
Admin UI
   ↓
Tutorial API
   ↓
Tutorial Service
   ↓
PostgreSQL
```

and:

```text
Admin UI
   ↓
Authentication
   ↓
Authorization
```

Now they know where the new feature belongs.

---

# 12. P5 Feature Boundary

A feature should have a clearly defined boundary.

Example:

### Included

```text
Create version
View version history
View version
Restore version
```

### Not included

```text
Collaborative editing
Real-time editing
Commenting
Approval workflow
```

This prevents scope explosion.

---

# 13. P5 Feature Contract

The feature can be described through:

```text
Feature
├── Purpose
├── User Story
├── Requirements
├── API Changes
├── Data Changes
├── UI Changes
├── Authorization
├── Validation
├── Tests
└── Acceptance Criteria
```

---

# 14. P5 User Story

Example:

> **As an instructor, I want to see previous tutorial versions so that I can review or restore earlier content.**

This gives the learner a clear business reason.

---

# 15. P5 Acceptance Criteria

Example:

```text
✓ Instructor can view version history
✓ Instructor can view a previous version
✓ Instructor can restore a version
✓ Learners continue seeing the published version
✓ Unauthorized users cannot restore versions
✓ Existing tutorial URLs continue working
✓ Existing tutorial functionality remains intact
```

---

# 16. P5 Data Model Change

The learner may determine that the existing:

```text
tutorial
```

table needs a related:

```text
tutorial_versions
```

structure.

For example:

```text
Tutorial
   │
   ├── Version 1
   ├── Version 2
   ├── Version 3
   └── Version 4
```

The exact schema is part of the learner's implementation decision.

---

# 17. P5 API Change

The learner might design:

```text
GET /tutorials/:id/versions
```

```text
GET /tutorials/:id/versions/:versionId
```

```text
POST /tutorials/:id/versions/:versionId/restore
```

The project should evaluate whether these APIs satisfy the requirements rather than requiring these exact paths unless the feature specification explicitly defines them.

---

# 18. P5 Authorization

The feature must respect the existing authorization architecture.

For example:

```text
View versions
    ↓
Authenticated?
    ↓
Instructor/Admin?
    ↓
Allowed
```

Restore is more sensitive:

```text
Restore version
    ↓
Authenticated?
    ↓
Has restore permission?
    ↓
Resource access?
    ↓
Allowed
```

This prevents P5 from becoming merely a UI exercise.

---

# 19. P5 Existing Authorization Must Not Be Bypassed

A common mistake:

```text
New Feature
     ↓
Direct database operation
```

without authorization.

Instead:

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Feature Service
  ↓
Database
```

The feature must integrate into the existing security boundary.

---

# 20. P5 Feature Implementation

The learner determines the implementation changes.

Possible changes:

```text
Database
     +
API
     +
Service
     +
UI
     +
Tests
```

This is a key characteristic of P5.

A feature is not necessarily just one function.

---

# 21. P5 Cross-Layer Feature

Example:

```text
Admin UI
   │
   ▼
Version History API
   │
   ▼
Tutorial Service
   │
   ▼
Tutorial Version Repository
   │
   ▼
PostgreSQL
```

The learner must integrate across layers.

---

# 22. P5 Feature UI

The existing tutorial editor might gain:

```text
┌────────────────────────────────────────────────────┐
│ Tutorial: Python Lists                             │
├────────────────────────────────────────────────────┤
│ Current Version: v4                                │
│                                                    │
│ [ Edit ] [ Publish ] [ Version History ]           │
└────────────────────────────────────────────────────┘
```

Clicking Version History:

```text
┌────────────────────────────────────────────────────┐
│ VERSION HISTORY                                    │
├────────────────────────────────────────────────────┤
│ v4   Current       Aug 21, 2026                    │
│ v3   Published     Aug 20, 2026                    │
│ v2   Draft         Aug 18, 2026                    │
│ v1   Published     Aug 15, 2026                    │
│                                                    │
│ [ View ] [ Restore ]                               │
└────────────────────────────────────────────────────┘
```

---

# 23. P5 Regression Risk

This is one of the defining concepts.

The learner adds:

```text
Version History
```

but must ensure:

```text
Existing Tutorial
       ↓
Still Works
```

This means testing cannot focus only on the new feature.

---

# 24. P5 Regression Testing

Before feature:

```text
Existing Tests
✓ 32 / 32
```

After feature:

```text
Existing Tests
✓ 32 / 32

New Feature Tests
✓ 12 / 12
```

The project should verify both.

---

# 25. P5 Regression Failure

Suppose the new feature accidentally breaks publishing.

The learner sees:

```text
NEW FEATURE
Version History
✓

REGRESSION
Publishing
✗
```

The learner must investigate why.

This is realistic software development.

---

# 26. P5 Feature Integration

The feature should not become a disconnected subsystem.

Bad:

```text
Tutorial System
       │
       └── Version Feature
             │
             └── Separate authorization
```

Better:

```text
Tutorial System
       │
       ├── Existing Authentication
       ├── Existing Authorization
       ├── Existing Tutorial Service
       │
       └── Version Feature
```

The feature extends the existing architecture.

---

# 27. P5 Existing Code Quality

Sometimes the existing codebase may have limitations.

For example:

```text
Tutorial service
 ├── business logic
 ├── validation
 └── database access
```

The learner may discover that adding the feature cleanly requires refactoring.

P5 can allow limited refactoring.

But:

> **Refactoring must support the feature rather than becoming the project itself.**

---

# 28. P5 Feature + Refactoring

Example:

Before:

```text
route
 ↓
database
```

Learner identifies that authorization is duplicated.

They refactor:

```text
route
 ↓
authorization
 ↓
service
 ↓
repository
```

Then add the feature.

This is valuable professional practice.

---

# 29. P5 Scope Control

The project should explicitly define:

```text
Feature Scope
```

Example:

```text
Required:
✓ Version history
✓ Version viewing
✓ Version restoration

Allowed:
✓ Small refactoring required for clean integration

Out of Scope:
✗ Full rewrite
✗ New authentication system
✗ New database technology
✗ Unrelated UI redesign
```

---

# 30. P5 Feature Dependencies

A feature can depend on existing capabilities.

Example:

```text
Existing Authentication
        ↓
Existing Authorization
        ↓
Tutorial Ownership
        ↓
Version Feature
```

The learner must understand those dependencies.

---

# 31. P5 Feature Flags

A realistic feature project may introduce a feature flag:

```text
tutorial_version_history = false
```

Then:

```text
Feature Flag
     │
     ├── OFF → Existing behavior
     │
     └── ON  → Version history
```

This allows safer rollout.

---

# 32. P5 Feature Rollout

A professional-style project may require:

```text
Development
    ↓
Testing
    ↓
Feature Flag
    ↓
Internal Users
    ↓
Small Rollout
    ↓
Full Rollout
```

The learner understands that:

> Building a feature is not the same as safely releasing a feature.

---

# 33. P5 Backward Compatibility

The project may state:

> Existing API clients must continue working.

The learner must preserve:

```text
Existing endpoint
Existing response contract
Existing authentication
```

while adding the new functionality.

---

# 34. P5 API Compatibility

Example:

Existing:

```text
GET /tutorials/:id
```

must continue returning the expected response.

New:

```text
GET /tutorials/:id/versions
```

adds the new capability.

The learner should avoid unnecessarily breaking the existing API.

---

# 35. P5 Database Migration

If a schema change is required:

```text
Existing Database
       ↓
Migration
       ↓
New Schema
       ↓
Existing Data Preserved
```

The learner should consider:

```text
Existing records
Defaults
Nullability
Indexes
Rollback
```

This is more realistic than simply creating a new empty database.

---

# 36. P5 Migration Testing

The learner should test:

```text
Old data
 ↓
Migration
 ↓
New schema
 ↓
Existing application
```

Expected:

```text
Existing tutorials remain accessible.
```

---

# 37. P5 Feature Testing

The learner should create tests around the feature.

Example:

```text
Version history
✓ Returns versions
✓ Correct ordering
✓ Unauthorized access denied
✓ Missing tutorial handled
✓ Missing version handled

Restore
✓ Authorized restore works
✓ Unauthorized restore denied
✓ Correct version becomes current
✓ Published behavior remains correct
```

---

# 38. P5 Integration Testing

The learner should verify:

```text
UI
 ↓
API
 ↓
Service
 ↓
Database
```

The complete feature must work.

---

# 39. P5 Security Testing

Especially important:

```text
Instructor A
    ↓
Tutorial A
    ↓
Allowed

Instructor A
    ↓
Tutorial B
    ↓
Denied
```

And:

```text
Learner
    ↓
Restore Version
    ↓
Denied
```

---

# 40. P5 Performance Testing

If version history grows large:

```text
Tutorial
 ↓
1000 versions
```

The learner must consider:

```text
Pagination
Indexes
Query limits
Payload size
```

A feature should remain usable as its data grows.

---

# 41. P5 Feature Observability

The learner may need to add:

```text
Logs
Metrics
Audit events
```

For example:

```text
tutorial.version.restored
```

with relevant non-sensitive metadata.

This is particularly useful for security-sensitive operations such as restoring or publishing content.

---

# 42. P5 Audit Trail

For a restore operation:

```text
Who?
What?
When?
Which tutorial?
Which version?
```

Example:

```text
Instructor 42
restored tutorial 100
from version 3
at 14:32
```

The exact audit model depends on the architecture.

---

# 43. P5 Feature Acceptance

At the end:

```text
┌──────────────────────────────────────────────┐
│ FEATURE ACCEPTANCE                           │
├──────────────────────────────────────────────┤
│ ✓ Feature works                              │
│ ✓ Existing functionality works              │
│ ✓ Authorization enforced                     │
│ ✓ Tests pass                                 │
│ ✓ Migration verified                         │
│ ✓ Documentation updated                      │
│ ✓ No critical regression                     │
└──────────────────────────────────────────────┘
```

---

# 44. P5 Feature Review

The evaluator can assess:

| Dimension              | Example                                 |
| ---------------------- | --------------------------------------- |
| Feature Correctness    | Does the feature work?                  |
| Integration            | Does it fit the existing system?        |
| Backward Compatibility | Did existing behavior remain intact?    |
| Security               | Are permissions correct?                |
| Testing                | Are feature + regression tests present? |
| Code Quality           | Is the implementation maintainable?     |
| Database Changes       | Are migrations safe?                    |
| Performance            | Is the feature efficient enough?        |
| Observability          | Are important actions visible?          |
| Documentation          | Is the feature documented?              |

---

# 45. P5 Review Feedback

Example:

> The feature works correctly and integrates with the existing tutorial service. However, the version history query currently loads every version at once. Add pagination before production rollout.

This is much more realistic than:

> 8/10.

---

# 46. P5 Feature Quality

The learner should understand:

```text
Feature Quality
=
Correctness
+
Integration
+
Security
+
Testing
+
Maintainability
```

A feature that works but breaks existing behavior is not a successful feature.

---

# 47. P5 Example — Authentication Feature

Existing system:

```text
Username/password login
```

Feature request:

> Add refresh-token based session renewal.

The learner must work with:

```text
Existing Login
       ↓
Token Issuance
       ↓
New Refresh Flow
       ↓
Existing Protected Routes
```

They must preserve current authentication behavior while extending it.

---

# 48. P5 Example — Authorization Feature

Existing system:

```text
RBAC
```

Feature request:

> Add permission-based authorization.

Existing:

```text
Role → Permissions
```

New:

```text
User
 ↓
Role
 ↓
Permissions
 ↓
Resource
 ↓
Action
```

The learner integrates permission checks without duplicating the existing authorization system.

---

# 49. P5 Example — Tutorial Block Feature

Existing Tutorial Engine supports:

```text
Introduction
Objective
Definition
Code
Summary
```

Feature request:

> Add a new `ProjectBlock`.

The learner must integrate:

```text
JSON schema
      ↓
Block registry
      ↓
ProjectBlock renderer
      ↓
Version presentation
      ↓
Accessibility
      ↓
Responsive UI
      ↓
Tests
```

This is an excellent P5 example for the Tutorial Engine.

---

# 50. P5 Example — New ProjectBlock Version

Suppose `ProjectBlock` already supports:

```text
P1
P2
P3
P4
```

Feature request:

> Add **P5 — Feature-Based Project**.

The learner must extend the existing block architecture.

They should not create an entirely separate project engine.

Instead:

```text
ProjectBlock
     │
     ├── P1
     ├── P2
     ├── P3
     ├── P4
     └── P5
```

The existing project infrastructure remains shared.

---

# 51. P5 Example — Quiz Integration

Suppose Tutorial Engine already integrates with the existing assessment engine.

Feature request:

> Add a new scenario-based quiz presentation.

The learner should reuse:

```text
Existing Quiz Engine
```

rather than creating:

```text
TutorialQuizEngine
```

This reinforces the architectural principle:

> **Extend existing capabilities rather than duplicating them.**

---

# 52. P5 Example — Analytics Feature

Existing:

```text
Tutorial progress
```

Feature request:

> Add project completion analytics.

The learner must determine:

```text
Project events
 ↓
Analytics pipeline
 ↓
Aggregations
 ↓
Dashboard
```

Again, this is a feature integrated into an existing platform.

---

# 53. P5 Feature Development Lifecycle

```text
Feature Request
      ↓
Understand Existing System
      ↓
Analyze Requirements
      ↓
Identify Integration Points
      ↓
Design
      ↓
Implement
      ↓
Test
      ↓
Regression Test
      ↓
Review
      ↓
Release
```

This is the defining workflow of P5.

---

# 54. P5 Existing Tests Are Part of the Project

The learner should see:

```text
Before Feature
───────────────
Existing Tests: 86 passing

After Feature
──────────────
Existing Tests: 86 passing
New Tests:      14 passing
```

If:

```text
Existing Tests: 82 passing
```

then the learner has introduced regressions.

---

# 55. P5 Regression as a First-Class Requirement

A P5 project should often contain:

> **Do not break existing functionality.**

This is not optional polish.

It is part of the feature definition.

---

# 56. P5 Feature Documentation

The learner may update:

```text
README
API docs
Architecture docs
Migration docs
Release notes
```

This teaches that software work includes documentation.

---

# 57. P5 Release Notes

Example:

```text
Version 2.4.0

Added:
• Tutorial version history
• Version restore

Security:
• Restore restricted to authorized instructors/admins

Compatibility:
• Existing tutorial APIs remain unchanged
```

This is a small but realistic professional artifact.

---

# 58. P5 Feature Rollback

A more advanced feature project can include:

> What happens if the new feature causes production problems?

The learner may define:

```text
Feature flag OFF
      ↓
Existing behavior restored
```

or:

```text
Rollback migration
```

depending on the scenario.

---

# 59. P5 Feature Completion

A feature should not be considered complete merely because the code compiles.

Completion:

```text
Requirements
     +
Implementation
     +
Integration
     +
Testing
     +
Regression
     +
Documentation
     +
Security
     ↓
Feature Complete
```

---

# 60. P5 UI — Feature Brief

```text
┌──────────────────────────────────────────────────┐
│ FEATURE-BASED PROJECT                            │
│                                                  │
│ Add Tutorial Version History                     │
├──────────────────────────────────────────────────┤
│ EXISTING SYSTEM                                  │
│ Tutorial Management Platform                    │
│                                                  │
│ FEATURE REQUEST                                  │
│ Instructors need to review and restore           │
│ previous tutorial versions.                      │
│                                                  │
│ MUST PRESERVE                                    │
│ ✓ Existing tutorial URLs                         │
│ ✓ Existing authentication                        │
│ ✓ Existing publishing                            │
│                                                  │
│ [ Explore Codebase ]                             │
└──────────────────────────────────────────────────┘
```

---

# 61. P5 UI — Feature Workspace

```text
┌────────────────────────────────────────────────────────┐
│ FEATURE DEVELOPMENT                                    │
├──────────────────────┬─────────────────────────────────┤
│ Existing Codebase    │ Feature                         │
│                      │                                 │
│ tutorial-service/    │ Version History                 │
│ ├── routes           │                                 │
│ ├── services         │ [ Requirements ]                │
│ ├── repository       │ [ Design ]                      │
│ └── tests            │ [ Implementation ]              │
│                      │ [ Tests ]                       │
│                      │ [ Review ]                      │
│                      │                                 │
│                      │ Regression: 86/86 ✓             │
└──────────────────────┴─────────────────────────────────┘
```

---

# 62. P5 Feature Diff

A useful project capability is showing:

```text
Existing
   ↓
Changed
   ↓
New
```

For example:

```text
Modified:
tutorial-service.ts

Added:
tutorial-version-service.ts

Added:
tutorial-version-repository.ts

Added:
tutorial-version.test.ts
```

This helps learners understand the impact of their changes.

---

# 63. P5 Dependency Impact

The system can show:

```text
Feature
 ↓
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

and:

```text
Affected Components
───────────────────
Tutorial API
Tutorial Service
Database
Admin UI
Tests
```

The learner learns to think about **change impact**.

---

# 64. P5 Code Review

The project can include a review stage:

> Review your feature as if you were submitting a pull request.

Checklist:

```text
□ Small, focused changes
□ No unrelated modifications
□ Existing behavior preserved
□ Tests added
□ Security reviewed
□ Errors handled
□ Documentation updated
□ No obvious duplication
```

---

# 65. P5 Pull Request Simulation

The learner can submit:

```text
Feature Branch
      ↓
Pull Request
      ↓
Automated Tests
      ↓
Code Review
      ↓
Changes Requested
      ↓
Update
      ↓
Approval
```

This makes P5 highly relevant to professional development.

---

# 66. P5 Review Comments

Example:

> **Reviewer:** Why is authorization performed only in the UI?

Learner should recognize:

> UI controls visibility, but the backend must enforce authorization.

Another:

> **Reviewer:** Why does this endpoint return all versions?

Learner:

> The current dataset is small, but pagination should be added before large-scale usage.

This develops engineering communication.

---

# 67. P5 Multiple Valid Implementations

Again:

```text
Feature Requirement
        ↓
Possible Designs
   ┌────┴────┐
   ▼         ▼
Design A   Design B
   │         │
   └────┬────┘
        ▼
Evaluation
```

The project should not force one implementation unless a specific architecture is part of the learning objective.

---

# 68. P5 Feature-Based Project and Skill Level

P5 is more advanced because the learner must understand:

```text
Existing code
+
Existing contracts
+
Existing tests
+
Existing architecture
```

before making changes.

This is a major professional skill.

---

# 69. P5 Relationship With P6

P5:

> **Build a defined feature inside an existing system.**

P6:

> **Here is a broad objective. Decide what to build.**

So P6 will increase ambiguity and autonomy.

---

# 70. P5 Progression

```text
P3
Build the project step by step
        ↓
P4
Solve a realistic problem
        ↓
P5
Modify an existing system with a meaningful feature
        ↓
P6
Define the solution more independently
```

The learner increasingly works like a professional developer.

---

# 71. P5 Project Architecture

```text
                         Tutorial Engine
                                │
                                ▼
                          ProjectBlock
                                │
                               P5
                                │
                                ▼
                       Existing Project
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
                 Analyze     Modify      Extend
                    │           │           │
                    └───────────┼───────────┘
                                ▼
                            Feature
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
           Database            API                UI
              │                 │                 │
              └─────────────────┼─────────────────┘
                                ▼
                             Testing
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
                Feature Tests        Regression Tests
                     │                     │
                     └──────────┬──────────┘
                                ▼
                             Review
                                │
                                ▼
                             Submit
```

---

# 72. P5 JSON

The Tutorial Engine should reference the feature project:

```json
{
  "type": "project",
  "version": "P5",
  "projectId": "tutorial-version-history-feature-001"
}
```

Optional presentation:

```json
{
  "type": "project",
  "version": "P5",
  "projectId": "tutorial-version-history-feature-001",
  "presentation": {
    "showExistingSystem": true,
    "showFeatureRequest": true,
    "showRequirements": true,
    "showAffectedComponents": true,
    "showArchitecture": true,
    "showRegressionStatus": true,
    "showCodeReview": true,
    "allowRevision": true,
    "showEvaluation": true
  }
}
```

Again, the Tutorial Engine is responsible for **presenting/orchestrating** the project.

The existing project, feature specification, repository, execution environment, tests, submission, and evaluation belong to the appropriate project/assessment infrastructure.

---

# 73. P5 Technical Specification

| Area                                  | P5 Decision                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| **Block**                             | **ProjectBlock**                                                 |
| **Version**                           | **P5**                                                           |
| **Presentation**                      | **Feature-Based Project**                                        |
| **Primary purpose**                   | Build and integrate a meaningful feature into an existing system |
| **Existing system**                   | ✅ Required                                                       |
| **Feature request**                   | ✅                                                                |
| **Requirements**                      | ✅                                                                |
| **Feature scope**                     | ✅                                                                |
| **Architecture analysis**             | ✅                                                                |
| **Change impact analysis**            | ✅                                                                |
| **Implementation**                    | ✅                                                                |
| **Integration**                       | ✅                                                                |
| **Feature tests**                     | ✅                                                                |
| **Regression tests**                  | **Core requirement**                                             |
| **Security review**                   | As applicable                                                    |
| **Database migration**                | As applicable                                                    |
| **API compatibility**                 | As applicable                                                    |
| **Refactoring**                       | Limited / feature-related                                        |
| **Code review**                       | Recommended                                                      |
| **Release / rollout**                 | Optional                                                         |
| **Feature flags**                     | Optional                                                         |
| **Documentation**                     | Recommended                                                      |
| **Fixed implementation sequence**     | ❌                                                                |
| **Multiple valid solutions**          | ✅                                                                |
| **Learner autonomy**                  | High                                                             |
| **Existing architecture constraints** | **Core characteristic**                                          |
| **Submission**                        | ✅                                                                |
| **Evaluation**                        | ✅                                                                |
| **Revision**                          | ✅                                                                |
| **Local project engine**              | ❌                                                                |
| **Local scoring authority**           | ❌                                                                |
| **Project ownership**                 | Project/Assessment layer                                         |
| **Tutorial ownership**                | Presentation/orchestration                                       |
| **JSON-driven**                       | ✅                                                                |
| **Authentication**                    | Existing platform auth                                           |
| **Authorization**                     | Existing platform authorization                                  |
| **Accessibility**                     | ✅                                                                |
| **Keyboard navigation**               | ✅                                                                |
| **Responsive**                        | ✅                                                                |
| **Light theme**                       | ✅                                                                |
| **Primary**                           | **#F54A8D**                                                      |
| **Secondary**                         | **#0B1B3D**                                                      |
| **Gradient**                          | ❌                                                                |
| **Dark overall theme**                | ❌                                                                |

---

# 74. P5 Final Mental Model

```text
                         P5
                FEATURE-BASED PROJECT
                         │
                         ▼
                   EXISTING SYSTEM
                         │
                         ▼
                   FEATURE REQUEST
                         │
                         ▼
                 UNDERSTAND CODEBASE
                         │
                         ▼
                 ANALYZE CHANGE IMPACT
                         │
                         ▼
                    DESIGN FEATURE
                         │
                         ▼
                    IMPLEMENT
                         │
                         ▼
                    INTEGRATE
                         │
                 ┌───────┴────────┐
                 ▼                ▼
          FEATURE TESTS     REGRESSION TESTS
                 │                │
                 └───────┬────────┘
                         ▼
                    CODE REVIEW
                         │
                         ▼
                      SUBMIT
                         │
                         ▼
                     EVALUATE
                         │
                         ▼
                      RELEASE
```

### The essential definition

> **P5 — Feature-Based Project is a project experience in which the learner works within an existing application or architecture, analyzes a defined feature request, identifies the affected components, designs and implements the feature, integrates it with existing capabilities, preserves backward compatibility, runs feature and regression tests, and reviews the resulting change as a professional software-development contribution.**

The defining shift is:

```text
P4
"Here is a real-world problem.
Design a solution."

        ↓

P5
"Here is an existing system.
Add this feature without breaking it."
```

## **P5 — Feature-Based Project: COMPLETE** ✅

Next:

> **P6 — Open-Ended Project**



```python

```

# BLOCK 18 — ProjectBlock

## P7 — Capstone Project

Yes. We continue with **only P7**, one version at a time.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| P1      | Mini Project                   | ✅ Complete     |
| P2      | Guided Project                 | ✅ Complete     |
| P3      | Step-by-Step Project           | ✅ Complete     |
| P4      | Real-World Scenario            | ✅ Complete     |
| P5      | Feature-Based Project          | ✅ Complete     |
| P6      | Open-Ended Project             | ✅ Complete     |
| **P7**  | **Capstone Project**           | 🔵 **CURRENT** |
| P8      | Portfolio / Production Project | ⏳              |

---

# 1. What Is P7 — Capstone Project?

**P7 — Capstone Project** is a **large, comprehensive project that requires the learner to integrate multiple concepts, skills, techniques, and architectural decisions learned throughout a course, module, or learning path into one substantial solution.**

The central idea is:

> **P6 asks, "Can you independently build a solution?" P7 asks, "Can you integrate everything you have learned into one substantial system?"**

The progression is now:

```text id="g9q4n8"
P1
Mini Project
    ↓
P2
Guided Project
    ↓
P3
Step-by-Step Project
    ↓
P4
Real-World Scenario
    ↓
P5
Feature-Based Project
    ↓
P6
Open-Ended Project
    ↓
P7
Capstone Project
    ↓
P8
Portfolio / Production Project
```

P7 is therefore **not simply a bigger P6**.

Its defining characteristic is:

> **Integration of accumulated learning.**

---

# 2. P7 Core Mental Model

```text id="2ij6d4"
                         P7
                  CAPSTONE PROJECT
                         │
                         ▼
              Learning Objectives
                         │
                         ▼
              Multiple Competencies
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Concept A   Concept B   Concept C
             │           │           │
             └───────────┼───────────┘
                         ▼
                  System Design
                         │
                         ▼
                   Implementation
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Feature A   Feature B   Feature C
              │          │          │
              └──────────┼──────────┘
                         ▼
                    Integration
                         │
                         ▼
                     Testing
                         │
                         ▼
                   Evaluation
                         │
                         ▼
                    Final Review
```

The learner demonstrates that previously isolated concepts can work together.

---

# 3. Why P7 Exists

A learner may successfully complete individual projects:

```text id="5g7w3n"
Project A
Python OOP

Project B
Exception Handling

Project C
Database

Project D
Authentication

Project E
API
```

But real systems require:

```text id="4m8b2w"
OOP
 +
Exceptions
 +
Database
 +
API
 +
Authentication
 +
Authorization
 +
Testing
 +
Architecture
```

working together.

P7 tests this integration capability.

---

# 4. P7 vs P6

This distinction is extremely important.

### P6 — Open-Ended

The learner receives:

> Build something useful.

The learner defines:

```text id="yqj0j9"
Problem
Scope
MVP
Features
Architecture
Technology
```

The main learning objective is **independence**.

### P7 — Capstone

The learner receives:

> Build a substantial system that demonstrates the competencies covered throughout the learning path.

The project intentionally requires multiple competencies.

The main learning objective is **integration and mastery**.

---

# 5. P7 vs P5

P5:

> Add a defined feature to an existing system.

P7:

> Build or evolve a substantial system containing multiple interconnected capabilities.

P5 focuses on:

```text id="n8gq5a"
Feature Integration
```

P7 focuses on:

```text id="2g8x0h"
Competency Integration
```

---

# 6. P7 vs P8

This distinction should remain locked.

### P7 — Capstone

Primary question:

> **Have you mastered and integrated what you learned?**

### P8 — Portfolio / Production Project

Primary question:

> **Can you build something that is suitable to demonstrate or operate as a professional product?**

Therefore:

```text id="h0m6jw"
P7
Learning mastery
        ↓
P8
Professional artifact
```

P7 is educationally focused.

P8 is professionally focused.

---

# 7. P7 Scope

A Capstone should be substantial enough to require multiple competencies.

For example, a Python backend capstone might require:

```text id="vps6gk"
Python fundamentals
OOP
Exception handling
Collections
File handling
Database interaction
API development
Authentication
Authorization
Testing
Logging
```

Not every course needs every item.

The Capstone should map directly to the curriculum.

---

# 8. P7 Competency Map

A Capstone should explicitly identify which learning objectives it evaluates.

Example:

| Competency         | Required? | Evidence             |
| ------------------ | --------: | -------------------- |
| OOP                |         ✅ | Domain model         |
| Exception Handling |         ✅ | Error handling       |
| Collections        |         ✅ | Data processing      |
| Database           |         ✅ | Persistence          |
| API                |         ✅ | REST endpoints       |
| Authentication     |         ✅ | Login                |
| Authorization      |         ✅ | Protected operations |
| Testing            |         ✅ | Automated tests      |
| Logging            |  Optional | Observability        |

This makes the Capstone measurable.

---

# 9. P7 Example — Full Learning Path

Suppose the learner has completed:

```text id="fr9y08"
Python
 ↓
OOP
 ↓
Collections
 ↓
Exception Handling
 ↓
File Handling
 ↓
Database
 ↓
REST API
 ↓
Authentication
 ↓
Authorization
 ↓
Testing
```

The Capstone might be:

> **Build a Learning Management API.**

The project integrates the concepts.

---

# 10. P7 Capstone Example

The learner builds:

> **Learning Management Platform**

Core capabilities:

```text id="4x5g7g"
Users
Courses
Tutorials
Progress
Assessments
Authentication
Authorization
Analytics
```

Architecture:

```text id="9rzzll"
Client
  ↓
API
  ↓
Authentication
  ↓
Authorization
  ↓
Services
  ├── User
  ├── Course
  ├── Tutorial
  ├── Progress
  └── Assessment
  ↓
Database
```

Now many previously isolated concepts interact.

---

# 11. P7 Capstone Brief

```text id="r7j9xu"
┌──────────────────────────────────────────────────┐
│ CAPSTONE PROJECT                                 │
│                                                  │
│ Learning Management Platform                    │
│                                                  │
│ Build a complete learning platform that allows  │
│ users to authenticate, access courses, consume   │
│ tutorials, track progress, and complete         │
│ assessments.                                     │
│                                                  │
│ The project must demonstrate the competencies    │
│ covered throughout the learning path.            │
│                                                  │
│ [ Start Capstone ]                              │
└──────────────────────────────────────────────────┘
```

---

# 12. P7 Capstone Requirements

The requirements should span multiple competencies.

Example:

### Identity

```text id="v7t5z4"
User registration
Login
Session/token handling
```

### Authorization

```text id="9m5r0s"
Role-based access
Resource access
```

### Learning

```text id="d8my3u"
Courses
Tutorials
Progress
```

### Assessment

```text id="h8o5uc"
Questions
Attempts
Results
```

### Reliability

```text id="0tj5jp"
Validation
Exception handling
Error responses
```

### Quality

```text id="7r3w2a"
Tests
Logging
Documentation
```

---

# 13. P7 Architecture Requirement

A Capstone should require the learner to create an architecture.

Example:

```text id="bj8v6e"
                    Client
                      │
                      ▼
                API Gateway
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      Identity     Tutorial    Assessment
       Service      Service      Service
          │           │           │
          └───────────┼───────────┘
                      ▼
                   Database
```

The learner should explain why the architecture is appropriate.

---

# 14. P7 Module Integration

Each module should connect to another.

Example:

```text id="m70sag"
Authentication
      ↓
Authorization
      ↓
Tutorial Access
      ↓
Progress Tracking
      ↓
Assessment
      ↓
Results
      ↓
Analytics
```

This creates a true system rather than several unrelated features.

---

# 15. P7 Competency Dependency

For example:

```text id="wykqv8"
Authentication
       ↓
Authorization
       ↓
Protected API
       ↓
Tutorial Access
       ↓
Progress
       ↓
Assessment
       ↓
Analytics
```

The learner must understand how the components interact.

---

# 16. P7 Domain Model

A possible domain model:

```text id="j0x7o4"
User
 │
 ├── Role
 │
 └── Enrollment
        │
        ▼
      Course
        │
        ├── Tutorial
        │
        └── Assessment
                │
                ▼
             Attempt
                │
                ▼
              Result
```

The learner integrates domain modeling with implementation.

---

# 17. P7 Authentication

The Capstone may require:

```text id="f6y0yb"
Registration
    ↓
Login
    ↓
Credential verification
    ↓
Session / token
    ↓
Authenticated request
```

The learner should demonstrate secure handling.

The project should use the platform's established authentication architecture where applicable rather than inventing a second identity system.

---

# 18. P7 Authorization

Example:

```text id="z8t6pj"
Learner
 ├── View courses
 ├── Access tutorials
 └── Submit assessments

Instructor
 ├── Create tutorials
 ├── Edit tutorials
 └── Manage assessments

Admin
 ├── Manage users
 ├── Manage courses
 └── Platform administration
```

The learner must enforce these boundaries server-side.

---

# 19. P7 Exception Handling

The Capstone can require explicit failure handling.

Example:

```text id="q5n3bg"
Invalid input
     ↓
ValidationError

Missing resource
     ↓
NotFoundError

Unauthorized action
     ↓
AuthorizationError

Database failure
     ↓
Infrastructure error
```

The learner should demonstrate structured exception handling rather than scattered ad-hoc error handling.

---

# 20. P7 OOP Integration

If OOP was part of the curriculum, the learner can demonstrate:

```text id="n0q6se"
Domain Classes
Service Classes
Repository Classes
Custom Exceptions
```

For example:

```text id="g2ps1e"
Course
Tutorial
Assessment
Attempt
```

The evaluation should focus on appropriate use of OOP rather than requiring classes everywhere.

---

# 21. P7 Database Integration

The learner must demonstrate:

```text id="2p74xh"
Schema Design
Relationships
Constraints
Indexes
Queries
Transactions
Migrations
```

Again, only those appropriate to the course should be required.

---

# 22. P7 API Integration

The Capstone should expose meaningful operations.

Example:

```text id="9p0y5u"
POST   /auth/login

GET    /courses

GET    /courses/:id

GET    /tutorials/:id

POST   /progress

POST   /assessments/:id/attempts

GET    /results
```

The exact endpoints can vary.

---

# 23. P7 Assessment Integration

Since your platform already has an assessment architecture, the Capstone should **reuse it**.

Conceptually:

```text id="3x7eap"
Tutorial
   ↓
Assessment Reference
   ↓
Existing Assessment Engine
   ↓
Attempt
   ↓
Result
```

Do not create a separate assessment engine inside ProjectBlock.

---

# 24. P7 Analytics Integration

A Capstone can consume assessment/progress results:

```text id="02xt1b"
Tutorial Progress
      +
Assessment Results
      ↓
Learner Analytics
```

Possible metrics:

```text id="o1j1t7"
Completion
Accuracy
Mastery
Weak Topics
Attempt History
```

The learner demonstrates integration across modules.

---

# 25. P7 Testing Strategy

A Capstone should require comprehensive testing.

```text id="kccs7e"
Unit Tests
     +
Integration Tests
     +
API Tests
     +
Authorization Tests
     +
Error Tests
     +
End-to-End Tests
```

Not every test type is mandatory for every Capstone, but the learner should justify the selected strategy.

---

# 26. P7 Test Pyramid

```text id="1i4g6d"
              E2E
             /   \
          API / Integration
          /           \
       Unit           Unit
```

The goal is meaningful coverage, not merely a large test count.

---

# 27. P7 Security Testing

A Capstone involving authentication should include:

```text id="6b6fgo"
✓ Valid authentication
✓ Invalid credentials
✓ Missing credentials
✓ Expired credentials
✓ Wrong role
✓ Resource access violation
✓ Input validation
```

For example:

```text id="u4f0hc"
Learner
   ↓
Admin endpoint
   ↓
403
```

---

# 28. P7 Integration Testing

A complete workflow might be:

```text id="x0p0az"
Register
  ↓
Login
  ↓
Access Course
  ↓
Open Tutorial
  ↓
Record Progress
  ↓
Take Assessment
  ↓
Store Result
  ↓
View Analytics
```

This is a true Capstone workflow.

---

# 29. P7 End-to-End Scenario

Example:

> A learner registers, logs in, enrolls in a course, completes a tutorial, takes its assessment, and views the resulting progress.

The system validates the entire flow.

```text id="a3x6gp"
Registration ✓
Login ✓
Enrollment ✓
Tutorial ✓
Progress ✓
Assessment ✓
Result ✓
Analytics ✓
```

---

# 30. P7 Cross-Module Failure

The Capstone should also test failure propagation.

Example:

```text id="v5r3um"
Assessment submission
        ↓
Database unavailable
        ↓
Service error
        ↓
API error response
        ↓
Client receives controlled failure
        ↓
Error logged
```

This demonstrates integrated exception handling.

---

# 31. P7 Data Consistency

Suppose an assessment is submitted.

The system needs to:

```text id="y7f6xk"
Store attempt
     +
Calculate/store result
     +
Update progress
```

The learner must consider whether these operations should be coordinated transactionally.

This is a real system-level problem.

---

# 32. P7 Capstone Milestones

Unlike P3, milestones should represent **major system capabilities** rather than every implementation step.

Example:

```text id="2k9r7a"
M1 — Architecture
M2 — Identity
M3 — Core Domain
M4 — Tutorial System
M5 — Assessment Integration
M6 — Progress & Analytics
M7 — Security
M8 — Testing
M9 — Final Integration
M10 — Final Review
```

---

# 33. P7 Milestone Model

```text id="k5p4xy"
Architecture
     ↓
Identity
     ↓
Core Domain
     ↓
Learning
     ↓
Assessment
     ↓
Analytics
     ↓
Security
     ↓
Testing
     ↓
Integration
```

These milestones help manage a large project without turning it into P3.

---

# 34. P7 Scope Control

A Capstone must be large enough to demonstrate mastery but still finishable.

Therefore:

```text id="6c7ux4"
Required Competencies
        ↓
Required Features
        ↓
MVP
        ↓
Optional Enhancements
```

The learner should not be rewarded simply for making the project enormous.

---

# 35. P7 Required vs Optional

Example:

### Required

```text id="6k5zj3"
Authentication
Authorization
Tutorials
Progress
Assessment
Testing
```

### Optional

```text id="4a3j68"
Notifications
Advanced analytics
Caching
Search
Recommendations
```

This prevents scope from overwhelming the learner.

---

# 36. P7 Mastery Mapping

The final evaluation should show:

```text id="2n2tjq"
Python
██████████

OOP
████████░░

Exception Handling
██████████

Database
█████████░

API
██████████

Authentication
████████░░

Authorization
██████████

Testing
████████░░
```

The exact visualization can be adapted to your analytics system.

---

# 37. P7 Competency Evidence

Each competency should have evidence.

Example:

```text id="xv1f4n"
Exception Handling
      ↓
Custom Exceptions
      ↓
Service Error Handling
      ↓
Integration Tests
```

Therefore the Capstone does not simply say:

> "You completed Exception Handling."

It demonstrates **where the skill was used**.

---

# 38. P7 Evidence Matrix

| Competency         | Evidence                    |
| ------------------ | --------------------------- |
| OOP                | Domain/service design       |
| Exception Handling | Error model                 |
| Database           | Schema + queries            |
| API                | Endpoints                   |
| Authentication     | Login flow                  |
| Authorization      | Protected operations        |
| Testing            | Automated tests             |
| Architecture       | System design               |
| Debugging          | Resolved integration issues |

This is highly useful for learning analytics.

---

# 39. P7 Failure and Recovery

A Capstone should not assume everything works on the first attempt.

Example:

```text id="yibdcz"
Integration Test
      ↓
FAIL
      ↓
Identify root cause
      ↓
Fix
      ↓
Retest
      ↓
PASS
```

The learner's recovery process itself can be part of the learning evidence.

---

# 40. P7 Code Review

The learner can perform a final review:

```text id="q2ppgy"
Architecture
□ Clear boundaries

Security
□ Authorization enforced server-side

Errors
□ Consistent handling

Database
□ Appropriate constraints

Tests
□ Critical flows covered

Code
□ Maintainable

Documentation
□ Complete
```

---

# 41. P7 Final Demo

The learner demonstrates:

```text id="xexh9n"
1. Problem
2. Architecture
3. Authentication
4. Core workflow
5. Tutorial workflow
6. Assessment workflow
7. Analytics
8. Error handling
9. Security
10. Testing
```

The demonstration should show the system working as an integrated whole.

---

# 42. P7 Technical Defense

After the demo, the learner can answer questions such as:

> Why did you separate authentication from authorization?

> Why did you use a transaction here?

> What happens when the database fails?

> How do you prevent a learner from accessing another learner's progress?

> Why did you choose this database structure?

> What would you change if traffic increased tenfold?

This connects naturally to InterviewBlock.

---

# 43. P7 → InterviewBlock

```text id="3r7yvi"
Capstone
   ↓
Architecture
   ↓
Interview Question
   ↓
"Why did you choose this design?"
   ↓
Scenario Question
   ↓
"What happens if the database fails?"
```

The Capstone becomes evidence for technical interviews.

---

# 44. P7 → QuestionBlock

The learner can be asked:

> What would happen if progress was updated successfully but assessment result storage failed?

This is a QuestionBlock applied to the learner's own system.

---

# 45. P7 → ExerciseBlock

If the learner identifies a weak skill:

```text id="f7j3x9"
Capstone
   ↓
Weak Testing
   ↓
ExerciseBlock
   ↓
Testing Exercise
   ↓
Improve Capstone
```

The blocks form a learning loop.

---

# 46. P7 → SummaryBlock

At the end:

```text id="o4h2m1"
S6
Complete Revision
```

can summarize:

```text
Architecture
Authentication
Authorization
Database
API
Testing
Exception Handling
```

---

# 47. P7 Final Evaluation

Capstone evaluation should be multidimensional.

| Dimension           | Weight Example |
| ------------------- | -------------: |
| Competency Coverage |            20% |
| Architecture        |            15% |
| Correctness         |            15% |
| Integration         |            15% |
| Security            |            10% |
| Testing             |            10% |
| Code Quality        |             5% |
| Documentation       |             5% |
| Technical Defense   |             5% |

The exact weighting should be configurable per Capstone.

---

# 48. P7 Competency Coverage Is Different From Feature Count

A learner should not gain a high score simply by creating 30 features.

For example:

```text id="xwwu4g"
30 superficial features
```

is not necessarily better than:

```text id="kqlx1b"
8 well-integrated features
```

The Capstone evaluates **depth and integration**.

---

# 49. P7 Quality Gate

A project may have mandatory gates:

```text id="d88j0b"
Security Gate
✓

Critical Test Gate
✓

Required Competencies
✓

Integration Gate
✓

Submission
✓
```

If a critical security requirement fails, the project should not receive a "complete" status merely because the overall score is high.

---

# 50. P7 Capstone Review

Example:

```text id="3u2z5s"
CAPSTONE REVIEW

Strengths
─────────
✓ Strong architecture
✓ Good authorization boundaries
✓ Comprehensive exception handling
✓ Good integration testing

Needs Improvement
──────────────────
⚠ Limited observability
⚠ Some duplicated validation
⚠ Analytics queries need optimization

Overall
───────
Strong Capstone
```

---

# 51. P7 Revision Cycle

```text id="iz3z7c"
Submission
    ↓
Evaluation
    ↓
Feedback
    ↓
Revision
    ↓
Retest
    ↓
Final Evaluation
```

The learner should be able to improve rather than receiving only a final score.

---

# 52. P7 Final Submission

A complete Capstone may contain:

```text id="9h6b8j"
Source Code
Architecture Diagram
Database Schema
API Documentation
Tests
README
Decision Log
Security Review
Demo
Technical Defense
```

The exact deliverables depend on the learning path.

---

# 53. P7 Completion Criteria

A Capstone is complete when:

```text id="j7w2nv"
Required competencies demonstrated
          +
Required features implemented
          +
Critical workflows working
          +
Security requirements satisfied
          +
Tests passing
          +
Integration verified
          +
Final submission completed
```

---

# 54. P7 Portfolio Readiness vs P8

A Capstone may be excellent but still not be a production artifact.

For example:

```text id="2d4d5k"
P7
Educational Capstone
```

may have:

```text
limited deployment
simplified infrastructure
educational constraints
```

That is acceptable.

P8 will focus on:

```text
production readiness
deployment
operability
portfolio presentation
```

---

# 55. P7 Learning Outcome

After completing P7, the learner should be able to:

```text id="zj5j0q"
Integrate multiple technical concepts
Design a larger system
Manage dependencies
Apply security principles
Handle failures
Write meaningful tests
Make architectural decisions
Explain trade-offs
Debug integration problems
Communicate technical decisions
Demonstrate overall competency
```

---

# 56. P7 Capstone Workspace

```text id="2t2h2q"
┌─────────────────────────────────────────────────────────┐
│ CAPSTONE PROJECT                                       │
│ Learning Management Platform                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ COMPETENCIES                                           │
│ ✓ Python                                               │
│ ✓ OOP                                                  │
│ ✓ Exception Handling                                   │
│ ✓ Database                                             │
│ ✓ API                                                  │
│ ✓ Authentication                                       │
│ ✓ Authorization                                        │
│ ✓ Testing                                              │
│                                                         │
│ MILESTONES                                             │
│ ✓ Architecture                                         │
│ ✓ Identity                                             │
│ ✓ Core Domain                                          │
│ → Learning                                             │
│ ○ Assessment                                           │
│ ○ Analytics                                            │
│ ○ Final Integration                                    │
│                                                         │
│ Progress: ███████████░░░░ 72%                          │
│                                                         │
│ [ Open Capstone ]                                      │
└─────────────────────────────────────────────────────────┘
```

---

# 57. P7 Architecture

```text id="3ov2j5"
                         Tutorial Engine
                                │
                                ▼
                          ProjectBlock
                                │
                               P7
                                │
                                ▼
                         Capstone Definition
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        Competencies        Requirements       Milestones
              │                 │                 │
              └─────────────────┼─────────────────┘
                                ▼
                         Learner Project
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
          Application        Tests             Evidence
              │                 │                 │
              └─────────────────┼─────────────────┘
                                ▼
                         Final Evaluation
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
          Competency         Quality          Technical
           Evaluation        Evaluation        Defense
                                │
                                ▼
                           Final Result
```

---

# 58. P7 JSON

Tutorial Engine reference:

```json id="c5e7y2"
{
  "type": "project",
  "version": "P7",
  "projectId": "learning-platform-capstone-001"
}
```

Optional presentation:

```json id="3r1l9a"
{
  "type": "project",
  "version": "P7",
  "projectId": "learning-platform-capstone-001",
  "presentation": {
    "showCompetencyMap": true,
    "showRequirements": true,
    "showArchitecture": true,
    "showMilestones": true,
    "showProgress": true,
    "showEvidence": true,
    "showTesting": true,
    "showTechnicalDefense": true,
    "showEvaluation": true,
    "allowRevision": true
  }
}
```

The **Capstone definition, competency mapping, project execution, testing, submission, scoring, and evaluation** remain part of the appropriate project/assessment architecture.

ProjectBlock is the presentation and orchestration layer.

---

# 59. P7 Technical Specification

| Area                              | P7 Decision                                                 |
| --------------------------------- | ----------------------------------------------------------- |
| **Block**                         | **ProjectBlock**                                            |
| **Version**                       | **P7**                                                      |
| **Presentation**                  | **Capstone Project**                                        |
| **Primary purpose**               | Demonstrate integrated mastery across multiple competencies |
| **Project scale**                 | Large / comprehensive                                       |
| **Competency mapping**            | **Core**                                                    |
| **Multiple learning objectives**  | **Core**                                                    |
| **Feature integration**           | **Core**                                                    |
| **Architecture**                  | ✅                                                           |
| **Authentication**                | As applicable                                               |
| **Authorization**                 | As applicable                                               |
| **Database**                      | As applicable                                               |
| **API**                           | As applicable                                               |
| **Exception handling**            | As applicable                                               |
| **Testing**                       | **Core**                                                    |
| **Integration testing**           | **Core**                                                    |
| **Security testing**              | As applicable                                               |
| **End-to-end workflow**           | Recommended                                                 |
| **Milestones**                    | ✅                                                           |
| **Evidence collection**           | **Core**                                                    |
| **Technical defense**             | Recommended                                                 |
| **Code review**                   | Recommended                                                 |
| **Decision log**                  | Recommended                                                 |
| **Documentation**                 | ✅                                                           |
| **Fixed implementation sequence** | ❌                                                           |
| **Learner autonomy**              | High                                                        |
| **Multiple valid solutions**      | ✅                                                           |
| **Competency coverage**           | **Required**                                                |
| **MVP**                           | Recommended                                                 |
| **Optional enhancements**         | ✅                                                           |
| **Submission**                    | ✅                                                           |
| **Evaluation**                    | **Comprehensive**                                           |
| **Revision**                      | ✅                                                           |
| **Mastery evidence**              | ✅                                                           |
| **Local project engine**          | ❌                                                           |
| **Local scoring authority**       | ❌                                                           |
| **Project ownership**             | Project/Assessment layer                                    |
| **Tutorial ownership**            | Presentation/orchestration                                  |
| **Assessment integration**        | Existing assessment architecture                            |
| **JSON-driven**                   | ✅                                                           |
| **Authentication**                | Existing platform auth                                      |
| **Authorization**                 | Existing platform authorization                             |
| **Accessibility**                 | ✅                                                           |
| **Keyboard navigation**           | ✅                                                           |
| **Responsive**                    | ✅                                                           |
| **Light theme**                   | ✅                                                           |
| **Primary**                       | **#F54A8D**                                                 |
| **Secondary**                     | **#0B1B3D**                                                 |
| **Gradient**                      | ❌                                                           |
| **Dark overall theme**            | ❌                                                           |

---

# 60. P7 Final Mental Model

```text id="kqz9r6"
                         P7
                  CAPSTONE PROJECT
                         │
                         ▼
               LEARNING OBJECTIVES
                         │
                         ▼
                  COMPETENCY MAP
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Concept A   Concept B   Concept C
              │          │          │
              └──────────┼──────────┘
                         ▼
                  LARGE SYSTEM
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Feature A   Feature B   Feature C
             │           │           │
             └───────────┼───────────┘
                         ▼
                    INTEGRATION
                         │
                         ▼
                      TESTING
                         │
                         ▼
                  EVIDENCE / DEMO
                         │
                         ▼
                 TECHNICAL DEFENSE
                         │
                         ▼
                     EVALUATE
                         │
                         ▼
                      REVISE
                         │
                         ▼
                  MASTERY RESULT
```

### The essential definition

> **P7 — Capstone Project is a comprehensive project experience in which the learner integrates multiple competencies acquired throughout the learning path into one substantial system, independently designing and implementing interconnected capabilities, validating critical workflows, demonstrating security and quality where applicable, providing evidence for each required competency, defending important technical decisions, and undergoing comprehensive evaluation for overall mastery.**

The defining shift is:

```text id="k44zj3"
P6
"Here is a broad objective.
Define and build the solution."

        ↓

P7
"Demonstrate that you can integrate
everything you have learned into
one substantial system."
```

## **P7 — Capstone Project: COMPLETE** ✅

Next:

> **P8 — Portfolio / Production Project**



```python

```

# BLOCK 18 — ProjectBlock

## P8 — Portfolio / Production Project

Yes. This is the **final version of ProjectBlock**, and I will keep it separate from the previous versions.

| Version | Presentation                       | Status         |
| ------- | ---------------------------------- | -------------- |
| P1      | Mini Project                       | ✅ Complete     |
| P2      | Guided Project                     | ✅ Complete     |
| P3      | Step-by-Step Project               | ✅ Complete     |
| P4      | Real-World Scenario                | ✅ Complete     |
| P5      | Feature-Based Project              | ✅ Complete     |
| P6      | Open-Ended Project                 | ✅ Complete     |
| P7      | Capstone Project                   | ✅ Complete     |
| **P8**  | **Portfolio / Production Project** | 🔵 **CURRENT** |

---

# 1. What Is P8 — Portfolio / Production Project?

**P8 — Portfolio / Production Project** is the highest ProjectBlock presentation.

It takes the learner beyond:

> "I completed a project."

and moves toward:

> **"I built, documented, deployed, secured, tested, and presented a professional-quality software product that I can demonstrate as evidence of my engineering ability."**

The key distinction is:

```text
P7
Capstone
    ↓
Demonstrate mastery

P8
Portfolio / Production
    ↓
Demonstrate professional readiness
```

---

# 2. P8 Core Mental Model

```text
                         P8
              PORTFOLIO / PRODUCTION
                         │
                         ▼
                  Product Idea
                         │
                         ▼
                  Target Audience
                         │
                         ▼
                  Product Definition
                         │
                         ▼
                       MVP
                         │
                         ▼
                 Architecture Design
                         │
                         ▼
                  Implementation
                         │
                         ▼
            ┌────────────┼────────────┐
            ▼            ▼            ▼
         Security      Testing     Observability
            │            │            │
            └────────────┼────────────┘
                         ▼
                    Deployment
                         │
                         ▼
                 Production Validation
                         │
                         ▼
                  Documentation
                         │
                         ▼
                 Portfolio Presentation
                         │
                         ▼
                    Final Review
```

P8 combines **technical implementation + production readiness + professional presentation**.

---

# 3. Why P8 Exists

A learner may have completed:

```text
P1 → P7
```

and still have nothing meaningful to show a recruiter, interviewer, client, or employer.

P8 solves that gap.

The learner produces an artifact that can demonstrate:

```text
Technical Skill
Architecture
Problem Solving
Engineering Quality
Security
Testing
Deployment
Documentation
Communication
```

---

# 4. P8 vs P7

This distinction must remain very clear.

### P7 — Capstone

Primary question:

> **Can you integrate everything you learned?**

Evaluation focuses on:

```text
Competency
Integration
Correctness
Architecture
Testing
Technical defense
```

### P8 — Portfolio / Production

Primary question:

> **Can you turn your engineering knowledge into a professional-quality product or production-like system?**

Evaluation expands to:

```text
Product quality
Production readiness
Deployment
Security
Reliability
Observability
Documentation
UX
Portfolio presentation
```

Therefore:

```text
P7
Learning Mastery

        ↓

P8
Professional Readiness
```

---

# 5. P8 Does Not Necessarily Mean a Commercial Product

"Production Project" does **not** mean the learner must launch a business.

It means the system should be treated with production-level engineering discipline.

For example:

```text
Portfolio Project
    +
Production-quality engineering
```

can be sufficient.

The learner may build:

```text
Learning Platform
Developer Tool
Analytics Dashboard
Authentication Platform
Tutorial Engine
Quiz Platform
SaaS Application
```

The project does not need millions of users.

---

# 6. P8 Portfolio vs Production

P8 contains two closely related outcomes.

### Portfolio

The project should be:

```text
Demonstrable
Documented
Presentable
Understandable
```

### Production

The project should be:

```text
Secure
Tested
Deployable
Observable
Maintainable
Reliable
```

A strong P8 combines both.

---

# 7. P8 Product Definition

The learner begins with:

```text
What am I building?

Who is it for?

What problem does it solve?

Why should someone use it?

What makes it useful?
```

Example:

> A learning progress platform that helps technical learners identify weak topics and plan revision.

---

# 8. P8 Target Audience

The learner identifies:

```text
Primary Users
─────────────
Technical learners

Secondary Users
──────────────
Instructors

Administrative Users
────────────────────
Platform administrators
```

This gives the product a real audience.

---

# 9. P8 Product Value Proposition

The learner should be able to state:

> **What problem does this product solve?**

Example:

> Learners can identify weak topics and track their progress across multiple technical courses from one dashboard.

This becomes part of the portfolio presentation.

---

# 10. P8 Product Scope

The learner defines:

```text
MVP
Core Product
Future Features
```

Example:

### MVP

```text
Authentication
Course enrollment
Topic tracking
Progress dashboard
```

### Future

```text
AI recommendations
Advanced analytics
Notifications
Social learning
```

This keeps the project manageable.

---

# 11. P8 Product Requirements

Unlike P2/P3, requirements are not supplied entirely by the system.

The learner defines them.

Example:

```text
FR-01
User can create an account.

FR-02
User can enroll in a course.

FR-03
User can mark a topic complete.

FR-04
Dashboard displays progress.
```

---

# 12. P8 Non-Functional Requirements

The learner also considers:

```text
Security
Performance
Accessibility
Reliability
Maintainability
Observability
```

Example:

> Protected user data must not be accessible by another user.

This makes the project production-oriented.

---

# 13. P8 Architecture

The learner creates a complete architecture.

Example:

```text
                     Web Client
                         │
                         ▼
                  API / Gateway
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Identity     Learning     Analytics
          Service      Service       Service
             │           │           │
             └───────────┼───────────┘
                         ▼
                      Database
                         │
                         ▼
                       Cache
```

The architecture should be justified.

---

# 14. P8 Architecture Decision

The learner documents:

```text
Decision:
Use PostgreSQL as primary database.

Why:
The domain contains strongly related entities
requiring transactional consistency.

Alternative:
Document database.

Reason rejected:
The core relationships are relational.
```

This is portfolio-quality engineering evidence.

---

# 15. P8 Production Boundaries

The learner identifies:

```text
Public
Private
Internal
Administrative
```

For example:

```text
Public API
     ↓
Authentication
     ↓
Authorization
     ↓
Protected resources
```

---

# 16. P8 Authentication

A production-style project should use a secure authentication architecture.

Depending on the platform:

```text
Existing Identity
      ↓
Authentication
      ↓
Secure Session / Token
      ↓
Application
```

The learner should **reuse the platform's existing authentication architecture where one already exists**, rather than creating an unnecessary parallel identity system.

---

# 17. P8 Authorization

The product should define:

```text
Who can do what?
```

Example:

| Role       | Access                    |
| ---------- | ------------------------- |
| Learner    | Own learning data         |
| Instructor | Assigned learning content |
| Admin      | Platform administration   |

For resource-sensitive actions:

```text
Role
 +
Permission
 +
Resource Scope
```

may be required.

---

# 18. P8 Security Model

A production project should consider:

```text
Authentication
Authorization
Input validation
Secure cookies/tokens
Secret management
Data protection
Rate limiting
Error handling
Audit logging
```

Only applicable controls need to be implemented.

---

# 19. P8 Security Review

The learner should perform a security review:

```text
┌─────────────────────────────────────────────┐
│ SECURITY REVIEW                             │
├─────────────────────────────────────────────┤
│ Authentication          ✓                   │
│ Authorization           ✓                   │
│ Input Validation        ✓                   │
│ Resource Ownership      ✓                   │
│ Secret Handling         ✓                   │
│ Error Exposure          ✓                   │
│ Audit Events            ✓                   │
└─────────────────────────────────────────────┘
```

---

# 20. P8 Production Database

The learner should consider:

```text
Schema
Indexes
Constraints
Migrations
Backups
Data integrity
Transactions
```

A production project should not rely on:

> "It works on my laptop."

---

# 21. P8 Database Migration

Production database changes should be handled through migrations.

```text
Current Schema
      ↓
Migration
      ↓
New Schema
      ↓
Validation
```

The learner should consider existing data.

---

# 22. P8 Testing

P8 requires stronger testing discipline.

```text
Unit
  ↓
Integration
  ↓
API
  ↓
Security
  ↓
End-to-End
  ↓
Production Validation
```

The exact layers depend on the project.

---

# 23. P8 Regression Testing

Every release should protect existing functionality.

```text
Existing Features
        ↓
Regression Suite
        ↓
New Feature Tests
        ↓
Release Decision
```

---

# 24. P8 Security Testing

Examples:

```text
Unauthenticated request
        ↓
Rejected

Wrong role
        ↓
Rejected

Wrong resource
        ↓
Rejected

Malformed input
        ↓
Rejected
```

The learner should demonstrate these boundaries.

---

# 25. P8 Performance

The learner should identify realistic performance requirements.

Possible areas:

```text
API latency
Database queries
Page rendering
Large datasets
Concurrent users
Caching
```

The project should measure rather than merely claim:

> "The application is fast."

---

# 26. P8 Observability

This becomes a major distinction from normal educational projects.

The system should consider:

```text
Logs
Metrics
Errors
Health checks
Request IDs
Alerts
```

For example:

```text
Request
  ↓
Request ID
  ↓
API
  ↓
Service
  ↓
Database
```

The learner can trace a failure.

---

# 27. P8 Health Checks

A production-like project can expose:

```text
/health
```

or equivalent.

The health system may verify:

```text
Application
Database
Critical dependencies
```

---

# 28. P8 Error Monitoring

The learner should demonstrate:

```text
Application Error
      ↓
Error Tracking
      ↓
Context
      ↓
Investigation
```

Sensitive information should not be exposed.

---

# 29. P8 Deployment

This is one of the defining P8 characteristics.

The learner should deploy the application to an appropriate environment.

Conceptually:

```text
Source Code
    ↓
CI/CD
    ↓
Build
    ↓
Tests
    ↓
Deployment
    ↓
Production / Staging
```

The exact hosting platform depends on the project.

---

# 30. P8 CI/CD

A professional project can use:

```text
Git Push
   ↓
CI
   ↓
Lint
   ↓
Tests
   ↓
Build
   ↓
Deploy
```

A failed critical test should block deployment.

---

# 31. P8 Environment Separation

Where appropriate:

```text
Development
     ↓
Staging
     ↓
Production
```

Environment-specific configuration should not be hard-coded.

---

# 32. P8 Secrets

Secrets should be handled through secure configuration mechanisms.

Never:

```text
password = "my-secret"
```

inside source code.

Instead:

```text
Environment / Secret Store
          ↓
Application
```

---

# 33. P8 Configuration

The project should distinguish:

```text
Code
Configuration
Secrets
Environment
```

This is a professional engineering concern.

---

# 34. P8 Domain / URL

For a deployed project:

```text
Production
https://example.com

API
https://api.example.com
```

The learner should document the deployment endpoints where appropriate.

---

# 35. P8 HTTPS

Production-facing applications should use secure transport.

Conceptually:

```text
Browser
   ↓
HTTPS
   ↓
Application
```

The learner should verify secure deployment configuration.

---

# 36. P8 Accessibility

The product should be usable by a broad audience.

Requirements can include:

```text
Keyboard navigation
Focus states
Semantic HTML
Accessible labels
Color contrast
Screen-reader support
```

This should be part of the production-quality definition.

---

# 37. P8 Responsive Design

The product should work across:

```text
Desktop
Tablet
Mobile
```

The learner should test actual layouts rather than assuming responsiveness.

---

# 38. P8 UX Quality

Portfolio projects should not look like unfinished assignments.

The learner should consider:

```text
Navigation
Loading states
Empty states
Error states
Success states
Responsive behavior
Consistency
```

---

# 39. P8 Empty State

Example:

```text
┌─────────────────────────────────────┐
│ No Courses Yet                      │
│                                     │
│ Start learning by enrolling in a   │
│ course.                             │
│                                     │
│ [ Explore Courses ]                 │
└─────────────────────────────────────┘
```

A production application handles these states explicitly.

---

# 40. P8 Loading State

Example:

```text
┌─────────────────────────────────────┐
│ Your Progress                       │
│                                     │
│ Loading progress...                 │
│ ███████████░░                       │
└─────────────────────────────────────┘
```

---

# 41. P8 Error State

Example:

```text
┌─────────────────────────────────────┐
│ Unable to load your progress        │
│                                     │
│ Something went wrong.               │
│                                     │
│ [ Try Again ]                       │
└─────────────────────────────────────┘
```

This is part of production UX.

---

# 42. P8 Documentation

A strong portfolio project should include:

```text
README
Architecture
Setup
Environment configuration
API documentation
Database information
Testing
Deployment
Security considerations
Known limitations
```

---

# 43. P8 README

A professional README might contain:

```text
# Product Name

## Problem
...

## Solution
...

## Features
...

## Architecture
...

## Tech Stack
...

## Setup
...

## Testing
...

## Deployment
...

## Security
...

## Limitations
...

## Future Roadmap
...
```

---

# 44. P8 Architecture Documentation

The learner should explain:

```text
What components exist?
Why do they exist?
How do they communicate?
Where is authentication?
Where is authorization?
Where is data stored?
How are failures handled?
```

This makes the project understandable to another engineer.

---

# 45. P8 API Documentation

Where applicable:

```text
Endpoint
Method
Authentication
Request
Response
Errors
Authorization
```

Example:

```text
POST /api/tutorials

Authentication:
Required

Permission:
tutorial:create
```

---

# 46. P8 Deployment Documentation

The learner documents:

```text
Build
Environment
Deployment
Database migration
Health check
Rollback
```

This is important for production-like projects.

---

# 47. P8 Rollback Strategy

A production project should consider:

> What happens if the deployment is broken?

Possible strategy:

```text
Release N
   ↓
Problem
   ↓
Rollback
   ↓
Release N-1
```

Or feature-flag disablement where appropriate.

---

# 48. P8 Release Management

A professional project can use:

```text
v1.0.0
v1.1.0
v1.2.0
```

with release notes:

```text
Added
Changed
Fixed
Security
```

This helps make the project feel like a real product.

---

# 49. P8 Portfolio Page

The learner should create a public-facing project presentation.

Example:

```text
┌──────────────────────────────────────────────────┐
│ LEARNING PROGRESS PLATFORM                       │
│                                                  │
│ A platform for tracking technical learning       │
│ progress and identifying weak topics.            │
│                                                  │
│ [ Live Demo ] [ GitHub ] [ Case Study ]          │
│                                                  │
│ ───────────────────────────────────────────────  │
│                                                  │
│ Features                                         │
│ ✓ Authentication                                 │
│ ✓ Course tracking                                │
│ ✓ Progress analytics                             │
│ ✓ Assessment integration                         │
└──────────────────────────────────────────────────┘
```

---

# 50. P8 Portfolio Case Study

The learner should explain:

```text
Problem
 ↓
Research / Assumptions
 ↓
Solution
 ↓
Architecture
 ↓
Implementation
 ↓
Challenges
 ↓
Trade-offs
 ↓
Results
 ↓
Future Improvements
```

This is much more valuable than simply linking a GitHub repository.

---

# 51. P8 Technical Case Study

Example:

> **Challenge:** Multiple services needed to share identity while maintaining brand-specific authorization.

Then:

```text
Problem
 ↓
Constraints
 ↓
Architecture Decision
 ↓
Implementation
 ↓
Security Considerations
 ↓
Result
```

This demonstrates engineering thinking.

---

# 52. P8 Metrics

Where meaningful, the learner can show measurable results.

For example:

```text
Build time
API latency
Test coverage
Error rate
Page performance
Database query performance
```

Metrics should be genuine and reproducible.

---

# 53. P8 Before / After

A strong portfolio case study can show:

```text
Before
──────
Slow query
4 API calls
No caching

After
─────
Indexed query
2 API calls
Appropriate caching
```

The learner should explain how the improvement was measured.

---

# 54. P8 Production Incident Simulation

An advanced P8 project can include:

> Production API latency suddenly increases.

The learner must:

```text
Observe
 ↓
Investigate
 ↓
Identify cause
 ↓
Mitigate
 ↓
Verify
 ↓
Document
```

This demonstrates operational maturity.

---

# 55. P8 Backup / Recovery

For systems with persistent data:

```text
Database
   ↓
Backup
   ↓
Recovery Test
```

The learner should understand that:

> A backup that has never been restored is not fully validated.

The exact backup infrastructure depends on the deployment environment.

---

# 56. P8 Data Protection

The learner should consider:

```text
Sensitive data
Access controls
Retention
Logging
Transport security
Storage security
```

Only requirements relevant to the product need implementation.

---

# 57. P8 Production Readiness Checklist

```text
┌───────────────────────────────────────────────┐
│ PRODUCTION READINESS                           │
├───────────────────────────────────────────────┤
│ ✓ Authentication                              │
│ ✓ Authorization                               │
│ ✓ Validation                                  │
│ ✓ Error handling                              │
│ ✓ Tests                                       │
│ ✓ Regression tests                            │
│ ✓ Observability                               │
│ ✓ Secure configuration                        │
│ ✓ Deployment                                  │
│ ✓ Documentation                               │
│ ✓ Accessibility                               │
│ ✓ Responsive UI                               │
│ ✓ Backup / recovery where applicable          │
│ ✓ Rollback strategy                           │
└───────────────────────────────────────────────┘
```

---

# 58. P8 Portfolio Readiness Checklist

```text
┌───────────────────────────────────────────────┐
│ PORTFOLIO READINESS                            │
├───────────────────────────────────────────────┤
│ ✓ Clear project title                         │
│ ✓ Problem statement                           │
│ ✓ Target audience                             │
│ ✓ Screenshots / demo                          │
│ ✓ Architecture diagram                        │
│ ✓ Technology explanation                      │
│ ✓ Key engineering decisions                   │
│ ✓ Challenges                                  │
│ ✓ Trade-offs                                  │
│ ✓ Results                                     │
│ ✓ Live demo where appropriate                 │
│ ✓ Repository / source                         │
│ ✓ Case study                                  │
└───────────────────────────────────────────────┘
```

---

# 59. P8 Portfolio Presentation

The learner can present:

```text
┌────────────────────────────────────────────────────┐
│ MY PROJECT                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│ Problem                                             │
│ What problem does this solve?                     │
│                                                    │
│ Solution                                            │
│ What did I build?                                 │
│                                                    │
│ Architecture                                       │
│ How does it work?                                 │
│                                                    │
│ Engineering                                        │
│ Security • Testing • Observability                 │
│                                                    │
│ Results                                             │
│ What did I achieve?                               │
│                                                    │
│ [ Live Demo ] [ Source ] [ Case Study ]            │
└────────────────────────────────────────────────────┘
```

---

# 60. P8 Professional Demo

The learner should demonstrate the product through a realistic workflow.

For example:

```text
Open Application
      ↓
Login
      ↓
Create / Access Content
      ↓
Perform Core Workflow
      ↓
View Result
      ↓
Show Analytics
      ↓
Demonstrate Security Boundary
      ↓
Show Architecture
```

---

# 61. P8 Technical Defense

The learner should be able to defend decisions:

> Why this architecture?

> Why this database?

> Why this authentication approach?

> How is authorization enforced?

> What happens if the database fails?

> How did you test the system?

> How would you scale it?

> What would you change before serving 1 million users?

This makes P8 extremely valuable for interview preparation.

---

# 62. P8 Interview Integration

```text
P8
Portfolio / Production
        ↓
Project Defense
        ↓
IV2
Concept → Interview Question
        ↓
IV5
Why / How
        ↓
IV6
FAANG-Level Scenario
```

The project becomes a source of authentic interview questions.

---

# 63. P8 Open-Ended Nature

P8 retains P6's independence.

The learner may choose:

```text
Product
Architecture
Technology
Features
Design
Deployment
```

But now there is a higher quality bar.

So:

```text
P6
Freedom

P7
Integration

P8
Freedom + Integration + Production Quality
```

---

# 64. P8 Production Constraints

The project can define minimum requirements.

For example:

```text
Required
────────
Authentication
Authorization
Tests
Deployment
Documentation

Recommended
───────────
Observability
Caching
CI/CD

Optional
────────
Advanced analytics
AI features
Multi-region deployment
```

The requirements should remain appropriate to the learner's level.

---

# 65. P8 Production vs Overengineering

Very important:

> Production-quality does **not** mean maximum complexity.

A learner should not be rewarded for adding:

```text
20 microservices
5 queues
3 caches
Kubernetes
Multi-region infrastructure
```

when the product does not need them.

Instead:

```text
Requirement
    ↓
Appropriate Engineering
```

is the principle.

---

# 66. P8 Engineering Trade-Offs

Example:

> A monolith is sufficient for the current scale.

That can be a **better engineering decision** than unnecessarily splitting the application into microservices.

The learner should explain:

```text
Current Need
+
Expected Scale
+
Team Size
+
Complexity
```

before selecting architecture.

---

# 67. P8 Technical Debt

The learner should identify:

```text
Known Technical Debt
```

Example:

```text
• Search is currently basic.
• Analytics queries could be optimized.
• Notification system is not implemented.
```

This is better than pretending the project is perfect.

---

# 68. P8 Production Limitations

The learner should explicitly state:

```text
Production Limitations
──────────────────────
• MVP supports one deployment region.
• No real-time collaboration.
• Advanced analytics deferred.
• Automated backup configuration depends on hosting.
```

This improves credibility.

---

# 69. P8 Roadmap

Example:

```text
v1.0
MVP

v1.1
Search + filtering

v1.2
Advanced analytics

v2.0
Collaborative features
```

The learner demonstrates product evolution thinking.

---

# 70. P8 Final Product Artifact

The final outcome should be more than source code.

```text
                 P8
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
    Product    Source      Docs
       │          │          │
       ▼          ▼          ▼
     Demo      Tests      Case Study
       │          │          │
       └──────────┼──────────┘
                  ▼
            Portfolio Artifact
```

---

# 71. P8 Project Lifecycle

```text
IDEA
  ↓
PRODUCT DEFINITION
  ↓
MVP
  ↓
ARCHITECTURE
  ↓
IMPLEMENTATION
  ↓
TESTING
  ↓
SECURITY REVIEW
  ↓
OBSERVABILITY
  ↓
DEPLOYMENT
  ↓
VALIDATION
  ↓
DOCUMENTATION
  ↓
PORTFOLIO PRESENTATION
  ↓
TECHNICAL DEFENSE
  ↓
FINAL REVIEW
```

---

# 72. P8 Evidence

The learner can provide evidence for:

```text
Architecture
Code
Tests
Deployment
Security
Performance
Documentation
Demo
```

This creates a much stronger portfolio artifact.

---

# 73. P8 Evaluation

P8 should evaluate both **engineering quality** and **professional presentation**.

| Dimension          | What is evaluated                          |
| ------------------ | ------------------------------------------ |
| Product Definition | Is the problem meaningful?                 |
| User Value         | Does the product solve the stated problem? |
| Architecture       | Is the system appropriately designed?      |
| Implementation     | Does it work?                              |
| Security           | Are relevant protections implemented?      |
| Testing            | Is quality validated?                      |
| Reliability        | Are failures handled appropriately?        |
| Observability      | Can problems be diagnosed?                 |
| Deployment         | Is the system deployable/operational?      |
| UX                 | Is it usable and polished?                 |
| Documentation      | Can another person understand it?          |
| Maintainability    | Can the system evolve?                     |
| Technical Defense  | Can the learner explain decisions?         |
| Portfolio Quality  | Can the work be presented professionally?  |

---

# 74. P8 Quality Gates

A strong P8 can use explicit gates:

```text
Product Gate
      ↓
Architecture Gate
      ↓
Security Gate
      ↓
Testing Gate
      ↓
Deployment Gate
      ↓
Documentation Gate
      ↓
Portfolio Gate
```

A critical security failure should not be hidden by a high score elsewhere.

---

# 75. P8 Final Review

Example:

```text
P8 FINAL REVIEW

PRODUCT
✓ Clear problem
✓ Defined target users

ENGINEERING
✓ Strong architecture
✓ Good testing
✓ Secure authorization
✓ Appropriate database design

PRODUCTION
✓ Deployed
✓ Health checks
✓ Error monitoring
✓ Secure configuration

PORTFOLIO
✓ Case study
✓ Architecture diagram
✓ Demo
✓ Technical explanation

LIMITATIONS
⚠ Advanced analytics deferred
⚠ No automated disaster recovery yet
```

---

# 76. P8 Portfolio Case Study Structure

The final case study can follow:

```text
1. Problem
2. Users
3. Goals
4. Requirements
5. Architecture
6. Technology Choices
7. Key Engineering Decisions
8. Security
9. Testing
10. Deployment
11. Challenges
12. Trade-offs
13. Results
14. Limitations
15. Future Roadmap
```

This is a strong professional artifact.

---

# 77. P8 Example — Authentication Platform

A learner completing an Authentication/Authorization learning path could build:

> **Multi-Tenant Authentication & Authorization Platform**

Features:

```text
User Registration
Login
Session Management
Role Management
Permission Management
Resource Authorization
Audit Events
Admin Dashboard
```

Architecture:

```text
Client
  ↓
Identity API
  ↓
Authentication
  ↓
Authorization
  ↓
Policy / Permission Layer
  ↓
Database
  ↓
Audit / Observability
```

This is highly appropriate as a P8 project for an authentication-focused curriculum.

---

# 78. P8 Example — Tutorial Platform

A Tutorial Engine learner could build:

> **Production-Ready Learning Content Platform**

Features:

```text
Content Authoring
Block Rendering
Versioning
Publishing
Authentication
Authorization
Progress
Assessment Integration
Analytics
```

And demonstrate:

```text
Tutorial Engine
      +
Assessment Engine
      +
Identity
      +
Analytics
```

without duplicating those platform services.

---

# 79. P8 Example — Quiz Platform

A learner could build:

> **Adaptive Technical Assessment Platform**

Features:

```text
Question Management
Exam Blueprint
Assessment Delivery
Attempts
Scoring
Results
Analytics
Role Management
```

The existing assessment architecture can be reused where appropriate.

---

# 80. P8 Final Demonstration

The learner should be able to say:

> "Here is the problem I identified."

> "Here is who experiences it."

> "Here is the product I built."

> "Here is the architecture."

> "Here is how I secured it."

> "Here is how I tested it."

> "Here is how I deployed it."

> "Here is what I learned."

> "Here is what I would improve next."

That is the essence of a professional portfolio project.

---

# 81. P8 JSON

Tutorial Engine reference:

```json
{
  "type": "project",
  "version": "P8",
  "projectId": "production-learning-platform-001"
}
```

Optional presentation configuration:

```json
{
  "type": "project",
  "version": "P8",
  "projectId": "production-learning-platform-001",
  "presentation": {
    "showProductDefinition": true,
    "showTargetAudience": true,
    "showMvp": true,
    "showArchitecture": true,
    "showSecurity": true,
    "showTesting": true,
    "showObservability": true,
    "showDeployment": true,
    "showDocumentation": true,
    "showPortfolioCaseStudy": true,
    "showTechnicalDefense": true,
    "showProductionReadiness": true,
    "showEvaluation": true,
    "allowRevision": true
  }
}
```

The **product definition, project execution, deployment, testing, security evaluation, scoring, portfolio artifact, and production infrastructure** should remain owned by their appropriate platform/project services.

`ProjectBlock` is responsible for presenting and orchestrating the learning experience.

---

# 82. P8 Technical Specification

| Area                               | P8 Decision                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| **Block**                          | **ProjectBlock**                                                                   |
| **Version**                        | **P8**                                                                             |
| **Presentation**                   | **Portfolio / Production Project**                                                 |
| **Primary purpose**                | Demonstrate professional readiness through a production-quality portfolio artifact |
| **Product definition**             | ✅                                                                                  |
| **Target audience**                | ✅                                                                                  |
| **MVP**                            | ✅                                                                                  |
| **Requirements**                   | ✅                                                                                  |
| **Architecture**                   | ✅                                                                                  |
| **Implementation**                 | ✅                                                                                  |
| **Authentication**                 | As applicable                                                                      |
| **Authorization**                  | As applicable                                                                      |
| **Security review**                | **Core**                                                                           |
| **Testing**                        | **Core**                                                                           |
| **Regression testing**             | **Core**                                                                           |
| **Observability**                  | Recommended / applicable                                                           |
| **Deployment**                     | **Core characteristic**                                                            |
| **Production validation**          | ✅                                                                                  |
| **CI/CD**                          | Recommended                                                                        |
| **Documentation**                  | **Core**                                                                           |
| **Architecture documentation**     | ✅                                                                                  |
| **Portfolio case study**           | **Core**                                                                           |
| **Technical defense**              | Recommended                                                                        |
| **UX quality**                     | ✅                                                                                  |
| **Accessibility**                  | ✅                                                                                  |
| **Responsive design**              | ✅                                                                                  |
| **Performance consideration**      | ✅                                                                                  |
| **Reliability consideration**      | ✅                                                                                  |
| **Rollback strategy**              | Recommended                                                                        |
| **Backup/recovery**                | Applicable to persistent production systems                                        |
| **Release management**             | Recommended                                                                        |
| **Known limitations**              | ✅                                                                                  |
| **Future roadmap**                 | Recommended                                                                        |
| **Production-quality engineering** | **Core**                                                                           |
| **Commercial product required**    | ❌                                                                                  |
| **Public deployment required**     | Depends on project/learning path                                                   |
| **Fixed implementation sequence**  | ❌                                                                                  |
| **Learner autonomy**               | **Very high**                                                                      |
| **Multiple valid solutions**       | ✅                                                                                  |
| **Submission**                     | ✅                                                                                  |
| **Evaluation**                     | **Comprehensive**                                                                  |
| **Revision**                       | ✅                                                                                  |
| **Portfolio artifact**             | **Core**                                                                           |
| **Local project engine**           | ❌                                                                                  |
| **Local scoring authority**        | ❌                                                                                  |
| **Project ownership**              | Project/Assessment layer                                                           |
| **Tutorial ownership**             | Presentation/orchestration                                                         |
| **Assessment integration**         | Existing assessment architecture                                                   |
| **Authentication**                 | Existing platform auth                                                             |
| **Authorization**                  | Existing platform authorization                                                    |
| **JSON-driven**                    | ✅                                                                                  |
| **Keyboard navigation**            | ✅                                                                                  |
| **Light theme**                    | ✅                                                                                  |
| **Primary**                        | **#F54A8D**                                                                        |
| **Secondary**                      | **#0B1B3D**                                                                        |
| **Gradient**                       | ❌                                                                                  |
| **Dark overall theme**             | ❌                                                                                  |

---

# 83. Complete ProjectBlock Progression

Now that P8 is complete, the entire **ProjectBlock** progression is:

```text
P1
Mini Project
   ↓
Learn by building something small
   ↓
P2
Guided Project
   ↓
Build with guidance
   ↓
P3
Step-by-Step Project
   ↓
Understand project construction
   ↓
P4
Real-World Scenario
   ↓
Solve a realistic problem
   ↓
P5
Feature-Based Project
   ↓
Extend an existing system
   ↓
P6
Open-Ended Project
   ↓
Independently define and build a solution
   ↓
P7
Capstone Project
   ↓
Integrate accumulated competencies
   ↓
P8
Portfolio / Production Project
   ↓
Demonstrate professional readiness
```

---

# 84. The Eight Project Levels

| Version | Presentation                   | Primary Learning Goal              |
| ------- | ------------------------------ | ---------------------------------- |
| **P1**  | Mini Project                   | Build something small              |
| **P2**  | Guided Project                 | Build with structured guidance     |
| **P3**  | Step-by-Step Project           | Learn project construction         |
| **P4**  | Real-World Scenario            | Solve realistic problems           |
| **P5**  | Feature-Based Project          | Extend an existing system          |
| **P6**  | Open-Ended Project             | Independently define and build     |
| **P7**  | Capstone Project               | Integrate multiple competencies    |
| **P8**  | Portfolio / Production Project | Demonstrate professional readiness |

---

# 85. Final ProjectBlock Learning Curve

```text
                    PROJECT AUTONOMY
                         ▲
                         │
                  P8 ────┤  Professional
                         │  Production
                  P7 ────┤  Integrated Mastery
                         │
                  P6 ────┤  Independent
                         │
                  P5 ────┤  Existing System
                         │
                  P4 ────┤  Real-World
                         │
                  P3 ────┤  Structured
                         │
                  P2 ────┤  Guided
                         │
                  P1 ────┤  Small
                         │
                         └──────────────────►
                              COMPLEXITY
```

### Final definition of P8

> **P8 — Portfolio / Production Project is the highest ProjectBlock presentation in which the learner transforms their technical knowledge into a professional-quality product or production-like system, defining a meaningful product problem, designing and implementing the solution, applying appropriate security, testing, reliability, observability, accessibility, and deployment practices, documenting the engineering decisions and limitations, and presenting the finished work as a credible portfolio artifact.**

The defining progression is:

```text
P6
"I can build independently."

        ↓

P7
"I can integrate everything I learned."

        ↓

P8
"I can build, operate, explain, and present
a professional-quality system."
```

## **P8 — Portfolio / Production Project: COMPLETE** ✅

## **BLOCK 18 — ProjectBlock: ALL 8 VERSIONS COMPLETE** ✅



```python

```
