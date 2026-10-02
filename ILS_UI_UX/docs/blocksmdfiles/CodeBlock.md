Yes. We have completed **DefinitionBlock D1–D8**.

The next block in the final Tutorial Block Architecture is **CodeBlock**, so we now start with **C1 — Basic Code Example** and handle it exactly the same way: one version at a time, with detailed structure, HTML tags, SUIA color allocation, information rules, JSON model, A4 portrait layout, responsive behavior, and clear separation from the other block types.

# BLOCK 4 — CodeBlock

# C1 — Basic Code Example

### Version definition

| Item                     | C1                                                   |
| ------------------------ | ---------------------------------------------------- |
| **Name**                 | **Basic Code Example**                               |
| **Structure**            | **Code → Output**                                    |
| **Best For**             | Simple syntax                                        |
| Primary learner question | **“What does this code do?”**                        |
| Learning level           | Beginner → Intermediate                              |
| Complexity               | Very low                                             |
| Main purpose             | Show a small piece of executable code and its result |

The canonical C1 model is:

```text
CODE
  ↓
OUTPUT
```

That is all C1 needs.

---

# 1. Purpose of C1

C1 is the **simplest CodeBlock version**.

Its job is not to explain every line.

Its job is to let the learner see:

> **“Here is the code, and here is what it produces.”**

For example:

```python
numbers = [10, 20, 30]

print(numbers)
```

Output:

```text
[10, 20, 30]
```

The learner immediately connects:

```text
Source Code
     ↓
Execution
     ↓
Result
```

---

# 2. C1 Core Structure

The canonical layout is:

```text
┌─────────────────────────────────────────────┐
│ CODE                                        │
│                                             │
│ numbers = [10, 20, 30]                      │
│ print(numbers)                              │
│                                             │
├─────────────────────────────────────────────┤
│ OUTPUT                                      │
│                                             │
│ [10, 20, 30]                                │
└─────────────────────────────────────────────┘
```

There should **not** be:

* line-by-line explanation
* multi-step walkthrough
* before/after comparison
* debugging section
* multiple examples
* interactive editor

Those belong to later CodeBlock versions.

---

# 3. C1 Learning Flow

```text
                 C1
                  │
                  ▼
              CODE
                  │
                  ▼
              EXECUTION
                  │
                  ▼
              OUTPUT
```

This gives the learner the most basic programming relationship:

> **Instructions produce a result.**

---

# 4. C1 Example — Python Function

```python
def greet():
    return "Hello"

print(greet())
```

Output:

```text
Hello
```

C1 does not explain:

* parameters
* scope
* stack frames
* return mechanics
* function objects

Those belong elsewhere.

The purpose is simply:

```text
Code
 ↓
Result
```

---

# 5. C1 Example — Python List

```python
numbers = [10, 20, 30]

print(numbers[1])
```

Output:

```text
20
```

The code demonstrates basic list indexing.

The detailed explanation of indexing belongs to the relevant tutorial content, not inside C1.

---

# 6. C1 Example — Python Dictionary

```python
student = {
    "name": "Alice",
    "score": 90
}

print(student["name"])
```

Output:

```text
Alice
```

Again:

> C1 demonstrates the behavior; it does not perform a complete lesson about dictionaries.

---

# 7. C1 Example — NumPy

```python
import numpy as np

numbers = np.array([1, 2, 3])

print(numbers * 2)
```

Output:

```text
[2 4 6]
```

This is a good C1 example because the relationship between the code and result is immediately visible.

---

# 8. C1 Example — Pandas

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["Alice", "Bob"]
})

print(df)
```

Output:

```text
    name
0  Alice
1    Bob
```

C1 remains compact.

---

# 9. C1 Example — SQL

C1 does not have to be Python-only.

```sql
SELECT name
FROM students;
```

Output:

```text
Alice
Bob
Charlie
```

This makes CodeBlock reusable across:

* Python
* JavaScript
* TypeScript
* Java
* C++
* SQL
* Bash
* HTML/CSS
* R
* Go
* Rust
* etc.

---

# 10. C1 Example — JavaScript

```javascript
const numbers = [10, 20, 30];

console.log(numbers.length);
```

Output:

```text
3
```

---

# 11. C1 Example — Data Engineering

Concept:

> Count rows in a dataset.

```python
import pandas as pd

df = pd.read_csv("students.csv")

print(len(df))
```

Output:

```text
250
```

The code demonstrates one operation.

---

# 12. C1 Example — Machine Learning

A conceptual Python example:

```python
prediction = model.predict(X_test)

print(prediction[0])
```

Output:

```text
1
```

C1 doesn't explain the entire model pipeline.

That would belong to later blocks.

---

# 13. C1 Example — API

C1 can also show an API request:

```text
GET /api/students/101
```

Output:

```json
{
  "id": 101,
  "name": "Alice"
}
```

The output can therefore be:

* text
* number
* JSON
* table
* console output

---

# 14. C1 Example — Shell

```bash
pwd
```

Output:

```text
/home/user/project
```

Again:

```text
Command
   ↓
Output
```

---

# 15. C1 Example — HTML

```html
<h1>Hello World</h1>
```

Output:

```text
Hello World
```

For HTML/CSS, "output" may mean the rendered result rather than console output.

The underlying C1 principle remains:

```text
Code
 ↓
Rendered Result
```

---

# 16. C1 Example — CSS

```css
.title {
    font-size: 32px;
}
```

Output:

```text
Rendered heading becomes 32px.
```

For a visual CSS lesson, a screenshot/rendered preview could eventually be used, but C1 itself should remain simple.

---

# 17. C1 Example — TypeScript

```typescript
const age: number = 25;

console.log(age);
```

Output:

```text
25
```

---

# 18. C1 Code Requirements

The code should generally be:

| Requirement       | Rule         |
| ----------------- | ------------ |
| Length            | Short        |
| Purpose           | One concept  |
| Complexity        | Low          |
| Dependencies      | Minimal      |
| Output            | Clear        |
| Readability       | High         |
| Explanation       | Not required |
| Walkthrough       | Not required |
| Multiple examples | No           |

Recommended code size:

> **Usually 1–10 lines.**

Some concepts may need slightly more, but C1 should remain visually compact.

---

# 19. C1 Output Requirements

The output should correspond directly to the supplied code.

For example:

```python
x = 10
print(x * 2)
```

Output:

```text
20
```

Not:

```text
The variable x contains 10, and multiplication...
```

That is explanation.

C1's output should primarily be the **actual result**.

---

# 20. C1 vs Definition D7

This distinction is important.

### Definition D7

```text
Definition
   ↓
Explanation
   ↓
Example
   ↓
Takeaway
```

### Code C1

```text
Code
 ↓
Output
```

D7 uses code as an example of the definition.

C1 makes the **code itself the primary learning object**.

---

# 21. C1 vs Definition D8

D8 might show:

```text
Definition
Characteristics
Analogy
Visual
Technical Structure
Example
Takeaway
```

C1 shows:

```text
Code
Output
```

So the two blocks have very different information densities.

---

# 22. C1 vs C2

C1:

```text
Code
 ↓
Output
```

C2:

```text
Syntax
 ↓
Explanation
 ↓
Code
```

Therefore:

> **C1 demonstrates. C2 explains syntax before demonstrating it.**

---

# 23. C1 vs C3

C1:

```text
Code
 ↓
Output
```

C3:

```text
Code
 ↓
Line 1 explanation
Line 2 explanation
Line 3 explanation
...
```

C3 is explicitly designed for **line-by-line learning**.

C1 should never become C3.

---

# 24. C1 vs C4

C1:

```text
Code
Output
```

C4:

```text
Code
 ↓
Execution
 ↓
Output
```

C4 introduces an explicit execution stage.

C1 intentionally keeps the model simpler.

---

# 25. C1 vs C5

C1:

```text
Code → Output
```

C5:

```text
Step 1
  ↓
Step 2
  ↓
Step 3
  ↓
Result
```

C5 is for complex code.

C1 is for simple code.

---

# 26. C1 vs C8

C1:

```text
One example
```

C8:

```text
Example 1
Example 2
Example 3
```

C8 is for syntax patterns.

C1 is for one direct demonstration.

---

# 27. C1 vs C10

C1:

```text
Static code
     ↓
Output
```

C10:

```text
Interactive Editor
       ↓
      Run
       ↓
     Output
```

C10 is the playground experience.

C1 remains a static educational representation.

---

# 28. C1 Semantic HTML Architecture

The recommended semantic structure is:

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>
│    └── <pre>
│         └── <code>
│
└── <section>
     ├── <h3>
     └── <pre>
          └── <code>
```

Simple.

No unnecessary DOM complexity.

---

# 29. Complete C1 HTML Tag Inventory

| HTML Tag    | Name         | Purpose                         | Color Role    |
| ----------- | ------------ | ------------------------------- | ------------- |
| `<section>` | Section      | Root/code/output sections       | Neutral       |
| `<header>`  | Header       | Block heading                   | Neutral       |
| `<span>`    | Span         | CodeBlock eyebrow               | **Primary**   |
| `<h2>`      | Heading 2    | Block title                     | **Secondary** |
| `<h3>`      | Heading 3    | Code/Output labels              | **Primary**   |
| `<pre>`     | Preformatted | Preserve code/output formatting | Neutral       |
| `<code>`    | Code         | Source code / technical output  | **Secondary** |
| `<strong>`  | Strong       | Optional highlighted term       | **Secondary** |
| `<div>`     | Division     | Layout only                     | Neutral       |

---

# 30. C1 SUIA Color System

The finalized SUIA colors remain:

| Role                          | Color       |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Supporting colors:

| Role            | Color     |
| --------------- | --------- |
| Page Background | `#FFFFFF` |
| Code Surface    | `#F7F9FC` |
| Output Surface  | `#FFFFFF` |
| Border          | `#D9E0EA` |
| Light Border    | `#E5EAF1` |
| Muted Text      | `#45658F` |
| Pink Surface    | `#FFF7FA` |
| Pink Border     | `#F2C4D8` |

---

# 31. C1 70/30 Color Rule

The C1 visual should follow our established SUIA rule:

```text
≈ 70%
Navy + white/light neutrals

≈ 30%
Pink
```

But importantly:

> **30% pink does not mean 30% of the code itself should be pink.**

Pink should identify the structure.

For example:

```text
CODE                         ← Pink label

┌──────────────────────────────┐
│ numbers = [10, 20, 30]       │
│ print(numbers)               │
└──────────────────────────────┘
        ↑
      Navy
```

Then:

```text
OUTPUT                       ← Pink label

┌──────────────────────────────┐
│ [10, 20, 30]                 │
└──────────────────────────────┘
        ↑
      Navy
```

---

# 32. C1 Tag-by-Tag Color Table

| Tag             | Example        | Color       | Reason           |
| --------------- | -------------- | ----------- | ---------------- |
| `<section>`     | Root           | White       | Surface          |
| `<span>`        | `CODE`         | **#F54A8D** | Primary accent   |
| `<h2>`          | `Python List`  | **#0B1B3D** | Main structure   |
| `<h3>`          | `Code`         | **#F54A8D** | Section emphasis |
| `<pre>`         | Code container | `#F7F9FC`   | Neutral surface  |
| `<code>`        | Python code    | **#0B1B3D** | Main content     |
| `<h3>`          | `Output`       | **#F54A8D** | Section emphasis |
| Output `<pre>`  | Result         | `#FFFFFF`   | Neutral surface  |
| Output `<code>` | Result         | **#0B1B3D** | Main content     |

---

# 33. C1 Code Card

The code card should be clean and compact:

```text
┌──────────────────────────────────────────────────┐
│ CODE                                             │
│                                                  │
│ numbers = [10, 20, 30]                           │
│                                                  │
│ print(numbers)                                   │
└──────────────────────────────────────────────────┘
```

Recommended:

* light background
* thin border
* subtle shadow
* moderate radius
* comfortable code padding
* monospace font
* no excessive decoration

---

# 34. C1 Output Card

```text
┌──────────────────────────────────────────────────┐
│ OUTPUT                                           │
│                                                  │
│ [10, 20, 30]                                     │
└──────────────────────────────────────────────────┘
```

The output should be visually distinguishable from the code but not look like another large card.

---

# 35. C1 Complete HTML

```html
<section
    class="tutorial-block code-block code-c1"
    data-block="code"
    data-version="C1"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Python List
        </h2>

    </header>


    <section class="code-example">

        <h3>
            Code
        </h3>

        <pre><code>numbers = [10, 20, 30]

print(numbers)</code></pre>

    </section>


    <section class="code-output">

        <h3>
            Output
        </h3>

        <pre><code>[10, 20, 30]</code></pre>

    </section>

</section>
```

---

# 36. C1 JSON

```json
{
  "type": "code",
  "version": "C1",

  "content": {

    "title": "Python List",

    "language": "python",

    "code": "numbers = [10, 20, 30]\n\nprint(numbers)",

    "output": "[10, 20, 30]"

  }
}
```

This is intentionally simple.

The C1 JSON model should not contain unnecessary fields such as:

```text
walkthrough
mistakes
steps
multipleExamples
interactiveEditor
```

Those belong to later versions.

---

# 37. C1 JSON Rendering Model

```text
JSON
 │
 ├── title
 ├── language
 ├── code
 └── output
       │
       ▼
   C1 Renderer
       │
       ├── Header
       ├── CodeRenderer
       └── OutputRenderer
```

---

# 38. C1 A4 Portrait Layout

Since our Tutorial Engine visual specification uses the **A4 portrait learning-card format**, C1 should look approximately like this:

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Python List                                            │
│                                                        │
│                                                        │
│ CODE                                                   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = [10, 20, 30]                           │   │
│ │                                                  │   │
│ │ print(numbers)                                  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│                                                        │
│ OUTPUT                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [10, 20, 30]                                     │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The content should **not be oversized**.

C1 is intentionally a relatively low-density block.

---

# 39. C1 Desktop Layout

```text
┌──────────────────────────────────────────────────────────┐
│ CODE                                                     │
│ Python List                                              │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ numbers = [10, 20, 30]                               │ │
│ │                                                      │ │
│ │ print(numbers)                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ OUTPUT                                                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [10, 20, 30]                                         │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

# 40. C1 Mobile Layout

```text
┌─────────────────────────────┐
│ CODE                        │
│                             │
│ Python List                 │
│                             │
│ CODE                        │
│ ┌─────────────────────────┐ │
│ │ numbers = [10, 20, 30]  │ │
│ │                         │ │
│ │ print(numbers)          │ │
│ └─────────────────────────┘ │
│                             │
│ OUTPUT                      │
│ ┌─────────────────────────┐ │
│ │ [10, 20, 30]            │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

# 41. C1 Accessibility

The C1 renderer should use semantic structure rather than decorative `<div>` elements everywhere.

Recommended:

```html
<section>
<header>
<h2>
<section>
<h3>
<pre>
<code>
```

Important accessibility points:

* proper heading hierarchy
* readable code contrast
* code must remain selectable
* keyboard scrolling for long code
* no information conveyed only through pink color
* output should have a clear textual label

---

# 42. C1 Responsive Code

On narrow screens, code should not become unreadably small.

Instead:

```text
horizontal scrolling
```

should be allowed for genuinely long lines.

Do **not** automatically shrink code to 10px just to make it fit.

---

# 43. C1 Syntax Highlighting

C1 may support syntax highlighting, but it should remain restrained.

For example:

```text
keyword
string
number
function
comment
```

can receive subtle semantic colors.

However:

> The SUIA brand colors remain the structural identity.

Syntax highlighting should not turn the entire block into a rainbow IDE.

---

# 44. C1 Language Support

The JSON should support:

```json
"language": "python"
```

but also:

```text
javascript
typescript
java
cpp
c
csharp
go
rust
sql
bash
html
css
json
yaml
r
```

and other languages supported by the Tutorial Engine's code renderer.

---

# 45. C1 Example Types

C1 can support several simple code-result relationships:

| Type           | Example                    |
| -------------- | -------------------------- |
| Console        | Code → console output      |
| Return         | Code → returned value      |
| Query          | SQL → rows                 |
| API            | Request → response         |
| Transformation | Input → transformed output |
| Rendering      | HTML/CSS → rendered result |
| Calculation    | Formula/code → number      |

The JSON renderer can remain generic.

---

# 46. C1 Validation Rules

| Field              |    Required |
| ------------------ | ----------: |
| `type`             |           ✅ |
| `version`          |           ✅ |
| `title`            |           ✅ |
| `language`         | Recommended |
| `code`             |           ✅ |
| `output`           | Recommended |
| Explanation        |           ❌ |
| Walkthrough        |           ❌ |
| Steps              |           ❌ |
| Before/After       |           ❌ |
| Mistakes           |           ❌ |
| Multiple Examples  |           ❌ |
| Interactive editor |           ❌ |
| Takeaway           |           ❌ |

Why is output only **recommended** rather than absolutely required?

Because some code demonstrations don't produce a textual output.

For example:

```html
<h1>Hello World</h1>
```

has a rendered result rather than console output.

---

# 47. C1 Best Use Cases

| Concept              | C1 Suitability |
| -------------------- | -------------: |
| Python syntax        |          ⭐⭐⭐⭐⭐ |
| Variables            |          ⭐⭐⭐⭐⭐ |
| Operators            |          ⭐⭐⭐⭐⭐ |
| Simple functions     |          ⭐⭐⭐⭐⭐ |
| List operations      |          ⭐⭐⭐⭐⭐ |
| Dictionary lookup    |          ⭐⭐⭐⭐⭐ |
| NumPy operation      |          ⭐⭐⭐⭐⭐ |
| Pandas operation     |          ⭐⭐⭐⭐⭐ |
| SQL query            |          ⭐⭐⭐⭐⭐ |
| Simple API request   |          ⭐⭐⭐⭐⭐ |
| HTML                 |          ⭐⭐⭐⭐⭐ |
| CSS                  |          ⭐⭐⭐⭐⭐ |
| Simple JavaScript    |          ⭐⭐⭐⭐⭐ |
| Complex algorithms   |             ⭐⭐ |
| Debugging            |              ⭐ |
| Interactive learning |              ⭐ |

---

# 48. C1 What We Should Avoid

### ❌ Explanation paragraph

That moves toward C2.

### ❌ Line-by-line annotations

That is C3.

### ❌ Execution timeline

That is C4.

### ❌ Three-step walkthrough

That is C5.

### ❌ Before/after

That is C6.

### ❌ Incorrect/correct code

That is C7.

### ❌ Multiple examples

That is C8.

### ❌ Explanation + output + takeaway

That is C9.

### ❌ Playground

That is C10.

This strict separation is important for the final Tutorial Engine architecture.

---

# 49. C1 Component Architecture

```text
CodeBlock
│
└── C1 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── CodeSection
      │    ├── Label
      │    └── CodeRenderer
      │
      └── OutputSection
           ├── Label
           └── OutputRenderer
```

This is intentionally much simpler than C9 or C10.

---

# 50. C1 Final Technical Specification

| Area                  | C1 Decision                      |
| --------------------- | -------------------------------- |
| Version               | **C1**                           |
| Name                  | **Basic Code Example**           |
| Main question         | **What does this code produce?** |
| Structure             | **Code → Output**                |
| Best for              | Simple syntax                    |
| Primary               | **#F54A8D**                      |
| Secondary             | **#0B1B3D**                      |
| Theme                 | Light                            |
| Gradient              | ❌                                |
| Dark theme            | ❌                                |
| A4                    | **Portrait**                     |
| Root                  | `<section>`                      |
| Title                 | `<h2>`                           |
| Labels                | `<h3>`                           |
| Code                  | `<pre><code>`                    |
| Output                | `<pre><code>`                    |
| Explanation           | ❌                                |
| Walkthrough           | ❌                                |
| Multiple examples     | ❌                                |
| Debugging             | ❌                                |
| Interactive editor    | ❌                                |
| JSON-driven           | ✅                                |
| Responsive            | ✅                                |
| Accessible            | ✅                                |
| Recommended code size | **1–10 lines**                   |
| Learning level        | **Beginner → Intermediate**      |

---

# 51. C1 Final Mental Model

```text
                         C1
                          │
                          ▼
                       CODE
                          │
                          ▼
                      EXECUTION
                          │
                          ▼
                       OUTPUT
```

The defining principle is:

> **C1 provides the smallest useful code-learning unit: a concise piece of code paired directly with its resulting output.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| **C1**  | **Basic Code Example**      | ✅ **Completed now** |
| C2      | Syntax + Explanation        | ⏳ Next              |
| C3      | Annotated Code              | ⏳                   |
| C4      | Code + Output               | ⏳                   |
| C5      | Code Walkthrough            | ⏳                   |
| C6      | Before / After Code         | ⏳                   |
| C7      | Common Mistake              | ⏳                   |
| C8      | Multiple Examples           | ⏳                   |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C1 is now fully specified. The next version is C2 — Syntax + Explanation.**



```python

```

# BLOCK 4 — CodeBlock

# C2 — Syntax + Explanation

C2 is the second version of the **CodeBlock**.

The CodeBlock progression is:

| Version | Name                        | Main Learning Question                              |
| ------- | --------------------------- | --------------------------------------------------- |
| **C1**  | Basic Code Example          | What does this code produce?                        |
| **C2**  | **Syntax + Explanation**    | **What syntax am I seeing, and what does it mean?** |
| C3      | Annotated Code              | What does each line do?                             |
| C4      | Code + Output               | What happens during execution?                      |
| C5      | Code Walkthrough            | How does the program execute step by step?          |
| C6      | Before / After Code         | What changed and why?                               |
| C7      | Common Mistake              | What is wrong and how do I correct it?              |
| C8      | Multiple Examples           | What different syntax patterns can I use?           |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect?           |
| C10     | Interactive / Playground    | Can I experiment with the code myself?              |

The defining structure of C2 is:

```text
SYNTAX
   ↓
EXPLANATION
   ↓
CODE
```

---

# 1. Purpose of C2

C2 is designed for situations where the learner has seen a new syntax pattern but does not yet understand **what the syntax means**.

For example:

```python
numbers = [10, 20, 30]
```

C2 should explain:

```text
numbers
   ↓
variable name

=
   ↓
assignment operator

[10, 20, 30]
   ↓
list literal
```

The learner therefore understands the syntax **before** seeing a complete execution walkthrough.

---

# 2. C2 Core Principle

C2 answers:

> **“What are the important pieces of this syntax?”**

It does **not** answer:

> “What happens on every line?”

That is C3.

It does **not** answer:

> “How does execution progress?”

That is C4/C5.

It does **not** provide a playground.

That is C10.

---

# 3. C2 Core Structure

The canonical C2 structure is:

```text id="9grx6u"
┌───────────────────────────────────────────────┐
│ CODE                                          │
│                                               │
│ numbers = [10, 20, 30]                        │
│                                               │
├───────────────────────────────────────────────┤
│ SYNTAX                                       │
│                                               │
│ numbers → variable                            │
│ =       → assignment operator                 │
│ [...]   → list literal                        │
│                                               │
├───────────────────────────────────────────────┤
│ EXPLANATION                                  │
│                                               │
│ The assignment stores a list object in the    │
│ variable named numbers.                       │
└───────────────────────────────────────────────┘
```

The exact visual order may be:

```text
Syntax → Explanation → Code
```

as defined in the version table, or:

```text
Code → Syntax → Explanation
```

for a more natural screen-reading flow.

The **data relationship** remains:

```text
Syntax
  ↓
Meaning
  ↓
Code
```

---

# 4. C2 vs C1

### C1

```text id="6zy1ps"
CODE
 ↓
OUTPUT
```

Example:

```python id="yq3r1d"
x = 10
print(x)
```

Output:

```text id="tqj1mt"
10
```

### C2

```text id="5u0sqy"
SYNTAX
 ↓
EXPLANATION
 ↓
CODE
```

Example:

```text id="r4iy9h"
x
→ variable

=
→ assignment

10
→ integer literal
```

The learner is now learning **syntax semantics**, not merely seeing the result.

---

# 5. C2 vs C3

This distinction is critical.

### C2

Explains **syntax constructs**.

```text id="t1v08j"
def
→ function declaration syntax

greet
→ function name

(name)
→ parameter list

:
→ begins function body
```

### C3

Explains **each line**.

```text id="5h9r7e"
Line 1 → defines function
Line 2 → returns string
Line 3 → calls function
Line 4 → prints result
```

Therefore:

> **C2 = syntax-level explanation**

> **C3 = line-level explanation**

---

# 6. C2 Example — Python Variable Assignment

### Syntax

```python id="6guk9v"
name = "Alice"
```

### Syntax breakdown

| Syntax    | Meaning             |
| --------- | ------------------- |
| `name`    | Variable name       |
| `=`       | Assignment operator |
| `"Alice"` | String literal      |

### Explanation

> The assignment statement associates the name `name` with the string value `"Alice"`.

The code is small because C2 focuses on syntax.

---

# 7. C2 Example — Python Function

### Syntax

```python id="c6w2xl"
def greet(name):
    return "Hello " + name
```

### Syntax breakdown

| Syntax            | Meaning                                 |
| ----------------- | --------------------------------------- |
| `def`             | Function-definition keyword             |
| `greet`           | Function name                           |
| `(name)`          | Parameter list                          |
| `:`               | Begins the function suite               |
| `return`          | Returns a value                         |
| `"Hello " + name` | Expression producing the returned value |

### Explanation

> The syntax defines a function named `greet` with one parameter and a body that returns a string constructed from that parameter.

This is exactly the kind of content C2 is designed for.

---

# 8. C2 Example — Python List

### Syntax

```python id="9q9bym"
numbers = [10, 20, 30]
```

### Syntax breakdown

| Syntax       | Meaning       |
| ------------ | ------------- |
| `numbers`    | Variable name |
| `=`          | Assignment    |
| `[...]`      | List literal  |
| `10, 20, 30` | Elements      |

### Explanation

> The syntax creates a list containing three values and associates that list with the name `numbers`.

---

# 9. C2 Example — List Comprehension

This is an excellent C2 use case.

### Syntax

```python id="l9q7hp"
squares = [x * x for x in numbers]
```

### Syntax breakdown

| Syntax       | Meaning                       |
| ------------ | ----------------------------- |
| `squares`    | Target variable               |
| `[...]`      | List-comprehension expression |
| `x * x`      | Expression                    |
| `for x`      | Iteration variable            |
| `in numbers` | Source iterable               |

### Explanation

> The expression iterates over `numbers`, computes `x * x` for each element, and constructs a new list containing the results.

C2 explains the syntax pattern without performing a line-by-line walkthrough.

---

# 10. C2 Example — Dictionary

### Syntax

```python id="ujxgl1"
student = {
    "name": "Alice",
    "score": 90
}
```

### Syntax breakdown

| Syntax    | Meaning                 |
| --------- | ----------------------- |
| `{}`      | Dictionary literal      |
| `"name"`  | Key                     |
| `"Alice"` | Value                   |
| `:`       | Separates key and value |
| `,`       | Separates mappings      |

### Explanation

> The syntax constructs a dictionary containing key-value mappings.

---

# 11. C2 Example — Class

### Syntax

```python id="e8f3fr"
class Student:
    pass
```

### Syntax breakdown

| Syntax    | Meaning                          |
| --------- | -------------------------------- |
| `class`   | Class-definition keyword         |
| `Student` | Class name                       |
| `:`       | Begins class body                |
| `pass`    | Empty statement/body placeholder |

### Explanation

> The syntax declares a class named `Student` with an empty body.

---

# 12. C2 Example — JavaScript Arrow Function

```javascript id="v0ujf9"
const add = (a, b) => a + b;
```

### Syntax breakdown

| Syntax   | Meaning                     |
| -------- | --------------------------- |
| `const`  | Declares a constant binding |
| `add`    | Variable/function name      |
| `(a, b)` | Parameters                  |
| `=>`     | Arrow-function syntax       |
| `a + b`  | Expression body             |

### Explanation

> The expression creates an arrow function that receives two parameters and returns their sum.

This demonstrates that C2 is language-independent.

---

# 13. C2 Example — TypeScript Type Annotation

```typescript id="7c5i5x"
const age: number = 25;
```

### Syntax breakdown

| Syntax   | Meaning                   |
| -------- | ------------------------- |
| `const`  | Constant binding          |
| `age`    | Variable name             |
| `:`      | Type annotation separator |
| `number` | Declared type             |
| `=`      | Assignment                |
| `25`     | Numeric literal           |

### Explanation

> The declaration associates `age` with the numeric value `25` and explicitly specifies its TypeScript type as `number`.

---

# 14. C2 Example — SQL

```sql id="fkw9ja"
SELECT name
FROM students
WHERE score > 80;
```

### Syntax breakdown

| Syntax       | Meaning                       |
| ------------ | ----------------------------- |
| `SELECT`     | Specifies columns to retrieve |
| `name`       | Selected column               |
| `FROM`       | Specifies source table        |
| `students`   | Table                         |
| `WHERE`      | Applies a filtering condition |
| `score > 80` | Filter expression             |

### Explanation

> The query selects the `name` column from `students` for rows whose `score` is greater than 80.

---

# 15. C2 Example — NumPy

```python id="3x4m72"
arr = np.array([1, 2, 3])
```

### Syntax breakdown

| Syntax      | Meaning                          |
| ----------- | -------------------------------- |
| `arr`       | Variable                         |
| `np.array`  | NumPy array constructor/function |
| `[1, 2, 3]` | Input sequence                   |
| `=`         | Assignment                       |

### Explanation

> The statement creates a NumPy array from the supplied sequence and associates it with `arr`.

---

# 16. C2 Example — Pandas

```python id="xg7o4e"
df = pd.DataFrame(data)
```

### Syntax breakdown

| Syntax         | Meaning                      |
| -------------- | ---------------------------- |
| `df`           | Variable                     |
| `=`            | Assignment                   |
| `pd.DataFrame` | Pandas DataFrame constructor |
| `data`         | Input object                 |

### Explanation

> The statement creates a DataFrame from `data` and stores the resulting object in `df`.

---

# 17. C2 Example — REST API

```text id="4qg3w8"
GET /api/students/101
```

### Syntax breakdown

| Syntax              | Meaning             |
| ------------------- | ------------------- |
| `GET`               | HTTP method         |
| `/api/students/101` | Resource path       |
| `students`          | Resource            |
| `101`               | Resource identifier |

### Explanation

> The request uses the GET method to request the student resource identified by `101`.

---

# 18. C2 Example — Data Engineering

A simple pipeline expression:

```text id="l3s6mc"
source → transform → destination
```

Syntax breakdown:

| Syntax        | Meaning          |
| ------------- | ---------------- |
| `source`      | Data origin      |
| `→`           | Data flow        |
| `transform`   | Processing stage |
| `destination` | Target           |

The explanation describes what each stage means.

---

# 19. C2 Example — Machine Learning

```text id="f43h6u"
model.fit(X_train, y_train)
```

Syntax breakdown:

| Syntax    | Meaning           |
| --------- | ----------------- |
| `model`   | Model object      |
| `.fit()`  | Training method   |
| `X_train` | Training features |
| `y_train` | Training targets  |

Explanation:

> The syntax invokes the model's training operation using the supplied training data.

---

# 20. C2 Example — Authentication

A conceptual syntax representation:

```text id="r7a3vl"
authenticate(credentials)
```

Syntax breakdown:

| Syntax         | Meaning             |
| -------------- | ------------------- |
| `authenticate` | Operation/function  |
| `credentials`  | Input evidence      |
| `()`           | Function invocation |

Explanation:

> The operation receives authentication evidence and performs identity verification.

---

# 21. C2 Example — Quantum Computing

A simple conceptual representation:

```text id="0r9w8x"
|ψ⟩ = α|0⟩ + β|1⟩
```

Syntax breakdown:

