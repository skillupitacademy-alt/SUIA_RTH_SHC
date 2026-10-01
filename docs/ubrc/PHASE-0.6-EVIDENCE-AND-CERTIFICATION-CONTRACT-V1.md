# Phase 0.6 — Evidence & Certification Contract V1

**Status:** FROZEN  
**Created:** 2026-09-30  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  
**Versioning Governance:** Phase 0.10 V1 - Contract Versioning & Evolution

---

## DEPENDENCIES

**This contract depends on:**
- Phase 0.1 — AI Roles & Responsibility Contract V1
- Phase 0.2 — Human Approval Contract V1
- Phase 0.3 — Repository Modification Contract V1
- Phase 0.4 — Runtime Boundary Contract V1
- Phase 0.4 — Validation Audit V1 (qualifications)
- Phase 0.5 — Handoff Protocol Contract V1

**This contract must not contradict:**
- Phase 0.1 (responsibility and authority boundaries)
- Phase 0.2 (human approval gates and decisions)
- Phase 0.3 (repository modification authority)
- Phase 0.4 (runtime boundaries and constraints)
- Phase 0.5 (handoff states and acceptance criteria)

**If conflict discovered:**
- STOP immediately
- Document the contradiction
- Do NOT modify frozen contracts
- Request human architecture review

---

## 1. PURPOSE

This contract defines **exactly what evidence is required, how evidence supports certification claims, what certification means, and how the complete evidence chain enables lifecycle auditability**.

**Core Principle:**  

> **NO CLAIM WITHOUT EVIDENCE**

**Scope:**  
All evidence collection, verification, and certification activities across the entire Tutorial Block lifecycle (Phase 1-20).

---

## 2. FUNDAMENTAL DISTINCTIONS

### 2.1 Critical Terms (NOT Interchangeable)

This contract establishes that the following terms have **distinct, non-interchangeable meanings**:

| Term | Meaning |
|------|---------|
| **Declared** | Someone claims a capability exists |
| **Documented** | A document describes the capability |
| **Observed** | A real execution demonstrated behavior |
| **Verified** | Project LLM independently checked evidence against requirement |
| **Validated** | Behavior tested against acceptance criteria |
| **Certified** | Complete evidence set satisfies certification criteria + required approvals |
| **Approved** | Human made explicit approval decision |

**NEVER promote:**
- Documented → Verified (without evidence)
- Verified → Certified (without full criteria)
- Self-Validation → Certification
- Approval → Technical Verification
- Technical Verification → Approval

---

### 2.2 Lifecycle State Distinctions

```
Candidate Self-Validation
        ≠
Project LLM Verification
        ≠
Integration
        ≠
Runtime Verification
        ≠
Certification
        ≠
Human Final Approval
        ≠
Production Deployment
```

**Each state requires distinct evidence.**

---

## 3. EVIDENCE DEFINITION

### 3.1 What Is Evidence

**Evidence** is an independently reviewable artifact or observation that supports a specific claim about a candidate or production block.

**Evidence is NOT:**
- Assertion without support
- "It looks correct"
- "Tests passed" (without specifying which tests, when, what version)
- "AI verified it"
- "Works locally"
- Documentation (documentation is a claim, not evidence of behavior)

**Evidence characteristics:**
- **Attributable:** Who produced it, when, how
- **Specific:** Supports a particular claim
- **Reviewable:** Can be independently inspected
- **Versioned:** Tied to specific candidate/repository state
- **Relevant:** Actually supports the claim being made
- **Temporal:** Has timestamp/context

---

### 3.2 Evidence Quality Requirements

**Strong evidence includes:**

| Element | Description |
|---------|-------------|
| **WHAT** | What was tested/observed |
| **WHEN** | Timestamp |
| **WHERE** | Environment (local/CI/staging/production) |
| **HOW** | Method/tool used |
| **VERSION** | Candidate version, repository revision |
| **RESULT** | Specific outcome |
| **LIMITATIONS** | What was NOT tested/verified |

**Weak evidence examples:**
- "Looks correct" — subjective, not reproducible
- "Tests passed" — which tests? when? what version?
- "AI verified it" — what did AI check? how?
- "Works locally" — which environment? which revision?

---

## 4. EVIDENCE CLASSES

### 4.1 Primary Evidence Classes

| Class | Produced By | Purpose | Example |
|-------|-------------|---------|---------|
| **A. Candidate Evidence** | External AI | Self-validation results | Lint results, tests, prototype |
| **B. Human Approval Evidence** | Human | Gate decisions | Gate 1 decision record |
| **C. Handoff Evidence** | External AI + Project LLM | Package completeness | Manifest, acceptance report |
| **D. Repository Evidence** | Project LLM | Architecture verification | Audit report, compatibility checks |
| **E. Build Evidence** | Project LLM | Compilation/build success | TypeScript compilation logs, build output |
| **F. Static Analysis Evidence** | Project LLM | Code quality | Lint results, type-check results |
| **G. Unit/Component Test Evidence** | Project LLM | Component behavior | Test results, coverage reports |
| **H. Integration Evidence** | Project LLM | System integration | Integration test results |
| **I. Runtime Evidence** | Project LLM | Actual runtime behavior | Browser execution, DOM inspection |
| **J. Browser/E2E Evidence** | Project LLM | End-to-end flow | E2E test results, screenshots |
| **K. Accessibility Evidence** | Project LLM | A11y compliance | WCAG audit, keyboard nav tests |
| **L. Security Evidence** | Project LLM | Security compliance | Dependency audit, XSS checks |
| **M. Performance Evidence** | Project LLM | Performance characteristics | Load times, render performance |
| **N. UBRC Evidence** | Project LLM | UBRC contract compliance | DOM identity verification |
| **O. ILS Evidence** | Project LLM | ILS participation | Active time tracking, completion |
| **P. LSNB Evidence** | Project LLM | Progress tracking | Navigation progress behavior |
| **Q. RSSB Evidence** | Project LLM | State synchronization | Cross-tab sync verification |
| **R. Certification Evidence** | Project LLM | Complete certification record | Certification report |
| **S. Final Approval Evidence** | Human | Production approval | Gate 3 decision record |

**Not every class required for every block.** Requirements depend on block's role, runtime participation, and applicable contracts.

---

## 5. EVIDENCE MATURITY LEVELS

### 5.1 Maturity Progression

```
DECLARED
    ↓
    Someone claims capability exists
    Evidence: Statement, documentation
    
    ↓
DOCUMENTED
    ↓
    Document describes capability
    Evidence: Specification, design doc
    
    ↓
OBSERVED
    ↓
    Real execution demonstrated behavior
    Evidence: Test result, runtime log, screenshot
    
    ↓
VERIFIED
    ↓
    Project LLM independently checked evidence
    Evidence: Verification report, inspection log
    
    ↓
CERTIFIED
    ↓
    Complete evidence set + required approvals satisfied
    Evidence: Certification report + approval records
```

**NEVER skip levels without justification.**

---

### 5.2 Maturity Level Rules

**DECLARED → DOCUMENTED:**
- Requires: Formal specification document
- Does NOT prove: Implementation exists

**DOCUMENTED → OBSERVED:**
- Requires: Actual execution evidence (test result, runtime log)
- Does NOT prove: Comprehensive coverage

**OBSERVED → VERIFIED:**
- Requires: Independent review of evidence against requirement
- Does NOT prove: Production readiness

**VERIFIED → CERTIFIED:**
- Requires: Complete evidence set + all certification criteria + required approvals
- Proves: Block meets certification contract

---

## 6. EVIDENCE OWNERSHIP

### 6.1 Responsibility Matrix

| Evidence Producer | May Produce | May NOT Produce |
|------------------|-------------|-----------------|
| **External AI** | Candidate self-validation, prototype evidence, candidate tests, design docs | Project LLM verification, repository audit, runtime verification, certification |
| **Project LLM** | Repository audit, integration evidence, runtime verification, test results, certification evidence | Human approval decisions, final production approval |
| **Human** | Approval decisions, architecture decisions, Gate decisions | Technical verification (delegates to Project LLM) |

**Critical Rule:**  
**A party may NOT certify its own claims when governance requires independence.**

