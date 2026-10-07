Yes. I audited the actual GitHub implementation for **I1, C1 and D1**, and this makes the architecture much clearer.

The key realization is:

> **Project LLM does not need to decide the visual layout of a new block. It needs to make the approved result conform to the existing Tutorial Composer/block-rendering contract so that the Composer can recognize, author, save and render the new version.**

And the existing `I1`, `C1`, `D1` implementations show exactly how that works.

---

# 1. What actually makes I1/C1/D1 part of Tutorial Composer?

It is **not** simply because Project LLM lists them in a registry.

The actual chain in the repo is approximately:

```text
Tutorial content / Composer data
             │
             ▼
     TutorialBlockRenderer
             │
       block.type
             │
      ┌──────┼─────────┐
      ▼      ▼         ▼
 introduction code  definition
      │      │         │
      ▼      ▼         ▼
     I1     C1        D1
 renderer renderer  renderer
      │      │         │
      └──────┼─────────┘
             ▼
        HTML / DOM
```

The actual `TutorialBlockRenderer.tsx` imports all three:

```text
IntroductionBlock
CodeC1Block
DefinitionBlock
```

and routes based on `block.type`. For `code`, it explicitly requires `version === 'C1'`; for `introduction`, it explicitly requires `version === 'I1'`. [Gist](https://gist.github.com/andrew/03d78048b7f47b979c7f232394ca22a9?utm_source=chatgpt.com)

More importantly, the actual source we fetched confirms this directly.

---

# 2. I1: what happened?

The repository has:

```text
packages/ui/src/tutorial/blocks/IntroductionBlock.tsx
```

This is not a generic Introduction renderer.

It is explicitly a **version router**:

```text
IntroductionBlock
       │
       └── block.version
             │
             └── I1
                  ↓
          IntroductionI1View
```

The source says the router expects `I1`, and the actual `IntroductionI1View` contains the canonical layout.

That means I1's layout is actually implemented here:

```text
IntroductionBlock.tsx
       ↓
IntroductionI1View
```

It contains the complete nine-section structure:

```text
1. Hero
2. Learning Goal
3. The Topic
4. Where Does It Fit?
5. The Solution
6. Where Is It Used?
7. What Will You Learn?
8. Why This Matters
9. Key Takeaway
```

And it renders the block with:

```text
data-block-id
data-block-type="introduction"
data-block-version={block.version}
```

So I1 isn't just "registered."

It has:

```text
I1
│
├── data contract
├── content structure
├── version routing
├── actual React renderer
├── DOM identity
└── tests
```

---

# 3. C1 is even clearer

The repository has:

```text
packages/ui/src/tutorial/blocks/CodeC1Block.tsx
```

And `TutorialBlockRenderer.tsx` has a very explicit rule:

```text
block.type === "code"
        │
        ▼
version must equal "C1"
        │
        ▼
CodeC1Block
```

If somebody submits:

```text
C2
```

today, the current renderer does **not** magically render it.

It throws an unsupported-version error.

So the current architecture already proves an important principle:

> **A new version is not automatically available merely because somebody creates a new React component.**

It must be connected to the canonical rendering pipeline.

The repository tests also explicitly test C1 routing and reject unsupported versions.

---

# 4. D1 follows the same model

The repository has:

```text
packages/ui/src/tutorial/blocks/DefinitionBlock.tsx
```

and:

```text
DefinitionBlock
       │
       ▼
block.version
       │
       └── D1
            ↓
       DefinitionD1View
```

Again, D1 is an actual version-specific renderer.

The implementation contains:

```text
data-block-id
data-block-type="definition"
data-block-version="D1"
```

and the source explicitly describes D1 as the canonical locked UI used by:

```text
Composer Preview
SUIA Student Page
RTH Student Page
other learner pages
```

That is extremely important for our architecture.

---

# 5. So what does "part of Tutorial Composer" really mean?

This is where your confusion is coming from.

There are actually **two different problems**:

### Problem A — Design

> "What should I2 look like?"

This is:

```text
User + External AI
```

Project LLM should **not invent this**.

---

### Problem B — Platform integration

> "How does I2 become a legitimate block version that Tutorial Composer can use?"

This is:

```text
Project LLM
```

with repository/backend evidence and controlled integration.

So:

```text
           I2 DESIGN
              │
      User + External AI
              │
              ▼
       Approved prototype
              │
              ▼
       React/TypeScript
              │
              │
              ▼
      PROJECT LLM INTEGRATION
              │
       ┌──────┼──────────┐
       │      │          │
       ▼      ▼          ▼
    Types  Renderer   Registry
       │      │          │
       └──────┼──────────┘
              ▼
       Tutorial Composer
```

That is the distinction you were missing.

---

# 6. Let's say you want to create I2

Suppose the user says:

> "I want a second Introduction layout called I2."

The user and External AI decide:

```text
I2 design:

┌───────────────────────────────┐
│      REAL-WORLD PROBLEM       │
│                               │
│  Why should I care?           │
│                               │
│  Problem → Need → Topic       │
│                               │
│          [Explore]            │
└───────────────────────────────┘
```

Project LLM does **not** say:

> "No, I2 must look like I1."

Instead it says:

> "Fine. Now let's determine whether this design can become a valid Introduction I2 in this repository."

That's its job.

---

# 7. Project LLM compares I2 with I1

The existing I1 becomes the **reference implementation**.

The repository's Project LLM intelligence already explicitly identifies:

```text
I1
C1
D1
```

as the three runtime-verified reference implementations.

The frontend's repository-intelligence fixture even documents:

```text
I1:
IntroductionBlock.tsx
version router
UBRC attributes

C1:
CodeC1Block.tsx
TutorialBlockRenderer
tests

D1:
DefinitionBlock.tsx
version router
DOM identity
```

So when creating I2, Project LLM should say:

```text
Reference:
I1

New target:
I2

Reuse:
family identity
content contract principles
UBRC
theme mechanism
Composer contract
renderer architecture
testing pattern

Do NOT blindly reuse:
I1 visual layout
I1 content structure
I1 exact JSX
```

That's the correct relationship.

---

# 8. Then External AI creates the actual I2 implementation

After the user approves the prototype:

```text
External AI
     │
     ▼
I2 candidate
```

For example:

```text
I2/
├── IntroductionI2View.tsx
├── types
├── test
└── dummy-data.json
```

The candidate may have completely different visual structure from I1.

That's allowed.

The important thing is that it satisfies the **family/version contract**.

---

# 9. Then Project LLM performs the critical integration step

This is the part your question is really about.

Project LLM needs to determine:

### A. Where does I2 live?

For example:

```text
packages/ui/src/tutorial/blocks/
```

### B. How does I2 get routed?

Today the pattern is:

```text
IntroductionBlock
   ↓
switch(block.version)
   ↓
I1
```

For a new version, Project LLM would need to evolve that to something like:

```text
IntroductionBlock
   ↓
switch(block.version)
   ├── I1 → IntroductionI1View
   └── I2 → IntroductionI2View
```

### C. What content schema does I2 expect?

For example:

```json
{
  "version": "I2",
  "content": {
    "page": {
      "problem": "...",
      "need": "...",
      "topic": "...",
      "cta": "..."
    }
  }
}
```

### D. What does Tutorial Composer need to author it?

This is where the **types/schema/registry metadata** have to line up.

---

# 10. This is why the Project LLM compliance brief matters

The brief should tell External AI:

```text
You are creating:

Family:
Introduction

Version:
I2

Reference:
I1

You may change:
✓ visual layout
✓ typography
✓ section arrangement
✓ presentation
✓ dummy content

You must preserve:
✓ Introduction family identity
✓ version identity
✓ TutorialDocument compatibility
✓ TutorialBlockRenderer compatibility
✓ UBRC identity
✓ theme compatibility
✓ Composer compatibility
✓ runtime constraints
```

This is much more precise than:

> "Make an Introduction block."

---

# 11. Then Project LLM audits the candidate

Suppose External AI submits:

```text
IntroductionI2View.tsx
```

Project LLM checks:

```text
Family:
Introduction       ✓

Version:
I2                  ✓

DOM:
data-block-id       ✓
data-block-type     ✓
data-block-version  ✓

Theme:
uses theme context ✓

Runtime:
no ILS calls       ✓
no LSNB             ✓
no RSSB             ✓

Composer:
schema compatible  ✓
renderer compatible ✓
```

If the candidate instead contains:

```text
data-block-version="I1"
```

Project LLM should reject it.

Likewise if it hardcodes:

```text
SUIA logo
SUIA navigation
SUIA API
```

it should reject it.

---

# 12. Then comes the part that makes it selectable in Composer

This is the most important part.

For I1/C1/D1, the repository already has the **renderer side**.

But a new I2 requires the complete integration chain.

Conceptually:

```text
                  I2
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
   Type/schema   Renderer    Registry
       │           │            │
       └───────────┼────────────┘
                   ▼
          Tutorial Composer
                   │
                   ▼
           TutorialDocument
                   │
                   ▼
        TutorialBlockRenderer
                   │
                   ▼
             IntroductionI2
```

That is what Project LLM must make sure exists.

---

# 13. The Composer should NOT contain I2's visual layout logic

This is another important architectural distinction.

Tutorial Composer should not contain:

```text
"I2 has this CSS"
"I2 has this JSX"
"I2 has these cards"
```

Instead Composer should know:

```text
Introduction
   Version:
      I1
      I2
```

and author the appropriate data.

Then:

```text
TutorialBlockRenderer
```

chooses the renderer.

So:

```text
Composer
  │
  │ produces:
  │
  ▼
{
  "type": "introduction",
  "version": "I2",
  "content": {...}
}
        │
        ▼
TutorialBlockRenderer
        │
        ▼
IntroductionBlock
        │
        ▼
I2 renderer
```

That is the clean architecture.

---

# 14. Why I1/C1/D1 are already available

Based on the repository audit, they have crossed the necessary runtime boundary.

The repository's Project LLM intelligence explicitly says:

```text
Verified runtime implementations: 3
I1
C1
D1
```

and marks them:

```text
RUNTIME_INTEGRATED
```

The registry UI also explicitly shows:

```text
Active in Runtime:
I1, C1, D1
```

So the repo itself already recognizes those three as the reference implementations.

---

# 15. And there is an important warning in the repo

The repository also has `S1`.

But S1 is **not** treated the same way.

The Project LLM intelligence says:

```text
S1
lifecycleStatus: IMPLEMENTED
UBRC: PARTIAL
versionRoutingPresent: false
```

and explicitly describes it as:

> not reference-quality.

This is actually a perfect demonstration of why Project LLM is needed.

Something can exist as a React component and still **not be a valid Composer/runtime block version**.

---

# 16. Therefore, for a new version, Project LLM should have a "Promotion to Composer" process

I recommend we think of it like this:

```text
USER + EXTERNAL AI
        │
        │ design
        ▼
   PROTOTYPE
        │
        │ Gate 1
        ▼
 APPROVED PROTOTYPE
        │
        ▼
 REACT/TS CANDIDATE
        │
        ▼
 PROJECT LLM AUDIT
        │
        ├── schema
        ├── renderer
        ├── version routing
        ├── UBRC
        ├── Composer
        ├── runtime
        ├── brand
        └── theme
        │
        ▼
 INTEGRATION PLAN
        │
        │ Human approval
        ▼
 REPOSITORY INTEGRATION
        │
        ▼
 DISCOVERY REFRESH
        │
        ▼
 COMPOSER DISCOVERY
        │
        ▼
 RUNTIME VERIFICATION
        │
        ▼
 CERTIFICATION_READY
        │
        │ HAA
        ▼
 CERTIFIED
```

**That is the missing mental model.**

---

# 17. What Project LLM should actually change for I2

If I2 is genuinely a new version, the integration could involve several repository artifacts.

Not necessarily all of these every time, but Project LLM must discover which are required:

```text
1. Type/schema
       ↓
2. Block implementation
       ↓
3. Version routing
       ↓
4. Registry/discoverability metadata
       ↓
5. Composer authoring support
       ↓
6. Renderer support
       ↓
7. Tests
       ↓
8. Evidence
```

The critical rule is:

> **Project LLM should discover the actual canonical files that I1/C1/D1 use and determine which of those must change for the new version.**

It should **not assume a fixed list**.

This is exactly where repository discovery becomes valuable.

---

# 18. This also changes how we should implement the Create page

The current Create page is too simplistic:

```text
Select Family
      ↓
Select Version
      ↓
Continue
```

It should eventually show:

```text
Introduction
────────────────────────────

Existing verified versions

✓ I1
   Runtime integrated
   Composer available
   Reference implementation

Target

[ I2 ]

Reference

I1

What changes?
✓ visual layout
✓ content structure
✓ presentation

What must remain compatible?
✓ Introduction family
✓ TutorialDocument
✓ TutorialBlockRenderer
✓ UBRC
✓ Theme
✓ Composer
```

Then:

```text
[ Generate Compliance Brief ]
```

---

# 19. The most important thing: Project LLM doesn't create the "Composer page"

I would change the terminology slightly.

You said:

> "Project LLM need to make it part of tutorial composer page"

Technically, I would define that as:

> **Project LLM must integrate and certify the new block version so that Tutorial Composer can discover and author it.**

It should **not build a second Composer page inside Project LLM**.

And it should **not duplicate Composer functionality**.

The ownership is:

```text
Project LLM
    │
    │ verifies + integrates
    ▼
Tutorial Composer
    │
    │ authoring
    ▼
TutorialDocument
    │
    │ rendering
    ▼
TutorialBlockRenderer
    │
    ▼
I2 renderer
```

---

# 20. So your original confusion has a very simple answer

You were thinking:

> "If User + External AI decide the layout, how can Project LLM make the block part of Composer?"

The answer is:

### User + External AI decide **what it looks like**.

### Project LLM decides whether the resulting implementation satisfies the **technical integration contract**.

### Tutorial Composer provides the **authoring interface**.

### TutorialBlockRenderer provides the **runtime rendering**.

For example:

```text
              I2 CREATION

       USER + EXTERNAL AI
              │
              │
       "This is what I2
        should look like"
              │
              ▼
        HTML/CSS/JS/JSON
              │
              ▼
          HUMAN APPROVAL
              │
              ▼
        React/TypeScript
              │
              ▼
        PROJECT LLM
              │
      ┌───────┼────────┐
      │       │        │
   Schema  Routing  Composer
      │       │        │
      └───────┼────────┘
              │
          Verification
              │
              ▼
        Repository
              │
              ▼
     Tutorial Composer
              │
              ▼
    TutorialBlockRenderer
              │
              ▼
          I2 appears
```

And the existing `I1`, `C1`, `D1` implementations demonstrate that this **version-routing + renderer + DOM identity + Composer/runtime integration** model is already the pattern in the repository.

The next engineering task therefore should **not** be "invent how Project LLM creates layouts." It should be to audit the **exact Composer registry/authoring path used by I1/C1/D1**, document that as the canonical integration contract, and make the new-version workflow implement that contract automatically/consistently.

That is the piece I would have Kiro audit next before we ask either agent to implement the new-version workflow.

Yes. I re-checked the GitHub repository, and the key to your confusion is this:

> **Introduction I1 does not itself implement ILS, LSNB, or RSSB. It becomes compatible with them because it participates in the Universal Tutorial Engine contract, while those systems are owned by the tutorial page/runtime shell.**

That distinction is extremely important.

## 1. The architecture in the repository is actually this

The repository's runtime-compliance document explicitly describes a 10-stage lifecycle:

```text
Educational Definition
        ↓
Prototype / Reference
        ↓
React Implementation
        ↓
Schema Definition
        ↓
TutorialBlockRenderer
        ↓
Composer Integration
        ↓
UBRC
        ↓
ILS participation
        ↓
LSNB / RSSB relationship
        ↓
Tests
```

The repository specifically says that ILS participation is **passive**, and that LSNB/RSSB are **page-level infrastructure**, not something each block creates. 

So the architecture is **not**:

```text
IntroductionBlock
 ├── ILS
 ├── LSNB
 ├── RSSB
 └── Tutorial Page
```

It is:

```text
                 Tutorial Page Shell
                       │
          ┌────────────┼─────────────┐
          │            │             │
       LSNB           RSSB          ILS
          │            │             │
          └────────────┼─────────────┘
                       │
                TutorialDocument
                       │
                TutorialBlockRenderer
                       │
              ┌────────┼─────────┐
              │        │         │
             I1        C1        D1
```

That is why a block can be created independently.

---

# 2. How does I1 participate in ILS without importing ILS?

This is probably the most important part.

The actual `IntroductionBlock.tsx` does **not** call an ILS API.

It renders:

```tsx
<article
  data-block-id={block.id}
  data-block-type="introduction"
  data-block-version={block.version}
>
```

The repository calls these attributes **UBRC — Universal Block Runtime Context**.

So I1 provides identity:

```text
block.id       → which block instance?
block.type     → which family?
block.version  → which implementation?
```

Then the page/runtime infrastructure can observe it.

Conceptually:

```text
IntroductionBlock
       │
       │ renders
       ▼
data-block-id="abc"
data-block-type="introduction"
data-block-version="I1"
       │
       ▼
ActiveBlockContext
       │
       ▼
IntersectionObserver
       │
       ▼
ILSProvider
       │
       ▼
BlockTelemetryProvider
       │
       ▼
ILS backend
```

Therefore:

### I1 does not know about ILS.

It only obeys the runtime contract.

This is actually a **better architecture**.

If I1 directly did:

```tsx
import { ILSService } ...
```

then the block would become coupled to ILS.

Instead:

```text
Block
  ↓
UBRC identity
  ↓
Runtime infrastructure
  ↓
ILS
```

That allows the same block to be reused in different tutorial contexts.

---

# 3. Same principle for LSNB and RSSB

The repository explicitly says:

> **LSNB/RSSB are page-level consumers.**

The document identifies:

- LSNB = Left Side Navigation Bar
- RSSB = Right Side Status Bar

and says the `TutorialPageShell` owns their creation.

So the block does **not** render:

```text
[LSNB] Introduction content [RSSB]
```

Instead the page does:

```text
TutorialPageShell
│
├── LSNB
│
├── Main Tutorial Content
│     │
│     ├── I1
│     ├── C1
│     ├── D1
│     └── ...
│
└── RSSB
```

This is why an independently created I2 can eventually work inside the same page.

The page shell doesn't care whether the content is:

```text
I1
I2
C1
D1
...
```

It cares that the block conforms to the Tutorial Engine contract.

---

# 4. Then how does I1 become selectable in Tutorial Composer?

This is the next important connection.

The repository's runtime compliance audit explicitly identifies:

```text
apps/skillhubcore-admin/src/app/(admin)/tools/
    tutorial-page-content/
        registry/
            entries/
                introduction.registry.ts
```

as the Composer registry for Introduction.

It says I1 has:

```text
Composer Integration = verified
```

and similarly:

```text
code.registry.ts
definition.registry.ts
```

for C1 and D1.

So the complete path is:

```text
             I1 implementation
                    │
                    ▼
          IntroductionBlock.tsx
                    │
                    ▼
          TutorialBlockRenderer
                    │
                    ▼
       introduction.registry.ts
                    │
                    ▼
          Tutorial Composer
                    │
                    ▼
         TutorialDocument
                    │
                    ▼
          Tutorial Page Shell
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
         LSNB      ILS       RSSB
                    │
                    ▼
              Introduction I1
```

This is the missing link from your previous question.

---

# 5. And this is exactly where Project LLM fits

Now we can answer your original I2 question much more precisely.

Suppose you ask:

> "I want to create Introduction I2."

The External AI/User can design something completely different:

```text
I2 visual design
      ↓
HTML
CSS
JS
JSON
```

Project LLM does **not** say:

> "I will design your page."

Instead it asks:

> "Does this candidate satisfy the existing Tutorial Engine contract that allowed I1 to work?"

It discovers the I1 canonical pattern.

For example:

```text
I1
│
├── IntroductionBlock.tsx
├── IIntroductionBlock schema
├── introduction registry
├── TutorialBlockRenderer routing
├── UBRC
├── theme
├── TutorialDocument compatibility
├── Composer compatibility
├── tests
└── runtime compatibility
```

Then I2 becomes:

```text
I2 candidate
│
├── new visual implementation
│
├── I2 schema/content contract
│
├── I2 version routing
│
├── Composer registry entry
│
├── TutorialBlockRenderer support
│
├── UBRC
│
├── theme support
│
├── TutorialDocument compatibility
│
├── ILS passive compatibility
│
├── LSNB/RSSB page-level compatibility
│
└── tests/evidence
```

The important point is:

**Project LLM doesn't have to put ILS code inside I2.**

It verifies that I2 remains compatible with the infrastructure that already supplies ILS.

---

# 6. Now the brand question: how can the same I1/I2 work for SUIA and RTH?

This is another very good architectural question.

Look at the actual I1 implementation.

It says that I1 is the canonical renderer for **all brands** and that the layout is fixed while theme values vary.

The important code pattern is effectively:

```tsx
const primary = theme.primary;
const secondary = theme.secondary;
```

Then the component uses:

```tsx
style={{ color: primary }}
```

and:

```tsx
style={{ color: secondary }}
```

rather than hard-coding a particular brand.

Therefore:

```text
             Introduction I1
                    │
                    │
             receives theme
                    │
          ┌─────────┴─────────┐
          │                   │
       SUIA theme          RTH theme
          │                   │
          ▼                   ▼
      primary=A           primary=B
      secondary=A         secondary=B
          │                   │
          ▼                   ▼
       SUIA I1              RTH I1
```

Same component.

Same version.

Same educational content structure.

Same runtime contract.

Different theme context.

---

# 7. This means "brand independent" does NOT mean "brand unaware"

This distinction matters.

### Bad architecture

```tsx
if (brand === 'SUIA') {
   return <SUIAIntroduction />;
}

if (brand === 'RTH') {
   return <RTHIntroduction />;
}
```

That creates two implementations.

You don't want that.

### Correct architecture

```tsx
function IntroductionI1View({
   block,
   theme
}) {
   ...
   style={{ color: theme.primary }}
   ...
}
```

Then:

```text
SUIA learner
   ↓
Tutorial Page
   ↓
theme = SUIA theme
   ↓
Introduction I1
```

while:

```text
RTH learner
   ↓
Tutorial Page
   ↓
theme = RTH theme
   ↓
Introduction I1
```

The **block doesn't decide the brand**.

The **tutorial page/runtime context supplies the brand theme**.

---

# 8. So where does the learner's brand come from?

Conceptually:

```text
Learner
   │
   │ authenticated / selected platform
   ▼
Brand Context
   │
   ├── SUIA
   │
   └── RTH
   │
   ▼
Tutorial Page
   │
   ├── theme
   ├── LSNB
   ├── RSSB
   ├── ILS runtime
   └── TutorialDocument
             │
             ▼
      TutorialBlockRenderer
             │
             ▼
       Introduction I1
```

The block receives:

```text
block
theme
runtime context
```

It doesn't need to know:

```text
"I am running on SUIA"
```

or:

```text
"I am running on RTH"
```

It simply renders according to the supplied theme.

That is the **brand-independent component model**.

---

# 9. And ILS can also remain brand-independent

This is even more powerful.

Suppose the same I1 appears in:

```text
SUIA Tutorial A
RTH Tutorial B
```

Both can emit:

```text
data-block-id
data-block-type
data-block-version
```

The ILS system doesn't need a different I1 implementation.

It receives the runtime context from the page.

Conceptually:

```text
                I1
                 │
                 │ UBRC
                 ▼
       ┌───────────────────┐
       │ Tutorial Runtime  │
       └─────────┬─────────┘
                 │
       ┌─────────┼───────────┐
       ▼         ▼           ▼
    brand      ILS         page
    theme    telemetry    context
       │         │           │
       ▼         ▼           ▼
    SUIA/RTH   tracking     LSNB/RSSB
```

So the same block can participate in all three concerns without embedding those systems.

---

# 10. This is exactly why the "passive runtime" rule in Project LLM matters

The current Project LLM creation brief explicitly says the candidate must have:

```text
No ILS API calls
No LSNB infrastructure
No RSSB infrastructure
```

That might initially look strange:

> "If I2 must support ILS, why prohibit ILS?"

Now the reason is clear.

Because **supporting ILS does not mean implementing ILS.**

The candidate must be:

```text
ILS-compatible
```

not:

```text
ILS-dependent
```

Same for LSNB/RSSB.

That is a major architectural principle.

---

# 11. Therefore, what does Project LLM actually certify for I2?

For I2, Project LLM should eventually verify something like:

### A. Visual layer

External AI + human:

```text
I2 layout
I2 visual hierarchy
I2 responsive behavior
I2 educational presentation
```

Project LLM does not invent this.

---

### B. Data/schema layer

Project LLM verifies:

```text
I2 content schema
      ↓
valid TutorialBlock
      ↓
valid TutorialDocument
```

---

### C. Renderer layer

Project LLM verifies:

```text
TutorialBlockRenderer
       ↓
introduction
       ↓
I2
       ↓
IntroductionI2View
```

instead of silently falling back to I1.

---

### D. Composer layer

Project LLM verifies:

```text
Tutorial Composer
       ↓
Introduction
       ↓
I1
       ↓
I2
```

So an author can actually select I2.

---

### E. UBRC layer

Project LLM verifies:

```html
data-block-id
data-block-type="introduction"
data-block-version="I2"
```

---

### F. ILS layer

Project LLM verifies:

```text
I2
 ↓
UBRC
 ↓
ActiveBlockContext
 ↓
ILSProvider
```

not:

```text
I2 → ILS API
```

---

### G. LSNB/RSSB layer

Project LLM verifies:

```text
I2
 ↓
TutorialPageShell
 ↓
LSNB/RSSB
```

and verifies that I2 has **not duplicated those page-level systems**.

---

### H. Theme layer

Project LLM verifies:

```text
I2
 ↓
theme.primary
theme.secondary
 ↓
SUIA
```

and:

```text
I2
 ↓
theme.primary
theme.secondary
 ↓
RTH
```

without creating:

```text
I2-SUIA.tsx
I2-RTH.tsx
```

unless there is a genuinely documented reason.

---

# 12. The most important architectural picture

This is the architecture I think you are trying to build:

```text
                         HUMAN
                           │
                           │ design decision
                           ▼
                 USER + EXTERNAL AI
                           │
                           │
                    I2 HTML/CSS/JS
                           │
                           ▼
                  ┌────────────────┐
                  │   PROJECT LLM  │
                  │                │
                  │ Discover       │
                  │ Compare        │
                  │ Plan           │
                  │ Approve        │
                  │ Integrate      │
                  │ Verify         │
                  │ Certify        │
                  └───────┬────────┘
                          │
                          │ canonical repository
                          ▼
                 ┌────────────────────┐
                 │ Tutorial Contract  │
                 └─────────┬──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       Schema         Renderer         Composer
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                   TutorialDocument
                           │
                           ▼
                   TutorialPageShell
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
        LSNB             ILS              RSSB
                           │
                           │
                    runtime telemetry
                           │
                           ▼
                       Learner
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
            SUIA                       RTH
         SUIA theme                 RTH theme
              │                         │
              ▼                         ▼
             I2                        I2
```

**One I2 implementation.**

Not two.

**One Composer entry.**

Not two.

**One runtime renderer.**

Not two.

**One ILS compatibility contract.**

Not two.

The learner's **page context/theme** changes.

---

# 13. But there is one important caveat from the current repository

This is where I want to be precise rather than tell you that everything is already finished.

The repository's **runtime-compliance documentation says I1/C1/D1 have this complete lifecycle**, including Composer, ILS and LSNB/RSSB. 

However, our actual Project LLM implementation audit showed that some of the **Project LLM intelligence is currently a TypeScript fixture**, not a fully authoritative live discovery system.

For example, `projectLlmRepositoryIntelligence.ts` literally identifies itself as:

> "Static read-only repository intelligence fixture."

And it records I1/C1/D1 as the three verified runtime implementations.

So today we have two different levels:

### Existing Tutorial Engine

The repository documents and implements the I1/C1/D1 lifecycle.

### Project LLM

Project LLM currently **knows about that lifecycle partly through fixtures/documentation**, rather than dynamically proving every relationship from the live repository.

That is one of the things we need to fix.

---

# 14. This changes what our next Project LLM implementation should be

I would **not** tell Kiro:

> "Make Project LLM support ILS, RSSB and LSNB inside every block."

That would be architecturally wrong.

Instead tell Kiro:

> **Project LLM must discover and verify the existing Tutorial Engine integration contract used by reference implementations I1, C1 and D1. It must verify that a candidate version conforms to the contract rather than embedding ILS, LSNB or RSSB into the candidate.**

And specifically:

```text
Reference I1
     ↓
discover actual files
     ↓
schema
renderer
Composer registry
TutorialDocument
TutorialPageShell
UBRC
ILS provider/context
LSNB
RSSB
theme provider
tests
     ↓
derive integration contract
     ↓
candidate I2
     ↓
compare against contract
     ↓
integration plan
     ↓
human approval
     ↓
placement
     ↓
runtime verification
     ↓
certification
```

That is much stronger than hard-coding:

```text
"I2 needs these 7 files."
```

because tomorrow the architecture may change.

Project LLM should discover the canonical integration path from the repository.

---

## Bottom line

Your intuition is correct: **an independently designed block can become a fully integrated Tutorial Composer block without containing ILS, RSSB, LSNB, branding, or page-navigation logic itself.**

The trick is the layered architecture:

**External AI creates the visual block → schema/renderer/Composer make it a valid Tutorial Block → UBRC makes it observable → TutorialPageShell supplies ILS/LSNB/RSSB → runtime supplies the learner's brand theme.**

And this is precisely why I1 is such an important reference implementation for creating I2.

The next audit I would perform is **the exact live code path from `introduction.registry.ts` → Tutorial Composer selection → TutorialDocument → `TutorialPageShell` → theme provider → ILSProvider → LSNB/RSSB**, because that will give us the definitive implementation contract Project LLM should use for I2 rather than relying on the current Project LLM fixtures.

Yes. I checked **C1 and D1** against the same architecture, and the result is clear:

> **C1 and D1 follow the same fundamental architecture as I1.**
>
> They are independently implemented block renderers, but they do **not** own ILS, LSNB, RSSB, or the learner brand. They participate in those systems through the shared Tutorial Engine runtime contracts.

There are a few implementation differences between C1 and D1, but the architectural principle is the same.

---

# 1. C1 — same architecture

The actual GitHub `CodeC1Block.tsx` confirms that C1 receives:

```tsx
CodeC1Block({
  block,
  theme: providedTheme,
  runtimeContext
})
```

and then uses the supplied `theme`.

For example, it uses:

```tsx
theme.primary
theme.primaryDark
theme.secondary
```

throughout the renderer.

So C1 is **theme-driven**, not brand-driven.

Its root DOM element is:

```tsx
<article
  data-block-id={block.id}
  data-block-type="code"
  data-block-version="C1"
>
```

That is the same UBRC identity mechanism used by I1.

Therefore:

```text
C1
 │
 ├── data-block-id
 ├── data-block-type="code"
 └── data-block-version="C1"
```

becomes observable by the shared runtime.

---

# 2. C1 does NOT implement ILS

This is particularly clear from the C1 source.

There is no:

```text
C1 → ILS API
```

architecture.

Instead:

```text
C1
 │
 │ renders UBRC
 ▼
data-block-id
data-block-type
data-block-version
 │
 ▼
ActiveBlockProvider
 │
 ▼
ILSProvider
 │
 ▼
telemetry / learning state
```

The repository's `ActiveBlockContext.tsx` explicitly documents this architecture.

It says that ActiveBlockProvider:

- reads `data-block-id`
- reads `data-block-type`
- reads `data-block-version`
- uses `IntersectionObserver`
- determines the active block
- **does not call ILS APIs**
- **does not persist state**
- **does not render UI**

So C1 does not need to know that ILS exists.

That is exactly what we want.

---

# 3. C1 therefore works inside the same ILS runtime

Suppose a TutorialDocument contains:

```text
I1
C1
D1
```

The browser effectively has:

```html
<article data-block-id="i1"
         data-block-type="introduction"
         data-block-version="I1">

<article data-block-id="c1"
         data-block-type="code"
         data-block-version="C1">

<article data-block-id="d1"
         data-block-type="definition"
         data-block-version="D1">
```

The ActiveBlockProvider doesn't care that one is Introduction, one is Code, and one is Definition.

It simply discovers:

```text
blockId
blockType
blockVersion
```

Then when C1 becomes the active viewport block:

```text
C1
 ↓
data-block-* identity
 ↓
ActiveBlockProvider
 ↓
activeBlock = {
   blockId,
   blockType: "code",
   blockVersion: "C1"
 }
 ↓
ILSProvider
```

Therefore C1 gets ILS participation **without embedding ILS logic inside C1**.

---

# 4. D1 follows the same architecture

D1 is actually even more explicit than C1.

The repository's `DefinitionBlock.tsx` has a version router:

```tsx
switch (block.version) {
  case 'D1':
    return <DefinitionD1View ... />;
  default:
    throw new Error(...)
}
```

So:

```text
Definition
   ↓
version
   ↓
D1
   ↓
DefinitionD1View
```

This is the same conceptual pattern as I1.

---

# 5. D1 explicitly says it is brand-independent

This is one of the strongest pieces of evidence in the repository.

The D1 source describes `DefinitionD1View` as:

> **the single authoritative Definition D1 renderer for ALL brands**

and says:

> **Only `theme.primary` and `theme.secondary` vary by brand.**

It also explicitly identifies its consumers as:

```text
Composer Preview
SUIA Student Page
RTH Student Page
All other brand learner pages
```

That is almost exactly the architecture you were asking about.

So D1 is:

```text
ONE D1 implementation
        │
        ├────────── SUIA
        │
        ├────────── RTH
        │
        └────────── other brand learner pages
```

not:

```text
D1-SUIA.tsx
D1-RTH.tsx
```

---

# 6. D1's theme mechanism is explicit

D1 receives:

```tsx
theme
```

and validates:

```tsx
if (!theme?.primary || !theme?.secondary) {
   throw new Error(...)
}
```

Then:

```tsx
const primary = theme.primary;
const secondary = theme.secondary;
```

The visual renderer uses those values.

So:

```text
SUIA learner
     │
     ▼
Tutorial page
     │
     ▼
SUIA theme
     │
     ├── primary
     └── secondary
     │
     ▼
DefinitionD1View
```

while:

```text
RTH learner
     │
     ▼
Tutorial page
     │
     ▼
RTH theme
     │
     ├── primary
     └── secondary
     │
     ▼
DefinitionD1View
```

Same D1 renderer.

Different runtime theme.

---

# 7. D1 also provides UBRC

The D1 root element is:

```tsx
<article
  ...
  data-block-id={block.id}
  data-block-type="definition"
  data-block-version={block.version}
>
```

So:

```text
D1
 │
 ├── ID
 ├── type = definition
 └── version = D1
```

Again:

```text
D1
 ↓
UBRC
 ↓
ActiveBlockProvider
 ↓
ILSProvider
```

Therefore D1 participates in ILS in exactly the same passive manner.

---

# 8. C1 and D1 also participate in LSNB/RSSB the same way

Neither C1 nor D1 owns:

```text
LSNB
RSSB
```

The repository's runtime architecture identifies those as **page-level infrastructure**.

The structure is therefore:

```text
TutorialPageShell
│
├── LSNB
│
├── Tutorial content
│    │
│    ├── I1
│    ├── C1
│    ├── D1
│    └── ...
│
└── RSSB
```

C1 does not need to know:

> "I need to display the Right Side Status Bar."

D1 doesn't need to know:

> "I need to update the Left Side Navigation Bar."

Instead the page/runtime system knows which block is active and which tutorial page the learner is viewing.

---

# 9. Why does RSSB know about C1 or D1 then?

Because the runtime has the block identity.

For example:

```text
activeBlock = {
    blockId: "abc",
    blockType: "code",
    blockVersion: "C1"
}
```

The learning/progress system can associate that identity with the TutorialDocument/page state.

Conceptually:

```text
                 TutorialDocument
                       │
          ┌────────────┼────────────┐
          │            │            │
         I1           C1           D1
          │            │            │
          └────────────┼────────────┘
                       │
                ActiveBlockProvider
                       │
                       ▼
                 Current Block
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
            ILS       RSSB      other
```

Again, **the block doesn't implement RSSB**.

The page/runtime does.

---

# 10. Composer integration is also the same architectural layer

The repository's runtime-compliance evidence identifies:

```text
code.registry.ts
```

for C1 and:

```text
definition.registry.ts
```

for D1 as their Composer registry entries.

The documented lifecycle is:

```text
React implementation
        ↓
schema
        ↓
TutorialBlockRenderer
        ↓
Composer registry
        ↓
Tutorial Composer
```

So C1 isn't magically available in Composer because `CodeC1Block.tsx` exists.

It becomes part of the authoring system because the **Composer registry describes it as an authorable block/version**.

Same for D1.

That gives us:

```text
C1 implementation
      │
      ├── schema
      ├── renderer
      ├── UBRC
      └── Composer registry
                │
                ▼
        Tutorial Composer
```

and:

```text
D1 implementation
      │
      ├── schema
      ├── renderer
      ├── UBRC
      └── Composer registry
                │
                ▼
        Tutorial Composer
```

---

# 11. C1 has one interesting difference from D1

There is a **routing implementation difference**, but not an architectural difference.

### C1

The central `TutorialBlockRenderer` explicitly checks:

```text
type = code
version = C1
```

before rendering C1.

Conceptually:

```text
TutorialBlockRenderer
      │
      └── code
           │
           ├── C1 → CodeC1Block
           └── anything else → reject
```

### D1

The central renderer dispatches to:

```text
DefinitionBlock
```

and `DefinitionBlock` itself performs:

```text
version = D1
```

validation.

So:

```text
C1:
TutorialBlockRenderer
       ↓
version validation
       ↓
CodeC1Block
```

while:

```text
D1:
TutorialBlockRenderer
       ↓
DefinitionBlock
       ↓
version validation
       ↓
DefinitionD1View
```

That is an implementation detail.

The architectural contract is the same:

> **A versioned block cannot silently render an unsupported version.**

---

# 12. The three reference blocks now look like this

We can put I1, C1 and D1 side by side:

| Capability | I1 | C1 | D1 |
|---|---|---|---|
| Independent visual implementation | ✅ | ✅ | ✅ |
| Version-specific renderer | ✅ | ✅ | ✅ |
| TutorialBlockRenderer | ✅ | ✅ | ✅ |
| Composer registry | ✅ | ✅ | ✅ |
| UBRC ID | ✅ | ✅ | ✅ |
| UBRC type | ✅ | ✅ | ✅ |
| UBRC version | ✅ | ✅ | ✅ |
| Direct ILS API | ❌ | ❌ | ❌ |
| Passive ILS participation | ✅ | ✅ | ✅ |
| Owns LSNB | ❌ | ❌ | ❌ |
| Owns RSSB | ❌ | ❌ | ❌ |
| Page-level LSNB/RSSB | ✅ | ✅ | ✅ |
| Receives theme | ✅ | ✅ | ✅ |
| Brand-specific renderer | ❌ | ❌ | ❌ |
| SUIA/RTH compatible | ✅ | ✅ | ✅ |
| Tutorial runtime compatible | ✅ | ✅ | ✅ |

That is the architecture we want Project LLM to preserve.

---

# 13. This gives us a very important conclusion for I2

Now we have **three reference implementations**, not just one:

```text
                 Reference implementations
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
         I1             C1             D1
          │              │              │
          └──────────────┼──────────────┘
                         │
               Common Tutorial Contract
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
      UBRC              ILS           Composer
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                  Tutorial Page
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
             LSNB       RSSB       Theme
                                    │
                              SUIA / RTH
```

That is **much stronger** than saying:

> "Use I1 as the template."

Project LLM can now say:

> "I1, C1 and D1 demonstrate the canonical versioned-block integration contract."

Then for I2:

```text
I2 candidate
   ↓
Compare against canonical contract
   ↓
Does it have:
   ✓ versioned schema?
   ✓ renderer routing?
   ✓ Composer registry?
   ✓ UBRC?
   ✓ passive ILS compatibility?
   ✓ page-level LSNB/RSSB compatibility?
   ✓ theme injection?
   ✓ SUIA/RTH independence?
   ✓ TutorialDocument compatibility?
   ✓ tests?
```

Only then:

```text
Human Gate
    ↓
Integration
    ↓
Runtime Verification
    ↓
Certification
```

---

# 14. One important correction to our Project LLM design

This audit also exposes something we should change in the Project LLM implementation.

We should **not** encode:

```text
"I1 supports ILS"
"I2 must support ILS"
"C1 supports RSSB"
```

as isolated boolean facts.

That loses the architecture.

Instead Project LLM should model the relationship:

```text
Block
  ↓
Universal Tutorial Contract
  ↓
Runtime Infrastructure
```

For example:

```json
{
  "block": "introduction",
  "version": "I2",
  "runtimeContract": {
    "ubrc": true,
    "passiveIls": true,
    "pageLevelNavigation": true,
    "pageLevelProgress": true,
    "themeInjected": true
  }
}
```

The key word is **compatible**, not **owns**.

---

## Final conclusion

After checking C1 and D1, I would now treat **I1 + C1 + D1 as the three canonical reference blocks for the Project LLM creation/integration workflow**.

They all demonstrate the same fundamental rule:

> **The block is responsible for rendering its educational UI and exposing its runtime identity. The Tutorial Engine/page runtime is responsible for ILS, navigation, progress, and brand context. Composer is responsible for authoring/discoverability.**

So when External AI creates I2, C2, D2, or a completely new block family, Project LLM should **not add ILS/LSNB/RSSB code to the candidate**.

It should verify that the candidate correctly plugs into the **existing infrastructure** just like I1/C1/D1.

And importantly, D1's source gives us especially strong direct evidence that **one canonical renderer is intentionally reused across SUIA, RTH, Composer Preview, and other learner pages, with only the supplied theme varying**. That is exactly the brand-independent model you were asking about.

Yes. And I want to correct the emphasis from my previous answer: **I should not have singled out D1 as though D1 uniquely establishes the brand-independent architecture.** Based on the repository evidence we reviewed, **I1, C1, and D1 are all canonical reference implementations of the same broader Tutorial Engine contract.** D1 happened to contain the most explicit wording in the source I quoted, but that does **not** mean D1 is architecturally more important than I1 or C1.

The right way to design Project LLM is therefore:

> **When the user selects `Family + Version`, Project LLM should generate a version-specific Engineering/Compliance Contract derived from the canonical repository implementation and contracts for that family/version. External AI must implement against that contract. Project LLM later verifies that the uploaded candidate satisfies it before integration/certification.**

The supplied project material explicitly describes the candidate as more than a `.tsx` file: implementation + contract + registry + renderer + Composer integration + tests + evidence + runtime verification. Explain I2 Creation Files

---

# 1. What should happen when the user selects a block/version?

Suppose the user selects:

```text
Block Family:  Objective
Target Version: O1
```

or:

```text
Block Family:  Code
Target Version: C2
```

or:

```text
Block Family:  Introduction
Target Version: I7
```

Project LLM should **not simply give External AI a prompt saying "create an O1 block."**

It should first inspect the repository and construct a **Candidate Block Engineering Contract**.

Conceptually:

```text
USER
 │
 ├── Select Family
 │
 └── Select Version
          │
          ▼
PROJECT LLM
          │
          ├── Repository Discovery
          ├── Existing Version Analysis
          ├── Canonical Reference Analysis
          ├── Schema Analysis
          ├── Renderer Analysis
          ├── Composer Analysis
          ├── Runtime Analysis
          ├── ILS Analysis
          ├── LSNB Analysis
          ├── RSSB Analysis
          ├── Theme Analysis
          ├── Brand Independence Analysis
          └── Test/Evidence Requirements
                    │
                    ▼
       CANDIDATE BLOCK ENGINEERING CONTRACT
                    │
                    ▼
              EXTERNAL AI
```

This is much closer to what we actually want.

---

# 2. What exactly should be inside that contract?

I would make the Project LLM output a structured contract with these sections.

## A. Identity

```text
Family:
Objective

Target version:
O1

Block type:
objective

Version status:
new / update / extension

Canonical references:
I1 / C1 / D1 / other relevant versions
```

The important distinction is:

**I1/C1/D1 are references, not templates that External AI must blindly copy.**

Project LLM should determine which existing implementation(s) are actually relevant.

---

# 3. Educational/content contract

Project LLM should tell External AI what the block must represent, but **not invent the educational design unless the project has defined it.**

For example:

```text
CONTENT CONTRACT

Purpose:
...

Required content fields:
...

Optional content fields:
...

Authoring data:
...

Learner-facing data:
...

Validation rules:
...
```

This eventually corresponds to the canonical block data/type/schema contract.

So External AI should know:

```text
What content does this block represent?
What data does Composer need?
What data does runtime receive?
What fields are mandatory?
What fields are optional?
What constitutes invalid content?
```

---

# 4. UI/UX contract

This is where your point about External AI is particularly important.

The user + External AI decide the actual visual design.

Project LLM therefore shouldn't say:

> "Make it look exactly like D1."

Instead, the contract should distinguish **creative requirements** from **platform requirements**.

For example:

```text
UI/UX

Creative design:
    External AI + human controlled

Platform requirements:
    MUST render as a tutorial block
    MUST expose canonical block identity
    MUST accept canonical theme
    MUST not own page navigation
    MUST not create LSNB
    MUST not create RSSB
    MUST not directly control ILS
    MUST follow repository accessibility requirements
    MUST satisfy responsive/runtime requirements
```

That gives External AI creative freedom **inside the platform contract**.

---

# 5. The most important part: UBRC / block identity

This should be compulsory.

For the existing reference implementations, the runtime identifies blocks using attributes such as:

```html
data-block-id
data-block-type
data-block-version
```

So Project LLM should produce a requirement such as:

```text
UBRC REQUIREMENTS

Required root identity:

data-block-id
data-block-type
data-block-version

Values must correspond to:

block.id
canonical block type
selected target version
```

This is important because the runtime infrastructure uses those identities.

It is not just visual markup.

It is the bridge between:

```text
Block
  ↓
Tutorial Runtime
  ↓
ActiveBlockContext
  ↓
ILS runtime
```

---

# 6. ILS requirement

This is where we need to be very precise.

The External AI should **not implement its own ILS system**.

Instead, Project LLM should tell it:

```text
ILS CONTRACT

The block must be ILS-compatible.

The block MUST:
    expose canonical block identity
    render required runtime identity
    participate in passive runtime observation

The block MUST NOT:
    call ILS APIs directly
    own learning telemetry
    maintain global learning state
    implement duplicate ILS tracking
    create learning navigation
```

That matches the architecture we examined.

The runtime infrastructure observes the block.

Conceptually:

```text
Candidate Block
      │
      │ UBRC identity
      ▼
ActiveBlockContext
      │
      ▼
ILSProvider
      │
      ▼
ILS telemetry/state
```

So the block is **ILS-compatible**, not an ILS application.

That distinction should be explicitly written into every generated contract.

---

# 7. LSNB requirement

Same principle.

The block should **not implement LSNB**.

Project LLM should specify:

```text
LSNB

Block must be compatible with page-level LSNB.

Block MUST NOT:
    create navigation
    create page progress controls
    create section navigation
    duplicate page navigation state

LSNB ownership:
    Tutorial Page / page shell
```

The supplied project material explicitly describes LSNB/RSSB as page-level consumers rather than responsibilities of individual blocks. Explain I2 Creation Files

---

# 8. RSSB requirement

Same again.

```text
RSSB

Block must satisfy applicable RSSB compatibility requirements.

Block MUST NOT independently create page-level RSSB/navigation behavior.

Applicable RSSB requirements:
    [repository-derived requirements]
```

And importantly:

**Project LLM must obtain the actual requirements from the canonical repository contracts/documentation.**

It should not hallucinate an RSSB specification.

The supplied material explicitly says the exact checks should come from canonical LSNB/RSSB documentation/contracts. Explain I2 Creation Files

---

# 9. Theme contract

This is one of the most important requirements for your SUIA/RTH architecture.

External AI should receive something like:

```text
THEME CONTRACT

Block MUST receive visual theme through the canonical runtime/theme mechanism.

Block MUST NOT hard-code:
    SUIA colors
    RTH colors
    SUIA logo
    RTH logo
    brand-specific typography
    brand-specific URLs
    brand-specific assets
```

Instead:

```text
Same implementation
       │
       ├── SUIA theme
       │
       └── RTH theme
```

So:

```text
                 Candidate Block
                       │
             ┌─────────┴─────────┐
             │                   │
          SUIA                 RTH
          theme               theme
             │                   │
             └─────────┬─────────┘
                       ▼
                same implementation
```

This is exactly the architecture you were asking about.

And **I1, C1 and D1 should all be treated as evidence for this common model**, not D1 alone.

---

# 10. TutorialBlockRenderer contract

This is compulsory.

Project LLM should tell External AI:

```text
RENDERER CONTRACT

The block MUST be resolvable through:

TutorialBlockRenderer

Required:
    canonical block type
    canonical version
    renderer dispatch
    unsupported-version behavior
```

For example:

```text
type = "code"
version = "C1"

        ↓

TutorialBlockRenderer

        ↓

CodeC1Block
```

or:

```text
type = "definition"
version = "D1"

        ↓

TutorialBlockRenderer

        ↓

DefinitionBlock
        ↓
D1 renderer
```

The exact routing mechanism should be discovered from the repository for the selected family/version.

---

# 11. Schema/type contract

This is another mandatory part.

Project LLM should identify:

```text
TYPE CONTRACT
SCHEMA CONTRACT
```

For example:

```text
Block Type
    ↓
TutorialBlock type
    ↓
Authoring schema
    ↓
Runtime data
```

External AI therefore needs to know:

```text
Required TypeScript types
Required authoring schema
Required runtime shape
Required validation behavior
Required version fields
```

This is critical for Composer integration.

---

# 12. Tutorial Composer contract

This is where your original question becomes very important.

Project LLM shouldn't merely tell External AI:

> "Make the React component."

It should tell it:

```text
COMPOSER CONTRACT

The new block must:

✓ be registered
✓ be discoverable
✓ appear as a Composer option
✓ expose its authoring schema
✓ be selectable
✓ be constructable
✓ produce valid TutorialDocument configuration
✓ resolve through TutorialBlockRenderer
✓ render successfully in the generated tutorial
```

The supplied project material explicitly describes this chain:

```text
Candidate
 ↓
Registry
 ↓
TutorialBlockRenderer
 ↓
Tutorial Composer
 ↓
Selectable
 ↓
Constructable
 ↓
Generated tutorial
 ↓
Runtime
 ↓
Browser
```

and identifies failures such as `COMPOSER_NOT_REGISTERED`, `COMPOSER_NOT_DISCOVERABLE`, `COMPOSER_SCHEMA_MISMATCH`, and `COMPOSER_RENDERER_MISMATCH`. Explain I2 Creation Files

So **Composer integration is part of the engineering contract**, not something we discover accidentally after coding.

---

# 13. Required implementation artifacts

Project LLM should generate an artifact checklist based on repository discovery.

Not a fixed hard-coded list.

For example:

```text
REQUIRED ARTIFACTS

Implementation
[ ] Block component

Types
[ ] Block types

Schema
[ ] Authoring/runtime schema

Renderer
[ ] Renderer registration/routing

Registry
[ ] Composer registry entry

Tests
[ ] Structural tests
[ ] Renderer tests
[ ] Composer tests
[ ] Runtime tests
[ ] Browser tests where required

Supporting artifacts
[ ] Any canonical files required by repository architecture
```

But Project LLM must determine the **actual canonical paths** from the repository.

That is important because we don't want:

> "Every new block always requires exactly these 12 files."

The repository may evolve.

Instead:

> **Project LLM discovers the canonical integration points for the selected family/version.**

---

# 14. External AI should receive acceptance criteria

The contract should end with something machine-readable.

For example:

```text
ACCEPTANCE CRITERIA

AC-001
Block identity is canonical.

AC-002
Target version is correctly represented.

AC-003
Required schema exists and validates.

AC-004
Renderer resolves the block.

AC-005
Composer discovers the block.

AC-006
Composer can construct the block.

AC-007
Generated TutorialDocument is valid.

AC-008
Tutorial runtime renders the block.

AC-009
UBRC identity is present.

AC-010
ILS compatibility passes.

AC-011
LSNB compatibility passes.

AC-012
RSSB compatibility passes.

AC-013
Theme injection works.

AC-014
No hard-coded brand dependency.

AC-015
Required tests pass.

AC-016
Browser verification passes where required.

AC-017
Evidence exists for every certification claim.
```

The actual criteria should be generated from repository evidence/contracts, not invented generically.

---

# 15. External AI should receive the canonical references

This is also critical.

If the user selects a new version, Project LLM should provide External AI with:

```text
CANONICAL REFERENCES

Reference implementations:
    I1
    C1
    D1
    ...

Reference files:
    ...
    
Canonical renderer:
    ...

Canonical schemas:
    ...

Canonical Composer registry:
    ...

Canonical tests:
    ...

Canonical runtime contracts:
    ...

Canonical theme mechanism:
    ...
```

So External AI can inspect the **real project implementation**, rather than relying only on a natural-language prompt.

---

# 16. And then the human approves the design

Your intended flow becomes:

```text
USER
Select Family + Version
        │
        ▼
PROJECT LLM
Repository analysis
        │
        ▼
Engineering Contract
        │
        ▼
EXTERNAL AI
        │
        ├── UI/UX
        ├── educational content structure
        └── HTML/CSS/JS/JSON prototype
        │
        ▼
HUMAN
Design approval
        │
        ▼
EXTERNAL AI
        │
        ├── React
        ├── TypeScript
        ├── schema
        ├── registry
        ├── renderer integration
        ├── Composer integration
        └── tests
        │
        ▼
USER
Uploads candidate
        │
        ▼
PROJECT LLM
        │
        ├── Intake
        ├── Classification
        ├── Canonical comparison
        ├── Compliance
        ├── Placement planning
        ├── Human approval
        ├── Repository integration
        ├── Snapshot
        ├── Evidence
        ├── Composer verification
        ├── Runtime verification
        ├── Browser verification
        ├── Brand verification
        ├── Theme verification
        └── Certification
```

This matches the architecture described in the supplied project material. Explain I2 Creation Files

---

# 17. What Project LLM should NOT tell External AI

This is equally important.

Project LLM should **not** say:

```text
"Implement ILS."

"Implement LSNB."

"Implement RSSB."

"Implement SUIA branding."

"Implement RTH branding."

"Create your own navigation."

"Create your own telemetry."

"Create your own Composer."

"Create your own renderer."
```

Instead:

```text
"Integrate with the existing canonical mechanisms."
```

That preserves the architecture.

---

# 18. The three reference blocks should be treated equally

So I would change our terminology from:

> "D1 gives especially strong evidence..."

to:

> **"I1, C1 and D1 collectively establish the current canonical reference pattern."**

For example:

| Capability | I1 | C1 | D1 |
|---|---:|---:|---:|
| Versioned block | ✓ | ✓ | ✓ |
| UBRC identity | ✓ | ✓ | ✓ |
| Theme-driven rendering | ✓ | ✓ | ✓ |
| Brand-independent implementation | ✓ | ✓ | ✓ |
| TutorialBlockRenderer integration | ✓ | ✓ | ✓ |
| Composer integration | ✓ | ✓ | ✓ |
| Passive ILS participation | ✓ | ✓ | ✓ |
| Page-level LSNB/RSSB | ✓ | ✓ | ✓ |
| Runtime verification | ✓ | ✓ | ✓ |
| Structural tests | ✓ | ✓ | ✓ |

**D1 was only singled out because its source comment stated the cross-brand reuse principle unusually explicitly. It was not meant to imply that I1/C1 don't follow it.**

Your correction is right.

---

# 19. This leads to the most important Project LLM design principle

When the user selects:

```text
Family = X
Version = Y
```

Project LLM should **not generate a generic checklist from memory**.

It should perform:

```text
X/Y
 │
 ▼
Repository discovery
 │
 ├── nearest canonical implementations
 ├── family contract
 ├── version contract
 ├── schema
 ├── renderer
 ├── registry
 ├── Composer
 ├── runtime
 ├── ILS
 ├── LSNB
 ├── RSSB
 ├── theme
 ├── tests
 └── evidence requirements
 │
 ▼
VERSION-SPECIFIC ENGINEERING CONTRACT
 │
 ▼
External AI
```

That contract becomes the **source of truth for the candidate implementation**.

Then, when the candidate comes back:

```text
Candidate
   ↓
Project LLM
   ↓
"Does this candidate satisfy the exact contract I issued?"
   ↓
YES / NO / BLOCKED
```

And only after that:

```text
Approved integration
      ↓
Composer
      ↓
TutorialDocument
      ↓
TutorialPageShell
      ↓
Theme
      ↓
ActiveBlockContext
      ↓
ILSProvider
      ↓
LSNB/RSSB page-level systems
      ↓
Learner
```

The supplied material already captures the key idea very well: **Project LLM's candidate specification comes before External AI implementation, and candidate verification comes afterward.** Explain I2 Creation Files

### Bottom line

**Yes — when the user selects a block family and version, Project LLM should generate a complete, version-specific engineering/compliance contract for External AI.**

That contract should cover:

**identity → content/data → UI/UX constraints → schema/types → UBRC → theme → brand independence → ILS compatibility → LSNB compatibility → RSSB compatibility → renderer → registry → Composer → runtime → tests → browser → evidence → acceptance criteria.**

And **I1, C1 and D1 should be treated as the current canonical reference implementations for deriving that contract**, rather than treating D1 as uniquely authoritative.

The only thing Project LLM should *not* do is dictate the creative visual design itself. **User + External AI decide the design; Project LLM defines and enforces the platform/integration contract around that design.** Explain I2 Creation Files

Yes. **That is the correct interpretation**, and it changes an important detail in how we should describe the External AI handoff.

The External AI is **not a member of this project**. It does not know what I1, C1, D1, TutorialBlockRenderer, UBRC, ILS, LSNB, RSSB, Tutorial Composer, the repository structure, or our conventions mean.

Therefore, simply giving it:

> “Use I1/C1/D1 as references”

is **not sufficient**.

Those references are useful **inside Project LLM's reasoning**, but Project LLM must translate what it discovers from those references into an explicit, self-contained implementation specification for External AI.

The project material supports this distinction: Project LLM produces the candidate specification before External AI implementation, while the candidate is later inspected, classified, compared against the repository, placed, and certified by Project LLM. Explain I2 Creation Files

## The correct architecture

It should be:

```text
USER
  │
  │ Selects
  │
  ├── Block Family
  └── Target Version
  │
  ▼
PROJECT LLM
  │
  │ Repository-aware analysis
  │
  ├── Study existing canonical implementations
  │      ├── I1
  │      ├── C1
  │      ├── D1
  │      └── other relevant implementations
  │
  ├── Study canonical contracts
  │
  ├── Study schemas/types
  ├── Study renderer
  ├── Study Composer integration
  ├── Study runtime
  ├── Study ILS
  ├── Study LSNB
  ├── Study RSSB
  ├── Study theme system
  ├── Study tests
  └── Study repository structure
  │
  ▼
SELF-CONTAINED CANDIDATE BLOCK SPECIFICATION
  │
  │ Everything External AI needs
  ▼
EXTERNAL AI
  │
  ├── Design
  ├── UI/UX
  ├── Content structure
  ├── HTML/CSS/JS/JSON prototype
  │
  ▼
HUMAN APPROVAL
  │
  ▼
EXTERNAL AI
  │
  └── React/TypeScript implementation
  │
  ▼
USER UPLOADS CANDIDATE
  │
  ▼
PROJECT LLM
  │
  ├── Intake
  ├── Inspect
  ├── Hash
  ├── Classify
  ├── Compare
  ├── Validate
  ├── Test
  ├── Determine canonical locations
  ├── Create integration/placement manifest
  │
  ▼
HUMAN APPROVAL
  │
  ▼
PROJECT LLM
  │
  ├── Approved placement
  ├── Snapshot
  ├── Evidence
  ├── Composer verification
  ├── Runtime verification
  ├── Browser verification
  ├── ILS verification
  ├── LSNB verification
  ├── RSSB verification
  ├── Brand verification
  ├── Theme verification
  └── Final certification
  │
  ▼
TUTORIAL COMPOSER
  │
  ▼
TUTORIAL PAGE
  │
  ▼
LEARNER
```

That is the architecture I would freeze.

---

# What "I1/C1/D1 reference" actually means

There are **two different audiences**.

### Project LLM

Project LLM understands the repository, so it can inspect:

```text
I1
C1
D1
```

and determine:

> "What common engineering rules make these implementations work correctly?"

For example, it can discover:

```text
I1
 ├── component
 ├── version identity
 ├── schema
 ├── renderer routing
 ├── Composer integration
 ├── UBRC
 ├── theme
 ├── runtime behavior
 └── tests

C1
 ├── component
 ├── version identity
 ├── schema
 ├── renderer routing
 ├── Composer integration
 ├── UBRC
 ├── theme
 ├── runtime behavior
 └── tests

D1
 ├── component
 ├── version identity
 ├── schema
 ├── renderer routing
 ├── Composer integration
 ├── UBRC
 ├── theme
 ├── runtime behavior
 └── tests
```

Then Project LLM extracts the **canonical common contract** plus the **family/version-specific differences**.

### External AI

External AI does **not** need to understand:

> "Go inspect D1."

Instead Project LLM tells it:

> "Here is exactly what you must build."

That is a major responsibility of Project LLM.

---

# So the Compliance Brief should become much more powerful

When the user selects:

```text
Family: Objective
Version: O1
```

Project LLM should generate something approximately like:

## Candidate Block Engineering Contract

```text
TARGET
────────────────────────

Block Family: Objective
Version: O1
Block Type: objective

Purpose:
[repository/user-defined purpose]

Educational role:
[requirements]


IMPLEMENTATION
────────────────────────

You must deliver:

1. React/TypeScript block implementation
2. Required TypeScript types
3. Required authoring/runtime schema
4. Required renderer integration
5. Required Composer registration
6. Required tests
7. Required supporting artifacts discovered from repository


BLOCK IDENTITY
────────────────────────

The implementation MUST expose:

data-block-id
data-block-type="objective"
data-block-version="O1"

using the canonical project mechanism.


RUNTIME
────────────────────────

The block MUST:

- render through the canonical TutorialBlockRenderer
- support the target version
- accept canonical runtime props
- work inside TutorialDocument
- render successfully in TutorialPageShell


ILS
────────────────────────

The block must be compatible with
the project's existing ILS runtime.

The block MUST NOT:

- implement a second ILS system
- call ILS APIs directly unless the canonical
  contract explicitly requires it
- own global learning state
- duplicate telemetry infrastructure

The block must expose the canonical identity
required by the runtime observation system.


LSNB
────────────────────────

The block must be compatible with the
existing page-level LSNB system.

The block MUST NOT implement its own:

- page navigation
- section navigation
- learning progress navigation
- duplicate navigation state


RSSB
────────────────────────

The block must satisfy the applicable
canonical RSSB requirements.

The block MUST NOT duplicate page-level
RSSB behavior.


THEME
────────────────────────

The block must receive theme/configuration
through the canonical project mechanism.

Do not hard-code:

- SUIA branding
- RTH branding
- SUIA colors
- RTH colors
- logos
- brand-specific URLs
- brand-specific assets

The same implementation must be capable
of rendering under supported project themes.


COMPOSER
────────────────────────

The block MUST:

- be registered in the canonical registry
- be discoverable by Tutorial Composer
- be selectable
- be constructable
- produce valid authoring data
- produce valid TutorialDocument data
- resolve through TutorialBlockRenderer
- render in generated tutorials


ACCESSIBILITY / UBRC
────────────────────────

[Exact repository-derived requirements]


TESTS
────────────────────────

Required:

- structural tests
- schema tests
- renderer tests
- Composer tests
- runtime tests
- browser tests where applicable
- brand/theme tests where applicable


ACCEPTANCE
────────────────────────

The candidate is acceptable only if:

AC-001 ...
AC-002 ...
AC-003 ...
...
AC-N ...
```

**That is what External AI actually needs.**

Not "look at I1."

---

# And there is another important distinction

Project LLM should provide **both instructions AND project evidence/context**.

For example:

```text
PROJECT LLM
      │
      ├── Human-readable specification
      │
      ├── Machine-readable contract
      │
      ├── Required artifacts
      │
      ├── Acceptance criteria
      │
      ├── Canonical API/type information
      │
      ├── Required data structures
      │
      ├── Relevant repository snippets/files
      │
      └── Integration requirements
```

That makes the External AI effectively receive a **portable implementation packet**.

It doesn't need prior knowledge of the project.

---

# Then when the candidate comes back, Project LLM reverses the process

This is the really powerful part.

External AI might return:

```text
ObjectiveBlock.tsx
ObjectiveBlock.types.ts
ObjectiveBlock.schema.ts
ObjectiveBlock.test.tsx
...
```

Project LLM does **not** say:

> "Looks good."

It compares the candidate against the contract it originally issued.

```text
              ORIGINAL CONTRACT
                     │
                     │
                     ▼
             CANDIDATE UPLOAD
                     │
                     ▼
             PROJECT LLM AUDIT
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Structure      Contract      Integration
       │             │             │
       ▼             ▼             ▼
     Tests         Runtime       Composer
       │             │             │
       ▼             ▼             ▼
      ILS           LSNB          RSSB
       │             │             │
       └─────────────┼─────────────┘
                     ▼
               BRAND / THEME
                     │
                     ▼
                  EVIDENCE
                     │
                     ▼
              CERTIFICATION
```

The supplied project material describes exactly this distinction between candidate implementation and subsequent Project AI verification/certification. Explain I2 Creation Files

---

# And only Project LLM decides where it goes

This is another place where your architecture is important.

External AI should **not** tell Project LLM:

> "Put this file here."

Project LLM should inspect the repository and determine:

```text
Candidate artifact
       ↓
Semantic role
       ↓
Existing canonical artifact?
       │
       ├── YES → UPDATE / EXTEND / REUSE
       │
       └── NO  → ADD
       ↓
Canonical repository location
       ↓
Placement Manifest
```

The supplied material explicitly describes this Candidate Intake/Placement behavior, including inventory, classification, canonical comparison, duplicate detection, ADD/UPDATE/EXTEND/REUSE/REJECT, placement manifest, approval, placement, and rediscovery. Explain I2 Creation Files

And this is where our **canonical-artifact rule** becomes very important:

> **Project LLM must search existing project artifacts first and extend/update the canonical artifact rather than blindly creating another file.**

---

# Finally, why does this make the new block appear in Tutorial Composer?

Because Project LLM isn't merely copying a `.tsx` file.

It is integrating the **complete block capability**.

Conceptually:

```text
Candidate
   │
   ├── Component
   ├── Type
   ├── Schema
   ├── Renderer
   ├── Registry
   ├── Composer integration
   ├── Tests
   └── Runtime contract
          │
          ▼
     Repository
          │
          ▼
   Tutorial Composer
          │
          ├── discovers block
          ├── displays block
          ├── user selects block
          ├── user configures block
          └── Composer creates TutorialDocument
                         │
                         ▼
                  Tutorial Page
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Theme        LSNB         RSSB
             │
             ▼
        Block Renderer
             │
             ▼
      ActiveBlockContext
             │
             ▼
          ILS
```

So **yes: that is exactly what Project LLM is supposed to accomplish.**

But one wording correction is important:

### Project LLM does not "add ILS, RSSB and LSNB into the block."

It makes the block **compatible with the existing project systems** and verifies that the block participates correctly in them.

The existing architecture should continue to own those responsibilities.

So the desired result is:

> **Create a new block that behaves like the existing canonical I1/C1/D1 implementations, while allowing its own approved UI/UX and educational content, and without hard-coding any particular brand.**

Then Project LLM makes sure that candidate becomes a **real, versioned, Composer-discoverable, runtime-compatible Tutorial Engine block**, rather than just another React component.

That is the core reason Project LLM needs to be repository-aware and why its **Compliance Brief/Engineering Contract is one of its most important outputs**.

Yes. **That is the more precise architectural statement.** I was using the word "compatible" too narrowly.

What you are defining is:

> **A newly created block must follow the same common implementation architecture demonstrated by the canonical I1, C1, and D1 blocks, so that the new block becomes a first-class Tutorial Engine block: brand-aware through the project's theme mechanism, ILS-runtime aware, LSNB-aware, RSSB-aware, Composer-integrated, renderer-integrated, schema-driven, versioned, and runtime-verifiable.**

And because the External AI **knows nothing about this project**, **Project LLM must provide all of the information and instructions necessary for External AI to create that candidate correctly.**

The references I1/C1/D1 are therefore primarily **inputs to Project LLM's analysis**, not instructions that External AI is expected to understand.

---

## The exact responsibility split

### 1. User selects

```text
Block Family: Objective
Version: O1
```

The user also provides the desired educational purpose/content and participates in UI/UX approval.

### 2. Project LLM studies the project

Project LLM examines the actual repository and determines how the existing canonical blocks work:

```text
I1
C1
D1
   │
   ▼
COMMON TUTORIAL BLOCK ARCHITECTURE
```

It extracts the common implementation requirements, including the actual project mechanisms for:

- block identity/versioning
- TypeScript types
- authoring/runtime schema
- theme/brand handling
- renderer routing
- Composer registry
- TutorialBlockRenderer
- UBRC
- ILS runtime participation
- LSNB relationship
- RSSB relationship
- TutorialDocument
- TutorialPageShell
- tests
- runtime/browser behavior
- evidence requirements

The supplied project material explicitly frames I1/C1/D1 as reference implementations and the candidate specification as containing implementation, type definition, schema/data contract, renderer registration, registry, tests, Composer compatibility, runtime compatibility, evidence, and brand independence. Explain I2 Creation Files

---

# 3. Project LLM converts that knowledge into an External AI implementation package

This is the critical point.

External AI should **not receive this:**

> "Create an O1 block similar to I1, C1 and D1."

That would be inadequate.

Instead it receives something like:

```text
PROJECT LLM
CANDIDATE BLOCK IMPLEMENTATION PACKAGE

Target:
    Objective O1

You have no prior knowledge of this repository.
Everything required to implement this block is specified below.

────────────────────────
1. BLOCK CONTRACT
────────────────────────

Block type:
    objective

Version:
    O1

Purpose:
    ...

Required content:
    ...

Required data:
    ...

────────────────────────
2. COMMON TUTORIAL BLOCK ARCHITECTURE
────────────────────────

Your implementation must follow these
project requirements:

[exact repository-derived requirements]

────────────────────────
3. BLOCK IDENTITY
────────────────────────

Required:
    data-block-id
    data-block-type
    data-block-version

Exact expected behavior:
    ...

────────────────────────
4. TYPES
────────────────────────

Required TypeScript structures:
    ...

────────────────────────
5. SCHEMA
────────────────────────

Required authoring schema:
    ...

Required runtime schema:
    ...

────────────────────────
6. THEME / BRAND
────────────────────────

The block must use the project's
canonical theme mechanism.

Do not hard-code a specific brand.

The same implementation must work when
the runtime supplies different supported
brand themes.

────────────────────────
7. ILS
────────────────────────

Follow the project's canonical ILS
participation mechanism:

[exact discovered implementation
requirements]

Do not create a separate ILS system.

────────────────────────
8. LSNB
────────────────────────

Follow the project's canonical LSNB
relationship:

[exact discovered requirements]

────────────────────────
9. RSSB
────────────────────────

Follow the project's canonical RSSB
relationship:

[exact discovered requirements]

────────────────────────
10. RENDERER
────────────────────────

The block must be resolvable through:

TutorialBlockRenderer

Required registration/routing:
    ...

────────────────────────
11. TUTORIAL COMPOSER
────────────────────────

The block must:

    register
    be discoverable
    be selectable
    be constructable
    produce valid configuration
    produce valid TutorialDocument data

Required registry integration:
    ...

────────────────────────
12. RUNTIME
────────────────────────

The block must render correctly through
the existing Tutorial Engine runtime.

Required runtime integration:
    ...

────────────────────────
13. TESTS
────────────────────────

Required:
    ...

────────────────────────
14. ACCEPTANCE CRITERIA
────────────────────────

AC-001 ...
AC-002 ...
AC-003 ...
...
```

**That is what makes the External AI capable of working even though it has zero prior knowledge of our project.**

---

# 4. External AI creates the candidate

External AI receives that complete package and does:

```text
Project LLM specification
        │
        ▼
External AI
        │
        ├── UI/UX design
        ├── educational content implementation
        ├── HTML/CSS/JS/JSON prototype
        │
        ▼
Human approval
        │
        ▼
External AI
        │
        ├── React
        ├── TypeScript
        ├── schema
        ├── types
        ├── renderer integration
        ├── registry integration
        ├── Composer integration
        └── tests
        │
        ▼
Candidate Block Package
```

The External AI is **the implementation worker**.

It does not need to understand the entire project architecture beforehand because Project LLM has translated the repository architecture into its implementation contract.

---

# 5. Then Project LLM becomes the verifier

The candidate comes back to Project LLM.

Project LLM now has something very powerful:

```text
ORIGINAL CONTRACT
       │
       │
       ▼
CANDIDATE
       │
       ▼
COMPARISON
```

It can ask:

### Did External AI implement the required architecture?

```text
✓ Correct family
✓ Correct version
✓ Correct block identity
✓ Correct types
✓ Correct schema
✓ Correct renderer integration
✓ Correct Composer integration
✓ Correct theme integration
✓ Correct ILS participation
✓ Correct LSNB relationship
✓ Correct RSSB relationship
✓ Correct runtime behavior
✓ Required tests
```

If something is missing:

```text
BLOCKED

Missing:
    Composer registry integration

Evidence:
    ...
```

It does **not** certify the candidate simply because the code looks good.

---

# 6. Then Project LLM determines where the implementation belongs

This is also critical.

External AI might return:

```text
ObjectiveBlock.tsx
ObjectiveBlock.schema.ts
ObjectiveBlock.types.ts
ObjectiveBlock.test.tsx
...
```

Project LLM determines:

```text
Candidate files
       │
       ▼
Repository discovery
       │
       ▼
Canonical artifacts
       │
       ├── existing?
       │
       ├── extend?
       │
       ├── update?
       │
       └── add?
       │
       ▼
Placement Manifest
       │
       ▼
Human approval
       │
       ▼
Approved repository placement
```

This follows the intended Candidate Intake/Placement model in the project material. Explain I2 Creation Files

---

# 7. After placement, Project LLM verifies the actual project integration

This is where the candidate becomes a **real Tutorial Engine block**, not just a candidate file.

Project LLM should verify the actual chain:

```text
                    NEW BLOCK
                        │
                        ▼
                 Canonical Registry
                        │
                        ▼
              TutorialBlockRenderer
                        │
                        ▼
               Tutorial Composer
                        │
                        ▼
                  Selectable
                        │
                        ▼
                 Constructable
                        │
                        ▼
                TutorialDocument
                        │
                        ▼
                TutorialPageShell
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
            Theme      LSNB      RSSB
              │
              ▼
        Block rendering
              │
              ▼
       ActiveBlockContext
              │
              ▼
           ILS runtime
              │
              ▼
            Learner
```

The candidate therefore doesn't merely "support ILS."

It is **implemented according to the same common architecture that allows the existing canonical blocks to participate in the project's ILS/runtime, theme, Composer, LSNB and RSSB ecosystem.**

---

# 8. One terminology correction I recommend we make permanently

Instead of saying:

> "Make the new block compatible with I1/C1/D1."

we should say:

> **"Implement the new block according to the common canonical Tutorial Block architecture established by the project's verified I1, C1 and D1 implementations."**

And then:

> **"Project LLM must discover that architecture from the repository and translate it into a complete, self-contained implementation contract for External AI."**

That is much more accurate.

---

# 9. And the final outcome is exactly what you described

The whole system becomes:

```text
USER
Select Family + Version
        │
        ▼
PROJECT LLM
        │
        │ studies I1/C1/D1 + repository
        ▼
COMMON CANONICAL BLOCK ARCHITECTURE
        │
        ▼
VERSION-SPECIFIC IMPLEMENTATION CONTRACT
        │
        │ contains everything External AI needs
        ▼
EXTERNAL AI
        │
        │ creates candidate
        ▼
USER UPLOADS CANDIDATE
        │
        ▼
PROJECT LLM
        │
        ├── inspect
        ├── classify
        ├── compare
        ├── validate
        ├── test
        ├── determine canonical placement
        ├── integration plan
        │
        ▼
HUMAN APPROVAL
        │
        ▼
PROJECT LLM
        │
        ├── place implementation
        ├── rediscover repository
        ├── create snapshot
        ├── collect evidence
        ├── verify Composer
        ├── verify renderer
        ├── verify runtime
        ├── verify ILS
        ├── verify LSNB
        ├── verify RSSB
        ├── verify theme/brand
        ├── browser verification
        └── final certification
        │
        ▼
TUTORIAL COMPOSER
        │
        ▼
NEW BLOCK AVAILABLE
        │
        ▼
TUTORIAL PAGE
        │
        ▼
LEARNER
```

So **yes, this is the responsibility we should assign to Project LLM**.

The important conceptual boundary is:

**User + External AI create the educational concept and visual implementation.**

**Project LLM supplies the project-specific engineering knowledge that External AI does not have, verifies the resulting candidate against that knowledge, integrates it into the canonical repository, and certifies that it has actually become a first-class Tutorial Engine block.**

And **I1, C1, D1 are not instructions to External AI**. They are **repository evidence from which Project LLM learns the common implementation architecture and then produces explicit instructions that External AI can actually understand and execute.**