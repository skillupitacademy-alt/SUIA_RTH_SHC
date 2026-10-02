# BLOCK 15 — InteractiveBlock

## INT1 — Code → Run → Output

Yes. We start the **InteractiveBlock** with **only INT1**, one version at a time, exactly as we did for TaskBlock.

The committed sequence is:

| Version  | Presentation             | Status         |
| -------- | ------------------------ | -------------- |
| **INT1** | **Code → Run → Output**  | 🔵 **CURRENT** |
| INT2     | Edit → Run → Observe     | ⏳              |
| INT3     | Guided Interactive Steps | ⏳              |
| INT4     | Predict → Run → Compare  | ⏳              |
| INT5     | Debug Interactive        | ⏳              |
| INT6     | Full Playground          | ⏳              |

---

# 1. What Is INT1 — Code → Run → Output?

**INT1 — Code → Run → Output** is the foundational InteractiveBlock version.

The learner is given executable code, runs it, and observes the resulting output.

The core model is deliberately simple:

```text
CODE
  ↓
RUN
  ↓
OUTPUT
```

The defining principle is:

> **The learner directly executes a provided piece of code and observes what the computer produces.**

At INT1, the primary purpose is **observation**, not editing, debugging, prediction, or open-ended experimentation.

---

# 2. Position of INT1 in InteractiveBlock

```text
INT1
Code → Run → Output
        ↓
INT2
Edit → Run → Observe
        ↓
INT3
Guided Interactive Steps
        ↓
INT4
Predict → Run → Compare
        ↓
INT5
Debug Interactive
        ↓
INT6
Full Playground
```

The progression is:

```text
OBSERVE
   ↓
EXPERIMENT
   ↓
FOLLOW INTERACTIVE GUIDANCE
   ↓
PREDICT + VERIFY
   ↓
DEBUG
   ↓
EXPLORE FREELY
```

---

# 3. What Is the Purpose of INT1?

INT1 provides the learner with a **live execution experience**.

Instead of only reading:

```python
numbers = [1, 2, 3]
print(numbers)
```

the learner sees:

```text
Run
 ↓
[1, 2, 3]
```

This creates the connection:

```text
SOURCE CODE
     ↓
EXECUTION
     ↓
RUNTIME BEHAVIOR
     ↓
OUTPUT
```

---

# 4. INT1 vs CodeBlock

This distinction is important.

### CodeBlock

Primarily presents code for:

* reading
* explanation
* syntax
* concepts
* static examples

```text
CODE
 ↓
READ
 ↓
UNDERSTAND
```

### InteractiveBlock INT1

Provides executable code:

```text
CODE
 ↓
RUN
 ↓
OBSERVE
```

Therefore:

> **CodeBlock teaches through code presentation. InteractiveBlock teaches through code execution.**

---

# 5. INT1 vs QuestionBlock

A QuestionBlock may ask:

> What will this code print?

The learner answers.

INT1 instead provides:

> Run this code and observe the output.

So:

```text
QuestionBlock
→ Predict / answer

InteractiveBlock
→ Execute / observe
```

---

# 6. INT1 vs ExerciseBlock

### ExerciseBlock

The learner must produce or modify something.

```text
TASK
 ↓
LEARNER WORK
 ↓
RESULT
```

### INT1

The learner primarily executes supplied code.

```text
CODE
 ↓
RUN
 ↓
OBSERVE
```

At INT1, the code is normally **author-provided and fixed**.

---

# 7. INT1 vs INT2

This distinction must remain locked.

### INT1

```text
Code
 ↓
Run
 ↓
Output
```

The learner observes execution.

### INT2

```text
Edit
 ↓
Run
 ↓
Observe
```

The learner changes the code and investigates the resulting behavior.

Therefore:

> **INT1 = execution. INT2 = experimentation.**

---

# 8. INT1 vs INT4

INT4 introduces prediction.

```text
Predict
 ↓
Run
 ↓
Compare
```

INT1 does not require prediction.

```text
Run
 ↓
Observe
```

The learner is allowed to discover the result directly.

---

# 9. INT1 vs INT5

INT5 is explicitly about debugging.

```text
Problem
 ↓
Investigate
 ↓
Fix
 ↓
Run
```

INT1 has no requirement that something be broken.

The code can simply demonstrate a concept.

---

# 10. INT1 vs INT6

INT6 is a complete programming playground.

It can support:

```text
Create
Edit
Run
Experiment
Debug
Save
Explore
```

INT1 is intentionally much smaller:

```text
Execute
Observe
```

This minimalism is important.

---

# 11. INT1 Basic UI

The foundational UI should be extremely simple.

```text
┌───────────────────────────────┐
│ Code                          │
│                               │
│ numbers = [1, 2, 3]           │
│ print(numbers)                │
│                               │
│              [ Run ]          │
└───────────────────────────────┘

Output
────────────────────────────────
[1, 2, 3]
```

The learner should immediately understand:

> **This code can be run.**

---

# 12. INT1 Complete Flow

```text
┌───────────────┐
│ CODE          │
│               │
│ print("Hello")│
└───────┬───────┘
        │
        ▼
   ┌─────────┐
   │   RUN   │
   └────┬────┘
        │
        ▼
┌───────────────┐
│ OUTPUT        │
│               │
│ Hello         │
└───────────────┘
```

This is the complete INT1 interaction.

---

# 13. INT1 Code Should Normally Be Read-Only

Because INT2 owns the **Edit → Run → Observe** model, INT1 should normally keep the learner from modifying the source code.

Recommended:

```text
Code Editor
────────────
READ-ONLY
```

with:

```text
[ Run ]
```

This preserves the distinction between INT1 and INT2.

---

# 14. Why Read-Only?

Suppose INT1 allows editing.

Then the learner could:

```text
Edit
 ↓
Run
 ↓
Observe
```

That is already INT2.

Therefore:

```text
INT1
→ fixed executable example

INT2
→ editable executable example
```

This boundary should remain clear.

---

# 15. INT1 Code Example — Python

```python
numbers = [1, 2, 3]

print(numbers)
```

The learner clicks:

```text
[ Run ]
```

Output:

```text
[1, 2, 3]
```

The interaction is complete.

---

# 16. INT1 Example — Variable Assignment

```python
name = "Alice"

print(name)
```

Output:

```text
Alice
```

The learner directly observes the relationship:

```text
Assignment
 ↓
Execution
 ↓
Output
```

---

# 17. INT1 Example — Arithmetic

```python
x = 10
y = 20

print(x + y)
```

Output:

```text
30
```

This can reinforce a concept immediately after the explanation.

---

# 18. INT1 Example — List Mutation

```python
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

Output:

```text
[1, 2, 3, 4]
```

The learner sees the runtime effect of the operation.

---

# 19. INT1 Example — Object Reference

```python
numbers = [1, 2, 3]
backup = numbers

numbers.append(4)

print(backup)
```

Output:

```text
[1, 2, 3, 4]
```

This is especially useful for teaching concepts that are difficult to understand through static text alone.

---

# 20. INT1 Example — Exception

```python
numbers = [1, 2, 3]

print(numbers[5])
```

Output area:

```text
IndexError:
list index out of range
```

The learner observes actual runtime behavior.

This can be particularly valuable immediately before teaching exception handling.

---

# 21. INT1 Runtime Output

The output panel should support at least:

```text
Standard output
Errors
Execution status
```

Example:

```text
Output
────────────────────────

[1, 2, 3]

Status: Completed
```

Or:

```text
Output
────────────────────────

IndexError: list index out of range

Status: Error
```

---

# 22. INT1 Execution States

The UI should have clear execution states.

```text
IDLE
 ↓
RUNNING
 ↓
COMPLETED
```

or:

```text
IDLE
 ↓
RUNNING
 ↓
ERROR
```

Recommended model:

```text
idle
running
success
error
timeout
```

---

# 23. INT1 Run Button

The primary interaction is:

```text
[ ▶ Run ]
```

While executing:

```text
[ ⏳ Running... ]
```

After completion:

```text
[ ▶ Run Again ]
```

The same control can be reused.

---

# 24. INT1 Output Panel

The output should be visually separated from the code.

```text
┌─────────────────────────────────┐
│ Code                            │
│                                 │
│ numbers = [1, 2, 3]             │
│ print(numbers)                  │
│                                 │
│              [ ▶ Run ]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Output                          │
├─────────────────────────────────┤
│                                 │
│ [1, 2, 3]                       │
│                                 │
└─────────────────────────────────┘
```

This establishes a clear:

```text
INPUT
 ↓
EXECUTION
 ↓
OUTPUT
```

relationship.

---

# 25. INT1 Execution Feedback

After execution, a small status indicator can show:

```text
✓ Execution completed
```

or:

```text
✕ Execution failed
```

The status should not dominate the output.

The output itself remains the primary learning artifact.

---

# 26. INT1 Error Presentation

If execution fails:

```text
┌─────────────────────────────────┐
│ Output                          │
├─────────────────────────────────┤
│ Traceback                       │
│                                 │
│ IndexError: list index out      │
│ of range                       │
│                                 │
│ Status: Execution failed        │
└─────────────────────────────────┘
```

At INT1, we should **show the runtime error**, but not turn it into a debugging workflow.

That belongs to INT5.

---

# 27. INT1 Error Boundary

This distinction matters:

### INT1

> Observe the runtime error.

### INT5

> Investigate and fix the runtime error.

Therefore:

```text
INT1
Error = Output

INT5
Error = Problem to solve
```

---

# 28. INT1 Code Metadata

An interactive code example may need:

```json
{
  "language": "python",
  "runtime": "python3",
  "timeoutMs": 5000
}
```

The learner does not need to see these implementation details.

They belong to the execution configuration.

---

# 29. INT1 JSON Structure

```json
{
  "type": "interactive",
  "version": "INT1",
  "presentation": "Code → Run → Output",

  "content": {
    "title": "",
    "instructions": "",
    "code": ""
  },

  "execution": {
    "language": "",
    "runtime": "",
    "timeoutMs": 5000
  },

  "output": {
    "visible": true
  },

  "metadata": {
    "estimatedSeconds": 0
  }
}
```

---

# 30. Complete INT1 JSON Example

```json
{
  "type": "interactive",
  "version": "INT1",
  "presentation": "Code → Run → Output",

  "content": {
    "title": "Observe List Mutation",

    "instructions": "Run the code and observe what is printed.",

    "code": "numbers = [1, 2, 3]\n\nnumbers.append(4)\n\nprint(numbers)"
  },

  "execution": {
    "language": "python",
    "runtime": "python3",
    "timeoutMs": 5000
  },

  "output": {
    "visible": true
  },

  "metadata": {
    "estimatedSeconds": 5
  }
}
```

---

# 31. INT1 Authoring Model

The author defines:

```text
Code
+
Execution environment
+
Instruction
```

The learner performs:

```text
Run
```

The system produces:

```text
Output
```

Therefore:

```text
AUTHOR
  ↓
Executable Example
  ↓
LEARNER
  ↓
Run
  ↓
ENGINE
  ↓
Output
```

---

# 32. INT1 Instruction Design

Instructions should be short.

Good:

> Run the code and observe the output.

Good:

> Execute the example to see what happens when the list is modified.

Avoid:

> Predict what will happen, modify the code, debug it, and explain why.

That would combine multiple InteractiveBlock versions.

---

# 33. INT1 Should Focus on One Observation

A strong INT1 typically demonstrates one primary runtime behavior.

For example:

```text
Concept:
List mutation

Code:
numbers.append(4)

Output:
[1, 2, 3, 4]
```

Do not overload one INT1 with ten different concepts.

---

# 34. INT1 Teaching Pattern

A useful Tutorial Engine pattern is:

```text
Concept Explanation
        ↓
INT1
        ↓
Run Example
        ↓
Observe Behavior
        ↓
Explanation
```

For example:

```text
DefinitionBlock
"What is list mutation?"
        ↓
CodeBlock
"Here is an example."
        ↓
InteractiveBlock INT1
"Run it."
        ↓
Output
"[1, 2, 3, 4]"
```

This creates a strong transition from theory to runtime behavior.

---

# 35. INT1 and Memory Concepts

For difficult internal concepts, INT1 can provide runtime evidence.

Example:

```python
numbers = [1, 2, 3]
backup = numbers

print(id(numbers))
print(id(backup))
```

Output:

```text
140...
140...
```

The learner can observe:

```text
same identity
```

This can support a later explanation of references.

---

# 36. INT1 and Exception Handling

Example:

```python
try:
    value = int("hello")
except ValueError:
    print("Invalid value")
```

Output:

```text
Invalid value
```

The learner sees the runtime consequence.

INT1 therefore becomes a bridge between:

```text
Concept
 ↓
Code
 ↓
Runtime
```

---

# 37. INT1 and Output Types

Output can be:

```text
Text
Number
Boolean
List
Dictionary
Object representation
Error
Stack trace
```

The output panel should preserve formatting.

For example:

```text
{
    "name": "Alice",
    "active": true
}
```

should not be flattened unnecessarily.

---

# 38. INT1 Execution Isolation

For code execution, the conceptual architecture should be:

```text
Tutorial Page
     │
     ▼
InteractiveBlock
     │
     ▼
Execution Request
     │
     ▼
Sandbox / Runtime
     │
     ▼
Execution Result
     │
     ▼
Output Panel
```

The tutorial page should not directly execute arbitrary code in the browser when a server-side runtime is required.

---

# 39. INT1 Security Boundary

Because executable code can be dangerous, the execution environment should be isolated.

Conceptually:

```text
User Browser
     │
     │ code
     ▼
Execution Service
     │
     ▼
Sandbox
     │
     ├── CPU limit
     ├── Memory limit
     ├── Time limit
     ├── Network restrictions
     └── Filesystem restrictions
```

The learner only receives:

```text
stdout
stderr
status
```

This is an implementation concern, not something the learner needs to manage.

---

# 40. INT1 Execution Result

A normalized result could look like:

```json
{
  "status": "success",
  "stdout": "[1, 2, 3, 4]\n",
  "stderr": "",
  "executionTimeMs": 18
}
```

For an error:

```json
{
  "status": "error",
  "stdout": "",
  "stderr": "IndexError: list index out of range",
  "executionTimeMs": 14
}
```

---

# 41. INT1 Timeout

If execution exceeds the allowed time:

```text
Output
────────────────────

