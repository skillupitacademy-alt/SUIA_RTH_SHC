#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  try {
    // RTH Database
    const rthClient = new Client({ connectionString: process.env.DATABASE_URL_RTH });
    await rthClient.connect();
    
    console.log('🔍 RTH DATABASE SCHEMA:');
    const rthResult = await rthClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Found ${rthResult.rows.length} columns in RTH user_profiles table:`);
    rthResult.rows.forEach(row => {
      console.log(`  ${row.column_name} | ${row.data_type} | nullable: ${row.is_nullable}`);
    });
    
    await rthClient.end();
    
    // SkillUp Database
    const skillupClient = new Client({ connectionString: process.env.DATABASE_URL_SKILLUP });
    await skillupClient.connect();
    
    console.log('\n🔍 SKILLUP DATABASE SCHEMA:');
    const skillupResult = await skillupClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log(`Found ${skillupResult.rows.length} columns in SkillUp user_profiles table:`);
    skillupResult.rows.forEach(row => {
      console.log(`  ${row.column_name} | ${row.data_type} | nullable: ${row.is_nullable}`);
    });
    
    await skillupClient.end();
    
    console.log('\n✅ Schema check completed');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema();