import * as dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: 'apps/api-server/.env.local' });

async function check() {
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
    
    const examRes = await pool.query("SELECT id, status, completed_at, total_score FROM exams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
    if (examRes.rows.length === 0) { console.log('No exams found'); return; }
    const examId = examRes.rows[0].id;
    console.log('--- Exam Context ---');
    console.log('Exam ID:', examId);
    console.log('Status:', examRes.rows[0].status);
    console.log('Score:', examRes.rows[0].total_score);

    console.log('\n--- Checking Questions Table Columns ---');
    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'questions'");
    console.log('Columns in questions table:', colsRes.rows.map(r => r.column_name).join(', '));

    console.log('\n--- Exam Questions (snake_case check) ---');
    // Using * to avoid missing column error while we debug
    const questionsRes = await pool.query(`
        SELECT eq.id as eq_id, q.*
        FROM exam_questions eq 
        JOIN questions q ON eq.question_id = q.id 
        WHERE eq.exam_id = $1
    `, [examId]);
    console.log('Questions found:', questionsRes.rows.length);
    questionsRes.rows.forEach((r, idx) => {
      // Find the question text and subtopic id dynamically
      const text = r.question_text || r.text || 'N/A';
      const subtopicId = r.subtopic_id;
      console.log(`${idx+1}. Q: ${String(text).substring(0, 40)}... | Subtopic ID: ${subtopicId || 'NULL'}`);
    });

    console.log('\n--- Dimension Results (results_by_dimension) ---');
    const dimRes = await pool.query("SELECT dimension_type, dimension_id, name, score, accuracy FROM results_by_dimension WHERE exam_id = $1", [examId]);
    console.log('Dimension Results found:', dimRes.rows.length);
    dimRes.rows.forEach(r => {
      console.log(`Type: ${r.dimension_type.padEnd(10)} | Name: ${String(r.name).padEnd(30)} | Accuracy: ${r.accuracy}`);
    });

  } finally {
    await pool.end();
  }
}
check().catch(console.error);
