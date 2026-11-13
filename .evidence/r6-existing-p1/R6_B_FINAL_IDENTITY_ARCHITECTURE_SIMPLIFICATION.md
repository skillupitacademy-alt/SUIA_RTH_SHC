# R6-B Final Identity Architecture Simplification Proposal (Read-Only Design)

**Source Baseline:** `main` @ `62f920f4782b8bbb277f88dc27930cd3b86f1b15` (verified via `.git/HEAD` & `.git/refs/heads/main`)  
**Status:** READ-ONLY DESIGN & VERIFICATION ONLY — **NO CODE, DDL, MIGRATION, RESET, GIT, OR DEPLOYMENT EXECUTED**  
**Governing Standard:** PSEG-001 + FND03 Tenant-Qualified Ownership + Owner Business Rules (1–9)  
**Active Holds:** Attendance, payments, Marketing, and broader accessibility/performance remain **OWNER HOLD**.

---

## Executive Summary & Target Identity Model

**Target Logical Student Identity for All Shared Student-Owned Resources:**
$$\text{Logical Student Identity} = (\text{verified } \texttt{tenant\_id},\ \texttt{brand\_local\_user\_id})$$

- **SUIA (`SkillUpDB`)** and **RTH (`RthDB`)** remain completely independent account authorities (`users.id` = `brand_local_user_id`). Same-email accounts in SUIA and RTH are distinct student accounts and never merge.
- **PeopleDB (`people_prod`)** retains its internal `users.id` UUID as the **internal primary key** for its own child FKs (`platform_access`, `sso_sessions`, `refresh_token_families`, `admissions`, `batches`, `subscriptions`, etc.) and **SHC Admin** auth (`SHCAuthService`), while **`(platform, external_id)`** serves as the authoritative cross-database reference for brand students—with live `users_email_unique` replaced by `(LOWER(TRIM(email)), platform)` to match `packages/db-people/src/schema/users.ts`.
- **MainDB (`quiz_platform_prod`)** adopts direct tenant-qualified ownership `(tenant_id, user_id)` on student-owned shared educational tables (`exams`, `idempotency_keys`, `reports`, `report_jobs`, `background_jobs`, `notifications`, `notes_access_logs`, `notes_delivery_locks`, `user_recommendations`, `tutor_help_requests`), removing the requirement to mirror SUIA/RTH students into `MainDB.users` and eliminating `MainDB.users` email-collision and `SQLSTATE 42703` failures.
- **TutorialDB (`tutorial_prod`)** preserves the 12 November 2026 `tutorial_progress.tenant_id` implementation (`(tenant_id, user_id, subtopic_id)`), `TutorialProgressRepository`, and existing hierarchy sync contracts untouched.

---

## Task A — Complete Current Identity Inventory (All 5 Databases)

Verified against `packages/db*` source and live PostgreSQL catalogs (`BEGIN READ ONLY` + `ROLLBACK`):