| Symbol | Meaning                     |               |                            |
| ------ | --------------------------- | ------------- | -------------------------- |
| `      | ψ⟩`                         | Quantum state |                            |
| `α`    | Amplitude associated with ` | 0⟩`           |                            |
| `β`    | Amplitude associated with ` | 1⟩`           |                            |
| `      | 0⟩`, `                      | 1⟩`           | Computational basis states |
| `+`    | Linear combination          |               |                            |

C2 here teaches the **notation** rather than attempting a full quantum mechanics lesson.

---

# 22. C2 Syntax Breakdown Pattern

A universal C2 pattern is:

```text id="7cbg5f"
CODE
 │
 ├── Token / Syntax Element 1
 │       ↓
 │     Meaning
 │
 ├── Token / Syntax Element 2
 │       ↓
 │     Meaning
 │
 └── Token / Syntax Element 3
         ↓
       Meaning
```

This is the core C2 teaching mechanism.

---

# 23. C2 Should Focus on Syntax Units

Good C2 units include:

```text id="8wx1ig"
keywords
operators
identifiers
literals
parameters
arguments
punctuation
delimiters
method calls
attributes
type annotations
query clauses
symbols
```

The exact terminology depends on the language/domain.

---

# 24. C2 Should Not Explain Every Token

This is important.

Given:

```python id="5y8zmc"
for x in numbers:
    print(x)
```

C2 could explain:

```text
for
→ iteration keyword

x
→ iteration variable

in
→ membership/iteration relationship

numbers
→ iterable

:
→ begins suite
```

But it should not explain every whitespace character or parentheses unless they are educationally meaningful.

The goal is:

> **Explain meaningful syntax, not mechanically annotate every character.**

---

# 25. C2 Semantic HTML Architecture

The recommended structure is:

```text id="4lq2b1"
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>
│    └── <pre>
│         └── <code>
│
├── <section>
│    ├── <h3>
│    └── <dl>
│         ├── <dt>
│         └── <dd>
│
└── <section>
     ├── <h3>
     └── <p>
```

---

# 26. Complete C2 HTML Tag Inventory

| HTML Tag    | Name                | Purpose                    | Color Role    |
| ----------- | ------------------- | -------------------------- | ------------- |
| `<section>` | Section             | Root and content sections  | Neutral       |
| `<header>`  | Header              | Block header               | Neutral       |
| `<span>`    | Span                | Eyebrow                    | **Primary**   |
| `<h2>`      | Heading 2           | Main title                 | **Secondary** |
| `<h3>`      | Heading 3           | Section labels             | **Primary**   |
| `<pre>`     | Preformatted        | Preserve source formatting | Neutral       |
| `<code>`    | Code                | Source syntax              | **Secondary** |
| `<dl>`      | Description List    | Syntax glossary            | Neutral       |
| `<dt>`      | Description Term    | Syntax element             | **Primary**   |
| `<dd>`      | Description Details | Syntax meaning             | **Secondary** |
| `<p>`       | Paragraph           | Explanation                | **Secondary** |
| `<strong>`  | Strong              | Important syntax           | **Secondary** |
| `<div>`     | Division            | Layout only                | Neutral       |

---

# 27. C2 SUIA Color System

The brand colors remain fixed:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Supporting UI:

| Role           | Hex       |
| -------------- | --------- |
| Background     | `#FFFFFF` |
| Code Surface   | `#F7F9FC` |
| Syntax Surface | `#FFF7FA` |
| Border         | `#D9E0EA` |
| Light Border   | `#E5EAF1` |
| Muted Text     | `#45658F` |
| Pink Border    | `#F2C4D8` |

---

# 28. C2 70/30 Color Rule

The visual hierarchy remains:

```text id="v46n4m"
70%
Navy + neutral surfaces

30%
Pink emphasis
```

Pink should primarily identify:

* `SYNTAX`
* syntax terms
* section labels
* important syntax markers

Navy should carry:

* code
* explanations
* meanings
* title
* technical descriptions

---

# 29. C2 Tag-by-Tag Color Table

| Tag        | Example           | Color       | Role      |
| ---------- | ----------------- | ----------- | --------- |
| `<span>`   | `CODE`            | **#F54A8D** | Primary   |
| `<h2>`     | `Python Function` | **#0B1B3D** | Secondary |
| `<h3>`     | `Syntax`          | **#F54A8D** | Primary   |
| `<pre>`    | Code surface      | `#F7F9FC`   | Neutral   |
| `<code>`   | `def greet()`     | **#0B1B3D** | Secondary |
| `<dt>`     | `def`             | **#F54A8D** | Primary   |
| `<dd>`     | Function keyword  | **#0B1B3D** | Secondary |
| `<p>`      | Explanation       | **#0B1B3D** | Secondary |
| `<strong>` | Important syntax  | **#0B1B3D** | Secondary |

---

# 30. C2 Syntax Table

A core visual component is the syntax table:

```text id="3m2w4y"
┌──────────────────┬─────────────────────────────┐
│ SYNTAX           │ MEANING                     │
├──────────────────┼─────────────────────────────┤
│ def              │ Function-definition keyword │
│ greet            │ Function name               │
│ (name)           │ Parameter list              │
│ :                │ Begins function body        │
│ return           │ Returns a value             │
└──────────────────┴─────────────────────────────┘
```

This is why `<dl>` is semantically attractive, although the visual renderer may choose a grid/table-like presentation.

---

# 31. Why `<dl>` Instead of `<table>`?

For a simple:

```text
Term → Meaning
```

relationship, `<dl>` is semantically appropriate:

```html id="wqg6cs"
<dl>
    <dt>def</dt>
    <dd>Function-definition keyword.</dd>

    <dt>return</dt>
    <dd>Returns a value.</dd>
</dl>
```

If the content becomes a true multi-column comparison, then a `<table>` may be appropriate.

C2 should not force a `<table>` when a description list better represents the relationship.

---

# 32. C2 Complete HTML

```html id="yq2t6s"
<section
    class="tutorial-block code-block code-c2"
    data-block="code"
    data-version="C2"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Python Function Syntax
        </h2>

    </header>


    <section class="syntax-example">

        <h3>
            Syntax
        </h3>

        <pre><code>def greet(name):
    return "Hello " + name</code></pre>

    </section>


    <section class="syntax-breakdown">

        <h3>
            Syntax Breakdown
        </h3>

        <dl>

            <dt>def</dt>

            <dd>
                Function-definition keyword.
            </dd>


            <dt>greet</dt>

            <dd>
                Name of the function.
            </dd>


            <dt>(name)</dt>

            <dd>
                Parameter list.
            </dd>


            <dt>:</dt>

            <dd>
                Begins the function body.
            </dd>


            <dt>return</dt>

            <dd>
                Returns a value from the function.
            </dd>

        </dl>

    </section>


    <section class="syntax-explanation">

        <h3>
            Explanation
        </h3>

        <p>
            The syntax defines a function named
            <strong>greet</strong> with one parameter.
            The function returns a string containing
            the supplied name.
        </p>

    </section>

</section>
```

---

# 33. C2 JSON

```json id="q0h8f5"
{
  "type": "code",
  "version": "C2",

  "content": {

    "title": "Python Function Syntax",

    "language": "python",

    "code": "def greet(name):\n    return \"Hello \" + name",

    "syntaxBreakdown": [
      {
        "syntax": "def",
        "meaning": "Function-definition keyword."
      },
      {
        "syntax": "greet",
        "meaning": "Name of the function."
      },
      {
        "syntax": "(name)",
        "meaning": "Parameter list."
      },
      {
        "syntax": ":",
        "meaning": "Begins the function body."
      },
      {
        "syntax": "return",
        "meaning": "Returns a value from the function."
      }
    ],

    "explanation": "The syntax defines a function named greet with one parameter. The function returns a string containing the supplied name."

  }
}
```

---

# 34. C2 JSON Architecture

The structure is intentionally different from C1.

### C1

```text id="p6x8n9"
title
language
code
output
```

### C2

```text id="6u3p44"
title
language
code
syntaxBreakdown
explanation
```

This distinction should remain explicit in the Tutorial Engine schema.

---

# 35. C2 A4 Portrait Layout

The A4 portrait design should be:

```text id="l1pxo0"
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Python Function Syntax                                 │
│                                                        │
│ SYNTAX                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ def greet(name):                                 │   │
│ │     return "Hello " + name                       │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ SYNTAX BREAKDOWN                                       │
│ ┌────────────────────┬─────────────────────────────┐   │
│ │ def                │ Function keyword            │   │
│ │ greet              │ Function name               │   │
│ │ (name)             │ Parameter list              │   │
│ │ :                  │ Begins function body        │   │
│ │ return             │ Returns a value             │   │
│ └────────────────────┴─────────────────────────────┘   │
│                                                        │
│ EXPLANATION                                            │
│ The syntax defines a function named greet...          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The page should remain **A4 portrait**, not a small floating card.

---

# 36. C2 Desktop Layout

```text id="8ip4am"
┌──────────────────────────────────────────────────────────┐
│ CODE                                                     │
│ Python Function Syntax                                   │
│                                                          │
│ SYNTAX                                                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ def greet(name):                                     │ │
│ │     return "Hello " + name                           │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ SYNTAX BREAKDOWN                                         │
│ ┌────────────────────┬─────────────────────────────────┐ │
│ │ def                │ Function-definition keyword     │ │
│ │ greet              │ Function name                  │ │
│ │ (name)             │ Parameter list                 │ │
│ │ :                  │ Begins function body           │ │
│ │ return             │ Returns a value                │ │
│ └────────────────────┴─────────────────────────────────┘ │
│                                                          │
│ EXPLANATION                                              │
│ The syntax defines a function named greet...            │
└──────────────────────────────────────────────────────────┘
```

---

# 37. C2 Mobile Layout

On mobile, the syntax relationship should become stacked:

```text id="ljv4fh"
┌─────────────────────────────┐
│ CODE                        │
│                             │
│ Python Function Syntax      │
│                             │
│ SYNTAX                      │
│ ┌─────────────────────────┐ │
│ │ def greet(name):        │ │
│ │     return "Hello " +   │ │
│ │     name                │ │
│ └─────────────────────────┘ │
│                             │
│ SYNTAX BREAKDOWN            │
│                             │
│ def                         │
│ Function-definition keyword │
│                             │
│ greet                       │
│ Function name               │
│                             │
│ (name)                      │
│ Parameter list              │
│                             │
│ return                      │
│ Returns a value             │
│                             │
│ EXPLANATION                 │
│ The syntax defines...       │
└─────────────────────────────┘
```

---

# 38. C2 Accessibility

The syntax breakdown must remain understandable without color.

For example, don't rely only on:

```text
Pink = syntax
Navy = meaning
```

Instead, explicitly label:

```text
SYNTAX
MEANING
```

This ensures the content remains accessible for:

* color-blind users
* screen readers
* low-contrast environments
* printed versions

---

# 39. C2 Syntax Highlighting

Syntax highlighting can be used inside the code:

```text id="xq6e0y"
keyword
function
string
number
operator
```

But the structural UI should continue to use:

```text
#F54A8D
#0B1B3D
```

The syntax highlighter should not override the SUIA visual identity.

---

# 40. C2 Recommended Information Density

| Component    |    Recommended |
| ------------ | -------------: |
| Code         |     1–12 lines |
| Syntax terms |            3–8 |
| Explanation  | 1–3 paragraphs |
| Examples     |              1 |
| Output       |       Optional |
| Walkthrough  |              ❌ |
| Interactive  |              ❌ |

C2 is slightly denser than C1 but should still remain a focused learning block.

---

# 41. C2 What We Should Avoid

### ❌ Line-by-line explanation

That's C3.

### ❌ Execution sequence

That's C4/C5.

### ❌ Multiple syntax examples

That's C8.

### ❌ Before/after

That's C6.

### ❌ Incorrect/correct syntax

That's C7.

### ❌ Long explanation + output + takeaway

That approaches C9.

### ❌ Interactive editor

That's C10.

---

# 42. C2 Component Architecture

```text id="a6ubqj"
CodeBlock
│
└── C2 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── SyntaxExample
      │    └── CodeRenderer
      │
      ├── SyntaxBreakdown
      │    ├── SyntaxTerm
      │    └── Meaning
      │
      └── Explanation
```

---

# 43. C2 Validation Rules

| Field                     |    Required |
| ------------------------- | ----------: |
| `type`                    |           ✅ |
| `version`                 |           ✅ |
| `title`                   |           ✅ |
| `language`                | Recommended |
| `code`                    |           ✅ |
| `syntaxBreakdown`         |           ✅ |
| `syntaxBreakdown.syntax`  |           ✅ |
| `syntaxBreakdown.meaning` |           ✅ |
| `explanation`             | Recommended |
| Output                    |           ❌ |
| Walkthrough               |           ❌ |
| Multiple examples         |           ❌ |
| Before/After              |           ❌ |
| Mistake                   |           ❌ |
| Interactive editor        |           ❌ |

---

# 44. C2 Best Use Cases

| Topic                      | Suitability |
| -------------------------- | ----------: |
| Python `def`               |       ⭐⭐⭐⭐⭐ |
| Python comprehensions      |       ⭐⭐⭐⭐⭐ |
| Python decorators          |       ⭐⭐⭐⭐⭐ |
| Python slicing syntax      |       ⭐⭐⭐⭐⭐ |
| Python `with` syntax       |       ⭐⭐⭐⭐⭐ |
| Python exception syntax    |       ⭐⭐⭐⭐⭐ |
| TypeScript types           |       ⭐⭐⭐⭐⭐ |
| JavaScript arrow functions |       ⭐⭐⭐⭐⭐ |
| SQL clauses                |       ⭐⭐⭐⭐⭐ |
| NumPy indexing             |       ⭐⭐⭐⭐⭐ |
| Pandas expressions         |       ⭐⭐⭐⭐⭐ |
| API syntax                 |       ⭐⭐⭐⭐⭐ |
| Regular expressions        |       ⭐⭐⭐⭐⭐ |
| Shell commands             |       ⭐⭐⭐⭐⭐ |
| Quantum notation           |        ⭐⭐⭐⭐ |

---

# 45. C2 Final Technical Specification

| Area                    | C2 Decision                     |
| ----------------------- | ------------------------------- |
| Version                 | **C2**                          |
| Name                    | **Syntax + Explanation**        |
| Main question           | **What does this syntax mean?** |
| Structure               | **Syntax → Explanation → Code** |
| Best for                | New language features / syntax  |
| Primary                 | **#F54A8D**                     |
| Secondary               | **#0B1B3D**                     |
| Theme                   | Light                           |
| Gradient                | ❌                               |
| Dark theme              | ❌                               |
| A4                      | **Portrait**                    |
| Root                    | `<section>`                     |
| Title                   | `<h2>`                          |
| Labels                  | `<h3>`                          |
| Source                  | `<pre><code>`                   |
| Syntax terms            | `<dl><dt><dd>`                  |
| Explanation             | `<p>`                           |
| Output                  | ❌                               |
| Line-by-line annotation | ❌                               |
| Walkthrough             | ❌                               |
| Multiple examples       | ❌                               |
| Debugging               | ❌                               |
| Interactive editor      | ❌                               |
| JSON-driven             | ✅                               |
| Responsive              | ✅                               |
| Accessible              | ✅                               |
| Learning level          | **Beginner → Intermediate**     |

---

# 46. C2 Final Mental Model

```text id="w4m8u7"
                         C2
                          │
                          ▼
                       SYNTAX
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        Syntax Element             Meaning
              │                       │
              └───────────┬───────────┘
                          ▼
                      CODE EXAMPLE
                          │
                          ▼
                   Learner Understands
                    The Syntax Pattern
```

The defining principle is:

> **C2 teaches the meaning of important syntax elements before asking the learner to understand the complete behavior of the program.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| **C1**  | Basic Code Example          | ✅                   |
| **C2**  | **Syntax + Explanation**    | ✅ **Completed now** |
| C3      | Annotated Code              | ⏳ Next              |
| C4      | Code + Output               | ⏳                   |
| C5      | Code Walkthrough            | ⏳                   |
| C6      | Before / After Code         | ⏳                   |
| C7      | Common Mistake              | ⏳                   |
| C8      | Multiple Examples           | ⏳                   |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C2 is complete. The next version is C3 — Annotated Code.**



```python

```

# BLOCK 4 — CodeBlock

# C3 — Annotated Code

C3 is the third version of the **CodeBlock**.

The CodeBlock progression is:

| Version | Name                        | Main Learning Question                                  |
| ------- | --------------------------- | ------------------------------------------------------- |
| C1      | Basic Code Example          | What does this code produce?                            |
| C2      | Syntax + Explanation        | What does this syntax mean?                             |
| **C3**  | **Annotated Code**          | **What does each important line/part of this code do?** |
| C4      | Code + Output               | What happens during execution?                          |
| C5      | Code Walkthrough            | How does execution progress step by step?               |
| C6      | Before / After Code         | What changed and why?                                   |
| C7      | Common Mistake              | What is wrong and how do I fix it?                      |
| C8      | Multiple Examples           | What different patterns can I use?                      |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect?               |
| C10     | Interactive / Playground    | Can I experiment with the code?                         |

The defining structure of C3 is:

```text
CODE
  │
  ├── Annotation 1
  ├── Annotation 2
  ├── Annotation 3
  └── ...
```

The key difference from C2 is:

> **C2 explains syntax elements. C3 explains the actual code line-by-line or statement-by-statement.**

---

# 1. Purpose of C3

C3 is designed for learners who can see code but struggle to understand **what each part is doing in context**.

For example:

```python
numbers = [10, 20, 30]

total = sum(numbers)

print(total)
```

C3 explains:

```text
Line 1
→ Creates a list of numbers.

Line 3
→ Calculates the sum of the list.

Line 5
→ Displays the result.
```

The learner can therefore map:

```text
SOURCE CODE
     │
     ├──────────────► WHAT THIS LINE DOES
     │
     ├──────────────► WHAT THIS LINE DOES
     │
     └──────────────► WHAT THIS LINE DOES
```

---

# 2. C3 Core Principle

C3 answers:

> **“What does this particular line or statement contribute to the program?”**

It is particularly useful for:

* beginners
* unfamiliar APIs
* unfamiliar syntax combinations
* short algorithms
* library examples
* configuration examples
* SQL queries
* shell commands
* data-processing code

---

# 3. C3 Canonical Structure

The basic structure is:

```text id="6d5r9k"
┌────────────────────────────────────────────────────┐
│ CODE                                               │
│                                                    │
│ 1  numbers = [10, 20, 30]                          │
│ 2  total = sum(numbers)                            │
│ 3  print(total)                                    │
│                                                    │
│ ① Creates the list.                                │
│ ② Calculates its total.                            │
│ ③ Prints the total.                                │
└────────────────────────────────────────────────────┘
```

There are two valid presentation styles.

### Style A — Inline annotations

```text
code line → explanation
```

### Style B — Code + annotation panel

```text
Code                         Explanation

numbers = [...]              Creates a list.
total = sum(numbers)        Calculates the total.
print(total)                Displays the result.
```

For the A4 portrait Tutorial Engine, **Style B is generally preferable** because it remains readable.

---

# 4. C3 Example — Python

```python id="j9w8v0"
numbers = [10, 20, 30]

total = sum(numbers)

print(total)
```

Annotations:

| Code                     | Explanation                              |
| ------------------------ | ---------------------------------------- |
| `numbers = [10, 20, 30]` | Creates a list containing three numbers. |
| `total = sum(numbers)`   | Calculates the sum of all elements.      |
| `print(total)`           | Displays the calculated value.           |

Output can be shown, but it is **not the primary purpose of C3**.

---

# 5. C3 Why Output Is Optional

C1 is:

```text
Code → Output
```

C3 is:

```text
Code → Explanation
```

Therefore:

```text
Output
```

may be included as a small supporting element, but C3 should not turn into C4 or C9.

The primary learning relationship is:

> **Line → Meaning**

---

# 6. C3 Example — Python Function

```python id="g4k8z1"
def greet(name):
    message = "Hello " + name
    return message

print(greet("Alice"))
```

Annotations:

| Line                    | Explanation                                          |
| ----------------------- | ---------------------------------------------------- |
| `def greet(name):`      | Defines a function named `greet` with one parameter. |
| `message = ...`         | Creates the message using the supplied name.         |
| `return message`        | Sends the message back to the caller.                |
| `print(greet("Alice"))` | Calls the function and prints its returned value.    |

Notice the difference:

C2 would explain:

```text
def
greet
(name)
:
return
```

C3 explains:

```text
What each complete statement does.
```

---

# 7. C3 Example — Python List Mutation

```python id="x4c1f7"
numbers = [10, 20, 30]

numbers.append(40)

print(numbers)
```

Annotations:

| Code                 | Explanation                       |
| -------------------- | --------------------------------- |
| `numbers = [...]`    | Creates the initial list.         |
| `numbers.append(40)` | Adds `40` to the end of the list. |
| `print(numbers)`     | Displays the modified list.       |

This is a very good C3 example because each line has a clear purpose.

---

# 8. C3 Example — List Comprehension

```python id="q0x4g2"
numbers = [1, 2, 3, 4]

squares = [x * x for x in numbers]

print(squares)
```

Annotations:

| Code              | Explanation                                                |
| ----------------- | ---------------------------------------------------------- |
| `numbers = [...]` | Creates the source collection.                             |
| `squares = [...]` | Builds a new list by calculating the square of each value. |
| `print(squares)`  | Displays the resulting list.                               |

C3 does not need to explain every token inside the comprehension; that was C2's job.

---

# 9. C3 Example — NumPy

```python id="g3u6av"
import numpy as np

numbers = np.array([1, 2, 3])

result = numbers * 2

print(result)
```

Annotations:

| Code                 | Explanation                           |
| -------------------- | ------------------------------------- |
| `import numpy as np` | Imports NumPy using the alias `np`.   |
| `np.array(...)`      | Creates a NumPy array.                |
| `numbers * 2`        | Performs element-wise multiplication. |
| `print(result)`      | Displays the resulting array.         |

This is particularly useful for learners moving from Python lists to NumPy arrays.

---

# 10. C3 Example — Pandas

```python id="q4h7ns"
import pandas as pd

data = {
    "name": ["Alice", "Bob"],
    "score": [85, 92]
}

df = pd.DataFrame(data)

print(df)
```

Annotations:

| Code                  | Explanation                          |
| --------------------- | ------------------------------------ |
| `import pandas as pd` | Imports Pandas using the alias `pd`. |
| `data = {...}`        | Creates the source data structure.   |
| `pd.DataFrame(data)`  | Converts the data into a DataFrame.  |
| `print(df)`           | Displays the DataFrame.              |

C3 is excellent for explaining short library workflows like this.

---

# 11. C3 Example — SQL

```sql id="s7f1y4"
SELECT name
FROM students
WHERE score > 80;
```

Annotations:

| SQL                | Explanation                          |
| ------------------ | ------------------------------------ |
| `SELECT name`      | Requests the `name` column.          |
| `FROM students`    | Specifies the source table.          |
| `WHERE score > 80` | Filters rows whose score exceeds 80. |

This demonstrates that C3 is not restricted to conventional programming languages.

---

# 12. C3 Example — JavaScript

```javascript id="w4k9tz"
const numbers = [10, 20, 30];

const doubled = numbers.map(
    number => number * 2
);

console.log(doubled);
```

Annotations:

| Code                   | Explanation                                         |
| ---------------------- | --------------------------------------------------- |
| `const numbers = ...`  | Creates the source array.                           |
| `numbers.map(...)`     | Creates a new array by transforming each element.   |
| `number => number * 2` | Defines the transformation applied to each element. |
| `console.log(...)`     | Displays the resulting array.                       |

---

# 13. C3 Example — TypeScript

```typescript id="k6t2p8"
interface User {
    name: string;
    age: number;
}

const user: User = {
    name: "Alice",
    age: 25
};
```

Annotations:

| Code               | Explanation                                     |
| ------------------ | ----------------------------------------------- |
| `interface User`   | Defines the expected structure of a `User`.     |
| `name: string`     | Requires a string-valued `name` property.       |
| `age: number`      | Requires a numeric `age` property.              |
| `const user: User` | Declares a value conforming to the `User` type. |

---

# 14. C3 Example — REST API

```text id="1a7k2s"
GET /api/students/101
```

Annotations:

| Component       | Explanation                                 |
| --------------- | ------------------------------------------- |
| `GET`           | Requests a resource.                        |
| `/api/students` | Identifies the student resource collection. |
| `/101`          | Identifies the requested student.           |

Again, C3 can annotate a technical command rather than only source-code lines.

---

# 15. C3 Example — Data Engineering

```text id="u8v5j2"
raw_data
    ↓
clean_data
    ↓
transformed_data
    ↓
warehouse
```

Annotations:

| Stage              | Explanation                                       |
| ------------------ | ------------------------------------------------- |
| `raw_data`         | Represents incoming source data.                  |
| `clean_data`       | Represents validated/cleaned data.                |
| `transformed_data` | Represents processed data.                        |
| `warehouse`        | Represents the destination for analytics/storage. |

---

# 16. C3 Example — Machine Learning

```python id="e8s2h6"
model.fit(X_train, y_train)

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print(accuracy)
```

Annotations:

| Code                  | Explanation                            |
| --------------------- | -------------------------------------- |
| `model.fit(...)`      | Trains the model using training data.  |
| `model.predict(...)`  | Generates predictions for test inputs. |
| `accuracy_score(...)` | Calculates prediction accuracy.        |
| `print(accuracy)`     | Displays the calculated metric.        |

---

# 17. C3 Example — Authentication

Conceptual flow:

```text id="r7h3m0"
User
  ↓
Credentials
  ↓
Authentication Service
  ↓
Identity Verification
  ↓
Authenticated Session
```

Annotations:

| Stage                  | Explanation                                     |
| ---------------------- | ----------------------------------------------- |
| User                   | Initiates the authentication process.           |
| Credentials            | Provides identity evidence.                     |
| Authentication Service | Processes the authentication request.           |
| Identity Verification  | Determines whether the evidence is valid.       |
| Authenticated Session  | Represents the established authenticated state. |

For security topics, C3 should remain educational and should not introduce unnecessary offensive operational detail.

---

# 18. C3 Example — Quantum Computing

```text id="y8f1z6"
Initialize qubit
      ↓
Apply quantum operation
      ↓
Measure qubit
      ↓
Classical result
```

Annotations:

| Step             | Explanation                                              |
| ---------------- | -------------------------------------------------------- |
| Initialize qubit | Establishes the starting quantum state.                  |
| Apply operation  | Applies a quantum transformation.                        |
| Measure          | Converts the quantum state into a classical observation. |
| Classical result | Produces the observed outcome.                           |

For mathematical notation, C3 can similarly annotate each meaningful expression.

---

# 19. C3 Annotation Styles

There are three useful annotation styles.

### Style 1 — Numbered

```text id="l8y1q4"
① numbers = [1, 2, 3]
② total = sum(numbers)
③ print(total)
```

Then:

```text
① Creates the list.
② Calculates the total.
③ Displays the result.
```

### Style 2 — Side-by-side

```text id="6d2s4z"
CODE                    EXPLANATION

numbers = [...]        Creates the list.

total = sum(...)       Calculates the total.

print(total)           Displays the result.
```

### Style 3 — Inline callouts

```text id="w6c3x8"
numbers = [1, 2, 3]  ← Creates the list
total = sum(numbers) ← Calculates the sum
```

For the Tutorial Engine's A4 design:

> **Side-by-side is the preferred desktop representation.**

---

# 20. C3 A4 Portrait Layout

The recommended A4 structure:

```text id="q5h9az"
┌────────────────────────────────────────────────────────┐
│ CODE                                                   │
│                                                        │
│ Python List Mutation                                   │
│                                                        │
│ ANNOTATED CODE                                         │
│                                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ① numbers = [10, 20, 30]                         │   │
│ │                                                  │   │
│ │ ② numbers.append(40)                             │   │
│ │                                                  │   │
│ │ ③ print(numbers)                                 │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ WHAT EACH LINE DOES                                    │
│                                                        │
│ ① Creates the initial list.                           │
│                                                        │
│ ② Adds 40 to the end of the list.                    │
│                                                        │
│ ③ Displays the modified list.                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

This is much more appropriate than making each line a giant card.

---

# 21. C3 Desktop Layout

```text id="4q7jtz"
┌──────────────────────────────────────────────────────────┐
│ CODE                                                     │
│ Python List Mutation                                     │
│                                                          │
│ ┌────────────────────────────┬─────────────────────────┐ │
│ │ CODE                       │ WHAT IT DOES            │ │
│ ├────────────────────────────┼─────────────────────────┤ │
│ │ ① numbers = [10,20,30]     │ Creates the list.       │ │
│ │                            │                         │ │
│ │ ② numbers.append(40)      │ Adds 40 to the list.    │ │
│ │                            │                         │ │
│ │ ③ print(numbers)          │ Displays the list.      │ │
│ └────────────────────────────┴─────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

# 22. C3 Mobile Layout

On mobile, side-by-side content should collapse:

```text id="6y7r9x"
┌─────────────────────────────┐
│ CODE                        │
│ Python List Mutation        │
│                             │
│ ANNOTATED CODE              │
│                             │
│ ① numbers = [10, 20, 30]   │
│                             │
│ Creates the initial list.   │
│                             │
│ ② numbers.append(40)       │
│                             │
│ Adds 40 to the list.        │
│                             │
│ ③ print(numbers)           │
│                             │
│ Displays the modified list. │
└─────────────────────────────┘
```

---

# 23. C3 Semantic HTML Architecture

Recommended structure:

```text id="y1w5so"
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>
│    └── <pre>
│         └── <code>
│
└── <section>
     ├── <h3>
     └── <ol>
          └── <li>
               ├── <code>
               └── <p>
```

For line-by-line annotations, an ordered list is semantically useful because the annotations correspond to a sequence.

---

# 24. Complete C3 HTML Tag Inventory

| HTML Tag    | Purpose               | Color Role    |
| ----------- | --------------------- | ------------- |
| `<section>` | Root/block sections   | Neutral       |
| `<header>`  | Block header          | Neutral       |
| `<span>`    | Eyebrow               | **Primary**   |
| `<h2>`      | Main title            | **Secondary** |
| `<h3>`      | Section headings      | **Primary**   |
| `<pre>`     | Code formatting       | Neutral       |
| `<code>`    | Source code           | **Secondary** |
| `<ol>`      | Ordered annotations   | Neutral       |
| `<li>`      | Individual annotation | **Secondary** |
| `<p>`       | Explanation text      | **Secondary** |
| `<strong>`  | Important concept     | **Secondary** |
| `<div>`     | Layout                | Neutral       |

---

# 25. C3 SUIA Color Allocation

The same SUIA colors remain locked:

```text id="3tq7ah"
Primary Pink
#F54A8D

Secondary Navy
#0B1B3D
```

Recommended allocation:

```text id="e3s4x2"
PINK
│
├── CODE label
├── ANNOTATED CODE label
├── annotation numbers
└── key emphasis

NAVY
│
├── title
├── code
├── explanations
└── annotation text
```

---

# 26. C3 70/30 Rule

The visual composition should approximately follow:

```text id="b9x2a0"
70%
Navy + white/light surfaces

30%
Pink
```

But the pink should be used as **navigation and emphasis**, not as a large fill.

For example:

```text id="g7n3c1"
①  numbers = [10, 20, 30]
   ↑
 Pink marker

numbers = ...
   ↑
 Navy code
