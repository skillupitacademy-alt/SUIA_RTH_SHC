/**
 * Check legacy tutorial_content table
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkLegacyContent() {
  console.log('========================================');
  console.log('Legacy Content Check');
  console.log('========================================\n');

  try {
    // Count rows in tutorial_content
    const contentCount = await db.execute(sql`
      SELECT COUNT(*) FROM tutorial_content;
    `);

    console.log(`tutorial_content (legacy monolithic): ${contentCount.rows[0]?.count || 0} rows`);

    if (Number(contentCount.rows[0]?.count || 0) > 0) {
      // Get sample content structure
      const sampleContent = await db.execute(sql`
        SELECT 
          id,
          subtopic_id,
          status,
          difficulty,
          CASE 
            WHEN content IS NOT NULL THEN 'HAS_CONTENT'
            ELSE 'NO_CONTENT'
          END as content_status,
          generated_by_ai,
          created_at
        FROM tutorial_content
        LIMIT 5;
      `);

      console.log('\nSample legacy content records:\n');
      for (const row of sampleContent.rows) {
        console.log(`  - ID: ${row.id}`);
        console.log(`    Subtopic: ${row.subtopic_id}`);
        console.log(`    Status: ${row.status}`);
        console.log(`    Difficulty: ${row.difficulty}`);
        console.log(`    Content: ${row.content_status}`);
        console.log(`    AI Generated: ${row.generated_by_ai}`);
        console.log(`    Created: ${row.created_at}`);
        console.log('');
      }

      // Check if any have blocks with type=definition
      const definitionCheck = await db.execute(sql`
        SELECT 
          id,
          subtopic_id,
          jsonb_array_length(content->'blocks') as block_count
        FROM tutorial_content
        WHERE content->'blocks' IS NOT NULL
          AND EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(content->'blocks') AS block
            WHERE block->>'type' = 'definition'
          )
        LIMIT 5;
      `);

      if (definitionCheck.rows.length > 0) {
        console.log('\n✅ Found legacy content with definition blocks:');
        for (const row of definitionCheck.rows) {
          console.log(`  - Section ${row.id}: ${row.block_count} blocks`);
        }
        console.log('\nThese need to be migrated to Definition D1 in tutorial_sections');
      } else {
        console.log('\n⚠️ No definition blocks found in legacy content');
      }
    }

    console.log('\n========================================');
    console.log('Legacy Check Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error checking legacy content:');
    console.error(error);
    process.exit(1);
  }
}

checkLegacyContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
