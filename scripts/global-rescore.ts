import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log("🚀 Starting Analytical Repair: Global Rescoring...");

  try {
    // 1. Transactional Backfill of is_correct based on answer matching
    console.log("- Analyzing historical response patterns...");
    const updateResult = await client.query(`
      WITH scored_data AS (
        SELECT 
          eq.id,
          CASE 
            WHEN trim(lower(eq.user_answer)) = trim(lower(q.correct_answer)) THEN true
            WHEN eq.user_answer IS NULL OR eq.user_answer = '' THEN false
            ELSE false -- Any mismatch count as wrong
          END as calculated_is_correct
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        WHERE eq.is_correct IS NULL
      )
      UPDATE exam_questions 
      SET is_correct = scored_data.calculated_is_correct
      FROM scored_data
      WHERE exam_questions.id = scored_data.id;
    `);
    
    console.log(`- Successfully rescored ${updateResult.rowCount} questions.`);

    // 2. Refresh Materialized Views
    console.log("- Triggering Materialized View refresh...");
    await client.query(`REFRESH MATERIALIZED VIEW attempt_analytics_mv`);
    await client.query(`REFRESH MATERIALIZED VIEW attempt_dimension_accuracy_mv`);
    
    console.log("✅ Global Rescore & View Synchronization Complete.");
  } catch (err: any) {
    console.error("❌ Analytical repair failed:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
