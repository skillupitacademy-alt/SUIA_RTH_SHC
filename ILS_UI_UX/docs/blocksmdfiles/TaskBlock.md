# BLOCK 14 — TaskBlock

## T1 — Simple Task

Yes. We start **Block #14 — TaskBlock** with **only T1**, one version at a time.

The committed sequence is:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| **T1**  | **Simple Task**     | 🔵 **CURRENT** |
| T2      | Guided Task         | ⏳              |
| T3      | Multi-Step Task     | ⏳              |
| T4      | Scenario Task       | ⏳              |
| T5      | Debugging Task      | ⏳              |
| T6      | Implementation Task | ⏳              |
| T7      | Challenge Task      | ⏳              |
| T8      | Real-World Task     | ⏳              |

---

# 1. What Is a TaskBlock?

The distinction you established is important:

> **Exercise teaches/practices a specific skill.**
> **Task asks the learner to accomplish something.**

Therefore, TaskBlock should not simply become another name for ExerciseBlock.

The core difference is:

```text
EXERCISE
      ↓
Practice a skill

TASK
      ↓
Accomplish an objective
```

---

# 2. What Is T1 — Simple Task?

**T1 — Simple Task** is the most basic TaskBlock presentation.

The learner receives:

```text
OBJECTIVE
+
REQUIREMENTS
+
EXPECTED OUTCOME
```

and is asked to accomplish a **single, clearly defined task**.

The learner should not need a sequence of guided steps.

The fundamental flow is:

```text
TASK
  ↓
UNDERSTAND OBJECTIVE
  ↓
PERFORM ACTION
  ↓
VERIFY RESULT
  ↓
COMPLETE
```

---

# 3. T1's Position in TaskBlock

The progression is:

```text
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

T1 therefore establishes the **fundamental task model**.

---

# 4. T1 vs ExerciseBlock

This distinction must remain locked.

### ExerciseBlock

The learner practices a particular skill.

Example:

> Complete this function so that it returns even numbers.

The focus is:

```text
SKILL
 ↓
PRACTICE
```

### TaskBlock T1

The learner is asked to accomplish something.

Example:

> Create a list containing the even numbers from the following dataset and save the result as `even_numbers`.

The focus is:

```text
OBJECTIVE
 ↓
ACCOMPLISHMENT
```

---

# 5. T1 vs EX6

Both can be independent.

But their purpose differs.

### EX6

> Solve this programming problem independently.

### T1

> Accomplish this specific task.

The TaskBlock should feel more like:

```text
"Do this."
```

rather than:

```text
"Practice this skill."
```

---

# 6. T1 Example — Python

### Task

> Create a list named `active_users` containing the names of all users whose status is `"active"`.

Given:

```python
users = [
    {"name": "A", "status": "active"},
    {"name": "B", "status": "inactive"},
    {"name": "C", "status": "active"}
]
```

Expected result:

```python
active_users = ["A", "C"]
```

The learner's objective is simply:

> **Complete the task.**

---

# 7. T1 Should Be Focused

A T1 should normally have:

```text
ONE objective
ONE expected outcome
CLEAR completion criteria
```

Avoid:

```text
Task
+
five unrelated requirements
+
multiple implementation stages
```

That moves toward T3 or T4.

---

# 8. T1 Core Structure

```text
┌──────────────────────────────────────────────┐
│ TASK                                         │
├──────────────────────────────────────────────┤
│ TITLE                                        │
│                                              │
│ OBJECTIVE                                    │
│ What must the learner accomplish?            │
│                                              │
│ REQUIREMENTS                                 │
│ • Requirement 1                              │
│ • Requirement 2                              │
│                                              │
│ EXPECTED OUTCOME                             │
│ What should exist when the task is done?     │
│                                              │
│ [ Start Task ]                               │
└──────────────────────────────────────────────┘
```

---

# 9. T1 Task Anatomy

A T1 can contain:

```text
Task Title
Objective
Context
Requirements
Input / Resources
Expected Outcome
Completion Criteria
Optional Hint
```

The important point is that these elements describe **what must be accomplished**, not how to accomplish it.

---

# 10. T1 — Objective

The objective should be action-oriented.

Good:

> Create a function that validates a username.

Good:

> Add an `admin` role to the user configuration.

Good:

> Rename the variable `user_data` to `current_user`.

Weak:

> Learn about validation.

That is an educational objective, not a task.

---

# 11. T1 — Requirements

Requirements define the boundaries.

Example:

```text
Requirements

• Use the existing `users` list.
• Create a new list called `active_users`.
• Include only users whose status is `"active"`.
• Preserve the original order.
```

The learner determines how to accomplish it.

---

# 12. T1 — Expected Outcome

The learner needs to know what successful completion looks like.

Example:

```text
Expected Outcome

active_users should contain:

["A", "C"]
```

For a configuration task:

> The application should reject requests without the required permission.

For a file task:

> The configuration file should contain the required environment variable.

---

# 13. T1 — Completion Criteria

Completion should be objective whenever possible.

Example:

```text
Task Complete When:

✓ active_users exists
✓ inactive users are excluded
✓ original order is preserved
✓ original users list is unchanged
```

---

# 14. T1 Example — Exception Handling

### Task

> Add safe handling for invalid integer input to the existing conversion function.

Given:

```python
def convert_age(value):
    return int(value)
```

Task requirements:

```text
• Valid numeric input should continue to work.
• Invalid input should not crash the application.
• Invalid input should return None.
```

The learner accomplishes the task.

Notice:

> We are not saying "Step 1: add try."

That would become a guided task.

---

# 15. T1 Example — Authentication

### Task

> Add a login validation check that rejects requests when the username is missing.

Requirements:

```text
• Username must be present.
• Missing username must result in rejection.
• Valid username requests should continue.
```

Again, the learner decides how to make the change.

---

# 16. T1 Example — Authorization

### Task

> Ensure that an administrative operation cannot execute unless the current user has the required administrative permission.

Expected result:

```text
Authorized user
→ operation proceeds

Unauthorized user
→ operation is rejected
```

This is a task because the learner is being asked to **accomplish a change**.

---

# 17. T1 Does Not Explain the Solution

A TaskBlock should not become an instructional walkthrough.

Bad:

```text
Step 1:
Find the user.

Step 2:
Check the role.

Step 3:
Add the permission.

Step 4:
Return True.
```

That is closer to T2 — Guided Task.

T1 should say:

> Ensure that only authorized users can perform this operation.

---

# 18. T1 Does Not Need a Code Editor

A task may involve code, but the TaskBlock itself should remain task-oriented.

Possible workspaces include:

```text
Code Editor
Text Editor
Configuration Editor
Diagram Editor
Database Workspace
File Workspace
Terminal
Selection Interface
```

The workspace depends on the task.

---

# 19. T1 Example — Configuration Task

### Task

> Add the required API endpoint configuration to the development environment.

Requirements:

```text
• Add the API base URL.
• Use the development endpoint.
• Do not modify production configuration.
```

Expected outcome:

```text
Development configuration
→ contains the correct API endpoint
```

This is clearly a TaskBlock rather than a coding exercise.

---

# 20. T1 Example — Diagram Task

### Task

> Create a simple authentication flow showing how a login request moves from the client to the authentication service.

Expected outcome:

```text
Client
 ↓
Authentication API
 ↓
Identity verification
 ↓
Token/session creation
 ↓
Authenticated response
```

The learner is accomplishing a deliverable.

---

# 21. T1 Example — Documentation Task

### Task

> Document the three authorization states supported by the system.

Requirements:

```text
• Describe authenticated state.
• Describe unauthorized state.
• Describe forbidden state.
```

Expected outcome:

> A concise authorization-state document.

Again, no need for code.

---

# 22. T1 Verification

Every TaskBlock should ideally answer:

> **How do we know the task is complete?**

Verification can be:

```text
Automatic
Manual
Structural
Behavioral
Visual
```

For example:

### Code

Run tests.

### Configuration

Validate required fields.

### Diagram

Check required components.

### Documentation

Check required sections.

---

# 23. T1 Automatic Validation

For code:

```text
Task
 ↓
Run validation
 ↓
Pass?
 ├── No → Feedback
 └── Yes → Complete
```

For configuration:

```text
Task
 ↓
Schema validation
 ↓
Pass?
```

---

# 24. T1 Manual Completion

Some tasks cannot easily be automatically validated.

Example:

> Design a diagram explaining the authentication flow.

Then the system can provide:

```text
[ Mark Complete ]
```

or:

```text
[ Submit for Review ]
```

depending on the larger Tutorial Engine workflow.

---

# 25. T1 Completion State

```text
NOT_STARTED
     ↓
IN_PROGRESS
     ↓
SUBMITTED
     ↓
VALIDATING
     │
     ├── FAIL → IN_PROGRESS
     │
     └── PASS → COMPLETED
```

For manually reviewed tasks:

```text
SUBMITTED
   ↓
REVIEW
   ↓
APPROVED
   ↓
COMPLETED
```

---

# 26. T1 UI Example

```text
┌──────────────────────────────────────────────────┐
│ TASK                                             │
│ Simple Task                                      │
├──────────────────────────────────────────────────┤
│                                                  │
│ Create Active User List                          │
│                                                  │
│ OBJECTIVE                                        │
│ Create a new list containing the names of all    │
│ active users.                                    │
│                                                  │
│ REQUIREMENTS                                     │
│                                                  │
│ • Use the existing users collection.             │
│ • Include only active users.                     │
│ • Preserve order.                                │
│ • Do not modify the original collection.         │
│                                                  │
│ EXPECTED OUTCOME                                 │
│                                                  │
│ active_users = ["A", "C"]                        │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Code Workspace                              │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Check Task ]                                  │
└──────────────────────────────────────────────────┘
```

---

# 27. T1 Progress

A simple task does not need a complicated progress system.

Recommended:

```text
Not Started
     ↓
In Progress
     ↓
Completed
```

Unlike T3, there is no need to display multiple task stages.

---

# 28. T1 State Model

```json id="n4r8qk"
{
  "status": "in_progress"
}
```

Possible values:

```text
not_started
in_progress
submitted
completed
```

---

# 29. T1 JSON Structure

```json id="7f4b8s"
{
  "type": "task",
  "version": "T1",
  "presentation": "Simple Task",

  "content": {
    "title": "",
    "objective": "",
    "context": "",
    "requirements": [],
    "input": {},
    "expectedOutcome": "",
    "completionCriteria": []
  },

  "workspace": {
    "type": ""
  },

  "validation": {
    "mode": ""
  },

  "metadata": {
    "difficulty": "",
    "estimatedMinutes": 0
  }
}
```

---

# 30. Complete T1 JSON Example

```json id="3t1qvm"
{
  "type": "task",
  "version": "T1",
  "presentation": "Simple Task",

  "content": {
    "title": "Create the Active User List",

    "objective": "Create a new list named active_users containing the names of all users whose status is active.",

    "context": "The application already has a users collection containing user names and statuses.",

    "requirements": [
      "Use the existing users collection.",
      "Include only users whose status is active.",
      "Preserve the original order.",
      "Do not modify the original users collection."
    ],

    "input": {
      "users": [
        {
          "name": "A",
          "status": "active"
        },
        {
          "name": "B",
          "status": "inactive"
        },
        {
          "name": "C",
          "status": "active"
        }
      ]
    },

    "expectedOutcome": "active_users should contain [\"A\", \"C\"].",

    "completionCriteria": [
      "active_users exists.",
      "Only active users are included.",
      "Original order is preserved.",
      "The original users collection remains unchanged."
    ]
  },

  "workspace": {
    "type": "code",
    "language": "python",
    "starterCode": "users = [\n    {\"name\": \"A\", \"status\": \"active\"},\n    {\"name\": \"B\", \"status\": \"inactive\"},\n    {\"name\": \"C\", \"status\": \"active\"}\n]\n\n# Complete the task here\n"
  },

  "validation": {
    "mode": "behavioral",
    "tests": [
      {
        "description": "Active users are returned.",
        "expectedOutput": "[\"A\", \"C\"]"
      },
      {
        "description": "Inactive users are excluded."
      },
      {
        "description": "Original collection is unchanged."
      }
    ]
  },

  "metadata": {
    "difficulty": "easy",
    "estimatedMinutes": 5
  }
}
```

---

# 31. T1 Authoring Rules

A strong T1 should:

```text
✓ Have one clear objective
✓ Be action-oriented
✓ Define success
✓ Define relevant constraints
✓ Provide enough context
✓ Allow the learner to choose the implementation
✓ Be independently achievable
✓ Have a clear completion state
```

Avoid:

```text
❌ Step-by-step instructions
❌ Multiple dependent stages
❌ Complex scenarios
❌ Large-scale architecture
❌ Challenge-level ambiguity
❌ Turning it into a knowledge question
```

---

# 32. T1 Difficulty

T1 should be the **simplest task format**, but that does not mean the task itself must always be trivial.

The simplicity refers primarily to the **task structure**.

For example:

```text
Simple task structure
+
Moderately difficult subject
```

is still T1 if the learner is simply asked to accomplish one focused objective.

However, if the objective requires many dependent stages, it should move to T3.

---

# 33. T1 Duration

Typical target:

```text
1–10 minutes
```

depending on the subject.

A T1 should generally be short enough that the learner can immediately understand:

> "What exactly do I need to accomplish?"

---

# 34. T1 Relationship With T2

The progression begins:

```text
T1
Simple Task
   ↓
T2
Guided Task
```

The difference:

### T1

> Do this.

### T2

> Do this, and I'll guide you through how to accomplish it.

Therefore T1 should intentionally leave the implementation/workflow to the learner.

---

# 35. T1 Relationship With T3

### T1

```text
One objective
```

### T3

```text
Several dependent objectives
```

For example:

> Create a user.

is T1.

But:

> Create a user → validate input → assign role → save user → verify permissions.

is T3.

---

# 36. T1 Relationship With T4

### T1

> Accomplish a defined task.

### T4

> Accomplish a task within a realistic scenario.

Example:

T1:

> Add an admin permission.

T4:

> A new employee has joined the security team and needs access to the admin dashboard. Configure the appropriate authorization while ensuring normal users remain restricted.

The second introduces contextual decision-making.

---

# 37. T1 Relationship With T5

T1 can involve code, but it is not specifically about debugging.

### T1

> Add validation for missing usernames.

### T5

> Investigate why authentication fails for users with missing usernames and correct the implementation.

The latter is explicitly a debugging task.

---

# 38. T1 Relationship With T6

### T1

> Add a permission check.

### T6

> Implement the complete authorization component according to the provided interface and requirements.

T6 places stronger emphasis on **building an implementation**.

T1 is more general.

---

# 39. T1 Relationship With T7

### T1

> Add a basic permission check.

### T7

> Design a robust authorization mechanism that handles roles, ownership, permissions, invalid input, and conflicting authorization conditions.

The second is a challenge.

---

# 40. T1 Relationship With T8

### T1

> Create a list of active users.

### T8

> Build a practical user-access workflow for a production-like application.

T8 is explicitly grounded in a realistic, broader real-world objective.

---

# 41. T1 Design Language

Continue the established Tutorial Engine design:

* Light theme
* Primary **#F54A8D**
* Secondary **#0B1B3D**
* No dark theme
* No gradient
* professional educational interface
* clear objective
* strong action area
* clear completion feedback
* responsive
* accessible

The primary visual emphasis should be:

> **What must I accomplish?**

---

# 42. T1 Component Architecture

```text
TaskT1
│
├── TaskHeader
│
├── ObjectivePanel
│
├── ContextPanel
│
├── RequirementsPanel
│
├── InputPanel
│
├── Workspace
│
├── ExpectedOutcomePanel
│
├── CompletionCriteria
│
├── ValidationPanel
│
└── CompletionPanel
```

Not every task requires every component.

The renderer should show only the sections supplied by the JSON.

---

# 43. T1 Workspace Architecture

The workspace can be polymorphic:

```text
TaskWorkspace
│
├── CodeWorkspace
├── TextWorkspace
├── ConfigurationWorkspace
├── DiagramWorkspace
├── TerminalWorkspace
└── GenericWorkspace
```

This keeps TaskBlock flexible.

---

# 44. T1 Verification Architecture

```text
Task
 ↓
Workspace
 ↓
Learner performs action
 ↓
Check Task
 ↓
Validation Engine
 ↓
┌───────────────┐
│               │
PASS            FAIL
│               │
▼               ▼
Complete       Feedback
```

---

# 45. T1 Completion Message

Successful completion should reinforce accomplishment:

> **Task completed successfully.**

Optionally:

> You created the active-user list while preserving the original collection.

This is different from a quiz score.

---

# 46. T1 Should Not Use Quiz Scoring

TaskBlock is about accomplishing something.

Therefore the default completion model should be:

```text
Incomplete
     ↓
Complete
```

rather than:

```text
72%
84%
96%
```

A validation result can still report details.

---

# 47. T1 Analytics

Useful analytics:

```text
taskStarted
taskCompleted
timeSpent
attempts
validationFailures
workspaceType
```

For example:

```json id="9j67fm"
{
  "taskAnalytics": {
    "started": true,
    "completed": true,
    "attempts": 2,
    "validationFailures": 1,
    "timeSpentSeconds": 420
  }
}
```

---

# 48. T1 Accessibility

The task page should clearly expose:

```text
Task
Objective
Requirements
Workspace
Expected Outcome
Completion State
```

Example screen-reader flow:

> "Task: Create Active User List."

> "Objective: Create a new list containing the names of all active users."

> "Requirements: four items."

> "Workspace: Python code editor."

> "Check Task button."

---

# 49. T1 Responsive Layout

### Desktop

```text
┌─────────────────────────────┬──────────────────────┐
│ Objective                   │ Requirements         │
│                             │ Expected Outcome     │
│ Workspace                   │ Completion Criteria  │
│                             │ Validation           │
└─────────────────────────────┴──────────────────────┘
```

### Mobile

```text
Objective
   ↓
Requirements
   ↓
Expected Outcome
   ↓
Workspace
   ↓
Check Task
   ↓
Result
```

---

# 50. T1 Final Mental Model

```text
                     T1
                SIMPLE TASK
                     │
                     ▼
                 OBJECTIVE
                     │
                     ▼
               REQUIREMENTS
                     │
                     ▼
               LEARNER ACTS
                     │
                     ▼
                 VALIDATE
                     │
                ┌────┴────┐
                ▼         ▼
              FAIL       PASS
                │         │
                ▼         ▼
             RETRY     COMPLETE
```

The central principle is:

> **T1 tells the learner what must be accomplished, but does not tell them how to accomplish it.**

---

# 51. T1 Final Technical Specification

| Area                     | T1 Decision                      |
| ------------------------ | -------------------------------- |
| **Block**                | **TaskBlock**                    |
| **Version**              | **T1**                           |
| **Presentation**         | **Simple Task**                  |
| **Primary purpose**      | Accomplish one focused objective |
| **Objective**            | Required                         |
| **Requirements**         | Recommended                      |
| **Context**              | Optional                         |
| **Expected outcome**     | Recommended                      |
| **Completion criteria**  | Recommended                      |
| **Workspace**            | Optional / polymorphic           |
| **Guided steps**         | ❌                                |
| **Multiple stages**      | ❌                                |
| **Scenario complexity**  | ❌                                |
| **Debugging focus**      | ❌                                |
| **Challenge complexity** | ❌                                |
| **Real-world scope**     | ❌                                |
| **Validation**           | Recommended                      |
| **Retry**                | ✅                                |
| **Progress**             | Simple                           |
| **Quiz score**           | ❌                                |
| **Theme**                | Light                            |
| **Primary**              | **#F54A8D**                      |
| **Secondary**            | **#0B1B3D**                      |
| **Gradient**             | ❌                                |
| **Dark theme**           | ❌                                |
| **Responsive**           | ✅                                |
| **Accessible**           | ✅                                |
| **JSON-driven**          | ✅                                |

---

# 52. TaskBlock Progress

We have now defined the foundation:

```text
T1 — Simple Task
```

The full committed roadmap remains:

```text
T1 — Simple Task
        ↓
T2 — Guided Task
        ↓
T3 — Multi-Step Task
        ↓
T4 — Scenario Task
        ↓
T5 — Debugging Task
        ↓
T6 — Implementation Task
        ↓
T7 — Challenge Task
        ↓
T8 — Real-World Task
```

And the conceptual progression is:

```text
SIMPLE
  ↓
GUIDED
  ↓
MULTI-STEP
  ↓
SCENARIO
  ↓
DEBUG
  ↓
IMPLEMENT
  ↓
CHALLENGE
  ↓
REAL-WORLD
```

## **T1 — Simple Task: COMPLETE** ✅

We stop here.

The next version, only when you say **"yes please"**, will be:

> **T2 — Guided Task**.



```python

```

# BLOCK 14 — TaskBlock

## T2 — Guided Task

Yes. We continue with **only T2**, exactly one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| T1      | Simple Task         | ✅ Complete     |
| **T2**  | **Guided Task**     | 🔵 **CURRENT** |
| T3      | Multi-Step Task     | ⏳              |
| T4      | Scenario Task       | ⏳              |
| T5      | Debugging Task      | ⏳              |
| T6      | Implementation Task | ⏳              |
| T7      | Challenge Task      | ⏳              |
| T8      | Real-World Task     | ⏳              |

---

# 1. What Is T2 — Guided Task?

**T2 — Guided Task** asks the learner to accomplish a specific task while the system provides **structured guidance during the task**.

The distinction from T1 is:

```text
T1 — Simple Task
"What must I accomplish?"
        ↓
Learner determines how
```

versus:

```text
T2 — Guided Task
"What must I accomplish?"
        ↓
System provides guidance
        ↓
Learner accomplishes it
```

The key principle is:

> **T2 guides the learner toward completing a task, but the task itself remains the learner's responsibility.**

---

# 2. T2 Position in TaskBlock

```text
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

The progression is:

```text
SIMPLE
   ↓
GUIDED
   ↓
MULTI-STEP
   ↓
SCENARIO
   ↓
DEBUG
   ↓
IMPLEMENT
   ↓
CHALLENGE
   ↓
REAL-WORLD
```

---

# 3. T2 vs EX5 — Very Important

Both **EX5 Guided Exercise** and **T2 Guided Task** contain guidance.

But their purpose is different.

### EX5

> **Practice a specific skill through guided exercise.**

Example:

> Build a function that filters even numbers through five guided steps.

### T2

> **Accomplish a task with guidance.**

Example:

> Configure authorization so that only administrators can access the admin operation.

The difference is:

```text
EX5
Skill → Practice → Guided Exercise

T2
Objective → Guidance → Accomplishment
```

---

# 4. T2 Should Not Become an Exercise

Suppose the task is:

> Add validation for an invalid username.

The system might guide the learner:

```text
Hint 1:
First identify where the username enters the system.

Hint 2:
What should happen when the value is missing?

Hint 3:
Check the validation condition.
```

The learner still performs the task.

It should not become:

```text
Step 1
Fill this blank.

Step 2
Fill this blank.

Step 3
Predict this output.
```

That would be ExerciseBlock behavior.

---

# 5. T2 Core Learning Model

```text
                  TASK
                    │
                    ▼
              UNDERSTAND GOAL
                    │
                    ▼
               BEGIN WORK
                    │
                    ▼
              GUIDANCE AVAILABLE
                    │
                    ▼
              LEARNER ACTS
                    │
                    ▼
                VALIDATE
                    │
              ┌─────┴─────┐
              ▼           ▼
            FAIL         PASS
              │           │
              ▼           ▼
          MORE HELP    COMPLETE
              │
              ▼
          RETRY TASK
```

The guidance supports completion rather than replacing the learner's work.

---

# 6. T2 Example — Python

### Task

> Add validation to a function so that an empty username is rejected.

Existing code:

```python
def login(username, password):
    # existing logic
    pass
```

The learner must make the required change.

The system can provide guidance such as:

### Guidance 1

> Identify the input that must be validated before authentication continues.

### Guidance 2

> What should happen when the username is empty?

### Guidance 3

> Consider adding a guard condition before the existing authentication logic.

The learner implements the change.

---

# 7. T2 Example — Authorization

### Task

> Ensure an administrative operation is accessible only to users with the required permission.

The system might provide:

```text
Guidance

1. Identify the authorization boundary.
2. Determine what permission must be checked.
3. Consider what should happen when permission is missing.
4. Validate both authorized and unauthorized cases.
```

Notice that the guidance is about **how to think about the task**, not a line-by-line implementation.

---

# 8. T2 Guidance Levels

T2 should support progressive guidance.

### Level 1 — Objective Clarification

> What exactly must change?

### Level 2 — Conceptual Direction

> Which concept should you apply?

### Level 3 — Strategic Hint

> Consider validating the input before performing the operation.

### Level 4 — Strong Hint

> A guard condition can reject invalid input early.

### Level 5 — Optional Example

> Here is an example of the expected validation behavior.

The system should not normally provide the complete solution.

---

# 9. T2 Guidance Should Be Optional

The learner should ideally attempt the task first.

```text
TASK
  ↓
Try independently
  ↓
Need help?
  ↓
[ Show Guidance ]
```

This preserves independence.

---

# 10. T2 Guidance Panel

```text
┌─────────────────────────────────────────────┐
│ NEED HELP?                                  │
├─────────────────────────────────────────────┤
│ Guidance 1                                  │
│ Identify which input must be validated.     │
│                                             │
│ [ Show Guidance 2 ]                         │
└─────────────────────────────────────────────┘
```

When the learner requests more:

```text
┌─────────────────────────────────────────────┐
│ GUIDANCE                                    │
├─────────────────────────────────────────────┤
│ 1 ✓ Identify the input                      │
│ 2 ✓ Consider the invalid case               │
│ 3 ● Add an early validation check           │
│ 4 ○ Validate the final behavior             │
└─────────────────────────────────────────────┘
```

---

# 11. T2 Guidance Should Not Be Mandatory Steps

This is critical.

A T2 may have:

```text
Guidance 1
Guidance 2
Guidance 3
```

but the learner does **not** have to complete:

```text
Guidance 1
→ Guidance 2
→ Guidance 3
```

They are assistance mechanisms.

That differs from T3.

### T2

```text
Task
+
Optional guidance
```

### T3

```text
Step 1
→ Step 2
→ Step 3
```

---

# 12. T2 vs T3

This distinction must remain locked.

### T2 — Guided Task

```text
ONE TASK
+
GUIDANCE
```

### T3 — Multi-Step Task

```text
TASK
+
MULTIPLE REQUIRED STAGES
```

For example:

### T2

> Add role validation to this authorization operation.

Guidance may be available.

### T3

> Create a user → assign role → validate permissions → test access.

Those are multiple required stages.

---

# 13. T2 Task Anatomy

```text
Task Title
Objective
Context
Requirements
Workspace
Guidance
Expected Outcome
Validation
Completion
```

Example:

```text
┌──────────────────────────────────────────────┐
│ GUIDED TASK                                  │
├──────────────────────────────────────────────┤
│ OBJECTIVE                                    │
│ Add permission validation to the operation.  │
│                                              │
│ REQUIREMENTS                                 │
│ • Check required permission.                 │
│ • Reject unauthorized users.                 │
│ • Preserve authorized behavior.              │
│                                              │
│ YOUR WORK                                    │
│ [ Workspace ]                                │
│                                              │
│ NEED HELP?                                   │
│ [ Show Guidance ]                            │
│                                              │
│ [ Check Task ]                               │
└──────────────────────────────────────────────┘
```

---

# 14. T2 Example — Exception Handling

### Task

> Modify the function so invalid numeric input is handled safely.

Given:

```python
def convert_age(value):
    return int(value)
```

Requirements:

```text
• Valid values must continue working.
• Invalid values must not terminate the operation.
• Invalid values should return None.
```

Guidance:

```text
Hint 1
Which operation can fail?

Hint 2
Which exception represents an invalid integer conversion?

Hint 3
Consider protecting the conversion operation.
```

The learner performs the change.

---

# 15. T2 Example — Memory

### Task

> Modify the code so that changing one variable's list does not unexpectedly modify another variable's list.

Given:

```python
numbers = [1, 2, 3]
backup = numbers

numbers.append(4)
```

Expected outcome:

```text
Changing numbers should not unexpectedly change backup.
```

Guidance:

```text
Hint 1
Ask whether numbers and backup refer to the same object.

Hint 2
You need an independent list.

Hint 3
Consider creating a copy rather than another reference.
```

This is a very natural Guided Task.

---

# 16. T2 Example — Configuration

### Task

> Configure the application so that the development API endpoint is used by the development environment.

Requirements:

```text
• Development must use the development API.
• Production configuration must remain unchanged.
• The variable must be available to the application.
```

Guidance:

```text
Hint 1
Identify which environment controls development configuration.

Hint 2
Find the variable used by the application for the API endpoint.

Hint 3
Verify that the development environment receives the correct value.
```

The learner performs the configuration.

---

# 17. T2 Example — Diagram

### Task

> Add the missing authorization check to the authentication flow diagram.

Guidance:

```text
Hint 1
Authentication establishes identity.

Hint 2
Authorization determines whether that identity may perform an action.

Hint 3
The authorization check should occur before the protected operation.
```

The learner modifies the diagram.

This demonstrates that T2 is not limited to coding.

---

# 18. T2 Workspace Types

T2 can support:

```text
Code
Configuration
Diagram
Text
Terminal
Database
Architecture
Generic
```

Example:

```json
{
  "workspace": {
    "type": "diagram"
  }
}
```

or:

```json
{
  "workspace": {
    "type": "code",
    "language": "python"
  }
}
```

---

# 19. T2 Validation

Validation should confirm whether the task objective has been achieved.

Possible modes:

```text
behavioral
structural
schema
visual
manual
test-suite
```

For code:

```text
Run tests
```

For configuration:

```text
Validate schema
```

For a diagram:

```text
Validate required components
```

---

# 20. T2 Feedback

When the learner fails:

```text
Task not complete.

The authorization check is still allowing
users without the required permission.
```

This should explain the failed **requirement**.

It should not automatically give the implementation.

---

# 21. T2 Success Feedback

```text
✓ Task completed

The authorization operation now rejects
users who do not have the required permission.
```

The result focuses on accomplishment.

---

# 22. T2 Guidance Usage Analytics

Useful metrics:

```text
guidanceOpened
guidanceLevelReached
attempts
timeSpent
validationFailures
completed
```

Example:

```json
{
  "taskAnalytics": {
    "attempts": 2,
    "guidanceOpened": true,
    "highestGuidanceLevel": 2,
    "validationFailures": 1,
    "completed": true
  }
}
```

This can later help identify tasks that are too difficult.

---

# 23. T2 Guidance Dependency

An important metric is:

> **Did the learner complete the task without guidance?**

For example:

```text
Attempt 1
No guidance
✓ Complete
```

versus:

```text
Attempt 1
Guidance 1
Guidance 2
Guidance 3
✓ Complete
```

Both are successful, but they represent different levels of independence.

---

# 24. T2 Completion Model

```text
NOT_STARTED
     ↓
IN_PROGRESS
     ↓
CHECKING
     │
 ┌───┴────┐
 ▼        ▼
FAIL     PASS
 │        │
 ▼        ▼
RETRY   COMPLETE
```

Guidance does not create additional completion states.

---

# 25. T2 JSON Structure

```json
{
  "type": "task",
  "version": "T2",
  "presentation": "Guided Task",

  "content": {
    "title": "",
    "objective": "",
    "context": "",
    "requirements": [],
    "expectedOutcome": "",
    "completionCriteria": []
  },

  "workspace": {
    "type": ""
  },

  "guidance": {
    "enabled": true,
    "levels": []
  },

  "validation": {
    "mode": "",
    "tests": []
  },

  "metadata": {
    "difficulty": "",
    "estimatedMinutes": 0
  }
}
```

---

# 26. Complete T2 JSON Example

```json
{
  "type": "task",
  "version": "T2",
  "presentation": "Guided Task",

  "content": {
    "title": "Protect the Administrative Operation",

    "objective": "Modify the authorization logic so that only users with the required administrative permission can perform the operation.",

    "context": "The application currently allows authenticated users to reach the administrative operation without checking the required permission.",

    "requirements": [
      "Authenticated users must still be able to reach normal operations.",
      "Users without the required administrative permission must be rejected.",
      "Users with the required permission must be allowed.",
      "The existing authorized behavior must remain intact."
    ],

    "expectedOutcome": "The administrative operation is accessible only to appropriately authorized users.",

    "completionCriteria": [
      "Unauthorized users are rejected.",
      "Authorized users are allowed.",
      "Normal authenticated behavior is preserved."
    ]
  },

  "workspace": {
    "type": "code",
    "language": "python",
    "starterCode": "def can_access_admin(user):\n    # Existing authorization logic\n    return user.get('authenticated', False)\n"
  },

  "guidance": {
    "enabled": true,

    "levels": [
      {
        "level": 1,
        "title": "Identify the missing requirement",
        "text": "The current logic checks authentication. What additional condition determines whether the user may access the administrative operation?"
      },
      {
        "level": 2,
        "title": "Think about permissions",
        "text": "The decision should depend on whether the user has the required administrative permission."
      },
      {
        "level": 3,
        "title": "Consider the decision order",
        "text": "Authentication establishes who the user is. Authorization determines whether that authenticated user has permission to perform the operation."
      }
    ]
  },

  "validation": {
    "mode": "behavioral",

    "tests": [
      {
        "description": "Unauthenticated user is rejected.",
        "visible": true
      },
      {
        "description": "Authenticated user without administrative permission is rejected.",
        "visible": true
      },
      {
        "description": "Authenticated user with administrative permission is allowed.",
        "visible": true
      }
    ]
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 10
  }
}
```

---

# 27. T2 Guidance Authoring Rules

Guidance should:

```text
✓ Help the learner think
✓ Point toward the relevant concept
✓ Become progressively more specific
✓ Preserve learner responsibility
✓ Avoid giving the complete implementation
```

Avoid:

```text
❌ Giving the exact code immediately
❌ Turning guidance into mandatory steps
❌ Explaining the entire solution before the learner attempts it
❌ Providing unrelated hints
```

---

# 28. T2 Guidance vs Solution

The boundary should be:

```text
GUIDANCE
"What should you think about?"

SOLUTION
"Here is exactly what you should implement."
```

T2 provides the first.

The second should generally be reserved for:

* reference solution
* explanation after completion
* explicit solution reveal

---

# 29. T2 Optional Solution Reveal

A solution can be available after repeated difficulty:

```text
Need more help?

[ Show Guidance ]

[ Reveal Solution ]
```

But the solution reveal should be clearly separated from ordinary guidance.

Example:

```text
Guidance Level 1
Guidance Level 2
Guidance Level 3

──────────────

Still stuck?

[ Reveal Solution ]
```

---

# 30. T2 Relationship to Teaching

T2 should assume the concept has already been taught.

The flow is:

```text
Tutorial Content
       ↓
Learner understands concept
       ↓
T2
       ↓
Apply concept to accomplish task
```

It is therefore not primarily an explanation block.

---

# 31. T2 Relationship to ExerciseBlock

A useful distinction:

```text
ExerciseBlock
"What can you practice?"

TaskBlock
"What can you accomplish?"
```

Example:

### EX5

> Practice filtering a list by building the solution step by step.

### T2

> Modify the existing user-processing function so inactive users are excluded.

The second has a concrete change to accomplish.

---

# 32. T2 Relationship to T3

T2:

```text
One objective
+
guidance
```

T3:

```text
Multiple required objectives
+
ordered stages
```

Example:

```text
T2:
Add role validation.

T3:
1. Add user role
2. Validate role
3. Assign permissions
4. Verify authorization
```

---

# 33. T2 Relationship to T4

T2 focuses on **guidance**.

T4 focuses on **context**.

```text
T2
Task
 ↓
Guidance

T4
Scenario
 ↓
Decision
 ↓
Task
```

A T4 might tell a realistic story and require the learner to determine what should be done.

---

# 34. T2 Relationship to T5

T2:

> Make this change.

T5:

> Find and correct the problem.

The difference is intent.

```text
T2
Accomplish

T5
Diagnose + Correct
```

---

# 35. T2 Relationship to T6

T2:

> Modify or configure something to achieve a defined objective.

T6:

> Implement a defined component/system from its requirements.

T6 has stronger implementation ownership.

---

# 36. T2 Relationship to T7

T2 provides guidance.

T7 intentionally reduces guidance and increases complexity.

```text
T2
Guided accomplishment

T7
Independent challenge
```

---

# 37. T2 Relationship to T8

T2 may use realistic examples.

But T8 is explicitly:

> **Real-World Task**

T8 should resemble an actual professional responsibility rather than a small guided learning task.

---

# 38. T2 UI — Final Concept

```text
┌──────────────────────────────────────────────────┐
│ TASK                                             │
│ Guided Task                                      │
├──────────────────────────────────────────────────┤
│                                                  │
│ OBJECTIVE                                        │
│ Protect the administrative operation.            │
│                                                  │
│ REQUIREMENTS                                     │
│ • Authentication must remain valid.              │
│ • Permission must be checked.                   │
│ • Unauthorized users must be rejected.           │
│                                                  │
│ WORKSPACE                                        │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │              Learner workspace               │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ NEED HELP?                                       │
│ [ Guidance 1 ]                                  │
│                                                  │
│ [ Check Task ]                                  │
└──────────────────────────────────────────────────┘
```

---

# 39. T2 Final Mental Model

```text
                     T2
                GUIDED TASK
                     │
                     ▼
                  OBJECTIVE
                     │
                     ▼
              LEARNER STARTS
                     │
                     ▼
              NEEDS GUIDANCE?
                 │       │
                NO      YES
                 │       │
                 │       ▼
                 │    GUIDANCE
                 │       │
                 └───┬───┘
                     ▼
                 LEARNER ACTS
                     │
                     ▼
                  VALIDATE
                     │
                ┌────┴────┐
                ▼         ▼
              FAIL       PASS
                │         │
                ▼         ▼
              RETRY    COMPLETE
```

---

# 40. T2 Final Technical Specification

| Area                         | T2 Decision                                |
| ---------------------------- | ------------------------------------------ |
| **Block**                    | **TaskBlock**                              |
| **Version**                  | **T2**                                     |
| **Presentation**             | **Guided Task**                            |
| **Primary purpose**          | Accomplish a task with structured guidance |
| **Objective**                | Required                                   |
| **Requirements**             | Recommended                                |
| **Guidance**                 | ✅                                          |
| **Guidance levels**          | Recommended                                |
| **Guidance mandatory**       | ❌                                          |
| **Implementation steps**     | ❌                                          |
| **Multiple required stages** | ❌                                          |
| **Scenario complexity**      | ❌                                          |
| **Debugging focus**          | ❌                                          |
| **Challenge complexity**     | ❌                                          |
| **Real-world scope**         | ❌                                          |
| **Workspace**                | Polymorphic                                |
| **Validation**               | Recommended                                |
| **Retry**                    | ✅                                          |
| **Solution reveal**          | Optional                                   |
| **Guidance analytics**       | ✅                                          |
| **Quiz score**               | ❌                                          |
| **Theme**                    | Light                                      |
| **Primary**                  | **#F54A8D**                                |
| **Secondary**                | **#0B1B3D**                                |
| **Gradient**                 | ❌                                          |
| **Dark theme**               | ❌                                          |
| **Responsive**               | ✅                                          |
| **Accessible**               | ✅                                          |
| **JSON-driven**              | ✅                                          |

---

# 41. TaskBlock Progress

We now have:

```text
T1 — Simple Task
        ↓
T2 — Guided Task
```

The conceptual progression is:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
```

The next version is:

> **T3 — Multi-Step Task**

T3 will introduce **multiple required stages of accomplishment**, which is deliberately different from the optional guidance model of T2.

## **T2 — Guided Task: COMPLETE** ✅



```python

```

# BLOCK 14 — TaskBlock

## T3 — Multi-Step Task

Yes. We continue with **only T3**, one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| T1      | Simple Task         | ✅ Complete     |
| T2      | Guided Task         | ✅ Complete     |
| **T3**  | **Multi-Step Task** | 🔵 **CURRENT** |
| T4      | Scenario Task       | ⏳              |
| T5      | Debugging Task      | ⏳              |
| T6      | Implementation Task | ⏳              |
| T7      | Challenge Task      | ⏳              |
| T8      | Real-World Task     | ⏳              |

---

# 1. What Is T3 — Multi-Step Task?

**T3 — Multi-Step Task** asks the learner to accomplish a larger objective that contains **multiple required stages**.

The key difference from T1 and T2 is:

> **The task cannot be considered complete until all required stages have been accomplished.**

The structure is:

```text id="5o7k3p"
OVERALL OBJECTIVE
       ↓
STEP 1
       ↓
STEP 2
       ↓
STEP 3
       ↓
STEP 4
       ↓
FINAL VERIFICATION
       ↓
COMPLETE
```

The important point is that these are **actual task stages**, not merely hints.

---

# 2. T3 vs T2

This distinction must remain locked.

### T2 — Guided Task

```text id="w0bqcn"
ONE TASK
   +
OPTIONAL GUIDANCE
```

Guidance helps the learner, but it is not itself part of the completion sequence.

### T3 — Multi-Step Task

```text id="yxx1wm"
ONE OVERALL TASK
   +
MULTIPLE REQUIRED STAGES
```

Each stage contributes to the final outcome.

---

# 3. T3 vs EX5

This distinction is equally important.

### EX5 — Guided Exercise

The learner practices a skill through guided exercise steps.

```text id="n0j1mw"
Skill
 ↓
Practice
 ↓
Guided steps
```

### T3 — Multi-Step Task

The learner accomplishes a larger objective through required stages.

```text id="3wj4yq"
Objective
 ↓
Task Stage 1
 ↓
Task Stage 2
 ↓
Task Stage 3
 ↓
Deliverable
```

Therefore:

> **Exercise steps teach/practice. Task steps accomplish.**

---

# 4. T3 Example

Suppose the overall task is:

> **Prepare a user for administrative access.**

The stages might be:

```text id="3c4q1a"
Step 1
Create the user

      ↓

Step 2
Assign the required role

      ↓

Step 3
Verify permissions

      ↓

Step 4
Test administrative access
```

The task is complete only after all four stages succeed.

---

# 5. T3 Core Learning Model

```text id="mbg20d"
                  TASK
                    │
                    ▼
              DEFINE OBJECTIVE
                    │
                    ▼
                 STEP 1
                    │
                 VERIFY
                    │
                    ▼
                 STEP 2
                    │
                 VERIFY
                    │
                    ▼
                 STEP 3
                    │
                 VERIFY
                    │
                    ▼
                 STEP N
                    │
               FINAL CHECK
                    │
                    ▼
                COMPLETE
```

---

# 6. T3 Steps Are Required

This is the defining characteristic.

For example:

```text id="zqk3as"
✓ Step 1 — Create user
✓ Step 2 — Assign role
● Step 3 — Verify permission
○ Step 4 — Test access
```

The learner cannot declare the overall task complete while Step 3 or Step 4 remains incomplete.

---

# 7. T3 Step Dependencies

Steps can be sequential.

For example:

```text id="1g7c93"
Step 1
Create user
    ↓
Step 2
Assign role
    ↓
Step 3
Verify role
    ↓
Step 4
Test access
```

This is appropriate when later stages depend on earlier stages.

---

# 8. T3 Can Also Have Independent Steps

Not every Multi-Step Task requires strict dependencies.

For example:

> Prepare a tutorial release.

```text id="g1m2pb"
Step 1
Validate content

Step 2
Validate metadata

Step 3
Check links

Step 4
Review publishing settings
```

These may be completed in any order.

Therefore T3 should support:

```text id="c3u9i7"
sequential
```

and:

```text id="3j8q4f"
flexible
```

progression.

Default should depend on the task.

---

# 9. T3 Step Dependency Model

```json id="wqj4h7"
{
  "progression": {
    "mode": "sequential"
  }
}
```

or:

```json id="01d07a"
{
  "progression": {
    "mode": "flexible"
  }
}
```

For most dependent tasks:

> **Sequential is the recommended default.**

---

# 10. T3 Step Anatomy

Each required task stage can contain:

```text id="v2ey5n"
Step Title
Objective
Instructions
Workspace
Expected Outcome
Validation
Completion Criteria
```

Example:

```text id="1y4b0q"
STEP 2 — Assign Role

Objective:
Assign the administrator role to the new user.

Workspace:
User configuration

Expected Outcome:
The user has the required role.

Validation:
Role exists and is correctly associated.
```

---

# 11. T3 Should Not Become Over-Guided

A Multi-Step Task can tell the learner:

> "Step 2: Assign the administrator role."

But it does not necessarily need to explain:

> "Click this button, select this dropdown, then type this value."

That would introduce detailed procedural guidance.

So:

```text id="m9nq0n"
T3
→ Required task stages

T2
→ Guidance about accomplishing a task
```

---

# 12. T3 Example — Authentication Workflow

### Overall Task

> Configure and verify a basic authentication flow.

Required stages:

```text id="qrxv4e"
Step 1
Configure user credentials

      ↓

Step 2
Implement credential validation

      ↓

Step 3
Handle invalid credentials

      ↓

Step 4
Verify successful authentication
```

The learner accomplishes the entire workflow.

---

# 13. T3 Example — Authorization Workflow

### Overall Task

> Configure access for an administrative user.

Stages:

```text id="9k5qgi"
1. Create user
2. Assign role
3. Assign permissions
4. Verify authorization
5. Test unauthorized access
```

This is a classic Multi-Step Task.

---

# 14. T3 Example — Python Task

### Overall Task

> Build a small user-processing workflow.

Stages:

```text id="5quqag"
1. Create sample users
2. Filter active users
3. Identify administrators
4. Validate the result
```

The learner is accomplishing one broader task through several required stages.

---

# 15. T3 Example — Exception Handling

### Overall Task

> Make a data-processing function safely handle invalid input.

Stages:

```text id="g4f1l4"
1. Identify the failing operation
2. Add exception handling
3. Handle the expected exception
4. Preserve successful behavior
5. Test invalid and valid inputs
```

The important distinction is that these are **task stages**, not simply explanation sections.

---

# 16. T3 Example — Memory

### Overall Task

> Correct an unintended shared-list mutation.

Stages:

```text id="c1xy1e"
1. Identify the shared reference
2. Modify the implementation
3. Create independent state
4. Verify mutation behavior
```

The final deliverable is the corrected behavior.

---

# 17. T3 Example — Configuration

### Overall Task

> Prepare a development environment for local API testing.

Stages:

```text id="qz0u4e"
1. Configure API endpoint
2. Configure required environment variable
3. Verify application reads configuration
4. Test API connectivity
```

This is a task because the learner is preparing something usable.

---

# 18. T3 Overall Progress UI

```text id="jyjvxy"
┌──────────────────────────────────────────────┐
│ MULTI-STEP TASK                              │
│ Prepare Development Environment              │
├──────────────────────────────────────────────┤
│                                              │
│ ✓ Step 1 — Configure API Endpoint            │
│ ✓ Step 2 — Configure Environment             │
│ ● Step 3 — Verify Application                │
│ ○ Step 4 — Test Connectivity                 │
│                                              │
│ Progress: 2 / 4                              │
└──────────────────────────────────────────────┘
```

The learner always knows:

> **What has been completed and what remains?**

---

# 19. T3 Current Step Workspace

```text id="4w6r3q"
┌──────────────────────────────────────────────┐
│ STEP 3 OF 4                                  │
│ Verify Application Configuration             │
├──────────────────────────────────────────────┤
│                                              │
│ OBJECTIVE                                    │
│ Confirm that the application reads the       │
│ configured development endpoint.             │
│                                              │
│ WORKSPACE                                    │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │          Task workspace                  │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [ Check Step ]                               │
└──────────────────────────────────────────────┘
```

---

# 20. T3 Step Completion

Each stage can have its own validation.

```text id="5u7a8j"
Step 1
    ↓
Validate
    ↓
✓ Complete
    ↓
Step 2
```

This is especially useful for long tasks.

---

# 21. T3 Final Validation

Even if every individual stage passes, the overall task should normally have a final verification.

```text id="7r3h8n"
Step 1 ✓
Step 2 ✓
Step 3 ✓
Step 4 ✓
     ↓
