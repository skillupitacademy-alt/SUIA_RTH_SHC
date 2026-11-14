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
