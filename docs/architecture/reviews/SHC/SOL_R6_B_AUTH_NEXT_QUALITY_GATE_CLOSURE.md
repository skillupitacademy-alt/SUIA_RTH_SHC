# R6-B Authentication and Next.js Quality-Gate Closure

Reviewed 14 November 2026 on local main at `ecbad61b9f117d83e724d3f9e6e3c8cb55f5665f`, matching the owner-confirmed baseline. The initial working tree was clean. Changes are available locally for review.

## Outcome

All 20 previously failing authentication cases now pass against the current production security contracts. The final full authentication run passed 386 tests in 80 files, including three added controls for unknown refresh credentials, concurrently consumed refresh credentials, and logout while a second device remains active. The prior recorded run had 363 passing and 20 failing tests. An initial corrected rerun passed 383, followed by the final 386-test run after the added controls.

The five Next.js type/module errors are corrected. Full SUIA Admin production build, generated-route validation, and post-build application typecheck passed with completed exit codes. Shared-types lint now passes with zero warnings, resolving its previous two errors and nine warnings. Full Admin zero-warning lint fails on 45 warnings across three unchanged invitation/admission files. This gate requires a separate bounded disposition before full quality acceptance.

## Governing sources and scope

Applied the owner's latest quality-only authorization with `AGENTS.md`, SHC `00_READ_ME_FIRST`, PSEG-001 proposed v1.1, architecture annex 02, acceptance annex 03, workflow annex 04, checklist 05 and the canonical SHC CSV. Referenced the Policy A/B security report, CHG-03 source review, final PeopleDB blocker-decisions report and its exact 20-case classification. PSEG-001 remains proposed working governance. The original acceptance registers retain their owner-controlled status and Q48 is OPEN.

The executed work covers authentication test fixtures, five existing Admin type/module boundaries and shared-types lint. PeopleDB migration and real PostgreSQL qualification remain HOLD pending separate approval. Attendance, payments, Marketing and broader accessibility/performance retain their HOLD status. General Admin compilation and lint incidentally traversed existing held files.

## Authentication corrections

The older mocks lacked signed subject/persisted-session owner parity, strict current-account eligibility, atomic token consumption and active-session lookup. Fixtures now supply those existing contracts. Blocked, missing, expired and revoked accounts or credentials retain explicit denial assertions. Logout fixtures assert the last-device transition. The added other-device case verifies that revoking one token preserves another active device's online state.

The internal-auth case now uses a real signed JWT bound to the exact refresh credential and controlled persisted-session/account adapters. It verifies access-only denial, valid pair admission and invalid privileged-key denial before session lookup.

The historical exam-grace test names described behavior absent from the current `TokenRefreshService`. Inspection shows that `examId` does not drive expiry or query the exam repository. The affected cases now assert current-session rotation, owner/brand/audience/device binding and the absence of exam authority. This is an explicit current-contract disposition. Historical custom-expiry/grace behavior has no verified implementation in this task. Restoring it would require a separately approved contract decision.

| Original case | File | Executed current assertion | Result |
|---|---|---|---|
| 1 | `auth.branches2.test.ts` | logout no-ops when session not found (405-406) | PASS |
| 2 | `auth.branches3.test.ts` | AuthService.refresh: a current session rotates without an exam ID | PASS |
| 3 | `auth.branches3.test.ts` | AuthService.refresh: absent exam metadata cannot change rotation | PASS |
| 4 | `auth.branches3.test.ts` | AuthService.refresh: zero-duration exam metadata cannot change rotation | PASS |
| 5 | `auth.branches3.test.ts` | AuthService.refresh: expired exam metadata cannot change rotation | PASS |
| 6 | `auth.branches3.test.ts` | AuthService.logout: recovers the signed owner when userId is omitted | PASS |
| 7 | `auth.logout.branch.test.ts` | revokes refresh token and backdates lastActiveAt | PASS |
| 8 | `auth.logout.edge.test.ts` | marks refresh token revoked and bumps lastActiveAt backwards | PASS |
| 9 | `auth.service.tail.lines.test.ts` | refresh: throws when user is blocked | PASS |
| 10 | `auth.service.tail.lines.test.ts` | refresh: throws when user not found (line ~201) | PASS |
| 11 | `auth.service.test.ts` | detects token reuse | PASS |
| 12 | `auth.service.test.ts` | throws if refresh token is expired according to DB | PASS |
| 13 | `auth.service.test.ts` | rotates an eligible session without using exam metadata as authority | PASS |
| 14 | `auth.service.test.ts` | sets user offline immediate | PASS |
| 15 | `auth.tail.test.ts` | AuthService.refresh: rotates the current learner session independently of exam metadata | PASS |
| 16 | `auth.tail.test.ts` | AuthService.logout: forces offline status if userId is provided | PASS |
| 17 | `auth.tail2.test.ts` | refresh: expired exam metadata cannot override current session rotation | PASS |
| 18 | `auth.tail2.test.ts` | refresh: short exam metadata cannot override current session rotation | PASS |
| 19 | `auth.tail2.test.ts` | refresh: long exam metadata cannot override current session rotation | PASS |
| 20 | `batch-08-internal-auth-boundary.test.ts` | 7. SECURITY INVARIANT: bad internal key is denied with a real signed learner token | PASS |

The original names, failure messages and final executed mappings are preserved in `.evidence/r6-quality-closure/TWENTY_CASE_DISPOSITIONS.json`. No test is skipped or removed. Production authentication logic retains its baseline bytes.

## Five Next.js corrections

| File under apps/skillup-admin/src/app | Correction |
|---|---|
| `(admin)/audit/page.tsx` | Await optional Promise searchParams before deriving the same filters. |
| `(admin)/batches/[id]/page.tsx` | Await Promise params before the existing lookup. |
| `(admin)/crm/enquiries/[id]/page.tsx` | Await Promise params before the existing lookup. |
| `(admin)/students/[id]/page.tsx` | Await Promise params after the existing role check. |
| `api/admin/students/invite/redeem/route.ts` | Keep hasZeroAffectedRows module-private. Repository search found no importing consumer. POST logic retains its existing behavior. |

## Shared-types correction

`packages/types/src/tutorial-repositories.types.ts` removes two unused live-session type imports and replaces nine explicit any occurrences in the existing PeopleDbClientLike structural adapter with unknown. The adapter implementations and affected service/API/Admin typechecks pass. The unknown boundary requires callers to narrow values before inspection. No runtime statement changes arise from this type-only edit.

## Verification

All recorded commands use controlled persistence or compile-time validation. The final auth, regressions and quality runs clear inherited database/provider configuration and preload a network transport guard inherited by child processes. Outbound fetch, TCP and TLS are blocked. Existing tests supply their controlled adapters. The first 383-test rerun used the prior controlled runner before the added guard. Its receipt and log are preserved as the initial result.

| Selection | Passed | Files |
|---|---|---|
| Complete API authentication suite | 386 | 80 |
| Exam engine, report receiver and current learner/device session regressions | 149 | 27 |
| Standalone auth/SSO/user/JWT regressions | 51 | 10 |
| Policy A reporting identity | 7 | 1 |
| CHG-03 bridge | 15 | See raw receipt |
| CHG-01B SUIA identity | 38 | 3 |
| Total executed final selections | 646 | Selections above |

| Gate | Exit | Result |
|---|---|---|
| `pnpm --filter @quiz/types exec tsc --noEmit -p tsconfig.json` | 0 | PASS |
| `pnpm exec eslint --no-ignore --config packages/eslint-config/index.js --max-warnings=0 packages/types/src/tutorial-repositories.types.ts` | 0 | PASS |
| `pnpm --filter @quiz/api-server exec tsc --noEmit` | 0 | PASS |
| `pnpm --filter @quiz/skillup-admin type-check` | 0 | PASS |
| `pnpm --filter @quiz/skillup-admin lint --max-warnings=0` | 1 | FAIL |
| `pnpm --filter @quiz/skillhubcore-service exec vitest run src/modules/auth src/modules/user/__tests__ src/middleware/__tests__/verify-jwt.test.ts` | 0 | PASS |
| `pnpm exec vitest run --config .evidence/r6-policy-ab/report-tests.vitest.config.mts` | 0 | PASS |
| `pnpm --filter @quiz/identity-bridge test` | 0 | PASS |
| `pnpm --filter @quiz/skillup-web exec vitest run src/lib/student-auth.test.ts src/lib/student-auth-callers.test.ts src/lib/student-auth-token-contract.test.ts --maxWorkers=1` | 0 | PASS |
| `pnpm --filter @quiz/skillhubcore-service type-check` | 0 | PASS |
| `pnpm --filter @quiz/skillhubcore-service lint` | 0 | PASS |
| `pnpm --filter @quiz/skillhubcore-service build` | 0 | PASS |
| `pnpm --filter @quiz/skillup-admin exec next build --webpack` | 0 | PASS |
| `pnpm --filter @quiz/skillup-admin type-check` | 0 | PASS |
| `pnpm --filter @quiz/api-server exec vitest run src/modules/exam-engine/__tests__ src/app/api/generate-report/__tests__/report-auth.test.ts src/lib/__tests__/current-learner-context.test.ts src/app/api/auth/me/__tests__/device-session.test.ts --maxWorkers=1` | 0 | PASS |
| `pnpm --filter @quiz/api-server exec eslint --no-ignore --max-warnings=0 src/modules/auth/__tests__/auth.branches2.test.ts src/modules/auth/__tests__/auth.branches3.test.ts src/modules/auth/__tests__/auth.logout.branch.test.ts src/modules/auth/__tests__/auth.logout.edge.test.ts src/modules/auth/__tests__/auth.service.tail.lines.test.ts src/modules/auth/__tests__/auth.service.test.ts src/modules/auth/__tests__/auth.tail.test.ts src/modules/auth/__tests__/auth.tail2.test.ts src/modules/auth/__tests__/batch-08-internal-auth-boundary.test.ts` | 0 | PASS |
| `pnpm --filter @quiz/skillup-admin exec eslint --no-ignore --max-warnings=0 src/app/(admin)/audit/page.tsx src/app/(admin)/batches/[id]/page.tsx src/app/(admin)/crm/enquiries/[id]/page.tsx src/app/(admin)/students/[id]/page.tsx src/app/api/admin/students/invite/redeem/route.ts` | 0 | PASS |

