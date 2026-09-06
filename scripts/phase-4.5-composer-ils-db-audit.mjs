#!/usr/bin/env node
/**
 * Phase 4.5 - Composer → ILS Database Audit
 * 
 * READ-ONLY investigation to trace:
 * - Where Composer stores Tutorial Pages/Documents
 * - Where Composer stores Blocks (including expectedTimeSec)
 * - Where ILS stores page-level progress
 * - Where ILS stores block-level progress
 * - Actual foreign key relationships
 * 
 * NO DATA MODIFICATIONS
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Test with known "What Is Java?" data
const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

// Test users from previous investigations
const TEST_USER_IDS = [
  'b438fb19-fa32-4df4-93b4-91837a5a15ef',
  'afc355ca-6bae-4165-89dd-198494a62f85',
];

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('================================================================');
  console.log('PHASE 4.5 - COMPOSER → ILS DATABASE AUDIT');
  console.log('================================================================\n');
  console.log('READ-ONLY INVESTIGATION');
  console.log('NO DATA MODIFICATIONS\n');
  console.log('Test Data:');
  console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
  console.log(`  subtopic internal: ${SUBTOPIC_INTERNAL_ID}`);
  console.log(`  subtopic external: ${SUBTOPIC_EXTERNAL_ID}`);
  console.log('================================================================\n');

  // ================================================================
  // SECTION 1: COMPOSER CONTENT STORAGE
  // ================================================================
  console.log('SECTION 1: COMPOSER CONTENT STORAGE');
  console.log('================================================================\n');

  console.log('1A. tutorial_sections (Current Composer Storage)\n');

  const sectionsResult = await tutorialPool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      status,
      content,
      version,
      created_at,
      updated_at,
      published_at
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND deleted_at IS NULL
    ORDER BY created_at DESC
  `, [SUBTOPIC_INTERNAL_ID]);

  console.log(`Found: ${sectionsResult.rows.length} section(s)\n`);

  if (sectionsResult.rows.length > 0) {
    sectionsResult.rows.forEach((row, i) => {
      console.log(`Section ${i + 1}:`);
      console.log(`  ID:           ${row.id}`);
      console.log(`  Navigation:   ${row.navigation_node_id}`);
      console.log(`  Subtopic:     ${row.subtopic_id === SUBTOPIC_INTERNAL_ID ? '✅ MATCH' : '❌ MISMATCH'}`);
      console.log(`  Brand:        ${row.brand_id}`);
      console.log(`  Status:       ${row.status}`);
      console.log(`  Version:      ${row.version}`);
      console.log(`  Created:      ${row.created_at}`);
      console.log(`  Updated:      ${row.updated_at}`);
      console.log(`  Published:    ${row.published_at || 'NULL'}`);
      console.log('');

      // Check content structure
      if (row.content) {
        const content = row.content;
        console.log('  Content Structure:');
        console.log(`    schemaVersion: ${content.schemaVersion || 'MISSING'}`);
        console.log(`    blocks:        ${Array.isArray(content.blocks) ? content.blocks.length : 'NOT ARRAY'}`);
        
        if (Array.isArray(content.blocks) && content.blocks.length > 0) {
          const firstBlock = content.blocks[0];
          console.log('');
          console.log('  First Block Sample:');
          console.log(`    id:              ${firstBlock.id || 'MISSING'}`);
          console.log(`    type:            ${firstBlock.type || 'MISSING'}`);
          console.log(`    version:         ${firstBlock.version || 'MISSING'}`);
          console.log(`    expectedTimeSec: ${firstBlock.expectedTimeSec !== undefined ? firstBlock.expectedTimeSec : 'MISSING'}`);
          console.log(`    has content:     ${firstBlock.content ? '✅' : '❌'}`);
          console.log(`    has presentation:${firstBlock.presentation ? '✅' : '❌'}`);
        }
        console.log('');
      }
    });
  } else {
    console.log('❌ NO SECTIONS in tutorial_sections\n');
  }

  console.log('1B. tutorial_page_content_v2 (Future/Not Used Yet)\n');

  const pageContentResult = await tutorialPool.query(`
    SELECT 
      id,
      subtopic_id,
      brand_id,
      content_type,
      status,
      version,
      created_at
    FROM tutorial_page_content_v2
    WHERE subtopic_id = $1
    ORDER BY content_type DESC
    LIMIT 5
  `, [SUBTOPIC_EXTERNAL_ID]);

  console.log(`Found: ${pageContentResult.rows.length} row(s)\n`);

  if (pageContentResult.rows.length > 0) {
    console.log('⚠️  tutorial_page_content_v2 has data but Composer does NOT use it yet');
    console.log('   Composer writes to tutorial_sections.content (JSONB)\n');
  } else {
    console.log('✅ tutorial_page_content_v2 empty (as expected)\n');
  }

  // ================================================================
  // SECTION 2: NAVIGATION NODE MAPPING
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 2: NAVIGATION NODE MAPPING');
  console.log('================================================================\n');

  const subtopicResult = await tutorialPool.query(`
    SELECT 
      id as internal_id,
      external_id,
      name,
      slug,
      topic_id,
      created_at
    FROM tutorial_subtopics
    WHERE id = $1 OR external_id = $2
  `, [SUBTOPIC_INTERNAL_ID, SUBTOPIC_EXTERNAL_ID]);

  if (subtopicResult.rows.length > 0) {
    const st = subtopicResult.rows[0];
    console.log('Subtopic Identity:');
    console.log(`  Internal ID:  ${st.internal_id}`);
    console.log(`  External ID:  ${st.external_id}`);
    console.log(`  Name:         ${st.name}`);
    console.log(`  Slug:         ${st.slug}`);
    console.log(`  Topic ID:     ${st.topic_id}`);
    console.log('');

    console.log('ID Usage:');
    console.log(`  tutorial_page_content_v2 uses: external_id (${st.external_id})`);
    console.log(`  tutorial_sections uses:        internal_id (${st.internal_id})`);
    console.log(`  progress tables use:           internal_id (${st.internal_id})`);
    console.log('');
  }

  // ================================================================
  // SECTION 3: ILS PAGE-LEVEL PROGRESS
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 3: ILS PAGE-LEVEL PROGRESS');
  console.log('================================================================\n');

  console.log('3A. tutorial_navigation_progress (Page-level state)\n');

  const navProgressResult = await tutorialPool.query(`
    SELECT 
      id,
      user_id,
      navigation_node_id,
      subtopic_id,
      section_id,
      visit_count,
      status,
      time_spent_active_sec,
      revision_count,
      completed_blocks,
      last_session_id,
      first_viewed_at,
      last_viewed_at,
      completed_at,
      created_at,
      updated_at,
      deleted_at
    FROM tutorial_navigation_progress
    WHERE navigation_node_id = $1
      AND deleted_at IS NULL
    ORDER BY created_at
    LIMIT 10
  `, [NAVIGATION_NODE_ID]);

  console.log(`Found: ${navProgressResult.rows.length} progress row(s)\n`);

  if (navProgressResult.rows.length > 0) {
    navProgressResult.rows.forEach((row, i) => {
      console.log(`Progress ${i + 1}:`);
      console.log(`  ID:           ${row.id.substring(0, 8)}...`);
      console.log(`  User:         ${row.user_id.substring(0, 8)}...`);
      console.log(`  Navigation:   ${row.navigation_node_id}`);
      console.log(`  Subtopic:     ${row.subtopic_id === SUBTOPIC_INTERNAL_ID ? '✅ MATCH' : '❌ MISMATCH'}`);
      console.log(`  Section:      ${row.section_id ? row.section_id.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`  Visits:       ${row.visit_count}`);
      console.log(`  Status:       ${row.status}`);
      console.log(`  Active time:  ${row.time_spent_active_sec}s`);
      console.log(`  Revisions:    ${row.revision_count}`);
      console.log(`  Blocks done:  ${row.completed_blocks.length}`);
      console.log(`  Session:      ${row.last_session_id || 'NULL'}`);
      console.log(`  First view:   ${row.first_viewed_at || 'NULL'}`);
      console.log(`  Last view:    ${row.last_viewed_at || 'NULL'}`);
      console.log(`  Completed:    ${row.completed_at || 'NULL'}`);
      console.log(`  Created:      ${row.created_at}`);
      console.log('');
    });
  } else {
    console.log('No page-level progress records found\n');
  }

  // Check schema for expectedTimeSec at page level
  console.log('3B. Check if tutorial_navigation_progress has expectedTimeSec\n');

  const navProgressSchemaResult = await tutorialPool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'tutorial_navigation_progress'
      AND column_name LIKE '%time%'
    ORDER BY ordinal_position
  `);

  console.log('Time-related columns in tutorial_navigation_progress:\n');
  navProgressSchemaResult.rows.forEach(col => {
    console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });
  console.log('');

  // ================================================================
  // SECTION 4: ILS BLOCK-LEVEL PROGRESS
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 4: ILS BLOCK-LEVEL PROGRESS');
  console.log('================================================================\n');

  console.log('4A. block_learning_state (Block-level state)\n');

  const blockStateResult = await tutorialPool.query(`
    SELECT 
      id,
      user_id,
      navigation_node_id,
      block_id,
      block_version,
      visit_count,
      revision_count,
      active_time_sec,
      expected_time_sec,
      first_viewed_at,
      last_viewed_at,
      completed_at,
      created_at,
      updated_at
    FROM block_learning_state
    WHERE navigation_node_id = $1
    ORDER BY user_id, block_id
    LIMIT 20
  `, [NAVIGATION_NODE_ID]);

  console.log(`Found: ${blockStateResult.rows.length} block state row(s)\n`);

  if (blockStateResult.rows.length > 0) {
    blockStateResult.rows.forEach((row, i) => {
      console.log(`Block State ${i + 1}:`);
      console.log(`  ID:             ${row.id.substring(0, 8)}...`);
      console.log(`  User:           ${row.user_id.substring(0, 8)}...`);
      console.log(`  Navigation:     ${row.navigation_node_id}`);
      console.log(`  Block ID:       ${row.block_id}`);
      console.log(`  Block Version:  ${row.block_version}`);
      console.log(`  Visits:         ${row.visit_count}`);
      console.log(`  Revisions:      ${row.revision_count}`);
      console.log(`  Active time:    ${row.active_time_sec}s`);
      console.log(`  Expected time:  ${row.expected_time_sec !== null ? row.expected_time_sec + 's' : 'NULL'}`);
      console.log(`  First viewed:   ${row.first_viewed_at || 'NULL'}`);
      console.log(`  Last viewed:    ${row.last_viewed_at || 'NULL'}`);
      console.log(`  Completed:      ${row.completed_at || 'NULL'}`);
      console.log('');
    });

    // Check if expected_time_sec is populated
    const hasExpectedTime = blockStateResult.rows.some(r => r.expected_time_sec !== null);
    console.log(`expectedTimeSec populated: ${hasExpectedTime ? '✅ YES' : '❌ NO'}\n`);
  } else {
    console.log('No block-level learning state found\n');
  }

  console.log('4B. Check block_learning_state schema\n');

  const blockStateSchemaResult = await tutorialPool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'block_learning_state'
    ORDER BY ordinal_position
  `);

  console.log('Columns in block_learning_state:\n');
  blockStateSchemaResult.rows.forEach(col => {
    console.log(`  ${col.column_name}:`);
    console.log(`    Type:     ${col.data_type}`);
    console.log(`    Nullable: ${col.is_nullable}`);
    console.log(`    Default:  ${col.column_default || 'none'}`);
    console.log('');
  });

  // ================================================================
  // SECTION 5: FOREIGN KEY RELATIONSHIPS
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 5: FOREIGN KEY RELATIONSHIPS');
  console.log('================================================================\n');

  const fkResult = await tutorialPool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN (
        'tutorial_page_content_v2',
        'tutorial_sections',
        'tutorial_navigation_progress',
        'block_learning_state'
      )
    ORDER BY tc.table_name, kcu.column_name
  `);

  console.log('Foreign Key Relationships:\n');

  const tableGroups = {};
  fkResult.rows.forEach(row => {
    if (!tableGroups[row.table_name]) {
      tableGroups[row.table_name] = [];
    }
    tableGroups[row.table_name].push(row);
  });

  Object.keys(tableGroups).sort().forEach(tableName => {
    console.log(`${tableName}:`);
    tableGroups[tableName].forEach(fk => {
      console.log(`  ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    console.log('');
  });

  // ================================================================
  // SECTION 6: ARCHITECTURE SUMMARY
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 6: ARCHITECTURE SUMMARY');
  console.log('================================================================\n');

  console.log('COMPOSER CONTENT STORAGE:');
  console.log(`  tutorial_sections:        ${sectionsResult.rows.length} section(s) ← CURRENT`);
  console.log(`  tutorial_page_content_v2: ${pageContentResult.rows.length} row(s) (not used yet)`);
  console.log('');

  console.log('BLOCK STORAGE:');
  if (sectionsResult.rows.length > 0 && sectionsResult.rows[0].content) {
    const firstSection = sectionsResult.rows[0];
    const content = firstSection.content;
    const totalBlocks = content.blocks ? content.blocks.length : 0;
    console.log(`  Blocks in section: ${totalBlocks}`);
    
    if (totalBlocks > 0) {
      const firstBlock = content.blocks[0];
      console.log(`  Block has id:       ${firstBlock.id ? '✅' : '❌'}`);
      console.log(`  Block has version:  ${firstBlock.version ? '✅' : '❌'}`);
      console.log(`  Block has expectedTimeSec: ${firstBlock.expectedTimeSec !== undefined ? '✅' : '❌'}`);
      
      if (firstBlock.expectedTimeSec !== undefined) {
        console.log(`    Value: ${firstBlock.expectedTimeSec}s`);
      }
    }
  } else {
    console.log(`  No blocks found in content`);
  }
  console.log('');

  console.log('ILS PAGE-LEVEL TRACKING:');
  console.log(`  tutorial_navigation_progress: ${navProgressResult.rows.length} row(s)`);
  console.log(`  Tracks: navigationNodeId, visits, status, time, blocks completed`);
  console.log('');

  console.log('ILS BLOCK-LEVEL TRACKING:');
  console.log(`  block_learning_state: ${blockStateResult.rows.length} row(s)`);
  console.log(`  Tracks: blockId, blockVersion, visits, time, expectedTimeSec`);
  console.log('');

  console.log('IDENTITY MAPPING:');
  console.log(`  navigationNodeId:  ${NAVIGATION_NODE_ID} (text slug)`);
  console.log(`  subtopic internal: ${SUBTOPIC_INTERNAL_ID}`);
  console.log(`  subtopic external: ${SUBTOPIC_EXTERNAL_ID}`);
  console.log('');

  console.log('expectedTimeSec FLOW:');
  const hasExpectedInContent = sectionsResult.rows.length > 0 &&
    sectionsResult.rows[0].content &&
    sectionsResult.rows[0].content.blocks &&
    sectionsResult.rows[0].content.blocks[0]?.expectedTimeSec !== undefined;
  const hasExpectedInState = blockStateResult.rows.some(r => r.expected_time_sec !== null);
  
  console.log(`  Composer storage:  ${hasExpectedInContent ? '✅ Present' : '❌ Missing'}`);
  console.log(`  ILS block state:   ${hasExpectedInState ? '✅ Populated' : '❌ Empty'}`);
  console.log('');

  // ================================================================
  // SECTION 7: VERIFICATION CHECKLIST
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 7: VERIFICATION CHECKLIST');
  console.log('================================================================\n');

  const checks = [
    {
      name: 'Composer stores sections in tutorial_sections',
      status: sectionsResult.rows.length > 0
    },
    {
      name: 'Composer stores blocks as JSON in content.blocks[]',
      status: sectionsResult.rows[0]?.content?.blocks && Array.isArray(sectionsResult.rows[0].content.blocks)
    },
    {
      name: 'Blocks have expectedTimeSec field',
      status: hasExpectedInContent
    },
    {
      name: 'ILS tracks page-level progress',
      status: navProgressResult.rows.length > 0
    },
    {
      name: 'ILS tracks block-level state',
      status: blockStateResult.rows.length > 0
    },
    {
      name: 'block_learning_state has expected_time_sec column',
      status: blockStateSchemaResult.rows.some(r => r.column_name === 'expected_time_sec')
    },
    {
      name: 'expected_time_sec is populated in ILS',
      status: hasExpectedInState
    },
    {
      name: 'Foreign keys exist between tables',
      status: fkResult.rows.length > 0
    }
  ];

  checks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
  });
  console.log('');

  // ================================================================
  // SECTION 8: NEXT STEPS
  // ================================================================
  console.log('\n================================================================');
  console.log('SECTION 8: NEXT STEPS');
  console.log('================================================================\n');

  console.log('REQUIRED VERIFICATIONS:\n');

  if (!hasExpectedInContent) {
    console.log('❌ Composer blocks missing expectedTimeSec');
    console.log('   → Verify Phase 4.5 implementation');
    console.log('   → Check if test content needs re-publishing\n');
  }

  if (!hasExpectedInState) {
    console.log('❌ ILS block state not populated with expected_time_sec');
    console.log('   → Verify ILS ingestion code');
    console.log('   → Check if visit tracking copies expectedTimeSec from content\n');
  }

  if (sectionsResult.rows.length === 0) {
    console.log('❌ No content in tutorial_sections');
    console.log('   → Publish test content via Composer');
    console.log('   → Verify Phase 4.5 expectedTimeSec implementation\n');
  }

  console.log('ARCHITECTURE TO CONFIRM:\n');
  console.log('  1. Composer → tutorial_sections.content.blocks[].expectedTimeSec');
  console.log('  2. ILS Visit → copies expectedTimeSec to block_learning_state.expected_time_sec');
  console.log('  3. ILS API → returns both page-level and block-level state');
  console.log('  4. navigationNodeId is primary page identity');
  console.log('  5. blockId + blockVersion is primary block identity');
  console.log('');

  console.log('================================================================');
  console.log('DATABASE AUDIT COMPLETE - NO DATA MODIFIED');
  console.log('================================================================\n');

  await tutorialPool.end();
}

main().catch(err => {
  console.error('DATABASE AUDIT ERROR:', err);
  process.exit(1);
});
