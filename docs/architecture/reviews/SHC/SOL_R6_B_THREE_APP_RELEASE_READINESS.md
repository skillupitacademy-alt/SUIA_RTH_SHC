# R6-B technical acceptance and three-application database readiness

Reviewed 14 November 2026 against local commit `4913531c444995680d2e8e052e8777c727e2685c`. The owner directed localhost checks and retained the deployment prohibition. This report completes the readiness gate. Shared PeopleDB migration remains HOLD and Q48 remains OPEN.

## Technical acceptance

Recommend closure of the R6-B fresh migration replay technical blocker. The reviewed commit implements the approved exact-object compatibility strategy in `packages/db-people/src/migration-compatibility.ts`, `scripts/migrate.mts` and the existing package migration command. Seven guarded duplicate objects cover two foreign keys and five indexes. Existing definitions must match catalog expectations, and mismatches abort the transaction. Original migration hashes and ledger ordering are preserved.

The existing final receipts record 24/24 PostgreSQL tests, 25/25 focused regressions, and completed exit-zero package typecheck, CLI typecheck, affected zero-warning lint and build. Fresh supported replay, pending 0009 upgrade, repeat execution, mismatched objects, applied-definition drift, ledger drift, rollback and competing migrations are covered. Four owned scratch databases were deleted. The disposable branch remains retained for owner review.

This review recomputed all ten historical SQL hashes and all seven source/evidence manifest hashes successfully. The current protected PeopleDB ledger matches the source prefix through 0008, including all nine hashes and timestamps. Existing qualification tests were reused. No discrepancy required rerunning them. Prior receipts document disposable execution and cleanup. This review's database activity comprised a read-only transaction ending in ROLLBACK.

Evidence resides in `.evidence/r6-final-migration` and `.evidence/r6-release-readiness`. This is repository and database evidence review. Runtime operation history outside these receipts cannot be reconstructed from the commit alone.

## Current database preflight

Read-only inspection at 03:54 UTC on 14 November returned the following state.

| Item | Observed result |
|---|---|
| Neon project | `bitter-tree-18287476` |
| Shared branch ID | `br-misty-wildflower-a1jalxmd` |
| Direct endpoint | `ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech` |
| Database and role | `people_prod`, `neondb_owner` |
| PostgreSQL | 17.12 |
| Applied ledger | 0000–0008, source hashes/timestamps match |
| Pending historical migration | `0009_student_invitations` |
| Invitation table | Absent |
| Current email constraint | `users_email_unique UNIQUE(email)` |
| Existing mapping index | Unique `(external_id, platform)` with non-null external ID predicate |
| Normalized active same-platform duplicate groups | Zero |
| Platform enum | `realtutorialhub`, `skillup`, `both`, `skillhubcore` |

Server-side project/branch settings positively distinguish this shared target from disposable branch `br-young-silence-a1b1ta26`, endpoint `ep-fragrant-brook-a1mhx5dm`. Console branch labels, recovery retention and protected restore capability still require operator confirmation before future execution. The zero-duplicate count is time-bound and must be checked again in the approved migration window.

### Remaining migration artifact

The normalized uniqueness candidate currently exists only in `.evidence/r6-neon-qualification/CANDIDATE_UNIQUENESS_REHEARSAL.sql`. The registered package journal ends at 0009. Consequently, the current supported migration command would apply pending 0009 and retain global email uniqueness.

The separately reviewed append-only migration must register the candidate and its generated metadata after 0009. Its intended SQL creates `uniq_users_email_platform` over `(LOWER(TRIM(email)), platform) WHERE deleted_at IS NULL` before dropping `users_email_unique`. Its final bytes, journal timestamp and hash require review before shared execution. No historical SQL needs rewriting. Preparation of this executable migration is a remaining source deliverable requiring the next bounded authorization.

## Three-application integration

| Application and localhost URL | Existing authority and dependencies | Current verification and remaining gate |
|---|---|---|
| SHC Admin, `http://skillhubcore.localhost:3007/login` | Dedicated `SHCAuthService` selects active, non-deleted PeopleDB `skillhubcore` accounts. Current-account authority, administrative RBAC, gateway secrets and shared academic services remain required. | Login-page GET returned 200. Shared enum contains `skillhubcore`. Authenticated administrative runtime smoke remains pending. |
| SUIA, `http://skillup.localhost:3009/login` | Brand login uses SkillUpDB through `brand-db.ts`. Existing bridge projects `(skillup, external_id)` into PeopleDB. PeopleDB-backed helper operations verify the signed person UUID against the exact active SkillUp learner mapping. Learner UUID and person UUID have explicit contracts. | Login-page GET returned 200. Source and prior bounded identity tests support the contract. Actual account projection, persisted device session and private-resource flows require authenticated smoke. |
| RTH, `http://realtutorialhub.localhost:3003/login` | Brand login uses RthDB. Existing bridge projects `(realtutorialhub, external_id)` into PeopleDB. Gateway and persisted device-pair session validation protect existing private operations. | Login-page GET returned 200. Current-account login, refresh and cross-user/brand denial require authenticated smoke. |

Shared browser-session checks require correctly configured `GATEWAY_URL` and `INTERNAL_GATEWAY_SECRET`, forwarded cookies, trusted original host, matching signing configuration and both access/refresh credentials bound to the active persisted session. Local root gateway configuration resolves to loopback. App process environment inheritance and upstream routing remain runtime checks. A successful login-page GET establishes page availability.

Local configuration contains SUIA and RTH email/password references. Their validity was not exercised. An identified SHC administrator email/password pair was not found in the inspected root/app environment files. Existing fixture JSON contains learning-resource references. It provides no SHC login credential evidence. Credential values are excluded from this report and receipts.

Repository deployment configuration loads shared and per-service environment files from `/opt/platform/env`; those remote files are unavailable to local source inspection. Future environment verification must compare PeopleDB, SkillUpDB, RthDB, MainDB and TutorialDB bindings without exposing passwords. The standalone service's authentication-route mount policy and registration authority must retain their existing review gates. Existing mounted SSO administration requires Policy B current permission and same-platform scope. Cross-platform restoration remains denied under that contract.

## Controlled migration and recovery procedure for separate approval

1. Review and register the append-only normalized-uniqueness migration after 0009. Pin the source revision and final SQL/journal hashes. Inspect pending 0009 invitation schema and its generated metadata as part of the exact execution batch.
2. Confirm the approved shared project, branch ID, direct endpoint, database and role against the preflight receipt. Repeat a READ ONLY transaction to capture ledger hashes, both FK and all seven guarded object definitions, platform enum, mapping/grant integrity and normalized active duplicate groups. Resolve unexpected catalog or data differences before execution.
3. Establish an owner-approved backup of protected schema, data and migration ledger, with restricted access, restore target and recovery point recorded. Prior synthetic logical restore proves the disposable procedure. Protected backup availability, retention and restoration remain pending. Define the acceptable data-loss window and coordinate application writers for the migration window.
4. Obtain separate shared-DDL authorization naming the target, exact pending migrations, source revision and execution window. Obtain the explicit disposition of the open credential-exposure risk before production authorization.
5. In that future authorized shell, supply `DATABASE_DIRECT_URL_PEOPLE` from the approved secret source, explicitly clearing any inherited target ambiguity. Set `PEOPLE_MIGRATION_RECEIPT` to a restricted local evidence path. From the reviewed repository run `pnpm --filter @quiz/db-people db:migrate`. Use this supported command for its exact-object, prefix-hash and transaction checks. No execution occurred during this review.
6. Capture exit code and sanitized receipt. Verify new ledger hashes/timestamps, invitation objects, normalized partial unique index, retired global constraint, mapping/grant constraints and preserved administrative records. Confirm same-platform normalization rejection and independent same-email brands through approved synthetic fixtures, with exact cleanup.
7. On a reported failure, inspect the catalog and ledger before retrying, including uncertain connection/commit outcomes. The runner rolls back its transaction on detected failure. A committed migration needs a reviewed forward correction or authorized recovery. Once cross-brand duplicates exist, global email uniqueness cannot generally be restored. Restoring a backup can discard later legitimate writes and requires the agreed recovery procedure.