Examples:
- External AI claims "ILS integration works" → Project LLM must independently verify
- Project LLM claims "ready for certification" → Human must approve (Gate 3)
- Block claims "accessible" → Independent accessibility testing required

---

## 7. EVIDENCE PROVENANCE

### 7.1 Required Metadata

**Every material evidence item MUST include:**

```json
{
  "evidenceId": "EV-001-20260930-143022",
  "candidateId": "InteractiveQuiz-v1.0",
  "candidateVersion": "1.0",
  "blockType": "interactive-quiz",
  "evidenceType": "runtime-verification",
  "claim": "Block renders with required DOM attributes",
  "producer": "Project LLM",
  "verifier": "Project LLM",
  "timestamp": "2026-09-30T14:30:22Z",
  "environment": "local-dev",
  "repositoryRevision": "abc123f",
  "phase": "11 (UBRC Verification)",
  "result": "PASS",
  "limitations": "Tested in Chrome only, not Firefox/Safari",
  "relatedRequirement": "REQ-UBRC-001",
  "relatedTest": "TEST-UBRC-001",
  "evidenceLocation": "evidence/ubrc/dom-attributes-verification.json",
  "supersedes": null
}
```

**Purpose:**
- Traceability: Can trace back to requirement
- Reproducibility: Can rerun under same conditions
- Auditability: Can review decision basis
- Versioning: Can identify when evidence applies

---

### 7.2 Evidence Lifecycle States

```
CREATED
    ↓
    Evidence item created
    
    ↓
RECORDED
    ↓
    Evidence formally recorded in evidence repository
    
    ↓
VERIFIED
    ↓
    Evidence reviewed and accepted as valid
    
    ↓
ACCEPTED
    ↓
    Evidence incorporated into certification decision
    
    ↓
SUPERSEDED
    ↓
    Newer evidence replaces this item (preserve history)
    
    ↓
INVALIDATED
    ↓
    Evidence no longer valid (code changed, environment changed)
    
    ↓
ARCHIVED
    ↓
    Evidence retained for historical audit
```

**NEVER:**
- Created → Certified (without verification)
- Invalidated → Deleted (preserve for audit)

---

## 8. CLAIM → EVIDENCE MATRIX

### 8.1 Required Evidence Per Claim

| Claim | Required Evidence | Evidence Type | Who Produces |
|-------|-------------------|---------------|--------------|
| "Block renders correctly" | Browser render, DOM inspection, screenshot | Runtime | Project LLM |
| "Block participates in UBRC" | DOM attributes present, renderer registration | Repository + Runtime | Project LLM |
| "ILS records active time" | Network trace, backend persistence, runtime observation | Runtime | Project LLM |
| "Completion formula applied" | Completion API call, state persistence, threshold calculation | Runtime | Project LLM |
| "LSNB progress updates" | Progress state change, navigation update | Runtime | Project LLM |
| "RSSB synchronization works" | Cross-tab sync, multi-device sync, state persistence | Runtime | Project LLM |
| "Block is accessible" | Keyboard nav test, ARIA audit, screen reader test, contrast check | Accessibility | Project LLM |
| "Block is responsive" | Mobile/tablet/desktop screenshots, breakpoint test | Responsive | Project LLM |
| "Tests pass" | Test execution log, coverage report | Test | Project LLM |
| "TypeScript compiles" | Compilation log, no errors | Build | Project LLM |
| "Human approved prototype" | Gate 1 decision record | Approval | Human |
| "Human approved production" | Gate 3 decision record | Approval | Human |

**IMPORTANT:**  
Do NOT assume capabilities merely because documentation mentions them. Evidence must prove actual behavior where runtime behavior is a certification requirement.

---

### 8.2 Conditional Evidence Requirements

**Evidence requirements depend on:**

1. **Block's progressRole:**
   - `instructional` → Requires ILS completion evidence
   - `structural` → May not require completion evidence
   - `navigational` → May require LSNB evidence
   - `decorative` → Minimal runtime evidence required

2. **Block's runtime participation:**
   - Participates in ILS → Requires ILS evidence
   - Does not participate in ILS → ILS evidence NOT_APPLICABLE
   - Participates in RSSB → Requires sync evidence
   - Does not participate in RSSB → RSSB evidence NOT_APPLICABLE

3. **Platform contracts:**
   - UBRC contract applies → Requires UBRC evidence
   - Phase 0.4 runtime boundary applies → Requires runtime compliance evidence
   - SSR enabled → Requires SSR/hydration evidence
   - SSR not enabled → SSR evidence NOT_APPLICABLE

**Do NOT force universal evidence requirements on all blocks.**

---

## 9. PHASE-SPECIFIC EVIDENCE REQUIREMENTS

### 9.1 Evidence by Lifecycle Phase

| Phase | Evidence Required | Purpose |
|-------|-------------------|---------|
| **Phase 1** | Requirement specification | Establishes what to build |
| **Phase 2** | Prototype (HTML/CSS/JS), design screenshots | Demonstrates visual/interaction intent |
| **Phase 3** | Gate 1 submission, Gate 1 decision | Human prototype approval |
| **Phase 4** | React candidate, TypeScript types, tests | Complete candidate implementation |
| **Phase 5** | Self-validation results (lint/typecheck/test) | Candidate quality baseline |
| **Phase 6** | Handoff package, manifest, completeness verification | Formal handoff acceptance |
| **Phase 7** | Repository audit report, architecture compatibility | Repository integration readiness |
| **Phase 8** | Adaptation log, production hardening changes | Candidate → production transformation |
| **Phase 9** | Integration evidence (schema, renderer, composer) | Production integration complete |
| **Phase 10** | Composer integration evidence | Tutorial authoring workflow |
| **Phase 11** | UBRC contract evidence (DOM identity, registration) | UBRC compliance |
| **Phase 12** | ILS evidence (active time, completion, persistence) | ILS participation |
| **Phase 13** | LSNB evidence (progress tracking) | Navigation progress |
| **Phase 14** | RSSB evidence (cross-tab/device sync) | State synchronization |
| **Phase 15** | Accessibility, responsive, security, SSR evidence | Quality attributes |
| **Phase 16** | Automated test results, build results | Test suite execution |
| **Phase 17** | E2E test results, complete flow evidence | End-to-end certification |
| **Phase 18** | Repair log, revalidation evidence (if needed) | Issue resolution |
| **Phase 19** | Certification report, Gate 3 submission, Gate 3 decision | Final approval |
| **Phase 20** | Production deployment record | Certified production block |

**Key Principle:**  
Phase 2 evidence does NOT substitute for Phase 17 evidence.  
Phase 5 self-validation does NOT substitute for Phase 16 Project LLM testing.

---

## 10. VERIFICATION VS CERTIFICATION

### 10.1 Verification Definition

**Verification** is the act of independently checking evidence against a specific requirement or claim.

**Verification asks:**
- Does evidence exist?
- Is evidence valid?
- Does evidence support the specific claim?
- Is evidence sufficient?
- Is evidence current?

**Verification produces:**
- Verification report
- PASS / FAIL / INSUFFICIENT / NOT_APPLICABLE decision
- Identified gaps
- Recommendations

**Verification does NOT automatically grant:**
- Certification
- Production approval
- Deployment authority

---

### 10.2 Certification Definition

**Certification** is the formal determination that a block satisfies ALL required certification criteria and has obtained ALL required approvals.

**A block may be considered CERTIFIED only when:**

1. ✅ Candidate identity established
2. ✅ Required human approvals exist (Gate 1, Gate 2 if triggered, Gate 3)
3. ✅ Handoff evidence complete
4. ✅ Repository audit complete
5. ✅ Architecture compatibility established
6. ✅ Runtime boundary compliance verified
7. ✅ Required integration complete
8. ✅ Required tests pass
9. ✅ Required runtime behavior verified
10. ✅ Required quality attributes verified (accessibility, security, responsive)
11. ✅ UBRC evidence complete (if applicable)
12. ✅ ILS evidence complete (if applicable)
13. ✅ LSNB evidence complete (if applicable)
14. ✅ RSSB evidence complete (if applicable)
15. ✅ Known exceptions explicitly approved
16. ✅ No unresolved STOP conditions
17. ✅ Certification evidence complete
18. ✅ Final human approval obtained (Gate 3)

