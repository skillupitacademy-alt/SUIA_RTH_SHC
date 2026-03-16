-- Phase 11: Materialized Views for Deep Analytics

-- 1. Global Mastery Matrix
-- Aggregates accuracy and volume per Dimension (Domain, Subject, Topic, Skill)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_mastery_matrix AS
SELECT 
    dimension_type,
    dimension_id,
    name,
    AVG(accuracy)::INTEGER as avg_accuracy,
    COUNT(*) as sample_size,
    MAX(created_at) as last_updated
FROM results_by_dimension
GROUP BY dimension_type, dimension_id, name;

-- Index for concurrent refresh and fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_mastery_matrix_type_id ON mv_mastery_matrix (dimension_type, dimension_id);

-- 2. User Daily Snapshots
-- Aggregates user skill mastery per day to power trend prediction
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_daily_snapshots AS
SELECT 
    e.user_id,
    r.dimension_id,
    r.name as dimension_name,
    (e.completed_at AT TIME ZONE 'UTC')::DATE as snapshot_date,
    AVG(r.accuracy)::INTEGER as avg_accuracy
FROM results_by_dimension r
JOIN exams e ON r.exam_id = e.id
WHERE e.status = 'completed'
  AND r.dimension_type = 'skill'
GROUP BY e.user_id, r.dimension_id, r.name, (e.completed_at AT TIME ZONE 'UTC')::DATE;

-- Index for concurrent refresh and fast trajectory analysis
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_daily_snapshots_composite ON mv_user_daily_snapshots (user_id, dimension_id, snapshot_date);