## Minimal localhost integration smoke after the database gate

Use owner-approved synthetic accounts and exact fixture cleanup. Login itself persists sessions/audit information, so execution must be covered by the selected runtime test scope.

- SHC administrator login, current-account eligibility, one permitted academic read and one denied insufficient-permission action.
- Independent SUIA/RTH same-email accounts with distinct learner and person UUIDs, correct platform membership and successful own-profile/progress reads.
- Wrong-brand token, foreign private-resource identifier and forged identity headers denied with private no-store responses.
- Refresh retains platform and persisted session binding. Device revocation denies the revoked pair while another active device works.
- Revoked platform access stays revoked. Same-platform administrative operations retain `user.manage` and actor/target scope checks.

These checks use the three supplied localhost URLs. Any future rollout remains a separate owner action after database acceptance and environment review. Applicable runtime changes include the accepted backend/identity-bridge source, dependent app bundles and required gateway configuration. Source and schema versions must be recorded together before rerunning this smoke set.

## Decision and open items

**R6-B migration replay technical acceptance is recommended PASS. Shared migration readiness remains HOLD.** The remaining concrete prerequisites are the registered uniqueness migration, approved protected backup/recovery capability, final execution authorization, credential-risk disposition and authenticated integration evidence.

R6B-SEC-01 remains OPEN — REMEDIATION DEFERRED BY OWNER. Project-wide rotation remains deferred. The earlier cold-start quiz-result 500, broader authenticated authorization matrix, MainDB tenant-qualified exam ownership, SHC generic-auth fencing and historical custom exam-grace contract retain their existing bounded or pending statuses. They require their respective approval scopes. Three previously reported unlinked brand accounts require verified mapping reconciliation after the applicable gates.

No app source, canonical acceptance status or original Q-register was changed by this readiness review. Attendance, payments, Marketing and broader UI/performance remain HOLD. The new deliverables are this report and sanitized review receipts. Shared database writes, deployment and Git publication have separate owner gates.

## Final release-blocker evidence, 14 November 2026

The owner authorized the final readiness checks and a local documentation commit against `37c482c2599a10ce802397b3e37452f445cb7e4f`. The 24 migration tests and 25 focused regressions retain their accepted result. Current work uses the three supplied localhost origins. The final recommendation is **HOLD**.

| Required gate | Result | Evidence and outstanding condition |
|---|---|---|
| R6-B migration replay technical acceptance | PASS | Accepted existing physical qualification and unchanged source hashes. |
| Protected backup/recovery readiness | PENDING | Synthetic logical restore previously passed. Current protected backup, exact recoverable point, retention and restore permissions have no verified receipt. |
| SHC authentication | PARTIAL / revocation FAIL | UI login 200, dashboard 200, identity endpoint 200 and authorized domains read 200. Logout 200 clears cookies. Replaying the prior cookies authorizes both identity and domains reads with 200. |
| SUIA authentication | BOUNDED PASS | UI login 200, own profile 200 with matching email, dashboard 200, own PeopleDB mapping and active grant verified read-only. Logout 200, cleared cookies, subsequent request 401 and old-session replay 401. |
| RTH authentication | BOUNDED PASS | Equivalent login/profile/dashboard controls passed. Own PeopleDB mapping and active grant verified read-only. Logout and old-session replay controls passed. |
| Cross-brand isolation | BOUNDED PASS | Full learner cookie pair copied to the opposite localhost brand received profile 403 in both directions. Both own-brand positive controls returned 200. |
| Protected migration prerequisites | PARTIAL | Fresh READ ONLY preflight confirms target, ledger prefix, zero duplicate groups and pending invitation migration. Uniqueness registration, backup and execution authorization remain pending. |
| Remaining release blockers | HOLD | SHC session invalidation, protected recovery proof, registered uniqueness artifact, explicit shared execution approval and open credential-risk disposition. |

### Authentication execution and limits

The secure `.env.auth-qualification.local` file contains existing approved credential references for all three brands, including SHC. This resolves the earlier credential-discovery limitation in the initial review. No values, tokens, cookies or principal UUIDs appear in the new evidence.

The existing Playwright qualification command attempted the three login cases and two normal single-session logout cases. It exited 1 during collection with zero cases discovered. Its safe reporter suppressed detailed diagnostics. This failure remains recorded. A bounded observational Playwright script then used the same credential references through the actual login forms. It collected actual HTTP status, cookie-presence booleans, landing paths and identity-match booleans. `AUTHENTICATED_LOCALHOST_RESULTS.json` contains those receipts and timestamps. The observational process exited 0 after collecting all results, including the SHC failure. That process exit does not promote the failed revocation control to PASS.

All three apps landed on `/dashboard`, established access/refresh cookies, returned authenticated identity/profile responses matching the configured email and served the protected dashboard with 200. Anonymous private requests returned 401. SHC's permitted `/api/admin/domains` read returned 200. This verifies the existing administrator positive control. Additional action-specific negative permission cases retain their prior bounded evidence and were outside this smoke set.

Both learner sessions returned 403 when replayed under the other brand's cookie domain. Normal single-session logout returned 200, removed authentication cookies and caused both a subsequent profile request and an old-cookie replay to return 401. Cross-user resource mutation and refresh-token rotation were outside this set. Normal application login/logout session and audit effects occurred through the existing approved test-account flows. Direct SQL activity used READ ONLY transactions ending in ROLLBACK. Credentials remained in process memory, with traces, video and screenshots disabled.

`ACCOUNT_MAPPING_VERIFIED.json` independently confirms one non-deleted brand account, one active PeopleDB account, matching `(platform, external_id)`, matching persisted `shadow_user_id` and active own-platform grant for each learner. SUIA's two UUIDs differ. The existing RTH fixture has equal learner/person UUID values with a verified mapping. Therefore this particular RTH smoke provides no distinct-UUID runtime control. Earlier synthetic qualification supplies that separate control. The first mapping diagnostic incorrectly queried an `is_active` column on brand users and failed read-only with SQLSTATE 42703. Its receipt is preserved in `ACCOUNT_MAPPING_READ_ONLY.json`. The corrected adapter queries existing columns and succeeds.

SHC's PeopleDB account is active. No active own-platform `platform_access` row was found for this administrator. Dedicated SHC login and current-account authority nevertheless authorize the account. The dedicated service uses its established platform/role authority. No grant was created during this task.

### Confirmed SHC logout/session-invalidation blocker

The first SHC smoke returned logout 200 and cookie clearance, followed by 200 when replaying the pre-logout cookies against `/api/admin/auth/me`. A targeted follow-up reused the approved SHC identity to repeat only this discrepancy. `SHC_REPLAY_CONTROL.json` records login 200, logout 200, anonymous-after-clearance 401, old-cookie identity replay 200 and old-cookie domains read 200. The extra run was justified by this newly observed security failure.

The relevant existing source is `apps/skillhubcore-admin/src/app/api/auth/logout/route.ts`, `apps/api-server/src/app/api/shc/auth/logout/route.ts`, `apps/api-server/src/modules/auth/shc-auth.service.ts`, `apps/skillhubcore-admin/src/lib/shc-account-authority.ts` and the existing admin request guard. The BFF clears cookies after proxying logout. Backend logout attempts refresh-token revocation and returns success even when logout handling fails. The current-account authority validates the account and token role ceiling. The observed old access credentials still pass that authority after logout.

A separately approved correction must establish the existing SHC session-revocation contract at the authoritative request boundary and prove that pre-logout credentials lose privileged access while legitimate sessions retain their intended behavior. Exact refresh persistence/revocation success and the complete cause of old-access acceptance remain to be diagnosed within that correction. Cookie deletion alone does not meet the owner's requested session-invalidation control. No production authentication implementation was changed in this task.

