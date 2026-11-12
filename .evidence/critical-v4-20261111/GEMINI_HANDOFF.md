# Critical V4 implementation handoff

## Latest continuation — 12 November 2026

The owner's eight-item completion register is now recorded in `.evidence/closure-20261112/QUALIFICATION_DELTA.md`. Items 1–5 are complete within their documented boundaries. The targeted critical security checks passed, while the wider security coverage under item 6 remains PARTIAL. Item 7 remains PARTIAL for broader hierarchy integrity/engineering/accessibility requirements. Item 8 remains PARTIAL for historical migration provenance and full Q01–Q48 reconciliation. Use that register when reporting completion or assigning remaining work.

This section supersedes older blockers below where explicitly resolved. The owner committed the earlier work in `1dbc19c09f11b624ccd27dcdd939e92a1ddcb024`. Current corrections await the owner's commit and push. Read `.evidence/closure-20261112/QUALIFICATION_DELTA.md` and `FINAL_VERIFICATION.json` for the completed continuation. Earlier evidence is under `.evidence/continuation-20261112/`.

The owner approved direct remote UAT alignment of the empty `tutorial_progress` table. The guarded transactional SQL patch has been committed to the database, with verified DDL rollback rehearsal, required tenant/check constraint, tenant/user/subtopic uniqueness and zero rows after execution. This was not a Git commit. See `PROGRESS_TENANT_APPLIED.md` and its execution receipt. Database execution is no longer blocked for this completed patch. Historical Drizzle journal reconciliation remains outstanding; do not run generic pending migrations blindly.

The hierarchy create/update service extraction, route contract/typecheck fixes and stale test fixture corrections are implemented. Gateway unit tests now pass 146/146; hierarchy tests pass 77/77; SUIA tests pass 115/115; targeted non-tutorial RTH tests pass as recorded in the continuation logs. The SHC webpack production build and knowledge-graph refresh completed. These counts overlap other targeted runs and must not be added into a unique-test total. Saved local gateway JWT configuration was aligned with the existing API issuer and the gateway restarted; see actual HTTP outcomes in `questions-normal-runtime.log`.

The owner approved synthetic testing on the existing remote development Neon database. Eleven real PostgreSQL probes passed with run-specific cleanup and zero final progress rows. A concurrent-create defect was reproduced and corrected through the existing tenant-scoped versioned update path. Eight Chromium/BFF/backend/PostgreSQL progress probes passed across both brands, covering reload, reissued synthetic sessions, cross-user and wrong-brand cases. Six public-login desktop/mobile accessibility probes and twenty real HTTP security denials passed. The stale progress tests now use explicit tenant context and stronger assertions.

All three apps passed production build, typecheck and zero-warning lint. The API server and database package typechecks passed. SHC boundary checking passed. Final mocked suites include 23 progress tests, 110 selected RTH tests and 116 SUIA tests. Successful progress responses now use private/no-store caching. SUIA request-dependent program/faculty rendering and runtime sitemap generation were corrected. Warning filters were removed and dependency/configuration causes were addressed. See the final report for the optional Sentry release-plugin credential configuration.

Migration provenance now matches 20 of 22 applied hashes, with LF/CRLF differences accounting for three earlier mismatches. Two historical hashes still require their original artifacts. Their history was preserved. Docker image creation, container tests and deployment are assigned to the owner. A started local build was cancelled on request and its qualification image was absent. Source Docker-context secret exclusions were corrected. Marketing Q22 remains HOLD and broader Q01–Q48 acceptance follows its original criteria and owner gates.

## Critical items 5 and 6 follow-up

Read CRITICAL_5_6_SECURITY_RESULTS.md and PROGRESS_TENANT_ALIGNMENT_DESIGN.md beside this handoff. The owner-requested progress design is ready for review and database execution remains unapproved. A fresh read-only check still shows zero rows and no tenant_id. A required RTH remediation tenant/upsert source correction is implemented.

Focused security fixes now cover production fixture-session disablement, exact backend CSRF origins/nonempty internal keys, learner BFF origin checks, missing gateway-secret fail-closed behavior, API matcher coverage and signed worker destination path/query validation. Twenty real HTTP denial probes passed. Detailed targeted tests, prior failures, remaining typecheck/build gates and exact evidence boundaries are in the new report. Preserve all uncommitted work. No full three-app acceptance or database execution is claimed.

## Questions follow-up

See Q09_Q10_QUESTIONS_AUTHORIZATION.md beside this handoff. A real runtime probe exposed a second defect, the gateway rewriting verified shc-admin identity to admin. That source correction now has four passing focused gateway tests. All 16 real HTTP probes passed through an isolated matching-key gateway, and SHC security returned 65 passed. The normal saved gateway key configuration still differs from SHC and needs alignment before normal-environment acceptance. The broad gateway suite has 43 identical baseline failures, verified by comparison with archived committed gateway source. Preserve these failures in the handoff.

## Q08 follow-up completed on 11 November 2026

The owner subsequently assigned focused login verification to Sol. It now has 6 passing headless Chromium tests, 3 passing login unit tests and a fresh passing SHC type-check, all exit 0. See Q08_LOGIN_VERIFICATION.md and q08-playwright.json beside this handoff. Successful no-JavaScript, pre-hydration and safe-error screenshots are available under .evidence/screenshots/critical-v4-20261111. These executed results supersede the earlier Q08 worker/browser failure blockers recorded below. Other items retain their pending status. The canonical ledger remains unchanged.

Prepared 11 November 2026. Local branch main, HEAD f245e11ee5584018a0f751080595192325e74ee6. Changes described here remain uncommitted. Preserve all working-tree files and inspect the actual diff before continuing. This handoff records bounded implementation and execution evidence. Three-app acceptance remains pending.

## Owner scope

- Use HTTP for the local SHC 3007, SUIA 3009 and RTH 3003 hosts.
- Existing skillhubcore-admin, skillup-web and realtutorialhub-web applications and their necessary shared/backend dependencies only.
- Tutorial block validation, Composer authoring/publication, shared or tenant-only tutorial delivery and the associated browser journeys are excluded from repeated qualification. Preserve their prior evidence and working implementation.
- Student progress, tenant safety and assignment authorization remain in scope. Marketing Q22 remains HOLD.
- No new modules, paid providers, local PostgreSQL, remote writes/DDL/migrations/deletes, Docker/VPS operations, commits/pushes/merges/deployments or canonical acceptance-ledger changes without the applicable owner authorization.

## Implemented changes

### Q08 login submission and Q43 safe login errors

apps/skillhubcore-admin/src/app/(public)/login/page.tsx now declares native POST to /login, disables credential controls and submission until hydration, and guards the React submit handler. The hydrated flow preserves JSON POST /api/auth/login, credentials inclusion, auth-store synchronization and sanitized internal redirects. Upstream authentication diagnostics are replaced with fixed public messages.

Added login-submission.test.tsx beside that page under __tests__, and tests/e2e/shc-login-security.spec.ts. The browser spec uses deliberately invalid synthetic canaries and mocked login responses. It must never be described as successful real account authentication or a successful protected Questions journey.

### Q09/Q10 Questions trusted portal identity

apps/skillhubcore-admin/src/lib/upstream-proxy.ts adds x-portal-identity=shc-admin only after successful server authentication and admin-role validation, and only for api/admin/questions or its descendants. Browser-supplied identity headers remain excluded. Unrelated upstream routes and public auth routes receive no new portal identity header.

Extended src/lib/__tests__/upstream-proxy.test.ts and apps/api-server/src/app/api/admin/questions/__tests__/batch-08-question-boundary.test.ts. The backend test starts a loopback HTTP server around the actual GET handler and uses real TokenService signing/verification. Its CQRS/domain query boundary is mocked and no database is accessed. A signed SHC token without the portal header gets 401, the same token with the trusted header gets 200, and a learner token gets 401. This isolates the audience mismatch mechanism. Full browser-to-BFF-to-gateway-to-real-account success remains unverified.

### Q33/Q35 assignment tenant argument

apps/realtutorialhub-web/src/lib/assignment-auth.ts passes user.brand to isSubtopicComplete. Its preceding requireStudent guard already requires verified realtutorialhub identity. Added tests in src/lib/__tests__/assignment-auth.test.ts for the exact tenant tuple, incomplete progress denial and wrong-brand rejection before repository access. Database tenant predicates remain intact.

### Q43 opaque BFF failures and fixture credential hygiene

Added src/share-branding/api/server-error.ts. It returns a generic public message, correlation ID and private/no-store headers. Logs contain safe request metadata and bounded error codes, excluding exception messages and stack/body details.

Applied it to unexpected failures and upstream 5xx responses in these three routes, preserving status codes including 503 and existing 4xx behavior.

- apps/realtutorialhub-web/src/app/api/tutorial/progress/route.ts
- apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts
- apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts

Added RTH src/lib/__tests__/safe-error-responses.test.ts and SUIA block-completion/route.test.ts. Added the shared-branding resolution alias to apps/skillup-web/vitest.config.ts.

Removed literal fallback account/password values and email logging from tests/e2e/shc-authoring-and-learner-consumption-smoke.spec.ts. It now requires explicit environment fixture settings before browser authentication. Only test collection was attempted for that historical spec. Its excluded tutorial journeys were never executed.

## Independently executed passing checks

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Initial SHC proxy and login targeted tests | 7 passed, exit 0 | Earlier patch version, before final header narrowing and third login test. Preserve historical evidence and rerun final login file. |
| Final narrowed SHC upstream-proxy tests | 9 passed | Same combined run exited 1 when the separate login worker failed to start. This is a file-level pass, not an overall command pass. |
| API Questions boundary tests including isolated HTTP probe | 5 passed, exit 0 | Real route, JWT signature and backend guard. Mocked domain query. |
| RTH opaque-error cases | 18 passed | In combined run with two unrelated existing failures, so combined command exited 1. Mocked auth/fetch. |
| RTH assignment-only added cases | 3 passed, 12 skipped, exit 0 | Mocked progress repository. |
| SUIA changed block-completion and existing progress route tests | 11 passed, exit 0 | Mocked auth/upstream transport. |
| SHC security suite | 61 passed, exit 0 | Executed before final narrowly scoped forwarding edits. Relevant final proxy file separately passed 9 cases. |
| SHC API boundary checker | 80 handlers, exit 0 | Static guard check. |
| SHC type-check | Exit 0 | Before final small login/forwarding adjustments. Rerun for final state. |
| API server tsc --noEmit | Exit 0 | Compilation evidence only. |
| SUIA lint | Exit 0, 17 warnings | Warnings in unchanged test files. Zero-warning acceptance is pending. |

Commands included pnpm --filter @quiz/skillhubcore-admin test:security, check:boundaries and type-check, targeted pnpm --filter <package> exec vitest run commands, and API-server exec tsc --noEmit. Repeat only final changed-path checks and unresolved gates.

## Failed, interrupted or unverified checks

- RTH full assignment-auth.test.ts plus the new error suite returned 31 passed and 2 failed, exit 1. The unchanged legacy-content-route assertions expect 200/403 while the retired route returns 410. Keep these failures visible. Reconcile stale tests in the already-retired-route scope without restoring legacy content behavior.
- RTH type-check returned exit 2. Shared src/share-branding/LearningExperience/__tests__/learner-page-resolution.phase1.test.ts lines 115, 127 and 139 call a function with two arguments where three are now required.
- SUIA type-check returned exit 2 for those shared test calls and unchanged optional NextRequest handler signatures in faculty/programs routes exposed by generated Next route types. Resolve the actual supported handler contract and rerun.
- SHC login final tests could not start workers. Both fork and single-thread retries failed with a Vitest worker-startup timeout. The last retry ran zero tests and exited 1. Do not convert this into a pass.
- The first Playwright CLI attempt failed because the root playwright runner differed from the runner bundled with @playwright/test. The matching command is node node_modules/@playwright/test/cli.js test tests/e2e/shc-login-security.spec.ts --project=chromium --workers=1 --reporter=line with SHC_ADMIN_URL=http://skillhubcore.localhost:3007.
- That matching browser attempt timed out during the no-JavaScript test while the local login route was compiling. A q08-safe-login-error.png screenshot was generated under .evidence/screenshots/critical-v4-20261111, but the complete runner output was unavailable. Treat the screenshot as a partial artifact, and do not claim a complete Q08 browser PASS. The failed test context is q08-browser-timeout.md alongside this handoff. Remaining browser workers were stopped for handoff.
- Full SHC and RTH lint processes stalled and were interrupted to reduce memory pressure. Both commands exited unsuccessfully. Rerun serially. Available physical memory had dropped below 1 GB while multiple processes were running.
- No final production build was executed for this patch. No new PostgreSQL-backed concurrency/persistence test was executed.
- Historical fixture-spec collection correctly rejected missing settings before authentication. Collection with synthetic settings exited 0. The count was not conclusively recorded and needs a collection-only recheck if cited. Never run its excluded tutorial journeys.

## Q13 remote PostgreSQL observation

Read-only metadata evidence is stored in .evidence/critical-v3-20261111/progress-readonly-metadata.json. The transaction was REPEATABLE READ READ ONLY with a statement timeout and was rolled back. No connection strings or personal records were printed.

- public.tutorial_progress has no tenant_id column although the current Drizzle schema and repository require it.
- At inspection time it contained zero rows, zero users/subtopics and zero duplicate groups.
- Existing unique index uq_tutorial_progress_user_subtopic uses user_id, subtopic_id. It would still prevent independent dual-brand progress after merely adding a column.
- Existing migration 0029_fnd03_add_tenant_to_progress.sql deliberately raises an exception pending provenance review. Do not bypass it or execute a migration runner against the existing remote databases.

Prepare an owner-reviewed additive migration design. On an approved isolated remote branch, recheck the table under an appropriate lock. If any rows have appeared, stop for deterministic tenant provenance. Add a tenant column with no guessed default, validate writers, tenant constraints and the new tenant/user/subtopic unique key. Retire the old unique index only after the replacement is valid and the exact change is approved. Enforce non-null only after all data is proven. Include journal/snapshot coordination, lock timeouts and failure rollback. After tenant-aware writes begin, preserve the column/data and forward-fix or use an approved recovery procedure. No destructive drop-column rollback assumption.

The separate navigation-node progress-key collision concern remains unresolved and must not be silently included in this schema change.

## Document cross-check

V4 attached playbook was read completely. Current repository contains these four originals.

- audit/FinalAechitecture.md
- audit/CompleteProjectAudit.md
- audit/CompleteProjectMatrix.md
- ProjectAuditReport.md at repository root

The first three were already known under audit. ProjectAuditReport.md was found during this continuation. The root also contains ProjectAuditReport_Version_2.md and ResolveProjectAuditReport.md, which are distinct versions/documents.

Software Architecture Explained.txt, Review Project Files.txt and Review implementation prompt.txt were not found by current-tree filename searches. Historical audit text references Review Project Files, but that does not establish recovery of the original attachment. Full-history searches were stopped while stalled, so absence from all Git history is unproven. Prefer a bounded GitHub filename/history check or locate the owner's original attachment. Continue authorized fixes using available standards. Do not claim all seven originals were fully reconciled. Large historical originals received targeted requirement reads, not a complete line-by-line reread.

V4 alignment corrections already applied to our patch include native POST /login, Questions-only verified forwarding identity and no repeated tutorial browser journeys.

## Next work for Gemini, in order

1. Verify actual branch/HEAD and preserve this uncommitted patch. Read V4 plus this delta. Run tests serially to avoid the observed memory/worker failures.
2. Finish Q08 final login unit and headless Chromium no-JS/pre-hydration/hydrated negative checks. Observe URL/referrer exposure safely using synthetic canaries. Save successful screenshots under .evidence/screenshots/critical-v4-20261111. Do not authenticate with real passwords for this negative probe.
3. Run final narrowed Questions forwarding tests, SHC security/boundaries/type-check. Complete a controlled end-to-end Questions authorization probe with a proven synthetic account environment before declaring Q09/Q10 closed. Preserve real JWT audience/RBAC and trusted-header checks. Q11 real CRUD remains subject to safe fixture authorization.
4. Rerun changed RTH/SUIA safe-error and assignment cases, reconcile stale retired-route assertions and baseline type errors. Rerun lint and affected safe builds. No zero-warning/full-build claim until actually demonstrated.
5. Finish the reviewed progress migration/backfill proposal using the read-only evidence. Q13/Q14/Q27/Q35/Q40/Q45 database execution remains blocked by isolation and explicit authorization.
6. Verify SUIA test-fixture-session deployment gating. It currently allows NODE_ENV=production when PROJECT_LLM_ISOLATED_VERIFICATION=true and no production deployment label is set. Existing tests explicitly support that isolated preview mode. Determine actual deployment defaults and negative matrices before classifying it as public exposure or removing intended isolated qualification behavior. No bypass was changed in this patch.
7. Continue remaining non-tutorial authentication/authorization, membership, private-record, student/quiz/worker and CSRF negative cases from V4. Reuse accepted R6 evidence for unchanged controls. No new features or paid calls.
8. Q17/Q42 hierarchy create/update writer ownership remains a proposal/implementation task. No hierarchy service extraction was made in this patch. Prove contracts and authoritative rules before a cohesive minimal change.
9. Finish targeted keyboard/mobile/accessibility checks and noncritical engineering cleanup. Marketing remains HOLD. Docker remains separately gated.
10. Run graphify update . after final code changes as required by AGENTS.md. This final graph refresh is pending. Produce the Q01–Q48 delta with exact commands/exit codes and preserve original owner gates.

## Final state and governance

No new Q task is promoted to DONE by this handoff. The last reconciled V3 totals remain 5 DONE, 24 PARTIAL, 8 OPEN, 10 BLOCKED and 1 HOLD until evidence-driven reassessment. The critical fixes are implemented with bounded passing evidence and final verification gaps.

Canonical ledger SHA256 remains 7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e. No ledger edits, commits, pushes, merges, deployments, database writes or migrations were performed. Our incidental generated changes to RTH next-env.d.ts and playwright-report/index.html were restored after inspection. Local SHC was restarted on HTTP by owner instruction. Existing application services were not stopped for this handoff. Stalled verification processes and history searches were stopped.
