#!/usr/bin/env node

/**
 * Gate G DB Verification
 * 
 * Purpose: Verify that automatic completion persisted D1 completion
 * in tutorial_navigation_progress.completed_blocks
 * 
 * This closes Gate G (DB persistence).
 */

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
const BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
const BLOCK_VERSION = 'D1';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Gate G DB Verification ===\n');

    const result = await pool.query(
      `SELECT
        user_id,
        navigation_node_id,
        completed_blocks
      FROM tutorial_navigation_progress
      WHERE user_id = $1
        AND navigation_node_id = $2`,
      [USER_ID, NAVIGATION_NODE_ID]
    );

    if (result.rows.length !== 1) {
      throw new Error(
        `Expected exactly one navigation progress row; found ${result.rows.length}`
      );
    }

    const completedBlocks = result.rows[0].completed_blocks ?? [];

    console.log(`Found ${completedBlocks.length} completed block(s):`);
    completedBlocks.forEach((block, idx) => {
      console.log(`  [${idx}] ${block.blockId.substring(0, 8)}... / ${block.blockVersion} @ ${block.completedAt}`);
    });

    const completion = completedBlocks.find(
      (entry) =>
        entry.blockId === BLOCK_ID &&
        entry.blockVersion === BLOCK_VERSION
    );

    if (!completion) {
      console.log('\n❌ Gate G DB FAILED: D1 completion not persisted');
      console.log(`   Expected blockId: ${BLOCK_ID}`);
      console.log(`   Expected blockVersion: ${BLOCK_VERSION}`);
      process.exit(1);
    }

    if (!completion.completedAt) {
      console.log('\n❌ Gate G DB FAILED: D1 completion has no completedAt');
      process.exit(1);
    }

    console.log('\n✅ Gate G DB PASSED\n');
    console.log('Completion record:');
    console.log({
      userId: result.rows[0].user_id,
      navigationNodeId: result.rows[0].navigation_node_id,
      blockId: completion.blockId,
      blockVersion: completion.blockVersion,
      completedAt: completion.completedAt,
    });

  } catch (error) {
    console.error('\n❌ Gate G DB FAILED');
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
