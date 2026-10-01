# Project LLM & External AI Block Lifecycle Architecture V1

**Document Type:** Reference Architecture  
**Status:** DRAFT (Reference, not frozen governance)  
**Date:** 2026-10-01  
**Authority:** Derived from Phase 0.1-0.10 Frozen Governance Framework  
**Purpose:** Define the External AI → Human → Project LLM → Tutorial Platform block lifecycle

---

## RELATIONSHIP TO PHASE 0 GOVERNANCE

This document defines the **implementation architecture** for the tutorial block creation, integration, and certification lifecycle governed by Phase 0.1-0.10.

**Phase 0 establishes the rules. This document establishes how to build a system that follows those rules.**

### Governing Contracts

- **Phase 0.1:** AI Roles & Responsibility (actor boundaries)
- **Phase 0.2:** Human Approval (Gate 1 prototype approval, Gate 2 final approval)
- **Phase 0.3:** Repository Modification (permitted/prohibited operations)
- **Phase 0.4:** Runtime Boundary (build/test/dev constraints)
- **Phase 0.5:** Handoff Protocol (External AI → Project LLM candidate package)
- **Phase 0.6:** Evidence & Certification (evidence standards, certification vs readiness)
- **Phase 0.7:** Validation & Testing (validation requirements, evidence production)
- **Phase 0.8:** STOP Conditions (STOP triggers, escalation, resolution)
- **Phase 0.9:** Rollback & Recovery (rollback procedures, checkpoint preservation)
- **Phase 0.10:** Contract Versioning & Evolution (governance evolution)

**This document does NOT modify Phase 0 governance. It operationalizes it.**

---

## PURPOSE AND SCOPE

This architecture defines:

1. **Who creates tutorial blocks** (External AI as Block Factory)
2. **Who integrates blocks into the platform** (Project LLM as Integration & Certification Engine)
3. **Who approves blocks for production** (Human as Approval & Architecture Authority)
4. **How blocks move from concept to production** (two distinct handovers)
5. **What each actor is responsible for** (responsibility matrix)
6. **How platform runtimes are verified** (UBRC, ILS, LSNB, RSSB)
7. **How evidence is produced** (validation → certification → approval)

### What This Architecture Enables

- **External AI** can create tutorial blocks without owning the repository
- **Project LLM** can integrate blocks without bypassing governance
- **Human** can approve blocks based on evidence rather than blind trust
- **Platform runtimes** (UBRC, ILS, LSNB, RSSB) remain architecturally consistent
- **Tutorial Composer** receives properly integrated blocks
- **Validation** produces evidence rather than assumptions

---

## THREE ACTORS

### Actor 1: External AI (Block Factory)

**Role:** Tutorial Block Factory

**Responsibility:**
- Interpret learning requirements
- Design visual/UX
- Create HTML/CSS/JS/JSON prototype
- Convert prototype to React/TypeScript candidate
- Define content schema
- Create candidate tests
- Produce candidate documentation
- Self-validate candidate
- Package candidate for handoff

**Does NOT Own:**
- Repository architecture
- Platform integration
- UBRC runtime implementation
- ILS runtime implementation
- LSNB runtime implementation
- RSSB runtime implementation
- Tutorial Composer integration
- Production certification
- Final approval authority

**Boundary:**
External AI is aware of platform constraints but does not implement platform infrastructure.

---

### Actor 2: Project LLM (Platform Integration & Certification Engine)

**Role:** Repository Engineer + Integration Engineer + Validation Engineer + Evidence Producer

**Responsibility:**
- Inspect actual repository architecture
- Prepare External AI Creation Brief
- Receive and validate candidate package
- Audit candidate against real architecture
- Adapt candidate to platform conventions
- Integrate into Tutorial Composer
- Integrate into Canonical Document Builder
- Integrate into TutorialBlockRenderer
- Verify UBRC runtime participation
- Verify ILS runtime participation
- Verify LSNB relationship (where applicable)
- Verify RSSB relationship (where applicable)
- Execute validation pipeline (unit → component → integration → E2E)
- Produce certification evidence
- Establish CERTIFICATION_READY status

**Does NOT Own:**
- Learning requirement interpretation (External AI)
- Gate 1 prototype approval (Human)
- Final production approval (Human)
- Architecture decisions requiring Human authority (Human)
- Universal infrastructure changes without approval (governed by Phase 0.3, 0.8)

**Boundary:**
Project LLM owns repository integration and technical certification, but cannot bypass Human approval gates (Phase 0.2).

---

### Actor 3: Human (Approval & Architecture Authority)

**Role:** Architecture Authority + Approval Authority

**Responsibility:**
- Define learning requirements
- Review External AI Creation Brief
- Provide brief to External AI
- Gate 1: Approve/reject prototype
- Resolve STOP conditions (Phase 0.8)
- Approve universal architecture changes
- Gate 2: Final production approval
- Override technical certification when warranted

**Does NOT Own:**
- Candidate engineering (External AI)
- Repository integration (Project LLM)
- UBRC/ILS/LSNB/RSSB runtime verification (Project LLM)
- Evidence production (Project LLM)

**Boundary:**
Human makes governance decisions; Project LLM produces technical evidence to support those decisions.

---

## TWO DISTINCT HANDOVERS

### Handover A: Project LLM → Human → External AI

**Direction:** Project LLM → Human → External AI

**Artifact:** External AI Creation Brief

**Purpose:** Give External AI sufficient platform context to create a compatible candidate

**Flow:**
```
Learning Requirement
        ↓
Project LLM inspects repository
        ↓
Project LLM prepares External AI Creation Brief
        ↓
Human reviews brief
        ↓
Human provides brief to External AI
        ↓
External AI begins work
```

**Content:**
- Block identity and purpose
- Learning requirements
- Visual/UX requirements
- Responsive requirements
- Accessibility requirements
- Technology target (React, TypeScript, Tailwind)
- Platform compatibility constraints (UBRC, ILS, LSNB, RSSB awareness)
- Forbidden operations (no direct API calls, no database access, no auth logic)
- Required deliverables (prototype, React candidate, schema, tests, documentation)

**Critical Rule:**
External AI receives **compatibility constraints**, not **implementation ownership**.

---

### Handover B: External AI → Project LLM