### Protected backup and recovery disposition

`infra/hostinger/scripts/backup.sh` copies environment files, certificates, infrastructure and gateway configuration. It contains no PeopleDB logical dump or Neon recovery-point capture. Its output cannot establish a recoverable protected PeopleDB data point.

The reused `RECOVERY_REHEARSAL.json` demonstrates successful `pg_dump`/`pg_restore` on synthetic-only disposable databases, matched schema/data/ledger fingerprints and cleanup. It records no shared backup or Neon PITR rehearsal. There is no verified protected recovery timestamp, backup identifier, retention period or restored protected-data control available in the reviewed evidence. Management-console recovery settings were unavailable through the configured SQL connection.

The exact remaining recovery verification requires the owner/operator to identify a current protected recovery point or restricted logical archive, its coverage and retention, then authorize restoration into a newly identified disposable target. Restore into that target and compare schema, constraints, migration hashes, aggregate data fingerprints and required administrative/account dependencies. Record duration, data-loss window and cleanup. Copied protected credentials and records require restricted handling. Restoration must preserve the shared branch. Existing synthetic restore tests need no repetition unless the chosen recovery method or migration artifact changes.

Before shared execution, the owner must approve the exact backup/recovery point and operator permissions, the shared migration SQL and window, and the treatment of open incident R6B-SEC-01. The exposed credential's Neon role/project relationship means SQL branch isolation alone provides no credential-containment clearance. Impact remains unresolved, and remediation stays deferred by the owner. Production release risk therefore remains OPEN.

### Migration numbering and fresh preflight

`FINAL_READ_ONLY_PREFLIGHT.json`, captured at 04:01 UTC on 14 November, reconfirms project `bitter-tree-18287476`, shared branch `br-misty-wildflower-a1jalxmd`, direct endpoint `ep-young-wildflower-a1frkuuj`, database `people_prod`, exact source-prefix ledger 0000–0008, zero normalized active same-platform duplicate groups, retained `users_email_unique`, and absent `student_invitations`.

The prompt calls 0009 the uniqueness migration. The actual journal identifies **0009_student_invitations**. The proposed normalized uniqueness change remains a rehearsal artifact requiring its own reviewed append-only journal entry after 0009. Applying the currently registered 0009 would create invitation objects and retain the global email constraint. Approval must name the actual SQL artifacts individually.

Canonical acceptance statuses and the original Q-register retain their existing states. This bounded runtime delta is recorded in the existing readiness report and receipts. Full three-app acceptance and Q48 remain OPEN. Documentation/evidence changes are committed locally under the owner's task authorization. Shared migration, deployment and credential remediation retain their recorded approval gates.

## SHC revocation correction and registered uniqueness migration

The owner authorized focused source remediation, isolated verification, migration registration and a local commit after checkpoint `47fae536265d4bd8da3f2510d7c3ec40ea66c7b4`. R6-B migration replay technical qualification remains accepted PASS. The release recommendation remains **HOLD** while the runtime and recovery conditions below are pending.

### Root cause and existing-source correction

SHC login issued refresh credentials without storing the issued session. Logout called the default MainDB refresh-token repository even though its principal was owned by PeopleDB. The SHC identity and backend admin boundaries validated the current account and JWT without checking a persisted session. Logout also returned successful responses when revocation failed. The preceding localhost receipts demonstrate the resulting old-cookie replay failure.

`SHCAuthService` now uses the existing PeopleDB `sso_sessions` table. Login stores the SHA-256 digest of the issued refresh credential in the existing `jwt_family` field and includes that digest as the signed access token's `sessionBinding`. Each issued refresh credential has its existing random JWT identifier, allowing independent sessions. Only digest values are stored. Login returns credentials after the session insert succeeds. Storage failure returns a sanitized 503.

The existing `/api/shc/auth/me` handler and `verifyAdminOrInfraToken()` enforce that the signed binding belongs to an active, non-deleted `skillhubcore` session for the signed principal. Current account eligibility, privilege ceilings and action RBAC continue through their existing checks. Missing bindings, revoked rows and wrong owner/platform rows fail closed. This means legacy SHC access tokens require a fresh login when this correction is activated.

The existing SHC logout endpoint verifies the SHC admin token policy and revokes the exact principal/platform/session binding. A successful logout preserves other active sessions. Repeated logout is safe. Persistence failure produces a non-success 503, and audit failure after successful revocation is logged without credentials. The BFF's existing cookie clearing remains in place.

| Existing source changed | Bounded result |
|---|---|
| `apps/api-server/src/modules/auth/shc-auth.service.ts` | Existing PeopleDB session persistence, lookup and exact-session revocation with sanitized storage errors. |
| `apps/api-server/src/modules/auth/admin-audience.util.ts` | Shared backend SHC admin verification now requires the persisted session. |
| `apps/api-server/src/app/api/shc/auth/me/route.ts` | Session validation precedes current-account admission, with 401 for revoked/unbound sessions and 503 for unavailable authority. Typed principal handling replaces existing untyped casts. |
| `apps/api-server/src/app/api/shc/auth/logout/route.ts` | Signed SHC admin scope and truthful revocation response. |
| `apps/api-server/src/app/api/shc/auth/login/route.ts` | Propagates typed, sanitized session-storage failures. |

### Verification and remaining runtime gap

The focused API/SHC selection passed **65/65** tests. This includes the actual SHC service against controlled persistence, real JWT signing/verification, persisted digest matching, pre-logout binding rejection after logout, separate-session preservation, fresh login, wrong-owner/platform and deleted/unbound denial, storage outages, backend guard rejection and identity/logout handler behavior. Existing broader signed-token/current-role tests retain their negative assertions with an explicit session-authority fixture where that independent boundary is under test.

Existing SHC BFF boundary/proxy regressions passed **65/65** behind the transport guard. Registered migration, seed-conflict and normalization regressions passed **27/27**. These are controlled tests. The previously accepted 24 physical migration tests and 25 regressions were reused for their original source boundary.

API and PeopleDB typechecks passed. Changed source and test-file lint passed with zero warnings. Drizzle metadata validation and the PeopleDB build passed. The prepared disposable verification script also typechecked successfully. Exact commands, timestamps, exit codes and initial failures are retained in `.evidence/r6-shc-revocation`.

The first isolated API build copy lacked app workspace dependency links. That attempt failed module resolution. The corrected copy linked the existing app dependencies, compiled and generated all static pages, then reached its execution timeout before completion. The final retry used two workers in its temporary configuration and completed the full API production build with exit 0. The original app configuration and running localhost build directory remained outside the temporary build work. Initial failed receipts and the successful final receipt are retained. Existing Sentry instrumentation warnings appeared during the build and remain visible in its log.

**Post-fix PostgreSQL and browser replay are PENDING.** The approved disposable branch connection was absent from the inspected process/User environment and local env files. The prepared `verify-disposable.mts` exited 2 with a BLOCKED receipt before opening a database connection. Its accepted target is project `bitter-tree-18287476`, branch `br-young-silence-a1b1ta26`, endpoint `ep-fragrant-brook-a1mhx5dm`, database `people_prod`. A secure local `R6_NEON_TEST_URL` reference is required to continue. Existing shared credentials provide no fallback for these writes.

The prepared script creates one uniquely named scratch database only after server-side branch verification, tests registered 0010 failure/rollback and upgrade/repeat paths, then tests the actual SHC service and authoritative handlers against disposable PostgreSQL. It supplies a controlled audit adapter to avoid MainDB writes. It records schema prerequisites and deletes only its own positively identified scratch database. Browser replay still requires an isolated backend/gateway binding to that target and an approved synthetic SHC identity. Source tests do not close that runtime gate.

### Refresh and compatibility disposition

