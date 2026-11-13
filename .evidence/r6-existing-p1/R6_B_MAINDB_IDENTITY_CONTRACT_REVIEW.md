# R6-B MainDB Identity Contract Review (Read-Only)

**Status:** READ-ONLY INVESTIGATION COMPLETE — **OWNER YES/NO DECISION REQUIRED**  
**Scope:** R6-B ONLY (`SHC Admin`, `SUIA`, `RTH`, `@quiz/db`, `@quiz/db-skillup`, `@quiz/db-rth`, `@quiz/db-people`, `@quiz/db-tutorial`, `apps/api-server`, `services/api-gateway`).  
**Constraints Observed:** Zero source edits, zero DDL/migrations executed, zero data backfill, zero fixture writes, zero Git mutations, zero deployments. Database inspection performed via `BEGIN READ ONLY` + `ROLLBACK` against `information_schema` / `pg_indexes` / `pg_type` only; all connection strings redacted to non-secret aliases.

---

## 1. Authoritative Identity Architecture Across SHC Admin, SUIA, and RTH

The live repository and database topology use **five distinct PostgreSQL databases** (verified via non-secret connection fingerprints and `current_database()`):

| Alias | Env Var | `current_database()` | Package | Role in Identity & Domain Persistence |
|---|---|---|---|---|
| **MainDB** | `DATABASE_URL` | `quiz_platform_prod` | `@quiz/db` | Shared quiz/exam engine (`exams`, `reports`, `background_jobs`, etc.) + `defaultDb` fallback in `brand-db.ts`. |
| **SkillUpDB** | `DATABASE_URL_SKILLUP` | `skillup_prod` | `@quiz/db-skillup` | SUIA brand-local learner/staff auth (`users`, `user_profiles`, `roles`, `user_roles`, `refresh_tokens`, `sessions`). |
| **RthDB** | `DATABASE_URL_RTH` | `rth_prod` | `@quiz/db-rth` | RTH brand-local learner/staff auth (`users`, `user_profiles`, `roles`, `user_roles`, `refresh_tokens`, `sessions`). |
| **PeopleDB** | `DATABASE_URL_PEOPLE` | `people_prod` | `@quiz/db-people` | Cross-platform shadow identity (`users` with `external_id`, `external_brand`, `platform`), `platform_access`, `sso_sessions`, `refresh_token_families`, and **SHC Admin** auth (`SHCAuthService`). |
| **TutorialDB** | `DATABASE_URL_TUTORIAL` | `tutorial_prod` | `@quiz/db-tutorial` | Shared tutorial curriculum, `tutorial_progress` (`tenant_id` scoped), `event_outbox` (`tenant_id` scoped). Contains **no `users` table**. |

### Verified Runtime Auth Flows
1. **SUIA (`skillup`) & RTH (`realtutorialhub`) Learners:**
   - `LoginService` (`apps/api-server/src/modules/auth/login.service.ts`) resolves `getAuthBrandContext(brand)` (`apps/api-server/src/modules/auth/brand-db.ts:93-107`) to `@quiz/db-skillup` or `@quiz/db-rth`.
   - `LoginService.ensureShadowUserId()` (`login.service.ts`) calls `UserIdentityBridgeService` (`packages/identity-bridge/src/UserIdentityBridgeService.ts`) to upsert a shadow user in **PeopleDB** (`@quiz/db-people`), grant `platform_access`, and write `shadow_user_id` back to `SkillUpDB.users` or `RthDB.users`.
   - Issued JWTs carry both `userId` / `originalUserId` (brand-local UUID) and `shadowUserId` (PeopleDB UUID).
   - `services/api-gateway/src/middleware/auth.ts:187-198` and `lib/proxy.ts:84-85` forward `X-Shadow-User-ID` and `X-Original-User-ID`.
2. **SHC Admin (`skillhubcore`):**
   - `apps/api-server/src/app/api/shc/auth/login/route.ts:26` and `SHCAuthService` (`apps/api-server/src/modules/auth/shc-auth.service.ts:1,49`) authenticate SHC Admins directly against **PeopleDB** (`@quiz/db-people`).
   - **Code Defect / Routing Contradiction Observed (Read-Only):** In `apps/api-server/src/modules/auth/brand-db.ts:100-103`, the branch `if (brand === 'skillhubcore')` contains the comment `// SkillHub Core uses people_db (unified auth database)` yet returns `defaultDb` (`@quiz/db` -> **MainDB**), **not** `@quiz/db-people`.

---

## 2. Exact Source vs. Database Schema Differences

### A. `@quiz/db` (`packages/db/src/schema/auth.ts:6-32`) vs. Live `MainDB (quiz_platform_prod)`

| Object | Declared in `packages/db/src/schema/auth.ts` | Live `MainDB (quiz_platform_prod)` | Status |
|---|---|---|---|
| `pgEnum('tenant', ...)` | `['realtutorialhub', 'skillup', 'skillhubcore']` (L6) | Absent in `pg_type` | **MISSING IN DB** |
| Core 9 columns | `id`, `email`, `password_hash`, `email_verified`, `is_blocked`, `last_active_at`, `deleted_at`, `created_at`, `updated_at` (L9-17) | Present (exact 9 columns from `0000_cheerful_callisto.sql`) | **MATCH** |
| `shadow_user_id` | `uuid('shadow_user_id')` (L18) | Absent | **MISSING IN DB** |
| `tenant_id` | `tenantEnum('tenant_id')` (L20, `// FND03: Tenant-qualified ownership`) | Absent | **MISSING IN DB** |
| `local_subject_id` | `text('local_subject_id')` (L21) | Absent | **MISSING IN DB** |
| Onboarding 6 columns | `is_onboarded`, `primary_goal`, `domain`, `sub_domain`, `time_commitment`, `journey_status` (L23-28) | Absent | **MISSING IN DB** |
| `idx_users_created_at` | `index("idx_users_created_at").on(t.createdAt)` (L30) | Absent in `pg_indexes` | **MISSING IN DB** |
| `idx_users_tenant_local_subject` | `index("idx_users_tenant_local_subject").on(t.tenantId, t.localSubjectId)` (L31) | Absent in `pg_indexes` | **MISSING IN DB** |
| `users_pkey`, `users_email_unique` | PK on `id`, unique on `email` | Present (`users_pkey`, `users_email_unique`) | **MATCH** |

### B. Migration Provenance in `packages/db/migrations/`
- `0000_cheerful_callisto.sql:89-100` creates `users` with **only the 9 core columns**.
- `0001_fnd03_add_tenant_ownership.sql:1-3` is **not** in `packages/db/migrations/meta/_journal.json` and is a deliberately blocked stub:
  ```sql
  -- BLOCKED: provenance-aware migration and rollout require Sol disposition.
  -- No historical row may be assigned a tenant by default.
  DO $$ BEGIN RAISE EXCEPTION 'FND03 migration blocked pending provenance review'; END $$;
  ```
- **No migration file** in `packages/db/migrations/` adds `shadow_user_id`, `tenant_id`, or `local_subject_id` to `MainDB.users`.
- `0014_quiet_killraven.sql` (`idx_users_created_at`) and `0023_thankful_king_bedlam.sql` (the 6 onboarding columns) **are** tracked in `packages/db/migrations/meta/_journal.json` (`idx: 14` and `idx: 23`), yet are **unapplied** on live `MainDB (quiz_platform_prod)`.

### C. Brand-Local & People DBs (`SkillUpDB`, `RthDB`, `PeopleDB`)
- **`SkillUpDB (skillup_prod)` & `RthDB (rth_prod)`:** Both match `packages/db-skillup/src/schema/users.ts` and `packages/db-rth/src/schema/users.ts`. Both have **16 columns** (9 core + `shadow_user_id` + 6 onboarding columns) and `idx_users_created_at`. Neither declares or has `tenant_id` or `local_subject_id`.
- **`PeopleDB (people_prod)`:** Matches `packages/db-people/src/schema/users.ts` (**12 columns**: `id`, `email`, `password_hash`, `role`, `platform`, `is_active`, `deleted_at`, `version`, `created_at`, `updated_at`, `external_id`, `external_brand`), with `users_email_unique` (`UNIQUE(email)`), `idx_users_email_platform`, and `idx_users_external_id_platform` (`UNIQUE(external_id, platform) WHERE external_id IS NOT NULL`).

---

## 3. Existing Frontend -> BFF -> Backend -> Repository Dependencies on the Three Columns

Recursive production source search across `apps/`, `packages/`, and `services/` (excluding tests, `node_modules`, `.next`, `dist`):

1. **`local_subject_id` / `localSubjectId`:**
   - **0 production references** outside `packages/db/src/schema/auth.ts:21,31`. No frontend, BFF, gateway, service, or repository reads or writes it.
2. **`users.tenant_id` / `users.tenantId`:**
   - **0 production references** to `users.tenantId` outside `packages/db/src/schema/auth.ts:20,31`.
   - All other `tenantId`/`tenant_id` occurrences in the codebase belong to **TutorialDB** (`tutorial_progress`, `event_outbox`), `apps/realtutorialhub-web` worker leases (`worker-lease.ts`), or saga/export metadata (`exam.saga.ts`, `exportEngine.ts`), not `MainDB.users`.