Execution timed out.

Status: Timeout
```

The learner does not need to debug this at INT1 unless the content specifically intends to demonstrate infinite execution.

---

# 42. INT1 Resource Limits

The runtime should conceptually support:

```text
CPU limit
Memory limit
Execution timeout
Output size limit
Process limit
Network policy
Filesystem policy
```

This is especially important for a general-purpose InteractiveBlock.

---

# 43. INT1 Accessibility

The interaction should be keyboard accessible.

Recommended:

```text
Tab
 ↓
Run button
 ↓
Output
```

The output should be announced appropriately when execution completes.

For example:

```text
aria-live="polite"
```

for successful output updates.

Errors should be announced clearly.

---

# 44. INT1 Responsive UI

### Desktop

```text
┌──────────────────────────┬──────────────────────┐
│ Code                     │ Output               │
│                          │                      │
│ numbers = [1,2,3]        │ [1,2,3,4]            │
│                          │                      │
│              [ Run ]     │                      │
└──────────────────────────┴──────────────────────┘
```

### Mobile

```text
Code
──────────────
numbers = [...]

[ ▶ Run ]

Output
──────────────
[1, 2, 3, 4]
```

The output should naturally move below the code.

---

# 45. INT1 Visual Design

For the established Tutorial Engine visual system:

```text
Primary:   #F54A8D
Secondary: #0B1B3D
```

Use:

* light background
* clean code editor
* clear Run button
* distinct output panel
* soft card/shadow treatment
* no dark theme
* no gradient dependency

The interaction should feel like a **learning component**, not a full IDE.

---

# 46. INT1 Component Anatomy

```text
┌───────────────────────────────────────────────┐
│ Interactive Example                           │
│                                               │
│ Instruction                                   │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ Code                                      │ │
│ │                                           │ │
│ │ numbers = [1, 2, 3]                      │ │
│ │ print(numbers)                            │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│                         [ ▶ Run ]             │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ Output                                    │ │
│ │                                           │ │
│ │ [1, 2, 3]                                 │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

# 47. INT1 Learner State

The block can maintain:

```json
{
  "status": "completed",
  "runCount": 1,
  "lastOutput": "[1, 2, 3]"
}
```

Possible states:

```text
not_started
running
completed
error
timeout
```

---

# 48. INT1 Progress Tracking

Because INT1 is interactive, the system can record:

```text
interactive_viewed
run_clicked
execution_success
execution_error
execution_timeout
```

This can help determine whether the learner actually interacted with the example.

---

# 49. INT1 Analytics

Useful metrics:

```text
blockViewed
runCount
successfulRuns
failedRuns
timeoutCount
firstRunTime
lastRunTime
completed
```

For INT1, analytics should remain lightweight.

There is no need to track editing operations because editing is not part of INT1.

---

# 50. INT1 Completion

The simplest completion rule is:

```text
Learner successfully runs the example.
```

Therefore:

```text
NOT_STARTED
     ↓
RUN
     ↓
SUCCESS
     ↓
COMPLETE
```

If execution fails:

```text
RUN
 ↓
ERROR
 ↓
NOT COMPLETE
```

The learner can run it again.

---

# 51. INT1 Does Not Require a Score

This is important.

INT1 is primarily experiential.

The system should not normally say:

```text
8 / 10
```

because the learner did not solve an assessment.

Instead:

```text
✓ Example executed successfully
```

The learning value comes from observation.

---

# 52. INT1 Optional Completion Condition

Some tutorial authors may want:

> The learner must successfully execute the example before continuing.

Then:

```json
{
  "completion": {
    "required": true,
    "condition": "successful_execution"
  }
}
```

This is optional.

---

# 53. INT1 No Prediction Requirement

The learner should not have to answer:

> What will happen?

That belongs to INT4.

INT1 deliberately lets the learner discover the result.

```text
INT1
Run → Observe

INT4
Predict → Run → Compare
```

---

# 54. INT1 No Editing Requirement

Similarly:

```text
INT1
Fixed code

INT2
Editable code
```

This distinction should be enforced in the authoring schema and UI.

---

# 55. INT1 No Debugging Requirement

If the code produces an error:

```text
Show error
```

but do not automatically turn the block into:

```text
Find the bug
```

That belongs to INT5.

---

# 56. INT1 Authoring Rules

A strong INT1 should:

```text
✓ Contain executable code
✓ Have a clear runtime objective
✓ Require only Run → Observe
✓ Keep the interaction simple
✓ Show actual output
✓ Show actual runtime errors when applicable
✓ Use short instructions
✓ Focus on one concept or behavior
```

Avoid:

```text
❌ Editable code
❌ Prediction questions
❌ Debugging workflow
❌ Multiple required steps
❌ Full IDE functionality
❌ Hidden assessment requirements
```

---

# 57. INT1 Example — Complete Learning Unit

Suppose the concept is:

> Python list references.

The tutorial can present:

### Explanation

> Two variables can reference the same list object.

### CodeBlock

```python
numbers = [1, 2, 3]
backup = numbers
```

### INT1

```python
numbers = [1, 2, 3]
backup = numbers

numbers.append(4)

print(backup)
```

The learner clicks:

```text
[ ▶ Run ]
```

Output:

```text
[1, 2, 3, 4]
```

Then the tutorial can explain:

> `backup` references the same list object, so the mutation is visible through both variables.

This is an excellent INT1 use case.

---

# 58. INT1 Example — Exception Handling

Concept:

> Exceptions can interrupt normal execution.

Code:

```python
numbers = [1, 2, 3]

print(numbers[10])
```

Run.

Output:

```text
IndexError: list index out of range
```

The learner directly sees the runtime consequence.

The following explanation can then introduce exception handling.

---

# 59. INT1 Example — Function Return

```python
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

Output:

```text
30
```

This reinforces:

```text
Function call
 ↓
Return value
 ↓
Variable
 ↓
Output
```

---

# 60. INT1 Example — Object Identity

```python
a = [1, 2, 3]
b = a

print(a is b)
```

Output:

```text
True
```

Again:

```text
Code
 ↓
Run
 ↓
Observe
```

No additional interaction is required.

---

# 61. INT1 Final Mental Model

```text
                    INT1
              CODE → RUN → OUTPUT
                       │
                       ▼
                  FIXED CODE
                       │
                       ▼
                    RUN
                       │
              ┌────────┴────────┐
              ▼                 ▼
           SUCCESS            ERROR
              │                 │
              ▼                 ▼
           OUTPUT           ERROR OUTPUT
              │
              ▼
          OBSERVATION
```

The defining principle is:

> **Let the learner execute a prepared example and observe real runtime behavior with the minimum possible interaction.**

---

# 62. INT1 Final Technical Specification

| Area                       | INT1 Decision                    |
| -------------------------- | -------------------------------- |
| **Block**                  | **InteractiveBlock**             |
| **Version**                | **INT1**                         |
| **Presentation**           | **Code → Run → Output**          |
| **Primary purpose**        | Runtime observation              |
| **Code**                   | Required                         |
| **Code editing**           | ❌                                |
| **Run action**             | Required                         |
| **Output**                 | Required                         |
| **Runtime errors**         | Displayed                        |
| **Prediction**             | ❌                                |
| **Guided steps**           | ❌                                |
| **Debugging**              | ❌                                |
| **Open-ended exploration** | ❌                                |
| **Execution environment**  | Required                         |
| **Sandboxing**             | Required for untrusted execution |
| **Timeout**                | Required                         |
| **Resource limits**        | Recommended                      |
| **Completion tracking**    | Supported                        |
| **Scoring**                | ❌ Normally                       |
| **Analytics**              | Lightweight                      |
| **Theme**                  | Light                            |
| **Primary**                | **#F54A8D**                      |
| **Secondary**              | **#0B1B3D**                      |
| **Gradient**               | ❌                                |
| **Dark theme**             | ❌                                |
| **Responsive**             | ✅                                |
| **Accessible**             | ✅                                |
| **JSON-driven**            | ✅                                |

---

# 63. InteractiveBlock Progress

We now begin the new InteractiveBlock hierarchy:

```text
INT1 — Code → Run → Output
        ↓
INT2 — Edit → Run → Observe
        ↓
INT3 — Guided Interactive Steps
        ↓
INT4 — Predict → Run → Compare
        ↓
INT5 — Debug Interactive
        ↓
INT6 — Full Playground
```

The conceptual progression is:

```text
OBSERVE
   ↓
EXPERIMENT
   ↓
FOLLOW
   ↓
PREDICT + VERIFY
   ↓
DEBUG
   ↓
EXPLORE
```

## **INT1 — Code → Run → Output: COMPLETE** ✅

The next version will be:

> **INT2 — Edit → Run → Observe**

where the learner gains controlled editing ability and can change the code, execute it, and directly observe how their changes affect runtime behavior.



```python

```

# BLOCK 15 — InteractiveBlock

## INT2 — Edit → Run → Observe

Yes. We continue with **only INT2**, exactly one version at a time.

The committed InteractiveBlock sequence remains:

| Version  | Presentation             | Status         |
| -------- | ------------------------ | -------------- |
| INT1     | Code → Run → Output      | ✅ Complete     |
| **INT2** | **Edit → Run → Observe** | 🔵 **CURRENT** |
| INT3     | Guided Interactive Steps | ⏳              |
| INT4     | Predict → Run → Compare  | ⏳              |
| INT5     | Debug Interactive        | ⏳              |
| INT6     | Full Playground          | ⏳              |

---

# 1. What Is INT2 — Edit → Run → Observe?

**INT2 — Edit → Run → Observe** introduces the learner's first actual control over the executable code.

The core model is:

```text
EDIT
  ↓
RUN
  ↓
OBSERVE
  ↓
EDIT AGAIN
  ↓
RUN AGAIN
  ↓
OBSERVE AGAIN
```

The defining principle is:

> **The learner changes a controlled piece of code, executes it, and observes how their changes affect runtime behavior.**

This is the first InteractiveBlock version where the learner is not merely observing an author-provided example.

They are **experimenting with the code**.

---

# 2. Position of INT2

```text
INT1
Code → Run → Output
        ↓
INT2
Edit → Run → Observe
        ↓
INT3
Guided Interactive Steps
        ↓
INT4
Predict → Run → Compare
        ↓
INT5
Debug Interactive
        ↓
INT6
Full Playground
```

The progression now becomes:

```text
INT1
OBSERVE
   ↓
INT2
EXPERIMENT
   ↓
INT3
FOLLOW GUIDED EXPERIMENT
   ↓
INT4
PREDICT + VERIFY
   ↓
INT5
DEBUG
   ↓
INT6
EXPLORE FREELY
```

---

# 3. INT1 → INT2

This is the most important transition.

### INT1

```text
Author provides code
        ↓
Learner runs code
        ↓
Learner observes output
```

### INT2

```text
Author provides starting code
        ↓
Learner edits code
        ↓
Learner runs code
        ↓
Learner observes result
```

So:

> **INT1 = observe execution.**

> **INT2 = experiment with execution.**

---

# 4. INT2 Is Controlled Experimentation

INT2 is **not yet a full programming environment**.

The learner should normally work within a defined example.

For example:

```python
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

The learner could change:

```python
numbers.append(5)
```

and run again.

Output:

```text
[1, 2, 3, 5]
```

The learner discovers the effect of the modification.

---

# 5. INT2 Core Learning Objective

INT2 answers:

> **What happens when I change the code?**

The learner develops an experimental relationship with code:

```text
CHANGE
  ↓
EXECUTE
  ↓
OBSERVE
  ↓
UNDERSTAND
```

This is extremely useful for concepts where static explanation is insufficient.

---

# 6. INT2 Example

Initial code:

```python
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

Output:

```text
[1, 2, 3, 4]
```

Learner changes:

```python
numbers.append(10)
```

Runs again.

Output:

```text
[1, 2, 3, 10]
```

The learner immediately sees:

```text
Code change
    ↓
Behavior change
```

---

# 7. INT2 vs ExerciseBlock

This distinction is important.

### ExerciseBlock

The learner is asked to accomplish a defined exercise.

```text
Problem
 ↓
Learner solves
 ↓
Evaluation
```

### INT2

The learner is encouraged to **experiment**.

```text
Starting code
 ↓
Modify
 ↓
Run
 ↓
Observe
 ↓
Modify again
```

The learner may not have a single "correct answer."

---

# 8. INT2 vs TaskBlock

### TaskBlock

> Build a solution that satisfies a requirement.

### INT2

> Change this example and observe what happens.

Therefore:

```text
TaskBlock
→ Outcome-oriented

INT2
→ Experiment-oriented
```

---

# 9. INT2 vs INT3

INT2 provides the editing environment but does not require a predefined guided sequence.

### INT2

```text
Edit
 ↓
Run
 ↓
Observe
```

### INT3

```text
Step 1
 ↓
Edit
 ↓
Run
 ↓
Observe
 ↓
Step 2
 ↓
Edit
 ↓
Run
```

INT3 adds **structured instructional guidance**.

---

# 10. INT2 vs INT4

INT2:

```text
Edit
 ↓
Run
 ↓
Observe
```

INT4:

```text
Predict
 ↓
Run
 ↓
Compare
```

The key difference is that INT4 deliberately requires a prediction **before execution**.

---

# 11. INT2 vs INT5

INT2:

> Experiment with working code.

INT5:

> Investigate and repair broken code.

So:

```text
INT2
Working example
+
Experiment

INT5
Broken example
+
Diagnosis
+
Fix
```

---

# 12. INT2 vs INT6

INT2 still has an instructional boundary.

```text
┌────────────────────────────┐
│ Educational Example        │
│                            │
│ Editable Code              │
│            ↓               │
│ Run                        │
│            ↓               │
│ Observe                    │
└────────────────────────────┘
```

INT6 becomes:

```text
┌────────────────────────────┐
│ Full Playground            │
│                            │
│ Create files               │
│ Edit                       │
│ Run                        │
│ Debug                      │
│ Experiment                 │
│ Explore                    │
└────────────────────────────┘
```

---

# 13. INT2 Basic UI

```text
┌────────────────────────────────┐
│ Interactive Example            │
│                                │
│ Change the value of `x` and    │
│ run the code again.            │
│                                │
│ ┌────────────────────────────┐ │
│ │ x = 10                     │ │
│ │                            │ │
│ │ print(x * 2)               │ │
│ └────────────────────────────┘ │
│                                │
│              [ ▶ Run ]         │
└────────────────────────────────┘

