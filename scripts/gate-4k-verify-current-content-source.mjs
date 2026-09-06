#!/usr/bin/env node
/**
 * Gate 4K - Current Content Source Investigation
 * 
 * CRITICAL: Check tutorial_page_content_v2 (known CURRENT table)
 * before concluding content is missing
 * 
 * READ ONLY - No modifications
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';

async function main() {
  console.log('=== Gate 4K: Current Content Source Investigation ===\n');
  console.log(`Target: subtopicId = ${SUBTOPIC_ID} (whatisjava)\n`);

  // Step 1: Query tutorial_page_content_v2 (CURRENT table per project evidence)
  console.log('STEP 1: Query tutorial_page_content_v2\n');
  
  const v2Result = await pool.query(`
    SELECT 
      id,
      brand_id,
      subtopic_id,
      content_type,
      status,
      jsonb_typeof(payload) as payload_type,
      CASE 
        WHEN jsonb_typeof(payload->'blocks') = 'array' 
        THEN jsonb_array_length(payload->'blocks')
        ELSE NULL
      END as block_count,
      version,
      published_at,
      created_at,
      updated_at
    FROM tutorial_page_content_v2
    WHERE subtopic_id = $1
    ORDER BY brand_id, content_type
  `, [SUBTOPIC_ID]);

  console.log(`Found ${v2Result.rows.length} row(s) in tutorial_page_content_v2:`);
  if (v2Result.rows.length > 0) {
    console.log(JSON.stringify(v2Result.rows, null, 2));
  } else {
    console.log('  (no rows)');
  }
  console.log('');

  // Step 2: Check all brands
  console.log('STEP 2: Check All Brand Variants\n');
  
  const brandCheck = await pool.query(`
    SELECT brand_id, COUNT(*) as count
    FROM tutorial_page_content_v2
    WHERE subtopic_id = $1
    GROUP BY brand_id
  `, [SUBTOPIC_ID]);

  console.log('By brand:');
  if (brandCheck.rows.length > 0) {
    brandCheck.rows.forEach(row => {
      console.log(`  ${row.brand_id}: ${row.count} record(s)`);
    });
  } else {
    console.log('  (no records for any brand)');
  }
  console.log('');

  // Step 3: Check hierarchy chain
  console.log('STEP 3: Verify Hierarchy Chain\n');
  
  const hierarchyResult = await pool.query(`
    SELECT 
      sub.id as subtopic_id,
      sub.slug as subtopic_slug,
      sub.name as subtopic_name,
      sub.external_id as subtopic_external_id,
      top.id as topic_id,
      top.name as topic_name,
      subj.id as subject_id,
      subj.name as subject_name,
      dom.id as domain_id,
      dom.name as domain_name
    FROM tutorial_subtopics sub
    LEFT JOIN tutorial_topics top ON sub.topic_id = top.id
    LEFT JOIN tutorial_subjects subj ON top.subject_id = subj.id
    LEFT JOIN tutorial_domains dom ON subj.domain_id = dom.id
    WHERE sub.id = $1
  `, [SUBTOPIC_ID]);

  if (hierarchyResult.rows.length > 0) {
    console.log('Hierarchy:');
    console.log(JSON.stringify(hierarchyResult.rows[0], null, 2));
  } else {
    console.log('❌ Subtopic not found in hierarchy');
  }
  console.log('');

  // Step 4: Check sidebar tree
  console.log('STEP 4: Check Sidebar Tree for navigationNodeId\n');
  
  const sidebarResult = await pool.query(`
    SELECT 
      id,
      brand_id,
      subtopic_id,
      status,
      jsonb_pretty(sidebar_tree) as tree_excerpt
    FROM tutorial_sidebar_trees_v2
    WHERE subtopic_id = $1
    LIMIT 5
  `, [SUBTOPIC_ID]);

  console.log(`Found ${sidebarResult.rows.length} sidebar(s):`);
  if (sidebarResult.rows.length > 0) {
    sidebarResult.rows.forEach(row => {
      console.log(`  Brand: ${row.brand_id}, Status: ${row.status}`);
      // Check if whatisjava appears in tree
      const treeStr = row.tree_excerpt || '';
      if (treeStr.includes('whatisjava')) {
        console.log('    ✅ Contains "whatisjava"');
      } else {
        console.log('    ❌ Does not contain "whatisjava"');
      }
    });
  }
  console.log('');

  // Step 5: Sample ANY content in tutorial_page_content_v2
  console.log('STEP 5: Sample ANY Content in tutorial_page_content_v2\n');
  
  const anySampleResult = await pool.query(`
    SELECT 
      id,
      brand_id,
      subtopic_id,
      content_type,
      status,
      CASE 
        WHEN jsonb_typeof(payload->'blocks') = 'array' 
        THEN jsonb_array_length(payload->'blocks')
        ELSE NULL
      END as block_count
    FROM tutorial_page_content_v2
    WHERE status IN ('published', 'deployed', 'approved')
    LIMIT 10
  `);

  console.log(`Sample published content (${anySampleResult.rows.length} rows):`);
  if (anySampleResult.rows.length > 0) {
    console.log(JSON.stringify(anySampleResult.rows, null, 2));
  } else {
    console.log('  (no published content found in entire table)');
  }
  console.log('');

  // Step 6: Table statistics
  console.log('STEP 6: Table Statistics\n');
  
  const statsResult = await pool.query(`
    SELECT 
      'tutorial_page_content_v2' as table_name,
      COUNT(*) as total_rows,
      COUNT(DISTINCT subtopic_id) as unique_subtopics,
      COUNT(DISTINCT brand_id) as unique_brands,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published_rows,
      COUNT(CASE WHEN status = 'deployed' THEN 1 END) as deployed_rows
    FROM tutorial_page_content_v2
    UNION ALL
    SELECT 
      'tutorial_sections' as table_name,
      COUNT(*) as total_rows,
      COUNT(DISTINCT subtopic_id) as unique_subtopics,
      COUNT(DISTINCT brand_id) as unique_brands,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_rows,
      COUNT(CASE WHEN status = 'deployed' THEN 1 END) as deployed_rows
    FROM tutorial_sections
  `);

  console.log('Table Comparison:');
  console.log(JSON.stringify(statsResult.rows, null, 2));
  console.log('');

  // Summary
  console.log('=== INVESTIGATION SUMMARY ===\n');
  console.log(`whatisjava content in tutorial_page_content_v2: ${v2Result.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Hierarchy exists: ${hierarchyResult.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Sidebar exists: ${sidebarResult.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`tutorial_page_content_v2 has ANY data: ${statsResult.rows[0]?.total_rows > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`tutorial_sections has ANY data: ${statsResult.rows[1]?.total_rows > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log('');
  console.log('CRITICAL QUESTION:');
  console.log('Which table is the CURRENT content source?');

  await pool.end();
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
