# PHASE 0.1 — AI ROLES & RESPONSIBILITY CONTRACT V1

**Document Type:** Governance Contract  
**Status:** FROZEN  
**Date:** 2026-09-30  
**Version:** 1.0  
**Authority:** Foundational Contract for AI Tutorial Block Creation Lifecycle  
**Versioning Governance:** Phase 0.10 V1 - Contract Versioning & Evolution

---

## PURPOSE

This contract establishes the **immutable responsibility boundaries** between External AI, Project LLM, and Human in the Tutorial Block creation, integration, and certification process.

**Master Principle:**

> **External AI is the Block Factory.**  
> It creates the complete candidate block—prototype, React, TypeScript, content schema, tests, assets and documentation—according to the Project LLM's published block-development rules.
>
> **Project LLM is the Platform Integration & Certification Engine.**  
> It consumes the candidate package, inspects the actual repository, adapts the candidate to the real architecture, integrates it into Tutorial Page Composer, verifies UBRC → ILS → LSNB → RSSB participation, runs the required tests and produces the certification evidence.
>
> **Human is the Approval and Architecture Authority.**  
> Human approval is required for the defined approval gates, and universal architecture changes cannot be made autonomously by either AI.

---

## ACTOR DEFINITIONS

### External AI

**Definition:** Any AI system external to the project's primary development environment, capable of creating React/TypeScript components and complete block implementations.

**Examples:**
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Gemini (Google)
- Other approved external AI models

**Identity:** Not the Project LLM; operates outside the primary repository context.

**Primary Function:** Tutorial Block creation and engineering.

---

### Project LLM

**Definition:** The AI system with direct repository access, architecture knowledge, and authority to modify production code.

**Identity:** The AI operating within the project development environment (e.g., Kiro, GitHub Copilot with repository context, or equivalent).

**Primary Function:** Platform integration, compliance verification, and certification.

---

### Human

**Definition:** Human developer, architect, or product owner with ultimate decision authority.

**Identity:** The person who approves gates, reviews evidence, and makes architectural decisions.

**Primary Function:** Approval, architecture decisions, quality control.

---

## EXTERNAL AI RESPONSIBILITIES

### Primary Responsibility

> **Create the complete candidate Tutorial Block according to the Project LLM's Block Creation Guideline.**

### Authorized Actions

External AI **MAY** perform the following:

#### 1. Learning Content Interpretation
- Analyze learning objectives
- Interpret pedagogical intent
- Design content structure
- Define interaction patterns

#### 2. Visual Design & UX
- Create visual design
- Design layout
- Define spacing, typography, colors
- Design responsive behavior
- Design interaction states

#### 3. Prototype Creation
- Generate HTML prototype
- Generate CSS styles
- Generate JavaScript interactions
- Generate JSON content model
- Generate prototype assets

#### 4. React Engineering
- Convert prototype to React components
- Implement component hierarchy
- Implement React hooks
- Implement state management
- Implement event handlers

#### 5. TypeScript Engineering
- Define TypeScript interfaces
- Define TypeScript types
- Implement type-safe components
- Define content schemas
- Define prop types

#### 6. Component Decomposition
- Break down complex UI into components
- Define component boundaries
- Define component APIs
- Define reusable subcomponents

#### 7. Accessibility Implementation
- Implement ARIA attributes
- Implement semantic HTML
- Implement keyboard navigation
- Implement focus management
- Implement screen reader support

#### 8. Responsive Implementation
- Implement mobile layout
- Implement tablet layout
- Implement desktop layout
- Implement breakpoint logic

#### 9. Interaction Implementation
- Implement user interactions
- Implement animations
- Implement transitions
- Implement feedback mechanisms

#### 10. Candidate Testing
- Write component tests
- Write interaction tests
- Write accessibility tests
- Write visual regression tests

#### 11. Candidate Documentation
- Write component API documentation
- Write usage examples
- Write integration notes
- Write accessibility notes

#### 12. Candidate Self-Validation
- Run linters
- Run type checkers
- Run tests
- Verify against guidelines
- Generate validation report