| DB Alias (`current_database()`) | Table | PK & Key Indexes/Constraints | Tenant / Platform Column | ID Semantics | Live Rows (Dev/Dummy) | Source vs. Live Drift & Classification |
|---|---|---|---|---|---|---|
| **SkillUpDB** (`skillup_prod`) | `users` | PK `id`; `UNIQUE(email)` (`users_email_unique`) | Implicit (`skillup` DB) | **Brand-local UUID** (`S-xxx`) + `shadow_user_id` | 46 (`45` bridged) | **Matches** `@quiz/db-skillup` (16 cols). **Necessary** account authority. |
| **SkillUpDB** (`skillup_prod`) | `user_profiles`, `roles`, `user_roles`, `refresh_tokens`, `sessions`, `audit_logs`, `login_attempts`, `password_reset_tokens`, `verification_tokens` | FK `user_id -> users.id` (8 FKs) | Implicit (`skillup` DB) | Brand-local UUID | `roles`: 6, `user_roles`: 7, `refresh_tokens`: 2264 | **Matches** source. **Necessary**; `roles` & admin `user_roles` must NOT be wiped blindly. |
| **RthDB** (`rth_prod`) | `users` | PK `id`; `UNIQUE(email)` (`users_email_unique`) | Implicit (`rth` DB) | **Brand-local UUID** (`R-xxx`) + `shadow_user_id` | 103 (`101` bridged) | **Matches** `@quiz/db-rth` (16 cols). **Necessary** account authority. |
| **RthDB** (`rth_prod`) | Same 9 child tables | FK `user_id -> users.id` (8 FKs) | Implicit (`rth` DB) | Brand-local UUID | `roles`: 6, `user_roles`: 9, `refresh_tokens`: 2663 | **Matches** source. **Necessary**; `roles` & admin `user_roles` must be preserved. |
| **PeopleDB** (`people_prod`) | `users` | PK `id`; **LIVE:** `users_email_unique` (`UNIQUE(email)`), non-unique `idx_users_email_platform`, unique `idx_users_external_id_platform` | `platform` (`people_platform` enum) + `external_brand` | **PeopleDB internal UUID**; links `(platform, external_id)` | 319 (`217` skillup student, `99` rth student, `2` rth admin/super_admin, **`1` shc super_admin**) | **DRIFT:** Source (`packages/db-people/src/schema/users.ts:23`) declares `uniq_users_email_platform` on `(LOWER(TRIM(email)), platform)`, NOT global `users_email_unique`. Global constraint blocks same-email SUIA+RTH bridging (`23505`). |
| **PeopleDB** (`people_prod`) | `platform_access`, `sso_sessions`, `refresh_token_families`, `user_profiles`, `admissions`, `enquiries`, `batches`, `batch_enrollments`, `subscriptions`, `faculty`, `attendance_records` | 15 FKs referencing `PeopleDB.users(id)` | `platform` on `platform_access`, `sso_sessions`, `refresh_token_families` | PeopleDB internal UUID | `platform_access`: 148, `sso_sessions`: 40, `admissions`: 170, `enquiries`: 283, `batches`: 115 | **Necessary** internal FKs for PeopleDB & SHC Admin (`SHCAuthService`). `attendance_records` (4) is HOLD. |
| **MainDB** (`quiz_platform_prod`) | `users` | PK `id`; `UNIQUE(email)` (`users_email_unique`) | **LIVE:** None. **SOURCE:** `tenant_id`, `local_subject_id`, `shadow_user_id`, 6 onboarding cols | MainDB surrogate/legacy UUID | 19 (`roles`: 7, `user_roles`: 24) | **DRIFT + UNRESOLVED:** Live table has **9 cols** (`0000_cheerful_callisto.sql`); source (`packages/db/src/schema/auth.ts`) declares **18 cols**. `0014` (`idx_users_created_at` + 6 other indexes) is in `drizzle.__drizzle_migrations` (`id=33`) yet **0/7 indexes exist** in `pg_indexes`. `0023` (onboarding) is unapplied. `0001_fnd03` is a blocked stub. |
| **MainDB** (`quiz_platform_prod`) | Student-owned domain tables: `exams`, `idempotency_keys`, `reports`, `report_jobs`, `background_jobs`, `notifications`, `notes_access_logs`, `notes_delivery_locks`, `user_recommendations`, `tutor_help_requests` | 10 FKs referencing `MainDB.users(id)` (`exams.user_id` etc.) | **None** in DB (only in-memory `tenantId` in `exam.saga.ts` / `exportEngine.ts`) | Currently expects `MainDB.users.id`, receives **brand-local UUID** from JWT `payload.userId` | `exams`: 9, `reports`: 4, `background_jobs`: 73 | **UNRESOLVED OWNERSHIP DEFECT:** Brand-local learner UUIDs fail `exams_user_id_users_id_fk` unless mirrored into `MainDB.users`; mirroring collides on `users_email_unique` for same-email SUIA+RTH learners. |
| **MainDB** (`quiz_platform_prod`) | Auth & Ops tables: `user_profiles`, `roles`, `user_roles`, `sessions`, `refresh_tokens`, `login_attempts`, `password_reset_tokens`, `verification_tokens`, `audit_logs`, `automation_aliases`, `automation_feature_flags`, `automation_policies`, `automation_telemetry` | 13 FKs referencing `MainDB.users(id)` (e.g. `updated_by`, `created_by`, `user_id`) | None | MainDB UUID | `audit_logs`: 4855, `refresh_tokens`: 1693, `automation_feature_flags`: 1, `automation_policies`: 1 | Legacy MainDB auth tables + operational/config tables (`automation_*`, `audit_logs`). |
| **TutorialDB** (`tutorial_prod`) | `tutorial_progress`, `event_outbox` (source), `domains`/`subjects`/`topics`/`subtopics` | `uq_tutorial_progress_tenant_user_subtopic (tenant_id, user_id, subtopic_id)` | `tenant_id` (`CHECK IN ('skillup','realtutorialhub','skillhubcore')`) | `(verified tenant_id, brand_local_user_id)` | `tutorial_progress`: 0, `domains`: 8, `subjects`: 14, `topics`: 10, `subtopics`: 7 | **ALIGNED & APPROVED (12 Nov 2026). PRESERVE.** (`event_outbox` `0030` not yet executed in live `TutorialDB`). |

