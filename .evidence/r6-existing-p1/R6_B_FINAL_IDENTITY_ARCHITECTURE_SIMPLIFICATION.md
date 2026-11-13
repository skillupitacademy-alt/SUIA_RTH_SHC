# R6-B Final Identity Architecture Simplification Proposal (Read-Only Design — Revised Post-Claude Review)

**Local Source Baseline:** `main` @ `62f920f4782b8bbb277f88dc27930cd3b86f1b15` (verified via `.git/HEAD` & `.git/refs/heads/main`; owner reports latest GitHub `main` at `bc5a4b1452c6489e18844ac9548923bc69d258c1` for the P0 `exam.observer.ts` fix — not pulled due to read-only no-Git restriction; re-confirm cited paths at `bc5a4b14` before implementation).  
**Status:** READ-ONLY DESIGN & VERIFICATION ONLY — **NO CODE, DDL, MIGRATION, RESET, GIT, OR DEPLOYMENT EXECUTED**  
**Governing Standard:** PSEG-001 + FND03 Tenant-Qualified Ownership + Owner Business Rules (1–9) + Independent Review Amendments (`F1`–`F10`)  
**Active Holds:** Attendance, payments, Marketing, and broader accessibility/performance remain **OWNER HOLD**.

---

## Executive Summary & Target Identity Model (Two Explicit Identifiers)

Per Independent Review Amendment **F1**, the target architecture explicitly distinguishes **two** non-interchangeable student identifiers:

1. **Learner Subject (for MainDB & TutorialDB student-owned educational records):**
   $$\text{Learner Subject} = (\text{verified } \texttt{tenant\_id},\ \texttt{brand\_local\_user\_id})$$
   - `tenant_id` is derived exclusively from the verified JWT `brand` (`'skillup'` | `'realtutorialhub'`), never from request headers or body.
   - `brand_local_user_id` is `SkillUpDB.users.id` or `RthDB.users.id`.
2. **PeopleDB Person ID (for PeopleDB operational records, SSO/session families & SHC Admin):**
   $$\text{PeopleDB Person ID} = \texttt{shadowUserId}\ (\texttt{PeopleDB.users.id})$$
   - Used **only** for PeopleDB-owned tables (`platform_access`, `sso_sessions`, `refresh_token_families`, `batch_enrollments`, `payment_installments`, `attendance_records`, `admissions`, `subscriptions`) and **SHC Admin** auth (`SHCAuthService`).
   - `apps/skillup-web/src/lib/student-auth.ts` (`requireStudentAuth`) currently overloads `userId` with `shadowUserId` while RTH (`assignment-auth.test.ts`), `api-server` (`/api/quiz/*`), and SUIA `/api/tutorial/progress` use `payload.userId` (`brand_local_user_id`). Phase 1 splits SUIA's helper return contract into explicit `learnerUserId` and `peoplePersonId` fields and corrects the inverted fixture in `student-auth.test.ts`.

- **SUIA (`SkillUpDB`)** and **RTH (`RthDB`)** remain completely independent account authorities. Same-email accounts in SUIA and RTH never merge.
- **PeopleDB (`people_prod`)** retains `users.id` internally (Option A) and links brand students via `(platform, external_id)`, replacing live `users_email_unique` with `uniq_users_email_platform` **only after** all email-based `PeopleDB` lookups (notably `services/skillhubcore-service` `DrizzleUserRepository.findByEmail()` / `loginAdmin()`) are platform-scoped (**F2**).
- **MainDB (`quiz_platform_prod`)** adopts direct tenant-qualified ownership `(tenant_id, user_id)` with `CHECK (tenant_id IN ('skillup', 'realtutorialhub'))` (**F6**) on student-owned shared educational tables, with deterministic `tenant_id` backfill (no dummy-data reset required, **F5**).
- **TutorialDB (`tutorial_prod`)** preserves the 12 November 2026 `tutorial_progress.tenant_id` implementation (`(tenant_id, user_id, subtopic_id)` + existing `CHECK`) untouched.

---

## Task A — Complete Current Identity Inventory (All 5 Databases)

Verified against `packages/db*` source and live PostgreSQL catalogs (`BEGIN READ ONLY` + `ROLLBACK`):

