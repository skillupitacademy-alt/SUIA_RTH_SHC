#!/usr/bin/env node

/**
 * 🔍 CHECK USER ROLES IN DATABASE
 * 
 * Verifies what roles users actually have in the database
 */

const fs = require('fs');
const path = require('path');
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

console.log('🔍 CHECKING USER ROLES IN DATABASE');
console.log('==================================\n');

async function main() {
  const pool = new Pool({ 
    connectionString: DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    // Check all test users
    const result = await pool.query(`
      SELECT 
        u.email,
        u.email_verified,
        u.is_blocked,
        u.deleted_at,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email IN (
        'ajayshah@gmail.com',
        'rbac-user@test.com',
        'rbac-student@test.com',
        'rbac-invalid@test.com',
        'admin@test.com'
      )
      GROUP BY u.id, u.email, u.email_verified, u.is_blocked, u.deleted_at
      ORDER BY u.email
    `);

    console.log('📊 USER ROLES:');
    console.log('=' .repeat(80));
    console.log('');

    if (result.rows.length === 0) {
      console.log('❌ No users found');
    } else {
      result.rows.forEach(row => {
        console.log(`Email: ${row.email}`);
        console.log(`  Verified: ${row.email_verified ? '✅' : '❌'}`);
        console.log(`  Blocked: ${row.is_blocked ? '❌ YES' : '✅ NO'}`);
        console.log(`  Deleted: ${row.deleted_at ? '❌ YES' : '✅ NO'}`);
        console.log(`  Roles: ${row.roles ? row.roles.join(', ') : 'NONE'}`);
        console.log('');
      });
    }

    // Check all available roles
    const rolesResult = await pool.query('SELECT name FROM roles ORDER BY name');
    console.log('📋 AVAILABLE ROLES IN DATABASE:');
    console.log('=' .repeat(80));
    console.log('');
    rolesResult.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });
    console.log('');

  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
