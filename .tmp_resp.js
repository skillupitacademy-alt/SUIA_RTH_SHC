require('dotenv').config();
const { Client } = require('pg');
const examId = process.argv[2] || '0a38074c-2113-4527-bc15-1cbfc1836cea';
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query('SELECT response_metadata FROM exam_questions WHERE exam_id=$1 LIMIT 5', [examId]);
  console.log(res.rows);
  await c.end();
})();
