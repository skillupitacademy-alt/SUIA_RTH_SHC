Absolutely. We have completed **all C1–C10 versions of CodeBlock**, so we now move to the **next tutorial block**.

# BLOCK 5 — VisualBlock

We will follow the same approach we used for the previous blocks:

> **One version at a time, with full explanation, HTML tags, tag-by-tag SUIA color assignment, information structure, JSON structure, A4 portrait layout, responsive behavior, use cases across different technical fields, and validation rules.**

The first version is:

# V1 — Basic Visual

| Item                  | VisualBlock V1                               |
| --------------------- | -------------------------------------------- |
| **Version**           | **V1**                                       |
| **Name**              | **Basic Visual**                             |
| **Structure**         | Visual → Caption / Explanation               |
| **Primary purpose**   | Introduce a concept visually                 |
| **Best for**          | Diagrams, architecture, flows, relationships |
| **Learning question** | **“What does this concept look like?”**      |
| **Complexity**        | Beginner → Intermediate                      |
| **SUIA Primary**      | **#F54A8D**                                  |
| **SUIA Secondary**    | **#0B1B3D**                                  |
| **Theme**             | Light                                        |
| **Gradient**          | ❌                                            |
| **Dark theme**        | ❌                                            |
| **A4**                | Portrait                                     |

---

# 1. What is VisualBlock V1?

VisualBlock V1 is the **simplest visual representation** of a technical concept.

Its purpose is not to explain every detail.

Its purpose is:

> **Show the learner a visual representation of the concept and provide enough context to understand what they are looking at.**

The basic structure is:

```text
┌──────────────────────────────────────┐
│ VISUAL                               │
│                                      │
│ Concept Title                        │
│                                      │
│        ┌───────────────┐             │
│        │   Concept     │             │
│        └───────────────┘             │
│               │                      │
│               ▼                      │
│        ┌───────────────┐             │
│        │   Result      │             │
│        └───────────────┘             │
│                                      │
│ Caption / Explanation                │
└──────────────────────────────────────┘
```

---

# 2. Why V1 is needed

A DefinitionBlock explains **what something is**.

A CodeBlock demonstrates **how something works through code**.

A VisualBlock shows:

> **How the concept is structured or connected visually.**

For example, when teaching:

### Authentication

Text can say:

> Authentication verifies the identity of a user.

But a visual can immediately communicate:

```text
User
 ↓
Credentials
 ↓
Authentication
 ↓
Identity
```

The learner sees the relationship before reading a large explanation.

---

# 3. VisualBlock V1 Learning Model

```text
TEXT
 ↓
VISUAL
 ↓
RECOGNITION
 ↓
UNDERSTANDING
```

The visual is therefore a **cognitive compression mechanism**.

Instead of requiring the learner to mentally construct the relationship, the tutorial presents the relationship directly.

---

# 4. V1 Canonical Structure

The canonical structure is:

```text
Visual
   ↓
Caption
   ↓
Short Explanation
```

More precisely:

```text
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ [Title]                                      │
│                                              │
│              VISUAL CONTENT                  │
│                                              │
│ [Caption]                                    │
│                                              │
│ Short explanation                            │
└──────────────────────────────────────────────┘
```

---

# 5. V1 Example — Full-Stack Development

Concept:

> Client–Server Architecture

Visual:

```text
┌───────────────┐
│    Browser    │
└───────┬───────┘
        │
        │ HTTP
        ▼
┌───────────────┐
│   Web Server  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Database    │
└───────────────┘
```

Caption:

> A client communicates with the server, which retrieves or modifies data in the database.

This is exactly the type of content V1 is designed for.

---

# 6. V1 Example — Data Science

Concept:

> Machine Learning Pipeline

```text
Raw Data
   ↓
Preprocessing
   ↓
Training
   ↓
Model
   ↓
Prediction
```

Caption:

> A machine-learning workflow transforms raw data into a trained model that can generate predictions.

Again, the visual communicates the overall structure without requiring a detailed explanation.

---

# 7. V1 Example — Data Engineering

Concept:

> ETL

```text
┌────────────┐
│   Source   │
└─────┬──────┘
      ↓
┌────────────┐
│  Extract   │
└─────┬──────┘
      ↓
┌────────────┐
│ Transform  │
└─────┬──────┘
      ↓
┌────────────┐
│    Load    │
└────────────┘
```

Caption:

> ETL extracts data from a source, transforms it, and loads it into a destination system.

---

# 8. V1 Example — Cyber Security

Concept:

> Basic Security Boundary

```text
Internet
    │
    ▼
┌──────────────┐
│   Firewall   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Application  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Database   │
└──────────────┘
```

Caption:

> A firewall can act as a security boundary between an external network and internal application resources.

---

# 9. V1 Example — Ethical Hacking

For ethical-hacking education, V1 can show a **conceptual security workflow**:

```text
Scope
  ↓
Reconnaissance
  ↓
Assessment
  ↓
Finding
  ↓
Report
```

Caption:

> A controlled security assessment progresses from defined scope through assessment and reporting.

The visual should remain educational and authorized rather than providing operational attack instructions.

---

# 10. V1 Example — Quantum Computing

Concept:

> Qubit Measurement

```text
┌──────────┐
│  Qubit   │
│          │
│   |ψ⟩    │
└────┬─────┘
     │
     ▼
 Measurement
     │
     ▼
Classical Result
```

Caption:

> Measurement converts quantum information into a classical measurement result.

---

# 11. V1 Example — Python

Concept:

> Function Call

```text
┌─────────────────────┐
│  function definition│
└──────────┬──────────┘
           │
           ▼
      function call
           │
           ▼
         result
```

Caption:

> A function is defined once and can later be invoked to execute its reusable logic.

---

# 12. V1 Example — NumPy

Concept:

> Vectorized Operation

```text
Array A
[1  2  3]
     │
     │ × 2
     ▼
[2  4  6]
```

Caption:

> NumPy can apply an arithmetic operation element by element across an array.

---

# 13. V1 Example — Pandas

Concept:

> DataFrame Structure

```text
┌────────┬───────┬───────┐
│ Name   │ Age   │ Score │
├────────┼───────┼───────┤
│ Alice  │ 25    │ 90    │
│ Bob    │ 28    │ 85    │
│ Carol  │ 24    │ 95    │
└────────┴───────┴───────┘
```

Caption:

> A Pandas DataFrame represents structured tabular data using rows and columns.

---

# 14. V1 Example — OOP

Concept:

> Class → Objects

```text
          Class
            │
      ┌─────┴─────┐
      ▼           ▼
   Object 1     Object 2
```

Caption:

> A class defines a structure and behavior from which objects can be created.

---

# 15. V1 Example — API

Concept:

> API Request/Response

```text
Client
  │
  │ Request
  ▼
API Server
  │
  │ Response
  ▼
Client
```

Caption:

> A client sends a request to an API and receives a response.

---

# 16. V1 Example — Database

Concept:

> Application → Database

```text
Application
     │
     │ Query
     ▼
  Database
     │
     │ Result
     ▼
Application
```

Caption:

> An application communicates with a database by sending queries and receiving results.

---

# 17. What makes V1 different from later Visual versions?

V1 intentionally remains simple.

It does **not** attempt to include:

* multiple visual layers
* detailed annotations
* interactive diagrams
* step-by-step visual walkthroughs
* comparisons
* complex architectural maps
* visual + code combinations

Those capabilities can belong to later VisualBlock versions.

The principle is:

> **V1 should communicate one visual idea clearly.**

---

# 18. V1 Visual Complexity

Recommended:

```text
1 primary visual
+
1 caption
+
1 short explanation
```

Avoid:

```text
10 diagrams
20 labels
15 arrows
multiple unrelated concepts
```

That creates cognitive overload.

---

# 19. V1 A4 Portrait Layout

This is particularly important based on your earlier requirement that the tutorial visual should be designed as a **proper A4 portrait learning page**, rather than a small card.

Recommended layout:

```text
┌──────────────────────────────────────────────┐
│                                              │
│ VISUAL                                       │
│                                              │
│ Client–Server Architecture                   │
│                                              │
│                                              │
│          ┌─────────────────────┐             │
│          │      Browser        │             │
│          └──────────┬──────────┘             │
│                     │                        │
│                     ▼                        │
│          ┌─────────────────────┐             │
│          │      Web Server     │             │
│          └──────────┬──────────┘             │
│                     │                        │
│                     ▼                        │
│          ┌─────────────────────┐             │
│          │      Database       │             │
│          └─────────────────────┘             │
│                                              │
│ Caption                                      │
│                                              │
│ A client communicates with the server,       │
│ which interacts with the database.           │
│                                              │
└──────────────────────────────────────────────┘
```

The diagram should occupy the **major visual area** of the A4 page.

---

# 20. V1 A4 Design Principle

The visual should **not** look like:

```text
┌──────────────┐
│ tiny card    │
└──────────────┘
```

Instead:

```text
A4 Portrait
│
├── Block Header
│
├── Visual Title
│
├── Large Visual Canvas
│
├── Caption
│
└── Short Explanation
```

The diagram itself is the hero of the block.

---

# 21. V1 Visual Canvas

Recommended canvas:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              VISUAL MODEL                    │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

Use a very light neutral background rather than filling the canvas with pink.

---

# 22. SUIA Color Strategy

The established SUIA colors remain:

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

### Primary Pink — #F54A8D

Use selectively for:

* `VISUAL` eyebrow
* active/highlighted node
* important relationship
* key arrow
* selected concept
* visual emphasis

### Secondary Navy — #0B1B3D

Use for:

* title
* diagram labels
* node borders
* primary text
* structural lines
* captions

---

# 23. 70/30 Rule

For V1:

```text
≈ 70%
White / light neutral / navy

≈ 30%
Pink emphasis
```

For example:

```text
          NAVY NODE
              │
              │
              ▼
       ┌─────────────┐
       │   PINK      │
       │  HIGHLIGHT  │
       └─────────────┘
```

Do **not** make the complete diagram pink.

---

# 24. V1 HTML Semantic Structure

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <figure>
│    ├── Visual
│    └── <figcaption>
│
└── <p>
```

This is semantically appropriate because the main content is a visual figure with a caption.

---

# 25. HTML Tags Used in V1

| HTML Tag       | Purpose           | Color       |
| -------------- | ----------------- | ----------- |
| `<section>`    | Root block        | Neutral     |
| `<header>`     | Block header      | Neutral     |
| `<span>`       | VISUAL eyebrow    | **#F54A8D** |
| `<h2>`         | Visual title      | **#0B1B3D** |
| `<figure>`     | Main visual       | Neutral     |
| `<figcaption>` | Visual caption    | **#0B1B3D** |
| `<p>`          | Explanation       | **#0B1B3D** |
| `<strong>`     | Important concept | **#0B1B3D** |

If the visual is rendered as SVG:

```text
<svg>
<g>
<rect>
<line>
<path>
<text>
```

can be used inside the visual renderer.

---

# 26. SVG Color Strategy

For a diagram rendered as SVG:

| SVG Element          | Color                 |
| -------------------- | --------------------- |
| Structural rectangle | **#0B1B3D** border    |
| Main text            | **#0B1B3D**           |
| Normal arrow         | **#0B1B3D**           |
| Highlighted node     | **#F54A8D**           |
| Highlighted arrow    | **#F54A8D**           |
| Canvas               | White / light neutral |

This maintains the 70/30 rule.

---

# 27. Complete V1 HTML

```html
<section
    class="tutorial-block visual-block visual-v1"
    data-block="visual"
    data-version="V1"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Client–Server Architecture
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="visual-canvas"
            role="img"
            aria-label="Client server architecture diagram"
        >

            <!-- Visual renderer / SVG goes here -->

        </div>

        <figcaption class="visual-caption">

            Client–Server Communication

        </figcaption>

    </figure>


    <p class="visual-explanation">

        A client communicates with the server,
        which can retrieve or modify data in
        the database.

    </p>

</section>
```

---

# 28. V1 JSON Structure

The JSON should describe the visual rather than hardcode its rendering.

```json
{
  "type": "visual",
  "version": "V1",

  "content": {
    "title": "Client–Server Architecture",

    "visual": {
      "type": "diagram",
      "ariaLabel": "Client server architecture diagram"
    },

    "caption": "Client–Server Communication",

    "explanation": "A client communicates with the server, which can retrieve or modify data in the database."
  }
}
```

---

# 29. V1 JSON — SVG-Based Example

If the Tutorial Engine stores SVG directly:

```json
{
  "type": "visual",
  "version": "V1",

  "content": {
    "title": "Client–Server Architecture",

    "visual": {
      "type": "svg",

      "svg": "<svg viewBox=\"0 0 800 600\">...</svg>",

      "ariaLabel": "Client server architecture diagram"
    },

    "caption": "Client–Server Communication",

    "explanation": "A client communicates with the server, which can retrieve or modify data in the database."
  }
}
```

The actual implementation can later choose whether visuals are stored as:

* SVG
* image URL
* generated asset
* diagram definition
* structured diagram JSON

without changing the conceptual V1 structure.

---

# 30. V1 Structured Diagram JSON

For a Tutorial Engine, a structured diagram representation is often more powerful than storing a finished image.

For example:

```json
{
  "type": "visual",
  "version": "V1",

  "content": {
    "title": "Client–Server Architecture",

    "visual": {
      "type": "flow",

      "nodes": [
        {
          "id": "client",
          "label": "Browser"
        },
        {
          "id": "server",
          "label": "Web Server"
        },
        {
          "id": "database",
          "label": "Database"
        }
      ],

      "connections": [
        {
          "from": "client",
          "to": "server",
          "label": "HTTP"
        },
        {
          "from": "server",
          "to": "database",
          "label": "Query"
        }
      ]
    },

    "caption": "Client–Server Communication",

    "explanation": "A client communicates with the server, which interacts with the database."
  }
}
```

This is particularly useful if your Tutorial Engine eventually needs reusable diagram rendering.

---

# 31. V1 Visual Types

V1 can support several visual forms.

| Visual Type  | Example                          |
| ------------ | -------------------------------- |
| Flow         | A → B → C                        |
| Hierarchy    | Parent → Child                   |
| Relationship | A ↔ B                            |
| Architecture | Client → Server → DB             |
| Process      | Step 1 → Step 2                  |
| Structure    | Class / object                   |
| Table        | Rows / columns                   |
| Pipeline     | Source → Transform → Destination |
| Concept map  | Concept relationships            |
| State        | State A → State B                |

---

# 32. V1 Information Rule

The visual should represent:

> **One primary concept.**

For example:

### Good

```text
Authentication
   ↓
Identity
```

### Bad

```text
Authentication
Authorization
Database
Caching
API
Microservices
Deployment
Monitoring
```

That is too much for V1.

---

# 33. V1 Caption

The caption answers:

> **“What am I looking at?”**

Example:

```text
Client–Server Communication
```

Not:

> A client is a software application that communicates with servers...

That belongs in the explanation.

---

# 34. V1 Explanation

The explanation answers:

> **“What does this visual mean?”**

Recommended:

```text
A client sends requests to a server,
which processes the request and interacts
with the database when necessary.
```

Keep it short.

---

# 35. V1 Accessibility

Every visual needs meaningful alternative text.

For example:

```html
<div
    role="img"
    aria-label="Browser communicates with a web server,
    which communicates with a database."
>
```

If SVG:

```html
<svg
    role="img"
    aria-labelledby="visual-title visual-description"
>
```

This is important because the visual itself cannot be assumed to be accessible to every learner.

---

# 36. V1 Responsive Behavior

Desktop:

```text
Large visual canvas
```

Tablet:

```text
Medium visual canvas
```

Mobile:

```text
Full-width visual
```

The visual should scale while preserving its aspect ratio.

Do not allow:

```text
tiny labels
```

to become unreadable.

If necessary, the renderer should simplify or reflow the visual on smaller screens.

---

# 37. V1 Mobile Layout

```text
┌─────────────────────────────┐
│ VISUAL                      │
│                             │
│ Client–Server Architecture  │
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │      Browser            │ │
│ │         ↓               │ │
│ │      Server             │ │
│ │         ↓               │ │
│ │      Database           │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Caption                     │
│                             │
│ Short explanation.           │
└─────────────────────────────┘
```

---

# 38. V1 Desktop Layout

```text
┌──────────────────────────────────────────────────────────┐
│ VISUAL                                                   │
│                                                          │
│ Client–Server Architecture                              │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │                     Browser                          │ │
│ │                        │                             │ │
│ │                        ▼                             │ │
│ │                    Web Server                        │ │
│ │                        │                             │ │
│ │                        ▼                             │ │
│ │                     Database                         │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Client–Server Communication                              │
│                                                          │
│ A client communicates with the server, which interacts   │
│ with the database.                                      │
└──────────────────────────────────────────────────────────┘
```

---

# 39. V1 Recommended Visual Dimensions

For an A4 portrait tutorial page, the visual canvas should be the dominant region.

Conceptually:

```text
Page height
│
├── Header        ~10%
├── Title         ~8%
├── Visual        ~55–65%
├── Caption       ~7%
└── Explanation   ~15–20%
```

These are design targets, not rigid pixel requirements.

---

# 40. V1 Information Density

| Component            |       Recommendation |
| -------------------- | -------------------: |
| Main visual          |                **1** |
| Main concept         |                **1** |
| Caption              |                    1 |
| Explanation          | 1–2 short paragraphs |
| Major nodes          |                  3–8 |
| Connections          |                  2–8 |
| Visual layers        |                    1 |
| Interactive elements |                    ❌ |
| Multiple diagrams    |                    ❌ |
| Code                 |                    ❌ |
| Detailed walkthrough |                    ❌ |

---

# 41. V1 Best Use Cases

| Field                  | Suitability |
| ---------------------- | ----------: |
| Full-stack development |       ⭐⭐⭐⭐⭐ |
| Python                 |       ⭐⭐⭐⭐⭐ |
| OOP                    |       ⭐⭐⭐⭐⭐ |
| Data Science           |       ⭐⭐⭐⭐⭐ |
| NumPy                  |       ⭐⭐⭐⭐⭐ |
| Pandas                 |       ⭐⭐⭐⭐⭐ |
| Data Engineering       |       ⭐⭐⭐⭐⭐ |
| Cyber Security         |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking        |        ⭐⭐⭐⭐ |
| Quantum Computing      |       ⭐⭐⭐⭐⭐ |
| Cloud Architecture     |       ⭐⭐⭐⭐⭐ |
| Databases              |       ⭐⭐⭐⭐⭐ |
| Networking             |       ⭐⭐⭐⭐⭐ |
| AI/ML                  |       ⭐⭐⭐⭐⭐ |

---

# 42. V1 What We Should Avoid

### ❌ Multiple unrelated diagrams

That belongs to a richer Visual version.

### ❌ Detailed step-by-step animation

Not V1.

### ❌ Interactive nodes

Not V1.

### ❌ Code + diagram

That can be a later Visual version or combination of VisualBlock + CodeBlock.

### ❌ Large explanatory text

Use Definition/Introduction/etc.

### ❌ Excessive labels

The visual should remain immediately understandable.

---

# 43. V1 Component Architecture

```text
VisualBlock
│
└── V1 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── VisualFigure
      │    ├── VisualCanvas
      │    └── Caption
      │
      └── Explanation
```

---

# 44. V1 Validation Rules

| Field                  |      Required |
| ---------------------- | ------------: |
| `type`                 |             ✅ |
| `version`              |             ✅ |
| `title`                |             ✅ |
| `visual`               |             ✅ |
| `visual.ariaLabel`     |             ✅ |
| `caption`              |   Recommended |
| `explanation`          |   Recommended |
| Main concept           | **Exactly 1** |
| Primary visual         | **Exactly 1** |
| Multiple visual models |             ❌ |
| Interactive controls   |             ❌ |
| Animation              |             ❌ |
| Code execution         |             ❌ |
| Detailed walkthrough   |             ❌ |

---

# 45. V1 Final Technical Specification

| Area           | V1 Decision                           |
| -------------- | ------------------------------------- |
| Block          | **VisualBlock**                       |
| Version        | **V1**                                |
| Name           | **Basic Visual**                      |
| Main question  | **What does this concept look like?** |
| Structure      | **Visual → Caption → Explanation**    |
| Best for       | Concept visualization                 |
| Primary        | **#F54A8D**                           |
| Secondary      | **#0B1B3D**                           |
| Theme          | Light                                 |
| Gradient       | ❌                                     |
| Dark theme     | ❌                                     |
| A4             | **Portrait**                          |
| Main HTML      | `<figure>`                            |
| Caption        | `<figcaption>`                        |
| Title          | `<h2>`                                |
| Explanation    | `<p>`                                 |
| Visual         | SVG / image / structured diagram      |
| Accessibility  | Required                              |
| Main visual    | 1                                     |
| Main concept   | 1                                     |
| Interactive    | ❌                                     |
| JSON-driven    | ✅                                     |
| Responsive     | ✅                                     |
| Accessible     | ✅                                     |
| Learning level | Beginner → Intermediate               |

---

# 46. V1 Final Mental Model

```text
                         V1
                          │
                          ▼
                       CONCEPT
                          │
                          ▼
                    VISUAL MODEL
                          │
                          ▼
                       CAPTION
                          │
                          ▼
                     EXPLANATION
```

Or simply:

```text
What is the concept?
        ↓
Show it visually.
        ↓
Tell me what I am seeing.
```

---

# VisualBlock Version Roadmap

We have only completed **V1** so far.

| Version | Visual Version   | Status      |
| ------- | ---------------- | ----------- |
| **V1**  | **Basic Visual** | ✅ Completed |
| V2      | —                | ⏳           |
| V3      | —                | ⏳           |
| V4      | —                | ⏳           |
| V5      | —                | ⏳           |
| V6      | —                | ⏳           |
| V7      | —                | ⏳           |
| V8      | —                | ⏳           |

For the next step, we should define **VisualBlock V2** based on the finalized VisualBlock version architecture rather than mixing it with the CodeBlock structure.



```python

```

# BLOCK 5 — VisualBlock

## V2 — Visual + Labels

V1 established the foundation:

> **Visual → Caption → Explanation**

V2 takes the next step by making the important parts of the visual explicitly identifiable.

| Item                  | VisualBlock V2                                                       |
| --------------------- | -------------------------------------------------------------------- |
| **Version**           | **V2**                                                               |
| **Name**              | **Visual + Labels**                                                  |
| **Structure**         | Visual → labelled elements → Caption → Explanation                   |
| **Primary purpose**   | Help the learner identify the important parts of a visual            |
| **Best for**          | Architecture diagrams, data structures, workflows, system components |
| **Learning question** | **“What are the important parts of this visual?”**                   |
| **Complexity**        | Beginner → Intermediate                                              |
| **SUIA Primary**      | **#F54A8D**                                                          |
| **SUIA Secondary**    | **#0B1B3D**                                                          |
| **Theme**             | Light                                                                |
| **Gradient**          | ❌                                                                    |
| **Dark theme**        | ❌                                                                    |
| **A4**                | **Portrait**                                                         |

---

# 1. What Changes from V1 to V2?

The key difference is **explicit labelling**.

### V1

```text
Concept
   ↓
