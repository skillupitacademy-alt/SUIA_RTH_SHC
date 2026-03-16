const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query("SELECT COUNT(*)::int AS count FROM questions");
  console.log(res.rows[0].count);
  await c.end();
})();
