#!/usr/bin/env node
/**
 * Check Migration Status
 * Verify which migrations have been applied
 */

import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function checkMigrations() {
  const connString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_DIRECT_URL_TUTORIAL;
  
  if (!connString) {
    console.log('❌ DATABASE_URL_TUTORIAL not configured');
    process.exit(1);
  }
  
  const client = new Client({ connectionString: connString });
  
  try {
    await client.connect();
    console.log('✓ PostgreSQL connection established\n');
    
    // Check for Drizzle migrations table
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '__drizzle_migrations'
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ __drizzle_migrations table not found');
      console.log('   Migrations may not have been initialized\n');
      return false;
    }
    
    console.log('✓ __drizzle_migrations table exists\n');
    
    // Get applied migrations
    const migrations = await client.query(`
      SELECT hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Applied migrations (last 10):`);
    migrations.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.hash} (${row.created_at})`);
    });
    console.log();
    
    // Check specifically for 0023 (block_learning_state)
    const hasBlockState = await client.query(`
      SELECT hash, created_at
      FROM __drizzle_migrations
      WHERE hash LIKE '%0023%' OR hash LIKE '%block_learning_state%'
    `);
    
    if (hasBlockState.rows.length > 0) {
      console.log('✓ Migration 0023 (block_learning_state) has been applied');
      hasBlockState.rows.forEach(row => {
        console.log(`  ${row.hash} (${row.created_at})`);
      });
    } else {
      console.log('❌ Migration 0023 (block_learning_state) NOT found in applied migrations');
    }
    console.log();
    
    // Check if table actually exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'block_learning_state'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✓ block_learning_state table EXISTS in database\n');
      return true;
    } else {
      console.log('❌ block_learning_state table DOES NOT EXIST in database\n');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

const result = await checkMigrations();
process.exit(result ? 0 : 1);
