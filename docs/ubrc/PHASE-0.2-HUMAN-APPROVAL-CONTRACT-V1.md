# PHASE 0.2 — HUMAN APPROVAL CONTRACT V1

**Document Type:** Governance Contract  
**Status:** FROZEN  
**Date:** 2026-09-30  
**Version:** 1.0  
**Authority:** Foundational Contract for Human Approval Gates  
**Prerequisite:** Phase 0.1 — AI Roles & Responsibility Contract (FROZEN)  
**Versioning Governance:** Phase 0.10 V1 - Contract Versioning & Evolution

---

## PURPOSE

This contract establishes **exactly when human approval is required, what evidence must be provided, what decisions can be made, what each decision means, and what happens after each decision** in the AI Tutorial Block Creation, Integration & Certification Lifecycle.

**Master Principle:**

> **Human approval is mandatory at defined gates. Neither AI may bypass these gates or proceed without explicit human decision. Evidence must be complete before approval is requested. Human decisions are binding and documented.**

---

## APPROVAL GATES

There are **THREE MANDATORY APPROVAL GATES** in the lifecycle:

```text
GATE 1: Prototype Approval
           │
           ▼
       (Phase 3)
           │
           ▼
GATE 2: Architecture Review
           │
           ▼
    (When STOP triggered)
           │
           ▼
GATE 3: Final Production Approval
           │
           ▼
       (Phase 19)
```

**All three gates are mandatory.**

**Gates cannot be:**
- Skipped
- Bypassed
- Automated
- Delegated to AI
- Assumed approved

---

## GATE 1: PROTOTYPE APPROVAL

**Phase:** 3  
**Trigger:** External AI completes prototype  
**Requesting Actor:** External AI  
**Approving Actor:** Human

### Purpose

Verify that the visual prototype meets learning intent, UX quality, and content correctness **before External AI invests effort in full React/TypeScript engineering**.

**Key principle:**
> Do not engineer the full candidate block until the prototype is approved.

### Evidence Required

External AI **MUST** provide the following evidence before requesting Gate 1 approval:

#### 1. Working Prototype

**Format:**
```text
prototype/
├── index.html
├── style.css
├── script.js
├── data.json
└── assets/
```

**Deliverable:** Runnable HTML/CSS/JS that demonstrates the complete block.

**Requirement:** Human must be able to open `index.html` in browser and interact with the prototype.

#### 2. Visual Evidence

**Screenshots:**
- Desktop view (1920x1080 minimum)
- Tablet view (768x1024 minimum)
- Mobile view (375x667 minimum)

**Format:** PNG or JPG, annotated if needed

**Recordings (if interactive):**
- Screen recording showing interactions
- Format: MP4 or WebM
- Duration: 30 seconds to 2 minutes

#### 3. Learning Intent Alignment

**Document format:** Markdown or PDF

**Required sections:**
- Learning objective restated
- How visual design supports objective
- How interactions support objective
- How content structure supports objective

#### 4. Content Verification

**Document format:** Markdown or PDF

**Required sections:**
- Content accuracy verification
- Content completeness verification
- Content appropriateness verification
- Any placeholders or TBD content identified

#### 5. Accessibility Baseline

**Document format:** Markdown or PDF

**Required checks:**
- Semantic HTML structure verified
- ARIA attributes present where needed
- Keyboard navigation functional
- Focus management functional
- Color contrast meets WCAG AA minimum
- Screen reader compatibility considered

#### 6. Responsive Behavior

**Document format:** Markdown or PDF

**Required demonstrations:**
- Layout adapts to mobile (documented/shown)
- Layout adapts to tablet (documented/shown)
- Layout adapts to desktop (documented/shown)
- No horizontal scroll at breakpoints
- Touch targets appropriate for mobile

#### 7. Prototype Report

**Document format:** Markdown

**Template:**
```markdown
# Prototype Report: [Block Name] [Version]

## Block Identity
- Type: [e.g., Introduction]
- Version: [e.g., I3]
- Purpose: [one sentence]

## Learning Objective
[Restated from requirement]

## Visual Design
- Design rationale
- Layout choices
- Color choices
- Typography choices

## Interactions
- List of interactions
- Rationale for each

## Content Structure
- Sections
- Hierarchy
- Emphasis

## Accessibility
- Semantic HTML approach
- ARIA usage
- Keyboard navigation
- Focus management

## Responsive Approach
- Breakpoints
- Mobile strategy
- Tablet strategy
- Desktop strategy

## Known Limitations
- Any prototype shortcuts
- Any unimplemented details
- Any TBD decisions

## Ready for Approval
- [ ] Prototype functional
- [ ] Evidence complete
- [ ] Report complete
```

