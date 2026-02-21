import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  const res = await client.query(`
    SELECT id, total_score, status, completed_at 
    FROM exams 
    ORDER BY completed_at DESC 
    LIMIT 5
  `);
  
  console.table(res.rows);
  
  await client.end();
}

main().catch(console.error);