3. **`shadow_user_id` / `shadowUserId`:**
   - **Actively used** across the brand-local auth & gateway stack:
     - `packages/identity-bridge/src/UserIdentityBridgeService.ts` writes `shadowUserId` to `SkillUpDB.users` / `RthDB.users`.
     - `apps/api-server/src/modules/auth/login.service.ts` syncs `shadowUserId` via `getAuthBrandContext(brand)`.
     - `apps/api-server/src/modules/auth/admin-auth.service.ts:54` selects `(brandContext.tables.users as any).shadowUserId`.
     - `services/api-gateway/src/middleware/auth.ts` & `lib/proxy.ts` forward `X-Shadow-User-ID` / `X-Original-User-ID`.
     - `apps/skillhubcore-admin/src/lib/server-page-auth.ts`, `auth-helpers.ts`, `upstream-proxy.ts` carry `shadowUserId` and forward `x-shadow-user-id`.
     - `apps/api-server/src/lib/request-auth.ts:1-8` (`getEffectiveUserId`) reads `x-shadow-user-id`.
   - **Why SQLSTATE `42703` occurs on MainDB:** Any `@quiz/db` Drizzle query that selects full `users` rows (`db.query.users.findFirst(...)`, `db.select().from(users)`, or `insert(users)`) against `MainDB` generates SQL referencing all 18 columns in `packages/db/src/schema/auth.ts` (including `shadow_user_id`, `tenant_id`, `local_subject_id`, and the 6 unapplied onboarding columns), causing PostgreSQL error `42703` (`undefined_column`), as captured in `.evidence/r5-existing-p1/authenticated-http-exam-schema-blocked.json`.

---

## 4. Cross-Brand Identity Isolation, Memberships, and Resource-Ownership Implications

1. **Same-Email Accounts Across SUIA and RTH:**
   - `SkillUpDB` and `RthDB` are separate databases; registering `alice@example.com` in both produces **two distinct `users.id` UUIDs**.
   - In `PeopleDB`, `users_email_unique` (`UNIQUE(email)`) prevents two separate `PeopleDB.users` rows for the same email; `UserIdentityBridgeService` links/grants `platform_access` to one `PeopleDB` shadow UUID.
2. **MainDB Foreign-Key Coupling (`exams` & 22 Other Tables):**
   - Live `MainDB (quiz_platform_prod)` has **23 foreign-key constraints** referencing `public.users(id)`, including `exams.user_id -> public.users(id)` (`exams_user_id_users_id_fk`), `reports.user_id`, `report_jobs.user_id`, `background_jobs.user_id`, `notifications.user_id`, `user_recommendations.user_id`, and `tutor_help_requests.user_id`.
   - When an exam is created (`ExamRepository.createExamWithQuestions` -> `tx.insert(exams).values({ userId })`) or queried (`GET /api/quiz/result` checking `examCheck.userId !== payload.userId`), `payload.userId` is the learner's **brand-local UUID** (`SkillUpDB` or `RthDB`).
   - Because `MainDB.users` has `UNIQUE(email)` (`users_email_unique`) and no `tenant_id` / `local_subject_id`, `MainDB.users` **cannot** hold both a SUIA row and an RTH row for the same email, and a brand-local learner UUID will fail `exams_user_id_users_id_fk` unless a matching row exists in `MainDB.users`.
   - Conversely, if `exams.user_id` were ever switched to `shadowUserId` (`PeopleDB.users.id`) without tenant scoping on `exams`, a single user with accounts on both SUIA and RTH would see their exams shared across brands unless `exams` itself carries/enforces `tenant_id`.

---

## 5. Root Cause Classification

**Classification: (D) Mixed — split across three distinct root causes:**

1. **`tenant_id` & `local_subject_id` on `MainDB.users` -> (A) Unreferenced / Blocked FND03 Draft:**
   - Added to `packages/db/src/schema/auth.ts` (`// FND03: Tenant-qualified ownership`), while `0001_fnd03_add_tenant_ownership.sql` was deliberately blocked (`RAISE EXCEPTION`) and never added to `_journal.json`. Zero production code reads or writes either column on `users`.
2. **`shadow_user_id` on `MainDB.users` -> (C) Belongs to Brand-Local Auth DBs (`SkillUpDB` / `RthDB`) + `PeopleDB` Bridge, with `@quiz/db` Schema Drift:**
   - `SkillUpDB` and `RthDB` both have `shadow_user_id` in their initial migrations and live tables. `MainDB` never had a migration for `shadow_user_id`. However, `brand-db.ts:102` still routes `'skillhubcore'` (and `defaultDb`) to `@quiz/db` (`MainDB`), and `@quiz/db` declares `shadow_user_id` in `schema/auth.ts`.
3. **6 Onboarding Columns (`0023_thankful_king_bedlam.sql`) + `idx_users_created_at` (`0014_quiet_killraven.sql`) -> (B) Tracked Migrations Unapplied to Live `MainDB`:**
   - Both exist in `packages/db/migrations/meta/_journal.json` (`idx: 14`, `idx: 23`) and are applied in `SkillUpDB` and `RthDB`, but have not been applied to `MainDB (quiz_platform_prod)`.