**Direction:** External AI → Project LLM

**Artifact:** Candidate Implementation Package

**Purpose:** Transfer candidate block from External AI to Project LLM for platform integration

**Flow:**
```
External AI completes candidate
        ↓
External AI packages candidate
        ↓
External AI hands package to Project LLM
        ↓
Project LLM validates package
        ↓
Project LLM accepts/rejects handoff
        ↓
If accepted: Project LLM integration begins
```

**Content:**
- Prototype (HTML/CSS/JS/JSON)
- React components (TypeScript)
- Content schema
- Candidate tests
- Accessibility evidence
- Responsive evidence
- Documentation
- Self-validation results
- Candidate manifest
- Handoff report

**Critical Rule:**
Candidate self-validation ≠ production certification. Project LLM independently verifies all claims.

---

## COMPLETE LIFECYCLE DIAGRAM

```
                    HUMAN
                      │
                      │ defines requirement
                      ▼
               PROJECT LLM
                      │
        ┌─────────────┴─────────────┐
        │ Repository Inspection     │
        │ Architecture Discovery    │
        │ Platform Constraints      │
        └─────────────┬─────────────┘
                      │
                      ▼
       EXTERNAL AI CREATION BRIEF
                      │
                      ▼
                    HUMAN
                      │
                      │ reviews + provides to External AI
                      ▼
              EXTERNAL FREE AI
          (Gemini / Claude / GPT)
                      │
        ┌─────────────┴─────────────┐
        │ Learning Interpretation   │
        │ Visual Design             │
        │ UX Design                 │
        └─────────────┬─────────────┘
                      │
                      ▼
            HTML/CSS/JS/JSON
                PROTOTYPE
                      │
                      ▼
              HUMAN GATE 1
           (Prototype Approval)
                      │
         ┌────────────┼────────────┐
         │            │            │
      APPROVE   CONDITIONAL    REJECT
         │                         │
         ▼                         ▼
   EXTERNAL AI                  END
         │
         │ converts to React/TypeScript
         ▼
   CANDIDATE PACKAGE
    (React/TS/schema/tests)
         │
         ▼
    PROJECT LLM
         │
         ├── Handoff Verification
         ├── Repository Audit
         ├── Architecture Audit
         ├── Candidate Adaptation
         │
         ▼
   PLATFORM INTEGRATION
         │
         ├── Canonical Schema
         ├── Canonical Block Type
         ├── Tutorial Document Builder
         ├── Tutorial Composer
         ├── TutorialBlockRenderer
         │
         ▼
   RUNTIME INTEGRATION
         │
         ├── UBRC (Universal Block Runtime Contract)
         ├── ILS (Intelligent Learning Sequence)
         ├── LSNB (Learner State Navigation Bridge)
         └── RSSB (Resume State Synchronization Bridge)
         │
         ▼
   VALIDATION PIPELINE
         │
         ├── Unit Tests
         ├── Component Tests
         ├── Integration Tests
         ├── Runtime Tests
         ├── E2E Tests
         ├── Accessibility Tests
         ├── Responsive Tests
         ├── Security Tests
         │
         ▼
   EVIDENCE PRODUCTION
         │
         ├── Architecture Audit Evidence
         ├── Integration Evidence
         ├── UBRC Evidence
         ├── ILS Evidence
         ├── LSNB Evidence
         ├── RSSB Evidence
         ├── Validation Evidence
         ├── Test Results
         │
         ▼
   CERTIFICATION_READY
         │
         ▼
       HUMAN
    GATE 2 REVIEW
         │
         ▼
   FINAL APPROVAL
         │
    ┌────┴────┐
    │         │
 APPROVE   REJECT
    │
    ▼
CERTIFIED BLOCK
    │
    ▼
PRODUCTION
```

---

## WORKED EXAMPLE: SUMMARY BLOCK

### Step 1: Human Defines Requirement

```
Requirement:
Create a Summary Tutorial Block

Purpose:
Provide learner-facing consolidation of key concepts
at the end of a tutorial or subtopic

Expected Content:
- Summary title
- Key takeaways (bullets or paragraphs)
- Optional examples
- Optional callout

Classification:
Instructional block (ILS participation)
```

---

### Step 2: Project LLM Inspects Repository

Before creating the External AI brief, Project LLM inspects the **actual repository**:

```
Current Block Architecture:
- TutorialBlock union type
- BlockType discriminator
- Canonical schema model
- Tutorial Document Builder
- TutorialBlockRenderer registry
- Tutorial Composer

Existing Block Types:
- introduction
- content
- quiz
- code
- ...

Does 'summary' exist?
NO → new block type required

Current UBRC Model:
- data-block-id (required)
- data-block-type (required)
- data-block-version (required)
- ActiveBlockContext observation

Current ILS Model:
- Universal ILS runtime
- Passive block participation
- No direct API calls
- Block provides identity, runtime observes

Current LSNB Model:
- progressRole classification
- ILS → completion evaluation → LSNB
- Block does not directly write LSNB

Current RSSB Model:
- Universal synchronization runtime
- Block does not implement sync
- Platform handles cross-tab/device state

Current Conventions:
- TypeScript strict mode
- Functional React components
- Tailwind for styling
- Accessibility required
- Responsive required
- SSR compatible
```

---

### Step 3: Project LLM Prepares External AI Creation Brief

```markdown
# SUMMARY BLOCK — EXTERNAL AI CREATION BRIEF

## 1. BLOCK IDENTITY

Name: Summary
Type: summary
Purpose: Learner-facing consolidation of tutorial key concepts

## 2. LEARNING REQUIREMENTS

Primary User: Learner
Learning Intent: Reinforce key concepts and takeaways

Required Content:
- Summary title (string)
- Key takeaways (array of strings or rich text)
- Optional explanation (rich text)
- Optional examples (array)

## 3. VISUAL & UX REQUIREMENTS

Style: Professional, readable, scannable
Layout: Vertical flow, clear hierarchy
Typography: Heading + body text
Visual Treatment: Distinct from surrounding content
Interaction: Primarily static (informational)

## 4. RESPONSIVE REQUIREMENTS

Must work at:
- Desktop (1024px+)
- Tablet (768px-1023px)
- Mobile (320px-767px)

## 5. ACCESSIBILITY REQUIREMENTS

Must support:
- Semantic HTML
- Accessible headings (h2, h3, etc.)
- Keyboard navigation (if interactive)
- Screen reader compatibility
- ARIA only where necessary (not decorative)

## 6. TECHNOLOGY TARGET

Framework: React 18+
Language: TypeScript (strict mode)
Styling: Tailwind CSS (project conventions)
Component Type: Functional component
Props: TypeScript interface required
Content: JSON-compatible schema

## 7. UBRC COMPATIBILITY CONSTRAINTS

The resulting candidate must be compatible with the project's
Universal Block Runtime Contract (UBRC).

The root runtime element must support:
- data-block-id
- data-block-type
- data-block-version

The component must expose required canonical TutorialBlock identity.

DO NOT implement:
- Custom telemetry
- Custom completion logic
- Direct ILS API calls

## 8. ILS COMPATIBILITY CONSTRAINTS

This block will participate in the Universal ILS Runtime.

DO NOT create:
- Local timer
- Direct POST to ILS API
- Independent learning-state persistence
- Custom completion implementation

The block should remain passive. The platform runtime will observe it.

## 9. LSNB COMPATIBILITY CONSTRAINTS

DO NOT directly write LSNB state.
DO NOT create navigation progress records.
DO NOT implement completion persistence.

The candidate must remain compatible with platform LSNB relationship.
Project LLM will verify actual participation during integration.

## 10. RSSB COMPATIBILITY CONSTRAINTS

DO NOT directly publish RSSB state.
DO NOT implement independent synchronization.
DO NOT create cross-tab/device persistence.

Preserve runtime boundaries required for Project LLM integration.

## 11. FORBIDDEN OPERATIONS

NO:
- Database access
- Authentication logic
- Authorization logic
- Direct API calls (/api/tutorial/...)
- Direct telemetry
- Direct learning-state writes
- Direct navigation-state writes
- Direct completion persistence

## 12. REQUIRED DELIVERABLES

Prototype:
- prototype/index.html
- prototype/style.css
- prototype/script.js
- prototype/data.json

React Candidate:
- react/SummaryBlock.tsx
- react/SummaryBlock.types.ts
- react/SummaryBlock.module.css (if needed)

Schema:
- schema/summary-block-schema.ts

Tests:
- tests/SummaryBlock.test.tsx
- tests/SummaryBlock.accessibility.test.tsx

Documentation:
- docs/SummaryBlock.md

Self-Validation:
- self-validation/report.md

Package:
- candidate-manifest.json
- handoff-report.md
```

---

### Step 4: Human Reviews Brief

Human receives the brief from Project LLM.

Human verifies:
- Learning requirements accurate
- UX expectations clear
- Technology constraints appropriate
- Platform constraints correctly described

Human Decision: APPROVE brief

---

### Step 5: Human Provides Brief to External AI

Human copies the brief and provides it to External AI (Gemini, Claude, GPT, etc.).

Human says:

> "Create a Summary Tutorial Block according to this specification."

---

### Step 6: External AI Creates HTML/CSS/JS Prototype

External AI produces:

```
summary-block-prototype/
├── index.html
├── style.css
├── script.js
└── data.json
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summary Block Prototype</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="summary-block">
        <h2 class="summary-title"></h2>
        <div class="summary-content"></div>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

**style.css:**
```css
.summary-block {
    background: #f9fafb;
    border-left: 4px solid #3b82f6;
    padding: 1.5rem;
    border-radius: 0.5rem;
}

.summary-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

/* ... responsive, accessible styling ... */
```

**script.js:**
```javascript
// Load data.json and render
fetch('data.json')
    .then(res => res.json())
    .then(data => {
        document.querySelector('.summary-title').textContent = data.title;
        // render takeaways
    });
```

**data.json:**
```json
{
    "title": "Key Takeaways",
    "takeaways": [
        "React components are reusable UI elements",
        "Props allow data to flow down the component tree",
        "State management enables dynamic behavior"
    ]
}
```

---

### Step 7: Human Gate 1 (Prototype Approval)

Human reviews the **visual prototype** in browser.

Human evaluates:
- Does this look right for a Summary Block?
- Is the visual hierarchy clear?
- Is it responsive?
- Is it accessible?
- Does it match project aesthetic?

**Human does NOT evaluate:**
- UBRC integration (not yet implemented)
- ILS integration (not yet implemented)
- Composer integration (not yet implemented)
- Production certification (not yet applicable)

**Human Decision:** APPROVE

(Or CONDITIONAL APPROVE with feedback, or REJECT)

---

### Step 8: External AI Converts to React/TypeScript

After Gate 1 approval, External AI engineers the React candidate:

**SummaryBlock.tsx:**
```typescript
import React from 'react';
import type { SummaryBlockData } from './SummaryBlock.types';

interface SummaryBlockProps {
    blockId: string;
    data: SummaryBlockData;
}

export function SummaryBlock({ blockId, data }: SummaryBlockProps) {
    return (
        <div
            data-block-id={blockId}
            data-block-type="summary"
            data-block-version="1"
            className="summary-block"
        >
            <h2 className="summary-title">{data.title}</h2>
            <ul className="summary-takeaways">
                {data.takeaways.map((takeaway, index) => (
                    <li key={index}>{takeaway}</li>
                ))}
            </ul>
        </div>
    );
}
```

**SummaryBlock.types.ts:**
```typescript
export interface SummaryBlockData {
    title: string;
    takeaways: string[];
    explanation?: string;
}

export interface SummaryBlock {
    type: 'summary';
    id: string;
    data: SummaryBlockData;
}
```

**SummaryBlock.test.tsx:**
```typescript
import { render, screen } from '@testing-library/react';
import { SummaryBlock } from './SummaryBlock';