FINAL VALIDATION
     ↓
COMPLETE
```

This ensures the complete result works as intended.

---

# 22. T3 Step State Model

```text id="p6x1ha"
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

For flexible mode:

```text id="g83b0v"
AVAILABLE
   ↓
ACTIVE
   ↓
COMPLETED
```

Multiple steps can remain available.

---

# 23. T3 Overall State Model

```text id="k1o4x8"
NOT_STARTED
     ↓
IN_PROGRESS
     ↓
STEP_PROGRESS
     ↓
FINAL_VALIDATION
     │
 ┌───┴────┐
 ▼        ▼
FAIL     PASS
 │        │
 ▼        ▼
RETRY   COMPLETED
```

---

# 24. T3 Step Types

Each task step can use different workspace types.

```text id="o4e2kx"
Step 1 → Configuration
Step 2 → Code
Step 3 → Diagram
Step 4 → Test
```

This makes T3 more powerful than simply a sequence of code edits.

---

# 25. T3 Example — Full Authentication Task

## Overall Task

> Configure and verify a protected administrative operation.

### Step 1 — Configure Identity

```text
Create/configure the authenticated identity.
```

### Step 2 — Configure Authorization

```text
Assign the required administrative permission.
```

### Step 3 — Protect Operation

```text
Ensure the operation checks authorization.
```

### Step 4 — Test Authorized Access

```text
Verify the authorized user can proceed.
```

### Step 5 — Test Unauthorized Access

```text
Verify an unauthorized user is rejected.
```

### Final Result

```text
Protected administrative operation
```

This is a complete task rather than a single exercise.

---

# 26. T3 Step Dependencies

Dependencies can be explicitly represented.

```json id="e7x7vq"
{
  "id": "step-3",
  "dependsOn": [
    "step-1",
    "step-2"
  ]
}
```

Then the UI can prevent Step 3 from becoming active until the dependencies are complete.

---

# 27. T3 Dependency Graph

```text id="h5m1b4"
Step 1
   │
   ▼
Step 2
   │
   ▼
Step 3
   │
 ┌─┴─┐
 ▼   ▼
Step 4  Step 5
 └──┬──┘
    ▼
 Final Validation
```

This is useful for more complex Multi-Step Tasks.

---

# 28. T3 Sequential vs Dependency-Based

For simple tasks:

```text id="db4l6m"
Step 1
 ↓
Step 2
 ↓
Step 3
 ↓
Step 4
```

For complex tasks:

```text id="4e0k8w"
Step 1 ──┐
         ├──> Step 3
Step 2 ──┘
            ↓
         Step 4
```

The data model should support both without forcing the UI to become unnecessarily complex.

---

# 29. T3 Guidance

T3 can still have hints, but guidance is secondary.

The defining characteristic is:

> **Multiple required task stages.**

Therefore:

```text id="g4c4go"
T2
Guidance is central.

T3
Task progression is central.
```

A step may have:

```text
[ Need Help? ]
```

but the step itself remains a required task stage.

---

# 30. T3 Example With Guidance

```text id="t5m7ca"
Step 2 — Configure Permission

Objective:
Assign the required permission.

Need help?

[ Show Hint ]

Hint:
Identify the permission that protects
the administrative operation.
```

The learner can use the hint, but Step 2 must still be completed.

---

# 31. T3 Task Progress

Recommended display:

```text id="s2agq8"
TASK PROGRESS

1 ✓ Complete
2 ✓ Complete
3 ● In Progress
4 ○ Locked
5 ○ Locked

60%
```

Both textual status and percentage can be displayed.

---

# 32. T3 Completion Criteria

Overall completion could require:

```text id="8a5t7j"
all required steps complete
+
final validation passes
```

Example:

```json id="aj80z7"
{
  "completion": {
    "requiredSteps": "all",
    "finalValidation": true
  }
}
```

---

# 33. T3 Partial Completion

If the learner stops after Step 3:

```text id="2tqj5k"
Step 1 ✓
Step 2 ✓
Step 3 ✓
Step 4 ●
Step 5 ○
```

The system should persist the state.

When they return:

> **Resume Step 4**

This is important for larger tasks.

---

# 34. T3 Persistence Model

```json id="y0v8c8"
{
  "taskProgress": {
    "currentStep": "step-4",
    "completedSteps": [
      "step-1",
      "step-2",
      "step-3"
    ]
  }
}
```

---

# 35. T3 Validation Example

For an authorization workflow:

```text id="qj0f2c"
Step 1
Identity exists
✓

Step 2
Permission assigned
✓

Step 3
Protected operation
✓

Step 4
Authorized request
✓

Step 5
Unauthorized request
✗
```

The task remains incomplete.

---

# 36. T3 Failure Handling

The learner should be told which stage failed.

Example:

```text id="b8p7mz"
Step 5 failed.

Expected:
Unauthorized requests should be rejected.

Observed:
The request was allowed.
```

The learner returns to Step 5 and corrects the problem.

---

# 37. T3 Step Retry

A failed step can usually be retried without resetting the entire task.

```text id="d8x0ot"
Step 5
   ↓
FAIL
   ↓
Correct
   ↓
RETRY
   ↓
PASS
```

Previous successful stages remain complete unless the task explicitly defines dependency invalidation.

---

# 38. T3 Dependency Invalidation

For some tasks, changing an earlier step can invalidate later steps.

Example:

```text id="z5z0q6"
Step 2 configuration changed
        ↓
Step 3 verification may be stale
        ↓
Re-run Step 3
```

This can be represented as:

```json id="pf0n3h"
{
  "invalidates": [
    "step-3",
    "step-4"
  ]
}
```

This is useful for technical tasks.

---

# 39. T3 JSON Structure

```json id="7e0nmi"
{
  "type": "task",
  "version": "T3",
  "presentation": "Multi-Step Task",

  "content": {
    "title": "",
    "objective": "",
    "context": "",
    "requirements": [],
    "steps": []
  },

  "progression": {
    "mode": "sequential"
  },

  "validation": {
    "finalValidation": {}
  },

  "completion": {
    "requiredSteps": "all",
    "finalValidation": true
  },

  "metadata": {
    "difficulty": "",
    "estimatedMinutes": 0
  }
}
```

---

# 40. Complete T3 JSON Example

```json id="d7d5c8"
{
  "type": "task",
  "version": "T3",
  "presentation": "Multi-Step Task",

  "content": {
    "title": "Protect an Administrative Operation",

    "objective": "Configure and verify authorization for an administrative operation.",

    "context": "The application has authenticated users and an administrative operation that must only be available to appropriately authorized users.",

    "requirements": [
      "An authenticated identity must exist.",
      "The required administrative permission must be assigned.",
      "The protected operation must enforce authorization.",
      "Authorized users must be allowed.",
      "Unauthorized users must be rejected."
    ],

    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Prepare the Identity",
        "objective": "Create or configure the authenticated user required for the task.",
        "workspace": {
          "type": "code"
        },
        "validation": {
          "mode": "structural"
        }
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Assign Permission",
        "objective": "Assign the required administrative permission to the user.",
        "workspace": {
          "type": "configuration"
        },
        "validation": {
          "mode": "structural"
        }
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Protect the Operation",
        "objective": "Ensure that the administrative operation checks authorization.",
        "dependsOn": [
          "step-1",
          "step-2"
        ],
        "workspace": {
          "type": "code"
        },
        "validation": {
          "mode": "behavioral"
        }
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Verify Authorized Access",
        "objective": "Confirm that the authorized user can perform the operation.",
        "dependsOn": [
          "step-3"
        ],
        "workspace": {
          "type": "test"
        },
        "validation": {
          "mode": "behavioral"
        }
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Verify Unauthorized Access",
        "objective": "Confirm that a user without the required permission is rejected.",
        "dependsOn": [
          "step-3"
        ],
        "workspace": {
          "type": "test"
        },
        "validation": {
          "mode": "behavioral"
        }
      }
    ]
  },

  "progression": {
    "mode": "sequential"
  },

  "validation": {
    "finalValidation": {
      "mode": "behavioral",
      "description": "Verify both authorized and unauthorized access behavior."
    }
  },

  "completion": {
    "requiredSteps": "all",
    "finalValidation": true
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 25
  }
}
```

---

# 41. T3 Step UI

```text id="m1c9pu"
┌──────────────────────────────────────────────┐
│ STEP 2 OF 5                                  │
│ Assign Permission                             │
├──────────────────────────────────────────────┤
│                                              │
│ OBJECTIVE                                    │
│ Assign the required administrative permission│
│ to the user.                                 │
│                                              │
│ REQUIREMENT                                  │
│ The user must be authorized to perform the   │
│ administrative operation.                    │
│                                              │
│ WORKSPACE                                    │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │          Configuration Workspace         │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [ Check Step ]                               │
└──────────────────────────────────────────────┘
```

---

# 42. T3 Navigation

Recommended controls:

```text id="umh4au"
[ Previous Step ]
[ Check Step ]
[ Next Step ]
```

The next button should only unlock when the current required step passes in sequential mode.

---

# 43. T3 Final Completion UI

```text id="8qv3dv"
┌──────────────────────────────────────────────┐
│ ✓ TASK COMPLETE                              │
├──────────────────────────────────────────────┤
│                                              │
│ Protect an Administrative Operation          │
│                                              │
│ ✓ Identity prepared                          │
│ ✓ Permission assigned                        │
│ ✓ Operation protected                        │
│ ✓ Authorized access verified                 │
│ ✓ Unauthorized access rejected               │
│                                              │
│ Final validation: PASSED                     │
│                                              │
│ [ Continue ]                                 │
└──────────────────────────────────────────────┘
```

---

# 44. T3 Analytics

Useful metrics:

```text id="f4kq9b"
taskStarted
stepsStarted
stepsCompleted
currentStep
stepAttempts
stepFailures
stepTime
taskTime
finalValidation
completed
```

Example:

```json id="q2k0y4"
{
  "taskAnalytics": {
    "stepsCompleted": 5,
    "totalSteps": 5,
    "stepAttempts": {
      "step-1": 1,
      "step-2": 2,
      "step-3": 1,
      "step-4": 1,
      "step-5": 2
    },
    "completed": true
  }
}
```

---

# 45. T3 Mastery Signal

T3 provides a different signal from EX6/EX7.

It demonstrates:

> **Can the learner complete a workflow consisting of several connected accomplishments?**

For example:

```text id="k5m9d3"
Configure
   ↓
Modify
   ↓
Verify
   ↓
Test
```

That is closer to real technical work than a single isolated coding problem.

---

# 46. T3 Accessibility

Each step should expose:

```text id="w4p5td"
Step number
Step title
Current state
Objective
Workspace
Validation result
Navigation
```

Example announcement:

> "Step 3 of 5, Protect the Operation, active."

On completion:

> "Step 3 completed. Step 4 is now available."

This makes the progression understandable without relying on visual indicators.

---

# 47. T3 Responsive Design

### Desktop

```text id="0ts1qs"
┌────────────────────────────┬─────────────────────┐
│ Current Task Step          │ Task Progress       │
│                            │                     │
│ Objective                 │ ✓ Step 1            │
│ Workspace                 │ ✓ Step 2            │
│ Validation                │ ● Step 3            │
│                            │ ○ Step 4            │
│                            │ ○ Step 5            │
└────────────────────────────┴─────────────────────┘
```

### Mobile

```text id="1x3v9f"
Task Progress
      ↓
Current Step
      ↓
Objective
      ↓
Workspace
      ↓
Check Step
      ↓
Next Step
```

---

# 48. T3 Authoring Rules

A strong T3 should:

```text id="w7t3b1"
✓ Have one overall objective
✓ Break that objective into meaningful stages
✓ Make each stage accomplish something
✓ Define dependencies when necessary
✓ Validate each important stage
✓ Preserve progress
✓ Perform final validation
✓ Make the remaining work obvious
```

Avoid:

```text id="y5t8ah"
❌ Turning every tiny action into a step
❌ Using steps merely as explanations
❌ Making steps unrelated
❌ Providing excessive guidance
❌ Creating a full project
```

---

# 49. T3 Step Granularity

A step should represent a **meaningful accomplishment**.

Good:

> Configure the required authorization permission.

Bad:

> Open the settings page.

Bad:

> Click the permissions tab.

Bad:

> Click the dropdown.

Those are UI instructions, not meaningful task stages.

The correct abstraction is:

```text id="5ov1gv"
TASK STAGE
=
Meaningful learner accomplishment
```

---

# 50. T3 Complexity Boundary

T3 can contain multiple stages, but it should not become an enormous project.

A useful guideline:

```text id="j4g7hx"
T1
1 accomplishment

T2
1 accomplishment + guidance

T3
3–7 meaningful accomplishments

T4+
More contextual/complex task behavior
```

The exact number can vary.

Quality of stages matters more than quantity.

---

# 51. T3 Relationship to T4

The next version introduces scenario.

### T3

> Configure a protected administrative operation using these defined requirements.

### T4

> You are onboarding a new administrator into a production application. Determine and perform the appropriate authorization changes while considering the situation described.

The T4 learner must reason within a **scenario**, not simply execute a predefined multi-stage workflow.

---

# 52. T3 Final Mental Model

```text id="1yxqv6"
                         T3
                MULTI-STEP TASK
                         │
                         ▼
                  OVERALL OBJECTIVE
                         │
                         ▼
                     STEP 1
                         │
                     VERIFY
                         │
                         ▼
                     STEP 2
                         │
                     VERIFY
                         │
                         ▼
                     STEP 3
                         │
                     VERIFY
                         │
                         ▼
                     STEP N
                         │
                 FINAL VALIDATION
                         │
                         ▼
                     COMPLETE
```

The defining principle is:

> **One objective, multiple required accomplishments.**

---

# 53. T3 Final Technical Specification

| Area                           | T3 Decision                                   |
| ------------------------------ | --------------------------------------------- |
| **Block**                      | **TaskBlock**                                 |
| **Version**                    | **T3**                                        |
| **Presentation**               | **Multi-Step Task**                           |
| **Primary purpose**            | Accomplish a workflow through required stages |
| **Overall objective**          | Required                                      |
| **Steps**                      | Required                                      |
| **Step completion**            | Required                                      |
| **Step validation**            | Recommended                                   |
| **Step dependencies**          | Supported                                     |
| **Sequential progression**     | Default                                       |
| **Flexible progression**       | Supported                                     |
| **Final validation**           | Recommended                                   |
| **Guidance**                   | Optional                                      |
| **Guidance as core mechanism** | ❌                                             |
| **Scenario-based reasoning**   | ❌                                             |
| **Debugging focus**            | ❌                                             |
| **Challenge-level complexity** | ❌                                             |
| **Real-world scope**           | ❌                                             |
| **Progress persistence**       | ✅                                             |
| **Retry**                      | ✅                                             |
| **Workspace**                  | Polymorphic                                   |
| **Quiz score**                 | ❌                                             |
| **Theme**                      | Light                                         |
| **Primary**                    | **#F54A8D**                                   |
| **Secondary**                  | **#0B1B3D**                                   |
| **Gradient**                   | ❌                                             |
| **Dark theme**                 | ❌                                             |
| **Responsive**                 | ✅                                             |
| **Accessible**                 | ✅                                             |
| **JSON-driven**                | ✅                                             |

---

# 54. TaskBlock Progress

We now have:

```text id="2a2e72"
T1 — Simple Task
        ↓
T2 — Guided Task
        ↓
T3 — Multi-Step Task
```

The conceptual progression is:

```text id="0omqph"
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
```

The next version is:

> **T4 — Scenario Task**

T4 will introduce **realistic contextual situations and decision-making**, which is deliberately different from T3's predefined workflow.

## **T3 — Multi-Step Task: COMPLETE** ✅



```python

```

# BLOCK 14 — TaskBlock

## T4 — Scenario Task

Yes. We continue with **only T4**, one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| T1      | Simple Task         | ✅ Complete     |
| T2      | Guided Task         | ✅ Complete     |
| T3      | Multi-Step Task     | ✅ Complete     |
| **T4**  | **Scenario Task**   | 🔵 **CURRENT** |
| T5      | Debugging Task      | ⏳              |
| T6      | Implementation Task | ⏳              |
| T7      | Challenge Task      | ⏳              |
| T8      | Real-World Task     | ⏳              |

---

# 1. What Is T4 — Scenario Task?

**T4 — Scenario Task** places the learner inside a **specific situation** and asks them to accomplish an objective within that situation.

The key difference from T3 is:

> **T3 gives the learner a defined workflow. T4 gives the learner a situation in which they must understand the context and decide what action is appropriate.**

The core model is:

```text id="1o9j5c"
SCENARIO
   ↓
UNDERSTAND SITUATION
   ↓
IDENTIFY THE PROBLEM / GOAL
   ↓
DECIDE WHAT TO DO
   ↓
PERFORM THE TASK
   ↓
VERIFY OUTCOME
```

---

# 2. T4 Position in TaskBlock

```text id="0xk8p4"
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

The progression now becomes:

```text id="2p4g7n"
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
ACCOMPLISH WITHIN A SCENARIO
```

---

# 3. What Makes T4 Different?

T4 introduces **contextual decision-making**.

A normal task might say:

> Add an admin permission to the user.

A Scenario Task might say:

> A new employee has joined the security team. They need access to the administration dashboard, but they should not receive permissions that allow them to manage billing. Configure the user's access appropriately.

Now the learner must think about:

```text id="e5u9cv"
Who is the user?
       ↓
What do they need?
       ↓
What should they NOT have?
       ↓
Which permission/role is appropriate?
       ↓
Perform the task
```

That contextual reasoning is the defining characteristic of T4.

---

# 4. T4 vs T3

This distinction must remain locked.

### T3 — Multi-Step Task

The workflow is explicitly defined:

```text id="7x6x8k"
Step 1
Create user

Step 2
Assign role

Step 3
Verify permission

Step 4
Test access
```

### T4 — Scenario Task

The situation is provided:

```text id="8d8zqg"
A new employee needs access
to the administration dashboard
but must not access billing.

What should you do?
```

The learner determines the appropriate action/workflow.

Therefore:

```text id="aq3c7x"
T3
→ Workflow complexity

T4
→ Context + decision complexity
```

---

# 5. T4 vs T2

T2 emphasizes **guidance**.

T4 emphasizes **scenario reasoning**.

```text id="1s9jfa"
T2
Task
 ↓
Need help?
 ↓
Guidance

T4
Scenario
 ↓
Interpret context
 ↓
Make decision
 ↓
Perform task
```

A T4 may still provide hints, but hints are not its defining feature.

---

# 6. T4 vs T6

T4:

> Determine what should be done within a situation and accomplish it.

T6:

> Implement a defined component/system.

For example:

### T4

> A user has the wrong access level. Determine the correct authorization configuration and apply it.

### T6

> Implement the authorization service according to the supplied interface and requirements.

T6 emphasizes implementation.

T4 emphasizes **contextual application and decision-making**.

---

# 7. T4 Core Learning Objective

T4 develops the learner's ability to:

* interpret requirements
* understand context
* identify relevant constraints
* choose an appropriate action
* apply learned concepts
* justify decisions
* verify the outcome

The learner moves from:

```text id="0d8q4e"
"What is the rule?"
```

toward:

```text id="5s0f3k"
"When should I apply the rule,
and what should I do here?"
```

---

# 8. T4 Scenario Anatomy

A T4 should normally contain:

```text id="z3q8uy"
Scenario
Context
Objective
Constraints
Available Information
Task
Expected Outcome
Validation
```

The most important new element is:

> **Scenario Context**

---

# 9. T4 Basic UI

```text id="u8a2rb"
┌──────────────────────────────────────────────┐
│ SCENARIO TASK                                │
├──────────────────────────────────────────────┤
│                                              │
│ SITUATION                                    │
│                                              │
│ A new employee has joined the security team. │
│ They need administrative dashboard access    │
│ but must not access billing functionality.  │
│                                              │
│ OBJECTIVE                                    │
│                                              │
│ Configure the user's access appropriately.   │
│                                              │
│ CONSTRAINTS                                  │
│                                              │
│ • Dashboard access is required.              │
│ • Billing access must remain unavailable.    │
│                                              │
│ YOUR TASK                                    │
│                                              │
│ Determine and apply the appropriate access.  │
│                                              │
│ [ Workspace ]                                │
│                                              │
│ [ Check Task ]                               │
└──────────────────────────────────────────────┘
```

---

# 10. Scenario Should Feel Like a Situation

Compare:

### Weak T4

> Set role to `admin`.

This contains no meaningful scenario.

### Better T4

> A support engineer needs access to user-management tools but should not be able to modify billing settings. Configure the appropriate permissions.

Now the learner must reason about the requirement.

---

# 11. T4 Scenario Context

The context should provide enough information to make the decision.

Example:

```text id="h3w8gk"
You are managing access for a SaaS application.

A support engineer needs to:
• View user accounts
• Reset user passwords
• Review account status

The engineer must NOT:
• Modify billing
• Manage infrastructure
• Change organization ownership
```

Then:

> Configure the appropriate access.

The scenario creates constraints.

---

# 12. T4 Constraints

Constraints are important because they prevent the learner from simply choosing the broadest solution.

Example:

```text id="u5o8pm"
Required:
✓ User management
✓ Password reset
✓ Account viewing

Forbidden:
✗ Billing administration
✗ Infrastructure management
✗ Ownership changes
```

This tests whether the learner understands the difference between:

```text id="q6k7w8"
"Give enough access"
```

and:

```text id="g2c8s0"
"Give the correct access."
```

---

# 13. T4 Example — Authorization

### Scenario

> A customer-support employee needs to resolve user-account issues. They need to view accounts and reset passwords but must not change billing or organization ownership.

### Task

> Configure the user's authorization appropriately.

The learner must determine the correct permissions.

This is much more meaningful than:

> Add `USER_MANAGE` permission.

Because the scenario requires interpreting requirements.

---

# 14. T4 Example — Exception Handling

### Scenario

> A data-import service receives user-provided values. Most records contain valid numeric data, but malformed records occasionally appear. The import process should continue processing valid records while safely handling malformed ones.

### Task

> Modify the error-handling behavior so the import process handles malformed records appropriately without unnecessarily terminating the entire operation.

The learner must reason about the scenario.

---

# 15. T4 Example — Python Memory

### Scenario

> A program maintains a working list and a backup list. Developers report that modifying the working list unexpectedly changes the backup.

### Task

> Determine why this happens and modify the implementation so the backup maintains independent state.

The learner must:

```text id="u9t4xa"
understand situation
       ↓
identify aliasing
       ↓
choose appropriate correction
       ↓
apply it
       ↓
verify
```

---

# 16. T4 Example — Database

### Scenario

> An application stores user profiles. A new feature requires updating user preferences without accidentally overwriting unrelated profile fields.

### Task

> Modify the update behavior so only the requested preference fields are changed.

The scenario establishes the business requirement.

---

# 17. T4 Example — Authentication

### Scenario

> Users report that they remain logged in after closing the browser on a shared computer. The security requirement is that sensitive administrative sessions must not persist in this environment.

### Task

> Determine the appropriate authentication/session configuration and apply it.

The learner must interpret the security requirement rather than simply follow a predefined procedure.

---

# 18. T4 Scenario Information

The scenario can provide information through:

```text id="q5y6f2"
Text
Code
Configuration
Logs
Tables
Diagrams
User requirements
System state
Error messages
Screenshots
```

This makes T4 flexible.

---

# 19. T4 Information Is Deliberate

Do not overwhelm the learner with irrelevant information.

A good scenario contains:

```text id="g0c6cs"
Relevant context
+
Relevant constraints
+
Relevant objective
```

Avoid:

```text id="s0z4w2"
Large amount of unrelated information
```

The goal is contextual reasoning, not information overload.

---

# 20. T4 Decision Point

Some T4 tasks should explicitly require a decision before the learner performs the task.

Example:

```text id="2g9b3u"
What access model should be used?

○ Full administrator
○ Support role
○ Read-only role
○ Custom permissions
```

After the learner chooses:

```text id="3v4s1c"
Apply your decision
```

This creates:

```text id="f1e6xk"
Scenario
 ↓
Decision
 ↓
Action
 ↓
