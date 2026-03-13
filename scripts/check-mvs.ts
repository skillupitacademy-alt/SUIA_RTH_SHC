import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: 'apps/api-server/.env.local' });

async function checkMvs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'ajayshah@gmail.com'");
    if (userRes.rows.length === 0) { console.log('User not found'); return; }
    const userId = userRes.rows[0].id;
    
    const examRes = await pool.query("SELECT id FROM exams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
    if (examRes.rows.length === 0) { console.log('No exams found'); return; }
    const examId = examRes.rows[0].id;
    console.log('Exam ID:', examId);

    console.log('\n--- attempt_analytics_mv ---');
    const analyticsRes = await pool.query("SELECT * FROM attempt_analytics_mv WHERE exam_id = $1", [examId]);
    console.log('Rows:', analyticsRes.rows.length);
    if (analyticsRes.rows.length > 0) {
      console.log('Score:', analyticsRes.rows[0].score);
      console.log('Question Count:', analyticsRes.rows[0].question_count);
    }

    console.log('\n--- attempt_dimension_accuracy_mv ---');
    const dimsRes = await pool.query("SELECT * FROM attempt_dimension_accuracy_mv WHERE exam_id = $1", [examId]);
    console.log('Rows:', dimsRes.rows.length);
    dimsRes.rows.forEach(r => {
      console.log(`Topic: ${r.topic_id} | Subtopic: ${r.subtopic} | Skill: ${r.skill} | Acc: ${r.accuracy} | Attempts: ${r.attempts}`);
    });

    if (dimsRes.rows.length === 0) {
      console.log('\n--- Checking why DIMS might be empty ---');
      const baseCheck = await pool.query(`
        SELECT COUNT(*) 
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        WHERE eq.exam_id = $1
      `, [examId]);
      console.log('Base questions in DB for this exam:', baseCheck.rows[0].count);

      const refreshCheck = await pool.query("SELECT COUNT(*) FROM attempt_dimension_accuracy_mv");
      console.log('Total rows in attempt_dimension_accuracy_mv:', refreshCheck.rows[0].count);
    }

  } finally {
    await pool.end();
  }
}
checkMvs().catch(console.error);
