Yes—I understand the task now: continue the existing repository audit in one coordinated review, divided into phases, without treating the audit as complete until the remaining areas and evidence checks are covered.

I’ll use `FinalAechitecture.md` and `ProjectAuditReport.md` as the audit’s governing references. The next review sequence you specified is:

1. Remaining SkillUp and RTH admin details and mutation handlers.
2. API-server service and repository layers.
3. Test coverage for the findings already identified.

I’ll preserve the audit’s evidence standard: distinguish what the code shows, what tests demonstrate, what is inferred, and what remains unverified. I won’t turn an untested concern into a confirmed vulnerability or claim the repository was inspected when it wasn’t.I have confirmed the repository reference from the audit document: [`skillupitacademy-alt/SUIA_RTH_SHC`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC?utm_source=chatgpt.com), branch `main`. I can access it through the connected GitHub integration.

The first source pass has already surfaced additional concrete issues in SkillUp’s admin mutation paths and the API-server auth repository. I’m separating those from the audit’s existing findings rather than silently folding them together. I have not modified the repository or run its tests.## Audit continuation — findings from this source pass

This is a read-only continuation, not an audit sign-off. I reviewed the SkillUp admin route handlers, the shared SkillUp admin BFF/guard, selected API-server auth services and repositories, and the corresponding test sources.

### Phase 1 — SkillUp/RTH admin details and mutation handlers

| Finding                                                                              | Severity                                         | Source evidence and assessment                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SUA-ADMIN-01 — Shared default student password                                       | High                                             | Student creation and enquiry admission hash the literal password `SkillUp@2025` for newly created accounts. If those accounts can authenticate with that password and it is not forced to change, a shared credential creates a serious account-takeover risk. Replace it with a one-time activation or password-setup flow.                                                                                     |
| SUA-ADMIN-02 — Form-compatible mutations lack a visible CSRF defense                 | High, conditional on browser/cookie reachability | `parseJsonOrFormBody()` accepts form submissions. The admin proxy validates the cookie token and roles but does not visibly validate Origin/Referer or a CSRF token. The source supports a CSRF concern; deployed cookie/origin behavior still needs runtime verification.                                                                                                                                       |
| SUA-ADMIN-03 — Payment update does not bind the installment to the submitted student | High                                             | `POST /api/admin/payments` searches by `paymentInstallments.label`, then updates the matching row by its ID. `userId` is only used on the insert path. If labels are not globally unique, the mutation can mark another student’s installment as paid or return another student’s installment as idempotent. Match on the student and installment identity, and enforce the intended uniqueness in the database. |
| SUA-ADMIN-04 — Batch capacity reservation can fail open                              | High for capacity integrity                      | `BatchCapacityService.reserveSlot()` returns `true` when Redis is unavailable or throws, provided the previously read snapshot showed capacity. That path does not reserve atomically. Concurrent enrollment requests can therefore exceed capacity. The database enrollment write and Redis counter are also separate operations.                                                                               |
| SUA-ADMIN-05 — Batch capacity cache and database counts can diverge                  | Medium                                           | Batch creation and updates seed the capacity cache asynchronously; enrollment mutations separately update database `enrolledCount`. Failures and concurrent operations can leave the cache and database inconsistent. Use a durable authoritative reservation mechanism and reconciliation.                                                                                                                      |
| SUA-ADMIN-06 — CSV exports need formula-injection protection                         | Medium                                           | The payment export constructs CSV rows with `.join(',')` and does not neutralize formula-leading values. The audit-log export quotes values but also lacks formula neutralization. Use a CSV serializer and neutralize spreadsheet formula prefixes. This confirms the existing audit concern.                                                                                                                   |
| SUA-ADMIN-07 — Admission event delivery is silently best-effort                      | Medium, if the event is required                 | The admission handler catches event publication failures and continues returning success. That can leave the database admission complete while downstream consumers never receive the event. Use an outbox/retry mechanism if downstream processing is part of the admission contract.                                                                                                                           |

Source files reviewed:

- [SkillUp student creation](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/app/api/admin/students/route.ts?utm_source=chatgpt.com)
- [SkillUp student update](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/app/api/admin/students/%5Bid%5D/route.ts?utm_source=chatgpt.com)
- [SkillUp student enrollment](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/app/api/admin/students/%5Bid%5D/enroll/route.ts?utm_source=chatgpt.com)
- [SkillUp payment mutation](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/app/api/admin/payments/route.ts?utm_source=chatgpt.com)
- [SkillUp payment detail mutation](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/app/api/admin/payments/%5Bid%5D/route.ts?utm_source=chatgpt.com)
- [Batch capacity service](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-people/src/batch-capacity.service.ts?utm_source=chatgpt.com)
- [SkillUp admin BFF](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/lib/admin-bff.ts?utm_source=chatgpt.com)
- [SkillUp admin proxy](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/proxy.ts?utm_source=chatgpt.com)

The RTH documentation endpoint finding remains in scope: its path resolution allows escaping `docs/` while checking only that the resolved path begins with the application root. That is a local-file exposure risk for an authenticated caller able to reach the endpoint. The earlier audit’s recommended strict docs-directory containment and route-level authorization remain applicable. [RTH docs route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-admin/src/app/api/admin/docs/route.ts?utm_source=chatgpt.com)

### Phase 2 — API-server service and repository layer

| Finding                                                                                                    | Severity    | Source evidence and assessment                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-RBAC-01 — Admin verification falls back to token claims when the database check fails or finds no user | High        | `_verifyAdmin()` returns `isAdminInToken` when the user row is missing and also falls back to token roles on a database exception. This makes database unavailability or missing brand-user records insufficient to deny privileged access.                                                                 |
| API-AUTH-01 — Refresh rotation is not atomic                                                               | High        | `TokenRefreshService.refresh()` reads the old session, updates its last-used time, revokes it, verifies the token, generates replacements, and stores the new session through separate operations. Concurrent refreshes can race; an intermediate failure can strand the user without a usable replacement. |
| API-AUTH-02 — Revoked-token reuse is not distinguishable through `findByHash()`                            | Medium/High | The repository lookup filters for `revoked = false`. A revoked token therefore returns no session before the service can inspect the `revoked` property. The service cannot reliably distinguish a revoked-token replay from an unknown token using this lookup.                                            |
| API-AUTH-03 — `revokeOtherSessions()` revokes the current session before restoring it                      | High        | The repository first revokes all active sessions for the user, then un-revokes the row matching the token hash. The first update has no exclusion predicate, and the second operation is not owner-scoped. A failure between operations can revoke the current session too.                                 |
| API-AUTH-04 — Session revocation by ID is not owner-scoped                                                 | High        | `GlobalLogoutService.revokeSession(userId, sessionId, ...)` calls `revokeById(sessionId)`, whose update predicate only uses the session ID. The authenticated user ID is not part of the actual mutation predicate.                                                                                         |
| API-ADMIN-01 — User-list total count ignores most active filters                                           | Medium      | `DrizzleAdminUserRepository.findAll()` applies search, role, blocked, verified, and status filters to the result query, but the count query only applies the deleted/active condition. The returned total can disagree with the filtered result and distort pagination.                                     |

Source files reviewed:

- [RBAC service](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/rbac.service.ts?utm_source=chatgpt.com)
- [Token refresh service](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/token-refresh.service.ts?utm_source=chatgpt.com)
- [Token repository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/token.repository.ts?utm_source=chatgpt.com)
- [Global logout service](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/global-logout.service.ts?utm_source=chatgpt.com)
- [Admin user repository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/repositories/implementations/drizzle-admin-user.repository.ts?utm_source=chatgpt.com)

These reinforce several findings already present in `ProjectAuditReport.md`; they should be cross-referenced and deduplicated in the final register rather than counted as unrelated new issues.

### Phase 3 — Test-source coverage review

The test source confirms important gaps and, in some cases, encodes the unsafe behavior as expected:

- `rbac.service.test.ts` explicitly expects `_verifyAdmin()` to return `true` when the user row is missing.
- The same suite expects database-error fallback to token claims to authorize.
- `token.repository.test.ts` checks that repository methods are called, but does not assert owner-scoped predicates or atomic “revoke all except current” behavior.
- `token-refresh.service.coverage.test.ts` exercises successful refresh paths, but does not establish race safety, replay detection, or rollback/compensation behavior.
- The SkillUp admin route test suite invokes route handlers directly with `x-user-roles: admin`. It covers happy-path CRUD and a role rejection, but does not exercise the browser-facing proxy/CSRF boundary or the payment ownership collision and capacity-concurrency cases above.

Sources:

- [RBAC tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/__tests__/rbac.service.test.ts?utm_source=chatgpt.com)
- [Token repository tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/repositories/__tests__/token.repository.test.ts?utm_source=chatgpt.com)
- [Refresh service tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/__tests__/token-refresh.service.coverage.test.ts?utm_source=chatgpt.com)
- [SkillUp admin route tests](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-admin/src/app/api/admin/__tests__/routes.test.ts?utm_source=chatgpt.com)

Test execution status: these are source-level observations only. I have not executed Vitest, integration tests, browser CSRF tests, concurrency tests, or live deployment checks.

## Phased continuation and closure criteria

To finish this audit without confusing a source review with verification, I would structure the remaining work as follows:

1. Admin mutation completion: inventory and inspect every remaining SkillUp/RTH admin mutation; trace each write through its helper/service/query; verify brand scope, ownership, validation, CSRF, transaction boundaries, and event side effects.
2. API-server service/repository completion: trace each existing finding from route → service/engine → repository → DB predicate; inspect transaction semantics, uniqueness constraints, and brand context propagation.
3. Finding-specific test audit: map each finding to existing tests; identify tests that are absent, weak, or assert unsafe behavior; define regression tests for ownership, brand isolation, CSRF, race conditions, fail-closed behavior, and state transitions.
4. Evidence and severity reconciliation: deduplicate findings, retain conditional qualifiers, and distinguish source-confirmed defects from unverified deployment conditions.
5. Final audit report: publish the prioritized remediation register and unresolved verification list. The audit remains open until the remaining source areas and required runtime/test evidence are addressed.

Current checkpoint: this pass adds findings and confirms test-source gaps, but it does not complete the full remaining admin inventory or all API-server service/repository traces. The audit remains pending.

## Audit continuation — small phase 1.1

I’ll keep this deliberately narrow: one source file at a time, tracing the handler’s input, authorization, query predicates, state changes, response, schema constraints, and test coverage. No repository changes.

### File under review

`apps/skillup-admin/src/app/api/admin/payments/route.ts`

This file implements `GET` and `POST`. I reviewed the complete handler against the payment table schema and the existing SkillUp admin route tests.

### Line-by-line review

| Lines | Code behavior                                                                                              | Audit observation                                                                                                                                                                                                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–7   | Imports request, Zod, data helper, BFF guards, DB table, and `eq`.                                         | Direct DB writes are performed from the admin BFF route. That can be acceptable, but the route must enforce the correct tenant/brand and ownership conditions itself or through trusted helpers.                                                                                                                  |
| 9–16  | Defines `paymentSchema`: `userId`, `studentName`, `installmentId`, `amount`, `dueDate`, `paymentRef`.      | The schema validates shape, not authorization or ownership. `studentName` is caller-supplied and is not a reliable identity binding. `dueDate` is only a minimum-length string; no date-format validation is present. `amount` is nonnegative, but no integer or currency-unit constraint is applied.             |
| 18–22 | `GET` checks `requireAdminOrForbidden()` then returns `listAdminPayments()`.                               | The route-level guard checks role only. The query helper’s brand filtering is a separate requirement; the audit has already identified inconsistent SkillUp platform scoping in this data layer.                                                                                                                  |
| 24–29 | `POST` checks the same guard, parses JSON or form data, and returns a parsing error if invalid.            | This route inherits the previously identified form/CSRF concern: the parser accepts form data, while the visible guard does not perform an Origin/Referer or CSRF-token check. This is a source-level concern; browser cookie behavior still needs runtime verification.                                          |
| 31–40 | Searches for an existing installment using only `paymentInstallments.label`.                               | Ownership is not part of the lookup. The submitted `userId` is not used to scope the existing record. The schema has no unique constraint on `label`, so the lookup can also be ambiguous if labels collide.                                                                                                      |
| 42–52 | If the matching row is already paid with the same `paymentRef`, returns an idempotent response.            | The idempotency check is likewise based on label + payment reference, not student ownership. A collision can return an idempotent success for a row belonging to another student.                                                                                                                                 |
| 54–67 | If a row exists, updates it to `paid` by row ID. Otherwise inserts a new payment using submitted `userId`. | Existing-row update does not verify that the row belongs to the submitted student. The insert relies on the FK for existence but does not verify that the user is a SkillUp identity. There is no transaction or uniqueness constraint to prevent concurrent duplicate inserts for the same intended installment. |
| 69–78 | Returns the update/insert result with `studentName`, `amount`, and `dueDate` copied from the request.      | For an existing row, the DB update changes only `status` and `paymentRef`, but the response presents the submitted amount/date as if they were saved. For inserts, `amount` is stored as `Math.trunc(amount)` but the response returns the original number. This can create API/DB disagreement.                  |

