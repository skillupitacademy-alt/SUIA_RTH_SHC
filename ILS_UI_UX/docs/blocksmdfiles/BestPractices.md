# BLOCK 10 — BestPracticeBlock

## BP1 — Rule → Example

Yes. We now move to **Block #10**, following your committed 18-block sequence exactly.

Your locked BestPracticeBlock architecture is:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | **Rule → Example**           | 🔵 **CURRENT** |
| BP2     | Rule → Why                   | ⏳              |
| BP3     | Do / Don't                   | ⏳              |
| BP4     | Before / After               | ⏳              |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

---

# 1. What Is BP1?

**BP1 — Rule → Example** is the simplest BestPracticeBlock presentation.

Its purpose is to teach a learner:

> **What is the recommended practice, and what does it look like in actual code?**

The fundamental structure is:

```text
RULE
  ↓
EXAMPLE
```

Unlike MistakeBlock, BP1 is **not primarily about correcting errors**.

It is about establishing a **good coding habit or recommended practice**.

---

# 2. BP1 Core Mental Model

```text
┌──────────────────────────────┐
│            RULE              │
│                              │
│ State the recommended        │
│ programming practice.        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│           EXAMPLE            │
│                              │
│ Show the rule being applied  │
│ in realistic code.           │
└──────────────────────────────┘
```

The learner should immediately understand:

> **“This is the practice I should follow, and this is how it looks.”**

---

# 3. BP1 Position in BestPracticeBlock

The seven versions intentionally increase in depth:

```text
BP1
Rule → Example
```

↓

```text
BP2
Rule → Why
```

↓

```text
BP3
Do / Don't
```

↓

```text
BP4
Before / After
```

↓

```text
BP5
Best Practices Checklist
```

↓

```text
BP6
Industry / FAANG Practices
```

↓

```text
BP7
Complete Best-Practice Guide
```

So BP1 should **not** explain everything.

Its job is to establish a practice through a concise rule and concrete example.

---

# 4. BP1 Primary Learning Objective

The learner should be able to recognize:

```text
Recommended Practice
        ↓
Concrete Implementation
```

For example:

> **Use descriptive variable names.**

```python
student_count = 25
```

The learner immediately sees the rule being applied.

---

# 5. BP1 What BP1 Should NOT Become

### ❌ BP2

Don't spend a large section explaining **why** the rule exists.

That is BP2.

### ❌ BP3

Don't show extensive:

```text
DO
DON'T
```

comparisons.

That is BP3.

### ❌ BP4

Don't build a complete:

```text
BEFORE → AFTER
```

transformation.

That is BP4.

### ❌ BP5

Don't turn it into a checklist of ten practices.

That is BP5.

### ❌ BP6

Don't discuss company-specific engineering standards.

That is BP6.

### ❌ BP7

Don't make it a complete best-practice reference.

That is BP7.

BP1 remains:

> **One rule → one or more concrete examples.**

---

# 6. BP1 Hero

Recommended title:

# Rule → Example

Supporting text:

> Learn a recommended programming practice and see how it is applied in real code.

Hero visual:

```text
┌─────────────────────┐
│        RULE         │
│                     │
│ Use descriptive     │
│ variable names.     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│       EXAMPLE       │
│                     │
│ student_count = 25  │
└─────────────────────┘
```

The arrow represents:

> **Principle → Application**

---

# 7. BP1 Basic Example

## Rule

> **Use descriptive names for variables.**

### Example

```python
student_count = 25
```

Instead of:

```python
x = 25
```

The primary BP1 lesson is simply:

```text
RULE
Use descriptive names.

↓

EXAMPLE
student_count = 25
```

The detailed reasoning belongs to BP2.

---

# 8. BP1 Example — Functions

## Rule

> **Give functions names that describe what they do.**

Example:

```python
def calculate_average(scores):
    return sum(scores) / len(scores)
```

The function name:

```text
calculate_average
```

communicates the function's purpose.

The BP1 presentation should remain concise.

---

# 9. BP1 Example — Constants

## Rule

> **Use named constants for important fixed values.**

Example:

```python
MAX_RETRIES = 3
```

Instead of scattering:

```python
if attempts < 3:
    ...
```

throughout the program.

Again, BP1 focuses on:

```text
RULE
  ↓
VISIBLE IMPLEMENTATION
```

---

# 10. BP1 Example — Avoid Repeated Logic

## Rule

> **Reuse logic instead of duplicating it.**

Example:

```python
def calculate_total(price, tax):
    return price + tax
```

Then:

```python
total = calculate_total(price, tax)
```

rather than duplicating the calculation in several places.

---

# 11. BP1 Example — Validate Input

## Rule

> **Validate external input before using it.**

Example:

```python
age = int(input("Enter your age: "))

if age < 0:
    raise ValueError("Age cannot be negative")
```

The learner sees the recommended practice directly.

---

# 12. BP1 Example — Handle Exceptions Specifically

## Rule

> **Catch specific exceptions instead of using a broad catch unnecessarily.**

Example:

```python
try:
    value = int(user_input)
except ValueError:
    print("Please enter a valid number.")
```

The rule and implementation are immediately connected.

---

# 13. BP1 Example — Keep Functions Focused

## Rule

> **Keep a function focused on one clear responsibility.**

Example:

```python
def calculate_total(items):
    return sum(items)
```

The function has a clear purpose.

---

# 14. BP1 Example — Avoid Magic Numbers

## Rule

> **Replace unexplained numeric literals with meaningful constants.**

Example:

```python
MAX_LOGIN_ATTEMPTS = 3
```

Then:

```python
if attempts >= MAX_LOGIN_ATTEMPTS:
    lock_account()
```

This is a very suitable BP1 pattern.

---

# 15. BP1 Example — Use Early Validation

## Rule

> **Reject invalid input early.**

Example:

```python
def withdraw(balance, amount):

    if amount <= 0:
        raise ValueError("Amount must be positive")

    if amount > balance:
        raise ValueError("Insufficient balance")

    return balance - amount
```

The learner sees the practice without requiring a long theoretical explanation.

---

# 16. BP1 Example — Use `with` for Resources

## Rule

> **Use context managers when working with resources that need cleanup.**

Example:

```python
with open("data.txt") as file:
    content = file.read()
```

This is better presented as a concrete application of the rule.

---

# 17. BP1 Rule Card

The Rule component should be reusable.

```text
┌────────────────────────────────────┐
│ BEST PRACTICE                      │
│                                    │
│ Use descriptive variable names.   │
└────────────────────────────────────┘
```

Recommended components:

```text
Label
+
Rule title
+
Rule statement
```

---

# 18. BP1 Example Card

Immediately below:

```text
┌────────────────────────────────────┐
│ EXAMPLE                            │
├────────────────────────────────────┤
│                                    │
│ student_count = 25                 │
│                                    │
└────────────────────────────────────┘
```

Optionally:

```text
Why this follows the rule:

The variable name communicates
what the value represents.
```

However, keep the explanation short.

A detailed **Why** section belongs to BP2.

---

# 19. BP1 Rule → Example Flow

The signature layout:

```text
┌─────────────────────────────┐
│ RULE                        │
│                             │
│ Use descriptive names.      │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ EXAMPLE                     │
│                             │
│ student_count = 25          │
└─────────────────────────────┘
```

This should be immediately recognizable as BestPracticeBlock.

---

# 20. BP1 Desktop Layout

Recommended:

```text
┌────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                  │
│ Rule → Example                                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌─────────────────────┐     ┌────────────────────┐ │
│ │ RULE                │  →  │ EXAMPLE            │ │
│ │                     │     │                    │ │
│ │ Use descriptive     │     │ student_count = 25 │ │
│ │ variable names.     │     │                    │ │
│ └─────────────────────┘     └────────────────────┘ │
│                                                    │
│ TAKEAWAY                                           │
└────────────────────────────────────────────────────┘
```

The desktop version can use a horizontal relationship.

---

# 21. BP1 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Rule → Example                       │
├──────────────────────────────────────┤
│                                      │
│ RULE                                 │
│ ┌──────────────────────────────────┐ │
│ │ Use descriptive variable names. │ │
│ └──────────────────────────────────┘ │
│                                      │
│                ↓                     │
│                                      │
│ EXAMPLE                              │
│ ┌──────────────────────────────────┐ │
│ │ student_count = 25               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ TAKEAWAY                             │
└──────────────────────────────────────┘
```

---

# 22. BP1 Mobile Layout

```text
┌──────────────────────────┐
│ RULE                     │
│                          │
│ Use descriptive names.  │
└──────────────────────────┘

            ↓

┌──────────────────────────┐
│ EXAMPLE                  │
│                          │
│ student_count = 25       │
└──────────────────────────┘
```

The relationship remains obvious.

---

# 23. BP1 Example With Multiple Code Lines

BP1 does not have to be limited to one line.

Example:

## Rule

> **Keep related validation close to the operation it protects.**

Example:

```python
def withdraw(balance, amount):

    if amount <= 0:
        raise ValueError("Amount must be positive")

    if amount > balance:
        raise ValueError("Insufficient funds")

    return balance - amount
```

The important principle is still:

```text
RULE
   ↓
EXAMPLE
```

---

# 24. BP1 Example With Comments

Comments can be used sparingly:

```python
MAX_RETRIES = 3

for attempt in range(MAX_RETRIES):
    connect()
```

Rule:

> **Give important configuration values meaningful names.**

The code itself demonstrates the rule.

---

# 25. BP1 Multiple Examples

A BP1 block can optionally have:

```text
ONE RULE
   ↓
Example 1
Example 2
Example 3
```

For example:

### Rule

> **Use descriptive names.**

### Example 1

```python
student_count = 25
```

### Example 2

```python
average_score = 87.5
```

### Example 3

```python
max_retry_count = 3
```

This is useful when one rule applies across multiple contexts.

---

# 26. BP1 Multiple Examples Rule

Keep it controlled.

Recommended:

```text
1 rule
+
1 primary example
+
0–2 supporting examples
```

Avoid:

```text
1 rule
+
10 unrelated examples
```

That starts becoming BP7-level content.

---

# 27. BP1 Example Context

A good example should contain enough context to understand the practice.

Instead of:

```python
x = 25
```

prefer:

```python
student_count = 25
```

The learner should understand **what the code represents**.

---

# 28. BP1 Example Quality

A good example is:

* realistic
* short
* directly related to the rule
* technically correct
* understandable
* relevant to the current tutorial topic

Avoid examples that require unrelated concepts.

---

# 29. BP1 Code Highlight

If only one line demonstrates the practice:

```python
student_count = 25
average_score = 87.5
```

Highlight:

```text
student_count
```

rather than highlighting the entire code block.

This keeps the learning focus precise.

---

# 30. BP1 Optional "Applied Here" Indicator

A small annotation can be useful:

```text
┌────────────────────────────┐
│ ✓ RULE APPLIED HERE        │
│                            │
│ student_count = 25         │
└────────────────────────────┘
```

This makes the relationship explicit.

---

# 31. BP1 Example Transformation

Another useful visual:

```text
RULE
Use meaningful names.

        ↓

APPLICATION

student_count = 25
```

Not:

```text
BAD → GOOD
```

because that belongs more naturally to BP4.

---

# 32. BP1 Rule Categories

The data model can support categories:

```text
Naming
Functions
Structure
Readability
Error Handling
Validation
Performance
Security
Testing
Maintainability
Resource Management
```

But categories should remain metadata unless the tutorial specifically needs them.

---

# 33. BP1 Example — Security

## Rule

> **Never hard-code secrets in source code.**

Example:

```python
api_key = os.environ["API_KEY"]
```

This is a strong BestPracticeBlock example.

BP1 simply establishes:

```text
RULE
Don't hard-code secrets.

↓

EXAMPLE
Read the secret from configuration/environment.
```

A deeper security discussion would belong elsewhere.

---

# 34. BP1 Example — Testing

## Rule

> **Test behavior at the boundary of the function's responsibility.**

Example:

```python
def add(a, b):
    return a + b
```

Test:

```python
assert add(2, 3) == 5
```

Again:

```text
Rule → Example
```

---

# 35. BP1 Example — Readability

## Rule

> **Prefer clear code over unnecessarily clever code.**

Example:

```python
if user.is_active:
    send_notification(user)
```

The example demonstrates clarity directly.

---

# 36. BP1 Example — Input Validation

## Rule

> **Validate assumptions at boundaries.**

Example:

```python
def set_age(age):
    if age < 0:
        raise ValueError("Age cannot be negative")

    return age
```

This makes the practice concrete.

---

# 37. BP1 Example — Resource Management

## Rule

> **Let resource ownership determine cleanup responsibility.**

Example:

```python
with open("data.txt") as file:
    data = file.read()
```

The code demonstrates the recommended practice.

---

# 38. BP1 Rule Component JSON

```json
{
  "rule": {
    "title": "Use descriptive variable names",
    "statement": "Choose names that clearly communicate what a value represents.",
    "category": "readability"
  }
}
```

---

# 39. BP1 Example Component JSON

```json
{
  "example": {
    "language": "python",
    "source": "student_count = 25",
    "highlight": [
      "student_count"
    ]
  }
}
```

---

# 40. BP1 Complete JSON Schema

```json
{
  "type": "bestPractice",
  "version": "BP1",
  "presentation": "Rule → Example",

  "content": {

    "title": "",
    "context": "",

    "rule": {
      "title": "",
      "statement": "",
      "category": ""
    },

    "example": {
      "language": "python",
      "source": "",
      "highlight": [],
      "explanation": ""
    },

    "supportingExamples": [],

    "takeaway": ""
  }
}
```

---

# 41. BP1 Complete Example JSON

```json
{
  "type": "bestPractice",
  "version": "BP1",
  "presentation": "Rule → Example",

  "content": {

    "title": "Use Descriptive Variable Names",

    "context": "Clear names make code easier to understand.",

    "rule": {
      "title": "Use descriptive variable names",
      "statement": "Choose names that clearly communicate what a value represents.",
      "category": "readability"
    },

    "example": {
      "language": "python",
      "source": "student_count = 25",
      "highlight": [
        "student_count"
      ],
      "explanation": "The name communicates that the value represents the number of students."
    },

    "supportingExamples": [
      {
        "language": "python",
        "source": "average_score = 87.5"
      },
      {
        "language": "python",
        "source": "max_retry_count = 3"
      }
    ],

    "takeaway": "Prefer names that communicate intent."
  }
}
```

---

# 42. BP1 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "rule-example",

    "desktop": {
      "direction": "horizontal"
    },

    "tablet": {
      "direction": "vertical"
    },

    "mobile": {
      "direction": "vertical"
    },

    "showCategory": false,
    "showExplanation": true,
    "showSupportingExamples": false,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 43. BP1 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── rule-card
│   ├── category
│   ├── title
│   └── statement
│
├── relationship-arrow
│
├── example-card
│   ├── code
│   ├── highlight
│   └── explanation
│
├── supporting-examples
│
└── takeaway
```

---

# 44. BP1 Complete HTML

```html
<section
    class="tutorial-block best-practice-block best-practice-bp1"
    data-block="bestPractice"
    data-version="BP1"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Rule → Example
        </h2>

        <p>
            Learn a recommended practice and see
            how it is applied in code.
        </p>

    </header>


    <p class="best-practice-context">
        Clear variable names make code easier
        to understand and maintain.
    </p>


    <section class="rule-example-flow">


        <article class="rule-card">

            <header>
                <span>
                    RULE
                </span>
            </header>

            <h3>
                Use descriptive variable names
            </h3>

            <p>
                Choose names that clearly communicate
                what a value represents.
            </p>

        </article>


        <div class="flow-arrow">
            ↓
        </div>


        <article class="example-card">

            <header>
                <span>
                    EXAMPLE
                </span>
            </header>

            <pre><code>
student_count = 25
            </code></pre>

            <p>
                The variable name communicates what
                the value represents.
            </p>

        </article>

    </section>


    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Prefer names that communicate intent.
        </p>

    </aside>

</section>
```

---

# 45. BP1 Desktop Three-Column Option

For wider screens, a three-part layout is also useful:

```text
┌────────────────────┬───────┬──────────────────────┐
│ RULE               │  →    │ EXAMPLE              │
│                    │       │                      │
│ Use descriptive    │       │ student_count = 25   │
│ variable names.    │       │                      │
└────────────────────┴───────┴──────────────────────┘
```

The center should remain visually lightweight.

The rule and example cards should dominate.

---

# 46. BP1 A4 Visual Design

Recommended:

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Rule → Example                       │
├──────────────────────────────────────┤
│                                      │
│ BEST PRACTICE                        │
│                                      │
│ Use descriptive variable names.      │
│                                      │
│                  ↓                   │
│                                      │
│ EXAMPLE                              │
│                                      │
│ student_count = 25                   │
│                                      │
│ The name communicates intent.        │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
│ Prefer names that communicate intent.│
└──────────────────────────────────────┘
```

---

# 47. BP1 Mobile Design

```text
BESTPRACTICEBLOCK

RULE

Use descriptive
variable names.

        ↓

EXAMPLE

student_count = 25

        ↓

TAKEAWAY

Prefer names that
communicate intent.
```

Simple and highly readable.

---

# 48. BP1 Visual Identity

BP1 should visually communicate:

```text
GOOD PRACTICE
      ↓
APPLICATION
```

not:

```text
ERROR
      ↓
FIX
```

That distinction is critical because MistakeBlock and BestPracticeBlock should feel like different educational systems.

---

# 49. MistakeBlock vs BestPracticeBlock

### MistakeBlock

```text
Problem
  ↓
Understand
  ↓
Correct
```

### BestPracticeBlock

```text
Recommended Practice
  ↓
Apply
```

Therefore:

```text
MistakeBlock = correction-oriented

BestPracticeBlock = practice-oriented
```

---

# 50. BP1 Relationship With CodeBlock

CodeBlock teaches:

> **How code works.**

BestPracticeBlock teaches:

> **How code should preferably be written.**

Example:

```text
CodeBlock
"How does this function work?"

BestPracticeBlock
"How should I structure this function?"
```

This distinction should remain throughout the architecture.

---

# 51. BP1 Relationship With MistakeBlock

MistakeBlock:

```text
❌ Something is wrong.
```

BestPracticeBlock:

```text
✓ This is a recommended way to write it.
```

A practice can exist even when violating it does not immediately produce an error.

For example:

```python
x = 25
```

may work correctly.

But:

```python
student_count = 25
```

is often more maintainable.

That is a **best practice**, not necessarily a bug correction.

---

# 52. BP1 Example Categories

BP1 can support:

| Category        | Example                         |
| --------------- | ------------------------------- |
| Naming          | `student_count`                 |
| Functions       | `calculate_average()`           |
| Readability     | Clear control flow              |
| Validation      | Validate input                  |
| Error Handling  | Catch specific exceptions       |
| Security        | Environment-based secrets       |
| Testing         | Add focused tests               |
| Performance     | Avoid unnecessary repeated work |
| Resources       | Use context managers            |
| Maintainability | Reuse common logic              |

---

# 53. BP1 Content Rule

The strongest BP1 formula is:

```text
ONE RULE
+
ONE STRONG EXAMPLE
+
ONE SHORT TAKEAWAY
```

Optional:

```text
+ 1–2 supporting examples
```

This keeps BP1 lightweight.

---

# 54. BP1 Quality Checklist

Before accepting a BP1 instance:

```text
□ Is there one clearly stated rule?

□ Is the rule actionable?

□ Does the example directly demonstrate it?

□ Is the example technically correct?

□ Is the example relevant to the current topic?

□ Is the code concise?

□ Can the learner understand the relationship immediately?

□ Have we avoided turning it into BP2/BP3/BP4?
```

---

# 55. BP1 Anti-Pattern

Avoid:

```text
RULE
Use good coding practices.

EXAMPLE
500 lines of code.

EXPLANATION
10 paragraphs.

CHECKLIST
15 items.

WHY
8 paragraphs.

BEFORE/AFTER
3 examples.
```

That would destroy BP1's identity.

Instead:

```text
RULE
One precise practice.

↓

EXAMPLE
One focused implementation.
```

---

# 56. BP1 Optional "Applied Practice" Badge

A subtle badge can reinforce the connection:

```text
✓ RULE APPLIED
```

For example:

```text
┌────────────────────────────────┐
│ EXAMPLE                        │
│                                │
│ student_count = 25             │
│                                │
│ ✓ RULE APPLIED                 │
└────────────────────────────────┘
```

This is optional.

---

# 57. BP1 Complete Learning Flow

```text
Learner encounters practice
        ↓
Reads rule
        ↓
Sees implementation
        ↓
Connects principle to code
        ↓
Can reuse practice elsewhere
```

That is the complete BP1 learning loop.

---

# 58. BP1 Final Mental Model

```text
             BEST PRACTICE
                   │
                   ▼
                 RULE
                   │
                   │
                   ▼
                EXAMPLE
                   │
                   ▼
             APPLY THE IDEA
