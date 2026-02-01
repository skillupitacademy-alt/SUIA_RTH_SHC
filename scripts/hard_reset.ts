import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from packages/db
dotenv.config({ path: path.join(__dirname, '../packages/db/.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not defined in packages/db/.env");
  process.exit(1);
}

async function main() {
  console.log("🧨 PROCEEDING WITH HARD RESET...");
  console.log("⚠️ This will purge Subjects, Topics, Subtopics, Questions, Exams, and Analytics.");
  
  const sql_client = neon(databaseUrl!);

  try {
    // We use TRUNCATE with CASCADE to handle foreign key constraints efficiently.
    // Order matters to minimize cascade noise, but CASCADE handles the heavy lifting.
    
    console.log("⏳ Purging transactional data...");
    await sql_client('TRUNCATE TABLE results_by_dimension RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE exam_questions RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE exams RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE exam_blueprints RESTART IDENTITY CASCADE');
    
    console.log("⏳ Purging educational hierarchy...");
    await sql_client('TRUNCATE TABLE questions RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE subtopics RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE topic_skills RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE topics RESTART IDENTITY CASCADE');
    await sql_client('TRUNCATE TABLE subjects RESTART IDENTITY CASCADE');

    console.log("\n✅ RESET COMPLETE.");
    console.log("🛡️ Preserved: Domains, Skills, Users, Roles, and Audit Logs.");
  } catch (e) {
    console.error("\n❌ RESET FAILED:", e);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
