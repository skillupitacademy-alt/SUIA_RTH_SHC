# Phase 0.7 — Validation & Testing Contract V1

**Status:** FROZEN  
**Created:** 2026-09-30  
**Frozen:** 2026-09-30  
**Authority:** Human Architecture Authority  
**Repository Revision:** fba6f2a3  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle

---

## DEPENDENCIES

**This contract depends on:**
- Phase 0.1 — AI Roles & Responsibility Contract V1
- Phase 0.2 — Human Approval Contract V1
- Phase 0.3 — Repository Modification Contract V1
- Phase 0.4 — Runtime Boundary Contract V1
- Phase 0.4 — Validation Audit V1 (qualifications)
- Phase 0.5 — Handoff Protocol Contract V1
- Phase 0.6 — Evidence & Certification Contract V1

**This contract must not contradict:**
- Phase 0.1 (responsibility and authority boundaries)
- Phase 0.2 (human approval gates and decisions)
- Phase 0.3 (repository modification authority)
- Phase 0.4 (runtime boundaries and constraints)
- Phase 0.5 (handoff states and acceptance criteria)
- Phase 0.6 (evidence maturity, certification states, certification authority)

**If conflict discovered:**
- STOP immediately
- Document the contradiction
- Do NOT modify frozen contracts
- Request human architecture review

---

## 1. PURPOSE

This contract defines **HOW validation and testing are performed** to produce the evidence required by Phase 0.6 for certification evaluation.

**Core Principle:**

> **Validation methodology produces evidence. Evidence supports certification. Validation does not equal certification. Technical validation does not replace human approval.**

**Critical Distinction:**

```
PHASE 0.6 defines WHAT:
    - What evidence means
    - What maturity levels exist
    - What certification means
    - Who has certification authority
    - What certification requires

PHASE 0.7 defines HOW:
    - How validation is performed
    - How tests are selected
    - How environments are selected
    - How evidence is produced
    - How validation results feed Phase 0.6
```

**Scope:**  
All validation and testing activities from Phase 5 (Candidate Self-Validation) through Phase 17 (E2E Certification) that produce evidence for Phase 0.6 certification evaluation.

---

## 2. NON-GOALS

**This contract does NOT:**

❌ Implement a test framework  
❌ Create test harnesses or runners  
❌ Define application code patterns  
❌ Implement CI/CD pipelines  
❌ Deploy validation infrastructure  
❌ Redefine what "CERTIFIED" means (Phase 0.6)  
❌ Redefine human approval authority (Phase 0.2)  
❌ Grant testing bypass authority to AI  
❌ Convert test passage into production approval  
❌ Establish STOP condition handling (Phase 0.8)  
❌ Establish recovery procedures (Phase 0.9)  
❌ Establish contract versioning (Phase 0.10)  

**This contract IS:**

✅ A governance specification  
✅ A validation methodology definition  
✅ A test strategy framework  
✅ An evidence production protocol  
✅ A quality gate definition  

---

## 3. FUNDAMENTAL PRINCIPLES

### 3.1 Independence

**Validation must be independent from self-interest:**

```
External AI Self-Validation
        ≠
Project LLM Independent Validation
```

**Rules:**
- External AI may self-validate candidate (Phase 5)
- Project LLM must independently validate (Phase 7-17)
- Self-validation evidence does NOT replace independent validation
- Same actor validating same assertion with same evidence is NOT independent validation

---

### 3.2 Evidence-Based Validation

**All validation claims must be evidence-backed:**

```
"Tests passed"
        ≠
Evidence

"Tests passed" + execution log + results + environment + timestamp
        =
Evidence
```

**Prohibited:**
- ❌ Claiming validation without execution
- ❌ Fabricating test results
- ❌ Extrapolating results beyond actual execution
- ❌ Converting assumptions into verification

---

### 3.3 Validation ≠ Certification

**Critical boundary:**

```
All Required Validation PASS
        ≠
CERTIFIED

All Required Validation PASS
        +
All Phase 0.6 Certification Criteria Met
        +
Human Final Approval (Gate 3)
        =
CERTIFIED
```

**Phase 0.7 produces validation results.**  
**Phase 0.6 determines certification status.**  
**Phase 0.2 defines human approval authority.**

---

### 3.4 Validation ≠ Approval

**Authority boundary:**

```
Technical Validation Complete
        ≠
Human Approval

Technical Validation Complete
        +
Human Gate 3 Decision = APPROVE
        =
Production Authorization
```

**Project LLM performs technical validation.**  
**Human performs approval decisions (Phase 0.2).**

---

### 3.5 Proportional Validation

**Not every block requires identical validation:**

```
Block Classification
        ↓
Risk Profile
        ↓
Runtime Participation
        ↓
Applicable Contracts
        ↓
Required Validation Levels
        ↓
Test Selection
        ↓
Execution
        ↓
Evidence
```

**Validation must be:**
- Proportional to risk
- Proportional to complexity
- Proportional to runtime participation
- Appropriate to block role

---

## 4. VALIDATION LIFECYCLE

### 4.1 Validation Stages

```
Phase 5: Candidate Self-Validation (External AI)
        ↓
Phase 6: Handoff Completeness Verification (Project LLM)
        ↓
Phase 7: Repository Architecture Audit (Project LLM)
        ↓
Phase 8: Production Hardening & Adaptation (Project LLM)
        ↓
Phase 9-10: Integration Validation (Project LLM)
        ↓
Phase 11-14: Runtime Contract Validation (Project LLM)
        ↓
Phase 15: Quality Attribute Validation (Project LLM)
        ↓
Phase 16: Automated Test Execution (Project LLM)
        ↓
Phase 17: E2E Certification Validation (Project LLM)
        ↓
Phase 18: Repair & Revalidation (if needed)
        ↓
Phase 19: Certification Evidence Compilation
        ↓
Gate 3: Human Final Approval
```

**Each stage produces specific evidence for Phase 0.6.**

---

### 4.2 Validation Independence Model

| Phase | Actor | Type | Independence |
|-------|-------|------|--------------|
| 5 | External AI | Self-validation | N/A (self-check) |
| 6 | Project LLM | Handoff verification | Independent from External AI |
| 7 | Project LLM | Architecture audit | Independent from External AI |
| 8 | Project LLM | Adaptation | Project LLM owns changes |
| 9-17 | Project LLM | Integration/runtime/quality | Independent validation |
| 19 | Project LLM | Certification compilation | Technical evaluation |
| Gate 3 | Human | Final approval | Independent from both AIs |

---

## 5. VALIDATION LEVELS

### 5.1 Level 0: Requirement Validation

**Purpose:** Establish what must be validated

**Activities:**
- Extract requirements from learning objective
- Identify applicable architecture contracts (UBRC/ILS/LSNB/RSSB)
- Determine block classification (instructional/structural/navigational/decorative)
- Identify runtime participation
- Determine risk profile
- Define acceptance criteria

**Evidence Produced:**
- Requirement specification
- Contract applicability matrix
- Risk assessment
- Validation plan

**When Required:** Phase 1-2 (Requirements & Prototype)

**Who Performs:** External AI (draft) → Human (approval at Gate 1)

**Acceptance Criteria:**
- Requirements clear and testable
- Applicable contracts identified
- Risk profile reasonable

**Failure State:**
- Requirements unclear → revise requirements
- Contracts unknown → repository research required
- Risk unacceptable → abandon or redesign

---

### 5.2 Level 1: Static Validation

**Purpose:** Verify code quality, structure, and compliance without execution

**Activities:**
- TypeScript type checking
- ESLint compliance
- Code structure analysis
- Import/dependency analysis
- Repository pattern compliance
- UBRC component contract compliance (static)
- Prohibited operation detection (grep for banned APIs)
- Documentation completeness

**Evidence Produced:**
- Type check results
- Lint results
- Pattern compliance report
- Prohibited operation scan results
- Documentation review

**When Required:**
- Phase 5 (External AI self-validation)
- Phase 6 (Project LLM handoff verification)
- Phase 8 (After adaptation)
- Phase 16 (Pre-runtime validation)

**Who Performs:**
- External AI (Phase 5)
- Project LLM (Phase 6, 8, 16)

**Acceptance Criteria:**
- TypeScript compilation succeeds (zero errors)
- ESLint passes or documented exceptions only
- No prohibited operations detected (e.g., direct `recordBlockCompletion()` calls)
- Component accepts `block` prop
- Required DOM attributes present in JSX