**IMPORTANT:**  
Conditional requirements (12-14) depend on block's role and platform contracts.  
NOT_APPLICABLE is a valid certification state for non-applicable requirements.

---

### 10.3 Certification Is NOT a Score

**Certification is a binary state, not a percentage:**

✅ **CERTIFIED** — All required criteria satisfied  
❌ **NOT CERTIFIED** — One or more required criteria not satisfied

**Do NOT create:**
- "95% certified"
- "Almost certified"
- "Mostly certified"
- "Certification score: 8.5/10"

**Valid certification-related states:**
- **NOT_STARTED** — Certification not begun
- **IN_PROGRESS** — Collecting evidence
- **BLOCKED** — Missing required evidence or approval
- **REQUIRES_REVALIDATION** — Evidence stale or invalidated
- **CERTIFICATION_READY** — All criteria met, awaiting final approval
- **CERTIFIED** — Fully certified
- **REVOKED** — Certification withdrawn

---

## 11. CERTIFICATION AUTHORITY

### 11.1 Authority Distribution

| Decision | Authority | Cannot Be Delegated To |
|----------|-----------|----------------------|
| **Technical verification** | Project LLM | External AI |
| **Certification preparation** | Project LLM | External AI |
| **"Certification criteria satisfied"** | Project LLM | External AI, automatic process |
| **Gate 1 approval** | Human | Project LLM, External AI |
| **Gate 2 architecture decision** | Human | Project LLM, External AI |
| **Gate 3 final approval** | Human | Project LLM, External AI |
| **"Approved for production"** | Human | Project LLM, External AI |

**Critical Rule:**  
Project LLM can determine: "Technical certification criteria are satisfied."  
This does NOT automatically mean: "Human has approved production release."

**Where Phase 0.2 requires human final approval, BOTH are required:**
- Technical certification ✅
- Human approval ✅

---

## 12. CERTIFICATION REPORT STRUCTURE

### 12.1 Required Sections

**The certification report MUST contain:**

```markdown
# CERTIFICATION REPORT

## A. Certification Identity
- Certification ID
- Certification Date
- Certifying Authority (Project LLM identifier)

## B. Candidate Identity
- Candidate ID
- Candidate Version
- Block Type
- Block Name

## C. Repository State
- Repository Revision (commit hash)
- Branch
- Build Version
- Environment

## D. Lifecycle Summary
- Phase 1-20 completion status
- Gate 1 approval (date, approver)
- Gate 2 decisions (if any)
- Revision history

## E. Architecture Verification
- Repository audit results
- Architecture compatibility
- Runtime boundary compliance
- Phase 0.4 compliance

## F. Runtime Evidence Summary
- UBRC evidence status
- ILS evidence status (if applicable)
- LSNB evidence status (if applicable)
- RSSB evidence status (if applicable)

## G. Quality Attributes
- Accessibility evidence
- Responsive evidence
- Security evidence
- SSR/hydration evidence (if applicable)
- Performance evidence

## H. Test Results
- Unit tests (X passing)
- Component tests (X passing)
- Integration tests (X passing)
- E2E tests (X passing)
- Coverage (X%)

## I. Known Limitations
- Documented limitations
- Testing gaps
- Platform dependencies

## J. Approved Exceptions
- Exception ID
- Reason
- Risk
- Approving authority

## K. STOP/Resolution History
- STOP conditions encountered
- Resolution decisions
- Human architecture decisions

## L. Evidence Index
- Complete list of evidence items
- Evidence → Claim → Requirement traceability

## M. Certification Decision
- CERTIFIED / NOT CERTIFIED / BLOCKED
- Decision date
- Decision rationale

## N. Final Human Approval
- Gate 3 status
- Approval date
- Approving authority

## O. Certification Timestamp
- Certification Date/Time
- Valid for Repository Revision: [commit hash]
```

---

### 12.2 Evidence Index Structure

**Each certification claim must reference supporting evidence:**

```
CLAIM-001: "Block renders with required DOM attributes"
    ↓
REQUIREMENT: REQ-UBRC-001 (UBRC Contract - DOM Identity)
    ↓
TEST: TEST-UBRC-001 (DOM Attribute Verification)
    ↓
EVIDENCE: EV-001-UBRC-DOM (Screenshot, DOM inspection)
    ↓
VERIFICATION: VERIFIED by Project LLM on 2026-09-30
    ↓
RESULT: PASS
```

**Purpose:**  
Auditor can navigate from CERTIFIED status back through evidence chain to original requirement.

---

## 13. REQUIREMENT TRACEABILITY

### 13.1 Complete Traceability Chain

```
Requirement
    ↓
Design Decision
    ↓
Prototype Implementation
    ↓
Candidate Implementation
    ↓
Test Specification
    ↓
Test Execution
    ↓
Evidence
    ↓
Verification
    ↓
Certification
```

**No material certification requirement should be orphaned.**

**No certification evidence should exist without knowing what claim it supports** (unless explicitly supplemental evidence).

---

### 13.2 Bidirectional Traceability

**Forward Traceability:**
```
Requirement REQ-001
    ↓
"What implements this?"
    ↓
Candidate Component [BlockName].tsx
    ↓
"What tests this?"
    ↓
Test TEST-001
    ↓
"What evidence proves this?"
    ↓
Evidence EV-001
```

**Backward Traceability:**
```
Evidence EV-001
    ↓
"What claim does this support?"
    ↓
Claim CLAIM-001
    ↓
"What requirement mandated this?"
    ↓
Requirement REQ-001
```

---

## 14. REPOSITORY STATE IDENTIFICATION

### 14.1 Required Context

**Certification MUST identify repository state:**

```json
{
  "repository": "quiz-platform",
  "branch": "feature/block-interactive-quiz-certification",
  "commit": "abc123f7e8d9",
  "buildVersion": "1.0.0-beta.3",
  "certificationEnvironment": "CI",
  "certifiedDate": "2026-09-30T16:45:00Z"
}
```

**Purpose:**  
Cannot certify a moving target. If repository changes after certification, must determine if revalidation required.

---

### 14.2 Revalidation Triggers

**Certification MAY require revalidation when:**

| Change | Revalidation Required? |
|--------|----------------------|
| Certified code modified | ✅ YES |
| Runtime contract modified | ✅ YES |
| Universal infrastructure modified (ILS, LSNB, RSSB) | ✅ YES |
| Database schema modified | ⚠️ EVALUATE |
| Unrelated block modified | ❌ NO |
| Documentation only modified | ❌ NO |
| New dependency added | ⚠️ EVALUATE |
| Security vulnerability discovered | ✅ YES |

---

## 15. ENVIRONMENT IDENTITY

### 15.1 Environment Classification

**Evidence must identify execution environment:**

| Environment | Purpose | Typical Certification Usage |
|-------------|---------|----------------------------|
| **local-dev** | Development testing | Development iteration, initial verification |
| **CI** | Automated testing | Reproducible builds, automated test execution |
| **staging** | Pre-production verification | Integration testing, near-production validation |
| **production** | Live environment | Production behavior verification (when applicable) |

**Environment selection for certification evidence must be appropriate to:**
- The specific claim being made
- The applicable validation requirements (defined in Phase 0.7)
- The runtime contracts being verified
- The risk profile of the block

**Do NOT treat local success as production verification** unless governance explicitly permits equivalence.

**The required environments for certification evidence are determined by the applicable validation and testing contract (Phase 0.7), not universally mandated by Phase 0.6.**

---

### 15.2 Environment-Specific Evidence

**Different environments may produce different evidence:**

**Local:**
- Quick iteration
- Component testing
- Visual inspection

**CI:**
- Reproducible builds
- Automated test suite
- Lint/typecheck/test results

**Staging:**
- Near-production environment
- Integration testing
- E2E testing
- Runtime verification

**Production:**
- Actual production behavior
- Real user impact
- Performance under load

**Certification typically requires at minimum: CI evidence + staging/production validation.**

---

## 16. TEST EVIDENCE REQUIREMENTS

### 16.1 Minimum Test Evidence Metadata

