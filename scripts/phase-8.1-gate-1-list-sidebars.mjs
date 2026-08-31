#!/usr/bin/env node
/**
 * PHASE 8.1 — GATE 1: LIST ALL SIDEBARS
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function main() {
  console.log('🔍 LISTING ALL SIDEBARS\n');
  
  const result = await pool.query(`
    SELECT 
      id,
      topic_id,
      brand_id,
      status
    FROM tutorial_sidebar_trees_v2
    ORDER BY brand_id, topic_id
  `);
  
  console.log(`Found ${result.rows.length} sidebars:\n`);
  
  for (const row of result.rows) {
    console.log(`─────────────────────────────────────────────────`);
    console.log(`ID:       ${row.id}`);
    console.log(`Topic ID: ${row.topic_id}`);
    console.log(`Brand:    ${row.brand_id}`);
    console.log(`Status:   ${row.status}`);
  }
  
  console.log(`─────────────────────────────────────────────────\n`);
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