Output
──────────────────────────────────

20
```

The key difference from INT1:

> **The code editor is editable.**

---

# 14. INT2 Complete Interaction

```text
STARTING CODE
      ↓
     EDIT
      ↓
     RUN
      ↓
   OUTPUT
      ↓
OBSERVE BEHAVIOR
      ↓
   EDIT AGAIN
      ↓
     RUN
      ↓
   OUTPUT
```

This loop is the essence of INT2.

---

# 15. INT2 Editing Model

The editor can allow:

```text
Insert
Delete
Replace
Reorder
Modify values
Modify expressions
```

But the author can constrain what is editable.

For example:

```text
Editable:
numbers.append(4)

Locked:
def print_result(...):
```

This is useful for teaching a specific concept without turning the block into a full playground.

---

# 16. INT2 Editable Regions

A powerful authoring feature is:

```json
{
  "editableRegions": [
    {
      "startLine": 3,
      "endLine": 3
    }
  ]
}
```

The learner can experiment with the intended section while the rest of the example remains protected.

---

# 17. INT2 Full-Code Editing

Alternatively:

```json
{
  "editing": {
    "mode": "full"
  }
}
```

The learner can modify the entire code example.

This should still remain within the scope of the particular tutorial block.

---

# 18. INT2 Restricted Editing

For beginner concepts:

```text
Only values editable
```

Example:

```python
x = 10
```

The learner changes:

```python
x = 50
```

but cannot alter the overall structure.

This gives a gentle introduction to experimentation.

---

# 19. INT2 Example — Variables

Initial:

```python
x = 10

print(x)
```

Learner changes:

```python
x = 100
```

Runs.

Output:

```text
100
```

The learner sees:

```text
Assignment
 ↓
Runtime value
```

---

# 20. INT2 Example — Conditional Logic

Starting code:

```python
age = 20

if age >= 18:
    print("Adult")
else:
    print("Minor")
```

Learner changes:

```python
age = 15
```

Output:

```text
Minor
```

Then:

```python
age = 25
```

Output:

```text
Adult
```

The learner experimentally discovers the boundary condition.

---

# 21. INT2 Example — Loops

Starting:

```python
for i in range(3):
    print(i)
```

Output:

```text
0
1
2
```

Learner changes:

```python
range(5)
```

Output:

```text
0
1
2
3
4
```

This is a perfect INT2 interaction.

---

# 22. INT2 Example — Lists

Starting:

```python
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

Learner experiments:

```python
numbers.append(100)
```

Output:

```text
[1, 2, 3, 100]
```

Then:

```python
numbers.remove(2)
```

Output:

```text
[1, 3, 100]
```

The learner explores list mutation.

---

# 23. INT2 Example — References

Starting:

```python
a = [1, 2, 3]
b = a

a.append(4)

print(b)
```

Output:

```text
[1, 2, 3, 4]
```

Now the learner changes:

```python
b = a.copy()
```

and runs again.

Output:

```text
[1, 2, 3, 4]
```

Then they can modify the code further to observe the difference.

This creates an experimental understanding of:

```text
Reference
vs
Copy
```

---

# 24. INT2 Example — Exception Handling

Starting:

```python
value = int("10")

print(value)
```

Learner changes:

```python
value = int("hello")
```

Output:

```text
ValueError
```

Then the learner can experiment with:

```python
try:
    value = int("hello")
except ValueError:
    print("Invalid input")
```

This naturally prepares the learner for more advanced exception-handling concepts.

---

# 25. INT2 Output Must Update

Every successful run should replace or refresh the output.

Example:

### First run

```text
10
```

### Learner edits

```python
x = 20
```

### Second run

```text
20
```

The learner should immediately see the relationship between:

```text
EDIT
 ↓
NEW EXECUTION
 ↓
NEW RESULT
```

---

# 26. INT2 Optional Output History

A more advanced implementation may allow:

```text
Run 1
─────
10

Run 2
─────
20

Run 3
─────
40
```

This can be useful for experiments.

However, it should be optional.

The default should remain clean.

---

# 27. INT2 Run History

If enabled:

```json
{
  "outputHistory": {
    "enabled": true,
    "maxRuns": 5
  }
}
```

This lets learners compare their experiments.

---

# 28. INT2 Reset

Because the learner can modify code, a reset action is useful.

```text
[ Reset Code ]
```

This restores:

```text
AUTHOR STARTING CODE
```

Example:

```text
Learner edits
     ↓
Experiments
     ↓
Unexpected result
     ↓
[ Reset ]
     ↓
Original example
```

---

# 29. INT2 Reset Should Be Safe

Reset should normally ask for confirmation only when significant learner work could be lost.

For small examples:

```text
[ Reset ]
```

can immediately restore the initial code.

For larger examples:

```text
Reset code?
Your current changes will be lost.

[ Cancel ] [ Reset ]
```

---

# 30. INT2 Execution State

The same execution states from INT1 remain:

```text
idle
running
success
error
timeout
```

But INT2 adds editing state:

```text
edited
```

So the conceptual state model becomes:

```text
INITIAL
  ↓
EDITED
  ↓
RUNNING
  ↓
SUCCESS / ERROR / TIMEOUT
  ↓
EDITED AGAIN
```

---

# 31. INT2 Unsaved Changes

A small indicator can show:

```text
● Modified
```

After successful run:

```text
✓ Executed
```

This helps the learner understand the current code state.

---

# 32. INT2 UI

```text
┌───────────────────────────────────────────────┐
│ Interactive Example                           │
├───────────────────────────────────────────────┤
│                                               │
│ Try changing `x` and run the example again.   │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ x = 10                                    │ │
│ │                                           │ │
│ │ print(x * 2)                              │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ● Modified                                    │
│                                               │
│ [ ▶ Run ]     [ ↺ Reset ]                    │
│                                               │
├───────────────────────────────────────────────┤
│ OUTPUT                                        │
├───────────────────────────────────────────────┤
│ 20                                            │
└───────────────────────────────────────────────┘
```

---

# 33. INT2 Instruction Design

The instruction should encourage experimentation.

Examples:

> Change `x` to `50` and run the code again.

or:

> Try different values for `age` and observe when the output changes.

or:

> Change the list and observe how the result changes.

The instruction should not necessarily provide the answer.

---

# 34. INT2 Open Experimentation

A simple INT2 may say:

> Experiment with the code and observe how the output changes.

This gives the learner freedom.

However, the author should still define the intended learning objective.

---

# 35. INT2 Guided Experiment vs INT3

Suppose the instruction says:

> Change `x` to 20, run the code, then change it to 50.

That begins approaching INT3.

Therefore:

### INT2

```text
Edit
Run
Observe
```

### INT3

```text
Step 1
Edit X
Run

Step 2
Edit Y
Run

Step 3
Compare
```

INT3 owns the structured guidance.

---

# 36. INT2 No Mandatory Correct Answer

A learner can experiment with:

```python
x = 5
```

or:

```python
x = 50
```

or:

```python
x = -10
```

The purpose may be exploration rather than correctness.

Therefore, INT2 does not normally require:

```text
PASS / FAIL
```

unless the author explicitly configures an experiment condition.

---

# 37. INT2 Optional Experiment Conditions

Some authors may want:

> Change `x` so the output becomes `100`.

Then the block can have an optional success condition.

```json
{
  "successCondition": {
    "type": "stdout",
    "expected": "100"
  }
}
```

This turns experimentation into a lightweight learning check.

But the core INT2 identity remains:

```text
Edit → Run → Observe
```

---

# 38. INT2 Example With Optional Goal

Instruction:

> Change the value of `x` so the program prints `100`.

Starting code:

```python
x = 10

print(x * 2)
```

Learner experiments:

```python
x = 20
```

Output:

```text
40
```

Then:

```python
x = 50
```

Output:

```text
100
```

The system can show:

```text
✓ Goal achieved
```

This is still INT2 because the core interaction is experimentation.

---

# 39. INT2 Code Editor

The editor should support the minimum functionality needed for controlled experimentation:

```text
Syntax highlighting
Line numbers
Indentation
Undo
Redo
Copy
Keyboard shortcuts
```

It does not need full IDE capabilities.

---

# 40. INT2 Editor Scope

INT2 should not automatically include:

```text
Multiple files
Package manager
Terminal
Git
File explorer
Debugger
Database explorer
```

Those belong to more advanced interactive environments, especially INT6.

---

# 41. INT2 Language Support

The same execution architecture can support multiple languages.

Example:

```text
Python
JavaScript
TypeScript
Java
C++
SQL
```

The exact languages depend on the platform's runtime capabilities.

The content model should therefore be language-neutral.

---

# 42. INT2 JSON Structure

```json
{
  "type": "interactive",
  "version": "INT2",
  "presentation": "Edit → Run → Observe",

  "content": {
    "title": "",
    "instructions": "",
    "code": ""
  },

  "editing": {
    "enabled": true,
    "mode": "full",
    "editableRegions": []
  },

  "execution": {
    "language": "",
    "runtime": "",
    "timeoutMs": 5000
  },

  "output": {
    "visible": true,
    "historyEnabled": false
  },

  "reset": {
    "enabled": true
  }
}
```

---

# 43. Complete INT2 JSON Example

```json
{
  "type": "interactive",
  "version": "INT2",
  "presentation": "Edit → Run → Observe",

  "content": {
    "title": "Experiment With List Mutation",

    "instructions": "Change the value appended to the list and run the code again to observe the result.",

    "code": "numbers = [1, 2, 3]\n\nnumbers.append(4)\n\nprint(numbers)"
  },

  "editing": {
    "enabled": true,
    "mode": "full",
    "editableRegions": []
  },

  "execution": {
    "language": "python",
    "runtime": "python3",
    "timeoutMs": 5000
  },

  "output": {
    "visible": true,
    "historyEnabled": false
  },

  "reset": {
    "enabled": true
  }
}
```

---

# 44. INT2 Controlled Region Example

For a beginner lesson:

```json
{
  "editing": {
    "enabled": true,
    "mode": "regions",
    "editableRegions": [
      {
        "startLine": 3,
        "endLine": 3
      }
    ]
  }
}
```

The learner changes only the intended line.

This prevents accidental structural changes from distracting from the lesson.

---

# 45. INT2 Full Edit Example

For a more advanced concept:

```json
{
  "editing": {
    "enabled": true,
    "mode": "full"
  }
}
```

The learner can experiment with the entire example.

This should still not become an unrestricted project workspace.

---

# 46. INT2 Execution Architecture

Conceptually:

```text
┌─────────────────────┐
│ Tutorial Page       │
│                     │
│ INT2 Block          │
└──────────┬──────────┘
           │
           │ Edited Code
           ▼
┌─────────────────────┐
│ Execution API       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Isolated Runtime    │
│                     │
│ CPU Limit           │
│ Memory Limit        │
│ Timeout             │
│ Network Policy      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Execution Result    │
│                     │
│ stdout              │
│ stderr              │
│ status              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Output Panel        │
└─────────────────────┘
```

---

# 47. INT2 Security

Because the learner can submit arbitrary modifications within the block, the execution environment must still be treated as untrusted code.

The runtime should enforce:

```text
CPU limits
Memory limits
Execution timeout
Output limits
Process limits
Filesystem isolation
Network restrictions
```

The browser should never be trusted as the security boundary for server-side execution.

---

# 48. INT2 Error Handling

If the learner introduces an error:

```python
numbers.append(
```

the output can show:

```text
SyntaxError
```

The block should not automatically provide the solution.

The learner can modify the code and run again.

That creates:

```text
EDIT
 ↓
ERROR
 ↓
EDIT
 ↓
RUN
 ↓
SUCCESS
```

This is still INT2.

It only becomes INT5 when the **explicit learning objective is debugging**.

---

# 49. INT2 Experiment Loop

The most important UI behavior is:

```text
┌───────────────┐
│     EDIT      │
└───────┬───────┘
        ↓
┌───────────────┐
│      RUN      │
└───────┬───────┘
        ↓
┌───────────────┐
│    OBSERVE    │
└───────┬───────┘
        │
        └──────────────┐
                       ▼
                     EDIT
```

The loop should feel immediate and natural.

---

# 50. INT2 Reset Flow

```text
Learner modifies code
        ↓
Runs experiment
        ↓
Wants original example
        ↓
[ Reset ]
        ↓
Author's original code
```

Reset should never alter the stored author content.

The platform should maintain:

```text
Original Code
+
Learner Working Copy
```

separately.

---

# 51. INT2 Persistence

If the learner leaves the page, the platform can optionally save:

```json
{
  "blockId": "interactive-001",
  "workingCode": "numbers = [1,2,3]\n...",
  "runCount": 4
}
```

When they return:

```text
Your previous changes have been restored.
```

This is especially useful for longer tutorials.

---

# 52. INT2 Autosave

Autosave can be:

```text
local draft
```

or:

```text
server-persisted draft
```

depending on the tutorial architecture.

However:

> **The original author code must remain immutable.**

---

# 53. INT2 Analytics

Useful events:

```text
interactive_viewed
editor_focused
code_edited
run_clicked
execution_success
execution_error
execution_timeout
reset_clicked
goal_completed
```

Additional metrics:

```text
runCount
editCount
successfulRuns
failedRuns
timeBetweenEdits
timeToFirstRun
timeToSuccessfulRun
```

These metrics reveal how learners experiment.

---

# 54. INT2 Learning Analytics

Example:

```json
{
  "interactiveAnalytics": {
    "editCount": 7,
    "runCount": 5,
    "successfulRuns": 4,
    "failedRuns": 1,
    "resetCount": 1,
    "timeToFirstRunSeconds": 38
  }
}
```

This can later help identify whether a concept is confusing.

---

# 55. INT2 Completion

INT2 normally does not need a score.

Possible completion models:

### Interaction completion

```text
Learner runs modified code.
```

### Goal completion

```text
Learner produces the expected behavior.
```

### Exploration completion

```text
Learner performs the configured number of experiments.
```

The author can select the desired model.

---

# 56. INT2 Optional Completion Schema

