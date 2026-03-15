import { Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

if (globalThis.WebSocket === undefined) {
  globalThis.WebSocket = WebSocket;
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/delete-user-exams.mjs <user-email>');
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
    await client.query('BEGIN');

    const userRes = await client.query(
      `select id, email from users where email = $1 limit 1;`,
      [email]
    );

    if (userRes.rows.length === 0) {
      console.log(`No user found for ${email}`);
      await client.query('ROLLBACK');
      return;
    }

    const user = userRes.rows[0];
    const examsRes = await client.query(
      `select id from exams where user_id = $1;`,
      [user.id]
    );

    if (examsRes.rows.length === 0) {
      console.log(`No exams found for ${email}`);
      await client.query('ROLLBACK');
      return;
    }

    const examIds = examsRes.rows.map((r) => r.id);
    console.log(`Deleting ${examIds.length} exams for ${email}`);

    // Remove related data that isn't guaranteed by cascade
    await client.query(
      `delete from reports where attempt_id = any($1::uuid[]);`,
      [examIds]
    );
    await client.query(
      `delete from report_jobs where exam_id = any($1::uuid[]);`,
      [examIds]
    );
    await client.query(
      `delete from exam_questions where exam_id = any($1::uuid[]);`,
      [examIds]
    );
    await client.query(
      `delete from results_by_dimension where exam_id = any($1::uuid[]);`,
      [examIds]
    );
    await client.query(
      `delete from idempotency_keys where exam_id = any($1::uuid[]);`,
      [examIds]
    );

    const deletedExams = await client.query(
      `delete from exams where id = any($1::uuid[]);`,
      [examIds]
    );

    await client.query('COMMIT');
    console.log(`Deleted exams: ${deletedExams.rowCount ?? 0}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Deletion failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
