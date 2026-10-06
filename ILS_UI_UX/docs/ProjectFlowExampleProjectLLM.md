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

Yes — **those two remaining areas can and should be implemented against the actual GitHub repository**, and I agree with your UI requirement.

I inspected the verified `m2-project-ai-foundation` branch rather than treating the UI as a generic Next.js application. The repository already has a fairly strong visual/system foundation that Project AI should reuse.

### What the existing repository tells us

The SkillHubCore Admin application already uses:

- Next.js App Router
- authenticated/admin route groups
- a shared `ClientShell`
- `LeftSidebar`
- `Header`
- `RightSidebar`
- shared UI components
- Tailwind shared preset
- Inter + Outfit typography
- the existing pink/blue/orange visual language
- the existing `ShellContext`
- the existing `/dashboard` structure
- existing factory/wizard interaction patterns

For example, the existing admin shell uses the actual application structure:

```text
ClientShell
 ├── LeftSidebar
 ├── Header
 ├── Main Content
 └── RightSidebar
```

and the dashboard already uses the repository's established cards, typography, spacing, iconography, colors and interaction patterns.

The repository's global CSS currently establishes:

```text
Inter
Outfit
pink primary
blue secondary
white cards
slate text
soft dashboard background
rounded cards
Tailwind
```

So **Project AI should absolutely not introduce a separate design system.**

---

# 1. Project AI should become a native SkillHubCore Admin experience

I would implement the UI inside the existing:

```text
apps/skillhubcore-admin/
```

rather than creating:

```text
apps/project-ai-ui/
```

or another standalone frontend.

That would violate the architectural intent of having Project AI operate as part of the SkillHubCore platform.

The eventual navigation should be something like:

```text
SkillHubCore Admin
│
├── Dashboard
├── Content
├── Factory
├── Tutorial Composer
│
├── Project AI
│   ├── Overview
│   ├── Create Block
│   ├── Candidates
│   ├── Verification
│   ├── Composer Tests
│   └── Evidence
│
└── ...
```

The exact sidebar location should be determined by the existing `LeftSidebar` structure rather than inventing a second navigation system.

---

# 2. Project AI Dashboard should visually match SkillHubCore

I would **not** make it look like a generic AI chat dashboard.

It should look like an engineering/control-plane section of SkillHubCore.

For example:

```text
┌─────────────────────────────────────────────────────────────┐
│ Project AI                                      Environment │
│ Repository intelligence & block certification               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Snapshot   │ │ Evidence   │ │ Candidates │ │ Certified  │ │
│ │ CURRENT    │ │ 12,482     │ │ 8          │ │ 23         │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                             │
│ ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│ │ Verification Pipeline       │ │ Repository Health       │ │
│ │                             │ │                         │ │
│ │ ✓ Discovery                 │ │ ✓ Snapshot              │ │
│ │ ✓ Evidence                 │ │ ✓ Evidence integrity    │ │
│ │ ✓ UBRC                     │ │ ✓ Registry              │ │
│ │ ✓ Composer                 │ │ ⚠ Runtime               │ │
│ │ ○ Browser                  │ │ ○ Candidate             │ │
│ └─────────────────────────────┘ └─────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Candidate Blocks                                       │ │
│ │                                                         │ │
│ │ Introduction I2       CERTIFIED       Composer          │ │
│ │ Introduction Custom   WAITING         Approval          │ │
│ │ Code C2               FAILED          UBRC              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

It should feel like:

**SkillHubCore Admin + engineering verification console**

—not a separate SaaS product.

---

# 3. Block Creation page should reuse the existing Factory UX language

This is particularly important.

The repository already contains things such as:

```text
BlueprintFactoryWizard
FactoryLayout
```

and those components already establish a strong wizard/modal language.

The existing `BlueprintFactoryWizard`, for example, uses:

- full-screen workflow
- strong header
- uppercase engineering-style labels
- iconography
- progress/state presentation
- dark protocol panels
- configuration cards
- validation/error states
- explicit commit/return actions

That is actually a very good foundation for the Project AI Candidate Block workflow.

So I would make:

```text
Project AI
    ↓
Create Block
```

use the same visual grammar.

---

# 4. Proposed Create Block UI

### Step 1 — Creation Mode

```text
Create Educational Block

Choose creation mode

┌──────────────────────┐
│ I2 ONLY              │
│ Build Introduction   │
│ version I2           │
└──────────────────────┘

┌──────────────────────┐
│ MIX & MATCH          │
│ Compose I2 using     │
│ compatible blocks    │
└──────────────────────┘

┌──────────────────────┐
│ NEW CANDIDATE        │
│ Upload and certify   │
│ a new implementation │
└──────────────────────┘
```

This maps directly to the architecture you approved.

---

# 5. Step 2 — Upload Candidate

```text
Candidate Block Intake_

Introduction / I2

Drop candidate files here

┌────────────────────────────────────────────┐
│                                            │
│       Drop files or Browse                 │
│                                            │
│       TS / TSX / JSX / CSS / JSON / HTML  │
│                                            │
└────────────────────────────────────────────┘

Detected files: 7

✓ Hero.tsx
✓ types.ts
✓ styles.css
✓ registry.ts
✓ renderer.tsx
✓ Hero.test.tsx
✓ config.json
```

Then Project AI analyzes the files.

---

# 6. Step 3 — Repository Analysis

This is where the UI becomes materially different from a normal upload wizard.

```text
Repository Analysis_

✓ Repository snapshot loaded
✓ Evidence graph loaded
✓ Introduction family identified
✓ I1 implementation found
✓ I2 contract identified
✓ Renderer identified
✓ Registry identified
✓ Composer integration identified

Candidate Analysis

7 uploaded files
6 repository relationships
1 exact duplicate
2 existing canonical artifacts
```

This information is coming from the deterministic snapshot/evidence system—not LLM guesses.

---

# 7. Step 4 — Placement Manifest

This is one of the most important screens.

```text
Placement Proposal_

Candidate: introduction-i2-hero-01

┌──────────────┬──────────────┬───────────────────────────────┐
│ Uploaded     │ Action       │ Repository Target             │
├──────────────┼──────────────┼───────────────────────────────┤
│ Hero.tsx     │ ADD          │ .../IntroductionI2Hero.tsx    │
│ types.ts     │ EXTEND       │ existing canonical types.ts   │
│ registry.ts  │ UPDATE       │ existing registry             │
│ renderer.tsx │ UPDATE       │ existing renderer              │
│ Hero.test.tsx│ ADD          │ existing test directory        │
│ styles.css   │ REJECT       │ brand coupling detected       │
└──────────────┴──────────────┴───────────────────────────────┘
```

The user should see **why** Project AI wants to place each file there.

For example:

> `registry.ts → UPDATE`  
> Existing Introduction registry already owns version registration. Creating another registry would violate canonical-artifact policy.

That directly implements the rule we established earlier.

---

# 8. Step 5 — Human Approval

Then:

```text
Review Repository Changes_

Candidate
Introduction I2

Proposed changes
────────────────────────
3 ADD
2 UPDATE
1 EXTEND
1 REJECT

Certification gates
────────────────────────
✓ Contract
✓ ILS
✓ LSNB
✓ RSSB
✓ UBRC
○ Composer
○ Runtime
○ Browser
○ Brand Independence
○ Evidence

[ Reject ]                    [ Approve Changes ]
```

The **Approve Changes** button should not merely be a UI action.

It must create the cryptographically bound approval:

```text
manifestHash
approvedBy
approvedAt
taskId
```

and the backend must reject an approval if the manifest subsequently changes.

---

# 9. Verification page

After implementation:

```text
Candidate Verification_

Introduction I2
────────────────────────────────

Contract                 ✓ PASS
ILS                      ✓ PASS
LSNB                     ✓ PASS
RSSB                     ✓ PASS
UBRC                     ✓ PASS
Registry                 ✓ PASS
Renderer                 ✓ PASS
Composer                 ✓ PASS
Tests                    ✓ PASS
Runtime                  ✓ PASS
Browser                  ✓ PASS
Brand Independence       ✓ PASS
Evidence                 ✓ PASS

                         ─────────────
                         CERTIFIED
```

This is much more useful than displaying a generic:

> "AI implementation successful."

Because certification is **gate-based and evidence-backed**.

---

# 10. Evidence should be first-class UI

Project AI should have an evidence drawer/panel.

For example:

```text
Evidence

EVID-7A82...
────────────────────────
Claim:
Introduction I2 renderer exists.

Source:
packages/ui/src/tutorial/blocks/IntroductionBlock.tsx

Kind:
component

Hash:
sha256: ...

Lifecycle:
current

