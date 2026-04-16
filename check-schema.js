#!/usr/bin/env node

/**
 * Check Database Schema
 * Inspects the actual column names in the users table
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const databases = [
  { name: 'RTH', url: process.env.DATABASE_URL_RTH },
  { name: 'SkillUp', url: process.env.DATABASE_URL_SKILLUP }
];

async function checkSchema(dbConfig) {
  console.log(`\n🔍 Checking ${dbConfig.name} Schema`);
  console.log('='.repeat(40));
  
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
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log(`✅ Users table columns:`);
    schema.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if users exist
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users: ${userCount.rows[0].count}`);
    
    // Check specific test users
    const testUsers = await client.query(`
      SELECT email, created_at 
      FROM users 
      WHERE email IN ('ajayshah@gmail.com', 'student@skillupitacademy.com')
    `);
    
    if (testUsers.rows.length > 0) {
      console.log(`👤 Test users found:`);
      testUsers.rows.forEach(user => {
        console.log(`   ${user.email} (created: ${user.created_at})`);
      });
    } else {
      console.log(`👤 No test users found`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

async function main() {
  console.log('🚀 Database Schema Check\n');
  
  for (const db of databases) {
    await checkSchema(db);
  }
}

main().catch(console.error);