Visual
   ↓
Caption
   ↓
Explanation
```

### V2

```text
Concept
   ↓
Visual
   ↓
Important visual elements
   ↓
Labels
   ↓
Caption
   ↓
Explanation
```

For example, instead of showing only:

```text
┌─────────────┐
│             │
│             │
└─────────────┘
```

V2 can explicitly identify:

```text
        Client
          │
          ▼
     ┌─────────┐
     │ Server  │
     └─────────┘
          │
          ▼
      Database
```

The learner immediately knows **what each visual object represents**.

---

# 2. Why V2 is Important

A diagram without labels can require the learner to infer meaning.

For example:

```text
○ ─────── ○ ─────── ○
```

What are the circles?

They could represent:

* users
* services
* processes
* states
* databases
* components

V2 removes this ambiguity:

```text
User ───── API ───── Database
```

Therefore:

> **V2 converts an abstract visual into an identifiable visual model.**

---

# 3. V2 Core Learning Principle

V2 answers:

> **“What are the important elements shown in this visual?”**

The learning flow is:

```text
SEE
 ↓
IDENTIFY
 ↓
UNDERSTAND
```

---

# 4. Canonical V2 Structure

```text
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Client–Server Architecture                   │
│                                              │
│       [Client]                               │
│           │                                  │
│           ▼                                  │
│       [Server]                               │
│           │                                  │
│           ▼                                  │
│      [Database]                              │
│                                              │
│ Caption                                      │
│                                              │
│ Explanation                                  │
└──────────────────────────────────────────────┘
```

The labels are part of the visual itself.

---

# 5. V2 Example — Full-Stack Development

Concept:

> Three-tier web architecture.

```text
┌───────────────────────┐
│     Presentation      │
│       Frontend        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    Application        │
│       Backend         │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│        Data           │
│       Database        │
└───────────────────────┘
```

The labels make the architecture immediately understandable.

Caption:

> Three-tier application architecture.

Explanation:

> The frontend presents the user interface, the backend implements application logic, and the database stores application data.

---

# 6. V2 Example — Python

Concept:

> Function anatomy.

```text
             Function
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
   Name      Parameters  Body
                         │
                         ▼
                       Return
```

Labels identify the important components:

* Name
* Parameters
* Body
* Return

This is much more useful to a beginner than an unlabeled diagram.

---

# 7. V2 Example — NumPy

Concept:

> NumPy array structure.

```text
              NumPy Array

       ┌─────┬─────┬─────┐
       │ 10  │ 20  │ 30  │
       └─────┴─────┴─────┘
          │     │     │
          ▼     ▼     ▼
       Element Element Element
```

Important labels can identify:

* array
* element
* index
* shape

---

# 8. V2 Example — Pandas

Concept:

> DataFrame anatomy.

```text
                 DataFrame
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
    Columns         Rows         Index
       │
       ▼
┌────────┬──────┬───────┐
│ Name   │ Age  │ Score │
├────────┼──────┼───────┤
│ Alice  │ 25   │ 90    │
└────────┴──────┴───────┘
```

This teaches the learner what the different parts of a DataFrame represent.

---

# 9. V2 Example — Data Engineering

Concept:

> Data pipeline.

```text
┌──────────┐
│  Source  │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Extract  │
└────┬─────┘
     │
     ▼
┌──────────┐
│Transform │
└────┬─────┘
     │
     ▼
┌──────────┐
│   Load   │
└──────────┘
```

Each stage is explicitly labelled.

---

# 10. V2 Example — Cyber Security

Concept:

> Security architecture.

```text
             Internet
                 │
                 ▼
          ┌─────────────┐
          │  Firewall   │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │ Application │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │  Database   │
          └─────────────┘
```

The labels communicate the architectural roles.

---

# 11. V2 Example — Quantum Computing

Concept:

> Basic qubit representation.

```text
                Qubit
                  │
             ┌────┴────┐
             ▼         ▼
           |0⟩        |1⟩
          Basis       Basis
          State       State
```

Labels clarify that `|0⟩` and `|1⟩` are computational basis states.

---

# 12. V2 Example — OOP

Concept:

> Class and object relationship.

```text
              Class
                │
        ┌───────┴───────┐
        ▼               ▼
     Object 1         Object 2
        │               │
      State           State
      Behavior        Behavior
```

The learner sees both the relationship and the meaning of each component.

---

# 13. V2 Example — Database

Concept:

> Table anatomy.

```text
                  Table
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      Column       Row        Cell
        │
        ▼
     Attribute
```

The visual itself teaches terminology.

---

# 14. V2 Example — API

Concept:

> Request/response architecture.

```text
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ Request
     ▼
┌──────────┐
│   API    │
└────┬─────┘
     │
     │ Response
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

The labels distinguish:

* Client
* API
* Request
* Response

---

# 15. V2 Label Types

V2 should support several label styles.

### Direct labels

```text
┌──────────────┐
│   Database   │
└──────────────┘
```

### External callout

```text
                    Database
                       │
                       ▼
                ┌────────────┐
                │            │
                │            │
                └────────────┘
```

### Numbered labels

```text
① Client
② Server
③ Database
```

### Legend labels

```text
① Frontend
② Backend
③ Database
```

The renderer can choose the appropriate representation.

---

# 16. V2 Direct Label vs Callout

### Direct label

Best when the visual is simple:

```text
┌──────────────┐
│   Database   │
└──────────────┘
```

### Callout

Best when the visual itself is complex:

```text
             ┌──────────────┐
             │              │
             └──────────────┘
                    ↑
                    │
               Database
```

The principle is:

> **Labels should clarify the visual, not compete with it.**

---

# 17. V2 Label Count

Recommended:

```text
3–8 important labels
```

Possible maximum:

```text
10–12
```

But if a diagram requires 20+ labels, it is probably too complex for V2.

That should move toward a more advanced VisualBlock version.

---

# 18. V2 A4 Portrait Layout

The A4 page should give the visual enough space to remain the primary learning element.

```text
┌──────────────────────────────────────────────┐
│                                              │
│ VISUAL                                       │
│                                              │
│ Three-Tier Architecture                      │
│                                              │
│                                              │
│        ┌─────────────────────┐               │
│        │ ① Presentation      │               │
│        │     Frontend        │               │
│        └──────────┬──────────┘               │
│                   │                          │
│                   ▼                          │
│        ┌─────────────────────┐               │
│        │ ② Application       │               │
│        │     Backend         │               │
│        └──────────┬──────────┘               │
│                   │                          │
│                   ▼                          │
│        ┌─────────────────────┐               │
│        │ ③ Data              │               │
│        │     Database        │               │
│        └─────────────────────┘               │
│                                              │
│ Caption                                      │
│                                              │
│ Explanation                                  │
│                                              │
└──────────────────────────────────────────────┘
```

The visual should occupy approximately **55–65% of the useful content area**.

---

# 19. V2 SUIA Color Strategy

The same SUIA rules continue.

| Role                          | Hex         |
| ----------------------------- | ----------- |
| **Primary Brand Pink**        | **#F54A8D** |
| **Secondary Brand Dark Blue** | **#0B1B3D** |

### Pink

Use for:

* `VISUAL` eyebrow
* numbered labels
* highlighted component
* important relationship
* active visual element

### Navy

Use for:

* title
* normal node text
* node borders
* arrows
* labels
* explanation

---

# 20. V2 70/30 Rule

A good visual:

```text
White canvas
      +
Navy structure
      +
Pink labels/highlights
```

For example:

```text
          ①
     ┌───────────┐
     │ Frontend  │
     └─────┬─────┘
           │
           ▼
     ┌───────────┐
     │ Backend   │
     └─────┬─────┘
           │
           ▼
     ┌───────────┐
     │ Database  │
     └───────────┘
```

Pink should emphasize `①`, `②`, `③` or the currently important concept rather than covering the whole diagram.

---

# 21. HTML Semantic Architecture

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <figure>
│    ├── Visual
│    ├── Labels
│    └── <figcaption>
│
└── <p>
```

The main difference from V1 is that the visual renderer now explicitly supports **label metadata**.

---

# 22. HTML Tag Color Table

| HTML Tag       | Purpose          | Color       |
| -------------- | ---------------- | ----------- |
| `<section>`    | Root block       | Neutral     |
| `<header>`     | Header           | Neutral     |
| `<span>`       | VISUAL eyebrow   | **#F54A8D** |
| `<h2>`         | Main title       | **#0B1B3D** |
| `<figure>`     | Visual container | Neutral     |
| `<figcaption>` | Caption          | **#0B1B3D** |
| `<p>`          | Explanation      | **#0B1B3D** |
| `<strong>`     | Important term   | **#0B1B3D** |
| `<div>`        | Label wrapper    | Neutral     |

If SVG is used:

| SVG Element        | Role         | Color       |
| ------------------ | ------------ | ----------- |
| `<rect>`           | Node         | Navy border |
| `<text>`           | Node label   | Navy        |
| `<line>`           | Connection   | Navy        |
| `<path>`           | Arrow        | Navy        |
| Highlight `<rect>` | Active node  | Pink        |
| Highlight `<text>` | Active label | Pink/Navy   |

---

# 23. Complete V2 HTML

```html
<section
    class="tutorial-block visual-block visual-v2"
    data-block="visual"
    data-version="V2"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Three-Tier Architecture
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="visual-canvas"
            role="img"
            aria-label="Three-tier architecture showing presentation,
            application, and data layers"
        >

            <!-- Visual renderer -->

            <div class="visual-node">
                <span class="node-label">
                    ①
                </span>

                <strong>
                    Presentation
                </strong>

                <span>
                    Frontend
                </span>
            </div>


            <div class="visual-connection">
                ↓
            </div>


            <div class="visual-node">
                <span class="node-label">
                    ②
                </span>

                <strong>
                    Application
                </strong>

                <span>
                    Backend
                </span>
            </div>


            <div class="visual-connection">
                ↓
            </div>


            <div class="visual-node">
                <span class="node-label">
                    ③
                </span>

                <strong>
                    Data
                </strong>

                <span>
                    Database
                </span>
            </div>

        </div>


        <figcaption class="visual-caption">
            Three-Tier Application Architecture
        </figcaption>

    </figure>


    <p class="visual-explanation">

        The presentation layer handles the user interface,
        the application layer contains application logic,
        and the data layer manages persistent data.

    </p>

</section>
```

---

# 24. V2 JSON Structure

```json
{
  "type": "visual",
  "version": "V2",

  "content": {

    "title": "Three-Tier Architecture",

    "visual": {
      "type": "flow",

      "ariaLabel": "Three-tier architecture showing presentation, application, and data layers",

      "nodes": [
        {
          "id": "presentation",
          "label": "Presentation",
          "subtitle": "Frontend",
          "marker": "①"
        },
        {
          "id": "application",
          "label": "Application",
          "subtitle": "Backend",
          "marker": "②"
        },
        {
          "id": "data",
          "label": "Data",
          "subtitle": "Database",
          "marker": "③"
        }
      ],

      "connections": [
        {
          "from": "presentation",
          "to": "application"
        },
        {
          "from": "application",
          "to": "data"
        }
      ]
    },

    "caption": "Three-Tier Application Architecture",

    "explanation": "The presentation layer handles the user interface, the application layer contains application logic, and the data layer manages persistent data."
  }
}
```

---

# 25. V2 Label Metadata

The important addition is:

```json
{
  "label": "Presentation",
  "subtitle": "Frontend",
  "marker": "①"
}
```

This gives the renderer enough information to decide how the label should appear.

For example:

```text
① Presentation
  Frontend
```

or:

```text
①
Presentation
Frontend
```

depending on screen size.

---

# 26. V2 Label Position

The JSON can optionally specify:

```json
{
  "id": "database",
  "label": "Database",
  "position": "bottom"
}
```

Supported conceptual positions:

```text
top
right
bottom
left
inside
```

This is useful for callout diagrams.

---

# 27. V2 Label Style

Optional:

```json
{
  "id": "database",
  "label": "Database",
  "labelStyle": "callout"
}
```

Possible styles:

```text
direct
callout
marker
legend
```

This allows the renderer to remain flexible.

---

# 28. V2 Legend

For diagrams with many numbered elements, a legend is useful.

Visual:

```text
① ───────
② ───────
③ ───────
```

Legend:

```text
① Frontend
② Backend
③ Database
```

JSON:

```json
{
  "legend": [
    {
      "marker": "①",
      "label": "Frontend"
    },
    {
      "marker": "②",
      "label": "Backend"
    },
    {
      "marker": "③",
      "label": "Database"
    }
  ]
}
```

---

# 29. V2 Direct Label Example

For a simple visual:

```json
{
  "visual": {
    "type": "flow",

    "nodes": [
      {
        "id": "client",
        "label": "Client"
      },
      {
        "id": "server",
        "label": "Server"
      }
    ]
  }
}
```

Rendered as:

```text
┌──────────┐       ┌──────────┐
│  Client  │ ────► │  Server  │
└──────────┘       └──────────┘
```

No legend is necessary.

---

# 30. V2 Callout Example

For a more complex diagram:

```text
                    Database
                       ↑
                       │
        ┌────────────────────────┐
        │                        │
        │       Application      │
        │                        │
        └────────────────────────┘
```

Here the label can be external.

This keeps the main diagram clean.

---

# 31. V2 Accessibility

The `aria-label` should describe the complete visual.

For example:

```text
Three-tier architecture with a presentation
frontend layer connected to an application
backend layer, which connects to a database layer.
```

For complex diagrams, the accessible description should also include the relationships.

---

# 32. V2 Responsive Behavior

### Desktop

```text
Large diagram
+
direct labels
```

### Tablet

```text
Medium diagram
+
compact labels
```

### Mobile

```text
Diagram
↓
labels may stack
```

For example:

```text
┌───────────────────┐
│ ① Presentation    │
│    Frontend       │
└───────────────────┘
          ↓
┌───────────────────┐
│ ② Application     │
│    Backend        │
└───────────────────┘
          ↓
┌───────────────────┐
│ ③ Data            │
│    Database       │
└───────────────────┘
```

---

# 33. V2 Information Density

| Component                     | Recommendation |
| ----------------------------- | -------------: |
| Main visual                   |          **1** |
| Important labels              |        **3–8** |
| Maximum recommended           |          10–12 |
| Caption                       |              1 |
| Explanation                   | 1–2 paragraphs |
| Legend                        |       Optional |
| Callouts                      |       Optional |
| Animation                     |              ❌ |
| Interaction                   |              ❌ |
| Multiple independent diagrams |              ❌ |
| Code                          |              ❌ |

---

# 34. V2 Best Use Cases

| Field                   | Suitability |
| ----------------------- | ----------: |
| Full-stack architecture |       ⭐⭐⭐⭐⭐ |
| Python concepts         |       ⭐⭐⭐⭐⭐ |
| OOP                     |       ⭐⭐⭐⭐⭐ |
| NumPy                   |       ⭐⭐⭐⭐⭐ |
| Pandas                  |       ⭐⭐⭐⭐⭐ |
| Data Engineering        |       ⭐⭐⭐⭐⭐ |
| Data Science            |       ⭐⭐⭐⭐⭐ |
| Cyber Security          |       ⭐⭐⭐⭐⭐ |
| Networking              |       ⭐⭐⭐⭐⭐ |
| Database concepts       |       ⭐⭐⭐⭐⭐ |
| APIs                    |       ⭐⭐⭐⭐⭐ |
| Quantum Computing       |       ⭐⭐⭐⭐⭐ |
| Cloud architecture      |       ⭐⭐⭐⭐⭐ |

---

# 35. V2 What We Should Avoid

### ❌ Too many labels

The learner loses the visual hierarchy.

### ❌ Labels covering the diagram

Labels should support the visual.

### ❌ Long paragraphs inside nodes

Use the explanation section.

### ❌ Multiple unrelated concepts

Keep one learning concept.

### ❌ Interactive labels

That belongs to a later version.

### ❌ Animation

Not V2.

---

# 36. V2 Component Architecture

```text
VisualBlock
│
└── V2 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── VisualFigure
      │    │
      │    ├── VisualCanvas
      │    │
      │    ├── VisualNodes
      │    │
      │    ├── Labels
      │    │
      │    ├── Connections
      │    │
      │    └── OptionalLegend
      │
      ├── Caption
      │
      └── Explanation
```

---

# 37. V2 Validation Rules

| Field                        |     Required |
| ---------------------------- | -----------: |
| `type`                       |            ✅ |
| `version`                    |            ✅ |
| `title`                      |            ✅ |
| `visual`                     |            ✅ |
| `visual.ariaLabel`           |            ✅ |
| `nodes`                      |  Recommended |
| Node `id`                    |            ✅ |
| Node `label`                 |            ✅ |
| Connections                  |  Recommended |
| Caption                      |  Recommended |
| Explanation                  |  Recommended |
| Labels                       | **Required** |
| Legend                       |     Optional |
| Label position               |     Optional |
| Label style                  |     Optional |
| Multiple independent visuals |            ❌ |
| Interaction                  |            ❌ |
| Animation                    |            ❌ |
| Code execution               |            ❌ |

---

# 38. V1 vs V2

| Feature              | V1 Basic Visual | **V2 Visual + Labels** |
| -------------------- | --------------: | ---------------------: |
| Main visual          |               ✅ |                      ✅ |
| Caption              |               ✅ |                      ✅ |
| Explanation          |               ✅ |                      ✅ |
| Explicit node labels |           Basic |           **Required** |
| Label metadata       |               ❌ |                  **✅** |
| Callouts             |               ❌ |               Optional |
| Numbered markers     |               ❌ |               Optional |
| Legend               |               ❌ |               Optional |
| Interaction          |               ❌ |                      ❌ |
| Animation            |               ❌ |                      ❌ |
| Complexity           |             Low |                 Medium |

The progression is therefore:

```text
V1
Show me the concept
      ↓
V2
Show me the concept
AND identify its important parts
```

---

# 39. V2 Final Technical Specification

| Area                    | V2 Decision                                      |
| ----------------------- | ------------------------------------------------ |
| Block                   | **VisualBlock**                                  |
| Version                 | **V2**                                           |
| Name                    | **Visual + Labels**                              |
| Main question           | **What are the important parts of this visual?** |
| Structure               | **Visual → Labels → Caption → Explanation**      |
| Best for                | Architecture and component identification        |
| Primary                 | **#F54A8D**                                      |
| Secondary               | **#0B1B3D**                                      |
| Theme                   | Light                                            |
| Gradient                | ❌                                                |
| Dark theme              | ❌                                                |
| A4                      | **Portrait**                                     |
| Main visual             | 1                                                |
| Labels                  | **3–8 recommended**                              |
| Legend                  | Optional                                         |
| Callouts                | Optional                                         |
| `<figure>`              | Main visual container                            |
| `<figcaption>`          | Caption                                          |
| `<h2>`                  | Title                                            |
| `<p>`                   | Explanation                                      |
| SVG                     | Supported                                        |
| Structured diagram JSON | Supported                                        |
| Accessibility           | Required                                         |
| Interaction             | ❌                                                |
| Animation               | ❌                                                |
| JSON-driven             | ✅                                                |
| Responsive              | ✅                                                |
| Learning level          | Beginner → Intermediate                          |

---

# 40. V2 Final Mental Model

```text
                         V2
                          │
                          ▼
                       CONCEPT
                          │
                          ▼
                    VISUAL MODEL
                          │
                          ▼
                  IDENTIFY ELEMENTS
                          │
                 ┌────────┼────────┐
                 ▼        ▼        ▼
              Label 1  Label 2  Label 3
                 │        │        │
                 └────────┼────────┘
                          ▼
                       CAPTION
                          │
                          ▼
                     EXPLANATION
```

The defining principle is:

> **V2 takes the basic visual from V1 and explicitly labels the important elements so the learner can identify the components, relationships, and terminology represented by the visual.**

---

## VisualBlock Progress

| Version | Name                | Status              |
| ------- | ------------------- | ------------------- |
| **V1**  | **Basic Visual**    | ✅                   |
| **V2**  | **Visual + Labels** | ✅ **Completed now** |
| V3      | —                   | ⏳                   |
| V4      | —                   | ⏳                   |
| V5      | —                   | ⏳                   |
| V6      | —                   | ⏳                   |
| V7      | —                   | ⏳                   |
| V8      | —                   | ⏳                   |

**V2 is now complete. The next step is VisualBlock V3.**



```python

```

# BLOCK 5 — VisualBlock

## V3 — Visual + Explanation

V1 established:

> **Visual → Caption → Explanation**

V2 established:

> **Visual → Labels → Caption → Explanation**

Now V3 moves one level deeper:

> **Visual → Labels → Detailed Explanation → Caption**

The purpose of V3 is to help the learner understand **what the visual represents and why the relationships shown in it exist**.

---

## 1. V3 Definition

| Item                  | VisualBlock V3                                                    |
| --------------------- | ----------------------------------------------------------------- |
| **Version**           | **V3**                                                            |
| **Name**              | **Visual + Explanation**                                          |
| **Structure**         | Visual → Labels → Explanation → Caption                           |
| **Primary purpose**   | Explain the meaning of the visual and its relationships           |
| **Best for**          | Architecture, workflows, processes, conceptual models             |
| **Learning question** | **“What does this visual mean, and how should I understand it?”** |
| **Complexity**        | Beginner → Intermediate                                           |
| **SUIA Primary**      | **#F54A8D**                                                       |
| **SUIA Secondary**    | **#0B1B3D**                                                       |
| **Theme**             | Light                                                             |
| **Gradient**          | ❌                                                                 |
| **Dark theme**        | ❌                                                                 |
| **A4**                | **Portrait**                                                      |

---

# 2. V1 → V2 → V3

The progression is deliberate.

### V1 — Basic Visual

```text
Visual
 ↓
Caption
 ↓
Short explanation
```

Answers:

> **What does this concept look like?**

---

### V2 — Visual + Labels

```text
Visual
 ↓
Labels
 ↓
Caption
 ↓
Explanation
```

Answers:

> **What are the important parts?**

---

### V3 — Visual + Explanation

```text
Visual
 ↓
Labels
 ↓
Detailed Explanation
 ↓