```

The learner should leave thinking:

> **“I know the rule, and I can recognize what applying it looks like.”**

---

# 59. BestPracticeBlock Progress

We have now started Block #10 exactly according to your committed architecture:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | **Rule → Example**           | ✅ **COMPLETE** |
| **BP2** | **Rule → Why**               | ⏳ **NEXT**     |
| BP3     | Do / Don't                   | ⏳              |
| BP4     | Before / After               | ⏳              |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

## BP1 is complete.

The next committed version is:

> **BP2 — Rule → Why**.



```python

```

# BLOCK 10 — BestPracticeBlock

## BP2 — Rule → Why

Yes. We continue with the **next committed BestPracticeBlock version**.

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| BP1     | Rule → Example               | ✅              |
| **BP2** | **Rule → Why**               | 🔵 **CURRENT** |
| BP3     | Do / Don't                   | ⏳              |
| BP4     | Before / After               | ⏳              |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

---

# 1. What Is BP2?

**BP2 — Rule → Why** teaches not only **what the recommended practice is**, but **why the learner should follow it**.

Its fundamental structure is:

```text
RULE
  ↓
WHY
```

The learner should move from:

> **“I am told to do this.”**

to:

> **“I understand why this is a good practice.”**

That distinction is the entire purpose of BP2.

---

# 2. BP1 vs BP2

This distinction must remain strict.

### BP1

```text
RULE
  ↓
EXAMPLE
```

Example:

> Use descriptive variable names.

```python
student_count = 25
```

### BP2

```text
RULE
  ↓
WHY
```

Example:

> Use descriptive variable names.

**Why?**

> Because the name communicates intent and makes the code easier to understand and maintain.

The concrete implementation remains secondary in BP2.

---

# 3. BP2 Core Mental Model

```text
┌──────────────────────────────┐
│            RULE              │
│                              │
│ Use descriptive variable     │
│ names.                       │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│             WHY              │
│                              │
│ Clear names communicate      │
│ intent and reduce cognitive  │
│ effort when reading code.    │
└──────────────────────────────┘
```

The arrow means:

> **Recommended practice → Reason**

---

# 4. BP2 Primary Learning Objective

The learner should understand the **engineering reasoning behind a best practice**.

The progression is:

```text
RULE
 ↓
REASON
 ↓
BENEFIT
 ↓
BETTER DECISION
```

For example:

```text
Use descriptive names
        ↓
Names communicate intent
        ↓
Code becomes easier to understand
        ↓
Future maintenance becomes easier
```

---

# 5. BP2 What BP2 Should NOT Become

### ❌ BP1

Do not make the example the primary teaching element.

### ❌ BP3

Do not create:

```text
DO
DON'T
```

comparisons.

### ❌ BP4

Do not create:

```text
BEFORE
   ↓
AFTER
```

transformations.

### ❌ BP5

Do not create a long checklist.

### ❌ BP6

Do not discuss FAANG/company engineering standards yet.

### ❌ BP7

Do not create the complete best-practice knowledge system.

BP2 should remain:

> **One rule → its reasoning.**

---

# 6. BP2 Hero

Recommended title:

# Rule → Why

Supporting text:

> Understand the reasoning behind recommended programming practices.

Hero visual:

```text
┌──────────────────────┐
│         RULE         │
│                      │
│ Use descriptive      │
│ variable names.      │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│         WHY          │
│                      │
│ Names communicate    │
│ intent clearly.      │
└──────────────────────┘
```

---

# 7. BP2 Example — Variable Names

## RULE

> **Use descriptive variable names.**

## WHY

> Descriptive names communicate intent, making code easier to read, understand, debug, and maintain.

Mental model:

```text
student_count
     ↓
Meaning is immediately visible
     ↓
Less mental effort
     ↓
Better maintainability
```

Notice that the example itself is not the main focus.

---

# 8. BP2 Example — Functions

## RULE

> **Give functions names that describe what they do.**

## WHY

A descriptive function name allows a developer to understand the function's purpose without immediately reading its implementation.

```text
calculate_average()
       ↓
Purpose is visible
       ↓
Caller understands intent
```

---

# 9. BP2 Example — Avoid Magic Numbers

## RULE

> **Replace unexplained magic numbers with named constants.**

## WHY

A named constant gives the value semantic meaning and makes future changes easier.

```text
3
↓
What does 3 mean?

MAX_RETRY_COUNT = 3
↓
Meaning is explicit
```

This is an excellent BP2 presentation.

---

# 10. BP2 Example — Specific Exception Handling

## RULE

> **Catch specific exceptions when you know which failure you expect.**

## WHY

Specific exception handling prevents unrelated failures from being silently swallowed and makes the program's error-handling intent clearer.

Mental model:

```text
Specific failure
      ↓
Specific handling
      ↓
Clearer behavior
      ↓
Easier debugging
```

---

# 11. BP2 Example — Validate Input

## RULE

> **Validate external input before using it.**

## WHY

External input cannot automatically be assumed to satisfy the program's expectations.

Therefore:

```text
External Input
      ↓
Validation
      ↓
Trusted Assumption
      ↓
Processing
```

This reduces unexpected states.

---

# 12. BP2 Example — Small Focused Functions

## RULE

> **Keep functions focused on one clear responsibility.**

## WHY

A focused function is easier to:

* understand
* test
* reuse
* modify
* debug

Mental model:

```text
One clear responsibility
        ↓
Smaller reasoning scope
        ↓
Easier maintenance
```

---

# 13. BP2 Example — Avoid Duplicated Logic

## RULE

> **Avoid duplicating the same logic in multiple places.**

## WHY

Duplicated logic creates multiple locations that must be updated when behavior changes.

```text
Duplicated logic
      ↓
Multiple copies
      ↓
Multiple maintenance points
      ↓
Higher inconsistency risk
```

The best practice reduces that maintenance burden.

---

# 14. BP2 Example — Context Managers

## RULE

> **Use context managers for resources that require cleanup.**

## WHY

The context manager provides a structured ownership and cleanup mechanism, reducing the chance that a resource remains open or improperly managed.

Example can be shown only as supporting evidence:

```python
with open("data.txt") as file:
    content = file.read()
```

But the **why** remains the central content.

---

# 15. BP2 Example — Tests

## RULE

> **Write tests for important behavior.**

## WHY

Tests provide repeatable evidence that expected behavior continues to work when the code changes.

Mental model:

```text
Expected behavior
       ↓
Test
       ↓
Repeatable verification
       ↓
Safer changes
```

---

# 16. BP2 Example — Environment-Based Secrets

## RULE

> **Do not hard-code secrets in source code.**

## WHY

Source code is often shared, committed, backed up, or exposed to other systems. Keeping secrets outside source code reduces the risk of accidentally exposing credentials.

Mental model:

```text
Secret
 ↓
External configuration
 ↓
Application reads secret
 ↓
Source code contains no credential
```

---

# 17. BP2 Rule Card

The Rule card should remain visually dominant.

```text
┌──────────────────────────────────┐
│ BEST PRACTICE                    │
│                                  │
│ Use descriptive variable names. │
└──────────────────────────────────┘
```

Recommended components:

```text
Category
+
Rule title
+
Rule statement
```

---

# 18. BP2 Why Card

Immediately underneath:

```text
┌──────────────────────────────────┐
│ WHY?                             │
│                                  │
│ Descriptive names communicate    │
│ intent and make code easier to   │
│ understand and maintain.         │
└──────────────────────────────────┘
```

The **WHY?** label should be visually unmistakable.

---

# 19. BP2 Reasoning Flow

A strong BP2 instance can use:

```text
RULE
 ↓
WHY IT MATTERS
 ↓
ENGINEERING BENEFIT
```

Example:

```text
Use descriptive names
        ↓
They communicate intent
        ↓
Developers understand code faster
```

This is deeper than merely showing an example.

---

# 20. BP2 Desktop Layout

```text
┌────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                  │
│ Rule → Why                                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────────────────┐      ┌──────────────────┐ │
│ │ RULE                 │  →   │ WHY?             │ │
│ │                      │      │                  │ │
│ │ Use descriptive      │      │ Names communicate│ │
│ │ variable names.      │      │ intent.          │ │
│ └──────────────────────┘      └──────────────────┘ │
│                                                    │
│              KEY TAKEAWAY                          │
└────────────────────────────────────────────────────┘
```

---

# 21. BP2 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Rule → Why                           │
├──────────────────────────────────────┤
│                                      │
│ RULE                                 │
│                                      │
│ Use descriptive variable names.      │
│                                      │
│                ↓                     │
│                                      │
│ WHY?                                 │
│                                      │
│ Descriptive names communicate        │
│ intent and reduce cognitive effort.  │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 22. BP2 Mobile Layout

```text
BESTPRACTICEBLOCK

RULE

Use descriptive
variable names.

        ↓

WHY?

Descriptive names
communicate intent
and improve
maintainability.

        ↓

TAKEAWAY
```

The relationship remains linear.

---

# 23. BP2 "Why" Types

The data model should support different reasoning categories.

```text
why:
  readability
  maintainability
  correctness
  reliability
  testability
  security
  performance
  scalability
  debuggability
  consistency
```

Example:

```json
{
  "type": "maintainability",
  "reason": "Named constants make future changes easier."
}
```

---

# 24. BP2 Reasoning Depth

The "Why" should normally have **three levels** available.

### Level 1 — Simple

> Clear names make code easier to read.

### Level 2 — Engineering

> Clear names communicate intent and reduce the mental effort required to understand the code.

### Level 3 — Advanced

> Explicit intent reduces ambiguity across maintenance, debugging, code review, and future modification.

The content author chooses the appropriate depth for the learner.

---

# 25. BP2 Example — Readability

```text
RULE
Use descriptive names.

WHY
A reader should not have to infer what
an unexplained variable represents.
```

This teaches a useful principle:

> **Good code communicates intent.**

---

# 26. BP2 Example — Maintainability

```text
RULE
Avoid duplicated logic.

WHY
When behavior changes, duplicated implementations
create multiple places that must be updated.
```

Mental model:

```text
One implementation
      ↓
One maintenance point
```

versus:

```text
Three implementations
      ↓
Three maintenance points
```

---

# 27. BP2 Example — Testability

```text
RULE
Keep functions focused.

WHY
A focused function usually has a smaller,
more predictable behavior surface, making
it easier to test independently.
```

This connects best practice to engineering consequences.

---

# 28. BP2 Example — Debuggability

```text
RULE
Use meaningful variable names.

WHY
During debugging, clear names make variable
state easier to interpret.
```

This is especially relevant because BP2 follows MistakeBlock in the architecture.

---

# 29. BP2 Example — Reliability

```text
RULE
Validate input at system boundaries.

WHY
Invalid assumptions entering the system can
propagate into unexpected states deeper in
the application.
```

Mental model:

```text
Untrusted input
      ↓
Validation
      ↓
Known state
      ↓
Safer processing
```

---

# 30. BP2 Example — Security

```text
RULE
Keep secrets outside source code.

WHY
Source code can be committed, shared, or exposed.
Separating secrets reduces accidental credential exposure.
```

This makes the security rationale explicit without becoming BP6.

---

# 31. BP2 Example — Performance

```text
RULE
Avoid unnecessary repeated computation.

WHY
Repeated work consumes additional CPU time
without improving the result.
```

The exact performance explanation should remain appropriate to the tutorial topic.

---

# 32. BP2 Example — Scalability

```text
RULE
Avoid unnecessary coupling between components.

WHY
Tightly coupled components become harder to change
independently as the system grows.
```

This gives the learner architectural reasoning.

---

# 33. BP2 Optional Example

Unlike BP1, the code example is **supporting content**.

Structure:

```text
RULE
 ↓
WHY
 ↓
OPTIONAL EXAMPLE
```

For example:

```text
RULE
Use a named constant for configuration.

WHY
The name communicates the meaning of the value
and gives one place to update it.

EXAMPLE
MAX_RETRY_COUNT = 3
```

The example supports the reasoning rather than becoming the main presentation.

---

# 34. BP2 Complete JSON Schema

```json
{
  "type": "bestPractice",
  "version": "BP2",
  "presentation": "Rule → Why",

  "content": {

    "title": "",
    "context": "",

    "rule": {
      "title": "",
      "statement": "",
      "category": ""
    },

    "why": {
      "summary": "",
      "reasoning": "",
      "benefits": [],
      "type": ""
    },

    "example": {
      "enabled": true,
      "language": "python",
      "source": "",
      "explanation": ""
    },

    "takeaway": ""
  }
}
```

---

# 35. BP2 Complete Example JSON

```json
{
  "type": "bestPractice",
  "version": "BP2",
  "presentation": "Rule → Why",

  "content": {

    "title": "Use Descriptive Variable Names",

    "context": "Good names make the intent of code easier to understand.",

    "rule": {
      "title": "Use descriptive variable names",
      "statement": "Choose names that clearly communicate what a value represents.",
      "category": "readability"
    },

    "why": {
      "summary": "Descriptive names communicate intent.",
      "reasoning": "A reader can understand what a value represents without having to infer its meaning from surrounding code.",
      "benefits": [
        "Improves readability",
        "Reduces cognitive effort",
        "Makes debugging easier",
        "Improves maintainability"
      ],
      "type": "readability"
    },

    "example": {
      "enabled": true,
      "language": "python",
      "source": "student_count = 25",
      "explanation": "The variable name communicates what the value represents."
    },

    "takeaway": "Good names communicate intent."
  }
}
```

---

# 36. BP2 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "rule-why",

    "desktop": {
      "direction": "horizontal"
    },

    "tablet": {
      "direction": "vertical"
    },

    "mobile": {
      "direction": "vertical"
    },

    "showCategory": false,
    "showBenefits": true,
    "showExample": true,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 37. BP2 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── rule-card
│   ├── title
│   └── statement
│
├── relationship-arrow
│
├── why-card
│   ├── summary
│   ├── reasoning
│   └── benefits
│
├── optional-example
│
└── takeaway
```

---

# 38. BP2 HTML

```html
<section
    class="tutorial-block best-practice-block best-practice-bp2"
    data-block="bestPractice"
    data-version="BP2"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Rule → Why
        </h2>

        <p>
            Understand the reasoning behind
            recommended programming practices.
        </p>

    </header>


    <p class="best-practice-context">
        Good names make the intent of code easier
        to understand.
    </p>


    <section class="rule-why-flow">


        <article class="rule-card">

            <header>
                <span>RULE</span>
            </header>

            <h3>
                Use descriptive variable names
            </h3>

            <p>
                Choose names that clearly communicate
                what a value represents.
            </p>

        </article>


        <div class="flow-arrow">
            ↓
        </div>


        <article class="why-card">

            <header>
                <span>WHY?</span>
            </header>

            <h3>
                Descriptive names communicate intent.
            </h3>

            <p>
                A reader can understand what a value
                represents without having to infer
                its meaning from surrounding code.
            </p>

            <ul>

                <li>
                    Improves readability
                </li>

                <li>
                    Reduces cognitive effort
                </li>

                <li>
                    Makes debugging easier
                </li>

                <li>
                    Improves maintainability
                </li>

            </ul>

        </article>

    </section>


    <section class="supporting-example">

        <span>
            EXAMPLE
        </span>

        <pre><code>
student_count = 25
        </code></pre>

    </section>


    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Good names communicate intent.
        </p>

    </aside>

</section>
```

---

# 39. BP2 Visual Hierarchy

The hierarchy should be:

```text
1. RULE
       ↓
2. WHY?
       ↓
3. BENEFITS
       ↓
4. OPTIONAL EXAMPLE
       ↓
5. TAKEAWAY
```

The learner should understand the **reason** before being distracted by implementation details.

---

# 40. BP2 Rule → Why Relationship

A strong visual can use:

```text
RULE
───────────────
What should I do?

        ↓

WHY?
───────────────
Why should I do it?
```

This creates a clear cognitive relationship.

---

# 41. BP2 "Why" Card Design

Recommended:

```text
┌──────────────────────────────────────┐
│ WHY THIS MATTERS                     │
├──────────────────────────────────────┤
│                                      │
│ Clear names communicate intent and   │
│ make code easier to understand.     │
│                                      │
│ ✓ Readability                        │
│ ✓ Debuggability                      │
│ ✓ Maintainability                    │
│                                      │
└──────────────────────────────────────┘
```

The checkmarks are optional; don't use them if the content doesn't represent benefits.

---

# 42. BP2 A4 Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Rule → Why                           │
├──────────────────────────────────────┤
│                                      │
│ RULE                                 │
│                                      │
│ Use descriptive variable names.      │
│                                      │
│                ↓                     │
│                                      │
│ WHY THIS MATTERS                     │
│                                      │
│ Descriptive names communicate        │
│ intent and reduce cognitive effort.  │
│                                      │
│ • Better readability                 │
│ • Easier debugging                   │
│ • Better maintenance                 │
│                                      │
│                ↓                     │
│                                      │
│ EXAMPLE                              │
│                                      │
│ student_count = 25                   │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 43. BP2 Mobile Layout

```text
RULE

Use descriptive variable names.

        ↓

WHY?

Descriptive names communicate
intent and reduce cognitive effort.

        ↓

BENEFITS

• Readability
• Debuggability
• Maintainability

        ↓

EXAMPLE

student_count = 25
```

---

# 44. BP2 Content Rules

### Rule 1

There must be **one primary practice**.

### Rule 2

The "Why" must directly explain that practice.

### Rule 3

The reasoning should be technically accurate.

### Rule 4

Benefits should follow logically from the reason.

### Rule 5

Examples are optional and secondary.

### Rule 6

Don't turn BP2 into BP7.

---

# 45. BP2 "Why" Quality Test

Ask:

> If I remove the rule, does the explanation still clearly describe why the practice exists?

If yes, the reasoning is probably strong.

Weak:

> This is a good practice because it is recommended.

Strong:

> Descriptive names communicate intent, reducing the effort required to understand and maintain the code.

---

# 46. BP2 Bad Reasoning

Avoid circular explanations:

```text
RULE
Use descriptive names.

WHY
Because descriptive names are best practice.
```

That explains nothing.

Instead:

```text
RULE
Use descriptive names.

WHY
They communicate intent and reduce ambiguity
for developers reading the code.
```

---

# 47. BP2 Engineering Reasoning Model

A reusable model:

```text
RULE
 ↓
PROBLEM IT ADDRESSES
 ↓
MECHANISM
 ↓
BENEFIT
```

Example:

```text
Use named constants
       ↓
Unexplained literals create ambiguity
       ↓
Names attach meaning to values
       ↓
Code becomes easier to understand/change
```

This is an excellent internal content-authoring pattern.

---

# 48. BP2 Example — One Rule, Multiple Benefits

```text
RULE
Keep functions focused.

WHY
A focused function has a smaller responsibility.

BENEFITS
├── Easier to understand
├── Easier to test
├── Easier to reuse
└── Easier to modify
```

This is appropriate for BP2.

---

# 49. BP2 Relationship to BP3

BP2:

```text
RULE
 ↓
WHY
```

BP3:

```text
DO
 ↓
DON'T
```

Therefore BP2 explains **reasoning**, while BP3 explains **contrast**.

Example:

### BP2

> Use descriptive names.

**Why?**

> They communicate intent.

### BP3

```text
DO
student_count = 25

DON'T
x = 25
```

Both teach the same broader practice but use different pedagogical mechanisms.

---

# 50. BP2 Relationship to BP4

BP4 will show:

```text
BEFORE
 ↓
AFTER
```

BP2 should not depend on transformation.

BP2's core question is:

> **Why is this recommended?**

BP4's core question is:

> **What does improvement look like?**

---

# 51. BP2 Relationship to BP5

BP5 will combine multiple practices:

```text
□ Practice 1
□ Practice 2
□ Practice 3
...
```

BP2 remains:

```text
One practice
+
One reason
```

---

# 52. BP2 Relationship to BP6

BP6 will answer questions such as:

> How is this practice used in professional/industry engineering environments?

BP2 only establishes the conceptual reasoning.

---

# 53. BP2 Relationship to BP7

BP7 will combine:

```text
Rules
Reasons
Do / Don't
Before / After
Checklists
Industry practices
Examples
```

BP2 should remain intentionally narrow.

---

# 54. BP2 Accessibility

The visual relationship must not depend only on:

```text
Pink = Rule
Blue = Why
```

Use explicit labels:

```text
RULE
WHY?
```

The content must remain understandable in:

* grayscale
* screen readers
* keyboard navigation
* mobile layouts

---

# 55. BP2 Interaction

BP2 does not require complex interaction.

Optional:

```text
[ Show Example ]
```

or:

```text
[ Expand reasoning ]
```

But the core content should be fully understandable without interaction.

---

# 56. BP2 Final Mental Model