```json
{
  "testId": "TEST-UBRC-001",
  "testName": "Verify block renders with data-block-id",
  "testType": "integration",
  "testVersion": "1.0",
  "environment": "CI",
  "executionTimestamp": "2026-09-30T14:30:00Z",
  "repositoryRevision": "abc123f",
  "candidateVersion": "InteractiveQuiz-v1.0",
  "result": "PASS",
  "duration": "250ms",
  "affectedRequirement": "REQ-UBRC-001",
  "verifier": "Project LLM",
  "evidenceLocation": "test-results/ubrc-001.json",
  "logs": "test-results/ubrc-001.log"
}
```

**Weak test evidence:**
- "Tests passed" — which tests? when?
- Green checkmark — what does it mean?

**Strong test evidence:**
- Specific test identified
- Execution context known
- Result clearly stated
- Logs available for inspection

---

## 17. RUNTIME EVIDENCE REQUIREMENTS

### 17.1 When Runtime Evidence Required

**Runtime evidence is required to prove actual behavior when:**

- Runtime behavior is part of certification criteria
- Source code inspection insufficient to prove behavior
- Runtime contracts (UBRC, ILS, LSNB, RSSB) apply
- Cross-system integration must be verified
- Timing/asynchronous behavior matters

**Runtime evidence may include:**

| Evidence Type | Purpose | Example |
|---------------|---------|---------|
| **DOM inspection** | Prove DOM structure | Screenshot showing data-block-id |
| **Network trace** | Prove API calls | Network log showing completion POST |
| **Browser console** | Prove client behavior | Console log showing no errors |
| **Backend logs** | Prove persistence | Database query showing state record |
| **State inspection** | Prove state management | Redux/state snapshot |
| **Cross-tab test** | Prove RSSB sync | State change in Tab A appears in Tab B |
| **Timing measurement** | Prove performance | Render time <200ms |

---

### 17.2 Runtime Evidence vs Source Inspection

**Source inspection may prove:**
- "Code appears to implement X"
- "API call is present in code"
- "Component has required props"

**Runtime evidence proves:**
- "X actually occurs at runtime"
- "API call actually executes and succeeds"
- "Component actually renders with required props"

**Certification may require BOTH:**
- Source inspection (static verification)
- Runtime evidence (dynamic verification)

---

## 18. UBRC EVIDENCE

### 18.1 Required UBRC Evidence

**To certify UBRC compliance, provide evidence for:**

1. **DOM Identity:**
   - `data-block-id` attribute present ✅
   - `data-block-type` attribute present ✅
   - `data-block-version` attribute present (if applicable) ✅

2. **Component Contract:**
   - Component accepts `block` prop ✅
   - Component destructures required fields (id, type, content) ✅
   - TypeScript types align with TutorialBlock union ✅

3. **Renderer Registration:**
   - Case statement exists in TutorialBlockRenderer ✅
   - Type ID matches block type ✅
   - Import path correct ✅

4. **Runtime Discovery:**
   - Block discoverable by runtime (if ActiveBlockContext exists) ✅
   - Block visible to universal observers (if applicable) ✅

**Evidence format:**
```markdown
## UBRC Evidence: InteractiveQuiz

### DOM Identity (PASS)
- Screenshot: evidence/ubrc/dom-identity-screenshot.png
- DOM Inspection: `<div data-block-id="quiz-123" data-block-type="interactive-quiz">`
- Verified: 2026-09-30T14:30:00Z

### Component Contract (PASS)
- Props interface: react/InteractiveQuiz.types.ts (line 5)
- TypeScript compilation: PASS
- Verified: 2026-09-30T14:32:00Z

### Renderer Registration (PASS)
- Registration: TutorialBlockRenderer.tsx (line 95)
- Case statement: `case 'interactive-quiz': return <InteractiveQuiz ... />`
- Verified: 2026-09-30T14:33:00Z
```

---

## 19. ILS EVIDENCE

### 19.1 Required ILS Evidence (Conditional)

**ILS evidence required ONLY IF block participates in ILS (progressRole='instructional').**

**If NOT applicable (progressRole='structural'/'navigational'/'decorative'):**
```
ILS Evidence: NOT_APPLICABLE (block does not participate in instructional learning)
```

**If applicable, provide evidence for:**

1. **Visit Tracking:**
   - First visit recorded ✅
   - Subsequent visits recorded ✅
   - visit_count increments ✅

2. **Active Time Tracking:**
   - Active time accumulates when block visible ✅
   - Active time pauses when block not visible ✅
   - active_time_sec persisted to backend ✅

3. **Completion Behavior:**
   - Completion formula applied (active ≥ 0.8 × expected) ✅
   - Completion API called ✅
   - completed_at timestamp set ✅
   - Completion persisted to block_learning_state ✅

4. **Backend Persistence:**
   - Database record created ✅
   - Fields populated correctly ✅
   - Idempotency preserved (duplicate completion handled) ✅

**Evidence format:**
```markdown
## ILS Evidence: InteractiveQuiz

### progressRole: instructional
ILS tracking REQUIRED

### Active Time Tracking (PASS)
- Network trace: POST /api/learning-progress/heartbeat
- Payload: { blockId: "quiz-123", activeTimeSec: 45 }
- Response: 200 OK
- Verified: 2026-09-30T15:00:00Z

### Completion (PASS)
- Expected time: 120 seconds
- Active time: 97 seconds (80.8% of expected)
- Completion triggered: YES
- Network trace: POST /api/learning-progress/complete
- Database: block_learning_state WHERE block_id='quiz-123' → completed_at='2026-09-30 15:01:37'
- Verified: 2026-09-30T15:01:40Z
```

---

## 20. LSNB EVIDENCE

### 20.1 Required LSNB Evidence (Conditional)

**LSNB evidence required ONLY IF block participates in navigation progress.**

**Phase 0.4 Qualification applies:**  
LSNB implementation details require Phase 7 repository verification before claiming verified behavior.

**If applicable, provide evidence for:**

1. **Progress Contribution:**
   - Block completion updates navigation progress ✅
   - Sidebar/navigation reflects completion ✅

2. **Page-Level Progress:**
   - Page progress calculation includes block ✅
   - Progress percentage updated ✅

**Evidence must be based on actual repository implementation, not documentation alone.**

**Example:**
```markdown
## LSNB Evidence: InteractiveQuiz

### LSNB Participation: DOCUMENTED (requires runtime verification)

Phase 0.4 Qualification: LSNB implementation details not runtime-verified in Phase 0.4 audit.

Project LLM must verify during Phase 13:
- [ ] Navigation progress mechanism exists
- [ ] Block completion propagates to navigation
- [ ] Sidebar/nav UI updates on completion

Status: PENDING_PHASE_13_VERIFICATION
```

---

## 21. RSSB EVIDENCE

### 21.1 Required RSSB Evidence (Conditional)

**RSSB evidence required ONLY IF block participates in state synchronization.**

**Phase 0.4 Qualification applies:**  
RSSB WebSocket implementation details require Phase 7 repository verification before claiming verified behavior.

**If applicable, provide evidence for:**

1. **Cross-Tab Synchronization:**
   - Completion in Tab A appears in Tab B ✅
   - State consistency across tabs ✅

2. **Cross-Device Synchronization (if supported):**
   - Completion in Browser A appears in Browser B (same user) ✅
   - State consistency across devices ✅

3. **Conflict Handling:**
   - Duplicate completions handled correctly ✅
   - State conflicts resolved ✅

**Evidence must be based on actual behavior, not documentation.**

**Example:**
```markdown
## RSSB Evidence: InteractiveQuiz

### RSSB Participation: DOCUMENTED (requires runtime verification)

Phase 0.4 Qualification: RSSB implementation details not runtime-verified in Phase 0.4 audit.

Project LLM must verify during Phase 14:
- [ ] Cross-tab sync mechanism exists
- [ ] Completion propagates across tabs
- [ ] State consistency maintained

Status: PENDING_PHASE_14_VERIFICATION
```

---

## 22. ACCESSIBILITY EVIDENCE

### 22.1 Required Accessibility Evidence

**Minimum accessibility evidence:**

1. **Keyboard Navigation:**
   - All interactive elements keyboard-accessible ✅
   - Tab order logical ✅
   - Focus indicators visible ✅
   - No keyboard traps ✅

