Yes — **that is the intended end state**. But one distinction is important:

**The architecture we designed will achieve that workflow after M2.3–M2.8, multi-agent orchestration, governance, Candidate Block certification, and the I2 workflow are actually implemented. It does not mean the repository has that capability today.** The current status still has M2.3–M2.8, multi-agent orchestration, approval/gating, Candidate Block certification, and I2 workflow pending. Explain I2 Creation Files

The end goal is exactly:

> **External AI creates the HTML/CSS/JS/JSON concept → Project LLM analyzes it → Project LLM tells External AI exactly what TypeScript/React/Next.js files/contracts are required → External AI implements → Project LLM verifies everything → candidate becomes selectable in Tutorial Composer → runtime/browser verifies it → only then is it certified and usable.**

And importantly, **Project LLM does not blindly trust External AI's implementation**. Implementation ≠ certification. Explain I2 Creation Files

---

# 1. What you will ultimately be able to do from the browser

Imagine you open:

```text
https://your-project-ai-domain/
```

and see:

```text
┌───────────────────────────────────────────────────────┐
│                 PROJECT AI                            │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Create / Manage Tutorial Block                       │
│                                                       │
│  Block Family:     [ Introduction        ▼ ]          │
│  Target Version:   [ I2                   ▼ ]          │
│                                                       │
│  Creation Mode:                                      │
│    ○ I2 only                                          │
│    ○ Mix & Match existing versions                    │
│    ○ New Candidate Block                              │
│                                                       │
│  [ Analyze Repository ]                               │
│                                                       │
└───────────────────────────────────────────────────────┘
```

You can say:

> "I want Introduction I2."

or:

> "I want I2 using the existing I1 hero treatment, I2 content structure, and the existing reusable media behavior."

Project AI then performs the repository/evidence analysis.

---

# 2. The first thing Project LLM does

It does **not immediately generate code**.

It first asks:

```text
What already exists?
```

The workflow is:

```text
Browser
   │
   ▼
Project AI
   │
   ▼
Current Repository Snapshot
   │
   ▼
Evidence Graph
   │
   ├── Introduction I1
   ├── Introduction existing versions
   ├── Block registry
   ├── Renderer
   ├── Composer
   ├── Tests
   ├── Runtime routes
   └── Dependencies
```

The deterministic TypeScript/Node layer remains responsible for discovering those facts, while Python/FastAPI performs orchestration and reasoning. That boundary is fundamental to the architecture. Explain I2 Creation Files

---

# 3. Browser screen: Repository Analysis

Project AI could show:

```text
INTRODUCTION FAMILY ANALYSIS

Current versions
────────────────────────────────────
I1          ✓ Certified
I2          Not implemented
I2-Candidate  Not certified

Existing capabilities
────────────────────────────────────
✓ Introduction contract
✓ Introduction registry
✓ Tutorial renderer
✓ Composer integration
✓ Runtime route
✓ Tests
✓ Evidence

Missing for I2
────────────────────────────────────
⚠ New implementation
⚠ Version registration
⚠ Renderer compatibility
⚠ Composer configuration
⚠ Runtime verification
⚠ Browser verification
```

Now the system knows the **delta** rather than blindly asking an AI to recreate Introduction from scratch.

---

# 4. If you have HTML/CSS/JS/JSON from External AI

This is where your proposed workflow becomes particularly powerful.

You could upload/provide:

```text
introduction-i2/
    concept.html
    concept.css
    concept.js
    content.json
```

The browser might show:

```text
EXTERNAL AI CONCEPT

HTML     ✓
CSS      ✓
JS       ✓
JSON     ✓

[ Analyze Candidate ]
```

Project AI analyzes the concept.

---

# 5. Project AI converts the concept into a Candidate Block specification

It doesn't simply say:

> "Looks good."

Instead:

```text
CANDIDATE BLOCK SPECIFICATION
────────────────────────────────────

Family:
Introduction

Target:
I2

Implementation:
React / TypeScript / TSX

Required:
✓ React component
✓ Type definition
✓ Data contract
✓ Registry entry
✓ Renderer registration
✓ Block version
✓ Composer compatibility
✓ Tests
✓ Runtime compatibility
✓ Evidence
✓ Brand independence

Existing artifacts reusable:
✓ Introduction contract
✓ Base renderer
✓ Composer infrastructure
✓ Shared media component

New artifacts required:
• IntroductionI2.tsx
• IntroductionI2.test.tsx
• I2 registry/version entry

Existing artifacts to extend:
• Introduction registry
• Introduction block contract
• Composer configuration
```

This is exactly the purpose of the Candidate Block specification: determine the required implementation, contracts, integrations, tests, runtime requirements, evidence, and brand-independence requirements before implementation. Explain I2 Creation Files

---

# 6. And this is where your "don't create unnecessary MD files" rule matters

Project AI should **not** respond:

```text
Created:

I2-plan.md
I2-spec.md
I2-checklist.md
I2-agent-notes.md
I2-verification.md
I2-final.md
```

Instead:

```text
Search existing artifacts
       ↓
Find canonical artifact
       ↓
Extend canonical artifact
       ↓
Record I2 requirements
```

That global policy applies to the Project AI agents.

So the browser could show:

```text
Documentation impact

Canonical artifacts to update:

✓ Block Corpus Registry
✓ M2 backlog / project task artifact
✓ Existing Introduction documentation

New documentation:
None required
```

That is a major architectural advantage.

---

# 7. Then Project AI gives External AI the implementation contract

This is the key interaction.

Project AI generates something conceptually like:

```text
IMPLEMENTATION CONTRACT

Create:

1. IntroductionI2.tsx

Requirements:
- React component
- TypeScript strict mode
- receives IntroductionI2Data
- no brand-specific constants
- use canonical theme tokens
- expose required block metadata

2. IntroductionI2Data.ts

Requirements:
- conform to canonical Introduction data contract

3. Registry update

Requirements:
- register Introduction/I2
- preserve existing I1 registration

4. Renderer update

Requirements:
- resolve Introduction/I2
- preserve I1 behavior

5. Composer integration

Requirements:
- I2 must appear in Introduction block selection

6. Tests

Requirements:
- component test
- contract test
- registry test
- Composer test

7. Runtime

Requirements:
- data-block-version="I2"
- render successfully in tutorial runtime
```

External AI now has a **repository-aware implementation specification**.

---

# 8. Human approval happens here

This is an important control point.

Browser:

```text
┌──────────────────────────────────────────┐
│        I2 IMPLEMENTATION PLAN            │
├──────────────────────────────────────────┤
│                                          │
│ Files to modify:       5                 │
│ Files to create:      2                  │
│ Tests required:       7                  │
│ Composer changes:     1                  │
│ Runtime verification: YES                │
│ Brand independence:   YES                │
│                                          │
│ Evidence references:   23                │
│                                          │
│ [ Reject ]       [ Approve ]             │
└──────────────────────────────────────────┘
```

You click:

**Approve**

Only now:

```text
WAITING_FOR_APPROVAL
       ↓
IMPLEMENTING
```

The workflow explicitly separates AI planning from approval and implementation from certification. Explain I2 Creation Files

---

# 9. External AI implements the React/TypeScript candidate

External AI now creates/modifies the required files.

For example:

```text
components/
└── tutorial/
    └── blocks/
        └── introduction/
            ├── IntroductionI1.tsx
            ├── IntroductionI2.tsx
            ├── Introduction.types.ts
            └── IntroductionI2.test.tsx
```

But the important thing is:

**Project AI does not assume this is correct merely because the files exist.**

---

# 10. Project AI starts certification

Now the multi-agent workflow activates.

```text
                 I2 Candidate
                     │
                     ▼
             ┌───────────────┐
             │ Agent 01      │
             │ Repository    │
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ Agent 06      │
             │ Evidence      │
             └───────┬───────┘
                     ▼
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Contract        UBRC         Composer
    Agent          Agent         Agent
       │             │             │
       └─────────────┼─────────────┘
                     ▼
              Runtime Agent
                     │
                     ▼
               Test Agent
                     │
                     ▼
            Certification Agent
```

---

# 11. First check — TypeScript/React contract

Project AI verifies:

```text
IntroductionI2.tsx
        ↓
IntroductionI2Data
        ↓
canonical contract
```

It checks:

```text
✓ TypeScript
✓ Props
✓ Data contract
✓ Required fields
✓ Version
✓ No invalid assumptions
```

If it fails:

```text
❌ BLOCKED

INTRODUCTION_I2_CONTRACT_MISMATCH
```

External AI gets the exact failure and can correct it.

---

# 12. Second check — ILS runtime

The block must satisfy the repository's canonical ILS requirements.

Project AI should not hallucinate what ILS means.

Instead:

```text
Canonical ILS requirements
          ↓
Candidate I2
          ↓
Compatibility checks
          ↓
Evidence
```

Result:

```text
ILS Runtime

✓ Requirement ILS-001
✓ Requirement ILS-002
✓ Requirement ILS-003
✓ Runtime compatibility

ILS STATUS: PASS
```

---

# 13. Third check — LSNB

Same model:

```text
Canonical LSNB requirements
          ↓
Introduction I2
          ↓
Validation
```

Result:

```text
LSNB

✓ Structural requirements
✓ Naming requirements
✓ Block contract
✓ Integration requirements

LSNB STATUS: PASS
```

The important point is that the exact LSNB/RSSB rules come from canonical repository documentation/contracts rather than being invented by the LLM. Explain I2 Creation Files

---

# 14. Fourth check — RSSB

Same:

```text
RSSB requirements
       ↓
Candidate
       ↓
Validation
       ↓
Evidence
```

```text
RSSB STATUS: PASS
```

---

# 15. Fifth check — UBRC

This is particularly important.

Project AI checks:

```text
Introduction I2
      │
      ▼
Introduction block type
      │
      ▼
Registry
      │
      ▼
Renderer
      │
      ▼
data-block-version="I2"
      │
      ▼
Runtime
```

For example:

```text
UBRC

✓ Block type exists
✓ Registry entry exists
✓ Registry points to I2
✓ Renderer resolves I2
✓ Version is I2
✓ Runtime version matches

UBRC: PASS
```

The architecture explicitly treats renderer existence alone as insufficient; the complete chain has to be verified. Explain I2 Creation Files

---

# 16. Sixth check — Tutorial Composer

This is one of the most important parts of your objective.

Project AI opens the actual Composer workflow.

Not just:

```text
registry contains I2
```

It verifies:

```text
Registry
   ↓
Composer
   ↓
Introduction
   ↓
I2
```

Browser:

```text
┌────────────────────────────────────────────┐
│              TUTORIAL COMPOSER             │
├────────────────────────────────────────────┤
│                                            │
│ Block Type                                 │
│                                            │
│ [ Introduction ▼ ]                         │
│                                            │
│ Version                                    │
│                                            │
│ [ I1 ▼ ]                                   │
│                                            │
│             ┌──────────────┐               │
│             │     I2       │ ← MUST EXIST  │
│             └──────────────┘               │
│                                            │
└────────────────────────────────────────────┘
```

Project AI selects:

```text
Introduction
→ I2
```

and verifies it can actually be used.

---

# 17. Then it constructs a real tutorial

This is where the workflow becomes much stronger than static testing.

Project AI could create a temporary verification tutorial:

```text
Tutorial
 ├── Introduction I2
 ├── Explanation
 ├── Example
 └── Summary
```

Then:

```text
Composer
   ↓
Save Draft
   ↓
Generate Tutorial
   ↓
Render Tutorial
   ↓
Browser
```

---

# 18. Browser verification

Playwright/browser agent opens the actual tutorial page.

For example:

```text
/tutorial/verification/i2
```

It checks:

```text
✓ Page loads
✓ Introduction I2 exists
✓ Correct renderer used
✓ data-block-version="I2"
✓ Expected content visible
✓ No runtime errors
✓ No console errors
✓ Required CSS loaded
✓ Required assets loaded
```

The runtime verification model stores:

```text
expected
observed
passed
evidenceIds
```

so the system can explain *why* the runtime passed. Explain I2 Creation Files

---

# 19. Brand independence verification

Now Project AI checks whether I2 is actually reusable.

It searches for things like:

```text
hard-coded brand colors
hard-coded logo
brand-specific URLs
brand-specific image
brand-specific typography
brand-specific copy
brand-specific IDs
```

For example:

```text
BRAND INDEPENDENCE

✓ No hard-coded logo
✓ No hard-coded brand URL
✓ Theme tokens used
✓ Content supplied through data
✓ Assets configurable
✓ Typography uses platform tokens

BRAND INDEPENDENCE: PASS
```

That is a formal certification criterion, not merely an LLM opinion. Explain I2 Creation Files

---

# 20. Final I2 certification screen

You could ultimately see:

```text
┌────────────────────────────────────────────────────┐
│              INTRODUCTION I2                       │
│              CERTIFICATION                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ Implementation              ✓ PASS                │
│ Type Contract               ✓ PASS                │
│ Data Contract               ✓ PASS                │
│ ILS Runtime                 ✓ PASS                │
│ LSNB                        ✓ PASS                │
│ RSSB                        ✓ PASS                │
│ UBRC                        ✓ PASS                │
│ Registry                    ✓ PASS                │
│ Renderer                    ✓ PASS                │
│ Tutorial Composer           ✓ PASS                │
│ Tests                       ✓ PASS                │
│ Browser Runtime             ✓ PASS                │
│ Evidence                    ✓ PASS                │
│ Brand Independence          ✓ PASS                │
│                                                    │
│ ───────────────────────────────────────────────── │
│                                                    │
│             🟢 I2 CERTIFIED                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

Only after this should it become a normal selectable production block.

---

# 21. Now the important part: I2-only vs Mix & Match

These are **two different workflows**, and Project LLM should support both.

---

## Mode A — I2 only

You say:

> "Create Introduction I2."

Project AI interprets:

```text
Introduction
    │
    └── I2
```

It analyzes the existing Introduction family and determines what I2 requires.

Then:

```text
Existing Introduction architecture
             ↓
I2 specification
             ↓
External AI implementation
             ↓
Verification
             ↓
I2 certification
```

The result is:

```text
Introduction I2
```

---

# 22. Mode B — Mix & Match

This is more interesting.

Suppose you have:

```text
I1
 ├── layout A
 ├── hero A
 └── media A

I2
 ├── layout B
 ├── hero B
 └── media B

I3
 ├── layout C
 ├── hero C
 └── media C
```

You might request:

> "Create an Introduction version using I2's structure, I1's media treatment, and the new HTML concept's hero."

Project AI should **not simply concatenate files**.

It should decompose the request into capabilities.

For example:

```text
INTRODUCTION MIX & MATCH

Base:
I2

Selected capabilities:
──────────────────────────────
Structure       → I2
Hero            → New Candidate
Media           → I1
Footer          → I2
Responsive      → Canonical
Theme           → Canonical
Data Contract   → Canonical
```

---

# 23. Project AI determines compatibility

This is where the evidence graph and dependency graph become extremely important.

It asks:

```text
Can I1 media be used with I2 structure?
```

Then:

```text
I1 Media
    ↓
dependencies
    ↓
data contract
    ↓
renderer
    ↓
I2 structure
```

Possible result:

```text
✓ Compatible
```

Or:

```text
❌ Incompatible

Reason:
I1 media requires MediaDataV1
I2 requires MediaDataV2

Migration required.
```

That is precisely the kind of reasoning the completed dependency/evidence graph is intended to enable.

---

# 24. Mix & Match should generate a composition specification

For example:

```json
{
  "family": "Introduction",
  "targetVersion": "I2-custom",
  "base": "I2",
  "components": {
    "structure": "I2",
    "hero": "candidate",
    "media": "I1",
    "footer": "I2"
  },
  "requiredChecks": [
    "ILS",
    "LSNB",
    "RSSB",
    "UBRC",
    "COMPOSER",
    "RUNTIME",
    "BRAND_INDEPENDENCE"
  ]
}
```

The exact schema can evolve, but conceptually this is what you want.

---

# 25. Then External AI gets the mix-and-match contract

Instead of:

> "Build whatever looks like this."

External AI gets:

```text
BASE:
Introduction I2

REUSE:
Introduction I1 media implementation

NEW:
Hero implementation from supplied HTML/CSS/JS concept

DO NOT MODIFY:
Canonical Introduction data contract

MUST UPDATE:
Introduction registry
Renderer compatibility

MUST VERIFY:
ILS
LSNB
RSSB
UBRC
Composer
Runtime
Brand independence
```

This sharply reduces AI-generated architectural drift.

---

# 26. The browser journey for Mix & Match

From the user's perspective:

```text
PROJECT AI
   │
   ▼
Create Block
   │
   ▼
Introduction
   │
   ▼
Creation Mode
   │
   ├───────────────┐
   │               │
   ▼               ▼
I2 Only        Mix & Match
                   │
                   ▼
             Select Base
                   │
                   ▼
                  I2
                   │
                   ▼
           Select Components
                   │
        ┌──────────┼───────────┐
        ▼          ▼           ▼
      Hero       Media       Layout
       I2         I1          I2
        │          │           │
        └──────────┼───────────┘
                   ▼
             Compatibility
                 Check
                   │
                   ▼
             Specification
                   │
                   ▼
             Human Approval
                   │
                   ▼
             External AI
                   │
                   ▼
              React/TS
                   │
                   ▼
          Project AI Validation
                   │
                   ▼
               Composer
                   │
                   ▼
               Browser
                   │
                   ▼
            Certification
```

---

# 27. And then the candidate becomes available in Composer

This is the final experience you specifically asked for.

After certification:

```text
Tutorial Composer
      │
      ▼
Introduction
      │
      ├── I1
      ├── I2
      └── I2-CUSTOM ✓
```

Then you can actually use:

```text
Introduction I2-CUSTOM
```

while constructing a tutorial.

The candidate is not considered "done" simply because the component is in the repository. It must pass the complete path:

```text
Candidate
 → Registry
 → Renderer
 → Composer
 → Generated Tutorial
 → Runtime
 → Browser
 → Certification
```

That is the intended Composer certification model. Explain I2 Creation Files

---

# 28. The whole journey in one picture

The complete future system is therefore:

```text
                    YOU
                     │
                     ▼
             PROJECT AI BROWSER
                     │
          ┌──────────┴──────────┐
          │                     │
      I2 ONLY              MIX & MATCH
          │                     │
          └──────────┬──────────┘
                     ▼
             REPOSITORY ANALYSIS
                     │
                     ▼
            SNAPSHOT + EVIDENCE
                     │
                     ▼
          EXISTING BLOCK ANALYSIS
                     │
                     ▼
          CANDIDATE SPECIFICATION
                     │
                     ▼
               HUMAN APPROVAL
                     │
                     ▼
                EXTERNAL AI
                     │
             HTML/CSS/JS/JSON
                     │
                     ▼
             React/TypeScript
                     │
                     ▼
        ┌────────────────────────┐
        │ PROJECT AI VALIDATION  │
        ├────────────────────────┤
        │ Contract               │
        │ ILS                    │
        │ LSNB                   │
        │ RSSB                   │
        │ UBRC                   │
        │ Registry               │
        │ Renderer               │
        │ Composer               │
        │ Tests                  │
        │ Runtime                │
        │ Browser                │
        │ Evidence               │
        │ Brand Independence     │
        └───────────┬────────────┘
                    │
                    ▼
             CERTIFICATION
                    │
                    ▼
          TUTORIAL COMPOSER
                    │
                    ▼
             SELECT I2 / CUSTOM
                    │
                    ▼
             BUILD TUTORIAL
                    │
                    ▼
              RENDER PAGE
                    │
                    ▼
             BROWSER VERIFY
                    │
                    ▼
             PRODUCTION READY