describe('SummaryBlock', () => {
    it('renders title and takeaways', () => {
        const data = {
            title: 'Key Takeaways',
            takeaways: ['Point 1', 'Point 2']
        };
        
        render(<SummaryBlock blockId="summary-1" data={data} />);
        
        expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
        expect(screen.getByText('Point 1')).toBeInTheDocument();
    });
});
```

---

### Step 9: External AI Packages Candidate

External AI creates the complete candidate package:

```
summary-block-candidate-v1/
├── prototype/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── data.json
├── react/
│   ├── SummaryBlock.tsx
│   ├── SummaryBlock.types.ts
│   └── index.ts
├── schema/
│   └── summary-block-schema.ts
├── tests/
│   ├── SummaryBlock.test.tsx
│   └── SummaryBlock.accessibility.test.tsx
├── documentation/
│   └── SummaryBlock.md
├── self-validation/
│   └── validation-report.md
├── candidate-manifest.json
└── handoff-report.md
```

**candidate-manifest.json:**
```json
{
    "candidateId": "summary-block-v1",
    "blockType": "summary",
    "externalAI": "Claude 3.5 Sonnet",
    "createdDate": "2026-10-01",
    "gate1Status": "APPROVED",
    "gate1Date": "2026-10-01",
    "prototypeIncluded": true,
    "reactCandidateIncluded": true,
    "testsIncluded": true,
    "selfValidation": "PASS",
    "ubrcCompatibility": "CANDIDATE_COMPATIBLE",
    "ilsCompatibility": "CANDIDATE_COMPATIBLE",
    "lsnbCompatibility": "CANDIDATE_COMPATIBLE",
    "rssb Compatibility": "N/A",
    "forbiddenOperations": "NONE_DETECTED"
}
```

---

### Step 10: External AI Hands Package to Project LLM

External AI provides the complete package to Project LLM.

Project LLM begins **Handover B validation**.

---

### Step 11: Project LLM Validates Handover Package

```
HANDOVER VALIDATION
───────────────────

Manifest present:              ✓
Gate 1 status:                 APPROVED ✓
Prototype present:             ✓
React candidate present:       ✓
TypeScript types present:      ✓
Schema present:                ✓
Tests present:                 ✓
Documentation present:         ✓
Self-validation present:       ✓
Forbidden operations:          NONE ✓
Package integrity:             ✓

Decision: ACCEPT HANDOFF
```

---

### Step 12: Project LLM Performs Repository Audit

Project LLM inspects the **actual repository** (not External AI's assumptions):

```
REPOSITORY AUDIT
────────────────

Block type 'summary' exists?
NO → new block type required

Current block types:
- introduction
- content
- quiz
- code

Block type union location:
packages/tutorial-engine/src/types/blocks.ts

Canonical schema location:
packages/tutorial-engine/src/schemas/

Document Builder location:
packages/tutorial-engine/src/builders/

Renderer registry:
packages/tutorial-engine/src/renderers/registry.ts

Composer registry:
apps/realtutorialhub-web/src/features/tutorial-composer/

UBRC implementation:
packages/tutorial-engine/src/runtime/ubrc/

ILS runtime:
packages/tutorial-engine/src/runtime/ils/

LSNB integration:
packages/tutorial-engine/src/runtime/lsnb/

RSSB integration:
NOT APPLICABLE for instructional blocks

Test location:
packages/tutorial-engine/src/blocks/__tests__/

Conventions:
- Functional components
- TypeScript strict
- Tailwind utility classes
- Accessibility required
- SSR compatible
```

---

### Step 13: Project LLM Performs Architecture Audit

```
ARCHITECTURE AUDIT
──────────────────

Candidate: SummaryBlock

[1] Block Type Definition
External AI: 'summary'
Repository: Does not exist yet
Decision: CREATE new block type

[2] Canonical Schema
External AI: SummaryBlockData interface
Repository: Must conform to canonical schema pattern
Decision: ADAPT to canonical pattern

[3] React Component
External AI: Functional component with data-block-* attributes
Repository: Correct pattern
Decision: VERIFY UBRC compliance

[4] Renderer Registration
External AI: Not included (expected)
Project LLM: REQUIRED
Decision: CREATE renderer registration

[5] Composer Registration
External AI: Not included (expected)
Project LLM: REQUIRED
Decision: CREATE Composer integration

[6] UBRC Participation
External AI: data-block-id, data-block-type, data-block-version present
Repository: Must actually participate in ActiveBlockContext
Decision: VERIFY runtime participation

[7] ILS Participation
External AI: No direct API calls (correct)
Repository: Must participate via Universal ILS runtime
Decision: VERIFY passive participation

[8] LSNB Relationship
External AI: No direct LSNB writes (correct)
Repository: Must have progressRole classification
Decision: CLASSIFY as 'instructional', VERIFY LSNB relationship

[9] RSSB Relationship
External AI: Not implemented
Repository: Not applicable for instructional Summary block
Decision: N/A

[10] Tests
External AI: Unit tests included
Repository: Must add integration and E2E tests
Decision: EXTEND test coverage

[11] Accessibility
External AI: Semantic HTML claimed
Repository: Must independently verify
Decision: RUN accessibility tests

[12] Responsive Behavior
External AI: Responsive CSS claimed
Repository: Must independently verify
Decision: RUN responsive tests

[13] SSR Compatibility
External AI: Not verified
Repository: Must verify SSR rendering
Decision: RUN SSR tests

[14] Security
External AI: No forbidden operations detected
Repository: Must independently verify
Decision: RUN security audit

AUDIT RESULT: ADAPTATIONS REQUIRED
```

---

### Step 14: Project LLM Adapts Candidate

```
ADAPTATIONS APPLIED
───────────────────

[1] Canonical Schema
Original:
  export interface SummaryBlockData { ... }

Adapted:
  Added to canonical block schema union
  Conforms to TutorialBlock pattern

[2] Block Type Union
Added 'summary' to BlockType discriminator

[3] Document Builder
Created canonical SummaryBlock builder function

[4] Renderer Registration
Registered SummaryBlock in TutorialBlockRenderer

[5] Composer Integration
Added Summary block to Composer palette
Created Composer block definition
Implemented block creation handler

[6] UBRC Runtime
Verified data-block-* attributes
Confirmed ActiveBlockContext compatibility

[7] ILS Runtime
Verified passive participation
No direct API calls
Universal runtime observation

[8] LSNB Classification
progressRole: 'instructional'
ILS completion → LSNB relationship established

[9] Tests Extended
Added integration tests
Added E2E tests
Added UBRC runtime tests
Added ILS runtime tests

