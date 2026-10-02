# BLOCK 9 — MistakeBlock

## MT1 — Mistake → Correction

Yes. We will now start **MistakeBlock strictly according to the committed 8-version sequence**.

| Version | Presentation                | Status         |
| ------- | --------------------------- | -------------- |
| **MT1** | **Mistake → Correction**    | 🔵 **CURRENT** |
| MT2     | Incorrect → Why → Correct   | ⏳              |
| MT3     | Error Message → Cause → Fix | ⏳              |
| MT4     | Common Beginner Mistakes    | ⏳              |
| MT5     | Before / After Debugging    | ⏳              |
| MT6     | Multiple Mistakes           | ⏳              |
| MT7     | Debugging Walkthrough       | ⏳              |
| MT8     | Complete Debugging Guide    | ⏳              |

---

# 1. What Is MT1?

MT1 is the **simplest MistakeBlock version**.

Its teaching pattern is:

```text
MISTAKE
   ↓
CORRECTION
```

The learner sees:

1. An incorrect piece of code/concept.
2. The corrected version.
3. A short explanation of what was changed.

MT1 is **not yet a full debugging lesson**.

That distinction is important because later versions progressively add:

```text
MT1 → Mistake → Correction
MT2 → Incorrect → Why → Correct
MT3 → Error Message → Cause → Fix
MT4 → Common Mistakes
MT5 → Before / After Debugging
MT6 → Multiple Mistakes
MT7 → Debugging Walkthrough
MT8 → Complete Debugging Guide
```

So MT1 must remain focused.

---

# 2. MT1 — Version Definition

| Item                 | MT1 Specification                           |
| -------------------- | ------------------------------------------- |
| **Block**            | MistakeBlock                                |
| **Version**          | **MT1**                                     |
| **Presentation**     | **Mistake → Correction**                    |
| **Primary question** | **“What is wrong, and what should it be?”** |
| **Purpose**          | Quickly identify and correct one mistake    |
| **Prerequisite**     | Relevant concept/code                       |
| **Next version**     | MT2 — Incorrect → Why → Correct             |
| **Primary colour**   | **#F54A8D**                                 |
| **Secondary colour** | **#0B1B3D**                                 |
| **Theme**            | Light                                       |
| **Gradient**         | ❌                                           |
| **Dark theme**       | ❌                                           |
| **A4**               | Portrait                                    |
| **Primary layout**   | Two-state comparison                        |

---

# 3. MT1 Core Mental Model

The entire version can be reduced to:

```text
┌──────────────────────┐
│       MISTAKE        │
│                      │
│   Incorrect code     │
└──────────┬───────────┘
           │
           │ CORRECT IT
           ▼
┌──────────────────────┐
│     CORRECTION       │
│                      │
│    Correct code      │
└──────────────────────┘
```

The key is **clarity**, not complexity.

---

# 4. MT1 Hero

The hero should immediately communicate:

```text
MISTAKE
   ↓
CORRECTION
```

Recommended visual:

```text
┌──────────────────────────────────────────┐
│                                          │
│              MISTAKE → FIX               │
│                                          │
│     Identify the mistake.                │
│     Apply the correction.                │
│                                          │
└──────────────────────────────────────────┘
```

Use:

* `#0B1B3D` for structure/text
* `#F54A8D` for the mistake/correction transition

Do **not** make the page visually aggressive with excessive red/error styling.

This is an educational block, not an error screen.

---

# 5. MT1 Basic Example

Take a simple Python example:

```python
print("Hello"
```

### Mistake

```python
print("Hello"
```

### Correction

```python
print("Hello")
```

The visual should be:

```text
MISTAKE

print("Hello"
           ↑
       missing )


              ↓


CORRECTION

print("Hello")
```

That is MT1.

---

# 6. MT1 Basic Structure

Every MT1 should follow:

```text
TITLE
  ↓
SHORT CONTEXT
  ↓
MISTAKE
  ↓
CORRECTION
  ↓
KEY TAKEAWAY
```

Not:

```text
TITLE
 ↓
ERROR MESSAGE
 ↓
STACK TRACE
 ↓
ROOT CAUSE
 ↓
DEBUGGER
 ↓
MULTIPLE FIXES
```

Those belong to later versions.

---

# 7. MT1 Mistake Card

The mistake card should contain:

```text
┌──────────────────────────────────┐
│ MISTAKE                           │
├──────────────────────────────────┤
│                                  │
│ print("Hello"                    │
│                                  │
└──────────────────────────────────┘
```

Use a subtle mistake indicator.

The mistake should be obvious without overwhelming the code.

---

# 8. MT1 Correction Card

```text
┌──────────────────────────────────┐
│ CORRECTION                        │
├──────────────────────────────────┤
│                                  │
│ print("Hello")                   │
│                                  │
└──────────────────────────────────┘
```

The correction receives the stronger positive visual emphasis.

---

# 9. MT1 Difference Indicator

Between the two:

```text
MISTAKE
   │
   │ change
   ▼
CORRECTION
```

For a code-level change:

```text
print("Hello"
             ↑
          add `)`
```

This makes the correction immediately understandable.

---

# 10. MT1 Example — Variable Name

Mistake:

```python
user_name = "Alice"

print(username)
```

Correction:

```python
user_name = "Alice"

print(user_name)
```

Visual:

```text
MISTAKE

user_name = "Alice"
print(username)
       ^^^^^^^^
       wrong name


CORRECTION

user_name = "Alice"
print(user_name)
       ^^^^^^^^^
       correct name
```

---

# 11. MT1 Example — Assignment

Mistake:

```python
10 = x
```

Correction:

```python
x = 10
```

The teaching message:

```text
MISTAKE
value = variable

CORRECTION
variable = value
```

Keep the explanation short.

---

# 12. MT1 Example — Function Call

Mistake:

```python
def greet(name):
    return "Hello " + name

greet
```

Correction:

```python
def greet(name):
    return "Hello " + name

greet("Alice")
```

The correction makes the function invocation explicit.

---

# 13. MT1 Example — List Index

Mistake:

```python
items = ["Python", "Java"]
print(items[2])
```

Correction:

```python
items = ["Python", "Java"]
print(items[1])
```

The important thing is that MT1 shows:

```text
MISTAKE
   ↓
CORRECTION
```

It does not yet need to explain indexing rules in depth.

That belongs to the relevant teaching block.

---

# 14. MT1 Example — Indentation

Mistake:

```python
def greet():
print("Hello")
```

Correction:

```python
def greet():
    print("Hello")
```

Visual:

```text
MISTAKE

def greet():
print("Hello")


        ↓


CORRECTION

def greet():
    print("Hello")
```

---

# 15. MT1 Example — Boolean Comparison

Mistake:

```python
if age = 18:
    print("Adult")
```

Correction:

```python
if age == 18:
    print("Adult")
```

The visual highlight:

```text
age = 18
    ↑
assignment


age == 18
    ↑
comparison
```

Again, MT1 should stay concise.

---

# 16. MT1 Example — Missing Return

Mistake:

```python
def add(a, b):
    a + b
```

Correction:

```python
def add(a, b):
    return a + b
```

The block teaches the immediate correction.

It does not yet need to teach the complete function-return mechanism.

---

# 17. MT1 Example — Mutable Method

Mistake:

```python
items = [1, 2]
items.add(3)
```

Correction:

```python
items = [1, 2]
items.append(3)
```

The correction is visually straightforward.

---

# 18. MT1 Example — Dictionary Key

Mistake:

```python
user = {
    "name": "Alice"
}

print(user["age"])
```

Correction:

```python
user = {
    "name": "Alice"
}

print(user["name"])
```

This is a simple mistake → correction pattern.

MT3 will later be able to show:

```text
Error Message
    ↓
Cause
    ↓
Fix
```

But MT1 does not need that complexity.

---

# 19. MT1 Example — Import

Mistake:

```python
import maths

print(math.sqrt(16))
```

Correction:

```python
import math

print(math.sqrt(16))
```

Again:

```text
MISTAKE
maths

CORRECTION
math
```

---

# 20. MT1 Example — String Method

Mistake:

```python
name = "alice"
print(name.upper)
```

Correction:

```python
name = "alice"
print(name.upper())
```

The difference:

```text
upper
  ↓
method reference

upper()
  ↓
method call
```

MT1 can state that in one sentence.

---

# 21. MT1 Conceptual Mistake

Mistake:

> “A variable stores the object directly.”

Correction:

> “A variable name refers to an object.”

Visual:

```text
MISTAKE

variable
   │
   ▼
stores object


CORRECTION

variable
   │
   │ reference
   ▼
 object
```

This is particularly useful because MistakeBlock is not restricted to syntax errors.

It can correct **conceptual misconceptions**.

---

# 22. MT1 Memory Example

Mistake:

```text
a = [1,2]
b = a.copy()

Changing b changes a.
```

Correction:

```text
a → Object A [1,2]
b → Object B [1,2]

Changing b does not mutate Object A.
```

The exact behavior depends on what operation is performed, but the visual teaches the distinction between separate objects.

---

# 23. MT1 Mutation Mistake

Mistake:

```python
a = [1, 2]
b = a

b.append(3)

# a remains [1, 2]
```

Correction:

```python
a = [1, 2]
b = a

b.append(3)

# a is also [1, 2, 3]
```

The core correction:

```text
b = a
   ↓
same object
```

This connects MT1 to the completed MemoryBlock.

---

# 24. MT1 Mistake Types

MT1 can support several categories:

| Type            | Example                         |
| --------------- | ------------------------------- |
| **Syntax**      | Missing `)`                     |
| **Logic**       | Wrong comparison                |
| **API usage**   | `add()` instead of `append()`   |
| **Naming**      | Wrong variable name             |
| **Indentation** | Incorrect indentation           |
| **Conceptual**  | Variable stores object directly |
| **Reference**   | Assuming copy when aliasing     |
| **Type usage**  | Wrong operation for type        |

But **only one mistake should normally be presented per MT1 instance**.

---

# 25. MT1 One Mistake Rule

This is important.

MT1 should normally follow:

```text
ONE MISTAKE
     ↓
ONE CORRECTION
```

Not:

```text
MISTAKE 1
MISTAKE 2
MISTAKE 3
MISTAKE 4
     ↓
FIX ALL
```

That belongs to:

> **MT6 — Multiple Mistakes**

---

# 26. MT1 Explanation Length

The explanation should be short.

Recommended:

```text
Why this is wrong:
The variable name used in the function call does not match
the variable that was defined.

Correction:
Use `user_name`.
```

Avoid turning MT1 into MT2.

MT2 explicitly adds:

```text
Incorrect
   ↓
Why
   ↓
Correct
```

MT1 should remain:

```text
Mistake
   ↓
Correction
```

---

# 27. MT1 Layout

Recommended A4 portrait composition:

```text
┌─────────────────────────────────────┐
│ MISTAKEBLOCK                        │
│ Mistake → Correction                │
├─────────────────────────────────────┤
│                                     │
│ Short context                       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│            MISTAKE                  │
│                                     │
│     ┌───────────────────────┐       │
│     │ incorrect code        │       │
│     └───────────────────────┘       │
│                                     │
│                ↓                    │
│                                     │
│           CORRECTION                │
│                                     │
│     ┌───────────────────────┐       │
│     │ correct code          │       │
│     └───────────────────────┘       │
│                                     │
├─────────────────────────────────────┤
│ KEY TAKEAWAY                        │
└─────────────────────────────────────┘
```

---

# 28. MT1 Desktop Layout

For wider screens:

```text
┌─────────────────────────────────────────────┐
│ Mistake → Correction                        │
├──────────────────┬──────────────────────────┤
│                  │                          │
│     MISTAKE      │       CORRECTION         │
│                  │                          │
│  incorrect code  │      correct code       │
│                  │                          │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

The central transition can be:

```text
MISTAKE  ─────────►  CORRECTION
```

---

# 29. MT1 Mobile Layout

Do not force side-by-side code cards on narrow screens.

Use:

```text
MISTAKE

┌───────────────────┐
│ incorrect code    │
└───────────────────┘

        ↓

CORRECTION

┌───────────────────┐
│ correct code      │
└───────────────────┘
```

This follows the existing project's responsive approach for dense technical diagrams.

---

# 30. MT1 Visual Hierarchy

### Level 1

```text
Mistake → Correction
```

### Level 2

```text
Mistake
```

### Level 3

```text
Incorrect code
```

### Level 4

```text
Correction
```

### Level 5

```text
Key takeaway
```

Do not make explanatory text visually compete with the mistake/correction pair.

---

# 31. MT1 Colour Semantics

### `#0B1B3D`

Use for:

* title
* headings
* code text
* explanatory text
* borders
* diagrams

### `#F54A8D`

Use for:

* mistake marker
* correction arrow
* changed token
* correction emphasis
* active state

Example:

```text
print("Hello"
             ↑
```

The missing token indicator uses:

```text
#F54A8D
```

---

# 32. MT1 Do Not Use Red/Green as the Main Design

Even though this is a mistake/correction block, the committed design language is:

```text
#F54A8D
+
#0B1B3D
```

So don't redesign MT1 as:

```text
❌ red error panel
✅ green success panel
```

Instead:

```text
MISTAKE
↓
#F54A8D emphasis

CORRECTION
↓
#0B1B3D structure
+
#F54A8D correction highlight
```

This keeps MistakeBlock visually consistent with the Tutorial Engine.

---

# 33. MT1 Code Comparison

A useful component:

```text
┌──────────────────────────────┐
│ MISTAKE                      │
│                              │
│ print("Hello"                │
│             └─ missing `)`   │
└──────────────────────────────┘

              ↓

┌──────────────────────────────┐
│ CORRECTION                   │
│                              │
│ print("Hello")               │
│             └─ added `)`     │
└──────────────────────────────┘
```

---

# 34. MT1 Inline Difference

For small mistakes, use inline highlighting:

```text
print("Hello"
             ^
             missing )
```

For larger code:

```text
┌───────────────┐
│ MISTAKE       │
│               │
│ - wrong line  │
└───────────────┘

        ↓

┌───────────────┐
│ CORRECTION    │
│               │
│ + fixed line  │
└───────────────┘
```

---

# 35. MT1 Complete Example

### Mistake

```python
def calculate(a, b):
    return a + b

result = calculate(10)
```

### Correction

```python
def calculate(a, b):
    return a + b

result = calculate(10, 20)
```

Visual:

```text
MISTAKE

calculate(10)
           ↑
      missing argument


             ↓


CORRECTION

calculate(10, 20)
```

The learner can immediately identify what changed.

---

# 36. MT1 Conceptual Example

### Mistake

```text
b = a.copy

"b is a copy of a"
```

### Correction

```text
b = a.copy()

"b is created using the copy method"
```

The correction highlights the method invocation.

---

# 37. MT1 Mistake → Correction Flow

The component should internally represent:

```text
mistake
   ↓
difference
   ↓
correction
```

Even though the learner sees primarily:

```text
Mistake → Correction
```

The `difference` is supporting metadata.

---

