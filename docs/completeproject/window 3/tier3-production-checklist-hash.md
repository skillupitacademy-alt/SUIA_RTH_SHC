# Tier 3 Production Checklist - Hash Partition Path

This checklist is the working production path after the rehearsal findings.

## Pre-window

- Confirm `pnpm test` is green.
- Confirm Neon PITR is current.
- Confirm the rehearsal branch passed the hash-partition rehearsal.
- Notify the team of the maintenance window.

## Window

- Run the revised `exams` hash-partition migration on `quiz_platform_prod`.
- Verify the partition list and restored FK count.
- Run the people-side `auth_audit_log` hash-partition migration only after the rehearsal confirms the actual table shape is partitionable.
- Verify the partition list and application flows.

## Post-window

- Run the full app test suite again.
- Run a real exam flow end-to-end.
- Record the commit and update the roadmap status.