[10] File Locations
packages/tutorial-engine/src/blocks/SummaryBlock.tsx
packages/tutorial-engine/src/types/blocks.ts (updated)
packages/tutorial-engine/src/schemas/summary.ts
packages/tutorial-engine/src/builders/summary.ts
packages/tutorial-engine/src/renderers/registry.ts (updated)
apps/realtutorialhub-web/src/features/tutorial-composer/ (updated)
```

---

### Step 15: Project LLM Integrates into Tutorial Composer

```
COMPOSER INTEGRATION
────────────────────

[1] Block Type Registration
Added 'summary' to Composer block types

[2] Palette Entry
Created Summary block icon and label
Added to Composer sidebar palette

[3] Block Creator
Implemented createSummaryBlock() handler
Returns canonical SummaryBlock structure

[4] Serialization
Verified Summary block serializes to Tutorial Document

[5] Document Builder
Verified Tutorial Document Builder handles 'summary' type

[6] Deserialization
Verified Composer can load documents containing Summary blocks

[7] Drag & Drop
Verified Summary block drag-and-drop behavior

[8] Property Editor
Verified Summary block property editing (title, takeaways)

COMPOSER INTEGRATION: COMPLETE
```

---

### Step 16: Project LLM Verifies UBRC Runtime

```
UBRC RUNTIME VERIFICATION
──────────────────────────

[1] DOM Identity
Rendered block contains:
  data-block-id="summary-abc123"
  data-block-type="summary"
  data-block-version="1"
Status: ✓

[2] ActiveBlockContext
Block recognized by ActiveBlockContext
Status: ✓

[3] Block Observation
Universal runtime observes block lifecycle
Status: ✓

[4] Identity Propagation
Block identity available to ILS runtime
Status: ✓

UBRC VERIFICATION: PASS
Evidence: ubrc-runtime-test-summary-block.log
```

---

### Step 17: Project LLM Verifies ILS Runtime

```
ILS RUNTIME VERIFICATION
────────────────────────

[1] Passive Participation
Block does not implement timer: ✓
Block does not POST telemetry: ✓
Block does not call ILS API: ✓

[2] Universal Runtime Observation
ILS runtime detects block entry: ✓
ILS runtime tracks active time: ✓
ILS runtime evaluates completion: ✓

[3] Expected Time
Block metadata includes expectedTimeSec: ✓

[4] Completion Evaluation
ILS evaluates completion based on:
  - Active time threshold
  - Expected time
Status: ✓

[5] Database Evidence
ils_block_activity records created: ✓
Tutorial progress updated: ✓

ILS VERIFICATION: PASS
Evidence: ils-runtime-test-summary-block.log
Database: ils_block_activity table screenshot
```

---

### Step 18: Project LLM Verifies LSNB Relationship

```
LSNB VERIFICATION
─────────────────

[1] Progress Role Classification
Summary block progressRole: 'instructional'
Status: ✓

[2] ILS → LSNB Flow
ILS completion evaluation: ✓
Canonical learning progress: ✓
LSNB updated via platform: ✓

[3] Block Does NOT Directly Write LSNB
No direct LSNB API calls: ✓
No local navigation state: ✓

[4] Database Evidence
learner_sequence_navigation_bridge records: ✓
Tutorial completion: ✓

LSNB VERIFICATION: PASS
Evidence: lsnb-runtime-test-summary-block.log
```

---

### Step 19: Project LLM Verifies RSSB

```
RSSB VERIFICATION
─────────────────

Summary Block Classification: Instructional

RSSB Participation: NOT APPLICABLE

Reason:
Summary block does not maintain resumable state.
It is informational/instructional content.

No RSSB verification required.

RSSB VERIFICATION: N/A
```

---

### Step 20: Project LLM Runs Validation Pipeline

```
VALIDATION PIPELINE
───────────────────

L1: Static Analysis
TypeScript compilation: ✓
ESLint: ✓
Type checking: ✓

L2: Unit Tests
SummaryBlock unit tests: ✓
Coverage: 95%

L3: Component Tests
SummaryBlock component tests: ✓
Accessibility tests: ✓
Responsive tests: ✓

L4: Integration Tests
Composer integration: ✓
Renderer integration: ✓
Document Builder: ✓

L5: Runtime Tests
UBRC: ✓
ILS: ✓
LSNB: ✓
RSSB: N/A

L6: E2E Tests
Create tutorial with Summary block: ✓
Render Summary block: ✓
Observe ILS participation: ✓
Complete Summary block: ✓
Verify learning progress: ✓

L7: Quality Attributes
Accessibility (WCAG 2.1 AA): ✓
Performance (< 100ms render): ✓
Security (no XSS vulnerabilities): ✓
SSR compatibility: ✓

L8: Certification Readiness
All validations passed: ✓

VALIDATION: COMPLETE
```

---

### Step 21: Project LLM Produces Evidence Package

```
SUMMARY BLOCK CERTIFICATION PACKAGE
────────────────────────────────────

1. Original prototype (HTML/CSS/JS)
2. Human Gate 1 approval record
3. External AI candidate package
4. Repository audit report
5. Architecture audit report
6. Adaptation report
7. Composer integration evidence
8. UBRC runtime evidence
9. ILS runtime evidence
10. LSNB evidence
11. RSSB evidence (N/A justification)
12. Accessibility test results
13. Responsive test results
14. SSR test results
15. Security audit results
16. Unit test results (95% coverage)
17. Component test results
18. Integration test results
19. E2E test results
20. Build evidence (successful)
21. Runtime logs
22. Database evidence screenshots
23. Git commit (integration branch)
24. Remaining exceptions: NONE

TECHNICAL CERTIFICATION STATUS: CERTIFICATION_READY
```

---

### Step 22: Project LLM Presents Evidence to Human

Project LLM provides Human with the complete certification package.

**Project LLM Report:**

```
SUMMARY BLOCK — CERTIFICATION REPORT

Block Type: summary
Candidate: External AI (Claude 3.5 Sonnet)
Gate 1 Status: APPROVED (2026-10-01)

Repository Integration: COMPLETE
Composer Integration: COMPLETE
UBRC Verification: PASS
ILS Verification: PASS
LSNB Verification: PASS
RSSB Verification: N/A (not applicable)

