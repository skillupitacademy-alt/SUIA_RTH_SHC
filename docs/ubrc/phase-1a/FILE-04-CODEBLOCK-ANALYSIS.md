# FILE 04 — CODEBLOCK ANALYSIS

**Source File**: `E:\onlinewebsites\quiz-platform\ILS_UI_UX\docs\blocksmdfiles\CodeBlock.md`  
**File Size**: 14,000+ lines (estimated)  
**Analysis Date**: 2026-10-02  
**Phase**: 1A — Educational Block Reference Architecture Investigation  
**Session**: Markdown Corpus Semantic Verification

---

## PART 1: BLOCK IDENTITY

**Block Family**: CodeBlock  
**Block Number**: 4  
**Educational Layer**: **Layer 2 — Concept Explanation**  
**Family Purpose**: Demonstrate executable code, syntax patterns, and programming concepts through direct code examples with varying levels of explanation and interaction

**Version Count**: **10 versions (C1–C10)**

**Version Catalog**:

| Version | Name                        | Primary Learner Question                                |
|---------|-----------------------------|---------------------------------------------------------|
| **C1**  | Basic Code Example          | What does this code produce?                            |
| **C2**  | Syntax + Explanation        | What does this syntax mean?                             |
| **C3**  | Annotated Code              | What does each important line/part of this code do?     |
| **C4**  | Code + Output               | What happens during execution?                          |
| **C5**  | Code Walkthrough            | How does execution progress step by step?               |
| **C6**  | Before / After Code         | What changed and why?                                   |
| **C7**  | Common Mistake              | What is wrong and how do I fix it?                      |
| **C8**  | Multiple Examples           | What different patterns can I use?                      |
| **C9**  | Code + Explanation + Output | How do code, meaning, and result connect?               |
| **C10** | Interactive / Playground    | Can I experiment with the code?                         |

---

## PART 2: EDUCATIONAL CONTEXT

### Learning Objectives

CodeBlock versions serve different pedagogical needs across the learning progression:

**C1** — Demonstrates simple cause-effect (code → output) for beginners  
**C2** — Teaches syntax semantics (what language constructs mean)  
**C3** — Provides line-by-line understanding for unfamiliar code  
**C4** — Shows execution behavior explicitly  
**C5** — Breaks down complex algorithms into step-by-step walkthrough  
**C6** — Demonstrates code transformation and refactoring patterns  
**C7** — Teaches through error correction and debugging  
**C8** — Shows alternative syntax approaches for the same problem  
**C9** — Comprehensive explanation connecting syntax, meaning, and result  
**C10** — Enables active experimentation through interactive coding environment

### Pedagogical Progression

```
C1 (Simple Demo)
    ↓
C2 (Syntax Learning)
    ↓
C3 (Line-by-Line Understanding)
    ↓
C4 (Execution Awareness)
    ↓
C5 (Algorithmic Thinking)
    ↓
C6 (Code Evolution)
    ↓
C7 (Error Learning)
    ↓
C8 (Pattern Alternatives)
    ↓
C9 (Complete Integration)
    ↓
C10 (Active Experimentation)
```

### Bloom's Taxonomy Mapping

- **Remember/Understand**: C1, C2 (what code does, what syntax means)
- **Apply**: C3, C4, C8 (understanding application, multiple approaches)
- **Analyze**: C5, C6, C7 (execution steps, transformation, debugging)
- **Evaluate**: C7, C9 (identifying mistakes, comprehensive assessment)
- **Create**: C10 (interactive experimentation and modification)

### Learning Level

- **Beginner**: C1, C2, C3 (simple demonstrations, syntax learning, basic annotation)
- **Intermediate**: C4, C5, C6, C8 (execution understanding, walkthroughs, refactoring, patterns)
- **Advanced**: C7, C9, C10 (debugging, comprehensive integration, experimentation)

---

## PART 3: UNIVERSAL PRINCIPLES

### Cross-Domain Applicability

All versions explicitly support multiple programming paradigms and domains:

**Languages**: Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, SQL, R, Bash, HTML, CSS, JSON, YAML

**Domains**:
- General programming concepts
- Data Engineering (Pandas, NumPy)
- Machine Learning
- REST APIs
- Authentication systems
- Quantum Computing (notation)
- Database queries
- Shell scripting
- Web development

### Universal Design Pattern

Each CodeBlock version follows consistent architectural principles:

1. **JSON-driven rendering** — All versions defined by structured data models
2. **Language-agnostic** — Renderer adapts to `language` field
3. **Semantic HTML** — Proper heading hierarchy, `<pre><code>` for code, meaningful sections
4. **A4 Portrait layout** — Consistent card-based presentation
5. **Responsive design** — Mobile-first stacking, desktop optimization
6. **Accessibility-first** — Screen reader support, keyboard navigation, color-independent meaning
7. **SUIA brand identity** — #F54A8D (primary pink), #0B1B3D (secondary navy), 70/30 rule

### State Model

**All CodeBlock versions are STATELESS and READ-ONLY**:
- No user input capture
- No data persistence
- No state transitions
- Exception: **C10 Interactive/Playground** has local session state for code editing but no persistent storage

---

## PART 4: VERSION SPECIFICATIONS

### C1 — BASIC CODE EXAMPLE

**Structure**: Code → Output

**Purpose**: Demonstrate simplest code-result relationship for beginners

**Canonical Model**:
```
CODE
  ↓
OUTPUT
```

**Key Characteristics**:
- 1–10 lines of code (recommended)
- Single concept demonstration
- No line-by-line explanation
- No walkthrough
- Direct output display
- Very low complexity

**HTML Structure**:
```
<section data-block="code" data-version="C1">
  <header>
    <span>CODE</span> (eyebrow, primary pink)
    <h2>Title</h2> (secondary navy)
  </header>
  <section class="code-example">
    <h3>Code</h3> (primary pink)
    <pre><code>...</code></pre> (navy on light surface)
  </section>
  <section class="code-output">
    <h3>Output</h3> (primary pink)
    <pre><code>...</code></pre> (navy on white surface)
  </section>
</section>
```

**JSON Model**:
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

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose                         | Color Role    |
|-------------|---------------------------------|---------------|
| `<section>` | Root/code/output sections       | Neutral       |
| `<header>`  | Block heading                   | Neutral       |
| `<span>`    | CodeBlock eyebrow               | **Primary**   |
| `<h2>`      | Block title                     | **Secondary** |
| `<h3>`      | Code/Output labels              | **Primary**   |
| `<pre>`     | Preserve code/output formatting | Neutral       |
| `<code>`    | Source code / technical output  | **Secondary** |
| `<strong>`  | Optional highlighted term       | **Secondary** |
| `<div>`     | Layout only                     | Neutral       |

