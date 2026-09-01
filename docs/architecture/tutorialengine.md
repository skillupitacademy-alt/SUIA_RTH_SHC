All images are present in current project repo in folder D:\onlinewebsites\quiz-platform\promptimages folder

Yes. We have now created **16 web-page images** in total.

The important thing is that you should **not implement them in numerical order as 1 → 16**. There is a better implementation sequence because Pages 11–16 explain the content-intelligence layer that feeds Pages 3–6.

## Complete 16-page sequence

### PHASE 1 — Curriculum & Content Definition

#### **Page 1 — Tutorial Architecture Dashboard**

**Purpose:** Define where content belongs.

```text
Domain
  ↓
Subject
  ↓
Topic
  ↓
Subtopic
  ↓
Content Mode
```

Example:

```text
Full Stack Development
 → Frontend Development
   → JavaScript
     → Introduction to JavaScript
       → Notes
```

**Implementation:** curriculum hierarchy + selection.

---

#### **Page 2 — Subtopic & Content Mode Selection**

**Purpose:** Decide what content you are creating.

```text
Domain
Subject
Topic
Subtopic
Content Mode
```

**Implementation:** content creation context.

---

# PHASE 2 — Content Intelligence

This is where the **new 6 pages** come in.

### **Page 11 — Raw Content Import**

This should actually be implemented **before Page 3**.

The author provides:

```text
JavaScript is a programming language...

## 1. What does it actually do?

...

## 2. Where does it run?

- Client-Side
- Server-Side
```

Important:

> **The author provides human-readable content, not JSON.**

Possible input:

* Markdown
* Rich text
* pasted text
* document
* existing content

---

### **Page 12 — Content Analysis**

The system analyzes the imported content.

```text
Raw Content
    ↓
Content Parser
    ↓
Structure Analyzer
```

It detects:

```text
Headings
Paragraphs
Lists
Code
Tables
Quotes
Sections
Relationships
```

and produces confidence scores.

---

### **Page 13 — Block Suggestions**

Now the system says:

```text
I detected:

Heading
Paragraph
Paragraph
Heading
Paragraph
Bullet List
...
```

and suggests:

```text
HeadingBlock
ParagraphBlock
BulletListBlock
CodeBlock
...
```

with:

```text
Confidence
Reason
Source Content
```

This is the bridge between **raw content and the Tutorial Composer**.

---

### **Page 14 — Presentation Ideas**

Now the system goes one level further.

It can suggest:

```text
Two Column Layout
Comparison Table
Concept Cards
Important Callout
Ecosystem Cards
Diagram
```

But these are **recommendations**, not automatic decisions.

---

### **Page 15 — Review & Approve**

The author decides:

```text
Accept
Modify
Reject
```

Therefore:

```text
AI / Rules
     ↓
Suggestions
     ↓
Human
     ↓
Approved Structure
```

This is the **Human-in-the-Loop** stage.

---

### **Page 16 — Content Intelligence Architecture**

This is your **technical architecture reference**.

It explains:

```text
Raw Content
     ↓
Parser
     ↓
Rule / Heuristic Engine
     ↓
Optional Local LLM
     ↓
Block Suggestions
     ↓
Human Review
     ↓
Composer
```

And importantly, it establishes that:

> **You don't need to build your own LLM.**

The first version can use:

```text
Parser
+
Rules
+
Heuristics
+
Content Taxonomy
```

and an optional local/open-weight LLM can be added later.

---

# PHASE 3 — Tutorial Composer

Now we move to the original Pages 3–6.

### **Page 3 — Empty Tutorial Composer**

The author now receives the approved structure and sees:

```text
┌────────────┬──────────────────────┬──────────────┐
│ Components │ Canvas               │ Properties   │
│            │                      │              │
│ Heading    │ Drop components here │              │
│ Paragraph  │                      │              │
│ Bullet     │                      │              │
│ Table      │                      │              │
│ Image      │                      │              │
│ Code       │                      │              │
└────────────┴──────────────────────┴──────────────┘
```

---

### **Page 4 — Populated Tutorial Composer**

Now the actual JavaScript content is composed:

```text
Heading
↓
Paragraph
↓
Paragraph
↓
H2
↓
Paragraph
↓
Two Column
↓
H2
↓
Concept Cards
↓
Comparison
↓
Callout
↓
Summary
```

This is where the **final educational page structure** is created.

---

### **Page 5 — Component Property Editor**

The author selects a component and configures it.

For example:

```text
TABLE

Columns
Rows
Alignment
Header
Width
Variant
```

or:

```text
CALLOUT

Type
Title
Content
Icon
Width
```

This defines the **author-controlled presentation configuration**.

---

### **Page 6 — Layout Composer**

Now the author controls composition:

```text
Full Width
Two Column
Three Column
Card Grid
Image + Content
Code + Output
```

This solves your original problem of:

> "Some content needs a table, some image + content, some bullets, some only paragraphs."

---

# PHASE 4 — Preview

### **Page 7 — Preview & Responsive View**

Now we verify the actual learner experience:

```text
Desktop
Tablet
Mobile
```

before saving/publishing.

---

# PHASE 5 — Persistence / Developer Architecture

### **Page 8 — Database & JSON Mapping**

The visual document becomes:

```text
Tutorial Document
       ↓
Blocks
       ↓
Content
       ↓
Presentation Config
       ↓
Document JSON
       ↓
Database
```

For example:

```text
type = "table"
content = {...}
presentation_config = {...}
```

The actual React implementation is **not stored in DB**.

---

# PHASE 6 — Learner Experience

### **Page 9 — Public Tutorial Page**

The database document is rendered through your Tutorial Renderer:

```text
Database
   ↓
API
   ↓
Document
   ↓
Block Renderer
   ↓
React Components
   ↓
Learner Page
```

This is the actual tutorial experience.

---

# PHASE 7 — Complete System

### **Page 10 — Complete End-to-End Flow**

This is the final master picture:

```text
CONTENT AUTHOR
      ↓
SUBTOPIC
      ↓
RAW CONTENT
      ↓
CONTENT INTELLIGENCE
      ↓
BLOCK SUGGESTIONS
      ↓
PRESENTATION SUGGESTIONS
      ↓
HUMAN APPROVAL
      ↓
TUTORIAL COMPOSER
      ↓
PREVIEW
      ↓
DOCUMENT JSON
      ↓
DATABASE
      ↓
API
      ↓
RENDERER
      ↓
LEARNER
```

---

# Therefore, the logical implementation sequence is NOT 1 → 16

I recommend implementing in this order:

```text
┌─────────────────────────────────────────────┐
│  FOUNDATION                                  │
│                                             │
│  1 → 2                                      │
│  Curriculum + Subtopic + Content Mode       │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  CONTENT INGESTION                           │
│                                             │
│  11                                        │
│  Raw Content Import                         │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  CONTENT INTELLIGENCE                       │
│                                             │
│  12 → 13 → 14 → 15                          │
│  Analyze → Blocks → Presentation → Approve  │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  ARCHITECTURE                               │
│                                             │
│  16                                         │
│  Intelligence Architecture                  │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  COMPOSER                                  │
│                                             │
│  3 → 4 → 5 → 6                              │
│  Empty → Content → Properties → Layout      │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  PREVIEW                                    │
│                                             │
│  7                                          │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  PERSISTENCE                                │
│                                             │
│  8                                          │
│  Document → JSON → DB                       │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  LEARNER EXPERIENCE                         │
│                                             │
│  9                                          │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  MASTER ARCHITECTURE                        │
│                                             │
│  10                                         │
│  Complete End-to-End Flow                   │
└─────────────────────────────────────────────┘
```

## The 16 pages grouped by purpose

