# Canonical Workflow — M2.9 Project LLM

## Single Authority

This document defines the **canonical workflow state machine** established by **B01 (Architecture Authority)** in Wave 0.

All services (backend, frontend, workers) must use these states. No service may define a competing state machine.

## State Enumeration: CanonicalWorkflowState

```typescript
enum CanonicalWorkflowState {
  REQUESTED = "REQUESTED",
  DISCOVERY = "DISCOVERY",
  BRIEF_READY = "BRIEF_READY",
  AWAITING_GATE_1 = "AWAITING_GATE_1",
  GUI_APPROVED = "GUI_APPROVED",
  CANDIDATE_REQUESTED = "CANDIDATE_REQUESTED",
  CANDIDATE_RECEIVED = "CANDIDATE_RECEIVED",
  CANDIDATE_AUDIT = "CANDIDATE_AUDIT",
  INTEGRATION_PLANNED = "INTEGRATION_PLANNED",
  AWAITING_IMPLEMENTATION_APPROVAL = "AWAITING_IMPLEMENTATION_APPROVAL",
  IMPLEMENTING = "IMPLEMENTING",
  IMPLEMENTED = "IMPLEMENTED",
  VERIFYING = "VERIFYING",
  CERTIFICATION_READY = "CERTIFICATION_READY",
  AWAITING_GATE_2 = "AWAITING_GATE_2",
  CERTIFIED = "CERTIFIED",
  REJECTED = "REJECTED"
}
```

## State Transitions

### 1. REQUESTED
**Entry**: User submits family + version request
**Responsible Agent**: None (system initial state)
**Next**: `DISCOVERY`

### 2. DISCOVERY
**Entry**: B03 (Repository Contract Intelligence) begins canonical reference analysis
**Responsible Agents**: B03, B04 (Target Binding)
**Actions**:
- Parse I1, C1, D1 references
- Extract schema, renderer, composer, runtime contracts
- Bind family/version/workflow/spec
**Next**: `BRIEF_READY`

### 3. BRIEF_READY
**Entry**: B02 (Engineering Contract) completes self-contained contract generation
**Responsible Agent**: B02
**Actions**:
- Generate engineering contract
- Package all necessary context for external AI
**Next**: `AWAITING_GATE_1`

### 4. AWAITING_GATE_1
**Entry**: System presents GUI prototype contract to user
**Responsible Agent**: F02 (Create/Brief), F03 (External AI Handoff)
**Gate**: **HUMAN GATE 1 — GUI Approval**
**Actions**:
- Display contract to user
- Allow download/copy for external AI
- Wait for user approval or rejection
**Next**: `GUI_APPROVED` (if approved) or `REJECTED` (if rejected)

### 5. GUI_APPROVED
**Entry**: User approves GUI prototype contract at Gate 1
**Responsible Agent**: None (user decision)
**Next**: `CANDIDATE_REQUESTED`

### 6. CANDIDATE_REQUESTED
**Entry**: User begins working with external AI
**Responsible Agent**: External AI (outside system)
**Actions**:
- External AI generates HTML/CSS/JS/JSON prototype
- External AI generates React/TS implementation
**Next**: `CANDIDATE_RECEIVED`

### 7. CANDIDATE_RECEIVED
**Entry**: User uploads candidate package via F04 (Candidate Upload)
**Responsible Agent**: B05 (Candidate Intake)
**Actions**:
- Hash candidate
- Extract metadata
- Bind to target workflow
**Next**: `CANDIDATE_AUDIT`

### 8. CANDIDATE_AUDIT
**Entry**: B05 completes intake
**Responsible Agents**: B06 (Canonical Comparator), B07 (Placement), B14 (Evidence Harness)
**Actions**:
- Compare candidate to canonical contracts
- Validate structure
- Run initial tests
- Generate placement manifest
**Next**: `INTEGRATION_PLANNED`

### 9. INTEGRATION_PLANNED
**Entry**: B07 generates placement manifest
**Responsible Agent**: B07 (Placement)
**Actions**:
- Determine canonical artifact placement
- Generate integration plan
**Next**: `AWAITING_IMPLEMENTATION_APPROVAL`

### 10. AWAITING_IMPLEMENTATION_APPROVAL
**Entry**: System presents placement manifest to user
**Responsible Agent**: B12 (Governance)
**Gate**: **HUMAN GATE 2 — Implementation Approval**
**Actions**:
- Display placement manifest
- Display audit results
- Wait for user approval or rejection
**Next**: `IMPLEMENTING` (if approved) or `REJECTED` (if rejected)

### 11. IMPLEMENTING
**Entry**: User approves placement at Gate 2
**Responsible Agent**: B07 (Placement)
**Actions**:
- Execute placement according to manifest
- Write files to canonical locations
- Create snapshot
**Next**: `IMPLEMENTED`

### 12. IMPLEMENTED
**Entry**: Placement completes successfully
**Responsible Agent**: B07 (Placement)
**Next**: `VERIFYING`

### 13. VERIFYING
**Entry**: System begins verification
**Responsible Agents**: B08 (Certification), B09 (Runtime), B10 (Browser), B14 (Evidence)
**Actions**:
- Run composer tests
- Run renderer tests
- Run runtime verification
- Run browser/Playwright tests
- Run ILS/LSNB/RSSB tests
- Run theme/brand tests
- Log all results to evidence ledger
**Next**: `CERTIFICATION_READY`

### 14. CERTIFICATION_READY
**Entry**: All verification tests complete
**Responsible Agent**: B08 (Certification)
**Actions**:
- Aggregate test results
- Prepare certification evidence
**Next**: `AWAITING_GATE_2` (if manual approval required) or `CERTIFIED` (if auto-certifiable)

### 15. AWAITING_GATE_2
**Entry**: Certification requires manual review
**Responsible Agent**: B11 (Final Gate)
**Gate**: **FINAL GATE**
**Actions**:
- Display all evidence
- Present test results
- Wait for user certification or rejection
**Next**: `CERTIFIED` (if approved) or `REJECTED` (if rejected)

### 16. CERTIFIED
**Entry**: Block passes all gates and verification
**Responsible Agent**: B11 (Final Gate)
**Terminal State**: SUCCESS
**Actions**:
- Mark block as production-ready
- Write final evidence record
- Close workflow

### 17. REJECTED
**Entry**: User rejects at any gate, or critical failure occurs
**Responsible Agent**: B12 (Governance)
**Terminal State**: FAILURE
**Actions**:
- Log rejection reason
- Write final evidence record
- Close workflow

## State Transition Rules

1. **No state skipping**: States must transition in order (except for rejection)
2. **Gates are blocking**: Human gates halt all forward progress until decision
3. **Evidence required**: Every state transition must log to evidence ledger
4. **Rejection from any gate**: User can reject at AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, or AWAITING_GATE_2
5. **No parallel workflows**: One workflow instance per family+version request

## Frontend Consumption

Frontend components must:
- Query backend for current `CanonicalWorkflowState`
- Display state-appropriate UI
- Not maintain a separate state machine
- Not invent intermediate states
- Not skip or reorder states

## Backend Authority

Backend services must:
- Store state in single source of truth (workflow engine)
- Transition states only via defined rules
- Log every transition to `workflow-events.jsonl`
- Enforce gate blocking at API level

## References

- Architecture: `canonical-architecture.md`
- Agent registry: `canonical-agent-registry.md`
- Implementation status: `canonical-implementation-status.md`