# 38. MT1 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT1",
  "presentation": "Mistake → Correction",

  "content": {
    "title": "",
    "context": "",

    "mistake": {
      "code": "",
      "language": "python"
    },

    "correction": {
      "code": "",
      "language": "python"
    },

    "difference": [],

    "takeaway": ""
  }
}
```

---

# 39. MT1 Example JSON

```json
{
  "type": "mistake",
  "version": "MT1",
  "presentation": "Mistake → Correction",

  "content": {

    "title": "Missing Closing Parenthesis",

    "context": "The function call is missing a closing parenthesis.",

    "mistake": {
      "code": "print(\"Hello\""
    },

    "correction": {
      "code": "print(\"Hello\")"
    },

    "difference": [
      {
        "type": "missing",
        "value": ")",
        "position": "end"
      }
    ],

    "takeaway": "Every function call must have matching parentheses."

  }
}
```

---

# 40. MT1 More Complete JSON

```json
{
  "type": "mistake",
  "version": "MT1",
  "presentation": "Mistake → Correction",

  "content": {

    "title": "Correct the Function Call",

    "context": "The function call contains a syntax mistake.",

    "mistake": {
      "language": "python",
      "code": "print(\"Hello\"",
      "highlights": [
        {
          "type": "missing",
          "description": "Closing parenthesis is missing."
        }
      ]
    },

    "correction": {
      "language": "python",
      "code": "print(\"Hello\")",
      "highlights": [
        {
          "type": "added",
          "value": ")"
        }
      ]
    },

    "takeaway": "Match opening and closing parentheses."

  },

  "presentationConfig": {

    "layout": "vertical",

    "showDifference": true,

    "showArrow": true,

    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",

    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 41. MT1 Generic Difference Model

The difference should support:

```json
{
  "type": "added",
  "value": ")"
}
```

or:

```json
{
  "type": "removed",
  "value": "="
}
```

or:

```json
{
  "type": "replaced",
  "from": "username",
  "to": "user_name"
}
```

or:

```json
{
  "type": "moved",
  "description": "Indent the statement inside the function."
}
```

This allows the renderer to highlight the correction.

---

# 42. MT1 Mistake Categories

The JSON can support:

```json
{
  "category": "syntax"
}
```

or:

```json
{
  "category": "logic"
}
```

or:

```json
{
  "category": "concept"
}
```

or:

```json
{
  "category": "api-usage"
}
```

or:

```json
{
  "category": "reference"
}
```

But the renderer should **not** change the fundamental MT1 presentation based on category.

---

# 43. MT1 Semantic HTML

```text
<section>
│
├── header
│   ├── MISTAKEBLOCK
│   └── Mistake → Correction
│
├── context
│
├── mistake-card
│   ├── label
│   ├── code
│   └── highlights
│
├── transition
│
├── correction-card
│   ├── label
│   ├── code
│   └── highlights
│
└── takeaway
```

---

# 44. MT1 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt1"
    data-block="mistake"
    data-version="MT1"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Mistake → Correction
        </h2>

    </header>


    <p class="mistake-context">
        Identify the incorrect code and replace it with
        the corrected version.
    </p>


    <section class="mistake-correction-flow">


        <article class="mistake-card">

            <header>
                <span>
                    MISTAKE
                </span>
            </header>

            <pre><code>
print("Hello"
            </code></pre>

            <div class="mistake-highlight">
                Missing closing parenthesis
            </div>

        </article>


        <div class="correction-arrow">
            ↓
        </div>


        <article class="correction-card">

            <header>
                <span>
                    CORRECTION
                </span>
            </header>

            <pre><code>
print("Hello")
            </code></pre>

            <div class="correction-highlight">
                Closing parenthesis added
            </div>

        </article>

    </section>


    <aside class="mistake-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Match every opening parenthesis with its
            corresponding closing parenthesis.
        </p>

    </aside>

</section>
```

---

# 45. MT1 Desktop Component

Recommended:

```text
┌───────────────────────────────────────────────────┐
│ MISTAKEBLOCK                                      │
│ Mistake → Correction                              │
│                                                   │
│ Identify the incorrect code and apply the fix.    │
├──────────────────────┬────────────────────────────┤
│                      │                            │
│       MISTAKE        │       CORRECTION           │
│                      │                            │
│ print("Hello"        │ print("Hello")             │
│             ↑        │             ↑              │
│         missing )    │         added )             │
│                      │                            │
└──────────────────────┴────────────────────────────┘
                     ↓
              KEY TAKEAWAY
```

---

# 46. MT1 Mobile Component

```text
┌──────────────────────────┐
│ MISTAKE                  │
├──────────────────────────┤
│ print("Hello"            │
│                          │
│ Missing `)`              │
└──────────────────────────┘

             ↓

┌──────────────────────────┐
│ CORRECTION               │
├──────────────────────────┤
│ print("Hello")           │
│                          │
│ `)` added                │
└──────────────────────────┘
```

---

# 47. MT1 Interaction

MT1 does not need complicated debugging controls.

Optional interaction:

```text
[ Show Correction ]
```

Initially:

```text
MISTAKE
```

Then the learner clicks:

```text
Show Correction
```

and:

```text
CORRECTION
```

appears.

This creates a small amount of active learning.

---

# 48. MT1 Progressive Reveal

Ideal:

```text
STEP 1

What is wrong?

[MISTAKE]
```

Then:

```text
STEP 2

Reveal correction

[CORRECTION]
```

Then:

```text
STEP 3

Compare

MISTAKE → CORRECTION
```

No debugger simulation yet.

---

# 49. MT1 Accessibility

The visual comparison must have a text alternative:

> **Mistake:** `print("Hello"` is missing the closing parenthesis.

> **Correction:** `print("Hello")` adds the closing parenthesis.

Keyboard:

```text
Enter / Space
→ Reveal correction
```

Focus states must remain visible.

Reduced motion should disable reveal animation.

---

# 50. MT1 Validation Rules

| Field             |                 Required |
| ----------------- | -----------------------: |
| `type`            |                        ✅ |
| `version`         |                  **MT1** |
| `presentation`    | **Mistake → Correction** |
| `mistake`         |                        ✅ |
| `correction`      |                        ✅ |
| `language`        |              Recommended |
| `difference`      |              Recommended |
| `takeaway`        |              Recommended |
| `category`        |                 Optional |
| Error message     |                    ❌ MT3 |
| Detailed cause    |                ❌ MT2/MT3 |
| Multiple mistakes |                    ❌ MT6 |
| Debugging steps   |                    ❌ MT7 |
| Complete guide    |                    ❌ MT8 |

---

# 51. MT1 What It Should NOT Teach

MT1 should **not** become:

### ❌ MT2

```text
Incorrect
   ↓
Why
   ↓
Correct
```

### ❌ MT3

```text
Error message
   ↓
Cause
   ↓
Fix
```

### ❌ MT4

```text
10 common beginner mistakes
```

### ❌ MT5

```text
Before debugging
   ↓
After debugging
```

### ❌ MT6

```text
Mistake 1
Mistake 2
Mistake 3
```

### ❌ MT7

```text
debugging step 1
debugging step 2
debugging step 3
...
```

### ❌ MT8

Complete debugging methodology.

MT1 must remain **atomic and fast**.

---

# 52. MT1 Design Principle

The learner should understand the correction within approximately:

```text
3–10 seconds
```

The block should answer:

> **“What did I get wrong, and what should I write instead?”**

immediately.

---

# 53. MT1 Final Mental Model

```text
          MISTAKE
             │
             │ identify
             ▼
      ┌──────────────┐
      │ WHAT CHANGED?│
      └──────┬───────┘
             │
             ▼
        CORRECTION
             │
             ▼
       KEY TAKEAWAY
```

The actual learner-facing pattern remains:

```text
MISTAKE
   ↓
CORRECTION
```

---

# 54. MT1 Complete Technical Specification

| Area                        | MT1 Decision                |
| --------------------------- | --------------------------- |
| **Block**                   | **MistakeBlock**            |
| **Version**                 | **MT1**                     |
| **Presentation**            | **Mistake → Correction**    |
| **Primary purpose**         | Correct one mistake quickly |
| **Mistakes per instance**   | **One**                     |
| **Mistake code**            | Required                    |
| **Correction code**         | Required                    |
| **Difference highlighting** | Recommended                 |
| **Takeaway**                | Recommended                 |
| Error message               | ❌                           |
| Detailed cause              | ❌                           |
| Multiple mistakes           | ❌                           |
| Debugging walkthrough       | ❌                           |
| Complete debugging workflow | ❌                           |
| **Primary**                 | **#F54A8D**                 |
| **Secondary**               | **#0B1B3D**                 |
| **Colour ratio**            | **70% / 30%**               |
| **Theme**                   | Light                       |
| **Gradient**                | ❌                           |
| **Dark theme**              | ❌                           |
| **A4**                      | Portrait                    |
| **JSON-driven**             | ✅                           |
| **Responsive**              | ✅                           |
| **Accessible**              | ✅                           |
| **Reveal interaction**      | Optional                    |

---

# 55. MistakeBlock Progress

| Version | Presentation                  | Status         |
| ------- | ----------------------------- | -------------- |
| **MT1** | **Mistake → Correction**      | ✅ **COMPLETE** |
| **MT2** | **Incorrect → Why → Correct** | ⏳ **NEXT**     |
| MT3     | Error Message → Cause → Fix   | ⏳              |
| MT4     | Common Beginner Mistakes      | ⏳              |
| MT5     | Before / After Debugging      | ⏳              |
| MT6     | Multiple Mistakes             | ⏳              |
| MT7     | Debugging Walkthrough         | ⏳              |
| MT8     | Complete Debugging Guide      | ⏳              |

So **MT1 is now complete**.

The next version, when we continue, is strictly:

> **MT2 — Incorrect → Why → Correct**.



```python

```

# BLOCK 9 — MistakeBlock

## MT2 — Incorrect → Why → Correct

We now continue **exactly according to the committed MistakeBlock sequence**.

| Version | Presentation                  | Status         |
| ------- | ----------------------------- | -------------- |
| MT1     | Mistake → Correction          | ✅              |
| **MT2** | **Incorrect → Why → Correct** | 🔵 **CURRENT** |
| MT3     | Error Message → Cause → Fix   | ⏳              |
| MT4     | Common Beginner Mistakes      | ⏳              |
| MT5     | Before / After Debugging      | ⏳              |
| MT6     | Multiple Mistakes             | ⏳              |
| MT7     | Debugging Walkthrough         | ⏳              |
| MT8     | Complete Debugging Guide      | ⏳              |

---

# 1. What MT2 Adds

MT1 only answered:

```text
MISTAKE
   ↓
CORRECTION
```

MT2 adds the **reason**.

```text
INCORRECT
    ↓
WHY?
    ↓
CORRECT
```

That is the entire conceptual upgrade from MT1 → MT2.

The learner is no longer simply told what to change.

They learn:

> **Why the original approach is incorrect.**

---

# 2. MT2 Core Mental Model

```text
┌────────────────────────────┐
│         INCORRECT          │
│                            │
│     What did I write?      │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│            WHY?            │
│                            │
│   Why does it not work?    │
└──────────────┬─────────────┘
               ↓
┌────────────────────────────┐
│           CORRECT          │
│                            │
│     What should I write?   │
└────────────────────────────┘
```

---

# 3. MT2 Primary Question

MT2 should answer three questions:

### 1. What is incorrect?

```text
INCORRECT
```

### 2. Why is it incorrect?

```text
WHY
```

### 3. What is the correct approach?

```text
CORRECT
```

So:

```text
WHAT?
  ↓
WHY?
  ↓
HOW?
```

---

# 4. MT2 Example — `=` vs `==`

### INCORRECT

```python
if age = 18:
    print("Adult")
```

### WHY?

`=` is assignment, while `==` performs equality comparison.

### CORRECT

```python
if age == 18:
    print("Adult")
```

This is a perfect MT2 example because the **reason** is essential.

---

# 5. MT2 Page Structure

Recommended structure:

```text
┌──────────────────────────────────────┐
│ MISTAKEBLOCK                         │
│ Incorrect → Why → Correct            │
├──────────────────────────────────────┤
│                                      │
│ Short context                        │
│                                      │
├──────────────────────────────────────┤
│                                      │
│          01 — INCORRECT              │
│                                      │
│          incorrect code              │
│                                      │
├──────────────────────────────────────┤
│                                      │
│             ↓                        │
│                                      │
│             WHY?                     │
│                                      │
│          explanation                 │
│                                      │
├──────────────────────────────────────┤
│                                      │
│           02 — CORRECT               │
│                                      │
│            correct code              │
│                                      │
├──────────────────────────────────────┤
│                                      │
│         KEY TAKEAWAY                 │
└──────────────────────────────────────┘
```

---

# 6. MT2 Hero

The hero should explicitly communicate:

```text
INCORRECT
     ↓
WHY?
     ↓
CORRECT
```

Use the pink accent primarily on the transition:

```text
INCORRECT  ─────►  WHY?  ─────►  CORRECT
```

The learner should immediately understand that this version is **explanatory**, unlike MT1.

---

# 7. MT2 Three Core Cards

The three major cards are:

```text
┌────────────────────────┐
│ INCORRECT              │
│                        │
│ code / statement       │
└────────────────────────┘

          ↓

┌────────────────────────┐
│ WHY?                   │
│                        │
│ conceptual explanation │
└────────────────────────┘

          ↓

┌────────────────────────┐
│ CORRECT                │
│                        │
│ corrected code         │
└────────────────────────┘
```

---

# 8. MT2 — Incorrect Card

The card should show exactly what the learner wrote.

Example:

```python
if age = 18:
    print("Adult")
```

Highlight the problematic token:

```text
age = 18
    ↑
```

The highlighting should be selective.

Do not highlight the entire code block.

---

# 9. MT2 — Why Card

The Why section is the **new teaching component**.

Example:

```text
WHY?

`=` assigns a value.

It does not compare two values.

For a comparison, Python uses `==`.
```

The explanation should be:

* short
* conceptually accurate
* directly related to the mistake

---

# 10. MT2 — Correct Card

```python
if age == 18:
    print("Adult")
```

Highlight:

```text
age == 18
    ↑
comparison
```

The learner can now visually compare:

```text
=   → assignment
==  → comparison
```

---

# 11. MT2 Example — Function Return

### INCORRECT

```python
def add(a, b):
    a + b
```

### WHY?

The expression calculates the result, but the function does not return that value to the caller.

### CORRECT

```python
def add(a, b):
    return a + b
```

This is a good MT2 example because the learner understands the reason behind the correction.

---

# 12. MT2 Example — List Method

### INCORRECT

```python
items = [1, 2]
items.add(3)
```

### WHY?

A Python `list` does not provide an `add()` method for adding an individual element.

### CORRECT

```python
items = [1, 2]
items.append(3)
```

The important pattern remains:

```text
Incorrect
   ↓
Why
   ↓
Correct
```

---

# 13. MT2 Example — Index

### INCORRECT

```python
items = ["Python", "Java"]
print(items[2])
```

### WHY?

The list contains two elements, and Python uses zero-based indexing:

```text
index 0 → Python
index 1 → Java
```

Therefore index `2` is outside the valid range.

### CORRECT

```python
print(items[1])
```

---

# 14. MT2 Example — Variable Name

### INCORRECT

```python
user_name = "Alice"

print(username)
```

### WHY?

The defined name is `user_name`, but the code attempts to access a different name, `username`.

### CORRECT

```python
user_name = "Alice"

print(user_name)
```

---

# 15. MT2 Example — Indentation

### INCORRECT

```python
def greet():
print("Hello")
```

### WHY?

The function body must be indented relative to the function definition.

### CORRECT

```python
def greet():
    print("Hello")
```

---

# 16. MT2 Conceptual Example — Reference

This is especially valuable for your MemoryBlock integration.

### INCORRECT

```python
a = [1, 2]
b = a

b.append(3)

# a is still [1, 2]
```

### WHY?

`b = a` does not create a separate list. Both names refer to the same list object.

### CORRECT

If an independent list is required:

```python
a = [1, 2]
b = a.copy()

b.append(3)
```

Now the conceptual model is:

```text
a ─────► Object A [1,2]

b ─────► Object B [1,2,3]
```

This is an excellent MT2 example because the **Why** teaches the underlying concept.

---

# 17. MT2 Example — Method vs Method Call

### INCORRECT

```python
name = "alice"

print(name.upper)
```

### WHY?

`upper` refers to the method itself. Parentheses are required to invoke the method.

### CORRECT

```python
print(name.upper())
```

The learner sees:

```text
upper
  ↓
method reference

upper()
  ↓
method call
```

---

# 18. MT2 Example — Dictionary

### INCORRECT

```python
user = {
    "name": "Alice"
}

print(user["age"])
```

### WHY?

The dictionary contains the key `"name"`, not `"age"`.

### CORRECT

```python
print(user["name"])
```

The important distinction is:

```text
key requested
     ≠
key stored
```

---

# 19. MT2 Example — Mutable vs Immutable

### INCORRECT

```python
name = "Alice"
name[0] = "B"
```

### WHY?

Python strings are immutable. Individual characters cannot be changed in place.

### CORRECT

```python
name = "Alice"
name = "B" + name[1:]
```

or simply:

```python
name = "Blice"
```

This is a strong conceptual MT2 because the correction follows directly from the Why.

---

# 20. MT2 Example — List vs Tuple

### INCORRECT

```python
point = (10, 20)
point[0] = 50
```

### WHY?

Tuples are immutable, so their elements cannot be reassigned.

### CORRECT

```python
point = [10, 20]
point[0] = 50
```

if the data needs to be mutable.

---

# 21. MT2 Example — Function Arguments

### INCORRECT

```python
def greet(name):
    print("Hello", name)

greet()
```

### WHY?

The function requires one positional argument, `name`, but no argument was supplied.

### CORRECT

```python
greet("Alice")
```

This is an excellent transition toward MT3 because MT3 will later be able to show the actual error message.

---

# 22. MT2 Example — Loop

### INCORRECT

```python
for i in range(5):
print(i)
```

### WHY?

The loop body must be indented.

### CORRECT

```python
for i in range(5):
    print(i)
```

---

# 23. MT2 Example — Boolean Logic

### INCORRECT

```python
if age > 18 or age < 60:
    print("Eligible")
```

If the intended requirement is:

> age must be between 18 and 60

### WHY?

`or` allows either condition to be true. The intended range requires both boundaries to be satisfied.

### CORRECT

```python
if age > 18 and age < 60:
    print("Eligible")
```

This is a good example of **logic correction** rather than syntax correction.

---

# 24. MT2 Mistake Categories

MT2 can support:

| Category       | Example                           |
| -------------- | --------------------------------- |
| Syntax         | Missing `:`                       |
| Logic          | Wrong boolean operator            |
| Type           | Wrong operation for type          |
| Reference      | Unexpected aliasing               |
| API            | Wrong method                      |
| Scope          | Wrong variable visibility         |
| Function       | Missing argument/return           |
| Data structure | Wrong indexing                    |
| Concept        | Misunderstanding object/reference |
| Style/practice | Incorrect recommended usage       |

---

# 25. MT2 One-Mistake Rule

Just like MT1:

```text
ONE INCORRECT APPROACH
        ↓
ONE WHY EXPLANATION
        ↓
ONE CORRECT APPROACH
```

Do not put five mistakes on one MT2 block.

Multiple mistakes belong to:

> **MT6 — Multiple Mistakes**

---

# 26. MT2 Why Section Rules

The Why section is the most important part.

It must answer:

> **What rule, concept, or behavior makes the original approach incorrect?**

Good:

> `=` assigns a value; `==` compares values.

Weak:

> This is wrong because Python doesn't allow it.

The second explanation does not teach the learner anything.

---

# 27. MT2 Why Should Be Causal

Prefer:

```text
INCORRECT
    ↓
CAUSE / RULE
    ↓
CORRECT
```

For example:

```text
items[2]
   ↓
list has indexes 0 and 1
   ↓
items[1]
```

rather than:

```text
items[2]
   ↓
wrong
   ↓
items[1]
```

---

# 28. MT2 Visual Cause Connector

A useful component:

```text
┌────────────────────────┐
│ INCORRECT              │
│                        │
│ items[2]               │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ WHY?                   │
│                        │
│ Only indexes 0 and 1   │
│ exist in this list.    │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ CORRECT                │
│                        │
│ items[1]               │
└────────────────────────┘
```

This is the core MT2 visual language.

---

# 29. MT2 Incorrect vs Correct Comparison

Another useful desktop representation:

```text
┌─────────────────────┐
│ INCORRECT           │
│                     │
│ print(items[2])     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ WHY?                │
│                     │
│ Valid indexes are   │
│ 0 and 1.            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ CORRECT             │
│                     │
│ print(items[1])     │
└─────────────────────┘
```

On desktop, these can become three horizontally aligned cards.

---

# 30. MT2 Desktop Layout

```text
┌───────────────────────────────────────────────────────┐
│ MISTAKEBLOCK                                          │
│ Incorrect → Why → Correct                             │
├──────────────────┬──────────────────┬─────────────────┤
│                  │                  │                 │
│   INCORRECT      │      WHY?        │    CORRECT      │
│                  │                  │                 │
│  wrong code      │ explanation      │  fixed code     │
│                  │                  │                 │
└──────────────────┴──────────────────┴─────────────────┘
```

The three cards should visually form a single reasoning chain.

---

# 31. MT2 Mobile Layout

On mobile:

```text
INCORRECT
   ↓
WHY?
   ↓
CORRECT
```

Each section becomes full-width.

Do not force three tiny columns.

---

# 32. MT2 Code Highlighting

Example:

```python
if age = 18:
```

Highlight only:

```text
      =
```

Then correction:

```python
if age == 18:
```

Highlight:

```text
      ==
```

Why card:

```text
`=` assigns.
`==` compares.
```

This produces a visual learning chain.

---

# 33. MT2 Difference Visualization

The renderer should support:

```text
INCORRECT

age = 18
    ↑


WHY

`=` means assignment.


CORRECT

age == 18
    ↑↑

`==` performs comparison.
```

---

# 34. MT2 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT2",
  "presentation": "Incorrect → Why → Correct",

  "content": {
    "title": "",
    "context": "",

    "incorrect": {
      "code": "",
      "language": "python",
      "highlights": []
    },

    "why": {
      "explanation": "",
      "rule": "",
      "concept": ""
    },

    "correct": {
      "code": "",
      "language": "python",
      "highlights": []
    },

    "takeaway": ""
  }
}
```

---

# 35. MT2 Example JSON

```json
{
  "type": "mistake",
  "version": "MT2",
  "presentation": "Incorrect → Why → Correct",

  "content": {

    "title": "Assignment vs Comparison",

    "context": "A comparison is being performed inside an if condition.",

    "incorrect": {
      "language": "python",
      "code": "if age = 18:\n    print(\"Adult\")",

      "highlights": [
        {
          "value": "=",
          "reason": "assignment operator"
        }
      ]
    },

    "why": {
      "explanation": "The single equals sign performs assignment. It does not test whether two values are equal.",
      "rule": "`=` assigns a value, while `==` compares values.",
      "concept": "Assignment vs equality comparison"
    },

    "correct": {
      "language": "python",
      "code": "if age == 18:\n    print(\"Adult\")",

      "highlights": [
        {
          "value": "==",
          "reason": "equality comparison"
        }
      ]
    },

    "takeaway": "Use `==` when you need to compare two values."
  }
}
```

---

# 36. MT2 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "three-stage",

    "order": [
      "incorrect",
      "why",
      "correct"
    ],

    "showDifference": true,

    "showRule": true,

    "showTakeaway": true,

    "showArrow": true,

    "theme": "light",

    "primaryColor": "#f54a8d",

    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 37. MT2 Semantic HTML

```text
<section>
│
├── header
│
├── context
│
├── incorrect-section
│   ├── label
│   ├── code
│   └── highlights
│
├── why-section
│   ├── explanation
│   ├── rule
│   └── concept
│
├── correct-section
│   ├── label
│   ├── code
│   └── highlights
│
└── takeaway
```

---

# 38. MT2 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt2"
    data-block="mistake"
    data-version="MT2"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Incorrect → Why → Correct
        </h2>

    </header>


    <p class="mistake-context">
        Understand the incorrect approach, why it fails,
        and what the correct approach should be.
    </p>


    <section class="mistake-reasoning-flow">


        <article class="incorrect-card">

            <header>
                <span>
                    INCORRECT
                </span>
            </header>

            <pre><code>
if age = 18:
    print("Adult")
            </code></pre>

        </article>


        <div class="reasoning-arrow">
            ↓
        </div>


        <article class="why-card">

            <header>
                <span>
                    WHY?
                </span>
            </header>

            <p>
                The single equals sign performs assignment.
                It does not compare two values.
            </p>

            <div class="rule">
                <strong>=</strong>
                assigns

                <br>

                <strong>==</strong>
                compares
            </div>

        </article>


        <div class="reasoning-arrow">
            ↓
        </div>


        <article class="correct-card">

            <header>
                <span>
                    CORRECT
                </span>
            </header>

            <pre><code>
if age == 18:
    print("Adult")
            </code></pre>

        </article>

    </section>


    <aside class="mistake-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Use <code>==</code> when comparing values.
        </p>

    </aside>

</section>
```

---

# 39. MT2 Why Card Design

The Why card should visually feel like the **bridge between error and knowledge**.

```text
┌─────────────────────────────────┐
│ WHY?                            │
├─────────────────────────────────┤
│                                 │
│ `=` performs assignment.        │
│                                 │
│ `==` performs equality          │
│ comparison.                    │
│                                 │
├─────────────────────────────────┤
│ RULE                            │
│                                 │
│ =   → assign                    │
│ ==  → compare                   │
└─────────────────────────────────┘
```

This card is where MT2 differs most from MT1.

---

# 40. MT2 Explanation Depth

Keep the Why explanation around:

```text
1–3 short paragraphs
```

or:

```text
1 rule
+
1 explanation
```

Do not turn it into a full lesson.

For example, this is too much for MT2:

```text
History of equality operators
Python parser internals
AST representation
Bytecode
CPython execution
```

Those belong elsewhere.

---

# 41. MT2 Conceptual Correction

MT2 is especially powerful for misconceptions.

### Incorrect

> A variable contains the object itself.

### Why?

A Python name is associated with an object through a reference/binding relationship. Multiple names can refer to the same object.

### Correct

> Think of the name as referring to the object rather than treating the name as the object itself.

Visual:

```text
INCORRECT

name = object
     ↓
"contains"


WHY?

Names participate in
reference/binding relationships.


CORRECT

name ─────► object
```

This connects directly with your completed **MemoryBlock M8**.

---

# 42. MT2 Mutation Example

### Incorrect

```python
a = [1, 2]
b = a

b.append(3)

print(a)
# [1, 2]
```

### Why?

`a` and `b` refer to the same list object. Mutating the object through `b` changes the same object seen through `a`.

### Correct

If separate objects are required:

```python
a = [1, 2]
b = a.copy()

b.append(3)

print(a)
# [1, 2]
```

The visual:

```text
INCORRECT

a ─────┐
       ▼
      [1,2]
       ▲
       │
b ─────┘


WHY?

Both names reference
the same object.


CORRECT

a ─────► [1,2]

b ─────► [1,2,3]
```

---

# 43. MT2 Rebinding Example

### Incorrect assumption

```python
a = [1, 2]
b = a

a = [3, 4]

# b is now [3, 4]
```

### Why?

Rebinding `a` changes what `a` refers to. It does not redirect `b`.

### Correct mental model

```text
Before:

a ─────┐
       ▼
      A
       ▲
       │
b ─────┘


After:

a ─────► B

b ─────► A
```

This is an ideal MT2 conceptual example.

---

# 44. MT2 Why Types

The Why section can explain type rules.

Example:

### Incorrect

```python
age = "20"
result = age + 5
```

### Why?

`age` is a string, while `5` is an integer. Python does not automatically treat these operands as the same type for `+`.

### Correct

```python
age = "20"
result = int(age) + 5
```

or, if the desired result is a string:

```python
result = age + "5"
```

The correct answer depends on the intended operation.

That is an important MT2 characteristic:

> **Correction should follow the intended goal.**

---

# 45. MT2 Why Multiple Correct Solutions

Sometimes one mistake can have multiple valid corrections.

MT2 may support:

```json
{
  "correct": [
    {
      "label": "Option A",
      "code": "..."
    },
    {
      "label": "Option B",
      "code": "..."
    }
  ]
}
```

But the default presentation should still emphasize:

```text
Incorrect → Why → Correct
```

Multiple corrections should be used only when pedagogically useful.

A full comparison of alternatives is not MT2's purpose.

---

# 46. MT2 Correction Quality

A correction should satisfy three requirements:

```text
TECHNICALLY CORRECT
        +
MATCHES INTENT
        +
MINIMAL CHANGE
```

For example, if the mistake is:

```python
print(items[2])
```

do not unnecessarily rewrite the entire program.

Correct only what needs correcting:

```python
print(items[1])
```

---

# 47. MT2 Difference Between "Why" and "Cause"

This distinction matters for the version sequence.

MT2:

```text
WHY
```

is a **conceptual explanation**.

MT3:

```text
ERROR MESSAGE
     ↓
CAUSE
     ↓
FIX
```

will become much more diagnostic.

Therefore MT2 should say:

> “This happens because...”

but should not require an actual runtime error message.

---

# 48. MT2 No Error Message Requirement

For example:

```python
x = 10
y = 20

if x > y:
    print("x is larger")
```

There is no runtime error.

But if the intended requirement was:

> Print the larger value.

the mistake is logical.

MT2 can still teach:

```text
INCORRECT
condition does not handle the else case

WHY
The program produces no output when y is larger.

CORRECT
...
```

This demonstrates that MistakeBlock is broader than runtime errors.

---

# 49. MT2 No Debugger Requirement

MT2 does not require:

```text
breakpoints
watch expressions
stack trace
step over
step into
```

Those are appropriate for MT7.

MT2 is about **understanding one incorrect approach**.

---

# 50. MT2 Interaction

Optional:

```text
[ Reveal Why ]
```

Sequence:

```text
INCORRECT
    ↓
[ Reveal Why ]
    ↓
WHY
    ↓
CORRECT
```

Alternatively:

```text
[ Show Correction ]
```

after the learner has read the Why.

---

# 51. MT2 Progressive Interaction

A stronger learning sequence:

```text
STEP 1
Show INCORRECT
```

Ask:

> What is wrong?

Then:

```text
STEP 2
Reveal WHY
```

Then:

```text
STEP 3
Reveal CORRECT
```

This makes MT2 interactive without turning it into a debugger.

---

# 52. MT2 Accessibility

The visual sequence should have a screen-reader equivalent:

> Step 1: Incorrect code.
> Step 2: Explanation of why the code is incorrect.
> Step 3: Corrected code.

Keyboard:

```text
Enter / Space → reveal next stage
←             → previous stage
→             → next stage
R             → replay
```

Reduced-motion users should receive immediate state changes rather than animated transitions.

---

# 53. MT2 Colour Semantics

### Incorrect

Use:

```text
#F54A8D
```

for the problematic token/indicator.

### Why

Use:

```text
#0B1B3D
```

as the structural card colour with pink emphasis for the key rule.

### Correct

Use:

```text
#F54A8D
```

to highlight the corrected token.

Do **not** introduce additional brand colours.

---

# 54. MT2 Responsive Model

### Desktop

```text
INCORRECT → WHY → CORRECT
```

### Tablet

```text
INCORRECT
    ↓
WHY
    ↓
CORRECT
```

### Mobile

Full-width stacked cards:

```text
┌──────────────┐
│ INCORRECT    │
└──────────────┘

       ↓

┌──────────────┐
│ WHY?         │
└──────────────┘

       ↓

┌──────────────┐
│ CORRECT      │
└──────────────┘
```

---

# 55. MT2 Validation Rules

| Field                    |                      Required |
| ------------------------ | ----------------------------: |
| `type`                   |                             ✅ |
| `version`                |                       **MT2** |
| `presentation`           | **Incorrect → Why → Correct** |
| `incorrect`              |                             ✅ |
| `why`                    |                             ✅ |
| `correct`                |                             ✅ |
| `rule`                   |                   Recommended |
| `concept`                |                      Optional |
| `takeaway`               |                   Recommended |
| Error message            |                             ❌ |
| Stack trace              |                             ❌ |
| Multiple mistakes        |                             ❌ |
| Debugging steps          |                             ❌ |
| Complete debugging guide |                             ❌ |

---

# 56. MT2 Final Technical Specification

| Area                            | MT2 Decision                          |
| ------------------------------- | ------------------------------------- |
| **Block**                       | **MistakeBlock**                      |
| **Version**                     | **MT2**                               |
| **Presentation**                | **Incorrect → Why → Correct**         |
| **Primary purpose**             | Explain why one approach is incorrect |
| **Incorrect section**           | Required                              |
| **Why section**                 | **Required**                          |
| **Correct section**             | Required                              |
| **Rule**                        | Recommended                           |
| **Takeaway**                    | Recommended                           |
| **Error message**               | ❌                                     |
| **Diagnostic cause**            | ❌ MT3                                 |
| **Multiple mistakes**           | ❌ MT6                                 |
| **Debugging walkthrough**       | ❌ MT7                                 |
| **Complete debugging workflow** | ❌ MT8                                 |
| **Primary**                     | **#F54A8D**                           |
| **Secondary**                   | **#0B1B3D**                           |
| **Theme**                       | Light                                 |
| **Gradient**                    | ❌                                     |
| **Dark theme**                  | ❌                                     |
| **A4**                          | Portrait                              |
| **JSON-driven**                 | ✅                                     |
| **Responsive**                  | ✅                                     |
| **Accessible**                  | ✅                                     |
| **Reveal interaction**          | Optional                              |

---

# 57. MT1 → MT2 Evolution

This should remain crystal clear:

```text
MT1

MISTAKE
   ↓
CORRECTION
```

Then:

```text
MT2

INCORRECT
   ↓
WHY
   ↓
CORRECT
```

The new element is:

```text
WHY
```

That is the entire reason MT2 exists.

---

# 58. MistakeBlock Progress

| Version | Presentation                    | Status         |
| ------- | ------------------------------- | -------------- |
| MT1     | Mistake → Correction            | ✅              |
| **MT2** | **Incorrect → Why → Correct**   | ✅ **COMPLETE** |
| **MT3** | **Error Message → Cause → Fix** | ⏳ **NEXT**     |
| MT4     | Common Beginner Mistakes        | ⏳              |
| MT5     | Before / After Debugging        | ⏳              |
| MT6     | Multiple Mistakes               | ⏳              |
| MT7     | Debugging Walkthrough           | ⏳              |
| MT8     | Complete Debugging Guide        | ⏳              |

So **MT2 is now complete**.

The next version is strictly:

> **MT3 — Error Message → Cause → Fix**.



```python

```

# BLOCK 9 — MistakeBlock

## MT3 — Error Message → Cause → Fix

We continue **strictly according to the committed sequence**.

| Version | Presentation                    | Status         |
| ------- | ------------------------------- | -------------- |
| MT1     | Mistake → Correction            | ✅              |
| MT2     | Incorrect → Why → Correct       | ✅              |
| **MT3** | **Error Message → Cause → Fix** | 🔵 **CURRENT** |
| MT4     | Common Beginner Mistakes        | ⏳              |
| MT5     | Before / After Debugging        | ⏳              |
| MT6     | Multiple Mistakes               | ⏳              |
| MT7     | Debugging Walkthrough           | ⏳              |
| MT8     | Complete Debugging Guide        | ⏳              |

---

# 1. What Is MT3?

MT3 introduces the **actual error message** into the MistakeBlock.

MT1:

```text
Mistake
   ↓
Correction
```

MT2:

```text
Incorrect
   ↓
Why
   ↓
Correct
```

MT3:

```text
ERROR MESSAGE
      ↓
CAUSE
      ↓
FIX
```

The learner now learns how to move from:

> **“Python gave me this error.”**

to:

> **“This is what the error means.”**

and finally:

> **“This is how I fix it.”**

---

# 2. MT3 Primary Learning Goal

MT3 teaches the learner to interpret an error rather than simply react to it.

The core reasoning chain is:

```text
CODE
 ↓
ERROR
 ↓
ERROR MESSAGE
 ↓
CAUSE
 ↓
FIX
```

The learner should understand:

```text
Error message ≠ random technical text
```

Instead:

```text
Error message
     ↓
Diagnostic clue
     ↓
Likely cause
     ↓
Correction
```

---

# 3. MT3 Core Mental Model

```text
┌──────────────────────────────┐
│        ERROR MESSAGE         │
│                              │
│ What did Python report?      │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│            CAUSE             │
│                              │
│ Why did this happen?         │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│             FIX              │
│                              │
│ How should we correct it?    │
└──────────────────────────────┘
```

This is the defining structure of MT3.

---

# 4. MT3 Compared With MT2

This distinction must remain strict.

### MT2

```text
INCORRECT
    ↓
WHY
    ↓
CORRECT
```

MT2 can work even when there is **no runtime error**.

For example:

```python
if age > 18 or age < 60:
```

could be a logical mistake.

---

### MT3

```text
ERROR MESSAGE
    ↓
CAUSE
    ↓
FIX
```

MT3 specifically uses an **observable error produced by execution**.

---

# 5. MT3 Hero

The hero should communicate:

```text
ERROR MESSAGE
      ↓
    CAUSE
      ↓
     FIX
```

Recommended heading:

> **Read the Error. Find the Cause. Apply the Fix.**

Supporting line:

> Learn how to turn Python error messages into actionable debugging information.

---

# 6. MT3 Basic Example

Use a simple Python example.

### Code

```python
numbers = [10, 20, 30]

print(numbers[3])
```

### Error

```text
IndexError: list index out of range
```

### Cause

The list has indexes:

```text
0 → 10
1 → 20
2 → 30
```

Index `3` does not exist.

### Fix

```python
print(numbers[2])
```

The complete MT3 flow becomes:

```text
ERROR MESSAGE
IndexError
     ↓
CAUSE
Index 3 does not exist
     ↓
FIX
Use a valid index
```

---

# 7. MT3 Page Structure

```text
┌─────────────────────────────────────────┐
│ MISTAKEBLOCK                            │
│ Error Message → Cause → Fix             │
├─────────────────────────────────────────┤
│                                         │
│ Context                                 │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 01 — ERROR MESSAGE                     │
│                                         │
│ IndexError: list index out of range     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 02 — CAUSE                              │
│                                         │
│ Index 3 is outside the list.             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 03 — FIX                                │
│                                         │
│ print(numbers[2])                       │
│                                         │
├─────────────────────────────────────────┤
│ KEY TAKEAWAY                            │
└─────────────────────────────────────────┘
```

---

# 8. MT3 Error Message Card

The Error Message card is the first major component.

```text
┌─────────────────────────────────────┐
│ ERROR MESSAGE                       │
├─────────────────────────────────────┤
│                                     │
│ IndexError: list index out of range │
│                                     │
└─────────────────────────────────────┘
```

Important:

The card should show the **actual runtime message**, not merely:

```text
Something went wrong.
```

The learner needs exposure to real diagnostic terminology.

---

# 9. MT3 Error Type

Where available, separate:

```text
IndexError
```

from:

```text
list index out of range
```

Visual:

```text
┌─────────────────────────────────────┐
│ ERROR TYPE                          │
│                                     │
│ IndexError                          │
├─────────────────────────────────────┤
│ MESSAGE                             │
│                                     │
│ list index out of range             │
└─────────────────────────────────────┘
```

This prepares learners to recognize Python exception types.

---

# 10. MT3 Cause Card

The Cause card translates the technical error into human language.

Example:

```text
┌─────────────────────────────────────┐
│ CAUSE                               │
├─────────────────────────────────────┤
│                                     │
│ The list contains three elements.  │
│ Valid indexes are 0, 1 and 2.       │
│                                     │
│ Index 3 is outside the valid range. │
└─────────────────────────────────────┘
```

The Cause card should answer:

> **What specifically caused this error in this code?**

---

# 11. MT3 Fix Card

The Fix card shows the corrected code.

```python
numbers = [10, 20, 30]

print(numbers[2])
```

Visual:

```text
┌─────────────────────────────────────┐
│ FIX                                 │
├─────────────────────────────────────┤
│                                     │
│ print(numbers[2])                   │
│                                     │
└─────────────────────────────────────┘
```

---

# 12. MT3 Full Example

```python
numbers = [10, 20, 30]

print(numbers[3])
```

Runtime:

```text
IndexError: list index out of range
```

Then:

```text
ERROR MESSAGE
      ↓
IndexError
      ↓
CAUSE
      ↓
Index 3 is invalid
      ↓
FIX
      ↓
print(numbers[2])
```

---

# 13. MT3 Example — NameError

### Code

```python
name = "Alice"

print(username)
```

### Error Message

```text
NameError: name 'username' is not defined
```

### Cause

The program defined:

```text
name
```

but attempted to use:

```text
username
```

No name called `username` exists in the relevant scope.

### Fix

```python
name = "Alice"

print(name)
```

---

# 14. MT3 Example — TypeError

### Code

```python
age = 20

print("Age: " + age)
```

### Error

```text
TypeError: can only concatenate str (not "int") to str
```

### Cause

The `+` operation is being used between:

```text
string
+
integer
```

### Fix

```python
age = 20

print("Age: " + str(age))
```

Or:

```python
print(f"Age: {age}")
```

MT3 can show both valid fixes when appropriate.

---

# 15. MT3 Example — KeyError

### Code

```python
user = {
    "name": "Alice"
}

print(user["age"])
```

### Error

```text
KeyError: 'age'
```

### Cause

The dictionary does not contain the key `"age"`.

### Fix

If the intended key is `"name"`:

```python
print(user["name"])
```

Or, if `"age"` is expected:

```python
user = {
    "name": "Alice",
    "age": 25
}

print(user["age"])
```

The Fix should depend on the intended data model.

---

# 16. MT3 Example — AttributeError

### Code

```python
numbers = [1, 2, 3]

numbers.upper()
```

### Error

```text
AttributeError: 'list' object has no attribute 'upper'
```

### Cause

`upper()` is a string method. The object is a list.

### Fix

For a string:

```python
name = "alice"

print(name.upper())
```

Or if the intention is to modify the list, use an appropriate list operation.

---

# 17. MT3 Example — ZeroDivisionError

### Code

```python
result = 10 / 0
```

### Error

```text
ZeroDivisionError: division by zero
```

### Cause

Division by zero is not defined for this operation.

### Fix

```python
divisor = 2
result = 10 / divisor
```

or validate the input:

```python
if divisor != 0:
    result = 10 / divisor
```

---

# 18. MT3 Example — SyntaxError

### Code

```python
if age > 18
    print("Adult")
```

### Error

```text
SyntaxError
```

The exact diagnostic wording can vary by Python version/context, so the block should use the actual captured message when available.

### Cause

The `if` statement is missing the required colon.

### Fix

```python
if age > 18:
    print("Adult")
```

---

# 19. MT3 Example — IndentationError

### Code

```python
def greet():
print("Hello")
```

### Error

```text
IndentationError
```

### Cause

The statement belonging to the function body is not indented.

### Fix

```python
def greet():
    print("Hello")
```

---

# 20. MT3 Example — ValueError

### Code

```python
age = int("twenty")
```

### Error

```text
ValueError
```

### Cause

`int()` expects a string representing a valid integer, but `"twenty"` does not represent one.

### Fix

```python
age = int("20")
```

Or handle invalid input appropriately.

---

# 21. MT3 Example — FileNotFoundError

### Code

```python
with open("missing.txt") as file:
    data = file.read()
```

### Error

```text
FileNotFoundError
```

### Cause

The requested file cannot be found at the specified path.

### Fix

Use the correct path or ensure the file exists before opening it.

```python
with open("data.txt") as file:
    data = file.read()
```

The exact fix depends on the intended file location.

---

# 22. MT3 Example — ModuleNotFoundError

### Code

```python
import nonexistentmodule
```

### Error

```text
ModuleNotFoundError
```

### Cause

Python cannot locate the requested module in the current environment/import path.

### Fix

Use the correct module name or install/configure the required dependency when appropriate.

This is a useful example because the Fix is not always simply changing one line.

---

# 23. MT3 Error Anatomy

MT3 should teach learners that error messages often contain multiple pieces of information.

For example:

```text
Traceback (most recent call last):
  File "app.py", line 4, in <module>
    print(numbers[3])
IndexError: list index out of range
```

Conceptually:

```text
┌──────────────────────────────┐
│ TRACEBACK                    │
│ Where execution failed       │
├──────────────────────────────┤
│ FILE                         │
│ app.py                       │
├──────────────────────────────┤
│ LINE                         │
│ 4                            │
├──────────────────────────────┤
│ CODE                         │
│ print(numbers[3])            │
├──────────────────────────────┤
│ ERROR TYPE                   │
│ IndexError                   │
├──────────────────────────────┤
│ MESSAGE                      │
│ list index out of range      │
└──────────────────────────────┘
```

However, **MT3's primary presentation remains Error Message → Cause → Fix**.

The traceback is supporting context.

---

# 24. MT3 Error Message vs Traceback

Important distinction:

```text
Error Message
```

is not necessarily the entire:

```text
Traceback
```

The traceback provides execution context.

The final exception line usually gives:

```text
ExceptionType: message
```

MT3 can expose these separately.

---

# 25. MT3 Recommended Error Layout

```text
┌─────────────────────────────────────┐
│ ERROR                               │
├─────────────────────────────────────┤
│                                     │
│ IndexError                          │
│ list index out of range             │
│                                     │
└─────────────────────────────────────┘

                 ↓

┌─────────────────────────────────────┐
│ CAUSE                               │
├─────────────────────────────────────┤
│                                     │
│ The requested index does not exist. │
│                                     │
└─────────────────────────────────────┘

                 ↓

┌─────────────────────────────────────┐
│ FIX                                 │
├─────────────────────────────────────┤
│                                     │
│ print(numbers[2])                   │
│                                     │
└─────────────────────────────────────┘
```

---

# 26. MT3 Code → Error Connection

The code should be connected visually to the error.

```text
numbers = [10, 20, 30]

print(numbers[3])
              ↑
              │
              └──── invalid index
                         │
                         ▼
                 IndexError
```

Then:

```text
IndexError
     ↓
Cause
     ↓
Fix
```

This gives the learner a complete causal chain.

---

# 27. MT3 Error Highlight

Use `#F54A8D` to highlight the exact source location.

Example:

```python
print(numbers[3])
              ↑
```

The `3` should receive the accent emphasis.

Not the entire code block.

---

# 28. MT3 Cause Highlight

The Cause card can highlight the relevant rule:

```text
Valid indexes:

0     1     2
│     │     │
10    20    30
```

Then:

```text
3
↑
invalid
```

This makes the explanation visual.

---

# 29. MT3 Fix Highlight

```python
print(numbers[2])
              ↑
```

The corrected token receives the accent.

So the learner sees:

```text
3
↓
2
```

---

# 30. MT3 Desktop Layout

The preferred desktop layout:

```text
┌─────────────────────────────────────────────────────┐
│ MISTAKEBLOCK                                        │
│ Error Message → Cause → Fix                        │
├────────────────────┬────────────────┬───────────────┤
│                    │                │               │
│ ERROR MESSAGE      │ CAUSE          │ FIX           │
│                    │                │               │
│ IndexError         │ Index 3        │ numbers[2]    │
│ list index...      │ doesn't exist  │               │
│                    │                │               │
└────────────────────┴────────────────┴───────────────┘
```

The three cards form a diagnostic pipeline.

---

# 31. MT3 Mobile Layout

```text
┌─────────────────────────┐
│ ERROR MESSAGE           │
│                         │
│ IndexError              │
│ list index out of range │
└─────────────────────────┘

            ↓

┌─────────────────────────┐
│ CAUSE                   │
│                         │
│ Index 3 does not exist. │
└─────────────────────────┘

            ↓

┌─────────────────────────┐
│ FIX                     │
│                         │
│ print(numbers[2])       │
└─────────────────────────┘
```

---

# 32. MT3 Hero Example

A strong introductory example:

```python
numbers = [10, 20, 30]
print(numbers[3])
```

Then visually:

```text
CODE
  ↓
IndexError
  ↓
Index 3 is invalid
  ↓
Use index 2
```

The learner immediately understands the purpose of the block.

---

# 33. MT3 Error Type Badge

Use a compact badge:

```text
┌──────────────┐
│  IndexError  │
└──────────────┘
```

Other examples:

```text
NameError
TypeError
KeyError
ValueError
AttributeError
IndexError
ZeroDivisionError
SyntaxError
IndentationError
```

The badge should help learners build error-type recognition.

---

# 34. MT3 Cause Categories

The JSON can classify the cause:

```text
syntax
logic
type
name
index
key
attribute
value
file
module
runtime
```

Example:

```json
{
  "causeCategory": "index"
}
```

This can later support analytics or filtering.

---

# 35. MT3 Fix Categories

The Fix can also have a category:

```text
change-code
change-value
change-type
validate-input
handle-exception
correct-path
install-dependency
change-api
```

Example:

```json
{
  "fixCategory": "change-code"
}
```

This is useful for future tutorial analytics.

---

# 36. MT3 Important Principle — Fix Is Not Always "Change This Line"

Sometimes the correct response is:

```text
validate input
```

rather than:

```text
change the code blindly
```

Example:

```python
age = int(input("Age: "))
```

If the user enters:

```text
abc
```

the problem is not necessarily that `int()` is wrong.

The program needs input validation or exception handling.

Therefore:

```text
ERROR
 ↓
CAUSE
 ↓
FIX STRATEGY
```

can be more accurate than:

```text
ERROR
 ↓
replace one token
```

---

# 37. MT3 Example — Input Validation

### Code

```python
age = int(input("Enter age: "))
```

### Error

```text
ValueError
```

### Cause

The user entered a value that cannot be converted to an integer.

### Fix

Validate or handle the conversion:

```python
try:
    age = int(input("Enter age: "))
except ValueError:
    print("Please enter a valid integer.")
```

This is an excellent MT3 example because the fix addresses the actual runtime condition.

---

# 38. MT3 Example — Exception Handling

### Error

```text
ZeroDivisionError: division by zero
```

### Cause

The divisor is zero.

### Fix

```python
if divisor != 0:
    result = numerator / divisor
```

or:

```python
try:
    result = numerator / divisor
except ZeroDivisionError:
    ...
```

The block should make clear that the correct strategy depends on program intent.

---

# 39. MT3 Cause Must Not Invent Information

If the runtime error says:

```text
NameError: name 'x' is not defined
```

the block can confidently explain that `x` is not defined in the relevant scope.

But it should not invent:

> “The programmer forgot to initialize x because they intended it to contain the user's age.”

unless the tutorial content actually establishes that intention.

The Cause should remain grounded in the code.

---

# 40. MT3 Exact Error Messages

When documenting real Python errors, prefer the actual message generated by the relevant Python version.

For example:

```text
TypeError: ...
```

can vary slightly across Python versions and contexts.

Therefore the content model should allow:

```json
{
  "runtime": {
    "language": "python",
    "version": "3.x"
  }
}
```

when exact reproducibility matters.

---

# 41. MT3 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT3",
  "presentation": "Error Message → Cause → Fix",

  "content": {

    "title": "",

    "context": "",

    "code": {
      "language": "python",
      "source": ""
    },

    "error": {
      "type": "",
      "message": "",
      "traceback": "",
      "line": null
    },

    "cause": {
      "summary": "",
      "explanation": "",
      "category": ""
    },

    "fix": {
      "strategy": "",
      "code": "",
      "explanation": ""
    },

    "takeaway": ""
  }
}
```

---

# 42. MT3 Example JSON

```json
{
  "type": "mistake",
  "version": "MT3",
  "presentation": "Error Message → Cause → Fix",

  "content": {

    "title": "List Index Error",

    "context": "The program attempts to access an index that does not exist.",

    "code": {
      "language": "python",
      "source": "numbers = [10, 20, 30]\nprint(numbers[3])"
    },

    "error": {
      "type": "IndexError",
      "message": "list index out of range",
      "traceback": "",
      "line": 2
    },

    "cause": {
      "summary": "Index 3 does not exist in the list.",
      "explanation": "The list contains three elements, so the valid indexes are 0, 1, and 2.",
      "category": "index"
    },

    "fix": {
      "strategy": "Use a valid index.",
      "code": "numbers = [10, 20, 30]\nprint(numbers[2])",
      "explanation": "Index 2 refers to the third element."
    },

    "takeaway": "Python sequences use zero-based indexing."
  }
}
```

---

# 43. MT3 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "three-stage",

    "order": [
      "error",
      "cause",
      "fix"
    ],

    "showSourceCode": true,

    "showErrorType": true,

    "showErrorMessage": true,

    "showTraceback": false,

    "showCauseCategory": false,

    "showFixStrategy": true,

    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",

    "secondaryColor": "#0B1B3D"

  }
}
```

Traceback can be enabled for advanced examples without changing the MT3 conceptual pattern.

---

# 44. MT3 Traceback Expansion

Optional expandable area:

```text
[ View Traceback ]
```

Collapsed:

```text
ERROR
IndexError
list index out of range
```

Expanded:

```text
Traceback (most recent call last):
  File "example.py", line 2, in <module>
    print(numbers[3])
IndexError: list index out of range
```

This prevents the traceback from overwhelming beginners.

---

# 45. MT3 Semantic HTML

```text
<section>
│
├── header
│
├── context
│
├── source-code
│
├── error-section
│   ├── error-type
│   ├── error-message
│   └── traceback
│
├── cause-section
│   ├── summary
│   ├── explanation
│   └── rule
│
├── fix-section
│   ├── strategy
│   ├── corrected-code
│   └── explanation
│
└── takeaway
```

---

# 46. MT3 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt3"
    data-block="mistake"
    data-version="MT3"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Error Message → Cause → Fix
        </h2>

    </header>


    <p class="mistake-context">
        Learn how to interpret an error message,
        identify its cause, and apply the appropriate fix.
    </p>


    <section class="source-code">

        <h3>
            Code
        </h3>

        <pre><code>
numbers = [10, 20, 30]

print(numbers[3])
        </code></pre>

    </section>


    <section class="diagnostic-flow">


        <article class="error-card">

            <header>
                <span>
                    ERROR MESSAGE
                </span>
            </header>

            <div class="error-type">
                IndexError
            </div>

            <p>
                list index out of range
            </p>

        </article>


        <div class="diagnostic-arrow">
            ↓
        </div>


        <article class="cause-card">

            <header>
                <span>
                    CAUSE
                </span>
            </header>

            <p>
                The list contains three elements.
                Valid indexes are 0, 1, and 2.
                Index 3 does not exist.
            </p>

        </article>


        <div class="diagnostic-arrow">
            ↓
        </div>


        <article class="fix-card">

            <header>
                <span>
                    FIX
                </span>
            </header>

            <pre><code>
print(numbers[2])
            </code></pre>

            <p>
                Use a valid zero-based index.
            </p>

        </article>

    </section>


    <aside class="mistake-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Read the exception type and message as diagnostic clues.
        </p>

    </aside>

</section>
```

---

# 47. MT3 Visual Flow

The strongest visual pattern is:

```text
                  CODE
                   │
                   ▼
        ┌─────────────────────┐
        │   ERROR MESSAGE     │
        │                     │
        │   IndexError        │
        │   list index...     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │        CAUSE        │
        │                     │
        │   Invalid index     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │         FIX         │
        │                     │
        │   numbers[2]        │
        └─────────────────────┘
```

This should be the **signature visual of MT3**.

---

# 48. MT3 Colour System

### `#F54A8D`

Use for:

* error type
* problematic code token
* diagnostic arrows
* key fix
* highlighted cause

### `#0B1B3D`

Use for:

* headers
* code
* structural containers
* explanatory text
* borders

Keep the page light.

No gradients.

No dark theme.

---

# 49. MT3 Interaction

Recommended optional interaction:

```text
[ Reveal Cause ]
```

Sequence:

```text
ERROR MESSAGE
      ↓
[ Reveal Cause ]
      ↓
CAUSE
      ↓
[ Show Fix ]
      ↓
FIX
```

This lets the learner attempt diagnosis before seeing the explanation.

---

# 50. MT3 Debugging Prompt

Before revealing the Cause, optionally ask:

> **What do you think caused this error?**

Then:

```text
[ Reveal Cause ]
```

This makes MT3 more active without becoming MT7.

---

# 51. MT3 Accessibility

The screen-reader sequence should be:

> Error type: IndexError.
> Error message: list index out of range.
> Cause: the requested index does not exist.
> Fix: use a valid index such as 2.

The visual arrow sequence should not be the only way the relationship is communicated.

---

# 52. MT3 Validation Rules

| Field                    |                        Required |
| ------------------------ | ------------------------------: |
| `type`                   |                               ✅ |
| `version`                |                         **MT3** |
| `presentation`           | **Error Message → Cause → Fix** |
| `code`                   |                               ✅ |
| `error.type`             |                               ✅ |
| `error.message`          |                               ✅ |
| `cause`                  |                               ✅ |
| `fix`                    |                               ✅ |
| traceback                |                        Optional |
| runtime version          |                        Optional |
| cause category           |                     Recommended |
| fix strategy             |                     Recommended |
| takeaway                 |                     Recommended |
| Multiple errors          |                           ❌ MT6 |
| Full debugging steps     |                           ❌ MT7 |
| Complete debugging guide |                           ❌ MT8 |

---

# 53. MT3 Important Boundary

MT3 can show:

```text
CODE
 ↓
ERROR
 ↓
CAUSE
 ↓
FIX
```

But it should not become:

```text
CODE
 ↓
ERROR
 ↓
STACK TRACE ANALYSIS
 ↓
BREAKPOINT
 ↓
WATCH VARIABLES
 ↓
STEP INTO
 ↓
STEP OVER
 ↓
ROOT CAUSE ANALYSIS
 ↓
FIX
```

That belongs to **MT7 — Debugging Walkthrough**.

---

# 54. MT3 Error Taxonomy Foundation

MT3 can establish the learner's first error vocabulary:

```text
SyntaxError
IndentationError
NameError
TypeError
ValueError
IndexError
KeyError
AttributeError
ZeroDivisionError
FileNotFoundError
ModuleNotFoundError
```

But each MT3 instance should focus on **one primary error**.

---

# 55. MT3 One-Error Rule

The standard pattern is:

```text
ONE ERROR
    ↓
ONE PRIMARY CAUSE
    ↓
ONE FIX STRATEGY
```

If a program contains:

```text
Error 1
Error 2
Error 3
```

that is moving toward:

> **MT6 — Multiple Mistakes**

---

# 56. MT3 Error Message Is Evidence

A critical teaching principle:

```text
Error message
      ↓
Evidence
```

not:

```text
Error message
      ↓
Answer
```

For example:

```text
NameError
```

tells us something about name resolution, but the learner still needs to inspect the code to determine why the name is unavailable.

Therefore:

```text
ERROR MESSAGE
+
CODE CONTEXT
=
CAUSE
```

This is a much stronger debugging mental model.

---

# 57. MT3 Code Context

Every MT3 should preferably show the relevant code around the error.

Not only:

```text
IndexError
```

but:

```python
numbers = [10, 20, 30]
print(numbers[3])
```

The learner needs the connection:

```text
error
  ↕
code
```

---

# 58. MT3 Final Mental Model

```text
              CODE
                │
                ▼
          ERROR OCCURS
                │
                ▼
       ERROR TYPE + MESSAGE
                │
                ▼
        READ THE DIAGNOSTIC
                │
                ▼
          FIND THE CAUSE
                │
                ▼
         CHOOSE THE FIX
                │
                ▼
          CORRECT CODE
                │
                ▼
          RUN / VERIFY
```

The final **Run / Verify** step can be visually small in MT3; a complete debugging verification workflow belongs to later versions.

---

# 59. MT1 → MT2 → MT3 Evolution

This is the most important progression so far:

```text
MT1
MISTAKE
   ↓
CORRECTION
```

```text
MT2
INCORRECT
   ↓
WHY
   ↓
CORRECT
```

```text
MT3
ERROR MESSAGE
   ↓
CAUSE
   ↓
FIX
```

Notice the progression:

```text
Correction
     ↓
Explanation
     ↓
Diagnosis
```

That is exactly why these three versions should remain separate.

---

# 60. MistakeBlock Progress

| Version | Presentation                    | Status         |
| ------- | ------------------------------- | -------------- |
| MT1     | Mistake → Correction            | ✅              |
| MT2     | Incorrect → Why → Correct       | ✅              |
| **MT3** | **Error Message → Cause → Fix** | ✅ **COMPLETE** |
| **MT4** | **Common Beginner Mistakes**    | ⏳ **NEXT**     |
| MT5     | Before / After Debugging        | ⏳              |
| MT6     | Multiple Mistakes               | ⏳              |
| MT7     | Debugging Walkthrough           | ⏳              |
| MT8     | Complete Debugging Guide        | ⏳              |

### MT3 is now complete.

The next committed version is:

> **MT4 — Common Beginner Mistakes**.



```python

```

# BLOCK 9 — MistakeBlock

## MT4 — Common Beginner Mistakes

Yes. We now move to the **next committed version**, without changing the sequence.

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| MT1     | Mistake → Correction         | ✅              |
| MT2     | Incorrect → Why → Correct    | ✅              |
| MT3     | Error Message → Cause → Fix  | ✅              |
| **MT4** | **Common Beginner Mistakes** | 🔵 **CURRENT** |
| MT5     | Before / After Debugging     | ⏳              |
| MT6     | Multiple Mistakes            | ⏳              |
| MT7     | Debugging Walkthrough        | ⏳              |
| MT8     | Complete Debugging Guide     | ⏳              |

---

# 1. What Is MT4?

MT4 changes the teaching scope.

MT1, MT2 and MT3 focus on **one specific mistake**:

```text
MT1
One mistake → correction
```

```text
MT2
One incorrect approach → why → correct approach
```

```text
MT3
One error → cause → fix
```

MT4 introduces a **collection of common mistakes learners frequently make around one concept**.

The core model is:

```text
COMMON BEGINNER MISTAKES
          ↓
   ┌──────┼──────┬──────┐
   ↓      ↓      ↓      ↓
Mistake  Mistake Mistake Mistake
   ↓      ↓      ↓      ↓
Correction
```

The purpose is **pattern recognition**.

---

# 2. MT4 Primary Learning Goal

MT4 answers:

> **“What mistakes should I watch out for when learning this concept?”**

It helps learners recognize mistakes **before they make them**.

The progression is therefore:

```text
MT1 → Fix a mistake
MT2 → Understand why a mistake is wrong
MT3 → Diagnose an error
MT4 → Recognize common mistakes before they happen
```

That is the important pedagogical progression.

---

# 3. MT4 Core Mental Model

```text
                 CONCEPT
                    │
                    ▼
        ┌───────────────────────┐
        │ COMMON MISTAKES       │
        └───────────┬───────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   MISTAKE 1    MISTAKE 2    MISTAKE 3
       │            │            │
       ▼            ▼            ▼
    FIX / RULE    FIX / RULE   FIX / RULE
```

The learner should leave the block thinking:

> **“I know the mistakes I need to avoid.”**

---

# 4. MT4 Is Not MT6

This boundary is very important.

### MT4

```text
A COLLECTION OF KNOWN BEGINNER MISTAKES
```

These mistakes are presented as **separate learning patterns**.

Example:

```text
Mistake 1 — Wrong indentation
Mistake 2 — Wrong variable name
Mistake 3 — Missing return
Mistake 4 — Wrong index
```

### MT6

```text
MULTIPLE MISTAKES INSIDE ONE CODE EXAMPLE
```

For example:

```python
def calculate(x,y)
print(result)
retun x+y
```

where the learner must identify several mistakes in the same program.

So:

```text
MT4 = mistake library / checklist

MT6 = multiple mistakes in one debugging scenario
```

Do not merge them.

---

# 5. MT4 Example

Suppose the concept is **Python Lists**.

The MT4 block could be:

# Common Beginner Mistakes With Lists

### Mistake 1

Using an invalid index.

```python
items = ["Python", "Java"]
print(items[2])
```

**Remember:** indexes start at `0`.

---

### Mistake 2

Using `add()` instead of `append()`.

```python
items.add("C++")
```

**Correct:** use `append()` for a list.

---

### Mistake 3

Confusing `append()` and `extend()`.

```python
items.append(["C++", "JavaScript"])
```

This adds the list as one element.

---

### Mistake 4

Assuming assignment creates a copy.

```python
b = a
```

Both names can refer to the same list object.

This is a perfect MT4 structure.

---

# 6. MT4 Page Structure

Recommended:

```text
┌──────────────────────────────────────────────┐
│ MISTAKEBLOCK                                 │
│ Common Beginner Mistakes                    │
│                                              │
│ Avoid these common mistakes when learning    │
│ this concept.                                │
├──────────────────────────────────────────────┤
│                                              │
│ 01  MISTAKE                                  │
│     Wrong Index                              │
│                                              │
│     code                                     │
│     short rule                               │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ 02  MISTAKE                                  │
│     Wrong Method                             │
│                                              │
│     code                                     │
│     short rule                               │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ 03  MISTAKE                                  │
│     Assignment vs Copy                       │
│                                              │
│     code                                     │
│     short rule                               │
│                                              │
├──────────────────────────────────────────────┤
│ KEY TAKEAWAYS                                │
└──────────────────────────────────────────────┘
```

---

# 7. MT4 Hero

The hero should communicate **prevention**, not debugging.

Recommended:

> **Common Beginner Mistakes**

Supporting text:

> Learn the mistakes beginners commonly make and the simple rules that help you avoid them.

Visual:

```text
          COMMON BEGINNER MISTAKES

       ⚠  Mistake 1
       ⚠  Mistake 2
       ⚠  Mistake 3
       ⚠  Mistake 4

              ↓

        KNOW WHAT TO AVOID
```

Use the established:

* **#F54A8D**
* **#0B1B3D**
* light theme
* no gradient
* no dark theme

---

# 8. MT4 Mistake Card

Every mistake should have a compact card.

Recommended:

```text
┌─────────────────────────────────────┐
│ 01                                  │
│                                     │
│ WRONG INDEX                         │
│                                     │
│ print(items[2])                     │
│                                     │
│ Rule: Python uses zero-based        │
│ indexing.                           │
└─────────────────────────────────────┘
```

The card should be independently understandable.

---

# 9. MT4 Card Anatomy

Each mistake can contain:

```text
Mistake Number
      ↓
Mistake Title
      ↓
Short Example
      ↓
Why / Rule
      ↓
Avoid It
```

For example:

```text
01
INVALID INDEX

items[2]

Why?
Only indexes 0 and 1 exist.

Avoid it:
Remember zero-based indexing.
```

---

# 10. MT4 Should Usually Contain 4–7 Mistakes

The recommended range:

```text
4 → minimum useful collection
5 → ideal
6 → strong
7 → upper practical range
```

Avoid turning one MT4 block into a huge encyclopedia.

For example:

```text
❌ 20 mistakes
```

would become difficult to scan.

A good default:

```text
5 common beginner mistakes
```

---

# 11. MT4 Example — Python Functions

Suppose the topic is:

> Python Functions

A strong MT4 could contain:

```text
01 — Forgetting the colon
02 — Forgetting indentation
03 — Forgetting required arguments
04 — Forgetting return
05 — Confusing calling with defining
```

---

# 12. MT4 — Mistake 1

### Forgetting `:`

Incorrect:

```python
def greet()
    print("Hello")
```

Rule:

> Python function definitions require a colon after the parameter list.

Correct:

```python
def greet():
    print("Hello")
```

---

# 13. MT4 — Mistake 2

### Incorrect indentation

```python
def greet():
print("Hello")
```

Rule:

> Statements belonging to the function body must be indented.

Correct:

```python
def greet():
    print("Hello")
```

---

# 14. MT4 — Mistake 3

### Missing required argument

```python
def greet(name):
    print("Hello", name)

greet()
```

Rule:

> The function requires the `name` argument.

Correct:

```python
greet("Alice")
```

---

# 15. MT4 — Mistake 4

### Forgetting `return`

```python
def add(a, b):
    a + b
```

Rule:

> Evaluating an expression does not automatically return its value from the function.

Correct:

```python
def add(a, b):
    return a + b
```

---

# 16. MT4 — Mistake 5

### Confusing definition and invocation

Definition:

```python
def greet():
    print("Hello")
```

Calling the function:

```python
greet()
```

Common beginner mistake:

```python
greet
```

Rule:

> `greet` refers to the function; `greet()` invokes it.

---

# 17. MT4 Example — Python Variables

For Variables:

```text
01 — Using a name before defining it
02 — Confusing `=` with `==`
03 — Assuming assignment creates a copy
04 — Using inconsistent variable names
05 — Confusing value with reference
```

The block becomes a **mistake checklist** for the concept.

---

# 18. MT4 Example — Python Lists

```text
01 — Invalid index
02 — Using add() instead of append()
03 — Confusing append() with extend()
04 — Assuming assignment copies a list
05 — Modifying a list while iterating
```

Each item remains concise.

---

# 19. MT4 Example — Python Dictionaries

```text
01 — Accessing a missing key
02 — Confusing keys and values
03 — Using list-style indexing incorrectly
04 — Assuming key order solves lookup
05 — Modifying a dictionary incorrectly during iteration
```

---

# 20. MT4 Example — Exception Handling

For Exception Handling:

```text
01 — Catching every exception with bare except
02 — Catching the wrong exception type
03 — Hiding errors instead of handling them
04 — Putting too much code inside try
05 — Forgetting that finally still executes
```

This is particularly useful for the Exception Handling Masterclass.

---

# 21. MT4 Example — OOP

For classes:

```text
01 — Forgetting self
02 — Confusing class and instance attributes
03 — Calling an instance method incorrectly
04 — Forgetting to initialize required state
05 — Overusing inheritance
```

Again, the goal is recognition.

---

# 22. MT4 Example — Memory

For memory/reference concepts:

```text
01 — Assuming assignment creates a copy
02 — Confusing identity with equality
03 — Assuming every object is immediately destroyed
04 — Forgetting that multiple names can reference one object
05 — Confusing mutation with rebinding
```

This connects naturally with your completed MemoryBlock versions.

---

# 23. MT4 Mistake Severity

Not every mistake should receive equal visual weight.

You can classify:

```text
COMMON
IMPORTANT
EASY TO MISS
CONCEPTUAL
```

Example:

```text
┌──────────────────────────────┐
│ COMMON MISTAKE               │
│                              │
│ Using = instead of ==        │
└──────────────────────────────┘
```

But do not introduce excessive warning colours.

---

# 24. MT4 Mistake Numbering

Use explicit numbering:

```text
01
02
03
04
05
```

This creates a natural scan path.

Example:

```text
01  Wrong Index
02  Wrong Method
03  Wrong Argument
04  Missing Return
05  Reference Confusion
```

---

# 25. MT4 Visual Pattern

The ideal visual pattern is:

```text
┌───────────────┐
│ 01            │
│ Mistake       │
│ Example       │
│ Rule          │
└───────────────┘

┌───────────────┐
│ 02            │
│ Mistake       │
│ Example       │
│ Rule          │
└───────────────┘

┌───────────────┐
│ 03            │
│ Mistake       │
│ Example       │
│ Rule          │
└───────────────┘
```

The cards should look like a **learning checklist**, not debugging panels.

---

# 26. MT4 Desktop Layout

For A4/desktop:

```text
┌─────────────────────────────────────────────────────┐
│ MISTAKEBLOCK                                        │
│ Common Beginner Mistakes                            │
├──────────────────────────┬──────────────────────────┤
│ 01                       │ 02                       │
│ Wrong Index              │ Wrong Method             │
│                          │                          │
│ code                     │ code                     │
│ rule                     │ rule                     │
├──────────────────────────┼──────────────────────────┤
│ 03                       │ 04                       │
│ Assignment vs Copy       │ Missing Return           │
│                          │                          │
│ code                     │ code                     │
│ rule                     │ rule                     │
├──────────────────────────┴──────────────────────────┤
│ 05 — Reference Confusion                            │
│                                                     │
│ KEY TAKEAWAY                                        │
└─────────────────────────────────────────────────────┘
```

---

# 27. MT4 Mobile Layout

Mobile becomes a vertical checklist:

```text
01 — Wrong Index
───────────────
code
rule

02 — Wrong Method
─────────────────
code
rule

03 — Assignment vs Copy
───────────────────────
code
rule

04 — Missing Return
───────────────────
code
rule
```

This is highly scannable.

---

# 28. MT4 Why Section

Unlike MT2, MT4 does not need a large Why section.

Each mistake can have a **one-line reason/rule**.

Example:

```text
WRONG INDEX

items[2]

Rule:
Indexes start at 0.
```

The detailed explanation can remain in another block.

That keeps MT4 compact.

---

# 29. MT4 Relationship With MT2

This distinction is useful:

### MT2

One mistake gets a complete explanation:

```text
Incorrect
   ↓
Why
   ↓
Correct
```

### MT4

Many mistakes receive concise explanations:

```text
Mistake 1 → short rule
Mistake 2 → short rule
Mistake 3 → short rule
Mistake 4 → short rule
```

Therefore MT4 is **breadth-oriented**, while MT2 is **depth-oriented**.

---

# 30. MT4 Relationship With MT3

MT3:

```text
Error Message
      ↓
Cause
      ↓
Fix
```

MT4:

```text
Common Mistake
      ↓
Warning / Rule
```

MT4 does not require an actual runtime error.

A mistake can be:

* conceptual
* stylistic
* logical
* API-related
* syntactic
* beginner misconception

---

# 31. MT4 Relationship With MT5

MT5 will focus on:

```text
BEFORE
   ↓
DEBUGGING
   ↓
AFTER
```

MT4 does not show a complete debugging transformation.

MT4 is simply:

> **“Here are the common mistakes to watch for.”**

---

# 32. MT4 Relationship With MT6

Again:

```text
MT4
Common mistakes across a concept
```

versus:

```text
MT6
Several mistakes inside one specific example
```

Example MT6:

```python
def calculate(x,y)
print(result)
retun x+y
```

The learner must find:

```text
Mistake 1
Mistake 2
Mistake 3
```

That is not MT4.

---

# 33. MT4 Example — Complete List Block

Suppose the topic is:

> Python Lists — append()

The MT4 block could be:

# Common Beginner Mistakes

### 01 — Using `add()`

```python
items.add("Python")
```

**Rule:** Lists use `append()` to add one element.

---

### 02 — Expecting `append()` to return the new list

```python
items = items.append("Python")
```

**Rule:** `append()` mutates the list and returns `None`.

---

### 03 — Confusing `append()` and `extend()`

```python
items.append(["Python", "Java"])
```

**Rule:** `append()` adds the argument as one element.

---

### 04 — Assuming assignment creates a copy

```python
backup = items
```

**Rule:** Both names can refer to the same list.

---

### 05 — Using an invalid index

```python
items[len(items)]
```

**Rule:** The largest valid index is `len(items) - 1`.

This is an excellent MT4 block.

---

# 34. MT4 Card Data Model

Each mistake can use:

```json
{
  "id": "MT4-01",
  "title": "",
  "description": "",
  "example": {
    "incorrect": "",
    "correct": ""
  },
  "rule": "",
  "category": ""
}
```

---

# 35. MT4 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT4",
  "presentation": "Common Beginner Mistakes",

  "content": {

    "title": "",
    "context": "",

    "mistakes": [

      {
        "id": "01",
        "title": "",
        "category": "",

        "incorrect": {
          "language": "python",
          "code": ""
        },

        "correct": {
          "language": "python",
          "code": ""
        },

        "rule": "",
        "takeaway": ""
      }

    ],

    "summary": ""
  }
}
```

---

# 36. MT4 Example JSON

```json
{
  "type": "mistake",
  "version": "MT4",
  "presentation": "Common Beginner Mistakes",

  "content": {

    "title": "Common Beginner Mistakes With Lists",

    "context": "Avoid these common mistakes when working with Python lists.",

    "mistakes": [

      {
        "id": "01",
        "title": "Using add() with a list",
        "category": "api-usage",

        "incorrect": {
          "language": "python",
          "code": "items.add(\"Python\")"
        },

        "correct": {
          "language": "python",
          "code": "items.append(\"Python\")"
        },

        "rule": "Use append() to add one element to a list.",
        "takeaway": "Lists provide append(), not add()."
      },

      {
        "id": "02",
        "title": "Assuming assignment copies a list",
        "category": "reference",

        "incorrect": {
          "language": "python",
          "code": "backup = items"
        },

        "correct": {
          "language": "python",
          "code": "backup = items.copy()"
        },

        "rule": "Assignment can make two names refer to the same object.",
        "takeaway": "Use copy() when an independent list is required."
      }

    ],

    "summary": "Recognize these common list mistakes before they become debugging problems."
  }
}
```

---

# 37. MT4 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "mistake-grid",

    "columns": {
      "desktop": 2,
      "tablet": 2,
      "mobile": 1
    },

    "showIncorrectCode": true,
    "showCorrectCode": true,
    "showRule": true,
    "showCategory": false,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 38. MT4 Semantic Structure

```text
<section>
│
├── header
│   ├── eyebrow
│   └── title
│
├── context
│
├── mistakes-grid
│   │
│   ├── mistake-card
│   │   ├── number
│   │   ├── title
│   │   ├── incorrect
│   │   ├── correct
│   │   └── rule
│   │
│   ├── mistake-card
│   │
│   ├── mistake-card
│   │
│   └── ...
│
└── summary
```

---

# 39. MT4 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt4"
    data-block="mistake"
    data-version="MT4"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Common Beginner Mistakes
        </h2>

    </header>


    <p class="mistake-context">
        Avoid these common mistakes when working with
        Python lists.
    </p>


    <section class="mistakes-grid">


        <article class="mistake-card">

            <span class="mistake-number">
                01
            </span>

            <h3>
                Using add()
            </h3>

            <div class="incorrect-code">

                <span>
                    INCORRECT
                </span>

                <pre><code>
items.add("Python")
                </code></pre>

            </div>

            <div class="correct-code">

                <span>
                    CORRECT
                </span>

                <pre><code>
items.append("Python")
                </code></pre>

            </div>

            <p class="mistake-rule">
                Lists use append() to add one element.
            </p>

        </article>


        <article class="mistake-card">

            <span class="mistake-number">
                02
            </span>

            <h3>
                Assignment Is Not a Copy
            </h3>

            <div class="incorrect-code">

                <span>
                    INCORRECT ASSUMPTION
                </span>

                <pre><code>
backup = items
                </code></pre>

            </div>

            <div class="correct-code">

                <span>
                    WHEN A COPY IS NEEDED
                </span>

                <pre><code>
backup = items.copy()
                </code></pre>

            </div>

            <p class="mistake-rule">
                Assignment can make two names refer
                to the same object.
            </p>

        </article>


    </section>


    <aside class="mistake-summary">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Knowing common mistakes helps you avoid
            unnecessary debugging later.
        </p>

    </aside>

</section>
```

---

# 40. MT4 Visual Identity

MT4 should visually communicate:

```text
AWARENESS
+
PATTERN RECOGNITION
+
PREVENTION
```

Not:

```text
ERROR
+
PANIC
+
DEBUGGING
```

So the design should feel more like a **professional checklist / knowledge guide**.

---

# 41. MT4 Number Badge

Each mistake can use:

```text
┌──────┐
│  01  │
└──────┘
```

with `#F54A8D`.

The number creates:

* scanning order
* visual hierarchy
* easy reference
* consistency across cards

---

# 42. MT4 Card Header

Recommended:

```text
01
WRONG INDEX

A common mistake when accessing list elements.
```

Then the code.

This gives the learner the mistake before exposing the details.

---

# 43. MT4 Optional "Remember" Badge

Useful:

```text
┌──────────────────┐
│ REMEMBER         │
│                  │
│ Indexes start 0. │
└──────────────────┘
```

This is preferable to a large warning banner.

---

# 44. MT4 Categories

Mistakes may optionally be categorized:

```text
Syntax
Logic
Concept
API
Reference
Type
Naming
```

Example:

```text
01  WRONG INDEX
    [INDEXING]
```

But categories should remain secondary.

---

# 45. MT4 Interaction

MT4 does not need heavy interaction.

Useful optional behavior:

```text
[ Show Fix ]
```

for each card.

Initial state:

```text
INCORRECT
```

Then:

```text
Show Fix
   ↓
CORRECT
```

However, on an educational reference page, showing both by default may be preferable.

The block should remain useful without JavaScript.

---

# 46. MT4 Expandable Cards

For many mistakes:

```text
01 — Wrong Index          [Expand]
02 — Wrong Method         [Expand]
03 — Assignment vs Copy   [Expand]
04 — Missing Return       [Expand]
05 — Wrong Argument       [Expand]
```

Clicking expands:

```text
Example
Rule
Correction
```

This is particularly useful on mobile.

---

# 47. MT4 Accessibility

Each card should be semantically independent.

Screen reader:

> Mistake 1 of 5: Wrong index.

Then:

> Incorrect example...

Then:

> Correct approach...

Then:

> Rule...

Keyboard:

```text
Tab → next mistake
Enter → expand/collapse
```

Do not rely on colour alone to distinguish incorrect/correct.

---

# 48. MT4 A4 Composition

Recommended A4 portrait:

```text
┌──────────────────────────────────────┐
│                                      │
│ MISTAKEBLOCK                         │
│ Common Beginner Mistakes             │
│                                      │
│ Short introduction                   │
│                                      │
├───────────────────┬──────────────────┤
│ 01                │ 02               │
│ Wrong Index       │ Wrong Method     │
│                   │                  │
│ code              │ code             │
│ rule              │ rule             │
├───────────────────┼──────────────────┤
│ 03                │ 04               │
│ Reference         │ Missing Return   │
│                   │                  │
│ code              │ code             │
│ rule              │ rule             │
├───────────────────┴──────────────────┤
│ 05 — Common Mistake                  │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 49. MT4 Desktop Composition

Desktop can use:

```text
2 × 3
```

or:

```text
3 × 2
```

depending on content density.

For code-heavy mistakes:

```text
2 columns
```

is safer.

For very short mistakes:

```text
3 columns
```

may work.

The renderer should choose based on content rather than forcing one layout.

---

# 50. MT4 Mobile Composition

Always:

```text
1 column
```

with comfortable spacing.

Each mistake becomes:

```text
Number
Title
Example
Rule
```

This makes the block extremely readable on mobile.

---

# 51. MT4 Content Rules

A good MT4 mistake should be:

### Specific

Bad:

> Beginners often make mistakes.

Good:

> Using `=` instead of `==` inside a comparison.

### Recognizable

The learner should immediately recognize the situation.

### Correctable

There should be a clear rule or correction.

### Relevant

The mistake must relate directly to the tutorial concept.

---

# 52. MT4 Should Not Become a Generic Warning List

Avoid:

```text
❌ Write clean code.
❌ Follow best practices.
❌ Test your code.
❌ Use meaningful names.
```

Those are too generic.

Instead:

```text
✅ Do not use `=` when you intend equality comparison.
✅ Do not assume `b = a` creates an independent list.
```

The mistake must be concrete.

---

# 53. MT4 Best-Practice Boundary

Some mistakes may overlap with BestPracticeBlock.

That's acceptable if the purpose is different.

### MT4

> Common beginner mistake: using `except:` without specifying an exception.

### BestPracticeBlock

> Prefer catching specific exceptions so unexpected failures are not hidden.

Same subject, different pedagogical purpose.

---

# 54. MT4 Summary

The learner should finish with something like:

```text
Before you continue, remember:

1. Use valid indexes.
2. Use the correct method for the data type.
3. Understand assignment vs copying.
4. Match function arguments correctly.
5. Do not confuse expressions with returned values.
```

This is the **mistake-prevention checklist**.

---

# 55. MT4 Final Mental Model

```text
             CONCEPT
                │
                ▼
      COMMON BEGINNER MISTAKES
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Mistake   Mistake   Mistake
       │        │        │
       ▼        ▼        ▼
      Rule     Rule     Rule
       │        │        │
       └────────┼────────┘
                ▼
          AVOID THE TRAP
```

The learner should think:

> **“Now I know what to watch for.”**

---

# 56. MT1 → MT2 → MT3 → MT4 Evolution

The progression is now:

```text
MT1
Mistake
  ↓
Correction
```

```text
MT2
Incorrect
  ↓
Why
  ↓
Correct
```

```text
MT3
Error Message
  ↓
Cause
  ↓
Fix
```

```text
MT4
Common Beginner Mistakes
  ↓
01
02
03
04
05
  ↓
Rules to Avoid Them
```

This is a very logical progression:

```text
CORRECT
   ↓
UNDERSTAND
   ↓
DIAGNOSE
   ↓
PREVENT
```

---

# 57. MT4 Final Technical Specification

| Area                                 | MT4 Decision                       |
| ------------------------------------ | ---------------------------------- |
| **Block**                            | **MistakeBlock**                   |
| **Version**                          | **MT4**                            |
| **Presentation**                     | **Common Beginner Mistakes**       |
| **Primary purpose**                  | Mistake recognition and prevention |
| **Typical mistakes**                 | 4–7                                |
| **Mistake numbering**                | Recommended                        |
| **Incorrect example**                | Recommended                        |
| **Correction**                       | Recommended                        |
| **Rule**                             | **Recommended**                    |
| **Detailed Why**                     | ❌ MT2                              |
| **Runtime error**                    | ❌ MT3                              |
| **Error diagnosis**                  | ❌ MT3                              |
| **Multiple mistakes in one program** | ❌ MT6                              |
| **Debugging walkthrough**            | ❌ MT7                              |
| **Complete debugging guide**         | ❌ MT8                              |
| **Primary**                          | **#F54A8D**                        |
| **Secondary**                        | **#0B1B3D**                        |
| **Theme**                            | Light                              |
| **Gradient**                         | ❌                                  |
| **Dark theme**                       | ❌                                  |
| **A4**                               | Portrait                           |
| **JSON-driven**                      | ✅                                  |
| **Responsive**                       | ✅                                  |
| **Accessible**                       | ✅                                  |
| **Grid layout**                      | ✅                                  |
| **Expandable cards**                 | Optional                           |

---

# 58. MistakeBlock Progress

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| MT1     | Mistake → Correction         | ✅              |
| MT2     | Incorrect → Why → Correct    | ✅              |
| MT3     | Error Message → Cause → Fix  | ✅              |
| **MT4** | **Common Beginner Mistakes** | ✅ **COMPLETE** |
| **MT5** | **Before / After Debugging** | ⏳ **NEXT**     |
| MT6     | Multiple Mistakes            | ⏳              |
| MT7     | Debugging Walkthrough        | ⏳              |
| MT8     | Complete Debugging Guide     | ⏳              |

## MT4 is now complete.

The next committed version is:

> **MT5 — Before / After Debugging**.



```python

```

    # BLOCK 9 — MistakeBlock

## MT5 — Before / After Debugging

Yes. We now continue with the **next committed version** exactly as defined.

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| MT1     | Mistake → Correction         | ✅              |
| MT2     | Incorrect → Why → Correct    | ✅              |
| MT3     | Error Message → Cause → Fix  | ✅              |
| MT4     | Common Beginner Mistakes     | ✅              |
| **MT5** | **Before / After Debugging** | 🔵 **CURRENT** |
| MT6     | Multiple Mistakes            | ⏳              |
| MT7     | Debugging Walkthrough        | ⏳              |
| MT8     | Complete Debugging Guide     | ⏳              |

---

# 1. What Is MT5?

MT5 introduces a **before-and-after debugging transformation**.

The learner sees the complete situation:

```text
BEFORE
  ↓
Something is wrong
  ↓
DEBUG / IDENTIFY
  ↓
AFTER
  ↓
Correct working version
```

The key difference from previous versions is that MT5 is no longer only showing one mistake.

It shows the **state of the code before debugging and the state after debugging**.

---

# 2. MT5 Core Mental Model

```text
┌──────────────────────────────┐
│            BEFORE            │
│                              │
│     Code with problem        │
│                              │
│     ❌ Incorrect behavior    │
└──────────────┬───────────────┘
               │
               │ DEBUG
               ▼
┌──────────────────────────────┐
│            AFTER             │
│                              │
│     Corrected code           │
│                              │
│     ✓ Expected behavior      │
└──────────────────────────────┘
```

The central concept is:

> **See how debugging changes the program from a problematic state to a correct state.**

---

# 3. MT5 Compared With Previous Versions

### MT1

```text
Mistake
   ↓
Correction
```

Focus:

> What should I change?

---

### MT2

```text
Incorrect
   ↓
Why
   ↓
Correct
```

Focus:

> Why is this wrong?

---

### MT3

```text
Error Message
   ↓
Cause
   ↓
Fix
```

Focus:

> What does this error tell me?

---

### MT4

```text
Common Mistakes
   ↓
Rules
```

Focus:

> What should I watch out for?

---

### MT5

```text
BEFORE
   ↓
DEBUGGING TRANSFORMATION
   ↓
AFTER
```

Focus:

> **What does the program look like before and after the debugging process?**

---

# 4. MT5 Primary Learning Goal

MT5 teaches **debugging transformation**.

The learner should visually understand:

```text
Problematic Program
       ↓
Identify Problem
       ↓
Apply Correction
       ↓
Working Program
```

This is different from MT7.

MT5 shows the **before/after transformation**.

MT7 will later teach the **full debugging walkthrough step by step**.

---

# 5. MT5 Hero

Recommended title:

> **Before / After Debugging**

Supporting text:

> See how identifying and correcting a mistake transforms a program from incorrect behavior to the expected result.

Hero visual:

```text
BEFORE
  ❌
  ↓
DEBUG
  ↓
AFTER
  ✓
```

The visual should immediately communicate transformation.

---

# 6. MT5 Main Layout

Recommended A4 structure:

```text
┌──────────────────────────────────────────┐
│ MISTAKEBLOCK                             │
│ Before / After Debugging                 │
├──────────────────────────────────────────┤
│                                          │
│ Context                                  │
│                                          │
├────────────────────┬─────────────────────┤
│                    │                     │
│      BEFORE        │        AFTER        │
│                    │                     │
│  problematic code  │   corrected code   │
│                    │                     │
│  wrong output      │   expected output  │
│                    │                     │
└────────────────────┴─────────────────────┘
                    ↓
              WHAT CHANGED?
```

---

# 7. MT5 Before Card

The Before card contains:

```text
BEFORE DEBUGGING
```

and:

* original code
* problematic line
* observed behavior
* optionally error message

Example:

```python
numbers = [10, 20, 30]

print(numbers[3])
```

Observed:

```text
IndexError: list index out of range
```

---

# 8. MT5 After Card

The After card contains:

```text
AFTER DEBUGGING
```

Example:

```python
numbers = [10, 20, 30]

print(numbers[2])
```

Expected output:

```text
30
```

Now the learner sees the complete transformation.

---

# 9. MT5 "What Changed?" Section

This is an important component.

Between or beneath the two states:

```text
WHAT CHANGED?

numbers[3]
     ↓
numbers[2]

The program now accesses
a valid list index.
```

This provides the bridge between:

```text
BEFORE
```

and:

```text
AFTER
```

---

# 10. MT5 Complete Example

### BEFORE

```python
numbers = [10, 20, 30]

print(numbers[3])
```

Output:

```text
IndexError: list index out of range
```

### DEBUGGING CHANGE

```text
numbers[3]
        ↓
numbers[2]
```

### AFTER

```python
numbers = [10, 20, 30]

print(numbers[2])
```

Output:

```text
30
```

Visual:

```text
BEFORE                         AFTER

numbers[3]        ─────►      numbers[2]

IndexError                    30
```

---

# 11. MT5 Is About State Transformation

The fundamental model is:

```text
STATE A
Problem
   ↓
Debugging
   ↓
STATE B
Correct
```

This makes MT5 particularly useful for teaching debugging concepts visually.

---

# 12. MT5 Example — NameError

### BEFORE

```python
name = "Alice"

print(username)
```

Output:

```text
NameError: name 'username' is not defined
```

### WHAT CHANGED?

```text
username
    ↓
name
```

### AFTER

```python
name = "Alice"

print(name)
```

Output:

```text
Alice
```

---

# 13. MT5 Example — TypeError

### BEFORE

```python
age = 20

print("Age: " + age)
```

Error:

```text
TypeError
```

### WHAT CHANGED?

```text
"Age: " + age
        ↓
"Age: " + str(age)
```

### AFTER

```python
age = 20

print("Age: " + str(age))
```

Output:

```text
Age: 20
```

---

# 14. MT5 Example — Missing Return

### BEFORE

```python
def add(a, b):
    a + b

result = add(10, 20)

print(result)
```

Output:

```text
None
```

### WHAT CHANGED?

```text
a + b
  ↓
return a + b
```

### AFTER

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

This example is especially useful because the problem is **incorrect behavior rather than a runtime exception**.

---

# 15. MT5 Example — Boolean Logic

### BEFORE

```python
age = 25

if age < 18 or age > 60:
    print("Eligible")
```

Suppose the intended requirement is:

> Eligible between 18 and 60.

### WHAT CHANGED?

```text
or
 ↓
and
```

### AFTER

```python
age = 25

if age >= 18 and age <= 60:
    print("Eligible")
```

Output:

```text
Eligible
```

This shows that MT5 supports **logical debugging**, not only syntax errors.

---

# 16. MT5 Example — List Mutation

### BEFORE

```python
items = [1, 2]

result = items.append(3)

print(result)
```

Output:

```text
None
```

### WHAT CHANGED?

The programmer expected:

```text
append()
   ↓
new list
```

But the method mutates the existing list and returns `None`.

### AFTER

```python
items = [1, 2]

items.append(3)

print(items)
```

Output:

```text
[1, 2, 3]
```

This is an excellent MT5 example because the Before/After difference teaches behavior.

---

# 17. MT5 Example — Reference vs Copy

### BEFORE

```python
items = [1, 2]

backup = items

backup.append(3)

print(items)
```

Output:

```text
[1, 2, 3]
```

Suppose the intended behavior was an independent backup.

### WHAT CHANGED?

```text
backup = items
        ↓
backup = items.copy()
```

### AFTER

```python
items = [1, 2]

backup = items.copy()

backup.append(3)

print(items)
```

Output:

```text
[1, 2]
```

The learner sees the behavioral difference immediately.

---

# 18. MT5 Example — Indentation

### BEFORE

```python
def greet():
print("Hello")
```

Error:

```text
IndentationError
```

### WHAT CHANGED?

```text
print("Hello")
        ↓
    print("Hello")
```

### AFTER

```python
def greet():
    print("Hello")
```

Output:

```text
Hello
```

---

# 19. MT5 Example — Function Argument

### BEFORE

```python
def greet(name):
    print("Hello", name)

greet()
```

Error:

```text
TypeError
```

### WHAT CHANGED?

```text
greet()
   ↓
greet("Alice")
```

### AFTER

```python
def greet(name):
    print("Hello", name)

greet("Alice")
```

Output:

```text
Hello Alice
```

---

# 20. MT5 Example — Dictionary Key

### BEFORE

```python
user = {
    "name": "Alice"
}

print(user["age"])
```

Error:

```text
KeyError: 'age'
```

### WHAT CHANGED?

If the intended key is `"name"`:

```text
user["age"]
     ↓
user["name"]
```

### AFTER

```python
print(user["name"])
```

Output:

```text
Alice
```

---

# 21. MT5 Before/After Comparison

A strong visual:

```text
┌───────────────────────────┐
│ BEFORE                    │
├───────────────────────────┤
│                           │
│ print(numbers[3])         │
│                           │
│ ❌ IndexError              │
└──────────────┬────────────┘
               │
               │ DEBUG
               ▼
┌───────────────────────────┐
│ AFTER                     │
├───────────────────────────┤
│                           │
│ print(numbers[2])         │
│                           │
│ ✓ 30                      │
└───────────────────────────┘
```

---

# 22. MT5 Horizontal Desktop Layout

For desktop, this is the preferred layout:

```text
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│           BEFORE             │            AFTER             │
│                              │                              │
│  problematic code            │  corrected code              │
│                              │                              │
│  ❌ error / wrong output     │  ✓ expected output           │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
                  ↑
             WHAT CHANGED?
```

The arrow between them should communicate transformation.

---

# 23. MT5 Mobile Layout

Mobile:

```text
┌──────────────────────────┐
│ BEFORE                   │
│                          │
│ problematic code         │
│                          │
│ ❌ wrong result          │
└──────────────────────────┘

             ↓

┌──────────────────────────┐
│ WHAT CHANGED?            │
│                          │
│ one focused correction   │
└──────────────────────────┘

             ↓

┌──────────────────────────┐
│ AFTER                    │
│                          │
│ corrected code           │
│                          │
│ ✓ expected result        │
└──────────────────────────┘
```

---

# 24. MT5 "Before" Visual Treatment

The Before state should be visually recognizable as problematic.

Use:

* subtle pink emphasis
* highlighted incorrect line
* optional error badge
* muted background

Avoid making the entire card bright or visually aggressive.

The code remains the primary content.

---

# 25. MT5 "After" Visual Treatment

The After state should communicate successful correction.

Use:

* clean card
* strong dark-blue structure
* pink highlight around changed/fixed code
* expected output

Again, stay within:

```text
#F54A8D
#0B1B3D
```

No extra success green is necessary.

---

# 26. MT5 What Changed Component

This is the signature component of MT5.

Example:

```text
┌────────────────────────────────────┐
│ WHAT CHANGED?                      │
├────────────────────────────────────┤
│                                    │
│ numbers[3]                         │
│      ↓                             │
│ numbers[2]                         │
│                                    │
│ The index was changed to a valid   │
│ position in the list.              │
└────────────────────────────────────┘
```

It can also show:

```text
- old line
+ new line
```

For example:

```diff
- print(numbers[3])
+ print(numbers[2])
```

This is especially useful for code-heavy tutorials.

---

# 27. MT5 Diff Visualization

For larger changes:

```text
BEFORE

- result = add(a, b)


AFTER

+ result = add(a, b)
```

For actual correction:

```diff
- b = a
+ b = a.copy()
```

The difference should remain focused.

---

# 28. MT5 Output Comparison

The output comparison is important.

### BEFORE

```text
❌ None
```

### AFTER

```text
✓ 30
```

or:

### BEFORE

```text
❌ IndexError
```

### AFTER

```text
✓ 30
```

This makes the debugging result concrete.

---

# 29. MT5 Behavior Comparison

Not every Before/After example has an exception.

Support:

```text
BEFORE
Wrong output

AFTER
Expected output
```

and:

```text
BEFORE
Runtime error

AFTER
Successful execution
```

and:

```text
BEFORE
Unexpected state

AFTER
Expected state
```

This makes MT5 broadly useful.

---

# 30. MT5 Debugging Scope

MT5 should normally focus on:

```text
ONE PROBLEM
     ↓
ONE DEBUGGING TRANSFORMATION
     ↓
ONE CORRECT RESULT
```

This is important.

Do not turn MT5 into a full debugging session.

That is MT7.

---

# 31. MT5 vs MT7

### MT5

```text
BEFORE
 ↓
WHAT CHANGED?
 ↓
AFTER
```

### MT7

```text
PROBLEM
 ↓
OBSERVE
 ↓
FORM HYPOTHESIS
 ↓
INSPECT
 ↓
TEST
 ↓
LOCATE
 ↓
FIX
 ↓
VERIFY
```

MT7 will be much more procedural.

MT5 is visual and comparative.

---

# 32. MT5 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT5",
  "presentation": "Before / After Debugging",

  "content": {

    "title": "",
    "context": "",

    "before": {

      "code": {
        "language": "python",
        "source": ""
      },

      "behavior": {
        "type": "error",
        "output": "",
        "message": ""
      }

    },

    "change": {

      "summary": "",
      "diff": [],
      "explanation": ""

    },

    "after": {

      "code": {
        "language": "python",
        "source": ""
      },

      "behavior": {
        "type": "success",
        "output": "",
        "message": ""
      }

    },

    "takeaway": ""
  }
}
```

---

# 33. MT5 Example JSON

```json
{
  "type": "mistake",
  "version": "MT5",
  "presentation": "Before / After Debugging",

  "content": {

    "title": "Fixing an Invalid List Index",

    "context": "The program attempts to access an element outside the list.",

    "before": {

      "code": {
        "language": "python",
        "source": "numbers = [10, 20, 30]\nprint(numbers[3])"
      },

      "behavior": {
        "type": "error",
        "output": "",
        "message": "IndexError: list index out of range"
      }

    },

    "change": {

      "summary": "Replace the invalid index with a valid index.",

      "diff": [
        {
          "from": "print(numbers[3])",
          "to": "print(numbers[2])"
        }
      ],

      "explanation": "The list contains three elements, so the valid indexes are 0, 1, and 2."

    },

    "after": {

      "code": {
        "language": "python",
        "source": "numbers = [10, 20, 30]\nprint(numbers[2])"
      },

      "behavior": {
        "type": "success",
        "output": "30",
        "message": ""
      }

    },

    "takeaway": "Always check the valid index range before accessing a sequence element."
  }
}
```

---

# 34. MT5 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "before-after",

    "desktop": {
      "direction": "horizontal"
    },

    "mobile": {
      "direction": "vertical"
    },

    "showBeforeCode": true,
    "showAfterCode": true,
    "showDiff": true,
    "showBeforeBehavior": true,
    "showAfterBehavior": true,
    "showChangeExplanation": true,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 35. MT5 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── before-section
│   ├── label
│   ├── code
│   └── behavior
│
├── change-section
│   ├── diff
│   ├── explanation
│   └── transition
│
├── after-section
│   ├── label
│   ├── code
│   └── behavior
│
└── takeaway
```

---

# 36. MT5 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt5"
    data-block="mistake"
    data-version="MT5"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Before / After Debugging
        </h2>

    </header>


    <p class="mistake-context">
        See how a debugging correction transforms
        problematic code into working code.
    </p>


    <section class="before-after-flow">


        <article class="before-card">

            <header>
                <span>
                    BEFORE
                </span>
            </header>

            <pre><code>
numbers = [10, 20, 30]
print(numbers[3])
            </code></pre>

            <div class="behavior error">

                <strong>
                    ERROR
                </strong>

                <p>
                    IndexError:
                    list index out of range
                </p>

            </div>

        </article>


        <article class="change-card">

            <header>
                <span>
                    WHAT CHANGED?
                </span>
            </header>

            <div class="diff">

                <div class="old">
                    numbers[3]
                </div>

                <div class="arrow">
                    ↓
                </div>

                <div class="new">
                    numbers[2]
                </div>

            </div>

            <p>
                The invalid index was replaced
                with a valid index.
            </p>

        </article>


        <article class="after-card">

            <header>
                <span>
                    AFTER
                </span>
            </header>

            <pre><code>
numbers = [10, 20, 30]
print(numbers[2])
            </code></pre>

            <div class="behavior success">

                <strong>
                    OUTPUT
                </strong>

                <p>
                    30
                </p>

            </div>

        </article>


    </section>


    <aside class="mistake-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Compare the program before and after the
            correction to understand what debugging changed.
        </p>

    </aside>

</section>
```

---

# 37. MT5 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ MISTAKEBLOCK                         │
│ Before / After Debugging             │
│                                      │
│ See how the correction changes       │
│ program behavior.                   │
├──────────────────────────────────────┤
│                                      │
│ BEFORE                               │
│ ┌──────────────────────────────────┐ │
│ │ problematic code                │ │
│ │                                 │ │
│ │ ❌ error                        │ │
│ └──────────────────────────────────┘ │
│                                      │
│                ↓                     │
│                                      │
│ WHAT CHANGED?                        │
│ ┌──────────────────────────────────┐ │
│ │ old → new                        │ │
│ │ explanation                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│                ↓                     │
│                                      │
│ AFTER                                │
│ ┌──────────────────────────────────┐ │
│ │ corrected code                  │ │
│ │                                 │ │
│ │ ✓ expected output               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 38. MT5 Desktop Layout

```text
┌──────────────────────┬──────────────────────┬──────────────────────┐
│       BEFORE         │    WHAT CHANGED?     │        AFTER         │
│                      │                      │                      │
│ problematic code    │ old → new            │ corrected code       │
│                      │                      │                      │
│ ❌ error / wrong     │ why changed          │ ✓ expected result   │
│    output            │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

This three-column model is the strongest desktop representation.

---

# 39. MT5 Interaction

A useful optional interaction is:

```text
[ Reveal After ]
```

Initially:

```text
BEFORE
```

The learner thinks about the fix.

Then:

```text
[ Reveal After ]
```

shows:

```text
WHAT CHANGED?
+
AFTER
```

This creates a simple prediction activity.

---

# 40. MT5 Progressive Reveal

```text
STEP 1

BEFORE
```

Then:

```text
STEP 2

What do you think should change?
```

Then:

```text
STEP 3

WHAT CHANGED?
```

Then:

```text
STEP 4

AFTER
```

This is enough interaction for MT5.

Do not add debugger controls.

---

# 41. MT5 Accessibility

The sequence should be readable as:

> Before debugging: code produces an IndexError.

> Change: index 3 is replaced with index 2.

> After debugging: code produces 30.

Keyboard interaction should work if progressive reveal is enabled.

The Before and After states must not rely solely on visual colour.

---

# 42. MT5 Verification

The After state should ideally show evidence that the correction worked:

```text
BEFORE
❌ Error

AFTER
✓ Output
```

or:

```text
BEFORE
❌ Wrong result: 20

AFTER
✓ Expected result: 30
```

This creates a strong debugging lesson:

```text
Fix
 ↓
Verify
```

---

# 43. MT5 Verification Is Not MT7

MT5 may show:

```text
AFTER
✓ expected output
```

But it should not teach a complete verification process.

MT7 will later cover:

```text
Run
 ↓
Observe
 ↓
Inspect
 ↓
Test hypothesis
 ↓
Fix
 ↓
Run again
 ↓
Verify
```

MT5 only demonstrates the resulting transformation.

---

# 44. MT5 Diff Types

Support:

### Added

```diff
+ return result
```

### Removed

```diff
- return result
```

### Replaced

```diff
- numbers[3]
+ numbers[2]
```

### Moved

```text
Before:
statement outside function

After:
statement inside function
```

### Changed configuration/value

```text
Before:
timeout = 0

After:
timeout = 30
```

The content model should remain flexible.

---

# 45. MT5 Conceptual Before/After

MT5 is not restricted to source-code changes.

For memory concepts:

### BEFORE

```text
a ─────┐
       ▼
      List
       ▲
       │
b ─────┘
```

### AFTER

```text
a ─────► List A

b ─────► List B
```

### WHAT CHANGED?

```text
b = a
   ↓
b = a.copy()
```

This is an excellent conceptual Before/After example.

---

# 46. MT5 Execution Example

For execution concepts:

### BEFORE

```text
Function call
     ↓
Wrong argument
     ↓
TypeError
```

### AFTER

```text
Function call
     ↓
Correct argument
     ↓
Function executes
```

This can connect MT5 with the later ExecutionBlock.

---

# 47. MT5 Memory Example

### BEFORE

```text
a ─────► Object A
b ─────► Object A
```

Mutation:

```text
b.append(3)
```

Result:

```text
a sees [1,2,3]
```

### AFTER

```text
a ─────► Object A
b ─────► Object B
```

Now:

```text
b.append(3)
```

Result:

```text
a sees [1,2]
b sees [1,2,3]
```

This is powerful because the learner sees **behavioral transformation**, not merely a code edit.

---

# 48. MT5 Mistake Scope

Each MT5 instance should preferably contain:

```text
ONE PRIMARY PROBLEM
+
ONE DEBUGGING CHANGE
+
ONE RESULT
```

This keeps the transformation clear.

Multiple independent problems belong to MT6.

---

# 49. MT5 Common Content Types

MT5 can represent:

| Problem   | Before                 | After                |
| --------- | ---------------------- | -------------------- |
| Syntax    | invalid code           | valid code           |
| Logic     | wrong condition        | correct condition    |
| Runtime   | exception              | successful execution |
| Type      | incompatible operation | valid operation      |
| Reference | shared object          | independent copy     |
| Function  | wrong invocation       | correct invocation   |
| Output    | wrong result           | expected result      |
| Structure | incorrect organization | corrected structure  |

---

# 50. MT5 Content Rules

### Before must be authentic

Show what the learner would actually encounter.

### Change must be minimal

Show what was changed.

### After must be demonstrably better

Show the expected behavior.

### Explanation must connect the states

Do not simply display two unrelated programs.

The learner must see:

```text
BEFORE
  ↓
CHANGE
  ↓
AFTER
```

---

# 51. MT5 What It Should NOT Become

### ❌ MT1

Only:

```text
Mistake → Correction
```

### ❌ MT2

Detailed:

```text
Incorrect → Why → Correct
```

### ❌ MT3

```text
Error → Cause → Fix
```

### ❌ MT4

A list of many beginner mistakes.

### ❌ MT6

Several mistakes inside one program.

### ❌ MT7

A complete debugging walkthrough.

### ❌ MT8

A comprehensive debugging guide.

MT5 has one defining identity:

> **Show the transformation from problematic state to corrected state.**

---

# 52. MT5 Final Mental Model

```text
                 BEFORE
                    │
                    │
              PROBLEM STATE
                    │
                    ▼
             WHAT CHANGED?
                    │
                    │
                    ▼
                  AFTER
                    │
                    │
             CORRECT STATE
                    │
                    ▼
             EXPECTED RESULT
```

The learner should visually experience:

```text
❌ BEFORE
   ↓
🔧 CHANGE
   ↓
✅ AFTER
```

using the project's established visual language rather than introducing a new colour system.

---

# 53. MT1 → MT5 Complete Progression

We now have:

```text
MT1
Mistake → Correction
```

```text
MT2
Incorrect → Why → Correct
```

```text
MT3
Error Message → Cause → Fix
```

```text
MT4
Common Beginner Mistakes
```

```text
MT5
Before → Debugging Change → After
```

Notice the pedagogical progression:

```text
CORRECT
   ↓
UNDERSTAND
   ↓
DIAGNOSE
   ↓
PREVENT
   ↓
TRANSFORM
```

That progression is exactly what differentiates the versions.

---

# 54. MT5 Final Technical Specification

| Area                       | MT5 Decision                  |
| -------------------------- | ----------------------------- |
| **Block**                  | **MistakeBlock**              |
| **Version**                | **MT5**                       |
| **Presentation**           | **Before / After Debugging**  |
| **Primary purpose**        | Show debugging transformation |
| **Before state**           | Required                      |
| **After state**            | Required                      |
| **What Changed**           | **Required**                  |
| **Before behavior**        | Recommended                   |
| **After behavior**         | Recommended                   |
| **Diff**                   | Recommended                   |
| **Error message**          | Optional                      |
| **Multiple mistakes**      | ❌ MT6                         |
| **Full debugging process** | ❌ MT7                         |
| **Complete guide**         | ❌ MT8                         |
| **Primary**                | **#F54A8D**                   |
| **Secondary**              | **#0B1B3D**                   |
| **Theme**                  | Light                         |
| **Gradient**               | ❌                             |
| **Dark theme**             | ❌                             |
| **A4**                     | Portrait                      |
| **Desktop**                | Before → Change → After       |
| **Mobile**                 | Before ↓ Change ↓ After       |
| **JSON-driven**            | ✅                             |
| **Responsive**             | ✅                             |
| **Accessible**             | ✅                             |
| **Progressive reveal**     | Optional                      |

---

# 55. MistakeBlock Progress

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| MT1     | Mistake → Correction         | ✅              |
| MT2     | Incorrect → Why → Correct    | ✅              |
| MT3     | Error Message → Cause → Fix  | ✅              |
| MT4     | Common Beginner Mistakes     | ✅              |
| **MT5** | **Before / After Debugging** | ✅ **COMPLETE** |
| **MT6** | **Multiple Mistakes**        | ⏳ **NEXT**     |
| MT7     | Debugging Walkthrough        | ⏳              |
| MT8     | Complete Debugging Guide     | ⏳              |

## MT5 is now complete.

The next committed version is:

> **MT6 — Multiple Mistakes**.



```python

```

# BLOCK 9 — MistakeBlock

## MT6 — Multiple Mistakes

Yes. We now move to the **next committed version**, exactly following your MistakeBlock sequence.

| Version | Presentation                | Status         |
| ------- | --------------------------- | -------------- |
| MT1     | Mistake → Correction        | ✅              |
| MT2     | Incorrect → Why → Correct   | ✅              |
| MT3     | Error Message → Cause → Fix | ✅              |
| MT4     | Common Beginner Mistakes    | ✅              |
| MT5     | Before / After Debugging    | ✅              |
| **MT6** | **Multiple Mistakes**       | 🔵 **CURRENT** |
| MT7     | Debugging Walkthrough       | ⏳              |
| MT8     | Complete Debugging Guide    | ⏳              |

---

# 1. What Is MT6?

MT6 introduces a **single code example containing multiple mistakes**.

This is the key distinction from MT4.

### MT4

```text
Common Beginner Mistakes

Mistake 1
Mistake 2
Mistake 3
Mistake 4
```

Each mistake is presented independently.

### MT6

```text
ONE PROGRAM
     ↓
┌───────────────────────────┐
│ Mistake 1                 │
│ Mistake 2                 │
│ Mistake 3                 │
└───────────────────────────┘
     ↓
Identify them
     ↓
Correct them
```

So MT6 teaches the learner:

> **“Can you find multiple problems inside the same piece of code?”**

---

# 2. MT6 Core Mental Model

```text
                    CODE
                      │
                      ▼
          ┌───────────────────────┐
          │   MULTIPLE PROBLEMS   │
          │                       │
          │   Mistake 1           │
          │   Mistake 2           │
          │   Mistake 3           │
          └───────────┬───────────┘
                      │
                      ▼
               IDENTIFY THEM
                      │
                      ▼
               CORRECT THEM
                      │
                      ▼
                WORKING CODE
```

The learner is now moving from **single-error recognition** to **multi-error analysis**.

---

# 3. MT6 Primary Learning Goal

MT6 should develop:

* error spotting
* code reading
* attention to detail
* prioritization
* mistake classification
* correction sequencing
* debugging confidence

The learner should stop thinking:

> “I found an error, so I'm done.”

and start thinking:

> **“There may be more than one problem here.”**

---

# 4. MT6 Position in the Progression

The MistakeBlock progression now becomes:

```text
MT1
One mistake
   ↓
Correction
```

```text
MT2
One mistake
   ↓
Why
   ↓
Correction
```

```text
MT3
One runtime error
   ↓
Cause
   ↓
Fix
```

```text
MT4
Many common mistakes
   ↓
Recognition
```

```text
MT5
One debugging transformation
   ↓
Before → After
```

```text
MT6
Many mistakes
   ↓
Find them
   ↓
Correct them
```

Then:

```text
MT7
Full debugging walkthrough
```

and finally:

```text
MT8
Complete debugging guide
```

---

# 5. MT6 Basic Example

Let's create a deliberately flawed Python program:

```python
def calculate(a, b)
result = a + b
print(results)

return result
```

There are multiple problems.

### Mistake 1

Missing `:`:

```python
def calculate(a, b)
```

should be:

```python
def calculate(a, b):
```

### Mistake 2

Indentation is incorrect.

```python
result = a + b
```

should be inside the function.

### Mistake 3

`results` does not match `result`.

```python
print(results)
```

should be:

```python
print(result)
```

### Mistake 4

`return` is outside the function.

It should be inside.

This is a proper MT6 scenario.

---

# 6. MT6 Before

```python
def calculate(a, b)
result = a + b
print(results)

return result
```

The learner sees the entire program first.

Do **not** immediately mark every mistake.

That would remove the problem-solving component.

---

# 7. MT6 Challenge

Recommended prompt:

> **Can you find all the mistakes?**

Then:

```text
How many problems can you identify?

[ 1 ] [ 2 ] [ 3 ] [ 4 ]
```

This creates active engagement.

---

# 8. MT6 Mistake Markers

After the learner attempts the problem, reveal:

```text
def calculate(a, b)     ← ①
result = a + b          ← ②
print(results)          ← ③
return result           ← ④
```

But the numbering should correspond to actual mistakes rather than merely line numbers.

---

# 9. MT6 Mistake 1

### Missing colon

```python
def calculate(a, b)
```

Correction:

```python
def calculate(a, b):
```

Category:

```text
Syntax
```

---

# 10. MT6 Mistake 2

### Incorrect indentation

Incorrect:

```python
def calculate(a, b):
result = a + b
```

Correct:

```python
def calculate(a, b):
    result = a + b
```

Category:

```text
Indentation
```

---

# 11. MT6 Mistake 3

### Wrong variable name

Incorrect:

```python
print(results)
```

Correct:

```python
print(result)
```

Category:

```text
Naming / NameError
```

---

# 12. MT6 Mistake 4

### Return outside function

Incorrect:

```python
def calculate(a, b):
    result = a + b

return result
```

Correct:

```python
def calculate(a, b):
    result = a + b
    return result
```

Category:

```text
Structure
```

---

# 13. MT6 Corrected Program

```python
def calculate(a, b):
    result = a + b
    print(result)

    return result
```

Then:

```python
result = calculate(10, 20)
```

Output:

```text
30
30
```

The exact surrounding program can be designed according to the tutorial context.

---

# 14. MT6 Important Debugging Principle

Multiple mistakes can interact.

For example:

```text
Mistake 1
   ↓
prevents execution
   ↓
Mistake 2
   ↓
may not be discovered yet
```

This means the learner should understand:

> **The first visible error is not necessarily the only error.**

This is one of the most valuable lessons in MT6.

---

# 15. MT6 Error Dependency

Consider:

```python
def calculate(a, b)
result = a + b
print(results)
```

The missing colon produces a syntax error first.

The program may not execute far enough to reveal the later problems.

So:

```text
Code
 ↓
First error
 ↓
Fix
 ↓
Run again
 ↓
Next error
 ↓
Fix
 ↓
Run again
```

This idea begins preparing the learner for MT7.

But MT6 should not yet become the full debugging walkthrough.

---

# 16. MT6 One Program, Multiple Mistakes

The defining rule:

```text
ONE CODE SAMPLE
        +
MULTIPLE MISTAKES
```

For example:

```python
name = "Alice"
age = "20"

if age > 18
    print("Adult")

print(username)
```

Potential mistakes:

```text
01 — age is a string
02 — missing :
03 — indentation
04 — username is undefined
```

This is exactly the kind of content MT6 should teach.

---

# 17. MT6 Recommended Number of Mistakes

Recommended:

```text
3–6 mistakes
```

Ideal:

```text
4 mistakes
```

Avoid:

```text
15 mistakes
```

because the learner stops analyzing and starts hunting randomly.

---

# 18. MT6 Difficulty Levels

MT6 can support difficulty metadata.

### Beginner

```text
2–3 obvious mistakes
```

### Intermediate

```text
3–4 mixed mistakes
```

### Advanced

```text
4–6 interacting mistakes
```

Example:

```json
{
  "difficulty": "intermediate"
}
```

---

# 19. MT6 Mistake Types

A single MT6 scenario can intentionally mix:

```text
Syntax
Indentation
Naming
Type
Logic
API usage
Reference
Function
Data structure
Exception handling
```

For example:

```text
01 — Syntax
02 — Type
03 — Naming
04 — Logic
```

This teaches learners that real code can contain different categories of problems.

---

# 20. MT6 Mistake Map

A useful visual is a **mistake map**.

```text
┌─────────────────────────────────────┐
│ CODE                                │
│                                     │
│ 01  def calculate(a, b)             │
│ 02      result = a + b              │
│ 03  print(results)                  │
│ 04  return result                   │
└─────────────────────────────────────┘
```

Then:

```text
01 → Syntax
02 → Indentation
03 → Naming
04 → Structure
```

---

# 21. MT6 Code Annotation

Use subtle markers:

```text
def calculate(a, b)        ①
    result = a + b         ②
    print(results)         ③
return result              ④
```

Clicking/tapping `①` can reveal:

```text
MISTAKE 1
Missing colon.
```

This is useful for interactive MT6.

---

# 22. MT6 Complete Layout

```text
┌─────────────────────────────────────────────┐
│ MISTAKEBLOCK                                │
│ Multiple Mistakes                           │
├─────────────────────────────────────────────┤
│                                             │
│ Find all the mistakes in this program.      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                CODE                         │
│                                             │
│  ① def calculate(a, b)                     │
│  ② result = a + b                          │
│  ③ print(results)                           │
│  ④ return result                            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ MISTAKE MAP                                 │
│                                             │
│ ① Syntax                                    │
│ ② Indentation                               │
│ ③ Naming                                    │
│ ④ Structure                                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ CORRECTED CODE                              │
│                                             │
├─────────────────────────────────────────────┤
│ KEY TAKEAWAY                                │
└─────────────────────────────────────────────┘
```

---

# 23. MT6 Desktop Layout

A strong desktop layout:

```text
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│         CODE                 │       MISTAKE MAP            │
│                              │                              │
│ ① def calculate(a,b)         │ ① Missing colon              │
│ ② result = a + b             │ ② Wrong indentation          │
│ ③ print(results)             │ ③ Wrong variable name        │
│ ④ return result              │ ④ Return placement            │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘

                 ↓

          CORRECTED CODE
```

This makes MT6 feel like an investigation.

---

# 24. MT6 Mobile Layout

```text
CODE

┌────────────────────────┐
│ ① def calculate(...)   │
│ ② result = a + b       │
│ ③ print(results)       │
│ ④ return result        │
└────────────────────────┘

        ↓

MISTAKE 1
Missing colon

MISTAKE 2
Indentation

MISTAKE 3
Wrong variable

MISTAKE 4
Return placement

        ↓

CORRECTED CODE
```

---

# 25. MT6 Interactive Mode

MT6 is an excellent candidate for interaction.

The learner could click lines:

```text
① ② ③ ④
```

to identify mistakes.

Example:

```text
Which lines contain mistakes?

☐ 1
☐ 2
☐ 3
☐ 4
```

After submission:

```text
Your answer: 1, 3
Correct:     1, 2, 3, 4
```

Then reveal explanations.

---

# 26. MT6 "Find the Mistakes"

The core interaction:

```text
┌───────────────────────────────────┐
│ FIND THE MISTAKES                 │
│                                   │
│ Select every line you believe     │
│ contains a mistake.               │
│                                   │
│ [ 1 ] [ 2 ] [ 3 ] [ 4 ]          │
│                                   │
│         [ Check Answer ]          │
└───────────────────────────────────┘
```

This is more educational than simply showing the answers.

---

# 27. MT6 Progressive Reveal

Recommended sequence:

```text
STEP 1
Show broken program
```

↓

```text
STEP 2
Learner identifies mistakes
```

↓

```text
STEP 3
Reveal mistake markers
```

↓

```text
STEP 4
Explain each mistake
```

↓

```text
STEP 5
Reveal corrected program
```

↓

```text
STEP 6
Show expected result
```

This is approaching debugging workflow, but remains a **single MT6 exercise**.

---

# 28. MT6 Mistake Explanation

After identification:

```text
01 — Missing colon

Why:
Python requires a colon after the function
parameter list.

Fix:
Add `:`.
```

Then:

```text
02 — Indentation

Why:
The function body must be indented.

Fix:
Indent `result = a + b`.
```

And so on.

Each individual explanation resembles MT2, but the **overall presentation is multiple mistakes**.

---

# 29. MT6 Important Distinction

MT6 can contain MT2-style explanations internally.

For example:

```text
Mistake 1
   ↓
Why
   ↓
Correction

Mistake 2
   ↓
Why
   ↓
Correction
```

But the **block-level presentation remains**:

> **Multiple Mistakes**

That is what makes MT6 a separate version.

---

# 30. MT6 Error Ordering

Mistakes should preferably be ordered by debugging relevance.

For example:

```text
01 — Syntax
02 — Structure
03 — Naming
04 — Logic
```

rather than random order.

This helps learners understand that some problems must be corrected before others can even be observed.

---

# 31. MT6 Dependency Visualization

Example:

```text
SyntaxError
    │
    ▼
Fix syntax
    │
    ▼
Program runs
    │
    ▼
NameError
    │
    ▼
Fix variable name
    │
    ▼
Wrong output
    │
    ▼
Fix logic
```

This is useful, but keep it concise.

A full process belongs to MT7.

---

# 32. MT6 Example — Multiple Data Structure Mistakes

```python
users = ["Alice", "Bob"]

print(users[2])

users.add("Charlie")

print(user)
```

Mistakes:

```text
01 — Invalid index
02 — list has no add()
03 — user vs users
```

Corrected:

```python
users = ["Alice", "Bob"]

print(users[1])

users.append("Charlie")

print(users)
```

This is a clean MT6 example.

---

# 33. MT6 Example — Multiple Function Mistakes

```python
def calculate(a, b)
result = a + b
print(results)

return result
```

Mistakes:

```text
01 — Missing colon
02 — Indentation
03 — Wrong variable name
04 — return placement
```

Corrected:

```python
def calculate(a, b):
    result = a + b
    print(result)
    return result
```

---

# 34. MT6 Example — Multiple Conceptual Mistakes

```python
a = [1, 2]
b = a

b = b.append(3)

print(a)
```

Potential mistakes:

```text
01 — Assuming b is independent
02 — Assuming append returns a list
03 — Expecting a unchanged
```

Correct approach:

```python
a = [1, 2]
b = a.copy()

b.append(3)

print(a)
```

This is an excellent advanced MT6 because the mistakes are conceptual rather than syntactic.

---

# 35. MT6 Mistake Categories UI

Optional badge:

```text
01  [SYNTAX]
02  [LOGIC]
03  [TYPE]
04  [NAMING]
```

Use the category as secondary information.

Do not create a different colour for every category.

---

# 36. MT6 Severity

Optional severity:

```text
BLOCKING
IMPORTANT
LOGICAL
CONCEPTUAL
```

For example:

```text
01  BLOCKING
Missing colon

02  IMPORTANT
Wrong variable

03  LOGICAL
Incorrect comparison
```

Again, this is secondary.

---

# 37. MT6 Corrected Code

After the learner identifies the mistakes:

```text
CORRECTED CODE
```

should appear as a complete coherent program.

Do not only show isolated corrections.

For example:

```python
def calculate(a, b):
    result = a + b
    print(result)
    return result
```

The learner needs to see the **final integrated state**.

---

# 38. MT6 Before/After Relationship

MT6 may contain:

```text
BROKEN CODE
      ↓
MULTIPLE CORRECTIONS
      ↓
WORKING CODE
```

MT5 was:

```text
BEFORE
      ↓
ONE DEBUGGING CHANGE
      ↓
AFTER
```

Therefore:

```text
MT5 = transformation
MT6 = multi-error analysis
```

---

# 39. MT6 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT6",
  "presentation": "Multiple Mistakes",

  "content": {

    "title": "",
    "context": "",

    "challenge": {
      "instruction": ""
    },

    "brokenCode": {
      "language": "python",
      "source": ""
    },

    "mistakes": [

      {
        "id": "01",
        "line": 1,
        "title": "",
        "category": "",
        "severity": "",

        "description": "",
        "why": "",

        "correction": {
          "code": "",
          "explanation": ""
        }
      }

    ],

    "correctedCode": {
      "language": "python",
      "source": ""
    },

    "result": {
      "type": "",
      "output": ""
    },

    "takeaway": ""
  }
}
```

---

# 40. MT6 Example JSON

```json
{
  "type": "mistake",
  "version": "MT6",
  "presentation": "Multiple Mistakes",

  "content": {

    "title": "Find the Mistakes",

    "context": "This program contains several mistakes. Identify and correct all of them.",

    "challenge": {
      "instruction": "Find every mistake before revealing the corrections."
    },

    "brokenCode": {
      "language": "python",
      "source": "def calculate(a, b)\nresult = a + b\nprint(results)\nreturn result"
    },

    "mistakes": [

      {
        "id": "01",
        "line": 1,
        "title": "Missing colon",
        "category": "syntax",
        "severity": "blocking",

        "description": "The function definition is missing its required colon.",

        "why": "Python requires a colon after the parameter list.",

        "correction": {
          "code": "def calculate(a, b):",
          "explanation": "Add the colon."
        }
      },

      {
        "id": "02",
        "line": 2,
        "title": "Incorrect indentation",
        "category": "indentation",
        "severity": "blocking",

        "description": "The function body is not indented.",

        "why": "Statements belonging to the function must be indented.",

        "correction": {
          "code": "    result = a + b",
          "explanation": "Indent the statement inside the function."
        }
      },

      {
        "id": "03",
        "line": 3,
        "title": "Incorrect variable name",
        "category": "naming",
        "severity": "important",

        "description": "The program uses results instead of result.",

        "why": "The variable that was created is named result.",

        "correction": {
          "code": "    print(result)",
          "explanation": "Use the defined variable name."
        }
      },

      {
        "id": "04",
        "line": 4,
        "title": "Return outside function",
        "category": "structure",
        "severity": "blocking",

        "description": "The return statement is outside the function body.",

        "why": "The return statement must belong to the function.",

        "correction": {
          "code": "    return result",
          "explanation": "Move return inside the function."
        }
      }

    ],

    "correctedCode": {
      "language": "python",
      "source": "def calculate(a, b):\n    result = a + b\n    print(result)\n    return result"
    },

    "result": {
      "type": "output",
      "output": "30"
    },

    "takeaway": "A program can contain multiple independent mistakes. Find and correct all of them."
  }
}
```

---

# 41. MT6 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "code-plus-mistake-map",

    "desktop": {
      "columns": 2
    },

    "mobile": {
      "columns": 1
    },

    "showLineMarkers": true,
    "showMistakeMap": true,
    "showCategories": false,
    "showSeverity": false,

    "interactiveIdentification": true,

    "showCorrections": "after-attempt",

    "showCorrectedCode": true,
    "showResult": true,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 42. MT6 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── challenge
│
├── broken-code
│   └── annotated lines
│
├── mistake-map
│   ├── mistake 01
│   ├── mistake 02
│   ├── mistake 03
│   └── ...
│
├── corrected-code
│
├── result
│
└── takeaway
```

---

# 43. MT6 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt6"
    data-block="mistake"
    data-version="MT6"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Multiple Mistakes
        </h2>

    </header>


    <p class="mistake-context">
        This program contains several mistakes.
        Can you find all of them?
    </p>


    <section class="mistake-challenge">

        <h3>
            Find the Mistakes
        </h3>

        <p>
            Identify every incorrect line before revealing
            the corrections.
        </p>

    </section>


    <section class="mistake-analysis">


        <article class="broken-code-card">

            <header>
                <span>
                    BROKEN CODE
                </span>
            </header>

            <pre><code>
def calculate(a, b)
result = a + b
print(results)

return result
            </code></pre>

        </article>


        <article class="mistake-map">

            <header>
                <span>
                    MISTAKE MAP
                </span>
            </header>


            <article class="mistake-item">

                <span class="mistake-number">
                    01
                </span>

                <h4>
                    Missing colon
                </h4>

                <p>
                    Add the required colon to the
                    function definition.
                </p>

            </article>


            <article class="mistake-item">

                <span class="mistake-number">
                    02
                </span>

                <h4>
                    Incorrect indentation
                </h4>

                <p>
                    Indent the function body.
                </p>

            </article>


            <article class="mistake-item">

                <span class="mistake-number">
                    03
                </span>

                <h4>
                    Wrong variable name
                </h4>

                <p>
                    Use result instead of results.
                </p>

            </article>


            <article class="mistake-item">

                <span class="mistake-number">
                    04
                </span>

                <h4>
                    Return placement
                </h4>

                <p>
                    Move return inside the function.
                </p>

            </article>

        </article>

    </section>


    <section class="corrected-code-card">

        <header>
            <span>
                CORRECTED CODE
            </span>
        </header>

        <pre><code>
def calculate(a, b):
    result = a + b
    print(result)
    return result
        </code></pre>

    </section>


    <section class="result-card">

        <header>
            <span>
                RESULT
            </span>
        </header>

        <p>
            30
        </p>

    </section>


    <aside class="mistake-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Finding one mistake does not mean the program
            contains no other problems.
        </p>

    </aside>

</section>
```

---

# 44. MT6 Visual Identity

MT6 should feel like a **code investigation**.

The visual hierarchy:

```text
BROKEN CODE
     ↓
MISTAKE MARKERS
     ↓
MISTAKE MAP
     ↓
CORRECTED CODE
     ↓
RESULT
```

This is different from the simpler MT4 checklist.

---

# 45. MT6 Colour Usage

Use:

### `#F54A8D`

For:

* mistake numbers
* highlighted problematic lines
* selected lines
* correction markers
* transition arrows

### `#0B1B3D`

For:

* code
* headings
* structure
* explanations
* borders

Keep the design light.

No gradient.

No dark theme.

---

# 46. MT6 Interactive Code Selection

A particularly strong implementation:

```text
1  def calculate(a, b)
2  result = a + b
3  print(results)
4  return result
```

Learner clicks:

```text
1
2
3
4
```

Selected lines become:

```text
① ② ③ ④
```

Then:

```text
[ Check Mistakes ]
```

The system compares selected mistake IDs with the correct set.

---

# 47. MT6 Feedback

If incorrect:

> You found 3 of 4 mistakes. Look again at the function body.

If correct:

> Excellent. You identified all 4 mistakes.

Then reveal the explanations.

This keeps the block educational rather than merely evaluative.

---

# 48. MT6 Progressive Reveal

Ideal flow:

```text
BROKEN CODE
      ↓
FIND MISTAKES
      ↓
SUBMIT
      ↓
MISTAKE MAP
      ↓
CORRECTIONS
      ↓
CORRECTED CODE
      ↓
RESULT
```

This is a natural bridge toward MT7.

---

# 49. MT6 Difficulty Progression

### MT6 Beginner

```text
3 obvious syntax/formatting mistakes
```

### MT6 Intermediate

```text
4 mixed syntax + logic + naming mistakes
```

### MT6 Advanced

```text
5 interacting conceptual/runtime mistakes
```

Example:

```text
Syntax
+
Reference
+
Type
+
Logic
+
API
```

---

# 50. MT6 Important Pedagogical Rule

Do not make every mistake equally obvious.

A good MT6 scenario can include:

```text
2 obvious mistakes
+
1 moderate mistake
+
1 conceptual mistake
```

This teaches deeper code reading.

But the block must still be fair: every mistake should be inferable from the supplied code/context.

---

# 51. MT6 Multiple Errors vs Multiple Mistakes

These terms should not be treated as identical.

A program may contain:

```text
3 mistakes
```

but only produce:

```text
1 error
```

at first execution.

For example:

```text
SyntaxError
```

may prevent later errors from being observed.

MT6 can teach this distinction:

> **A program can contain multiple problems even when only one error is visible at a time.**

This is a very important debugging concept.

---

# 52. MT6 Error Discovery Order

A useful optional component:

```text
DISCOVERY ORDER

01 → Fix syntax
02 → Run again
03 → Fix name
04 → Run again
05 → Fix logic
```

But keep this limited.

A full procedural explanation belongs to MT7.

---

# 53. MT6 Relationship With MT7

This is the critical boundary:

### MT6

```text
Here is broken code.

Find all the mistakes.
```

### MT7

```text
Here is a problem.

Let's debug it step by step.
```

Therefore:

```text
MT6 = MULTI-ERROR ANALYSIS

MT7 = DEBUGGING PROCESS
```

---

# 54. MT6 Relationship With MT8

MT8 will eventually combine:

```text
Error recognition
+
Diagnosis
+
Debugging process
+
Prevention
+
Best practices
+
Verification
```

MT6 does not attempt to do that.

It focuses only on:

> **Multiple mistakes in one scenario.**

---

# 55. MT6 Final Mental Model

```text
              BROKEN PROGRAM
                     │
                     ▼
          ┌────────────────────┐
          │ FIND ALL PROBLEMS  │
          └─────────┬──────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   Mistake 1    Mistake 2    Mistake 3
       │            │            │
       └────────────┼────────────┘
                    ▼
              APPLY FIXES
                    │
                    ▼
              CORRECT PROGRAM
                    │
                    ▼
              EXPECTED RESULT
```

---

# 56. MT1 → MT6 Evolution

The complete progression now looks like:

```text
MT1
Mistake → Correction
```

```text
MT2
Incorrect → Why → Correct
```

```text
MT3
Error Message → Cause → Fix
```

```text
MT4
Common Beginner Mistakes
```

```text
MT5
Before → Change → After
```

```text
MT6
Multiple Mistakes
      ↓
Find
      ↓
Explain
      ↓
Correct
```

The pedagogical progression is:

```text
FIX
 ↓
UNDERSTAND
 ↓
DIAGNOSE
 ↓
PREVENT
 ↓
TRANSFORM
 ↓
ANALYZE MULTIPLE PROBLEMS
```

---

# 57. MT6 Final Technical Specification

| Area                              | MT6 Decision                                    |
| --------------------------------- | ----------------------------------------------- |
| **Block**                         | **MistakeBlock**                                |
| **Version**                       | **MT6**                                         |
| **Presentation**                  | **Multiple Mistakes**                           |
| **Primary purpose**               | Identify multiple problems in one code scenario |
| **Broken code**                   | **Required**                                    |
| **Mistake count**                 | **3–6 recommended**                             |
| **Mistake map**                   | **Required**                                    |
| **Individual explanations**       | Recommended                                     |
| **Corrected code**                | **Required**                                    |
| **Result**                        | Recommended                                     |
| **Interactive identification**    | Recommended                                     |
| **Line markers**                  | Recommended                                     |
| **Multiple independent examples** | ❌ MT4                                           |
| **Before/After transformation**   | ❌ MT5                                           |
| **Full debugging workflow**       | ❌ MT7                                           |
| **Complete guide**                | ❌ MT8                                           |
| **Primary**                       | **#F54A8D**                                     |
| **Secondary**                     | **#0B1B3D**                                     |
| **Theme**                         | Light                                           |
| **Gradient**                      | ❌                                               |
| **Dark theme**                    | ❌                                               |
| **A4**                            | Portrait                                        |
| **Desktop**                       | Code + Mistake Map                              |
| **Mobile**                        | Stacked                                         |
| **JSON-driven**                   | ✅                                               |
| **Responsive**                    | ✅                                               |
| **Accessible**                    | ✅                                               |
| **Interactive**                   | ✅ Recommended                                   |

---

# 58. MistakeBlock Progress

| Version | Presentation                | Status         |
| ------- | --------------------------- | -------------- |
| MT1     | Mistake → Correction        | ✅              |
| MT2     | Incorrect → Why → Correct   | ✅              |
| MT3     | Error Message → Cause → Fix | ✅              |
| MT4     | Common Beginner Mistakes    | ✅              |
| MT5     | Before / After Debugging    | ✅              |
| **MT6** | **Multiple Mistakes**       | ✅ **COMPLETE** |
| **MT7** | **Debugging Walkthrough**   | ⏳ **NEXT**     |
| MT8     | Complete Debugging Guide    | ⏳              |

## MT6 is now complete.

The next committed version is:

> **MT7 — Debugging Walkthrough**.



```python

```

# BLOCK 9 — MistakeBlock

## MT7 — Debugging Walkthrough

Yes. We now continue with the **next committed version**, keeping your exact MistakeBlock sequence unchanged.

| Version | Presentation                | Status         |
| ------- | --------------------------- | -------------- |
| MT1     | Mistake → Correction        | ✅              |
| MT2     | Incorrect → Why → Correct   | ✅              |
| MT3     | Error Message → Cause → Fix | ✅              |
| MT4     | Common Beginner Mistakes    | ✅              |
| MT5     | Before / After Debugging    | ✅              |
| MT6     | Multiple Mistakes           | ✅              |
| **MT7** | **Debugging Walkthrough**   | 🔵 **CURRENT** |
| MT8     | Complete Debugging Guide    | ⏳              |

---

# 1. What Is MT7?

MT7 is the first MistakeBlock version that teaches the learner **the debugging process itself**.

MT6 asked:

> **“Can you find all the mistakes?”**

MT7 asks:

> **“How do you systematically debug this program?”**

The learner follows a sequence:

```text
PROBLEM
   ↓
OBSERVE
   ↓
IDENTIFY
   ↓
FORM HYPOTHESIS
   ↓
INSPECT
   ↓
TEST
   ↓
FIX
   ↓
VERIFY
```

That sequence is the defining identity of **MT7**.

---

# 2. MT7 Core Mental Model

```text
                 BUG / FAILURE
                       │
                       ▼
                 01 — OBSERVE
                       │
                       ▼
                 02 — REPRODUCE
                       │
                       ▼
                 03 — IDENTIFY
                       │
                       ▼
                 04 — HYPOTHESIZE
                       │
                       ▼
                 05 — INSPECT
                       │
                       ▼
                 06 — TEST
                       │
                       ▼
                 07 — FIX
                       │
                       ▼
                 08 — VERIFY
```

The learner is not simply shown the answer.

They are shown **how an experienced developer approaches the problem**.

---

# 3. MT7 Primary Learning Goal

MT7 teaches a reusable debugging methodology.

The learner should understand:

> **Debugging is a structured investigation, not random code changing.**

The progression is:

```text
See the problem
      ↓
Understand the symptom
      ↓
Reproduce it
      ↓
Locate the likely cause
      ↓
Test the hypothesis
      ↓
Apply the smallest appropriate fix
      ↓
Run again
      ↓
Verify the result
```

---

# 4. MT7 Difference From MT6

This distinction must remain strict.

### MT6 — Multiple Mistakes

```text
Broken Code
     ↓
Find Mistake 1
Find Mistake 2
Find Mistake 3
Find Mistake 4
     ↓
Correct Code
```

### MT7 — Debugging Walkthrough

```text
Broken Code
     ↓
Observe symptom
     ↓
Investigate
     ↓
Form hypothesis
     ↓
Test
     ↓
Fix
     ↓
Verify
```

Therefore:

> **MT6 teaches multi-error identification.**

> **MT7 teaches the debugging process.**

---

# 5. MT7 Difference From MT8

MT7 should teach **one complete debugging walkthrough**.

MT8 will eventually become:

> **Complete Debugging Guide**

MT8 can combine multiple debugging patterns, strategies, tools, principles, checklists and scenarios.

MT7 is narrower:

```text
ONE PROBLEM
     ↓
ONE COMPLETE WALKTHROUGH
```

MT8:

```text
DEBUGGING KNOWLEDGE SYSTEM
     ↓
MULTIPLE METHODS
     ↓
MULTIPLE SCENARIOS
     ↓
COMPLETE GUIDE
```

---

# 6. MT7 Hero

Recommended:

## Debugging Walkthrough

Supporting text:

> Follow the debugging process step by step—from observing the problem to verifying the fix.

Hero visual:

```text
┌──────────────┐
│    BUG       │
└──────┬───────┘
       ↓
   INVESTIGATE
       ↓
      TEST
       ↓
      FIX
       ↓
    VERIFY ✓
```

The visual should communicate **process**, not just error.

---

# 7. MT7 Signature Component

The defining component is a **debugging timeline**.

```text
01
OBSERVE
   │
   ▼
02
REPRODUCE
   │
   ▼
03
IDENTIFY
   │
   ▼
04
HYPOTHESIZE
   │
   ▼
05
INSPECT
   │
   ▼
06
TEST
   │
   ▼
07
FIX
   │
   ▼
08
VERIFY
```

This should be the visual backbone of MT7.

---

# 8. MT7 Example Scenario

Let's use a simple Python function.

The user reports:

> "The function is returning `None` instead of the expected result."

Code:

```python
def add(a, b):
    a + b

result = add(10, 20)

print(result)
```

Observed output:

```text
None
```

Expected:

```text
30
```

Now we walk through the debugging process.

---

# 9. MT7 Step 1 — Observe

### OBSERVE THE SYMPTOM

The program runs successfully, but produces:

```text
None
```

instead of:

```text
30
```

Important:

> There is no syntax error.

> There is no runtime exception.

The problem is **incorrect behavior**.

---

# 10. MT7 Step 2 — Reproduce

Run the program again:

```python
def add(a, b):
    a + b

result = add(10, 20)

print(result)
```

Output:

```text
None
```

The behavior is reproducible.

Therefore:

```text
Expected → 30
Actual   → None
```

This confirms that the problem is real and repeatable.

---

# 11. MT7 Step 3 — Identify

Now inspect the function.

```python
def add(a, b):
    a + b
```

The function calculates:

```text
a + b
```

But does not explicitly return it.

Potential cause:

```text
Expression evaluated
        ↓
No return
        ↓
Function returns None
```

---

# 12. MT7 Step 4 — Form a Hypothesis

The debugging hypothesis:

> **The function is returning `None` because the calculated value is not returned.**

This is important.

Do not immediately change the code.

First form a testable explanation.

```text
SYMPTOM
None

HYPOTHESIS
Missing return statement
```

---

# 13. MT7 Step 5 — Inspect

Inspect the function:

```python
def add(a, b):
    a + b
```

Compare it with the expected function behavior:

```text
calculate value
      ↓
return value
```

The code currently does:

```text
calculate value
      ↓
stop
```

The missing operation is:

```text
return
```

---

# 14. MT7 Step 6 — Test the Hypothesis

Temporarily change:

```python
a + b
```

to:

```python
return a + b
```

Now run again.

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

The hypothesis is supported.

---

# 15. MT7 Step 7 — Fix

The final correction:

```python
def add(a, b):
    return a + b
```

This is the smallest appropriate fix.

The important teaching point:

> **Do not rewrite unrelated code when one focused correction solves the problem.**

---

# 16. MT7 Step 8 — Verify

Run the complete program:

```python
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

Expected:

```text
30
```

Actual:

```text
30
```

Therefore:

```text
Expected = Actual
```

The bug is resolved.

---

# 17. MT7 Complete Walkthrough

The learner should see:

```text
┌─────────────────────────────────────┐
│ PROBLEM                             │
│ Expected 30, received None          │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 01 OBSERVE                          │
│ Identify the actual behavior        │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 02 REPRODUCE                        │
│ Run again and confirm the symptom   │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 03 IDENTIFY                         │
│ Inspect the relevant function       │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 04 HYPOTHESIZE                      │
│ Missing return causes None          │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 05 INSPECT                          │
│ Confirm the return is missing       │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 06 TEST                             │
│ Add return and run again            │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 07 FIX                              │
│ Keep the minimal correction         │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│ 08 VERIFY                           │
│ Expected 30 = Actual 30 ✓          │
└─────────────────────────────────────┘
```

This is the heart of MT7.

---

# 18. MT7 Step Anatomy

Every walkthrough step should contain:

```text
STEP NUMBER
     ↓
STEP TITLE
     ↓
WHAT WE OBSERVE / DO
     ↓
EVIDENCE
     ↓
CONCLUSION
```

Example:

```text
04
FORM A HYPOTHESIS

Observation:
The function calculates a value but does not return it.

Hypothesis:
The missing return causes None.
```

---

# 19. MT7 Debugging Timeline

A horizontal timeline can work on desktop:

```text
OBSERVE → REPRODUCE → IDENTIFY → HYPOTHESIZE
                                  ↓
VERIFY ← FIX ← TEST ← INSPECT
```

But for A4/mobile, a vertical timeline is better:

```text
01 Observe
   │
02 Reproduce
   │
03 Identify
   │
04 Hypothesize
   │
05 Inspect
   │
06 Test
   │
07 Fix
   │
08 Verify
```

---

# 20. MT7 Problem Card

Start with a clear problem card:

```text
┌──────────────────────────────────────┐
│ DEBUGGING CHALLENGE                 │
│                                      │
│ The function should return 30,       │
│ but the program prints None.         │
│                                      │
│ Expected: 30                         │
│ Actual:   None                       │
└──────────────────────────────────────┘
```

This establishes the debugging target.

---

# 21. MT7 Broken Code

Immediately below:

```python
def add(a, b):
    a + b

result = add(10, 20)

print(result)
```

Do not reveal the correction immediately.

The learner should see the problem first.

---

# 22. MT7 Evidence Panel

Useful:

```text
┌───────────────────────────────┐
│ OBSERVED                      │
│                               │
│ Actual output: None           │
│ Expected output: 30           │
└───────────────────────────────┘
```

This reinforces:

```text
Expected
   ≠
Actual
```

which is the foundation of debugging.

---

# 23. MT7 Hypothesis Panel

```text
┌────────────────────────────────────┐
│ HYPOTHESIS                         │
│                                    │
│ The function calculates the value  │
│ but never returns it.              │
└────────────────────────────────────┘
```

This is one of the most important pedagogical elements of MT7.

The learner should understand that debugging involves **hypotheses**, not guessing.

---

# 24. MT7 Inspection Panel

Show the relevant code:

```python
def add(a, b):
    a + b
```

Highlight:

```python
a + b
```

Then explain:

> The expression is evaluated, but the function does not return the value.

---

# 25. MT7 Test Panel

```text
TEST HYPOTHESIS

Change:

a + b

to:

return a + b
```

Then:

```text
Run again
```

Result:

```text
30
```

This confirms the hypothesis.

---

# 26. MT7 Fix Panel

The final corrected code:

```python
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

The fix should be visually distinct from the investigation.

---

# 27. MT7 Verification Panel

```text
┌──────────────────────────────────┐
│ VERIFICATION                     │
│                                  │
│ Expected: 30                     │
│ Actual:   30                     │
│                                  │
│ ✓ Bug resolved                   │
└──────────────────────────────────┘
```

The debugging story is now complete.

---

# 28. MT7 Another Example — IndexError

Problem:

```python
numbers = [10, 20, 30]

print(numbers[3])
```

Observed:

```text
IndexError
```

Walkthrough:

```text
01 Observe
IndexError occurs.

02 Reproduce
Run again → same error.

03 Identify
Problem occurs at numbers[3].

04 Hypothesize
Index is outside valid range.

05 Inspect
Valid indexes: 0, 1, 2.

06 Test
Try numbers[2].

07 Fix
Use numbers[2].

08 Verify
Output → 30.
```

This is a clean MT7 scenario.

---

# 29. MT7 Example — NameError

Problem:

```python
name = "Alice"

print(username)
```

Walkthrough:

```text
Observe
 ↓
NameError

Reproduce
 ↓
Same NameError

Identify
 ↓
Failure occurs at username

Hypothesize
 ↓
username was never defined

Inspect
 ↓
Only name exists

Test
 ↓
print(name)

Fix
 ↓
Use name

Verify
 ↓
Alice
```

---

# 30. MT7 Example — TypeError

Problem:

```python
age = 20

print("Age: " + age)
```

Observed:

```text
TypeError
```

Hypothesis:

> A string and integer are being combined using `+`.

Test:

```python
print("Age: " + str(age))
```

Verify:

```text
Age: 20
```

Again:

```text
Observe
→ Reproduce
→ Identify
→ Hypothesize
→ Inspect
→ Test
→ Fix
→ Verify
```

---

# 31. MT7 Example — Logical Bug

MT7 should also cover bugs that produce **no error message**.

Example:

```python
age = 25

if age < 18 or age > 60:
    print("Eligible")
```

Suppose the requirement is:

> People between 18 and 60 are eligible.

Observed:

```text
No output
```

Debugging:

```text
Observe
 ↓
25 should be eligible, but isn't.

Reproduce
 ↓
Same behavior.

Identify
 ↓
Condition is suspicious.

Hypothesize
 ↓
The logical operator is wrong.

Inspect
 ↓
or is used where and is required.

Test
 ↓
Replace with and.

Fix
 ↓
if age >= 18 and age <= 60:

Verify
 ↓
Eligible
```

This is important because debugging is **not only about exceptions**.

---

# 32. MT7 Example — Reference Bug

```python
items = [1, 2]

backup = items

backup.append(3)
```

Observed:

```text
items == [1, 2, 3]
```

Expected:

```text
items == [1, 2]
```

Debugging:

```text
Observe
 ↓
Original list changed unexpectedly.

Reproduce
 ↓
Same behavior.

Identify
 ↓
backup and items reference the same list.

Hypothesize
 ↓
Assignment did not create a copy.

Inspect
 ↓
backup = items

Test
 ↓
backup = items.copy()

Fix
 ↓
Use copy()

Verify
 ↓
Original list remains unchanged.
```

This is an excellent advanced MT7 example.

---

# 33. MT7 Debugging Evidence

A strong walkthrough should distinguish:

```text
OBSERVATION
```

from:

```text
INTERPRETATION
```

and:

```text
HYPOTHESIS
```

For example:

```text
Observation:
The function returns None.

Hypothesis:
The function is missing a return statement.

Test:
Add return and execute again.

Evidence:
The result becomes 30.
```

This teaches scientific debugging.

---

# 34. MT7 "Do Not Guess" Principle

A strong callout:

> **Don't change code randomly. Form a hypothesis and test it.**

Visual:

```text
❌ Guess → Change → Hope

✅ Observe → Hypothesize → Test → Fix
```

This should be one of the signature learning messages of MT7.

---

# 35. MT7 Minimal Fix Principle

Another important callout:

> **Fix the cause, not unrelated code.**

Example:

```text
Problem:
Missing return

❌ Rewrite entire function

✅ Add the missing return
```

This teaches controlled debugging.

---

# 36. MT7 Verification Principle

The walkthrough should never end at:

```text
Fix applied
```

It should end at:

```text
Fix applied
   ↓
Program executed again
   ↓
Expected behavior confirmed
```

Therefore:

> **A fix is not complete until it is verified.**

---

# 37. MT7 Debugging Loop

The process can also be represented as a loop:

```text
        ┌──────────────┐
        │    OBSERVE   │
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │   REPRODUCE  │
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │   HYPOTHESIZE│
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │     TEST     │
        └──────┬───────┘
               ↓
          Hypothesis
          confirmed?
          ↙       ↘
        NO         YES
        │           │
        ↓           ↓
   New hypothesis  FIX
        │           │
        └─────┐     ↓
              │   VERIFY
              │     │
              └─────┘
```

This is a more advanced MT7 visual.

---

# 38. MT7 Debugging Steps — Recommended Standard

To keep the Tutorial Engine consistent, use this canonical eight-step model:

| #      | Step            | Purpose                          |
| ------ | --------------- | -------------------------------- |
| **01** | **Observe**     | Understand the symptom           |
| **02** | **Reproduce**   | Confirm the behavior             |
| **03** | **Identify**    | Locate the suspicious area       |
| **04** | **Hypothesize** | Form a possible cause            |
| **05** | **Inspect**     | Gather supporting evidence       |
| **06** | **Test**        | Test the hypothesis              |
| **07** | **Fix**         | Apply the appropriate correction |
| **08** | **Verify**      | Confirm expected behavior        |

I recommend keeping these **stable across all MT7 content**.

---

# 39. MT7 Step Card

Each step:

```text
┌──────────────────────────────────┐
│ 04                               │
│ HYPOTHESIZE                      │
│                                  │
│ The missing return statement     │
│ may be causing None.             │
│                                  │
│ Evidence:                        │
│ The function calculates a value  │
│ but never returns it.            │
└──────────────────────────────────┘
```

This becomes a reusable component.

---

# 40. MT7 Step Number Visual

Use:

```text
①
②
③
④
⑤
⑥
⑦
⑧
```

or:

```text
01
02
03
04
05
06
07
08
```

I recommend **01–08** because it fits the project's structured tutorial style better.

---

# 41. MT7 Timeline Component

```text
01 ── Observe
 │
02 ── Reproduce
 │
03 ── Identify
 │
04 ── Hypothesize
 │
05 ── Inspect
 │
06 ── Test
 │
07 ── Fix
 │
08 ── Verify
```

On desktop, the line can become horizontal.

---

# 42. MT7 Desktop Layout

Recommended:

```text
┌─────────────────────────────────────────────────────┐
│ MISTAKEBLOCK                                        │
│ Debugging Walkthrough                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ DEBUGGING CHALLENGE                                 │
│ Expected: 30   Actual: None                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 01 Observe → 02 Reproduce → 03 Identify            │
│                                                     │
│ 04 Hypothesize → 05 Inspect → 06 Test              │
│                                                     │
│ 07 Fix → 08 Verify                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ CURRENT STEP                                        │
│                                                     │
│ Explanation + code + evidence                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ CORRECTED RESULT                                    │
└─────────────────────────────────────────────────────┘
```

---

# 43. MT7 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ MISTAKEBLOCK                         │
│ Debugging Walkthrough                │
├──────────────────────────────────────┤
│ DEBUGGING CHALLENGE                  │
│                                      │
│ Expected: 30                         │
│ Actual: None                         │
├──────────────────────────────────────┤
│                                      │
│ 01 OBSERVE                           │
│ │                                    │
│ ▼                                    │
│ 02 REPRODUCE                         │
│ │                                    │
│ ▼                                    │
│ 03 IDENTIFY                          │
│ │                                    │
│ ▼                                    │
│ 04 HYPOTHESIZE                       │
│ │                                    │
│ ▼                                    │
│ 05 INSPECT                           │
│ │                                    │
│ ▼                                    │
│ 06 TEST                              │
│ │                                    │
│ ▼                                    │
│ 07 FIX                               │
│ │                                    │
│ ▼                                    │
│ 08 VERIFY                            │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 44. MT7 Mobile Layout

Mobile should be naturally vertical:

```text
PROBLEM
  ↓
01 Observe
  ↓
02 Reproduce
  ↓
03 Identify
  ↓
04 Hypothesize
  ↓
05 Inspect
  ↓
06 Test
  ↓
07 Fix
  ↓
08 Verify
```

Each step can expand independently.

---

# 45. MT7 Interactive Mode

MT7 can support:

```text
[ Next Step → ]
```

The learner progresses through the debugging investigation.

For example:

```text
Step 01
Observe the symptom.

[ Next → ]
```

Then:

```text
Step 02
Reproduce the behavior.

[ Next → ]
```

and so on.

This creates a guided debugging experience.

---

# 46. MT7 Optional Decision Interaction

At the hypothesis stage:

```text
What is the most likely cause?

○ Missing return
○ Wrong argument
○ Invalid index
○ Wrong variable type
```

Then:

```text
[ Test Hypothesis ]
```

The system explains why the selected hypothesis is correct or incorrect.

This can turn MT7 into a highly effective learning block.

---

# 47. MT7 Code Highlighting

At each step, only the relevant code should be emphasized.

Example:

```python
def add(a, b):
    return a + b
```

During inspection:

```text
              ┌─────────────┐
              │ return a+b  │
              └─────────────┘
```

The rest of the code becomes visually secondary.

This reduces cognitive load.

---

# 48. MT7 Evidence Types

The data model should support different evidence types:

```text
Output
Error message
Stack trace
Code inspection
Variable value
Object state
Expected vs actual
Test result
```

Example:

```json
{
  "type": "output",
  "actual": "None",
  "expected": "30"
}
```

---

# 49. MT7 JSON Schema

```json
{
  "type": "mistake",
  "version": "MT7",
  "presentation": "Debugging Walkthrough",

  "content": {

    "title": "",
    "context": "",

    "problem": {
      "description": "",
      "expected": "",
      "actual": "",
      "code": {
        "language": "python",
        "source": ""
      }
    },

    "steps": [

      {
        "id": "01",
        "type": "observe",
        "title": "Observe",

        "description": "",

        "evidence": {
          "type": "",
          "content": ""
        }
      },

      {
        "id": "02",
        "type": "reproduce",
        "title": "Reproduce",

        "description": "",

        "evidence": {
          "type": "",
          "content": ""
        }
      }

    ],

    "fix": {
      "code": {
        "language": "python",
        "source": ""
      },
      "explanation": ""
    },

    "verification": {
      "expected": "",
      "actual": "",
      "status": "passed"
    },

    "takeaway": ""
  }
}
```

---

# 50. MT7 Example JSON

```json
{
  "type": "mistake",
  "version": "MT7",
  "presentation": "Debugging Walkthrough",

  "content": {

    "title": "Debugging a Function That Returns None",

    "context": "The function should return the sum of two numbers, but the program prints None.",

    "problem": {

      "description": "The function calculates the value but does not return it.",

      "expected": "30",
      "actual": "None",

      "code": {
        "language": "python",
        "source": "def add(a, b):\n    a + b\n\nresult = add(10, 20)\nprint(result)"
      }
    },

    "steps": [

      {
        "id": "01",
        "type": "observe",
        "title": "Observe",

        "description": "The program runs but produces None instead of 30.",

        "evidence": {
          "type": "output",
          "content": "None"
        }
      },

      {
        "id": "02",
        "type": "reproduce",
        "title": "Reproduce",

        "description": "Run the program again to confirm that the same behavior occurs.",

        "evidence": {
          "type": "output",
          "content": "None"
        }
      },

      {
        "id": "03",
        "type": "identify",
        "title": "Identify",

        "description": "Inspect the add() function because the unexpected value originates from the function call.",

        "evidence": {
          "type": "code",
          "content": "def add(a, b):\n    a + b"
        }
      },

      {
        "id": "04",
        "type": "hypothesize",
        "title": "Form a Hypothesis",

        "description": "The function may be missing a return statement.",

        "evidence": {
          "type": "reasoning",
          "content": "The expression is evaluated, but no value is explicitly returned."
        }
      },

      {
        "id": "05",
        "type": "inspect",
        "title": "Inspect",

        "description": "Confirm that the function contains no return statement.",

        "evidence": {
          "type": "code",
          "content": "a + b"
        }
      },

      {
        "id": "06",
        "type": "test",
        "title": "Test",

        "description": "Add return and execute the program again.",

        "evidence": {
          "type": "output",
          "content": "30"
        }
      },

      {
        "id": "07",
        "type": "fix",
        "title": "Fix",

        "description": "Keep the minimal correction: return the calculated value.",

        "evidence": {
          "type": "code",
          "content": "return a + b"
        }
      },

      {
        "id": "08",
        "type": "verify",
        "title": "Verify",

        "description": "Run the complete program and compare the actual result with the expected result.",

        "evidence": {
          "type": "comparison",
          "content": "Expected: 30 | Actual: 30"
        }
      }

    ],

    "fix": {

      "code": {
        "language": "python",
        "source": "def add(a, b):\n    return a + b\n\nresult = add(10, 20)\nprint(result)"
      },

      "explanation": "The function now explicitly returns the calculated sum."
    },

    "verification": {
      "expected": "30",
      "actual": "30",
      "status": "passed"
    },

    "takeaway": "Debug systematically: observe the symptom, form a hypothesis, test it, apply the smallest appropriate fix, and verify the result."
  }
}
```

---

# 51. MT7 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "debugging-timeline",

    "desktop": {
      "timeline": "horizontal",
      "content": "step-panel"
    },

    "tablet": {
      "timeline": "horizontal",
      "content": "step-panel"
    },

    "mobile": {
      "timeline": "vertical",
      "content": "stacked"
    },

    "showProblem": true,
    "showExpectedActual": true,
    "showEvidence": true,
    "showHypothesis": true,
    "showCodeHighlight": true,
    "showFix": true,
    "showVerification": true,

    "interactive": true,
    "progressiveReveal": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 52. MT7 Semantic Structure

```text
<section>
│
├── header
│
├── problem-card
│   ├── description
│   ├── expected
│   ├── actual
│   └── broken-code
│
├── debugging-timeline
│   │
│   ├── step-01 observe
│   ├── step-02 reproduce
│   ├── step-03 identify
│   ├── step-04 hypothesize
│   ├── step-05 inspect
│   ├── step-06 test
│   ├── step-07 fix
│   └── step-08 verify
│
├── corrected-code
│
├── verification
│
└── takeaway
```

---

# 53. MT7 Complete HTML

```html
<section
    class="tutorial-block mistake-block mistake-mt7"
    data-block="mistake"
    data-version="MT7"
>

    <header class="mistake-header">

        <span class="mistake-eyebrow">
            MISTAKEBLOCK
        </span>

        <h2 class="mistake-title">
            Debugging Walkthrough
        </h2>

        <p>
            Follow the debugging process from the
            first symptom to the verified fix.
        </p>

    </header>


    <section class="debug-problem">

        <span>
            DEBUGGING CHALLENGE
        </span>

        <h3>
            The function should return 30,
            but the program prints None.
        </h3>

        <div class="expected-actual">

            <div>
                <strong>EXPECTED</strong>
                <span>30</span>
            </div>

            <div>
                <strong>ACTUAL</strong>
                <span>None</span>
            </div>

        </div>

        <pre><code>
def add(a, b):
    a + b

result = add(10, 20)

print(result)
        </code></pre>

    </section>


    <section class="debugging-timeline">


        <article class="debug-step">

            <span class="step-number">01</span>

            <h3>Observe</h3>

            <p>
                The program runs but produces None
                instead of 30.
            </p>

        </article>


        <article class="debug-step">

            <span class="step-number">02</span>

            <h3>Reproduce</h3>

            <p>
                Run the program again and confirm
                the same behavior.
            </p>

        </article>


        <article class="debug-step">

            <span class="step-number">03</span>

            <h3>Identify</h3>

            <p>
                Inspect the add() function because
                the unexpected result comes from it.
            </p>

        </article>


        <article class="debug-step">

            <span class="step-number">04</span>

            <h3>Hypothesize</h3>

            <p>
                The function may be missing a
                return statement.
            </p>

        </article>


        <article class="debug-step">

            <span class="step-number">05</span>

            <h3>Inspect</h3>

            <p>
                Confirm that the function calculates
                a value but does not return it.
            </p>

        </article>


        <article class="debug-step">

            <span class="step-number">06</span>

            <h3>Test</h3>

            <p>
                Add return and run the program again.
            </p>

        </article>


        <article class="debug-step">

            <span class="step-number">07</span>

            <h3>Fix</h3>

            <pre><code>
def add(a, b):
    return a + b
            </code></pre>

        </article>


        <article class="debug-step">

            <span class="step-number">08</span>

            <h3>Verify</h3>

            <p>
                Expected: 30
                <br>
                Actual: 30
            </p>

        </article>


    </section>


    <section class="verification">

        <span>
            ✓ BUG RESOLVED
        </span>

        <p>
            The corrected function now returns
            the calculated value.
        </p>

    </section>


    <aside class="mistake-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Debug systematically. Observe the symptom,
            form a hypothesis, test it, fix the cause,
            and verify the result.
        </p>

    </aside>

</section>
```

---

# 54. MT7 Visual Identity

MT7 should look different from MT6.

### MT6 visual metaphor

```text
🔎 FIND THE MISTAKES
```

### MT7 visual metaphor

```text
🧭 FOLLOW THE DEBUGGING JOURNEY
```

Therefore MT7 needs:

* timeline
* numbered steps
* current-step indicator
* evidence
* hypothesis
* test
* verification

The design should communicate **movement through a process**.

---

# 55. MT7 Primary Visual Flow

```text
PROBLEM
   │
   ▼
OBSERVE
   │
   ▼
REPRODUCE
   │
   ▼
IDENTIFY
   │
   ▼
HYPOTHESIZE
   │
   ▼
INSPECT
   │
   ▼
TEST
   │
   ▼
FIX
   │
   ▼
VERIFY ✓
```

This should be the strongest visual element on the page.

---

# 56. MT7 Recommended Callouts

### Callout 1

> **Don't guess. Investigate.**

### Callout 2

> **A hypothesis should be testable.**

### Callout 3

> **Fix the cause, not the symptom.**

### Callout 4

> **Always verify the fix.**

These are highly reusable debugging principles.

---

# 57. MT7 Code Change Visual

Use a focused diff:

```diff
-    a + b
+    return a + b
```

Then explain:

```text
The expression was calculated but never
returned to the caller.
```

This makes the fix understandable.

---

# 58. MT7 Verification Visual

Use:

```text
EXPECTED
30

ACTUAL
30

        ✓
```

or:

```text
┌───────────────────────────────┐
│ EXPECTED        ACTUAL        │
│    30             30          │
│                               │
│          ✓ VERIFIED           │
└───────────────────────────────┘
```

This is preferable to simply saying "Fixed."

---

# 59. MT7 Accessibility

The complete walkthrough should make sense when read sequentially:

> Debugging Challenge.

> Expected: 30.

> Actual: None.

> Step 1: Observe...

> Step 2: Reproduce...

and so forth.

If interactive, every step should be keyboard accessible.

The timeline must not communicate meaning through colour alone.

---

# 60. MT7 Content Rules

### Rule 1

Start with a **real symptom**.

### Rule 2

Show **expected vs actual** whenever possible.

### Rule 3

Do not reveal the fix too early.

### Rule 4

Explain the hypothesis.

### Rule 5

Show evidence.

### Rule 6

Show the test.

### Rule 7

Apply the minimal fix.

### Rule 8

Always verify.

---

# 61. MT7 What Makes It Different

MT7 is the first MistakeBlock version where the learner learns:

```text
HOW TO THINK
```

rather than simply:

```text
WHAT IS WRONG?
```

That is the major pedagogical jump.

---

# 62. MT7 Final Mental Model

```text
               BUG
                │
                ▼
          WHAT HAPPENED?
                │
                ▼
          CAN I REPRODUCE?
                │
                ▼
          WHERE IS IT?
                │
                ▼
          WHY MIGHT IT HAPPEN?
                │
                ▼
          HOW CAN I TEST THAT?
                │
                ▼
          WHAT IS THE FIX?
                │
                ▼
          DOES IT WORK NOW?
                │
                ▼
               ✓
```

The learner should leave MT7 knowing:

> **Debugging is a repeatable investigation process.**

---

# 63. MT1 → MT7 Complete Progression

Your MistakeBlock versions now form a very strong progression:

```text
MT1
Mistake → Correction
```

↓

```text
MT2
Incorrect → Why → Correct
```

↓

```text
MT3
Error Message → Cause → Fix
```

↓

```text
MT4
Common Beginner Mistakes
```

↓

```text
MT5
Before → Change → After
```

↓

```text
MT6
Multiple Mistakes
```

↓

```text
MT7
Debugging Walkthrough
```

↓

```text
MT8
Complete Debugging Guide
```

The learning progression is:

```text
CORRECT
   ↓
UNDERSTAND
   ↓
DIAGNOSE
   ↓
PREVENT
   ↓
TRANSFORM
   ↓
ANALYZE
   ↓
DEBUG
   ↓
MASTER
```

---

# 64. MT7 Final Technical Specification

| Area                         | MT7 Decision               |
| ---------------------------- | -------------------------- |
| **Block**                    | **MistakeBlock**           |
| **Version**                  | **MT7**                    |
| **Presentation**             | **Debugging Walkthrough**  |
| **Primary purpose**          | Teach systematic debugging |
| **Problem statement**        | **Required**               |
| **Expected vs Actual**       | Recommended                |
| **Broken code**              | **Required**               |
| **Debugging steps**          | **Required**               |
| **Canonical steps**          | **8**                      |
| **Observe**                  | ✅                          |
| **Reproduce**                | ✅                          |
| **Identify**                 | ✅                          |
| **Hypothesize**              | ✅                          |
| **Inspect**                  | ✅                          |
| **Test**                     | ✅                          |
| **Fix**                      | ✅                          |
| **Verify**                   | ✅                          |
| **Evidence**                 | Recommended                |
| **Code highlighting**        | Recommended                |
| **Hypothesis testing**       | Recommended                |
| **Corrected code**           | Required                   |
| **Verification result**      | **Required**               |
| **Multiple mistakes focus**  | ❌ MT6                      |
| **Complete debugging guide** | ❌ MT8                      |
| **Primary**                  | **#F54A8D**                |
| **Secondary**                | **#0B1B3D**                |
| **Theme**                    | Light                      |
| **Gradient**                 | ❌                          |
| **Dark theme**               | ❌                          |
| **A4**                       | Portrait                   |
| **Desktop**                  | Timeline                   |
| **Mobile**                   | Vertical walkthrough       |
| **JSON-driven**              | ✅                          |
| **Responsive**               | ✅                          |
| **Accessible**               | ✅                          |
| **Interactive**              | ✅ Recommended              |

---

# 65. MistakeBlock Progress

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| MT1     | Mistake → Correction         | ✅              |
| MT2     | Incorrect → Why → Correct    | ✅              |
| MT3     | Error Message → Cause → Fix  | ✅              |
| MT4     | Common Beginner Mistakes     | ✅              |
| MT5     | Before / After Debugging     | ✅              |
| MT6     | Multiple Mistakes            | ✅              |
| **MT7** | **Debugging Walkthrough**    | ✅ **COMPLETE** |
| **MT8** | **Complete Debugging Guide** | ⏳ **NEXT**     |

## MT7 is now complete.

The next and final committed version of **MistakeBlock** is:

> **MT8 — Complete Debugging Guide**.



```python

```
