# FILE 06 — `ComparisonBlock.md`
## Detailed Project LLM Review

I have now reviewed the converted **`ComparisonBlock.md`** corpus as the next file in the agreed sequence.

This file is substantial: **321,643 bytes / 12,782 lines**. The important finding is unambiguous:

> **ComparisonBlock contains CP1–CP8, and CP8 is explicitly documented as the final version.**

That directly corrects the earlier V2.1 assumption that **CP8 might be merely planned/not authored**. The converted Markdown is stronger evidence and shows CP8 as a fully specified version. 

---

# 1. ComparisonBlock family identity

## Evidence: VERIFIED

The file defines ComparisonBlock as a family for helping learners compare related concepts, technologies, approaches, architectures, tools, or alternatives.

The family is not simply a collection of comparison UI layouts.

Its instructional progression is explicitly:

```text
CP1
SEE
 ↓
CP2
COMPARE
 ↓
CP3
UNDERSTAND
 ↓
CP4
DECIDE
 ↓
CP5
EVALUATE
 ↓
CP6
FOLLOW LOGIC
 ↓
CP7
SELECT
 ↓
CP8
SYNTHESIZE
```

The file also expresses the progression in learner-oriented terms as:

> See → Compare → Understand → Decide → Evaluate → Reason → Select → Remember. 

This is strong evidence that the versions are differentiated by **learning purpose**, not merely visual styling.

---

# 2. Complete ComparisonBlock version inventory

## Evidence: VERIFIED

The file's final architecture explicitly lists all eight versions:

| Version | Name | Primary purpose |
|---|---|---|
| **CP1** | Side-by-Side Comparison | See A vs B |
| **CP2** | Feature Comparison Table | Compare features |
| **CP3** | Similarities vs Differences | Understand relationship |
| **CP4** | When to Use A vs B | Make a simple decision |
| **CP5** | Advantages vs Limitations | Understand trade-offs |
| **CP6** | Decision Tree | Follow conditional logic |
| **CP7** | Selection Matrix | Evaluate multiple options |
| **CP8** | Complete Comparison Guide | Understand the complete picture |

The document explicitly states:

> **ComparisonBlock is now fully specified: CP1–CP8.** 

### Corpus reconciliation consequence

For our current authoritative Markdown-based corpus investigation:

```text
ComparisonBlock = 8 reference versions
```

Therefore:

```text
CP8 ≠ planned
CP8 = VERIFIED reference version
```

This is an important correction to the earlier register.

---

# 3. CP1 — Side-by-Side Comparison

## Evidence: VERIFIED

CP1 is the foundational comparison version.

Its structure is:

```text
Concept A
   ↕
parallel attributes
   ↕
Concept B
   ↓
Key distinction
```

The file emphasizes **parallel structure**.

For example:

```text
| Attribute    | List      | Tuple     |
|--------------|-----------|-----------|
| Mutability   | Mutable   | Immutable |
| Syntax       | []        | ()        |
| Modification | Supported | No        |
```

The important principle is:

> Both concepts should be presented using the same comparison dimensions.

The document explicitly identifies **symmetry** as fundamental to CP1. ComparisonBlock

### Learning question

> How are A and B different when I look at them side by side?

### Best use

Concepts that learners commonly confuse:

- List vs Tuple
- Authentication vs Authorization
- Stack vs Queue
- NumPy vs Pandas
- SQL vs NoSQL
- Class vs Object
- Compile-time vs Runtime.

---

# 4. CP1 is NOT merely a two-column component

This distinction matters for Project LLM.

The semantic contract is:

```text
Two related concepts
+
same comparison dimensions
+
parallel presentation
+
key distinction
```

Therefore this:

```text
A
paragraph...

B
paragraph...
```

does not automatically constitute CP1.

The comparison relationship itself must be represented.

### Project LLM classification

```text
CP1
Educational meaning = comparison through parallel dimensions
UI primitive       = side-by-side columns/cards
```

