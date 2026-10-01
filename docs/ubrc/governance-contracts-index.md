# Governance Contracts Index

**Last Updated:** 2026-10-01  
**Status:** This index is the authoritative source of contract version relationships for Phase 0 governance framework  
**Authority:** Established per Phase 0.10 Contract Versioning & Evolution Contract V1

---

## PURPOSE

This index maintains the authoritative registry of all governance contracts within the Phase 0 framework, including their current versions, lifecycle states, and version relationships.

Per Phase 0.10 Part 9, this registry is used to:
- Identify the EFFECTIVE (current authoritative) version of each contract
- Record supersession relationships between versions
- Track lifecycle state transitions
- Resolve contract dependencies

---

## PHASE 0 GOVERNANCE FRAMEWORK

### Current Contract Registry

| Number | Subject | Latest Version | Status | Frozen | Supersedes | Superseded By | EFFECTIVE |
|--------|---------|----------------|--------|--------|------------|---------------|-----------|
| 0.1 | AI Roles & Responsibility | V1 | FROZEN | 2026-09-29 | — | — | YES |
| 0.2 | Human Approval | V1 | FROZEN | 2026-09-29 | — | — | YES |
| 0.3 | Repository Modification | V1 | FROZEN | 2026-09-29 | — | — | YES |
| 0.4 | Runtime Boundary | V1 | FROZEN | 2026-09-29 | — | — | YES |
| 0.5 | Handoff Protocol | V1 | FROZEN | 2026-09-29 | — | — | YES |
| 0.6 | Evidence & Certification | V1 | FROZEN | 2026-09-29 | — | — | YES |
| 0.7 | Validation & Testing | V1 | FROZEN | 2026-09-30 | — | — | YES |
| 0.8 | STOP Conditions | V1 | FROZEN | 2026-09-30 | — | — | YES |
| 0.9 | Rollback & Recovery | V1 | FROZEN | 2026-09-30 | — | — | YES |
| 0.10 | Contract Versioning & Evolution | V1 | FROZEN | 2026-10-01 | — | — | YES |

---

## CONTRACT FILES

### Phase 0.1: AI Roles & Responsibility
- **File:** `PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-29
- **Governs:** Actor authority boundaries, responsibility assignment, capability classification

### Phase 0.2: Human Approval
- **File:** `PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-29
- **Governs:** Approval gates, Human Architecture Authority decision rights

### Phase 0.3: Repository Modification
- **File:** `PHASE-0.3-REPOSITORY-MODIFICATION-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-29
- **Governs:** Git-based modification, checkpoint mechanism, historical preservation

### Phase 0.4: Runtime Boundary
- **File:** `PHASE-0.4-RUNTIME-BOUNDARY-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-29
- **Governs:** Governance vs runtime separation, capability model

### Phase 0.5: Handoff Protocol
- **File:** `PHASE-0.5-HANDOFF-PROTOCOL-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-29
- **Governs:** Package handoff between External AI and Project LLM, completeness thresholds

### Phase 0.6: Evidence & Certification
- **File:** `PHASE-0.6-EVIDENCE-AND-CERTIFICATION-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-29
- **Governs:** Evidence maturity levels (DECLARED → CERTIFIED), certification authority

### Phase 0.7: Validation & Testing
- **File:** `PHASE-0.7-VALIDATION-AND-TESTING-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-30
- **Commit:** fba6f2a3
- **Governs:** 9 validation levels (L0-L8), testing methodology

### Phase 0.8: STOP Conditions
- **File:** `PHASE-0.8-STOP-CONDITIONS-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-30
- **Commit:** 4161d8e0
- **Governs:** STOP taxonomy (11 states), escalation procedures

### Phase 0.9: Rollback & Recovery
- **File:** `PHASE-0.9-ROLLBACK-AND-RECOVERY-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-09-30
- **Commit:** 9176c510
- **Governs:** Rollback scope, governance, "Historical Truth Is Immutable" principle

### Phase 0.10: Contract Versioning & Evolution
- **File:** `PHASE-0.10-CONTRACT-VERSIONING-EVOLUTION-CONTRACT-V1.md`
- **Status:** FROZEN (EFFECTIVE)
- **Frozen:** 2026-10-01
- **Commit:** {to be recorded after freeze commit}
- **Governs:** Contract identity model, lifecycle states, versioning semantics, erratum protocol, supersession model, dependency management, migration procedures

---

## DEPENDENCY RELATIONSHIPS

### Phase 0.10 Dependencies
Phase 0.10 V1 depends on:
- Phase 0.1 V1 (exact)
- Phase 0.2 V1 (exact)
- Phase 0.3 V1 (exact)
- Phase 0.4 V1 (exact)
- Phase 0.5 V1 (exact)
- Phase 0.6 V1 (exact)
- Phase 0.7 V1 (exact)
- Phase 0.8 V1 (exact)
- Phase 0.9 V1 (exact)

### Other Dependencies
- Phase 0.6 V1 depends on Phase 0.1 V1, Phase 0.5 V1
- Phase 0.7 V1 depends on Phase 0.6 V1
- Phase 0.8 V1 depends on Phase 0.1 V1, Phase 0.2 V1, Phase 0.7 V1
- Phase 0.9 V1 depends on Phase 0.1 V1, Phase 0.2 V1, Phase 0.3 V1, Phase 0.8 V1

---

## PHASE 0 STATUS

**Framework Status:** COMPLETE

**Total Contracts:** 10 (Phase 0.1 through Phase 0.10)

**All Contracts Frozen:** YES (as of 2026-10-01)

**All Contracts EFFECTIVE:** YES (no superseded versions exist)

**Governance Framework Operational:** YES

---

## VERSIONING NOTES

Per Phase 0.10 Contract:
- **EFFECTIVE** means: `(status = FROZEN) AND (supersededBy = null)`
- A contract number MAY temporarily have NO EFFECTIVE VERSION if its latest frozen version is DEPRECATED or REVOKED with no replacement
- When V2 of any contract is frozen, this index will be updated to show V1 → SUPERSEDED BY V2, V2 → EFFECTIVE
- Historical versions (SUPERSEDED, DEPRECATED, ARCHIVED) are retained in this index for audit trail

---

## MAINTENANCE

**Updated By:** Project LLM (on behalf of Human Architecture Authority)  
**Update Triggers:** Contract frozen, contract superseded, contract deprecated, contract archived, contract revoked  
**Authority:** Phase 0.10 V1 Part 9 — Governance Contracts Index

---

**End of Governance Contracts Index**