**Failure State:**
- Type errors → fix code
- Lint failures → fix or document exception
- Prohibited operations → redesign or trigger Gate 2

**What It Proves:**
- Code is syntactically valid
- Component contract statically correct
- No obvious prohibited patterns

**What It Does NOT Prove:**
- Block actually renders correctly
- Runtime behavior correct
- Integration works
- Compliance with runtime contracts

---

### 5.3 Level 2: Unit Validation

**Purpose:** Verify isolated component logic and utilities

**Activities:**
- Test component rendering with mock props
- Test utility functions
- Test hooks in isolation
- Test state management logic
- Test error boundaries
- Test edge cases

**Evidence Produced:**
- Unit test execution results
- Test coverage report
- Failed test logs

**When Required:**
- Phase 5 (External AI self-validation)
- Phase 16 (Project LLM test execution)
- Phase 18 (Revalidation after repair)

**Who Performs:**
- External AI writes tests (Phase 4-5)
- Project LLM executes tests (Phase 16)

**Acceptance Criteria:**
- All unit tests pass
- Coverage adequate for component complexity (no universal threshold mandated)
- Edge cases covered
- Error paths tested

**Failure State:**
- Test failures → fix code or fix test
- Inadequate coverage → add tests or justify gap

**What It Proves:**
- Component logic correct in isolation
- Utility functions correct
- State management correct

**What It Does NOT Prove:**
- Integration with Tutorial Page works
- DOM attributes present in actual DOM
- Runtime contracts satisfied
- Cross-component behavior

---

### 5.4 Level 3: Component Validation

**Purpose:** Verify component behavior in near-production React environment

**Activities:**
- Render component with React Testing Library
- Test user interactions
- Test accessibility (keyboard nav, focus, ARIA)
- Test responsive behavior (viewport changes)
- Test component lifecycle
- Test props variations
- Test content rendering

**Evidence Produced:**
- Component test results
- Interaction test results
- Accessibility test results
- Rendered output inspection

**When Required:**
- Phase 5 (External AI self-validation)
- Phase 16 (Project LLM test execution)

**Who Performs:**
- External AI writes tests (Phase 4-5)
- Project LLM executes tests (Phase 16)

**Acceptance Criteria:**
- Component renders without errors
- User interactions work as designed
- Keyboard navigation functional
- Focus management correct
- ARIA attributes present where needed
- Responsive behavior functional

**Failure State:**
- Render errors → fix component
- Interaction failures → fix logic or redesign
- Accessibility failures → fix or document limitation

**What It Proves:**
- Component renders correctly with various props
- Interactions work in test environment
- Basic accessibility present

**What It Does NOT Prove:**
- Actual Tutorial Page integration
- UBRC runtime discovery
- ILS tracking
- Production environment behavior

---

### 5.5 Level 4: Integration Validation

**Purpose:** Verify block integrates correctly with platform systems

**Activities:**
- Verify TutorialBlock union type includes block
- Verify schema registration
- Verify TutorialBlockRenderer registration
- Verify Composer integration
- Verify block renders in Tutorial Page context
- Verify theme system integration
- Verify context providers accessible

**Evidence Produced:**
- Type system verification results
- Renderer integration test results
- Composer integration evidence
- Tutorial Page render evidence

**When Required:**
- Phase 9 (Schema & Union Integration)
- Phase 10 (Composer Integration)
- Phase 16 (Integration test execution)

**Who Performs:** Project LLM

**Acceptance Criteria:**
- TutorialBlock union includes block type
- Schema exists and valid
- Renderer case statement present
- Composer can create/edit block
- Block renders in Tutorial Page without errors
- No integration compilation errors

**Failure State:**
- Type errors → fix types
- Renderer missing → add registration
- Composer errors → fix Composer integration or block schema
- Render errors → debug integration

**What It Proves:**
- Block type system integration complete
- Block discoverable by renderer
- Block usable in Composer
- Block renders in Tutorial Page

**What It Does NOT Prove:**
- UBRC runtime contract satisfied
- ILS tracking works
- Completion behavior correct
- Cross-tab synchronization

---

### 5.6 Level 5: Runtime Validation

**Purpose:** Verify runtime behavior in browser environment

**Activities:**
- Execute block in browser
- Inspect actual DOM (data-block-id, data-block-type present)
- Verify runtime discovery (ActiveBlockContext if applicable)
- Verify visibility detection
- Test scrolling behavior
- Verify console has no errors
- Capture screenshots
- Record interactions

**Evidence Produced:**
- DOM inspection results (screenshot or HTML export)
- Browser console logs
- Network traces (if applicable)
- Screenshots at various states
- Interaction recordings

**When Required:**
- Phase 11 (UBRC Verification)
- Phase 12-14 (ILS/LSNB/RSSB Verification)
- Phase 16 (Runtime test execution)

**Who Performs:** Project LLM

**Acceptance Criteria:**
- Block renders in browser without errors
- DOM attributes present in actual DOM
- Block visible and interactive
- No JavaScript errors
- No hydration errors (if SSR enabled)

**Failure State:**
- Runtime errors → debug and fix
- Missing DOM attributes → fix component
- Hydration errors → fix SSR compatibility

**What It Proves:**
- Block actually renders in browser
- DOM contract satisfied in practice
- Block interactive
- No runtime errors

**What It Does NOT Prove:**
- ILS completion tracking works (requires observation over time)
- LSNB events fire correctly (requires event inspection)
- RSSB synchronization works (requires multi-client test)

---

### 5.7 Level 6: Browser/E2E Validation

**Purpose:** Verify complete end-to-end workflow

**Activities:**
- Execute full tutorial authoring → viewing flow
- Create block in Composer
- Configure block content
- Save tutorial
- View tutorial in Tutorial Page
- Interact with block
- Verify completion recorded (if instructional)
- Verify navigation updates (if applicable)
- Test across browsers (if multi-browser supported)

**Evidence Produced:**
- E2E test execution results
- Complete flow recordings
- Screenshots at each step
- Backend state verification (if applicable)
- Multi-browser results (if tested)

**When Required:**
- Phase 17 (E2E Certification)

**Who Performs:** Project LLM

**Acceptance Criteria:**
- Complete flow succeeds without errors
- Block creation works
- Block viewing works
- Block interaction works
- Completion recorded (if instructional)
- Backend state correct (if applicable)

**Failure State:**
- Flow failures → identify failure point and fix
- Multi-step failures → isolate failing component

**What It Proves:**
- Complete workflow functional
- Composer → Tutorial Page flow works
- User-facing experience correct

**What It Does NOT Prove:**
- Every edge case covered
- Production environment behavior
- Load/performance under stress

---

### 5.8 Level 7: Quality Attribute Validation

**Purpose:** Verify non-functional requirements

**Quality Dimensions:**

#### 7A. Accessibility Validation

**Activities:**
- Keyboard navigation testing
- Focus management testing
- Screen reader compatibility (if tooling available)
- ARIA attribute validation
- Color contrast checking
- Semantic HTML validation
- Error message accessibility

**Evidence Produced:**
- Accessibility audit report
- Keyboard navigation test results
- ARIA validation results
- Color contrast results

**Acceptance Criteria:**
- Keyboard navigation functional
- Focus visible and logical
- ARIA attributes appropriate
- Color contrast meets threshold (if project defines threshold)
- No accessibility blockers

**Failure State:**
- Critical accessibility issues → fix before certification
- Minor issues → document and assess risk

#### 7B. Responsive Validation

**Activities:**
- Test mobile viewport (≥375px)
- Test tablet viewport (≥768px)
- Test desktop viewport (≥1024px)
- Test intermediate breakpoints
- Test landscape/portrait
- Verify no horizontal scroll
- Verify touch targets adequate (mobile)
- Verify text readable at all sizes

**Evidence Produced:**
- Screenshots at each viewport
- Responsive behavior report
- Breakpoint test results

**Acceptance Criteria:**
- Layout functional at all supported viewports
- Content readable
- Interactions usable
- No layout breaks

**Failure State:**
- Layout breaks → fix responsive styles
- Unreadable content → adjust typography or layout

#### 7C. Security Validation

**Activities:**
- Scan for XSS vulnerabilities
- Verify user input sanitized
- Verify no unsafe HTML rendering
- Verify no exposed secrets/tokens
- Dependency vulnerability scan
- Verify authentication/authorization boundaries respected

**Evidence Produced:**
- Security scan results
- Dependency audit results
- Input sanitization verification
- Authorization boundary verification

