-- Materialized Views for Dashboard Analytics (Task 113)

-- 1. User Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE email_verified IS NOT NULL) as verified_users,
    (SELECT COUNT(DISTINCT user_id) FROM exams WHERE started_at >= NOW() - INTERVAL '1 day') as active_users_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
    (SELECT COUNT(*) FROM domains) as total_domains
FROM users;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_user_stats ON mv_user_stats (total_users);

-- 2. Exam Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_exam_stats AS
SELECT 
    COUNT(*) as total_exams,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_exams,
    AVG(total_score) FILTER (WHERE status = 'completed') as avg_score,
    status,
    COUNT(*) as count_by_status
FROM exams
GROUP BY status;

-- Wait, the GROUP BY status might make it hard for a single row total_exams.
-- Let's refactor to a more flat structure for dashboard if needed, or keep it granular.
-- Let's do a flatter one for global metrics.

DROP MATERIALIZED VIEW IF EXISTS mv_exam_stats;
CREATE MATERIALIZED VIEW mv_exam_stats AS
SELECT 
    COUNT(*) as total_exams,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_exams,
    AVG(total_score) FILTER (WHERE status = 'completed') as avg_score,
    COUNT(*) FILTER (WHERE status = 'started') as started_exams,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_exams,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'completed') as avg_completion_time_seconds
FROM exams;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_exam_stats ON mv_exam_stats (total_exams);

-- 2.1 Exam Status Distribution
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_exam_status_stats AS
SELECT 
    status,
    COUNT(*) as count
FROM exams
GROUP BY status;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_exam_status_stats ON mv_exam_status_stats (status);

-- 2.2 Exam Activity by Domain
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_domain_activity_stats AS
SELECT 
    name as domain_name,
    COUNT(DISTINCT exam_id) as count
FROM results_by_dimension
WHERE dimension_type = 'domain'
GROUP BY name;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_domain_activity_stats ON mv_domain_activity_stats (domain_name);

-- 2.3 Efficiency Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_efficiency_stats AS
SELECT 
    CASE 
      WHEN is_correct = true 
           AND (response_metadata->>'timeSpentSeconds') ~ '^[0-9]+$' 
           AND CAST(response_metadata->>'timeSpentSeconds' as integer) <= 60 
           THEN 'mastery'
      WHEN is_correct = true 
           AND (response_metadata->>'timeSpentSeconds') ~ '^[0-9]+$' 
           AND CAST(response_metadata->>'timeSpentSeconds' as integer) > 60 
           THEN 'persistence'
      WHEN is_correct = false 
           AND (response_metadata->>'timeSpentSeconds') ~ '^[0-9]+$' 
           AND CAST(response_metadata->>'timeSpentSeconds' as integer) <= 60 
           THEN 'rash'
      WHEN is_correct = false 
           AND (response_metadata->>'timeSpentSeconds') ~ '^[0-9]+$' 
           AND CAST(response_metadata->>'timeSpentSeconds' as integer) > 60 
           THEN 'struggle'
      ELSE 'no_data'
    END as quadrant,
    COUNT(*) as count
FROM exam_questions
WHERE is_correct IS NOT NULL
GROUP BY 1;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_efficiency_stats ON mv_efficiency_stats (quadrant);

-- 3. Question Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_question_stats AS
SELECT 
    COUNT(*) as total_questions,
    difficulty,
    type,
    COUNT(*) as count_by_difficulty_type
FROM questions
GROUP BY difficulty, type;

-- Again, let's do a more useful one for the dashboard
DROP MATERIALIZED VIEW IF EXISTS mv_question_stats;
CREATE MATERIALIZED VIEW mv_question_stats AS
SELECT 
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE difficulty = 'simple') as count_simple,
    COUNT(*) FILTER (WHERE difficulty = 'intermediate') as count_intermediate,
    COUNT(*) FILTER (WHERE difficulty = 'expert') as count_expert,
    COUNT(*) FILTER (WHERE status = 'active') as active_questions
FROM questions;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_question_stats ON mv_question_stats (total_questions);

-- 4. Content Readiness (Per Topic)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_content_readiness AS
SELECT 
    t.id as topic_id,
    t.name as topic_name,
    COUNT(q.id) as question_count,
    COUNT(q.id) FILTER (WHERE q.difficulty = 'simple') as simple_count,
    COUNT(q.id) FILTER (WHERE q.difficulty = 'intermediate') as intermediate_count,
    COUNT(q.id) FILTER (WHERE q.difficulty = 'expert') as expert_count,
    CASE WHEN COUNT(q.id) >= 10 THEN true ELSE false END as is_ready
FROM topics t
LEFT JOIN questions q ON q.topic_id = t.id
WHERE q.status = 'active' OR q.id IS NULL
GROUP BY t.id, t.name;

CREATE UNIQUE INDEX IF NOT EXISTS ui_mv_content_readiness ON mv_content_readiness (topic_id);
