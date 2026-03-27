-- Tier 3 rehearsal SQL (revised)
-- Run on a Neon rehearsal branch only.
-- Do not run this on production.

-- B1: Inspect FK dependencies pointing at exams
SELECT conname, conrelid::regclass AS from_table, confrelid::regclass AS to_table
FROM pg_constraint
WHERE confrelid = 'exams'::regclass AND contype = 'f';

-- B2: Create HASH partitioned shadow for exams
DROP TABLE IF EXISTS exams_partitioned CASCADE;
DROP TABLE IF EXISTS exams_p0 CASCADE;
DROP TABLE IF EXISTS exams_p1 CASCADE;
DROP TABLE IF EXISTS exams_p2 CASCADE;
DROP TABLE IF EXISTS exams_p3 CASCADE;

CREATE TABLE exams_partitioned (
  LIKE exams INCLUDING ALL
) PARTITION BY HASH (id);

CREATE TABLE exams_p0 PARTITION OF exams_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE exams_p1 PARTITION OF exams_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE exams_p2 PARTITION OF exams_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE exams_p3 PARTITION OF exams_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

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
SELECT tablename FROM pg_tables WHERE tablename LIKE 'exams_p%';
SELECT conname FROM pg_constraint WHERE contype = 'f' AND confrelid = 'exams'::regclass;

-- Clean up rehearsal only after verification
DROP TABLE exams_old;

