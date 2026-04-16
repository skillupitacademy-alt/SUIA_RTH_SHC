#!/usr/bin/env node

/**
 * Fix User Profiles Schema
 * Adds missing onboarding columns to match frontend expectations
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const databases = [
  { name: 'RTH', url: process.env.DATABASE_URL_RTH },
  { name: 'SkillUp', url: process.env.DATABASE_URL_SKILLUP }
];

const MISSING_COLUMNS = [
  'primary_goal text',
  'domain text', 
  'sub_domain text',
  'time_commitment text',
  'journey_status text',
  'onboarding_completed boolean DEFAULT false NOT NULL'
];

async function addMissingColumns(dbConfig) {
  console.log(`\n🔧 Fixing ${dbConfig.name} user_profiles Schema`);
  console.log('='.repeat(50));
  
  if (!dbConfig.url) {
    console.log(`❌ No database URL for ${dbConfig.name}`);
    return false;
  }

  let pool, client;
  try {
    pool = new Pool({ 
      connectionString: dbConfig.url, 
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    client = await pool.connect();
    
    console.log(`🔗 Connected to ${dbConfig.name} database`);
    
    for (const column of MISSING_COLUMNS) {
      const [columnName] = column.split(' ');
      
      try {
        // Check if column exists
        const exists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            AND column_name = $1
          );
        `, [columnName]);
        
        if (exists.rows[0].exists) {
          console.log(`   ✅ Column ${columnName} already exists`);
        } else {
          console.log(`   ➕ Adding column ${columnName}...`);
          await client.query(`ALTER TABLE user_profiles ADD COLUMN ${column}`);
          console.log(`   ✅ Added column ${columnName}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to add ${columnName}: ${error.message}`);
      }
    }
    
    // Verify final schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log(`\n📋 Final user_profiles schema:`);
    schema.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name} (${col.data_type}) ${nullable}${defaultVal}`);
    });
    
    console.log(`\n✅ ${dbConfig.name} schema update complete`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${dbConfig.name} schema update failed:`, error.message);
    return false;
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

async function main() {
  console.log('🚀 Fixing User Profiles Schema for Onboarding\n');
  console.log('📋 Adding missing columns to match shared-branding frontend:');
  MISSING_COLUMNS.forEach(col => {
    console.log(`   - ${col}`);
  });
  
  const results = [];
  
  for (const db of databases) {
    const success = await addMissingColumns(db);
    results.push({ name: db.name, success });
  }
  
  console.log('\n📊 SCHEMA UPDATE SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  });
  
  const allSuccess = results.every(r => r.success);
  console.log(`\n🎯 Overall: ${allSuccess ? '✅ ALL SCHEMAS UPDATED' : '❌ SOME FAILURES'}`);
  
  if (allSuccess) {
    console.log('\n🎉 Database schemas now match shared-branding frontend expectations!');
    console.log('🔄 The login flow should work after redeployment.');
  }
}

main().catch(console.error);