Caption
```

Answers:

> **What does this visual mean, and how do the parts relate?**

This is the first VisualBlock version where the explanation becomes a significant teaching component.

---

# 3. Why V3 is Needed

Consider this visual:

```text
Browser
   ↓
Frontend
   ↓
Backend
   ↓
Database
```

V2 tells the learner what the boxes represent.

But the learner may still ask:

> Why does the browser communicate with the frontend?

> Why does the frontend communicate with the backend?

> Why does the backend communicate with the database?

> What responsibility belongs to each layer?

V3 answers those questions.

---

# 4. V3 Core Learning Principle

The learning sequence becomes:

```text
SEE
 ↓
IDENTIFY
 ↓
CONNECT
 ↓
UNDERSTAND
```

The visual provides the structure.

The labels provide terminology.

The explanation provides meaning.

---

# 5. Canonical V3 Structure

```text
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Three-Tier Architecture                      │
│                                              │
│       ┌───────────────────┐                  │
│       │ Presentation      │                  │
│       │ Frontend          │                  │
│       └─────────┬─────────┘                  │
│                 │                            │
│                 ▼                            │
│       ┌───────────────────┐                  │
│       │ Application        │                  │
│       │ Backend            │                  │
│       └─────────┬─────────┘                  │
│                 │                            │
│                 ▼                            │
│       ┌───────────────────┐                  │
│       │ Data              │                  │
│       │ Database          │                  │
│       └───────────────────┘                  │
│                                              │
│ EXPLANATION                                  │
│                                              │
│ The presentation layer handles...            │
│ The application layer handles...             │
│ The data layer handles...                    │
│                                              │
│ CAPTION                                      │
│ Three-Tier Application Architecture          │
└──────────────────────────────────────────────┘
```

---

# 6. What Makes V3 Different from V2?

V2 might say:

```text
① Presentation
② Application
③ Database
```

V3 says:

```text
① Presentation
   → Displays and collects user-facing information.

② Application
   → Processes business/application logic.

③ Database
   → Stores and retrieves persistent data.
```

The learner is no longer just identifying components.

They are learning the **responsibility of each component**.

---

# 7. V3 Explanation Model

The explanation should normally contain three levels:

### Level 1 — Overall meaning

What does the complete visual represent?

### Level 2 — Component responsibilities

What does each major component do?

### Level 3 — Relationship

Why are the components connected?

Example:

> The three-tier architecture separates presentation, application logic, and data management. The presentation layer handles user interaction, the application layer processes business logic, and the data layer manages persistent information. The layers communicate so that each responsibility remains separated from the others.

That is a proper V3 explanation.

---

# 8. V3 Example — Full-Stack Development

## Visual

```text
┌─────────────────────┐
│ Presentation Layer  │
│ Frontend            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Application Layer   │
│ Backend             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Data Layer          │
│ Database            │
└─────────────────────┘
```

## Explanation

The presentation layer is responsible for the user-facing interface. It collects user actions and presents information.

The application layer contains application logic and processes requests received from the presentation layer.

The data layer manages persistent information and provides the application layer with the data it needs.

Separating these responsibilities makes the architecture easier to understand, maintain, and evolve.

## Caption

> Three layers separate presentation, application logic, and data management.

---

# 9. V3 Example — Python

Concept:

> Function execution.

### Visual

```text
┌─────────────────────┐
│ Function Definition │
│ calculate_area()    │
└──────────┬──────────┘
           │
           │ call
           ▼
┌─────────────────────┐
│ Arguments            │
│ width = 10           │
│ height = 5           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Function Body        │
│ width × height       │
└──────────┬──────────┘
           │
           ▼
        Return
          50
```

### Explanation

A function definition creates reusable behavior. When the function is called, the supplied arguments are associated with the corresponding parameters. The function body executes using those values and produces a result through the `return` statement.

### Caption

> A function call supplies arguments, executes the function body, and can return a result.

---

# 10. V3 Example — NumPy

### Visual

```text
Array
[1  2  3]
   │
   │ × 2
   ▼
[2  4  6]
```

### Explanation

The original NumPy array contains three elements. Multiplying the array by `2` applies the scalar operation element-wise, producing a new array containing the corresponding doubled values.

### Caption

> NumPy supports element-wise arithmetic operations on arrays.

---

# 11. V3 Example — Pandas

### Visual

```text
              DataFrame
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
    Columns      Rows       Index
       │
       ▼
┌────────┬──────┬───────┐
│ Name   │ Age  │ Score │
├────────┼──────┼───────┤
│ Alice  │ 25   │ 90    │
└────────┴──────┴───────┘
```

### Explanation

A Pandas DataFrame represents structured tabular data. Columns represent named data fields, rows represent individual records, and the index provides labels used to identify rows.

### Caption

> A DataFrame organizes structured data into rows, columns, and an index.

---

# 12. V3 Example — Data Engineering

### Visual

```text
Source
  │
  ▼
Extract
  │
  ▼
Transform
  │
  ▼
Load
  │
  ▼
Destination
```

### Explanation

The source contains the original data. During extraction, the pipeline obtains that data. Transformation changes or cleans the data into the required structure. The load stage writes the processed data to the destination system.

### Caption

> An ETL pipeline moves data from a source through extraction and transformation into a destination.

---

# 13. V3 Example — Data Science

### Visual

```text
Raw Data
    │
    ▼
Cleaning
    │
    ▼
Feature Preparation
    │
    ▼
Model
    │
    ▼
Prediction
```

### Explanation

Raw data often requires preparation before it can be used by a model. Cleaning addresses data-quality issues, feature preparation creates model-ready representations, and the trained model uses those features to produce predictions.

### Caption

> Data preparation transforms raw information into representations suitable for modeling.

---

# 14. V3 Example — Cyber Security

### Visual

```text
Internet
    │
    ▼
Firewall
    │
    ▼
Application
    │
    ▼
Database
```

### Explanation

The firewall can provide a security boundary between external traffic and protected application resources. The application processes permitted requests, while the database stores persistent application information. Security controls can be applied at multiple layers rather than relying on a single boundary.

### Caption

> Layered architecture separates network protection, application processing, and data storage.

---

# 15. V3 Example — Ethical Hacking

For an authorized security assessment:

```text
Defined Scope
      │
      ▼
Reconnaissance
      │
      ▼
Assessment
      │
      ▼
Findings
      │
      ▼
Report
```

### Explanation

A professional security assessment begins with a clearly defined scope. Reconnaissance gathers information relevant to the authorized assessment, testing evaluates the permitted target, findings document discovered issues, and reporting communicates the results and recommendations.

### Caption

> An authorized security assessment follows a controlled process from scope definition through reporting.

---

# 16. V3 Example — Quantum Computing

### Visual

```text
Initial State
    |0⟩
      │
      ▼
Quantum Gate
      │
      ▼
Transformed State
      │
      ▼
Measurement
      │
      ▼
Classical Result
```

### Explanation

A quantum computation begins with an initial quantum state. Quantum gates transform that state according to the operation being applied. Measurement then produces classical information from the resulting quantum state.

### Caption

> Quantum computation transforms quantum states before measurement produces classical information.

---

# 17. V3 Example — OOP

### Visual

```text
             Class
               │
        ┌──────┴──────┐
        ▼             ▼
     Object A      Object B
        │             │
     State A        State B
     Behavior A     Behavior B
```

### Explanation

A class defines the structure and behavior that objects can have. Objects are individual instances created from that class and can maintain their own state while using the behavior defined by the class.

### Caption

> A class defines a blueprint from which individual objects can be created.

---

# 18. V3 Example — API

### Visual

```text
Client
  │
  │ Request
  ▼
API
  │
  │ Processing
  ▼
Service
  │
  │ Response
  ▼
Client
```

### Explanation

The client sends a request to an API endpoint. The API receives and processes the request, potentially invoking application services, and then returns a response to the client.

### Caption

> An API provides a defined interface through which clients communicate with application services.

---

# 19. V3 Explanation Length

V3 requires more explanation than V1/V2, but it should **not become an IntroductionBlock**.

Recommended:

```text
1–3 short paragraphs
```

or:

```text
3–6 concise explanation points
```

A useful rule:

> **Explain the visual, not the entire topic.**

---

# 20. V3 Explanation Structure

A strong V3 explanation can follow:

```text
WHAT
 ↓
PARTS
 ↓
RELATIONSHIP
 ↓
PURPOSE
```

Example:

```text
WHAT
Three-tier architecture separates application responsibilities.

PARTS
Presentation, application, and data layers.

RELATIONSHIP
The layers communicate with one another.

PURPOSE
The separation improves organization and maintainability.
```

---

# 21. V3 Explanation vs DefinitionBlock

This distinction is important for the final Tutorial Engine architecture.

### DefinitionBlock

Answers:

> **What is the concept?**

### VisualBlock V3

Answers:

> **What does this visual represent and how do its parts relate?**

Therefore, don't duplicate a long definition inside V3.

---

# 22. V3 Explanation vs IntroductionBlock

### IntroductionBlock

Provides:

* background
* motivation
* context
* learning objectives
* conceptual orientation

### V3

Provides:

* visual interpretation
* component meaning
* relationship explanation

V3 is therefore **visual-centric**.

---

# 23. V3 Caption

The caption should remain concise.

Example:

> **Three-Tier Application Architecture**

The caption is not a second explanation.

---

# 24. V3 A4 Portrait Layout

This version needs slightly more space for explanation than V2.

```text
┌──────────────────────────────────────────────┐
│                                              │
│ VISUAL                                       │
│                                              │
│ Three-Tier Application Architecture          │
│                                              │
│       ┌─────────────────────┐                │
│       │ Presentation        │                │
│       │ Frontend            │                │
│       └─────────┬───────────┘                │
│                 │                            │
│                 ▼                            │
│       ┌─────────────────────┐                │
│       │ Application         │                │
│       │ Backend             │                │
│       └─────────┬───────────┘                │
│                 │                            │
│                 ▼                            │
│       ┌─────────────────────┐                │
│       │ Data                │                │
│       │ Database            │                │
│       └─────────────────────┘                │
│                                              │
│ EXPLANATION                                  │
│                                              │
│ The presentation layer handles...            │
│ The application layer handles...             │
│ The data layer manages...                    │
│                                              │
│ CAPTION                                      │
│ Three layers separate application           │
│ responsibilities.                            │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 25. V3 A4 Space Distribution

Recommended target:

| Region      | Approximate Space |
| ----------- | ----------------: |
| Header      |             8–10% |
| Title       |              7–8% |
| Visual      |        **45–55%** |
| Explanation |        **20–25%** |
| Caption     |              5–8% |
| Whitespace  |         Remaining |

The visual should remain dominant, but V3 deliberately gives more space to explanation.

---

# 26. V3 SUIA Color Strategy

The finalized colors remain unchanged.

### Primary Brand Pink

**#F54A8D**

Use for:

* `VISUAL` eyebrow
* `EXPLANATION` section label
* highlighted relationship
* important visual node
* important terminology marker

### Secondary Brand Dark Blue

**#0B1B3D**

Use for:

* title
* normal visual nodes
* node labels
* arrows
* explanation
* caption
* important text

---

# 27. V3 70/30 Color Rule

Target:

```text
70%
White + light neutral + navy
```

```text
30%
Pink emphasis
```

A good example:

```text
┌──────────────────────┐
│  PRESENTATION        │  ← Navy
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  APPLICATION         │  ← Pink highlight
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  DATABASE            │  ← Navy
└──────────────────────┘
```

Pink communicates importance rather than decoration.

---

# 28. V3 HTML Tags

| HTML Tag       | Purpose                | Color       |
| -------------- | ---------------------- | ----------- |
| `<section>`    | Root block             | Neutral     |
| `<header>`     | Block header           | Neutral     |
| `<span>`       | Eyebrow                | **#F54A8D** |
| `<h2>`         | Main title             | **#0B1B3D** |
| `<figure>`     | Visual container       | Neutral     |
| `<div>`        | Visual canvas          | Neutral     |
| `<strong>`     | Important visual label | **#0B1B3D** |
| `<figcaption>` | Caption                | **#0B1B3D** |
| `<h3>`         | Explanation heading    | **#F54A8D** |
| `<p>`          | Explanation            | **#0B1B3D** |

---

# 29. SVG Tags

For an SVG-based visual:

| SVG Tag     | Purpose            | Color     |
| ----------- | ------------------ | --------- |
| `<svg>`     | Root visual        | Neutral   |
| `<g>`       | Group              | Neutral   |
| `<rect>`    | Node               | Navy      |
| `<text>`    | Label              | Navy      |
| `<line>`    | Connection         | Navy      |
| `<path>`    | Arrow/relationship | Navy      |
| `<circle>`  | Marker             | Pink/Navy |
| `<polygon>` | Arrowhead          | Navy/Pink |

---

# 30. Complete V3 HTML

```html
<section
    class="tutorial-block visual-block visual-v3"
    data-block="visual"
    data-version="V3"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Three-Tier Application Architecture
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="visual-canvas"
            role="img"
            aria-label="Three-tier application architecture showing presentation,
            application, and data layers"
        >

            <div class="visual-node">
                <strong>
                    Presentation
                </strong>

                <span>
                    Frontend
                </span>
            </div>

            <div class="visual-connection">
                ↓
            </div>

            <div class="visual-node visual-node-highlight">
                <strong>
                    Application
                </strong>

                <span>
                    Backend
                </span>
            </div>

            <div class="visual-connection">
                ↓
            </div>

            <div class="visual-node">
                <strong>
                    Data
                </strong>

                <span>
                    Database
                </span>
            </div>

        </div>

        <figcaption class="visual-caption">

            Three layers separate application responsibilities.

        </figcaption>

    </figure>


    <section class="visual-explanation">

        <h3>
            Explanation
        </h3>

        <p>
            The presentation layer handles the user-facing
            interface and collects user interactions.
        </p>

        <p>
            The application layer processes application
            logic and coordinates requests between the
            presentation and data layers.
        </p>

        <p>
            The data layer manages persistent information
            and provides data required by the application.
        </p>

    </section>

</section>
```

---

# 31. V3 JSON

```json
{
  "type": "visual",
  "version": "V3",

  "content": {

    "title": "Three-Tier Application Architecture",

    "visual": {
      "type": "flow",

      "ariaLabel": "Three-tier application architecture showing presentation, application, and data layers",

      "nodes": [
        {
          "id": "presentation",
          "label": "Presentation",
          "subtitle": "Frontend"
        },
        {
          "id": "application",
          "label": "Application",
          "subtitle": "Backend",
          "highlight": true
        },
        {
          "id": "data",
          "label": "Data",
          "subtitle": "Database"
        }
      ],

      "connections": [
        {
          "from": "presentation",
          "to": "application"
        },
        {
          "from": "application",
          "to": "data"
        }
      ]
    },

    "explanation": {
      "title": "Explanation",

      "paragraphs": [
        "The presentation layer handles the user-facing interface and collects user interactions.",
        "The application layer processes application logic and coordinates requests between the presentation and data layers.",
        "The data layer manages persistent information and provides data required by the application."
      ]
    },

    "caption": "Three layers separate application responsibilities."
  }
}
```

---

# 32. V3 JSON Architecture

The major addition compared with V2 is:

```text
explanation
│
├── title
└── paragraphs[]
```

Therefore:

```text
visual
│
├── nodes
├── connections
│
└── explanation
     ├── paragraph 1
     ├── paragraph 2
     └── paragraph 3
```

---

# 33. V3 Explanation Data Model

For a more structured explanation:

```json
{
  "explanation": {
    "overview": "The architecture separates three major responsibilities.",

    "components": [
      {
        "nodeId": "presentation",
        "explanation": "Handles user-facing interaction."
      },
      {
        "nodeId": "application",
        "explanation": "Processes application logic."
      },
      {
        "nodeId": "data",
        "explanation": "Manages persistent data."
      }
    ],

    "relationship": "The layers communicate to complete an application request."
  }
}
```

This can be valuable when the renderer needs to connect explanations directly to visual components.

---

# 34. V3 Component Explanation Mapping

For example:

```text
Visual Node
    │
    ▼
Presentation
    │
    └──────► Explanation:
             Handles user interaction.
```

This creates a strong relationship between:

```text
visual
   ↕
explanation
```

rather than treating them as two unrelated pieces of content.

---

# 35. V3 Explanation Highlighting

Important terminology can be emphasized:

```html
<p>
    The
    <strong>application layer</strong>
    processes application logic.
</p>
```

The term remains navy.

Pink should be reserved for section-level emphasis or deliberate visual highlights.

---

# 36. V3 Accessibility

The accessible description should explain both the visual and its meaning.

Example:

```html
<div
    role="img"
    aria-label="
        Three-tier application architecture.
        Presentation frontend connects to application backend,
        which connects to the data database layer.
    "
>
```

The explanation itself remains visible for all learners.

Accessibility text should not be the only explanation.

---

# 37. V3 Responsive Design

Desktop:

```text
Visual
   ↓
Explanation below
```

Mobile:

```text
Visual
   ↓
Caption
   ↓
Explanation
```

The explanation should never be squeezed into a narrow side column on mobile.

---

# 38. V3 Mobile Layout

```text
┌─────────────────────────────┐
│ VISUAL                      │
│                             │
│ Three-Tier Architecture     │
│                             │
│ ┌─────────────────────────┐ │
│ │ Presentation            │ │
│ │ Frontend                │ │
│ └──────────┬──────────────┘ │
│            ↓                │
│ ┌─────────────────────────┐ │
│ │ Application             │ │
│ │ Backend                 │ │
│ └──────────┬──────────────┘ │
│            ↓                │
│ ┌─────────────────────────┐ │
│ │ Data                    │ │
│ │ Database                │ │
│ └─────────────────────────┘ │
│                             │
│ EXPLANATION                 │
│                             │
│ The presentation layer...   │
│                             │
│ The application layer...    │
│                             │
│ The data layer...           │
└─────────────────────────────┘
```

---

# 39. V3 Information Density

| Component                | Recommendation |
| ------------------------ | -------------: |
| Main visual              |          **1** |
| Major labels             |            3–8 |
| Explanation paragraphs   |        **2–4** |
| Caption                  |              1 |
| Component explanations   |       Optional |
| Relationship explanation |    Recommended |
| Legend                   |       Optional |
| Animation                |              ❌ |
| Interaction              |              ❌ |
| Code execution           |              ❌ |

---

# 40. V3 Best Use Cases

| Domain                      | Suitability |
| --------------------------- | ----------: |
| Full-stack architecture     |       ⭐⭐⭐⭐⭐ |
| Python concepts             |       ⭐⭐⭐⭐⭐ |
| OOP                         |       ⭐⭐⭐⭐⭐ |
| NumPy                       |       ⭐⭐⭐⭐⭐ |
| Pandas                      |       ⭐⭐⭐⭐⭐ |
| Data Science workflows      |       ⭐⭐⭐⭐⭐ |
| Data Engineering pipelines  |       ⭐⭐⭐⭐⭐ |
| Cyber Security architecture |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking methodology |        ⭐⭐⭐⭐ |
| Quantum Computing           |       ⭐⭐⭐⭐⭐ |
| Networking                  |       ⭐⭐⭐⭐⭐ |
| Database architecture       |       ⭐⭐⭐⭐⭐ |
| APIs                        |       ⭐⭐⭐⭐⭐ |
| Cloud architecture          |       ⭐⭐⭐⭐⭐ |
| AI/ML pipelines             |       ⭐⭐⭐⭐⭐ |

---

# 41. V3 What We Should Avoid

### ❌ Turning the explanation into a chapter

V3 is still a visual block.

### ❌ Explaining unrelated concepts

The explanation must correspond to the visual.

### ❌ Excessive text inside the diagram

Keep text in the explanation area.

### ❌ Multiple independent visual models

Use a more advanced VisualBlock version.

### ❌ Interactive behavior

That belongs later.

### ❌ Animation

Not V3.

---

# 42. V3 Component Architecture

```text
VisualBlock
│
└── V3 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── VisualFigure
      │    │
      │    ├── VisualCanvas
      │    │    ├── Nodes
      │    │    ├── Labels
      │    │    └── Connections
      │    │
      │    └── Caption
      │
      └── ExplanationSection
           │
           ├── Overview
           ├── Component Explanations
           └── Relationship Explanation
```

---

# 43. V3 Validation Rules

| Field                      |    Required |
| -------------------------- | ----------: |
| `type`                     |           ✅ |
| `version`                  |           ✅ |
| `title`                    |           ✅ |
| `visual`                   |           ✅ |
| `visual.ariaLabel`         |           ✅ |
| `nodes`                    | Recommended |
| Node labels                |           ✅ |
| Connections                | Recommended |
| `explanation`              |       **✅** |
| Explanation content        |       **✅** |
| Caption                    | Recommended |
| Component explanations     |    Optional |
| Relationship explanation   | Recommended |
| Multiple unrelated visuals |           ❌ |
| Interaction                |           ❌ |
| Animation                  |           ❌ |
| Code execution             |           ❌ |

---

# 44. V2 vs V3

| Feature                     |       V2 |                   **V3** |
| --------------------------- | -------: | -----------------------: |
| Visual                      |        ✅ |                        ✅ |
| Labels                      |        ✅ |                        ✅ |
| Caption                     |        ✅ |                        ✅ |
| Short explanation           |        ✅ |                        — |
| Detailed visual explanation |        — |                    **✅** |
| Component explanation       |        — | **Optional/Recommended** |
| Relationship explanation    |        — |                    **✅** |
| Legend                      | Optional |                 Optional |
| Interaction                 |        ❌ |                        ❌ |
| Animation                   |        ❌ |                        ❌ |
| Complexity                  |   Medium |                  Medium+ |

The progression is:

```text
V1
Show the visual
       ↓
V2
Show + identify the parts
       ↓
V3
Show + identify + explain the meaning
```

---

# 45. V3 Final Technical Specification

| Area                     | V3 Decision                                                 |
| ------------------------ | ----------------------------------------------------------- |
| Block                    | **VisualBlock**                                             |
| Version                  | **V3**                                                      |
| Name                     | **Visual + Explanation**                                    |
| Main question            | **What does this visual mean and how do its parts relate?** |
| Structure                | **Visual → Labels → Explanation → Caption**                 |
| Best for                 | Architecture, workflows, conceptual relationships           |
| Primary                  | **#F54A8D**                                                 |
| Secondary                | **#0B1B3D**                                                 |
| Theme                    | Light                                                       |
| Gradient                 | ❌                                                           |
| Dark theme               | ❌                                                           |
| A4                       | **Portrait**                                                |
| Main visual              | 1                                                           |
| Labels                   | 3–8 recommended                                             |
| Explanation              | **2–4 paragraphs**                                          |
| Component explanations   | Optional                                                    |
| Relationship explanation | Recommended                                                 |
| `<figure>`               | Visual                                                      |
| `<figcaption>`           | Caption                                                     |
| `<h2>`                   | Title                                                       |
| `<h3>`                   | Explanation heading                                         |
| `<p>`                    | Explanation                                                 |
| SVG                      | Supported                                                   |
| Structured JSON          | Supported                                                   |
| Accessibility            | Required                                                    |
| Interaction              | ❌                                                           |
| Animation                | ❌                                                           |
| JSON-driven              | ✅                                                           |
| Responsive               | ✅                                                           |
| Learning level           | **Beginner → Intermediate**                                 |

