# Phase 0.5 — Handoff Protocol Contract V1

**Status:** FROZEN  
**Created:** 2026-09-30  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  
**Versioning Governance:** Phase 0.10 V1 - Contract Versioning & Evolution

---

## DEPENDENCIES

**This contract depends on:**
- Phase 0.1 — AI Roles & Responsibility Contract V1
- Phase 0.2 — Human Approval Contract V1 (Gate 1: Prototype Approval)
- Phase 0.3 — Repository Modification Contract V1
- Phase 0.4 — Runtime Boundary Contract V1
- Phase 0.4 — Validation Audit V1 (qualifications)

**This contract must not contradict:**
- Phase 0.1 (External AI has NO repository access)
- Phase 0.2 (Human approval required at Gate 1 before candidate engineering)
- Phase 0.3 (Project LLM performs repository modifications, not External AI)
- Phase 0.4 (Runtime boundaries enforced in production blocks)

**If conflict discovered:**
- STOP immediately
- Request human architecture review
- Do NOT proceed with conflicting handoff
- Do NOT modify frozen contracts

---

## 1. PURPOSE

This contract defines **exactly how a candidate Tutorial Block package moves from External AI to Project LLM** without ambiguity, missing artifacts, unauthorized repository access, or loss of evidence.

**Core Principle:**  
The candidate package is a **structured, verifiable, complete artifact** that enables Project LLM to audit, adapt, integrate, and certify the block without guessing External AI's intent.

**Scope:**  
All handoff activities from Phase 2 (Prototype) through Phase 6 (Handoff), including Gate 1 (Prototype Approval) and candidate engineering (Phase 4-5).

---

## 2. HANDOFF ACTORS

### 2.1 External AI (Block Factory)

**Responsibility:** Create complete, self-contained candidate package

**Authority:**
- Create candidate artifacts
- Validate candidate against guidelines
- Package candidate for handoff
- Provide evidence of candidate quality

**Prohibition:**
- NO access to production repository
- NO production integration
- NO certification authority
- NO deployment authority

---

### 2.2 Human (Prototype Approval Authority)

**Responsibility:** Approve prototype before candidate engineering (Gate 1)

**Authority:**
- Review prototype evidence
- Approve/reject/conditionally approve prototype
- Set conditions for candidate engineering
- Final acceptance at Gate 3 (separate from handoff)

**Prohibition:**
- Cannot bypass Gate 1 without documented justification
- Cannot accept incomplete handoff package

---

### 2.3 Project LLM (Integration & Certification Agent)

**Responsibility:** Accept candidate package, verify completeness, begin repository audit

**Authority:**
- Inspect candidate package
- Verify handoff completeness
- Reject incomplete handoff
- Request candidate revision
- Proceed to Phase 7 (Repository Audit) after handoff acceptance

**Prohibition:**
- Cannot accept handoff without completeness verification
- Cannot modify candidate before repository audit
- Cannot bypass handoff verification checklist

---

## 3. CANDIDATE PACKAGE STRUCTURE

### 3.1 Required Package Format

**The candidate package MUST be structured as:**

```
[BlockName]-candidate-v[X.Y]/
│
├── manifest.json                    # Package metadata
├── handoff-report.md                # Human-readable summary
│
├── prototype/                       # Original HTML prototype
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── data.json
│   ├── assets/
│   └── README.md
│
├── react/                           # React/TypeScript candidate
│   ├── [BlockName].tsx              # Main component
│   ├── [BlockName].types.ts         # TypeScript types
│   ├── [BlockName].utils.ts         # Utilities (if needed)
│   ├── [BlockName].test.tsx         # Unit tests
│   ├── hooks/                       # Custom hooks (if needed)
│   ├── components/                  # Subcomponents (if needed)
│   ├── assets/                      # Block-specific assets
│   └── README.md
│
├── schema/                          # Content schema definitions
│   ├── content-schema.ts            # TypeScript content interface
│   ├── content-schema.json          # JSON schema (validation)
│   ├── examples/                    # Example content instances
│   └── README.md
│
├── tests/                           # Test suite
│   ├── unit/                        # Unit test results
│   ├── component/                   # Component test results
│   ├── accessibility/               # A11y test results
│   ├── coverage/                    # Coverage reports
│   └── README.md
│
├── accessibility/                   # Accessibility evidence
│   ├── wcag-checklist.md            # WCAG compliance checklist
│   ├── keyboard-nav.md              # Keyboard navigation documentation
│   ├── screen-reader.md             # Screen reader testing notes
│   ├── color-contrast.md            # Color contrast validation
│   └── aria-audit.md                # ARIA attributes audit
│
├── responsive/                      # Responsive behavior evidence
│   ├── breakpoints.md               # Breakpoint definitions
│   ├── mobile.png                   # Mobile screenshot (375px)
│   ├── tablet.png                   # Tablet screenshot (768px)
│   ├── desktop.png                  # Desktop screenshot (1920px)
│   ├── interaction-demo.mp4         # Interaction recording
│   └── README.md
│
├── documentation/                   # Candidate documentation
│   ├── API.md                       # Component API (props interface)
│   ├── INTEGRATION-NOTES.md         # Integration guidance for Project LLM
│   ├── ARCHITECTURE.md              # Design decisions
│   ├── EXAMPLES.md                  # Usage examples
│   └── KNOWN-ISSUES.md              # Known limitations or TODOs
│
├── self-validation/                 # External AI validation results
│   ├── lint-results.txt             # ESLint output
│   ├── typecheck-results.txt        # TypeScript compilation output
│   ├── test-results.txt             # Test execution output
│   ├── build-results.txt            # Build output (if applicable)
│   └── validation-checklist.md     # Self-validation checklist
│
└── evidence/                        # Gate 1 evidence (Phase 3)
    ├── prototype-report.md          # Prototype report (from Phase 0.2)
    ├── learning-intent.md           # Learning objective alignment
    ├── content-verification.md      # Content accuracy verification
    ├── gate-1-submission.md         # Gate 1 approval request
    └── gate-1-decision.md           # Human Gate 1 decision (if approved)
```

**Rationale:**
- Structured format enables machine verification
- Preserves original prototype for evidence chain
- Separates concerns (prototype, React, schema, tests, docs)
- Provides complete evidence for Project LLM audit

---

### 3.2 manifest.json Schema

**Required format:**

```json
{
  "packageVersion": "1.0",
  "candidate": {
    "name": "InteractiveQuiz",
    "version": "Q4",
    "type": "interactive-quiz",
    "description": "Interactive quiz block with immediate feedback",
    "author": "External AI (ChatGPT 4.0)",
    "created": "2026-09-30T14:30:00Z"
  },
  "lifecycle": {
    "phase2Complete": true,
    "phase3Complete": true,
    "phase4Complete": true,
    "phase5Complete": true,
    "gate1Status": "APPROVED",
    "gate1Date": "2026-09-30T10:00:00Z",
    "gate1Approver": "Human Name"
  },
  "artifacts": {
    "prototype": {
      "present": true,
      "path": "prototype/",
      "entrypoint": "prototype/index.html"
    },
    "react": {
      "present": true,
      "path": "react/",
      "mainComponent": "react/InteractiveQuiz.tsx",
      "testFile": "react/InteractiveQuiz.test.tsx"
    },
    "schema": {
      "present": true,
      "path": "schema/",
      "contentSchema": "schema/content-schema.ts"
    },
    "tests": {
      "present": true,
      "path": "tests/",
      "unitTests": 12,
      "coverage": 87
    },
    "accessibility": {
      "present": true,
      "path": "accessibility/",
      "wcagLevel": "AA"
    },
    "responsive": {
      "present": true,
      "path": "responsive/",
      "breakpoints": ["mobile", "tablet", "desktop"]
    },
    "documentation": {
      "present": true,
      "path": "documentation/"
    },
    "selfValidation": {
      "present": true,
      "path": "self-validation/",
      "lintPassed": true,
      "typecheckPassed": true,
      "testsPassed": true
    },
    "evidence": {
      "present": true,
      "path": "evidence/",
      "gate1Evidence": true
    }
  },
  "dependencies": {
    "react": "^18.0.0",
    "newDependencies": [],
    "peerDependencies": []
  },
  "ubrcMetadata": {
    "progressRole": "instructional",
    "expectedTimeSec": 120,
    "completionCriteria": "User submits quiz answer and receives feedback"
  },
  "runtime": {
    "requiresBackendAPI": false,
    "requiresExternalAPI": false,
    "requiresDatabaseSchema": false,
    "requiresILSModification": false,
    "requiresLSNBModification": false,
    "requiresRSSBModification": false,
    "requiresAuthModification": false
  },
  "handoff": {
    "completeness": "complete",
    "readyForProjectLLM": true,
    "knownLimitations": ["Placeholder quiz questions", "No API integration yet"]
  },
  "checksum": {
    "algorithm": "sha256",
    "value": "abc123..."
  }
}
```