**Acceptance Criteria:**
- No critical security vulnerabilities
- User input properly handled
- No unsafe rendering patterns
- Dependencies have no known critical vulnerabilities

**Failure State:**
- Critical vulnerabilities → fix before certification
- Medium vulnerabilities → assess risk and document

#### 7D. SSR/Hydration Validation (Conditional)

**When Required:** If platform supports SSR

**Activities:**
- Verify server render succeeds
- Verify browser hydration succeeds
- Verify no hydration mismatches
- Verify no browser-only API usage in SSR path

**Evidence Produced:**
- SSR render results
- Hydration test results
- Mismatch detection results

**Acceptance Criteria:**
- Server render succeeds
- Hydration succeeds without errors
- No hydration warnings

**Failure State:**
- SSR errors → fix SSR compatibility
- Hydration errors → fix deterministic rendering

**If NOT Applicable:**
- Evidence status: NOT_APPLICABLE
- Reason: Platform does not support SSR

#### 7E. Performance Validation (Conditional)

**When Required:** If project defines performance targets OR block has performance-sensitive behavior

**Activities:**
- Measure initial render time
- Measure interaction response time
- Measure bundle size contribution
- Identify performance bottlenecks

**Evidence Produced:**
- Performance measurement results
- Bundle size report
- Profiling data (if needed)

**Acceptance Criteria:**
- If project defines thresholds: meet thresholds
- If no thresholds: establish baseline for reference

**Failure State:**
- Performance unacceptable → optimize or document limitation

**If NOT Applicable:**
- Evidence status: NOT_APPLICABLE
- Reason: No defined performance requirements

---

### 5.9 Level 8: Certification Readiness Validation

**Purpose:** Verify all Phase 0.6 certification criteria satisfied — prepare evidence package for Phase 0.6 certification evaluation

**Activities:**
- Review all evidence collected
- Verify evidence completeness per Phase 0.6
- Verify evidence quality per Phase 0.6
- Verify evidence provenance
- Verify all applicable validation levels passed
- Verify no blocking issues
- Compile certification report

**Evidence Produced:**
- Certification readiness report
- Evidence index
- Gap analysis (if gaps exist)
- Certification report draft

**When Required:** Phase 19 (Certification Evidence Compilation)

**Who Performs:** Project LLM

**Acceptance Criteria:**
- All required validation levels completed
- All required evidence collected
- Evidence quality acceptable
- No unresolved STOP conditions
- Certification report complete

**Failure State:**
- Missing evidence → collect missing evidence
- Failed validation → repair and revalidate
- STOP condition → escalate to Gate 2 or Human

**What It Proves:**
- Technical validation and evidence prerequisites have been satisfied sufficiently for Phase 0.6 certification evaluation

**What It Does NOT Prove:**
- CERTIFIED (Phase 0.6 determines certification status)
- Human approval granted (requires Gate 3)
- Production authorized (requires Human Gate 3 approval)

**Critical Terminology Distinction:**

```
L8 PASS
        =
CERTIFICATION_READY (technical prerequisites satisfied)
        ≠
CERTIFIED (Phase 0.6 certification determination)
        ≠
HUMAN APPROVED (Phase 0.2 Gate 3 decision)
        ≠
PRODUCTION AUTHORIZED (Gate 3 approval)
```

**CERTIFICATION_READY means:**  
The technical validation and evidence prerequisites identified by Phase 0.6 are satisfied. The evidence package is ready for Phase 0.6 certification evaluation and Human Gate 3 review.

**CERTIFICATION_READY does NOT mean:**
- CERTIFIED status has been granted
- Certification authority has been exercised
- Human approval has been obtained
- Production deployment is authorized

**L8 prepares for certification; it does not create certification.**

---

## 6. CONDITIONAL VALIDATION MODEL

### 6.1 Block Classification System

**Classification determines applicable validation:**

| Classification | progressRole | Primary Purpose | ILS Tracking |
|---------------|-------------|----------------|--------------|
| **Instructional** | `instructional` | Teaches/assesses concept | YES |
| **Structural** | `structural` | Organizes content (tabs, accordions) | NO |
| **Navigational** | `navigational` | Provides navigation (TOC, breadcrumbs) | NO |
| **Decorative** | `decorative` | Visual enhancement (dividers, illustrations) | NO |

---

### 6.2 Validation Applicability Matrix

| Validation Level | Instructional | Structural | Navigational | Decorative |
|-----------------|--------------|-----------|-------------|-----------|
| Requirement (L0) | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| Static (L1) | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| Unit (L2) | REQUIRED | REQUIRED | REQUIRED | CONDITIONAL |
| Component (L3) | REQUIRED | REQUIRED | REQUIRED | CONDITIONAL |
| Integration (L4) | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| Runtime (L5) | REQUIRED | REQUIRED | REQUIRED | CONDITIONAL |
| E2E (L6) | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| Accessibility (L7A) | REQUIRED | REQUIRED | REQUIRED | CONDITIONAL |
| Responsive (L7B) | REQUIRED | REQUIRED | REQUIRED | REQUIRED |
| Security (L7C) | RISK-BASED | RISK-BASED | RISK-BASED | RISK-BASED |
| SSR (L7D) | IF_SUPPORTED | IF_SUPPORTED | IF_SUPPORTED | IF_SUPPORTED |
| Performance (L7E) | IF_DEFINED | IF_DEFINED | IF_DEFINED | IF_DEFINED |

**Legend:**
- **REQUIRED:** Must be performed for certification
- **CONDITIONAL:** Required if block has interactive/complex behavior
- **RISK-BASED:** Required if block has security-sensitive behavior
- **IF_SUPPORTED:** Required only if platform supports (e.g., SSR)
- **IF_DEFINED:** Required only if project defines criteria

**E2E Reconciliation with Phase 0.6:**

Phase 0.6 Appendix A classifies E2E evidence as "Always" required for certification. This contract preserves that requirement while recognizing that the **scope, depth, and scenarios** of E2E validation must be proportional to block behavior and runtime participation.

**E2E Evidence Requirement Interpretation:**

```
Every certified block MUST produce E2E evidence
        ≠
Every block must run identical E2E test suites

E2E REQUIRED means:
    Complete workflow validation from authoring → viewing → interaction

The depth/scope/scenarios are conditional on:
    - Block classification (instructional/structural/navigational/decorative)
    - Runtime participation (ILS/LSNB/RSSB)
    - Interaction complexity
    - Backend integration requirements
```

**E2E Validation Scope by Classification:**

- **Instructional blocks:** Full E2E including Composer creation → Tutorial Page viewing → user interaction → completion tracking (if ILS participates)
- **Structural blocks:** E2E verifies layout/organization behavior, Composer authoring, Tutorial Page rendering
- **Navigational blocks:** E2E verifies navigation functionality, Composer configuration, Tutorial Page navigation behavior
- **Decorative blocks:** E2E verifies visual rendering, Composer placement, Tutorial Page display

**Phase 0.6 Compliance:**

All certified blocks satisfy Phase 0.6's E2E evidence requirement. The evidence scope/depth varies by applicability, but E2E evidence class is **always populated** for certification (never NOT_APPLICABLE for certified blocks).

---

### 6.3 Contract-Specific Validation

#### UBRC Validation (Conditional)

**When Required:** ALL blocks participating in Tutorial Block ecosystem

**Validation:**
- DOM identity attributes present (data-block-id, data-block-type)
- Component accepts `block` prop
- Renderer registration exists
- Runtime discovery functional (if applicable)

**Evidence Status if Not Applicable:** N/A (UBRC is universal for Tutorial Blocks)

---

#### ILS Validation (Conditional)

**When Required:** `progressRole='instructional'` ONLY

**Validation:**
- Visit tracking works
- Active time tracking works
- Completion formula applied correctly
- Completion persisted to backend
- Idempotency preserved

**Evidence Status if Not Applicable:**
```
ILS Evidence: NOT_APPLICABLE
Reason: Block progressRole is 'structural', does not participate in ILS
```

**IMPORTANT:** Do NOT force ILS validation on structural/navigational/decorative blocks.

---

#### LSNB Validation (Conditional)

**When Required:** Block contributes to navigation progress

**Validation:**
- Progress contribution behavior correct
- Navigation updates fire
- UI reacts to completion events

**Evidence Status if Not Applicable:**
```
LSNB Evidence: NOT_APPLICABLE
Reason: Block does not contribute to navigation progress
```