---

## Task B — Simplify `PeopleDB` Identity (Option A vs. Option B)

### Comparison
| Dimension | **Option A (Recommended): Retain `PeopleDB.users.id` Internally; Standardize Student Ownership on `(tenant_id, brand_local_user_id)`** | **Option B: Remove Brand-Side `shadowUserId` Dependencies & Adapt PeopleDB Consumers to `(platform, external_id)`** |
|---|---|---|
| **PeopleDB PK & FKs** | Keeps `PeopleDB.users.id` UUID PK and all 15 existing FKs (`platform_access`, `sso_sessions`, `refresh_token_families`, `admissions`, etc.) intact. | Also keeps `PeopleDB.users.id` only where internal FKs require it, OR requires rewriting 15 FKs + `services/skillhubcore-service` to composite `(platform, external_id)` keys. |
| **Learner-facing services (`exams`, `tutorial_progress`, `profile`)** | **Zero dependency on `shadowUserId`.** All student-owned resources use `(tenant_id, brand_local_user_id)`. | Same end state for learner-facing services, but forces simultaneous rewrite of `services/skillhubcore-service`, gateway headers, and JWT claims. |
| **SHC Admin (`SHCAuthService` & `services/skillhubcore-service`)** | **Unbroken.** SHC Admins (`platform='skillhubcore'`) have no brand-local SUIA/RTH account; `PeopleDB.users.id` IS their authoritative `userId` (`originalUserId = shadowUserId = user.id`). | High blast radius: `services/skillhubcore-service/src/modules/auth/auth.service.ts:198`, `token-validator.service.ts:62-139`, `verify-jwt.ts` all key sessions and `platform_access` on `shadowUserId` (`PeopleDB.users.id`). |
| **Gateway & BFF (`X-Shadow-User-ID` / `X-Original-User-ID`)** | `X-Original-User-ID` (`brand_local_user_id`) + `brand` (`tenant_id`) are authoritative for student data; `shadowUserId` remains an optional PeopleDB projection/SSO reference when needed. | Removing `shadowUserId` from JWT/gateway breaks `services/skillhubcore-service` session revocation (`auth.routes.ts:190-227`) and `apps/api-server/src/lib/request-auth.ts` (`getEffectiveUserId`). |
| **Risk & Complexity** | **Low risk, minimal diff.** Fixes `PeopleDB` `users_email_unique` -> `uniq_users_email_platform` so SUIA and RTH same-email accounts each get their own `(platform, external_id)` projection row without merging. | **High risk / unnecessary churn.** Rewriting 15 PeopleDB FKs and `skillhubcore-service` adds complexity without improving isolation. |

**Recommendation:** **Adopt Option A.** Keep `PeopleDB.users.id` as PeopleDB's internal PK (essential for SHC Admin and PeopleDB's 15 FKs), keep `(platform, external_id)` as the unique cross-DB projection key for SUIA/RTH learners, fix live `PeopleDB` to enforce `uniq_users_email_platform` instead of global `users_email_unique`, and **do not** use `shadow_user_id` as an owner key in `MainDB` or `TutorialDB`.

---

## Task C — Simplify `MainDB` Exam Ownership (23 FKs Classified)

