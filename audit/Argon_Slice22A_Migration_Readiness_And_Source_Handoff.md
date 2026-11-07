# Argon Slice 22-A — UAT PostgreSQL Migration Readiness, Schema/Journal Registration, and Source-Evidence Handoff

- **Author Role**: `Argon` (Production Implementation Owner — `Gemini 4 Argon (Medium)`)
- **Repository**: `E:\onlinewebsites\quiz-platform` (`skillupitacademy-alt/SUIA_RTH_SHC`)
- **Branch**: `remediation/w1-2-batch-05-targeted`
- **Governing Sol Review Commit (Parent Baseline)**: `05f407488600c09593062f27402bb63ebcfbe8eb` (`05f40748`)
- **Frozen Slice 21 `SOURCE_SHA`**: `d5f58b18fba226da69af3408db544ef356f75fb9` (`d5f58b18`)
- **Preserved Accepted Baselines**:
  - Slice 19 (`f6627115a8a2f9dacf12bc4d711aecf3677c11ee` / `f6627115`) — untouched
  - Slice 20 Q1/Q2 (`dc75ace5286d2b0f0da97a8d3e9406f809dec46a` / `5614579187bfd28b36e770d2739e61037eb3da74`, accepted at `e828ce2a`) — untouched
- **Physical DDL Execution Status**: **`NOT_EXECUTED` (Gated pending Sol & Environment Owner approval)**
- **Governance Status**: `W1–W3 PARTIAL_ACCEPTANCE` | `W4 implementation NOT APPROVED`

---

## 1. Priority 1 — UAT PostgreSQL Target Identity & Read-Only Preflight Fingerprint (`S22-A`)

Using the approved read-only preflight recipe (`BEGIN READ ONLY; ... ROLLBACK;`) in `audit/Sol_Slice21_UAT_Migration_Preparation_4692afaa.md`, Argon inspected the three configured UAT Neon PostgreSQL 17.11 targets without executing any DDL or data mutation and without exposing credentials:

| Environment Variable / Package | Redacted Host & Database Identity | Target Fingerprint (`sha256(host/db)[0..11]`) | PostgreSQL Version | Current User / Schema | `gen_random_uuid()` Probe |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PEOPLE_DATABASE_URL` (`@quiz/db-people`) | `ep-young-w....ap-southeast-1.aws.neon.tech/people_prod` | `1afab5e2e8e6` | `PostgreSQL 17.11 (bdd1736) on aarch64-unknown-linux-gnu` | `neondb_owner` / `public` | `OK` (native PG 17 builtin) |
| `TUTORIAL_DATABASE_URL` (`@quiz/db-tutorial`) | `ep-young-w....ap-southeast-1.aws.neon.tech/tutorial_prod` | `d69fe9af7c33` | `PostgreSQL 17.11 (bdd1736) on aarch64-unknown-linux-gnu` | `neondb_owner` / `public` | `OK` (native PG 17 builtin) |
| `DATABASE_URL` (`@quiz/db`) | `ep-young-w....ap-southeast-1.aws.neon.tech/quiz_platform_prod` | `9d14dee0e309` | `PostgreSQL 17.11 (bdd1736) on aarch64-unknown-linux-gnu` | `neondb_owner` / `public` | `OK` (native PG 17 builtin) |

### 1.1 Live Schema & Dependency Inspection Results

1. **`people_prod` (`1afab5e2e8e6`, `@quiz/db-people`)**:
   - **Existing public tables (14)**: `admissions`, `attendance_records`, `auth_audit_log`, `batch_enrollments`, `batch_sessions`, `batches`, `enquiries`, `faculty`, `payment_installments`, `payments`, `placements`, `subscriptions`, `user_feature_overrides`, `users`.
   - **Target table check**: `to_regclass('public.student_invitations')` = `null` (not yet created).
   - **Foreign-key parent table (`public.users`)**:
     - `users.id`: `uuid NOT NULL DEFAULT gen_random_uuid()`, primary key constraint `users_pkey PRIMARY KEY (id)`.
     - `users.email`: `text NOT NULL`, unique constraint `users_email_unique UNIQUE (email)`.
     - `users.platform`: `USER-DEFINED` enum `udt_name = "people_platform"`.
   - **Enum values in `people_prod`**:
     - `people_platform`: `'realtutorialhub'`, `'skillup'`, `'both'`, `'skillhubcore'`
     - `people_user_role`: `'student'`, `'faculty'`, `'admin'`, `'super_admin'`
   - **Critical DDL Defect Discovered & Resolved in Slice 22-A**:
     - `packages/db-people/src/schema/enums.ts` defines `export const platformEnum = pgEnum('people_platform', ['realtutorialhub', 'skillup'])`, and `people_prod` has enum type `"people_platform"` (there is no type named `"platform"` in `pg_type`).
     - However, `packages/db-people/migrations/0009_student_invitations.sql` line 9 previously specified `"platform" "platform" DEFAULT 'skillup' NOT NULL`. Had that SQL been executed against `people_prod`, PostgreSQL would have aborted with `ERROR: type "platform" does not exist`.
     - **Resolution**: Updated `packages/db-people/migrations/0009_student_invitations.sql` line 9 to `"platform" "people_platform" DEFAULT 'skillup' NOT NULL`, matching `packages/db-people/src/schema/student-invitations.ts` and the live `people_prod` enum type.

2. **`tutorial_prod` (`d69fe9af7c33`, `@quiz/db-tutorial`)**:
   - **Existing public tables (33)**: `ab_test_experiments`, `adaptive_paths`, `ai_tutor_conversations`, `analytics_events`, `assignment_help_requests`, `assignment_submissions`, `assignments`, `block_learning_states`, `block_telemetry_events`, `certificates`, `code_playgrounds`, `content_deployments`, `content_generation_jobs`, `content_review_queue`, `domain_content_config`, `educational_architectures`, `interview_questions`, `learning_analytics`, `page_navigation_progress`, `project_submissions`, `projects`, `prompt_templates`, `quality_audit_log`, `remediation_plans`, `session_requests`, `subtopic_summaries`, `topic_simulations`, `tutorial_navigation_progress`, `tutorial_page_content_v2`, `tutorial_progress`, `tutorial_sections`, `tutorial_sidebar_trees_v2`, `user_interactions`.
   - **Target table check**: `to_regclass('public.event_outbox')` = `null`; `to_regclass('public.tutorial_event_outbox')` = `null`.
   - **`tutorial_progress` schema verification**: Has `tenant_id` (`varchar(50) NOT NULL DEFAULT 'realtutorialhub'`), `version` (`integer NOT NULL DEFAULT 1`), and unique index `uq_tutorial_progress_user_subtopic_tenant (user_id, subtopic_id, tenant_id)` applied from migration `0028_public_multiple_man`.

3. **`quiz_platform_prod` (`9d14dee0e309`, `@quiz/db`)**:
   - **Existing public tables (17)**: `admins`, `audit_logs`, `domains`, `exam_answers`, `exam_reports`, `exam_results`, `exam_Security_events`, `exam_sessions`, `exports`, `Hierarchy_validations`, `question_skills`, `questions`, `skills`, `subjects`, `subtopics`, `topic_skills`, `topics`.
   - **Export provenance columns (`0003_loving_multiple_man.sql`)**: Already applied in `drizzle.__drizzle_migrations` (`id = 4`, `created_at = 1775000000000`, `hash = 212f8be4c772e96a734b1e83bc8b67b1fd6766e31846b80e95ed702b7b134da6`).

---

## 2. Applied Migration Ledger vs. Drizzle `_journal.json` Reconciliation

### 2.1 `@quiz/db-people` (`people_prod` vs `packages/db-people/migrations/meta/_journal.json`)

All 9 applied rows in `people_prod.drizzle.__drizzle_migrations` match `idx: 0..8` in `packages/db-people/migrations/meta/_journal.json`:

| Journal `idx` | Tag | Journal `when` / DB `created_at` | DB Row `id` | SHA-256 `hash` (Verified Match) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | `0000_perpetual_microbe` | `1774191220131` | `1` | `8c18ba9e8aa5bfeb1f5460770878a521f8c316e7e3819f6ab836773f3315faee` | Applied |
| `1` | `0001_abnormal_gamma_corps` | `1774536900897` | `2` | `6f6cc36b55db20b151e3418f38ba8009eb6042a3fc98b065210ed3c92dc8f6e8` | Applied |
| `2` | `0002_low_captain_midlands` | `1774537191952` | `3` | `d2fbff4572198a363c7fc58c28d7023c6c0b7a6897f93310eb32eb8eb3706716` | Applied |
| `3` | `0003_massive_kitty_pryde` | `1774538285178` | `25` | `c914d12d756757761f8459e168dc8bc0e4ba1d73da1a3a9d636e82b47c87886d` | Applied |
| `4` | `0004_amusing_kang` | `1774541869102` | `26` | `5da20d365a86464589d60df6349746f5c91f4062f01809e55e2e5c1b8a77b511` | Applied |
| `5` | `0005_people_perf_indexes` | `1774550945793` | `27` | `a2ab7838a3dc1e58d2bf0ca5b58359ecfb9a2f7e8a9c5a9717c8d6a6c11be977` | Applied |
| `6` | `0006_skillhubcore_subscription_schema` | `1774591239501` | `29` | `681d4f60949c7bc095b31a512a024542038910e9e904d81a4bd0743f09c3b833` | Applied |
| `7` | `0007_long_sentinels` | `1774935418558` | `30` | `8f9d8c7fb316c0861175f9f635dc32e4a761fd9d79248e664b5b34ef03b57f24` | Applied |
| `8` | `0008_common_zodiak` | `1774938098054` | `31` | `bb0f642c79d6c2c3448c8a28c7442be3a9a1801fbef3aa9d927622fd40886fb7` | Applied (Latest in DB) |
| **`9`** | **`0009_student_invitations`** | **`1791600000000`** | *(Pending)* | **`dc8452f27c575868d4957172697b6c032a11b35b545bdf60ad144288f608d4f0`** | **Registered in Slice 22-A (Pending Gate P1)** |

-Because `1791600000000 > 1774938098054`, Drizzle's migrator (`Number(lastDbMigration[0].created_at) < migration.folderMillis`) will execute **only** `0009_student_invitations.sql` when authorized.
- Created `packages/db-people/migrations/meta/0009_snapshot.json` (`id: 9b4e18f2-4c21-4d88-901a-75d34c910009`, `prevId: 761b0de1-781d-4a12-ae17-3377f27b9246`) extending `0008_snapshot.json` with `public.student_invitations`.

### 2.2 `@quiz/db-tutorial` (`tutorial_prod` vs `packages/db-tutorial/migrations/meta/_journal.json`)

- `tutorial_prod.drizzle.__drizzle_migrations` has 22 rows ending at `id = 30`, `created_at = 1791510064024`, `hash = d2533a4af26d3d16f85463842815ef090bebff2d76334280aa32d8759ae009dd`, which matches `idx: 28` (`0028_public_multiple_man`, `when: 1791510064024`) in `packages/db-tutorial/migrations/meta/_journal.json`.
- **Resolution of `0015_` Collision & `0029_` Guard**:
  - `idx: 15` in `packages/db-tutorial/migrations/meta/_journal.json` is already occupied by `0015_backfill_summary_interview_ai_tutor_sections` (`when: 1778315289543`, applied in `tutorial_prod` as `id = 17`).
  - `packages/db-tutorial/migrations/0029_fnd03_add_tenant_to_progress.sql` is an intentional fail-closed guard (`RAISE EXCEPTION 'FND03 migration blocked pending provenance review'`) referenced by `tools/ai-context/config.json` and `tools/ai-context/context-cli.mjs`. It must remain unregistered in `_journal.json` and must never be executed.
  - Therefore, Argon renamed `packages/db-tutorial/migrations/0015_event_outbox.sql` to `packages/db-tutorial/migrations/0030_event_outbox.sql` (`git mv`) and registered `0030_event_outbox` at `idx: 29` (`when: 1791600001000 > 1791510064024`) in `packages/db-tutorial/migrations/meta/_journal.json`.
  - Because Drizzle's `readMigrationFiles()` reads only entries listed in `meta/_journal.json` and filters by `folderMillis > Number(lastDbMigration.created_at)`, registering `0030_event_outbox` at `idx: 29` (`when: 1791600001000`) causes Drizzle to execute **only** `0030_event_outbox.sql` while completely skipping the unregistered `0029_fnd03_add_tenant_to_progress.sql`.

---

## 3. Exact Migration SQL, Checksums, and Additive Compatibility Analysis

| Package / Target DB | Migration File Path | Journal `idx` / `when` | SHA-256 Checksum (LF, lowercase / uppercase) | Additive / Non-Destructive? |
| :--- | :--- | :--- | :--- | :--- |
| `@quiz/db-people` (`people_prod`) | `packages/db-people/migrations/0009_student_invitations.sql` | `idx: 9` / `1791600000000` | `dc8452f27c575868d4957172697b6c032a11b35b545bdf60ad144288f608d4f0`<br>`DC8452F27C575868D4957172697B6C032A11B35B545BDF60AD144288F608D4F0` | **Yes** — Creates new table `student_invitations` + 2 indexes; zero existing tables or rows altered. |
| `@quiz/db-tutorial` (`tutorial_prod`) | `packages/db-tutorial/migrations/0030_event_outbox.sql` | `idx: 29` / `1791600001000` | `987cee980101b7515b846d56c99f5e244f84a634d6316b6c1196ed8b9fbe5d29`<br>`987CEE980101B7515B846D56C99F5E244F84A634D6316B6C1196ED8B9FBE5D29` | **Yes** — Creates new table `event_outbox` + 3 indexes; zero existing tables or rows altered. |

### 3.1 Exact Contents of `packages/db-people/migrations/0009_student_invitations.sql`

```sql
-- Offline migration artifact: 0009_student_invitations.sql
-- Purpose: Durable student invitation ledger for single-use expiring token provisioning and atomic account activation (Sol S3 / TC08 / FND11 / FND16).
-- Do NOT execute against live database without authorized physical migration gate.

