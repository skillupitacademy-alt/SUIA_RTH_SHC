# AI Implementation Prompt: Admin Audit Trail

**Role**: You are a Senior Backend Engineer specializing in audit logging, compliance, and database design for SaaS platforms.

**Task**: Implement a complete audit trail system that records every admin action with before/after snapshots, queryable through an admin UI.

## Core Requirements
1.  **Database Schema**:
    - Create an `audit_logs` table in `packages/db/src/schema/` with columns: `id`, `actor_id`, `actor_email`, `action`, `entity_type`, `entity_id`, `before_data` (JSONB), `after_data` (JSONB), `ip_address`, `user_agent`, `metadata` (JSONB), `created_at`.
    - Add indexes on `actor_id`, `(entity_type, entity_id)`, `action`, and `created_at`.
    - Generate and run a Drizzle migration.

2.  **AuditService**:
    - Create `apps/api-server/src/modules/system/audit.service.ts`.
    - Implement `AuditService.log()`: accepts actor info, action, entity type/id, before/after data, request context.
    - Implement `AuditService.query()`: accepts filters (actor, action, entity_type, date range) and returns paginated results.
    - Make audit writes non-blocking (fire-and-forget pattern to avoid slowing admin operations).

3.  **AdminEngine Integration**:
    - Wrap all mutation methods in `AdminEngine` (create/update/delete for questions, blueprints, users, subjects, topics).
    - For updates: fetch the existing record BEFORE the mutation, then log both the before and after snapshots.
    - For creates: log `before_data: null`, `after_data: {newRecord}`.
    - For deletes: log `before_data: {deletedRecord}`, `after_data: null`.

4.  **Admin UI**:
    - Create an "Activity Log" page in `apps/admin-app`.
    - Display audit entries in a data table with columns: Timestamp, Actor, Action, Entity, Details.
    - Add filters: actor dropdown, action type, entity type, date range picker.
    - Expandable rows showing JSON diff of before/after data.
    - CSV export button.

## Technical Stack Context
- **Database**: Neon Postgres via Drizzle ORM (`packages/db`).
- **Framework**: Next.js App Router.
- **Admin App**: `apps/admin-app` (React + Tailwind).
- **API Client**: `packages/api-client` for admin-app → api-server communication.

## Prompt Instruction
"Create the audit_logs table via Drizzle migration, build AuditService with log/query methods, integrate it into all AdminEngine mutation methods with before/after snapshots, and build an Activity Log page in the admin-app with filters and JSON diff display."
