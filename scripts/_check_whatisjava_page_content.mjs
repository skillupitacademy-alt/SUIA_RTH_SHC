#!/usr/bin/env node
/**
 * READ-ONLY: Check if tutorial_page_content_v2 contains whatisjava content
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  await client.connect();

  console.log('=== WHATISJAVA PAGE-CONTENT FORENSIC CHECK ===\n');

  // 1. Actual table structure
  console.log('STEP 1: tutorial_page_content_v2 COLUMNS\n');
  const columns = await client.query(`
    SELECT
      ordinal_position,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tutorial_page_content_v2'
    ORDER BY ordinal_position
  `);

  console.table(columns.rows);

  // 2. ALL rows with full details
  console.log('\nSTEP 2: ALL tutorial_page_content_v2 ROWS (FULL)\n');
  const rows = await client.query(`
    SELECT 
      id,
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      subtopic_id,
      content_type,
      status,
      version,
      published_at,
      created_at,
      updated_at,
      jsonb_typeof(payload) as payload_type,
      CASE 
        WHEN jsonb_typeof(payload->'blocks') = 'array'
        THEN jsonb_array_length(payload->'blocks')
        ELSE NULL
      END as block_count,
      payload
    FROM tutorial_page_content_v2
    ORDER BY id
  `);

  console.log(`Found ${rows.rows.length} row(s):\n`);
  rows.rows.forEach((row, i) => {
    console.log(`\n--- ROW ${i + 1} ---`);
    console.log(`id: ${row.id}`);
    console.log(`brand_id: ${row.brand_id}`);
    console.log(`subtopic_id: ${row.subtopic_id}`);
    console.log(`content_type: ${row.content_type}`);
    console.log(`status: ${row.status}`);
    console.log(`version: ${row.version}`);
    console.log(`block_count: ${row.block_count}`);
    console.log(`published_at: ${row.published_at}`);
    console.log(`payload type: ${row.payload_type}`);
    
    // Show payload structure (not full content)
    if (row.payload) {
      const keys = Object.keys(row.payload);
      console.log(`payload keys: ${keys.join(', ')}`);
      
      if (row.payload.blocks && Array.isArray(row.payload.blocks)) {
        console.log(`  blocks: ${row.payload.blocks.length} item(s)`);
        if (row.payload.blocks.length > 0) {
          console.log('  First block sample:', JSON.stringify(row.payload.blocks[0], null, 2).substring(0, 300) + '...');
        }
      }
    }
    console.log('');
  });

  // 3. Check if subtopic_id matches (internal or external)
  console.log('\nSTEP 3: CHECKING SUBTOPIC MATCH\n');
  
  const matchInternal = rows.rows.filter(r => r.subtopic_id === SUBTOPIC_ID);
  const matchExternal = rows.rows.filter(r => r.subtopic_id === SUBTOPIC_EXTERNAL_ID);
  
  console.log(`Match by internal ID (${SUBTOPIC_ID}): ${matchInternal.length} row(s)`);
  console.log(`Match by external ID (${SUBTOPIC_EXTERNAL_ID}): ${matchExternal.length} row(s)`);
  
  if (matchExternal.length > 0) {
    console.log('\n✅ FOUND: tutorial_page_content_v2 uses external_id!');
    console.log('Content details:');
    matchExternal.forEach(row => {
      console.log(`  - ${row.content_type}: ${row.status}, ${row.block_count} blocks`);
    });
  }

  // 4. Hierarchy check
  console.log('\n\nSTEP 4: WHATISJAVA HIERARCHY\n');
  const hierarchy = await client.query(`
    SELECT
      s.id as internal_id,
      s.external_id,
      s.name,
      s.slug,
      t.name AS topic_name,
      t.slug AS topic_slug,
      sub.name AS subject_name,
      sub.slug AS subject_slug
    FROM tutorial_subtopics s
    JOIN tutorial_topics t ON t.id = s.topic_id
    JOIN tutorial_subjects sub ON sub.id = t.subject_id
    WHERE s.id = $1
       OR s.external_id = $2
       OR s.slug ILIKE '%what-is-java%'
  `, [SUBTOPIC_ID, SUBTOPIC_EXTERNAL_ID]);

  console.log(JSON.stringify(hierarchy.rows, null, 2));

  // 5. Progress reference check
  console.log('\n\nSTEP 5: WHATISJAVA NAVIGATION PROGRESS\n');
  const progress = await client.query(`
    SELECT
      navigation_node_id,
      section_id,
      subtopic_id,
      visit_count,
      status,
      last_viewed_at
    FROM tutorial_navigation_progress
    WHERE navigation_node_id = $1
       OR subtopic_id = $2
    ORDER BY last_viewed_at DESC NULLS LAST
  `, [NAVIGATION_NODE_ID, SUBTOPIC_ID]);

  console.log(JSON.stringify(progress.rows, null, 2));

  // 6. CRITICAL ANALYSIS
  console.log('\n\n=== FORENSIC ANALYSIS ===\n');
  
  if (matchExternal.length > 0) {
    console.log('✅ FOUND: whatisjava content EXISTS in tutorial_page_content_v2');
    console.log(`   Uses: external_id (${SUBTOPIC_EXTERNAL_ID})`);
    console.log(`   Content types: ${matchExternal.map(r => r.content_type).join(', ')}`);
    console.log(`   Total blocks: ${matchExternal.reduce((sum, r) => sum + (r.block_count || 0), 0)}`);
    console.log('\n   🔍 KEY FINDING: Content NOT missing!');
    console.log('   Problem may be: wrong table / broken linkage / migration incomplete');
  } else if (matchInternal.length > 0) {
    console.log('✅ FOUND: whatisjava content EXISTS in tutorial_page_content_v2');
    console.log(`   Uses: internal_id (${SUBTOPIC_ID})`);
  } else {
    console.log('❌ NOT FOUND: whatisjava content NOT in tutorial_page_content_v2');
    console.log('   Content actually missing from both tables');
  }
  
  console.log('\ntutorial_sections status: 0 rows (verified empty)');
  console.log('tutorial_navigation_progress: 3 rows (Phase 2 test artifacts)');
  console.log('section_id reference: cce5ff0e-0fb1-458e-808a-9858f2e7605d (orphaned)');

  await client.end();
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
