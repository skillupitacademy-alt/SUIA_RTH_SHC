# FILE 05 — VisualBlock.md
## Detailed Project LLM Review

I have now worked through the converted **`VisualBlock.md`** corpus as the next file in the agreed one-file-at-a-time sequence. The file is substantial: the Files index reports **261,098 bytes and 10,037 lines**. The document develops the VisualBlock family from V1 through V8 and ends with a consolidated VisualBlock progression. VisualBlock

There is one important correction to our earlier corpus assumptions:

> **This Markdown file establishes VisualBlock V1–V8, not V1–V10.**

The file's own final progression ends at V8. Therefore I will **not infer V9/V10 merely because an earlier architecture document or proposed 18-family count suggested ten Visual versions.** 

---

# 1. VisualBlock family identity

## Evidence: VERIFIED

The file defines VisualBlock as the family for representing technical concepts through visual structures rather than relying entirely on prose.

Its central learning purpose progresses from:

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

The final family progression is:

| Version | Name | Primary learning purpose |
|---|---|---|
| **V1** | Basic Visual | Show the concept |
| **V2** | Visual + Labels | Identify important parts |
| **V3** | Visual + Explanation | Explain meaning |
| **V4** | Visual + Step-by-Step Flow | Show progression |
| **V5** | Visual + Concept Map | Show conceptual relationships |
| **V6** | Visual + Comparison | Compare related concepts |
| **V7** | Visual + Annotated Diagram | Explain individual diagram parts |
| **V8** | Complete Visual Learning Model | Integrate the visual teaching model |

This is one of the strongest pieces of evidence in the file because the progression is explicitly restated at the end rather than appearing only in individual sections. 

### Project LLM interpretation

The family is not simply:

> "different visual designs."

It is a **semantic teaching progression**.

That distinction is important for the eventual Project LLM because version selection should be driven primarily by the **learning job**, not by superficial visual appearance.

---

# 2. V1 — Basic Visual

## Evidence: VERIFIED

V1 is intentionally minimal:

```text
Visual
   ↓
Caption
   ↓
Short Explanation
```

Its stated learning question is essentially:

> What does this concept look like?

The document uses examples such as:

- client/server architecture
- machine-learning pipeline
- ETL
- security boundaries
- controlled security-assessment workflows
- qubit measurement
- function calls
- NumPy operations
- Pandas DataFrames
- OOP class/object relationships
- API request/response
- application/database interaction.

The file explicitly says V1 should communicate **one visual idea clearly**, rather than becoming a large multi-diagram teaching block. VisualBlock

### Structural model

```text
<section>
 ├── <header>
 │    ├── eyebrow
 │    └── <h2>
 │
 ├── <figure>
 │    ├── visual
 │    └── <figcaption>
 │
 └── <p>
```

The reference design strongly favors semantic `<figure>` / `<figcaption>` usage.

### Data model

The reference JSON follows:

```text
type
version
content
 ├── title
 ├── visual
 ├── caption
 └── explanation
```

The visual itself can conceptually be:

- SVG
- image
- generated asset
- diagram definition
- structured diagram JSON.

The document explicitly leaves the concrete rendering representation open.

### Project LLM interpretation

V1 is a good example of a **reference semantic version**, not necessarily a production component implementation.

The Project LLM should understand:

```text
V1
=
one visual concept
+
minimal supporting explanation
```

rather than:

```text
V1
=
one particular React layout
```

---

# 3. V2 — Visual + Labels

## Evidence: VERIFIED

V2 adds explicit identification of important visual elements.

Its conceptual progression is:

```text
V1
Show the visual
       ↓
V2
Show + identify the important parts
```

The file describes explicit node labels, label metadata, optional callouts, numbered markers and legends. Interaction and animation remain excluded. VisualBlock

### Learning purpose

V2 answers:

> **What are the important parts of this visual?**

That makes V2 meaningfully different from V1.

### Project LLM interpretation

A future block-selection engine should not select V2 simply because a diagram contains text.

The relevant condition is:

```text
Are explicit labels part of the learning objective?
```

If yes → V2 semantics become relevant.

---

# 4. V3 — Visual + Explanation

## Evidence: VERIFIED

V3 extends V2:

```text
Visual
 ↓
Labels
 ↓
Explanation
 ↓
Caption
```

Its learning question becomes:

> **What does this visual mean and how do its parts relate?**

The file explicitly distinguishes V3 from merely adding more labels. Explanation becomes a core teaching function. VisualBlock

