# Platform To-Do — Sequenced Next Steps

## SPRINT 1 — Faculty Phase 5 Completion (Done)
> Completed: 3 api-server routes + faculty-app BFF/page wiring.

- [x] 1A. Create `apps/api-server/src/app/api/tutorial/faculty/review-queue/route.ts`
       - GET, protected by x-portal-identity: faculty + x-user-id header
       - Queries tutorial_prod: tutorial_project_submissions WHERE userId IN (batch student IDs)
       - Returns: { submissions: [ { id, studentName, subtopicId, submittedAt, status } ] }

- [x] 1B. Create `apps/api-server/src/app/api/tutorial/faculty/assignments/route.ts`
       - GET, same auth pattern
       - Queries tutorial_prod: tutorial_assignments for faculty batch students
       - Returns: { assignments: [ { id, studentId, subtopicId, dueDate, status } ] }

- [x] 1C. Create `apps/api-server/src/app/api/tutorial/faculty/help-requests/route.ts`
       - GET, same auth pattern
       - Queries tutorial_prod: live_session_requests WHERE facultyId = resolvedFacultyId
       - Returns: { requests: [ { id, studentId, subtopicId, requestedAt, status } ] }

- [x] 1D. Wire faculty-app BFF routes to api-server
       - apps/faculty-app/src/app/api/assignments/route.ts   calls /api/tutorial/faculty/assignments
       - apps/faculty-app/src/app/api/help-requests/route.ts  calls /api/tutorial/faculty/help-requests
       - apps/faculty-app/src/app/api/review-queue/route.ts     calls /api/tutorial/faculty/review-queue

- [x] 1E. Remove fallback from faculty-app assignment, help, project-review pages

- [x] 1F. Verify: faculty@skillupitacademy.com login  assignments page shows real data

---

## SPRINT 2 — payment_prod Schema (Done)

- [x] 2A. Create `packages/db-payment/src/schema/`
       - payment_plans.ts: id, userId, status, planType, totalAmount, createdAt
       - payment_installments.ts: id, planId, dueDate, status, amount, paymentRef
       - payment_transactions.ts: id, installmentId, paymentRef UNIQUE, gateway, amount
       - gateway_webhook_logs.ts: id, paymentRef, gateway, payload JSONB, status

- [x] 2B. Add indexes from Phase 13 spec on all 4 tables (status+dueDate partial, paymentRef UNIQUE)

- [x] 2C. Run `pnpm db-payment:migrate`

- [x] 2D. Seed 2 installments for student@skillupitacademy.com (1 paid, 1 pending)

- [x] 2E. Replace `apps/skillup-web/src/app/api/student/payments/route.ts` demo data with real DB query

- [x] 2F. Verify: student login  payments page shows real installment data

---

## SPRINT 3 — Phase 6: RTH Pending Pages (Done)
> Zero changes to existing RTH functionality. New pages only.

- [x] 3A. `realtutorialhub-web`: tutorial learning pages per subtopic
       - Route: `/learn/[domain]/[subject]/[topic]/[subtopic]`
       - Fetches from tutorial_prod via api-server
       - Renders content JSONB blocks (text, code, video, quiz-link)

- [x] 3B. `realtutorialhub-quiz`: onboarding flow improvements
       - Existing /onboarding page — check what's incomplete
       - Must not break existing onboarded users

- [x] 3C. `realtutorialhub-quiz`: profile page
       - Route: /profile
       - Shows user stats, exam history summary, skill tags

---

## SPRINT 4 — placement_prod Schema (Done)

- [x] 4A. Create `packages/db-placement/src/schema/` (5 tables from Phase 13 spec)
- [x] 4B. Set up Upstash Vector indexes: placement-students, placement-jobs
- [x] 4C. Implement PlacementVectorService.indexStudentProfile() + findStudentsForJob()
- [x] 4D. Seed 1 student profile + 2 job listings
- [x] 4E. Wire skillup-web /student/placement to real DB

---

## SPRINT 5 — Tier 3 Infrastructure (Deferred)
> Do NOT start until Sprint 1-3 are complete and all RTH tests are green.

- [ ] 5A. Create Neon branch from prod snapshot
- [ ] 5B. Rehearse exams table partition migration on Neon branch
       - Shadow table  PARTITION BY RANGE (started_at)
       - Monthly partitions: 2025, 2026, 2027
       - Drop + recreate 5 FK constraints
- [ ] 5C. Rehearse audit_log partition migration on Neon branch
- [ ] 5D. Confirm Neon PITR backup is current
- [ ] 5E. Execute migrations in 2-5 AM IST maintenance window on prod
- [ ] 5F. Verify all RTH tests green post-migration (1138+)

---

## SPRINT 6 — packages/auth + packages/events (Done)

- [x] 6A. Extract JWT verification into packages/auth (shared across services)
- [x] 6B. Build packages/events with 15 event types
- [x] 6C. Wire QStash consumers in api-server to use typed events


## Tier 3 — Complete Maintenance Window Roadmap

---

### Phase A — Pre-conditions (Do These Days Before)

**1. Verify all RTH tests still passing**
```bash
pnpm test
# Must see: 1138+ passed, 0 failed
```

**2. Confirm Neon PITR backup**
- Log into Neon dashboard → your project → Branches → `main`
- Confirm "Point-in-time restore" shows today's timestamp
- Note the restore point time — you will use this if rollback is needed

**3. Create a Neon rehearsal branch**
```bash
# In Neon dashboard: Branches → Create Branch
# Branch name: tier3-partition-rehearsal
# Branch from: main (latest)
# This is a full copy of prod schema + data — safe to destroy
```

**4. Get the rehearsal connection strings**
```
# Neon will give you two new URLs for the branch:
REHEARSAL_QUIZ_DB=postgresql://...  (quiz_platform_prod branch)
REHEARSAL_PEOPLE_DB=postgresql://...  (people_prod branch)
```

---

### Phase B — Rehearse on Neon Branch: `exams` Table

Run these SQL statements **on the Neon rehearsal branch only** using a DB client (Neon SQL editor or psql):

**Step B1 — Understand current FK dependencies**
```sql
-- Run this first to see all constraints pointing at exams.id:
SELECT conname, conrelid::regclass AS from_table, confrelid::regclass AS to_table
FROM pg_constraint
WHERE confrelid = 'exams'::regclass AND contype = 'f';
-- Expected output: exam_questions, results_by_dimension, report_jobs, idempotency_keys, reports
```

**Step B2 — Create partitioned shadow table**
```sql
CREATE TABLE exams_partitioned (
  LIKE exams INCLUDING ALL
) PARTITION BY RANGE (started_at);

CREATE TABLE exams_2024 PARTITION OF exams_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE exams_2025 PARTITION OF exams_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE exams_2026 PARTITION OF exams_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE exams_future PARTITION OF exams_partitioned
  FOR VALUES FROM ('2027-01-01') TO ('2099-01-01');
```

**Step B3 — Copy data into shadow table**
```sql
INSERT INTO exams_partitioned SELECT * FROM exams;
-- Verify row count matches:
SELECT COUNT(*) FROM exams;
SELECT COUNT(*) FROM exams_partitioned;
-- Both must be equal
```

**Step B4 — Drop all FK constraints pointing at exams**
```sql
-- Get exact constraint names from Step B1 output, then:
ALTER TABLE exam_questions DROP CONSTRAINT exam_questions_exam_id_fkey;
ALTER TABLE results_by_dimension DROP CONSTRAINT results_by_dimension_exam_id_fkey;
ALTER TABLE report_jobs DROP CONSTRAINT report_jobs_exam_id_fkey;
ALTER TABLE idempotency_keys DROP CONSTRAINT idempotency_keys_exam_id_fkey;
ALTER TABLE reports DROP CONSTRAINT reports_attempt_id_fkey;
```

**Step B5 — Swap tables**
```sql
ALTER TABLE exams RENAME TO exams_old;
ALTER TABLE exams_partitioned RENAME TO exams;
```

**Step B6 — Recreate FK constraints**
```sql
ALTER TABLE exam_questions
  ADD CONSTRAINT exam_questions_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE results_by_dimension
  ADD CONSTRAINT results_by_dimension_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE report_jobs
  ADD CONSTRAINT report_jobs_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE idempotency_keys
  ADD CONSTRAINT idempotency_keys_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE reports
  ADD CONSTRAINT reports_attempt_id_fkey
  FOREIGN KEY (attempt_id) REFERENCES exams(id) ON DELETE CASCADE;
```

**Step B7 — Verify on rehearsal branch**
```sql
-- Verify partitions exist:
SELECT tablename FROM pg_tables WHERE tablename LIKE 'exams_%';

-- Verify an INSERT routes correctly:
EXPLAIN INSERT INTO exams (id, started_at, ...) VALUES (gen_random_uuid(), NOW(), ...);
-- Should show: Insert on exams_2026

-- Verify FKs re-established:
SELECT conname FROM pg_constraint WHERE contype = 'f' AND confrelid = 'exams'::regclass;
-- Should show all 5 constraints back

-- Drop old table on rehearsal only:
DROP TABLE exams_old;
```

---

### Phase C — Rehearse on Neon Branch: `audit_log` Table

`audit_log` is simpler — no FK dependencies pointing at it.

```sql
-- Step C1: Create partitioned shadow
CREATE TABLE audit_log_partitioned (LIKE audit_log INCLUDING ALL)
  PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2024 PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE audit_log_2025 PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE audit_log_2026 PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE audit_log_future PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2027-01-01') TO ('2099-01-01');

-- Step C2: Copy data
INSERT INTO audit_log_partitioned SELECT * FROM audit_log;
SELECT COUNT(*) FROM audit_log;
SELECT COUNT(*) FROM audit_log_partitioned;

-- Step C3: Swap (no FK drops needed for audit_log)
ALTER TABLE audit_log RENAME TO audit_log_old;
ALTER TABLE audit_log_partitioned RENAME TO audit_log;
DROP TABLE audit_log_old;

-- Step C4: Verify
SELECT tablename FROM pg_tables WHERE tablename LIKE 'audit_log_%';
```

**If both rehearsals pass on the Neon branch without error, you are ready for prod.**

---

### Phase D — Maintenance Window Execution (Prod)

**Pick a time:** 2:00–3:30 AM IST (historically lowest traffic)

**30 minutes before window:**
```bash
# Notify team: maintenance window starting at 2AM IST
# Do NOT deploy any code changes during the window
```

**At the window:**

```
2:00 AM — Confirm Neon PITR timestamp is current
2:02 AM — Run Step B2–B7 on quiz_platform_prod (exams table)
           Estimated time: 5–15 minutes depending on row count
2:20 AM — Verify exams table as in Step B7
2:25 AM — Run Step C1–C4 on people_prod (audit_log table)
           Estimated time: 5–10 minutes
2:35 AM — Full verification (below)
3:00 AM — Mark complete. Announce window closed.
```

---

### Phase E — Post-Migration Verification

```bash
# Run full test suite after migration (not before going to sleep):
pnpm test
# Must see: 1138+ passed, 0 failed

# Run a real exam flow manually to confirm:
# 1. Log in as RTH student
# 2. Start an exam
# 3. Submit exam
# 4. View report
# All must work correctly — this exercises all 5 FK paths
```

**If any test fails after migration:**
```
1. Do NOT hotfix in prod
2. Use Neon PITR to restore to pre-migration snapshot
3. Fix on rehearsal branch, rehearse again
4. Schedule next maintenance window
```

---

### Rollback Procedure (if needed)

```sql
-- If exams swap went wrong — restore from PITR:
-- Neon dashboard → your project → Restore → select PITR timestamp from before migration
-- This is a full DB restore — all writes after that point are lost
-- Acceptable only during a 2AM window with no active users
```

---

### Summary Checklist

```
PRE-WINDOW (days before):
  [ ] pnpm test — all green
  [ ] Neon PITR confirmed current
  [ ] Neon rehearsal branch created
  [ ] B1-B7 completed on rehearsal branch — no errors
  [ ] C1-C4 completed on rehearsal branch — no errors
  [ ] Team notified of maintenance window

WINDOW (2AM IST):
  [ ] PITR timestamp noted
  [ ] exams migration (B2-B7) on prod quiz_platform_prod
  [ ] audit_log migration (C1-C4) on prod people_prod
  [ ] Post-migration SQL verify (partition list + FK count)
  [ ] pnpm test — all green

POST-WINDOW:
  [ ] Real exam flow test (login → start → submit → report)
  [ ] Commit: docs(tier3): exams and audit_log partitioned
  [ ] Update TASK-STATUS.md: Sprint 5 DONE
```

That is the complete Tier 3 roadmap — nothing is left ambiguous. The rehearsal on the Neon branch is the safety net that makes the prod window low-risk.

---

### Append-Only Note

This file is append-only for future planning and reference.
- Do not rewrite or remove earlier sections.
- Add new updates, decisions, or status notes only at the end of the file.
- Keep Tier 3 as deferred until the rehearsal + maintenance window conditions are met.

---

### Tier 3 Prep Started

- Created `docs/completeproject/window 3/tier3-runbook.md` as the working runbook for the Neon rehearsal and maintenance-window execution.
- Tier 3 remains deferred for production until rehearsal branch validation and the approved maintenance window are both in place.
- No production database changes have been made as part of this prep step.

---

### Tier 3 Execution Assets

- Added `docs/completeproject/window 3/tier3-rehearsal.sql` for the Neon branch dry run.
- Added `docs/completeproject/window 3/tier3-production-checklist.md` for the live maintenance window.
- These are preparation artifacts only. They do not run or mutate any database by themselves.
