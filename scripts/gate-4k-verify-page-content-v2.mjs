#!/usr/bin/env node
/**
 * Gate 4K - Check tutorial_page_content_v2 Table
 * 
 * Verify if whatisjava content is in tutorial_page_content_v2 instead
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

async function main() {
  console.log('=== Gate 4K: Page Content V2 Investigation ===\n');

  // Check if table exists
  console.log('Query 1: Check if tutorial_page_content_v2 table exists');
  
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tutorial_page_content_v2'
    ) as table_exists
  `);

  console.log(`Table exists: ${tableCheck.rows[0].table_exists}`);
  console.log('');

  if (!tableCheck.rows[0].table_exists) {
    console.log('❌ tutorial_page_content_v2 table does NOT exist');
    await pool.end();
    return;
  }

  // Query for whatisjava
  console.log('Query 2: tutorial_page_content_v2 for whatisjava');
  console.log('WHERE subtopic_id = 414f63eb-cccf-4bd1-bcc0-b52df69ce499');
  console.log('  AND navigation_node_id = whatisjava\n');

  const result1 = await pool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      status,
      created_at
    FROM tutorial_page_content_v2
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
      AND navigation_node_id = 'whatisjava'
  `);

  console.log(`Found ${result1.rows.length} row(s):`);
  console.log(JSON.stringify(result1.rows, null, 2));
  console.log('');

  // Query for ANY content with this subtopic
  console.log('Query 3: ANY tutorial_page_content_v2 for this subtopic');
  
  const result2 = await pool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      status
    FROM tutorial_page_content_v2
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
    LIMIT 10
  `);

  console.log(`Found ${result2.rows.length} row(s):`);
  console.log(JSON.stringify(result2.rows, null, 2));
  console.log('');

  // Query for ANY data in table
  console.log('Query 4: Sample ANY records from tutorial_page_content_v2');
  
  const result3 = await pool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      status
    FROM tutorial_page_content_v2
    WHERE deleted_at IS NULL
    LIMIT 5
  `);

  console.log(`Found ${result3.rows.length} row(s):`);
  console.log(JSON.stringify(result3.rows, null, 2));
  console.log('');

  // Summary
  console.log('=== SUMMARY ===');
  console.log(`whatisjava in tutorial_page_content_v2: ${result1.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Any content for subtopic: ${result2.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`tutorial_page_content_v2 has ANY data: ${result3.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);

  await pool.end();
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