CREATE TABLE IF NOT EXISTS "student_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "platform" "people_platform" DEFAULT 'skillup' NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "claim_owner_token" varchar(120),
  "claim_expires_at" timestamp,
  "issued_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "redeemed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_invitations_token_hash_unq"
  ON "student_invitations" ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_invitations_user_platform_status_idx"
  ON "student_invitations" ("user_id", "platform", "status");
```

### 3.2 Exact Contents of `packages/db-tutorial/migrations/0030_event_outbox.sql`

```sql
-- Offline migration artifact: 0030_event_outbox.sql
-- Purpose: Durable transactional outbox / publication-intent ledger for worker downstream event recovery (Sol A2 / L3 / D7).
-- Do NOT execute against live database without authorized physical migration gate.

CREATE TABLE IF NOT EXISTS "event_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar(50) NOT NULL,
  "event_type" varchar(120) NOT NULL,
  "event_id" uuid NOT NULL,
  "aggregate_id" varchar(180) NOT NULL,
  "payload" jsonb NOT NULL,
  "envelope" jsonb,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "owner_token" varchar(120),
  "lease_expires_at" timestamp,
  "last_error" text,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_outbox_tenant_event_aggregate_unq"
  ON "event_outbox" ("tenant_id", "event_type", "aggregate_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_outbox_event_id_unq"
  ON "event_outbox" ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_outbox_status_idx"
  ON "event_outbox" ("tenant_id", "status", "created_at");
```

---

## 4. Backup, Neon Branch Snapshot & Rollback / Recovery Plan

### 4.1 Pre-Execution Backup / Recovery Point (Mandatory Before Any DDL)

1. **Neon Instant Recovery Branch / Snapshot**:
   - Record the current PostgreSQL WAL LSN and timestamp on both databases before any DDL:
     ```sql
     SELECT current_database(), pg_current_wal_lsn() AS pre_migration_lsn, now() AS pre_migration_ts;
     ```
   - Create a Neon recovery branch (or confirm Neon PITR window covers the current LSN) in the Neon project hosting `ep-young-w....ap-southeast-1.aws.neon.tech` (`people_prod` and `tutorial_prod`) named `backup/pre-slice22-ddl-20261107`.
2. **Pre-Migration Ledger Snapshot**:
   - Export the existing rows of `drizzle.__drizzle_migrations` from `people_prod` (9 rows, max `id = 31`, `created_at = 1774938098054`) and `tutorial_prod` (22 rows, max `id = 30`, `created_at = 1791510064024`).

### 4.2 Transactional Dry-Run Recipe (Zero Persistent Change)

Before committing any DDL, execute a transactional dry-run on each target that verifies table creation, index creation, and FK constraint resolution and then rolls back:

```sql
-- Dry-run on people_prod (1afab5e2e8e6):
BEGIN;
-- execute 0009_student_invitations.sql statements
SELECT to_regclass('public.student_invitations'), to_regclass('public.student_invitations_token_hash_unq');
ROLLBACK;

-- Dry-run on tutorial_prod (d69fe9af7c33):
BEGIN;
-- execute 0030_event_outbox.sql statements
SELECT to_regclass('public.event_outbox'), to_regclass('public.event_outbox_event_id_unq');
ROLLBACK;
```

### 4.3 Authorized Transactional Apply Recipe (Order of Execution)

Once Sol and the environment owner approve physical migration execution:

1. **Step 1 — Apply `0009_student_invitations.sql` on `people_prod` (`1afab5e2e8e6`)**:
   ```sql
   BEGIN;
   -- 1. Execute packages/db-people/migrations/0009_student_invitations.sql
   -- 2. Record migration in drizzle.__drizzle_migrations:
   INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
   VALUES ('dc8452f27c575868d4957172697b6c032a11b35b545bdf60ad144288f608d4f0', 1791600000000);
   COMMIT;
   ```
   *(Alternatively, `pnpm --filter @quiz/db-people db:migrate` executes the exact same transaction because `idx: 0..8` have `when <= 1774938098054` and only `idx: 9` has `when = 1791600000000`.)*

2. **Step 2 — Apply `0030_event_outbox.sql` on `tutorial_prod` (`d69fe9af7c33`)**:
   ```sql
   BEGIN;
   -- 1. Execute packages/db-tutorial/migrations/0030_event_outbox.sql
   -- 2. Record migration in drizzle.__drizzle_migrations:
   INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
   VALUES ('987cee980101b7515b846d56c99f5e244f84a634d6316b6c1196ed8b9fbe5d29', 1791600001000);
   COMMIT;
   ```
   *(Alternatively, `pnpm --filter @quiz/db-tutorial db:migrate` executes the exact same transaction because `idx: 0..28` have `when <= 1791510064024`, `0029_fnd03_add_tenant_to_progress.sql` is unregistered, and only `idx: 29` (`0030_event_outbox`) has `when = 1791600001000`.)*

### 4.4 Pre-Commit vs. Post-Commit Rollback Rules

- **Pre-Commit Failure**: Both migrations run inside a single `BEGIN ... COMMIT` transaction block in PostgreSQL (which supports transactional DDL). Any error automatically aborts the transaction and `ROLLBACK` leaves the schema and `drizzle.__drizzle_migrations` 100% unchanged.
- **Post-Commit Rollback Guard (Fail-Closed Data Protection)**:
  - **NEVER** execute `DROP TABLE` if either table contains non-synthetic invitation or outbox rows (`SELECT count(*) FROM student_invitations WHERE email NOT LIKE 'uat-synth-%@example.invalid'` > 0 or `SELECT count(*) FROM event_outbox WHERE aggregate_id NOT LIKE 'uat-synth-%'` > 0).
  - If an immediate post-migration rollback is required before live traffic and after verifying `SELECT count(*) FROM student_invitations = 0` and `SELECT count(*) FROM event_outbox = 0`:
    ```sql
    -- people_prod empty-table rollback:
    BEGIN;
    LOCK TABLE "public"."student_invitations" IN ACCESS EXCLUSIVE MODE;
    -- Abort if any row exists:
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "public"."student_invitations") THEN
        RAISE EXCEPTION 'Rollback blocked: student_invitations is non-empty';
      END IF;
    END $$;
    DROP TABLE "public"."student_invitations";
    DELETE FROM "drizzle"."__drizzle_migrations"
    WHERE "hash" = 'dc8452f27c575868d4957172697b6c032a11b35b545bdf60ad144288f608d4f0'
      AND "created_at" = 1791600000000;
    COMMIT;

    -- tutorial_prod empty-table rollback:
    BEGIN;
    LOCK TABLE "public"."event_outbox" IN ACCESS EXCLUSIVE MODE;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "public"."event_outbox") THEN
        RAISE EXCEPTION 'Rollback blocked: event_outbox is non-empty';
      END IF;
    END $$;
    DROP TABLE "public"."event_outbox";
    DELETE FROM "drizzle"."__drizzle_migrations"
    WHERE "hash" = '987cee980101b7515b846d56c99f5e244f84a634d6316b6c1196ed8b9fbe5d29'
      AND "created_at" = 1791600001000;
    COMMIT;
    ```

---

## 5. Post-Migration Verification Queries & Synthetic Test Fixtures

### 5.1 Post-Migration Verification Queries

```sql
-- 1. Verify student_invitations on people_prod (1afab5e2e8e6):
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'student_invitations'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'student_invitations'
ORDER BY indexname;

SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
WHERE created_at = 1791600000000;

-- 2. Verify event_outbox on tutorial_prod (d69fe9af7c33):
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'event_outbox'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'event_outbox'
ORDER BY indexname;

SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
WHERE created_at = 1791600001000;
```

### 5.2 Minimal Synthetic Fixtures for Gemini's Repaired Physical SQL Harness

When Gemini executes the repaired physical PostgreSQL concurrency and rollback suite after DDL application:
- **Synthetic User IDs (`people_prod`)**: Use deterministic UUID prefix `00000000-0000-4000-8000-0000000009xx` and synthetic emails `uat-synth-<race>@example.invalid` with `platform = 'skillup'`, `role = 'student'`. Because `student_invitations.user_id` has `ON DELETE CASCADE`, deleting the synthetic user row in `afterEach`/`afterAll` (`DELETE FROM users WHERE id::text LIKE '00000000-0000-4000-8000-0000000009%' AND email LIKE 'uat-synth-%@example.invalid'`) deterministically cleans up both `users` and `student_invitations`.
- **Synthetic Outbox Rows (`tutorial_prod`)**: Use `tenant_id = 'realtutorialhub'`, `aggregate_id LIKE 'uat-synth-%'`, and clean up via `DELETE FROM event_outbox WHERE aggregate_id LIKE 'uat-synth-%'`.
- **Schema Contract Alignment Note for Gemini (`H1`)**:
  - `StudentInvitationRepository` (`packages/db-people/src/repositories/student-invitation.repository.ts`) targets table `student_invitations` with columns `id`, `user_id`, `email`, `platform`, `token_hash`, `status` (`'pending' | 'claiming' | 'redeemed' | 'expired' | 'revoked' | 'superseded'`), `claim_owner_token`, `claim_expires_at`, `issued_at`, `expires_at`, `redeemed_at`, `created_at`, `updated_at`.
  - `EventOutboxRepository` (`packages/db-tutorial/src/repositories/event-outbox.repository.ts`) targets table `event_outbox` with columns `id`, `tenant_id`, `event_type`, `event_id`, `aggregate_id`, `payload`, `envelope`, `status` (`'pending' | 'publishing' | 'published' | 'failed'`), `attempt_count`, `owner_token`, `lease_expires_at`, `last_error`, `published_at`, `created_at`, `updated_at`.

---

## 6. Priority 2 — Source-Evidence Completion Summary (`FND19`/`TC16`, `FND01`, `FND12`, `FND17`)

1. **`FND19` / `TC16` — Canonical Taxonomy Schemas & 5-Entity CRUD Route Integration**:
   - Created canonical `packages/validation/src/hierarchy.ts` (exported from `packages/validation/src/index.ts`) and re-exported from `apps/api-server/src/schemas/hierarchy.schemas.ts` and `apps/skillhubcore-admin/src/schemas/hierarchy.schemas.ts`.
   - Enforced alias-conflict refinements directly in `topicSchema` / `topicPatchSchema` (rejects conflicting `complexity` vs `complexityLevel`) and `subtopicSchema` / `subtopicPatchSchema` (rejects conflicting `depth` vs `depthLevel` and conflicting `order` vs `orderIndex`) while preserving `.partial()` support.
   - Updated all 10 SHC taxonomy CRUD route files (`apps/skillhubcore-admin/src/app/api/admin/{domains,subjects,topics,subtopics,skills}/{route,[id]/route}.ts`) so every `POST`, `PUT`, and `PATCH` validates request depth/size and Zod schema (`safeParse`) **before** calling `getDb()`, enforces `requireAdminRequest`, returns `404` when target records do not exist on `PUT`/`PATCH`/`DELETE`, and serializes `depth`/`depthLevel`, `order`/`orderIndex`, and `complexity`/`complexityLevel` consistently.
   - Updated `apps/api-server/src/app/api/admin/{domains,topics}/route.ts` to preserve `order: body.order` on creation.
   - Expanded `apps/skillhubcore-admin/src/schemas/__tests__/hierarchy-contract.test.ts` (31 tests) and `apps/skillhubcore-admin/src/app/api/admin/domains/__tests__/foundation-validation.test.ts` (14 multi-method CRUD route tests across all 5 entities) -> **2 files / 45 passed (45)**.

2. **`FND01` / `FND12` / `FND17` — Re-Anchored `CompleteProjectAudit.md` Citations & 72 Caller Metadata**:
   - Re-anchored all 23 `"No original audit ID"` rows in Table 1.2 of `audit/Argon_W1_W3_Remaining_Work_And_Inventory_Reconciliation.md` to their exact `CompleteProjectAudit.md` line numbers (`2796..3933, 6232, 6294`), verbatim headings (`#### Finding 3:`..`#### Finding 32:`, `### Principal Finding`, `### 1. Skill Contract Drift`), primary application (`SkillHubCore Admin`), and root causes (`RC-CONTRACT-01`, `RC-STATE-01`, `RC-BOUND-01`, `RC-DATA-01`) from `audit/Audit_Finding_Root_Cause_Crosswalk.csv`.
   - Documented the 4 minor 1–6 line section-header window offsets across the 91-row crosswalk (`5544 -> 5547`, `6232 -> 6238`, `31252 -> 31253`, `34772 -> 34771`).
   - Enriched all 72 `MA-01`..`MA-29` and `TI-01`..`TI-43` caller entries in both `audit/FND12_Complete_Truth_Inventory.md` (Section 6) and `audit/Argon_W1_W3_Remaining_Work_And_Inventory_Reconciliation.md` (Section 1.3) with **Exported Function / Handler**, **Key Data Fields**, **Authoritative Data Owner / Store**, **Original Finding / Root Cause ID**, **Test / Verification Evidence**, and **Disposition**.

