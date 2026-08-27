#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

config({
  path: path.join(PROJECT_ROOT, '.env.local'),
});

const { Client } = pg;

const SECTION_ID = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });

  await client.connect();

  try {
    const result = await client.query(
      `
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        version,
        published_at,
        updated_at,
        deleted_at,
        jsonb_array_length(
          content::jsonb -> 'blocks'
        ) AS block_count,
        content::jsonb -> 'blocks' -> 0 ->> 'id'
          AS first_block_id,
        content::jsonb -> 'blocks' -> 0 ->> 'type'
          AS first_block_type,
        content::jsonb -> 'blocks' -> 0 ->> 'version'
          AS first_block_version,
        content::jsonb -> 'blocks' -> 0
          -> 'content'
          -> 'page'
          ->> 'title'
          AS first_block_title
      FROM tutorial_sections
      WHERE id = $1
      `,
      [SECTION_ID]
    );

    const row = result.rows[0];

    if (!row) {
      console.error('❌ SECTION NOT FOUND');
      process.exitCode = 1;
      return;
    }

    console.log('');
    console.log('D1 PUBLISH STATE');
    console.log('='.repeat(60));
    console.log('Section ID:       ', row.id);
    console.log('Subtopic ID:      ', row.subtopic_id);
    console.log('Navigation Node:  ', row.navigation_node_id);
    console.log('Brand:            ', row.brand_id);
    console.log('Status:           ', row.status);
    console.log('Version:          ', row.version);
    console.log('Published At:     ', row.published_at);
    console.log('Updated At:       ', row.updated_at);
    console.log('Deleted At:       ', row.deleted_at);
    console.log('Block Count:      ', row.block_count);
    console.log('First Block ID:   ', row.first_block_id);
    console.log('First Block Type: ', row.first_block_type);
    console.log('First Block Ver:  ', row.first_block_version);
    console.log('First Block Title:', row.first_block_title);
    console.log('='.repeat(60));
    console.log('');

    // Determine state
    if (row.status === 'deployed' && row.published_at) {
      console.log('✅ D1 IS PUBLISHED');
      console.log('   Published:', new Date(row.published_at).toLocaleString());
    } else if (row.status === 'draft') {
      console.log('⚠️  D1 IS DRAFT (not published)');
    } else {
      console.log(`⚠️  D1 STATUS: ${row.status}`);
    }
    console.log('');

  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exitCode = 1;
});