```text
             BEST PRACTICE
                    │
                    ▼
                  RULE
                    │
                    ▼
                  WHY?
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     Readability  Safety   Reliability
          │         │         │
          └─────────┼─────────┘
                    ▼
             BETTER DECISION
```

The learner should finish BP2 thinking:

> **“Now I understand why this practice matters.”**

---

# 57. BP2 Final Technical Specification

| Area                | BP2 Decision                        |
| ------------------- | ----------------------------------- |
| **Block**           | **BestPracticeBlock**               |
| **Version**         | **BP2**                             |
| **Presentation**    | **Rule → Why**                      |
| **Primary purpose** | Explain reasoning behind a practice |
| **Rule**            | Required                            |
| **Why**             | **Required**                        |
| **Reasoning**       | Required                            |
| **Benefits**        | Recommended                         |
| **Example**         | Optional / secondary                |
| **Before/After**    | ❌                                   |
| **Do/Don't**        | ❌                                   |
| **Checklist**       | ❌                                   |
| **Industry/FAANG**  | ❌                                   |
| **Complete Guide**  | ❌                                   |
| **Theme**           | Light                               |
| **Primary**         | **#F54A8D**                         |
| **Secondary**       | **#0B1B3D**                         |
| **Gradient**        | ❌                                   |
| **Dark theme**      | ❌                                   |
| **A4**              | Portrait                            |
| **Desktop**         | Horizontal Rule → Why               |
| **Mobile**          | Vertical                            |
| **JSON-driven**     | ✅                                   |
| **Responsive**      | ✅                                   |
| **Accessible**      | ✅                                   |

---

# 58. BestPracticeBlock Progress

Your committed architecture now stands at:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | Rule → Example               | ✅ Complete     |
| **BP2** | Rule → Why                   | ✅ **Complete** |
| **BP3** | Do / Don't                   | ⏳ **NEXT**     |
| BP4     | Before / After               | ⏳              |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

## BP2 is complete.

The next committed version is:

> **BP3 — Do / Don't**.



```python

```

# BLOCK 10 — BestPracticeBlock

## BP3 — Do / Don't

Yes. We now continue with the **next committed BestPracticeBlock version**.

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| BP1     | Rule → Example               | ✅              |
| BP2     | Rule → Why                   | ✅              |
| **BP3** | **Do / Don't**               | 🔵 **CURRENT** |
| BP4     | Before / After               | ⏳              |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

---

# 1. What Is BP3?

**BP3 — Do / Don't** teaches a best practice through direct contrast.

Its fundamental structure is:

```text
DO
 ↓
Recommended approach

DON'T
 ↓
Approach to avoid
```

The learner should immediately understand:

> **“This is what I should do, and this is what I should avoid.”**

This is different from BP1 and BP2.

---

# 2. BP1 → BP2 → BP3 Progression

### BP1

```text
RULE
 ↓
EXAMPLE
```

The learner sees **how** to apply the practice.

### BP2

```text
RULE
 ↓
WHY
```

The learner understands **why** the practice matters.

### BP3

```text
DO
 ↓
DON'T
```

The learner learns **the contrast between recommended and discouraged approaches**.

This gives the BestPracticeBlock a natural pedagogical progression.

---

# 3. BP3 Core Mental Model

```text
┌─────────────────────────────┐
│             DO              │
│                             │
│ Recommended implementation  │
└──────────────┬──────────────┘
               │
               │ CONTRAST
               │
               ▼
┌─────────────────────────────┐
│           DON'T             │
│                             │
│ Discouraged implementation  │
└─────────────────────────────┘
```

The comparison itself is the teaching mechanism.

---

# 4. BP3 Primary Learning Objective

The learner should be able to recognize:

```text
Recommended
      vs
Discouraged
```

and understand the practical distinction.

For example:

```text
DO
student_count = 25

DON'T
x = 25
```

The learner doesn't merely hear:

> "Use descriptive names."

They visually see the difference.

---

# 5. BP3 What BP3 Should NOT Become

### ❌ BP1

Don't present only:

```text
Rule → Example
```

### ❌ BP2

Don't make the explanation of "why" the primary content.

### ❌ BP4

Don't turn the presentation into a transformation:

```text
BEFORE
 ↓
AFTER
```

BP4 owns that pattern.

### ❌ BP5

Don't present a long list of best practices.

### ❌ BP6

Don't introduce company-specific engineering standards.

### ❌ BP7

Don't build the complete guide.

BP3 is intentionally:

> **Direct contrast between recommended and discouraged practice.**

---

# 6. BP3 Hero

Recommended title:

# Do / Don't

Supporting text:

> See the recommended approach side by side with an approach to avoid.

Hero:

```text
┌──────────────────────┐
│         DO           │
│                      │
│ Clear, intentional   │
│ implementation       │
└──────────┬───────────┘
           │
           │ VS
           ▼
┌──────────────────────┐
│       DON'T          │
│                      │
│ Unclear or fragile   │
│ implementation       │
└──────────────────────┘
```

---

# 7. BP3 Example — Descriptive Names

## DO

```python
student_count = 25
```

## DON'T

```python
x = 25
```

The visual relationship:

```text
DO
student_count = 25

        VS

DON'T
x = 25
```

This is a perfect BP3 example because the contrast is immediately understandable.

---

# 8. BP3 Example — Specific Exceptions

## DO

```python
try:
    value = int(user_input)
except ValueError:
    print("Invalid number")
```

## DON'T

```python
try:
    value = int(user_input)
except:
    pass
```

The learner sees the practical distinction immediately.

---

# 9. BP3 Example — Constants

## DO

```python
MAX_RETRIES = 3

if attempts >= MAX_RETRIES:
    lock_account()
```

## DON'T

```python
if attempts >= 3:
    lock_account()
```

The point is not that every numeric literal is forbidden.

The point is that an important configuration value can be given explicit meaning.

---

# 10. BP3 Example — Secret Management

## DO

```python
api_key = os.environ["API_KEY"]
```

## DON'T

```python
api_key = "sk-secret-value"
```

This is a particularly important security-oriented BP3 example.

The visual should make the security distinction obvious.

---

# 11. BP3 Example — Resource Management

## DO

```python
with open("data.txt") as file:
    content = file.read()
```

## DON'T

```python
file = open("data.txt")

content = file.read()

file.close()
```

The BP3 explanation can be short:

> Use structured resource management when the language provides it.

The detailed reasoning remains BP2 territory.

---

# 12. BP3 Example — Focused Functions

## DO

```python
def calculate_total(items):
    return sum(items)
```

## DON'T

```python
def process_order(order):
    validate_order(order)
    calculate_total(order.items)
    send_email(order)
    save_to_database(order)
    generate_invoice(order)
```

The point is to visually show:

```text
DO
Focused responsibility

DON'T
Unrelated responsibilities combined together
```

---

# 13. BP3 Example — Input Validation

## DO

```python
def set_age(age):
    if age < 0:
        raise ValueError("Age cannot be negative")

    return age
```

## DON'T

```python
def set_age(age):
    return age
```

when the function's contract requires a valid non-negative age.

---

# 14. BP3 Example — Duplicated Logic

## DO

```python
def calculate_tax(amount):
    return amount * TAX_RATE
```

Use:

```python
tax = calculate_tax(amount)
```

## DON'T

Repeat:

```python
tax = amount * TAX_RATE
```

throughout many unrelated locations.

The contrast should show the maintenance problem visually.

---

# 15. BP3 Example — Boolean Clarity

## DO

```python
if user.is_active:
    send_notification(user)
```

## DON'T

```python
if user.is_active == True:
    send_notification(user)
```

This is a good small BP3 example because the difference is immediately visible.

---

# 16. BP3 Example — Clear Conditions

## DO

```python
if age >= 18:
    allow_access()
```

## DON'T

```python
if not (age < 18):
    allow_access()
```

The DO version communicates the business condition more directly.

---

# 17. BP3 Signature Component

The defining component should be a **paired comparison card**.

```text
┌──────────────────────────────┐
│ DO                           │
│                              │
│ student_count = 25           │
└──────────────────────────────┘

              VS

┌──────────────────────────────┐
│ DON'T                        │
│                              │
│ x = 25                       │
└──────────────────────────────┘
```

This should become the visual identity of BP3.

---

# 18. BP3 Desktop Layout

Recommended:

```text
┌─────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                   │
│ Do / Don't                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│                 BEST PRACTICE                       │
│                                                     │
│ ┌────────────────────────┐  ┌─────────────────────┐ │
│ │ DO                     │  │ DON'T               │ │
│ │                        │  │                     │ │
│ │ student_count = 25    │  │ x = 25              │ │
│ │                        │  │                     │ │
│ └────────────────────────┘  └─────────────────────┘ │
│                                                     │
│                KEY TAKEAWAY                         │
└─────────────────────────────────────────────────────┘
```

The two cards should have equal visual weight.

---

# 19. BP3 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Do / Don't                          │
├──────────────────────────────────────┤
│                                      │
│ DO                                   │
│ ┌──────────────────────────────────┐ │
│ │ student_count = 25               │ │
│ └──────────────────────────────────┘ │
│                                      │
│                 VS                   │
│                                      │
│ DON'T                                │
│ ┌──────────────────────────────────┐ │
│ │ x = 25                           │ │
│ └──────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 20. BP3 Mobile Layout

```text
DO

┌──────────────────────────┐
│ student_count = 25       │
└──────────────────────────┘

        VS

DON'T

┌──────────────────────────┐
│ x = 25                   │
└──────────────────────────┘
```

The cards stack naturally.

---

# 21. BP3 Colour Usage

Continue the established project palette.

### Primary

```text
#F54A8D
```

Use for:

* active emphasis
* "DO" accent
* important highlights
* selected state

### Secondary

```text
#0B1B3D
```

Use for:

* headings
* code
* structural elements
* text

For "DON'T", **do not introduce a new brand colour** merely to indicate something discouraged.

Use typography, border, iconography, labels, and layout to establish the distinction.

---

# 22. BP3 Do/Don't Semantic Meaning

The data model should explicitly represent:

```text
DO
=
recommended

DON'T
=
discouraged
```

Do not use:

```text
DO = correct
DON'T = syntax error
```

because a "Don't" may still be technically valid code.

This is important.

A best practice is often about:

* maintainability
* clarity
* consistency
* safety
* scalability
* readability

rather than whether code runs.

---

# 23. BP3 Optional Explanation

Each pair can optionally have a short explanation:

```text
DO
student_count = 25

DON'T
x = 25

Why this matters:
The descriptive name communicates intent.
```

But the explanation should remain brief.

Long reasoning belongs to BP2.

---

# 24. BP3 Complete Structure

```text
BEST PRACTICE
       │
       ▼
┌──────────────┬──────────────┐
│     DO       │    DON'T     │
│              │              │
│ Recommended  │ Discouraged  │
│ approach     │ approach     │
└──────────────┴──────────────┘
       │              │
       └──────┬───────┘
              ▼
         TAKEAWAY
```

---

# 25. BP3 Multiple Pairs

BP3 can contain more than one Do/Don't pair when they all belong to **one practice**.

For example:

## Rule

> Write clear, intention-revealing code.

### Pair 1

```text
DO
student_count = 25

DON'T
x = 25
```

### Pair 2

```text
DO
is_active

DON'T
active_flag
```

### Pair 3

```text
DO
calculate_average()

DON'T
do_stuff()
```

This is valid BP3.

However, keep the scope coherent.

---

# 26. BP3 Recommended Pair Count

Recommended:

```text
1 primary pair
+
0–2 supporting pairs
```

Avoid:

```text
10 unrelated Do/Don't pairs
```

That starts moving toward BP5/BP7.

---

# 27. BP3 Rule Header

Even though the presentation is Do/Don't, a concise rule statement can introduce the pair.

Example:

```text
BEST PRACTICE

Use descriptive names that communicate intent.
```

Then:

```text
DO                    DON'T

student_count = 25    x = 25
```

This provides context without turning BP3 into BP1.

---

# 28. BP3 Code Highlighting

The relevant difference should be visually highlighted.

Example:

```python
# DO
student_count = 25

# DON'T
x = 25
```

Highlight:

```text
student_count
```

and:

```text
x
```

The comparison becomes immediately visible.

---

# 29. BP3 Side-by-Side Code

For larger examples:

```text
┌───────────────────────┬───────────────────────┐
│ DO                    │ DON'T                │
├───────────────────────┼───────────────────────┤
│ def calculate_total(  │ def process(         │
│     items             │     data             │
│ ):                    │ ):                   │
│     return sum(items) │     # many tasks     │
│                       │     # mixed together  │
└───────────────────────┴───────────────────────┘
```

This works well on desktop.

For A4/mobile, stack the cards.

---

# 30. BP3 Do/Don't Icons

Use semantic labels:

```text
✓ DO
```

and:

```text
DON'T
```

or:

```text
DO
Recommended

DON'T
Discouraged
```

Avoid relying exclusively on:

```text
green vs red
```

for accessibility.

---

# 31. BP3 Example — Exception Handling

A strong BP3 card:

```text
DO

try:
    value = int(user_input)
except ValueError:
    handle_invalid_number()
```

versus:

```text
DON'T

try:
    value = int(user_input)
except:
    pass
```

Short takeaway:

> Handle known failures explicitly.

---

# 32. BP3 Example — Secrets

```text
DO

api_key = os.environ["API_KEY"]
```

```text
DON'T

api_key = "secret-value"
```

Takeaway:

> Keep credentials outside source code.

This is a particularly valuable security best practice.

---

# 33. BP3 Example — Validation

```text
DO

if amount <= 0:
    raise ValueError("Amount must be positive")
```

versus:

```text
DON'T

return balance - amount
```

without enforcing the function's expected input contract when that contract requires positive amounts.

---

# 34. BP3 Example — Resource Cleanup

```text
DO

with open("data.txt") as file:
    data = file.read()
```

versus:

```text
DON'T

file = open("data.txt")
data = file.read()
```

without appropriate cleanup/ownership handling.

The "Don't" should be contextual rather than claiming that every manual resource-management pattern is inherently invalid.

---

# 35. BP3 Example — Testing

```text
DO

assert add(2, 3) == 5
```

versus:

```text
DON'T

# Assume it works because
# the function looks correct.
```

This is useful because BP3 can contrast **evidence-based development** with assumptions.

---

# 36. BP3 Example — Input Boundary

```text
DO

def set_age(age):
    if age < 0:
        raise ValueError(...)
```

versus:

```text
DON'T

def set_age(age):
    # assume input is valid
    return age
```

The visual lesson:

```text
DO
Validate assumptions.

DON'T
Trust unvalidated external input.
```

---

# 37. BP3 JSON Schema

```json
{
  "type": "bestPractice",
  "version": "BP3",
  "presentation": "Do / Don't",

  "content": {

    "title": "",
    "context": "",

    "rule": {
      "title": "",
      "statement": "",
      "category": ""
    },

    "comparisons": [

      {
        "do": {
          "language": "python",
          "source": "",
          "explanation": ""
        },

        "dont": {
          "language": "python",
          "source": "",
          "explanation": ""
        }
      }

    ],

    "takeaway": ""
  }
}
```

---

# 38. BP3 Complete Example JSON

```json
{
  "type": "bestPractice",
  "version": "BP3",
  "presentation": "Do / Don't",

  "content": {

    "title": "Use Descriptive Variable Names",

    "context": "Clear names communicate intent and make code easier to maintain.",

    "rule": {
      "title": "Use descriptive variable names",
      "statement": "Choose names that clearly communicate what a value represents.",
      "category": "readability"
    },

    "comparisons": [

      {
        "do": {
          "language": "python",
          "source": "student_count = 25",
          "explanation": "The variable name communicates what the value represents."
        },

        "dont": {
          "language": "python",
          "source": "x = 25",
          "explanation": "The name provides little information about the value."
        }
      },

      {
        "do": {
          "language": "python",
          "source": "average_score = 87.5",
          "explanation": "The name communicates the purpose of the value."
        },

        "dont": {
          "language": "python",
          "source": "a = 87.5",
          "explanation": "The meaning of the variable must be inferred."
        }
      }

    ],

    "takeaway": "Prefer names that communicate intent."
  }
}
```

---

# 39. BP3 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "do-dont",

    "desktop": {
      "direction": "horizontal"
    },

    "tablet": {
      "direction": "vertical"
    },

    "mobile": {
      "direction": "vertical"
    },

    "showRule": true,
    "showExplanation": true,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 40. BP3 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── rule
│
├── comparison-group
│   │
│   ├── do-card
│   │   ├── label
│   │   ├── code
│   │   └── explanation
│   │
│   ├── versus
│   │
│   └── dont-card
│       ├── label
│       ├── code
│       └── explanation
│
├── optional additional comparisons
│
└── takeaway
```

---

# 41. BP3 HTML

```html
<section
    class="tutorial-block best-practice-block best-practice-bp3"
    data-block="bestPractice"
    data-version="BP3"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Do / Don't
        </h2>

        <p>
            Compare the recommended approach with
            an approach to avoid.
        </p>

    </header>


    <section class="best-practice-rule">

        <span>
            BEST PRACTICE
        </span>

        <h3>
            Use descriptive variable names.
        </h3>

    </section>


    <section class="do-dont-comparison">


        <article class="do-card">

            <header>
                <span>✓ DO</span>
            </header>

            <pre><code>
student_count = 25
            </code></pre>

            <p>
                The name communicates what the
                value represents.
            </p>

        </article>


        <div class="versus">
            VS
        </div>


        <article class="dont-card">

            <header>
                <span>DON'T</span>
            </header>

            <pre><code>
x = 25
            </code></pre>

            <p>
                The meaning of the variable is
                unclear from the name.
            </p>

        </article>


    </section>


    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Prefer names that communicate intent.
        </p>

    </aside>

</section>
```

---

# 42. BP3 Visual Hierarchy

The hierarchy should be:

```text
BEST PRACTICE
      ↓
DO        DON'T
│           │
Implementation
│           │
└─────┬─────┘
      ↓
TAKEAWAY
```

The comparison should be visually immediate.

---

# 43. BP3 A4 Complete Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Do / Don't                           │
├──────────────────────────────────────┤
│                                      │
│ BEST PRACTICE                        │
│                                      │
│ Use descriptive variable names.      │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ ✓ DO                                 │
│                                      │
│ student_count = 25                   │
│                                      │
│                VS                    │
│                                      │
│ DON'T                                │
│                                      │
│ x = 25                               │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
│ Prefer names that communicate intent.│
└──────────────────────────────────────┘
```

---

# 44. BP3 Mobile Complete Layout

```text
BEST PRACTICE

Use descriptive variable names.

──────────────

✓ DO

student_count = 25

──────────────

VS

──────────────

DON'T

x = 25

──────────────

KEY TAKEAWAY

Prefer names that communicate intent.
```

---

# 45. BP3 Accessibility

The comparison must remain understandable without colour.

Use:

```text
DO
Recommended approach
```

and:

```text
DON'T
Discouraged approach
```

rather than relying solely on visual colour.

Code differences should be understandable through text and labels.

---

# 46. BP3 Interaction

BP3 does not require complex interaction.

Optional enhancement:

```text
[ Reveal Don't ]
```

The learner first sees the recommended approach and then reveals the discouraged approach.

Another option:

```text
[ Which is better? ]
```

Then reveal:

```text
DO
```

However, this should remain optional because BP3 is fundamentally a **comparison teaching block**, not an assessment.

---

# 47. BP3 Do/Don't Quality Rules

Before accepting a BP3 instance:

```text
□ Is there one clear practice?

□ Is the DO genuinely recommended?

□ Is the DON'T genuinely discouraged?

□ Is the distinction technically accurate?

□ Does the comparison teach something meaningful?

□ Are both examples directly related?

□ Is the code concise?

□ Is the contrast immediately visible?

□ Does it avoid becoming BP4?
```

---

# 48. Important BP3 Rule

A "DON'T" should not necessarily mean:

> **"This code is invalid."**

It can mean:

> **"This approach works, but is discouraged because another approach is clearer, safer, or more maintainable."**

This distinction is important for professional programming education.

---

# 49. BP3 Example of Valid but Discouraged Code

```python
x = 25
```

This is valid Python.

But if `x` represents the number of students:

```python
student_count = 25
```

is generally more communicative.

Therefore:

```text
DON'T
≠
Syntax Error
```

Instead:

```text
DON'T
=
Discouraged Practice
```

---

# 50. BP3 Relationship With MistakeBlock

This is especially important after completing MistakeBlock.

### MistakeBlock

```text
BAD CODE
 ↓
WHAT IS WRONG?
 ↓
FIX
```

### BestPracticeBlock BP3

```text
TWO VALID/PLAUSIBLE APPROACHES
 ↓
WHICH ONE IS RECOMMENDED?
```

A BP3 "Don't" does not necessarily contain a bug.

It demonstrates an approach that should generally be avoided under the stated context.

---