The current SHC Admin app has login, logout and identity routes but no BFF refresh route. The generic backend refresh operation uses the existing tenant/admin refresh contracts and default/brand refresh repository. Dedicated SHC login previously persisted no refresh row there. Successful SHC session renewal therefore lacks an established runtime positive control in the current implementation.

This correction does not add an endpoint or silently redirect SHC refresh into a different identity authority. Revoked/unbound access credentials are rejected at SHC authority boundaries in controlled tests. Verification that revoked refresh credentials cannot mint new access, together with a legitimate SHC renewal positive control, remains a separate contract and runtime gap. The owner must approve the exact existing-path renewal correction if that capability is required. Fresh-login and other-active-session preservation are covered by the controlled tests.

### Registered migration

The authoritative journal ends at `0009_student_invitations`. The new append-only entry is **`0010_normalized_platform_email`**, with SQL in `packages/db-people/migrations/0010_normalized_platform_email.sql` and linked metadata in `meta/0010_snapshot.json`.

The new SQL creates `uniq_users_email_platform` over `(LOWER(TRIM(email)), platform) WHERE deleted_at IS NULL` before dropping `users_email_unique`. Execution uses the existing supported transaction and exact-object compatibility runner. The registered source reader, index expression/predicate metadata and snapshot ancestry passed focused tests and `drizzle-kit check`. The SQL's actual application is still pending disposable verification.

All ten historical SQL files retain their recorded SHA-256 hashes. The journal retains its exact historical entry prefix. The 0009 snapshot retains its canonical Git blob. An initial raw working-file/blob comparison differed due to Windows line endings. The corrected canonical comparison is recorded, with the initial receipt preserved. Snapshot metadata changes are limited to adding the new unique index and removing the old global unique-constraint declaration. Existing ordinary indexes are retained.

`MIGRATION_PROVENANCE.json` records the exact new SQL hash and journal timestamp. Pending 0009 remains the invitation migration. An eventual shared execution decision must authorize 0009 and 0010 individually and compare the complete pending batch against its reviewed source.

### Minimum remaining operational approvals

1. Supply the approved disposable connection securely and complete the focused real-PostgreSQL verification, isolated post-fix browser replay and cleanup receipts.
2. Resolve the existing SHC renewal path and prove a legitimate renewal positive control plus revoked-refresh denial if renewal is part of final acceptance.
3. Identify the protected PeopleDB backup/recovery point, retention, coverage, restore operator and recovery window. The existing host backup script covers configuration. Prior synthetic logical restore remains the bounded recovery proof.
4. Approve protected-data restoration into a specified disposable recovery target. Compare schema, constraints, migration hashes and account/admin dependency fingerprints, measure restoration duration and record cleanup. Shared-branch restoration is outside this rehearsal.
5. Review the final 0009/0010 bytes and ledger hashes, repeat the read-only protected target/duplicate preflight in the execution window, and approve the exact shared migration operation separately.
6. Resolve the production risk decision for R6B-SEC-01. The incident stays **OPEN — REMEDIATION DEFERRED BY OWNER**.

The SHCA-A01 evidence note records this source correction and its pending runtime status. All 62 criterion IDs and acceptance statuses are preserved. Q48 remains OPEN. Prior SUIA/RTH runtime evidence remains linked to its tested source boundary. Current changed-file scope leaves those learner authorities untouched. The local commit records the source/tests and explicit pending receipts for owner review.

## Focused end-to-end closure continuation

Implementation baseline is `036681cd76b61b283a9a311e54609e4d43b088a0`. The owner permits preserving fresh login at SHC expiry when that matches the existing behavior. The preceding 157 controlled tests and completed quality/build receipts remain accepted. This continuation changes the secure test-file loader and Git exclusion, with application implementation preserved.

### Expiry policy and additional evidence

The SHC page verifier rejects expired access tokens and the proxy redirects unauthenticated page requests to `/login`. `AdminGuard` redirects confirmed authentication failure to login. The shared API client may attempt its generic refresh fallback on eligible API calls, while administrative session checks bypass that fallback. A failed fallback invokes the existing unauthorized handling. The SHC application has no refresh BFF route or rewrite.

Under the current owner instruction, preserve fresh authentication after SHC access expiry. Automatic renewal requires no implementation for this phase. Logout revocation stays enforced through the persisted session authority. A future automatic-renewal requirement would need its own contract.

Four selected server-page authentication controls passed with real signed test credentials and a controlled account authority. Twenty unrelated cases were excluded by the explicit name filter. Two existing client refresh-fallback controls passed with controlled responses. These six additional cases supplement the accepted 157 cases.

Three actual localhost HTTP controls used a signed, already-expired credential for a generated synthetic principal. `/dashboard` returned 307 to `/login`, `/api/admin/auth/me` returned 401, and `/api/admin/domains` returned 401. These GET-only controls created no login/session. `EXPIRY_LOCALHOST_RESULTS.json` records their boundary and outcomes. This closes the expiry-policy uncertainty at the observed localhost admission boundary. Full post-fix login, captured-cookie replay, revoked-refresh denial and fresh-login persistence verification remain pending isolated runtime.

### Disposable connection blocker

The suggested `.local-secrets/r6-neon-test.env` is absent, and no alternative owner-supplied file path is available. `/.local-secrets/` is now Git-excluded, confirmed by `git check-ignore`. The disposable verifier accepts an explicit local env-file path, checks repository exclusion and tracked-file status, and loads only `R6_NEON_TEST_URL`. An explicit missing file fails closed. Shared database URL settings provide no fallback.

Controlled safety checks rejected a protected endpoint, malformed URL and missing setting with exit 2 before constructing a PostgreSQL client. The temporary synthetic configuration was removed. The updated verifier typecheck passed. The actual invocation against the missing suggested file also exited 2 with BLOCKED and zero executed database checks. A separate uncompromised disposable credential must be supplied through an owner-managed local file. Credential freshness remains unverified while that input is absent.

From the repository root, the prepared invocation is `node node_modules/tsx/dist/cli.mjs --tsconfig apps/api-server/tsconfig.json .evidence/r6-shc-revocation/verify-disposable.mts .local-secrets/r6-neon-test.env`. Server-side verification of project `bitter-tree-18287476`, branch `br-young-silence-a1b1ta26`, endpoint `ep-fragrant-brook-a1mhx5dm` and database `people_prod` precedes its first write.

Browser progress/quiz writes additionally require disposable brand/TutorialDB fixtures and an isolated audit destination where applicable. The current localhost configuration points at shared remote stores. Test-process bindings must therefore establish isolation before those write journeys. The running shared processes retain their existing configuration.

### Closure matrix

| Required flow | Current state | Evidence and outstanding condition |
|---|---|---|
| SHC frontend/BFF/API/PeopleDB | BLOCKED for final post-fix journey | Prior login/admin controls and 036681cd source checks retained. Current expiry denial passes localhost HTTP. Full persistence/replay verification needs the secure disposable input. |
| SUIA frontend/BFF/API/PeopleDB/SkillUp DB | BLOCKED for final new-schema journey | Earlier dashboard/profile/logout receipts retained. Tutorial, progress and quiz journeys on the new disposable schema remain NOT TESTED. |
| RTH frontend/BFF/API/PeopleDB/RTH DB | BLOCKED for final new-schema journey | Same boundary as SUIA. Existing independent brand-local account authority is preserved. |
| SHC logout and expiry | Controlled revocation PASS, localhost expiry PASS, full isolated session runtime BLOCKED | Preserve fresh login at expiry. Captured-cookie and revoked-refresh runtime controls await isolated persistence. |
| Registered 0010 disposable migration | BLOCKED | Registered SQL/journal/snapshot and metadata validation retained. No database connection opened in this continuation. |
| Cross-brand authorization | Earlier bounded runtime PASS, final new-schema evidence BLOCKED | Prior foreign-brand profile denials retained. Full membership combinations, spoofed-header and resource-ownership controls await new-schema fixtures. |
| Protected backup/recovery | PENDING | Current recoverable point, coverage/retention, disposable restoration rehearsal, recovery window and operator approval remain outstanding. |
| Credential exposure | OPEN, remediation deferred by owner | The production risk remains open. |
| Technical closure | HOLD | The missing secure disposable connection is the immediate execution blocker. Required end-to-end gates remain pending. |

PeopleDB remains the shared registry with platform-qualified mappings. SUIA/RTH keep independent brand-local accounts, credentials and data ownership. Matching email addresses establish neither an identity merge nor a platform grant. Multi-platform controls must exercise verified existing grants with the appropriate brand-scoped principal.

The final protected release still requires reviewed backup/recovery evidence, exact 0009/0010 execution authorization with fresh catalog/ledger/duplicate preflight, a credential-risk decision, and deployment/live-smoke authorization. All 62 acceptance statuses and Q48 remain owner-controlled. The local continuation commit records these specific evidence limits.

## Disposable PostgreSQL and three-app runtime completion — 14 November 2026

This section supersedes the preceding missing-connection and unperformed-runtime states. Source baseline is `4aa0cad2e7659b35e2092c2edbfe4638868c917f`. Application implementation and registered migration bytes are unchanged. The owner explicitly reauthorized the supplied disposable credential. Its access-restricted local reference is Git-ignored. Credential exposure remains OPEN — REMEDIATION DEFERRED BY OWNER.

### Isolation and migration

Server settings verified project `bitter-tree-18287476`, branch `br-young-silence-a1b1ta26`, endpoint `ep-fragrant-brook-a1mhx5dm`, and `people_prod`. Branch name and parent retain the owner's dashboard provenance. The supplied default `neondb` was inspected before selecting the existing application database.

The standalone verifier passed seven recorded groups using its own scratch database. These cover supported fresh replay through 0009, registered 0010 upgrade/repeat, duplicate rollback with SQLSTATE 23505, independent cross-platform emails and actual SHC authority with real PostgreSQL session revocation. Its audit destination was a controlled adapter. The earlier BLOCKED receipt remains in `PRE_CONNECTION_BLOCKED.json`.

Five further assignment-owned databases, `r6b_e2e_97d2df2ca9_*`, received read-only schema copies and synthetic fixtures. Operational account rows were excluded. The empty disposable PeopleDB received the protected ledger prefix. `MIGRATION_RECEIPT.json` records exactly 0009 student invitations followed by registered 0010, with matching original/executed hashes. Final ledger has eleven entries. The unique index is `(lower(trim(email)), platform) WHERE deleted_at IS NULL`, and disposable global `users_email_unique` is absent.

Original localhost listeners on 3007, 3009, 3003, API 3000 and gateway 8787 retained their PIDs. Temporary copies used 3307, 3309, 3303, API 3300 and gateway 8887, with all database bindings restricted to disposable targets. Frontends were tested sequentially to reduce memory use. The existing Hono gateway used a Node transport adapter that cloned fetch response headers and suppressed credential-bearing debug output. Cloudflare deployment was outside this execution.

### Functional results

| Required flow | Result | Evidence |
|---|---|---|
| SHC UI/BFF/API/PeopleDB | PASS for recorded functional controls | `JOURNEY-skillhubcore.json` has 16 passing functional checks and one initial warm-up timeout. Login, identity, dashboard and authorized domains pass. |
| SHC logout and fresh login | PASS | Captured identity/admin replay returns 401. Captured refresh cannot restore the browser session. Fresh UI login, identity and logout pass. Earlier localhost expiry controls retain the fresh-login-after-expiry policy. |
| SUIA UI/BFF/API/PeopleDB/SkillUp DB | PASS | Final `JOURNEY-skillup.json` passes 23/23, including UI login, dashboard, tutorial navigation, tenant-qualified progress persistence, answer, submit, logout and replay denial. |
| RTH UI/BFF/API/PeopleDB/RTH DB | PASS after documented retries | Browser login/dashboard/spoofed-header controls pass. `HTTP-realtutorialhub.json` passes 12/12 fresh-exam controls. `TUTORIAL-realtutorialhub.json` passes 5/5 Chromium lesson-rendering controls. |
| Completed quiz results | PASS | SUIA `TUTORIAL-skillup.json` passes 7/7, including a physically completed own exam and result HTTP 200. RTH `RESULT-realtutorialhub.json` passes 4/4 including completed-result HTTP 200. Earlier 202 responses describe started exams. |
| Cross-brand/ownership boundaries | PASS for bounded cases | Each valid cookie pair is denied in foreign-brand gateway context with 403. Foreign exam submit returns 403. Spoofed headers cannot replace the account. |
| Physical identity/data consistency | PASS, 9/9 | `FINAL_CATALOG.json` verifies distinct brand-local and PeopleDB UUIDs, persisted `(platform, external_id)` links, independent same-email accounts, active own-platform grants, answers, completed exams, ledger and index. |
| Protected preflight | PASS, read-only | `PROTECTED_READ_ONLY_FINAL.json` records read-only `on`, nine ledger entries through 0008, retained global uniqueness and zero normalized same-platform duplicate groups. |
| Protected backup/recovery | PENDING | Protected recoverable point, retention, operator, recovery window and approved restoration rehearsal remain required. Prior synthetic logical recovery proof retains its historical scope. |

Matching email establishes no shared principal or cross-brand permission. Tests use independent registrations and mappings. Administrative cross-brand grant/restoration remains denied under Policy B until explicit authority exists. MainDB tenant-qualified ownership and colliding-local-UUID qualification remain in their separate phase.

### Failures and evidence limits

Initial gateway module/immutable-response errors, BFF base-path configuration, missing RTH translations, tutorial mapping/slug fixtures and a request sent before its listener started were harness defects. Corrections affect the disposable harness. Failed receipts remain alongside final results.

Some initial dev compiles exceeded the 65-second request allowance. The recorded RTH tutorial request took 83 seconds, including 79 seconds compiling. Its warmed Chromium lesson rendered successfully. Initial SUIA progress/quiz requests produced timeouts, 500/503 and Neon/ErrorEvent diagnostics, followed by a completely passing warmed journey. These observations do not establish the historical cold-start quiz-result 500's cause. Cold-start reliability remains unqualified. Broader performance remediation remains HOLD.

Original exam fixtures aged beyond their one-hour limit during the paused execution. Their 400 answer result remains recorded. Fresh synthetic exams accepted answers and completed. The final learner harness creates a new exam per journey.

Historical fresh PeopleDB replay lacks the `skillhubcore` enum label. The standalone verifier added it only to its scratch fixture, matching the existing protected schema. The five-database runtime copied that existing schema. This is a fresh-install provenance limitation. The current results qualify the existing-schema upgrade path.

External report providers, email, payments, Redis/QStash and background integrations were excluded. Inline scoring and completed result retrieval passed. PDF-provider delivery, every course/enrollment workflow and all 195 authorization methods remain outside this bounded evidence. Existing 157 source tests, six expiry/fallback cases, quality/build receipts and 24 migration/25 regression receipts are reused at their original boundaries.

Ten JavaScript harness syntax checks pass. A separate repository-hook inspection found that `npm run auth:audit` fails because its referenced `scripts/auth-audit.js` is absent, including at baseline HEAD. The session inherited `HUSKY=0`. This environment setting was preserved, and the failed audit is recorded in `ROOT_AUTH_AUDIT_EXCEPTION.json`. No passing root audit or automatic hook execution is claimed. Repository-tooling repair is outside this integration correction.

### Cleanup and decision

All five new databases and the standalone scratch database were removed and verified absent. Temporary app copies, owned processes and client utilities were removed. Original listener PIDs remained unchanged. The existing qualification branch and its pre-existing databases were retained. Cleanup and port receipts are in `.evidence/r6-e2e`.