| Group                    | Pages | Objective                                      |
| ------------------------ | ----- | ---------------------------------------------- |
| **Curriculum**           | 1–2   | Where content belongs                          |
| **Content Intelligence** | 11–16 | Convert human content into suggested structure |
| **Composer**             | 3–6   | Build the actual tutorial document             |
| **Preview**              | 7     | Validate learner experience                    |
| **Persistence**          | 8     | Store structured document                      |
| **Learner UI**           | 9     | Render tutorial                                |
| **Master Flow**          | 10    | Understand everything together                 |

### The key architecture we have arrived at

```text
                   HUMAN CONTENT
                         │
                         ▼
                ┌─────────────────┐
                │ CONTENT         │
                │ INTELLIGENCE    │
                │                 │
                │ Parser          │
                │ Rules           │
                │ Heuristics      │
                │ Optional LLM    │
                └────────┬────────┘
                         │
                         ▼
                  SUGGESTIONS
                         │
                         ▼
                 HUMAN APPROVAL
                         │
                         ▼
                TUTORIAL COMPOSER
                         │
                         ▼
                  FINAL DOCUMENT
                         │
                         ▼
                    DOCUMENT DB
                         │
                         ▼
                       API
                         │
                         ▼
                 RENDERER ENGINE
                         │
                         ▼
                  LEARNER PAGE
```

**This is the sequence I would follow for implementation.**

Most importantly, **Pages 11–16 do not replace Pages 3–6**. They solve the problem of getting your normal educational content into the composer intelligently. Pages 3–6 then give the author complete control to correct and refine what the analyzer suggested.


Yes. Based on your **existing project architecture and the new 16-page Tutorial Engine design**, I would **not give you one giant prompt**. That would be risky because the system now spans DB schema, content intelligence, APIs, TypeScript contracts, Next.js/React UI, rendering, versioning, and your existing FastAPI LLM service.

I recommend **14 detailed implementation prompts**, executed in dependency order.

Your existing architecture already has a Tutorial Engine with a separate tutorial DB, Drizzle, a tutorial service, JSONB content, a Next.js learner app, and a human-in-the-loop content-generation philosophy. The existing blueprint also explicitly says the canonical 6-block content schema is locked.  

However, the **new 16-page Composer architecture is more granular than the old 6-block JSON model**, so we should **not blindly modify the locked schema**. We need an architectural decision first.

---

# The 14 prompts I recommend

## Phase A — Architecture Foundation

### **Prompt 01 — Tutorial Composer Architecture & ADR**

This is the most important prompt.

It will instruct the implementation agent to inspect the existing Tutorial Engine and decide how the new architecture fits with:

```text
Existing:
6 content blocks
notes
layman
real_life
technical
code
ai_tutor
```

versus the new:

```text
heading
paragraph
bullet
numbered-list
image
table
code
callout
diagram
two-column
cards
etc.
```

The prompt should **not allow the agent to change the locked schema immediately**.

It should produce:

* current architecture audit
* conflict analysis
* proposed new document model
* ADR
* migration strategy
* backward compatibility strategy
* recommendation

This is necessary because your existing project explicitly says the content JSON schema is locked. 

---

# Phase B — Database

### **Prompt 02 — Tutorial Document Database Model**

Design the new persistence layer.

I would expect something conceptually like:

```text
tutorial_documents
tutorial_document_versions
tutorial_document_blocks
tutorial_content_assets
tutorial_content_analysis
tutorial_block_suggestions
tutorial_presentation_suggestions
tutorial_review_decisions
```

But we should **not blindly create these tables** until Prompt 01 establishes whether blocks remain JSONB or become relational.

My current recommendation is:

```text
Document metadata → relational
Document structure → JSONB
Analysis/suggestions/review → relational
```

This gives us flexibility without creating an enormous number of rows for every paragraph.

---

### **Prompt 03 — Drizzle Schema + Migration + Repository Layer**

Implement:

```text
packages/db-tutorial/
```

with:

* Drizzle schema
* migrations
* indexes
* enums
* repository interfaces
* Drizzle repositories
* transactions
* tests

Your existing architecture explicitly uses the repository pattern and Drizzle for Tutorial Engine persistence. 

---

# Phase C — TypeScript Contracts

### **Prompt 04 — Canonical TypeScript Document Model**

This prompt creates the TypeScript contract between:

```text
Composer
    ↓
API
    ↓
Database
    ↓
Renderer
```

For example:

```ts
type TutorialBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletListBlock
  | OrderedListBlock
  | ImageBlock
  | TableBlock
  | CodeBlock
  | CalloutBlock
  | TwoColumnBlock
  | CardGridBlock
  | DiagramBlock;
```

And:

```ts
interface TutorialDocument {
  id: string;
  subtopicId: string;
  version: number;
  status: DocumentStatus;
  blocks: TutorialBlock[];
}
```

Use Zod as the runtime validation boundary.

This becomes the **single source of truth** for frontend and backend.

---

# Phase D — Content Intelligence

Now we implement Pages **11–16**.

### **Prompt 05 — Raw Content Import Engine**

Implement Page 11.

Input:

```text
Markdown
Rich Text
Plain Text
```

Example:

```text
# JavaScript

JavaScript is a programming language...

## Where does it run?

- Client-side
- Server-side
```

Output:

```text
ParsedDocument
```

No LLM required.

---

### **Prompt 06 — Deterministic Content Analysis Engine**

Implement Page 12.

It detects:

```text
Heading
Paragraph
Bullet List
Ordered List
Code
Quote
Table
Section
Definition
Example
Warning
Summary
```

It should produce:

```ts
ContentAnalysis
```

with confidence:

```text
heading → 0.99
paragraph → 0.99
bullet → 1.00
comparison → 0.72
```

This should initially be **100% deterministic**.

---

### **Prompt 07 — Block Suggestion Engine**

Implement Page 13.

Input:

```text
ContentAnalysis
```

Output:

```ts
BlockSuggestion[]
```

Example:

```text
{
  type: "paragraph",
  sourceNodeId: "...",
  confidence: 0.98,
  reason: "Opening explanatory text"
}
```

This is where:

```text
RAW CONTENT
      ↓
CONTENT ANALYSIS
      ↓
BLOCK SUGGESTIONS
```

becomes a real service.

---

### **Prompt 08 — Presentation Suggestion Engine**

Implement Page 14.

This analyzes relationships and recommends:

```text
TwoColumn
ComparisonTable
ConceptCards
Callout
ImageText
Diagram
Timeline
```

Example:

```text
Client-Side
Server-Side
```

→

```text
TwoColumnSuggestion
confidence: 0.82
reason:
"Two parallel concepts detected."
```

Again, **suggestion only**.

---

# Phase E — Human-in-the-Loop

### **Prompt 09 — Suggestion Review & Approval**

Implement Page 15.

The author can:

```text
Accept
Reject
Modify
Merge
Split
Reorder
```

The system must record the decision.

For example:

```text
suggestion_id
decision
modified_config
reviewed_by
reviewed_at
```

This is particularly important because your existing Tutorial architecture already follows a human-in-the-loop content philosophy. 

---

# Phase F — Composer

### **Prompt 10 — Tutorial Composer Core**

Implement Page 3 + Page 4.

The Composer receives:

```text
Approved suggestions
+
Content
```

and produces:

```text
TutorialDocument
```

Features:

* drag/drop
* reorder
* duplicate
* delete
* add block
* nesting
* undo/redo
* autosave
* validation
* draft state

This is the **heart of the new system**.

---

### **Prompt 11 — Component Property Editor + Layout Composer**

Implement Pages 5 + 6.

Each component gets a typed property editor.

Example:

```text
Paragraph
 ├── text
 ├── alignment
 ├── width
 └── emphasis
```

Table:

```text
Table
 ├── columns
 ├── rows
 ├── header
 ├── alignment
 └── variant
```

Two-column:

```text
TwoColumn
 ├── left
 ├── right
 ├── ratio
 └── gap
```

---

# Phase G — Persistence + Rendering

### **Prompt 12 — Document API + Versioning**

Implement the API between:

```text
Next.js Admin
       ↓
Tutorial Service
       ↓
Tutorial DB
```

Endpoints should cover things such as:

```text
POST   /tutorial/documents
GET    /tutorial/documents/:id
PATCH  /tutorial/documents/:id
POST   /tutorial/documents/:id/versions
POST   /tutorial/documents/:id/publish
GET    /tutorial/documents/:id/versions
```

Plus:

```text
POST /content/analyze
POST /content/suggestions
POST /content/review
```

We should follow your existing service architecture rather than creating random Next.js API routes if the Tutorial Service is already the backend boundary. Your existing blueprint specifies a separate tutorial service and API layer. 

---

### **Prompt 13 — Universal Renderer + Learner Page**

Implement Pages 7 + 9.

The renderer becomes:

```text
TutorialDocument
       ↓
BlockRenderer
       ↓
resolve(block.type)
       ↓
React Component
```

Example:

```text
paragraph
   ↓
ParagraphBlock

table
   ↓
TableBlock

two-column
   ↓
TwoColumnBlock
```

Then integrate with the existing Next.js learner page.

This preserves the architecture already described in your project, where the learner page renders typed content through React components. 

---

# Phase H — Intelligence Integration

### **Prompt 14 — Optional FastAPI / Local LLM Provider**

This is where your existing FastAPI LLM system becomes relevant.

And this is where I would make a **very important distinction**.

## You do NOT need FastAPI for the Tutorial Composer itself.

Your architecture can be:

```text
Next.js / React
      ↓
Tutorial Service
      ↓
Tutorial DB
```

for:

* documents
* blocks
* suggestions
* reviews
* publishing
* rendering

FastAPI is only needed if you want:

> **semantic intelligence beyond deterministic parsing.**

---

# Your existing FastAPI LLM fits here

You said you already created:

> an in-built LLM using FastAPI for repeated JSON question-bank generation.

That can remain a separate service.

For example:

```text
                 Tutorial System
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Tutorial Service            AI Service
   TypeScript/Hono              FastAPI
          │                         │
          │                    Your LLM
          │                         │
          └────────────┬────────────┘
                       ▼
                Suggestions
```

But **do not couple the Composer directly to FastAPI**.

---

# I would create an abstraction

TypeScript:

```ts
interface ContentIntelligenceProvider {
  analyze(input: ContentAnalysisInput): Promise<ContentAnalysisResult>;
}
```

Then:

```text
RuleBasedContentProvider
```

for your first version.

Later:

```text
FastApiLlmContentProvider
```

if your LLM becomes capable of semantic analysis.

So:

```text
Content Intelligence
       │
       ├── RuleBasedProvider
       │
       └── FastApiLlmProvider
```

This is much better than:

```text
React
 ↓
FastAPI
 ↓
LLM
```

---

# What should your FastAPI LLM do?

Your existing question-bank model may currently understand:

```text
Question
Options
Correct Answer
Explanation
Difficulty
```

That doesn't automatically mean it can understand:

```text
"Should this paragraph become a two-column layout?"
```

So we should **not assume the existing LLM can do this**.

We would first expose a new capability such as:

```text
POST /v1/content/analyze
```

Input:

```json
{
  "content": "...",
  "context": {
    "domain": "Full Stack Development",
    "subject": "Frontend Development",
    "topic": "JavaScript",
    "subtopic": "Introduction to JavaScript"
  }
}
```

Output:

```json
{
  "sections": [],
  "blockSuggestions": [],
  "presentationSuggestions": []
}
```

But only implement this if the existing model is actually capable of generating reliable structured output.

---

# How many APIs are we talking about?

I would roughly organize them into **5 API groups**, rather than creating dozens of random endpoints.

### 1. Content

```text
POST /content/import
POST /content/analyze
```

### 2. Suggestions

```text
GET  /documents/:id/suggestions
POST /documents/:id/suggestions/review
POST /documents/:id/presentation-suggestions
```

### 3. Documents

```text
POST  /documents
GET   /documents/:id
PATCH /documents/:id
```

### 4. Versions / Publishing

```text
GET  /documents/:id/versions
POST /documents/:id/versions
POST /documents/:id/publish
POST /documents/:id/unpublish
```

### 5. Learner

```text
GET /tutorial/content/:subtopicId
```

The exact routes should be finalized in Prompt 01 after inspecting your existing routes.

---

# How many DB tables?

I would **not decide the final number before Prompt 01**.

But I expect roughly:

```text
Existing Tutorial Tables
        +
────────────────────────────
New Authoring Tables
────────────────────────────
tutorial_documents
tutorial_document_versions
tutorial_content_analysis
tutorial_block_suggestions
tutorial_presentation_suggestions
tutorial_review_decisions
tutorial_assets
```

Potentially **7 additional tables**.

But there's an important optimization:

### Don't create a table for every paragraph.

Instead:

```text
tutorial_document_versions
        │
        └── document_json JSONB
```

containing:

```text
blocks[]
```

This is much cleaner for a page-builder system.

---

# And this is different from your existing 6-block model

This is the architectural issue we need to resolve first.

Your existing schema says:

```text
tutorial_content
    ↓
6 blocks
```

while our new system says:

```text
tutorial_document
    ↓
many composable blocks
```

The existing project documentation explicitly calls the six-block schema **LOCKED**. 

Therefore I would **not tell an AI coding agent to simply replace `tutorial_content` with the new model**.

Instead, Prompt 01 should determine whether we use:

```text
                 SUBTOPIC
                    │
        ┌───────────┴───────────┐
        │                       │
 Existing 6-block content   New rich document
        │                       │
 Legacy/learning modes      Composer content
```

or:

```text
SUBTOPIC
   ↓
Rich Document
   ↓
6 learning modes represented as document sections
```

That decision needs to be explicit.

---

# Where FastAPI fits in the final architecture

My preferred architecture for your project would be:

```text
                     ADMIN
                       │
                       ▼
              Next.js + React
                       │
                       ▼
              Tutorial Service
              TypeScript/Hono
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      Tutorial DB   Content      QStash
                    Analyzer
                       │
              ┌────────┴─────────┐
              │                  │
              ▼                  ▼
       Deterministic        Optional
       Rule Engine           FastAPI
                                │
                                ▼
                           Your LLM
```

Then:

```text
Tutorial DB
     ↓
Tutorial Service
     ↓
Next.js Renderer
     ↓
React Block Components
     ↓
Learner
```

---

# So, do you need FastAPI?

### For the core Tutorial Engine:

**No.**

Your:

```text
Next.js
React
TypeScript
Tutorial Service
Drizzle
Postgres
```

are enough.

### For your existing custom LLM:

**Yes, potentially.**

Keep FastAPI as an **AI inference service**, especially since you already have it working.

### For Page 12–14 intelligence:

Start with:

```text
TypeScript deterministic analyzer
```

Then optionally:

```text
FastAPI → your LLM
```

for semantic suggestions.

---

# The 14-prompt implementation sequence

```text
01  Architecture + ADR
        ↓
02  Database Design
        ↓
03  Drizzle + Repositories
        ↓
04  TypeScript + Zod Contracts
        ↓
05  Raw Content Import
        ↓
06  Deterministic Content Analysis
        ↓
07  Block Suggestions
        ↓
08  Presentation Suggestions
        ↓
09  Human Review
        ↓
10  Tutorial Composer
        ↓
11  Properties + Layout Composer
        ↓
12  API + Versioning + Publishing
        ↓
13  Universal Renderer + Learner Page
        ↓
14  Optional FastAPI / LLM Integration
```