---

# 46. V3 Final Mental Model

```text
                         V3
                          │
                          ▼
                       CONCEPT
                          │
                          ▼
                    VISUAL MODEL
                          │
                          ▼
                  IDENTIFY ELEMENTS
                          │
                          ▼
                    EXPLAIN PARTS
                          │
                          ▼
                 EXPLAIN RELATIONSHIPS
                          │
                          ▼
                       CAPTION
```

The essential idea is:

> **V3 turns the visual from something the learner merely looks at into something the learner can interpret.**

---

## VisualBlock Progress

| Version | Name                     | Status              |
| ------- | ------------------------ | ------------------- |
| **V1**  | Basic Visual             | ✅                   |
| **V2**  | Visual + Labels          | ✅                   |
| **V3**  | **Visual + Explanation** | ✅ **Completed now** |
| V4      | —                        | ⏳                   |
| V5      | —                        | ⏳                   |
| V6      | —                        | ⏳                   |
| V7      | —                        | ⏳                   |
| V8      | —                        | ⏳                   |

**V3 is complete. The next version is V4.**



```python

```

# BLOCK 5 — VisualBlock

## V5 — Visual + Concept Map

We now continue the same version-by-version approach.

So far:

| Version | Purpose                                      |
| ------- | -------------------------------------------- |
| **V1**  | Show the concept visually                    |
| **V2**  | Identify important visual parts              |
| **V3**  | Explain the visual and its relationships     |
| **V4**  | Show a process step-by-step                  |
| **V5**  | **Show how multiple concepts are connected** |

---

# 1. V5 Definition

| Item                  | VisualBlock V5                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| **Version**           | **V5**                                                                                              |
| **Name**              | **Visual + Concept Map**                                                                            |
| **Structure**         | Central concept → related concepts → relationships                                                  |
| **Primary purpose**   | Show conceptual relationships among multiple related ideas                                          |
| **Best for**          | OOP, AI/ML, Python ecosystems, data science concepts, security concepts, architecture relationships |
| **Learning question** | **“How are these concepts connected?”**                                                             |
| **Complexity**        | Intermediate                                                                                        |
| **SUIA Primary**      | **#F54A8D**                                                                                         |
| **SUIA Secondary**    | **#0B1B3D**                                                                                         |
| **Theme**             | Light                                                                                               |
| **Gradient**          | ❌                                                                                                   |
| **Dark theme**        | ❌                                                                                                   |
| **A4**                | **Portrait**                                                                                        |

---

# 2. Why V5 Is Different

V4 answers:

> **What happens next?**

V5 answers:

> **How are these concepts related?**

This distinction is extremely important.

### V4

```text
Step 1
  ↓
Step 2
  ↓
Step 3
  ↓
Result
```

### V5

```text
             Concept A
                 │
                 │
Concept B ─── Central ─── Concept C
                 │
                 │
             Concept D
```

There is no requirement that the relationships represent time.

They represent **conceptual association**.

---

# 3. V5 Core Learning Principle

The learning model is:

```text id="8h2x3r"
CENTRAL CONCEPT
      │
      ├──── RELATED CONCEPT
      │
      ├──── RELATED CONCEPT
      │
      ├──── RELATED CONCEPT
      │
      └──── RELATED CONCEPT
```

The learner develops a **mental map** of the subject.

---

# 4. V5 Canonical Structure

```text id="6k8l1n"
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Python Programming                           │
│                                              │
│                 ┌───────────┐                │
│                 │  Python   │                │
│                 └─────┬─────┘                │
│                       │                      │
│       ┌───────────────┼───────────────┐      │
│       ▼               ▼               ▼      │
│   Variables        Functions         OOP     │
│       │                               │      │
│       ▼                               ▼      │
│   Data Types                     Classes    │
│                                              │
│ Explanation                                  │
│                                              │
│ Caption                                      │
└──────────────────────────────────────────────┘
```

The central concept is visually dominant.

---

# 5. Central Concept

Every V5 concept map should normally have **one primary central concept**.

Example:

```text id="s4h1r6"
             ┌─────────────┐
             │  Python     │
             └─────────────┘
```

Everything else should explain its relationship to that concept.

Avoid:

```text id="v7q2t4"
Python ─ Java ─ C++ ─ JavaScript ─ Rust
```

That is a comparison or ecosystem map rather than a focused concept map.

---

# 6. Relationship Types

V5 should support meaningful relationship labels.

Examples:

```text id="z9q7p1"
is-a
has-a
contains
depends-on
uses
produces
extends
implements
part-of
related-to
```

For example:

```text id="x8k3m2"
Class
  │
  │ creates
  ▼
Object
```

This is much more informative than an unlabeled arrow.

---

# 7. V5 Example — Python

Central concept:

```text id="1t5j0r"
                    Python
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     Variables     Functions        OOP
        │             │             │
        ▼             ▼             ▼
    Data Types     Parameters     Classes
```

### Explanation

Python programming contains several foundational concepts that work together. Variables reference objects, functions provide reusable behavior, and object-oriented programming organizes state and behavior through classes and objects.

### Caption

> Major foundational concepts in Python programming.

---

# 8. V5 Example — OOP

This is one of the strongest use cases.

```text id="3f8m2k"
                         OOP
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
     Classes          Objects         Encapsulation
        │                 │                 │
        ▼                 ▼                 ▼
   Inheritance       State/Behavior       Access
        │
        ▼
   Polymorphism
```

A more relationship-aware map:

```text id="4v2j8h"
                     OOP
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
     Class         Object      Encapsulation
        │             │
        │ creates     │
        └────────────►┘
```

This teaches relationships rather than sequence.

---

# 9. V5 Example — Python Exception Handling

```text id="0n3kq7"
                   Exceptions
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   try/except       Propagation      Traceback
       │               │                │
       ▼               ▼                ▼
    Handler        Stack Unwinding   Debugging
       │
       ▼
 Custom Exceptions
```

This allows a learner to see that exception handling is not one isolated feature.

---

# 10. V5 Example — NumPy

```text id="5m7d1p"
                       NumPy
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
      ndarray         Indexing          Vectorization
        │                │                │
        ▼                ▼                ▼
      Shape           Slicing        Broadcasting
        │
        ▼
      Dtype
```

### Explanation

NumPy's central abstraction is the multidimensional array. Concepts such as shape, data type, indexing, slicing, broadcasting, and vectorized operations describe how arrays are represented and manipulated.

---

# 11. V5 Example — Pandas

```text id="8c2q5v"
                       Pandas
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
   DataFrame          Series          Index
        │                │
        ├──────┐         │
        ▼      ▼         ▼
     Columns  Rows    Selection
        │
        ▼
    Filtering
        │
        ▼
   Aggregation
```

This gives the learner a conceptual map of the Pandas ecosystem.

---

# 12. V5 Example — Data Science

```text id="7h4m2x"
                    Data Science
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
     Data              Analysis         Modeling
       │                 │                 │
       ▼                 ▼                 ▼
   Cleaning         Visualization      Evaluation
       │
       ▼
 Feature Engineering
```

This is useful for showing that data science is not simply "machine learning."

---

# 13. V5 Example — Data Engineering

```text id="9k3r5m"
                  Data Engineering
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
    Ingestion          Storage         Processing
       │                 │                 │
       ▼                 ▼                 ▼
   Pipelines         Data Lake        Transformation
       │
       ▼
   Orchestration
```

---

# 14. V5 Example — Full-Stack Development

```text id="6p1v8s"
                 Full-Stack
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Frontend       Backend       Database
       │             │             │
       ▼             ▼             ▼
      UI            API           SQL
       │             │
       ▼             ▼
   Browser       Business Logic
```

This is a conceptual map rather than a request flow.

---

# 15. V5 Example — Cyber Security

```text id="2r7m4q"
                   Cyber Security
                         │
       ┌─────────────────┼──────────────────┐
       ▼                 ▼                  ▼
   Prevention         Detection          Response
       │                 │                  │
       ▼                 ▼                  ▼
    Controls          Monitoring        Recovery
       │
       ▼
    Risk Management
```

This teaches relationships among major security functions.

---

# 16. V5 Example — Ethical Hacking

```text id="3k9v1m"
                 Security Testing
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
    Scope            Testing          Findings
        │               │                │
        ▼               ▼                ▼
 Authorization     Validation         Reporting
```

The map remains focused on authorized security assessment concepts.

---

# 17. V5 Example — Quantum Computing

```text id="5s8n2p"
                 Quantum Computing
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
      Qubit            Gates          Measurement
       │                 │                 │
       ▼                 ▼                 ▼
     State          Transformation     Result
       │
       ▼
 Superposition
       │
       ▼
 Entanglement
```

---

# 18. V5 Relationship Labels

Relationship labels make V5 much stronger.

For example:

```text id="x7m3q2"
      Class
        │
     creates
        │
        ▼
      Object
```

Instead of:

```text id="d9q1k4"
Class
  │
  ▼
Object
```

The first tells the learner **what the relationship means**.

---

# 19. V5 Relationship Types

| Relationship | Meaning                     |
| ------------ | --------------------------- |
| `is-a`       | Classification              |
| `has-a`      | Composition/ownership       |
| `uses`       | Dependency                  |
| `creates`    | Creation relationship       |
| `contains`   | Containment                 |
| `depends-on` | Dependency                  |
| `produces`   | Output relationship         |
| `transforms` | Data/process transformation |
| `extends`    | Inheritance                 |
| `implements` | Interface realization       |
| `part-of`    | Component relationship      |
| `related-to` | General relationship        |

---

# 20. V5 Relationship Direction

Relationships can be:

### One-way

```text id="8p5m2x"
A ─────► B
```

### Two-way

```text id="1q7v4n"
A ◄────► B
```

### Hierarchical

```text id="9m2k6p"
       A
      / \
     B   C
```

### Network

```text id="5r8t1x"
      A
     / \
    B───C
     \ /
      D
```

The renderer should support these structures.

---

# 21. V5 A4 Portrait Layout

A concept map needs more spatial freedom than V4.

Recommended A4 structure:

```text id="p3h7q2"
┌──────────────────────────────────────────────┐
│                                              │
│ VISUAL                                       │
│                                              │
│ Python Programming Concept Map               │
│                                              │
│                   ┌───────────┐              │
│                   │  Python   │              │
│                   └─────┬─────┘              │
│                         │                    │
│          ┌──────────────┼──────────────┐     │
│          ▼              ▼              ▼     │
│      Variables       Functions          OOP  │
│          │              │              │     │
│          ▼              ▼              ▼     │
│      Data Types     Parameters       Classes │
│                                              │
│                                              │
│ EXPLANATION                                  │
│                                              │
│ This map shows how the major concepts...     │
│                                              │
│ CAPTION                                      │
│ Major relationships in Python programming.  │
└──────────────────────────────────────────────┘
```

---

# 22. V5 A4 Space Distribution

| Region      | Approximate Space |
| ----------- | ----------------: |
| Header      |             8–10% |
| Title       |              7–8% |
| Concept map |        **50–60%** |
| Explanation |            15–20% |
| Caption     |              5–7% |
| Whitespace  |         Remaining |

The map needs sufficient whitespace because relationships need visual breathing room.

---

# 23. V5 Layout Principle

Unlike V4, V5 should **not always force everything into a vertical line**.

V5 needs a two-dimensional canvas:

```text id="n6s2v8"
             A
          /  |  \
         B   C   D
        / \      |
       E   F     G
```

The relationships determine placement.

---

# 24. V5 SUIA Color Strategy

| Role                      | Color       |
| ------------------------- | ----------- |
| Primary Brand Pink        | **#F54A8D** |
| Secondary Brand Dark Blue | **#0B1B3D** |

### Pink

Use for:

* central concept
* relationship emphasis
* selected/highlighted concept
* key relationship label
* important nodes

### Navy

Use for:

* normal concepts
* relationship lines
* labels
* title
* explanation
* caption

---

# 25. V5 70/30 Rule

A good concept map:

```text id="x8p3n6"
                    PINK
                 ┌─────────┐
                 │ Python  │
                 └────┬────┘
                      │
             NAVY     │      NAVY
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      Variables    Functions      OOP
```

The central concept can receive the strongest pink emphasis.

The surrounding concepts remain primarily navy.

---

# 26. HTML Semantic Structure

```text id="2m7q4k"
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <figure>
│    ├── Concept Map
│    └── <figcaption>
│
└── <section>
     ├── <h3>
     └── <p>
```

---

# 27. HTML Tag Color Table

| HTML Tag       | Purpose             | Color                 |
| -------------- | ------------------- | --------------------- |
| `<section>`    | Root block          | Neutral               |
| `<header>`     | Header              | Neutral               |
| `<span>`       | VISUAL eyebrow      | **#F54A8D**           |
| `<h2>`         | Main title          | **#0B1B3D**           |
| `<figure>`     | Concept map         | Neutral               |
| `<div>`        | Map node/container  | Neutral               |
| `<strong>`     | Concept name        | **#0B1B3D**           |
| `<span>`       | Relationship label  | **#0B1B3D / #F54A8D** |
| `<figcaption>` | Caption             | **#0B1B3D**           |
| `<h3>`         | Explanation heading | **#F54A8D**           |
| `<p>`          | Explanation         | **#0B1B3D**           |

---

# 28. SVG Structure

Concept maps are especially well suited to SVG.

```text id="v5svg1"
<svg>
    <g>
        <rect />
        <text />
    </g>

    <path />

    <g>
        <rect />
        <text />
    </g>
</svg>
```

Relationships can be represented using:

```text id="q8m2x5"
<line>
<path>
<marker>
```

---

# 29. Complete V5 HTML

```html id="r8p3k1"
<section
    class="tutorial-block visual-block visual-v5"
    data-block="visual"
    data-version="V5"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Python Programming Concept Map
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="concept-map"
            role="img"
            aria-label="
                Python programming concept map connecting
                Python with variables, functions, object-oriented
                programming, data types, parameters, and classes
            "
        >

            <div class="concept-node concept-central">

                <strong>
                    Python
                </strong>

            </div>


            <div class="concept-relationship">
                <span>includes</span>
            </div>


            <div class="concept-node">

                <strong>
                    Variables
                </strong>

            </div>


            <div class="concept-node">

                <strong>
                    Functions
                </strong>

            </div>


            <div class="concept-node">

                <strong>
                    OOP
                </strong>

            </div>


            <div class="concept-node">

                <strong>
                    Data Types
                </strong>

            </div>


            <div class="concept-node">

                <strong>
                    Parameters
                </strong>

            </div>


            <div class="concept-node">

                <strong>
                    Classes
                </strong>

            </div>

        </div>


        <figcaption class="visual-caption">

            Major relationships in Python programming.

        </figcaption>

    </figure>


    <section class="visual-explanation">

        <h3>
            Explanation
        </h3>

        <p>
            Python programming contains several interconnected
            concepts. Variables reference objects, functions
            provide reusable behavior, and object-oriented
            programming organizes state and behavior through
            classes and objects.
        </p>

        <p>
            These concepts work together rather than existing
            as isolated features.
        </p>

    </section>

</section>
```

---

# 30. V5 JSON Structure

```json id="h5t9w2"
{
  "type": "visual",
  "version": "V5",

  "content": {

    "title": "Python Programming Concept Map",

    "visual": {

      "type": "concept-map",

      "ariaLabel": "Python programming concept map connecting variables, functions, object-oriented programming, data types, parameters, and classes",

      "centralNode": "python",

      "nodes": [
        {
          "id": "python",
          "label": "Python",
          "central": true
        },
        {
          "id": "variables",
          "label": "Variables"
        },
        {
          "id": "functions",
          "label": "Functions"
        },
        {
          "id": "oop",
          "label": "OOP"
        },
        {
          "id": "data-types",
          "label": "Data Types"
        },
        {
          "id": "parameters",
          "label": "Parameters"
        },
        {
          "id": "classes",
          "label": "Classes"
        }
      ],

      "relationships": [
        {
          "from": "python",
          "to": "variables",
          "label": "includes"
        },
        {
          "from": "python",
          "to": "functions",
          "label": "includes"
        },
        {
          "from": "python",
          "to": "oop",
          "label": "supports"
        },
        {
          "from": "variables",
          "to": "data-types",
          "label": "use"
        },
        {
          "from": "functions",
          "to": "parameters",
          "label": "use"
        },
        {
          "from": "oop",
          "to": "classes",
          "label": "uses"
        }
      ]
    },

    "explanation": {
      "title": "Explanation",

      "paragraphs": [
        "Python programming contains several interconnected concepts. Variables reference objects, functions provide reusable behavior, and object-oriented programming organizes state and behavior through classes and objects.",
        "These concepts work together rather than existing as isolated features."
      ]
    },

    "caption": "Major relationships in Python programming."
  }
}
```

---

# 31. Central Node Metadata

The central concept is explicitly defined:

```json id="3g8k4n"
{
  "id": "python",
  "label": "Python",
  "central": true
}
```

The renderer can therefore automatically give it:

* larger size
* stronger visual hierarchy
* pink emphasis
* central positioning

---

# 32. Relationship Metadata

Each relationship should have:

```json id="t2m7q8"
{
  "from": "python",
  "to": "functions",
  "label": "includes"
}
```

This provides:

```text id="f8m2q4"
Source
  ↓
Relationship
  ↓
Target
```

For example:

```text id="q6n1x9"
Python
  │
includes
  ▼
Functions
```

---

# 33. V5 Relationship Semantics

The renderer should distinguish between:

```text id="c7p4m2"
includes
uses
creates
extends
depends-on
contains
produces
```

because these are not visually equivalent.

For example:

```text id="x3k8p1"
Class
 │
creates
 ▼
Object
```

is semantically different from:

```text id="h2m6q9"
Object
 │
contains
 ▼
Attribute
```

---

# 34. V5 Layout Algorithms

The actual renderer can use different layouts.

### Radial

```text id="5n8p2x"
             B
             │
         ┌───A───┐
         │       │
         C       D
```

### Hierarchical

```text id="r4m7q1"
            A
          /   \
         B     C
        / \
       D   E
```

### Network

```text id="y8p3m5"
      A──────B
      │      │
      C──────D
```

### Tree

```text id="k2n6q4"
            A
            │
        ┌───┴───┐
        B       C
        │       │
        D       E
```

The JSON should describe **relationships**, while the renderer determines layout.

---

# 35. V5 Responsive Behavior

Desktop can use a radial/network layout:

```text id="1m8q3x"
          B
          │
      C───A───D
          │
          E
```

Mobile should normally convert the map into a hierarchical representation:

```text id="3p7n5q"
A
│
├── B
├── C
├── D
└── E
```

This prevents labels from becoming unreadable.

---

# 36. V5 Mobile Layout

```text id="m9k2p4"
┌─────────────────────────────┐
│ VISUAL                      │
│                             │
│ Python Concept Map          │
│                             │
│         Python              │
│            │                │
│    ┌───────┼───────┐        │
│    ▼       ▼       ▼        │
│ Variables Functions OOP     │
│    │       │       │        │
│    ▼       ▼       ▼        │
│ Data     Parameters Classes │
│ Types                       │
│                             │
│ EXPLANATION                 │
│                             │
│ These concepts are...       │
└─────────────────────────────┘
```

---

# 37. V5 Accessibility

Concept maps require particularly good accessibility because relationships are spatial.

The accessible representation should communicate:

```text id="x7n3m8"
Python is the central concept.

Python is related to Variables,
Functions, and OOP.

Variables are associated with Data Types.

Functions use Parameters.

OOP uses Classes.
```

This converts the visual network into a meaningful linear description.

---

# 38. V5 Information Density

| Component                 | Recommendation |
| ------------------------- | -------------: |
| Central concept           |          **1** |
| Directly related concepts |        **4–8** |
| Secondary concepts        |            2–8 |
| Relationship labels       |    Recommended |
| Explanation               | 1–3 paragraphs |
| Caption                   |              1 |
| Complex network           |              ❌ |
| 20+ nodes                 |              ❌ |
| Interaction               |              ❌ |
| Animation                 |              ❌ |

---

# 39. V5 Best Use Cases

| Domain                 | Suitability |
| ---------------------- | ----------: |
| Python                 |       ⭐⭐⭐⭐⭐ |
| OOP                    |       ⭐⭐⭐⭐⭐ |
| NumPy                  |       ⭐⭐⭐⭐⭐ |
| Pandas                 |       ⭐⭐⭐⭐⭐ |
| Data Science           |       ⭐⭐⭐⭐⭐ |
| Data Engineering       |       ⭐⭐⭐⭐⭐ |
| Full-stack development |       ⭐⭐⭐⭐⭐ |
| Cyber Security         |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking        |        ⭐⭐⭐⭐ |
| Quantum Computing      |       ⭐⭐⭐⭐⭐ |
| AI/ML                  |       ⭐⭐⭐⭐⭐ |
| Databases              |       ⭐⭐⭐⭐⭐ |
| Networking             |       ⭐⭐⭐⭐⭐ |
| Cloud Computing        |       ⭐⭐⭐⭐⭐ |

---

# 40. V5 What We Should Avoid

### ❌ Turning the concept map into a process

If arrows represent sequence, use V4.

### ❌ Showing unrelated concepts

The concepts should have a meaningful relationship.

### ❌ Excessive nodes

A concept map should remain readable.

### ❌ Decorative connections

Every connection should have semantic meaning.

### ❌ Long descriptions inside nodes

Use the explanation section.

### ❌ Complex interactive graph behavior

That belongs to later versions.

---

# 41. V5 Component Architecture

```text id="4m8q2z"
VisualBlock
│
└── V5 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── ConceptMap
      │    │
      │    ├── CentralNode
      │    │
      │    ├── ConceptNodes
      │    │
      │    ├── RelationshipLines
      │    │
      │    └── RelationshipLabels
      │
      ├── Caption
      │
      └── ExplanationSection
```

---

# 42. V5 Validation Rules