Private generated fixture credentials were deleted. The owner-supplied ignored connection reference remains local. Credential-bearing diagnostic lines were redacted, retaining structured statuses and timing evidence. Secret checks found no known credentials or JWTs in new evidence. No credential was rotated or declared safe.

**Tested PeopleDB migration and warmed three-app integration gates PASS. R6-B is technically ready for a separately controlled existing-schema release decision within this scope. Protected release remains HOLD.** Cold-start reliability, fresh-install provenance and broader acceptance gaps remain visible.

Remaining protected approvals are backup/recovery evidence and rehearsal, exact 0009/0010 execution with execution-window preflight, credential-risk disposition, and any deployment/live-smoke operation. Canonical acceptance statuses remain unchanged and Q48 stays OPEN. Exact commands, outcomes, hashes and cleanup are consolidated under `.evidence/r6-e2e`.

## Protected cutover preflight and authorization gate — 14 November 2026

The owner accepts R6-B technical qualification as PASS at `94bdb5910acfef47dd84cef18d55cfdebbac8ebd`. That milestone is closed within its recorded migration and bounded integration scope. This checkpoint covers requested Phases 1–4. The actual protected migration and subsequent application validation remain pending.

### Current protected preflight

`node .evidence/r6-cutover-preflight/preflight.cjs` completed successfully at 12:24 UTC on 14 November 2026. All protected SQL ran in an explicitly read-only transaction with connection-default read-only enabled. Eight checks pass. `PREFLIGHT.json` records the catalog, source hashes and sanitized local environment inventory.

| Item | Verified state |
|---|---|
| Neon project | `bitter-tree-18287476`, locally named platform-people |
| Protected branch | `br-misty-wildflower-a1jalxmd`; production display label retains operator provenance |
| Direct endpoint | `ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech` |
| Database and role | `people_prod`, `neondb_owner`, PostgreSQL 17.12 |
| Historical ledger | Nine entries through 0008, every hash/timestamp matches the registered source prefix |
| Pending 0009 | `0009_student_invitations`, timestamp `1791600000000`, SHA-256 `f5aef816d0822d8cba9534dddbb11af2a3cac644f72354639823bec6597b38df` |
| Pending 0010 | `0010_normalized_platform_email`, timestamp `1794629868483`, SHA-256 `88f558d88d335b7a35e3e744bc7e70281756d56402c30891f7041db416f7af93` |
| Invitation baseline | Table absent, matching pending 0009 |
| Current uniqueness | Global `users_email_unique` exists; target normalized index is absent |
| Active normalized same-platform duplicate groups | Zero |
| Platform enum | Includes skillup, realtutorialhub and skillhubcore |
| Compatibility objects | Both FK definitions and all five index definitions match the approved objects. `OBJECT_DEFINITIONS.json` records seven passing comparisons. The runner also performs its complete locked catalog validation during an approved execution. |
| Observed load | No other transaction older than one minute at observation; approximate database size 10.4 MiB. These are time-bound observations. |

The local root, API, SHC, SUIA, RTH and gateway environment inventories contain no active disposable database references. The Git-ignored qualification reference is outside application env loading. Local application compatibility is established by the accepted integration receipts. Environment files include a mixture of localhost and existing remote API destinations, retained in the sanitized inventory. The configuration and source revision of deployed processes have not been inspected through a deployment control plane. A localhost pass establishes the tested local code boundary. The eventual release operator must confirm the compatible API/BFF revisions before migration and smoke tests.

### Recovery evidence and exact missing action

Protected recoverability is **NOT VERIFIED**. The existing host `backup.sh` archives configuration, certificates and deployment files. Its output establishes no PeopleDB data recovery point. The accepted `RECOVERY_REHEARSAL.json` passes a custom-format PostgreSQL logical backup/restore with matched synthetic data, schema and ledger fingerprints. It records no protected archive or Neon PITR execution.

An existing Neon Console window was discovered, but the available UI control returned a minimized-window access error. No recovery settings were changed or confirmed. SQL catalogs provide no verified recovery retention window or authorized management restore capability. No Neon management key was requested.

Before cutover, the owner/operator must identify a current protected recovery point or restricted logical archive and provide its identifier, UTC timestamp, database coverage, retention expiry and restore authority. Record the disposable recovery destination, acceptable data-loss/recovery windows and operator. Approve the recovery procedure and either the applicable protected restore rehearsal or explicit acceptance of the existing synthetic rehearsal for the selected method. Any restoration containing protected records requires its own named disposable destination and authorization. Recovery readiness is a prerequisite in the owner's Phase 2 instruction.

### Cutover relevance of existing findings

| Finding | Existing-database cutover disposition |
|---|---|
| Cold-start reliability | Warming and real readiness checks belong in the migration window and smoke plan. The historical 500 cause remains open. The latest complete warmed SUIA result and RTH completed results pass. The 0009/0010 SQL has no dependency on cold compilation. These receipts permit preserving the accepted technical qualification. |
| Fresh-install SHC enum provenance | Protected enum already includes skillhubcore. Existing-schema upgrade can proceed after other gates. Fresh-install provenance remains tracked separately. |
| Missing root auth-audit script | Existing tooling failure. Manual source hashes, accepted security regressions and runtime receipts supply the evidence for this bounded change. No passing root audit is claimed. Its repair remains separate. |
| Inherited HUSKY=0 | Existing local environment setting. The previous commit disclosed absent hook execution. This checkpoint also records explicit review/verification and the same inherited setting. The release operator must use the approved process and reviewed artifact hashes. |
| Credential exposure R6B-SEC-01 | OPEN — REMEDIATION DEFERRED BY OWNER. Routine project-wide rotation remains deferred. Protected execution requires explicit acknowledgement of the unresolved exposure risk. |

### Exact execution procedure prepared for separate approval

1. Establish and approve the protected recovery record above. Agree a short migration window with application writers controlled, especially account creation, email updates and admissions. This also prevents new duplicate conflicts and limits the recovery data-loss window.
2. Confirm the reviewed migration-runner, SQL and journal hashes against `PREFLIGHT.json`. Confirm the compatible local or deployed consumers selected for the release. Re-run the read-only command and require the same protected project/branch/database, exact nine-row source prefix and exact two pending migrations. A changed state requires reviewing the delta before a write.
3. Load only the reviewed protected PeopleDB connection from the existing local secure configuration into both process variables `DATABASE_URL_PEOPLE` and `DATABASE_DIRECT_URL_PEOPLE`, so direct-URL precedence cannot select another target. Keep credentials in process environment. Set `PEOPLE_MIGRATION_RECEIPT` to an absolute new evidence file under `.evidence/r6-cutover-preflight`. From repository root, the exact existing supported execution command is `pnpm --filter @quiz/db-people db:migrate`. This command has been inspected and prepared, and remains unexecuted at this checkpoint.
4. The existing command runs `packages/db-people/scripts/migrate.mts` and `migratePeople()`. Its transaction sets 5-second lock timeout and 120-second statement timeout, acquires the existing transaction advisory lock, locks the ledger exclusively, verifies the source prefix and seven compatibility objects, applies pending 0009 then 0010, appends original ledger hashes and commits. The 0010 index is built before dropping the old constraint. Non-concurrent index creation can block writers. No historical migration is edited.
5. On success, verify eleven source-matching ledger rows, student-invitation table/FK/index definitions, valid normalized partial unique index, removed global constraint, preserved platform-access constraints and SHC session schema. Use read-only catalogs and aggregate integrity checks. Any protected synthetic writes used for uniqueness or smoke controls require inclusion in the execution approval and an explicit cleanup plan.
6. On reported failure or connection uncertainty, keep writers controlled and re-read the ledger/catalog before any retry. The supported runner rolls back a detected transaction failure. An uncertain commit must be resolved from actual state. If the ledger remains nine rows and old constraint/table state is intact, document rollback and assess the specific cause. If eleven matching rows and expected schema exist, document a committed outcome. Any other state requires manual review.
7. After a committed migration, choose a reviewed forward correction or the approved recovery procedure. Re-adding global email uniqueness may fail after legitimate cross-platform duplicate emails exist. Restoration can discard later writes and requires the approved recovery point/operator/destination. No automatic protected branch reset or database recreation is part of this procedure.
8. Once separately authorized, smoke the approved application targets with approved identities. Reuse the accepted bounded sequence of login, identity, dashboard, tutorial rendering, own progress and quiz, cross-brand denial, logout/replay denial and fresh login. Protected login/session changes and learning writes must be included in that approval. Record whether targets are localhost consumers of protected stores or deployed sites. Deployment and provider calls require their respective release authorization.

