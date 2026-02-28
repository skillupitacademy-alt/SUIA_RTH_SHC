import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runPhase1() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log('Starting Phase 1 - Database Analytics Layer');

  const steps = [
    {
      name: 'Step 2 - Prerequisite Indexes',
      sql: [
        'CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_id);',
        'CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);',
        'CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);',
        'CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);',
        'CREATE INDEX IF NOT EXISTS idx_results_dimension_type ON results_by_dimension(dimension_type);'
      ]
    },
    {
      name: 'Step 3 - Phase-1A Materialized Views',
      sql: [
        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_score_distribution AS
        SELECT
          width_bucket(total_score, 0, 100, 10) AS score_bucket,
          COUNT(*) AS student_count
        FROM exams
        WHERE total_score IS NOT NULL
        GROUP BY score_bucket
        ORDER BY score_bucket;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_time_boxplot AS
        SELECT
          percentile_cont(0.0) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS min_time,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS q1,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS median,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS q3,
          percentile_cont(1.0) WITHIN GROUP (ORDER BY (response_metadata->>'timeTakenSeconds')::int) AS max_time
        FROM exam_questions
        WHERE response_metadata ? 'timeTakenSeconds';`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_mastery_trend AS
        SELECT
          DATE(created_at) AS exam_date,
          AVG(accuracy) AS avg_accuracy
        FROM results_by_dimension
        GROUP BY DATE(created_at)
        ORDER BY exam_date;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_topic_performance AS
        SELECT
          dimension_id AS topic_id,
          name AS topic_name,
          AVG(accuracy) AS avg_accuracy
        FROM results_by_dimension
        WHERE dimension_type = 'topic'
        GROUP BY dimension_id, name;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_weakness_tree AS
        SELECT
          dimension_type,
          dimension_id,
          name,
          AVG(accuracy) AS avg_accuracy
        FROM results_by_dimension
        WHERE dimension_type IN ('domain', 'topic', 'skill')
        GROUP BY dimension_type, dimension_id, name;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skill_performance AS
        SELECT
          dimension_id AS skill_id,
          name AS skill_name,
          AVG(accuracy) AS avg_accuracy,
          COUNT(*) AS attempt_count
        FROM results_by_dimension
        WHERE dimension_type = 'skill'
        GROUP BY dimension_id, name;`
      ]
    },
    {
      name: 'Step 4 - Phase-1B Materialized Views',
      sql: [
        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_question_hierarchy AS
        SELECT
          d.id AS domain_id,
          d.name AS domain,
          s.id AS subject_id,
          s.name AS subject,
          t.id AS topic_id,
          t.name AS topic,
          st.id AS subtopic_id,
          st.name AS subtopic,
          COUNT(q.id) AS question_count
        FROM questions q
        LEFT JOIN subtopics st ON q.subtopic_id = st.id
        LEFT JOIN topics t ON q.topic_id = t.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN domains d ON s.domain_id = d.id
        WHERE q.status = 'active'
        GROUP BY d.id, d.name, s.id, s.name, t.id, t.name, st.id, st.name;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_topic_skill_matrix AS
        SELECT
          t.id AS topic_id,
          t.name AS topic,
          sk.id AS skill_id,
          sk.name AS skill,
          COUNT(q.id) AS question_count
        FROM question_skills qs
        JOIN questions q ON q.id = qs.question_id
        JOIN skills sk ON sk.id = qs.skill_id
        JOIN topics t ON q.topic_id = t.id
        WHERE q.status = 'active'
        GROUP BY t.id, t.name, sk.id, sk.name;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_question_pool AS
        SELECT
          topic_id,
          difficulty,
          COUNT(*) AS available_questions
        FROM questions
        WHERE status = 'active'
        GROUP BY topic_id, difficulty;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_exam_difficulty_actual AS
        SELECT
          e.blueprint_id,
          q.difficulty,
          COUNT(*) AS question_count
        FROM exam_questions eq
        JOIN exams e ON eq.exam_id = e.id
        JOIN questions q ON eq.question_id = q.id
        GROUP BY e.blueprint_id, q.difficulty;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_item_difficulty AS
        SELECT
          q.id AS question_id,
          COUNT(eq.id) AS attempt_count,
          COALESCE(
            COUNT(eq.id) FILTER (WHERE eq.is_correct) * 100.0 /
            NULLIF(COUNT(eq.id), 0),
            0
          ) AS accuracy_percent
        FROM questions q
        LEFT JOIN exam_questions eq ON eq.question_id = q.id
        GROUP BY q.id;`,

        `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_discrimination AS
        WITH ranked_exams AS (
          SELECT
            id,
            total_score,
            NTILE(100) OVER (ORDER BY total_score DESC) AS percentile
          FROM exams
          WHERE total_score IS NOT NULL
        ),
        top_exams AS (
          SELECT id FROM ranked_exams WHERE percentile <= 27
        ),
        bottom_exams AS (
          SELECT id FROM ranked_exams WHERE percentile >= 73
        )
        SELECT
          q.id AS question_id,
          AVG(CASE WHEN eq.exam_id IN (SELECT id FROM top_exams)
                   AND eq.is_correct THEN 1 ELSE 0 END) AS top_accuracy,
          AVG(CASE WHEN eq.exam_id IN (SELECT id FROM bottom_exams)
                   AND eq.is_correct THEN 1 ELSE 0 END) AS bottom_accuracy
        FROM questions q
        LEFT JOIN exam_questions eq ON eq.question_id = q.id
        GROUP BY q.id;`
      ]
    },
    {
      name: 'Step 5 - Create UNIQUE INDEXES',
      sql: [
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_question_hierarchy_pk ON mv_question_hierarchy(domain_id, subject_id, topic_id, subtopic_id);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_topic_skill_matrix_pk ON mv_topic_skill_matrix(topic_id, skill_id);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_question_pool_pk ON mv_question_pool(topic_id, difficulty);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_exam_difficulty_actual_pk ON mv_exam_difficulty_actual(blueprint_id, difficulty);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_item_difficulty_pk ON mv_item_difficulty(question_id);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_discrimination_pk ON mv_discrimination(question_id);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_topic_performance_pk ON mv_topic_performance(topic_id);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_mastery_trend_pk ON mv_mastery_trend(exam_date);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_skill_performance_pk ON mv_skill_performance(skill_id);',
        'CREATE UNIQUE INDEX IF NOT EXISTS mv_weakness_tree_pk ON mv_weakness_tree(dimension_type, dimension_id);'
      ]
    },
    {
      name: 'Step 6 - Initial Refresh',
      sql: [
        'REFRESH MATERIALIZED VIEW mv_score_distribution;',
        'REFRESH MATERIALIZED VIEW mv_time_boxplot;',
        'REFRESH MATERIALIZED VIEW mv_mastery_trend;',
        'REFRESH MATERIALIZED VIEW mv_topic_performance;',
        'REFRESH MATERIALIZED VIEW mv_weakness_tree;',
        'REFRESH MATERIALIZED VIEW mv_skill_performance;',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_question_hierarchy;',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_topic_skill_matrix;',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_question_pool;',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_exam_difficulty_actual;',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_item_difficulty;',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_discrimination;'
      ]
    }
  ];

  try {
    for (const step of steps) {
      console.log(`\n--- ${step.name} ---`);
      for (const query of step.sql) {
        try {
          await pool.query(query);
          console.log('OK Executed query successfully');
        } catch (err: any) {
          if (typeof err.message === 'string' && err.message.includes('already exists')) {
            console.log(`INFO ${err.message}`);
          } else {
            console.error(`ERROR executing query: ${err.message}`);
          }
        }
      }
    }

    console.log('\n--- Step 7 - Validation Queries ---');
    const validations = [
      { name: 'Score Distribution', query: 'SELECT * FROM mv_score_distribution LIMIT 5;' },
      { name: 'Question Hierarchy', query: 'SELECT * FROM mv_question_hierarchy LIMIT 5;' },
      { name: 'Topic-Skill Matrix', query: 'SELECT * FROM mv_topic_skill_matrix LIMIT 5;' },
      { name: 'Item Difficulty', query: 'SELECT * FROM mv_item_difficulty ORDER BY accuracy_percent ASC LIMIT 5;' }
    ];

    for (const validation of validations) {
      const res = await pool.query(validation.query);
      console.log(`\nVALIDATION: ${validation.name}:`);
      console.table(res.rows);
    }

    console.log('\nPhase 1 completed successfully.');

  } catch (error: any) {
    console.error('\nERROR: Phase 1 execution failed:', error?.message ?? error);
  } finally {
    await pool.end();
  }
}

runPhase1();
