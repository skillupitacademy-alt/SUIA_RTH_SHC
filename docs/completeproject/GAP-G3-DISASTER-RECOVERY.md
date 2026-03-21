# Gap G3: Disaster Recovery & Data Backup
## docs/blueprints/GAP-G3-DISASTER-RECOVERY.md

> Priority: CRITICAL — student exam data is irreplaceable
> Applies to: All 5 Neon databases

---

## Part 1: RTO & RPO Targets

```
RTO (Recovery Time Objective):   < 4 hours (platform back online)
RPO (Recovery Point Objective):  < 1 hour (max data loss acceptable)

Exam DB:      RPO = 15 minutes (exam submissions are irreplaceable)
Tutorial DB:  RPO = 1 hour (content is regenerable, progress is not)
People DB:    RPO = 30 minutes (user accounts critical)
Payment DB:   RPO = 5 minutes (financial data, legal obligation)
Placement DB: RPO = 1 hour
```

---

## Part 2: Neon Automatic Backups

```
Neon provides:
  - Continuous WAL archiving (point-in-time recovery)
  - Branch-based snapshots
  - 7-day retention on Free plan
  - 30-day retention on Scale plan

Action items per database:
  □ exam-db:      Upgrade to Neon Scale plan (30-day retention)
  □ payment-db:   Upgrade to Neon Scale plan (legal requirement)
  □ people-db:    Upgrade to Neon Scale plan
  □ tutorial-db:  Free plan acceptable (content regenerable)
  □ placement-db: Free plan acceptable initially

Verify backups are enabled:
  → Neon Console → Project → Settings → Backups
  → Confirm: "Continuous backups: enabled"
```

---

## Part 3: Soft Deletes (Critical Tables)

```sql
-- ALL critical tables must use soft deletes — never hard delete

-- Pattern: add deleted_at column to every important table
-- exam-db:
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- people-db:
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- tutorial-db:
ALTER TABLE tutorial_content ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tutorial_progress ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Query pattern (always filter):
WHERE deleted_at IS NULL

-- Permanent deletion policy:
-- Payment data: never delete (legal obligation, 7 years)
-- Exam results: never delete
-- User accounts: soft delete only, purge after 3 years of inactivity
```

---

## Part 4: Point-in-Time Recovery Procedure

```bash
# STEP 1: Identify the restore point
# Go to Neon Console → Project → Branches → Restore

# STEP 2: Create a restore branch
neon branches create \
  --name "restore-$(date +%Y%m%d-%H%M)" \
  --project-id $NEON_PROJECT_ID \
  --parent main \
  --timestamp "2026-03-19T10:00:00Z"  # time before incident

# STEP 3: Verify data on restore branch
# Connect to restore branch and check data integrity

# STEP 4: Promote restore branch to main
neon branches set-primary \
  --project-id $NEON_PROJECT_ID \
  --name "restore-$(date +%Y%m%d-%H%M)"

# STEP 5: Update connection strings if branch URL changed
# Update in Railway environment variables

# Time estimate: 15-30 minutes for < 10GB databases
```

---

## Part 5: Additional Backup Export (Weekly)

```typescript
// .github/workflows/weekly-backup.yml
// Runs every Sunday at 2:00 AM UTC

// Export critical tables to GCS (Google Cloud Storage)
async function exportCriticalTables() {
  const tables = [
    { db: 'exam', tables: ['exam_sessions', 'exam_results', 'questions'] },
    { db: 'people', tables: ['users', 'students'] },
    { db: 'payment', tables: ['payment_ledger', 'payment_transactions'] }
  ]

  for (const { db, tables } of tables) {
    for (const table of tables) {
      // pg_dump specific table
      // Upload to GCS bucket: gs://platform-backups/weekly/
      // Retain for 90 days
      // Encrypt with AES-256 before upload
    }
  }
}
```

---

## Part 6: Recovery Runbook Location

```
docs/runbooks/
  ├── exam-db-recovery.md      → step-by-step for exam data loss
  ├── payment-db-recovery.md   → step-by-step for payment data loss
  ├── service-outage.md        → what to do when a service is down
  └── data-corruption.md       → how to identify and fix corrupted data
```

---

## Part 7: Verification Checklist

```
□ Neon backups enabled on all 5 databases
□ exam-db and payment-db on Scale plan (30-day retention)
□ Soft delete columns added to all critical tables
□ PITR restore tested on exam-db (quarterly drill)
□ Weekly export to GCS working and encrypted
□ RTO drill: restore from backup in < 4 hours (tested once per quarter)
□ Alert: Sentry + PagerDuty if DB connection fails for > 2 minutes
```

---

*Gap: G3 | Priority: CRITICAL | Status: Ready*