### Important semantic boundary

This is still a VisualBlock.

The explanation should explain the **visual model**, not become an independent lesson.

That distinction will matter later when the Project LLM audits generated blocks for boundary violations.

For example:

```text
VisualBlock V3
    ↓
"What does this architecture mean?"
```

is appropriate.

Whereas:

```text
VisualBlock V3
    ↓
"Here is a 1,500-word lesson about distributed systems."
```

would begin to overlap with other block families.

---

# 5. V4 — Visual + Step-by-Step Flow

## Evidence: VERIFIED

V4 introduces **sequence/progression**.

The family progression explicitly distinguishes:

```text
V3 → EXPLAIN
V4 → PROGRESS
```

This distinction is important.

A visual showing:

```text
A → B → C → D
```

is not automatically a V5 concept map.

If the arrows primarily communicate **order or process**, V4 is the appropriate semantic model.

The file repeatedly distinguishes V4's sequential meaning from V5's conceptual relationships. 

### Project LLM rule

This should eventually become a semantic classifier:

```text
Arrow means "happens next"
        ↓
V4

Arrow means "is related to"
        ↓
V5
```

That is much more useful than classification based on DOM structure.

---

# 6. V5 — Visual + Concept Map

## Evidence: VERIFIED

V5 changes the visual from a process into a **knowledge relationship network**.

Its core structure is:

```text
Central Concept
      ↓
Related Concepts
      ↓
Relationships
```

The file explicitly distinguishes V5 from V4:

| V4 | V5 |
|---|---|
| Flow | Concept map |
| Sequence is core | Sequence is not core |
| Step numbering | Optional |
| Central concept | Core |
| Sequential relationships | Conceptual relationships |
| Network structure | Core |

The file summarizes the progression as:

```text
V1 → SHOW
V2 → IDENTIFY
V3 → EXPLAIN
V4 → PROGRESS
V5 → CONNECT
```

VisualBlock

### Project LLM interpretation

This is a particularly important distinction for the future **Reference Pattern Analyzer**.

The same SVG/diagram primitives might technically render both V4 and V5.

Therefore:

```text
implementation primitive ≠ educational version
```

This directly supports the architecture correction we have been making throughout the corpus investigation.

---

# 7. V6 — Visual + Comparison

## Evidence: VERIFIED

V6 introduces visual comparison.

Its learning question is:

> **How are these concepts different or similar?**

The document recommends:

```text
Concept A
    VS
Concept B
```

with common comparison dimensions.

For example:

```text
              LIST              TUPLE

Mutability    Mutable           Immutable
Syntax        []                ()
Ordering      Ordered           Ordered
```

The file explicitly warns that V6 should not simply become a generic table. Its defining feature is **visual comparison**. VisualBlock

### Important design rule

The document recommends keeping the number of concepts small:

- 2 ideal
- 3 maximum recommended
- 3–6 comparison dimensions
- one key difference.

It also says comparison dimensions should be reasonably symmetrical.

### Project LLM interpretation

This provides a useful future validation rule:

```text
IF comparison item A has arbitrary dimensions
AND comparison item B has unrelated dimensions
THEN
    semantic quality warning
```

That is more meaningful than simply validating:

```text
items.length >= 2
```

---

# 8. V7 — Visual + Annotated Diagram

## Evidence: VERIFIED

V7 adds **targeted explanations attached to specific visual elements**.

Its structure is:

```text
Complete Diagram
      ↓
Callouts
      ↓
Targeted Explanations
```

The file describes a renderer architecture along the lines of:

```text
V7 Renderer
 ├── Header
 ├── AnnotatedFigure
 │    ├── DiagramCanvas
 │    ├── DiagramNodes
 │    ├── Connections
 │    └── HighlightTargets
 │
 ├── Callouts
 │    ├── Number
 │    ├── Connector
 │    └── Target
 │
 ├── Caption
 └── AnnotationList
```

Its validation model requires annotations with a target and explanation. VisualBlock

### Semantic distinction

V3:

```text
Explain the visual as a whole.
```

V7:

```text
Explain this specific part of the visual.
```

That is a genuine semantic version distinction.

---

# 9. V8 — Complete Visual Learning Model

## Evidence: VERIFIED

The document explicitly describes V8 as the **final VisualBlock version** in this corpus.

Its model is:

```text
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

The file calls this the **Complete Visual Learning Model** and positions it as a premium/default complex visual teaching model. 

### V8 supports multiple visual modes

The document proposes modes such as:

```text
architecture
flow
concept-map
comparison
annotated-diagram
hybrid
```

The important architecture is:

```text
CONTENT DATA
      ↓
