# READ ME FIRST — One Project Governance Standard / SHC Admin Verification Handoff v3

**Start here in EVERY Project AI session.** All governance decisions apply to **SHC + SUIA + RTH** and future modules; **this task** is limited to verifying SHC Admin.  
**Governance standard:** `01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md` (**proposed v1 / working audit baseline, owner approval pending**).  
**Source reference:** `skillupitacademy-alt/SUIA_RTH_SHC`, `feature/project-llm-linux-worker`, prior audit SHA `4207cb1ca11abc29ca263310f5a4d54b859cd77f`. **Check actual `git rev-parse HEAD` before claims.**  
**Current operation:** developer-controlled Docker deployment to Hostinger; no student users, no required paid CI/CD. Hostinger deployed image is **not** confirmed to match the source SHA.  
**Current status:** SHC Admin NOT ACCEPTED; 62 prior checklist rows, source-only **25 FAIL / 37 PENDING / 0 verified PASS**.

## Why this handoff was revised

Earlier package supplied separate architecture, acceptance and workflow standards but did not clearly identify ONE parent document. **Version 3 retains the one project-wide governing standard at position 01 and expands it with API design architecture, authentication/authorization/authority, zero-trust controls and staged global scalability contracts. The older supporting documents remain detailed annexes.** Do not merge or invent a second architecture standard; do not create an alternative living checklist.

## Exact reading order (do not skip governing policy)

| Read | File | Authority / purpose |
|---|---|---|
| **00** | `00_READ_ME_FIRST_SHC_ADMIN.md` | Entry, scope, order, do-not-modify rule |
| **01** | `01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md` | **ONE project-wide governing architecture + engineering/audit/release policy** for every app and future module |
| 02 | `02_ProjectSoftwareArchitectureStandard.md` | Detailed SHC/SUIA/RTH architecture annex |
| 03 | `03_ProjectServiceAcceptanceStandard.md` | Detailed universal, profile, security and release acceptance annex |
| 04 | `04_ProjectImplementationWorkflow.md` | Detailed audit-first, remediation and local Docker gate workflow annex |
| 05 | `05_SHC_Admin_Architecture_Acceptance_Checklist_v1.md` | Exact definition of 62 `SHCA-*` checks (not statuses) |
| 06 | `06_SHC_Admin_Phase1_Source_Audit_2026-11-08.md` | Phase 1 source review **leads**, not executed test evidence |
| 07 | `07_SHC_Admin_Phase2_Deep_Source_Verification_2026-11-08.md` | Deeper source review **leads**, not executed test evidence |
| 08 | `08_SHC_Admin_Evaluated_Checklist_v2_2026-11-08.md` | Latest *previous* 62-criterion source status; not current-pass proof |
| 09 | `09_PROJECT_AI_TASK_SHC_ADMIN_READ_ONLY.md` | Exact technical-verifier work order |
| **10** | `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` | **ONE living output ledger** (update this file only) |

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
- Update **only** `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv`; preserve all prior reports/snapshots as historical evidence.
- Deliver **one** `SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md`, plus the updated ledger and redacted command outputs. Mark `NOT RUN` explicitly.
- **DO NOT** modify code, run live DB migrations, deploy, commit/push, consolidate enquiry/admission, delete legacy paths, modify cloud/CI, or switch to another app's audit without the owner's explicit separate authorization.

## Model handoff / cost control

Project AI can use an economical source-inspection model for first-pass checks and a stronger model only for disputed architecture/security/data issues. Models must work on **≤8 findings per checkpoint** and persist their evidence to the same ledger/report before continuing. This package is not a request for Sol/Argon or any other agent to autonomously refactor the project.

## One truth, not three chats

- **Owner:** decides what is approved, may commit this standard into the single Git repo.
- **Project AI verifier:** investigates source and safe tests, updates the one ledger, produces the one report.
- **ChatGPT architecture reviewer:** reviews those SAME files against PSEG-001; does not maintain a second competing status register.
- Suggested eventual canonical repo location: `docs/architecture/governance/ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard.md` with `docs/architecture/reviews/shc-admin/` for the reviewed SHC Admin ledger and reports. **No git changes performed by this handoff.**

**Definition of done for verification (not certification):** 62 rows tied to actual SHA and source/test evidence, every run and skipped run documented, and one report explicitly distinguishing confirmed violations, false positives, corrections and pending external checks. Certification only after mandatory PSEG gates pass; do not certify just because the investigation is complete.

## v3 architecture contract amendment

The sole umbrella policy in file 01 is now **proposed v1.1**. Its added §17 architecture-domain map (`PSEG-AR01..25`), §18 API design gates (`API-01..20`), §19 trust and authority distinctions, §20 worldwide capacity planning and §22 staged rollout are mandatory **audit reference criteria when applicable**. **Do not expand or renumber the existing 62-row SHC Admin ledger**: link the new contracts in the existing ledger notes and technical report. Global million-user scale is a future verified capacity claim, not a current certification or an instruction to deploy expensive infrastructure. Project-owner approval remains necessary before the new document supersedes working v1.0.
