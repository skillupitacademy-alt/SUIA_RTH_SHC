# FILE 06 — COMPARISONBLOCK ANALYSIS

**Source File**: `E:\onlinewebsites\quiz-platform\ILS_UI_UX\docs\blocksmdfiles\ComparisonBlock.md`  
**File Size**: 9,308 lines  
**Analysis Date**: 2026-10-02  
**Phase**: 1A — Educational Block Reference Architecture Investigation  
**Session**: Markdown Corpus Semantic Verification

---

## PART 1: BLOCK IDENTITY

**Block Family**: ComparisonBlock  
**Block Number**: 6  
**Educational Layer**: **Layer 2 — Concept Explanation**  
**Family Purpose**: Help learners understand differences, similarities, and decision criteria between related concepts through structured comparison formats

**Version Count**: **7 versions (CP1–CP7)**

**CORPUS vs CATALOG RECONCILIATION**: IntroductionBlock cross-family catalog lists ComparisonBlock with 8 versions (CP1–CP8). Actual corpus contains **7 versions (CP1–CP7)** with no CP8 documentation found. Status: **Version count mismatch identified** — requires reconciliation.

**Version Catalog**:

| Version  | Name                        | Primary Learner Question                                                  |
|----------|-----------------------------|---------------------------------------------------------------------------|
| **CP1**  | Side-by-Side Comparison     | How are A and B different when I look at them side by side?              |
| **CP2**  | Feature Comparison Table    | How do A and B compare across many specific features or attributes?       |
| **CP3**  | Similarities vs Differences | What do A and B have in common, and what makes them different?            |
| **CP4**  | When to Use A vs B          | When should I choose A, and when should I choose B?                       |
| **CP5**  | Advantages vs Limitations   | What are the strengths and weaknesses of A compared to B?                 |
| **CP6**  | Decision Tree               | Which option should I choose based on a series of decision criteria?      |
| **CP7**  | Selection Matrix            | How do multiple options compare across multiple evaluation criteria?      |

---

## PART 2: EDUCATIONAL CONTEXT

### Learning Objectives

ComparisonBlock versions progress from simple differentiation to complex decision-making:

**CP1** — Basic side-by-side comparison (2 concepts, 3-6 dimensions, visual differentiation)  
**CP2** — Detailed feature comparison table (2+ concepts, many attributes, reference format)  
**CP3** — Explicit similarities and differences (what's common vs what's unique)  
**CP4** — Decision guidance (when to use which option, context-based selection)  
**CP5** — Strengths/weaknesses analysis (advantages vs limitations, trade-off awareness)  
**CP6** — Decision tree navigation (sequential decision criteria, guided selection path)  
**CP7** — Multi-criteria evaluation matrix (multiple options vs multiple criteria)

### Pedagogical Progression

```
CP1 (Visual Differentiation)
    ↓
CP2 (Detailed Feature Comparison)
    ↓
CP3 (Commonalities vs Differences)
    ↓
CP4 (Usage Decision Guidance)
    ↓
CP5 (Trade-off Analysis)
    ↓
CP6 (Decision Tree Logic)
    ↓
CP7 (Multi-Criteria Evaluation)
```

### Bloom's Taxonomy Mapping

- **Remember/Understand**: CP1, CP2 (identify differences, understand features)
- **Understand/Analyze**: CP3 (recognize similarities and differences)
- **Apply**: CP4 (choose appropriate option for specific context)
- **Analyze/Evaluate**: CP5, CP7 (evaluate trade-offs, assess multiple criteria)
- **Evaluate**: CP6 (make structured decisions through decision logic)

### Learning Level

- **Beginner**: CP1, CP2, CP3 (understand differences, identify features, see commonalities)
- **Intermediate**: CP4, CP5 (make basic decisions, understand trade-offs)
- **Advanced**: CP6, CP7 (navigate complex decisions, evaluate multi-criteria options)

---

## PART 3: UNIVERSAL PRINCIPLES

### Cross-Domain Applicability

All versions explicitly support comparison across technical domains:

**Programming Concepts**:
- Python (List vs Tuple, mutable vs immutable)
- OOP (Class vs Object, inheritance vs composition)
- JavaScript (var vs let vs const, == vs ===)
- Data structures (Stack vs Queue, Array vs Linked List)
- Execution models (Synchronous vs Asynchronous, compile-time vs runtime)