### Authorization decision

**Phase 1 read-only preflight PASS. Phase 3 findings are dispositioned above. Phase 2 protected recovery evidence is BLOCKED. Phase 4 execution authorization remains PENDING. Protected migration recommendation HOLD.** Technical qualification remains accepted PASS.

The requested authorization phrase is **AUTHORIZE R6-B PRODUCTION PEOPLEDB MIGRATION**. Request that execution decision after the protected recovery record/procedure is verified and approved, together with explicit credential-risk acknowledgement and the exact smoke-test scope. The current instruction requires stopping before protected writes. No migration, protected restore, deployment or GitHub push occurred in this checkpoint. Canonical acceptance statuses remain unchanged and Q48 remains OPEN.

## Recovery acceptance and single execution authorization — 14 November 2026

This section supersedes the preceding unavailable-console and unverified-recovery states. The owner authorized recovery preparation, designated the project owner or explicitly authorized database operator for restoration, and supplied the successful Neon restore destination. R6-B technical qualification remains accepted PASS. The protected migration remains unexecuted pending the exact authorization below.

### Recovery point and tested destination

| Field | Recorded evidence |
|---|---|
| Project/source branch | `platform-people`, `bitter-tree-18287476`, production `br-misty-wildflower-a1jalxmd` |
| Recovery snapshot | `production at 2026-11-14 12:31:12 UTC (manual)` |
| Snapshot UTC time | `2026-11-14T12:31:12Z` |
| Snapshot retention | Authenticated console displays `Expires on: never`. Retention depends on keeping this snapshot and project available. A separate opaque snapshot UUID was not exposed in the inspected card. Name, source, UTC time and restored branch provide the recorded recovery reference. |
| PITR history | Authenticated console displays a six-hour window. This rolling history is separate from the retained manual snapshot. |
| Recovery destination | Owner-created `branch_from_snapshot_Nov 14, 2026 6:10 PM GMT+5:30`, ID `br-withered-wave-a17wttsi` |
| Recovery endpoint/database | `ep-purple-water-a1tdj2jd.ap-southeast-1.aws.neon.tech`, `people_prod`, positively checked through server settings |
| Restore operator | Project owner RealTutorialHub, or an explicitly authorized database operator acting under the owner-approved recovery procedure |
| Retention instruction | Preserve the manual snapshot and restored branch until migration acceptance is recorded |

The Windows native accessibility control reached the authenticated console after its earlier minimized-window failure. The console confirmed the production display name, six-hour history, successful snapshot creation in 1.02 seconds, UTC snapshot name and expiry `never`. Snapshot creation was expressly authorized. A later browser-policy stop ended that UI work before metadata/restore verification. The owner then supplied the successful restoration branch and ID. This continuation observed the restored branch in the existing authenticated SQL Editor and read its endpoint identifier. No additional screenshot or snapshot creation was needed for recovery acceptance.

`node .evidence/r6-recovery-acceptance/verify.cjs` used the existing secure credentials without printing them. Both connections had connection-default read-only enabled and ran `REPEATABLE READ READ ONLY` transactions. Server-side checks required the exact project, database and branch IDs before table inspection. No application connection was switched to the recovery branch.

All **14 recovery checks PASS**. The restored database has **27 public base tables**. Its columns, constraints, indexes and enums match production. All 27 table counts and server-side row fingerprints match the protected database at observation. Fingerprints retain only digest/count results, and no account rows or credentials are exported. Both ledgers contain the same nine historical source-matching entries through 0008. Representative users, platform grants and SSO sessions exist. Both databases have **35 validated foreign keys and zero orphan rows**, plus zero active normalized same-platform email conflicts. The production ledger remains unchanged from the prior preflight.

The first checker attempt failed because PostgreSQL `name[]` column metadata was returned as a string by the client. The read-only checker now selects `text[]` before iterating. `INITIAL_RECOVERY_ACCEPTANCE.json` retains that failure, and `RECOVERY_ACCEPTANCE.json` retains the completed passing run. These are evidence-harness changes only.

This accepts the actual Neon snapshot-to-isolated-branch recovery demonstrated by the owner and verified through real SQL. The previous successful synthetic `pg_dump`/`pg_restore` remains additional evidence for its own logical-recovery method. It is not used to claim that a Neon snapshot operation was tested. In-place production restoration remains outside the rehearsal.

### Final production preflight

At `2026-11-14T12:52:15Z`, the refreshed protected preflight passes **8/8 checks**. It verifies project `bitter-tree-18287476`, production branch `br-misty-wildflower-a1jalxmd`, direct endpoint `ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech`, `people_prod`, exact source ledger through 0008 and zero conflicting normalized same-platform emails. Registered pending migrations remain exactly 0009 invitations and 0010 normalized platform email, with the previously reviewed hashes. Required enum and old/new index states match the expected pre-migration baseline. Active application configuration contains no qualification-branch target. `PRODUCTION_PREFLIGHT.json` and `PREFLIGHT_EXECUTION.json` preserve the refreshed result without replacing the earlier receipt.

The accepted local SHC/SUIA/RTH code and bounded regression/runtime evidence remain applicable. Broader cold-start behavior, fresh-install provenance and the absent audit script retain their existing dispositions. Deployed code revisions remain outside the local evidence. The immediate validation targets are the existing localhost apps on ports 3007, 3009 and 3003 with their configured protected stores. Deployment requires separate approval.

### Exact approval and recovery procedure

**Recovery acceptance PASS. Final database preflight PASS. GO to the single owner authorization gate. Production migration execution remains PENDING.** The credential-exposure incident remains OPEN — REMEDIATION DEFERRED BY OWNER and requires acknowledgement in the execution decision. This GO recommendation describes the reviewed database operation with that open risk disclosed.

Authorize with **AUTHORIZE R6-B PRODUCTION PEOPLEDB MIGRATION**, acknowledging the existing credential-exposure risk and the documented snapshot recovery procedure. This approves the exact pending 0009/0010 sequence and the bounded localhost validation described in the owner's Phase D. It grants no deployment or GitHub push authority.

After authorization, reconfirm protected identity, the snapshot/recovery reference, SQL/source hashes and pending ledger immediately before execution. Load the existing reviewed protected connection securely into both `DATABASE_URL_PEOPLE` and `DATABASE_DIRECT_URL_PEOPLE`; retain credentials in process environment. Set `PEOPLE_MIGRATION_RECEIPT` to a new absolute evidence path. From `E:\onlinewebsites\quiz-platform`, run exactly:

```powershell
pnpm --filter @quiz/db-people db:migrate
```

The already qualified runner applies **0009_student_invitations → 0010_normalized_platform_email** using its existing advisory lock, exclusive ledger lock, five-second lock timeout, 120-second statement timeout and transaction. Verify eleven exact ledger hashes, invitation schema, final normalized partial uniqueness, preserved access/session constraints and the absence of unintended changes. An unexpected error or uncertain commit requires read-only state assessment before any retry.

