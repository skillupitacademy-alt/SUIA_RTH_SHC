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
    
    const examRes = await pool.query("SELECT id FROM exams WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1", [userId]);
    if (examRes.rows.length === 0) { console.log('No exams found'); return; }
    const examId = examRes.rows[0].id;
    console.log('Testing Exam ID:', examId);

    console.log('\n--- Step 1: Manually clearing results_by_dimension (simulating fresh scoring) ---');
    await pool.query("DELETE FROM results_by_dimension WHERE exam_id = $1", [examId]);

    console.log('\n--- Step 2: Running ScoringEngine.calculateExamResults ---');
    // Note: In a real environment, we'd use the container, but here we'll let ScoringEngine handle its own lazy loading
    // We already have NODE_ENV=production potential issues handled in the past
    
    const { ScoringEngine } = await import('../apps/api-server/src/modules/scoring-engine/scoring.engine');
    await ScoringEngine.calculateExamResults(examId);
    console.log('✅ Scoring engine run successfully.');

    console.log('\n--- Step 3: Verifying Materialized View population ---');
    const mvRes = await pool.query("SELECT COUNT(*) FROM attempt_dimension_accuracy_mv WHERE exam_id = $1", [examId]);
    console.log('Rows in attempt_dimension_accuracy_mv:', mvRes.rows[0].count);

    if (parseInt(mvRes.rows[0].count) > 0) {
      console.log('\n✅ VERIFICATION SUCCESS: ScoringEngine automatically triggered MV refresh.');
    } else {
      console.log('\n❌ VERIFICATION FAILURE: MV is empty. Check if refreshAnalytics() was called.');
    }

  } catch (err) {
    console.error('Verification failed:', err);
    if (err instanceof Error) {
        console.error('Error Stack:', err.stack);
    }
  } finally {
    await pool.end();
  }
}

verify();
