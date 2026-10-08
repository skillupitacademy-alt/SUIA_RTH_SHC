# FILE 15 — `InteractiveBlock.md` — REVIEW COMPLETE

I located the actual source:

- **File:** `InteractiveBlock.md`
- **Size:** 133,527 bytes
- **Lines:** 7,906
- **Library file ID:** `libfile_a6374136d3cc81919931f12ac976ce7c`

I reviewed the actual file rather than relying on the older architecture/version documents.

There is one **important correction** compared with the earlier historical register: this actual file does **not** fully define INT1–INT6. It fully defines **INT1–INT4** and declares INT5–INT6 as the next intended stages. That distinction matters.

---

# 1. Authoritative version status from the actual file

The file establishes this InteractiveBlock hierarchy:

| Version | Presentation | Status in actual file |
|---|---|---|
| **INT1** | **Code → Run → Output** | ✅ Fully specified |
| **INT2** | **Edit → Run → Observe** | ✅ Fully specified |
| **INT3** | **Guided Interactive Steps** | ✅ Fully specified |
| **INT4** | **Predict → Run → Compare** | ✅ Fully specified |
| **INT5** | **Debug Interactive** | ⚠️ Declared/intended, not fully specified |
| **INT6** | **Full Playground** | ⚠️ Declared/intended, not fully specified |

The file's opening sequence explicitly lists all six, but the detailed source proceeds through INT4. The final lines of the file say:

> INT4 — Predict → Run → Compare: COMPLETE

and then identify **INT5 — Debug Interactive** as the next version. 

So for the corpus register I would record:

```text
InteractiveBlock
    INT1 — VERIFIED REFERENCE
    INT2 — VERIFIED REFERENCE
    INT3 — VERIFIED REFERENCE
    INT4 — VERIFIED REFERENCE
    INT5 — DECLARED / NOT FULLY SPECIFIED
    INT6 — DECLARED / NOT FULLY SPECIFIED
```

**Do not mark INT5 or INT6 as fully defined based on this file.**

---

# 2. The core semantic progression

This family has a very clear learning progression:

```text
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
EXPLORE
```

The presentation sequence is:

```text
CODE → RUN → OUTPUT
        ↓
EDIT → RUN → OBSERVE
        ↓
GUIDED INTERACTIVE STEPS
        ↓
PREDICT → RUN → COMPARE
        ↓
DEBUG INTERACTIVE
        ↓
FULL PLAYGROUND
```

This is important because the versions are **not merely different UI layouts**.

They represent increasing degrees of learner control and cognitive responsibility.

---

# 3. INT1 — Code → Run → Output

## Core purpose

INT1 is the foundational InteractiveBlock.

The learner:

```text
CODE
 ↓
RUN
 ↓
OUTPUT
```

The defining purpose is **runtime observation**.

The learner is given prepared executable code and directly observes what the computer produces.

The file explicitly distinguishes INT1 from:

- editing,
- debugging,
- prediction,
- guided interaction,
- open-ended exploration.

So:

```text
INT1 ≠ Code Editor
INT1 ≠ Debugger
INT1 ≠ Exercise
INT1 ≠ Quiz
INT1 ≠ Playground
```

It is essentially:

> **Execute a prepared example and observe real runtime behavior.**

---

## INT1 code editing

The code is normally **read-only**.

This is deliberate.

The learner should not be modifying the example at INT1.

That responsibility moves to INT2.

The conceptual distinction is:

```text
INT1
Author provides code
        ↓
Learner runs it
        ↓
Learner observes result
```

versus:

```text
INT2
Author provides starting code
        ↓
Learner modifies it
        ↓
Learner runs it
        ↓
Learner observes result
```

---

# 4. INT1 execution model

The file specifies execution states such as:

```text
idle
running
success
error
timeout
```

The execution environment requires:

- language
- runtime
- timeout
- output
- error handling

Example execution metadata:

```json
{
  "language": "python",
  "runtime": "python3",
  "timeoutMs": 5000
}
```

The learner does not necessarily see these implementation details; they belong to execution configuration.

---

# 5. INT1 JSON model

