/**
 * Check V2 tables and content
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkV2Tables() {
  console.log('========================================');
  console.log('V2 Tables Check');
  console.log('========================================\n');

  try {
    // Find all V2 tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%_v2%' OR table_name LIKE '%v2%')
      ORDER BY table_name;
    `);

    console.log('V2 Tables found:');
    for (const row of tables.rows) {
      console.log(`  - ${row.table_name}`);
    }
    console.log('');

    // Check row counts for v2 tables
    console.log('## Row Counts\n');
    for (const tableRow of tables.rows) {
      const tableName = tableRow.table_name;
      try {
        const count = await db.execute(sql.raw(`SELECT COUNT(*) FROM "${tableName}";`));
        console.log(`${tableName}: ${count.rows[0]?.count || 0} rows`);
      } catch (e) {
        console.log(`${tableName}: error counting`);
      }
    }

    // Check tutorial_page_content_v2 specifically
    const pageContentCount = await db.execute(sql`
      SELECT COUNT(*) FROM tutorial_page_content_v2;
    `);

    const count = Number(pageContentCount.rows[0]?.count || 0);
    console.log(`\ntutorial_page_content_v2: ${count} rows\n`);

    if (count > 0) {
      // Get sample content
      const samplePages = await db.execute(sql`
        SELECT 
          id,
          subtopic_id,
          difficulty,
          status,
          section_type,
          version,
          brand_id,
          created_at
        FROM tutorial_page_content_v2
        LIMIT 10;
      `);

      console.log('Sample pages from tutorial_page_content_v2:\n');
      for (const row of samplePages.rows) {
        console.log(`  - ID: ${row.id}`);
        console.log(`    Subtopic: ${row.subtopic_id}`);
        console.log(`    Section Type: ${row.section_type}`);
        console.log(`    Difficulty: ${row.difficulty}`);
        console.log(`    Status: ${row.status}`);
        console.log(`    Version: ${row.version}`);
        console.log(`    Brand: ${row.brand_id}`);
        console.log(`    Created: ${row.created_at}`);
        console.log('');
      }

      // Check for definition blocks
      const definitionCheck = await db.execute(sql`
        SELECT 
          id,
          subtopic_id,
          section_type,
          jsonb_array_length(content->'blocks') as block_count
        FROM tutorial_page_content_v2
        WHERE content->'blocks' IS NOT NULL
          AND EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(content->'blocks') AS block
            WHERE block->>'type' = 'definition'
          )
        LIMIT 10;
      `);

      if (definitionCheck.rows.length > 0) {
        console.log('\n✅ Found pages with definition blocks:\n');
        for (const row of definitionCheck.rows) {
          console.log(`  - Page ${row.id}`);
          console.log(`    Subtopic: ${row.subtopic_id}`);
          console.log(`    Section: ${row.section_type}`);
          console.log(`    Blocks: ${row.block_count}`);
          
          // Get the actual block details
          const blockDetails = await db.execute(sql`
            SELECT 
              block->>'type' as block_type,
              block->>'version' as block_version,
              block->>'id' as block_id
            FROM tutorial_page_content_v2,
              jsonb_array_elements(content->'blocks') AS block
            WHERE id = ${row.id}
              AND block->>'type' = 'definition';
          `);
          
          if (blockDetails.rows.length > 0) {
            const block = blockDetails.rows[0];
            console.log(`    Definition Block: ${block.block_type} ${block.block_version || '(no version)'}`);
            console.log(`    Block ID: ${block.block_id}`);
          }
          console.log('');
        }
      } else {
        console.log('\n⚠️ No definition blocks found in tutorial_page_content_v2');
      }
    }

    console.log('\n========================================');
    console.log('V2 Check Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error checking V2 tables:');
    console.error(error);
    process.exit(1);
  }
}

checkV2Tables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