**Phase 0.4 Qualification Applies:**  
LSNB implementation details remain DOCUMENTED but not fully VERIFIED per Phase 0.4 audit. Validation methodology defined here, but current platform implementation status must be verified before claiming LSNB validation complete.

---

#### RSSB Validation (Conditional)

**When Required:** Block participates in real-time state synchronization

**Validation:**
- Cross-tab synchronization works
- State consistency maintained
- Conflict resolution correct (if applicable)

**Evidence Status if Not Applicable:**
```
RSSB Evidence: NOT_APPLICABLE
Reason: Block does not participate in real-time state sync
```

**Phase 0.4 Qualification Applies:**  
RSSB implementation details remain DOCUMENTED but not fully VERIFIED per Phase 0.4 audit. Validation methodology defined here, but current platform implementation status must be verified before claiming RSSB validation complete.

---

## 7. VALIDATION ENVIRONMENTS

### 7.1 Environment Definitions

| Environment | Purpose | Typical Use | Evidence Suitability |
|------------|---------|------------|---------------------|
| **local-dev** | Development iteration | Quick feedback, debugging, visual inspection | Development evidence, initial verification |
| **CI** | Automated reproducible builds | Automated tests, builds, linting | Reproducible test evidence, build evidence |
| **staging** | Pre-production validation | Integration tests, E2E tests, near-production behavior | Integration evidence, E2E evidence |
| **production** | Live production environment | Post-deployment verification, actual user behavior | Production behavior evidence (when applicable) |

---

### 7.2 Environment Selection Criteria

**Environment selection depends on:**

1. **Type of claim being validated**
2. **Risk profile of the block**
3. **Available infrastructure**
4. **Certification requirements**

**Examples:**

| Claim | Suitable Environment(s) | Rationale |
|-------|----------------------|-----------|
| "TypeScript compiles" | local, CI | Compilation is deterministic |
| "Component renders without errors" | local, CI | Rendering logic testable locally |
| "Integration with Tutorial Page works" | local, CI, staging | Requires Tutorial Page context |
| "ILS completion persisted to database" | staging, production | Requires real backend |
| "Cross-tab sync works" | staging, production | Requires RSSB infrastructure |
| "Block performs well under load" | production | Requires production traffic |

---

### 7.3 Environment Promotion Rules

**Progression model:**

```
local-dev validation
        ↓
        PASS → CI validation
        ↓
        PASS → staging validation
        ↓
        PASS → production deployment (after Gate 3)
```

**Rules:**
- Must pass in earlier environment before promoting
- May skip environment if infrastructure unavailable (document)
- Production evidence NOT required for certification if staging evidence sufficient
- Environment unavailability does NOT automatically grant PASS

---

### 7.4 Environment Unavailability Handling

**If required environment unavailable:**

```
Option A: Use nearest equivalent environment + document limitation
Option B: Defer validation until environment available
Option C: Escalate to Human for decision
```

**Do NOT:**
- ❌ Fabricate environment evidence
- ❌ Claim production validation with local evidence
- ❌ Skip required validation without justification

---

## 8. TEST COVERAGE MODEL

### 8.1 Coverage Dimensions

**Test coverage is multi-dimensional:**

| Dimension | Description | Measurement |
|-----------|-------------|-------------|
| **Code Coverage** | Lines/branches executed | % lines covered |
| **Requirement Coverage** | Requirements validated | % requirements tested |
| **Behavior Coverage** | User scenarios tested | % scenarios covered |
| **Contract Coverage** | Architecture contracts validated | % contracts verified |
| **Error Path Coverage** | Error cases tested | % error paths covered |
| **Environment Coverage** | Environments tested | # environments validated |
| **Accessibility Coverage** | A11y criteria validated | % criteria met |

**No single dimension sufficient alone.**

---

### 8.2 Coverage Thresholds

**This contract does NOT mandate arbitrary thresholds such as:**
- ❌ "80% code coverage required"
- ❌ "100% branch coverage required"
- ❌ "All 5 browsers required"

**Instead:**

Coverage must be **sufficient to support certification claims.**

**Sufficiency criteria:**
- All stated requirements have corresponding tests
- All critical paths tested
- All error paths tested
- All applicable contracts validated
- All supported environments tested (or justified why not)
- All accessibility criteria validated (per project standard)

**Coverage gaps must be:**
- Identified explicitly
- Justified or remediated
- Documented as limitation if accepted

---

### 8.3 Coverage vs Certification

**High code coverage does NOT automatically mean:**
- Requirements met
- Contracts satisfied
- Certification criteria satisfied
- Production readiness

**Low code coverage does NOT automatically mean:**
- Inadequate validation
- Certification blocked

**Coverage is one input to certification evaluation, not the sole determinant.**

---

## 9. TEST SELECTION STRATEGY

### 9.1 Requirement-Driven Test Derivation

**Test selection must be traceable to requirements:**

```
Learning Objective
        ↓
Functional Requirements
        ↓
Non-Functional Requirements
        ↓
Applicable Contracts
        ↓
Risk Assessment
        ↓
Test Specification
        ↓
Test Implementation
        ↓
Test Execution
        ↓
Evidence
```

**Do NOT create tests without requirement traceability.**

---

### 9.2 Risk-Based Test Prioritization

**Higher risk = deeper validation:**

| Risk Factor | Impact on Validation |
|------------|---------------------|
| User input handling | Increase security validation |
| State mutation | Increase unit/integration tests |
| Backend interaction | Increase integration/E2E tests |
| ILS participation | Increase runtime validation |
| Complex interaction | Increase component/E2E tests |
| Accessibility-critical | Increase accessibility validation |

---

### 9.3 Test Redundancy Avoidance

**Avoid redundant testing:**

```
Unit test validates utility function
        ↓
Do NOT repeat identical test in component test
        ↓
DO test component uses utility correctly
```

**Principle:** Test each concern at appropriate level, avoid testing same thing multiple times.

---

## 10. NEGATIVE TESTING

### 10.1 Negative Test Categories

**Validation must include negative/error cases:**

| Category | Examples |
|----------|----------|
| **Malformed Content** | Missing required fields, invalid types, malformed JSON |
| **Invalid Props** | Null block, undefined content, wrong type |
| **Invalid User Input** | Out-of-range values, invalid formats, malicious input |
| **Network Failures** | API timeout, 404, 500, network offline |
| **State Errors** | Invalid state transitions, duplicate actions |
| **Authorization Errors** | Unauthorized access attempts |
| **Boundary Conditions** | Empty strings, zero, negative numbers, max values |
| **Timing Issues** | Race conditions, rapid repeated actions |
| **Environment Issues** | Missing dependencies, browser incompatibility |

---

### 10.2 Negative Test Proportionality

**Negative testing must be proportional:**

- Simple display blocks: minimal negative testing
- Interactive blocks: moderate negative testing
- Blocks with user input: extensive input validation testing
- Blocks with backend interaction: network failure testing
- Blocks with state management: state error testing

**Do NOT require exhaustive negative testing for all blocks universally.**

---

## 11. VALIDATION GATES

### 11.1 Gate V1: Requirement Validation Gate

**Trigger:** Phase 1-2 complete

**Validation:**
- Requirements clear and testable
- Applicable contracts identified
- Acceptance criteria defined

**Evidence Required:**
- Requirement document
- Contract applicability analysis

**Acceptance:**
- Requirements approved (part of Gate 1 prototype approval)

**Failure:**
- Requirements unclear → revise
- Contracts unknown → research

**Proceeds To:** Phase 3 (Gate 1 Prototype Approval)

---

### 11.2 Gate V2: Candidate Validation Gate

**Trigger:** Phase 5 complete (External AI self-validation)

**Validation:**
- Static validation PASS
- Unit tests PASS
- Component tests PASS
- Self-validation checklist complete

**Evidence Required:**
- Lint results
- Type check results
- Test results
- Self-validation report

**Acceptance:**
- All self-validation criteria met
- No critical issues

**Failure:**
- Validation failures → External AI fixes and retries

**Proceeds To:** Phase 6 (Handoff)

---

### 11.3 Gate V3: Integration Validation Gate

**Trigger:** Phase 10 complete (Composer Integration)

**Validation:**
- Integration validation PASS
- Block renders in Tutorial Page
- Composer integration works
- No integration errors

**Evidence Required:**
- Integration test results
- Renderer verification
- Composer test results

