const { Client } = require("pg");
const url = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require";
const attemptId = "6bfd54eb-7a05-413b-8b50-9e8b42e51f8c";
(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  const exam = await client.query(
    `select id, user_id, status from exams where id = $1`,
    [attemptId]
  );
  console.log('exam', exam.rows);
  if (exam.rows.length) {
    const user = await client.query(`select id, email from users where id = $1`, [exam.rows[0].user_id]);
    console.log('user', user.rows);
  }
  await client.end();
})();
