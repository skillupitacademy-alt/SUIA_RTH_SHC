import { Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

if (globalThis.WebSocket === undefined) {
  // Neon serverless needs a WebSocket implementation in Node.
  globalThis.WebSocket = WebSocket;
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/check-export-data.mjs <user-email>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Set it to the production DB connection string and retry.');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    const examRes = await client.query(
      `
      select e.id, e.status, e.user_id
      from exams e
      join users u on u.id = e.user_id
      where u.email = $1
      order by e.completed_at desc
      limit 1;
      `,
      [email]
    );

    if (examRes.rows.length === 0) {
      console.log(`No exam found for ${email}`);
      return;
    }

    const exam = examRes.rows[0];
    console.log('Latest exam:', exam);

    const examId = exam.id;

    const eqCountRes = await client.query(
      `select count(*) from exam_questions where exam_id = $1;`,
      [examId]
    );
    console.log('exam_questions count:', Number(eqCountRes.rows[0]?.count ?? 0));

    const joinCountRes = await client.query(
      `
      select count(*)
      from exam_questions eq
      join questions q on q.id = eq.question_id
      where eq.exam_id = $1;
      `,
      [examId]
    );
    console.log('exam_questions → questions join count:', Number(joinCountRes.rows[0]?.count ?? 0));

    const mvRes = await client.query(
      `select * from attempt_analytics_mv where exam_id = $1;`,
      [examId]
    );
    console.log('attempt_analytics_mv rows:', mvRes.rowCount ?? 0);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
