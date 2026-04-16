#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  try {
    // RTH Database - Users table
    const rthClient = new Client({ connectionString: process.env.DATABASE_URL_RTH });
    await rthClient.connect();
    
    console.log('🔍 RTH DATABASE SCHEMA:');
    console.log('\n--- USERS TABLE ---');
    const rthUsersResult = await rthClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Found ${rthUsersResult.rows.length} columns in RTH users table:`);
    rthUsersResult.rows.forEach(row => {
      console.log(`  ${row.column_name} | ${row.data_type} | nullable: ${row.is_nullable}`);
    });
    
    console.log('\n--- USER_PROFILES TABLE ---');
    const rthProfilesResult = await rthClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Found ${rthProfilesResult.rows.length} columns in RTH user_profiles table:`);
    rthProfilesResult.rows.forEach(row => {
      console.log(`  ${row.column_name} | ${row.data_type} | nullable: ${row.is_nullable}`);
    });
    
    await rthClient.end();
    
    // SkillUp Database - Users table
    const skillupClient = new Client({ connectionString: process.env.DATABASE_URL_SKILLUP });
    await skillupClient.connect();
    
    console.log('\n🔍 SKILLUP DATABASE SCHEMA:');
    console.log('\n--- USERS TABLE ---');
    const skillupUsersResult = await skillupClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Found ${skillupUsersResult.rows.length} columns in SkillUp users table:`);
    skillupUsersResult.rows.forEach(row => {
      console.log(`  ${row.column_name} | ${row.data_type} | nullable: ${row.is_nullable}`);
    });
    
    console.log('\n--- USER_PROFILES TABLE ---');
    const skillupProfilesResult = await skillupClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Found ${skillupProfilesResult.rows.length} columns in SkillUp user_profiles table:`);
    skillupProfilesResult.rows.forEach(row => {
      console.log(`  ${row.column_name} | ${row.data_type} | nullable: ${row.is_nullable}`);
    });
    
    await skillupClient.end();
    
    console.log('\n✅ Schema check completed');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema();