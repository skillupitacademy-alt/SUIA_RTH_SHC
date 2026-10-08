# PROJECT LLM GUI-FIRST STRATEGY

**Document Type:** Product Development Strategy & GUI Architecture  
**Date:** 2026-10-04  
**Status:** RECOMMENDED STRATEGY — Supersedes immediate code implementation  
**Phase 1B Contract Status:** APPROVED & LOCKED (but implementation paused pending GUI specification)  
**Action Required:** GUI/UX specification before implementation  

---

## EXECUTIVE SUMMARY

### Strategic Recommendation

**Do NOT start coding the Project LLM engine yet.**

First, finalize the **GUI wireframes/prototypes and the corresponding Project AI documentation one by one**. Then those approved GUI artifacts become the frontend/interaction contract that the implementation phase follows.

### Key Principle

> **Project AI documents and governs the GUI contract; Gemini/external AI can produce the visual prototype; human approves it; then implementation follows the approved contract.**

This aligns with the documented Project LLM lifecycle architecture where Project LLM is the **Integration & Certification Engine**, not merely an LLM text-generation endpoint.

---

## RECOMMENDED WORKFLOW

```text
1. Define GUI surface
        ↓
2. Project AI inspects repository
        ↓
3. Project AI creates GUI/UX specification
        ↓
4. Gemini / external AI creates visual prototype
        ↓
5. Human reviews prototype
        ↓
6. Project AI records approved wireframe + behavior contract
        ↓
7. STOP / APPROVAL GATE
        ↓
8. Implementation
        ↓
9. Runtime verification
        ↓
10. Evidence / certification
```

**Important:** Do this **one GUI surface at a time**.

---

## THE PROJECT LLM GUI SHOULD BE TREATED AS A PRODUCT/WORKBENCH

Rather than immediately thinking:

> "Let's add a Generate with AI button to Introduction I1."

we should first design the complete Project LLM workflow.

Based on the lifecycle architecture already documented, the GUI should be broken into major surfaces corresponding to the workflow phases.

---

## PROPOSED GUI SURFACES

### GUI-01 — Project LLM Home / Dashboard

**Purpose:** The starting point.

**Shows:**
- Projects/workspaces
- Recent candidates
- Active block work
- Pending human approvals
- Stopped workflows
- Certification-ready items
- Recent evidence
- Status of current work

**Actor:** Human (Tutorial Author, Admin, Architecture Authority)

**Entry Condition:** Authenticated user with Project LLM access

---

### GUI-02 — Block Creation / New Block Request

**Purpose:** Human initiates new block creation workflow.

Human says:
> I want to create an Introduction block for this tutorial.

**The GUI captures:**
- Brand
- Domain
- Subject
- Topic
- Subtopic
- Tutorial
- Block family
- Block variant
- Requirements
- Learning objective
- Visual/design requirements

This becomes the beginning of the **Creation Brief workflow**.

**Output:** Initial block creation request

---

### GUI-03 — Repository Discovery

**Purpose:** Project AI shows what it actually found in the repository.

**Displays:**
```text
Block family
Existing component
Existing schema
Existing renderer
Existing Composer registration
Existing tests
Existing runtime participation
Existing ILS participation
Existing LSNB participation
Existing RSSB participation
```

**Rationale:**

This is extremely important because the Project LLM architecture explicitly says:

> repository evidence → architectural decision

rather than:

> assumption → implementation.

**Actor:** Project AI (presents findings) + Human (reviews)

---

### GUI-04 — Architecture / Compatibility Audit

**Purpose:** Project AI presents compatibility analysis.

**Structure:**
```text
Candidate requirement
        ↓
Repository architecture
        ↓
Compatibility
        ↓
Conflict
        ↓
Required adaptation
```

**Example Display:**

| Area | Candidate | Repository | Result |
|---|---|---|---|
| React | Yes | React | PASS |
| TypeScript | Yes | TypeScript | PASS |
| Block schema | Candidate schema | Existing schema | ADAPT |
| Renderer | New | Existing registry | ADAPT |
| ILS | Candidate claims support | Repository evidence | VERIFY |
| LSNB | Candidate claims support | Repository evidence | VERIFY |
| RSSB | Candidate claims support | Repository evidence | VERIFY |

**Actor:** Project AI (analysis) + Human (architecture authority decision)

---

### GUI-05 — Creation Brief

**Purpose:** One of the most important screens. Project AI produces the actual brief for the external AI.

**Structure:**
```text
BLOCK CREATION BRIEF

Block:
Introduction I1

Tutorial:
...

Learning purpose:
...

Existing architecture:
...

Required schema:
...

Visual requirements:
...

Repository constraints:
...

Forbidden changes:
...

Expected output:
React + TypeScript candidate package

Validation requirements:
...
```

**Actor:** Project AI (generates) + Human (reviews before external AI handoff)

**Exit:** Brief approved → Human → External AI

**Governance:** Human can review this before giving it to the external AI.

---

### GUI-06 — External AI Prototype Review

**Purpose:** Corresponds to **Human Gate 1**.

The external AI produces the visual prototype.

**Display:**
```text
┌─────────────────────────────────────────┐
│ Prototype                               │
│                                         │
│         Introduction Block              │
│                                         │
│         [visual prototype]              │
│                                         │
├─────────────────────────────────────────┤
│ Requirements                            │
│ ✓ Learning purpose                      │
│ ✓ Responsive                            │
│ ✓ Accessibility                         │
│ ✓ Brand rules                           │
└─────────────────────────────────────────┘

[ APPROVE ] [ CONDITIONAL ] [ REJECT ]
```

**Actor:** Human (architecture authority)

**Governance:** This is a major governance gate.

**Exit Conditions:**
- APPROVE → proceed to React/TypeScript conversion
- CONDITIONAL → external AI revisions required
- REJECT → stop workflow, return to requirements

---

### GUI-07 — Candidate Package Intake

**Purpose:** After the external AI converts the approved prototype into React/TypeScript.

**Intake Structure:**
```text
Candidate Package
       ↓
Manifest
       ↓
React components
       ↓
TypeScript
       ↓
Schema
       ↓
Tests
       ↓
Documentation
       ↓
Self-validation
```

**Verification:** Project AI verifies the package.

**Important Rule from lifecycle documentation:**

> External AI self-validation is **not** production certification.

**Actor:** Project AI (verification) + Human (intake approval)

---

### GUI-08 — Project AI Repository Review

**Purpose:** Project AI independently examines the actual repository.

**Process:**
```text
Candidate says X
Repository actually contains Y
```

**Produces:**
```text
MATCH
ADAPT
CONFLICT
MISSING
STOP
```

**Rationale:** This is where repository evidence determines adaptation strategy, not assumptions.

**Actor:** Project AI (forensic analysis)

**Output:** Repository audit report + adaptation recommendations

---

### GUI-09 — Adaptation Plan

**Purpose:** Instead of blindly modifying code, Project AI explains the adaptation strategy.

**Structure:**
```text
Candidate
   ↓
Required repository changes
   ↓
Files affected
   ↓
Why
   ↓
Risk
   ↓
Governance impact
```

**Governance:** The human can see exactly what Project AI intends to do.

**Actor:** Project AI (planning) + Human (approval)

**Exit Condition:** Human approves adaptation plan → implementation authorized

---

### GUI-10 — Composer Integration Preview

**Purpose:** Show how the candidate becomes part of the existing Tutorial Composer.

**Display:**
```text
Candidate Block
      ↓
Canonical Block
      ↓
TutorialDocument
      ↓
Composer Preview
```

**Reference Implementation:** Existing Introduction I1 implementation becomes especially useful as the reference implementation.

**Actor:** Project AI (integration) + Human (preview review)

**Verification:** Composer integration functional before runtime verification

---

### GUI-11 — Runtime / Compliance Verification

**Purpose:** Project AI verifies the block against the actual platform.

**Verification Matrix:**
```text
Block
 │
 ├── Composer       ✓
 ├── TutorialPage   ✓
 ├── UBRC           ✓
 ├── ILS            ✓
 ├── LSNB           ✓
 ├── RSSB           ✓
 ├── Accessibility  ✓
 ├── Tests          ✓
 └── Runtime        ✓
```

**Important Rule:** Only things actually verified should be marked PASS.

**Actor:** Project AI (automated verification) + Human (verification review)

**Output:** Compliance verification report

---

### GUI-12 — Evidence / Certification Readiness

**Purpose:** Final workflow stage before human certification.

**Workflow:**
```text
VALIDATION
     ↓
EVIDENCE
     ↓
CERTIFICATION_READY
     ↓
HUMAN APPROVAL
     ↓
CERTIFIED
```

**Critical Governance Rule:**

