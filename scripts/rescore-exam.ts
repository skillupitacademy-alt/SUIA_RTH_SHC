import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const examId = '0a38074c-2113-4527-bc15-1cbfc1836cea';

  console.log(`🚀 Rescoring Exam: ${examId}...`);

  try {
    // 1. Fetch the user answers and correct answers
    const questions = await client.query(`
      SELECT 
        eq.id as eq_id,
        eq.user_answer,
        q.correct_answer,
        q.difficulty
      FROM exam_questions eq
      JOIN questions q ON q.id = eq.question_id
      WHERE eq.exam_id = $1
    `, [examId]);

    console.log(`- Found ${questions.rows.length} questions to rescore.`);

    let correctCount = 0;
    for (const row of questions.rows) {
      const isCorrect = row.user_answer === row.correct_answer;
      if (isCorrect) correctCount++;

      // Update the exam_question row
      await client.query(`
        UPDATE exam_questions 
        SET is_correct = $1 
        WHERE id = $2
      `, [isCorrect, row.eq_id]);
    }

    const scorePercentage = (correctCount / questions.rows.length) * 100;
    console.log(`- Rescoring complete: ${correctCount}/${questions.rows.length} correct (${scorePercentage}%).`);

    // 2. Refresh the Materialized Views
    console.log("- Refreshing Materialized Views...");
    await client.query(`REFRESH MATERIALIZED VIEW attempt_analytics_mv`);
    await client.query(`REFRESH MATERIALIZED VIEW attempt_dimension_accuracy_mv`);

    console.log("✅ Exam rescored and analytical views refreshed.");
  } catch (err: any) {
    console.error("❌ Rescoring failed:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