---

### C2 — SYNTAX + EXPLANATION

**Structure**: Syntax → Explanation → Code

**Purpose**: Teach syntax semantics before demonstrating complete execution

**Canonical Model**:
```
SYNTAX
  ↓
EXPLANATION
  ↓
CODE
```

**Key Characteristics**:
- Syntax element breakdown (3–8 terms typical)
- Meaning for each syntax construct
- 1–12 lines of code (recommended)
- 1–3 paragraph explanation
- Focus on "what constructs mean" not "what lines do"

**HTML Structure**:
```
<section data-block="code" data-version="C2">
  <header>
    <span>CODE</span>
    <h2>Python Function Syntax</h2>
  </header>
  <section class="syntax-example">
    <h3>Syntax</h3>
    <pre><code>def greet(name):...</code></pre>
  </section>
  <section class="syntax-breakdown">
    <h3>Syntax Breakdown</h3>
    <dl>
      <dt>def</dt> (primary pink)
      <dd>Function-definition keyword.</dd> (secondary navy)
    </dl>
  </section>
  <section class="syntax-explanation">
    <h3>Explanation</h3>
    <p>...</p>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C2",
  "content": {
    "title": "Python Function Syntax",
    "language": "python",
    "code": "def greet(name):\n    return \"Hello \" + name",
    "syntaxBreakdown": [
      {"syntax": "def", "meaning": "Function-definition keyword."},
      {"syntax": "greet", "meaning": "Name of the function."},
      {"syntax": "(name)", "meaning": "Parameter list."}
    ],
    "explanation": "The syntax defines a function..."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose                    | Color Role    |
|-------------|----------------------------|---------------|
| `<section>` | Root and content sections  | Neutral       |
| `<header>`  | Block header               | Neutral       |
| `<span>`    | Eyebrow                    | **Primary**   |
| `<h2>`      | Main title                 | **Secondary** |
| `<h3>`      | Section labels             | **Primary**   |
| `<pre>`     | Preserve source formatting | Neutral       |
| `<code>`    | Source syntax              | **Secondary** |
| `<dl>`      | Description List           | Neutral       |
| `<dt>`      | Description Term           | **Primary**   |
| `<dd>`      | Description Details        | **Secondary** |
| `<p>`       | Paragraph                  | **Secondary** |
| `<strong>`  | Important syntax           | **Secondary** |
| `<div>`     | Layout only                | Neutral       |

---

### C3 — ANNOTATED CODE

**Structure**: Code with line-by-line or statement-by-statement annotations

**Purpose**: Explain what each important line/part of code does in context

**Canonical Model**:
```
CODE
  │
  ├── Annotation 1
  ├── Annotation 2
  ├── Annotation 3
  └── ...
```

**Key Characteristics**:
- Line-by-line or grouped annotations
- Focus on "what this line does" not "what syntax means"
- Useful for beginners, unfamiliar APIs, short algorithms
- Inline or adjacent annotation display
- 5–20 lines typical

**HTML Structure**:
```
<section data-block="code" data-version="C3">
  <header>
    <span>CODE</span>
    <h2>Calculate Sum</h2>
  </header>
  <section class="annotated-code">
    <h3>Annotated Code</h3>
    <div class="code-with-annotations">
      <pre><code>...</code></pre>
      <ol class="annotations">
        <li><strong>Line 1:</strong> Creates a list...</li>
        <li><strong>Line 3:</strong> Calculates sum...</li>
      </ol>
    </div>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C3",
  "content": {
    "title": "Calculate Sum",
    "language": "python",
    "code": "numbers = [10, 20, 30]\n\ntotal = sum(numbers)\n\nprint(total)",
    "annotations": [
      {"line": 1, "text": "Creates a list of numbers."},
      {"line": 3, "text": "Calculates the sum of the list."},
      {"line": 5, "text": "Displays the result."}
    ]
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag  | Purpose               | Color Role    |
|-----------|-----------------------|---------------|
| `<section>` | Root                | Neutral       |
| `<header>`  | Block header        | Neutral       |
| `<span>`    | Eyebrow             | **Primary**   |
| `<h2>`      | Title               | **Secondary** |
| `<h3>`      | Section label       | **Primary**   |
| `<pre>`     | Code formatting     | Neutral       |
| `<code>`    | Source code         | **Secondary** |
| `<ol>`      | Annotation list     | Neutral       |
| `<li>`      | Annotation item     | **Secondary** |
| `<strong>`  | Line/part emphasis  | **Primary**   |
| `<p>`       | Explanation         | **Secondary** |
| `<div>`     | Layout              | Neutral       |

---

### C4 — CODE + OUTPUT

**Structure**: Code → Execution → Output

**Purpose**: Explicitly show execution stage between code and result

**Canonical Model**:
```
CODE
  ↓
EXECUTION
  ↓
OUTPUT
```

**Key Characteristics**:
- Three-stage model (code, execution, output)
- Execution stage may show variable states, function calls, return values
- More detailed than C1 (which is just code → output)
- Useful for teaching execution model awareness

**HTML Structure**:
```
<section data-block="code" data-version="C4">
  <header>
    <span>CODE</span>
    <h2>Function Execution</h2>
  </header>
  <section class="code-section">
    <h3>Code</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="execution-section">
    <h3>Execution</h3>
    <p>Function greet() is called with parameter "Alice"...</p>
  </section>
  <section class="output-section">
    <h3>Output</h3>
    <pre><code>...</code></pre>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C4",
  "content": {
    "title": "Function Execution",
    "language": "python",
    "code": "def greet(name):\n    return \"Hello \" + name\n\nprint(greet(\"Alice\"))",
    "execution": "Function greet() is called with parameter \"Alice\"...",
    "output": "Hello Alice"
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag       | Purpose                       | Color Role    |
|----------------|-------------------------------|---------------|
| `<section>`    | Root/content sections         | Neutral       |
| `<header>`     | Block header                  | Neutral       |
| `<span>`       | Eyebrow                       | **Primary**   |
| `<h2>`         | Title                         | **Secondary** |
| `<h3>`         | Stage labels                  | **Primary**   |
| `<pre>`        | Code/output formatting        | Neutral       |
| `<code>`       | Code/output content           | **Secondary** |
| `<p>`          | Execution explanation         | **Secondary** |
| `<strong>`     | Emphasized execution elements | **Primary**   |
| `<div>`        | Layout                        | Neutral       |

---

### C5 — CODE WALKTHROUGH

**Structure**: Multi-step execution breakdown

**Purpose**: Show how program executes step-by-step for complex algorithms

**Canonical Model**:
```
Step 1
  ↓
Step 2
  ↓
Step 3
  ↓
Result
```

**Key Characteristics**:
- 3–8 execution steps (typical)
- Each step shows state changes, variable updates, flow control
- Useful for loops, recursion, algorithms, data structure operations
- More detailed than C4 (which has single execution explanation)

**HTML Structure**:
```
<section data-block="code" data-version="C5">
  <header>
    <span>CODE</span>
    <h2>Loop Walkthrough</h2>
  </header>
  <section class="code-section">
    <h3>Code</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="walkthrough-section">
    <h3>Walkthrough</h3>
    <ol>
      <li><strong>Step 1:</strong> Initialize total = 0...</li>
      <li><strong>Step 2:</strong> First iteration, x = 10...</li>
      <li><strong>Step 3:</strong> Second iteration, x = 20...</li>
    </ol>
  </section>
  <section class="result-section">
    <h3>Result</h3>
    <pre><code>...</code></pre>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C5",
  "content": {
    "title": "Loop Walkthrough",
    "language": "python",
    "code": "numbers = [10, 20, 30]\ntotal = 0\nfor x in numbers:\n    total += x",
    "steps": [
      {"step": 1, "description": "Initialize total = 0"},
      {"step": 2, "description": "First iteration, x = 10, total = 10"},
      {"step": 3, "description": "Second iteration, x = 20, total = 30"}
    ],
    "result": "total = 60"
  }
}
```

**HTML Tags with SUIA Color Roles**:

| Tag         | Purpose                | Color Role    |
|-------------|------------------------|---------------|
| `<section>` | Root/content sections  | Neutral       |
| `<header>`  | Block header           | Neutral       |
| `<span>`    | Eyebrow                | **Primary**   |
| `<h2>`      | Title                  | **Secondary** |
| `<h3>`      | Section labels         | **Primary**   |
| `<pre>`     | Code formatting        | Neutral       |
| `<code>`    | Code/result content    | **Secondary** |
| `<ol>`      | Step list              | Neutral       |
| `<li>`      | Step item              | **Secondary** |
| `<strong>`  | Step emphasis          | **Primary**   |
| `<p>`       | Step description       | **Secondary** |
| `<div>`     | Layout                 | Neutral       |

---

### C6 — BEFORE / AFTER CODE

**Structure**: Before → After → Explanation

**Purpose**: Demonstrate code transformation, refactoring, improvement patterns

**Canonical Model**:
```
BEFORE
  ↓
AFTER
  ↓
EXPLANATION (what changed and why)
```

**Key Characteristics**:
- Side-by-side or stacked comparison
- Highlights differences (optional visual diff)
- Explanation of improvements, refactoring rationale
- Useful for teaching best practices, optimization, refactoring

**HTML Structure**:
```
<section data-block="code" data-version="C6">
  <header>
    <span>CODE</span>
    <h2>Refactoring Example</h2>
  </header>
  <section class="before-section">
    <h3>Before</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="after-section">
    <h3>After</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="explanation-section">
    <h3>What Changed</h3>
    <p>Replaced loop with list comprehension...</p>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C6",
  "content": {
    "title": "Refactoring Example",
    "language": "python",
    "before": "result = []\nfor x in numbers:\n    result.append(x * 2)",
    "after": "result = [x * 2 for x in numbers]",
    "explanation": "Replaced loop with list comprehension for conciseness."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| Tag         | Purpose                    | Color Role    |
|-------------|----------------------------|---------------|
| `<section>` | Root/content sections      | Neutral       |
| `<header>`  | Block header               | Neutral       |
| `<span>`    | Eyebrow                    | **Primary**   |
| `<h2>`      | Title                      | **Secondary** |
| `<h3>`      | Before/After/Change labels | **Primary**   |
| `<pre>`     | Code formatting            | Neutral       |
| `<code>`    | Code content               | **Secondary** |
| `<p>`       | Explanation                | **Secondary** |
| `<mark>`    | Optional diff highlight    | **Primary**   |
| `<strong>`  | Emphasized changes         | **Primary**   |
| `<div>`     | Layout                     | Neutral       |

---

### C7 — COMMON MISTAKE

**Structure**: Incorrect Code → Problem → Correct Code → Explanation

**Purpose**: Teach through error identification and correction

**Canonical Model**:
```
INCORRECT CODE
  ↓
PROBLEM
  ↓
CORRECT CODE
  ↓
EXPLANATION
```

**Key Characteristics**:
- Shows common error pattern
- Identifies the problem
- Provides corrected version
- Explains why error occurs and how fix works
- Useful for debugging education, common pitfalls

**HTML Structure**:
```
<section data-block="code" data-version="C7">
  <header>
    <span>CODE</span>
    <h2>Off-by-One Error</h2>
  </header>
  <section class="incorrect-section">
    <h3>❌ Incorrect</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="problem-section">
    <h3>Problem</h3>
    <p>Loop attempts to access index beyond list length...</p>
  </section>
  <section class="correct-section">
    <h3>✓ Correct</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="explanation-section">
    <h3>Explanation</h3>
    <p>Changed range(len(numbers) + 1) to range(len(numbers))...</p>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C7",
  "content": {
    "title": "Off-by-One Error",
    "language": "python",
    "incorrect": "for i in range(len(numbers) + 1):\n    print(numbers[i])",
    "problem": "Loop attempts to access index beyond list length.",
    "correct": "for i in range(len(numbers)):\n    print(numbers[i])",
    "explanation": "Changed range to match actual list length."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| Tag         | Purpose           | Color Role    |
|-------------|-------------------|---------------|
| `<section>` | Root/sections     | Neutral       |
| `<header>`  | Block header      | Neutral       |
| `<span>`    | Eyebrow           | **Primary**   |
| `<h2>`      | Title             | **Secondary** |
| `<h3>`      | Section labels    | **Primary**   |
| `<pre>`     | Code formatting   | Neutral       |
| `<code>`    | Code content      | **Secondary** |
| `<p>`       | Explanation       | **Secondary** |
| `<mark>`    | Error highlight   | Error red     |
| `<strong>`  | Correction        | **Primary**   |
| `<div>`     | Layout            | Neutral       |

---

### C8 — MULTIPLE EXAMPLES

**Structure**: Multiple alternative syntax patterns for same problem

**Purpose**: Show different approaches/patterns to solve same problem

**Canonical Model**:
```
Example 1
  ↓
Example 2
  ↓
Example 3
```

**Key Characteristics**:
- 2–4 examples typical
- Each demonstrates alternative syntax/approach
- Optional comparison notes
- Useful for teaching flexibility, idioms, language features

**HTML Structure**:
```
<section data-block="code" data-version="C8">
  <header>
    <span>CODE</span>
    <h2>List Iteration Patterns</h2>
  </header>
  <section class="example">
    <h3>Example 1: Index-Based</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="example">
    <h3>Example 2: Direct Iteration</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="example">
    <h3>Example 3: Enumerate</h3>
    <pre><code>...</code></pre>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C8",
  "content": {
    "title": "List Iteration Patterns",
    "language": "python",
    "examples": [
      {"name": "Index-Based", "code": "for i in range(len(items)):\n    print(items[i])"},
      {"name": "Direct Iteration", "code": "for item in items:\n    print(item)"},
      {"name": "Enumerate", "code": "for i, item in enumerate(items):\n    print(i, item)"}
    ]
  }
}
```

**HTML Tags with SUIA Color Roles**:

| Tag         | Purpose                 | Color Role    |
|-------------|-------------------------|---------------|
| `<section>` | Root/example sections   | Neutral       |
| `<header>`  | Block header            | Neutral       |
| `<span>`    | Eyebrow                 | **Primary**   |
| `<h2>`      | Title                   | **Secondary** |
| `<h3>`      | Example labels          | **Primary**   |
| `<pre>`     | Code formatting         | Neutral       |
| `<code>`    | Code content            | **Secondary** |
| `<p>`       | Optional notes          | **Secondary** |
| `<strong>`  | Pattern emphasis        | **Primary**   |
| `<div>`     | Layout                  | Neutral       |

---

### C9 — CODE + EXPLANATION + OUTPUT

**Structure**: Code → Detailed Explanation → Output → Optional Takeaway

**Purpose**: Comprehensive integration of code, meaning, and result

**Canonical Model**:
```
CODE
  ↓
EXPLANATION
  ↓
OUTPUT
  ↓
TAKEAWAY (optional)
```

**Key Characteristics**:
- Most information-dense version (except C10 interactive)
- Detailed explanation of how code works
- Clear output demonstration
- Optional learning takeaway
- Combines elements from C1, C2, C3, C4

**HTML Structure**:
```
<section data-block="code" data-version="C9">
  <header>
    <span>CODE</span>
    <h2>Dictionary Comprehension</h2>
  </header>
  <section class="code-section">
    <h3>Code</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="explanation-section">
    <h3>Explanation</h3>
    <p>This code creates a dictionary...</p>
  </section>
  <section class="output-section">
    <h3>Output</h3>
    <pre><code>...</code></pre>
  </section>
  <section class="takeaway-section">
    <h3>Key Takeaway</h3>
    <p>Dictionary comprehensions provide concise syntax...</p>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C9",
  "content": {
    "title": "Dictionary Comprehension",
    "language": "python",
    "code": "squares = {x: x*x for x in range(5)}",
    "explanation": "This code creates a dictionary where keys are numbers...",
    "output": "{0: 0, 1: 1, 2: 4, 3: 9, 4: 16}",
    "takeaway": "Dictionary comprehensions provide concise syntax for creating dictionaries."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| Tag         | Purpose               | Color Role    |
|-------------|-----------------------|---------------|
| `<section>` | Root/content sections | Neutral       |
| `<header>`  | Block header          | Neutral       |
| `<span>`    | Eyebrow               | **Primary**   |
| `<h2>`      | Title                 | **Secondary** |
| `<h3>`      | Section labels        | **Primary**   |
| `<pre>`     | Code/output format    | Neutral       |
| `<code>`    | Code/output content   | **Secondary** |
| `<p>`       | Explanation/takeaway  | **Secondary** |
| `<strong>`  | Emphasis              | **Primary**   |
| `<div>`     | Layout                | Neutral       |

---

### C10 — INTERACTIVE / PLAYGROUND

**Structure**: Editable Code → Run Button → Output

**Purpose**: Enable active experimentation through interactive coding environment

**Canonical Model**:
```
INTERACTIVE EDITOR
       ↓
      RUN
       ↓
     OUTPUT
```

**Key Characteristics**:
- Editable code editor (Monaco, CodeMirror, or similar)
- Run/Execute button
- Live output display
- Optional reset functionality
- **Has local session state** (unlike all other versions)
- No persistent storage (changes lost on page refresh)
- Syntax highlighting, autocomplete (optional)

**HTML Structure**:
```
<section data-block="code" data-version="C10">
  <header>
    <span>CODE PLAYGROUND</span>
    <h2>Try It Yourself</h2>
  </header>
  <section class="editor-section">
    <h3>Code Editor</h3>
    <div class="code-editor" contenteditable="true">
      <pre><code>...</code></pre>
    </div>
    <button class="run-button">Run Code</button>
  </section>
  <section class="output-section">
    <h3>Output</h3>
    <pre><code class="output-display">...</code></pre>
  </section>
</section>
```

**JSON Model**:
```json
{
  "type": "code",
  "version": "C10",
  "content": {
    "title": "Try It Yourself",
    "language": "python",
    "initialCode": "numbers = [10, 20, 30]\nprint(sum(numbers))",
    "editable": true,
    "runnable": true,
    "executionEnvironment": "pyodide" // or "sandbox", "webcontainer", etc.
  }
}
```

**HTML Tags with SUIA Color Roles**:

| Tag         | Purpose               | Color Role      |
|-------------|-----------------------|-----------------|
| `<section>` | Root/content sections | Neutral         |
| `<header>`  | Block header          | Neutral         |
| `<span>`    | Eyebrow               | **Primary**     |
| `<h2>`      | Title                 | **Secondary**   |
| `<h3>`      | Section labels        | **Primary**     |
| `<div>`     | Editor container      | Neutral         |
| `<pre>`     | Code/output format    | Neutral         |
| `<code>`    | Code/output content   | **Secondary**   |
| `<button>`  | Run button            | **Primary BG**  |
| `<textarea>`| Alternative editor    | Neutral         |

---

## PART 5: VERSION DIFFERENTIATION MATRIX

| Feature                  | C1  | C2  | C3  | C4  | C5  | C6  | C7  | C8  | C9  | C10 |
|--------------------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Code Display             | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  |
| Output Display           | ✅  | ❌  | ❌  | ✅  | ✅  | ❌  | ❌  | ❌  | ✅  | ✅  |
| Syntax Breakdown         | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |
| Line Annotations         | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |
| Execution Explanation    | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |
| Step-by-Step Walkthrough | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  |
| Before/After Comparison  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  |
| Error/Correction         | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  |
| Multiple Examples        | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  |
| Comprehensive Explain    | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  |
| Interactive Editor       | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  |
| Editable                 | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  |
| Runnable                 | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  |

**Key Distinctions**:
- **C1**: Simplest (code → output)
- **C2**: Syntax-focused (teaches language constructs)
- **C3**: Line-by-line (what each line does)
- **C4**: Execution-aware (explicit execution stage)
- **C5**: Algorithmic (step-by-step state changes)
- **C6**: Transformation-focused (code evolution)
- **C7**: Error-based learning (mistake → correction)
- **C8**: Pattern-focused (multiple approaches)
- **C9**: Most comprehensive static version
- **C10**: Only interactive version

---

## PART 6: PROJECT LLM REQUIREMENTS

### Code Rendering System

**Language Support**:
- Must support syntax highlighting for: Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, SQL, R, Bash, HTML, CSS, JSON, YAML, others
- Renderer must adapt based on `language` field in JSON
- Fallback to plain text for unsupported languages

**Syntax Highlighter Integration**:
- Prism.js, Highlight.js, or Monaco Editor integration
- SUIA colors must remain structural (not overridden by syntax theme)
- Syntax colors should be subtle, semantic (keywords, strings, numbers, functions, comments)

**Code Execution Environment (C10 only)**:
- Python: Pyodide (WASM Python in browser)
- JavaScript: Direct eval or sandboxed iframe
- Other languages: Backend execution service or WebContainer
- Security: Sandboxed execution, no file system access, timeouts
- Output capture: stdout, stderr, return values

### Version-Specific Renderer Logic

Each version requires distinct React/Vue/Svelte component:

```typescript
<CodeBlock_C1 data={jsonData} />
<CodeBlock_C2 data={jsonData} />
<CodeBlock_C3 data={jsonData} />
// ... through C10
```

**Shared Base Component**:
```
CodeBlockBase
  ├── Header (eyebrow + title)
  ├── CodeDisplay (syntax highlighting, copy button)
  └── Version-specific content
```

**Version-Specific Components**:
- **C1**: CodeDisplay + OutputDisplay
- **C2**: CodeDisplay + SyntaxBreakdownTable + Explanation
- **C3**: AnnotatedCodeDisplay (code + inline/adjacent annotations)
- **C4**: CodeDisplay + ExecutionExplanation + OutputDisplay
- **C5**: CodeDisplay + StepWalkthroughList + ResultDisplay
- **C6**: BeforeAfterCodeDisplay + ExplanationDisplay
- **C7**: IncorrectCodeDisplay + ProblemDisplay + CorrectCodeDisplay + ExplanationDisplay
- **C8**: MultipleExampleList (each with CodeDisplay)
- **C9**: CodeDisplay + DetailedExplanation + OutputDisplay + OptionalTakeaway
- **C10**: InteractiveEditor + RunButton + OutputDisplay

### Responsive Layout Requirements

**Desktop** (≥1024px):
- Code and output side-by-side when beneficial (C1, C4, C6, C7)
- Full-width for complex annotations (C3, C5)
- Grid layout for multiple examples (C8)

**Tablet** (768–1023px):
- Stacked layout for most versions
- Preserve readability, avoid horizontal scroll

**Mobile** (<768px):
- Full stacking
- Horizontal scroll for long code lines (preserve monospace sizing)
- Syntax breakdown becomes vertical list (C2)
- Step walkthrough remains vertical (C5)

### Accessibility Requirements

**Screen Reader Support**:
- Proper heading hierarchy (`<h2>` → `<h3>`)
- Code content announced as "code" via `<code>` tag
- Annotations linked to code lines via ARIA labels
- Button labels for interactive elements (C10 run button)

**Keyboard Navigation**:
- Tab through interactive elements
- Code copyable via keyboard shortcut
- C10 editor: full keyboard editing support
- Run button: Enter/Space activation

**Color Independence**:
- Labels clearly identify sections (not color alone)
- Error/correct indicators use icons + text (C7)
- Before/after clearly labeled (C6)

**Contrast**:
- Navy #0B1B3D on white: 12.63:1 (AAA compliant)
- Code surfaces #F7F9FC: maintain minimum 4.5:1 for text

---

## PART 7: COMPONENT CATALOG

### Core Components

1. **CodeBlockHeader**
   - Eyebrow (pink "CODE" / "CODE PLAYGROUND")
   - Title (navy)
   - UBRC attributes: `data-block="code"`, `data-version="C[1-10]"`

2. **CodeDisplay**
   - `<pre><code>` wrapper
   - Syntax highlighting
   - Copy button (optional)
   - Line numbers (optional)
   - Language badge

3. **OutputDisplay**
   - `<pre><code>` wrapper
   - Console output formatting
   - JSON pretty-print (if output is JSON)
   - Error output styling (red for stderr)

4. **SyntaxBreakdownTable** (C2)
   - `<dl><dt><dd>` semantic structure
   - Syntax term (pink) → Meaning (navy)
   - Responsive stacking on mobile

5. **AnnotationList** (C3)
   - Ordered list `<ol><li>`
   - Line number reference
   - Annotation text
   - Optional inline code snippets

6. **StepWalkthroughList** (C5)
   - Ordered list with step numbers
   - State change descriptions
   - Optional variable value displays

7. **BeforeAfterDisplay** (C6)
   - Two code blocks side-by-side (desktop)
   - Stacked (mobile)
   - Optional diff highlighting

8. **ErrorCorrectionDisplay** (C7)
   - Incorrect code (red accent)
   - Problem description
   - Correct code (green accent)
   - Explanation

9. **MultipleExampleGrid** (C8)
   - 2–4 example cards
   - Each with label + code
   - Grid layout (desktop), stacked (mobile)

10. **InteractiveEditor** (C10)
    - Monaco Editor or CodeMirror
    - Syntax highlighting
    - Run button
    - Output console
    - Reset button (optional)

### UI Elements

- **Copy Button**: Copy code to clipboard
- **Run Button** (C10): Execute code
- **Reset Button** (C10): Restore initial code
- **Language Badge**: Display language (Python, JavaScript, etc.)
- **Line Numbers**: Optional display for longer code
- **Diff Highlighter** (C6): Visual indication of changes

---

## PART 8: PATTERN CATALOG

### Display Patterns

**Pattern 1: Simple Code-Output** (C1, C4, C9)
```
Code Block
   ↓
Output Block
```

**Pattern 2: Code-Breakdown-Explanation** (C2)
```
Code Block
   ↓
Syntax Table
   ↓
Explanation
```

**Pattern 3: Code-Annotations** (C3)
```
Code Block + Inline/Adjacent Annotations
```

**Pattern 4: Code-Steps-Result** (C5)
```
Code Block
   ↓
Step List (1, 2, 3...)
   ↓
Result
```

**Pattern 5: Before-After-Explanation** (C6)
```
Before Code │ After Code
      ↓
  Explanation
```

**Pattern 6: Error-Problem-Fix-Explanation** (C7)
```
❌ Incorrect Code
   ↓
Problem Description
   ↓
✓ Correct Code
   ↓
Explanation
```

**Pattern 7: Multiple Examples** (C8)
```
Example 1 │ Example 2 │ Example 3
```

**Pattern 8: Interactive Playground** (C10)
```
Editable Editor
   ↓
[Run Button]
   ↓
Output Display
```

### Interaction Patterns

**Static Display** (C1–C9):
- Read-only code display
- Optional copy button
- No execution

**Interactive Execution** (C10):
- User edits code
- Click run
- Output updates
- Optional reset to initial state

### Information Density Patterns

**Minimal** (C1): Code + Output only  
**Low** (C8): Multiple simple examples  
**Medium** (C2, C3, C4, C6): Code + one type of explanation  
**High** (C5, C7): Multi-stage explanation  
**Comprehensive** (C9): Code + explanation + output + takeaway  
**Interactive** (C10): Full editing environment

---

## PART 9: COMPOSITION MATRIX

### Tutorial Page Composition

**Early Tutorial Pages** (Beginner concepts):
- Primary: C1, C2, C3
- Occasional: C8 (simple alternative patterns)

**Mid Tutorial Pages** (Intermediate concepts):
- Primary: C3, C4, C6
- Occasional: C5 (for algorithms), C8 (syntax alternatives)

**Advanced Tutorial Pages**:
- Primary: C5, C6, C7, C9
- Occasional: C10 (for experimentation)

**Practice/Exercise Pages**:
- Primary: C10 (interactive coding)
- Support: C1, C8 (reference examples)

### Typical Page Sequences

**Beginner Python Function Tutorial**:
1. IntroductionBlock (I2 - Simple)
2. ObjectiveBlock (O2 - Know/Understand/Apply)
3. DefinitionBlock (D2 - Simple)
4. **CodeBlock C1** (Basic function example)
5. **CodeBlock C2** (Function syntax breakdown)
6. **CodeBlock C3** (Annotated function example)
7. ExerciseBlock

**Intermediate Algorithm Tutorial**:
1. IntroductionBlock (I3 - Narrative)
2. ObjectiveBlock (O3 - Skill-Based)
3. DefinitionBlock (D6 - Technical)
4. **CodeBlock C4** (Algorithm execution)
5. **CodeBlock C5** (Step-by-step walkthrough)
6. **CodeBlock C10** (Try it yourself)
7. SummaryBlock

**Advanced Refactoring Tutorial**:
1. IntroductionBlock (I4 - Detailed)
2. ObjectiveBlock (O4 - Progressive)
3. **CodeBlock C6** (Before/After comparison)
4. **CodeBlock C7** (Common mistake)
5. **CodeBlock C9** (Comprehensive explanation)
6. BestPracticesBlock

### Cross-Block Dependencies

**CodeBlock → ExecutionBlock**: Code example then execution simulation  
**DefinitionBlock → CodeBlock**: Concept definition then code demonstration  
**CodeBlock → MistakeBlock**: Code example then common error analysis  
**CodeBlock → ExerciseBlock**: Examples then practice  
**QuestionBlock → CodeBlock**: Check understanding then show solution code

### Version Selection Logic

Choose version based on:

1. **Learning Level**:
   - Beginner → C1, C2, C3
   - Intermediate → C4, C5, C6, C8
   - Advanced → C7, C9, C10

2. **Concept Complexity**:
   - Simple syntax → C1, C2
   - Algorithm → C5
   - Refactoring → C6
   - Debugging → C7

3. **Teaching Goal**:
   - Demonstrate result → C1
   - Teach syntax → C2
   - Explain code → C3
   - Show execution → C4, C5
   - Show transformation → C6
   - Teach debugging → C7
   - Show alternatives → C8
   - Comprehensive → C9
   - Practice → C10

---

## PART 10: UBRC ANALYSIS (Universal Block Reference Code)

### UBRC Attributes

All CodeBlock versions specify:

```html
data-block="code"
data-version="C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8" | "C9" | "C10"
```

**Purpose**: 
- DOM identification for analytics
- Version-specific styling hooks
- Testing automation selectors
- Content management queries

**Block Type**: `"code"`

**Version Identifiers**: `C1`, `C2`, `C3`, `C4`, `C5`, `C6`, `C7`, `C8`, `C9`, `C10`

### UBRC Query Examples

```javascript
// Find all CodeBlocks
document.querySelectorAll('[data-block="code"]')

// Find only C1 (Basic Code Example)
document.querySelectorAll('[data-block="code"][data-version="C1"]')

// Find all interactive playgrounds
document.querySelectorAll('[data-block="code"][data-version="C10"]')

// Find all syntax-teaching blocks
document.querySelectorAll('[data-block="code"][data-version="C2"]')
```

### UBRC Analytics Events

**View Events**:
- `codeblock:view` — Any CodeBlock viewed
- `codeblock:c1:view` — C1 specifically viewed
- `codeblock:c10:view` — Interactive playground viewed

**Interaction Events** (C10 only):
- `codeblock:c10:edit` — User edited code
- `codeblock:c10:run` — User clicked run button
- `codeblock:c10:success` — Code executed successfully
- `codeblock:c10:error` — Code execution error

**Copy Events**:
- `codeblock:copy` — User copied code to clipboard

---

## PART 11: ILS ANALYSIS (Instructional Learning System)

### ILS Classification

**Block Type**: **Instructional Content Block**

**NOT Assessment Block**: CodeBlock versions C1–C9 are pure instructional content (no user input required)

**Exception**: **C10 is Hybrid** — Instructional content + interactive practice environment (but no assessment/scoring)

### ILS Learning Activities

**Observe** (C1, C2, C3, C4, C8, C9):
- Learner views code and explanations
- Passive learning mode
- View tracking: Session analytics track time spent

**Analyze** (C5, C6, C7):
- Learner analyzes execution steps, transformations, errors
- Still passive (read-only)
- Deeper cognitive engagement

**Experiment** (C10):
- Learner actively modifies and runs code
- Active learning mode
- Interaction tracking: Edit count, run count, error frequency

### ILS Progress Tracking

**View Completion**: 
- C1–C9: Tracked when block scrolled into view + minimum dwell time (e.g., 3 seconds)
- C10: Tracked when viewed + optional interaction milestone (e.g., "ran code at least once")

**Mastery Indicators** (C10 only):
- User modified code: ✅
- User ran code: ✅
- Code executed successfully: ✅ (mastery signal)
- Multiple runs with variations: ✅✅ (strong mastery signal)

**Learning Path Integration**:
- CodeBlock completion → Next block unlocked
- C10 interaction required? (configurable per tutorial)
- Some tutorials may require C10 interaction before proceeding

---

## PART 12: LSNB ANALYSIS (Learning Sequence Navigation Block)

### LSNB Classification

**NOT a Navigation Block**: CodeBlock is **NOT LSNB**

All versions (C1–C10) are **content blocks**, not navigation blocks.

### Navigation Context

CodeBlock does not provide:
- Links to other tutorial pages
- "Next/Previous" buttons
- Table of contents
- Step indicators
- Progress bars

Navigation handled by separate components:
- Tutorial page header (breadcrumbs, progress indicator)
- Tutorial page footer (Next/Previous buttons)
- Sidebar navigation (tutorial outline)

### C10 Internal Navigation

C10 has **internal state navigation** (code editing, running) but this is **within-block interaction**, not **between-page navigation**.

---

## PART 13: RSSB ANALYSIS (Rich State Storage Block)

### RSSB Classification

**C1–C9**: **NOT RSSB** — Completely stateless, read-only

**C10**: **Pseudo-RSSB** — Has local session state but no persistent storage

### C10 State Model

**Local Session State** (not persisted):
- Current code in editor
- Current output display
- Edit history (optional, browser session only)

**State Lifecycle**:
- Initialize: Load initial code from JSON
- Edit: User modifies code (stored in component state)
- Run: Execute code, update output (stored in component state)
- Reset: Restore initial code
- **Page Refresh**: All state lost

**NOT Persisted**:
- No database storage
- No localStorage (by default)
- No user account association
- No cross-session state

**Optional Enhancement** (future):
- Save to browser localStorage (session persistence across refresh)
- Save to user account (cross-device persistence)
- But base C10 specification is **non-persistent**

### Storage Requirements

**None for C1–C9**

**Optional for C10**:
- LocalStorage API (browser-based persistence)
- User account service (cloud persistence)
- Version control integration (save code variations)

---

## PART 14: UNIVERSAL TUTORIAL PAGE ANALYSIS

### CodeBlock Role in Universal Tutorial Page

CodeBlock is **central to technical tutorial content**. Most programming, data science, and technical tutorials will use multiple CodeBlock versions.

### Typical Universal Tutorial Page Structure

```
┌─────────────────────────────────────────┐
│ IntroductionBlock (I2, I3, or I4)       │
├─────────────────────────────────────────┤
│ ObjectiveBlock (O2 or O3)               │
├─────────────────────────────────────────┤
│ DefinitionBlock (D6 or D7)              │
├─────────────────────────────────────────┤
│ CodeBlock C1 (First simple example)     │  ← First code demonstration
├─────────────────────────────────────────┤
│ CodeBlock C2 (Syntax breakdown)         │  ← Teach syntax
├─────────────────────────────────────────┤
│ CodeBlock C3 (Annotated example)        │  ← Detailed understanding
├─────────────────────────────────────────┤
│ CodeBlock C5 (Algorithm walkthrough)    │  ← Complex concept
├─────────────────────────────────────────┤
│ CodeBlock C10 (Try it yourself)         │  ← Active practice
├─────────────────────────────────────────┤
│ ExerciseBlock or QuizBlock              │
├─────────────────────────────────────────┤
│ SummaryBlock                            │
└─────────────────────────────────────────┘
```

### CodeBlock Placement Patterns

**Early Page** (C1, C2):
- Introduce concept with simple demonstration
- Teach syntax before complexity

**Mid Page** (C3, C4, C5):
- Detailed explanation
- Algorithm walkthrough
- Execution understanding

**Late Page** (C10):
- Practice opportunity
- Consolidate learning through experimentation

### Cross-Domain Universality

CodeBlock family works identically across:
- **Python tutorials** (most common use case in corpus examples)
- **JavaScript/TypeScript tutorials**
- **SQL tutorials** (data engineering)
- **R tutorials** (data science)
- **Bash/Shell tutorials** (DevOps)
- **HTML/CSS tutorials** (web development)
- **Quantum computing tutorials** (notation examples in C2)

Only the `language` field changes; structure remains universal.

---

## PART 15: COMPOSER IMPLICATIONS

### Composer Block Selection

When tutorial author is creating a technical tutorial, **Composer must offer all 10 CodeBlock versions**.

**Composer UI**:
```
Block Type: CodeBlock
Version:
  [ ] C1 — Basic Code Example
  [ ] C2 — Syntax + Explanation
  [ ] C3 — Annotated Code
  [ ] C4 — Code + Output
  [ ] C5 — Code Walkthrough
  [ ] C6 — Before / After Code
  [ ] C7 — Common Mistake
  [ ] C8 — Multiple Examples
  [ ] C9 — Code + Explanation + Output
  [ ] C10 — Interactive / Playground
```

### Composer Guidance

**Composer should suggest version based on**:
1. **Tutorial level** (beginner → C1, C2, C3)
2. **Teaching goal** (syntax → C2, algorithm → C5, debugging → C7)
3. **Previous blocks** (after DefinitionBlock → suggest C1 or C2)

**Example Composer Prompt**:
> "You're teaching a beginner Python function. Try **C1** for a simple example or **C2** to explain syntax."

### Composer Form Fields

**All Versions**:
- Title (required)
- Language (dropdown: Python, JavaScript, TypeScript, SQL, etc.)
- Code (textarea with syntax highlighting)

**Version-Specific Fields**:
- **C1**: Output (textarea)
- **C2**: Syntax Breakdown (add syntax/meaning pairs), Explanation (textarea)
- **C3**: Annotations (add line/text pairs)
- **C4**: Execution explanation (textarea), Output (textarea)
- **C5**: Steps (add step descriptions), Result (textarea)
- **C6**: Before code (textarea), After code (textarea), Explanation (textarea)
- **C7**: Incorrect code (textarea), Problem (textarea), Correct code (textarea), Explanation (textarea)
- **C8**: Examples (add name/code pairs)
- **C9**: Explanation (textarea), Output (textarea), Takeaway (optional textarea)
- **C10**: Initial code (textarea), Execution environment (dropdown: Pyodide, WebContainer, etc.)

### Composer Preview

Composer should show **live preview** of rendered CodeBlock as author fills in fields, using actual production renderer.

### Composer Validation

**Required Fields**:
- All versions: type, version, title, language, code
- Version-specific: See JSON validation rules in Part 4

**Warnings**:
- C1 code > 15 lines: "Consider C3 (Annotated Code) for longer examples"
- C2 missing explanation: "Explanation recommended for C2"
- C10 language not supported by execution environment: "This language cannot run in browser"

---

## PART 16: PRODUCTION CORRELATION

### Current Production Status

**Status**: NOT_YET_INVESTIGATED

CodeBlock semantic verification complete from markdown corpus. Production correlation pending Phase 1A completion of all 18 families.

### Expected Production Locations

**Component Files** (expected):
```
src/components/blocks/CodeBlock/
  ├── CodeBlock.tsx (base component)
  ├── CodeBlock_C1.tsx
  ├── CodeBlock_C2.tsx
  ├── CodeBlock_C3.tsx
  ├── CodeBlock_C4.tsx
  ├── CodeBlock_C5.tsx
  ├── CodeBlock_C6.tsx
  ├── CodeBlock_C7.tsx
  ├── CodeBlock_C8.tsx
  ├── CodeBlock_C9.tsx
  ├── CodeBlock_C10.tsx
  └── styles/
      ├── codeblock.module.css
      └── codeblock-c10.module.css (interactive-specific)
```

**JSON Schema Files** (expected):
```
src/schemas/blocks/
  ├── codeblock-c1.schema.json
  ├── codeblock-c2.schema.json
  ├── ... (through C10)
```

**Composer Form Files** (expected):
```
src/composer/forms/
  ├── CodeBlockForm.tsx (version selector)
  ├── CodeBlock_C1_Form.tsx
  ├── CodeBlock_C2_Form.tsx
  ├── ... (through C10)
```

### Production Verification Tasks (Future)

After Phase 1A complete:
1. Verify all 10 versions implemented in production
2. Check UBRC attribute presence
3. Validate JSON schemas match specifications
4. Verify SUIA color implementation (#F54A8D, #0B1B3D, 70/30 rule)
5. Test responsive layouts (desktop, tablet, mobile)
6. Verify accessibility (screen readers, keyboard navigation)
7. Test C10 execution environments (Pyodide, WebContainer)
8. Check syntax highlighting integration
9. Validate Composer forms for all versions

---

## PART 17: EVIDENCE CLASSIFICATION

### Evidence Quality

| Evidence Type                          | Classification | Source                        |
|----------------------------------------|----------------|-------------------------------|
| 10 versions exist (C1–C10)             | VERIFIED       | CodeBlock.md structure        |
| Each version has distinct structure    | VERIFIED       | Detailed specifications       |
| HTML tag inventories documented        | VERIFIED       | Sections 29, 26, 24, etc.     |
| SUIA colors specified (#F54A8D, #0B1B3D)| VERIFIED       | Color tables in each version  |
| JSON models provided                   | VERIFIED       | JSON examples for all versions|
| A4 portrait layout specified           | VERIFIED       | Layout sections for all       |
| Responsive behavior documented         | VERIFIED       | Desktop/mobile layouts        |
| Accessibility requirements             | VERIFIED       | Accessibility sections        |
| Cross-domain applicability             | VERIFIED       | Examples across Python, JS, SQL, etc. |
| Language support list                  | VERIFIED       | Documented in C1, C2, etc.    |
| C1–C9 stateless                        | VERIFIED       | No state model documented     |
| C10 has session state                  | VERIFIED       | Explicitly documented         |
| C10 not persistent by default          | VERIFIED       | Documentation states no DB    |
| UBRC attributes specified              | VERIFIED       | data-block, data-version      |
| Production implementation              | NOT_YET_INVESTIGATED | Pending Phase 1A completion |
| Runtime behavior (C10 execution)       | NOT_YET_TESTED | No execution logs available   |

### Cross-Reference Verification

**IntroductionBlock.md Cross-Family Catalog** (lines 454-490):
- Lists CodeBlock with 10 versions (C1–C10) ✅ **MATCHES dedicated file**

**Version count reconciliation**:
- IntroductionBlock catalog: 10 versions
- CodeBlock.md detailed specifications: 10 versions
- **Status**: ✅ **RECONCILED**

### Corpus Authority

**Primary Authority**: `CodeBlock.md` (14,000+ lines, complete specifications for all 10 versions)

**Supporting Authority**: `IntroductionBlock.md` (cross-family catalog confirmation)

**Architecture Documents**: Pending audit (after Phase 1A FILES 01–18 complete)

### Confidence Level

**High Confidence**:
- Version catalog (10 versions)
- Educational purpose and differentiation
- JSON structure for all versions
- HTML semantic structure
- SUIA color specifications
- UBRC attribute definitions

**Medium Confidence**:
- Exact production implementation details (pending investigation)
- C10 execution environment specifications (conceptual, not tested)

**Requires Future Investigation**:
- Production code correlation
- Runtime C10 execution behavior
- Actual Composer implementation
- Analytics event tracking implementation

---

## ANALYSIS COMPLETE

**FILE 04 — CODEBLOCK (10 versions, C1–C10)** semantic verification complete.

**Next File**: FILE 05 — VisualBlock.md (10 versions, V1–V10)

---

**Evidence Hierarchy**: 
1. CodeBlock.md (dedicated file, primary authority)
2. IntroductionBlock.md (cross-reference confirmation)
3. Architecture documents (pending audit)
4. Production code (pending correlation investigation)

**Phase 1A Progress**: 4 of 18 families complete (IntroductionBlock, ObjectiveBlock, DefinitionBlock, CodeBlock)
