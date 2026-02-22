require('dotenv').config();
const { Client } = require('pg');
const ids = ['6bfd54eb-7a05-413b-8b50-9e8b42e51f8c','dd042892-0a02-47fc-9216-f547b477ee9e'];
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  for (const id of ids) {
    const res = await c.query(`select exam_id, total_time, stable_time_sec, logic_time_sec, neural_time_sec, question_count from attempt_analytics_mv where exam_id=$1`, [id]);
    console.log(id, res.rows);
  }
  await c.end();
})();
