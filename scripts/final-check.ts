import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: 'apps/api-server/.env.local' });

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const examId = '23987c38-dbce-4d68-b7bb-5df80b8caa5f';
    const res = await pool.query("SELECT COUNT(*) FROM attempt_dimension_accuracy_mv WHERE exam_id = $1", [examId]);
    console.log(`Exam ${examId} has ${res.rows[0].count} dimension rows in MV.`);
    
    if (parseInt(res.rows[0].count) > 0) {
        console.log('✅ Final verification passed.');
    } else {
        console.log('❌ Final verification failed.');
    }
  } finally {
    await pool.end();
  }
}
check();