**Purpose:**
- Machine-readable package metadata
- Enables automated completeness verification
- Documents lifecycle status (phases complete, Gate 1 status)
- Declares architectural requirements upfront (backend API, database, ILS/LSNB/RSSB modifications)
- Prevents smuggled architecture changes (runtime.requiresXModification flags)

---

### 3.3 handoff-report.md Structure

**Required sections:**

```markdown
# Handoff Report: [BlockName] v[Version]

## Package Summary
- **Block Name:** [Name]
- **Block Type:** [type-id]
- **Version:** [Version]
- **Author:** External AI ([specific model])
- **Created:** [Date]
- **Gate 1 Status:** APPROVED / CONDITIONAL / REJECTED

## Lifecycle Completion

- [x] Phase 2: Prototype Created
- [x] Phase 3: Prototype Approved (Gate 1)
- [x] Phase 4: Candidate Engineering Complete
- [x] Phase 5: Candidate Testing Complete
- [x] Phase 6: Handoff Package Prepared

## Artifacts Included

- [x] Original Prototype (HTML/CSS/JS)
- [x] React/TypeScript Candidate
- [x] Content Schema
- [x] Unit Tests (12 tests, 87% coverage)
- [x] Accessibility Evidence (WCAG AA)
- [x] Responsive Evidence (mobile/tablet/desktop)
- [x] Documentation (API, Integration Notes, Architecture)
- [x] Self-Validation Results (lint/typecheck/test passed)
- [x] Gate 1 Evidence (prototype report, approval decision)

## Learning Objective

[Restate learning objective from requirement]

## Design Decisions

### Architecture
[Key architectural decisions made during candidate engineering]

### Component Structure
[Component hierarchy and decomposition]

### State Management
[Local state approach, no global state]

### Interactions
[Key interactions implemented]

## UBRC/ILS/LSNB/RSSB Compliance

### UBRC Contract
- [x] `data-block-id` attribute present
- [x] `data-block-type` attribute present
- [x] Accepts `block` prop
- [x] progressRole defined: `instructional`
- [x] expectedTimeSec defined: `120`

### ILS Participation
- [x] NO direct ILS calls
- [x] NO completion tracking logic
- [x] Passive observation model followed

### LSNB Participation
- [x] NO direct LSNB publishing
- [x] Optional read-only subscription pattern documented

### RSSB Participation
- [x] NO direct RSSB interaction
- [x] Passive participation only

## Runtime Requirements

- [ ] Requires new backend API: NO
- [ ] Requires external API: NO
- [ ] Requires database schema change: NO
- [ ] Requires ILS modification: NO
- [ ] Requires LSNB modification: NO
- [ ] Requires RSSB modification: NO
- [ ] Requires authentication change: NO

## Dependencies

### New Dependencies
[None / List with justification]

### Peer Dependencies
[List if any]

## Self-Validation Results

### Linting
- Status: PASSED
- Output: self-validation/lint-results.txt

### Type Checking
- Status: PASSED
- Output: self-validation/typecheck-results.txt

### Unit Tests
- Status: PASSED
- Tests: 12 passing
- Coverage: 87%
- Output: self-validation/test-results.txt

## Known Limitations

1. [Limitation 1 - e.g., Placeholder quiz questions]
2. [Limitation 2 - e.g., No API integration yet]
...

## Integration Notes for Project LLM

### Repository Integration
[Guidance on where candidate fits in repository structure]

### Expected Adaptations
[What Project LLM may need to adjust during hardening]

### Potential Conflicts
[Any anticipated repository conflicts]

## Gate 1 Decision

**Status:** APPROVED / CONDITIONAL APPROVE / REJECTED

**Approver:** [Human Name]  
**Date:** [Date]

**Conditions (if conditional):**
1. [Condition to verify in Phase 4-5]
...

**Evidence Location:** evidence/gate-1-decision.md

## Handoff Completeness

- [x] All required artifacts present
- [x] Manifest complete
- [x] Self-validation passed
- [x] Gate 1 approved
- [x] Documentation complete
- [x] Evidence complete

**Package Status:** READY FOR PROJECT LLM

## Next Steps

1. Project LLM inspects handoff package
2. Project LLM verifies completeness (Section 5 of Phase 0.5)
3. Project LLM accepts or rejects handoff
4. If accepted: Proceed to Phase 7 (Repository Audit)
5. If rejected: External AI revises and resubmits

---

**External AI:** [Identifier]  
**Handoff Date:** [Date]  
**Package Version:** 1.0
```

**Purpose:**
- Human-readable summary for Project LLM and Human
- Checklist-driven completeness verification
- Declares runtime requirements upfront (prevents smuggled architecture)
- Documents Gate 1 decision outcome
- Provides integration guidance

---

## 4. HANDOFF WORKFLOW

### 4.1 Complete Handoff Flow

```
Phase 2: Prototype Creation
         │
         ▼
Phase 3: Prototype Approval (Gate 1)
         │
         ├─ APPROVED → Proceed
         ├─ CONDITIONAL → Proceed with conditions
         └─ REJECTED → Revise prototype, retry Gate 1
         │
         ▼
Phase 4: Candidate Engineering
         │
         ▼
Phase 5: Candidate Testing & Validation
         │
         ▼
Phase 6: Handoff Package Assembly
         │
         ├─ Create directory structure
         ├─ Copy/organize all artifacts
         ├─ Generate manifest.json
         ├─ Write handoff-report.md
         ├─ Run self-validation
         ├─ Generate checksums
         └─ Package complete
         │
         ▼
Handoff Submission
         │
         ▼
Project LLM Intake
         │
         ├─ Verify package structure
         ├─ Verify manifest completeness
         ├─ Verify artifact presence
         ├─ Verify checksums
         ├─ Verify Gate 1 approval
         ├─ Verify self-validation results
         └─ Verify no smuggled architecture
         │
         ├─ COMPLETE → Accept handoff
         ├─ INCOMPLETE → Reject, request revision
         └─ ARCHITECTURE CONFLICT → STOP, Gate 2
         │
         ▼
Phase 7: Repository Audit (Project LLM begins)
```

---

### 4.2 Gate 1 Prerequisite

**Handoff cannot proceed without Gate 1 approval.**

**Phase 0.2 Contract (Gate 1) requires:**
- Prototype evidence submitted
- Human review completed
- Decision: APPROVE or CONDITIONAL APPROVE

**If Gate 1 = REJECT:**
```
External AI revises prototype
         ↓
Resubmit for Gate 1
         ↓
Human re-reviews
         ↓
If approved: Proceed to Phase 4
```

**Handoff package MUST include:**
- Gate 1 submission evidence (evidence/gate-1-submission.md)
- Gate 1 decision record (evidence/gate-1-decision.md)
- Gate 1 status in manifest.json: `"gate1Status": "APPROVED"`

**Project LLM verification:**
```typescript
if (manifest.lifecycle.gate1Status !== "APPROVED" && 
    manifest.lifecycle.gate1Status !== "CONDITIONAL_APPROVE") {
  return {
    handoffStatus: "REJECTED",
    reason: "Gate 1 approval required before handoff",
    action: "Complete Gate 1 approval process"
  };
}
```