Referenced by:
✓ Contract
✓ UBRC
✓ Renderer
✓ Browser
```

Clicking the evidence should take the engineer to the repository source or source-location view.

This is important because the architecture is explicitly evidence-driven.

---

# 11. Browser verification should use the real application

This is where the final `⏳` becomes actual implementation.

The browser verifier should not create a fake page just to demonstrate that React rendered.

It should launch the **actual SkillHubCore application** and execute:

```text
Project AI
   ↓
approved application operation
   ↓
SkillHubCore Admin / Composer
   ↓
Introduction
   ↓
I2
   ↓
select candidate
   ↓
configure
   ↓
save draft
   ↓
generate tutorial
   ↓
render tutorial
   ↓
browser inspection
```

Then Playwright verifies:

```text
[data-block-type="introduction"]
[data-block-version="I2"]
```

plus:

- visible content
- expected renderer
- no console errors
- no relevant network errors
- correct responsive rendering
- Composer selection
- save operation
- generated tutorial
- final tutorial rendering

---

# 12. Full end-to-end certification

Then the final gate becomes:

```text
Candidate
   │
   ▼
Upload
   │
   ▼
Intake
   │
   ▼
Classification
   │
   ▼
Placement Manifest
   │
   ▼
Human Approval
   │
   ▼
Repository Mutation
   │
   ▼
Discovery Refresh
   │
   ▼
Contract
   │
   ├── ILS
   ├── LSNB
   ├── RSSB
   └── UBRC
   │
   ▼
Registry
   │
   ▼
Renderer
   │
   ▼
Composer
   │
   ▼
Tests
   │
   ▼
Runtime
   │
   ▼
Browser
   │
   ▼
Brand Independence
   │
   ▼
Evidence
   │
   ▼
CERTIFIED
   │
   ▼
Composer
   │
   ▼
I2 / I2-CUSTOM
   │
   ▼
Temporary Tutorial
   │
   ▼
Browser
   │
   ▼
PRODUCTION READY
```

That is the correct definition of **full end-to-end production certification**.

---

## Most importantly: yes, the UI should match the existing SkillHubCore UI

I verified enough of the actual repository to say this confidently.

The existing admin application already has:

- `ClientShell`
- `LeftSidebar`
- `Header`
- `RightSidebar`
- `/dashboard`
- Factory workflows
- shared UI components
- Tailwind shared preset
- Inter/Outfit typography
- pink/blue/orange visual language
- rounded white cards
- slate backgrounds/text
- existing wizard patterns

So I would **reuse those components and conventions**, not create a new Project AI visual framework.

The existing `IntroductionBlock` also demonstrates the project's educational visual language: controlled typography, cards, rounded sections, Lucide icons, responsive layouts, and `data-block-version` runtime identity.

That makes the architecture:

```text
SkillHubCore Admin
       │
       ├── Existing Dashboard UI
       │
       ├── Existing Factory UI
       │
       ├── Existing Composer UI
       │
       └── Project AI UI
               │
               ├── Dashboard
               ├── Candidate Intake
               ├── Placement
               ├── Approval
               ├── Certification
               ├── Evidence
               └── Runtime/Browser Verification
```

rather than:

```text
SkillHubCore
    +
completely separate Project AI frontend   ❌
```

### One important distinction

**Matching the UI does not mean hard-coding Project AI to today's dashboard implementation.**

Project AI should consume the existing shared UI primitives/theme and existing shell. If the SkillHubCore visual system changes later, Project AI should inherit those changes.

---

### And yes: I can take this all the way to the actual repository implementation

The next implementation package should therefore be **repository-specific**, not generic:

1. **M2.3–M2.7 completion**
2. **FastAPI Project AI service**
3. **SkillHubCore Project AI dashboard**
4. **Create Block wizard**
5. **Candidate upload**
6. **Placement Manifest UI**
7. **Approval UI**
8. **Certification dashboard**
9. **Evidence viewer**
10. **Composer verification**
11. **Playwright runtime verification**
12. **I2-only**
13. **Mix & Match**
14. **final Candidate → Composer → Tutorial → Browser certification**

And the UI should be implemented inside the existing SkillHubCore Admin architecture, reusing its shell and design system rather than creating another frontend.

The source architecture itself requires this final Candidate → Composer → tutorial → browser path before declaring production readiness. Pasted markdown (2)

**So the answer to your question is yes: we can implement those remaining `⏳` items from the actual GitHub repo, and the Project AI UI should look and behave as a native part of the existing SkillHubCore Dashboard/Factory/Composer experience.**

Yes. The earlier UI wording is **too narrow** if the actual goal is the complete Educational Block creation system.

The correct model is **not “Create I2”**. It is:

> **Create Educational Block → select any of the 18 block families → select an existing version or create a compatible candidate/custom composition → Project AI applies the repository compliance contracts → generate with dummy JSON → integrate into Tutorial Composer → verify through the real learner rendering path → render under SUIA/RTH brand context.**

The architecture explicitly treats the final path as Candidate → Composer → Tutorial → Browser before production readiness. Pasted markdown (2)

### 1. The UI should therefore start like this

```text
CREATE EDUCATIONAL BLOCK

Choose Block Family
────────────────────────────────────────

[ Introduction ]   [ Explanation ]   [ Example ]
[ Summary      ]   [ Code        ]   [ Quiz    ]
[ ...          ]   [ ...         ]   [ ...     ]

18 Block Families
```

Then:

```text
Choose Version / Creation Mode

Block Family: Introduction

Available versions
────────────────────────────────────────

○ I1
○ I2
○ I3
○ Custom / Candidate

Creation mode
────────────────────────────────────────

○ USE EXISTING VERSION
○ CREATE FROM VERSION
○ MIX & MATCH
○ NEW CANDIDATE
```

So **I2 is one possible target, not the global creation target**.

---

## 2. Project AI should know the contract for every block/version

For every one of the 18 families and every registered version, Project AI should obtain the actual repository-backed contract.

Conceptually:

```text
18 Block Families
       │
       ├── Version 1
       ├── Version 2
       ├── Version 3
       └── Candidate / Custom
              │
              ▼
       Project AI Contract
              │
       ├── ILS
       ├── LSNB
       ├── RSSB
       ├── UBRC
       ├── Renderer
       ├── Registry
       ├── Tutorial Composer
       ├── Data Contract
       ├── Dummy JSON Contract
       ├── Runtime Contract
       ├── Browser Contract
       └── Brand Independence
```

Crucially, Project AI should **discover these from the canonical repository contracts/evidence**, rather than hard-code assumptions about what each block requires.

---

# 3. Dummy JSON is the right abstraction

Yes, the candidate should initially be able to operate against **dummy JSON data**.

The flow becomes:

```text
Candidate Block
       │
       ▼
Project AI determines required data contract
       │
       ▼
Generate/validate dummy JSON
       │
       ▼
Candidate Renderer
       │
       ▼
Tutorial Composer
       │
       ▼
Tutorial Page Block JSON
       │
       ▼
Actual Renderer
```

For example, conceptually:

```json
{
  "blockType": "introduction",
  "blockVersion": "I2",
  "data": {
    "...": "dummy values satisfying the real contract"
  }
}
```

The important distinction is that **dummy data must satisfy the real block schema**.

Project AI should not invent arbitrary JSON simply because React happens to render it.

---

# 4. Tutorial Composer becomes the integration boundary

This is especially important.

The candidate is **not certified merely because its TSX component renders in isolation**.

Instead:

```text
Candidate
   ↓
Contract validation
   ↓
Repository placement
   ↓
Registry
   ↓
Renderer
   ↓
Tutorial Composer
   ↓
Block JSON
   ↓
Tutorial page
   ↓
Learner URL
   ↓
Browser verification
```

That is much closer to the architecture you are describing.

The source architecture specifically calls for Composer selection/configuration, saving, tutorial generation/rendering, and browser verification rather than stopping at static component validation. Explain I2 Creation Files

---

# 5. And yes — brand independence means the block should inherit the learner tutorial's brand

This is the key part of your question.

The candidate block should **not contain SUIA-specific or RTH-specific presentation logic**.

Instead:

```text
                 Candidate Block
                       │
                       │ brand-independent
                       ▼
                Tutorial Composer
                       │
                       ▼
                 Tutorial JSON
                       │
              ┌────────┴────────┐
              ▼                 ▼
          SUIA URL            RTH URL
              │                 │
              ▼                 ▼
       SUIA Theme          RTH Theme
              │                 │
              ▼                 ▼
       Candidate Block     Candidate Block
       + existing blocks   + existing blocks
```

So the **same certified candidate implementation** can appear in:

```text
SUIA Tutorial
────────────────────────
Existing SUIA blocks
        +
Certified Candidate Block
        +
Existing SUIA blocks
```

and:

```text
RTH Tutorial
────────────────────────
Existing RTH blocks
        +
Same Certified Candidate Block
        +
Existing RTH blocks
```

The candidate itself should remain brand-independent while consuming the **theme/design-token/context supplied by the tutorial runtime**.

That is the correct interpretation of the brand-independence requirement.

---

# 6. Mix & Match should work across compatible versions

This is also broader than the earlier I2 example.

For example:

```text
Create Educational Block

Family: Introduction

Base:
    I2

Composition:

Structure       → I2
Hero            → Candidate A
Media           → I1
Footer          → I2
Data contract   → I2
```

Or another family:

```text
Family: Explanation

Structure       → E3
Hero            → E2
Media           → Candidate B
Footer          → E3
```

But Project AI should **not permit arbitrary combinations**.

It first performs compatibility checking:

```text
Candidate A
     │
     ├── data compatibility
     ├── type compatibility
     ├── version compatibility
     ├── renderer compatibility
     ├── registry compatibility
     ├── responsive compatibility
     ├── Composer compatibility
     ├── runtime compatibility
     └── brand independence
```

Only compatible combinations become selectable.

The architecture already describes this Mix & Match compatibility/composition approach. Pasted markdown (2)

---

# 7. The UI should therefore change from my previous proposal

Instead of:

```text
I2 ONLY
MIX & MATCH
NEW CANDIDATE
```

I recommend:

```text
CREATE EDUCATIONAL BLOCK
────────────────────────────────────────────

1. BLOCK FAMILY

   Introduction
   Explanation
   Example
   Summary
   ...
   [18 families]


2. TARGET VERSION

   Existing:
   I1
   I2
   I3
   ...

   Custom:
   Create compatible version


3. CREATION MODE

   ┌─────────────────────────────┐
   │ USE EXISTING               │
   │ Use a certified version    │
   └─────────────────────────────┘

   ┌─────────────────────────────┐
   │ CREATE FROM VERSION        │
   │ Extend an existing version │
   └─────────────────────────────┘

   ┌─────────────────────────────┐
   │ MIX & MATCH                │
   │ Compose compatible blocks  │
   └─────────────────────────────┘

   ┌─────────────────────────────┐
   │ NEW CANDIDATE              │
   │ Upload implementation      │
   └─────────────────────────────┘
```

Then Project AI dynamically changes the next steps according to the selected family/version.

---

# 8. The final system should have two different concepts

This distinction is important.

### Certified block implementation

```text
Introduction I2 Candidate
        ↓
Certified
```

This means:

> This implementation satisfies the repository's contracts and can be used by Composer.

### Certified composition

```text
Introduction I2
   +
Candidate Hero
   +
I1 Media
   +
I2 Footer
        ↓
I2-CUSTOM
        ↓
Certified Composition
```

This means:

> This particular combination has also passed compatibility and runtime verification.

They should **not be treated as the same object**.

---

# 9. The final learner path

Your intended architecture can therefore be represented as:

```text
                  PROJECT AI
                      │
                      ▼
             Select Block Family
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
       Existing Version     Candidate
            │                   │
            │             Project AI
            │             Certification
            │                   │
            └─────────┬─────────┘
                      ▼
                Compatibility
                      │
                      ▼
                Dummy JSON
                      │
                      ▼
              Tutorial Composer
                      │
                      ▼
              Tutorial Page JSON
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
       SUIA URL                 RTH URL
          │                       │
          ▼                       ▼
     SUIA Theme               RTH Theme
          │                       │
          └───────────┬───────────┘
                      ▼
             Candidate Block
             + existing blocks
                      │
                      ▼
                Browser Test
                      │
                      ▼
              PRODUCTION READY
```

## 10. One important architectural rule

**The candidate should never decide the brand.**

The tutorial/runtime environment decides:

```text
brand = SUIA
```

or:

```text
brand = RTH
```

and supplies the appropriate theme/context.

The candidate consumes the platform's canonical styling/token/runtime interfaces.

That is what makes one certified block reusable across both brands.

---

### So, in one sentence

**Yes — we should build the Project AI creation system generically for all 18 educational block families and their registered versions, with I2 merely being one target; Project AI should enforce the actual UBRC/LSNB/RSSB/ILS/Composer/data/runtime contracts, generate schema-valid dummy JSON for verification, integrate the candidate through the real Tutorial Composer and tutorial-page JSON pipeline, and then allow the same brand-independent certified block to render alongside existing blocks under either the SUIA or RTH learner theme.**

And this also means the UI I previously proposed should be **revised from an “I2 creation wizard” into an “18-family Educational Block Factory” with dynamic version/compatibility selection**.

Yes — **with one important boundary**: External AI is responsible for creating/providing the block implementation and its content/data examples; **Project LLM is responsible for repository integration, compliance, verification, and certification**.

The clean responsibility split should be:

| Responsibility | External AI | Project LLM |
|---|---:|---:|
| Design block UI/UX | ✅ | — |
| Generate TS/TSX/CSS/etc. | ✅ | — |
| Decide visual composition | ✅ | — |
| Generate dummy/sample JSON | ✅ | Validate against contract |
| Choose images/content for visualization | ✅ | — |
| Understand repository architecture | — | ✅ |
| Identify correct block family/version | — | ✅ |
| Determine correct repository destination | — | ✅ |
| Check canonical artifacts | — | ✅ |
| ILS | — | ✅ |
| LSNB | — | ✅ |
| RSSB | — | ✅ |
| UBRC | — | ✅ |
| Registry | — | ✅ |
| Renderer | — | ✅ |
| Tutorial Composer compatibility | — | ✅ |
| Data/schema compatibility | — | ✅ |
| Runtime compatibility | — | ✅ |
| Browser verification | — | ✅ |
| Brand independence | — | ✅ |
| Evidence generation | — | ✅ |
| Repository placement | — | ✅ |
| Certification | — | ✅ |

### The key principle

**External AI creates. Project LLM qualifies, integrates, and certifies.**

Project LLM should **not redesign the External AI's block just because it prefers a different implementation**. It should determine whether the supplied implementation can satisfy the repository contracts and, where necessary, tell the External AI exactly what must be changed.

The overall flow should therefore be:

```text
                    EXTERNAL AI
                         │
                         │
             creates block implementation
                         │
              TS / TSX / CSS / JSON
                         │
                         ▼
              ┌───────────────────┐
              │   PROJECT LLM     │
              │                   │
              │ Repository        │
              │ intelligence      │
              └─────────┬─────────┘
                        │
                        ▼
                 Identify family
                        │
                        ▼
                 Identify version
                        │
                        ▼
              Determine exact contract
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
         ILS           LSNB          RSSB
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                       UBRC
                        │
                        ▼
                 Registry / Renderer
                        │
                        ▼
                 Composer Contract
                        │
                        ▼
                  Data Contract
                        │
                        ▼
                 Runtime Contract
                        │
                        ▼
                 Browser Contract
                        │
                        ▼
              Brand Independence
                        │
                        ▼
                  EVIDENCE
                        │
                        ▼
                   CERTIFIED
```

## For Mix & Match, the same principle applies

Suppose External AI produces:

```text
Introduction Custom

Structure → I2
Hero      → External Candidate
Media     → I1
Footer    → I2
```

External AI decides **what it wants to compose**.

Project LLM determines whether that composition is actually legal:

```text
I2 structure
      │
      ├── compatible with candidate hero?       ✓
      ├── compatible with I1 media?             ✓
      ├── compatible with I2 footer?             ✓
      ├── data contract compatible?             ✓
      ├── renderer compatible?                  ✓
      ├── registry compatible?                  ✓
      ├── UBRC valid?                           ✓
      ├── LSNB valid?                           ✓
      ├── RSSB valid?                           ✓
      ├── Composer compatible?                  ✓
      ├── runtime compatible?                   ✓
      └── brand independent?                    ✓
```

If something fails:

```text
Project LLM
     │
     ▼
FAIL
UBRC_VERSION_MISMATCH
     │
     ▼
Give External AI exact remediation
     │
     ▼
External AI changes implementation
     │
     ▼
Project LLM re-verifies
```

So **Project LLM is the gatekeeper, not the creative author**.

---

## What about dummy JSON?

Yes, your understanding is basically correct.

External AI can provide something like:

```json
{
  "title": "Welcome to JavaScript",
  "description": "Learn the fundamentals...",
  "image": "/example.jpg"
}
```

Project LLM then determines:

> Does this JSON satisfy the actual data contract required by this particular block/version?

If yes:

```text
Dummy JSON
    ↓
Data contract ✓
    ↓
Renderer ✓
    ↓
Tutorial Composer ✓
```

If not:

```text
Dummy JSON
    ↓
Data contract ✗
    ↓
Project LLM
    ↓
"Missing field: ..."
```

It should **not silently invent a different contract** merely to make the candidate pass.

---

# And then comes the repository integration

This is where Project LLM becomes much more than a validator.

After the candidate passes the required analysis, Project LLM determines:

```text
External AI files
        │
        ▼
Candidate Intake
        │
        ▼
Classify files
        │
        ├── Component
        ├── Type
        ├── Schema
        ├── Registry
        ├── Renderer
        ├── Style
        ├── Test
        └── Asset
        │
        ▼
Find canonical repository locations
        │
        ▼
Placement Manifest
        │
        ▼
Human Approval
        │
        ▼
Repository Integration
```

This is where your earlier **"don't create another MD if one already exists"** rule also applies.

Project LLM should ask:

> Does the repository already have the canonical artifact for this purpose?

If yes:

```text
UPDATE / EXTEND / REUSE
```

rather than:

```text
CREATE DUPLICATE
```

---

# Then Project LLM must rediscover the repository

This is an important part of the architecture.

After the approved files are embedded:

```text
Repository Mutation
        ↓
Discovery runs again
        ↓
New snapshot
        ↓
New evidence
        ↓
Re-evaluate candidate
```

Because Project LLM should **never assume that successful file placement means successful integration**.

It needs to prove:

```text
Component exists
        ↓
Registry knows it
        ↓
Renderer knows it
        ↓
Composer can select it
        ↓
Composer can configure it
        ↓
Composer can save it
        ↓
Tutorial JSON contains it
        ↓
Tutorial renders it
        ↓
Browser sees it
```

---

# Final certification

Only then:

```text
┌─────────────────────────────────────┐
│       CANDIDATE BLOCK               │
│                                     │
│ Contract                 ✓           │
│ ILS                     ✓           │
│ LSNB                    ✓           │
│ RSSB                    ✓           │
│ UBRC                    ✓           │
│ Registry                ✓           │
│ Renderer                ✓           │
│ Composer                ✓           │
│ Data Contract           ✓           │
│ Runtime                 ✓           │
│ Browser                 ✓           │
│ Brand Independence      ✓           │
│ Evidence                ✓           │
│                                     │
│       ★ CERTIFIED ★                 │
└─────────────────────────────────────┘
```

Then it becomes available to the Tutorial Composer.

And finally:

```text
Tutorial Composer
       ↓
Introduction / Explanation / etc.
       ↓
Select Certified Candidate
       ↓
Save Tutorial
       ↓
Generate Tutorial JSON
       ↓
Learner URL
       ↓
┌───────────────┬───────────────┐
│ SUIA          │ RTH           │
│               │               │
│ SUIA theme    │ RTH theme     │
│ Existing      │ Existing      │
│ blocks        │ blocks        │
│ + Candidate   │ + Candidate   │
└───────────────┴───────────────┘
```

**Same candidate implementation. Different brand context.**

That is the architecture I would lock in.

The only nuance I would add is that **Project LLM should validate the External AI's dummy JSON, not necessarily own its creation**. If External AI doesn't provide usable dummy data, Project LLM can request remediation or generate a contract-derived test fixture, but the authoritative requirement remains the repository's actual data contract.

Yes. That is the cleaner responsibility boundary.

**External AI owns creation. Project LLM owns the platform, compliance, integration, and certification.**

More precisely:

```text
                    PROJECT LLM
                         │
                         ▼
              Educational Block Factory
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Block Family     Version       Compliance
     selection        selection     requirements
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 EXTERNAL AI
                         │
             creates/provides
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
             UI/UX      Code     JSON/Data
              │          │          │
              └──────────┼──────────┘
                         ▼
                 Upload to Project LLM
                         │
                         ▼
              PROJECT LLM AUDIT
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Compliance      Repository     Integration
       validation       analysis       analysis
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Human approval
                         │
                         ▼
               Repository placement
                         │
                         ▼
                  Registry update
                         │
                         ▼
                   Renderer update
                         │
                         ▼
                Tutorial Composer
                         │
                         ▼
                Tutorial page JSON
                         │
                         ▼
                 Runtime verification
                         │
                         ▼
                 Browser verification
                         │
                         ▼
                    CERTIFIED
```

### What Project LLM actually provides to External AI

When the user selects, for example:

```text
Block Family: Introduction
Version: I2
Creation: New Candidate
```

Project LLM should produce an **External AI Creation Contract** containing the repository-derived requirements:

```text
INTRODUCTION / I2
────────────────────────────

Required:

✓ ILS
✓ LSNB
✓ RSSB
✓ UBRC
✓ Registry integration
✓ Renderer integration
✓ Tutorial Composer compatibility
✓ Required data contract
✓ Runtime requirements
✓ Browser requirements
✓ Brand-independence requirements
✓ Version identity
✓ Required tests
```

For another selection:

```text
Block Family: Explanation
Version: E3
```

Project LLM produces the **Explanation/E3 contract**, based on that actual repository implementation.

So External AI doesn't have to guess what the platform requires.

---

## Then External AI creates the candidate

External AI is responsible for:

```text
UI/UX
React/TSX
TypeScript
CSS
assets
component structure
dummy/sample JSON
visual content
interaction design
```

It packages those files and gives them to Project LLM.

Project LLM then says:

> "I received your candidate. Now I will determine whether it satisfies the repository's actual requirements and where every artifact belongs."

---

## Project LLM should determine where everything goes

This is an important part of your requirement.

External AI should **not need to know the exact repository directory structure**.

For example, it may upload:

```text
candidate/
├── Hero.tsx
├── Hero.types.ts
├── Hero.css
├── Hero.test.tsx
└── dummy-data.json
```

Project LLM determines:

```text
Hero.tsx
    ↓
correct canonical block implementation location

Hero.types.ts
    ↓
existing canonical type location OR new location if genuinely required

Hero.css
    ↓
correct styling location

Hero.test.tsx
    ↓
existing canonical test location

dummy-data.json
    ↓
appropriate fixture/test location
```

And for registry/renderer integration:

```text
existing registry
       ↑
       │ UPDATE

existing renderer
       ↑
       │ UPDATE

existing Composer metadata/config
       ↑
       │ UPDATE
```

It should **not create duplicate registries, renderers, contracts, or documentation merely because the candidate contains its own versions**.

That follows the canonical-artifact policy we established.

---

# Then Project LLM makes the block visible in Tutorial Composer

This is the critical end result.

Suppose External AI creates:

```text
Introduction I2 Candidate
```

After Project LLM successfully integrates and certifies it, the Tutorial Composer should expose something conceptually like:

```text
Tutorial Composer

Add Block
────────────────────────────

Introduction
   ├── I1
   ├── I2
   └── I2-Candidate-01  ✓ Certified

Explanation
   ├── E1
   ├── E2
   └── E3

Example
   ├── EX1
   └── EX2
```

The **version identifier comes from the Project LLM/repository integration**, not from the External AI merely declaring a version number.

That is important for integrity.

External AI might say:

```text
version = I2
```

but Project LLM determines whether the implementation is actually compliant with the repository's I2 contract.

If it isn't, Project LLM should not register it as I2.

---

# Mix & Match works the same way

Suppose the user asks for:

```text
Introduction
Custom Composition

Structure → I2
Hero      → Candidate A
Media     → I1
Footer    → I2
```

Project LLM creates the composition contract:

```text
Introduction I2-CUSTOM
────────────────────────

Structure: I2
Hero: Candidate A
Media: I1
Footer: I2

Compatibility:
✓ Data
✓ Type
✓ Renderer
✓ Registry
✓ UBRC
✓ LSNB
✓ RSSB
✓ Composer
✓ Runtime
✓ Brand independence
```

External AI creates the actual custom implementation.

Project LLM then integrates and certifies **that composition**.

---

# And the final learner experience

After certification:

```text
Tutorial Composer
        │
        ▼
Select:
Introduction → I2-Candidate-01
        │
        ▼
Configure block
        │
        ▼
Save tutorial
        │
        ▼
Tutorial JSON
        │
        ▼
Learner URL
```

If the learner opens the SUIA tutorial:

```text
SUIA Learner URL
       │
       ▼
SUIA tutorial theme/context
       │
       ▼
Existing SUIA blocks
       +
Certified Candidate
       +
Existing SUIA blocks
```

If the same candidate is used in RTH:

```text
RTH Learner URL
       │
       ▼
RTH tutorial theme/context
       │
       ▼
Existing RTH blocks
       +
Same Certified Candidate
       +
Existing RTH blocks
```

The candidate **does not become a SUIA block or an RTH block**.

It remains a **platform-certified, brand-independent educational block**.

The learner runtime supplies the applicable brand/theme.

---

## Therefore I would lock the architecture to this rule

> **External AI = Block Creator.**
>
> **Project LLM = Block Factory, Compliance Authority, Repository Integrator, Composer Integrator, and Certification Authority.**
>
> **Tutorial Composer = Block Selection and Tutorial Composition layer.**
>
> **Learner Runtime = Brand-specific rendering environment.**

And the most important point:

**Project LLM does not merely tell the user whether the uploaded files pass. It must actually integrate the approved files into the repository, connect the necessary registry/renderer/Composer paths, assign/verify the repository-recognized block/version identity, and prove through the real Tutorial Composer → tutorial JSON → learner URL path that the block is usable.**

That is the implementation target we should use going forward. Explain I2 Creation Files

Yes — **with one important qualification**.

Project AI does **not need to care about the creative/design details of the block**. External AI owns the actual structure, visual design, content, and implementation. Project AI's concern is whether the submitted implementation correctly identifies itself as the requested **block family + version** and satisfies the platform contracts required to become a Tutorial Composer member.

For example:

```text
External AI
    │
    │ creates whatever UI/content it wants
    ▼