| DB Alias (`current_database()`) | Table | PK & Key Indexes/Constraints | Tenant / Platform Column | ID Semantics | Live Rows (Dev/Dummy) | Source vs. Live Drift & Classification |
|---|---|---|---|---|---|---|
| **SkillUpDB** (`skillup_prod`) | `users` | PK `id`; `UNIQUE(email)` (`users_email_unique`) | Implicit (`skillup` DB) | **Brand-local UUID** + `shadow_user_id` | 46 (`45` bridged, `1` unbridged) | **Matches** `@quiz/db-skillup` (16 cols). **Necessary** account authority. |
| **SkillUpDB** (`skillup_prod`) | `user_profiles`, `roles`, `user_roles`, `refresh_tokens`, `sessions`, `audit_logs`, `login_attempts`, `password_reset_tokens`, `verification_tokens` | FK `user_id -> users.id` (8 FKs) | Implicit (`skillup` DB) | Brand-local UUID | `roles`: 6, `user_roles`: 7, `refresh_tokens`: 2264 | **Matches** source. **Necessary**; `roles` & admin `user_roles` must be preserved. |
| **RthDB** (`rth_prod`) | `users` | PK `id`; `UNIQUE(email)` (`users_email_unique`) | Implicit (`rth` DB) | **Brand-local UUID** + `shadow_user_id` | 103 (`101` bridged, `2` unbridged) | **Matches** `@quiz/db-rth` (16 cols). **Necessary** account authority. |
| **RthDB** (`rth_prod`) | Same 9 child tables | FK `user_id -> users.id` (8 FKs) | Implicit (`rth` DB) | Brand-local UUID | `roles`: 6, `user_roles`: 9, `refresh_tokens`: 2663 | **Matches** source. **Necessary**; `roles` & admin `user_roles` must be preserved. |
| **PeopleDB** (`people_prod`) | `users` | PK `id`; **LIVE:** `users_email_unique` (`UNIQUE(email)`), non-unique `idx_users_email_platform`, unique `idx_users_external_id_platform` | `platform` (`people_platform`) + `external_brand` | **PeopleDB internal UUID**; links `(platform, external_id)` | 319 (`217` skillup student, `99` rth student, `2` rth admin/super_admin, **`1` shc super_admin**) | **DRIFT:** Source (`packages/db-people/src/schema/users.ts:23`) declares `uniq_users_email_platform` on `(LOWER(TRIM(email)), platform)`, NOT global `users_email_unique`. **0** active `(normalized email, platform)` duplicates exist today. |
| **PeopleDB** (`people_prod`) | `platform_access`, `sso_sessions`, `refresh_token_families`, `user_profiles`, `admissions`, `enquiries`, `batches`, `batch_enrollments`, `subscriptions`, `faculty`, `attendance_records` | 15 FKs referencing `PeopleDB.users(id)` | `platform` on `platform_access`, `sso_sessions`, `refresh_token_families` | PeopleDB internal UUID | `platform_access`: 148, `sso_sessions`: 40, `admissions`: 170, `enquiries`: 283, `batches`: 115 | **Necessary** internal FKs for PeopleDB & SHC Admin. `attendance_records` (4) is HOLD. |
| **MainDB** (`quiz_platform_prod`) | `users` | PK `id`; `UNIQUE(email)` (`users_email_unique`) | **LIVE:** None. **SOURCE:** `tenant_id`, `local_subject_id`, `shadow_user_id`, 6 onboarding cols | **Same-UUID mirror of brand-local IDs** (`13/19` rows match SkillUp/RTH UUID+email) + `6` MainDB-only rows (**F4**) | 19 (`roles`: 7, `user_roles`: 24) | **DRIFT:** Live has **9 cols** (`0000`); source (`packages/db/src/schema/auth.ts`) declares **18 cols**. `0014` is in `drizzle.__drizzle_migrations` (`id=33`) yet **0/7 indexes** exist in `pg_indexes`. `0023` is unapplied. `DrizzleAdminUserRepository.create()` (`146-175`) risks `42703` on `.returning()`/`findFirst`. |
| **MainDB** (`quiz_platform_prod`) | Student/job/report tables: `exams`, `idempotency_keys`, `reports`, `report_jobs`, `background_jobs`, `notifications`, `notes_access_logs`, `notes_delivery_locks`, `user_recommendations`, `tutor_help_requests` | 10 FKs referencing `MainDB.users(id)`; `idempotency_keys` has `unq_user_key (user_id, key)` | **None** in DB (in-memory `tenantId` in `exam.saga.ts` / `exportEngine.ts`) | Brand-local UUID (`exams`: `3` SkillUp + `6` RTH, `9/9` in `MainDB.users`) | `exams`: 9, `reports`: 4, `background_jobs`: 73 | **UNRESOLVED OWNERSHIP DEFECT:** New brand learners have no `MainDB.users` row (FK failure on `quiz/start`); mirroring collides on `users_email_unique` for same-email SUIA+RTH learners. |
| **MainDB** (`quiz_platform_prod`) | Auth & Ops tables: `user_profiles`, `roles`, `user_roles`, `sessions`, `refresh_tokens`, `login_attempts`, `password_reset_tokens`, `verification_tokens`, `audit_logs`, `automation_*` | 13 FKs referencing `MainDB.users(id)` | None | MainDB UUID | `audit_logs`: 4855, `refresh_tokens`: 1693, `automation_feature_flags`: 1, `automation_policies`: 1 | Legacy MainDB auth tables + operational/config tables (`automation_*`, `audit_logs`). |
| **TutorialDB** (`tutorial_prod`) | `tutorial_progress`, `event_outbox` (source), `domains`/`subjects`/`topics`/`subtopics` | `uq_tutorial_progress_tenant_user_subtopic (tenant_id, user_id, subtopic_id)` | `tenant_id` (`CHECK IN ('skillup','realtutorialhub','skillhubcore')`) | `(verified tenant_id, brand_local_user_id)` | `tutorial_progress`: 0, `domains`: 8, `subjects`: 14, `topics`: 10, `subtopics`: 7 | **ALIGNED & APPROVED (12 Nov 2026). PRESERVE.** (`event_outbox` `0030` not yet executed in live `TutorialDB`). |