```

This gives the learner an immediate visual correspondence.

---

# 27. C3 Tag-by-Tag Color Table

| Tag               | Example                | Color       |
| ----------------- | ---------------------- | ----------- |
| `<span>`          | `CODE`                 | **#F54A8D** |
| `<h2>`            | `Python List Mutation` | **#0B1B3D** |
| `<h3>`            | `Annotated Code`       | **#F54A8D** |
| `<pre>`           | Code surface           | `#F7F9FC`   |
| `<code>`          | Source code            | **#0B1B3D** |
| `<ol>`            | Annotation list        | Neutral     |
| `<li>`            | Annotation             | **#0B1B3D** |
| `<strong>`        | Key syntax             | **#0B1B3D** |
| Annotation marker | `①`                    | **#F54A8D** |

---

# 28. C3 Complete HTML

```html id="7m1p9c"
<section
    class="tutorial-block code-block code-c3"
    data-block="code"
    data-version="C3"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Python List Mutation
        </h2>

    </header>


    <section class="annotated-code">

        <h3>
            Annotated Code
        </h3>

        <pre><code>① numbers = [10, 20, 30]

② numbers.append(40)

③ print(numbers)</code></pre>

    </section>


    <section class="code-annotations">

        <h3>
            What Each Line Does
        </h3>

        <ol>

            <li>
                <code>numbers = [10, 20, 30]</code>

                <p>
                    Creates the initial list.
                </p>
            </li>


            <li>
                <code>numbers.append(40)</code>

                <p>
                    Adds <strong>40</strong>
                    to the end of the list.
                </p>
            </li>


            <li>
                <code>print(numbers)</code>

                <p>
                    Displays the modified list.
                </p>
            </li>

        </ol>

    </section>

</section>
```

---

# 29. C3 JSON

```json id="3t7l5k"
{
  "type": "code",
  "version": "C3",

  "content": {

    "title": "Python List Mutation",

    "language": "python",

    "code": "numbers = [10, 20, 30]\n\nnumbers.append(40)\n\nprint(numbers)",

    "annotations": [
      {
        "line": 1,
        "code": "numbers = [10, 20, 30]",
        "explanation": "Creates the initial list."
      },
      {
        "line": 3,
        "code": "numbers.append(40)",
        "explanation": "Adds 40 to the end of the list."
      },
      {
        "line": 5,
        "code": "print(numbers)",
        "explanation": "Displays the modified list."
      }
    ]

  }
}
```

---

# 30. C3 Why Annotations Should Be Structured JSON

We should not store:

```json id="g8h5s1"
{
  "explanation": "Line 1 does this. Line 2 does that..."
}
```

Instead:

```text id="f6p2x8"
annotations[]
     │
     ├── line
     ├── code
     └── explanation
```

This allows the renderer to create:

* side-by-side annotations
* numbered annotations
* mobile stacked annotations
* highlighted code lines
* hover/focus relationships
* accessibility-friendly representations

without changing the underlying content.

---

# 31. C3 Highlight Relationship

A powerful future UI behavior is:

```text id="7q3k0p"
Click annotation ②
       ↓
Highlight code line ②
       ↓
Highlight explanation ②
```

And the reverse:

```text id="s6y1n8"
Click code line ②
       ↓
Highlight annotation ②
```

This makes C3 much more useful than a static text explanation.

---

# 32. C3 Example With Highlight Mapping

Conceptually:

```json id="n0r4z7"
{
  "line": 3,
  "code": "numbers.append(40)",
  "explanation": "Adds 40 to the end of the list.",
  "marker": "②"
}
```

The renderer can map:

```text id="q4u1f6"
data-line="3"
        ↕
data-annotation="2"
```

This should be considered a **UI behavior**, not part of the learner-facing content itself.

---

# 33. C3 Output

Output is optional.

If included:

```text id="0z8m2a"
OUTPUT

[10, 20, 30, 40]
```

But it should remain visually secondary.

Why?

Because:

```text id="t9v4ks"
C1 → Output is central

C3 → Explanation is central
```

This preserves the architecture of the ten CodeBlock versions.

---

# 34. C3 When Output Is Useful

Include output when it helps confirm the annotations.

For example:

```python id="r5k3u7"
numbers = [10, 20, 30]

numbers.append(40)

print(numbers)
```

Output:

```text id="w3a7x1"
[10, 20, 30, 40]
```

The output validates the explanation.

But it should not become a second major teaching section.

---

# 35. C3 Recommended Code Size

| Metric                     | Recommendation |
| -------------------------- | -------------- |
| Lines                      | **3–15**       |
| Annotations                | **3–10**       |
| Explanation per annotation | 1–2 sentences  |
| Examples                   | 1              |
| Output                     | Optional       |
| Long algorithm             | ❌ Prefer C5    |

If the code becomes too long, annotation becomes visually overwhelming.

Then C5 is usually more appropriate.

---

# 36. C3 Best Use Cases

| Topic                  | Suitability |
| ---------------------- | ----------: |
| Python basics          |       ⭐⭐⭐⭐⭐ |
| Functions              |       ⭐⭐⭐⭐⭐ |
| Classes                |       ⭐⭐⭐⭐⭐ |
| List operations        |       ⭐⭐⭐⭐⭐ |
| NumPy                  |       ⭐⭐⭐⭐⭐ |
| Pandas                 |       ⭐⭐⭐⭐⭐ |
| SQL                    |       ⭐⭐⭐⭐⭐ |
| JavaScript             |       ⭐⭐⭐⭐⭐ |
| TypeScript             |       ⭐⭐⭐⭐⭐ |
| API calls              |        ⭐⭐⭐⭐ |
| Data engineering       |        ⭐⭐⭐⭐ |
| Machine learning       |        ⭐⭐⭐⭐ |
| Cybersecurity concepts |        ⭐⭐⭐⭐ |
| Quantum notation       |        ⭐⭐⭐⭐ |
| Large algorithms       |          ⭐⭐ |

---

# 37. C3 What We Should Avoid

### ❌ Explaining syntax tokens

That's primarily C2.

### ❌ Explaining execution order

That's C4/C5.

### ❌ Showing before and after

That's C6.

### ❌ Showing an incorrect implementation

That's C7.

### ❌ Showing three alternatives

That's C8.

### ❌ Full explanation + output + takeaway

That's C9.

### ❌ Interactive editing

That's C10.

---

# 38. C3 Component Architecture

```text id="w7v4n1"
CodeBlock
│
└── C3 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── AnnotatedCode
      │    └── CodeRenderer
      │         └── LineMarkers
      │
      ├── AnnotationList
      │    └── AnnotationItem[]
      │         ├── Marker
      │         ├── CodeReference
      │         └── Explanation
      │
      └── OptionalOutput
```

---

# 39. C3 Validation Rules

| Field              |    Required |
| ------------------ | ----------: |
| `type`             |           ✅ |
| `version`          |           ✅ |
| `title`            |           ✅ |
| `language`         | Recommended |
| `code`             |           ✅ |
| `annotations`      |           ✅ |
| `line` / reference |           ✅ |
| `explanation`      |           ✅ |
| Output             |    Optional |
| Syntax glossary    |           ❌ |
| Execution steps    |           ❌ |
| Before/After       |           ❌ |
| Mistake            |           ❌ |
| Multiple examples  |           ❌ |
| Interactive editor |           ❌ |

---

# 40. C3 Final Technical Specification

| Area                    | C3 Decision                           |
| ----------------------- | ------------------------------------- |
| Version                 | **C3**                                |
| Name                    | **Annotated Code**                    |
| Main question           | **What does each important line do?** |
| Structure               | **Code + line/statement annotations** |
| Best for                | Beginners                             |
| Primary                 | **#F54A8D**                           |
| Secondary               | **#0B1B3D**                           |
| Theme                   | Light                                 |
| Gradient                | ❌                                     |
| Dark theme              | ❌                                     |
| A4                      | **Portrait**                          |
| Root                    | `<section>`                           |
| Title                   | `<h2>`                                |
| Labels                  | `<h3>`                                |
| Code                    | `<pre><code>`                         |
| Annotation container    | `<ol>`                                |
| Annotation item         | `<li>`                                |
| Explanation             | `<p>`                                 |
| Output                  | Optional                              |
| Syntax glossary         | ❌                                     |
| Execution walkthrough   | ❌                                     |
| Multiple examples       | ❌                                     |
| Debugging               | ❌                                     |
| Interactive editor      | ❌                                     |
| JSON-driven             | ✅                                     |
| Responsive              | ✅                                     |
| Accessible              | ✅                                     |
| Recommended code size   | **3–15 lines**                        |
| Recommended annotations | **3–10**                              |
| Learning level          | **Beginner → Intermediate**           |

---

# 41. C3 Final Mental Model

```text id="j6f2p8"
                         C3
                          │
                          ▼
                       CODE
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
        Line 1          Line 2          Line 3
          │               │               │
          ▼               ▼               ▼
     Explanation     Explanation     Explanation
          │               │               │
          └───────────────┼───────────────┘
                          ▼
                  Learner Understands
                    The Code Structure
```

The defining principle is:

> **C3 connects each meaningful line or statement of a code example with a concise explanation of what that part contributes to the program.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| C1      | Basic Code Example          | ✅                   |
| C2      | Syntax + Explanation        | ✅                   |
| **C3**  | **Annotated Code**          | ✅ **Completed now** |
| C4      | Code + Output               | ⏳ Next              |
| C5      | Code Walkthrough            | ⏳                   |
| C6      | Before / After Code         | ⏳                   |
| C7      | Common Mistake              | ⏳                   |
| C8      | Multiple Examples           | ⏳                   |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C3 is now complete. The next version is C4 — Code + Output.**



```python

```

# BLOCK 4 — CodeBlock

# C4 — Code + Output

C4 is the fourth version of the **CodeBlock**.

The CodeBlock progression is now:

| Version | Name                        | Main Learning Question                    |
| ------- | --------------------------- | ----------------------------------------- |
| C1      | Basic Code Example          | What does this code produce?              |
| C2      | Syntax + Explanation        | What does this syntax mean?               |
| C3      | Annotated Code              | What does each important line do?         |
| **C4**  | **Code + Output**           | **What happens when this code executes?** |
| C5      | Code Walkthrough            | How does execution progress step by step? |
| C6      | Before / After Code         | What changed and why?                     |
| C7      | Common Mistake              | What is wrong and how do I correct it?    |
| C8      | Multiple Examples           | What different patterns can I use?        |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect? |
| C10     | Interactive / Playground    | Can I experiment with the code?           |

The defining structure of C4 is:

```text id="x1b7tq"
CODE
  ↓
EXECUTION
  ↓
OUTPUT
```

The important distinction is that **output is now a first-class learning element**.

---

# 1. Purpose of C4

C4 is designed to show the learner the relationship between:

> **What I wrote → what the program produces**

C1 also has Code → Output, but C1 is the **minimal basic example**.

C4 gives the code and output a more deliberate educational relationship.

For example:

```python id="n6k2sw"
numbers = [10, 20, 30]

numbers.append(40)

print(numbers)
```

Execution:

```text id="8f7j1p"
numbers
   ↓
[10, 20, 30]

append(40)
   ↓
[10, 20, 30, 40]

print()
   ↓
[10, 20, 30, 40]
```

Output:

```text id="1x5y3r"
[10, 20, 30, 40]
```

The learner can therefore understand the observable behavior.

---

# 2. C4 Core Principle

C4 answers:

> **“What result does this code produce when it runs?”**

It is especially useful when the learner needs to understand:

* return values
* printed output
* transformed data
* calculations
* query results
* API responses
* state changes
* rendered results

---

# 3. C4 Core Structure

The canonical structure is:

```text id="8v7n5k"
┌──────────────────────────────────────────────┐
│ CODE                                         │
│                                              │
│ numbers = [10, 20, 30]                       │
│ numbers.append(40)                           │
│ print(numbers)                               │
│                                              │
│                    ↓                         │
│                                              │
│ OUTPUT                                       │
│                                              │
│ [10, 20, 30, 40]                             │
└──────────────────────────────────────────────┘
```

The visual relationship between the two sections should be immediately obvious.

---

# 4. C4 vs C1

This distinction needs to remain clear.

### C1 — Basic Code Example

C1 is the smallest representation:

```text id="4g6v2r"
CODE
 ↓
OUTPUT
```

It is ideal for extremely simple syntax demonstrations.

### C4 — Code + Output

C4 deliberately emphasizes the **execution/result relationship**:

```text id="6p8z1n"
CODE
 ↓
EXECUTION
 ↓
OUTPUT
```

C4 can therefore include:

* execution cue
* input/output relationship
* expected result
* rendered result
* concise result interpretation

without becoming C9.

---

# 5. C4 vs C3

### C3

```text id="a1x7q3"
Code
 ↓
Line 1 explanation
Line 2 explanation
Line 3 explanation
```

### C4

```text id="t5j2m8"
Code
 ↓
Execution
 ↓
Output
```

C3 explains **what each part does**.

C4 emphasizes **what the program produces**.

---

# 6. C4 vs C5

### C4

```text id="r8w3y6"
Code
 ↓
Result
```

### C5

```text id="p7k4s2"
Step 1
 ↓
State
 ↓
Step 2
 ↓
State
 ↓
Step 3
 ↓
Result
```

C5 is a detailed execution walkthrough.

C4 should remain concise.

---

# 7. C4 Example — Python Calculation

```python id="c9x5m2"
price = 100
tax = 10

total = price + tax

print(total)
```

Output:

```text id="e2v7q4"
110
```

The important relationship is:

```text id="n5a1r8"
100 + 10
   ↓
110
```

---

# 8. C4 Example — Python Function

```python id="h3j8q0"
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

Output:

```text id="b6k2w5"
30
```

C4 lets the learner immediately observe:

```text id="f9m3v1"
add(10, 20)
      ↓
     30
```

---

# 9. C4 Example — Python List

```python id="u4p7s9"
numbers = [10, 20, 30]

numbers.append(40)

print(numbers)
```

Output:

```text id="z8q2n6"
[10, 20, 30, 40]
```

The learner sees the effect of the operation.

---

# 10. C4 Example — Python Dictionary

```python id="m5r1x8"
student = {
    "name": "Alice",
    "score": 90
}

print(student["score"])
```

Output:

```text id="q7v3k2"
90
```

---

# 11. C4 Example — NumPy

```python id="a6d9p4"
import numpy as np

numbers = np.array([1, 2, 3])

result = numbers * 2

print(result)
```

Output:

```text id="w2s8f5"
[2 4 6]
```

The result visually demonstrates NumPy's element-wise operation.

---

# 12. C4 Example — Pandas

```python id="k1n7c3"
import pandas as pd

df = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "score": [85, 92]
})

print(df["score"].mean())
```

Output:

```text id="t4y9m1"
88.5
```

The learner can immediately see the transformation:

```text id="v8q2l6"
85, 92
  ↓
mean()
  ↓
88.5
```

---

# 13. C4 Example — SQL

```sql id="j5r8x2"
SELECT name
FROM students
WHERE score > 80;
```

Output:

```text id="d3m7k9"
Alice
Bob
Charlie
```

Here the output is a result set rather than console text.

---

# 14. C4 Example — API

Request:

```text id="n2f6q8"
GET /api/students/101
```

Response:

```json id="c7w4p1"
{
  "id": 101,
  "name": "Alice",
  "score": 92
}
```

C4 is very useful for API education because:

```text id="x5v8r3"
Request
   ↓
Response
```

is itself the fundamental observable relationship.

---

# 15. C4 Example — JavaScript

```javascript id="m8q1z5"
const numbers = [10, 20, 30];

const result = numbers.map(
    number => number * 2
);

console.log(result);
```

Output:

```text id="r6y3k8"
[20, 40, 60]
```

---

# 16. C4 Example — TypeScript

```typescript id="f2p7n4"
function square(value: number): number {
    return value * value;
}

console.log(square(5));
```

Output:

```text id="s9w4c1"
25
```

---

# 17. C4 Example — Data Engineering

Conceptual transformation:

```text id="v3k7m2"
Input Records
      ↓
Filter
      ↓
Valid Records
```

Input:

```text id="j6p2r8"
100 records
```

Output:

```text id="q4x9n1"
82 valid records
```

C4 can therefore show data-processing results without requiring executable code.

---

# 18. C4 Example — Machine Learning

```python id="h8m3v6"
predictions = model.predict(X_test)

print(predictions[:3])
```

Output:

```text id="y5q1k7"
[1 0 1]
```

The output provides a concrete result of the prediction operation.

---

# 19. C4 Example — Authentication

A conceptual flow can use:

```text id="p4z8c2"
Authentication Request
        ↓
Identity Verification
        ↓
Authentication Result
```

Result:

```text id="n7r3x5"
Authenticated
```

The important distinction is that C4 can show an observable system result without exposing sensitive implementation details.

---

# 20. C4 Example — Quantum Computing

Conceptual:

```text id="u1f6s9"
Initial State
     ↓
Quantum Operation
     ↓
Measurement
```

Output:

```text id="b8m2q4"
Measured State: |1⟩
```

For educational material, the output can be conceptual or mathematically represented depending on the topic.

---

# 21. C4 Input → Output Variant

C4 can optionally show an explicit input:

```text id="g3w7n5"
INPUT

[10, 20, 30]

       ↓

CODE

numbers.append(40)

       ↓

OUTPUT

[10, 20, 30, 40]
```

This is particularly useful for transformations.

---

# 22. C4 Input → Code → Output

The most expressive C4 structure is:

```text id="k5r2v8"
┌──────────────┐
│ INPUT        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CODE         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ OUTPUT       │
└──────────────┘
```

However:

> **Input is optional.**

The canonical C4 definition remains:

```text id="m8x4q1"
Code → Output
```

---

# 23. C4 Output Types

C4 should support different result formats.

| Output Type      | Example         |
| ---------------- | --------------- |
| Text             | `Hello Alice`   |
| Number           | `110`           |
| Boolean          | `True`          |
| List             | `[10, 20, 30]`  |
| JSON             | `{ "id": 101 }` |
| Table            | Query result    |
| Image/render     | HTML/CSS result |
| DataFrame        | Tabular output  |
| Conceptual state | `Authenticated` |
| Mathematical     | `x = 25`        |

This makes C4 usable across all educational domains.

---

# 24. C4 Semantic HTML Architecture

Recommended:

```text id="u7q3k9"
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>
│    └── <pre>
│         └── <code>
│
├── <div>
│    └── Execution indicator
│
└── <section>
     ├── <h3>
     └── <pre>
          └── <code>
```

If input is present:

```text id="q8m2f5"
<section>
    <h3>Input</h3>
    ...
</section>
```

---

# 25. Complete C4 HTML Tag Inventory

| HTML Tag       | Purpose                       | Color Role    |
| -------------- | ----------------------------- | ------------- |
| `<section>`    | Root/block sections           | Neutral       |
| `<header>`     | Block header                  | Neutral       |
| `<span>`       | Eyebrow                       | **Primary**   |
| `<h2>`         | Main title                    | **Secondary** |
| `<h3>`         | Section labels                | **Primary**   |
| `<pre>`        | Code/output formatting        | Neutral       |
| `<code>`       | Source/result content         | **Secondary** |
| `<div>`        | Execution indicator/layout    | Neutral       |
| `<p>`          | Optional explanation          | **Secondary** |
| `<strong>`     | Important result              | **Secondary** |
| `<figure>`     | Rendered output/visual result | Neutral       |
| `<figcaption>` | Result description            | **Secondary** |

---

# 26. C4 SUIA Color System

The established SUIA colors remain unchanged:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Supporting colors:

| Role           | Hex       |
| -------------- | --------- |
| Background     | `#FFFFFF` |
| Code Surface   | `#F7F9FC` |
| Output Surface | `#FFFFFF` |
| Input Surface  | `#F8FAFC` |
| Border         | `#D9E0EA` |
| Pink Surface   | `#FFF7FA` |
| Pink Border    | `#F2C4D8` |
| Muted Text     | `#45658F` |

---

# 27. C4 70/30 Color Rule

The visual balance remains approximately:

```text id="w1n5g8"
70%
Navy + white/light neutrals

30%
Pink
```

Pink should be concentrated around:

```text id="x8v2p4"
CODE
OUTPUT
EXECUTION
```

The visual flow can be:

```text id="r4m7q1"
CODE
  ↓
EXECUTE
  ↓
OUTPUT
```

with the execution marker highlighted in pink.

---

# 28. C4 Tag-by-Tag Color Table

| Tag                 | Example                | Color       |
| ------------------- | ---------------------- | ----------- |
| `<span>`            | `CODE`                 | **#F54A8D** |
| `<h2>`              | `Python List Mutation` | **#0B1B3D** |
| `<h3>`              | `Code`                 | **#F54A8D** |
| `<pre>`             | Code surface           | `#F7F9FC`   |
| `<code>`            | Source code            | **#0B1B3D** |
| Execution indicator | `RUN →`                | **#F54A8D** |
| `<h3>`              | `Output`               | **#F54A8D** |
| Output `<pre>`      | Result surface         | `#FFFFFF`   |
| Output `<code>`     | Result                 | **#0B1B3D** |
| `<figcaption>`      | Result meaning         | **#0B1B3D** |

---

# 29. C4 Execution Indicator

The execution indicator is optional but useful.

Example:

```text id="r2c8m6"
┌─────────────────────────┐
│       CODE              │
└───────────┬─────────────┘
            │
            ▼
       ● EXECUTE
            │
            ▼
┌─────────────────────────┐
│       OUTPUT            │
└─────────────────────────┘
```

The `EXECUTE` label should be subtle.

It is a **visual relationship**, not an interactive Run button.

An actual Run button belongs to C10.

---

# 30. C4 Important Rule — No Fake Interactivity

Do not make:

```text id="y7q3n2"
▶ Run Code
```

an actual interactive control in C4.

C4 is a static learning representation.

If the learner should be able to edit and execute code:

> **Use C10.**

This preserves the architecture.

---

# 31. C4 Complete HTML

```html id="r5k2v8"
<section
    class="tutorial-block code-block code-c4"
    data-block="code"
    data-version="C4"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Python List Mutation
        </h2>

    </header>


    <section class="code-section">

        <h3>
            Code
        </h3>

        <pre><code>numbers = [10, 20, 30]

numbers.append(40)

print(numbers)</code></pre>

    </section>


    <div class="execution-indicator"
         aria-label="Code execution">

        <span>
            ↓
        </span>

        <strong>
            EXECUTION
        </strong>

        <span>
            ↓
        </span>

    </div>


    <section class="output-section">

        <h3>
            Output
        </h3>

        <pre><code>[10, 20, 30, 40]</code></pre>

    </section>

</section>
```

---

# 32. C4 JSON

```json id="c3v8x6"
{
  "type": "code",
  "version": "C4",

  "content": {

    "title": "Python List Mutation",

    "language": "python",

    "code": "numbers = [10, 20, 30]\n\nnumbers.append(40)\n\nprint(numbers)",

    "execution": {
      "enabled": true,
      "label": "EXECUTION"
    },

    "output": {
      "type": "text",
      "value": "[10, 20, 30, 40]"
    }

  }
}
```

---

# 33. C4 JSON — Input Variant

When input is meaningful:

```json id="j5r1m9"
{
  "type": "code",
  "version": "C4",

  "content": {

    "title": "Double a Number",

    "language": "python",

    "input": {
      "type": "value",
      "value": "10"
    },

    "code": "number = 10\nresult = number * 2\nprint(result)",

    "output": {
      "type": "number",
      "value": "20"
    }

  }
}
```

This gives the renderer the ability to show:

```text id="q6f2w8"
INPUT
  ↓
CODE
  ↓
OUTPUT
```

when appropriate.

---

# 34. C4 A4 Portrait Layout

The A4 composition:

```text id="v8k3n5"
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Python List Mutation                                   │
│                                                        │
│ CODE                                                   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = [10, 20, 30]                           │   │
│ │                                                  │   │
│ │ numbers.append(40)                              │   │
│ │                                                  │   │
│ │ print(numbers)                                   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│                     ↓                                  │
│                  EXECUTION                             │
│                     ↓                                  │
│                                                        │
│ OUTPUT                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [10, 20, 30, 40]                                 │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The code and output remain the dominant content.

---

# 35. C4 Desktop Layout

```text id="j7m4q9"
┌──────────────────────────────────────────────────────────┐
│ CODE                                                     │
│ Python List Mutation                                     │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ numbers = [10, 20, 30]                               │ │
│ │ numbers.append(40)                                   │ │
│ │ print(numbers)                                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                         ↓                                │
│                     EXECUTION                            │
│                         ↓                                │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [10, 20, 30, 40]                                     │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

# 36. C4 Mobile Layout

```text id="b5n8x2"
┌─────────────────────────────┐
│ CODE                        │
│                             │
│ Python List Mutation        │
│                             │
│ CODE                        │
│ ┌─────────────────────────┐ │
│ │ numbers = [10, 20, 30]  │ │
│ │                         │ │
│ │ numbers.append(40)      │ │
│ │                         │ │
│ │ print(numbers)          │ │
│ └─────────────────────────┘ │
│                             │
│            ↓                │
│         EXECUTION           │
│            ↓                │
│                             │
│ OUTPUT                      │
│ ┌─────────────────────────┐ │
│ │ [10, 20, 30, 40]        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

# 37. C4 Output Presentation Rules

The output should be:

### Accurate

It must correspond to the code.

### Clearly labelled

The learner should never wonder whether something is source code or output.

### Selectable

Output should remain text when text is appropriate.

### Visually distinct

The output surface can differ subtly from the code surface.

### Compact

Do not make a one-line result occupy half the A4 page.

---

# 38. C4 Output for Tables

For SQL or DataFrame results:

```text id="7q1m8x"
OUTPUT

┌─────────┬───────┐
│ name    │ score │
├─────────┼───────┤
│ Alice   │  85   │
│ Bob     │  92   │
└─────────┴───────┘
```

The renderer may use a semantic `<table>` when the output is genuinely tabular.

---

# 39. C4 Output for JSON

For API examples:

```text id="f4r9v2"
OUTPUT

{
  "id": 101,
  "name": "Alice"
}
```

Use:

```html id="r1q5k7"
<pre><code>...</code></pre>
```

rather than forcing JSON into a normal paragraph.

---

# 40. C4 Output for Rendered UI

For HTML/CSS:

```html id="d7m2p8"
<h1>Hello World</h1>
```

The output can be:

```text id="a3w6x1"
┌──────────────────────────────┐
│                              │
│      Hello World             │
│                              │
└──────────────────────────────┘
```

In that case, the result may use:

```html id="x8f4q2"
<figure>
    ...
    <figcaption>
        Rendered result
    </figcaption>
</figure>
```

---

# 41. C4 Accessibility

The execution relationship should not depend only on arrows or color.

For example:

```html id="n6c1y8"
<div aria-label="Code execution leading to output">
```

The labels:

```text id="m8v4z2"
CODE
EXECUTION
OUTPUT
```

should remain explicit.

This ensures the conceptual flow survives:

* screen readers
* grayscale printing
* low-color environments
* mobile layouts

---

# 42. C4 Responsive Code

Long code should use horizontal scrolling:

```text id="j9x2p7"
┌──────────────────────────────┐
│ code line that is very long →│
└──────────────────────────────┘
```

Do not reduce code typography excessively just to avoid scrolling.

---

# 43. C4 Syntax Highlighting

Syntax highlighting is allowed.

However, the structural design remains:

```text id="s3k7w1"
SUIA identity
   ↓
#F54A8D
#0B1B3D
```

Syntax colors should remain restrained.

---

# 44. C4 Recommended Code Size

| Component          |          Recommendation |
| ------------------ | ----------------------: |
| Code               |              2–20 lines |
| Output             |     1–15 lines normally |
| Input              |                Optional |
| Explanation        | Optional and very short |
| Walkthrough        |                       ❌ |
| Multiple examples  |                       ❌ |
| Interactive editor |                       ❌ |

If execution has many meaningful states, C5 becomes more appropriate.

---

# 45. C4 Best Use Cases

| Topic                 | Suitability |
| --------------------- | ----------: |
| Variables             |       ⭐⭐⭐⭐⭐ |
| Operators             |       ⭐⭐⭐⭐⭐ |
| Functions             |       ⭐⭐⭐⭐⭐ |
| List mutation         |       ⭐⭐⭐⭐⭐ |
| NumPy operations      |       ⭐⭐⭐⭐⭐ |
| Pandas operations     |       ⭐⭐⭐⭐⭐ |
| SQL queries           |       ⭐⭐⭐⭐⭐ |
| API requests          |       ⭐⭐⭐⭐⭐ |
| JavaScript            |       ⭐⭐⭐⭐⭐ |
| TypeScript            |       ⭐⭐⭐⭐⭐ |
| Data transformation   |       ⭐⭐⭐⭐⭐ |
| ML prediction         |        ⭐⭐⭐⭐ |
| Authentication result |        ⭐⭐⭐⭐ |
| Quantum measurement   |        ⭐⭐⭐⭐ |
| Complex algorithms    |          ⭐⭐ |

---

# 46. C4 What We Should Avoid

### ❌ Detailed syntax glossary

That is C2.

### ❌ Line-by-line explanation

That is C3.

### ❌ Multiple execution states

That is C5.

### ❌ Before/after comparison

That is C6.

### ❌ Incorrect code

That is C7.

### ❌ Multiple examples

That is C8.

### ❌ Long explanation

That pushes toward C9.

### ❌ Real Run button

That is C10.

---

# 47. C4 Component Architecture

```text id="p8w2m6"
CodeBlock
│
└── C4 Renderer
      │
      ├── Header
      │
      ├── Input
      │    └── Optional
      │
      ├── CodeSection
      │    └── CodeRenderer
      │
      ├── ExecutionIndicator
      │
      └── OutputSection
           └── OutputRenderer
```

---

# 48. C4 Validation Rules

| Field              |    Required |
| ------------------ | ----------: |
| `type`             |           ✅ |
| `version`          |           ✅ |
| `title`            |           ✅ |
| `code`             |           ✅ |
| `language`         | Recommended |
| `output`           | Recommended |
| `output.type`      | Recommended |
| Input              |    Optional |
| Explanation        |    Optional |
| Syntax breakdown   |           ❌ |
| Line annotations   |           ❌ |
| Execution steps    |           ❌ |
| Before/After       |           ❌ |
| Multiple examples  |           ❌ |
| Interactive editor |           ❌ |

---

# 49. C4 Final Technical Specification

| Area                    | C4 Decision                               |
| ----------------------- | ----------------------------------------- |
| Version                 | **C4**                                    |
| Name                    | **Code + Output**                         |
| Main question           | **What happens when this code executes?** |
| Structure               | **Code → Execution → Output**             |
| Best for                | Understanding behavior                    |
| Primary                 | **#F54A8D**                               |
| Secondary               | **#0B1B3D**                               |
| Theme                   | Light                                     |
| Gradient                | ❌                                         |
| Dark theme              | ❌                                         |
| A4                      | **Portrait**                              |
| Root                    | `<section>`                               |
| Title                   | `<h2>`                                    |
| Labels                  | `<h3>`                                    |
| Code                    | `<pre><code>`                             |
| Output                  | `<pre><code>` / `<table>` / `<figure>`    |
| Input                   | Optional                                  |
| Execution indicator     | Optional                                  |
| Syntax breakdown        | ❌                                         |
| Line-by-line annotation | ❌                                         |
| Execution walkthrough   | ❌                                         |
| Multiple examples       | ❌                                         |
| Debugging               | ❌                                         |
| Interactive editor      | ❌                                         |
| JSON-driven             | ✅                                         |
| Responsive              | ✅                                         |
| Accessible              | ✅                                         |
| Recommended code size   | **2–20 lines**                            |
| Learning level          | **Beginner → Intermediate**               |

---

# 50. C4 Final Mental Model

```text id="y6q1r8"
                         C4
                          │
                          ▼
                        CODE
                          │
                          ▼
                     EXECUTION
                          │
                          ▼
                       OUTPUT
                          │
                          ▼
                  OBSERVED BEHAVIOR
