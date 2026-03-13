import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: 'apps/api-server/.env.local' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('--- Inspecting Materialized Views ---');
    
    const views = ['attempt_analytics_mv', 'attempt_dimension_accuracy_mv'];
    for (const view of views) {
      console.log(`\nView: ${view}`);
      try {
        const cols = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${view}'
        `);
        if (cols.rows.length === 0) {
          // It might be because they are Materialized Views, information_schema.columns doesn't always show them in some PG versions/configs
          // Try another way
          const cols2 = await pool.query(`
            SELECT a.attname as column_name
            FROM pg_catalog.pg_attribute a
            JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = '${view}' AND a.attnum > 0 AND NOT a.attisdropped
          `);
          console.log('Columns (pg_catalog):', cols2.rows.map(r => r.column_name).join(', '));
        } else {
          console.log('Columns (information_schema):', cols.rows.map(r => r.column_name).join(', '));
        }
        
        const count = await pool.query(`SELECT COUNT(*) FROM ${view}`);
        console.log('Total Rows:', count.rows[0].count);
      } catch (err) {
        console.error(`Error inspecting ${view}:`, err.message);
      }
    }

    const userRes = await pool.query("SELECT id FROM users WHERE email = 'ajayshah@gmail.com'");
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      const examRes = await pool.query("SELECT id FROM exams WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1", [userId]);
      if (examRes.rows.length > 0) {
        const examId = examRes.rows[0].id;
        console.log(`\nLatest Exam for User: ${examId}`);
        for (const view of views) {
             const check = await pool.query(`SELECT COUNT(*) FROM ${view} WHERE exam_id = $1`, [examId]);
             console.log(`${view} has ${check.rows[0].count} rows for this exam.`);
        }
      }
    }

  } finally {
    await pool.end();
  }
}
run();