### Cross-DB Identity Intersection Evidence (**F3**, **F4**, **F9** — Verified Read-Only)
- **Zero overlap** between `SkillUpDB.users.id` and `RthDB.users.id` (`0`).
- **2** normalized emails exist in both `SkillUpDB` and `RthDB`; in **both** pairs, exactly one brand side lacks `shadow_user_id` (`1` SkillUp, `1` RTH), corroborating the live `users_email_unique` (`23505`) bridge failure.
- Where `shadow_user_id` is populated (`45/46` SkillUp, `101/103` RTH), **100%** resolve to `PeopleDB` with matching `(platform, external_id)` (`0` dangling).
- **ID-space overlap hazard (F9):** `2` `RthDB.users.id` values equal `PeopleDB.users.id`, and `6/9` `MainDB.exams` are owned by IDs present in `PeopleDB`. Phase 6 tests must use `userId !== shadowUserId` fixtures so ID confusion cannot pass accidentally.

---

## Task B — Simplify `PeopleDB` Identity (Option A vs. Option B)

| Dimension | **Option A (Recommended): Retain `PeopleDB.users.id` Internally; Two Explicit App-Facing Identifiers** | **Option B: Remove Brand-Side `shadowUserId` Dependencies & Rewrite PeopleDB Consumers** |
|---|---|---|
| **PeopleDB PK & FKs** | Keeps `PeopleDB.users.id` UUID PK and all 15 child FKs (`platform_access`, `sso_sessions`, `refresh_token_families`, `batch_enrollments`, `payment_installments`, etc.) intact. | Requires rewriting 15 FKs + `services/skillhubcore-service` + SUIA operational queries (`skillup-data.ts`) to composite `(platform, external_id)`. |
| **Learner-facing shared services (`exams`, `tutorial_progress`)** | Uses **Learner Subject** `(verified tenant_id, brand_local_user_id)` exclusively. | Same, but couples it to high-risk PeopleDB FK churn. |
| **SHC Admin & `services/skillhubcore-service`** | **Unbroken** once `DrizzleUserRepository.findByEmail()` / `loginAdmin()` is platform-scoped (**F2**). | High blast radius across `auth.service.ts:198`, `token-validator.service.ts`, `auth.routes.ts`. |
| **SUIA BFF (`student-auth.ts`)** | Returns explicit `learnerUserId` (`payload.userId`) and `peoplePersonId` (`payload.shadowUserId ?? payload.userId`), eliminating the overloaded `userId` bug (**F1**). | Requires rewriting SUIA PeopleDB queries (`skillup-data.ts`). |

