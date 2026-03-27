# Tier 3 Maintenance Window Runbook

Source of truth:
- `docs/completeproject/window 3/task.md`
- `docs/completeproject/window 3/platform_prompt.md`
- `docs/AUTH_GUIDELINES.md`

Status:
- Prep only.
- No prod changes until Neon rehearsal passes and a maintenance window is scheduled.

## Phase A - Pre-Conditions

1. Verify the full test suite is still green.
2. Confirm Neon PITR backup timestamp is current.
3. Create a Neon rehearsal branch from `main`.
4. Capture branch connection strings for the rehearsal databases.

## Phase B - Rehearse `exams`

1. Inspect foreign keys that reference `exams.id`.
2. Create a partitioned shadow table for `exams`.
3. Copy data into the shadow table and confirm row counts match.
4. Drop the FK constraints that point to `exams`.
5. Swap `exams` with the partitioned shadow table.
6. Recreate the FK constraints.
7. Verify partitions, inserts, and FK state on the rehearsal branch.

## Phase C - Rehearse `auth_audit_log`

1. Create a partitioned shadow table for `auth_audit_log`.
2. Copy data into the shadow table and confirm row counts match.
3. Swap `auth_audit_log` with the partitioned shadow table.
4. Verify partitions on the rehearsal branch.

## Phase D - Production Window

1. Start only during the approved 2:00 AM to 3:30 AM IST window.
2. Reconfirm PITR timestamp before touching prod.
3. Run the `exams` migration first.
4. Verify the `exams` swap before touching `auth_audit_log`.
5. Run the `auth_audit_log` migration.
6. Verify both partitions and application flows.

## Phase E - Rollback

If anything fails after the swap:
- Do not hotfix in prod.
- Restore from the pre-window PITR snapshot.
- Fix on the rehearsal branch.
- Rehearse again before the next window.

## Acceptance Criteria

- Rehearsal branch passes the full SQL sequence without errors.
- Production window completes with no user-facing regression.
- Full app test suite passes after the migration.
- A clean commit documents the migration work.

## Hash Partition Revision

The initial RANGE-based plan is superseded by the HASH-based rehearsal path documented in:
- `docs/completeproject/window 3/tier3-rehearsal-hash.sql`
- `docs/completeproject/window 3/tier3-production-checklist-hash.md`

Use the HASH path for `exams` because it preserves the existing `id` primary key and avoids the child-FK redesign required by the RANGE plan.
