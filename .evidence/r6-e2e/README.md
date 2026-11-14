# R6-B disposable integration evidence

Application source baseline is `4aa0cad2e7659b35e2092c2edbfe4638868c917f`. No application implementation changed in this continuation. The detailed decision and limitations are appended to `docs/architecture/reviews/SHC/SOL_R6_B_THREE_APP_RELEASE_READINESS.md`.

## Target and safety

`ISOLATION_MANIFEST.json` records the verified disposable Neon project/branch, five synthetic databases and isolated localhost origins. The manually created qualification branch and its pre-existing databases are retained. `SETUP.json` records read-only schema extraction and synthetic fixture creation. Protected account rows were excluded. `PROTECTED_READ_ONLY_FINAL.json` confirms the protected PeopleDB remains through 0008 with its global constraint.

The local `.local-secrets/r6-neon-test.env` is access-restricted and Git-excluded. Its credential is covered by the owner's explicit reauthorization and continuing open exposure finding. Generated private fixture state and client work files were removed after cleanup. No credentials belong in reproduction commands or evidence.

## Recorded entry points

Run from the repository root. These commands identify the executed test paths and their reproduction invocation. The initial setup/migration receipts do not capture complete start/end timing. Browser receipts and syntax receipts contain their recorded timestamps. Client preparation requires the approved client-only archive/provenance recorded in `.evidence/r6-neon-qualification/CLIENT_UTILITIES.json`, plus a new assignment-owned temporary client work reference. No local PostgreSQL server was installed.

```powershell
node node_modules/tsx/dist/cli.mjs --tsconfig apps/api-server/tsconfig.json .evidence/r6-shc-revocation/verify-disposable.mts .local-secrets/r6-neon-test.env
node .evidence/r6-e2e/setup.cjs
node node_modules/tsx/dist/cli.mjs .evidence/r6-e2e/migrate.mts
node .evidence/r6-e2e/content-fixtures.cjs
node .evidence/r6-e2e/start.cjs
powershell -NoProfile -File .evidence/r6-e2e/switch-app.ps1 -Brand skillup
$env:R6_E2E_BRAND='skillup'
node .evidence/r6-e2e/journey.cjs
node .evidence/r6-e2e/tutorial-page.cjs
Remove-Item Env:R6_E2E_BRAND
```

The same explicit brand selection runs `journey.cjs` for `skillhubcore` and `realtutorialhub`. RTH's affected fresh-exam retest used `http-checks.cjs`. Its final result-only check used `tutorial-page.cjs` with `R6_RESULT_ONLY=true`. The final start script launches one frontend alongside the API and gateway. Initial all-frontend startup was reduced to sequential execution after observing memory pressure.

```powershell
node .evidence/r6-e2e/catalog-checks.cjs
node .evidence/r6-e2e/protected-read-only.cjs
powershell -NoProfile -File .evidence/r6-e2e/cleanup.ps1
node .evidence/r6-e2e/cleanup-databases.cjs
graphify update .
```

`HARNESS_SYNTAX.json` records the exact `node --check` invocations, timestamps and exit codes for ten JavaScript harness files. Actual `.mts` migration and gateway transport execution is separately evidenced by runtime receipts. Existing application typecheck/lint/build and accepted regression receipts retain their original source boundary and were reused.

## Final evidence

- `MIGRATION_RECEIPT.json` and `FINAL_CATALOG.json` retain registered 0009/0010 hashes, ledger state and exact final index definition.
- `JOURNEY-skillup.json` passes 23/23. `TUTORIAL-skillup.json` passes 7/7 including rendered content and completed exam result HTTP 200.
- `JOURNEY-skillhubcore.json` retains 16 passing functional checks and its initial 65-second warm-up timeout. Captured identity/admin replay and refresh recovery are denied. New UI login works.
- `JOURNEY-realtutorialhub.json` retains initial warm-up/tutorial timeouts and an answer attempt with an aged fixture. `HTTP-realtutorialhub.json` passes 12/12 with a fresh exam, `TUTORIAL-realtutorialhub.json` passes 5/5 and `RESULT-realtutorialhub.json` passes 4/4 including completed result HTTP 200.
- `HTTP_STATUS_TIMINGS.json` preserves sanitized route/status/compile timings. Failed startup/configuration/fixture receipts remain under initial prefixes. Raw credential-bearing diagnostic lines were redacted, and logs remain Git-ignored.
- `DATABASE_CLEANUP.json` confirms all five owned databases removed. The standalone verifier separately records its scratch cleanup. Process cleanup and port snapshots confirm temporary copies/listeners removed and original listener PIDs retained.
- `SECRET_SCAN.json` records credential/JWT checks. `CSV_NOTE_DELTA.json` preserves all 62 canonical acceptance statuses and Q48.

## Remaining boundaries

The tested existing-schema migration and warmed application flows pass. Cold-start reliability and the historical quiz-result 500's root cause remain unqualified. Historical fresh schema lacks the protected database's SHC enum label, supplied explicitly only in the standalone test fixture. General fresh-install SHC acceptance is outside this result.

Protected backup/recovery evidence and approval, actual protected 0009/0010 execution, credential-risk disposition and eventual deployment/live smoke remain owner-controlled. PDF-provider delivery, broader learning workflows, all 195 authorization methods and the separate MainDB ownership phase are outside these bounded checks. Q48 remains OPEN.