Introduction / I2 candidate
    │
    ▼
Project AI checks
    │
    ├── Is this actually Introduction?
    ├── Does it declare/implement I2 correctly?
    ├── ILS ✓
    ├── LSNB ✓
    ├── RSSB ✓
    ├── UBRC ✓
    ├── Registry ✓
    ├── Renderer ✓
    ├── Composer contract ✓
    ├── Runtime ✓
    ├── Browser ✓
    └── Brand independence ✓
            │
            ▼
       QUALIFIED
            │
            ▼
   Tutorial Composer Member
```

### What Project AI should **not** judge

It should not say:

> "I don't like this hero design."

or:

> "The External AI should have used this layout."

or:

> "I would design the Introduction differently."

Those are External AI/design responsibilities.

### What Project AI **must** judge

It must establish:

> **"This implementation is a valid member of the `Introduction / I2` contract and can safely participate in the Tutorial Composer."**

So the distinction is:

| Area | Project AI concern |
|---|---|
| Creative layout | ❌ No |
| Visual design preference | ❌ No |
| Educational copy | ❌ No |
| Dummy content choice | ❌ No |
| Exact visual composition | ❌ No |
| Block family identity | ✅ Yes |
| Version identity | ✅ Yes |
| Required interfaces/contracts | ✅ Yes |
| Registry | ✅ Yes |
| Renderer | ✅ Yes |
| Composer integration | ✅ Yes |
| Runtime compatibility | ✅ Yes |
| Browser verification | ✅ Yes |
| Brand independence | ✅ Yes |
| Evidence | ✅ Yes |

One subtle point: **"match block name and version" cannot mean merely trusting a string such as `version: "I2"` in the uploaded JSON.** Project AI must verify that the implementation actually satisfies the repository's definition of that block/version. Otherwise an External AI could label any arbitrary component `Introduction I2`.

So the correct rule is:

> **Project AI does not care how the block is creatively structured or what content it contains; it cares that the implementation conforms to the repository-defined identity and technical/compliance contract for that block family/version.**

Once those gates pass, **the block becomes an eligible Tutorial Composer member**, and the learner runtime can render it alongside the existing blocks under the applicable SUIA/RTH theme. This is consistent with the architecture's Candidate → Composer → Tutorial → Browser qualification path. Explain I2 Creation Files

Yes. **That is an important additional compliance requirement.** The candidate must be brand-independent **and theme-compatible**.

The distinction is:

> **Brand independence** means the block must not be hard-coded to SUIA, RTH, or another specific brand.  
> **Theme compatibility** means the block must correctly consume the active learner/tutorial theme when it is rendered.

So Project AI should verify both.

### Correct model

```text
External AI
   │
   │ creates relevant block
   │ + content/data
   ▼
Candidate Block
   │
   ├── Correct family/version identity
   ├── Relevant educational information
   ├── Brand-independent implementation
   └── Theme-compatible implementation
             │
             ▼
       Project AI Audit
             │
      ┌──────┴────────┐
      ▼               ▼
 Brand Independence  Theme Compatibility
      │               │
      └──────┬────────┘
             ▼
      Tutorial Composer
             │
             ▼
       Tutorial JSON
             │
             ▼
       Learner Runtime
             │
      ┌──────┴──────┐
      ▼             ▼
     SUIA           RTH
    Theme          Theme
      │             │
      └──────┬──────┘
             ▼
       Candidate Block
       rendered correctly
```

### What "theme-compatible" means

The candidate should be able to receive/use the platform's existing theme context rather than bringing its own fixed brand styling.

For example, conceptually:

```text
Tutorial Runtime
      │
      ├── brand = SUIA
      ├── theme tokens
      ├── typography
      ├── spacing
      ├── component styling
      └── runtime context
              │
              ▼
        Candidate Block
```

Then the same candidate:

```text
Tutorial Runtime
      │
      ├── brand = RTH
      ├── RTH theme tokens
      └── RTH runtime context
              │
              ▼
        Same Candidate Block
```

The candidate should adapt to the supplied platform context.

### Project AI therefore needs a specific gate

I would add:

**`THEME_COMPATIBILITY`**

alongside:

- Block Family / Version
- ILS
- LSNB
- RSSB
- UBRC
- Registry
- Renderer
- Tutorial Composer
- Data Contract
- Runtime
- Browser
- Brand Independence
- Evidence

And the gate should verify that the candidate can actually render in the **real learner page using the active brand theme**, not just pass a static source-code check.

So the final qualification becomes:

```text
Candidate
   ↓
Correct Block + Version
   ↓
Compliance
   ↓
Brand Independence
   ↓
Theme Compatibility
   ↓
Tutorial Composer
   ↓
SUIA learner verification ✓
   ↓
RTH learner verification ✓
   ↓
CERTIFIED
```

One nuance: **Project AI should verify theme compatibility; External AI still owns the visual design.** Project AI is not judging whether the design is aesthetically good. It is verifying that the design can participate correctly in the platform's theme system.

That gives you the right separation:

**External AI:** what the block looks like and what relevant educational information it presents.

**Project AI:** whether that block is a valid member of the requested family/version and can safely plug into the repository, Tutorial Composer, and any supported learner-brand theme without breaking the platform.

This is also consistent with the existing architecture's requirement that the candidate ultimately be verified through the real Composer/tutorial/browser path rather than merely being accepted as source code. Explain I2 Creation Files

Yes. I reviewed the attachment material against the implementation plan, and **the second attachment is implementing the same Project LLM architecture we designed in the first attachment/conversation**. It is not a different architecture.

There is one important refinement from your latest point: **theme compatibility must be added as an explicit certification requirement alongside brand independence.**

### 1. The architecture is aligned

The implementation plan preserves the fundamental boundary:

```text
React / Next.js UI
        │
        ▼
Project AI — Python / FastAPI
        │
        ├── Workflow
        ├── Agents
        ├── Planning
        ├── Approval
        ├── Evidence queries
        └── Certification
        │
        ▼
Deterministic Discovery — TypeScript / Node
        │
        ├── D1 Structure
        ├── D2 Runtime
        ├── D3 Blocks
        ├── D4 Composer
        ├── D5 Dependencies
        ├── D6 Tests
        ├── D7 Snapshot
        └── D8 Validation
        │
        ▼
Repository
```

That exact separation is intentional: **TypeScript/Node = repository facts; Python/FastAPI = reasoning/orchestration.** The implementation material explicitly preserves the existing React/Next.js/Node/Hono product architecture rather than replacing it with Python. Explain I2 Creation Files

### 2. The implementation sequencing is also the same

The correct order remains:

```text
M1                  COMPLETE
  ↓
M2.1 Evidence       COMPLETE
  ↓
M2.2 Binding        COMPLETE
  ↓
M2.3 Toolchain
  ↓
M2.4 Composer/API
  +
M2.5 Dependencies
  ↓
M2.6 UBRC
  ↓
Evidence reconciliation
  ↓
M2.7 Runtime/Browser
  ↓
Deterministic M2 certification
  ↓
M2.8 FastAPI
  ↓
Multi-agent orchestration
  ↓
Governance / approval
  ↓
Candidate Block
  ↓
I2
  ↓
Final Project LLM certification
```

This is specifically important: **we should not jump directly into I2 implementation before the deterministic foundation is complete.** The attachment explicitly makes that sequencing decision. Explain I2 Creation Files

### 3. The multi-agent architecture is the same

The implementation plan has agents for:

- Gate Controller
- Repository Contract Auditor
- Toolchain
- Composer/API/Schema
- Dependency Graph
- UBRC
- Evidence/Reconciliation
- Runtime/Browser
- Test/Validation
- Project AI/FastAPI
- Governance/Approval
- Canonical Documentation

That matches the architecture we have been discussing. The important addition we subsequently identified is:

**Candidate Intake & Placement Agent**

This should be an explicit agent/capability because uploaded Candidate Block files must be classified and mapped to the correct existing repository locations rather than blindly copied. The attachment material explicitly recognizes this as a production-grade requirement. Explain I2 Creation Files

### 4. And your canonical-document rule is absolutely part of the architecture

Every Project AI agent should follow:

```text
Search repository
      ↓
Search snapshot
      ↓
Search evidence
      ↓
Find existing artifact
      ↓
Determine canonical artifact
      ↓
UPDATE / EXTEND / APPEND
      ↓
