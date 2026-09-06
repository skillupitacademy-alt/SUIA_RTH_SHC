#!/usr/bin/env node
/**
 * WHATISJAVA COMPLETE LINKAGE AUDIT
 * 
 * Comprehensive architectural investigation:
 * Content → Navigation → Brand → Platform Access → User → Progress → Blocks
 * 
 * NO DATA MODIFICATIONS - READ-ONLY INVESTIGATION
 * 
 * Purpose: Determine why whatisjava page may be invisible and establish
 * the complete relationship between shared content, brands, and user progress
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const ORPHANED_SECTION_ID = 'cce5ff0e-0fb1-458e-808a-9858f2e7605d';

const USER_IDS = [
  'b438fb19-fa32-4df4-93b4-91837a5a15ef',
  'afc355ca-6bae-4165-89dd-198494a62f85',
  '54726a2e-fca5-4d93-abc6-e7cee97a86f8'
];

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });

  console.log('================================================================');
  console.log('WHATISJAVA — COMPLETE LINKAGE AUDIT');
  console.log('================================================================\n');
  console.log('ARCHITECTURAL INVESTIGATION (READ-ONLY)');
  console.log('NO DATA MODIFICATIONS WILL BE PERFORMED\n');
  console.log('================================================================\n');

  // ================================================================
  // LAYER 1: CONTENT DEFINITION
  // ================================================================
  console.log('LAYER 1: CONTENT DEFINITION');
  console.log('================================================================\n');

  console.log('Query: tutorial_page_content_v2 WHERE subtopic_id = external_id\n');

  const contentResult = await tutorialPool.query(`
    SELECT 
      id,
      subtopic_id,
      brand_id,
      content_type,
      status,
      version,
      published_at,
      created_at,
      updated_at
    FROM tutorial_page_content_v2
    WHERE subtopic_id = $1
    ORDER BY content_type
  `, [SUBTOPIC_EXTERNAL_ID]);

  console.log(`Found: ${contentResult.rows.length} row(s)\n`);

  if (contentResult.rows.length === 0) {
    console.log('❌ NO CONTENT FOUND in tutorial_page_content_v2');
    console.log('   Content may have been deleted or external_id mismatch\n');
  } else {
    contentResult.rows.forEach((row, i) => {
      console.log(`Content ${i + 1}:`);
      console.log(`  ID:           ${row.id}`);
      console.log(`  Brand:        ${row.brand_id}`);
      console.log(`  Type:         ${row.content_type}`);
      console.log(`  Status:       ${row.status}`);
      console.log(`  Version:      ${row.version}`);
      console.log(`  Published:    ${row.published_at || 'NULL'}`);
      console.log(`  Created:      ${row.created_at}`);
      console.log('');
    });

    const brandIds = [...new Set(contentResult.rows.map(r => r.brand_id))];
    const statuses = [...new Set(contentResult.rows.map(r => r.status))];

    console.log('CONTENT SUMMARY:');
    console.log(`  Brands:       ${brandIds.join(', ')}`);
    console.log(`  Statuses:     ${statuses.join(', ')}`);
    console.log(`  Total pieces: ${contentResult.rows.length}`);
    
    if (brandIds.includes('shared')) {
      console.log('\n  ✅ SHARED CONTENT MODEL CONFIRMED');
      console.log('     Content is intentionally shared across brands');
    }
    console.log('');
  }

  // Check tutorial_sections for comparison
  console.log('COMPARISON: tutorial_sections WHERE subtopic_id = internal_id\n');

  const sectionsResult = await tutorialPool.query(`
    SELECT COUNT(*) as count
    FROM tutorial_sections
    WHERE subtopic_id = $1
  `, [SUBTOPIC_INTERNAL_ID]);

  console.log(`tutorial_sections: ${sectionsResult.rows[0].count} row(s)`);
  
  if (sectionsResult.rows[0].count === '0') {
    console.log('❌ tutorial_sections is EMPTY for this subtopic');
    console.log('   Content storage has migrated to tutorial_page_content_v2\n');
  }

  // ================================================================
  // LAYER 2: SUBTOPIC IDENTITY CHAIN
  // ================================================================
  console.log('\n================================================================');
  console.log('LAYER 2: SUBTOPIC IDENTITY CHAIN');
  console.log('================================================================\n');

  const subtopicResult = await tutorialPool.query(`
    SELECT 
      id as internal_id,
      external_id,
      name,
      slug,
      created_at
    FROM tutorial_subtopics
    WHERE id = $1 OR external_id = $2
  `, [SUBTOPIC_INTERNAL_ID, SUBTOPIC_EXTERNAL_ID]);

  if (subtopicResult.rows.length > 0) {
    const st = subtopicResult.rows[0];
    console.log('✅ Subtopic EXISTS:');
    console.log(`  Internal ID:  ${st.internal_id}`);
    console.log(`  External ID:  ${st.external_id}`);
    console.log(`  Name:         ${st.name}`);
    console.log(`  Slug:         ${st.slug}`);
    console.log(`  Created:      ${st.created_at}`);
    console.log('');

    console.log('IDENTITY MAPPING:');
    console.log(`  navigationNodeId → "${NAVIGATION_NODE_ID}" (text slug)`);
    console.log(`  subtopic internal → ${st.internal_id} (UUID)`);
    console.log(`  subtopic external → ${st.external_id} (UUID)`);
    console.log(`  subtopic slug     → ${st.slug}`);
    console.log('');

    if (st.internal_id !== st.external_id) {
      console.log('  ⚠️  DUAL ID SYSTEM DETECTED');
      console.log('     Internal ID used by tutorial_sections/progress');
      console.log('     External ID used by tutorial_page_content_v2/curriculum');
    }
  } else {
    console.log('❌ Subtopic NOT FOUND');
  }
  console.log('');

  // ================================================================
  // LAYER 3: USER IDENTITY & PLATFORM ACCESS
  // ================================================================
  console.log('\n================================================================');
  console.log('LAYER 3: USER IDENTITY & PLATFORM ACCESS');
  console.log('================================================================\n');

  console.log('A. User Identity (people_prod.users)\n');

  const userMap = new Map();

  for (const userId of USER_IDS) {
    try {
      const userResult = await peoplePool.query(
        'SELECT id, email, role, platform, is_active, created_at, deleted_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        userMap.set(userId, user);
        console.log(`✅ User ${userId.substring(0, 8)}... EXISTS`);
        console.log(`   Email:    ${user.email}`);
        console.log(`   Role:     ${user.role}`);
        console.log(`   Platform: ${user.platform}`);
        console.log(`   Active:   ${user.is_active}`);
        console.log(`   Deleted:  ${user.deleted_at || 'NULL'}`);
      } else {
        console.log(`❌ User ${userId.substring(0, 8)}... NOT FOUND`);
        userMap.set(userId, null);
      }
    } catch (err) {
      console.log(`⚠️  User ${userId.substring(0, 8)}... ERROR: ${err.message}`);
      userMap.set(userId, { error: err.message });
    }
    console.log('');
  }

  console.log('B. Platform Access (people_prod.platform_access)\n');

  try {
    const platformAccessResult = await peoplePool.query(`
      SELECT user_id, platform, status, created_at, deleted_at
      FROM platform_access
      WHERE user_id = ANY($1::uuid[])
      ORDER BY user_id, platform
    `, [USER_IDS]);

    if (platformAccessResult.rows.length > 0) {
      console.log(`Found ${platformAccessResult.rows.length} platform access record(s):\n`);
      
      USER_IDS.forEach(userId => {
        const access = platformAccessResult.rows.filter(r => r.user_id === userId);
        const user = userMap.get(userId);
        
        console.log(`User ${userId.substring(0, 8)}... (${user?.email || 'NOT FOUND'}):`);
        
        if (access.length > 0) {
          access.forEach(a => {
            console.log(`  Platform: ${a.platform}`);
            console.log(`    Status:  ${a.status}`);
            console.log(`    Created: ${a.created_at}`);
            console.log(`    Deleted: ${a.deleted_at || 'NULL'}`);
          });
        } else {
          console.log(`  ❌ No platform_access records`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  NO platform_access records found for these users');
      console.log('   Users may have direct platform assignment or different access model\n');
    }
  } catch (err) {
    console.log(`⚠️  platform_access query error: ${err.message}`);
    console.log('   Table may not exist or schema different\n');
  }

  // ================================================================
  // LAYER 4: NAVIGATION PROGRESS
  // ================================================================
  console.log('\n================================================================');
  console.log('LAYER 4: NAVIGATION PROGRESS');
  console.log('================================================================\n');

  const progressResult = await tutorialPool.query(`
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
      created_at,
      first_viewed_at,
      last_viewed_at,
      completed_at,
      deleted_at
    FROM tutorial_navigation_progress
    WHERE navigation_node_id = $1
    ORDER BY created_at
  `, [NAVIGATION_NODE_ID]);

  console.log(`Found: ${progressResult.rows.length} progress row(s)\n`);

  progressResult.rows.forEach((row, i) => {
    const user = userMap.get(row.user_id);
    const label = String.fromCharCode(65 + i); // A, B, C, ...

    console.log(`ROW ${label} (Progress ID: ${row.id.substring(0, 8)}...):`);
    console.log(`  User:         ${user?.email || row.user_id.substring(0, 8) + '...'}`);
    console.log(`  Platform:     ${user?.platform || 'UNKNOWN'}`);
    console.log(`  Navigation:   ${row.navigation_node_id}`);
    console.log(`  Subtopic:     ${row.subtopic_id === SUBTOPIC_INTERNAL_ID ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`  Section:      ${row.section_id || 'NULL'}`);
    
    if (row.section_id === ORPHANED_SECTION_ID) {
      console.log(`                ⚠️  ORPHANED (known Phase 2 section)`);
    }
    
    console.log(`  Visits:       ${row.visit_count}`);
    console.log(`  Status:       ${row.status}`);
    console.log(`  Active time:  ${row.time_spent_active_sec}s`);
    console.log(`  Revisions:    ${row.revision_count}`);
    console.log(`  Blocks done:  ${row.completed_blocks.length}`);
    console.log(`  Session:      ${row.last_session_id || 'NULL'}`);
    console.log(`  Created:      ${row.created_at}`);
    console.log(`  First view:   ${row.first_viewed_at || 'NULL'}`);
    console.log(`  Last view:    ${row.last_viewed_at || 'NULL'}`);
    console.log(`  Completed:    ${row.completed_at || 'NULL'}`);
    console.log(`  Deleted:      ${row.deleted_at || 'NULL'}`);
    console.log('');
  });

  // ================================================================
  // LAYER 5: BLOCK LEARNING STATE
  // ================================================================
  console.log('\n================================================================');
  console.log('LAYER 5: BLOCK LEARNING STATE');
  console.log('================================================================\n');

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
      created_at
    FROM block_learning_state
    WHERE user_id = ANY($1::uuid[])
      AND navigation_node_id = $2
    ORDER BY user_id, block_id
  `, [USER_IDS, NAVIGATION_NODE_ID]);

  console.log(`Found: ${blockStateResult.rows.length} block state row(s)\n`);

  if (blockStateResult.rows.length > 0) {
    USER_IDS.forEach(userId => {
      const blocks = blockStateResult.rows.filter(r => r.user_id === userId);
      const user = userMap.get(userId);
      
      if (blocks.length > 0) {
        console.log(`User ${user?.email || userId.substring(0, 8) + '...'}:`);
        console.log(`  ${blocks.length} block(s):`);
        blocks.forEach(b => {
          console.log(`    ${b.block_id} v${b.block_version}: ${b.visit_count} visits, ${b.active_time_sec}s active`);
        });
        console.log('');
      }
    });
  } else {
    console.log('  No block-level learning state for these users\n');
  }

  // ================================================================
  // LAYER 6: ORPHANED SECTION INVESTIGATION
  // ================================================================
  console.log('\n================================================================');
  console.log('LAYER 6: ORPHANED SECTION INVESTIGATION');
  console.log('================================================================\n');

  console.log(`Investigating section_id: ${ORPHANED_SECTION_ID}\n`);

  const orphanedSectionResult = await tutorialPool.query(`
    SELECT * FROM tutorial_sections WHERE id = $1
  `, [ORPHANED_SECTION_ID]);

  if (orphanedSectionResult.rows.length > 0) {
    console.log('✅ Section EXISTS in tutorial_sections');
    console.log(JSON.stringify(orphanedSectionResult.rows[0], null, 2));
  } else {
    console.log('❌ Section DOES NOT EXIST in tutorial_sections');
    console.log('   Progress rows reference deleted/migrated section');
  }
  console.log('');

  // Check if this section_id appears elsewhere
  const sectionReferencesResult = await tutorialPool.query(`
    SELECT COUNT(*) as count
    FROM tutorial_navigation_progress
    WHERE section_id = $1
  `, [ORPHANED_SECTION_ID]);

  console.log(`References to this section_id:`);
  console.log(`  tutorial_navigation_progress: ${sectionReferencesResult.rows[0].count} row(s)`);
  console.log('');

  // ================================================================
  // ARCHITECTURAL ANALYSIS
  // ================================================================
  console.log('\n================================================================');
  console.log('ARCHITECTURAL ANALYSIS');
  console.log('================================================================\n');

  console.log('CONTENT STORAGE:');
  console.log(`  tutorial_sections:        ${sectionsResult.rows[0].count} row(s)`);
  console.log(`  tutorial_page_content_v2: ${contentResult.rows.length} row(s)`);
  console.log('');

  if (sectionsResult.rows[0].count === '0' && contentResult.rows.length > 0) {
    console.log('  ✅ MIGRATION DETECTED:');
    console.log('     Content moved from tutorial_sections → tutorial_page_content_v2');
    console.log('     Progress rows still reference old section_id');
  }
  console.log('');

  console.log('CONTENT MODEL:');
  const hasSharedContent = contentResult.rows.some(r => r.brand_id === 'shared');
  if (hasSharedContent) {
    console.log('  ✅ SHARED CONTENT ARCHITECTURE');
    console.log('     One content definition serves multiple brands');
    console.log('     Progress is user-specific, content is shared');
  }
  console.log('');

  console.log('USER→BRAND MAPPING:');
  const userPlatforms = [...new Set([...userMap.values()].filter(u => u && !u.error).map(u => u.platform))];
  console.log(`  Platforms represented: ${userPlatforms.join(', ') || 'NONE'}`);
  console.log('');

  console.log('PROGRESS→CONTENT LINKAGE:');
  const hasOrphanedSections = progressResult.rows.some(r => r.section_id === ORPHANED_SECTION_ID);
  if (hasOrphanedSections) {
    console.log('  ❌ BROKEN LINKAGE:');
    console.log('     Progress rows point to non-existent section_id');
    console.log('     section_id may be legacy field');
  }
  console.log('');

  // ================================================================
  // VISIBILITY ANALYSIS
  // ================================================================
  console.log('\n================================================================');
  console.log('VISIBILITY ANALYSIS');
  console.log('================================================================\n');

  console.log('WHY MIGHT WHATISJAVA BE INVISIBLE?\n');

  const reasons = [];

  if (contentResult.rows.length === 0) {
    reasons.push('❌ No content in tutorial_page_content_v2');
  } else {
    reasons.push('✅ Content exists in tutorial_page_content_v2');
  }

  if (sectionsResult.rows[0].count === '0') {
    reasons.push('⚠️  tutorial_sections is empty (may break old delivery code)');
  }

  const hasActiveContent = contentResult.rows.some(r => r.status === 'published' && r.published_at);
  if (!hasActiveContent) {
    reasons.push('❌ No published/active content');
  } else {
    reasons.push('✅ Published content exists');
  }

  const usersExist = [...userMap.values()].some(u => u && !u.error);
  if (!usersExist) {
    reasons.push('❌ No valid users found');
  } else {
    reasons.push('✅ Valid users exist');
  }

  reasons.forEach(r => console.log(`  ${r}`));

  console.log('\nMOST LIKELY CAUSE:');
  if (sectionsResult.rows[0].count === '0' && contentResult.rows.length > 0) {
    console.log('  Delivery code still queries tutorial_sections (empty)');
    console.log('  Should query tutorial_page_content_v2 (has data)');
    console.log('  → CODE MIGRATION REQUIRED, not progress deletion');
  } else {
    console.log('  Investigate delivery path: getPublishedTutorialPagePayload()');
  }
  console.log('');

  // ================================================================
  // RECOMMENDATIONS
  // ================================================================
  console.log('\n================================================================');
  console.log('RECOMMENDATIONS');
  console.log('================================================================\n');

  console.log('DO NOT:');
  console.log('  ❌ Delete progress rows based on visit_count');
  console.log('  ❌ Modify section_id to NULL');
  console.log('  ❌ Assume high visit_count = test artifact');
  console.log('  ❌ Assume visit_count = 0 = legitimate only');
  console.log('');

  console.log('INVESTIGATE NEXT:');
  console.log('  1. Trace getPublishedTutorialPagePayload() in delivery code');
  console.log('  2. Determine if it queries tutorial_sections or tutorial_page_content_v2');
  console.log('  3. Verify platform_access enforcement');
  console.log('  4. Check if section_id is nullable by design');
  console.log('  5. Determine if progress rows are independent per user+brand');
  console.log('');

  console.log('ARCHITECTURE TO VERIFY:');
  console.log('  Hypothesis: ONE shared content → MANY user progress records');
  console.log('  Expected:   visit_count is telemetry, NOT visibility control');
  console.log('  Expected:   Content in tutorial_page_content_v2 (brand_id=shared)');
  console.log('  Expected:   Progress per user, independent of content definition');
  console.log('');

  console.log('================================================================');
  console.log('INVESTIGATION COMPLETE - NO DATA MODIFIED');
  console.log('================================================================\n');

  await tutorialPool.end();
  await peoplePool.end();
}

main().catch(err => {
  console.error('LINKAGE AUDIT ERROR:', err);
  process.exit(1);
});
