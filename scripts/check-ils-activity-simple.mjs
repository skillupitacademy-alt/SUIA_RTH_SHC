#!/usr/bin/env node
/**
 * Simple ILS activity check without assuming column names
 * READ-ONLY
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ILS Activity Check (READ-ONLY)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check page-level progress with minimal columns
    const navProgressResult = await tutorialPool.query(`
      SELECT 
        user_id,
        navigation_node_id,
        visit_count,
        created_at,
        updated_at
      FROM tutorial_navigation_progress
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 10
    `);

    console.log('📄 Page-Level Progress (tutorial_navigation_progress)');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Found ${navProgressResult.rows.length} record(s)\n`);

    if (navProgressResult.rows.length > 0) {
      for (const row of navProgressResult.rows) {
        console.log(`User: ${row.user_id}`);
        console.log(`  Node: ${row.navigation_node_id}`);
        console.log(`  Visits: ${row.visit_count}`);
        console.log(`  Updated: ${row.updated_at}`);
        console.log('');
      }
    } else {
      console.log('⚠️  No page-level progress found.\n');
    }

    // Check block-level progress
    const blockProgressResult = await tutorialPool.query(`
      SELECT 
        user_id,
        navigation_node_id,
        block_id,
        block_version,
        visit_count,
        active_time_sec,
        expected_time_sec,
        first_viewed_at,
        last_viewed_at
      FROM block_learning_state
      WHERE deleted_at IS NULL
      ORDER BY last_viewed_at DESC NULLS LAST
      LIMIT 10
    `);

    console.log('\n🧱 Block-Level Progress (block_learning_state)');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Found ${blockProgressResult.rows.length} record(s)\n`);

    if (blockProgressResult.rows.length > 0) {
      for (const row of blockProgressResult.rows) {
        console.log(`User: ${row.user_id}`);
        console.log(`  Node: ${row.navigation_node_id}`);
        console.log(`  Block: ${row.block_id} (v${row.block_version})`);
        console.log(`  Expected Time: ${row.expected_time_sec}s`);
        console.log(`  Visits: ${row.visit_count}`);
        console.log(`  Active Time: ${row.active_time_sec}s`);
        console.log(`  Last Viewed: ${row.last_viewed_at}`);
        console.log('');
      }
    } else {
      console.log('⚠️  No block-level progress found.\n');
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Page-level records: ${navProgressResult.rows.length}`);
    console.log(`Block-level records: ${blockProgressResult.rows.length}`);
    
    if (navProgressResult.rows.length === 0 && blockProgressResult.rows.length === 0) {
      console.log('\n❌ NO ILS ACTIVITY DETECTED');
      console.log('   Possible reasons:');
      console.log('   1. User not logged in / Authentication failing');
      console.log('   2. ILS endpoints not being called from browser');
      console.log('   3. ILS API calls returning errors');
    } else {
      console.log('\n✅ ILS ACTIVITY DETECTED');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    await tutorialPool.end();
  }
}

main();