The reference JSON structure is:

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

This is useful for the **reference corpus**.

It does **not** prove that this exact JSON envelope is today's production `TutorialDocument` schema.

That distinction remains important.

---

# 6. INT1 output and errors

A normalized execution result is conceptually:

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

The important semantic rule is:

```text
INT1
Error = output
```

The learner may see the runtime error.

But they are **not required to diagnose or repair it**.

That belongs to INT5.

The file explicitly distinguishes:

```text
INT1
Observe the runtime error.

INT5
Investigate and fix the runtime error.
```

---

# 7. INT1 completion

The simplest completion condition is:

```text
Learner successfully runs the example
        ↓
Completed
```

The reference learner state can contain:

```json
{
  "status": "completed",
  "runCount": 1,
  "lastOutput": "[1, 2, 3]"
}
```

Possible states include:

```text
not_started
running
completed
error
timeout
```

The file describes lightweight progress/analytics rather than normal quiz scoring.

---

# 8. INT1 accessibility and responsive behavior

Accessibility is explicitly considered.

Keyboard flow:

```text
Tab
 ↓
Run button
 ↓
Output
```

Output changes should be announced appropriately, with `aria-live="polite"` given as an example.

Errors should also be announced clearly. 

Responsive composition:

### Desktop

```text
┌────────────────────┬─────────────────────┐
│ Code               │ Output              │
│                    │                     │
│ numbers = [...]    │ [1,2,3,4]           │
│                    │                     │
│          [ Run ]   │                     │
└────────────────────┴─────────────────────┘
```

### Mobile

The code, Run control, and output become vertically arranged.

---

# 9. INT1 security requirement

This is particularly important because InteractiveBlock introduces actual code execution.

The file says:

```text
Execution environment = Required
Sandboxing = Required for untrusted execution
Timeout = Required
Resource limits = Recommended
```

So InteractiveBlock is **not simply a React component containing a code editor**.

It implies an execution boundary.

That execution boundary must treat learner/executable code as untrusted where applicable.

The source explicitly calls for CPU/resource controls and timeout handling.

---

# 10. INT1 final specification

The file's final technical specification establishes:

| Area | INT1 |
|---|---|
| Block | InteractiveBlock |
| Version | INT1 |
| Presentation | Code → Run → Output |
| Primary purpose | Runtime observation |
| Code | Required |
| Code editing | ❌ |
| Run | Required |
| Output | Required |
| Runtime errors | Displayed |
| Prediction | ❌ |
| Guided steps | ❌ |
| Debugging | ❌ |
| Open-ended exploration | ❌ |
| Execution environment | Required |
| Sandboxing | Required for untrusted execution |
| Timeout | Required |
| Resource limits | Recommended |
| Completion tracking | Supported |
| Scoring | Normally ❌ |
| Analytics | Lightweight |
| Theme | Light |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark theme | ❌ |
| Responsive | ✅ |
| Accessible | ✅ |
| JSON-driven | ✅ |



---

# 11. INT2 — Edit → Run → Observe

INT2 is the first major semantic expansion.

The learner now controls the code.

The core loop is:

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

> The learner changes a controlled piece of code, executes it, and observes how the changes affect runtime behavior.

So:

```text
INT1 = OBSERVE EXECUTION
INT2 = EXPERIMENT WITH EXECUTION
```

The source explicitly calls this the learner's **first actual control over executable code**. 

---

# 12. INT2 is not an ExerciseBlock

This boundary is particularly important.

### ExerciseBlock

```text
Problem
 ↓
Learner solves
 ↓
Evaluation
```

### INT2

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

The learner may not have one predefined correct answer.

Therefore:

```text
ExerciseBlock
→ practice toward an outcome

INT2
→ experiment to discover behavior
```

---

# 13. INT2 vs TaskBlock

The file makes another useful distinction:

```text
TaskBlock
→ Build a solution satisfying a requirement

INT2
→ Change an example and observe what happens
```

So:

```text
Task
= outcome-oriented

Interactive INT2
= experiment-oriented
```

That is a very important corpus boundary.

---

