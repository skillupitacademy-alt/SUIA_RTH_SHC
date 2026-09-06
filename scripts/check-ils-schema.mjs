#!/usr/bin/env node
/**
 * Check ILS Database Schema
 * Verify Phase 4.1-4.4 tables exist
 */

import { config } from 'dotenv';
import pkg from 'pg';

// Load .env.local explicitly
config({ path: '.env.local', override: true });

const { Client } = pkg;

async function checkSchema() {
  const connString = process.env.DATABASE_URL_TUTORIAL;
  
  if (!connString) {
    console.log('❌ DATABASE_URL_TUTORIAL not configured');
    process.exit(1);
  }
  
  const client = new Client({ connectionString: connString });
  
  try {
    await client.connect();
    console.log('✓ PostgreSQL connection established\n');
    
    // Check for actual learning/block tables (correct names)
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE '%learning%' OR table_name LIKE '%block%' OR table_name = 'tutorial_navigation_progress')
      ORDER BY table_name
    `);
    
    console.log('Learning/Block Tables:');
    if (tables.rows.length === 0) {
      console.log('  ❌ No learning/block tables found');
    } else {
      tables.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }
    console.log();
    
    // Check required tables (correct names from schema files)
    const required = [
      'block_learning_state',
      'tutorial_navigation_progress',
    ];
    
    const found = tables.rows.map(r => r.table_name);
    const missing = required.filter(t => !found.includes(t));
    
    if (missing.length > 0) {
      console.log('Missing required tables:');
      missing.forEach(t => console.log(`  ❌ ${t}`));
      console.log();
      
      // Check for Phase 4.1 migration
      console.log('Checking for Phase 4.1 migration...');
      const migrations = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = '__drizzle_migrations'
      `);
      
      if (migrations.rows.length > 0) {
        const ilsMigrations = await client.query(`
          SELECT * FROM __drizzle_migrations
          WHERE hash LIKE '%ils%' OR created_at IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 10
        `);
        
        console.log(`  Found ${ilsMigrations.rows.length} recent migrations`);
      } else {
        console.log('  ⚠️  No migration tracking table found');
      }
      
      return false;
    } else {
      console.log('✅ All required ILS tables exist\n');
      
      // Show table schemas
      for (const table of required) {
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`${table} schema:`);
        columns.rows.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
        console.log();
      }
      
      return true;
    }
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

const result = await checkSchema();
process.exit(result ? 0 : 1);