**Recommendation:** **Adopt Option A** with **F1** (explicit `learnerUserId` vs `peoplePersonId` in `student-auth.ts`) and **F2** (platform-scope all email-based `PeopleDB` lookups + normalize email on write **before** replacing `users_email_unique`).

---

## Task C — Simplify `MainDB` Exam Ownership & 23-FK Writer Inventory (**F5**, **F6**, **F10**)

### Verified Writer Inventory for the 10 Non-Auth/Non-Ops `MainDB` Tables (**F10**)
1. **Strictly Learner-Owned Tables (`CHECK (tenant_id IN ('skillup', 'realtutorialhub'))`, Drop `-> MainDB.users(id)` FK):**
   - `exams`: `ExamRepository.createExamWithQuestions` (`payload.userId`).
   - `idempotency_keys`: `ExamRepository` / `exam.engine.ts` (`payload.userId`); live `unq_user_key (user_id, key)` must become `(tenant_id, user_id, key)`.
   - `reports`: `report-repository.ts` (tied to `exams`).
   - `report_jobs`: `ReportJobService.ts` (tied to exam report generation).
   - `user_recommendations`, `notes_delivery_locks`, `notes_access_logs`, `tutor_help_requests`: `TutorService`, `email.worker.ts`, `tutor/notes/view`, `tutor/help/request`.
   - `notifications`: written by `TutorService`, `adaptive-tutor.service.ts`, `tutor/help/request`, and `admin/tutor/help/list/route.ts:144` (which targets `existing.userId`, the student who requested help).
2. **Mixed/Potential Non-Student Writer Verification Needed (`background_jobs`):**
   - `JobsService.createJob()` (`apps/api-server/src/modules/system/jobs.service.ts:39-46`) takes `dto.userId`. If any admin or export caller passes an admin principal rather than a learner, `tenant_id` on `background_jobs` must either allow `'skillhubcore'` / nullable `tenant_id` for admin jobs or enforce student-only callers before tightening `NOT NULL`.
3. **Retention / Deletion Replacement for `ON DELETE CASCADE`:**
   - Dropping `-> MainDB.users(id)` FKs removes automatic `ON DELETE CASCADE`. Account-deletion / retention flows (`retention.service.ts`) must explicitly delete/anonymize by `(tenant_id, user_id)` across these tables.
4. **Legacy MainDB Auth (7 FKs) & Operational/Config (5 FKs):** Keep intact on `MainDB.users`.

### Deterministic Backfill vs. Dummy-Data Reset (**F5**)
- Because `SkillUpDB` and `RthDB` share **0** UUIDs and all `9` existing `MainDB.exams` resolve unambiguously (`3` SkillUp, `6` RTH), **`tenant_id` can be backfilled deterministically without any dummy-data reset**. Phase 4A reset is **optional (recommended NO)**.
- If a reset is ever separately authorized, preserve: `PeopleDB` `skillhubcore` `super_admin` (`1`) & RTH admins (`2`), all `roles` (`MainDB` `7`, `SkillUpDB` `6`, `RthDB` `6`), academic hierarchies (`MainDB` + `TutorialDB`), `automation_feature_flags`/`automation_policies`, and `drizzle.__drizzle_migrations`.

---

## Task D & Task E — Preserved `TutorialDB`, Sync Scaling, and Test-Boundary Caveats (**F8**)

- **TutorialDB Preserved:** `tutorial_progress.tenant_id`, `uq_tutorial_progress_tenant_user_subtopic`, `TutorialProgressRepository`, and `HierarchySyncService` remain untouched (including existing `TutorialDB` `CHECK` with `'skillhubcore'`).
- **Sync & Failure Recovery Reality:** `SignupService` logs `retryQueued: true` on bridge failure, **but no durable background retry queue exists**; subsequent login (`LoginService.ensureShadowUserId()`) performs self-healing reconciliation.
- **Test-Environment Caveat (F8):** `shouldUseBrandBinding()` (`brand-db.ts:109-111`) returns `false` under Vitest (`NODE_ENV === 'test' || VITEST === 'true'`), falling back to `MainDB` tables and masking brand-DB / `42703` / `23505` bugs. Every DB-affecting phase (Phases 2–5) requires an isolated, run-owned DB integration check + `information_schema` parity verification (under separate DB-test approval), not unit tests alone.