Only CREATE if genuinely necessary
```

So an agent must **not** generate:

```text
I2-plan.md
I2-spec.md
I2-checklist.md
I2-agent-notes.md
I2-verification.md
I2-final.md
```

just because it needs somewhere to put information.

Instead, it updates the existing canonical registry, backlog, specification, implementation documentation, tests, etc. This is explicitly part of the Project AI global policy in the implementation material. Explain I2 Creation Files

### 5. Candidate Block architecture is also the same

The intended model is **not**:

```text
Candidate Block = .tsx file
```

It is:

```text
Candidate Block
      =
Implementation
+
Type/Data Contract
+
Registry
+
Renderer
+
Composer Integration
+
Tests
+
Runtime
+
Browser Verification
+
Evidence
+
Brand Independence
+
Theme Compatibility
```

The implementation material already has essentially this model, including registry, renderer, Composer, runtime, evidence and brand independence. Explain I2 Creation Files

### 6. Your new theme requirement belongs here

This is the one requirement I would explicitly add to the implementation specification.

Current:

```text
Brand Independence
```

should become:

```text
Brand Independence
+
Theme Compatibility
```

The candidate must be:

```text
                Candidate Block
                       │
             brand-independent
                       │
                       ▼
               Tutorial Runtime
                       │
          active learner/theme context
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
      SUIA Theme                RTH Theme
          │                         │
          ▼                         ▼
      Same Block                Same Block
```

So the block is **not SUIA-styled** or **RTH-styled** internally.

It is a reusable educational implementation that consumes the theme/design-system context supplied by the actual learner tutorial runtime.

The uploaded architecture already establishes the principle that the same certified candidate can appear in different branded tutorials while remaining brand-independent. Explain I2 Creation Files

I would therefore make the final certification gates:

```text
CONTRACT
ILS
LSNB
RSSB
UBRC
REGISTRY
RENDERER
COMPOSER
TESTS
RUNTIME
BROWSER
BRAND_INDEPENDENCE
THEME_COMPATIBILITY
EVIDENCE
```

And **all must pass**.

### 7. The final learner workflow is therefore

This is the architecture I believe we should lock:

```text
Human
  │
  ▼
Project AI UI
  │
  ▼
Choose Block Family
  │
  ├── Introduction
  ├── Explanation
  ├── Example
  ├── Summary
  └── ...
  │
  ▼
Choose Version / Creation Mode
  │
  ├── Use Existing
  ├── Create From Version
  ├── Mix & Match
  └── New Candidate
  │
  ▼
Candidate Intake
  │
  ▼
Repository + Snapshot + Evidence Analysis
  │
  ▼
Placement Manifest
  │
  ├── ADD
  ├── UPDATE
  ├── EXTEND
  ├── REUSE
  └── REJECT
  │
  ▼
Human Approval
  │
  ▼
External AI Implementation
  │
  ▼
Project AI Certification
  │
  ├── Contract
  ├── ILS
  ├── LSNB
  ├── RSSB
  ├── UBRC
  ├── Registry
  ├── Renderer
  ├── Composer
  ├── Tests
  ├── Runtime
  ├── Browser
  ├── Brand Independence
  ├── Theme Compatibility
  └── Evidence
  │
  ▼
CERTIFIED CANDIDATE BLOCK
  │
  ▼
Tutorial Composer
  │
  ▼
Temporary Verification Tutorial
  │
  ▼
Actual Learner Runtime
  │
  ├── SUIA theme test
  ├── RTH theme test
  └── supported learner-brand themes
  │
  ▼
Browser Verification
  │
  ▼
PRODUCTION READY
```

### 8. Mix & Match is a separate certification object

This is another important architectural point from the attachment.

A certified implementation:

```text
Introduction I2
```

is one thing.

A composition such as:

```text
Introduction I2
+
Candidate Hero
+
I1 Media
+
I2 Footer
```

is another thing:

```text
I2-CUSTOM
```

The composition itself must pass compatibility checks before it becomes production selectable. Those checks include data/type/version/renderer/registry/Composer/runtime/brand compatibility. Explain I2 Creation Files

### 9. So yes — we are implementing the architecture we designed

I would lock the architecture as:

> **Existing SkillHubCore product remains React/Next.js/Node/Hono.  
> Project LLM deterministic repository intelligence remains TypeScript/Node.  
> Project AI becomes the Python/FastAPI reasoning and orchestration control plane.  
> External AI is the implementation worker.  
> Human approval is the authorization boundary.  
> Project AI is the evidence-driven verification/certification authority.**

And then:

> **Candidate Block → Composer → actual tutorial → actual learner theme → browser/runtime → certification**

—not merely:

> `.tsx file exists → certified`.

That is exactly the direction established across the attachments and our discussion. The remaining work is implementation of that architecture, not redesigning it. The current material itself distinguishes the already-completed M1/M2.1/M2.2 foundation from the still-pending M2.3–M2.8, orchestration, Candidate Block and I2 implementation. Pasted text (2)

**One correction I recommend we now formally lock into the specification:** `THEME_COMPATIBILITY` must be a first-class certification gate, and the final browser certification must exercise the candidate through the **real learner tutorial runtime/theme context**, not a Project AI-only preview.

I checked the **complete first attachment (840 lines)** and the **complete second attachment (490 lines)**, rather than comparing only the visible snippets.

The answer is:

> **They are architecturally compatible, but they do NOT match line-by-line as an implementation.**
>
> The first attachment defines the **Python/FastAPI + Project AI service boundary and deterministic-vs-AI architecture**.
>
> The second attachment defines the **Candidate Block / I2 creation, specification, verification, Composer, runtime, and certification workflow**.
>
> They are two layers of the same system, but the second attachment does **not yet contain all of the FastAPI implementation/code required by the first attachment**.

There are also **2 places where the wording should be tightened** so the final implementation does not drift.

---

# 1. Overall verdict

| Area | Match? | Assessment |
|---|---|---|
| Existing React/Next/Node/Hono remains intact | ✅ | Exact architectural agreement |
| FastAPI is separate Project AI service | ✅ | Compatible |
| Deterministic repository facts come from TS/Node | ✅ | Strong agreement |
| Snapshot/evidence is authoritative | ✅ | Strong agreement |
| AI reasons over evidence | ✅ | Strong agreement |
| External AI implements Candidate Block | ✅ | Second attachment explicitly says this |
| Project LLM verifies/certifies | ✅ | Exact |
| Candidate Block specification before implementation | ✅ | Exact |
| Human approval | ⚠️ Partial | Present in overall architecture, needs explicit FastAPI implementation |
| Candidate intake/upload | ⚠️ Partial | Second covers it conceptually; first does not |
| Placement manifest | ⚠️ Partial | Second/other attached material covers it, first does not |
| Multi-agent orchestration | ✅ | First defines it; second is compatible |
| Composer verification | ✅ | Exact |
| Runtime/browser verification | ✅ | Exact |
| Brand independence | ✅ | Exact |
| Theme compatibility | ⚠️ Important addition | Must explicitly be added to first/second final contract |
| I2 | ✅ | Second attachment |
| Mix & Match | ⚠️ | Covered in other attached material, not fully in these two files |
| FastAPI code | ❌ | First specifies architecture; second does not implement it |
| Candidate certification code | ❌ | Second specifies logic but does not provide complete production implementation |
| End-to-end implementation | ❌ | Both are design/implementation guidance, not complete production code |

So I would classify them:

```text
FIRST ATTACHMENT
        =
Project AI / FastAPI infrastructure architecture

SECOND ATTACHMENT
        =
Candidate Block / I2 business workflow architecture
```

They should eventually connect like this:

```text
React / Next.js Project AI UI
             │
             ▼
      Python / FastAPI
      Project AI Control Plane
             │
      ┌──────┼────────┐
      ▼      ▼        ▼
 Workflow  Agents   Governance
             │
             ▼
 TypeScript/Node Discovery
             │
             ▼
 Snapshot + Evidence
             │
             ▼
 Candidate Specification
             │
             ▼
 Human Approval
             │
             ▼
 External AI Implementation
             │
             ▼
 Deterministic Certification
             │
      ┌──────┼─────────────┐
      ▼      ▼             ▼
    UBRC   Composer      Runtime
      │      │             │
      └──────┼─────────────┘
             ▼
       Browser Verification
             │
             ▼
      Candidate Certified
             │
             ▼
             I2