### Schema cross-check

`packages/db-people/src/schema/payment-installments.ts` defines:

- `id` as primary key.
- `studentUserId` as a required FK to `users.id`.
- `label`, `dueDate`, `amount`, `status`, and `paymentRef`.
- An index on `(studentUserId, dueDate)`.

The schema does not define a unique key for `(studentUserId, label)` or another installment identity. That supports the duplicate/race concern. The FK verifies that a user row exists; it does not, by itself, establish that the user belongs to SkillUp.

### Existing test coverage for the first file

The route test `records payments idempotently and exports CSV` verifies:

- A new payment returns `idempotent: false`.
- Repeating the same request returns `idempotent: true`.
- The export endpoint responds as CSV.

It does not test:

- Same installment label across two students.
- Same payment reference attached to a different student.
- Concurrent requests creating the same installment.
- Existing-row response values against persisted values.
- Cross-brand `userId` submission.
- Form-based cross-origin mutation behavior.

The test therefore exercises the happy-path idempotency behavior, but does not establish that the idempotency key is ownership-safe or race-safe.

Phase 1.1 assessment: the source confirms a payment ownership/idempotency weakness and a schema-level uniqueness gap. The exact exploitability depends on real data uniqueness and route reachability, which I have not tested. I am recording this as source-confirmed unsafe query construction, with impact qualified by data conditions—not as a demonstrated cross-student exploit.

## Audit continuation — small phase 1.2

Next I’m reviewing the companion handler:

`apps/skillup-admin/src/app/api/admin/payments/[id]/route.ts`

This is the detail `GET` and `PATCH` path. It is important to examine separately because it mutates a payment by path ID rather than by the submitted student/installment pair.### Line-by-line review — payment detail handler

| Lines | Code behavior                                                                               | Audit observation                                                                                                                                                                                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–10  | Imports DB/event helpers and defines the PATCH schema.                                      | `amount` accepts any nonnegative number, then later truncates it. `dueDate` is only checked for minimum length, not a valid date. The schema requires `paymentRef` even when status is changed to `due`.                                                                                                                                                                   |
| 12–14 | Defines route context with `params: Promise<unknown>`.                                      | This is cast later rather than validated. The framework normally supplies the route parameter, but explicit validation would make the handler contract clearer.                                                                                                                                                                                                            |
| 16–29 | `GET` checks admin role, reads `id`, calls `getAdminPaymentDetail(id)`, and returns it.     | The route does not bind the record to SkillUp. The helper also filters only by payment ID, with no `users.platform = 'skillup'` predicate.                                                                                                                                                                                                                                 |
| 31–36 | `PATCH` checks admin role, extracts the ID, and parses the body.                            | It inherits the form/CSRF concern from `parseJsonOrFormBody()`. The ID is not checked for UUID format before use.                                                                                                                                                                                                                                                          |
| 38–48 | Updates label, amount, due date, payment reference, and status by `paymentInstallments.id`. | The mutation predicate is only the payment ID. There is no SkillUp platform predicate, no ownership check, and no workflow/state-transition guard. A caller with the route’s admin access can change payment details and move a record among `paid`, `due`, and `overdue`. Whether that is intended requires a business policy; the handler currently does not encode one. |
| 50–52 | Returns 404 if no row was updated.                                                          | Correct for a missing ID, but does not distinguish an out-of-brand ID because the query does not scope by brand.                                                                                                                                                                                                                                                           |
| 54–55 | Reloads detail after mutation.                                                              | The reload uses the same ID-only query and is not tenant-scoped.                                                                                                                                                                                                                                                                                                           |
| 57–72 | If status is `overdue`, calculates days overdue and publishes an event.                     | Every PATCH that leaves/sets status as `overdue` can emit another event. There is no transition check such as “emit only when status changes from non-overdue to overdue,” and no idempotency key is visible. Event publication is fire-and-forget and failures are swallowed, so the DB mutation can succeed without event delivery.                                      |
| 74    | Returns `{ updated: true, detail }`.                                                        | The success response does not indicate whether event delivery succeeded. That may be acceptable for an asynchronous event contract, but the delivery guarantee should be explicit.                                                                                                                                                                                         |

### Data-helper cross-check

`getAdminPaymentDetail()` in `apps/skillup-admin/src/lib/skillup-admin-data.ts`:

- Joins payment installment → user → user profile.
- Filters only on `paymentInstallments.id`.
- Does not add a `users.platform = 'skillup'` condition.
- Returns a payment detail for any matching user in the shared people database.

This reinforces the existing SkillUp data-scope finding. The ID-only predicate is not itself proof that a cross-brand record is reachable in the deployed app, but the source does not enforce the brand boundary in this query.

### Test coverage

The current route test checks that a payment detail can be loaded and patched, and that marking it overdue publishes an event. It does not cover:

- Updating a non-SkillUp payment ID.
- Invalid/malformed route IDs.
- Allowed versus forbidden payment status transitions.
- Repeated overdue PATCH calls and duplicate event delivery.
- Event publication failure behavior.
- Correct `overdueByDays` calculation for future dates, timezone boundaries, or invalid dates.
- Whether the DB update and returned detail are consistent after numeric truncation.

### Phase 1.2 assessment

Source-confirmed concerns:

1. Payment detail reads and writes are ID-scoped but not visibly SkillUp-scoped.
2. The handler allows payment state and payment metadata changes without an explicit transition policy.
3. Overdue event emission is not visibly transition-idempotent.
4. Event failure is silently ignored after the DB mutation.

These are code-review findings, not runtime exploit demonstrations. No tests have been run and no files have been changed.

Next small phase: review `apps/skillup-admin/src/app/api/admin/students/[id]/route.ts` line by line, then its helper/query path, before moving to the enrollment mutation.

I’ll continue the audit in the small, file-by-file phases you requested, treating this as a principal-architect review rather than a quick scan.

This phase is blocked before code review: I attempted to retrieve `apps/skillup-admin/src/app/api/admin/students/[id]/route.ts` from the project’s `main` branch, but GitHub returned `404 Not Found`. Search also did not return a matching file. I won’t invent its contents or report line-level findings without seeing the source.Please provide that file by attaching it here or pasting its contents. I’ll then review it in the next phase, line by line, covering:

- What each block of code does
- Authentication and authorization boundaries
- Input validation and data integrity
- Brand/tenant isolation implications
- Error handling and runtime behavior
- Specific findings, severity, and recommended corrections

I’ll distinguish confirmed code findings from risks that require checking related files or runtime behavior. I’ll keep the scope to this one file before moving to the next.

I located the two project reference files and am using them as the audit baseline:

- `FinalAechitecture.md` — the target architecture principles: distinct RTH and SkillUp brand boundaries, shared SkillHubCore capabilities, secure identity/authorization, and reliable engineering controls.
- `ProjectAuditReport.md` — the existing audit record. It is a 2,912-line report, so I’ll treat its findings as prior work to reconcile against current source—not as proof that the entire requested app scope has been completed.

The three requested apps are present in the repository. Their package manifests are available on `main`:

- [RTH web](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/package.json?utm_source=chatgpt.com)
- [SkillUp web](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-web/package.json?utm_source=chatgpt.com)
- [SkillHubCore admin](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/package.json?utm_source=chatgpt.com)

I’ll audit the application code, not just these manifests. The previous route paths recorded in the audit report currently return `404` when fetched from `main`, so I’ll verify actual current paths before carrying old findings forward.

## Audit plan and boundaries

I’ll proceed in small phases and keep the review open until all three applications and their important dependencies have been examined.

| Phase | Scope                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 1     | App boundaries and package configuration                                                             |
| 2     | RTH web — source files, routes, auth, data access, caching, tests                                    |
| 3     | SkillUp web — same review dimensions, with parity checks against RTH                                 |
| 4     | SkillHubCore admin — privileged routes, authoring permissions, brand scoping, workflow state changes |
| 5     | Cross-app reconciliation, prioritized findings, and evidence gaps                                    |

For each source file, I’ll explain the code’s purpose and control flow, identify confirmed defects separately from conditional risks, and record the severity and recommended fix. I will not modify the repository or claim that tests ran unless they actually did.

### Existing findings to revalidate

The report already records concerns relevant to the requested apps, including:

- Authenticated tutorial content responses using `Cache-Control: public` despite containing learner-specific progress.
- An assignment completion service that may permit completion without enforcing the full tier prerequisite/state transition.
- A SkillHubCore Tutorial Composer sections-list endpoint that authenticates but may not enforce the intended authoring permission or brand/subtopic scope.

Those are previously reported findings, not yet reconfirmed against current `main` source. I’ll verify the live implementation before treating them as current defects.

The next phase starts with the RTH web app’s package configuration and source inventory, then proceeds to one source file at a time.

# Audit — Phase 1: RTH web foundation

Repository: `skillupitacademy-alt/SUIA_RTH_SHC`\
Branch reviewed: `main`\
Files examined in this phase: RTH web `package.json`, `next.config.mjs`, `tsconfig.json`, and `vitest.config.ts`.

This is a meaningful first phase—not the whole RTH web audit. I’m using the package and app configuration to establish how the application is built, tested, and secured before reviewing route and component behavior.

## 1. RTH web `package.json`

[Open source](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/package.json?utm_source=chatgpt.com)

| Lines / section | Review                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–4             | Package is named `@quiz/realtutorialhub-web`, private, version `0.1.0`. Naming is consistent with the monorepo app.                                                                                                                                        |
| 5–12            | Dev and build commands explicitly use webpack. This is a valid deliberate choice; it should be kept consistent with the team’s supported Next.js build path.                                                                                               |
| 13–16           | Lint, test, and type-check scripts exist. This is positive, but script existence alone does not prove that they pass or are enforced in CI.                                                                                                                |
| 17 onward       | The app imports shared auth, DB, events, API client, validation, and UI packages. This means app-level correctness depends on shared package contracts as well as local code.                                                                              |
| Dependencies    | `next` is `16.1.6`, while `eslint-config-next` is `15.2.0`. This is a version-parity risk: the lint rules/configuration may not fully reflect the installed Next 16 behavior. It is not, by itself, proof of a build defect.                               |
| Dependencies    | The app has several telemetry and runtime packages, including Sentry, Serwist, QStash, Redis, and Vector. Their runtime use and secret handling must be inspected in the relevant source files; package presence is not evidence of correct configuration. |

### Finding RTH-FND-01 — Next / ESLint config version skew

- Severity: Medium — tooling compatibility risk
- Evidence: `next` is `16.1.6`; `eslint-config-next` is `15.2.0`.
- Potential impact: Lint may not validate the app against the same framework version it builds and runs.
- Recommended action: Align `eslint-config-next` to the project’s intended Next version, or document and test the reason for retaining the older configuration.
- Validation status: Confirmed from the manifest; lint behavior not executed.

## 2. RTH web `next.config.mjs`

[Open source](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/next.config.mjs?utm_source=chatgpt.com)

| Lines / section | Review                                                                                                                                                                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–5             | Loads bundle analyzer, Sentry, Serwist, and next-intl plugins. This makes plugin order and generated configuration relevant to deployment behavior.                                                                                                                                                  |
| 7–9             | Bundle analyzer is enabled only when `ANALYZE=true`. This is appropriately conditional.                                                                                                                                                                                                              |
| 11–13           | API base URL is normalized by removing `/api` and trailing slashes. The fallback is the RTH API hostname. This should be checked against all supported gateway URL formats when reviewing API clients.                                                                                               |
| 16–18           | `output: 'standalone'` is conditional on `CLOUD_RUN_BUILD`. Deployment configuration must set this consistently with the container runtime.                                                                                                                                                          |
| 19              | Shared packages are explicitly transpiled. This is useful in a workspace, but the list must remain aligned with packages consumed by this app.                                                                                                                                                       |
| 20–37           | Webpack suppresses a narrow `next-intl` warning and reduces infrastructure logging. The suppression is specific, not a blanket warning disable; still, it could mask a parsing issue if the dependency behavior changes.                                                                             |
| 38–46           | Remote image access is limited to the RTH CDN host and `/content/**` path. This is a positive restriction compared with unrestricted remote image domains.                                                                                                                                           |
| 48–55           | Builds CSP inputs from environment URLs and a fixed Cloudflare Insights URL. Runtime CSP correctness depends on those environment values being accurate.                                                                                                                                             |
| 57–65           | A no-cache header rule is defined for selected learner/account routes. This is directionally appropriate for personalized pages, but the route pattern and actual responses need runtime validation.                                                                                                 |
| 66–78           | General security headers are applied with `Content-Security-Policy-Report-Only`. Report-only CSP reports violations but does not block them. This may be an intentional rollout phase; it is not equivalent to enforced CSP.                                                                         |
| 79–93           | Serwist service worker is enabled for production, with navigation caching enabled. This is an important review target: authenticated pages and learner-specific responses must not be cached in a way that leaks data across users or sessions. The configuration alone does not prove such leakage. |
| 95–97           | next-intl plugin is configured with a request module. Its locale routing and request behavior need review in the relevant app files.                                                                                                                                                                 |
| 99 onward       | Sentry wrapper uses a tunnel route and hides source maps. These are useful controls, but the tunnel route and client reporting should be checked for abuse/rate-limit implications later.                                                                                                            |

### Finding RTH-FND-02 — API cache-control override is commented out

- Severity: High / conditional — requires response-path validation
- Evidence: Lines 57–64 contain a commented-out `/api/(.*)` `Cache-Control: no-store` rule, with comments stating it was temporarily disabled for an experiment.
- Potential impact: This config no longer provides a blanket no-store policy for API routes. Sensitive API responses could still be protected by route-level headers, gateway behavior, or other middleware; this file does not establish that.
- Recommended action: Inspect actual API route response headers and any middleware/gateway cache policy. Reinstate a safe default for authenticated or user-specific API responses, with explicit exceptions only where public caching is intended.
- Validation status: The disabled rule is confirmed. No live response headers have been tested.

### Finding RTH-FND-03 — Service-worker navigation caching needs an auth-aware audit

- Severity: High / conditional — data-isolation risk
- Evidence: Lines 79–93 enable Serwist in production and set `cacheOnNavigation: true`.
- Potential impact: If navigation caching stores authenticated or user-specific responses without suitable partitioning or exclusion, stale/private content could be served after account changes or across sessions.
- Recommended action: Review `src/app/sw.ts` and the cache rules. Explicitly exclude authenticated HTML/API responses or prove a safe cache strategy with tests covering sign-in, sign-out, user switching, and private learner pages.
- Validation status: Configuration observed; actual cache behavior not yet verified.

### Finding RTH-FND-04 — CSP is currently report-only

- Severity: Medium — hardening gap unless intentionally staged
- Evidence: Lines 69–77 set `Content-Security-Policy-Report-Only`.
- Potential impact: CSP violations are reported rather than enforced. XSS protection from CSP is therefore not active in the browser.
- Recommended action: Confirm whether this is a deliberate monitoring stage. Review reports, then plan enforcement with a tested policy and documented rollout.
- Validation status: Confirmed in source; policy intent and report data not available in this review.

## 3. RTH web `tsconfig.json`

[Open source](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/tsconfig.json?utm_source=chatgpt.com)

The file extends the root TypeScript configuration and adds app-level path aliases for `@/*`, shared branding, and multiple `@quiz/*` packages.

Architectural observation: the app can import shared package source directly through aliases. This can be beneficial in a monorepo, but it increases the importance of keeping package exports, TypeScript aliases, and Next transpilation aligned. The file also includes shared branding paths outside the app directory, which means app-level type checking includes cross-app shared source.

No confirmed type-safety defect is established from this configuration alone. The next step is to compare aliases with actual imports and package exports rather than infer a defect from the number of mappings.

## 4. RTH web `vitest.config.ts`

[Open source](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/vitest.config.ts?utm_source=chatgpt.com)

- Uses React plugin and `vite-tsconfig-paths`.
- Uses `jsdom`, a setup file, and a 60-second test/hook timeout.
- Includes test/spec files under `src`.
- Runs with file parallelism disabled and one worker.

This is a deterministic testing setup, though it may be slower. A key coverage concern is that unit tests alone will not establish correctness for gateway auth, browser cookies, service-worker cache behavior, or production deployment headers. Those require targeted integration or E2E tests.

## Phase 1 conclusion

The RTH web app has a recognizable foundation: dedicated test/type-check/lint scripts, shared packages, a restricted image CDN, and security-header configuration. The configuration also exposes three areas that deserve priority in the source audit:

1. API cache policy: blanket API no-store behavior is currently commented out.
2. Service worker: production navigation caching is enabled and must be evaluated against authenticated user data.
3. CSP rollout: policy is report-only, so it is not currently enforcing browser restrictions.

These are code/configuration observations. I have not run the build, lint, type-check, tests, or live browser checks in this phase.

### Next phase

I’ll review the RTH web request/auth boundary next—middleware, auth/session helpers, API-client setup, and the actual route implementations. That phase will test whether the cache and brand-isolation concerns above are real in the request flow, rather than treating configuration signals as confirmed vulnerabilities.


## RTH Web audit — Phase 2: Request/authentication boundary

I’m continuing from the actual `main` branch source, not treating the earlier audit notes as proof. This phase covers the shared auth proxy used by RTH, the RTH service worker, and the tutorial/assignment access helpers. I have not modified files or run tests.

### Findings confirmed in the source reviewed so far

RTH-AUTH-01 — High: gateway-secret validation is fail-open when the secret is not configured.

In the shared `src/share-branding/middleware/authProxy.ts`, `hasValidGatewaySecret()` returns `true` if `INTERNAL_GATEWAY_SECRET` is absent or empty. That means this particular check does not reject a request when the expected secret is missing. Whether this is exploitable depends on which API routes rely on this check and what other authorization they enforce; the missing-secret behavior itself is present in code.

RTH-AUTH-02 — High: auth debug logging exposes token material.

The same file logs `tokenPrefix: token?.substring(0, 20)` in `[BFF_AUTH_DEBUG]`. It also logs whether a gateway secret exists and its actual and expected lengths. These logs should not contain access-token fragments or secret metadata; logging a prefix is unnecessary for normal auth diagnostics.

RTH-AUTH-03 — High, conditional: service-worker cache may serve a prior account’s tutorial response offline.

`apps/realtutorialhub-web/src/app/sw.ts` caches successful GET responses under `/api/tutorial/content/` and returns a cached response when network fetch fails. The cache key is the request, but the worker does not explicitly clear or partition this cache on logout, account change, or authorization change. If these endpoint responses contain user-specific or otherwise restricted data, this creates a cross-session disclosure risk on a shared browser profile. I’m treating the impact as conditional until I inspect the endpoint’s response/auth contract.

These are source-level observations, not a claim that I have reproduced an exploit. &#x20;

### RTH-AUTH-04 — High, conditional: authenticated tutorial endpoint returns a public-cacheable response

The legacy route `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts`:

- Calls `requireStudent(request)` before fetching content.
- Sends `X-Brand: realtutorialhub`, `X-User-ID`, and an internal-secret header upstream.
- Returns the upstream data with `Cache-Control: public, max-age=3600`.

That is a risky cache policy for an authenticated route. The route is marked deprecated and the source says production tutorial pages should use `/api/tutorial/sections/*`; that does not eliminate risk for callers still using this legacy route. If upstream content can vary by user or contain non-public material, shared caches could serve it across sessions. The policy should be reviewed and likely changed to a private/no-store strategy unless the response is demonstrably public and identity-independent.

Source: [RTH legacy tutorial content route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/src/app/api/tutorial/content/%5BsubtopicId%5D/route.ts?utm_source=chatgpt.com)

### Other code observations — not yet elevated to confirmed findings

- `requireStudent()` in `src/lib/assignment-auth.ts` verifies an access token and normalizes roles, but the accepted roles include `admin`, `super_admin`, and `faculty` alongside `student` and legacy `user`. That is broader than a strictly student-only helper name implies. Whether it is incorrect depends on the intended policy for the particular endpoint.
- `requireAssignmentAccess()` checks completion through `TutorialProgressRepository.isSubtopicComplete(user.userId, subtopicId)`. I have not yet traced that repository query to establish whether it is properly scoped and whether its “all 6 blocks” completion rule matches the current tutorial system.
- The `/api/tutorial/sections/[subtopicId]` route also authenticates, then forwards the user ID and fixed RTH brand upstream. It logs cookie names and request/response details. I have not yet verified the upstream API’s authorization and data filtering, so I am not claiming a brand-isolation defect there.
- The `withObservability` wrapper logs request ID, path, method, status, and duration; it attaches `X-Request-Id` to the response. This is useful for tracing, but I still need to check actual route coverage before accepting the comment that observability is “enforced globally.”

### Phase 2 status

The source-backed review has now covered:

1. RTH `src/proxy.ts` and its matcher.
2. Shared `authProxy.ts` used by RTH.
3. RTH service worker.
4. Observability wrapper.
5. Assignment auth helper.
6. Tutorial content, progress, assignment, and sections routes.

The most important next review is the actual current tutorial sections and progress authorization path, including the service/repository layer and the SkillHubCore upstream handlers. That is where I can verify user/brand scoping and determine whether the cache and completion concerns are exploitable or simply unsafe configuration. I’ll keep findings separated into confirmed source facts, conditional risks, and items requiring runtime or upstream verification.

## RTH audit — Phase 3: Progress authorization and tutorial data scope

This phase follows the earlier RTH BFF review into the shared database repository and API-server tutorial engine. I’ve reviewed the progress route, internal-auth middleware, progress schema/repository, and the tutorial engine/service source on `main`.

### Confirmed findings

RTH-AUTH-05 — Critical, conditional: API-server gateway mode trusts identity headers without validating a JWT or gateway signature in this middleware.

`apps/api-server/src/middleware/internal-auth.middleware.ts` accepts `x-user-id` plus `x-brand` as “Gateway Authentication” and returns an auth context. The code explicitly says JWT validation is skipped in this mode.

That is safe only if the API server is not directly reachable by untrusted clients and the gateway strips incoming identity headers and injects trusted values itself. If clients can reach this service directly—or spoof those headers through an insufficiently restrictive proxy—they could impersonate another user. I have not yet verified the deployed network boundary or gateway header-sanitization rules, so the exposure is conditional; the trust assumption in code is clear.

RTH-AUTH-06 — High: the internal-auth middleware logs secret previews and raw role headers.

The middleware logs:

- Raw `x-user-roles` values.
- The first 20 characters of the configured internal secret.
- The first 20 characters of the received and expected secret on mismatch.
- Secret lengths and comparison results.

These values are not needed for routine diagnostics. Secret previews and raw role values should be removed from logs, and any already-emitted secret fragments should be treated as potentially exposed in the logging system.

RTH-AUTH-07 — High: tutorial engine brand-access check is currently a placeholder that permits all access.

In `apps/api-server/src/modules/tutorial-engine/tutorial.engine.ts`, `validateBrandAccess()` currently returns `true` unconditionally. The comments explicitly mark brand visibility enforcement as a TODO.

The engine does pass the brand to content customization and progress tracking, but that does not substitute for authorization. The current method itself does not check the tutorial’s brand ownership or visibility. This is a confirmed missing control in this engine path; actual impact depends on whether this legacy engine path is reachable and what content it can retrieve.

RTH-AUTH-08 — High, conditional: progress records are scoped to user and subtopic, but not brand.

`packages/db-tutorial/src/schema/tutorial-progress.ts` defines progress identity as a unique `(user_id, subtopic_id)` pair. The repository’s `getProgress()` filters by user ID, subtopic ID, and non-deleted status, but has no brand predicate. `markBlockComplete()` and `isSubtopicComplete()` build on that user/subtopic record.

This may be intentional if a subtopic has one global progress identity across brands. If progress is expected to be independent for RTH and SkillUp, this schema/repository design allows a completion recorded under one brand to affect the other. The architecture decision needs to be explicit; the code currently does not encode brand-specific progress.

Source files:

- [Internal auth middleware](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/middleware/internal-auth.middleware.ts?utm_source=chatgpt.com)
- [Tutorial engine](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/tutorial-engine/tutorial.engine.ts?utm_source=chatgpt.com)
- [Tutorial progress schema](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/tutorial-progress.ts?utm_source=chatgpt.com)
- [Tutorial progress repository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/repositories/tutorial-progress.repository.ts?utm_source=chatgpt.com)

### RTH-AUTH-09 — High, conditional: legacy API content route also returns `public` cache headers

The API-server legacy route `apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts` independently sets:

```
Cache-Control: public, max-age=3600
```

It requires an `x-user-id` header and includes user progress in its response through `TutorialService.getContent()`. That makes the public cache policy especially concerning: the response is not necessarily user-independent. This reinforces the earlier RTH BFF finding. The API-server route also extracts identity and brand directly from headers without calling `validateRequest()` in the route itself. Its safety therefore depends on a verified upstream trust boundary, which remains unconfirmed.

Source: [API-server legacy tutorial content route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/tutorial/content/%5BsubtopicId%5D/route.ts?utm_source=chatgpt.com)

### Route/test discrepancy found

The repository tree currently shows:

- `apps/api-server/src/app/api/tutorial/sections/[subtopicId]/__tests__/route.test.ts`
- No corresponding `route.ts` at `apps/api-server/src/app/api/tutorial/sections/[subtopicId]/route.ts`

The test imports `GET` from `../route`. This suggests a possible missing route implementation or a test/source mismatch on `main`. I will not label it a confirmed runtime 404 until I verify the full route tree and deployment configuration; however, it is a concrete repository-integrity issue to investigate.

The RTH BFF route forwards to `/tutorial/sections/:subtopicId`, so this discrepancy matters directly to the learner tutorial path.

### Current phase conclusion

The most urgent items from the source reviewed are:

1. Remove secret previews and raw role headers from auth logs.
2. Verify and enforce the API-server trust boundary for `x-user-id` and `x-brand`.
3. Replace public caching on authenticated tutorial responses.
4. Implement brand visibility checks in the legacy tutorial engine or retire that path.
5. Decide whether learner progress is shared or brand-specific, then encode that choice consistently.
6. Resolve the tutorial sections route/test discrepancy before relying on that endpoint.

I’ll next inspect the actual tutorial delivery service/repository and its sanitization path, then continue into RTH’s assignment and ILS APIs. That will let me distinguish endpoint-level concerns from protections already enforced lower in the stack.

## RTH audit — Phase 4: Tutorial delivery and content sanitization

I reviewed the current `main` versions of:

- `packages/db-tutorial/src/services/tutorial-delivery.service.ts`
- `packages/db-tutorial/src/services/tutorial-content-sanitization.service.ts`
- `packages/db-tutorial/src/schema/tutorial-sections.ts`
- `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`
- The sanitization service tests

This phase is important because it shows that the current modular delivery service has meaningful protections. I’m separating those from weaknesses in the older tutorial-engine path.

### Positive controls verified

The current `TutorialDeliveryService`:

- Excludes soft-deleted tutorials.
- By default returns only `approved` or `deployed` content.
- Filters for shared content, brand-matching content, or content marked `shared_visible`.
- Validates stored JSON against `TutorialDocumentSchema` before delivery.
- Sanitizes the validated document before returning it.
- Selects a delivery-safe field set rather than returning all admin metadata.
- Checks publication/deletion and brand visibility for direct tutorial-ID delivery.

The `tutorial_sections` schema also has a partial unique index over `(subtopic_id, navigation_node_id, brand_id)` for non-deleted rows. This supports the page-aware content identity described in the schema.

These protections are real in this service; they should not be generalized to every route without checking that the route actually uses this service.

### RTH-CONTENT-01 — High, conditional: regex-based SVG sanitization is not a robust HTML/SVG security boundary

The sanitizer uses regular expressions to remove script elements, event attributes, `javascript:` references, data URLs, and `foreignObject`. That catches the specific patterns covered by its tests, but SVG is a structured markup language. Regex sanitization can miss malformed, encoded, or structurally unusual payloads.

The tests exercise many straightforward and mixed-case examples. They do not establish that all dangerous SVG constructs are safely handled. Because the delivery service treats this sanitizer as its security boundary, I recommend replacing or supplementing it with a maintained SVG/HTML sanitizer configured with a strict allowlist—or disallowing inline SVG and serving trusted generated assets instead.

This is a risk assessment based on the implementation approach, not a reproduced XSS exploit.

### RTH-CONTENT-02 — Medium: sanitizer only processes a narrow set of block fields

The current `sanitizeBlock()` handles:

- `diagram` blocks only when `diagramType === 'svg'` and sanitizes `diagramData`.
- `image` blocks by sanitizing `assetId`.

Other block types fall through without sanitization. The code comment says these are plain text unless they explicitly support HTML. That is safe only if every renderer consistently treats those values as text and never injects them as HTML, URLs, or executable markup. The renderer review is needed to verify that assumption.

### RTH-CONTENT-03 — Medium: URL sanitizer allows HTTP URLs

`sanitizeUrl()` allows `http:` URLs. The sanitizer’s own comments characterize HTTP as less safe, but the function does not enforce an HTTPS-only policy. This is not necessarily an XSS issue, but it allows mixed-content/resource downgrade behavior and may expose learners to untrusted external resources. A product policy should determine whether HTTP is required for legacy content or should be rejected.

### RTH-PROGRESS-01 — High, conditional: completion state remains global to user/subtopic

The repository uses a single progress row per `(userId, subtopicId)` and its reads/updates do not include brand. That matches the schema’s unique constraint. Therefore, progress is shared across brands if the same identity/subtopic is used by both.

This is a design decision rather than a defect if cross-brand progress is intended. If RTH and SkillUp need independent learning records, the brand must be part of the progress identity and the relevant APIs/repositories must pass it consistently.

### Important distinction: current delivery vs. legacy engine

The current `TutorialDeliveryService` does perform brand-visibility filtering. The earlier `TutorialEngine.validateBrandAccess()` still returns `true` unconditionally. These are different paths:

- Current modular delivery service: brand filter is implemented.
- Legacy tutorial engine: brand check remains a placeholder.

I will not treat the legacy engine finding as proof that the current delivery service lacks brand filtering. The remaining question is which routes and runtime consumers still call the legacy engine.

### Next phase

I’ll inspect the learner-side block renderers and API route wiring next, especially whether HTML/SVG/URL fields are rendered safely and whether the current delivery service is the one actually used by the RTH learner page. I’ll then continue through assignment and ILS endpoints, keeping the same source-based distinction between confirmed behavior and conditional risk.

## RTH audit — Phase 5: Learner route, BFF, and rendering boundary

The repository tree confirms that the RTH learner route and its BFF exist. It also confirms an important distinction: the newer page-aware route resolves runtime context through `resolveRuntimeContext`, while the older section BFF calls the centralized API server using the legacy `/tutorial/sections/:subtopicId` path.

I’m checking those paths separately rather than assuming that the newer delivery service protects the older API route. The source also shows that the learner page requires an `accessToken` cookie and then extracts a learner ID from request headers; the next question is whether that identity is cryptographically validated at the point those headers are trusted.

## Findings from this phase

### RTH-ROUTE-01 — High: API-server route target appears missing from `main`

The RTH BFF at:

`apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts`

calls:

`/tutorial/sections/${params.subtopicId}`

The repository tree contains a test under:

`apps/api-server/src/app/api/tutorial/sections/[subtopicId]/__tests__/route.test.ts`

but does not contain the corresponding `route.ts` at that location. A direct fetch of the expected route file also returned no file.

This is a source-tree discrepancy with potentially significant runtime impact: the RTH BFF is calling an API path whose matching Next.js route handler is absent in the current tree. Before declaring the live endpoint broken, we need to verify whether a separate router, rewrite, or deployment artifact serves that path.

### RTH-ILS-01 — Positive control: ILS routes use authenticated identity context

The inspected ILS write routes call `validateRequest(request, { requireInternalSecret: true })` before constructing an `AuthenticatedIdentity`:

- `block-visit`
- `block-active-time`
- `block-completion`
- `complete-node`

They then take `userId` and `brand` from the validated context rather than from the request body. The Zod schemas also explicitly exclude user identity and brand from the client payload.

The `complete-node` route is especially well designed in one respect: it does not accept `requiredBlocks` from the client. The service resolves requirements from canonical content and evaluates completion eligibility server-side.

### RTH-ILS-02 — Medium, conditional: hierarchy validation must be consistent across service methods

The service documentation describes validation of the navigation-node/subtopic relationship using the authenticated brand. The inspected methods do invoke hierarchy validation in several important flows.

However, the service contains multiple progress operations, and not all methods necessarily share the same validation sequence. The next review needs to trace the hierarchy resolver and the repository’s brand predicates in full. I’m not marking a bypass yet without confirming the exact method and its caller.

### RTH-LEGACY-01 — High, conditional: deprecated content endpoint still emits public cache headers

The legacy API route:

`apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts`

extracts `x-user-id` and `x-brand` directly from request headers, calls the legacy tutorial service, and sets:

`Cache-Control: public, max-age=3600`

The route itself does not call `validateRequest()`. It is marked deprecated, and the comments state that production pages use the modular sections system. This remains a serious concern if the endpoint is still reachable and those headers are not guaranteed by a trusted gateway boundary. Its public cache header is also inappropriate for a response that includes learner progress unless the response is truly non-personalized.

I’ll keep this finding conditional until the upstream gateway/header trust path and actual route usage are verified.

### Current assessment

The source shows meaningful protections in the newer ILS design: identity comes from validated context, payloads are schema-checked, and node completion is decided server-side. The major unresolved items are the missing API route file, the exact brand-aware hierarchy enforcement, and whether legacy endpoints remain exposed.

Next I’ll review the ILS hierarchy resolution and persistence methods, then the assignment API routes and authorization helpers as one medium-sized phase. I have not run tests or changed repository files.


## Principal Architect Audit — Phase 6: ILS progress integrity

I’m continuing the source-level review in medium-sized phases. This phase focuses on whether ILS endpoints authenticate the caller, validate the requested tutorial hierarchy, and persist progress against the correct learner and content node.

The API route for page-level active time uses `validateRequest()` and constructs the identity from its validated context. That is a positive control. However, the service method it calls does not perform the same hierarchy validation that the visit and completion paths perform. I’m tracing the repository write and the neighboring block-level method before assigning the final severity.

### Confirmed finding: page-level active-time writes skip hierarchy validation

Finding RTH-ILS-03 — High, integrity risk (not a demonstrated cross-user access exploit)

- File: [`learning-progress.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/services/learning-progress.service.ts?utm_source=chatgpt.com)
- Method: `recordActiveTime()`
- Evidence: It validates `userId`, `navigationNodeId`, and the time increment, then calls `progressRepository.recordTime(event)` directly. Unlike `recordVisit()`, `recordBlockCompletion()`, and `completeNavigationNode()`, it does not call `validateNavigationHierarchy()` before the write.
- Repository effect: [`tutorial-navigation-progress.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts?utm_source=chatgpt.com) creates a row using the caller-provided `navigationNodeId` and `subtopicId`, or updates the row selected by `(userId, navigationNodeId)`. The progress table does not include a brand column.
- Risk: A malformed or inconsistent node/subtopic pair can be persisted as progress before the service attempts to resolve canonical blocks. This can corrupt learner progress and may cause the row to be associated with a misleading subtopic. The request remains self-scoped by authenticated `userId`; I have not established a cross-user data read/write.
- Recommended correction: Validate `navigationNodeId ↔ subtopicId` with authenticated `identity.brand` before any persistence. Add a repository-level invariant or transactional guard so all progress writes share the same hierarchy guarantee. Add tests for nonexistent nodes, mismatched subtopics, and brand-mismatched content.

The route’s internal-authentication check is a good control, but it does not substitute for service-level content hierarchy validation.

### ILS cross-check: block-level active time is guarded

The neighboring `recordBlockActiveTime()` does call `validateNavigationHierarchy()` before entering its transaction. Its event ledger also checks duplicate event IDs and payload consistency before applying active-time accumulation. That is a stronger pattern than the page-level `recordActiveTime()` path.

One additional integrity concern is visible in `getSubtopicProgress()`: it fetches records by authenticated user and caller-supplied subtopic, then resolves content, but does not explicitly validate each stored node/subtopic relationship. Since this is a read of the learner’s own progress, I classify it as a consistency/incorrect-results concern rather than an established authorization bypass.

Phase 6 disposition: the page-level active-time hierarchy omission is confirmed in code. The broader question of whether progress should be brand-scoped at the database key level remains a design decision requiring confirmation of whether a user can legitimately share the same navigation identifiers across brands. The schema currently keys active progress by user and navigation node, without brand.

## Phase 7: Assignment access and tier progression

The first assignment pass found two concrete issues in the RTH learner API/service path. These are separate from the ILS telemetry finding.

### RTH-ASSIGN-01 — Unpublished assignment records may be returned to learners

Severity: High, conditional on unpublished rows containing non-public material

- Repository: [`assignment.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/repositories/assignment.repository.ts?utm_source=chatgpt.com)
- Method: `getAssignments(subtopicId, difficulty)`
- The query filters by subtopic, difficulty, and `deletedAt IS NULL`, but does not filter `isPublished = true`.
- The learner service calls this repository method after checking the tier unlock rules.
- The schema includes an `isPublished` flag, defaulting to `false`: [`tutorial-assignments.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/tutorial-assignments.ts?utm_source=chatgpt.com).

Impact: If unpublished rows are stored in the same table, an authorized learner who reaches that tier can receive draft questions, hints, reference answers, or other unpublished content.

Correction: Enforce publication state in the repository query, not only in the UI or service. Add tests proving unpublished and soft-deleted rows are excluded from learner-facing results.

### RTH-ASSIGN-02 — Tier completion endpoint can skip the tier-unlock sequence

Severity: High, progression-integrity issue

- Route: [`complete/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/src/app/api/tutorial/assignments/%5BsubtopicId%5D/complete/route.ts?utm_source=chatgpt.com)
- Service: [`assignment.service.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/realtutorialhub-web/src/server/assignment.service.ts?utm_source=chatgpt.com)
- `startTier()` checks whether the preceding tier is complete before allowing a tier to start.
- `completeTier()` does not apply that same prerequisite check. It can upsert the requested tier to `self_completed` after only checking whether that tier is already completed.

Impact: A learner can call the completion endpoint directly for a later tier and mark it complete without following the intended sequence. Repeated direct calls could therefore bypass the service’s sequential unlock policy.

Correction: Make completion validate the tier’s current state and prerequisite tier within a transaction. The server should reject completion unless the tier is legitimately in progress and its prerequisite is complete; client-side sequencing is not an authorization control.

### Test coverage confirms the gap is not currently guarded

The assignment tests exercise the happy path for completion and expect `completeTier()` to succeed even when the mocked progress lookup returns `undefined`. The route test checks already-completed handling, but does not test completing a locked tier. The repository test also uses a published fixture only; it does not assert that unpublished assignments are excluded.

This does not mean the tests themselves cause the vulnerabilities; it means the present test suite does not catch these missing server-side rules.

A further authorization note: `requireStudent()` accepts the roles `student`, `admin`, `super_admin`, `faculty`, and `user`. That may be a deliberate cross-role learner experience, but it is broader than a student-only policy. I’ll treat it as a policy verification item unless the intended role matrix says those roles should be denied.

### RTH-ASSIGN-03 — Soft-delete uniqueness and upsert behavior are inconsistent

Severity: Medium, conditional on assignment-progress rows being soft-deleted and later recreated

- Schema: [`assignment-progress.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/assignment-progress.ts?utm_source=chatgpt.com)
- Repository: [`assignment.repository.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/repositories/assignment.repository.ts?utm_source=chatgpt.com)

The repository only searches for active progress (`deletedAt IS NULL`). If it finds none, it inserts a new row. But the schema’s unique index on `(userId, subtopicId, difficulty)` is not partial and does not include `deletedAt`.

If a soft-deleted row already exists for that key, the active-row lookup returns nothing, while the insert can still conflict with the unique index. Also, the insert path does not use an `ON CONFLICT` recovery strategy for concurrent first-time starts.

Correction: Align the uniqueness strategy with the intended soft-delete lifecycle (for example, a partial unique index over active rows) and make the insert/update operation concurrency-safe. Verify the existing production migration before changing the schema.

## Phase 7 conclusion

The assignment review currently has three confirmed code-level findings:

| ID            | Severity            | Summary                                                        |
| ------------- | ------------------- | -------------------------------------------------------------- |
| RTH-ASSIGN-01 | High, conditional   | Learner assignment query does not filter `isPublished`         |
| RTH-ASSIGN-02 | High                | Completion endpoint can skip tier prerequisites                |
| RTH-ASSIGN-03 | Medium, conditional | Soft-delete uniqueness and insert/upsert behavior can conflict |

I also verified the RTH and SkillUp `complete-node` BFF path difference against the gateway’s `/api/` normalization logic. The apparent path mismatch is not confirmed as a defect from the code reviewed; the gateway normalizes the prefixed path before routing.

## Next phase: SkillUp learner BFF and brand boundary

I’ve started reviewing SkillUp’s ILS proxy routes and `requireStudentAuth()`. The routes authenticate the SkillUp learner and inject a fixed `X-Brand: skillup` header before forwarding to the centralized API. The next pass will check the full proxy set, brand claims/platform membership, and whether any route handles identity or internal-secret headers inconsistently.

I have not changed the repository or claimed to run tests.

## Phase 8 — SkillUp ILS BFF and identity boundary

The SkillUp ILS routes consistently call `requireStudentAuth()` before forwarding. That helper verifies an access token, requires a user ID, checks SkillUp brand/platform access, and normalizes roles before applying its allowlist. The BFF then sets `X-Brand: skillup` and uses the authenticated identity rather than accepting `userId` from the request body.

I did find implementation differences across these routes that deserve a closer backend check: some GET proxies forward only `X-Internal-Secret`, while POST proxies also send `x-internal-key`; the block-visit and visit routes forward `x-session-id`, while other routes rely on the body. These are not automatically vulnerabilities—the downstream middleware may intentionally support them—but the contract should be consistent and explicit.

### Phase 8 backend contract check: confirmed controls and a sensitive logging defect

The API routes behind the SkillUp ILS proxies call `validateRequest(request, { requireInternalSecret: true })`. That option explicitly prevents fallback to the API server’s weaker gateway-header mode, and the route constructs identity from the validated context. This is a positive control.

However, the same middleware logs internal-secret metadata and secret previews:

- `internal-auth.middleware.ts` logs received/expected secret lengths and whether they match.
- On mismatch, it logs the first 20 characters of both the supplied and expected secret.
- It also logs the raw `x-user-roles` header.

This is a confirmed sensitive-logging defect, not merely a concern about deployment configuration. Finding RTH-AUTH-06 remains High: remove secret values/previews and raw role-header contents from logs; keep only non-sensitive booleans, status codes, and correlation IDs. Also rotate any secret that may have been exposed in retained logs, subject to your log-retention and incident-response process.

The ILS API’s `requireInternalSecret` behavior is sound in principle. The risk is the debug/diagnostic data emitted around it.

### SkillUp legacy tutorial cache: same class of risk is present

Finding SUIA-CONTENT-01 — High, conditional on response content including learner-specific data

The deprecated SkillUp endpoint [`apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-web/src/app/api/tutorial/content/%5BsubtopicId%5D/route.ts?utm_source=chatgpt.com) authenticates the learner and proxies to the API server, but then explicitly sets:

`Cache-Control: public, max-age=3600`

That is an unsafe cache directive for an authenticated response if the payload contains user-specific progress or identity-dependent content. It is especially concerning because the endpoint is marked deprecated yet remains implemented.

Remediation: remove the public cache directive; use `private, no-store` for any authenticated response. Confirm whether the endpoint is still used by any learner route, and remove it or keep it as a tightly controlled compatibility path. The same review item applies to the corresponding RTH legacy endpoint already identified.

### SkillUp service-worker review: authenticated navigation caching

Finding SUIA-AUTH-02 — High, conditional on authenticated pages being navigated/cached

[`apps/skillup-web/src/app/sw.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-web/src/app/sw.ts?utm_source=chatgpt.com) caches successful same-origin GET responses when the request is a navigation or targets `/_next/`. It does not exclude authenticated pages, nor does it clear this cache on logout or account change.

On network failure, it returns the cached response. The cache lookup is keyed by the request and does not inherently isolate users by authenticated identity. This can expose a prior user’s rendered page on a shared browser or after account switching, depending on the pages and response headers being cached. I have not reproduced the behavior in a browser.

Recommended fix: use an explicit public-only cache allowlist; never cache authenticated navigation responses or private API data. Clear account-scoped caches on logout/account switch, and test offline behavior with two accounts in the same browser profile. This is the SkillUp counterpart to the RTH service-worker concern.

A separate configuration issue is also present: SkillUp’s Next.js is `16.1.6` while `eslint-config-next` is pinned to `15.2.0`. Treat that as a maintenance/compatibility concern and align versions after checking the intended lint setup.

### Auth-proxy test mismatch: test expectation conflicts with the implementation

The SkillUp proxy test [`proxy.test.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillup-web/src/__tests__/proxy.test.ts?utm_source=chatgpt.com) asserts that an unauthenticated dashboard RSC request returns `200` without calling token verification. But the shared `createAuthProxy()` implementation currently calls `resolveUser()` before route handling and treats `/dashboard` as protected. With no token, the expected path is a login redirect, not a `200`.

I’m not classifying this as a confirmed runtime authentication bypass: the source implementation and test expectation disagree, and I have not run the test or exercised Next.js middleware. It is a test/source inconsistency that should be resolved. The test should explicitly validate the intended security policy for RSC requests rather than encode a bypass-like expectation.

The shared auth proxy also logs the first 20 characters of an access token in its diagnostic log. That is the same sensitive-logging class as the API middleware finding; the log should not include token fragments.

## Phase 8 disposition — SkillUp learner app

| Finding                    | Severity             | Current assessment                                                                    |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| SUIA-CONTENT-01            | High, conditional    | Deprecated authenticated tutorial content endpoint uses `public, max-age=3600`        |
| SUIA-AUTH-02               | High, conditional    | Service worker caches successful navigation responses without user/account separation |
| RTH-AUTH-06 / shared       | High                 | API middleware emits internal-secret previews and raw roles in logs                   |
| Shared auth proxy          | High logging concern | Access-token prefix is logged                                                         |
| SkillUp proxy test         | Test-quality issue   | RSC test expectation conflicts with protected-route behavior in source                |
| Next / ESLint version skew | Medium               | Next 16.1.6 paired with eslint-config-next 15.2.0                                     |

### Positive controls verified

- SkillUp ILS BFF handlers authenticate before forwarding.
- Brand is set server-side to `skillup`; the caller does not choose the forwarded brand.
- ILS API routes require internal-secret authentication and derive identity from the validated context.
- The shared auth proxy compares the JWT brand to the hostname-resolved brand.
- The legacy tutorial content endpoint is explicitly marked deprecated.

I have not modified the repository or run tests. These are source-review findings, with conditional risks labeled as such.

Next audit phase: SkillHubCore admin and the shared admin authorization boundary—route protection, role enforcement, tenant/brand handling, and whether privileged operations rely on trusted gateway headers or independently validate authorization.

## Phase 9 — SkillHubCore Admin: authentication boundary and session lifecycle

I’m continuing against `main` in `skillupitacademy-alt/SUIA_RTH_SHC`. This phase covers the shared admin shell, session verification helpers, and login/logout/session proxy endpoints. I’m treating frontend guards as UX controls—not as proof that API endpoints are protected.

### Findings from this phase

| ID          | Severity          | Finding                                                                                                                                                               |
| ----------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SHC-AUTH-01 | High              | Logout clears only the base token cookies, while login also creates admin-prefixed token cookies.                                                                     |
| SHC-AUTH-02 | High              | `requireAdminRole()` accepts `user.isAdmin` as an alternative to an admin-level RBAC role. The claim’s trust and consistency with roles need verification.            |
| SHC-AUTH-03 | High, conditional | The `AdminGuard` is client-side route gating. It cannot replace authentication and authorization inside every privileged API handler.                                 |
| SHC-AUTH-04 | Medium            | Admin auth routes log user email, role, and partial user ID during session checks; login logs email and partial ID.                                                   |
| SHC-AUTH-05 | Medium            | `requireBrandAccess()` and `requireSubtopicAccess()` currently authorize by broad tutorial-author permissions; brand/subtopic-specific access is explicitly deferred. |

### SHC-AUTH-01 — Logout leaves admin-prefixed cookies

The login handler sets four cookies when tokens are returned:

- `accessToken`
- `admin_accessToken`
- `refreshToken`
- `admin_refreshToken`

The logout handler clears only `accessToken` and `refreshToken`. Thus, the two admin-prefixed cookies are not explicitly expired by this handler. Because the auth helper accepts `admin_accessToken` as a fallback, a user may retain a usable access token after the logout response—depending on upstream token revocation and cookie scope.

This is a concrete cookie-lifecycle mismatch in the reviewed code; I have not tested it against a running deployment.

Recommendation: clear all four names using the same `Path`, `Domain`, `Secure`, and `SameSite` attributes used when setting them. Also verify whether the upstream logout revokes the refresh token and whether the client’s auth store is reset only after server logout succeeds.

Files: [login route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/auth/login/route.ts?utm_source=chatgpt.com) · [logout route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/auth/logout/route.ts?utm_source=chatgpt.com) · [auth helpers](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/lib/auth-helpers.ts?utm_source=chatgpt.com)

### SHC-AUTH-02 — Admin authorization has two sources of truth

`hasAdminRole()` returns:

```
RBACService.isAdminLevel(user.roles) || user.isAdmin
```

That means a user can pass the helper through either the RBAC role set or the `isAdmin` boolean. This is safe only if the boolean is a trusted, validated claim and cannot become inconsistent with the roles. The reviewed helper also defaults `isAdmin` to `true` when the token field is absent:

```
isAdmin: payload.isAdmin ?? true
```

The combination is the concern: missing `isAdmin` does not mean “not an admin” in this helper. Whether this is exploitable depends on token issuance and verification policy, which this phase has not yet traced end-to-end.

Recommendation: derive admin status from canonical roles/permissions, or require a positively asserted and documented claim with strict issuer/audience validation. Avoid defaulting a missing privilege claim to `true`.

File: [auth helpers](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/lib/auth-helpers.ts?utm_source=chatgpt.com)

### SHC-AUTH-03 — Client guard does not establish API protection

`AdminGuard` checks the current client-side auth store and revalidates through `apiClient.auth.getAdminSession()`. It gates page rendering and redirects the browser, but it is not a server-side authorization boundary.

The layouts wrap page content with this guard, which is useful for navigation and user experience. The security requirement remains that each API route which reads or mutates privileged data must independently authenticate the request and enforce the specific permission.

Audit status: this is an architectural control requirement, not a confirmed API bypass. I’m checking route-level enforcement in the next phase.

Files: [AdminGuard](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx?utm_source=chatgpt.com) · [admin layout](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/%28admin%29/layout.tsx?utm_source=chatgpt.com) · [authenticated layout](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/%28authenticated%29/layout.tsx?utm_source=chatgpt.com)

### SHC-AUTH-04 — Session logs expose user metadata

The login and `/auth/me` handlers log email, role, and a shortened user ID. The partial ID is not an access token, but email and role are personal/account metadata and are unnecessary for most routine auth telemetry.

Recommendation: log request correlation ID, status, duration, and a non-identifying outcome. Avoid email and user identifiers in routine logs; ensure logs have appropriate access and retention.

Files: [login route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/auth/login/route.ts?utm_source=chatgpt.com) · [session route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/auth/me/route.ts?utm_source=chatgpt.com) · [admin session route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/admin/auth/me/route.ts?utm_source=chatgpt.com)

### SHC-AUTH-05 — Brand/subtopic checks are currently role-wide

The helper comments state that brand and subtopic authorization are future enhancements. At present, `requireBrandAccess()` and `requireSubtopicAccess()` check broad tutorial-author permissions rather than verifying the user’s assignment to the requested brand or subtopic.

This is not automatically a vulnerability if the intended policy is that all authorized admins can manage all brands and subtopics. But it does not implement a tenant-scoped policy. That distinction matters for the shared-core multi-brand design.

Recommendation: decide explicitly whether SkillHubCore admins are globally privileged. If not, enforce brand/subtopic scope using trusted server-side assignments—not request parameters alone.

File: [auth helpers](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/lib/auth-helpers.ts?utm_source=chatgpt.com)

## Phase 10 — Privileged API routes: auth enforcement and permission scope

The next pass is focused on API handlers—not UI pages. The code shows two distinct API patterns in SkillHubCore Admin:

1. Gateway-proxied routes such as `/api/admin/questions` and `/api/factory/save`.
2. Direct database/service routes such as Tutorial Composer, which call `authenticateRequest()` locally.

That split is reasonable only if each route’s actual trust boundary and permission checks are consistent.

### SHC-API-01 — Tutorial Composer does not enforce action-specific permissions

The Tutorial Composer create, update, archive, and publish handlers authenticate the request and then call `requireSubtopicAccess()` and `requireBrandAccess()`. Those helpers currently grant access based on the broad `TUTORIAL_AUTHOR_CREATE` or `TUTORIAL_AUTHOR_EDIT` permissions.

The auth helper file also defines separate functions for edit, delete, and publish permissions—but the reviewed route handlers do not use those action-specific checks.

The result is a permission granularity mismatch:

- A user with authoring access may be able to publish or archive, even if the intended policy separates those powers.
- The create and list handlers authenticate, but do not explicitly call `requireAdminRole()`. That may be intentional if tutorial-author permissions are the intended gate; the policy should be explicit.
- `GET` by section ID authenticates and checks brand/subtopic access after fetching the tutorial. That ordering may expose an existence distinction through the response (e.g. not found vs forbidden), depending on service behavior.

Recommendation: define the intended permission matrix and enforce it per action: create, read, edit, archive/delete, publish. If publish/delete are deliberately equivalent to edit, remove or document the unused separate permissions so the code does not imply a stricter policy than it implements.

Files: [sections collection](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts?utm_source=chatgpt.com) · [section item](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/%5BsectionId%5D/route.ts?utm_source=chatgpt.com) · [publish route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/%5BsectionId%5D/publish/route.ts?utm_source=chatgpt.com) · [auth helpers](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/lib/auth-helpers.ts?utm_source=chatgpt.com)

### SHC-API-02 — Project LLM adapter delegates all authorization to FastAPI

The catch-all `/api/project-llm/[...path]` route:

- extracts `accessToken` or `admin_accessToken` from cookies;
- forwards the token as `Authorization: Bearer …`;
- proxies GET, POST, PUT, and DELETE;
- explicitly does not verify the JWT or check permissions locally.

The source comments acknowledge that JWT compatibility, backend URL, expected claims, and role assignment still need end-to-end verification.

This is not itself a vulnerability if FastAPI validates the token and enforces authorization on every endpoint. It is a dependency on a backend security contract that the adapter does not independently establish.

A further operational concern: on upstream errors, the adapter logs the complete response body (`responseText`). That body could include sensitive validation details or backend diagnostics, depending on FastAPI’s error responses.

Recommendation: confirm the FastAPI authentication/authorization contract with integration tests for each method and privileged endpoint. Redact or truncate upstream error bodies in logs, and avoid exposing them through production logging.

File: [Project LLM catch-all adapter](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/project-llm/%5B...path%5D/route.ts?utm_source=chatgpt.com)

### SHC-API-03 — Gateway-proxy routes rely on upstream authorization

The `/api/admin/questions` and `/api/factory/save` handlers simply call `proxyUpstreamRequest()` with an upstream path. There is no local authentication or permission check in those route files.

That pattern can be valid if the gateway/backend reliably validates the forwarded session and enforces authorization. However, the route-level source alone does not prove that contract. The shared proxy helper forwards request headers and adds gateway credentials; the upstream must not treat those credentials as proof that the end user is authorized.

Audit status: dependency requiring upstream verification—not a confirmed bypass. Next I’ll trace the gateway/backend route implementation and compare its authorization behavior with the local Tutorial Composer routes.

Files: [admin questions route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/admin/questions/route.ts?utm_source=chatgpt.com) · [factory save route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/factory/save/route.ts?utm_source=chatgpt.com) · [shared BFF proxy](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/src/share-branding/auth/authBffRoute.ts?utm_source=chatgpt.com)

### SHC-API-04 — Marketing bootstrap/control-plane proxy routes are intentionally public, but need scope validation

The `GET` handlers for marketing bootstrap and control-plane proxy to upstream paths prefixed with `/public/marketing/…`. They do not authenticate locally and interpolate `brandId` into the upstream URL.

The `/public/` route naming suggests these are intended public read endpoints, so absence of authentication is not automatically a defect. The security question is whether the upstream restricts the returned data to public marketing configuration and validates the brand identifier.

Recommendation: verify the upstream public endpoints expose no admin-only settings, secrets, unpublished drafts, or cross-brand data. Validate `brandId` against the known brand set at the proxy boundary as well as upstream.

Files: [control-plane route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/marketing/control-plane/%5BbrandId%5D/route.ts?utm_source=chatgpt.com) · [bootstrap route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/skillhubcore-admin/src/app/api/marketing/bootstrap/%5BbrandId%5D/route.ts?utm_source=chatgpt.com)

## Phase 10 disposition

The highest-priority concrete issue from the first two phases is the logout cookie mismatch: login writes admin-prefixed cookies, but logout does not expire them. The most important policy issue is the Tutorial Composer action-permission gap: the route handlers do not apply separate publish/delete permissions despite those helpers existing.

The gateway-proxy and Project LLM findings remain conditional on upstream behavior. I have not run tests or modified repository files.

Next phase: I’ll trace the API server/gateway authorization implementation behind the admin and factory proxy routes, then review the admin CRUD and batch-delete handlers as a grouped phase—checking authentication, role/permission checks, input validation, tenant/brand scoping, and destructive-operation safety.

## Phase 11 — API server admin authorization and question-bank writes

This phase traces the route handlers into the shared admin-audience verifier and question engine. That gives us stronger evidence than inspecting the BFF proxy alone.

### SHC-API-05 — SkillHubCore admin audience has a specific server-side role gate

`requireAdminRouteAccess()` does more than simply accept any admin token for the `shc-admin` audience. It requires:

- token brand claim exactly `skillhubcore`;
- `isAdmin === true`;
- a role of `admin`, `super_admin`, or `infrastructure`.

For the ordinary `admin` audience, it calls `_verifyAdmin(payload)`. The `infra` audience is treated separately and skips that ordinary admin RBAC check after token verification.

This is a positive control for the SkillHubCore audience. The remaining audit item is to verify the token issuer and gateway cannot allow a caller to choose a more privileged audience or portal identity.

File: [admin audience utility](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/auth/admin-audience.util.ts?utm_source=chatgpt.com)

### SHC-API-06 — Admin question endpoints authenticate, but tenant/resource scope is not evident

The question list/create, single-question read/update/delete, bulk-create, and batch-delete handlers all call `requireAdminRouteAccess()`. Payload validation is also present in create/update and bulk paths.

However, the question handlers do not consistently check that the target question’s `topicId`, `subtopicId`, or associated skill belongs to the authenticated admin’s authorized brand or scope. For example, single-question `GET`, `PATCH`, and `DELETE` look up or mutate by question ID after the admin audience check.

This is a conditional cross-brand authorization concern: if the intended policy permits every SkillHubCore admin to manage all question-bank content, it may be by design. If admin permissions are brand-scoped, route-level authentication alone does not enforce that scope.

Recommendation: define whether admin access is global or brand-scoped, then enforce the rule in the repository/service operation (ideally using the verified audience and authorized brand), not merely in the UI. Add tests where a valid admin attempts to read, update, and delete a resource from another brand.

Files: [question collection](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/questions/route.ts?utm_source=chatgpt.com) · [question item](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/questions/%5Bid%5D/route.ts?utm_source=chatgpt.com) · [bulk route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/questions/bulk/route.ts?utm_source=chatgpt.com) · [batch delete](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/questions/batch-delete/route.ts?utm_source=chatgpt.com)

### SHC-API-07 — Factory save accepts global topic/skill identifiers without visible brand ownership validation

The factory save route authenticates with `requireAdminRouteAccess()` and validates `topicId` and optional `subtopicId`/`skillId` as UUIDs. It then writes questions under the supplied topic and creates missing skills by name.

UUID validation establishes format—not ownership. In the reviewed handler, I do not see a check that the topic/subtopic is in the admin’s authorized brand, or that a supplied skill ID belongs to the appropriate scope. Newly created skills are inserted using the name and generic technical mapping.

This is likewise conditional on the intended global-vs-brand admin policy. It is a clear missing validation step if the factory is expected to honor brand boundaries.

Recommendation: validate topic/subtopic ownership and relationship before opening the write transaction; validate supplied skill IDs and enforce uniqueness/ownership for skill creation. Test mismatched topic/subtopic pairs and cross-brand IDs.

File: [factory save](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/factory/save/route.ts?utm_source=chatgpt.com)

### SHC-API-08 — Bulk question import has an unsafe fallback condition to review

The bulk-import handler creates a job and calls the workflow endpoint. If the workflow responds with 404, it falls back to synchronous insertion.

That fallback may be operationally useful, but a 404 does not necessarily mean the workflow service is absent; it could also mean the path is wrong, routing changed, or the endpoint deliberately returned 404. The fallback then performs a potentially large synchronous write in the request lifecycle.

Recommendation: make fallback eligibility explicit (e.g. a recognized workflow-not-deployed condition), cap synchronous fallback batch size, and ensure the job transitions to a terminal failure state if the fallback insertion fails. Verify that workflow triggering and fallback cannot both process the same job.

File: [bulk import route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/questions/bulk/route.ts?utm_source=chatgpt.com)

## Phase 11 disposition

| ID         | Severity          | Summary                                                                |
| ---------- | ----------------- | ---------------------------------------------------------------------- |
| SHC-API-05 | Positive control  | SHC admin audience checks brand, admin claim, and allowed role         |
| SHC-API-06 | High, conditional | Question CRUD lacks visible brand/resource ownership enforcement       |
| SHC-API-07 | High, conditional | Factory writes validate UUID shape, not topic/subtopic/skill ownership |
| SHC-API-08 | Medium            | Bulk import falls back to synchronous processing on workflow 404       |

The main architecture decision to settle is whether SkillHubCore admin privileges are truly global across RTH and SkillUp, or whether they are scoped by brand. The source confirms the audience and role checks; it does not establish a consistent resource-level tenant policy.

I have not run tests or changed repository files. Next I’ll review the remaining admin CRUD and destructive batch endpoints as a cohesive phase—especially domain, subject, topic, subtopic, skill, user, and batch-delete routes—then compare their guards and mutation behavior for consistency.

## Principal Architect audit — Phase 12: Admin hierarchy CRUD and batch deletion

I’m continuing from the prior API/admin phase, using the repository’s `main` branch as the review baseline. This phase covers the domain, subject, and topic route handlers as a cohesive unit: list/create, update/delete, and batch-delete.

I reviewed the handler source, including its authentication calls, request parsing, schema validation, engine calls, sync side effects, and response/error handling. I have not changed repository files or run tests.

### 1. Findings from this phase

| ID          | Severity        | Finding                                                                                                                                             | Confidence                                                 |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| SHC-HIER-01 | Medium          | Batch-delete routes accept arrays without visible per-ID validation or a maximum item count.                                                        | Confirmed in route code; impact depends on engine behavior |
| SHC-HIER-02 | Medium          | Domain batch delete lacks the JSON depth/size validation present in the subject/topic batch handlers.                                               | Confirmed                                                  |
| SHC-HIER-03 | Medium          | Hierarchy create/update routes launch `HierarchySyncService.sync(...)` without awaiting or handling its result.                                     | Confirmed; failure behavior needs service inspection       |
| SHC-HIER-04 | Medium          | List routes parse `limit` with `parseInt` but do not visibly validate bounds or malformed values at the route layer.                                | Confirmed; downstream query may constrain it               |
| SHC-HIER-05 | Review required | These route handlers consistently call `requireAdminRouteAccess`, but this does not by itself establish hierarchy ownership/parent-child integrity. | Requires engine/repository inspection                      |

#### SHC-HIER-01 — Batch-delete input validation

The domain, subject, and topic batch-delete endpoints check that `ids` is an array. The visible route code does not validate that each element is a valid ID, reject duplicates, or cap the number of IDs.

- Domain: [batch-delete route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/domains/batch-delete/route.ts?utm_source=chatgpt.com)
- Subject: [batch-delete route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/subjects/batch-delete/route.ts?utm_source=chatgpt.com)
- Topic: [batch-delete route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/topics/batch-delete/route.ts?utm_source=chatgpt.com)

Architectural concern: a large or malformed batch can cause avoidable database work, inconsistent partial behavior, or noisy error responses if the engine does not enforce limits and ID validity. The route layer should apply a bounded schema; the engine should also protect its own contract.

#### SHC-HIER-02 — Domain batch route skips payload depth/size checks

The subject and topic batch-delete routes call `validateJsonDepth` and `validateJsonSize`. The domain batch-delete route reads the JSON body and casts it directly to `BatchDeleteBody`, then checks only whether `ids` is an array.

That inconsistency is confirmed in the route code. It does not prove a successful exploit, because global request limits or engine validation may exist elsewhere.

#### SHC-HIER-03 — Unawaited hierarchy synchronization

The domain, subject, and topic create/update handlers use:

```
void HierarchySyncService.sync(...);
```

The route returns success without awaiting synchronization or visibly recording a rejected promise. If the sync is required for downstream hierarchy consistency, a sync failure could occur after the API has already reported success.

This needs the service and sync consumers inspected before deciding whether this is a defect or an intentionally best-effort side effect. If required, prefer a durable queue/outbox or an awaited operation with explicit failure semantics.

#### SHC-HIER-04 — List limit parsing

The GET handlers use `parseInt(searchParams.get('limit') ?? '20')`. The route code does not visibly reject `NaN`, zero, negative values, or excessively large limits. The query layer may clamp these values, so this is not yet a confirmed unbounded-query issue.

#### SHC-HIER-05 — Parent/child integrity is not established at the route

Creation schemas accept hierarchy references such as `domainId` for subjects and `subjectId` for topics. The route forwards them to the engine. Whether the referenced parent exists, is active, and belongs to the expected tenant/brand must be verified in the engine/repository layer; authentication alone does not prove that relationship.

### 2. Additional findings — Phase 13: Subtopics, skills, users, and blueprints

This phase reviewed the matching route files for subtopics, skills, users, and exam blueprints.

| ID          | Severity            | Finding                                                                                                                                                               | Confidence                                                              |
| ----------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| SHC-HIER-06 | Medium              | Subtopic/skill batch-delete endpoints share the unbounded ID-array concern.                                                                                           | Confirmed                                                               |
| SHC-USER-01 | High, conditional   | User-by-ID GET returns a user with profile and role relations, but the route has no visible brand/tenant filter.                                                      | Confirmed in route; exposure depends on intended data scope             |
| SHC-USER-02 | Medium              | User list/create endpoint is an authenticated stub, not a real implementation. Its POST response says “User created successfully” although creation is commented out. | Confirmed                                                               |
| SHC-BLUE-01 | Medium              | Blueprint PATCH does not visibly apply the same JSON depth/size validation and sanitization used by blueprint creation.                                               | Confirmed                                                               |
| SHC-BLUE-02 | Medium, conditional | Blueprint create/update/delete routes do not visibly pass the authenticated admin ID to the engine.                                                                   | Confirmed at route boundary; audit attribution may be handled elsewhere |

#### SHC-USER-01 — User lookup scope

File: [users/\[id\]/route.ts](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/users/%5Bid%5D/route.ts?utm_source=chatgpt.com)

The GET handler authenticates through `requireAdminRouteAccess`, then queries the user by `id` and includes:

- `profile`
- `userRoles`
- each related `role`

The query has no visible brand or tenant predicate. In a multi-brand platform, the policy needs to be explicit: can an admin for one brand inspect a user belonging to another brand, or is this endpoint restricted to the platform-wide SkillHubCore administrator? I’m marking this conditional because the intended authorization boundary and identity model must be checked before calling it a confirmed cross-brand disclosure.

#### SHC-USER-02 — User list/create is currently a stub

File: [users/route.ts](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/users/route.ts?utm_source=chatgpt.com)

The handlers enforce `user.manage`, but both implementation paths are commented out. GET returns an empty list. POST does not create a user, yet returns a success message and HTTP 201.

This is a functional/API contract defect, not evidence of an unauthorized account-creation vulnerability. The response should not claim creation succeeded unless the operation actually occurred.

#### SHC-BLUE-01 — Blueprint PATCH has weaker payload defenses

Files:

- [blueprints/route.ts](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/blueprints/route.ts?utm_source=chatgpt.com)
- [blueprints/\[id\]/route.ts](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/blueprints/%5Bid%5D/route.ts?utm_source=chatgpt.com)

Blueprint POST applies depth/size checks and `sanitizeJsonField` before schema validation. PATCH catches JSON parse errors, substitutes `{}`, and validates `blueprintSchema.partial()`, but does not visibly apply those same protections.

A malformed body may therefore become a no-op update or a schema error, depending on schema behavior. More importantly, the create and update request contracts are inconsistent. Recommend a shared bounded parser/sanitizer for both operations.

#### SHC-BLUE-02 — Missing explicit actor attribution

The blueprint routes authenticate the caller but invoke `createBlueprint`, `updateBlueprint`, and `deleteBlueprint` without passing the authenticated user ID. If these operations are expected to record `createdBy`, `updatedBy`, or deletion actor, the route does not provide it. This needs engine/schema inspection before deciding whether attribution is missing entirely.

### 3. Phase conclusion

The recurring pattern across these hierarchy handlers is authorization is present at the route boundary, but input bounds and data-scope guarantees are not uniformly visible. I have not established a cross-brand exploit from these route files alone.

The next logical review is the engine/repository layer for these exact findings: hierarchy parent validation, batch-delete transaction and soft-delete behavior, user brand scoping, and blueprint audit fields. That will distinguish route-level concerns from controls already enforced deeper in the stack.

No source changes were made, and tests were not run.

## Phase 14 — Engine and repository review: hierarchy integrity

I’ve now moved below the route handlers into the domain/subject/topic/subtopic/skill engines and their Drizzle repositories. This is important because a route-level concern may already be protected by the repository—or, as in the code reviewed here, the repository may make the concern more concrete.

### Confirmed deeper-layer findings

| ID          | Severity          | Finding                                                                                                              | Evidence                                                                                                                               |
| ----------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| SHC-HIER-07 | High              | Hierarchy CRUD uses hard deletes rather than soft deletes.                                                           | The domain, subject, topic, subtopic, and skill repository `delete` / `deleteBatch` methods call SQL `DELETE`.                         |
| SHC-HIER-08 | High, conditional | Parent-child relationships are not checked in the visible repository mutations.                                      | Subject/topic/subtopic create and update methods insert/update the row without validating the referenced parent in the same operation. |
| SHC-HIER-09 | Medium            | Audit records are written before several delete mutations.                                                           | Subject/topic/subtopic/skill engines log the delete action, then call repository deletion.                                             |
| SHC-HIER-10 | Medium            | Domain listing count query is constructed differently from its paginated query.                                      | The count query filters conditions by stringifying them and checking for `created_at <`.                                               |
| SHC-HIER-11 | Medium            | Hierarchy sync failures are logged and converted to a `false` result, while callers launch sync without awaiting it. | `attemptSync()` catches errors and returns false; `sync()` awaits that boolean but returns `Promise<void>`.                            |

#### SHC-HIER-07 — Hard deletion and dependency risk

The hierarchy repositories call `delete(...)` directly against their table, and batch deletion uses `inArray(...)` with direct SQL delete. The visible operations are not soft-delete updates.

That can be a valid policy for a carefully controlled hierarchy, but it creates a dependency-sensitive operation: parent rows may be referenced by child rows, question content, or tutorial hierarchy mappings. The database FK configuration and cascade behavior must be examined before determining the precise impact.

The audit implication is already clear: a destructive hierarchy operation needs an explicit deletion policy and clear handling of dependent content. It should not be treated as equivalent to deactivating or archiving a node.

#### SHC-HIER-08 — Parent references are not validated by the mutation repository

For example, subject creation inserts the supplied `domainId`; topic creation inserts `subjectId`; subtopic creation inserts `topicId`. Update operations likewise apply the partial update directly.

The repository code does not itself check that the parent exists, is active, or is valid for the caller’s intended scope. Database foreign keys may prevent nonexistent parents, but they do not necessarily enforce application-level state or tenant policy.

Architectural recommendation: make parent validation part of the mutation contract, and consider transactionally validating the parent before the insert/update. Also verify whether changing a node’s parent should trigger descendant or cross-database synchronization.

#### SHC-HIER-09 — Audit ordering can misrepresent failed deletes

The subject, topic, subtopic, and skill engines log the delete action before performing the repository delete. If the delete fails, the audit log can still contain a deletion event.

Domain deletion has the reverse ordering: it performs the mutation and then logs. These different orderings create inconsistent audit semantics.

The correct solution is not simply to move every log after the operation: a database mutation and separate audit write can still fail independently. Prefer a transactionally coupled audit record or an explicit attempted/succeeded/failed event model, depending on the audit service’s storage boundary.

### SHC-HIER-10 — Domain and blueprint pagination counts may be incorrect

The domain and blueprint repositories both calculate `total` by filtering the conditions array using:

```
conditions.filter(c => !c.toString().includes('created_at <'))
```

The paginated query uses all conditions, including the cursor. The count query tries to remove the cursor condition by inspecting its string representation.

This is brittle: query structure is being inferred from rendered SQL text. It can miscount if the generated condition differs from the expected string. The safer design is to build separate `filterConditions` and `cursorConditions` arrays, using only the former for `total`.

- [Domain repository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/repositories/implementations/drizzle-domain.repository.ts?utm_source=chatgpt.com)
- [Blueprint repository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/repositories/implementations/drizzle-blueprint.repository.ts?utm_source=chatgpt.com)

### SHC-HIER-11 — Sync failures are observable only as logs

The sync service’s `attemptSync()` catches errors, calls `logFailure()`, and returns `false`. `sync()` awaits that method but does not expose its success/failure result. Meanwhile, CRUD handlers call it with `void`.

This means a successful CRUD response does not confirm that the corresponding tutorial hierarchy mapping was synchronized. The service does log failures, so this is not a claim that failures are completely silent; the concern is that the CRUD caller cannot act on the result and the sync path is not visibly durable.

Recommended direction: if cross-database synchronization is a correctness requirement, use a durable retryable job/outbox and surface sync status. If it is intentionally eventual consistency, document that contract and monitor failures with metrics/alerts rather than relying only on logs.

## Phase 15 — User and blueprint deeper-layer observations

I inspected the user repository, user engine, blueprint repository, schemas, and audit service.

### SHC-USER-03 — User list total ignores active filters

In `DrizzleAdminUserRepository.findAll()`, the user rows use the complete `whereClause`, which includes status, cursor, search, role, blocked, verified, and other filters.

The count query, however, only applies the active/deleted condition. Thus `total` can report the count of all active users even when the page is filtered to a specific role, search string, or verification state.

This is a confirmed pagination/API correctness defect.

[User repository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/repositories/implementations/drizzle-admin-user.repository.ts?utm_source=chatgpt.com)

### SHC-USER-04 — Role updates are accepted but not persisted by the engine

`updateUserSchema` accepts `roles?: string[]`. `AdminUserEngine.updateUser()` builds an update object containing `isBlocked`, `updatedAt`, and optionally a new password hash. It does not apply `data.roles` to the role mapping.

The route can therefore accept a role-change request while the engine does not implement the role change. This is a confirmed contract/implementation mismatch. It is not evidence of privilege escalation, but it is a sensitive RBAC management function that needs explicit implementation and tests.

[User engine](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/admin-engine/admin.user.engine.ts?utm_source=chatgpt.com)

### SHC-USER-05 — Default password is a dangerous fallback

`AdminUserEngine.createUser()` defaults to `Welcome@123` when `data.password` is missing.

The user creation route currently appears to be a stub, so I’m not claiming this fallback is reachable through that endpoint today. But the engine itself implements a predictable default password. If another route or internal caller uses this engine, it could create accounts with a shared credential.

Recommendation: require an explicit password or generate a cryptographically random one-time credential and enforce reset on first login. Avoid a fixed fallback.

### SHC-BLUE-03 — Blueprint engine does not carry an actor into mutations

`AdminBlueprintEngine` methods accept only the blueprint data or ID and do not take an admin actor. The routes authenticate, but the engine does not visibly record an actor for create/update/delete.

The `AuditService` is designed to accept a `userId`, and hierarchy engines use it. The blueprint engine does not. This leaves blueprint audit attribution inconsistent with other admin operations unless there is a separate database-level audit mechanism.

### SHC-AUDIT-01 — Audit writes are best-effort

The audit service catches its own write failures and logs an error, explicitly avoiding blocking the primary flow.

That can be a reasonable availability trade-off, but for administrative changes—especially user roles, user blocking, deletion, publishing, and blueprint mutations—there is no guarantee from this service alone that the audit event is persisted.

A stronger design would define which operations require durable audit evidence and use a transactional audit record or durable event queue for those actions.

## Phase 16 — Schema controls vs route usage

One notable discrepancy emerged while reviewing the schemas:

`apps/api-server/src/schemas/admin.schemas.ts` already exports:

```
export const idArraySchema = z.object({
  ids: z.array(uuid).min(1),
});
```

This schema validates UUIDs and requires at least one ID. The hierarchy batch-delete routes reviewed earlier do not use it; they only check `Array.isArray(ids)`.

That makes the batch-delete finding stronger than an absence of schema tooling: a reusable schema exists, but these handlers do not apply it. It still lacks a maximum batch length, so I recommend adding a bounded `.max(...)` limit and using it consistently.

[Admin schemas](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/schemas/admin.schemas.ts?utm_source=chatgpt.com)

### Current assessment

The review has now reached route → engine → repository → schema/audit service for these domains. The most material concerns from this set are:

1. Direct hard deletes for hierarchy records, with dependent-data behavior requiring explicit policy.
2. Missing application-level parent validation in hierarchy mutation paths.
3. Inconsistent audit ordering and best-effort audit persistence.
4. User list count mismatches and role-update implementation mismatch.
5. Predictable default password in the user engine.
6. Unbounded batch-delete ID arrays despite a reusable UUID schema.
7. Sync completion is not part of the CRUD success contract.

These are source-based findings. I have not run tests, exercised the endpoints, or changed the repository. The next phase should inspect the database schema/foreign-key and cascade definitions, then the admin auth audience/brand boundary and question/blueprint resource scoping to determine which conditional risks are actual policy violations.

## Repository audit — next phase: hierarchy schema and synchronization boundaries

I’m continuing from the prior audit, reading source files in connected groups rather than treating each file as an isolated checklist. This phase is focused on the hierarchy data model: domains → subjects → topics → subtopics, its duplicate representations, and what the database actually guarantees.

Scope reviewed so far: the hierarchy schema in `packages/db-people`, the corresponding `tutorial_*` schemas in `packages/db-tutorial`, and the SkillHubCore hierarchy read/create repository. This is source review only; I have not changed files or run tests.

### Findings from the schema code

1\. Two hierarchy representations exist.\
`packages/db-people/src/schema/hierarchy.ts` defines `domains`, `subjects`, `topics`, and `subtopics`. The tutorial package separately defines `tutorial_domains`, `tutorial_subjects`, `tutorial_topics`, and `tutorial_subtopics`. In the tutorial tables, each row has both its own `id` and a required `externalId`. This indicates a cross-schema identity mapping, but these declarations alone do not prove how synchronization is implemented or whether it is complete.

2\. The declared foreign keys do not specify cascade behavior.\
The people hierarchy declares `subjects.domainId → domains.id`, `topics.subjectId → subjects.id`, and `subtopics.topicId → topics.id`. The tutorial hierarchy similarly links each child to its parent. No `onDelete` action is specified in these schema declarations. I therefore cannot claim that deleting a parent cascades; the actual migration/database constraints need to be checked before drawing a production-impact conclusion.

3\. Slugs are globally unique within each table, not visibly parent-scoped.\
Both representations define unique indexes on each level’s `slug` alone. For example, the declared topic slug uniqueness is not `(subjectId, slug)`. That may be intentional for globally canonical slugs, but it can prevent same-slug names under different parents. This needs to be compared with the product’s intended hierarchy naming rules.

4\. Soft-delete fields exist, but parent-child consistency is not encoded by these declarations.\
Each people hierarchy table has `deletedAt`; tutorial hierarchy tables also have `deletedAt`. The FK declarations establish parent-row references, but they do not express “a child cannot be active if its parent is soft-deleted.” That invariant must be enforced by application logic, database policy, or a controlled cleanup workflow.

Source files: [people hierarchy schema](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-people/src/schema/hierarchy.ts?utm_source=chatgpt.com), [tutorial domains](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/tutorial-domains.ts?utm_source=chatgpt.com), [tutorial subjects](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/tutorial-subjects.ts?utm_source=chatgpt.com), [tutorial topics](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/tutorial-topics.ts?utm_source=chatgpt.com), [tutorial subtopics](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/packages/db-tutorial/src/schema/tutorial-subtopics.ts?utm_source=chatgpt.com).

### Repository/service review: subtopic creation and event publishing

The next linked files expose a concrete consistency concern in the SkillHubCore hierarchy flow.

- `HierarchyService.createSubtopic()` first calls the repository to insert the subtopic, then publishes an event, then logs and returns the created row.
- The repository insert persists `topicId`, name, slug, description, and difficulty levels. It does not persist the supplied `subjectId` or `domainId` because those are not fields on the people `subtopics` schema.
- The event publisher receives `topicId`, `subjectId`, and `domainId` from the original service input. In the files reviewed, I do not see a repository lookup that derives those parent IDs from the persisted topic relationship.
- The publisher returns early when either QStash environment variable is missing. If configured, it issues a `fetch` POST but does not check `response.ok` or otherwise handle a non-2xx response. A network rejection can still throw; an HTTP failure response may not.

Architectural implication: the event payload’s `subjectId` and `domainId` are caller-supplied context, not values proven by the inserted database row in this flow. That is a potential hierarchy-integrity issue for downstream consumers, especially if those consumers trust the event’s ancestry fields. It is not evidence that an exploit or incorrect production event has occurred.

A safer pattern is to derive ancestry from the persisted topic in a transaction or validated lookup, then publish via a durable outbox (or another retryable mechanism). At minimum, validate the parent chain and check the publisher’s HTTP result before treating publication as successful.

Sources: [HierarchyRepository](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/skillhubcore-service/src/modules/hierarchy/hierarchy.repository.ts?utm_source=chatgpt.com), [HierarchyService](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/skillhubcore-service/src/modules/hierarchy/hierarchy.service.ts?utm_source=chatgpt.com), [HierarchyPublisher](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/skillhubcore-service/src/modules/hierarchy/hierarchy.publisher.ts?utm_source=chatgpt.com), [Hierarchy types](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/services/skillhubcore-service/src/modules/hierarchy/hierarchy.types.ts?utm_source=chatgpt.com).

## Hierarchy synchronization audit — findings

I reviewed `HierarchySyncService` and the admin sync and retry worker routes. This phase has several important findings, including two concrete logic defects in the sync/retry workflow.

### 1. `retryFailed()` currently has no retry candidates

In `HierarchySyncService.retryFailed()`, `entityBatches` is initialized as an empty array and no code populates it. The nested loop therefore never executes, and the method returns:

- `total: 0`
- `succeeded: 0`
- `failed: 0`

The retry worker route calls this method after QStash signature verification. Thus, the worker’s current retry path appears to be a no-op. The route can return a successful response with zero work performed. This is a confirmed source-level defect, not merely a concern.

### 2. Bulk sync includes deleted source records and can revive them in TutorialDB

`syncAll()` queries all domains, subjects, topics, and subtopics without visible `deletedAt IS NULL` filters.

Each `upsertTutorial*()` helper then sets `deletedAt: null` both when inserting and when updating an existing mapping. Consequently, when a deleted source entity is included in `syncAll()`, the corresponding tutorial-side row can be created or reset to active.

This creates a significant risk of resurrecting soft-deleted hierarchy records in the tutorial database. The source queries should be reviewed and corrected to define whether deleted records should be excluded, propagated as deleted, or handled by a separate reconciliation path.

### 3. The sync wrapper suppresses the success/failure signal

`attemptSync()` returns a boolean and catches errors, logs them, and returns `false`.

However, `sync()` simply awaits `attemptSync()` and returns `Promise<void>`. It discards that boolean. This means callers of `sync()` cannot tell whether synchronization succeeded. This is especially relevant because the prior audit found hierarchy mutations invoking sync asynchronously.

The code should either propagate errors from `sync()` or return a meaningful result. If fire-and-forget behavior is retained, failures need durable tracking and a real retry mechanism rather than log-only recovery.

### 4. Mapping verification checks existence, not correctness

`ensureTopicHierarchySynced()` performs a transaction to upsert the topic’s hierarchy and active subtopics, then verifies that rows exist by `externalId`.

That is a useful safeguard, but the verification does not compare the mapped row’s parent IDs with the expected parent chain. For example, it checks that a tutorial topic mapping exists, but not that its `subjectId` matches the expected tutorial subject. A stale or incorrect parent mapping could pass the current existence check.

The stronger invariant is to verify both mapping identity and ancestry:

- external ID maps to the expected internal ID
- subject belongs to the expected domain
- topic belongs to the expected subject
- subtopic belongs to the expected topic

### 5. Admin bulk-sync authorization is a fallback model

The admin sync route accepts the internal key only when `INTERNAL_API_KEY` is non-empty and matches the request header; otherwise it invokes `requireAdminRouteAccess()`.

That behavior avoids a missing-secret fail-open in this route, but the internal key comparison is ordinary string equality. I would standardize this with the project’s shared internal-auth helper and ensure the key is rotated if it has ever been exposed in logs or deployment artifacts. This is a hardening recommendation, not evidence of a demonstrated bypass.

### Phase conclusion

| Finding                                                                    | Severity    | Confidence                                                  |
| -------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| `retryFailed()` has an empty candidate list and performs no retries        | High        | Confirmed in source                                         |
| `syncAll()` can include soft-deleted source rows and upsert them as active | High        | Confirmed in source; production impact depends on execution |
| `sync()` discards the sync result                                          | Medium–High | Confirmed in source                                         |
| Mapping verification does not validate parent relationships                | Medium      | Confirmed in source                                         |
| Bulk sync internal-key check should use shared auth handling               | Medium      | Hardening recommendation                                    |

Sources: [HierarchySyncService](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/modules/hierarchy/hierarchy-sync.service.ts?utm_source=chatgpt.com), [admin hierarchy sync route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/admin/hierarchy/sync/route.ts?utm_source=chatgpt.com), [retry worker route](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/main/apps/api-server/src/app/api/workers/retry-hierarchy-sync/route.ts?utm_source=chatgpt.com).

No files have been modified and no tests have been run. The next review phase should inspect the database migrations/actual FK constraints and the question/blueprint authorization boundary, to determine whether hierarchy deletion and resource-scoping risks are enforced elsewhere.