**Technical Domains**:
- NumPy vs Pandas (array operations vs data analysis)
- Data Science vs Data Engineering (insight extraction vs infrastructure)
- SQL vs NoSQL (relational vs non-relational)
- Authentication vs Authorization (identity vs permissions)
- Full-stack Development (frontend vs backend, monolith vs microservices)
- Cyber Security (preventive vs detective controls, symmetric vs asymmetric encryption)
- Cloud Architecture (IaaS vs PaaS vs SaaS)
- Machine Learning (supervised vs unsupervised, regression vs classification)
- Quantum Computing (gate-based vs quantum annealing)

### Universal Design Pattern

Each ComparisonBlock version follows consistent architectural principles:

1. **JSON-driven rendering** — Comparison structure defined by data models
2. **Domain-agnostic** — Same structure works for Python, databases, security, quantum, etc.
3. **Semantic HTML** — `<table>`, `<article>`, `<aside>`, proper heading hierarchy
4. **A4 Portrait layout** — Optimized for learning-card presentation
5. **Responsive design** — Side-by-side on desktop, stacked on mobile
6. **Accessibility-first** — Semantic tables with proper scope, screen reader support
7. **SUIA brand identity** — #F54A8D (primary pink), #0B1B3D (secondary navy), 70/30 rule
8. **Equal visual weight** — Both/all options presented objectively without bias

### State Model

**All ComparisonBlock versions are STATELESS and READ-ONLY**:
- No user input capture
- No data persistence
- No state transitions
- No interactive selection (CP6 decision tree is presentational, not interactive)
- Pure instructional content presentation

---

## PART 4: VERSION SPECIFICATIONS

### CP1 — SIDE-BY-SIDE COMPARISON

**Structure**: Concept A → Concept B → Parallel attributes → Key distinction

**Purpose**: Present two related concepts side-by-side for direct visual comparison

**Canonical Model**:
```
┌──────────────┐     ┌──────────────┐
│   Concept A  │ VS  │   Concept B  │
│  Attributes  │     │  Attributes  │
└──────────────┘     └──────────────┘
        ↓
   KEY DISTINCTION
```

**Key Characteristics**:
- Exactly 2 concepts
- 3-6 comparison dimensions (recommended)
- Side-by-side visual panels
- Parallel structure (both sides use same dimensions)
- Key distinction statement (required)
- Low information density (beginner-friendly)

