# PROJECT AI TASK — SHC Admin Technical Verification (READ-ONLY)

**Read `00_READ_ME_FIRST_SHC_ADMIN.md` first, then **`01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md`** as the governing policy for all apps and future modules.** Use the supplied files in its reading order. **Work ONLY on SHC Admin verification, not project redesign or service migration.**

## Mission
Independently verify prior SHC Admin acceptance findings against the live checked-out repo, safely execute available verification commands, update the canonical 62-row ledger, and return one evidence-based SHC Admin technical verification report.

## Instructions

1. Start by reporting repo, branch, full `git rev-parse HEAD`, `git status --short`, whether exact reference SHA `4207cb1ca11abc29ca263310f5a4d54b859cd77f` is checked out, and any uncommitted code. Never assert the current branch equals deployed Hostinger revision without image evidence.
2. Read 01 project-wide governance first; 02 architecture, 03 acceptance, 04 workflow annexes; 05 criterion definitions; 06/07 historical source leads; 08 latest source status. Work using 10 CSV (single living status). Apply the universal `PSEG-U*` gates and relevant API/security/architecture contracts in `PSEG-AR*` / section 18 alongside the 62 existing `SHCA-*` checks. Do not create a competing `PSEG` checklist or change the 62-row ledger structure; map PSEG references within evidence/notes or the final report. Do not regenerate independent numeric finding IDs unless adding to ledger with references.
3. For each high-risk finding, trace `page/component -> client/API -> BFF -> backend module/service -> repository -> data`, recording concrete paths/line ranges. Reconcile current code with source report; statuses `CONFIRMED / FALSE_POSITIVE / RESOLVED_AT_NEW_SHA / UNVERIFIED` are distinct from acceptance `PASS / FAIL / PENDING / N/A`.
4. Check protection for anonymous **page HTML/RSC**, role/brand/object access, origin/CSRF, destructive academic CRUD, TOTP actions, demo data vs operational data, Project AI durable approvals, tutorial versioning/visibility, question import/delete, certificate preview vs actual issuance, and marketing query provider. No deployment or data changes.
5. Only if safe: run from exact repo checkout `pnpm --filter @quiz/skillhubcore-admin check:boundaries`, `lint`, `type-check`, `test:security`, `test`, `build` sequentially. Capture command, date, SHA, exit code and redacted output. **Before `test` or any DB-backed test, confirm isolated test database, no Hostinger/shared database URLs, no live provider credentials, no migrations/writes; if not certain, SKIP and mark NOT RUN.** Do not run production checks or migrations.
6. Do not use an 80%/90% score to waive hard blockers. Mark PASS only on satisfying source + required runtime/integration evidence. Never confuse authored tests with executed tests. A source FAIL is allowed with a proposed fix, not permission to fix it now.
7. Produce one `SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md` with SHA, checked files, each finding ID with severity, source lines and actual tests, false positives and constraints, safe future remediation priority, non-SHC dependencies, and unresolved test work. Update `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` with accurate evidence. If you cannot edit local files, output a patch/CSV and report with the exact output names specified here.
8. Stop after reporting. **DO NOT modify app source, migrate SHC/brand functionality, touch production DB, deploy Docker/Hostinger, commit/push, alter CI/CD, or delete anything.**

## Token efficiency
Start with prior FAIL rows and the few dependency files they refer to. Process ≤8 findings per checkpoint and persist results after each checkpoint. Avoid loading all historical project audits. Use Argon/high effort only to adjudicate complex contradictory evidence. A PASS requires actual evidence, not confidence.

## Deliver back to reviewer
- `10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv` (62 rows retained; changed statuses/evidence)
- `SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md`
- Command output logs redacted, if any
- Explicit list of NOT RUN checks and WHY

**v3 specific audit scope:** Analyze current SHC Admin API design for schema validation, pagination bounds, idempotency/concurrency, cache classification, API permission/brand authority, and version/contract compatibility where applicable. Link any confirmed issue to existing `SHCA-*` and `PSEG-*` in ledger evidence; leave global scale/load capacity `PENDING / NOT TESTED`, do not prescribe Kubernetes or multi-region upgrades. Stay read-only.
