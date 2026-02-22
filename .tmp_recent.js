require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query(`
    select e.id, e.started_at, e.completed_at,
           count(*) as questions,
           count(*) filter (where eq.response_metadata ? 'timeSpentSeconds') as with_times
    from exams e
    join exam_questions eq on eq.exam_id = e.id
    where e.started_at >= now() - interval '3 days'
    group by e.id
    order by e.started_at desc
    limit 10;
  `);
  console.log(res.rows);
  await c.end();
})();