```

---

# 29. So, specifically, does this achieve your original objective?

**Yes.**

Your original objective can be expressed as this final contract:

```text
External AI
    ↓
HTML/CSS/JS/JSON concept
    ↓
Project LLM
    ↓
Repository-aware analysis
    ↓
"Here are the prerequisites and implementation requirements"
    ↓
Human approval
    ↓
External AI
    ↓
React / TypeScript / TSX implementation
    ↓
Project LLM
    ↓
ILS verification
    ↓
LSNB verification
    ↓
RSSB verification
    ↓
UBRC verification
    ↓
Registry verification
    ↓
Renderer verification
    ↓
Tutorial Composer verification
    ↓
Automated tutorial generation
    ↓
Browser/runtime verification
    ↓
Evidence verification
    ↓
Brand-independence verification
    ↓
CERTIFIED CANDIDATE BLOCK
    ↓
Visible/selectable in Tutorial Composer
    ↓
Available for tutorial-page implementation
```

And for **I2**, you have two legitimate modes:

### I2-only

```text
Existing Introduction family
          ↓
       I2 design
          ↓
     I2 candidate
          ↓
       certify
          ↓
      Composer
```

### I2 Mix & Match

```text
I2 base
 +
I1/I2/I3 reusable capabilities
 +
new External AI concept
          ↓
Project AI compatibility analysis
          ↓
Composite specification
          ↓
External AI implementation
          ↓
full certification
          ↓
Custom I2 available in Composer
```

The latter is the more powerful long-term capability because **Project AI becomes the compatibility/governance layer between reusable block versions**, rather than forcing you to manually determine whether pieces from different versions can safely coexist.

The current repository, however, is **not yet at that browser-driven end state**: M2.3–M2.8 and the later Candidate Block/I2 workflow still need implementation. Explain I2 Creation Files

**Therefore, the correct next step is not to manually implement I2 yet.** We should first complete **M2.3 → M2.7**, certify the deterministic evidence foundation, then implement **M2.8 FastAPI + the multi-agent browser workflow**, and only then build the I2/Candidate Block experience on top of it. Explain I2 Creation Files

Yes — **that is the intended end state**. But one distinction is important:

**The architecture we designed will achieve that workflow after M2.3–M2.8, multi-agent orchestration, governance, Candidate Block certification, and the I2 workflow are actually implemented. It does not mean the repository has that capability today.** The current status still has M2.3–M2.8, multi-agent orchestration, approval/gating, Candidate Block certification, and I2 workflow pending. Explain I2 Creation Files

The end goal is exactly:

> **External AI creates the HTML/CSS/JS/JSON concept → Project LLM analyzes it → Project LLM tells External AI exactly what TypeScript/React/Next.js files/contracts are required → External AI implements → Project LLM verifies everything → candidate becomes selectable in Tutorial Composer → runtime/browser verifies it → only then is it certified and usable.**

And importantly, **Project LLM does not blindly trust External AI's implementation**. Implementation ≠ certification. Explain I2 Creation Files

---

# 1. What you will ultimately be able to do from the browser

Imagine you open:

```text
https://your-project-ai-domain/
```

and see:

```text
┌───────────────────────────────────────────────────────┐
│                 PROJECT AI                            │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Create / Manage Tutorial Block                       │
│                                                       │
│  Block Family:     [ Introduction        ▼ ]          │
│  Target Version:   [ I2                   ▼ ]          │
│                                                       │
│  Creation Mode:                                      │
│    ○ I2 only                                          │
│    ○ Mix & Match existing versions                    │
│    ○ New Candidate Block                              │
│                                                       │
│  [ Analyze Repository ]                               │
│                                                       │
└───────────────────────────────────────────────────────┘
```

You can say:

> "I want Introduction I2."

or:

> "I want I2 using the existing I1 hero treatment, I2 content structure, and the existing reusable media behavior."

Project AI then performs the repository/evidence analysis.

---

# 2. The first thing Project LLM does

It does **not immediately generate code**.

It first asks:

```text
What already exists?
```

The workflow is:

```text
Browser
   │
   ▼
Project AI
   │
   ▼
Current Repository Snapshot
   │
   ▼
Evidence Graph
   │
   ├── Introduction I1
   ├── Introduction existing versions
   ├── Block registry
   ├── Renderer
   ├── Composer
   ├── Tests
   ├── Runtime routes
   └── Dependencies
```

The deterministic TypeScript/Node layer remains responsible for discovering those facts, while Python/FastAPI performs orchestration and reasoning. That boundary is fundamental to the architecture. Explain I2 Creation Files

---

# 3. Browser screen: Repository Analysis

Project AI could show:

```text
INTRODUCTION FAMILY ANALYSIS

Current versions
────────────────────────────────────
I1          ✓ Certified
I2          Not implemented
I2-Candidate  Not certified

Existing capabilities
────────────────────────────────────
✓ Introduction contract
✓ Introduction registry
✓ Tutorial renderer
✓ Composer integration
✓ Runtime route
✓ Tests
✓ Evidence

Missing for I2
────────────────────────────────────
⚠ New implementation
⚠ Version registration
⚠ Renderer compatibility
⚠ Composer configuration
⚠ Runtime verification
⚠ Browser verification
```

Now the system knows the **delta** rather than blindly asking an AI to recreate Introduction from scratch.

---

# 4. If you have HTML/CSS/JS/JSON from External AI

This is where your proposed workflow becomes particularly powerful.

You could upload/provide:

```text
introduction-i2/
    concept.html
    concept.css
    concept.js
    content.json
```

The browser might show:

```text
EXTERNAL AI CONCEPT

HTML     ✓
CSS      ✓
JS       ✓
JSON     ✓

[ Analyze Candidate ]
```

Project AI analyzes the concept.

---

# 5. Project AI converts the concept into a Candidate Block specification

It doesn't simply say:

> "Looks good."

Instead:

```text
CANDIDATE BLOCK SPECIFICATION
────────────────────────────────────

Family:
Introduction

Target:
I2

Implementation:
React / TypeScript / TSX

Required:
✓ React component
✓ Type definition
✓ Data contract
✓ Registry entry
✓ Renderer registration
✓ Block version
✓ Composer compatibility
✓ Tests
✓ Runtime compatibility
✓ Evidence
✓ Brand independence

Existing artifacts reusable:
✓ Introduction contract
✓ Base renderer
✓ Composer infrastructure
✓ Shared media component

New artifacts required:
• IntroductionI2.tsx
• IntroductionI2.test.tsx
• I2 registry/version entry

Existing artifacts to extend:
• Introduction registry
• Introduction block contract
• Composer configuration
```

This is exactly the purpose of the Candidate Block specification: determine the required implementation, contracts, integrations, tests, runtime requirements, evidence, and brand-independence requirements before implementation. Explain I2 Creation Files

---

# 6. And this is where your "don't create unnecessary MD files" rule matters

Project AI should **not** respond:

```text
Created:

I2-plan.md
I2-spec.md
I2-checklist.md
I2-agent-notes.md
I2-verification.md
I2-final.md
```

Instead:

```text
Search existing artifacts
       ↓
Find canonical artifact
       ↓
Extend canonical artifact
       ↓
Record I2 requirements
```

That global policy applies to the Project AI agents.

So the browser could show:

```text
Documentation impact

Canonical artifacts to update:

✓ Block Corpus Registry
✓ M2 backlog / project task artifact
✓ Existing Introduction documentation

New documentation:
None required
```

That is a major architectural advantage.

---

# 7. Then Project AI gives External AI the implementation contract

This is the key interaction.

Project AI generates something conceptually like:

```text
IMPLEMENTATION CONTRACT

Create:

1. IntroductionI2.tsx

Requirements:
- React component
- TypeScript strict mode
- receives IntroductionI2Data
- no brand-specific constants
- use canonical theme tokens
- expose required block metadata

2. IntroductionI2Data.ts

Requirements:
- conform to canonical Introduction data contract

3. Registry update

Requirements:
- register Introduction/I2
- preserve existing I1 registration

4. Renderer update

Requirements:
- resolve Introduction/I2
- preserve I1 behavior

5. Composer integration

Requirements:
- I2 must appear in Introduction block selection

6. Tests

Requirements:
- component test
- contract test
- registry test
- Composer test

7. Runtime

Requirements:
- data-block-version="I2"
- render successfully in tutorial runtime
```

External AI now has a **repository-aware implementation specification**.

---

# 8. Human approval happens here

This is an important control point.

Browser:

```text
┌──────────────────────────────────────────┐
│        I2 IMPLEMENTATION PLAN            │
├──────────────────────────────────────────┤
│                                          │
│ Files to modify:       5                 │
│ Files to create:      2                  │
│ Tests required:       7                  │
│ Composer changes:     1                  │
│ Runtime verification: YES                │
│ Brand independence:   YES                │
│                                          │
│ Evidence references:   23                │
│                                          │
│ [ Reject ]       [ Approve ]             │
└──────────────────────────────────────────┘
```

You click:

**Approve**

Only now:

```text
WAITING_FOR_APPROVAL
       ↓
IMPLEMENTING
```

The workflow explicitly separates AI planning from approval and implementation from certification. Explain I2 Creation Files

---

# 9. External AI implements the React/TypeScript candidate

External AI now creates/modifies the required files.

For example:

```text
components/
└── tutorial/
    └── blocks/
        └── introduction/
            ├── IntroductionI1.tsx
            ├── IntroductionI2.tsx
            ├── Introduction.types.ts
            └── IntroductionI2.test.tsx
```

But the important thing is:

**Project AI does not assume this is correct merely because the files exist.**

---

# 10. Project AI starts certification

Now the multi-agent workflow activates.

```text
                 I2 Candidate
                     │
                     ▼
             ┌───────────────┐
             │ Agent 01      │
             │ Repository    │
             └───────┬───────┘
                     ▼
             ┌───────────────┐
             │ Agent 06      │
             │ Evidence      │
             └───────┬───────┘
                     ▼
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Contract        UBRC         Composer
    Agent          Agent         Agent
       │             │             │
       └─────────────┼─────────────┘
                     ▼
              Runtime Agent
                     │
                     ▼
               Test Agent
                     │
                     ▼
            Certification Agent
```

---

# 11. First check — TypeScript/React contract

Project AI verifies:

```text
IntroductionI2.tsx
        ↓
IntroductionI2Data
        ↓
canonical contract
```

It checks:

```text
✓ TypeScript
✓ Props
✓ Data contract
✓ Required fields
✓ Version
✓ No invalid assumptions
```

If it fails:

```text
❌ BLOCKED

INTRODUCTION_I2_CONTRACT_MISMATCH
```

External AI gets the exact failure and can correct it.

---

# 12. Second check — ILS runtime

The block must satisfy the repository's canonical ILS requirements.

Project AI should not hallucinate what ILS means.

Instead:

```text
Canonical ILS requirements
          ↓
Candidate I2
          ↓
Compatibility checks
          ↓
Evidence
```

Result:

```text
ILS Runtime

✓ Requirement ILS-001
✓ Requirement ILS-002
✓ Requirement ILS-003
✓ Runtime compatibility

ILS STATUS: PASS
```

---

# 13. Third check — LSNB

Same model:

```text
Canonical LSNB requirements
          ↓
Introduction I2
          ↓
Validation
```

Result:

```text
LSNB

✓ Structural requirements
✓ Naming requirements
✓ Block contract
✓ Integration requirements

LSNB STATUS: PASS
```

The important point is that the exact LSNB/RSSB rules come from canonical repository documentation/contracts rather than being invented by the LLM. Explain I2 Creation Files

---

# 14. Fourth check — RSSB

Same:

```text
RSSB requirements
       ↓
Candidate
       ↓
Validation
       ↓
Evidence
```

```text
RSSB STATUS: PASS
```

---

# 15. Fifth check — UBRC

This is particularly important.

Project AI checks:

```text
Introduction I2
      │
      ▼
Introduction block type
      │
      ▼
Registry
      │
      ▼
Renderer
      │
      ▼
data-block-version="I2"
      │
      ▼
Runtime
```

For example:

```text
UBRC

✓ Block type exists
✓ Registry entry exists
✓ Registry points to I2
✓ Renderer resolves I2
✓ Version is I2
✓ Runtime version matches

UBRC: PASS
```

The architecture explicitly treats renderer existence alone as insufficient; the complete chain has to be verified. Explain I2 Creation Files

---

# 16. Sixth check — Tutorial Composer

This is one of the most important parts of your objective.

Project AI opens the actual Composer workflow.

Not just:

```text
registry contains I2
```

It verifies:

```text
Registry
   ↓
Composer
   ↓
Introduction
   ↓
I2
```

Browser:

```text
┌────────────────────────────────────────────┐
│              TUTORIAL COMPOSER             │
├────────────────────────────────────────────┤
│                                            │
│ Block Type                                 │
│                                            │
│ [ Introduction ▼ ]                         │
│                                            │
│ Version                                    │
│                                            │
│ [ I1 ▼ ]                                   │
│                                            │
│             ┌──────────────┐               │
│             │     I2       │ ← MUST EXIST  │
│             └──────────────┘               │
│                                            │
└────────────────────────────────────────────┘
```

Project AI selects:

```text
Introduction
→ I2
```

and verifies it can actually be used.

---

# 17. Then it constructs a real tutorial

This is where the workflow becomes much stronger than static testing.

Project AI could create a temporary verification tutorial:

```text
Tutorial
 ├── Introduction I2
 ├── Explanation
 ├── Example
 └── Summary
```

Then:

```text
Composer
   ↓
Save Draft
   ↓
Generate Tutorial
   ↓
Render Tutorial
   ↓
Browser
```

---

# 18. Browser verification

Playwright/browser agent opens the actual tutorial page.

For example:

```text
/tutorial/verification/i2
```

It checks:

```text
✓ Page loads
✓ Introduction I2 exists
✓ Correct renderer used
✓ data-block-version="I2"
✓ Expected content visible
✓ No runtime errors
✓ No console errors
✓ Required CSS loaded
✓ Required assets loaded
```

The runtime verification model stores:

```text
expected
observed
passed
evidenceIds
```

so the system can explain *why* the runtime passed. Explain I2 Creation Files

---

# 19. Brand independence verification

Now Project AI checks whether I2 is actually reusable.

It searches for things like:

```text
hard-coded brand colors
hard-coded logo
brand-specific URLs
brand-specific image
brand-specific typography
brand-specific copy
brand-specific IDs
```

For example:

```text
BRAND INDEPENDENCE

✓ No hard-coded logo
✓ No hard-coded brand URL
✓ Theme tokens used
✓ Content supplied through data
✓ Assets configurable
✓ Typography uses platform tokens

BRAND INDEPENDENCE: PASS
```

That is a formal certification criterion, not merely an LLM opinion. Explain I2 Creation Files

---

# 20. Final I2 certification screen

You could ultimately see:

```text
┌────────────────────────────────────────────────────┐
│              INTRODUCTION I2                       │
│              CERTIFICATION                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ Implementation              ✓ PASS                │
│ Type Contract               ✓ PASS                │
│ Data Contract               ✓ PASS                │
│ ILS Runtime                 ✓ PASS                │
│ LSNB                        ✓ PASS                │
│ RSSB                        ✓ PASS                │
│ UBRC                        ✓ PASS                │
│ Registry                    ✓ PASS                │
│ Renderer                    ✓ PASS                │
│ Tutorial Composer           ✓ PASS                │
│ Tests                       ✓ PASS                │
│ Browser Runtime             ✓ PASS                │
│ Evidence                    ✓ PASS                │
│ Brand Independence          ✓ PASS                │
│                                                    │
│ ───────────────────────────────────────────────── │
│                                                    │
│             🟢 I2 CERTIFIED                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

Only after this should it become a normal selectable production block.

---

# 21. Now the important part: I2-only vs Mix & Match

These are **two different workflows**, and Project LLM should support both.

---

## Mode A — I2 only

You say:

> "Create Introduction I2."

Project AI interprets:

```text
Introduction
    │
    └── I2
```

It analyzes the existing Introduction family and determines what I2 requires.

Then:

```text
Existing Introduction architecture
             ↓
I2 specification
             ↓
External AI implementation
             ↓
Verification
             ↓
I2 certification
```

The result is:

```text
Introduction I2
```

---

# 22. Mode B — Mix & Match

This is more interesting.

Suppose you have:

```text
I1
 ├── layout A
 ├── hero A
 └── media A

I2
 ├── layout B
 ├── hero B
 └── media B

I3
 ├── layout C
 ├── hero C
 └── media C
```

You might request:

> "Create an Introduction version using I2's structure, I1's media treatment, and the new HTML concept's hero."

Project AI should **not simply concatenate files**.

It should decompose the request into capabilities.

For example:

```text
INTRODUCTION MIX & MATCH

Base:
I2

Selected capabilities:
──────────────────────────────
Structure       → I2
Hero            → New Candidate
Media           → I1
Footer          → I2
Responsive      → Canonical
Theme           → Canonical
Data Contract   → Canonical
```

---

# 23. Project AI determines compatibility

This is where the evidence graph and dependency graph become extremely important.

It asks:

```text
Can I1 media be used with I2 structure?
```

Then:

```text
I1 Media
    ↓
dependencies
    ↓
data contract
    ↓
renderer
    ↓
I2 structure
```

Possible result:

```text
✓ Compatible
```

Or:

```text
❌ Incompatible

Reason:
I1 media requires MediaDataV1
I2 requires MediaDataV2

Migration required.
```

That is precisely the kind of reasoning the completed dependency/evidence graph is intended to enable.

---

# 24. Mix & Match should generate a composition specification

For example:

```json
{
  "family": "Introduction",
  "targetVersion": "I2-custom",
  "base": "I2",
  "components": {
    "structure": "I2",
    "hero": "candidate",
    "media": "I1",
    "footer": "I2"
  },
  "requiredChecks": [
    "ILS",
    "LSNB",
    "RSSB",
    "UBRC",
    "COMPOSER",
    "RUNTIME",
    "BRAND_INDEPENDENCE"
  ]
}
```

The exact schema can evolve, but conceptually this is what you want.

---

# 25. Then External AI gets the mix-and-match contract

Instead of:

> "Build whatever looks like this."

External AI gets:

```text
BASE:
Introduction I2

REUSE:
Introduction I1 media implementation

NEW:
Hero implementation from supplied HTML/CSS/JS concept

DO NOT MODIFY:
Canonical Introduction data contract

MUST UPDATE:
Introduction registry
Renderer compatibility

MUST VERIFY:
ILS
LSNB
RSSB
UBRC
Composer
Runtime
Brand independence
```

This sharply reduces AI-generated architectural drift.

---

# 26. The browser journey for Mix & Match

From the user's perspective:

```text
PROJECT AI
   │
   ▼
Create Block
   │
   ▼
Introduction
   │
   ▼
Creation Mode
   │
   ├───────────────┐
   │               │
   ▼               ▼
I2 Only        Mix & Match
                   │
                   ▼
             Select Base
                   │
                   ▼
                  I2
                   │
                   ▼
           Select Components
                   │
        ┌──────────┼───────────┐
        ▼          ▼           ▼
      Hero       Media       Layout
       I2         I1          I2
        │          │           │
        └──────────┼───────────┘
                   ▼
             Compatibility
                 Check
                   │
                   ▼
             Specification
                   │
                   ▼
             Human Approval
                   │
                   ▼
             External AI
                   │
                   ▼
              React/TS
                   │
                   ▼
          Project AI Validation
                   │
                   ▼
               Composer
                   │
                   ▼
               Browser
                   │
                   ▼
            Certification
```

---

# 27. And then the candidate becomes available in Composer

This is the final experience you specifically asked for.

After certification:

```text
Tutorial Composer
      │
      ▼
Introduction
      │
      ├── I1
      ├── I2
      └── I2-CUSTOM ✓
```

Then you can actually use:

```text
Introduction I2-CUSTOM
```

while constructing a tutorial.

The candidate is not considered "done" simply because the component is in the repository. It must pass the complete path:

```text
Candidate
 → Registry
 → Renderer
 → Composer
 → Generated Tutorial
 → Runtime
 → Browser
 → Certification
```

That is the intended Composer certification model. Explain I2 Creation Files

---

# 28. The whole journey in one picture

The complete future system is therefore:

```text
                    YOU
                     │
                     ▼
             PROJECT AI BROWSER
                     │
          ┌──────────┴──────────┐
          │                     │
      I2 ONLY              MIX & MATCH
          │                     │
          └──────────┬──────────┘
                     ▼
             REPOSITORY ANALYSIS
                     │
                     ▼
            SNAPSHOT + EVIDENCE
                     │
                     ▼
          EXISTING BLOCK ANALYSIS
                     │
                     ▼
          CANDIDATE SPECIFICATION
                     │
                     ▼
               HUMAN APPROVAL
                     │
                     ▼
                EXTERNAL AI
                     │
             HTML/CSS/JS/JSON
                     │
                     ▼
             React/TypeScript
                     │
                     ▼
        ┌────────────────────────┐
        │ PROJECT AI VALIDATION  │
        ├────────────────────────┤
        │ Contract               │
        │ ILS                    │
        │ LSNB                   │
        │ RSSB                   │
        │ UBRC                   │
        │ Registry               │
        │ Renderer               │
        │ Composer               │
        │ Tests                  │
        │ Runtime                │
        │ Browser                │
        │ Evidence               │
        │ Brand Independence     │
        └───────────┬────────────┘
                    │
                    ▼
             CERTIFICATION
                    │
                    ▼
          TUTORIAL COMPOSER
                    │
                    ▼
             SELECT I2 / CUSTOM
                    │
                    ▼
             BUILD TUTORIAL
                    │
                    ▼
              RENDER PAGE
                    │
                    ▼
             BROWSER VERIFY
                    │
                    ▼
             PRODUCTION READY
```

---

# 29. So, specifically, does this achieve your original objective?

**Yes.**

Your original objective can be expressed as this final contract:

```text
External AI
    ↓
HTML/CSS/JS/JSON concept
    ↓
Project LLM
    ↓
Repository-aware analysis
    ↓
"Here are the prerequisites and implementation requirements"
    ↓
Human approval
    ↓
External AI
    ↓
React / TypeScript / TSX implementation
    ↓
Project LLM
    ↓
ILS verification
    ↓
LSNB verification
    ↓
RSSB verification
    ↓
UBRC verification
    ↓
Registry verification
    ↓
Renderer verification
    ↓
Tutorial Composer verification
    ↓
Automated tutorial generation
    ↓
Browser/runtime verification
    ↓
Evidence verification
    ↓
Brand-independence verification
    ↓
CERTIFIED CANDIDATE BLOCK
    ↓
Visible/selectable in Tutorial Composer
    ↓
Available for tutorial-page implementation
```

And for **I2**, you have two legitimate modes:

### I2-only

```text
Existing Introduction family
          ↓
       I2 design
          ↓
     I2 candidate
          ↓
       certify
          ↓
      Composer
```

### I2 Mix & Match

```text
I2 base
 +
I1/I2/I3 reusable capabilities
 +
new External AI concept
          ↓
Project AI compatibility analysis
          ↓
Composite specification
          ↓
External AI implementation
          ↓
full certification
          ↓
Custom I2 available in Composer
```

The latter is the more powerful long-term capability because **Project AI becomes the compatibility/governance layer between reusable block versions**, rather than forcing you to manually determine whether pieces from different versions can safely coexist.

The current repository, however, is **not yet at that browser-driven end state**: M2.3–M2.8 and the later Candidate Block/I2 workflow still need implementation. Explain I2 Creation Files

**Therefore, the correct next step is not to manually implement I2 yet.** We should first complete **M2.3 → M2.7**, certify the deterministic evidence foundation, then implement **M2.8 FastAPI + the multi-agent browser workflow**, and only then build the I2/Candidate Block experience on top of it. Explain I2 Creation Files

Yes — **with one important distinction**.

### 1. Human-uploaded Candidate Block files

The intended architecture is:

```text
Human
  ↓
Project AI Browser
  ↓
Upload Candidate Block package
  ↓
Project LLM validates / classifies files
  ↓
Determine canonical destination
  ↓
Place files into repository
  ↓
Update existing registries/contracts/docs
  ↓
Run deterministic discovery
  ↓
Run Candidate Block certification
```

So the human should **not need to manually figure out where every `.tsx`, `.ts`, JSON, CSS, test, registry, etc. belongs**.

Project AI should inspect the uploaded Candidate Block package and determine the appropriate repository locations based on the repository snapshot, existing block families, registry structure, contracts, and canonical artifacts.

However, I would make one architectural rule explicit:

> **Project LLM should not blindly copy uploaded files into the repository. It should produce a proposed file-placement manifest, validate collisions/contracts, obtain the required approval, and then perform the placement through an approved repository operation.**

For example:

```json
{
  "candidateBlock": "introduction-i2-hero-01",
  "files": [
    {
      "uploadedPath": "Hero.tsx",
      "targetPath": "ILS_UI_UX/components/blocks/introduction/...",
      "action": "ADD",
      "reason": "Matches existing Introduction block-family structure"
    },
    {
      "uploadedPath": "types.ts",
      "targetPath": "...existing canonical type location...",
      "action": "EXTEND",
      "reason": "Existing canonical contract should be extended"
    },
    {
      "uploadedPath": "registry.ts",
      "targetPath": "...existing registry...",
      "action": "UPDATE",
      "reason": "Do not create duplicate registry"
    }
  ]
}
```

That is actually an important missing detail to make the workflow production-grade.

### 2. Did the previous implementation cover everything?

**No — not yet.**

The previous conversation gave you a **complete architectural blueprint and detailed implementation plan**, but it did **not mean that every phase of the entire architecture has already been implemented in GitHub**.

The current verified state is roughly:

| Area | Status |
|---|---|
| M1 deterministic discovery | ✅ Implemented |
| Evidence lifecycle | ✅ M2.1 |
| Strict `evidenceId` binding | ✅ M2.2 |
| Toolchain execution | ⏳ M2.3 |
| Composer/API/schema depth | ⏳ M2.4 |
| Dependency graph depth | ⏳ M2.5 |
| UBRC verification | ⏳ M2.6 |
| Runtime/browser verification | ⏳ M2.7 |
| Project AI/FastAPI foundation | ⏳ M2.8 |
| Multi-agent orchestration | ⏳ |
| Human approval workflow | ⏳ |
| Candidate Block upload/placement pipeline | **Needs implementation** |
| Candidate Block certification | **Needs implementation** |
| Tutorial Composer integration verification | **Needs implementation** |
| Brand-independence verifier | **Needs implementation** |
| I2-only creation workflow | **Needs implementation** |
| Mix-and-match composition workflow | **Needs implementation** |
| End-to-end browser journey | **Needs implementation** |
| Production Candidate Block → Composer → tutorial certification | **Needs implementation** |

So I would **not tell you that the complete system code has already been given or implemented**. What we have is the architecture, contracts, implementation sequence, agent responsibilities, and substantial M2.2 code already committed.

### 3. What still needs to be coded

The remaining implementation should ultimately establish this complete pipeline:

```text
                 HUMAN
                   │
                   ▼
        ┌─────────────────────┐
        │ Project AI Browser  │
        └──────────┬──────────┘
                   │
                   ▼
        Upload Candidate Block
        HTML/CSS/JS/JSON or
        React/TS/TSX package
                   │
                   ▼
        ┌─────────────────────┐
        │ Project AI Intake   │
        └──────────┬──────────┘
                   │
          inspect + classify
                   │
                   ▼
        File Placement Manifest
                   │
                   ▼
        Existing Repository
        + Snapshot + Evidence
                   │
                   ▼
        Canonical Artifact Check
                   │
          ┌────────┴────────┐
          │                 │
       EXTEND             CREATE
     existing             only when
     artifact             justified
          │                 │
          └────────┬────────┘
                   ▼
            Human Approval
                   │
                   ▼
        Approved Repository
             Placement
                   │
                   ▼
       Deterministic Discovery
                   │
                   ▼
       Candidate Block Analysis
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
   ILS / LSNB / RSSB       UBRC
       │                       │
       └───────────┬───────────┘
                   ▼
          Registry / Renderer
                   │
                   ▼
        Composer Compatibility
                   │
                   ▼
              Tests
                   │
                   ▼
         Runtime Verification
                   │
                   ▼
         Browser Verification
                   │
                   ▼
       Brand Independence
                   │
                   ▼
             Evidence
                   │
                   ▼
          CERTIFIED BLOCK
                   │
                   ▼
          Tutorial Composer
                   │
                   ▼
          I2 / Custom I2
                   │
                   ▼
          Tutorial Generation
                   │
                   ▼
        Render + Browser Test
                   │
                   ▼
             PRODUCTION
```

### 4. One thing I would add to the previous design

The **upload/placement subsystem** should become an explicit Project AI capability rather than being hidden inside the general implementation agent.

I recommend adding something like:

```text
Agent: Candidate Intake & Placement Agent
```

Responsibilities:

1. Receive human-uploaded Candidate Block package.
2. Inventory every uploaded file.
3. Identify file type and semantic role.
4. Compare against repository structure.
5. Locate existing canonical implementation locations.
6. Detect duplicate files.
7. Detect existing components with the same purpose.
8. Determine `ADD`, `UPDATE`, `EXTEND`, `REUSE`, or `REJECT`.
9. Produce a placement manifest.
10. Check naming conventions.
11. Check block-family/version conventions.
12. Check registry ownership.
13. Check contract ownership.
14. Request human approval when required.
15. Perform approved placement.
16. Generate evidence for every placed/modified artifact.
17. Trigger discovery again.
18. Hand the result to Candidate Block certification.

This is especially important because of your **canonical-artifact policy**.

For example, if the human uploads:

```text
candidate/
├── Introduction.tsx
├── Introduction.types.ts
├── registry.ts
├── renderer.tsx
├── schema.ts
├── styles.css
├── test.tsx
└── README.md
```

Project AI should **not automatically create**:

```text
docs/new-introduction.md
docs/candidate-introduction.md
docs/introduction-i2-plan.md
docs/introduction-i2-registry.md
```

just because those files were supplied.

Instead it should determine:

```text
Existing canonical Introduction registry
        ↓
UPDATE

Existing canonical block contract
        ↓
EXTEND

Existing canonical test location
        ↓
ADD test

Existing canonical documentation
        ↓
APPEND / UPDATE

No suitable artifact
        ↓
CREATE
+ explain why
```

That directly implements the instruction you previously approved for **all Project AI agents**.

### 5. And yes, the final browser experience should hide most of this complexity

The human journey should eventually be something like:

```text
Project AI
────────────────────────────────

Create Candidate Block

Block Family:
[ Introduction ▼ ]

Target:
[ I2 ▼ ]

Creation Mode:
○ I2 Only
○ Mix & Match
○ New Candidate Block

Candidate files:
[ Upload files ]

              [Analyze]
```

Then:

```text
Project AI Analysis
────────────────────────────────

✓ Repository analyzed
✓ Introduction family identified
✓ I1 identified
✓ I2 identified
✓ Existing registry identified
✓ Existing renderer identified
✓ Composer integration identified

Uploaded files: 8

Placement proposal:

  3  ADD
  2  EXTEND
  1  UPDATE
  2  REUSE

No duplicate canonical documentation required.

              [Review]
```

Then:

```text
Approval Required
────────────────────────────────

Candidate: Introduction I2

Repository changes:
  ADD     3 files
  UPDATE  2 files
  EXTEND  2 contracts
  REUSE   1 existing component

Certification gates:
  ✓ TypeScript
  ✓ ILS
  ✓ LSNB
  ✓ RSSB
  ✓ UBRC
  ✓ Registry
  ✓ Renderer
  ✓ Composer
  ✓ Tests
  ✓ Runtime
  ✓ Browser
  ✓ Brand Independence

              [Approve]
```

Then Project AI performs the implementation/verification workflow and ultimately:

```text
✓ Introduction I2 Certified

Available in Tutorial Composer:

Introduction
 ├── I1
 └── I2  ← certified

Creation modes:
 ├── I2 only
 └── Mix & Match
```

### Bottom line

**Your understanding is correct:** the final architecture should allow a human to upload the Candidate Block code/package, while **Project AI determines the correct repository placement, integrates it with the existing architecture, updates canonical artifacts rather than proliferating files, and then certifies the block through the complete pipeline.**

But **we are not finished coding that system yet**. M1 and M2.1/M2.2 are implemented; the remaining M2 phases plus Candidate Intake/Placement, Candidate Block certification, Composer/runtime/browser verification, I2/mix-and-match orchestration, and the complete Project AI browser workflow still need to be implemented.

And I would treat the **Candidate Intake & Placement Agent + placement manifest** as an explicit part of the remaining implementation rather than assuming it is already covered by the previous plan.