---

### 4.3 Phase Completion Prerequisites

**Before Phase 6 (Handoff), External AI must complete:**

**Phase 2 (Prototype):**
- ✅ HTML/CSS/JS prototype functional
- ✅ Prototype demonstrates all interactions
- ✅ Prototype responsive (mobile/tablet/desktop)
- ✅ Prototype accessible (keyboard nav, ARIA)

**Phase 3 (Gate 1):**
- ✅ Prototype evidence submitted
- ✅ Human review completed
- ✅ APPROVED or CONDITIONAL APPROVE decision received

**Phase 4 (Candidate Engineering):**
- ✅ Prototype converted to React/TypeScript
- ✅ Component structure defined
- ✅ Props interface defined
- ✅ Content schema defined
- ✅ UBRC contract implemented (data-block-id, data-block-type, block prop)
- ✅ Runtime boundaries respected (Phase 0.4)
- ✅ No prohibited operations (no direct ILS/LSNB/RSSB/database calls)
- ✅ Local state management only
- ✅ Accessibility preserved from prototype
- ✅ Responsive behavior preserved

**Phase 5 (Candidate Testing):**
- ✅ Unit tests written and passing
- ✅ Component tests written and passing
- ✅ Linting passed
- ✅ Type checking passed
- ✅ Self-validation checklist complete
- ✅ Test coverage adequate (>80% target)

**Phase 6 (Handoff Package):**
- ✅ Package structure created
- ✅ All artifacts organized
- ✅ manifest.json generated
- ✅ handoff-report.md written
- ✅ Checksums generated
- ✅ Package completeness verified

---

## 5. HANDOFF COMPLETENESS VERIFICATION

### 5.1 Project LLM Verification Checklist

**When Project LLM receives handoff package, MUST verify:**

#### Step 1: Package Structure
```
[ ] Root directory exists: [BlockName]-candidate-v[X.Y]/
[ ] manifest.json present
[ ] handoff-report.md present
[ ] prototype/ directory present
[ ] react/ directory present
[ ] schema/ directory present
[ ] tests/ directory present
[ ] accessibility/ directory present
[ ] responsive/ directory present
[ ] documentation/ directory present
[ ] self-validation/ directory present
[ ] evidence/ directory present
```

#### Step 2: Manifest Validation
```
[ ] manifest.json parseable (valid JSON)
[ ] packageVersion present
[ ] candidate.name matches directory name
[ ] candidate.type defined (hyphenated-lowercase)
[ ] lifecycle.gate1Status = "APPROVED" or "CONDITIONAL_APPROVE"
[ ] lifecycle.gate1Date present
[ ] lifecycle.gate1Approver present
[ ] artifacts section complete (all paths defined)
[ ] runtime section present (all requiresX flags defined)
[ ] ubrcMetadata.progressRole defined
[ ] ubrcMetadata.expectedTimeSec defined
[ ] handoff.completeness = "complete"
[ ] handoff.readyForProjectLLM = true
[ ] checksum present
```

#### Step 3: Artifact Presence
```
[ ] prototype/index.html exists and is valid HTML
[ ] prototype/style.css exists
[ ] prototype/script.js exists (if interactive)
[ ] react/[BlockName].tsx exists
[ ] react/[BlockName].types.ts exists
[ ] react/[BlockName].test.tsx exists
[ ] schema/content-schema.ts exists
[ ] tests/coverage/ directory exists
[ ] accessibility/wcag-checklist.md exists
[ ] responsive/mobile.png exists
[ ] responsive/tablet.png exists
[ ] responsive/desktop.png exists
[ ] documentation/API.md exists
[ ] documentation/INTEGRATION-NOTES.md exists
[ ] self-validation/lint-results.txt exists
[ ] self-validation/typecheck-results.txt exists
[ ] self-validation/test-results.txt exists
[ ] self-validation/validation-checklist.md exists
[ ] evidence/gate-1-decision.md exists
```

#### Step 4: Self-Validation Results
```
[ ] Lint status: PASSED (check self-validation/lint-results.txt)
[ ] Typecheck status: PASSED (check self-validation/typecheck-results.txt)
[ ] Test status: PASSED (check self-validation/test-results.txt)
[ ] Test coverage: ≥70% (acceptable minimum)
```

#### Step 5: Gate 1 Evidence
```
[ ] evidence/gate-1-submission.md exists
[ ] evidence/gate-1-decision.md exists
[ ] Gate 1 decision = APPROVED or CONDITIONAL APPROVE
[ ] Gate 1 approver name present
[ ] Gate 1 date present
[ ] If conditional: conditions documented
```

#### Step 6: Architecture Requirements
```
[ ] runtime.requiresBackendAPI = false (or justified if true)
[ ] runtime.requiresExternalAPI = false (or justified if true)
[ ] runtime.requiresDatabaseSchema = false (or STOP if true)
[ ] runtime.requiresILSModification = false (or STOP if true)
[ ] runtime.requiresLSNBModification = false (or STOP if true)
[ ] runtime.requiresRSSBModification = false (or STOP if true)
[ ] runtime.requiresAuthModification = false (or STOP if true)
[ ] dependencies.newDependencies = [] (or requires Gate 2 if non-empty)
```

#### Step 7: UBRC Contract Compliance (Initial Check)
```
[ ] react/[BlockName].tsx contains data-block-id attribute
[ ] react/[BlockName].tsx contains data-block-type attribute
[ ] Component accepts block prop
[ ] ubrcMetadata.progressRole defined in manifest
[ ] ubrcMetadata.expectedTimeSec defined (if instructional)
[ ] No direct ILS API calls in code (grep verification)
[ ] No direct LSNB publishing in code
[ ] No direct RSSB interaction in code
[ ] No recordBlockCompletion calls in code
[ ] No direct database access in code
```

#### Step 8: Checksum Verification
```
[ ] Checksum algorithm supported (sha256)
[ ] Checksum valid (recalculate and compare)
```

---

### 5.2 Automated Verification Script Template

**Project LLM should implement (conceptually):**

```typescript
interface HandoffVerificationResult {
  status: 'ACCEPTED' | 'REJECTED' | 'ARCHITECTURE_STOP';
  completeness: number; // 0-100%
  missingArtifacts: string[];
  failedChecks: string[];
  architectureConflicts: string[];
  warnings: string[];
  recommendation: string;
}

function verifyHandoffPackage(packagePath: string): HandoffVerificationResult {
  const result: HandoffVerificationResult = {
    status: 'ACCEPTED',
    completeness: 0,
    missingArtifacts: [],
    failedChecks: [],
    architectureConflicts: [],
    warnings: [],
    recommendation: ''
  };

  // Step 1: Package Structure
  const structureChecks = verifyPackageStructure(packagePath);
  if (!structureChecks.passed) {
    result.status = 'REJECTED';
    result.missingArtifacts.push(...structureChecks.missing);
  }

  // Step 2: Manifest Validation
  const manifest = readManifest(packagePath);
  if (!manifest) {
    result.status = 'REJECTED';
    result.failedChecks.push('manifest.json missing or invalid');
    return result;
  }

  // Step 3: Gate 1 Check
  if (manifest.lifecycle.gate1Status !== 'APPROVED' && 
      manifest.lifecycle.gate1Status !== 'CONDITIONAL_APPROVE') {
    result.status = 'REJECTED';
    result.failedChecks.push('Gate 1 approval required');
    return result;
  }

  // Step 4: Architecture Conflict Detection
  if (manifest.runtime.requiresDatabaseSchema) {
    result.status = 'ARCHITECTURE_STOP';
    result.architectureConflicts.push('Database schema modification required → Gate 2');
  }
  if (manifest.runtime.requiresILSModification) {
    result.status = 'ARCHITECTURE_STOP';
    result.architectureConflicts.push('ILS modification required → Gate 2');
  }
  // ... more architecture checks

  // Step 5: Artifact Presence
  const artifacts = verifyArtifacts(packagePath, manifest);
  result.missingArtifacts.push(...artifacts.missing);
  result.completeness = artifacts.completenessPercent;

  // Step 6: Self-Validation Results
  const validation = verifySelfValidation(packagePath);
  if (!validation.lintPassed || !validation.typecheckPassed || !validation.testsPassed) {
    result.status = 'REJECTED';
    result.failedChecks.push('Self-validation failed');
  }

  // Step 7: UBRC Contract Initial Check
  const ubrc = verifyUBRCContract(packagePath, manifest);
  if (ubrc.violations.length > 0) {
    result.warnings.push(...ubrc.violations);
  }

  // Step 8: Recommendation
  if (result.status === 'ARCHITECTURE_STOP') {
    result.recommendation = 'STOP: Architecture review required (Gate 2)';
  } else if (result.status === 'REJECTED') {
    result.recommendation = 'REJECT: Fix issues and resubmit';
  } else if (result.warnings.length > 0) {
    result.recommendation = 'ACCEPT WITH WARNINGS: Proceed to repository audit';
  } else {
    result.recommendation = 'ACCEPT: Proceed to Phase 7 (Repository Audit)';
  }

  return result;
}
```

**Purpose:**
- Automated, deterministic handoff verification
- No human guessing about completeness
- Clear accept/reject/stop decision
- Traceable evidence of verification

---

## 6. HANDOFF DECISIONS

### 6.1 ACCEPT Handoff

**Conditions:**
```
✅ All required artifacts present
✅ Manifest complete and valid
✅ Gate 1 approved
✅ Self-validation passed
✅ No architecture conflicts
✅ UBRC contract compliance initial check passed
✅ Completeness ≥95%
```

**Project LLM Action:**
```
1. Document handoff acceptance
2. Record handoff timestamp
3. Preserve candidate package (immutable)
4. Proceed to Phase 7 (Repository Audit)
```

**Format:**
```markdown
## HANDOFF ACCEPTANCE RECORD

**Block:** [Name] v[Version]  
**Handoff Date:** [Date]  
**Project LLM:** [Identifier]

**Verification Results:**
- Package structure: ✅ COMPLETE
- Manifest validation: ✅ VALID
- Gate 1 status: ✅ APPROVED
- Self-validation: ✅ PASSED
- Architecture conflicts: ✅ NONE
- Completeness: 98%

**Decision:** ACCEPTED

**Next Phase:** 7 (Repository Audit)

**Candidate Package Location:** [path or archive]

**Immutability:** Candidate package frozen; adaptations will be tracked separately during hardening.
```

---

### 6.2 REJECT Handoff (Incomplete)

**Conditions:**
```
❌ Required artifacts missing
❌ Manifest invalid or incomplete
❌ Self-validation failed (lint/typecheck/tests)
❌ Gate 1 not approved
❌ Completeness <90%
```

**Project LLM Action:**
```
1. Document handoff rejection
2. List specific deficiencies
3. Return to External AI for revision
4. Do NOT proceed to Phase 7
```

**Format:**
```markdown
## HANDOFF REJECTION RECORD

**Block:** [Name] v[Version]  
**Handoff Date:** [Date]  
**Project LLM:** [Identifier]

**Rejection Reason:** INCOMPLETE PACKAGE

**Missing Artifacts:**
1. [Artifact 1 - e.g., responsive/tablet.png]
2. [Artifact 2 - e.g., documentation/API.md]
...

**Failed Checks:**
1. [Check 1 - e.g., Self-validation: typecheck failed]
2. [Check 2 - e.g., Test coverage only 45% (target ≥70%)]
...

**Required Actions:**
1. Fix all failed checks
2. Add all missing artifacts
3. Regenerate manifest.json
4. Rerun self-validation
5. Resubmit handoff package

**Decision:** REJECTED

**Next Step:** External AI revises and resubmits handoff package

**Do NOT proceed to Phase 7 until handoff accepted.**
```

---

### 6.3 STOP — Architecture Conflict Detected

**Conditions:**
```
⚠️ runtime.requiresDatabaseSchema = true
⚠️ runtime.requiresILSModification = true
⚠️ runtime.requiresLSNBModification = true
⚠️ runtime.requiresRSSBModification = true
⚠️ runtime.requiresAuthModification = true
⚠️ dependencies.newDependencies non-empty (major dependencies)
```

**Project LLM Action:**
```
1. STOP immediately
2. Document architecture conflict
3. Prepare Gate 2 evidence package (Phase 0.2)
4. Request human architecture review
5. Do NOT proceed to Phase 7
6. Do NOT modify candidate
```

**Format:**
```markdown
## HANDOFF ARCHITECTURE STOP

**Block:** [Name] v[Version]  
**Handoff Date:** [Date]  
**Project LLM:** [Identifier]

**STOP Reason:** ARCHITECTURE CONFLICT DETECTED

**Conflict Details:**

### Declared Requirements (from manifest.json):
- requiresDatabaseSchema: true
- requiresILSModification: false
- requiresLSNBModification: false
- requiresRSSBModification: false
- newDependencies: ["some-heavy-library"]

### Conflict Analysis:

**Database Schema Change:**
- Candidate declares need for new database schema
- Phase 0.3 prohibits database schema changes without Gate 2
- Phase 0.4 prohibits blocks from direct database access
- Conflict: Candidate architecture incompatible with Phase 0 contracts

### Why Standard Adaptation Cannot Resolve:
[Explanation of why Project LLM cannot simply "adapt" this]

### Options:

**Option A:** Approve database schema change (Gate 2 decision)
**Option B:** Redesign candidate to use existing schema
**Option C:** Alternative approach (use API instead of direct DB)
**Option D:** Abandon candidate

**Project LLM Recommendation:** [A/B/C/D with rationale]

**Decision:** STOP FOR GATE 2 ARCHITECTURE REVIEW

**Next Step:** Human Architecture Authority reviews conflict at Gate 2

**Phase 0.2 Reference:** Gate 2 — Architecture Review

**Do NOT proceed to Phase 7 until Gate 2 resolved.**
```

---

### 6.4 ACCEPT WITH WARNINGS

**Conditions:**
```
✅ All required artifacts present
✅ Manifest complete
✅ Gate 1 approved
✅ Self-validation passed
⚠️ Minor warnings (e.g., test coverage 72% instead of 80%)
⚠️ Optional artifacts missing (e.g., performance notes)
✅ No architecture conflicts
```

**Project LLM Action:**
```
1. Document handoff acceptance with warnings
2. Record warnings for tracking
3. Proceed to Phase 7 (Repository Audit)
4. Address warnings during hardening if possible
```

**Format:**
```markdown
## HANDOFF ACCEPTANCE WITH WARNINGS

**Block:** [Name] v[Version]  
**Handoff Date:** [Date]  
**Project LLM:** [Identifier]

**Decision:** ACCEPTED WITH WARNINGS

**Warnings:**
1. Test coverage 72% (target 80%+) — address during hardening
2. Optional artifact missing: performance-notes.md — acceptable
3. One ARIA attribute could be improved — verify in Phase 15

**Verification Results:**
- Package structure: ✅ COMPLETE
- Manifest validation: ✅ VALID
- Gate 1 status: ✅ APPROVED
- Self-validation: ✅ PASSED
- Architecture conflicts: ✅ NONE
- Completeness: 94%

**Next Phase:** 7 (Repository Audit)

**Warning Tracking:** Warnings will be addressed during Phase 8 (Production Hardening) or Phase 15 (Quality Assurance).
```

---

## 7. SMUGGLED ARCHITECTURE PREVENTION

### 7.1 Prohibited Smuggling Patterns

**The candidate package MUST NOT implicitly introduce:**

#### Architecture Change Attempts:
- ❌ New ILS infrastructure (custom completion tracker)
- ❌ New LSNB infrastructure (custom progress bus)
- ❌ New RSSB infrastructure (custom analytics)
- ❌ New completion mechanisms (bypassing ILS)
- ❌ New database tables (embedded migrations)
- ❌ New authentication logic (custom auth)
- ❌ New global state systems (Redux, Zustand without approval)
- ❌ New telemetry systems (custom analytics)