```

That is the architecture I would preserve.

---

# 2. First attachment vs second attachment — section-by-section

## First attachment §1 — Existing repository stack

First attachment establishes:

```text
React
Next.js
Node
TypeScript
Hono
Cloudflare Worker
Drizzle/database
```

and says the existing platform should remain intact.

### Second attachment

It assumes the existing repository/runtime is authoritative and does not propose replacing it.

### Verdict

**✅ MATCH**

No conflict.

The second attachment's Candidate Block workflow naturally operates on top of the existing React/TypeScript runtime.

---

# 3. First attachment §2 — Existing service boundaries

First attachment says:

```text
services/api-gateway
services/skillhubcore-service
```

and explicitly says:

> Do not replace Hono with FastAPI.

### Second attachment

The second attachment does not propose replacing those services.

It instead positions Project LLM as the engineering authority around the existing product.

### Verdict

**✅ MATCH**

This is important.

The final architecture must remain:

```text
Existing Product
React / Next / Hono / DB
          │
          │
          ▼
Project AI
Python / FastAPI
```

not:

```text
React
 ↓
FastAPI replaces everything
```

---

# 4. First attachment §3 — New Project AI service

First attachment proposes:

```text
services/project-ai/
```

or equivalent.

### Second attachment

Second attachment never explicitly defines the physical Python service directory.

But it defines:

```text
Project LLM
Candidate specification
External AI
Verification
Certification
```

### Verdict

**🟡 COMPATIBLE BUT NOT SPECIFIED**

There is no contradiction.

But the second attachment needs the following architectural dependency made explicit:

```text
Candidate workflow
        ↓
Project AI FastAPI service
```

Otherwise an implementation agent might try to put the Candidate workflow directly into Next.js.

---

# 5. First attachment §4 — FastAPI responsibility

First attachment assigns Python:

```text
workflow orchestration
agent coordination
repository intelligence
evidence analysis
semantic reconciliation
AI/LLM integration
future ML/NLP
```

### Second attachment

Second attachment requires exactly those capabilities:

```text
Project LLM
 ↓
inspect repository
 ↓
identify canonical block
 ↓
produce specification
 ↓
External AI
 ↓
validation
 ↓
certification
```

### Verdict

**✅ STRONG MATCH**

The Candidate Block workflow is actually a concrete use case for the FastAPI orchestration layer.

---

# 6. First attachment §5 — Deterministic facts vs AI

This is one of the most important sections.

First attachment says:

```text
Git Repository
 ↓
Repository Discovery
 ↓
Evidence
 ↓
Snapshot
 ↓
Python AI Analysis
```

and explicitly rejects:

```text
GitHub
 ↓
LLM
 ↓
"Looks like there are 21 packages"
```

### Second attachment

Second attachment says:

> Project LLM should first inspect the repository's authoritative snapshot/evidence.

And later:

> the exact checks should come from canonical repository documentation/contracts.

### Verdict

**✅ EXACT MATCH**

This is one of the strongest matches between the two files.

---

# 7. First attachment §6 — FastAPI as control plane

First attachment defines:

```text
Existing Platform
        ↓
Project AI Service
        ↓
Project LLM Engineering Control Plane
```

### Second attachment

Second attachment defines:

```text
Candidate requirement
 ↓
Project LLM
 ↓
Candidate specification
 ↓
External AI
 ↓
Project LLM validation
 ↓
Certification
```

### Verdict

**✅ MATCH**

The second attachment is effectively one concrete workflow running inside the first attachment's control plane.

---

# 8. First attachment §7 — Project AI API

First attachment proposes APIs such as:

```text
POST /workflow/m1/start
GET  /workflow/m1/{run_id}
POST /workflow/m1/{run_id}/approve
POST /workflow/m1/{run_id}/pause
POST /workflow/m1/{run_id}/resume
POST /workflow/m1/{run_id}/cancel
```

### Second attachment

Second attachment doesn't specify these endpoints.

But its workflow clearly requires equivalent operations:

```text
create candidate
analyze
approve
implement
verify
certify
```

### Verdict

**🟡 LOGIC MATCH, API IMPLEMENTATION MISSING**

This means we should not say the second attachment has implemented these endpoints.

The FastAPI implementation still needs:

```text
POST /candidates
POST /candidates/{id}/analyze
GET  /candidates/{id}
POST /tasks/{id}/approve
POST /tasks/{id}/reject
POST /tasks/{id}/cancel
GET  /candidates/{id}/certification
```

or whatever canonical API contract is ultimately selected.

---

# 9. First attachment §8 — Multi-agent orchestration

First attachment proposes agents around:

```text
M1 gate
D1
D2
D3
D4
D5
D6
evidence
reconciliation
D7
D8
```

### Second attachment

Second attachment doesn't enumerate all those agents, but its workflow needs specialist responsibilities such as:

```text
repository analysis
specification
ILS
LSNB
RSSB
Composer
registry
renderer
runtime
browser
certification
```

### Verdict

**🟡 MATCH AT ARCHITECTURE LEVEL**

The second attachment should be implemented as additional specialist agents rather than one giant Candidate AI agent.

Recommended:

```text
Candidate Intake Agent
Candidate Placement Agent
Specification Agent
Contract Agent
ILS Agent
LSNB Agent
RSSB Agent
UBRC Agent
Registry/Renderer Agent
Composer Agent
Runtime Agent
Browser Agent
Brand Independence Agent
Theme Compatibility Agent
Certification Agent
```

---

# 10. First attachment §9 — Repository intelligence

First attachment emphasizes:

```text
AST
dependency graph
evidence graph
semantic relationships
AI reasoning
```

### Second attachment

Candidate Block verification explicitly requires:

```text
existing block/version
registry
renderer
Composer
runtime
tests
evidence
```

These all depend on repository intelligence.

### Verdict

**✅ MATCH**

The second attachment is a consumer of the repository intelligence defined in the first.

---

# 11. First attachment §10 — Block corpus

First attachment discusses:

```text
18 families
versions
implementations
renderers
routing
tests
documentation
```

### Second attachment

Second attachment says Project LLM must identify:

```text
existing canonical block/type
prerequisites
block family
version
renderer
registry
Composer
```

### Verdict

**✅ STRONG MATCH**

This is precisely why the D3 block corpus and canonical registry must exist before Candidate Block creation.

---

# 12. First attachment §11 — Evidence graph

First attachment proposes relationships such as:

```text
I1
 ├── Type
 ├── Renderer
 └── Test
        ↓
     Evidence
```

### Second attachment

Second attachment explicitly requires:

```text
evidenceId → implementation
evidenceId → type/schema
evidenceId → registry
evidenceId → renderer
evidenceId → Composer
evidenceId → tests
evidenceIds → runtime
```

### Verdict

**✅ EXACT MATCH**

This is extremely important.

The second attachment actually demonstrates why the first attachment's evidence graph is required.

---

# 13. First attachment §12 — What remains TypeScript

First attachment keeps:

```text
React
Next.js
Node
Hono
Tutorial Composer
Tutorial Renderer
database
shared contracts
```

### Second attachment

Candidate Block is explicitly implemented as:

```text
React
TypeScript
TSX
existing project types
existing renderer
existing registry
```

### Verdict

**✅ EXACT MATCH**

This is correct.

---

# 14. First attachment §13 — Potential Python service structure

First attachment proposes:

```text
services/project-ai/
  api/
  orchestration/
  agents/
  repository/
  analysis/
  evidence/
  models/
```

### Second attachment

Second attachment doesn't specify these physical directories.

### Verdict

**🟡 NOT CONFLICTING**

But implementation must map the Candidate Block logic into this structure.

---

# 15. First attachment §14–15 — D1–D8 remain TypeScript

This is the architectural decision I consider especially important.

First attachment eventually concludes:

```text
D1–D8
=
TypeScript / Node
```

and:

```text
Project AI orchestration
=
Python / FastAPI
```

### Second attachment

Second attachment requires:

```text
authoritative snapshot
authoritative evidence
deterministic validation
```

### Verdict

**✅ EXACTLY COMPATIBLE**

This should be locked.

The final architecture should be:

```text
TypeScript
=
FACTS

Python
=
REASONING + ORCHESTRATION

Human
=
APPROVAL

External AI
=
IMPLEMENTATION

Project AI
=
CERTIFICATION
```

---

# 16. First attachment §16 — Final architecture

First attachment:

```text
User
 ↓
React / Next Project AI UI
 ↓
Python/FastAPI
 ↓
TypeScript/Node Project LLM Engine
 ↓
Repository
 ↓
Snapshot/Evidence
```

### Second attachment:

```text
Candidate requirement
 ↓
Project LLM
 ↓
Candidate specification
 ↓
External AI
 ↓
Project LLM validation
 ↓
Composer
 ↓
Runtime
 ↓
Certified
```

### Verdict

**✅ MATCH**

The second attachment fits directly into the first architecture after snapshot/evidence generation.

---

# 17. First attachment §17 — What NOT to do

First attachment says don't put Python inside:

```text
apps/...
Tutorial Composer
```

and don't replace:

```text
api-gateway
skillhubcore-service
```

### Second attachment

No contradiction.

### Verdict

**✅ MATCH**

---

# 18. First attachment §18 — Recommended final architecture

First attachment ends with:

```text
D1–D8
 ↓
