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

  // 1. Fetch all subtopics we want to delete (slug is NOT component-architecture)
  const subtopicsToDelete = await sql`
    SELECT id, name, slug
    FROM tutorial_subtopics
    WHERE slug <> 'component-architecture'
  `;

  console.log(`\nFound ${subtopicsToDelete.length} subtopic(s) to delete:`);
  console.table(subtopicsToDelete);

  if (subtopicsToDelete.length === 0) {
    console.log('🎉 No subtopics to delete. Only component-architecture exists!');
    return;
  }

  const ids = subtopicsToDelete.map(s => s.id);
  console.log('Target IDs:', ids);

  console.log('\n--- CLEANING UP REFERENCE TABLES ---');

  const tablesToCleanup = [
    { name: 'tutorial_video_links', col: 'subtopic_id' },
    { name: 'tutorial_progress', col: 'subtopic_id' },
    { name: 'tutorial_content', col: 'subtopic_id' },
    { name: 'tutorial_assignments', col: 'subtopic_id' },
    { name: 'subtopic_flow_progress', col: 'subtopic_id' },
    { name: 'live_session_requests', col: 'subtopic_id' },
    { name: 'layman_prompt_history', col: 'subtopic_id' },
    { name: 'content_generation_jobs', col: 'subtopic_id' },
    { name: 'assignment_progress', col: 'subtopic_id' },
    { name: 'assignment_help_requests', col: 'subtopic_id' },
    { name: 'ai_section_generation_jobs', col: 'subtopic_id' },
    { name: 'ai_generation_orchestration', col: 'subtopic_id' },
    { name: 'tutorial_subsections', col: 'section_id', isSubsection: true },
    { name: 'tutorial_sections', col: 'subtopic_id' }
  ];

  for (const table of tablesToCleanup) {
    try {
      console.log(`Checking table "${table.name}"...`);
      // Check if table exists first
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table.name}
        ) as exists
      `;

      if (!tableCheck[0].exists) {
        console.log(`  - Table "${table.name}" does not exist, skipping.`);
        continue;
      }

      if (table.isSubsection) {
        // We delete subsections whose section is linked to our target subtopics
        const deletedSubsections = await sql`
          DELETE FROM tutorial_subsections
          WHERE section_id IN (
            SELECT id FROM tutorial_sections
            WHERE subtopic_id = ANY(${ids})
          )
          RETURNING id
        `;
        console.log(`  - Deleted ${deletedSubsections.length} row(s) from "${table.name}".`);
      } else {
        const deleted = await sql`
          DELETE FROM ${sql(table.name)}
          WHERE ${sql(table.col)} = ANY(${ids})
          RETURNING id
        `;
        console.log(`  - Deleted ${deleted.length} row(s) from "${table.name}".`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Warning cleaning up table "${table.name}":`, err.message);
    }
  }

  // Finally, delete the subtopics themselves
  console.log('\n--- DELETING SUBTOPICS ---');
  try {
    const deletedSubtopics = await sql`
      DELETE FROM tutorial_subtopics
      WHERE id = ANY(${ids})
      RETURNING id, slug
    `;
    console.log(`✅ Successfully deleted ${deletedSubtopics.length} subtopics from "tutorial_subtopics" table:`);
    console.table(deletedSubtopics);
  } catch (err) {
    console.error('❌ Error deleting subtopics:', err.message);
  }
}

main().catch(console.error);
