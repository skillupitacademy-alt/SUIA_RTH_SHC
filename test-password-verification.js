const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

async function testPasswordVerification(dbUrl, email, password, brand) {
  console.log(`\n🔍 Testing ${brand} Password Verification`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get user and password hash
    const userQuery = `
      SELECT id, email, password_hash, email_verified, is_blocked
      FROM users 
      WHERE email = $1
    `;
    
    const result = await client.query(userQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return false;
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${user.id}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Is Blocked: ${user.is_blocked}`);

    // Test password verification
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`🔐 Password verification: ${passwordMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (!passwordMatch) {
      console.log(`   Stored hash: ${user.password_hash.substring(0, 20)}...`);
      console.log(`   Hash length: ${user.password_hash.length}`);
      console.log(`   Hash starts with: ${user.password_hash.substring(0, 7)}`);
    }

    return passwordMatch;

  } catch (error) {
    console.error('❌ Database error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Password Verification Test');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  const tests = [
    {
      dbUrl: process.env.DATABASE_DIRECT_URL_RTH,
      email: 'ajayshah@gmail.com',
      password: 'testing',
      brand: 'RTH'
    },
    {
      dbUrl: process.env.DATABASE_DIRECT_URL_SKILLUP,
      email: 'student@skillupitacademy.com',
      password: 'testing',
      brand: 'SkillUp'
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    const passed = await testPasswordVerification(test.dbUrl, test.email, test.password, test.brand);
    if (!passed) allPassed = false;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY');
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All password verifications PASSED');
    console.log('🔍 The issue is NOT with password verification');
    console.log('🔍 The issue is likely in the authentication flow logic');
  } else {
    console.log('❌ Some password verifications FAILED');
    console.log('🔍 The issue is with password hashes in the database');
  }
}

main().catch(console.error);