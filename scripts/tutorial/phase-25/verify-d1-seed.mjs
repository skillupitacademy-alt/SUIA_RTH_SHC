#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

const { Client } = pg;

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });

  await client.connect();

  try {
    const result = await client.query(`
      SELECT
        id,
        navigation_node_id,
        status,
        version,
        jsonb_array_length(content->'blocks') as block_count,
        content->'blocks'->0->'content'->'page'->>'title' as title,
        content->'blocks'->0->'id' as block_id,
        jsonb_array_length(content->'blocks'->0->'content'->'page'->'characteristics') as char_count
      FROM tutorial_sections
      WHERE id = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4'
    `);

    if (result.rows.length === 0) {
      console.log('✗ Section not found');
      process.exit(1);
    }

    const row = result.rows[0];

    console.log('');
    console.log('✓ D1 SEED VERIFICATION');
    console.log('='.repeat(50));
    console.log(`Section ID:       ${row.id}`);
    console.log(`navigationNodeId: ${row.navigation_node_id}`);
    console.log(`Status:           ${row.status}`);
    console.log(`Version:          ${row.version}`);
    console.log(`Block Count:      ${row.block_count}`);
    console.log(`Block ID:         ${row.block_id}`);
    console.log(`Title:            ${row.title}`);
    console.log(`Characteristics:  ${row.char_count}`);
    console.log('='.repeat(50));
    console.log('');

    if (row.navigation_node_id === 'whatisjava' &&
        row.title === 'What Is Java?' &&
        parseInt(row.char_count) === 4 &&
        row.status === 'draft') {
      console.log('✓ ALL CHECKS PASSED');
    } else {
      console.log('✗ SOME CHECKS FAILED');
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

verify().catch(error => {
  console.error('✗ Error:', error.message);
  process.exit(1);
});