### Evidence Completeness Check

Before requesting approval, External AI must verify:

```text
✅ Prototype runs in browser
✅ Screenshots captured
✅ Recordings created (if interactive)
✅ Learning intent documented
✅ Content verified
✅ Accessibility baseline documented
✅ Responsive behavior documented
✅ Prototype report complete
```

If any item is incomplete:
```text
Evidence incomplete
   ↓
Fix evidence
   ↓
Retry completeness check
```

### Approval Request Format

External AI requests approval with:

```text
APPROVAL REQUEST: Gate 1 — Prototype Approval

Block: [Name] [Version]
Phase: 3
Date: [YYYY-MM-DD]

Evidence Location:
- Prototype: [path or URL]
- Screenshots: [path or URL]
- Recordings: [path or URL]
- Documentation: [path or URL]
- Report: [path or URL]

Requesting: Human prototype approval to proceed to Phase 4 (Complete Block Engineering)

External AI: [AI name/identifier]
```

### Human Review Process

Human reviews the following:

#### 1. Visual Quality
- Professional appearance
- Clear hierarchy
- Appropriate typography
- Appropriate colors
- Visual appeal
- Brand consistency (if applicable)

**Decision criteria:**
- Does this look like professional educational content?
- Is the visual design appropriate for the learner level?
- Are there obvious visual problems?

#### 2. Learning Intent
- Does the prototype support the learning objective?
- Is content appropriately structured?
- Are pedagogical elements present?
- Is the learning flow clear?

**Decision criteria:**
- Will learners understand the concept from this?
- Is the complexity appropriate?
- Are examples/explanations clear?

#### 3. Content Correctness
- Is content factually accurate?
- Is content complete?
- Is content appropriately scoped?
- Are there typos or errors?

**Decision criteria:**
- Can this content be used in production?
- Does it require content revision?

#### 4. Interaction Appropriateness
- Are interactions intuitive?
- Are interactions purposeful?
- Are interactions accessible?
- Do interactions support learning?

**Decision criteria:**
- Do interactions enhance or distract?
- Are they appropriate for the learner level?

#### 5. Accessibility Baseline
- Semantic HTML used appropriately?
- Keyboard navigation functional?
- ARIA attributes appropriate?
- Color contrast acceptable?

**Decision criteria:**
- Will this be accessible after React conversion?
- Are there fundamental accessibility problems?

#### 6. Responsive Behavior
- Mobile layout functional?
- Tablet layout functional?
- Desktop layout functional?
- Breakpoints appropriate?

**Decision criteria:**
- Will this work on all devices?
- Are there responsive design problems?

### Human Decisions

Human makes **ONE** of the following decisions:

#### DECISION A: APPROVE

**Meaning:**
```text
Prototype meets quality standards
   ↓
Proceed to Phase 4 (Complete Block Engineering)
```

**Format:**
```text
GATE 1 DECISION: APPROVE

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Comments: [Optional feedback or guidance]

Next Phase: 4 (External AI Complete Block Engineering)
```

**Effect:**
- External AI proceeds to Phase 4
- Prototype becomes reference for React implementation
- Approval documented in project history

#### DECISION B: REJECT

**Meaning:**
```text
Prototype does not meet quality standards
   ↓
External AI must revise
   ↓
Resubmit for Gate 1
```

**Format:**
```text
GATE 1 DECISION: REJECT

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Rejection Reasons:
1. [Specific reason]
2. [Specific reason]
...

Required Changes:
1. [Specific change]
2. [Specific change]
...

Next Step: External AI revises prototype and resubmits for Gate 1
```

**Effect:**
- External AI revises prototype
- External AI addresses all rejection reasons
- External AI resubmits with revised evidence
- Gate 1 re-evaluated

#### DECISION C: CONDITIONAL APPROVE

**Meaning:**
```text
Prototype mostly acceptable
   +
Minor issues can be fixed in Phase 4
   ↓
Proceed with documented conditions
```

**Format:**
```text
GATE 1 DECISION: CONDITIONAL APPROVE

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Conditions:
1. [Condition to address in Phase 4]
2. [Condition to address in Phase 4]
...

Verification Required:
Human must verify these conditions are addressed in Gate 3

Next Phase: 4 (External AI Complete Block Engineering)
```

**Effect:**
- External AI proceeds to Phase 4
- External AI must address conditions
- Conditions tracked through to Gate 3
- Gate 3 verification includes condition compliance

### Decision Documentation

All Gate 1 decisions are documented in:

```text
decisions/
└── gate-1-prototype-approval/
    ├── [block-name]-[version]-gate-1-decision.md
    ├── [block-name]-[version]-gate-1-evidence/
    └── [block-name]-[version]-gate-1-conditions.md (if conditional)
```

### Iteration Limit

**Rule:** No automatic iteration limit for Gate 1.

**Rationale:** Prototype quality is critical; iteration until acceptable is preferred over proceeding with poor foundation.

**However:** After 3 rejections, human may decide:
- Requirements need clarification
- Different External AI needed
- Block design is fundamentally flawed
- Abandon this block

---

## GATE 2: ARCHITECTURE REVIEW

**Phase:** Triggered by Project LLM STOP condition  
**Trigger:** Project LLM encounters architecture conflict  
**Requesting Actor:** Project LLM  
**Approving Actor:** Human

### Purpose

Decide whether to modify platform architecture, revise candidate, or pursue alternative approach when **Project LLM discovers that candidate cannot be integrated without universal architecture changes**.

**Key principle:**
> Platform architecture changes require explicit human decision, not autonomous AI modification.

### When Gate 2 Is Triggered

Project LLM **MUST** trigger Gate 2 when:

#### Trigger 1: Universal Architecture Modification Required

**Examples:**
- Candidate requires new UBRC lifecycle hook
- Candidate requires ILS architecture change
- Candidate requires LSNB core modification
- Candidate requires RSSB data model change
- Candidate requires new universal telemetry behavior

**Pattern:**
```text
Candidate behavior X
   +
Existing architecture does not support X
   +
Supporting X requires modifying universal infrastructure
   ↓
STOP
   ↓
Gate 2: Architecture Review
```

#### Trigger 2: Contract Violation Unfixable

**Examples:**
- Candidate requires direct ILS integration (violates passive observer)
- Candidate requires block-specific LSNB logic (violates universal runtime)
- Candidate requires synchronous backend calls (violates async architecture)
- Candidate architecture fundamentally incompatible with platform

**Pattern:**
```text
Candidate violates contract Y
   +
Adaptation would break candidate intent
   +
Contract change required OR candidate must be abandoned
   ↓
STOP
   ↓
Gate 2: Architecture Review
```

#### Trigger 3: Platform Limitation Discovered

**Examples:**
- Platform cannot support required interaction pattern
- Platform cannot support required data model
- Platform cannot support required rendering approach
- Workaround would compromise platform integrity

**Pattern:**
```text
Candidate requires capability Z
   +
Platform does not have Z
   +
Adding Z requires platform enhancement
   ↓
STOP
   ↓
Gate 2: Architecture Review
```

#### Trigger 4: Security/Safety Concern

**Examples:**
- Candidate introduces XSS risk
- Candidate introduces data leak risk
- Candidate introduces performance degradation
- Mitigation requires architecture change

**Pattern:**
```text
Candidate introduces risk R
   +
Risk cannot be mitigated through adaptation
   +
Architecture change required OR candidate must be rejected
   ↓
STOP
   ↓
Gate 2: Architecture Review
```

### Evidence Required

Project LLM **MUST** provide the following evidence when triggering Gate 2:

#### 1. Conflict Description

**Document format:** Markdown

**Required sections:**
```markdown
# Architecture Conflict Report

## Candidate Block
- Name: [Block name]
- Version: [Block version]
- Phase: [Current phase]

## Conflict Summary
[One paragraph describing the conflict]

## Detailed Analysis
[Multi-paragraph detailed explanation]

## Why Standard Adaptation Cannot Resolve
[Explanation of why this isn't a routine hardening task]

## Architecture Component Affected
- [ ] UBRC
- [ ] ILS
- [ ] LSNB
- [ ] RSSB
- [ ] Composer
- [ ] Universal Runtime
- [ ] Theme System
- [ ] Authentication
- [ ] Database Schema
- [ ] Other: [specify]

## Trigger Reason
- [ ] Universal architecture modification required
- [ ] Contract violation unfixable
- [ ] Platform limitation discovered
- [ ] Security/safety concern

## Specific Conflict
[Detailed technical explanation with code/architecture references]
```

#### 2. Current Architecture State

**Document format:** Markdown

**Required sections:**
```markdown
## Current Architecture

### Component: [e.g., ILS]

**Current Behavior:**
[Describe how it works now]

**Current Contract:**
[Describe the current contract]

**Evidence:**
[File paths, code snippets, documentation references]
```

#### 3. Candidate Requirement

**Document format:** Markdown

**Required sections:**
```markdown
## Candidate Requirement

**What candidate needs:**
[Specific technical requirement]

**Why candidate needs it:**
[Pedagogical/UX/functional rationale]

**Evidence:**
[Candidate code snippets, prototype behavior, design intent]
```