```

The defining principle is:

> **C4 makes the relationship between source code and its observable execution result visually explicit, allowing the learner to understand what the program produces without requiring a full execution walkthrough.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| C1      | Basic Code Example          | ✅                   |
| C2      | Syntax + Explanation        | ✅                   |
| C3      | Annotated Code              | ✅                   |
| **C4**  | **Code + Output**           | ✅ **Completed now** |
| C5      | Code Walkthrough            | ⏳ Next              |
| C6      | Before / After Code         | ⏳                   |
| C7      | Common Mistake              | ⏳                   |
| C8      | Multiple Examples           | ⏳                   |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C4 is complete. The next version is C5 — Code Walkthrough.**



```python

```

# BLOCK 4 — CodeBlock

# C5 — Code Walkthrough

C5 is the fifth version of the **CodeBlock**.

The CodeBlock progression is now:

| Version | Name                        | Main Learning Question                               |
| ------- | --------------------------- | ---------------------------------------------------- |
| C1      | Basic Code Example          | What does this code produce?                         |
| C2      | Syntax + Explanation        | What does this syntax mean?                          |
| C3      | Annotated Code              | What does each important line do?                    |
| C4      | Code + Output               | What happens when the code executes?                 |
| **C5**  | **Code Walkthrough**        | **How does the code execute from beginning to end?** |
| C6      | Before / After Code         | What changed and why?                                |
| C7      | Common Mistake              | What is wrong and how do I correct it?               |
| C8      | Multiple Examples           | What different patterns can I use?                   |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect?            |
| C10     | Interactive / Playground    | Can I experiment with the code?                      |

The canonical C5 structure is:

```text
CODE
  ↓
STEP 1
  ↓
STEP 2
  ↓
STEP 3
  ↓
RESULT
```

---

# 1. Purpose of C5

C5 is designed for code where simply showing the code and final output is **not enough**.

The learner needs to understand the **sequence of execution**.

For example:

```python
numbers = [1, 2, 3]

total = 0

for number in numbers:
    total += number

print(total)
```

The learner needs to see:

```text
Start
  ↓
total = 0
  ↓
number = 1
  ↓
total = 1
  ↓
number = 2
  ↓
total = 3
  ↓
number = 3
  ↓
total = 6
  ↓
print(6)
```

That is C5.

---

# 2. C5 Core Principle

C5 answers:

> **“What happens at each important stage while this code runs?”**

This makes C5 especially valuable for:

* loops
* conditionals
* recursion
* algorithms
* data transformations
* pipelines
* state changes
* function calls
* asynchronous flows
* SQL processing concepts
* machine-learning workflows

---

# 3. C5 vs C4

This distinction is extremely important.

### C4

```text
CODE
  ↓
OUTPUT
```

It tells the learner **what happened**.

### C5

```text
CODE
  ↓
STEP 1
  ↓
STEP 2
  ↓
STEP 3
  ↓
OUTPUT
```

It explains **how it happened**.

Therefore:

> **C4 = final observable behavior**

> **C5 = execution journey**

---

# 4. C5 vs C3

C3:

```text
Line 1 → what this line means
Line 2 → what this line means
Line 3 → what this line means
```

C5:

```text
Execution Step 1
       ↓
State changes
       ↓
Execution Step 2
       ↓
State changes
       ↓
Execution Step 3
```

C3 is primarily **code explanation**.

C5 is primarily **execution reasoning**.

---

# 5. Canonical C5 Layout

```text
┌──────────────────────────────────────────────────┐
│ CODE                                             │
│                                                  │
│ for number in numbers:                           │
│     total += number                              │
│                                                  │
├──────────────────────────────────────────────────┤
│ WALKTHROUGH                                      │
│                                                  │
│ STEP 1                                           │
│ Initialize total = 0                             │
│                                                  │
│ STEP 2                                           │
│ Process number = 1                               │
│ total becomes 1                                  │
│                                                  │
│ STEP 3                                           │
│ Process number = 2                               │
│ total becomes 3                                  │
│                                                  │
│ STEP 4                                           │
│ Process number = 3                               │
│ total becomes 6                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│ RESULT                                           │
│ 6                                                │
└──────────────────────────────────────────────────┘
```

---

# 6. C5 Example — Python Loop

Code:

```python
numbers = [1, 2, 3]

total = 0

for number in numbers:
    total += number

print(total)
```

### Walkthrough

| Step | Operation      | State        |
| ---- | -------------- | ------------ |
| 1    | `total = 0`    | `total = 0`  |
| 2    | `number = 1`   | `total = 1`  |
| 3    | `number = 2`   | `total = 3`  |
| 4    | `number = 3`   | `total = 6`  |
| 5    | `print(total)` | Output = `6` |

This is the ideal C5 pattern.

---

# 7. C5 Execution Timeline

A visual timeline can be used:

```text
START
  │
  ▼
total = 0
  │
  ▼
number = 1
total = 1
  │
  ▼
number = 2
total = 3
  │
  ▼
number = 3
total = 6
  │
  ▼
PRINT
  │
  ▼
6
```

This is particularly useful for loops and algorithms.

---

# 8. C5 Example — Conditional Logic

```python
score = 75

if score >= 50:
    result = "Pass"
else:
    result = "Fail"

print(result)
```

Walkthrough:

| Step | State                     |
| ---- | ------------------------- |
| 1    | `score = 75`              |
| 2    | Evaluate `75 >= 50`       |
| 3    | Condition is `True`       |
| 4    | Execute `result = "Pass"` |
| 5    | Print `Pass`              |

Final:

```text
Pass
```

C5 makes the decision path visible.

---

# 9. C5 Example — Function Call

```python
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

Walkthrough:

```text
1. Define add()
       ↓
2. Call add(10, 20)
       ↓
3. a = 10
   b = 20
       ↓
4. Calculate 10 + 20
       ↓
5. return 30
       ↓
6. result = 30
       ↓
7. print(result)
       ↓
8. 30
```

This is more informative than simply showing the final output.

---

# 10. C5 Example — Nested Loop

```python
for row in range(2):
    for column in range(2):
        print(row, column)
```

Walkthrough:

| Step | `row` | `column` | Output |
| ---- | ----: | -------: | ------ |
| 1    |     0 |        0 | `0 0`  |
| 2    |     0 |        1 | `0 1`  |
| 3    |     1 |        0 | `1 0`  |
| 4    |     1 |        1 | `1 1`  |

This is exactly the kind of concept where C5 is much stronger than C4.

---

# 11. C5 Example — List Transformation

```python
numbers = [1, 2, 3]

squares = []

for number in numbers:
    squares.append(number * number)

print(squares)
```

Walkthrough:

```text
numbers = [1, 2, 3]
       ↓
squares = []
       ↓
number = 1
       ↓
1 × 1 = 1
       ↓
squares = [1]
       ↓
number = 2
       ↓
2 × 2 = 4
       ↓
squares = [1, 4]
       ↓
number = 3
       ↓
3 × 3 = 9
       ↓
squares = [1, 4, 9]
```

Final output:

```text
[1, 4, 9]
```

---

# 12. C5 Example — NumPy

```python
import numpy as np

numbers = np.array([1, 2, 3])

result = numbers * 2

print(result)
```

Walkthrough:

| Step | Operation     | State          |
| ---- | ------------- | -------------- |
| 1    | Import NumPy  | `np` available |
| 2    | Create array  | `[1 2 3]`      |
| 3    | Multiply by 2 | `[2 4 6]`      |
| 4    | Print         | `[2 4 6]`      |

C5 can therefore explain data transformations.

---

# 13. C5 Example — Pandas

```python
import pandas as pd

df = pd.DataFrame({
    "score": [80, 90, 100]
})

average = df["score"].mean()

print(average)
```

Walkthrough:

```text
Create DataFrame
       ↓
score = [80, 90, 100]
       ↓
Select score column
       ↓
Calculate mean
       ↓
80 + 90 + 100
       ↓
270 / 3
       ↓
90
```

---

# 14. C5 Example — SQL Processing

```sql
SELECT name
FROM students
WHERE score > 80;
```

A conceptual walkthrough:

```text
1. Identify table
       ↓
students

2. Read rows
       ↓
student records

3. Evaluate WHERE condition
       ↓
score > 80

4. Keep matching rows
       ↓
filtered records

5. Return name column
       ↓
result set
```

This is not claiming a particular database engine's internal execution plan; it is the **educational logical walkthrough** of the query.

---

# 15. C5 Example — Data Engineering

A pipeline:

```text
Raw Data
   ↓
Validate
   ↓
Clean
   ↓
Transform
   ↓
Load
```

Walkthrough:

| Step | Stage     | Result                     |
| ---- | --------- | -------------------------- |
| 1    | Read      | Raw records available      |
| 2    | Validate  | Invalid records identified |
| 3    | Clean     | Valid standardized data    |
| 4    | Transform | Analytics-ready data       |
| 5    | Load      | Data stored in destination |

This allows C5 to represent non-code workflows while preserving the CodeBlock's procedural nature.

---

# 16. C5 Example — Machine Learning

```python
model.fit(X_train, y_train)

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)
```

Walkthrough:

```text
Training data
     ↓
model.fit()
     ↓
Trained model
     ↓
X_test
     ↓
model.predict()
     ↓
Predictions
     ↓
Compare with y_test
     ↓
Accuracy
```

This is useful for teaching ML pipelines.

---

# 17. C5 Example — Authentication Flow

A conceptual authentication flow:

```text
Login Request
      ↓
Extract Credentials
      ↓
Validate Credentials
      ↓
Verify Identity
      ↓
Create Authenticated Session
      ↓
Return Authentication Result
```

C5 is appropriate because the learner needs to understand **sequence and state transition**.

---

# 18. C5 Example — Quantum Computing

Conceptual:

```text
Initialize |0⟩
     ↓
Apply H
     ↓
State becomes superposition
     ↓
Measure
     ↓
Classical result
```

Walkthrough:

```text
Step 1
Initial state = |0⟩

Step 2
Apply Hadamard operation

Step 3
State is represented as a superposition

Step 4
Measurement produces a classical outcome
```

This is much more useful for quantum concepts than a static definition alone.

---

# 19. C5 Step Types

A step can represent different things:

| Step Type              | Example            |
| ---------------------- | ------------------ |
| Statement              | `x = 10`           |
| Function call          | `calculate()`      |
| Condition              | `x > 10`           |
| Loop iteration         | `number = 3`       |
| State change           | `total = 6`        |
| Transformation         | Raw → Clean        |
| Query stage            | Filter rows        |
| API stage              | Request → Response |
| Algorithm phase        | Partition array    |
| Mathematical operation | `10 × 2`           |

---

# 20. C5 State Representation

One of C5's strongest features should be the ability to show state.

For example:

```text
BEFORE

total = 0


STEP

number = 3


AFTER

total = 3
```

The generic model becomes:

```text
Previous State
      ↓
Operation
      ↓
New State
```

This is especially useful for:

* loops
* mutation
* algorithms
* data structures
* recursion
* state machines

---

# 21. C5 Step Card

A step should be compact.

```text
┌──────────────────────────────────────┐
│ STEP 02                               │
│                                      │
│ Process number = 2                   │
│                                      │
│ total = 1 + 2                        │
│                                      │
│ New state                             │
│ total = 3                            │
└──────────────────────────────────────┘
```

Do not make every step an enormous independent card.

The learner needs to perceive the **sequence as one continuous process**.

---

# 22. C5 Step Numbering

Use:

```text
01
02
03
04
```

or:

```text
①
②
③
④
```

For the professional SUIA style, numeric labels such as:

```text
STEP 01
STEP 02
STEP 03
```

are preferable.

---

# 23. C5 70/30 SUIA Color Rule

SUIA brand colors remain:

| Role               | Hex         |
| ------------------ | ----------- |
| **Primary Pink**   | **#F54A8D** |
| **Secondary Navy** | **#0B1B3D** |

Use approximately:

```text
70%
White / light surfaces / navy

30%
Pink
```

Pink should identify:

* step number
* active/current step
* execution direction
* important state transition
* final result emphasis

Navy should carry:

* code
* title
* descriptions
* state values
* technical information

---

# 24. C5 Tag-by-Tag Color Table

| HTML Tag    | Example            | Color       |
| ----------- | ------------------ | ----------- |
| `<span>`    | `CODE`             | **#F54A8D** |
| `<h2>`      | `Loop Walkthrough` | **#0B1B3D** |
| `<h3>`      | `Walkthrough`      | **#F54A8D** |
| `<pre>`     | Source code        | Neutral     |
| `<code>`    | Python code        | **#0B1B3D** |
| `<ol>`      | Steps              | Neutral     |
| `<li>`      | Step               | **#0B1B3D** |
| Step number | `STEP 01`          | **#F54A8D** |
| State label | `NEW STATE`        | **#F54A8D** |
| State value | `total = 3`        | **#0B1B3D** |
| `<p>`       | Explanation        | **#0B1B3D** |
| `<strong>`  | Important value    | **#0B1B3D** |

---

# 25. C5 Semantic HTML Architecture

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>
│    └── <pre>
│         └── <code>
│
└── <section>
     ├── <h3>
     └── <ol>
          └── <li>
               ├── <span>
               ├── <h4>
               ├── <p>
               └── <div>
                    └── State
```

---

# 26. Complete C5 HTML Tag Inventory

| Tag         | Purpose                | Color Role    |
| ----------- | ---------------------- | ------------- |
| `<section>` | Root/sections          | Neutral       |
| `<header>`  | Block header           | Neutral       |
| `<span>`    | Labels / step markers  | **Primary**   |
| `<h2>`      | Main title             | **Secondary** |
| `<h3>`      | Major section          | **Primary**   |
| `<h4>`      | Step title             | **Secondary** |
| `<pre>`     | Code                   | Neutral       |
| `<code>`    | Code/state values      | **Secondary** |
| `<ol>`      | Ordered execution      | Neutral       |
| `<li>`      | Step                   | **Secondary** |
| `<p>`       | Explanation            | **Secondary** |
| `<strong>`  | Important value        | **Secondary** |
| `<div>`     | Layout/state container | Neutral       |

---

# 27. C5 Complete HTML

```html
<section
    class="tutorial-block code-block code-c5"
    data-block="code"
    data-version="C5"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Loop Execution Walkthrough
        </h2>

    </header>


    <section class="code-section">

        <h3>
            Code
        </h3>

        <pre><code>numbers = [1, 2, 3]

total = 0

for number in numbers:
    total += number

print(total)</code></pre>

    </section>


    <section class="walkthrough">

        <h3>
            Execution Walkthrough
        </h3>

        <ol>

            <li>

                <span class="step-number">
                    STEP 01
                </span>

                <h4>
                    Initialize the total
                </h4>

                <p>
                    The program sets
                    <code>total</code>
                    to <strong>0</strong>.
                </p>

                <div class="state">
                    <span>NEW STATE</span>
                    <code>total = 0</code>
                </div>

            </li>


            <li>

                <span class="step-number">
                    STEP 02
                </span>

                <h4>
                    Process the first number
                </h4>

                <p>
                    The loop receives
                    <code>number = 1</code>
                    and adds it to the total.
                </p>

                <div class="state">
                    <span>NEW STATE</span>
                    <code>total = 1</code>
                </div>

            </li>


            <li>

                <span class="step-number">
                    STEP 03
                </span>

                <h4>
                    Process the second number
                </h4>

                <p>
                    The loop receives
                    <code>number = 2</code>.
                </p>

                <div class="state">
                    <span>NEW STATE</span>
                    <code>total = 3</code>
                </div>

            </li>


            <li>

                <span class="step-number">
                    STEP 04
                </span>

                <h4>
                    Process the third number
                </h4>

                <p>
                    The loop receives
                    <code>number = 3</code>.
                </p>

                <div class="state">
                    <span>NEW STATE</span>
                    <code>total = 6</code>
                </div>

            </li>

        </ol>

    </section>


    <section class="result">

        <h3>
            Result
        </h3>

        <pre><code>6</code></pre>

    </section>

</section>
```

---

# 28. C5 JSON

```json
{
  "type": "code",
  "version": "C5",

  "content": {

    "title": "Loop Execution Walkthrough",

    "language": "python",

    "code": "numbers = [1, 2, 3]\n\ntotal = 0\n\nfor number in numbers:\n    total += number\n\nprint(total)",

    "steps": [

      {
        "step": 1,
        "title": "Initialize the total",
        "operation": "total = 0",
        "explanation": "The program initializes the running total.",
        "state": {
          "label": "NEW STATE",
          "value": "total = 0"
        }
      },

      {
        "step": 2,
        "title": "Process the first number",
        "operation": "number = 1",
        "explanation": "The first number is added to the running total.",
        "state": {
          "label": "NEW STATE",
          "value": "total = 1"
        }
      },

      {
        "step": 3,
        "title": "Process the second number",
        "operation": "number = 2",
        "explanation": "The second number is added to the running total.",
        "state": {
          "label": "NEW STATE",
          "value": "total = 3"
        }
      },

      {
        "step": 4,
        "title": "Process the third number",
        "operation": "number = 3",
        "explanation": "The third number is added to the running total.",
        "state": {
          "label": "NEW STATE",
          "value": "total = 6"
        }
      }

    ],

    "result": {
      "type": "text",
      "value": "6"
    }

  }
}
```

---

# 29. Why C5 JSON Is Different From C3

### C3

```text
annotations[]
   ↓
line
code
explanation
```

### C5

```text
steps[]
   ↓
step
title
operation
explanation
state
```

This distinction is fundamental.

C3 describes **code**.

C5 describes **execution**.

---

# 30. C5 A4 Portrait Layout

The A4 page should look approximately like:

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Loop Execution Walkthrough                            │
│                                                        │
│ CODE                                                   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = [1, 2, 3]                              │   │
│ │                                                  │   │
│ │ total = 0                                       │   │
│ │                                                  │   │
│ │ for number in numbers:                          │   │
│ │     total += number                             │   │
│ │                                                  │   │
│ │ print(total)                                    │   │
│ └──────────────────────────────────────────────────┘   │
│                         ↓                              │
│ EXECUTION WALKTHROUGH                                  │
│                                                        │
│ STEP 01                                                │
│ Initialize total                                       │
│ NEW STATE → total = 0                                  │
│                                                        │
│ STEP 02                                                │
│ Process number = 1                                     │
│ NEW STATE → total = 1                                  │
│                                                        │
│ STEP 03                                                │
│ Process number = 2                                     │
│ NEW STATE → total = 3                                  │
│                                                        │
│ STEP 04                                                │
│ Process number = 3                                     │
│ NEW STATE → total = 6                                  │
│                                                        │
│ RESULT                                                 │
│ 6                                                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The page must not become a collection of huge cards.

The walkthrough should feel like **one continuous execution story**.

---

# 31. C5 Desktop Layout

On desktop, steps can use a two-column structure:

```text
┌──────────────────────────────────────────────────────────┐
│ STEP 01             │ Initialize total                  │
│                     │ total = 0                         │
├─────────────────────┼──────────────────────────────────┤
│ STEP 02             │ Process number = 1               │
│                     │ total = 1                         │
├─────────────────────┼──────────────────────────────────┤
│ STEP 03             │ Process number = 2               │
│                     │ total = 3                         │
├─────────────────────┼──────────────────────────────────┤
│ STEP 04             │ Process number = 3               │
│                     │ total = 6                         │
└─────────────────────┴──────────────────────────────────┘
```

This allows the execution sequence to remain compact.

---

# 32. C5 Mobile Layout

On mobile:

```text
┌─────────────────────────────┐
│ STEP 01                    │
│                             │
│ Initialize total            │
│                             │
│ total = 0                   │
│                             │
│ STEP 02                    │
│                             │
│ Process number = 1          │
│                             │
│ total = 1                   │
│                             │
│ STEP 03                    │
│                             │
│ Process number = 2          │
│                             │
│ total = 3                   │
└─────────────────────────────┘
```

The execution sequence remains vertical.

---

# 33. C5 State Transition Visualization

For algorithm-heavy topics, a state-transition representation is useful:

```text
STATE 0
total = 0
   │
   │ number = 1
   ▼
STATE 1
total = 1
   │
   │ number = 2
   ▼
STATE 2
total = 3
   │
   │ number = 3
   ▼
STATE 3
total = 6
```

This should be an optional renderer variation rather than a separate block version.

---

# 34. C5 Execution Highlight

The current step can be highlighted using pink:

```text
STEP 03
```

while the other steps remain neutral.

This gives the learner a strong visual cue:

```text
        ┌─────────────────────┐
        │ STEP 03             │  ← #F54A8D
        │                     │
        │ total = 3           │  ← #0B1B3D
        └─────────────────────┘
```

The highlighting should be used sparingly.

---

# 35. C5 Animation — Optional Future Enhancement

C5 can support a presentation mode where:

```text
STEP 01
   ↓
STEP 02
   ↓
STEP 03
   ↓
STEP 04
```

is revealed progressively.

However:

> **Animation should never be required to understand the content.**

The static A4 version must contain the complete walkthrough.

---

# 36. C5 Accessibility

Every step should be understandable without animation or color.

For example:

```html
<li>
    <h4>Step 2 — Process the first number</h4>
    <p>The loop receives number = 1...</p>
</li>
```

This means the sequence is inherently accessible.

---

# 37. C5 Responsive Code

The source code remains horizontally scrollable when necessary.

The walkthrough itself should **not** require horizontal scrolling.

Desktop:

```text
Step | Explanation | State
```

Mobile:

```text
Step
Explanation
State
```

---

# 38. C5 Recommended Information Density

| Component            | Recommendation |
| -------------------- | -------------: |
| Code                 |     5–30 lines |
| Steps                |       **3–10** |
| Explanation per step |  1–3 sentences |
| State                |       Optional |
| Result               |    Recommended |
| Multiple examples    |              ❌ |
| Interactive editor   |              ❌ |

If there are 20+ meaningful execution stages, the content may need to be divided into multiple learning sections.

---

# 39. C5 Best Use Cases

| Topic                      | Suitability |
| -------------------------- | ----------: |
| `for` loops                |       ⭐⭐⭐⭐⭐ |
| `while` loops              |       ⭐⭐⭐⭐⭐ |
| Conditionals               |       ⭐⭐⭐⭐⭐ |
| Recursion                  |       ⭐⭐⭐⭐⭐ |
| Functions                  |       ⭐⭐⭐⭐⭐ |
| Algorithms                 |       ⭐⭐⭐⭐⭐ |
| Sorting                    |       ⭐⭐⭐⭐⭐ |
| Searching                  |       ⭐⭐⭐⭐⭐ |
| Data transformations       |       ⭐⭐⭐⭐⭐ |
| NumPy operations           |        ⭐⭐⭐⭐ |
| Pandas pipelines           |       ⭐⭐⭐⭐⭐ |
| SQL logical processing     |        ⭐⭐⭐⭐ |
| ML pipeline                |       ⭐⭐⭐⭐⭐ |
| Authentication flow        |       ⭐⭐⭐⭐⭐ |
| Quantum algorithms         |       ⭐⭐⭐⭐⭐ |
| Simple variable assignment |          ⭐⭐ |

C5 should be used when **sequence matters**.

---

# 40. C5 What We Should Avoid

### ❌ Just code + output

That is C4.

### ❌ Token-by-token syntax explanation

That is C2.

### ❌ Simple line annotation without state progression

That is C3.

### ❌ Before/after comparison

That is C6.

### ❌ Incorrect implementation

That is C7.

### ❌ Multiple alternative examples

That is C8.

### ❌ Huge explanation with all supporting information

That approaches C9.

### ❌ Interactive execution

That is C10.

---

# 41. C5 Component Architecture

```text
CodeBlock
│
└── C5 Renderer
      │
      ├── Header
      │
      ├── CodeSection
      │    └── CodeRenderer
      │
      ├── WalkthroughSection
      │    │
      │    └── Step[]
      │         ├── StepNumber
      │         ├── StepTitle
      │         ├── Operation
      │         ├── Explanation
      │         └── State
      │
      └── ResultSection
```

---

# 42. C5 Validation Rules

| Field                 |    Required |
| --------------------- | ----------: |
| `type`                |           ✅ |
| `version`             |           ✅ |
| `title`               |           ✅ |
| `code`                |           ✅ |
| `language`            | Recommended |
| `steps`               |           ✅ |
| `step.number`         |           ✅ |
| `step.title`          | Recommended |
| `step.explanation`    |           ✅ |
| `step.operation`      | Recommended |
| `step.state`          |    Optional |
| `result`              | Recommended |
| Syntax breakdown      |           ❌ |
| Line annotation model |           ❌ |
| Before/After          |           ❌ |
| Multiple examples     |           ❌ |
| Interactive editor    |           ❌ |

---

# 43. C5 Final Technical Specification

| Area                    | C5 Decision                                          |
| ----------------------- | ---------------------------------------------------- |
| Version                 | **C5**                                               |
| Name                    | **Code Walkthrough**                                 |
| Main question           | **How does the code execute from beginning to end?** |
| Structure               | **Code → Step 1 → Step 2 → Step 3 → Result**         |
| Best for                | Complex code                                         |
| Primary                 | **#F54A8D**                                          |
| Secondary               | **#0B1B3D**                                          |
| Theme                   | Light                                                |
| Gradient                | ❌                                                    |
| Dark theme              | ❌                                                    |
| A4                      | **Portrait**                                         |
| Root                    | `<section>`                                          |
| Title                   | `<h2>`                                               |
| Section labels          | `<h3>`                                               |
| Step title              | `<h4>`                                               |
| Code                    | `<pre><code>`                                        |
| Steps                   | `<ol><li>`                                           |
| State                   | `<code>` / `<div>`                                   |
| Result                  | `<pre><code>`                                        |
| Animation               | Optional                                             |
| Syntax glossary         | ❌                                                    |
| Simple line annotations | ❌                                                    |
| Before/After            | ❌                                                    |
| Debugging               | ❌                                                    |
| Multiple examples       | ❌                                                    |
| Interactive editor      | ❌                                                    |
| JSON-driven             | ✅                                                    |
| Responsive              | ✅                                                    |
| Accessible              | ✅                                                    |
| Recommended steps       | **3–10**                                             |
| Learning level          | **Intermediate → Advanced**                          |

---

# 44. C5 Final Mental Model

```text
                         C5
                          │
                          ▼
                        CODE
                          │
                          ▼
                      STEP 01
                          │
                    STATE CHANGE
                          │
                          ▼
                      STEP 02
                          │
                    STATE CHANGE
                          │
                          ▼
                      STEP 03
                          │
                    STATE CHANGE
                          │
                          ▼
                       RESULT
```

The defining principle is:

> **C5 transforms code execution into a sequence of understandable states and operations, allowing the learner to follow the complete journey from the initial code to the final result.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| C1      | Basic Code Example          | ✅                   |
| C2      | Syntax + Explanation        | ✅                   |
| C3      | Annotated Code              | ✅                   |
| C4      | Code + Output               | ✅                   |
| **C5**  | **Code Walkthrough**        | ✅ **Completed now** |
| C6      | Before / After Code         | ⏳ Next              |
| C7      | Common Mistake              | ⏳                   |
| C8      | Multiple Examples           | ⏳                   |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C5 is complete. The next version is C6 — Before / After Code.**



```python

```

# BLOCK 4 — CodeBlock

# C6 — Before / After Code

C6 is the sixth version of the **CodeBlock**.

The CodeBlock progression is now:

| Version | Name                        | Main Learning Question                                       |
| ------- | --------------------------- | ------------------------------------------------------------ |
| C1      | Basic Code Example          | What does this code produce?                                 |
| C2      | Syntax + Explanation        | What does this syntax mean?                                  |
| C3      | Annotated Code              | What does each important line do?                            |
| C4      | Code + Output               | What happens when the code executes?                         |
| C5      | Code Walkthrough            | How does execution progress step by step?                    |
| **C6**  | **Before / After Code**     | **What changed, why did it change, and what is the result?** |
| C7      | Common Mistake              | What is wrong and how do I correct it?                       |
| C8      | Multiple Examples           | What different patterns can I use?                           |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect?                    |
| C10     | Interactive / Playground    | Can I experiment with the code?                              |

The defining structure of C6 is:

```text
BEFORE
   ↓
MODIFICATION
   ↓
AFTER
```

The key educational idea is:

> **Show the original state, show the change, and show the resulting code/state.**

---

# 1. Purpose of C6

C6 is designed when the learner already understands the basic code but needs to understand:

* what was changed
* why it was changed
* what effect the change creates

It is particularly useful for:

* refactoring
* mutation
* optimization
* improving code quality
* fixing structure
* changing API usage
* changing data transformations
* migrating old syntax to new syntax
* improving inefficient code
* modifying configuration

---

# 2. C6 Core Principle

C6 answers three questions:

```text
What did we have?
       ↓
What changed?
       ↓
What do we have now?
```

Therefore:

```text
BEFORE
  ↓
CHANGE
  ↓
AFTER
```

The **change** is the important bridge.

---

# 3. C6 Canonical Structure

```text
┌──────────────────────────────────────────────────┐
│ BEFORE                                           │
│                                                  │
│ numbers = [1, 2, 3]                              │
│ numbers.append(4)                                │
│                                                  │
├──────────────────────────────────────────────────┤
│ CHANGE                                           │
│                                                  │
│ Replace append() with a new-list approach.      │
│                                                  │
├──────────────────────────────────────────────────┤
│ AFTER                                            │
│                                                  │
│ numbers = [1, 2, 3, 4]                           │
└──────────────────────────────────────────────────┘
```

For actual code transformation, the more useful structure is:

```text
BEFORE CODE
     ↓
MODIFICATION
     ↓
AFTER CODE
     ↓
RESULT / TAKEAWAY
```

The final result/takeaway is optional because the canonical C6 model is **Before → After**.

---

# 4. C6 vs C5

### C5

```text
Code
 ↓
Step 1
 ↓
Step 2
 ↓
Step 3
 ↓
Result
```

C5 explains **execution**.

### C6

```text
Before
 ↓
Change
 ↓
After
```

C6 explains **transformation**.

Therefore:

> **C5 = How does it execute?**

> **C6 = How did it change?**

---

# 5. C6 vs C7

This distinction is also important.

### C6

```text
Before
 ↓
Modification
 ↓
After
```

The original code can already be valid.

Example:

```python
numbers.append(40)
```

becomes:

```python
numbers = [*numbers, 40]
```

This is a transformation/refactoring example.

### C7

```text
Incorrect
 ↓
Problem
 ↓
Correct
```

C7 specifically deals with mistakes.

---

# 6. C6 Example — Python Mutation

### Before

```python
numbers = [10, 20, 30]

numbers.append(40)
```

### After

```python
numbers = [10, 20, 30, 40]
```

Change:

```text
Mutation through append()
        ↓
Direct resulting list
```

The example should explain **what changed**, rather than claiming that one approach is universally better.

---

# 7. C6 Example — Python Loop → Comprehension

### Before

```python
squares = []

for number in numbers:
    squares.append(number * number)
```

### After

```python
squares = [
    number * number
    for number in numbers
]
```

Change:

> The explicit loop is replaced with a list-comprehension expression.

This is a classic C6 use case.

---

# 8. C6 Example — Python Repeated Code

### Before

```python
print("Alice")
print("Bob")
print("Charlie")
```

### After

```python
names = ["Alice", "Bob", "Charlie"]

for name in names:
    print(name)
```

Change:

```text
Repeated statements
        ↓
Data collection + loop
```

The learner sees the structural improvement.

---

# 9. C6 Example — Function Refactoring

### Before

```python
def calculate_total(price, tax):
    total = price + tax
    return total
```

### After

```python
def calculate_total(price, tax):
    return price + tax
```

Change:

> The temporary variable is removed because its value is returned immediately.

This is a small, focused refactoring.

---

# 10. C6 Example — JavaScript

### Before

```javascript
function add(a, b) {
    return a + b;
}
```

### After

```javascript
const add = (a, b) => a + b;
```

Change:

```text
Traditional function
       ↓