#### 13. Candidate Packaging
- Package all candidate files
- Create manifest
- Create handover report
- Prepare assets

### Prohibited Actions

External AI **MUST NOT** perform the following:

#### 1. Repository Modification
- ❌ Direct repository writes
- ❌ Git commits
- ❌ Production file modifications
- ❌ Schema migrations
- ❌ Database changes

#### 2. Production Integration
- ❌ TutorialBlock union modification
- ❌ TutorialBlockRenderer registration
- ❌ Canonical builder integration
- ❌ Composer service modification

#### 3. Architecture Modification
- ❌ UBRC architecture changes
- ❌ ILS architecture changes
- ❌ LSNB architecture changes
- ❌ RSSB architecture changes
- ❌ Universal runtime changes

#### 4. Certification Claims
- ❌ Final UBRC certification
- ❌ Final ILS certification
- ❌ Final LSNB certification
- ❌ Final RSSB certification
- ❌ Production-ready claims

#### 5. Deployment
- ❌ Production deployment
- ❌ Staging deployment
- ❌ Build pipeline execution

### Authority Boundaries

External AI operates under **candidate authority** only:

```text
External AI creates → Candidate Block
Project LLM verifies → Production Block
```

**Key Distinction:**
- External AI: "Here is my candidate implementation"
- NOT: "This is the final production implementation"

---

## PROJECT LLM RESPONSIBILITIES

### Primary Responsibility

> **Turn the External AI's candidate block into a repository-compliant production Tutorial Block and prove that it works through the existing Tutorial Engine runtime.**

### Authorized Actions

Project LLM **MAY** perform the following:

#### 1. Repository Inspection
- Read all repository files
- Analyze repository structure
- Inspect existing patterns
- Map architecture
- Discover contracts

#### 2. Architecture Discovery
- Identify UBRC implementation
- Identify ILS implementation
- Identify LSNB implementation
- Identify RSSB implementation
- Map runtime flow

#### 3. Reference Block Analysis
- Analyze D1 implementation
- Analyze C1 implementation
- Extract patterns
- Identify best practices
- Document conventions

#### 4. Contract Verification
- Verify DOM identity contract
- Verify UBRC metadata contract
- Verify ILS participation contract
- Verify passive observer pattern
- Verify theme contract

#### 5. Candidate Code Review
- Review candidate React code
- Review candidate TypeScript code
- Review candidate tests
- Compare prototype vs candidate
- Identify compliance gaps

#### 6. Production Hardening
- Fix repository-specific issues
- Fix schema compliance issues
- Fix type system issues
- Fix styling convention issues
- Fix import path issues
- Fix SSR compatibility issues
- Fix security issues

#### 7. Schema Integration
- Extend TutorialBlock discriminated union
- Define content schema types
- Integrate with existing schema validation
- Update schema documentation

#### 8. TutorialBlock Union Integration
- Add new block type to union
- Ensure type exhaustiveness
- Update type exports
- Verify TypeScript compilation

#### 9. Canonical Document Integration
- Create canonical builder (if applicable)
- Integrate with document structure
- Ensure ID stability
- Verify serialization

#### 10. TutorialBlockRenderer Registration
- Add case statement
- Register component
- Implement version routing (if applicable)
- Verify exhaustiveness check

#### 11. Composer Integration
- Verify Composer can create block
- Verify Composer can save block
- Verify Composer can load block
- Verify Composer preview works

#### 12. UBRC Verification
- Verify `data-block-id` presence
- Verify `data-block-type` presence
- Verify `data-block-version` presence
- Verify ActiveBlockContext discovery
- Verify IntersectionObserver compatibility

#### 13. ILS Verification
- Verify visit telemetry recording
- Verify active time telemetry recording
- Verify completion API compatibility
- Verify progressRole behavior
- Verify backend persistence

#### 14. LSNB Verification
- Verify page-level progress contribution
- Verify navigation tree compatibility
- Verify no direct LSNB coupling

#### 15. RSSB Verification
- Verify passive RSSB participation
- Verify metrics availability
- Verify no direct RSSB coupling

#### 16. Test Integration
- Integrate candidate tests
- Add integration tests
- Add E2E tests
- Verify test coverage

#### 17. Runtime Testing
- Test in local development
- Test in browser
- Test SSR rendering
- Test hydration
- Test interactions

#### 18. E2E Certification
- Run complete lifecycle test
- Verify Composer → Page → Runtime → ILS → LSNB → RSSB
- Generate evidence
- Document results

#### 19. Repair
- Fix integration failures
- Fix runtime failures
- Fix test failures
- Iterate until certified

#### 20. Evidence Generation
- Generate certification report
- Generate verification logs
- Generate test results
- Document compliance

#### 21. Repository Modification
- Create/modify source files
- Update schemas
- Update types
- Register components
- Commit changes (with human approval for important changes)

### Prohibited Actions

Project LLM **MUST NOT** perform the following:

#### 1. Unsanctioned Architecture Changes
- ❌ Modify UBRC architecture without human approval
- ❌ Modify ILS architecture without human approval
- ❌ Modify LSNB architecture without human approval
- ❌ Modify RSSB architecture without human approval
- ❌ Modify universal runtime without human approval

#### 2. Silent Platform Rewrites
- ❌ Rewrite Composer to fit candidate
- ❌ Rewrite ILS to fit candidate
- ❌ Rewrite LSNB to fit candidate
- ❌ Rewrite RSSB to fit candidate

#### 3. Bypassing Human Approval
- ❌ Deploy to production without approval
- ❌ Make architecture changes without approval
- ❌ Skip important approval gates

#### 4. Creating Parallel Infrastructure
- ❌ Create block-specific ILS infrastructure
- ❌ Create block-specific LSNB infrastructure
- ❌ Create block-specific RSSB infrastructure
- ❌ Create block-specific telemetry infrastructure

### Authority Boundaries

Project LLM operates under **platform authority**:

```text
Project LLM verifies → Repository compliance
Project LLM certifies → Runtime participation
Project LLM STOPS → Architecture conflicts
```

**Key Distinction:**
- Project LLM: "This candidate is now repository-compliant and certified"
- NOT: "I changed the platform to fit this candidate"

### STOP Conditions

Project LLM **MUST STOP** and request human architecture review when:

#### 1. Architecture Conflict Detected
```text
Candidate requires universal architecture modification
   ↓
STOP
   ↓
Human Architecture Review Required
```

**Examples:**
- Candidate requires new ILS lifecycle hook
- Candidate requires LSNB core modification
- Candidate requires RSSB data model change
- Candidate requires new universal telemetry behavior

#### 2. Contract Violation Unfixable
```text
Candidate violates fundamental contract
   +
Cannot be adapted without breaking candidate intent
   ↓
STOP
   ↓
Human Decision: Reject or Architect New Contract
```

#### 3. Platform Limitation Discovered
```text
Platform cannot support candidate behavior
   +
Adaptation would compromise platform integrity
   ↓
STOP
   ↓
Human Decision: Platform enhancement or candidate revision
```

#### 4. Security/Safety Concern
```text
Candidate introduces security risk
   +
Cannot be mitigated through adaptation
   ↓
STOP
   ↓
Human Security Review Required
```

---

## HUMAN RESPONSIBILITIES

### Primary Responsibility

> **Provide approval at defined gates and make architectural decisions that neither AI can make autonomously.**

### Approval Authority

Human **MUST** approve the following:

#### 1. Prototype Approval (Phase 3)
- Visual design quality
- Learning intent alignment
- Content correctness
- Interaction appropriateness
- Accessibility baseline
- Responsive behavior

**Decision:**
```text
APPROVE → Proceed to Phase 4
REJECT → External AI revises
```

#### 2. Architecture Review (When STOP triggered)
- Platform architecture modification proposals
- Universal contract changes
- Runtime infrastructure changes
- Security/safety concerns

**Decision:**
```text
APPROVE CHANGE → Platform modified, candidate integrated
REJECT CANDIDATE → Candidate revised or abandoned
APPROVE WORKAROUND → Alternative approach
```

#### 3. Final Production Approval (Phase 19)
- Review certification report
- Review runtime evidence
- Review test results
- Review visual/UX result in browser
- Review Composer integration

**Decision:**
```text
APPROVE → Certified Production Block
REJECT → Return to repair loop
CONDITIONALLY APPROVE → Deploy with restrictions
```

### Architectural Decision Authority

Human **MUST** decide on:

#### 1. Universal Architecture Changes
- UBRC architecture modifications
- ILS architecture modifications
- LSNB architecture modifications
- RSSB architecture modifications
- New universal runtime behaviors

#### 2. Contract Evolution
- New block contracts
- Modified existing contracts
- Breaking changes to existing contracts

#### 3. Platform Scope Changes
- New platform capabilities
- Deprecated platform capabilities
- Platform limitation acceptance

#### 4. Trade-off Decisions
- Performance vs features
- Complexity vs flexibility
- Backward compatibility vs innovation

### Prohibited Actions

Human **SHOULD NOT** (but may override):

#### 1. Bypass AI Responsibilities
- ❌ Manually implement candidate blocks (use External AI)
- ❌ Manually integrate blocks (use Project LLM)
- ❌ Skip certification steps

#### 2. Make Uninformed Decisions
- ❌ Approve without reviewing evidence
- ❌ Approve without understanding implications
- ❌ Override AI STOP without justification

---

## RESPONSIBILITY OWNERSHIP MATRIX

| Responsibility | External AI | Project LLM | Human | Notes |
|----------------|:-----------:|:-----------:|:-----:|-------|
| **Learning Content** |
| Interpret learning objective | ✅ Primary | Review | ✅ Approve | External AI owns interpretation |
| Visual design | ✅ Primary | Review | ✅ Approve | External AI owns design |
| **Prototype** |
| HTML prototype | ✅ Create | Verify | Approve | External AI owns prototype |
| CSS styling | ✅ Create | Verify | Approve | External AI owns styling |
| JavaScript interaction | ✅ Create | Verify | — | External AI owns interaction |
| JSON content model | ✅ Create | Verify | — | External AI owns content |
| **Engineering** |
| React components | ✅ Create | Harden | — | External AI creates, Project LLM hardens |
| TypeScript types | ✅ Create | Harden | — | External AI creates, Project LLM hardens |
| Component tests | ✅ Create | Extend | — | External AI creates, Project LLM extends |
| Accessibility | ✅ Implement | Verify | — | External AI implements |
| Responsive | ✅ Implement | Verify | — | External AI implements |
| **Repository** |
| Repository audit | ❌ No access | ✅ Primary | — | Project LLM only |
| Architecture mapping | ❌ No access | ✅ Primary | — | Project LLM only |
| D1/C1 analysis | ❌ No access | ✅ Primary | — | Project LLM only |
| **Integration** |
| TutorialBlock union | ❌ Candidate only | ✅ Production | — | Project LLM integrates |
| TutorialBlockRenderer | ❌ Candidate only | ✅ Production | — | Project LLM registers |
| Canonical builder | ❌ Candidate only | ✅ Production | — | Project LLM integrates |
| Composer | ❌ No access | ✅ Integrate | — | Project LLM integrates |
| **Verification** |
| UBRC compliance | Guideline follow | ✅ Verify | — | Project LLM verifies |
| ILS participation | Guideline follow | ✅ Verify | — | Project LLM verifies |
| LSNB compatibility | Guideline follow | ✅ Verify | — | Project LLM verifies |
| RSSB compatibility | Guideline follow | ✅ Verify | — | Project LLM verifies |
| E2E testing | ❌ No access | ✅ Execute | Review | Project LLM executes |
| **Certification** |
| Candidate validation | ✅ Self-check | Review | — | External AI self-validates |
| Production certification | ❌ Cannot certify | ✅ Certify | ✅ Approve | Project LLM certifies, Human approves |
| **Architecture** |
| Universal architecture | ❌ Cannot modify | ❌ STOP required | ✅ Decide | Human decides |
| Contract changes | ❌ Cannot modify | ❌ STOP required | ✅ Decide | Human decides |
| Platform scope | ❌ Cannot modify | ❌ STOP required | ✅ Decide | Human decides |