2. **Semantic Structure:**
   - Appropriate HTML elements (headings, buttons, etc.) ✅
   - Logical heading hierarchy ✅
   - Lists properly marked up ✅

3. **ARIA (when needed):**
   - ARIA attributes appropriate ✅
   - ARIA roles correct ✅
   - Live regions announced (if applicable) ✅

4. **Color Contrast:**
   - Text contrast ≥ 4.5:1 (WCAG AA) ✅
   - UI element contrast ≥ 3:1 (WCAG AA) ✅

5. **Screen Reader:**
   - Content announced correctly ✅
   - Interactions describable ✅
   - No confusing announcements ✅

**Evidence format:**
```markdown
## Accessibility Evidence: InteractiveQuiz

### WCAG Level: AA (Target)

### Keyboard Navigation (PASS)
- All buttons focusable: YES
- Tab order: Logical (Question → Options → Submit → Next)
- Focus indicators: Visible blue outline
- Keyboard traps: NONE
- Verified: Manual keyboard test 2026-09-30

### Color Contrast (PASS)
- Tool: WebAIM Contrast Checker
- Text on background: 7.2:1 (PASS AA)
- Button text: 5.1:1 (PASS AA)
- Verified: 2026-09-30

### Screen Reader (PASS)
- Tool: NVDA (Windows)
- Question announced: YES
- Options announced: YES
- Submit button described: "Submit answer button"
- Verified: 2026-09-30
```

**IMPORTANT:**  
Full WCAG validation requires manual testing with assistive technologies and expert accessibility review.

---

## 23. SECURITY EVIDENCE

### 23.1 Required Security Evidence

**Minimum security evidence:**

1. **Dependency Audit:**
   - No known vulnerabilities ✅
   - Dependencies up-to-date (or exceptions documented) ✅
   - Dependency integrity verified ✅

2. **XSS Prevention:**
   - No dangerouslySetInnerHTML without sanitization ✅
   - User input escaped ✅
   - Content Security Policy compliant ✅

3. **Data Validation:**
   - block.content validated (Zod/Yup/TypeScript) ✅
   - User input validated ✅
   - Malformed input handled gracefully ✅

4. **Secrets/Credentials:**
   - No secrets in code ✅
   - No API keys in frontend ✅
   - No tokens exposed ✅

5. **Runtime Boundaries:**
   - No prohibited operations (Phase 0.4) ✅
   - No unauthorized backend access ✅
   - No direct database access ✅

**Evidence format:**
```markdown
## Security Evidence: InteractiveQuiz

### Dependency Audit (PASS)
- Tool: npm audit
- Vulnerabilities: 0 high, 0 medium
- Last checked: 2026-09-30
- Evidence: security/npm-audit.log

### XSS Prevention (PASS)
- dangerouslySetInnerHTML: NOT USED
- User input: Escaped via React (automatic)
- Content rendering: Safe (no raw HTML)
- Verified: Code inspection 2026-09-30

### Data Validation (PASS)
- Schema: schema/content-schema.ts (Zod)
- Validation: Yes (parse on mount)
- Malformed handling: Error boundary
- Verified: Code inspection + test 2026-09-30

### No Secrets (PASS)
- API keys: NONE in frontend
- Tokens: NONE exposed
- Credentials: NONE present
- Verified: Code grep 2026-09-30
```

---

## 24. PERFORMANCE EVIDENCE

### 24.1 Performance Evidence (Optional Unless Required)

**If performance is certification requirement, provide evidence:**

1. **Render Performance:**
   - Initial render time ✅
   - Re-render time ✅
   - Time to interactive ✅

2. **Bundle Size:**
   - Component bundle size ✅
   - Asset sizes ✅
   - Total impact on page load ✅

3. **Resource Usage:**
   - Memory usage ✅
   - CPU usage (if intensive) ✅

**Do NOT impose arbitrary thresholds unless already defined by authoritative project contract.**

**Evidence format:**
```markdown
## Performance Evidence: InteractiveQuiz

### Render Performance
- Initial render: 45ms (measured via Chrome DevTools)
- Re-render (on state change): 12ms
- Environment: local-dev
- Note: No project-defined threshold; recorded for baseline
- Verified: 2026-09-30

### Bundle Size
- Component JS: 8.5 KB (minified + gzipped)
- Assets: 2.3 KB (images)
- Total: 10.8 KB
- Note: No project-defined threshold; recorded for baseline
- Verified: 2026-09-30
```

---

## 25. SSR / HYDRATION EVIDENCE

### 25.1 SSR Evidence (If Applicable)

**IF project uses SSR:**

1. **Server Render:**
   - Component renders on server without errors ✅
   - No `window` access during server render ✅
   - No `document` access during server render ✅

2. **Hydration:**
   - Client hydration succeeds ✅
   - No hydration mismatches ✅
   - Initial client render matches server HTML ✅

**IF project does NOT use SSR:**
```
SSR Evidence: NOT_APPLICABLE (project is client-side only)
```

**Evidence format:**
```markdown
## SSR Evidence: InteractiveQuiz

### SSR Status: REQUIRED (project uses Next.js SSR)

### Server Render (PASS)
- Server build: SUCCESS
- Server render: No errors
- window/document access: Properly guarded in useEffect
- Verified: 2026-09-30

### Hydration (PASS)
- Hydration: SUCCESS
- Console warnings: NONE
- Mismatch errors: NONE
- Verified: Chrome DevTools 2026-09-30
```

---

## 26. APPROVED EXCEPTIONS

### 26.1 Exception Definition

**An Approved Exception is a documented deviation from a certification requirement** that has been explicitly approved by appropriate authority.

**Exception Record Structure:**

```json
{
  "exceptionId": "EXC-001",
  "affectedRequirement": "REQ-A11Y-003 (Screen reader testing)",
  "reason": "Project does not have NVDA license; tested with macOS VoiceOver only",
  "risk": "Low (VoiceOver coverage provides 80% confidence)",
  "scope": "Screen reader testing limited to VoiceOver",
  "compensatingControl": "Manual VoiceOver testing performed",
  "approvingAuthority": "Human Architecture Authority",
  "approvalDate": "2026-09-30",
  "expirationCondition": "Valid until full screen reader testing capability available",
  "reviewDate": "2027-03-30"
}
```

**Exception must NEVER be silently treated as PASS.**

**Certification report must explicitly list ALL exceptions.**

---

## 27. EVIDENCE GAPS

### 27.1 Handling Missing Evidence

**When required evidence is missing:**

| Status | Meaning | Certification Impact |
|--------|---------|---------------------|
| **MISSING** | Evidence not yet created | BLOCKED |
| **INSUFFICIENT** | Evidence exists but inadequate | BLOCKED |
| **CONTRADICTORY** | Evidence conflicts | BLOCKED |
| **STALE** | Evidence outdated (code changed) | REQUIRES_REVALIDATION |
| **INVALID** | Evidence based on incorrect assumption | BLOCKED |
| **UNVERIFIED** | Claim not yet independently verified | BLOCKED (if verification required) |

**Do NOT:**
- Manufacture evidence
- Reinterpret unrelated evidence as proof
- Skip verification
- Certify with missing mandatory evidence

**DO:**
- Document gap
- Classify severity (mandatory vs optional)
- Block certification if mandatory
- Request evidence creation
- Revalidate after evidence provided

---

## 28. CONFLICTING EVIDENCE

### 28.1 Conflict Resolution

**If two evidence items conflict:**

```
CONFLICT DETECTED
    ↓
STOP certification decision
    ↓
Document:
    - Conflicting evidence A
    - Conflicting evidence B
    - Impact on certification
    ↓
Investigate:
    - Which evidence is correct?
    - Why do they conflict?
    - What is actual behavior?
    ↓
Resolve:
    - Retest/reverify
    - Update evidence
    - Document resolution
    ↓
Revalidate affected claims
```

**Example:**

**Evidence A (Source Code):**
```typescript
// Code indicates completion triggered after 60 seconds
if (activeTime >= 60) {
  recordCompletion();
}
```

**Evidence B (Runtime Observation):**
```
Runtime observation: Completion triggered after 96 seconds (80% of 120)
```

**Result:** CONFLICT

**Investigation:** Code snippet is from old version; actual implementation uses 80% formula

**Resolution:** Update source reference to current code; Evidence B is correct

