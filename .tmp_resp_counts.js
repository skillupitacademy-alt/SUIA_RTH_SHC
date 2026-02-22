require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query("SELECT exam_id, count(*) as cnt FROM exam_questions WHERE response_metadata ? 'timeSpentSeconds' GROUP BY exam_id ORDER BY cnt DESC LIMIT 5");
  console.log(res.rows);
  await c.end();
})();
