#!/usr/bin/env node
/**
 * PHASE 8.1 — GATE 1: LIST ALL JAVA-RELATED SUBTOPICS
 * 
 * READ-ONLY query to see what Java subtopics exist
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function main() {
  console.log('🔍 LISTING ALL JAVA-RELATED SUBTOPICS\n');
  
  const result = await pool.query(`
    SELECT 
      id,
      external_id,
      name,
      slug,
      topic_id,
      deleted_at
    FROM tutorial_subtopics
    WHERE LOWER(name) LIKE '%java%'
       OR LOWER(slug) LIKE '%java%'
    ORDER BY name, deleted_at NULLS FIRST
  `);
  
  console.log(`Found ${result.rows.length} Java-related subtopics:\n`);
  
  for (const row of result.rows) {
    console.log(`─────────────────────────────────────────────────`);
    console.log(`Name:         ${row.name}`);
    console.log(`Slug:         ${row.slug}`);
    console.log(`Internal ID:  ${row.id}`);
    console.log(`External ID:  ${row.external_id}`);
    console.log(`Topic ID:     ${row.topic_id}`);
    console.log(`Deleted:      ${row.deleted_at || 'NULL (active)'}`);
  }
  
  console.log(`─────────────────────────────────────────────────\n`);
  console.log(`Total: ${result.rows.length} rows\n`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    process.exit(0);
  });