**Acceptance:**
- Block integrated successfully
- No blocking integration issues

**Failure:**
- Integration errors → Project LLM fixes integration

**Proceeds To:** Phase 11 (UBRC Verification)

---

### 11.4 Gate V4: Runtime Validation Gate

**Trigger:** Phase 14 complete (RSSB Verification)

**Validation:**
- Runtime validation PASS
- UBRC evidence complete
- ILS evidence complete (if applicable)
- LSNB evidence complete (if applicable)
- RSSB evidence complete (if applicable)

**Evidence Required:**
- Runtime validation results for all applicable contracts
- DOM inspection evidence
- Behavior observation evidence
- Backend persistence evidence (if applicable)

**Acceptance:**
- All applicable runtime contracts validated
- Evidence quality acceptable

**Failure:**
- Runtime validation failures → debug and fix
- Evidence insufficient → collect more evidence

**Proceeds To:** Phase 15 (Quality Validation)

---

### 11.5 Gate V5: Quality Validation Gate

**Trigger:** Phase 15 complete (Quality Assurance)

**Validation:**
- Accessibility validation complete
- Responsive validation complete
- Security validation complete
- SSR validation complete (if applicable)
- Performance validation complete (if applicable)

**Evidence Required:**
- Accessibility audit results
- Responsive test results
- Security scan results
- SSR test results (if applicable)
- Performance results (if applicable)

**Acceptance:**
- All applicable quality validations PASS
- No critical quality issues

**Failure:**
- Quality issues → fix and revalidate

**Proceeds To:** Phase 16 (Automated Test Execution)

---

### 11.6 Gate V6: E2E Validation Gate

**Trigger:** Phase 17 complete (E2E Certification)

**Validation:**
- E2E validation PASS
- Complete workflow functional
- All critical paths tested

**Evidence Required:**
- E2E test results
- Complete flow recordings
- Multi-step verification

**Acceptance:**
- E2E tests PASS
- Critical workflows functional

**Failure:**
- E2E failures → identify root cause and fix

**Proceeds To:** Phase 18 (Repair if needed) or Phase 19 (Certification)

---

### 11.7 Gate V7: Certification Readiness Gate

**Trigger:** Phase 19 (Certification Evidence Compilation)

**Validation:**
- All required validation levels complete
- All evidence collected
- Evidence quality acceptable
- Certification criteria satisfied (Phase 0.6)

**Evidence Required:**
- Complete evidence package
- Certification readiness report
- Evidence traceability matrix

**Acceptance:**
- Phase 0.6 technical certification criteria satisfied
- Certification report complete

**Failure:**
- Missing evidence → collect
- Failed validations → repair and revalidate
- Certification criteria not met → address gaps

**Proceeds To:** Gate 3 (Human Final Approval)

---

### 11.8 Validation Gates vs Human Approval Gates

**Critical Distinction:**

```
Validation Gates (V1-V7)
        = Technical quality gates
        = Performed by Project LLM
        = Do NOT replace Human Approval Gates
        = Do NOT create lifecycle authorization

Human Approval Gates (Gate 1, 2, 3)
        = Decision authority gates (Phase 0.2)
        = Performed by Human
        = Cannot be bypassed by validation passage
        = Create lifecycle authorization when approved
```

**Validation gates feed evidence to Human Approval Gates.**  
**Validation gates do NOT grant approval authority.**  
**Validation gates do NOT grant lifecycle authorization.**

**Specific Gate Boundaries:**

**V7 (Certification Readiness Gate):**
```
V7 PASS
        =
Evidence package ready for Phase 0.6 certification evaluation
        +
Evidence package ready for Human Gate 3 review
        ≠
CERTIFIED (Phase 0.6 determination)
        ≠
Human Gate 3 approval obtained
        ≠
Production authorization granted
```

**V7 PASS authorizes:**
- Preparation for Phase 0.6 certification evaluation
- Submission of evidence package to Human Gate 3 review
- Progression to Phase 19 certification compilation

**V7 PASS does NOT authorize:**
- Certification status determination (Phase 0.6)
- Production deployment (requires Human Gate 3)
- Bypassing Human approval (Phase 0.2)
- Lifecycle phase transition without gate approval

**Validation Gates are Technical Checkpoints:**

V1-V7 validate technical readiness and evidence quality. They ensure that when evidence reaches Human Approval Gates, the technical prerequisites have been satisfied.

**Human Approval Gates are Authorization Checkpoints:**

Gate 1, 2, 3 grant authorization to proceed with lifecycle phases. Even when all validation gates pass, Human authorization is required per Phase 0.2.

**Relationship:**

```
Validation Gates (V1-V7)
        ↓
Produce evidence and validation results
        ↓
Feed into Human Approval Gates (1, 2, 3)
        ↓
Human makes authorization decision
        ↓
Lifecycle proceeds (if approved)
```

**V1-V7 are validation gates, not lifecycle authorization gates. Lifecycle authorization remains governed by Phase 0.2 and the applicable lifecycle phase contracts.**

---

## 12. VALIDATION FAILURE HANDLING

### 12.1 Failure Classification

| Failure Type | Description | Action |
|-------------|-------------|--------|
| **FAIL** | Test executed, result negative | Fix and retest |
| **BLOCKED** | Test cannot execute due to dependency | Resolve blocker, then test |
| **INSUFFICIENT** | Test executed, evidence incomplete | Enhance test or collect more evidence |
| **CONTRADICTORY** | Test results conflict | Investigate and resolve conflict |
| **STALE** | Test evidence outdated | Rerun test |
| **UNVERIFIED** | Test not executed | Execute test or justify skip |
| **NOT_APPLICABLE** | Test does not apply to this block | Document rationale |

---

### 12.2 Failure Resolution Flow

```
Validation Failure Detected
        ↓
Classify Failure Type
        ↓
        ├─ FAIL → Fix Code → Revalidate
        ├─ BLOCKED → Resolve Blocker → Revalidate
        ├─ INSUFFICIENT → Enhance Test → Revalidate
        ├─ CONTRADICTORY → Investigate → Fix → Revalidate
        ├─ STALE → Rerun Test
        ├─ UNVERIFIED → Execute Test
        └─ NOT_APPLICABLE → Document + Proceed
```

---

### 12.3 Failure vs STOP Distinction

**Not every failure is a STOP:**

```
Test Failure
        ↓
Fix code or test
        ↓
Revalidate
        ↓
Proceed
```

```
Architecture Conflict Detected
        ↓
STOP
        ↓
Gate 2 (Human Architecture Review)
        ↓
Human Decision
```

**STOP conditions (Phase 0.8 will define fully):**
- Architecture modification required
- Contract violation unfixable
- Platform limitation blocking progress
- Security-critical failure unresolvable
- Evidence fabrication detected
- Governance conflict detected

**Regular test failures are NOT automatic STOPs.**

---

### 12.4 Unresolved Failure Impact

**If validation failures remain unresolved:**

```
Unresolved Validation Failure
        ↓
Certification Criteria Not Met
        ↓
Certification Status: NOT CERTIFIED
        ↓
Gate 3 Submission: BLOCKED
```

**Cannot proceed to Gate 3 with unresolved failures affecting certification criteria.**

---

## 13. REGRESSION VALIDATION

### 13.1 Regression Triggers

**Regression validation required when:**

| Change Type | Regression Scope |
|------------|------------------|
| Certified block code modified | Full block revalidation |
| Block schema modified | Integration + Runtime + E2E |
| Renderer modified (affecting this block) | Integration + Runtime |
| UBRC contract modified | All blocks (UBRC validation) |
| ILS modified | Instructional blocks (ILS validation) |
| LSNB modified | Applicable blocks (LSNB validation) |
| RSSB modified | Applicable blocks (RSSB validation) |
| Shared component modified (used by block) | Affected blocks (Component + Integration) |
| Database schema modified (affecting block) | Runtime + E2E |
| Security vulnerability discovered | Security revalidation |

---

### 13.2 Regression Scope Determination

**Regression testing must be impact-based:**

```
Change Identified
        ↓
Impact Analysis
        ↓
Identify Affected Components
        ↓
Determine Required Revalidation Levels
        ↓
Execute Regression Tests
        ↓
Verify No Regressions
```

**Do NOT require full revalidation of entire repository for trivial changes.**

---

### 13.3 Regression Evidence

**Regression validation produces:**
- Regression test results
- Before/after comparison
- Impact assessment
- Revalidation decision