# 51. BP3 Relationship With BP4

BP3:

```text
DO
Good approach

DON'T
Discouraged approach
```

BP4:

```text
BEFORE
Existing implementation

      ↓

AFTER
Improved implementation
```

The difference is subtle but important:

> **BP3 teaches contrast.**

> **BP4 teaches transformation.**

---

# 52. BP3 Final Mental Model

```text
               BEST PRACTICE
                     │
             ┌───────┴───────┐
             ▼               ▼
            DO             DON'T
             │               │
       Recommended       Discouraged
        approach          approach
             │               │
             └───────┬───────┘
                     ▼
                  TAKEAWAY
```

The learner should leave thinking:

> **“I can recognize the recommended approach and distinguish it from a practice I should avoid.”**

---

# 53. BP3 Final Technical Specification

| Area                | BP3 Decision                  |
| ------------------- | ----------------------------- |
| **Block**           | **BestPracticeBlock**         |
| **Version**         | **BP3**                       |
| **Presentation**    | **Do / Don't**                |
| **Primary purpose** | Teach through direct contrast |
| **Rule**            | Recommended                   |
| **DO**              | **Required**                  |
| **DON'T**           | **Required**                  |
| **Comparison**      | **Required**                  |
| **Explanation**     | Optional                      |
| **Takeaway**        | Recommended                   |
| **Multiple pairs**  | Supported                     |
| **Before/After**    | ❌                             |
| **Checklist**       | ❌                             |
| **Industry/FAANG**  | ❌                             |
| **Complete Guide**  | ❌                             |
| **Theme**           | Light                         |
| **Primary**         | **#F54A8D**                   |
| **Secondary**       | **#0B1B3D**                   |
| **Gradient**        | ❌                             |
| **Dark theme**      | ❌                             |
| **A4**              | Portrait                      |
| **Desktop**         | Side-by-side                  |
| **Mobile**          | Stacked                       |
| **JSON-driven**     | ✅                             |
| **Responsive**      | ✅                             |
| **Accessible**      | ✅                             |

---

# 54. BestPracticeBlock Progress

Your committed sequence now stands at:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | Rule → Example               | ✅ Complete     |
| **BP2** | Rule → Why                   | ✅ Complete     |
| **BP3** | Do / Don't                   | ✅ **Complete** |
| **BP4** | Before / After               | ⏳ **NEXT**     |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

## BP3 is now complete.

The next committed version is:

> **BP4 — Before / After**.



```python

```

# BLOCK 10 — BestPracticeBlock

## BP4 — Before / After

Yes. We continue exactly with the **committed BestPracticeBlock sequence**.

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| BP1     | Rule → Example               | ✅              |
| BP2     | Rule → Why                   | ✅              |
| BP3     | Do / Don't                   | ✅              |
| **BP4** | **Before / After**           | 🔵 **CURRENT** |
| BP5     | Best Practices Checklist     | ⏳              |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

---

# 1. What Is BP4?

**BP4 — Before / After** teaches a best practice by showing how an existing implementation can be improved.

Its fundamental structure is:

```text
BEFORE
   ↓
APPLY BEST PRACTICE
   ↓
AFTER
```

The key difference from BP3 is:

> **BP3 compares two approaches. BP4 shows an improvement transformation.**

---

# 2. BP3 vs BP4

### BP3 — Do / Don't

```text
DO
Recommended approach

vs

DON'T
Discouraged approach
```

The emphasis is **contrast**.

### BP4 — Before / After

```text
BEFORE
Existing implementation

      ↓

IMPROVEMENT

      ↓

AFTER
Improved implementation
```

The emphasis is **transformation**.

This distinction should remain locked.

---

# 3. BP4 Core Mental Model

```text
┌──────────────────────────────┐
│           BEFORE             │
│                              │
│ Existing implementation      │
└──────────────┬───────────────┘
               ↓
       APPLY BEST PRACTICE
               ↓
┌──────────────────────────────┐
│            AFTER             │
│                              │
│ Improved implementation      │
└──────────────────────────────┘
```

The learner should visually see:

> **What changed because the best practice was applied?**

---

# 4. BP4 Primary Learning Objective

The learner should be able to recognize:

```text
Existing Code
      ↓
Identify Improvement
      ↓
Apply Best Practice
      ↓
Improved Code
```

This makes BP4 especially useful when the learner already knows basic syntax and needs to develop **better coding habits**.

---

# 5. BP4 What BP4 Should NOT Become

### ❌ BP1

Do not make it merely:

```text
Rule → Example
```

### ❌ BP2

Do not make the reasoning the primary structure.

### ❌ BP3

Do not simply put two unrelated alternatives side by side.

### ❌ BP5

Do not turn it into a collection of checklist items.

### ❌ BP6

Do not discuss industry/company standards.

### ❌ BP7

Do not combine every best-practice category into one guide.

BP4 remains:

> **Existing implementation → improved implementation.**

---

# 6. BP4 Hero

Recommended title:

# Before / After

Supporting text:

> See how applying a best practice transforms an existing implementation into clearer, safer, and more maintainable code.

Hero:

```text
┌───────────────────────┐
│       BEFORE          │
│                       │
│ x = 25                │
└───────────┬───────────┘
            │
            ▼
      APPLY PRACTICE
            │
            ▼
┌───────────────────────┐
│        AFTER          │
│                       │
│ student_count = 25    │
└───────────────────────┘
```

---

# 7. BP4 Example — Descriptive Names

## Before

```python
x = 25
```

Problem:

```text
The variable's purpose is unclear.
```

## After

```python
student_count = 25
```

Improvement:

```text
The variable name communicates intent.
```

The transformation is:

```text
x
 ↓
student_count
```

---

# 8. BP4 Example — Magic Number

### Before

```python
if attempts >= 3:
    lock_account()
```

### After

```python
MAX_LOGIN_ATTEMPTS = 3

if attempts >= MAX_LOGIN_ATTEMPTS:
    lock_account()
```

Transformation:

```text
Unexplained value
      ↓
Named meaning
```

---

# 9. BP4 Example — Broad Exception

### Before

```python
try:
    value = int(user_input)
except:
    pass
```

### After

```python
try:
    value = int(user_input)
except ValueError:
    print("Please enter a valid number.")
```

Transformation:

```text
Broad / silent handling
        ↓
Specific / intentional handling
```

---

# 10. BP4 Example — Resource Management

### Before

```python
file = open("data.txt")

content = file.read()

file.close()
```

### After

```python
with open("data.txt") as file:
    content = file.read()
```

Transformation:

```text
Manual resource management
        ↓
Structured resource management
```

---

# 11. BP4 Example — Input Validation

### Before

```python
def withdraw(balance, amount):
    return balance - amount
```

### After

```python
def withdraw(balance, amount):

    if amount <= 0:
        raise ValueError("Amount must be positive")

    if amount > balance:
        raise ValueError("Insufficient funds")

    return balance - amount
```

Transformation:

```text
Implicit assumptions
        ↓
Explicit validation
```

---

# 12. BP4 Example — Function Responsibility

### Before

```python
def process_order(order):

    validate_order(order)
    calculate_total(order)
    send_email(order)
    save_order(order)
    generate_invoice(order)
```

### After

```python
def process_order(order):
    validate_order(order)
    save_order(order)
```

with focused responsibilities delegated appropriately:

```python
def calculate_total(order):
    ...

def send_confirmation(order):
    ...

def generate_invoice(order):
    ...
```

The goal is not merely "more functions."

The goal is:

> **Clearer separation of responsibilities.**

---

# 13. BP4 Example — Duplicated Logic

### Before

```python
total = price + tax

# elsewhere

total = price + tax

# elsewhere

total = price + tax
```

### After

```python
def calculate_total(price, tax):
    return price + tax
```

Then:

```python
total = calculate_total(price, tax)
```

Transformation:

```text
Repeated implementation
        ↓
Centralized logic
```

---

# 14. BP4 Example — Hard-Coded Secret

### Before

```python
api_key = "secret-value"
```

### After

```python
api_key = os.environ["API_KEY"]
```

Transformation:

```text
Credential in source
        ↓
Credential supplied externally
```

This is a strong BP4 security example.

---

# 15. BP4 Example — Unclear Boolean Expression

### Before

```python
if user.is_active == True:
    send_notification(user)
```

### After

```python
if user.is_active:
    send_notification(user)
```

Transformation:

```text
Redundant comparison
        ↓
Direct expression
```

---

# 16. BP4 Example — Deeply Nested Logic

### Before

```python
if user:
    if user.is_active:
        if user.has_permission:
            perform_action(user)
```

### After

```python
if not user:
    return

if not user.is_active:
    return

if not user.has_permission:
    return

perform_action(user)
```

The improvement can make the main path easier to see.

However, BP4 content should avoid implying that early returns are always superior; the example should be contextual.

---

# 17. BP4 Transformation Model

A strong BP4 presentation uses:

```text
BEFORE
  │
  │ identify improvement
  ▼
CHANGE
  │
  │ apply practice
  ▼
AFTER
```

The **CHANGE** step is optional visually, but useful pedagogically.

---

# 18. BP4 Desktop Layout

Recommended:

```text
┌─────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                   │
│ Before / After                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ BEFORE                       AFTER                  │
│ ┌───────────────────────┐    ┌───────────────────┐ │
│ │ x = 25                │ →  │ student_count=25  │ │
│ └───────────────────────┘    └───────────────────┘ │
│                                                     │
│ IMPROVEMENT                                         │
│ The variable name now communicates intent.          │
│                                                     │
│ KEY TAKEAWAY                                        │
└─────────────────────────────────────────────────────┘
```

---

# 19. BP4 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Before / After                       │
├──────────────────────────────────────┤
│                                      │
│ BEFORE                               │
│ ┌──────────────────────────────────┐ │
│ │ x = 25                           │ │
│ └──────────────────────────────────┘ │
│                                      │
│                 ↓                    │
│                                      │
│ IMPROVEMENT                          │
│ Apply a descriptive name.            │
│                                      │
│                 ↓                    │
│                                      │
│ AFTER                                │
│ ┌──────────────────────────────────┐ │
│ │ student_count = 25               │ │
│ └──────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 20. BP4 Mobile Layout

```text
BEFORE

┌──────────────────────────┐
│ x = 25                   │
└──────────────────────────┘

        ↓

IMPROVEMENT

Use a descriptive
variable name.

        ↓

AFTER

┌──────────────────────────┐
│ student_count = 25       │
└──────────────────────────┘
```

This is naturally suited to mobile.

---

# 21. BP4 Rule Header

A concise rule should introduce the transformation.

Example:

> **Use descriptive names that communicate intent.**

Then:

```text
BEFORE → AFTER
```

The rule gives the learner context.

---

# 22. BP4 Improvement Explanation

This is an important component.

After showing Before and After:

```text
IMPROVEMENT

The original name does not reveal what
the value represents. The improved name
makes its meaning explicit.
```

The explanation should focus on **what changed and why the change improves the code**.

---

# 23. BP4 Change Highlighting

The changed portion should be highlighted.

Before:

```python
x = 25
```

After:

```python
student_count = 25
```

Highlight:

```text
x
```

and:

```text
student_count
```

This allows the learner to immediately locate the improvement.

---

# 24. BP4 Side-by-Side Desktop

For larger code:

```text
┌────────────────────────────┬────────────────────────────┐
│ BEFORE                     │ AFTER                     │
├────────────────────────────┼────────────────────────────┤
│ def process(data):         │ def calculate_total(items):│
│     ...                    │     return sum(items)      │
│                            │                            │
└────────────────────────────┴────────────────────────────┘
```

A center arrow can communicate:

```text
BEFORE → AFTER
```

---

# 25. BP4 Diff-Style Enhancement

For code transformations, a diff-inspired presentation can be useful:

```text
BEFORE

- x = 25


AFTER

+ student_count = 25
```

However, this should be an optional visual mode rather than the primary data model.

---

# 26. BP4 Transformation Categories

The data model can support:

```text
Naming
Readability
Structure
Error Handling
Validation
Security
Testing
Performance
Maintainability
Resource Management
Architecture
```

Example:

```json
{
  "category": "maintainability"
}
```

---

# 27. BP4 One Transformation Rule

The Before and After versions should represent the **same conceptual code/task**.

Bad:

```text
BEFORE
x = 25

AFTER
def calculate_average(...):
    ...
```

This is not a transformation.

Good:

```text
BEFORE
x = 25

AFTER
student_count = 25
```

The learner can directly see what changed.

---

# 28. BP4 Multiple Transformations

BP4 can support several transformations around **one best-practice theme**.

Example:

## Theme

> Improve code readability.

### Transformation 1

```text
x → student_count
```

### Transformation 2

```text
a → average_score
```

### Transformation 3

```text
f() → calculate_average()
```

This creates a pattern:

```text
BEFORE → AFTER
BEFORE → AFTER
BEFORE → AFTER
```

---

# 29. BP4 Recommended Transformation Count

Recommended:

```text
1 primary transformation
+
0–2 supporting transformations
```

Avoid turning BP4 into a giant refactoring guide.

That belongs closer to BP7.

---

# 30. BP4 What the Learner Should Notice

Each transformation should have a clear focal change.

For example:

```text
BEFORE
x = 25
```

The learner asks:

> What's wrong with this?

Then:

```text
AFTER
student_count = 25
```

The learner sees:

> The name now communicates intent.

This is exactly the desired cognitive interaction.

---

# 31. BP4 JSON Schema

```json
{
  "type": "bestPractice",
  "version": "BP4",
  "presentation": "Before / After",

  "content": {

    "title": "",
    "context": "",

    "rule": {
      "title": "",
      "statement": "",
      "category": ""
    },

    "transformations": [

      {
        "before": {
          "language": "python",
          "source": "",
          "highlight": []
        },

        "change": {
          "description": ""
        },

        "after": {
          "language": "python",
          "source": "",
          "highlight": []
        },

        "improvement": ""
      }

    ],

    "takeaway": ""
  }
}
```

---

# 32. BP4 Complete Example JSON

```json
{
  "type": "bestPractice",
  "version": "BP4",
  "presentation": "Before / After",

  "content": {

    "title": "Use Descriptive Variable Names",

    "context": "Clear names make code easier to understand.",

    "rule": {
      "title": "Use descriptive variable names",
      "statement": "Choose names that communicate what a value represents.",
      "category": "readability"
    },

    "transformations": [

      {
        "before": {
          "language": "python",
          "source": "x = 25",
          "highlight": [
            "x"
          ]
        },

        "change": {
          "description": "Replace the unclear name with a name that communicates intent."
        },

        "after": {
          "language": "python",
          "source": "student_count = 25",
          "highlight": [
            "student_count"
          ]
        },

        "improvement": "The variable name now communicates that the value represents the number of students."
      }

    ],

    "takeaway": "Prefer names that communicate intent."
  }
}
```

---

# 33. BP4 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "before-after",

    "desktop": {
      "direction": "horizontal"
    },

    "tablet": {
      "direction": "vertical"
    },

    "mobile": {
      "direction": "vertical"
    },

    "showRule": true,
    "showChange": true,
    "showImprovement": true,
    "showTakeaway": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 34. BP4 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── rule
│
├── transformation
│   │
│   ├── before-card
│   │
│   ├── change-indicator
│   │
│   ├── after-card
│   │
│   └── improvement
│
├── optional additional transformations
│
└── takeaway
```

---

# 35. BP4 HTML

```html
<section
    class="tutorial-block best-practice-block best-practice-bp4"
    data-block="bestPractice"
    data-version="BP4"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Before / After
        </h2>

        <p>
            See how applying a best practice
            improves an existing implementation.
        </p>

    </header>


    <section class="best-practice-rule">

        <span>
            BEST PRACTICE
        </span>

        <h3>
            Use descriptive variable names.
        </h3>

    </section>


    <section class="before-after-flow">


        <article class="before-card">

            <header>
                <span>BEFORE</span>
            </header>

            <pre><code>
x = 25
            </code></pre>

        </article>


        <div class="transformation-arrow">
            →
        </div>


        <article class="after-card">

            <header>
                <span>AFTER</span>
            </header>

            <pre><code>
student_count = 25
            </code></pre>

        </article>


    </section>


    <section class="improvement">

        <span>
            IMPROVEMENT
        </span>

        <p>
            The variable name now communicates
            what the value represents.
        </p>

    </section>


    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Prefer names that communicate intent.
        </p>

    </aside>

</section>
```

---

# 36. BP4 Visual Hierarchy

The hierarchy should be:

```text
BEST PRACTICE
      ↓
BEFORE
      ↓
CHANGE
      ↓
AFTER
      ↓
IMPROVEMENT
      ↓
TAKEAWAY
```

The learner should be able to follow the transformation without reading a long explanation.

---

# 37. BP4 Visual Arrow

The arrow is important because it communicates transformation:

```text
BEFORE
   │
   ▼
IMPROVE
   │
   ▼
AFTER
```

On desktop:

```text
BEFORE  →  AFTER
```

On portrait/mobile:

```text
BEFORE
   ↓
AFTER
```

---

# 38. BP4 A4 Complete Design

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Before / After                       │
├──────────────────────────────────────┤
│                                      │
│ BEST PRACTICE                        │
│ Use descriptive variable names.      │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ BEFORE                               │
│                                      │
│ x = 25                               │
│                                      │
│                 ↓                    │
│                                      │
│ AFTER                                │
│                                      │
│ student_count = 25                   │
│                                      │
├──────────────────────────────────────┤
│ IMPROVEMENT                          │
│ The name now communicates intent.    │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 39. BP4 Mobile Design

```text
BEST PRACTICE

Use descriptive variable names.

──────────────

BEFORE

x = 25

      ↓

AFTER

student_count = 25

──────────────

IMPROVEMENT

The name now communicates intent.

──────────────

KEY TAKEAWAY
```

---

# 40. BP4 Accessibility

The transformation must be understandable without colour.

Use explicit labels:

```text
BEFORE
```

```text
AFTER
```

```text
IMPROVEMENT
```

The arrow should not be the only indication of sequence.

Screen-reader-friendly structure should communicate:

> Before implementation → After implementation → Improvement explanation.

---

# 41. BP4 Code Accessibility

Code examples should have:

* language identification
* readable font
* sufficient contrast
* keyboard-selectable text
* line numbers only when useful
* highlighted changed lines where appropriate

---

# 42. BP4 Interaction

Optional:

### Toggle

```text
[ Before ] [ After ]
```

Useful for very large code examples.

### Step Reveal

```text
1. Before
2. Change
3. After
```

Useful for teaching refactoring.

But the default BP4 should display the transformation without requiring interaction.

---

# 43. BP4 Transformation Quality

A good BP4 transformation should satisfy:

```text
□ Same problem/context
□ Same intended behavior
□ Clear improvement
□ Limited change
□ Best practice is identifiable
□ Difference is visible
□ Technical correctness preserved
```

---

# 44. BP4 Avoid Fake Improvement

Don't create transformations where the "After" is merely different.

Bad:

```python
# BEFORE
x = 25

# AFTER
count = 25
```

If neither communicates enough context, the improvement is weak.

Better:

```python
# BEFORE
x = 25

# AFTER
student_count = 25
```

Now the improvement is obvious.

---

# 45. BP4 Preserve Behavior

A best-practice transformation should generally preserve intended behavior.

Example:

```text
BEFORE
Calculate total correctly.

AFTER
Calculate total correctly,
but with clearer structure.
```

The learner should understand:

> **We improved the implementation without changing the intended result.**

Where a behavior change is intentional, it must be explicitly stated.

---

# 46. BP4 Relationship With Refactoring

BP4 can introduce the concept of **refactoring** when relevant.

Mental model:

```text
Same intended behavior
        +
Better internal structure
        =
Refactoring
```

However, BP4 should not become a complete refactoring course.

---

# 47. BP4 Example — Refactoring

### Before

```python
def get_total(items):
    total = 0

    for item in items:
        total += item.price

    return total
```

### After

```python
def get_total(items):
    return sum(item.price for item in items)
```

The lesson might be:

> Simplify implementation when the resulting code remains clear.

But be careful: concise code is not automatically better. The content author should justify the transformation.

---

# 48. BP4 Example — Readability Transformation

### Before

```python
if age >= 18 and has_license and not suspended:
    allow_driving()
```

### After

```python
can_drive = (
    age >= 18
    and has_license
    and not suspended
)

if can_drive:
    allow_driving()
```

The transformation can improve readability when the condition has meaningful domain semantics.

---

# 49. BP4 Final Mental Model

```text
             BEST PRACTICE
                    │
                    ▼
                 BEFORE
                    │
                    ▼
              IMPROVEMENT
                    │
                    ▼
                  AFTER
                    │
                    ▼
              BETTER CODE