Validation
```

---

# 21. T4 Decision + Action

This is a powerful T4 structure.

```text id="9r1v8c"
┌───────────────────────┐
│ 1. Understand         │
│    Scenario            │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ 2. Make Decision      │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ 3. Perform Task       │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ 4. Verify Outcome     │
└───────────────────────┘
```

---

# 22. T4 Decision Should Not Become a Quiz

A scenario can contain choices, but the final goal should remain task accomplishment.

### Quiz

> Which role should the user receive?

Then the learner selects an answer.

### T4

> Determine the appropriate role and configure the user's access.

The learner must actually accomplish something.

Therefore:

```text id="y7b5n0"
Question
→ answer

Scenario Task
→ decision + action
```

---

# 23. T4 Workspace

The workspace should match the scenario.

Examples:

```text id="d4d2fg"
Authorization scenario
→ Permission editor

Database scenario
→ Query/editor workspace

Python scenario
→ Code editor

Architecture scenario
→ Diagram workspace

Configuration scenario
→ Configuration editor
```

---

# 24. T4 Validation

Validation should check both:

### Decision

Was the selected approach appropriate?

### Outcome

Did the learner actually accomplish the task?

For example:

```text id="p7n1sx"
Decision
✓ Appropriate role selected

Action
✓ Permissions configured correctly

Outcome
✓ Required access works
✓ Forbidden access remains blocked
```

---

# 25. T4 Validation Model

```text id="w1n7lo"
SCENARIO
   ↓
DECISION
   ↓
ACTION
   ↓
VALIDATE DECISION
   ↓
VALIDATE RESULT
   ↓
COMPLETE
```

---

# 26. T4 Incorrect Decision

Suppose the learner chooses:

> Full Administrator

when the scenario explicitly says:

> The user must not access billing.

The system can respond:

> This configuration grants broader access than the scenario requires. Reconsider the user's responsibilities and constraints.

This is better than simply saying:

> Wrong.

---

# 27. T4 Feedback Should Explain the Scenario Constraint

Example:

```text id="0k9k1f"
Your configuration grants billing administration.

The scenario requires the employee to manage
user accounts without accessing billing.

Review the required and restricted capabilities.
```

This teaches contextual reasoning.

---

# 28. T4 Guidance

Guidance may be available, but should remain secondary.

Example:

```text id="b4k2r9"
Need help?

Hint:
Separate the user's required responsibilities
from capabilities that the scenario explicitly
prohibits.
```

The system should not immediately tell the learner the exact answer.

---

# 29. T4 Scenario Difficulty

Difficulty can increase through:

```text id="j9v3i0"
More constraints
More possible solutions
Ambiguous trade-offs
Multiple relevant signals
Larger context
More consequences
```

For example:

### Easy

One obvious decision.

### Medium

Two plausible choices.

### Hard

Several valid-looking approaches with important trade-offs.

---

# 30. T4 Example Difficulty

### Easy

> User needs read-only access.

### Medium

> User needs read and update access but not deletion.

### Hard

> User needs temporary access to update selected resources but must not gain ownership or billing privileges.

The learner must reason about the constraints.

---

# 31. T4 Scenario Consequences

A powerful feature is showing consequences.

Example:

```text id="u0o5wy"
Choice:
Full Administrator

Consequence:
User can now modify billing settings.

Scenario requirement:
Billing access must remain blocked.

→ Reconsider your configuration.
```

This turns the scenario into a learning environment.

---

# 32. T4 Multiple Valid Solutions

Some scenarios can have more than one correct implementation.

Therefore validation should focus on:

```text id="k3r5ds"
Required behavior
+
Required constraints
```

rather than requiring one exact implementation.

Example:

```text id="l4y5p7"
Implementation A → PASS
Implementation B → PASS
Implementation C → PASS
```

if all satisfy the scenario.

This is especially important for technical tasks.

---

# 33. T4 Scenario Branching

Advanced T4 can branch based on learner decisions.

```text id="k4f8qz"
Scenario
   ↓
Decision
 ┌─┴─────────┐
 ▼           ▼
Choice A    Choice B
 │           │
 ▼           ▼
Outcome A   Outcome B
 │           │
 └────┬──────┘
      ▼
Continue
```

This should be optional.

The basic T4 model does not require branching.

---

# 34. T4 Branching Example

Authorization scenario:

```text id="9c2j3w"
Choose access model
      │
 ┌────┴─────┐
 ▼          ▼
Existing   Custom
Role       Permissions
 │          │
 ▼          ▼
Configure  Configure
Role       Permissions
 │          │
 └────┬─────┘
      ▼
Verify
```

Both branches may lead to successful completion if they satisfy the scenario constraints.

---

# 35. T4 JSON Structure

```json id="2r9jz4"
{
  "type": "task",
  "version": "T4",
  "presentation": "Scenario Task",

  "content": {
    "title": "",
    "scenario": "",
    "objective": "",
    "constraints": [],
    "availableInformation": [],
    "task": "",
    "expectedOutcome": ""
  },

  "decision": {
    "enabled": true
  },

  "workspace": {
    "type": ""
  },

  "validation": {
    "mode": "",
    "criteria": []
  },

  "metadata": {
    "difficulty": "",
    "estimatedMinutes": 0
  }
}
```

---

# 36. Complete T4 JSON Example

```json id="4fd2wu"
{
  "type": "task",
  "version": "T4",
  "presentation": "Scenario Task",

  "content": {
    "title": "Configure Support Access",

    "scenario": "A customer-support employee needs access to user-management tools so they can help customers resolve account problems. They must not be able to modify billing settings or change organization ownership.",

    "objective": "Configure the employee's access so that they can perform their support responsibilities without receiving prohibited administrative capabilities.",

    "constraints": [
      "User account information must be accessible.",
      "Password reset capability is required.",
      "Billing administration must remain unavailable.",
      "Organization ownership changes must remain unavailable."
    ],

    "availableInformation": [
      "Available roles include administrator, support, and read-only.",
      "Custom permissions can also be configured.",
      "The application validates authorization at the permission level."
    ],

    "task": "Determine and apply the appropriate access configuration.",

    "expectedOutcome": "The support employee can perform the required support operations while prohibited administrative operations remain inaccessible."
  },

  "decision": {
    "enabled": true,

    "prompt": "Choose the access approach you believe best satisfies the scenario.",

    "options": [
      {
        "id": "administrator",
        "label": "Full Administrator"
      },
      {
        "id": "support",
        "label": "Support Role"
      },
      {
        "id": "readonly",
        "label": "Read-Only Role"
      },
      {
        "id": "custom",
        "label": "Custom Permissions"
      }
    ]
  },

  "workspace": {
    "type": "authorization"
  },

  "validation": {
    "mode": "behavioral",

    "criteria": [
      "Required user-management capabilities are available.",
      "Password reset capability is available.",
      "Billing administration is unavailable.",
      "Organization ownership changes are unavailable."
    ]
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 15
  }
}
```

---

# 37. T4 Scenario Presentation

The UI should visually distinguish the **situation** from the **task**.

```text id="d1q9bd"
┌──────────────────────────────────────────────┐
│ SCENARIO                                     │
│                                              │
│ A support employee needs to manage user      │
│ accounts but must not access billing.        │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ YOUR OBJECTIVE                               │
│                                              │
│ Configure the appropriate access.            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ CONSTRAINTS                                  │
│                                              │
│ ✓ User management                            │
│ ✓ Password reset                             │
│ ✗ Billing administration                     │
│ ✗ Ownership changes                          │
└──────────────────────────────────────────────┘
```

This makes the scenario easy to understand before the learner acts.

---

# 38. T4 Scenario → Action Interface

After reading the scenario:

```text id="n0w3v8"
[ Understand Scenario ]
          ↓
[ Make Decision ]
          ↓
[ Perform Task ]
          ↓
[ Verify ]
```

The UI should make this progression visually clear without turning it into T3's fixed multi-step workflow.

---

# 39. T4 Progress Model

T4 does not necessarily need numbered task stages.

Instead:

```text id="1x8g8q"
Scenario
✓ Understood

Decision
✓ Selected

Task
● In Progress

Validation
○ Pending
```

This is different from:

```text id="7w5f3e"
Step 1
Step 2
Step 3
Step 4
```

which is T3.

---

# 40. T4 Completion State

```text id="1q7r9a"
NOT_STARTED
     ↓
SCENARIO_REVIEWED
     ↓
DECISION_MADE
     ↓
TASK_IN_PROGRESS
     ↓
VALIDATING
     │
 ┌───┴────┐
 ▼        ▼
FAIL     PASS
 │        │
 ▼        ▼
REVISE   COMPLETE
```

---

# 41. T4 Persistence

The learner's scenario state should be saved.

Example:

```json id="8q3r5e"
{
  "scenarioProgress": {
    "scenarioReviewed": true,
    "decision": "support",
    "taskStarted": true,
    "completed": false
  }
}
```

If the learner returns later, the system can resume the scenario.

---

# 42. T4 Analytics

Useful metrics include:

```text id="e0k6t7"
scenarioStarted
scenarioCompleted
decisionSelected
decisionChanged
timeToDecision
taskAttempts
validationFailures
hintsUsed
finalOutcome
```

Especially useful:

> **Decision changes**

because they reveal whether the learner reconsidered their initial interpretation.

---

# 43. T4 Decision Analytics

Example:

```json id="c6x9n2"
{
  "decisionAnalytics": {
    "initialChoice": "administrator",
    "finalChoice": "support",
    "decisionChanges": 1,
    "finalDecisionCorrect": true
  }
}
```

This can provide valuable instructional insight.

---

# 44. T4 Accessibility

The scenario should be announced in a logical order:

```text id="9h2n4a"
Scenario title
↓
Scenario description
↓
Objective
↓
Constraints
↓
Available information
↓
Decision
↓
Workspace
↓
Validation
```

Important constraints should not be communicated only by color.

For example:

```text id="2v4f0c"
✓ Required capability
✗ Restricted capability
```

Use text labels as well.

---

# 45. T4 Responsive Design

### Desktop

```text id="j7g2we"
┌─────────────────────────────┬──────────────────────┐
│ Scenario                    │ Constraints          │
│                             │ Decision             │
│ Objective                  │                      │
│ Workspace                  │                      │
│                             │                      │
└─────────────────────────────┴──────────────────────┘
```

### Mobile

```text id="5m3p8x"
Scenario
   ↓
Objective
   ↓
Constraints
   ↓
Available Information
   ↓
Decision
   ↓
Workspace
   ↓
Validation
```

---

# 46. T4 Authoring Rules

A strong Scenario Task should:

```text id="2g9j6q"
✓ Present a believable situation
✓ Give enough context
✓ Define a concrete objective
✓ Include meaningful constraints
✓ Require contextual reasoning
✓ Allow the learner to make decisions
✓ Require actual task accomplishment
✓ Validate the final result
```

Avoid:

```text id="7t6r8e"
❌ Scenario text with no task
❌ A disguised multiple-choice quiz
❌ A predefined workflow with no decisions
❌ Excessively artificial situations
❌ Unnecessary narrative
❌ Missing success criteria
```

---

# 47. T4 Scenario Quality Test

Before authoring a T4, ask:

### Question 1

> Does the learner need to understand the situation?

If **no**, use T1/T2/T3 instead.

### Question 2

> Does the learner need to make a contextual decision?

If **yes**, T4 is appropriate.

### Question 3

> Does the learner actually have to accomplish something?

If **no**, it may be a QuestionBlock instead.

### Question 4

> Are there meaningful constraints?

If **yes**, the scenario becomes stronger.

---

# 48. T4 Boundary With QuestionBlock

This distinction is important.

### QuestionBlock

> Which role should the support employee receive?

The learner answers.

### T4

> A support employee needs user-management access but must not access billing. Determine the appropriate access model and configure it.

The learner:

```text id="v0f1q8"
interprets
   ↓
decides
   ↓
acts
   ↓
verifies
```

Therefore T4 remains a TaskBlock.

---

# 49. T4 Boundary With ExerciseBlock

### Exercise

> Practice selecting the correct authorization condition.

### Scenario Task

> Configure access for this employee based on their actual responsibilities and restrictions.

Exercise = skill practice.

Scenario Task = contextual accomplishment.

---

# 50. T4 Boundary With Real-World T8

T4 introduces realistic situations.

But T8 goes further.

### T4

```text
Controlled scenario
+
Defined information
+
Defined constraints
```

### T8

```text
Real-world task
+
Broader ambiguity
+
Professional deliverable
+
Production-like considerations
```

Therefore T4 is the bridge toward T8.

---

# 51. T4 Difficulty Progression

T4 can progress internally:

```text id="h9q4k7"
Simple Scenario
      ↓
Multiple Constraints
      ↓
Competing Requirements
      ↓
Multiple Valid Approaches
      ↓
Consequences / Trade-offs
```

This allows the same T4 version to support different subject complexity without changing its fundamental definition.

---

# 52. T4 Advanced Scenario Example

> A company has separated its support and security teams. A support engineer needs to investigate user accounts and reset passwords. The engineer should not be able to change billing settings, modify organization ownership, or manage infrastructure. The existing role model does not perfectly match these requirements.

### Task

> Determine and configure an access model that satisfies the requirements while granting the minimum necessary privileges.

Now the learner must reason about:

```text id="0l2g4r"
Requirements
+
Restrictions
+
Existing roles
+
Least privilege
+
Implementation
+
Verification
```

That is an advanced T4 without becoming T7.

---

# 53. T4 Final Mental Model

```text id="z7u8c5"
                         T4
                  SCENARIO TASK
                         │
                         ▼
                     SITUATION
                         │
                         ▼
                    CONTEXT
                         │
                         ▼
                   CONSTRAINTS
                         │
                         ▼
                  LEARNER DECIDES
                         │
                         ▼
                   LEARNER ACTS
                         │
                         ▼
                     VALIDATE
                         │
                    ┌────┴────┐
                    ▼         ▼
                  FAIL       PASS
                    │         │
                    ▼         ▼
                 REVISE    COMPLETE
```

The defining principle is:

> **Give the learner a situation, not merely an instruction, and require them to turn contextual understanding into action.**

---

# 54. T4 Final Technical Specification

| Area                              | T4 Decision                                      |
| --------------------------------- | ------------------------------------------------ |
| **Block**                         | **TaskBlock**                                    |
| **Version**                       | **T4**                                           |
| **Presentation**                  | **Scenario Task**                                |
| **Primary purpose**               | Contextual decision-making + task accomplishment |
| **Scenario**                      | Required                                         |
| **Objective**                     | Required                                         |
| **Constraints**                   | Strongly recommended                             |
| **Available information**         | Recommended                                      |
| **Decision-making**               | Core                                             |
| **Actual task accomplishment**    | Required                                         |
| **Workspace**                     | Polymorphic                                      |
| **Validation**                    | Required/recommended                             |
| **Branching**                     | Optional                                         |
| **Guidance**                      | Optional                                         |
| **Multi-step workflow**           | Not defining characteristic                      |
| **Debugging focus**               | ❌                                                |
| **Implementation focus**          | ❌                                                |
| **Challenge-level ambiguity**     | ❌                                                |
| **Real-world professional scope** | ❌                                                |
| **Progress persistence**          | ✅                                                |
| **Retry/revision**                | ✅                                                |
| **Decision analytics**            | ✅                                                |
| **Quiz score**                    | ❌                                                |
| **Theme**                         | Light                                            |
| **Primary**                       | **#F54A8D**                                      |
| **Secondary**                     | **#0B1B3D**                                      |
| **Gradient**                      | ❌                                                |
| **Dark theme**                    | ❌                                                |
| **Responsive**                    | ✅                                                |
| **Accessible**                    | ✅                                                |
| **JSON-driven**                   | ✅                                                |

---

# 55. TaskBlock Progress

We now have:

```text id="t5r7u2"
T1 — Simple Task
        ↓
T2 — Guided Task
        ↓
T3 — Multi-Step Task
        ↓
T4 — Scenario Task
```

The conceptual progression is:

```text id="j4y2q8"
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON + ACCOMPLISH WITHIN A SCENARIO
```

The next version is:

> **T5 — Debugging Task**

T5 will specifically introduce **diagnosis → investigation → correction → verification**, making it deliberately different from the general contextual reasoning of T4.

## **T4 — Scenario Task: COMPLETE** ✅



```python

```

# BLOCK 14 — TaskBlock

## T5 — Debugging Task

Yes. We continue with **only T5**, exactly one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| T1      | Simple Task         | ✅ Complete     |
| T2      | Guided Task         | ✅ Complete     |
| T3      | Multi-Step Task     | ✅ Complete     |
| T4      | Scenario Task       | ✅ Complete     |
| **T5**  | **Debugging Task**  | 🔵 **CURRENT** |
| T6      | Implementation Task | ⏳              |
| T7      | Challenge Task      | ⏳              |
| T8      | Real-World Task     | ⏳              |

---

# 1. What Is T5 — Debugging Task?

**T5 — Debugging Task** asks the learner to investigate a malfunctioning system, identify the underlying cause, correct the problem, and verify that the system now behaves correctly.

The core model is:

```text
PROBLEM
   ↓
INVESTIGATE
   ↓
IDENTIFY CAUSE
   ↓
CORRECT
   ↓
VERIFY
   ↓
COMPLETE
```

The defining characteristic is:

> **The learner is not simply asked to make something work. They must diagnose why something is not working and then fix it.**

---

# 2. T5 Position in TaskBlock

```text
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

The conceptual progression is now:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
```

---

# 3. T5 vs ExerciseBlock EX4

This distinction must remain locked.

### EX4 — Fix the Code

The learner is given incorrect code and asked to correct it.

The primary emphasis is:

```text
Incorrect Code
      ↓
Fix
```

### T5 — Debugging Task

The learner is given a **problem situation** and must investigate it.

The emphasis is:

```text
Observed Problem
      ↓
Investigation
      ↓
Diagnosis
      ↓
Correction
      ↓
Verification
```

Therefore:

> **EX4 practices fixing. T5 develops debugging as a task accomplishment.**

---

# 4. T5 vs T4

### T4 — Scenario Task

The learner interprets a situation and decides what should be done.

```text
Scenario
   ↓
Decision
   ↓
Action
   ↓
Validation
```

### T5 — Debugging Task

The learner investigates an existing failure.

```text
Problem
   ↓
Evidence
   ↓
Diagnosis
   ↓
Fix
   ↓
Validation
```

The defining difference is **diagnosis**.

---

# 5. T5 vs T3

T3 may contain multiple steps:

```text
Create
→ Configure
→ Verify
→ Test
```

But the steps are known in advance.

T5 may instead say:

> Users are receiving authorization failures. Investigate the system and correct the problem.

The learner must discover what is wrong.

Therefore:

```text
T3
Known workflow

T5
Unknown cause
```

---

# 6. T5 Core Learning Model

```text
                 OBSERVED FAILURE
                        │
                        ▼
                  COLLECT EVIDENCE
                        │
                        ▼
                  FORM HYPOTHESIS
                        │
                        ▼
                    INVESTIGATE
                        │
                        ▼
                  IDENTIFY ROOT CAUSE
                        │
                        ▼
                     CORRECT
                        │
                        ▼
                    RE-TEST
                        │
                   ┌────┴────┐
                   ▼         ▼
                 FAIL       PASS
                   │         │
                   ▼         ▼
               INVESTIGATE COMPLETE
                 AGAIN
```

---

# 7. T5 Must Start With a Problem

A T5 should have an observable problem.

Examples:

> Login succeeds but the user immediately becomes unauthenticated.

> An authorized administrator receives `403 Forbidden`.

> A list modification unexpectedly changes another variable.

> Invalid input terminates the data-import process.

> A configuration change is not being applied.

The learner begins from **symptoms**, not the solution.

---

# 8. T5 Debugging Evidence

A good T5 can provide:

```text
Error message
Logs
Stack trace
Code
Configuration
Input data
Expected behavior
Actual behavior
Test results
System state
Screenshots
```

The learner uses these clues to investigate.

---

# 9. T5 Basic UI

```text
┌──────────────────────────────────────────────┐
│ DEBUGGING TASK                               │
├──────────────────────────────────────────────┤
│                                              │
│ PROBLEM                                      │
│                                              │
│ Administrators are receiving 403 responses  │
│ when accessing the admin operation.          │
│                                              │
│ EXPECTED                                     │
│ Authorized administrators should succeed.   │
│                                              │
│ ACTUAL                                       │
│ The request is rejected.                     │
│                                              │
│ EVIDENCE                                     │
│ • Request log                                │
│ • Authorization code                         │
│ • Permission configuration                   │
│                                              │
│ [ Investigation Workspace ]                  │
│                                              │
│ [ Submit Diagnosis ]                         │
└──────────────────────────────────────────────┘
```

---

# 10. T5 Investigation Before Correction

The learner should not immediately be pushed toward:

> "Change this line."

Instead, the task should encourage:

```text
Observe
 ↓
Inspect
 ↓
Hypothesize
 ↓
Test
 ↓
Diagnose
```

Only then:

```text
Fix
```

This creates real debugging behavior.

---

# 11. T5 Example — Python

### Problem

```python
numbers = [1, 2, 3]
backup = numbers

numbers.append(4)
```

Reported behavior:

> `backup` unexpectedly contains `4`.

Expected:

```python
backup == [1, 2, 3]
```

The learner must investigate.

Possible diagnosis:

> `backup` and `numbers` reference the same list object.

Correction:

> Create independent list state.

Verification:

```text
numbers → [1, 2, 3, 4]
backup  → [1, 2, 3]
```

---

# 12. T5 Example — Exception Handling

### Problem

A data-import process terminates whenever one record contains invalid numeric data.

Expected:

> Invalid records should be handled safely while valid records continue processing.

Evidence:

```text
ValueError: invalid literal for int()
```

The learner investigates:

```text
Where does conversion occur?
       ↓
What exception is raised?
       ↓
Where should it be handled?
       ↓
What should happen to invalid records?
```

Then fixes and verifies the behavior.

---

# 13. T5 Example — Authentication

### Problem

> Users can successfully authenticate, but their subsequent API requests return `401 Unauthorized`.

Evidence:

```text
Login response: 200
Protected request: 401
```

The learner investigates:

```text
Authentication succeeded
       ↓
Token/session exists?
       ↓
Cookie/header transmitted?
       ↓
Gateway recognizes token?
       ↓
Backend validates token?
```

The task is not merely:

> Fix authentication.

The learner must identify the failure point.

---

# 14. T5 Example — Authorization

### Problem

> A user with the correct role receives `403 Forbidden`.

Evidence:

```text
Authenticated: YES
Role: admin
Required permission: users.manage
Result: 403
```

The learner investigates:

```text
Identity
   ↓
Role
   ↓
Permission mapping
   ↓
Authorization middleware
   ↓
Decision
```

Possible root cause:

> The role-to-permission mapping is missing `users.manage`.

The learner then corrects the configuration and verifies access.

---

# 15. T5 Example — Database

### Problem

> Updating a user's email unexpectedly resets the user's display name.

Expected:

```text
email → updated
displayName → unchanged
```

Actual:

```text
email → updated
displayName → null
```

The learner investigates:

```text
Request payload
      ↓
Update object
      ↓
SQL update
      ↓
Database result
```

The task is to identify where the unintended overwrite occurs and correct it.

---

# 16. T5 Example — Configuration

### Problem

> The development application continues calling the production API even after the development endpoint was configured.

Evidence:

```text
Environment:
development

Expected API:
api-dev.example.com

Actual API:
api.example.com
```

The learner investigates:

```text
Environment variable
       ↓
Application configuration
       ↓
Build/runtime loading
       ↓
API client
```

The task is to identify the cause and correct it.

---

# 17. T5 Debugging Workspace

A debugging workspace can contain multiple panels:

```text
┌─────────────────────────────────────────────┐
│ PROBLEM                                     │
├─────────────────────────────────────────────┤
│                                             │
│ Logs / Errors                               │
├─────────────────────────────────────────────┤
│                                             │
│ Code / Configuration                        │
├─────────────────────────────────────────────┤
│                                             │
│ Test / Runtime                              │
├─────────────────────────────────────────────┤
│                                             │
│ Diagnosis                                   │
│ [ Your explanation ]                        │
├─────────────────────────────────────────────┤
│                                             │
│ Fix                                         │
│ [ Workspace ]                               │
└─────────────────────────────────────────────┘
```

---

# 18. T5 Diagnosis Is Important

A T5 should ideally distinguish:

### Symptom

> The request returns `403`.

### Cause

> The user's role does not map to the required permission.

The learner should identify the **cause**, not merely repeat the symptom.

---

# 19. T5 Diagnosis Model

```text
SYMPTOM
  ↓
