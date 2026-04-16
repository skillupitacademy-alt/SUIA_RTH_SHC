const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testApiServerDatabase() {
  console.log('🔍 Testing the exact database configuration used by the API server...');
  
  const email = 'ajayshah@gmail.com';
  const testPassword = 'testing';
  
  // Use the same environment variable that the API server uses
  const dbUrl = process.env.DATABASE_URL_RTH;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL_RTH not found - this is what the API server uses');
    return;
  }
  
  console.log('🗄️ Using DATABASE_URL_RTH (same as API server)');
  console.log(`📍 Database: ${dbUrl.split('@')[1]?.split('/')[1]?.split('?')[0] || 'unknown'}`);
  
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to RTH database (API server config)');

    // Get user exactly as the API server would
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.is_blocked,
        u.email_verified,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.email = $1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in API server database');
      
      // Check what users exist
      const allUsersQuery = 'SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 10';
      const allUsers = await client.query(allUsersQuery);
      console.log('\n📋 Recent users in this database:');
      allUsers.rows.forEach(user => {
        console.log(`   ${user.email} (created: ${user.created_at})`);
      });
      
      return;
    }
    
    const user = userResult.rows[0];
    console.log('\n✅ User found in API server database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Blocked: ${user.is_blocked}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Updated: ${user.updated_at}`);
    console.log(`   Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'MISSING'}`);

    if (!user.password_hash) {
      console.log('\n❌ No password hash found');
      return;
    }

    // Test password verification exactly as the API server would
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`\n🔐 Password "${testPassword}" verification: ${isValid ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (!isValid) {
      console.log('\n🔍 Debugging password hash:');
      console.log(`   Stored hash: ${user.password_hash}`);
      console.log(`   Hash length: ${user.password_hash.length}`);
      console.log(`   Hash starts with: ${user.password_hash.substring(0, 7)}`);
      
      // Test if it matches the old fixed hash
      const oldFixedHash = '$2b$12$dkd0IDiekVGV2UoWc3EV4ufKvr/TDEomwxqWEhkaSxzcbwwdTMjOC';
      if (user.password_hash === oldFixedHash) {
        console.log('   ⚠️ This is the old fixed hash from the seed script');
      }
    }
    
    // Check login attempts
    const attemptsQuery = `
      SELECT attempts, locked_until, ip, brand, created_at, updated_at
      FROM login_attempts 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
      LIMIT 5
    `;
    
    const attemptsResult = await client.query(attemptsQuery, [user.id]);
    
    if (attemptsResult.rows.length > 0) {
      console.log('\n🔒 Recent login attempts:');
      attemptsResult.rows.forEach((attempt, index) => {
        console.log(`   ${index + 1}. Attempts: ${attempt.attempts}, Brand: ${attempt.brand}, IP: ${attempt.ip}`);
        console.log(`      Locked until: ${attempt.locked_until || 'Not locked'}`);
        console.log(`      Updated: ${attempt.updated_at}`);
      });
    } else {
      console.log('\n✅ No login attempt records found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testApiServerDatabase();