```json
{
  "completion": {
    "mode": "successful_run"
  }
}
```

or:

```json
{
  "completion": {
    "mode": "goal"
  }
}
```

or:

```json
{
  "completion": {
    "mode": "none"
  }
}
```

The default can remain lightweight.

---

# 57. INT2 No Mandatory Scoring

Unless explicitly configured, the block should communicate:

```text
Experiment
```

rather than:

```text
Assessment
```

This keeps InteractiveBlock distinct from QuestionBlock, ExerciseBlock, and QuizBlock.

---

# 58. INT2 Teaching Pattern

A strong tutorial sequence can be:

```text
Concept
   ↓
Explanation
   ↓
Code Example
   ↓
INT1
Observe
   ↓
INT2
Experiment
   ↓
Summary
```

For example:

```text
"What is mutability?"
       ↓
"Here is a list."
       ↓
"Run it."
       ↓
"Now change it."
       ↓
"Observe the difference."
```

This is pedagogically powerful.

---

# 59. INT2 Example — Memory Teaching

### Initial code

```python
a = [1, 2, 3]
b = a

a.append(4)

print(b)
```

Output:

```text
[1, 2, 3, 4]
```

### Experiment

Ask the learner:

> Change `b = a` to `b = a.copy()` and run again.

Now the learner can observe what changes when the reference relationship is replaced by a copy.

This is an ideal INT2 pattern.

---

# 60. INT2 Example — Exception Handling

Starting:

```python
value = "10"

print(int(value))
```

Instruction:

> Change the value to `"hello"` and run the program.

The learner observes:

```text
ValueError
```

Then a later block can introduce:

```python
try:
    ...
except ValueError:
    ...
```

INT2 therefore creates a natural experiential bridge into exception handling.

---

# 61. INT2 Example — Performance

Starting:

```python
numbers = [1, 2, 3, 4, 5]

print(sum(numbers))
```

The learner can modify the collection size and observe output behavior.

For advanced tutorials, execution time can optionally be displayed:

```text
Output
──────
15

Execution time: 0.02 ms
```

This can introduce performance concepts, although actual benchmarking should be handled carefully.

---

# 62. INT2 UI Design Principles

The UI should prioritize:

```text
Code
 ↓
Run
 ↓
Output
```

with editing added naturally.

Avoid turning the block into an IDE.

The learner should always understand:

> **What should I change?**

> **Where do I run it?**

> **What happened?**

---

# 63. INT2 Final UI Concept

```text
┌──────────────────────────────────────────────────┐
│ INTERACTIVE EXAMPLE                              │
│                                                  │
│ Experiment With List Mutation                   │
│                                                  │
│ Change the value appended to the list and run    │
│ the code again.                                  │
│                                                  │
│ CODE                                             │
│ ┌──────────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                         │ │
│ │                                              │ │
│ │ numbers.append(4)                           │ │
│ │                                              │ │
│ │ print(numbers)                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ● Modified                                      │
│                                                  │
│ [ ▶ Run ]                 [ ↺ Reset ]            │
│                                                  │
│ OUTPUT                                           │
│ ──────────────────────────────────────────────── │
│ [1, 2, 3, 4]                                     │
│                                                  │
│ ✓ Execution completed                           │
└──────────────────────────────────────────────────┘
```

---

# 64. INT2 Final Mental Model

```text
                         INT2
                EDIT → RUN → OBSERVE
                         │
                         ▼
                  STARTING CODE
                         │
                         ▼
                       EDIT
                         │
                         ▼
                       RUN
                         │
                ┌────────┴────────┐
                ▼                 ▼
             SUCCESS            ERROR
                │                 │
                ▼                 ▼
             OUTPUT          ERROR OUTPUT
                │
                ▼
             OBSERVE
                │
                └──────────────→ EDIT AGAIN
```

The defining principle is:

> **Give the learner controlled freedom to modify executable code, run it, and discover how their changes affect runtime behavior.**

---

# 65. INT2 Final Technical Specification

| Area                    | INT2 Decision                    |
| ----------------------- | -------------------------------- |
| **Block**               | **InteractiveBlock**             |
| **Version**             | **INT2**                         |
| **Presentation**        | **Edit → Run → Observe**         |
| **Primary purpose**     | Controlled code experimentation  |
| **Starting code**       | Required                         |
| **Editing**             | Required                         |
| **Editable regions**    | Supported                        |
| **Full editing**        | Supported                        |
| **Run action**          | Required                         |
| **Output**              | Required                         |
| **Runtime errors**      | Displayed                        |
| **Prediction**          | ❌                                |
| **Guided steps**        | ❌                                |
| **Debugging workflow**  | ❌                                |
| **Full playground**     | ❌                                |
| **Reset**               | Recommended                      |
| **Output history**      | Optional                         |
| **Goal condition**      | Optional                         |
| **Completion tracking** | Supported                        |
| **Scoring**             | ❌ Normally                       |
| **Autosave**            | Supported                        |
| **Analytics**           | Experiment-focused               |
| **Sandboxing**          | Required for untrusted execution |
| **Timeout**             | Required                         |
| **Resource limits**     | Recommended                      |
| **Theme**               | Light                            |
| **Primary**             | **#F54A8D**                      |
| **Secondary**           | **#0B1B3D**                      |
| **Gradient**            | ❌                                |
| **Dark theme**          | ❌                                |
| **Responsive**          | ✅                                |
| **Accessible**          | ✅                                |
| **JSON-driven**         | ✅                                |

---

# 66. InteractiveBlock Progress

We now have:

```text
INT1 — Code → Run → Output
        ↓
INT2 — Edit → Run → Observe
        ↓
INT3 — Guided Interactive Steps
        ↓
INT4 — Predict → Run → Compare
        ↓
INT5 — Debug Interactive
        ↓
INT6 — Full Playground
```

The progression is:

```text
INT1
OBSERVE
   ↓
INT2
EXPERIMENT
   ↓
INT3
FOLLOW GUIDED INTERACTION
   ↓
INT4
PREDICT + VERIFY
   ↓
INT5
DEBUG
   ↓
INT6
EXPLORE FREELY
```

## **INT2 — Edit → Run → Observe: COMPLETE** ✅

The next version is:

> **INT3 — Guided Interactive Steps**

where the learner will no longer simply experiment freely; the InteractiveBlock will guide them through a sequence of **specific interactive discoveries**, while still requiring actual code execution and observation.



```python

```

# BLOCK 15 — InteractiveBlock

## INT3 — Guided Interactive Steps

Yes. We continue with **only INT3**, one version at a time.

The committed InteractiveBlock sequence remains:

| Version  | Presentation                 | Status         |
| -------- | ---------------------------- | -------------- |
| INT1     | Code → Run → Output          | ✅ Complete     |
| INT2     | Edit → Run → Observe         | ✅ Complete     |
| **INT3** | **Guided Interactive Steps** | 🔵 **CURRENT** |
| INT4     | Predict → Run → Compare      | ⏳              |
| INT5     | Debug Interactive            | ⏳              |
| INT6     | Full Playground              | ⏳              |

---

# 1. What Is INT3 — Guided Interactive Steps?

**INT3 — Guided Interactive Steps** takes the experimentation capability of INT2 and turns it into a **structured learning journey**.

The learner is guided through a sequence of interactive actions.

The core model is:

```text
GUIDE
  ↓
EDIT
  ↓
RUN
  ↓
OBSERVE
  ↓
EXPLAIN
  ↓
NEXT STEP
  ↓
EDIT
  ↓
RUN
  ↓
OBSERVE
```

The defining principle is:

> **The learner discovers a concept through a sequence of guided interactive experiments rather than performing one unrestricted edit-and-run cycle.**

---

# 2. Position of INT3

```text
INT1
Code → Run → Output
        ↓
INT2
Edit → Run → Observe
        ↓
INT3
Guided Interactive Steps
        ↓
INT4
Predict → Run → Compare
        ↓
INT5
Debug Interactive
        ↓
INT6
Full Playground
```

The progression is now:

```text
INT1
OBSERVE
   ↓
INT2
EXPERIMENT
   ↓
INT3
FOLLOW GUIDED DISCOVERY
   ↓
INT4
PREDICT + VERIFY
   ↓
INT5
DEBUG
   ↓
INT6
EXPLORE FREELY
```

---

# 3. INT2 → INT3

This is the most important distinction.

### INT2

The learner receives:

```text
Starting Code
     ↓
"Experiment with it."
```

The learner decides what to change.

### INT3

The learner receives:

```text
Step 1
 ↓
Specific change
 ↓
Run
 ↓
Observe
 ↓
Step 2
 ↓
Another change
 ↓
Run
 ↓
Observe
```

Therefore:

> **INT2 = learner-directed experimentation.**

> **INT3 = author-guided experimentation.**

---

# 4. INT3 Core Learning Objective

INT3 answers:

> **Can I discover this concept by following a sequence of meaningful interactive experiments?**

The learner is not merely reading a sequence of explanations.

They actively perform each step.

```text
EXPLANATION
     ↓
ACTION
     ↓
EXECUTION
     ↓
OBSERVATION
     ↓
UNDERSTANDING
```

---

# 5. INT3 Example

Suppose the concept is:

> Python variables can reference the same mutable object.

### Step 1

Instruction:

> Run the code without changing it.

```python id="2l0vje"
numbers = [1, 2, 3]
backup = numbers

print(numbers)
print(backup)
```

Output:

```text id="7q8k0g"
[1, 2, 3]
[1, 2, 3]
```

---

### Step 2

Instruction:

> Change `numbers.append(4)` to the code shown below.

```python id="8f3j5b"
numbers.append(4)
```

Run.

Output:

```text id="k9q4wz"
[1, 2, 3, 4]
[1, 2, 3, 4]
```

---

### Step 3

Instruction:

> Replace `backup = numbers` with `backup = numbers.copy()` and run again.

Now the learner observes the difference.

This is **INT3**.

---

# 6. INT3 Guided Discovery Pattern

A strong INT3 can follow:

```text id="1qv2oe"
CONCEPT
  ↓
STEP 1
Observe baseline
  ↓
STEP 2
Change one thing
  ↓
RUN
  ↓
OBSERVE
  ↓
STEP 3
Change another thing
  ↓
RUN
  ↓
OBSERVE
  ↓
CONCLUSION
```

Each step should have a pedagogical purpose.

---

# 7. INT3 vs Static Tutorial Steps

A normal tutorial might say:

```text id="bq6d8a"
1. Change the value.
2. Run the code.
3. Notice the result.
```

INT3 actually enforces the interactive workflow:

```text id="4gq8h1"
Step 1
[Edit]
[Run]
[Continue]

Step 2
[Edit]
[Run]
[Continue]

Step 3
[Edit]
[Run]
[Continue]
```

The learner experiences each state.

---

# 8. INT3 vs TaskBlock

TaskBlock asks:

> Accomplish something.

INT3 asks:

> Follow a guided sequence to discover something.

Therefore:

```text id="4q2t5v"
TaskBlock
→ Outcome

INT3
→ Guided learning process
```

---

# 9. INT3 vs ExerciseBlock

ExerciseBlock:

```text id="j4v1cx"
Problem
 ↓
Learner produces answer
 ↓
Evaluate
```

INT3:

```text id="5h6q4p"
Instruction
 ↓
Interactive action
 ↓
Observation
 ↓
Next instruction
```

INT3 is therefore more instructional than assessment-oriented.

---

# 10. INT3 vs QuestionBlock

QuestionBlock can ask:

> What happens if `backup = numbers.copy()`?

INT3 instead asks the learner to **actually make the change and run it**.

```text id="y2shw7"
QuestionBlock
→ Think / Answer

INT3
→ Perform / Observe
```

---

# 11. INT3 vs INT4

This distinction is especially important.

### INT3

The learner is told what experiment to perform.

```text id="7c5xw3"
Change X
 ↓
Run
 ↓
Observe
```

### INT4

The learner must predict before running.

```text id="b8p2dr"
Predict
 ↓
Run
 ↓
Compare
```

INT4 adds explicit prediction.

---

# 12. INT3 vs INT5

### INT3

The learner follows guided experiments to understand a concept.

### INT5

The learner investigates a broken program.

```text id="yy7l0p"
INT3
Guided Discovery

INT5
Debugging Investigation
```

An INT3 step can produce an error, but the block should not become a debugging exercise unless debugging is the explicit objective.

---

# 13. INT3 vs INT6

INT3 is still a structured instructional experience.

```text id="5i0x0j"
Author
  ↓
Defines Steps
  ↓
Learner
  ↓
Follows Steps
```

INT6:

```text id="k2n0oz"
Learner
  ↓
Creates own workflow
  ↓
Explores freely
```

So INT3 remains bounded.

---

# 14. INT3 Basic UI

```text id="t6m0pi"
┌───────────────────────────────────────────────┐
│ GUIDED INTERACTIVE                            │
│                                               │
│ Understanding List References                 │
│                                               │
│ STEP 1 OF 3                                   │
│                                               │
│ Run the code and observe the two variables.   │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                      │ │
│ │ backup = numbers                          │ │
│ │                                          │ │
│ │ print(numbers)                           │ │
│ │ print(backup)                            │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [ ▶ Run ]                                     │
│                                               │
│ OUTPUT                                        │
│ ───────────────────────────────────────────── │
│ [1, 2, 3]                                     │
│ [1, 2, 3]                                     │
│                                               │
│ [ Continue → ]                                │
└───────────────────────────────────────────────┘
```

---

# 15. INT3 Step Indicator

The learner should know where they are.

```text id="vmlwyt"
● Step 1
○ Step 2
○ Step 3
```

or:

```text id="l1j3rb"
Step 1 of 4
```

This provides orientation without overwhelming the learner.

---

# 16. INT3 Step States

Each step can have:

```text id="8cl0kf"
locked
current
completed
```

Example:

```text id="m3c1d5"
✓ Step 1
✓ Step 2
● Step 3
○ Step 4
```

Future steps should normally remain unavailable until their prerequisites are satisfied.

---

# 17. INT3 Step Completion

A step can be considered complete when:

```text id="83d2at"
Learner performs required edit
        +
Code executes successfully
        +
Required observation is recorded
```

Depending on the lesson, not every step needs an objectively correct output.

---

# 18. INT3 Step Types

A powerful INT3 model can support different step types.

### Step A — Run

```text id="iyb6w2"
Run the code.
```

### Step B — Edit

```text id="rx3khl"
Change `x` from 10 to 20.
```

### Step C — Run After Edit

```text id="k6m9be"
Run the modified code.
```

### Step D — Observe

```text id="8js5kq"
Look at the output.
```

### Step E — Explain

```text id="4l7q5s"
What changed?
```

### Step F — Continue

```text id="7v6v0b"
Continue to the next experiment.
```

The block author chooses which steps are necessary.

---

# 19. INT3 Guided Step Model

Conceptually:

```text id="g2o5v7"
STEP
│
├── Instruction
│
├── Editable Code
│
├── Run
│
├── Expected Observation
│
└── Completion Condition
```

For example:

```json id="f9m1vr"
{
  "id": "step-2",
  "instruction": "Change the list copy operation.",
  "code": "...",
  "completion": {
    "type": "successfulRun"
  }
}
```

---

# 20. INT3 Example — Variable References

### Step 1 — Baseline

Instruction:

> Run the code.

```python id="1akj2j"
a = [1, 2, 3]
b = a

print(a)
print(b)
```

Output:

```text id="ih88e9"
[1, 2, 3]
[1, 2, 3]
```

---

### Step 2 — Mutation

Instruction:

> Add `a.append(4)` before the print statements.

Run.

Output:

```text id="xjq5m8"
[1, 2, 3, 4]
[1, 2, 3, 4]
```

---

### Step 3 — Copy

Instruction:

> Change `b = a` to `b = a.copy()`.

Run.

Now the learner sees the behavioral difference.

---

# 21. INT3 Example — Exception Handling

### Step 1

```python id="d8t1xs"
value = "100"
print(int(value))
```

Instruction:

> Run the program.

Output:

```text id="q5s4l9"
100
```

---

### Step 2

Instruction:

> Change `"100"` to `"hello"`.

Run.

Output:

```text id="k7j9v4"
ValueError
```

---

### Step 3

Instruction:

> Wrap the conversion in a `try` block and handle `ValueError`.

Run.

Output:

```text id="qz6x8d"
Invalid input
```

The learner experiences the progression:

```text id="9t8v2k"
Normal execution
      ↓
Exception
      ↓
Exception handling
```

---

# 22. INT3 Example — Lists

### Step 1

```python id="u1d4vy"
numbers = [1, 2, 3]

print(numbers)
```

### Step 2

Instruction:

> Add `numbers.append(4)`.

### Step 3

Instruction:

> Replace `append()` with `extend([4, 5])`.

### Step 4

Instruction:

> Observe the difference in the final list.

This lets the learner interactively discover:

```text id="1c7o9w"
append()
vs
extend()
```

---

# 23. INT3 Example — Function Behavior

### Step 1

```python id="7tw7aa"
def square(x):
    return x * x

print(square(5))
```

### Step 2

> Change `5` to `10`.

### Step 3

> Change the function to return `x * 3`.

### Step 4

> Run again and observe the result.

The learner progressively manipulates the concept.

---

# 24. INT3 Example — Conditional Logic

```python id="xq8z7y"
age = 20

if age >= 18:
    print("Adult")
else:
    print("Minor")
```

Guided sequence:

```text id="c9w3st"
Step 1
Run with age = 20.

Step 2
Change age to 17.

Step 3
Run again.

Step 4
Change the condition from >= to >.

Step 5
Run with age = 18.
```

This exposes a subtle boundary condition.

---

# 25. INT3 Guided Steps Can Have Learning Notes

After a step completes:

```text id="9e5a3v"
┌──────────────────────────────────────┐
│ Observation                          │
│                                      │
│ Both variables changed because they  │
│ reference the same list object.      │
└──────────────────────────────────────┘
```

Then:

```text
[ Continue → ]
```

This creates:

```text id="6xk7r8"
ACTION
 ↓
OBSERVATION
 ↓
EXPLANATION
 ↓
NEXT ACTION
```

---

# 26. INT3 Step Feedback

If the learner performs the wrong modification:

```text id="0y2qcn"
This step expects the list to be copied
before it is modified.

Try changing:
b = a

to:
b = a.copy()
```

The system provides targeted guidance.

This is different from INT5's debugging feedback.

---

# 27. INT3 Step Hints

Hints can be layered.

### Hint 1

> Look at the assignment to `backup`.

### Hint 2

> Consider whether `backup` should reference the same object.

### Hint 3

> Try using `.copy()`.

This is useful for difficult guided interactions.

---

# 28. INT3 Hint Model

```json id="iy1qmc"
{
  "hints": [
    {
      "level": 1,
      "text": "Look at the assignment."
    },
    {
      "level": 2,
      "text": "Think about whether both variables reference the same object."
    },
    {
      "level": 3,
      "text": "Try using copy()."
    }
  ]
}
```

Hints should be optional.

---

# 29. INT3 Progression Locking

A learner should normally not jump directly to Step 4.

```text id="f7x1co"
Step 1 ✓
Step 2 ✓
Step 3 ●
Step 4 🔒
```

After completing Step 3:

```text id="m0y4pi"
Step 1 ✓
Step 2 ✓
Step 3 ✓
Step 4 ●
```

This ensures the intended learning progression.

---

# 30. Optional Free Navigation

For advanced learners, authors may allow:

```text id="1z9f7d"
[ Previous ]
[ Next ]
```

without strict locking.

But the default guided mode should preserve the intended sequence.

---

# 31. INT3 Step Completion Modes

Possible completion modes:

```text id="y1v2o5"
successful_run
expected_output
required_edit
goal_condition
manual_continue
```

Example:

```json id="e9j4wu"
{
  "completion": {
    "type": "expectedOutput",
    "value": "[1, 2, 3, 4]"
  }
}
```

---

# 32. INT3 Expected Observation

Some steps should not require an exact output.

For example:

> Run the program and notice that both variables display the same list.

The author may instead define:

```json id="e2j8s5"
{
  "observation": {
    "type": "conceptual",
    "description": "Both outputs contain the newly appended value."
  }
}
```

The learner's progress can simply depend on execution.

---

# 33. INT3 Conceptual Check

Optionally, after an interactive step:

> What did you observe?

The learner could answer:

```text id="8j2k4x"
[ Both variables changed ]
```

But this introduces QuestionBlock-like behavior.

Therefore this should be **optional**, not the defining feature of INT3.

---

# 34. INT3 Why the Step Boundary Matters

Without clear step boundaries, INT3 becomes:

```text id="w0g4kx"
INT2 + lots of instructions
```

Instead, INT3 should provide:

```text id="2e6z5p"
Discrete learning stages
+
State progression
+
Step completion
+
Guided sequence
```

That is what makes it a distinct InteractiveBlock version.

---

# 35. INT3 Step Timeline

A visual timeline can show:

```text id="qj4c4v"
● Baseline
   ↓
● Mutation
   ↓
● Copy
   ↓
● Compare
```

The learner can immediately understand the journey.

---

# 36. INT3 UI — Complete Concept

```text id="4q0n1b"
┌─────────────────────────────────────────────────┐
│ GUIDED INTERACTIVE                              │
│                                                 │
│ Python List References                           │
│                                                 │
│ ● Step 1 ─── ○ Step 2 ─── ○ Step 3             │
│                                                 │
│ STEP 1 — Observe the baseline                  │
│                                                 │
│ Run the code without changing it.              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ a = [1, 2, 3]                              │ │
│ │ b = a                                      │ │
│ │                                             │ │
│ │ print(a)                                   │ │
│ │ print(b)                                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ ▶ Run ]                                       │
│                                                 │
│ OUTPUT                                          │
│ ─────────────────────────────────────────────── │
│ [1, 2, 3]                                       │
│ [1, 2, 3]                                       │
│                                                 │
│ ✓ Step complete                                │
│                                                 │
│ [ Continue → ]                                  │
└─────────────────────────────────────────────────┘
```

---

# 37. INT3 Step 2 UI

After continuing:

```text id="d70e4e"
┌─────────────────────────────────────────────────┐
│ GUIDED INTERACTIVE                              │
│                                                 │
│ ✓ Step 1 ─── ● Step 2 ─── ○ Step 3             │
│                                                 │
│ STEP 2 — Observe shared mutation               │
│                                                 │
│ Add `a.append(4)` and run the code.             │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ a = [1, 2, 3]                              │ │
│ │ b = a                                      │ │
│ │                                             │ │
│ │ a.append(4)                                │ │
│ │                                             │ │
│ │ print(a)                                   │ │
│ │ print(b)                                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ ▶ Run ]                                       │
│                                                 │
│ OUTPUT                                          │
│ ─────────────────────────────────────────────── │
│ [1, 2, 3, 4]                                    │
│ [1, 2, 3, 4]                                    │
│                                                 │
│ [ Continue → ]                                  │
└─────────────────────────────────────────────────┘
```

---

# 38. INT3 Step 3 UI

```text id="0f1brk"
┌─────────────────────────────────────────────────┐
│ GUIDED INTERACTIVE                              │
│                                                 │
│ ✓ Step 1 ─── ✓ Step 2 ─── ● Step 3             │
│                                                 │
│ STEP 3 — Create an independent copy            │
│                                                 │
│ Change `b = a` to `b = a.copy()` and run.       │
│                                                 │
│ [ Code Editor ]                                 │
│                                                 │
│ [ ▶ Run ]                                       │
│                                                 │
│ OUTPUT                                          │
│ ─────────────────────────────────────────────── │
│ [1, 2, 3, 4]                                    │
│ [1, 2, 3]                                       │
│                                                 │
│ ✓ Guided exploration complete                  │
└─────────────────────────────────────────────────┘
```

---

# 39. INT3 Step State Machine

Conceptually:

```text id="g1b5ty"
LOCKED
  ↓
AVAILABLE
  ↓
ACTIVE
  ↓
RUNNING
  ↓
VALIDATING
  │
 ┌┴───────────────┐
 ▼                ▼
FAILED          PASSED
 │                │
 ▼                ▼
RETRY          COMPLETED
                  │
                  ▼
             NEXT STEP
```

This is the core state machine.

---

# 40. INT3 Failure Handling

If a step has a required output and the learner produces the wrong result:

```text id="j3o8c2"
Step not complete yet.

Your program ran successfully,
but the required observation was not produced.

Try the requested change again.
```

The learner remains on the current step.

---

# 41. INT3 Retry

The learner should be able to retry without losing the step.

```text id="s6g1a8"
[ Try Again ]
```

No score penalty is necessary unless explicitly configured.

---

# 42. INT3 Reset Step

A learner can optionally reset only the current step:

```text id="q5u7f1"
[ Reset Step ]
```

This restores the step's starting code.

This is useful if experimentation has taken the learner too far away from the intended state.

---

# 43. INT3 Reset Entire Activity

A complete reset can also be supported:

```text id="5b8n2e"
[ Reset Activity ]
```

This returns:

```text id="4f9y1h"
Step 1 active
Original code restored
Progress cleared
```

This should be clearly separated from "Reset Step."

---

# 44. INT3 Persistence

Progress can be persisted:

```json id="0w4r9m"
{
  "blockId": "interactive-003",
  "currentStep": 2,
  "completedSteps": [
    "step-1",
    "step-2"
  ],
  "workingCode": {
    "step-2": "..."
  }
}
```

If the learner returns later:

```text
Continue from Step 3
```

---

# 45. INT3 Analytics

Useful events:

```text id="e3r9kl"
guided_interactive_viewed
step_started
step_completed
step_failed
step_retry
step_reset
hint_requested
run_clicked
execution_success
execution_error
guided_interactive_completed
```

Metrics:

```text id="h7k2q3"
stepsCompleted
stepsFailed
hintsUsed
retries
timePerStep
timeToCompletion
```

---

# 46. INT3 Learning Analytics

Example:

```json id="9m2f6k"
{
  "guidedInteractiveAnalytics": {
    "totalSteps": 4,
    "completedSteps": 4,
    "retries": 2,
    "hintsUsed": 1,
    "runCount": 7,
    "timeToCompletionSeconds": 412
  }
}
```

This can reveal which step causes the most difficulty.

---

# 47. INT3 Completion

The default completion model should be:

```text id="f1x9gc"
All required steps completed
        ↓
INT3 COMPLETE
```

Example:

```text id="2c6q4z"
Step 1 ✓
Step 2 ✓
Step 3 ✓
Step 4 ✓

Guided Interactive Complete
```

---

# 48. INT3 Optional Completion Conditions

The author can configure:

```text id="2x0x4r"
all_steps
required_steps
final_goal
```

Example:

```json id="jj9t4a"
{
  "completion": {
    "mode": "all_required_steps"
  }
}
```

---

# 49. INT3 Scoring

INT3 should normally remain **learning-oriented rather than assessment-oriented**.

However, optional scoring can record:

```text id="9ih0p6"
Hints used
Retries
Steps completed
```

rather than assigning a traditional quiz score.

For example:

```text id="l4r7dy"
Completed with:
2 hints
1 retry
```

This is more educationally meaningful.

---

# 50. INT3 No Prediction Requirement

A guided step may tell the learner exactly what to change.

That is intentional.

For example:

> Change `b = a` to `b = a.copy()`.

INT4 will instead ask:

> What do you predict will happen if `b = a.copy()`?

Therefore:

```text id="4y6h01"
INT3
Guided action

INT4
Prediction before action
```

---

# 51. INT3 No Debugging Requirement

A guided step may accidentally produce an error, but the block should not require the learner to diagnose it unless debugging is the goal.

That distinction belongs to:

```text id="2ctjzk"
INT5 — Debug Interactive
```

---

# 52. INT3 No Full Playground

The learner should not be able to freely create an arbitrary project.

The author controls:

```text id="t8c0ry"
Steps
Code context
Learning objective
Expected progression
```

That keeps INT3 instructional.

---

# 53. INT3 Authoring Rules

A strong INT3 should:

```text id="6s4q7d"
✓ Have a clear learning objective
✓ Divide the concept into meaningful interactive steps
✓ Tell the learner what to do
✓ Require actual execution
✓ Allow observation after each step
✓ Preserve progression
✓ Provide useful feedback
✓ Support retry
✓ Avoid unnecessary complexity
```

