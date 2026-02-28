import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const examId = '0a38074c-2113-4527-bc15-1cbfc1836cea';

  scriptLogger.info(`Checking exams table for: ${examId}...`);

  const rows = await client.query(`
    SELECT status, total_score, score_percentage, completed_at, started_at
    FROM exams 
    WHERE id = $1
  `, [examId]);
  
  scriptLogger.info("Exam Summary Details:", JSON.stringify(rows.rows[0], null, 2));

  await client.end();
}

main().catch(scriptLogger.error);

