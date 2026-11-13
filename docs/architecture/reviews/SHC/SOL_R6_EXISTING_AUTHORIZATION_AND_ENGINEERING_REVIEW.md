# Sol R6-A existing authenticated authorization review

13 November 2026. Initial local main baseline 62f920f4782b8bbb277f88dc27930cd3b86f1b15. Final source hashes are in .evidence/r6-existing-p1/FINAL_SOURCE_MANIFEST.json. Sol owns A. Claude owns B/C and Gemini owns D under the latest owner allocation.

The reproduced authorization defects described below are corrected and bounded positive/negative tests passed. Full three-app authenticated authorization acceptance remains PARTIAL. The derived 195-method matrix has 30 PARTIAL, 161 PENDING and 4 N/A rows. Q48 remains OPEN. This review provides local execution evidence and does not confer release approval.

| Finding | Reproduced before | Corrected result and evidence |
| --- | --- | --- |
| Direct backend SHC account eligibility | Disabled, demoted and deleted accounts with stale signed admin tokens all reached question lookup 404. | Existing requireAdminRouteAccess now calls existing SHCAuthService.me. Real HTTP returns disabled 403, demoted 403, deleted 401. Unit cases cover authority outage 503, faculty/student denial, current-role demotion and token privilege ceiling. |
| RTH cancellation proxy admission | An eligible learner was rejected403 before the existing owner-checked handler. | Only exact DELETE UUID requests reach current persisted-session validation and existing service ownership. Actual populated owner cancellation 200, foreign cancellation 403 and retained foreign row. Adjacent methods, extra segments, hostile origin, anonymous and revoked sessions deny. |
| RTH cancellation error disclosure | Injected provider exception text appeared in the public 500 response. | Existing safe error helper returns opaque 500 with correlation and private/no-store. Existing typed ownership/missing outcomes retain403/404. |
| Quiz mutation ownership status | Foreign answer attempts returned 400 despite authorization denial. | Existing forbidden ApiError produces 403 before mutation in both actual portal paths. |
| Exam-question membership and idempotency ordering | A missing question within an owned exam returned success. An accepted idempotency key returned success for a foreign exam before ownership validation. | Existing engine checks current exam ownership and exam-question membership before idempotent acknowledgement or answer staging. Real populated answers persist and score. Foreign exam 403 and unrelated question 404 also hold with the accepted key. |
| Stale active exam cache | A cached started header admitted a new answer after current exam state became completed. | Answer entry requests current database state. Real completed-exam mutation rejects 400 while the previously accepted same-resource retry remains 200. This is an entry-state guarantee. Serializable answer-versus-completion concurrency is not qualified here. |
| Existing action-specific SHC RBAC | Existing admin grants already include delete/edit/publish. |26 real-signature guard tests cover established admin/super-admin positives, faculty/student negatives, controlled removal of each required action permission and hostile origin. These are unit/cryptographic boundary tests with controlled current authority. |

All HTTP targets were local processes. Browser-facing bases were http://skillhubcore.localhost:3007, http://skillup.localhost:3009 and http://realtutorialhub.localhost:3003. Transport went through the local gateway 8787 and/or backend 3000. SHC's existing forwarding adapter still supplies its canonical brand hostname as header context. That header value does not change the recorded local destination URL.

The HTTP harness uses headless Chromium contexts with actual password login and Playwright request calls. It does not claim new screen-rendering or tutorial-content journey evidence. Run-owned synthetic identities, exams, question hierarchy, progress, project submissions and session requests used the authorized remote development databases. Exact fixture cleanup was verified. The answer probe also removed and verified its exact remote cache keys. In-process caches disappear with the stopped backend process.

| Runtime receipt | Passed assertions | Fixture cleanup |
| --- | --- | --- |
| authenticated-http-results.json | 78/79 | Verified |
| quiz-positive-http-results.json | 4/4 | Verified |
| quiz-answer-http-results.json | 18/18 | Verified |
| shc-populated-http-results.json | 12/12 | Verified |
| shc-backend-http-results.json | 4/4 | Verified |

The main79-assertion learner run retains one SUIA own-result 500 during local cold-start memory pressure. A separate fresh-fixture warmed run returned 202 for each portal's own result, with real login and cleanup verified. This failure is preserved in authenticated-after.log and authenticated-http-results.json. It prevents claiming that the original run passed completely or that cold-start behavior is qualified.

The populated SHC test independently used real password login, an actual synthetic question and both BFF/gateway/backend reads 200. Current super-admin retained access. Disabling the account denied both BFF and backend. Demotion to faculty/student denied a backend DELETE and the question remained present. Its12 assertions passed and cleanup was verified.

Current backend guard regressions passed 48 tests, SHC action tests 26, SHC security 65, shared proxy/origin/configuration tests 28, RTH cancellation routes 9 and the targeted engine tests 15. These sets total 191 tests without counting the wider overlapping engine suite. The widened engine suite passed93/94 across 24 files and retains one report-generator default-URL failure. All failed initial and corrected rerun logs are preserved.

The report-generator failure is in exam.observer.tail.test.ts, which expects localhost 3002 while current source defaults to api.skillhubcore.in. Source inspection also finds a literal fallback internal credential in that existing observer. No report provider was invoked by this verification. The authoritative endpoint and missing-secret recovery contract need a focused disposition, recorded in OWNER_DECISIONS_AND_HOLDS.md. No complete exam-suite PASS is claimed.

Completed targeted quality gates and affected builds have overall state PASS. API_FINAL_RESULTS.json supersedes the earlier backend build for final exam changes. The three web builds retain their recorded final production-source applicability. Local build scripts used the existing isolated Project LLM execution mode and omitted external Sentry upload credentials.

| Gate | Exact command | Completed exit |
| --- | --- | --- |
| api-exam-regressions | `pnpm --filter @quiz/api-server exec vitest run src/modules/exam-engine/__tests__/exam.engine.tail2.test.ts src/modules/exam-engine/__tests__/exam.engine.test.ts --pool=threads --maxWorkers=1 --reporter=verbose` | 0 |
| api-typecheck | `pnpm --filter @quiz/api-server exec tsc --noEmit` | 0 |
| api-lint | `pnpm --filter @quiz/api-server exec eslint src/modules/exam-engine/exam.engine.ts src/modules/auth/admin-audience.util.ts --max-warnings=0` | 0 |
| shc-typecheck | `pnpm --filter @quiz/skillhubcore-admin type-check` | 0 |
| shc-lint | `pnpm --filter @quiz/skillhubcore-admin exec eslint src/lib/__tests__/r6-action-authorization.test.ts --max-warnings=0` | 0 |
| shared-source-lint | `pnpm exec eslint --config .eslintrc.json ../../src/share-branding/middleware/authProxy.ts --max-warnings=0` | 0 |
| rth-targeted | `pnpm --filter @quiz/realtutorialhub-web exec vitest run src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts src/app/api/tutorial/sessions/__tests__/routes.test.ts --environment=node --pool=threads --maxWorkers=1 --reporter=verbose` | 0 |
| rth-typecheck | `pnpm --filter @quiz/realtutorialhub-web type-check` | 0 |
| rth-lint | `pnpm --filter @quiz/realtutorialhub-web lint --max-warnings=0` | 0 |
| suia-typecheck | `pnpm --filter @quiz/skillup-web type-check` | 0 |
| suia-lint | `pnpm --filter @quiz/skillup-web lint --max-warnings=0` | 0 |
| shc-boundaries | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | 0 |
| api-final-typecheck | `pnpm --filter @quiz/api-server exec tsc --noEmit` | 0 |
| api-final-lint | `pnpm --filter @quiz/api-server exec eslint src/modules/exam-engine/exam.engine.ts src/modules/auth/admin-audience.util.ts --max-warnings=0` | 0 |
| api-final-build | `pnpm --filter @quiz/api-server build` | 0 |
| skillhubcore-admin-build | `pnpm --filter @quiz/skillhubcore-admin build` | 0 |
| skillup-web-build | `pnpm --filter @quiz/skillup-web build` | 0 |
| realtutorialhub-web-build | `pnpm --filter @quiz/realtutorialhub-web build` | 0 |

The static SHC boundary checker verifies 80 handlers. Its result establishes guard placement and complements runtime tests. It does not qualify every authenticated business operation. The current inventory still contains 195 exported methods across151 route files with no additions/removals. Every prior matrix row is preserved, including OWNER HOLD. 27 rows receive new bounded case evidence. Complete endpoint role, enrollment, membership, resource and mutation permutations retain their PARTIAL/PENDING states.

Source changes follow the existing service boundaries. The proxy authenticates the browser session, the cancellation service retains ownership, the SHC backend uses the existing PeopleDB authority, and the exam engine owns exam/question eligibility. Existing typed errors and response helpers are reused. No lint rule or security guard was disabled. Tests were updated to verify precise underlying claim failures separately from the public401 contract. Controlled faulty-verifier injection demonstrates the independent RBAC class boundary. Historical fixtures that bypassed newly required ownership/membership were updated with explicit valid resources and stronger assertions.

| Changed source/test path |
| --- |
| `apps/realtutorialhub-web/src/app/api/tutorial/sessions/[requestId]/route.ts` |
| `apps/api-server/src/modules/auth/admin-audience.util.ts` |
| `apps/api-server/src/modules/auth/__tests__/batch-08-admin-verification.test.ts` |
| `apps/api-server/src/modules/auth/__tests__/fixture-02-admin-guard.test.ts` |
| `apps/api-server/src/modules/exam-engine/exam.engine.ts` |
| `apps/api-server/src/modules/exam-engine/__tests__/exam.engine.branch.gap.test.ts` |
| `apps/api-server/src/modules/exam-engine/__tests__/exam.engine.branch.test.ts` |
| `apps/api-server/src/modules/exam-engine/__tests__/exam.engine.tail2.test.ts` |
| `apps/api-server/src/modules/exam-engine/__tests__/exam.engine.test.ts` |
| `apps/api-server/src/modules/exam-engine/__tests__/exam.phase3.test.ts` |
| `src/share-branding/middleware/authProxy.ts` |
| `src/share-branding/middleware/__tests__/r6-session-cancellation.test.ts` |
| `apps/skillhubcore-admin/src/lib/__tests__/r6-action-authorization.test.ts` |
| `apps/realtutorialhub-web/src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts` |

The baseline manifest omitted root shared-source files. The shared proxy is separately identified against the R5 source-safety receipt and its final hash is recorded with the new test paths. The initial read-only Git provenance commands were executed before the attachment's literal ban was read. This execution deviation is disclosed. Subsequent provenance uses file hashes. The canonical SHC ledger hash matches its baseline. Held source files, identity schema and hierarchy coordination received no R6-A edits.

graphify update . completed with its actual receipt. Its parser/cache/community-label warnings are preserved in graphify-update.log. Its extraction omissions and stale semantic labels limit graph completeness. No paid semantic-label refresh was performed. Source inspection and executable tests carry the acceptance evidence.

R6-B identity investigation, R6-C automatic continuation proposal and R6-D recovery tests/runbook remain with their assigned models. Attendance, payments, Marketing and broad accessibility/performance retain OWNER HOLD. The Q01–Q48 R6-A delta, engineering exceptions and derived matrix reside in .evidence/r6-existing-p1. Owner acceptance and release controls retain their own gates.