Therefore:

> **Educational family ≠ UI primitive.**

This will be important when the Project LLM sees a generic two-column React component in the repository.

---

# 5. CP2 — Feature Comparison Table

## Evidence: VERIFIED

CP2 increases information density.

Its core structure is:

```text
Comparison attribute
      ↓
Concept A
      ↓
Concept B
```

The file describes CP2 as a systematic feature-by-feature comparison. ComparisonBlock

### Learning question

> How do A and B compare across several important features?

### Important distinction from CP1

```text
CP1
→ see the difference

CP2
→ systematically compare multiple dimensions
```

So the underlying presentation primitive may still be a table, but its semantic role is different.

### Project LLM

A generic `<table>` in the repository does **not** prove CP2 exists.

The Project LLM needs to establish:

```text
table
+
comparison semantics
+
version/schema
+
renderer mapping
```

before classifying something as production CP2.

---

# 6. CP3 — Similarities vs Differences

## Evidence: VERIFIED

CP3 moves beyond simple difference detection.

Its purpose is:

```text
What do A and B share?
What differs?
How should the relationship be understood?
```

The family progression explicitly assigns CP3:

```text
COMPARE
   ↓
UNDERSTAND
```

ComparisonBlock

### Educational distinction

CP1:

```text
A ≠ B
```

CP3:

```text
A shares X with B
A differs from B in Y
therefore relationship = Z
```

That is a meaningful semantic progression.

---

# 7. CP4 — When to Use A vs B

## Evidence: VERIFIED

CP4 shifts from descriptive comparison toward contextual choice.

Its learning purpose is:

> **Make a simple decision.**

The learner moves from:

```text
"What is different?"
```

to:

```text
"When should I use A rather than B?"
```

This is the first major decision-oriented version.

### Important Project LLM distinction

CP4 is not:

```text
"Which technology is universally better?"
```

It is:

```text
"Given these conditions, when is A appropriate and when is B appropriate?"
```

That makes it contextual rather than absolute.

---

# 8. CP5 — Advantages vs Limitations

## Evidence: VERIFIED

CP5 introduces explicit trade-off reasoning.

The progression becomes:

```text
CP4
DECIDE
 ↓
CP5
EVALUATE TRADE-OFFS
```

The file's version progression explicitly places CP5 after contextual usage and before formal decision logic. ComparisonBlock

### Core model

```text
Option A
 ├── Advantages
 └── Limitations

Option B
 ├── Advantages
 └── Limitations
```

This is important because it prevents a comparison from becoming a simplistic:

```text
A = good
B = bad
```

presentation.

---

# 9. CP6 — Decision Tree

## Evidence: VERIFIED

CP6 is one of the most architecturally interesting versions.

The file explicitly states that CP6:

> converts comparison knowledge into a visual sequence of decisions.

Its structure is:

```text
Start
  ↓
Question
  ↓
Branch
  ↓
Question
  ↓
Result
```



### Very important distinction

The file explicitly warns:

> CP6 should not merely be a decorative flowchart.

It is a **teaching block for conditional reasoning**. ComparisonBlock

This is extremely useful for the Project LLM.

A visual flowchart in the repository should **not automatically be classified as CP6**.

The Project LLM must ask:

```text
Does the visual encode conditional decision logic?
```

If yes:

```text
possible CP6
```

If it merely represents process sequence:

```text
likely VisualBlock V4
```

That is exactly the family-boundary reasoning we need.

---

# 10. CP6 decision-tree content rules

The file provides several useful reference constraints:

| Dimension | Reference guidance |
|---|---:|
| Initial branches | 2 |
| Maximum branches/decision | 2–3 |
| Decision levels | 2–4 |
| Final outcomes | 2–6 |
| Total nodes | ~10–15 ideal |

It also emphasizes that decision questions should describe **requirements**, not the answer itself.

Good:

```text
Does the application require labeled tabular data?
```

Poor:

```text
Should I use Pandas?
```

This is useful future validation logic for the Project LLM.

---

# 11. CP7 — Selection Matrix

## Evidence: VERIFIED

CP7 extends the decision-support model to multiple alternatives.

Its mental model is:

```text
Problem
  ↓
Requirements
  ↓
Criteria
  ↓
Matrix
  ↓
A / B / C / ...
  ↓
Evaluate
  ↓
Selection insight
```

The document makes an important point:

> CP7 is **not merely a bigger comparison table**.

It is a **decision-support teaching structure**. ComparisonBlock

### Very important semantic distinction

```text
CP2
feature comparison

CP7
criteria-based selection among multiple alternatives
```

Therefore the existence of a table/matrix UI primitive does not determine the educational family.

---

# 12. CP7 and unsupported "best technology" claims

This is one of the stronger conceptual rules in the file.

The CP7 definition emphasizes **transparent, context-dependent selection** rather than an unsupported universal "best" claim. ComparisonBlock

The intended reasoning is:

```text
Requirements
+
explicit criteria
+
candidate options
=
contextual selection
```

not:

```text
Technology X is always best.
```

For Project LLM, this should become a content-quality validation concern.

---

# 13. CP8 — Complete Comparison Guide

## Evidence: VERIFIED

This is the most important correction to the old register.

The file explicitly introduces:

> **CP8 — Complete Comparison Guide**

and says:

> We have now reached the final version of ComparisonBlock.

ComparisonBlock

Its structure is:

```text
Context
 ↓
Similarities
 ↓
Features
 ↓
Usage
 ↓
Advantages
 ↓
Limitations
 ↓
Selection
 ↓
Final Takeaway
```

### Learning question

> What is the complete picture, and which option fits which situation?

### CP8 is synthesis

The document explains that CP8 can combine relevant capabilities from:

```text
CP3 → similarities
CP2 → feature comparison
CP4 → when to use
CP5 → advantages / limitations
CP6 → decision logic
CP7 → selection criteria
```

But it explicitly says CP8 should **not mechanically include every section every time**.

The content determines which sections are needed. ComparisonBlock

This is an important composition principle.

---

# 14. CP8 is not "CP1–CP7 dumped onto one page"

This is a critical Project LLM rule.

The document explicitly differentiates:

```text
CP8
=
semantic synthesis
```

from:

```text
CP8
=
all previous components forcibly rendered
```

Therefore the future Project LLM should be able to produce:

```text
CP8
 ├── similarities
 ├── features
 ├── usage
 ├── trade-offs
 └── selection
```

without requiring every possible section.

This is **content-driven composition**.

---

# 15. ComparisonBlock cognitive architecture

The complete progression is:

```text
CP1
SEE
 ↓
CP2
COMPARE
 ↓
CP3
UNDERSTAND
 ↓
CP4
DECIDE
 ↓
CP5
EVALUATE
 ↓
CP6
FOLLOW LOGIC
 ↓
CP7
SELECT
 ↓
CP8
SYNTHESIZE
```



This is arguably the most important information in the entire file from the **Project LLM perspective**.

Why?

Because it gives the AI a semantic axis for version selection.

---

# 16. Project LLM version-selection model

A future Project LLM could reason approximately like this:

```text
Human requirement
        ↓
What does learner need?
        │
        ├── Simply see A vs B?
        │       → CP1
        │
        ├── Compare multiple features?
        │       → CP2
        │
        ├── Understand similarities/differences?
        │       → CP3
        │
        ├── Know when to use A or B?
        │       → CP4
        │
        ├── Evaluate trade-offs?
        │       → CP5
        │
        ├── Follow conditional reasoning?
        │       → CP6
        │
        ├── Select among multiple options?
        │       → CP7
        │
        └── Need comprehensive synthesis?
                → CP8
```

This is **PROPOSED Project LLM behavior derived from the reference corpus**, not current implementation.

---

# 17. Critical comparison: VisualBlock V6 vs ComparisonBlock

This is exactly the cross-family issue you asked us to examine.

## VisualBlock V6

VisualBlock V6 is:

> **Visual + Comparison**

Its purpose is to visually communicate similarities/differences through a visual representation.

Conceptually:

```text
VisualBlock V6
       ↓
VISUALIZE comparison
```

The VisualBlock corpus explicitly describes V6 as a visual comparison with concepts, dimensions, shared characteristics and key differences.

## ComparisonBlock CP1–CP8

ComparisonBlock has a much broader instructional progression:

```text
CP1 → side-by-side
CP2 → feature comparison
CP3 → similarities/differences
CP4 → when to use
CP5 → trade-offs
CP6 → decision logic
CP7 → selection
CP8 → synthesis
```

Therefore:

```text
VisualBlock V6
=
a visual representation pattern

ComparisonBlock
=
a dedicated comparison-learning family
```

This is an extremely important architectural distinction.

---

# 18. Example: Authentication vs Authorization

The same topic can legitimately produce different blocks.

### VisualBlock V6

```text
Authentication
      VS
Authorization
```

with a visual representation of:

```text
Who are you?
       vs
What can you do?
```

Purpose:

> visually expose the difference.

### ComparisonBlock CP1

Could use:

```text
| Attribute | Authentication | Authorization |
| Purpose   | ...            | ...           |
| Question  | ...            | ...           |
```

Purpose:

> systematically compare A and B.

### ComparisonBlock CP4

Could answer:

```text
When are you concerned with identity?
When are you concerned with permissions?
```

Purpose:

> contextual usage decision.

### ComparisonBlock CP6

Could teach:

```text
Is identity established?
       ↓
NO → Authentication
YES → Need permission check?
       ↓
YES → Authorization
```

Purpose:

> conditional reasoning.

### ComparisonBlock CP8

Could combine:

```text
definition/context
+
similarities
+
differences
+
usage
+
trade-offs
+
selection logic
+
takeaway
```

Purpose:

> complete comparison guide.

This is exactly why **UI similarity cannot be used as family classification**.

---

# 19. Reusable pattern vs educational family

This file reinforces the four-layer model:

```text
Layer 1
Educational Family
       ↓
ComparisonBlock

Layer 2
Reference Versions
       ↓
CP1–CP8

Layer 3
Reusable Patterns
       ↓
Two-column
Table
Matrix
Decision tree
Trade-off panel
Criteria grid
Selection model

Layer 4
Production Runtime
       ↓
Actual React/TS implementation
```

A generic table component may participate in:

```text
CP2
CP7
CP8
```

but that does not mean:

```text
table = ComparisonBlock
```

Likewise:

```text
decision tree UI
```

does not automatically mean CP6 unless the educational semantics match.

---

# 20. Data/content model

## Evidence: VERIFIED as reference design

The document consistently uses structured JSON-driven content.

The conceptual pattern is:

```text
type
version
content
```

and version-specific structures.

### CP6 example

The file models a decision tree with structures such as:

```text
tree
 ├── type
 ├── label
 ├── next
 │    ├── type
 │    ├── question
 │    └── branches
 │         ├── condition
 │         ├── result
 │         └── next
```

The file explicitly provides generic JSON examples for decision trees. ComparisonBlock

### Project LLM interpretation

This is strong evidence for:

```text
semantic content
        ↓
structured JSON
        ↓
generic renderer
```

But:

> **It does not prove the current repository uses this exact schema.**

So:

**Reference data model = VERIFIED**

**Production schema compatibility = NOT VERIFIED**

---

# 21. Accessibility

## Evidence: VERIFIED as reference intent

The file treats accessibility as required.

The CP6 section is particularly useful because it recognizes that a decision tree should not rely solely on SVG/CSS positioning for accessibility.

