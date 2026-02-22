require("dotenv").config();
const { Client } = require('pg');
const examId = process.argv[2] || '0a38074c-2113-4527-bc15-1cbfc1836cea';
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query('select response_metadata, time_spent_seconds, time_spent from exam_questions where exam_id=$1 limit 5', [examId]);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})();