Arrow function
```

C6 can therefore teach syntax modernization.

---

# 11. C6 Example — TypeScript

### Before

```typescript
function getName(user: User): string {
    return user.name;
}
```

### After

```typescript
const getName = (user: User): string => user.name;
```

Change:

> The function declaration is transformed into an arrow-function expression.

---

# 12. C6 Example — SQL

### Before

```sql
SELECT *
FROM students;
```

### After

```sql
SELECT name, score
FROM students;
```

Change:

```text
All columns
   ↓
Only required columns
```

This can demonstrate more focused querying.

The explanation should avoid claiming performance benefits unless the specific database/context supports that claim.

---

# 13. C6 Example — Pandas

### Before

```python
df["score"].apply(lambda x: x * 2)
```

### After

```python
df["score"] * 2
```

Change:

```text
Explicit element-wise function
        ↓
Vectorized Series operation
```

The example teaches a transformation in coding style.

---

# 14. C6 Example — NumPy

### Before

```python
result = []

for number in numbers:
    result.append(number * 2)
```

### After

```python
result = numbers * 2
```

Change:

```text
Explicit Python iteration
        ↓
NumPy array operation
```

This is a strong educational C6 example because the transformation itself is the learning point.

---

# 15. C6 Example — Data Engineering

### Before

```text
Raw CSV
   ↓
Manual cleaning
   ↓
Database
```

### After

```text
Raw CSV
   ↓
Validation
   ↓
Transformation
   ↓
Load
   ↓
Database
```

Change:

> An explicit validation/transformation stage has been introduced into the data pipeline.

This allows C6 to represent architecture and pipeline evolution, not just source code.

---

# 16. C6 Example — Full-Stack Development

### Before

```text
Component
   ↓
Direct API call
```

### After

```text
Component
   ↓
API Client
   ↓
Backend API
```

Change:

> API communication is separated into a dedicated client layer.

C6 can therefore show architectural refactoring.

---

# 17. C6 Example — Authentication Architecture

### Before

```text
Browser
   ↓
Application
   ↓
Database
```

### After

```text
Browser
   ↓
Authentication Layer
   ↓
Application
   ↓
Database
```

Change:

> Authentication responsibilities are separated from the application layer.

Again, C6 is showing a structural transformation.

---

# 18. C6 Example — Quantum Computing

Conceptual transformation:

### Before

```text
|0⟩
```

### After

```text
α|0⟩ + β|1⟩
```

Change:

```text
Basis state
   ↓
Superposition
```

This is useful when teaching conceptual state transformations.

---

# 19. C6 Before/After Visual

The preferred desktop representation is:

```text
┌───────────────────────────────┐
│ BEFORE                        │
│                               │
│ old code                      │
│                               │
└───────────────┬───────────────┘
                │
             CHANGE
                │
                ▼
┌───────────────────────────────┐
│ AFTER                         │
│                               │
│ new code                      │
│                               │
└───────────────────────────────┘
```

For wider screens, this can become:

```text
┌─────────────────────┐     ┌─────────────────────┐
│ BEFORE              │     │ AFTER               │
│                     │     │                     │
│ old code            │ ──► │ new code            │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

---

# 20. C6 A4 Portrait Layout

For our A4 portrait Tutorial Engine:

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Refactoring a List Transformation                     │
│                                                        │
│ BEFORE                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ squares = []                                     │   │
│ │                                                  │   │
│ │ for number in numbers:                           │   │
│ │     squares.append(number * number)              │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│                         ↓                              │
│                                                        │
│ CHANGE                                                 │
│ Replace the explicit loop with a list comprehension.  │
│                                                        │
│                         ↓                              │
│                                                        │
│ AFTER                                                  │
│ ┌──────────────────────────────────────────────────┐   │
│ │ squares = [number * number                       │   │
│ │            for number in numbers]                │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The two code sections should have **equal visual importance**.

---

# 21. C6 Desktop Layout

```text
┌──────────────────────────────────────────────────────────┐
│ CODE                                                     │
│ Refactoring a List Transformation                       │
│                                                          │
│ ┌──────────────────────────┐   ┌──────────────────────┐ │
│ │ BEFORE                   │   │ AFTER                │ │
│ │                          │   │                      │ │
│ │ squares = []             │   │ squares = [           │ │
│ │                          │   │   number * number    │ │
│ │ for number in numbers:   │ → │   for number in      │ │
│ │   squares.append(...)    │   │   numbers            │ │
│ └──────────────────────────┘   └──────────────────────┘ │
│                                                          │
│ CHANGE                                                   │
│ Explicit loop → list comprehension                      │
└──────────────────────────────────────────────────────────┘
```

---

# 22. C6 Mobile Layout

On mobile, the side-by-side layout becomes vertical:

```text
┌─────────────────────────────┐
│ CODE                        │
│                             │
│ BEFORE                      │
│ ┌─────────────────────────┐ │
│ │ old code                │ │
│ └─────────────────────────┘ │
│             ↓               │
│ CHANGE                      │
│                             │
│ Explanation                 │
│             ↓               │
│ AFTER                       │
│ ┌─────────────────────────┐ │
│ │ new code                │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

# 23. C6 Change Explanation

The change section is essential.

It should answer:

> **What exactly changed?**

Optionally:

> **Why was it changed?**

For example:

```text
CHANGE

Before:
Explicit loop + append()

After:
List comprehension

Why:
The resulting code expresses the transformation
more directly.
```

The explanation should remain concise.

A detailed discussion belongs in a separate Explanation/Definition block.

---

# 24. C6 Change Types

C6 should support different transformation categories.

| Change Type          | Example                                |
| -------------------- | -------------------------------------- |
| Refactoring          | Simplify function                      |
| Syntax modernization | Function → arrow function              |
| Mutation             | Add/remove item                        |
| Optimization         | Replace repeated operation             |
| Structural           | Separate service layer                 |
| Data transformation  | Raw → normalized                       |
| API migration        | Old API → new API                      |
| Configuration        | Old config → new config                |
| Architecture         | Direct dependency → layered dependency |
| Algorithm            | Approach A → Approach B                |

---

# 25. C6 Code Difference Highlighting

A powerful UI feature is to highlight changes.

For example:

```text
BEFORE

numbers.append(40)
```

```text
AFTER

numbers = [*numbers, 40]
```

The renderer can internally identify:

```text
removed
added
unchanged
```

However, the actual learner-facing explanation should not rely only on color.

---

# 26. C6 Color Strategy

Use the SUIA brand colors:

| Role               | Hex         |
| ------------------ | ----------- |
| **Primary Pink**   | **#F54A8D** |
| **Secondary Navy** | **#0B1B3D** |

Pink should identify:

* BEFORE / AFTER labels
* change indicator
* arrow
* changed-code marker
* important transformation

Navy should identify:

* title
* source code
* explanation
* technical content

---

# 27. C6 70/30 Rule

The visual balance remains:

```text
≈ 70%
Navy + white/light neutrals

≈ 30%
Pink
```

Example:

```text
BEFORE                     AFTER
#F54A8D                    #F54A8D

old code                   new code
#0B1B3D                    #0B1B3D

          ────►
          #F54A8D
```

Pink is used for **transition**, not as a huge background.

---

# 28. C6 Tag-by-Tag Color Table

| HTML Tag   | Example               | Color       |
| ---------- | --------------------- | ----------- |
| `<span>`   | `CODE`                | **#F54A8D** |
| `<h2>`     | `Refactoring Example` | **#0B1B3D** |
| `<h3>`     | `Before`              | **#F54A8D** |
| `<h3>`     | `After`               | **#F54A8D** |
| `<pre>`    | Code surface          | `#F7F9FC`   |
| `<code>`   | Code                  | **#0B1B3D** |
| `<h3>`     | `Change`              | **#F54A8D** |
| `<p>`      | Change explanation    | **#0B1B3D** |
| Arrow      | `→`                   | **#F54A8D** |
| `<strong>` | Changed concept       | **#0B1B3D** |

---

# 29. C6 Semantic HTML Architecture

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>Before</h3>
│    └── <pre><code>
│
├── <section>
│    ├── <h3>Change</h3>
│    └── <p>
│
└── <section>
     ├── <h3>After</h3>
     └── <pre><code>
```

---

# 30. Complete C6 HTML Tag Inventory

| Tag         | Purpose                    | Color Role    |
| ----------- | -------------------------- | ------------- |
| `<section>` | Root/content sections      | Neutral       |
| `<header>`  | Block header               | Neutral       |
| `<span>`    | Eyebrow                    | **Primary**   |
| `<h2>`      | Main title                 | **Secondary** |
| `<h3>`      | Before/Change/After labels | **Primary**   |
| `<pre>`     | Code formatting            | Neutral       |
| `<code>`    | Source code                | **Secondary** |
| `<p>`       | Change explanation         | **Secondary** |
| `<strong>`  | Key transformation         | **Secondary** |
| `<div>`     | Layout                     | Neutral       |

---

# 31. C6 Complete HTML

```html
<section
    class="tutorial-block code-block code-c6"
    data-block="code"
    data-version="C6"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Refactoring a List Transformation
        </h2>

    </header>


    <section class="before-section">

        <h3>
            Before
        </h3>

        <pre><code>squares = []

for number in numbers:
    squares.append(number * number)</code></pre>

    </section>


    <section class="change-section">

        <h3>
            Change
        </h3>

        <p>
            Replace the explicit loop with a
            list-comprehension expression that
            represents the same transformation.
        </p>

    </section>


    <section class="after-section">

        <h3>
            After
        </h3>

        <pre><code>squares = [
    number * number
    for number in numbers
]</code></pre>

    </section>

</section>
```

---

# 32. C6 JSON

```json
{
  "type": "code",
  "version": "C6",

  "content": {

    "title": "Refactoring a List Transformation",

    "language": "python",

    "before": {
      "code": "squares = []\n\nfor number in numbers:\n    squares.append(number * number)"
    },

    "change": {
      "summary": "Replace the explicit loop with a list-comprehension expression.",
      "reason": "The transformation can be expressed more directly."
    },

    "after": {
      "code": "squares = [\n    number * number\n    for number in numbers\n]"
    }

  }
}
```

---

# 33. C6 JSON Architecture

The model is intentionally:

```text
before
   │
   ├── code
   │
change
   │
   ├── summary
   └── reason
   │
after
   │
   └── code
```

This is different from C5:

```text
steps[]
```

and C7:

```text
mistake
problem
correction
```

---

# 34. C6 Optional Diff Metadata

For advanced rendering, the JSON can optionally contain:

```json
{
  "diff": {
    "mode": "semantic"
  }
}
```

The renderer can then highlight changed portions.

But this should remain renderer metadata rather than becoming mandatory learner content.

---

# 35. C6 Example With Explicit Diff

Conceptually:

```text
BEFORE

squares = []

for number in numbers:
    squares.append(number * number)


AFTER

squares = [
    number * number
    for number in numbers
]
```

The visual engine can identify:

```text
removed:
for-loop construction

added:
list-comprehension construction
```

---

# 36. C6 A4 Information Density

| Component          |   Recommended |
| ------------------ | ------------: |
| Before code        |    3–20 lines |
| Change explanation | 1–3 sentences |
| After code         |    3–20 lines |
| Examples           |             1 |
| Diff               |      Optional |
| Output             |      Optional |
| Walkthrough        |             ❌ |
| Mistake            |             ❌ |
| Interactive editor |             ❌ |

C6 should remain focused on **one transformation**.

---

# 37. C6 Output

Output can be included when the transformation's effect is important:

```text
BEFORE
old code

        ↓

AFTER
new code

        ↓

RESULT
same output
```

But output is optional.

The core purpose remains:

```text
Before → Change → After
```

---

# 38. C6 Important Rule — Don't Claim “After” Is Always Better

This is important for educational accuracy.

The renderer/content model should distinguish:

```text
After
```

from:

```text
Better
```

The change may represent:

* different syntax
* different style
* migration
* alternative implementation
* optimization
* refactoring

without claiming universal superiority.

If the lesson explicitly establishes an improvement, the explanation can say so.

---

# 39. C6 Best Use Cases

| Topic                        | Suitability |
| ---------------------------- | ----------: |
| Refactoring                  |       ⭐⭐⭐⭐⭐ |
| Syntax migration             |       ⭐⭐⭐⭐⭐ |
| Python comprehensions        |       ⭐⭐⭐⭐⭐ |
| Function simplification      |       ⭐⭐⭐⭐⭐ |
| NumPy conversion             |       ⭐⭐⭐⭐⭐ |
| Pandas transformation        |       ⭐⭐⭐⭐⭐ |
| SQL improvement              |       ⭐⭐⭐⭐⭐ |
| API migration                |       ⭐⭐⭐⭐⭐ |
| Architecture                 |       ⭐⭐⭐⭐⭐ |
| Data pipeline changes        |       ⭐⭐⭐⭐⭐ |
| Algorithm alternatives       |        ⭐⭐⭐⭐ |
| Authentication architecture  |        ⭐⭐⭐⭐ |
| Quantum state transformation |        ⭐⭐⭐⭐ |

---

# 40. C6 What We Should Avoid

### ❌ Before = incorrect code

That is primarily C7.

### ❌ Detailed execution sequence

That is C5.

### ❌ Line-by-line annotation

That is C3.

### ❌ Multiple alternatives

That is C8.

### ❌ Long explanation

That approaches C9.

### ❌ Interactive editor

That is C10.

---

# 41. C6 Component Architecture

```text
CodeBlock
│
└── C6 Renderer
      │
      ├── Header
      │
      ├── BeforeSection
      │    └── CodeRenderer
      │
      ├── ChangeSection
      │    ├── ChangeSummary
      │    └── ChangeReason
      │
      └── AfterSection
           └── CodeRenderer
```

Optional:

```text
Before
   ↕
DiffEngine
   ↕
After
```

---

# 42. C6 Validation Rules

| Field              |    Required |
| ------------------ | ----------: |
| `type`             |           ✅ |
| `version`          |           ✅ |
| `title`            |           ✅ |
| `before.code`      |           ✅ |
| `change.summary`   |           ✅ |
| `after.code`       |           ✅ |
| `language`         | Recommended |
| `change.reason`    |    Optional |
| Diff metadata      |    Optional |
| Output             |    Optional |
| Syntax breakdown   |           ❌ |
| Line annotations   |           ❌ |
| Walkthrough        |           ❌ |
| Mistake            |           ❌ |
| Multiple examples  |           ❌ |
| Interactive editor |           ❌ |

---

# 43. C6 Final Technical Specification

| Area                       | C6 Decision                 |
| -------------------------- | --------------------------- |
| Version                    | **C6**                      |
| Name                       | **Before / After Code**     |
| Main question              | **What changed and why?**   |
| Structure                  | **Before → Change → After** |
| Best for                   | Refactoring / mutation      |
| Primary                    | **#F54A8D**                 |
| Secondary                  | **#0B1B3D**                 |
| Theme                      | Light                       |
| Gradient                   | ❌                           |
| Dark theme                 | ❌                           |
| A4                         | **Portrait**                |
| Root                       | `<section>`                 |
| Title                      | `<h2>`                      |
| Labels                     | `<h3>`                      |
| Code                       | `<pre><code>`               |
| Change                     | `<p>`                       |
| Diff                       | Optional                    |
| Output                     | Optional                    |
| Syntax breakdown           | ❌                           |
| Line annotation            | ❌                           |
| Execution walkthrough      | ❌                           |
| Common mistake             | ❌                           |
| Multiple examples          | ❌                           |
| Interactive editor         | ❌                           |
| JSON-driven                | ✅                           |
| Responsive                 | ✅                           |
| Accessible                 | ✅                           |
| Recommended transformation | **One focused change**      |
| Learning level             | **Intermediate → Advanced** |

---

# 44. C6 Final Mental Model

```text
                         C6
                          │
                          ▼
                       BEFORE
                          │
                          ▼
                        CHANGE
                          │
                  ┌───────┴───────┐
                  │               │
                WHAT            WHY
                  │               │
                  └───────┬───────┘
                          ▼
                        AFTER
                          │
                          ▼
                   NEW CODE / STATE
```

The defining principle is:

> **C6 teaches transformation by placing the original implementation and the resulting implementation around a clearly explained change, allowing learners to understand exactly what was modified and why.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| C1      | Basic Code Example          | ✅                   |
| C2      | Syntax + Explanation        | ✅                   |
| C3      | Annotated Code              | ✅                   |
| C4      | Code + Output               | ✅                   |
| C5      | Code Walkthrough            | ✅                   |
| **C6**  | **Before / After Code**     | ✅ **Completed now** |
| C7      | Common Mistake              | ⏳ Next              |
| C8      | Multiple Examples           | ⏳                   |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C6 is complete. The next version is C7 — Common Mistake.**



```python

```

# BLOCK 4 — CodeBlock

# C7 — Common Mistake

C7 is the seventh version of the **CodeBlock**.

The CodeBlock progression is now:

| Version | Name                        | Main Learning Question                                              |
| ------- | --------------------------- | ------------------------------------------------------------------- |
| C1      | Basic Code Example          | What does this code produce?                                        |
| C2      | Syntax + Explanation        | What does this syntax mean?                                         |
| C3      | Annotated Code              | What does each important line do?                                   |
| C4      | Code + Output               | What happens when the code executes?                                |
| C5      | Code Walkthrough            | How does execution progress step by step?                           |
| C6      | Before / After Code         | What changed and why?                                               |
| **C7**  | **Common Mistake**          | **What is wrong, why is it wrong, and how should it be corrected?** |
| C8      | Multiple Examples           | What different patterns can I use?                                  |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect?                           |
| C10     | Interactive / Playground    | Can I experiment with the code?                                     |

The canonical C7 structure is:

```text
INCORRECT CODE
      ↓
PROBLEM
      ↓
WHY IT HAPPENS
      ↓
CORRECTED CODE
```

The central principle is:

> **C7 teaches through a realistic mistake and its correction.**

---

# 1. Purpose of C7

C7 is not simply a "wrong code" block.

It teaches the learner to recognize:

1. **What went wrong**
2. **Where it went wrong**
3. **Why it went wrong**
4. **How to fix it**
5. **What principle should be remembered**

For example:

```python
numbers = [1, 2, 3]

print(numbers[3])
```

Problem:

```text
IndexError
```

Correction:

```python
print(numbers[2])
```

The learner sees the complete relationship:

```text
Mistake
   ↓
Error
   ↓
Reason
   ↓
Correction
```

---

# 2. C7 Core Principle

C7 answers:

> **“What mistake might a learner make here, and how should they recognize and correct it?”**

This makes C7 especially useful for:

* syntax mistakes
* logical mistakes
* type mistakes
* API misuse
* indexing mistakes
* SQL mistakes
* data-processing mistakes
* configuration mistakes
* authentication mistakes
* algorithmic mistakes

---

# 3. C7 Canonical Structure

```text
┌──────────────────────────────────────────────┐
│ COMMON MISTAKE                               │
│                                              │
│ ❌ INCORRECT CODE                            │
│                                              │
│ numbers = [1, 2, 3]                          │
│ print(numbers[3])                            │
│                                              │
│ ⚠ PROBLEM                                   │
│ IndexError                                   │
│                                              │
│ WHY?                                         │
│ Valid indexes are 0, 1, and 2.              │
│                                              │
│ ✅ CORRECTED CODE                            │
│                                              │
│ print(numbers[2])                            │
└──────────────────────────────────────────────┘
```

---

# 4. C7 vs C6

This distinction must remain strict.

### C6

```text
VALID BEFORE
     ↓
INTENTIONAL CHANGE
     ↓
VALID AFTER
```

C6 teaches transformation/refactoring.

### C7

```text
INCORRECT
     ↓
PROBLEM
     ↓
CORRECT
```

C7 teaches error recognition and correction.

Therefore:

> **C6 = Change**

> **C7 = Mistake**

---

# 5. C7 vs C3

### C3

```text
Code
 ↓
Explanation of each line
```

### C7

```text
Incorrect code
 ↓
Problem
 ↓
Why
 ↓
Corrected code
```

C7 should not annotate every line unless that is necessary to explain the mistake.

---

# 6. C7 vs C4

### C4

```text
Code
 ↓
Output
```

### C7

```text
Incorrect code
 ↓
Error/problem
 ↓
Correction
```

The result in C7 is often an error message rather than normal program output.

---

# 7. C7 Example — Python IndexError

### Incorrect

```python
numbers = [10, 20, 30]

print(numbers[3])
```

### Problem

```text
IndexError
```

### Why?

The list has three elements:

```text
Index → 0  1  2
Value → 10 20 30
```

Index `3` does not exist.

### Corrected

```python
print(numbers[2])
```

### Result

```text
30
```

This is an ideal C7 example.

---

# 8. C7 Example — Python Off-by-One Error

### Incorrect

```python
numbers = [1, 2, 3]

for i in range(1, len(numbers)):
    print(numbers[i])
```

This skips the first element.

### Problem

The range starts at `1`.

### Corrected

```python
for i in range(len(numbers)):
    print(numbers[i])
```

The important lesson is:

> Python indexes begin at `0`.

---

# 9. C7 Example — Missing Function Call

### Incorrect

```python
def greet():
    print("Hello")

greet
```

### Problem

The function is referenced but not called.

### Corrected

```python
greet()
```

### Key idea

```text
greet
 ↓
function object

greet()
 ↓
function execution
```

This is an excellent beginner C7 example.

---

# 10. C7 Example — TypeError

### Incorrect

```python
age = 20

print("Age: " + age)
```

### Problem

A string and integer cannot be concatenated this way.

### Corrected

```python
print("Age:", age)
```

or:

```python
print(f"Age: {age}")
```

C7 can show multiple corrections when they teach the same principle, but the standard version should generally emphasize one recommended correction.

---

# 11. C7 Example — Mutable Default Argument

### Incorrect

```python
def add_item(item, items=[]):
    items.append(item)
    return items
```

### Problem

The default list is reused across calls.

### Corrected

```python
def add_item(item, items=None):
    if items is None:
        items = []

    items.append(item)
    return items
```

### Principle

> Use `None` as the default sentinel when a fresh mutable object is required per call.

This is a strong intermediate/advanced C7 example.

---

# 12. C7 Example — NumPy Shape Mistake

### Incorrect

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5])

result = a + b
```

### Problem

The arrays have incompatible shapes for this element-wise operation.

```text
a → shape (3,)
b → shape (2,)
```

### Corrected

```python
b = np.array([4, 5, 6])

result = a + b
```

Now:

```text
(3,) + (3,)
```

is compatible.

---

# 13. C7 Example — Pandas Column Error

### Incorrect

```python
df["marks"]
```

when the DataFrame actually contains:

```text
score
```

### Problem

```text
KeyError: 'marks'
```

### Corrected

```python
df["score"]
```

### Lesson

> Column selection must use the actual column label.

---

# 14. C7 Example — Pandas Chained Assignment

A teaching example can show:

```python
df[df["score"] > 80]["grade"] = "A"
```

### Problem

This pattern can lead to ambiguous/chained-assignment behavior.

### Safer approach

```python
df.loc[df["score"] > 80, "grade"] = "A"
```

The lesson:

> Use `.loc` for explicit row/column assignment.

The exact warning/result can depend on Pandas version and configuration, so the tutorial should avoid presenting a version-sensitive behavior as universal.

---

# 15. C7 Example — SQL Mistake

### Incorrect

```sql
SELECT name
FROM students
WHERE score = NULL;
```

### Problem

SQL `NULL` requires `IS NULL` rather than `= NULL`.

### Corrected

```sql
SELECT name
FROM students
WHERE score IS NULL;
```

### Key lesson

```text
NULL
 ↓
IS NULL
```

This is a very good C7 SQL example.

---

# 16. C7 Example — SQL Missing Filter

### Risky/incorrect for the intended task

```sql
UPDATE students
SET score = 100;
```

If the intention was to update only one student, the filter is missing.

### Corrected

```sql
UPDATE students
SET score = 100
WHERE id = 101;
```

The C7 lesson is:

> Always verify the target rows before performing a modifying query.

For educational content, destructive database operations should be framed safely and carefully.

---

# 17. C7 Example — JavaScript Equality

### Incorrect

```javascript
if (age = 18) {
    console.log("Adult");
}
```

### Problem

`=` performs assignment.

### Corrected

```javascript
if (age === 18) {
    console.log("Adult");
}
```

The learner sees:

```text
=   → assignment
=== → strict equality comparison
```

---

# 18. C7 Example — TypeScript

### Incorrect

```typescript
function add(a: number, b: number): number {
    return a + b;
}

add("10", 20);
```

### Problem

The first argument violates the declared type.

### Corrected

```typescript
add(10, 20);
```

The lesson:

> TypeScript's static type checking can detect incompatible argument types before runtime.

---

# 19. C7 Example — Full-Stack API

### Incorrect

```text
Frontend
   ↓
POST /api/users
   ↓
No authentication check
   ↓
Create user
```

### Problem

The endpoint may perform a protected operation without the required authorization control.

### Corrected conceptual flow

```text
Frontend
   ↓
POST /api/users
   ↓
Authentication
   ↓
Authorization
   ↓
Validate request
   ↓
Create user
```

This teaches architectural responsibility rather than providing an exploit.

---

# 20. C7 Example — Data Engineering

### Mistake

```text
Raw Data
   ↓
Transform
   ↓
Warehouse
```

### Problem

No validation step exists before transformation/loading.

### Corrected

```text
Raw Data
   ↓
Validate
   ↓
Clean
   ↓
Transform
   ↓
Warehouse
```

The lesson:

> Data quality checks should occur at an appropriate point in the pipeline.

---

# 21. C7 Example — Machine Learning

### Incorrect conceptual workflow

```text
Dataset
   ↓
Split
   ↓
Normalize entire dataset
   ↓
Train
```

### Problem

Normalizing before separating the training and evaluation data can allow information from the evaluation set to influence preprocessing.

### Corrected conceptual flow

```text
Dataset
   ↓
Split
   ├───────────────┐
   ▼               ▼
Training        Evaluation
   │
Fit preprocessing
   │
Transform training
   │
Transform evaluation
   ↓
Train
```

The important C7 lesson is **avoiding data leakage**.

---

# 22. C7 Example — Quantum Computing

A conceptual mistake:

```text
Incorrect assumption:

Measurement
   ↓
State remains unchanged
```

Correct conceptual model:

```text
Quantum state
   ↓
Measurement
   ↓
Classical outcome
   ↓
Post-measurement state
```

The exact post-measurement state depends on the measurement and quantum system, so the tutorial should not oversimplify this into a universal rule.

---

# 23. C7 Mistake Categories

The JSON architecture should support explicit mistake types.

| Type           | Example                    |
| -------------- | -------------------------- |
| `syntax`       | Missing `:`                |
| `type`         | String + integer           |
| `logic`        | Wrong condition            |
| `index`        | Invalid list index         |
| `runtime`      | Division by zero           |
| `api_usage`    | Wrong parameter            |
| `data`         | Incorrect transformation   |
| `query`        | Wrong SQL condition        |
| `security`     | Missing authorization      |
| `performance`  | Inefficient operation      |
| `architecture` | Wrong layer responsibility |
| `conceptual`   | Incorrect mental model     |

---

# 24. C7 Error Message

If an actual error occurs, show it explicitly:

```text
ERROR

IndexError: list index out of range
```

The error should be visually distinct from normal output.

But:

> **Do not fabricate an error message that the shown code would not actually produce.**

---

# 25. C7 Error vs Problem

These are not always identical.

For example:

```python
numbers = [1, 2, 3]

for i in range(1, len(numbers)):
    print(numbers[i])
```

This may execute successfully but contain a logical mistake: the first element is skipped.

Therefore C7 should support:

```text
ERROR
```

and:

```text
LOGICAL PROBLEM
```

as separate concepts.

---

# 26. C7 Canonical Flow

```text
┌───────────────────────────────────────┐
│ ❌ COMMON MISTAKE                     │
│                                       │
│ Incorrect Code                        │
└──────────────────┬────────────────────┘
                   ↓
┌───────────────────────────────────────┐
│ ⚠ PROBLEM                             │
│                                       │
│ What goes wrong?                      │
└──────────────────┬────────────────────┘
                   ↓
┌───────────────────────────────────────┐
│ WHY?                                  │
│                                       │
│ Why does this happen?                 │
└──────────────────┬────────────────────┘
                   ↓
┌───────────────────────────────────────┐
│ ✅ CORRECTED                          │
│                                       │
│ Correct Code                          │
└───────────────────────────────────────┘
```

---

# 27. C7 A4 Portrait Layout

For the Tutorial Engine's A4 portrait design:

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Common List Index Mistake                              │
│                                                        │
│ ❌ COMMON MISTAKE                                      │
│                                                        │
│ INCORRECT CODE                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = [10, 20, 30]                           │   │
│ │ print(numbers[3])                                │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ⚠ PROBLEM                                             │
│ IndexError — index 3 does not exist.                  │
│                                                        │
│ WHY?                                                   │
│ The valid indexes are 0, 1, and 2.                   │
│                                                        │
│                         ↓                              │
│                                                        │
│ ✅ CORRECTED CODE                                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ print(numbers[2])                                │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ RESULT                                                 │
│ 30                                                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Again, the content should remain compact rather than becoming a collection of oversized cards.

---

# 28. C7 Desktop Layout

```text
┌──────────────────────────────────────────────────────────┐
│ CODE — Common List Index Mistake                         │
│                                                          │
│ ┌────────────────────────┐   ┌────────────────────────┐ │
│ │ ❌ INCORRECT           │   │ ⚠ PROBLEM              │ │
│ │                        │   │                        │ │
│ │ numbers = [10,20,30]   │   │ Index 3 does not       │ │
│ │ print(numbers[3])      │   │ exist.                 │ │
│ └────────────────────────┘   └────────────────────────┘ │
│                                                          │
│ WHY?                                                     │
│ Valid indexes are 0, 1, and 2.                          │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ✅ CORRECTED                                          │ │
│ │                                                      │ │
│ │ print(numbers[2])                                    │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

# 29. C7 Mobile Layout

```text
┌─────────────────────────────┐
│ CODE                        │
│ Common List Index Mistake   │
│                             │
│ ❌ INCORRECT                │
│ ┌─────────────────────────┐ │
│ │ print(numbers[3])       │ │
│ └─────────────────────────┘ │
│                             │
│ ⚠ PROBLEM                  │
│ Index 3 does not exist.     │
│                             │
│ WHY?                       │
│ Valid indexes are 0–2.     │
│                             │
│ ✅ CORRECTED               │
│ ┌─────────────────────────┐ │
│ │ print(numbers[2])       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

# 30. C7 SUIA Color Strategy

The established colors remain:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Important:

> Semantic error/success indicators may use restrained supporting colors, but they are **not additional SUIA brand colors**.

For example, an error icon may use a standard semantic red, while the overall component identity remains SUIA.

---

# 31. C7 70/30 Brand Rule

Approximately:

```text
70%
White / light neutral / navy content

30%
Pink brand emphasis
```

Pink can identify:

* `COMMON MISTAKE`
* step markers
* correction direction
* important keywords

Navy carries:

* title
* code
* explanation
* technical information

Do **not** make the entire error area bright pink.

---

# 32. C7 Tag-by-Tag Color Table

| HTML Tag             | Purpose                   | Color                     |
| -------------------- | ------------------------- | ------------------------- |
| `<span>`             | `CODE` eyebrow            | **#F54A8D**               |
| `<h2>`               | Main title                | **#0B1B3D**               |
| `<h3>`               | Section headings          | **#F54A8D**               |
| `<pre>`              | Code/error output         | Light neutral             |
| `<code>`             | Code                      | **#0B1B3D**               |
| `<p>`                | Explanation               | **#0B1B3D**               |
| `<strong>`           | Important concept         | **#0B1B3D**               |
| `<ol>`               | Optional correction steps | Neutral                   |
| `<li>`               | Correction item           | **#0B1B3D**               |
| Error indicator      | `❌` / semantic error      | Supporting semantic color |
| Correction indicator | `✓`                       | Supporting semantic color |