# 14. INT2 vs INT3

INT2 allows experimentation without a predefined instructional sequence.

```text
INT2

Edit
 ↓
Run
 ↓
Observe
```

INT3 becomes:

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
 ↓
Observe
```

Therefore:

```text
INT2 = controlled experimentation
INT3 = structured instructional experimentation
```

---

# 15. INT2 controls

The reference UI includes:

```text
[ ▶ Run ]       [ ↺ Reset ]
```

Reset is important because learners can modify the starting code.

The file describes restoring the original code and, for larger examples, potentially asking:

```text
Reset code?

Your current changes will be lost.

[ Cancel ] [ Reset ]
```

The source also supports autosave, such as a local draft.

---

# 16. INT2 execution/security model

Because the learner can modify executable code, the security boundary becomes even more important.

The file explicitly states that the submitted modifications must still be treated as untrusted code.

Required concepts include:

```text
CPU limits
timeouts
sandboxing
resource controls
```

The final specification also retains:

- sandboxing required for untrusted execution,
- timeout required,
- resource limits recommended.

---

# 17. INT2 completion

INT2 normally does **not require scoring**.

Possible completion is based on configured goal conditions rather than quiz-style correctness.

The source explicitly characterizes its analytics as:

```text
Experiment-focused
```

rather than assessment scoring.

---

# 18. INT2 final UI

The final UI concept is essentially:

```text
INTERACTIVE EXAMPLE

Experiment With List Mutation

Change the value appended to the list and run
the code again.

CODE
┌──────────────────────────────┐
│ numbers = [1, 2, 3]          │
│                              │
│ numbers.append(4)            │
│                              │
│ print(numbers)               │
└──────────────────────────────┘

● Modified

[ ▶ Run ]             [ ↺ Reset ]

OUTPUT
──────────────────────────────
[1, 2, 3, 4]

✓ Execution completed
```

The critical visual/functional difference from INT1 is:

> **The editor is editable.**

---

# 19. INT3 — Guided Interactive Steps

INT3 takes INT2's experimentation and adds structured pedagogy.

Core model:

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

> The learner discovers a concept through a sequence of guided interactive experiments rather than performing one unrestricted edit-and-run cycle.

So:

```text
INT1 → Observe
INT2 → Experiment
INT3 → Guided Discovery
```

---

# 20. INT3 sequence model

The learner has an explicit objective and a series of required steps.

Conceptually:

```text
OBJECTIVE
   ↓
STEP 1
   ↓
INSTRUCTION
   ↓
EDIT
   ↓
RUN
   ↓
OBSERVE
   ↓
STEP COMPLETE
   ↓
NEXT STEP
   ↓
...
   ↓
FINAL STEP
   ↓
COMPLETE
```

The source supports:

- sequential progression,
- going back,
- retry,
- step reset,
- activity reset,
- hints,
- expected output,
- goal conditions,
- explanations between steps,
- progress persistence.

---

# 21. INT3 JSON structure

The file gives a fairly complete reference model:

```json
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

The complete example demonstrates three progressively meaningful steps around shared references and copying.

This is strong evidence that INT3 is not merely “INT2 repeated three times.”

It introduces **instructional sequencing**.

---

# 22. INT3 completion

The default completion model is:

```text
All required steps completed
        ↓
InteractiveBlock complete
```

The source explicitly says step completion is required.

Analytics are:

```text
Step-focused
```

rather than primarily score-focused.

---

# 23. INT3 final technical specification

The actual file specifies:

| Area | INT3 |
|---|---|
| Primary purpose | Guided experiential learning |
| Starting code | Required |
| Editing | Required |
| Guided steps | Core |
| Sequential progression | Recommended/default |
| Run | Required |
| Observation | Core |
| Step completion | Required |
| Hints | Supported |
| Retry | Supported |
| Step reset | Supported |
| Activity reset | Supported |
| Prediction | ❌ Not required |
| Debugging | ❌ Not defining |
| Full playground | ❌ |
| Expected output | Supported |
| Goal conditions | Supported |
| Explanation between steps | Supported |
| Scoring | Normally ❌ |
| Progress persistence | ✅ |
| Analytics | Step-focused |
| Sandboxing | Required for untrusted execution |
| Timeout | Required |
| Resource limits | Recommended |
| Theme | Light |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark theme | ❌ |
| Responsive | ✅ |
| Accessible | ✅ |
| JSON-driven | ✅ |



