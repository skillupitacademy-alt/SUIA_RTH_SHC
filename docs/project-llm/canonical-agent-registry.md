# Canonical Agent Registry ΓÇö M2.9 Project LLM

## Purpose

This registry defines all agents in the M2.9 multi-agent pipeline, their responsibilities, ownership boundaries, and execution wave assignments.

## Registry

### Backend Agents

| Agent ID | Name | Wave | Main Responsibility | Owner Files/Contracts | Status |
|----------|------|------|---------------------|------------------------|--------|
| B01 | Architecture Authority | W0 | Canonical lifecycle + authority reconciliation | `CanonicalWorkflowState`, workflow engine authority | Γ£à COMPLETE |
| B02 | Engineering Contract | W2 | Pre-implementation contract generation | Engineering contract schema, generation logic | PENDING |
| B03 | Repository Contract Intelligence | W2 | Derive I1/C1/D1/common runtime contract | Canonical reference parser, contract extractor | PENDING |
| B04 | Target Binding | W2 | Family/version/workflow/spec binding | Target binding logic, version resolution | PENDING |
| B05 | Candidate Intake | W3 | Candidate package + hash + target binding | Intake API, hash generation, metadata extraction | PENDING |
| B06 | Canonical Comparator | W3 | Wire real comparator | Comparison logic, diff generation, contract validation | PENDING |
| B07 | Placement | W3 | Manifest + canonical artifact policy | Placement manifest, file writing, snapshot creation | PENDING |
| B08 | Certification | W4 | Real certification gates | Certification orchestrator, evidence aggregation | PENDING |
| B09 | Runtime | W4 | Real runtime verification | Runtime test harness, execution validation | PENDING |
| B10 | Browser | W4 | Real Playwright verification | Playwright test suite, browser automation | PENDING |
| B11 | Final Gate | W4 | Real FinalGateAgent | Final approval logic, certification decision | PENDING |
| B12 | Governance | W2 | Durable/consistent approval authority | Approval state management, gate enforcement | PENDING |
| B13 | Legacy Cleanup | W5 | Remove/reclassify Mix & Match + secondary workflows | Legacy workflow cleanup, migration scripts | PENDING |
| B14 | Test/Evidence Harness | W1 | Machine-readable test/evidence ledger | Evidence JSONL writers, ledger schema, integration tests | ≡ƒöä IN PROGRESS |

### Frontend Agents

| Agent ID | Name | Wave | Main Responsibility | Owner Files/Contracts | Status |
|----------|------|------|---------------------|------------------------|--------|
| F01 | API Contract Client | W2 | Typed FastAPI client | OpenAPI client generation, type definitions | PENDING |
| F02 | Create/Brief | W3 | Real Family + Version ΓåÆ backend contract | Project creation UI, brief display | PENDING |
| F03 | External AI Handoff | W3 | Render/download/copy backend contract | Contract display, export UI | PENDING |
| F04 | Candidate Upload | W3 | Real upload + backend validation | Upload UI, file handling, progress display | PENDING |
| F05 | Certification UI | W4 | Real evidence/gate results | Evidence display, gate decision UI | PENDING |
| F06 | Workflow UI | W4 | Backend lifecycle/evidence display | Workflow state display, transition history | PENDING |

### Final Agents (Audit & Packaging)

| Agent ID | Name | Wave | Main Responsibility | Owner Files/Contracts | Status |
|----------|------|------|---------------------|------------------------|--------|
| Q01 | Backend Integration Auditor | W6 | Backend integration audit | Backend integration test suite, audit report | PENDING |
| Q02 | Frontend Integration Auditor | W6 | Frontend integration audit | Frontend integration test suite, audit report | PENDING |
| Q03 | End-to-End Certification Auditor | W6 | End-to-end certification audit | E2E test suite, certification audit report | PENDING |
| Q04 | GitHub Evidence Packager | W6 | GitHub evidence packaging | Evidence packaging script, GitHub PR template | PENDING |

## Wave Assignments

### Wave 0 ΓÇö Architecture Freeze
- **B01** (Architecture Authority) ΓÇö COMPLETE Γ£à

### Wave 1 ΓÇö Evidence Infrastructure
- **B14** (Test/Evidence Harness) ΓÇö IN PROGRESS ≡ƒöä

### Wave 2 ΓÇö Contract Generation (Backend Core)
Sequential dependencies:
1. **B03** (Repository Contract Intelligence) ΓÇö extracts canonical references
2. **B04** (Target Binding) ΓÇö depends on B03
3. **B02** (Engineering Contract) ΓÇö depends on B03 + B04
4. **B12** (Governance) ΓÇö parallel to above, establishes approval authority

Wait for API stability, then:
5. **F01** (API Contract Client) ΓÇö depends on backend API freeze

### Wave 3 ΓÇö Intake & Validation (Candidate Pipeline)
Backend agents (parallel after B02 complete):
- **B05** (Candidate Intake)
- **B06** (Canonical Comparator)
- **B07** (Placement)

Frontend agents (parallel after F01 complete):
- **F02** (Create/Brief)
- **F03** (External AI Handoff)
- **F04** (Candidate Upload)

### Wave 4 ΓÇö Certification & Verification
Backend agents (parallel):
- **B08** (Certification)
- **B09** (Runtime)
- **B10** (Browser)
- **B11** (Final Gate)

Frontend agents (parallel):
- **F05** (Certification UI)
- **F06** (Workflow UI)

### Wave 5 ΓÇö Legacy Cleanup
- **B13** (Legacy Cleanup) ΓÇö sequential cleanup and migration

### Wave 6 ΓÇö Final Audit
Sequential audit:
1. **Q01** (Backend Integration Auditor)
2. **Q02** (Frontend Integration Auditor)
3. **Q03** (End-to-End Certification Auditor)
4. **Q04** (GitHub Evidence Packager)

## Ownership Principles

1. **Exclusive file ownership**: Each agent owns specific files; no overlapping writes
2. **Contract ownership**: Each agent owns specific schemas/contracts
3. **Dependency awareness**: Agents only run when dependencies complete
4. **No architecture changes**: Only B01 may modify canonical workflow/state definitions
5. **Evidence required**: Every agent logs runs to `agent-runs.jsonl`

## Status Legend

- Γ£à **COMPLETE**: Agent work finished, tests passing, committed
- ≡ƒöä **IN PROGRESS**: Agent currently executing
- ΓÅ╕∩╕Å **BLOCKED**: Agent waiting on dependency completion
- Γ¥î **FAILED**: Agent execution failed, requires intervention
- **PENDING**: Agent not yet started

## References

- Architecture: `canonical-architecture.md`
- Workflow states: `canonical-workflow.md`
- Implementation status: `canonical-implementation-status.md`
- Evidence ledger: `evidence/README.md`
