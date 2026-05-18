import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from workspace root .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const dbUrl = process.env.DATABASE_URL_TUTORIAL;
  console.log('📊 Connecting to DATABASE_URL_TUTORIAL:', dbUrl ? 'Found' : 'NOT FOUND');
  if (!dbUrl) {
    console.error('❌ DATABASE_URL_TUTORIAL not defined');
    return;
  }

  const sql = neon(dbUrl);
  
  console.log('\n--- FETCHING ALL SUBTOPICS ---');
  const subtopics = await sql`
    SELECT id, topic_id, name, slug, created_at
    FROM tutorial_subtopics
  `;
  console.log(`Found ${subtopics.length} subtopic(s):`);
  console.table(subtopics);

  console.log('\n--- SECTION COUNTS PER SUBTOPIC ---');
  const sectionCounts = await sql`
    SELECT subtopic_id, COUNT(*) as count
    FROM tutorial_sections
    GROUP BY subtopic_id
  `;
  console.table(sectionCounts);
}

main().catch(console.error);