```

The learner should leave thinking:

> **“I can see how applying the practice improves real code.”**

---

# 50. BP4 Final Technical Specification

| Area                         | BP4 Decision                            |
| ---------------------------- | --------------------------------------- |
| **Block**                    | **BestPracticeBlock**                   |
| **Version**                  | **BP4**                                 |
| **Presentation**             | **Before / After**                      |
| **Primary purpose**          | Show improvement through transformation |
| **Rule**                     | Recommended                             |
| **Before**                   | **Required**                            |
| **After**                    | **Required**                            |
| **Change / Improvement**     | **Required**                            |
| **Takeaway**                 | Recommended                             |
| **Code highlighting**        | Recommended                             |
| **Diff view**                | Optional                                |
| **Multiple transformations** | Supported                               |
| **Do / Don't**               | ❌                                       |
| **Checklist**                | ❌                                       |
| **Industry/FAANG**           | ❌                                       |
| **Complete Guide**           | ❌                                       |
| **Theme**                    | Light                                   |
| **Primary**                  | **#F54A8D**                             |
| **Secondary**                | **#0B1B3D**                             |
| **Gradient**                 | ❌                                       |
| **Dark theme**               | ❌                                       |
| **A4**                       | Portrait                                |
| **Desktop**                  | Side-by-side                            |
| **Mobile**                   | Stacked                                 |
| **JSON-driven**              | ✅                                       |
| **Responsive**               | ✅                                       |
| **Accessible**               | ✅                                       |

---

# 51. BestPracticeBlock Progress

Your committed sequence now stands at:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | Rule → Example               | ✅ Complete     |
| **BP2** | Rule → Why                   | ✅ Complete     |
| **BP3** | Do / Don't                   | ✅ Complete     |
| **BP4** | Before / After               | ✅ **Complete** |
| **BP5** | Best Practices Checklist     | ⏳ **NEXT**     |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

## BP4 is now complete.

The next committed version is:

> **BP5 — Best Practices Checklist**.



```python

```

# BLOCK 10 — BestPracticeBlock

## BP5 — Best Practices Checklist

Yes. We now continue with the **next committed version** exactly as you defined it.

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| BP1     | Rule → Example               | ✅              |
| BP2     | Rule → Why                   | ✅              |
| BP3     | Do / Don't                   | ✅              |
| BP4     | Before / After               | ✅              |
| **BP5** | **Best Practices Checklist** | 🔵 **CURRENT** |
| BP6     | Industry / FAANG Practices   | ⏳              |
| BP7     | Complete Best-Practice Guide | ⏳              |

---

# 1. What Is BP5?

**BP5 — Best Practices Checklist** changes the learning experience from:

> **“Here is one best practice.”**

to:

> **“Here is a practical set of best practices I can check against my own code.”**

The core structure is:

```text
BEST-PRACTICE AREA
        ↓
CHECKLIST
        ↓
□ Practice 1
□ Practice 2
□ Practice 3
□ Practice 4
        ↓
SELF-REVIEW
```

BP5 is therefore the first BestPracticeBlock version designed primarily for **self-review and practical application**.

---

# 2. BP1 → BP2 → BP3 → BP4 → BP5

The progression is now:

```text
BP1
Rule → Example
```

> What should I do?

↓

```text
BP2
Rule → Why
```

> Why should I do it?

↓

```text
BP3
Do / Don't
```

> What does the recommended approach look like compared with a discouraged approach?

↓

```text
BP4
Before / After
```

> How does applying the practice improve existing code?

↓

```text
BP5
Best Practices Checklist
```

> **Have I actually followed the important practices?**

This is a very important progression.

---

# 3. BP5 Core Mental Model

```text
                 BEST PRACTICES
                       │
                       ▼
                   CHECKLIST
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     QUALITY        SAFETY       MAINTAINABILITY
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  SELF-REVIEW
```

The learner should be able to use the checklist immediately after learning a concept or writing code.

---

# 4. BP5 Primary Learning Objective

The learner should be able to ask:

```text
Did I follow the recommended practices?
```

and answer systematically:

```text
□ Yes
□ No
□ Need to review
```

Therefore BP5 is more practical than BP1–BP4.

---

# 5. What BP5 Is NOT

### ❌ Not BP1

It should not teach one rule through one example.

### ❌ Not BP2

It should not explain the reasoning behind every practice in depth.

### ❌ Not BP3

It should not be primarily a Do/Don't comparison.

### ❌ Not BP4

It should not focus on before/after transformation.

### ❌ Not BP6

It should not yet discuss company-specific or FAANG-level engineering practices.

### ❌ Not BP7

It should not become the complete best-practice knowledge system.

BP5's identity is:

> **A structured checklist for practical self-review.**

---

# 6. BP5 Hero

Recommended title:

# Best Practices Checklist

Supporting text:

> Use this checklist to review your implementation before considering it complete.

Hero:

```text
┌────────────────────────────────────┐
│       BEST PRACTICES               │
│                                    │
│       □ Naming                     │
│       □ Readability                │
│       □ Validation                 │
│       □ Error Handling             │
│       □ Testing                    │
│       □ Maintainability            │
└────────────────────────────────────┘
```

The checklist itself should be the visual hero.

---

# 7. BP5 Checklist Philosophy

The checklist should not be a random list.

It should follow a meaningful quality structure:

```text
Understand
   ↓
Implement
   ↓
Validate
   ↓
Test
   ↓
Review
```

A practical checklist can therefore be grouped into categories.

---

# 8. BP5 Recommended Categories

A generic checklist can support:

```text
1. Readability
2. Correctness
3. Error Handling
4. Validation
5. Maintainability
6. Testing
7. Performance
8. Security
9. Documentation
10. Review
```

Not every tutorial topic needs every category.

The content author should only include relevant items.

---

# 9. BP5 Example — Python Function Checklist

Suppose the learner has written a Python function.

The checklist might be:

```text
□ Does the function have a clear name?

□ Does it have one clear responsibility?

□ Are parameters meaningful?

□ Are invalid inputs handled appropriately?

□ Are exceptions handled deliberately?

□ Is the return value clear?

□ Is unnecessary duplication avoided?

□ Is the function easy to test?

□ Are edge cases considered?
```

This is much more useful than simply saying:

> "Follow best practices."

---

# 10. BP5 Checklist Card

The primary component:

```text
┌────────────────────────────────────────┐
│ BEST PRACTICE CHECKLIST               │
├────────────────────────────────────────┤
│                                        │
│ □ Use descriptive names                │
│                                        │
│ □ Keep functions focused               │
│                                        │
│ □ Validate inputs                      │
│                                        │
│ □ Handle expected exceptions           │
│                                        │
│ □ Test important behavior              │
│                                        │
└────────────────────────────────────────┘
```

Each item should be independently understandable.

---

# 11. BP5 Checklist Item Structure

Each checklist item should have:

```text
CHECKBOX
+
ACTION
+
OPTIONAL SHORT CLARIFICATION
```

Example:

```text
□ Validate external input
  Reject invalid values at the boundary.
```

Or simply:

```text
□ Validate external input
```

depending on the content density.

---

# 12. BP5 Checklist Categories

For a larger checklist:

```text
┌────────────────────────────────────┐
│ READABILITY                        │
│ □ Descriptive names                │
│ □ Clear functions                  │
│ □ Simple control flow              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ CORRECTNESS                        │
│ □ Validate assumptions             │
│ □ Handle edge cases                │
│ □ Verify expected behavior         │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ MAINTAINABILITY                    │
│ □ Avoid unnecessary duplication    │
│ □ Keep responsibilities focused    │
│ □ Avoid magic values               │
└────────────────────────────────────┘
```

This is the preferred BP5 structure for a substantial checklist.

---

# 13. BP5 Checklist Grouping

The data model should support:

```text
Checklist
   │
   ├── Category 1
   │     ├── Item
   │     ├── Item
   │     └── Item
   │
   ├── Category 2
   │     ├── Item
   │     └── Item
   │
   └── Category 3
         ├── Item
         └── Item
```

This makes the component scalable.

---

# 14. BP5 Example — Readability

### Readability

```text
□ Are variable names descriptive?

□ Are function names meaningful?

□ Is the control flow easy to follow?

□ Are complex expressions explained where necessary?

□ Is the code free of unnecessary cleverness?
```

The learner can review the code against these questions.

---

# 15. BP5 Example — Correctness

### Correctness

```text
□ Does the implementation produce the expected result?

□ Are edge cases handled?

□ Are input assumptions validated?

□ Are boundary conditions considered?

□ Does the implementation preserve the intended behavior?
```

---

# 16. BP5 Example — Error Handling

### Error Handling

```text
□ Are expected failures handled?

□ Are specific exceptions used where appropriate?

□ Are exceptions accidentally swallowed?

□ Are error messages useful?

□ Does failure produce an understandable outcome?
```

---

# 17. BP5 Example — Maintainability

### Maintainability

```text
□ Is duplicated logic minimized?

□ Are responsibilities separated clearly?

□ Are important constants named?

□ Is unnecessary complexity avoided?

□ Can another developer understand the implementation?
```

---

# 18. BP5 Example — Testing

### Testing

```text
□ Is important behavior tested?

□ Are normal cases tested?

□ Are boundary cases tested?

□ Are failure cases tested?

□ Can the tests detect regression?
```

---

# 19. BP5 Example — Security

### Security

```text
□ Are secrets kept out of source code?

□ Is external input validated?

□ Are permissions checked where required?

□ Are sensitive errors handled appropriately?

□ Are security assumptions explicit?
```

This category should only appear when relevant.

---

# 20. BP5 Example — Performance

### Performance

```text
□ Is unnecessary repeated work avoided?

□ Are expensive operations used appropriately?

□ Is the chosen data structure suitable?

□ Are performance assumptions reasonable?

□ Is optimization justified by actual requirements?
```

Important:

> BP5 should not encourage premature optimization.

A checklist item such as:

```text
□ Did I optimize everything?
```

would be poor practice.

Better:

```text
□ Did I avoid clearly unnecessary work?
```

---

# 21. BP5 Example — Documentation

### Documentation

```text
□ Is non-obvious behavior documented?

□ Are important assumptions clear?

□ Are public interfaces documented where appropriate?

□ Does documentation explain intent rather than repeat obvious code?
```

---

# 22. BP5 Final Review

A useful final section:

```text
FINAL REVIEW

□ I understand what the code does.

□ I verified the expected behavior.

□ I considered important edge cases.

□ I reviewed the implementation against
  the relevant best practices.

□ I am comfortable maintaining this code later.
```

This turns the block into a practical review tool.

---

# 23. BP5 Completion State

An optional completion indicator:

```text
BEST PRACTICE REVIEW

5 / 8 checked
```

or:

```text
60% reviewed
```

However, this should represent **self-review progress**, not code quality.

Do not imply:

```text
8 / 8 = Perfect Code
```

A checklist cannot guarantee perfection.

---

# 24. BP5 Important UX Principle

The checklist should not become a gamified scoring system.

Avoid:

```text
95% Best Practice Score
```

unless the platform has a clearly defined, justified quality model.

Instead:

```text
7 / 9 reviewed
```

is safer and semantically accurate.

---

# 25. BP5 Interactive Checklist

The preferred interactive model:

```text
□ Descriptive names
□ Focused functions
□ Input validation
□ Specific exception handling
□ Tests
```

When clicked:

```text
☑ Descriptive names
☑ Focused functions
□ Input validation
□ Specific exception handling
□ Tests
```

The state is local to the learner's review.

---

# 26. BP5 Reset

If interactive state is supported:

```text
[ Reset Checklist ]
```

should be available.

This allows the learner to perform another review later.

---

# 27. BP5 Completion Message

After checking everything:

```text
Review complete.

You reviewed all practices in this checklist.
```

Avoid:

```text
Congratulations! Your code is perfect.
```

The checklist is a review aid, not a correctness certificate.

---

# 28. BP5 Desktop Layout

Recommended:

```text
┌────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                  │
│ Best Practices Checklist                           │
├────────────────────────────────────────────────────┤
│                                                    │
│ Review your implementation against the practices.  │
│                                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐ │
│ │ READABILITY          │ │ CORRECTNESS          │ │
│ │                      │ │                      │ │
│ │ □ Clear names        │ │ □ Edge cases         │ │
│ │ □ Focused functions  │ │ □ Input validation   │ │
│ │ □ Simple flow        │ │ □ Expected behavior  │ │
│ └──────────────────────┘ └──────────────────────┘ │
│                                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐ │
│ │ MAINTAINABILITY      │ │ TESTING              │ │
│ │                      │ │                      │ │
│ │ □ No duplication     │ │ □ Normal cases       │ │
│ │ □ Clear structure    │ │ □ Edge cases         │ │
│ │ □ Named constants    │ │ □ Failure cases      │ │
│ └──────────────────────┘ └──────────────────────┘ │
│                                                    │
│              6 / 12 REVIEWED                      │
└────────────────────────────────────────────────────┘
```

---

# 29. BP5 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Best Practices Checklist             │
├──────────────────────────────────────┤
│                                      │
│ READABILITY                          │
│                                      │
│ □ Descriptive names                  │
│ □ Focused functions                  │
│ □ Clear control flow                 │
│                                      │
│ CORRECTNESS                          │
│                                      │
│ □ Validate inputs                    │
│ □ Handle edge cases                  │
│ □ Verify expected behavior           │
│                                      │
│ MAINTAINABILITY                      │
│                                      │
│ □ Avoid duplication                  │
│ □ Name important constants           │
│ □ Keep responsibilities focused      │
│                                      │
│ TESTING                              │
│                                      │
│ □ Test normal cases                  │
│ □ Test boundary cases                │
│ □ Test failure cases                 │
│                                      │
├──────────────────────────────────────┤
│ FINAL REVIEW                         │
│                                      │
│ □ Ready for review                   │
└──────────────────────────────────────┘
```

---

# 30. BP5 Mobile Layout

On mobile, categories should stack:

```text
BEST PRACTICES CHECKLIST

▼ READABILITY

□ Descriptive names
□ Focused functions
□ Clear control flow


▼ CORRECTNESS

□ Validate inputs
□ Handle edge cases
□ Verify expected behavior


▼ TESTING

□ Normal cases
□ Boundary cases
□ Failure cases
```

Accordion categories are appropriate when the checklist is long.

---

# 31. BP5 Category Accordion

For large checklists:

```text
┌─────────────────────────────┐
│ ▼ Readability               │
│                             │
│ □ Descriptive names         │
│ □ Focused functions         │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ▶ Correctness               │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ▶ Testing                   │
└─────────────────────────────┘
```

Only one or two sections need to be expanded at a time on small screens.

---

# 32. BP5 Checklist Item Design

Each item should be concise.

Good:

```text
□ Validate external input
```

Weak:

```text
□ Make sure that you have properly
validated all external input values
before processing them in every
possible situation.
```

The second version is too verbose for a checklist.

Detailed explanation can be available on demand.

---

# 33. BP5 Optional Item Explanation

An item can have:

```text
□ Validate external input
   [Why?]
```

Clicking:

```text
External input should not be assumed
to satisfy internal application constraints.
```

This keeps the main checklist clean.

---

# 34. BP5 Checklist Item Data Model

```json
{
  "id": "validate-input",
  "label": "Validate external input",
  "category": "correctness",
  "required": true,
  "description": "Reject invalid values at system boundaries."
}
```

The `required` property can indicate whether the item is essential for the specific checklist.

---

# 35. BP5 JSON Schema

```json
{
  "type": "bestPractice",
  "version": "BP5",
  "presentation": "Best Practices Checklist",

  "content": {

    "title": "",
    "context": "",

    "categories": [

      {
        "id": "",
        "title": "",
        "description": "",

        "items": [

          {
            "id": "",
            "label": "",
            "description": "",
            "required": false
          }

        ]
      }

    ],

    "finalReview": {
      "enabled": true,
      "items": []
    },

    "takeaway": ""
  }
}
```

---

# 36. BP5 Complete Example JSON

```json
{
  "type": "bestPractice",
  "version": "BP5",
  "presentation": "Best Practices Checklist",

  "content": {

    "title": "Python Function Best Practices",

    "context": "Review your function before considering the implementation complete.",

    "categories": [

      {
        "id": "readability",
        "title": "Readability",
        "description": "Make the function easy to understand.",

        "items": [

          {
            "id": "clear-name",
            "label": "Use a descriptive function name.",
            "description": "",
            "required": true
          },

          {
            "id": "focused-responsibility",
            "label": "Keep the function focused.",
            "description": "",
            "required": true
          },

          {
            "id": "clear-parameters",
            "label": "Use meaningful parameter names.",
            "description": "",
            "required": true
          }

        ]
      },

      {
        "id": "correctness",
        "title": "Correctness",
        "description": "Make behavior predictable and valid.",

        "items": [

          {
            "id": "validate-input",
            "label": "Validate important input assumptions.",
            "description": "",
            "required": true
          },

          {
            "id": "edge-cases",
            "label": "Consider important edge cases.",
            "description": "",
            "required": true
          }

        ]
      },

      {
        "id": "testing",
        "title": "Testing",
        "description": "Verify important behavior.",

        "items": [

          {
            "id": "normal-case",
            "label": "Test normal behavior.",
            "description": "",
            "required": true
          },

          {
            "id": "boundary-case",
            "label": "Test important boundary cases.",
            "description": "",
            "required": false
          },

          {
            "id": "failure-case",
            "label": "Test important failure cases.",
            "description": "",
            "required": false
          }

        ]
      }

    ],

    "finalReview": {
      "enabled": true,
      "items": [
        "I understand the function's responsibility.",
        "I verified its expected behavior.",
        "I reviewed the relevant best practices."
      ]
    },

    "takeaway": "Use the checklist to review quality before considering the implementation complete."
  }
}
```

---

# 37. BP5 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "checklist",

    "desktop": {
      "categoryLayout": "grid"
    },

    "tablet": {
      "categoryLayout": "stack"
    },

    "mobile": {
      "categoryLayout": "accordion"
    },

    "interactive": true,

    "showProgress": true,
    "showFinalReview": true,
    "showReset": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 38. BP5 Semantic Structure

```text
<section>
│
├── header
│
├── context
│
├── checklist
│   │
│   ├── category
│   │   ├── item
│   │   ├── item
│   │   └── item
│   │
│   ├── category
│   │   ├── item
│   │   └── item
│   │
│   └── category
│       ├── item
│       └── item
│
├── progress
│
├── final-review
│
└── takeaway
```

---

# 39. BP5 HTML

```html
<section
    class="tutorial-block best-practice-block best-practice-bp5"
    data-block="bestPractice"
    data-version="BP5"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Best Practices Checklist
        </h2>

        <p>
            Review your implementation against
            the most important practices.
        </p>

    </header>


    <div class="checklist-categories">


        <section class="checklist-category">

            <h3>
                Readability
            </h3>

            <label>
                <input type="checkbox">
                Use descriptive names.
            </label>

            <label>
                <input type="checkbox">
                Keep functions focused.
            </label>

            <label>
                <input type="checkbox">
                Keep control flow clear.
            </label>

        </section>


        <section class="checklist-category">

            <h3>
                Correctness
            </h3>

            <label>
                <input type="checkbox">
                Validate important inputs.
            </label>

            <label>
                <input type="checkbox">
                Consider edge cases.
            </label>

            <label>
                <input type="checkbox">
                Verify expected behavior.
            </label>

        </section>


        <section class="checklist-category">

            <h3>
                Testing
            </h3>

            <label>
                <input type="checkbox">
                Test normal cases.
            </label>

            <label>
                <input type="checkbox">
                Test boundary cases.
            </label>

            <label>
                <input type="checkbox">
                Test failure cases.
            </label>

        </section>


    </div>


    <div class="checklist-progress">

        0 / 9 reviewed

    </div>


    <section class="final-review">

        <h3>
            Final Review
        </h3>

        <label>
            <input type="checkbox">
            I understand the implementation.
        </label>

        <label>
            <input type="checkbox">
            I verified expected behavior.
        </label>

        <label>
            <input type="checkbox">
            I reviewed the relevant best practices.
        </label>

    </section>


    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Use the checklist to review quality
            before considering the implementation complete.
        </p>

    </aside>

</section>
```

---

# 40. BP5 Interactive State

The state should be local to the block:

```text
unchecked
    ↓
checked
```

Example:

```json
{
  "checkedItems": [
    "clear-name",
    "focused-responsibility",
    "validate-input"
  ]
}
```

This state does not mean the code has objectively passed those criteria.

It means:

> **The learner marked them as reviewed.**

---

# 41. BP5 Progress Calculation

Example:

```text
Total items = 10
Checked = 6

Progress:
6 / 10 reviewed
```

The system may display:

```text
60% reviewed
```

But this should be labelled as **review progress**, not quality score.

---

# 42. BP5 Important UX Rule

Do not use:

```text
6 / 10
```

to imply:

> "Your code is 60% good."

Instead:

```text
6 / 10 practices reviewed
```

This keeps the semantic meaning correct.

---

