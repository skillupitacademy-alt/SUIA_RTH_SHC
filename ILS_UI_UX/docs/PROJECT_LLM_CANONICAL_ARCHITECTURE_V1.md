# PROJECT LLM CANONICAL ARCHITECTURE V1

**Document Type:** Canonical Architecture Authority  
**Status:** READY_FOR_HUMAN_APPROVAL  
**Date:** 2026-10-05  
**Milestone:** M0 — Architecture / Governance Reconciliation  

---

## 1. Purpose

This document freezes the canonical Project LLM architecture for the SUIA/RTH tutorial block system.

It reconciles:

```text
ChatGptLLM_version_1.ipynb = foundational architecture blueprint
ChatGptLLM_version_2.ipynb = canonical operational architecture
A-M workflow roadmap        = bounded implementation capabilities
```

This document is an architecture/governance authority. It does not implement Repository Discovery, Candidate Intake, Candidate Audit, Integration, Verification, Evidence, or Agent F-M runtime behavior.

---

## 2. Canonical Definition

Project LLM is a repository-aware Block Engineering, Integration, Verification, and Certification-Readiness Workbench operating as a control plane alongside the existing SUIA/RTH platform.

Project LLM is not:

- a generic chatbot
- an autonomous coding agent
- a replacement for Tutorial Composer
- a replacement for TutorialDocument
- a replacement for the renderer
- a replacement for UBRC
- a replacement for ILS
- a replacement for LSNB
- a replacement for RSSB
- a final certification authority

---

## 3. Authority Boundaries

| Actor/System | Canonical Responsibility |
|---|---|
| Project LLM | Engineering control plane, repository discovery, brief generation, candidate intake, audit, integration planning, verification, evidence, certification readiness |
| External AI | Untrusted prototype and candidate creator |
| Tutorial Composer | Canonical authoring/persistence system |
| TutorialDocument | Canonical tutorial block document model |
| Tutorial Page / Renderer | Canonical learner rendering path |
| UBRC | Universal block runtime contract and DOM identity boundary |
| ILS | Passive learner/runtime observation path |
| LSNB | Learner navigation/progress consumer |
| RSSB | Runtime/progress/sidebar consumer |
| Human / HAA | Gate 1 approval, implementation exception approval, Gate 2 certification, infrastructure decisions |
| Optional LLM | Advisory reasoning only |

---

## 4. Canonical Engines

The canonical architecture preserves the Version 1 engines and realizes them through the Version 2 operational model:

| Engine | Responsibility |
|---|---|
| Discovery Engine | Produce repository snapshots and verified architecture facts |
| Brief Engine | Generate repository-grounded external-AI creation briefs |
| Intake Engine | Receive untrusted external AI artifacts and calculate manifests/provenance |
| Audit / Integration Engine | Audit candidates, generate correction findings, plan controlled integration |
| Verification Engine | Run deterministic checks and produce verification results |
| Evidence Engine | Record evidence artifacts and certification-readiness proof |
| Workflow / Governance Engine | Enforce lifecycle, gates, policy, STOP conditions, and human authority |

---

## 5. Canonical Lifecycle

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

Alternative/control states:

```text
BLOCKED
ESCALATED
STOPPED
```

No implementation may silently bypass `AWAITING_GATE_1`, `AWAITING_IMPLEMENTATION_APPROVAL`, or `AWAITING_GATE_2`.

---

## 6. Human Gates

### Gate 1 — Prototype Approval

Gate 1 is a human decision over the external AI prototype and learning interpretation.

```text
EXTERNAL_PROTOTYPE
    ↓
AWAITING_GATE_1
    ↓
APPROVE → GUI_APPROVED → CANDIDATE_REQUESTED
REJECT  → REVISION_REQUIRED / STOPPED
```

Candidate intake must not proceed without recorded Gate 1 approval.

### Implementation Approval

Integration planning must stop at:

```text
AWAITING_IMPLEMENTATION_APPROVAL
```

Project LLM may prepare plans and evidence, but protected repository integration requires an auditable approval.

### Gate 2 — Certification Decision

`CERTIFICATION_READY` is not `CERTIFIED`.

Only HAA may make the final certification decision:

```text
CERTIFICATION_READY
    ↓
AWAITING_GATE_2
    ↓
APPROVE → CERTIFIED
REJECT  → REJECTED
STOP    → STOPPED
```

Project LLM must never self-certify.

---

## 7. Engineering Run Lineage

Every Project LLM execution must be traceable through an Engineering Run:

```text
ENGINEERING_RUN
│
├── REPOSITORY_SNAPSHOT
├── CREATION_BRIEF
├── CANDIDATE_PACKAGE
│   ├── CANDIDATE_FILE[]
│   └── AUDIT_FINDING[]
├── APPROVAL_DECISION[]
├── POLICY_DECISION[]
├── WORKFLOW_EVENT[]
├── INTEGRATION_PLAN
├── VERIFICATION_RUN
│   └── VERIFICATION_RESULT[]
└── EVIDENCE_ARTIFACT[]
```

The Engineering Run is the traceability root. Current state is not a substitute for append-only workflow history.

---

## 8. Repository Snapshot Boundary

Repository Discovery is the next major foundation, but it is not implemented in M0.

The target Repository Snapshot must eventually capture:

```text
repository
commit SHA
repository revision / tree identity
discovery version
discovered facts
source paths
confidence: VERIFIED / INFERRED / UNKNOWN
discovery timestamp
```

All downstream briefs, candidate audits, integration plans, verification runs, and evidence packages must reference the repository state they used.

---

## 9. External AI Trust Boundary

External AI is an untrusted creator/courier.

It may create:

- HTML/CSS/JS/JSON prototype
- React/TypeScript candidate
- revised candidate artifacts

It must not be treated as authority over:

- Composer
- TutorialDocument
- renderer
- UBRC
- ILS
- LSNB
- RSSB
- schema authority
- repository modification
- certification

Project LLM must calculate its own candidate manifest and evidence rather than trusting external AI claims.

---

## 10. Optional LLM Boundary

An optional local/hosted LLM may later assist with:

- summarizing findings
- explaining failures
- drafting correction instructions
- classifying findings
- advisory reasoning

It must not override:

- policy
- deterministic validation
- evidence
- human approvals
- HAA certification

No LLM provider is required or authorized by M0.

---

## 11. A-M Implementation Mapping

| A-M Capability | Canonical Engine |
|---|---|
| Agent A/B — Workbench shell / UI | Workflow / Governance Engine |
| Agent C — Domain contracts | Workflow / Governance Engine |
| Agent D — Repository intelligence fixture | Discovery Engine, current static fixture only |
| Agent E — Creation Brief Engine | Brief Engine |
| Agent F — External AI handoff | Brief Engine / Workflow Engine |
| Agent G — Candidate intake | Intake Engine |
| Agent H — Compliance review | Audit / Integration Engine |
| Agent I — Correction instructions | Audit / Integration Engine |
| Agent J — Integration planner | Audit / Integration Engine |
| Agent K — Validation and evidence | Verification Engine / Evidence Engine |
| Agent L — Certification package | Evidence Engine / Workflow Engine |
| Agent M — Coordinator | Workflow / Governance Engine |

A-M is an implementation decomposition. It is not the canonical product architecture.

---

## 12. Contract Precedence

No lower-level document may redefine a higher-level architecture.

```text
PROJECT_LLM_CANONICAL_ARCHITECTURE_V1
    ↓
PROJECT_LLM_ARCHITECTURE_DECISION_RECORD
    ↓
Governance Contracts V1
    ↓
Existing Runtime Contracts
    ↓
Project LLM Workflow Contracts
    ↓
A-M Implementation Contracts
    ↓
Optional AI Provider Contracts
```

---

## 13. Phase 1B Reclassification

The old Phase 1B I1-generation service is preserved as a subordinate/optional generation capability.

It does not define Project LLM.

```text
Project LLM Canonical Workbench
    ↓
Optional/Subordinate Generation Capability
    ↓
Old Phase 1B I1-generation service
```

---

## 14. MVP Boundary

The first Project LLM MVP vertical slice is:

```text
Introduction I1 → Introduction I2
```

The MVP must not expand to all 18 families or 133 versions until the I1 → I2 workflow is proven.

---

## 15. M0 Stop Rule

M0 freezes architecture only.

M0 does not implement:

- Repository Discovery
- Agent F-M runtime engines
- candidate intake/audit/integration/verification
- database migrations
- LLM provider integration
- Composer/runtime/UBRC/ILS/LSNB/RSSB changes
- I2 production implementation

Status after M0:

```text
READY_FOR_HUMAN_APPROVAL
```

