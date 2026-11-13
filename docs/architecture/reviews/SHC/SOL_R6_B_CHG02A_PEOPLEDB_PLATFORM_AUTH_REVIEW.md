# CHG-02A PeopleDB platform-scoped authentication review

Date 14 November 2026, Asia/Calcutta.

## Disposition

The approved Option 2 correction is implemented and verified with controlled persistence and HTTP adapters. Standalone SUIA/RTH administrators remain supported. Ambiguous normalized email matches are rejected. Login and refresh credentials are restricted to the authenticated account platform and its persisted grant.

Service tests, service typecheck, service zero-warning lint, service build, PeopleDB package typecheck, CHG-01B regression tests and the existing mocked SHC login/logout tests passed. The additional shared-types lint gate remains FAIL with two existing errors and nine existing warnings. Its frozen baseline produces the identical diagnostics. Full technical acceptance remains pending that gate and separately approved runtime qualification.

## Authority and provenance

The owner approved narrow source/test corrections and subsequently selected preservation of the existing multi-platform standalone admin contract. That decision permits an optional account-platform selector, followed by independent credential, account, role and persisted platform-access verification. Database changes and activation of currently unmounted authentication routes require separate approval.

Filesystem reads of `.git/HEAD` and `.git/refs/heads/main` identified local `main` at `db2f5a6d0db1fb2f8ee7ae56942030b87c76898a`. Source hashes are recorded in `.evidence/r6-chg02a/BASELINE.json` and `FINAL_VERIFICATION.json`. No Git CLI was used. The file manifest covers identified source paths and protected receipts. Whole-worktree Git status and remote/deployed provenance were outside this check.

The governing references were SHC 00, proposed PSEG-001 v1.1, architecture annex 02, acceptance annex 03 and workflow annex 04, together with the latest CHG-01B and Option 2 owner instructions. Relevant gates are trusted brand authority, least privilege, typed contracts, safe errors and preservation of established consumers. Owner instructions authorize this remediation over the historical read-only work order. PSEG-001 retains its proposed status. Canonical acceptance statuses remain owner-controlled.

## Verified original behavior

1. `DrizzleUserRepository.findByEmail()` selected an undeleted PeopleDB user by exact email and `LIMIT 1`, without a platform predicate or ambiguity detection.
2. Registration and ordinary login called that method without platform context.
3. Ordinary login granted the requested platform to whichever account had been selected.
4. Standalone administrator login accepted email/password without a platform selector. An account's existing platform array, or a fallback containing both businesses, became the issued token scope. The first array element became session authority.
5. Refresh reconstructed token/session scope from the current platform array, allowing a restricted login to widen on refresh.
6. The dedicated SHC Admin flow uses `api/shc/auth/login` and the separate `SHCAuthService`, which constrains account selection to `skillhubcore` and issues the dedicated SHC admin token. This implementation was preserved.

The standalone `createAuthRoutes()` factory is exercised by tests but is currently absent from the standalone service's `src/index.ts` route mounts. These are verified source defects and future compatibility risks. Public reachability or exploitation of those unmounted routes has not been established.

## Email lookup and write inventory

The operation-level inventory is `.evidence/r6-chg02a/EMAIL_LOOKUP_INVENTORY.csv`, with eighteen rows covering direct authentication lookups, email writes, identity projection, known operational consumers and distinct brand-database repositories.

| Operation | Current selection and disposition |
|---|---|
| Standalone registration | Normalized email and explicit requested account platform. Creation normalizes stored email. |
| Standalone login | Normalized email and explicit requested account platform. Account platform is independently checked against the returned record. |
| Standalone administrator login with selector | Normalized email and selected platform, followed by password, current eligibility, admin role and persisted grant checks. |
| Standalone administrator login without selector | Normalized email across supported SUIA/RTH account platforms. Exactly one undeleted account must match. Multiple matches fail before password checking. |
| Repository selection | Parameterized `LOWER(TRIM(email))`, platform restriction, undeleted predicate and two-row cardinality check. Same-platform duplicates also fail closed. |
| Dedicated SHC login | Existing fixed `skillhubcore` predicate, eligibility and dedicated token authority preserved. Stored email still uses exact equality against normalized input. |
| Identity bridge | Existing `(external_id, platform)` selection and UUID-based update. Email is copied from brand authority. CHG-03 concurrency and normalization remain separately scoped. |
| Brand-admin student create and admission | Existing fixed `skillup` checks inventoried. Admission already requires exactly one normalized active account. These modules were unchanged. |
| Brand-admin email update | Existing student UUID selects the person. Its validated email write lacks consistent trim/lower normalization and requires separately scoped compatibility review. |
| Invitation redemption | Invitation token/ID and expected platform establish identity. Email is a binding comparison. |
| Brand-admin reporting | Existing enquiry email joins require separate cross-brand compatibility qualification before broader migration acceptance. |
| PeopleDB development seed | `seed-skillup.ts` uses `ON CONFLICT users.email`. This depends on the existing global constraint and needs separate migration-precondition review. The seed was never executed. |
| Password recovery/email change in standalone auth router | No such handler is exported by the current router. No capability was added. |
| API-server generic signup/login/recovery/admin repositories | These use context-selected SkillUpDB/RthDB or legacy MainDB tables. Their email methods are distinct from the PeopleDB repository corrected here. |

Direct PeopleDB import consumers and email predicates were cross-checked against the standalone repository, dedicated SHC service, identity bridge, PeopleDB invitation repository and brand-admin consumers. Held attendance/payment implementation was excluded from dedicated investigation and modification.

## Implemented contract

### Account selection

`IUserRepository.findByEmail(email, platform?)` now documents the legacy unambiguous-admin use of the optional platform. Existing registration and login callers supply their platform explicitly. Repository selection is normalized, parameterized, bounded to two rows and rejects multiple results with generic `Invalid credentials`.

An omitted platform restricts candidates to `skillup` and `realtutorialhub`. An SHC PeopleDB account cannot become a standalone business administrator merely through a matching email or role. The service independently checks the returned platform, including when a repository adapter misbehaves.

Inactive accounts remain reserved during duplicate checks and denied during authentication. Deleted accounts are excluded from lookup. A future uniqueness migration must continue to enforce the agreed undeleted normalized identity key. Concurrent registration uniqueness remains a database constraint responsibility. Controlled tests demonstrate cardinality rejection and explicit selection, with real database concurrency qualification still pending.

### Permission and session scope

The optional admin request-body platform is an account selector. Its value alone confers no grant. The account must authenticate its password, be active and undeleted, have a current `admin` or `super_admin` role, and possess an undeleted persisted grant for its own platform.

Both ordinary login and administrator login issue a singleton platform list. Administrator JWT brand and persisted session platform come from the selected account. There is no both-brand fallback. Ordinary login requires an existing platform grant and no longer grants access during authentication.

Refresh uses the persisted session's platform, requires a matching current account platform and grant, and preserves the singleton scope. Disabled/deleted accounts and revoked grants are denied. Existing refresh reuse detection and current persisted role selection remain in place.

### Compatibility impacts

- A legacy administrator request with an unambiguous business account can continue omitting platform.
- Same-email accounts on both businesses require explicit account selection. An omitted selector returns generic authentication failure.
- Missing platform grants now deny login. Authentication no longer repairs or creates those grants implicitly.
- Tokens issued from this flow carry the selected account platform. A second business requires its independently authorized account.
- Refresh of a legacy session whose platform differs from its account platform is denied. A correct-platform login is required.
- Legacy already-issued access JWTs are unaffected by this source patch until their ordinary expiry or existing revocation controls apply. This task does not claim immediate invalidation of every previous broad-scope token.
- Live projection/grant completeness, persisted duplicate data and browser compatibility were untested. Account tables, constraints and existing records were untouched.

## Exact changed source and test paths

| File | Reason |
|---|---|
| `packages/types/src/tutorial-repositories.types.ts` | Optional platform argument on the existing PeopleDB repository contract, with documented legacy selection semantics. |
| `services/skillhubcore-service/src/modules/user/user.repository.ts` | Normalized platform-qualified lookup, ambiguity rejection and normalized user email creation. |
| `services/skillhubcore-service/src/modules/auth/auth.service.ts` | Scoped register/login/admin selection, persisted grant checks and singleton issued platform scope. |
| `services/skillhubcore-service/src/modules/auth/auth.routes.ts` | Normalized email validation and optional validated administrator account selector. |
| `services/skillhubcore-service/src/modules/auth/token-rotation.service.ts` | Preserve persisted session platform and validate current account/grant on refresh. |
| `services/skillhubcore-service/src/modules/auth/__tests__/auth.service.test.ts` | Distinct same-email accounts, real password/token operations over in-memory persistence, route integration and denied authority cases. Existing cross-grant assertions follow the newly approved contract. |
| `services/skillhubcore-service/src/modules/auth/__tests__/token-rotation.service.test.ts` | Assert selected-platform retention in the existing rotation test. |
| `services/skillhubcore-service/src/modules/user/__tests__/user.repository.test.ts` | New regression coverage of generated SQL, ambiguity, persistence failure and normalized creation through controlled adapters. |

Evidence runners, receipts, the inventory and this report support the change. Graphify AST output was refreshed as required by repository instructions.

## Executed verification