**If no regression detected:**
- Evidence: "Change X did not affect block Y, revalidation not required"
- Rationale: Impact analysis showing no dependency

---

## 14. REVALIDATION

### 14.1 Revalidation Triggers

**Evidence may become stale, requiring revalidation:**

| Trigger | Revalidation Required |
|---------|---------------------|
| Certified code changed | YES (full revalidation) |
| Repository version changed | ASSESS (impact-based) |
| Environment changed | ASSESS (environment-specific evidence) |
| Contract changed | YES (contract-specific validation) |
| Security vulnerability | YES (security validation) |
| Evidence older than 90 days | EVALUATE (time-based staleness) |
| Production behavior diverges | YES (investigate + revalidate) |

---

### 14.2 Revalidation Scope

**Revalidation scope depends on staleness cause:**

- Code changed → affected validation levels
- Contract changed → contract-specific validation
- Security vulnerability → security validation + affected areas
- Time-based staleness → risk-based revalidation

**Full revalidation NOT always required.**

---

### 14.3 Revalidation Evidence

**Revalidation must produce:**
- Updated evidence with new timestamp
- Supersession relationship to old evidence
- Reason for revalidation
- Revalidation results

**Old evidence preserved for audit (marked SUPERSEDED).**

---

## 15. EVIDENCE PRODUCTION

### 15.1 Evidence Requirements (from Phase 0.6)

**Every validation execution must produce evidence containing:**

```json
{
  "evidenceId": "unique-id",
  "evidenceType": "validation-type",
  "candidateId": "block-id",
  "candidateVersion": "version",
  "claim": "what this evidence proves",
  "validationLevel": "L1-L8",
  "producer": "External AI | Project LLM",
  "verifier": "Project LLM | Human",
  "timestamp": "ISO-8601",
  "environment": "local | CI | staging | production",
  "repositoryRevision": "git-commit-hash",
  "phase": "lifecycle-phase",
  "result": "PASS | FAIL | BLOCKED | INSUFFICIENT | NOT_APPLICABLE",
  "resultDetails": "detailed results",
  "limitations": "what was NOT tested",
  "relatedRequirement": "requirement-id",
  "relatedTest": "test-id",
  "evidenceLocation": "path/to/evidence/artifact",
  "supersedes": "previous-evidence-id | null"
}
```

---

### 15.2 Evidence Quality Standards

**Evidence must be:**

| Quality Attribute | Description | Verification |
|------------------|-------------|--------------|
| **Attributable** | Clear who produced it | Producer field present |
| **Specific** | Supports specific claim | Claim field clear |
| **Reviewable** | Can be independently inspected | Artifacts accessible |
| **Versioned** | Tied to specific version | Repository revision recorded |
| **Relevant** | Actually supports claim | Claim → evidence mapping valid |
| **Temporal** | Has timestamp/context | Timestamp present |
| **Complete** | Contains all required fields | Schema validation |

**Weak evidence rejected or marked INSUFFICIENT.**

---

### 15.3 Evidence Storage (Conceptual)

**This contract does NOT implement storage.**

**Conceptual requirements:**

- Evidence must be persistently stored
- Evidence must be retrievable by evidence ID
- Evidence must be retrievable by candidate ID
- Evidence must support traceability queries (requirement → evidence, evidence → requirement)
- Evidence must preserve history (superseded evidence retained)
- Evidence must be tamper-evident (checksums or signatures)

**Implementation deferred to future phases.**

---

## 16. TRACEABILITY

### 16.1 Forward Traceability

**From requirement to evidence:**

```
Requirement REQ-001
        ↓
Design Decision DESIGN-001
        ↓
Candidate Implementation [BlockName].tsx
        ↓
Test Specification TEST-001
        ↓
Test Execution EXEC-001
        ↓
Evidence EV-001
        ↓
Verification VERIF-001
        ↓
Certification Claim CLAIM-001
```

**Purpose:** Ensure all requirements validated.

---

### 16.2 Backward Traceability

**From evidence to requirement:**

```
Evidence EV-001
        ↓
Test Execution EXEC-001
        ↓
Test Specification TEST-001
        ↓
Candidate Implementation [BlockName].tsx
        ↓
Requirement REQ-001
```

**Purpose:** Understand why evidence exists, what it proves.

---

### 16.3 Traceability Matrix (Conceptual)

**Phase 19 must produce traceability matrix:**

| Requirement | Design | Implementation | Test | Evidence | Verification | Status |
|------------|--------|----------------|------|----------|--------------|--------|
| REQ-001 | DESIGN-001 | Block.tsx | TEST-001 | EV-001 | PASS | ✅ |
| REQ-002 | DESIGN-002 | Block.tsx | TEST-002 | EV-002 | PASS | ✅ |
| REQ-003 | DESIGN-003 | Block.tsx | — | — | MISSING | ❌ |

**No requirement should be orphaned (missing test/evidence).**

---

## 17. INDEPENDENCE REQUIREMENTS

### 17.1 Validation Independence Model

**Independence levels:**

| Validation | Validator | Independent From | Rationale |
|-----------|-----------|------------------|-----------|
| Self-validation (Phase 5) | External AI | N/A | Self-check before handoff |
| Handoff verification (Phase 6) | Project LLM | External AI | Independent completeness check |
| Repository audit (Phase 7) | Project LLM | External AI | Independent architecture check |
| Runtime validation (Phase 11-14) | Project LLM | External AI + Candidate claims | Independent behavior observation |
| Certification compilation (Phase 19) | Project LLM | All previous claims | Independent evidence evaluation |
| Final approval (Gate 3) | Human | Both AIs | Independent decision authority |

---

### 17.2 Self-Validation Limitations

**External AI self-validation (Phase 5) is valuable but NOT independent:**

```
External AI creates block
        ↓
External AI validates own block
        ↓
Self-validation evidence = candidate claims
        ↓
Project LLM must independently verify
```

**Self-validation does NOT replace independent validation.**

---

### 17.3 Circular Validation Prevention

**Prohibited:**

```
Actor A validates claim X with evidence E
        ↓
Actor A "independently verifies" claim X with same evidence E
        ↓
FALSE INDEPENDENCE
```

**Required:**

```
Actor A validates claim X with evidence E
        ↓
Actor B verifies claim X with independent inspection of E or new evidence F
        ↓
TRUE INDEPENDENCE
```

---

## 18. HUMAN APPROVAL BOUNDARY

### 18.1 Validation Authority vs Approval Authority

**Project LLM Authority:**
- Execute validation
- Inspect evidence
- Verify technical criteria
- Determine validation status
- Prepare certification report
- Recommend approval/rejection

**Project LLM CANNOT:**
- Grant Gate 1 approval
- Grant Gate 2 approval
- Grant Gate 3 approval
- Override human decision
- Deploy to production without approval

**Human Authority (Phase 0.2):**
- Gate 1: Prototype approval
- Gate 2: Architecture decision
- Gate 3: Final production approval

---

### 18.2 Validation Readiness ≠ Approval

**Even when all validation passes:**

```
All Validation PASS
        +
Certification Criteria Met
        ≠
Production Approved

ALL ABOVE
        +
Human Gate 3 Decision = APPROVE
        =
Production Authorized
```

---

### 18.3 Validation Evidence for Human Review

**Validation produces evidence for Human to review at gates:**

**Gate 1 (Prototype Approval):**
- Visual evidence (screenshots, recordings)
- Accessibility evidence (keyboard nav, ARIA)
- Responsive evidence (mobile/tablet/desktop)
- Learning intent alignment

**Gate 2 (Architecture Review, if triggered):**
- Architecture conflict analysis
- Impact assessment
- Solution options
- Project LLM recommendation

**Gate 3 (Final Approval):**
- Complete validation results
- Certification report
- Known limitations
- Risk assessment

**Human reviews evidence, makes decision.**

---

## 19. VALIDATION STOP CONDITIONS

### 19.1 STOP Triggers (Validation Context)

**Validation must STOP when:**

| Condition | Action |
|-----------|--------|
| Applicable requirement unknown | Research requirement or STOP for clarification |
| Test method cannot validly prove claim | Redesign test or escalate to Human |
| Environment unsuitable for claim | Use correct environment or defer |
| Required runtime behavior unobservable | Implement observability or STOP |
| Evidence contradictory | Investigate contradiction, resolve |
| Repository version unknown | Establish version or STOP |
| Validation depends on unverified assumption | Verify assumption or STOP |
| Frozen contract contradicted | STOP, do not modify contract |
| Prohibited architecture modification discovered | STOP, trigger Gate 2 |
| Security-critical validation cannot complete | STOP, escalate |
| Required validation infrastructure unavailable | Defer or escalate |
| Test result cannot be trusted | Fix test or STOP |
| Evidence integrity questionable | Investigate or STOP |
| Evidence fabrication suspected | STOP immediately, escalate |

