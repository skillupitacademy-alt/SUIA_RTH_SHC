#!/usr/bin/env node
/**
 * Phase 1 - Check Database State
 * 
 * Inspects current tutorial database state before reset
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║   PHASE 1 - DATABASE STATE CHECK                                ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

async function checkState() {
  try {
    console.log('[STEP 1] List all tables in tutorial database\n');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Found ${tables.rows.length} tables:\n`);
    tables.rows.forEach(r => console.log(`  - ${r.table_name}`));
    
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 2] Check key table counts\n');
    
    // Check tutorial content tables
    const checkTables = [
      'tutorial_sections',
      'tutorial_subsections',
      'tutorial_subtopics',
      'tutorial_topics',
      'tutorial_sidebar_trees_v2'
    ];
    
    for (const tableName of checkTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`  ${tableName.padEnd(30)}: ${result.rows[0].count} records`);
      } catch (err) {
        console.log(`  ${tableName.padEnd(30)}: (table does not exist)`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 3] Check tutorial_sections schema\n');
    
    const schema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sections'
      ORDER BY ordinal_position
    `);
    
    if (schema.rows.length > 0) {
      console.log('Columns:');
      schema.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}`);
        
        if (col.column_name === 'navigation_node_id') {
          console.log(`    ^^^ Phase 1 column found! (${nullable})`);
        }
      });
    } else {
      console.log('tutorial_sections table not found');
    }
    
  } catch (error) {
    console.error('\n❌ CHECK FAILED:', error.message);
  } finally {
    await pool.end();
  }
}

checkState();