The Project LLM must **not automatically turn CERTIFICATION_READY into CERTIFIED**.

That remains a human authority decision.

**Actor:** Human (certification authority)

**Exit Conditions:**
- CERTIFIED → block enters production
- CONDITIONAL → additional evidence/fixes required
- REJECTED → workflow stops, block does not enter production

---

## PROJECT AI MUST DOCUMENT EVERY GUI SCREEN

This is the important part of the strategy.

For every GUI surface we should have a dedicated document containing at least:

```text
GUI ID
GUI Name
Purpose
Actor
Entry Conditions
Exit Conditions
Wireframe
Layout
Components
Fields
Buttons
States
Loading State
Empty State
Error State
Approval State
Rejected State
STOP State
Data Required
API Dependencies
Permissions
Repository Dependencies
Governance Rules
Human Decisions
Evidence Produced
Navigation
Responsive Behavior
Accessibility
Implementation Notes
Out of Scope
Acceptance Criteria
```

So we eventually have something like:

```text
PROJECT LLM GUI SPECIFICATION

GUI-01  Dashboard
GUI-02  New Block Request
GUI-03  Repository Discovery
GUI-04  Architecture Audit
GUI-05  Creation Brief
GUI-06  Prototype Review
GUI-07  Candidate Intake
GUI-08  Repository Review
GUI-09  Adaptation Plan
GUI-10  Composer Integration
GUI-11  Runtime Verification
GUI-12  Evidence & Certification
```

Each one becomes an independently reviewable artifact.

---

## MOST IMPORTANTLY: DON'T DESIGN ALL 12 AT ONCE

**Recommended approach:** One-by-one locking.

### Sequential Approval Process

```text
GUI-01
   ↓
Design
   ↓
Human Review
   ↓
APPROVED
   ↓
Freeze

GUI-02
   ↓
Design
   ↓
Human Review
   ↓
APPROVED
   ↓
Freeze

GUI-03
...
```

**Rationale:** This gives us a very strong chain of evidence.

### Benefits of Sequential Approval

1. ✅ Each GUI surface independently reviewed
2. ✅ Human architecture authority at each stage
3. ✅ Clear approval audit trail
4. ✅ Can stop/adjust before too much work invested
5. ✅ Reduces risk of building wrong thing
6. ✅ Forces clarity at each workflow stage
7. ✅ Implementation contract emerges from approved GUI
8. ✅ No ambiguity about what to build

---

## WHERE GEMINI FITS

The locked responsibility split remains useful:

### Gemini / Free External AI

**Primarily responsible for:**

- Visual design
- Page composition
- Interaction design
- HTML/CSS/JS prototype
- React/TypeScript candidate

### Project AI / Kiro

**Primarily responsible for:**

- Repository discovery
- Architecture analysis
- Creation Brief
- Implementation contract
- Adaptation
- Backend/API integration
- Composer integration
- Tests
- Runtime verification
- Evidence
- Certification readiness

### Human

**Primarily responsible for:**

- Architecture authority
- Visual approval
- Gate 1 (prototype approval)
- Gate 2/final approval (certification)
- STOP resolution

**Source:** This is consistent with the lifecycle documentation's three-actor model.

---

## CORRECTION TO PREVIOUS DIRECTION

### Previous Plan (Now Paused)

The earlier narrow plan was:

```text
Phase 1: Foundation
  → ProjectLLMProvider
  → TestProvider
  → Generate I1
  → mockIntroductionI1Fixture
```

This was an **AI-generation service model**.

### New Understanding

The broader lifecycle clearly describes Project LLM as an **integration and certification engine**, not merely an LLM text-generation endpoint.

The project documentation itself says:
- The complete lifecycle is intended architecture
- The implementation was not yet present

**Source:** Project LLM lifecycle documentation + Architecture Reconciliation finding

### Recommended Change

**Pause** the earlier narrow "ProjectLLMService → TestProvider → Generate I1" implementation plan.

**Start instead** with GUI/workflow architecture because the broader lifecycle clearly describes Project LLM as an **Integration & Certification Engine**.

---

## NEXT MILESTONE

The next milestone should be:

> **PROJECT LLM GUI/UX ARCHITECTURE + WIREFRAME SPECIFICATION**

not code.

### Recommended Starting Point

Start with **GUI-01 — Project LLM Dashboard/Home** and fully document it.

Then GUI-02, GUI-03, etc., with each screen becoming **APPROVED & LOCKED** before moving to the next.