---

## 29. STALE EVIDENCE

### 29.1 Evidence Invalidation Triggers

**Evidence becomes STALE when:**

| Change | Evidence Affected | Action |
|--------|-------------------|--------|
| Certified code modified | All evidence for that code | REVALIDATION REQUIRED |
| Repository revision changes | All runtime evidence | Evaluate if revalidation needed |
| Runtime contract modified (Phase 0.4) | Runtime evidence | REVALIDATION REQUIRED |
| Universal infrastructure modified (ILS, LSNB, RSSB) | Integration evidence | REVALIDATION REQUIRED |
| Dependency updated (major version) | Security, compatibility evidence | Evaluate if revalidation needed |
| Environment changed (staging → production) | Environment-specific evidence | Evidence for new environment required |

**Do NOT define arbitrary time-based expiration** unless authoritative requirement exists.

**Use change-based invalidation.**

---

## 30. CERTIFICATION REVOCATION

### 30.1 When Certification Must Be Revoked

**Certification MUST be revoked or marked for revalidation when:**

1. **Certified code changed materially** after certification
2. **Runtime contract changed** (Phase 0.4 amended)
3. **Universal infrastructure changed** (ILS, LSNB, RSSB modified)
4. **Certification evidence becomes invalid** (stale, incorrect, falsified)
5. **Security vulnerability discovered** in certified block
6. **Production behavior diverges** from certified behavior
7. **Previously verified architecture was incorrect**
8. **Certification based on false/incomplete evidence**

**Revocation Process:**

```
REVOCATION TRIGGER
    ↓
Mark certification: REVOKED
    ↓
Document:
    - Revocation reason
    - Evidence of cause
    - Impact assessment
    - Remediation plan
    ↓
Preserve historical certification record
    ↓
Revalidation required before recertification
```

**Do NOT:**
- Delete historical certification
- Silently edit old certification report
- Treat revocation as deletion

**DO:**
- Preserve V1 certification (marked REVOKED)
- Create new V2 certification after revalidation

---

## 31. CERTIFICATION IMMUTABILITY

### 31.1 Historical Record Preservation

**A certification report is an immutable historical record.**

**If block changes:**

```
CERTIFICATION V1
    (Block at commit abc123f)
    ↓
CODE CHANGE
    (Block modified to commit def456a)
    ↓
REVALIDATION
    ↓
CERTIFICATION V2
    (Block at commit def456a)
```

**Preserve V1 record:**
```
certifications/
├── InteractiveQuiz-v1.0-cert-v1.md (commit abc123f) [SUPERSEDED]
└── InteractiveQuiz-v1.0-cert-v2.md (commit def456a) [CURRENT]
```

**Do NOT:**
- Overwrite V1 with V2
- Edit V1 to reflect V2 changes
- Delete V1 when V2 created

---

## 32. AUDIT TRAIL

### 32.1 Complete Lifecycle Traceability

**An auditor must be able to reconstruct:**

```
Original Requirement (Phase 1)
    ↓
Prototype (Phase 2)
    ↓
Human Prototype Approval (Phase 3 / Gate 1)
    ↓
Candidate (Phase 4)
    ↓
Candidate Self-Validation (Phase 5)
    ↓
Handoff (Phase 6)
    ↓
Project LLM Repository Audit (Phase 7)
    ↓
Production Adaptation (Phase 8)
    ↓
Integration (Phase 9-10)
    ↓
Runtime Verification (Phase 11-14)
    ↓
Quality Verification (Phase 15)
    ↓
Testing (Phase 16)
    ↓
E2E Certification (Phase 17)
    ↓
Repair (Phase 18, if needed)
    ↓
Certification (Phase 19)
    ↓
Human Final Approval (Phase 19 / Gate 3)
    ↓
Production (Phase 20)
```

**Nothing material should disappear between stages.**

**All decisions, revisions, approvals documented.**

---

### 32.2 Evidence Retention

**Evidence must be retained for:**

- Complete lifecycle audit
- Certification validation
- Revocation investigation
- Future block evolution
- Compliance requirements
- Learning / process improvement

**Retention period:** TBD by project governance (recommend: indefinite for certified blocks)

---

## 33. CERTIFICATION GATE

### 33.1 Certification Gate Evaluation

**Before declaring CERTIFIED, Project LLM evaluates:**

```
✅ Evidence completeness (all required evidence present)
✅ Evidence validity (all evidence current and correct)
✅ Traceability (requirements → evidence chain complete)
✅ Architecture compatibility (Phase 0.4 compliance)
✅ Runtime compliance (UBRC, ILS, LSNB, RSSB as applicable)
✅ Test results (all required tests pass)
✅ Quality attributes (accessibility, security, responsive, SSR)
✅ Approved exceptions (all documented and approved)
✅ No unresolved STOP conditions
✅ No unresolved conflicts
✅ Human approvals obtained (Gate 1, Gate 2 if applicable, Gate 3)
```

**Possible outcomes:**

| Outcome | Meaning | Next Step |
|---------|---------|-----------|
| **CERTIFICATION_READY** | All criteria met, awaiting Gate 3 | Request Human final approval |
| **BLOCKED** | Missing mandatory evidence/approval | Resolve blockers, retry |
| **REQUIRES_REVALIDATION** | Evidence stale or invalid | Revalidate, retry |
| **CERTIFIED** | All criteria met + Gate 3 approved | Production deployment authorized |

---

## 34. NO PARTIAL CERTIFICATION

### 34.1 Binary Certification State

**Certification is binary: CERTIFIED or NOT CERTIFIED**

**Do NOT create:**
- "80% certified"
- "Almost certified"
- "Mostly certified"
- "Certification score: 4/5"

**Individual evidence categories may be:**
- PASS
- FAIL
- NOT_APPLICABLE
- UNVERIFIED
- BLOCKED

**But overall certification state:**
- CERTIFIED (all required criteria satisfied)
- NOT CERTIFIED (one or more required criteria not satisfied)

---

## 35. CONDITIONAL REQUIREMENTS

### 35.1 Role-Based Evidence Requirements

**Not all blocks have identical requirements.**

**Evidence requirements depend on:**

1. **Block's progressRole:**
   - `instructional` → ILS completion evidence REQUIRED
   - `structural` → ILS completion evidence NOT_APPLICABLE
   - `navigational` → LSNB evidence MAY BE REQUIRED
   - `decorative` → Minimal runtime evidence

2. **Platform participation:**
   - Participates in ILS → ILS evidence REQUIRED
   - Does not participate in ILS → ILS evidence NOT_APPLICABLE
   - Participates in RSSB → RSSB evidence REQUIRED
   - Does not participate in RSSB → RSSB evidence NOT_APPLICABLE

3. **Runtime contracts:**
   - SSR enabled → SSR evidence REQUIRED
   - SSR disabled → SSR evidence NOT_APPLICABLE
   - WCAG AA required → A11y evidence REQUIRED
   - Custom performance target → Performance evidence REQUIRED

**Do NOT force universal requirements on all blocks.**

**NOT_APPLICABLE is a valid certification result for non-applicable requirements.**

---

## 36. MACHINE-READABLE EVIDENCE

### 36.1 Structured Evidence Format

**Where appropriate, evidence should be machine-readable:**

**Example: Test Evidence (JSON)**
```json
{
  "testSuite": "UBRC Compliance Tests",
  "executionDate": "2026-09-30T14:30:00Z",
  "environment": "CI",
  "candidateVersion": "InteractiveQuiz-v1.0",
  "repositoryRevision": "abc123f",
  "results": {
    "total": 5,
    "passed": 5,
    "failed": 0,
    "skipped": 0
  },
  "tests": [
    {
      "id": "TEST-UBRC-001",
      "name": "Block renders with data-block-id",
      "result": "PASS",
      "duration": "45ms"
    },
    {
      "id": "TEST-UBRC-002",
      "name": "Block renders with data-block-type",
      "result": "PASS",
      "duration": "38ms"
    }
  ]
}
```

**Purpose:**
- Machine verification of completeness
- Automated certification gate evaluation
- Easier audit trail navigation

**Do NOT invent storage implementation** if repository does not have one. This defines the contract; implementation comes later.

---