---

# 24. INT4 — Predict → Run → Compare

INT4 introduces a different cognitive requirement.

The learner must **predict before execution**.

Core model:

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

The source explicitly distinguishes it from INT3:

```text
INT3
→ tells learner what to do

INT4
→ asks learner what they think will happen
```

This is a major semantic transition.

---

# 25. INT4 prediction is deliberately before runtime

The actual result is hidden until the prediction is submitted.

Prediction can be:

- text,
- choice,
- boolean,
- structured prediction.

The code snapshot is preserved so that the prediction corresponds to a specific executable state.

This supports a useful learning cycle:

```text
Mental model
     ↓
Prediction
     ↓
Execution
     ↓
Reality
     ↓
Mismatch / confirmation
     ↓
Understanding
```

---

# 26. INT4 completion

The file identifies the default completion concept as:

```text
Prediction submitted
+
Execution
+
Comparison
```

The final technical specification summarizes this as:

```text
Completion
Prediction + execution + comparison
```

Scoring is normally not the defining mechanism.

---

# 27. INT4 analytics

This version introduces a more specific analytical possibility:

```text
Prediction-focused analytics
```

and:

```text
Misconception analytics
```

That is meaningful because the system can potentially distinguish:

```text
Prediction correct
        ↓
Mental model likely aligned

Prediction incorrect
        ↓
Runtime result observed
        ↓
Possible misconception identified
```

The source does **not** establish that this is currently implemented in production; it describes the reference behavior/model.

---

# 28. INT4 final technical specification

| Area | INT4 |
|---|---|
| Primary purpose | Predictive reasoning + runtime verification |
| Code | Required |
| Prediction | Required |
| Prediction before run | Required |
| Prediction types | Text / Choice / Boolean / Structured |
| Code snapshot | Required |
| Run | Required |
| Actual output | Hidden until prediction |
| Comparison | Required |
| Explanation | Recommended |
| Retry | Supported |
| Prediction history | Supported |
| Editing | Optional / controlled |
| Debugging | ❌ |
| Guided steps | ❌ Not defining |
| Full playground | ❌ |
| Scoring | Normally ❌ |
| Mastery condition | Optional |
| Completion | Prediction + execution + comparison |
| Analytics | Prediction-focused |
| Misconception analytics | Supported |
| Persistence | Supported |
| Sandboxing | Required for untrusted execution |
| Timeout | Required |
| Resource limits | Recommended |
| Theme | Light |
| Primary | `#F54A8D` |
| Secondary | `#0B1B3D` |
| Gradient | ❌ |
| Dark theme | ❌ |
| Responsive | ✅ |
| Accessible | ✅ |
| JSON-driven | ✅ |



---

# 29. INT5 — Debug Interactive

This is where we must be very precise.

The actual file **does not contain a full INT5 section**.

It declares the intended semantics:

```text
INT5 — Debug Interactive
```

and explains that INT5 is expected to involve:

```text
Intentionally broken code
        ↓
Investigate runtime behavior
        ↓
Identify underlying problem
        ↓
Modify code
        ↓
Run again
        ↓
Verify bug resolved
```

The source also repeatedly uses INT5 as the boundary for debugging.

For example:

```text
INT1
Error = Output

INT5
Error = Problem to solve
```

But this file does **not** provide a complete INT5 JSON model, final architecture, final technical specification, accessibility specification, or full implementation contract.

Therefore:

**INT5 = declared/intended reference stage, not fully specified in this actual file.**

---

# 30. INT6 — Full Playground

Likewise, INT6 is declared as:

```text
INT6 — Full Playground
```

The source describes it conceptually as a complete programming playground capable of supporting things such as:

```text
Create files
Edit
Run
Debug
Experiment
Explore
```

The file uses INT6 as the endpoint of the InteractiveBlock progression:

```text
INT1 → Observe
INT2 → Experiment
INT3 → Guided Discovery
INT4 → Predict + Verify
INT5 → Debug
INT6 → Explore Freely
```

But there is **no full INT6 section** in the actual file.

Therefore:

**INT6 = declared/intended reference stage, not fully specified in this actual file.**

Do **not** create an INT6 technical contract from general knowledge or from another architecture document.

---

# 31. The strongest family boundaries

InteractiveBlock has several very important boundaries with the other families we have already reviewed.

### Interactive vs CodeBlock

```text
CodeBlock
→ presents/explains code

InteractiveBlock
→ executes code and lets learner interact with runtime behavior
```

---

### Interactive vs ExecutionBlock

```text
ExecutionBlock
→ teaches how execution works

InteractiveBlock
→ lets learner experience execution
```

So:

```text
Execution = understand execution
Interactive = interact with execution
```

---

### Interactive vs QuestionBlock

QuestionBlock:

```text
Predict / explain / reason
```

InteractiveBlock INT4:

```text
Predict
 ↓
Actually execute
 ↓
Compare
```

Therefore INT4 adds a **real runtime verification loop**.

---

### Interactive vs ExerciseBlock

Exercise:

```text
Practice a defined skill
```

Interactive:

```text
Explore/experiment with executable behavior
```

Even when an InteractiveBlock has completion conditions, it is not automatically an ExerciseBlock.

---

### Interactive vs TaskBlock

TaskBlock:

```text
Accomplish an objective
```

INT2:

```text
Experiment with a provided example
```

Therefore:

```text
Task = outcome-oriented
Interactive = experiment-oriented
```

---

### Interactive vs MistakeBlock

MistakeBlock:

```text
Teach the mistake
Explain why
Show correction
```

INT5:

```text
Give learner broken code
Investigate
Diagnose
Fix
Verify
```

Again, INT5 is **learner debugging**, not simply presentation of a mistake.

---

# 32. Security is a first-class concern for this family

This is one of the most important findings from FILE 15.

Unlike most instructional blocks, InteractiveBlock potentially executes code.

Therefore the family itself explicitly introduces:

```text
Execution environment
        ↓
Sandboxing
        ↓
Timeout
        ↓
Resource limits
        ↓
Normalized result
```

This is a **reference-level requirement** in the file.

It does not mean that your current production execution infrastructure has already been verified.

That distinction must remain.

---

# 33. Brand/UI contract

The same design conventions continue through the fully specified versions:

```text
Theme: Light
Primary: #F54A8D
Secondary: #0B1B3D
Gradient: No
Dark theme: No
Responsive: Yes
Accessible: Yes
JSON-driven: Yes
```

So InteractiveBlock follows the established SUIA design direction.

But again:

> This is reference/design evidence, not proof that the current production renderer implements those requirements.

---

# 34. Production architecture evidence — very important

I explicitly checked the actual `InteractiveBlock.md` for:

- `UBRC`
- `LSNB`
- `RSSB`
- `TutorialBlockRenderer`
- `tutorial_sections`
- `navigationNodeId`
- `certification`

The searches returned **no matches** for those architectural terms.

Therefore this file does **not** establish:

```text
InteractiveBlock
    ↓
UBRC
    ↓
ILS
    ↓
LSNB
    ↓
RSSB
```

It also does not establish current production registration.

---

# 35. What the file DOES establish

### Verified from actual file

| Area | Status |
|---|---|
| InteractiveBlock family | ✅ |
| INT1 | ✅ Fully specified |
| INT2 | ✅ Fully specified |
| INT3 | ✅ Fully specified |
| INT4 | ✅ Fully specified |
| INT5 | ⚠️ Declared, incomplete |
| INT6 | ⚠️ Declared, incomplete |
| Semantic progression | ✅ |
| Runtime execution concept | ✅ |
| Code editing concept | ✅ |
| Guided interaction | ✅ |
| Prediction/verification | ✅ |
| Debugging intent for INT5 | ✅ |
| Playground intent for INT6 | ✅ |
| JSON/reference models | ✅ |
| Accessibility | ✅ |
| Responsive design | ✅ |
| Security/sandboxing requirements | ✅ |
| SUIA visual rules | ✅ |

