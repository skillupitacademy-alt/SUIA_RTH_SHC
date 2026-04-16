#!/usr/bin/env node

/**
 * Check Users Table Schema
 * Verifies if users table has the onboarding columns expected by Drizzle
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const databases = [
  { name: 'RTH', url: process.env.DATABASE_URL_RTH },
  { name: 'SkillUp', url: process.env.DATABASE_URL_SKILLUP }
];

async function checkUsersTable(dbConfig) {
  console.log(`\n🔍 Checking ${dbConfig.name} users Table`);
  console.log('='.repeat(50));
  
  if (!dbConfig.url) {
    console.log(`❌ No database URL for ${dbConfig.name}`);
    return;
  }

  let pool, client;
  try {
    pool = new Pool({ 
      connectionString: dbConfig.url, 
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    client = await pool.connect();
    
    // Get users table schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log(`📋 Users table columns:`);
    schema.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name} (${col.data_type}) ${nullable}${defaultVal}`);
    });
    
    // Check for missing onboarding columns
    const expectedColumns = [
      'is_onboarded',
      'primary_goal', 
      'domain',
      'sub_domain',
      'time_commitment',
      'journey_status'
    ];
    
    console.log(`\n🔍 Checking for onboarding columns:`);
    const existingColumns = schema.rows.map(row => row.column_name);
    
    expectedColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`   ${col}: ${exists ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

async function main() {
  console.log('🚀 Checking Users Table Schema\n');
  
  for (const db of databases) {
    await checkUsersTable(db);
  }
  
  console.log('\n🎯 The users table also needs onboarding columns to match the Drizzle schema!');
}

main().catch(console.error);