Avoid:

```text id="f9d3b7"
❌ Unstructured free experimentation
❌ Asking the learner to solve the entire problem
❌ Turning every step into a quiz
❌ Hiding required information
❌ Excessive step count
❌ Making steps mechanically repetitive
```

---

# 54. INT3 Step Design Principle

Every step should answer:

> **Why does this step exist?**

For example:

```text id="j6t3wp"
Step 1
Establish baseline.

Step 2
Introduce mutation.

Step 3
Change reference relationship.

Step 4
Observe difference.
```

The sequence tells a conceptual story.

---

# 55. INT3 Good vs Bad Sequence

### Bad

```text id="j8k0ye"
Step 1: Run
Step 2: Run
Step 3: Run
Step 4: Run
```

There is no meaningful progression.

### Good

```text id="9w0v1c"
Step 1: Establish baseline
Step 2: Change one variable
Step 3: Observe shared effect
Step 4: Change reference strategy
Step 5: Observe independent behavior
```

The interaction builds understanding.

---

# 56. INT3 Step Count

There should not be an arbitrary maximum.

But a typical guided interaction should remain focused.

For example:

```text id="u7r4kp"
3–5 steps
```

is often enough for one concept.

A much larger sequence can be divided into multiple InteractiveBlocks.

---

# 57. INT3 Block Composition

A tutorial can use:

```text id="5w3j9q"
Explanation
 ↓
INT3 — Guided Interactive
 ↓
Summary
```

or:

```text id="x2v8cf"
Concept
 ↓
INT1
 ↓
Explanation
 ↓
INT3
 ↓
QuestionBlock
```

The block system remains composable.

---

# 58. INT3 Example — Complete Tutorial Segment

### Concept

> A Python list variable stores a reference to a list object.

### Explanation

> Assigning another variable to the list does not create a new list.

### INT3

```text id="xj5t4k"
Step 1
Run baseline.

Step 2
Mutate original list.

Step 3
Observe second variable.

Step 4
Replace reference assignment with copy.

Step 5
Observe independent behavior.
```

### Summary

> `b = a` shares the object; `b = a.copy()` creates a separate list.

This is an excellent use of INT3.

---

# 59. INT3 Final JSON Structure

```json id="x8f6bn"
{
  "type": "interactive",
  "version": "INT3",
  "presentation": "Guided Interactive Steps",

  "content": {
    "title": "",
    "objective": "",
    "introduction": ""
  },

  "steps": [],

  "navigation": {
    "sequential": true,
    "allowBack": true,
    "allowSkip": false
  },

  "editing": {
    "enabled": true,
    "mode": "full"
  },

  "execution": {
    "language": "",
    "runtime": "",
    "timeoutMs": 5000
  },

  "hints": {
    "enabled": true
  },

  "completion": {
    "mode": "all_required_steps"
  }
}
```

---

# 60. Complete INT3 JSON Example

```json id="u3e5c8"
{
  "type": "interactive",
  "version": "INT3",
  "presentation": "Guided Interactive Steps",

  "content": {
    "title": "Understand Shared List References",

    "objective": "Observe how two variables can reference the same mutable list and how copying changes that behavior.",

    "introduction": "Follow each step and run the code after making the requested change."
  },

  "steps": [
    {
      "id": "step-1",
      "title": "Establish the baseline",

      "instruction": "Run the code without changing it.",

      "code": "a = [1, 2, 3]\nb = a\n\nprint(a)\nprint(b)",

      "completion": {
        "type": "successfulRun"
      }
    },

    {
      "id": "step-2",
      "title": "Mutate the list",

      "instruction": "Add `a.append(4)` before the print statements and run the code.",

      "code": "a = [1, 2, 3]\nb = a\n\na.append(4)\n\nprint(a)\nprint(b)",

      "completion": {
        "type": "successfulRun"
      }
    },

    {
      "id": "step-3",
      "title": "Create an independent copy",

      "instruction": "Change `b = a` to `b = a.copy()` and run the code.",

      "code": "a = [1, 2, 3]\nb = a.copy()\n\na.append(4)\n\nprint(a)\nprint(b)",

      "completion": {
        "type": "successfulRun"
      }
    }
  ],

  "navigation": {
    "sequential": true,
    "allowBack": true,
    "allowSkip": false
  },

  "editing": {
    "enabled": true,
    "mode": "full"
  },

  "execution": {
    "language": "python",
    "runtime": "python3",
    "timeoutMs": 5000
  },

  "hints": {
    "enabled": true
  },

  "completion": {
    "mode": "all_required_steps"
  }
}
```

---

# 61. INT3 Final Architecture

```text id="f2c8yd"
                    INT3
          GUIDED INTERACTIVE STEPS
                       │
                       ▼
                  OBJECTIVE
                       │
                       ▼
                    STEP 1
                       │
              ┌────────┴────────┐
              ▼                 ▼
             EDIT              RUN
                                │
                                ▼
                            OBSERVE
                                │
                                ▼
                           COMPLETE?
                                │
                                ▼
                    ┌───────────────────┐
                    │      STEP 2       │
                    └───────────────────┘
                                │
                               ...
                                │
                                ▼
                    ┌───────────────────┐
                    │ FINAL STEP        │
                    └───────────────────┘
                                │
                                ▼
                         COMPLETE
```

---

# 62. INT3 Final Mental Model

```text id="6l2p4n"
                         INT3
              GUIDED INTERACTIVE STEPS
                         │
                         ▼
                     OBJECTIVE
                         │
                         ▼
                    STEP 1
                         │
                         ▼
                 INSTRUCTION
                         │
                         ▼
                       EDIT
                         │
                         ▼
                       RUN
                         │
                         ▼
                     OBSERVE
                         │
                         ▼
                    STEP COMPLETE
                         │
                         ▼
                    NEXT STEP
                         │
                         └──────→ EDIT → RUN → OBSERVE
                                     
                         ↓
                   FINAL STEP
                         ↓
                     COMPLETE
```

The defining principle is:

> **Guide the learner through a deliberate sequence of interactive experiments so that each action builds toward conceptual understanding.**

---

# 63. INT3 Final Technical Specification

| Area                          | INT3 Decision                    |
| ----------------------------- | -------------------------------- |
| **Block**                     | **InteractiveBlock**             |
| **Version**                   | **INT3**                         |
| **Presentation**              | **Guided Interactive Steps**     |
| **Primary purpose**           | Guided experiential learning     |
| **Starting code**             | Required                         |
| **Editing**                   | Required                         |
| **Guided steps**              | Core                             |
| **Sequential progression**    | Recommended/default              |
| **Run action**                | Required                         |
| **Observation**               | Core                             |
| **Step completion**           | Required                         |
| **Hints**                     | Supported                        |
| **Retry**                     | Supported                        |
| **Step reset**                | Supported                        |
| **Activity reset**            | Supported                        |
| **Prediction**                | ❌ Not required                   |
| **Debugging**                 | ❌ Not defining                   |
| **Full playground**           | ❌                                |
| **Expected output**           | Supported                        |
| **Goal conditions**           | Supported                        |
| **Explanation between steps** | Supported                        |
| **Scoring**                   | ❌ Normally                       |
| **Progress persistence**      | ✅                                |
| **Analytics**                 | Step-focused                     |
| **Sandboxing**                | Required for untrusted execution |
| **Timeout**                   | Required                         |
| **Resource limits**           | Recommended                      |
| **Theme**                     | Light                            |
| **Primary**                   | **#F54A8D**                      |
| **Secondary**                 | **#0B1B3D**                      |
| **Gradient**                  | ❌                                |
| **Dark theme**                | ❌                                |
| **Responsive**                | ✅                                |
| **Accessible**                | ✅                                |
| **JSON-driven**               | ✅                                |

---

# 64. InteractiveBlock Progress

We now have:

```text id="4w5s0r"
INT1 — Code → Run → Output
        ↓
INT2 — Edit → Run → Observe
        ↓
INT3 — Guided Interactive Steps
        ↓
INT4 — Predict → Run → Compare
        ↓
INT5 — Debug Interactive
        ↓
INT6 — Full Playground
```

The conceptual progression is now:

```text id="m0y7qx"
INT1
OBSERVE
   ↓
INT2
EXPERIMENT
   ↓
INT3
GUIDED DISCOVERY
   ↓
INT4
PREDICT + VERIFY
   ↓
INT5
DEBUG
   ↓
INT6
EXPLORE FREELY
```

## **INT3 — Guided Interactive Steps: COMPLETE** ✅

The next version is:

> **INT4 — Predict → Run → Compare**

where the learner must first form a prediction, then execute the code, and finally compare their prediction with the actual runtime result.



```python

```

# BLOCK 15 — InteractiveBlock

## INT4 — Predict → Run → Compare

Yes. We continue with **only INT4**, one version at a time.

The committed InteractiveBlock sequence remains:

| Version  | Presentation                | Status         |
| -------- | --------------------------- | -------------- |
| INT1     | Code → Run → Output         | ✅ Complete     |
| INT2     | Edit → Run → Observe        | ✅ Complete     |
| INT3     | Guided Interactive Steps    | ✅ Complete     |
| **INT4** | **Predict → Run → Compare** | 🔵 **CURRENT** |
| INT5     | Debug Interactive           | ⏳              |
| INT6     | Full Playground             | ⏳              |

---

# 1. What Is INT4 — Predict → Run → Compare?

**INT4 — Predict → Run → Compare** introduces a critical learning activity:

> **The learner must form a prediction before executing the code, then run the code and compare the prediction with the actual runtime behavior.**

The core model is:

```text id="8c9p4x"
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

This is fundamentally different from INT3.

INT3 tells the learner what to do.

INT4 asks the learner:

> **What do you think will happen?**

before allowing the runtime result to be revealed.

---

# 2. Position of INT4

```text id="8c9p4x"
INT1
Code → Run → Output
        ↓
INT2
Edit → Run → Observe
        ↓
INT3
Guided Interactive Steps
        ↓
INT4
Predict → Run → Compare
        ↓
INT5
Debug Interactive
        ↓
INT6
Full Playground
```

The learning progression is:

```text id="8c9p4x"
INT1
OBSERVE
   ↓
INT2
EXPERIMENT
   ↓
INT3
FOLLOW GUIDED DISCOVERY
   ↓
INT4
PREDICT + VERIFY
   ↓
INT5
DEBUG
   ↓
INT6
EXPLORE FREELY
```

---

# 3. INT3 → INT4

This distinction must remain very clear.

### INT3

The learner receives:

> Change `b = a` to `b = a.copy()` and run the code.

The learner performs the instructed action.

```text id="8c9p4x"
INSTRUCTION
     ↓
EDIT
     ↓
RUN
     ↓
OBSERVE
```

### INT4

The learner receives:

> What do you predict will happen if `b = a.copy()`?

The learner commits to a prediction **before execution**.

```text id="8c9p4x"
PREDICT
     ↓
RUN
     ↓
OBSERVE
     ↓
COMPARE
```

Therefore:

> **INT3 = guided action.**

> **INT4 = prediction and verification.**

---

# 4. INT4 Core Learning Objective

INT4 develops the learner's ability to reason about code **before execution**.

The learner must mentally simulate:

```text id="8c9p4x"
SOURCE CODE
     ↓
MENTAL MODEL
     ↓
PREDICTION
     ↓
ACTUAL EXECUTION
     ↓
COMPARISON
```

This is extremely valuable for programming education.

It teaches the learner not to depend entirely on trial-and-error execution.

---

# 5. Why Prediction Matters

A learner may read:

```python id="8c9p4x"
numbers = [1, 2, 3]
backup = numbers

numbers.append(4)

print(backup)
```

and immediately click:

```text id="8c9p4x"
[ Run ]
```

They see:

```text id="8c9p4x"
[1, 2, 3, 4]
```

But INT4 asks them to stop first.

> **What do you predict the output will be?**

Now the learner must reason about the reference relationship.

That makes the runtime result meaningful.

---

# 6. INT4 Is Not a Normal QuestionBlock

This distinction is important.

A QuestionBlock could ask:

> What will this code output?

The learner answers and the block may evaluate the answer.

INT4 goes further:

```text id="8c9p4x"
Prediction
    ↓
Actual execution
    ↓
Actual runtime result
    ↓
Comparison
```

The learner gets **empirical verification**.

Therefore:

> **QuestionBlock tests reasoning. INT4 develops reasoning through prediction and runtime verification.**

---

# 7. INT4 Is Not Just "Predict the Output"

A weak implementation would be:

```text id="8c9p4x"
What is the output?
[ Submit ]
```

That is essentially a QuestionBlock.

INT4 requires:

```text id="8c9p4x"
Prediction
+
Executable Code
+
Actual Run
+
Comparison
```

The runtime is an essential part of the experience.

---

# 8. INT4 Core Loop

```text id="8c9p4x"
┌─────────────┐
│    CODE     │
└──────┬──────┘
       ↓
┌─────────────┐
│  PREDICT    │
└──────┬──────┘
       ↓
┌─────────────┐
│    RUN      │
└──────┬──────┘
       ↓
┌─────────────┐
│ ACTUAL      │
│ RESULT      │
└──────┬──────┘
       ↓
┌─────────────┐
│   COMPARE   │
└──────┬──────┘
       ↓
┌─────────────┐
│ UNDERSTAND  │
└─────────────┘
```

---

# 9. INT4 Basic UI

```text id="8c9p4x"
┌───────────────────────────────────────────────┐
│ PREDICT → RUN → COMPARE                      │
│                                               │
│ What will this code print?                   │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                     │ │
│ │ backup = numbers                         │ │
│ │                                         │ │
│ │ numbers.append(4)                       │ │
│ │                                         │ │
│ │ print(backup)                           │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ YOUR PREDICTION                               │
│ ┌───────────────────────────────────────────┐ │
│ │ [1, 2, 3]                                │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [ Predict & Run ]                             │
└───────────────────────────────────────────────┘
```

The actual output remains hidden until the learner commits the prediction.

---

# 10. Prediction Lock

This is one of the defining rules of INT4.

Before the learner submits a prediction:

```text id="8c9p4x"
ACTUAL OUTPUT
─────────────
Hidden
```

After prediction submission:

```text id="8c9p4x"
Prediction
──────────
[1, 2, 3]

