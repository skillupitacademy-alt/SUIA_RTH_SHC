#!/usr/bin/env node
/**
 * Phase 4.5: ILS expectedTimeSec READ-ONLY Audit
 * 
 * Verifies expectedTimeSec flow:
 * 1. Composer → tutorial_sections.content.blocks[].expectedTimeSec
 * 2. ILS → block_learning_state.expected_time_sec
 * 
 * READ-ONLY: No data modification
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

console.log('═══════════════════════════════════════════════════════════════');
console.log('Phase 4.5: ILS expectedTimeSec READ-ONLY Audit');
console.log('═══════════════════════════════════════════════════════════════\n');

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
  // 1. Audit Composer Storage (tutorial_sections)
  console.log('📦 STEP 1: Composer Storage Audit (tutorial_sections)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const sectionsResult = await tutorialPool.query(`
    SELECT 
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      content
    FROM tutorial_sections
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 5
  `);

  const sections = sectionsResult.rows;
  console.log(`Found ${sections.length} section(s)\n`);

  for (const section of sections) {
    console.log(`Section: ${section.id}`);
    console.log(`  Subtopic: ${section.subtopic_id}`);
    console.log(`  Navigation Node: ${section.navigation_node_id}`);
    console.log(`  Brand: ${section.brand_id}`);

    const content = section.content;
    if (content?.blocks) {
      console.log(`  Blocks: ${content.blocks.length}`);
      
      content.blocks.forEach((block, idx) => {
        console.log(`    [${idx}] ${block.id} (v${block.version || '?'})`);
        console.log(`        expectedTimeSec: ${block.expectedTimeSec ?? 'NULL'}`);
        console.log(`        type: ${block.type || '?'}`);
      });
    } else {
      console.log('  Blocks: NONE');
    }
    console.log('');
  }

  // 2. Audit ILS Storage (block_learning_state)
  console.log('\n📊 STEP 2: ILS Storage Audit (block_learning_state)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const blockStatesResult = await tutorialPool.query(`
    SELECT 
      user_id,
      navigation_node_id,
      block_id,
      block_version,
      expected_time_sec,
      visit_count,
      active_time_sec,
      completed_at,
      first_viewed_at,
      last_viewed_at
    FROM block_learning_state
    WHERE deleted_at IS NULL
    ORDER BY last_viewed_at DESC NULLS LAST
    LIMIT 10
  `);

  const blockStates = blockStatesResult.rows;
  console.log(`Found ${blockStates.length} block state(s)\n`);

  if (blockStates.length === 0) {
    console.log('⚠️  No block_learning_state records found.');
    console.log('   This is expected if no learner has visited any blocks yet.\n');
  } else {
    for (const state of blockStates) {
      console.log(`Block State: ${state.block_id} (v${state.block_version})`);
      console.log(`  User: ${state.user_id}`);
      console.log(`  Navigation Node: ${state.navigation_node_id}`);
      console.log(`  Expected Time (sec): ${state.expected_time_sec ?? 'NULL'}`);
      console.log(`  Visit Count: ${state.visit_count}`);
      console.log(`  Active Time (sec): ${state.active_time_sec}`);
      console.log(`  Completed: ${state.completed_at ? 'YES' : 'NO'}`);
      console.log(`  First Viewed: ${state.first_viewed_at || 'NULL'}`);
      console.log(`  Last Viewed: ${state.last_viewed_at || 'NULL'}`);
      console.log('');
    }
  }

  // 3. Cross-Reference: Composer ↔ ILS
  console.log('\n🔗 STEP 3: Cross-Reference Audit (Composer ↔ ILS)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const crossRefResult = await tutorialPool.query(`
    SELECT 
      ts.subtopic_id,
      ts.navigation_node_id,
      bls.block_id,
      bls.block_version,
      bls.expected_time_sec AS ils_expected_time_sec,
      bls.visit_count,
      ts.content
    FROM block_learning_state bls
    INNER JOIN tutorial_sections ts 
      ON bls.navigation_node_id = ts.navigation_node_id
      AND ts.deleted_at IS NULL
    WHERE bls.deleted_at IS NULL
    ORDER BY bls.last_viewed_at DESC NULLS LAST
    LIMIT 10
  `);

  const crossRef = crossRefResult.rows;
  console.log(`Found ${crossRef.length} cross-reference(s)\n`);

  if (crossRef.length === 0) {
    console.log('⚠️  No cross-references found (no learner visits yet).\n');
  } else {
    for (const ref of crossRef) {
      console.log(`Block: ${ref.block_id} (v${ref.block_version})`);
      console.log(`  Navigation Node: ${ref.navigation_node_id}`);
      console.log(`  Visit Count: ${ref.visit_count}`);

      // Find block in composer content
      const content = ref.content;
      let composerExpectedTime = null;
      if (content?.blocks) {
        const block = content.blocks.find(
          b => b.id === ref.block_id && b.version === ref.block_version
        );
        composerExpectedTime = block?.expectedTimeSec ?? null;
      }

      console.log(`  Composer expectedTimeSec: ${composerExpectedTime ?? 'NULL'}`);
      console.log(`  ILS expected_time_sec: ${ref.ils_expected_time_sec ?? 'NULL'}`);

      // Validation
      if (composerExpectedTime === ref.ils_expected_time_sec) {
        console.log(`  ✅ MATCH`);
      } else if (composerExpectedTime !== null && ref.ils_expected_time_sec === null) {
        console.log(`  ⚠️  ILS missing expectedTimeSec (visit may predate Phase 4.5)`);
      } else if (composerExpectedTime === null && ref.ils_expected_time_sec !== null) {
        console.log(`  ⚠️  Composer missing expectedTimeSec but ILS has it`);
      } else {
        console.log(`  ❌ MISMATCH`);
      }
      console.log('');
    }
  }

  // 4. Summary Statistics
  console.log('\n📈 STEP 4: Summary Statistics');
  console.log('─────────────────────────────────────────────────────────────\n');

  const statsResult = await tutorialPool.query(`
    SELECT
      COUNT(*) AS total_sections,
      COUNT(CASE WHEN content IS NOT NULL THEN 1 END) AS sections_with_content
    FROM tutorial_sections
    WHERE deleted_at IS NULL
  `);

  const blockStatsResult = await tutorialPool.query(`
    SELECT
      COUNT(*) AS total_block_states,
      COUNT(CASE WHEN expected_time_sec IS NOT NULL THEN 1 END) AS states_with_expected_time,
      COUNT(CASE WHEN expected_time_sec IS NULL THEN 1 END) AS states_without_expected_time,
      AVG(expected_time_sec) AS avg_expected_time_sec,
      MIN(expected_time_sec) AS min_expected_time_sec,
      MAX(expected_time_sec) AS max_expected_time_sec
    FROM block_learning_state
    WHERE deleted_at IS NULL
  `);

  const stats = statsResult.rows[0];
  const blockStats = blockStatsResult.rows[0];

  console.log('Composer (tutorial_sections):');
  console.log(`  Total sections: ${stats.total_sections}`);
  console.log(`  Sections with content: ${stats.sections_with_content}\n`);

  console.log('ILS (block_learning_state):');
  console.log(`  Total block states: ${blockStats.total_block_states}`);
  console.log(`  States with expected_time_sec: ${blockStats.states_with_expected_time}`);
  console.log(`  States without expected_time_sec: ${blockStats.states_without_expected_time}`);
  
  if (blockStats.avg_expected_time_sec !== null) {
    console.log(`  Average expected_time_sec: ${parseFloat(blockStats.avg_expected_time_sec).toFixed(2)}`);
    console.log(`  Min expected_time_sec: ${blockStats.min_expected_time_sec}`);
    console.log(`  Max expected_time_sec: ${blockStats.max_expected_time_sec}`);
  } else {
    console.log(`  Average expected_time_sec: N/A`);
  }
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Audit Complete (READ-ONLY)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await tutorialPool.end();
  }
}

main();
