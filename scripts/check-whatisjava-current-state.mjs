#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {

  console.log('\n=== Current State: whatisjava ===\n');

  // Check tutorial_navigation_progress
  const progressResult = await pool.query(
    `SELECT completed_blocks, status
     FROM tutorial_navigation_progress
     WHERE user_id = $1 AND navigation_node_id = $2`,
    [USER_ID, NAVIGATION_NODE_ID]
  );

  console.log('tutorial_navigation_progress:');
  if (progressResult.rows.length === 0) {
    console.log('  ❌ No record found');
  } else {
    const record = progressResult.rows[0];
    console.log(`  status: ${record.status}`);
    console.log(`  completed_blocks: ${record.completed_blocks?.length || 0} entries`);
    
    if (record.completed_blocks?.length > 0) {
      record.completed_blocks.forEach((block, idx) => {
        console.log(`    [${idx}] ${block.blockId.substring(0, 8)}... / ${block.blockVersion} @ ${block.completedAt}`);
      });
    }
  }

  // Check block_learning_state for I1, D1, C1
  const blocks = [
    { id: '7ffd2ee6-ec25-456d-9f0c-a85dc9e67b17', version: 'I1', name: 'I1 (Introduction)' },
    { id: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749', version: 'D1', name: 'D1 (Definition)' },
    { id: 'bb5dd80e-4b94-413f-8d46-b28d6e71f47f', version: 'C1', name: 'C1 (Code)' },
  ];

  console.log('\nblock_learning_state:');
  for (const block of blocks) {
    const result = await pool.query(
      `SELECT active_time_sec, expected_time_sec, completed_at, visit_count
       FROM block_learning_state
       WHERE user_id = $1 AND navigation_node_id = $2 
         AND block_id = $3 AND block_version = $4`,
      [USER_ID, NAVIGATION_NODE_ID, block.id, block.version]
    );

    if (result.rows.length === 0) {
      console.log(`  ${block.name}: ❌ No record`);
    } else {
      const state = result.rows[0];
      console.log(`  ${block.name}:`);
      console.log(`    activeTimeSec: ${state.active_time_sec}s`);
      console.log(`    expectedTimeSec: ${state.expected_time_sec}s`);
      console.log(`    completedAt: ${state.completed_at || 'NULL'}`);
      console.log(`    visitCount: ${state.visit_count}`);
      
      // Calculate if it should be auto-completed (80% threshold)
      if (state.expected_time_sec) {
        const threshold = state.expected_time_sec * 0.8;
        const shouldBeComplete = state.active_time_sec >= threshold;
        console.log(`    threshold (80%): ${threshold}s`);
        console.log(`    should auto-complete: ${shouldBeComplete ? 'YES ✅' : 'NO'}`);
      }
    }
  }

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
