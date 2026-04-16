#!/usr/bin/env node

/**
 * Check User Profiles Table Schema
 * Verifies if user_profiles table exists and has correct structure
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const databases = [
  { name: 'RTH', url: process.env.DATABASE_URL_RTH },
  { name: 'SkillUp', url: process.env.DATABASE_URL_SKILLUP }
];

async function checkUserProfilesTable(dbConfig) {
  console.log(`\n🔍 Checking ${dbConfig.name} user_profiles Table`);
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
    
    // Check if user_profiles table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      );
    `);
    
    console.log(`📋 Table exists: ${tableExists.rows[0].exists ? '✅' : '❌'}`);
    
    if (!tableExists.rows[0].exists) {
      console.log(`❌ user_profiles table does not exist!`);
      
      // Check what tables do exist
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log(`📋 Available tables:`);
      tables.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      return;
    }
    
    // Get user_profiles table schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log(`✅ user_profiles table columns:`);
    schema.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if there are any user profiles
    const profileCount = await client.query('SELECT COUNT(*) as count FROM user_profiles');
    console.log(`📊 Total profiles: ${profileCount.rows[0].count}`);
    
    // Check for our test users
    const testUserProfiles = await client.query(`
      SELECT up.*, u.email 
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE u.email IN ('ajayshah@gmail.com', 'student@skillupitacademy.com')
    `);
    
    if (testUserProfiles.rows.length > 0) {
      console.log(`👤 Test user profiles found:`);
      testUserProfiles.rows.forEach(profile => {
        console.log(`   ${profile.email}: ${profile.name || 'No name'}`);
      });
    } else {
      console.log(`👤 No test user profiles found`);
      
      // Check if users exist but have no profiles
      const usersWithoutProfiles = await client.query(`
        SELECT u.id, u.email 
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.email IN ('ajayshah@gmail.com', 'student@skillupitacademy.com')
        AND up.user_id IS NULL
      `);
      
      if (usersWithoutProfiles.rows.length > 0) {
        console.log(`⚠️ Users without profiles:`);
        usersWithoutProfiles.rows.forEach(user => {
          console.log(`   ${user.email} (${user.id})`);
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

async function main() {
  console.log('🚀 Checking user_profiles Table Schema\n');
  
  for (const db of databases) {
    await checkUserProfilesTable(db);
  }
  
  console.log('\n🎯 If user_profiles table is missing or has wrong schema, that explains the login failure!');
}

main().catch(console.error);