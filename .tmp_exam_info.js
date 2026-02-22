require('dotenv').config();
const { Client } = require('pg');
const examId = 'ce562566-6ffe-4f1a-aaa3-4c04964a7184';
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query(`SELECT id, status, started_at, completed_at FROM exams WHERE id=$1`, [examId]);
  console.log(res.rows);
  await c.end();
})();
