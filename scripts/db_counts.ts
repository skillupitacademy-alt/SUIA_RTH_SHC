import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../packages/db/.env') });
const databaseUrl = process.env.DATABASE_URL;

async function main() {
  if (!databaseUrl) throw new Error("No DB URL");
  const sql_client = neon(databaseUrl);
  
  const q = await sql_client('SELECT count(*) FROM questions');
  const s = await sql_client('SELECT count(*) FROM skills');
  const t = await sql_client('SELECT count(*) FROM topics');
  const d = await sql_client('SELECT count(*) FROM domains');
  const st = await sql_client('SELECT count(*) FROM subtopics');
  const eb = await sql_client('SELECT count(*) FROM exam_blueprints');
  const rbd = await sql_client('SELECT count(*) FROM results_by_dimension');
  const ex = await sql_client('SELECT count(*) FROM exams');
  
  console.log("DATA_TOTALS:");
  console.log("QUESTIONS:" + q[0].count);
  console.log("SKILLS:" + s[0].count);
  console.log("TOPICS:" + t[0].count);
  console.log("DOMAINS:" + d[0].count);
  console.log("SUBTOPICS:" + st[0].count);
  console.log("BLUEPRINTS:" + eb[0].count);
  console.log("RESULTS_DIM:" + rbd[0].count);
  console.log("EXAMS:" + ex[0].count);
}

main().catch(console.error);
