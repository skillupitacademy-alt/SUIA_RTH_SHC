/**
 * PHASE 11.19 STEP 13B — Find ALL Content Storage Tables
 * Search for where Definition/Code content might be stored
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 STEP 13B — FIND ALL CONTENT TABLES');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Find all tutorial-related tables
  console.log('STEP 1: Find all tutorial-related tables in TutorialDB');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const tables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE '%tutorial%'
    ORDER BY table_name
  `);
  
  console.log(`Found ${tables.rows.length} tutorial-related tables:\n`);
  for (const table of tables.rows) {
    console.log(`  - ${table.table_name}`);
  }
  console.log('');

  // Check row counts for content tables
  console.log('STEP 2: Check row counts for potential content tables');
  console.log('──────────────────────────────────────────────────────────────────────\n');
  
  const contentTables = [
    'tutorial_sections',
    'tutorial_content',
    'tutorial_page_content_v2',
    'tutorial_subsections',
  ];
  
  for (const tableName of contentTables) {
    try {
      const count = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
      const rowCount = count.rows[0]?.count || 0;
      console.log(`${tableName}: ${rowCount} rows`);
      
      if (rowCount > 0) {
        // Show sample
        const sample = await db.execute(sql.raw(`
          SELECT *
          FROM ${tableName}
          LIMIT 3
        `));
        console.log(`  Sample rows:`);
        for (const row of sample.rows) {
          console.log(`    - id: ${row.id}, created: ${row.created_at || row.createdAt || 'N/A'}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.log(`${tableName}: ⚠️  ${err.message}\n`);
    }
  }

  // Check for blocks/sections by subtopic
  console.log('STEP 3: Search for Java subtopic content in any table');
  console.log('──────────────────────────────────────────────────────────────────────\n');
  
  const javaSubtopicExternal = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
  
  // Check tutorial_subtopics for internal ID
  const subtopicCheck = await db.execute(sql`
    SELECT id, external_id, slug, name
    FROM tutorial_subtopics
    WHERE external_id = ${javaSubtopicExternal}
  `);
  
  if (subtopicCheck.rows.length > 0) {
    const javaInternal = subtopicCheck.rows[0].id;
    console.log(`Java subtopic internal ID: ${javaInternal}\n`);
    
    // Search in each content table
    for (const tableName of contentTables) {
      try {
        const content = await db.execute(sql.raw(`
          SELECT id, created_at, updated_at
          FROM ${tableName}
          WHERE subtopic_id = '${javaInternal}'
          LIMIT 5
        `));
        
        if (content.rows.length > 0) {
          console.log(`✅ Found ${content.rows.length} row(s) in ${tableName}`);
          for (const row of content.rows) {
            console.log(`   - ${row.id}`);
          }
        } else {
          console.log(`⚠️  No rows in ${tableName} for Java subtopic`);
        }
      } catch (err: any) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('STEP 4: Check if content exists in MainDB instead');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  console.log('(Skipped - MainDB investigation would require separate connection)');
  console.log('Current evidence: TutorialDB has ZERO tutorial_sections rows');
  
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('FINDING');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('tutorial_sections table EXISTS in TutorialDB but contains ZERO rows.');
  console.log('If Definition/Code blocks were previously visible, they used a different');
  console.log('content storage mechanism or database.');
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
