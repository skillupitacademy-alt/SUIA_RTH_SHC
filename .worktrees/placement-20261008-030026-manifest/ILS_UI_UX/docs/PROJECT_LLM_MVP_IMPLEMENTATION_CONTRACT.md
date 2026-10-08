# PROJECT LLM MVP IMPLEMENTATION CONTRACT

**Document Type:** MVP Contract  
**Status:** READY_FOR_HUMAN_APPROVAL  
**Date:** 2026-10-05  
**Milestone:** M0 — Architecture / Governance Reconciliation  

---

## 1. MVP Goal

The Project LLM MVP proves one complete, evidence-backed engineering workflow:

```text
Introduction I1 reference
    ↓
Introduction I2 candidate
    ↓
CERTIFICATION_READY
    ↓
HAA Gate 2 decision
```

The MVP proves the workflow, not all families and not all versions.

---

## 2. MVP Scope

The MVP includes:

- Repository Discovery architecture and later implementation
- I1 repository evidence
- I2 creation brief
- external AI prototype workflow
- Gate 1 human approval
- candidate package intake
- candidate audit
- revision loop
- integration plan
- human implementation approval
- controlled integration
- verification
- evidence package
- `CERTIFICATION_READY`
- Gate 2 HAA decision

---

## 3. MVP Out Of Scope

The MVP excludes:

- all-family rollout
- all 133 documented versions
- SummaryBlock as the first pilot
- vector database
- fine tuning
- multi-agent swarm
- Kubernetes/distributed microservices
- autonomous repository commits/pushes
- autonomous certification
- Composer replacement
- renderer/runtime replacement
- UBRC/ILS/LSNB/RSSB infrastructure redesign
- LLM provider dependency
- Repository Discovery implementation during M0
- Agent F-M runtime implementation during M0

---

## 4. MVP Lifecycle Contract

```text
REQUESTED
    ↓
DISCOVERY
    ↓
BRIEF_READY
    ↓
AWAITING_GATE_1
    ↓
GUI_APPROVED
    ↓
CANDIDATE_REQUESTED
    ↓
CANDIDATE_RECEIVED
    ↓
CANDIDATE_AUDIT
    ↓
REVISION_REQUIRED ──→ CANDIDATE_RECEIVED
    ↓
INTEGRATION_PLANNED
    ↓
AWAITING_IMPLEMENTATION_APPROVAL
    ↓
IMPLEMENTATION_APPROVED
    ↓
IMPLEMENTING
    ↓
IMPLEMENTED
    ↓
VERIFYING
    ↓
CERTIFICATION_READY
    ↓
AWAITING_GATE_2
    ↓
CERTIFIED / REJECTED
```

Control/exception states:

```text
BLOCKED
ESCALATED
STOPPED
```

---

## 5. Required MVP Evidence

The MVP must eventually produce evidence for:

- repository snapshot commit/revision
- I1 reference evidence
- I2 brief evidence
- Gate 1 approval
- candidate package manifest
- candidate file hashes
- audit findings
- integration plan
- implementation approval
- verification run
- verification result
- evidence artifact
- Gate 2 decision

---

## 6. M0 Boundary

M0 does not implement this MVP. M0 freezes this contract.

M0 output status:

```text
MVP contract: READY_FOR_HUMAN_APPROVAL
Next milestone: M1 Repository Discovery Engine
Automatic continuation: NO
```

---

## 7. Current Component Classification

| Component | Status | Notes |
|---|---|---|
| Project LLM admin shell | IMPLEMENTED | Existing workbench route/UI |
| Agent C domain contracts | IMPLEMENTED | Project LLM TypeScript contract surface exists |
| Agent D repository intelligence | IMPLEMENTED | Static fixture only; not real discovery |
| Agent E creation brief engine | IMPLEMENTED | Deterministic brief engine foundation |
| Repository Discovery Engine | PLANNED | M1, not M0 |
| External AI handoff engine | PLANNED | Agent F, not M0 |
| Candidate Intake Engine | PLANNED | Agent G, not M0 |
| Candidate Audit / Compliance Engine | PLANNED | Agent H, not M0 |
| Correction Engine | PLANNED | Agent I, not M0 |
| Integration Planner | PLANNED | Agent J, not M0 |
| Verification / Evidence Engine | PLANNED | Agent K, not M0 |
| Certification package workflow | PLANNED | Agent L, not M0 |
| Workflow coordinator skeleton | IMPLEMENTED | Stubs exist; Agent F-M engines not implemented |
| Optional LLM | OPTIONAL | Advisory only, deferred |
| Old Phase 1B generation service | DEFERRED | Subordinate/optional capability |