### Direct `(tenant_id, brand_local_user_id)` vs. Minimal `MainDB.users` Mirror
- **Direct `(tenant_id, user_id)` on exam/student resource tables (Recommended)** eliminates mirroring SUIA/RTH students into `MainDB.users`, eliminates `MainDB.users_email_unique` collisions for same-email dual-brand learners, and mirrors the proven `TutorialDB.tutorial_progress` pattern.
- **Minimal `MainDB.users` mirror** would still require dropping `MainDB.users_email_unique`, adding `tenant_id` + `local_subject_id`, AND synchronously provisioning `MainDB.users` rows on every SUIA/RTH signup/login (extra cross-DB write + failure mode).

### Classification of All 23 `MainDB.users` Referencing Foreign Keys
1. **Group 1 — Student-Owned Educational Resources (10 FKs -> Migrate to `(tenant_id, user_id)` & Drop `-> MainDB.users(id)` FK):**
   - `exams.user_id` (`exams_user_id_users_id_fk`)
   - `idempotency_keys.user_id` (`idempotency_keys_user_id_users_id_fk`) — update uniqueness to `(tenant_id, user_id, key)`
   - `reports.user_id` (`reports_user_id_users_id_fk`)
   - `report_jobs.user_id` (`report_jobs_user_id_fkey`)
   - `background_jobs.user_id` (`background_jobs_user_id_users_id_fk` + duplicate `background_jobs_user_id_fkey`)
   - `notifications.user_id` (`notifications_user_id_users_id_fk`)
   - `notes_access_logs.user_id` (`notes_access_logs_user_id_users_id_fk`)
   - `notes_delivery_locks.user_id` (`notes_delivery_locks_user_id_users_id_fk`)
   - `user_recommendations.user_id` (`user_recommendations_user_id_users_id_fk`)
   - `tutor_help_requests.user_id` (`tutor_help_requests_user_id_users_id_fk`)
2. **Group 2 — Legacy MainDB Auth Tables (7 FKs -> Keep Intact on `MainDB.users` Until/Unless Retired):**
   - `user_profiles`, `user_roles`, `sessions`, `refresh_tokens`, `login_attempts`, `password_reset_tokens`, `verification_tokens`.
3. **Group 3 — Operational & Admin Audit/Config Tables (5 FKs -> Keep Nullable/Non-Student Actor Reference):**
   - `audit_logs.user_id` (`ON DELETE SET NULL`), `automation_aliases.created_by`, `automation_feature_flags.updated_by`, `automation_policies.updated_by`, `automation_telemetry.user_id`.

### Dummy Data Reset Inventory (Owner Approval Required Before Any Reset)
- **Safe to Reset/Truncate (Dev/Dummy Student & Test Artifacts Only):**
  - `MainDB`: `exams` (9), `idempotency_keys` (12), `reports` (4), `report_jobs` (2), `background_jobs` (73), `notifications` (14), `notes_delivery_locks` (4), `user_recommendations` (4), `tutor_help_requests` (2), `refresh_tokens` (1693), `login_attempts` (12), `password_reset_tokens` (8).
  - `SkillUpDB` / `RthDB`: student `users` (non-admin), `refresh_tokens`, `login_attempts`.
  - `PeopleDB`: student `users` (`role = 'student'`), `platform_access`, `sso_sessions`, `refresh_token_families`, `enquiries`/`admissions`/`batches` dummy rows (only if separately authorized).
- **MUST PRESERVE (Never Wipe):**
  - `PeopleDB`: `users` where `platform = 'skillhubcore'` (`1` `super_admin`) and any admin/super_admin accounts (`2` RTH admin/super_admin).
  - `SkillUpDB` & `RthDB`: `roles` (6 each) and admin `user_roles` (7 / 9).
  - `MainDB`: `roles` (7), `domains` (8), `subjects` (13), `topics` (11), `subtopics` (8), `questions` (63), `automation_feature_flags` (1), `automation_policies` (1), `drizzle.__drizzle_migrations`.
  - `TutorialDB`: `domains` (8), `subjects` (14), `topics` (10), `subtopics` (7), `tutorial_progress` (0, already aligned).

---

## Task D — Preserve `TutorialDB` & Brand-Local Accounts