---

## CODE OWNERSHIP MODEL

### Candidate Code Ownership

**External AI creates → Candidate code**

Ownership: External AI is the original author

Rights:
- External AI owns the candidate implementation
- External AI is responsible for candidate quality
- External AI can be asked to revise candidate

### Production Code Ownership

**Project LLM adapts → Production code**

Ownership: Project LLM is the production author

Rights:
- Project LLM owns the production integration
- Project LLM is responsible for production quality
- Project LLM can modify as needed for compliance

### Hybrid Ownership

Most production blocks will be:

```text
Candidate (External AI origin)
   +
Hardening (Project LLM modifications)
   =
Production Block (hybrid ownership)
```

**Attribution:**
```text
Original: External AI (candidate)
Production: Project LLM (integration & certification)
Architecture: Human (approval & decisions)
```

---

## VALIDATION AUTHORITY

### Candidate Validation (External AI)

External AI performs **candidate-level validation**:

```text
✅ Linting
✅ Type checking
✅ Unit tests
✅ Component tests
✅ Accessibility checks
✅ Guideline compliance self-check
```

**Authority:** External AI can claim candidate validity

**Limitation:** Cannot claim production validity

### Production Validation (Project LLM)

Project LLM performs **production-level validation**:

```text
✅ Repository compliance
✅ Schema integration
✅ Type system integration
✅ Renderer integration
✅ Composer integration
✅ UBRC verification
✅ ILS verification
✅ LSNB verification
✅ RSSB verification
✅ E2E testing
```

**Authority:** Project LLM can claim production validity

**Limitation:** Cannot claim final approval

### Final Validation (Human)

Human performs **approval-level validation**:

```text
✅ Review certification report
✅ Review runtime evidence
✅ Review visual result
✅ Review architectural impact
✅ Make go/no-go decision
```

**Authority:** Human has final approval authority

---

## CERTIFICATION AUTHORITY

### Candidate Certification (External AI)

External AI can certify:

```text
✅ "Candidate passes self-validation"
✅ "Candidate follows guidelines"
✅ "Candidate is ready for handover"
```

External AI **CANNOT** certify:

```text
❌ "Production ready"
❌ "UBRC certified"
❌ "ILS certified"
❌ "Platform integrated"
```

### Production Certification (Project LLM)

Project LLM can certify:

```text
✅ "Repository compliant"
✅ "UBRC verified"
✅ "ILS verified"
✅ "LSNB verified"
✅ "RSSB verified"
✅ "E2E tested"
✅ "Ready for human approval"
```

Project LLM **CANNOT** certify:

```text
❌ "Deployed to production" (requires human approval)
❌ "Architecture changed" (requires human decision)
```

### Final Certification (Human)

Human can certify:

```text
✅ "Approved for production"
✅ "Architecture change approved"
✅ "Certified Production Tutorial Block"
```

---

## HANDOVER RESPONSIBILITY

### External AI → Project LLM Handover

**External AI responsibilities:**

1. Package complete candidate
2. Include original prototype
3. Include candidate React/TypeScript
4. Include candidate tests
5. Include candidate documentation
6. Generate candidate manifest
7. Generate candidate validation report
8. Provide handover report

**Handover format:**

```text
CandidateTutorialBlock/
│
├── prototype/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── data.json
│
├── react/
│   ├── BlockComponent.tsx
│   ├── BlockComponent.types.ts
│   └── ...
│
├── schema/
├── tests/
├── assets/
├── docs/
│
├── candidate-manifest.json
└── candidate-report.md
```

**Handover completeness criteria:**

- ✅ All source files included
- ✅ All tests included
- ✅ All documentation included
- ✅ All assets included
- ✅ Validation report included
- ✅ Manifest complete
- ✅ Handover report explains decisions

**Project LLM responsibilities:**

1. Receive candidate package
2. Verify handover completeness
3. Inspect all files
4. Compare prototype vs candidate
5. Begin repository audit

---

## MANDATORY EVIDENCE

### External AI Must Provide

1. **Prototype Evidence**
   - Screenshots/recordings of prototype
   - Interaction demonstrations
   - Responsive behavior demonstrations