Actual Output
─────────────
[1, 2, 3, 4]
```

This prevents the learner from seeing the answer before thinking.

---

# 11. INT4 Prediction Types

INT4 does not have to be limited to raw output text.

Possible prediction types include:

### Output prediction

> What will be printed?

### Boolean prediction

> Will `a is b` be `True` or `False`?

### State prediction

> Will the list be modified?

### Exception prediction

> Will this code raise an exception?

### Value prediction

> What will `result` contain?

### Behavior prediction

> Which branch will execute?

### Ordering prediction

> In what order will these statements execute?

---

# 12. INT4 Example — Output Prediction

```python id="8c9p4x"
x = 10
y = 20

print(x + y)
```

Prediction:

```text id="8c9p4x"
30
```

Run.

Actual:

```text id="8c9p4x"
30
```

Comparison:

```text id="8c9p4x"
✓ Prediction matched
```

---

# 13. INT4 Example — Reference Model

```python id="8c9p4x"
a = [1, 2, 3]
b = a

a.append(4)

print(b)
```

Prediction options:

```text id="8c9p4x"
○ [1, 2, 3]
○ [1, 2, 3, 4]
○ Error
○ None
```

Learner selects:

```text id="8c9p4x"
[1, 2, 3]
```

Then runs.

Actual:

```text id="8c9p4x"
[1, 2, 3, 4]
```

The learner sees:

```text id="8c9p4x"
✕ Prediction did not match
```

Then explanation:

> `b` references the same list object as `a`, so the mutation is visible through `b`.

This is an excellent INT4 learning moment.

---

# 14. INT4 Example — Exception Prediction

```python id="8c9p4x"
numbers = [1, 2, 3]

print(numbers[5])
```

Prediction:

```text id="8c9p4x"
○ Prints 5
○ Prints None
○ Raises IndexError
○ Raises ValueError
```

Learner predicts:

```text id="8c9p4x"
Raises IndexError
```

Run.

Actual:

```text id="8c9p4x"
IndexError: list index out of range
```

Comparison:

```text id="8c9p4x"
✓ Prediction matched
```

---

# 15. INT4 Example — Boolean Prediction

```python id="8c9p4x"
a = [1, 2]
b = a

print(a is b)
```

Prediction:

```text id="8c9p4x"
○ True
○ False
```

Actual:

```text id="8c9p4x"
True
```

This is excellent for teaching object identity.

---

# 16. INT4 Example — Copy vs Reference

```python id="8c9p4x"
a = [1, 2, 3]
b = a.copy()

a.append(4)

print(b)
```

Prediction:

```text id="8c9p4x"
○ [1, 2, 3]
○ [1, 2, 3, 4]
○ Error
```

Actual:

```text id="8c9p4x"
[1, 2, 3]
```

The learner verifies the behavior.

---

# 17. INT4 Example — Conditional Logic

```python id="8c9p4x"
x = 10

if x > 10:
    print("A")
else:
    print("B")
```

Prediction:

```text id="8c9p4x"
○ A
○ B
```

Actual:

```text id="8c9p4x"
B
```

This teaches boundary reasoning.

---

# 18. INT4 Example — Loop

```python id="8c9p4x"
for i in range(3):
    print(i)
```

Prediction:

```text id="8c9p4x"
○ 0 1 2
○ 1 2 3
○ 0 1 2 3
○ Error
```

Actual:

```text id="8c9p4x"
0
1
2
```

---

# 19. INT4 Example — Function Return

```python id="8c9p4x"
def calculate(x):
    return x * 2

value = calculate(5)

print(value)
```

Prediction:

```text id="8c9p4x"
10
```

Actual:

```text id="8c9p4x"
10
```

The learner confirms their mental execution.

---

# 20. INT4 Prediction Input Modes

The author can choose:

### Text

```text id="8c9p4x"
Your prediction:
[________________]
```

### Multiple choice

```text id="8c9p4x"
○ A
○ B
○ C
○ D
```

### Boolean

```text id="8c9p4x"
○ True
○ False
```

### Structured output

```text id="8c9p4x"
Expected output:
[________________]
```

### Exception type

```text id="8c9p4x"
○ No error
○ ValueError
○ TypeError
○ IndexError
```

The presentation remains INT4 regardless of prediction input type.

---

# 21. INT4 Prediction Must Happen Before Run

The system should enforce:

```text id="8c9p4x"
Prediction not submitted
        ↓
Run disabled
```

After prediction:

```text id="8c9p4x"
Prediction submitted
        ↓
Run enabled
```

This preserves the pedagogical purpose.

---

# 22. INT4 Optional Code Editing

This requires an important design decision.

INT4 can support **controlled editing**, but editing should normally occur **before the prediction** if the learner is expected to reason about modified code.

The simplest default is:

```text id="8c9p4x"
Code
 ↓
Predict
 ↓
Run
 ↓
Compare
```

If the learner changes the code after making the prediction, the prediction becomes invalid.

Therefore, after prediction submission:

```text id="8c9p4x"
Code
→ Locked
```

until the run is complete.

---

# 23. INT4 Editing Mode

An optional advanced mode can allow:

```text id="8c9p4x"
Edit
 ↓
Lock Prediction
 ↓
Run
```

But the learner should not be able to silently change the code after submitting the prediction.

---

# 24. INT4 Code Snapshot

When prediction is submitted, the system should capture the code state:

```json id="8c9p4x"
{
  "prediction": "...",
  "codeSnapshot": "x = 10\nprint(x)",
  "submittedAt": "..."
}
```

The actual run should use that snapshot.

This ensures:

> The prediction is compared against the exact code the learner predicted about.

---

# 25. INT4 Compare Model

After execution:

```text id="8c9p4x"
YOUR PREDICTION
───────────────
[1, 2, 3]

ACTUAL RESULT
─────────────
[1, 2, 3, 4]

RESULT
──────
✕ Prediction did not match
```

Then:

```text id="8c9p4x"
WHY?
────
`backup` references the same list object as `numbers`.
```

---

# 26. INT4 Comparison States

Possible states:

```text id="8c9p4x"
match
partial_match
mismatch
invalid_prediction
execution_error
timeout
```

For a simple exact prediction:

```text id="8c9p4x"
✓ Match
```

or:

```text id="8c9p4x"
✕ Mismatch
```

---

# 27. INT4 Partial Match

For structured outputs, partial correctness may be useful.

Example:

Expected:

```text id="8c9p4x"
[1, 2, 3, 4]
```

Prediction:

```text id="8c9p4x"
[1, 2, 3]
```

The system can optionally say:

> Your prediction was partially correct, but it missed the final mutation.

However, exact matching should remain the default unless the author defines another comparison strategy.

---

# 28. INT4 Explanation After Comparison

The most educational part comes **after** the comparison.

Example:

```text id="8c9p4x"
Your prediction:
[1, 2, 3]

Actual:
[1, 2, 3, 4]

Why?

`a` and `b` reference the same list object.
Calling `a.append(4)` mutates that object.
Therefore `b` also observes the change.
```

This creates:

```text id="8c9p4x"
Prediction
 ↓
Evidence
 ↓
Explanation
```

---

# 29. INT4 Wrong Prediction Is Valuable

A mismatch should not simply say:

```text id="8c9p4x"
Wrong.
```

Instead:

```text id="8c9p4x"
Your prediction did not match the runtime result.

Compare the two results and examine the explanation below.
```

The purpose is learning, not punishment.

---

# 30. INT4 Prediction Confidence

An optional advanced feature can ask:

> How confident are you?

```text id="8c9p4x"
○ Low
○ Medium
○ High
```

This can help identify:

```text id="8c9p4x"
High confidence + wrong
```

as a particularly important misconception.

This should be optional.

---

# 31. INT4 Reflection

After comparison, an optional prompt can ask:

> What caused the difference?

This begins to move toward reasoning.

Possible answer:

```text id="8c9p4x"
Because both variables reference the same list.
```

However, this is optional because QuestionBlock already owns open-ended questioning.

---

# 32. INT4 vs QuestionBlock — Final Boundary

```text id="8c9p4x"
QUESTIONBLOCK
──────────────
Question
 ↓
Answer
 ↓
Evaluate

INT4
────
Code
 ↓
Prediction
 ↓
Run
 ↓
Actual Runtime Result
 ↓
Compare
 ↓
Understand
```

The runtime execution is what makes INT4 distinct.

---

# 33. INT4 vs ExerciseBlock

ExerciseBlock might say:

> Predict the output and submit your answer.

INT4 says:

> Predict the output, then actually run the program and compare your reasoning with reality.

Therefore INT4 provides **empirical feedback**.

---

# 34. INT4 vs INT2

INT2:

```text id="8c9p4x"
Edit
 ↓
Run
 ↓
Observe
```

INT4:

```text id="8c9p4x"
Predict
 ↓
Run
 ↓
Compare
```

The learner's mental model becomes an explicit part of the interaction.

---

# 35. INT4 vs INT3

INT3:

```text id="8c9p4x"
"Change X and run."
```

INT4:

```text id="8c9p4x"
"What do you think will happen?"
```

The learner must reason independently before seeing the result.

---

# 36. INT4 vs INT5

INT4:

> Predict normal runtime behavior.

INT5:

> Investigate unexpected or intentionally broken runtime behavior.

So:

```text id="8c9p4x"
INT4
Prediction

INT5
Diagnosis
```

---

# 37. INT4 Basic UI

```text id="8c9p4x"
┌────────────────────────────────────────────────┐
│ PREDICT → RUN → COMPARE                       │
├────────────────────────────────────────────────┤
│                                                │
│ What will this code print?                    │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ a = [1, 2, 3]                             │ │
│ │ b = a                                     │ │
│ │                                            │ │
│ │ a.append(4)                               │ │
│ │                                            │ │
│ │ print(b)                                  │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ YOUR PREDICTION                                │
│                                                │
│ ○ [1, 2, 3]                                    │
│ ○ [1, 2, 3, 4]                                 │
│ ○ None                                          │
│ ○ Error                                         │
│                                                │
│ [ Submit Prediction ]                          │
└────────────────────────────────────────────────┘
```

After submission:

```text id="8c9p4x"
Prediction submitted ✓

[ ▶ Run ]
```

---

# 38. INT4 After Execution

```text id="8c9p4x"
┌────────────────────────────────────────────────┐
│ YOUR PREDICTION                                │
│ [1, 2, 3]                                      │
│                                                │
│ ACTUAL RESULT                                  │
│ [1, 2, 3, 4]                                   │
│                                                │
│ ✕ Prediction did not match                     │
│                                                │
│ WHY?                                           │
│ `a` and `b` reference the same list object.    │
│                                                │
│ [ Continue → ]                                 │
└────────────────────────────────────────────────┘
```

This is the core INT4 experience.

---

# 39. INT4 Step States

Conceptually:

```text id="8c9p4x"
READY
  ↓
PREDICTION_REQUIRED
  ↓
PREDICTION_SUBMITTED
  ↓
READY_TO_RUN
  ↓
RUNNING
  ↓
RESULT_AVAILABLE
  ↓
COMPARING
  ↓
COMPLETE
```

If execution fails:

```text id="8c9p4x"
RUNNING
  ↓
EXECUTION_ERROR
  ↓
RESULT_AVAILABLE
```

The learner can inspect the error and retry according to the author configuration.

---

# 40. INT4 Prediction State

The prediction should be immutable after submission.

```text id="8c9p4x"
Before submission:
[ Edit ]

After submission:
[ Locked ]
```

This protects the integrity of the comparison.

---

# 41. INT4 Retry

If the learner predicts incorrectly:

```text id="8c9p4x"
Prediction:
Wrong

Actual:
Correct

[ Try Again ]
```

There are two possible models.

### Model A — Educational retry

Allow another prediction after seeing the explanation.

### Model B — One-shot prediction

Record the first prediction permanently.

The default should generally be **educational retry**, while analytics can preserve the original attempt.

---

# 42. INT4 Attempt History

The system can record:

```json id="8c9p4x"
{
  "attempts": [
    {
      "prediction": "[1, 2, 3]",
      "actual": "[1, 2, 3, 4]",
      "matched": false
    },
    {
      "prediction": "[1, 2, 3, 4]",
      "actual": "[1, 2, 3, 4]",
      "matched": true
    }
  ]
}
```

This gives excellent learning analytics.

---

# 43. INT4 Analytics

Useful events:

```text id="8c9p4x"
predict_viewed
prediction_started
prediction_submitted
prediction_correct
prediction_incorrect
run_clicked
execution_success
execution_error
comparison_viewed
explanation_viewed
retry_clicked
int4_completed
```

Metrics:

```text id="8c9p4x"
firstPredictionAccuracy
attemptCount
timeToPrediction
timeToRun
predictionChanges
confidence
```

---

# 44. INT4 Misconception Analytics

INT4 is particularly valuable for identifying misconceptions.

Example:

```text id="8c9p4x"
Concept:
Object references

Prediction accuracy:
42%

Common wrong prediction:
Expected independent copy
```

This can tell the instructor:

> Learners are misunderstanding reference semantics.

That is much more useful than simply knowing whether a quiz answer was wrong.

---

# 45. INT4 Completion

The default completion condition can be:

```text id="8c9p4x"
Prediction submitted
+
Code executed
+
Comparison displayed
```

It does **not** necessarily require a correct prediction.

Why?

Because a wrong prediction can be an excellent learning experience.

Therefore:

```text id="8c9p4x"
Wrong prediction
   ↓
Runtime evidence
   ↓
Explanation
   ↓
Learning
```

can still count as completion.

---

# 46. INT4 Optional Mastery Condition

An author can optionally require:

```text id="8c9p4x"
Correct prediction
```

for mastery.

Example:

```json id="8c9p4x"
{
  "completion": {
    "mode": "correct_prediction"
  }
}
```

But this should be optional.

---

# 47. INT4 Scoring

INT4 normally should not become a quiz.

Instead, the platform can record:

```text id="8c9p4x"
Prediction accuracy:
3 / 5
```

as an analytics metric.

If the author explicitly wants assessment behavior, scoring can be enabled.

---

# 48. INT4 Multiple Predictions

A tutorial can contain multiple INT4 blocks:

```text id="8c9p4x"
INT4 — Variables
INT4 — References
INT4 — Mutation
INT4 — Copying
```

Each should focus on one meaningful reasoning challenge.

---

# 49. INT4 Multiple-Step Prediction

A single INT4 can also have multiple prediction points:

```text id="8c9p4x"
Code
 ↓
