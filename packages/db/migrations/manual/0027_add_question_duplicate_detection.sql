-- Migration: Question Duplicate-Detection Columns (Factory Pipeline)
-- Adds hash/semantic columns to support layered duplicate detection:
--   1. question_hash  — SHA-256 of normalized question text (exact duplicate / race safety)
--   2. code_hash      — SHA-256 of normalized code snippet (structural code duplicates)
--   3. concept_key    — stable identifier for the concept being tested (additional signal)
-- Applies idempotently so it can be re-run safely.

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "question_hash" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "code_hash" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "concept_key" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "objective_key" text;

-- pgcrypto provides digest(..., 'sha256').
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Backfill hashes for existing rows.
-- Normalization contract (MUST match question-hash util in apps/api-server):
--   lower + trim + collapse all whitespace runs to a single space
-- SQL equivalent of JS: input.toLowerCase().trim().replace(/\s+/g, ' ')
UPDATE "questions"
SET "question_hash" = encode(digest(lower(btrim(regexp_replace("question_text", '\s+', ' ', 'g'))), 'sha256'), 'hex')
WHERE "question_hash" IS NULL;

UPDATE "questions"
SET "code_hash" = encode(digest(lower(btrim(regexp_replace("code_snippet", '\s+', ' ', 'g'))), 'sha256'), 'hex')
WHERE "code_hash" IS NULL
  AND "code_snippet" IS NOT NULL
  AND btrim("code_snippet") <> '';

-- Existing production data may already contain active exact duplicates.
-- Keep the oldest active row protected by the unique index and set later
-- duplicate hashes to NULL so the migration remains deployable. New inserts
-- will still be blocked against the canonical row.
WITH ranked_active_duplicates AS (
    SELECT
        "id",
        row_number() OVER (
            PARTITION BY "question_hash"
            ORDER BY "created_at" ASC, "id" ASC
        ) AS duplicate_rank
    FROM "questions"
    WHERE "question_hash" IS NOT NULL
      AND "status" = 'active'
)
UPDATE "questions" q
SET "question_hash" = NULL
FROM ranked_active_duplicates d
WHERE q."id" = d."id"
  AND d.duplicate_rank > 1;

-- Fast lookup for exact duplicates
CREATE INDEX IF NOT EXISTS "idx_questions_question_hash" ON "questions" ("question_hash");

-- Race-condition safety net: only one ACTIVE question may hold a given normalized-text hash.
-- Multiple inactive/draft rows may share a hash so admins can keep historical records.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_questions_question_hash_active"
    ON "questions" ("question_hash")
    WHERE "question_hash" IS NOT NULL AND "status" = 'active';

-- Structural code duplicate lookup
CREATE INDEX IF NOT EXISTS "idx_questions_code_hash" ON "questions" ("code_hash");

-- Objective-level duplicate signal
CREATE INDEX IF NOT EXISTS "idx_questions_objective_key" ON "questions" ("objective_key");

COMMENT ON COLUMN "questions"."question_hash" IS 'SHA-256 of normalized question text. Unique among active questions (race-condition safety net).';
COMMENT ON COLUMN "questions"."code_hash" IS 'SHA-256 of whitespace-normalized code snippet. Identical code across reworded questions flags possible duplicates.';
COMMENT ON COLUMN "questions"."concept_key" IS 'Stable concept identifier (e.g. "javascript_closure_lexical_scope"). Additional duplicate signal only, never sole decider.';
COMMENT ON COLUMN "questions"."objective_key" IS 'Learning objective identifier (e.g. "javascript_closure_predict_output"). Strong signal for objective-level duplicate detection, but not mandatory gate.';
