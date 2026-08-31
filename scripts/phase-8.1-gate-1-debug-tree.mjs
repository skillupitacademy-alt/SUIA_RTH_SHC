#!/usr/bin/env node
/**
 * PHASE 8.1 — GATE 1: DEBUG TREE STRUCTURE
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function main() {
  const sidebarResult = await pool.query(`
    SELECT tree
    FROM tutorial_sidebar_trees_v2
    WHERE brand_id = 'shared'
    LIMIT 1
  `);
  
  const tree = sidebarResult.rows[0].tree;
  
  console.log('🔍 TREE STRUCTURE:\n');
  console.log(JSON.stringify(tree, null, 2));
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