2. **Candidate Validation Evidence**
   - Linting results
   - Type checking results
   - Test results
   - Accessibility audit results

3. **Guideline Compliance Evidence**
   - Checklist showing guideline compliance
   - Explanations for any deviations

4. **Handover Documentation**
   - Candidate manifest
   - Candidate validation report
   - Handover report

### Project LLM Must Provide

1. **Repository Audit Evidence**
   - Repository structure analysis
   - Architecture mapping
   - Reference block analysis

2. **Integration Evidence**
   - Schema integration proof
   - Renderer registration proof
   - Composer integration proof

3. **Verification Evidence**
   - UBRC verification logs
   - ILS verification logs
   - LSNB verification logs
   - RSSB verification logs

4. **Testing Evidence**
   - Unit test results
   - Integration test results
   - E2E test results
   - Browser testing screenshots/recordings

5. **Certification Report**
   - Complete lifecycle verification
   - All verification steps documented
   - All evidence included
   - Final certification status

### Human Must Provide

1. **Approval Evidence**
   - Prototype approval record
   - Architecture review record (if triggered)
   - Final approval record

2. **Decision Documentation**
   - Architectural decisions made
   - Rationale for decisions
   - Impact assessment

---

## CONFLICT RESOLUTION

### External AI vs Project LLM Disagreement

**Scenario:** External AI believes candidate is correct; Project LLM believes it violates repository contracts.

**Resolution:**
```text
Project LLM authority prevails
   ↓
Project LLM explains conflict
   ↓
External AI revises OR Project LLM adapts
```

**Exception:** If Project LLM explanation reveals guideline error:
```text
Update guideline
   ↓
External AI revises using corrected guideline
```

### Project LLM vs Human Disagreement

**Scenario:** Project LLM recommends STOP; Human wants to proceed.

**Resolution:**
```text
Human authority prevails
   ↓
Human explicitly overrides STOP
   ↓
Human documents rationale
   ↓
Proceed with human's decision
```

**Risk:** Human assumes responsibility for override consequences.

### External AI vs Human Disagreement

**Scenario:** Human rejects prototype; External AI believes it meets requirements.

**Resolution:**
```text
Human authority prevails
   ↓
Human explains rejection rationale
   ↓
External AI revises OR requirements clarified
```

---

## CONTRACT ENFORCEMENT

### Violation Handling

**External AI violates contract:**

Examples:
- Attempts repository modification
- Claims production certification
- Modifies platform architecture

**Response:**
```text
Reject candidate
   ↓
Explain violation
   ↓
Request compliant revision
```

**Project LLM violates contract:**

Examples:
- Modifies platform without STOP/approval
- Bypasses certification steps
- Deploys without human approval

**Response:**
```text
Rollback changes
   ↓
Review violation
   ↓
Re-execute with compliance
```

**Human violates contract:**

Examples:
- Approves without reviewing evidence
- Overrides STOP without documentation
- Bypasses AI responsibilities without justification

**Response:**
```text
Document risk
   ↓
Proceed with documented acknowledgment
   ↓
Human assumes responsibility
```

---

## CONTRACT VERSION CONTROL

**Version:** 1.0  
**Status:** FROZEN  
**Date:** 2026-09-30

**Changes require:**
- Human approval
- Documentation of rationale
- Version increment
- All parties notified

**Backward compatibility:**
- Contracts in progress use version active at start
- New contracts use latest version

---

## SUMMARY

This contract establishes that:

1. **External AI** creates complete candidate blocks
2. **Project LLM** integrates and certifies candidate blocks
3. **Human** approves gates and decides architecture
4. **Neither AI** can unilaterally modify universal architecture
5. **Evidence** is mandatory at all stages
6. **STOP conditions** trigger human architecture review
7. **Authority boundaries** are clearly defined and enforced

**This contract is the foundation for all subsequent phases of the AI Tutorial Block Creation, Integration & Certification Lifecycle.**

---

**END OF PHASE 0.1 CONTRACT**

**Status:** FROZEN  
**Next Phase:** 0.2 — Human Approval Contract

