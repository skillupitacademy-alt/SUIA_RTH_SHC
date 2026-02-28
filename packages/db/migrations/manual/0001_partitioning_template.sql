-- Database Partitioning Strategy (Phase 5: Battle Hardening)
-- Target Tables: exams, exam_questions
-- Complexity: High (Requires data migration for existing rows)

-- 1. Partitioning 'exams' by Month (Range Partitioning)
-- This ensures that old data doesn't slow down current exam sessions.

-- Rename the current table
ALTER TABLE exams RENAME TO exams_old;

-- Create the partitioned table
CREATE TABLE exams (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    blueprint_id UUID,
    status exam_status NOT NULL DEFAULT 'started',
    total_score INTEGER,
    duration_seconds INTEGER,
    started_at TIMESTAMP NOT NULL DEFAULT now(),
    last_answered_at TIMESTAMP,
    completed_at TIMESTAMP,
    report_materialized JSONB,
    PRIMARY KEY (id, started_at) -- Primary key must include partition column
) PARTITION BY RANGE (started_at);

-- Create initial partitions
CREATE TABLE exams_2025_01 PARTITION OF exams FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE exams_2025_02 PARTITION OF exams FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE exams_default PARTITION OF exams DEFAULT;

-- 2. Partitioning 'exam_questions' by exam_id (Hash Partitioning)
-- This distributes I/O load across multiple physical files.

ALTER TABLE exam_questions RENAME TO exam_questions_old;

CREATE TABLE exam_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL,
    question_id UUID NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    response_metadata JSONB,
    "order" INTEGER NOT NULL,
    PRIMARY KEY (id, exam_id)
) PARTITION BY HASH (exam_id);

-- Create 64 hash partitions
-- (Loop-based SQL or automation tool recommended here)
-- CREATE TABLE exam_questions_0 PARTITION OF exam_questions FOR VALUES WITH (MODULUS 64, REMAINDER 0);
-- ...
-- CREATE TABLE exam_questions_63 PARTITION OF exam_questions FOR VALUES WITH (MODULUS 64, REMAINDER 63);
