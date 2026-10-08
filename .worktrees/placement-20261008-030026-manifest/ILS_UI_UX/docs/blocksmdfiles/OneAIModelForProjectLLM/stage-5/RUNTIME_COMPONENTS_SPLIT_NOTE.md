# Runtime Components Evidence — Split Document Note

**Date:** 2026-10-02  
**Action:** Document restructuring from monolithic to focused evidence files

---

## Governance Principle

**The historical raw document preserves what was recorded during the investigation. The split Stage 5 documents represent the current authoritative interpretation of verified evidence.**

This prevents stale statements (e.g., "telemetry persistence pending") from contaminating authoritative documents.

---

## Historical Context

The original `RUNTIME_COMPONENTS_EVIDENCE.md` (2,263 lines) contained mixed evidence domains:
- Runtime providers (Phase A)
- Completion chain (Phase B)  
- Data acquisition (Phase C)
- Telemetry persistence (T1, T2)

This file has been preserved in `historical/` as raw audit evidence and split into focused Stage 5 documents.

---

## New Structure

| Document | Content | Status |
|---|---|---|
| **06A_RUNTIME_PROVIDERS.md** | ActiveBlockContext, BlockTelemetryProvider, InstructionalBlockCompletionOrchestrator, LearningProgressSidebar | ✅ COMPLETE |
| **06B_COMPLETION_AND_PROGRESS_RUNTIME.md** | Phase B: completion chain (client → API → service → repository → database) | ⏳ EXTRACTION PENDING |
| **06C_TELEMETRY_VISIT_PERSISTENCE.md** | T1: block-visit route → service → repository → block_learning_state | ⏳ EXTRACTION PENDING |
| **06D_TELEMETRY_ACTIVE_TIME_PERSISTENCE.md** | T2: block-active-time route → transaction → event ledger → state upsert | ⏳ EXTRACTION PENDING |
| **06E_TELEMETRY_AUTHORITY_AND_LEDGER.md** | T3: Authority boundaries, dual-ledger model, event/state relationships | ⏳ INVESTIGATION PENDING |

---

## Content Extraction Plan

### 06B_COMPLETION_AND_PROGRESS_RUNTIME.md
Extract from `historical/RUNTIME_COMPONENTS_EVIDENCE.md`:
- Section: `## PHASE B — COMPLETION CHAIN (COMPLETE)`
- Subsections: B.1 through B.9 (markBlockComplete → API route → service → repository → schema → concurrency → idempotency)
- **Skip:** B.10 (telemetry preview, superseded by T1/T2)

### 06C_TELEMETRY_VISIT_PERSISTENCE.md
Extract from `historical/RUNTIME_COMPONENTS_EVIDENCE.md`:
- Section: `## T1: Block Visit Persistence Chain`
- Subsections: T1.1 through T1.8 (API route → service → repository → SQL helpers → schema → tests)
- **Use:** Latest verified state (T1 marked COMPLETE in raw file)

### 06D_TELEMETRY_ACTIVE_TIME_PERSISTENCE.md
Extract from `historical/RUNTIME_COMPONENTS_EVIDENCE.md`:
- Section: `## T2: Block Active-Time Persistence Chain`
- Subsections: T2.1 through T2.8 (API route → service transaction → event ledger → state upsert → schemas → tests)
- **Use:** Latest verified state (T2 marked COMPLETE in raw file)

### 06E_TELEMETRY_AUTHORITY_AND_LEDGER.md
**New analytical document** (T3 investigation, not extraction):
- Authority boundary diagram
- Completion authority vs telemetry state authority vs event ledger authority
- Cross-API coordination (visit updates lastSessionId, active-time does not, completion updates both models)
- DTO construction combining models
- Lifecycle when block_learning_state is deleted/recreated
- Whether completion and telemetry can temporarily diverge
- Whether "dual ledger" is actually three distinct authority layers

**Do NOT simply copy T2.6** — T3 is new analysis synthesizing B/T1/T2 findings.

---

## Preservation

The original `RUNTIME_COMPONENTS_EVIDENCE.md` is **preserved** in `historical/` as raw audit source. The structured split documents are authoritative for Stage 5 evidence consumption.

---

## Stage 5 Index

`STAGE5_INDEX.md` references the new document structure with correct status labels:
- 06A: ✅ COMPLETE
- 06B/06C/06D: ⏳ EXTRACTION PENDING
- 06E: ⏳ INVESTIGATION PENDING
