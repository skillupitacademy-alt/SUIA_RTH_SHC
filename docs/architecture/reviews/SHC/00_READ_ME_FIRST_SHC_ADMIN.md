# READ ME FIRST — One Project Governance Standard / SHC Admin Verification Handoff v3

**Start here in EVERY Project AI session.** All governance decisions apply to **SHC + SUIA + RTH** and future modules; **this task** is limited to verifying SHC Admin.  
**Governance standard:** [PSEG-001 proposed v1.1](../01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md) (**working audit baseline, owner approval pending**).
**Current target:** `skillupitacademy-alt/SUIA_RTH_SHC`, branch `main`. Rediscover the actual full SHA and dirty paths at every checkpoint; never assume a fixed HEAD. **Historical audit provenance only:** `feature/project-llm-linux-worker` at `4207cb1ca11abc29ca263310f5a4d54b859cd77f`. Governance package added at `2640981f8c942d813fb9b48f67a93fa63fb0e04d`; missing files restored at `b14cabf3834f7684737d5dd54c0898f4fe74d97d`. Neither establishes the deployed image.
**Current operation:** developer-controlled Docker deployment to Hostinger; no student users, no required paid CI/CD. Hostinger deployed image is **not** confirmed to match the source SHA.  
**Acceptance remains NOT ACCEPTED. Historical source-only snapshot:** 62 criteria, **25 FAIL / 37 PENDING / 0 verified PASS** at the old audit SHA. The current ledger is seeded with 62 UNVERIFIED dispositions and no checked SHA; these are not 25 confirmed current defects.

## Why this handoff was revised

Earlier package supplied separate architecture, acceptance and workflow standards but did not clearly identify ONE parent document. **Version 3 retains the one project-wide governing standard at position 01 and expands it with API design architecture, authentication/authorization/authority, zero-trust controls and staged global scalability contracts. The older supporting documents remain detailed annexes.** Do not merge or invent a second architecture standard; do not create an alternative living checklist.

## Exact reading order (do not skip governing policy)

| Read | File | Authority / purpose |
|---|---|---|
| **00** | [00_READ_ME_FIRST_SHC_ADMIN.md](00_READ_ME_FIRST_SHC_ADMIN.md) | Entry, scope, order, do-not-modify rule |
| **01** | [01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md](../01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md) | **ONE project-wide governing architecture + engineering/audit/release policy** for every app and future module |
| 02 | [02_ProjectSoftwareArchitectureStandard.md](../02_ProjectSoftwareArchitectureStandard.md) | Detailed SHC/SUIA/RTH architecture annex |
| 03 | [03_ProjectServiceAcceptanceStandard.md](../03_ProjectServiceAcceptanceStandard.md) | Detailed universal, profile, security and release acceptance annex |
| 04 | [04_ProjectImplementationWorkflow.md](../04_ProjectImplementationWorkflow.md) | Detailed audit-first, remediation and local Docker gate workflow annex |
| 05 | [05_SHC_Admin_Architecture_Acceptance_Checklist_v1.md](05_SHC_Admin_Architecture_Acceptance_Checklist_v1.md) | Exact definition of 62 `SHCA-*` checks (not statuses) |
| 06 | [06_SHC_Admin_Phase1_Source_Audit_2026-11-08.md](06_SHC_Admin_Phase1_Source_Audit_2026-11-08.md) | Phase 1 source review **leads**, not executed test evidence |
| 07 | [07_SHC_Admin_Phase2_Deep_Source_Verification_2026-11-08.md](07_SHC_Admin_Phase2_Deep_Source_Verification_2026-11-08.md) | Deeper source review **leads**, not executed test evidence |
| 08 | [08_SHC_Admin_Evaluated_Checklist_v2_2026-11-08.md](08_SHC_Admin_Evaluated_Checklist_v2_2026-11-08.md) | Latest *previous* 62-criterion source status; not current-pass proof |
| 09 | [09_PROJECT_AI_TASK_SHC_ADMIN_READ_ONLY.md](09_PROJECT_AI_TASK_SHC_ADMIN_READ_ONLY.md) | Exact technical-verifier work order |
| **10** | [10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv](10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv) | **ONE living output ledger** (update this file only) |

When the task has too little model context, read **00 → 01 → 03 → 05 → 08 → 09 → 10** first and open only the prior source report portions directly relevant to the current finding; the model must still obey the complete policies, using the detailed annexes as needed.