#### 4. Gap Analysis

**Document format:** Markdown

**Required sections:**
```markdown
## Gap Analysis

**Current capability:**
[What platform can do now]

**Required capability:**
[What candidate needs]

**Gap:**
[Specific missing capability]

**Why gap exists:**
[Architectural/historical reason]
```

#### 5. Proposed Solutions

**Document format:** Markdown

**Required sections:**
```markdown
## Solution Options

### Option A: Modify Platform Architecture

**Proposed changes:**
1. [Change 1]
2. [Change 2]
...

**Impact:**
- Affected components: [list]
- Breaking changes: [Yes/No, details]
- Migration required: [Yes/No, details]
- Risk level: [Low/Medium/High]

**Effort:**
- Estimated time: [range]
- Complexity: [Low/Medium/High]

**Benefits:**
- Candidate can proceed
- [Other benefits]

**Risks:**
- [Risk 1]
- [Risk 2]
...

### Option B: Revise Candidate

**Proposed revisions:**
1. [Revision 1]
2. [Revision 2]
...

**Impact:**
- Changes to candidate behavior: [details]
- Pedagogical impact: [assessment]
- UX impact: [assessment]

**Effort:**
- Estimated time: [range]
- Who performs: [External AI / Project LLM]

**Benefits:**
- No platform changes
- [Other benefits]

**Risks:**
- May not meet original intent
- [Other risks]

### Option C: Alternative Approach

**Proposed alternative:**
[Description of workaround/alternative]

**Impact:**
[Assessment]

**Effort:**
[Estimate]

**Benefits:**
[List]

**Risks:**
[List]

### Option D: Abandon Candidate

**Rationale:**
[Why candidate cannot be made compatible]

**Impact:**
- Candidate abandoned
- Effort invested lost
- [Other impacts]

**Next steps:**
- Revise requirements
- Try different design
- Abandon block entirely
```

#### 6. Project LLM Recommendation

**Document format:** Markdown

**Required sections:**
```markdown
## Project LLM Recommendation

**Recommended Option:** [A/B/C/D]

**Rationale:**
[Detailed justification for recommendation]

**Risk Assessment:**
[Assessment of recommended option risks]

**Implementation Plan:**
[If recommending A, detailed implementation plan]
```

### Evidence Completeness Check

Before requesting Gate 2 review, Project LLM must verify:

```text
✅ Conflict description complete
✅ Current architecture documented
✅ Candidate requirement documented
✅ Gap analysis complete
✅ All solution options explored
✅ Recommendation provided
✅ Evidence organized
```

### Architecture Review Request Format

Project LLM requests review with:

```text
ARCHITECTURE REVIEW REQUEST: Gate 2

Block: [Name] [Version]
Phase: [Current phase where STOP occurred]
Date: [YYYY-MM-DD]

Conflict: [One sentence summary]

Trigger: [Architecture modification / Contract violation / Platform limitation / Security concern]

Evidence Location: [path or URL to complete report]

Recommendation: Option [A/B/C/D]

Requesting: Human architecture decision

Project LLM: [Identifier]
```

### Human Review Process

Human reviews the following:

#### 1. Conflict Validity
- Is this genuinely an architecture conflict?
- Or is this a misunderstanding that Project LLM can resolve?
- Should Project LLM explore further before architecture decision?

**Decision criteria:**
- Is STOP justified?
- Is more investigation needed?

#### 2. Architecture Impact
- How significant is the proposed architecture change?
- How many components affected?
- Are there breaking changes?
- What is the migration path?

**Decision criteria:**
- Is the architecture change acceptable?
- Is the impact manageable?

#### 3. Candidate Value
- How valuable is this candidate block?
- Is it worth modifying architecture?
- Are there alternatives?

**Decision criteria:**
- Does candidate warrant architecture investment?

#### 4. Solution Options
- Are all options fully explored?
- Is there an option Project LLM missed?
- Which option is most aligned with platform vision?

**Decision criteria:**
- Is recommendation sound?
- Is there a better option?

#### 5. Long-term Implications
- Does this set precedent?
- Will other blocks need similar changes?
- Does this improve or compromise platform?

**Decision criteria:**
- What is the strategic impact?

### Human Decisions

Human makes **ONE** of the following decisions:

#### DECISION A: APPROVE ARCHITECTURE CHANGE

**Meaning:**
```text
Platform architecture will be modified
   ↓
Project LLM implements architecture change
   ↓
Candidate integration proceeds with new architecture
```

