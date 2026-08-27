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

const SECTION_ID = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });

  await client.connect();

  try {
    const result = await client.query(
      `SELECT content->'blocks'->0->>'type' AS block_type FROM tutorial_sections WHERE id = $1`,
      [SECTION_ID]
    );

    console.log('Block type in database:', result.rows[0]?.block_type);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
