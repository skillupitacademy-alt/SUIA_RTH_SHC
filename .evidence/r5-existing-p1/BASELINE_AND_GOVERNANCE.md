# R5 baseline and governance

13 November 2026. Branch `main`, HEAD `7f8c952a5a19b0e1ca04c4ed307b1a8c7abefc86`, clean working tree before this phase. Initial scoped hashes are in `baseline.json`. R4 is committed at this baseline. Running local services and the VPS are separate revision identities.

## Precedence and scope

The owner's latest R5 instruction authorizes corrections to existing hierarchy synchronization and authenticated authorization in SHC Admin, SUIA Web, RTH Web and their existing necessary dependencies. It overrides the historical read-only, SHC-only instructions in 00/09. PSEG-001 v1.1 remains proposed working governance. No new formal governance approval is inferred.

Attendance and payments are OWNER HOLD, including dedicated tests and backend dependencies. Marketing, broader accessibility/performance, tutorial content journeys, new capabilities, schema work, Docker, releases and Git commit/push are held. The canonical 62-row SHC CSV and original Q register are retained.

## Governing sources consulted

- `docs/architecture/reviews/SHC/00_READ_ME_FIRST_SHC_ADMIN.md`, precedence and reading order.
- `docs/architecture/reviews/01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md`, working governance, ownership, security, data, API, test and release gates.
- `docs/architecture/reviews/02_ProjectSoftwareArchitectureStandard.md`, architecture annex.
- `docs/architecture/reviews/03_ProjectServiceAcceptanceStandard.md`, evidence/status and applicable U/F/I/B gates.
- `docs/architecture/reviews/04_ProjectImplementationWorkflow.md`, safe implementation and quality workflow. The backslash in the pasted name is a formatting artifact.
- SHC `05_SHC_Admin_Architecture_Acceptance_Checklist_v1.md`, criterion definitions, particularly SHCA-U06/U07/U08/U09/U11, A02/A04/A07/A11, I01/I03 and D01/D02.
- SHC historical `06_SHC_Admin_Phase1_Source_Audit_2026-11-08.md`, `07_SHC_Admin_Phase2_Deep_Source_Verification_2026-11-08.md`, `08_SHC_Admin_Evaluated_Checklist_v2_2026-11-08.md` and `09_PROJECT_AI_TASK_SHC_ADMIN_READ_ONLY.md`, applicable historical authentication, hierarchy and API evidence leads.
- SHC `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`, canonical criterion identifiers/statuses. Its bytes are frozen in the baseline hash.
- `audit/FinalAechitecture.md`, applicable identity/isolation, modular ownership, error/recovery and evidence principles. The original audits/matrices are historical leads. Their scale/future-module proposals grant no R5 implementation authority.
- `.evidence/r3-acceptance-20261112/Q01_Q48_REGISTER.md` and `security-method-inventory.json`.
- SHC `SOL_R4_ACCEPTANCE_EVIDENCE_REVIEW_20261113.md` and `.evidence/r4-acceptance-20261112/APPROVED_CORRECTION_INVENTORY.md`, `OWNER_DECISIONS_REQUIRED.md`, `anonymous-method-matrix-results.json`, `backend-coordination-auth.json`, `hierarchy-sync-baseline-proof.json`, `gateway-device-binding-results.json`, `hierarchy-remote-results.json`, `quality-final-results.json` and `source-manifest.json`.
- Repository `AGENTS.md` requires scoped Graphify discovery and an AST refresh after code edits. R5 uses its existing graph without paid semantic extraction.

Historical documents retain their original findings and applicability. Current source, executed R5 tests and exact reused receipts establish current evidence. Attendance/payment R4 files are held in their committed state.

## File ownership

The root agent owns R5 evidence, the existing API hierarchy-sync implementation/tests and demonstrated in-scope authorization corrections only. No subagent was started. Before each implementation checkpoint, inspect Git status and preserve unexpected edits. Dedicated attendance/payment files have no R5 owner because they are held.

## Initial hierarchy contract trace

Commit `742c2f9414858670467f243579a372cc4aaa62db` removed `quizStatusUpdate` and the failed-status work queries because MainDB tables do not contain `tutorialSyncStatus`. The enum declaration alone does not supply a column or retry source. Existing admin create/update routes launch `HierarchySyncService.sync()` asynchronously. `syncAll()` is exposed through the existing protected bulk-sync endpoint. The signature-protected retry worker calls `retryFailed()`, whose current work list is empty. No durable failed-sync repository or current substitute registry was found in the scoped service, schemas, callers and deployment references.

The latest owner decision explicitly approves current-state reconciliation through the existing hierarchy service and signed worker. Historical job replay remains unavailable without its removed durable journal. R5 implements bounded source/target comparison and repair under the existing locks. Existing faculty code in these three apps may be inventoried, while creating a faculty service remains unauthorized. The separate faculty application remains outside this scope.

## Reading depth

00–05, the current ledger and focused R4 evidence govern this phase. Historical 06/07/08/09 and FinalAechitecture were consulted for applicable sections. CompleteProjectAudit and CompleteProjectMatrix are concatenated historical collections and were sampled for scope and evidence provenance, not exhaustively re-audited. The unavailable separately named original documents have no fabricated contents.