---

### 19.2 STOP vs Failure Distinction

**STOP ≠ Test Failure**

```
Test Failure
        ↓
Fix and retest
        ↓
Normal workflow
```

```
STOP Condition
        ↓
Cannot proceed
        ↓
Escalation required
```

**STOP conditions block progression.**  
**Test failures are resolvable within normal workflow.**

---

### 19.3 STOP Escalation

**When STOP triggered:**

1. Document STOP condition
2. Document why progression blocked
3. Identify required decision or action
4. Escalate to appropriate authority:
   - Architecture conflicts → Gate 2
   - Governance conflicts → Human Architecture Authority
   - Evidence integrity → Human + audit
   - Infrastructure unavailable → Human decision

**Do NOT:**
- ❌ Continue past STOP
- ❌ Manufacture workaround
- ❌ Modify frozen contracts
- ❌ Fabricate evidence

---

## 20. CROSS-CONTRACT CONSISTENCY

### 20.1 Phase 0.1 Consistency

**Phase 0.1 defines actor responsibilities:**

| Phase 0.1 Principle | Phase 0.7 Implementation | Status |
|-------------------|------------------------|--------|
| External AI creates candidate | External AI performs self-validation (Phase 5) | ✅ Consistent |
| Project LLM integrates & certifies | Project LLM performs independent validation (Phase 6-19) | ✅ Consistent |
| Human approves | Validation produces evidence for Human gates | ✅ Consistent |
| Project LLM STOP triggers | STOP conditions defined for validation failures | ✅ Consistent |

---

### 20.2 Phase 0.2 Consistency

**Phase 0.2 defines Human Approval Gates:**

| Phase 0.2 Gate | Phase 0.7 Validation | Relationship |
|---------------|---------------------|--------------|
| Gate 1 (Prototype) | Validation provides prototype evidence | Evidence input |
| Gate 2 (Architecture) | STOP triggers may escalate to Gate 2 | Escalation path |
| Gate 3 (Final Approval) | All validation evidence feeds Gate 3 | Evidence input |

**Validation does NOT replace Human decisions.** ✅ Consistent

---

### 20.3 Phase 0.3 Consistency

**Phase 0.3 defines repository modification authority:**

| Phase 0.3 Principle | Phase 0.7 Implication | Status |
|-------------------|---------------------|--------|
| External AI: NO repository access | External AI validation in isolated environment | ✅ Consistent |
| Project LLM: Controlled repository access | Project LLM validation uses repository context | ✅ Consistent |
| Gate-controlled modifications | Validation does NOT modify repository (read-only) | ✅ Consistent |

---

### 20.4 Phase 0.4 Consistency

**Phase 0.4 defines runtime boundaries:**

| Phase 0.4 Boundary | Phase 0.7 Validation | Status |
|-------------------|---------------------|--------|
| Passive ILS participation | Runtime validation verifies NO direct ILS calls | ✅ Consistent |
| UBRC DOM contract | Static + runtime validation verify DOM attributes | ✅ Consistent |
| Prohibited operations | Static validation scans for prohibited APIs | ✅ Consistent |
| Completion authority | Runtime validation verifies ILS orchestrates completion | ✅ Consistent |

**Phase 0.4 Qualifications Preserved:**
- LSNB: DOCUMENTED but verification status TBD
- RSSB: DOCUMENTED but verification status TBD
- ActiveBlockContext: DOCUMENTED but verification status TBD

Phase 0.7 defines HOW to validate these, but does NOT claim they are already VERIFIED. ✅ Consistent

---

### 20.5 Phase 0.5 Consistency

**Phase 0.5 defines handoff protocol:**

| Phase 0.5 Requirement | Phase 0.7 Validation | Status |
|---------------------|---------------------|--------|
| Handoff package completeness | Gate V2 (Candidate Validation) verifies completeness | ✅ Consistent |
| Self-validation required | Phase 5 validation before handoff | ✅ Consistent |
| Manifest validation | Handoff verification includes manifest check | ✅ Consistent |

---

### 20.6 Phase 0.6 Consistency

**Phase 0.6 defines evidence and certification:**

| Phase 0.6 Principle | Phase 0.7 Implementation | Status |
|-------------------|------------------------|--------|
| Evidence maturity levels | Validation produces OBSERVED → VERIFIED evidence | ✅ Consistent |
| Evidence ownership | Validation evidence produced by appropriate actor | ✅ Consistent |
| Claim → Evidence matrix | Validation traceability maps claims to evidence | ✅ Consistent |
| Certification authority | Validation determines technical criteria; Human approves | ✅ Consistent |
| Validation ≠ Certification | Explicitly preserved throughout Phase 0.7 | ✅ Consistent |
| No fabrication | Validation STOP if evidence cannot be produced | ✅ Consistent |
| Conditional requirements | Validation applicability matrix supports NOT_APPLICABLE | ✅ Consistent |

**Phase 0.7 produces evidence conforming to Phase 0.6 schema.** ✅ Consistent

---

## 21. PHASE 0.4 QUALIFICATIONS CARRYFORWARD

### 21.1 Unverified Platform Components

**Phase 0.4 Validation Audit identified qualifications:**

| Component | Phase 0.4 Status | Phase 0.7 Treatment |
|-----------|-----------------|-------------------|
| LSNB implementation | DOCUMENTED | Validation methodology defined; verification status TBD |
| RSSB implementation | DOCUMENTED | Validation methodology defined; verification status TBD |
| ActiveBlockContext | DOCUMENTED | Runtime validation may reference; verification TBD |
| useLearningStateListener | DOCUMENTED | Integration validation may reference; verification TBD |
| React version | DOCUMENTED as v18 | To be verified during integration validation |

**Phase 0.7 Position:**

This contract defines **HOW** to validate LSNB, RSSB, ActiveBlockContext, etc. **when they are ready to be validated.**

This contract does NOT claim they have **already been VERIFIED** unless repository evidence proves it.

**Distinction preserved:**

```
DOCUMENTED (Phase 0.4 status)
        ≠
VERIFIED (requires validation evidence)

Phase 0.7 defines validation procedure
        ≠
Phase 0.7 claims validation complete
```

---

### 21.2 Qualification Disclosure Requirement

**When validation references unverified components:**

Validation report must include:

```
Component: LSNB
Status: DOCUMENTED (Phase 0.4)
Verification Status: PENDING
Validation Defined: YES (Phase 0.7)
Validation Executed: TBD
```

**Do NOT silently convert DOCUMENTED → VERIFIED.**

---

## 22. RELATIONSHIP TO PHASE 0.6

### 22.1 Evidence Production for Certification

**Phase 0.7 validation produces Phase 0.6 evidence classes:**

| Phase 0.7 Validation Level | Phase 0.6 Evidence Class |
|---------------------------|------------------------|
| Candidate self-validation | Class A: Candidate Evidence |
| Handoff verification | Class C: Handoff Evidence |
| Repository audit | Class D: Repository Evidence |
| Build/compilation | Class E: Build Evidence |
| Static analysis | Class F: Static Analysis Evidence |
| Unit/component tests | Class G: Unit/Component Test Evidence |
| Integration validation | Class H: Integration Evidence |
| Runtime validation | Class I: Runtime Evidence |
| Browser/E2E validation | Class J: Browser/E2E Evidence |
| Accessibility validation | Class K: Accessibility Evidence |
| Security validation | Class L: Security Evidence |
| Performance validation | Class M: Performance Evidence |
| UBRC validation | Class N: UBRC Evidence |
| ILS validation | Class O: ILS Evidence |
| LSNB validation | Class P: LSNB Evidence |
| RSSB validation | Class Q: RSSB Evidence |
| Certification compilation | Class R: Certification Evidence |

---

### 22.2 Validation Results Feed Certification

**Flow:**

```
Phase 0.7 Validation Execution
        ↓
Evidence Produced
        ↓
Evidence Stored
        ↓
Phase 0.6 Evidence Verification
        ↓
Certification Evaluation
        ↓
Phase 0.6 Certification Decision
        ↓
Gate 3 Human Approval
```

**Phase 0.7 provides evidence inputs.**  
**Phase 0.6 determines certification status.**

---

### 22.3 Validation Status Terminology Alignment

**Phase 0.7 uses Phase 0.6 terminology:**

| Term | Meaning (from Phase 0.6) | Phase 0.7 Usage |
|------|------------------------|----------------|
| DECLARED | Someone claims capability | Candidate self-validation claim |
| DOCUMENTED | Document describes capability | Test specification |
| OBSERVED | Real execution demonstrated | Test execution result |
| VERIFIED | Independent check against requirement | Project LLM verification |
| CERTIFIED | Complete evidence + approvals | Not determinable by Phase 0.7 alone |

**Phase 0.7 validation produces OBSERVED evidence.**  
**Project LLM verification converts OBSERVED → VERIFIED.**  
**Phase 0.6 determines CERTIFIED status.**

---

## 23. RELATIONSHIP TO FUTURE PHASES

### 23.1 Phase 0.8 — STOP Conditions

**Phase 0.7 identifies validation STOP triggers.**  
**Phase 0.8 will fully define STOP condition handling.**

**Phase 0.7 responsibility:**
- Define validation STOP triggers
- Escalate to appropriate authority

**Phase 0.8 responsibility (future):**
- Define STOP condition taxonomy
- Define escalation procedures
- Define resolution workflows
- Define documentation requirements

**Boundary preserved:** Phase 0.7 does NOT implement Phase 0.8.

---

### 23.2 Phase 0.9 — Rollback & Recovery

**Phase 0.7 identifies validation failures.**  
**Phase 0.9 will define recovery procedures.**

**Phase 0.7 responsibility:**
- Define validation failure types
- Define revalidation requirements

**Phase 0.9 responsibility (future):**
- Define rollback procedures
- Define recovery workflows
- Define failure mitigation
- Define incident response

**Boundary preserved:** Phase 0.7 does NOT implement Phase 0.9.

---

### 23.3 Phase 0.10 — Contract Versioning

**Phase 0.7 defines validation methodology v1.**  
**Phase 0.10 will define how contracts evolve.**

**Phase 0.7 responsibility:**
- Define current validation methodology
- Support evidence versioning

**Phase 0.10 responsibility (future):**
- Define contract evolution rules
- Define migration procedures
- Define backward compatibility
- Define deprecation policy

**Boundary preserved:** Phase 0.7 does NOT implement Phase 0.10.

---

## 24. VALIDATION CHECKLIST

### 24.1 Pre-Validation Checklist

**Before beginning validation:**

- [ ] Requirements clear and approved
- [ ] Applicable contracts identified
- [ ] Block classification determined
- [ ] Risk profile assessed
- [ ] Validation plan defined
- [ ] Required environments available or alternatives identified
- [ ] Test infrastructure available
- [ ] Evidence storage ready (if needed)

---

### 24.2 Validation Execution Checklist

**During validation:**

- [ ] Static validation executed
- [ ] Unit validation executed
- [ ] Component validation executed
- [ ] Integration validation executed
- [ ] Runtime validation executed (applicable contracts)
- [ ] Browser/E2E validation executed (if required)
- [ ] Quality validation executed (accessibility, responsive, security, etc.)
- [ ] Negative testing performed
- [ ] Evidence collected for each validation
- [ ] Evidence quality verified
- [ ] Traceability maintained

---

### 24.3 Post-Validation Checklist

**After validation:**

- [ ] All required validations complete
- [ ] All evidence collected
- [ ] Evidence provenance recorded
- [ ] Evidence quality acceptable
- [ ] Validation failures resolved or documented
- [ ] Traceability matrix complete
- [ ] Known limitations documented
- [ ] Certification readiness assessed
- [ ] Certification report prepared
- [ ] Gate 3 evidence package ready

---

## 25. VALIDATION COMPLETION CRITERIA

### 25.1 Technical Validation Complete

**Technical validation is complete when:**

- ✅ All applicable validation levels executed
- ✅ All required evidence collected
- ✅ Evidence quality meets Phase 0.6 standards
- ✅ No unresolved validation failures affecting certification
- ✅ No blocking STOP conditions
- ✅ Traceability complete
- ✅ Certification report compiled

**Critical Terminology:**

```
Technical Validation Complete
        =
Validation levels L0-L8 satisfied
        =
Evidence package ready
        ≠
CERTIFIED (Phase 0.6 determines certification)
        ≠
Human approval obtained (Phase 0.2 Gate 3)
        ≠
Production authorized
```

**Technical validation completion is a prerequisite for certification evaluation, not certification itself.**

---

### 25.2 Certification Ready

**Block is certification-ready when:**

- ✅ Technical validation complete (above)
- ✅ All Phase 0.6 certification criteria satisfied
- ✅ Human Gate 1 approval obtained (prototype)
- ✅ Human Gate 2 decisions implemented (if applicable)
- ✅ Certification report complete
- ✅ Evidence package ready for Gate 3 review

**Certification-ready ≠ Production Approved**

---

### 25.3 Production Authorized

**Block is production-authorized when:**

- ✅ Certification-ready (above)
- ✅ Human Gate 3 decision = APPROVE
- ✅ Deployment checklist complete
- ✅ Production deployment executed

**Only Human Gate 3 approval grants production authorization.**

---

## 26. VERSIONING

**Contract Version:** V1  
**Status:** DRAFT  
**Created:** 2026-09-30  
**Dependencies:** Phase 0.1-0.6 (all FROZEN)

**Modification Rules:**
- Contract may only be modified by Human Architecture Authority
- Modifications require new version (e.g., V2)
- Modifications must preserve consistency with Phase 0.1-0.6
- Modifications must be documented with rationale

**This contract becomes FROZEN after:**
- Governance self-audit complete
- Cross-contract consistency verified
- Human Architecture Authority approval

---

## 27. NEXT PHASE

**After Phase 0.7 frozen:**

Proceed to:

**Phase 0.8 — STOP Conditions Contract V1**

Phase 0.8 will define:
- Complete STOP condition taxonomy
- Escalation procedures
- Resolution workflows
- Documentation requirements
- Authority boundaries for STOP decisions

**Phase 0.7 has identified validation STOP triggers.**  
**Phase 0.8 will define complete STOP governance.**

---

## 28. SUMMARY

**Phase 0.7 establishes:**

✅ **HOW** validation and testing produce Phase 0.6 evidence  
✅ Validation methodology without implementing test frameworks  
✅ Validation levels and applicability  
✅ Conditional validation based on block classification  
✅ E2E evidence required for all certified blocks (scope/depth conditional)  
✅ Environment selection criteria  
✅ Test coverage model (multi-dimensional)  
✅ Validation gates (V1-V7)  
✅ Evidence production conforming to Phase 0.6  
✅ Traceability requirements  
✅ Independence requirements  
✅ Failure handling and revalidation  
✅ Human approval boundary preservation  
✅ Validation gate vs lifecycle authorization distinction  
✅ L8 CERTIFICATION_READY ≠ CERTIFIED distinction  
✅ Cross-contract consistency with Phase 0.1-0.6  
✅ Phase 0.4 qualifications carryforward  
✅ Future phase boundaries (0.8, 0.9, 0.10)  

**Phase 0.7 does NOT:**

❌ Implement test frameworks or harnesses  
❌ Redefine certification (Phase 0.6)  
❌ Redefine approval authority (Phase 0.2)  
❌ Grant testing bypass to AI  
❌ Convert validation into approval  
❌ Convert validation into lifecycle authorization  
❌ Grant L8 PASS certification authority  
❌ Allow V7 PASS to bypass Gate 3  
❌ Implement STOP handling (Phase 0.8)  
❌ Implement recovery (Phase 0.9)  
❌ Implement versioning (Phase 0.10)  

**Key Clarifications Applied:**

1. **E2E/Phase 0.6 Reconciliation:** E2E evidence required for all certified blocks per Phase 0.6 Appendix A; scope/depth/scenarios conditional on block classification and behavior
2. **L8 Terminology:** CERTIFICATION_READY means technical prerequisites satisfied for Phase 0.6 evaluation, NOT CERTIFIED status
3. **V7 Authority:** V7 PASS prepares for certification evaluation, does NOT create certification or production authorization
4. **Lifecycle Authorization:** V1-V7 are technical validation gates, NOT lifecycle authorization gates

---

**END OF PHASE 0.7 — VALIDATION & TESTING CONTRACT V1**