Snapshot
 ↓
FastAPI Project AI
 ↓
agents
 ↓
semantic analysis
 ↓
LLM
```

### Second attachment

Second attachment starts the Candidate Block workflow at:

```text
Candidate requirement
 ↓
Project LLM
```

The missing link is simply:

```text
Project AI/FastAPI
        ↓
authoritative snapshot/evidence
        ↓
Candidate Block workflow
```

### Verdict

**✅ MATCH, WITH ONE REQUIRED EXPLICIT CONNECTION**

---

# 19. Now compare the second attachment's actual Candidate workflow

This is where the second attachment goes beyond the first.

## Candidate specification

Second attachment says:

```text
Project LLM
 ↓
identify canonical block
 ↓
determine prerequisites
 ↓
produce checklist
 ↓
acceptance criteria
```

This is **not explicitly implemented in the first attachment**.

### Verdict

**🟡 SECOND ATTACHMENT ADDS REQUIRED FUNCTIONALITY**

This needs to become a FastAPI/agent capability.

---

# 20. External AI implementation

Second attachment:

```text
Project LLM
 ↓
Specification
 ↓
External AI
 ↓
React/TSX/etc.
```

First attachment does not fully define this.

### Verdict

**🟡 SECOND ATTACHMENT EXTENDS FIRST**

This is not a contradiction.

It is a downstream implementation workflow.

---

# 21. ILS / LSNB / RSSB

Second attachment explicitly requires:

```text
ILS
LSNB
RSSB
```

First attachment does not implement these.

### Verdict

**🟡 MISSING FROM FIRST ATTACHMENT**

They must become certification agents/gates.

Critically, the second attachment correctly says:

> exact rules must come from canonical repository documentation/contracts.

That rule should remain.

---

# 22. Composer

Second attachment says:

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
Tutorial
 ↓
Runtime
```

First attachment does not give this exact Candidate Block Composer journey.

### Verdict

**🟡 SECOND ATTACHMENT EXTENDS FIRST**

This should become a concrete Composer certification gate.

---

# 23. Brand independence

Second attachment explicitly requires:

```text
no SkillUp-specific
no hard-coded brand colors
no hard-coded typography
no brand URLs
no brand assets
```

First attachment discusses semantic analysis and Project AI but does not explicitly define this certification gate.

### Verdict

**🟡 SECOND ATTACHMENT ADDS A REQUIRED GATE**

It should be added to the final certification model.

---

# 24. Theme compatibility — important finding

This is the one area I would **not consider complete if we use only these two attachments**.

The later project discussion establishes:

```text
Brand Independence
≠
Theme Compatibility
```

The same certified block must work under:

```text
SUIA theme
RTH theme
other supported themes
```

using the actual tutorial runtime's theme/design-token/context.

Therefore the final gate must be:

```text
THEME_COMPATIBILITY
```

in addition to:

```text
BRAND_INDEPENDENCE
```

### Verdict

**⚠️ MUST BE ADDED EXPLICITLY**

This is important because otherwise an agent could interpret "brand-independent" as merely "doesn't contain a logo".

That is insufficient.

---

# 25. Candidate Block definition

Second attachment says:

```text
Candidate Block
=
implementation
+
contract
+
registry
+
renderer
+
Composer
+
tests
+
evidence
+
runtime verification
```

### Verdict

**✅ This should become the canonical Candidate Block definition.**

This is fully consistent with the evidence architecture.

---

# 26. Before vs after implementation

Second attachment correctly separates:

### Before implementation

```text
Candidate Block Specification
```

from:

### After implementation

```text
Candidate Block Verification
```

This is exactly right.

The system must not confuse:

```text
PLAN
```

with:

```text
CERTIFIED
```

### Verdict

**✅ EXACT MATCH WITH GOVERNANCE ARCHITECTURE**

---

# 27. The major thing that does NOT match

Here is the most important point.

The second attachment contains **logic and code fragments**, but it is **not a complete production implementation of the first attachment**.

For example, the second attachment can describe:

```text
Project LLM validates
Candidate Block
Composer
Runtime
Certification
```

but it does not implement:

```text
FastAPI service
task persistence
agent registry
workflow engine
snapshot API
evidence API
approval API
candidate API
gate controller
LLM provider abstraction
repository operation adapter
placement executor
certification engine
browser orchestration
```

Therefore:

> **Do not give the second attachment to the Project AI agent and tell it "all required code is already supplied."**

That would be incorrect.

---

# 28. What the combined implementation should look like

The two attachments should be merged conceptually into this:

```text
                    HUMAN
                      │
                      ▼
             Project AI Browser
                      │
                      ▼
              FastAPI Service
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       Workflow     Agents      Governance
          │           │            │
          └───────────┼────────────┘
                      ▼
             TypeScript Discovery
                      │
                D1–D8 / M2
                      │
                      ▼
              Snapshot + Evidence
                      │
                      ▼
          Candidate Block Specification
                      │
                      ▼
                Human Approval
                      │
                      ▼
                External AI
                      │
             React / TS / TSX
                      │
                      ▼
             Discovery Refresh
                      │
          ┌───────────┼─────────────┐
          ▼           ▼             ▼
        ILS         LSNB          RSSB
          │           │             │
          └───────────┼─────────────┘
                      ▼
                    UBRC
                      │
                      ▼
             Registry / Renderer
                      │
                      ▼
                 Composer
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
          ┌───────────┴────────────┐
          ▼                        ▼
 Brand Independence        Theme Compatibility
          │                        │
          └───────────┬────────────┘
                      ▼
                  Evidence
                      │
                      ▼
             CERTIFIED BLOCK
                      │
                      ▼
                 I2 / I2-CUSTOM
                      │
                      ▼
              Tutorial Composer
                      │
                      ▼
              Generated Tutorial
                      │
                      ▼
             Runtime + Browser
                      │
                      ▼
             PRODUCTION READY
```

---

# 29. Exact responsibility split I recommend locking

| Responsibility | Technology |
|---|---|
| Filesystem inspection | TypeScript/Node |
| Git inspection | TypeScript/Node |
| ts-morph | TypeScript/Node |
| D1–D8 | TypeScript/Node |
| Snapshot | TypeScript/Node |
| Evidence generation | TypeScript/Node |
| Evidence validation | TypeScript/Node |
| Approved tool execution | TypeScript/Node |
| Playwright adapter | TypeScript/Node |
| Project AI API | Python/FastAPI |
| Workflow state | Python/FastAPI |
| Agent orchestration | Python/FastAPI |
| Planning | Python/FastAPI |
| LLM integration | Python/FastAPI |
| Candidate specification | Python/FastAPI |
| Candidate intake | Python/FastAPI |
| Placement manifest | Python/FastAPI |
| Approval governance | Python/FastAPI |
| Certification orchestration | Python/FastAPI |
| Semantic reconciliation | Python/FastAPI |
| Project AI UI | React/Next.js |
| Tutorial Composer | Existing TypeScript |
| Tutorial runtime | Existing TypeScript |
| Candidate implementation | External AI |
| Human approval | Human |
| Final certification | Project AI |

This is the cleanest reconciliation of the two attachments.

---

# 30. Final answer to your question

### Does the task in attachment 1 match the logic in attachment 2?

**Yes — architecturally.**

### Does the implementation/code in attachment 2 completely implement attachment 1?

**No.**

### Does attachment 2 contradict attachment 1?

**No major contradiction.**

### Does attachment 2 add requirements that attachment 1 didn't explicitly implement?

**Yes.** Specifically:

```text
Candidate Block Specification
Candidate Intake
External AI handoff
ILS
LSNB
RSSB
Registry verification
Renderer verification
Composer verification
Brand independence
I2
Candidate certification
```

And from the later agreed architecture:

```text
Theme compatibility
Mix-and-match compatibility
Placement manifest
Human approval
Browser certification
```

### Is the deterministic-vs-AI boundary consistent?

**Yes, very strongly.**

```text
TS/Node
=
authoritative repository facts

FastAPI
=
AI orchestration/reasoning

External AI
=
implementation

Human
=
approval

Project AI
=
verification/certification
```

### Is there anything I would change before implementation?

**Yes: lock the following three things into the canonical implementation specification:**

1. **D1–D8 remain TypeScript/Node.**
2. **FastAPI owns Project AI orchestration, agents, governance, planning, and certification—not the existing product runtime.**
3. **Candidate certification must include both `BRAND_INDEPENDENCE` and `THEME_COMPATIBILITY`.**

The first attachment itself already strongly supports the first two points, while the second attachment supplies the Candidate Block certification workflow that consumes them. Implement GitHub Evidence Explain I2 Creation Files

So the two documents should **not be treated as competing specifications**. They should be treated as **Layer A (Project AI infrastructure) + Layer B (Candidate/I2 workflow)** and consolidated into the canonical implementation plan before agents start coding.