| Field                      |        Required |
| -------------------------- | --------------: |
| `type`                     |               ✅ |
| `version`                  |               ✅ |
| `title`                    |               ✅ |
| `visual`                   |               ✅ |
| `visual.type`              | **concept-map** |
| `centralNode`              |           **✅** |
| `nodes`                    |           **✅** |
| Node `id`                  |               ✅ |
| Node `label`               |               ✅ |
| `relationships`            |           **✅** |
| Relationship `from`        |               ✅ |
| Relationship `to`          |               ✅ |
| Relationship label         |     Recommended |
| Explanation                |     Recommended |
| Caption                    |     Recommended |
| Interaction                |               ❌ |
| Animation                  |               ❌ |
| Arbitrary decorative edges |               ❌ |

---

# 43. V4 vs V5

| Feature             |         V4 |          **V5** |
| ------------------- | ---------: | --------------: |
| Main visual         |       Flow | **Concept map** |
| Sequence            |   **Core** |               ❌ |
| Step numbering      |   **Core** |        Optional |
| Central concept     |   Optional |        **Core** |
| Relationships       | Sequential |  **Conceptual** |
| Relationship labels |   Optional | **Recommended** |
| Branching           |   Optional |         Natural |
| Network structure   |          ❌ |           **✅** |
| Explanation         |          ✅ |               ✅ |
| Interaction         |          ❌ |               ❌ |
| Animation           |          ❌ |               ❌ |

The conceptual progression is:

```text id="q2n8m5"
V1
SHOW
 ↓
V2
IDENTIFY
 ↓
V3
EXPLAIN
 ↓
V4
PROGRESS
 ↓
V5
CONNECT
```

---

# 44. V5 Final Technical Specification

| Area                | V5 Decision                                            |
| ------------------- | ------------------------------------------------------ |
| Block               | **VisualBlock**                                        |
| Version             | **V5**                                                 |
| Name                | **Visual + Concept Map**                               |
| Main question       | **How are these concepts connected?**                  |
| Structure           | **Central Concept → Related Concepts → Relationships** |
| Best for            | Conceptual relationships                               |
| Primary             | **#F54A8D**                                            |
| Secondary           | **#0B1B3D**                                            |
| Theme               | Light                                                  |
| Gradient            | ❌                                                      |
| Dark theme          | ❌                                                      |
| A4                  | **Portrait**                                           |
| Central concept     | **1**                                                  |
| Direct concepts     | 4–8                                                    |
| Relationship labels | Recommended                                            |
| Explanation         | 1–3 paragraphs                                         |
| Network layout      | Supported                                              |
| Radial layout       | Supported                                              |
| Hierarchical layout | Supported                                              |
| `<figure>`          | Main visual                                            |
| `<figcaption>`      | Caption                                                |
| `<h2>`              | Title                                                  |
| `<h3>`              | Explanation heading                                    |
| `<p>`               | Explanation                                            |
| SVG                 | Supported                                              |
| Structured JSON     | Supported                                              |
| Accessibility       | Required                                               |
| Interaction         | ❌                                                      |
| Animation           | ❌                                                      |
| JSON-driven         | ✅                                                      |
| Responsive          | ✅                                                      |
| Learning level      | **Intermediate**                                       |

---

# 45. V5 Final Mental Model

```text id="7p2m9x"
                    CENTRAL CONCEPT
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Concept A        Concept B        Concept C
          │                │                │
          ▼                ▼                ▼
      Concept D        Concept E        Concept F
```

But unlike V4:

```text id="4x7m2p"
        ❌ not primarily about TIME
```

It is about:

```text id="r8q3n1"
        ✅ MEANING
        ✅ RELATIONSHIPS
        ✅ DEPENDENCIES
        ✅ STRUCTURE
```

The defining principle is:

> **V5 transforms a collection of related concepts into a visual knowledge network, allowing the learner to understand not only what each concept is, but how the concepts relate to one another.**

---

## VisualBlock Progress

| Version | Name                       | Status              |
| ------- | -------------------------- | ------------------- |
| **V1**  | Basic Visual               | ✅                   |
| **V2**  | Visual + Labels            | ✅                   |
| **V3**  | Visual + Explanation       | ✅                   |
| **V4**  | Visual + Step-by-Step Flow | ✅                   |
| **V5**  | **Visual + Concept Map**   | ✅ **Completed now** |
| V6      | —                          | ⏳                   |
| V7      | —                          | ⏳                   |
| V8      | —                          | ⏳                   |

**V5 is complete. The next version is V6.**



```python

```

# BLOCK 5 — VisualBlock

## V6 — Visual + Comparison

We continue exactly one version at a time.

So far, the VisualBlock progression is:

| Version | Purpose                                           |
| ------- | ------------------------------------------------- |
| **V1**  | Show the concept visually                         |
| **V2**  | Identify the important parts                      |
| **V3**  | Explain what the visual means                     |
| **V4**  | Show a process step-by-step                       |
| **V5**  | Show relationships between concepts               |
| **V6**  | **Compare two or more related concepts visually** |

---

# 1. V6 Definition

| Item                  | VisualBlock V6                                                                         |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Version**           | **V6**                                                                                 |
| **Name**              | **Visual + Comparison**                                                                |
| **Structure**         | Concept A ↔ Concept B → visual differences → explanation                               |
| **Primary purpose**   | Visually compare related concepts                                                      |
| **Best for**          | Similar technologies, algorithms, data structures, architectures, programming concepts |
| **Learning question** | **“How are these concepts different or similar?”**                                     |
| **Complexity**        | Intermediate                                                                           |
| **SUIA Primary**      | **#F54A8D**                                                                            |
| **SUIA Secondary**    | **#0B1B3D**                                                                            |
| **Theme**             | Light                                                                                  |
| **Gradient**          | ❌                                                                                      |
| **Dark theme**        | ❌                                                                                      |
| **A4**                | **Portrait**                                                                           |

---

# 2. Why V6 Is Needed

V5 teaches relationships among concepts.

V6 answers a different question:

> **“Which characteristics distinguish these concepts?”**

For example:

```text
List                         Tuple
 │                            │
Mutable                     Immutable
 │                            │
Dynamic size                Fixed size
```

A learner can immediately see the contrast.

---

# 3. V6 Core Learning Principle

The learning model is:

```text
CONCEPT A
    │
    ├── Characteristic 1
    ├── Characteristic 2
    └── Characteristic 3

             VS

CONCEPT B
    │
    ├── Characteristic 1
    ├── Characteristic 2
    └── Characteristic 3
```

The visual should make **similarities and differences obvious without requiring the learner to read a large paragraph**.

---

# 4. Canonical V6 Structure

```text
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Python List vs Tuple                         │
│                                              │
│ ┌──────────────────┐    ┌──────────────────┐ │
│ │      LIST        │    │      TUPLE       │ │
│ │                  │    │                  │ │
│ │ Mutable          │    │ Immutable        │ │
│ │ Dynamic size     │    │ Fixed structure  │ │
│ │ []               │    │ ()               │ │
│ └──────────────────┘    └──────────────────┘ │
│                                              │
│              COMMON                          │
│                 │                            │
│        Ordered collections                  │
│                                              │
│ Explanation                                  │
│                                              │
│ Caption                                      │
└──────────────────────────────────────────────┘
```

---

# 5. V6 Comparison Dimensions

A comparison should use **common dimensions**.

For example:

| Dimension  | List                  | Tuple            |
| ---------- | --------------------- | ---------------- |
| Mutability | Mutable               | Immutable        |
| Syntax     | `[]`                  | `()`             |
| Ordering   | Ordered               | Ordered          |
| Use        | Changeable collection | Fixed collection |

The VisualBlock should visually represent these dimensions.

---

# 6. Comparison Is Not Just a Table

A normal table is better handled by a dedicated table-oriented block if one exists in the final architecture.

V6 is specifically:

> **Visual comparison.**

For example:

```text
             List        Tuple
               │           │
Mutability ──► Mutable   Immutable
Syntax ──────► []        ()
```

The learner gets a **visual comparison model**, not merely rows and columns.

---

# 7. V6 Example — Python List vs Tuple

```text
          LIST                    TUPLE
           │                        │
           ▼                        ▼
      ┌──────────┐            ┌──────────┐
      │ Mutable  │            │Immutable │
      └──────────┘            └──────────┘
           │                        │
           ▼                        ▼
          []                       ()
           │                        │
           └──────────┬─────────────┘
                      ▼
                 Both Ordered
```

### Explanation

Lists and tuples are ordered sequence types, but their mutability differs. A list can be modified after creation, while a tuple is immutable after creation.

### Caption

> Lists and tuples both represent ordered collections but differ in mutability.

---

# 8. V6 Example — Set vs List

```text
             LIST                  SET
              │                     │
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │ Ordered  │          │Unordered*│
        └──────────┘          └──────────┘
              │                     │
              ▼                     ▼
        Duplicates            Unique values
              │                     │
              ▼                     ▼
             []                    {}
```

The exact terminology should be aligned with the language/version being taught; the visual should avoid oversimplifying implementation-specific ordering behavior.

---

# 9. V6 Example — NumPy Array vs Python List

```text
       Python List             NumPy ndarray
            │                       │
            ▼                       ▼
       General-purpose          Numerical array
            │                       │
            ▼                       ▼
      Heterogeneous*            Homogeneous*
            │                       │
            ▼                       ▼
       Python operations       Vectorized operations
```

### Explanation

Python lists are general-purpose containers, whereas NumPy arrays are specialized for numerical computation and multidimensional data. NumPy provides array-oriented operations that are particularly useful for scientific and numerical workloads.

---

# 10. V6 Example — Pandas Series vs DataFrame

```text
          Series                 DataFrame
             │                      │
             ▼                      ▼
       One-dimensional         Two-dimensional
             │                      │
             ▼                      ▼
         Single axis           Rows + Columns
             │                      │
             ▼                      ▼
       Single data field       Tabular dataset
```

This is an excellent V6 comparison because the learner frequently encounters both structures.

---

# 11. V6 Example — Data Science

### Supervised vs Unsupervised Learning

```text
      SUPERVISED              UNSUPERVISED
           │                        │
           ▼                        ▼
       Labelled Data           Unlabelled Data
           │                        │
           ▼                        ▼
       Learn Mapping            Find Structure
           │                        │
           ▼                        ▼
       Classification          Clustering
       Regression              Dimensionality Reduction
```

### Explanation

Supervised learning uses labeled examples to learn a mapping between inputs and expected outputs. Unsupervised learning works with data without predefined target labels and seeks useful structures or patterns.

---

# 12. V6 Example — Data Engineering

### ETL vs ELT

```text
             ETL                       ELT
              │                         │
              ▼                         ▼
           Extract                   Extract
              │                         │
              ▼                         ▼
          Transform                    Load
              │                         │
              ▼                         ▼
            Load                    Transform
```

This visual immediately exposes the fundamental difference:

```text
ETL → Transform before Load
ELT → Transform after Load
```

---

# 13. V6 Example — Full-Stack Development

### REST API vs GraphQL

```text
          REST                       GraphQL
            │                           │
            ▼                           ▼
       Multiple endpoints          Single endpoint*
            │                           │
            ▼                           ▼
       Resource-oriented          Query-oriented
            │                           │
            ▼                           ▼
       Server-defined             Client requests fields
       response structure         through a schema
```

The exact behavior can vary by implementation, so the visual should teach the intended conceptual distinction rather than universal absolutes.

---

# 14. V6 Example — Cyber Security

### Authentication vs Authorization

```text
       AUTHENTICATION          AUTHORIZATION
              │                      │
              ▼                      ▼
        Who are you?            What can you do?
              │                      │
              ▼                      ▼
         Identity               Permissions
              │                      │
              ▼                      ▼
          Login                Access decision
```

This is one of the most valuable comparison visuals in security education.

---

# 15. V6 Example — Ethical Hacking

### Vulnerability Assessment vs Penetration Testing

```text
    Vulnerability Assessment       Penetration Testing
              │                           │
              ▼                           ▼
       Identify weaknesses          Controlled validation
              │                           │
              ▼                           ▼
          Broader scan               Deeper testing
              │                           │
              ▼                           ▼
       Prioritize findings          Demonstrate impact
```

The visual should remain focused on authorized security work.

---

# 16. V6 Example — Quantum Computing

### Classical Bit vs Qubit

```text
          BIT                      QUBIT
           │                        │
           ▼                        ▼
       Classical                Quantum
           │                        │
           ▼                        ▼
          0/1                Quantum state
                                    │
                                    ▼
                              Measurement
```

### Explanation

A classical bit has a value of either 0 or 1. A qubit is a quantum system whose state can be represented as a superposition of computational basis states until measurement.

---

# 17. V6 Example — OOP

### Inheritance vs Composition

```text
        INHERITANCE              COMPOSITION
             │                        │
             ▼                        ▼
       is-a relationship          has-a relationship
             │                        │
             ▼                        ▼
      Reuse through hierarchy   Build from components
             │                        │
             ▼                        ▼
         Parent/Child            Object collaboration
```

This is particularly useful for advanced programming education.

---

# 18. V6 Comparison Dimensions

Common dimensions include:

| Dimension    | Example                              |
| ------------ | ------------------------------------ |
| Definition   | What each concept means              |
| Purpose      | Why it exists                        |
| Structure    | How it is organized                  |
| Syntax       | How it is written                    |
| Mutability   | Whether it can change                |
| Performance  | Relative characteristics             |
| Memory       | Representation differences           |
| Usage        | Typical applications                 |
| Advantages   | Strengths                            |
| Limitations  | Weaknesses                           |
| Input        | Accepted input                       |
| Output       | Produced output                      |
| Behavior     | How it behaves                       |
| Relationship | How it interacts with other concepts |

Not every V6 needs every dimension.

---

# 19. V6 Number of Concepts

Recommended:

```text
2 concepts
```

Excellent:

```text
A VS B
```

Possible:

```text
A VS B VS C
```

But three-way comparisons should be used only when the comparison remains readable.

Avoid:

```text
A VS B VS C VS D VS E
```

That becomes too dense.

---

# 20. V6 A4 Portrait Layout

For two concepts:

```text
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Authentication vs Authorization              │
│                                              │
│ ┌──────────────────┐  ┌──────────────────┐  │
│ │ AUTHENTICATION   │  │ AUTHORIZATION    │  │
│ │                  │  │                  │  │
│ │ Who are you?     │  │ What can you do? │  │
│ │                  │  │                  │  │
│ │ Identity         │  │ Permissions      │  │
│ │ Login            │  │ Access decision  │  │
│ └──────────────────┘  └──────────────────┘  │
│                                              │
│              KEY DIFFERENCE                  │
│                                              │
│ Identity               Permissions           │
│                                              │
│ Explanation                                  │
│                                              │
│ Caption                                      │
└──────────────────────────────────────────────┘
```

---

# 21. V6 A4 Space Distribution

| Region            | Approximate Space |
| ----------------- | ----------------: |
| Header            |             8–10% |
| Title             |              7–8% |
| Comparison visual |        **45–55%** |
| Key difference    |             8–12% |
| Explanation       |            15–20% |
| Caption           |              5–7% |

---

# 22. V6 Comparison Layout

The default layout should be symmetrical:

```text
┌──────────────────┐     ┌──────────────────┐
│       A          │ VS  │       B          │
├──────────────────┤     ├──────────────────┤
│ Characteristic 1 │     │ Characteristic 1 │
│ Characteristic 2 │     │ Characteristic 2 │
│ Characteristic 3 │     │ Characteristic 3 │
└──────────────────┘     └──────────────────┘
```

This creates immediate visual parity.

---

# 23. V6 Shared Characteristics

Sometimes the most important thing is what both concepts share.

For example:

```text
          LIST                    TUPLE
            │                       │
            └─────────┬─────────────┘
                      ▼
                BOTH ARE
              ORDERED SEQUENCES
```

This is useful because comparison should communicate both:

> **similarity + difference**

---

# 24. V6 Key Difference

The block can visually highlight the defining difference:

```text
LIST                         TUPLE
 │                             │
 ▼                             ▼
Mutable                    Immutable
       ← KEY DIFFERENCE →
```

Pink can emphasize the key difference.

---

# 25. V6 SUIA Color Strategy

| Role                      | Color       |
| ------------------------- | ----------- |
| Primary Brand Pink        | **#F54A8D** |
| Secondary Brand Dark Blue | **#0B1B3D** |

### Pink

Use for:

* `VISUAL`
* `VS`
* key difference
* highlighted characteristic
* selected concept
* comparison emphasis

### Navy

Use for:

* concept titles
* normal characteristics
* borders
* labels
* explanation
* caption

---

# 26. V6 70/30 Rule

Example:

```text
┌──────────────────┐       ┌──────────────────┐
│     LIST         │  VS   │      TUPLE       │
│                  │       │                  │
│ Mutable          │       │ Immutable        │
│ Ordered          │       │ Ordered          │
│ []               │       │ ()               │
└──────────────────┘       └──────────────────┘
```

The majority of the visual should remain:

> **white/light neutral + navy**

Pink should provide:

> **comparison emphasis**

rather than becoming the background of both columns.

---

# 27. HTML Semantic Structure

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <figure>
│    ├── Comparison
│    │    ├── Concept A
│    │    ├── VS
│    │    └── Concept B
│    │
│    └── <figcaption>
│
└── <section>
     ├── <h3>
     └── <p>
```

---

# 28. HTML Tag-by-Tag Color Table

| HTML Tag       | Purpose                    | Color       |
| -------------- | -------------------------- | ----------- |
| `<section>`    | Root block                 | Neutral     |
| `<header>`     | Block header               | Neutral     |
| `<span>`       | VISUAL eyebrow / VS marker | **#F54A8D** |
| `<h2>`         | Main title                 | **#0B1B3D** |
| `<figure>`     | Comparison visual          | Neutral     |
| `<div>`        | Comparison column          | Neutral     |
| `<h3>`         | Concept title              | **#0B1B3D** |
| `<strong>`     | Important characteristic   | **#0B1B3D** |
| `<figcaption>` | Caption                    | **#0B1B3D** |
| `<section>`    | Explanation area           | Neutral     |
| `<h3>`         | Explanation heading        | **#F54A8D** |
| `<p>`          | Explanation                | **#0B1B3D** |

---

# 29. SVG Comparison Structure

```text
<svg>
    <g class="comparison-a">
        <rect />
        <text />
    </g>

    <text>VS</text>

    <g class="comparison-b">
        <rect />
        <text />
    </g>

    <g class="shared">
        <line />
        <text />
    </g>
</svg>
```

This allows the comparison renderer to preserve symmetry.

---

# 30. Complete V6 HTML

```html
<section
    class="tutorial-block visual-block visual-v6"
    data-block="visual"
    data-version="V6"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Authentication vs Authorization
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="comparison-visual"
            role="img"
            aria-label="
                Comparison between authentication and authorization.
                Authentication establishes user identity.
                Authorization determines permitted access.
            "
        >

            <div class="comparison-column">

                <h3>
                    Authentication
                </h3>

                <strong>
                    Who are you?
                </strong>

                <span>
                    Identity
                </span>

                <span>
                    Login
                </span>

                <span>
                    Credential verification
                </span>

            </div>


            <div class="comparison-marker">
                VS
            </div>


            <div class="comparison-column">

                <h3>
                    Authorization
                </h3>

                <strong>
                    What can you do?
                </strong>

                <span>
                    Permissions
                </span>

                <span>
                    Access control
                </span>

                <span>
                    Policy decision
                </span>

            </div>

        </div>


        <figcaption class="visual-caption">

            Authentication establishes identity;
            authorization determines permitted access.

        </figcaption>

    </figure>


    <section class="visual-explanation">

        <h3>
            Explanation
        </h3>

        <p>
            Authentication determines or verifies the identity
            of a subject, such as a user or service.
        </p>

        <p>
            Authorization evaluates what that authenticated
            subject is permitted to access or perform.
        </p>

        <p>
            The two concepts are related but solve different
            security problems.
        </p>

    </section>

</section>
```

---

# 31. V6 JSON Structure

```json
{
  "type": "visual",
  "version": "V6",

  "content": {

    "title": "Authentication vs Authorization",

    "visual": {

      "type": "comparison",

      "ariaLabel": "Comparison between authentication and authorization",

      "items": [
        {
          "id": "authentication",
          "title": "Authentication",

          "summary": "Who are you?",

          "characteristics": [
            "Identity",
            "Login",
            "Credential verification"
          ]
        },

        {
          "id": "authorization",
          "title": "Authorization",

          "summary": "What can you do?",

          "characteristics": [
            "Permissions",
            "Access control",
            "Policy decision"
          ]
        }
      ],

      "shared": [
        "Security-related identity and access concepts"
      ],

      "keyDifference": "Authentication establishes identity, while authorization determines permitted access."
    },

    "explanation": {
      "title": "Explanation",

      "paragraphs": [
        "Authentication determines or verifies the identity of a subject, such as a user or service.",
        "Authorization evaluates what that authenticated subject is permitted to access or perform.",
        "The two concepts are related but solve different security problems."
      ]
    },

    "caption": "Authentication establishes identity; authorization determines permitted access."
  }
}
```

---

# 32. V6 Comparison Data Model

The most important design principle is that each concept should have comparable dimensions.

For example:

```json
{
  "dimension": "Purpose",

  "values": {
    "authentication": "Establish identity",
    "authorization": "Determine permitted access"
  }
}
```

This makes the comparison renderer much more powerful.

---

# 33. V6 Structured Comparison JSON

A richer model:

```json
{
  "visual": {
    "type": "comparison",

    "items": [
      {
        "id": "list",
        "title": "List"
      },
      {
        "id": "tuple",
        "title": "Tuple"
      }
    ],

    "dimensions": [
      {
        "label": "Mutability",
        "values": {
          "list": "Mutable",
          "tuple": "Immutable"
        }
      },
      {
        "label": "Syntax",
        "values": {
          "list": "[]",
          "tuple": "()"
        }
      },
      {
        "label": "Ordering",
        "values": {
          "list": "Ordered",
          "tuple": "Ordered"
        }
      }
    ]
  }
}
```

This is ideal for a generic Tutorial Engine.

---

# 34. Why the Generic Model Matters

The renderer should not know:

```text
List vs Tuple
```

specifically.

It should know:

```text
Comparison
```

and receive:

```text
Concept A
Concept B
Comparison dimensions
```

Therefore the same renderer can produce:

```text
List vs Tuple
```

or:

```text
REST vs GraphQL
```

or:

```text
Authentication vs Authorization
```

or:

```text
ETL vs ELT
```

without changing the frontend component.

---

# 35. V6 Accessibility

The accessible representation should communicate the comparison sequentially.

Example:

> Authentication establishes identity through credential verification. Authorization determines permissions and access. Both are security-related concepts, but authentication answers who a subject is while authorization determines what that subject may do.

This is much better than simply saying:

> Comparison diagram.

---

# 36. V6 Responsive Design

Desktop:

```text
┌──────────────┐       ┌──────────────┐
│ Concept A    │  VS   │ Concept B    │
└──────────────┘       └──────────────┘
```

Mobile:

```text
┌─────────────────────┐
│ Concept A            │
│                     │
│ Characteristic 1    │
│ Characteristic 2    │
└─────────────────────┘

          VS

