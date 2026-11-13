# R6-B Addendum: MainDB Identity Contract, Approved FND03 Isolation, Exam Ownership & Minimally Scoped Owner Decisions (Read-Only)

**Status:** READ-ONLY ADDENDUM COMPLETE — **NO CODE, DDL, MIGRATION, OR DATA CHANGES EXECUTED**  
**Governing Instruction:** Preserve all 12 November 2026 `TutorialDB` `tutorial_progress.tenant_id` protections; reconcile `MainDB`, `PeopleDB`, `SkillUpDB`, `RthDB`, `TutorialDB`, and migration ledger provenance; break remediations into independent, minimally scoped **OWNER YES/NO DECISIONS**.  
**Baseline & Holds:** Attendance, payments, Marketing, and broader accessibility/performance remain **OWNER HOLD**.

---

## 1. Distinction Between `TutorialDB.tutorial_progress.tenant_id`, Other Tenant-Qualified Contracts, and `MainDB.users.tenant_id`

The repository's tenant-qualified contracts are **not** all the same mechanism or at the same maturity stage:

| Surface / DB | Contract / Column / Code | Status | Governance & Disposition |
|---|---|---|---|
| **TutorialDB** (`@quiz/db-tutorial`) `tutorial_progress` | `tenant_id text NOT NULL`, `CHECK (tenant_id IN ('skillup','realtutorialhub','skillhubcore'))`, `idx_tutorial_progress_tenant`, `uq_tutorial_progress_tenant_user_subtopic (tenant_id, user_id, subtopic_id)` ([tutorial-progress.ts](file:///e:/onlinewebsites/quiz-platform/packages/db-tutorial/src/schema/tutorial-progress.ts#L9-L30), [20261112_progress_tenant_empty_table.sql](file:///e:/onlinewebsites/quiz-platform/packages/db-tutorial/src/migrations/manual/20261112_progress_tenant_empty_table.sql)) + `TutorialProgressRepository.requireTenantCondition()` ([tutorial-progress.repository.ts](file:///e:/onlinewebsites/quiz-platform/packages/db-tutorial/src/repositories/tutorial-progress.repository.ts#L69)) | **APPROVED & IMPLEMENTED (12 Nov 2026)** | **PRESERVE.** Prevents SUIA and RTH students with colliding IDs or shared content from sharing/overwriting tutorial progress. |
| **TutorialDB** (`@quiz/db-tutorial`) `event_outbox` | `tenant_id varchar(50) NOT NULL`, composite indexes ([event-outbox.ts](file:///e:/onlinewebsites/quiz-platform/packages/db-tutorial/src/schema/event-outbox.ts#L11-L33), `0030_event_outbox.sql`) + `event-outbox.repository.ts` | **IMPLEMENTED IN SOURCE** (migration `0030` execution subject to migration governance) | **PRESERVE.** |
| **RTH Web Workers & Tutorial Services** | `remediation.service.ts`, `project.service.ts`, `assignment.service.ts`, `ai-tutor-progress.ts`, `worker-lease.ts` (`outbox:${tenantId}:...`), `issue-certificate`, `award-project-badge` | **IMPLEMENTED & TESTED** | **PRESERVE.** |
| **Shared RBAC (`@quiz/auth`)** | `OwnershipService` ([ownership.service.ts](file:///e:/onlinewebsites/quiz-platform/packages/auth/src/rbac/ownership.service.ts#L23-L63)), `rbac.guard.ts`, `enforcer.ts` | **APPROVED FND03 CONTRACT IN CODE** | **PRESERVE.** Enforces tenant boundary before `userId` equality. |
| **Exam Saga / Export Payloads** (`apps/api-server`) | `exam.saga.ts:210-211`, `exportEngine.ts:166,227` (`tenantId` in job/event metadata) | **IN-MEMORY / JOB METADATA ONLY** | Does **not** persist `tenant_id` to `MainDB.exams`. |
| **MainDB** (`@quiz/db`) `users` | `tenant_id`, `local_subject_id`, `idx_users_tenant_local_subject` ([auth.ts](file:///e:/onlinewebsites/quiz-platform/packages/db/src/schema/auth.ts#L19-L31)) | **UNIMPLEMENTED IN DB; BLOCKED STUB** ([0001_fnd03_add_tenant_ownership.sql](file:///e:/onlinewebsites/quiz-platform/packages/db/migrations/0001_fnd03_add_tenant_ownership.sql#L1-L3)) | **SEPARATE UNRESOLVED MAINDB ISSUE.** Removing or retaining it does **not** touch `TutorialDB.tutorial_progress.tenant_id`. |

---

## 2. End-to-End Trace: SUIA / RTH Exam Ownership Contract

Read-only trace from authentication to `MainDB.exams`:

1. **Login & Brand-Local ID (`SkillUpDB` / `RthDB`):**
   - `LoginService.login()` ([login.service.ts](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/login.service.ts)) authenticates against `SkillUpDB` (`skillup_prod`) or `RthDB` (`rth_prod`) via `getAuthBrandContext(brand)`.
   - `user.id` is the **brand-local UUID** (`S-101` in `SkillUpDB`, `R-202` in `RthDB`).
   - `ensureShadowUserId()` syncs `(externalId: user.id, externalBrand: brand, platform: brand, email)` into `PeopleDB` (`people_prod`) via `UserIdentityBridgeService` and stores `shadow_user_id` on `SkillUpDB.users` / `RthDB.users`.
2. **JWT & Gateway Forwarding:**
   - The learner JWT sets `userId` / `originalUserId` = **brand-local UUID** (`S-101` or `R-202`) and `shadowUserId` = **PeopleDB UUID**.
   - `services/api-gateway` forwards `X-Original-User-ID` and `X-Shadow-User-ID` ([proxy.ts](file:///e:/onlinewebsites/quiz-platform/services/api-gateway/src/lib/proxy.ts#L84-L85)).
3. **Exam Creation (`POST /api/quiz/start` -> `ExamEngine.startExam` -> `ExamBuilder` -> `ExamRepository.createExamWithQuestions`):**
   - [quiz/start/route.ts:31,66](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/app/api/quiz/start/route.ts#L31-L66) verifies the user access token and dispatches `StartExamCommand({ userId: payload.userId, ... })` — i.e., the **brand-local UUID**, **not** `shadowUserId`.
   - [exam.repository.ts:173-179](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/exam-engine/repositories/exam.repository.ts#L173-L179) inserts `{ userId: data.userId, ... }` directly into `MainDB.exams`.
4. **MainDB Schema Reality (Verified Read-Only):**
   - `MainDB.exams` (`quiz_platform_prod`) has **no `tenant_id` column** (only `id, user_id, blueprint_id, status, total_score, started_at, completed_at, duration_seconds, last_answered_at, report_materialized, export_urls, deleted_at`).
   - `MainDB.exams.user_id` has a hard FK constraint `exams_user_id_users_id_fk` referencing `MainDB.public.users(id)`.
   - `MainDB.public.users` has `users_email_unique` (`UNIQUE(email)`) and **no `tenant_id`**.
5. **Exam Result Authorization (`GET /api/quiz/result`, `POST /api/quiz/submit`):**
   - [quiz/result/route.ts:45-47](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/app/api/quiz/result/route.ts#L45-L47) enforces `if (examCheck.userId !== payload.userId) throw forbidden(...)`.
   - [quiz/submit/route.ts:54](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/app/api/quiz/submit/route.ts#L54) passes `payload.userId` to `completeExam`.
6. **Exact Gap / Failure Mode for Same-Email & Cross-Brand Learners:**
   - Because `ExamEngine` does **not** provision a `MainDB.users` row on login or exam start, a brand-local learner (`S-101` or `R-202`) whose UUID is not already in `MainDB.users` will fail `exams_user_id_users_id_fk` on `INSERT INTO exams` (which is why R5's `authenticated-http.cjs:109` had to manually `INSERT INTO users` in `pools.main` to test `/api/quiz/result`).
   - If two brand accounts share the same email (`rahul@example.com` in SUIA `S-101` and RTH `R-202`), `MainDB.users` **cannot** mirror both rows because `users_email_unique` rejects the second email.
   - `MainDB.exams` has **no `tenant_id`** column, so cross-brand exam isolation relies solely on `S-101 != R-202` UUID non-collision rather than tenant-qualified ownership (`(tenant_id, user_id)`).

---

## 3. Classification of the Three Missing MainDB Fields (Not Based on Caller Count Alone)

| Field on `packages/db/src/schema/auth.ts` | Classification | Evidence & Rationale |
|---|---|---|
| `shadow_user_id` | **Schema-placement mismatch / Bridge field leaked from brand DBs** | Required and live on **`SkillUpDB.users`** and **`RthDB.users`** (do **not** remove from those packages/DBs). Never migrated to `MainDB` (`packages/db/migrations/`). Only needed on `MainDB.users` if `MainDB.users` continues to act as a live auth table for a brand/portal. |
| `tenant_id` (`users.tenant_id`) | **Unimplemented FND03 persistence contract (blocked migration)** | Represents the approved FND03 principle that cross-brand records must be tenant-qualified. Its `MainDB.users` migration ([0001_fnd03_add_tenant_ownership.sql](file:///e:/onlinewebsites/quiz-platform/packages/db/migrations/0001_fnd03_add_tenant_ownership.sql)) was deliberately blocked pending provenance review. Must **not** be deleted until the owner decides whether tenant qualification for `MainDB` lives on `MainDB.users`, on owning domain tables (`exams`), or via a dedicated mapping contract. |
| `local_subject_id` (`users.local_subject_id`) | **Unimplemented FND03 draft (subject mapping)** | Paired with `tenant_id` (`idx_users_tenant_local_subject`) as a candidate way to map `(tenant_id, local_subject_id)` to a `MainDB.users` surrogate row without colliding emails. Keep/retire decision depends directly on the `MainDB` exam-ownership decision above. |

---

## 4. Callers & Schema Compatibility of `getAuthBrandContext('skillhubcore')`

In [brand-db.ts:99-103](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/brand-db.ts#L99-L103), `brand === 'skillhubcore'` comments `// SkillHub Core uses people_db` yet returns `{ db: defaultDb, tables: defaultTables }` (`MainDB`).

1. **Authoritative SHC Admin routes do NOT use `getAuthBrandContext`:**
   - `/api/shc/auth/login`, `/api/shc/auth/me`, `/api/shc/auth/logout`, and `requireAdminRouteAccess` (`audience === 'shc-admin'` in [admin-audience.util.ts:90](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/admin-audience.util.ts#L90)) call `SHCAuthService` (`@quiz/db-people`).
   - `_verifyActiveAccount` ([rbac.service.ts:22](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/rbac.service.ts#L22)) explicitly rejects `'skillhubcore'` (only accepts `'skillup' | 'realtutorialhub'`).
2. **Generic auth routes CAN still pass `'skillhubcore'` into `getAuthBrandContext`:**
   - `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/admin/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me`, `GET /api/admin/auth/me` resolve `brand` via `resolveRequestBrand(...)` / `resolveRequestBrandFromHeaders(...)` (which can return `'skillhubcore'`) and pass it to `LoginService`, `SignupService`, `AdminAuthService`, `TokenRefreshService`, `GlobalLogoutService`, `PasswordRecoveryService`, and `AuditService`.
   - Notably, `login-01-purpose.test.ts:239,383` explicitly exercises generic `'skillhubcore'` login behavior.
3. **Why blindly switching `brand-db.ts` to `@quiz/db-people` would break:**
   - `BrandAuthTables` expects `users`, `userProfiles`, `roles`, `userRoles`, `sessions`, `refreshTokens`, `loginAttempts`, `auditLogs`, `verificationTokens`, `passwordResetTokens` (with `isBlocked`, `emailVerified`, `shadowUserId` on `users`).
   - `PeopleDB` (`@quiz/db-people`) has **none** of `roles`, `userRoles`, `sessions`, `refreshTokens`, `loginAttempts`, `verificationTokens`, `passwordResetTokens` — it uses `role` enum on `users`, `isActive` instead of `isBlocked`, `refresh_token_families`, `sso_sessions`, `platform_access`, and `auth_audit_log`.
   - **Conclusion:** `getAuthBrandContext('skillhubcore')` cannot simply swap `defaultDb` for `peopleDb`; any fix must either reject `'skillhubcore'` in brand-local learner/tenant auth paths (routing SHC Admin exclusively through `SHCAuthService`) or adapt the callers explicitly.

---

## 5. Reconciliation of `PeopleDB` Source Uniqueness vs. Live Database Constraints

| Source / Live DB | Email / Platform Uniqueness Definition | Status |
|---|---|---|
| **Source (`packages/db-people/src/schema/users.ts:23-28`)** | `uniqEmailPlatform`: `UNIQUE INDEX uniq_users_email_platform ON (LOWER(TRIM(email)), platform) WHERE deleted_at IS NULL`; `idxUsersExternalIdPlatform`: `UNIQUE INDEX idx_users_external_id_platform ON (external_id, platform) WHERE external_id IS NOT NULL`. **No** global `users_email_unique`. | **SOURCE CONTRACT** |
| **Live `PeopleDB (people_prod)`** (`pg_constraint` + `pg_indexes`, read-only) | 1. `CONSTRAINT users_email_unique UNIQUE (email)` (global unique email from `0000_perpetual_microbe.sql:63`)<br>2. `idx_users_email_platform`: **non-unique** `CREATE INDEX ... (email, platform) WHERE (deleted_at IS NULL)` (from `0004_amusing_kang.sql`)<br>3. `idx_users_external_id_platform`: `CREATE UNIQUE INDEX ... (external_id, platform) WHERE (external_id IS NOT NULL)` | **MISMATCH WITH SOURCE** |

### Identity-Bridge (`UserIdentityBridgeService`) Impact
- [UserIdentityBridgeService.ts:20-63](file:///e:/onlinewebsites/quiz-platform/packages/identity-bridge/src/UserIdentityBridgeService.ts#L20-L63) looks up `PeopleDB.users` **only by `(externalId, platform)`** before calling `INSERT INTO users`.
- If the same email (`rahul@example.com`) already exists in `PeopleDB` from SUIA (`externalId = S-101, platform = 'skillup'`), and RTH (`externalId = R-202, platform = 'realtutorialhub'`) calls `syncUser()`, the `(R-202, 'realtutorialhub')` lookup returns 0 rows and `INSERT` **violates live `users_email_unique` (SQLSTATE `23505`)**!
- Under `LoginService.ensureShadowUserId()` ([login.service.ts:66-77](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/login.service.ts#L66-L77)), in production (`NODE_ENV !== 'test'`), that `23505` error is **rethrown** and **blocks login** for the second brand!

---

## 6. Migration Journal, Live Objects, and Provenance Reconciliation (`MainDB` `0014` & `0023`)

Inspected `MainDB (quiz_platform_prod)` `drizzle.__drizzle_migrations` (`BEGIN READ ONLY`) and compared against `packages/db/migrations/meta/_journal.json` and `SHA-256` file hashes:

| Migration | `_journal.json` | Live `drizzle.__drizzle_migrations` | Live `MainDB` Objects | Provenance Finding |
|---|---|---|---|---|
| `0014_quiet_killraven.sql` | `idx: 14`, `when: 1772855385349` | **PRESENT:** `id=33`, `created_at=1772855385349`, `hash=b21fb9e86a9fe5884cb4feb0c1813db7d48f0f5c9e5459059f25f7da56038608` (**exact SHA-256 match** to `0014_quiet_killraven.sql`) | `idx_users_created_at` is **ABSENT** from `pg_indexes` on `public.users` | **Ledger-recorded but index absent in live DB.** Either `0014` was stamped in the ledger without executing all statements, or `idx_users_created_at` was later dropped/never created. Must verify the other 6 indexes in `0014` read-only before re-applying. |
| `0023_thankful_king_bedlam.sql` | `idx: 23`, `when: 1776274630310` | **ABSENT** (last ledger row is `id=54`, `created_at=1774929878092`, matching `0022_deep_pixie`) | All 6 onboarding columns (`is_onboarded`, `primary_goal`, `domain`, `sub_domain`, `time_commitment`, `journey_status`) are **ABSENT** | **Proven unapplied to `MainDB`.** Applied in `SkillUpDB` and `RthDB`, never executed against `MainDB`. |

---

## 7. Minimally Scoped Owner YES/NO Decisions & Recommended Order

Each item below is an independent decision; **none** modifies `TutorialDB.tutorial_progress.tenant_id` or `SkillUpDB`/`RthDB` `shadow_user_id`.

| Order | Decision ID | Minimally Scoped Proposal | Affected Files / DB | Risk & Rollback | Required Verification Tests |
|---|---|---|---|---|---|
| **1** | **DEC-R6B-01** | **Settle `MainDB` Exam Ownership Contract:** Choose how SUIA/RTH learners own `exams` in `MainDB`: **(a)** add `tenant_id` to `exams` (like `TutorialDB`) + decouple/replace `exams.user_id -> MainDB.users` FK, OR **(b)** keep `MainDB.users` as a tenant-scoped mirror using `(tenant_id, local_subject_id)` and drop global `users_email_unique` on `MainDB`. | `packages/db/src/schema/auth.ts`, `exams` schema, `ExamRepository`, `quiz/start`, `quiz/result`, `quiz/submit` | **High architectural impact if deferred:** same-email users across SUIA/RTH fail FK or collide. Rollback = keep R6-A exam-ownership tests failing closed / pending until decided. | Cross-brand same-email exam start + result ownership positive/negative tests (SUIA vs RTH). |
| **2** | **DEC-R6B-02** | **Reconcile `PeopleDB` Email/Platform Uniqueness:** Align live `PeopleDB` with `packages/db-people/src/schema/users.ts` (`uniq_users_email_platform` on `(LOWER(TRIM(email)), platform)` + drop global `users_email_unique`), OR update `UserIdentityBridgeService` to reuse/link one `PeopleDB` row by email across platforms. | `packages/db-people` migration / `UserIdentityBridgeService.ts` | **Medium risk:** today, second-brand login with same email crashes with `23505` in prod. Reversible via migration/service logic once chosen. | Same-email SUIA + RTH dual-login integration test against `PeopleDB` + `UserIdentityBridgeService`. |
| **3** | **DEC-R6B-03** | **Fix `getAuthBrandContext('skillhubcore')` Routing Contradiction:** Reject `'skillhubcore'` in brand-local `BrandAuthTables` learner/tenant auth callers (or explicitly fence generic `skillhubcore` login tests) so SHC Admin routes exclusively via `SHCAuthService` (`PeopleDB`) and never silently queries `MainDB.users`. | `apps/api-server/src/modules/auth/brand-db.ts`, callers & `login-01-purpose.test.ts` | **Low-Medium risk:** avoids `PeopleDB` vs `BrandAuthTables` schema crash; rollback = single file revert. | Unit/route tests verifying `shc/auth/*` uses `PeopleDB` and brand-local auth rejects/fences `skillhubcore` without touching `MainDB.users`. |
| **4** | **DEC-R6B-04** | **Align `MainDB.users` Schema & Provenance (`0014`, `0023`, `shadow_user_id`, `tenant_id`, `local_subject_id`):** Executed **only after** `DEC-R6B-01` settles whether `MainDB.users` remains an auth/mirror table (requiring `0014` index check, `0023` onboarding columns, `shadow_user_id`, `tenant_id`, `local_subject_id`) or is retired from Drizzle `users` queries that cause `42703`. | `packages/db/src/schema/auth.ts`, `packages/db/migrations/` (guarded, rehearsed DDL only) | **Medium risk:** eliminates `SQLSTATE 42703`. Must inspect remaining 6 indexes of `0014` read-only before any DDL. | `information_schema` parity check + Drizzle `users` select/insert smoke test (zero `42703`). |

**Recommended Execution Order:** `DEC-R6B-01` (Exam ownership contract) -> `DEC-R6B-02` (`PeopleDB` same-email bridge) -> `DEC-R6B-03` (`brand-db.ts` `'skillhubcore'` fence) -> `DEC-R6B-04` (`MainDB.users` schema & `0014`/`0023` alignment).

