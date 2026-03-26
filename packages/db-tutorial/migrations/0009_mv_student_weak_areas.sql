CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_weak_areas AS
SELECT
  rt.user_id,
  weak_subtopic_id AS subtopic_id,
  count(*) AS failed_count,
  max(rt.created_at) AS last_failed_at
FROM remediation_triggers rt
CROSS JOIN LATERAL jsonb_array_elements_text(rt.weak_subtopic_ids) AS weak_subtopic_id
WHERE rt.status != 'completed'
GROUP BY rt.user_id, subtopic_id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_weak_areas_user_subtopic"
  ON mv_student_weak_areas(user_id, subtopic_id);
--> statement-breakpoint