# 43. BP5 Final Review Card

Recommended:

```text
┌────────────────────────────────────┐
│ FINAL REVIEW                       │
├────────────────────────────────────┤
│                                    │
│ □ I understand the implementation. │
│                                    │
│ □ I verified expected behavior.    │
│                                    │
│ □ I reviewed relevant practices.   │
│                                    │
└────────────────────────────────────┘
```

This provides closure without pretending the checklist guarantees correctness.

---

# 44. BP5 Reset Interaction

Recommended control:

```text
[ Reset Review ]
```

This clears the learner's checklist state.

On reset:

```text
All checklist items have been reset.
```

No destructive confirmation is necessary for a simple local checklist unless state persistence is involved.

---

# 45. BP5 Accessibility

Every checklist item should use a real checkbox:

```html
<input type="checkbox">
```

not:

```text
□
```

as a purely decorative character.

The label should be clickable.

Keyboard users should be able to:

```text
Tab
↓
Space
↓
Check
```

ARIA state should reflect the actual checkbox state.

---

# 46. BP5 Keyboard Navigation

Recommended flow:

```text
Category
   ↓
Checkbox 1
   ↓
Checkbox 2
   ↓
Checkbox 3
   ↓
Next Category
```

No custom keyboard mechanism should replace native checkbox behavior unnecessarily.

---

# 47. BP5 Mobile Accessibility

Checkbox hit areas should be large enough for touch.

Instead of:

```text
□
```

use:

```text
┌───────────────────────────────────┐
│ □  Validate external input        │
└───────────────────────────────────┘
```

The entire row can be clickable.

---

# 48. BP5 Content Authoring Rule

A checklist item should be:

```text
Actionable
+
Observable
+
Relevant
```

Good:

> Validate external input.

Poor:

> Write good code.

The learner needs to know what they are reviewing.

---

# 49. BP5 Checklist Size

For a focused BP5:

```text
5–12 items
```

is generally a useful range.

For a larger topic:

```text
Multiple categories
+
5–8 items/category
```

can work.

Avoid unnecessarily huge checklists.

The objective is useful review, not exhaustive documentation.

---

# 50. BP5 Checklist Ordering

Recommended ordering:

```text
1. Readability
2. Correctness
3. Error Handling
4. Maintainability
5. Testing
6. Security
7. Performance
8. Documentation
```

But this is not mandatory.

The order should follow the tutorial's actual learning priorities.

---

# 51. BP5 "Required" vs "Optional"

Useful data distinction:

```text
required: true
```

means:

> This practice is essential/relevant to this particular implementation.

```text
required: false
```

means:

> This is useful but context-dependent.

For example:

```text
□ Validate input        REQUIRED
□ Test edge cases      OPTIONAL
```

The UI can optionally indicate:

```text
Required
```

but should avoid overwhelming the learner.

---

# 52. BP5 Context-Sensitive Checklist

This is important for the Tutorial Engine.

A Python function tutorial might need:

```text
Readability
Correctness
Testing
```

A security tutorial might need:

```text
Input Validation
Authentication
Authorization
Secrets
Logging
```

A database tutorial might need:

```text
Transactions
Validation
Indexes
Error Handling
Connection Management
```

Therefore BP5 should be **content-driven**, not a single fixed checklist.

---

# 53. BP5 Relationship With Topic

The checklist should reflect:

```text
Tutorial Topic
      ↓
Relevant Practices
      ↓
BP5 Checklist
```

Not:

```text
Generic Checklist
      ↓
Every Tutorial
```

This preserves educational relevance.

---

# 54. BP5 Final Mental Model

```text
              IMPLEMENTATION
                    │
                    ▼
              SELF REVIEW
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      READABILITY CORRECTNESS TESTING
          │         │         │
          └─────────┼─────────┘
                    ▼
              CHECKLIST
                    │
                    ▼
              FINAL REVIEW
```

The learner should finish thinking:

> **“I have systematically reviewed the important practices relevant to this implementation.”**

---

# 55. BP5 Final Technical Specification

| Area                | BP5 Decision                 |
| ------------------- | ---------------------------- |
| **Block**           | **BestPracticeBlock**        |
| **Version**         | **BP5**                      |
| **Presentation**    | **Best Practices Checklist** |
| **Primary purpose** | Practical self-review        |
| **Checklist**       | **Required**                 |
| **Categories**      | Supported                    |
| **Interactive**     | Recommended                  |
| **Progress**        | Review progress only         |
| **Final Review**    | Recommended                  |
| **Reset**           | Recommended                  |
| **Required items**  | Supported                    |
| **Optional items**  | Supported                    |
| **Rule → Example**  | ❌                            |
| **Rule → Why**      | ❌                            |
| **Do / Don't**      | ❌                            |
| **Before / After**  | ❌                            |
| **Industry/FAANG**  | ❌                            |
| **Complete Guide**  | ❌                            |
| **Theme**           | Light                        |
| **Primary**         | **#F54A8D**                  |
| **Secondary**       | **#0B1B3D**                  |
| **Gradient**        | ❌                            |
| **Dark theme**      | ❌                            |
| **A4**              | Portrait                     |
| **Desktop**         | Category grid                |
| **Mobile**          | Accordion / stacked          |
| **JSON-driven**     | ✅                            |
| **Responsive**      | ✅                            |
| **Accessible**      | ✅                            |

---

# 56. BestPracticeBlock Progress

Your committed sequence now stands at:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | Rule → Example               | ✅ Complete     |
| **BP2** | Rule → Why                   | ✅ Complete     |
| **BP3** | Do / Don't                   | ✅ Complete     |
| **BP4** | Before / After               | ✅ Complete     |
| **BP5** | Best Practices Checklist     | ✅ **Complete** |
| **BP6** | Industry / FAANG Practices   | ⏳ **NEXT**     |
| BP7     | Complete Best-Practice Guide | ⏳              |

## BP5 is now complete.

The next committed version is:

> **BP6 — Industry / FAANG Practices**.



```python

```

# BLOCK 10 — BestPracticeBlock

## BP6 — Industry / FAANG Practices

Yes. We now continue with the **next committed BestPracticeBlock version**.

| Version | Presentation                   | Status         |
| ------- | ------------------------------ | -------------- |
| BP1     | Rule → Example                 | ✅              |
| BP2     | Rule → Why                     | ✅              |
| BP3     | Do / Don't                     | ✅              |
| BP4     | Before / After                 | ✅              |
| BP5     | Best Practices Checklist       | ✅              |
| **BP6** | **Industry / FAANG Practices** | 🔵 **CURRENT** |
| BP7     | Complete Best-Practice Guide   | ⏳              |

---

# 1. What Is BP6?

**BP6 — Industry / FAANG Practices** connects the programming concept being taught to **professional software-engineering practices used in large-scale engineering environments**.

Its core teaching flow is:

```text
CONCEPT
   ↓
ENGINEERING PRACTICE
   ↓
INDUSTRY CONTEXT
   ↓
WHY PROFESSIONAL TEAMS CARE
   ↓
ENGINEERING STANDARD
```

The purpose is not to say:

> "FAANG companies always do X."

Instead, the block should teach:

> **"Here is how this principle commonly appears in professional engineering environments, and why it matters at scale."**

That distinction is essential.

---

# 2. BP6 Position in the BestPractice Progression

We now have:

```text
BP1
Rule → Example
```

↓

```text
BP2
Rule → Why
```

↓

```text
BP3
Do / Don't
```

↓

```text
BP4
Before / After
```

↓

```text
BP5
Best Practices Checklist
```

↓

```text
BP6
Industry / FAANG Practices
```

↓

```text
BP7
Complete Best-Practice Guide
```

Therefore BP6 is the bridge between:

> **Individual coding practice**

and

> **Professional engineering practice.**

---

# 3. BP6 Core Mental Model

```text
                 PROGRAMMING PRACTICE
                         │
                         ▼
                  ENGINEERING NEED
                         │
                         ▼
                INDUSTRY PRACTICE
                         │
                         ▼
                 SCALE / TEAM IMPACT
                         │
                         ▼
                PROFESSIONAL STANDARD
```

The learner should understand:

> **Why does this practice become even more important when software is developed by teams and operates at scale?**

---

# 4. BP6 What "Industry" Means

Industry does not necessarily mean a specific company.

It can represent practices such as:

```text
Code Review
Testing
CI/CD
Observability
Security
Documentation
Version Control
API Design
Error Handling
Performance
Scalability
Maintainability
Reliability
Team Collaboration
```

These are engineering concerns that become increasingly important as systems and teams grow.

---

# 5. BP6 What "FAANG" Means in This Block

FAANG is used as a **teaching shorthand for large-scale software engineering environments**.

The block should emphasize:

```text
Large Teams
+
Large Codebases
+
Large User Bases
+
Continuous Deployment
+
High Reliability Requirements
```

rather than pretending that every company follows exactly the same rule.

---

# 6. Important BP6 Accuracy Rule

Avoid statements such as:

> "Google always does this."

or:

> "Amazon requires this in every project."

unless the tutorial has authoritative evidence for that exact claim.

Prefer:

> "Large engineering organizations commonly use..."

or:

> "In large-scale software teams, this practice helps..."

or:

> "This principle is commonly reflected in professional engineering workflows..."

This keeps the educational content technically responsible.

---

# 7. BP6 Hero

Recommended title:

# Industry / FAANG Practices

Supporting text:

> See how this programming principle translates into professional software engineering.

Hero:

```text id="4q8z1n"
┌─────────────────────────────────────┐
│          CODING PRACTICE             │
│                                     │
│     Use descriptive names.          │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       INDUSTRY PRACTICE              │
│                                     │
│ Consistent naming conventions       │
│ across large codebases              │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│          TEAM IMPACT                │
│                                     │
│ Easier code review & maintenance    │
└─────────────────────────────────────┘
```

---

# 8. BP6 Primary Learning Objective

After completing BP6, the learner should understand:

```text
"What I learned"
       ↓
"How professionals apply it"
       ↓
"Why it matters at scale"
```

This gives the learner an engineering perspective beyond syntax.

---

# 9. BP6 Example — Descriptive Names

### Programming Practice

> Use descriptive names.

### Industry Practice

> Teams establish consistent naming conventions across shared codebases.

### Why It Matters

```text
Consistent naming
      ↓
Faster code comprehension
      ↓
Easier reviews
      ↓
Lower maintenance cost
```

### Professional Context

In a large codebase, developers regularly read code written by people they did not work with directly.

Therefore:

> **Code must communicate intent to the team, not only to its original author.**

---

# 10. BP6 Example — Code Review

### Programming Practice

> Keep functions focused.

### Industry Practice

> Small, focused units are easier to review and reason about during pull requests.

### Why It Matters

```text
Focused change
      ↓
Smaller review surface
      ↓
Easier review
      ↓
Lower risk of unnoticed problems
```

---

# 11. BP6 Example — Testing

### Programming Practice

> Test important behavior.

### Industry Practice

```text
Code
 ↓
Automated Tests
 ↓
CI Pipeline
 ↓
Pull Request Validation
 ↓
Deployment
```

The practice becomes part of an engineering system rather than an isolated developer action.

---

# 12. BP6 Example — Error Handling

### Programming Practice

> Handle expected exceptions explicitly.

### Industry Practice

Large systems often need:

```text
Expected Failure
      ↓
Controlled Handling
      ↓
Useful Logging / Metrics
      ↓
Observable System Behavior
```

The key professional concept is:

> Failure should be **understandable and observable**, not silently ignored.

---

# 13. BP6 Example — Secrets

### Programming Practice

> Do not hard-code secrets.

### Industry Practice

Professional systems commonly separate:

```text
Source Code
      +
Configuration
      +
Secret Management
```

The exact implementation depends on the organization's infrastructure.

The principle remains:

> Credentials should not be embedded directly into application source code.

---

# 14. BP6 Example — Input Validation

### Programming Practice

> Validate external input.

### Industry Practice

Large systems commonly treat external boundaries as trust boundaries:

```text
Browser
   ↓
API
   ↓
Validation
   ↓
Application
   ↓
Database
```

The principle:

> **Never assume external data automatically satisfies internal constraints.**

---

# 15. BP6 Example — Logging

### Programming Practice

> Handle failures intentionally.

### Industry Practice

Professional systems often require structured observability:

```text
Application
    │
    ├── Logs
    ├── Metrics
    └── Traces
          │
          ▼
     Observability
```

The learner now sees why a simple exception-handling practice becomes an operational concern at scale.

---

# 16. BP6 Example — Performance

### Programming Practice

> Avoid unnecessary computation.

### Industry Practice

At scale:

```text
One unnecessary operation
          ↓
One request
          ↓
Millions of requests
          ↓
Significant infrastructure cost
```

Therefore performance decisions can have system-wide consequences.

But BP6 should also teach:

> **Measure before optimizing when practical.**

---

# 17. BP6 Example — Database Access

### Programming Practice

> Avoid unnecessary repeated database queries.

### Industry Practice

Large applications often pay close attention to:

```text
Query Count
Query Latency
Connection Usage
Indexes
Caching
Data Access Patterns
```

The conceptual progression:

```text
Efficient application code
        ↓
Efficient data access
        ↓
Better system scalability
```

---

# 18. BP6 Example — API Design

### Programming Practice

> Validate API inputs.

### Industry Practice

Professional APIs commonly define:

```text
Request Contract
      ↓
Validation
      ↓
Business Logic
      ↓
Response Contract
```

This allows different teams and services to communicate through predictable contracts.

---

# 19. BP6 Example — Version Control

### Programming Practice

> Make changes in manageable units.

### Industry Practice

Large engineering teams commonly organize development around:

```text
Branch
 ↓
Commit
 ↓
Pull Request
 ↓
Code Review
 ↓
CI
 ↓
Merge
```

This transforms an individual coding habit into a team development workflow.

---

# 20. BP6 Example — Code Duplication

### Programming Practice

> Avoid unnecessary duplication.

### Industry Practice

Large codebases need to control duplication because:

```text
Duplicated logic
      ↓
Multiple maintenance locations
      ↓
Inconsistent fixes
      ↓
Higher long-term cost
```

Therefore maintainability becomes an organizational concern, not merely a style preference.

---

# 21. BP6 Example — Documentation

### Programming Practice

> Document non-obvious behavior.

### Industry Practice

In a large team:

```text
Developer A writes code
        ↓
Developer B maintains it
        ↓
Developer C modifies it
        ↓
Developer D operates it
```

Documentation preserves important context across people and time.

---

# 22. BP6 Example — Testing Pyramid

A BP6 version can introduce a professional testing model:

```text id="j7t4yr"
          ┌─────────────┐
          │    E2E      │
          └─────────────┘
        ┌─────────────────┐
        │  Integration    │
        └─────────────────┘
     ┌───────────────────────┐
     │        Unit Tests     │
     └───────────────────────┘
```

The lesson:

> Different testing levels provide different kinds of confidence.

This is an industry-level perspective rather than merely:

> "Write tests."

---

# 23. BP6 Example — CI/CD

A professional workflow:

```text id="z2qk6x"
Developer
   ↓
Commit
   ↓
Pull Request
   ↓
Automated Tests
   ↓
Build
   ↓
Security Checks
   ↓
Deploy
```

This demonstrates how a coding best practice becomes part of an engineering pipeline.

---

# 24. BP6 Example — Code Review

### Practice

> Keep changes understandable.

### Industry workflow

```text id="p9u4et"
Developer
    ↓
Pull Request
    ↓
Reviewer
    ↓
Feedback
    ↓
Revision
    ↓
Approval
    ↓
Merge
```

The learner understands that code quality is often a **team responsibility**.

---

# 25. BP6 Industry Context Card

A key BP6 component should be:

```text id="i0xk4z"
┌────────────────────────────────────┐
│ INDUSTRY CONTEXT                  │
├────────────────────────────────────┤
│                                    │
│ Large engineering teams rely on   │
│ consistent practices because many │
│ developers may work on the same   │
│ codebase over time.               │
│                                    │
└────────────────────────────────────┘
```

---

# 26. BP6 Scale Card

Another strong component:

```text id="u9d8r1"
┌────────────────────────────────────┐
│ WHY IT MATTERS AT SCALE           │
├────────────────────────────────────┤
│                                    │
│ Individual coding decisions can   │
│ affect thousands of developers,   │
│ services, or millions of requests.│
│                                    │
└────────────────────────────────────┘
```

This is what distinguishes BP6 from BP2.

---

# 27. BP6 Professional Workflow

A strong visual:

```text id="6a6s4h"
                 PRACTICE
                    │
                    ▼
              TEAM WORKFLOW
                    │
                    ▼
              CODE REVIEW
                    │
                    ▼
                  CI
                    │
                    ▼
               DEPLOYMENT
                    │
                    ▼
              OBSERVABILITY
```

This connects coding practices to real engineering systems.

---

# 28. BP6 Desktop Layout

```text id="hm2q8j"
┌──────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                    │
│ Industry / FAANG Practices                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ PRACTICE                                             │
│ Use descriptive names.                               │
│                                                      │
│                    ↓                                 │
│                                                      │
│ INDUSTRY CONTEXT                                     │
│ Consistent naming across shared codebases.           │
│                                                      │
│                    ↓                                 │
│                                                      │
│ WHY IT MATTERS AT SCALE                              │
│ Many developers must understand the same code.       │
│                                                      │
│ ┌────────────────────┐ ┌───────────────────────────┐ │
│ │ TEAM IMPACT        │ │ ENGINEERING WORKFLOW      │ │
│ │ Code Review        │ │ PR → CI → Merge           │ │
│ │ Maintenance        │ │                           │ │
│ └────────────────────┘ └───────────────────────────┘ │
│                                                      │
│ KEY TAKEAWAY                                         │
└──────────────────────────────────────────────────────┘
```

---

# 29. BP6 A4 Portrait Layout

```text id="q9tdfs"
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Industry / FAANG Practices           │
├──────────────────────────────────────┤
│                                      │
│ PRACTICE                             │
│ Use descriptive names.              │
│                                      │
│                 ↓                    │
│                                      │
│ INDUSTRY CONTEXT                     │
│ Consistent naming across teams.      │
│                                      │
│                 ↓                    │
│                                      │
│ WHY IT MATTERS AT SCALE              │
│ Developers must understand code      │
│ written by others.                   │
│                                      │
├──────────────────────────────────────┤
│ TEAM IMPACT                          │
│                                      │
│ • Easier code review                 │
│ • Easier maintenance                │
│ • Better collaboration               │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 30. BP6 Mobile Layout

```text id="4qu0qh"
INDUSTRY / FAANG PRACTICES

PRACTICE

Use descriptive names.

       ↓

INDUSTRY CONTEXT

Consistent naming across
shared codebases.

       ↓

WHY IT MATTERS

Many developers need to
understand the same code.

       ↓

TEAM IMPACT

✓ Code review
✓ Maintenance
✓ Collaboration
```

---

# 31. BP6 Industry Practice Categories

The data model should support:

```text id="c7r8gq"
Code Quality
Code Review
Testing
CI/CD
Security
Reliability
Observability
Performance
Scalability
API Design
Database Practices
Documentation
Version Control
Team Collaboration
Architecture
```

---

# 32. BP6 Professional Maturity Model

A powerful optional visual:

```text id="6f7vbt"
LEVEL 1
Individual Code
      ↓
LEVEL 2
Team Code
      ↓
LEVEL 3
Shared Codebase
      ↓
LEVEL 4
Production System
      ↓
LEVEL 5
Large-Scale System
```

The learner sees how a simple practice grows in importance.

---

# 33. BP6 Example — Naming Across Levels

```text id="6i9r74"
INDIVIDUAL

student_count

        ↓

TEAM

Consistent naming conventions

        ↓

LARGE CODEBASE

Predictable naming across modules

        ↓

LARGE ORGANIZATION

Shared engineering conventions
```

This is an excellent BP6 teaching pattern.

---

# 34. BP6 Example — Testing Across Levels

```text id="5c7k4s"
INDIVIDUAL
Test the function

      ↓

TEAM
Test pull requests

      ↓

PROJECT
Run automated CI

      ↓

PRODUCTION
Monitor regressions
```

The learner understands that testing evolves into a system.

---

# 35. BP6 Example — Error Handling Across Levels

```text id="u4h6t2"
FUNCTION
Handle exception

      ↓

APPLICATION
Return appropriate error

      ↓

SERVICE
Log failure

      ↓

SYSTEM
Monitor failure rate

      ↓

ORGANIZATION
Use incidents to improve reliability
```

This is the kind of engineering depth BP6 should provide.

---

# 36. BP6 Important Distinction

Do not present:

> "FAANG uses this, therefore it is correct."

Instead:

```text id="w6y8oa"
Engineering Problem
       ↓
Engineering Practice
       ↓
Why it works
       ↓
