# Sol R3 — independent acceptance-evidence closure

Date: 12 November 2026. Repository: `skillupitacademy-alt/SUIA_RTH_SHC`.

## Source identity and verdict

Reviewed local branch `main` at **`f78bd048e2192e0f744ffe3fca6218aa1d9aedd2`**, clean before R3. This is the committed R2 cleanup, followed by the **uncommitted R3 changes identified below**. Earlier implementation reports saying R2 was uncommitted are historical statements, not the current repository state. No additional commit, push, image creation or deployment was performed.

**Overall recommendation: do not close the entire Q01–Q48 qualification.** R3 supplies independent runtime evidence, corrects a reproduced canonical progress-state defect and reconciles the remaining requirements. Historical migration provenance and broader method/session/engineering acceptance remain open. Acceptance of this bounded code correction is separate from full three-app acceptance and owner signoff.

The authoritative R3 evidence directory is [`.evidence/r3-acceptance-20261112`](../../../../.evidence/r3-acceptance-20261112). Its [Q01–Q48 register](../../../../.evidence/r3-acceptance-20261112/Q01_Q48_REGISTER.md) covers each original requirement, evidence type and remaining exception. The canonical 62-row CSV is not replaced or edited.

## Independent findings and changes

| Requested action | Independent result | Disposition |
| --- | --- | --- |
| Historical `0026` fingerprint | Exact raw Git blob hashes to `40461fe6…e0c36783`; 7,292 bytes. | VERIFIED COMPLETE for source identity. |
| Historical `833cf27c…4a3578` | Named `0018` historical file hashes to a different value. No exact match or approved exception obtained. | OPEN; claims that both hashes were resolved are unsupported. |
| Nine journal discrepancies | Fresh read-only ledger/catalog inspection; 22 ledger rows, 20 current SQL matches, one additional historical match. Nine individual dispositions documented. | Reconciled as findings; not rewritten or falsely marked executed. |
| Authenticated/anonymous retired routes | 68 actual local HTTP checks passed, including signed-credential positive controls, GET, HEAD and RSC/prefetch headers. | VERIFIED COMPLETE for these paths/request variants. |
| Canonical account switching | Actual shell/provider test reproduced retained A progress and absent B fetch on the same page. Initial result: two failures, one pass. | CORRECTION IMPLEMENTED; eight account/brand cases pass after correction. |
| Real hierarchy deletion/FK/concurrency/rollback | Six actual Neon MainDB tests passed through the production service; cleanup verified. | VERIFIED COMPLETE for domain/subject scenarios, not all hierarchy/cross-database cases. |
| Method security coverage | Current AST inventory: 195 exported HTTP handlers in 151 files, SHC 80/SUIA 49/RTH 66. | Inventory only; complete runtime method/role/object matrix remains PARTIAL. |
| Authenticated accessibility | Initial SHC cold 503 retained, then mobile page loaded. SUIA exams desktop/mobile passed. RTH controlled fixture was not admitted to dashboard. | Bounded evidence; no blanket authenticated accessibility acceptance. See subsequent warmed results if present. |
| Current quality gates | Exact local command receipts are retained in `gates-final.json` and `tool-command-receipts.json`. | Use completed exits, not a “compiled” message or a running task. Final summary below. |
| Graph and generated artifacts | AST refresh executed; existing generated Next declarations and embedded Playwright report inspected. | Graph is supporting tooling, not security acceptance. Historical HTML is not R3 test proof. |

### Canonical progress correction

Changed only the shared `TutorialPageShell` session boundary: it now keys its internal state/providers by the server-derived brand and learner identity. When that identity changes on the same URL, the previous progress, pending consumer state and telemetry session are discarded before the new session renders. No tutorial blocks, content, publication, entitlement or RBAC behavior was changed; no retired component was restored.

The replacement tests mount the **real shared shell and real ILSProvider**, with deterministic deferred network responses and decorative rendering/telemetry stubs. They cover both learner brands: immediate eviction of loaded A progress, delayed A completion after B loads, old requests after unmount/remount, and a brand change for the same learner. These are React/jsdom regressions, **not full browser login/logout, cookie/cache eviction or PostgreSQL tests**. They specifically verify behavior when the server-derived runtime identity changes; they do not prove every auth-state propagation path.

SUIA Vitest previously included only `.test.ts`; existing TSX tests were not collected. R3 enables TS/TSX test discovery, the installed JSX transform and UI aliases, and explicitly selects jsdom for two previously uncollected DOM suites. The full final suite passes **200 tests in 25 files**, including the eight new isolation cases. No tests or assertions were removed to obtain that result.

Changed application/test paths:

- `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`
- `apps/skillup-web/src/lib/__tests__/canonical-account-switching.test.tsx`
- `apps/skillup-web/vitest.config.ts`
- `apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx`
- `apps/skillup-web/src/app/student/exams/__tests__/listing-truth.test.tsx`
- `apps/skillhubcore-admin/src/lib/hierarchy/__tests__/r3-remote-hierarchy.integration.test.ts`
- `apps/skillhubcore-admin/src/app/(admin)/dashboard/page.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/components/Header.tsx`

### Real hierarchy evidence

Opt-in remote test command:

```powershell
$env:RUN_HIERARCHY_REMOTE_UAT='1'
pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/hierarchy/__tests__/r3-remote-hierarchy.integration.test.ts
```

Exit **0**, six passed. Actual production service methods run against real PostgreSQL transactions; only the database-provider binding selects the approved remote development connection. Cases: empty-domain deletion; retained soft-deleted child blocks deletion; PostgreSQL rejects an orphan FK; injected failure after a real transactional delete restores the row; two concurrent service deletes serialize to 200/404; a real FK writer holds a lock and the waiting parent deletion returns 409 after the child commits. The test observed PostgreSQL lock waiting, not only mocked `.for('update')` calls.

Run-specific UUID/name predicates restrict cleanup to created fixtures; zero fixture rows remained. No DDL, existing-user mutation or database history change occurred. This does not establish cross-MainDB/TutorialDB atomic rollback, every topic/subtopic/skill race or restore readiness.

### Retired-route HTTP evidence

`retired-routes.cjs` launched headless Chromium contexts and issued actual local HTTP through Playwright's request transport. Active development learner identities were checked read-only; short-lived signed credentials stayed in memory. Each brand's protected progress endpoint accepted the selected credentials as a positive control. Retired `/student/learn`, RTH `/learn`, `/remediation`, `/tutorial/assignments` and selected child/trailing paths returned 404 in both credential states, including HEAD and RSC/prefetch headers.

This qualifies signed-credential HTTP behavior, not password login or the full session/refresh contract. No content creation, progress completion or other persistent mutation was used by these probes. The earlier unauthenticated-only R2 test is retained as earlier evidence, not described as authenticated coverage.

### Migration decision

See [migration reconciliation](../../../../.evidence/r3-acceptance-20261112/MIGRATION_RECONCILIATION.md) for all nine discrepancies and the safe runner sequence. Existing enum effects, intentionally absent legacy tables and different current indexes are not proof that each historical migration ran. Current architecture-ID nulls do not authorize repopulating a retired learning model.

**Hold generic migration execution** until the owner approves the provenance/baseline disposition, exact new SQL if required, backup/restore and isolated remote rehearsal. Do not edit ledger hashes/timestamps, recreate retired tables, replay all old SQL, or execute the pending outbox migration merely to make accounting appear complete. The already approved manual progress patch remains separately evidenced.

## Quality and runtime evidence boundaries

- `suia-tests-final.json`: independently executed full suite, **200/200**, command exit **0**.
- `shc-security-final.log`: independently executed **65/65**, command exit **0**.
- `hierarchy-remote.log`: independently executed real PostgreSQL **6/6**, command exit **0**, cleanup verified.
- `retired-routes-results.json`: independently executed actual HTTP **68/68**.
- `gates-final.json`: fresh typecheck/lint/boundary/build commands at R2 HEAD plus this R3 patch. The initial SHC lint failure was real: two unused imports in the new integration test. Explicit WebSocket transport setup fixed them; the zero-warning rerun exited **0**, retained in `tool-command-receipts.json`. No lint rule, test assertion or build diagnostic was disabled by R3.
- The earlier PowerShell gate run and an interrupted test attempt are retained but are **not** final success evidence. Final native-process receipts and the explicit Vitest JSON run supersede them.
- Local Sentry release/map publishing was disabled through the existing optional publication-token configuration for these local builds. Runtime monitoring was not removed. No Docker image or deployment was invoked.
- Graphify updates are AST-only. Its cache-root normalization/community-label notices are external tooling notices, retained rather than suppressed; no paid semantic-labeling operation was invoked.

Existing `next-env.d.ts` files are generated Next.js type glue, not authored security controls. The historical committed `playwright-report/index.html` was unpacked and scanned for current configured authentication/trust secrets and JWT-shaped strings: no matches in its two embedded files. This bounded scan is not exhaustive secret detection or screenshot OCR. Keep the report identified by its actual test baseline; do not use it to certify this R3 patch.

## Remaining acceptance blockers and next safe work

### Final command and accessibility results

All three production builds completed with exit **0**. SHC completed at `2026-11-12T17:22:24.615Z`, SUIA at `17:24:09.592Z` and RTH at `17:28:49.400Z`. All three typechecks exited **0**. SUIA and RTH zero-warning lint passed in the native gate runner. SHC passed its explicit corrective lint rerun after the first lint failure. Full raw receipts remain in the evidence directory.

Subsequent authenticated SHC dashboard testing found actual text contrast failures. R3 darkens the affected notification badges, dashboard buttons, status text, metric trends and timestamps. The final desktop and mobile Chromium checks both return **200**, reach the dashboard heading, enter an application control by keyboard, have no horizontal overflow and report zero axe violations. See `shc-accessibility-corrected-results.json`. Earlier failures are retained. The final post-correction SHC production rebuild also completed with exit **0** at `2026-11-12T17:37:57.179Z`, recorded in `shc-build-after-contrast.json`. Its final zero-warning lint command exited **0**, recorded in `tool-command-receipts.json`.

SUIA authenticated mobile passed its strengthened final probe. Its warmed desktop result exists in the initial run, while the restart-era desktop probe failed during warm-up. RTH dashboard admission remains unqualified because its signed fixture lacks proof of the complete backend session contract. All three local web servers were restarted following the build checks.

1. Exact `833cf27c…` SQL or a formally recorded owner exception; reviewed migration baseline, backup/restore and runner plan. R3 provides a proposal, not approval.
2. Complete remaining method/resource/role/session coverage under Q16/Q24/Q25/Q28/Q29/Q32/Q33/Q36/Q37/Q39/Q41. Current-account/membership transitions and real login/refresh/logout/revocation need proper complete lifecycle fixtures. The RTH dashboard signed fixture did not qualify that journey; do not weaken session checks to force it through.
3. Remaining hierarchy cross-database scenarios, broader authenticated accessibility/performance and scoped engineering ownership review. MainDB domain tests are useful but not equivalent to these requirements.
4. Marketing remains Q22 HOLD. Docker/image/deployment and final acceptance/Git actions remain with the owner. The canonical ledger remains unchanged.

The next work should target these named gaps and reuse retained proof. It should not repeat completed tutorial-content journeys, perform another legacy cleanup, introduce new author-scope claims or start new product modules.
