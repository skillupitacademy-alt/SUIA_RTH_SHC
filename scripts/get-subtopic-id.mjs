#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    const result = await pool.query(
      `SELECT id, slug, title FROM tutorial_subtopic WHERE slug = $1`,
      ['what-is-java-12efacf1']
    );

    if (result.rows.length === 0) {
      console.log('❌ Subtopic not found');
      process.exit(1);
    }

    const subtopic = result.rows[0];
    console.log('✅ Subtopic found:');
    console.log(JSON.stringify(subtopic, null, 2));
    console.log('\nsubtopicId:', subtopic.id);

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
