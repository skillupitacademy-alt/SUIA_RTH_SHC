#!/usr/bin/env node

/**
 * Debug Authentication Flow
 * Tests database connections, user lookup, and password verification
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Import existing database connections
const { db: rthDb } = require('./packages/db-rth/dist/index.js');
const { db: skillupDb } = require('./packages/db-skillup/dist/index.js');
const bcrypt = require('bcryptjs');

// Test credentials
const TEST_ACCOUNTS = [
  { email: 'ajayshah@gmail.com', password: 'testing', brand: 'realtutorialhub' },
  { email: 'student@skillupitacademy.com', password: 'testing', brand: 'skillup' }
];

// Database connections
const connections = {
  realtutorialhub: {
    db: rthDb,
    name: 'RTH Database'
  },
  skillup: {
    db: skillupDb,
    name: 'SkillUp Database'
  }
};

async function testDatabaseConnection(brand) {
  const conn = connections[brand];
  if (!conn?.db) {
    console.log(`❌ [${brand.toUpperCase()}] No database connection available`);
    return null;
  }

  try {
    console.log(`🔗 [${brand.toUpperCase()}] Testing connection to ${conn.name}...`);
    
    // Test basic connectivity with a simple query
    const result = await conn.db.execute('SELECT 1 as test');
    console.log(`✅ [${brand.toUpperCase()}] Database connection successful`);
    
    return conn.db;
  } catch (error) {
    console.log(`❌ [${brand.toUpperCase()}] Database connection failed:`, error.message);
    return null;
  }
}

async function findUser(db, email, brand) {
  try {
    console.log(`🔍 [${brand.toUpperCase()}] Looking for user: ${email}`);
    
    const users = await db.execute(`
      SELECT id, email, "passwordHash", "emailVerified", "isBlocked", "createdAt", "lastActiveAt"
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (users.rows.length === 0) {
      console.log(`❌ [${brand.toUpperCase()}] User not found: ${email}`);
      return null;
    }
    
    const user = users.rows[0];
    console.log(`✅ [${brand.toUpperCase()}] User found:`, {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      hasPassword: !!user.passwordHash
    });
    
    return user;
  } catch (error) {
    console.log(`❌ [${brand.toUpperCase()}] User lookup failed:`, error.message);
    return null;
  }
}

async function testPassword(user, password, brand) {
  try {
    console.log(`🔐 [${brand.toUpperCase()}] Testing password for user: ${user.email}`);
    
    if (!user.passwordHash) {
      console.log(`❌ [${brand.toUpperCase()}] No password hash stored`);
      return false;
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`${isValid ? '✅' : '❌'} [${brand.toUpperCase()}] Password ${isValid ? 'valid' : 'invalid'}`);
    
    return isValid;
  } catch (error) {
    console.log(`❌ [${brand.toUpperCase()}] Password verification failed:`, error.message);
    return false;
  }
}

async function getUserRoles(db, userId, brand) {
  try {
    console.log(`👤 [${brand.toUpperCase()}] Getting roles for user: ${userId}`);
    
    const roles = await db.execute(`
      SELECT r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur."roleId" = r.id
      WHERE ur."userId" = $1
    `, [userId]);
    
    const roleNames = roles.rows.map(r => r.role_name);
    console.log(`✅ [${brand.toUpperCase()}] User roles:`, roleNames);
    
    return roleNames;
  } catch (error) {
    console.log(`❌ [${brand.toUpperCase()}] Role lookup failed:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Authentication Flow Debug\n');
  
  // Test environment variables
  console.log('📋 Environment Check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('- ADMIN_JWT_SECRET:', process.env.ADMIN_JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('- DATABASE_URL_RTH:', process.env.DATABASE_URL_RTH ? '✅ Set' : '❌ Missing');
  console.log('- DATABASE_URL_SKILLUP:', process.env.DATABASE_URL_SKILLUP ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // Test each account
  for (const account of TEST_ACCOUNTS) {
    console.log(`\n🧪 Testing Account: ${account.email} (${account.brand})`);
    console.log('='.repeat(60));
    
    // Test database connection
    const db = await testDatabaseConnection(account.brand);
    if (!db) {
      console.log(`❌ Skipping ${account.email} - database connection failed\n`);
      continue;
    }
    
    try {
      // Find user
      const user = await findUser(db, account.email, account.brand);
      if (!user) {
        console.log(`❌ Skipping password test - user not found\n`);
        continue;
      }
      
      // Test password
      const passwordValid = await testPassword(user, account.password, account.brand);
      
      // Get user roles
      const roles = await getUserRoles(db, user.id, account.brand);
      
      // Summary
      console.log(`\n📊 [${account.brand.toUpperCase()}] Summary for ${account.email}:`);
      console.log(`   User Exists: ${user ? '✅' : '❌'}`);
      console.log(`   Password Valid: ${passwordValid ? '✅' : '❌'}`);
      console.log(`   Email Verified: ${user?.emailVerified ? '✅' : '❌'}`);
      console.log(`   Account Blocked: ${user?.isBlocked ? '❌ YES' : '✅ NO'}`);
      console.log(`   Roles: ${roles.length > 0 ? roles.join(', ') : 'None'}`);
      console.log(`   Login Should: ${user && passwordValid && !user.isBlocked ? '✅ SUCCEED' : '❌ FAIL'}`);
      
    } catch (error) {
      console.log(`❌ [${account.brand.toUpperCase()}] Test failed:`, error.message);
    }
  }
  
  console.log('\n🏁 Authentication Flow Debug Complete');
}

main().catch(console.error);