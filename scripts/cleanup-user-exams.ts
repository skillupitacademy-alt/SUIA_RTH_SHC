import "dotenv/config";
import { Client } from "pg";

const TARGET_EMAIL = "ajayshah@gmail.com";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log(`🔍 Looking up user: ${TARGET_EMAIL}`);

  // 1. Find user
  const userResult = await client.query(
    `SELECT id, email FROM users WHERE email = $1`,
    [TARGET_EMAIL]
  );

  if (userResult.rows.length === 0) {
    console.error("❌ User not found.");
    await client.end();
    return;
  }

  const userId = userResult.rows[0].id;
  console.log(`✅ Found user: ${userId}`);

  // 2. Count exams
  const examCount = await client.query(
    `SELECT id, status, started_at FROM exams WHERE user_id = $1 ORDER BY started_at DESC`,
    [userId]
  );
  console.log(`📊 Found ${examCount.rows.length} exam(s):`);
  for (const row of examCount.rows) {
    console.log(`   - ${row.id} | status: ${row.status} | started: ${row.started_at}`);
  }

  if (examCount.rows.length === 0) {
    console.log("✅ No exams to delete.");
    await client.end();
    return;
  }

  // 3. Delete tutor_conversations referencing these exams (no cascade)
  const examIds = examCount.rows.map((r: any) => r.id);
  await client.query(
    `DELETE FROM tutor_conversations WHERE source_exam_id = ANY($1::uuid[])`,
    [examIds]
  ).catch(() => console.log("   ℹ️  No tutor_conversations table or no rows."));

  // 4. Delete background_jobs referencing these exams
  await client.query(
    `DELETE FROM background_jobs WHERE payload->>'examId' = ANY($1::text[])`,
    [examIds]
  ).catch(() => console.log("   ℹ️  No background_jobs table or no matching rows."));

  // 5. Delete exams (cascades to exam_questions, report_jobs, idempotency_keys, results_by_dimension)
  const deleteResult = await client.query(
    `DELETE FROM exams WHERE user_id = $1`,
    [userId]
  );
  console.log(`🗑️  Deleted ${deleteResult.rowCount} exam(s) and all related data (cascade).`);

  // 6. Refresh materialized views
  console.log("🔄 Refreshing materialized views...");
  await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY attempt_analytics_mv`).catch((e: any) => {
    console.log(`   ⚠️  MV refresh warning: ${e.message}`);
  });
  await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY attempt_dimension_accuracy_mv`).catch((e: any) => {
    console.log(`   ⚠️  MV refresh warning: ${e.message}`);
  });

  console.log("✅ Cleanup complete. User can now start fresh exams.");
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