**Format:**
```text
GATE 2 DECISION: APPROVE ARCHITECTURE CHANGE

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Reviewer: [Human name]

Approved Change: Option A (or specified modifications)

Architecture Components to Modify:
1. [Component]
2. [Component]
...

Conditions:
1. [Any conditions on the change]
2. [Any verification requirements]
...

Rationale:
[Why this decision was made]

Risk Acceptance:
[Acknowledged risks]

Next Steps:
1. Project LLM implements architecture change
2. Project LLM documents change
3. Project LLM updates architecture docs
4. Project LLM verifies change
5. Candidate integration resumes

Approver: [Human name]
Signature: [Digital signature or approval record]
```

**Effect:**
- Project LLM proceeds with architecture modification
- Architecture change documented
- Architecture docs updated
- Contract updated if needed
- Candidate integration resumes after architecture ready

#### DECISION B: REJECT CANDIDATE / REVISE

**Meaning:**
```text
Platform architecture will NOT be modified
   ↓
Candidate must be revised OR abandoned
   ↓
External AI revises candidate (if feasible)
```

**Format:**
```text
GATE 2 DECISION: REJECT CANDIDATE / REQUIRE REVISION

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Reviewer: [Human name]

Decision: Candidate revision required (or abandon if not feasible)

Rationale:
[Why architecture change is not approved]

Required Revisions:
1. [Specific revision]
2. [Specific revision]
...

Constraints:
1. [Platform constraint to respect]
2. [Contract constraint to respect]
...

Next Steps:
1. Assess revision feasibility
2. External AI revises candidate (if feasible)
3. Resubmit revised candidate
4. OR abandon candidate if revision not feasible

Reviewer: [Human name]
```

**Effect:**
- Candidate sent back for revision
- External AI revises (if feasible)
- If not feasible, candidate abandoned
- No platform architecture change

#### DECISION C: APPROVE ALTERNATIVE APPROACH

**Meaning:**
```text
Neither platform change NOR full candidate revision
   ↓
Workaround or alternative approach approved
   ↓
Project LLM implements alternative
```

**Format:**
```text
GATE 2 DECISION: APPROVE ALTERNATIVE APPROACH

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Reviewer: [Human name]

Approved Approach: Option C (or specified alternative)

Alternative Description:
[Description of approved workaround/alternative]

Rationale:
[Why this approach is preferred]

Limitations Accepted:
[Any reduced functionality or compromises]

Next Steps:
1. Project LLM implements alternative approach
2. Verify alternative achieves core intent
3. Document limitations
4. Candidate integration proceeds with alternative

Reviewer: [Human name]
```

**Effect:**
- Project LLM implements workaround
- Candidate may have reduced functionality
- No major platform changes
- Limitations documented

#### DECISION D: ABANDON CANDIDATE

**Meaning:**
```text
Candidate cannot be made compatible
   ↓
Investment lost
   ↓
Return to requirements or try different design
```

**Format:**
```text
GATE 2 DECISION: ABANDON CANDIDATE

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Reviewer: [Human name]

Abandonment Reason:
[Why candidate is being abandoned]

Lessons Learned:
1. [Lesson]
2. [Lesson]
...

Next Steps:
- [ ] Revise requirements
- [ ] Try fundamentally different design
- [ ] Abandon this block type entirely
- [ ] Other: [specify]

Reviewer: [Human name]
```

**Effect:**
- Candidate work stopped
- Effort invested lost
- Requirements may be reconsidered
- Different approach may be attempted

#### DECISION E: REQUEST MORE INVESTIGATION

**Meaning:**
```text
Insufficient information to decide
   ↓
Project LLM investigates further
   ↓
Resubmit with additional analysis
```

**Format:**
```text
GATE 2 DECISION: REQUEST MORE INVESTIGATION

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Reviewer: [Human name]

Investigation Required:
1. [Question to investigate]
2. [Analysis to perform]
...

Rationale:
[Why more investigation is needed before decision]

Next Steps:
1. Project LLM performs investigation
2. Project LLM updates evidence
3. Resubmit for Gate 2

Reviewer: [Human name]
```

**Effect:**
- Project LLM continues investigation
- Gate 2 remains open
- Decision deferred until investigation complete

### Decision Documentation

All Gate 2 decisions are documented in:

```text
decisions/
└── gate-2-architecture-review/
    ├── [block-name]-[version]-gate-2-conflict.md
    ├── [block-name]-[version]-gate-2-evidence/
    ├── [block-name]-[version]-gate-2-decision.md
    └── [block-name]-[version]-gate-2-implementation.md (if A or C)
```

### Escalation

Gate 2 may be escalated to:
- Senior architect
- Technical lead
- Product owner
- Team consensus

if the reviewing human requires additional input.

---