## Conflict precedence and evidence

**User's explicit newer decision/approved ADR > project-wide PSEG-001 > detailed architecture annex > acceptance annex > workflow annex > app-specific checklist > historical audit report.** The last three docs can **add** detail, never override a universal safety gate. Current facts come from **actual checked-out source and real safe tests**; historical reports are not factual proof of current HEAD or deployed Hostinger code. Record conflicts, do not fix them silently. Status `PASS` requires required real verification, `FAIL` denotes demonstrated violation, `PENDING` means insufficient proof, `N/A` needs rationale. An authored test is not a successful test.

## Shared project roadmap (NOT the current execution task)

1. SHC Admin (current read-only verification).
2. SUIA Web (later separate audit using the same PSEG-001).
3. RTH Web (later separate audit using the same PSEG-001).
4. SUIA marketing website (later).
5. RTH marketing website (later).
6. Reconcile cross-app contracts; then audit/consolidate **existing** educational domains, beginning with enquiry, admission, batches, tutorial, assessment, mentoring, doubt solving, placement, experience letter and certification. Examine legacy `skillup-admin` and `realtutorialhub-admin` **within those service workstreams**, retain their brand admin UX, migrate each consumer safely, and delete only after explicit approval, parity testing and rollback.

## ONLY authorized work now — SHC Admin read-only verification

- Check exact Git SHA, working tree and safety of test DB config.
- Independently verify previous findings; trace SHC Admin page → component → BFF → backend → persistence where necessary.
- Test SHC Admin security, contracts, lint/types/build only in a safe environment; **never assume scripts run or tests pass**. Do not run DB-backed tests until isolated test DB and credentials established.
- Update the single [acceptance ledger](10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv) and one derived technical report; preserve prior reports/snapshots as historical evidence. This names the permitted audit outputs, not permission to edit production or to commit/push.
- Deliver **one** `SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md`, plus the updated ledger and redacted command outputs. Mark `NOT RUN` explicitly.
- **DO NOT** modify code, run live DB migrations, deploy, commit/push, consolidate enquiry/admission, delete legacy paths, modify cloud/CI, or switch to another app's audit without the owner's explicit separate authorization.

## Model handoff / cost control

Project AI can use an economical source-inspection model for first-pass checks and a stronger model only for disputed architecture/security/data issues. Models must work on **≤8 findings per checkpoint** and persist their evidence to the same ledger/report before continuing. This package is not a request for Sol/Argon or any other agent to autonomously refactor the project.

## One truth, not three chats

- **Owner:** decides what is approved, may commit this standard into the single Git repo.
- **Project AI verifier:** investigates source and safe tests, updates the one ledger, produces the one report.
- **ChatGPT architecture reviewer:** reviews those SAME files against PSEG-001; does not maintain a second competing status register.
- **Current canonical package location:** `docs/architecture/reviews/` for 01–04 and 11–12, and `docs/architecture/reviews/SHC/` for 00 and 05–10. Read tracked files directly from the checked-out Git revision; use pinned GitHub blob links when no checkout is available. The ZIP is transport history, not an alternate authority. Do not relocate/duplicate governance files during this audit.

**Definition of done for verification (not certification):** 62 rows tied to actual SHA and source/test evidence, every run and skipped run documented, and one report explicitly distinguishing confirmed violations, false positives, corrections and pending external checks. Certification only after mandatory PSEG gates pass; do not certify just because the investigation is complete.

## v3 architecture contract amendment

The sole umbrella policy in file 01 is now **proposed v1.1**. Its added §17 architecture-domain map (`PSEG-AR01..25`), §18 API design gates (`API-01..20`), §19 trust and authority distinctions, §20 worldwide capacity planning and §22 staged rollout are mandatory **audit reference criteria when applicable**. **Do not expand or renumber the existing 62-row SHC Admin ledger**: link the new contracts in the existing ledger notes and technical report. Global million-user scale is a future verified capacity claim, not a current certification or an instruction to deploy expensive infrastructure. Project-owner approval remains necessary before the new document supersedes working v1.0.

## Architecture reviewer feedback — 2026-11-08

This is a **document-package review**, not current-source verification or formal approval of PSEG-001. All 13 text/CSV files were read at local `main` `b14cabf3834f7684737d5dd54c0898f4fe74d97d`; all 12 original manifest entries matched local bytes. The four previously missing documents are present and tracked. Checklist/CSV both contain the same 62 unique IDs; original reports, requirement definitions and CSV classifications are preserved.