The reference semantic approach includes:

```text
<section>
<header>
<h2>
<p>
<ol>
<li>
<article>
<h3>
<aside>
```

and meaningful textual decision information.

### Project LLM rule

A generated comparison cannot pass simply because:

```text
aria-label="comparison"
```

exists.

The accessible representation needs to convey the meaningful comparison/decision content.

---

# 22. Responsive / A4 architecture

## Evidence: VERIFIED as reference intent

ComparisonBlock consistently targets:

```text
Light theme
No gradient
No dark theme
A4 portrait
Responsive
```

CP1, for example, gives equal visual weight to both sides and explicitly designs for A4 portrait.

CP6 gives particular attention to vertical tree layout because wide decision trees are unsuitable for portrait pages.

### Project LLM interpretation

This reinforces:

```text
same semantic model
+
different presentation constraints
```

rather than separate content models for desktop/mobile/A4.

---

# 23. SUIA design contract

## Evidence: VERIFIED

The file consistently uses:

- `#F54A8D` — primary pink
- `#0B1B3D` — secondary navy
- light background
- no gradients
- no dark theme
- controlled pink emphasis.

CP1 is especially explicit about visual neutrality:

> both concepts should have equivalent styling.

That prevents color from accidentally communicating:

```text
A = good
B = bad
```

when the actual lesson is merely comparison.

This is a good semantic UI principle.

---

# 24. Interaction model

The reference ComparisonBlock family is predominantly **static instructional content**.

The versions focus on:

- visual comparison
- structured information
- decision reasoning
- matrices
- decision trees
- synthesis.

There is no evidence here that ComparisonBlock itself owns:

- learner input state
- runtime telemetry
- ILS
- completion
- backend persistence.

Therefore those remain outside the family unless platform contracts establish otherwise.

---

# 25. UBRC relationship

## Status: NOT VERIFIED from this file

Like the other converted Markdown files, the reference HTML uses prototype-style attributes such as:

```html
data-block="comparison"
data-version="CP1"
```

That is **not** the current frozen UBRC authority.

The current runtime contract requires:

```text
data-block-id
data-block-type
data-block-version
```

Therefore:

| UBRC question | Status |
|---|---|
| ComparisonBlock is conceptually a tutorial block | **VERIFIED** |
| CP1–CP8 have reference version identity | **VERIFIED** |
| Reference markup contains block/version identity | **VERIFIED** |
| Reference markup is current UBRC contract | **NO / NOT VERIFIED** |
| Current production UBRC participation | **NOT VERIFIED** |

---

# 26. ILS

## Status: NOT VERIFIED

ComparisonBlock.md does not establish ownership of:

- active time
- block visits
- telemetry
- completion
- heartbeat
- ILS API calls.

Therefore the future runtime interpretation remains:

```text
ComparisonBlock
      ↓
UBRC passive identity
      ↓
Universal ILS Runtime
```

rather than:

```text
ComparisonBlock
      ↓
custom ILS implementation
```

No direct ILS implementation should be inferred from this corpus.

---

# 27. LSNB

## Status: NOT VERIFIED

The file discusses:

```text
learning purpose
decision reasoning
selection
takeaways
```

but it does not establish a direct relationship to:

```text
LSNB navigation state
LSNB records
navigationNodeId
completion state
```

Therefore:

> **ComparisonBlock LSNB participation = NOT VERIFIED.**

---

# 28. RSSB

## Status: NOT VERIFIED

Likewise there is no evidence here for direct:

- RSSB writes
- synchronization
- persistence
- cross-device state.

Therefore:

> **ComparisonBlock RSSB participation = NOT VERIFIED.**

---

# 29. Tutorial Composer

## Status: NOT VERIFIED from this file

The reference document strongly supports a structured content model and generic renderers.

But it does not establish the current production Composer implementation.

So:

```text
ComparisonBlock content model
→ VERIFIED reference design

Current Composer registration
→ NOT VERIFIED

Current Composer schema
→ NOT VERIFIED

Current renderer registration
→ NOT VERIFIED
```

Those must come from repository evidence.

---

# 30. Production correlation

This file establishes:

```text
Reference:
CP1
CP2
CP3
CP4
CP5
CP6
CP7
CP8
```

It does **not** establish that the production repository implements all eight.

Therefore:

| Version | Reference | Production |
|---|---|---|
| CP1 | **VERIFIED** | NOT VERIFIED |
| CP2 | **VERIFIED** | NOT VERIFIED |
| CP3 | **VERIFIED** | NOT VERIFIED |
| CP4 | **VERIFIED** | NOT VERIFIED |
| CP5 | **VERIFIED** | NOT VERIFIED |
| CP6 | **VERIFIED** | NOT VERIFIED |
| CP7 | **VERIFIED** | NOT VERIFIED |
| CP8 | **VERIFIED** | NOT VERIFIED |

This is the correct evidence state **at this stage of corpus review**.

---

# 31. Composition

CP8 gives us particularly strong evidence for composition.

It can draw relevant capabilities from:

```text
CP2
Feature comparison

CP3
Similarities/differences

CP4
Usage

CP5
Trade-offs

CP6
Decision logic

CP7
Selection
```

But the reference explicitly says the content determines which sections are necessary. ComparisonBlock

This supports our broader architecture:

```text
Reference Versions
        ↓
Reusable Patterns
        ↓
Derived Composition
        ↓
New Version Identity
```

The Project LLM must **not** take a CP8 composition and falsely label it as CP2/CP5/CP7.

---

# 32. Potential Project LLM composition example

Suppose a human asks:

> Compare REST, GraphQL and gRPC for a backend architecture decision.

The Project LLM could theoretically derive:

```text
CP8-derived composition

Context
+
feature comparison
+
usage conditions
+
trade-offs
+
selection criteria
```

The result should be something like:

```text
CP-CUSTOM-001
```

rather than pretending it is an existing CP8 instance.

This is **PROPOSED future behavior**, but it is strongly supported by the composition principles present in the reference corpus.

---

# 33. Project LLM validation opportunities

ComparisonBlock.md provides unusually good future validation rules.

### CP1

Validate:

```text
same dimensions
parallel concepts
balanced structure
key distinction
```

### CP2

Validate:

```text
multiple consistent features
same comparison dimensions
structured table
```

### CP3

Validate:

```text
similarities
differences
relationship interpretation
```

### CP4

Validate:

```text
usage conditions
context-dependent guidance
```

### CP5

Validate:

```text
advantages
limitations
trade-offs
```

### CP6

Validate:

```text
decision questions
branch conditions
outcomes
conditional logic
```

### CP7

Validate:

```text
multiple alternatives
explicit criteria
consistent evaluation
contextual selection
```

### CP8

Validate:

```text
coherent synthesis
not merely concatenated sections
appropriate comparison dimensions
appropriate selection/usage guidance
final takeaway
```

These could eventually become **machine-verifiable content-quality checks**.

---

# 34. ComparisonBlock vs VisualBlock — definitive boundary

This is the key finding from reviewing both files.

| Question | VisualBlock V6 | ComparisonBlock |
|---|---|---|
| Primary purpose | Visualize comparison | Teach comparison |
| Family | Visual | Comparison |
| Versions | V1–V8 | CP1–CP8 |
| Comparison | Core to V6 | Core to family |
| Visual representation | Core | Optional/varies |
| Feature table | Possible | CP2 |
| Similarities/differences | V6 can show | CP3 explicitly teaches |
| Usage decision | Not core | CP4 |
| Trade-offs | Not core | CP5 |
| Decision tree | Not core | CP6 |
| Selection matrix | Not core | CP7 |
| Comprehensive comparison | Not core | CP8 |
| Runtime ownership | None established | None established |

