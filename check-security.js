#!/usr/bin/env node

/**
 * Security and Environment Check
 * Check if there are any security restrictions or environment issues
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database connections from .env.local
const RTH_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/rth_prod?sslmode=require&channel_binding=require";
const SKILLUP_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require";

async function checkSecurityRestrictions() {
  console.log('🔒 Security and Environment Investigation');
  console.log('========================================');

  // Check RTH database
  console.log('\n📍 RTH Database Security Check');
  const rthClient = new Client({
    connectionString: RTH_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await rthClient.connect();
    
    // Check login attempts table for any locks
    console.log('🔍 Checking login attempts and locks...');
    const loginAttemptsResult = await rthClient.query(`
      SELECT 
        ip, 
        attempts, 
        locked_until, 
        brand,
        created_at,
        updated_at
      FROM login_attempts 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY updated_at DESC
      LIMIT 10
    `);

    console.log('Recent login attempts:', loginAttemptsResult.rows);

    // Check user status
    const userResult = await rthClient.query(`
      SELECT 
        id,
        email,
        email_verified,
        is_blocked,
        last_active_at,
        created_at,
        updated_at
      FROM users 
      WHERE email = 'ajayshah@gmail.com'
    `);

    console.log('RTH User status:', userResult.rows[0]);

    // Test password hash directly
    if (userResult.rows.length > 0) {
      const passwordResult = await rthClient.query(
        'SELECT password_hash FROM users WHERE email = $1',
        ['ajayshah@gmail.com']
      );
      
      if (passwordResult.rows.length > 0) {
        const hash = passwordResult.rows[0].password_hash;
        const isValid = await bcrypt.compare('testing', hash);
        console.log('RTH Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
        console.log('Hash sample:', hash.substring(0, 20) + '...');
      }
    }

  } catch (error) {
    console.error('RTH Database error:', error.message);
  } finally {
    await rthClient.end();
  }

  // Check SkillUp database
  console.log('\n📍 SkillUp Database Security Check');
  const skillupClient = new Client({
    connectionString: SKILLUP_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await skillupClient.connect();
    
    // Check login attempts table for any locks
    console.log('🔍 Checking login attempts and locks...');
    const loginAttemptsResult = await skillupClient.query(`
      SELECT 
        ip, 
        attempts, 
        locked_until, 
        brand,
        created_at,
        updated_at
      FROM login_attempts 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY updated_at DESC
      LIMIT 10
    `);

    console.log('Recent login attempts:', loginAttemptsResult.rows);

    // Check user status
    const userResult = await skillupClient.query(`
      SELECT 
        id,
        email,
        email_verified,
        is_blocked,
        last_active_at,
        created_at,
        updated_at
      FROM users 
      WHERE email = 'student@skillupitacademy.com'
    `);

    console.log('SkillUp User status:', userResult.rows[0]);

    // Test password hash directly
    if (userResult.rows.length > 0) {
      const passwordResult = await skillupClient.query(
        'SELECT password_hash FROM users WHERE email = $1',
        ['student@skillupitacademy.com']
      );
      
      if (passwordResult.rows.length > 0) {
        const hash = passwordResult.rows[0].password_hash;
        const isValid = await bcrypt.compare('testing', hash);
        console.log('SkillUp Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
        console.log('Hash sample:', hash.substring(0, 20) + '...');
      }
    }

  } catch (error) {
    console.error('SkillUp Database error:', error.message);
  } finally {
    await skillupClient.end();
  }

  // Environment check
  console.log('\n📍 Environment Variables Check');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('DATABASE_URL_RTH:', process.env.DATABASE_URL_RTH ? '✅ Set' : '❌ Missing');
  console.log('DATABASE_URL_SKILLUP:', process.env.DATABASE_URL_SKILLUP ? '✅ Set' : '❌ Missing');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');

  console.log('\n🎯 Recommendations:');
  console.log('1. Check if there are any IP-based restrictions');
  console.log('2. Verify the backend is using the correct database URLs');
  console.log('3. Check if there are any rate limiting issues');
  console.log('4. Verify the authentication service is connecting to the right databases');
  console.log('5. Check backend logs with correlation IDs from the failed attempts');

  console.log('\n🔍 Latest Correlation IDs to check in logs:');
  console.log('- RTH: c2a5f8d2-1047-4078-92fd-b6e8e4347f10');
  console.log('- SkillUp: 09c0c2a6-7a51-4f17-bf94-f0ee3b7f0bac');

  console.log('\n🏁 Security check completed');
}

checkSecurityRestrictions();