The semantic colors should not replace the SUIA brand identity.

---

# 33. C7 Semantic HTML Architecture

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>Common Mistake</h3>
│    └── <pre><code>
│
├── <section>
│    ├── <h3>Problem</h3>
│    └── <p>
│
├── <section>
│    ├── <h3>Why?</h3>
│    └── <p>
│
├── <section>
│    ├── <h3>Corrected Code</h3>
│    └── <pre><code>
│
└── <section>
     ├── <h3>Result</h3>
     └── <pre><code>
```

---

# 34. Complete C7 HTML Tag Inventory

| Tag         | Purpose           | Color Role    |
| ----------- | ----------------- | ------------- |
| `<section>` | Content sections  | Neutral       |
| `<header>`  | Header            | Neutral       |
| `<span>`    | Eyebrow / labels  | **Primary**   |
| `<h2>`      | Main title        | **Secondary** |
| `<h3>`      | Section headings  | **Primary**   |
| `<pre>`     | Code/error output | Neutral       |
| `<code>`    | Source code       | **Secondary** |
| `<p>`       | Explanation       | **Secondary** |
| `<strong>`  | Key concept       | **Secondary** |
| `<ol>`      | Correction steps  | Neutral       |
| `<li>`      | Individual step   | **Secondary** |

---

# 35. C7 Complete HTML

```html
<section
    class="tutorial-block code-block code-c7"
    data-block="code"
    data-version="C7"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Common List Index Mistake
        </h2>

    </header>


    <section class="mistake-section">

        <h3>
            Common Mistake
        </h3>

        <pre><code>numbers = [10, 20, 30]

print(numbers[3])</code></pre>

    </section>


    <section class="problem-section">

        <h3>
            Problem
        </h3>

        <p>
            The program attempts to access an index
            that does not exist in the list.
        </p>

        <pre><code>IndexError: list index out of range</code></pre>

    </section>


    <section class="why-section">

        <h3>
            Why?
        </h3>

        <p>
            The list contains three elements, so its
            valid indexes are 0, 1, and 2.
        </p>

    </section>


    <section class="correction-section">

        <h3>
            Corrected Code
        </h3>

        <pre><code>numbers = [10, 20, 30]

print(numbers[2])</code></pre>

    </section>


    <section class="result-section">

        <h3>
            Result
        </h3>

        <pre><code>30</code></pre>

    </section>

</section>
```

---

# 36. C7 JSON

```json
{
  "type": "code",
  "version": "C7",

  "content": {

    "title": "Common List Index Mistake",

    "language": "python",

    "mistake": {
      "type": "index",
      "code": "numbers = [10, 20, 30]\n\nprint(numbers[3])"
    },

    "problem": {
      "type": "runtime_error",
      "title": "IndexError",
      "message": "The requested index does not exist in the list.",
      "output": "IndexError: list index out of range"
    },

    "why": {
      "explanation": "The list contains three elements, so its valid indexes are 0, 1, and 2."
    },

    "correction": {
      "code": "numbers = [10, 20, 30]\n\nprint(numbers[2])"
    },

    "result": {
      "type": "text",
      "value": "30"
    }

  }
}
```

---

# 37. C7 JSON — Logical Mistake Variant

Not every mistake produces an exception.

```json
{
  "type": "code",
  "version": "C7",

  "content": {

    "title": "Off-by-One Mistake",

    "language": "python",

    "mistake": {
      "type": "logic",
      "code": "numbers = [1, 2, 3]\n\nfor i in range(1, len(numbers)):\n    print(numbers[i])"
    },

    "problem": {
      "type": "logical_error",
      "message": "The loop starts at index 1, so the first element is skipped."
    },

    "why": {
      "explanation": "Python sequences are zero-indexed."
    },

    "correction": {
      "code": "numbers = [1, 2, 3]\n\nfor i in range(len(numbers)):\n    print(numbers[i])"
    }

  }
}
```

This is why `problem.type` should not be limited to runtime errors.

---

# 38. C7 Error Categories in JSON

The renderer can support:

```text
syntax_error
runtime_error
type_error
logic_error
index_error
query_error
api_error
configuration_error
conceptual_error
security_design_issue
```

But the actual category should describe the content accurately.

---

# 39. C7 Correction Principle

The correction should be:

* minimal when teaching a small mistake
* directly related to the problem
* executable when code is executable
* technically accurate
* easy to compare with the incorrect version

Avoid changing ten unrelated things in the corrected code.

The learner should be able to answer:

> **“What exactly fixed the problem?”**

---

# 40. C7 Optional “Remember” Section

A small takeaway can be included:

```text
REMEMBER

Python list indexes start at 0.
```

However, this should remain short.

A large takeaway section belongs to the SummaryBlock.

---

# 41. C7 Information Density

| Component          | Recommendation |
| ------------------ | -------------: |
| Incorrect code     |     3–20 lines |
| Problem            |  1–3 sentences |
| Why                |  1–3 sentences |
| Corrected code     |     3–20 lines |
| Result             |       Optional |
| Remember           |       Optional |
| Examples           |              1 |
| Walkthrough        |              ❌ |
| Interactive editor |              ❌ |

C7 should teach **one primary mistake per version**.

---

# 42. C7 Best Use Cases

| Topic                 | Suitability |
| --------------------- | ----------: |
| Python syntax         |       ⭐⭐⭐⭐⭐ |
| Indexing              |       ⭐⭐⭐⭐⭐ |
| Type errors           |       ⭐⭐⭐⭐⭐ |
| Loops                 |       ⭐⭐⭐⭐⭐ |
| Functions             |       ⭐⭐⭐⭐⭐ |
| OOP                   |       ⭐⭐⭐⭐⭐ |
| NumPy                 |       ⭐⭐⭐⭐⭐ |
| Pandas                |       ⭐⭐⭐⭐⭐ |
| SQL                   |       ⭐⭐⭐⭐⭐ |
| JavaScript            |       ⭐⭐⭐⭐⭐ |
| TypeScript            |       ⭐⭐⭐⭐⭐ |
| API usage             |       ⭐⭐⭐⭐⭐ |
| Data engineering      |        ⭐⭐⭐⭐ |
| ML/data leakage       |       ⭐⭐⭐⭐⭐ |
| Authentication design |        ⭐⭐⭐⭐ |
| Quantum concepts      |        ⭐⭐⭐⭐ |

---

# 43. C7 What We Should Avoid

### ❌ Valid code → improved code

That is C6.

### ❌ Line-by-line explanation

That is C3.

### ❌ Execution sequence

That is C5.

### ❌ Three different mistakes

That moves toward C8.

### ❌ Massive troubleshooting guide

That is no longer a focused CodeBlock.

### ❌ Interactive debugger

That belongs conceptually with C10.

---

# 44. C7 Component Architecture

```text
CodeBlock
│
└── C7 Renderer
      │
      ├── Header
      │
      ├── MistakeSection
      │    └── IncorrectCode
      │
      ├── ProblemSection
      │    ├── ProblemType
      │    └── ProblemMessage
      │
      ├── WhySection
      │    └── Explanation
      │
      ├── CorrectionSection
      │    └── CorrectedCode
      │
      └── ResultSection
           └── OptionalResult
```

---

# 45. C7 Validation Rules

| Field                       |    Required |
| --------------------------- | ----------: |
| `type`                      |           ✅ |
| `version`                   |           ✅ |
| `title`                     |           ✅ |
| `mistake.code`              |           ✅ |
| `mistake.type`              | Recommended |
| `problem`                   |           ✅ |
| `problem.message`           |           ✅ |
| `why`                       | Recommended |
| `correction.code`           |           ✅ |
| `result`                    |    Optional |
| `remember`                  |    Optional |
| Execution walkthrough       |           ❌ |
| Before/After transformation |           ❌ |
| Multiple examples           |           ❌ |
| Interactive editor          |           ❌ |

---

# 46. C7 Final Technical Specification

| Area                        | C7 Decision                               |
| --------------------------- | ----------------------------------------- |
| Version                     | **C7**                                    |
| Name                        | **Common Mistake**                        |
| Main question               | **What is wrong and how do I fix it?**    |
| Structure                   | **Incorrect → Problem → Why → Corrected** |
| Best for                    | Debugging                                 |
| Primary                     | **#F54A8D**                               |
| Secondary                   | **#0B1B3D**                               |
| Theme                       | Light                                     |
| Gradient                    | ❌                                         |
| Dark theme                  | ❌                                         |
| A4                          | **Portrait**                              |
| Root                        | `<section>`                               |
| Title                       | `<h2>`                                    |
| Section labels              | `<h3>`                                    |
| Code                        | `<pre><code>`                             |
| Explanation                 | `<p>`                                     |
| Error output                | `<pre><code>`                             |
| Result                      | Optional                                  |
| Remember                    | Optional                                  |
| Syntax breakdown            | ❌                                         |
| Line annotations            | ❌                                         |
| Execution walkthrough       | ❌                                         |
| Before/After transformation | ❌                                         |
| Multiple examples           | ❌                                         |
| Interactive editor          | ❌                                         |
| JSON-driven                 | ✅                                         |
| Responsive                  | ✅                                         |
| Accessible                  | ✅                                         |
| Recommended mistakes        | **1 primary mistake**                     |
| Learning level              | **Beginner → Advanced**                   |

---

# 47. C7 Final Mental Model

```text
                         C7
                          │
                          ▼
                    COMMON MISTAKE
                          │
                          ▼
                    INCORRECT CODE
                          │
                          ▼
                       PROBLEM
                          │
                          ▼
                         WHY?
                          │
                          ▼
                    CORRECTED CODE
                          │
                          ▼
                       RESULT
```

The defining principle is:

> **C7 teaches debugging thinking by exposing a realistic mistake, explaining the underlying reason, and showing the smallest clear correction that resolves it.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| C1      | Basic Code Example          | ✅                   |
| C2      | Syntax + Explanation        | ✅                   |
| C3      | Annotated Code              | ✅                   |
| C4      | Code + Output               | ✅                   |
| C5      | Code Walkthrough            | ✅                   |
| C6      | Before / After Code         | ✅                   |
| **C7**  | **Common Mistake**          | ✅ **Completed now** |
| C8      | Multiple Examples           | ⏳ Next              |
| C9      | Code + Explanation + Output | ⏳                   |
| C10     | Interactive / Playground    | ⏳                   |

**C7 is complete. The next version is C8 — Multiple Examples.**



```python

```

# BLOCK 4 — CodeBlock

# C8 — Multiple Examples

C8 is the eighth version of the **CodeBlock**.

The CodeBlock progression is now:

| Version | Name                        | Main Learning Question                       |
| ------- | --------------------------- | -------------------------------------------- |
| C1      | Basic Code Example          | What does this code produce?                 |
| C2      | Syntax + Explanation        | What does this syntax mean?                  |
| C3      | Annotated Code              | What does each important line do?            |
| C4      | Code + Output               | What happens when the code executes?         |
| C5      | Code Walkthrough            | How does execution progress step by step?    |
| C6      | Before / After Code         | What changed and why?                        |
| C7      | Common Mistake              | What is wrong and how do I correct it?       |
| **C8**  | **Multiple Examples**       | **What different valid patterns can I use?** |
| C9      | Code + Explanation + Output | How do code, meaning, and result connect?    |
| C10     | Interactive / Playground    | Can I experiment with the code?              |

The defining structure of C8 is:

```text
CONCEPT
   │
   ├── Example 1
   │
   ├── Example 2
   │
   └── Example 3
```

The important principle is:

> **C8 teaches the same concept through multiple valid code examples so that the learner recognizes patterns rather than memorizing one implementation.**

---

# 1. Purpose of C8

A learner may understand one example but still not know how to apply the concept in a different situation.

C8 solves that problem.

For example, if the topic is **Python list creation**, one example is not enough:

```python
numbers = [1, 2, 3]
```

C8 can show:

```python
numbers = [1, 2, 3]
```

then:

```python
numbers = list((1, 2, 3))
```

and:

```python
numbers = [x for x in range(1, 4)]
```

The learner begins to understand:

```text
Same concept
     ↓
Different valid patterns
```

---

# 2. C8 Core Principle

C8 answers:

> **“How can I use this concept in different situations?”**

It is useful for:

* syntax patterns
* API usage
* alternative implementations
* common coding patterns
* data manipulation
* SQL queries
* NumPy operations
* Pandas operations
* JavaScript/TypeScript patterns
* algorithm implementations
* framework usage

---

# 3. C8 Canonical Structure

```text id="qk7m4r"
┌─────────────────────────────────────────────────────┐
│ CODE                                                 │
│                                                     │
│ Multiple Examples: Python List Creation             │
│                                                     │
│ EXAMPLE 1                                           │
│ numbers = [1, 2, 3]                                 │
│                                                     │
│ EXAMPLE 2                                           │
│ numbers = list((1, 2, 3))                           │
│                                                     │
│ EXAMPLE 3                                           │
│ numbers = [x for x in range(1, 4)]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The examples should share one common concept.

---

# 4. C8 vs C1

### C1

```text
Concept
   ↓
One basic example
```

### C8

```text
Concept
   ↓
Example 1
Example 2
Example 3
```

C1 teaches **one simple implementation**.

C8 teaches **pattern variety**.

---

# 5. C8 vs C6

C6:

```text
Before
 ↓
Change
 ↓
After
```

C8:

```text
Example 1
Example 2
Example 3
```

The examples in C8 do **not** have to be transformations of one another.

They are independent valid demonstrations of the same concept.

---

# 6. C8 vs C7

C7:

```text
Incorrect
 ↓
Problem
 ↓
Correct
```

C8:

```text
Valid Example 1
Valid Example 2
Valid Example 3
```

C8 should not be a collection of mistakes.

---

# 7. C8 Example — Python `for` Loop

### Example 1 — Basic iteration

```python id="r3j9t4"
for number in numbers:
    print(number)
```

### Example 2 — Iteration with index

```python id="k7w2p6"
for index, number in enumerate(numbers):
    print(index, number)
```

### Example 3 — Iteration with filtering

```python id="m5c8x1"
for number in numbers:
    if number > 10:
        print(number)
```

All three demonstrate:

> **Iterating over a collection**

but they teach different patterns.

---

# 8. C8 Example — Python Functions

### Example 1 — Positional arguments

```python id="x4p8m2"
def add(a, b):
    return a + b

add(10, 20)
```

### Example 2 — Default argument

```python id="z6n1q5"
def greet(name="User"):
    return f"Hello {name}"

greet()
```

### Example 3 — Keyword argument

```python id="v9r3k7"
def introduce(name, age):
    return f"{name} is {age}"

introduce(age=25, name="Alice")
```

The learner sees multiple function-call patterns.

---

# 9. C8 Example — Python List Creation

### Example 1

```python id="b7m2x4"
numbers = [1, 2, 3]
```

### Example 2

```python id="p5k9w1"
numbers = list((1, 2, 3))
```

### Example 3

```python id="j3q8n6"
numbers = list(range(1, 4))
```

These examples teach multiple ways to construct a list.

---

# 10. C8 Example — Python Dictionary

### Example 1

```python id="t6v1m9"
student = {
    "name": "Alice",
    "score": 90
}
```

### Example 2

```python id="g4x7p2"
student = dict(
    name="Alice",
    score=90
)
```

### Example 3

```python id="n8r3k5"
student = dict([
    ("name", "Alice"),
    ("score", 90)
])
```

The learner can compare different construction patterns.

---

# 11. C8 Example — NumPy

Suppose the concept is **array creation**.

### Example 1

```python id="q2f7s8"
np.array([1, 2, 3])
```

### Example 2

```python id="w5m1c9"
np.zeros(3)
```

### Example 3

```python id="a8k4r6"
np.ones(3)
```

### Example 4

```python id="z3p9n2"
np.arange(1, 4)
```

The examples represent different array-creation patterns.

---

# 12. C8 Example — NumPy Operations

### Example 1

```python id="f7m2v5"
result = numbers * 2
```

### Example 2

```python id="c9q4x1"
result = numbers + 10
```

### Example 3

```python id="y6k8r3"
result = numbers ** 2
```

Same concept:

> Element-wise NumPy operations.

Different operations demonstrate the pattern.

---

# 13. C8 Example — Pandas Selection

### Example 1 — Column

```python id="u4n7p2"
df["score"]
```

### Example 2 — Multiple columns

```python id="m8x3q6"
df[["name", "score"]]
```

### Example 3 — Row filtering

```python id="r1k9v5"
df[df["score"] > 80]
```

The learner sees that DataFrame selection can take multiple forms.

---

# 14. C8 Example — Pandas Aggregation

### Example 1

```python id="d6p2w8"
df["score"].mean()
```

### Example 2

```python id="s4m7x1"
df["score"].sum()
```

### Example 3

```python id="h9q3k5"
df["score"].max()
```

The common concept is aggregation.

---

# 15. C8 Example — SQL

Suppose the topic is filtering.

### Example 1

```sql id="j7v2n4"
SELECT *
FROM students
WHERE score > 80;
```

### Example 2

```sql id="c5r8p1"
SELECT *
FROM students
WHERE score BETWEEN 60 AND 80;
```

### Example 3

```sql id="x3m9q6"
SELECT *
FROM students
WHERE department = 'CS';
```

Same concept:

> Filtering records using `WHERE`.

---

# 16. C8 Example — SQL JOIN

### Example 1 — INNER JOIN

```sql id="b4k7z2"
SELECT *
FROM students
INNER JOIN courses
ON students.course_id = courses.id;
```

### Example 2 — LEFT JOIN

```sql id="p8x1m5"
SELECT *
FROM students
LEFT JOIN courses
ON students.course_id = courses.id;
```

### Example 3 — Multiple-column selection

```sql id="q6r3v9"
SELECT students.name, courses.title
FROM students
INNER JOIN courses
ON students.course_id = courses.id;
```

The examples can show how the same relational concept changes with requirements.

---

# 17. C8 Example — JavaScript Array Transformation

### Example 1 — `map()`

```javascript id="z5c8m1"
const doubled = numbers.map(
    number => number * 2
);
```

### Example 2 — `filter()`

```javascript id="f2n7q4"
const large = numbers.filter(
    number => number > 10
);
```

### Example 3 — `reduce()`

```javascript id="v9k3p6"
const total = numbers.reduce(
    (sum, number) => sum + number,
    0
);
```

This can teach three common functional patterns.

---

# 18. C8 Example — TypeScript Interfaces

### Example 1

```typescript id="m4r8x2"
interface User {
    name: string;
}
```

### Example 2

```typescript id="q7p1n5"
interface User {
    name: string;
    age: number;
}
```

### Example 3 — Optional property

```typescript id="c3v6k9"
interface User {
    name: string;
    age?: number;
}
```

The learner sees how the interface evolves.

---

# 19. C8 Example — REST API

Suppose the topic is retrieving resources.

### Example 1

```text id="h5w9q3"
GET /api/users
```

### Example 2

```text id="n2x7m4"
GET /api/users/101
```

### Example 3

```text id="r8k1p6"
GET /api/users?role=admin
```

The examples show:

```text
Collection
Individual resource
Filtered collection
```

---

# 20. C8 Example — Data Engineering

Suppose the topic is pipeline stages.

### Example 1

```text id="d4q8v2"
Extract
 ↓
Load
```

### Example 2

```text id="k6m1x9"
Extract
 ↓
Transform
 ↓
Load
```

### Example 3

```text id="p3r7w5"
Extract
 ↓
Validate
 ↓
Clean
 ↓
Transform
 ↓
Load
```

The learner sees progressively richer pipeline patterns.

---

# 21. C8 Example — Machine Learning

Suppose the concept is data splitting.

### Example 1

```python id="y8n2c4"
X_train, X_test = train_test_split(
    X
)
```

### Example 2

```python id="m5q7v1"
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y
)
```

### Example 3

```python id="s9k3p6"
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)
```

The examples can progressively demonstrate more realistic usage.

---

# 22. C8 Example — Full-Stack Architecture

Concept:

> API communication patterns.

### Example 1

```text id="w4m8q2"
Component
   ↓
API
```

### Example 2

```text id="c7p1x5"
Component
   ↓
API Client
   ↓
API
```

### Example 3

```text id="n9r3v6"
Component
   ↓
API Client
   ↓
Authentication
   ↓
API
   ↓
Database
```

This is useful when teaching progressively sophisticated architecture.

---

# 23. C8 Example — Authentication

A C8 block can show different legitimate authentication patterns.

### Example 1

```text id="j2k7m4"
Username + Password
        ↓
Authentication
```

### Example 2

```text id="x5q1p8"
Username + Password
        ↓
Session
```

### Example 3

```text id="v8r3n6"
Credentials
   ↓
Authentication
   ↓
Access Token
   ↓
Authenticated Request
```

The purpose is educational comparison, not operational exploitation.

---

# 24. C8 Example — Quantum Computing

Concept:

> Single-qubit operations.

### Example 1

```text id="a6m9q2"
|0⟩
 ↓
X
 ↓
|1⟩
```

### Example 2

```text id="f4r7x1"
|0⟩
 ↓
H
 ↓
Superposition
```

### Example 3

```text id="k8p3v5"
|1⟩
 ↓
X
 ↓
|0⟩
```

This allows the learner to recognize different operation patterns.

---

# 25. C8 Number of Examples

C8 should support:

```text
Minimum: 2
Recommended: 3
Maximum: 5
```

Why?

Because the purpose is pattern recognition.

If there are too many:

```text
Example 1
Example 2
Example 3
Example 4
Example 5
Example 6
Example 7
...
```

the block becomes a reference catalog rather than a teaching component.

For larger collections, use a dedicated tutorial section or multiple C8 blocks.

---

# 26. C8 Example Naming

Every example should have a concise title.

Good:

```text
Example 1 — Basic Usage
Example 2 — With Filtering
Example 3 — Real-World Pattern
```

Avoid:

```text
Example 1
Example 2
Example 3
```

when the examples are meaningfully different.

The title tells the learner **why this example exists**.

---

# 27. C8 Recommended Example Structure

Each example can contain:

```text id="j2r7m5"
Example
│
├── Title
├── Short purpose
├── Code
└── Optional output
```

So:

```text
Example 1
    ↓
Why use it?
    ↓
Code
    ↓
Optional result
```

---

# 28. C8 Example Comparison

For advanced topics, a compact comparison can appear below the examples:

| Example | Pattern  | Best For          |
| ------- | -------- | ----------------- |
| 1       | Basic    | Beginners         |
| 2       | Flexible | Real-world cases  |
| 3       | Advanced | Complex scenarios |

This is optional.

Do not let it turn C8 into a SummaryBlock.

---

# 29. C8 A4 Portrait Layout

The preferred A4 portrait layout:

```text id="cxu7bc"
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Python List Creation — Multiple Examples              │
│                                                        │
│ EXAMPLE 1 — Basic                                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = [1, 2, 3]                              │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ EXAMPLE 2 — Using list()                               │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = list((1, 2, 3))                        │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ EXAMPLE 3 — Using range()                              │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = list(range(1, 4))                      │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ KEY PATTERN                                             │
│ Different valid approaches can produce the same        │
│ conceptual result.                                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The examples should be **compact and vertically stacked**.

---

# 30. C8 Desktop Layout

On desktop, three examples can use a controlled grid:

```text id="k3y9m2"
┌──────────────────────────────────────────────────────────┐
│ CODE — Multiple Examples                                 │
│                                                          │
│ ┌──────────────────┐ ┌──────────────────┐ ┌────────────┐ │
│ │ EXAMPLE 1        │ │ EXAMPLE 2        │ │ EXAMPLE 3 │ │
│ │                  │ │                  │ │            │ │
│ │ code             │ │ code             │ │ code       │ │
│ │                  │ │                  │ │            │ │
│ └──────────────────┘ └──────────────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────┘
```

However, if the code is long, the examples should stack rather than become tiny cards.

---

# 31. C8 Mobile Layout

```text id="b8q5x1"
┌─────────────────────────────┐
│ CODE                        │
│                             │
│ Multiple Examples           │
│                             │
│ EXAMPLE 1                   │
│ Basic                       │
│ ┌─────────────────────────┐ │
│ │ code                    │ │
│ └─────────────────────────┘ │
│                             │
│ EXAMPLE 2                   │
│ Using list()                │
│ ┌─────────────────────────┐ │
│ │ code                    │ │
│ └─────────────────────────┘ │
│                             │
│ EXAMPLE 3                   │
│ Using range()               │
│ ┌─────────────────────────┐ │
│ │ code                    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

# 32. C8 SUIA Color Strategy

The brand colors remain:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Use pink for:

* `CODE` eyebrow
* example labels
* example numbers
* important pattern indicators

Use navy for:

* main title
* code
* descriptions
* technical information

---

# 33. C8 70/30 Rule

Approximately:

```text
70%
White / light neutrals / navy

30%
Pink
```

Do not create:

```text
Example 1 = pink card
Example 2 = pink card
Example 3 = pink card
```

That would violate the restrained SUIA visual language.

Instead:

```text
White surface
   │
Pink label
   │
Navy code
```

---

# 34. C8 Tag-by-Tag Color Table

| HTML Tag   | Purpose           | Color       |
| ---------- | ----------------- | ----------- |
| `<span>`   | `CODE` eyebrow    | **#F54A8D** |
| `<h2>`     | Main title        | **#0B1B3D** |
| `<h3>`     | Example heading   | **#F54A8D** |
| `<h4>`     | Example subtitle  | **#0B1B3D** |
| `<pre>`    | Code surface      | Neutral     |
| `<code>`   | Code              | **#0B1B3D** |
| `<p>`      | Description       | **#0B1B3D** |
| `<strong>` | Important pattern | **#0B1B3D** |
| `<ol>`     | Optional ordering | Neutral     |
| `<li>`     | Example           | **#0B1B3D** |

---

# 35. C8 Semantic HTML Architecture

```text id="ph7w4u"
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>Example 1</h3>
│    ├── <h4>
│    ├── <p>
│    └── <pre><code>
│
├── <section>
│    ├── <h3>Example 2</h3>
│    ├── <h4>
│    ├── <p>
│    └── <pre><code>
│
├── <section>
│    ├── <h3>Example 3</h3>
│    ├── <h4>
│    ├── <p>
│    └── <pre><code>
│
└── <section>
     ├── <h3>Key Pattern</h3>
     └── <p>
```

---

# 36. Complete C8 HTML Tag Inventory

| Tag         | Purpose                 | Color Role    |
| ----------- | ----------------------- | ------------- |
| `<section>` | Root / example sections | Neutral       |
| `<header>`  | Block header            | Neutral       |
| `<span>`    | Eyebrow / labels        | **Primary**   |
| `<h2>`      | Main title              | **Secondary** |
| `<h3>`      | Example heading         | **Primary**   |
| `<h4>`      | Example subtitle        | **Secondary** |
| `<p>`       | Explanation             | **Secondary** |
| `<pre>`     | Code                    | Neutral       |
| `<code>`    | Source code             | **Secondary** |
| `<strong>`  | Important concept       | **Secondary** |
| `<ol>`      | Ordered examples        | Neutral       |
| `<li>`      | Example item            | **Secondary** |

---

# 37. C8 Complete HTML

```html id="w8s3q1"
<section
    class="tutorial-block code-block code-c8"
    data-block="code"
    data-version="C8"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Python List Creation — Multiple Examples
        </h2>

    </header>


    <section class="example">

        <h3>
            Example 1
        </h3>

        <h4>
            Basic List Creation
        </h4>

        <p>
            Create a list directly using list literal syntax.
        </p>

        <pre><code>numbers = [1, 2, 3]</code></pre>

    </section>


    <section class="example">

        <h3>
            Example 2
        </h3>

        <h4>
            Using list()
        </h4>

        <p>
            Create a list from an iterable.
        </p>

        <pre><code>numbers = list((1, 2, 3))</code></pre>

    </section>


    <section class="example">

        <h3>
            Example 3
        </h3>

        <h4>
            Using range()
        </h4>

        <p>
            Generate a sequence of values and convert it to a list.
        </p>

        <pre><code>numbers = list(range(1, 4))</code></pre>

    </section>


    <section class="key-pattern">

        <h3>
            Key Pattern
        </h3>

        <p>
            Different valid approaches can produce the same
            conceptual result.
        </p>

    </section>

</section>
```

---

# 38. C8 JSON

```json id="8q5v2m"
{
  "type": "code",
  "version": "C8",

  "content": {

    "title": "Python List Creation — Multiple Examples",

    "language": "python",

    "examples": [

      {
        "number": 1,
        "title": "Basic List Creation",
        "description": "Create a list directly using list literal syntax.",
        "code": "numbers = [1, 2, 3]"
      },

      {
        "number": 2,
        "title": "Using list()",
        "description": "Create a list from an iterable.",
        "code": "numbers = list((1, 2, 3))"
      },

      {
        "number": 3,
        "title": "Using range()",
        "description": "Generate a sequence of values and convert it to a list.",
        "code": "numbers = list(range(1, 4))"
      }

    ],

    "keyPattern": {
      "text": "Different valid approaches can produce the same conceptual result."
    }

  }
}
```

---

# 39. C8 JSON Architecture

The core structure is:

```text id="2d9p5v"
examples[]
    │
    ├── number
    ├── title
    ├── description
    └── code
```

This makes the renderer capable of supporting:

```text
2 examples
3 examples
4 examples
5 examples
```

without changing the block architecture.

---

# 40. C8 Optional Output

Each example may optionally contain output:

```json id="4m7xq2"
{
  "number": 1,
  "title": "Basic Example",
  "code": "print(10 + 20)",
  "output": "30"
}
```

But output is not mandatory.

If output becomes the central teaching relationship, that content belongs more naturally in C4 or C9.

---

# 41. C8 Optional Comparison

A comparison can be added:

```json id="f8r1m6"
{
  "comparison": [
    {
      "example": 1,
      "bestFor": "Simple cases"
    },
    {
      "example": 2,
      "bestFor": "Iterable conversion"
    },
    {
      "example": 3,
      "bestFor": "Generated sequences"
    }
  ]
}
```

This is useful for advanced tutorials.

---

# 42. C8 Important Rule — Same Concept

The examples must belong to the **same learning concept**.

Good:

```text
Python list creation
 ├── Example 1
 ├── Example 2
 └── Example 3
```

Bad:

```text
Example 1 → Lists
Example 2 → Exceptions
Example 3 → Classes
```

That is not C8.

The block should have a single conceptual identity.

---

# 43. C8 Example Progression

Examples can be arranged from simple to advanced:

```text
Example 1
Basic
   ↓
Example 2
Practical
   ↓
Example 3
Advanced
```

This is recommended when teaching beginners.

But progression is optional; sometimes the examples are simply alternative patterns.

---

# 44. C8 Difficulty Metadata

The JSON can optionally contain:

```json id="5q8m1v"
{
  "number": 2,
  "difficulty": "intermediate"
}
```

Supported values:

```text
beginner
intermediate
advanced
```

This can help the UI display:

```text
Example 1 — Beginner
Example 2 — Intermediate
Example 3 — Advanced
```

without hardcoding difficulty into the content.

---

# 45. C8 Example Types

Each example can optionally have a category:

```text id="p7v2k9"
basic
practical
alternative
advanced
real_world
performance
library
pattern
```

For example:

```json id="x6m4r1"
{
  "number": 3,
  "type": "real_world"
}
```

---

# 46. C8 Information Density

| Component          | Recommendation |
| ------------------ | -------------: |
| Examples           |        **2–5** |
| Recommended        |          **3** |
| Code per example   |     1–15 lines |
| Description        |  1–2 sentences |
| Output             |       Optional |
| Comparison         |       Optional |
| Key pattern        |       Optional |
| Walkthrough        |              ❌ |
| Debugging          |              ❌ |
| Interactive editor |              ❌ |

