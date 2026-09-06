#!/usr/bin/env node
/**
 * VERIFY whatisjava CONTENT STATUS
 * 
 * Check if tutorial content exists in tutorial_sections
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const SUBTOPIC_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const NAVIGATION_NODE_ID = 'whatisjava';
const BRAND_ID = 'shared';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('================================================================');
  console.log('VERIFY whatisjava CONTENT STATUS');
  console.log('================================================================\n');

  // Check tutorial_sections
  console.log('Checking tutorial_sections...');
  const sectionsResult = await pool.query(`
    SELECT 
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      status,
      published_at,
      content->'schemaVersion' as schema_version,
      jsonb_array_length(content->'blocks') as block_count,
      created_at,
      updated_at
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND navigation_node_id = $2
      AND brand_id = $3
      AND deleted_at IS NULL
  `, [SUBTOPIC_INTERNAL_ID, NAVIGATION_NODE_ID, BRAND_ID]);

  if (sectionsResult.rows.length === 0) {
    console.log('❌ NO CONTENT FOUND in tutorial_sections');
    console.log(`   subtopic_id: ${SUBTOPIC_INTERNAL_ID}`);
    console.log(`   navigation_node_id: ${NAVIGATION_NODE_ID}`);
    console.log(`   brand_id: ${BRAND_ID}`);
  } else {
    const row = sectionsResult.rows[0];
    console.log('✅ CONTENT FOUND in tutorial_sections');
    console.log(`   ID: ${row.id}`);
    console.log(`   Status: ${row.status}`);
    console.log(`   Published: ${row.published_at || 'No'}`);
    console.log(`   Schema Version: ${row.schema_version}`);
    console.log(`   Block Count: ${row.block_count}`);
    console.log(`   Created: ${row.created_at}`);
    console.log(`   Updated: ${row.updated_at}`);

    // Get block details
    const blocksResult = await pool.query(`
      SELECT 
        jsonb_array_elements(content->'blocks') as block
      FROM tutorial_sections
      WHERE id = $1
    `, [row.id]);

    console.log('\n   Blocks:');
    blocksResult.rows.forEach((b, i) => {
      const block = b.block;
      console.log(`     ${i + 1}. Type: ${block.type}, Version: ${block.version || 'N/A'}, ID: ${block.id}`);
      if (block.expectedTimeSec) {
        console.log(`        expectedTimeSec: ${block.expectedTimeSec} seconds`);
      }
    });
  }

  console.log('\n');
  await pool.end();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
