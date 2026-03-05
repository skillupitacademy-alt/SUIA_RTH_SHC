# Disaster Recovery & Data Backup Strategy
*Phase G3: Data Insurance*

## 📜 Architectural Objective
To ensure that student exam data — the most critical asset of the platform — can never be permanently lost, and that the system can be restored to full operation within defined time targets after any catastrophic failure.

---

## 🏗️ 1. Automated Database Backups

### A. Neon Built-in Features
- **Point-in-Time Recovery (PITR)**: Neon supports up to 30 days of PITR on paid plans.
- **Action**: Ensure the Neon project is on a plan that includes PITR. Document the exact PITR window in the runbook.
- **Branches**: Use Neon's branching feature to create instant "snapshots" before risky migrations.

### B. Scheduled Export Backups
- **Strategy**: Weekly full export + daily incremental via a CRON job.
- **Action**: Create a `api/cron/backup` route that:
  1. Runs `pg_dump` (or Neon API export) of critical tables.
  2. Uploads the dump to cloud storage (Vercel Blob, S3, or Google Cloud Storage).
  3. Retains 90 days of backups with automatic cleanup of older files.
- **Tables to Backup**: `exams`, `exam_questions`, `users`, `user_profiles`, `results_by_dimension`, `subjects`, `topics`, `questions`, `exam_blueprints`.

---

## 🔄 2. Recovery Procedures

### A. Recovery Time Objective (RTO): < 1 hour
- Time from incident to full service restoration.
- Achieved through: pre-documented runbook, Neon PITR, automated restore scripts.

### B. Recovery Point Objective (RPO): < 15 minutes
- Maximum acceptable data loss window.
- Achieved through: Neon's continuous WAL archiving + Redis persistence for active sessions.

### C. Restore Runbook
1. **Identify scope**: Single table corruption vs. full database loss.
2. **For table corruption**: Use Neon branch to create a clean copy → export affected table → import into production.
3. **For full DB loss**: Restore from latest Neon PITR → replay any Redis-cached in-flight exam sessions.
4. **Verify**: Run data integrity checks (record counts, sum validations).

---

## 🛡️ 3. Soft Deletes for Critical Data

### A. Strategy
- **Never hard-delete**: Exams, results, user profiles, or questions.
- **Action**: Add `deleted_at` (nullable timestamp) column to critical tables.
- **Queries**: Add `.where(isNull(deletedAt))` to all standard queries. Provide admin "recycle bin" to view/restore soft-deleted records.

### B. Data Retention Policy
| Data Type | Retention | After Expiry |
|---|---|---|
| Active exams/results | Indefinite | — |
| Soft-deleted exams | 90 days | Hard-delete |
| Audit logs | 2 years | Archive to cold storage |
| Session tokens | 30 days | Hard-delete |
| Login attempts | 90 days | Hard-delete |

---

## 🧪 4. Backup Testing

### A. Quarterly Restore Drill
- **Action**: Every quarter, restore a backup to a Neon branch and validate:
  1. All tables exist with correct schemas.
  2. Record counts match expected values.
  3. Application can connect and serve requests.
- **Log**: Document each drill result in `docs/operations/restore-drill-log.md`.

---

## 🛡️ Implementation Checklist
- [ ] Verify Neon PITR is enabled and covers 30 days
- [ ] Create `api/cron/backup` scheduled export route
- [ ] Set up cloud storage bucket for backup files
- [ ] Add `deleted_at` column to critical tables (DB migration)
- [ ] Update all queries to exclude soft-deleted records
- [ ] Write restore runbook with step-by-step instructions
- [ ] Create admin "Recycle Bin" UI in admin-app
- [ ] Schedule first quarterly restore drill
- [ ] Document RTO/RPO targets
- [ ] Set up alerting for backup job failures

---

## 📈 Impact
A single accidental `DELETE FROM exams` without a backup could destroy years of student data. This phase makes the platform **immune to data loss** through redundant backups, soft deletes, and tested recovery procedures.

*Document Version: 1.0*