OBSERVATION
  ↓
HYPOTHESIS
  ↓
INVESTIGATION
  ↓
ROOT CAUSE
```

This is the core debugging skill.

---

# 20. T5 Root Cause vs Fix

These should be separate concepts.

Example:

```text
Root Cause:
Permission mapping is incomplete.

Fix:
Add the required permission to the role mapping.
```

This distinction matters because a learner can sometimes make the symptom disappear without fixing the actual cause.

---

# 21. T5 Validation Must Reproduce the Original Problem

A strong debugging task should verify:

### Before

```text
FAIL
```

### After

```text
PASS
```

Example:

```text
Before:
admin → 403

After:
admin → 200
```

But validation should also ensure the fix did not create regressions.

---

# 22. T5 Regression Validation

Example:

```text
Authorized user
✓ Allowed

Unauthorized user
✓ Rejected

Normal user operation
✓ Still works
```

This is much stronger than simply checking:

> The original error disappeared.

---

# 23. T5 Debugging Loop

```text
REPRODUCE
   ↓
OBSERVE
   ↓
HYPOTHESIZE
   ↓
INVESTIGATE
   ↓
DIAGNOSE
   ↓
FIX
   ↓
REPRODUCE
   ↓
VERIFY
```

This is the ideal mental model for T5.

---

# 24. T5 Hypothesis Support

Advanced T5 can allow the learner to record a hypothesis.

Example:

```text
Possible Cause:

○ Authentication token missing
○ Permission mapping incorrect
○ Database lookup failed
○ Request header malformed
```

The learner selects or enters a hypothesis.

Then:

> **Investigate**

This makes the reasoning process explicit.

---

# 25. T5 Multiple Hypotheses

A stronger debugging task may provide several plausible causes.

Example:

```text
Possible causes:

A. Token is expired
B. Permission mapping is incorrect
C. User does not exist
D. API endpoint is incorrect
```

The learner gathers evidence.

The objective is not guessing.

It is:

```text
Evidence
 ↓
Eliminate possibilities
 ↓
Identify cause
```

---

# 26. T5 Evidence Panel

```text
┌──────────────────────────────────────────────┐
│ EVIDENCE                                     │
├──────────────────────────────────────────────┤
│                                              │
│ Request                                      │
│ GET /admin/users                             │
│                                              │
│ Authentication                               │
│ Valid                                        │
│                                              │
│ User role                                    │
│ admin                                        │
│                                              │
│ Required permission                          │
│ users.manage                                 │
│                                              │
│ Assigned permissions                         │
│ users.read                                   │
│ users.create                                 │
└──────────────────────────────────────────────┘
```

The learner should be able to infer:

> `users.manage` is missing.

---

# 27. T5 Diagnosis Submission

The learner may be asked:

> What is the root cause?

Example:

```text
[ Role `admin` does not contain `users.manage`. ]
```

Then:

> Apply the correction.

This separates reasoning from implementation.

---

# 28. T5 Diagnosis Validation

Diagnosis can be validated through:

```text
Exact match
Semantic match
Structured selection
Required cause identifiers
Manual review
```

For technical tasks, structured diagnosis is often preferable.

Example:

```json
{
  "cause": "missing_permission_mapping"
}
```

---

# 29. T5 Correction Validation

After diagnosis:

```text
Apply Fix
   ↓
Run Tests
   ↓
Original Problem?
   ├── Still present → FAIL
   └── Resolved
          ↓
      Regression Tests
          ↓
       COMPLETE
```

---

# 30. T5 Guidance

Guidance can exist, but should not remove the investigation.

Example:

### Hint 1

> Start by confirming whether authentication itself is succeeding.

### Hint 2

> Compare the required permission with the permissions assigned to the user's role.

### Hint 3

> Look for a mismatch between the required permission and the role's permission set.

The learner still performs the diagnosis.

---

# 31. T5 Progressive Hints

```text
Hint 1
Where should you investigate?

        ↓

Hint 2
What evidence would distinguish the possible causes?

        ↓

Hint 3
Compare the required permission with assigned permissions.

        ↓

Hint 4
The required permission is missing from the role.
```

The final hint may become highly specific, but should remain distinct from directly applying the fix.

---

# 32. T5 Debugging Task Structure

A strong T5 can use:

```text
1. Problem
2. Expected behavior
3. Actual behavior
4. Evidence
5. Investigation
6. Diagnosis
7. Correction
8. Verification
```

Not every task requires every UI element, but the conceptual flow should remain.

---

# 33. T5 UI Flow

```text
┌──────────────────────────────────────────────┐
│ 1. PROBLEM                                   │
│ What is failing?                             │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ 2. INVESTIGATE                               │
│ Examine code, logs, config, tests.           │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ 3. DIAGNOSE                                  │
│ Identify the root cause.                     │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ 4. FIX                                       │
│ Correct the underlying problem.              │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ 5. VERIFY                                    │
│ Confirm the problem is resolved.             │
└──────────────────────────────────────────────┘
```

---

# 34. T5 Does Not Require Fixed Steps Like T3

This is subtle but important.

The UI may show:

```text
Investigate → Diagnose → Fix → Verify
```

but the learner is not necessarily required to execute a predefined list of steps.

These represent the **debugging lifecycle**.

The learner can investigate in whatever order makes sense.

Therefore:

```text
T3
Required task workflow

T5
Debugging methodology
+
problem diagnosis
```

---

# 35. T5 Example — Debugging a Shared Reference

### Problem

```python
numbers = [1, 2, 3]
backup = numbers

numbers.append(4)
```

### Expected

```python
backup == [1, 2, 3]
```

### Actual

```python
backup == [1, 2, 3, 4]
```

### Evidence

```text
id(numbers) == id(backup)
```

### Diagnosis

> Both variables reference the same list object.

### Correction

Create independent list state.

### Verification

```text
numbers → [1, 2, 3, 4]
backup  → [1, 2, 3]
```

That is a complete T5.

---

# 36. T5 Example — Authentication

### Problem

> Login succeeds, but the next protected request returns `401`.

### Investigation

```text
Login response
✓ 200

Token created
✓

Browser cookie
?

Protected request
✗ 401
```

The learner investigates the missing authentication state.

Potential root cause:

> The authentication cookie is not being sent to the protected domain.

Then:

```text
Fix cookie configuration
       ↓
Login again
       ↓
Protected request
       ↓
200
```

---

# 37. T5 Example — Authorization

### Problem

> Admin user receives `403`.

Investigation:

```text
Authenticated?
✓

Correct user?
✓

Required permission?
users.manage

Assigned permission?
users.read

Diagnosis:
missing users.manage
```

Correction:

```text
Update role-permission mapping.
```

Verification:

```text
Admin request → 200
Normal user → 403
```

---

# 38. T5 Example — Database

### Problem

> Updating email clears display name.

Investigation:

```text
Request:
{
  "email": "new@example.com"
}

Update object:
{
  "email": "...",
  "displayName": undefined
}
```

Diagnosis:

> The update operation includes an undefined field that is being interpreted as a replacement value.

Correction:

> Update only supplied fields.

Verification:

```text
email → changed
displayName → unchanged
```

---

# 39. T5 Example — Configuration

### Problem

> Development environment calls production API.

Investigation:

```text
Expected:
development endpoint

Actual:
production endpoint

Environment variable:
correct

Runtime configuration:
incorrect
```

Diagnosis:

> The application is reading a stale build-time value.

Correction:

> Correct the configuration loading mechanism.

Verification:

> Development requests now use the development endpoint.

---

# 40. T5 JSON Structure

```json
{
  "type": "task",
  "version": "T5",
  "presentation": "Debugging Task",

  "content": {
    "title": "",
    "problem": "",
    "expectedBehavior": "",
    "actualBehavior": "",
    "context": "",
    "evidence": []
  },

  "investigation": {
    "enabled": true,
    "workspace": {}
  },

  "diagnosis": {
    "required": true
  },

  "correction": {
    "workspace": {}
  },

  "validation": {
    "originalProblemResolved": true,
    "regressionTests": []
  },

  "metadata": {
    "difficulty": "",
    "estimatedMinutes": 0
  }
}
```

---

# 41. Complete T5 JSON Example

```json
{
  "type": "task",
  "version": "T5",
  "presentation": "Debugging Task",

  "content": {
    "title": "Diagnose the Admin Authorization Failure",

    "problem": "Users with the admin role receive a 403 response when attempting to access the user-management operation.",

    "expectedBehavior": "An appropriately authorized administrator should be allowed to access the user-management operation.",

    "actualBehavior": "The request is rejected with HTTP 403 Forbidden.",

    "context": "Authentication succeeds and the user is correctly identified as an administrator.",

    "evidence": [
      {
        "type": "request",
        "content": "GET /admin/users"
      },
      {
        "type": "authentication",
        "content": "Authenticated: true"
      },
      {
        "type": "role",
        "content": "admin"
      },
      {
        "type": "requiredPermission",
        "content": "users.manage"
      },
      {
        "type": "assignedPermissions",
        "content": [
          "users.read",
          "users.create"
        ]
      }
    ]
  },

  "investigation": {
    "enabled": true,

    "workspace": {
      "type": "diagnostic"
    },

    "availableActions": [
      "inspectRole",
      "inspectPermissions",
      "inspectAuthorizationRule",
      "runRequest"
    ]
  },

  "diagnosis": {
    "required": true,

    "acceptedCauses": [
      "missing_permission_mapping"
    ]
  },

  "correction": {
    "workspace": {
      "type": "configuration"
    },

    "objective": "Correct the role-permission configuration so that appropriately authorized administrators can access the operation."
  },

  "validation": {
    "originalProblemResolved": true,

    "tests": [
      {
        "description": "Administrator with users.manage can access the operation.",
        "expectedStatus": 200
      },
      {
        "description": "User without users.manage remains blocked.",
        "expectedStatus": 403
      }
    ],

    "regressionTests": [
      {
        "description": "Authentication continues to work."
      },
      {
        "description": "Existing user permissions remain unchanged."
      }
    ]
  },

  "metadata": {
    "difficulty": "medium",
    "estimatedMinutes": 20
  }
}
```

---

# 42. T5 UI — Final Concept

```text
┌──────────────────────────────────────────────────┐
│ DEBUGGING TASK                                   │
│ Diagnose the Admin Authorization Failure         │
├──────────────────────────────────────────────────┤
│                                                  │
│ PROBLEM                                          │
│ Admin users receive 403.                        │
│                                                  │
│ EXPECTED                                         │
│ Authorized admins should receive access.        │
│                                                  │
│ ACTUAL                                           │
│ Request is rejected.                             │
│                                                  │
│ EVIDENCE                                         │
│ Authentication ✓                                 │
│ Role: admin                                      │
│ Required: users.manage                           │
│ Assigned: users.read, users.create               │
│                                                  │
│ [ Investigate ]                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ DIAGNOSIS                                        │
│ What is the root cause?                          │
│ [______________________________________________] │
│                                                  │
│ [ Submit Diagnosis ]                             │
├──────────────────────────────────────────────────┤
│                                                  │
│ CORRECTION                                       │
│ [ Workspace ]                                    │
│                                                  │
│ [ Verify Fix ]                                   │
└──────────────────────────────────────────────────┘
```

---

# 43. T5 Debugging Completion

A T5 should not be considered complete simply because the learner identified the cause.

Likewise, fixing the issue without identifying the cause should normally not be sufficient.

Recommended:

```text
Diagnosis ✓
    +
Correction ✓
    +
Original problem resolved ✓
    +
Regression checks ✓
    =
T5 COMPLETE
```

This makes T5 genuinely diagnostic.

---

# 44. T5 Completion Model

```text
NOT_STARTED
     ↓
INVESTIGATING
     ↓
DIAGNOSIS_SUBMITTED
     ↓
CORRECTING
     ↓
VERIFYING
     │
 ┌───┴────┐
 ▼        ▼
FAIL     PASS
 │        │
 ▼        ▼
REVISE   COMPLETE
```

---

# 45. T5 Retry Model

A failed diagnosis should not erase investigation work.

```text
Evidence
   ✓
Hypothesis
   ✓
Diagnosis
   ✗
   ↓
Revise diagnosis
   ↓
Correction
```

This preserves the learner's reasoning process.

---

# 46. T5 Analytics

Important metrics:

```text
taskStarted
problemReproduced
investigationActions
hypothesesCreated
diagnosisAttempts
diagnosisCorrect
fixAttempts
originalProblemResolved
regressionTestsPassed
hintsUsed
timeToDiagnosis
totalTime
completed
```

Especially valuable:

```text
timeToDiagnosis
```

because diagnosis is the central skill.

---

# 47. T5 Debugging Analytics Example

```json
{
  "debuggingAnalytics": {
    "problemReproduced": true,
    "investigationActions": 6,
    "diagnosisAttempts": 2,
    "diagnosisCorrect": true,
    "fixAttempts": 1,
    "originalProblemResolved": true,
    "regressionTestsPassed": true,
    "completed": true
  }
}
```

---

# 48. T5 Mastery Signal

T5 should measure more than:

> Did the learner fix the bug?

A stronger signal is:

```text
Can the learner:

1. Observe the symptom?
2. Gather evidence?
3. Form a useful hypothesis?
4. Identify the root cause?
5. Apply an appropriate correction?
6. Verify the correction?
7. Avoid regression?
```

That is genuine debugging ability.

---

# 49. T5 Authoring Rules

A strong T5 should:

```text
✓ Start with a genuine malfunction
✓ Provide observable symptoms
✓ Provide enough evidence
✓ Require investigation
✓ Have an identifiable root cause
✓ Require a correction
✓ Verify the original problem is fixed
✓ Check for regressions where appropriate
```

Avoid:

```text
❌ Giving the root cause in the problem statement
❌ Giving the exact fix immediately
❌ Making it simply "find this typo"
❌ Making diagnosis unnecessary
❌ Validating only that code changed
❌ Turning it into a multiple-choice quiz
```

---

# 50. T5 Difficulty Progression

T5 difficulty can increase through:

```text
Simple bug
   ↓
Multiple possible causes
   ↓
Incomplete evidence
   ↓
Cross-component failure
   ↓
Subtle root cause
   ↓
Regression risk
```

For example:

### Easy

> A variable uses the wrong comparison operator.

### Medium

> Authorization fails because of a missing permission mapping.

### Hard

> Authentication succeeds, but a gateway/backend boundary incorrectly transforms the authorization context.

The latter requires investigation across components.

---

# 51. T5 Boundary With T7

T5 can become technically difficult.

But its defining goal remains:

> **Diagnose and repair a malfunction.**

T7 is:

> **Solve a deliberately difficult challenge.**

So:

```text
T5
Problem already exists
       ↓
Find and fix it

T7
Challenge is presented
       ↓
Design/solve a difficult problem
```

---

# 52. T5 Boundary With T8

T5 can use production-like failures.

But T8 is a broader real-world professional task.

For example:

### T5

> Diagnose why API authentication fails.

### T8

> Take ownership of securing the authentication flow for a production application, investigate existing behavior, implement the necessary improvements, document the result, and verify the deployment readiness.

T8 is broader and more professionally scoped.

---

# 53. T5 Final Mental Model

```text
                         T5
                  DEBUGGING TASK
                         │
                         ▼
                  OBSERVED PROBLEM
                         │
                         ▼
                     EVIDENCE
                         │
                         ▼
                   INVESTIGATION
                         │
                         ▼
                     DIAGNOSIS
                         │
                         ▼
                     CORRECTION
                         │
                         ▼
                     VERIFICATION
                         │
                    ┌────┴────┐
                    ▼         ▼
                  FAIL       PASS
                    │         │
                    ▼         ▼
                INVESTIGATE COMPLETE
                  AGAIN
```

The defining principle is:

> **The learner must discover why something is wrong, not merely be told what to change.**

---

# 54. T5 Final Technical Specification

| Area                     | T5 Decision                                    |
| ------------------------ | ---------------------------------------------- |
| **Block**                | **TaskBlock**                                  |
| **Version**              | **T5**                                         |
| **Presentation**         | **Debugging Task**                             |
| **Primary purpose**      | Diagnose and correct a malfunction             |
| **Problem**              | Required                                       |
| **Expected behavior**    | Required                                       |
| **Actual behavior**      | Required                                       |
| **Evidence**             | Strongly recommended                           |
| **Investigation**        | Core                                           |
| **Diagnosis**            | Core                                           |
| **Root cause**           | Required                                       |
| **Correction**           | Required                                       |
| **Verification**         | Required                                       |
| **Regression testing**   | Recommended                                    |
| **Hypotheses**           | Optional                                       |
| **Guidance**             | Optional                                       |
| **Multiple stages**      | Supported, but not the defining characteristic |
| **Scenario reasoning**   | May be present                                 |
| **Implementation**       | May be part of correction                      |
| **Challenge complexity** | Not defining                                   |
| **Real-world scope**     | Not defining                                   |
| **Progress persistence** | ✅                                              |
| **Retry**                | ✅                                              |
| **Debugging analytics**  | ✅                                              |
| **Quiz score**           | ❌                                              |
| **Theme**                | Light                                          |
| **Primary**              | **#F54A8D**                                    |
| **Secondary**            | **#0B1B3D**                                    |
| **Gradient**             | ❌                                              |
| **Dark theme**           | ❌                                              |
| **Responsive**           | ✅                                              |
| **Accessible**           | ✅                                              |
| **JSON-driven**          | ✅                                              |

---

# 55. TaskBlock Progress

We now have:

```text
T1 — Simple Task
        ↓
T2 — Guided Task
        ↓
T3 — Multi-Step Task
        ↓
T4 — Scenario Task
        ↓
T5 — Debugging Task
```

The conceptual progression is:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON + ACCOMPLISH WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
```

The next version is:

> **T6 — Implementation Task**

T6 will shift the learner from **repairing an existing system** to **building/implementing a required solution from defined requirements**.

## **T5 — Debugging Task: COMPLETE** ✅



```python

```

# BLOCK 14 — TaskBlock

## T6 — Implementation Task

Yes. We continue with **only T6**, one version at a time.

The committed sequence remains:

| Version | Presentation            | Status         |
| ------- | ----------------------- | -------------- |
| T1      | Simple Task             | ✅ Complete     |
| T2      | Guided Task             | ✅ Complete     |
| T3      | Multi-Step Task         | ✅ Complete     |
| T4      | Scenario Task           | ✅ Complete     |
| T5      | Debugging Task          | ✅ Complete     |
| **T6**  | **Implementation Task** | 🔵 **CURRENT** |
| T7      | Challenge Task          | ⏳              |
| T8      | Real-World Task         | ⏳              |

---

# 1. What Is T6 — Implementation Task?

**T6 — Implementation Task** asks the learner to **build, implement, configure, or integrate a solution from defined requirements**.

The defining principle is:

> **The learner is given what the solution must accomplish and is responsible for implementing the solution.**

The core model is:

```text
REQUIREMENTS
      ↓
UNDERSTAND DESIGN
      ↓
IMPLEMENT
      ↓
TEST
      ↓
VERIFY
      ↓
COMPLETE
```

This is different from T5, where something is already broken.

---

# 2. T6 Position in TaskBlock

```text
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

The progression becomes:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON + ACCOMPLISH WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
    ↓
BUILD + IMPLEMENT
```

---

# 3. T6 vs T5

This is the most important distinction.

### T5 — Debugging Task

Something already exists and is malfunctioning.

```text
EXISTING SYSTEM
      ↓
PROBLEM
      ↓
DIAGNOSE
      ↓
FIX
```

### T6 — Implementation Task

The learner receives requirements and builds the required solution.

```text
REQUIREMENTS
      ↓
DESIGN
      ↓
IMPLEMENT
      ↓
TEST
```

Therefore:

> **T5 fixes an existing problem. T6 creates the required solution.**

---

# 4. T6 vs T3

### T3 — Multi-Step Task

The learner follows a defined workflow:

```text
Step 1
→ Step 2
→ Step 3
→ Step 4
```

### T6 — Implementation Task

The learner is given the desired result and must determine how to implement it.

```text
REQUIREMENTS
      ↓
LEARNER CHOOSES APPROACH
      ↓
IMPLEMENTATION
      ↓
VALIDATION
```

The implementation approach may intentionally be left open.

---

# 5. T6 vs ExerciseBlock

An ExerciseBlock typically isolates a skill.

Example:

> Implement a function that removes duplicates from a list.

A T6 can be broader:

> Implement a reusable user-permission service that determines whether a user may perform a requested operation.

The learner must deal with:

```text
Requirements
+
Structure
+
Implementation
+
Integration
+
Testing
```

---

# 6. T6 vs T7

This boundary must remain clear.

### T6

> Implement a solution from defined requirements.

### T7

> Solve a deliberately difficult challenge with greater ambiguity, constraints, or complexity.

Therefore:

```text
T6
Defined requirements
+
Implementation

T7
Challenge
+
Higher reasoning complexity
+
Reduced scaffolding
```

T6 is not automatically easy.

It is defined by **implementation ownership**, not by difficulty.

---

# 7. T6 Core Learning Objective

T6 evaluates whether the learner can move from:

> **"I understand the concept."**

to:

> **"I can build something using the concept."**

The learner must make implementation decisions.

For example:

```text
Concept:
Authorization

T6:
Implement a permission-checking component
that satisfies the supplied requirements.
```

---

# 8. T6 Implementation Lifecycle

```text
                 REQUIREMENTS
                       │
                       ▼
                 UNDERSTAND GOAL
                       │
                       ▼
                IDENTIFY COMPONENTS
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
                       ▼
                  VERIFY RESULT
                       │
                  ┌────┴────┐
                  ▼         ▼
                FAIL       PASS
                  │         │
                  ▼         ▼
              ITERATE    COMPLETE
```

The learner owns the implementation.

---

# 9. T6 Requirements Are Central

A strong T6 begins with clear requirements.

Example:

> Implement a permission checker.

Requirements:

```text
• Accept a user.
• Accept a required permission.
• Return true when the user has the permission.
• Return false otherwise.
• Do not grant permissions implicitly.
• Handle missing permission data safely.
```

The implementation is left to the learner.

---

# 10. T6 Requirement vs Implementation

The task should define:

```text
WHAT
```

without unnecessarily defining:

```text
HOW
```

For example:

### Good

> The function must return `true` when the user possesses the required permission.

### Too prescriptive

> Create a `for` loop, iterate over the permissions array, compare each item, and return `true`.

The second tells the learner how to implement it.

T6 should preserve implementation ownership.

---

# 11. T6 Example — Python

### Task

> Implement a function that returns the active users from a collection.

Requirements:

```text
Input:
A collection of user records.

Output:
Only users whose active state is true.

Requirements:
• Preserve original user objects.
• Do not modify the input collection.
• Return an empty collection when no users are active.
```

The learner determines the implementation.

---

# 12. T6 Example — Exception Handling

### Task

> Implement a safe integer conversion utility.

Requirements:

```text
• Accept a value.
• Return the integer when conversion succeeds.
• Return None for invalid numeric input.
• Do not allow the conversion exception to escape.
• Preserve normal behavior for valid values.
```

The learner implements the function.

---

# 13. T6 Example — Memory

### Task

> Implement a function that returns an independent copy of a supplied list.

Requirements:

```text
• The returned list must contain the same values.
• Mutating the returned list must not mutate the original.
• Mutating the original must not mutate the returned list.
• The original list must remain unchanged during the operation.
```

The learner chooses how to implement it.

---

# 14. T6 Example — Authorization

### Task

> Implement a permission-checking function.

Requirements:

```text
• Accept a user identity.
• Accept a required permission.
• Return true only when the permission is granted.
• Return false for missing permissions.
• Do not treat authentication as authorization.
• Do not grant broader permissions automatically.
```

The learner builds the solution.

---

# 15. T6 Example — Authentication

### Task

> Implement a session validation component.

Requirements:

```text
• Accept a session/token.
• Reject missing credentials.
• Reject invalid credentials.
• Reject expired credentials.
• Return authenticated identity information for valid credentials.
• Do not expose sensitive credential material in the returned result.
```

This is an implementation task.

---

# 16. T6 Example — Database

### Task

> Implement a partial user-profile update operation.

Requirements:

```text
• Update only fields supplied by the caller.
• Do not overwrite unspecified fields.
• Validate the user identifier.
• Return the updated user.
• Preserve existing data when fields are omitted.
```

The learner determines the implementation.

---

# 17. T6 Workspace

T6 requires a workspace appropriate to the implementation.

Possible types:

```text
Code Editor
Configuration Editor
SQL Editor
API Builder
Diagram Editor
Component Builder
Schema Editor
```

Example:

```text
Code
→ TypeScript

Database
→ SQL

Architecture
→ Diagram

Configuration
→ JSON/YAML
```

---

# 18. T6 Starter State

T6 can begin from several starting states.

### Empty

```text
No implementation provided.
```

### Skeleton

```python
def has_permission(user, permission):
    pass
```

### Partial

```python
def has_permission(user, permission):
    # existing validation
    ...
```

### Existing project

```text
Repository
+
requirements
+
tests
```

The starting state should match the intended difficulty.

---

# 19. T6 Starter Code

For example:

```python
def get_active_users(users):
    """
    Return all active users without modifying
    the supplied collection.
    """
    pass
```

The learner implements the missing behavior.

---

# 20. T6 Hidden Tests

T6 is particularly suitable for automated validation.

Example:

```text
Test 1
Active users returned
✓

Test 2
Inactive users excluded
✓

Test 3
Original collection unchanged
✓

Test 4
Empty input handled
✓
```

The learner does not necessarily need to see every hidden test.

---

# 21. T6 Validation

Validation should focus on **behavior and requirements**, not merely code appearance.

Good:

```text
Input
   ↓
Implementation
   ↓
Expected behavior
   ↓
PASS
```

Less useful:

> You used the expected syntax.

The same behavior may be achieved through multiple valid implementations.

---

# 22. T6 Multiple Correct Implementations

This is an important property.

Suppose the task is:

> Return all active users.

Several implementations could be valid:

```python
[user for user in users if user["active"]]
```

or:

```python
result = []

for user in users:
    if user["active"]:
        result.append(user)
```

Both may pass.

Therefore:

> **T6 validation should normally validate the contract, not one exact implementation.**

---

# 23. T6 Implementation Contract

A useful model is:

```text
INPUT
  ↓
CONTRACT
  ↓
IMPLEMENTATION
  ↓
OUTPUT
```

Example:

```text
Input:
users

Contract:
return only active users

Output:
active users
```

This makes T6 highly suitable for automated testing.

---

# 24. T6 Test-Driven Variant

T6 can optionally provide tests before implementation.

Example:

```text
Requirement:
Return active users.

Tests:
✓ test_active_users
✓ test_empty_users
✓ test_no_active_users
✓ test_input_unchanged
```

The learner implements until all tests pass.

This is particularly useful for programming education.

---

# 25. T6 Test Visibility

Tests can be:

```text
visible
hidden
partially_visible
```

Example:

```json
{
  "tests": {
    "visible": 3,
    "hidden": 2
  }
}
```

This prevents learners from simply hard-coding visible examples.

---

# 26. T6 Implementation Feedback

When tests fail:

```text
2 of 5 tests passed.

Failed:
• Empty input handling
• Input immutability
```

This tells the learner what contract is not satisfied without necessarily providing the implementation.

---

# 27. T6 Code Quality Validation

T6 may optionally validate:

```text
Correctness
Readability
Type safety
Error handling
Input immutability
Complexity
Security
Architecture
```

The criteria should depend on the task.

For a beginner task:

```text
Correctness
```

may be sufficient.

For advanced implementation:

```text
Correctness
+
Security
+
Performance
+
Maintainability
```

may be required.

---

# 28. T6 Implementation Scope

T6 can exist at different scales.

### Small

```text
Function
```

### Medium

```text
Class
+
Tests
```

### Larger

```text
Component
+
API
+
Validation
```

### Advanced

```text
Small subsystem
+
Integration
+
Tests
```

However, very large professional projects belong closer to T8.

---

# 29. T6 Implementation vs Real-World T8

### T6

> Implement the required permission checker according to these requirements.

### T8

> Take responsibility for authorization in an actual application, determine requirements, review the existing system, implement the required changes, document the design, test it, and prepare it for deployment.

T6 has **defined implementation boundaries**.

T8 has **broader professional ownership**.

---

# 30. T6 Implementation Guidance

Guidance can be available, but it should not dominate.

Example:

```text
Need help?

Hint:
Start by identifying the function's input
and required output contract.
```

Another:

> Consider what should happen when the permission list is missing.

The learner still owns the implementation.

---

# 31. T6 Optional Design Phase

For larger implementations, the learner may first submit a design.

```text
Requirements
    ↓
Design
    ↓
Implementation
    ↓
Tests
```

Example:

> Identify the components you will create before writing the implementation.

This is useful for architecture-oriented T6 tasks.

---

# 32. T6 Design Submission

```text
┌──────────────────────────────────────────────┐
│ DESIGN                                       │
├──────────────────────────────────────────────┤
│                                              │
│ Components                                   │
│ [__________________________________________] │
│                                              │
│ Responsibilities                            │
│ [__________________________________________] │
│                                              │
│ Data Flow                                    │
│ [__________________________________________] │
│                                              │
│ [ Continue to Implementation ]               │
└──────────────────────────────────────────────┘
```

Design submission should be optional depending on task complexity.

---

# 33. T6 Implementation UI

```text
┌──────────────────────────────────────────────────┐
│ IMPLEMENTATION TASK                              │
├──────────────────────────────────────────────────┤
│                                                  │
│ OBJECTIVE                                        │
│ Implement a permission-checking component.       │
│                                                  │
│ REQUIREMENTS                                     │
│ ✓ Check required permission                      │
│ ✓ Reject missing permission                      │
│ ✓ Preserve authorization boundaries              │
│                                                  │
│ WORKSPACE                                        │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │              Code Editor                    │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ TESTS                                            │
│ 3 / 5 passing                                   │
│                                                  │
│ [ Run Tests ]                                    │
│                                                  │
│ [ Submit Implementation ]                        │
└──────────────────────────────────────────────────┘
```

---

# 34. T6 Progress Model

Unlike T3, T6 does not necessarily need predefined steps.

The learner progresses through implementation states:

```text
NOT_STARTED
     ↓
IMPLEMENTING
     ↓
TESTING
     ↓
ITERATING
     ↓
VERIFYING
     ↓
COMPLETE
```

This reflects actual implementation work.

---

# 35. T6 Iteration Loop

```text
REQUIREMENTS
      ↓
IMPLEMENT
      ↓
RUN TESTS
      ↓
FAIL?
 ┌────┴────┐
YES       NO
 │         │
 ▼         ▼
ITERATE  COMPLETE
 │
 └──────→ IMPLEMENT
```

This is central to implementation tasks.

---

# 36. T6 Partial Completion

Suppose:

```text
5 requirements
```

The learner satisfies:

```text
✓ Requirement 1
✓ Requirement 2
✓ Requirement 3
✗ Requirement 4
✗ Requirement 5
```

The task remains incomplete.

The UI can show:

```text
3 / 5 requirements satisfied
```

---

# 37. T6 Requirement Validation

```json
{
  "requirements": [
    {
      "id": "REQ-01",
      "description": "Validate permission",
      "status": "passed"
    },
    {
      "id": "REQ-02",
      "description": "Reject missing permission",
      "status": "passed"
    },
    {
      "id": "REQ-03",
      "description": "Preserve authorization boundary",
      "status": "failed"
    }
  ]
}
```

This provides precise feedback.

---

# 38. T6 Completion Criteria

A strong T6 normally requires:

```text
All required behavior
        +
Required tests
        +
No critical failures
        =
COMPLETE
```

Optional criteria can include:

```text
Code quality
Performance
Security
Documentation
```

depending on the task.

---

# 39. T6 Example — Full Permission Component

### Requirements

> Implement `hasPermission(user, permission)`.

Rules:

```text
1. Return true when the user has the permission.
2. Return false when they do not.
3. Return false when permissions are missing.
4. Do not mutate the user object.
5. Do not treat authentication as authorization.
```

### Learner implementation

```python
def has_permission(user, permission):
    permissions = user.get("permissions", [])
    return permission in permissions
```

### Validation

```text
✓ Permission present
✓ Permission absent
✓ Missing permissions
✓ User unchanged
✓ Authentication not treated as authorization
```

That is a compact T6.

---

# 40. T6 Example — Larger Implementation

### Task

> Implement a reusable authorization service.

Requirements:

```text
• Resolve user identity.
• Resolve assigned roles.
• Resolve permissions.
• Evaluate requested permission.
• Deny by default.
• Return a structured authorization result.
```

The learner must design the implementation.

Possible result:

```json
{
  "allowed": true,
  "reason": "permission_granted"
}
```

The exact architecture may be intentionally left to the learner.

---

# 41. T6 Security-Oriented Validation

For authentication/authorization tasks, hidden tests can validate:

```text
✓ Valid user
✓ Invalid user
✓ Missing permission
✓ Wrong permission
✓ Deny by default
✓ No privilege escalation
✓ Existing permissions preserved
```

This makes T6 appropriate for advanced security education.

---

# 42. T6 Example — API Implementation

### Requirement

> Implement an endpoint that allows authenticated users to retrieve their own profile.

Requirements:

```text
• Authentication required.
• User identity comes from trusted authentication context.
• User cannot request another user's private profile through the endpoint.
• Return appropriate unauthorized/forbidden responses.
• Do not expose sensitive fields.
```

This is an implementation task because the learner builds the behavior.

---

# 43. T6 Implementation Analytics

Useful metrics:

```text
taskStarted
implementationStarted
testRuns
testsPassed
testsFailed
requirementsSatisfied
iterations
timeToFirstPassingTest
timeToComplete
completed
```

Example:

```json
{
  "implementationAnalytics": {
    "testRuns": 7,
    "testsPassed": 8,
    "testsFailed": 3,
    "iterations": 5,
    "requirementsSatisfied": 100,
    "completed": true
  }
}
```

---

# 44. T6 Mastery Signal

T6 answers:

> **Can the learner independently turn defined requirements into a working implementation?**

That is a stronger skill than merely recognizing the correct answer.

The progression is:

```text
Understand
   ↓
Apply
   ↓
Accomplish
   ↓
Build
```

T6 represents **Build**.

---

# 45. T6 Authoring Rules

A strong T6 should:

```text
✓ Define a clear implementation objective
✓ Define functional requirements
✓ Define important constraints
✓ Leave reasonable implementation freedom
✓ Provide an appropriate workspace
✓ Provide meaningful validation
✓ Support iteration
✓ Test behavior rather than syntax
```

Avoid:

```text
❌ Giving the complete solution
❌ Prescribing every implementation line
❌ Making the task only a fill-in-the-blank exercise
❌ Requiring one arbitrary coding style
❌ Making validation depend on exact source text
```

---

# 46. T6 Implementation Freedom

This is a core principle.

If the requirement is:

> Return active users.

The system should not normally require:

```python
users = [user for user in users if user["active"]]
```

It should accept any correct implementation satisfying the contract.

Therefore:

```text
Requirement
      ↓
Multiple valid implementations
      ↓
Same expected behavior
```

This is important for serious technical education.

---

# 47. T6 Difficulty Progression

Difficulty can increase through:

```text
Single function
      ↓
Class/component
      ↓
Multiple components
      ↓
Integration
      ↓
Architecture constraints
      ↓
Security/performance requirements
```

But once ambiguity and professional ownership become dominant, the task moves toward T7/T8.

---

# 48. T6 Boundary With T7

T6:

> Implement this permission service according to these requirements.

T7:

> Design and implement a permission system that handles a difficult set of competing requirements under significant constraints.

T7 increases:

```text
Ambiguity
+
Complexity
+
Trade-offs
+
Independent reasoning
```

---

# 49. T6 Boundary With T8

T6:

```text
Defined requirements
+
Defined scope
+
Implementation
+
Validation
```

T8:

```text
Real-world objective
+
Professional constraints
+
Open-ended execution
+
Deliverable
+
Documentation
+
Verification
+
Professional ownership
```

---

# 50. T6 Final Mental Model

```text
                         T6
                 IMPLEMENTATION TASK
                         │
                         ▼
                    REQUIREMENTS
                         │
                         ▼
                   DESIGN / PLAN
                         │
                         ▼
                    IMPLEMENT
                         │
                         ▼
                      TEST
                         │
                    ┌────┴────┐
                    ▼         ▼
                  FAIL       PASS
                    │         │
                    ▼         ▼
                ITERATE    VERIFY
                              │
                              ▼
                          COMPLETE
```

The defining principle is:

> **The learner owns the implementation while the task defines the required outcome.**

---

# 51. T6 Final Technical Specification

| Area                                  | T6 Decision                                |
| ------------------------------------- | ------------------------------------------ |
| **Block**                             | **TaskBlock**                              |
| **Version**                           | **T6**                                     |
| **Presentation**                      | **Implementation Task**                    |
| **Primary purpose**                   | Build a solution from defined requirements |
| **Requirements**                      | Required                                   |
| **Implementation ownership**          | Core                                       |
| **Design freedom**                    | Supported                                  |
| **Workspace**                         | Required                                   |
| **Testing**                           | Required/recommended                       |
| **Hidden tests**                      | Supported                                  |
| **Multiple valid implementations**    | Supported                                  |
| **Iteration**                         | Core                                       |
| **Guidance**                          | Optional                                   |
| **Diagnosis**                         | ❌ Not defining                             |
| **Debugging**                         | ❌ Not defining                             |
| **Scenario**                          | Optional context                           |
| **Challenge-level ambiguity**         | ❌ Not defining                             |
| **Real-world professional ownership** | ❌                                          |
| **Requirement validation**            | ✅                                          |
| **Behavioral validation**             | ✅                                          |
| **Progress persistence**              | ✅                                          |
| **Retry**                             | ✅                                          |
| **Implementation analytics**          | ✅                                          |
| **Quiz score**                        | ❌                                          |
| **Theme**                             | Light                                      |
| **Primary**                           | **#F54A8D**                                |
| **Secondary**                         | **#0B1B3D**                                |
| **Gradient**                          | ❌                                          |
| **Dark theme**                        | ❌                                          |
| **Responsive**                        | ✅                                          |
| **Accessible**                        | ✅                                          |
| **JSON-driven**                       | ✅                                          |

---

# 52. TaskBlock Progress

We now have:

```text
T1 — Simple Task
        ↓
T2 — Guided Task
        ↓
T3 — Multi-Step Task
        ↓
T4 — Scenario Task
        ↓
T5 — Debugging Task
        ↓
T6 — Implementation Task
```

The conceptual progression is:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON + ACCOMPLISH WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
    ↓
BUILD + IMPLEMENT
```

The next version is:

> **T7 — Challenge Task**

T7 will deliberately increase **difficulty, ambiguity, constraints, trade-offs, and independent problem-solving**, while still remaining a TaskBlock rather than becoming the fully open-ended professional responsibility represented by T8.

## **T6 — Implementation Task: COMPLETE** ✅



```python

```

# BLOCK 14 — TaskBlock

## T7 — Challenge Task

Yes. We continue with **only T7**, exactly one version at a time.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| T1      | Simple Task         | ✅ Complete     |
| T2      | Guided Task         | ✅ Complete     |
| T3      | Multi-Step Task     | ✅ Complete     |
| T4      | Scenario Task       | ✅ Complete     |
| T5      | Debugging Task      | ✅ Complete     |
| T6      | Implementation Task | ✅ Complete     |
| **T7**  | **Challenge Task**  | 🔵 **CURRENT** |
| T8      | Real-World Task     | ⏳              |

---

# 1. What Is T7 — Challenge Task?

**T7 — Challenge Task** is a deliberately difficult task designed to test whether the learner can **independently solve a complex problem under meaningful constraints**.

The defining principle is:

> **The learner is given a challenging objective, but the path to the solution is intentionally not fully prescribed.**

The core model is:

```text
CHALLENGE
    ↓
UNDERSTAND REQUIREMENTS
    ↓
ANALYZE CONSTRAINTS
    ↓
PLAN
    ↓
SOLVE
    ↓
TEST
    ↓
REFINE
    ↓
COMPLETE
```

T7 therefore represents a significant jump in independent problem-solving.

---

# 2. T7 Position in TaskBlock

```text
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

The progression is now:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON + ACCOMPLISH WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
    ↓
BUILD + IMPLEMENT
    ↓
SOLVE A COMPLEX CHALLENGE
```

---

# 3. What Makes T7 Different?

T7 deliberately increases:

```text
Complexity
Ambiguity
Constraints
Trade-offs
Independence
Reasoning
Solution space
```

The learner is no longer primarily being evaluated on:

> "Can you follow the process?"

Instead:

> **"Can you figure out an effective solution when the solution path is not obvious?"**

---

# 4. T7 vs T6

This is the most important boundary.

### T6 — Implementation Task

The requirements are defined and the implementation scope is clear.

```text
Requirements
      ↓
Implementation
      ↓
Tests
      ↓
Complete
```

### T7 — Challenge Task

The requirements are intentionally more demanding.

```text
Challenge
      ↓
Analyze
      ↓
Determine approach
      ↓
Solve
      ↓
Evaluate trade-offs
      ↓
Refine
```

T6 asks:

> **Can you build this?**

T7 asks:

> **Can you figure out how to solve this difficult problem?**

---

# 5. T7 vs T5

### T5

There is an existing failure.

```text
Problem
 ↓
Diagnosis
 ↓
Fix
```

### T7

There may not be a predefined failure.

```text
Challenge
 ↓
Problem-solving
 ↓
Solution
```

T7 may contain debugging, but debugging is not its defining characteristic.

---

# 6. T7 vs T4

### T4

The learner reasons within a defined scenario.

```text
Scenario
 ↓
Understand context
 ↓
Decision
 ↓
Action
```

### T7

The learner faces a more difficult problem with multiple possible approaches.

```text
Challenge
 ↓
Analyze
 ↓
Design
 ↓
Choose trade-offs
 ↓
Solve
```

---

# 7. T7 vs T8

This distinction must remain especially clear.

### T7 — Challenge Task

```text
Defined educational challenge
+
High difficulty
+
Complex reasoning
+
Meaningful constraints
```

### T8 — Real-World Task

```text
Real-world professional objective
+
Broader ambiguity
+
Professional ownership
+
Deliverable
+
Realistic operational constraints
```

T7 is a **challenging learning task**.

T8 is a **professional-style accomplishment**.

---

# 8. T7 Core Learning Objective

T7 evaluates whether the learner can independently:

* decompose a difficult problem
* identify constraints
* choose an approach
* reason about alternatives
* implement a solution
* test it
* recognize weaknesses
* refine the solution
* justify important decisions

The learner should experience:

> **"I need to figure this out."**

rather than:

> **"I need to follow these instructions."**

---

# 9. T7 Challenge Model

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
                 EXPLORE APPROACHES
                        │
                        ▼
                  SELECT APPROACH
                        │
                        ▼
                    IMPLEMENT
                        │
                        ▼
                     TEST
                        │
                  ┌─────┴─────┐
                  ▼           ▼
                FAIL         PASS
                  │           │
                  ▼           ▼
               REVISE      EVALUATE
                              │
                              ▼
                           COMPLETE
```

---

# 10. T7 Challenge Should Not Give the Solution Path

A T7 should generally avoid:

```text
Step 1: Do this
Step 2: Do this
Step 3: Do this
Step 4: Do this
```

That would make it closer to T3.

Instead:

```text
Requirements
Constraints
Expected outcome
Available resources
```

Then:

> **Solve the problem.**

---

# 11. T7 Example — Python

### Challenge

> Implement a function that removes duplicate values from a large sequence while preserving the order of first occurrence.

Constraints:

```text
• Preserve original ordering.
• Do not modify the input.
• Handle empty input.
• Support large inputs efficiently.
• Avoid unnecessary repeated scanning.
```

The learner must determine the appropriate algorithm.

There may be several valid implementations.

The challenge is not simply writing syntax.

It is reasoning about:

```text
Correctness
+
Order
+
Memory
+
Time complexity
```

---

# 12. T7 Example — Memory

### Challenge

> Design a solution that allows two parts of an application to work with independently mutable collections while minimizing unnecessary copying.

Constraints:

```text
• Independent mutation must be guaranteed.
• Original data must remain unchanged.
• Avoid unnecessary duplication where possible.
• Explain the chosen copying strategy.
```

Now the learner must reason about:

```text
Reference sharing
Copying
Mutability
Memory cost
Performance
```

That is a genuine challenge.

---

# 13. T7 Example — Exception Handling

### Challenge

> Design a data-processing function that processes thousands of records while safely handling malformed records without terminating the entire operation.

Constraints:

```text
• Valid records must continue processing.
• Invalid records must be captured.
• Unexpected programming errors must not be silently swallowed.
• Processing results must identify failures.
• The implementation should avoid unnecessary exception handling around unrelated code.
```

The learner must reason about exception boundaries.

---

# 14. T7 Example — Authorization

### Challenge

> Design and implement an authorization check that supports roles and permissions while preventing privilege escalation.

Constraints:

```text
• Authentication must remain separate from authorization.
• Deny by default.
• Users may have multiple roles.
• Permissions may overlap.
• Missing permissions must not grant access.
• Existing authorization behavior must remain compatible.
```

The learner must determine the architecture and implementation.

---

# 15. T7 Example — Authentication

### Challenge

> Design a secure session validation flow that handles expired credentials, invalid credentials, missing credentials, and authenticated requests without exposing sensitive authentication information.

The learner must reason about:

```text
Session state
Token validation
Expiration
Error handling
Security boundaries
Response behavior
```

There is no single trivial path.

---

# 16. T7 Example — Database

### Challenge

> Design a safe partial-update mechanism for user profiles that prevents accidental overwrites while remaining efficient for frequent updates.

Constraints:

```text
• Only supplied fields should change.
• Missing fields must remain unchanged.
• Invalid fields must be rejected.
• Updates must be atomic.
• Existing data integrity must be preserved.
```

Now the learner has to think about more than syntax.

---

# 17. T7 Challenge Constraints

Constraints are one of the strongest mechanisms for creating a challenge.

Possible constraint types:

```text
Time
Memory
Performance
Security
Compatibility
Backward compatibility
API contract
Data integrity
Scalability
Maintainability
Resource limits
```

For example:

> Solve the problem without changing the existing public API.

This creates meaningful reasoning.

---

# 18. T7 Trade-Offs

A strong T7 can require the learner to balance competing objectives.

Example:

```text
Performance
     ↕
Memory
```

or:

```text
Simplicity
     ↕
Flexibility
```

or:

```text
Security
     ↕
Convenience
```

The learner may need to justify the chosen approach.

---

# 19. T7 Multiple Valid Solutions

T7 should often allow several correct solutions.

Example:

```text
Solution A
O(n) time
O(n) memory

Solution B
O(n log n) time
O(1) additional memory

Solution C
Different trade-off
```

The system should evaluate whether the solution satisfies the challenge requirements.

---

# 20. T7 Solution Quality

T7 can evaluate multiple dimensions:

```text
Correctness
Performance
Memory
Security
Maintainability
Robustness
Design quality
```

Example:

| Dimension       | Result |
| --------------- | ------ |
| Correctness     | ✅      |
| Performance     | ✅      |
| Memory          | ⚠️     |
| Security        | ✅      |
| Maintainability | ✅      |

This is more informative than a simple pass/fail.

---

# 21. T7 Challenge UI

```text
┌──────────────────────────────────────────────────┐
│ CHALLENGE TASK                                   │
├──────────────────────────────────────────────────┤
│                                                  │
│ OBJECTIVE                                        │
│ Design an efficient ordered-deduplication        │
│ solution for large inputs.                       │
│                                                  │
│ CONSTRAINTS                                      │
│                                                  │
│ • Preserve ordering                              │
│ • Do not mutate input                            │
│ • Support large datasets                         │
│ • Avoid unnecessary repeated scanning            │
│                                                  │
│ AVAILABLE INFORMATION                            │
│                                                  │
│ • Input contract                                 │
│ • Performance target                             │
│ • Test suite                                     │
│                                                  │
│ YOUR APPROACH                                    │
│ [______________________________________________] │
│                                                  │
│ IMPLEMENTATION                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │              Code Workspace                 │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Run Tests ]       [ Submit Challenge ]         │
└──────────────────────────────────────────────────┘
```