Validation: ALL PASSED
Evidence: COMPLETE

Technical Certification Status: CERTIFICATION_READY

Recommended Human Decision: APPROVE FOR PRODUCTION

Evidence Package: [link]
Git Branch: feature/summary-block
Commit: abc123...
```

---

### Step 23: Human Gate 2 (Final Approval)

Human reviews:
- Technical certification report
- Evidence package
- Git diff
- Live demo in development environment

Human verifies:
- Block works as intended
- Learning experience is appropriate
- No architectural violations
- Platform integration is correct
- Evidence is credible

**Human Decision: APPROVE FOR PRODUCTION**

(Or CONDITIONAL APPROVE, RETURN TO DRAFT, or REJECT)

---

### Step 24: Certified Block

After Human approval:

```
Summary Block: CERTIFIED

Status: APPROVED FOR PRODUCTION
Approval Date: 2026-10-01
Approval Authority: Human Architecture Authority

Git: Merged to main
Deployment: Included in next release

Available In:
- Tutorial Composer
- Tutorial Page rendering
- UBRC runtime
- ILS runtime
- LSNB progression
```

---

## RESPONSIBILITY MATRIX

| Responsibility | External AI | Project LLM | Human |
|---|:---:|:---:|:---:|
| **Learning Interpretation** | ✅ Own | Review | Define |
| **Visual Design** | ✅ Own | Review | Approve (Gate 1) |
| **UX Design** | ✅ Own | Review | Approve (Gate 1) |
| **HTML/CSS/JS Prototype** | ✅ Own | Inspect | Approve (Gate 1) |
| **JSON Content Model** | ✅ Own | Audit/Adapt | Review |
| **React/TS Candidate** | ✅ Own | Audit/Adapt | — |
| **Candidate Tests** | ✅ Own | Extend | — |
| **Accessibility (Candidate)** | ✅ Own/Test | Verify Independently | — |
| **Responsive (Candidate)** | ✅ Own/Test | Verify Independently | — |
| **UBRC Awareness** | ✅ Required | — | — |
| **UBRC Integration** | ❌ | ✅ Own | — |
| **UBRC Verification** | ❌ | ✅ Own | Review Evidence |
| **ILS Awareness** | ✅ Required | — | — |
| **ILS Integration** | ❌ | ✅ Own | — |
| **ILS Verification** | ❌ | ✅ Own | Review Evidence |
| **LSNB Awareness** | ✅ Required | — | — |
| **LSNB Integration** | ❌ | ✅ Own | — |
| **LSNB Verification** | ❌ | ✅ Own | Review Evidence |
| **RSSB Awareness** | ✅ Required | — | — |
| **RSSB Integration** | ❌ | ✅ Own | — |
| **RSSB Verification** | ❌ | ✅ Own | Review Evidence |
| **Canonical Schema** | ❌ | ✅ Own | — |
| **Document Builder** | ❌ | ✅ Own | — |
| **Composer Integration** | ❌ | ✅ Own | — |
| **Renderer Integration** | ❌ | ✅ Own | — |
| **Repository Modification** | ❌ | ✅ Own (Governed) | Approve if universal |
| **E2E Tests** | ❌ | ✅ Own | — |
| **Runtime Verification** | ❌ | ✅ Own | — |
| **Evidence Production** | Candidate Self-Validation | ✅ Own (Technical) | — |
| **Technical Certification** | ❌ | ✅ Own (CERTIFICATION_READY) | — |
| **Production Certification** | ❌ | ❌ | ✅ Own (APPROVE) |
| **Final Approval** | ❌ | ❌ | ✅ Own |
| **STOP Resolution** | ❌ | STOP & Escalate | ✅ Own |
| **Architecture Decisions** | ❌ | Recommend | ✅ Own |

---

## CRITICAL ARCHITECTURAL BOUNDARIES

### Boundary 1: External AI Awareness ≠ Integration

**External AI receives platform constraints:**
- UBRC exists and requires data-block-* attributes
- ILS exists and requires passive block participation
- LSNB exists and requires no direct navigation writes
- RSSB exists and requires no direct state synchronization

**External AI does NOT implement:**
- UBRC runtime observation
- ILS telemetry collection
- ILS completion evaluation
- LSNB state updates
- RSSB synchronization

**Project LLM implements and verifies actual platform integration.**

---

### Boundary 2: Candidate Self-Validation ≠ Production Certification

**External AI produces:**
- Candidate self-validation report
- Candidate test results
- Candidate accessibility claims
- Candidate responsive claims

**These are candidate evidence, not production certification.**

**Project LLM independently verifies:**
- Repository integration
- Actual UBRC participation
- Actual ILS participation
- Actual LSNB relationship
- Actual RSSB participation (where applicable)
- Runtime behavior
- E2E behavior

**Human makes final approval decision based on Project LLM technical certification evidence.**

---

### Boundary 3: CERTIFICATION_READY ≠ CERTIFIED

**Project LLM establishes:**
```
CERTIFICATION_READY
```

This means:
- All technical validations passed
- All evidence collected
- No blocking issues detected
- Technical certification complete

**This does NOT mean:**
```
CERTIFIED
```

**Human authority is required to transition:**
```
CERTIFICATION_READY → APPROVE → CERTIFIED
```

**Per Phase 0.2 (Human Approval Contract), Human authority cannot be bypassed by technical validation.**

---

### Boundary 4: Tutorial Composer Integration

**Tutorial Composer already exists in the running project:**
```
apps/realtutorialhub-web/src/features/tutorial-composer/
```

**Project LLM integrates new blocks INTO the existing Composer.**

**Project LLM does NOT:**
- Create a second Composer
- Bypass Composer
- Directly modify Tutorial Pages without Composer

**Integration flow:**
```
New Block
    ↓
Canonical Schema
    ↓
Document Builder
    ↓
Composer Registration
    ↓
Composer Palette
    ↓
Composer Creation
    ↓
Tutorial Document
    ↓
TutorialBlockRenderer
    ↓
