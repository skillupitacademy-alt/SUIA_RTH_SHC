# Project LLM Frontend + Backend Alignment Audit

Date: 2026-10-07

## Scope

Code-level audit of the Project LLM frontend branch `project-ai-gui` and Project AI/FastAPI backend branch `m2-project-ai-foundation`, focused on the architecture agreed in the conversation:

- User selects block family + explicit target version.
- Project LLM derives the common canonical Tutorial Block architecture from repository evidence, including I1/C1/D1.
- Project LLM emits a self-contained implementation package for an external AI that has no prior project knowledge.
- External AI creates prototype and implementation candidate.
- Project LLM receives the candidate, validates it, compares it to canonical repository evidence, plans canonical placement, obtains human approval, places it, refreshes discovery/evidence, verifies Composer/runtime/browser/brand/theme, and only then certifies.
- A certified block must become a real Tutorial Composer block and participate in the existing Tutorial Engine runtime rather than implementing duplicate ILS/LSNB/RSSB systems.

This is a Project LLM-specific code audit; it is not a claim that every unrelated repository file was reviewed line-by-line.

## Result

- PASS: 0
- PARTIAL: 10
- FAIL: 14

Overall: **NOT READY for the agreed end-to-end architecture.**

The strongest implemented foundations are:
1. TypeScript discovery/evidence snapshot boundary.
2. FastAPI candidate intake/comparison/manifest/placement APIs.
3. Real `CanonicalComparator` implementation.
4. Real certification gate executor modules.
5. Real runtime/browser verification modules.
6. Human approval API with manifest-hash and self-approval protections.
7. I1/C1/D1 reference-pattern fixtures.

The critical problem is **wiring and authority**, not absence of every individual capability. Several real modules exist but the canonical DAG still routes through stubs, while the frontend remains a static prototype and is not connected to FastAPI.

## Highest-priority blockers

### P0-1 — External AI handoff is not yet a real repository-derived contract

`projectLlmCreationBrief.ts` and the External AI page provide a useful conceptual checklist, but the handoff is static/generic. It does not dynamically synthesize a self-contained implementation package from the actual selected family/version and live repository evidence.

This is the biggest mismatch with the agreed architecture.

The external AI must not be expected to understand "I1/C1/D1". Project LLM must translate those references into exact implementation instructions, types, schemas, renderer/registry/Composer integration, theme/brand behavior, runtime participation, and acceptance tests.

### P0-2 — Frontend is not connected to FastAPI

The audited Project LLM pages contain no `fetch`/`axios` calls. Workflow state is held in `localStorage`, and validation/certification screens contain hard-coded results.

Therefore the GUI is not currently a view/control surface over the canonical backend.

### P0-3 — Canonical Agent 7/12/13/14 wiring is still stubbed

`agent_coordinator.py` explicitly returns:
- canonical comparison = stub
- certification controller = all PASS stub
- runtime verification = stub
- browser verification = stub

Real implementations exist elsewhere, but the canonical 15-agent execution path does not yet use them.

### P0-4 — Candidate target version is not preserved end-to-end

The candidate model does not carry the intended target family/version. Classification is heuristic, and the REST manifest route hard-codes `blockVersion="1.0.0"`.

That means Project LLM cannot yet prove:

> "This uploaded candidate is the exact O1/I7/etc. candidate that the user requested."

### P0-5 — Multiple workflow authorities remain

The backend has the 15-agent DAG, but `WorkflowEngine` still defines a second generic lifecycle, and the frontend has `projectLlmWorkflowCoordinator.ts`.

The agreed architecture requires one canonical backend workflow authority.

### P0-6 — Legacy Mix & Match creation workflow remains

`CreationMode.MIX_AND_MATCH` and `/creation` still implement an independent creation workflow. This conflicts with the agreed decision that Mix & Match is not a separate Project LLM creation authority.

## Architectural conclusion

The current repository is best classified as:

**Strong M2 foundation + substantial real verification modules + prototype GUI + incomplete canonical wiring.**

It is **not yet** the complete system in which an outside AI can receive a self-contained Project LLM implementation contract and return a candidate that Project LLM can deterministically/evidentially turn into a certified Tutorial Composer block.

## Recommended implementation order

1. Freeze the agreed canonical lifecycle and remove/reduce secondary workflow authorities.
2. Build backend `CandidateBlockEngineeringContract` generation for selected family/version.
3. Make that contract repository-derived from canonical implementations/contracts; I1/C1/D1 are evidence inputs, not instructions to External AI.
4. Add explicit target family/version to workflow and candidate models.
5. Wire Agent 7 to `CanonicalComparator`.
6. Wire Agent 12 to real `CertificationGateExecutor`.
7. Wire Agents 13/14 to real runtime/Playwright verification.
8. Wire Agent 15 to `FinalGateAgent`.
9. Implement exact ILS/LSNB/RSSB contract discovery and verification from canonical repository sources.
10. Connect frontend to FastAPI using typed contracts.
11. Remove hard-coded PASS/CERTIFIED UI states.
12. Enforce canonical artifact search/update/extend/reuse policy.
13. Remove/reclassify legacy Mix & Match creation route.
14. Repair the full test suite only after canonical wiring is stable.
15. Add durable persistence before production certification.

## Important semantic rule

The new block should not independently recreate ILS, LSNB or RSSB.

It should be **implemented according to the common canonical Tutorial Block architecture used by I1/C1/D1**, which makes it a first-class participant in the existing project runtime/theme/Composer ecosystem. Project LLM must provide those exact project-specific rules to the external AI and later verify them against repository evidence.