Prediction 1
 ↓
Run
 ↓
Compare
 ↓
Modify
 ↓
Prediction 2
 ↓
Run
 ↓
Compare
```

However, if the sequence becomes extensive and highly guided, it may be better represented as:

> **INT3 — Guided Interactive Steps**

Therefore, INT4 should remain focused.

---

# 50. INT4 Prediction Before Execution

A strong UX should make this visually obvious:

```text id="8c9p4x"
STEP 1
What do you think will happen?

        ↓

STEP 2
Submit your prediction.

        ↓

STEP 3
Run the code.

        ↓

STEP 4
Compare.
```

This prevents the learner from accidentally seeing the answer first.

---

# 51. INT4 Authoring Model

The author defines:

```text id="8c9p4x"
Code
+
Prediction question
+
Prediction format
+
Runtime
+
Comparison method
+
Explanation
```

The learner performs:

```text id="8c9p4x"
Predict
 ↓
Run
 ↓
Compare
```

---

# 52. INT4 JSON Structure

```json id="8c9p4x"
{
  "type": "interactive",
  "version": "INT4",
  "presentation": "Predict → Run → Compare",

  "content": {
    "title": "",
    "instruction": "",
    "code": ""
  },

  "prediction": {
    "type": "",
    "question": "",
    "options": []
  },

  "execution": {
    "language": "",
    "runtime": "",
    "timeoutMs": 5000
  },

  "comparison": {
    "type": "",
    "expected": "",
    "showActual": true
  },

  "explanation": {
    "onCorrect": "",
    "onIncorrect": ""
  },

  "retry": {
    "enabled": true
  }
}
```

---

# 53. Complete INT4 JSON Example

```json id="8c9p4x"
{
  "type": "interactive",
  "version": "INT4",
  "presentation": "Predict → Run → Compare",

  "content": {
    "title": "Predict List Reference Behavior",

    "instruction": "Predict what will be printed before running the code.",

    "code": "numbers = [1, 2, 3]\nbackup = numbers\n\nnumbers.append(4)\n\nprint(backup)"
  },

  "prediction": {
    "type": "singleChoice",

    "question": "What will the program print?",

    "options": [
      "[1, 2, 3]",
      "[1, 2, 3, 4]",
      "None",
      "An error"
    ]
  },

  "execution": {
    "language": "python",
    "runtime": "python3",
    "timeoutMs": 5000
  },

  "comparison": {
    "type": "stdout",
    "expected": "[1, 2, 3, 4]",
    "showActual": true
  },

  "explanation": {
    "onCorrect": "Correct. `backup` refers to the same list object as `numbers`, so the mutation is visible through both variables.",

    "onIncorrect": "The prediction did not match the runtime result. `backup` refers to the same list object as `numbers`, so appending through `numbers` changes the object observed by `backup`."
  },

  "retry": {
    "enabled": true
  }
}
```

---

# 54. INT4 Text Prediction Example

```json id="8c9p4x"
{
  "prediction": {
    "type": "text",
    "question": "What will this program print?",
    "placeholder": "Enter your predicted output..."
  }
}
```

The system can normalize whitespace before comparison if configured.

---

# 55. INT4 Boolean Prediction Example

```json id="8c9p4x"
{
  "prediction": {
    "type": "boolean",
    "question": "Will `a is b` evaluate to True?",
    "options": [
      true,
      false
    ]
  }
}
```

This is useful for object identity.

---

# 56. INT4 Exception Prediction Example

```json id="8c9p4x"
{
  "prediction": {
    "type": "singleChoice",
    "question": "What will happen when this code runs?",

    "options": [
      "It prints 10",
      "It raises ValueError",
      "It raises TypeError",
      "It completes without output"
    ]
  },

  "comparison": {
    "type": "exceptionType",
    "expected": "ValueError"
  }
}
```

---

# 57. INT4 Output Comparison

The execution service should return normalized output.

Example:

```json id="8c9p4x"
{
  "status": "success",
  "stdout": "[1, 2, 3, 4]\n",
  "stderr": ""
}
```

The comparison layer then determines:

```text id="8c9p4x"
prediction == actual
```

according to the configured comparison strategy.

---

# 58. INT4 Comparison Strategies

Possible:

```text id="8c9p4x"
exact
trimmed
normalizedWhitespace
caseInsensitive
numeric
boolean
exceptionType
structured
```

The author chooses the appropriate comparison.

---

# 59. INT4 Security

INT4 has the same execution security requirements as INT1–INT3.

```text id="8c9p4x"
Browser
  ↓
Execution API
  ↓
Sandbox
  ├── CPU limit
  ├── Memory limit
  ├── Timeout
  ├── Output limit
  ├── Network policy
  └── Filesystem isolation
```

The learner's prediction does not change the security model.

---

# 60. INT4 Persistence

The platform can persist:

```json id="8c9p4x"
{
  "prediction": "[1, 2, 3]",
  "codeSnapshot": "...",
  "actualOutput": "[1, 2, 3, 4]",
  "matched": false,
  "attempt": 1
}
```

This enables learners to return to the activity without losing their state.

---

# 61. INT4 Progress

A simple state representation:

```json id="8c9p4x"
{
  "status": "completed",
  "predictionSubmitted": true,
  "executed": true,
  "comparisonViewed": true
}
```

Optional mastery:

```json id="8c9p4x"
{
  "mastery": "correct"
}
```

---

# 62. INT4 UI — Full Experience

```text id="8c9p4x"
┌──────────────────────────────────────────────────┐
│ PREDICT → RUN → COMPARE                         │
│                                                  │
│ Predict List Reference Behavior                 │
│                                                  │
│ STEP 1 — PREDICT                                │
│                                                  │
│ What will this code print?                      │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                         │ │
│ │ backup = numbers                             │ │
│ │                                              │ │
│ │ numbers.append(4)                            │ │
│ │                                              │ │
│ │ print(backup)                                │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ○ [1, 2, 3]                                     │
│ ● [1, 2, 3, 4]                                  │
│ ○ None                                           │
│ ○ Error                                          │
│                                                  │
│ [ Submit Prediction ]                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

After prediction:

```text id="8c9p4x"
┌──────────────────────────────────────────────────┐
│ ✓ Prediction submitted                           │
│                                                  │
│ YOUR PREDICTION                                 │
│ [1, 2, 3, 4]                                    │
│                                                  │
│ [ ▶ Run Code ]                                  │
└──────────────────────────────────────────────────┘
```

After execution:

```text id="8c9p4x"
┌──────────────────────────────────────────────────┐
│ YOUR PREDICTION                                 │
│ [1, 2, 3, 4]                                    │
│                                                  │
│ ACTUAL RESULT                                   │
│ [1, 2, 3, 4]                                    │
│                                                  │
│ ✓ Prediction matched                            │
│                                                  │
│ WHY?                                            │
│ `backup` and `numbers` reference the same       │
│ list object.                                    │
│                                                  │
│ [ Continue → ]                                  │
└──────────────────────────────────────────────────┘
```

---

# 63. INT4 Light UI Design

For the established Tutorial Engine visual system:

```text id="8c9p4x"
Primary:   #F54A8D
Secondary: #0B1B3D
```

Use:

* light background
* clean white cards
* dark blue text
* pink primary actions
* clear prediction controls
* clear code/output separation
* soft shadows
* no dark theme
* no gradients

The UI should emphasize the **three-stage mental workflow**:

```text id="8c9p4x"
PREDICT
   →
RUN
   →
COMPARE
```

---

# 64. INT4 Authoring Rules

A strong INT4 should:

```text id="8c9p4x"
✓ Require a meaningful prediction
✓ Hide actual output until prediction is committed
✓ Execute the exact predicted code state
✓ Show actual runtime behavior
✓ Compare prediction with reality
✓ Explain important mismatches
✓ Allow retry where appropriate
✓ Focus on one reasoning concept
```

Avoid:

```text id="8c9p4x"
❌ Showing output before prediction
❌ Turning it into a simple multiple-choice question
❌ Requiring debugging
❌ Combining too many predictions
❌ Making prediction arbitrary
❌ Penalizing reasonable wrong predictions excessively
```

---

# 65. INT4 Best Learning Pattern

The strongest INT4 experience is:

```text id="8c9p4x"
READ CODE
   ↓
BUILD MENTAL MODEL
   ↓
MAKE PREDICTION
   ↓
COMMIT
   ↓
RUN
   ↓
SEE REALITY
   ↓
COMPARE
   ↓
RECONCILE MENTAL MODEL
```

That final step is extremely important.

The learner should ask:

> **Why was my prediction different from what the computer actually did?**

That is where deeper understanding develops.

---

# 66. INT4 Example — Python Memory Model

This is an especially strong application of INT4.

```python id="8c9p4x"
a = [10, 20]
b = a

print(a is b)
```

Prediction:

```text id="8c9p4x"
○ True
○ False
```

Actual:

```text id="8c9p4x"
True
```

Explanation:

> Both variables reference the same list object.

Then another INT4 can show:

```python id="8c9p4x"
a = [10, 20]
b = a.copy()

print(a is b)
```

Prediction:

```text id="8c9p4x"
○ True
○ False
```

Actual:

```text id="8c9p4x"
False
```

Now the learner has experimentally compared:

```text id="8c9p4x"
Reference
vs
Copy
```

---

# 67. INT4 Example — Exception Propagation

Given:

```python id="8c9p4x"
def inner():
    raise ValueError("bad value")

def outer():
    inner()

outer()
```

Prediction:

> What happens when this code runs?

Options:

```text id="8c9p4x"
○ Program completes normally
○ ValueError propagates
○ TypeError occurs
○ Nothing happens
```

Actual:

```text id="8c9p4x"
ValueError
```

The learner can then be introduced to exception propagation.

This is an excellent use of INT4 in the Exception Handling Masterclass.

---

# 68. INT4 Example — Mutable Default Arguments

```python id="8c9p4x"
def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item(1))
print(add_item(2))
```

Prediction:

```text id="8c9p4x"
○ [1] and [2]
○ [1] and [1, 2]
○ Error
○ [2] and [1]
```

Actual:

```text id="8c9p4x"
[1]
[1, 2]
```

This is a powerful INT4 because the result often conflicts with beginners' intuition.

---

# 69. INT4 Example — Scope

```python id="8c9p4x"
x = 10

def test():
    x = 20
    print(x)

test()
print(x)
```

Prediction:

```text id="8c9p4x"
○ 10 then 10
○ 20 then 10
○ 10 then 20
○ 20 then 20
```

Actual:

```text id="8c9p4x"
20
10
```

The learner sees local versus global binding through runtime evidence.

---

# 70. INT4 Example — Evaluation Order

```python id="8c9p4x"
def first():
    print("first")
    return 1

def second():
    print("second")
    return 2

print(first() + second())
```

Prediction:

```text id="8c9p4x"
○ first → second → 3
○ second → first → 3
○ 3 only
○ Error
```

Actual:

```text id="8c9p4x"
first
second
3
```

This is useful for execution-order reasoning.

---

# 71. INT4 Mastery Signal

INT4 can provide a much richer learning signal than simple correctness.

For example:

```text id="8c9p4x"
Concept:
List references

Prediction accuracy:
4 / 5

Initial prediction:
Wrong

After explanation:
Correct

Confidence:
High
```

This can indicate a misconception that should be revisited.

---

# 72. INT4 Final Technical Specification

| Area                        | INT4 Decision                               |
| --------------------------- | ------------------------------------------- |
| **Block**                   | **InteractiveBlock**                        |
| **Version**                 | **INT4**                                    |
| **Presentation**            | **Predict → Run → Compare**                 |
| **Primary purpose**         | Predictive reasoning + runtime verification |
| **Code**                    | Required                                    |
| **Prediction**              | Required                                    |
| **Prediction before run**   | Required                                    |
| **Prediction types**        | Text / Choice / Boolean / Structured        |
| **Code snapshot**           | Required                                    |
| **Run**                     | Required                                    |
| **Actual output**           | Hidden until prediction                     |
| **Comparison**              | Required                                    |
| **Explanation**             | Recommended                                 |
| **Retry**                   | Supported                                   |
| **Prediction history**      | Supported                                   |
| **Editing**                 | Optional / controlled                       |
| **Debugging**               | ❌                                           |
| **Guided steps**            | ❌ Not defining                              |
| **Full playground**         | ❌                                           |
| **Scoring**                 | ❌ Normally                                  |
| **Mastery condition**       | Optional                                    |
| **Completion**              | Prediction + execution + comparison         |
| **Analytics**               | Prediction-focused                          |
| **Misconception analytics** | Supported                                   |
| **Persistence**             | Supported                                   |
| **Sandboxing**              | Required for untrusted execution            |
| **Timeout**                 | Required                                    |
| **Resource limits**         | Recommended                                 |
| **Theme**                   | Light                                       |
| **Primary**                 | **#F54A8D**                                 |
| **Secondary**               | **#0B1B3D**                                 |
| **Gradient**                | ❌                                           |
| **Dark theme**              | ❌                                           |
| **Responsive**              | ✅                                           |
| **Accessible**              | ✅                                           |
| **JSON-driven**             | ✅                                           |

---

# 73. InteractiveBlock Progress

We now have:

```text id="8c9p4x"
INT1 — Code → Run → Output
        ↓
INT2 — Edit → Run → Observe
        ↓
INT3 — Guided Interactive Steps
        ↓
INT4 — Predict → Run → Compare
        ↓
INT5 — Debug Interactive
        ↓
INT6 — Full Playground
```

The learning progression is:

```text id="8c9p4x"
OBSERVE
   ↓
EXPERIMENT
   ↓
GUIDED DISCOVERY
   ↓
PREDICT + VERIFY
   ↓
DEBUG
   ↓
EXPLORE
```

## **INT4 — Predict → Run → Compare: COMPLETE** ✅

The next version is:

> **INT5 — Debug Interactive**

where the learner will receive **intentionally broken code**, investigate the runtime behavior, identify the underlying problem, modify the code, rerun it, and verify that the bug has actually been resolved.



```python

```