┌─────────────────────┐
│ Concept B            │
│                     │
│ Characteristic 1    │
│ Characteristic 2    │
└─────────────────────┘
```

This preserves readability.

---

# 37. V6 Mobile Layout

```text
┌─────────────────────────────┐
│ VISUAL                      │
│                             │
│ Authentication vs           │
│ Authorization               │
│                             │
│ ┌─────────────────────────┐ │
│ │ AUTHENTICATION          │ │
│ │                         │ │
│ │ Who are you?            │ │
│ │ Identity                │ │
│ │ Login                   │ │
│ └─────────────────────────┘ │
│                             │
│             VS              │
│                             │
│ ┌─────────────────────────┐ │
│ │ AUTHORIZATION           │ │
│ │                         │ │
│ │ What can you do?        │ │
│ │ Permissions             │ │
│ │ Access control          │ │
│ └─────────────────────────┘ │
│                             │
│ EXPLANATION                 │
│                             │
│ Authentication verifies... │
│ Authorization determines... │
└─────────────────────────────┘
```

---

# 38. V6 Information Density

| Component              | Recommendation |
| ---------------------- | -------------: |
| Concepts               |    **2 ideal** |
| Maximum concepts       |              3 |
| Comparison dimensions  |            3–6 |
| Shared characteristics |            0–3 |
| Key difference         |          **1** |
| Explanation            | 2–4 paragraphs |
| Caption                |              1 |
| Interaction            |              ❌ |
| Animation              |              ❌ |

---

# 39. V6 Best Use Cases

| Domain            | Suitability |
| ----------------- | ----------: |
| Python            |       ⭐⭐⭐⭐⭐ |
| Data Structures   |       ⭐⭐⭐⭐⭐ |
| OOP               |       ⭐⭐⭐⭐⭐ |
| NumPy             |       ⭐⭐⭐⭐⭐ |
| Pandas            |       ⭐⭐⭐⭐⭐ |
| Data Science      |       ⭐⭐⭐⭐⭐ |
| Data Engineering  |       ⭐⭐⭐⭐⭐ |
| Full-stack        |       ⭐⭐⭐⭐⭐ |
| Cyber Security    |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking   |       ⭐⭐⭐⭐⭐ |
| Quantum Computing |       ⭐⭐⭐⭐⭐ |
| Databases         |       ⭐⭐⭐⭐⭐ |
| Networking        |       ⭐⭐⭐⭐⭐ |
| Cloud Computing   |       ⭐⭐⭐⭐⭐ |
| AI/ML             |       ⭐⭐⭐⭐⭐ |

---

# 40. V6 What We Should Avoid

### ❌ Five or six concepts

The comparison becomes unreadable.

### ❌ Unequal dimensions

If Concept A has five characteristics and Concept B has fifteen unrelated characteristics, the comparison becomes biased.

### ❌ Long paragraphs in comparison columns

Use the explanation section.

### ❌ Decorative VS element

`VS` should communicate comparison.

### ❌ Mixing comparison with workflow

If the purpose is "what happens next", use V4.

### ❌ Mixing comparison with concept relationships

If the purpose is "how concepts relate", use V5.

---

# 41. V6 Component Architecture

```text
VisualBlock
│
└── V6 Renderer
      │
      ├── Header
      │
      ├── ComparisonFigure
      │    │
      │    ├── ConceptA
      │    │    ├── VS Marker
      │    │    └── ConceptB
      │    │
      │    ├── ComparisonDimensions
      │    └── SharedCharacteristics
      │
      ├── KeyDifference
      │
      ├── Caption
      │
      └── ExplanationSection
```

---

# 42. V6 Validation Rules

| Field                        |        Required |
| ---------------------------- | --------------: |
| `type`                       |               ✅ |
| `version`                    |               ✅ |
| `title`                      |               ✅ |
| `visual`                     |               ✅ |
| `visual.type`                |  **comparison** |
| `items`                      |           **✅** |
| Minimum items                |               2 |
| Maximum recommended          |               3 |
| Dimensions                   | **Recommended** |
| Shared characteristics       |        Optional |
| Key difference               |     Recommended |
| Explanation                  |     Recommended |
| Caption                      |     Recommended |
| Interaction                  |               ❌ |
| Animation                    |               ❌ |
| Arbitrary unequal dimensions |               ❌ |

---

# 43. V5 vs V6

| Feature                |       V5 |               **V6** |
| ---------------------- | -------: | -------------------: |
| Central concept        | **Core** |                    ❌ |
| Related concepts       | **Core** |                    ❌ |
| Concept relationships  | **Core** |             Optional |
| Comparison             |        ❌ |             **Core** |
| Similarities           | Optional | **Core/Recommended** |
| Differences            | Optional |             **Core** |
| Shared characteristics |        — |        **Supported** |
| Key difference         |        — |      **Recommended** |
| Explanation            |        ✅ |                    ✅ |
| Interaction            |        ❌ |                    ❌ |
| Animation              |        ❌ |                    ❌ |

The progression is now:

```text
V1 → SHOW
V2 → IDENTIFY
V3 → EXPLAIN
V4 → PROGRESS
V5 → CONNECT
V6 → COMPARE
```

---

# 44. V6 Final Technical Specification

| Area                   | V6 Decision                                           |
| ---------------------- | ----------------------------------------------------- |
| Block                  | **VisualBlock**                                       |
| Version                | **V6**                                                |
| Name                   | **Visual + Comparison**                               |
| Main question          | **How are these concepts different or similar?**      |
| Structure              | **Concept A ↔ Concept B → Differences → Explanation** |
| Best for               | Similar/competing concepts                            |
| Primary                | **#F54A8D**                                           |
| Secondary              | **#0B1B3D**                                           |
| Theme                  | Light                                                 |
| Gradient               | ❌                                                     |
| Dark theme             | ❌                                                     |
| A4                     | **Portrait**                                          |
| Concepts               | 2 ideal                                               |
| Maximum                | 3                                                     |
| Dimensions             | 3–6                                                   |
| Shared characteristics | Optional                                              |
| Key difference         | Recommended                                           |
| `<figure>`             | Main visual                                           |
| `<figcaption>`         | Caption                                               |
| `<h2>`                 | Main title                                            |
| `<h3>`                 | Concept / explanation heading                         |
| `<p>`                  | Explanation                                           |
| SVG                    | Supported                                             |
| Structured JSON        | Supported                                             |
| Accessibility          | Required                                              |
| Interaction            | ❌                                                     |
| Animation              | ❌                                                     |
| JSON-driven            | ✅                                                     |
| Responsive             | ✅                                                     |
| Learning level         | **Intermediate**                                      |

---

# 45. V6 Final Mental Model

```text
                  COMPARISON
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      CONCEPT A               CONCEPT B
          │                       │
     ┌────┼────┐             ┌────┼────┐
     ▼    ▼    ▼             ▼    ▼    ▼
    A1   A2   A3             B1   B2   B3
          │                       │
          └──────────┬────────────┘
                     ▼
              KEY DIFFERENCE
                     │
                     ▼
                EXPLANATION
```

The defining principle is:

> **V6 turns comparison into a visual learning model by placing related concepts side by side, aligning their meaningful characteristics, highlighting shared properties and differences, and explaining the most important distinction.**

---

## VisualBlock Progress

| Version | Name                       | Status              |
| ------- | -------------------------- | ------------------- |
| **V1**  | Basic Visual               | ✅                   |
| **V2**  | Visual + Labels            | ✅                   |
| **V3**  | Visual + Explanation       | ✅                   |
| **V4**  | Visual + Step-by-Step Flow | ✅                   |
| **V5**  | Visual + Concept Map       | ✅                   |
| **V6**  | **Visual + Comparison**    | ✅ **Completed now** |
| V7      | —                          | ⏳                   |
| V8      | —                          | ⏳                   |

**V6 is complete. The next version is V7.**



```python

```

# BLOCK 5 — VisualBlock

## V7 — Visual + Annotated Diagram

We continue the same one-version-at-a-time architecture.

The VisualBlock progression is now:

| Version | Purpose                                                                 |
| ------- | ----------------------------------------------------------------------- |
| **V1**  | Show the concept visually                                               |
| **V2**  | Identify important parts                                                |
| **V3**  | Explain the visual                                                      |
| **V4**  | Show step-by-step flow                                                  |
| **V5**  | Show conceptual relationships                                           |
| **V6**  | Compare related concepts                                                |
| **V7**  | **Annotate a visual to explain specific parts directly on the diagram** |

---

# 1. V7 Definition

| Item                  | VisualBlock V7                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Version**           | **V7**                                                                                                             |
| **Name**              | **Visual + Annotated Diagram**                                                                                     |
| **Structure**         | Diagram → numbered/callout annotations → explanations                                                              |
| **Primary purpose**   | Explain specific parts of a complex visual directly through annotations                                            |
| **Best for**          | Architecture diagrams, memory diagrams, code execution models, system diagrams, hardware diagrams, data structures |
| **Learning question** | **“What exactly is happening at each important part of this diagram?”**                                            |
| **Complexity**        | Intermediate → Advanced                                                                                            |
| **SUIA Primary**      | **#F54A8D**                                                                                                        |
| **SUIA Secondary**    | **#0B1B3D**                                                                                                        |
| **Theme**             | Light                                                                                                              |
| **Gradient**          | ❌                                                                                                                  |
| **Dark theme**        | ❌                                                                                                                  |
| **A4**                | **Portrait**                                                                                                       |

---

# 2. Why V7 Is Different

V6 compares two concepts.

V7 returns to **one complex visual** and explains its internal parts.

### V6

```text
Concept A       VS       Concept B
```

### V7

```text
                 ┌──────────────┐
                 │   SYSTEM     │
                 └──────┬───────┘
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
            ①           ②          ③
         Component   Component   Component
             │          │          │
             └──────────┴──────────┘
                    annotations
```

The annotations point to **specific locations**.

---

# 3. V7 Core Learning Principle

The learning sequence is:

```text
SEE THE WHOLE
      ↓
LOCATE IMPORTANT PART
      ↓
IDENTIFY PART
      ↓
EXPLAIN PART
      ↓
UNDERSTAND RELATIONSHIP
```

V7 is particularly powerful when a diagram would otherwise require a large amount of prose.

---

# 4. Canonical V7 Structure

```text
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Python Object Memory Model                   │
│                                              │
│       ┌───────────────────────────┐          │
│   ① → │ Object                    │          │
│       │                           │          │
│       │  ┌─────────────┐          │          │
│   ② → │  │ Attributes │          │          │
│       │  └─────────────┘          │          │
│       │                           │          │
│   ③ → │  Reference Count          │          │
│       └───────────────────────────┘          │
│                         ↑                    │
│                         │                    │
│                    ④ Annotation              │
│                                              │
│ ANNOTATIONS                                  │
│ ① Object — represents the Python object.    │
│ ② Attributes — store associated state.     │
│ ③ Reference count — tracks references.     │
│                                              │
│ CAPTION                                      │
└──────────────────────────────────────────────┘
```

The critical distinction is:

> **The annotation is anchored to a specific visual element.**

---

# 5. V7 Annotation Anatomy

Each annotation normally contains:

```text
Annotation Number
       +
Target
       +
Short Explanation
```

Example:

```text
① Reference Count

Tracks the number of references
associated with the object.
```

---

# 6. V7 Annotation Types

The renderer should support several annotation styles.

### Numbered callout

```text
① ─────────► Component
```

### Arrow callout

```text
          ┌──────────────┐
─────────►│ Component    │
          └──────────────┘
```

### Bracket annotation

```text
        ┌───────────────┐
        │ Components    │
        └───────────────┘
        ╰───────────────╯
```

### Highlight annotation

```text
┌──────────────────────┐
│  IMPORTANT COMPONENT  │
└──────────────────────┘
```

The default should remain clean and educational.

---

# 7. V7 Example — Full-Stack Architecture

### Diagram

```text
                         Application
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
      ① Frontend          ② Backend          ③ Database
          │                   │                   │
          │                   │                   │
          └───────────────────┴───────────────────┘
```

Annotations:

```text
① Frontend
Responsible for the user-facing interface.

② Backend
Processes application requests and business logic.

③ Database
Stores persistent application data.
```

This is more precise than a generic architecture explanation because each explanation is tied to a specific component.

---

# 8. V7 Example — Python List

```text
                 Python List
              ┌───────────────┐
           ①  │  [10, 20, 30] │
              └───────────────┘
                 │   │   │
                 │   │   │
                 ▼   ▼   ▼
              ② Elements
```

Annotations:

```text
① List object

The list stores references to its elements.

② Elements

Each position contains a reference to an object.
```

This is especially useful when teaching Python memory representation.

---

# 9. V7 Example — Stack

```text
              Stack
        ┌──────────────┐
    ① → │     C        │
        ├──────────────┤
    ② → │     B        │
        ├──────────────┤
    ③ → │     A        │
        └──────────────┘
              ↑
             TOP
```

Annotations:

```text
① C
Most recently pushed item.

② B
Item below the top element.

③ A
Bottom element of the stack.

TOP
New elements are added and removed here.
```

This makes the data structure much easier to understand.

---

# 10. V7 Example — Binary Tree

```text
                 ① 50
                /    \
               /      \
          ② 30        ③ 70
           /  \        /  \
          ④ 20 ⑤ 40  ⑥ 60 ⑦ 80
```

Annotations:

* ① Root node
* ② Left child
* ③ Right child
* ④ Leaf node
* ⑤ Leaf node
* ⑥ Leaf node
* ⑦ Leaf node

This is an excellent V7 use case because the learner can identify structural roles directly.

---

# 11. V7 Example — Pandas DataFrame

```text
                 DataFrame

          Name       Age       Score
       ┌────────┬────────┬──────────┐
   ① → │ Alice  │  25    │   90     │
       ├────────┼────────┼──────────┤
   ② → │ Bob    │  27    │   85     │
       └────────┴────────┴──────────┘
          ↑          ↑          ↑
          │          │          │
          ③          ④          ⑤
```

Annotations:

```text
① Row
Represents one record.

③ Column
Contains values for a particular field.

④ Index
Identifies a row position/label.

⑤ Score column
Contains the score values.
```

---

# 12. V7 Example — NumPy ndarray

```text
              ndarray

        columns →
          0    1    2

       ┌────┬────┬────┐
   ①   │ 10 │ 20 │ 30 │
       ├────┼────┼────┤
   ②   │ 40 │ 50 │ 60 │
       └────┴────┴────┘
        ↑
        rows

   ③ Shape = (2, 3)
```

Annotations explain:

```text
① First row
② Second row
③ Shape
Two rows and three columns.
```

---

# 13. V7 Example — Data Engineering Pipeline

```text
Source
  │
  ▼
① Extract
  │
  ▼
② Transform
  │
  ▼
③ Validate
  │
  ▼
④ Load
  │
  ▼
Warehouse
```

Each step can have an anchored annotation:

```text
① Extract
Obtain data from the source.

② Transform
Convert the data into the required structure.

③ Validate
Check data quality and expected constraints.

④ Load
Write the processed data to the destination.
```

Notice that this differs from V4.

### V4

Focuses on:

> **sequence**

### V7

Focuses on:

> **specific explanation of each visual element**

---

# 14. V7 Example — Authentication Architecture

```text
                  User
                   │
                   ▼
              ① Login
                   │
                   ▼
            ② Identity Service
                   │
                   ▼
              ③ Token
                   │
                   ▼
             ④ API Gateway
                   │
                   ▼
              Application
```

Annotations can explain each numbered component without turning the diagram into a paragraph-heavy block.

---

# 15. V7 Example — Data Science Model

```text
              Dataset
                 │
                 ▼
          ① Features
                 │
                 ▼
          ② Model
                 │
                 ▼
          ③ Prediction
                 │
                 ▼
          ④ Evaluation
```

Annotations:

```text
① Features
Input variables supplied to the model.

② Model
Learns a relationship from training data.

③ Prediction
Produces an output for new input.

④ Evaluation
Measures model performance.
```

---

# 16. V7 Example — Cyber Security Architecture

```text
Internet
    │
    ▼
① Firewall
    │
    ▼
② WAF
    │
    ▼
③ Application
    │
    ▼
④ Database
```

Annotations:

```text
① Firewall
Controls network traffic according to defined rules.

② WAF
Provides application-layer protection for web traffic.

③ Application
Processes permitted application requests.

④ Database
Stores application data.
```

---

# 17. V7 Example — Quantum Computing

```text
        Qubit State
             │
             ▼
       ① ─── H Gate
             │
             ▼
       ② ─── X Gate
             │
             ▼
       ③ ─── Measurement
             │
             ▼
          Classical
           Result
```

Annotations explain exactly what each operation represents.

---

# 18. V7 Diagram + Annotation Relationship

The most important design rule:

```text
Diagram Element
       │
       │ anchor
       ▼
Annotation
       │
       ▼
Explanation
```

Not:

```text
Diagram
   ↓
Large unrelated paragraph
```

The learner should be able to mentally trace:

> **“This explanation belongs to this part of the diagram.”**

---

# 19. V7 Annotation Positioning

Annotations can appear:

### Left

```text
① Explanation ───────► Component
```

### Right

```text
Component ◄─────────── ② Explanation
```

### Above

```text
       ③ Explanation
              │
              ▼
         Component
```

### Below

```text
         Component
              │
              ▼
       ④ Explanation
```

The renderer should automatically choose positions where possible.

---

# 20. V7 A4 Portrait Layout

```text
┌──────────────────────────────────────────────┐
│                                              │
│ VISUAL                                       │
│                                              │
│ Three-Tier Architecture                      │
│                                              │
│        ① ───────► ┌──────────────┐          │
│                    │  Frontend    │          │
│                    └──────┬───────┘          │
│                           │                  │
│        ② ────────────────► Backend          │
│                           │                  │
│                           ▼                  │
│                    ┌──────────────┐          │
│        ③ ───────►  │  Database    │          │
│                    └──────────────┘          │
│                                              │
│ ANNOTATIONS                                  │
│                                              │
│ ① Frontend — user-facing interface          │
│ ② Backend — application processing          │
│ ③ Database — persistent storage             │
│                                              │
│ CAPTION                                      │
└──────────────────────────────────────────────┘
```

---

# 21. V7 A4 Space Distribution

| Region                  | Approximate Space |
| ----------------------- | ----------------: |
| Header                  |             8–10% |
| Title                   |                7% |
| Annotated diagram       |        **50–55%** |
| Annotation explanations |            15–20% |
| Caption                 |              5–7% |
| Whitespace              |         Remaining |

---

# 22. V7 Why the Annotation Area Is Separate

Although the diagram can contain short labels, long explanations should not be placed directly beside every arrow.

Instead:

```text
Diagram
   ↓
① ② ③
   ↓
Annotation list
```

This keeps the visual clean.

---

# 23. V7 SUIA Color Strategy

| Role                      | Color       |
| ------------------------- | ----------- |
| Primary Brand Pink        | **#F54A8D** |
| Secondary Brand Dark Blue | **#0B1B3D** |

### Primary Pink

Use for:

* annotation numbers
* callout dots
* highlighted target
* annotation heading
* selected visual component

### Secondary Navy

Use for:

* diagram structure
* labels
* arrows
* title
* explanation
* caption
* annotation text

---

# 24. V7 70/30 Rule

The visual should remain predominantly navy/light:

```text
Navy + White
≈ 70%
```

Pink:

```text
Pink
≈ 30%
```

Pink should act as a **navigation system**.

For example:

```text
①
②
③
```

are pink, while the diagram itself remains primarily navy.

This naturally guides the learner:

```text
① → Look here
② → Look here
③ → Look here
```

---

# 25. HTML Semantic Structure

```text
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <figure>
│    ├── Annotated Diagram
│    └── <figcaption>
│
└── <section>
     ├── <h3>
     │
     └── <ol>
          ├── <li>
          ├── <li>
          └── <li>
```

Using `<ol>` for annotations is semantically appropriate because annotations are numbered.

---

# 26. HTML Tag-by-Tag Color Table

| HTML Tag       | Purpose               | Color       |
| -------------- | --------------------- | ----------- |
| `<section>`    | Root block            | Neutral     |
| `<header>`     | Block header          | Neutral     |
| `<span>`       | VISUAL eyebrow        | **#F54A8D** |
| `<h2>`         | Main title            | **#0B1B3D** |
| `<figure>`     | Diagram               | Neutral     |
| `<div>`        | Diagram elements      | Neutral     |
| `<strong>`     | Diagram labels        | **#0B1B3D** |
| `<span>`       | Annotation number     | **#F54A8D** |
| `<figcaption>` | Caption               | **#0B1B3D** |
| `<section>`    | Annotation area       | Neutral     |
| `<h3>`         | Annotation heading    | **#F54A8D** |
| `<ol>`         | Ordered annotations   | **#0B1B3D** |
| `<li>`         | Individual annotation | **#0B1B3D** |
| `<p>`          | Explanation           | **#0B1B3D** |

---

# 27. SVG Structure

V7 is especially suitable for SVG.

```text
<svg>
    <g class="diagram">
        <rect />
        <text />
        <path />
    </g>

    <g class="annotation">
        <circle />
        <text />
        <path />
    </g>

    <g class="annotation">
        <circle />
        <text />
        <path />
    </g>
</svg>
```

---

# 28. Annotation Anchor Model

Each annotation should identify its target:

```json
{
  "id": "frontend",
  "target": "frontend-node",
  "number": 1,
  "title": "Frontend",
  "explanation": "Handles the user-facing interface."
}
```

The renderer knows:

```text
target
  ↓
frontend-node
  ↓
