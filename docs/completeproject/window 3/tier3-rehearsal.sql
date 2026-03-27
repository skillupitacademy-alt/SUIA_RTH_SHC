-- Tier 3 rehearsal SQL
-- Run on a Neon rehearsal branch only.
-- Do not run this on production.

-- B1: Inspect FK dependencies pointing at exams
SELECT conname, conrelid::regclass AS from_table, confrelid::regclass AS to_table
FROM pg_constraint
WHERE confrelid = 'exams'::regclass AND contype = 'f';

-- B2: Create partitioned shadow for exams
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

-- B3: Copy rows
INSERT INTO exams_partitioned SELECT * FROM exams;
SELECT COUNT(*) AS exams_row_count FROM exams;
SELECT COUNT(*) AS exams_partitioned_row_count FROM exams_partitioned;

-- B4: Drop FKs pointing at exams
ALTER TABLE exam_questions DROP CONSTRAINT exam_questions_exam_id_fkey;
ALTER TABLE results_by_dimension DROP CONSTRAINT results_by_dimension_exam_id_fkey;
ALTER TABLE report_jobs DROP CONSTRAINT report_jobs_exam_id_fkey;
ALTER TABLE idempotency_keys DROP CONSTRAINT idempotency_keys_exam_id_fkey;
ALTER TABLE reports DROP CONSTRAINT reports_attempt_id_fkey;

-- B5: Swap tables
ALTER TABLE exams RENAME TO exams_old;
ALTER TABLE exams_partitioned RENAME TO exams;

-- B6: Recreate FKs
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

-- B7: Verify partitioning and FKs
SELECT tablename FROM pg_tables WHERE tablename LIKE 'exams_%';
SELECT conname FROM pg_constraint WHERE contype = 'f' AND confrelid = 'exams'::regclass;

-- Clean up rehearsal only after verification
DROP TABLE exams_old;

-- C1: Create partitioned shadow for audit_log
CREATE TABLE audit_log_partitioned (
  LIKE audit_log INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2024 PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE audit_log_2025 PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audit_log_2026 PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE audit_log_future PARTITION OF audit_log_partitioned
  FOR VALUES FROM ('2027-01-01') TO ('2099-01-01');

-- C2: Copy rows
INSERT INTO audit_log_partitioned SELECT * FROM audit_log;
SELECT COUNT(*) AS audit_log_row_count FROM audit_log;
SELECT COUNT(*) AS audit_log_partitioned_row_count FROM audit_log_partitioned;

-- C3: Swap tables
ALTER TABLE audit_log RENAME TO audit_log_old;
ALTER TABLE audit_log_partitioned RENAME TO audit_log;
DROP TABLE audit_log_old;

-- C4: Verify partitions
SELECT tablename FROM pg_tables WHERE tablename LIKE 'audit_log_%';