---

# 47. C8 Best Use Cases

| Topic                   | Suitability |
| ----------------------- | ----------: |
| Python syntax patterns  |       ⭐⭐⭐⭐⭐ |
| Functions               |       ⭐⭐⭐⭐⭐ |
| OOP                     |       ⭐⭐⭐⭐⭐ |
| List operations         |       ⭐⭐⭐⭐⭐ |
| NumPy                   |       ⭐⭐⭐⭐⭐ |
| Pandas                  |       ⭐⭐⭐⭐⭐ |
| SQL                     |       ⭐⭐⭐⭐⭐ |
| JavaScript              |       ⭐⭐⭐⭐⭐ |
| TypeScript              |       ⭐⭐⭐⭐⭐ |
| API usage               |       ⭐⭐⭐⭐⭐ |
| Data engineering        |       ⭐⭐⭐⭐⭐ |
| ML patterns             |       ⭐⭐⭐⭐⭐ |
| Full-stack patterns     |       ⭐⭐⭐⭐⭐ |
| Authentication concepts |        ⭐⭐⭐⭐ |
| Quantum operations      |        ⭐⭐⭐⭐ |

---

# 48. C8 What We Should Avoid

### ❌ One example

That is C1.

### ❌ Line-by-line explanation

That is C3.

### ❌ Execution sequence

That is C5.

### ❌ Before/after transformation

That is C6.

### ❌ Incorrect/correct pair

That is C7.

### ❌ Large catalog of 10+ examples

That should become a separate learning section or reference.

### ❌ Full explanation + output + takeaway

That approaches C9.

### ❌ Interactive examples

That is C10.

---

# 49. C8 Component Architecture

```text id="3l6yq8"
CodeBlock
│
└── C8 Renderer
      │
      ├── Header
      │
      ├── Examples[]
      │    │
      │    ├── ExampleHeader
      │    ├── Description
      │    ├── CodeRenderer
      │    └── OptionalOutput
      │
      └── KeyPattern
```

---

# 50. C8 Validation Rules

| Field                 |    Required |
| --------------------- | ----------: |
| `type`                |           ✅ |
| `version`             |           ✅ |
| `title`               |           ✅ |
| `examples`            |           ✅ |
| Minimum examples      |       **2** |
| Maximum recommended   |       **5** |
| `example.number`      |           ✅ |
| `example.title`       | Recommended |
| `example.code`        |           ✅ |
| `example.description` |    Optional |
| `example.output`      |    Optional |
| `keyPattern`          |    Optional |
| Comparison            |    Optional |
| Execution walkthrough |           ❌ |
| Mistake               |           ❌ |
| Before/After          |           ❌ |
| Interactive editor    |           ❌ |

---

# 51. C8 Final Technical Specification

| Area                  | C8 Decision                                  |
| --------------------- | -------------------------------------------- |
| Version               | **C8**                                       |
| Name                  | **Multiple Examples**                        |
| Main question         | **What different valid patterns can I use?** |
| Structure             | **Example 1 → Example 2 → Example 3**        |
| Best for              | Syntax patterns                              |
| Primary               | **#F54A8D**                                  |
| Secondary             | **#0B1B3D**                                  |
| Theme                 | Light                                        |
| Gradient              | ❌                                            |
| Dark theme            | ❌                                            |
| A4                    | **Portrait**                                 |
| Root                  | `<section>`                                  |
| Title                 | `<h2>`                                       |
| Example headings      | `<h3>`                                       |
| Example subtitle      | `<h4>`                                       |
| Code                  | `<pre><code>`                                |
| Description           | `<p>`                                        |
| Examples              | **2–5**                                      |
| Recommended           | **3**                                        |
| Output                | Optional                                     |
| Comparison            | Optional                                     |
| Key pattern           | Optional                                     |
| Syntax breakdown      | ❌                                            |
| Execution walkthrough | ❌                                            |
| Before/After          | ❌                                            |
| Debugging             | ❌                                            |
| Interactive editor    | ❌                                            |
| JSON-driven           | ✅                                            |
| Responsive            | ✅                                            |
| Accessible            | ✅                                            |
| Learning level        | **Beginner → Advanced**                      |

---

# 52. C8 Final Mental Model

```text id="4v7q2m"
                         C8
                          │
                          ▼
                       CONCEPT
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
         EXAMPLE 1    EXAMPLE 2    EXAMPLE 3
             │            │            │
          Pattern      Pattern      Pattern
             │            │            │
             └────────────┼────────────┘
                          ▼
                 PATTERN RECOGNITION
```

The defining principle is:

> **C8 exposes the learner to multiple valid implementations of the same concept, helping them recognize reusable patterns and understand that programming problems can often be solved in more than one legitimate way.**

---

## CodeBlock Progress

| Version | Name                        | Status              |
| ------- | --------------------------- | ------------------- |
| C1      | Basic Code Example          | ✅                   |
| C2      | Syntax + Explanation        | ✅                   |
| C3      | Annotated Code              | ✅                   |
| C4      | Code + Output               | ✅                   |
| C5      | Code Walkthrough            | ✅                   |
| C6      | Before / After Code         | ✅                   |
| C7      | Common Mistake              | ✅                   |
| **C8**  | **Multiple Examples**       | ✅ **Completed now** |
| C9      | Code + Explanation + Output | ⏳ Next              |
| C10     | Interactive / Playground    | ⏳                   |

**C8 is complete. The next version is C9 — Code + Explanation + Output.**



```python

```

# BLOCK 4 — CodeBlock

# C9 — Code + Explanation + Output

C9 is the ninth version of the **CodeBlock**.

The CodeBlock progression is now:

| Version | Name                            | Main Learning Question                                    |
| ------- | ------------------------------- | --------------------------------------------------------- |
| C1      | Basic Code Example              | What does this code produce?                              |
| C2      | Syntax + Explanation            | What does this syntax mean?                               |
| C3      | Annotated Code                  | What does each important line do?                         |
| C4      | Code + Output                   | What happens when the code executes?                      |
| C5      | Code Walkthrough                | How does execution progress step by step?                 |
| C6      | Before / After Code             | What changed and why?                                     |
| C7      | Common Mistake                  | What is wrong and how do I correct it?                    |
| C8      | Multiple Examples               | What different valid patterns can I use?                  |
| **C9**  | **Code + Explanation + Output** | **How do the code, its meaning, and its result connect?** |
| C10     | Interactive / Playground        | Can I experiment with the code?                           |

The canonical C9 structure is:

```text
CODE
  ↓
EXPLANATION
  ↓
OUTPUT
  ↓
TAKEAWAY
```

The defining principle is:

> **C9 connects the complete code example with a meaningful explanation and the actual result produced by that code.**

---

# 1. Purpose of C9

C9 is intended to be the **standard comprehensive CodeBlock** when C1–C8 would each be too narrow.

It brings together three essential learning elements:

```text
What did I write?
        ↓
What does it do?
        ↓
What does it produce?
```

For example:

```python
numbers = [10, 20, 30]

total = sum(numbers)

print(total)
```

C9 explains:

```text
CODE
 ↓
sum(numbers) calculates the total
 ↓
OUTPUT
60
```

This gives the learner a complete small learning unit.

---

# 2. C9 Core Principle

C9 answers:

> **“Show me the code, explain what it does, and show me the result.”**

This makes C9 especially useful for:

* standard programming concepts
* API examples
* Python
* NumPy
* Pandas
* SQL
* JavaScript
* TypeScript
* data engineering
* machine learning
* full-stack examples
* framework usage

---

# 3. C9 Canonical Structure

```text
┌──────────────────────────────────────────────┐
│ CODE                                         │
│                                              │
│ numbers = [10, 20, 30]                       │
│ total = sum(numbers)                         │
│ print(total)                                 │
│                                              │
├──────────────────────────────────────────────┤
│ EXPLANATION                                  │
│                                              │
│ sum() adds the values in the list and       │
│ returns their total.                         │
│                                              │
├──────────────────────────────────────────────┤
│ OUTPUT                                       │
│                                              │
│ 60                                           │
│                                              │
├──────────────────────────────────────────────┤
│ TAKEAWAY                                     │
│                                              │
│ sum() can calculate the total of a numeric   │
│ iterable.                                    │
└──────────────────────────────────────────────┘
```

---

# 4. C9 vs C4

This distinction is important.

### C4

```text
CODE
 ↓
OUTPUT
```

C4 is focused on **behavior**.

### C9

```text
CODE
 ↓
EXPLANATION
 ↓
OUTPUT
 ↓
TAKEAWAY
```

C9 provides a complete teaching context.

Therefore:

> **C4 = What happened?**

> **C9 = What did I write, why does it work, and what happened?**

---

# 5. C9 vs C5

C5:

```text
Code
 ↓
Step 1
 ↓
Step 2
 ↓
Step 3
 ↓
Result
```

C5 focuses on **execution sequence**.

C9:

```text
Code
 ↓
Explanation
 ↓
Output
```

C9 does not require a detailed execution timeline.

---

# 6. C9 vs C8

C8:

```text
Concept
 ├── Example 1
 ├── Example 2
 └── Example 3
```

C9:

```text
One Example
 ↓
Detailed Explanation
 ↓
Output
```

C8 teaches **variation**.

C9 teaches **complete understanding of one example**.

---

# 7. C9 Example — Python

```python
numbers = [10, 20, 30]

total = sum(numbers)

print(total)
```

### Explanation

```text
numbers stores three numeric values.

sum(numbers) calculates their total.

The result is assigned to total.

print(total) displays the value.
```

### Output

```text
60
```

### Takeaway

> `sum()` can calculate the total of values in a numeric iterable.

This is the canonical C9 pattern.

---

# 8. C9 Example — Python List Comprehension

```python
numbers = [1, 2, 3, 4]

squares = [
    number * number
    for number in numbers
]

print(squares)
```

### Explanation

The comprehension iterates through each value in `numbers`, calculates its square, and constructs a new list.

### Output

```text
[1, 4, 9, 16]
```

### Takeaway

> A list comprehension can express a transformation compactly.

---

# 9. C9 Example — Python Function

```python
def calculate_area(width, height):
    return width * height

area = calculate_area(10, 5)

print(area)
```

### Explanation

The function receives `width` and `height`, multiplies them, and returns the calculated area.

The function call:

```text
calculate_area(10, 5)
```

produces:

```text
50
```

### Output

```text
50
```

### Takeaway

> Functions encapsulate reusable logic and can return computed values.

---

# 10. C9 Example — NumPy

```python
import numpy as np

numbers = np.array([1, 2, 3])

result = numbers * 2

print(result)
```

### Explanation

`numbers` is a NumPy array.

The multiplication:

```python
numbers * 2
```

performs element-wise multiplication.

Therefore:

```text
1 × 2 = 2
2 × 2 = 4
3 × 2 = 6
```

### Output

```text
[2 4 6]
```

### Takeaway

> NumPy supports element-wise arithmetic operations on arrays.

---

# 11. C9 Example — Pandas

```python
import pandas as pd

df = pd.DataFrame({
    "score": [80, 90, 100]
})

average = df["score"].mean()

print(average)
```

### Explanation

The DataFrame contains a `score` column.

```python
df["score"]
```

selects that column.

```python
.mean()
```

calculates its arithmetic mean.

### Output

```text
90.0
```

### Takeaway

> Pandas provides aggregation operations directly on Series and DataFrame data.

---

# 12. C9 Example — SQL

```sql
SELECT name, score
FROM students
WHERE score > 80;
```

### Explanation

The query:

1. reads data from `students`
2. filters rows where `score > 80`
3. returns only the `name` and `score` columns

### Output

Conceptually:

```text
name       score
---------  -----
Alice       90
Bob         95
```

The actual rows depend on the underlying table.

### Takeaway

> `WHERE` filters rows while `SELECT` determines which columns are returned.

---

# 13. C9 Example — JavaScript

```javascript
const numbers = [1, 2, 3];

const doubled = numbers.map(
    number => number * 2
);

console.log(doubled);
```

### Explanation

`map()` applies the callback to every element.

```text
1 → 2
2 → 4
3 → 6
```

### Output

```text
[2, 4, 6]
```

### Takeaway

> `map()` creates a new array by transforming each element.

---

# 14. C9 Example — TypeScript

```typescript
interface User {
    name: string;
    age: number;
}

const user: User = {
    name: "Alice",
    age: 25
};

console.log(user.name);
```

### Explanation

The `User` interface defines the expected structure.

The object must provide:

```text
name → string
age  → number
```

The expression:

```typescript
user.name
```

accesses the `name` property.

### Output

```text
Alice
```

### Takeaway

> TypeScript interfaces describe the expected structure of objects.

---

# 15. C9 Example — Full-Stack

A conceptual API example:

```text
GET /api/users/101
```

### Explanation

```text
Client
  ↓
HTTP GET request
  ↓
API endpoint
  ↓
User lookup
  ↓
JSON response
```

### Output

```json
{
  "id": 101,
  "name": "Alice"
}
```

### Takeaway

> An API endpoint exposes a defined interface through which a client can request application data.

---

# 16. C9 Example — Data Engineering

```text
Raw Data
   ↓
Validate
   ↓
Transform
   ↓
Load
```

### Explanation

The pipeline takes incoming data, validates it, transforms it into the required structure, and loads it into the destination.

### Output

```text
Analytics-ready data
```

### Takeaway

> A data pipeline converts source data into a usable destination representation through defined processing stages.

---

# 17. C9 Example — Machine Learning

```python
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

### Explanation

The model is trained using the training data.

After training, the model receives test features and produces predictions.

### Output

```text
Predictions
[0, 1, 1, 0, ...]
```

The actual values depend on the model and dataset.

### Takeaway

> Training produces a fitted model that can subsequently be used to generate predictions.

---

# 18. C9 Example — Authentication

Conceptual flow:

```text
Credentials
    ↓
Authentication
    ↓
Authenticated Identity
    ↓
Authorized Request
```

### Explanation

Authentication establishes who the requester is.

Authorization determines whether that authenticated identity is permitted to perform the requested operation.

### Output

```text
Authenticated + Authorized
```

or:

```text
Authenticated + Access Denied
```

### Takeaway

> Authentication and authorization are separate security responsibilities.

---

# 19. C9 Example — Quantum Computing

Conceptual example:

```text
|0⟩
 ↓
H
 ↓
Superposition
 ↓
Measurement
```

### Explanation

The Hadamard operation transforms the initial computational basis state into a superposition. Measurement then produces a classical outcome according to the resulting quantum state.

### Output

```text
0 or 1
```

The actual measurement outcome is probabilistic for the standard idealized equal superposition.

### Takeaway

> Quantum operations transform quantum states, while measurement produces classical information.

---

# 20. C9 Explanation Levels

The explanation can contain different levels of detail:

### Level 1 — Short

```text
sum() adds the values.
```

### Level 2 — Standard

```text
sum() iterates over the numeric values and
returns their total.
```

### Level 3 — Detailed

```text
The list contains three integers. The sum()
operation aggregates those values into a single
numeric result, which is then assigned to total
and displayed by print().
```

The renderer should support the content length without changing the C9 architecture.

---

# 21. C9 Explanation Structure

For more detailed C9 content, use:

```text
EXPLANATION

1. What the code does
2. Important operation
3. How the values change
4. Why the result occurs
```

But this should remain concise enough to preserve the CodeBlock's identity.

A very long conceptual explanation belongs in the Definition or Introduction blocks.

---

# 22. C9 Code Highlighting

Important code can be highlighted:

```python
numbers = [10, 20, 30]

total = sum(numbers)

print(total)
```

The renderer may emphasize:

```text
sum(numbers)
```

because that is the central operation.

Pink:

```text
#F54A8D
```

should identify the important concept rather than highlighting every line.

---

# 23. C9 Output Types

C9 should support several output types.

| Output Type   | Example          |
| ------------- | ---------------- |
| Text          | `Hello`          |
| Number        | `60`             |
| Boolean       | `True`           |
| List          | `[2, 4, 6]`      |
| Table         | DataFrame result |
| JSON          | API response     |
| SQL result    | Result set       |
| Diagram/state | Conceptual state |
| Error         | Error output     |

---

# 24. C9 Output Must Be Honest

If code is executable, output should correspond to the code.

If output depends on external data, explicitly indicate that:

```text
Output depends on the dataset.
```

If it is conceptual:

```text
Conceptual result
```

Do not present fabricated runtime results as if they were executed.

---

# 25. C9 Optional Execution Context

For realistic examples, metadata can be included:

```text
Python 3.x
NumPy
Pandas
PostgreSQL
Node.js
TypeScript
```

This can help prevent ambiguity.

For example:

```json
{
  "language": "python",
  "runtime": "Python 3.x"
}
```

---

# 26. C9 A4 Portrait Layout

The preferred A4 portrait design:

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Calculate the Sum of a List                            │
│                                                        │
│ CODE                                                   │
│ ┌──────────────────────────────────────────────────┐   │
│ │ numbers = [10, 20, 30]                           │   │
│ │                                                  │   │
│ │ total = sum(numbers)                             │   │
│ │                                                  │   │
│ │ print(total)                                    │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ EXPLANATION                                            │
│ `sum()` calculates the total of the numeric values.   │
│ The result is stored in `total` and printed.          │
│                                                        │
│ OUTPUT                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 60                                               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ TAKEAWAY                                               │
│ `sum()` can calculate the total of a numeric         │
│ iterable.                                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

This is the **complete teaching card** style of CodeBlock.

---

# 27. C9 Desktop Layout

```text
┌──────────────────────────────────────────────────────────┐
│ CODE — Calculate the Sum                                 │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ numbers = [10, 20, 30]                               │ │
│ │ total = sum(numbers)                                 │ │
│ │ print(total)                                         │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ EXPLANATION                                              │
│ sum() aggregates the values in the list.                │
│                                                          │
│ OUTPUT                                                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 60                                                   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ TAKEAWAY                                                │
│ sum() returns the total of a numeric iterable.          │
└──────────────────────────────────────────────────────────┘
```

---

# 28. C9 Mobile Layout

```text
┌─────────────────────────────┐
│ CODE                        │
│                             │
│ Calculate the Sum           │
│                             │
│ CODE                        │
│ ┌─────────────────────────┐ │
│ │ numbers = [10,20,30]    │ │
│ │ total = sum(numbers)    │ │
│ │ print(total)            │ │
│ └─────────────────────────┘ │
│                             │
│ EXPLANATION                 │
│ sum() calculates the total. │
│                             │
│ OUTPUT                      │
│ ┌─────────────────────────┐ │
│ │ 60                      │ │
│ └─────────────────────────┘ │
│                             │
│ TAKEAWAY                    │
│ sum() returns the total.    │
└─────────────────────────────┘
```

---

# 29. C9 SUIA Color Strategy

Final SUIA colors:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Use **#F54A8D** for:

* CODE eyebrow
* section labels
* key operation highlight
* output label
* takeaway label

Use **#0B1B3D** for:

* title
* code
* explanation
* output values
* takeaway text

---

# 30. C9 70/30 Color Rule

Target visual balance:

```text
≈ 70%
White / light neutrals / dark navy

≈ 30%
SUIA pink
```

A good visual hierarchy is:

```text
CODE
  ↓
Navy code surface
  ↓
EXPLANATION
  ↓
Navy text
  ↓
OUTPUT
  ↓
Pink label + navy output
  ↓
TAKEAWAY
  ↓
Pink label + navy text
```

Pink should remain an **accent**, not the dominant background.

---

# 31. C9 Tag-by-Tag Color Table

| HTML Tag    | Purpose               | Color       |
| ----------- | --------------------- | ----------- |
| `<span>`    | `CODE` eyebrow        | **#F54A8D** |
| `<h2>`      | Main title            | **#0B1B3D** |
| `<h3>`      | Section headings      | **#F54A8D** |
| `<p>`       | Explanation           | **#0B1B3D** |
| `<pre>`     | Code/output surface   | Neutral     |
| `<code>`    | Code/output value     | **#0B1B3D** |
| `<strong>`  | Important concept     | **#0B1B3D** |
| `<div>`     | Layout                | Neutral     |
| `<section>` | Semantic content area | Neutral     |

---

# 32. C9 Semantic HTML Architecture

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>Code</h3>
│    └── <pre><code>
│
├── <section>
│    ├── <h3>Explanation</h3>
│    └── <p>
│
├── <section>
│    ├── <h3>Output</h3>
│    └── <pre><code>
│
└── <section>
     ├── <h3>Takeaway</h3>
     └── <p>
```

---

# 33. Complete C9 HTML Tag Inventory

| Tag         | Purpose               | Color Role    |
| ----------- | --------------------- | ------------- |
| `<section>` | Root/content sections | Neutral       |
| `<header>`  | Block header          | Neutral       |
| `<span>`    | Eyebrow               | **Primary**   |
| `<h2>`      | Main title            | **Secondary** |
| `<h3>`      | Section labels        | **Primary**   |
| `<p>`       | Explanation/takeaway  | **Secondary** |
| `<pre>`     | Code/output           | Neutral       |
| `<code>`    | Code/value            | **Secondary** |
| `<strong>`  | Key concept           | **Secondary** |
| `<div>`     | Layout utility        | Neutral       |

---

# 34. Complete C9 HTML

```html
<section
    class="tutorial-block code-block code-c9"
    data-block="code"
    data-version="C9"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Calculate the Sum of a List
        </h2>

    </header>


    <section class="code-section">

        <h3>
            Code
        </h3>

        <pre><code>numbers = [10, 20, 30]

total = sum(numbers)

print(total)</code></pre>

    </section>


    <section class="explanation-section">

        <h3>
            Explanation
        </h3>

        <p>
            The <code>sum()</code> function calculates
            the total of the numeric values in
            <code>numbers</code>.
        </p>

        <p>
            The resulting value is assigned to
            <code>total</code> and then displayed
            using <code>print()</code>.
        </p>

    </section>


    <section class="output-section">

        <h3>
            Output
        </h3>

        <pre><code>60</code></pre>

    </section>


    <section class="takeaway-section">

        <h3>
            Takeaway
        </h3>

        <p>
            <strong>
                sum()
            </strong>
            can calculate the total of values
            in a numeric iterable.
        </p>

    </section>

</section>
```

---

# 35. C9 JSON

```json
{
  "type": "code",
  "version": "C9",

  "content": {

    "title": "Calculate the Sum of a List",

    "language": "python",

    "code": "numbers = [10, 20, 30]\n\ntotal = sum(numbers)\n\nprint(total)",

    "explanation": {
      "paragraphs": [
        "The sum() function calculates the total of the numeric values in numbers.",
        "The resulting value is assigned to total and then displayed using print()."
      ]
    },

    "output": {
      "type": "text",
      "value": "60"
    },

    "takeaway": {
      "text": "sum() can calculate the total of values in a numeric iterable."
    }

  }
}
```

---

# 36. C9 JSON Architecture

The structure is intentionally simple:

```text
content
│
├── title
├── language
├── code
│
├── explanation
│    └── paragraphs[]
│
├── output
│
└── takeaway
```

This makes C9 substantially richer than C4 while remaining simpler than a full interactive block.

---

# 37. C9 Output Metadata

For executable examples:

```json
{
  "output": {
    "type": "text",
    "value": "60"
  }
}
```

For JSON:

```json
{
  "output": {
    "type": "json",
    "value": {
      "id": 101,
      "name": "Alice"
    }
  }
}
```

For tables:

```json
{
  "output": {
    "type": "table",
    "columns": ["name", "score"],
    "rows": [
      ["Alice", 90],
      ["Bob", 95]
    ]
  }
}
```

The renderer can select the correct output representation from `output.type`.

---

# 38. C9 Optional Input

For examples where input matters:

```json
{
  "input": {
    "type": "text",
    "value": "10, 20, 30"
  }
}
```

The visual flow becomes:

```text
INPUT
  ↓
CODE
  ↓
OUTPUT
```

However, input is optional.

---

# 39. C9 Optional Execution Context

```json
{
  "language": "python",
  "runtime": "Python 3.x"
}
```

For libraries:

```json
{
  "language": "python",
  "libraries": [
    "numpy"
  ]
}
```

For SQL:

```json
{
  "language": "sql",
  "dialect": "PostgreSQL"
}
```

This is useful when syntax differs between environments.

---

# 40. C9 Optional Line Explanation

C9 should **not** become C3.

However, a small explanation can reference important lines:

```text
`sum(numbers)` performs the aggregation.
```

rather than:

```text
Line 1 does...
Line 2 does...
Line 3 does...
```

If detailed line-by-line annotation is required, use C3.

---

# 41. C9 Optional Takeaway

The takeaway should answer:

> **What should the learner remember from this example?**

Good:

```text
sum() returns the total of numeric values.
```

Bad:

```text
Python is a programming language that has many
functions and features...
```

That belongs elsewhere.

---

# 42. C9 Information Density

| Component          | Recommendation |
| ------------------ | -------------: |
| Code               |     3–25 lines |
| Explanation        | 1–4 paragraphs |
| Output             |    Recommended |
| Takeaway           |    Recommended |
| Input              |       Optional |
| Runtime            |       Optional |
| Line annotations   |              ❌ |
| Multiple examples  |              ❌ |
| Walkthrough        |              ❌ |
| Debugging          |              ❌ |
| Interactive editor |              ❌ |

C9 should remain a **complete but focused teaching example**.

---

# 43. C9 Best Use Cases

| Topic             | Suitability |
| ----------------- | ----------: |
| Python concepts   |       ⭐⭐⭐⭐⭐ |
| Functions         |       ⭐⭐⭐⭐⭐ |
| OOP               |       ⭐⭐⭐⭐⭐ |
| NumPy             |       ⭐⭐⭐⭐⭐ |
| Pandas            |       ⭐⭐⭐⭐⭐ |
| SQL               |       ⭐⭐⭐⭐⭐ |
| JavaScript        |       ⭐⭐⭐⭐⭐ |
| TypeScript        |       ⭐⭐⭐⭐⭐ |
| APIs              |       ⭐⭐⭐⭐⭐ |
| Data engineering  |       ⭐⭐⭐⭐⭐ |
| Machine learning  |       ⭐⭐⭐⭐⭐ |
| Full-stack        |       ⭐⭐⭐⭐⭐ |
| Authentication    |        ⭐⭐⭐⭐ |
| Quantum computing |        ⭐⭐⭐⭐ |

C9 is probably the **most broadly reusable CodeBlock version**.

---

# 44. C9 What We Should Avoid

### ❌ Multiple examples

That is C8.

### ❌ Detailed execution sequence

That is C5.

### ❌ Before/After

That is C6.

### ❌ Mistake/correction

That is C7.

### ❌ Detailed line-by-line annotations

That is C3.

### ❌ Interactive editor

That is C10.

### ❌ Huge conceptual explanation

That belongs in Definition/Introduction/Explanation-oriented content.

---

# 45. C9 Component Architecture

```text
CodeBlock
│
└── C9 Renderer
      │
      ├── Header
      │
      ├── CodeSection
      │    └── CodeRenderer
      │
      ├── ExplanationSection
      │    └── Paragraph[]
      │
      ├── OutputSection
      │    └── OutputRenderer
      │
      └── TakeawaySection
           └── Takeaway
```

Optional:

```text
InputSection
RuntimeBadge
LibraryBadge
```

---

# 46. C9 Validation Rules

| Field                    |    Required |
| ------------------------ | ----------: |
| `type`                   |           ✅ |
| `version`                |           ✅ |
| `title`                  |           ✅ |
| `code`                   |           ✅ |
| `language`               | Recommended |
| `explanation`            |           ✅ |
| `explanation.paragraphs` |           ✅ |
| `output`                 | Recommended |
| `takeaway`               | Recommended |
| `input`                  |    Optional |
| `runtime`                |    Optional |
| `libraries`              |    Optional |
| `lineAnnotations`        |           ❌ |
| `walkthrough`            |           ❌ |
| `beforeAfter`            |           ❌ |
| `mistake`                |           ❌ |
| `examples[]`             |           ❌ |
| Interactive editor       |           ❌ |

---

# 47. C9 Final Technical Specification

| Area                  | C9 Decision                                   |
| --------------------- | --------------------------------------------- |
| Version               | **C9**                                        |
| Name                  | **Code + Explanation + Output**               |
| Main question         | **How do code, meaning, and result connect?** |
| Structure             | **Code → Explanation → Output → Takeaway**    |
| Best for              | Standard teaching                             |
| Primary               | **#F54A8D**                                   |
| Secondary             | **#0B1B3D**                                   |
| Theme                 | Light                                         |
| Gradient              | ❌                                             |
| Dark theme            | ❌                                             |
| A4                    | **Portrait**                                  |
| Root                  | `<section>`                                   |
| Title                 | `<h2>`                                        |
| Section labels        | `<h3>`                                        |
| Code                  | `<pre><code>`                                 |
| Explanation           | `<p>`                                         |
| Output                | `<pre><code>` / specialized renderer          |
| Takeaway              | `<p>`                                         |
| Input                 | Optional                                      |
| Runtime               | Optional                                      |
| Libraries             | Optional                                      |
| Line annotations      | ❌                                             |
| Execution walkthrough | ❌                                             |
| Before/After          | ❌                                             |
| Debugging             | ❌                                             |
| Multiple examples     | ❌                                             |
| Interactive editor    | ❌                                             |
| JSON-driven           | ✅                                             |
| Responsive            | ✅                                             |
| Accessible            | ✅                                             |
| Learning level        | **Beginner → Advanced**                       |

---

# 48. C9 Final Mental Model

```text
                         C9
                          │
                          ▼
                         CODE
                          │
                          ▼
                    EXPLANATION
                          │
                          ▼
                        OUTPUT
                          │
                          ▼
                       TAKEAWAY
```

Or, conceptually:

```text
What did I write?
       ↓
What does it mean?
       ↓
What happened?
       ↓
What should I remember?
```

That is the identity of C9.

---

## CodeBlock Progress

| Version | Name                            | Status              |
| ------- | ------------------------------- | ------------------- |
| C1      | Basic Code Example              | ✅                   |
| C2      | Syntax + Explanation            | ✅                   |
| C3      | Annotated Code                  | ✅                   |
| C4      | Code + Output                   | ✅                   |
| C5      | Code Walkthrough                | ✅                   |
| C6      | Before / After Code             | ✅                   |
| C7      | Common Mistake                  | ✅                   |
| C8      | Multiple Examples               | ✅                   |
| **C9**  | **Code + Explanation + Output** | ✅ **Completed now** |
| C10     | Interactive / Playground        | ⏳ **Next**          |

**C9 is complete. The final CodeBlock version is C10 — Interactive / Playground.**



```python

```

# BLOCK 4 — CodeBlock

# C10 — Interactive / Playground

C10 is the **final version of the CodeBlock**.

The complete CodeBlock architecture is now:

| Version | Name                         | Main Learning Question                              |
| ------- | ---------------------------- | --------------------------------------------------- |
| C1      | Basic Code Example           | What does this code produce?                        |
| C2      | Syntax + Explanation         | What does this syntax mean?                         |
| C3      | Annotated Code               | What does each important line do?                   |
| C4      | Code + Output                | What happens when the code executes?                |
| C5      | Code Walkthrough             | How does execution progress step by step?           |
| C6      | Before / After Code          | What changed and why?                               |
| C7      | Common Mistake               | What is wrong and how do I correct it?              |
| C8      | Multiple Examples            | What different valid patterns can I use?            |
| C9      | Code + Explanation + Output  | How do code, meaning, and result connect?           |
| **C10** | **Interactive / Playground** | **Can I modify, run, and observe the code myself?** |

The defining structure is:

```text
EDITOR
   ↓
USER MODIFIES CODE
   ↓
RUN
   ↓
EXECUTION
   ↓
OUTPUT
   ↓
EXPERIMENT
```

C10 is therefore fundamentally different from C1–C9:

> **C1–C9 primarily present learning content. C10 allows the learner to actively interact with that content.**

---

# 1. Purpose of C10

C10 is designed for **hands-on learning**.

Instead of only showing:

```python
numbers = [1, 2, 3]

print(sum(numbers))
```

the learner receives an editor:

```text
┌──────────────────────────────────────────┐
│ numbers = [1, 2, 3]                      │
│                                          │
│ print(sum(numbers))                      │
│                                          │
│                         [ Run ]          │
└──────────────────────────────────────────┘
```

The learner can change:

```python
numbers = [10, 20, 30]
```

and execute again.

The learning cycle becomes:

```text
READ
 ↓
MODIFY
 ↓
RUN
 ↓
OBSERVE
 ↓
UNDERSTAND
 ↓
EXPERIMENT
```

---

# 2. C10 Core Principle

C10 answers:

> **“What happens if I change the code and run it myself?”**

This makes C10 especially powerful for:

* Python
* JavaScript
* TypeScript
* SQL
* NumPy
* Pandas
* algorithms
* data structures
* data engineering
* machine learning
* API concepts
* frontend programming
* backend programming
* configuration experiments

---

# 3. C10 Is Not Just a Code Editor

A critical architectural distinction:

```text
C10 ≠ Monaco Editor alone
```

C10 is a **learning component containing an execution environment**.

The complete model is:

```text
┌─────────────────────────────────────────────┐
│ LEARNING CONTEXT                            │
│                                             │
│ Short instruction                           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ CODE EDITOR                             │ │
│ │                                         │ │
│ │ numbers = [1, 2, 3]                     │ │
│ │ print(sum(numbers))                     │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Run ]       [ Reset ]                     │
│                                             │
│ OUTPUT                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ 6                                       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

# 4. C10 vs C9

### C9

```text
CODE
 ↓
EXPLANATION
 ↓
OUTPUT
 ↓
TAKEAWAY
```

The learner consumes the example.

### C10

```text
CODE
 ↓
EDIT
 ↓
RUN
 ↓
OUTPUT
 ↓
EDIT AGAIN
 ↓
RUN AGAIN
```

The learner **participates**.

Therefore:

> **C9 = Demonstration**

> **C10 = Experimentation**

---

# 5. C10 vs C8

C8:

```text
Example 1
Example 2
Example 3
```

C10:

```text
One executable example
       ↓
Learner changes it
       ↓
Learner runs it
```

C8 gives the learner alternatives.

C10 gives the learner **agency**.

---

# 6. C10 Canonical Layout

```text
┌──────────────────────────────────────────────────┐
│ CODE — Interactive Playground                    │
│                                                  │
│ Try changing the values and run the code.       │
│                                                  │
│ EDITOR                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ numbers = [1, 2, 3]                         │ │
│ │                                              │ │
│ │ total = sum(numbers)                         │ │
│ │ print(total)                                 │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [ Run ]   [ Reset ]                              │
│                                                  │
│ OUTPUT                                           │
│ ┌──────────────────────────────────────────────┐ │
│ │ 6                                            │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ TRY THIS                                         │
│ Change [1, 2, 3] to [10, 20, 30].               │
└──────────────────────────────────────────────────┘
```

---

# 7. C10 Core Components

C10 should contain these conceptual components:

```text
C10
│
├── Header
│
├── Instructions
│
├── Editor
│
├── Run Control
│
├── Reset Control
│
├── Execution Status
│
├── Output
│
└── Experiment Prompt
```

Optional:

```text
├── Input
├── Expected Output
├── Hints
├── Console
├── Error Panel
├── Test Results
└── Solution
```

---

# 8. C10 Editor

The editor is the central component.

Example:

```text
┌──────────────────────────────────────────────┐
│ 1 │ numbers = [1, 2, 3]                     │
│ 2 │                                          │
│ 3 │ total = sum(numbers)                     │
│ 4 │                                          │
│ 5 │ print(total)                             │
└──────────────────────────────────────────────┘
```

For a production implementation, the editor can provide:

* syntax highlighting
* indentation
* bracket matching
* line numbers
* code completion where appropriate
* keyboard shortcuts
* error indicators

But:

> **The editor technology itself is an implementation detail of C10.**

The block architecture should not be tied to one editor library.

---

# 9. C10 Run Button

The primary action should be visually obvious:

```text
┌───────────────┐
│ ▶ Run         │
└───────────────┘
```

The action sequence:

```text
Click Run
    ↓
Validate
    ↓
Execute
    ↓
Capture result
    ↓
Render output
```

---

# 10. C10 Reset Button

The learner should be able to restore the original example.

```text
┌───────────────┐
│ ↺ Reset       │
└───────────────┘
```

Reset should restore:

* original code
* original input
* initial output state

This is important because experimentation can quickly make the code difficult to recover.

---

# 11. C10 Execution State

The UI should communicate execution status.

Possible states:

```text
READY
RUNNING
SUCCESS
ERROR
TIMEOUT
```

Example:

```text
● Ready
```

After execution:

```text
✓ Execution complete
```

If execution fails:

```text
Execution error
```

Do not rely exclusively on color to communicate these states.

---

# 12. C10 Output Panel

Example:

```text
OUTPUT

60
```

For multiple lines:

```text
OUTPUT

10
20
30
```

For an error:

```text
OUTPUT

NameError:
name 'total' is not defined
```

The output panel should visually distinguish:

```text
normal output
```

from:

```text
execution error
```

---

# 13. C10 Error Panel

An interactive environment must handle errors safely.

Example:

```text
┌──────────────────────────────────────────────┐
│ EXECUTION ERROR                              │
│                                              │
│ NameError                                    │
│ name 'total' is not defined                  │
│                                              │
│ Line 3                                       │
└──────────────────────────────────────────────┘
```

The learner should understand:

```text
My code
   ↓
Error
   ↓
Where?
   ↓
Why?
```

For a detailed debugging lesson, however, the tutorial should link to or use **C7**.

---

# 14. C10 Experiment Prompt

This is one of the most important educational features.

Instead of merely saying:

```text
Run the code.
```

give the learner a small experiment:

```text
TRY THIS

Change [1, 2, 3] to [10, 20, 30].

What output do you get?
```

This converts the playground into an active learning exercise.

---

# 15. C10 Example — Python

Initial code:

```python
numbers = [1, 2, 3]

total = sum(numbers)

print(total)
```

Initial output:

```text
6
```

Experiment:

```text
TRY THIS

Change the list to:

[10, 20, 30]

Predict the output before clicking Run.
```

Learner changes code:

```python
numbers = [10, 20, 30]
```

Runs it.

Output:

```text
60
```

The learner has directly discovered the relationship.

---

# 16. C10 Example — Python Loop

```python
for number in range(5):
    print(number)
```

Output:

```text
0
1
2
3
4
```

Experiment:

```text
TRY THIS

Change range(5) to range(10).

How many numbers are printed?
```

---

# 17. C10 Example — NumPy

```python
import numpy as np

numbers = np.array([1, 2, 3])

print(numbers * 2)
```

Output:

```text
[2 4 6]
```

Experiment:

```text
TRY THIS

Change 2 to 5.

What happens?
```

This is a strong C10 use case.

---

# 18. C10 Example — Pandas

```python
import pandas as pd

df = pd.DataFrame({
    "score": [80, 90, 100]
})

print(df["score"].mean())
```

Output:

```text
90.0
```

Experiment:

```text
TRY THIS

Change 100 to 60.

Predict the new average before running.
```

This makes the learner interact with the data rather than merely reading it.

---

# 19. C10 Example — JavaScript

```javascript
const numbers = [1, 2, 3];

const doubled = numbers.map(
    number => number * 2
);

console.log(doubled);
```

Output:

```text
[2, 4, 6]
```

Experiment:

```text
TRY THIS

Change * 2 to * 3.
```

---

# 20. C10 Example — SQL

A SQL playground can provide:

```sql
SELECT name, score
FROM students
WHERE score > 80;
```

and a controlled dataset:

```text
students
────────────────
Alice     90
Bob       75
Carol     95
```

Output:

```text
Alice    90
Carol    95
```

Experiment:

```text
TRY THIS

Change 80 to 70.

Which additional row appears?
```

For SQL, the execution environment must be sandboxed and use an isolated dataset.

---

# 21. C10 Example — Data Engineering

A safe simulation can provide:

```text
INPUT DATA
───────────────
Alice,90
Bob,75
Carol,95
```

Transformation:

```python
records = [
    ("Alice", 90),
    ("Bob", 75),
    ("Carol", 95)
]

passed = [
    record
    for record in records
    if record[1] >= 80
]

print(passed)
```

Experiment:

```text
Change >= 80 to >= 90.
```

This teaches transformation logic without requiring real infrastructure.

---

# 22. C10 Example — Machine Learning

For ML, a playground can expose controlled parameters rather than unrestricted infrastructure.

Example:

```text
Learning Rate: [ 0.01 ]

Epochs: [ 10 ]

Model: Linear Regression
```

Then:

```text
[ Run Experiment ]
```

Output:

```text
Training complete

Loss: 0.024
```

The exact execution environment depends on the supported runtime.

---

# 23. C10 Example — Algorithm

Editor:

```python
numbers = [5, 2, 8, 1]

numbers.sort()

print(numbers)
```

Output:

```text
[1, 2, 5, 8]
```

Experiment:

```text
TRY THIS

Change the input order.

Does the output order change?
```

This encourages experimentation with invariants.

---

# 24. C10 Example — Full-Stack

For full-stack learning, the playground does not necessarily need to expose an entire production application.

Instead:

```text
REQUEST

GET /api/users/101
```

can be simulated against a controlled API.

The learner can modify:

```text
/api/users/101
```

to:

```text
/api/users/102
```

and observe the response.

This teaches API behavior safely.

---

# 25. C10 Example — Authentication

Interactive authentication demonstrations should use **synthetic accounts and isolated environments**.

For example:

```text
Role:
[ Student ▼ ]

Requested Resource:
[ Course Dashboard ▼ ]

[ Check Access ]
```

Output:

```text
Access Granted
```

Then change:

```text
Role → Guest
```

and run again:

```text
Access Denied
```

This demonstrates authorization logic without exposing real credentials or systems.

---

# 26. C10 Example — Quantum Computing

A quantum playground can expose:

```text
Initial State

|0⟩
```

Operation:

```text
[ Hadamard ▼ ]
```

Button:

```text
[ Run ]
```

Output:

```text
Superposition
```

For measurement:

```text
[ Measure ]
```

Output can show a probabilistic result.

This is particularly effective because learners can experiment with gate sequences.

---

# 27. C10 Input Panel

Some programs require user input.

Example:

```text
INPUT

Name:
┌──────────────────────────────┐
│ Alice                        │
└──────────────────────────────┘
```

Code:

```python
name = input()
print(f"Hello {name}")
```

Output:

```text
Hello Alice
```

C10 should distinguish:

```text
source code
```

from:

```text
user input
```

and:

```text
program output
```

---

# 28. C10 Expected Output

An optional teaching feature:

```text
PREDICT

What do you think the output will be?

[ __________________ ]
```

Then:

```text
[ Run ]
```

The system can compare the prediction with the actual result.

This creates:

```text
Predict
   ↓
Run
   ↓
Observe
   ↓
Compare
```

This is an excellent learning pattern.

---

# 29. C10 Hint System

Optional:

```text
Need a hint?

[ Show Hint ]
```

Hint:

```text
Think about how many times the loop executes.
```

Important:

> Hints should not immediately reveal the complete solution.

---

# 30. C10 Solution System

Optional for exercises:

```text
[ Show Solution ]
```

The solution should normally remain hidden initially.

This turns C10 into a lightweight programming exercise environment.

---

# 31. C10 Reset and Attempt Model

The system can track:

```text
Attempts: 3
Successful Runs: 2
```

But this should be used carefully.

The core CodeBlock should not become a gamification system unless explicitly required.

The fundamental model remains:

```text
Edit → Run → Observe
```

---

# 32. C10 A4 Portrait Layout

For the A4 Tutorial Engine page:

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│ CODE                                                   │
│                                                        │
│ Interactive List Playground                           │
│                                                        │
│ TRY THIS                                               │
│ Change the values and observe the result.             │
│                                                        │
│ EDITOR                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 1 │ numbers = [1, 2, 3]                          │   │
│ │ 2 │                                              │   │
│ │ 3 │ total = sum(numbers)                         │   │
│ │ 4 │                                              │   │
│ │ 5 │ print(total)                                 │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ [ ▶ RUN ]        [ ↺ RESET ]                          │
│                                                        │
│ STATUS                                                 │
│ ✓ Execution complete                                  │
│                                                        │
│ OUTPUT                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 6                                                │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ EXPERIMENT                                             │
│ Change [1, 2, 3] to [10, 20, 30].                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The A4 page should remain compact.

The editor must not consume the entire page.

---

# 33. C10 Desktop Layout

On desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ CODE — Interactive Playground                              │
│                                                             │
│ ┌──────────────────────────────────┐ ┌────────────────────┐ │
│ │ EDITOR                           │ │ OUTPUT             │ │
│ │                                  │ │                    │ │
│ │ numbers = [1,2,3]               │ │ 6                  │ │
│ │ total = sum(numbers)             │ │                    │ │
│ │ print(total)                     │ │                    │ │
│ │                                  │ │                    │ │
│ └──────────────────────────────────┘ └────────────────────┘ │
│                                                             │
│ [ ▶ RUN ]   [ ↺ RESET ]                                    │
│                                                             │
│ TRY THIS                                                   │
│ Change the list values and run again.                      │
└─────────────────────────────────────────────────────────────┘
```

---

# 34. C10 Mobile Layout

On mobile, everything becomes sequential:

```text
┌─────────────────────────────┐
│ CODE                        │
│ Interactive Playground      │
│                             │
│ TRY THIS                    │
│ Change the list values.     │
│                             │
│ EDITOR                      │
│ ┌─────────────────────────┐ │
│ │ code                    │ │
│ └─────────────────────────┘ │
│                             │
│ [ ▶ RUN ]                   │
│ [ ↺ RESET ]                 │
│                             │
│ STATUS                      │
│ ✓ Complete                  │
│                             │
│ OUTPUT                      │
│ ┌─────────────────────────┐ │
│ │ 6                       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

# 35. C10 SUIA Color Strategy

Final SUIA colors:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

Use pink for:

* `CODE` eyebrow
* Run button
* active editor indicator
* section labels
* experiment prompt
* important interaction state

Use navy for:

* title
* code
* editor text
* output text
* explanations

---

# 36. C10 70/30 Rule

The visual balance remains:

```text
≈ 70%
White / light neutral / navy

≈ 30%
Pink
```

The **Run button** can be the strongest pink element:

```text
┌──────────────────┐
│ ▶ RUN            │
└──────────────────┘
```

while Reset can remain a lighter secondary action.

---

# 37. C10 Tag-by-Tag Color Table

| HTML Tag                        | Purpose               | Color        |
| ------------------------------- | --------------------- | ------------ |
| `<span>`                        | `CODE` eyebrow        | **#F54A8D**  |
| `<h2>`                          | Main title            | **#0B1B3D**  |
| `<h3>`                          | Section headings      | **#F54A8D**  |
| `<p>`                           | Instructions          | **#0B1B3D**  |
| `<textarea>` / editor container | Code editor           | Neutral      |
| `<code>`                        | Code/output           | **#0B1B3D**  |
| `<button>` Run                  | Primary action        | **#F54A8D**  |
| `<button>` Reset                | Secondary action      | Neutral/Navy |
| `<output>`                      | Execution result      | **#0B1B3D**  |
| `<strong>`                      | Important instruction | **#0B1B3D**  |
| `<section>`                     | Content regions       | Neutral      |

For a production syntax-highlighted editor, individual token colors are an editor concern and should not introduce unnecessary SUIA brand colors.

---

# 38. Semantic HTML Architecture

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <section>
│    ├── <h3>Try This</h3>
│    └── <p>
│
├── <section>
│    ├── <h3>Editor</h3>
│    └── Editor Component
│
├── <nav>
│    ├── <button>Run</button>
│    └── <button>Reset</button>
│
├── <section>
│    ├── <h3>Status</h3>
│    └── Status
│
├── <section>
│    ├── <h3>Output</h3>
│    └── <output>
│
└── <section>
     ├── <h3>Experiment</h3>
     └── <p>
```

---

# 39. Complete C10 HTML Tag Inventory

| Tag         | Purpose               | Color Role      |
| ----------- | --------------------- | --------------- |
| `<section>` | Root/content regions  | Neutral         |
| `<header>`  | Block header          | Neutral         |
| `<span>`    | Eyebrow / label       | **Primary**     |
| `<h2>`      | Main title            | **Secondary**   |
| `<h3>`      | Section headings      | **Primary**     |
| `<p>`       | Instructions          | **Secondary**   |
| `<pre>`     | Static code display   | Neutral         |
| `<code>`    | Code/value            | **Secondary**   |
| `<button>`  | Run/Reset controls    | Primary/Neutral |
| `<output>`  | Execution result      | **Secondary**   |
| `<nav>`     | Action controls       | Neutral         |
| `<strong>`  | Important instruction | **Secondary**   |

---

# 40. C10 Complete HTML Structure

The exact editor implementation can be React/Monaco/CodeMirror/etc., but the semantic wrapper can look like:

```html
<section
    class="tutorial-block code-block code-c10"
    data-block="code"
    data-version="C10"
>

    <header class="code-header">

        <span class="code-eyebrow">
            CODE
        </span>

        <h2 class="code-title">
            Interactive List Playground
        </h2>

    </header>


    <section class="instruction-section">

        <h3>
            Try This
        </h3>

        <p>
            Change the values in the list and
            observe the result.
        </p>

    </section>


    <section class="editor-section">

        <h3>
            Editor
        </h3>

        <div
            class="code-editor"
            role="textbox"
            aria-label="Python code editor"
            contenteditable="true"
        >numbers = [1, 2, 3]

total = sum(numbers)

print(total)</div>

    </section>


    <nav class="playground-actions"
         aria-label="Playground controls">

        <button type="button">
            ▶ Run
        </button>

        <button type="button">
            ↺ Reset
        </button>

    </nav>


    <section class="status-section">

        <h3>
            Status
        </h3>

        <p>
            Ready
        </p>

    </section>


    <section class="output-section">

        <h3>
            Output
        </h3>

        <output aria-live="polite">
        </output>

    </section>


    <section class="experiment-section">

        <h3>
            Experiment
        </h3>

        <p>
            Change
            <strong>[1, 2, 3]</strong>
            to
            <strong>[10, 20, 30]</strong>
            and run the code again.
        </p>

    </section>

</section>
```

For a real production implementation, the `contenteditable` example above would normally be replaced by a proper code-editor component.

---

# 41. C10 JSON

```json
{
  "type": "code",
  "version": "C10",

  "content": {

    "title": "Interactive List Playground",

    "language": "python",

    "instructions": {
      "text": "Change the values in the list and observe the result."
    },

    "initialCode": "numbers = [1, 2, 3]\n\ntotal = sum(numbers)\n\nprint(total)",

    "execution": {
      "enabled": true,
      "timeoutMs": 3000
    },

    "initialOutput": {
      "type": "text",
      "value": "6"
    },

    "controls": {
      "run": true,
      "reset": true
    },

    "experiment": {
      "instruction": "Change [1, 2, 3] to [10, 20, 30] and run the code again."
    }

  }
}
```

---

# 42. C10 JSON Architecture

The essential model is:

```text
content
│
├── title
├── language
│
├── instructions
│
├── initialCode
│
├── execution
│
├── initialOutput
│
├── controls
│
└── experiment
```

The important distinction is:

```text
initialCode
```

rather than simply:

```text
code
```

because the learner's code can change during the session.

---

# 43. C10 Execution Model

Conceptually:

```text
                    C10
                     │
                     ▼
               Initial Code
                     │
                     ▼
                  EDITOR
                     │
                     ▼
                User edits
                     │
                     ▼
                  RUN
                     │
              ┌──────┴──────┐
              ▼             ▼
           SUCCESS         ERROR
              │             │
              ▼             ▼
           OUTPUT       ERROR PANEL
              │
              ▼
          EXPERIMENT
              │
              ▼
          EDIT AGAIN
```

---

# 44. C10 Sandbox Requirement

This is a major architectural rule.

Never execute arbitrary learner code directly inside the main application process.

The execution architecture should conceptually be:

```text
Browser
   ↓
Tutorial Playground API
   ↓
Execution Sandbox
   ↓
Isolated Runtime
   ↓
Result
   ↓
Browser
```

The sandbox should enforce:

* CPU limits
* memory limits
* execution timeout
* process isolation
* network restrictions
* filesystem restrictions
* package restrictions
* output-size limits

The exact implementation can vary by language and infrastructure.

---

# 45. C10 Security Model

Because C10 executes user-controlled code, it requires substantially stronger controls than C1–C9.

At minimum:

```text
User Code
   ↓
Validation
   ↓
Sandbox
   ↓
Resource Limits
   ↓
Execution
   ↓
Sanitized Result
```

Never allow a playground to access:

* production databases
* production secrets
* internal services
* host filesystem
* unrestricted network
* authentication credentials

---

# 46. C10 Language Support

The architecture can support:

| Language / Tool | C10 Potential |
| --------------- | ------------: |
| Python          |         ⭐⭐⭐⭐⭐ |
| JavaScript      |         ⭐⭐⭐⭐⭐ |
| TypeScript      |         ⭐⭐⭐⭐⭐ |
| SQL             |         ⭐⭐⭐⭐⭐ |
| HTML/CSS        |         ⭐⭐⭐⭐⭐ |
| NumPy           |         ⭐⭐⭐⭐⭐ |
| Pandas          |         ⭐⭐⭐⭐⭐ |
| Java            |          ⭐⭐⭐⭐ |
| C/C++           |          ⭐⭐⭐⭐ |
| Go              |          ⭐⭐⭐⭐ |
| Rust            |          ⭐⭐⭐⭐ |
| R               |          ⭐⭐⭐⭐ |
| Quantum SDKs    |          ⭐⭐⭐⭐ |

Actual support depends on the execution infrastructure.

---

# 47. C10 HTML/CSS Playground

C10 can also support frontend experiments.

Example:

```html
<h1>Hello SUIA</h1>
```

```css
h1 {
    color: #F54A8D;
}
```

Output:

```text
┌─────────────────────────────┐
│ Hello SUIA                  │
└─────────────────────────────┘
```

The architecture could provide:

```text
HTML
CSS
JS
Preview
```

as separate editor panels.

---

# 48. C10 Frontend Playground Layout

```text
┌─────────────────────────────────────────────────────────┐
│ HTML        CSS         JS                              │
│                                                         │
│ ┌──────────────────┐ ┌──────────────────┐              │
│ │ <h1>Hello</h1>   │ │ h1 {             │              │
│ │                  │ │   color: ...     │              │
│ └──────────────────┘ └──────────────────┘              │
│                                                         │
│ [ ▶ Run ]                                               │
│                                                         │
│ PREVIEW                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Hello                                               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

This remains C10 because the learner edits and executes.

---

# 49. C10 Expected Learning Cycle

The ideal learning cycle is:

```text
1. Read instruction
        ↓
2. Inspect code
        ↓
3. Predict result
        ↓
4. Run
        ↓
5. Observe output
        ↓
6. Modify code
        ↓
7. Run again
        ↓
8. Compare results
        ↓
9. Form understanding
```

This is what makes C10 more than simply an embedded editor.

---

# 50. C10 Optional Challenge

A challenge can be added:

```text
CHALLENGE

Modify the code so that it prints
the sum of only even numbers.
```

The learner then edits:

```python
numbers = [1, 2, 3, 4, 5, 6]
```

and writes the required solution.

This moves C10 toward an exercise environment.

---

# 51. C10 Optional Test Mode

For programming exercises, instead of relying only on visible output:

```text
YOUR CODE
   ↓
TEST CASES
   ↓
PASS / FAIL
```

Example:

```text
Tests

✓ Test 1
✓ Test 2
✗ Test 3

2 / 3 tests passed
```

This is useful for coding exercises.

The test cases should remain controlled and safe.

---

# 52. C10 Important Boundary

C10 can support:

```text
Interactive learning
```

but should not automatically become:

```text
Full IDE
```

The Tutorial Engine's purpose is still education.

Therefore:

```text
Tutorial context
      +
Small executable experiment
```

is preferred over:

```text
Full development environment
```

---

# 53. C10 A4 Information Density

| Component                | Recommendation |
| ------------------------ | -------------: |
| Editor                   |     5–25 lines |
| Instructions             |  1–3 sentences |
| Run                      |       Required |
| Reset                    |    Recommended |
| Output                   |       Required |
| Experiment prompt        |    Recommended |
| Input                    |       Optional |
| Hint                     |       Optional |
| Tests                    |       Optional |
| Solution                 |       Optional |
| Full IDE                 |              ❌ |
| Production system access |              ❌ |

---

# 54. C10 Best Use Cases

| Topic                        | Suitability |
| ---------------------------- | ----------: |
| Python                       |       ⭐⭐⭐⭐⭐ |
| Loops                        |       ⭐⭐⭐⭐⭐ |
| Functions                    |       ⭐⭐⭐⭐⭐ |
| Data structures              |       ⭐⭐⭐⭐⭐ |
| NumPy                        |       ⭐⭐⭐⭐⭐ |
| Pandas                       |       ⭐⭐⭐⭐⭐ |
| SQL                          |       ⭐⭐⭐⭐⭐ |
| JavaScript                   |       ⭐⭐⭐⭐⭐ |
| TypeScript                   |       ⭐⭐⭐⭐⭐ |
| HTML/CSS                     |       ⭐⭐⭐⭐⭐ |
| Algorithms                   |       ⭐⭐⭐⭐⭐ |
| Data engineering simulations |        ⭐⭐⭐⭐ |
| ML experiments               |        ⭐⭐⭐⭐ |
| API simulations              |        ⭐⭐⭐⭐ |
| Authentication simulations   |         ⭐⭐⭐ |
| Quantum computing            |        ⭐⭐⭐⭐ |

---

# 55. C10 What We Should Avoid

### ❌ Static code only

That is C1–C9.

### ❌ Only showing output

That is C4.

### ❌ Detailed walkthrough

That is C5.

### ❌ Before/after

That is C6.

### ❌ Debugging lesson

That is C7.

### ❌ Multiple static examples

That is C8.

### ❌ Static code + explanation + output

That is C9.

### ❌ Unrestricted code execution

**Never.**

### ❌ Connecting playground directly to production infrastructure

**Never.**

---

# 56. C10 Component Architecture

```text
CodeBlock
│
└── C10 Renderer
      │
      ├── Header
      │
      ├── InstructionSection
      │
      ├── Editor
      │
      ├── ControlBar
      │    ├── Run
      │    └── Reset
      │
      ├── ExecutionStatus
      │
      ├── OutputPanel
      │
      └── ExperimentPrompt
```

Execution architecture:

```text
C10 Frontend
      │
      ▼
Playground API
      │
      ▼
Execution Queue
      │
      ▼
Sandbox
      │
      ▼
Language Runtime
      │
      ▼
Result
```

---

# 57. C10 Validation Rules

| Field                |                Required |
| -------------------- | ----------------------: |
| `type`               |                       ✅ |
| `version`            |                       ✅ |
| `title`              |                       ✅ |
| `language`           |             Recommended |
| `initialCode`        |                       ✅ |
| `execution.enabled`  |                       ✅ |
| `controls.run`       |                       ✅ |
| `controls.reset`     |             Recommended |
| `instructions`       |             Recommended |
| `initialOutput`      |                Optional |
| `experiment`         |             Recommended |
| `input`              |                Optional |
| `tests`              |                Optional |
| `hints`              |                Optional |
| `solution`           |                Optional |
| `runtime`            | Implementation-specific |
| Production DB access |                       ❌ |
| Production secrets   |                       ❌ |
| Unrestricted network |                       ❌ |

---

# 58. C10 Final Technical Specification

| Area              | C10 Decision                                        |
| ----------------- | --------------------------------------------------- |
| Version           | **C10**                                             |
| Name              | **Interactive / Playground**                        |
| Main question     | **Can I modify, run, and observe the code myself?** |
| Structure         | **Editor → Run → Output**                           |
| Best for          | Hands-on learning                                   |
| Primary           | **#F54A8D**                                         |
| Secondary         | **#0B1B3D**                                         |
| Theme             | Light                                               |
| Gradient          | ❌                                                   |
| Dark theme        | ❌                                                   |
| A4                | **Portrait**                                        |
| Root              | `<section>`                                         |
| Title             | `<h2>`                                              |
| Section labels    | `<h3>`                                              |
| Instructions      | `<p>`                                               |
| Editor            | Editor component                                    |
| Run               | `<button>`                                          |
| Reset             | `<button>`                                          |
| Output            | `<output>`                                          |
| Experiment        | `<p>`                                               |
| Input             | Optional                                            |
| Hints             | Optional                                            |
| Tests             | Optional                                            |
| Solution          | Optional                                            |
| Sandbox           | **Required for arbitrary code execution**           |
| Resource limits   | **Required**                                        |
| Production access | **Forbidden**                                       |
| JSON-driven       | ✅                                                   |
| Responsive        | ✅                                                   |
| Accessible        | ✅                                                   |
| Learning level    | **Beginner → Advanced**                             |

---

# 59. C10 Final Mental Model

```text
                         C10
                          │
                          ▼
                       EDITOR
                          │
                    USER CHANGES
                          │
                          ▼
                         RUN
                          │
                  ┌───────┴───────┐
                  ▼               ▼
               SUCCESS           ERROR
                  │               │
                  ▼               ▼
                OUTPUT        ERROR MESSAGE
                  │
                  ▼
              EXPERIMENT
                  │
                  ▼
              EDIT AGAIN
                  │
                  └──────────────► RUN
```

The defining principle is:

> **C10 turns the CodeBlock from a static teaching artifact into a controlled learning environment where the learner can edit, execute, observe, and experiment with code.**

---

# 60. Complete CodeBlock Architecture — C1 to C10

We have now completed **all 10 CodeBlock versions**:

| V#      | Code Version                | Core Structure                         | Primary Purpose      |
| ------- | --------------------------- | -------------------------------------- | -------------------- |
| **C1**  | Basic Code Example          | Code → Output                          | Simple syntax        |
| **C2**  | Syntax + Explanation        | Syntax → Explanation → Code            | Understand syntax    |
| **C3**  | Annotated Code              | Code + line explanations               | Understand each line |
| **C4**  | Code + Output               | Code → Execution → Output              | Understand behavior  |
| **C5**  | Code Walkthrough            | Step 1 → Step 2 → Step 3 → Result      | Understand execution |
| **C6**  | Before / After Code         | Before → Change → After                | Refactoring/mutation |
| **C7**  | Common Mistake              | Incorrect → Problem → Correct          | Debugging            |
| **C8**  | Multiple Examples           | Example 1 → Example 2 → Example 3      | Pattern recognition  |
| **C9**  | Code + Explanation + Output | Code → Explanation → Output → Takeaway | Complete teaching    |
| **C10** | Interactive / Playground    | Editor → Run → Output                  | Hands-on learning    |

### The progression has a very deliberate learning hierarchy:

```text
C1
Show me code
   ↓
C2
Explain the syntax
   ↓
C3
Explain the lines
   ↓
C4
Show me the result
   ↓
C5
Show me the execution
   ↓
C6
Show me the transformation
   ↓
C7
Show me the mistake
   ↓
C8
Show me different patterns
   ↓
C9
Teach me the complete example
   ↓
C10
Let me experiment myself
```

So **C10 completes the CodeBlock family**.



```python

```
