# MainDB Identity Contract Read-Only Options (R6-B Companion)

See the full read-only investigation in [R6_B_MAINDB_IDENTITY_CONTRACT_REVIEW.md](./R6_B_MAINDB_IDENTITY_CONTRACT_REVIEW.md).

## Summary of Verified Findings
- **MainDB (`DATABASE_URL`, `quiz_platform_prod`)** `public.users` has **9 core columns** (`id`, `email`, `password_hash`, `email_verified`, `is_blocked`, `last_active_at`, `deleted_at`, `created_at`, `updated_at`) and **2 indexes** (`users_pkey`, `users_email_unique`).
- **`packages/db/src/schema/auth.ts`** declares **18 columns** (adding `shadow_user_id`, `tenant_id`, `local_subject_id`, plus 6 onboarding columns from tracked-but-unapplied `0023_thankful_king_bedlam.sql`) and `idx_users_created_at` (from `0014_quiet_killraven.sql`) + `idx_users_tenant_local_subject`.
- **`local_subject_id`** and **`users.tenant_id`** have **0 production callers**; `0001_fnd03_add_tenant_ownership.sql` is a blocked stub outside `_journal.json`.
- **`shadow_user_id`** is actively used in **`SkillUpDB` (`skillup_prod`)**, **`RthDB` (`rth_prod`)**, **`PeopleDB` (`people_prod`)**, `services/api-gateway`, and `apps/skillhubcore-admin`.
- **`apps/api-server/src/modules/auth/brand-db.ts:100-103`** routes `'skillhubcore'` to `defaultDb` (`MainDB`) despite its comment stating `people_db`, while `SHCAuthService` uses `@quiz/db-people`.
- **23 foreign keys** in `MainDB` (including `exams.user_id`) reference `MainDB.public.users(id)`, which enforces global `UNIQUE(email)`.

## Decision Options Requiring Owner YES/NO Approval
1. **Option 1 (Recommended):** Align `@quiz/db` `schema/auth.ts` with active architecture (remove unreferenced `tenant_id` / `local_subject_id`, resolve `shadow_user_id` placement, fix `brand-db.ts` `'skillhubcore'` -> `PeopleDB`), and decide separately on `0014`/`0023`.
2. **Option 2:** Retain all declared columns in `packages/db/src/schema/auth.ts` and prepare an additive nullable migration for `MainDB` (plus `0014`/`0023`).
3. **Option 3:** Defer to a broader decoupling of `MainDB` domain FKs (`exams.user_id`, etc.) from `MainDB.users`.