Tutorial Page
```

---

### Boundary 5: Repository Modification Constraints

**Project LLM may modify:**
- New block files (candidate integration)
- Block type definitions (new block types)
- Renderer registry (new block registration)
- Composer registry (new block in palette)
- Tests (block validation)
- Documentation (block documentation)

**Project LLM must STOP and escalate for:**
- Universal UBRC infrastructure changes
- Universal ILS infrastructure changes
- Universal LSNB infrastructure changes
- Universal RSSB infrastructure changes
- Authentication system changes
- Authorization system changes
- Database schema changes (unless separately authorized)
- Deployment configuration changes

**Per Phase 0.3 (Repository Modification Contract), universal infrastructure changes require Human Architecture Authority approval.**

---

### Boundary 6: STOP Conditions

**Project LLM must STOP when:**

1. **Candidate requires universal infrastructure modification**
   - Example: Candidate requires new ILS API endpoint
   - Action: STOP, document requirement, escalate to Human

2. **Architecture contradiction detected**
   - Example: Candidate conflicts with frozen Phase 0 contracts
   - Action: STOP, document contradiction, escalate to Human

3. **Repository modification authority exceeded**
   - Example: Candidate requires database schema change
   - Action: STOP, document requirement, escalate to Human

4. **Validation failure cannot be resolved**
   - Example: UBRC runtime participation fails despite adaptation
   - Action: STOP, document failure, escalate to Human or External AI

5. **Security vulnerability detected**
   - Example: Candidate contains XSS vulnerability
   - Action: STOP, document vulnerability, return to External AI or escalate

6. **Uncertainty about governance boundary**
   - Example: Unclear whether operation violates Phase 0.3
   - Action: STOP, document uncertainty, escalate to Human

**Per Phase 0.8 (STOP Conditions Contract), STOP is mandatory when governance boundaries are encountered.**

---

## VALIDATION PIPELINE ARCHITECTURE

```
L0: Requirement Definition
    ↓
L1: Static Analysis
    - TypeScript compilation
    - ESLint
    - Type checking
    ↓
L2: Unit Tests
    - Block logic
    - Data transformations
    - Edge cases
    ↓
L3: Component Tests
    - Component rendering
    - Props handling
    - Accessibility
    - Responsive behavior
    ↓
L4: Integration Tests
    - Composer integration
    - Renderer integration
    - Document Builder
    - Schema validation
    ↓
L5: Runtime Tests
    - UBRC participation
    - ILS participation
    - LSNB relationship
    - RSSB participation (where applicable)
    ↓
L6: End-to-End Tests
    - Tutorial creation
    - Block rendering
    - Learner interaction
    - Learning progress
    - Cross-browser
    ↓
L7: Quality Attributes
    - Accessibility (WCAG 2.1 AA)
    - Performance
    - Security
    - SSR compatibility
    ↓
L8: Certification Readiness
    - All validations passed
    - Evidence complete
    - No blocking issues
    ↓
CERTIFICATION_READY
    ↓
Human Review & Approval
    ↓