draw connector
```

---

# 29. Complete V7 HTML

```html
<section
    class="tutorial-block visual-block visual-v7"
    data-block="visual"
    data-version="V7"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Three-Tier Application Architecture
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="annotated-diagram"
            role="img"
            aria-label="
                Three-tier application architecture with
                annotated frontend, backend, and database components
            "
        >

            <div
                id="frontend-node"
                class="diagram-node"
            >
                Frontend
            </div>


            <div
                id="backend-node"
                class="diagram-node"
            >
                Backend
            </div>


            <div
                id="database-node"
                class="diagram-node"
            >
                Database
            </div>


            <div class="diagram-connection">
                ↓
            </div>

        </div>


        <figcaption class="visual-caption">

            Three-tier architecture with annotated responsibilities.

        </figcaption>

    </figure>


    <section class="visual-annotations">

        <h3>
            Annotations
        </h3>

        <ol>

            <li>
                <strong>Frontend</strong>
                — Handles the user-facing interface.
            </li>

            <li>
                <strong>Backend</strong>
                — Processes application requests and business logic.
            </li>

            <li>
                <strong>Database</strong>
                — Stores persistent application data.
            </li>

        </ol>

    </section>

</section>
```

---

# 30. V7 JSON Structure

```json
{
  "type": "visual",
  "version": "V7",

  "content": {

    "title": "Three-Tier Application Architecture",

    "visual": {

      "type": "annotated-diagram",

      "ariaLabel": "Three-tier application architecture with annotated frontend, backend, and database components",

      "elements": [
        {
          "id": "frontend-node",
          "type": "node",
          "label": "Frontend"
        },
        {
          "id": "backend-node",
          "type": "node",
          "label": "Backend"
        },
        {
          "id": "database-node",
          "type": "node",
          "label": "Database"
        }
      ],

      "connections": [
        {
          "from": "frontend-node",
          "to": "backend-node"
        },
        {
          "from": "backend-node",
          "to": "database-node"
        }
      ]
    },

    "annotations": [
      {
        "id": "annotation-1",
        "number": 1,
        "target": "frontend-node",
        "title": "Frontend",
        "explanation": "Handles the user-facing interface."
      },
      {
        "id": "annotation-2",
        "number": 2,
        "target": "backend-node",
        "title": "Backend",
        "explanation": "Processes application requests and business logic."
      },
      {
        "id": "annotation-3",
        "number": 3,
        "target": "database-node",
        "title": "Database",
        "explanation": "Stores persistent application data."
      }
    ],

    "caption": "Three-tier architecture with annotated responsibilities."
  }
}
```

---

# 31. V7 Annotation Metadata

Each annotation should have:

| Field         | Purpose                         |
| ------------- | ------------------------------- |
| `id`          | Unique annotation               |
| `number`      | Visual identifier               |
| `target`      | Diagram element being explained |
| `title`       | Name of target                  |
| `explanation` | Meaning                         |
| `position`    | Optional placement              |
| `highlight`   | Optional emphasis               |

Example:

```json
{
  "id": "annotation-2",
  "number": 2,
  "target": "backend-node",
  "title": "Backend",
  "explanation": "Processes application requests and business logic.",
  "position": "right",
  "highlight": true
}
```

---

# 32. V7 Annotation Position

Possible values:

```text
left
right
top
bottom
auto
```

Default:

```text
auto
```

The renderer should choose the position that creates the least overlap.

---

# 33. V7 Highlighting

A selected annotation can highlight its target:

```json
{
  "target": "backend-node",
  "highlight": true
}
```

Visually:

```text
┌──────────────────┐
│     Backend      │  ← pink border/highlight
└──────────────────┘
         ↑
         │
         ②
```

This creates a clear visual connection between annotation and target.

---

# 34. V7 Accessibility

The accessibility layer should include the annotation relationships.

For example:

> Three-tier application architecture. The frontend is the user-facing layer. The backend processes application requests and business logic. The database stores persistent application data.

The numbered annotations should not be the only way the meaning is communicated.

---

# 35. V7 Responsive Design

Desktop:

```text
Annotation ─────► Diagram
```

A4:

```text
Diagram
   ↓
Annotation list
```

Mobile:

```text
Diagram
   ↓
① Explanation
② Explanation
③ Explanation
```

The renderer should avoid placing tiny callouts around a narrow mobile diagram.

---

# 36. V7 Mobile Layout

```text
┌─────────────────────────────┐
│ VISUAL                      │
│                             │
│ Three-Tier Architecture     │
│                             │
│      ┌──────────────┐       │
│ ① →  │  Frontend    │       │
│      └──────┬───────┘       │
│             ↓               │
│      ┌──────────────┐       │
│ ② →  │  Backend     │       │
│      └──────┬───────┘       │
│             ↓               │
│      ┌──────────────┐       │
│ ③ →  │  Database    │       │
│      └──────────────┘       │
│                             │
│ ANNOTATIONS                 │
│                             │
│ ① Frontend                  │
│    User-facing interface.   │
│                             │
│ ② Backend                   │
│    Application processing.  │
│                             │
│ ③ Database                  │
│    Persistent storage.      │
└─────────────────────────────┘
```

---

# 37. V7 Information Density

| Component           | Recommendation |
| ------------------- | -------------: |
| Main diagram        |          **1** |
| Annotations         |  **3–8 ideal** |
| Maximum             |          10–12 |
| Annotation text     |      1–3 lines |
| Target              |       Required |
| Relationship arrows |       Optional |
| Explanation section |       Optional |
| Caption             |    Recommended |
| Interaction         |              ❌ |
| Animation           |              ❌ |

If the learner needs more than 10–12 annotations, the visual should probably be divided into multiple blocks.

---

# 38. V7 Best Use Cases

| Domain                      | Suitability |
| --------------------------- | ----------: |
| Python internals            |       ⭐⭐⭐⭐⭐ |
| Memory management           |       ⭐⭐⭐⭐⭐ |
| OOP                         |       ⭐⭐⭐⭐⭐ |
| Data structures             |       ⭐⭐⭐⭐⭐ |
| NumPy arrays                |       ⭐⭐⭐⭐⭐ |
| Pandas DataFrame            |       ⭐⭐⭐⭐⭐ |
| Full-stack architecture     |       ⭐⭐⭐⭐⭐ |
| API architecture            |       ⭐⭐⭐⭐⭐ |
| Data pipelines              |       ⭐⭐⭐⭐⭐ |
| Data Science models         |       ⭐⭐⭐⭐⭐ |
| Cyber Security architecture |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking methodology |        ⭐⭐⭐⭐ |
| Quantum computing           |       ⭐⭐⭐⭐⭐ |
| Networking                  |       ⭐⭐⭐⭐⭐ |
| Database internals          |       ⭐⭐⭐⭐⭐ |

---

# 39. V7 What We Should Avoid

### ❌ Turning every visual element into an annotation

Only annotate meaningful learning points.

### ❌ Long annotation paragraphs

Annotations should be concise.

### ❌ Random callout arrows

Every callout must point to a meaningful target.

### ❌ Excessive crossing lines

They make diagrams difficult to understand.

### ❌ Tiny text

A4 diagrams must remain readable.

### ❌ Replacing the entire explanation with annotations

V7 is still a visual teaching block, not a full chapter.

---

# 40. V6 vs V7

| Feature                |       V6 |                    **V7** |
| ---------------------- | -------: | ------------------------: |
| Primary purpose        |  Compare | **Explain diagram parts** |
| Concepts               |      2–3 |           One main visual |
| Side-by-side layout    |     Core |                  Optional |
| Central concept        | Optional |                  Optional |
| Annotations            |        ❌ |                  **Core** |
| Target anchors         |        ❌ |                  **Core** |
| Numbered callouts      |        ❌ |                  **Core** |
| Component explanations | Optional |                  **Core** |
| Key difference         |     Core |                         ❌ |
| Relationships          | Optional |                 Supported |
| Explanation            |        ✅ |                  Optional |
| Interaction            |        ❌ |                         ❌ |
| Animation              |        ❌ |                         ❌ |

The progression is now:

```text
V1 → SHOW
V2 → IDENTIFY
V3 → EXPLAIN
V4 → PROGRESS
V5 → CONNECT
V6 → COMPARE
V7 → ANNOTATE
```

---

# 41. V7 Component Architecture

```text
VisualBlock
│
└── V7 Renderer
      │
      ├── Header
      │
      ├── AnnotatedFigure
      │    │
      │    ├── DiagramCanvas
      │    │    ├── DiagramNodes
      │    │    ├── Connections
      │    │    └── HighlightTargets
      │    │
      │    └── Callouts
      │         ├── Number
      │         ├── Connector
      │         └── Target
      │
      ├── Caption
      │
      └── AnnotationList
           ├── Annotation 1
           ├── Annotation 2
           └── Annotation N
```

---

# 42. V7 Validation Rules

| Field                    |              Required |
| ------------------------ | --------------------: |
| `type`                   |                     ✅ |
| `version`                |                     ✅ |
| `title`                  |                     ✅ |
| `visual`                 |                     ✅ |
| `visual.type`            | **annotated-diagram** |
| `elements`               |                 **✅** |
| Element `id`             |                     ✅ |
| Element `label`          |           Recommended |
| `annotations`            |                 **✅** |
| Annotation `number`      |                 **✅** |
| Annotation `target`      |                 **✅** |
| Annotation `title`       |           Recommended |
| Annotation `explanation` |                 **✅** |
| Caption                  |           Recommended |
| Highlight                |              Optional |
| Position                 |              Optional |
| Interaction              |                     ❌ |
| Animation                |                     ❌ |

---

# 43. V7 Final Technical Specification

| Area            | V7 Decision                                           |
| --------------- | ----------------------------------------------------- |
| Block           | **VisualBlock**                                       |
| Version         | **V7**                                                |
| Name            | **Visual + Annotated Diagram**                        |
| Main question   | **What exactly is happening at each important part?** |
| Structure       | **Diagram → Callouts → Targeted Explanations**        |
| Best for        | Complex diagrams and internal structures              |
| Primary         | **#F54A8D**                                           |
| Secondary       | **#0B1B3D**                                           |
| Theme           | Light                                                 |
| Gradient        | ❌                                                     |
| Dark theme      | ❌                                                     |
| A4              | **Portrait**                                          |
| Main diagram    | 1                                                     |
| Annotations     | 3–8 ideal                                             |
| Maximum         | 10–12                                                 |
| Target anchors  | Required                                              |
| Numbering       | Required                                              |
| Highlighting    | Optional                                              |
| `<figure>`      | Main visual                                           |
| `<figcaption>`  | Caption                                               |
| `<h2>`          | Main title                                            |
| `<h3>`          | Annotation heading                                    |
| `<ol>`          | Annotation list                                       |
| `<li>`          | Annotation                                            |
| SVG             | **Highly recommended**                                |
| Structured JSON | Supported                                             |
| Accessibility   | Required                                              |
| Interaction     | ❌                                                     |
| Animation       | ❌                                                     |
| JSON-driven     | ✅                                                     |
| Responsive      | ✅                                                     |
| Learning level  | **Intermediate → Advanced**                           |

---

# 44. V7 Final Mental Model

```text
                       COMPLETE DIAGRAM
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
         ①                   ②                   ③
          │                   │                   │
          ▼                   ▼                   ▼
      PART A               PART B               PART C
          │                   │                   │
          ▼                   ▼                   ▼
     EXPLANATION          EXPLANATION          EXPLANATION
```

The defining principle is:

> **V7 connects explanations directly to specific visual elements, allowing the learner to understand a complex diagram part-by-part without losing sight of the complete system.**

---

## VisualBlock Progress

| Version | Name                           | Status              |
| ------- | ------------------------------ | ------------------- |
| **V1**  | Basic Visual                   | ✅                   |
| **V2**  | Visual + Labels                | ✅                   |
| **V3**  | Visual + Explanation           | ✅                   |
| **V4**  | Visual + Step-by-Step Flow     | ✅                   |
| **V5**  | Visual + Concept Map           | ✅                   |
| **V6**  | Visual + Comparison            | ✅                   |
| **V7**  | **Visual + Annotated Diagram** | ✅ **Completed now** |
| V8      | —                              | ⏳                   |

**V7 is complete. The next and final VisualBlock version is V8.**



```python

```

# BLOCK 5 — VisualBlock

## V8 — Complete Visual Learning Model

We have now reached the **final VisualBlock version**.

The complete progression is:

| Version | Purpose                            |
| ------- | ---------------------------------- |
| **V1**  | Show the concept visually          |
| **V2**  | Identify important parts           |
| **V3**  | Explain the visual                 |
| **V4**  | Show step-by-step flow             |
| **V5**  | Show conceptual relationships      |
| **V6**  | Compare related concepts           |
| **V7**  | Annotate specific diagram parts    |
| **V8**  | **Complete Visual Learning Model** |

V8 is therefore not simply "V7 with more content."

It is the **premium/default VisualBlock** that combines the most useful visual teaching capabilities into one coherent learning experience.

---

# 1. V8 Definition

| Item                  | VisualBlock V8                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Version**           | **V8**                                                                                                                  |
| **Name**              | **Complete Visual Learning Model**                                                                                      |
| **Structure**         | Visual → Labels → Relationships/Flow → Annotations → Explanation → Key Insight → Caption                                |
| **Primary purpose**   | Provide a complete visual explanation of a complex concept                                                              |
| **Best for**          | Advanced programming, architecture, algorithms, data science, data engineering, cybersecurity, AI/ML, quantum computing |
| **Learning question** | **“What is this, what are its parts, how are they related, how does it work, and what should I remember?”**             |
| **Complexity**        | Intermediate → Advanced                                                                                                 |
| **SUIA Primary**      | **#F54A8D**                                                                                                             |
| **SUIA Secondary**    | **#0B1B3D**                                                                                                             |
| **Theme**             | Light                                                                                                                   |
| **Gradient**          | ❌                                                                                                                       |
| **Dark theme**        | ❌                                                                                                                       |
| **A4**                | **Portrait**                                                                                                            |

---

# 2. Why V8 Exists

The previous versions solve individual visual-learning problems.

### V1

> What does it look like?

### V2

> What are the important parts?

### V3

> What does it mean?

### V4

> What happens step-by-step?

### V5

> How are the concepts connected?

### V6

> How are these concepts different?

### V7

> What does each important part of this diagram mean?

### V8

> **Can I understand the complete concept from one carefully designed visual learning model?**

That is the purpose of V8.

---

# 3. V8 Core Learning Principle

V8 follows:

```text id="v8flow"
SEE
 ↓
IDENTIFY
 ↓
CONNECT
 ↓
UNDERSTAND
 ↓
FOLLOW
 ↓
INTERPRET
 ↓
REMEMBER
```

This is why V8 should be reserved for concepts where a richer visual model genuinely improves understanding.

It should **not** be used simply because more content is available.

---

# 4. V8 Canonical Structure

The canonical V8 structure is:

```text id="v8canonical"
Visual
   ↓
Labels
   ↓
Relationships / Flow
   ↓
Annotations
   ↓
Explanation
   ↓
Key Insight
   ↓
Caption
```

Visually:

```text id="v8diagram"
┌──────────────────────────────────────────────┐
│ VISUAL                                       │
│                                              │
│ Complete Application Request Model           │
│                                              │
│              ① User                         │
│                  │                           │
│                  ▼                           │
│          ┌───────────────┐                   │
│          │ ② Frontend    │                   │
│          └───────┬───────┘                   │
│                  │ Request                   │
│                  ▼                           │
│          ┌───────────────┐                   │
│          │ ③ API         │                   │
│          └───────┬───────┘                   │
│                  │                           │
│                  ▼                           │
│          ┌───────────────┐                   │
│          │ ④ Backend     │                   │
│          └───────┬───────┘                   │
│                  │ Query                     │
│                  ▼                           │
│          ┌───────────────┐                   │
│          │ ⑤ Database    │                   │
│          └───────────────┘                   │
│                                              │
│ ANNOTATIONS                                  │
│ ① User — initiates the action                │
│ ② Frontend — collects input                  │
│ ③ API — receives the request                 │
│ ④ Backend — processes business logic         │
│ ⑤ Database — stores/retrieves data           │
│                                              │
│ EXPLANATION                                  │
│ The request travels through...               │
│                                              │
│ KEY INSIGHT                                  │
│ Each layer has a distinct responsibility.    │
│                                              │
│ CAPTION                                      │
└──────────────────────────────────────────────┘
```

---

# 5. V8 Is a Composition, Not a New Visual Type

This is a very important architectural decision.

V8 should **not** introduce an entirely new visual rendering engine.

Instead:

```text id="v8composition"
V8
│
├── V1 Visual
├── V2 Labels
├── V3 Explanation
├── V4 Flow
├── V5 Relationships
├── V6 Comparison capability
└── V7 Annotation capability
```

The V8 renderer composes the capabilities that are appropriate for the selected content.

---

# 6. V8 Does NOT Mean Everything Must Be Used

This is critical.

A V8 block should not automatically contain:

```text
Visual
+
Flow
+
Concept map
+
Comparison
+
10 annotations
+
Huge explanation
```

That would create an overloaded page.

Instead:

> **V8 chooses the visual mechanisms that best explain the particular concept.**

For example:

### Architecture

Use:

```text
Visual + Labels + Relationships + Annotations + Explanation
```

### Process

Use:

```text
Visual + Flow + Annotations + Explanation
```

### Comparison

Use:

```text
Visual + Comparison + Key Insight + Explanation
```

### Abstract concept

Use:

```text
Visual + Concept Map + Explanation + Key Insight
```

---

# 7. V8 Example — Full-Stack Architecture

This is an ideal V8 example.

```text id="v8fullstack"
                         USER
                          ①
                          │
                          ▼
                  ┌──────────────┐
                  │   FRONTEND   │
                  │      ②      │
                  └──────┬───────┘
                         │ HTTP
                         ▼
                  ┌──────────────┐
                  │     API      │
                  │      ③      │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   BACKEND    │
                  │      ④      │
                  └──────┬───────┘
                         │ Query
                         ▼
                  ┌──────────────┐
                  │   DATABASE   │
                  │      ⑤      │
                  └──────────────┘
```

### Annotations

```text id="v8ann"
① User
Initiates the interaction.

② Frontend
Presents the interface and collects user input.

③ API
Provides the communication boundary.

④ Backend
Processes application and business logic.

⑤ Database
Stores and retrieves persistent information.
```

### Key Insight

> Each layer has a distinct responsibility, and communication between layers allows the complete application request to be processed.

---

# 8. V8 Example — Python Exception Propagation

For your Python Exception Handling course, V8 can represent:

```text id="v8exception"
                 Function A
                     │
                     ▼
                 Function B
                     │
                     ▼
                 Function C
                     │
                     ▼
               Exception
                     │
                     ▲
              Search Handler
                     │
              ┌──────┴──────┐
              │             │
            Found          Not Found
              │             │
              ▼             ▼
           Handle       Stack Unwinding
                            │
                            ▼
                       Caller Frame
                            │
                            ▼
                       Propagation
```

Annotations explain:

```text
① Exception originates
② Current frame checks for handler
③ Matching handler may handle it
④ If no handler exists, stack unwinding occurs
⑤ Exception propagates to the caller
```

### Key Insight

> Exception propagation is controlled by the search for a matching handler as execution moves through the call stack.

This is much more educational than a simple arrow diagram.

---

# 9. V8 Example — OOP

```text id="v8oop"
                         OOP
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
       Class           Object       Encapsulation
          │               │
       creates         contains
          │               │
          ▼               ▼
       Instance         State
          │
          ▼
     Inheritance
          │
          ▼
     Polymorphism
```

Annotations can identify:

* class
* object
* state
* behavior
* inheritance
* polymorphism

### Key Insight

> OOP organizes state and behavior into objects while providing mechanisms for reuse and abstraction.

---

# 10. V8 Example — NumPy

```text id="v8numpy"
                     ndarray
                        ①
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
      Shape           Dtype         Dimensions
        ②               ③               ④
        │
        ▼
    Operations
        │
   ┌────┼────┐
   ▼    ▼    ▼
 Index Slice Broadcast
```

### Key Insight

> NumPy's array model provides structured multidimensional numerical data together with efficient array-oriented operations.

---

# 11. V8 Example — Pandas

```text id="v8pandas"
                     DataFrame
                         ①
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
        Index          Columns         Rows
          ②              ③              ④
                           │
                           ▼
                     Selection
                           │
                           ▼
                       Filtering
                           │
                           ▼
                      Aggregation
```

This combines:

* concept map
* structure
* process
* annotation

into one coherent visual model.

---

# 12. V8 Example — Data Engineering

```text id="v8de"
                       Data Source
                           ①
                           │
                           ▼
                       Ingestion
                           ②
                           │
                           ▼
                     Transformation
                           ③
                           │
                           ▼
                       Validation
                           ④
                           │
                           ▼
                         Storage
                           ⑤
                           │
                           ▼
                       Analytics
                           ⑥
```

Annotations explain each stage.

Key Insight:

> A reliable data pipeline separates acquisition, transformation, validation, storage, and downstream consumption.

---

# 13. V8 Example — Data Science

```text id="v8ds"
                        Dataset
                           ①
                           │
                           ▼
                      Preparation
                           ②
                           │
                           ▼
                    Feature Engineering
                           ③
                           │
                           ▼
                     Model Training
                           ④
                           │
                           ▼
                       Evaluation
                           ⑤
                           │
                           ▼
                       Prediction
                           ⑥
```

The V8 version can additionally show:

```text
Training Data ─────► Model
                         │
New Data ────────────────┘
                         ▼
                     Prediction
```

This makes the distinction between training and inference clearer.

---

# 14. V8 Example — Cyber Security

```text id="v8cyber"
                     Security
                        ①
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   Prevention        Detection        Response
       ②                ③                ④
        │                │                │
        ▼                ▼                ▼
    Controls         Monitoring       Recovery
```

### Key Insight

> Effective security is layered and continuous rather than dependent on a single defensive control.

---

# 15. V8 Example — Quantum Computing

```text id="v8quantum"
                    Qubit
                      ①
                      │
                      ▼
                 Initial State
                      ②
                      │
                      ▼
                 Quantum Gates
                      ③
                      │
                      ▼
                State Evolution
                      ④
                      │
                      ▼
                 Measurement
                      ⑤
                      │
                      ▼
                Classical Result
```

Annotations explain each stage while the flow explains execution.

---

# 16. V8 Example — Authentication vs Authorization

V8 can also combine comparison with explanation:

```text id="v8auth"
       AUTHENTICATION                 AUTHORIZATION
              │                             │
              ▼                             ▼
        Who are you?                  What can you do?
              │                             │
              ▼                             ▼
          Identity                    Permissions
              │                             │
              └────────────┬────────────────┘
                           ▼
                     Access Decision