How large teams use it
```

The learner learns the **engineering principle**, not brand worship.

---

# 37. BP6 JSON Schema

```json id="s9z4wp"
{
  "type": "bestPractice",
  "version": "BP6",
  "presentation": "Industry / FAANG Practices",

  "content": {

    "title": "",
    "context": "",

    "practice": {
      "title": "",
      "statement": "",
      "category": ""
    },

    "industryContext": {
      "summary": "",
      "environment": "",
      "scale": ""
    },

    "professionalPractice": {
      "description": "",
      "workflow": [],
      "teamImpact": []
    },

    "engineeringBenefits": [],

    "industryNote": "",

    "takeaway": ""
  }
}
```

---

# 38. BP6 Complete Example JSON

```json id="2d7j4f"
{
  "type": "bestPractice",
  "version": "BP6",
  "presentation": "Industry / FAANG Practices",

  "content": {

    "title": "Descriptive Naming in Professional Codebases",

    "context": "Clear naming becomes increasingly important as codebases and teams grow.",

    "practice": {
      "title": "Use descriptive names",
      "statement": "Choose names that communicate intent.",
      "category": "code-quality"
    },

    "industryContext": {
      "summary": "Large engineering teams work on shared codebases over long periods.",
      "environment": "Multi-developer production codebase",
      "scale": "Large teams and continuously changing systems"
    },

    "professionalPractice": {
      "description": "Teams commonly establish naming conventions and review code for clarity and consistency.",

      "workflow": [
        "Developer writes code",
        "Pull request is created",
        "Reviewer evaluates clarity",
        "Automated checks run",
        "Change is merged"
      ],

      "teamImpact": [
        "Improves code review",
        "Improves collaboration",
        "Reduces maintenance friction"
      ]
    },

    "engineeringBenefits": [
      "Faster code comprehension",
      "More consistent codebases",
      "Easier maintenance"
    ],

    "industryNote": "Specific conventions vary by organization and language; the underlying principle is to make shared code understandable.",

    "takeaway": "Professional engineering practices extend individual coding habits into team-wide standards."
  }
}
```

---

# 39. BP6 Presentation Configuration

```json id="f0r2na"
{
  "presentationConfig": {

    "layout": "industry-practice",

    "desktop": {
      "direction": "horizontal"
    },

    "tablet": {
      "direction": "vertical"
    },

    "mobile": {
      "direction": "vertical"
    },

    "showIndustryContext": true,
    "showProfessionalPractice": true,
    "showTeamImpact": true,
    "showEngineeringBenefits": true,
    "showIndustryNote": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 40. BP6 Semantic Structure

```text id="y9w2mv"
<section>
│
├── header
│
├── practice
│
├── industry-context
│
├── professional-practice
│   ├── description
│   ├── workflow
│   └── team-impact
│
├── engineering-benefits
│
├── industry-note
│
└── takeaway
```

---

# 41. BP6 HTML

```html id="6j0qzi"
<section
    class="tutorial-block best-practice-block best-practice-bp6"
    data-block="bestPractice"
    data-version="BP6"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Industry / FAANG Practices
        </h2>

        <p>
            See how this programming principle
            translates into professional engineering.
        </p>

    </header>


    <section class="practice-card">

        <span>
            PRACTICE
        </span>

        <h3>
            Use descriptive names.
        </h3>

        <p>
            Choose names that communicate intent.
        </p>

    </section>


    <div class="flow-arrow">
        ↓
    </div>


    <section class="industry-context-card">

        <span>
            INDUSTRY CONTEXT
        </span>

        <p>
            Large engineering teams work on shared
            codebases over long periods.
        </p>

    </section>


    <section class="professional-practice">

        <h3>
            Professional Practice
        </h3>

        <p>
            Teams commonly establish naming conventions
            and review code for clarity and consistency.
        </p>

    </section>


    <section class="team-impact">

        <h3>
            Team Impact
        </h3>

        <ul>

            <li>
                Easier code review
            </li>

            <li>
                Better collaboration
            </li>

            <li>
                Easier maintenance
            </li>

        </ul>

    </section>


    <section class="industry-note">

        <h3>
            Industry Note
        </h3>

        <p>
            Specific conventions vary by organization
            and language.
        </p>

    </section>


    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Professional engineering practices extend
            individual coding habits into team-wide standards.
        </p>

    </aside>

</section>
```

---

# 42. BP6 Professional Workflow Component

When relevant, show:

```text id="3m8z3n"
CODE
 ↓
PULL REQUEST
 ↓
CODE REVIEW
 ↓
AUTOMATED CHECKS
 ↓
MERGE
 ↓
DEPLOY
 ↓
MONITOR
```

This is a powerful BP6 visual because it shows where an individual best practice fits into a professional workflow.

---

# 43. BP6 Team Impact Component

Use:

```text id="3sqy5e"
┌───────────────────────────────────┐
│ TEAM IMPACT                      │
├───────────────────────────────────┤
│ ✓ Code review                     │
│ ✓ Collaboration                   │
│ ✓ Maintenance                     │
│ ✓ Knowledge sharing               │
└───────────────────────────────────┘
```

Only include impacts directly supported by the practice.

---

# 44. BP6 Scale Component

Use when scale is relevant:

```text id="b7q3k1"
INDIVIDUAL
     ↓
TEAM
     ↓
CODEBASE
     ↓
PRODUCTION
     ↓
LARGE-SCALE SYSTEM
```

This makes the professional context concrete.

---

# 45. BP6 Industry Note

Every BP6 presentation should have an optional caveat when appropriate:

> **Industry Note:** Specific tools, conventions, and workflows vary by organization. The underlying engineering principle is the important part.

This prevents overgeneralization.

---

# 46. BP6 No Company Logo Wall

Do not make the block:

```text id="v2t6cf"
Google
Amazon
Meta
Apple
Netflix
Microsoft
...
```

just to imply authority.

That is not educationally useful.

Instead:

```text id="0s1x6x"
Engineering Principle
        ↓
Professional Practice
        ↓
Scale / Team Impact
```

is the preferred model.

---

# 47. BP6 When To Mention FAANG

FAANG context is appropriate when it helps explain:

* large codebases
* large engineering teams
* distributed systems
* code review
* automated testing
* CI/CD
* observability
* reliability
* scalability
* security
* engineering standards

It is less appropriate for trivial syntax-level best practices where industry context adds no meaningful value.

---

# 48. BP6 Example — Observability

### Practice

> Log meaningful failures.

### Professional context

```text
Application
   ↓
Structured Logs
   ↓
Centralized Logging
   ↓
Metrics / Alerts
   ↓
Incident Response
```

The learner sees how a simple application practice becomes an operational capability.

---

# 49. BP6 Example — Reliability

### Practice

> Handle failure explicitly.

Professional model:

```text
Failure
  ↓
Detect
  ↓
Handle
  ↓
Record
  ↓
Alert if necessary
  ↓
Recover
```

This is much deeper than simply:

```python id="qcmw2d"
try:
    ...
except:
    pass
```

---

# 50. BP6 Example — Security

### Practice

> Validate external input.

Professional model:

```text
External Request
      ↓
Authentication
      ↓
Authorization
      ↓
Validation
      ↓
Business Logic
      ↓
Data Access
```

The exact ordering can vary by architecture; the point is that security becomes a system-level concern.

---

# 51. BP6 Example — Maintainability

### Practice

> Keep responsibilities focused.

Professional architecture:

```text
UI
 ↓
Service
 ↓
Repository
 ↓
Database
```

The learner begins to understand separation of responsibilities beyond a single function.

---

# 52. BP6 Example — Code Review Quality

### Practice

> Keep changes focused.

Professional workflow:

```text
Focused Change
      ↓
Focused Pull Request
      ↓
Focused Review
      ↓
Clearer Feedback
      ↓
Safer Merge
```

This is an excellent example of how an individual coding practice affects an entire engineering process.

---

# 53. BP6 Final Mental Model

```text id="e4u4s4"
                BEST PRACTICE
                       │
                       ▼
              PROFESSIONAL USE
                       │
                       ▼
                 TEAM EFFECT
                       │
                       ▼
                 SYSTEM EFFECT
                       │
                       ▼
               ENGINEERING VALUE
```

The learner should finish thinking:

> **“This is not just a coding rule. I can see why professional engineering teams care about it.”**

---

# 54. BP6 Final Technical Specification

| Area                        | BP6 Decision                                         |
| --------------------------- | ---------------------------------------------------- |
| **Block**                   | **BestPracticeBlock**                                |
| **Version**                 | **BP6**                                              |
| **Presentation**            | **Industry / FAANG Practices**                       |
| **Primary purpose**         | Connect coding practices to professional engineering |
| **Practice**                | Required                                             |
| **Industry Context**        | Required                                             |
| **Professional Practice**   | Required                                             |
| **Team Impact**             | Recommended                                          |
| **Scale Impact**            | Recommended                                          |
| **Engineering Benefits**    | Recommended                                          |
| **Industry Note**           | Recommended                                          |
| **Company-specific claims** | Avoid unless verified                                |
| **FAANG name-dropping**     | ❌                                                    |
| **Rule → Example**          | ❌                                                    |
| **Rule → Why**              | ❌                                                    |
| **Do / Don't**              | ❌                                                    |
| **Before / After**          | ❌                                                    |
| **Checklist**               | ❌                                                    |
| **Complete Guide**          | ❌                                                    |
| **Theme**                   | Light                                                |
| **Primary**                 | **#F54A8D**                                          |
| **Secondary**               | **#0B1B3D**                                          |
| **Gradient**                | ❌                                                    |
| **Dark theme**              | ❌                                                    |
| **A4**                      | Portrait                                             |
| **Desktop**                 | Flow / cards                                         |
| **Mobile**                  | Stacked                                              |
| **JSON-driven**             | ✅                                                    |
| **Responsive**              | ✅                                                    |
| **Accessible**              | ✅                                                    |

---

# 55. BestPracticeBlock Progress

Your **committed** sequence now stands at:

| Version | Presentation                 | Status         |
| ------- | ---------------------------- | -------------- |
| **BP1** | Rule → Example               | ✅ Complete     |
| **BP2** | Rule → Why                   | ✅ Complete     |
| **BP3** | Do / Don't                   | ✅ Complete     |
| **BP4** | Before / After               | ✅ Complete     |
| **BP5** | Best Practices Checklist     | ✅ Complete     |
| **BP6** | Industry / FAANG Practices   | ✅ **Complete** |
| **BP7** | Complete Best-Practice Guide | ⏳ **NEXT**     |

## BP6 is now complete.

The next and final committed version of **BestPracticeBlock** is:

> **BP7 — Complete Best-Practice Guide**.



```python

```

# BLOCK 10 — BestPracticeBlock

## BP7 — Complete Best-Practice Guide

Yes. We now reach the **final committed version of BestPracticeBlock**.

| Version | Presentation                     | Status                 |
| ------- | -------------------------------- | ---------------------- |
| BP1     | Rule → Example                   | ✅                      |
| BP2     | Rule → Why                       | ✅                      |
| BP3     | Do / Don't                       | ✅                      |
| BP4     | Before / After                   | ✅                      |
| BP5     | Best Practices Checklist         | ✅                      |
| BP6     | Industry / FAANG Practices       | ✅                      |
| **BP7** | **Complete Best-Practice Guide** | 🔵 **CURRENT / FINAL** |

---

# 1. What Is BP7?

**BP7 — Complete Best-Practice Guide** is the **comprehensive version** of BestPracticeBlock.

Unlike BP1–BP6, which each have one focused pedagogical purpose, BP7 can combine the relevant best-practice perspectives into one complete learning experience.

The core model is:

```text
RULE
  ↓
EXAMPLE
  ↓
WHY
  ↓
DO / DON'T
  ↓
BEFORE / AFTER
  ↓
CHECKLIST
  ↓
INDUSTRY PRACTICE
  ↓
FINAL TAKEAWAY
```

But this does **not** mean every BP7 instance must mechanically contain every section.

The author should include only the sections relevant to the topic.

---

# 2. Why BP7 Exists

BP1–BP6 each answer a different question:

```text
BP1 → How?
BP2 → Why?
BP3 → Which approach?
BP4 → How can I improve it?
BP5 → Did I review it?
BP6 → How is it used professionally?
```

BP7 brings these perspectives together:

```text
                BEST PRACTICE
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
     LEARN          APPLY          REVIEW
       │              │              │
       ▼              ▼              ▼
    EXAMPLE       TRANSFORM      CHECKLIST
       │              │              │
       └──────────────┼──────────────┘
                      ▼
               PROFESSIONAL USE
```

---

# 3. BP7 Primary Learning Objective

The learner should finish BP7 able to answer:

> **What is the best practice, why does it matter, how should I apply it, what should I avoid, how can I improve existing code, how do I review my implementation, and how does this principle appear in professional engineering?**

That makes BP7 the **complete reference presentation**.

---

# 4. BP7 Is NOT Simply "Everything on One Page"

This is very important.

A bad BP7 would be:

```text
Rule
Example
Why
Do
Don't
Before
After
20 checklist items
10 industry practices
...
```

with no structure.

That creates information overload.

Instead BP7 should use a **clear progressive structure**:

```text
1. Understand
2. See
3. Reason
4. Compare
5. Improve
6. Review
7. Professionalize
```

---

# 5. BP7 Complete Learning Flow

```text
┌─────────────────────────────┐
│ 1. BEST PRACTICE            │
│ What should I do?           │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 2. EXAMPLE                  │
│ What does it look like?     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 3. WHY                      │
│ Why does it matter?         │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 4. DO / DON'T               │
│ What should I avoid?        │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 5. BEFORE / AFTER           │
│ How can I improve code?     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 6. CHECKLIST                │
│ Did I apply it?             │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 7. INDUSTRY CONTEXT         │
│ How does it scale?          │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 8. TAKEAWAY                 │
│ What should I remember?     │
└─────────────────────────────┘
```

---

# 6. BP7 Section 1 — Best Practice

Start with the fundamental rule.

Example:

> **Use descriptive variable names that communicate intent.**

The learner should immediately know the practice being taught.

```text
BEST PRACTICE

Use descriptive variable names.
```

---

# 7. BP7 Section 2 — Rule → Example

Show a concise example.

### Example

```python
student_count = 25
```

The example should reinforce the rule.

Do not overwhelm this section with a large code listing.

---

# 8. BP7 Section 3 — Why

Explain the engineering reasoning.

### Why?

> Descriptive names communicate intent and reduce the mental effort required to understand and maintain code.

Mental model:

```text
Clear name
   ↓
Clear intent
   ↓
Less ambiguity
   ↓
Easier maintenance
```

This incorporates the core teaching purpose of **BP2**.

---

# 9. BP7 Section 4 — Do / Don't

Now show the contrast.

```text
DO

student_count = 25
```

versus:

```text
DON'T

x = 25
```

The point is not merely that `x` is "wrong."

The point is:

> The second name provides less information about intent.

This incorporates the core mechanism of **BP3**.

---

# 10. BP7 Section 5 — Before / After

Show a realistic transformation.

### Before

```python
x = 25
```

### After

```python
student_count = 25
```

### Improvement

> The new name makes the meaning of the value explicit.

This incorporates **BP4**.

---

# 11. BP7 Section 6 — Checklist

Now ask the learner to review their implementation.

```text
BEST-PRACTICE CHECKLIST

□ Are variable names descriptive?

□ Do names communicate intent?

□ Are ambiguous abbreviations avoided?

□ Are related names consistent?

□ Can another developer understand
  the code without guessing?
```

This incorporates **BP5**.

---

# 12. BP7 Section 7 — Industry Context

Now connect the practice to professional engineering.

### Industry Context

> In large shared codebases, developers regularly maintain code written by other people. Consistent, intention-revealing names reduce the effort required to understand and review that code.

Professional workflow:

```text
Developer
   ↓
Code
   ↓
Pull Request
   ↓
Code Review
   ↓
Team Maintenance
```

This incorporates **BP6**.

---

# 13. BP7 Section 8 — Final Takeaway

Finish with one memorable principle:

> **Good code communicates intent to the next developer.**

This gives the learner a concise mental anchor.

---

# 14. BP7 Complete Example

## Best Practice

> Use descriptive variable names.

### Example

```python
student_count = 25
```

### Why?

> Descriptive names communicate intent and make code easier to understand and maintain.

### Do

```python
student_count = 25
```

### Don't

```python
x = 25
```

### Before

```python
x = 25
```

### After

```python
student_count = 25
```

### Improvement

> The variable's purpose is immediately visible.

### Checklist

```text
□ Name communicates intent
□ Naming is consistent
□ Ambiguous names are avoided
□ Another developer can understand the variable
```

### Industry Context

> Shared production code is maintained by many developers over time, so clear naming becomes a team-level maintainability concern.

### Takeaway

> **Prefer names that communicate intent.**

That is a complete BP7 instance.

---

# 15. BP7 Architecture

The recommended architecture is:

```text
                         BP7
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
   UNDERSTAND          APPLY              REVIEW
       │                  │                  │
       ├─ Rule            ├─ Do/Don't       ├─ Checklist
       ├─ Example         └─ Before/After   └─ Takeaway
       └─ Why
                          │
                          ▼
                  PROFESSIONAL CONTEXT
```

---

# 16. BP7 Section Ordering

The preferred order is:

```text
1. Header
2. Best Practice
3. Example
4. Why
5. Do / Don't
6. Before / After
7. Checklist
8. Industry / Professional Context
9. Key Takeaway
```

This order should remain consistent unless the content genuinely requires another sequence.

---

# 17. BP7 Desktop Layout

Recommended:

```text
┌──────────────────────────────────────────────────────────┐
│ BESTPRACTICEBLOCK                                        │
│ Complete Best-Practice Guide                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ BEST PRACTICE                                            │
│ Use descriptive variable names.                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ EXAMPLE                                                  │
│ student_count = 25                                      │
├──────────────────────────────────────────────────────────┤
│ WHY                                                      │
│ Descriptive names communicate intent.                   │
├─────────────────────────┬────────────────────────────────┤
│ DO                      │ DON'T                         │
│ student_count = 25      │ x = 25                        │
├─────────────────────────┴────────────────────────────────┤
│                                                          │
│ BEFORE                      → AFTER                      │
│ x = 25                         student_count = 25         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ CHECKLIST                                                │
│ □ Descriptive names                                     │
│ □ Clear intent                                          │
│ □ Consistent naming                                     │
├──────────────────────────────────────────────────────────┤
│ INDUSTRY CONTEXT                                        │
│ Shared codebases require readable, maintainable code.   │
├──────────────────────────────────────────────────────────┤
│ KEY TAKEAWAY                                             │
│ Good code communicates intent.                          │
└──────────────────────────────────────────────────────────┘
```

---

# 18. BP7 A4 Portrait Layout

```text
┌──────────────────────────────────────┐
│ BESTPRACTICEBLOCK                    │
│ Complete Best-Practice Guide         │
├──────────────────────────────────────┤
│                                      │
│ BEST PRACTICE                        │
│ Use descriptive variable names.      │
│                                      │
│ EXAMPLE                              │
│ student_count = 25                   │
│                                      │
│ WHY                                  │
│ Names communicate intent.            │
│                                      │
│ DO                                   │
│ student_count = 25                   │
│                                      │
│ DON'T                                │
│ x = 25                               │
│                                      │
│ BEFORE                               │
│ x = 25                               │
│                                      │
│ ↓                                    │
│                                      │
│ AFTER                                │
│ student_count = 25                   │
│                                      │
│ CHECKLIST                            │
│ □ Descriptive name                   │
│ □ Clear intent                       │
│ □ Consistent naming                  │
│                                      │
│ INDUSTRY CONTEXT                     │
│ Shared codebases require clarity.    │
│                                      │
├──────────────────────────────────────┤
│ KEY TAKEAWAY                         │
└──────────────────────────────────────┘
```

---

# 19. BP7 Mobile Layout

The content becomes a guided vertical flow:

```text
BESTPRACTICEBLOCK

COMPLETE BEST-PRACTICE GUIDE

        ↓

BEST PRACTICE

Use descriptive variable names.

        ↓

EXAMPLE

student_count = 25

        ↓

WHY?

Names communicate intent.

        ↓

DO

student_count = 25

        ↓

DON'T

x = 25

        ↓

BEFORE

x = 25

        ↓

AFTER

student_count = 25

        ↓

CHECKLIST

□ Descriptive names
□ Clear intent
□ Consistent naming

        ↓

INDUSTRY CONTEXT

Shared codebases require clarity.

        ↓

KEY TAKEAWAY
```

---

# 20. BP7 Navigation

Because BP7 can become long, a small internal navigation component can help:

```text
Guide
├── Practice
├── Why
├── Examples
├── Improvement
├── Checklist
├── Industry
└── Takeaway
```

On desktop, this can appear as a compact side navigation.

On mobile, it can become:

```text
[ Sections ▾ ]
```

---

# 21. BP7 Progress Indicator

Optional:

```text
1  Practice
2  Why
3  Compare
4  Improve
5  Review
6  Industry
7  Takeaway
```

This is useful for long BP7 blocks.

However, it should represent **content navigation**, not learner mastery.

---

# 22. BP7 Section Cards

Each section can use a consistent card pattern:

```text
┌────────────────────────────────┐
│ SECTION LABEL                  │
│                                │
│ Content                        │
│                                │
└────────────────────────────────┘
```

For example:

```text
┌────────────────────────────────┐
│ WHY                            │
├────────────────────────────────┤
│ Descriptive names communicate  │
│ intent and improve readability.│
└────────────────────────────────┘
```

This gives the long block visual rhythm.

---

# 23. BP7 JSON Schema

The BP7 data model should compose the previous presentation concepts without duplicating their schemas unnecessarily.

```json
{
  "type": "bestPractice",
  "version": "BP7",
  "presentation": "Complete Best-Practice Guide",

  "content": {

    "title": "",
    "context": "",

    "practice": {
      "title": "",
      "statement": "",
      "category": ""
    },

    "example": {
      "enabled": true,
      "language": "python",
      "source": "",
      "explanation": ""
    },

    "why": {
      "summary": "",
      "reasoning": "",
      "benefits": []
    },

    "doDont": {
      "enabled": true,
      "do": {
        "language": "python",
        "source": "",
        "explanation": ""
      },
      "dont": {
        "language": "python",
        "source": "",
        "explanation": ""
      }
    },

    "beforeAfter": {
      "enabled": true,
      "before": {
        "language": "python",
        "source": ""
      },
      "change": "",
      "after": {
        "language": "python",
        "source": ""
      },
      "improvement": ""
    },

    "checklist": {
      "enabled": true,
      "categories": []
    },

    "industry": {
      "enabled": true,
      "context": "",
      "professionalPractice": "",
      "teamImpact": [],
      "engineeringBenefits": [],
      "industryNote": ""
    },

    "takeaway": ""
  }
}
```

---

# 24. BP7 Complete JSON Example

```json
{
  "type": "bestPractice",
  "version": "BP7",
  "presentation": "Complete Best-Practice Guide",

  "content": {

    "title": "Use Descriptive Variable Names",

    "context": "Clear names make code easier to understand and maintain.",

    "practice": {
      "title": "Use descriptive variable names",
      "statement": "Choose names that clearly communicate what a value represents.",
      "category": "readability"
    },

    "example": {
      "enabled": true,
      "language": "python",
      "source": "student_count = 25",
      "explanation": "The name communicates the meaning of the value."
    },

    "why": {
      "summary": "Descriptive names communicate intent.",
      "reasoning": "A reader can understand what a value represents without inferring its meaning from surrounding code.",
      "benefits": [
        "Improves readability",
        "Reduces ambiguity",
        "Makes debugging easier",
        "Improves maintainability"
      ]
    },

    "doDont": {
      "enabled": true,

      "do": {
        "language": "python",
        "source": "student_count = 25",
        "explanation": "The name communicates intent."
      },

      "dont": {
        "language": "python",
        "source": "x = 25",
        "explanation": "The name does not communicate what the value represents."
      }
    },

    "beforeAfter": {
      "enabled": true,

      "before": {
        "language": "python",
        "source": "x = 25"
      },

      "change": "Replace the ambiguous name with an intention-revealing name.",

      "after": {
        "language": "python",
        "source": "student_count = 25"
      },

      "improvement": "The purpose of the value is immediately visible."
    },

    "checklist": {
      "enabled": true,

      "categories": [
        {
          "id": "naming",
          "title": "Naming",

          "items": [
            {
              "id": "descriptive",
              "label": "Use descriptive names.",
              "required": true
            },
            {
              "id": "intent",
              "label": "Make intent clear.",
              "required": true
            },
            {
              "id": "consistent",
              "label": "Keep related names consistent.",
              "required": true
            }
          ]
        }
      ]
    },

    "industry": {
      "enabled": true,

      "context": "Large engineering teams maintain shared codebases over long periods.",

      "professionalPractice": "Teams commonly establish naming conventions and review code for clarity.",

      "teamImpact": [
        "Easier code review",
        "Better collaboration",
        "Easier maintenance"
      ],

      "engineeringBenefits": [
        "Lower ambiguity",
        "Faster code comprehension",
        "More consistent codebases"
      ],

      "industryNote": "Specific naming conventions vary by organization and language."
    },

    "takeaway": "Good code communicates intent to the next developer."
  }
}
```

---

# 25. BP7 Presentation Configuration

```json
{
  "presentationConfig": {

    "layout": "complete-guide",

    "desktop": {
      "navigation": "side",
      "sectionLayout": "stacked"
    },

    "tablet": {
      "navigation": "top",
      "sectionLayout": "stacked"
    },

    "mobile": {
      "navigation": "dropdown",
      "sectionLayout": "stacked"
    },

    "sections": {
      "practice": true,
      "example": true,
      "why": true,
      "doDont": true,
      "beforeAfter": true,
      "checklist": true,
      "industry": true,
      "takeaway": true
    },

    "interactiveChecklist": true,
    "showProgress": true,

    "theme": "light",

    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D"

  }
}
```

---

# 26. BP7 Semantic Structure

```text
<section>
│
├── header
│
├── practice-section
│
├── example-section
│
├── why-section
│
├── do-dont-section
│
├── before-after-section
│
├── checklist-section
│
├── industry-section
│
└── takeaway-section
```

This is intentionally modular.

A renderer can omit sections whose `enabled` value is false.

---

# 27. BP7 HTML

```html
<section
    class="tutorial-block best-practice-block best-practice-bp7"
    data-block="bestPractice"
    data-version="BP7"
>

    <header class="best-practice-header">

        <span class="best-practice-eyebrow">
            BESTPRACTICEBLOCK
        </span>

        <h2 class="best-practice-title">
            Complete Best-Practice Guide
        </h2>

        <p>
            Learn, apply, review, and understand
            the professional context of this practice.
        </p>

    </header>


    <!-- 1. PRACTICE -->

    <section class="practice-section">

        <span>
            BEST PRACTICE
        </span>

        <h3>
            Use descriptive variable names.
        </h3>

        <p>
            Choose names that clearly communicate
            what a value represents.
        </p>

    </section>


    <!-- 2. EXAMPLE -->

    <section class="example-section">

        <span>
            EXAMPLE
        </span>

        <pre><code>
student_count = 25
        </code></pre>

    </section>


    <!-- 3. WHY -->

    <section class="why-section">

        <span>
            WHY?
        </span>

        <h3>
            Descriptive names communicate intent.
        </h3>

        <p>
            A reader can understand what a value
            represents without having to infer
            its meaning.
        </p>

    </section>


    <!-- 4. DO / DON'T -->

    <section class="do-dont-section">

        <article>

            <span>
                DO
            </span>

            <pre><code>
student_count = 25
            </code></pre>

        </article>


        <article>

            <span>
                DON'T
            </span>

            <pre><code>
x = 25
            </code></pre>

        </article>

    </section>


    <!-- 5. BEFORE / AFTER -->

    <section class="before-after-section">

        <span>
            BEFORE
        </span>

        <pre><code>
x = 25
        </code></pre>


        <div>
            ↓
        </div>


        <span>
            AFTER
        </span>

        <pre><code>
student_count = 25
        </code></pre>


        <p>
            The variable name now communicates intent.
        </p>

    </section>


    <!-- 6. CHECKLIST -->

    <section class="checklist-section">

        <h3>
            Best Practices Checklist
        </h3>

        <label>
            <input type="checkbox">
            Use descriptive names.
        </label>

        <label>
            <input type="checkbox">
            Make intent clear.
        </label>

        <label>
            <input type="checkbox">
            Keep related names consistent.
        </label>

    </section>


    <!-- 7. INDUSTRY -->

    <section class="industry-section">

        <span>
            INDUSTRY CONTEXT
        </span>

        <p>
            Large engineering teams maintain shared
            codebases over long periods.
        </p>

        <h4>
            Team Impact
        </h4>

        <ul>

            <li>
                Easier code review
            </li>

            <li>
                Better collaboration
            </li>

            <li>
                Easier maintenance
            </li>

        </ul>

    </section>


    <!-- 8. TAKEAWAY -->

    <aside class="best-practice-takeaway">

        <h3>
            Key Takeaway
        </h3>

        <p>
            Good code communicates intent
            to the next developer.
        </p>

    </aside>

</section>
```

---

# 28. BP7 Progressive Disclosure

BP7 can become information-heavy, so progressive disclosure is important.

Desktop:

```text
Practice
Example
Why
Do / Don't
Before / After
Checklist
Industry
Takeaway
```

Mobile:

```text
Practice
▼

Why
▼

Examples
▼

Review
▼

Industry
▼

Takeaway
```

Sections can be collapsible when appropriate.

However, the **primary practice and takeaway should remain visible**.

---

# 29. BP7 Section Importance

Not every section has equal priority.

Recommended hierarchy:

```text
PRIMARY
├── Practice
└── Takeaway

SECONDARY
├── Why
├── Example
└── Before / After

SUPPORTING
├── Do / Don't
├── Checklist
└── Industry Context
```

The exact visual weight can change based on tutorial context.

---

# 30. BP7 Optional Sections

BP7 should support:

```json
{
  "example": {
    "enabled": false
  },

  "beforeAfter": {
    "enabled": false
  }
}
```

For example, if a best practice is conceptual rather than code-based, Before/After may not be useful.

This is important for the reusable Tutorial Engine architecture.

---

# 31. BP7 Example — Exception Handling

A complete BP7 could be:

### Practice

> Catch specific exceptions when the failure is known.

### Example

```python
try:
    value = int(user_input)
except ValueError:
    handle_invalid_number()
```

### Why?

> Specific handling makes failure behavior more predictable and avoids silently swallowing unrelated errors.

### Do

```python
except ValueError:
```

### Don't

```python
except:
    pass
```

### Before

```python
try:
    value = int(user_input)
except:
    pass
```

### After

```python
try:
    value = int(user_input)
except ValueError:
    handle_invalid_number()
```

### Checklist

```text
□ Expected failures are identified
□ Specific exceptions are handled
□ Exceptions are not silently swallowed
□ Error behavior is understandable
□ Important failure paths are tested
```

### Industry Context

> Production systems need failures to be understandable, observable, and actionable.

### Takeaway

> **Handle known failures deliberately.**

That is a complete BP7 learning experience.

---

# 32. BP7 Example — Security

### Practice

> Never hard-code secrets in source code.

### Example

```python
api_key = os.environ["API_KEY"]
```

### Why?

> Source code may be committed, shared, or exposed.

### Do

```python
api_key = os.environ["API_KEY"]
```

### Don't

```python
api_key = "secret-value"
```

### Before

```python
api_key = "secret-value"
```

### After

```python
api_key = os.environ["API_KEY"]
```

### Checklist

```text
□ No credentials in source code
□ Secrets are externally managed
□ Sensitive configuration is separated
□ Access to secrets is controlled
```

### Industry Context

```text
Application
    ↓
Secret Management
    ↓
Runtime Configuration
```

### Takeaway

> **Treat secrets as configuration, not source code.**

---

# 33. BP7 Example — Testing

### Practice

> Test important behavior.

### Example

```python
assert calculate_total([10, 20]) == 30
```

### Why?

Tests provide repeatable evidence that expected behavior continues to work.

### Do

```text
Test normal behavior
Test edge cases
Test important failures
```

### Don't

```text
Assume correctness because the code looks right.
```

### Before

```text
Code
 ↓
Manual confidence
```

### After

```text
Code
 ↓
Automated tests
 ↓
Repeatable verification
```

### Checklist

```text
□ Normal case tested
□ Boundary case considered
□ Failure case considered
□ Regression risk considered
```

### Industry Context

```text
Developer
 ↓
Pull Request
 ↓
CI
 ↓
Automated Tests
 ↓
Merge
```

### Takeaway

> **Tests turn expected behavior into repeatable evidence.**

---

# 34. BP7 Industry Accuracy Rule

BP7 inherits the important rule from BP6:

Do not state unsupported claims such as:

> "Every FAANG company uses exactly this workflow."

Instead:

> "Large engineering organizations commonly use automated testing, code review, and CI workflows to reduce integration and regression risk."

The principle matters more than the company name.

---

# 35. BP7 Design Principle

The complete guide should feel like:

```text
LEARNING PAGE
      +
REFERENCE PAGE
      +
SELF-REVIEW PAGE
```

rather than:

```text
LONG ARTICLE
```

This distinction should guide the frontend implementation.

---

# 36. BP7 Visual Rhythm

Use alternating content densities:

```text
Practice
   ↓
Code
   ↓
Explanation
   ↓
Comparison
   ↓
Transformation
   ↓
Checklist
   ↓
Industry
   ↓
Takeaway
```

This prevents the page from becoming a continuous wall of text.

---

# 37. BP7 Color System

Continue the established project design system.

### Primary

**#F54A8D**

Use for:

* key emphasis
* section accents
* interactive states
* important labels

### Secondary

**#0B1B3D**

Use for:

* headings
* body structure
* code areas
* primary text

### Background

Keep the page **light**.

No dark theme.

No gradient dependency.

---

# 38. BP7 Card Design

Use subtle cards:

```text
┌──────────────────────────────────┐
│ SECTION                          │
│                                  │
│ Content                          │
└──────────────────────────────────┘
```

Recommended characteristics:

* rounded corners
* subtle border
* soft shadow
* generous spacing
* clear hierarchy
* no excessive decoration

The content remains the visual focus.

---

# 39. BP7 Code Block

Code should remain readable:

```text
┌────────────────────────────────────┐
│ Python                             │
├────────────────────────────────────┤
│ student_count = 25                 │
└────────────────────────────────────┘
```

For Before/After:

```text
┌──────────────────┐   ┌──────────────────┐
│ BEFORE           │ → │ AFTER            │
│ x = 25           │   │ student_count=25 │
└──────────────────┘   └──────────────────┘
```

---

# 40. BP7 Responsive Strategy

### Desktop

```text
Wide
↓
Side navigation
↓
Two-column comparisons
```

### Tablet

```text
Reduced width
↓
Stack sections
↓
Limited two-column usage
```

### Mobile

```text
Single column
↓
Collapsible sections
↓
Full-width code
↓
Large touch targets
```

---

# 41. BP7 Accessibility

The complete guide must support:

```text
Keyboard navigation
Screen readers
Semantic headings
Accessible form controls
Readable contrast
Code selection
Responsive text
```

Checklist controls should use real form controls.

Collapsible sections should expose their expanded/collapsed state correctly.

---

# 42. BP7 Content Authoring Rules

A BP7 author should ask:

```text
1. What is the practice?
2. What example proves it?
3. Why does it matter?
4. What should the learner avoid?
5. How can existing code be improved?
6. How can the learner review their own code?
7. How does the principle appear professionally?
8. What is the one takeaway?
```

If a question isn't relevant, that section can be omitted.

---

# 43. BP7 Avoid Information Overload

A BP7 guide should be comprehensive but **not unnecessarily exhaustive**.

For example:

```text
Good BP7

1 practice
1–2 examples
1 reasoning section
1–2 comparisons
1 transformation
5–10 checklist items
1 industry context
1 takeaway
```

Not:

```text
20 rules
50 examples
40 checklist items
15 industry practices
```

The latter should be broken into multiple tutorial blocks.

---

# 44. BP7 Reuse of Previous Versions

The renderer can conceptually reuse the visual components created for earlier versions:

```text
BP1 component
     ↓
ExampleSection

BP2 component
     ↓
WhySection

BP3 component
     ↓
DoDontSection

BP4 component
     ↓
BeforeAfterSection

BP5 component
     ↓
ChecklistSection

BP6 component
     ↓
IndustrySection
```

Then:

```text
BP7
=
Composition of these concepts
```

This is architecturally valuable.

---

# 45. BP7 Component Architecture

Recommended conceptual component tree:

```text
BestPracticeBP7
│
├── BestPracticeHeader
│
├── PracticeSection
│
├── ExampleSection
│
├── WhySection
│
├── DoDontSection
│
├── BeforeAfterSection
│
├── ChecklistSection
│
├── IndustryPracticeSection
│
└── TakeawaySection
```

This keeps BP7 modular.

---

# 46. BP7 Rendering Logic

Conceptually:

```typescript
if (content.practice) {
    renderPractice();
}

if (content.example?.enabled) {
    renderExample();
}

if (content.why) {
    renderWhy();
}

if (content.doDont?.enabled) {
    renderDoDont();
}

if (content.beforeAfter?.enabled) {
    renderBeforeAfter();
}

if (content.checklist?.enabled) {
    renderChecklist();
}

if (content.industry?.enabled) {
    renderIndustry();
}

if (content.takeaway) {
    renderTakeaway();
}
```

This allows BP7 to remain flexible.

---

# 47. BP7 Data-Driven Principle

The JSON should describe:

> **What content exists.**

The renderer should determine:

> **How that content is presented.**

Therefore:

```text
JSON
 ↓
BP7 Renderer
 ↓
Responsive UI
```

rather than hard-coding the content into the frontend.

---

# 48. BP7 Validation Rules

A BP7 validator can require:

```text
type === "bestPractice"
version === "BP7"
practice exists
takeaway exists
```

Optional sections can be validated only when enabled.

For example:

```text
beforeAfter.enabled === true
        ↓
before required
after required
change required
```

Similarly:

```text
checklist.enabled === true
        ↓
categories required
```

---

# 49. BP7 Final Mental Model

```text
                    BP7
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
   UNDERSTAND       APPLY          REVIEW
      │              │              │
      ▼              ▼              ▼
 Rule / Why      Do / Don't      Checklist
 Example         Before/After
      │              │              │
      └──────────────┼──────────────┘
                     ▼
              INDUSTRY CONTEXT
                     │
                     ▼
                TAKEAWAY
```

The complete learning journey is:

> **Understand → Apply → Improve → Review → Professionalize.**

---

# 50. BP7 Final Technical Specification

| Area                       | BP7 Decision                                   |
| -------------------------- | ---------------------------------------------- |
| **Block**                  | **BestPracticeBlock**                          |
| **Version**                | **BP7**                                        |
| **Presentation**           | **Complete Best-Practice Guide**               |
| **Primary purpose**        | Comprehensive best-practice learning/reference |
| **Practice**               | Required                                       |
| **Example**                | Optional                                       |
| **Why**                    | Recommended                                    |
| **Do / Don't**             | Optional                                       |
| **Before / After**         | Optional                                       |
| **Checklist**              | Optional / recommended                         |
| **Industry Context**       | Optional / recommended                         |
| **Takeaway**               | **Required**                                   |
| **Progressive disclosure** | Recommended                                    |
| **Interactive checklist**  | Supported                                      |
| **Side navigation**        | Desktop                                        |
| **Accordion**              | Mobile                                         |
| **Theme**                  | Light                                          |
| **Primary**                | **#F54A8D**                                    |
| **Secondary**              | **#0B1B3D**                                    |
| **Gradient**               | ❌                                              |
| **Dark theme**             | ❌                                              |
| **A4**                     | Portrait                                       |
| **Desktop**                | Structured multi-section                       |
| **Mobile**                 | Single-column progressive flow                 |
| **JSON-driven**            | ✅                                              |
| **Responsive**             | ✅                                              |
| **Accessible**             | ✅                                              |

---

# 51. BestPracticeBlock — ALL 7 VERSIONS COMPLETE

Your committed **BestPracticeBlock** sequence is now:

|  # | Version | Presentation                 | Status |
| -: | ------- | ---------------------------- | ------ |
|  1 | **BP1** | Rule → Example               | ✅      |
|  2 | **BP2** | Rule → Why                   | ✅      |
|  3 | **BP3** | Do / Don't                   | ✅      |
|  4 | **BP4** | Before / After               | ✅      |
|  5 | **BP5** | Best Practices Checklist     | ✅      |
|  6 | **BP6** | Industry / FAANG Practices   | ✅      |
|  7 | **BP7** | Complete Best-Practice Guide | ✅      |

## BestPracticeBlock is now CLOSED/COMPLETE.

The important architectural distinction is:

```text
BP1  → Teach the practice
BP2  → Explain the reasoning
BP3  → Contrast approaches
BP4  → Show improvement
BP5  → Enable self-review
BP6  → Connect to professional engineering
BP7  → Combine the complete learning journey
```

So we should **not invent BP8, BP9, etc.** for BestPracticeBlock unless you explicitly decide to change the committed architecture.

### Next block in your committed 18-block sequence

```text
10. BestPracticeBlock
   BP1–BP7 ✅ COMPLETE

11. SummaryBlock
   S1–S6
```

Therefore, the next development target is:

> **#11 SummaryBlock — S1: Key Points Summary**.



```python

```


```python

```