## 37. EVIDENCE STORAGE CONCEPT

### 37.1 Conceptual Evidence Organization

**Evidence should be organized by:**

```
evidence/
├── [candidate-id]/
│   ├── manifest.json
│   ├── phases/
│   │   ├── phase-02-prototype/
│   │   ├── phase-03-gate-1/
│   │   ├── phase-05-self-validation/
│   │   ├── phase-06-handoff/
│   │   ├── phase-11-ubrc/
│   │   ├── phase-12-ils/
│   │   ├── phase-13-lsnb/
│   │   ├── phase-14-rssb/
│   │   ├── phase-15-quality/
│   │   ├── phase-16-tests/
│   │   ├── phase-17-e2e/
│   │   └── phase-19-certification/
│   ├── traceability/
│   │   └── requirement-evidence-matrix.json
│   └── certifications/
│       ├── certification-v1.md
│       └── certification-v2.md
```

**This is conceptual.**  
Do NOT create filesystem structure unless repository governance requires it.

---

## 38. EVIDENCE ACCESS CONTROL

### 38.1 Evidence Operations by Role

| Actor | May Create | May Modify | May Verify | May Approve | May Certify |
|-------|-----------|-----------|-----------|-------------|-------------|
| **External AI** | Candidate evidence | Own candidate evidence | Own candidate | ❌ NO | ❌ NO |
| **Project LLM** | Repository, runtime, test evidence | Own evidence | Evidence | ❌ NO (not final approval) | Technical certification |
| **Human** | Approval decisions | Own approval decisions | All evidence | ✅ YES | Final certification (Gate 3) |

**Evidence integrity rule:**  
Evidence must not be editable by actor who reviews its integrity (without audit trail).

---

## 39. CERTIFICATION PACKAGE CONCEPT

### 39.1 Final Certification Package Structure

**Conceptually:**

```
certification-package/
├── certification-report.md
├── evidence-index.json
├── requirement-traceability.json
├── test-results/
├── runtime-evidence/
├── security-evidence/
├── accessibility-evidence/
├── architecture-evidence/
├── approval-records/
├── exception-records/
└── audit-history/
```

**Purpose:**
- Complete certification record
- All supporting evidence
- Human-readable report
- Machine-readable index
- Audit trail

**This is conceptual evidence organization, not implementation.**

---

## 40. STOP CONDITIONS

### 40.1 Certification STOP Triggers

**Project LLM MUST STOP certification when:**

1. **Required evidence cannot be produced** (missing capability)
2. **Evidence conflicts materially** (unresolved contradiction)
3. **Certification authority unclear** (governance ambiguity)
4. **Human approval requirement unclear** (gate ambiguity)
5. **Repository revision cannot be identified** (unknown version)
6. **Runtime behavior cannot be verified** (where required)
7. **Architecture behavior unknown** (materially relevant)
8. **Evidence appears fabricated/manipulated** (integrity violation)
9. **Required evidence stale** (code changed after evidence collected)
10. **Frozen contract contradicted** (governance violation)
11. **Prohibited architecture change discovered** (Phase 0.4 violation)
12. **Security evidence reveals unresolved risk** (vulnerability)
13. **Certification requires assumption** (not evidence-based)

**STOP Protocol:**
- Stop certification decision
- Document evidence gap/conflict/issue
- Identify missing information
- Preserve existing evidence
- Do NOT manufacture pass
- Do NOT silently amend contract
- Escalate to appropriate authority (Human if needed)

---

## 41. NO RETROACTIVE CERTIFICATION

### 41.1 Historical Blocks

**Do NOT certify block merely because:**
- It existed for long time
- Users have used it
- It works in production
- Previous releases worked
- Someone says "already approved"

**Certification requires evidence per governance process.**

