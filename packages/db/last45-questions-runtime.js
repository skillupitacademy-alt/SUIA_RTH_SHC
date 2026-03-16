const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query("SELECT COUNT(*)::int AS count, MIN(created_at) AS earliest, MAX(created_at) AS latest FROM (SELECT created_at FROM questions ORDER BY created_at DESC LIMIT 45) t");
  console.log(JSON.stringify(res.rows[0]));
  await c.end();
})();
