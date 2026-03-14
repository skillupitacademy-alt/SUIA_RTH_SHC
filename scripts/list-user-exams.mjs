import { Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

if (globalThis.WebSocket === undefined) {
  globalThis.WebSocket = WebSocket;
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/list-user-exams.mjs <user-email>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Set it to the production DB connection string and retry.');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    const userRes = await client.query(
      `select id, email from users where email = $1 limit 1;`,
      [email]
    );

    if (userRes.rows.length === 0) {
      console.log(`No user found for ${email}`);
      return;
    }

    const user = userRes.rows[0];
    console.log('User:', user);

    const examsRes = await client.query(
      `
      select
        e.id,
        e.status,
        e.total_score,
        e.started_at,
        e.completed_at,
        e.duration_seconds,
        e.export_urls
      from exams e
      where e.user_id = $1
      order by e.completed_at desc nulls last, e.started_at desc;
      `,
      [user.id]
    );

    if (examsRes.rows.length === 0) {
      console.log('No exams found for user.');
      return;
    }

    console.log(`Exams (${examsRes.rows.length}):`);
    for (const row of examsRes.rows) {
      console.log(row);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
