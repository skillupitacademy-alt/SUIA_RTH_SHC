import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("🚀 Initializing Precision-Hardened Analytical Views...");

  try {
    console.log("- Dropping existing views...");
    await client.query(`DROP MATERIALIZED VIEW IF EXISTS attempt_analytics_mv CASCADE`);
    await client.query(`DROP MATERIALIZED VIEW IF EXISTS attempt_dimension_accuracy_mv CASCADE`);
  } catch (e: any) {
    console.warn("- Warning during drop:", e.message);
  }

  const queries = [
    {
      name: "MV: attempt_analytics_mv",
      sql: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS attempt_analytics_mv AS
        WITH base_metrics AS (
          SELECT
            eq.exam_id,
            eq.is_correct::int as outcome,
            (eq.response_metadata->>'timeSpentSeconds')::int as time_sec,
            lower(q.difficulty::text) as diff_label
          FROM exam_questions eq
          JOIN questions q ON q.id = eq.question_id
        ),
        medians AS (
          SELECT 
            exam_id,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_sec) as m_time
          FROM base_metrics
          GROUP BY exam_id
        )
        SELECT
          bm.exam_id,
          COUNT(*) AS question_count,
          AVG(bm.outcome) * 100 AS score,
          COALESCE(
            SUM(
              bm.outcome * 
              CASE bm.diff_label 
                WHEN 'simple' THEN 1 
                WHEN 'intermediate' THEN 2 
                WHEN 'expert' THEN 3 
                ELSE 1 
              END
            )::numeric 
            / NULLIF(SUM(
              CASE bm.diff_label 
                WHEN 'simple' THEN 1 
                WHEN 'intermediate' THEN 2 
                WHEN 'expert' THEN 3 
                ELSE 1 
              END
            ), 0) * 100,
            0
          ) AS mastery,
          AVG(
            CASE WHEN bm.diff_label IN ('intermediate','expert') 
            THEN bm.outcome END
          ) * 100 AS mh_accuracy,
          AVG(bm.time_sec) AS avg_time,
          MAX(m.m_time) AS median_time,
          SUM(bm.time_sec) as total_time,
          COUNT(*) FILTER (WHERE bm.time_sec <= m.m_time AND bm.outcome = 0) AS fast_wrong,
          COUNT(*) FILTER (WHERE bm.time_sec > m.m_time AND bm.outcome = 0) AS slow_wrong,
          COUNT(*) FILTER (WHERE bm.time_sec > m.m_time AND bm.outcome = 1) AS slow_correct,
          COUNT(*) FILTER (WHERE bm.time_sec <= m.m_time AND bm.outcome = 1) AS fast_correct,
          COUNT(*) FILTER (WHERE bm.time_sec < 35 AND bm.outcome = 1) as stable_count,
          COUNT(*) FILTER (WHERE bm.time_sec >= 35 AND bm.outcome = 1) as logic_count,
          COUNT(*) FILTER (WHERE bm.outcome = 0) as error_count
        FROM base_metrics bm
        JOIN medians m ON m.exam_id = bm.exam_id
        GROUP BY bm.exam_id;
      `
    },
    {
      name: "MV: attempt_dimension_accuracy_mv",
      sql: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS attempt_dimension_accuracy_mv AS
        SELECT
          eq.exam_id,
          q.topic_id,
          q.subtopic_id,
          s.name as subtopic,
          sk.name as skill,
          lower(q.difficulty::text) as level,
          COUNT(*) AS attempts,
          AVG(eq.is_correct::int) * 100 AS accuracy
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        LEFT JOIN subtopics s ON s.id = q.subtopic_id
        LEFT JOIN question_skills qs ON qs.question_id = q.id
        LEFT JOIN skills sk ON sk.id = qs.skill_id
        GROUP BY eq.exam_id, q.topic_id, q.subtopic_id, s.name, sk.name, q.difficulty;
      `
    },
    {
      name: "INDEX: idx_attempt_analytics_exam_id",
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_attempt_analytics_exam_id ON attempt_analytics_mv (exam_id);`
    },
    {
      name: "INDEX: idx_attempt_dim_accuracy_unique",
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_attempt_dim_accuracy_unique ON attempt_dimension_accuracy_mv (exam_id, topic_id, COALESCE(subtopic_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(skill, ''), level);`
    }
  ];

  for (const q of queries) {
    try {
      console.log(`- Executing: ${q.name}...`);
      await client.query(q.sql);
      console.log(`  ✅ ${q.name} complete.`);
    } catch (err: any) {
      console.error(`  ❌ Failed ${q.name}:`, err.message);
      process.exit(1);
    }
  }

  await client.end();
  console.log("✅ Analysis engine fully initialized.");
}

main().catch(console.error);
