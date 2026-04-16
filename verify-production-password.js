const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function verifyProductionPassword() {
  console.log('🔍 Verifying password in production RTH database...');
  
  const email = 'ajayshah@gmail.com';
  const testPassword = 'testing';
  
  // Use production RTH database
  const dbUrl = process.env.DATABASE_DIRECT_URL_RTH;
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to production RTH database');

    // Get user with password hash
    const userQuery = `
      SELECT id, email, password_hash, is_blocked, email_verified, created_at
      FROM users 
      WHERE email = $1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found in production database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Blocked: ${user.is_blocked}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Password Hash: ${user.password_hash ? 'EXISTS' : 'MISSING'}`);
    console.log(`   Created: ${user.created_at}`);

    if (!user.password_hash) {
      console.log('❌ No password hash found');
      return;
    }

    // Test password verification
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`\n🔐 Password "${testPassword}" verification: ${isValid ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (isValid) {
      console.log('🎉 Password is correct in production database!');
      
      // Check for any login attempts or lockouts
      const attemptsQuery = `
        SELECT attempts, locked_until, created_at, updated_at
        FROM login_attempts 
        WHERE user_id = $1 
        ORDER BY updated_at DESC
        LIMIT 5
      `;
      
      const attemptsResult = await client.query(attemptsQuery, [user.id]);
      
      if (attemptsResult.rows.length > 0) {
        console.log('\n🔒 Recent login attempts:');
        attemptsResult.rows.forEach((attempt, index) => {
          console.log(`   ${index + 1}. Attempts: ${attempt.attempts}, Locked until: ${attempt.locked_until || 'Not locked'}`);
        });
      } else {
        console.log('\n✅ No login attempt records found');
      }
      
    } else {
      console.log('❌ Password verification failed');
      console.log('🔍 This suggests the hash in production is different from what we expect');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyProductionPassword();