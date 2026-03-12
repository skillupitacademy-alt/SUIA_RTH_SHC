
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'apps/api-server/.env.local' });
const databaseUrl = process.env.DATABASE_URL;

async function main() {
  if (!databaseUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }
  
  const sql = neon(databaseUrl);
  const examId = '1466ddb1-7b55-4243-ad2a-917ba83e2638';
  
  try {
    console.log(`Checking exam ${examId}...`);
    const exam = await sql`SELECT id, user_id, status, started_at, last_answered_at, duration_seconds FROM exams WHERE id = ${examId}`;
    console.log('Exam Data:', exam[0]);

    if (exam.length > 0) {
        const user = await sql`SELECT email FROM users WHERE id = ${exam[0].user_id}`;
        console.log('User:', user[0]?.email);
        
        const answers = await sql`SELECT count(*) FROM exam_questions WHERE exam_id = ${examId} AND user_answer IS NOT NULL`;
        console.log('Answered Questions:', answers[0].count);
        
        const report = await sql`SELECT id, status FROM reports WHERE attempt_id = ${examId}`;
        console.log('Report Status:', report[0] || 'No report found');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