And **Page 16's architecture is the principle behind all 14 prompts**, while Pages 1–15 are the UI/UX specification.

### One thing I would change from our earlier plan

I would **not start coding Prompt 02 until Prompt 01 has reconciled the new Composer document model with your existing locked six-block `content-json-schema.md`**. That is the one architectural decision that could otherwise cause a major rewrite later. 

If we get that decision right first, the remaining 13 prompts can be made extremely detailed—down to **exact tables, columns, indexes, TypeScript interfaces, Zod schemas, API request/response DTOs, Next.js routes, React components, repository methods, tests, and acceptance criteria**.


Yes. Below is the **complete tabular version of the architecture and implementation plan we discussed**, including the **16 UI pages, 14 implementation prompts, DB/API/TypeScript/Next.js responsibilities, and the role of FastAPI + your existing LLM**.

One important source-based constraint: your existing Tutorial Engine already defines a **6-block JSONB content model** and explicitly treats the canonical content schema as locked; it also already has Tutorial DB, Drizzle, repository patterns, content versioning, and a separate tutorial app/service architecture.  

Therefore, the new Composer architecture should be implemented as an **evolution/extension**, not by blindly replacing the existing model.

---

# 1. Overall Objective

| Area                     | Final Objective                                                 |
| ------------------------ | --------------------------------------------------------------- |
| Content input            | Author provides normal human-readable content                   |
| JSON                     | Generated by the system; author does not manually write JSON    |
| Content analysis         | Detect structure, sections, lists, code, tables, etc.           |
| Block suggestions        | Recommend appropriate Tutorial blocks                           |
| Presentation suggestions | Recommend layouts such as two-column, cards, comparison table   |
| Human control            | Author accepts, rejects, modifies suggestions                   |
| Composer                 | Author visually builds/refines final document                   |
| Database                 | Stores structured tutorial document/version                     |
| Renderer                 | Converts stored document into React UI                          |
| Learner                  | Sees final responsive Tutorial Page                             |
| AI                       | Optional semantic intelligence; not required for core system    |
| FastAPI                  | Optional AI/LLM service, not required for normal CRUD/rendering |

---

# 2. Complete 16 Web-Page Sequence

| Logical Order | Image/Page                        | Purpose                                       | Main Implementation           |
| ------------: | --------------------------------- | --------------------------------------------- | ----------------------------- |
|         **1** | Tutorial Architecture Dashboard   | Domain → Subject → Topic → Subtopic hierarchy | Curriculum/navigation         |
|         **2** | Subtopic & Content Mode Selection | Select what content is being created          | Content authoring context     |
|         **3** | Empty Tutorial Composer           | Empty visual builder                          | Composer shell                |
|         **4** | Populated Tutorial Composer       | Display actual content as blocks              | Document editor               |
|         **5** | Component Property Editor         | Configure selected block                      | Block-specific forms          |
|         **6** | Layout Composer                   | Arrange blocks spatially                      | Layout/nesting system         |
|         **7** | Preview & Responsive View         | Desktop/tablet/mobile preview                 | Renderer preview              |
|         **8** | Database & JSON Mapping           | Show document → JSON → DB                     | Persistence architecture      |
|         **9** | Public Tutorial Page              | Final learner UI                              | Next.js learner renderer      |
|        **10** | Complete End-to-End Flow          | Master system flow                            | Architecture reference        |
|        **11** | Raw Content Import                | Paste/import normal content                   | Import service                |
|        **12** | Content Analysis                  | Analyze imported content                      | Parser + analyzer             |
|        **13** | Block Suggestions                 | Suggest block types                           | Suggestion engine             |
|        **14** | Presentation Ideas                | Suggest layouts/visual treatments             | Presentation engine           |
|        **15** | Review & Approve                  | Human accepts/rejects/modifies suggestions    | Review workflow               |
|        **16** | Content Intelligence Architecture | Technical architecture of intelligence layer  | Parser + rules + optional LLM |

---

# 3. Correct Implementation Sequence

Although the screens are numbered 1–16, I recommend implementing them in this order:

| Implementation Phase          | Pages | Reason                                   |
| ----------------------------- | ----- | ---------------------------------------- |
| **Foundation**                | 1 → 2 | Establish curriculum and content context |
| **Input**                     | 11    | Need content before analysis             |
| **Analysis**                  | 12    | Understand imported content              |
| **Block Intelligence**        | 13    | Convert analysis into block suggestions  |
| **Presentation Intelligence** | 14    | Recommend layouts                        |
| **Human Review**              | 15    | Author approves suggestions              |
| **Architecture**              | 16    | Formalize intelligence layer             |
| **Composer**                  | 3 → 4 | Build/refine document                    |
| **Properties**                | 5     | Configure blocks                         |
| **Layout**                    | 6     | Arrange blocks                           |
| **Preview**                   | 7     | Validate result                          |
| **Persistence**               | 8     | Save structured document                 |
| **Learner**                   | 9     | Render public page                       |
| **Master Flow**               | 10    | Verify entire system                     |

---

# 4. The Core Data Flow

| Stage                      | Input                  | Processing                 | Output                   |
| -------------------------- | ---------------------- | -------------------------- | ------------------------ |
| **1. Author**              | Human-readable content | Paste/import               | Raw content              |
| **2. Parser**              | Raw content            | Syntax/structure detection | Parsed nodes             |
| **3. Analyzer**            | Parsed nodes           | Structure/semantic rules   | Content analysis         |
| **4. Block Engine**        | Analysis               | Block mapping              | Block suggestions        |
| **5. Presentation Engine** | Analysis + blocks      | Layout heuristics          | Presentation suggestions |
| **6. Human Review**        | Suggestions            | Accept/reject/modify       | Approved structure       |
| **7. Composer**            | Approved structure     | Visual editing             | Final document           |
| **8. Validation**          | Final document         | Schema validation          | Valid document           |
| **9. Persistence**         | Valid document         | Version/save               | DB                       |
| **10. Renderer**           | Published document     | React rendering            | Learner page             |

---

# 5. The 14 Detailed Implementation Prompts

These are the prompts I would eventually provide you.

| Prompt | Name                           | Main Responsibility                                            |
| -----: | ------------------------------ | -------------------------------------------------------------- |
| **01** | Architecture & ADR             | Reconcile new Composer with existing Tutorial Engine           |
| **02** | Database Design                | Define document/version/analysis/suggestion/review persistence |
| **03** | Drizzle + Repository           | Implement schemas, migrations and repository layer             |
| **04** | TypeScript + Zod Contracts     | Canonical types and runtime validation                         |
| **05** | Raw Content Import             | Markdown/rich-text/plain-text ingestion                        |
| **06** | Deterministic Content Analysis | Detect headings, paragraphs, lists, code, tables, sections     |
| **07** | Block Suggestion Engine        | Map analyzed content to block types                            |
| **08** | Presentation Suggestion Engine | Recommend layouts and visual structures                        |
| **09** | Human Review Workflow          | Accept/reject/modify/merge/split/reorder                       |
| **10** | Tutorial Composer              | Visual document builder                                        |
| **11** | Properties + Layout            | Block properties and layout configuration                      |
| **12** | Document API + Versioning      | CRUD, versions, draft/publish                                  |
| **13** | Universal Renderer             | Convert document blocks into React components                  |
| **14** | FastAPI/LLM Provider           | Optional semantic intelligence integration                     |

---

# 6. Prompt 01 — Architecture & ADR