### Clean Chain of Evidence

This gives us a clean chain:

```text
GUI
  ↓
Workflow
  ↓
API contract
  ↓
Project AI implementation
  ↓
Composer
  ↓
Tutorial Page
  ↓
Runtime
  ↓
Evidence
  ↓
Certification
```

Each step builds on the previous approved foundation.

---

## RELATIONSHIP TO PHASE 1B CONTRACT

### Phase 1B Contract Status

**Status:** ✅ APPROVED & LOCKED (commit `a433d837`)

**Contract remains valid** for what it specifies.

### Strategic Change

**Implementation paused** until GUI specification complete.

**Rationale:**

1. Architecture reconciliation finding revealed mismatch between:
   - Narrow Phase 1B contract (generation service)
   - Broader documented lifecycle (integration & certification engine)

2. GUI-first strategy ensures implementation builds what is actually needed

3. Approved GUI surfaces become the implementation contract

4. Prevents building wrong thing even if technically sound

### What This Means

- Phase 1B contract technical decisions remain valid (Node/TypeScript, Option B, etc.)
- Implementation sequence changes: GUI specification → implementation
- No contradiction with approved contract
- Strategic refinement based on architecture reconciliation

---

## IMPLEMENTATION STRATEGY AFTER GUI APPROVAL

Once GUI surfaces are approved and locked, implementation follows this pattern:

### For Each GUI Surface

1. ✅ GUI specification approved & locked
2. ✅ API contract derived from GUI requirements
3. ✅ Backend implementation
4. ✅ Frontend implementation
5. ✅ Integration tests
6. ✅ Runtime verification
7. ✅ Evidence collection
8. ✅ Human approval
9. ✅ Move to next GUI surface

### Example: GUI-01 (Dashboard)

```text
GUI-01 Dashboard specification
        ↓ APPROVED & LOCKED
API contract for dashboard data
        ↓
Backend: Project status service
        ↓
Frontend: Dashboard component
        ↓
Integration tests
        ↓
Human approval
        ↓ LOCKED
GUI-02 (next)
```

---

## GOVERNANCE GATES

### Gate 1: GUI Specification Approval

**Who:** Human Architecture Authority

**Approves:** GUI specification document for each surface

**Criteria:**
- Purpose clear
- Actor clear
- Workflow clear
- States defined
- Governance rules explicit
- Evidence requirements clear

### Gate 2: Visual Prototype Approval

**Who:** Human (UX/design authority)

**Approves:** Visual prototype from external AI

**Criteria:**
- Matches specification
- Responsive
- Accessible
- Brand compliant
- Learning purpose served

### Gate 3: Implementation Approval

**Who:** Human Architecture Authority

**Approves:** Implementation against approved GUI contract

**Criteria:**
- Matches GUI specification
- API contract followed
- Tests pass
- No unapproved deviations

### Gate 4: Certification

**Who:** Human (certification authority)

**Approves:** Block enters production

**Criteria:**
- All evidence collected
- All verifications pass
- CERTIFICATION_READY status achieved
- Human final review complete

---

## RELATIONSHIP TO EXISTING TUTORIAL COMPOSER

### Important Principle

**Project LLM does NOT replace Tutorial Composer.**

### Integration Model

```text
Project LLM
     ↓
Creates/validates candidates
     ↓
Integrates with existing Composer
     ↓
Existing Composer
     ↓
Tutorial Page
```

**Source:** Lifecycle documentation explicitly states Tutorial Composer already exists and Project LLM integrates with it.

### GUI-10 Specifically

GUI-10 (Composer Integration Preview) shows how Project LLM candidates become part of the existing Tutorial Composer, not a replacement.

---

## DOCUMENTATION REQUIREMENTS

### For Each GUI Surface

Create dedicated document:

```text
ILS_UI_UX/docs/PROJECT_LLM_GUI_[NUMBER]_[NAME].md
```

**Example:**
```text
ILS_UI_UX/docs/PROJECT_LLM_GUI_01_DASHBOARD.md
ILS_UI_UX/docs/PROJECT_LLM_GUI_02_NEW_BLOCK_REQUEST.md
ILS_UI_UX/docs/PROJECT_LLM_GUI_03_REPOSITORY_DISCOVERY.md
...
```

### Documentation Template

Each document must contain (minimum):