Commands, timestamps and final exit codes are in `QUALITY_RESULTS.json`, `ADDITIONAL_QUALITY_RESULTS.json`, `SHC_COMPATIBILITY_RESULT.json` and the final build/Graphify receipts under `.evidence/r6-chg02a/`.

| Gate | Result | Exit |
|---|---|---|
| Before implementation, approved contract tests against original production source | 5 passed, 7 failed | 1 |
| Final standalone auth, SSO, token, middleware and repository tests | 38 passed across 10 files | 0 |
| CHG-01B helper/caller/signed-token regressions | 38 passed across 3 files | 0 |
| Existing dedicated SHC mocked login/logout compatibility | 3 passed | 0 |
| Standalone service typecheck | PASS | 0 |
| Standalone service lint with `--max-warnings=0` | PASS, zero warnings | 0 |
| Standalone TypeScript build | PASS, final rerun completed | 0 |
| PeopleDB package typecheck | PASS | 0 |
| Shared repository-types file lint with existing shared ESLint configuration | FAIL, 2 existing errors and 9 existing warnings | 1 |
| Graphify AST update | PASS, 37,375 nodes and 87,342 edges | 0 |

The first typecheck found a test-fixture null-only inference and a widened platform-array type. Both were corrected with explicit existing types. The initial shared-types lint invocation lacked a discoverable package config and exited 2. Rerunning with `packages/eslint-config/index.js` exposed the existing diagnostics. No rules were disabled or warnings suppressed.

`SHARED_TYPES_LINT_COMPARISON.json` verifies the reconstructed pre-change shared file against its frozen SHA-256 and compares baseline/current lint results. Both contain identical diagnostics at the same lines. The two errors are unused `LiveSessionRequestCreateInput` and `LiveSessionRequestUpdateInput` imports. Nine warnings concern the existing `PeopleDbClientLike` declarations at lines 427–432. Their cleanup is outside the narrowly approved authentication correction. This extra gate remains failed.

The service route test uses actual Hono validation, the real authentication service, password hashing and JWT signing/verification with synthetic accounts. Repository SQL is generated by Drizzle and checked directly, while query results come from controlled adapters. These tests provide controlled source-level verification. Actual PostgreSQL execution, browser sessions and deployment were unexecuted. No provider requests or real database writes were performed, so remote fixture cleanup is N/A.

The three final test selections total 79 passing tests. Final verification recorded 62 protected source/ledger comparisons with zero mismatches. Graphify emitted its existing cache-root and community-label notices. AST extraction completed successfully, and semantic labeling was outside this task.

## Generated Next.js declaration and approval plan

The committed `apps/skillup-web/next-env.d.ts` imports `.next/types/routes.d.ts`. SUIA's typecheck script runs `next typegen`. The installed Next.js `dist/lib/typescript/writeAppTypeDeclarations.js` computes that import from the current `distDir` and appends `types/routes.d.ts`. Its development variant can therefore contain `.next/dev/types/routes.d.ts`.

The file's own header identifies it as generated, and root `.gitignore` line 185 ignores `**/next-env.d.ts`. Its inclusion in the previous commit resulted from the explicit commit-all instruction and prior tracking. The generated import is consistent with the build/typegen destination. Continued version-control retention is an owner policy decision. Its bytes were preserved in this task.

The previously missing `.evidence/r6-existing-p1/R6_B_SAFE_IMPLEMENTATION_APPROVAL_PLAN.md` is now present locally. Its tracking/remote presence was unverified under the Git prohibition. It still contains the earlier shadow-to-learner fallback suggestion. The newer owner decision and committed CHG-01B contract supersede that suggestion. This task did not edit the other model's plan or authorize any of its migration phases.

## Remaining gates and migration readiness

The scoped authentication correction is ready for source review with the failed shared-types diagnostic disclosed. PeopleDB uniqueness migration remains HOLD pending separate approval, data/constraint checks, seed conflict-target compatibility, projection/bridge review, operational email-consumer qualification and the existing migration safety plan. Passing mocked duplicate-account tests does not establish that the current live database permits those rows.

The standalone registration router also accepts a requested role including `admin`. It remains unmounted by the current service entry point. Deployment or activation would require a separate registration-authority review. This task retained that existing business contract and made no new route mount.

CHG-01B and recorded R6-A/P0 protected source hashes were compared with their existing receipts. Their preservation is source evidence. This task does not re-certify the full historical test suite or the 195-method authorization matrix. The canonical SHC CSV and original Q-register were preserved, and Q48 remains OPEN.

No database schema/data changes, migrations, dummy-data reset, Git CLI operation, commit, push, deployment or Docker operation occurred. Attendance, payments, Marketing and broader faculty/UI/performance work retain their owner HOLD.
