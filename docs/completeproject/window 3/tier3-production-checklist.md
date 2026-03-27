# Tier 3 Production Checklist

Use only during the approved 2:00 AM to 3:30 AM IST maintenance window.

## Before Window

- [ ] Confirm `pnpm test` is green
- [ ] Confirm Neon PITR timestamp is current
- [ ] Confirm rehearsal branch has passed the SQL sequence
- [ ] Notify the team that the window is starting

## At Window Start

- [ ] Reconfirm PITR timestamp
- [ ] Avoid any unrelated code deploys

## Production Execution

- [ ] Run the `exams` partition migration on `quiz_platform_prod`
- [ ] Verify `exams` partitions and FK restoration
- [ ] Run the `audit_log` partition migration on `people_prod`
- [ ] Verify `audit_log` partitions

## After Window

- [ ] Run `pnpm test`
- [ ] Manually verify a real exam flow
- [ ] If anything fails, restore from PITR