#### Code Patterns Indicating Smuggled Architecture:
```typescript
// ❌ PROHIBITED: Direct completion call
import { recordBlockCompletion } from '@/services/learning-progress';

// ❌ PROHIBITED: Custom ILS infrastructure
class CustomCompletionTracker {
  trackTime() { /* ... */ }
  recordCompletion() { /* ... */ }
}

// ❌ PROHIBITED: Direct database import
import { db } from '@/db';
import { blockLearningState } from '@/db/schema';

// ❌ PROHIBITED: Custom LSNB publishing
import { publishToLSNB } from '@/lib/lsnb';

// ❌ PROHIBITED: Custom global state
import { create } from 'zustand'; // if not already in project

// ❌ PROHIBITED: Authentication implementation
function authenticateUser() { /* ... */ }
```

---

### 7.2 Manifest Declaration Requirement

**manifest.json runtime section MUST truthfully declare:**

```json
{
  "runtime": {
    "requiresBackendAPI": false,          // true = needs new backend endpoint
    "requiresExternalAPI": false,         // true = needs external service (OpenAI, etc.)
    "requiresDatabaseSchema": false,      // true = needs new table/migration
    "requiresILSModification": false,     // true = needs ILS architecture change
    "requiresLSNBModification": false,    // true = needs LSNB architecture change
    "requiresRSSBModification": false,    // true = needs RSSB architecture change
    "requiresAuthModification": false     // true = needs authentication change
  }
}
```

**If ANY flag = true:**
```
Project LLM MUST:
  1. STOP handoff verification
  2. Prepare Gate 2 evidence package
  3. Request human architecture review
  4. Do NOT proceed to Phase 7
```

**Purpose:**
- Forces External AI to declare architectural needs upfront
- Prevents discovering architecture conflicts late in integration
- Enables early Gate 2 review when needed
- Prevents "stealth" architecture changes

---

### 7.3 Code Grep Verification

**Project LLM MUST perform grep checks on candidate code:**

```bash
# Prohibited patterns (should return ZERO matches)
grep -r "recordBlockCompletion" react/
grep -r "block_learning_state" react/
grep -r "import.*db.*from" react/
grep -r "publishToLSNB" react/
grep -r "publishToRSSB" react/
grep -r "class.*CompletionTracker" react/
grep -r "authenticateUser" react/
grep -r "jwt.sign" react/
grep -r "crypto.subtle" react/    # if implementing auth
```

**If matches found:**
```
1. Inspect matched code
2. Determine if legitimate (e.g., comment, example) or violation
3. If violation:
   - Document as architecture smuggling attempt
   - REJECT handoff OR trigger Gate 2 STOP
4. If legitimate:
   - Document false positive
   - Proceed
```

---

## 8. INCOMPLETE HANDOFF HANDLING

### 8.1 Missing Artifacts

**If required artifacts missing:**

**Severity Classification:**

**Critical (blocks acceptance):**
- manifest.json
- handoff-report.md
- react/[BlockName].tsx (main component)
- schema/content-schema.ts
- evidence/gate-1-decision.md

**Important (blocks acceptance unless justified):**
- prototype/index.html
- react/[BlockName].test.tsx
- documentation/API.md
- documentation/INTEGRATION-NOTES.md
- self-validation/validation-checklist.md

**Optional (accept with warnings):**
- Additional subcomponents (if simple block)
- Performance notes
- Advanced examples

**Response:**
```
IF critical artifact missing:
  → REJECT handoff
  → List missing artifacts
  → Request complete resubmission

IF important artifact missing:
  → Evaluate justification
  → If justified: ACCEPT WITH WARNING
  → If not justified: REJECT handoff

IF optional artifact missing:
  → ACCEPT WITH WARNING
  → Note for future improvement
```

---

### 8.2 Failed Self-Validation

**If self-validation failed (lint/typecheck/test):**

**Project LLM MUST:**
```
1. REJECT handoff immediately
2. Document specific failures
3. Require External AI to fix and revalidate
4. Do NOT attempt to fix External AI's validation failures
```

**Rationale:**
- External AI is responsible for candidate quality (Phase 0.1)
- Project LLM should receive clean, validated candidate
- Fixes belong in External AI's Phase 5 (Candidate Testing)

**Response template:**
```markdown
## HANDOFF REJECTED: FAILED SELF-VALIDATION

**Self-Validation Results:**
- Lint: FAILED (see self-validation/lint-results.txt)
- Typecheck: FAILED (see self-validation/typecheck-results.txt)
- Tests: 8 passing, 4 failing (see self-validation/test-results.txt)

**Required Actions:**
1. Fix all lint errors
2. Fix all type errors
3. Fix all failing tests
4. Rerun self-validation
5. Update self-validation results in package
6. Ensure manifest.selfValidation flags all show true
7. Resubmit handoff package

**Project LLM will NOT fix External AI validation failures.**

**Resubmit when self-validation passed.**
```

---

### 8.3 Gate 1 Not Approved

**If Gate 1 status ≠ APPROVED or CONDITIONAL_APPROVE:**

**Project LLM MUST:**
```
1. REJECT handoff immediately
2. Direct External AI back to Phase 3 (Gate 1)
3. Do NOT proceed to Phase 7
4. Do NOT accept handoff without Gate 1 approval
```

**Rationale:**
- Phase 0.2 requires Gate 1 approval before candidate engineering
- Handoff without Gate 1 bypasses human prototype approval
- Violates governance contract

**Response template:**
```markdown
## HANDOFF REJECTED: GATE 1 NOT APPROVED

**Gate 1 Status:** [PENDING / REJECTED / NOT_SUBMITTED]

**Required Actions:**
1. Submit prototype for Gate 1 approval (Phase 3)
2. Wait for human prototype approval
3. If approved: Proceed to Phase 4-6
4. If rejected: Revise prototype and resubmit
5. Include Gate 1 approval decision in handoff package
6. Update manifest.lifecycle.gate1Status to "APPROVED"

**Handoff cannot proceed without Gate 1 approval.**

**Reference:** Phase 0.2 — Human Approval Contract, Gate 1
```

---

## 9. REVISION REQUEST PROTOCOL

### 9.1 When Revision Required

**Revision request triggered when:**
- Handoff completeness <90%
- Required artifacts missing
- Self-validation failed
- Manifest incomplete/invalid
- UBRC contract violations detected
- Gate 1 not approved