| Item              | Details                                                              |
| ----------------- | -------------------------------------------------------------------- |
| Purpose           | Prevent architectural conflict                                       |
| Must inspect      | Existing Tutorial Engine                                             |
| Existing model    | 6-block JSONB content                                                |
| Existing status   | Canonical content schema is locked                                   |
| New requirement   | Flexible blocks/layouts/composition                                  |
| Output            | ADR + migration strategy                                             |
| Critical decision | Extend existing model vs new document layer                          |
| Must not do       | Blindly replace existing `tutorial_content`                          |
| Why               | Existing project explicitly identifies the 6-block schema as locked  |

---

# 7. Existing Tutorial Architecture vs New Composer

| Existing Tutorial Engine | New Composer Requirement        |
| ------------------------ | ------------------------------- |
| 6 content blocks         | Many reusable blocks            |
| JSONB                    | JSONB remains useful            |
| Notes                    | Paragraph/structured content    |
| Layman                   | Educational content             |
| Real-Life                | Examples/scenarios              |
| Technical                | Technical sections              |
| Code                     | Code blocks                     |
| AI Tutor                 | AI interaction                  |
| Fixed conceptual blocks  | Flexible document composition   |
| Existing versioning      | More detailed document versions |
| Existing admin CRUD      | Visual Composer                 |
| Existing renderer        | Universal block renderer        |

The safest architecture is therefore likely an **additional document/composition layer**, but the exact model should be decided by Prompt 01 after inspecting the current code/schema.

---

# 8. Prompt 02 — Database

The new authoring architecture may require tables approximately like these:

| Table                               | Purpose                                |
| ----------------------------------- | -------------------------------------- |
| `tutorial_documents`                | Logical tutorial document              |
| `tutorial_document_versions`        | Immutable/versioned document snapshots |
| `tutorial_content_analysis`         | Analysis result                        |
| `tutorial_block_suggestions`        | Suggested blocks                       |
| `tutorial_presentation_suggestions` | Suggested layouts                      |
| `tutorial_review_decisions`         | Human decisions                        |
| `tutorial_assets`                   | Images/media/assets                    |

**Important:** these are **proposed tables**, not yet final schema. The existing project already has `tutorial_content`, `tutorial_progress`, project/submission tables, versioning and related Tutorial tables. 

---

# 9. Recommended Storage Model

I would initially target:

| Data                             | Storage                |
| -------------------------------- | ---------------------- |
| Document identity                | Relational columns     |
| Subtopic relation                | Relational FK          |
| Status                           | Relational enum        |
| Version                          | Relational             |
| Author                           | Relational             |
| Published timestamp              | Relational             |
| Document blocks                  | JSONB                  |
| Block content                    | JSONB                  |
| Block presentation configuration | JSONB                  |
| Analysis                         | Separate table/JSONB   |
| Suggestions                      | Separate tables        |
| Review history                   | Separate table         |
| Assets                           | Separate asset records |

This avoids creating a PostgreSQL row for every paragraph.

---

# 10. Prompt 03 — Drizzle + Repository

| Layer          | Responsibility   |
| -------------- | ---------------- |
| Drizzle schema | DB definition    |
| Migration      | Schema evolution |
| Repository     | Data access      |
| Service        | Business logic   |
| API            | HTTP boundary    |
| UI             | Presentation     |

Your existing Tutorial Engine already follows a **Drizzle + repository** approach, so the new implementation should follow that pattern rather than introducing a second persistence style. 

---

# 11. Prompt 04 — TypeScript + Zod

The central TypeScript model would conceptually become:

| Type               | Purpose                    |
| ------------------ | -------------------------- |
| `TutorialDocument` | Complete document          |
| `TutorialBlock`    | Union of block types       |
| `HeadingBlock`     | Heading                    |
| `ParagraphBlock`   | Paragraph                  |
| `BulletListBlock`  | Unordered list             |
| `OrderedListBlock` | Ordered list               |
| `ImageBlock`       | Image                      |
| `TableBlock`       | Table                      |
| `CodeBlock`        | Code                       |
| `CalloutBlock`     | Callout                    |
| `TwoColumnBlock`   | Two-column layout          |
| `CardGridBlock`    | Card layout                |
| `DiagramBlock`     | Diagram                    |
| `BlockSettings`    | Presentation configuration |

Zod should validate the JSON at API boundaries.

---

# 12. Prompt 05 — Raw Content Import

| Input             | Supported                                       |
| ----------------- | ----------------------------------------------- |
| Markdown          | Yes                                             |
| Plain text        | Yes                                             |
| Rich text         | Yes                                             |
| Pasted content    | Yes                                             |
| JSON              | Internal representation, not author requirement |
| Word-like content | Potential importer                              |
| URL               | Future capability                               |

The author should be able to paste the JavaScript content you gave earlier without manually creating JSON.

---

# 13. Prompt 06 — Deterministic Content Analysis

This is the first intelligence layer.

| Detector              | Example                 |
| --------------------- | ----------------------- |
| Heading detector      | `## Where does it run?` |
| Paragraph detector    | Normal prose            |
| Bullet detector       | `- Client-side`         |
| Ordered list detector | `1. First`              |
| Code detector         | Fenced code             |
| Quote detector        | `>`                     |
| Table detector        | Markdown table          |
| Section detector      | Heading hierarchy       |
| Definition detector   | `"X is..."`             |
| Example detector      | `"For example..."`      |
| Warning detector      | `"Important..."`        |
| Summary detector      | `"Summary"`             |

This can initially be implemented entirely in TypeScript.

---

# 14. Prompt 07 — Block Suggestions

| Source Content        | Suggested Block |
| --------------------- | --------------- |
| Title                 | `heading`       |
| Prose                 | `paragraph`     |
| Bullets               | `bullet-list`   |
| Numbered instructions | `ordered-list`  |
| Code                  | `code`          |
| Important warning     | `callout`       |
| Definition            | `definition`    |
| Comparison            | `comparison`    |
| Image reference       | `image`         |
| Example               | `example`       |
| Summary               | `summary`       |

Each suggestion should contain:

| Property       | Purpose                   |
| -------------- | ------------------------- |
| `type`         | Suggested block           |
| `sourceNodeId` | Original content          |
| `confidence`   | Confidence score          |
| `reason`       | Why it was suggested      |
| `status`       | Pending/accepted/rejected |

---

# 15. Prompt 08 — Presentation Suggestions

This is different from block detection.

| Content Relationship      | Possible Suggestion |
| ------------------------- | ------------------- |
| Client-side + Server-side | Two-column          |
| A vs B                    | Comparison table    |
| 4 characteristics         | Concept cards       |
| Important clarification   | Callout             |
| Ecosystem categories      | Card/icon grid      |
| Process steps             | Timeline            |
| Architecture explanation  | Diagram             |
| Image + explanation       | Image/text layout   |

The system should say:

> **Suggested**

not:

> **Automatically applied**

---

# 16. Prompt 09 — Human Review

| Action       | Meaning              |
| ------------ | -------------------- |
| Accept       | Keep suggestion      |
| Reject       | Remove suggestion    |
| Modify       | Change configuration |
| Merge        | Combine suggestions  |
| Split        | Divide content       |
| Reorder      | Change sequence      |
| Edit content | Correct source text  |
| Save review  | Persist decisions    |

This is the critical **Human-in-the-Loop** stage.

---

# 17. Prompt 10 — Tutorial Composer

The Composer has:

| Area          | Responsibility             |
| ------------- | -------------------------- |
| Left panel    | Block library              |
| Center canvas | Document                   |
| Right panel   | Properties                 |
| Top bar       | Save/preview/publish       |
| Toolbar       | Undo/redo/duplicate/delete |
| Outline       | Document navigation        |

Flow:

```text
Approved Suggestions
        ↓
Composer
        ↓
Author rearranges
        ↓
Final Document
```

---

# 18. Prompt 11 — Properties + Layout

| Component  | Example Properties         |
| ---------- | -------------------------- |
| Paragraph  | alignment, width, emphasis |
| Heading    | level, alignment           |
| Image      | asset, width, position     |
| Table      | rows, columns, header      |
| Code       | language, filename         |
| Callout    | type, title, icon          |
| Two-column | ratio, gap                 |
| Cards      | columns, style             |
| Diagram    | source, dimensions         |

---

# 19. Prompt 12 — API + Versioning

### Content APIs

| Method | Endpoint Concept          | Purpose            |
| ------ | ------------------------- | ------------------ |
| POST   | `/content/import`         | Import raw content |
| POST   | `/content/analyze`        | Analyze content    |
| GET    | `/documents/:id`          | Get document       |
| POST   | `/documents`              | Create document    |
| PATCH  | `/documents/:id`          | Update draft       |
| GET    | `/documents/:id/versions` | Version history    |
| POST   | `/documents/:id/publish`  | Publish            |

### Suggestion APIs

| Method | Purpose                           |
| ------ | --------------------------------- |
| GET    | Retrieve suggestions              |
| POST   | Review suggestions                |
| POST   | Generate presentation suggestions |

Exact routes should be reconciled with your existing `api-server` routes before implementation; your current architecture already has Tutorial API routes and content caching. 

---

# 20. Prompt 13 — Renderer

The renderer should work like:

```text
Document
   ↓
blocks[]
   ↓
BlockRenderer
   ↓
type resolver
   ↓
React component
```

| DB Type       | React Component   |
| ------------- | ----------------- |
| `heading`     | `HeadingBlock`    |
| `paragraph`   | `ParagraphBlock`  |
| `bullet-list` | `BulletListBlock` |
| `table`       | `TableBlock`      |
| `code`        | `CodeBlock`       |
| `callout`     | `CalloutBlock`    |
| `two-column`  | `TwoColumnBlock`  |
| `card-grid`   | `CardGridBlock`   |
| `diagram`     | `DiagramBlock`    |

This is where your existing Next.js/React stack remains the primary rendering technology.

---

# 21. Prompt 14 — FastAPI + Existing LLM

This is the most important distinction concerning your question about FastAPI.

| Requirement              | Next.js/TypeScript | FastAPI |
| ------------------------ | -----------------: | ------: |
| Admin UI                 |                  ✅ |       ❌ |
| Composer                 |                  ✅ |       ❌ |
| Drag/drop                |                  ✅ |       ❌ |
| Block rendering          |                  ✅ |       ❌ |
| Document CRUD            |                  ✅ |       ❌ |
| DB repository            |                  ✅ |       ❌ |
| Zod validation           |                  ✅ |       ❌ |
| Deterministic parser     |                  ✅ |       ❌ |
| Basic content analysis   |                  ✅ |       ❌ |
| Semantic analysis        |           Optional |       ✅ |
| LLM inference            |           Optional |       ✅ |
| Question-bank generation |   Existing FastAPI |       ✅ |
| AI content suggestions   |           Optional |       ✅ |

So:

### **You do NOT need FastAPI for the Tutorial Engine itself.**

You can have:

```text
Next.js
   ↓
Tutorial API/Service
   ↓
PostgreSQL
```

And optionally:

```text
Tutorial Service
      ↓
FastAPI
      ↓
Your existing LLM
```

---

# 22. Recommended LLM Architecture

Do **not** make React directly call FastAPI.

Instead:

```text
React Composer
      ↓
Tutorial Service
      ↓
Content Intelligence Provider
      │
      ├── RuleBasedProvider
      │
      └── FastApiLlmProvider
                  ↓
             Your LLM
```

This gives you model independence.

---

# 23. Your Existing LLM

You already have:

```text
FastAPI
   ↓
Your in-built LLM
   ↓
Repeated JSON question-bank generation
```

Keep that system.

Don't immediately force it to handle Tutorial Intelligence.

Instead, create a separate capability:

| Existing capability  | New capability           |
| -------------------- | ------------------------ |
| Question generation  | Content analysis         |
| Question JSON        | Block suggestions        |
| Correct answer       | Presentation suggestions |
| Explanation          | Reason/confidence        |
| Question-bank schema | Tutorial document schema |

We should test whether your existing LLM is suitable before expanding it.

---

# 24. Recommended Provider Interface

Conceptually:

```text
ContentIntelligenceProvider
          │
          ├── RuleBasedProvider
          │
          └── FastApiLlmProvider
```

| Provider     | When used                    |
| ------------ | ---------------------------- |
| Rule-based   | Always available             |
| FastAPI LLM  | Optional semantic enrichment |
| Future model | Can be added later           |

This means your Tutorial Engine does not become dependent on OpenAI, Claude, Gemini, or even your own LLM.

---

# 25. Do You Need to Build Your Own LLM?

| Option                            | Recommendation |
| --------------------------------- | -------------- |
| Build LLM from scratch            | ❌ No           |
| Use OpenAI                        | Not required   |
| Use Claude                        | Not required   |
| Use Gemini                        | Not required   |
| Use your existing FastAPI LLM     | ✅ Optional     |
| Build TypeScript parser/rules     | ✅ Yes          |
| Build Tutorial Intelligence layer | ✅ Yes          |
| Add local LLM later               | ✅ Possible     |

Your actual problem is:

> **Content → Structure → Presentation**

not:

> **Build a general-purpose language model.**

---

# 26. Complete Technology Mapping

| Layer                | Technology                                   |
| -------------------- | -------------------------------------------- |
| Admin UI             | Next.js                                      |
| UI                   | React                                        |
| Styling              | Tailwind/shadcn                              |
| Drag/drop            | React-based library                          |
| Composer state       | React/state management                       |
| API                  | Existing TypeScript API/service architecture |
| Database             | PostgreSQL/Neon                              |
| ORM                  | Drizzle                                      |
| Validation           | TypeScript + Zod                             |
| Document storage     | JSONB                                        |
| Versioning           | PostgreSQL                                   |
| Parser               | TypeScript                                   |
| Rule engine          | TypeScript                                   |
| Optional semantic AI | FastAPI                                      |
| Existing LLM         | Your current FastAPI LLM                     |
| Background work      | QStash where needed                          |
| Cache                | Existing Redis/Cloudflare architecture       |
| Learner rendering    | Next.js + React                              |
| Assets               | Existing object storage/CDN architecture     |

---

# 27. What should NOT go into the DB

| Do NOT store                    | Where it belongs |
| ------------------------------- | ---------------- |
| React source code               | Git              |
| JSX                             | Git              |
| Tailwind classes                | Code/theme       |
| CSS implementation              | Code             |
| Responsive logic                | React/CSS        |
| Accessibility implementation    | React            |
| Component behavior              | React            |
| Event handlers                  | React            |
| Animation implementation        | React            |
| Actual component implementation | React            |

---

# 28. What SHOULD go into the DB

| Store               | Example                     |
| ------------------- | --------------------------- |
| Content             | `"JavaScript is..."`        |
| Block type          | `"paragraph"`               |
| Order               | `4`                         |
| Layout relationship | `"two-column"`              |
| Presentation config | `{ imagePosition: "left" }` |
| Asset ID            | `"asset_123"`               |
| Version             | `7`                         |
| Status              | `draft`                     |
| Author              | `user_id`                   |
| Review decision     | `accepted`                  |
| Suggestions         | suggestion records          |
| Analysis            | analysis results            |

---

# 29. Final Architecture