```markdown
# PROJECT LLM GUI-[NUMBER] — [NAME]

## 1. GUI Identity
- GUI ID
- GUI Name
- Purpose
- Actor(s)

## 2. Entry/Exit Conditions
- Entry conditions
- Exit conditions
- Exit states (APPROVED, CONDITIONAL, REJECTED, STOP)

## 3. Wireframe
- Layout description
- Component placement
- Visual hierarchy

## 4. Components & Fields
- Form fields
- Buttons
- Display components
- Navigation elements

## 5. States
- Loading state
- Empty state
- Error state
- Approval state
- Rejected state
- STOP state

## 6. Data & Dependencies
- Data required
- API dependencies
- Repository dependencies
- Permissions required

## 7. Governance Rules
- Human decisions required
- Approval authority
- Evidence produced
- Audit trail

## 8. Behavior
- User interactions
- Validation rules
- Navigation flow
- Responsive behavior
- Accessibility requirements

## 9. Implementation Notes
- Technical constraints
- Existing components to reuse
- New components required
- Integration points

## 10. Out of Scope
- What this GUI does NOT do
- Deferred features
- Future considerations

## 11. Acceptance Criteria
- GUI specification approval criteria
- Visual prototype approval criteria
- Implementation approval criteria
```

---

## TIMELINE ESTIMATE

### Phase 1: GUI Specification (Weeks 1-4)

- Week 1: GUI-01, GUI-02, GUI-03 (core workflow entry)
- Week 2: GUI-04, GUI-05, GUI-06 (creation brief & Gate 1)
- Week 3: GUI-07, GUI-08, GUI-09 (candidate intake & adaptation)
- Week 4: GUI-10, GUI-11, GUI-12 (integration & certification)

**Deliverable:** 12 approved & locked GUI specifications

### Phase 2: Visual Prototypes (Weeks 5-6)

- External AI produces visual prototypes
- Human Gate 1 approvals
- Revisions as needed

**Deliverable:** 12 approved visual prototypes

### Phase 3: Implementation (Weeks 7-14)

- 2 GUI surfaces per week (backend + frontend + tests)
- Integration testing
- Runtime verification

**Deliverable:** Functioning Project LLM workbench

### Phase 4: Evidence & Certification (Week 15)

- Evidence collection
- Final verification
- Certification readiness
- Human final approval

**Deliverable:** Production-ready Project LLM

**Total Estimate:** 15 weeks (GUI-first approach)

---

## COMPARISON TO PREVIOUS TIMELINE

### Previous Plan (Paused)

Phase 1B implementation: 4 weeks
- Foundation, Service, API, UI, Metadata, E2E

**Issue:** Started with implementation before GUI/workflow clarity

### New Plan (Recommended)

GUI specification: 4 weeks  
Visual prototypes: 2 weeks  
Implementation: 8 weeks  
Certification: 1 week  
**Total:** 15 weeks

**Advantage:** Clear GUI contract before implementation, reduces rework risk

---

## SUCCESS CRITERIA

### For This Strategy Document

- [ ] Human Architecture Authority reviews strategy
- [ ] Human approves GUI-first approach
- [ ] Human approves sequential GUI approval process
- [ ] Human approves starting with GUI-01 (Dashboard)
- [ ] Phase 1B implementation officially paused pending GUI specification

### For GUI Specification Phase

- [ ] All 12 GUI surfaces documented
- [ ] All 12 GUI specifications approved & locked
- [ ] Clear API contracts derived from GUI requirements
- [ ] No ambiguity about what to implement
- [ ] Governance gates clearly defined

### For Overall Project LLM

- [ ] Functioning workbench matching approved GUI specifications
- [ ] Integration with existing Tutorial Composer verified
- [ ] All 12 workflow stages functional
- [ ] Evidence trail from requirement → certification
- [ ] Human governance gates respected throughout

---

## DOCUMENT STATUS

**Strategy Status:** 📋 RECOMMENDED — Awaiting Human Architecture Authority approval  
**Phase 1B Implementation:** ⏸️ PAUSED pending GUI specification  
**Next Action:** Human reviews and approves/modifies GUI-first strategy  

**After Approval:** Begin GUI-01 (Dashboard) specification

---

## REFERENCES

**Related Documents:**
- `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md` (Architecture mismatch finding)
- `ILS_UI_UX/docs/Project LLM.ipynb` (Existing lifecycle documentation)
- `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` (Approved & locked contract)

**Commit:** (To be committed after document creation)