V8 RENDERER
      ↓
VISUAL MODE
```

rather than creating a completely different block implementation for every possible visual form.

### V8 annotations

Recommended:

```text
3–8 annotations
```

The annotations should answer:

> What is this part and why does it matter?

### V8 Key Insight

The document recommends **one primary Key Insight**.

It explicitly differentiates that from SummaryBlock:

```text
VisualBlock V8
→ What is the most important thing to understand from this visual?

SummaryBlock
→ What are the important things to remember from the topic?
```

This is a strong cross-family boundary.

---

# 10. VisualBlock component architecture

## Evidence: VERIFIED as reference architecture

Across the versions, the document repeatedly decomposes VisualBlock into reusable rendering primitives.

The most important pattern is:

```text
VisualBlock
    ↓
Version-specific semantic renderer
    ↓
Reusable visual primitives
```

For example, V8 describes:

```text
V8 Renderer
 ├── Header
 ├── VisualEngine
 │    ├── ArchitectureRenderer
 │    ├── FlowRenderer
 │    ├── ConceptMapRenderer
 │    ├── ComparisonRenderer
 │    └── AnnotatedDiagramRenderer
 │
 ├── AnnotationEngine
 ├── ExplanationSection
 ├── KeyInsight
 └── Caption
```

VisualBlock

### Project LLM significance

This is exactly the kind of information that belongs in the **Reference Component/Pattern Layer**.

It should not automatically become:

```text
production React component structure
```

until correlated with the repository.

So the correct interpretation is:

```text
VisualBlock.md
       ↓
Reference Design Space
       ↓
Reusable Pattern Candidates
       ↓
Production Correlation
       ↓
Verified Production Pattern
```

---

# 11. Data/content architecture

## Evidence: VERIFIED as reference proposal

The file repeatedly uses a structured model:

```json
{
  "type": "visual",
  "version": "V#",
  "content": {}
}
```

Within `content`, the exact structure changes according to semantic version.

Examples include:

```text
visual.type
visual.nodes
visual.connections
visual.items
visual.dimensions
visual.annotations
visual.mode
caption
explanation
keyInsight
```

### Important architectural observation

The document consistently favors **JSON-driven rendering**.

That is valuable for the eventual Project LLM because it suggests:

```text
content schema
        ↓
canonical TutorialBlock
        ↓
renderer
```

rather than storing the finished page markup as the authoritative representation.

However:

> **The exact production schema is NOT established by VisualBlock.md.**

That must come from repository inspection.

Therefore:

**Reference JSON model = VERIFIED**

**Current `content-blocks.ts` compatibility = NOT VERIFIED from this file**

---

# 12. Accessibility

## Evidence: VERIFIED as reference intent

Accessibility is repeatedly treated as required.

The document uses concepts including:

- semantic HTML
- `<figure>`
- `<figcaption>`
- heading hierarchy
- `aria-label`
- accessible visual descriptions
- sequential textual representations
- responsive layouts.

For complex diagrams, the file does not treat:

```html
aria-label="diagram"
```

as sufficient.

Instead, the accessible representation should communicate meaningful information about the visual.

For example, a comparison should communicate what each concept represents and how they differ.

### Project LLM classification

```text
Accessibility intent in reference corpus
→ VERIFIED

Production accessibility implementation
→ NOT VERIFIED
```

That distinction must remain.

---

# 13. Responsive behavior

## Evidence: VERIFIED as reference intent

The corpus explicitly designs for:

```text
Desktop
A4 Portrait
Mobile
```

and repeatedly preserves the same underlying JSON/content model while changing presentation.

For example, V6 uses:

### Desktop

```text
Concept A    VS    Concept B
```

### Mobile

```text
Concept A

VS

Concept B
```

The document's principle is that responsive presentation should preserve learning meaning rather than simply shrinking the desktop visual. VisualBlock

### Project LLM interpretation

This suggests an eventual validation rule:

```text
same semantic content
        ≠
same pixel layout
```

Responsive transformation belongs to the renderer/presentation layer.

---

# 14. SUIA visual design contract

## Evidence: VERIFIED as reference requirement

The document consistently specifies:

- Primary: `#F54A8D`
- Secondary: `#0B1B3D`
- light theme
- no gradients
- no dark theme
- A4 portrait.

The visual strategy repeatedly favors:

```text
mostly white/light neutral + navy
+
pink as controlled emphasis
```

rather than turning the entire visual pink.

This is consistent with the design constraints already established for the project, but here it is specifically documented inside the VisualBlock reference corpus.

---

# 15. Interaction and animation

## Evidence: VERIFIED

A major characteristic of this family is:

```text
Interaction: ❌
Animation:   ❌
```

This is repeatedly carried through the versions, including V6–V8. 

That is architecturally useful.

It means VisualBlock is primarily a **static instructional visual representation**, not an interactive visualization engine.

This also prevents the Project LLM from accidentally interpreting:

```text
VisualBlock
```

as:

```text
interactive diagram platform
```

---

# 16. Cross-domain applicability

## Evidence: VERIFIED

The file demonstrates VisualBlock concepts across many technical domains, including:

- Python
- OOP
- NumPy
- Pandas
- Data Science
- Data Engineering
- Full-stack development
- APIs
- databases
- networking
- cloud computing
- AI/ML
- cybersecurity
- ethical hacking
- quantum computing.

The same semantic structures are intentionally reused across domains.

### Project LLM interpretation

This supports a **generic VisualBlock schema** rather than domain-specific block implementations.

For example:

```text
V6 comparison
```

should not become:

```text
PythonComparisonBlock
```

It should remain a generic comparison representation whose content happens to compare Python concepts.

---

# 17. Composition capability

## Evidence: VERIFIED as reference design intent

The corpus supports composable visual capabilities, especially in V8.

For example:

```text
V8
 ├── architecture
 ├── flow
 ├── concept-map
 ├── comparison
 └── annotated-diagram
```

The document explicitly describes V8 as composable. 

This is highly relevant to our **Reference Corpus / Derived Version** architecture.

A Project LLM could eventually reason:

```text
Human requirement
       ↓
V5 relationship pattern
+
V7 annotation pattern
+
V3 explanation pattern
       ↓
Derived Visual composition
       ↓
new derived version ID
```

But this is a **PROPOSED future Project LLM capability**, not something VisualBlock.md proves exists in the repository.

---

# 18. Universal Tutorial Page relationship

## Evidence classification: NOT VERIFIED from this file

VisualBlock.md describes:

```text
block content
→ visual renderer
→ responsive/A4 presentation
```

It does **not** establish the current repository's exact:

```text
TutorialPageShell
TutorialBlockRenderer
TutorialDocument
navigationNodeId
sectionId
subtopicId
runtimeContext
```

relationships.

Therefore:

| Relationship | Status |
|---|---|
| VisualBlock belongs conceptually in Tutorial Page | **INFERRED / architecturally obvious** |
| Exact current TutorialDocument integration | **NOT VERIFIED** |
| Exact renderer registration | **NOT VERIFIED from this file** |
| Current runtimeContext propagation | **NOT VERIFIED from this file** |
| Current page composition | **NOT VERIFIED from this file** |

Repository evidence must decide these later.

---

# 19. UBRC relationship

This is an especially important boundary.

## Reference corpus

The Markdown examples use older prototype-style attributes such as:

```html
data-block="visual"
data-version="V1"
```

These are **reference prototype markup**, not the current frozen UBRC identity contract.

Current UBRC requires:

```html
data-block-id
data-block-type
data-block-version
```

Therefore:

### Classification

| Item | Status |
|---|---|
| VisualBlock is intended to be a tutorial block | **VERIFIED** |
| VisualBlock has version identity | **VERIFIED** |
| Reference markup expresses block/version identity | **VERIFIED** |
| Reference markup is current UBRC contract | **NOT VERIFIED / NO** |
| Current VisualBlock production UBRC participation | **NOT VERIFIED from this file** |

This is the same prototype-vs-runtime distinction we have maintained for I1, O1, D1 and C1.

---

# 20. ILS relationship

## Status: NOT VERIFIED

VisualBlock.md does **not** establish that VisualBlock owns:

- ILS telemetry
- visit tracking
- active time
- completion
- heartbeat
- telemetry APIs
- learning-state persistence.

That is correct under the frozen runtime architecture.

The future interpretation should therefore be:

```text
VisualBlock
      ↓
passive runtime identity
      ↓
UBRC
      ↓
Universal ILS Runtime
```

not:

```text
VisualBlock
      ↓
custom ILS implementation
```

So:

**Direct ILS ownership: NOT VERIFIED / should not be inferred.**

---

# 21. LSNB relationship

## Status: NOT VERIFIED