- **Preserved Unchanged:** `packages/db-tutorial/src/schema/tutorial-progress.ts`, `20261112_progress_tenant_empty_table.sql`, `TutorialProgressRepository`, `uq_tutorial_progress_tenant_user_subtopic (tenant_id, user_id, subtopic_id)`, and `HierarchySyncService`.
- **Why `tenant_id` is required on shared student-owned tables (`TutorialDB`, `MainDB`) but NOT on brand-local tables (`SkillUpDB`, `RthDB`):**
  - `SkillUpDB` (`skillup_prod`) and `RthDB` (`rth_prod`) are physically separate per-brand databases; every row inside `SkillUpDB` inherently belongs to `skillup`.
  - `TutorialDB` and `MainDB` are **shared multi-brand databases** serving both SUIA and RTH; without `(tenant_id, brand_local_user_id)`, colliding or shared user IDs cannot be isolated or audited by brand.

---

## Task E — Scalable Identity Synchronization & Failure Recovery (Verified Reality)

1. **Registration (`SignupService`):** Inserts into brand DB (`SkillUpDB` or `RthDB`) with normalized email uniqueness `(LOWER(TRIM(email)))`. Then calls `UserIdentityBridgeService.syncUser({ externalId, externalBrand: brand, email, platform: brand })` -> upserts `PeopleDB.users` keyed by `(platform, external_id)` -> writes `shadow_user_id` back to brand `users` -> grants `platform_access`.
   - **Same-email across brands:** Succeeds once live `PeopleDB` replaces `users_email_unique` with `uniq_users_email_platform`.
   - **Duplicate registration within same brand:** Rejected by brand DB `users_email_unique`.
2. **Current Sync Failure Reality (No Overclaiming):**
   - `SignupService` ([signup.service.ts:108-116](file:///e:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/signup.service.ts#L108-L116)) logs `retryQueued: true` to `audit_logs` on bridge failure, **but there is NO durable background retry queue** for identity bridge sync today.
   - Instead, **subsequent login** (`LoginService.ensureShadowUserId()`) acts as the synchronous self-healing reconciliation path when `user.shadowUserId` is null.
   - `UserIdentityBridgeService.syncUser()` is **idempotent** by `(platform, external_id)` + `platformAccess` check-before-insert, so repeated or interrupted syncs are safe once `uniq_users_email_platform` is live.
3. **First & Subsequent Login / Exam Start / Tutorial Progress (Zero Extra Cross-DB Joins at Scale):**
   - `POST /api/auth/login` reads ONLY the brand DB (plus `PeopleDB` once if `shadow_user_id` is null).
   - `POST /api/quiz/start`, `GET /api/quiz/result`, `POST /api/quiz/submit`, and `TutorialProgress` authorize directly from JWT `(brand -> tenant_id, payload.userId -> brand_local_user_id)` and filter `MainDB` / `TutorialDB` by `(tenant_id, user_id)` — **zero cross-DB user lookups per request**, scaling horizontally to millions of students.
4. **Email Changes & Account Blocking/Deletion:**
   - Email change updates brand DB first, then updates `PeopleDB.users` by `(platform, external_id)` (never by email).
   - Account blocking/deletion (`isBlocked` / `deletedAt`) is checked authoritatively against the brand DB by `validateCurrentLearnerContext` (`auth-context.ts:66-78`), failing closed immediately; `PeopleDB.users.isActive`/`deletedAt` is updated via `(platform, external_id)`.

---

## Unresolved Questions for Owner / Claude Opus Review
1. Should `MainDB.users` keep legacy auth tables (`sessions`, `refresh_tokens`, `user_roles`) for backward compatibility with `getAuthBrandContext('skillhubcore')` tests (`login-01-purpose.test.ts`), or should `'skillhubcore'` be fenced off `BrandAuthTables` completely?
2. For `MainDB` migration `0014_quiet_killraven.sql`, all 7 indexes are absent from `MainDB` `pg_indexes` despite ledger row `id=33`: should `0014` be re-applied cleanly with `CREATE INDEX IF NOT EXISTS` in Phase 5?
3. Should dummy data reset (Section Task C) be executed as an optional clean-slate step before Phase 4 `MainDB` `NOT NULL tenant_id` alignment?

