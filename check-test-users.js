#!/usr/bin/env node

/**
 * Check Test Users in Production Databases
 * Verifies if test accounts exist and have correct passwords
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

// Test credentials
const TEST_ACCOUNTS = [
  { 
    email: 'ajayshah@gmail.com', 
    password: 'testing', 
    brand: 'realtutorialhub',
    dbUrl: process.env.DATABASE_URL_RTH
  },
  { 
    email: 'student@skillupitacademy.com', 
    password: 'testing', 
    brand: 'skillup',
    dbUrl: process.env.DATABASE_URL_SKILLUP
  }
];

async function checkDatabase(account) {
  console.log(`\n🔍 Checking ${account.brand.toUpperCase()} Database`);
  console.log('='.repeat(50));
  
  if (!account.dbUrl) {
    console.log(`❌ No database URL configured for ${account.brand}`);
    return { exists: false, error: 'No database URL' };
  }
  
  let pool;
  try {
    console.log(`🔗 Connecting to ${account.brand} database...`);
    pool = new Pool({ connectionString: account.dbUrl });
    
    // Test connection
    const testResult = await pool.query('SELECT 1 as test');
    console.log(`✅ Database connection successful`);
    
    // Check if user exists
    console.log(`👤 Looking for user: ${account.email}`);
    const userResult = await pool.query(`
      SELECT 
        id, 
        email, 
        "passwordHash", 
        "emailVerified", 
        "isBlocked", 
        "createdAt", 
        "lastActiveAt",
        "shadowUserId"
      FROM users 
      WHERE email = $1
    `, [account.email]);
    
    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${account.email}`);
      return { exists: false, error: 'User not found' };
    }
    
    const user = userResult.rows[0];
    console.log(`✅ User found!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
    console.log(`   Account Blocked: ${user.isBlocked ? '❌ YES' : '✅ NO'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Last Active: ${user.lastActiveAt || 'Never'}`);
    console.log(`   Shadow User ID: ${user.shadowUserId || 'Not set'}`);
    console.log(`   Has Password Hash: ${user.passwordHash ? '✅' : '❌'}`);
    
    // Test password
    if (user.passwordHash) {
      console.log(`🔐 Testing password...`);
      const passwordValid = await bcrypt.compare(account.password, user.passwordHash);
      console.log(`   Password "${account.password}": ${passwordValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!passwordValid) {
        // Try to see if it's a different hash format
        console.log(`   Hash starts with: ${user.passwordHash.substring(0, 10)}...`);
        console.log(`   Hash length: ${user.passwordHash.length}`);
      }
      
      return {
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          isBlocked: user.isBlocked,
          hasPassword: !!user.passwordHash,
          passwordValid
        }
      };
    } else {
      console.log(`❌ No password hash stored`);
      return {
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          isBlocked: user.isBlocked,
          hasPassword: false,
          passwordValid: false
        }
      };
    }
    
  } catch (error) {
    console.log(`❌ Database error:`, error.message);
    return { exists: false, error: error.message };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

async function checkUserRoles(account) {
  if (!account.dbUrl) return [];
  
  let pool;
  try {
    pool = new Pool({ connectionString: account.dbUrl });
    
    const userResult = await pool.query(`
      SELECT id FROM users WHERE email = $1
    `, [account.email]);
    
    if (userResult.rows.length === 0) return [];
    
    const userId = userResult.rows[0].id;
    
    const rolesResult = await pool.query(`
      SELECT r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur."roleId" = r.id
      WHERE ur."userId" = $1
    `, [userId]);
    
    return rolesResult.rows.map(r => r.role_name);
    
  } catch (error) {
    console.log(`❌ Role check error:`, error.message);
    return [];
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

async function main() {
  console.log('🚀 Checking Test Users in Production Databases\n');
  
  // Environment check
  console.log('📋 Environment Variables:');
  console.log(`   DATABASE_URL_RTH: ${process.env.DATABASE_URL_RTH ? '✅ Set' : '❌ Missing'}`);
  console.log(`   DATABASE_URL_SKILLUP: ${process.env.DATABASE_URL_SKILLUP ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    const result = await checkDatabase(account);
    const roles = result.exists ? await checkUserRoles(account) : [];
    
    results.push({
      account: account.email,
      brand: account.brand,
      roles,
      ...result
    });
  }
  
  console.log('\n📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.account} (${result.brand}):`);
    console.log(`   User Exists: ${result.exists ? '✅' : '❌'}`);
    
    if (result.exists && result.user) {
      console.log(`   Email Verified: ${result.user.emailVerified ? '✅' : '❌'}`);
      console.log(`   Account Blocked: ${result.user.isBlocked ? '❌ YES' : '✅ NO'}`);
      console.log(`   Has Password: ${result.user.hasPassword ? '✅' : '❌'}`);
      console.log(`   Password Valid: ${result.user.passwordValid ? '✅' : '❌'}`);
      console.log(`   Roles: ${result.roles.length > 0 ? result.roles.join(', ') : 'None'}`);
      
      const canLogin = result.user.emailVerified && 
                      !result.user.isBlocked && 
                      result.user.hasPassword && 
                      result.user.passwordValid;
      
      console.log(`   Should Login: ${canLogin ? '✅ YES' : '❌ NO'}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Diagnosis
  console.log('\n🔧 DIAGNOSIS:');
  const allCanLogin = results.every(r => 
    r.exists && 
    r.user && 
    r.user.emailVerified && 
    !r.user.isBlocked && 
    r.user.hasPassword && 
    r.user.passwordValid
  );
  
  if (allCanLogin) {
    console.log('✅ All test users should be able to login');
    console.log('🔍 Issue might be in:');
    console.log('   - Token service configuration');
    console.log('   - Brand database routing');
    console.log('   - Login service logic');
  } else {
    console.log('❌ Test users have issues:');
    results.forEach(r => {
      if (!r.exists) {
        console.log(`   - ${r.account}: User does not exist in ${r.brand} database`);
      } else if (r.user && !r.user.passwordValid) {
        console.log(`   - ${r.account}: Password does not match`);
      } else if (r.user && r.user.isBlocked) {
        console.log(`   - ${r.account}: Account is blocked`);
      } else if (r.user && !r.user.emailVerified) {
        console.log(`   - ${r.account}: Email not verified`);
      }
    });
  }
}

main().catch(console.error);