The Markdown corpus discusses learning structure and visual teaching progression, but it does not establish:

```text
VisualBlock
→ LSNB
```

as a direct publishing or state-management responsibility.

Therefore no claim should currently be made that:

```text
V1/V2/.../V8
```

creates or modifies LSNB records.

This remains repository/runtime evidence work.

---

# 22. RSSB relationship

## Status: NOT VERIFIED

Likewise, the file does not establish direct RSSB persistence or synchronization.

The VisualBlock reference architecture should therefore remain independent from:

```text
RSSB API
RSSB repository
cross-device synchronization
learning-state persistence
```

until the actual platform runtime proves otherwise.

---

# 23. Tutorial Composer relationship

## Status: NOT VERIFIED from VisualBlock.md

The document gives strong evidence for a JSON-driven content model:

```text
Visual content
    ↓
version
    ↓
structured visual data
    ↓
renderer
```

But it does not prove the exact current Composer implementation.

Therefore:

```text
Composer-compatible conceptual model
→ INFERRED / PROPOSED

Current Composer schema registration
→ NOT VERIFIED
```

This distinction is important because we do **not** want to retrofit the Markdown architecture directly into the repository before the production correlation phase.

---

# 24. Production correlation

This is where the current corpus work becomes particularly valuable.

The file gives us a strong **reference inventory**:

```text
VisualBlock
 ├── V1
 ├── V2
 ├── V3
 ├── V4
 ├── V5
 ├── V6
 ├── V7
 └── V8
```

But it does **not** prove that the repository has:

```text
V1 implementation
V2 implementation
...
V8 implementation
```

Therefore:

> **All eight Visual versions should currently be classified as reference versions, not production versions.**

That is the correct evidence discipline.

---

# 25. Important corpus correction

This file creates a meaningful correction to the historical version register.

The earlier corpus register contained assumptions around VisualBlock counts that were not based on this converted Markdown.

This file provides direct evidence of:

```text
V1–V8
```

and the document explicitly says V8 is the final VisualBlock version.

Therefore the current corpus reconciliation should record:

| Family | Converted Markdown evidence |
|---|---:|
| VisualBlock | **8 reference versions** |
| V1 | Verified |
| V2 | Verified |
| V3 | Verified |
| V4 | Verified |
| V5 | Verified |
| V6 | Verified |
| V7 | Verified |
| V8 | Verified |
| V9 | **Not evidenced in this file** |
| V10 | **Not evidenced in this file** |

This is exactly why we are reviewing the converted Markdown files before updating the authoritative register.

---

# 26. Reference architecture layers

For Project LLM purposes, I would extract VisualBlock into the four-layer model we established:

```text
LAYER 1
Educational Family
        ↓
VisualBlock


LAYER 2
Reference Versions
        ↓
V1–V8


LAYER 3
Reusable Design Patterns
        ↓
Figure
SVG
Flow
Concept Map
Comparison
Annotations
Callouts
Labels
Caption
Explanation
Key Insight
Responsive visual layout


LAYER 4
Production Runtime
        ↓
Actual repository implementation
```

The Markdown gives us strong evidence for Layers 1–3.

It does **not** establish Layer 4.

That distinction should be preserved.

---

# 27. Project LLM machine-understandable semantic model

This file gives us enough evidence to formulate a future conceptual classifier.

### V1

```text
visuality = primary
labels = minimal
explanation = minimal
sequence = no
relationships = minimal
comparison = no
annotations = no
```

### V2

```text
visuality = primary
labels = core
```

### V3

```text
visuality = primary
labels = core
explanation = core
```

### V4

```text
visuality = flow
sequence = core
```

### V5

```text
visuality = concept-map
relationships = core
sequence = not primary
```

### V6

```text
visuality = comparison
concepts = 2–3
dimensions = core
```

### V7

```text
visuality = annotated-diagram
targeted_annotations = core
```

### V8

```text
visuality = composite
visual_modes = multiple
annotations = supported
explanation = supported
key_insight = core
```

This is potentially valuable input to the future **Creation Brief Generator** and **Prototype Analyzer**.

But it remains a **PROPOSED machine interpretation**, not a production classifier today.

---

# 28. What the Project LLM should NOT do with this file

The Project LLM should **not** interpret:

```text
VisualBlock.md
```

as permission to immediately:

- create `VisualBlock.tsx`
- create V1–V8 production schemas
- modify `TutorialBlockRenderer.tsx`
- add eight renderer cases
- modify UBRC
- modify ILS
- modify LSNB
- modify RSSB
- create database tables
- create telemetry APIs
- change Tutorial Composer
- alter existing production blocks.

