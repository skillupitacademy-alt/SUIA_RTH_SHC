#!/usr/bin/env node

/**
 * Gate H: Get Navigation Identity
 * 
 * Purpose: Extract subtopicId and sectionId from existing navigation progress
 * to construct correct HTTP API call with full identity parameters.
 * 
 * READ-ONLY FORENSIC QUERY
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

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Gate H: Navigation Identity Query ===\n');
    console.log('READ-ONLY FORENSIC VERIFICATION\n');

    const result = await pool.query(
      `SELECT
        user_id,
        navigation_node_id,
        subtopic_id,
        section_id,
        status,
        completed_blocks
      FROM tutorial_navigation_progress
      WHERE user_id = $1
        AND navigation_node_id = $2`,
      [USER_ID, NAVIGATION_NODE_ID]
    );

    if (result.rows.length === 0) {
      console.log('❌ No navigation progress record found');
      process.exit(1);
    }

    const record = result.rows[0];

    console.log('Navigation Identity:');
    console.log('  userId:', record.user_id);
    console.log('  navigationNodeId:', record.navigation_node_id);
    console.log('  subtopicId:', record.subtopic_id);
    console.log('  sectionId:', record.section_id);
    console.log('  status:', record.status);
    console.log('');

    console.log('Completed Blocks:');
    if (!record.completed_blocks || record.completed_blocks.length === 0) {
      console.log('  ❌ No completed blocks');
    } else {
      record.completed_blocks.forEach((block, idx) => {
        console.log(`  [${idx}] ${block.blockId.substring(0, 8)}... / ${block.blockVersion} @ ${block.completedAt}`);
      });
    }

    console.log('');
    console.log('✅ Identity retrieved successfully');
    console.log('');
    console.log('For HTTP API call, use:');
    console.log(`  GET /api/tutorial/ils/navigation/${record.navigation_node_id}?subtopicId=${encodeURIComponent(record.subtopic_id)}`);

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
