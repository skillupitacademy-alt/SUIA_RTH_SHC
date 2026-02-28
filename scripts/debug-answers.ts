import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const examId = '0a38074c-2113-4527-bc15-1cbfc1836cea';

  scriptLogger.info(`Inspecting answers for Exam: ${examId}...`);

  const questions = await client.query(`
    SELECT 
      eq.user_answer,
      q.correct_answer
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = $1
  `, [examId]);

  questions.rows.forEach((row, i) => {
    scriptLogger.info(`Q${i+1}: User: [${row.user_answer}] | Correct: [${row.correct_answer}] | Match: ${row.user_answer === row.correct_answer}`);
  });

  await client.end();
}

main().catch(scriptLogger.error);

