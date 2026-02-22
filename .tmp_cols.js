require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='exam_questions'");
  console.log(res.rows.map(r => r.column_name));
  await c.end();
})();
