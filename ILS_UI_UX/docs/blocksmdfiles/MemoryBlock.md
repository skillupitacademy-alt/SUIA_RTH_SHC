# BLOCK 8 — MemoryBlock

## M1 — Memory Fundamentals / Memory Representation

We have completed the entire **ExecutionBlock E1–E8**.

The next block in the locked 18-block sequence is:

> **BLOCK 8 — MemoryBlock**

And, exactly as we have been doing for the other blocks, we will proceed **one version at a time**:

```text
M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8
```

The first version is:

> **M1 — Memory Fundamentals / Memory Representation**

M1 establishes the learner's basic mental model of **how programs use memory** before we move into references, stack/heap concepts, object lifetime, garbage collection, runtime internals, and advanced memory behavior.

---

# 1. M1 Definition

| Item                 | MemoryBlock M1                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| **Block**            | **MemoryBlock**                                                                 |
| **Version**          | **M1**                                                                          |
| **Name**             | **Memory Fundamentals / Memory Representation**                                 |
| **Primary purpose**  | Introduce how program data exists and is represented during execution           |
| **Core question**    | **“Where does the data used by a program exist while the program is running?”** |
| **Learning level**   | Foundation → Intermediate                                                       |
| **Main concepts**    | Program memory, values, variables, objects, references, storage, runtime state  |
| **Primary color**    | **#F54A8D**                                                                     |
| **Secondary color**  | **#0B1B3D**                                                                     |
| **Color rule**       | **70% secondary / neutral, 30% primary accent**                                 |
| **Theme**            | Light                                                                           |
| **Gradient**         | ❌                                                                               |
| **Dark theme**       | ❌                                                                               |
| **Page orientation** | **A4 Portrait**                                                                 |

---

# 2. Why M1 Exists

A learner can write:

```python
x = 10
```

and understand the syntax.

But the learner may not yet understand:

```text
Where is 10?
What is x?
Is x the value?
Is x an object?
How does the program access 10?
What changes when x changes?
What exists while the program is running?
```

M1 begins answering these questions.

The fundamental model is:

```text
SOURCE CODE
     ↓
EXECUTION
     ↓
PROGRAM STATE
     ↓
MEMORY REPRESENTATION
```

---

# 3. M1 Core Mental Model

The simplest M1 model:

```text
┌───────────────────────────────┐
│          PROGRAM              │
│                               │
│  x = 10                       │
│  name = "Alice"               │
│  values = [10, 20, 30]        │
└──────────────┬────────────────┘
               ↓
        RUNTIME STATE
               ↓
┌───────────────────────────────┐
│            MEMORY             │
│                               │
│  Objects / Values / State     │
└───────────────────────────────┘
```

The learner should understand:

> **While a program executes, it maintains a runtime state containing the data and execution information needed to perform its work.**

---

# 4. M1 Important Clarification

M1 should **not** immediately teach:

> “Every variable is a memory address.”

That oversimplification causes problems later.

Instead, teach:

```text
Variable / name
      ↓
Reference / association
      ↓
Object / value
```

The exact implementation depends on the programming language.

For Python in particular:

> A variable name is better understood as a name bound to an object rather than as a box containing a raw value.

This distinction becomes extremely important in later MemoryBlock versions.

---

# 5. M1 Python Example

Consider:

```python
x = 10
```

A beginner model may be:

```text
x
┌───────┐
│  10   │
└───────┘
```

M1 should begin moving toward the more accurate conceptual model:

```text
x
 │
 │ refers to
 ↓
┌───────────────┐
│ Integer 10    │
│ Object        │
└───────────────┘
```

The exact internal representation is runtime-specific and should be covered later.

---

# 6. M1 Name → Object Model

For Python:

```python
x = 10
```

Conceptually:

```text
NAME
 x
 │
 │ binding
 ↓
OBJECT
┌──────────────┐
│ value = 10   │
│ int object   │
└──────────────┘
```

This is one of the most important concepts introduced by M1.

---

# 7. M1 Second Example

```python
x = 10
y = x
```

Conceptually:

```text
       ┌──────────────┐
x ─────►              │
       │ int object   │
y ─────►     10       │
       └──────────────┘
```

The important idea:

> **Two names can refer to the same object.**

This becomes the foundation for M2/M3 reference behavior.

---

# 8. M1 Rebinding

Now:

```python
x = 10
x = 20
```

Conceptually:

```text
Before:

x ─────► 10


After:

x ─────► 20
```

This is **rebinding**.

M1 should introduce the distinction:

```text
Changing a binding
        ≠
Changing an object
```

That distinction becomes crucial later.

---

# 9. M1 Mutable Object Example

Consider:

```python
values = [10, 20, 30]
```

Conceptually:

```text
values
   │
   ▼
┌─────────────────────┐
│ List Object         │
│                     │
│ 10   20   30        │
└─────────────────────┘
```

Here the learner sees:

```text
name
 ↓
object
 ↓
contained elements
```

This is a foundation for later mutable-object memory behavior.

---

# 10. M1 Memory as Runtime State

A program's runtime state can be represented as:

```text
┌─────────────────────────────────────┐
│             PROGRAM STATE            │
│                                     │
│ Names                               │
│ Objects                             │
│ References                         │
│ Execution information               │
│ Temporary state                     │
└─────────────────────────────────────┘
```

The exact contents vary by language/runtime.

M1 should therefore use:

> **conceptual memory model**

rather than claiming one universal physical memory layout.

---

# 11. M1 Physical vs Conceptual Memory

This distinction is important.

### Conceptual model

```text
Program
  ↓
Runtime
  ↓
Memory
  ↓
Objects / State
```

### Physical implementation

May involve:

```text
RAM
CPU caches
registers
virtual memory
process address space
runtime-managed regions
```

M1 should introduce the distinction without diving deeply into hardware architecture.

---

# 12. M1 Memory Hierarchy — Introductory

A small conceptual diagram can show:

```text
CPU
 │
 ├── Registers
 │
 ├── Cache
 │
 └── Main Memory
       │
       └── Program Runtime
```

But this should be an **introductory context**, not the central M1 concept.

The detailed hardware hierarchy belongs to deeper material.

---

# 13. M1 Program Memory View

A useful conceptual representation:

```text
┌─────────────────────────────────┐
│         RUNNING PROGRAM         │
├─────────────────────────────────┤
│                                 │
│   Program State                 │
│                                 │
│   Names                         │
│   Objects                       │
│   References                    │
│   Runtime Data                  │
│                                 │
└─────────────────────────────────┘
```

This is preferable to immediately presenting a complicated operating-system memory map.

---

# 14. M1 Variables

For teaching:

```python
age = 25
```

Show:

```text
Variable / Name
      │
      ▼
┌───────────────┐
│ Object        │
│               │
│ 25            │
└───────────────┘
```

Then:

```python
age = 30
```

Show:

```text
age ─────► 30
```

rather than implying that a physical memory box was overwritten directly.

---

# 15. M1 Objects

An object can be represented conceptually as:

```text
┌──────────────────────────┐
│ OBJECT                   │
├──────────────────────────┤
│ Type                     │
│ Value / State             │
│ Identity                  │
└──────────────────────────┘
```

For Python, this becomes a foundation for later discussions of:

* `id()`
* `type()`
* mutability
* references
* object lifetime
* garbage collection

---

# 16. M1 Object Identity

Introduce identity at a conceptual level:

```python
x = 10
```

The object has an identity during its lifetime.

The Python tutorial can later use:

```python
id(x)
```

M1 should say:

> **An object has an identity that distinguishes that particular object during its lifetime.**

Do not yet go deeply into CPython's exact object header.

---

# 17. M1 Type

Conceptually:

```text
OBJECT
  │
  ├── Identity
  ├── Type
  └── Value / State
```

For:

```python
x = 10
```

we can represent:

```text
┌───────────────────┐
│ Object            │
├───────────────────┤
│ Type: int         │
│ Value: 10         │
│ Identity: ...     │
└───────────────────┘
```

The actual identity representation is intentionally abstract at M1.

---

# 18. M1 Value

A value is the information represented by an object.

Examples:

```text
10
3.14
"Python"
True
[1, 2, 3]
```

The important distinction:

```text
VALUE
  ≠
VARIABLE NAME
```

A variable/name can refer to an object representing a value.

---

# 19. M1 Reference

Introduce:

```text
NAME
 │
 └──────► OBJECT
```

For example:

```python
name = "Alice"
```

Conceptually:

```text
name
 │
 ▼
┌─────────────────┐
│ str object      │
│ "Alice"         │
└─────────────────┘
```

The arrow represents the conceptual relationship.

---

# 20. M1 Multiple References

```python
a = [1, 2]
b = a
```

Conceptually:

```text
a ──────┐
        │
        ▼
     ┌──────────┐
     │ List     │
     │ [1, 2]   │
     └──────────┘
        ▲
        │
b ──────┘
```

This is a very important M1 example.

---

# 21. M1 Reassignment vs Mutation

This distinction should be introduced now.

### Reassignment

```python
a = [1, 2]
a = [3, 4]
```

Conceptually:

```text
a ───► [1, 2]

then

a ───► [3, 4]
```

### Mutation

```python
a = [1, 2]
a.append(3)
```

Conceptually:

```text
a ───► [1, 2]
             ↓
a ───► [1, 2, 3]
```

The same list object is modified.

This prepares the learner for later memory/reference versions.

---

# 22. M1 Stack and Heap — Introductory Only

M1 can introduce the familiar terms:

```text
STACK
  ↓
Execution-related state

HEAP
  ↓
Dynamically managed objects/data
```

But this needs an important warning:

> **“Stack vs heap” is a simplified teaching model and should not be treated as an exact universal representation for every programming language or runtime.**

This is especially important for Python.

---

# 23. M1 Conceptual Stack

A simple teaching representation:

```text
┌──────────────────────┐
│ Current function     │
├──────────────────────┤
│ Caller               │
├──────────────────────┤
│ Previous caller      │
└──────────────────────┘
```

This connects M1 to E5.

But M1 should not duplicate E5's call-stack explanation.

---

# 24. M1 Conceptual Heap

A simplified representation:

```text
┌───────────────────────────┐
│           HEAP            │
│                           │
│  Object A                 │
│                           │
│  Object B                 │
│                           │
│  List Object              │
│                           │
└───────────────────────────┘
```

This provides the foundation for later memory discussions.

---

# 25. M1 Stack ↔ Heap Concept

A simplified Python-oriented teaching model:

```text
CALL FRAME
     │
     │ references
     ▼
┌──────────────────────┐
│       OBJECTS        │
│                      │
│ int                  │
│ list                 │
│ string               │
└──────────────────────┘
```

Again:

> This is a **conceptual model**, not a literal complete description of CPython's internal memory organization.

---

# 26. M1 Memory Example — Python

```python
x = 10
name = "Alice"
values = [10, 20]
```

Conceptually:

```text
PROGRAM STATE

x ────────────► Integer Object
                value = 10

name ─────────► String Object
                value = "Alice"

values ───────► List Object
                ├── 10
                └── 20
```

This is the main M1 visual.

---

# 27. M1 NumPy Example

Consider:

```python
import numpy as np

arr = np.array([10, 20, 30])
```

Conceptually:

```text
arr
 │
 ▼
┌──────────────────────────┐
│ NumPy Array Object       │
├──────────────────────────┤
│ dtype                    │
│ shape                    │
│ metadata                 │
│ data buffer ──────────┐  │
└───────────────────────┼──┘
                        ▼
                  ┌────────────┐
                  │ 10 20 30   │
                  └────────────┘
```

This is a particularly useful M1 example because it introduces:

> **object metadata + underlying data storage**

without yet diving into NumPy internals.

---

# 28. M1 Pandas Example

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["A", "B"],
    "score": [90, 80]
})
```

Conceptually:

```text
df
 │
 ▼
┌───────────────────────────┐
│ DataFrame Object          │
├───────────────────────────┤
│ Index                     │
│ Columns                   │
│ Data representation       │
└──────────────┬────────────┘
               ↓
          underlying data
```

M1 can introduce:

> A high-level data structure can manage multiple layers of underlying data.

The exact pandas internals belong to later advanced memory content.

---

# 29. M1 Full Stack Example

Browser/server context:

```text
HTTP Request
      ↓
Application
      ↓
Runtime State
      ↓
Objects
      ↓
Request Data
      ↓
Response Data
```

For a backend:

```text
request
 │
 ▼
Request Object
 │
 ├── headers
 ├── body
 └── metadata
```

This helps Full Stack learners connect memory concepts to actual applications.

---

# 30. M1 Data Engineering Example

A pipeline might maintain:

```text
Pipeline State
      ↓
Data Batch
      ↓
Transform Objects
      ↓
Output Buffer
```

Conceptually:

```text
pipeline
 │
 ├── configuration
 ├── current batch
 ├── transformation state
 └── output
```

This demonstrates that memory is not just about primitive values.

---

# 31. M1 Data Science Example

During model training:

```text
Model
 │
 ├── parameters
 ├── input batch
 ├── intermediate results
 └── output
```

Conceptually:

```text
TRAINING RUNTIME
       ↓
PROGRAM STATE
       ↓
DATA + MODEL + INTERMEDIATE STATE
```

This is a strong application of M1.

---

# 32. M1 Cyber Security Example

An authentication service might maintain:

```text
Request
 │
 ├── user input
 ├── token
 ├── identity
 ├── authorization state
 └── response
```

Conceptually:

```text
request
   ↓
runtime objects
   ↓
authentication state
   ↓
authorization state
```

This demonstrates why memory/state management matters in security-sensitive software.

---

# 33. M1 Ethical Hacking Example

A defensive security testing application may maintain:

```text
Test Session
 │
 ├── target configuration
 ├── test state
 ├── collected results
 └── logs
```

Again, the focus is on **runtime state representation**, not attack technique.

---

# 34. M1 Quantum Computing Example

A host program may maintain:

```text
Quantum Application
 │
 ├── circuit definition
 ├── execution parameters
 ├── submitted job
 └── returned result
```

Conceptually:

```text
PROGRAM MEMORY
      ↓
CIRCUIT OBJECT
      ↓
JOB STATE
      ↓
RESULT OBJECT
```

The distinction between host memory and quantum hardware state can be introduced here.

---

# 35. M1 Memory Is More Than Variables

A common beginner misconception:

> “Memory contains variables.”

Better model:

```text
PROGRAM MEMORY / RUNTIME STATE
│
├── Objects
├── Data
├── References
├── Function execution state
├── Temporary state
├── Buffers
├── Runtime metadata
└── Other implementation-specific state
```

This is one of the key educational objectives of M1.

---

# 36. M1 Program State

The central concept can be summarized as:

```text
PROGRAM STATE
      =
Data
+
References
+
Execution State
+
Runtime State
```

This connects directly to ExecutionBlock.

---

# 37. M1 Memory and Execution Relationship

ExecutionBlock:

```text
WHAT IS EXECUTING?
```

MemoryBlock:

```text
WHAT STATE / DATA EXISTS
WHILE IT EXECUTES?
```

Together:

```text
EXECUTION
    │
    ├──────► changes
    │
    ▼
PROGRAM STATE
    │
    ▼
MEMORY REPRESENTATION
```

This relationship is foundational.

---

# 38. M1 E8 → M1 Connection

Our previous block ended with:

```text
E8
Complete Execution Lifecycle
```

Now M1 asks:

```text
While that lifecycle is happening,
what data and state exist?
```

Therefore:

```text
EXECUTION
    ↓
RUNTIME STATE
    ↓
MEMORY
```

This makes the transition from ExecutionBlock to MemoryBlock very logical.

---

# 39. M1 Main Visual

The preferred M1 hero visual:

```text
             PROGRAM CODE

        x = 10
        name = "Alice"
        values = [10,20,30]

                 │
                 ▼

             PROGRAM STATE

       ┌─────────────────────┐
       │ Names               │
       │ References          │
       │ Objects             │
       │ Values              │
       └──────────┬──────────┘
                  │
                  ▼

              MEMORY

       ┌─────────────────────┐
       │ Integer Object      │
       │ String Object       │
       │ List Object         │
       └─────────────────────┘
```

This is the **M1 hero component**.

---

# 40. M1 Secondary Visual — Name → Object

```text
┌──────────┐
│   x      │
└────┬─────┘
     │
     │ refers to
     ▼
┌───────────────┐
│ int object    │
│ value = 10    │
└───────────────┘
```

This should appear prominently.

---

# 41. M1 Third Visual — Multiple References

```text
       a
       │
       │
       ▼
   ┌───────────┐
   │ List      │
   │ [1,2,3]   │
   └───────────┘
       ▲
       │
       │
       b
```

This prepares the learner for M2.

---

# 42. M1 A4 Portrait Layout

Recommended final page:

```text
┌──────────────────────────────────────────────┐
│ MEMORY                                       │
│                                              │
│ Memory Fundamentals                          │
│                                              │
│ PROGRAM CODE                                 │
│                                              │
│ x = 10                                       │
│ name = "Alice"                               │
│ values = [10, 20, 30]                        │
│                                              │
│                ↓                             │
│                                              │
│ PROGRAM STATE                                │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Names → Objects → Values                │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│                ↓                             │
│                                              │
│ MEMORY REPRESENTATION                        │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Integer Object                          │ │
│ │ String Object                           │ │
│ │ List Object                             │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ NAME → OBJECT                                │
│                                              │
│ x ───────────────► 10                        │
│                                              │
│ MULTIPLE REFERENCES                          │
│                                              │
│ a ──┐                                        │
│     ├────────► [1, 2, 3]                     │
│ b ──┘                                        │
│                                              │
│ FINAL MENTAL MODEL                           │
└──────────────────────────────────────────────┘
```

---

# 43. M1 Hero Component

The hero should emphasize:

> **Code → Program State → Memory**

rather than a generic RAM illustration.

The learner should understand the relationship between **source-level constructs and runtime representation**.

---

# 44. M1 Color Strategy

SUIA colors:

* **Primary:** `#F54A8D`
* **Secondary:** `#0B1B3D`

### Primary Pink

Use for:

```text
MEMORY
ACTIVE ARROWS
NAME → OBJECT
KEY MEMORY TERMS
IMPORTANT STATE
```

### Secondary Navy

Use for:

```text
Main title
Object labels
Values
Descriptions
Code
Explanations
Diagram text
```

---

# 45. M1 70/30 Rule

Approximately:

```text
70%
Navy + White + Neutral
```

and:

```text
30%
Pink
```

Do **not** make all memory objects pink.

Instead:

```text
x ───────► [Object]
             ↑
          pink accent
```

This keeps the page professional and consistent with the other block versions.

---

# 46. M1 HTML Tag Color Table

| HTML Tag            | Purpose                           | Color       |
| ------------------- | --------------------------------- | ----------- |
| `<section>`         | Root block                        | Neutral     |
| `<header>`          | Block header                      | Neutral     |
| `<span>`            | MEMORY eyebrow                    | **#F54A8D** |
| `<h2>`              | Main title                        | **#0B1B3D** |
| `<p>`               | Context                           | **#0B1B3D** |
| `<article>`         | Memory concept card               | Neutral     |
| `<h3>`              | Section heading                   | **#0B1B3D** |
| `<h4>`              | Object/name heading               | **#0B1B3D** |
| `<code>`            | Code example                      | **#0B1B3D** |
| `<strong>`          | Important concept                 | **#0B1B3D** |
| `<span>`            | MEMORY / OBJECT / REFERENCE label | **#F54A8D** |
| `<div>`             | Diagram container                 | Neutral     |
| `<aside>`           | Final mental model                | Neutral     |
| `<h3>` inside aside | Final result                      | **#F54A8D** |
| `<p>` inside aside  | Explanation                       | **#0B1B3D** |

---

# 47. Semantic HTML Structure

```text
<section>
│
├── <header>
│    ├── <span> MEMORY </span>
│    └── <h2> Memory Fundamentals </h2>
│
├── <p>
│
├── <section class="code-state">
│    ├── <h3>
│    └── <code>
│
├── <section class="program-state">
│    ├── <h3>
│    └── <article>
│
├── <section class="memory-representation">
│    ├── <h3>
│    └── <article>
│
├── <section class="name-object">
│    ├── <h3>
│    └── diagram
│
├── <section class="references">
│    └── diagram
│
└── <aside>
     ├── <h3>
     └── <p>
```

---

# 48. Complete M1 HTML

```html
<section
    class="tutorial-block memory-block memory-m1"
    data-block="memory"
    data-version="M1"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Memory Fundamentals / Memory Representation
        </h2>

    </header>


    <p class="memory-context">
        Understand how a running program represents data,
        objects, references, and runtime state.
    </p>


    <section class="code-state">

        <h3>
            Program Code
        </h3>

        <code>
            x = 10
            name = "Alice"
            values = [10, 20, 30]
        </code>

    </section>


    <section class="program-state">

        <h3>
            Program State
        </h3>

        <article>

            <span>
                NAMES
            </span>

            <p>
                x, name, values
            </p>

        </article>


        <article>

            <span>
                OBJECTS
            </span>

            <p>
                Integer, String, List
            </p>

        </article>

    </section>


    <section class="memory-representation">

        <h3>
            Memory Representation
        </h3>

        <article>

            <h4>
                Integer Object
            </h4>

            <p>
                Represents the value 10.
            </p>

        </article>


        <article>

            <h4>
                String Object
            </h4>

            <p>
                Represents the value "Alice".
            </p>

        </article>


        <article>

            <h4>
                List Object
            </h4>

            <p>
                Represents a collection of values.
            </p>

        </article>

    </section>


    <section class="name-object">

        <h3>
            Name → Object
        </h3>

        <p>
            x ─────────────► integer object
        </p>

    </section>


    <section class="multiple-references">

        <h3>
            Multiple References
        </h3>

        <p>
            a ──┐
        </p>

        <p>
            ├────► [1, 2, 3]
        </p>

        <p>
            b ──┘
        </p>

    </section>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            A running program maintains runtime state containing
            data, objects, references, and execution-related
            information. A variable name should not automatically
            be treated as a physical memory box.
        </p>

    </aside>

</section>
```

---

# 49. M1 JSON Structure

```json
{
  "type": "memory",
  "version": "M1",

  "content": {

    "title": "Memory Fundamentals / Memory Representation",

    "context": "Understand how a running program represents data, objects, references, and runtime state.",

    "codeState": [
      "x = 10",
      "name = \"Alice\"",
      "values = [10, 20, 30]"
    ],

    "programState": {

      "names": [
        "x",
        "name",
        "values"
      ],

      "objects": [
        "Integer",
        "String",
        "List"
      ]

    },

    "memoryRepresentation": [

      {
        "object": "Integer",
        "value": "10"
      },

      {
        "object": "String",
        "value": "Alice"
      },

      {
        "object": "List",
        "value": "[10, 20, 30]"
      }

    ],

    "references": [

      {
        "name": "x",
        "target": "Integer Object"
      }

    ],

    "multipleReferences": {

      "names": [
        "a",
        "b"
      ],

      "target": "List Object"
    },

    "result": {

      "title": "Final Mental Model",

      "description": "A running program maintains runtime state containing data, objects, references, and execution-related information."
    }

  }
}
```

---

# 50. M1 Generic JSON Model

The renderer should support:

```json
{
  "type": "memory",
  "version": "M1",

  "content": {

    "sourceCode": [],

    "programState": {

      "names": [],
      "objects": [],
      "references": []
    },

    "memory": {

      "regions": [],
      "objects": []
    },

    "relationships": [],

    "result": {

      "title": "",
      "description": ""
    }

  }
}
```

This keeps M1 flexible enough for Python, Java, JavaScript, C++, NumPy, Pandas, etc.

---

# 51. M1 Relationship JSON

For:

```python
a = [1, 2]
b = a
```

use:

```json
{
  "relationships": [

    {
      "from": "a",
      "relationship": "references",
      "to": "list-001"
    },

    {
      "from": "b",
      "relationship": "references",
      "to": "list-001"
    }

  ]
}
```

This gives the renderer a graph-like representation.

---

# 52. M1 Object JSON

```json
{
  "id": "object-001",

  "type": "list",

  "value": "[1, 2, 3]"
}
```

For Python:

```json
{
  "id": "object-002",

  "type": "int",

  "value": "10"
}
```

The identity is represented by an internal tutorial-engine identifier, not by claiming that this is the actual machine address.

That distinction is important.

---

# 53. M1 NumPy JSON

For:

```python
arr = np.array([10, 20, 30])
```

the renderer could receive:

```json
{
  "object": {
    "type": "numpy.ndarray",
    "metadata": {
      "shape": "[3]",
      "dtype": "int64"
    },

    "data": {
      "representation": "[10, 20, 30]"
    }
  }
}
```

The purpose is to show:

```text
ARRAY OBJECT
     ↓
METADATA
     ↓
DATA STORAGE
```

without yet teaching NumPy's complete internal implementation.

---

# 54. M1 Pandas JSON

For a DataFrame:

```json
{
  "object": {
    "type": "pandas.DataFrame",

    "components": [
      "index",
      "columns",
      "data"
    ]
  }
}
```

The visual:

```text
DataFrame
   │
   ├── Index
   ├── Columns
   └── Data
```

This makes M1 useful for data-oriented tutorials.

---

# 55. M1 What It Should NOT Explain

M1 must deliberately stop before deep internals.

Do **not** make M1 a chapter about:

```text
CPython PyObject
Reference counting implementation
GC generations
malloc/free internals
CPU cache lines
Virtual memory pages
Page tables
TLB
Memory allocator arenas
Exact pointer representation
ABI
Machine registers
```

Those are future MemoryBlock material.

M1's job is:

> **Build the correct mental model first.**

---

# 56. M1 Relationship With M2

M1:

```text
NAME
 ↓
OBJECT
```

M2 can then deepen:

```text
REFERENCE
 ↓
OBJECT IDENTITY
 ↓
MULTIPLE REFERENCES
 ↓
ALIASING
```

Therefore M1 should introduce references without exhausting the topic.

---

# 57. M1 Relationship With M3+

The natural progression should be:

```text
M1
Memory Fundamentals
       ↓
M2
References / Identity
       ↓
M3
Stack / Heap Model
       ↓
M4
Object Lifetime
       ↓
M5
Garbage Collection
       ↓
M6
Memory Optimization
       ↓
M7
Runtime / Internal Memory
       ↓
M8
Complete Memory Lifecycle
```

The exact names of M2–M8 should be finalized when we explain each version, rather than prematurely changing the architecture.

---

# 58. M1 Relationship With ExecutionBlock

This is extremely important.

### ExecutionBlock E5

```text
CALL STACK
```

asks:

> **Which functions are active?**

### MemoryBlock M1

```text
MEMORY
```

asks:

> **What data/state exists while execution is happening?**

Together:

```text
EXECUTION
     │
     ▼
ACTIVE FUNCTION
     │
     ▼
RUNTIME STATE
     │
     ▼
OBJECTS / DATA
```

---

# 59. M1 Relationship With CodeBlock

CodeBlock:

```python
x = 10
```

M1:

```text
x
 ↓
Integer Object
 ↓
10
```

So:

> **CodeBlock teaches what the statement means syntactically and semantically.**

> **MemoryBlock M1 begins showing what that statement means as runtime state.**

---

# 60. M1 Relationship With DefinitionBlock

DefinitionBlock:

> What is an object?

MemoryBlock:

> Where does that object participate in runtime state?

ExecutionBlock:

> When is that object used during execution?

This creates a powerful three-block teaching relationship:

```text
Definition
    ↓
Concept
    ↓
Memory
    ↓
Runtime Representation
    ↓
Execution
    ↓
Runtime Behavior
```

---

# 61. M1 Relationship With VisualBlock

VisualBlock can create:

```text
x ─────► object
```

But M1 explains:

> **Why this visual relationship matters.**

Thus:

```text
VisualBlock
   ↓
Visual explanation

MemoryBlock
   ↓
Memory meaning
```

---

# 62. M1 Relationship With MistakeBlock

M1 enables mistakes such as:

```python
a = [1, 2]
b = a

b.append(3)
```

A learner may incorrectly expect:

```text
a = [1,2]
b = [1,2,3]
```

M1 introduces:

```text
a ──┐
    ├──► SAME OBJECT
b ──┘
```

Later MistakeBlock can explain:

> **Unexpected mutation caused by shared references.**

---

# 63. M1 Best Use Cases

| Domain            | Suitability |
| ----------------- | ----------: |
| Python            |       ⭐⭐⭐⭐⭐ |
| Java              |       ⭐⭐⭐⭐⭐ |
| JavaScript        |       ⭐⭐⭐⭐⭐ |
| C/C++             |       ⭐⭐⭐⭐⭐ |
| C#                |       ⭐⭐⭐⭐⭐ |
| NumPy             |       ⭐⭐⭐⭐⭐ |
| Pandas            |       ⭐⭐⭐⭐⭐ |
| Full Stack        |       ⭐⭐⭐⭐⭐ |
| Data Science      |       ⭐⭐⭐⭐⭐ |
| Data Engineering  |       ⭐⭐⭐⭐⭐ |
| Cyber Security    |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking   |        ⭐⭐⭐⭐ |
| Quantum Computing |        ⭐⭐⭐⭐ |
| OOP               |       ⭐⭐⭐⭐⭐ |
| Algorithms        |       ⭐⭐⭐⭐⭐ |
| API Development   |       ⭐⭐⭐⭐⭐ |

---

# 64. M1 Language Examples

The same conceptual model can be adapted.

### Python

```text
name → object
```

### JavaScript

```text
variable → value/reference
```

### Java

```text
variable/reference → object
```

### C++

```text
variable → object/value
pointer/reference → object
```

### C

```text
variable → storage
pointer → address
```

This is important:

> **M1 must adapt the explanation to the language rather than forcing the Python model onto every language.**

---

# 65. M1 Accessibility

The memory diagram must not depend solely on arrows.

Use labels:

```text
x
REFERENCE
INTEGER OBJECT
VALUE = 10
```

Instead of:

```text
x ─────► [box]
```

only.

For screen readers, the conceptual relationship should be expressible as:

> “The name x refers to an integer object whose value is 10.”

---

# 66. M1 Responsive Design

### Desktop

```text
CODE
 ↓
PROGRAM STATE
 ↓
MEMORY
```

### Mobile

```text
CODE

↓

PROGRAM STATE

↓

MEMORY

↓

NAME → OBJECT

↓

MULTIPLE REFERENCES
```

The vertical relationship remains intact.

---

# 67. M1 Animation

Optional animation:

```text
x = 10
   ↓
create / access object
   ↓
x references object
```

Then:

```text
a = list
b = a
```

animation:

```text
a ──────┐
        ├────► OBJECT
b ──────┘
```

But static rendering must remain fully understandable.

---

# 68. M1 Information Density

| Component          |         Recommendation |
| ------------------ | ---------------------: |
| Code examples      |                    2–3 |
| Objects            |                    3–5 |
| References         |                    2–3 |
| Memory diagrams    |                    2–4 |
| Stack/heap         | 1 introductory diagram |
| Long paragraphs    |                      ❌ |
| Hardware internals |                      ❌ |
| Runtime internals  |                      ❌ |
| Advanced GC        |                      ❌ |

---

# 69. M1 Validation Rules

| Field               |                               Required |
| ------------------- | -------------------------------------: |
| `type`              |                                      ✅ |
| `version`           |                                 **M1** |
| `title`             |                                  **✅** |
| Source code         |                            Recommended |
| Program state       |                           **Required** |
| Objects             |                           **Required** |
| References          |                            Recommended |
| Name → object       | **Required for Python-style examples** |
| Multiple references |                            Recommended |
| Stack/heap          |                  Optional introductory |
| Physical address    |                                      ❌ |
| Runtime internals   |                                      ❌ |
| GC internals        |                                      ❌ |

---

# 70. M1 Final Technical Specification

| Area                    | M1 Decision                                                     |
| ----------------------- | --------------------------------------------------------------- |
| **Block**               | **MemoryBlock**                                                 |
| **Version**             | **M1**                                                          |
| **Name**                | **Memory Fundamentals / Memory Representation**                 |
| **Main question**       | **Where does program data/state exist while the program runs?** |
| **Hero**                | **Code → Program State → Memory**                               |
| **Core concept**        | Runtime state                                                   |
| **Names**               | **Core**                                                        |
| **Objects**             | **Core**                                                        |
| **References**          | **Core**                                                        |
| **Values**              | **Core**                                                        |
| **Identity**            | Introductory                                                    |
| **Rebinding**           | Introductory                                                    |
| **Mutation**            | Introductory                                                    |
| **Multiple references** | Recommended                                                     |
| **Stack/heap**          | Introductory only                                               |
| **Hardware memory**     | Context only                                                    |
| **GC**                  | ❌                                                               |
| **CPython internals**   | ❌                                                               |
| **Exact addresses**     | ❌                                                               |
| **Primary**             | **#F54A8D**                                                     |
| **Secondary**           | **#0B1B3D**                                                     |
| **Color contribution**  | **70% / 30%**                                                   |
| **Theme**               | Light                                                           |
| **Gradient**            | ❌                                                               |
| **Dark theme**          | ❌                                                               |
| **A4**                  | **Portrait**                                                    |
| **Animation**           | Optional                                                        |
| **JSON-driven**         | **✅**                                                           |
| **Responsive**          | **✅**                                                           |
| **Accessibility**       | **Required**                                                    |
| **Learning level**      | **Foundation → Intermediate**                                   |

---

# 71. M1 Final Mental Model

The entire M1 concept should eventually collapse into this:

```text
                    SOURCE CODE
                         │
                         ▼
                  PROGRAM EXECUTES
                         │
                         ▼
                   PROGRAM STATE
                         │
             ┌───────────┼───────────┐
             │           │           │
           NAMES       OBJECTS     VALUES
             │           │           │
             └─────── REFERENCES ────┘
                         │
                         ▼
                 MEMORY REPRESENTATION
```

For Python:

```text
NAME
 │
 │ refers to
 ▼
OBJECT
 │
 ├── TYPE
 ├── IDENTITY
 └── VALUE / STATE
```

And for multiple references:

```text
      a
      │
      ├──────────► OBJECT
      │
      b
```

The defining principle of **M1** is:

> **A running program maintains runtime state, and that state includes data, objects, references, and execution-related information. At the source level, names and values are programming concepts; at runtime, those concepts are represented through language- and runtime-specific structures in memory.**

---

# MemoryBlock Progress

| Version | Name                                            | Status         |
| ------- | ----------------------------------------------- | -------------- |
| **M1**  | **Memory Fundamentals / Memory Representation** | ✅ **Complete** |
| M2      | References / Identity                           | ⏳              |
| M3      | Stack / Heap Model                              | ⏳              |
| M4      | Object Lifetime                                 | ⏳              |
| M5      | Garbage Collection                              | ⏳              |
| M6      | Memory Optimization                             | ⏳              |
| M7      | Runtime / Internal Memory                       | ⏳              |
| M8      | Complete Memory Lifecycle                       | ⏳              |

**Next: M2 — References / Identity.**



```python

```

# BLOCK 8 — MemoryBlock

## M2 — References / Object Identity

M1 established the foundation:

```text
SOURCE CODE
     ↓
PROGRAM STATE
     ↓
NAMES + OBJECTS + VALUES
     ↓
MEMORY REPRESENTATION
```

Now **M2** goes one level deeper:

> **How do names refer to objects, how can multiple names refer to the same object, and how is object identity different from equality?**

This is a particularly important version for **Python, Java, JavaScript, C++, NumPy, Pandas, OOP, Full Stack, Data Science, and Data Engineering**.

---

# 1. M2 Definition

| Item                 | MemoryBlock M2                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| **Block**            | **MemoryBlock**                                                                                   |
| **Version**          | **M2**                                                                                            |
| **Name**             | **References / Object Identity**                                                                  |
| **Primary purpose**  | Explain references, object identity, aliasing, and the relationship between names and objects     |
| **Core question**    | **“When two variables appear to contain the same thing, are they referring to the same object?”** |
| **Learning level**   | Foundation → Intermediate                                                                         |
| **Core concepts**    | Reference, identity, equality, aliasing, rebinding, mutation, shared object                       |
| **Primary color**    | **#F54A8D**                                                                                       |
| **Secondary color**  | **#0B1B3D**                                                                                       |
| **Color rule**       | **70% secondary/neutral + 30% primary accent**                                                    |
| **Theme**            | Light                                                                                             |
| **Gradient**         | ❌                                                                                                 |
| **Dark theme**       | ❌                                                                                                 |
| **Page orientation** | **A4 Portrait**                                                                                   |

---

# 2. Why M2 Is Necessary

Consider:

```python
a = [10, 20]
b = a
```

A beginner may think:

```text
a → [10,20]

b → [10,20]
```

and imagine two independent lists.

But conceptually:

```text
        ┌───────────────┐
a ─────►│               │
        │  SAME OBJECT  │
b ─────►│   [10, 20]    │
        │               │
        └───────────────┘
```

This creates the important concept:

> **Two names can refer to one object.**

That is the foundation of **aliasing**.

---

# 3. M2 The Three Questions

M2 should teach learners to ask three separate questions:

```text
1. Are the values equal?

2. Are the objects identical?

3. Are the names referring to the same object?
```

These are not necessarily the same question.

---

# 4. Equality vs Identity

Python example:

```python
a = [1, 2, 3]
b = [1, 2, 3]
```

Conceptually:

```text
a ─────► [1,2,3]

b ─────► [1,2,3]
```

Two different objects can contain equal values.

Therefore:

```text
a == b
```

may be:

```text
TRUE
```

while:

```text
a is b
```

is:

```text
FALSE
```

The core distinction:

```text
EQUALITY
    ↓
Do they represent equivalent values?

IDENTITY
    ↓
Are they the same object?
```

---

# 5. M2 Identity Example

Now:

```python
a = [1, 2, 3]
b = a
```

Conceptually:

```text
a ─────┐
       │
       ▼
  ┌───────────┐
  │ List      │
  │ [1,2,3]   │
  └───────────┘
       ▲
       │
b ─────┘
```

Now:

```python
a == b
```

is true, and:

```python
a is b
```

is also true.

Because both names refer to the same object.

---

# 6. M2 The Core Diagram

The central M2 visual should be:

```text
                 NAMES

            ┌──────┴──────┐
            │             │
            ▼             ▼
            a             b
            │             │
            └──────┬──────┘
                   │
                   ▼
          ┌─────────────────┐
          │     OBJECT      │
          │                 │
          │    [1, 2, 3]    │
          └─────────────────┘
```

This is the **hero visual for M2**.

---

# 7. M2 Reference

For M2, use the conceptual relationship:

```text
NAME
  │
  │ refers to
  ▼
OBJECT
```

For example:

```python
user = {"name": "Alice"}
```

Conceptually:

```text
user
 │
 ▼
┌──────────────────┐
│ Dictionary       │
│ name → Alice     │
└──────────────────┘
```

The arrow represents the conceptual reference relationship.

---

# 8. M2 Reference Is Not Necessarily a Physical Address

This is an important architectural rule.

Do **not** teach:

> “A Python reference is simply a memory address.”

Instead:

> **A reference is a language/runtime concept describing how a name or value is associated with an object.**

The implementation may involve pointers internally, but the language-level concept should remain separate from the physical implementation.

This distinction becomes important in M7.

---

# 9. M2 Object Identity

An object has identity during its lifetime.

Conceptually:

```text
┌──────────────────────┐
│ OBJECT               │
├──────────────────────┤
│ Identity             │
│ Type                 │
│ Value / State        │
└──────────────────────┘
```

For Python:

```python
x = [1, 2, 3]

id(x)
```

can be used to observe an identity-related value.

However:

> The exact representation and reuse behavior of object identities are runtime-specific.

---

# 10. M2 `is` vs `==`

This should be a central M2 teaching component.

| Operator | Conceptual question                                   |
| -------- | ----------------------------------------------------- |
| `==`     | Are the values equal according to equality semantics? |
| `is`     | Are these references to the same object?              |

Example:

```python
a = [1, 2]
b = [1, 2]
```

```text
a == b
   ↓
True

a is b
   ↓
False
```

Because:

```text
VALUE CONTENT
     ≈
VALUE CONTENT
```

but:

```text
OBJECT A
  ≠
OBJECT B
```

in identity.

---

# 11. M2 Shared Identity

```python
a = [1, 2]
b = a
```

Then:

```text
a is b
```

is true.

Visual:

```text
a ─────┐
       │
       ▼
     OBJECT
       ▲
       │
b ─────┘
```

The object has one identity, but two names refer to it.

---

# 12. M2 Aliasing

This is the main new term in M2.

> **Aliasing occurs when multiple references/names provide access to the same object.**

Example:

```python
a = [10, 20]
b = a
```

Visual:

```text
       a
       │
       ├────────► OBJECT
       │
       b
```

This should be one of the highlighted M2 definitions.

---

# 13. M2 Mutation Through an Alias

Now:

```python
a = [10, 20]
b = a

b.append(30)
```

Conceptually:

```text
BEFORE

a ─────┐
       ▼
   [10,20]
       ▲
       │
b ─────┘
```

After:

```text
AFTER

a ─────┐
       ▼
   [10,20,30]
       ▲
       │
b ─────┘
```

The learner sees:

> **Changing the shared object through one alias is visible through the other alias.**

This is one of the most important practical lessons in M2.

---

# 14. M2 Rebinding

Compare:

```python
a = [1, 2]
b = a

a = [3, 4]
```

After rebinding:

```text
BEFORE

a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘
```

After:

```text
a ─────► [3,4]

b ─────► [1,2]
```

The original object may still be referenced by `b`.

The key distinction:

```text
REASSIGNMENT
     ↓
changes which object a name refers to

MUTATION
     ↓
changes the state/content of an object
```

---

# 15. M2 Rebinding vs Mutation Table

| Operation            | What changes?                              |
| -------------------- | ------------------------------------------ |
| `a = new_object`     | Name binding                               |
| `a.append(x)`        | Existing object                            |
| `a = 20`             | Name binding                               |
| `list_obj.append(x)` | List state                                 |
| `b = a`              | Creates another binding to the same object |

This table should appear on the M2 page.

---

# 16. M2 Equality / Identity Matrix

A highly valuable component:

| Situation                             |           `==` |    `is` |
| ------------------------------------- | -------------: | ------: |
| Same object                           | Usually `True` |  `True` |
| Different objects, equal contents     |         `True` | `False` |
| Different objects, different contents |        `False` | `False` |

The word **“usually”** matters because equality behavior can be customized.

---

# 17. M2 Important Python Caveat

Avoid teaching:

```text
if a == b:
    a is b
```

This is incorrect.

Also avoid relying on implementation-specific identity behavior for small immutable objects.

For example:

```python
a = 10
b = 10
```

The result of identity checks involving immutable objects can depend on implementation details and interning/caching behavior.

The safe teaching rule:

> **Use `==` when you want value equality and `is` when you intentionally want object identity.**

---

# 18. M2 `None`

A particularly important practical example:

```python
if value is None:
    ...
```

Why?

Because the programmer is checking:

> **Is this the `None` object?**

This is an excellent M2 real-world application.

---

# 19. M2 `None` Diagram

```text
value
  │
  │ is
  ▼
┌──────────────┐
│ None object  │
└──────────────┘
```

This gives M2 a practical programming rule without going too deep into implementation.

---

# 20. M2 Immutable Objects

M2 should introduce the idea that aliasing becomes particularly interesting with mutable objects.

Examples of commonly immutable Python types:

```text
int
float
bool
str
tuple
```

Examples of mutable types:

```text
list
dict
set
```

This classification is language-specific and should be presented as a Python example rather than a universal rule across all languages.

---

# 21. M2 Mutable Object

```python
a = [1, 2]
b = a

b.append(3)
```

Result:

```text
a → [1,2,3]
b → [1,2,3]
```

because both refer to the same mutable list.

---

# 22. M2 Immutable Example

```python
a = 10
b = a
```

Then:

```python
a = 20
```

Conceptually:

```text
BEFORE

a ─────┐
       ├──► 10
b ─────┘
```

After rebinding:

```text
a ─────► 20

b ─────► 10
```

The integer object was not mutated by `a = 20`; the name `a` was rebound.

---

# 23. M2 Function Argument Example

This is one of the most important applications.

```python
def add_item(items):
    items.append(100)

values = [1, 2]
add_item(values)
```

Conceptually:

```text
values ───────┐
              │
              ▼
          [1,2]
              ▲
              │
         items ─────
```

Inside the function:

```text
items
  │
  ▼
SAME LIST OBJECT
```

Therefore:

```text
values
  ↓
[1,2,100]
```

This connects MemoryBlock to **Function/Call Execution E4/E5**.

---

# 24. M2 Function Rebinding Example

Compare:

```python
def change(x):
    x = 100

value = 10
change(value)
```

The function's local name `x` is rebound.

Conceptually:

```text
value ───► 10

inside function:

x ───────► 10
x = 100
x ───────► 100
```

The caller's `value` does not become `100`.

This is an extremely important M2 lesson for Python.

---

# 25. M2 Function Mutation Example

Compare:

```python
def change(items):
    items.append(100)

values = [1, 2]
change(values)
```

Conceptually:

```text
values ─────┐
            ▼
         [1,2]
            ▲
            │
           items

items.append(100)

            ↓

values ─────┐
            ▼
       [1,2,100]
            ▲
            │
           items
```

This demonstrates the difference between:

> **rebinding a name**

and

> **mutating a shared object**.

---

# 26. M2 NumPy Example

Consider:

```python
arr = np.array([10, 20, 30])
view = arr
```

Conceptually:

```text
arr ─────┐
         ▼
    ndarray object
         ▲
         │
view ────┘
```

If the underlying array is mutable and modified:

```python
view[0] = 99
```

then the same array object is observed through `arr`.

```text
arr → [99,20,30]
view → [99,20,30]
```

This is a highly useful M2 example for Data Science.

---

# 27. M2 NumPy View Caveat

A deeper NumPy concept is:

```python
view = arr[1:]
```

This may create a **view** sharing underlying data rather than an independent copy.

Conceptually:

```text
arr
 │
 ▼
DATA BUFFER
 ▲
 │
view
```

This is an excellent advanced M2 example, but the exact behavior depends on the operation.

The key lesson:

> **A new array object does not necessarily imply independent underlying data.**

This can be mentioned at the end of M2 without turning the page into a NumPy memory chapter.

---

# 28. M2 Pandas Example

A Pandas operation may produce:

```text
DataFrame
    ↓
Series / DataFrame object
    ↓
underlying data representation
```

The learner should understand that:

> A new Python-level object does not automatically mean that all underlying data has been physically copied.

However, exact copy/view behavior in pandas is operation- and version-dependent, so M2 should avoid making blanket claims.

---

# 29. M2 Full Stack Example

Suppose:

```python
request_data = request.json
service_data = request_data
```

Conceptually:

```text
request_data ───┐
                ▼
           Request Object
                ▲
                │
service_data ───┘
```

If mutable data is modified:

```python
service_data["role"] = "admin"
```

the change may be visible through `request_data` because both names refer to the same mutable object.

This is why developers must understand reference behavior.

---

# 30. M2 Data Engineering Example

Consider:

```python
batch = load_batch()
current_batch = batch
```

Now:

```text
batch ─────────┐
               ▼
          DATA BATCH
               ▲
               │
current_batch ─┘
```

If a transformation mutates the object:

```python
current_batch.append(record)
```

the original `batch` reference sees that same mutation.

This is important when designing pipeline stages.

---

# 31. M2 Data Science Example

A model pipeline may have:

```python
x = dataset
training_data = x
```

Conceptually:

```text
dataset ─────────┐
                 ▼
              DATASET
                 ▲
                 │
training_data ───┘
```

If the dataset is mutable, transformations can unexpectedly affect both references.

This is a common reason to deliberately copy data.

---

# 32. M2 Cyber Security Example

Security-sensitive state:

```python
user_context = request_context
audit_context = user_context
```

Conceptually:

```text
user_context ────┐
                 ▼
            CONTEXT OBJECT
                 ▲
                 │
audit_context ───┘
```

If one component mutates shared state, another component may observe the modification.

This is why shared mutable state can become a correctness and security concern.

---

# 33. M2 Ethical Hacking / Security Lab Example

A test application might maintain:

```text
session
   │
   ├── configuration
   ├── results
   └── logs
```

If multiple components share the same mutable session object:

```text
collector ─────┐
               ▼
          session object
               ▲
               │
reporter ──────┘
```

changes made by one component may be visible to another.

Again, the lesson is **shared state**, not attack mechanics.

---

# 34. M2 Quantum Computing Example

A host application might have:

```python
circuit = build_circuit()
job = circuit
```

Conceptually:

```text
circuit ────┐
            ▼
       Circuit Object
            ▲
            │
job ────────┘
```

If the circuit object is mutable and changed, both names observe the same object.

This is a host-language memory concept, not a statement about quantum-state identity.

---

# 35. M2 Java Example

Java:

```java
Person a = new Person();
Person b = a;
```

Conceptually:

```text
a ─────┐
       ▼
   Person Object
       ▲
       │
b ─────┘
```

This allows M2 to teach that reference behavior is not unique to Python.

---

# 36. M2 JavaScript Example

```javascript
const a = { name: "Alice" };
const b = a;

b.name = "Bob";
```

Conceptually:

```text
a ─────┐
       ▼
 { name: "Alice" }
       ▲
       │
b ─────┘
```

After mutation:

```text
a → { name: "Bob" }
b → { name: "Bob" }
```

Again:

> Two references access the same object.

---

# 37. M2 C++ Example

C++ allows several distinct concepts:

```cpp
int value = 10;
int& ref = value;
```

Conceptually:

```text
value
  ▲
  │
  │ reference
  │
 ref
```

C++ also has pointers:

```cpp
int* p = &value;
```

This gives M2 a useful comparison:

```text
language-level reference
vs
pointer
vs
object identity
```

But detailed pointer arithmetic belongs elsewhere.

---

# 38. M2 Identity vs Address

Important rule:

```text
OBJECT IDENTITY
       ≠
PHYSICAL MEMORY ADDRESS
```

An implementation may represent identity using an address or address-like mechanism, but the programming concept is broader.

This is particularly important for managed runtimes.

---

# 39. M2 Aliasing Diagram

Recommended visual:

```text
              NAME A
                 │
                 │
                 ▼
        ┌─────────────────┐
        │                 │
        │    OBJECT       │
        │                 │
        │   [1,2,3]       │
        │                 │
        └─────────────────┘
                 ▲
                 │
                 │
              NAME B
```

Caption:

> **Two names, one object.**

This should be the strongest M2 visual phrase.

---

# 40. M2 Equality Diagram

Second visual:

```text
OBJECT A                    OBJECT B

┌──────────┐                ┌──────────┐
│ [1,2,3]  │                │ [1,2,3]  │
└──────────┘                └──────────┘

     │                            │
     └──────── equal values ──────┘

     Different identities
```

Then:

```text
a == b  → True
a is b  → False
```

This makes the distinction immediately visible.

---

# 41. M2 Identity Diagram

Third visual:

```text
        a
        │
        ▼
    ┌──────────┐
    │ [1,2,3]  │
    └──────────┘
        ▲
        │
        b

a == b  → True
a is b  → True
```

This creates a clean comparison between two cases.

---

# 42. M2 Rebinding Diagram

```text
BEFORE

a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘


a = [3,4]


AFTER

a ─────► [3,4]

b ─────► [1,2]
```

This should be the fourth visual.

---

# 43. M2 Mutation Diagram

```text
BEFORE

a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘


b.append(3)


AFTER

a ─────┐
       ▼
   [1,2,3]
       ▲
       │
b ─────┘
```

This is one of the highest-value diagrams in M2.

---

# 44. M2 Main Page Layout

Recommended A4 portrait:

```text id="9hl4ts"
┌──────────────────────────────────────────────┐
│ MEMORY                                       │
│                                              │
│ References / Object Identity                 │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │          TWO NAMES → ONE OBJECT         │ │
│ │                                          │ │
│ │      a ─────┐                            │ │
│ │             ├────► OBJECT               │ │
│ │      b ─────┘                            │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ IDENTITY vs EQUALITY                         │
│                                              │
│ a == b     a is b                            │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ DIFFERENT OBJECTS / EQUAL VALUES       │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ REBINDING vs MUTATION                        │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ a = new_object                           │ │
│ │ vs                                       │ │
│ │ object.append(...)                       │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ REAL-WORLD EXAMPLES                          │
│ Python • NumPy • Pandas • Full Stack         │
│                                              │
│ FINAL MENTAL MODEL                           │
└──────────────────────────────────────────────┘
```

---

# 45. M2 Hero

The hero should contain:

```text
a ─────┐
       ├────► SAME OBJECT
b ─────┘
```

with the phrase:

> **Two names can refer to one object.**

This is more educational than a generic memory-chip illustration.

---

# 46. M2 Color Strategy

### Primary — `#F54A8D`

Use for:

* `MEMORY` eyebrow
* arrows
* active reference relationships
* `SAME OBJECT`
* `is`
* identity markers
* mutation transition
* important callouts

### Secondary — `#0B1B3D`

Use for:

* title
* object names
* explanatory text
* code
* equality examples
* diagram labels
* normal state

---

# 47. M2 70/30 Color Distribution

```text
70%
Navy + White + neutral surfaces
```

```text
30%
Pink accents
```

Example:

```text
a ─────┐
       │
       ├────► OBJECT
       │
b ─────┘
       ↑
     Pink
```

Only the relationship should be strongly accented.

---

# 48. M2 HTML Tag Color Table

| HTML Tag            | Purpose                     | Color       |
| ------------------- | --------------------------- | ----------- |
| `<section>`         | Root block                  | Neutral     |
| `<header>`          | Header                      | Neutral     |
| `<span>`            | MEMORY eyebrow              | **#F54A8D** |
| `<h2>`              | Main title                  | **#0B1B3D** |
| `<p>`               | Context                     | **#0B1B3D** |
| `<article>`         | Concept card                | Neutral     |
| `<h3>`              | Section heading             | **#0B1B3D** |
| `<h4>`              | Subheading                  | **#0B1B3D** |
| `<code>`            | Code                        | **#0B1B3D** |
| `<strong>`          | Key term                    | **#0B1B3D** |
| `<span>`            | Identity / reference marker | **#F54A8D** |
| `<span>`            | SAME OBJECT                 | **#F54A8D** |
| `<span>`            | `is`                        | **#F54A8D** |
| `<div>`             | Diagram                     | Neutral     |
| `<aside>`           | Final mental model          | Neutral     |
| `<h3>` inside aside | Final heading               | **#F54A8D** |
| `<p>` inside aside  | Final explanation           | **#0B1B3D** |

---

# 49. Semantic HTML Structure

```text id="hiy8eb"
<section>
│
├── <header>
│    ├── <span> MEMORY </span>
│    └── <h2>
│
├── <p>
│
├── <section class="aliasing">
│    ├── <h3>
│    └── reference diagram
│
├── <section class="identity-equality">
│    ├── <h3>
│    ├── equality example
│    └── identity example
│
├── <section class="rebinding">
│    └── diagram
│
├── <section class="mutation">
│    └── diagram
│
├── <section class="real-world">
│    ├── Python
│    ├── NumPy
│    └── Full Stack
│
└── <aside>
     ├── <h3>
     └── <p>
```

---

# 50. Complete M2 HTML

```html id="h6v5g2"
<section
    class="tutorial-block memory-block memory-m2"
    data-block="memory"
    data-version="M2"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            References / Object Identity
        </h2>

    </header>


    <p class="memory-context">
        Understand how names refer to objects, how multiple
        names can share one object, and how identity differs
        from equality.
    </p>


    <section class="aliasing">

        <h3>
            Two Names → One Object
        </h3>

        <p>
            a ─────┐
        </p>

        <p>
            ├────► SAME OBJECT
        </p>

        <p>
            b ─────┘
        </p>

    </section>


    <section class="identity-equality">

        <h3>
            Identity vs Equality
        </h3>

        <article>

            <h4>
                Equality
            </h4>

            <code>
                a == b
            </code>

            <p>
                Do the objects compare as equal?
            </p>

        </article>


        <article>

            <h4>
                Identity
            </h4>

            <code>
                a is b
            </code>

            <p>
                Are both names referring to the same object?
            </p>

        </article>

    </section>


    <section class="rebinding">

        <h3>
            Rebinding
        </h3>

        <code>
            a = new_object
        </code>

        <p>
            Rebinding changes which object a name refers to.
        </p>

    </section>


    <section class="mutation">

        <h3>
            Mutation
        </h3>

        <code>
            b.append(3)
        </code>

        <p>
            Mutation changes the state of an existing mutable
            object that may be shared by multiple names.
        </p>

    </section>


    <section class="real-world">

        <h3>
            Real-World Applications
        </h3>

        <article>
            <h4>Python</h4>
            <p>Lists, dictionaries, function arguments, and shared state.</p>
        </article>

        <article>
            <h4>NumPy</h4>
            <p>Array objects, references, views, and shared data.</p>
        </article>

        <article>
            <h4>Full Stack</h4>
            <p>Request objects, service state, and shared mutable data.</p>
        </article>

    </section>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            A name refers to an object. Multiple names may refer
            to the same object. Equality asks whether values compare
            as equal, while identity asks whether the references
            point to the same object.
        </p>

    </aside>

</section>
```

---

# 51. M2 JSON Structure

```json id="8s2l6q"
{
  "type": "memory",
  "version": "M2",

  "content": {

    "title": "References / Object Identity",

    "context": "Understand how names refer to objects, how multiple names can share one object, and how identity differs from equality.",

    "aliasing": {

      "names": [
        "a",
        "b"
      ],

      "target": "object-001"
    },

    "identityEquality": {

      "equality": {
        "operator": "==",
        "question": "Do the values compare as equal?"
      },

      "identity": {
        "operator": "is",
        "question": "Are the names referring to the same object?"
      }

    },

    "rebinding": {

      "operation": "a = new_object",

      "effect": "Changes which object the name refers to."
    },

    "mutation": {

      "operation": "b.append(3)",

      "effect": "Changes the state of the shared mutable object."
    },

    "result": {

      "title": "Final Mental Model",

      "description": "A name refers to an object. Multiple names may refer to the same object. Equality asks whether values compare as equal, while identity asks whether the references refer to the same object."
    }

  }
}
```

---

# 52. Generic M2 JSON Model

For the Tutorial Engine renderer:

```json id="8x2xji"
{
  "type": "memory",
  "version": "M2",

  "content": {

    "objects": [],

    "references": [],

    "relationships": [],

    "comparisons": {

      "equality": {},
      "identity": {}
    },

    "rebinding": [],

    "mutation": [],

    "result": {

      "title": "",
      "description": ""
    }

  }
}
```

---

# 53. M2 Reference Relationship

Example:

```json id="xpxg95"
{
  "references": [

    {
      "name": "a",
      "target": "object-001"
    },

    {
      "name": "b",
      "target": "object-001"
    }

  ]
}
```

The renderer can then automatically generate:

```text
a ─────┐
       ├────► object-001
b ─────┘
```

---

# 54. M2 Equality Comparison JSON

```json id="qjz9pk"
{
  "comparison": {

    "left": {
      "name": "a",
      "object": "object-001"
    },

    "right": {
      "name": "b",
      "object": "object-002"
    },

    "valueEquality": true,

    "identityEquality": false

  }
}
```

The UI can render:

```text
a == b   ✓
a is b   ✗
```

---

# 55. M2 Mutation JSON

```json id="k2t9tg"
{
  "mutation": {

    "object": "object-001",

    "operation": "append",

    "before": "[1,2]",

    "after": "[1,2,3]",

    "aliases": [
      "a",
      "b"
    ]

  }
}
```

This allows the renderer to show the before/after state.

---

# 56. M2 Rebinding JSON

```json id="1w6yup"
{
  "rebinding": {

    "name": "a",

    "before": "object-001",

    "after": "object-002",

    "otherReferences": [
      {
        "name": "b",
        "target": "object-001"
      }
    ]

  }
}
```

This produces:

```text
BEFORE

a ──┐
    ├──► Object 1
b ──┘


AFTER

a ─────► Object 2

b ─────► Object 1
```

---

# 57. M2 What It Should NOT Explain

M2 should **not** become the advanced runtime-memory chapter.

Avoid deep explanations of:

```text
CPython pointer structures
PyObject headers
reference-count implementation
garbage collector generations
allocator arenas
virtual addresses
pointer tagging
CPU cache behavior
memory barriers
atomic reference counting
ABI details
```

Those belong to later MemoryBlock versions.

M2's purpose is:

> **Build a correct conceptual model of identity and sharing.**

---

# 58. M2 Common Mistakes

M2 should explicitly prepare learners for these mistakes.

### Mistake 1

```python
a = [1, 2]
b = [1, 2]

a is b
```

Expecting:

```text
True
```

when the two expressions created separate list objects.

---

### Mistake 2

Thinking:

```python
b = a
```

creates a copy.

It does not generally create an independent copy of the referenced mutable object.

---

### Mistake 3

Confusing:

```text
reassignment
```

with:

```text
mutation
```

---

### Mistake 4

Using:

```python
is
```

when the programmer actually wants value equality.

---

# 59. M2 Relationship With M1

M1:

```text
NAME
 ↓
OBJECT
```

M2:

```text
NAME A ──┐
         ├──► SAME OBJECT
NAME B ──┘
```

Therefore:

> **M1 introduces the relationship; M2 explains sharing and identity.**

---

# 60. M2 Relationship With ExecutionBlock

E4:

```text
FUNCTION CALL
```

M2:

```text
ARGUMENT NAME
      ↓
SAME OBJECT?
```

E5:

```text
CALL STACK
```

M2:

```text
CALL FRAME
   ↓
LOCAL NAME
   ↓
REFERENCED OBJECT
```

This is a very important cross-block relationship.

---

# 61. M2 Relationship With E7

E7:

```text
ASYNC TASK A
ASYNC TASK B
```

M2:

```text
Task A ─────┐
            ├──► SHARED OBJECT
Task B ─────┘
```

This shows why shared mutable state can matter in asynchronous/concurrent applications.

M2 should mention this connection but not turn into a concurrency-safety chapter.

---

# 62. M2 Relationship With MistakeBlock

M2 creates the knowledge needed for:

```text
Unexpected mutation
Shared state
Aliasing bugs
Incorrect copies
Identity/equality confusion
```

For example:

```text
a ─────┐
       ├──► shared list
b ─────┘
       ↓
b modifies list
       ↓
a sees change
```

Later MistakeBlock can explain this as a debugging pattern.

---

# 63. M2 Relationship With BestPracticeBlock

M2 teaches:

> Multiple references can share mutable state.

BestPracticeBlock can later teach:

> Avoid unnecessary shared mutable state.

This is a clean separation of responsibility.

---

# 64. M2 Relationship With NumPy/Pandas

M2 gives the learner the conceptual vocabulary required to understand:

```text
reference
copy
view
shared data
aliasing
mutation
```

Later specialized examples can explain exactly how NumPy and pandas implement these behaviors.

---

# 65. M2 Accessibility

Do not make the difference between identity and equality depend only on:

```text
Pink = identity
Navy = equality
```

Use explicit labels:

```text
VALUE EQUALITY
a == b

OBJECT IDENTITY
a is b
```

For aliasing:

```text
a and b refer to the same object
```

This remains understandable without color.

---

# 66. M2 Responsive Design

### Desktop

Two-column comparison:

```text
EQUALITY              IDENTITY

a == b                a is b

Equal values?         Same object?
```

### Mobile

Stack:

```text
EQUALITY
↓
a == b
↓
Equal values?

IDENTITY
↓
a is b
↓
Same object?
```

The renderer should automatically switch layout rather than shrinking the comparison until it becomes unreadable.

---

# 67. M2 Animation

A useful optional animation:

```text
a = object
```

then:

```text
b = a
```

animation:

```text
a ─────► OBJECT

b ─────► OBJECT
```

Then:

```text
b.append(3)
```

animation:

```text
OBJECT
[1,2]
 ↓
[1,2,3]
```

The `a` and `b` arrows remain attached to the same object.

This visually demonstrates aliasing extremely well.

---

# 68. M2 Information Density

| Component              | Recommendation |
| ---------------------- | -------------: |
| Hero diagram           |              1 |
| Equality comparison    |              1 |
| Identity comparison    |              1 |
| Aliasing example       |              1 |
| Rebinding example      |              1 |
| Mutation example       |              1 |
| Language examples      |            3–5 |
| Long paragraphs        |              ❌ |
| Deep runtime internals |              ❌ |

---

# 69. M2 Validation Rules

| Field              |        Required |
| ------------------ | --------------: |
| `type`             |               ✅ |
| `version`          |          **M2** |
| `title`            |           **✅** |
| Objects            |    **Required** |
| References         |    **Required** |
| Identity           |    **Required** |
| Equality           |    **Required** |
| Aliasing           |    **Required** |
| Rebinding          |     Recommended |
| Mutation           |     Recommended |
| `is`               | Python-specific |
| `==`               | Python-specific |
| Physical addresses |               ❌ |
| Runtime internals  |               ❌ |
| GC internals       |               ❌ |

---

# 70. M2 Final Technical Specification

| Area                     | M2 Decision                                          |
| ------------------------ | ---------------------------------------------------- |
| **Block**                | **MemoryBlock**                                      |
| **Version**              | **M2**                                               |
| **Name**                 | **References / Object Identity**                     |
| **Main question**        | **Are multiple names referring to the same object?** |
| **Hero**                 | **Two Names → One Object**                           |
| **Reference**            | **Core**                                             |
| **Identity**             | **Core**                                             |
| **Equality**             | **Core**                                             |
| **Aliasing**             | **Core**                                             |
| **Rebinding**            | **Core**                                             |
| **Mutation**             | **Core**                                             |
| **Shared mutable state** | Recommended                                          |
| **Function arguments**   | Recommended                                          |
| **NumPy views**          | Introductory                                         |
| **Pandas sharing**       | Introductory                                         |
| **Physical addresses**   | ❌                                                    |
| **GC internals**         | ❌                                                    |
| **Runtime internals**    | ❌                                                    |
| **Primary**              | **#F54A8D**                                          |
| **Secondary**            | **#0B1B3D**                                          |
| **Color contribution**   | **70% / 30%**                                        |
| **Theme**                | Light                                                |
| **Gradient**             | ❌                                                    |
| **Dark theme**           | ❌                                                    |
| **A4**                   | **Portrait**                                         |
| **Animation**            | Optional                                             |
| **JSON-driven**          | **✅**                                                |
| **Responsive**           | **✅**                                                |
| **Accessibility**        | **Required**                                         |
| **Learning level**       | **Foundation → Intermediate**                        |

---

# 71. M2 Final Mental Model

Everything in M2 should ultimately collapse into this:

```text
                    NAMES
                 /         \
                /           \
               ▼             ▼
              a               b
               \             /
                \           /
                 ▼         ▼
                ┌───────────────┐
                │    OBJECT     │
                │               │
                │   [1,2,3]     │
                └───────────────┘
```

Then the learner understands:

```text
a == b
```

asks:

> **Do these values compare as equal?**

while:

```text
a is b
```

asks:

> **Are these the same object?**

And:

```text
b.append(3)
```

asks:

> **What happens when one alias mutates a shared object?**

Finally:

```text
a = new_object
```

asks:

> **What happens when a name is rebound to another object?**

The defining principle of **M2** is:

> **Names do not necessarily own independent copies of data. Multiple names can refer to the same object, making object identity, equality, aliasing, rebinding, and mutation fundamentally different concepts.**

---

## MemoryBlock Progress

| Version | Name                                        | Status         |
| ------- | ------------------------------------------- | -------------- |
| **M1**  | Memory Fundamentals / Memory Representation | ✅              |
| **M2**  | **References / Object Identity**            | ✅ **Complete** |
| **M3**  | Stack / Heap Model                          | ⏳              |
| **M4**  | Object Lifetime                             | ⏳              |
| **M5**  | Garbage Collection                          | ⏳              |
| **M6**  | Memory Optimization                         | ⏳              |
| **M7**  | Runtime / Internal Memory                   | ⏳              |
| **M8**  | Complete Memory Lifecycle                   | ⏳              |

**Next: M3 — Stack / Heap Model.**



```python

```

# BLOCK 8 — MemoryBlock

## M3 — Stack / Heap Model

M1 established:

> **A running program maintains runtime state containing names, objects, values, and references.**

M2 established:

> **Multiple names can refer to the same object, and identity is different from equality.**

Now **M3** moves to the next layer:

> **How can we conceptually organize execution-related state and dynamically managed objects in memory?**

The key teaching model is:

```text
                    RUNNING PROGRAM
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
          STACK                      HEAP
             │                         │
       Execution state          Objects / dynamic data
             │                         │
       Function calls           Lists / objects / buffers
       Local bindings           Runtime-managed data
```

**Important:** M3 teaches this as a **conceptual model**, not as a literal universal physical layout. Different languages and runtimes implement memory differently.

---

# 1. M3 Definition

| Item                 | MemoryBlock M3                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Block**            | **MemoryBlock**                                                                                             |
| **Version**          | **M3**                                                                                                      |
| **Name**             | **Stack / Heap Model**                                                                                      |
| **Primary purpose**  | Explain the conceptual relationship between call-stack execution state and dynamically managed objects/data |
| **Core question**    | **“Where do execution contexts and dynamically managed objects conceptually fit while a program runs?”**    |
| **Learning level**   | Intermediate                                                                                                |
| **Core concepts**    | Stack, stack frame, call, local state, return, heap, object storage, references                             |
| **Primary color**    | **#F54A8D**                                                                                                 |
| **Secondary color**  | **#0B1B3D**                                                                                                 |
| **Color rule**       | **70% secondary/neutral + 30% primary accent**                                                              |
| **Theme**            | Light                                                                                                       |
| **Gradient**         | ❌                                                                                                           |
| **Dark theme**       | ❌                                                                                                           |
| **Page orientation** | **A4 Portrait**                                                                                             |

---

# 2. Why M3 Exists

M1 taught:

```text
NAME → OBJECT
```

M2 taught:

```text
NAME A ──┐
         ├──→ OBJECT
NAME B ──┘
```

But the learner may now ask:

> Where is the information about the currently executing function?

For example:

```python
def calculate(x):
    result = x * 2
    return result

value = calculate(10)
```

During execution, there is an active function context containing information such as:

```text
calculate()
    ↓
parameter x
local result
return position
execution state
```

At the same time, objects exist:

```text
10
20
function-related objects
other application objects
```

M3 provides a conceptual model for separating these concerns.

---

# 3. M3 The Core Mental Model

The main M3 model:

```text
┌─────────────────────────────────────────┐
│             RUNNING PROGRAM             │
│                                         │
│   ┌────────────────┐  ┌──────────────┐ │
│   │     STACK      │  │     HEAP     │ │
│   │                │  │              │ │
│   │ Call frames    │  │ Objects      │ │
│   │ Local state    │  │ Dynamic data │ │
│   │ Return state   │  │ Collections  │ │
│   │                │  │              │ │
│   └────────────────┘  └──────────────┘ │
└─────────────────────────────────────────┘
```

The learner should understand:

> **The stack is primarily associated with active execution contexts, while the heap is commonly used as a conceptual model for dynamically managed objects and data.**

---

# 4. Important Warning — Stack/Heap Is a Model

This must be prominently stated.

### Simplified teaching model

```text
STACK
↓
Function execution contexts

HEAP
↓
Dynamically managed objects
```

### Real implementation

The actual organization depends on:

* programming language
* compiler
* interpreter
* runtime
* operating system
* optimization
* garbage collector
* object representation

Therefore:

> **M3 must never claim that every language stores every local variable on a stack and every object on a heap.**

That would be technically misleading.

---

# 5. M3 Stack

The stack can be introduced as:

> **A last-in, first-out structure commonly associated with active function-call execution.**

Simple example:

```text
main()
  ↓
calculate()
  ↓
validate()
```

Conceptual stack:

```text
┌─────────────────────────┐
│ validate()              │ ← current
├─────────────────────────┤
│ calculate()             │
├─────────────────────────┤
│ main()                  │
└─────────────────────────┘
```

This connects directly to **ExecutionBlock E5**.

---

# 6. M3 Stack Frame

Each active call can be represented conceptually as a **stack frame**.

For:

```python
def calculate(x):
    result = x * 2
    return result
```

a conceptual frame might contain:

```text
┌────────────────────────────┐
│ calculate() frame          │
├────────────────────────────┤
│ parameter: x               │
│ local: result              │
│ return information         │
│ execution state            │
└────────────────────────────┘
```

The exact frame contents are runtime-specific.

---

# 7. M3 Nested Calls

Consider:

```python
def main():
    process()

def process():
    calculate()

def calculate():
    return 42

main()
```

Execution:

```text
main()
  ↓
process()
  ↓
calculate()
```

Stack:

```text
┌──────────────────────┐
│ calculate()          │ ← active
├──────────────────────┤
│ process()            │
├──────────────────────┤
│ main()               │
└──────────────────────┘
```

This gives the learner a concrete connection between **function execution and stack growth**.

---

# 8. M3 Stack Push

When a function is called, conceptually:

```text
CALL
 ↓
NEW EXECUTION CONTEXT
 ↓
STACK FRAME ADDED
```

Example:

```text
main()
```

becomes:

```text
┌───────────┐
│ main()    │
└───────────┘
```

Then:

```text
main()
 ↓
process()
```

becomes:

```text
┌───────────┐
│ process() │
├───────────┤
│ main()    │
└───────────┘
```

---

# 9. M3 Stack Pop

When a function returns:

```text
RETURN
 ↓
CURRENT FRAME REMOVED
 ↓
CALLER RESUMES
```

Example:

```text
Before return:

┌─────────────┐
│ calculate() │
├─────────────┤
│ process()   │
├─────────────┤
│ main()      │
└─────────────┘
```

After:

```text
┌─────────────┐
│ process()   │
├─────────────┤
│ main()      │
└─────────────┘
```

This is the conceptual connection:

```text
CALL → PUSH
RETURN → POP
```

---

# 10. M3 Stack Overflow

If calls continue growing without returning:

```text
main()
 ↓
f()
 ↓
f()
 ↓
f()
 ↓
f()
 ↓
...
```

The conceptual stack keeps growing:

```text
┌─────────┐
│ f()     │
├─────────┤
│ f()     │
├─────────┤
│ f()     │
├─────────┤
│ f()     │
├─────────┤
│ ...     │
└─────────┘
```

Eventually the runtime may encounter a stack overflow or recursion-depth limitation.

For Python:

```python
def recurse():
    recurse()

recurse()
```

typically results in a `RecursionError` rather than simply exposing a raw operating-system stack overflow to the Python programmer.

This distinction is important.

---

# 11. M3 Recursion

A classic M3 example:

```python
def countdown(n):
    if n == 0:
        return

    countdown(n - 1)
```

For:

```python
countdown(3)
```

conceptually:

```text
countdown(3)
      ↓
countdown(2)
      ↓
countdown(1)
      ↓
countdown(0)
```

Stack:

```text
┌────────────────┐
│ countdown(0)   │
├────────────────┤
│ countdown(1)   │
├────────────────┤
│ countdown(2)   │
├────────────────┤
│ countdown(3)   │
└────────────────┘
```

When the base case returns:

```text
countdown(0)
 ↓
POP
 ↓
countdown(1)
 ↓
POP
 ↓
countdown(2)
 ↓
POP
 ↓
countdown(3)
```

This makes M3 highly visual.

---

# 12. M3 Heap

The heap is introduced as a conceptual area associated with dynamically managed objects.

Example:

```python
values = [10, 20, 30]
```

Conceptually:

```text
values
   │
   ▼
┌───────────────────┐
│ List Object       │
│                   │
│ [10,20,30]        │
└───────────────────┘
```

The heap model helps explain where dynamically created objects may conceptually reside.

---

# 13. M3 Stack → Heap Relationship

This is the central M3 relationship.

```text
┌──────────────────────┐
│      STACK           │
│                      │
│ current frame        │
│                      │
│ values ──────────────┼──────┐
└──────────────────────┘      │
                              ▼
                       ┌──────────────┐
                       │    HEAP      │
                       │              │
                       │ List Object  │
                       │ [10,20,30]   │
                       └──────────────┘
```

The key idea:

> **Execution state can contain references to objects that are represented separately from the active execution context.**

---

# 14. M3 Local Name and Object

Consider:

```python
def process():
    values = [10, 20]
    return values
```

Conceptual model:

```text
STACK FRAME
┌──────────────────────┐
│ process()            │
│                      │
│ values ──────────────┼──────┐
└──────────────────────┘      │
                              ▼
                         HEAP OBJECT
                         ┌───────────┐
                         │ [10,20]   │
                         └───────────┘
```

This is the strongest M3 diagram.

---

# 15. M3 Function Return

Now:

```python
result = process()
```

When `process()` returns:

```text
process frame
     ↓
returns reference/value
     ↓
frame removed
     ↓
caller receives result
```

Conceptually:

```text
BEFORE RETURN

STACK
┌───────────────┐
│ process()     │───► List Object
├───────────────┤
│ main()        │
└───────────────┘


AFTER RETURN

STACK
┌───────────────┐
│ main()        │───► List Object
└───────────────┘
```

This is an important memory lifecycle concept.

---

# 16. M3 Object Can Outlive a Function Frame

This is a critical lesson.

Suppose:

```python
def create_data():
    values = [10, 20, 30]
    return values

data = create_data()
```

The function frame disappears after return.

But the returned object remains reachable:

```text
BEFORE RETURN

create_data frame
     │
     ▼
 [10,20,30]


AFTER RETURN

main frame
     │
     ▼
 [10,20,30]
```

Therefore:

> **The lifetime of an object is not necessarily identical to the lifetime of the function that created or referenced it.**

This leads naturally into **M4 — Object Lifetime**.

---

# 17. M3 Reference Graph

A more advanced M3 model:

```text
STACK
┌─────────────────────┐
│ data ───────────────┼─────┐
└─────────────────────┘     │
                            ▼
                       ┌─────────┐
                       │ Object A│
                       └────┬────┘
                            │
                            ▼
                       ┌─────────┐
                       │ Object B│
                       └─────────┘
```

This establishes:

```text
STACK REFERENCES
       ↓
OBJECT GRAPH
```

This will become essential for garbage collection later.

---

# 18. M3 Heap Is Not Just “A Big Box”

Avoid teaching:

```text
HEAP = one giant area containing everything
```

Instead:

> **Heap is a conceptual term for dynamically managed storage used by a runtime or program.**

A real runtime can have:

```text
multiple allocation regions
arenas
pools
object-specific storage
buffers
allocator-managed regions
```

These belong to later versions.

---

# 19. M3 Stack vs Heap

The central comparison:

| Concept                 | Stack                             | Heap                             |
| ----------------------- | --------------------------------- | -------------------------------- |
| Primary conceptual role | Active execution contexts         | Dynamically managed objects/data |
| Typical association     | Function calls                    | Objects/collections              |
| Organization            | LIFO-oriented                     | Dynamically managed              |
| Lifetime                | Often tied to active calls        | Can outlive a function           |
| Access                  | Associated with current execution | Through references/handles       |
| Example                 | Call frame                        | List object                      |
| Main M3 purpose         | Explain execution state           | Explain object storage           |

---

# 20. M3 Important Caveat

The table above is a **teaching model**, not a universal implementation specification.

For example:

* optimizing compilers may keep values in registers
* runtimes may optimize allocations
* garbage collectors may move objects
* JIT compilers may transform execution
* language implementations differ
* Python's implementation does not map neatly onto simplistic textbook stack/heap diagrams

Therefore the renderer should label the diagram:

> **Conceptual model**

rather than:

> **Exact memory layout**

---

# 21. M3 Python Example

```python
def calculate(x):
    result = x * 2
    return result

value = calculate(10)
```

Conceptually during `calculate()`:

```text
STACK
┌──────────────────────────┐
│ calculate()              │
│ x = reference/value      │
│ result = reference/value │
│ return state             │
└────────────┬─────────────┘
             │
             ▼
HEAP / OBJECT STORAGE
┌──────────────────────────┐
│ Integer / Object Data    │
│ runtime-managed objects  │
└──────────────────────────┘
```

Again, the exact Python implementation is intentionally abstract.

---

# 22. M3 Python List Example

```python
def build():
    values = [1, 2, 3]
    return values
```

Conceptual:

```text
STACK FRAME
┌─────────────────┐
│ build()         │
│ values ─────────┼────────┐
└─────────────────┘        │
                           ▼
                    ┌─────────────┐
                    │ List Object │
                    │ [1,2,3]     │
                    └─────────────┘
```

After return:

```text
STACK FRAME
┌─────────────────┐
│ caller          │
│ result ─────────┼───────► List Object
└─────────────────┘
```

This is one of the most important M3 demonstrations.

---

# 23. M3 Java Example

Java is particularly useful because the traditional conceptual model is familiar:

```java
Person p = new Person();
```

Conceptually:

```text
STACK
┌───────────────┐
│ p ────────────┼─────┐
└───────────────┘     │
                      ▼
                    HEAP
               ┌─────────────┐
               │ Person      │
               │ Object      │
               └─────────────┘
```

This is a conceptual teaching model; JVM implementations may optimize this.

---

# 24. M3 JavaScript Example

```javascript
function createUser() {
    const user = {
        name: "Alice"
    };

    return user;
}
```

Conceptually:

```text
CALL FRAME
user ─────────► OBJECT
```

After return:

```text
CALLER
result ───────► SAME OBJECT
```

Again:

> The function frame can disappear while the returned object remains reachable.

---

# 25. M3 C++ Example

C++ gives an excellent contrast:

```cpp
void example() {
    int value = 10;
}
```

A simple conceptual model might associate:

```text
value
 ↓
automatic storage
```

with stack-like lifetime.

But:

```cpp
int* p = new int(10);
```

introduces dynamically allocated storage.

Conceptually:

```text
local pointer
     │
     ▼
dynamic object
```

This makes C++ useful for demonstrating why stack/heap terminology can be practical while still requiring careful language-specific explanation.

---

# 26. M3 NumPy Example

Consider:

```python
arr = np.array([10, 20, 30])
```

Conceptually:

```text
STACK / FRAME
┌─────────────────┐
│ arr ────────────┼─────────────┐
└─────────────────┘             │
                                ▼
                       ARRAY OBJECT
                       ┌──────────────┐
                       │ dtype        │
                       │ shape        │
                       │ metadata     │
                       │ data buffer  │
                       └──────┬───────┘
                              │
                              ▼
                        10 20 30
```

This is especially valuable because NumPy has:

> **Python-level array objects + underlying data storage**

which later memory versions can explore more deeply.

---

# 27. M3 Pandas Example

For:

```python
df = pd.DataFrame(...)
```

conceptually:

```text
CURRENT EXECUTION CONTEXT
       │
       │ df
       ▼
┌─────────────────────────┐
│ DataFrame Object        │
├─────────────────────────┤
│ Index                   │
│ Columns                 │
│ Data representation     │
└────────────┬────────────┘
             ↓
       underlying storage
```

The key lesson:

> A high-level object can manage or reference multiple underlying data structures.

---

# 28. M3 Full Stack Example

Suppose an API handler:

```python
def get_user(request):
    user = load_user(request)
    return user
```

Conceptually:

```text
REQUEST HANDLER FRAME
┌──────────────────────────┐
│ request                  │
│ user ────────────────────┼─────┐
└──────────────────────────┘     │
                                  ▼
                            USER OBJECT
```

When the handler returns:

```text
handler frame
     ↓
removed
     ↓
response serialization
     ↓
returned data/object
```

This connects memory concepts to real backend execution.

---

# 29. M3 Data Engineering Example

A pipeline stage:

```python
def transform(batch):
    result = transform_batch(batch)
    return result
```

Conceptually:

```text
TRANSFORM FRAME
┌───────────────────────┐
│ batch ────────────────┼──────► input object
│ result ───────────────┼──────► output object
└───────────────────────┘
```

When the function returns:

```text
caller
 │
 └──► result object
```

This helps explain why large data objects can survive function boundaries.

---

# 30. M3 Data Science Example

During model training:

```text
TRAINING FRAME
┌─────────────────────────┐
│ batch                   │
│ model                   │
│ loss                    │
│ temporary results       │
└────────────┬────────────┘
             │
             ▼
        OBJECT STORAGE
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     data  model  buffers
```

The key idea:

> Execution context and data objects have different conceptual roles.

---

# 31. M3 Cyber Security Example

Consider an authentication request:

```text
REQUEST HANDLER FRAME
┌─────────────────────────┐
│ request                 │
│ identity                │
│ authorization result    │
│ response                │
└────────────┬────────────┘
             │
             ▼
       runtime objects
```

This demonstrates how request-local execution state can reference larger objects such as:

```text
user profile
session state
authorization policy
response
```

---

# 32. M3 Ethical Hacking / Security Lab Example

A defensive testing session may have:

```text
TEST FUNCTION FRAME
┌─────────────────────────┐
│ configuration           │
│ test result             │
│ log context             │
└────────────┬────────────┘
             │
             ▼
       session objects
```

Again, M3 teaches memory organization rather than operational security procedures.

---

# 33. M3 Quantum Computing Example

For a host-side quantum application:

```text
CALL FRAME
┌─────────────────────────┐
│ circuit                 │
│ parameters              │
│ job                     │
└────────────┬────────────┘
             │
             ▼
      runtime-managed
       application objects
```

The tutorial should distinguish:

```text
HOST PROGRAM MEMORY
        ≠
QUANTUM HARDWARE STATE
```

M3 is about the host application's memory model.

---

# 34. M3 Stack Growth

Visual:

```text
CALL 1
┌──────────┐
│ main()   │
└──────────┘

CALL 2
┌──────────┐
│ process()│
├──────────┤
│ main()   │
└──────────┘

CALL 3
┌──────────┐
│ calc()   │
├──────────┤
│ process()│
├──────────┤
│ main()   │
└──────────┘
```

The visual lesson:

> **Nested calls increase the active execution stack.**

---

# 35. M3 Stack Shrinking

Return sequence:

```text
calc()
 ↓
RETURN
```

becomes:

```text
┌──────────┐
│ process()│
├──────────┤
│ main()   │
└──────────┘
```

Then:

```text
process()
 ↓
RETURN
```

becomes:

```text
┌──────────┐
│ main()   │
└──────────┘
```

This provides a natural bridge back to ExecutionBlock.

---

# 36. M3 Stack Frame Lifecycle

The complete conceptual lifecycle:

```text
FUNCTION CALL
      ↓
FRAME CREATED
      ↓
LOCAL EXECUTION
      ↓
NESTED CALLS
      ↓
RETURN
      ↓
FRAME REMOVED
      ↓
CALLER RESUMES
```

This is one of the central M3 diagrams.

---

# 37. M3 Heap Object Lifecycle — Introductory

For an object:

```text
CREATE
  ↓
OBJECT EXISTS
  ↓
REFERENCES
  ↓
USE / MUTATE
  ↓
REFERENCES CHANGE
  ↓
NO LONGER REACHABLE
```

The final stage leads directly into:

> **M4 — Object Lifetime**

M3 should introduce this only briefly.

---

# 38. M3 Stack vs Object Lifetime

Very important:

```text
FUNCTION LIFETIME
      ≠
OBJECT LIFETIME
```

Example:

```python
def create():
    return [1, 2, 3]

data = create()
```

The function frame ends:

```text
create frame → gone
```

but:

```text
data → list object
```

remains.

This is a key M3 conclusion.

---

# 39. M3 Main Visual

The strongest M3 hero visual:

```text
                 RUNNING PROGRAM

        ┌──────────────────────────────┐
        │                              │
        │   STACK          HEAP        │
        │                              │
        │ ┌───────────┐  ┌───────────┐│
        │ │ process() │  │ List      ││
        │ ├───────────┤  │ Object    ││
        │ │ main()    │  │ [1,2,3]   ││
        │ └─────┬─────┘  └─────▲─────┘│
        │       │              │      │
        │       └──────────────┘      │
        │          reference          │
        └──────────────────────────────┘
```

Caption:

> **Execution contexts can reference dynamically managed objects.**

---

# 40. M3 A4 Portrait Layout

Recommended layout:

```text
┌──────────────────────────────────────────────┐
│ MEMORY                                       │
│                                              │
│ Stack / Heap Model                           │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │      STACK          HEAP                 │ │
│ │                                          │ │
│ │ ┌─────────────┐    ┌─────────────────┐  │ │
│ │ │ process()   │───►│ Object          │  │ │
│ │ ├─────────────┤    │ [1,2,3]         │  │ │
│ │ │ main()      │    └─────────────────┘  │ │
│ │ └─────────────┘                         │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ STACK FRAME                                  │
│                                              │
│ CALL → FRAME → RETURN → POP                 │
│                                              │
│ STACK GROWTH                                 │
│ main → process → calculate                  │
│                                              │
│ OBJECT LIFETIME                              │
│                                              │
│ function ends ≠ object necessarily ends    │
│                                              │
│ LANGUAGE EXAMPLES                            │
│ Python • Java • C++ • NumPy • Pandas        │
│                                              │
│ FINAL MENTAL MODEL                           │
└──────────────────────────────────────────────┘
```

---

# 41. M3 Hero Component

The hero should visually show:

```text
STACK
   │
   │ reference
   ▼
HEAP / OBJECT
```

with:

> **Execution state can reference objects.**

This is the conceptual center of the page.

---

# 42. M3 Secondary Visual

A second visual:

```text
CALL
 ↓
PUSH FRAME
 ↓
EXECUTE
 ↓
RETURN
 ↓
POP FRAME
```

This connects M3 to E4/E5.

---

# 43. M3 Third Visual

Object lifetime:

```text
FUNCTION FRAME
      │
      └────► OBJECT

FRAME ENDS
      │
      ▼

CALLER ─────► OBJECT
```

Caption:

> **An object can outlive the function that created it.**

---

# 44. M3 Color Strategy

Primary:

**`#F54A8D`**

Use for:

* MEMORY eyebrow
* stack/heap divider emphasis
* reference arrows
* active stack frame
* lifecycle transitions
* `CALL`
* `RETURN`
* key callouts

Secondary:

**`#0B1B3D`**

Use for:

* title
* stack frames
* heap objects
* labels
* explanatory text
* code
* normal diagram elements

---

# 45. M3 70/30 Color Rule

Approximately:

```text
70%
Navy
White
Neutral surfaces
```

and:

```text
30%
Pink
```

Example:

```text
STACK
┌─────────────┐
│ process()   │  ← Navy
│ main()      │  ← Navy
└──────┬──────┘
       │
       ▼            ← Pink
HEAP
┌─────────────┐
│ List Object │  ← Navy
└─────────────┘
```

Pink identifies the **relationship and transition**, not the entire diagram.

---

# 46. M3 HTML Tag Color Table

| HTML Tag            | Purpose                      | Color       |
| ------------------- | ---------------------------- | ----------- |
| `<section>`         | Root block                   | Neutral     |
| `<header>`          | Header                       | Neutral     |
| `<span>`            | MEMORY eyebrow               | **#F54A8D** |
| `<h2>`              | Main title                   | **#0B1B3D** |
| `<p>`               | Context                      | **#0B1B3D** |
| `<article>`         | Concept card                 | Neutral     |
| `<h3>`              | Section heading              | **#0B1B3D** |
| `<h4>`              | Subheading                   | **#0B1B3D** |
| `<code>`            | Code                         | **#0B1B3D** |
| `<strong>`          | Important term               | **#0B1B3D** |
| `<span>`            | STACK                        | **#0B1B3D** |
| `<span>`            | HEAP                         | **#0B1B3D** |
| `<span>`            | Active frame                 | **#F54A8D** |
| `<span>`            | CALL / RETURN                | **#F54A8D** |
| `<span>`            | Reference arrow/relationship | **#F54A8D** |
| `<div>`             | Diagram container            | Neutral     |
| `<aside>`           | Final mental model           | Neutral     |
| `<h3>` inside aside | Final heading                | **#F54A8D** |
| `<p>` inside aside  | Final explanation            | **#0B1B3D** |

---

# 47. Semantic HTML Structure

```text
<section>
│
├── <header>
│    ├── <span> MEMORY </span>
│    └── <h2> Stack / Heap Model </h2>
│
├── <p>
│
├── <section class="stack-heap">
│    ├── <article class="stack">
│    │    ├── <h3>
│    │    └── stack diagram
│    │
│    └── <article class="heap">
│         ├── <h3>
│         └── object diagram
│
├── <section class="stack-frame">
│    ├── <h3>
│    └── call → push → return → pop
│
├── <section class="object-lifetime">
│    └── diagram
│
├── <section class="language-examples">
│    ├── Python
│    ├── Java
│    ├── C++
│    ├── NumPy
│    └── Pandas
│
└── <aside>
     ├── <h3>
     └── <p>
```

---

# 48. Complete M3 HTML

```html
<section
    class="tutorial-block memory-block memory-m3"
    data-block="memory"
    data-version="M3"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Stack / Heap Model
        </h2>

    </header>


    <p class="memory-context">
        Understand the conceptual relationship between active
        execution contexts and dynamically managed objects.
    </p>


    <section class="stack-heap">

        <article class="stack">

            <h3>
                Stack
            </h3>

            <p>
                Conceptually associated with active function-call
                execution contexts.
            </p>

            <div class="stack-diagram">

                <div>
                    process()
                </div>

                <div>
                    main()
                </div>

            </div>

        </article>


        <article class="heap">

            <h3>
                Heap
            </h3>

            <p>
                Conceptually associated with dynamically managed
                objects and data.
            </p>

            <div class="heap-diagram">

                <div>
                    List Object
                </div>

                <div>
                    [1, 2, 3]
                </div>

            </div>

        </article>

    </section>


    <section class="stack-frame">

        <h3>
            Stack Frame Lifecycle
        </h3>

        <p>
            CALL → PUSH FRAME → EXECUTE → RETURN → POP FRAME
        </p>

    </section>


    <section class="reference-model">

        <h3>
            Stack → Object Reference
        </h3>

        <p>
            A stack frame can contain a reference to an object
            represented separately from the active execution context.
        </p>

    </section>


    <section class="object-lifetime">

        <h3>
            Object Lifetime
        </h3>

        <p>
            A function frame can disappear while an object created
            or referenced by that function remains reachable.
        </p>

    </section>


    <section class="language-examples">

        <h3>
            Real-World Applications
        </h3>

        <article>
            <h4>Python</h4>
            <p>Function frames, references, objects, and recursion.</p>
        </article>

        <article>
            <h4>Java</h4>
            <p>Conceptual stack references to heap-managed objects.</p>
        </article>

        <article>
            <h4>C++</h4>
            <p>Automatic and dynamically allocated storage concepts.</p>
        </article>

        <article>
            <h4>NumPy</h4>
            <p>Array objects and underlying data storage.</p>
        </article>

        <article>
            <h4>Pandas</h4>
            <p>High-level data objects and underlying representations.</p>
        </article>

    </section>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            The stack/heap model is a conceptual way to distinguish
            active execution contexts from dynamically managed objects.
            The exact implementation depends on the language and runtime.
        </p>

    </aside>

</section>
```

---

# 49. M3 JSON Structure

```json
{
  "type": "memory",
  "version": "M3",

  "content": {

    "title": "Stack / Heap Model",

    "context": "Understand the conceptual relationship between active execution contexts and dynamically managed objects.",

    "stack": {

      "purpose": "Active execution contexts",

      "frames": [
        "main()",
        "process()"
      ]

    },

    "heap": {

      "purpose": "Dynamically managed objects and data",

      "objects": [
        {
          "type": "list",
          "value": "[1, 2, 3]"
        }
      ]

    },

    "stackFrameLifecycle": [
      "CALL",
      "PUSH FRAME",
      "EXECUTE",
      "RETURN",
      "POP FRAME"
    ],

    "relationships": [

      {
        "from": "stack-frame",
        "relationship": "references",
        "to": "heap-object"
      }

    ],

    "objectLifetime": {

      "functionFrameCanEnd": true,

      "objectCanRemainReachable": true
    },

    "result": {

      "title": "Final Mental Model",

      "description": "The stack/heap model is a conceptual way to distinguish active execution contexts from dynamically managed objects. The exact implementation depends on the language and runtime."
    }

  }
}
```

---

# 50. Generic M3 JSON Model

For the Tutorial Engine:

```json
{
  "type": "memory",
  "version": "M3",

  "content": {

    "stack": {

      "frames": []
    },

    "heap": {

      "objects": []
    },

    "references": [],

    "lifecycle": {

      "call": {},
      "return": {}
    },

    "objectLifetime": {},

    "languageNotes": [],

    "result": {

      "title": "",
      "description": ""
    }

  }
}
```

---

# 51. M3 Stack Frame JSON

Example:

```json
{
  "frame": {

    "function": "process",

    "locals": [
      {
        "name": "values",
        "reference": "object-001"
      }
    ],

    "returnState": "caller"
  }
}
```

The renderer can visualize:

```text
process()
   │
   └── values ─────► object-001
```

---

# 52. M3 Heap Object JSON

```json
{
  "object": {

    "id": "object-001",

    "type": "list",

    "value": "[10,20,30]"
  }
}
```

The key point is that the tutorial-engine `id` is an **educational object identifier**, not a claim about the object's physical machine address.

---

# 53. M3 Stack Push/Pop JSON

```json
{
  "operations": [

    {
      "operation": "push",
      "frame": "main"
    },

    {
      "operation": "push",
      "frame": "process"
    },

    {
      "operation": "push",
      "frame": "calculate"
    },

    {
      "operation": "pop",
      "frame": "calculate"
    },

    {
      "operation": "pop",
      "frame": "process"
    }

  ]
}
```

This allows an interactive renderer to animate stack growth and shrinking.

---

# 54. M3 Recursion JSON

```json
{
  "recursion": {

    "function": "countdown",

    "calls": [
      "countdown(3)",
      "countdown(2)",
      "countdown(1)",
      "countdown(0)"
    ],

    "returns": [
      "countdown(0)",
      "countdown(1)",
      "countdown(2)",
      "countdown(3)"
    ]

  }
}
```

This is ideal for the M3 recursion visualization.

---

# 55. M3 Stack Overflow Teaching Model

Use:

```text
REPEATED CALL
      ↓
MORE FRAMES
      ↓
STACK GROWS
      ↓
LIMIT REACHED
      ↓
ERROR / FAILURE
```

For Python:

```text
RECURSION
   ↓
Python recursion limit
   ↓
RecursionError
```

Avoid saying:

> “Python always directly fills the C stack until it crashes.”

That is not an appropriate M3 teaching model.

---

# 56. M3 Common Mistakes

### Mistake 1 — Every variable is on the stack

Oversimplification.

Better:

> The language/runtime determines how variables and values are represented.

---

### Mistake 2 — Every object is on the heap

Also too absolute.

Better:

> The heap is a useful conceptual model for dynamically managed objects, but implementations can optimize storage.

---

### Mistake 3 — Stack equals local variables

Not exactly.

A stack frame is better understood as an **execution context**, not merely a container of variables.

---

### Mistake 4 — Heap objects disappear when the function ends

Incorrect.

An object can remain reachable after its creating function returns.

---

# 57. M3 Relationship With M1

M1:

```text
NAME
 ↓
OBJECT
```

M3:

```text
STACK FRAME
     │
     └────► OBJECT
```

Therefore M3 adds the **execution-context dimension** to M1's object model.

---

# 58. M3 Relationship With M2

M2:

```text
a ─────┐
       ├──► OBJECT
b ─────┘
```

M3:

```text
STACK FRAME
     │
     ├── a ────┐
     │         ├──► OBJECT
     │     b ──┘
     │
```

Thus M3 demonstrates that aliases can exist inside active execution contexts.

---

# 59. M3 Relationship With ExecutionBlock

This is one of the strongest cross-block relationships.

ExecutionBlock E5:

```text
main()
 ↓
process()
 ↓
calculate()
```

MemoryBlock M3:

```text
STACK

calculate()
process()
main()
```

ExecutionBlock teaches:

> **What calls what?**

MemoryBlock teaches:

> **What execution state exists while those calls are active?**

---

# 60. M3 Relationship With M4

M3 ends with:

```text
FUNCTION FRAME ENDS
        ≠
OBJECT MUST END
```

That naturally introduces M4:

> **When exactly does an object begin and end its lifetime?**

Therefore:

```text
M3
STACK / HEAP MODEL
       ↓
M4
OBJECT LIFETIME
```

This progression is very clean.

---

# 61. M3 Relationship With M5

M4 will establish:

```text
OBJECT
 ↓
REACHABILITY
 ↓
LIFETIME
```

M5 can then explain:

```text
UNREACHABLE OBJECT
       ↓
GARBAGE COLLECTION
       ↓
RECLAIMED STORAGE
```

M3 provides the conceptual storage model required to understand that lifecycle.

---

# 62. M3 Relationship With M7

M3 says:

```text
STACK
HEAP
```

M7 can later say:

```text
What does the runtime actually do?
```

For example:

```text
allocator
object headers
runtime metadata
managed heap
frames
registers
GC
implementation details
```

Therefore M3 should **not steal M7's job**.

---

# 63. M3 Best Use Cases

| Domain            | Suitability |
| ----------------- | ----------: |
| Python            |       ⭐⭐⭐⭐⭐ |
| Java              |       ⭐⭐⭐⭐⭐ |
| JavaScript        |       ⭐⭐⭐⭐⭐ |
| C/C++             |       ⭐⭐⭐⭐⭐ |
| C#                |       ⭐⭐⭐⭐⭐ |
| OOP               |       ⭐⭐⭐⭐⭐ |
| Algorithms        |       ⭐⭐⭐⭐⭐ |
| NumPy             |        ⭐⭐⭐⭐ |
| Pandas            |        ⭐⭐⭐⭐ |
| Full Stack        |       ⭐⭐⭐⭐⭐ |
| Data Science      |        ⭐⭐⭐⭐ |
| Data Engineering  |       ⭐⭐⭐⭐⭐ |
| Cyber Security    |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking   |        ⭐⭐⭐⭐ |
| Quantum Computing |         ⭐⭐⭐ |
| API Development   |       ⭐⭐⭐⭐⭐ |
| Recursion         |       ⭐⭐⭐⭐⭐ |
| Function Calls    |       ⭐⭐⭐⭐⭐ |

---

# 64. M3 Accessibility

Do not rely only on:

```text
Pink = stack
Navy = heap
```

Use explicit labels:

```text
STACK
Active execution contexts

HEAP
Dynamically managed objects
```

For a reference:

> “The current function frame contains a reference to the list object.”

For lifecycle:

> “The function returns and its frame is removed while the returned object remains reachable.”

---

# 65. M3 Responsive Design

### Desktop

Use two conceptual columns:

```text
┌──────────────┐    ┌──────────────┐
│ STACK        │───►│ HEAP         │
│              │    │              │
│ process()    │    │ List Object  │
│ main()       │    │ [1,2,3]      │
└──────────────┘    └──────────────┘
```

### Mobile

Stack vertically:

```text
STACK
  ↓
REFERENCE
  ↓
HEAP
  ↓
OBJECT
```

The renderer should preserve the relationship rather than simply shrinking the desktop diagram.

---

# 66. M3 Animation

M3 benefits strongly from optional animation.

### Step 1

```text
main()
```

### Step 2

```text
main()
process()
```

### Step 3

```text
main()
process()
calculate()
```

### Step 4

```text
calculate() returns
```

### Step 5

```text
main()
process()
```

### Step 6

```text
process() returns
```

### Step 7

```text
main()
```

This animation teaches:

> **CALL → PUSH → EXECUTE → RETURN → POP**

without requiring a long textual explanation.

---

# 67. M3 Information Density

| Component             | Recommendation |
| --------------------- | -------------: |
| Stack/heap hero       |              1 |
| Stack-frame lifecycle |              1 |
| Push/pop visual       |              1 |
| Object reference      |              1 |
| Object lifetime       |              1 |
| Recursion example     |              1 |
| Language examples     |            3–5 |
| Long paragraphs       |              ❌ |
| Exact runtime layout  |              ❌ |
| Hardware internals    |              ❌ |

---

# 68. M3 Validation Rules

| Field                      |     Required |
| -------------------------- | -----------: |
| `type`                     |            ✅ |
| `version`                  |       **M3** |
| `title`                    |        **✅** |
| Stack                      | **Required** |
| Stack frame                | **Required** |
| Heap                       | **Required** |
| Reference relationship     | **Required** |
| Push/pop                   |  Recommended |
| Function call              | **Required** |
| Return                     | **Required** |
| Object lifetime            |  Recommended |
| Recursion                  |  Recommended |
| Exact physical layout      |            ❌ |
| Runtime-specific internals |            ❌ |

---

# 69. M3 Final Technical Specification

| Area                     | M3 Decision                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Block**                | **MemoryBlock**                                                                           |
| **Version**              | **M3**                                                                                    |
| **Name**                 | **Stack / Heap Model**                                                                    |
| **Main question**        | **How can execution contexts and dynamically managed objects be conceptually organized?** |
| **Hero**                 | **STACK → REFERENCE → HEAP OBJECT**                                                       |
| **Stack**                | **Core**                                                                                  |
| **Stack frame**          | **Core**                                                                                  |
| **Push**                 | **Core**                                                                                  |
| **Pop**                  | **Core**                                                                                  |
| **Function call**        | **Core**                                                                                  |
| **Return**               | **Core**                                                                                  |
| **Heap**                 | **Core**                                                                                  |
| **Object reference**     | **Core**                                                                                  |
| **Recursion**            | Recommended                                                                               |
| **Stack overflow**       | Introductory                                                                              |
| **Object lifetime**      | Introductory                                                                              |
| **Exact implementation** | ❌                                                                                         |
| **Hardware internals**   | ❌                                                                                         |
| **GC internals**         | ❌                                                                                         |
| **Primary**              | **#F54A8D**                                                                               |
| **Secondary**            | **#0B1B3D**                                                                               |
| **Color contribution**   | **70% / 30%**                                                                             |
| **Theme**                | Light                                                                                     |
| **Gradient**             | ❌                                                                                         |
| **Dark theme**           | ❌                                                                                         |
| **A4**                   | **Portrait**                                                                              |
| **Animation**            | Optional                                                                                  |
| **JSON-driven**          | **✅**                                                                                     |
| **Responsive**           | **✅**                                                                                     |
| **Accessibility**        | **Required**                                                                              |
| **Learning level**       | **Intermediate**                                                                          |

---

# 70. M3 Final Mental Model

Everything in M3 should eventually collapse into:

```text
                         RUNNING PROGRAM
                                │
               ┌────────────────┴────────────────┐
               │                                 │
               ▼                                 ▼
           STACK                              HEAP
               │                                 │
        ┌──────┴──────┐                   ┌─────┴─────┐
        │             │                   │           │
   calculate()    process()          Object A     Object B
        │             │
        └──────┬──────┘
               │
               │ reference
               └──────────────────────────► Object A
```

And the lifecycle:

```text
FUNCTION CALL
      ↓
STACK FRAME CREATED
      ↓
LOCAL EXECUTION
      ↓
REFERENCES OBJECT
      ↓
RETURN
      ↓
STACK FRAME REMOVED
      ↓
CALLER RESUMES
      ↓
OBJECT MAY STILL EXIST
```

The defining principle of **M3** is:

> **The stack/heap model is a conceptual way to distinguish active execution contexts from dynamically managed objects. A function call can create an execution context that references objects whose lifetime may extend beyond that function's execution. The exact physical organization is language- and runtime-dependent.**

---

## MemoryBlock Progress

| Version | Name                                        | Status         |
| ------- | ------------------------------------------- | -------------- |
| **M1**  | Memory Fundamentals / Memory Representation | ✅              |
| **M2**  | References / Object Identity                | ✅              |
| **M3**  | **Stack / Heap Model**                      | ✅ **Complete** |
| **M4**  | Object Lifetime                             | ⏳              |
| **M5**  | Garbage Collection                          | ⏳              |
| **M6**  | Memory Optimization                         | ⏳              |
| **M7**  | Runtime / Internal Memory                   | ⏳              |
| **M8**  | Complete Memory Lifecycle                   | ⏳              |

**Next version: M4 — Object Lifetime.**



```python

```

# BLOCK 8 — MemoryBlock

# M2 — Variable → Object

We will now follow the **committed MemoryBlock sequence exactly**.

```text
M1 → Simple Memory Concept
M2 → Variable → Object   ← CURRENT
M3 → Reference Model
M4 → Stack / Heap
M5 → Object Memory Layout
M6 → Memory Before / After
M7 → Lifecycle / Allocation / Deallocation
M8 → Complete Memory Model
```

M2 must therefore **not yet teach the full reference/aliasing model**. That belongs to **M3**.

The purpose of M2 is much more focused:

> **Teach the learner that a variable/name is associated with an object, and establish the fundamental Variable → Object relationship.**

---

# 1. M2 — Version Definition

| Item                 | M2 Specification                                                            |
| -------------------- | --------------------------------------------------------------------------- |
| **Block**            | MemoryBlock                                                                 |
| **Version**          | **M2**                                                                      |
| **Presentation**     | **Variable → Object**                                                       |
| **Primary question** | **“When I create a variable, what does that variable represent?”**          |
| **Purpose**          | Establish the conceptual relationship between a variable/name and an object |
| **Learning level**   | Foundation → Intermediate                                                   |
| **Prerequisite**     | M1 — Simple Memory Concept                                                  |
| **Next dependency**  | M3 — Reference Model                                                        |
| **Primary colour**   | **#F54A8D**                                                                 |
| **Secondary colour** | **#0B1B3D**                                                                 |
| **Colour rule**      | **70% / 30%**                                                               |
| **Theme**            | Light                                                                       |
| **Gradient**         | ❌                                                                           |
| **Dark theme**       | ❌                                                                           |
| **Page**             | A4 Portrait                                                                 |

---

# 2. The Core Idea

Suppose we write:

```python
x = 10
```

A beginner may imagine:

```text
x
↓
10
```

That is acceptable as a first mental model.

But the more useful conceptual model is:

```text
VARIABLE / NAME
       │
       │ associated with
       ▼
     OBJECT
       │
       ▼
      10
```

So M2 introduces:

```text
NAME
 ↓
OBJECT
 ↓
VALUE / STATE
```

The critical distinction is:

> **The variable/name is not the object itself.**

---

# 3. M2 Main Teaching Statement

The hero statement should be:

> **A variable gives us a name through which we can work with an object.**

Then immediately show:

```text
x
│
▼
┌──────────────┐
│    OBJECT    │
│              │
│      10      │
└──────────────┘
```

This is the central visual of M2.

---

# 4. Why M2 Comes Before M3

The sequence is deliberate.

### M2

```text
x
 ↓
OBJECT
```

### M3

```text
x ─────┐
       ├──► OBJECT
y ─────┘
```

M2 asks:

> **What is the relationship between one name and one object?**

M3 asks:

> **What happens when multiple names refer to objects?**

Therefore M2 should **not overload the learner with aliasing, identity, or `is`**.

Those belong primarily to M3.

---

# 5. M2 Simple Example

```python
x = 10
```

Visual:

```text
┌──────────────┐
│      x       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    OBJECT    │
│      10      │
└──────────────┘
```

The learner should understand:

```text
x
```

is a name used by the program to work with the object.

---

# 6. M2 String Example

```python
name = "Alice"
```

Conceptually:

```text
name
 │
 ▼
┌─────────────────┐
│ String Object   │
│                 │
│     "Alice"     │
└─────────────────┘
```

The variable name:

```text
name
```

and the object:

```text
"Alice"
```

are conceptually distinct.

---

# 7. M2 List Example

```python
numbers = [10, 20, 30]
```

Conceptual model:

```text
numbers
   │
   ▼
┌──────────────────┐
│   List Object    │
├──────────────────┤
│ 10               │
│ 20               │
│ 30               │
└──────────────────┘
```

This introduces an important progression:

```text
x = 10
```

and:

```text
numbers = [10,20,30]
```

use the same fundamental model:

```text
NAME
 ↓
OBJECT
```

The object can simply have a more complex structure.

---

# 8. M2 Dictionary Example

```python
user = {
    "name": "Alice",
    "age": 25
}
```

Conceptually:

```text
user
 │
 ▼
┌────────────────────────┐
│ Dictionary Object      │
├────────────────────────┤
│ name → "Alice"         │
│ age  → 25              │
└────────────────────────┘
```

This demonstrates that the object may contain multiple pieces of data.

---

# 9. M2 Object Type

M2 should introduce:

```text
NAME
 ↓
OBJECT
 ↓
TYPE
 ↓
VALUE / STATE
```

For example:

```python
age = 25
```

Conceptually:

```text
age
 │
 ▼
┌──────────────────┐
│ Object           │
├──────────────────┤
│ Type: integer    │
│ Value: 25        │
└──────────────────┘
```

For:

```python
name = "Alice"
```

```text
name
 │
 ▼
┌──────────────────┐
│ Object           │
├──────────────────┤
│ Type: string     │
│ Value: Alice     │
└──────────────────┘
```

---

# 10. M2 The Three-Layer Model

This should be one of the major visual components:

```text
┌──────────────────┐
│      NAME        │
│       x          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     OBJECT       │
│                  │
│ Type: int        │
│ Value: 10        │
└──────────────────┘
```

The learner now sees:

```text
NAME
 ↓
OBJECT
 ↓
TYPE + VALUE/STATE
```

---

# 11. M2 Variable Reassignment

Consider:

```python
x = 10
x = 20
```

M2 should introduce this carefully.

Initial state:

```text
x
│
▼
┌──────────────┐
│ Object       │
│ 10           │
└──────────────┘
```

After:

```python
x = 20
```

conceptually:

```text
x
│
▼
┌──────────────┐
│ Object       │
│ 20           │
└──────────────┘
```

The important lesson:

> **The name `x` can become associated with a different object/value during program execution.**

Do not yet dive into object lifetime or deallocation. That is M7.

---

# 12. M2 Variable Does Not Mean “Permanent Storage Box”

This is an important correction to beginner thinking.

Avoid:

```text
┌───────┐
│   x   │
│  10   │
└───────┘
```

as the only mental model.

That can make learners think:

> “The variable is a physical box containing the value.”

Instead use:

```text
x ─────► OBJECT
```

because this prepares the learner for M3.

---

# 13. M2 Why the Arrow Matters

The arrow:

```text
x ─────► object
```

represents the conceptual relationship.

It means:

> **The name `x` is associated with / refers to the object.**

At M2, we don't need to explain every detail of what a reference is.

That is M3.

This is an intentional abstraction boundary.

---

# 14. M2 Python

Python provides an excellent example:

```python
name = "Alice"
age = 25
scores = [80, 90, 95]
```

Conceptually:

```text
name ─────► "Alice"

age ──────► 25

scores ───► [80,90,95]
```

All three follow the same basic pattern:

```text
NAME → OBJECT
```

---

# 15. M2 JavaScript

```javascript
const name = "Alice";
const age = 25;
const scores = [80, 90, 95];
```

Conceptually:

```text
name ─────► String Object

age ──────► Number Value/Object model

scores ───► Array Object
```

The precise language semantics differ, but the educational relationship is useful:

```text
NAME
 ↓
VALUE / OBJECT
```

---

# 16. M2 Java

```java
String name = "Alice";
Person person = new Person();
```

Conceptually:

```text
name
 │
 ▼
String value/object

person
 │
 ▼
Person object
```

M2 establishes the name-to-object/value relationship before M3 discusses references in greater depth.

---

# 17. M2 C++

C++ requires slightly more careful wording.

```cpp
int age = 25;
```

Conceptually:

```text
age
 ↓
int value
25
```

And:

```cpp
Person person;
```

conceptually:

```text
person
 ↓
Person object
```

The renderer should therefore support both:

```text
NAME → VALUE
```

and:

```text
NAME → OBJECT
```

depending on language semantics.

---

# 18. M2 NumPy

```python
arr = np.array([10, 20, 30])
```

Conceptual model:

```text
arr
 │
 ▼
┌──────────────────────┐
│ ndarray Object       │
├──────────────────────┤
│ shape                │
│ dtype                │
│ data representation  │
└──────────────────────┘
```

This is valuable because learners see that an apparently simple variable can represent a complex runtime object.

---

# 19. M2 Pandas

```python
df = pd.DataFrame(data)
```

Conceptually:

```text
df
 │
 ▼
┌────────────────────────┐
│ DataFrame Object       │
├────────────────────────┤
│ rows                   │
│ columns                │
│ index                  │
│ underlying data        │
└────────────────────────┘
```

Again:

```text
df
 ↓
OBJECT
```

---

# 20. M2 Full Stack Example

Consider:

```python
request = incoming_request
```

Conceptually:

```text
request
   │
   ▼
┌─────────────────────┐
│ Request Object      │
├─────────────────────┤
│ headers             │
│ body                │
│ method              │
│ path                │
└─────────────────────┘
```

This gives the learner a practical backend example.

---

# 21. M2 Data Engineering Example

```python
batch = load_batch()
```

Conceptually:

```text
batch
  │
  ▼
┌─────────────────────┐
│ Data Batch Object   │
├─────────────────────┤
│ records             │
│ metadata            │
│ schema              │
└─────────────────────┘
```

The variable `batch` provides a convenient name for working with that object.

---

# 22. M2 Data Science Example

```python
model = LinearRegression()
```

Conceptually:

```text
model
  │
  ▼
┌─────────────────────┐
│ Model Object        │
├─────────────────────┤
│ parameters          │
│ configuration       │
│ learned state       │
└─────────────────────┘
```

This shows that an object can represent a sophisticated computational entity.

---

# 23. M2 Cyber Security Example

```python
user = authenticate(request)
```

Conceptually:

```text
user
 │
 ▼
┌─────────────────────┐
│ User Object         │
├─────────────────────┤
│ identity            │
│ roles               │
│ permissions         │
└─────────────────────┘
```

This is useful because it connects the memory concept to authentication and authorization.

---

# 24. M2 Ethical Hacking Example

In a controlled security lab:

```python
target = load_lab_target()
```

Conceptually:

```text
target
   │
   ▼
┌─────────────────────┐
│ Lab Target Object   │
├─────────────────────┤
│ configuration       │
│ metadata            │
│ test state          │
└─────────────────────┘
```

The point is simply the variable/object relationship.

---

# 25. M2 Quantum Computing Example

Host-side application:

```python
circuit = QuantumCircuit(...)
```

Conceptually:

```text
circuit
   │
   ▼
┌────────────────────────┐
│ Circuit Object         │
├────────────────────────┤
│ gates                  │
│ qubits                 │
│ circuit configuration  │
└────────────────────────┘
```

Again:

```text
NAME → OBJECT
```

---

# 26. M2 Object Can Be Complex

A critical realization:

```text
x = 10
```

and:

```text
model = NeuralNetwork(...)
```

have fundamentally different object complexity, but the conceptual relationship remains:

```text
x
 ↓
OBJECT

model
 ↓
OBJECT
```

The object can be:

```text
primitive-like value
collection
class instance
function
array
DataFrame
model
request
database connection
```

depending on the language/runtime.

---

# 27. M2 Type Is a Property of the Object/Value Model

For Python:

```python
x = 10
```

```text
x
 ↓
OBJECT
 ├── type → int
 └── value → 10
```

Then:

```python
x = "hello"
```

```text
x
 ↓
OBJECT
 ├── type → str
 └── value → "hello"
```

This prepares the learner for dynamic typing without prematurely entering the complete type-system chapter.

---

# 28. M2 Dynamic Rebinding

Python:

```python
x = 10
x = "hello"
x = [1, 2, 3]
```

Conceptually:

```text
x ─────► Integer Object

       ↓

x ─────► String Object

       ↓

x ─────► List Object
```

The important lesson:

> **The same name can participate in different object associations at different points in execution.**

This is especially useful for Python.

---

# 29. M2 But Avoid This Misconception

Do not teach:

> “The variable changes its type.”

Better:

> **The name becomes associated with an object of a different type.**

This wording prepares the learner for M3.

---

# 30. M2 Assignment

M2 should define assignment conceptually:

```python
x = expression
```

as:

```text
EVALUATE EXPRESSION
       ↓
OBTAIN RESULT / OBJECT
       ↓
ASSOCIATE NAME
       ↓
NAME → OBJECT
```

Example:

```python
x = 10 + 20
```

Conceptually:

```text
10 + 20
   ↓
  30
   ↓
x ─────► OBJECT
```

---

# 31. M2 Assignment Flow

Hero sub-diagram:

```text
EXPRESSION
    │
    ▼
EVALUATION
    │
    ▼
OBJECT / VALUE
    │
    ▼
NAME ASSOCIATION
    │
    ▼
NAME ─────► OBJECT
```

This is extremely useful for later ExecutionBlock integration.

---

# 32. M2 Expression Example

```python
x = 10 + 20
```

Do not represent it merely as:

```text
x = 30
```

Instead:

```text
10 + 20
   │
   ▼
  30
   │
   ▼
x ─────► 30
```

The learner sees that the right-hand side is evaluated first.

---

# 33. M2 Function Return

```python
def get_value():
    return 42

x = get_value()
```

Conceptually:

```text
get_value()
     ↓
    42
     ↓
x ─────► OBJECT / VALUE
```

This is an excellent bridge to ExecutionBlock.

---

# 34. M2 Function Result With Complex Object

```python
def create_user():
    return User("Alice")

user = create_user()
```

Conceptually:

```text
create_user()
     │
     ▼
User Object
     │
     ▼
user
```

This demonstrates that a function can produce an object that becomes associated with a name.

---

# 35. M2 Assignment vs Copy

This distinction should be introduced carefully but **not fully explained yet**.

```python
a = [1,2,3]
b = a
```

At M2 we can say:

> `b = a` associates another name with the result represented by `a`; the detailed reference/aliasing consequences are covered in **M3 — Reference Model**.

This is an important boundary.

Do not fully teach aliasing here.

---

# 36. M2 What Belongs in M2

### Core

* variable/name
* object
* value
* state
* type
* assignment
* expression evaluation
* name association
* reassignment
* simple object representation

### Supporting

* primitive values
* collections
* class instances
* function return values
* NumPy arrays
* Pandas DataFrames

---

# 37. M2 What Does NOT Belong Yet

These should primarily wait for later versions:

| Concept                          | Version |
| -------------------------------- | ------- |
| Multiple names sharing an object | **M3**  |
| Aliasing                         | **M3**  |
| Object identity                  | **M3**  |
| `is`                             | **M3**  |
| Detailed references              | **M3**  |
| Stack                            | **M4**  |
| Heap                             | **M4**  |
| Object header                    | **M5**  |
| Object memory layout             | **M5**  |
| Before/after memory state        | **M6**  |
| Allocation                       | **M7**  |
| Deallocation                     | **M7**  |
| Garbage collection               | **M7**  |
| Complete memory lifecycle        | **M8**  |

This keeps the eight-version progression clean.

---

# 38. M2 Main A4 Layout

```text
┌──────────────────────────────────────────────┐
│ MEMORY                                       │
│                                              │
│ Variable → Object                            │
│                                              │
│ A variable gives us a name through which     │
│ we work with an object.                      │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │          x                               │ │
│ │          │                               │ │
│ │          ▼                               │ │
│ │   ┌───────────────┐                      │ │
│ │   │    OBJECT     │                      │ │
│ │   │      10       │                      │ │
│ │   └───────────────┘                      │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ NAME → OBJECT → TYPE + VALUE                 │
│                                              │
│ ASSIGNMENT                                   │
│ expression → result → name association      │
│                                              │
│ REASSIGNMENT                                 │
│ x → object A                                 │
│       ↓                                      │
│ x → object B                                 │
│                                              │
│ REAL-WORLD OBJECTS                           │
│ Python • JavaScript • Java • C++            │
│ NumPy • Pandas • Backend • Data             │
│                                              │
│ FINAL MENTAL MODEL                           │
└──────────────────────────────────────────────┘
```

---

# 39. M2 Hero Visual

The hero should be deliberately simple:

```text
             x
             │
             │
             ▼
      ┌──────────────┐
      │    OBJECT    │
      │              │
      │      10      │
      └──────────────┘
```

With:

> **Variable → Object**

The arrow is the primary visual accent.

---

# 40. M2 Secondary Visual

```text
NAME
 │
 ▼
OBJECT
 │
 ├── TYPE
 │
 └── VALUE / STATE
```

This is the conceptual structure the learner should remember.

---

# 41. M2 Assignment Visual

```text
┌──────────────┐
│ 10 + 20      │
└──────┬───────┘
       │
       ▼
      30
       │
       ▼
      x ─────► OBJECT
```

This shows:

```text
expression
    ↓
evaluation
    ↓
object/value
    ↓
name
```

---

# 42. M2 Reassignment Visual

```text
BEFORE

x ─────► OBJECT A
          │
          ▼
         10


AFTER

x ─────► OBJECT B
          │
          ▼
         20
```

The original object should be visually faded rather than deleted if animation is enabled.

This prepares M6.

---

# 43. M2 Colour Strategy

We continue your established brand colours:

### Primary

**`#F54A8D`**

Use for:

* MEMORY eyebrow
* arrows
* `Variable → Object`
* active variable
* key relationship
* assignment transition
* important keywords
* active diagram connector

### Secondary

**`#0B1B3D`**

Use for:

* title
* object container
* labels
* code
* explanatory content
* type
* value
* normal diagram text

### Neutral

Use white/light neutral surfaces for:

* cards
* object containers
* background
* spacing areas

---

# 44. M2 70% / 30% Rule

The visual hierarchy should approximately follow:

```text
70%
────────────────────────
Navy
White
Light neutral
Normal content
Object surfaces
```

and:

```text
30%
────────────────────────
Pink
Relationships
Arrows
Active concepts
Important labels
```

The page should **not** become 30% pink backgrounds.

The pink is an **instructional accent**, not the dominant surface.

---

# 45. M2 HTML Tag Colour Table

As requested, every version will continue to explicitly identify the HTML tags and their colour roles.

| HTML Tag            | Purpose                    | Colour                |
| ------------------- | -------------------------- | --------------------- |
| `<section>`         | Root MemoryBlock container | Neutral               |
| `<header>`          | Block header               | Neutral               |
| `<span>`            | `MEMORY` eyebrow           | **Primary #F54A8D**   |
| `<h2>`              | `Variable → Object`        | **Secondary #0B1B3D** |
| `<p>`               | Introductory explanation   | **Secondary #0B1B3D** |
| `<article>`         | Concept cards              | Neutral               |
| `<h3>`              | Major section titles       | **Secondary #0B1B3D** |
| `<h4>`              | Subsections                | **Secondary #0B1B3D** |
| `<code>`            | Code examples              | **Secondary #0B1B3D** |
| `<strong>`          | Important terminology      | **Secondary #0B1B3D** |
| `<span>`            | Variable/name              | **Primary #F54A8D**   |
| `<span>`            | Arrow / relationship       | **Primary #F54A8D**   |
| `<span>`            | Object label               | **Secondary #0B1B3D** |
| `<span>`            | Type                       | **Secondary #0B1B3D** |
| `<span>`            | Value                      | **Secondary #0B1B3D** |
| `<div>`             | Diagram container          | Neutral               |
| `<aside>`           | Final mental model         | Neutral               |
| `<h3>` in `<aside>` | Final heading              | **Primary #F54A8D**   |
| `<p>` in `<aside>`  | Final explanation          | **Secondary #0B1B3D** |

---

# 46. Semantic HTML Structure

```text
<section>
│
├── <header>
│   ├── <span> MEMORY </span>
│   └── <h2> Variable → Object </h2>
│
├── <p>
│
├── <section class="variable-object">
│   ├── <h3>
│   └── hero diagram
│
├── <section class="object-model">
│   ├── <h3>
│   └── NAME → OBJECT → TYPE + VALUE
│
├── <section class="assignment">
│   ├── <h3>
│   └── expression → result → name
│
├── <section class="reassignment">
│   ├── <h3>
│   └── before / after
│
├── <section class="examples">
│   ├── Python
│   ├── JavaScript
│   ├── Java
│   ├── C++
│   ├── NumPy
│   └── Pandas
│
└── <aside>
    ├── <h3>
    └── <p>
```

---

# 47. Complete M2 HTML

```html
<section
    class="tutorial-block memory-block memory-m2"
    data-block="memory"
    data-version="M2"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Variable → Object
        </h2>

    </header>


    <p class="memory-context">
        A variable gives us a name through which we work
        with an object.
    </p>


    <section class="variable-object">

        <h3>
            Variable → Object
        </h3>

        <div class="variable-object-diagram">

            <span class="variable-name">
                x
            </span>

            <span class="relationship-arrow">
                ↓
            </span>

            <article class="object-card">

                <h4>
                    OBJECT
                </h4>

                <span class="object-value">
                    10
                </span>

            </article>

        </div>

    </section>


    <section class="object-model">

        <h3>
            The Object Model
        </h3>

        <div class="object-model-diagram">

            <div>
                NAME
            </div>

            <div>
                ↓
            </div>

            <div>
                OBJECT
            </div>

            <div>
                ↓
            </div>

            <div>
                TYPE + VALUE / STATE
            </div>

        </div>

    </section>


    <section class="assignment">

        <h3>
            Assignment
        </h3>

        <code>
            x = 10 + 20
        </code>

        <p>
            The expression is evaluated, producing a result,
            and the name is associated with that result.
        </p>

        <div class="assignment-flow">

            <span>
                Expression
            </span>

            <span>
                →
            </span>

            <span>
                Result
            </span>

            <span>
                →
            </span>

            <span>
                x → Object
            </span>

        </div>

    </section>


    <section class="reassignment">

        <h3>
            Reassignment
        </h3>

        <div class="before">

            <h4>
                Before
            </h4>

            <p>
                x → Object A → 10
            </p>

        </div>

        <div class="after">

            <h4>
                After
            </h4>

            <p>
                x → Object B → 20
            </p>

        </div>

    </section>


    <section class="examples">

        <h3>
            Real-World Examples
        </h3>

        <article>
            <h4>Python</h4>
            <code>user = {"name": "Alice"}</code>
        </article>

        <article>
            <h4>JavaScript</h4>
            <code>const user = { name: "Alice" };</code>
        </article>

        <article>
            <h4>Java</h4>
            <code>Person person = new Person();</code>
        </article>

        <article>
            <h4>C++</h4>
            <code>Person person;</code>
        </article>

        <article>
            <h4>NumPy</h4>
            <code>arr = np.array([10, 20, 30])</code>
        </article>

        <article>
            <h4>Pandas</h4>
            <code>df = pd.DataFrame(data)</code>
        </article>

    </section>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            A variable provides a name through which a program
            works with an object. The object has a type and
            value or state. Assignment establishes or changes
            the association between the name and the object.
        </p>

    </aside>

</section>
```

---

# 48. M2 JSON Structure

```json
{
  "type": "memory",
  "version": "M2",

  "presentation": "Variable → Object",

  "content": {

    "title": "Variable → Object",

    "context": "A variable gives us a name through which we work with an object.",

    "variableObject": {

      "name": "x",

      "object": {
        "type": "int",
        "value": 10
      }

    },

    "objectModel": {

      "name": "x",

      "object": {
        "type": "int",
        "value": 10,
        "state": null
      }

    },

    "assignment": {

      "expression": "10 + 20",

      "result": 30,

      "name": "x"
    },

    "reassignment": {

      "before": {
        "name": "x",
        "object": "object-A",
        "value": 10
      },

      "after": {
        "name": "x",
        "object": "object-B",
        "value": 20
      }

    },

    "result": {

      "title": "Final Mental Model",

      "description": "A variable provides a name through which a program works with an object. The object has a type and value or state. Assignment establishes or changes the association between the name and the object."

    }

  }
}
```

---

# 49. Generic M2 JSON Schema

For the Tutorial Engine renderer:

```json
{
  "type": "memory",
  "version": "M2",

  "content": {

    "variable": {
      "name": "",
      "objectId": ""
    },

    "objects": [],

    "assignment": {
      "expression": "",
      "result": ""
    },

    "reassignment": {
      "before": {},
      "after": {}
    },

    "examples": [],

    "result": {
      "title": "",
      "description": ""
    }

  }
}
```

---

# 50. M2 Object JSON

Example:

```json
{
  "id": "object-001",
  "type": "list",
  "value": "[10,20,30]",
  "state": {
    "length": 3
  }
}
```

The `id` here is a **Tutorial Engine conceptual identifier**.

It does **not** represent a physical memory address.

---

# 51. M2 Variable JSON

```json
{
  "name": "numbers",
  "objectId": "object-001"
}
```

The renderer can generate:

```text
numbers
   │
   ▼
object-001
```

and then resolve the object:

```text
object-001
↓
List
↓
[10,20,30]
```

---

# 52. M2 Assignment JSON

```json
{
  "assignment": {

    "expression": "10 + 20",

    "evaluation": {
      "result": 30
    },

    "binding": {
      "name": "x",
      "objectId": "object-001"
    }

  }
}
```

This gives the renderer enough information to produce:

```text
10 + 20
   ↓
  30
   ↓
x ───► Object
```

---

# 53. M2 Reassignment JSON

```json
{
  "reassignment": {

    "name": "x",

    "before": {
      "objectId": "object-001",
      "value": 10
    },

    "after": {
      "objectId": "object-002",
      "value": 20
    }

  }
}
```

This becomes the basis for the M6 **Before / After** model later.

---

# 54. M2 Interactive Animation

M2 can have a simple four-step animation.

### Step 1

```text
EXPRESSION

10 + 20
```

### Step 2

```text
RESULT

30
```

### Step 3

```text
NAME

x
```

### Step 4

```text
x ─────► OBJECT
          30
```

The learner sees:

```text
expression
    ↓
evaluation
    ↓
result
    ↓
name → object
```

This is much better than simply displaying:

```text
x = 30
```

---

# 55. M2 Reassignment Animation

Start:

```text
x ─────► Object A
          10
```

Then show:

```text
x
│
▼
Object B
20
```

The visual transition should emphasize:

```text
x
↓
association changes
```

rather than implying:

```text
Object A magically becomes Object B
```

This distinction will become even more important in M6 and M7.

---

# 56. M2 Common Beginner Mistakes

### Mistake 1

Thinking:

```text
x = 10
```

means:

> “The variable x is a physical box containing 10.”

Better:

```text
x ─────► object
```

---

### Mistake 2

Thinking the variable itself has to be the object.

Instead:

```text
NAME ≠ OBJECT
```

conceptually.

---

### Mistake 3

Thinking reassignment necessarily mutates the old object.

For:

```python
x = 10
x = 20
```

the important operation is the change in the name's association.

Mutation is a different concept.

---

### Mistake 4

Assuming all languages implement variables identically.

The Tutorial Engine should distinguish:

```text
CONCEPTUAL MODEL
```

from:

```text
LANGUAGE IMPLEMENTATION
```

---

# 57. M2 Cross-Block Relationships

### M1 → M2

M1:

```text
PROGRAM
 ↓
MEMORY
```

M2:

```text
MEMORY
 ↓
NAME → OBJECT
```

---

### M2 → M3

M2:

```text
x ─────► OBJECT
```

M3:

```text
x ─────┐
       ├──► OBJECT
y ─────┘
```

M3 adds:

> **reference relationships and sharing.**

---

### M2 → M4

M2:

```text
x → OBJECT
```

M4:

```text
STACK FRAME
     │
     └── x → OBJECT
```

---

### M2 → M5

M2:

```text
x → OBJECT
```

M5:

```text
x → OBJECT
       │
       ├── object metadata
       ├── type information
       ├── state
       └── internal representation
```

---

### M2 → M6

M2:

```text
x → Object A
```

M6:

```text
BEFORE
x → A

AFTER
x → B
```

---

### M2 → M7

M2 establishes:

```text
NAME → OBJECT
```

M7 eventually explains:

```text
OBJECT CREATED
      ↓
ALLOCATED
      ↓
USED
      ↓
NO LONGER NEEDED
      ↓
DEALLOCATED / RECLAIMED
```

---

# 58. M2 Accessibility

The diagram must not rely on colour alone.

Instead of:

```text
Pink arrow = relationship
```

also label it:

> **associated with**

For example:

```text
x
│
│ associated with
▼
OBJECT
```

This remains understandable for users with colour-vision differences.

---

# 59. M2 Responsive Layout

### Desktop

```text
┌──────────────┐
│ NAME         │
│      ↓       │
│ OBJECT       │
└──────────────┘
```

### Mobile

The same structure should become:

```text
NAME
 ↓
OBJECT
 ↓
TYPE
 ↓
VALUE / STATE
```

No horizontal squeezing.

---

# 60. M2 Information Density

| Component                      | Recommendation |
| ------------------------------ | -------------: |
| Main Variable → Object diagram |          **1** |
| Object model diagram           |          **1** |
| Assignment flow                |          **1** |
| Reassignment diagram           |          **1** |
| Language examples              |        **4–6** |
| Real-world examples            |        **3–5** |
| Long paragraphs                |              ❌ |
| Aliasing                       |              ❌ |
| Detailed identity              |              ❌ |
| Stack / Heap                   |              ❌ |
| Allocation                     |              ❌ |

M2 must remain conceptually clean.

---

# 61. M2 Validation Rules

| Field           |              Required |
| --------------- | --------------------: |
| `type`          |                     ✅ |
| `version`       |                **M2** |
| `presentation`  | **Variable → Object** |
| Variable/name   |          **Required** |
| Object          |          **Required** |
| Type            |           Recommended |
| Value/state     |           Recommended |
| Assignment      |           Recommended |
| Reassignment    |           Recommended |
| Reference graph |                  ❌ M3 |
| Aliasing        |                  ❌ M3 |
| Stack           |                  ❌ M4 |
| Heap            |                  ❌ M4 |
| Object layout   |                  ❌ M5 |
| Allocation      |                  ❌ M7 |
| Deallocation    |                  ❌ M7 |

---

# 62. M2 Final Technical Specification

| Area                  | M2 Decision                              |
| --------------------- | ---------------------------------------- |
| **Block**             | **MemoryBlock**                          |
| **Version**           | **M2**                                   |
| **Presentation**      | **Variable → Object**                    |
| **Main question**     | **What does a variable/name represent?** |
| **Hero**              | **NAME → OBJECT**                        |
| Variable/name         | **Core**                                 |
| Object                | **Core**                                 |
| Type                  | **Core**                                 |
| Value/state           | **Core**                                 |
| Assignment            | **Core**                                 |
| Reassignment          | **Core**                                 |
| Expression evaluation | Recommended                              |
| Function result       | Recommended                              |
| Collections           | Recommended                              |
| Class instances       | Recommended                              |
| NumPy                 | Recommended                              |
| Pandas                | Recommended                              |
| Aliasing              | ❌ M3                                     |
| Identity              | ❌ M3                                     |
| Detailed references   | ❌ M3                                     |
| Stack                 | ❌ M4                                     |
| Heap                  | ❌ M4                                     |
| Object layout         | ❌ M5                                     |
| Allocation            | ❌ M7                                     |
| Deallocation          | ❌ M7                                     |
| Primary               | **#F54A8D**                              |
| Secondary             | **#0B1B3D**                              |
| Colour ratio          | **70% / 30%**                            |
| Theme                 | Light                                    |
| Gradient              | ❌                                        |
| Dark theme            | ❌                                        |
| A4                    | **Portrait**                             |
| JSON-driven           | **✅**                                    |
| Responsive            | **✅**                                    |
| Accessibility         | **✅**                                    |
| Animation             | Optional                                 |
| Learning level        | Foundation → Intermediate                |

---

# 63. M2 Final Mental Model

The entire version should ultimately reduce to:

```text
                 VARIABLE / NAME
                       │
                       │
                       ▼
                ┌──────────────┐
                │    OBJECT    │
                ├──────────────┤
                │ Type         │
                │ Value        │
                │ State        │
                └──────────────┘
```

And assignment:

```text
EXPRESSION
    ↓
EVALUATION
    ↓
RESULT / OBJECT
    ↓
NAME ASSOCIATION
    ↓
NAME → OBJECT
```

And reassignment:

```text
BEFORE

x ─────► OBJECT A


AFTER

x ─────► OBJECT B
```

The defining principle of **M2** is:

> **A variable provides a name through which a program works with an object. The object has a type and value or state, and assignment establishes or changes the association between the name and the object.**

---

## MemoryBlock — Correct Progress

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                 | ✅              |
| **M2**  | **Variable → Object**                 | ✅ **Complete** |
| **M3**  | Reference Model                       | ⏳ **Next**     |
| **M4**  | Stack / Heap                          | ⏳              |
| **M5**  | Object Memory Layout                  | ⏳              |
| **M6**  | Memory Before / After                 | ⏳              |
| **M7**  | Lifecycle / Allocation / Deallocation | ⏳              |
| **M8**  | Complete Memory Model                 | ⏳              |

**Next, we should do only M3 — Reference Model**, following this exact committed sequence.



```python

```

# BLOCK 8 — MemoryBlock

# M3 — Reference Model

We will now continue **exactly according to the committed MemoryBlock sequence**:

| Version | Presentation                          |
| ------- | ------------------------------------- |
| M1      | Simple Memory Concept                 |
| M2      | Variable → Object                     |
| **M3**  | **Reference Model**                   |
| M4      | Stack / Heap                          |
| M5      | Object Memory Layout                  |
| M6      | Memory Before / After                 |
| M7      | Lifecycle / Allocation / Deallocation |
| M8      | Complete Memory Model                 |

M2 established:

> **A variable provides a name through which a program works with an object.**

M3 now answers the next question:

> **How does a name connect to an object, and what happens when multiple names connect to the same object?**

This is where we formally introduce **references, shared references, aliasing, object identity, equality, and the difference between rebinding and mutation**.

---

# 1. M3 — Version Definition

| Item                 | M3 Specification                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Block**            | MemoryBlock                                                                               |
| **Version**          | **M3**                                                                                    |
| **Presentation**     | **Reference Model**                                                                       |
| **Primary question** | **“How do names connect to objects, and can multiple names connect to the same object?”** |
| **Purpose**          | Establish the conceptual reference relationship between names and objects                 |
| **Learning level**   | Foundation → Intermediate                                                                 |
| **Prerequisite**     | M1 + M2                                                                                   |
| **Next dependency**  | M4 — Stack / Heap                                                                         |
| **Primary colour**   | **#F54A8D**                                                                               |
| **Secondary colour** | **#0B1B3D**                                                                               |
| **Colour rule**      | **70% / 30%**                                                                             |
| **Theme**            | Light                                                                                     |
| **Gradient**         | ❌                                                                                         |
| **Dark theme**       | ❌                                                                                         |
| **Page**             | A4 Portrait                                                                               |

---

# 2. M3 Core Idea

M2 showed:

```text
x
│
▼
OBJECT
```

M3 expands that model:

```text
x ─────┐
       │
       ▼
   ┌──────────────┐
   │    OBJECT    │
   │              │
   │   [10,20]    │
   └──────────────┘
```

Then:

```python
a = [10, 20]
b = a
```

becomes conceptually:

```text
a ─────┐
       │
       ▼
   ┌──────────────┐
   │    OBJECT    │
   │  [10, 20]    │
   └──────────────┘
       ▲
       │
b ─────┘
```

This is the defining idea of M3:

> **Multiple names can refer to the same object.**

---

# 3. M3 Why It Is Different From M2

M2:

```text
x ─────► OBJECT
```

M3:

```text
x ─────┐
       ├────► OBJECT
y ─────┘
```

M2 teaches:

> **One name → object**

M3 teaches:

> **Many names → same object**

This is the first point where the learner needs to understand **sharing**.

---

# 4. M3 Reference

At the conceptual level, we can represent:

```text
NAME
  │
  │ reference relationship
  ▼
OBJECT
```

The arrow means:

> **The name provides access to the object.**

For M3, use the term:

> **reference relationship**

rather than claiming that every language literally stores a raw memory address.

---

# 5. Important Technical Rule

Do **not** teach:

> “A reference is always a memory address.”

Instead:

> **A reference is a language/runtime concept representing a relationship through which a name or value provides access to an object.**

Some implementations may use pointers or pointer-like representations internally, but that is an implementation detail.

That deeper implementation belongs in later MemoryBlock versions.

---

# 6. M3 The Single Reference Model

```text
        NAME
         │
         │ reference
         ▼
   ┌──────────────┐
   │    OBJECT    │
   │              │
   │   [10,20]    │
   └──────────────┘
```

Example:

```python
items = [10, 20]
```

Conceptually:

```text
items ─────► List Object
```

---

# 7. M3 Shared Reference Model

Now:

```python
items = [10, 20]
other = items
```

Conceptually:

```text
items ─────┐
           │
           ▼
     ┌──────────────┐
     │ List Object  │
     │ [10,20]      │
     └──────────────┘
           ▲
           │
other ─────┘
```

The key statement:

> **`items` and `other` are two names associated with the same object.**

---

# 8. M3 Aliasing

This relationship is commonly called:

> **Aliasing**

Definition:

> **Aliasing occurs when multiple references/names provide access to the same object.**

Example:

```python
a = [1, 2]
b = a
```

Diagram:

```text
a ─────┐
       ├────► [1,2]
b ─────┘
```

This is the core M3 concept.

---

# 9. M3 Why Aliasing Matters

Suppose:

```python
a = [1, 2]
b = a
```

Then:

```python
b.append(3)
```

The object changes:

```text
BEFORE

a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘
```

After:

```text
AFTER

a ─────┐
       ▼
    [1,2,3]
       ▲
       │
b ─────┘
```

Because:

```text
a
│
└──► SAME OBJECT ◄──┐
                    │
                    b
```

---

# 10. M3 Mutation

This introduces another important term:

> **Mutation**

Mutation means:

> **Changing the state/content of an existing mutable object.**

Example:

```python
items = [10, 20]

items.append(30)
```

The object itself changes:

```text
[10,20]
   ↓
[10,20,30]
```

This is different from changing which object a name refers to.

---

# 11. M3 Rebinding

Compare:

```python
a = [1, 2]
b = a

a = [3, 4]
```

Before:

```text
a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘
```

After:

```text
a ─────► [3,4]

b ─────► [1,2]
```

Here:

```text
a = [3,4]
```

changes the object associated with `a`.

This is:

> **Rebinding**

not mutation of the original list.

---

# 12. M3 Mutation vs Rebinding

| Operation        | Concept                                      |
| ---------------- | -------------------------------------------- |
| `a.append(3)`    | Mutation                                     |
| `a["x"] = 10`    | Mutation                                     |
| `a = new_object` | Rebinding                                    |
| `b = a`          | Another name associated with the same object |
| `a = 100`        | Rebinding                                    |

This distinction is one of the most important M3 learning outcomes.

---

# 13. M3 Identity

Now introduce **object identity**.

Suppose:

```python
a = [1, 2]
b = a
```

Both names refer to one object.

Therefore:

```python
a is b
```

is true.

Conceptually:

```text
a ─────┐
       ├────► OBJECT A
b ─────┘
```

There is one object identity.

---

# 14. M3 Equality vs Identity

Now compare:

```python
a = [1, 2]
b = [1, 2]
```

Conceptually:

```text
a ─────► OBJECT A
          [1,2]


b ─────► OBJECT B
          [1,2]
```

The values can compare equal:

```python
a == b
```

while the objects are not identical:

```python
a is b
```

is false.

Therefore:

```text
EQUALITY
↓
Do they compare as equal?

IDENTITY
↓
Are they the same object?
```

---

# 15. M3 Identity Visual

```text
CASE A — SAME OBJECT

a ─────┐
       ▼
   ┌─────────┐
   │ [1,2]   │
   └─────────┘
       ▲
       │
b ─────┘

a is b → True
```

---

# 16. M3 Equality Visual

```text
CASE B — EQUAL CONTENT

a ─────► ┌─────────┐
         │ [1,2]   │
         └─────────┘

b ─────► ┌─────────┐
         │ [1,2]   │
         └─────────┘

a == b → True
a is b → False
```

This side-by-side comparison should be one of the most important visual components in M3.

---

# 17. M3 `is`

For Python:

```python
a is b
```

asks:

> **Are `a` and `b` the same object?**

This is an identity test.

---

# 18. M3 `==`

```python
a == b
```

asks whether the objects compare equal according to their equality semantics.

This is a value/equality comparison.

Important:

> Equality can be customized by a type.

Therefore, identity and equality should remain conceptually separate.

---

# 19. M3 `None`

A highly practical Python example:

```python
if value is None:
    ...
```

The programmer is asking:

> **Is `value` the `None` object?**

This is a good practical application of object identity.

---

# 20. M3 Mutable Objects

Examples in Python:

```text
list
dict
set
```

For:

```python
a = [1, 2]
b = a
```

mutation through either name affects the shared object:

```python
b.append(3)
```

Result:

```text
a → [1,2,3]
b → [1,2,3]
```

because:

```text
a ─────┐
       ├──► SAME OBJECT
b ─────┘
```

---

# 21. M3 Immutable Objects

Python examples commonly include:

```text
int
float
bool
str
tuple
```

The M3 point is not that immutable objects have no references.

They absolutely can be referenced:

```python
a = 10
b = a
```

The difference is that operations such as:

```python
a = 20
```

rebind the name rather than mutating the integer object.

---

# 22. M3 Function Argument Example

This is a major practical use case.

```python
def add_item(items):
    items.append(100)

values = [1, 2]
add_item(values)
```

Conceptually inside the function:

```text
values ─────┐
            ▼
         [1,2]
            ▲
            │
          items
```

Both names provide access to the same list object.

Then:

```python
items.append(100)
```

changes that shared object.

Result:

```text
values → [1,2,100]
```

---

# 23. M3 Function Rebinding Example

Compare:

```python
def change(x):
    x = 100

value = 10
change(value)
```

Conceptually:

```text
caller:

value ─────► 10


function:

x ─────────► 10

x = 100

x ─────────► 100
```

The caller's name `value` does not become `100`.

This demonstrates:

> **Rebinding a local name is not the same thing as mutating a shared object.**

---

# 24. M3 Function Mutation Example

Now:

```python
def change(items):
    items.append(100)

values = [1, 2]
change(values)
```

Conceptually:

```text
values ─────┐
            ▼
         [1,2]
            ▲
            │
          items
```

Then:

```text
items.append(100)
```

produces:

```text
values ─────┐
            ▼
       [1,2,100]
            ▲
            │
          items
```

This is the ideal M3 demonstration.

---

# 25. M3 Java Example

```java
Person a = new Person();
Person b = a;
```

Conceptually:

```text
a ─────┐
       ▼
   Person Object
       ▲
       │
b ─────┘
```

Both references provide access to the same object.

---

# 26. M3 JavaScript Example

```javascript
const a = { name: "Alice" };
const b = a;

b.name = "Bob";
```

Conceptually:

```text
a ─────┐
       ▼
{name: "Alice"}
       ▲
       │
b ─────┘
```

After mutation:

```text
a → {name: "Bob"}
b → {name: "Bob"}
```

This is an excellent cross-language aliasing example.

---

# 27. M3 C++ Example

C++ has explicit reference concepts.

```cpp
int value = 10;
int& ref = value;
```

Conceptually:

```text
value
  ▲
  │
  │ reference
  │
 ref
```

M3 can show:

```text
NAME / REFERENCE
        ↓
     SAME DATA
```

without yet going into pointer arithmetic or object layout.

---

# 28. M3 NumPy Example

```python
arr = np.array([10,20,30])
view = arr
```

Conceptually:

```text
arr ─────┐
         ▼
   ndarray Object
         ▲
         │
view ────┘
```

Then:

```python
view[0] = 99
```

can result in:

```text
arr  → [99,20,30]
view → [99,20,30]
```

because both names refer to the same array object.

---

# 29. M3 NumPy View — Advanced Note

A more subtle case:

```python
view = arr[1:]
```

can create a new array object that shares underlying data with another array.

This is an excellent advanced reference-model example.

But M3 should only introduce the concept:

```text
ARRAY OBJECT
      ↓
SHARED UNDERLYING DATA
```

The detailed memory representation belongs to:

> **M5 — Object Memory Layout**

and memory transformation belongs to:

> **M6 — Memory Before / After**

---

# 30. M3 Pandas Example

A Pandas object can participate in relationships involving:

```text
DataFrame
Series
underlying data
views/copies
```

M3 should teach the general principle:

> **A high-level object can expose or share access to underlying data structures.**

Detailed Pandas copy/view semantics should remain outside the core M3 model because they can depend on the operation and library version.

---

# 31. M3 Full Stack Example

Suppose:

```python
request_data = request.json
service_data = request_data
```

Conceptually:

```text
request_data ───┐
                ▼
          Request Data Object
                ▲
                │
service_data ───┘
```

If:

```python
service_data["role"] = "admin"
```

mutates the shared object, the same modified state may be visible through `request_data`.

This is why shared mutable state matters in backend architecture.

---

# 32. M3 Data Engineering Example

```python
batch = load_batch()
current_batch = batch
```

Conceptually:

```text
batch ──────────┐
                ▼
            Batch Object
                ▲
                │
current_batch ──┘
```

A transformation through one name may affect the shared object.

This is important in data pipelines where large mutable structures may be passed between stages.

---

# 33. M3 Data Science Example

```python
dataset = load_data()
training_data = dataset
```

Conceptually:

```text
dataset ────────┐
                ▼
           Dataset Object
                ▲
                │
training_data ──┘
```

If the dataset is mutable, an in-place transformation can affect both names.

This is why data scientists must understand:

```text
reference
copy
mutation
view
```

---

# 34. M3 Cyber Security Example

Suppose an authorization system maintains:

```python
user_context = load_user_context()
audit_context = user_context
```

Conceptually:

```text
user_context ────┐
                 ▼
            Context Object
                 ▲
                 │
audit_context ───┘
```

If one component modifies shared state, another component may observe the modification.

This is a practical reason to control shared mutable state in security-sensitive applications.

---

# 35. M3 Ethical Hacking Example

In a controlled security lab:

```text
test_context
      │
      ▼
┌──────────────────┐
│ Lab State Object │
└──────────────────┘
      ▲
      │
report_context
```

The important concept remains:

> **Two components may access the same underlying state through different references.**

---

# 36. M3 Quantum Computing Example

For host-side quantum software:

```python
circuit = build_circuit()
job_config = circuit
```

Conceptually:

```text
circuit ─────┐
             ▼
       Circuit Object
             ▲
             │
job_config ──┘
```

If the circuit object is mutable, modifications through one reference can be visible through the other.

This is a host-language memory concept.

---

# 37. M3 Reference Graph

M3 should introduce a simple graph:

```text
a ─────────┐
           │
           ▼
      ┌─────────┐
      │ Object A│
      └────┬────┘
           │
           ▼
      ┌─────────┐
      │ Object B│
      └─────────┘
```

This prepares the learner for more advanced memory graphs.

Later:

> M5 can explain the internal object structure.

And:

> M7 can explain what happens when objects become unreachable.

---

# 38. M3 Multiple Objects

Not every reference points to the same object.

```python
a = [1,2]
b = [1,2]
```

Conceptually:

```text
a ─────► Object A
          [1,2]

b ─────► Object B
          [1,2]
```

Therefore:

```text
equal contents
      ≠
same identity
```

This is the core identity/equality distinction.

---

# 39. M3 Comparison Table

| Situation                 | Diagram               |           `==` |    `is` |
| ------------------------- | --------------------- | -------------: | ------: |
| Same object               | `a ─┐ → Object ← ┘ b` | Usually `True` |  `True` |
| Different equal objects   | `a → A`, `b → B`      |   Often `True` | `False` |
| Different unequal objects | `a → A`, `b → B`      |        `False` | `False` |

The word **“usually/often”** is intentional because equality semantics can be customized and identity behavior for immutable objects can have implementation-specific details.

---

# 40. M3 Object Identity

For Python:

```python
id(obj)
```

provides an identity-related value for the object during its lifetime.

M3 can show:

```text
OBJECT
├── Identity
├── Type
└── Value / State
```

But avoid teaching:

> “`id()` is always the object's permanent physical memory address.”

That is too implementation-specific.

---

# 41. M3 `id()` Visual

```text
        OBJECT
           │
     ┌─────┼─────┐
     │     │     │
     ▼     ▼     ▼
 Identity Type  State
```

For Python:

```python
id(obj)
```

can expose an identity-related identifier.

This is a supporting concept, not the main M3 topic.

---

# 42. M3 The Most Important Distinction

M3 should have a dedicated callout:

```text
┌──────────────────────────────────┐
│          DO NOT CONFUSE          │
├──────────────────────────────────┤
│                                  │
│  REBINDING                       │
│  name → different object         │
│                                  │
│  MUTATION                        │
│  existing object changes state   │
│                                  │
└──────────────────────────────────┘
```

Example:

```text
REASSIGNMENT

a = new_object
```

versus:

```text
MUTATION

a.append(...)
```

This is one of the highest-value M3 concepts.

---

# 43. M3 Reference Model — Main Diagram

The hero should be:

```text
                     REFERENCES

              ┌────────────────────┐
              │                    │
          a ──┤                    │
              │      OBJECT        │
          b ──┤      [1,2,3]      │
              │                    │
              └────────────────────┘
```

Better visually:

```text
a ─────┐
       │
       ▼
   ┌───────────┐
   │  OBJECT   │
   │ [1,2,3]   │
   └───────────┘
       ▲
       │
b ─────┘
```

Caption:

> **Two names can provide access to one object.**

---

# 44. M3 A4 Portrait Layout

```text
┌──────────────────────────────────────────────┐
│ MEMORY                                       │
│                                              │
│ Reference Model                              │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │            a ─────┐                      │ │
│ │                   ▼                      │ │
│ │              ┌──────────┐                │ │
│ │              │ OBJECT   │                │ │
│ │              │ [1,2,3]  │                │ │
│ │              └──────────┘                │ │
│ │                   ▲                      │ │
│ │            b ─────┘                      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ WHAT IS A REFERENCE?                         │
│                                              │
│ ALIASING                                     │
│                                              │
│ IDENTITY vs EQUALITY                         │
│                                              │
│ REBINDING vs MUTATION                        │
│                                              │
│ FUNCTION ARGUMENTS                           │
│                                              │
│ REAL-WORLD APPLICATIONS                      │
│                                              │
│ FINAL MENTAL MODEL                           │
└──────────────────────────────────────────────┘
```

---

# 45. M3 Hero

Hero title:

> **Reference Model**

Hero statement:

> **A reference relationship connects a name to an object. Multiple names can provide access to the same object.**

Hero diagram:

```text
a ─────┐
       ▼
   ┌───────────┐
   │  OBJECT   │
   │ [1,2,3]   │
   └───────────┘
       ▲
       │
b ─────┘
```

---

# 46. M3 Secondary Visual — Identity

```text
CASE 1

a ─────┐
       ├──► OBJECT A
b ─────┘

SAME IDENTITY
```

versus:

```text
CASE 2

a ───► OBJECT A

b ───► OBJECT B

EQUAL CONTENT
DIFFERENT IDENTITY
```

This visual comparison is extremely important.

---

# 47. M3 Secondary Visual — Mutation

```text
BEFORE

a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘


b.append(3)


AFTER

a ─────┐
       ▼
    [1,2,3]
       ▲
       │
b ─────┘
```

---

# 48. M3 Secondary Visual — Rebinding

```text
BEFORE

a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘


a = [3,4]


AFTER

a ─────► [3,4]

b ─────► [1,2]
```

This visual should explicitly label:

> **Rebinding**

not mutation.

---

# 49. M3 Colour Strategy

### Primary — `#F54A8D`

Use for:

* MEMORY eyebrow
* reference arrows
* active names
* shared-reference connector
* identity indicator
* `is`
* mutation transition
* important callouts
* `SAME OBJECT`

### Secondary — `#0B1B3D`

Use for:

* main title
* object containers
* code
* explanatory text
* labels
* equality
* normal diagram content

### Neutral

Use for:

* cards
* background
* object surfaces
* spacing

---

# 50. M3 70% / 30% Colour Contribution

The intended balance:

```text
70%
────────────────────────────
#0B1B3D
white
light neutral surfaces
normal content
```

```text
30%
────────────────────────────
#F54A8D
references
arrows
identity
active concepts
transitions
```

The **object itself should not be entirely pink**.

The relationship should be the accent.

---

# 51. M3 HTML Tag Colour Table

| HTML Tag                | Purpose             | Colour                |
| ----------------------- | ------------------- | --------------------- |
| `<section>`             | Root block          | Neutral               |
| `<header>`              | Header              | Neutral               |
| `<span>`                | `MEMORY` eyebrow    | **Primary #F54A8D**   |
| `<h2>`                  | `Reference Model`   | **Secondary #0B1B3D** |
| `<p>`                   | Context/explanation | **Secondary #0B1B3D** |
| `<article>`             | Concept card        | Neutral               |
| `<h3>`                  | Major heading       | **Secondary #0B1B3D** |
| `<h4>`                  | Subheading          | **Secondary #0B1B3D** |
| `<code>`                | Code                | **Secondary #0B1B3D** |
| `<strong>`              | Key terminology     | **Secondary #0B1B3D** |
| `<span>`                | Variable/name       | **Primary #F54A8D**   |
| `<span>`                | Reference arrow     | **Primary #F54A8D**   |
| `<span>`                | `SAME OBJECT`       | **Primary #F54A8D**   |
| `<span>`                | Identity marker     | **Primary #F54A8D**   |
| `<span>`                | Equality text       | **Secondary #0B1B3D** |
| `<span>`                | Object label        | **Secondary #0B1B3D** |
| `<div>`                 | Diagram container   | Neutral               |
| `<aside>`               | Final mental model  | Neutral               |
| `<h3>` inside `<aside>` | Final heading       | **Primary #F54A8D**   |
| `<p>` inside `<aside>`  | Final explanation   | **Secondary #0B1B3D** |

---

# 52. Semantic HTML Structure

```text
<section>
│
├── <header>
│   ├── <span> MEMORY </span>
│   └── <h2> Reference Model </h2>
│
├── <p>
│
├── <section class="reference-hero">
│   ├── <h3>
│   └── reference diagram
│
├── <section class="aliasing">
│   ├── <h3>
│   └── shared-reference diagram
│
├── <section class="identity-equality">
│   ├── <h3>
│   ├── equality example
│   └── identity example
│
├── <section class="mutation-rebinding">
│   ├── <h3>
│   ├── mutation
│   └── rebinding
│
├── <section class="function-examples">
│   └── function argument examples
│
├── <section class="language-examples">
│   ├── Python
│   ├── JavaScript
│   ├── Java
│   ├── C++
│   ├── NumPy
│   └── Pandas
│
└── <aside>
    ├── <h3>
    └── <p>
```

---

# 53. Complete M3 HTML

```html
<section
    class="tutorial-block memory-block memory-m3"
    data-block="memory"
    data-version="M3"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Reference Model
        </h2>

    </header>


    <p class="memory-context">
        A reference relationship connects a name to an object.
        Multiple names can provide access to the same object.
    </p>


    <section class="reference-hero">

        <h3>
            Reference Relationship
        </h3>

        <div class="reference-diagram">

            <span class="reference-name">
                a
            </span>

            <span class="reference-arrow">
                ─────┐
            </span>

            <article class="object-card">

                <h4>
                    OBJECT
                </h4>

                <span>
                    [1, 2, 3]
                </span>

            </article>

            <span class="reference-arrow">
                ┌─────
            </span>

            <span class="reference-name">
                b
            </span>

        </div>

    </section>


    <section class="aliasing">

        <h3>
            Aliasing
        </h3>

        <p>
            Aliasing occurs when multiple names provide access
            to the same object.
        </p>

        <code>
            a = [1, 2]
            b = a
        </code>

    </section>


    <section class="identity-equality">

        <h3>
            Identity vs Equality
        </h3>

        <article>

            <h4>
                Identity
            </h4>

            <code>
                a is b
            </code>

            <p>
                Are both names associated with the same object?
            </p>

        </article>


        <article>

            <h4>
                Equality
            </h4>

            <code>
                a == b
            </code>

            <p>
                Do the objects compare as equal?
            </p>

        </article>

    </section>


    <section class="mutation-rebinding">

        <h3>
            Mutation vs Rebinding
        </h3>

        <article>

            <h4>
                Mutation
            </h4>

            <code>
                a.append(3)
            </code>

            <p>
                Changes the state of an existing mutable object.
            </p>

        </article>


        <article>

            <h4>
                Rebinding
            </h4>

            <code>
                a = new_object
            </code>

            <p>
                Changes which object the name is associated with.
            </p>

        </article>

    </section>


    <section class="function-examples">

        <h3>
            Function Arguments
        </h3>

        <p>
            A function parameter can provide another name through
            which the same object can be accessed.
        </p>

        <code>
            def add_item(items):
                items.append(100)
        </code>

    </section>


    <section class="language-examples">

        <h3>
            Real-World Examples
        </h3>

        <article>
            <h4>Python</h4>
            <code>
                b = a
            </code>
        </article>

        <article>
            <h4>JavaScript</h4>
            <code>
                const b = a;
            </code>
        </article>

        <article>
            <h4>Java</h4>
            <code>
                Person b = a;
            </code>
        </article>

        <article>
            <h4>C++</h4>
            <code>
                int& ref = value;
            </code>
        </article>

        <article>
            <h4>NumPy</h4>
            <code>
                view = arr
            </code>
        </article>

        <article>
            <h4>Pandas</h4>
            <p>
                Object and data-sharing relationships.
            </p>
        </article>

    </section>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            A reference relationship connects a name to an object.
            Multiple names may provide access to the same object.
            Identity asks whether objects are the same object,
            while equality asks whether they compare as equal.
            Mutation changes an existing object; rebinding changes
            the object associated with a name.
        </p>

    </aside>

</section>
```

---

# 54. M3 JSON Structure

```json
{
  "type": "memory",
  "version": "M3",
  "presentation": "Reference Model",

  "content": {

    "title": "Reference Model",

    "context": "A reference relationship connects a name to an object. Multiple names can provide access to the same object.",

    "references": [

      {
        "name": "a",
        "objectId": "object-001"
      },

      {
        "name": "b",
        "objectId": "object-001"
      }

    ],

    "object": {

      "id": "object-001",
      "type": "list",
      "value": "[1,2,3]"
    },

    "aliasing": {

      "enabled": true,

      "description": "Multiple names provide access to the same object."
    },

    "identity": {

      "operator": "is",

      "question": "Are the names associated with the same object?"
    },

    "equality": {

      "operator": "==",

      "question": "Do the objects compare as equal?"
    },

    "mutation": {

      "operation": "append",

      "description": "Changes the state of an existing mutable object."
    },

    "rebinding": {

      "description": "Changes which object a name is associated with."
    },

    "result": {

      "title": "Final Mental Model",

      "description": "A reference relationship connects a name to an object. Multiple names may provide access to the same object. Identity asks whether objects are the same object, while equality asks whether they compare as equal. Mutation changes an existing object; rebinding changes the object associated with a name."
    }

  }
}
```

---

# 55. Generic M3 JSON Model

For the Tutorial Engine renderer:

```json
{
  "type": "memory",
  "version": "M3",

  "content": {

    "objects": [],

    "references": [],

    "relationships": [],

    "identity": {},

    "equality": {},

    "aliasing": {},

    "mutation": [],

    "rebinding": [],

    "functionArguments": [],

    "examples": [],

    "result": {

      "title": "",
      "description": ""
    }

  }
}
```

---

# 56. M3 Reference JSON

Example:

```json
{
  "references": [

    {
      "name": "a",
      "target": "object-001"
    },

    {
      "name": "b",
      "target": "object-001"
    }

  ]
}
```

Renderer:

```text
a ─────┐
       ▼
   object-001
       ▲
       │
b ─────┘
```

---

# 57. M3 Identity Comparison JSON

```json
{
  "identityComparison": {

    "left": {
      "name": "a",
      "object": "object-001"
    },

    "right": {
      "name": "b",
      "object": "object-001"
    },

    "sameObject": true

  }
}
```

Renderer:

```text
a is b
   ↓
TRUE
```

---

# 58. M3 Equality Comparison JSON

```json
{
  "equalityComparison": {

    "left": {
      "name": "a",
      "object": "object-001",
      "value": "[1,2]"
    },

    "right": {
      "name": "b",
      "object": "object-002",
      "value": "[1,2]"
    },

    "equal": true,

    "sameObject": false

  }
}
```

Renderer:

```text
a == b
   ↓
TRUE

a is b
   ↓
FALSE
```

This is an ideal interactive comparison.

---

# 59. M3 Mutation JSON

```json
{
  "mutation": {

    "object": "object-001",

    "operation": "append",

    "before": "[1,2]",

    "after": "[1,2,3]",

    "aliases": [
      "a",
      "b"
    ]

  }
}
```

Renderer:

```text
a ─────┐
       ▼
     [1,2]
       ▲
       │
b ─────┘

        ↓

a ─────┐
       ▼
    [1,2,3]
       ▲
       │
b ─────┘
```

---

# 60. M3 Rebinding JSON

```json
{
  "rebinding": {

    "name": "a",

    "before": "object-001",

    "after": "object-002",

    "otherReferences": [

      {
        "name": "b",
        "target": "object-001"
      }

    ]

  }
}
```

Renderer:

```text
BEFORE

a ─────┐
       ▼
     Object A
       ▲
       │
b ─────┘


AFTER

a ─────► Object B

b ─────► Object A
```

---

# 61. M3 Function Argument JSON

```json
{
  "functionArgument": {

    "callerName": "values",

    "parameterName": "items",

    "objectId": "object-001",

    "relationship": "shared-object-access"

  }
}
```

Renderer:

```text
values ─────┐
            ▼
        Object 001
            ▲
            │
items ──────┘
```

This makes M3 highly useful for explaining function behavior.

---

# 62. M3 What It Should NOT Explain

M3 should **not** become M4 or M5.

Do not deeply explain:

```text
stack
heap
stack frames
heap allocation
object headers
object memory layout
pointer arithmetic
CPU registers
virtual memory
allocator arenas
garbage collector internals
deallocation
```

Those belong to later versions.

M3's job is:

> **Explain the relationship between names and objects.**

---

# 63. M3 Relationship With M2

M2:

```text
x ─────► OBJECT
```

M3:

```text
a ─────┐
       ├──► OBJECT
b ─────┘
```

Therefore:

> **M3 extends the single Variable → Object model into a multi-reference model.**

---

# 64. M3 Relationship With M4

M3:

```text
function name
      │
      └────► object
```

M4:

```text
STACK FRAME
      │
      └────► object
```

M3 establishes the reference relationship.

M4 establishes the **execution/memory organization** in which those references can be conceptually situated.

---

# 65. M3 Relationship With M5

M3:

```text
reference
    ↓
OBJECT
```

M5:

```text
reference
    ↓
OBJECT
 ├── identity
 ├── type metadata
 ├── state
 ├── internal representation
 └── implementation-specific data
```

M5 therefore opens the object itself.

---

# 66. M3 Relationship With M6

M3:

```text
a ─────► Object
```

M6:

```text
BEFORE
a ─────► Object A

OPERATION

AFTER
a ─────► Object B
```

or:

```text
BEFORE
Object → [1,2]

MUTATION

AFTER
Object → [1,2,3]
```

M6 will turn the M3 relationships into **time-based memory state transitions**.

---

# 67. M3 Relationship With M7

M3 establishes:

```text
name
 ↓
reference
 ↓
object
```

M7 later asks:

```text
Where did the object come from?

When was it allocated?

How long does it remain alive?

When is it no longer reachable?

When can its storage be reclaimed?
```

Therefore M3 is a prerequisite for understanding object lifetime.

---

# 68. M3 Relationship With M8

M8 eventually combines:

```text
NAME
 ↓
REFERENCE
 ↓
OBJECT
 ↓
MEMORY LOCATION / REPRESENTATION
 ↓
STATE CHANGES
 ↓
LIFETIME
 ↓
ALLOCATION
 ↓
DEALLOCATION / RECLAMATION
```

M3 provides one of the central links:

```text
REFERENCE
     ↓
OBJECT
```

---

# 69. M3 Accessibility

Do not make the diagram dependent on colour.

Instead of:

```text
Pink arrow
```

also label:

```text
reference
```

Instead of:

```text
Pink = same object
```

show:

```text
SAME OBJECT
```

Instead of:

```text
Pink = mutation
```

show:

```text
OBJECT STATE CHANGES
```

This maintains semantic accessibility.

---

# 70. M3 Responsive Design

### Desktop

```text
a ─────┐
       ▼
   OBJECT
       ▲
       │
b ─────┘
```

### Mobile

```text
a
│
└──► OBJECT
       ▲
       │
      b
```

For the equality comparison:

```text
OBJECT A        OBJECT B
   │               │
   └── equal ──────┘
```

should stack vertically on small screens.

---

# 71. M3 Animation

M3 is particularly suitable for animation.

### Step 1

```text
a
 ↓
OBJECT
```

### Step 2

Introduce:

```text
b
```

### Step 3

Animate:

```text
b ─────► SAME OBJECT
```

### Step 4

Highlight:

```text
a
b
```

### Step 5

Show:

```text
a is b
```

### Step 6

Mutate:

```text
b.append(3)
```

### Step 7

Update the object:

```text
[1,2]
 ↓
[1,2,3]
```

### Step 8

Show both names:

```text
a → [1,2,3]
b → [1,2,3]
```

This provides a very strong visual explanation of aliasing.

---

# 72. M3 Information Density

| Component                 | Recommendation |
| ------------------------- | -------------: |
| Reference hero            |          **1** |
| Aliasing diagram          |          **1** |
| Identity vs equality      |          **1** |
| Mutation diagram          |          **1** |
| Rebinding diagram         |          **1** |
| Function argument example |          **1** |
| Language examples         |        **4–6** |
| Long paragraphs           |              ❌ |
| Stack/heap                |              ❌ |
| Object internals          |              ❌ |
| Allocation/deallocation   |              ❌ |

---

# 73. M3 Validation Rules

| Field                     |            Required |
| ------------------------- | ------------------: |
| `type`                    |                   ✅ |
| `version`                 |              **M3** |
| `presentation`            | **Reference Model** |
| Object                    |        **Required** |
| References                |        **Required** |
| Reference relationship    |        **Required** |
| Aliasing                  |        **Required** |
| Identity                  |        **Required** |
| Equality                  |         Recommended |
| Mutation                  |         Recommended |
| Rebinding                 |         Recommended |
| Function argument example |         Recommended |
| Stack                     |                ❌ M4 |
| Heap                      |                ❌ M4 |
| Object layout             |                ❌ M5 |
| Allocation                |                ❌ M7 |
| Deallocation              |                ❌ M7 |

---

# 74. M3 Final Technical Specification

| Area               | M3 Decision                          |
| ------------------ | ------------------------------------ |
| **Block**          | **MemoryBlock**                      |
| **Version**        | **M3**                               |
| **Presentation**   | **Reference Model**                  |
| **Main question**  | **How do names connect to objects?** |
| **Hero**           | **Multiple Names → One Object**      |
| Reference          | **Core**                             |
| Shared reference   | **Core**                             |
| Aliasing           | **Core**                             |
| Object identity    | **Core**                             |
| Equality           | **Core**                             |
| Mutation           | **Core**                             |
| Rebinding          | **Core**                             |
| Function arguments | **Core practical example**           |
| `is`               | Python example                       |
| `==`               | Python example                       |
| `id()`             | Supporting concept                   |
| NumPy sharing      | Supporting example                   |
| Pandas sharing     | Supporting example                   |
| Stack              | ❌ M4                                 |
| Heap               | ❌ M4                                 |
| Object layout      | ❌ M5                                 |
| Memory transition  | ❌ M6                                 |
| Allocation         | ❌ M7                                 |
| Deallocation       | ❌ M7                                 |
| Primary            | **#F54A8D**                          |
| Secondary          | **#0B1B3D**                          |
| Colour ratio       | **70% / 30%**                        |
| Theme              | Light                                |
| Gradient           | ❌                                    |
| Dark theme         | ❌                                    |
| A4                 | **Portrait**                         |
| JSON-driven        | **✅**                                |
| Responsive         | **✅**                                |
| Accessibility      | **✅**                                |
| Animation          | Optional                             |
| Learning level     | Foundation → Intermediate            |

---

# 75. M3 Final Mental Model

Everything in M3 should eventually collapse into:

```text
                       REFERENCES

              a ─────────┐
                         │
                         ▼
                  ┌─────────────┐
                  │   OBJECT    │
                  │             │
                  │   [1,2,3]   │
                  └─────────────┘
                         ▲
                         │
              b ─────────┘
```

Then:

```text
a is b
   ↓
SAME OBJECT
```

while:

```text
a == b
   ↓
EQUAL VALUES / EQUALITY SEMANTICS
```

And:

```text
MUTATION
b.append(3)
   ↓
SAME OBJECT CHANGES
```

while:

```text
REBINDING
a = new_object
   ↓
a ASSOCIATES WITH A DIFFERENT OBJECT
```

The defining principle of **M3** is:

> **A reference relationship connects a name to an object. Multiple names can provide access to the same object, creating aliasing. Object identity asks whether two names refer to the same object, while equality asks whether their objects compare as equal. Mutation changes an existing object; rebinding changes the object associated with a name.**

---

# MemoryBlock — Correct Progress

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                 | ✅              |
| **M2**  | Variable → Object                     | ✅              |
| **M3**  | **Reference Model**                   | ✅ **Complete** |
| **M4**  | Stack / Heap                          | ⏳ **Next**     |
| **M5**  | Object Memory Layout                  | ⏳              |
| **M6**  | Memory Before / After                 | ⏳              |
| **M7**  | Lifecycle / Allocation / Deallocation | ⏳              |
| **M8**  | Complete Memory Model                 | ⏳              |

**Next: M4 — Stack / Heap**, and we will keep the same detailed one-version-at-a-time format.



```python

```

# BLOCK 8 — MemoryBlock

# M4 — Stack / Heap

We now continue with the **committed MemoryBlock sequence**:

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| M1      | Simple Memory Concept                 | ✅              |
| M2      | Variable → Object                     | ✅              |
| M3      | Reference Model                       | ✅              |
| **M4**  | **Stack / Heap**                      | 🔵 **CURRENT** |
| M5      | Object Memory Layout                  | ⏳              |
| M6      | Memory Before / After                 | ⏳              |
| M7      | Lifecycle / Allocation / Deallocation | ⏳              |
| M8      | Complete Memory Model                 | ⏳              |

M3 established:

```text
a ─────┐
       ├──► OBJECT
b ─────┘
```

M4 now asks:

> **Where do execution-related data and dynamically managed objects conceptually live while a program is running?**

The important word throughout M4 is **conceptual**. We should teach the model without falsely claiming that every language/runtime implements memory in exactly this way.

---

# 1. M4 — Version Definition

| Item                 | M4 Specification                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Block**            | MemoryBlock                                                                              |
| **Version**          | **M4**                                                                                   |
| **Presentation**     | **Stack / Heap**                                                                         |
| **Primary question** | **“How can we conceptually understand stack and heap memory during program execution?”** |
| **Purpose**          | Introduce stack and heap as complementary conceptual regions/models of runtime memory    |
| **Prerequisite**     | M1, M2, M3                                                                               |
| **Next dependency**  | M5 — Object Memory Layout                                                                |
| **Primary colour**   | **#F54A8D**                                                                              |
| **Secondary colour** | **#0B1B3D**                                                                              |
| **Colour rule**      | **70% / 30%**                                                                            |
| **Theme**            | Light                                                                                    |
| **Gradient**         | ❌                                                                                        |
| **Dark theme**       | ❌                                                                                        |
| **Page**             | A4 Portrait                                                                              |

---

# 2. The Core Idea

The learner already understands:

```text
name
 ↓
reference
 ↓
object
```

M4 adds an execution context:

```text
PROGRAM EXECUTION

┌──────────────────────────────┐
│            STACK             │
│                              │
│   function execution data    │
│   local variables/references │
│   call frames                │
└──────────────────────────────┘


┌──────────────────────────────┐
│             HEAP             │
│                              │
│   dynamically managed        │
│   objects / allocated data   │
└──────────────────────────────┘
```

The learner's new mental model becomes:

```text
STACK
  │
  │ reference
  ▼
HEAP
  │
  ▼
OBJECT
```

Again:

> This is a **conceptual teaching model**, not a promise that every language/runtime physically organizes memory this exact way.

---

# 3. Why M4 Comes After M3

The sequence is important.

### M2

```text
x ─────► OBJECT
```

### M3

```text
a ─────┐
       ├──► OBJECT
b ─────┘
```

### M4

```text
STACK
  │
  ├── a ─────┐
  │          │
  │          ▼
  │       OBJECT
  │          ▲
  └── b ─────┘
```

So M4 does **not replace** the reference model.

It adds an execution-memory context around it.

---

# 4. Stack — Conceptual Meaning

At the teaching level:

> **The stack is a region/model associated with function calls and their execution contexts.**

When a function is called, a new execution context is created.

For example:

```python
def calculate(x):
    y = x + 10
    return y
```

When:

```python
calculate(20)
```

executes, conceptually we can visualize:

```text
STACK

┌─────────────────────┐
│ calculate frame     │
├─────────────────────┤
│ x → 20              │
│ y → result          │
└─────────────────────┘
```

This is the basic M4 stack model.

---

# 5. Heap — Conceptual Meaning

At the teaching level:

> **The heap is a conceptual region associated with dynamically managed objects and data whose lifetime is not simply tied to one function-call frame.**

Example:

```python
items = [10, 20, 30]
```

Conceptually:

```text
STACK
┌──────────────────┐
│ items ───────────┼────────────┐
└──────────────────┘            │
                                ▼
HEAP                    ┌──────────────┐
                        │ List Object  │
                        │ [10,20,30]   │
                        └──────────────┘
```

This is the central M4 visual.

---

# 6. The Most Important M4 Diagram

The hero diagram should be:

```text
                    PROGRAM MEMORY

┌─────────────────────────────────────────┐
│                 STACK                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Function Frame                    │  │
│  │                                   │  │
│  │ items ────────────────────────────┼──┼────┐
│  │                                   │  │    │
│  └───────────────────────────────────┘  │    │
└─────────────────────────────────────────┘    │
                                               │
                                               ▼
┌─────────────────────────────────────────┐
│                  HEAP                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ List Object                       │  │
│  │                                   │  │
│  │ [10, 20, 30]                      │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

The key visual relationship:

```text
STACK REFERENCE
       │
       ▼
HEAP OBJECT
```

---

# 7. Important Caveat

The tutorial must explicitly say:

> **Stack and heap are useful conceptual models, but actual memory organization depends on the language, compiler, runtime, operating system, and implementation.**

This prevents the common misconception:

> “Every variable is physically on the stack and every object is physically on the heap.”

That statement is not universally correct.

---

# 8. Python Example

Consider:

```python
def add(a, b):
    result = a + b
    return result

answer = add(10, 20)
```

Conceptual execution:

```text
CALLER CONTEXT
────────────────────
answer
   │
   │
   ▼
 result object


FUNCTION CONTEXT
────────────────────
add frame
a → 10
b → 20
result → 30
```

For educational purposes, the frame can be visualized as part of the stack.

---

# 9. Function Call Creates a New Frame

Before:

```text
STACK

┌────────────────────┐
│ main / caller      │
└────────────────────┘
```

Then:

```python
add(10, 20)
```

During the call:

```text
STACK

┌────────────────────┐
│ add frame          │
│ a → 10             │
│ b → 20             │
│ result → 30        │
├────────────────────┤
│ caller frame       │
└────────────────────┘
```

The new function frame sits above the caller in the conceptual stack.

---

# 10. Return From Function

After:

```python
return result
```

the function frame is removed from the active call stack.

Conceptually:

```text
BEFORE RETURN

┌────────────────────┐
│ add frame          │
│ result → 30        │
├────────────────────┤
│ caller frame       │
└────────────────────┘
```

After:

```text
AFTER RETURN

┌────────────────────┐
│ caller frame       │
│ answer → result    │
└────────────────────┘
```

The returned object may continue to exist independently of the function frame.

This is a crucial M4 idea.

---

# 11. Why Heap Is Useful Here

Suppose:

```python
def create_list():
    return [10, 20, 30]

items = create_list()
```

During execution:

```text
STACK
┌──────────────────────┐
│ create_list frame    │
│                      │
└──────────┬───────────┘
           │
           ▼
HEAP
┌──────────────────────┐
│ List Object          │
│ [10,20,30]           │
└──────────────────────┘
```

After the function returns:

```text
STACK
┌──────────────────────┐
│ caller               │
│ items ───────────────┼─────┐
└──────────────────────┘     │
                             ▼
HEAP                  ┌──────────────┐
                      │ List Object  │
                      │ [10,20,30]   │
                      └──────────────┘
```

The function frame disappears, but the returned object can remain reachable.

This prepares the learner for **M7 — Lifecycle / Allocation / Deallocation**.

---

# 12. Stack Is Not “Where All Variables Live”

This misconception must be explicitly prevented.

Do **not** teach:

> Every variable is stored on the stack.

Instead teach:

> **The stack model represents active execution contexts and their associated call-frame data.**

And:

> **References in those frames may provide access to objects managed elsewhere.**

That distinction is critical.

---

# 13. Heap Is Not Simply “A Big Box of Variables”

Similarly, do not teach:

> The heap stores all variables.

Better:

> **The heap is a conceptual area for dynamically managed objects/data whose lifetime and storage management are not simply tied to one active stack frame.**

---

# 14. Stack Frame

M4 should introduce the term:

> **Stack frame**

A stack frame represents an active function invocation.

Example:

```text
┌──────────────────────────┐
│ calculate() frame        │
├──────────────────────────┤
│ parameters               │
│ local execution state    │
│ references               │
│ return information       │
└──────────────────────────┘
```

The exact contents vary by language/runtime.

Therefore:

> Treat this as a conceptual representation.

---

# 15. Nested Function Calls

This is where the stack model becomes visually powerful.

```python
def outer():
    middle()

def middle():
    inner()

def inner():
    return 10

outer()
```

Conceptually:

```text
STACK

┌──────────────────┐
│ inner()          │
├──────────────────┤
│ middle()         │
├──────────────────┤
│ outer()          │
├──────────────────┤
│ caller           │
└──────────────────┘
```

The latest active call is at the top.

---

# 16. Return Order

The calls return in reverse order:

```text
inner()
   ↓
middle()
   ↓
outer()
   ↓
caller
```

The stack therefore follows a **Last-In, First-Out** pattern.

```text
LIFO

Last In
   ↓
First Out
```

This is one of the defining properties of the conceptual call stack.

---

# 17. M4 Stack Animation

The tutorial can animate:

### Stage 1

```text
caller
```

### Stage 2

```text
outer()
caller
```

### Stage 3

```text
middle()
outer()
caller
```

### Stage 4

```text
inner()
middle()
outer()
caller
```

Then unwind:

```text
middle()
outer()
caller
```

then:

```text
outer()
caller
```

then:

```text
caller
```

This is an excellent visual learning interaction.

---

# 18. Stack Overflow

Once recursion is understood:

```python
def recurse():
    recurse()

recurse()
```

Conceptually:

```text
STACK

┌──────────────┐
│ recurse()    │
├──────────────┤
│ recurse()    │
├──────────────┤
│ recurse()    │
├──────────────┤
│ recurse()    │
├──────────────┤
│ ...          │
└──────────────┘
```

Eventually the available call-stack capacity can be exceeded.

This produces the concept:

> **Stack overflow**

In Python, for example, recursion can raise `RecursionError` before a traditional OS-level stack overflow is reached, depending on the implementation and situation.

Therefore M4 should teach the general concept without claiming one universal failure mechanism.

---

# 19. Heap Growth

A program can dynamically create objects:

```python
items = []

for i in range(100000):
    items.append(i)
```

Conceptually:

```text
STACK
┌─────────────────┐
│ items ──────────┼─────────────┐
└─────────────────┘             │
                                ▼
HEAP
┌───────────────────────────────┐
│ growing data structure        │
│                               │
│ ...                           │
└───────────────────────────────┘
```

The heap model helps explain why dynamic data structures can consume increasing memory.

Detailed allocation behavior belongs to M7.

---

# 20. Stack vs Heap

The primary M4 comparison:

| Dimension                  | Stack                            | Heap                                        |
| -------------------------- | -------------------------------- | ------------------------------------------- |
| Main conceptual role       | Active execution contexts        | Dynamically managed objects/data            |
| Organization               | Call-stack / LIFO model          | Dynamic storage model                       |
| Typical association        | Function calls                   | Objects/data                                |
| Lifetime                   | Often tied to active calls       | Can outlive individual calls                |
| Access                     | Structured through active frames | Through references/pointers/handles         |
| Size                       | Typically more constrained       | Typically larger/dynamic                    |
| Management                 | Often automatic with call/return | Runtime/allocator/GC/manual mechanisms vary |
| Universal physical layout? | ❌                                | ❌                                           |

The last row is essential.

---

# 21. Stack vs Heap Visual

```text
┌───────────────────────┐
│       STACK           │
├───────────────────────┤
│ call frame            │
│ local execution data  │
│ references            │
└───────────┬───────────┘
            │
            │ reference
            ▼
┌───────────────────────┐
│        HEAP           │
├───────────────────────┤
│ objects               │
│ dynamic data          │
│ managed storage       │
└───────────────────────┘
```

The **arrow should be the primary accent**.

---

# 22. M4 Java Example

```java
void process() {
    Person person = new Person();
}
```

Conceptually:

```text
STACK
┌────────────────────┐
│ process frame      │
│ person ────────────┼──────┐
└────────────────────┘      │
                             ▼
HEAP                  ┌──────────────┐
                      │ Person       │
                      │ Object       │
                      └──────────────┘
```

This is a strong example because Java's reference/object model fits the conceptual diagram well.

But again:

> This is a teaching model, not a complete JVM memory specification.

---

# 23. M4 JavaScript Example

```javascript
function createUser() {
    const user = {
        name: "Alice"
    };

    return user;
}
```

Conceptually:

```text
STACK
┌─────────────────────┐
│ createUser frame    │
│ user ───────────────┼─────┐
└─────────────────────┘     │
                            ▼
HEAP                  ┌─────────────┐
                      │ User Object │
                      │ name: Alice │
                      └─────────────┘
```

This is a conceptual model of JavaScript execution.

---

# 24. M4 C++ Example

C++ makes the distinction particularly useful.

```cpp
void process() {
    int value = 10;
    Person* person = new Person();
}
```

Conceptually:

```text
STACK
┌─────────────────────┐
│ process frame       │
│ value = 10          │
│ person ─────────────┼──────┐
└─────────────────────┘      │
                             ▼
HEAP                   ┌─────────────┐
                       │ Person      │
                       │ Object      │
                       └─────────────┘
```

Here the heap allocation is explicit through `new`.

This is a useful contrast with garbage-collected languages.

---

# 25. C++ Automatic Object

Now:

```cpp
void process() {
    Person person;
}
```

A simplified conceptual teaching model may show:

```text
STACK
┌─────────────────────┐
│ process frame       │
│                     │
│ Person person       │
└─────────────────────┘
```

This demonstrates why the simplistic statement:

> “Objects always live on the heap”

is wrong.

C++ can create objects with automatic storage duration.

---

# 26. M4 Python

Python's actual implementation is more nuanced.

A simplified teaching model:

```python
items = [1, 2, 3]
```

can be shown as:

```text
STACK / FRAME
┌─────────────────┐
│ items ──────────┼──────┐
└─────────────────┘      │
                         ▼
HEAP / OBJECT STORAGE
┌─────────────────┐
│ list object     │
│ [1,2,3]         │
└─────────────────┘
```

But the tutorial must label this:

> **Conceptual Python memory model**

rather than claiming it is a complete CPython memory-layout specification.

---

# 27. M4 NumPy

```python
arr = np.array([10,20,30])
```

Conceptually:

```text
FRAME
┌──────────────────┐
│ arr ─────────────┼─────────┐
└──────────────────┘         │
                             ▼
OBJECT / DATA
┌────────────────────────────┐
│ ndarray                    │
│                            │
│ metadata + data reference  │
└────────────────────────────┘
```

M5 can later explain:

```text
ndarray object
    ↓
metadata
    ↓
data buffer
```

M4 should not go that deep.

---

# 28. M4 Pandas

```python
df = pd.DataFrame(data)
```

Conceptually:

```text
FRAME
┌─────────────────┐
│ df ─────────────┼──────┐
└─────────────────┘      │
                         ▼
DATAFRAME OBJECT
┌─────────────────────────┐
│ DataFrame               │
│ columns                 │
│ index                   │
│ underlying data         │
└─────────────────────────┘
```

Again, M4 only establishes where the object can be conceptualized.

---

# 29. M4 Full Stack Backend Example

Consider:

```python
def handle_request(request):
    user = authenticate(request)
    response = build_response(user)
    return response
```

Conceptually:

```text
STACK
┌──────────────────────────────┐
│ handle_request frame         │
│                              │
│ request ───────────────┐     │
│ user ───────────────┐  │     │
│ response ─────────┐ │  │     │
└───────────────────┼─┼──┼─────┘
                    │ │  │
                    ▼ ▼  ▼
HEAP / OBJECTS
┌──────────────────────────────┐
│ Request Object               │
│ User Object                  │
│ Response Object              │
└──────────────────────────────┘
```

This connects the memory model directly to real backend systems.

---

# 30. M4 Data Engineering Example

```python
def process_batch(batch):
    cleaned = clean(batch)
    transformed = transform(cleaned)
    return transformed
```

Conceptually:

```text
STACK

process_batch frame
├── batch ──────────────► Batch Object
├── cleaned ────────────► Cleaned Object
└── transformed ───────► Result Object
```

This is a good example of multiple references within an execution frame pointing toward dynamically managed objects.

---

# 31. M4 Data Science Example

```python
def predict(model, X):
    result = model.predict(X)
    return result
```

Conceptually:

```text
STACK
┌────────────────────────┐
│ predict frame          │
│ model ───────────────┐ │
│ X ─────────────────┐ │ │
│ result ───────────┐│ │ │
└───────────────────┼┼─┼─┘
                    ││ │
                    ▼▼ ▼
HEAP / DATA OBJECTS
Model
Dataset
Prediction Result
```

This makes M4 practical rather than purely theoretical.

---

# 32. M4 Cyber Security Example

```python
def authorize(request, policy):
    user = authenticate(request)
    return policy.check(user)
```

Conceptually:

```text
STACK
┌─────────────────────────┐
│ authorize frame         │
│ request ────────────────┼────► Request Object
│ policy ─────────────────┼────► Policy Object
│ user ───────────────────┼────► User Object
└─────────────────────────┘
```

This illustrates the relationship between an active execution frame and objects managed outside the frame.

---

# 33. M4 Ethical Hacking Example

In a controlled lab:

```python
def scan_target(target):
    config = load_config()
    result = run_lab_scan(target, config)
    return result
```

Conceptually:

```text
STACK
scan_target frame
├── target ───► Target Object
├── config ───► Config Object
└── result ───► Result Object
```

The purpose is memory architecture, not exploitation.

---

# 34. M4 Quantum Computing Example

```python
def execute_circuit(circuit, backend):
    result = backend.run(circuit)
    return result
```

Conceptually:

```text
STACK
execute_circuit frame
├── circuit ───► Circuit Object
├── backend ───► Backend Object
└── result ────► Result Object
```

This connects stack-frame execution to complex runtime objects.

---

# 35. M4 Recursion

Recursion is one of the strongest M4 demonstrations.

```python
def countdown(n):
    if n == 0:
        return
    countdown(n - 1)
```

Call:

```python
countdown(3)
```

Conceptually:

```text
STACK

┌──────────────────┐
│ countdown(0)     │
├──────────────────┤
│ countdown(1)     │
├──────────────────┤
│ countdown(2)     │
├──────────────────┤
│ countdown(3)     │
├──────────────────┤
│ caller           │
└──────────────────┘
```

Each invocation has its own execution context.

---

# 36. Recursion Unwinding

When `countdown(0)` returns:

```text
countdown(1)
countdown(2)
countdown(3)
caller
```

Then:

```text
countdown(2)
countdown(3)
caller
```

Then:

```text
countdown(3)
caller
```

Then:

```text
caller
```

This naturally demonstrates:

> **Stack unwinding**

without yet turning the lesson into exception handling.

---

# 37. M4 Stack and Exception Handling

M4 can make a small connection to exception propagation.

Suppose:

```python
def a():
    b()

def b():
    c()

def c():
    raise ValueError()
```

Conceptual stack:

```text
c()
b()
a()
caller
```

An exception propagates upward through these active calls.

This is an excellent bridge to the user's Exception Handling Masterclass, but detailed exception propagation belongs to that subject rather than MemoryBlock M4.

---

# 38. M4 Heap and Object Lifetime

A very important conceptual transition:

```text
STACK FRAME
     │
     │ reference
     ▼
HEAP OBJECT
```

When the frame disappears:

```text
STACK FRAME
     X
```

the object does **not necessarily disappear immediately**.

If another reference still exists:

```text
caller
  │
  ▼
OBJECT
```

the object can remain reachable.

This is a bridge to M7.

---

# 39. M4 Example: Returning an Object

```python
def make_user():
    return User("Alice")

user = make_user()
```

During call:

```text
STACK
make_user()
   │
   └────────► User Object
```

After return:

```text
STACK
caller
   │
   └────────► User Object
```

The **reference relationship survives the function call**, even though the function's execution frame does not.

This is one of the most important M4 concepts.

---

# 40. M4 Stack/Heap Relationship

The complete teaching model:

```text
                 ACTIVE EXECUTION

┌───────────────────────────────────┐
│              STACK                │
│                                   │
│  function frame                   │
│  ├── parameter                    │
│  ├── local reference ───────┐     │
│  └── return information      │     │
└──────────────────────────────┼─────┘
                               │
                               ▼
┌───────────────────────────────────┐
│               HEAP                │
│                                   │
│  ┌──────────────┐                 │
│  │ Object       │                 │
│  │ state        │                 │
│  └──────────────┘                 │
│                                   │
└───────────────────────────────────┘
```

---

# 41. M4 The Three-Layer Mental Model

M4 should teach:

```text
EXECUTION
    │
    ▼
STACK FRAME
    │
    │ reference
    ▼
OBJECT STORAGE
    │
    ▼
OBJECT
```

This extends M3:

```text
NAME → OBJECT
```

into:

```text
EXECUTION FRAME
       ↓
REFERENCE
       ↓
OBJECT
```

---

# 42. M4 Common Misconceptions

### Misconception 1

> Every variable lives on the stack.

❌ Too simplistic.

---

### Misconception 2

> Every object lives on the heap.

❌ Not universally true.

---

### Misconception 3

> Heap means permanent memory.

❌ No.

Heap-managed objects can become unreachable and eventually be reclaimed.

---

### Misconception 4

> Stack memory is always faster than heap memory.

❌ Oversimplified.

Performance depends on allocation, access patterns, cache behavior, compiler optimization, runtime behavior, and many other factors.

---

### Misconception 5

> Stack and heap are universal physical regions.

❌ No.

They are useful conceptual abstractions whose concrete implementation varies.

---

# 43. M4 What Belongs in M4

### Core

* stack
* heap
* stack frame
* function call
* function return
* LIFO
* nested calls
* recursion
* stack growth
* conceptual object storage
* reference from frame to object
* lifetime beyond a function call

### Supporting

* stack overflow
* recursion
* exception stack context
* backend example
* data pipeline example
* NumPy/Pandas example

---

# 44. What Does NOT Belong in M4

| Concept                       | Version                  |
| ----------------------------- | ------------------------ |
| Detailed object header        | **M5**                   |
| Object internal layout        | **M5**                   |
| Metadata fields               | **M5**                   |
| Before/after memory snapshots | **M6**                   |
| Detailed allocation           | **M7**                   |
| Deallocation                  | **M7**                   |
| Garbage collection internals  | **M7**                   |
| Complete lifecycle            | **M8**                   |
| CPU registers                 | Outside core MemoryBlock |
| Virtual memory                | Outside core MemoryBlock |
| OS page tables                | Outside core MemoryBlock |

---

# 45. M4 A4 Portrait Layout

```text
┌──────────────────────────────────────────────┐
│ MEMORY                                       │
│                                              │
│ Stack / Heap                                 │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ STACK                                    │ │
│ │                                          │ │
│ │ function frame                           │ │
│ │ local references ────────────────┐       │ │
│ └──────────────────────────────────┼───────┘ │
│                                    │         │
│                                    ▼         │
│ ┌──────────────────────────────────────────┐ │
│ │ HEAP                                     │ │
│ │                                          │ │
│ │ Object                                  │ │
│ │ [10,20,30]                              │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ FUNCTION CALL → FRAME                        │
│                                              │
│ NESTED CALLS → LIFO                          │
│                                              │
│ RETURN → FRAME REMOVED                       │
│                                              │
│ OBJECT MAY CONTINUE TO EXIST                 │
│                                              │
│ FINAL MENTAL MODEL                           │
└──────────────────────────────────────────────┘
```

---

# 46. M4 Hero Statement

> **The stack models active function execution; the heap models dynamically managed objects and data. References connect execution contexts to objects.**

This is the primary M4 teaching statement.

---

# 47. M4 Hero Diagram

```text
             ACTIVE FUNCTION

┌──────────────────────────────┐
│            STACK             │
│                              │
│  process frame               │
│                              │
│  data ──────────────────┐   │
└──────────────────────────┼───┘
                           │
                           ▼
┌──────────────────────────────┐
│             HEAP             │
│                              │
│       ┌──────────────┐       │
│       │ DATA OBJECT  │       │
│       │              │       │
│       │ [10,20,30]   │       │
│       └──────────────┘       │
└──────────────────────────────┘
```

---

# 48. M4 Colour Strategy

### Primary — `#F54A8D`

Use for:

* `MEMORY` eyebrow
* stack → heap arrows
* active function frame indicator
* call/return animation
* `STACK`
* `HEAP` emphasis when introducing the two concepts
* LIFO indicator
* active references
* important transitions

### Secondary — `#0B1B3D`

Use for:

* title
* normal content
* object containers
* code
* labels
* descriptions
* function names
* frame content

### Neutral

Use for:

* backgrounds
* cards
* object surfaces
* spacing
* diagrams' supporting surfaces

---

# 49. M4 70% / 30% Rule

```text
70%
────────────────────────
#0B1B3D
white
light neutral
normal text
object surfaces
```

```text
30%
────────────────────────
#F54A8D
arrows
active stack/heap relationships
call transitions
key concepts
```

The pink should guide the eye:

```text
STACK
  ↓
HEAP
```

rather than flood the entire page.

---

# 50. M4 HTML Tag Colour Table

| HTML Tag            | Purpose               | Colour                |
| ------------------- | --------------------- | --------------------- |
| `<section>`         | Root MemoryBlock      | Neutral               |
| `<header>`          | Block header          | Neutral               |
| `<span>`            | `MEMORY` eyebrow      | **Primary #F54A8D**   |
| `<h2>`              | `Stack / Heap`        | **Secondary #0B1B3D** |
| `<p>`               | Context               | **Secondary #0B1B3D** |
| `<article>`         | Stack/Heap card       | Neutral               |
| `<h3>`              | Major section heading | **Secondary #0B1B3D** |
| `<h4>`              | Subheading            | **Secondary #0B1B3D** |
| `<code>`            | Code examples         | **Secondary #0B1B3D** |
| `<strong>`          | Important terminology | **Secondary #0B1B3D** |
| `<span>`            | Stack/heap arrow      | **Primary #F54A8D**   |
| `<span>`            | Active function       | **Primary #F54A8D**   |
| `<span>`            | Reference connector   | **Primary #F54A8D**   |
| `<span>`            | `LIFO`                | **Primary #F54A8D**   |
| `<span>`            | Object label          | **Secondary #0B1B3D** |
| `<div>`             | Diagram container     | Neutral               |
| `<aside>`           | Important caveat      | Neutral               |
| `<h3>` in `<aside>` | Caveat heading        | **Primary #F54A8D**   |
| `<p>` in `<aside>`  | Caveat text           | **Secondary #0B1B3D** |

---

# 51. Semantic HTML Structure

```text
<section>
│
├── <header>
│   ├── <span> MEMORY </span>
│   └── <h2> Stack / Heap </h2>
│
├── <p>
│
├── <section class="stack-heap-hero">
│   ├── <h3>
│   └── stack → heap diagram
│
├── <section class="stack-frame">
│   ├── <h3>
│   └── frame diagram
│
├── <section class="function-call">
│   ├── <h3>
│   └── call stack animation
│
├── <section class="function-return">
│   ├── <h3>
│   └── frame removal
│
├── <section class="stack-vs-heap">
│   ├── <h3>
│   └── comparison
│
├── <section class="recursion">
│   ├── <h3>
│   └── recursive stack
│
├── <section class="real-world-examples">
│   ├── Python
│   ├── JavaScript
│   ├── Java
│   ├── C++
│   ├── NumPy
│   └── Pandas
│
└── <aside>
    ├── <h3>
    └── <p>
```

---

# 52. Complete M4 HTML

```html
<section
    class="tutorial-block memory-block memory-m4"
    data-block="memory"
    data-version="M4"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Stack / Heap
        </h2>

    </header>


    <p class="memory-context">
        The stack models active function execution,
        while the heap models dynamically managed objects
        and data. References connect execution contexts
        to objects.
    </p>


    <section class="stack-heap-hero">

        <h3>
            Stack → Heap
        </h3>

        <div class="memory-diagram">

            <article class="stack-card">

                <h4>
                    STACK
                </h4>

                <p>
                    Function frame
                </p>

                <p>
                    Local references
                </p>

            </article>

            <span class="memory-arrow">
                ↓ reference
            </span>

            <article class="heap-card">

                <h4>
                    HEAP
                </h4>

                <p>
                    Object
                </p>

                <code>
                    [10, 20, 30]
                </code>

            </article>

        </div>

    </section>


    <section class="stack-frame">

        <h3>
            Stack Frame
        </h3>

        <article class="frame-card">

            <h4>
                calculate()
            </h4>

            <p>
                parameters
            </p>

            <p>
                local execution state
            </p>

            <p>
                references
            </p>

            <p>
                return information
            </p>

        </article>

    </section>


    <section class="function-call">

        <h3>
            Function Calls
        </h3>

        <div class="call-stack">

            <div>
                inner()
            </div>

            <div>
                middle()
            </div>

            <div>
                outer()
            </div>

            <div>
                caller
            </div>

        </div>

        <p>
            Active calls form a conceptual LIFO structure.
        </p>

    </section>


    <section class="function-return">

        <h3>
            Returning From a Function
        </h3>

        <p>
            When a function returns, its active execution frame
            is removed from the call stack.
        </p>

        <p>
            An object created or returned by the function may
            continue to exist if it remains reachable.
        </p>

    </section>


    <section class="stack-vs-heap">

        <h3>
            Stack vs Heap
        </h3>

        <table>

            <thead>
                <tr>
                    <th>Stack</th>
                    <th>Heap</th>
                </tr>
            </thead>

            <tbody>

                <tr>
                    <td>Function execution</td>
                    <td>Dynamic objects/data</td>
                </tr>

                <tr>
                    <td>Call frames</td>
                    <td>Managed object storage</td>
                </tr>

                <tr>
                    <td>LIFO model</td>
                    <td>Dynamic lifetime</td>
                </tr>

            </tbody>

        </table>

    </section>


    <section class="recursion">

        <h3>
            Recursion and the Stack
        </h3>

        <code>
            def recurse():
                recurse()
        </code>

        <p>
            Each active recursive call requires another
            execution context.
        </p>

    </section>


    <section class="real-world-examples">

        <h3>
            Real-World Examples
        </h3>

        <article>
            <h4>Python</h4>
            <code>
                items = [1, 2, 3]
            </code>
        </article>

        <article>
            <h4>JavaScript</h4>
            <code>
                const user = { name: "Alice" };
            </code>
        </article>

        <article>
            <h4>Java</h4>
            <code>
                Person person = new Person();
            </code>
        </article>

        <article>
            <h4>C++</h4>
            <code>
                Person* person = new Person();
            </code>
        </article>

        <article>
            <h4>NumPy</h4>
            <code>
                arr = np.array([10,20,30])
            </code>
        </article>

        <article>
            <h4>Pandas</h4>
            <code>
                df = pd.DataFrame(data)
            </code>
        </article>

    </section>


    <aside class="memory-caveat">

        <h3>
            Important Caveat
        </h3>

        <p>
            Stack and heap are useful conceptual models.
            Actual memory organization depends on the language,
            compiler, runtime, operating system, and implementation.
        </p>

    </aside>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            Active function calls form a conceptual stack of
            execution contexts. Those contexts can contain
            references that provide access to dynamically managed
            objects. The exact physical implementation varies
            by language and runtime.
        </p>

    </aside>

</section>
```

---

# 53. M4 JSON Structure

```json
{
  "type": "memory",
  "version": "M4",
  "presentation": "Stack / Heap",

  "content": {

    "title": "Stack / Heap",

    "context": "The stack models active function execution, while the heap models dynamically managed objects and data.",

    "stack": {

      "purpose": "Active function execution",

      "frames": [

        {
          "function": "calculate",
          "parameters": [],
          "locals": [],
          "references": []
        }

      ]

    },

    "heap": {

      "objects": [

        {
          "id": "object-001",
          "type": "list",
          "value": "[10,20,30]"
        }

      ]

    },

    "relationships": [

      {
        "source": "stack.calculate.items",
        "target": "object-001",
        "relationship": "reference"
      }

    ],

    "callStack": [

      "inner",
      "middle",
      "outer",
      "caller"
    ],

    "returnFlow": {

      "frameRemoved": true,

      "objectMayRemainReachable": true

    },

    "caveat": "Stack and heap are conceptual models. Actual memory organization depends on the language, compiler, runtime, operating system, and implementation.",

    "result": {

      "title": "Final Mental Model",

      "description": "Active function calls form a conceptual stack of execution contexts. Those contexts can contain references that provide access to dynamically managed objects."
    }

  }
}
```

---

# 54. Generic M4 JSON Model

For the Tutorial Engine renderer:

```json
{
  "type": "memory",
  "version": "M4",

  "content": {

    "stack": {
      "frames": []
    },

    "heap": {
      "objects": []
    },

    "references": [],

    "callSequence": [],

    "returnSequence": [],

    "recursion": {},

    "comparison": {},

    "examples": [],

    "caveat": {
      "title": "",
      "description": ""
    },

    "result": {
      "title": "",
      "description": ""
    }

  }
}
```

---

# 55. M4 Call Stack JSON

```json
{
  "callSequence": [
    {
      "function": "outer"
    },
    {
      "function": "middle"
    },
    {
      "function": "inner"
    }
  ]
}
```

Renderer can generate:

```text
inner()
middle()
outer()
caller
```

and animate the frames entering and leaving.

---

# 56. M4 Memory Relationship JSON

```json
{
  "memoryRelationship": {

    "stack": {
      "frame": "process",
      "reference": "items"
    },

    "heap": {
      "objectId": "object-001",
      "type": "list",
      "value": "[10,20,30]"
    }

  }
}
```

Renderer:

```text
STACK

process
items
  │
  │ reference
  ▼

HEAP

object-001
[10,20,30]
```

---

# 57. M4 Function Return JSON

```json
{
  "functionReturn": {

    "function": "create_list",

    "returnedObject": "object-001",

    "frameAfterReturn": false,

    "callerReference": {
      "name": "items",
      "target": "object-001"
    }

  }
}
```

Renderer:

```text
create_list()
     │
     ▼
Object 001
     │
     ▼
return
     │
     ▼
items ───► Object 001
```

---

# 58. M4 Recursion JSON

```json
{
  "recursion": {

    "function": "countdown",

    "calls": [
      "countdown(3)",
      "countdown(2)",
      "countdown(1)",
      "countdown(0)"
    ],

    "direction": "push_then_pop"
  }
}
```

This supports the animated stack visualization.

---

# 59. M4 Cross-Block Relationship

### M3 → M4

M3:

```text
a ─────► OBJECT
```

M4:

```text
STACK FRAME
     │
     └── a ─────► OBJECT
```

---

### M4 → M5

M4:

```text
STACK
  │
  └────► OBJECT
```

M5:

```text
STACK
  │
  └────► OBJECT
             │
             ├── metadata
             ├── type
             ├── state
             └── internal representation
```

---

### M4 → M6

M4 gives us:

```text
STACK + HEAP
```

M6 will show:

```text
BEFORE
STACK + HEAP

OPERATION

AFTER
STACK + HEAP
```

---

### M4 → M7

M4 introduces:

```text
object exists
```

M7 will explain:

```text
allocated
   ↓
used
   ↓
reachable
   ↓
unreachable
   ↓
reclaimed
```

---

### M4 → M8

M8 integrates:

```text
NAME
 ↓
REFERENCE
 ↓
STACK / EXECUTION
 ↓
OBJECT
 ↓
MEMORY
 ↓
LIFETIME
```

---

# 60. M4 Accessibility

Never communicate the difference purely through pink/navy.

Use explicit labels:

```text
STACK
Active execution context
```

and:

```text
HEAP
Dynamically managed objects/data
```

The arrow should say:

```text
reference
```

rather than relying on its colour.

---

# 61. M4 Responsive Design

### Desktop

```text
STACK
   │
   ▼
HEAP
```

with both as large cards.

### Mobile

```text
┌──────────────┐
│    STACK     │
│ frame        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     HEAP     │
│ object       │
└──────────────┘
```

The stack and heap cards should never become too narrow to read.

---

# 62. M4 Animation

Recommended sequence:

### Step 1

```text
caller
```

### Step 2

```text
caller
outer()
```

### Step 3

```text
caller
outer()
middle()
```

### Step 4

```text
caller
outer()
middle()
inner()
```

### Step 5

Highlight:

```text
inner()
```

### Step 6

Return:

```text
inner() removed
```

### Step 7

Continue unwinding.

This teaches the stack far more effectively than a paragraph.

---

# 63. M4 Information Density

| Component                   | Recommendation |
| --------------------------- | -------------: |
| Stack/Heap hero             |          **1** |
| Stack frame                 |          **1** |
| Call-stack animation        |          **1** |
| Return animation            |          **1** |
| Stack vs Heap table         |          **1** |
| Recursion                   |          **1** |
| Real-world examples         |        **4–6** |
| Long theoretical paragraphs |              ❌ |
| Object layout               |           ❌ M5 |
| Allocation details          |           ❌ M7 |
| Deallocation details        |           ❌ M7 |

---

# 64. M4 Validation Rules

| Field                  |         Required |
| ---------------------- | ---------------: |
| `type`                 |                ✅ |
| `version`              |           **M4** |
| `presentation`         | **Stack / Heap** |
| Stack                  |     **Required** |
| Heap                   |     **Required** |
| Stack frame            |     **Required** |
| Reference relationship |     **Required** |
| Function call          |     **Required** |
| Function return        |      Recommended |
| Recursion              |      Recommended |
| Stack overflow         |         Optional |
| Object layout          |             ❌ M5 |
| Before/after           |             ❌ M6 |
| Allocation             |             ❌ M7 |
| Deallocation           |             ❌ M7 |

---

# 65. M4 Final Technical Specification

| Area                           | M4 Decision                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| **Block**                      | **MemoryBlock**                                                                              |
| **Version**                    | **M4**                                                                                       |
| **Presentation**               | **Stack / Heap**                                                                             |
| **Main question**              | **Where can execution contexts and dynamically managed objects be conceptually understood?** |
| **Hero**                       | **STACK → reference → HEAP → OBJECT**                                                        |
| Stack                          | **Core**                                                                                     |
| Heap                           | **Core**                                                                                     |
| Stack frame                    | **Core**                                                                                     |
| Function call                  | **Core**                                                                                     |
| Function return                | **Core**                                                                                     |
| LIFO                           | **Core**                                                                                     |
| Nested calls                   | **Core**                                                                                     |
| Recursion                      | **Core practical example**                                                                   |
| Stack overflow                 | Supporting                                                                                   |
| Object lifetime                | Bridge to M7                                                                                 |
| Object layout                  | ❌ M5                                                                                         |
| Allocation                     | ❌ M7                                                                                         |
| Deallocation                   | ❌ M7                                                                                         |
| Physical implementation claims | ❌                                                                                            |
| Primary                        | **#F54A8D**                                                                                  |
| Secondary                      | **#0B1B3D**                                                                                  |
| Colour ratio                   | **70% / 30%**                                                                                |
| Theme                          | Light                                                                                        |
| Gradient                       | ❌                                                                                            |
| Dark theme                     | ❌                                                                                            |
| A4                             | **Portrait**                                                                                 |
| JSON-driven                    | **✅**                                                                                        |
| Responsive                     | **✅**                                                                                        |
| Accessibility                  | **✅**                                                                                        |
| Animation                      | **Highly recommended**                                                                       |

---

# 66. M4 Final Mental Model

The learner should leave M4 with this:

```text
                    PROGRAM EXECUTION

┌───────────────────────────────────────┐
│                 STACK                 │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ Active Function Frame           │  │
│  │                                 │  │
│  │ local reference ───────────┐    │  │
│  └─────────────────────────────┼────┘  │
└────────────────────────────────┼──────┘
                                 │
                                 │ reference
                                 ▼
┌────────────────────────────────────────┐
│                  HEAP                  │
│                                        │
│       ┌────────────────────────┐       │
│       │        OBJECT          │       │
│       │        state           │       │
│       └────────────────────────┘       │
│                                        │
└────────────────────────────────────────┘
```

The defining principle is:

> **The stack provides a conceptual model for active function execution and call frames, while the heap provides a conceptual model for dynamically managed objects and data. References from execution contexts can provide access to those objects. The exact physical implementation varies by language and runtime.**

---

# MemoryBlock Progress

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                 | ✅              |
| **M2**  | Variable → Object                     | ✅              |
| **M3**  | Reference Model                       | ✅              |
| **M4**  | **Stack / Heap**                      | ✅ **Complete** |
| **M5**  | **Object Memory Layout**              | ⏳ **NEXT**     |
| **M6**  | Memory Before / After                 | ⏳              |
| **M7**  | Lifecycle / Allocation / Deallocation | ⏳              |
| **M8**  | Complete Memory Model                 | ⏳              |

**Next version is therefore strictly M5 — Object Memory Layout.**



```python

```

# BLOCK 8 — MemoryBlock

## M5 — Object Memory Layout

We continue **strictly according to the committed sequence**:

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| M1      | Simple Memory Concept                 | ✅              |
| M2      | Variable → Object                     | ✅              |
| M3      | Reference Model                       | ✅              |
| M4      | Stack / Heap                          | ✅              |
| **M5**  | **Object Memory Layout**              | 🔵 **CURRENT** |
| M6      | Memory Before / After                 | ⏳              |
| M7      | Lifecycle / Allocation / Deallocation | ⏳              |
| M8      | Complete Memory Model                 | ⏳              |

M4 established:

```text
STACK / EXECUTION
       │
       │ reference
       ▼
HEAP / OBJECT
```

M5 now **opens the object**.

The learner should move from:

```text
a ─────► OBJECT
```

to:

```text
a ─────► ┌──────────────────────────┐
         │ OBJECT                   │
         │                          │
         │ identity                 │
         │ type information         │
         │ state / data             │
         │ implementation metadata  │
         └──────────────────────────┘
```

---

# 1. M5 — Version Definition

| Item                 | M5 Specification                                                 |
| -------------------- | ---------------------------------------------------------------- |
| **Block**            | MemoryBlock                                                      |
| **Version**          | **M5**                                                           |
| **Presentation**     | **Object Memory Layout**                                         |
| **Primary question** | **“What can an object conceptually contain in memory?”**         |
| **Purpose**          | Open the object and introduce its conceptual internal components |
| **Prerequisite**     | M1–M4                                                            |
| **Next dependency**  | M6 — Memory Before / After                                       |
| **Primary colour**   | **#F54A8D**                                                      |
| **Secondary colour** | **#0B1B3D**                                                      |
| **Colour rule**      | **70% / 30%**                                                    |
| **Theme**            | Light                                                            |
| **Gradient**         | ❌                                                                |
| **Dark theme**       | ❌                                                                |
| **Page**             | A4 Portrait                                                      |

---

# 2. What Changes From M4 to M5?

M4 showed the object as a single unit:

```text
STACK
  │
  ▼
┌──────────────┐
│    OBJECT    │
└──────────────┘
```

M5 opens that box:

```text
STACK
  │
  ▼
┌──────────────────────────────┐
│           OBJECT             │
├──────────────────────────────┤
│ Identity / object identity   │
│ Type information             │
│ State / data                 │
│ Runtime metadata             │
│ Implementation details      │
└──────────────────────────────┘
```

The central teaching transition is:

> **An object is not conceptually just “a value”; it is a runtime entity with identity, type information, state, and implementation-specific representation.**

---

# 3. Important M5 Boundary

We need to be very precise here.

M5 is teaching an:

> **Object Memory Layout — conceptual model**

It is **not** claiming that every programming language stores exactly these fields in exactly this physical order.

Therefore the page must distinguish:

### Conceptual

```text
Identity
Type
State
Metadata
```

from:

### Implementation-specific

```text
Exact bytes
Header size
Field offsets
Pointer size
Alignment
Allocator metadata
Runtime-specific structures
```

Those details depend on the language/runtime.

---

# 4. M5 Hero Model

The hero should be:

```text
                    REFERENCE

a ────────────────────────┐
                          │
                          ▼
             ┌─────────────────────────┐
             │         OBJECT          │
             ├─────────────────────────┤
             │                         │
             │  Identity               │
             │  Type                   │
             │  State / Data           │
             │  Runtime Metadata       │
             │  Implementation Details │
             │                         │
             └─────────────────────────┘
```

Hero statement:

> **A runtime object can be understood as an entity with identity, type information, state, and implementation-specific representation.**

---

# 5. M5 Object Identity

Every object needs to be understood as a distinct runtime entity.

Conceptually:

```text
OBJECT
   │
   └── identity
```

For Python, this connects naturally to:

```python
id(obj)
```

and:

```python
a is b
```

But remember:

> `id()` should not be taught as “the permanent physical memory address.”

A better teaching statement:

> **Python exposes an identity-related value for an object through `id()`.**

---

# 6. M5 Type Information

An object has a type.

Example:

```python
x = 100
```

Conceptually:

```text
OBJECT
├── Identity
├── Type → int
└── State → 100
```

For:

```python
name = "Alice"
```

we can visualize:

```text
OBJECT
├── Identity
├── Type → str
└── State → "Alice"
```

The type tells the runtime/program what kind of object it is and what operations are meaningful.

---

# 7. M5 State / Data

The object also has state.

For:

```python
user = {
    "name": "Alice",
    "age": 25
}
```

conceptually:

```text
OBJECT
├── Identity
├── Type → dict
└── State
     ├── name → Alice
     └── age  → 25
```

For a list:

```python
items = [10, 20, 30]
```

conceptually:

```text
OBJECT
├── Identity
├── Type → list
└── State
     ├── 10
     ├── 20
     └── 30
```

---

# 8. M5 Metadata

Runtime objects may also require metadata.

Conceptually:

```text
OBJECT
├── Identity
├── Type
├── State
└── Metadata
```

Depending on the language/runtime, metadata can include information needed to manage or interpret the object.

But M5 should **not invent a universal metadata structure**.

Instead:

> **Metadata is implementation-dependent.**

---

# 9. M5 Generic Object Model

The main reusable diagram:

```text
┌──────────────────────────────────────┐
│                OBJECT                │
├──────────────────────────────────────┤
│                                      │
│  IDENTITY                            │
│  ────────────────────────────────    │
│                                      │
│  TYPE INFORMATION                    │
│  ────────────────────────────────    │
│                                      │
│  STATE / DATA                        │
│  ────────────────────────────────    │
│                                      │
│  RUNTIME METADATA                    │
│  ────────────────────────────────    │
│                                      │
│  IMPLEMENTATION DETAILS              │
│                                      │
└──────────────────────────────────────┘
```

This should become the **standard conceptual object diagram** used throughout later MemoryBlock versions.

---

# 10. M5 Reference + Object

Combine M3 and M5:

```text
a
│
│ reference
▼
┌─────────────────────────────┐
│           OBJECT            │
├─────────────────────────────┤
│ Identity                    │
│ Type                        │
│ State                       │
│ Metadata                    │
└─────────────────────────────┘
```

This demonstrates the progression:

```text
M3
REFERENCE MODEL

        │
        ▼

M5
OBJECT INTERNAL MODEL
```

---

# 11. M5 Object Identity vs State

This distinction is important.

Suppose:

```python
items = [10, 20]
```

Then:

```text
IDENTITY
    │
    ▼
 Object A

STATE
    │
    ▼
 [10,20]
```

After:

```python
items.append(30)
```

the conceptual result is:

```text
IDENTITY
    │
    ▼
 SAME Object A

STATE
    │
    ▼
 [10,20,30]
```

So:

> **Mutation changes object state without necessarily changing object identity.**

This connects M3 → M5.

---

# 12. M5 Rebinding

Now:

```python
items = [30, 40]
```

The name can become associated with a different object:

```text
BEFORE

items ───► Object A
           [10,20]


AFTER

items ───► Object B
           [30,40]
```

Therefore:

```text
Mutation
→ same object, changed state

Rebinding
→ name associated with another object
```

M5 reinforces this distinction by making the object itself visible.

---

# 13. M5 Object Layout — Integer

Example:

```python
x = 42
```

Conceptual model:

```text
x
│
▼
┌──────────────────────┐
│ OBJECT               │
├──────────────────────┤
│ Identity             │
│ Type → int           │
│ Value / State → 42   │
│ Runtime metadata     │
└──────────────────────┘
```

Do **not** claim that this is CPython's literal byte-for-byte object layout.

It is the teaching model.

---

# 14. M5 Object Layout — String

```python
name = "Alice"
```

Conceptual:

```text
name
 │
 ▼
┌──────────────────────────┐
│ OBJECT                   │
├──────────────────────────┤
│ Identity                 │
│ Type → str               │
│ State → "Alice"          │
│ Length / runtime data    │
│ Implementation metadata  │
└──────────────────────────┘
```

---

# 15. M5 Object Layout — List

```python
items = [10, 20, 30]
```

Conceptually:

```text
items
  │
  ▼
┌────────────────────────────┐
│ LIST OBJECT                │
├────────────────────────────┤
│ Identity                   │
│ Type → list                │
│ Size / state               │
│                            │
│ references / elements ─────┼──► 10
│                         ───┼──► 20
│                         ───┼──► 30
│                            │
│ Runtime metadata            │
└────────────────────────────┘
```

This is an important transition.

The list object itself can contain **references to other objects**.

---

# 16. M5 Nested Object Model

For:

```python
user = {
    "name": "Alice",
    "age": 25
}
```

conceptually:

```text
user
 │
 ▼
┌─────────────────────┐
│ Dict Object         │
├─────────────────────┤
│ Identity            │
│ Type → dict         │
│ State               │
└──────┬─────────┬────┘
       │         │
       ▼         ▼
    "Alice"     25
```

Each referenced value can itself be an object.

This gives us the next major concept:

> **Objects can reference other objects.**

---

# 17. M5 Object Graph

Now we can introduce an object graph:

```text
        ┌───────────────┐
        │ User Object   │
        └───────┬───────┘
                │
       ┌────────┴─────────┐
       ▼                  ▼
  ┌──────────┐       ┌──────────┐
  │ String   │       │ Integer  │
  │ "Alice"  │       │   25     │
  └──────────┘       └──────────┘
```

This is extremely important because M5 prepares the learner for:

* nested structures
* graphs
* circular references
* garbage collection
* object lifecycle

Those later details belong to M7/M8.

---

# 18. M5 List Object Graph

```python
items = [10, 20, 30]
```

Conceptually:

```text
          items
             │
             ▼
      ┌──────────────┐
      │ List Object  │
      └──────┬───────┘
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
      10    20    30
```

This shows:

> The container object and the objects it refers to are conceptually distinct entities.

That is a major M5 learning outcome.

---

# 19. M5 List Does Not “Contain Raw Values” Conceptually

For educational purposes, distinguish:

```text
LIST OBJECT
     │
     ├── reference → Object 10
     ├── reference → Object 20
     └── reference → Object 30
```

rather than:

```text
LIST
[10][20][30]
```

when teaching the object/reference model.

The second representation is useful for a simple beginner view.

The first representation is better for MemoryBlock.

---

# 20. M5 Dictionary Object

```python
user = {
    "name": "Alice",
    "age": 25
}
```

Conceptually:

```text
             user
               │
               ▼
      ┌─────────────────┐
      │ Dictionary      │
      │ Object          │
      └───────┬─────────┘
              │
       ┌──────┴───────┐
       ▼              ▼
   "name" ───────► "Alice"

   "age"  ───────► 25
```

This is an object graph.

---

# 21. M5 Custom Object

Consider:

```python
class User:
    pass

user = User()
```

Conceptually:

```text
user
 │
 ▼
┌───────────────────────┐
│ User Object           │
├───────────────────────┤
│ Identity              │
│ Type → User           │
│ Instance State        │
│ Runtime Metadata      │
└───────────────────────┘
```

Then:

```python
user.name = "Alice"
```

becomes conceptually:

```text
User Object
│
├── Identity
├── Type → User
└── State
     └── name → "Alice"
```

---

# 22. M5 Class vs Instance

M5 can briefly distinguish:

```text
CLASS
   │
   │ defines behavior/structure
   ▼
INSTANCE OBJECT
```

Example:

```python
class User:
    pass

u1 = User()
u2 = User()
```

Conceptually:

```text
              User class
                  │
          ┌───────┴───────┐
          ▼               ▼
       User u1          User u2
       Object           Object
```

The two instances are separate objects.

---

# 23. M5 Same Type, Different Identity

```python
u1 = User()
u2 = User()
```

Conceptually:

```text
u1 ───► Object A
        Type → User

u2 ───► Object B
        Type → User
```

Therefore:

```text
same type
     ≠
same object
```

This reinforces the M3 identity concept.

---

# 24. M5 Shared Object

```python
u1 = User()
u2 = u1
```

Now:

```text
u1 ─────┐
        ▼
     User Object
        ▲
        │
u2 ─────┘
```

Same identity.

M5 shows what that object contains.

---

# 25. M5 Generic Object Structure

Use this as the standard diagram:

```text
                 REFERENCE
                     │
                     ▼
        ┌─────────────────────────┐
        │          OBJECT         │
        ├─────────────────────────┤
        │ Identity                │
        ├─────────────────────────┤
        │ Type                    │
        ├─────────────────────────┤
        │ State / Data            │
        ├─────────────────────────┤
        │ Runtime Metadata        │
        ├─────────────────────────┤
        │ Implementation Details  │
        └─────────────────────────┘
```

This is the M5 **hero object layout**.

---

# 26. M5 What Is “Memory Layout”?

The phrase means:

> **How the information associated with an object can be conceptually organized in memory.**

At a low level, actual memory consists of bytes:

```text
BYTE
BYTE
BYTE
BYTE
BYTE
...
```

Those bytes are interpreted according to the runtime/type/object representation.

M5 begins to bridge:

```text
HIGH LEVEL
OBJECT

        ↓

CONCEPTUAL STRUCTURE

        ↓

LOW LEVEL
BYTES / REPRESENTATION
```

The full byte-level treatment should not happen yet.

---

# 27. M5 Bytes

A simple visual:

```text
OBJECT
   │
   ▼
CONCEPTUAL FIELDS
   │
   ▼
┌────┬────┬────┬────┬────┬────┐
│byte│byte│byte│byte│byte│... │
└────┴────┴────┴────┴────┴────┘
```

The actual encoding and layout are implementation-specific.

---

# 28. M5 Object Header

For languages/runtimes that use object headers, we can introduce:

```text
┌───────────────────────────┐
│ OBJECT HEADER             │
├───────────────────────────┤
│ TYPE / RUNTIME INFO       │
│ OTHER METADATA            │
├───────────────────────────┤
│ OBJECT STATE / DATA       │
└───────────────────────────┘
```

But this must be labelled:

> **Conceptual runtime object layout**

rather than a universal physical layout.

---

# 29. Python / CPython Boundary

Since the course often teaches Python internals, M5 can introduce:

> **CPython objects have implementation-specific internal structures.**

For example, CPython objects carry runtime information that supports object identity/type and reference management.

But we should **not yet turn M5 into a CPython source-code deep dive**.

That belongs in a dedicated Python internals lesson.

M5's role is to give the learner the conceptual model needed to understand those internals later.

---

# 30. M5 Reference Counting Preview

For CPython, reference counting is important.

But:

```text
reference count
```

belongs primarily to:

> **M7 — Lifecycle / Allocation / Deallocation**

M5 can show a small preview:

```text
OBJECT
├── identity
├── type
├── state
└── runtime management information
```

and say:

> **Some runtimes maintain information used to manage an object's lifetime.**

Do not explain the full reference-count algorithm yet.

---

# 31. M5 Mutable Object

For:

```python
items = [1, 2]
```

M5:

```text
items
 │
 ▼
┌────────────────────┐
│ List Object        │
├────────────────────┤
│ Identity           │
│ Type → list        │
│ State              │
│ [1, 2]             │
└────────────────────┘
```

After:

```python
items.append(3)
```

the object becomes:

```text
┌────────────────────┐
│ SAME List Object   │
├────────────────────┤
│ Identity           │
│ Type → list        │
│ State              │
│ [1, 2, 3]          │
└────────────────────┘
```

Identity remains conceptually the same.

State changes.

---

# 32. M5 Immutable Object

For:

```python
x = 10
```

then:

```python
x = 20
```

conceptually:

```text
BEFORE

x ───► Object A
       int
       10


AFTER

x ───► Object B
       int
       20
```

The important M5 teaching point:

> **Rebinding a name can change which object it references.**

For immutable objects, operations generally produce another value/object rather than changing the existing object's state in place.

---

# 33. M5 Object Graph + Aliasing

Combine M3 and M5:

```text
a ─────┐
       │
       ▼
┌─────────────────┐
│ List Object     │
├─────────────────┤
│ Identity        │
│ Type → list     │
│ State           │
└──────┬──────────┘
       │
       ├────► Object 10
       ├────► Object 20
       └────► Object 30
       ▲
       │
b ─────┘
```

This is a powerful final M5 diagram.

---

# 34. M5 Nested Objects

Consider:

```python
data = {
    "users": [
        {"name": "Alice"},
        {"name": "Bob"}
    ]
}
```

Conceptually:

```text
data
 │
 ▼
Dictionary Object
 │
 └── users
       │
       ▼
   List Object
    │      │
    ▼      ▼
 Dict     Dict
  │        │
  ▼        ▼
"Alice"  "Bob"
```

This shows why a program's memory is better understood as an **object graph** than as isolated variables.

---

# 35. M5 Real-World Backend Example

```python
request = {
    "user": {
        "id": 101,
        "role": "admin"
    }
}
```

Conceptually:

```text
request
   │
   ▼
Request Object
   │
   └── user
        │
        ▼
     User Object
      ├── id
      └── role
```

Each layer is an object/state structure.

This helps explain nested API payloads.

---

# 36. M5 Data Engineering Example

```python
pipeline = {
    "source": source,
    "transform": transform,
    "output": output
}
```

Conceptually:

```text
Pipeline Object
 ├── source ───────► Source Object
 ├── transform ────► Transform Object
 └── output ───────► Output Object
```

The pipeline is an object graph.

---

# 37. M5 Data Science Example

```python
experiment = {
    "model": model,
    "dataset": dataset,
    "metrics": metrics
}
```

Conceptually:

```text
Experiment Object
 ├── model   ─────► Model Object
 ├── dataset ─────► Dataset Object
 └── metrics ─────► Metrics Object
```

This makes object composition visually obvious.

---

# 38. M5 Cyber Security Example

```python
context = {
    "user": user,
    "permissions": permissions,
    "session": session
}
```

Conceptually:

```text
Security Context
 ├── user        ───► User Object
 ├── permissions ───► Permission Object
 └── session     ───► Session Object
```

This is useful for teaching why modifying shared nested state can have consequences.

---

# 39. M5 Ethical Hacking Example

In a controlled lab:

```text
Lab Context
 ├── target configuration
 ├── test credentials
 ├── scan results
 └── reporting data
```

Each component can be represented conceptually as an object or referenced structure.

Again, M5 is explaining **object representation**, not security exploitation.

---

# 40. M5 Quantum Computing Example

```python
experiment = {
    "circuit": circuit,
    "backend": backend,
    "result": result
}
```

Conceptually:

```text
Experiment Object
 ├── circuit ──► Circuit Object
 ├── backend ──► Backend Object
 └── result ───► Result Object
```

This demonstrates object composition in scientific software.

---

# 41. M5 NumPy Object

For:

```python
arr = np.array([10, 20, 30])
```

conceptually:

```text
arr
 │
 ▼
┌─────────────────────────┐
│ ndarray Object          │
├─────────────────────────┤
│ Identity                │
│ Type → ndarray          │
│ Shape                   │
│ Dtype                   │
│ Strides / metadata      │
│ Data reference/buffer   │
└─────────────────────────┘
```

This is a particularly useful example because an ndarray contains **metadata plus access to data storage**.

The exact internal layout belongs to NumPy implementation details.

---

# 42. M5 Pandas DataFrame

Conceptually:

```text
df
 │
 ▼
┌─────────────────────────┐
│ DataFrame Object        │
├─────────────────────────┤
│ Identity                │
│ Type                    │
│ Index                   │
│ Columns                 │
│ Data representation     │
│ Runtime metadata        │
└─────────────────────────┘
```

This demonstrates that high-level data structures can have significant internal organization.

---

# 43. M5 Object Layout vs Variable

This should be a major comparison:

| Concept        | Variable / Name                          | Object                                   |
| -------------- | ---------------------------------------- | ---------------------------------------- |
| Role           | Provides a name/access path              | Runtime entity                           |
| Identity       | Not the object itself                    | Has identity                             |
| Type           | Associated with referenced value/object  | Object has a type                        |
| State          | Does not itself represent object state   | Contains/represents state                |
| Can be rebound | Yes                                      | Object identity remains distinct         |
| Can be shared  | Multiple names can reference same object | Same object can have multiple references |

The important lesson:

> **The name and the object are not the same thing.**

---

# 44. M5 Object Layout vs Value

Another important distinction:

```text
VALUE
```

is a conceptual property/state.

```text
OBJECT
```

is the runtime entity that carries identity, type and state.

For example:

```python
x = [1,2,3]
```

We can distinguish:

```text
x
│
└── reference
      │
      ▼
   OBJECT
      │
      └── STATE → [1,2,3]
```

---

# 45. M5 Main Visual

The strongest visual should be:

```text
                      a
                      │
                      │ reference
                      ▼
        ┌───────────────────────────────┐
        │            OBJECT             │
        ├───────────────────────────────┤
        │                               │
        │  IDENTITY                     │
        │                               │
        ├───────────────────────────────┤
        │  TYPE                         │
        │                               │
        ├───────────────────────────────┤
        │  STATE / DATA                 │
        │                               │
        │  [10, 20, 30]                 │
        │                               │
        ├───────────────────────────────┤
        │  RUNTIME METADATA             │
        │                               │
        ├───────────────────────────────┤
        │  IMPLEMENTATION DETAILS       │
        │                               │
        └───────────────────────────────┘
```

---

# 46. M5 Object Graph Visual

Secondary visual:

```text
                  User Object
                      │
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
       String       Integer     List Object
       "Alice"        25            │
                                    │
                              ┌─────┼─────┐
                              ▼     ▼     ▼
                             Obj   Obj   Obj
```

This is where M5 moves beyond a single object.

---

# 47. M5 Layout Layers

The page can teach the object in four conceptual layers:

```text
LAYER 1
Identity

LAYER 2
Type

LAYER 3
State / Data

LAYER 4
Runtime / Implementation Metadata
```

Visually:

```text
┌──────────────────────────┐
│ IDENTITY                 │
├──────────────────────────┤
│ TYPE                     │
├──────────────────────────┤
│ STATE / DATA             │
├──────────────────────────┤
│ RUNTIME INFORMATION      │
└──────────────────────────┘
```

---

# 48. M5 Bytes → Object

Introduce the abstraction ladder:

```text
APPLICATION LEVEL
        │
        ▼
       NAME
        │
        ▼
    REFERENCE
        │
        ▼
      OBJECT
        │
        ▼
OBJECT REPRESENTATION
        │
        ▼
       BYTES
```

This is an excellent conceptual bridge to lower-level computer science.

---

# 49. M5 Important Caveat

The page should contain a dedicated callout:

> **Object layouts are runtime-specific.**
> The exact fields, byte offsets, headers, alignment, pointer representation, and metadata depend on the language and implementation.

This protects the tutorial from teaching a false universal model.

---

# 50. M5 HTML Semantic Structure

```text
<section>
│
├── <header>
│   ├── <span> MEMORY </span>
│   └── <h2> Object Memory Layout </h2>
│
├── <p>
│
├── <section class="object-hero">
│   ├── <h3>
│   └── object layout diagram
│
├── <section class="object-components">
│   ├── Identity
│   ├── Type
│   ├── State
│   └── Metadata
│
├── <section class="object-graph">
│   └── nested object diagram
│
├── <section class="object-examples">
│   ├── Integer
│   ├── String
│   ├── List
│   ├── Dictionary
│   ├── Custom Object
│   ├── NumPy
│   └── Pandas
│
├── <section class="mutation-rebinding">
│
├── <section class="bytes-abstraction">
│
└── <aside>
    └── implementation caveat
```

---

# 51. M5 Complete HTML

```html
<section
    class="tutorial-block memory-block memory-m5"
    data-block="memory"
    data-version="M5"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Object Memory Layout
        </h2>

    </header>


    <p class="memory-context">
        An object can be understood as a runtime entity with
        identity, type information, state, and
        implementation-specific representation.
    </p>


    <section class="object-hero">

        <h3>
            Inside an Object
        </h3>

        <div class="object-layout">

            <div class="reference-label">
                a
            </div>

            <div class="reference-arrow">
                ↓ reference
            </div>

            <article class="object-card">

                <h4>
                    OBJECT
                </h4>

                <div class="object-component">
                    IDENTITY
                </div>

                <div class="object-component">
                    TYPE
                </div>

                <div class="object-component">
                    STATE / DATA
                </div>

                <div class="object-component">
                    RUNTIME METADATA
                </div>

                <div class="object-component">
                    IMPLEMENTATION DETAILS
                </div>

            </article>

        </div>

    </section>


    <section class="object-components">

        <h3>
            Object Components
        </h3>

        <article>
            <h4>Identity</h4>
            <p>
                Distinguishes the runtime object as an entity.
            </p>
        </article>

        <article>
            <h4>Type</h4>
            <p>
                Describes what kind of object it is.
            </p>
        </article>

        <article>
            <h4>State / Data</h4>
            <p>
                Represents the object's current data or state.
            </p>
        </article>

        <article>
            <h4>Runtime Metadata</h4>
            <p>
                Runtime information used to manage or interpret
                the object may exist depending on the implementation.
            </p>
        </article>

    </section>


    <section class="object-graph">

        <h3>
            Objects Can Reference Other Objects
        </h3>

        <div class="graph">

            <article>
                User Object
            </article>

            <span>↓</span>

            <div>
                String Object
                <br>
                "Alice"
            </div>

            <div>
                Integer Object
                <br>
                25
            </div>

        </div>

    </section>


    <section class="object-examples">

        <h3>
            Object Examples
        </h3>

        <article>
            <h4>Integer</h4>
            <code>
                x = 42
            </code>
        </article>

        <article>
            <h4>String</h4>
            <code>
                name = "Alice"
            </code>
        </article>

        <article>
            <h4>List</h4>
            <code>
                items = [10, 20, 30]
            </code>
        </article>

        <article>
            <h4>Dictionary</h4>
            <code>
                user = {"name": "Alice"}
            </code>
        </article>

        <article>
            <h4>Custom Object</h4>
            <code>
                user = User()
            </code>
        </article>

        <article>
            <h4>NumPy</h4>
            <code>
                arr = np.array([10,20,30])
            </code>
        </article>

        <article>
            <h4>Pandas</h4>
            <code>
                df = pd.DataFrame(data)
            </code>
        </article>

    </section>


    <section class="mutation-rebinding">

        <h3>
            Object Identity vs State
        </h3>

        <p>
            Mutation can change the state of an existing object
            without changing its identity.
        </p>

        <p>
            Rebinding changes which object a name is associated with.
        </p>

    </section>


    <section class="bytes-abstraction">

        <h3>
            From Object to Bytes
        </h3>

        <div>
            NAME
            ↓
            REFERENCE
            ↓
            OBJECT
            ↓
            REPRESENTATION
            ↓
            BYTES
        </div>

    </section>


    <aside class="implementation-caveat">

        <h3>
            Important Caveat
        </h3>

        <p>
            This is a conceptual object-memory model.
            Exact fields, headers, byte offsets, alignment,
            pointer representation, and metadata depend on
            the language and runtime implementation.
        </p>

    </aside>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            A runtime object is more than a value. It can be
            understood as an entity with identity, type,
            state, and implementation-specific representation.
            Objects can also reference other objects, forming
            an object graph.
        </p>

    </aside>

</section>
```

---

# 52. M5 JSON Structure

```json
{
  "type": "memory",
  "version": "M5",
  "presentation": "Object Memory Layout",

  "content": {

    "title": "Object Memory Layout",

    "context": "An object can be understood as a runtime entity with identity, type information, state, and implementation-specific representation.",

    "object": {

      "identity": true,

      "type": true,

      "state": true,

      "runtimeMetadata": true,

      "implementationDetails": true

    },

    "references": [],

    "objectGraph": [],

    "examples": [],

    "mutation": {},

    "rebinding": {},

    "abstraction": [
      "NAME",
      "REFERENCE",
      "OBJECT",
      "REPRESENTATION",
      "BYTES"
    ],

    "caveat": {
      "title": "Important Caveat",
      "description": "Exact object layout depends on the language and runtime implementation."
    },

    "result": {
      "title": "Final Mental Model",
      "description": "A runtime object is more than a value. It can be understood as an entity with identity, type, state, and implementation-specific representation."
    }

  }
}
```

---

# 53. Generic M5 JSON Model

For the Tutorial Engine renderer:

```json
{
  "type": "memory",
  "version": "M5",

  "content": {

    "object": {

      "identity": {},
      "type": {},
      "state": {},
      "metadata": {},
      "implementation": {}

    },

    "references": [],

    "nestedObjects": [],

    "objectGraph": [],

    "examples": [],

    "stateChanges": [],

    "abstractionLayers": [],

    "caveat": {},

    "result": {}

  }
}
```

---

# 54. M5 Object JSON

Example:

```json
{
  "object": {

    "id": "object-001",

    "identity": {
      "concept": "runtime identity"
    },

    "type": {
      "name": "list"
    },

    "state": {
      "value": "[10,20,30]"
    },

    "metadata": {
      "conceptual": true
    }

  }
}
```

Renderer:

```text
┌──────────────────────────┐
│ OBJECT                   │
├──────────────────────────┤
│ Identity                 │
│ Type → list              │
│ State → [10,20,30]       │
│ Runtime metadata         │
└──────────────────────────┘
```

---

# 55. M5 Object Graph JSON

```json
{
  "objectGraph": {

    "root": "user",

    "nodes": [
      {
        "id": "user",
        "type": "User"
      },
      {
        "id": "name",
        "type": "str",
        "value": "Alice"
      },
      {
        "id": "age",
        "type": "int",
        "value": 25
      }
    ],

    "edges": [
      {
        "from": "user",
        "to": "name",
        "relationship": "reference"
      },
      {
        "from": "user",
        "to": "age",
        "relationship": "reference"
      }
    ]

  }
}
```

---

# 56. M5 Mutation JSON

```json
{
  "stateChange": {

    "objectId": "object-001",

    "identityChanged": false,

    "stateChanged": true,

    "before": "[1,2]",

    "after": "[1,2,3]",

    "operation": "append"

  }
}
```

Renderer can explicitly show:

```text
IDENTITY
   │
   └── SAME

STATE
   │
   ├── BEFORE → [1,2]
   │
   └── AFTER  → [1,2,3]
```

---

# 57. M5 Rebinding JSON

```json
{
  "rebinding": {

    "name": "items",

    "before": "object-001",

    "after": "object-002",

    "object-001": {
      "state": "[1,2]"
    },

    "object-002": {
      "state": "[3,4]"
    }

  }
}
```

Renderer:

```text
BEFORE

items ───► Object A
           [1,2]


AFTER

items ───► Object B
           [3,4]
```

---

# 58. M5 Object Graph Is the Important New Concept

M5 should explicitly introduce:

> **Object Graph**

Definition:

> **An object graph is a network of objects connected by references.**

Example:

```text
Object A
   │
   ├────► Object B
   │
   └────► Object C
             │
             └────► Object D
```

This concept becomes foundational for:

* nested data
* shared references
* circular references
* garbage collection
* dependency graphs
* complex application state

---

# 59. M5 Circular Reference Preview

A small preview is appropriate:

```python
a = []
a.append(a)
```

Conceptually:

```text
       ┌──────────────┐
       │ List Object  │
       └──────┬───────┘
              │
              │ reference
              ▼
       SAME OBJECT
```

This creates a cycle.

But do **not** explain garbage collection here.

Simply state:

> **Objects can participate in cycles in an object graph.**

The lifecycle implications belong to M7.

---

# 60. M5 Memory Graph

The page can introduce:

```text
REFERENCE GRAPH

      ┌─────────┐
      │ Object A│
      └────┬────┘
           │
      ┌────┴────┐
      ▼         ▼
┌─────────┐ ┌─────────┐
│ Object B│ │ Object C│
└─────────┘ └────┬────┘
                 │
                 ▼
            ┌─────────┐
            │ Object D│
            └─────────┘
```

This should visually prepare the learner for M7.

---

# 61. M5 M3 → M5 Progression

The learner should see this progression:

### M3

```text
a ─────► OBJECT
```

### M4

```text
STACK
  │
  └── a ─────► OBJECT
```

### M5

```text
STACK
  │
  └── a ─────► ┌──────────────┐
               │ OBJECT       │
               ├──────────────┤
               │ Identity     │
               │ Type         │
               │ State        │
               │ Metadata     │
               └──────────────┘
```

This is exactly why M5 comes after M4.

---

# 62. M5 → M6 Progression

M5:

```text
OBJECT
├── Identity
├── Type
├── State
└── Metadata
```

M6 will then show:

```text
BEFORE
OBJECT
State = [1,2]

        ↓ operation

AFTER
OBJECT
State = [1,2,3]
```

So M5 defines the object's structure, while M6 demonstrates **state transition over time**.

---

# 63. M5 → M7 Progression

M5:

```text
OBJECT
├── Identity
├── Type
├── State
└── Runtime information
```

M7:

```text
CREATE
  ↓
ALLOCATE
  ↓
USE
  ↓
REFERENCE
  ↓
UNREACHABLE
  ↓
RECLAIM
```

The learner now has the object model required to understand its lifecycle.

---

# 64. M5 → M8 Progression

M8 will ultimately combine:

```text
NAME
 ↓
REFERENCE
 ↓
STACK / EXECUTION
 ↓
OBJECT
 ├── Identity
 ├── Type
 ├── State
 └── Runtime Representation
 ↓
STATE CHANGE
 ↓
LIFECYCLE
 ↓
RECLAMATION
```

M5 supplies the **object interior** in that final model.

---

# 65. M5 Colour Strategy

### Primary — `#F54A8D`

Use for:

* `MEMORY`
* reference arrows
* object identity emphasis
* active object component
* object graph edges
* state-change arrows
* `SAME OBJECT`
* important conceptual transitions

### Secondary — `#0B1B3D`

Use for:

* title
* object container
* component labels
* code
* normal text
* type/state descriptions
* object names

### Neutral

Use for:

* backgrounds
* object surfaces
* cards
* diagram containers

---

# 66. M5 70% / 30%

```text
70%
#0B1B3D
white
light neutral
normal content
object structure
```

```text
30%
#F54A8D
references
identity
graph connections
state transitions
important labels
```

The pink should visually represent:

> **relationships and important memory concepts**

rather than becoming the object itself.

---

# 67. M5 HTML Tag Colour Table

| HTML Tag                | Purpose                | Colour      |
| ----------------------- | ---------------------- | ----------- |
| `<span>`                | `MEMORY`               | **#F54A8D** |
| `<h2>`                  | `Object Memory Layout` | **#0B1B3D** |
| `<p>`                   | Explanation            | **#0B1B3D** |
| `<h3>`                  | Section heading        | **#0B1B3D** |
| `<h4>`                  | Object component       | **#0B1B3D** |
| `<code>`                | Code                   | **#0B1B3D** |
| `<article>`             | Object card            | Neutral     |
| `<span>`                | Reference arrow        | **#F54A8D** |
| `<span>`                | Identity highlight     | **#F54A8D** |
| `<span>`                | Object graph edge      | **#F54A8D** |
| `<span>`                | State transition       | **#F54A8D** |
| `<aside>`               | Implementation caveat  | Neutral     |
| `<h3>` inside `<aside>` | Caveat heading         | **#F54A8D** |
| `<p>` inside `<aside>`  | Caveat                 | **#0B1B3D** |

---

# 68. M5 Animation

M5 can use a very effective **object-opening animation**.

### Step 1

```text
a
│
▼
OBJECT
```

### Step 2

Object expands:

```text
OBJECT
```

### Step 3

Show:

```text
IDENTITY
```

### Step 4

Show:

```text
TYPE
```

### Step 5

Show:

```text
STATE / DATA
```

### Step 6

Show:

```text
RUNTIME METADATA
```

### Step 7

Connect nested objects:

```text
Object
 ├──► Object
 └──► Object
```

### Step 8

Final:

```text
OBJECT GRAPH
```

This visually communicates that an object is a structured runtime entity.

---

# 69. M5 Information Density

| Component                    | Recommendation |
| ---------------------------- | -------------: |
| Object layout hero           |          **1** |
| Object component explanation |          **1** |
| Object graph                 |          **1** |
| Nested object example        |          **1** |
| Mutation vs rebinding        |          **1** |
| Bytes abstraction            |          **1** |
| Language examples            |        **4–6** |
| Long implementation details  |              ❌ |
| Exact byte offsets           |              ❌ |
| CPython source internals     |              ❌ |
| Allocation lifecycle         |           ❌ M7 |

---

# 70. M5 Validation Rules

| Field             |                 Required |
| ----------------- | -----------------------: |
| `type`            |                        ✅ |
| `version`         |                   **M5** |
| `presentation`    | **Object Memory Layout** |
| Object            |             **Required** |
| Identity          |             **Required** |
| Type              |             **Required** |
| State             |             **Required** |
| Metadata          |              Recommended |
| Object graph      |             **Required** |
| Nested objects    |              Recommended |
| Mutation          |              Recommended |
| Rebinding         |              Recommended |
| Bytes abstraction |              Recommended |
| Stack             |                     ❌ M4 |
| Before/after      |                     ❌ M6 |
| Allocation        |                     ❌ M7 |
| Deallocation      |                     ❌ M7 |

---

# 71. M5 Final Technical Specification

| Area                          | M5 Decision                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| **Block**                     | **MemoryBlock**                                             |
| **Version**                   | **M5**                                                      |
| **Presentation**              | **Object Memory Layout**                                    |
| **Main question**             | **What can an object conceptually contain?**                |
| **Hero**                      | **Reference → Object → Identity / Type / State / Metadata** |
| Identity                      | **Core**                                                    |
| Type                          | **Core**                                                    |
| State / Data                  | **Core**                                                    |
| Runtime metadata              | **Core conceptual**                                         |
| Implementation representation | **Core conceptual**                                         |
| Object graph                  | **Core**                                                    |
| Nested objects                | **Core**                                                    |
| Mutation                      | **Core connection**                                         |
| Rebinding                     | **Core connection**                                         |
| Bytes                         | **Introductory abstraction**                                |
| Circular references           | Preview only                                                |
| Exact bytes                   | ❌                                                           |
| Exact offsets                 | ❌                                                           |
| Universal object header       | ❌                                                           |
| Detailed CPython internals    | ❌                                                           |
| Allocation                    | ❌ M7                                                        |
| Deallocation                  | ❌ M7                                                        |
| Primary                       | **#F54A8D**                                                 |
| Secondary                     | **#0B1B3D**                                                 |
| Colour ratio                  | **70% / 30%**                                               |
| Theme                         | Light                                                       |
| Gradient                      | ❌                                                           |
| Dark theme                    | ❌                                                           |
| A4                            | **Portrait**                                                |
| JSON-driven                   | **✅**                                                       |
| Responsive                    | **✅**                                                       |
| Accessibility                 | **✅**                                                       |
| Animation                     | **Highly recommended**                                      |

---

# 72. M5 Final Mental Model

The learner should leave M5 with:

```text
                         NAME
                           │
                           │ reference
                           ▼
                ┌──────────────────────┐
                │        OBJECT        │
                ├──────────────────────┤
                │ Identity             │
                │ Type                 │
                │ State / Data         │
                │ Runtime Metadata     │
                │ Representation       │
                └──────────┬───────────┘
                           │
                    references
                    ┌──────┴──────┐
                    ▼             ▼
                OBJECT B      OBJECT C
```

And the final principle:

> **An object is a runtime entity with identity, type information, state, and implementation-specific representation. Objects can reference other objects, forming an object graph. The exact physical memory layout depends on the language and runtime.**

---

# MemoryBlock Progress

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                 | ✅              |
| **M2**  | Variable → Object                     | ✅              |
| **M3**  | Reference Model                       | ✅              |
| **M4**  | Stack / Heap                          | ✅              |
| **M5**  | **Object Memory Layout**              | ✅ **Complete** |
| **M6**  | **Memory Before / After**             | ⏳ **NEXT**     |
| **M7**  | Lifecycle / Allocation / Deallocation | ⏳              |
| **M8**  | Complete Memory Model                 | ⏳              |

**Next is strictly M6 — Memory Before / After.**



```python

```

Absolutely. We continue **strictly with the committed sequence**.

# BLOCK 8 — MemoryBlock

## M6 — Memory Before / After

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| M1      | Simple Memory Concept                 | ✅              |
| M2      | Variable → Object                     | ✅              |
| M3      | Reference Model                       | ✅              |
| M4      | Stack / Heap                          | ✅              |
| M5      | Object Memory Layout                  | ✅              |
| **M6**  | **Memory Before / After**             | 🔵 **CURRENT** |
| M7      | Lifecycle / Allocation / Deallocation | ⏳              |
| M8      | Complete Memory Model                 | ⏳              |

M5 taught **what an object conceptually contains**.

M6 now teaches:

> **What changes in memory when an operation is performed?**

The central M6 pattern is:

```text
BEFORE
   ↓
OPERATION
   ↓
AFTER
```

This is the first MemoryBlock version where **time and state transition** become the primary teaching mechanism.

---

# 1. M6 — Version Definition

| Item                 | M6 Specification                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| **Block**            | MemoryBlock                                                                                            |
| **Version**          | **M6**                                                                                                 |
| **Presentation**     | **Memory Before / After**                                                                              |
| **Primary question** | **“What changes in memory when code executes?”**                                                       |
| **Purpose**          | Visualize state changes, references, objects, and stack/heap relationships before and after operations |
| **Prerequisite**     | M1–M5                                                                                                  |
| **Next dependency**  | M7 — Lifecycle / Allocation / Deallocation                                                             |
| **Primary colour**   | **#F54A8D**                                                                                            |
| **Secondary colour** | **#0B1B3D**                                                                                            |
| **Colour rule**      | **70% / 30%**                                                                                          |
| **Theme**            | Light                                                                                                  |
| **Gradient**         | ❌                                                                                                      |
| **Dark theme**       | ❌                                                                                                      |
| **Page**             | A4 Portrait                                                                                            |

---

# 2. M6 Core Mental Model

The learner already knows:

```text
REFERENCE
   ↓
OBJECT
   ↓
STATE
```

M6 adds time:

```text
BEFORE
REFERENCE
   ↓
OBJECT
   ↓
STATE A

       ↓
    OPERATION

       ↓

AFTER
REFERENCE
   ↓
OBJECT
   ↓
STATE B
```

So M6 teaches:

> **Memory is not only about where things are; it is also about how references and object state change during execution.**

---

# 3. The M6 Hero

The hero visual should be:

```text
┌─────────────────────┐
│       BEFORE        │
├─────────────────────┤
│                     │
│ x ─────► Object A   │
│          state = 10 │
│                     │
└─────────────────────┘

          │
          │  x = 20
          ▼

┌─────────────────────┐
│        AFTER        │
├─────────────────────┤
│                     │
│ x ─────► Object B   │
│          state = 20 │
│                     │
└─────────────────────┘
```

But this is only **one kind of transition**.

M6 must teach several different transitions:

1. Assignment
2. Mutation
3. Rebinding
4. Aliasing
5. Object creation
6. Object becoming unreachable
7. Function call / return
8. Reference changes

---

# 4. M6 Most Important Rule

The page must distinguish:

```text
STATE CHANGE
```

from:

```text
REFERENCE CHANGE
```

and:

```text
OBJECT CREATION
```

and:

```text
OBJECT BECOMES UNREACHABLE
```

These are not the same event.

---

# 5. M6 Example 1 — Simple Assignment

```python
x = 10
```

### Before

```text
NO REFERENCE

x
```

### After

```text
x ─────► 10
```

Conceptually:

```text
BEFORE

x ──► nothing


AFTER

x ──► Integer Object
       state = 10
```

The operation creates/binds a relationship between the name and an object.

---

# 6. M6 Example 2 — Reassignment

```python
x = 10
x = 20
```

### Before second assignment

```text
x ─────► Object A
         int
         10
```

### Operation

```python
x = 20
```

### After

```text
x ─────► Object B
         int
         20
```

Visually:

```text
BEFORE                     AFTER

x ───► A                   x ───► B
       │                          │
       10                         20
```

The key lesson:

> The name `x` has been rebound.

---

# 7. M6 Example 3 — Mutation

Now:

```python
items = [1, 2]
items.append(3)
```

### Before

```text
items
  │
  ▼
┌──────────────────┐
│ List Object A    │
│                  │
│ [1, 2]           │
└──────────────────┘
```

### Operation

```python
items.append(3)
```

### After

```text
items
  │
  ▼
┌──────────────────┐
│ SAME List A      │
│                  │
│ [1, 2, 3]        │
└──────────────────┘
```

This is one of the most important M6 diagrams.

```text
IDENTITY
   SAME

STATE
   CHANGED
```

---

# 8. Mutation vs Rebinding

M6 should put these side by side.

### Mutation

```text
BEFORE

items ───► Object A
           [1,2]

          append(3)

AFTER

items ───► Object A
           [1,2,3]
```

### Rebinding

```text
BEFORE

items ───► Object A
           [1,2]

          items = [3,4]

AFTER

items ───► Object B
           [3,4]
```

The comparison:

| Operation | Reference      | Object Identity   | State              |
| --------- | -------------- | ----------------- | ------------------ |
| Mutation  | Same           | Same              | Changes            |
| Rebinding | Changes target | Target may change | New target's state |

---

# 9. M6 Example 4 — Aliasing

```python
a = [10, 20]
b = a
```

### Before `b = a`

```text
a ─────► Object A
         [10,20]

b
```

### After

```text
a ─────┐
       ▼
    Object A
    [10,20]
       ▲
       │
b ─────┘
```

The important transition:

```text
BEFORE

one reference


AFTER

two references
same object
```

---

# 10. M6 Aliasing + Mutation

Now:

```python
a.append(30)
```

### Before

```text
a ─────┐
       ▼
    Object A
    [10,20]
       ▲
       │
b ─────┘
```

### After

```text
a ─────┐
       ▼
    Object A
    [10,20,30]
       ▲
       │
b ─────┘
```

The critical observation:

> **Both references observe the changed state because they refer to the same object.**

This is an essential M6 concept.

---

# 11. M6 Example 5 — List Copy

```python
a = [10, 20]
b = a.copy()
```

### Before copy

```text
a ─────► Object A
         [10,20]

b
```

### After

```text
a ─────► Object A
         [10,20]

b ─────► Object B
         [10,20]
```

Now:

```text
same contents
≠
same object
```

This is a direct application of M3 + M5 + M6.

---

# 12. M6 Copy + Mutation

```python
a = [10,20]
b = a.copy()

a.append(30)
```

### Before

```text
a ─────► A
         [10,20]

b ─────► B
         [10,20]
```

### After

```text
a ─────► A
         [10,20,30]

b ─────► B
         [10,20]
```

Because the objects are distinct.

---

# 13. M6 Example 6 — Function Call

```python
def add(x):
    return x + 1

n = 10
result = add(n)
```

Before the call:

```text
STACK

caller
n ─────► 10
```

During the call:

```text
STACK

add frame
x ─────► 10

caller
n ─────► 10
```

After return:

```text
STACK

caller
n      ─────► 10
result ─────► 11
```

This demonstrates that a function call creates a new execution context.

---

# 14. M6 Function Call — Object Reference

Suppose:

```python
def add_item(items):
    items.append(30)

numbers = [10,20]
add_item(numbers)
```

### Before

```text
numbers
   │
   ▼
Object A
[10,20]
```

### During call

```text
STACK

add_item frame
items ─────┐
           │
           ▼
        Object A
        [10,20]

caller
numbers ───┘
```

### After

```text
numbers
   │
   ▼
Object A
[10,20,30]
```

Same object.

State changed.

---

# 15. M6 Example 7 — Local Rebinding

```python
def change(items):
    items = [100, 200]

numbers = [10,20]
change(numbers)
```

Before:

```text
numbers ───► Object A
             [10,20]
```

Inside function:

```text
change frame

items ─────► Object B
             [100,200]

numbers ───► Object A
             [10,20]
```

After return:

```text
numbers ───► Object A
             [10,20]
```

This is a very powerful example.

Why?

Because:

```text
items = [...]
```

rebinds the local reference.

It does **not** rebind the caller's `numbers`.

---

# 16. M6 Example 8 — Local Mutation

Compare:

```python
def change(items):
    items.append(100)
```

Before:

```text
numbers ───► Object A
             [10,20]
```

During:

```text
items ─────► Object A
             [10,20]
```

After:

```text
numbers ───► Object A
             [10,20,100]
```

This is why the distinction is so important:

```text
parameter reassignment
≠
object mutation
```

---

# 17. M6 Example 9 — Object Creation

```python
user = User()
```

### Before

```text
user
```

### Operation

```text
User()
```

### After

```text
user ─────► User Object
```

Conceptual transition:

```text
NO OBJECT
    ↓
OBJECT CREATED
    ↓
REFERENCE ESTABLISHED
```

The exact allocation mechanism belongs to M7.

---

# 18. M6 Example 10 — Becoming Unreachable

Consider:

```python
x = [10,20]
x = None
```

Before:

```text
x ─────► Object A
         [10,20]
```

After:

```text
x ─────► None

Object A
[10,20]

no visible reference
```

This is the correct place to introduce:

> **The object may now be unreachable.**

Do **not** yet say:

> “The object is immediately deleted.”

That belongs to M7.

---

# 19. M6 Unreachable Object

The visual should be:

```text
BEFORE

x ─────────► Object A
             [10,20]


OPERATION

x = None


AFTER

x ─────────► None

             Object A
             [10,20]
                 X
            unreachable
```

This is the bridge into M7.

---

# 20. M6 Multiple References

```python
a = [1,2]
b = a
c = a
```

### After all assignments

```text
       a ───┐
       b ───┼────► Object A
       c ───┘      [1,2]
```

Now:

```python
b = None
```

### After

```text
a ─────► Object A
         [1,2]

b ─────► None

c ─────► Object A
         [1,2]
```

Object A remains reachable.

---

# 21. M6 Remove One Reference

```python
a = [1,2]
b = a

b = None
```

### Before

```text
a ─────┐
       ▼
    Object A
    [1,2]
       ▲
       │
b ─────┘
```

### After

```text
a ─────► Object A
         [1,2]

b ─────► None
```

The object still exists as long as it remains reachable.

This prepares M7's lifecycle model.

---

# 22. M6 Remove Final Reference

```python
a = [1,2]
b = a

a = None
b = None
```

Eventually:

```text
a ───► None
b ───► None

Object A
[1,2]

unreachable
```

M6 stops here.

M7 will explain:

```text
unreachable
   ↓
reclamation mechanism
```

---

# 23. M6 Nested Object Change

```python
user = {
    "name": "Alice",
    "skills": ["Python", "SQL"]
}
```

Before:

```text
user
 │
 ▼
Dict Object
 │
 └── skills
       │
       ▼
   List Object
   [Python, SQL]
```

Operation:

```python
user["skills"].append("Docker")
```

After:

```text
user
 │
 ▼
Dict Object
 │
 └── skills
       │
       ▼
   SAME List Object
   [Python, SQL, Docker]
```

Only nested object state changed.

---

# 24. M6 Object Graph Before / After

This is the strongest complex example:

### Before

```text
        User
         │
         ▼
      Profile
         │
         ▼
      Skills
      [Python]
```

### Operation

```text
add("SQL")
```

### After

```text
        User
         │
         ▼
      Profile
         │
         ▼
      Skills
   [Python, SQL]
```

The graph structure may remain the same while the state of one object changes.

---

# 25. M6 Reference Change

Suppose:

```python
a = object_a
a = object_b
```

Before:

```text
a ─────► Object A
```

After:

```text
a ─────► Object B
```

The operation changes:

```text
REFERENCE TARGET
```

rather than modifying Object A.

---

# 26. M6 Object Identity Comparison

A useful visual:

```text
BEFORE                  AFTER

a ───► A                a ───► A
       [1,2]                   [1,2,3]

Identity: A             Identity: A
State: [1,2]            State: [1,2,3]

         MUTATION
```

versus:

```text
BEFORE                  AFTER

a ───► A                a ───► B
       [1,2]                   [3,4]

Identity: A             Identity: B

         REBINDING
```

This should be one of the major M6 teaching visuals.

---

# 27. M6 Memory Timeline

M6 can use a horizontal timeline:

```text
BEFORE ─────────► OPERATION ─────────► AFTER
```

Example:

```text
[1,2] ───── append(3) ─────► [1,2,3]
```

For rebinding:

```text
A ───── x = B ─────► B
```

For aliasing:

```text
one reference ─── b = a ───► two references
```

For object lifecycle preview:

```text
reachable ───── remove final reference ─────► unreachable
```

---

# 28. M6 Four Transition Types

M6 should explicitly categorize transitions.

| Transition              | Meaning                           |
| ----------------------- | --------------------------------- |
| **State Change**        | Same object, different state      |
| **Reference Change**    | Reference points somewhere else   |
| **Object Creation**     | New object becomes available      |
| **Reachability Change** | Number/path of references changes |

This four-part classification is the heart of M6.

---

# 29. M6 Transition 1 — State Change

```text
Object A
[1,2]

      ↓ mutation

Object A
[1,2,3]
```

Identity:

```text
SAME
```

State:

```text
CHANGED
```

---

# 30. M6 Transition 2 — Reference Change

```text
a ───► Object A

      ↓ rebinding

a ───► Object B
```

Reference target:

```text
CHANGED
```

Object A may remain unchanged.

---

# 31. M6 Transition 3 — Object Creation

```text
BEFORE

no Object A


      ↓ create


AFTER

reference ───► Object A
```

---

# 32. M6 Transition 4 — Reachability Change

```text
BEFORE

a ─────► Object A
b ─────► Object A


b = None


AFTER

a ─────► Object A
```

Reachability changed, but the object itself did not necessarily change state.

---

# 33. M6 Stack + Heap Before / After

Now connect M4 and M5.

Example:

```python id="3b0d6y"
items = [1,2]
items.append(3)
```

### BEFORE

```text
STACK
┌───────────────────┐
│ items ────────────┼──────┐
└───────────────────┘      │
                            ▼
HEAP                ┌──────────────┐
                    │ List Object  │
                    │ [1,2]        │
                    └──────────────┘
```

### AFTER

```text
STACK
┌───────────────────┐
│ items ────────────┼──────┐
└───────────────────┘      │
                            ▼
HEAP                ┌──────────────┐
                    │ SAME OBJECT  │
                    │ [1,2,3]      │
                    └──────────────┘
```

This is the perfect integration of M4 + M5 + M6.

---

# 34. M6 Stack + Heap Rebinding

```python id="b8t5rf"
items = [1,2]
items = [3,4]
```

### BEFORE

```text
STACK
items ─────► Object A

HEAP
Object A
[1,2]
```

### AFTER

```text
STACK
items ─────► Object B

HEAP
Object A
[1,2]

Object B
[3,4]
```

This is a critical visual.

It demonstrates that an old object can remain in memory even though the reference no longer points to it.

Whether and when it is reclaimed is **M7**.

---

# 35. M6 Function Return Before / After

```python id="d5j69k"
def create():
    return [1,2,3]

items = create()
```

### Before call

```text
STACK
caller
```

### During call

```text
STACK
create()
caller

HEAP
List Object A
[1,2,3]
```

### After return

```text
STACK
caller
items ─────► Object A

HEAP
List Object A
[1,2,3]
```

The function frame disappears.

The returned object remains reachable through `items`.

---

# 36. M6 Scope Example

```python id="0t50hk"
def create():
    data = [1,2,3]
    return data
```

Before return:

```text
create frame
data ─────► Object A
```

After return:

```text
caller
result ───► Object A
```

The reference from the function frame is gone, but another reference now reaches the object.

---

# 37. M6 Local Variable Disappears

This is a subtle but important distinction.

```text
BEFORE RETURN

create frame
data ─────► Object A
```

After return:

```text
create frame removed

caller
result ───► Object A
```

What changed?

```text
Function frame
    ↓
REMOVED
```

What did not necessarily change?

```text
Object A
    ↓
STILL EXISTS / REACHABLE
```

---

# 38. M6 Exception Example

```python
def process():
    data = [1,2,3]
    raise ValueError()
```

Conceptually before exception:

```text
STACK
process frame
data ───► Object A
```

During propagation, the frame is unwound.

M6 can show:

```text
BEFORE
process frame
    │
    ▼
Object A

        ↓ exception / unwind

AFTER
frame removed
```

But detailed exception propagation belongs to the Exception Handling subject.

---

# 39. M6 Mutable vs Immutable

A useful comparison:

| Operation                               | Mutable Object      | Immutable Object            |
| --------------------------------------- | ------------------- | --------------------------- |
| Modify existing state                   | Often possible      | Generally not               |
| `append()`                              | Example of mutation | Not applicable              |
| Rebinding                               | Possible            | Possible                    |
| Identity can remain same after mutation | Yes                 | No mutation of value itself |
| New object may result from operation    | Depends             | Common                      |

The key M6 visual:

```text
Mutable

A ───► [1,2]
        │
        ▼
      [1,2,3]
        SAME A
```

versus:

```text
Immutable-style value change

A ───► 10

        ↓

A ───► 20
```

with the caveat that exact object creation/reuse depends on runtime implementation.

---

# 40. M6 Python Example — Strings

```python id="g7os8u"
name = "Alice"
name = name + " Smith"
```

Conceptually:

```text
BEFORE

name ───► String A
          "Alice"


AFTER

name ───► String B
          "Alice Smith"
```

The operation does not mutate the original string in place.

---

# 41. M6 Python Example — List

```python id="6n2w4y"
items = [1,2]
items.append(3)
```

Conceptually:

```text
BEFORE

items ───► List A
           [1,2]


AFTER

items ───► List A
           [1,2,3]
```

Same object, changed state.

---

# 42. M6 Python Example — Dictionary

```python id="c3bgso"
user = {"name": "Alice"}
user["age"] = 25
```

Before:

```text
user ───► Dict A
           {
             name: Alice
           }
```

After:

```text
user ───► Dict A
           {
             name: Alice,
             age: 25
           }
```

Same dictionary object, changed state.

---

# 43. M6 Python Example — Set

```python id="vpx4dx"
skills = {"Python"}
skills.add("SQL")
```

Before:

```text
skills ───► Set A
            {Python}
```

After:

```text
skills ───► Set A
            {Python, SQL}
```

Again:

```text
same object
different state
```

---

# 44. M6 NumPy Example

```python id="2v1w6u"
arr = np.array([1,2,3])
arr[0] = 100
```

Before:

```text
arr ───► ndarray A
         [1,2,3]
```

After:

```text
arr ───► ndarray A
         [100,2,3]
```

This is a useful real-world example of state mutation.

---

# 45. M6 Pandas Example

```python id="f5bgqh"
df["age"] = [20, 30]
```

Conceptually:

```text
BEFORE

df ───► DataFrame A
        columns:
        name


AFTER

df ───► DataFrame A
        columns:
        name
        age
```

The DataFrame's state changes.

Exact pandas internals are outside M6.

---

# 46. M6 Backend Example

```python id="6zv5r7"
session = {
    "user_id": 101,
    "authenticated": True
}

session["authenticated"] = False
```

Before:

```text
session ───► Session Object
             authenticated = True
```

After:

```text
session ───► SAME Session Object
             authenticated = False
```

This is a real-world state transition.

---

# 47. M6 Data Engineering Example

```python id="8j0uup"
pipeline["status"] = "completed"
```

Before:

```text
Pipeline
status = "running"
```

After:

```text
SAME Pipeline
status = "completed"
```

The object graph remains, but object state changes.

---

# 48. M6 Data Science Example

```python id="s1t9zr"
metrics["accuracy"] = 0.94
```

Before:

```text
metrics ───► Dict A
             accuracy = 0.91
```

After:

```text
metrics ───► Dict A
             accuracy = 0.94
```

Same dictionary object.

---

# 49. M6 Cyber Security Example

```python id="3mmxw6"
session["role"] = "admin"
```

Conceptually:

```text
BEFORE

Session Object
role = "user"


AFTER

SAME Session Object
role = "admin"
```

The example can be framed safely as an **authorization-state model**, not an instruction for bypassing authorization.

---

# 50. M6 Object Graph Before / After — Complex Example

```python id="l2r8z0"
user["profile"]["skills"].append("Python")
```

### Before

```text
user
 │
 ▼
User Object
 │
 ▼
Profile Object
 │
 ▼
Skills List
[SQL]
```

### After

```text
user
 │
 ▼
User Object
 │
 ▼
Profile Object
 │
 ▼
SAME Skills List
[SQL, Python]
```

Only the list state changed.

---

# 51. M6 Core Transition Diagram

This should be the main conceptual graphic:

```text
                 BEFORE
                    │
                    ▼
          ┌─────────────────┐
          │ REFERENCES      │
          │                 │
          │ OBJECTS         │
          │                 │
          │ STATE           │
          └────────┬────────┘
                   │
                   │ OPERATION
                   ▼
          ┌─────────────────┐
          │ TRANSITION      │
          │                 │
          │ mutation        │
          │ rebinding       │
          │ creation        │
          │ reference change│
          └────────┬────────┘
                   │
                   ▼
                 AFTER
```

---

# 52. M6 Before / Operation / After Cards

The UI should use three primary cards:

```text
┌─────────────────┐
│     BEFORE      │
│                 │
│ memory state    │
└─────────────────┘

        ↓

┌─────────────────┐
│    OPERATION    │
│                 │
│ items.append(3) │
└─────────────────┘

        ↓

┌─────────────────┐
│      AFTER      │
│                 │
│ memory state    │
└─────────────────┘
```

Pink should emphasize the transition arrow.

---

# 53. M6 State Difference Highlight

Example:

```text
BEFORE

[1, 2]


AFTER

[1, 2, 3]
       ↑
     changed
```

The changed portion can be highlighted with `#F54A8D`.

The unchanged portion remains navy.

This gives the learner immediate visual feedback.

---

# 54. M6 Reference Difference Highlight

Before:

```text
a ─────► Object A
```

After:

```text
a ─────► Object B
          ↑
       new target
```

The changed reference path is highlighted pink.

---

# 55. M6 Identity Difference Highlight

Mutation:

```text
BEFORE             AFTER

Object A           Object A
   │                  │
 [1,2]              [1,2,3]

 SAME IDENTITY
```

Use pink around:

```text
SAME OBJECT
```

This prevents the learner from assuming a new object was necessarily created.

---

# 56. M6 Memory Timeline

A reusable renderer component:

```text
┌────────────┐
│   BEFORE   │
└─────┬──────┘
      │
      ▼
┌────────────┐
│  OPERATION │
└─────┬──────┘
      │
      ▼
┌────────────┐
│    AFTER   │
└────────────┘
```

For more complex lessons:

```text
BEFORE
  ↓
STEP 1
  ↓
STEP 2
  ↓
STEP 3
  ↓
AFTER
```

This can later support interactive memory tracing.

---

# 57. M6 Interactive Controls

Recommended controls:

```text
[ BEFORE ] [ OPERATION ] [ AFTER ]
```

or:

```text
← Previous     Step 2 / 3     Next →
```

The learner can step through:

```text
1. Before
2. Execute
3. After
```

This is better than displaying all three states simultaneously for complicated examples.

---

# 58. M6 JSON — Core Transition

```json id="0jflx1"
{
  "type": "memory",
  "version": "M6",
  "presentation": "Memory Before / After",

  "transition": {

    "before": {},
    "operation": {},
    "after": {}

  }
}
```

---

# 59. M6 Generic JSON Model

```json id="n8r6vo"
{
  "type": "memory",
  "version": "M6",

  "content": {

    "title": "Memory Before / After",

    "before": {
      "stack": [],
      "objects": [],
      "references": []
    },

    "operation": {
      "code": "",
      "description": "",
      "type": "mutation"
    },

    "after": {
      "stack": [],
      "objects": [],
      "references": []
    },

    "changes": [],

    "transitionType": "",

    "caveat": {},

    "result": {}

  }
}
```

---

# 60. M6 Transition Types

The JSON should explicitly support:

```json id="6ftd0e"
{
  "transitionType": "mutation"
}
```

or:

```json id="r0l4d8"
{
  "transitionType": "rebinding"
}
```

or:

```json id="q9l5te"
{
  "transitionType": "object_creation"
}
```

or:

```json id="0q7e1k"
{
  "transitionType": "reachability_change"
}
```

This gives the renderer semantic information instead of forcing it to infer the transition from text.

---

# 61. M6 Example JSON — Mutation

```json id="f7om6n"
{
  "type": "memory",
  "version": "M6",

  "transitionType": "mutation",

  "before": {

    "references": [
      {
        "name": "items",
        "target": "object-001"
      }
    ],

    "objects": [
      {
        "id": "object-001",
        "type": "list",
        "state": "[1,2]"
      }
    ]

  },

  "operation": {
    "code": "items.append(3)",
    "description": "Mutate the existing list."
  },

  "after": {

    "references": [
      {
        "name": "items",
        "target": "object-001"
      }
    ],

    "objects": [
      {
        "id": "object-001",
        "type": "list",
        "state": "[1,2,3]"
      }
    ]

  },

  "changes": [
    "state"
  ]

}
```

---

# 62. M6 Example JSON — Rebinding

```json id="7mnr6q"
{
  "type": "memory",
  "version": "M6",

  "transitionType": "rebinding",

  "before": {

    "references": [
      {
        "name": "items",
        "target": "object-001"
      }
    ]

  },

  "operation": {
    "code": "items = [3,4]"
  },

  "after": {

    "references": [
      {
        "name": "items",
        "target": "object-002"
      }
    ],

    "objects": [
      {
        "id": "object-001",
        "state": "[1,2]"
      },
      {
        "id": "object-002",
        "state": "[3,4]"
      }
    ]

  },

  "changes": [
    "reference_target"
  ]

}
```

---

# 63. M6 Example JSON — Aliasing

```json id="4is4ol"
{
  "type": "memory",
  "version": "M6",

  "transitionType": "aliasing",

  "before": {

    "references": [
      {
        "name": "a",
        "target": "object-001"
      }
    ]

  },

  "operation": {
    "code": "b = a"
  },

  "after": {

    "references": [
      {
        "name": "a",
        "target": "object-001"
      },
      {
        "name": "b",
        "target": "object-001"
      }
    ]

  },

  "changes": [
    "reference_count"
  ]

}
```

---

# 64. M6 Example JSON — Unreachable

```json id="g4xj2k"
{
  "type": "memory",
  "version": "M6",

  "transitionType": "reachability_change",

  "before": {

    "references": [
      {
        "name": "x",
        "target": "object-001"
      }
    ]

  },

  "operation": {
    "code": "x = None"
  },

  "after": {

    "references": [
      {
        "name": "x",
        "target": "None"
      }
    ],

    "objects": [
      {
        "id": "object-001",
        "state": "[10,20]",
        "reachable": false
      }
    ]

  }

}
```

Important:

```text
reachable = false
```

does **not** mean:

```text
deleted = true
```

That distinction belongs to M7.

---

# 65. M6 Example JSON — Function Call

```json id="1s1d9u"
{
  "type": "memory",
  "version": "M6",

  "transitionType": "function_call",

  "before": {
    "stack": [
      {
        "frame": "caller"
      }
    ]
  },

  "operation": {
    "code": "add(n)"
  },

  "after": {
    "stack": [
      {
        "frame": "add",
        "references": [
          {
            "name": "x",
            "target": "object-001"
          }
        ]
      },
      {
        "frame": "caller"
      }
    ]
  }

}
```

---

# 66. M6 Object Creation JSON

```json id="wn0wq7"
{
  "type": "memory",
  "version": "M6",

  "transitionType": "object_creation",

  "before": {
    "references": []
  },

  "operation": {
    "code": "user = User()"
  },

  "after": {
    "references": [
      {
        "name": "user",
        "target": "object-001"
      }
    ],

    "objects": [
      {
        "id": "object-001",
        "type": "User",
        "state": {}
      }
    ]
  }

}
```

---

# 67. M6 Semantic HTML

```text id="wkvp5k"
<section>
│
├── <header>
│   ├── <span> MEMORY </span>
│   └── <h2> Memory Before / After </h2>
│
├── <p>
│
├── <section class="memory-transition-hero">
│   ├── BEFORE
│   ├── OPERATION
│   └── AFTER
│
├── <section class="mutation">
│
├── <section class="rebinding">
│
├── <section class="aliasing">
│
├── <section class="object-creation">
│
├── <section class="reachability">
│
├── <section class="function-call">
│
├── <section class="real-world-examples">
│
└── <aside>
    ├── Important distinction
    └── M7 preview
```

---

# 68. M6 Complete HTML

```html id="xw1j7p"
<section
    class="tutorial-block memory-block memory-m6"
    data-block="memory"
    data-version="M6"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Memory Before / After
        </h2>

    </header>


    <p class="memory-context">
        Memory changes as code executes. A reference may change,
        an object's state may change, a new object may appear,
        or an object may become unreachable.
    </p>


    <section class="memory-transition-hero">

        <h3>
            Before → Operation → After
        </h3>

        <div class="transition-flow">

            <article class="before-card">

                <h4>
                    BEFORE
                </h4>

                <div class="memory-state">
                    items → [1,2]
                </div>

            </article>


            <div class="transition-arrow">
                ↓
            </div>


            <article class="operation-card">

                <h4>
                    OPERATION
                </h4>

                <code>
                    items.append(3)
                </code>

            </article>


            <div class="transition-arrow">
                ↓
            </div>


            <article class="after-card">

                <h4>
                    AFTER
                </h4>

                <div class="memory-state">
                    items → [1,2,3]
                </div>

            </article>

        </div>

    </section>


    <section class="mutation">

        <h3>
            Mutation
        </h3>

        <p>
            The same object remains, while its state changes.
        </p>

        <div>
            Object A
            <br>
            [1,2]
            <br>
            ↓
            <br>
            Object A
            <br>
            [1,2,3]
        </div>

    </section>


    <section class="rebinding">

        <h3>
            Rebinding
        </h3>

        <p>
            A reference changes its target.
        </p>

        <div>
            a → Object A
            <br>
            ↓
            <br>
            a → Object B
        </div>

    </section>


    <section class="aliasing">

        <h3>
            Aliasing
        </h3>

        <div>
            a ─────┐
                   ↓
                Object A
                   ↑
            b ─────┘
        </div>

        <p>
            Multiple references can point to the same object.
        </p>

    </section>


    <section class="object-creation">

        <h3>
            Object Creation
        </h3>

        <div>
            No object
            <br>
            ↓
            <br>
            New Object
            <br>
            ↓
            <br>
            Reference established
        </div>

    </section>


    <section class="reachability">

        <h3>
            Reachability Change
        </h3>

        <div>
            x → Object A
            <br>
            ↓
            <br>
            x = None
            <br>
            ↓
            <br>
            Object A becomes unreachable
        </div>

    </section>


    <section class="function-call">

        <h3>
            Function Call
        </h3>

        <div>
            caller
            <br>
            ↓
            <br>
            function frame
            <br>
            ↓
            <br>
            return
        </div>

    </section>


    <section class="real-world-examples">

        <h3>
            Real-World Examples
        </h3>

        <article>
            <h4>Python List</h4>
            <code>
                items.append(3)
            </code>
        </article>

        <article>
            <h4>Dictionary</h4>
            <code>
                user["age"] = 25
            </code>
        </article>

        <article>
            <h4>NumPy</h4>
            <code>
                arr[0] = 100
            </code>
        </article>

        <article>
            <h4>Pandas</h4>
            <code>
                df["age"] = values
            </code>
        </article>

        <article>
            <h4>Backend Session</h4>
            <code>
                session["authenticated"] = false
            </code>
        </article>

    </section>


    <aside class="important-distinction">

        <h3>
            Important Distinction
        </h3>

        <p>
            A changed reference, a changed object state,
            a newly created object, and an unreachable object
            are different memory events.
        </p>

    </aside>


    <aside class="m7-preview">

        <h3>
            Preview of M7
        </h3>

        <p>
            When an object becomes unreachable, this does not
            by itself mean that it has already been deleted.
            Object lifetime and reclamation are covered in
            M7 — Lifecycle / Allocation / Deallocation.
        </p>

    </aside>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            To understand memory behavior, compare the state
            before an operation with the state after it.
            Ask whether the object changed, the reference changed,
            a new object appeared, or reachability changed.
        </p>

    </aside>

</section>
```

---

# 69. M6 Final Mental Model

The learner should be able to look at any operation and ask four questions:

```text id="u0h4kl"
1. Did the reference change?

2. Did the object's state change?

3. Was a new object created?

4. Did the object's reachability change?
```

For example:

```python
items.append(3)
```

Answer:

```text
Reference changed?       NO
Object identity changed? NO
State changed?           YES
New object?              Not necessarily the list object
Reachability changed?    NO
```

Whereas:

```python
items = [3,4]
```

Answer:

```text
Reference changed?       YES
Target object changed?   YES
State of old object?     NO
New object?              YES
Reachability?            MAY change
```

That is the heart of M6.

---

# 70. M6 Final Technical Specification

| Area                         | M6 Decision                          |
| ---------------------------- | ------------------------------------ |
| **Block**                    | **MemoryBlock**                      |
| **Version**                  | **M6**                               |
| **Presentation**             | **Memory Before / After**            |
| **Main question**            | **What changes when code executes?** |
| **Hero**                     | **BEFORE → OPERATION → AFTER**       |
| Mutation                     | **Core**                             |
| Rebinding                    | **Core**                             |
| Aliasing                     | **Core**                             |
| Object creation              | **Core**                             |
| Reachability change          | **Core**                             |
| Function call/return         | **Core connection**                  |
| Object graph changes         | **Core**                             |
| Allocation internals         | ❌ M7                                 |
| Deallocation                 | ❌ M7                                 |
| Garbage collection internals | ❌ M7                                 |
| Complete lifecycle           | ❌ M7/M8                              |
| Primary                      | **#F54A8D**                          |
| Secondary                    | **#0B1B3D**                          |
| Colour ratio                 | **70% / 30%**                        |
| Theme                        | Light                                |
| Gradient                     | ❌                                    |
| Dark theme                   | ❌                                    |
| A4                           | **Portrait**                         |
| JSON-driven                  | **✅**                                |
| Responsive                   | **✅**                                |
| Accessibility                | **✅**                                |
| Step animation               | **Highly recommended**               |

---

# MemoryBlock Progress

| Version | Presentation                              | Status         |
| ------- | ----------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                     | ✅              |
| **M2**  | Variable → Object                         | ✅              |
| **M3**  | Reference Model                           | ✅              |
| **M4**  | Stack / Heap                              | ✅              |
| **M5**  | Object Memory Layout                      | ✅              |
| **M6**  | **Memory Before / After**                 | ✅ **Complete** |
| **M7**  | **Lifecycle / Allocation / Deallocation** | ⏳ **NEXT**     |
| **M8**  | Complete Memory Model                     | ⏳              |

So we remain exactly on the committed roadmap:

> **Next = M7 — Lifecycle / Allocation / Deallocation.**



```python

```

# BLOCK 8 — MemoryBlock

## M7 — Lifecycle / Allocation / Deallocation

We continue **exactly according to the committed MemoryBlock sequence**:

| Version | Presentation                              | Status         |
| ------- | ----------------------------------------- | -------------- |
| M1      | Simple Memory Concept                     | ✅              |
| M2      | Variable → Object                         | ✅              |
| M3      | Reference Model                           | ✅              |
| M4      | Stack / Heap                              | ✅              |
| M5      | Object Memory Layout                      | ✅              |
| M6      | Memory Before / After                     | ✅              |
| **M7**  | **Lifecycle / Allocation / Deallocation** | 🔵 **CURRENT** |
| M8      | Complete Memory Model                     | ⏳              |

M6 taught:

> **What changes before and after an operation?**

M7 now teaches:

> **What happens to an object across its lifetime?**

The central M7 lifecycle is:

```text
CREATE
   ↓
ALLOCATE
   ↓
INITIALIZE
   ↓
USE
   ↓
REFERENCED
   ↓
REFERENCES CHANGE
   ↓
UNREACHABLE
   ↓
RECLAIMED
```

---

# 1. M7 — Version Definition

| Item                 | M7 Specification                                              |
| -------------------- | ------------------------------------------------------------- |
| **Block**            | MemoryBlock                                                   |
| **Version**          | **M7**                                                        |
| **Presentation**     | **Lifecycle / Allocation / Deallocation**                     |
| **Primary question** | **“What happens to an object from creation to reclamation?”** |
| **Purpose**          | Teach the lifecycle of runtime objects                        |
| **Prerequisite**     | M1–M6                                                         |
| **Next dependency**  | M8 — Complete Memory Model                                    |
| **Primary colour**   | **#F54A8D**                                                   |
| **Secondary colour** | **#0B1B3D**                                                   |
| **Colour rule**      | **70% / 30%**                                                 |
| **Theme**            | Light                                                         |
| **Gradient**         | ❌                                                             |
| **Dark theme**       | ❌                                                             |
| **Page**             | A4 Portrait                                                   |

---

# 2. M7 Core Idea

M5 showed:

```text
OBJECT
├── Identity
├── Type
├── State
└── Runtime information
```

M6 showed:

```text
BEFORE
   ↓
OPERATION
   ↓
AFTER
```

M7 adds the missing dimension:

```text
TIME
```

So now:

```text
          OBJECT LIFETIME

       ┌─────────────────┐
       │                 │
       ▼                 │
    CREATED              │
       │                 │
       ▼                 │
    ALLOCATED            │
       │                 │
       ▼                 │
   INITIALIZED           │
       │                 │
       ▼                 │
       USED              │
       │                 │
       ▼                 │
 REFERENCES CHANGE       │
       │                 │
       ▼                 │
   UNREACHABLE           │
       │                 │
       ▼                 │
    RECLAIMED ───────────┘
```

---

# 3. Important M7 Terminology

We need to distinguish these terms carefully:

| Term               | Meaning                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| **Creation**       | The logical act of producing an object                                  |
| **Allocation**     | Obtaining memory/resources for the object's representation              |
| **Initialization** | Establishing the object's initial state                                 |
| **Use**            | Program operations interact with the object                             |
| **Reachability**   | Whether the object can still be reached through active references       |
| **Unreachable**    | No relevant active reference path reaches the object                    |
| **Reclamation**    | Runtime/system makes the object's resources available for reuse         |
| **Deallocation**   | Releasing the allocated memory/resource, depending on the runtime/model |

These are related, but **not identical concepts**.

---

# 4. M7 Hero Diagram

The main visual should be:

```text id="7r0z6k"
                 OBJECT LIFECYCLE

        ┌───────────────┐
        │    CREATE     │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │   ALLOCATE    │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │  INITIALIZE   │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │      USE      │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │  REFERENCES   │
        │    CHANGE     │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │  UNREACHABLE  │
        └───────┬───────┘
                ↓
        ┌───────────────┐
        │   RECLAIMED   │
        └───────────────┘
```

Pink should emphasize the downward lifecycle path.

---

# 5. M7 The Critical Distinction

A very important statement:

> **An object becoming unreachable is not necessarily the same moment as its memory being reclaimed.**

Therefore:

```text
UNREACHABLE
     ≠
IMMEDIATELY DEALLOCATED
```

This is one of the most important lessons of M7.

---

# 6. M7 Example — Creating an Object

```python
user = User()
```

Conceptually:

```text
User()
   ↓
CREATE OBJECT
   ↓
ALLOCATE REPRESENTATION
   ↓
INITIALIZE OBJECT
   ↓
user ─────► OBJECT
```

The exact sequence depends on the language/runtime.

Therefore we should describe this as a **conceptual lifecycle**, not claim a universal implementation sequence.

---

# 7. M7 Creation

Before:

```text
user
```

After:

```text
user ─────► User Object
```

Lifecycle:

```text
NO OBJECT
    ↓
CREATE
    ↓
OBJECT EXISTS
```

---

# 8. M7 Allocation

Allocation means obtaining the memory/resources needed to represent the object.

Conceptually:

```text
Runtime
   │
   │ request storage
   ▼
┌─────────────────────┐
│ Memory / Resource   │
│ available           │
└─────────────────────┘
```

Then:

```text
allocated region
      ↓
object representation
```

Important:

> **Allocation is an implementation concern.**

The programmer usually does not directly specify the raw memory location.

---

# 9. M7 Initialization

After the necessary representation exists, the object needs an initial state.

Example:

```python
items = []
```

Conceptually:

```text
ALLOCATE
    ↓
List Object
    ↓
INITIALIZE
    ↓
empty state
[]
```

Then:

```text
items ─────► []
```

---

# 10. M7 Allocation vs Initialization

This distinction should be visually explicit.

```text
ALLOCATION
    │
    ▼
Memory/resource obtained
    │
    ▼
INITIALIZATION
    │
    ▼
Object state established
```

Do not teach:

> allocation = initialization

They are conceptually different.

---

# 11. M7 Use

Once initialized:

```python
items.append(10)
items.append(20)
```

The object enters active use.

```text
Object
   │
   ├── referenced
   ├── read
   ├── modified
   └── passed to functions
```

This corresponds to the M6 state-transition concepts.

---

# 12. M7 Object Lifetime

The lifetime can be visualized as:

```text
          LIFE
           │
           ▼
CREATE ──► USE ──► UNREACHABLE ──► RECLAIM
```

The duration between creation and reclamation is the object's conceptual lifetime.

But exact lifetime rules depend on the runtime.

---

# 13. M7 Reachability

This is the most important new concept.

An object is **reachable** if the program/runtime can reach it through active references.

Example:

```python
a = [10,20]
```

```text
a ─────► Object A
```

Object A is reachable.

---

# 14. M7 Multiple References

```python
a = [10,20]
b = a
```

Now:

```text
a ─────┐
       ▼
    Object A
       ▲
       │
b ─────┘
```

Object A has multiple reference paths.

It remains reachable.

---

# 15. M7 Remove One Reference

```python
b = None
```

After:

```text
a ─────► Object A

b ─────► None
```

Object A is still reachable.

Therefore:

```text
references decreased
      ↓
object still reachable
```

---

# 16. M7 Remove Final Reference

Then:

```python
a = None
```

Now:

```text
a ─────► None
b ─────► None

Object A
   │
   └── no active reference path
```

Conceptually:

```text
Object A
   ↓
UNREACHABLE
```

This does **not** yet mean:

```text
memory definitely reclaimed at this exact instant
```

---

# 17. M7 Reachability Diagram

This should be a major visual:

```text
REACHABLE

a ─────────► Object A
             [10,20]


       remove reference


UNREACHABLE

a ─────────► None

             Object A
                X
```

Pink marks the lost reference path.

---

# 18. M7 Reference Counting Preview

For CPython, reference counting is important.

Conceptually:

```text
Object A
references = 2
```

After:

```python
b = None
```

conceptually:

```text
Object A
references = 1
```

After:

```python
a = None
```

conceptually:

```text
Object A
references = 0
```

At that point CPython's reference-counting mechanism can make the object eligible for immediate destruction/reclamation, subject to the actual runtime rules and cyclic-GC considerations.

This is a **Python-specific implementation detail**, not a universal object-lifetime rule.

---

# 19. M7 Python Reference Counting

For Python teaching:

```text
Object A
   │
   ├── reference from a
   └── reference from b
```

Conceptually:

```text
reference count = 2
```

Then:

```python
b = None
```

```text
reference count = 1
```

Then:

```python
a = None
```

```text
reference count = 0
```

For CPython, this can trigger object destruction promptly.

But:

> **Reference counting is a CPython implementation mechanism, not the universal definition of garbage collection.**

---

# 20. M7 Circular Reference

Now the important exception.

```python
a = []
a.append(a)
```

Conceptually:

```text
a
│
▼
┌─────────────┐
│ List Object │
│             │
│ ┌─────────┐ │
│ │   self ─┼─┘
│ └─────────┘ │
└─────────────┘
```

The object references itself.

Then:

```python
a = None
```

The external reference disappears.

But:

```text
Object
  ▲ │
  └─┘
```

The object is part of a cycle.

This is why simple reference counting alone is not the complete story for CPython memory management.

---

# 21. M7 Cyclic Garbage Collection

For Python:

```text
External references
       │
       ▼
   Object graph
       │
       ▼
  Reachability analysis
       │
       ▼
Unreachable cycles
       │
       ▼
Reclamation
```

The details of CPython's cyclic garbage collector are advanced.

M7 should introduce the concept but not become a full garbage-collector implementation lesson.

---

# 22. M7 Reachability vs Reference Count

These concepts must not be treated as identical.

| Concept             | Meaning                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| **Reference count** | Number of references tracked by a particular reference-counting runtime mechanism |
| **Reachability**    | Whether an object can be reached through relevant reference paths                 |
| **Garbage**         | Objects no longer useful/reachable according to the runtime's reclamation model   |
| **Reclamation**     | Runtime makes resources available for reuse                                       |

This distinction is especially important for cycles.

---

# 23. M7 Object Lifecycle State Machine

A better advanced visual:

```text
                 ┌──────────────┐
                 │    CREATED   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   ALLOCATED  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ INITIALIZED  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │     LIVE     │
                 └──────┬───────┘
                        │
                references change
                        │
                        ▼
                 ┌──────────────┐
                 │ UNREACHABLE  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  RECLAIMED   │
                 └──────────────┘
```

---

# 24. M7 Important Correction

The exact states:

```text
CREATED
ALLOCATED
INITIALIZED
LIVE
```

are a **teaching model**.

A specific language runtime may not expose or internally separate them exactly this way.

So the page must include:

> **Conceptual lifecycle — exact implementation stages vary by language and runtime.**

---

# 25. M7 Object Destruction

We need to distinguish:

```text
UNREACHABLE
```

from:

```text
DESTRUCTION
```

and:

```text
DEALLOCATION
```

Conceptually:

```text
Object becomes unreachable
          ↓
Runtime determines reclamation
          ↓
Object cleanup/destruction
          ↓
Memory/resource reclamation
```

The exact order and semantics are runtime-dependent.

---

# 26. M7 Python `__del__` Caveat

If teaching Python:

```python
class User:
    def __del__(self):
        print("cleanup")
```

Do **not** teach:

> "`__del__` is guaranteed to run immediately when an object becomes unreachable."

That is too strong.

Better:

> **`__del__` participates in finalization behavior, but it should not be treated as a general-purpose deterministic resource-management mechanism.**

Resource management should generally use explicit mechanisms such as context managers.

---

# 27. M7 Resource Management

Memory lifecycle and resource lifecycle are related but not identical.

Examples:

```text
Memory
Files
Sockets
Database connections
Locks
GPU resources
```

A file object becoming unreachable does not mean your application should rely on delayed garbage collection to close the file.

Use:

```python
with open("file.txt") as f:
    ...
```

This is a useful real-world connection.

---

# 28. M7 Context Manager

Conceptually:

```text
ENTER
  ↓
RESOURCE ACQUIRED
  ↓
USE
  ↓
EXIT
  ↓
RESOURCE RELEASED
```

This differs from:

```text
OBJECT
  ↓
UNREACHABLE
  ↓
EVENTUAL RECLAMATION
```

The learner should understand:

> **Deterministic resource release is different from memory reclamation.**

---

# 29. M7 Memory vs Resource Lifecycle

| Memory                         | External Resource                                       |
| ------------------------------ | ------------------------------------------------------- |
| Object representation          | File/socket/database connection                         |
| Runtime manages memory         | Program should often explicitly manage resource         |
| Reclamation depends on runtime | Release may need deterministic control                  |
| GC may be involved             | GC is not a substitute for explicit resource management |

---

# 30. M7 Allocation Example — List

```python
items = [10,20,30]
```

Conceptually:

```text
create list
     ↓
allocate representation
     ↓
initialize state
     ↓
bind items
```

Visual:

```text
items
  │
  ▼
┌───────────────────┐
│ List Object       │
│ [10,20,30]        │
└───────────────────┘
```

---

# 31. M7 Deallocation Example

```python
items = [10,20,30]
items = None
```

Conceptually:

```text
BEFORE

items ─────► List Object


AFTER

items ─────► None

List Object
     ↓
possibly unreachable
     ↓
eligible for reclamation
```

Again:

> **“Eligible for reclamation” is safer than “deleted immediately” as a language-independent statement.**

---

# 32. M7 Stack Frame Lifecycle

M7 also applies to function frames.

```python
def calculate():
    x = 10
    return x
```

Conceptually:

```text
CALL
 ↓
FRAME CREATED
 ↓
LOCAL REFERENCES
 ↓
EXECUTION
 ↓
RETURN
 ↓
FRAME REMOVED
```

This is a different lifecycle from heap-object lifetime.

---

# 33. M7 Frame vs Object

This distinction is critical:

```text
FUNCTION FRAME
    ↓
has local references

OBJECT
    ↓
has its own lifetime
```

When a function returns:

```text
frame may disappear
```

but:

```text
objects referenced by that frame
```

may continue to exist if another reference reaches them.

---

# 34. M7 Example — Returned Object

```python
def create():
    data = [1,2,3]
    return data

result = create()
```

During function:

```text
create frame
data ─────► Object A
```

After return:

```text
caller
result ───► Object A
```

The frame disappears.

The object survives.

This is one of the most important lifecycle examples.

---

# 35. M7 Example — Non-returned Local

```python
def create():
    data = [1,2,3]
```

After the function returns:

```text
create frame
     ↓
removed

data reference
     ↓
gone

Object A
     ↓
possibly unreachable
```

If no other reference exists, the object can become eligible for reclamation.

---

# 36. M7 Object Shared Across Frames

```python
data = [1,2,3]

def process(x):
    x.append(4)

process(data)
```

During function:

```text
caller frame
data ─────┐
          │
          ▼
       Object A
          ▲
          │
function frame
x ────────┘
```

After return:

```text
caller frame
data ─────► Object A
            [1,2,3,4]
```

The object survives because the caller still references it.

---

# 37. M7 Object Lifecycle Timeline

Use this as another major visual:

```text
TIME ─────────────────────────────────────────────►

CREATE
  │
  ▼
ALLOCATE
  │
  ▼
INITIALIZE
  │
  ▼
LIVE
  │
  ├──── READ
  ├──── WRITE
  ├──── PASS
  ├──── SHARE
  └──── MUTATE
  │
  ▼
UNREACHABLE
  │
  ▼
RECLAIMED
```

---

# 38. M7 Reachability Timeline

Example:

```python
a = [1,2]
b = a
b = None
a = None
```

Timeline:

```text
t1
a ─────► A

t2
a ─────┐
       ▼
       A
       ▲
b ─────┘

t3
a ─────► A
b ─────► None

t4
a ─────► None
b ─────► None

A = unreachable
```

This is excellent M7 material.

---

# 39. M7 Reference Count Timeline

For a simple CPython-oriented example:

```text
t1
Object A
RC ≈ 1

t2
Object A
RC ≈ 2

t3
Object A
RC ≈ 1

t4
Object A
RC ≈ 0
```

Then:

```text
CPython may promptly reclaim it
```

But avoid presenting the number as exact in every runtime situation because temporary/internal references may exist.

---

# 40. M7 Garbage Collection

The page should define:

> **Garbage collection is the process by which a runtime identifies objects that are no longer needed and reclaims their resources, according to its memory-management strategy.**

Then distinguish:

```text
Reference counting
```

from:

```text
Tracing / cyclic garbage collection
```

and from:

```text
Manual memory management
```

---

# 41. M7 Memory Management Models

A concise comparison:

| Model                  | General idea                                         |
| ---------------------- | ---------------------------------------------------- |
| **Manual**             | Programmer explicitly allocates/releases memory      |
| **Reference counting** | Track references to objects                          |
| **Tracing GC**         | Trace reachable objects and reclaim unreachable ones |
| **Hybrid**             | Runtime combines techniques                          |

Python/CPython uses a hybrid approach involving reference counting plus cyclic garbage collection.

---

# 42. M7 Language Comparison

### C

```text
malloc()
   ↓
use
   ↓
free()
```

### Java

```text
new Object()
   ↓
use
   ↓
unreachable
   ↓
GC
```

### Python / CPython

```text
object creation
   ↓
reference tracking
   ↓
use
   ↓
reference changes
   ↓
reference counting / cyclic GC
   ↓
reclamation
```

The exact implementation details differ.

---

# 43. M7 C Example

A conceptual C lifecycle:

```c
int *p = malloc(sizeof(int));
*p = 10;
free(p);
```

Visual:

```text
ALLOCATE
   ↓
HEAP MEMORY
   ↓
USE
   ↓
FREE
```

This gives learners a contrast with managed runtimes.

---

# 44. M7 Java Example

```java
User user = new User();
user = null;
```

Conceptually:

```text
new User()
    ↓
Object created
    ↓
user references object
    ↓
user = null
    ↓
object may become unreachable
    ↓
GC may reclaim it later
```

The timing of GC is not deterministic from ordinary application code.

---

# 45. M7 Python Example

```python
user = User()
user = None
```

Conceptually:

```text
User Object
   ↓
reference removed
   ↓
possibly unreachable
   ↓
CPython runtime handles reclamation
```

This is the language-specific bridge.

---

# 46. M7 Object Lifecycle vs Variable Lifecycle

This distinction is essential.

```text
VARIABLE / NAME
    ↓
can be bound
    ↓
can be rebound
    ↓
can disappear with scope
```

while:

```text
OBJECT
    ↓
created
    ↓
used
    ↓
may be shared
    ↓
may become unreachable
    ↓
reclaimed
```

A variable disappearing does **not** automatically imply the object disappears.

---

# 47. M7 Scope Example

```python
def test():
    x = [1,2,3]
```

At function entry:

```text
x does not exist
```

Inside:

```text
x ─────► Object A
```

After return:

```text
x reference disappears
```

Then:

```text
if no other references:
Object A may become unreachable
```

This is the exact relationship between scope and object lifetime.

---

# 48. M7 Shared Reference Example

```python
x = [1,2,3]

def test():
    y = x

test()
```

Inside:

```text
x ─────┐
       ▼
       A
       ▲
       │
y ─────┘
```

After return:

```text
x ─────► A
```

Object A survives.

Why?

> Another reference still reaches it.

---

# 49. M7 Object Lifecycle and Aliasing

Aliasing affects lifetime:

```text
more references
      ↓
more paths to object
      ↓
object remains reachable
```

Removing references:

```text
fewer paths
      ↓
possibly unreachable
      ↓
reclamation becomes possible
```

This directly connects M3, M6 and M7.

---

# 50. M7 Object Lifecycle and Mutation

Mutation:

```text
same object
   ↓
state changes
   ↓
lifetime continues
```

Example:

```python
items.append(4)
```

This does not itself end the object's lifetime.

---

# 51. M7 Object Lifecycle and Rebinding

Rebinding:

```text
name changes target
```

Example:

```python
items = new_items
```

The old object may:

```text
still have references
```

or:

```text
become unreachable
```

depending on the rest of the program.

---

# 52. M7 Object Lifecycle Decision Tree

This is a powerful visual:

```text
                 OBJECT
                    │
                    ▼
            Is it referenced?
              /          \
            YES           NO
             │             │
             ▼             ▼
            LIVE       UNREACHABLE
                           │
                           ▼
                   Runtime reclamation
```

Then add:

```text
NO
 │
 ├── Immediate reclamation?
 │       depends on runtime
 │
 └── Delayed GC?
         possible
```

---

# 53. M7 Lifecycle State Machine — JSON

```json
{
  "lifecycle": {
    "states": [
      "created",
      "allocated",
      "initialized",
      "live",
      "unreachable",
      "reclaimed"
    ],

    "transitions": [
      {
        "from": "created",
        "to": "allocated"
      },
      {
        "from": "allocated",
        "to": "initialized"
      },
      {
        "from": "initialized",
        "to": "live"
      },
      {
        "from": "live",
        "to": "unreachable"
      },
      {
        "from": "unreachable",
        "to": "reclaimed"
      }
    ]
  }
}
```

---

# 54. M7 Complete JSON Structure

```json
{
  "type": "memory",
  "version": "M7",
  "presentation": "Lifecycle / Allocation / Deallocation",

  "content": {

    "title": "Object Lifecycle",

    "lifecycle": {
      "create": {},
      "allocate": {},
      "initialize": {},
      "use": {},
      "reachability": {},
      "unreachable": {},
      "reclaim": {}
    },

    "references": [],

    "referenceCounts": [],

    "objectGraphs": [],

    "cycles": [],

    "frames": [],

    "resourceManagement": [],

    "languageComparisons": [],

    "caveats": [],

    "result": {}

  }
}
```

---

# 55. M7 Python Lifecycle JSON

```json
{
  "language": "python",
  "runtime": "CPython",

  "lifecycle": {

    "creation": {
      "code": "items = [1,2,3]"
    },

    "live": {
      "references": [
        "items"
      ]
    },

    "referenceChange": {
      "code": "items = None"
    },

    "reachability": {
      "status": "potentially_unreachable"
    },

    "reclamation": {
      "mechanisms": [
        "reference counting",
        "cyclic garbage collection"
      ]
    }

  }
}
```

---

# 56. M7 Reference Graph JSON

```json
{
  "object": {
    "id": "object-001",
    "type": "list"
  },

  "references": [
    {
      "name": "a",
      "target": "object-001"
    },
    {
      "name": "b",
      "target": "object-001"
    }
  ],

  "reachability": {
    "status": "reachable",
    "referencePaths": 2
  }
}
```

---

# 57. M7 Cycle JSON

```json
{
  "objectGraph": {

    "nodes": [
      {
        "id": "A",
        "type": "list"
      }
    ],

    "edges": [
      {
        "from": "A",
        "to": "A"
      }
    ],

    "cycle": true

  }
}
```

This lets the UI render:

```text
┌──────────────┐
│ Object A     │
│              │
│    ┌──────┐  │
│    │      │  │
│    └──────┘  │
└──────────────┘
```

---

# 58. M7 Lifecycle Timeline JSON

```json
{
  "timeline": [

    {
      "stage": "create",
      "label": "Object created"
    },

    {
      "stage": "allocate",
      "label": "Representation allocated"
    },

    {
      "stage": "initialize",
      "label": "Initial state established"
    },

    {
      "stage": "use",
      "label": "Object used"
    },

    {
      "stage": "unreachable",
      "label": "No active reference path"
    },

    {
      "stage": "reclaim",
      "label": "Runtime reclaims resources"
    }

  ]
}
```

---

# 59. M7 Semantic HTML

```text
<section>
│
├── <header>
│   ├── MEMORY
│   └── Lifecycle / Allocation / Deallocation
│
├── <p>
│
├── <section class="lifecycle-hero">
│   └── lifecycle state machine
│
├── <section class="creation">
│
├── <section class="allocation">
│
├── <section class="initialization">
│
├── <section class="live-object">
│
├── <section class="reachability">
│
├── <section class="unreachable">
│
├── <section class="reclamation">
│
├── <section class="reference-counting">
│
├── <section class="cycles">
│
├── <section class="resource-management">
│
├── <section class="language-comparison">
│
└── <aside>
    └── runtime-specific caveats
```

---

# 60. M7 Complete HTML

```html
<section
    class="tutorial-block memory-block memory-m7"
    data-block="memory"
    data-version="M7"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2 class="memory-title">
            Lifecycle / Allocation / Deallocation
        </h2>

    </header>


    <p class="memory-context">
        Objects have a lifecycle. They are created, represented
        in memory, initialized, used, and eventually may become
        unreachable and have their resources reclaimed.
    </p>


    <section class="lifecycle-hero">

        <h3>
            Object Lifecycle
        </h3>

        <div class="lifecycle-flow">

            <div>CREATE</div>

            <span>↓</span>

            <div>ALLOCATE</div>

            <span>↓</span>

            <div>INITIALIZE</div>

            <span>↓</span>

            <div>USE</div>

            <span>↓</span>

            <div>UNREACHABLE</div>

            <span>↓</span>

            <div>RECLAIMED</div>

        </div>

    </section>


    <section class="creation">

        <h3>
            Creation
        </h3>

        <p>
            A program operation causes a new object to be produced.
        </p>

    </section>


    <section class="allocation">

        <h3>
            Allocation
        </h3>

        <p>
            The runtime obtains memory or other resources needed
            to represent the object.
        </p>

    </section>


    <section class="initialization">

        <h3>
            Initialization
        </h3>

        <p>
            The object's initial type-specific state is established.
        </p>

    </section>


    <section class="live-object">

        <h3>
            Live Object
        </h3>

        <p>
            The object can be referenced, read, modified,
            passed between functions, or shared.
        </p>

    </section>


    <section class="reachability">

        <h3>
            Reachability
        </h3>

        <div>
            a ─────┐
                   ▼
                Object A
                   ▲
                   │
            b ─────┘
        </div>

        <p>
            Multiple references can keep an object reachable.
        </p>

    </section>


    <section class="unreachable">

        <h3>
            Unreachable
        </h3>

        <div>
            a → None
            <br>
            b → None
            <br>
            <br>
            Object A
            <br>
            unreachable
        </div>

        <p>
            Unreachable does not universally mean immediately
            deallocated.
        </p>

    </section>


    <section class="reclamation">

        <h3>
            Reclamation
        </h3>

        <p>
            The runtime eventually releases or reuses resources
            associated with objects according to its memory-management
            strategy.
        </p>

    </section>


    <section class="reference-counting">

        <h3>
            Reference Counting
        </h3>

        <div>
            references → 2
            <br>
            ↓
            <br>
            references → 1
            <br>
            ↓
            <br>
            references → 0
        </div>

        <p>
            Reference counting is one memory-management technique.
        </p>

    </section>


    <section class="cycles">

        <h3>
            Circular References
        </h3>

        <div>
            Object A
            <br>
            ↺
        </div>

        <p>
            Cycles show why reference counting alone may not
            describe the complete reclamation strategy.
        </p>

    </section>


    <section class="resource-management">

        <h3>
            Memory vs Resource Management
        </h3>

        <p>
            Memory reclamation and deterministic release of
            external resources are different concerns.
        </p>

    </section>


    <section class="language-comparison">

        <h3>
            Different Runtime Strategies
        </h3>

        <article>
            <h4>Manual Memory</h4>
            <p>
                Programmer explicitly releases memory.
            </p>
        </article>

        <article>
            <h4>Reference Counting</h4>
            <p>
                Runtime tracks references.
            </p>
        </article>

        <article>
            <h4>Tracing GC</h4>
            <p>
                Runtime traces reachable objects.
            </p>
        </article>

        <article>
            <h4>Hybrid</h4>
            <p>
                Multiple memory-management techniques are combined.
            </p>
        </article>

    </section>


    <aside class="runtime-caveat">

        <h3>
            Important Caveat
        </h3>

        <p>
            This lifecycle is a conceptual teaching model.
            Exact allocation, initialization, destruction,
            deallocation, and garbage-collection behavior
            depends on the language and runtime.
        </p>

    </aside>


    <aside class="memory-result">

        <h3>
            Final Mental Model
        </h3>

        <p>
            An object's lifetime begins when it is created and
            represented by the runtime, continues while it is
            usable and reachable, and eventually ends when its
            resources are reclaimed according to the runtime's
            memory-management strategy.
        </p>

    </aside>

</section>
```

---

# 61. M7 Main Visual — Full Lifecycle

The strongest final visual should be:

```text
                 OBJECT LIFECYCLE

       ┌──────────────────────┐
       │       CREATE         │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │      ALLOCATE        │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │     INITIALIZE       │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │         LIVE         │
       │                      │
       │  read / write / use  │
       │  pass / share        │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │     UNREACHABLE      │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │      RECLAIMED       │
       └──────────────────────┘
```

---

# 62. M7 The Most Important Visual Distinction

Use:

```text
UNREACHABLE
```

in one card and:

```text
RECLAIMED
```

in another.

Between them:

```text
runtime determines when/how
```

This prevents one of the most common beginner misconceptions:

> **“When a variable disappears, the memory is immediately deleted.”**

That statement is not universally correct.

---

# 63. M7 Object Lifetime vs Reference Lifetime

Another important diagram:

```text
REFERENCE LIFETIME

a ────────────────┐
                  │
                  ▼
             Object A
                  ▲
                  │
b ────────┐       │
           │       │
           └───────┘
```

One reference can disappear while the object remains alive because another reference exists.

Therefore:

```text
reference lifetime
       ≠
object lifetime
```

---

# 64. M7 Function Frame vs Object Lifetime

```text
FUNCTION FRAME
───────────────
create
   ↓
execute
   ↓
return
   ↓
frame disappears


OBJECT
───────────────
create
   ↓
use
   ↓
shared
   ↓
still reachable
   ↓
later reclaimed
```

This distinction is extremely important for understanding Python.

---

# 65. M7 Resource Lifecycle

A separate visual:

```text
RESOURCE

ACQUIRE
   ↓
USE
   ↓
RELEASE
```

Compared with memory:

```text
OBJECT

CREATE
   ↓
USE
   ↓
UNREACHABLE
   ↓
RECLAIM
```

This teaches why:

```python
with open(...) as file:
```

is about deterministic resource management rather than merely waiting for object garbage collection.

---

# 66. M7 M1 → M7 Progression

The entire MemoryBlock progression now becomes very coherent:

### M1

```text
What is memory?
```

### M2

```text
Variable → Object
```

### M3

```text
Reference → Object
```

### M4

```text
Stack / Heap
```

### M5

```text
Inside Object
```

### M6

```text
Before → Operation → After
```

### M7

```text
Object Lifecycle
```

### M8

```text
Complete Memory Model
```

This is exactly why **M7 must come before M8**.

---

# 67. M7 → M8 Preparation

M7 gives us:

```text
CREATE
ALLOCATE
INITIALIZE
USE
REFERENCE
REACHABILITY
UNREACHABLE
RECLAIM
```

M8 will combine all previous models:

```text
NAME
 ↓
REFERENCE
 ↓
STACK / EXECUTION
 ↓
OBJECT
 ├── Identity
 ├── Type
 ├── State
 └── Representation
 ↓
OBJECT GRAPH
 ↓
STATE TRANSITION
 ↓
LIFECYCLE
 ↓
RECLAMATION
```

So M8 will be the **complete MemoryBlock mental model**, not a new isolated concept.

---

# 68. M7 Colour Strategy

### `#F54A8D`

Use for:

* lifecycle arrows
* active lifecycle stage
* reachability changes
* reference paths
* unreachable indicator
* reclamation transition
* cycle indicator
* key lifecycle labels

### `#0B1B3D`

Use for:

* title
* lifecycle stage text
* normal explanations
* object cards
* code
* diagrams
* terminology

Again:

```text
70% #0B1B3D / neutrals
30% #F54A8D
```

---

# 69. M7 Animation

The ideal animation is a **lifecycle progression**.

### Step 1

```text
CREATE
```

### Step 2

```text
ALLOCATE
```

### Step 3

```text
INITIALIZE
```

### Step 4

```text
LIVE
```

Then demonstrate:

```text
a ───► Object
```

### Step 5

Add another reference:

```text
a ───┐
     ▼
Object
     ▲
     │
b ───┘
```

### Step 6

Remove references one at a time.

### Step 7

Show:

```text
UNREACHABLE
```

### Step 8

Finally:

```text
RECLAIMED
```

This makes object lifetime visually understandable.

---

# 70. M7 Validation Rules

| Field                       |                                  Required |
| --------------------------- | ----------------------------------------: |
| `type`                      |                                         ✅ |
| `version`                   |                                    **M7** |
| `presentation`              | **Lifecycle / Allocation / Deallocation** |
| Lifecycle                   |                              **Required** |
| Creation                    |                              **Required** |
| Allocation                  |                              **Required** |
| Initialization              |                              **Required** |
| Live/use                    |                              **Required** |
| Reachability                |                              **Required** |
| Unreachable                 |                              **Required** |
| Reclamation                 |                              **Required** |
| Reference counting          |                               Recommended |
| Cycles                      |                               Recommended |
| Frame lifecycle             |                               Recommended |
| Resource management         |                               Recommended |
| Exact allocator internals   |                                         ❌ |
| Full GC implementation      |                                         ❌ |
| OS virtual-memory internals |                                         ❌ |
| Complete memory model       |                                      ❌ M8 |

---

# 71. M7 Final Technical Specification

| Area                      | M7 Decision                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| **Block**                 | **MemoryBlock**                                                  |
| **Version**               | **M7**                                                           |
| **Presentation**          | **Lifecycle / Allocation / Deallocation**                        |
| **Main question**         | **What happens to an object during its lifetime?**               |
| **Hero**                  | **CREATE → ALLOCATE → INITIALIZE → USE → UNREACHABLE → RECLAIM** |
| Creation                  | **Core**                                                         |
| Allocation                | **Core**                                                         |
| Initialization            | **Core**                                                         |
| Use                       | **Core**                                                         |
| Reachability              | **Core**                                                         |
| Unreachable               | **Core**                                                         |
| Reclamation               | **Core**                                                         |
| Reference counting        | **Core supporting concept**                                      |
| Cyclic references         | **Core supporting concept**                                      |
| Resource management       | **Supporting concept**                                           |
| Manual memory             | Comparison                                                       |
| Tracing GC                | Comparison                                                       |
| Hybrid GC                 | Comparison                                                       |
| Exact runtime internals   | ❌                                                                |
| Full CPython GC internals | ❌                                                                |
| Primary                   | **#F54A8D**                                                      |
| Secondary                 | **#0B1B3D**                                                      |
| Colour ratio              | **70% / 30%**                                                    |
| Theme                     | Light                                                            |
| Gradient                  | ❌                                                                |
| Dark theme                | ❌                                                                |
| A4                        | **Portrait**                                                     |
| JSON-driven               | **✅**                                                            |
| Responsive                | **✅**                                                            |
| Accessibility             | **✅**                                                            |
| Animation                 | **Highly recommended**                                           |

---

# 72. M7 Final Mental Model

The learner should finish M7 with this:

```text
                  OBJECT

                    │
                    ▼
                 CREATE
                    │
                    ▼
                ALLOCATE
                    │
                    ▼
               INITIALIZE
                    │
                    ▼
                   LIVE
                    │
           ┌────────┴────────┐
           │                 │
       references         state changes
           │                 │
           └────────┬────────┘
                    │
                    ▼
             REFERENCES CHANGE
                    │
                    ▼
              UNREACHABLE
                    │
                    ▼
               RECLAIMED
```

And the single most important principle:

> **An object's lifetime is not the same thing as the lifetime of any one reference to it. A reference can disappear while the object remains alive, and an unreachable object is not universally reclaimed at the exact moment it becomes unreachable.**

---

# MemoryBlock Progress

| Version | Presentation                              | Status         |
| ------- | ----------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                     | ✅              |
| **M2**  | Variable → Object                         | ✅              |
| **M3**  | Reference Model                           | ✅              |
| **M4**  | Stack / Heap                              | ✅              |
| **M5**  | Object Memory Layout                      | ✅              |
| **M6**  | Memory Before / After                     | ✅              |
| **M7**  | **Lifecycle / Allocation / Deallocation** | ✅ **Complete** |
| **M8**  | **Complete Memory Model**                 | ⏳ **NEXT**     |

So we are now at the **final version of MemoryBlock: M8 — Complete Memory Model**.



```python

```

Yes. We now move to the **final committed version of MemoryBlock: M8 — Complete Memory Model**.

The existing Tutorial Engine material supports a JSON-driven block architecture, with structured content/presentation configuration and a renderer-oriented model.  The existing memory implementation also already uses the conceptual **Variables → Objects in Memory → Values** model, so M8 should consolidate that model rather than introduce a competing representation. 

# BLOCK 8 — MemoryBlock

## M8 — Complete Memory Model

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| M1      | Simple Memory Concept                 | ✅              |
| M2      | Variable → Object                     | ✅              |
| M3      | Reference Model                       | ✅              |
| M4      | Stack / Heap                          | ✅              |
| M5      | Object Memory Layout                  | ✅              |
| M6      | Memory Before / After                 | ✅              |
| M7      | Lifecycle / Allocation / Deallocation | ✅              |
| **M8**  | **Complete Memory Model**             | 🔵 **CURRENT** |

---

# 1. M8 — What Is Its Purpose?

M8 is **not another isolated memory concept**.

It is the **integration version**.

Everything learned from M1–M7 must now come together:

```text
                    PYTHON CODE
                         │
                         ▼
                    EXECUTION
                         │
                         ▼
                 ┌───────────────┐
                 │ STACK / FRAME │
                 └───────┬───────┘
                         │
                    reference
                         │
                         ▼
                 ┌───────────────┐
                 │ OBJECT MEMORY  │
                 ├───────────────┤
                 │ identity      │
                 │ type          │
                 │ state         │
                 │ references    │
                 └───────┬───────┘
                         │
                         ▼
                  OBJECT GRAPH
                         │
                         ▼
                STATE TRANSITIONS
                         │
                         ▼
                   LIFECYCLE
                         │
                         ▼
                 REACHABILITY
                         │
                         ▼
                    RECLAIM
```

The learner should now be able to follow **one piece of code through the complete model**.

---

# 2. M8 Central Question

M1–M7 asked progressively smaller questions.

M8 asks the complete question:

> **“When Python executes this code, what happens to names, references, objects, memory, state, execution frames, and object lifetime?”**

That is the purpose of the Complete Memory Model.

---

# 3. M8 Complete Mental Model

The final model should be:

```text
                    SOURCE CODE
                        │
                        ▼
                   EXECUTION
                        │
                        ▼
              ┌──────────────────┐
              │ EXECUTION FRAME   │
              │                  │
              │ names/references │
              └────────┬─────────┘
                       │
                       │ references
                       ▼
              ┌──────────────────┐
              │      OBJECT      │
              │                  │
              │ identity         │
              │ type             │
              │ state            │
              │ internal data    │
              └────────┬─────────┘
                       │
                       ▼
                 OBJECT GRAPH
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          mutation            rebinding
             │                   │
             └─────────┬─────────┘
                       ▼
                 STATE CHANGE
                       │
                       ▼
                  LIFECYCLE
                       │
                       ▼
                REACHABILITY
                       │
                       ▼
              RECLAMATION / GC
```

This is the **M8 master diagram**.

---

# 4. M8 Connects All Previous Versions

| Previous Version | M8 Contribution                              |
| ---------------- | -------------------------------------------- |
| **M1**           | Memory as a conceptual storage/runtime model |
| **M2**           | Variable → Object                            |
| **M3**           | References and object identity               |
| **M4**           | Stack / Heap                                 |
| **M5**           | Object structure/layout                      |
| **M6**           | Before → Operation → After                   |
| **M7**           | Object lifecycle                             |
| **M8**           | **All of them simultaneously**               |

So:

```text
M1 + M2 + M3 + M4 + M5 + M6 + M7
                         ↓
                        M8
```

---

# 5. M8 The Master Example

We need one example capable of demonstrating almost everything.

Use:

```python
numbers = [10, 20]

alias = numbers

numbers.append(30)

result = numbers
```

This is an excellent M8 example because it demonstrates:

* name binding
* references
* object identity
* heap object
* aliasing
* mutation
* state change
* reference graph
* multiple names
* final state

---

# 6. M8 Step 1 — Creation

```python
numbers = [10, 20]
```

Conceptually:

```text
CODE
 │
 ▼
[10,20]
 │
 ▼
OBJECT CREATED
 │
 ▼
REFERENCE ESTABLISHED
```

Memory:

```text
STACK / FRAME

numbers ───────────┐
                   │
                   ▼
HEAP          List Object A
              [10,20]
```

---

# 7. M8 Step 2 — Aliasing

Next:

```python
alias = numbers
```

Now:

```text
STACK / FRAME

numbers ─────────┐
                 │
                 ▼
              Object A
              [10,20]
                 ▲
                 │
alias ───────────┘
```

Critical fact:

```text
2 names
     ↓
1 object
```

Not:

```text
2 names
     ↓
2 objects
```

---

# 8. M8 Step 3 — Mutation

Now:

```python
numbers.append(30)
```

Before:

```text
numbers ─────┐
             ▼
          Object A
          [10,20]
             ▲
             │
alias ───────┘
```

After:

```text
numbers ─────┐
             ▼
          Object A
          [10,20,30]
             ▲
             │
alias ───────┘
```

What changed?

```text
Object identity → SAME
Reference graph → SAME
Object state    → CHANGED
```

This is the direct integration of **M3 + M5 + M6**.

---

# 9. M8 Step 4 — Rebinding

Now:

```python
numbers = [100, 200]
```

Before:

```text
numbers ─────┐
             ▼
          Object A
          [10,20,30]
             ▲
             │
alias ───────┘
```

After:

```text
numbers ─────► Object B
               [100,200]

alias ────────► Object A
                [10,20,30]
```

Now the model changes dramatically.

```text
numbers → B
alias   → A
```

Two references now point to different objects.

---

# 10. M8 What Happened?

This single operation demonstrates:

```text
numbers = [100,200]
```

### New object

```text
Object B
```

### New reference target

```text
numbers → B
```

### Old object

```text
Object A
```

### Old reference

```text
alias → A
```

Therefore Object A remains reachable.

---

# 11. M8 Complete State

After:

```python
numbers = [10,20]
alias = numbers
numbers.append(30)
numbers = [100,200]
```

the conceptual model is:

```text
EXECUTION FRAME
┌────────────────────────────┐
│                            │
│ numbers ───────────► B     │
│                            │
│ alias ─────────────► A     │
│                            │
└────────────────────────────┘


OBJECT MEMORY

┌─────────────────────┐
│ Object A            │
│ List                │
│ [10,20,30]          │
└─────────────────────┘


┌─────────────────────┐
│ Object B            │
│ List                │
│ [100,200]           │
└─────────────────────┘
```

This is the **Complete Memory Model**.

---

# 12. M8 Add Function Call

Now make it more realistic:

```python
def add_item(items):
    items.append(40)

numbers = [10,20]
add_item(numbers)
```

Before call:

```text
CALLER FRAME

numbers ─────► Object A
               [10,20]
```

During call:

```text
CALLER FRAME

numbers ─────┐
             │
             ▼
          Object A
          [10,20]
             ▲
             │
FUNCTION FRAME
items ───────┘
```

After mutation:

```text
Object A
[10,20,40]
```

After return:

```text
CALLER FRAME

numbers ─────► Object A
               [10,20,40]
```

Function frame disappears.

Object survives.

---

# 13. M8 Complete Stack + Heap

The master diagram should combine all previous concepts:

```text
┌─────────────────────────────────────────────┐
│                 EXECUTION                   │
│                                             │
│  CALLER FRAME                               │
│  ┌───────────────────────────────────────┐  │
│  │ numbers ─────────────────────────┐    │  │
│  └──────────────────────────────────┼────┘  │
│                                     │       │
│  FUNCTION FRAME                     │       │
│  ┌──────────────────────────────────┼────┐  │
│  │ items ───────────────────────────┘    │  │
│  └───────────────────────────────────────┘  │
└──────────────────────────┬──────────────────┘
                           │
                           │ references
                           ▼
┌─────────────────────────────────────────────┐
│                    HEAP                     │
│                                             │
│       ┌─────────────────────────────┐       │
│       │       OBJECT A              │       │
│       │                             │       │
│       │ type: list                  │       │
│       │ state: [10,20,40]           │       │
│       │ identity: A                 │       │
│       └─────────────────────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

This is the conceptual integration of **M4 + M5 + M6 + M7**.

---

# 14. M8 Object Identity

M8 must reinforce:

```text
name
≠
object
```

and:

```text
value
≠
identity
```

Example:

```python
a = [1,2]
b = a
```

Then:

```text
a ─────┐
       ▼
      A
       ▲
       │
b ─────┘
```

Therefore:

```text
a is b
```

is conceptually:

```text
TRUE
```

because both names reference the same object.

---

# 15. M8 Same Value, Different Objects

```python
a = [1,2]
b = [1,2]
```

Conceptually:

```text
a ─────► Object A
         [1,2]

b ─────► Object B
         [1,2]
```

Same contents:

```text
[1,2] == [1,2]
```

Different identity:

```text
Object A ≠ Object B
```

This is critical for the complete model.

---

# 16. M8 Object Graph

The complete model should explicitly represent an object graph.

```text
        FRAME
          │
          ▼
       Object A
       /      \
      ▼        ▼
 Object B    Object C
    │
    ▼
 Object D
```

The graph represents:

```text
references
+
objects
+
relationships
```

This is more accurate than thinking only in terms of isolated boxes.

---

# 17. M8 Nested Objects

Example:

```python
user = {
    "profile": {
        "name": "Alice"
    }
}
```

Conceptually:

```text
user
 │
 ▼
Dictionary A
 │
 └── profile
       │
       ▼
   Dictionary B
       │
       └── name
             │
             ▼
          String Object
          "Alice"
```

Now the learner can understand nested structures as an **object graph**.

---

# 18. M8 Mutation of Nested Object

```python
user["profile"]["name"] = "Bob"
```

Before:

```text
Dictionary B
name → "Alice"
```

After:

```text
Dictionary B
name → "Bob"
```

The reference path:

```text
user
 ↓
profile
 ↓
Dictionary B
```

remains.

Only the relevant state/reference relationship changes.

---

# 19. M8 Reference Graph + Lifecycle

Now combine graph and lifecycle:

```text
FRAME
 │
 ▼
A ─────► B
         │
         ▼
         C
```

Then:

```text
reference to A removed
```

But:

```text
B
↑
C
```

may still be reachable depending on the graph.

This teaches an important principle:

> **Reachability is a graph property, not simply a property of one variable.**

---

# 20. M8 Object Becomes Unreachable

Consider:

```python
a = []
b = a

a = None
b = None
```

Final state:

```text
FRAME

a → None
b → None


HEAP

Object A
[]
```

No path exists from the active roots to Object A.

Conceptually:

```text
ROOTS
  │
  X
  │
OBJECT A
```

Therefore:

```text
Object A
   ↓
unreachable
```

Then runtime reclamation can occur according to its strategy.

---

# 21. M8 Roots

For an advanced complete model, introduce:

```text
ROOTS
```

Conceptually, roots can include active references from execution contexts and other runtime-managed references.

Then:

```text
ROOTS
  │
  ├──► Object A
  │      │
  │      └──► Object B
  │
  └──► Object C
```

Anything reachable from the roots is reachable through the object graph.

---

# 22. M8 Reachability

The visual:

```text
ROOT
 │
 ▼
 A
 │
 ├────► B
 │
 └────► C
         │
         ▼
         D
```

All are reachable.

Now remove:

```text
ROOT → A
```

If no other root reaches A:

```text
A
├── B
├── C
└── D
```

the entire disconnected subgraph may become unreachable.

This is the conceptual foundation behind tracing garbage collection.

---

# 23. M8 Cycle

Example:

```text
A ─────► B
▲        │
│        ▼
└────────┘
```

There is a cycle.

If no root reaches A or B:

```text
ROOT
 │
 X

A ─────► B
▲        │
└────────┘
```

the cycle can still be unreachable from the roots.

This explains why:

```text
reference count
```

and:

```text
reachability
```

are not identical concepts.

---

# 24. M8 Full Lifecycle + Graph

Now combine everything:

```text
                CREATE
                   │
                   ▼
                OBJECT
                   │
                   ▼
              INITIALIZE
                   │
                   ▼
                REACHABLE
                   │
             ┌─────┴─────┐
             │           │
          MUTATE      REBIND
             │           │
             └─────┬─────┘
                   ▼
               OBJECT GRAPH
                   │
                   ▼
            REFERENCES CHANGE
                   │
                   ▼
              UNREACHABLE
                   │
                   ▼
             RECLAMATION
```

This is the M8 culmination.

---

# 25. M8 Before / After Integration

M6 gave us:

```text
BEFORE
   ↓
OPERATION
   ↓
AFTER
```

M8 extends it:

```text
BEFORE
   ↓
EXECUTION
   ↓
REFERENCE / STATE CHANGE
   ↓
AFTER
   ↓
NEW OBJECT GRAPH
   ↓
NEW REACHABILITY
```

Therefore M6 becomes a component inside M8.

---

# 26. M8 Allocation Integration

M7 taught allocation.

M8 places it into the complete model:

```text
CODE
 │
 ▼
OBJECT CREATION REQUEST
 │
 ▼
RUNTIME
 │
 ▼
ALLOCATION
 │
 ▼
OBJECT REPRESENTATION
 │
 ▼
INITIALIZATION
 │
 ▼
REFERENCE
```

Important:

> The exact allocation mechanism is runtime-dependent.

So M8 should remain a conceptual model rather than pretending Python exposes a single simple heap-allocation sequence.

---

# 27. M8 Stack Integration

The stack/execution model:

```text
STACK / EXECUTION CONTEXT

┌───────────────────────┐
│ caller frame          │
│                       │
│ x ────────────────┐   │
│ y ────────────┐   │   │
└───────────────┼───┼───┘
                │   │
                ▼   │
             Object A
                    │
                    ▼
                 Object B
```

The important teaching point:

> **Names/references in execution contexts connect the running program to objects.**

---

# 28. M8 Object Memory Integration

M5 showed object internals.

M8 now puts them inside the full graph:

```text
Object A
┌─────────────────────────┐
│ identity                │
│ type                    │
│ state                   │
│ references              │
│ runtime metadata        │
└─────────────────────────┘
```

For example:

```text
List Object
┌─────────────────────────┐
│ identity                │
│ type = list             │
│ length                  │
│ element references      │
│ internal storage        │
└─────────────────────────┘
```

The exact internal representation is runtime-specific.

---

# 29. M8 `id()` Integration

Earlier versions taught identity.

M8 should show:

```python
x = [1,2]
y = x

id(x)
id(y)
```

Conceptually:

```text
x ─────┐
       ▼
    Object A
       ▲
       │
y ─────┘
```

Therefore:

```text
id(x) == id(y)
```

for those two references to the same object.

The existing project material also frames `id()` as object identity rather than the object's value. 

---

# 30. M8 Important `id()` Caveat

Do not teach:

> "`id()` is always the physical RAM address."

Better:

> **`id()` identifies an object during its lifetime; in CPython it is commonly associated with the object's memory address, but the language-level guarantee is object identity, not a portable physical-address model.**

This keeps the complete model technically safe.

---

# 31. M8 Mutation vs Rebinding — Final Model

This must be one of the most prominent comparison cards.

| Operation       | Reference                        | Object Identity    | Object State               |
| --------------- | -------------------------------- | ------------------ | -------------------------- |
| Mutation        | Same                             | Same               | Changes                    |
| Rebinding       | Target changes                   | May change         | Old object need not change |
| Aliasing        | Additional reference             | Same               | Same initially             |
| Copy            | New reference                    | Usually new object | Similar initial state      |
| Object creation | New reference may be established | New object         | New state                  |

---

# 32. M8 Example Matrix

```python
a = [1,2]
b = a
a.append(3)
a = [4,5]
```

| Stage         | `a` | `b` | Object A  | Object B |
| ------------- | --- | --- | --------- | -------- |
| `a=[1,2]`     | → A | —   | `[1,2]`   | —        |
| `b=a`         | → A | → A | `[1,2]`   | —        |
| `a.append(3)` | → A | → A | `[1,2,3]` | —        |
| `a=[4,5]`     | → B | → A | `[1,2,3]` | `[4,5]`  |

This is an excellent M8 revision table.

---

# 33. M8 Function Call Matrix

```python
def update(x):
    x.append(5)

data = [1,2]
update(data)
```

| Stage        | Caller     | Function      | Object    |
| ------------ | ---------- | ------------- | --------- |
| Before call  | `data → A` | —             | `[1,2]`   |
| During call  | `data → A` | `x → A`       | `[1,2]`   |
| Mutation     | `data → A` | `x → A`       | `[1,2,5]` |
| After return | `data → A` | frame removed | `[1,2,5]` |

This connects:

```text
M4 Stack
+
M3 References
+
M6 State Change
+
M7 Lifecycle
```

---

# 34. M8 Complete Execution Flow

The hero sequence should show:

```text
SOURCE CODE
     ↓
STATEMENT EXECUTES
     ↓
NAME / REFERENCE OPERATION
     ↓
OBJECT CREATED / FOUND
     ↓
REFERENCE ESTABLISHED
     ↓
OBJECT USED
     ↓
STATE OR REFERENCE CHANGES
     ↓
OBJECT GRAPH CHANGES
     ↓
REACHABILITY CHANGES
     ↓
OBJECT MAY BECOME UNREACHABLE
     ↓
RUNTIME RECLAIMS ACCORDING TO STRATEGY
```

That is the complete model.

---

# 35. M8 Complete Example

Use:

```python
def add_skill(user, skill):
    user["skills"].append(skill)

user = {
    "name": "Alice",
    "skills": ["Python"]
}

add_skill(user, "SQL")
```

This is an excellent final example because it contains:

* function frame
* parameter reference
* dictionary object
* nested list object
* aliasing
* mutation
* object graph
* state transition
* function return

---

# 36. M8 Step 1

```python
user = {
    "name": "Alice",
    "skills": ["Python"]
}
```

Conceptual graph:

```text
user
 │
 ▼
Dict A
 ├── name ─────► String A
 │               "Alice"
 │
 └── skills ───► List A
                 ["Python"]
```

---

# 37. M8 Step 2 — Function Call

```python
add_skill(user, "SQL")
```

Execution:

```text
CALLER FRAME
user ───────────────┐
                    │
                    ▼
                  Dict A
                    │
                    ▼
                  List A
```

Function:

```text
FUNCTION FRAME

user ───────────────► Dict A

skill ──────────────► "SQL"
```

---

# 38. M8 Step 3 — Mutation

```python
user["skills"].append(skill)
```

Before:

```text
List A
["Python"]
```

After:

```text
List A
["Python", "SQL"]
```

Identity remains:

```text
List A
```

State changes.

---

# 39. M8 Step 4 — Return

After the function returns:

```text
FUNCTION FRAME
     ↓
removed
```

Caller still has:

```text
user
 │
 ▼
Dict A
 │
 └── skills
       │
       ▼
     List A
     ["Python", "SQL"]
```

The objects survive because the caller still reaches them.

---

# 40. M8 Complete Diagram for This Example

```text
                    CALLER FRAME
              ┌─────────────────────┐
              │                     │
              │ user ───────────┐   │
              │                 │   │
              └─────────────────┼───┘
                                │
                                ▼
                         ┌─────────────┐
                         │ Dictionary  │
                         │ Object A    │
                         └──────┬──────┘
                                │
                         skills │
                                ▼
                         ┌─────────────┐
                         │ List Object │
                         │ B           │
                         │             │
                         │ Python      │
                         │ SQL         │
                         └─────────────┘


              FUNCTION FRAME

              user ───────────► Object A
              skill ──────────► "SQL"
```

---

# 41. M8 Final Architecture

The complete memory model should visually have **five conceptual layers**:

```text
┌─────────────────────────────────────┐
│ 1. SOURCE / EXECUTION               │
├─────────────────────────────────────┤
│ 2. EXECUTION CONTEXT / REFERENCES   │
├─────────────────────────────────────┤
│ 3. OBJECTS                          │
├─────────────────────────────────────┤
│ 4. OBJECT GRAPH + STATE             │
├─────────────────────────────────────┤
│ 5. LIFECYCLE / REACHABILITY         │
└─────────────────────────────────────┘
```

This is cleaner than trying to show everything in one undifferentiated diagram.

---

# 42. M8 Five-Layer Model

### Layer 1 — Execution

```text
Python code
   ↓
statement executes
```

### Layer 2 — References

```text
name
 ↓
reference
```

### Layer 3 — Objects

```text
object
 ├── identity
 ├── type
 └── state
```

### Layer 4 — Object Graph

```text
object → object → object
```

### Layer 5 — Lifecycle

```text
created
 ↓
live
 ↓
reachable
 ↓
unreachable
 ↓
reclaimed
```

---

# 43. M8 The Ultimate Mental Model

```text
                    PYTHON PROGRAM
                          │
                          ▼
                    EXECUTION FRAME
                          │
                    names / refs
                          │
                          ▼
                 ┌─────────────────┐
                 │     OBJECT A    │
                 │─────────────────│
                 │ identity        │
                 │ type            │
                 │ state           │
                 │ references      │
                 └───────┬─────────┘
                         │
                  references
                    ┌────┴────┐
                    ▼         ▼
               OBJECT B    OBJECT C
                    │
                    ▼
               OBJECT GRAPH
                    │
             state/reference
                transitions
                    │
                    ▼
               REACHABILITY
                    │
                    ▼
               UNREACHABLE
                    │
                    ▼
               RECLAMATION
```

This is the **M8 master diagram**.

---

# 44. M8 JSON Model

Because your Tutorial Engine is JSON-driven and separates block content from presentation configuration, M8 should be represented semantically rather than as hard-coded markup. The architecture explicitly describes block content and block presentation configuration as separate structured data. 

```json
{
  "type": "memory",
  "version": "M8",
  "presentation": "Complete Memory Model",

  "content": {

    "title": "Complete Memory Model",

    "execution": {},

    "frames": [],

    "references": [],

    "objects": [],

    "objectGraph": {},

    "stateTransitions": [],

    "lifecycle": {},

    "reachability": {},

    "reclamation": {},

    "examples": [],

    "summary": {}

  },

  "presentation": {

    "theme": "light",

    "primaryColor": "#f54a8d",

    "secondaryColor": "#0B1B3D",

    "layout": "complete-memory-model",

    "animation": {
      "enabled": true,
      "mode": "step"
    }

  }

}
```

---

# 45. M8 Object Schema

```json
{
  "id": "object-001",

  "type": "list",

  "identity": {
    "label": "A"
  },

  "state": {
    "display": "[10,20,30]"
  },

  "references": [],

  "reachability": {
    "status": "reachable"
  },

  "lifecycle": {
    "stage": "live"
  }
}
```

---

# 46. M8 Reference Schema

```json
{
  "name": "numbers",

  "targetObjectId": "object-001",

  "scope": "caller",

  "kind": "local-reference"
}
```

This makes the relationship explicit:

```text
numbers
   ↓
object-001
```

---

# 47. M8 Object Graph Schema

```json
{
  "nodes": [
    {
      "id": "object-001",
      "type": "dict"
    },
    {
      "id": "object-002",
      "type": "list"
    }
  ],

  "edges": [
    {
      "from": "object-001",
      "to": "object-002",
      "label": "skills"
    }
  ]
}
```

---

# 48. M8 Transition Schema

```json
{
  "type": "mutation",

  "operation": {
    "code": "items.append(3)"
  },

  "before": {
    "objectId": "object-001",
    "state": "[1,2]"
  },

  "after": {
    "objectId": "object-001",
    "state": "[1,2,3]"
  },

  "changes": [
    "state"
  ]
}
```

For rebinding:

```json
{
  "type": "rebinding",

  "before": {
    "reference": "items",
    "target": "object-001"
  },

  "after": {
    "reference": "items",
    "target": "object-002"
  },

  "changes": [
    "reference-target"
  ]
}
```

---

# 49. M8 Lifecycle Schema

```json
{
  "lifecycle": {

    "stage": "live",

    "history": [
      "created",
      "allocated",
      "initialized",
      "live"
    ],

    "reachability": "reachable",

    "reclamation": {
      "status": "not-reclaimed"
    }

  }
}
```

---

# 50. M8 Presentation Configuration

The renderer should not need to understand the educational meaning from arbitrary text.

Instead:

```json
{
  "presentation": {
    "layout": "complete-memory-model",

    "sections": [
      "execution",
      "references",
      "objects",
      "object-graph",
      "transitions",
      "lifecycle"
    ],

    "showArrows": true,

    "showIdentity": true,

    "showType": true,

    "showState": true,

    "showReachability": true
  }
}
```

That follows the existing project's principle of structured content plus presentation configuration. 

---

# 51. M8 Semantic HTML Structure

```text
<section>
│
├── header
│
├── introduction
│
├── master-model
│   ├── execution
│   ├── references
│   ├── objects
│   ├── object-graph
│   └── lifecycle
│
├── complete-example
│   ├── source-code
│   ├── step-1
│   ├── step-2
│   ├── step-3
│   └── final-state
│
├── mutation-vs-rebinding
│
├── stack-vs-object
│
├── reachability
│
├── reclamation
│
├── language-runtime-note
│
└── final-mental-model
```

---

# 52. M8 Complete HTML Skeleton

```html
<section
    class="tutorial-block memory-block memory-m8"
    data-block="memory"
    data-version="M8"
>

    <header class="memory-header">

        <span class="memory-eyebrow">
            MEMORY
        </span>

        <h2>
            Complete Memory Model
        </h2>

    </header>


    <section class="master-model">

        <h3>
            The Complete Model
        </h3>

        <div class="memory-master-diagram">

            <div>
                SOURCE CODE
            </div>

            <div>
                ↓
            </div>

            <div>
                EXECUTION FRAME
            </div>

            <div>
                ↓
            </div>

            <div>
                REFERENCES
            </div>

            <div>
                ↓
            </div>

            <div>
                OBJECTS
            </div>

            <div>
                ↓
            </div>

            <div>
                OBJECT GRAPH
            </div>

            <div>
                ↓
            </div>

            <div>
                LIFECYCLE
            </div>

            <div>
                ↓
            </div>

            <div>
                REACHABILITY
            </div>

            <div>
                ↓
            </div>

            <div>
                RECLAMATION
            </div>

        </div>

    </section>


    <section class="complete-example">

        <h3>
            Complete Example
        </h3>

        <pre><code>
def add_skill(user, skill):
    user["skills"].append(skill)

user = {
    "name": "Alice",
    "skills": ["Python"]
}

add_skill(user, "SQL")
        </code></pre>

    </section>


    <section class="execution-model">

        <h3>
            Execution Context
        </h3>

    </section>


    <section class="reference-model">

        <h3>
            References
        </h3>

    </section>


    <section class="object-model">

        <h3>
            Objects
        </h3>

    </section>


    <section class="object-graph">

        <h3>
            Object Graph
        </h3>

    </section>


    <section class="state-transition">

        <h3>
            State Transition
        </h3>

    </section>


    <section class="lifecycle">

        <h3>
            Lifecycle
        </h3>

    </section>


    <section class="reachability">

        <h3>
            Reachability
        </h3>

    </section>


    <section class="reclamation">

        <h3>
            Reclamation
        </h3>

    </section>


    <aside class="runtime-note">

        <h3>
            Runtime Note
        </h3>

        <p>
            This is a conceptual memory model.
            Exact implementation details depend on
            the programming language and runtime.
        </p>

    </aside>


    <aside class="final-mental-model">

        <h3>
            Final Mental Model
        </h3>

        <p>
            Code executes in an execution context, names refer
            to objects, objects form graphs, operations change
            references or state, and object lifetime depends
            on reachability and the runtime's memory-management
            strategy.
        </p>

    </aside>

</section>
```

---

# 53. M8 Main UI Composition

The page should not be one giant diagram.

Use this learning order:

```text
┌─────────────────────────────────────┐
│ MEMORY                               │
│ Complete Memory Model                │
├─────────────────────────────────────┤
│                                     │
│  MASTER MODEL                        │
│  Code → Frame → Ref → Object → ... │
│                                     │
├─────────────────────────────────────┤
│  COMPLETE EXAMPLE                    │
│  Code + Step-by-Step                │
│                                     │
├─────────────────────────────────────┤
│  EXECUTION CONTEXT                   │
├─────────────────────────────────────┤
│  REFERENCES                          │
├─────────────────────────────────────┤
│  OBJECTS                             │
├─────────────────────────────────────┤
│  OBJECT GRAPH                        │
├─────────────────────────────────────┤
│  STATE TRANSITIONS                   │
├─────────────────────────────────────┤
│  LIFECYCLE                           │
├─────────────────────────────────────┤
│  REACHABILITY                        │
├─────────────────────────────────────┤
│  RECLAMATION                         │
├─────────────────────────────────────┤
│  FINAL MENTAL MODEL                  │
└─────────────────────────────────────┘
```

---

# 54. M8 Step-by-Step Interaction

The ideal interactive sequence:

```text
STEP 1
Code executes
        ↓

STEP 2
Frame appears
        ↓

STEP 3
Reference appears
        ↓

STEP 4
Object appears
        ↓

STEP 5
Object state appears
        ↓

STEP 6
Second reference appears
        ↓

STEP 7
Mutation occurs
        ↓

STEP 8
Rebinding occurs
        ↓

STEP 9
Reachability changes
        ↓

STEP 10
Lifecycle completes
```

This gives the learner a **movie of memory behavior**, rather than a static picture.

---

# 55. M8 Navigation Controls

Recommended:

```text
┌────────────────────────────────────────┐
│  ← Previous      Step 4 / 10     Next →│
└────────────────────────────────────────┘
```

Also:

```text
● ● ● ● ○ ○ ○ ○ ○ ○
```

for progress.

The learner can replay the entire execution.

---

# 56. M8 Colour Semantics

Keep the committed SUIA palette.

### `#0B1B3D`

Use for:

* headings
* object containers
* execution frames
* normal text
* diagram labels

### `#F54A8D`

Use for:

* active reference
* transition arrows
* changed state
* lifecycle transition
* highlighted object
* current execution step

This is consistent with the existing memory CSS, where the project already uses `#f54a8d` for memory-model transition/highlight elements and dark navy for the structural elements. 

---

# 57. M8 Responsive Strategy

The existing memory model already uses a horizontally scrollable diagram with responsive column sizing for smaller screens. 

M8 should preserve that principle.

### Desktop

```text
Frame → Object → Object Graph
```

### Tablet

```text
Frame
  ↓
Object
  ↓
Graph
```

### Mobile

Do **not** shrink the entire diagram until it becomes unreadable.

Instead:

```text
horizontal scroll
+
step-by-step cards
```

The existing CSS already applies a reduced-width memory model at very small viewport sizes. 

---

# 58. M8 Accessibility

Every visual transition must have a textual equivalent.

For example:

```text
Visual:
numbers ─────► Object A
```

Accessible description:

> `numbers` references List Object A containing `[10, 20, 30]`.

For each step:

```text
Step 4 of 10:
The name `numbers` now references Object B.
```

Also support:

```text
keyboard:
← Previous
→ Next
Space: Play/Pause
R: Replay
```

And respect reduced-motion preferences, consistent with the existing CSS accessibility approach. 

---

# 59. M8 What M8 Must NOT Do

M8 should **not** become:

❌ operating-system memory management

❌ CPU cache architecture

❌ virtual memory/page tables

❌ complete CPython source-code analysis

❌ allocator implementation details

❌ garbage collector implementation source

❌ assembly-level memory instructions

❌ hardware RAM electronics

Those are different lessons.

M8 is:

> **The complete programmer-facing conceptual memory model.**

---

# 60. M8 Runtime Caveat

Use a small, persistent note:

> **Memory diagrams are conceptual models. Exact object representation, allocation, references, stack frames, garbage collection, and reclamation behavior depend on the language and runtime.**

This is particularly important because the existing memory implementation uses a simplified visual model of variables, objects, and values. 

---

# 61. M8 Final Knowledge Map

The learner should now be able to answer:

### Question 1

**What is a variable?**

```text
A name/reference associated with an object.
```

### Question 2

**Where is the object conceptually represented?**

```text
Runtime-managed object memory.
```

### Question 3

**What does a reference do?**

```text
Connects a name/context to an object.
```

### Question 4

**What happens during mutation?**

```text
Object state changes.
```

### Question 5

**What happens during rebinding?**

```text
A reference changes its target.
```

### Question 6

**Can multiple names refer to one object?**

```text
Yes.
```

### Question 7

**Can one object refer to another?**

```text
Yes.
```

### Question 8

**What does that create?**

```text
An object graph.
```

### Question 9

**When does an object become unreachable?**

```text
When no relevant active reference path reaches it.
```

### Question 10

**Is unreachable always equal to immediately deallocated?**

```text
No.
```

### Question 11

**Who determines reclamation?**

```text
The language/runtime memory-management system.
```

---

# 62. M8 Complete Revision Table

| Concept            | Complete Mental Model                          |
| ------------------ | ---------------------------------------------- |
| Variable           | Name/reference                                 |
| Object             | Runtime entity with identity/type/state        |
| Reference          | Connection to an object                        |
| Identity           | Identifies a particular object                 |
| Stack/frame        | Execution context model                        |
| Heap/object memory | Conceptual location for runtime objects        |
| Mutation           | Existing object's state changes                |
| Rebinding          | Reference target changes                       |
| Aliasing           | Multiple references to one object              |
| Object graph       | Objects connected by references                |
| Creation           | New object comes into existence                |
| Allocation         | Runtime obtains representation/resources       |
| Initialization     | Initial object state established               |
| Reachability       | Object can be reached through references       |
| Unreachable        | No active path reaches object                  |
| Reclamation        | Runtime releases/reuses resources              |
| GC                 | One family of automatic reclamation strategies |

---

# 63. M8 One-Page Master Diagram

This is the **final visual that should remain in the learner's memory**:

```text
                         PYTHON CODE
                              │
                              ▼
                        EXECUTION
                              │
                              ▼
                    ┌─────────────────┐
                    │ EXECUTION FRAME │
                    │                 │
                    │ names           │
                    │ references      │
                    └────────┬────────┘
                             │
                             │ reference
                             ▼
                    ┌─────────────────┐
                    │     OBJECT      │
                    │                 │
                    │ identity        │
                    │ type            │
                    │ state           │
                    └────────┬────────┘
                             │
                    object references
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          ┌─────────────┐         ┌─────────────┐
          │   OBJECT B  │         │   OBJECT C  │
          └──────┬──────┘         └─────────────┘
                 │
                 ▼
          ┌─────────────┐
          │   OBJECT D  │
          └─────────────┘

                    OBJECT GRAPH
                         │
                         ▼
               STATE / REFERENCE CHANGE
                         │
                ┌────────┴────────┐
                ▼                 ▼
             MUTATION          REBINDING
                │                 │
                └────────┬────────┘
                         ▼
                    LIFECYCLE
                         │
                         ▼
                   REACHABILITY
                         │
                         ▼
                    UNREACHABLE
                         │
                         ▼
                 RUNTIME RECLAMATION
```

---

# 64. M8 Final Mental Model

The learner should be able to compress the entire MemoryBlock into one sentence:

> **Code executes in an execution context, names establish references to objects, objects contain identity/type/state and can reference other objects, operations mutate state or change references, those relationships form an object graph, and object lifetime ultimately depends on reachability and the runtime's memory-management strategy.**

That is the **Complete Memory Model**.

---

# 65. MemoryBlock — COMPLETE

| Version | Presentation                          | Status         |
| ------- | ------------------------------------- | -------------- |
| **M1**  | Simple Memory Concept                 | ✅              |
| **M2**  | Variable → Object                     | ✅              |
| **M3**  | Reference Model                       | ✅              |
| **M4**  | Stack / Heap                          | ✅              |
| **M5**  | Object Memory Layout                  | ✅              |
| **M6**  | Memory Before / After                 | ✅              |
| **M7**  | Lifecycle / Allocation / Deallocation | ✅              |
| **M8**  | **Complete Memory Model**             | ✅ **COMPLETE** |

So **MemoryBlock is now fully completed: M1–M8**.

And according to the committed 18-block sequence, the next block is:

> **Block 9 — MistakeBlock**
> **MT1 — Common Mistake / Error Scenario**.



```python

```