---

# 22. T7 Optional Planning Area

A challenge may optionally provide a planning area.

```text
┌──────────────────────────────────────────────┐
│ YOUR APPROACH                                │
├──────────────────────────────────────────────┤
│                                              │
│ Algorithm:                                   │
│ [__________________________________________] │
│                                              │
│ Complexity:                                  │
│ [__________________________________________] │
│                                              │
│ Trade-offs:                                  │
│ [__________________________________________] │
│                                              │
└──────────────────────────────────────────────┘
```

This helps evaluate reasoning, not just final code.

---

# 23. T7 Planning Is Optional

Not every T7 requires explicit planning.

### Coding challenge

May only require implementation.

### Architecture challenge

Planning should probably be required.

### Algorithm challenge

Complexity analysis may be required.

Therefore:

> The challenge schema should support optional reasoning artifacts.

---

# 24. T7 Reasoning Artifact

Possible artifacts:

```text
Plan
Algorithm explanation
Architecture diagram
Trade-off analysis
Complexity analysis
Security rationale
Test strategy
```

Example:

```json
{
  "reasoning": {
    "required": true,
    "artifacts": [
      "approach",
      "complexity",
      "tradeoffs"
    ]
  }
}
```

---

# 25. T7 Difficulty Through Reduced Scaffolding

T7 should generally provide less direct guidance than T2.

Progression:

```text
T2
Strong guidance available

T3
Workflow provided

T4
Scenario provided

T5
Evidence provided

T6
Requirements provided

T7
Challenge + constraints provided
```

The learner's independent reasoning increases.

---

# 26. T7 Guidance

Hints can still exist.

But they should be deliberately restrained.

Example:

### Hint 1

> Consider the dominant constraint first.

### Hint 2

> Think about whether your approach repeatedly scans the same input.

### Hint 3

> Consider whether an auxiliary data structure could reduce repeated work.

The final solution should remain the learner's responsibility.

---

# 27. T7 Hint Cost

An advanced feature is to track hint usage.

```text
No hints
→ highest independence

One hint
→ moderate support

Several hints
→ significant support
```

The learner can still complete the challenge, but analytics can record the assistance level.

---

# 28. T7 Challenge Attempts

T7 should encourage iteration.

```text
Attempt 1
   ↓
Tests
   ↓
Performance issue
   ↓
Refine
   ↓
Attempt 2
   ↓
Tests
   ↓
Pass
```

This is closer to genuine problem solving than one-shot assessment.

---

# 29. T7 Performance Constraints

For advanced technical challenges, tests can enforce performance.

Example:

```text
Correctness
✓

Runtime
✓

Memory
✗
```

The learner must refine the implementation.

This is particularly useful for:

* algorithms
* database queries
* backend systems
* authorization
* data processing

---

# 30. T7 Security Constraints

For security-focused tasks:

```text
Functional tests
✓

Authorization tests
✓

Privilege escalation tests
✗
```

The challenge remains incomplete.

This prevents learners from optimizing only for the happy path.

---

# 31. T7 Hidden Constraints

Some constraints can remain hidden to prevent gaming.

Example:

```text
Visible:
Correctness
Performance target

Hidden:
Large input
Boundary cases
Privilege escalation
```

The learner discovers whether their solution is robust through validation.

---

# 32. T7 Edge Cases

Challenge tasks should often contain edge cases.

Example:

```text
Empty input
Single item
Duplicate values
Very large input
Missing values
Unexpected values
Boundary conditions
```

The learner should create a robust solution.

---

# 33. T7 Example — Ordered Deduplication

Requirement:

> Remove duplicates while preserving first-occurrence order.

Inputs:

```text
[]
[1]
[1, 2, 1, 3, 2]
```

Expected:

```text
[]
[1]
[1, 2, 3]
```

Constraint:

> Must handle a large input efficiently.

The learner must reason about both:

```text
Correctness
+
Complexity
```

---

# 34. T7 Evaluation Model

A strong T7 can use weighted evaluation:

```text
Correctness       50%
Performance       20%
Robustness        15%
Maintainability   10%
Explanation        5%
```

Weights should depend on the challenge.

The important point is that evaluation can be multidimensional.

---

# 35. T7 Partial Success

T7 does not have to be simply:

```text
PASS / FAIL
```

It can show:

```text
Correctness     100%
Performance      60%
Robustness       80%
Security        100%
```

Then:

> Solution is functionally correct but does not meet the required performance target.

The learner can refine the solution.

---

# 36. T7 Completion Criteria

Recommended:

```text
Required functional behavior
        +
Critical constraints satisfied
        +
Required quality thresholds
        =
COMPLETE
```

For example:

```text
Correctness ✓
Performance ✓
Memory ✓
Security ✓
```

---

# 37. T7 Challenge Lifecycle

```text
NOT_STARTED
     ↓
READ_CHALLENGE
     ↓
PLANNING
     ↓
IMPLEMENTING
     ↓
TESTING
     ↓
EVALUATING
     │
 ┌───┴────┐
 ▼        ▼
FAIL     PASS
 │        │
 ▼        ▼
REFINE   COMPLETE
 │
 └──────→ IMPLEMENTING
```

---

# 38. T7 JSON Structure

```json
{
  "type": "task",
  "version": "T7",
  "presentation": "Challenge Task",

  "content": {
    "title": "",
    "challenge": "",
    "objective": "",
    "constraints": [],
    "successCriteria": []
  },

  "reasoning": {
    "enabled": false,
    "required": false,
    "artifacts": []
  },

  "workspace": {
    "type": ""
  },

  "validation": {
    "mode": "",
    "criteria": [],
    "hiddenTests": true
  },

  "evaluation": {
    "dimensions": []
  },

  "metadata": {
    "difficulty": "hard",
    "estimatedMinutes": 0
  }
}
```

---

# 39. Complete T7 JSON Example

```json
{
  "type": "task",
  "version": "T7",
  "presentation": "Challenge Task",

  "content": {
    "title": "Build an Efficient Ordered Deduplication Utility",

    "challenge": "Implement a utility that removes duplicate values from a large input sequence while preserving the order of their first occurrence.",

    "objective": "Produce a correct and efficient implementation that remains reliable for large inputs.",

    "constraints": [
      "Preserve first-occurrence ordering.",
      "Do not mutate the input sequence.",
      "Handle empty input.",
      "Handle repeated values.",
      "The implementation must scale efficiently for large inputs.",
      "The public function contract must remain unchanged."
    ],

    "successCriteria": [
      "All functional tests pass.",
      "The implementation meets the required performance threshold.",
      "The input remains unchanged.",
      "Boundary cases are handled correctly."
    ]
  },

  "reasoning": {
    "enabled": true,
    "required": true,

    "artifacts": [
      "approach",
      "complexity",
      "tradeoffs"
    ]
  },

  "workspace": {
    "type": "code",
    "language": "python",

    "starterCode": "def unique_in_order(values):\n    pass\n"
  },

  "validation": {
    "mode": "behavioral",

    "criteria": [
      "Correct ordered deduplication.",
      "Input immutability.",
      "Empty input handling.",
      "Large-input performance."
    ],

    "hiddenTests": true
  },

  "evaluation": {
    "dimensions": [
      {
        "name": "correctness",
        "weight": 50
      },
      {
        "name": "performance",
        "weight": 20
      },
      {
        "name": "robustness",
        "weight": 15
      },
      {
        "name": "maintainability",
        "weight": 10
      },
      {
        "name": "reasoning",
        "weight": 5
      }
    ]
  },

  "metadata": {
    "difficulty": "hard",
    "estimatedMinutes": 30
  }
}
```

---

# 40. T7 Challenge UI — Final Concept

```text
┌──────────────────────────────────────────────────┐
│ CHALLENGE TASK                                   │
│ Build an Efficient Ordered Deduplication Utility │
├──────────────────────────────────────────────────┤
│                                                  │
│ CHALLENGE                                        │
│ Build a solution that removes duplicates while   │
│ preserving first-occurrence ordering.            │
│                                                  │
│ CONSTRAINTS                                      │
│                                                  │
│ • Preserve ordering                              │
│ • Do not mutate input                            │
│ • Handle large inputs                            │
│ • Meet performance requirements                  │
│                                                  │
│ YOUR APPROACH                                    │
│ [______________________________________________] │
│                                                  │
│ COMPLEXITY                                       │
│ [______________________________________________] │
│                                                  │
│ IMPLEMENTATION                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │              Code Workspace                 │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ TEST RESULTS                                    │
│ ✓ Correctness                                   │
│ ✓ Edge Cases                                    │
│ ✗ Performance                                   │
│                                                  │
│ [ Run Tests ]        [ Refine Solution ]         │
└──────────────────────────────────────────────────┘
```

---

# 41. T7 Analytics

Useful metrics:

```text
challengeStarted
planningStarted
implementationStarted
attempts
testRuns
hintsUsed
constraintsSatisfied
constraintsFailed
performanceScore
correctnessScore
reasoningScore
timeToFirstSolution
timeToComplete
completed
```

Especially useful:

```text
timeToFirstSolution
```

and:

```text
iterations
```

because they show problem-solving behavior.

---

# 42. T7 Mastery Signal

T7 answers:

> **Can the learner independently solve a difficult problem when there is no obvious prescribed path?**

The mastery signal is therefore:

```text
Understand
   ↓
Analyze
   ↓
Design
   ↓
Implement
   ↓
Evaluate
   ↓
Refine
```

This is a significant step beyond T6.

---

# 43. T7 Authoring Rules

A strong T7 should:

```text
✓ Be genuinely difficult
✓ Have a meaningful objective
✓ Include meaningful constraints
✓ Allow multiple approaches
✓ Require independent reasoning
✓ Allow iteration
✓ Test edge cases
✓ Evaluate important trade-offs
✓ Avoid prescribing the solution path
```

Avoid:

```text
❌ Calling an ordinary task a challenge
❌ Giving a complete step-by-step solution
❌ Making the difficulty come only from a large amount of text
❌ Requiring one arbitrary implementation
❌ Creating difficulty through irrelevant information
❌ Making it impossible without hidden information
```

---

# 44. T7 Difficulty Must Come From Reasoning

This is critical.

Bad difficulty:

> Write 500 lines of code.

Good difficulty:

> Design a solution that satisfies these competing constraints.

Therefore:

```text
BAD
Length → Difficulty

GOOD
Reasoning + Constraints → Difficulty
```

---

# 45. T7 Challenge Quality Test

Before creating a T7, ask:

### 1. Is the solution path obvious?

If yes, it may be T6.

### 2. Are there meaningful constraints?

If no, it may not be a genuine challenge.

### 3. Are multiple approaches possible?

Preferably yes.

### 4. Does the learner need to reason independently?

If yes, T7 is appropriate.

### 5. Is the task still educationally bounded?

If yes, it remains T7.

If the learner is effectively being asked to take ownership of an open-ended professional problem, it is approaching T8.

---

# 46. T7 Boundary With T8

The distinction can be summarized as:

```text
T7
┌─────────────────────────────┐
│ Educational Challenge       │
│                             │
│ Defined objective           │
│ Meaningful constraints      │
│ Multiple approaches         │
│ High difficulty             │
│ Independent solving         │
└─────────────────────────────┘

T8
┌─────────────────────────────┐
│ Real-World Task              │
│                             │
│ Professional objective       │
│ Broader ambiguity            │
│ Operational constraints      │
│ Deliverable ownership        │
│ Real-world consequences      │
└─────────────────────────────┘
```

---

# 47. T7 Final Mental Model

```text
                         T7
                  CHALLENGE TASK
                         │
                         ▼
                     CHALLENGE
                         │
                         ▼
                  ANALYZE PROBLEM
                         │
                         ▼
                IDENTIFY CONSTRAINTS
                         │
                         ▼
                  DESIGN APPROACH
                         │
                         ▼
                    IMPLEMENT
                         │
                         ▼
                      TEST
                         │
                    ┌────┴────┐
                    ▼         ▼
                  FAIL       PASS
                    │         │
                    ▼         ▼
                  REFINE   EVALUATE
                              │
                              ▼
                           COMPLETE
```

The defining principle is:

> **The learner must independently solve a difficult, bounded problem rather than simply execute a known procedure.**

---

# 48. T7 Final Technical Specification

| Area                                  | T7 Decision                                        |
| ------------------------------------- | -------------------------------------------------- |
| **Block**                             | **TaskBlock**                                      |
| **Version**                           | **T7**                                             |
| **Presentation**                      | **Challenge Task**                                 |
| **Primary purpose**                   | Independent solving of a difficult bounded problem |
| **Challenge complexity**              | Core                                               |
| **Ambiguity**                         | Supported                                          |
| **Constraints**                       | Core                                               |
| **Trade-offs**                        | Strongly recommended                               |
| **Independent reasoning**             | Core                                               |
| **Implementation**                    | Often required                                     |
| **Multiple solutions**                | Supported                                          |
| **Planning**                          | Optional / recommended for complex tasks           |
| **Reasoning artifacts**               | Optional                                           |
| **Iteration**                         | Core                                               |
| **Hidden tests**                      | Supported                                          |
| **Performance constraints**           | Supported                                          |
| **Security constraints**              | Supported                                          |
| **Guidance**                          | Limited/optional                                   |
| **Debugging**                         | May be included, not defining                      |
| **Scenario**                          | May be included, not defining                      |
| **Real-world professional ownership** | ❌                                                  |
| **Progress persistence**              | ✅                                                  |
| **Retry**                             | ✅                                                  |
| **Multi-dimensional evaluation**      | ✅                                                  |
| **Quiz score**                        | ❌                                                  |
| **Theme**                             | Light                                              |
| **Primary**                           | **#F54A8D**                                        |
| **Secondary**                         | **#0B1B3D**                                        |
| **Gradient**                          | ❌                                                  |
| **Dark theme**                        | ❌                                                  |
| **Responsive**                        | ✅                                                  |
| **Accessible**                        | ✅                                                  |
| **JSON-driven**                       | ✅                                                  |

---

# 49. TaskBlock Progress

We now have:

```text
T1 — Simple Task
        ↓
T2 — Guided Task
        ↓
T3 — Multi-Step Task
        ↓
T4 — Scenario Task
        ↓
T5 — Debugging Task
        ↓
T6 — Implementation Task
        ↓
T7 — Challenge Task
```

The conceptual progression is:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON + ACCOMPLISH WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
    ↓
BUILD + IMPLEMENT
    ↓
INDEPENDENTLY SOLVE A DIFFICULT CHALLENGE
```

The **final TaskBlock version** is:

> **T8 — Real-World Task**

T8 will represent the highest TaskBlock level: **professional-style work with a realistic objective, broader ambiguity, constraints, deliverables, verification, and ownership**, while still remaining an educational task.

## **T7 — Challenge Task: COMPLETE** ✅



```python

```

# BLOCK 14 — TaskBlock

## T8 — Real-World Task

Yes. We now complete the **final version of TaskBlock**: **T8 — Real-World Task**.

The committed sequence remains:

| Version | Presentation        | Status         |
| ------- | ------------------- | -------------- |
| T1      | Simple Task         | ✅ Complete     |
| T2      | Guided Task         | ✅ Complete     |
| T3      | Multi-Step Task     | ✅ Complete     |
| T4      | Scenario Task       | ✅ Complete     |
| T5      | Debugging Task      | ✅ Complete     |
| T6      | Implementation Task | ✅ Complete     |
| T7      | Challenge Task      | ✅ Complete     |
| **T8**  | **Real-World Task** | 🔵 **CURRENT** |

---

# 1. What Is T8 — Real-World Task?

**T8 — Real-World Task** is the highest-level TaskBlock presentation.

It asks the learner to accomplish a **realistic professional objective** where the solution is not completely prescribed.

The defining principle is:

> **The learner must take ownership of a realistic outcome, make appropriate decisions, produce a meaningful deliverable, and verify that the result satisfies the objective.**

The core model is:

```text
REAL-WORLD OBJECTIVE
        ↓
UNDERSTAND REQUIREMENTS
        ↓
ANALYZE CONTEXT
        ↓
PLAN
        ↓
MAKE DECISIONS
        ↓
EXECUTE
        ↓
TEST / VALIDATE
        ↓
REFINE
        ↓
DELIVER
        ↓
VERIFY
```

---

# 2. T8 Position in TaskBlock

```text
T1
Simple Task
   ↓
T2
Guided Task
   ↓
T3
Multi-Step Task
   ↓
T4
Scenario Task
   ↓
T5
Debugging Task
   ↓
T6
Implementation Task
   ↓
T7
Challenge Task
   ↓
T8
Real-World Task
```

The complete progression is now:

```text
ACCOMPLISH
    ↓
ACCOMPLISH WITH GUIDANCE
    ↓
ACCOMPLISH A WORKFLOW
    ↓
REASON WITHIN A SCENARIO
    ↓
DIAGNOSE + CORRECT
    ↓
BUILD + IMPLEMENT
    ↓
INDEPENDENTLY SOLVE A CHALLENGE
    ↓
TAKE OWNERSHIP OF A REALISTIC OBJECTIVE
```

---

# 3. T8 Is Not Just "Harder T7"

This distinction is critical.

T8 should **not** simply mean:

> T7 + more difficulty.

Instead, T8 changes the nature of the task.

### T7

```text
Educational Challenge
+
High complexity
+
Meaningful constraints
+
Independent solution
```

### T8

```text
Professional-style Objective
+
Realistic context
+
Ambiguity
+
Constraints
+
Decisions
+
Deliverable
+
Verification
+
Ownership
```

Therefore:

> **T7 measures advanced problem-solving. T8 simulates professional accomplishment.**

---

# 4. T8 vs T7

### T7

> Implement an efficient authorization system satisfying these constraints.

### T8

> A growing SaaS application needs its authorization model improved. Review the existing authorization behavior, identify the requirements and risks, design an appropriate approach, implement the changes, test them, document the result, and provide the completed authorization solution.

The difference is **ownership of the objective**.

---

# 5. T8 vs T6

### T6

Requirements are clearly defined:

```text id="b0k2qp"
Implement X
according to requirements A, B, C.
```

### T8

The learner may need to determine:

```text id="g2c8ns"
What is actually required?
What should be changed?
What should remain unchanged?
What risks exist?
What approach is appropriate?
How should success be demonstrated?
```

T8 therefore introduces **professional judgment**.

---

# 6. T8 vs T4

T4 gives a defined scenario.

T8 gives a realistic professional objective.

```text id="s7k4ma"
T4
Scenario
 ↓
Decision
 ↓
Task
 ↓
Validation

T8
Objective
 ↓
Requirements discovery
 ↓
Analysis
 ↓
Planning
 ↓
Execution
 ↓
Deliverable
 ↓
Professional verification
```

---

# 7. T8 vs T5

T5:

> Find why the authentication request fails and fix it.

T8:

> Take responsibility for improving the authentication/session behavior of the application, investigate current behavior, identify weaknesses, implement appropriate improvements, test the result, and document the changes.

T5 has a **specific failure**.

T8 has a **broader objective**.

---

# 8. T8 Core Learning Objective

T8 develops the ability to operate like a professional practitioner.

The learner must:

* understand an objective
* identify requirements
* identify constraints
* make decisions
* select an approach
* execute
* test
* evaluate
* refine
* document
* deliver

The learner is no longer simply completing an exercise.

They are producing an **outcome**.

---

# 9. T8 Real-World Task Model

```text
                 REAL-WORLD OBJECTIVE
                          │
                          ▼
                 UNDERSTAND CONTEXT
                          │
                          ▼
                 IDENTIFY REQUIREMENTS
                          │
                          ▼
                  IDENTIFY CONSTRAINTS
                          │
                          ▼
                    PLAN SOLUTION
                          │
                          ▼
                   MAKE DECISIONS
                          │
                          ▼
                      EXECUTE
                          │
                          ▼
                  TEST / VALIDATE
                          │
                     ┌────┴────┐
                     ▼         ▼
                   FAIL       PASS
                     │         │
                     ▼         ▼
                  REFINE    DOCUMENT
                               │
                               ▼
                            DELIVER
                               │
                               ▼
                            COMPLETE
```

---

# 10. T8 Real-World Context

The task should feel like something a professional could actually receive.

For example:

> A product team has noticed that users frequently receive authorization errors after role changes. The current authorization system has grown organically and contains several different permission checks.

Then:

> Improve the authorization behavior so role changes are handled consistently, unauthorized access remains blocked, and existing valid access continues to work.

This is much more realistic than:

> Implement `checkPermission()`.

---

# 11. T8 Professional Objective

A good T8 begins with an objective rather than a coding instruction.

### Weak

> Write a TypeScript authorization function.

### Strong

> Improve the application's authorization system so users receive consistent access decisions after role changes while preserving existing security boundaries.

The second gives the learner a professional objective.

---

# 12. T8 Requirements May Need Discovery

Unlike T6, not every requirement needs to be handed to the learner explicitly.

The learner may need to determine requirements from:

```text id="4w0j2z"
Existing code
Existing behavior
Documentation
User expectations
System constraints
Tests
Architecture
Business rules
```

This creates realistic professional reasoning.

---

# 13. T8 Available Resources

A T8 can provide a realistic workspace containing:

```text id="g5tq6k"
Existing repository
Code
Configuration
Database schema
API contracts
Documentation
Tests
Logs
Architecture diagrams
Requirements
Sample data
```

The learner should use these resources to complete the objective.

---

# 14. T8 Deliverable

A major difference from previous TaskBlock versions is the concept of a **deliverable**.

The learner may be required to produce:

```text id="r1s7bz"
Working implementation
Code changes
API
Database migration
Configuration
Architecture diagram
Documentation
Test suite
Technical report
Deployment plan
```

The deliverable depends on the domain.

---

# 15. T8 Example — Python

### Real-world objective

> A data-processing service is receiving inconsistent input from multiple sources. Build a robust data-cleaning component that normalizes supported input formats while safely handling invalid records.

The learner may need to determine:

```text id="4xw2rq"
Input formats
Validation rules
Error handling
Output contract
Logging
Testing
```

Deliverable:

```text id="w7e5gk"
Working data-cleaning component
+
Tests
+
Short technical explanation
```

---

# 16. T8 Example — Exception Handling

### Objective

> A production-style batch-processing system must continue processing valid records when individual records fail, while ensuring unexpected programming failures are not silently ignored.

The learner must determine:

```text id="t0w9zn"
Where exceptions should be handled
Which exceptions are recoverable
What should be logged
What should be returned
When processing should stop
```

This goes beyond simply:

> Catch `ValueError`.

---

# 17. T8 Example — Authentication

### Objective

> Improve the authentication flow of an existing web application so that authenticated sessions are handled securely and consistently across the application while minimizing unnecessary exposure of credentials.

The learner may need to inspect:

```text id="v6h8sk"
Login
Cookies
Session validation
API requests
Logout
Expiration
Unauthorized responses
```

Deliverables could include:

```text id="h6s4py"
Implementation
+
Tests
+
Security rationale
```

---

# 18. T8 Example — Authorization

### Objective

> Review and improve an application's role and permission model so that users receive only the access required for their responsibilities, unauthorized operations remain blocked, and permission decisions remain consistent across the application.

The learner must potentially work with:

```text id="a3i1v4"
Users
Roles
Permissions
Authorization middleware
API endpoints
UI visibility
Database mappings
Tests
```

This is clearly professional-style work.

---

# 19. T8 Example — Database

### Objective

> Improve the user-profile update system so partial updates are safe, data integrity is preserved, and concurrent updates do not accidentally overwrite unrelated changes.

The learner must reason about:

```text id="q2t6sx"
Update semantics
Validation
Transactions
Concurrency
Data integrity
Testing
```

The exact implementation path is not fully prescribed.

---

# 20. T8 Example — Tutorial Engine

For the Tutorial Engine itself, a T8 could be:

> Improve the tutorial publishing workflow so incomplete or invalid tutorial content cannot be published while preserving the ability for authors to save drafts and continue editing later.

The learner may need to inspect:

```text id="v4e6nq"
Content model
Validation
Draft state
Publish state
API
UI
Authorization
Persistence
```

Then produce a working solution.

This is a realistic engineering objective.

---

# 21. T8 Real-World Constraints

Real-world tasks should include realistic constraints.

Examples:

```text id="9b6e5k"
Existing API contracts cannot break.

