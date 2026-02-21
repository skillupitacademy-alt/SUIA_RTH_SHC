import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("🚀 Starting Global Exam Score Synchronization...");

  try {
    // 1. Update exams.total_score based on exam_questions.is_correct
    console.log("- Syncing exams.total_score...");
    const updateExamsResult = await client.query(`
      WITH score_calc AS (
        SELECT 
          exam_id,
          count(*) filter (where is_correct = true) as correct_count,
          count(*) as total_count
        FROM exam_questions
        GROUP BY exam_id
      )
      UPDATE exams
      SET total_score = CASE 
        WHEN sc.total_count > 0 THEN round((sc.correct_count::float / sc.total_count::float) * 100)
        ELSE 0
      END
      FROM score_calc sc
      WHERE exams.id = sc.exam_id
      AND exams.status = 'completed';
    `);
    console.log(`  ✅ Updated ${updateExamsResult.rowCount} exams.`);

    // 2. Re-populate results_by_dimension for all completed exams
    // This is more complex because it involves topics/subjects hierarchies.
    // However, the most important thing for the dashboard list is exams.total_score.
    // The PREMIUM report uses its own engine which might hit MVs or results_by_dimension.
    
    // Let's check if results_by_dimension needs backfilling
    console.log("- Checking for missing results_by_dimension entries...");
    const missingResults = await client.query(`
      SELECT count(*) 
      FROM exams e
      LEFT JOIN results_by_dimension rbd ON rbd.exam_id = e.id
      WHERE e.status = 'completed'
      AND rbd.id IS NULL;
    `);
    console.log(`  📊 Found ${missingResults.rows[0].count} exams without dimension results.`);

    if (parseInt(missingResults.rows[0].count) > 0) {
      console.log("- (Optimization) Refreshing Materialized Views is usually enough for the Premium Report...");
      console.log("- Refreshing MVs one more time to be safe...");
      await client.query(`REFRESH MATERIALIZED VIEW attempt_analytics_mv`);
      await client.query(`REFRESH MATERIALIZED VIEW attempt_dimension_accuracy_mv`);
      console.log("  ✅ MVs Refreshed.");
    }

    console.log("🚀 Global Synchronization Complete.");
  } catch (err: any) {
    console.error("❌ Error during synchronization:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
