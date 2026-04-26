#!/usr/bin/env node

/**
 * 🔐 CREATE RBAC TEST USERS
 * 
 * Creates 3 users with different roles for RBAC testing:
 * 1. Basic user (role: USER)
 * 2. Student (role: STUDENT) 
 * 3. Invalid role user (role: HACKER - will be filtered out)
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

console.log('🔐 CREATING RBAC TEST USERS');
console.log('===========================\n');

const TEST_USERS = [
  {
    email: 'rbac-user@test.com',
    password: 'RbacTest123!',
    name: 'RBAC Basic User',
    roleName: 'USER',
    description: 'Basic user - should only have READ access'
  },
  {
    email: 'rbac-student@test.com',
    password: 'RbacTest123!',
    name: 'RBAC Student User',
    roleName: 'STUDENT',
    description: 'Student - should have READ + WRITE access'
  },
  {
    email: 'rbac-invalid@test.com',
    password: 'RbacTest123!',
    name: 'RBAC Invalid User',
    roleName: 'HACKER',
    description: 'Invalid role - should be DENIED all access'
  }
];

async function ensureRole(client, roleName) {
  const existing = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
  if (existing.rowCount > 0) {
    console.log(`   ✅ Role exists: ${roleName}`);
    return existing.rows[0].id;
  }

  console.log(`   📝 Creating role: ${roleName}`);
  const inserted = await client.query(
    'INSERT INTO roles (name) VALUES ($1) RETURNING id',
    [roleName]
  );
  return inserted.rows[0].id;
}

async function upsertUser(client, testUser, passwordHash) {
  const result = await client.query(
    `
      INSERT INTO users (email, password_hash, email_verified, is_blocked, deleted_at)
      VALUES ($1, $2, TRUE, FALSE, NULL)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          email_verified = TRUE,
          is_blocked = FALSE,
          deleted_at = NULL,
          updated_at = NOW()
      RETURNING id
    `,
    [testUser.email, passwordHash]
  );

  const userId = result.rows[0].id;
  console.log(`   ✅ User: ${testUser.email}`);

  // Upsert profile
  const profileCheck = await client.query(
    'SELECT id FROM user_profiles WHERE user_id = $1 LIMIT 1',
    [userId]
  );

  if (profileCheck.rowCount > 0) {
    await client.query(
      'UPDATE user_profiles SET name = $1, updated_at = NOW() WHERE user_id = $2',
      [testUser.name, userId]
    );
  } else {
    await client.query(
      'INSERT INTO user_profiles (user_id, name) VALUES ($1, $2)',
      [userId, testUser.name]
    );
  }

  return userId;
}

async function assignRole(client, userId, roleId) {
  await client.query(
    `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `,
    [userId, roleId]
  );
}

async function main() {
  const pool = new Pool({ 
    connectionString: DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('📋 Creating test users for RBAC validation...\n');

    for (const testUser of TEST_USERS) {
      console.log(`🔐 ${testUser.name}`);
      console.log(`   ${testUser.description}`);
      
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const userId = await upsertUser(pool, testUser, passwordHash);
      
      const roleId = await ensureRole(pool, testUser.roleName);
      await assignRole(pool, userId, roleId);
      
      console.log(`   ✅ Role assigned: ${testUser.roleName}`);
      console.log('');
    }

    console.log('✅ ALL TEST USERS CREATED\n');
    console.log('📊 Test User Summary:');
    console.log('====================\n');
    
    TEST_USERS.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.roleName}`);
      console.log(`Expected: ${user.description}`);
      console.log('');
    });

    console.log('🎯 NEXT STEPS:');
    console.log('1. Run: node test-rbac-with-real-users.js');
    console.log('2. This will test all 3 users with different roles');
    console.log('3. Verify DENIED logs appear in Cloud Logging\n');

  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
