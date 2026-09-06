#!/usr/bin/env node
/**
 * Check recent ILS activity with detailed timestamps
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
    console.log('Recent ILS Activity Check (READ-ONLY)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const now = new Date();
    console.log(`Current time: ${now.toISOString()}\n`);

    // Get all page-level progress with full details
    const navProgressResult = await tutorialPool.query(`
      SELECT 
        user_id,
        navigation_node_id,
        subtopic_id,
        visit_count,
        revision_count,
        time_spent_active_sec,
        status,
        completed_block_count,
        total_block_count,
        first_viewed_at,
        last_viewed_at,
        completed_at,
        created_at,
        updated_at
      FROM tutorial_navigation_progress
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC NULLS LAST
    `);

    console.log('📄 Page-Level Progress (tutorial_navigation_progress)');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Found ${navProgressResult.rows.length} total record(s)\n`);

    for (const row of navProgressResult.rows) {
      const updatedAt = new Date(row.updated_at);
      const minutesAgo = Math.floor((now - updatedAt) / 1000 / 60);
      const isRecent = minutesAgo < 5;
      
      console.log(`${isRecent ? '🆕 ' : ''}User: ${row.user_id}`);
      console.log(`  Node: ${row.navigation_node_id}`);
      console.log(`  Subtopic: ${row.subtopic_id}`);
      console.log(`  Status: ${row.status || 'NULL'}`);
      console.log(`  Visits: ${row.visit_count}`);
      console.log(`  Revisions: ${row.revision_count}`);
      console.log(`  Active Time: ${row.time_spent_active_sec}s`);
      console.log(`  Completed Blocks: ${row.completed_block_count || 0}/${row.total_block_count || 0}`);
      console.log(`  First Viewed: ${row.first_viewed_at || 'NULL'}`);
      console.log(`  Last Viewed: ${row.last_viewed_at || 'NULL'}`);
      console.log(`  Completed: ${row.completed_at || 'NO'}`);
      console.log(`  Created: ${row.created_at}`);
      console.log(`  Updated: ${row.updated_at} (${minutesAgo} minutes ago) ${isRecent ? '🔥 RECENT' : ''}`);
      console.log('');
    }

    // Check for very recent updates (last 10 minutes)
    const recentRecords = navProgressResult.rows.filter(row => {
      const updatedAt = new Date(row.updated_at);
      const minutesAgo = Math.floor((now - updatedAt) / 1000 / 60);
      return minutesAgo < 10;
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total page-level records: ${navProgressResult.rows.length}`);
    console.log(`Recent updates (< 10 min): ${recentRecords.length}`);
    
    if (recentRecords.length > 0) {
      console.log('\n🔥 RECENT ACTIVITY DETECTED:');
      for (const row of recentRecords) {
        const updatedAt = new Date(row.updated_at);
        const minutesAgo = Math.floor((now - updatedAt) / 1000 / 60);
        console.log(`  - User ${row.user_id.substring(0, 8)}... (${minutesAgo} min ago)`);
      }
    }

    // Check block-level with timestamps
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
        last_viewed_at,
        completed_at,
        created_at,
        updated_at
      FROM block_learning_state
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC NULLS LAST
    `);

    console.log('\n\n🧱 Block-Level Progress (block_learning_state)');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Found ${blockProgressResult.rows.length} record(s)\n`);

    if (blockProgressResult.rows.length > 0) {
      for (const row of blockProgressResult.rows) {
        const updatedAt = new Date(row.updated_at);
        const minutesAgo = Math.floor((now - updatedAt) / 1000 / 60);
        const isRecent = minutesAgo < 5;
        
        console.log(`${isRecent ? '🆕 ' : ''}User: ${row.user_id}`);
        console.log(`  Node: ${row.navigation_node_id}`);
        console.log(`  Block: ${row.block_id} (v${row.block_version})`);
        console.log(`  Expected Time: ${row.expected_time_sec}s`);
        console.log(`  Visits: ${row.visit_count}`);
        console.log(`  Active Time: ${row.active_time_sec}s`);
        console.log(`  First Viewed: ${row.first_viewed_at}`);
        console.log(`  Last Viewed: ${row.last_viewed_at}`);
        console.log(`  Updated: ${row.updated_at} (${minutesAgo} minutes ago)`);
        console.log('');
      }
    } else {
      console.log('❌ NO BLOCK-LEVEL RECORDS');
      console.log('   Block visit tracking is not working.');
      console.log('   Even though page-level tracking works, blocks are not being visited.\n');
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