### Architectural conclusion

> **VisualBlock V6 and ComparisonBlock are not duplicate families.**

They overlap in **presentation patterns**, but their **educational ownership differs**.

That is exactly the distinction the Project LLM needs.

---

# 35. Evidence matrix — ComparisonBlock

| Area | Evidence state |
|---|---|
| ComparisonBlock family | **VERIFIED** |
| CP1 | **VERIFIED** |
| CP2 | **VERIFIED** |
| CP3 | **VERIFIED** |
| CP4 | **VERIFIED** |
| CP5 | **VERIFIED** |
| CP6 | **VERIFIED** |
| CP7 | **VERIFIED** |
| CP8 | **VERIFIED** |
| CP8 final version | **VERIFIED** |
| Semantic progression | **VERIFIED** |
| Composition | **VERIFIED as reference design intent** |
| Structured JSON | **VERIFIED as reference design** |
| Accessibility intent | **VERIFIED** |
| Responsive/A4 intent | **VERIFIED** |
| SUIA design | **VERIFIED** |
| Current production schema | **NOT VERIFIED** |
| Current Composer | **NOT VERIFIED** |
| Current renderer | **NOT VERIFIED** |
| Current UBRC participation | **NOT VERIFIED** |
| Current ILS participation | **NOT VERIFIED** |
| Current LSNB participation | **NOT VERIFIED** |
| Current RSSB participation | **NOT VERIFIED** |
| Production CP1–CP8 | **NOT VERIFIED** |
| Production certification | **NOT VERIFIED** |

---

# 36. Important update to our corpus investigation

We now have two particularly important confirmed families:

```text
VisualBlock
V1–V8
```

and:

```text
ComparisonBlock
CP1–CP8
```

This demonstrates why the converted Markdown corpus must be treated as the primary reference evidence.

The earlier historical register's:

```text
CP8 = unresolved / possibly not authored
```

is now contradicted by stronger converted-Markdown evidence.

Likewise, our VisualBlock investigation established V1–V8 from its final progression.

So I recommend **no modification to the old V2.1 register yet**. We should continue through all 18 files and then rebuild the register from the actual converted corpus rather than patching the old assumptions family by family.

---

# 37. Final Project LLM assessment

### ComparisonBlock = VERIFIED reference family, CP1–CP8

The strongest architectural lesson from this file is:

```text
Comparison UI
        ≠
ComparisonBlock
```

and:

```text
Visual comparison
        ≠
Comparison learning family
```

More precisely:

```text
VisualBlock V6
    ↓
visualizes comparison

ComparisonBlock CP1–CP8
    ↓
teaches comparison progressively
```

The family progresses:

```text
SEE
 ↓
COMPARE
 ↓
UNDERSTAND
 ↓
DECIDE
 ↓
EVALUATE
 ↓
FOLLOW LOGIC
 ↓
SELECT
 ↓
SYNTHESIZE
```



That distinction should become a **core Project LLM family-classification rule** later.

### Current authoritative corpus status

```text
ComparisonBlock
    ├── CP1 VERIFIED
    ├── CP2 VERIFIED
    ├── CP3 VERIFIED
    ├── CP4 VERIFIED
    ├── CP5 VERIFIED
    ├── CP6 VERIFIED
    ├── CP7 VERIFIED
    └── CP8 VERIFIED
```

**Production implementation status remains unverified until repository correlation.**

---

## Next: FILE 07 — `ExecutionBlock.md`

The next file is particularly important because **ExecutionBlock** should allow us to test another major family boundary:

```text
VisualBlock V4
        vs
CodeBlock C5
        vs
ExecutionBlock E1–E8
```

That should tell us whether the corpus treats:

- showing a process visually,
- explaining code execution,
- and teaching execution/runtime behavior

as separate educational families or overlapping presentation patterns.