---

## 6. Correction Options, Risks, Unapplied Design, and Required Tests

### Option 1 (Recommended — Cleanest Boundary Alignment): **Remove Unreferenced FND03 Draft Columns from `@quiz/db` `users` OR Scope `@quiz/db` `users` Strictly to Live MainDB + Fix `brand-db.ts` `'skillhubcore'` Routing**
- **Source change (if approved):**
  - Remove unreferenced `tenantId` (`tenantEnum('tenant_id')`), `localSubjectId`, and `idx_users_tenant_local_subject` from `packages/db/src/schema/auth.ts` (and remove `shadowUserId` from `@quiz/db` `users` OR add nullable `shadow_user_id` to `MainDB` if MainDB `users` is retained as a minimal FK stub).
  - Fix `apps/api-server/src/modules/auth/brand-db.ts:100-103` so `'skillhubcore'` routes to `@quiz/db-people` (matching its own comment and `SHCAuthService`) rather than `MainDB`.
  - Separately decide on the tracked-but-unapplied `MainDB` migrations (`0014`, `0023`) under migration provenance governance.
- **Pros:** Eliminates SQLSTATE `42703` immediately without inventing speculative tenant columns on `MainDB.users`; aligns code with actual `PeopleDB`/`SkillUpDB`/`RthDB` architecture; zero backfill risk.
- **Risks / Compatibility:** Does **not** by itself solve how SUIA/RTH learners satisfy `exams_user_id_users_id_fk` in `MainDB` when both brands share an email (`users_email_unique`).

### Option 2: **Apply Additive Nullable Migration to `MainDB.users` (`shadow_user_id`, `tenant_id`, `local_subject_id`, plus tracked `0014`/`0023`)**
- **Unapplied DDL Outline (if approved):**
  - Rehearse and apply `0014_quiet_killraven.sql` and `0023_thankful_king_bedlam.sql`.
  - Add nullable `shadow_user_id uuid`, `tenant` enum + nullable `tenant_id`, nullable `local_subject_id text`, and composite index `idx_users_tenant_local_subject` (`tenant_id, local_subject_id`) — **without** assigning any default tenant to historical rows.
- **Pros:** Makes live `MainDB.users` match `packages/db/src/schema/auth.ts` 1-to-1; unblocks Drizzle queries on `@quiz/db` `users`.
- **Risks / Compatibility:** `MainDB.users` still has `users_email_unique` (`UNIQUE(email)`), so two brand accounts with the same email still cannot both exist in `MainDB.users` unless `users_email_unique` is replaced with a tenant-scoped unique constraint; leaves dead `local_subject_id` column in DB with 0 callers.

### Option 3: **Decouple `MainDB` Domain Tables (`exams`, `reports`, etc.) from `MainDB.users` FK (Longer-Term Architectural Option)**
- **Design Outline:** Introduce `tenant_id` on `exams` (similar to `TutorialDB.tutorial_progress`), replace `MainDB.users` mirroring with `(tenant_id, user_id)` ownership, and retire `MainDB.users` auth tables in favor of `SkillUpDB`/`RthDB`/`PeopleDB`.
- **Risks:** High blast radius across 23 referencing FKs in `MainDB`; requires separate migration & backfill plan.

### Required Verification Tests (Post-Approval Only)
1. `information_schema.columns` & `pg_indexes` parity check verifying zero `42703` errors for `@quiz/db` `users` queries (`findFirst`, `select`, `insert`).
2. `SHC Admin` `brand-db.ts` routing test confirming `'skillhubcore'` never falls back to `MainDB` when `PeopleDB` is expected.
3. Cross-brand same-email exam/resource ownership test verifying SUIA user A and RTH user A (same email, distinct brand UUIDs) cannot read each other's `exams` or collide on `MainDB`.

---

## OWNER YES/NO DECISION REQUIRED

Please approve **one** direction before any source edit or DDL is drafted/executed:
1. **Option 1 (Recommended):** Clean `@quiz/db` `schema/auth.ts` to match the active architecture (remove unreferenced `tenant_id` / `local_subject_id` and align `shadow_user_id` / `brand-db.ts` `'skillhubcore'` -> `PeopleDB`), and separately authorize whether tracked `0014`/`0023` should be applied to `MainDB`? (**YES / NO**)
2. **Option 2:** Keep `tenant_id`, `local_subject_id`, and `shadow_user_id` in `@quiz/db` `schema/auth.ts` and prepare an additive nullable `MainDB` migration (plus `0014`/`0023`)? (**YES / NO**)
3. **Option 3:** Keep current state on HOLD and defer to a broader `MainDB.users` FK decoupling design? (**YES / NO**)

