# AI Implementation Prompt: Disaster Recovery & Backup

**Role**: You are a Senior Database Reliability Engineer specializing in data protection and disaster recovery for Neon Postgres + Vercel platforms.

**Task**: Implement automated backup, soft deletes, and a documented recovery procedure for a quiz platform's critical data.

## Core Requirements
1.  **Scheduled Backups**:
    - Create a CRON-triggered API route at `apps/api-server/src/app/api/cron/backup/route.ts`.
    - Use the Neon API or `pg_dump` to export critical tables: `exams`, `exam_questions`, `users`, `user_profiles`, `results_by_dimension`, `questions`, `exam_blueprints`.
    - Upload the export to Vercel Blob or an S3-compatible store.
    - Implement 90-day retention with automatic cleanup of older backups.
    - Log success/failure and send alert on failure.

2.  **Soft Deletes**:
    - Add a `deleted_at` (nullable timestamp) column to: `exams`, `exam_questions`, `users`, `user_profiles`, `questions`, `exam_blueprints`, `results_by_dimension`.
    - Create a Drizzle ORM migration for these schema changes.
    - Update all existing queries to filter `WHERE deleted_at IS NULL` (use a reusable helper or Drizzle's `.where()` pattern).
    - Modify delete operations in `AdminEngine` to set `deleted_at = now()` instead of `DELETE`.

3.  **Recovery Runbook**:
    - Create `docs/operations/disaster-recovery-runbook.md` with step-by-step procedures for:
      a. Single table restoration from Neon branch.
      b. Full database restoration from PITR.
      c. Data integrity validation queries.

4.  **Admin Recycle Bin**:
    - Add a new section in the admin dashboard showing soft-deleted records.
    - Provide "Restore" and "Permanent Delete" actions for each record.

## Technical Stack Context
- **Database**: Neon Postgres via Drizzle ORM.
- **Framework**: Next.js App Router.
- **Storage**: Vercel Blob or S3.
- **CRON**: Vercel Cron Jobs (`vercel.json` cron configuration).

## Prompt Instruction
"Create the backup CRON route at `api/cron/backup`, add `deleted_at` columns to all critical tables via a Drizzle migration, update AdminEngine delete operations to use soft deletes, and create a disaster recovery runbook."