```

### Key Insight

> Authentication establishes identity; authorization determines permitted actions.

This is a case where V8 uses the **V6 comparison capability** rather than forcing a flow.

---

# 17. V8 Visual Modes

The V8 renderer should support several modes.

| Mode                | Purpose                          |
| ------------------- | -------------------------------- |
| `architecture`      | System/component relationships   |
| `flow`              | Process progression              |
| `concept-map`       | Concept relationships            |
| `comparison`        | Side-by-side concepts            |
| `annotated-diagram` | Detailed diagram explanation     |
| `hybrid`            | Combination of appropriate modes |

The default for V8 should generally be:

```text
hybrid
```

only when the content actually needs multiple visual mechanisms.

---

# 18. V8 A4 Portrait Layout

The A4 page should be deliberately structured.

```text id="v8a4"
┌──────────────────────────────────────────────┐
│                                              │
│ VISUAL                                       │
│                                              │
│ Complete Visual Learning Model               │
│                                              │
│              MAIN VISUAL                     │
│                                              │
│        ┌─────────────────────┐               │
│        │                     │               │
│        │      DIAGRAM        │               │
│        │                     │               │
│        └─────────────────────┘               │
│                                              │
│ ANNOTATIONS                                  │
│                                              │
│ ① Component explanation                      │
│ ② Component explanation                      │
│ ③ Component explanation                      │
│                                              │
│ EXPLANATION                                  │
│                                              │
│ Short conceptual explanation.                │
│                                              │
│ KEY INSIGHT                                  │
│                                              │
│ One important thing to remember.             │
│                                              │
│ CAPTION                                      │
└──────────────────────────────────────────────┘
```

---

# 19. V8 A4 Space Distribution

Because V8 is the most complete version, space must be controlled carefully.

| Region      | Approximate Space |
| ----------- | ----------------: |
| Header      |              7–8% |
| Title       |              6–7% |
| Main visual |        **40–50%** |
| Annotations |            12–18% |
| Explanation |            12–15% |
| Key Insight |              5–8% |
| Caption     |              4–6% |
| Whitespace  |         Remaining |

The visual must remain dominant.

---

# 20. V8 Must Not Become a "Content Dump"

This is one of the most important design rules.

Bad V8:

```text
Huge diagram
+
15 annotations
+
8 paragraphs
+
large table
+
code
+
multiple examples
```

That defeats the purpose.

Good V8:

```text
ONE strong visual
+
FEW meaningful annotations
+
SHORT explanation
+
ONE key insight
```

---

# 21. V8 Explanation

Recommended:

```text
1–3 short paragraphs
```

The explanation should answer:

1. What does the visual represent?
2. How should the learner interpret it?
3. Why does the relationship/flow matter?

---

# 22. V8 Key Insight

The Key Insight is the most important addition compared with V7.

Example:

```text id="v8key"
┌──────────────────────────────────────────────┐
│ KEY INSIGHT                                  │
│                                              │
│ Each layer has a distinct responsibility,   │
│ allowing the system to separate concerns.   │
└──────────────────────────────────────────────┘
```

This is not a summary of the entire topic.

It is the **single mental takeaway from the visual**.

---

# 23. V8 Key Insight Color

The heading:

**KEY INSIGHT**

uses:

> **#F54A8D**

The insight text uses:

> **#0B1B3D**

The box should remain primarily white/light neutral.

This preserves the 70/30 rule.

---

# 24. V8 SUIA Color Strategy

| Element             | Color              |
| ------------------- | ------------------ |
| Main title          | **#0B1B3D**        |
| VISUAL eyebrow      | **#F54A8D**        |
| Main diagram        | Mostly **#0B1B3D** |
| Annotation numbers  | **#F54A8D**        |
| Annotation text     | **#0B1B3D**        |
| Explanation heading | **#F54A8D**        |
| Explanation text    | **#0B1B3D**        |
| Key Insight heading | **#F54A8D**        |
| Key Insight text    | **#0B1B3D**        |
| Caption             | **#0B1B3D**        |

---

# 25. V8 70/30 Brand Rule

Target visual balance:

```text
70%
White / light neutral / Navy
```

```text
30%
Pink
```

Pink should primarily provide:

```text
Hierarchy
+
Navigation
+
Emphasis
```

It should **not** become a decorative background everywhere.

---

# 26. HTML Semantic Structure

```text id="v8html"
<section>
│
├── <header>
│    ├── <span>
│    └── <h2>
│
├── <figure>
│    └── Main Visual
│
├── <section>
│    ├── <h3>
│    └── <ol>
│         ├── <li>
│         └── ...
│
├── <section>
│    ├── <h3>
│    └── <p>
│
├── <aside>
│    ├── <h3>
│    └── <p>
│
└── <figcaption>
```

`<aside>` is appropriate for the Key Insight because it is complementary information.

---

# 27. HTML Tag-by-Tag Color Table

| HTML Tag       | Purpose                 | Color       |
| -------------- | ----------------------- | ----------- |
| `<section>`    | Root block              | Neutral     |
| `<header>`     | Block header            | Neutral     |
| `<span>`       | VISUAL eyebrow          | **#F54A8D** |
| `<h2>`         | Main title              | **#0B1B3D** |
| `<figure>`     | Main visual             | Neutral     |
| `<div>`        | Visual components       | Neutral     |
| `<strong>`     | Important visual labels | **#0B1B3D** |
| `<span>`       | Annotation number       | **#F54A8D** |
| `<figcaption>` | Caption                 | **#0B1B3D** |
| `<h3>`         | Section heading         | **#F54A8D** |
| `<ol>`         | Annotation list         | **#0B1B3D** |
| `<li>`         | Annotation              | **#0B1B3D** |
| `<p>`          | Explanation             | **#0B1B3D** |
| `<aside>`      | Key Insight container   | Neutral     |
| `<strong>`     | Key Insight emphasis    | **#0B1B3D** |

---

# 28. Complete V8 HTML

```html
<section
    class="tutorial-block visual-block visual-v8"
    data-block="visual"
    data-version="V8"
>

    <header class="visual-header">

        <span class="visual-eyebrow">
            VISUAL
        </span>

        <h2 class="visual-title">
            Complete Application Request Model
        </h2>

    </header>


    <figure class="visual-figure">

        <div
            class="visual-canvas"
            role="img"
            aria-label="
                Complete application request model showing
                user, frontend, API, backend, and database
                responsibilities and request flow
            "
        >

            <div class="visual-node">

                <span class="annotation-number">
                    ①
                </span>

                <strong>
                    User
                </strong>

            </div>


            <div class="visual-connection">
                ↓
            </div>


            <div class="visual-node">

                <span class="annotation-number">
                    ②
                </span>

                <strong>
                    Frontend
                </strong>

            </div>


            <div class="visual-connection">
                ↓
            </div>


            <div class="visual-node visual-highlight">

                <span class="annotation-number">
                    ③
                </span>

                <strong>
                    API
                </strong>

            </div>


            <div class="visual-connection">
                ↓
            </div>


            <div class="visual-node">

                <span class="annotation-number">
                    ④
                </span>

                <strong>
                    Backend
                </strong>

            </div>


            <div class="visual-connection">
                ↓
            </div>


            <div class="visual-node">

                <span class="annotation-number">
                    ⑤
                </span>

                <strong>
                    Database
                </strong>

            </div>

        </div>


        <figcaption class="visual-caption">

            Application request flow from the user interface
            through backend processing to persistent data.

        </figcaption>

    </figure>


    <section class="visual-annotations">

        <h3>
            Annotations
        </h3>

        <ol>

            <li>
                <strong>User</strong>
                — Initiates the interaction.
            </li>

            <li>
                <strong>Frontend</strong>
                — Presents the interface and collects input.
            </li>

            <li>
                <strong>API</strong>
                — Provides the communication boundary.
            </li>

            <li>
                <strong>Backend</strong>
                — Processes application and business logic.
            </li>

            <li>
                <strong>Database</strong>
                — Stores and retrieves persistent information.
            </li>

        </ol>

    </section>


    <section class="visual-explanation">

        <h3>
            Explanation
        </h3>

        <p>
            A user interaction begins at the frontend and
            results in a request being sent through the API
            to the backend.
        </p>

        <p>
            The backend processes the request and may
            communicate with the database to retrieve or
            persist information before returning the result
            to the client.
        </p>

    </section>


    <aside class="visual-key-insight">

        <h3>
            Key Insight
        </h3>

        <p>
            Each layer has a distinct responsibility,
            allowing the application to separate concerns
            while the layers communicate to complete a request.
        </p>

    </aside>

</section>
```

---

# 29. V8 JSON Structure

```json
{
  "type": "visual",
  "version": "V8",

  "content": {

    "title": "Complete Application Request Model",

    "visual": {

      "type": "hybrid",

      "mode": "architecture-flow",

      "ariaLabel": "Complete application request model showing user, frontend, API, backend, and database responsibilities and request flow",

      "elements": [
        {
          "id": "user",
          "type": "node",
          "label": "User"
        },
        {
          "id": "frontend",
          "type": "node",
          "label": "Frontend"
        },
        {
          "id": "api",
          "type": "node",
          "label": "API",
          "highlight": true
        },
        {
          "id": "backend",
          "type": "node",
          "label": "Backend"
        },
        {
          "id": "database",
          "type": "node",
          "label": "Database"
        }
      ],

      "connections": [
        {
          "from": "user",
          "to": "frontend",
          "label": "interaction"
        },
        {
          "from": "frontend",
          "to": "api",
          "label": "request"
        },
        {
          "from": "api",
          "to": "backend",
          "label": "processing"
        },
        {
          "from": "backend",
          "to": "database",
          "label": "query"
        }
      ]
    },

    "annotations": [
      {
        "id": "annotation-1",
        "number": 1,
        "target": "user",
        "title": "User",
        "explanation": "Initiates the interaction."
      },
      {
        "id": "annotation-2",
        "number": 2,
        "target": "frontend",
        "title": "Frontend",
        "explanation": "Presents the interface and collects input."
      },
      {
        "id": "annotation-3",
        "number": 3,
        "target": "api",
        "title": "API",
        "explanation": "Provides the communication boundary."
      },
      {
        "id": "annotation-4",
        "number": 4,
        "target": "backend",
        "title": "Backend",
        "explanation": "Processes application and business logic."
      },
      {
        "id": "annotation-5",
        "number": 5,
        "target": "database",
        "title": "Database",
        "explanation": "Stores and retrieves persistent information."
      }
    ],

    "explanation": {
      "title": "Explanation",

      "paragraphs": [
        "A user interaction begins at the frontend and results in a request being sent through the API to the backend.",
        "The backend processes the request and may communicate with the database to retrieve or persist information before returning the result to the client."
      ]
    },

    "keyInsight": {
      "title": "Key Insight",

      "text": "Each layer has a distinct responsibility, allowing the application to separate concerns while the layers communicate to complete a request."
    },

    "caption": "Application request flow from the user interface through backend processing to persistent data."
  }
}
```

---

# 30. V8 Generic Data Architecture

The important architectural principle is:

```text
CONTENT DATA
     ↓
V8 RENDERER
     ↓
VISUAL MODE
```

The content should determine the mode.

For example:

```json
{
  "type": "visual",
  "version": "V8",
  "visual": {
    "mode": "concept-map"
  }
}
```

or:

```json
{
  "type": "visual",
  "version": "V8",
  "visual": {
    "mode": "comparison"
  }
}
```

or:

```json
{
  "type": "visual",
  "version": "V8",
  "visual": {
    "mode": "flow"
  }
}
```

This keeps the Tutorial Engine flexible.

---

# 31. V8 Mode Selection

| Content Type            | Recommended V8 Mode |
| ----------------------- | ------------------- |
| System architecture     | `architecture`      |
| Algorithm               | `flow`              |
| Concept relationships   | `concept-map`       |
| Two technologies        | `comparison`        |
| Internal structure      | `annotated-diagram` |
| Complex teaching visual | `hybrid`            |

---

# 32. V8 Annotation Rules

Recommended:

```text
3–8 annotations
```

Each annotation should answer:

> **What is this part and why does it matter?**

Not:

> What else can I say about this topic?

---

# 33. V8 Key Insight Rules

Exactly **one primary Key Insight** should normally exist.

Good:

> The backend separates application logic from the user interface and data storage.

Bad:

```text
Remember these 12 things:
1...
2...
3...
...
12...
```

That belongs in a SummaryBlock.

---

# 34. V8 vs SummaryBlock

This distinction is essential.

### VisualBlock V8

> **What is the most important thing to understand from this visual?**

### SummaryBlock

> **What are the important things to remember from the entire topic?**

Therefore V8's Key Insight should be **one visual-specific insight**, not a topic summary.

---

# 35. V8 vs DefinitionBlock

### DefinitionBlock

> What is this?

### V8

> What does this concept look like, how is it structured, how does it operate, and how do its parts relate?

Therefore the V8 explanation must remain visual-centric.

---

# 36. V8 vs CodeBlock

V8 can explain:

```text
Code execution conceptually
```

But it should not contain a large code listing.

For example:

```text
Function Call
     ↓
Frame Created
     ↓
Body Executes
     ↓
Return
```

Then CodeBlock can show the actual Python code.

---

# 37. V8 vs IntroductionBlock

IntroductionBlock establishes:

* context
* motivation
* background
* why the learner should care

V8 establishes:

* visual structure
* relationships
* flow
* interpretation

They serve different teaching functions.

---

# 38. V8 Responsive Behavior

### Desktop

```text
Main Visual
    ↓
Annotations
    ↓
Explanation
    ↓
Key Insight
```

### A4

Same basic structure.

### Mobile

```text
Visual
  ↓
Annotations
  ↓
Explanation
  ↓
Key Insight
```

Never shrink the visual so aggressively that labels become unreadable.

---

# 39. V8 Mobile Layout

```text
┌─────────────────────────────┐
│ VISUAL                      │
│                             │
│ Complete Request Model      │
│                             │
│ User                        │
│   ↓                         │
│ Frontend                    │
│   ↓                         │
│ API                         │
│   ↓                         │
│ Backend                     │
│   ↓                         │
│ Database                    │
│                             │
│ ANNOTATIONS                 │
│                             │
│ ① User                     │
│ ② Frontend                 │
│ ③ API                      │
│ ④ Backend                  │
│ ⑤ Database                 │
│                             │
│ EXPLANATION                 │
│                             │
│ ...                         │
│                             │
│ KEY INSIGHT                 │
│                             │
│ ...                         │
└─────────────────────────────┘
```

---

# 40. V8 Information Density

| Component              |      Recommendation |
| ---------------------- | ------------------: |
| Main visual            |               **1** |
| Visual modes           |           1 primary |
| Annotations            |             **3–8** |
| Explanation paragraphs |             **1–3** |
| Key Insight            |               **1** |
| Caption                |                   1 |
| Comparison concepts    | 2–3 when applicable |
| Flow steps             | 3–8 when applicable |
| Concept nodes          |                4–10 |
| Animation              |                   ❌ |
| Interaction            |                   ❌ |

---

# 41. V8 Best Use Cases

| Domain                 | Suitability |
| ---------------------- | ----------: |
| Python internals       |       ⭐⭐⭐⭐⭐ |
| OOP                    |       ⭐⭐⭐⭐⭐ |
| Exception handling     |       ⭐⭐⭐⭐⭐ |
| Data structures        |       ⭐⭐⭐⭐⭐ |
| NumPy                  |       ⭐⭐⭐⭐⭐ |
| Pandas                 |       ⭐⭐⭐⭐⭐ |
| Full-stack development |       ⭐⭐⭐⭐⭐ |
| API architecture       |       ⭐⭐⭐⭐⭐ |
| Data Science           |       ⭐⭐⭐⭐⭐ |
| Data Engineering       |       ⭐⭐⭐⭐⭐ |
| AI/ML                  |       ⭐⭐⭐⭐⭐ |
| Cyber Security         |       ⭐⭐⭐⭐⭐ |
| Ethical Hacking        |       ⭐⭐⭐⭐⭐ |
| Quantum Computing      |       ⭐⭐⭐⭐⭐ |
| Databases              |       ⭐⭐⭐⭐⭐ |
| Networking             |       ⭐⭐⭐⭐⭐ |
| Cloud Computing        |       ⭐⭐⭐⭐⭐ |

---

# 42. V8 What We Should Avoid

### ❌ Everything at once

V8 is complete, not overloaded.

### ❌ Huge explanation

Use the Introduction/Definition/Code/Summary blocks where appropriate.

### ❌ Multiple unrelated visuals

One primary visual model per V8.

### ❌ Excessive annotations

If every component needs a paragraph, split the concept.

### ❌ Decorative complexity

Every visual element should teach something.

### ❌ Excessive pink

The 70/30 brand rule remains mandatory.

---

# 43. V8 Component Architecture

```text
VisualBlock
│
└── V8 Renderer
      │
      ├── Header
      │    ├── Eyebrow
      │    └── Title
      │
      ├── VisualEngine
      │    │
      │    ├── ArchitectureRenderer
      │    ├── FlowRenderer
      │    ├── ConceptMapRenderer
      │    ├── ComparisonRenderer
      │    └── AnnotatedDiagramRenderer
      │
      ├── AnnotationEngine
      │    ├── Number
      │    ├── Target
      │    └── Explanation
      │
      ├── ExplanationSection
      │
      ├── KeyInsight
      │
      └── Caption
```

---

# 44. V8 Validation Rules

| Field                      |        Required |
| -------------------------- | --------------: |
| `type`                     |               ✅ |
| `version`                  |               ✅ |
| `title`                    |               ✅ |
| `visual`                   |           **✅** |
| `visual.type/mode`         |           **✅** |
| Main visual content        |           **✅** |
| Explanation                |     Recommended |
| Annotations                |     Recommended |
| Key Insight                | **Recommended** |
| Caption                    |     Recommended |
| Accessibility description  |           **✅** |
| Unrelated multiple visuals |               ❌ |
| Excessive annotations      |               ❌ |
| Animation                  |               ❌ |
| Interaction                |               ❌ |
| Large code listing         |               ❌ |

---

# 45. V7 vs V8

| Feature                      |                      V7 |                      **V8** |
| ---------------------------- | ----------------------: | --------------------------: |
| Annotated diagram            |                **Core** |                   Supported |
| Labels                       |                       ✅ |                           ✅ |
| Relationships                |                Optional |               **Supported** |
| Flow                         |                Optional |               **Supported** |
| Concept map                  |                       ❌ |               **Supported** |
| Comparison                   |                       ❌ |               **Supported** |
| Annotations                  |                **Core** |               **Supported** |
| Explanation                  |                Optional |             **Recommended** |
| Key Insight                  |                       ❌ |    **Core premium feature** |
| Caption                      |             Recommended |                 Recommended |
| Multiple visual capabilities |                 Limited |              **Composable** |
| Learning level               | Intermediate → Advanced | **Intermediate → Advanced** |
| Interaction                  |                       ❌ |                           ❌ |
| Animation                    |                       ❌ |                           ❌ |

---

# 46. Complete VisualBlock Progression

We now have the complete VisualBlock architecture:

```text
V1
Basic Visual
│
▼
V2
Visual + Labels
│
▼
V3
Visual + Explanation
│
▼
V4
Visual + Step-by-Step Flow
│
▼
V5
Visual + Concept Map
│
▼
V6
Visual + Comparison
│
▼
V7
Visual + Annotated Diagram
│
▼
V8
Complete Visual Learning Model
```

And the learning progression is:

```text
SHOW
  ↓
IDENTIFY
  ↓
EXPLAIN
  ↓
PROGRESS
  ↓
CONNECT
  ↓
COMPARE
  ↓
ANNOTATE
  ↓
INTEGRATE
```

---

# 47. V8 Final Technical Specification

| Area              | V8 Decision                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Block             | **VisualBlock**                                                                              |
| Version           | **V8**                                                                                       |
| Name              | **Complete Visual Learning Model**                                                           |
| Main question     | **What is it, how is it structured, how does it work, and what should I understand?**        |
| Structure         | **Visual → Labels → Relationships/Flow → Annotations → Explanation → Key Insight → Caption** |
| Best for          | Premium/default complex visual teaching                                                      |
| Primary           | **#F54A8D**                                                                                  |
| Secondary         | **#0B1B3D**                                                                                  |
| Theme             | Light                                                                                        |
| Gradient          | ❌                                                                                            |
| Dark theme        | ❌                                                                                            |
| A4                | **Portrait**                                                                                 |
| Main visual       | **1**                                                                                        |
| Visual modes      | Architecture / Flow / Concept Map / Comparison / Annotated / Hybrid                          |
| Annotations       | 3–8 ideal                                                                                    |
| Explanation       | 1–3 paragraphs                                                                               |
| Key Insight       | **1**                                                                                        |
| Caption           | 1                                                                                            |
| HTML              | Semantic                                                                                     |
| SVG               | **Highly recommended**                                                                       |
| JSON              | Structured                                                                                   |
| Accessibility     | **Required**                                                                                 |
| Responsive        | **Required**                                                                                 |
| Interaction       | ❌                                                                                            |
| Animation         | ❌                                                                                            |
| JSON-driven       | **✅**                                                                                        |
| Learning level    | **Intermediate → Advanced**                                                                  |
| Intended position | **Premium/default VisualBlock**                                                              |

---

# 48. Final V8 Mental Model

```text
                       COMPLETE VISUAL
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          LABELS         RELATIONSHIPS       FLOW
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                        ANNOTATIONS
                              │
                              ▼
                         EXPLANATION
                              │
                              ▼
                         KEY INSIGHT
                              │
                              ▼
                           CAPTION
```

The defining principle is:

> **V8 is the complete visual teaching model: it combines the appropriate visual representation, labels, relationships or flow, targeted annotations, concise explanation, and one key visual insight into a single coherent learning experience.**

---

# 49. Final VisualBlock Version Table

| V#     | Visual Version                     | Structure                                                                                    | Best For                             |
| ------ | ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| **V1** | Basic Visual                       | Visual → Caption                                                                             | Simple concepts                      |
| **V2** | Visual + Labels                    | Visual → Labels → Caption                                                                    | Identifying parts                    |
| **V3** | Visual + Explanation               | Visual → Labels → Explanation → Caption                                                      | Understanding meaning                |
| **V4** | Visual + Step-by-Step Flow         | Step 1 → Step 2 → Step 3 → Result                                                            | Processes/workflows                  |
| **V5** | Visual + Concept Map               | Central concept → Related concepts                                                           | Concept relationships                |
| **V6** | Visual + Comparison                | A ↔ B → Differences → Explanation                                                            | Comparing concepts                   |
| **V7** | Visual + Annotated Diagram         | Diagram → Callouts → Explanations                                                            | Complex diagrams                     |
| **V8** | **Complete Visual Learning Model** | **Visual → Labels → Relationships/Flow → Annotations → Explanation → Key Insight → Caption** | **Premium/default complex learning** |

## VisualBlock is now complete: **V1–V8**.



```python

```


```python

```
