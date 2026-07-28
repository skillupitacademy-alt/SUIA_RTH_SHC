import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const dbUrl = process.env.DATABASE_URL_TUTORIAL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL_TUTORIAL not defined');
    return;
  }

  const sql = neon(dbUrl);
  
  console.log('\n--- FETCHING SUBTOPIC whatisjava ---');
  const subtopics = await sql`
    SELECT id, name, slug
    FROM tutorial_subtopics
    WHERE slug = 'whatisjava'
  `;

  if (subtopics.length === 0) {
    console.log('No subtopic found with slug whatisjava');
    return;
  }

  const subtopicId = subtopics[0].id;
  const notesSections = await sql`
    SELECT id, content
    FROM tutorial_sections
    WHERE subtopic_id = ${subtopicId} AND section_type = 'notes'
  `;

  if (notesSections.length === 0) {
    console.log('No notes section found for whatisjava');
  } else {
    console.log('Notes content keys:', Object.keys(notesSections[0].content || {}));
    console.log('concept_card key content:', JSON.stringify(notesSections[0].content?.concept_card, null, 2));
  }
}

main().catch(console.error);
