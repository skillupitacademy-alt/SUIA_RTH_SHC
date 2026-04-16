#!/usr/bin/env node

/**
 * Verify Password Hash
 * Tests if the stored password hash matches the expected password
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const TEST_ACCOUNTS = [
  { 
    email: 'ajayshah@gmail.com', 
    password: 'testing', 
    brand: 'RTH',
    dbUrl: process.env.DATABASE_URL_RTH
  },
  { 
    email: 'student@skillupitacademy.com', 
    password: 'testing', 
    brand: 'SkillUp',
    dbUrl: process.env.DATABASE_URL_SKILLUP
  }
];

async function verifyPassword(account) {
  console.log(`\n🔐 Verifying ${account.brand} Password`);
  console.log('='.repeat(40));
  
  if (!account.dbUrl) {
    console.log(`❌ No database URL for ${account.brand}`);
    return false;
  }

  let pool, client;
  try {
    pool = new Pool({ 
      connectionString: account.dbUrl, 
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    client = await pool.connect();
    
    // Get user and password hash
    const result = await client.query(`
      SELECT 
        id, 
        email, 
        password_hash, 
        email_verified, 
        is_blocked,
        created_at,
        updated_at
      FROM users 
      WHERE email = $1
    `, [account.email]);
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${account.email}`);
      return false;
    }
    
    const user = result.rows[0];
    console.log(`✅ User found: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Blocked: ${user.is_blocked}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Updated: ${user.updated_at}`);
    
    if (!user.password_hash) {
      console.log(`❌ No password hash stored`);
      return false;
    }
    
    console.log(`🔍 Password hash info:`);
    console.log(`   Length: ${user.password_hash.length}`);
    console.log(`   Starts with: ${user.password_hash.substring(0, 10)}...`);
    console.log(`   Format: ${user.password_hash.startsWith('$2b$') ? 'bcrypt' : 'unknown'}`);
    
    // Test password comparison
    console.log(`🧪 Testing password "${account.password}"...`);
    const isValid = await bcrypt.compare(account.password, user.password_hash);
    console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValid) {
      // Try generating a new hash to compare format
      console.log(`🔧 Generating new hash for comparison...`);
      const newHash = await bcrypt.hash(account.password, 12);
      console.log(`   New hash: ${newHash.substring(0, 20)}...`);
      console.log(`   New format: ${newHash.startsWith('$2b$') ? 'bcrypt' : 'unknown'}`);
      
      // Test if new hash works
      const newHashValid = await bcrypt.compare(account.password, newHash);
      console.log(`   New hash test: ${newHashValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
    return isValid;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

async function main() {
  console.log('🚀 Password Hash Verification\n');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    const valid = await verifyPassword(account);
    results.push({ 
      email: account.email, 
      brand: account.brand, 
      valid 
    });
  }
  
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`${result.email} (${result.brand}): ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
  });
  
  const allValid = results.every(r => r.valid);
  console.log(`\n🎯 Overall: ${allValid ? '✅ ALL PASSWORDS VALID' : '❌ PASSWORD ISSUES'}`);
  
  if (!allValid) {
    console.log('\n🔧 Possible issues:');
    console.log('- Password hash algorithm mismatch');
    console.log('- Incorrect password stored');
    console.log('- Database encoding issues');
    console.log('- bcrypt version differences');
  }
}

main().catch(console.error);