Existing users must continue working.

Database data must not be lost.

Backward compatibility must be maintained.

Security requirements must remain satisfied.

Performance cannot degrade beyond an accepted threshold.

The solution must be maintainable.
```

These constraints create professional realism.

---

# 22. T8 Ambiguity

T8 should allow some ambiguity.

For example:

> Improve the authorization experience.

The learner may need to determine:

```text id="x9t2dc"
What is wrong?
What does "improve" mean?
Which behaviors matter?
Which constraints exist?
How should success be measured?
```

However, ambiguity must not become unfairness.

The learner must have enough information or resources to make reasonable decisions.

---

# 23. T8 Ambiguity Must Be Bounded

Bad:

> Build something good.

Good:

> Improve the authorization system so access decisions are consistent, unauthorized operations remain blocked, and existing valid access continues to work.

The second still requires professional judgment while providing measurable success criteria.

---

# 24. T8 Requirements Discovery

The learner may begin with:

```text id="5w3j7y"
Objective
+
Existing system
+
Available documentation
```

Then create:

```text id="v9a5ml"
Requirements
Constraints
Acceptance criteria
```

This is a major T8 skill.

---

# 25. T8 Acceptance Criteria

The learner should ideally identify or be given acceptance criteria.

Example:

```text id="brm5gy"
✓ Valid users retain required access
✓ Unauthorized operations remain blocked
✓ Role changes take effect consistently
✓ Existing APIs remain compatible
✓ Tests pass
✓ Documentation updated
```

This gives the learner a professional definition of "done."

---

# 26. T8 Deliverable Definition

The task can specify:

```text id="p0m3qm"
Deliverable:
• Working implementation
• Automated tests
• Technical explanation
• Architecture diagram
```

or:

```text id="m2x5yw"
Deliverable:
• SQL migration
• Updated schema
• Validation tests
• Rollback strategy
```

The deliverable should reflect the actual professional objective.

---

# 27. T8 Workspace

A T8 workspace can be much broader than earlier versions.

```text id="h7r9cp"
┌─────────────────────────────────────────────────┐
│ PROJECT                                         │
├───────────────┬─────────────────────────────────┤
│ Files         │ Code / Editor                   │
│ Tests         │                                 │
│ Documentation │                                 │
│ Database      │                                 │
│ Logs          │                                 │
│ API           │                                 │
├───────────────┴─────────────────────────────────┤
│ Validation / Test Results                       │
└─────────────────────────────────────────────────┘
```

This gives the learner a realistic environment.

---

# 28. T8 Project-Level Work

Unlike T6, T8 can involve multiple artifacts.

For example:

```text id="5dj7d2"
auth/
 ├── middleware.ts
 ├── permissions.ts
 ├── roles.ts
 └── tests/
      ├── auth.test.ts
      └── permissions.test.ts
```

The learner is not merely implementing one function.

They are completing an objective.

---

# 29. T8 Decision-Making

The learner may need to make decisions such as:

```text id="n8w1tg"
Should this be a role or permission?

Should this validation happen at the API or database layer?

Should this exception be recovered or propagated?

Should this data be copied or referenced?

Should this operation be transactional?
```

The task evaluates the **quality of the resulting solution**, not whether the learner followed a predetermined recipe.

---

# 30. T8 Trade-Offs

Real-world work contains trade-offs.

Examples:

```text id="8g5qg1"
Performance ↔ Memory

Security ↔ Convenience

Flexibility ↔ Simplicity

Backward compatibility ↔ Redesign

Development speed ↔ Long-term maintainability
```

T8 can require the learner to explain important decisions.

---

# 31. T8 Technical Rationale

A professional deliverable should sometimes include:

> Why did you choose this approach?

Example:

```text id="2y7c9h"
Decision:
Use permission-based authorization.

Reason:
The existing role structure cannot represent
the required least-privilege combinations.
```

This makes T8 evaluate professional judgment.

---

# 32. T8 Validation

Validation should operate at multiple levels.

```text id="2s0e4m"
Functional
   ↓
Integration
   ↓
Security
   ↓
Performance
   ↓
Regression
   ↓
Acceptance
```

Not every task requires every layer.

The validation strategy should match the objective.

---

# 33. T8 Example Validation

For authorization:

```text id="7uw6k2"
Functional
✓ Required permission works

Security
✓ Unauthorized action blocked

Regression
✓ Existing authorized actions still work

Integration
✓ API and UI agree on authorization

Acceptance
✓ Role changes take effect correctly
```

---

# 34. T8 Professional Quality

T8 can evaluate:

```text id="f3c7rp"
Correctness
Security
Performance
Maintainability
Reliability
Compatibility
Testing
Documentation
Architecture
```

The evaluation dimensions depend on the task.

---

# 35. T8 Deliverable Review

The final submission can be presented as:

```text id="a8v7e1"
┌──────────────────────────────────────────────┐
│ DELIVERY REVIEW                              │
├──────────────────────────────────────────────┤
│                                              │
│ Objective                                    │
│ ✓ Satisfied                                  │
│                                              │
│ Functional Requirements                      │
│ ✓ 8 / 8                                     │
│                                              │
│ Tests                                        │
│ ✓ 42 / 42                                   │
│                                              │
│ Security                                     │
│ ✓ Passed                                     │
│                                              │
│ Documentation                                │
│ ✓ Complete                                   │
│                                              │
│ [ Submit Final Deliverable ]                 │
└──────────────────────────────────────────────┘
```

---

# 36. T8 Iteration

Real-world work rarely succeeds perfectly on the first attempt.

Therefore:

```text id="6d3y2p"
Build
 ↓
Review
 ↓
Test
 ↓
Feedback
 ↓
Refine
 ↓
Re-test
 ↓
Deliver
```

This should be a normal T8 workflow.

---

# 37. T8 Feedback

Feedback can simulate professional review.

Example:

> The implementation satisfies the functional requirements, but the current authorization logic duplicates permission checks across three API handlers. Refactor the shared behavior before final submission.

The learner then improves the solution.

This creates a realistic engineering workflow.

---

# 38. T8 Review Cycles

A T8 can support:

```text id="6z2k8f"
Draft
 ↓
Review
 ↓
Revision
 ↓
Final Review
 ↓
Delivery
```

This is a major difference from simpler TaskBlock versions.

---

# 39. T8 Review Types

Possible review sources:

```text id="g5t9p3"
Automated tests
Instructor feedback
Code review
Architecture review
Security review
Performance review
Acceptance review
```

Not all need to be used simultaneously.

---

# 40. T8 Professional Deliverable

A final submission might contain:

```text id="5z5h42"
Implementation
+
Tests
+
Documentation
+
Design rationale
+
Known limitations
```

For an architecture task:

```text id="c7m1v6"
Architecture diagram
+
Design explanation
+
Trade-offs
+
Security considerations
+
Migration plan
```

---

# 41. T8 Known Limitations

This is an especially useful professional concept.

The learner may be required to identify:

```text id="7j8f2k"
Known limitation:
Current implementation supports role-based
permissions but does not yet support
resource-level permissions.
```

This teaches professional honesty and scope awareness.

---

# 42. T8 Scope Management

A real-world task should not encourage unlimited expansion.

The learner should distinguish:

```text id="1u9x4r"
Required
vs
Optional improvement
vs
Out of scope
```

For example:

```text id="2k6r9e"
Required:
Fix authorization inconsistency.

Optional:
Improve authorization logging.

Out of scope:
Redesign entire identity architecture.
```

This is a professional skill.

---

# 43. T8 Time Constraints

A realistic task can optionally include a target duration.

Example:

```text id="j0v7pp"
Estimated effort:
60 minutes
```

But time should normally be used as a contextual constraint, not as an arbitrary race.

---

# 44. T8 Resource Constraints

Advanced tasks can limit:

```text id="t3g6vn"
Available libraries
Memory
Database access
API calls
Infrastructure
Dependencies
```

For example:

> You may not introduce a new external authorization library.

This forces realistic engineering decisions.

---

# 45. T8 Existing System Constraints

A particularly valuable T8 pattern is:

> **You must improve an existing system rather than starting from scratch.**

This introduces:

```text id="q2j6vf"
Legacy behavior
Backward compatibility
Existing interfaces
Existing data
Existing tests
```

This is much closer to actual professional development.

---

# 46. T8 Example — Existing Authentication System

```text id="7f3n8s"
Existing:
Login works.

Problem:
Session expiration behavior is inconsistent.

Requirement:
Improve expiration handling.

Constraints:
• Existing login API cannot change.
• Existing users must remain compatible.
• Sensitive credentials must remain protected.

Deliverables:
• Implementation
• Tests
• Technical explanation
```

This is an excellent T8.

---

# 47. T8 Example — Existing Tutorial System

```text id="g4v8j2"
Existing:
Tutorial content editor.

Objective:
Improve publishing reliability.

Constraints:
• Draft saving must continue working.
• Invalid content must not publish.
• Existing published tutorials must remain accessible.
• Existing API contracts should remain stable.

Deliverables:
• Validation changes
• Publishing logic
• Tests
• Documentation
```

Again, the learner owns the outcome.

---

# 48. T8 JSON Structure

```json id="1q0m4e"
{
  "type": "task",
  "version": "T8",
  "presentation": "Real-World Task",

  "content": {
    "title": "",
    "objective": "",
    "context": "",
    "requirements": [],
    "constraints": [],
    "resources": [],
    "acceptanceCriteria": []
  },

  "discovery": {
    "enabled": true
  },

  "planning": {
    "enabled": true
  },

  "workspace": {
    "type": "",
    "resources": []
  },

  "deliverables": [],

  "validation": {
    "criteria": [],
    "tests": []
  },

  "review": {
    "enabled": true
  },

  "evaluation": {
    "dimensions": []
  },

  "metadata": {
    "difficulty": "advanced",
    "estimatedMinutes": 0
  }
}
```

---

# 49. Complete T8 JSON Example

```json id="ezm1j8"
{
  "type": "task",
  "version": "T8",
  "presentation": "Real-World Task",

  "content": {
    "title": "Improve Authorization Consistency",

    "objective": "Improve the authorization behavior of an existing application so permission decisions remain consistent across protected operations while preserving existing security boundaries.",

    "context": "The application has grown over time and currently contains authorization checks implemented in several different locations. Users have reported inconsistent access behavior after role changes.",

    "requirements": [
      "Authorized users must retain access to operations they are permitted to perform.",
      "Unauthorized operations must remain blocked.",
      "Role changes must take effect consistently.",
      "Authorization decisions must use the application's trusted identity context.",
      "Existing protected APIs must remain compatible."
    ],

    "constraints": [
      "Do not weaken existing security boundaries.",
      "Do not expose authentication credentials.",
      "Avoid unnecessary duplication of authorization logic.",
      "Existing API contracts should remain stable."
    ],

    "resources": [
      "Existing authorization code",
      "Role and permission definitions",
      "Protected API routes",
      "Existing tests",
      "Application documentation"
    ],

    "acceptanceCriteria": [
      "Existing authorization tests continue to pass.",
      "Role changes produce consistent authorization decisions.",
      "Unauthorized requests remain blocked.",
      "Required authorized operations continue to work.",
      "The final implementation is documented."
    ]
  },

  "discovery": {
    "enabled": true
  },

  "planning": {
    "enabled": true,

    "artifacts": [
      "requirements",
      "approach",
      "architecture"
    ]
  },

  "workspace": {
    "type": "project",

    "resources": [
      "repository",
      "tests",
      "configuration",
      "documentation"
    ]
  },

  "deliverables": [
    {
      "type": "implementation",
      "required": true
    },
    {
      "type": "tests",
      "required": true
    },
    {
      "type": "technicalExplanation",
      "required": true
    },
    {
      "type": "documentation",
      "required": true
    }
  ],

  "validation": {
    "criteria": [
      "Functional behavior",
      "Authorization security",
      "Regression behavior",
      "API compatibility"
    ],

    "tests": {
      "visible": true,
      "hidden": true
    }
  },

  "review": {
    "enabled": true,

    "reviewAreas": [
      "correctness",
      "security",
      "maintainability",
      "testing",
      "documentation"
    ]
  },

  "evaluation": {
    "dimensions": [
      {
        "name": "correctness",
        "weight": 30
      },
      {
        "name": "security",
        "weight": 25
      },
      {
        "name": "maintainability",
        "weight": 15
      },
      {
        "name": "testing",
        "weight": 15
      },
      {
        "name": "technicalReasoning",
        "weight": 10
      },
      {
        "name": "documentation",
        "weight": 5
      }
    ]
  },

  "metadata": {
    "difficulty": "advanced",
    "estimatedMinutes": 90
  }
}
```

---

# 50. T8 UI — Final Concept

```text id="u6i4wm"
┌────────────────────────────────────────────────────┐
│ REAL-WORLD TASK                                    │
│ Improve Authorization Consistency                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ OBJECTIVE                                          │
│ Improve authorization behavior across the         │
│ existing application.                              │
│                                                    │
│ CONTEXT                                            │
│ Existing authorization logic is distributed       │
│ across several protected operations.               │
│                                                    │
│ REQUIREMENTS                                       │
│ ✓ Preserve valid access                            │
│ ✓ Block unauthorized operations                    │
│ ✓ Handle role changes consistently                 │
│ ✓ Preserve API compatibility                       │
│                                                    │
│ CONSTRAINTS                                        │
│ • Do not weaken security                           │
│ • Do not expose credentials                        │
│ • Avoid unnecessary duplication                    │
│                                                    │
│ ────────────────────────────────────────────────── │
│                                                    │
│ PLANNING                                           │
│ [ Requirements ] [ Architecture ] [ Approach ]    │
│                                                    │
│ WORKSPACE                                          │
│ ┌───────────────────────────────────────────────┐ │
│ │                                               │ │
│ │              Project Workspace               │ │
│ │                                               │ │
│ └───────────────────────────────────────────────┘ │
│                                                    │
│ DELIVERABLES                                      │
│ ✓ Implementation                                  │
│ ✓ Tests                                           │
│ ○ Documentation                                   │
│                                                    │
│ [ Run Validation ]                                │
│ [ Submit for Review ]                             │
└────────────────────────────────────────────────────┘
```

---

# 51. T8 Professional Workflow

The learner experience can follow:

```text id="1nh8vv"
UNDERSTAND
     ↓
EXPLORE
     ↓
PLAN
     ↓
IMPLEMENT
     ↓
TEST
     ↓
REVIEW
     ↓
REFINE
     ↓
DOCUMENT
     ↓
DELIVER
```

This is the strongest TaskBlock workflow.

---

# 52. T8 Completion Model

T8 should not be complete merely because the code runs.

A strong completion model is:

```text id="q7qk3f"
Objective satisfied
        +
Requirements satisfied
        +
Constraints respected
        +
Tests passed
        +
Deliverables complete
        +
Review complete
        ↓
     COMPLETE
```

---

# 53. T8 Professional Review

The final review can look like:

```text id="7q4t1s"
┌──────────────────────────────────────────────┐
│ FINAL REVIEW                                 │
├──────────────────────────────────────────────┤
│ Functional Requirements        8 / 8   ✓     │
│ Security Requirements          5 / 5   ✓     │
│ Regression Tests              42 / 42  ✓     │
│ Documentation                  Complete ✓     │
│ Architecture                  Approved ✓     │
│                                              │
│ FINAL STATUS                                 │
│                                              │
│              READY FOR DELIVERY              │
└──────────────────────────────────────────────┘
```

---

# 54. T8 Iteration With Review

```text id="3a5o5p"
Initial Solution
      ↓
Automated Tests
      ↓
Review
      ↓
Feedback
      ↓
Revision
      ↓
Re-test
      ↓
Final Review
      ↓
DELIVERY
```

This is intentionally closer to professional work than an ordinary educational exercise.

---

# 55. T8 Analytics

Useful analytics include:

```text id="qv3d9x"
taskStarted
resourcesInspected
requirementsIdentified
planningStarted
implementationStarted
iterations
testRuns
reviewCycles
feedbackReceived
requirementsSatisfied
constraintsSatisfied
deliverablesCompleted
timeToDelivery
finalQuality
completed
```

Additional professional metrics:

```text id="x8g2p1"
Scope changes
Rework
Regression failures
Review comments
Documentation completeness
```

---

# 56. T8 Mastery Signal

T8 answers:

> **Can the learner take a realistic professional objective and independently turn it into a verified, usable deliverable?**

The mastery model is:

```text id="f0g4zr"
Understand
   ↓
Analyze
   ↓
Discover
   ↓
Plan
   ↓
Decide
   ↓
Execute
   ↓
Validate
   ↓
Review
   ↓
Refine
   ↓
Deliver
```

This is the highest TaskBlock learning level.

---

# 57. T8 Authoring Rules

A strong T8 should:

```text id="h7e8r2"
✓ Have a realistic professional objective
✓ Provide meaningful context
✓ Include realistic constraints
✓ Permit reasonable ambiguity
✓ Require independent decisions
✓ Require a meaningful deliverable
✓ Include acceptance criteria
✓ Support iterative work
✓ Include validation
✓ Encourage professional-quality output
```

Avoid:

```text id="m0r3z6"
❌ Artificially large tasks
❌ Ambiguity without sufficient information
❌ "Build anything you want"
❌ No measurable acceptance criteria
❌ No meaningful deliverable
❌ Hidden requirements that make success impossible
❌ Turning T8 into an unrestricted project
```

---

# 58. T8 Scope Must Still Be Educationally Bounded

Even though T8 simulates professional work, it should remain a **TaskBlock**.

Therefore:

```text id="q0g3y4"
T8
Realistic
+
Bounded
+
Assessable
```

It should not become:

> "Spend three months building a production platform."

Instead:

> "Improve this specific part of the system and deliver the defined artifacts."

---

# 59. T8 Realism Dimensions

A T8 can increase realism through:

```text id="n3m5yt"
Existing code
Existing users
Existing data
Existing constraints
Existing APIs
Legacy behavior
Security requirements
Performance requirements
Review feedback
Documentation requirements
```

This produces realism without requiring an enormous task.

---

# 60. T8 Example — Complete Engineering Assignment

### Objective

> Improve the authentication/session handling of an existing application.

### Context

The application currently authenticates users successfully, but session expiration and unauthorized responses behave inconsistently across protected APIs.

### Requirements

```text id="0w7y5m"
✓ Valid sessions work.
✓ Expired sessions are rejected.
✓ Invalid sessions are rejected.
✓ Protected APIs remain protected.
✓ Existing login behavior remains compatible.
```

### Constraints

```text id="3n6c4p"
• Do not expose credentials.
• Do not weaken authorization.
• Preserve existing API contracts.
```

### Deliverables

```text id="o8v2p1"
Implementation
Tests
Technical explanation
Documentation
```

### Acceptance

```text id="w4h7q9"
All authentication tests pass.
All protected endpoints behave consistently.
Security boundaries remain intact.
```

That is a complete T8.

---

# 61. T8 Final Mental Model

```text
                         T8
                 REAL-WORLD TASK
                         │
                         ▼
              PROFESSIONAL OBJECTIVE
                         │
                         ▼
                  UNDERSTAND CONTEXT
                         │
                         ▼
                DISCOVER REQUIREMENTS
                         │
                         ▼
                   IDENTIFY CONSTRAINTS
                         │
                         ▼
                       PLAN
                         │
                         ▼
                     EXECUTE
                         │
                         ▼
                  TEST / VALIDATE
                         │
                         ▼
                      REVIEW
                         │
                         ▼
                      REFINE
                         │
                         ▼
                    DOCUMENT
                         │
                         ▼
                     DELIVER
                         │
                         ▼
                    COMPLETE
```

The defining principle is:

> **The learner takes ownership of a realistic, bounded professional objective and delivers a verified outcome rather than simply completing a predefined exercise.**

---

# 62. T8 Final Technical Specification

| Area                              | T8 Decision                            |
| --------------------------------- | -------------------------------------- |
| **Block**                         | **TaskBlock**                          |
| **Version**                       | **T8**                                 |
| **Presentation**                  | **Real-World Task**                    |
| **Primary purpose**               | Professional-style objective ownership |
| **Realistic context**             | Core                                   |
| **Objective**                     | Required                               |
| **Requirements**                  | Required                               |
| **Requirement discovery**         | Supported                              |
| **Constraints**                   | Core                                   |
| **Ambiguity**                     | Controlled                             |
| **Planning**                      | Recommended                            |
| **Decision-making**               | Core                                   |
| **Implementation**                | Often required                         |
| **Deliverable**                   | Required                               |
| **Acceptance criteria**           | Required                               |
| **Testing**                       | Required                               |
| **Review**                        | Recommended                            |
| **Iteration**                     | Core                                   |
| **Documentation**                 | Often required                         |
| **Trade-offs**                    | Supported                              |
| **Professional ownership**        | Core                                   |
| **Multiple valid approaches**     | Supported                              |
| **Hidden tests**                  | Supported                              |
| **Real-world resources**          | Supported                              |
| **Debugging**                     | May be included                        |
| **Scenario reasoning**            | May be included                        |
| **Challenge complexity**          | May be included                        |
| **Open-ended professional scope** | Bounded                                |
| **Progress persistence**          | ✅                                      |
| **Retry**                         | ✅                                      |
| **Review analytics**              | ✅                                      |
| **Deliverable analytics**         | ✅                                      |
| **Quiz score**                    | ❌                                      |
| **Theme**                         | Light                                  |
| **Primary**                       | **#F54A8D**                            |
| **Secondary**                     | **#0B1B3D**                            |
| **Gradient**                      | ❌                                      |
| **Dark theme**                    | ❌                                      |
| **Responsive**                    | ✅                                      |
| **Accessible**                    | ✅                                      |
| **JSON-driven**                   | ✅                                      |

---

# 63. Complete TaskBlock Architecture

We have now completed the entire **TaskBlock — 8 Version Presentation Model**:

```text
                    TASKBLOCK
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
   BASIC ACTION                    ADVANCED OWNERSHIP
        │                                │
        ▼                                ▼
T1 — Simple Task                 T5 — Debugging Task
        │                                │
        ▼                                ▼
T2 — Guided Task                 T6 — Implementation Task
        │                                │
        ▼                                ▼
T3 — Multi-Step Task             T7 — Challenge Task
        │                                │
        ▼                                ▼
T4 — Scenario Task               T8 — Real-World Task
```

---

# 64. TaskBlock Learning Progression

The eight versions now form a deliberate educational progression:

```text
T1
Simple Task
│
│  "Do this."
▼
T2
Guided Task
│
│  "Do this with support."
▼
T3
Multi-Step Task
│
│  "Complete this workflow."
▼
T4
Scenario Task
│
│  "Understand this situation and act."
▼
T5
Debugging Task
│
│  "Find why it is broken and fix it."
▼
T6
Implementation Task
│
│  "Build the required solution."
▼
T7
Challenge Task
│
│  "Solve this difficult problem independently."
▼
T8
Real-World Task
│
│  "Own this realistic professional objective."
▼
TASK MASTERY
```

---

# 65. Final TaskBlock Version Table

| Version | Presentation        | Core Learner Action      |
| ------- | ------------------- | ------------------------ |
| **T1**  | Simple Task         | Accomplish               |
| **T2**  | Guided Task         | Accomplish with guidance |
| **T3**  | Multi-Step Task     | Execute a workflow       |
| **T4**  | Scenario Task       | Interpret + decide + act |
| **T5**  | Debugging Task      | Diagnose + correct       |
| **T6**  | Implementation Task | Build + implement        |
| **T7**  | Challenge Task      | Independently solve      |
| **T8**  | Real-World Task     | Own + deliver            |

This completes the committed **TaskBlock presentation hierarchy**.

## **T8 — Real-World Task: COMPLETE** ✅

### **TASKBLOCK — ALL 8 VERSIONS COMPLETE** ✅



```python

```


```python

```