**Historical evidence MAY be reused IF:**
- Evidence sufficient for current certification
- Evidence attributable (know who/when/how)
- Evidence still valid (code hasn't changed)
- Evidence format acceptable

**Otherwise: Re-collect evidence.**

---

## 42. NO EVIDENCE FABRICATION

### 42.1 Absolute Prohibition

**NEVER fabricate:**
- Test results
- Runtime observations
- Screenshots
- API responses
- Database state
- Approval records
- Git revisions
- Deployment evidence
- Certification reports

**If evidence unavailable:**
- Status: UNVERIFIED
- If mandatory: BLOCKED
- If optional: NOT_COLLECTED

**Do NOT:**
- Invent test results
- Claim approval without record
- Create fake screenshots
- Manufacture logs
- Edit evidence retroactively (without audit trail)

---

## 43. CROSS-CONTRACT CONSISTENCY

### 43.1 Validation Against Frozen Contracts

**Phase 0.6 validated against:**

| Contract | Consistency Check | Result |
|----------|-------------------|--------|
| Phase 0.1 | Authority boundaries | ✅ Preserved |
| Phase 0.2 | Human approval gates | ✅ Referenced |
| Phase 0.3 | Repository authority | ✅ Respected |
| Phase 0.4 | Runtime boundaries | ✅ Inherited |
| Phase 0.5 | Handoff states | ✅ Extended |

**No contradictions detected.**

---

## 44. PHASE 0.4 QUALIFICATIONS PRESERVED

### 44.1 Carried-Forward Constraints

**Phase 0.4 Validation Audit qualifications:**

1. **LSNB implementation details** — documented but not runtime-verified
2. **RSSB WebSocket details** — documented but not runtime-verified
3. **ActiveBlockContext** — requires Phase 7 verification
4. **useLearningStateListener** — requires verification
5. **React version** — requires verification

**Phase 0.6 response:**

**LSNB Evidence (Section 20):**
```
LSNB Participation: DOCUMENTED (requires runtime verification)
Status: PENDING_PHASE_13_VERIFICATION
```

**RSSB Evidence (Section 21):**
```
RSSB Participation: DOCUMENTED (requires runtime verification)
Status: PENDING_PHASE_14_VERIFICATION
```

**Evidence maturity levels (Section 5):**
- DOCUMENTED ≠ VERIFIED
- Verification requires actual runtime evidence
- Project LLM must verify during appropriate phase

**Qualifications preserved. No premature claims.**

---

## 45. VERSIONING

### 45.1 Contract Versioning

**Version:** V1.0  
**Date:** 2026-09-30  
**Status:** FROZEN (pending final validation)

**Amendment Procedure:**
- Create PHASE-0.6-EVIDENCE-AND-CERTIFICATION-CONTRACT-V2.md
- Document what changed and why
- Identify impacted certifications
- Freeze V2
- V1 remains as historical record
- Update dependent contracts (Phase 0.7-0.10)

**Backward Compatibility:**
- Blocks certified under V1 remain certified per V1 criteria
- New certifications use latest version
- Migration guide if breaking changes

---

## 46. VALIDATION CHECKLIST

### 46.1 Contract Validation

**Before declaring Phase 0.6 FROZEN:**

```
✅ Purpose defined
✅ Evidence classes defined
✅ Evidence maturity levels defined
✅ Verification vs certification distinguished
✅ Certification criteria defined
✅ Certification authority defined
✅ Certification report structure defined
✅ Evidence traceability defined
✅ Conditional requirements defined
✅ STOP conditions defined
✅ Phase 0.1-0.5 consistency verified
✅ Phase 0.4 qualifications preserved
✅ No premature implementation assumptions
✅ No evidence fabrication permitted
✅ Cross-contract consistency validated
```

---

## 47. NEXT PHASE

**This contract is now FROZEN and governs evidence collection and certification across the Tutorial Block lifecycle.**

**Next Contract:** Phase 0.7 — Validation & Testing Contract

**Phase 0.7 should define:**
- Detailed testing requirements (unit, component, integration, E2E)
- Test coverage requirements
- Testing methodology
- Test environments
- Validation procedures
- Quality gates
- Test evidence format (building on Phase 0.6)

**Phase 0.7 will turn Phase 0.6's evidence framework into concrete testing procedures.**

---

## APPENDIX A: QUICK REFERENCE TABLES

### Evidence Class Summary

| Class | Producer | Required When | Example |
|-------|----------|---------------|---------|
| Candidate | External AI | Always | Self-validation results |
| Human Approval | Human | Gate 1, Gate 3 | Gate 1 decision record |
| Handoff | Project LLM | Always | Handoff acceptance report |
| Repository | Project LLM | Always | Architecture compatibility |
| Build | Project LLM | Always | TypeScript compilation |
| Static Analysis | Project LLM | Always | Lint/typecheck results |
| Unit/Component Test | Project LLM | Always | Test results |
| Integration | Project LLM | Always | Integration test results |
| Runtime | Project LLM | Runtime behavior required | Browser execution, DOM |
| E2E | Project LLM | Always | E2E test results |
| Accessibility | Project LLM | Always | WCAG audit, keyboard tests |
| Security | Project LLM | Always | Dependency audit, XSS checks |
| Performance | Project LLM | If required | Load times |
| UBRC | Project LLM | UBRC applies | DOM identity |
| ILS | Project LLM | progressRole='instructional' | Completion tracking |
| LSNB | Project LLM | Navigation participation | Progress updates |
| RSSB | Project LLM | State sync participation | Cross-tab sync |
| Certification | Project LLM | Phase 19 | Certification report |
| Final Approval | Human | Gate 3 | Gate 3 decision |

---

### Maturity Levels

| Level | Meaning | Evidence |
|-------|---------|----------|
| DECLARED | Claimed | Statement |
| DOCUMENTED | Specified | Documentation |
| OBSERVED | Demonstrated | Test result, log |
| VERIFIED | Independently checked | Verification report |
| CERTIFIED | Complete + approved | Certification report |

---

### Certification States

| State | Meaning |
|-------|---------|
| NOT_STARTED | Certification not begun |
| IN_PROGRESS | Collecting evidence |
| BLOCKED | Missing required evidence/approval |
| REQUIRES_REVALIDATION | Evidence stale or invalid |
| CERTIFICATION_READY | Criteria met, awaiting Gate 3 |
| CERTIFIED | Fully certified |
| REVOKED | Certification withdrawn |

---

## APPENDIX B: EXAMPLE CERTIFICATION REPORTS

### Example 1: Fully Certified Block

```markdown
# CERTIFICATION REPORT: InteractiveQuiz v1.0

**Certification ID:** CERT-IQ-001-20260930  
**Certification Date:** 2026-09-30T16:45:00Z  
**Certifying Authority:** Project LLM (Kiro)

---

## A. Candidate Identity
- **Candidate ID:** InteractiveQuiz-v1.0
- **Block Type:** interactive-quiz
- **Block Name:** Interactive Quiz

## B. Repository State
- **Repository:** quiz-platform
- **Branch:** feature/block-interactive-quiz
- **Commit:** abc123f7e8d9
- **Build Version:** 1.0.0-beta.3
- **Environment:** CI + Staging

## C. Lifecycle Summary
- Phase 1-20: COMPLETE
- Gate 1: APPROVED (2026-09-28, Jane Smith)
- Gate 2: NOT TRIGGERED
- Gate 3: APPROVED (2026-09-30, Jane Smith)

## D. Architecture Verification
- Repository audit: COMPLETE
- Architecture compatibility: PASS
- Runtime boundary compliance: PASS
- Phase 0.4 compliance: PASS

## E. Runtime Evidence
- **UBRC:** PASS (DOM identity verified)
- **ILS:** PASS (completion tracking verified)
- **LSNB:** NOT_APPLICABLE (block does not participate in navigation progress)
- **RSSB:** NOT_APPLICABLE (block does not require cross-device sync)

## F. Quality Attributes
- **Accessibility:** PASS (WCAG AA)
- **Responsive:** PASS (mobile/tablet/desktop)
- **Security:** PASS (no vulnerabilities)
- **SSR:** PASS (hydration successful)

## G. Test Results
- Unit tests: 15/15 passing
- Component tests: 8/8 passing
- Integration tests: 5/5 passing
- E2E tests: 3/3 passing
- Coverage: 89%

## H. Known Limitations
- Performance baseline recorded but no threshold defined (acceptable)

## I. Approved Exceptions
NONE

## J. STOP History
NONE

## K. Evidence Index
- EV-001-UBRC-DOM: evidence/ubrc/dom-identity.png
- EV-002-ILS-COMPLETION: evidence/ils/completion-trace.json
- EV-003-A11Y-KEYBOARD: evidence/accessibility/keyboard-test.md
- [Full index: evidence/index.json]

## L. Certification Decision
**CERTIFIED**

All required certification criteria satisfied.  
Block ready for production deployment.

## M. Final Human Approval
- **Gate 3 Status:** APPROVED
- **Approval Date:** 2026-09-30T16:40:00Z
- **Approving Authority:** Jane Smith

## N. Certification Timestamp
**Certified:** 2026-09-30T16:45:00Z  
**Valid for Repository Revision:** abc123f7e8d9

---

**This certification is immutable. Any code changes require recertification.**
```

---

### Example 2: Blocked Certification (Pending Verification)

```markdown
# CERTIFICATION REPORT: VideoPlayer v2.0

**Certification ID:** CERT-VP-002-20260930  
**Certification Date:** 2026-09-30T17:15:00Z  
**Certifying Authority:** Project LLM (Kiro)

---

## A. Candidate Identity
- **Candidate ID:** VideoPlayer-v2.0
- **Block Type:** video-player
- **Block Name:** Video Player

## B. Repository State
- **Repository:** quiz-platform
- **Branch:** feature/block-video-player-v2
- **Commit:** def456b
- **Build Version:** 2.0.0-alpha.1
- **Environment:** CI

## C. Lifecycle Summary
- Phase 1-12: COMPLETE
- Phase 13-14: PENDING
- Gate 1: APPROVED (2026-09-25, Jane Smith)
- Gate 2: NOT TRIGGERED
- Gate 3: NOT SUBMITTED

## D. Architecture Verification
- Repository audit: COMPLETE
- Architecture compatibility: PASS
- Runtime boundary compliance: PASS
- Phase 0.4 compliance: PASS

## E. Runtime Evidence
- **UBRC:** PASS (DOM identity verified)
- **ILS:** PASS (completion tracking verified)
- **LSNB:** PENDING_VERIFICATION (Phase 13 incomplete)
- **RSSB:** PENDING_VERIFICATION (Phase 14 incomplete)

## F. Quality Attributes
- **Accessibility:** PASS (WCAG AA)
- **Responsive:** PASS (mobile/tablet/desktop)
- **Security:** PASS (no vulnerabilities)
- **SSR:** PASS (hydration successful)

## G. Test Results
- Unit tests: 20/20 passing
- Component tests: 12/12 passing
- Integration tests: 6/6 passing
- E2E tests: NOT_RUN (pending Phase 17)

## H. Known Limitations
- LSNB/RSSB verification incomplete
- E2E testing not yet performed

## I. Approved Exceptions
NONE

## J. STOP History
NONE

## K. Evidence Index
- EV-001-UBRC-DOM: evidence/ubrc/dom-identity.png
- EV-002-ILS-COMPLETION: evidence/ils/completion-trace.json
- [Evidence collection in progress]

## L. Certification Decision
**NOT CERTIFIED / BLOCKED**

**Blocking Issues:**
1. LSNB evidence pending verification (Phase 13)
2. RSSB evidence pending verification (Phase 14)
3. E2E testing not completed (Phase 17)
4. Gate 3 human approval not obtained

**Required Actions:**
1. Complete Phase 13 (LSNB Verification)
2. Complete Phase 14 (RSSB Verification)
3. Complete Phase 17 (E2E Certification)
4. Obtain Gate 3 approval

**Status:** IN_PROGRESS (blocked on evidence completion)

## M. Final Human Approval
- **Gate 3 Status:** NOT SUBMITTED
- **Reason:** Technical certification incomplete

## N. Certification Status
**NOT CERTIFIED**  
**Certification blocked pending evidence completion.**  
**Repository Revision:** def456b

---

**This report will be superseded when certification criteria satisfied.**
```

---

**Document Metadata:**
- Version: V1.0
- Frozen Date: 2026-09-30
- Lifecycle Phase: 0.6 (Governance)
- Authority: Human Architecture Authority
- Replaces: None (initial version)
- Referenced By: Phase 0.7-0.10 (future), Phase 1-20 (lifecycle implementation)

**STATUS: FROZEN**
