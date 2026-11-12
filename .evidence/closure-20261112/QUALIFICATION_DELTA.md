# Three-app qualification continuation

12 November 2026. Branch `main`, starting commit `1dbc19c09f11b624ccd27dcdd939e92a1ddcb024`. The pre-existing handoff edit was preserved. The owner retains Git commit and push responsibility.

## Implemented and exercised

- Corrected five stale progress tests to supply verified tenant context. Added checks of generated Drizzle tenant predicates against colliding synthetic identities.
- Reproduced a real PostgreSQL concurrent-create failure using two independent Node processes. The first run returned SQLSTATE 23505 for one completion. The repository now uses the exact tenant/user/subtopic conflict target, reads the winning active row, and merges through its existing versioned update path. A retained deleted identity remains inaccessible. Regression coverage includes that case.
- Eleven remote PostgreSQL scenarios passed after the correction. They cover independent-process create and update races, separate tenant rows, fresh-connection durability, RTH reset isolation, missing/foreign tenant rejection, database null/check/unique constraints, transaction rollback, idempotent completion and retained soft-deleted identities. Synthetic records were removed through run-specific UUID predicates and cleanup was verified. Both initial and final table counts were zero.
- Eight actual Chromium/BFF/backend/PostgreSQL progress probes passed. Both learner brands returned their own persisted values after reload and reissued synthetic sessions in fresh browser contexts. Another user received empty progress and foreign-brand credentials received 401. These sessions were generated in memory through configured signing keys. Password authentication and account lifecycle were outside these particular probes.
- Changed successful progress responses in both learner BFFs and the backend to `Cache-Control: private, no-store`. Browser probes verified those headers.
- Six public login page checks passed at desktop 1440×900 and mobile 390×844. The checks exercise labels through axe, keyboard focus, page overflow and native POST forms. Corrected the SHC footer text contrast found by the first run. Screenshots are under `.evidence/screenshots/closure-20261112/`.
- Twenty actual HTTP security denial probes passed for forged identities, cross-origin mutations, invalid sessions, fixture-session access and unsigned workers.
- Corrected export-status test fixtures to carry their existing trusted brand provenance. Seven backend authorization/ownership/CSRF suites passed with 69 tests.
- Removed reported lint warnings through typed fixtures, typed outbox transaction/repository adapters and removal of unused code. RTH's previous webpack warning filters were removed. Final lint commands enforce zero warnings.
- Fixed SUIA's build-time authenticated API call from `generateStaticParams`. Program details now render per request with existing request authentication. No credential-less build fetch is performed for that route.
- Corrected the shared SkillUp API helper to propagate Next.js request-scope signalling. The previous catch caused prerendered pages to attempt credential-less database fallbacks. Its regression test verifies that unavailable request context propagates before network or database access. The database-backed sitemap now renders with runtime configuration.
- SUIA's typecheck script now regenerates real Next.js route declarations before TypeScript checking. This corrected the malformed generated development declaration encountered during qualification.
- Updated only `caniuse-lite` and `baseline-browser-mapping` in the lockfile. The general browser updater initially changed unrelated dependency resolutions. Its changes were narrowed back to these two leaf data packages and the frozen reinstall passed. Intermediate test runs during installation encountered missing modules. Final verification uses the repaired frozen installation.
- Configured Node instrumentation and Sentry's Node SDK for native server loading using Next.js `serverExternalPackages`, addressing their dynamic-require bundling warnings. Runtime Sentry monitoring remains present. The release/map publication plugin is enabled when `SENTRY_AUTH_TOKEN` is configured. Local qualification runs used an empty publication token, so that optional build plugin was disabled. This is an explicit build-feature configuration decision. The Sentry runtime SDK and framework integration continue to load.
- RTH now loads next-intl's supported CommonJS plugin export through `createRequire`. The ESM plugin imported an optional extractor dependency whose dynamic import webpack could not trace for its cache. The CommonJS entry preserves next-intl's configuration through its public package export.

## Evidence

`final-gates.json` records the actual final commands, timestamps and exit codes. Each named gate has its own log. The sequence stops on a failed gate and supports resuming after correction. Initial failures and interrupted builds are retained separately.

Runtime artifacts include `progress-remote-before-results.json`, `progress-remote-results.json`, `progress-browser-results.json`, `browser-nontutorial-before-results.json`, `browser-nontutorial-results.json` and `security-http-negative.json`.

Counts from overlapping targeted suites must be interpreted individually. Public login axe results cover those pages and viewports. The progress browser probes exercise API navigation in Chromium. Existing tutorial authoring and content delivery evidence remains in its prior reports.

## Migration provenance

The read-only reconciliation matched 20 of 22 applied migration hashes to current SQL, including three matches explained by LF/CRLF differences. Two applied hashes have no match in the current tracked SQL artifacts. The timestamp-based runner would select `0030_event_outbox` next. The approved manual progress patch has its own SQL hash and committed database receipt under `.evidence/continuation-20261112/`.

The remaining two historical hash origins require the original artifacts or matching repository history. They were preserved in `migration-reconciliation.json`. Database history was left intact. Generic migration execution requires reconciliation of that history and the recorded manual patch.

## Docker disposition

The owner assigned image creation and deployment to themselves during this continuation. A local image build was started before that instruction and cancelled when requested. Image inspection confirmed that `quiz-qualification-shc:1dbc19c0` was absent. Intermediate Docker build cache may exist. Docker Desktop was stopped after cancellation.

Source inspection found that local `.dev.vars`, environment variants and development artifact folders could enter the Docker context. `.dockerignore` now excludes them. Image build, container health/restart and deployment qualification remain with the owner.

## Acceptance boundaries

Marketing Q22 remains HOLD. The two unresolved historical migration hashes and owner-assigned Docker qualification remain open. Full route-by-route Q01–Q48 acceptance continues to depend on its original requirement definitions and the canonical ledger. The ledger hash is `7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e`.

## Final quality gates

## Eight-item completion register

This register answers the owner's eight-item handoff against the executed evidence available on 12 November 2026. Completion applies to the stated verification boundary.

| Item | Status | Executed evidence and remaining work |
| --- | --- | --- |
| 1. Login verification | COMPLETE for SHC credential submission | Six Chromium tests cover JavaScript disabled, delayed hydration, forced native POST, hydrated button/Enter submission and safe errors. Synthetic credential canaries were checked against URLs, referrers and browser logs. The real page and hydration executed. Authentication replies were intercepted in the hydrated submission tests. Evidence remains in `../critical-v4-20261111/Q08_LOGIN_VERIFICATION.md`. |
| 2. Questions end-to-end authorization | COMPLETE for the diagnosed read-authorization flow | Sixteen real HTTP probes through local SHC BFF, gateway, identity and backend passed, including authorized administrator success and unauthorized token/header cases. The designated administrator was validated by read-only account lookup. Tokens were signed in memory. This qualifies the observed Questions 401 correction and read flow. Mutating Questions CRUD and every role/account lifecycle transition have their own outstanding route-level criteria. Evidence remains in `../continuation-20261112/questions-normal-runtime.log`. |
| 3. Listed existing test/typecheck failures | COMPLETE | The five stale progress cases were corrected and strengthened. The final progress suite passed 23 tests. Retired-content, route-signature, fixture, hierarchy, gateway and export-status test corrections are recorded across the two continuation reports. Final app/API/database typechecks passed. |
| 4. Lint, typechecks and builds | COMPLETE for the scoped applications and stated shared checks | SHC Admin, SUIA Web and RTH Web each passed production build, typecheck and lint with zero warnings. API server and database-package typechecks passed. SHC boundary checks passed. Commands and final log checks are recorded in `final-gates.json` and `FINAL_VERIFICATION.json`. |
| 5. Progress migration design and approved correction | COMPLETE for tutorial_progress | The owner approved direct execution on the empty remote development table. Tenant column, check constraint and tenant/user/subtopic uniqueness were applied with locked preconditions, transactional rollback rehearsal and verified receipt. Eleven real PostgreSQL probes and eight Chromium/BFF/backend persistence probes passed. Synthetic cleanup was verified. The separate tutorial_navigation_progress identity-key issue and historical migration provenance remain open. |
| 6. Remaining security checks | PARTIAL overall, targeted critical probes PASSED | Executed fixture-production gating, membership/ownership/session guard tests, CSRF, signed-worker cryptography and twenty live HTTP denials passed in their documented selections. These results do not cover every HTTP method, existing endpoint, current-account transition or full real login/refresh/logout/revocation journey across all three apps. The broader Q16/Q24/Q25/Q28/Q29/Q32/Q33/Q36/Q37/Q39/Q41 route/security matrix remains to be reconciled and executed where evidence is absent. |
| 7. Hierarchy ownership, engineering and accessibility | PARTIAL overall, scoped corrections COMPLETE | Five hierarchy create/update paths now delegate to the existing service and 77 focused tests passed in the prior continuation. Public login desktop/mobile accessibility probes passed for all three apps. Graphify refresh completed. Real hierarchy delete/FK/concurrency and cross-database rollback qualification, wider engineering ownership review and broader authenticated-page accessibility remain outstanding under their original requirements. |
| 8. Evidence reconciliation | PARTIAL overall, current delta UPDATED | Final command/runtime evidence and this eight-item register are synchronized. Canonical SHC CSV remains at its prior hash pending owner acceptance. Twenty of 22 migration hashes match current source. Two historical artifacts remain unidentified. The wider Q01–Q48 register still needs final criterion-by-criterion reconciliation. Marketing is HOLD and Docker runtime qualification belongs to the owner. |

Items 1–5 are complete within these stated boundaries. Items 6–8 contain broader requirements with remaining evidence gaps. Overall three-app security and engineering acceptance remains pending those requirements and owner signoff.

The final build, typecheck and lint commands all returned exit 0 for SHC Admin, SUIA Web and RTH Web. Each lint command used `--max-warnings=0`. The final build logs contain zero compiler, dependency, cache, deprecation or browser-data warnings. `FINAL_VERIFICATION.json` independently checks the saved command receipts and scans the final logs for those diagnostics.

| Application | Production build | Typecheck | Lint |
| --- | --- | --- | --- |
| SHC Admin | PASS, zero warnings | PASS | PASS, zero warnings |
| SUIA Web | PASS, zero warnings | PASS | PASS, zero warnings |
| RTH Web | PASS, zero warnings | PASS | PASS, zero warnings |

API server and database-package typechecks passed. SHC's boundary checker passed. The final mocked progress suite passed 23 tests, the selected RTH regression suite passed 110 tests, and the SUIA suite passed 116 tests. The targeted SHC security run passed 65 tests and the backend authorization run passed 69 tests. These selections overlap earlier evidence.

Build retries found and corrected further faults after earlier successful compile stages. The initial SUIA program, faculty and sitemap failures, RTH plugin warnings and interrupted dependency-install test runs are retained in the earlier logs. The final successful runs use the frozen dependency installation and current source changes. Git whitespace verification passed.