CERTIFIED
```

---

## EVIDENCE PRODUCTION MODEL

### Evidence Categories

**1. Candidate Evidence (External AI)**
- Prototype demonstration
- Candidate test results
- Self-validation report
- Accessibility claims
- Responsive claims
- Documentation

**2. Integration Evidence (Project LLM)**
- Repository audit findings
- Architecture audit findings
- Adaptation report
- Composer integration verification
- Renderer integration verification
- Document Builder verification

**3. Runtime Evidence (Project LLM)**
- UBRC runtime logs
- ILS runtime logs
- LSNB runtime logs
- RSSB runtime logs (where applicable)
- Database evidence
- Network evidence

**4. Validation Evidence (Project LLM)**
- Unit test results
- Component test results
- Integration test results
- E2E test results
- Accessibility test results
- Performance test results
- Security audit results

**5. Certification Evidence (Project LLM)**
- Certification report
- Evidence package
- Git commit
- Build artifacts
- Remaining exceptions

**6. Approval Evidence (Human)**
- Gate 1 approval record
- Gate 2 approval record
- Approval authority
- Approval rationale

---

## CHECKPOINT AND ROLLBACK MODEL

### Checkpoints

**Checkpoint A: Candidate Accepted**
```
State: External AI candidate package accepted
Rollback Target: Reject handoff, return to External AI
```

**Checkpoint B: Architecture Audit Passed**
```
State: Candidate architecture compatible with platform
Rollback Target: Return to External AI with adaptation requirements
```

**Checkpoint C: Integration Complete**
```
State: Block integrated into Composer, Renderer, UBRC
Rollback Target: Remove integration, preserve repository state
```

**Checkpoint D: Validation Complete**
```
State: All validations passed
Rollback Target: Fix validation failures or STOP
```

**Checkpoint E: CERTIFICATION_READY**
```
State: Technical certification complete
Rollback Target: Address Human feedback or reject
```

**Checkpoint F: CERTIFIED**
```
State: Human approval granted
Rollback Target: Governed rollback per Phase 0.9
```

### Rollback Procedure

**Per Phase 0.9 (Rollback & Recovery Contract):**

1. **Identify checkpoint**
2. **Classify rollback scope** (candidate only vs repository modification)
3. **Preserve evidence** (do not delete history)
4. **Execute rollback** (git revert, branch management)
5. **Revalidate** (verify clean state)
6. **Document** (rollback record, lessons learned)

**Rollback is a governed state transition, not deletion of history.**

---

## RELATIONSHIP TO SKILLHUBCORE-ADMIN CONTROL PLANE

**Current Status:** Architecture defined, GUI not yet built

**Future Intent:**

The `skillhubcore-admin` application will eventually provide a **control plane GUI** for the Project LLM → External AI → Platform lifecycle.

**Proposed Control Plane Features:**

### 1. Requirements Definition
- Define new block requirements
- Specify learning objectives
- Specify UX requirements

### 2. External AI Brief Generator
- Project LLM inspects repository
- Project LLM generates External AI Creation Brief
- Human reviews and approves brief

### 3. External AI Handoff Manager
- Human provides brief to External AI (external to control plane)
- External AI uploads candidate package to control plane
- Control plane validates package

### 4. Gate 1 Approval Interface
- Display HTML/CSS/JS prototype
- Human reviews prototype
- Human makes Gate 1 decision (APPROVE / CONDITIONAL / REJECT)

### 5. Integration Dashboard
- Display Project LLM integration progress
- Show repository audit findings
- Show architecture audit findings
- Show adaptation plan

### 6. Validation Dashboard
- Display validation pipeline progress
- Show test results
- Show runtime verification
- Show UBRC/ILS/LSNB/RSSB evidence

### 7. STOP Panel
- Display STOP conditions
- Show escalation requirements
- Capture Human decisions
- Resume workflow after resolution

### 8. Evidence Viewer
- Browse complete evidence package
- View logs, screenshots, test results
- Download evidence artifacts

### 9. Gate 2 Approval Interface
- Display certification report
- Display evidence summary
- Human reviews technical certification
- Human makes Gate 2 decision (APPROVE / RETURN / REJECT)

### 10. Certification Registry
- List all certified blocks
- Show certification history
- Track block versions

**This control plane sits on top of the governed Project LLM engine, not as a replacement for it.**

---

## PHASE 1 NEXT STEPS

With this architecture documented, the recommended next steps are:

### Phase 1A: Project LLM Architecture Design
- Define Project LLM internal architecture
- Define repository discovery mechanism
- Define architecture audit framework
- Define adaptation engine
- Define integration sequencing

### Phase 1B: Project LLM Engine Implementation
- Implement repository inspection
- Implement candidate validation
- Implement adaptation logic
- Implement Composer integration
- Implement runtime verification

### Phase 1C: Validation Pipeline
- Implement validation layers (L1-L8)
- Implement evidence collection
- Implement certification report generation

### Phase 1D: Control Plane API
- Design control plane API
- Implement handoff endpoints
- Implement approval endpoints
- Implement evidence endpoints

### Phase 1E: skillhubcore-admin GUI
- Design control plane UI
- Implement requirement definition
- Implement Gate 1 approval interface
- Implement Gate 2 approval interface
- Implement dashboards

### Phase 1F: First Real Block
- Create External AI Creation Brief for Summary Block
- Handoff to External AI (Gemini/Claude)
- Execute complete lifecycle
- Document lessons learned

---

## UNRESOLVED ARCHITECTURAL QUESTIONS

1. **External AI API Integration:**
   - How does Project LLM programmatically communicate with External AI?
   - Is handoff manual (Human uploads package) or automated (API)?

2. **Candidate Package Format:**
   - JSON manifest structure?
   - Zip archive vs directory structure?
   - Checksums and integrity verification?

3. **Evidence Storage:**
   - Where is evidence stored long-term?
   - Database vs filesystem?
   - Retention policy?

4. **Rollback Automation:**
   - How automated should rollback be?
   - What requires Human approval?

5. **Version Management:**
   - How are block versions managed?
   - Can multiple versions coexist?
   - How does Composer handle block version selection?

6. **Multi-Block Coordination:**
   - How are related blocks coordinated?
   - What if Block B depends on Block A?

7. **Testing Environment:**
   - Where does Project LLM run tests?
   - Dedicated test database?
   - Isolated environment?

8. **Performance Targets:**
   - What are acceptable integration times?
   - What are acceptable validation times?

**These questions should be resolved during Phase 1A (Project LLM Architecture Design).**

---

## AUDIT FINDINGS

### Compliance with Phase 0 Governance ✓

This architecture is compliant with Phase 0.1-0.10:

- **Phase 0.1:** External AI/Project LLM/Human actor boundaries preserved
- **Phase 0.2:** Gate 1 and Gate 2 approval gates implemented
- **Phase 0.3:** Repository modification boundaries respected
- **Phase 0.4:** Runtime boundaries preserved
- **Phase 0.5:** Handoff protocol implemented
- **Phase 0.6:** Evidence and certification model implemented
- **Phase 0.7:** Validation pipeline implemented
- **Phase 0.8:** STOP conditions and escalation implemented
- **Phase 0.9:** Rollback and checkpoint model implemented
- **Phase 0.10:** Versioning model acknowledged (future V2 if needed)

### Architectural Consistency ✓

- Actor separation is clear and enforced
- Two handovers are distinct and well-defined
- UBRC/ILS/LSNB/RSSB integration boundaries are correct
- Composer integration preserves existing architecture
- Evidence model distinguishes candidate vs production certification
- CERTIFICATION_READY ≠ CERTIFIED distinction preserved
- STOP mechanism is mandatory, not optional

### Known Gaps

- Control plane GUI not yet designed
- External AI API integration not yet defined
- Evidence storage infrastructure not yet defined
- Performance targets not yet established

**These gaps are expected at this architectural stage.**

---

## HUMAN ARCHITECTURE AUTHORITY REVIEW REQUIRED?

**Recommendation: YES**

**Reason:**

This architecture establishes the operational model for External AI → Project LLM → Platform integration, which directly affects:
- How tutorial blocks are created
- How the repository is modified
- How platform runtimes are verified
- How Human approval authority is exercised

**Human Architecture Authority should review and approve this architecture before Phase 1 implementation begins.**

---

## VERSION HISTORY

| Date | Event | Description |
|------|-------|-------------|
| 2026-10-01 | Created | Initial architecture document created after Phase 0 framework completion |

---

## REFERENCES

### Governing Contracts (Phase 0.1-0.10)
- All Phase 0 contracts in `docs/ubrc/PHASE-0.[1-9]-*-CONTRACT-V1.md`
- Phase 0.10: `PHASE-0.10-CONTRACT-VERSIONING-EVOLUTION-CONTRACT-V1.md`

### Governance Infrastructure
- `governance-contracts-index.md`
- `governance-contracts-changelog.md`
- `CONTRACT-VERSIONING-PROCEDURES.md`

### Evidence
- `PHASE-0.10-FREEZE-EXECUTION-COMPLETE.md`
- `PHASE-0-FRAMEWORK-COMPLETE.md`

---

## DECLARATION

This architecture defines the **reference model** for the External AI → Human → Project LLM → Tutorial Platform block lifecycle.

It is **NOT a frozen Phase 0.11 governance contract.**

It is an **implementation architecture** that operationalizes Phase 0.1-0.10 frozen governance.

It requires **Human Architecture Authority review and approval** before Phase 1 implementation begins.

**Status:** DRAFT (awaiting Human review)  
**Authority:** Derived from Phase 0.1-0.10  
**Next Step:** Human Architecture Authority review
