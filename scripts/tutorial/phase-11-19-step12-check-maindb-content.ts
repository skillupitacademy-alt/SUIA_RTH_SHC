/**
 * PHASE 11.19 STEP 12 — Check MainDB for Java Tutorial Content
 * Determine if content exists in the authoritative source database
 */

import 'dotenv/config';
import { getDb } from '@quiz/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 STEP 12 — CHECK MAINDB FOR JAVA CONTENT');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const db = getDb();

  // Check subtopic in MainDB
  console.log('1. MainDB Subtopic:');
  const subtopicResult = await db.execute(sql.raw(`
    SELECT id, name, slug
    FROM subtopics
    WHERE id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
  `));
  
  if (subtopicResult.rows.length === 0) {
    console.log('❌ Subtopic not found in MainDB');
    process.exit(1);
  }
  
  const subtopic = subtopicResult.rows[0];
  console.log(`   ✅ Subtopic: ${subtopic.name} (${subtopic.slug})\n`);

  // Check if MainDB has tutorial content tables
  console.log('2. MainDB Tables Check:');
  
  const tables = await db.execute(sql.raw(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('tutorials', 'tutorial_sections', 'tutorial_content', 'tutorial_page_content_v2')
    ORDER BY table_name
  `));
  
  console.log(`   Found ${tables.rows.length} tutorial content table(s):`);
  for (const table of tables.rows) {
    console.log(`   - ${table.table_name}`);
  }
  console.log('');

  // Check for content in each existing table
  if (tables.rows.length > 0) {
    for (const table of tables.rows) {
      console.log(`3. Content in ${table.table_name}:`);
      
      try {
        const content = await db.execute(sql.raw(`
          SELECT id, created_at, updated_at
          FROM ${table.table_name}
          WHERE subtopic_id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
          LIMIT 5
        `));
        
        if (content.rows.length === 0) {
          console.log(`   ⚠️  No content found for Java subtopic\n`);
        } else {
          console.log(`   ✅ Found ${content.rows.length} record(s):`);
          for (const record of content.rows) {
            console.log(`      - id: ${record.id}, created: ${record.created_at}`);
          }
          console.log('');
        }
      } catch (err: any) {
        console.log(`   ⚠️  Error querying: ${err.message}\n`);
      }
    }
  }

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('DIAGNOSIS:');
  console.log('══════════════════════════════════════════════════════════════════════');
  
  if (tables.rows.length === 0) {
    console.log('MainDB does NOT contain tutorial content tables.');
    console.log('Tutorial content is managed in TutorialDB only.');
  } else {
    console.log('MainDB contains tutorial content tables.');
    console.log('Content must be authored via Composer and synced to TutorialDB.');
  }
  
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