---

# 36. What the file DOES NOT establish

| Production/architecture question | Status |
|---|---|
| Current production schema | ❌ Not established |
| `tutorial_sections` implementation | ❌ Not established |
| Current `TutorialBlockRenderer` | ❌ Not established |
| Composer registration | ❌ Not established |
| UBRC integration | ❌ Not established |
| ILS integration | ❌ Not established |
| LSNB integration | ❌ Not established |
| RSSB integration | ❌ Not established |
| `navigationNodeId` runtime identity | ❌ Not established |
| Current production execution service | ❌ Not established |
| Current sandbox implementation | ❌ Not established |
| Current API contract | ❌ Not established |
| Production implementation | ❌ Not established |
| Production certification | ❌ Not established |

This is exactly the separation we have been maintaining for the other 14 files.

---

# 37. One especially important architectural observation

InteractiveBlock is different from many of the previous families because it is not purely a presentation component.

It introduces a dependency on:

```text
learner action
        +
code execution
        +
runtime result
        +
possibly persistent state
```

Therefore when we eventually correlate it with UBRC/ILS/Composer, we need to investigate **execution infrastructure separately from educational block composition**.

For example:

```text
InteractiveBlock content
        ↓
UBRC block identity
        ↓
Interactive runtime
        ↓
Execution service / sandbox
        ↓
Execution result
        ↓
Learner interaction state
```

But that is an **architecture investigation**, not something this Markdown file itself proves.

---

# 38. The most important corpus correction

The historical architecture material may list:

```text
INT1–INT6
```

as though the complete family already exists.

The actual `InteractiveBlock.md` tells us something more precise:

```text
INT1  COMPLETE
INT2  COMPLETE
INT3  COMPLETE
INT4  COMPLETE
INT5  NEXT / DECLARED
INT6  DECLARED
```

The final source ends immediately after:

```text
INT4 — Predict → Run → Compare: COMPLETE

The next version is:

INT5 — Debug Interactive
```



Therefore I will **not** mark InteractiveBlock as an INT1–INT6 fully closed family.

---

# 39. Final FILE 15 corpus entry

I would put this into our authoritative corpus register as:

```text
15. InteractiveBlock

INT1–INT4 fully specified

INT1 — Code → Run → Output
      Runtime Observation

INT2 — Edit → Run → Observe
      Experimentation

INT3 — Guided Interactive Steps
      Guided Discovery

INT4 — Predict → Run → Compare
      Predict + Verify

INT5 — Debug Interactive
      Declared / intended, not fully specified

INT6 — Full Playground
      Declared / intended, not fully specified
```

Semantic progression:

```text
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

And the critical governance classification remains:

```text
Educational Block Family
        ≠
Reference Version
        ≠
Reusable Pattern
        ≠
Production Implementation
        ≠
UBRC Contract
        ≠
ILS Runtime
        ≠
Certification
```

---

## FILE 15 status

```text
InteractiveBlock family analysis       ✅
INT1 extraction                        ✅
INT2 extraction                        ✅
INT3 extraction                        ✅
INT4 extraction                        ✅
INT5 status identified                 ✅
INT6 status identified                 ✅
Semantic progression                   ✅
Cross-family boundaries                ✅
JSON/reference models                  ✅
Execution/security requirements        ✅
Accessibility                          ✅
Responsive behavior                    ✅
Visual/design contract                 ✅
UBRC evidence check                    ✅
ILS evidence check                     ✅
LSNB evidence check                    ✅
RSSB evidence check                    ✅
Production authority check             ✅
```

### Current corpus position

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
15 InteractiveBlock    ✅  ← NOW
16 QuizBlock           ⏭ NEXT
17 ProjectBlock
18 InterviewBlock
```

**Next actual source is FILE 16 — `QuizBlock.md`.** I will use the same rule there: the actual file controls what is truly defined, and I will not promote historical QZ ranges or architecture documents over what the actual converted source establishes.