1. **Use real journeys as the unit of evidence.** Keep this package's page → component/hook → request → BFF → authoritative service → repository/store → visible outcome trace. Choose up to eight related findings per checkpoint, beginning with privileged page/session/API trust boundaries and then required authoring journeys. Source presence, folder placement, line count, test count, a single guard or one helper PASS is not acceptance of the whole journey. Preview/reference tooling is not automatically a required issuance feature; document the owner's intended product behavior before proposing a new service/table.
2. **Normalize ledger seed states during verification, not by assuming historical failure.** Existing `FAIL_SOURCE_REVERIFY` / `PENDING_REVERIFY` values are imported seed markers, not extra acceptance states. When a row is assessed, use only PASS / FAIL / PENDING / N/A in `current_acceptance_status`, preserve `historical_v2_status`, and set finding disposition independently. Untested/uninspected current behavior remains PENDING + UNVERIFIED. A historical defect can be RESOLVED_AT_NEW_SHA while acceptance remains PENDING for unexecuted runtime checks. Keep all 62 IDs and existing columns. Map owner, applicability, implementation maturity, PSEG/API clauses, risk, exceptions/expiry and evidence-log locations into notes/report where no dedicated column exists; do not silently omit required evidence or create another ledger.
3. **Do not map identifiers by number alone.** `SHCA-U11` refers to testing under annex U-11, whereas `PSEG-U11` is frontend UX and `PSEG-U12` is testing. Use full clause names. Write `PSEG-001 §13 G0–G5` for the new approval stages; those do not replace the existing W1–W3 foundation groups G1–G9. `API-01..20` in §18 and `PSEG-API01..20` elsewhere refer to the same clauses, not two sets of requirements. Preserve original TC/FND/RC-ID-01/BROWSER-01 meanings when linking prior evidence.
4. **Reconcile evidence relevance before disposition.** In historical 08/CSV, SHCA-F10 cites SHCA-010 (sidebar navigation) rather than directly supporting the layman-architecture page criterion; SHCA-F17 also cites SHCA-018 (certificate preview) although its criterion concerns tutorial publication to the learners. Recheck these links in the current audit and cite the actual relevant evidence. Do not rewrite the historical snapshots or automatically inherit their conclusion. A direct ORM import alone does not establish duplicate business authority: establish the accepted owner, rule/writer duplication, integrity and actual boundary violation. Do not mandate a new deployed service or a blanket soft-delete design without the domain policy.
5. **Apply scope and proposed-policy boundaries.** SHC Admin and directly required dependencies only now. Consumer contract checks needed to qualify SHC publication are allowed; they are not full SUIA/RTH audits. Marketing pages within SHC Admin are included, separate marketing-site audits are not. The owner's three-app scope and parked invitation/outbox work remain in force: the broad future roadmap is not present authorization. Do not use SHC logical ownership to merge brand accounts or grant memberships implicitly. Proposed v1.1 remains an audit reference, not an approved redesign or a reason to mark previously untested functionality FAIL solely because policy expanded.
6. **Make test safety explicit for every command.** Inspect actual scripts, setup hooks, env loading, provider access and build-time/static rendering before execution. Build and `test:security` may also reach dependencies; a name or NODE_ENV=test is not isolation proof. Use proven offline guards/controlled adapters for safe subsets, and isolated disposable SQL for physical tests only when authorized. Record runner configuration failures, skipped cases, actual counts and environment separately. Do not run broad scripts, migrations, synthetic account creation or live providers while auditing. No secret/token/account payloads in evidence.
7. **Keep acceptance and release distinct.** Reconcile accepted W1–W3 source fixes against the actual current SHA rather than declaring every old lead unresolved. An audit can finish with FAIL/PENDING; neither completion nor scope parking grants architecture acceptance, deployment or W4 approval. Exact image/runtime evidence is separate from Git source. No application/source audit, build, runtime, database or deployment check was executed in this document review.

**Next output:** the existing [09 technical work order](09_PROJECT_AI_TASK_SHC_ADMIN_READ_ONLY.md), the same [10 ledger](10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv), and `SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md` in this SHC folder. This feedback is guidance within the entry document, not a second standard, checklist or status register.