**HTML Structure**:
```html
<section data-block="comparison" data-version="CP1">
  <header>
    <span>COMPARISON</span> (eyebrow, primary pink)
    <h2>Python List vs Tuple</h2> (secondary navy)
  </header>
  <div class="comparison-panels">
    <article>
      <h3>List</h3>
      <ul>
        <li>Mutable</li>
        <li>Uses []</li>
        <li>Can be modified</li>
      </ul>
    </article>
    <div class="comparison-divider">VS</div>
    <article>
      <h3>Tuple</h3>
      <ul>
        <li>Immutable</li>
        <li>Uses ()</li>
        <li>Cannot be modified</li>
      </ul>
    </article>
  </div>
  <table class="comparison-table">
    <thead>
      <tr>
        <th scope="col">Attribute</th>
        <th scope="col">List</th>
        <th scope="col">Tuple</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Mutability</th>
        <td>Mutable</td>
        <td>Immutable</td>
      </tr>
    </tbody>
  </table>
  <aside class="comparison-key-distinction">
    <h3>Key Distinction</h3>
    <p>Lists can be modified after creation, while tuples cannot be modified in place.</p>
  </aside>
</section>
```

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP1",
  "content": {
    "title": "Python List vs Tuple",
    "left": {
      "title": "List",
      "points": ["Mutable", "Uses []", "Can be modified"]
    },
    "right": {
      "title": "Tuple",
      "points": ["Immutable", "Uses ()", "Cannot be modified in place"]
    },
    "comparison": [
      {"attribute": "Mutability", "left": "Mutable", "right": "Immutable"},
      {"attribute": "Syntax", "left": "[]", "right": "()"}
    ],
    "keyDistinction": {
      "title": "Key Distinction",
      "text": "Lists can be modified after creation, while tuples cannot be modified in place."
    }
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose                   | Color Role    |
|-------------|---------------------------|---------------|
| `<section>` | Root ComparisonBlock      | Neutral       |
| `<header>`  | Block header              | Neutral       |
| `<span>`    | COMPARISON eyebrow        | **Primary**   |
| `<h2>`      | Main title                | **Secondary** |
| `<div>`     | Comparison layout         | Neutral       |
| `<article>` | Concept A/B panel         | Neutral       |
| `<h3>`      | Concept name              | **Secondary** |
| `<ul>`/`<li>`| Concept characteristics | **Secondary** |
| `<table>`   | Detailed comparison       | Neutral       |
| `<thead>`   | Table header              | **Secondary** |
| `<th>`      | Comparison dimension      | **Secondary** |
| `<tbody>`   | Comparison body           | Neutral       |
| `<td>`      | Comparison value          | **Secondary** |
| `<aside>`   | Key distinction           | Neutral       |
| `<p>`       | Key distinction text      | **Secondary** |
| `<strong>`  | Important term            | **Secondary** |

---

### CP2 — FEATURE COMPARISON TABLE

**Structure**: Multiple concepts → Many attributes → Detailed comparison table

**Purpose**: Provide detailed feature-by-feature comparison across multiple concepts

**Canonical Model**:
```
┌─────────────┬──────────┬──────────┬──────────┐
│ Attribute   │ Option A │ Option B │ Option C │
├─────────────┼──────────┼──────────┼──────────┤
│ Feature 1   │ Value    │ Value    │ Value    │
│ Feature 2   │ Value    │ Value    │ Value    │
│ Feature 3   │ Value    │ Value    │ Value    │
│ ...         │ ...      │ ...      │ ...      │
└─────────────┴──────────┴──────────┴──────────┘
```

**Key Characteristics**:
- 2-4 concepts typical
- 8-15 comparison attributes (many features)
- Table format (not side-by-side panels)
- Reference/lookup purpose
- Higher information density than CP1
- No key distinction required (table is self-explanatory)

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP2",
  "content": {
    "title": "Python Data Structures Comparison",
    "options": ["List", "Tuple", "Set", "Dictionary"],
    "attributes": [
      {
        "name": "Mutability",
        "values": {"List": "Mutable", "Tuple": "Immutable", "Set": "Mutable", "Dictionary": "Mutable"}
      },
      {
        "name": "Syntax",
        "values": {"List": "[]", "Tuple": "()", "Set": "{}", "Dictionary": "{}"}
      },
      {
        "name": "Duplicates",
        "values": {"List": "Allowed", "Tuple": "Allowed", "Set": "Not allowed", "Dictionary": "Keys unique"}
      }
    ]
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag     | Purpose              | Color Role    |
|--------------|----------------------|---------------|
| `<section>`  | Root block           | Neutral       |
| `<header>`   | Block header         | Neutral       |
| `<span>`     | Eyebrow              | **Primary**   |
| `<h2>`       | Title                | **Secondary** |
| `<table>`    | Comparison table     | Neutral       |
| `<thead>`    | Table header         | **Secondary** |
| `<th>`       | Column headers       | **Secondary** |
| `<tbody>`    | Table body           | Neutral       |
| `<tr>`       | Table row            | Neutral       |
| `<th scope>` | Attribute name       | **Primary**   |
| `<td>`       | Comparison value     | **Secondary** |
| `<strong>`   | Emphasis             | **Secondary** |
| `<code>`     | Technical syntax     | **Secondary** |

---

### CP3 — SIMILARITIES VS DIFFERENCES

**Structure**: Similarities → Differences → Conclusion

**Purpose**: Explicitly highlight what concepts have in common vs what makes them different

**Canonical Model**:
```
SIMILARITIES
  ↓
What A and B share
  ↓
DIFFERENCES
  ↓
What distinguishes A from B
  ↓
CONCLUSION
```

**Key Characteristics**:
- Two-part structure (similarities first, then differences)
- Emphasizes commonalities before distinctions
- 3-6 similarities typical
- 3-6 differences typical
- Optional conclusion/summary
- Useful when learners overemphasize differences and miss commonalities

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP3",
  "content": {
    "title": "List vs Tuple",
    "similarities": [
      "Both are ordered sequences",
      "Both support indexing and slicing",
      "Both can contain any data type",
      "Both support iteration"
    ],
    "differences": [
      {
        "aspect": "Mutability",
        "conceptA": "List is mutable",
        "conceptB": "Tuple is immutable"
      },
      {
        "aspect": "Syntax",
        "conceptA": "Uses []",
        "conceptB": "Uses ()"
      },
      {
        "aspect": "Methods",
        "conceptA": "More modification methods",
        "conceptB": "Fewer methods"
      }
    ],
    "conclusion": "Lists and tuples are both sequences but differ fundamentally in mutability."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose              | Color Role    |
|-------------|----------------------|---------------|
| `<section>` | Root block           | Neutral       |
| `<header>`  | Block header         | Neutral       |
| `<span>`    | Eyebrow              | **Primary**   |
| `<h2>`      | Title                | **Secondary** |
| `<section>` | Similarities section | Neutral       |
| `<h3>`      | Similarities heading | **Primary**   |
| `<ul>`/`<li>`| Similarity list    | **Secondary** |
| `<section>` | Differences section  | Neutral       |
| `<h3>`      | Differences heading  | **Primary**   |
| `<dl>`      | Difference list      | Neutral       |
| `<dt>`      | Difference aspect    | **Primary**   |
| `<dd>`      | Difference detail    | **Secondary** |
| `<aside>`   | Conclusion           | Neutral       |
| `<p>`       | Conclusion text      | **Secondary** |

---

### CP4 — WHEN TO USE A VS B

**Structure**: Option A use cases → Option B use cases → Decision criteria → Examples

**Purpose**: Provide decision guidance on when to choose which option

**Canonical Model**:
```
OPTION A
  ↓
Use when: [context A]
  ↓
OPTION B
  ↓
Use when: [context B]
  ↓
DECISION CRITERIA
  ↓
EXAMPLES
```

**Key Characteristics**:
- Decision-oriented (not just descriptive)
- "When to use" explicit guidance
- Context-based selection criteria
- Real-world example scenarios
- 2 options typical (can be 3-4)
- More actionable than CP1-CP3

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP4",
  "content": {
    "title": "When to Use List vs Tuple",
    "options": [
      {
        "name": "List",
        "useWhen": [
          "Data needs to change during program execution",
          "Adding or removing elements is required",
          "Building dynamic collections"
        ],
        "examples": ["Shopping cart items", "Task queue", "Dynamic configuration"]
      },
      {
        "name": "Tuple",
        "useWhen": [
          "Data should remain constant",
          "Representing fixed structure (like coordinates)",
          "Using as dictionary keys (immutable requirement)"
        ],
        "examples": ["RGB color (255, 128, 0)", "Geographic coordinates", "Database record"]
      }
    ],
    "decisionCriteria": "Choose based on whether the collection needs to be modified after creation."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose               | Color Role    |
|-------------|-----------------------|---------------|
| `<section>` | Root block            | Neutral       |
| `<header>`  | Block header          | Neutral       |
| `<span>`    | Eyebrow               | **Primary**   |
| `<h2>`      | Title                 | **Secondary** |
| `<article>` | Option section        | Neutral       |
| `<h3>`      | Option name           | **Primary**   |
| `<section>` | Use-when section      | Neutral       |
| `<h4>`      | "When to Use" heading | **Primary**   |
| `<ul>`/`<li>`| Use cases           | **Secondary** |
| `<section>` | Examples section      | Neutral       |
| `<h4>`      | Examples heading      | **Primary**   |
| `<ul>`/`<li>`| Example list        | **Secondary** |
| `<aside>`   | Decision criteria     | Neutral       |
| `<p>`       | Criteria text         | **Secondary** |

---

### CP5 — ADVANTAGES VS LIMITATIONS

**Structure**: Concept → Advantages → Limitations → Trade-off summary

**Purpose**: Help learner understand strengths and weaknesses of each option

**Canonical Model**:
```
OPTION A
  ↓
Advantages
  ↓
Limitations
  ↓
OPTION B
  ↓
Advantages
  ↓
Limitations
  ↓
TRADE-OFF SUMMARY
```

**Key Characteristics**:
- Explicit advantages/limitations sections
- Balanced presentation (not just advantages)
- Trade-off awareness
- 3-5 advantages typical per option
- 3-5 limitations typical per option
- Trade-off summary helps learner understand compromises

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP5",
  "content": {
    "title": "Monolithic vs Microservices Architecture",
    "options": [
      {
        "name": "Monolithic",
        "advantages": [
          "Simpler to develop initially",
          "Easier to test end-to-end",
          "Simpler deployment",
          "Lower operational complexity"
        ],
        "limitations": [
          "Harder to scale specific components",
          "Tight coupling between modules",
          "Longer deployment cycles as app grows",
          "Technology stack locked in"
        ]
      },
      {
        "name": "Microservices",
        "advantages": [
          "Independent scaling of services",
          "Technology flexibility per service",
          "Fault isolation",
          "Independent deployment"
        ],
        "limitations": [
          "Higher operational complexity",
          "Distributed system challenges",
          "More complex testing",
          "Network latency overhead"
        ]
      }
    ],
    "tradeoffSummary": "Monolithic architecture offers simplicity at the cost of flexibility; microservices offer scalability and flexibility at the cost of complexity."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose                 | Color Role    |
|-------------|-------------------------|---------------|
| `<section>` | Root block              | Neutral       |
| `<header>`  | Block header            | Neutral       |
| `<span>`    | Eyebrow                 | **Primary**   |
| `<h2>`      | Title                   | **Secondary** |
| `<article>` | Option section          | Neutral       |
| `<h3>`      | Option name             | **Primary**   |
| `<section>` | Advantages section      | Neutral       |
| `<h4>`      | Advantages heading      | **Primary**   |
| `<ul>`/`<li>`| Advantage list        | **Secondary** |
| `<section>` | Limitations section     | Neutral       |
| `<h4>`      | Limitations heading     | **Primary**   |
| `<ul>`/`<li>`| Limitation list       | **Secondary** |
| `<aside>`   | Trade-off summary       | Neutral       |
| `<h3>`      | Summary heading         | **Primary**   |
| `<p>`       | Summary text            | **Secondary** |

---

### CP6 — DECISION TREE

**Structure**: Decision question → Branch criteria → Options → Recommendations

**Purpose**: Guide learner through sequential decision logic to reach appropriate choice

**Canonical Model**:
```
START
  ↓
Question 1?
  ├─ Yes → Question 2?
  │         ├─ Yes → Option A
  │         └─ No → Option B
  └─ No → Question 3?
            ├─ Yes → Option C
            └─ No → Option D
```

**Key Characteristics**:
- Sequential decision structure
- Binary or multiple-choice branches at each node
- Guided navigation from problem to solution
- 2-4 decision levels typical
- 3-6 final outcomes typical
- Visual tree representation
- More complex decision logic than CP4

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP6",
  "content": {
    "title": "Choose Python Data Structure",
    "decisionTree": {
      "root": {
        "question": "Do you need key-value pairs?",
        "branches": [
          {
            "condition": "Yes",
            "next": {
              "question": "Are keys guaranteed unique?",
              "branches": [
                {"condition": "Yes", "result": "Use Dictionary"},
                {"condition": "No", "result": "Use List of Tuples"}
              ]
            }
          },
          {
            "condition": "No",
            "next": {
              "question": "Do you need unique elements only?",
              "branches": [
                {"condition": "Yes", "result": "Use Set"},
                {
                  "condition": "No",
                  "next": {
                    "question": "Will the collection change?",
                    "branches": [
                      {"condition": "Yes", "result": "Use List"},
                      {"condition": "No", "result": "Use Tuple"}
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag    | Purpose                 | Color Role    |
|-------------|-------------------------|---------------|
| `<section>` | Root block              | Neutral       |
| `<header>`  | Block header            | Neutral       |
| `<span>`    | Eyebrow                 | **Primary**   |
| `<h2>`      | Title                   | **Secondary** |
| `<div>`     | Tree container          | Neutral       |
| `<section>` | Decision node           | Neutral       |
| `<h3>`      | Decision question       | **Primary**   |
| `<ul>`/`<li>`| Branch list           | **Secondary** |
| `<div>`     | Branch connector        | **Primary**   |
| `<article>` | Result/recommendation   | Neutral       |
| `<h4>`      | Result heading          | **Primary**   |
| `<p>`       | Result description      | **Secondary** |
| `<strong>`  | Emphasis                | **Secondary** |

---

### CP7 — SELECTION MATRIX

**Structure**: Multiple options × Multiple criteria → Evaluation matrix → Recommendation guidance

**Purpose**: Compare multiple options across multiple evaluation criteria for complex decisions

**Canonical Model**:
```
┌──────────────┬─────────┬─────────┬─────────┬─────────┐
│ Criterion    │ Option A│ Option B│ Option C│ Option D│
├──────────────┼─────────┼─────────┼─────────┼─────────┤
│ Criterion 1  │ Rating  │ Rating  │ Rating  │ Rating  │
│ Criterion 2  │ Rating  │ Rating  │ Rating  │ Rating  │
│ Criterion 3  │ Rating  │ Rating  │ Rating  │ Rating  │
│ ...          │ ...     │ ...     │ ...     │ ...     │
└──────────────┴─────────┴─────────┴─────────┴─────────┘
        ↓
RECOMMENDATION GUIDANCE
```

**Key Characteristics**:
- 3-5 options typical
- 4-8 evaluation criteria typical
- Matrix/table format
- Qualitative ratings (High/Medium/Low, Excellent/Good/Limited, etc.)
- Or quantitative ratings (1-5 scale, ✓/~/✕ symbols)
- Optional recommendation guidance
- Most complex ComparisonBlock version
- Decision-support tool

**JSON Model**:
```json
{
  "type": "comparison",
  "version": "CP7",
  "content": {
    "title": "Machine Learning Algorithm Selection",
    "options": ["Linear Regression", "Decision Tree", "Random Forest", "Neural Network"],
    "criteria": [
      {
        "name": "Interpretability",
        "ratings": {
          "Linear Regression": "High",
          "Decision Tree": "High",
          "Random Forest": "Moderate",
          "Neural Network": "Low"
        }
      },
      {
        "name": "Nonlinear Patterns",
        "ratings": {
          "Linear Regression": "Limited",
          "Decision Tree": "Strong",
          "Random Forest": "Strong",
          "Neural Network": "Excellent"
        }
      },
      {
        "name": "Training Complexity",
        "ratings": {
          "Linear Regression": "Low",
          "Decision Tree": "Low-Medium",
          "Random Forest": "Medium",
          "Neural Network": "High"
        }
      },
      {
        "name": "Overfitting Risk",
        "ratings": {
          "Linear Regression": "Lower",
          "Decision Tree": "High",
          "Random Forest": "Moderate",
          "Neural Network": "High"
        }
      }
    ],
    "recommendationGuidance": "Choose based on problem requirements: Linear Regression for interpretability, Random Forest for general-purpose strong performance, Neural Network for complex patterns with sufficient data."
  }
}
```

**HTML Tags with SUIA Color Roles**:

| HTML Tag     | Purpose                  | Color Role    |
|--------------|--------------------------|---------------|
| `<section>`  | Root block               | Neutral       |
| `<header>`   | Block header             | Neutral       |
| `<span>`     | Eyebrow                  | **Primary**   |
| `<h2>`       | Title                    | **Secondary** |
| `<table>`    | Selection matrix         | Neutral       |
| `<thead>`    | Table header             | **Secondary** |
| `<th>`       | Criterion/option headers | **Secondary** |
| `<tbody>`    | Matrix body              | Neutral       |
| `<tr>`       | Matrix row               | Neutral       |
| `<th scope>` | Criterion name           | **Primary**   |
| `<td>`       | Rating cell              | **Secondary** |
| `<aside>`    | Recommendation guidance  | Neutral       |
| `<h3>`       | Guidance heading         | **Primary**   |
| `<p>`        | Guidance text            | **Secondary** |
| `<strong>`   | Emphasis                 | **Secondary** |

---

## PART 5: VERSION DIFFERENTIATION MATRIX

| Feature                    | CP1 | CP2 | CP3 | CP4 | CP5 | CP6 | CP7 |
|----------------------------|-----|-----|-----|-----|-----|-----|-----|
| Number of Options          | 2   | 2-4 | 2   | 2-4 | 2-4 | 3-6 | 3-5 |
| Comparison Dimensions      | 3-6 | 8-15| 6-12| N/A | N/A | N/A | 4-8 |
| Side-by-Side Layout        | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |
| Table Format               | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ✅  |
| Key Distinction            | ✅  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  |
| Similarities Section       | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  |
| Differences Section        | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  |
| "When to Use" Guidance     | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  |
| Examples                   | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  |
| Advantages/Limitations     | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  |
| Trade-off Summary          | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  |
| Decision Tree Logic        | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  |
| Multi-Criteria Matrix      | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  |
| Recommendation Guidance    | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  |
| Information Density        | Low | Med | Med | Med | Med | High| High|
| Decision Support           | Low | Low | Low | Med | Med | High| High|
| Complexity                 | Low | Low | Med | Med | Med | High| High|

**Key Distinctions**:
- **CP1**: Simplest, side-by-side visual comparison
- **CP2**: Detailed feature table for reference
- **CP3**: Explicit similarities and differences
- **CP4**: Decision guidance (when to use which)
- **CP5**: Trade-off analysis (advantages vs limitations)
- **CP6**: Sequential decision tree logic
- **CP7**: Most complex, multi-criteria evaluation matrix

---

## PART 6: PROJECT LLM REQUIREMENTS

### Comparison Rendering System

**Layout Requirements**:
- Side-by-side panels (CP1)
- Responsive table rendering (CP2, CP7)
- Collapsible sections for mobile (all versions)
- Visual tree rendering (CP6)
- Equal visual weight for all options (no bias)

**Component Architecture**:

```typescript
<ComparisonBlock_CP1 data={jsonData} />
<ComparisonBlock_CP2 data={jsonData} />
<ComparisonBlock_CP3 data={jsonData} />
<ComparisonBlock_CP4 data={jsonData} />
<ComparisonBlock_CP5 data={jsonData} />
<ComparisonBlock_CP6 data={jsonData} />
<ComparisonBlock_CP7 data={jsonData} />
```

**Shared Base Component**:
```
ComparisonBlockBase
  ├── Header (eyebrow + title)
  ├── OptionsDisplay (concepts being compared)
  └── Version-specific content
```

**Version-Specific Components**:
- **CP1**: SideBySidePanels + ComparisonTable + KeyDistinction
- **CP2**: DetailedFeatureTable
- **CP3**: SimilaritiesList + DifferencesList + Conclusion
- **CP4**: WhenToUseCards + DecisionCriteria + Examples
- **CP5**: AdvantagesLimitationsList + TradeoffSummary
- **CP6**: DecisionTreeVisualization + BranchNavigation
- **CP7**: SelectionMatrix + RecommendationGuidance

### Responsive Layout Requirements

**Desktop** (≥1024px):
- CP1: Side-by-side panels
- CP2, CP7: Full table width
- CP3-CP5: Two-column where beneficial
- CP6: Horizontal tree layout

**Tablet** (768–1023px):
- CP1: Narrower side-by-side or stacked
- CP2, CP7: Scrollable tables
- CP6: Condensed tree

**Mobile** (<768px):
- All versions: Stacked layout
- Tables: Horizontal scroll or card-based transformation
- CP6: Vertical tree or accordion format

### Accessibility Requirements

**Table Semantics**:
- Proper `<th scope="col">` and `<th scope="row">`
- Caption for complex tables
- Summary for CP7 matrix

**Screen Reader Support**:
- Concept names announced clearly
- Comparison dimensions identified
- Table relationships understandable
- Decision tree navigation logical

**Color Independence**:
- Both/all options styled equally (no color bias)
- Ratings/values understandable without color
- Icons + text (not color alone) for emphasis

---

## PART 7: COMPONENT CATALOG

### Core Components

1. **ComparisonBlockHeader**
   - Eyebrow (pink "COMPARISON")
   - Title (navy)
   - UBRC attributes: `data-block="comparison"`, `data-version="CP[1-7]"`

2. **SideBySidePanels** (CP1)
   - Two `<article>` elements
   - Visual divider ("VS")
   - Equal width/height
   - Parallel structure

3. **ComparisonTable** (CP1, CP2, CP7)
   - Semantic `<table>` with proper headers
   - Responsive (scrollable or transformed)
   - Highlight header row/column

4. **KeyDistinctionAside** (CP1, CP3)
   - `<aside>` semantic element
   - Prominent visual styling
   - 1-2 sentence summary

5. **SimilaritiesList** (CP3)
   - `<ul><li>` structure
   - 3-6 items typical
   - Emphasizes commonalities

6. **DifferencesList** (CP3)
   - `<dl><dt><dd>` structure
   - Aspect + details per option
   - 3-6 differences typical

7. **WhenToUseCard** (CP4)
   - Per-option guidance
   - Use case scenarios
   - Example applications

8. **AdvantagesLimitationsList** (CP5)
   - Two sections per option
   - Balanced presentation
   - 3-5 items each

9. **DecisionTreeVisualization** (CP6)
   - Visual tree structure
   - Interactive highlighting (optional)
   - Branch connectors
   - Question nodes + result nodes

10. **SelectionMatrix** (CP7)
    - Multi-row, multi-column table
    - Criterion rows, option columns
    - Rating cells
    - Visual rating indicators

---

## PART 8: PATTERN CATALOG

### Display Patterns

**Pattern 1: Parallel Comparison** (CP1)
```
Option A │ Option B
   ↓
Direct visual comparison
```

**Pattern 2: Feature Table** (CP2)
```
Row = Feature
Column = Option
Cell = Value
```

**Pattern 3: Common-Then-Different** (CP3)
```
Similarities First
   ↓
Differences Second
```

**Pattern 4: Context-Based Selection** (CP4)
```
If [context A] → Use Option A
If [context B] → Use Option B
```

**Pattern 5: Strength-Weakness Analysis** (CP5)
```
Option A: ✓ Advantages, ✕ Limitations
Option B: ✓ Advantages, ✕ Limitations
```

**Pattern 6: Sequential Decision Logic** (CP6)
```
Question → Branch → Question → Result
```

**Pattern 7: Multi-Criteria Evaluation** (CP7)
```
Options × Criteria = Ratings Matrix
```

---

## PART 9: COMPOSITION MATRIX

### Tutorial Page Composition

**Early Tutorial Pages** (Beginner concepts):
- Primary: CP1, CP2
- Occasional: CP3

**Mid Tutorial Pages** (Intermediate concepts):
- Primary: CP3, CP4
- Occasional: CP5

**Advanced Tutorial Pages**:
- Primary: CP5, CP6, CP7
- Support: CP1 (for quick reference)

### Typical Page Sequences

**Beginner Tutorial — Data Structures**:
1. IntroductionBlock
2. ObjectiveBlock
3. DefinitionBlock (List)
4. DefinitionBlock (Tuple)
5. **ComparisonBlock CP1** (List vs Tuple side-by-side)
6. CodeBlock C1 (examples)
7. ExerciseBlock

**Intermediate Tutorial — Architecture**:
1. IntroductionBlock
2. ObjectiveBlock
3. VisualBlock V2 (Monolithic architecture)
4. VisualBlock V2 (Microservices architecture)
5. **ComparisonBlock CP5** (Advantages vs Limitations)
6. **ComparisonBlock CP4** (When to use which)
7. ProjectBlock

**Advanced Tutorial — Algorithm Selection**:
1. IntroductionBlock
2. ObjectiveBlock
3. Multiple DefinitionBlocks (algorithms)
4. **ComparisonBlock CP7** (Selection matrix)
5. **ComparisonBlock CP6** (Decision tree)
6. CodeBlock C9
7. TaskBlock

### Cross-Block Dependencies

**DefinitionBlock → ComparisonBlock**: Define concepts individually, then compare  
**VisualBlock → ComparisonBlock**: Visualize each, then compare differences  
**ComparisonBlock → CodeBlock**: Show differences conceptually, then in code  
**ComparisonBlock CP6 → ExerciseBlock**: Decision tree guidance then practice  
**ComparisonBlock CP7 → ProjectBlock**: Evaluation criteria then apply to project

---

## PART 10: UBRC ANALYSIS (Universal Block Reference Code)

### UBRC Attributes

All ComparisonBlock versions specify:

```html
data-block="comparison"
data-version="CP1" | "CP2" | "CP3" | "CP4" | "CP5" | "CP6" | "CP7"
```

**Block Type**: `"comparison"`

**Version Identifiers**: `CP1`, `CP2`, `CP3`, `CP4`, `CP5`, `CP6`, `CP7`

### UBRC Analytics Events

**View Events**:
- `comparisonblock:view`
- `comparisonblock:cp1:view`
- `comparisonblock:cp7:view`

**Interaction Events**:
- None (all versions static)

---

## PART 11: ILS ANALYSIS (Instructional Learning System)

### ILS Classification

**Block Type**: **Instructional Content Block**

All versions are pure instructional content (no assessment)

**Learning Activities**:
- **Observe**: CP1, CP2, CP3
- **Analyze**: CP4, CP5
- **Evaluate**: CP6, CP7

---

## PART 12: LSNB ANALYSIS

**NOT a Navigation Block**: ComparisonBlock is **NOT LSNB**

All versions are content blocks.

---

## PART 13: RSSB ANALYSIS

**ALL Versions: NOT RSSB** — Completely stateless, read-only

---

## PART 14: UNIVERSAL TUTORIAL PAGE ANALYSIS

ComparisonBlock is essential for teaching differences, trade-offs, and decision-making across all technical domains.

---

## PART 15: COMPOSER IMPLICATIONS

Composer should offer all 7 ComparisonBlock versions with version-appropriate form fields.

---

## PART 16: PRODUCTION CORRELATION

**Status**: NOT_YET_INVESTIGATED

---

## PART 17: EVIDENCE CLASSIFICATION

| Evidence Type                            | Classification           | Source                    |
|------------------------------------------|--------------------------|---------------------------|
| 7 versions exist (CP1–CP7)               | VERIFIED                 | ComparisonBlock.md        |
| CP8 missing (catalog lists 8)            | ANOMALY_DETECTED         | Corpus has 7, not 8       |
| Each version distinct structure          | VERIFIED                 | Detailed specifications   |
| HTML tags documented                     | VERIFIED                 | Tag tables per version    |
| SUIA colors specified                    | VERIFIED                 | Color tables per version  |
| JSON models provided                     | VERIFIED                 | JSON examples all versions|
| All versions stateless                   | VERIFIED                 | No state documented       |
| UBRC attributes specified                | VERIFIED                 | data-block, data-version  |

**Cross-Reference Verification**:
- IntroductionBlock catalog: Claims 8 versions (CP1–CP8)
- ComparisonBlock.md: Contains 7 versions (CP1–CP7)
- **Status**: ⚠️ **VERSION COUNT MISMATCH** — CP8 missing from corpus

---

## ANALYSIS COMPLETE

**FILE 06 — COMPARISONBLOCK (7 versions, CP1–CP7)** semantic verification complete with **CP8 missing** (catalog claims 8, corpus has 7).

**Next File**: FILE 07 — ExecutionBlock.md (expected 8 versions, E1–E8)

**Phase 1A Progress**: 6 of 18 families complete

**Anomaly Log**: 
- V4 documentation gap in VisualBlock
- CP8 missing from ComparisonBlock (catalog/corpus mismatch)