**NOT triggered when:**
- Architecture conflict detected (that's Gate 2 STOP, not revision)
- Minor warnings present (accept with warnings)
- Optional artifacts missing (acceptable)

---

### 9.2 Revision Request Format

**Project LLM issues:**

```markdown
## HANDOFF REVISION REQUEST

**Block:** [Name] v[Version]  
**Handoff Date:** [Date]  
**Project LLM:** [Identifier]

**Revision Reason:** [INCOMPLETE / FAILED_VALIDATION / MISSING_GATE1 / MANIFEST_INVALID]

**Current Package Status:**
- Completeness: [X]%
- Missing Artifacts: [count]
- Failed Checks: [count]

**Required Fixes:**

### Missing Artifacts:
1. [Artifact path and description]
2. [Artifact path and description]
...

### Failed Validation:
1. [Specific failure with location]
2. [Specific failure with location]
...

### Manifest Issues:
1. [Specific issue]
2. [Specific issue]
...

**Acceptance Criteria:**
- [ ] All missing artifacts added
- [ ] All validation failures fixed
- [ ] Manifest complete and valid
- [ ] Self-validation passed (lint/typecheck/tests)
- [ ] Completeness ≥95%
- [ ] Gate 1 approved (if not already)

**Next Steps:**
1. External AI addresses all required fixes
2. External AI reruns self-validation
3. External AI updates manifest and handoff-report
4. External AI resubmits handoff package
5. Project LLM re-verifies

**Target Resubmission:** [Date or timeline]

**Revision Attempt:** [1/2/3/...]

**Escalation:** After 3 failed attempts, escalate to Human for guidance.
```

---

### 9.3 Resubmission Process

**External AI resubmission:**

```
1. Fix all issues listed in revision request
2. Rerun self-validation (lint/typecheck/test)
3. Update manifest.json with new checksum
4. Update handoff-report.md with revision notes
5. Increment package version if needed (v1.1, v1.2, etc.)
6. Resubmit complete package
```

**Project LLM re-verification:**

```
1. Run full handoff verification again (Section 5.1)
2. Check that ALL revision request items addressed
3. Decision:
   - ACCEPT: All issues fixed
   - REJECT: Issues remain, issue new revision request
   - STOP: New architecture conflict discovered (Gate 2)
```

---

### 9.4 Revision Iteration Limit

**Maximum revision attempts: 3**

**After 3 failed handoff attempts:**
```
1. Project LLM documents persistent issues
2. Escalate to Human
3. Human evaluates:
   - External AI capability issue?
   - Requirement unclear?
   - Candidate fundamentally flawed?
   - Different approach needed?
4. Human decides:
   - Provide detailed guidance and allow 1 more attempt
   - Assign to different External AI
   - Revise requirements
   - Abandon candidate
```

**Purpose:**
- Prevent infinite revision loops
- Force human intervention if persistent problems
- Protect project timeline

---

## 10. CANDIDATE PACKAGE IMMUTABILITY

### 10.1 Immutability Principle

**Once handoff accepted:**

```
Candidate Package = IMMUTABLE ARTIFACT
```

**Project LLM MUST NOT:**
- ❌ Modify candidate package files in place
- ❌ Delete candidate artifacts
- ❌ Overwrite candidate with adaptations

**Project LLM MUST:**
- ✅ Preserve complete candidate package
- ✅ Track adaptations separately
- ✅ Maintain evidence chain: prototype → candidate → adaptations → production

---

### 10.2 Adaptation Tracking

**Production hardening changes tracked as:**

```
[BlockName]-production/
├── candidate/ (symlink or copy of original package)
├── adaptations/
│   ├── adaptation-log.md
│   ├── diff-candidate-vs-production.patch
│   └── changes/
│       ├── [file1-changes].md
│       ├── [file2-changes].md
│       └── ...
└── production/
    └── [final production files]
```

**adaptation-log.md format:**

```markdown
# Adaptation Log: [BlockName] v[Version]

## Candidate Package
- Source: candidate/ (immutable)
- Version: v1.0
- Handoff Date: 2026-09-30

## Adaptations Applied

### Adaptation 1: Fix import paths
- **Date:** 2026-09-30
- **Phase:** 8 (Production Hardening)
- **Reason:** Candidate used relative imports; repository uses aliases
- **Files Modified:** InteractiveQuiz.tsx, InteractiveQuiz.utils.ts
- **Changes:** Replaced `../../components/` with `@/components/`
- **Diff:** adaptations/changes/import-path-changes.patch

### Adaptation 2: Add theme tokens
- **Date:** 2026-09-30
- **Phase:** 8 (Production Hardening)
- **Reason:** Candidate used hard-coded colors; repository uses theme system
- **Files Modified:** InteractiveQuiz.tsx
- **Changes:** Replaced hex colors with theme.colors.* references
- **Diff:** adaptations/changes/theme-changes.patch

### Adaptation 3: Fix TypeScript strict mode issue
- **Date:** 2026-09-30
- **Phase:** 8 (Production Hardening)
- **Reason:** Candidate used `any` type; repository uses strict mode
- **Files Modified:** InteractiveQuiz.types.ts
- **Changes:** Replaced `any` with proper types
- **Diff:** adaptations/changes/typescript-strict.patch

## Production Files
- Location: production/
- Ready Date: 2026-09-30
- Certification: Phase 19 (pending)
```

**Purpose:**
- Traceability: Can trace production code back to candidate
- Evidence: Clear record of what Project LLM changed
- Accountability: External AI's work vs Project LLM's work distinguished
- Audit: Can review whether adaptations were necessary or excessive

---

## 11. GATE 1 RELATIONSHIP

### 11.1 Gate 1 as Handoff Prerequisite

**Phase 0.2 establishes:**
```
Gate 1 (Phase 3) → MUST APPROVE before Phase 4 (Candidate Engineering)
```

**Phase 0.5 enforces:**
```
Gate 1 approval → REQUIRED in handoff package
```

**Connection:**
```
Phase 2: Prototype
    ↓
Phase 3: Gate 1 (Human Approval)
    ↓
    ├─ APPROVED → Proceed to Phase 4
    └─ REJECTED → Revise prototype
    ↓
Phase 4-5: Candidate Engineering & Testing
    ↓
Phase 6: Handoff (includes Gate 1 evidence)
    ↓
Project LLM verifies Gate 1 approval
```

---

### 11.2 Gate 1 Conditions Tracking

**If Gate 1 = CONDITIONAL APPROVE:**

**Phase 0.2 requires conditions be addressed in Phase 4-5.**

**Phase 0.5 requires handoff package document condition resolution:**

**In handoff-report.md:**
```markdown
## Gate 1 Conditions

**Gate 1 Status:** CONDITIONAL APPROVE

**Conditions:**
1. Improve color contrast on quiz options (WCAG AA)
2. Add keyboard navigation hints
3. Simplify quiz question wording

**Condition Resolution:**

### Condition 1: Color contrast
- Status: ✅ ADDRESSED
- Resolution: Changed option background from #ddd to #ccc (contrast now 4.8:1)
- Evidence: accessibility/color-contrast.md updated

### Condition 2: Keyboard navigation
- Status: ✅ ADDRESSED
- Resolution: Added visible focus indicators and keyboard shortcut hints
- Evidence: accessibility/keyboard-nav.md updated

### Condition 3: Question wording
- Status: ✅ ADDRESSED
- Resolution: Simplified quiz questions per feedback
- Evidence: Updated in prototype and React candidate

**All conditions addressed: YES**
```

**Project LLM verification:**
```
IF Gate 1 = CONDITIONAL:
  1. Check handoff-report for "Gate 1 Conditions" section
  2. Verify all conditions listed
  3. Verify all conditions marked as addressed
  4. If any condition NOT addressed:
     → REJECT handoff
     → Request condition resolution
  5. If all conditions addressed:
     → Proceed with acceptance
```

---

## 12. DEPENDENCIES & NEW LIBRARIES

### 12.1 Dependency Declaration

**manifest.json must declare:**

```json
{
  "dependencies": {
    "react": "^18.0.0",                    // Peer dependency (assumed present)
    "newDependencies": [],                 // Any NEW dependencies candidate requires
    "peerDependencies": []                 // Required peer dependencies
  }
}
```

---

### 12.2 New Dependency Approval

**If newDependencies is NON-EMPTY:**

**Project LLM MUST:**
```
1. Inspect each new dependency
2. Evaluate:
   - Is it already in project? (check repository package.json)
   - Is it necessary or can existing library be used?
   - Security status (npm audit, known vulnerabilities)
   - Bundle size impact
   - Maintenance status (last update, GitHub stars, etc.)
   - License compatibility
3. Decision:
   - If dependency minor and safe: ACCEPT WITH WARNING
   - If dependency major or risky: STOP → Gate 2
   - If dependency unnecessary: REJECT handoff, request removal
```

**Gate 2 trigger threshold:**
- New dependency >100KB minified
- New dependency with security vulnerabilities
- New dependency abandoned (no updates >2 years)
- New dependency with restrictive license
- New dependency that duplicates existing functionality

**Example:**

**Candidate declares:**
```json
{
  "newDependencies": [
    "react-markdown",
    "zod"
  ]
}
```

**Project LLM evaluation:**
```
react-markdown:
  - Size: ~50KB
  - Purpose: Render markdown content in quiz explanations
  - Alternative: dangerouslySetInnerHTML (unsafe) or plain text (no formatting)
  - Security: No known vulnerabilities
  - Maintenance: Active (last update 2 months ago)
  - Decision: ACCEPT (needed for safe markdown rendering)

zod:
  - Size: ~15KB
  - Purpose: Content schema validation
  - Alternative: Manual validation (error-prone) or Yup (already in project?)
  - Check: Is Yup already in project? (inspect repository)
  - If Yup present: REJECT, use existing
  - If no validation library: ACCEPT (necessary)
  - Decision: PENDING (check repository first)
```

---

### 12.3 Peer Dependency Verification

**Project LLM verifies:**
```
1. Check candidate's peerDependencies
2. Verify repository satisfies peer dependencies
3. Examples:
   - Candidate requires React 18+ → verify repository has React 18+
   - Candidate requires TypeScript 5+ → verify repository has TS 5+
4. If peer dependency NOT satisfied:
   - Minor version mismatch: ACCEPT WITH WARNING
   - Major version mismatch: STOP → Gate 2 (may need upgrade)
```

---

## 13. VERSIONING & COMPATIBILITY

### 13.1 Package Versioning

**Candidate package version format:**
```
[BlockName]-candidate-v[Major].[Minor]/
```

**Examples:**
- `InteractiveQuiz-candidate-v1.0/` — Initial handoff
- `InteractiveQuiz-candidate-v1.1/` — Revision after first rejection
- `InteractiveQuiz-candidate-v1.2/` — Revision after second rejection
- `InteractiveQuiz-candidate-v2.0/` — Major redesign after Gate 2 architecture change

**Versioning rules:**
- Increment minor (0.1) for bug fixes, small revisions
- Increment major (1.0 → 2.0) for architecture changes, major redesign
- Each resubmission should increment version

---

### 13.2 Handoff Protocol Version

**This contract version:** 1.0

**manifest.json declares:**
```json
{
  "packageVersion": "1.0"
}
```

**Purpose:**
- If Phase 0.5 evolves to V2 with different structure
- Project LLM can handle multiple handoff protocol versions
- Ensures forward/backward compatibility

**Compatibility:**
```
Phase 0.5 V1 (this contract):
  - Handles packageVersion: "1.0"
  
Phase 0.5 V2 (future):
  - Handles packageVersion: "1.0" (legacy)
  - Handles packageVersion: "2.0" (new format)
```

---

## 14. EVIDENCE PRESERVATION

### 14.1 Complete Evidence Chain

**The handoff package preserves:**

```
Original Requirement
        ↓
Phase 2: HTML Prototype
        ↓
Phase 3: Gate 1 Evidence (approval/rejection/conditions)
        ↓
Phase 4-5: React Candidate
        ↓
Phase 6: Handoff Package
        ↓
[Future] Phase 8: Production Adaptations
        ↓
[Future] Phase 19: Certification
```

**All stages preserved in evidence/ directory.**

---

### 14.2 Evidence Retention

**Handoff package MUST be retained:**

**During integration:**
- Candidate package immutable
- Referenced during repository audit
- Referenced during adaptation
- Referenced during verification

**After production:**
- Candidate package archived
- Part of block's permanent record
- Enables future audits
- Enables block evolution (v2, v3, etc.)

**Storage:**
```
docs/ubrc/blocks/[block-name]/history/
└── [BlockName]-candidate-v1.0.tar.gz (or .zip)
```

**Purpose:**
- Complete audit trail
- Can trace production block back to original prototype
- Can understand what External AI delivered vs what Project LLM adapted
- Enables learning: What patterns work? What patterns need fixing?

---

## 15. CROSS-CONTRACT DEPENDENCIES

### 15.1 Phase 0.1 Dependencies

**Phase 0.1 establishes:**
- External AI: Creates candidate (NO repository access)
- Project LLM: Integrates candidate (WITH repository access)

**Phase 0.5 enforces:**
- Candidate package delivered OUTSIDE repository
- External AI cannot write to repository
- Project LLM verifies and accepts handoff

**Consistency:** ✅ Aligned

---

### 15.2 Phase 0.2 Dependencies

**Phase 0.2 establishes:**
- Gate 1 (Prototype Approval) mandatory before Phase 4
- Gate 2 (Architecture Review) triggered by STOP conditions

**Phase 0.5 enforces:**
- Handoff cannot proceed without Gate 1 approval
- Architecture conflicts in handoff trigger Gate 2 STOP

**Consistency:** ✅ Aligned

---

### 15.3 Phase 0.3 Dependencies

**Phase 0.3 establishes:**
- Repository modification authority (Project LLM only)
- Prohibited zones (database schema, core services, etc.)

**Phase 0.5 enforces:**
- Candidate declares architectural needs in manifest
- Smuggled architecture attempts detected and rejected
- Architecture conflicts stop handoff and trigger Gate 2

**Consistency:** ✅ Aligned

---

### 15.4 Phase 0.4 Dependencies

**Phase 0.4 establishes:**
- Runtime boundaries (what blocks MAY/MUST NOT do)
- UBRC/ILS/LSNB/RSSB participation rules
- Prohibited operations (direct ILS calls, etc.)

**Phase 0.5 enforces:**
- Initial UBRC contract compliance check during handoff
- Code grep verification for prohibited patterns
- Architecture declaration in manifest

**Consistency:** ✅ Aligned

**Note:** Phase 0.4 Validation Audit qualifications carry forward:
- LSNB/RSSB details require Phase 7 verification
- ActiveBlockContext, hooks require Phase 7 verification
- React version requires Phase 7 verification

---

## 16. HANDOFF FAILURE MODES

### 16.1 Common Failure Patterns

**Pattern 1: Incomplete Self-Validation**
```
External AI submits handoff with failing tests
→ REJECT immediately
→ External AI must fix in Phase 5 and resubmit
```

**Pattern 2: Missing Critical Artifacts**
```
External AI submits handoff without tests or documentation
→ REJECT immediately
→ List missing artifacts
→ External AI completes Phase 5-6 properly and resubmits
```

**Pattern 3: Gate 1 Not Complete**
```
External AI submits handoff before Gate 1 approval
→ REJECT immediately
→ Direct back to Phase 3 (Gate 1)
→ Resubmit after approval
```

**Pattern 4: Smuggled Architecture**
```
External AI submits handoff with direct ILS calls or database access
→ Detect via code grep
→ REJECT or STOP (Gate 2) depending on severity
→ External AI must remove prohibited operations
```

**Pattern 5: False Manifest**
```
External AI sets manifest.runtime.requiresILSModification = false
BUT code contains ILS modifications
→ Detect via code inspection
→ REJECT for dishonest manifest
→ Require truthful manifest and either remove code or declare requirement
```

---

### 16.2 Escalation Criteria

**Escalate to Human when:**
- 3+ handoff rejections with persistent issues
- External AI unable to satisfy handoff requirements
- Architecture conflict requiring novel solution
- Ambiguous handoff status (unclear accept/reject)
- Candidate quality concerns (beyond technical completeness)

---

## 17. HANDOFF CHECKLIST SUMMARY

### 17.1 External AI Pre-Handoff Checklist

**Before submitting handoff package, External AI verifies:**

```
Phase 2-3 Complete:
[ ] Prototype created and functional
[ ] Gate 1 submitted and APPROVED (or CONDITIONAL APPROVE)
[ ] All Gate 1 conditions addressed (if conditional)

Phase 4-5 Complete:
[ ] React/TypeScript candidate complete
[ ] Content schema defined
[ ] Unit tests written and passing
[ ] Self-validation run and passed (lint/typecheck/test)
[ ] Test coverage adequate (≥70%)
[ ] UBRC contract implemented (data-block-id, data-block-type, block prop)
[ ] No prohibited operations (no direct ILS/LSNB/RSSB/database calls)
[ ] Accessibility preserved
[ ] Responsive behavior preserved

Phase 6 Complete:
[ ] Package directory structure created
[ ] All artifacts organized correctly
[ ] manifest.json generated and complete
[ ] handoff-report.md written
[ ] All required paths present
[ ] Checksums generated
[ ] Self-validation results included
[ ] Gate 1 evidence included

Package Verification:
[ ] Package structure matches Phase 0.5 specification
[ ] No missing critical artifacts
[ ] manifest.runtime section truthfully declares requirements
[ ] No smuggled architecture in code
[ ] Package completeness ≥95%
```

---

### 17.2 Project LLM Handoff Verification Checklist

**When receiving handoff package, Project LLM verifies:**

```
Package Structure:
[ ] Root directory exists: [BlockName]-candidate-v[X.Y]/
[ ] manifest.json present and valid JSON
[ ] handoff-report.md present and complete
[ ] All 11 required subdirectories present

Manifest Validation:
[ ] packageVersion: "1.0"
[ ] candidate.name, type, version defined
[ ] lifecycle.gate1Status = "APPROVED" or "CONDITIONAL_APPROVE"
[ ] lifecycle.gate1Date and gate1Approver present
[ ] artifacts section complete
[ ] runtime section complete (all requiresX flags defined)
[ ] ubrcMetadata complete
[ ] handoff.completeness = "complete"
[ ] handoff.readyForProjectLLM = true

Artifact Presence:
[ ] prototype/index.html exists
[ ] react/[BlockName].tsx exists
[ ] react/[BlockName].types.ts exists
[ ] react/[BlockName].test.tsx exists
[ ] schema/content-schema.ts exists
[ ] tests/ directory with results
[ ] accessibility/ evidence complete
[ ] responsive/ evidence complete
[ ] documentation/ complete (API, INTEGRATION-NOTES)
[ ] self-validation/ results present
[ ] evidence/gate-1-decision.md present

Self-Validation:
[ ] Lint: PASSED
[ ] Typecheck: PASSED
[ ] Tests: PASSED (≥70% coverage)

Gate 1:
[ ] Gate 1 approved
[ ] If conditional: all conditions addressed

Architecture:
[ ] runtime.requiresDatabaseSchema = false (or STOP if true)
[ ] runtime.requiresILSModification = false (or STOP if true)
[ ] runtime.requiresLSNBModification = false (or STOP if true)
[ ] runtime.requiresRSSBModification = false (or STOP if true)
[ ] dependencies.newDependencies evaluated (ACCEPT/WARN/STOP)

UBRC Contract (Initial):
[ ] data-block-id present in code
[ ] data-block-type present in code
[ ] block prop accepted
[ ] No recordBlockCompletion calls (grep verification)
[ ] No direct database imports (grep verification)
[ ] No prohibited patterns (grep verification)

Decision:
[ ] ACCEPT / ACCEPT WITH WARNINGS / REJECT / STOP (Gate 2)
```

---

## 18. STATUS & NEXT PHASE

**This contract is now FROZEN and governs handoff from External AI → Project LLM.**

**Next Contract:** Phase 0.6 — Evidence & Certification Contract

**Phase 0.6 should define:**
- What evidence must be collected during each lifecycle phase
- Evidence format and storage
- Certification criteria
- Audit trail requirements
- Evidence completeness verification
- Certification report structure

---

## APPENDIX A: QUICK REFERENCE

### Handoff Decisions

| Condition | Decision | Next Step |
|-----------|----------|-----------|
| Complete package, no issues | ACCEPT | Phase 7 (Repository Audit) |
| Complete package, minor warnings | ACCEPT WITH WARNINGS | Phase 7 (Repository Audit) |
| Missing artifacts, failed validation | REJECT | External AI revises, resubmit |
| Gate 1 not approved | REJECT | Complete Gate 1 first |
| Architecture conflict declared | STOP | Gate 2 (Architecture Review) |
| Smuggled architecture detected | REJECT or STOP | Fix or Gate 2 |

---

### Architecture Conflict Triggers

| manifest.json Flag | Value | Action |
|--------------------|-------|--------|
| requiresDatabaseSchema | true | STOP → Gate 2 |
| requiresILSModification | true | STOP → Gate 2 |
| requiresLSNBModification | true | STOP → Gate 2 |
| requiresRSSBModification | true | STOP → Gate 2 |
| requiresAuthModification | true | STOP → Gate 2 |
| newDependencies | non-empty (major) | Evaluate → possibly STOP |

---

### Required Artifacts Checklist

| Artifact | Critical? | Purpose |
|----------|-----------|---------|
| manifest.json | ✅ Critical | Package metadata |
| handoff-report.md | ✅ Critical | Human-readable summary |
| prototype/ | ✅ Important | Original prototype evidence |
| react/[BlockName].tsx | ✅ Critical | Main component |
| react/[BlockName].types.ts | ✅ Important | TypeScript types |
| react/[BlockName].test.tsx | ✅ Important | Unit tests |
| schema/content-schema.ts | ✅ Critical | Content schema |
| tests/ | ✅ Important | Test results |
| accessibility/ | ✅ Important | A11y evidence |
| responsive/ | ✅ Important | Responsive evidence |
| documentation/ | ✅ Important | API, integration notes |
| self-validation/ | ✅ Important | Lint/typecheck/test results |
| evidence/gate-1-decision.md | ✅ Critical | Gate 1 approval |

---

## APPENDIX B: EXAMPLE MANIFEST

**Complete example for reference:**

```json
{
  "packageVersion": "1.0",
  "candidate": {
    "name": "InteractiveQuiz",
    "version": "Q4",
    "type": "interactive-quiz",
    "description": "Interactive quiz block with immediate feedback and scoring",
    "author": "External AI (ChatGPT 4.0)",
    "created": "2026-09-30T14:30:00Z"
  },
  "lifecycle": {
    "phase2Complete": true,
    "phase3Complete": true,
    "phase4Complete": true,
    "phase5Complete": true,
    "gate1Status": "APPROVED",
    "gate1Date": "2026-09-30T10:00:00Z",
    "gate1Approver": "Jane Smith"
  },
  "artifacts": {
    "prototype": {
      "present": true,
      "path": "prototype/",
      "entrypoint": "prototype/index.html"
    },
    "react": {
      "present": true,
      "path": "react/",
      "mainComponent": "react/InteractiveQuiz.tsx",
      "testFile": "react/InteractiveQuiz.test.tsx"
    },
    "schema": {
      "present": true,
      "path": "schema/",
      "contentSchema": "schema/content-schema.ts"
    },
    "tests": {
      "present": true,
      "path": "tests/",
      "unitTests": 15,
      "coverage": 89
    },
    "accessibility": {
      "present": true,
      "path": "accessibility/",
      "wcagLevel": "AA"
    },
    "responsive": {
      "present": true,
      "path": "responsive/",
      "breakpoints": ["mobile", "tablet", "desktop"]
    },
    "documentation": {
      "present": true,
      "path": "documentation/"
    },
    "selfValidation": {
      "present": true,
      "path": "self-validation/",
      "lintPassed": true,
      "typecheckPassed": true,
      "testsPassed": true
    },
    "evidence": {
      "present": true,
      "path": "evidence/",
      "gate1Evidence": true
    }
  },
  "dependencies": {
    "react": "^18.0.0",
    "newDependencies": [],
    "peerDependencies": []
  },
  "ubrcMetadata": {
    "progressRole": "instructional",
    "expectedTimeSec": 120,
    "completionCriteria": "User submits quiz answer and receives feedback"
  },
  "runtime": {
    "requiresBackendAPI": false,
    "requiresExternalAPI": false,
    "requiresDatabaseSchema": false,
    "requiresILSModification": false,
    "requiresLSNBModification": false,
    "requiresRSSBModification": false,
    "requiresAuthModification": false
  },
  "handoff": {
    "completeness": "complete",
    "readyForProjectLLM": true,
    "knownLimitations": []
  },
  "checksum": {
    "algorithm": "sha256",
    "value": "a1b2c3d4e5f6..."
  }
}
```

---

**Document Metadata:**
- Version: V1
- Frozen Date: 2026-09-30
- Lifecycle Phase: 0.5 (Governance)
- Authority: Human Architecture Authority
- Replaces: None (initial version)
- Referenced By: Phase 0.1, 0.2, 0.3, 0.4, Phase 6 (Handoff), Phase 7 (Repository Audit)

**STATUS: FROZEN**
