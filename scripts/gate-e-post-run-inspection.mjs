#!/usr/bin/env node

/**
 * Gate E Post-Run Inspection
 * 
 * Purpose: Inspect D1 block_learning_state immediately after Gate E run
 * 
 * Proves:
 * 1. Gate E created/updated block_learning_state
 * 2. active_time_sec matches delivered POST (~16 seconds)
 * 3. Which user_id was actually persisted
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const NAVIGATION_NODE_ID = 'whatisjava';
const BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Gate E Post-Run Inspection ===\n');
    console.log('Target:');
    console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
    console.log(`  blockId: ${BLOCK_ID}`);
    console.log('');

    // Query D1 block_learning_state
    console.log('1. Querying D1 block_learning_state after Gate E...');
    const stateResult = await pool.query(
      `SELECT 
        user_id,
        navigation_node_id,
        block_id,
        block_version,
        active_time_sec,
        visit_count,
        completed_at,
        deleted_at,
        created_at,
        updated_at
      FROM block_learning_state
      WHERE navigation_node_id = $1
        AND block_id = $2
      ORDER BY updated_at DESC`,
      [NAVIGATION_NODE_ID, BLOCK_ID]
    );

    if (stateResult.rows.length === 0) {
      console.log('   ⚠️  No block_learning_state found');
      console.log('   This means Gate E POST did NOT persist to database');
      console.log('   OR the persistence used a different user_id/block combination');
    } else {
      console.log(`   Found ${stateResult.rows.length} record(s):`);
      stateResult.rows.forEach((row, idx) => {
        console.log(`\n   [${idx}]:`);
        console.log(`     user_id: ${row.user_id}`);
        console.log(`     navigation_node_id: ${row.navigation_node_id}`);
        console.log(`     block_id: ${row.block_id}`);
        console.log(`     block_version: ${row.block_version}`);
        console.log(`     active_time_sec: ${row.active_time_sec}`);
        console.log(`     visit_count: ${row.visit_count}`);
        console.log(`     completed_at: ${row.completed_at}`);
        console.log(`     deleted_at: ${row.deleted_at}`);
        console.log(`     created_at: ${row.created_at}`);
        console.log(`     updated_at: ${row.updated_at}`);
      });

      // Verify expected state
      const latestRow = stateResult.rows[0];
      console.log('\n2. Verification:');
      
      if (latestRow.active_time_sec >= 15 && latestRow.active_time_sec <= 20) {
        console.log(`   ✅ active_time_sec (${latestRow.active_time_sec}) matches Gate E POST (~16)`);
      } else {
        console.log(`   ⚠️  active_time_sec (${latestRow.active_time_sec}) does NOT match Gate E POST (expected ~16)`);
        console.log(`   This suggests historical state or multiple runs`);
      }

      if (latestRow.block_version === 'D1') {
        console.log(`   ✅ block_version: D1`);
      } else {
        console.log(`   ⚠️  block_version: ${latestRow.block_version} (expected D1)`);
      }

      if (latestRow.deleted_at === null) {
        console.log(`   ✅ Not soft-deleted`);
      } else {
        console.log(`   ⚠️  Soft-deleted at: ${latestRow.deleted_at}`);
      }
    }

    // Query telemetry events
    console.log('\n3. Querying recent telemetry events for D1...');
    const eventsResult = await pool.query(
      `SELECT 
        event_id,
        user_id,
        navigation_node_id,
        block_id,
        block_version,
        active_time_sec,
        created_at
      FROM block_active_time_events
      WHERE navigation_node_id = $1
        AND block_id = $2
      ORDER BY created_at DESC
      LIMIT 5`,
      [NAVIGATION_NODE_ID, BLOCK_ID]
    );

    if (eventsResult.rows.length === 0) {
      console.log('   ℹ️  No telemetry events found');
      console.log('   (Table may not exist or may be named differently)');
    } else {
      console.log(`   Found ${eventsResult.rows.length} recent event(s):`);
      eventsResult.rows.forEach((row, idx) => {
        console.log(`\n   [${idx}]:`);
        console.log(`     event_id: ${row.event_id}`);
        console.log(`     user_id: ${row.user_id}`);
        console.log(`     block_version: ${row.block_version}`);
        console.log(`     active_time_sec: ${row.active_time_sec}`);
        console.log(`     created_at: ${row.created_at}`);
      });

      // Check if most recent event matches Gate E
      const mostRecentEvent = eventsResult.rows[0];
      const timeSinceEvent = Date.now() - new Date(mostRecentEvent.created_at).getTime();
      const minutesAgo = Math.round(timeSinceEvent / 60000);

      console.log(`\n   Most recent event was ${minutesAgo} minute(s) ago`);
      
      if (minutesAgo <= 5 && mostRecentEvent.active_time_sec >= 15 && mostRecentEvent.active_time_sec <= 20) {
        console.log(`   ✅ Recent event matches Gate E timing (~16 seconds)`);
      }
    }

    // Check for other user identities
    console.log('\n4. Checking for D1 state with other user identities...');
    const allUsersResult = await pool.query(
      `SELECT 
        user_id,
        active_time_sec,
        updated_at
      FROM block_learning_state
      WHERE navigation_node_id = $1
        AND block_id = $2`,
      [NAVIGATION_NODE_ID, BLOCK_ID]
    );

    if (allUsersResult.rows.length > 1) {
      console.log(`   ⚠️  Found ${allUsersResult.rows.length} different user records for D1:`);
      allUsersResult.rows.forEach((row, idx) => {
        console.log(`   [${idx}] userId=${row.user_id.substring(0, 8)}..., activeTimeSec=${row.active_time_sec}, updated=${row.updated_at}`);
      });
    } else {
      console.log(`   ✅ Only one user identity has D1 state`);
    }

    console.log('\n=== Inspection Complete ===\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
