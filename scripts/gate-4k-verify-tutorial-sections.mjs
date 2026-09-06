#!/usr/bin/env node
/**
 * Gate 4K - Verify tutorial_sections Data
 * 
 * Read-only investigation to prove which table contains whatisjava content
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

async function main() {
  console.log('=== Gate 4K: Tutorial Sections Investigation ===\n');

  // Query 1: Check if whatisjava exists in tutorial_sections
  console.log('Query 1: tutorial_sections for whatisjava');
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
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
      AND navigation_node_id = 'whatisjava'
  `);

  console.log(`Found ${result1.rows.length} row(s):`);
  console.log(JSON.stringify(result1.rows, null, 2));
  console.log('');

  // Query 2: Check if subtopic exists at all in tutorial_sections
  console.log('Query 2: ANY tutorial_sections for this subtopic_id');
  
  const result2 = await pool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      status
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
    LIMIT 10
  `);

  console.log(`Found ${result2.rows.length} row(s):`);
  console.log(JSON.stringify(result2.rows, null, 2));
  console.log('');

  // Query 3: Check subtopic record exists
  console.log('Query 3: Verify subtopic exists');
  
  const result3 = await pool.query(`
    SELECT 
      id,
      external_id,
      slug,
      name
    FROM tutorial_subtopics
    WHERE id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
  `);

  console.log(`Found ${result3.rows.length} row(s):`);
  console.log(JSON.stringify(result3.rows, null, 2));
  console.log('');

  // Query 4: Find ANY tutorial_sections with data
  console.log('Query 4: Sample tutorial_sections records (any)');
  
  const result4 = await pool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      status
    FROM tutorial_sections
    WHERE navigation_node_id IS NOT NULL
      AND deleted_at IS NULL
    LIMIT 5
  `);

  console.log(`Found ${result4.rows.length} row(s):`);
  console.log(JSON.stringify(result4.rows, null, 2));
  console.log('');

  // Summary
  console.log('=== INVESTIGATION SUMMARY ===');
  console.log(`Subtopic exists: ${result3.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`whatisjava in tutorial_sections: ${result1.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Any sections for subtopic: ${result2.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`tutorial_sections has ANY data: ${result4.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);

  await pool.end();
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