---

## 7. Verification Suite Execution Summary

| Suite / Command | Scope | Result |
| :--- | :--- | :--- |
| `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/schemas/__tests__/hierarchy-contract.test.ts src/app/api/admin/domains/__tests__/foundation-validation.test.ts` | Canonical taxonomy schemas + 5-entity SHC CRUD routes (`FND19` / `TC16`) | **2 files / 45 passed (45)** (exit `0`) |
| `node audit/Sol_Slice20_Repository_Review.mjs` | Preserved Slice 19/20 repository & caller controls | **3 files / 40 passed (40)** (exit `0`) |
| `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs` | SQL-authority controls | **2 files / 8 passed (8)** (exit `0`) |
| `node audit/Gemini_SQL_Authority_Invariant_Review.mjs` | Generalized SQL-authority invariants | **1 file / 6 passed (6)** (exit `0`) |
| `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs` | Worker lease adapter controls | **1 file / 7 passed (7)** (exit `0`) |
| Package Typechecks (`tsc --noEmit`) | `@quiz/validation`, `@quiz/db-people`, `@quiz/db-tutorial`, `@quiz/events`, `@quiz/skillup-admin`, `@quiz/skillhubcore-admin` | **All 6 passed** (exit `0`) |

---

## 8. Request for Sol Review & Migration Gate Authorization

Argon submits Slice 22-A for Sol review and requests:
1. **Approval of the Slice 22-A Migration Execution Plan** (`0009_student_invitations.sql` on `people_prod` `1afab5e2e8e6` and `0030_event_outbox.sql` on `tutorial_prod` `d69fe9af7c33`) so the environment owner / Gemini can create the Neon recovery branch snapshot and execute the two additive migrations.
2. **Independent Retest by Gemini Flash** of the Slice 22-A 5-entity taxonomy CRUD route integration (`FND19` / `TC16`), the repaired physical verification harnesses (`H1`–`H3`), and the re-anchored `FND01` / `FND12` / `FND17` inventories.
