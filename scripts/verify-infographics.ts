import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: 'apps/api-server/.env.local' });

async function verify() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
      console.error('DATABASE_URL not found');
      return;
  }
  const pool = new Pool({ connectionString });
  
  try {
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'ajayshah@gmail.com'");
    if (userRes.rows.length === 0) { console.log('User not found'); return; }
    const userId = userRes.rows[0].id;
    
    // 1. Get latest exam and clear its dimension results to simulate fresh scoring
    const examRes = await pool.query("SELECT id FROM exams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
    if (examRes.rows.length === 0) { console.log('No exams found'); return; }
    const examId = examRes.rows[0].id;
    console.log('Exam ID:', examId);

    console.log('\n--- Resetting dimension data for verification ---');
    await pool.query("DELETE FROM results_by_dimension WHERE exam_id = $1", [examId]);

    console.log('\n--- Running ScoringEngine.calculateExamResults via dynamic import ---');
    // Using dynamic import to avoid bundling issues in a script
    const { ScoringEngine } = await import('../apps/api-server/src/modules/scoring-engine/scoring.engine');
    
    // Mocking container if needed, but ScoringEngine.calculateExamResults should handle it
    await ScoringEngine.calculateExamResults(examId);
    console.log('Scoring completed.');

    console.log('\n--- Checking results_by_dimension ---');
    const dimRes = await pool.query("SELECT COUNT(*) FROM results_by_dimension WHERE exam_id = $1", [examId]);
    console.log('Rows in results_by_dimension:', dimRes.rows[0].count);

    console.log('\n--- Checking attempt_dimension_accuracy_mv ---');
    const mvRes = await pool.query("SELECT COUNT(*) FROM attempt_dimension_accuracy_mv WHERE exam_id = $1", [examId]);
    console.log('Rows in attempt_dimension_accuracy_mv:', mvRes.rows[0].count);

    if (parseInt(mvRes.rows[0].count) > 0) {
      console.log('✅ SUCCESS: Materialized View was automatically refreshed!');
    } else {
      console.log('❌ FAILURE: Materialized View still empty.');
    }

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await pool.end();
  }
}

verify();