## GATE 3: FINAL PRODUCTION APPROVAL

**Phase:** 19  
**Trigger:** Project LLM completes certification  
**Requesting Actor:** Project LLM  
**Approving Actor:** Human

### Purpose

Verify that the **complete integrated block** meets production quality standards and can be deployed as a Certified Production Tutorial Block.

**Key principle:**
> Final production approval only occurs after complete certification evidence is available.

### Evidence Required

Project LLM **MUST** provide the following evidence before requesting Gate 3 approval:

#### 1. Complete Certification Report

**Document format:** Markdown

**Template:**
```markdown
# Certification Report: [Block Name] [Version]

**Date:** [YYYY-MM-DD]  
**Project LLM:** [Identifier]  
**Status:** Ready for Gate 3 Approval

## Executive Summary

- Block integrated: ✅ / ❌
- Tests passing: ✅ / ❌
- UBRC verified: ✅ / ❌
- ILS verified: ✅ / ❌
- LSNB verified: ✅ / ❌
- RSSB verified: ✅ / ❌
- Quality certified: ✅ / ❌

**Recommendation:** APPROVE / CONDITIONAL APPROVE / REJECT

## Phase Completion Summary

### Phase 4-8: Engineering & Adaptation
- External AI candidate received: [date]
- Candidate review complete: [date]
- Production hardening complete: [date]
- Issues fixed: [count]

### Phase 9-10: Integration
- TutorialBlock union: ✅
- Schema: ✅
- Renderer registration: ✅
- Composer integration: ✅

### Phase 11-14: Runtime Verification
- UBRC: ✅ [details]
- ILS: ✅ [details]
- LSNB: ✅ [details]
- RSSB: ✅ [details]

### Phase 15-16: Quality & Testing
- Accessibility: ✅ [WCAG level]
- Responsive: ✅ [devices tested]
- Security: ✅ [no issues]
- SSR: ✅ [verified]
- Tests: ✅ [X passing]

### Phase 17: E2E Certification
- Full lifecycle: ✅
- Evidence: [path]

### Phase 18: Repairs
- Repairs needed: [count]
- All repairs complete: ✅

## Detailed Verification

[Detailed sections for each verification...]

## Known Limitations

[Any known limitations or caveats]

## Gate 1 Conditions

[If Gate 1 was conditional, verify conditions addressed]

## Gate 2 Decisions

[If Gate 2 occurred, document how decision was implemented]

## Production Readiness

**Ready for production:** YES / NO

[Justification]
```

#### 2. Runtime Evidence

**Required artifacts:**
- Screenshots of block in Tutorial Page (all breakpoints)
- Screenshot of block in Composer
- Video recording of complete interaction (30s-2min)
- Video recording of Composer → Tutorial Page flow
- Browser console logs (no errors)
- Network logs showing ILS telemetry
- LSNB showing page with block
- RSSB showing block metrics (if read path ready)

#### 3. Test Results

**Required results:**
- TypeScript compilation: PASS
- ESLint: PASS
- Unit tests: X/X passing
- Component tests: X/X passing
- Integration tests: X/X passing
- E2E tests: X/X passing
- Accessibility audit: PASS (tool output)
- Build: SUCCESS

**Format:** Test output logs, build logs, audit reports

#### 4. Code Review Summary

**Document format:** Markdown

**Required sections:**
```markdown
## Code Review

### Files Modified/Created
[List of all files]

### Code Quality
- TypeScript: [assessment]
- React patterns: [assessment]
- Styling: [assessment]
- Tests: [assessment]

### Repository Compliance
- Follows D1/C1 patterns: ✅ / ⚠️
- Matches conventions: ✅ / ⚠️
- No anti-patterns: ✅ / ⚠️

### Issues Found & Resolved
1. [Issue] → [Resolution]
2. [Issue] → [Resolution]
...
```

#### 5. Verification Checklists

**UBRC Checklist:**
```markdown
- [ ] data-block-id present
- [ ] data-block-type present
- [ ] data-block-version present
- [ ] ActiveBlockContext discovers block
- [ ] IntersectionObserver compatible
- [ ] No direct ILS calls
- [ ] No lifecycle hooks
```

**ILS Checklist:**
```markdown
- [ ] Visit recorded
- [ ] Active time recorded
- [ ] Completion API compatible
- [ ] progressRole defined
- [ ] expectedTimeSec defined (if instructional)
- [ ] Backend persistence verified
- [ ] No block-specific ILS infrastructure
```

**LSNB Checklist:**
```markdown
- [ ] Page-level progress contribution verified
- [ ] No direct LSNB coupling
- [ ] Navigation compatibility verified
```