Exact UTC start/end timestamps are in QUALITY_RESULTS.json, REGRESSION_RESULTS.json, ADMIN_TARGETED_LINT_RESULT.json and API_AUTH_TEST_RESULT.json. Raw stdout/stderr logs remain in the same local evidence directory. FINAL_SOURCE_MANIFEST.json records their hashes and exact changed-source hashes. The graphify AST update completed with exit 0. It reported ordinary extractor/cache/community-label warnings, recorded in its log.

## Full Admin lint exception

The full application command reports 0 errors and 45 warnings, then exits 1 under max-warnings=0. Nine warnings occur in admission collision tests, 28 in invitation redemption tests and eight in student-invitation.ts. These three sources and the app lint configuration match the baseline. ADMIN_LINT_EXCEPTION.json contains their hashes. All five changed Admin source files separately pass zero-warning lint, as do all nine changed auth test files. Expanding invitation implementation beyond the authorized module boundary requires a separate owner decision. No lint rule was disabled.

## Generated declarations and protected corrections

Read-only commit inspection confirms ecbad61b contains only the SUIA next-env.d.ts route declaration change from `.next/types/routes.d.ts` to `.next/dev/types/routes.d.ts`. Installed Next 16.1.6 derives this path from distDir in its writeAppTypeDeclarations implementation. The declaration matches a development-generated route path and remains tracked despite the broader ignore pattern. This task leaves its baseline bytes intact.

PROTECTED_SOURCE_CHECK.json verifies 17 protected source/acceptance inputs against HEAD, including P0 report triggering, current refresh/logout implementations, CHG-01B, CHG-02A, bridge sources, Policy A/B administration/reporting and both canonical acceptance inputs. The final modified-source inventory contains nine authentication test files, five Admin boundary files and one shared type file.

## Remaining prerequisites

1. Resolve or explicitly accept the 45-warning Admin lint exception through a bounded owner decision.
2. Approve an isolated real-PostgreSQL target and exact synthetic scope for same-email separate-platform identities, concurrent bridge writes, platform grants, row locking, partial failure and rollback. Controlled tests alone cannot close these physical database gates.
3. Independently review the exact PeopleDB uniqueness migration and the pending 0009_student_invitations dependency/order decision. Preserve historical migration hashes and ledger entries.
4. Verify backup/restoration in the approved isolated environment and establish the recovery boundary before shared execution. Re-adding global email uniqueness may fail after valid cross-platform duplicates exist.
5. Separately approve and verify reconciliation of the three previously reported unlinked brand accounts using authoritative platform/external IDs. Current account counts were not remeasured here.
6. Obtain separate deployment/browser qualification and owner acceptance. The prior cold-start quiz-result root cause remains unproven and outside this task.

Production authentication defects were not demonstrated by the repaired fixtures. Full quality acceptance remains PARTIAL because the application-wide lint gate fails. All work in this assignment stayed within source types, controlled tests and evidence. Database and deployment operations await their separate authorizations.