The Markdown is currently **reference design evidence**.

The correct next operation is:

```text
Reference analysis
        ↓
Production correlation
        ↓
Architecture decision
        ↓
Creation Brief
        ↓
Human approval
        ↓
Implementation
```

---

# 29. Evidence matrix — VisualBlock

| Area | Evidence state | Reason |
|---|---|---|
| VisualBlock family exists | **VERIFIED** | Explicit family documentation |
| V1 | **VERIFIED** | Full reference specification |
| V2 | **VERIFIED** | Full reference specification |
| V3 | **VERIFIED** | Full reference specification |
| V4 | **VERIFIED** | Full reference specification |
| V5 | **VERIFIED** | Full reference specification |
| V6 | **VERIFIED** | Full reference specification |
| V7 | **VERIFIED** | Full reference specification |
| V8 | **VERIFIED** | Full/final specification |
| V9 | **NOT VERIFIED** | Not present in final family progression |
| V10 | **NOT VERIFIED** | Not present in final family progression |
| Semantic version differentiation | **VERIFIED** | Explicit progression |
| JSON-driven concept | **VERIFIED** | Repeated JSON models |
| Accessibility intent | **VERIFIED** | Required throughout |
| Responsive intent | **VERIFIED** | Desktop/mobile/A4 specifications |
| SUIA colors | **VERIFIED** | Explicitly specified |
| Light/no-gradient/no-dark | **VERIFIED** | Explicitly specified |
| Interaction | **VERIFIED as excluded** | Explicitly ❌ |
| Animation | **VERIFIED as excluded** | Explicitly ❌ |
| Composition | **VERIFIED as reference capability** | Particularly V8 |
| Current production schema | **NOT VERIFIED** | Requires repository |
| Current Composer registration | **NOT VERIFIED** | Requires repository |
| Current renderer registration | **NOT VERIFIED** | Requires repository |
| Current UBRC participation | **NOT VERIFIED** | Markdown is not runtime evidence |
| Current ILS participation | **NOT VERIFIED** | No runtime evidence |
| Current LSNB participation | **NOT VERIFIED** | No runtime evidence |
| Current RSSB participation | **NOT VERIFIED** | No runtime evidence |
| Current production implementation of V1–V8 | **NOT VERIFIED** | Requires correlation |
| Production certification | **NOT VERIFIED** | Requires full validation/E2E |

---

# 30. Final Project LLM assessment

### **VisualBlock = VERIFIED reference family**

The converted Markdown provides strong evidence for **eight semantic reference versions: V1–V8**.

The most important architectural discovery is not merely the count. It is the **semantic progression**:

```text
V1  SHOW
 ↓
V2  IDENTIFY
 ↓
V3  EXPLAIN
 ↓
V4  PROGRESS
 ↓
V5  CONNECT
 ↓
V6  COMPARE
 ↓
V7  ANNOTATE
 ↓
V8  INTEGRATE
```

That progression should become part of the eventual Project LLM's **reference design space**.

At the same time:

```text
REFERENCE VERSION
        ≠
PRODUCTION VERSION
        ≠
RUNTIME AUTHORITY
```

So I would currently record:

> **VisualBlock reference corpus: VERIFIED, V1–V8.**  
> **Production correlation: NOT YET VERIFIED.**  
> **UBRC/ILS/LSNB/RSSB runtime participation: NOT VERIFIED from this file.**  
> **V9/V10: not evidenced by this converted Markdown and therefore not to be inferred.**



### Most important consequence for our corpus reconciliation

The old **126/135** register should remain treated as a **historical/stale baseline**, not as the final semantic corpus count. VisualBlock alone demonstrates why: the converted Markdown contains evidence that differs from the earlier assumptions.

We should continue exactly as planned, **one Markdown family at a time**, and only after all 18 have been reviewed should we rebuild the authoritative family/version register.

---

## Next file

**FILE 06 — `ComparisonBlock.md`**

This is especially important because VisualBlock V6 itself contains a comparison pattern. When we review `ComparisonBlock.md`, we need to determine precisely where:

```text
VisualBlock V6
        vs.
ComparisonBlock CP1–CP8
```

have different **educational ownership**, rather than accidentally treating similar UI patterns as the same block family.

That comparison will be a particularly useful test of the **Educational Family ≠ Prototype Pattern ≠ Production Primitive** architecture.