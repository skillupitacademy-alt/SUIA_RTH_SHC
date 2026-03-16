CREATE MATERIALIZED VIEW IF NOT EXISTS mv_mastery_matrix AS
SELECT
  dimension_type,
  dimension_id,
  name,
  AVG(accuracy)::INTEGER AS avg_accuracy,
  COUNT(*) AS sample_size,
  MAX(created_at) AS last_updated
FROM results_by_dimension
GROUP BY dimension_type, dimension_id, name;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_mastery_matrix_type_id
ON mv_mastery_matrix (dimension_type, dimension_id);--> statement-breakpoint

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_daily_snapshots AS
SELECT
  e.user_id,
  r.dimension_id,
  r.name AS dimension_name,
  (e.completed_at AT TIME ZONE 'UTC')::DATE AS snapshot_date,
  AVG(r.accuracy)::INTEGER AS avg_accuracy
FROM results_by_dimension r
JOIN exams e ON r.exam_id = e.id
WHERE e.status = 'completed'
  AND r.dimension_type = 'skill'
GROUP BY e.user_id, r.dimension_id, r.name, (e.completed_at AT TIME ZONE 'UTC')::DATE;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_daily_snapshots_composite
ON mv_user_daily_snapshots (user_id, dimension_id, snapshot_date);--> statement-breakpoint

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_time_boxplot AS
SELECT
  percentile_cont(0.0) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS min_time,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS q1,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS median,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS q3,
  percentile_cont(1.0) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS max_time
FROM exam_questions
WHERE response_metadata ? 'timeTakenSeconds';--> statement-breakpoint

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_performers AS
SELECT
  e.user_id,
  COALESCE(u.email, '') AS email,
  AVG(e.total_score)::NUMERIC(10,2) AS avg_score,
  COUNT(*)::INTEGER AS exams_taken
FROM exams e
LEFT JOIN users u ON u.id = e.user_id
WHERE e.status = 'completed'
  AND e.total_score IS NOT NULL
GROUP BY e.user_id, u.email;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS mv_top_performers_pk
ON mv_top_performers (user_id);