**RSSB Checklist:**
```markdown
- [ ] Passive RSSB participation
- [ ] Metrics available in block_learning_state
- [ ] No direct RSSB coupling
```

**Quality Checklist:**
```markdown
- [ ] WCAG AA compliance
- [ ] Mobile responsive (375px+)
- [ ] Tablet responsive (768px+)
- [ ] Desktop responsive (1024px+)
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader compatible
- [ ] SSR compatible
- [ ] No hydration errors
- [ ] No console errors
- [ ] No security vulnerabilities
```

#### 6. Architectural Impact Assessment

**Document format:** Markdown

**Required sections:**
```markdown
## Architectural Impact

### New Patterns Introduced
[None / List patterns]

### Platform Changes Made
[None / List changes from Gate 2]

### Contracts Modified
[None / List modifications]

### Future Implications
[Assessment of precedent set]

### Technical Debt
[None / List debt incurred]
```

### Evidence Completeness Check

Before requesting Gate 3 approval, Project LLM must verify:

```text
✅ Certification report complete
✅ Runtime evidence captured
✅ All test results included
✅ Code review complete
✅ All verification checklists complete
✅ Architectural impact assessed
✅ All Gate 1 conditions addressed (if applicable)
✅ All Gate 2 decisions implemented (if applicable)
```

### Final Approval Request Format

Project LLM requests approval with:

```text
FINAL APPROVAL REQUEST: Gate 3 — Production Certification

Block: [Name] [Version]
Phase: 19
Date: [YYYY-MM-DD]

Certification Status: COMPLETE

Evidence Location: [path or URL to complete certification package]

Recommendation: APPROVE / CONDITIONAL APPROVE

Summary:
- Repository integration: ✅
- Runtime verification: ✅
- Quality certification: ✅
- Tests: X/X passing
- No blocking issues

Requesting: Human final approval for Certified Production Tutorial Block

Project LLM: [Identifier]
```

### Human Review Process

Human reviews the following:

#### 1. Certification Report
- Is evidence complete?
- Are all verification steps documented?
- Are there any red flags?

#### 2. Visual/UX Review
- Open block in browser
- Interact with block
- Test responsive behavior
- Verify visual quality matches prototype
- Check accessibility basics (keyboard nav, focus)

#### 3. Composer Integration
- Open Composer
- Create block
- Edit block
- Save block
- Load block in Tutorial Page
- Verify workflow is smooth

#### 4. Test Results
- Review test output
- Verify no failures
- Verify coverage appropriate

#### 5. Architectural Impact
- Review any platform changes made
- Verify Gate 2 decisions implemented correctly
- Assess long-term implications

#### 6. Production Risk
- Any concerns about deploying this?
- Any edge cases not covered?
- Any performance concerns?

### Human Decisions

Human makes **ONE** of the following decisions:

#### DECISION A: APPROVE

**Meaning:**
```text
Block is certified for production
   ↓
Block becomes Certified Production Tutorial Block
   ↓
Available in Tutorial Composer ecosystem
```

**Format:**
```text
GATE 3 DECISION: APPROVE

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Certification: APPROVED

Comments: [Optional feedback]

Status: CERTIFIED PRODUCTION TUTORIAL BLOCK

Next Steps:
1. Commit to main branch
2. Deploy (if auto-deploy enabled)
3. Update block registry
4. Update documentation
5. Notify team

Approver: [Human name]
Approval Date: [YYYY-MM-DD]
Certification ID: [Unique ID]
```

**Effect:**
- Block is production-certified
- Block available in Composer
- Block documented in registry
- Success milestone

#### DECISION B: CONDITIONAL APPROVE

**Meaning:**
```text
Block is mostly ready
   +
Minor issues must be resolved
   ↓
Deploy with restrictions until conditions met
```

**Format:**
```text
GATE 3 DECISION: CONDITIONAL APPROVE

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Certification: CONDITIONALLY APPROVED

Conditions:
1. [Condition to resolve]
2. [Condition to resolve]
...

Restrictions Until Conditions Met:
- [ ] Limited to staging environment
- [ ] Limited to specific brands
- [ ] Limited to specific learner levels
- [ ] Feature flag protected
- [ ] Other: [specify]

Verification Required:
[Who verifies conditions resolved]

Once Conditions Met:
Block promoted to fully certified

Next Steps:
1. Address conditions
2. Verify resolution
3. Promote to full certification

Approver: [Human name]
```

**Effect:**
- Block deployed with restrictions
- Conditions tracked
- Full certification pending
- Follow-up verification required

#### DECISION C: REJECT / RETURN TO REPAIR

