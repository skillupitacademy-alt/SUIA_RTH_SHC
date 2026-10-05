# PROJECT LLM ARCHITECTURE DECISION RECORD

**Document Type:** Architecture Decision Record  
**Status:** READY_FOR_HUMAN_APPROVAL  
**Date:** 2026-10-05  
**Milestone:** M0 — Architecture / Governance Reconciliation  

---

## PL-001 — Project LLM Is The Engineering Control Plane

**Decision:** Project LLM is the repository-aware Block Engineering, Integration, Verification, and Certification-Readiness control plane.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** Project LLM may coordinate discovery, briefs, intake, audit, integration planning, verification, evidence, and certification readiness. It may not replace the platform runtime or final human authority.

---

## PL-002 — Existing Tutorial Composer Remains Authoritative

**Decision:** Tutorial Composer remains the authoritative authoring and persistence path for tutorial block composition.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** Project LLM must integrate with Composer boundaries. It must not create a parallel Composer.

---

## PL-003 — External AI Is An Untrusted Candidate Creator

**Decision:** External AI creates prototypes and candidate artifacts, but its output is untrusted until Project LLM intake/audit/verification proves it.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** Candidate manifests, hashes, findings, and evidence must be calculated by Project LLM or repository tools, not accepted from external AI claims.

---

## PL-004 — Gate 1 Is Human-Controlled

**Decision:** Human approval is required after external AI prototype generation and before candidate implementation/intake proceeds.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** Candidate intake cannot bypass Gate 1. Project LLM must not approve its own prototype.

---

## PL-005 — Gate 2 / Final Certification Is HAA-Controlled

**Decision:** HAA controls final certification after `CERTIFICATION_READY`.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** `CERTIFICATION_READY` is a technical/evidence state. It is not certification.

---

## PL-006 — Project LLM Cannot Self-Certify

**Decision:** Project LLM cannot transition its own work from `CERTIFICATION_READY` to `CERTIFIED`.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** Certification requires an authenticated/auditable HAA decision.

---

## PL-007 — Agentic Execution Is Policy-Bounded

**Decision:** Engineering agents operate only through approved tool scopes, state transitions, policy checks, retry limits, verification, and STOP conditions.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** No agent may silently continue through policy violation, unknown architecture, protected resource changes, missing evidence, or retry exhaustion.

---

## PL-008 — Optional LLM Is Advisory Only

**Decision:** Optional local/hosted LLM capability may assist with reasoning, summarization, classification, and drafting, but cannot override deterministic validation, evidence, policy, or human decisions.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** M0 does not add LLM provider integration.

---

## PL-009 — Old Phase 1B I1 Generation Is Subordinate

**Decision:** The old narrow Phase 1B I1-generation service is preserved as an optional/subordinate capability. It is not the definition of Project LLM.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** Any prior document defining Project LLM only as an I1 generation service is superseded by the canonical workbench architecture.

---

## PL-010 — First Vertical Slice Is I1 → I2

**Decision:** The first MVP vertical slice is Introduction I1 reference to Introduction I2 candidate.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** SummaryBlock is not the first pilot unless HAA explicitly changes the MVP. The system must prove one end-to-end I1 → I2 run before all-family rollout.

---

## PL-011 — Repository Discovery Is The Next Major Foundation

**Decision:** Real Repository Discovery is the next major implementation foundation after M0.

**Status:** PROPOSED_FOR_HAA_APPROVAL

**Consequence:** M0 specifies Repository Discovery architecture/contract only. M0 does not implement Repository Discovery.

---

## PL-012 — M0 Correction Loop Policy

**Decision:** M0_APPROVED_WITH_CORRECTIONS verdict triggers mandatory state name corrections before M1 Repository Discovery. Critical corrections (blocking M1) are state names where the runtime diverges from M0 canonical specification. Recommended corrections improve canonical consistency. Critical corrections must be resolved before M1 begins; recommended corrections may be batched into an M0.1 alignment pass.

**Status:** ACCEPTED

**Consequence:** The M0 correction loop is a governance gate. Skipping critical corrections is a workflow violation. Recommended corrections that are deferred must be tracked as open work items in the next milestone planning.

**Date:** 2026-10-05

---

## Open Architecture Decisions

No new unresolved architecture conflict was silently resolved in M0.

The following remain intentionally deferred to M1 or later:

| ID | Decision | Status |
|---|---|---|
| OAD-001 | Exact Repository Discovery implementation technique | DEFERRED_TO_M1 |
| OAD-002 | Persistence/database schema for Engineering Run records | DEFERRED |
| OAD-003 | Optional LLM provider/model selection | DEFERRED |
| OAD-004 | Isolated integration worktree/sandbox mechanism | DEFERRED |