For a detected uncommitted failure, confirm the original ledger and schema after rollback. For a committed failure requiring recovery, preserve the snapshot and current production state, keep affected writers controlled, and have the designated operator use the already verified snapshot to a new isolated branch. Verify that destination's schema, data fingerprints and ledger before an owner-approved service recovery/switchover. Replacing production or changing application connections requires explicit recovery approval. The pre-migration snapshot omits legitimate later writes, which must be assessed before rollback. Re-adding global email uniqueness can be impossible after valid cross-brand duplicates exist.

The snapshot and recovery branch remain retained. No protected migration, production restore, application deployment or GitHub push occurred in this checkpoint. Canonical statuses and Q48 remain owner-controlled. This checkpoint stops at the single production authorization gate.

## Authorized protected migration execution — 14 November 2026

The owner explicitly authorized `AUTHORIZE R6-B PRODUCTION PEOPLEDB MIGRATION. Please go ahead`. Source baseline is `995bb5871e8ab1989b5e8d76c464e1a6580fbcf7`. The supported command `pnpm --filter @quiz/db-people db:migrate` ran against protected `people_prod`, project `bitter-tree-18287476`, production branch `br-misty-wildflower-a1jalxmd`, direct endpoint `ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech`.

Execution started at `2026-11-14T13:00:57Z` and finished at `2026-11-14T13:01:06Z`, exit 0. The committed receipt contains exactly `0009_student_invitations` then `0010_normalized_platform_email`. All nineteen execution checks pass. Source hashes and the recovery branch were reconfirmed before the write. The pre-existing protected table fingerprints matched the accepted recovery state immediately before migration and remained identical immediately after it.

The production ledger now has eleven exact source-matching hashes/timestamps. The normalized partial unique index is unique, valid and ready. The global email constraint is removed. The invitation table has the thirteen declared source columns, foreign key and expected indexes, with zero rows immediately after migration. Existing platform-access/session constraints are preserved. A read-only integrity check confirms 36 validated foreign keys and zero orphan rows. The normalized same-platform conflict count remains zero. `EXECUTION.json`, `MIGRATION_RECEIPT.json`, `SCHEMA_VALIDITY.json` and `POST_MIGRATION_INTEGRITY.json` are under `.evidence/r6-production-cutover`.

The initial schema diagnostic assumed fifteen invitation columns and reported REVIEW. The approved SQL declares thirteen. The checker was corrected to derive exact column names from that unchanged SQL. The initial diagnostic is retained. The source and production table required no correction.

### Post-migration localhost validation

The existing approved accounts and original localhost listeners were used. SHC on 3007 passes 17/17 browser/HTTP checks, including login, identity, dashboard, admin domains, logout, captured identity/admin cookie denial, revoked-refresh denial and fresh login. SUIA on 3009 and RTH on 3003 each pass 22 recorded controls covering login, identity, dashboard, signed learner/person mapping, spoofed-header resistance, cross-brand profile denial, own progress read, completed own quiz result, foreign quiz result denial, logout/replay and fresh login. Read-only PeopleDB checks confirm both accounts retain their correct platform-qualified projection and active own-platform grant.

Both learner smoke receipts also retain tutorial HTTP 404 and subsequent text-wait timeout. The initially selected stored sidebar URL was stale. Follow-up checks selected canonical domain/subject/topic names and the authoritative TutorialDB subtopic slug. Java and Python still returned 404 from the existing running learner servers. Their dev route manifests contain no compiled tutorial-v2 entry. The current source resolver executed independently against configured databases resolves Java successfully for both brands with one content block. Python resolves with empty content because its working version lacks a published snapshot, and the existing publication guard correctly withholds it. No publication state was changed.

These observations establish a remaining running-application tutorial validation failure. They do not establish that the PeopleDB migration caused it. Protected TutorialDB content and hierarchy corrections are outside the approved PeopleDB SQL operation. A focused request to restart only the learner dev servers and retry affected tutorial checks is pending. Initial failed receipts and canonical selection diagnostics are preserved.

**Production PeopleDB migration PASS. Database ledger/schema/integrity PASS. SHC integration PASS. SUIA/RTH identity, quiz and session controls PASS with tutorial-rendering validation unresolved. Full three-app closure remains HOLD.** The snapshot and recovery branch remain retained. Credential exposure remains OPEN — REMEDIATION DEFERRED BY OWNER. Deployment and live-site compatibility retain their separate authorization and evidence requirements. Canonical acceptance statuses remain unchanged and Q48 stays OPEN.

### Final post-migration completion

The owner approved restarting only the two learner servers on existing ports 3009 and 3003. Their normal restart exposed generated-page loading errors while compiling tutorial-v2. A subsequent cache refresh preserved RTH's old `.next/dev` directory by rename. Windows denied the corresponding SUIA rename, so SUIA retained its existing cache. Both processes were restarted with their existing source/configuration. `APP_RESTART.json` and `CACHE_REFRESH.json` record the process IDs and the denied cache operation.

SUIA subsequently loaded the canonical Java lesson, rendered its published text, read own progress and logged out successfully. RTH's first regenerated request returned HTTP 200 after 119 seconds, including 114 seconds compiling, exceeding the check's 65-second allowance. Its warmed retry then passed rendered text, progress read and logout. Each final affected tutorial receipt passes **6/6**. Cold compilation failures/timeouts remain preserved. These results close the affected warmed tutorial controls while leaving startup reliability tracked.

| Final deliverable | Result |
|---|---|
| Production migrations 0009 then 0010 | PASS, committed on protected PeopleDB |
| Exact ledger, normalized uniqueness and invitation schema | PASS |
| Existing data preservation at migration boundary | PASS, all pre-existing public table fingerprints identical before/after |
| Foreign-key integrity | PASS, 36 validated foreign keys and zero orphan rows |
| SHC localhost integration | PASS, 17/17 controls |
| SUIA localhost integration | PASS for the bounded flow, 22 identity/dashboard/quiz/session controls plus final tutorial 6/6 |
| RTH localhost integration | PASS for the bounded flow, 22 identity/dashboard/quiz/session controls plus final tutorial 6/6 |
| Cross-brand profile and foreign-result denial | PASS in both brands |
| Snapshot and isolated recovery acceptance | VERIFIED, retained |
| R6-B database migration and bounded localhost cutover | PASS, milestone complete |
| Application deployment/live-site validation | Pending separate release scope |
| Credential incident | OPEN — REMEDIATION DEFERRED BY OWNER |

The smoke tests used existing approved accounts and existing completed exams. They performed login/logout session changes and browser-generated tutorial activity within the approved smoke scope. Learning-data checks used existing own progress and quiz results, avoiding a new exam or manually overwriting progress. Disposable qualification evidence retains the answer/submission/write-path coverage. This checkpoint establishes the bounded post-migration smoke outcome, with the tested localhost applications and their protected stores.

The selected stored tutorial URL was stale, and one intermediate diagnostic rebuilt the subtopic path from its name rather than its authoritative slug. The final Java control uses the existing TutorialDB slug `what-is-java-12efacf1`. Python's missing published snapshot remains an existing content qualification limitation and was excluded from the final lesson control. No tutorial publication or hierarchy record was edited. Initial diagnostics and failed receipts remain available.

All application listeners are running on their expected ports. SHC/API/gateway original processes were retained, and learner process changes follow the explicit restart approval. Private generated smoke-plan metadata was removed after evidence capture. Runtime credentials remain in their existing Git-ignored references. Secret checks, command receipts and changed-file hashes accompany the local evidence commit. The inherited `HUSKY=0` and existing missing root audit script remain disclosed, with explicit harness syntax checks and accepted earlier source-quality receipts reused.

The retained recovery snapshot is `production at 2026-11-14 12:31:12 UTC (manual)`, with displayed expiry `never`, and the recovery branch is `br-withered-wave-a17wttsi`. Keep both until owner migration acceptance. Any eventual restoration must account for legitimate post-snapshot session/activity writes. The known credential exposure remains open and owner-deferred. Q48, all 62 canonical acceptance statuses, held business features and broader project acceptance retain their existing authority boundaries.