**Meaning:**
```text
Block not ready for production
   ↓
Issues must be resolved
   ↓
Return to Phase 18 (Repair Loop)
```

**Format:**
```text
GATE 3 DECISION: REJECT / RETURN TO REPAIR

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Rejection Reasons:
1. [Specific reason]
2. [Specific reason]
...

Required Fixes:
1. [Specific fix]
2. [Specific fix]
...

Severity: [Minor / Major / Critical]

Next Steps:
1. Return to Phase 18 (Repair Loop)
2. Project LLM fixes issues
3. Project LLM re-certifies
4. Resubmit for Gate 3

Approver: [Human name]
```

**Effect:**
- Block not certified
- Return to repair phase
- Issues fixed
- Re-certification required
- Resubmit to Gate 3

#### DECISION D: ABANDON

**Meaning:**
```text
Block cannot meet production standards
   +
Further investment not justified
   ↓
Block abandoned
```

**Format:**
```text
GATE 3 DECISION: ABANDON

Block: [Name] [Version]
Date: [YYYY-MM-DD]
Approver: [Human name]

Abandonment Reason:
[Why block is being abandoned at Gate 3]

Issues That Could Not Be Resolved:
1. [Issue]
2. [Issue]
...

Lessons Learned:
1. [Lesson]
2. [Lesson]
...

Approver: [Human name]
```

**Effect:**
- Block abandoned
- Work stopped
- Lessons documented

### Decision Documentation

All Gate 3 decisions are documented in:

```text
decisions/
└── gate-3-production-approval/
    ├── [block-name]-[version]-gate-3-certification.md
    ├── [block-name]-[version]-gate-3-evidence/
    ├── [block-name]-[version]-gate-3-decision.md
    └── [block-name]-[version]-gate-3-conditions.md (if conditional)
```

### Post-Approval Actions

After Gate 3 APPROVE:

```text
1. Git commit with certification metadata
2. Update CHANGELOG
3. Update block registry
4. Generate block documentation
5. Notify team
6. Deploy (if applicable)
7. Monitor initial usage
```

---

## APPROVAL PRINCIPLES

### 1. Evidence Before Approval

**Rule:** Approval requests must include complete evidence.

**Rationale:** Human cannot approve what they cannot review.

**Enforcement:** Incomplete evidence → Request rejected → Evidence completed → Resubmit

### 2. Documented Decisions

**Rule:** All approval decisions must be documented.

**Rationale:** Decisions are traceable, auditable, and provide historical context.

**Format:** Decision document as specified for each gate.

### 3. Binding Decisions

**Rule:** Human decisions are binding on both AIs.

**Rationale:** Human has final authority.

**Enforcement:** AIs must follow human decision without autonomous override.

### 4. Decision Reversibility

**Rule:** Humans may reverse previous decisions if new information emerges.

**Process:**
```text
New information discovered
   ↓
Human reviews new information
   ↓
Human may reverse previous decision
   ↓
Document reversal with rationale
   ↓
Proceed with new decision
```

### 5. No Gate Skipping

**Rule:** Gates cannot be skipped, even if "obviously approvable."

**Rationale:** Gates exist for quality control and risk management.

**Exception:** Human may explicitly waive a gate with documented justification (rare).

### 6. Iteration Tolerance

**Rule:** Rejections are not failures; they are quality control.

**Rationale:** Better to iterate until correct than to proceed with poor quality.

**Culture:** Rejection → improve → resubmit is normal and encouraged.

---

## APPROVAL TIMELINE

### Gate 1: Prototype Approval

**Expected timeline:** 1-3 business days after request

**Blocking:** Phase 4+ blocked until Gate 1 complete

### Gate 2: Architecture Review

**Expected timeline:** 2-5 business days after request (complexity dependent)

**Blocking:** Candidate integration blocked until Gate 2 complete

**Urgency:** High (Project LLM is stopped)

### Gate 3: Final Production Approval

**Expected timeline:** 2-7 business days after request

**Blocking:** Production deployment blocked until Gate 3 complete

---

## SUMMARY

This contract establishes:

1. **Three mandatory gates:** Prototype, Architecture Review, Production
2. **Evidence requirements** for each gate
3. **Human review process** for each gate
4. **Decision options** for each gate (APPROVE / REJECT / CONDITIONAL / etc.)
5. **Decision documentation** requirements
6. **Approval principles** (evidence before approval, binding decisions, etc.)
7. **No gate skipping** enforcement

**This contract ensures human control over critical decision points while allowing AI actors to execute their responsibilities efficiently between gates.**

---

**END OF PHASE 0.2 CONTRACT**

**Status:** FROZEN  
**Next Phase:** 0.3 — Repository Modification Contract