| Layer                    | Responsibility             |
| ------------------------ | -------------------------- |
| **Content Author**       | Writes educational content |
| **Import Layer**         | Accepts content            |
| **Parser**               | Detects structural syntax  |
| **Content Intelligence** | Understands patterns       |
| **Suggestion Engine**    | Recommends blocks          |
| **Presentation Engine**  | Recommends layouts         |
| **Human Review**         | Approves/modifies          |
| **Composer**             | Builds final document      |
| **Validator**            | Validates document         |
| **Database**             | Stores document/version    |
| **API**                  | Serves document            |
| **Renderer**             | Maps block → React         |
| **Learner Page**         | Displays tutorial          |

---

# 30. Final End-to-End Table

|   Step | User/System                            | Technology              | Result                        |
| -----: | -------------------------------------- | ----------------------- | ----------------------------- |
|  **1** | Admin selects hierarchy                | Next.js                 | Domain/Subject/Topic/Subtopic |
|  **2** | Admin selects content mode             | React                   | Authoring context             |
|  **3** | Admin pastes content                   | Next.js                 | Raw content                   |
|  **4** | Parser processes content               | TypeScript              | Parsed nodes                  |
|  **5** | Analyzer detects structure             | TypeScript              | Content analysis              |
|  **6** | Optional LLM enriches analysis         | FastAPI                 | Semantic suggestions          |
|  **7** | Block engine recommends components     | TypeScript              | Block suggestions             |
|  **8** | Presentation engine recommends layouts | TypeScript/optional LLM | Presentation suggestions      |
|  **9** | Author reviews                         | React                   | Accepted/rejected/modified    |
| **10** | Composer builds document               | React                   | Final document                |
| **11** | Zod validates                          | TypeScript              | Valid document                |
| **12** | API saves                              | TypeScript service      | Draft/version                 |
| **13** | DB persists                            | PostgreSQL/Drizzle      | JSONB document                |
| **14** | Author previews                        | React                   | Responsive preview            |
| **15** | Admin publishes                        | API + DB                | Published version             |
| **16** | Learner requests page                  | Next.js                 | Document retrieved            |
| **17** | Renderer resolves blocks               | React                   | UI components                 |
| **18** | Learner sees tutorial                  | Browser                 | Final Tutorial Page           |

---

# 31. The most important architectural decision

Your existing project already has:

```text
tutorial_content
      ↓
6-block JSONB
      ↓
Tutorial Renderer
```

and the canonical schema is marked **LOCKED**. 

Our new system introduces:

```text
tutorial document
      ↓
many composable blocks
      ↓
visual composer
      ↓
document JSON
```

Therefore, **Prompt 01 must be executed first**.

We need to decide whether the new Composer:

1. **extends the existing six-block model**, or
2. introduces a **new document/composition layer while preserving the existing six-block model**, or
3. transforms the existing six content modes into sections within the new document model.

I recommend **option 2 or 3**, rather than destroying the existing model.

That preserves the substantial Tutorial Engine work already specified: JSONB content, versioning, repository pattern, progress tracking, AI Tutor, remediation, and existing learner rendering. 

### In one sentence:

> **Your author writes normal content → TypeScript parser/rules analyze it → optional FastAPI LLM adds semantic suggestions → human approves → React Composer builds the document → JSONB stores the approved document → Next.js/React renders it for the learner.**

That is the complete architecture we have arrived at.


Yes. We should now create a **clear 1:1 mapping between the 16 UI/UX images and the 14 implementation prompts**.

There is **not exactly one prompt per image** because some implementation prompts create multiple screens, while some architecture screens are reference/overview screens rather than independent implementation modules.

---

# 1. Master Mapping — 16 Images → 14 Prompts

|  Image | Web Page                          | Primary Purpose                     | Implementation Prompt(s)                 | Priority     |
| -----: | --------------------------------- | ----------------------------------- | ---------------------------------------- | ------------ |
|  **1** | Tutorial Architecture Dashboard   | Domain → Subject → Topic → Subtopic | **Prompt 01**                            | Foundation   |
|  **2** | Subtopic & Content Mode Selection | Select content creation context     | **Prompt 01**                            | Foundation   |
|  **3** | Empty Tutorial Composer           | Empty visual editor                 | **Prompt 10**                            | Core         |
|  **4** | Populated Tutorial Composer       | Render/edit document blocks         | **Prompt 10**                            | Core         |
|  **5** | Component Property Editor         | Edit block configuration            | **Prompt 11**                            | Core         |
|  **6** | Layout Composer                   | Arrange/nest blocks                 | **Prompt 11**                            | Core         |
|  **7** | Preview & Responsive View         | Desktop/tablet/mobile preview       | **Prompt 13**                            | Core         |
|  **8** | Database & JSON Mapping           | Document → JSON → DB                | **Prompt 02 + 03 + 04**                  | Backend      |
|  **9** | Public Tutorial Page              | Learner-facing renderer             | **Prompt 13**                            | Core         |
| **10** | Complete End-to-End Flow          | Overall system architecture         | **All prompts / architecture reference** | Reference    |
| **11** | Raw Content Import                | Human-readable content input        | **Prompt 05**                            | Intelligence |
| **12** | Content Analysis                  | Parse/analyze content               | **Prompt 06**                            | Intelligence |
| **13** | Block Suggestions                 | Suggest component types             | **Prompt 07**                            | Intelligence |
| **14** | Presentation Ideas                | Suggest layouts/visual components   | **Prompt 08**                            | Intelligence |
| **15** | Review & Approve                  | Human-in-the-loop decisions         | **Prompt 09**                            | Intelligence |
| **16** | Content Intelligence Architecture | Parser + Rules + Optional LLM       | **Prompt 01 + 06 + 07 + 08 + 14**        | Architecture |

---

# 2. Prompt → Image Mapping

Now let's look at it from the opposite direction.

## Prompt 01 — Architecture & ADR

### Maps primarily to:

**Page 1, Page 2, Page 16**

| Page   | Why                                                       |
| ------ | --------------------------------------------------------- |
| **1**  | Establishes Tutorial/curriculum architecture              |
| **2**  | Establishes content authoring context                     |
| **16** | Establishes the overall Content Intelligence architecture |

Prompt 01 is special because it is **not simply a coding prompt**.

It first tells the implementation agent:

> Inspect the existing Tutorial Engine before changing anything.

This is especially important because your existing Tutorial Engine has an established six-block content model and architecture. 

---

# 3. Prompt 02 — Database Design

### Maps primarily to:

**Page 8**

```text id="k0r0t3"
Page 8
Database & JSON Mapping
```

This prompt defines:

```text id="0t2z7b"
Document
Version
Blocks
Analysis
Suggestions
Reviews
Assets
```

and determines what is relational versus JSONB.

---

# 4. Prompt 03 — Drizzle + Repository

### Maps primarily to:

**Page 8**

But this is an **implementation-level prompt**, so you won't see most of its work visually.

```text id="8i8d2g"
Page 8
      ↓
Database
      ↓
Drizzle
      ↓
Repository
```

It implements the database architecture shown on Page 8.

---

# 5. Prompt 04 — TypeScript + Zod Contracts

### Maps primarily to:

**Page 8 + Pages 3–9**

Because TypeScript types are the contract between:

```text id="5p1f6g"
Composer
   ↓
API
   ↓
DB
   ↓
Renderer
```

It therefore touches almost the entire system.

But visually, its strongest representation is **Page 8**.

---

# 6. Prompt 05 — Raw Content Import

### Maps exactly to:

# **Page 11**

```text id="y1px2j"
Page 11
Raw Content Import
```

Example:

```text
# JavaScript

JavaScript is a programming language...

## Where does it run?

- Client-side
- Server-side
```

The author enters **human-readable content**.

No JSON required.

---

# 7. Prompt 06 — Deterministic Content Analysis

### Maps exactly to:

# **Page 12**

```text id="h6l3xq"
Page 12
Content Analysis
```

The system detects:

```text
Heading
Paragraph
Bullet
Ordered List
Code
Table
Quote
Section
Definition
Example
Warning
Summary
```

