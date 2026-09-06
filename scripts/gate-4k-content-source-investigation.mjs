#!/usr/bin/env node
/**
 * Gate 4K - Content Source Investigation
 * 
 * GOAL: Prove whether working whatisjava runtime and ILS validation 
 *       use the same content source
 * 
 * READ ONLY - No modifications
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

async function main() {
  console.log('=== Gate 4K: Content Source Investigation ===\n');

  // Step 1: Check tutorial_sections schema
  console.log('STEP 1: tutorial_sections Schema\n');
  
  const schemaResult = await pool.query(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'tutorial_sections'
    ORDER BY ordinal_position
  `);

  console.log('Columns:');
  schemaResult.rows.forEach(col => {
    console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });
  console.log('');

  // Step 2: Check indexes
  console.log('STEP 2: tutorial_sections Indexes\n');
  
  const indexResult = await pool.query(`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'tutorial_sections'
    ORDER BY indexname
  `);

  console.log('Indexes:');
  indexResult.rows.forEach(idx => {
    console.log(`  ${idx.indexname}`);
    console.log(`    ${idx.indexdef}`);
  });
  console.log('');

  // Step 3: Query with EXACT production parameters
  console.log('STEP 3: Query with Production Parameters\n');
  console.log('Parameters used by getTutorialById():');
  console.log('  subtopicId (internal): 414f63eb-cccf-4bd1-bcc0-b52df69ce499');
  console.log('  navigationNodeId: whatisjava');
  console.log('  brandId: skillup (or shared)');
  console.log('  status: approved OR deployed');
  console.log('  deleted_at: NULL');
  console.log('');

  const productionQuery = await pool.query(`
    SELECT 
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      status,
      brand_visibility,
      deleted_at,
      jsonb_array_length(COALESCE(content->'blocks', '[]'::jsonb)) as block_count,
      created_at
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
      AND navigation_node_id = 'whatisjava'
      AND deleted_at IS NULL
      AND status IN ('approved', 'deployed')
      AND (
        brand_id = 'shared' 
        OR brand_id = 'skillup'
        OR brand_visibility = 'shared_visible'
      )
    LIMIT 1
  `);

  console.log(`Query Result: ${productionQuery.rows.length} row(s)`);
  if (productionQuery.rows.length > 0) {
    console.log(JSON.stringify(productionQuery.rows[0], null, 2));
  }
  console.log('');

  // Step 4: Check if ANY sections exist with different filters
  console.log('STEP 4: Check Different Filter Combinations\n');

  // Without navigationNodeId filter
  const noNavResult = await pool.query(`
    SELECT COUNT(*) as count
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
  `);
  console.log(`Without navigationNodeId filter: ${noNavResult.rows[0].count} row(s)`);

  // Without status filter
  const noStatusResult = await pool.query(`
    SELECT COUNT(*) as count
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
      AND navigation_node_id = 'whatisjava'
  `);
  console.log(`Without status filter: ${noStatusResult.rows[0].count} row(s)`);

  // With different brand
  const diffBrandResult = await pool.query(`
    SELECT COUNT(*) as count, brand_id
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
      AND navigation_node_id = 'whatisjava'
    GROUP BY brand_id
  `);
  console.log(`By brand: ${JSON.stringify(diffBrandResult.rows)}`);

  // Including deleted
  const withDeletedResult = await pool.query(`
    SELECT COUNT(*) as count, deleted_at IS NULL as active
    FROM tutorial_sections
    WHERE subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
      AND navigation_node_id = 'whatisjava'
    GROUP BY deleted_at IS NULL
  `);
  console.log(`Including deleted: ${JSON.stringify(withDeletedResult.rows)}`);
  console.log('');

  // Step 5: Total table row count
  console.log('STEP 5: Table Statistics\n');
  
  const statsResult = await pool.query(`
    SELECT 
      COUNT(*) as total_rows,
      COUNT(DISTINCT subtopic_id) as unique_subtopics,
      COUNT(DISTINCT navigation_node_id) as unique_nav_nodes,
      COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_rows
    FROM tutorial_sections
  `);

  console.log('tutorial_sections Statistics:');
  console.log(JSON.stringify(statsResult.rows[0], null, 2));
  console.log('');

  // Step 6: Check for case-sensitivity issues
  console.log('STEP 6: Case Sensitivity Check\n');
  
  const caseResult = await pool.query(`
    SELECT 
      navigation_node_id,
      COUNT(*) as count
    FROM tutorial_sections
    WHERE LOWER(navigation_node_id) = LOWER('whatisjava')
    GROUP BY navigation_node_id
  `);

  console.log(`Case-insensitive match for 'whatisjava': ${caseResult.rows.length} variant(s)`);
  caseResult.rows.forEach(row => {
    console.log(`  "${row.navigation_node_id}": ${row.count} row(s)`);
  });
  console.log('');

  // Step 7: Check external_id resolution
  console.log('STEP 7: External ID Resolution\n');
  
  const externalIdResult = await pool.query(`
    SELECT 
      id,
      external_id,
      slug,
      name
    FROM tutorial_subtopics
    WHERE external_id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
  `);

  console.log('Subtopic by external_id (12efacf1-b5ad-4b43-9fe4-17ba1cf249e4):');
  console.log(JSON.stringify(externalIdResult.rows, null, 2));
  console.log('');

  // Summary
  console.log('=== INVESTIGATION SUMMARY ===\n');
  console.log('Questions to answer:');
  console.log('1. Does tutorial_sections have the schema ILS expects? ' + (schemaResult.rows.length > 0 ? 'YES ✅' : 'NO ❌'));
  console.log('2. Does production query return content? ' + (productionQuery.rows.length > 0 ? 'YES ✅' : 'NO ❌'));
  console.log('3. Is table completely empty? ' + (statsResult.rows[0].total_rows === '0' ? 'YES' : 'NO'));
  console.log('4. Could filters be wrong? ' + (noNavResult.rows[0].count > '0' || noStatusResult.rows[0].count > '0' ? 'POSSIBLE' : 'NO'));
  console.log('');
  console.log('NEXT: Compare this with actual working whatisjava page behavior');

  await pool.end();
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