This is the first major part of the **Content Intelligence Engine**.

---

# 8. Prompt 07 — Block Suggestion Engine

### Maps exactly to:

# **Page 13**

```text id="8f2c3m"
Page 13
Block Suggestions
```

For example:

```text
"Client-side"
"Server-side"
```

might become:

```text
Suggested Block:
Two related concept blocks

Confidence:
82%

Reason:
Parallel concepts detected
```

Or:

```text
Normal prose
       ↓
ParagraphBlock
```

---

# 9. Prompt 08 — Presentation Suggestion Engine

### Maps exactly to:

# **Page 14**

```text id="5u8w0k"
Page 14
Presentation Ideas
```

This is where the system can recommend:

```text
Two Column
Comparison Table
Concept Cards
Callout
Image + Content
Diagram
Timeline
```

Important:

> **These are suggestions, not automatic UI decisions.**

---

# 10. Prompt 09 — Human Review Workflow

### Maps exactly to:

# **Page 15**

```text id="e4r9vn"
Page 15
Review & Approve
```

The author sees:

```text
AI/Rules Suggestion
        ↓
[ Accept ]
[ Reject ]
[ Modify ]
```

This is the **Human-in-the-Loop** boundary.

---

# 11. Prompt 10 — Tutorial Composer

### Maps to:

# **Page 3 + Page 4**

This prompt creates the actual visual editor.

### Page 3

```text
Empty Composer
```

### Page 4

```text
Populated Composer
```

So:

```text id="c1j2pm"
Prompt 10
     │
     ├── Page 3
     │     Empty Composer
     │
     └── Page 4
           Populated Composer
```

This is one of the most important prompts.

---

# 12. Prompt 11 — Properties + Layout Composer

### Maps to:

# **Page 5 + Page 6**

### Page 5

Component Property Editor:

```text
Paragraph
 ├── Alignment
 ├── Width
 └── Emphasis
```

### Page 6

Layout Composer:

```text
Two Column
 ├── Left
 └── Right
```

Therefore:

```text id="c4n7tm"
Prompt 11
     │
     ├── Page 5
     │
     └── Page 6
```

---

# 13. Prompt 12 — Document API + Versioning

### Maps primarily to:

# **Page 8**

and secondarily:

* Page 7
* Page 9
* Page 10

Because the API connects:

```text id="b3t8dv"
Composer
   ↓
API
   ↓
DB
```

and:

```text
DB
 ↓
API
 ↓
Learner
```

So Page 8 is the primary visual representation.

---

# 14. Prompt 13 — Universal Renderer + Learner Page

### Maps directly to:

# **Page 7 + Page 9**

### Page 7

Preview:

```text
Desktop
Tablet
Mobile
```

### Page 9

Actual learner page:

```text
Database
 ↓
API
 ↓
BlockRenderer
 ↓
React
 ↓
Learner
```

Therefore:

```text id="6j8t5r"
Prompt 13
     │
     ├── Page 7
     │
     └── Page 9
```

---

# 15. Prompt 14 — Optional FastAPI / LLM Provider

### Maps primarily to:

# **Page 16**

and supports:

* Page 12
* Page 13
* Page 14

Because FastAPI/LLM is **not the core Tutorial UI**.

It is an optional intelligence provider.

```text id="s0q3mc"
Page 12
Content Analysis
       ↑
       │
Page 16
Intelligence Architecture
       │
       ↓
Page 13
Block Suggestions
       ↓
Page 14
Presentation Suggestions
```

The FastAPI service belongs behind the Content Intelligence abstraction.

---

# 16. What About Page 10?

Page 10 is different.

It is the:

# **Master Architecture Page**

It does not map to one specific prompt.

It represents the combined result of all 14 prompts:

```text id="i2uh3f"
Prompt 01
   ↓
Prompt 02
   ↓
Prompt 03
   ↓
Prompt 04
   ↓
Prompt 05
   ↓
Prompt 06
   ↓
Prompt 07
   ↓
Prompt 08
   ↓
Prompt 09
   ↓
Prompt 10
   ↓
Prompt 11
   ↓
Prompt 12
   ↓
Prompt 13
   ↓
Prompt 14
```

So:

> **Page 10 is the architectural summary, not an independent implementation module.**

---

# 17. Final Matrix

Here is the simplest reference table you can keep while implementing.

|  Image | Page                            |                 Prompt | Module                    |
| -----: | ------------------------------- | ---------------------: | ------------------------- |
|  **1** | Tutorial Architecture Dashboard |                 **01** | Curriculum Architecture   |
|  **2** | Subtopic & Content Mode         |                 **01** | Authoring Context         |
|  **3** | Empty Composer                  |                 **10** | Composer                  |
|  **4** | Populated Composer              |                 **10** | Composer                  |
|  **5** | Property Editor                 |                 **11** | Block Configuration       |
|  **6** | Layout Composer                 |                 **11** | Layout Engine             |
|  **7** | Preview                         |                 **13** | Renderer                  |
|  **8** | JSON + DB                       |     **02, 03, 04, 12** | Persistence               |
|  **9** | Learner Page                    |                 **13** | Learner Renderer          |
| **10** | Complete Flow                   |              **01–14** | Master Architecture       |
| **11** | Raw Content Import              |                 **05** | Import                    |
| **12** | Content Analysis                |                 **06** | Analyzer                  |
| **13** | Block Suggestions               |                 **07** | Block Intelligence        |
| **14** | Presentation Ideas              |                 **08** | Presentation Intelligence |
| **15** | Review & Approve                |                 **09** | Human Review              |
| **16** | Intelligence Architecture       | **01, 06, 07, 08, 14** | Intelligence Layer        |

---

# 18. The Actual Development Dependency Graph

This is the part I recommend you follow when we start generating the prompts:

```text id="2v9b4w"
                  PROMPT 01
             Architecture / ADR
                    │
        ┌───────────┼────────────┐
        ↓           ↓            ↓
   Prompt 02    Prompt 04    Prompt 05
   Database      Types        Import
        │           │            │
        ↓           │            ↓
   Prompt 03        │       Prompt 06
   Drizzle          │       Analysis
        │            │            │
        └──────┬─────┘            ↓
               │             Prompt 07
               │             Block Suggestions
               │                  │
               │                  ↓
               │             Prompt 08
               │             Presentation
               │                  │
               │                  ↓
               │             Prompt 09
               │             Human Review
               │                  │
               └──────────┬───────┘
                          ↓
                    Prompt 10
                      Composer
                          │
                          ↓
                    Prompt 11
                 Properties/Layout
                          │
                          ↓
                    Prompt 12
                  API/Versioning
                          │
                          ↓
                    Prompt 13
                     Renderer
                          │
                          ↓
                    Learner Page

                    Prompt 14
                       ↑
                       │
                Optional semantic
                    intelligence
                       │
                    FastAPI
                       │
                    Your LLM
```

---

# 19. Most Important: Which Prompt Should We Start With?

### **Prompt 01 — Architecture & ADR**

**Not Prompt 02.**

Because before creating DB tables, we need to reconcile:

```text
EXISTING
6-block Tutorial JSON
        +
EXISTING
Tutorial Engine architecture
        +
NEW
Flexible Composer blocks
        +
NEW
Content Intelligence
```

The existing project documentation says the six-block schema is locked, so this reconciliation must happen before we generate migrations. 

Once Prompt 01 establishes the architecture, we can safely generate:

**01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14**

with each prompt referencing the decisions and artifacts produced by the previous prompt.

### In short:

**16 UI/UX images → 14 implementation prompts → 1 dependency chain.**

And **Page 10 is the master map**, while **Page 16 is the master map specifically for the Content Intelligence/LLM layer**.
