#!/usr/bin/env node

/**
 * Seed Test Users in Brand-Specific Databases
 * Creates test users in both RTH and SkillUp databases
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

// Brand-specific test users
const BRAND_USERS = [
  {
    brand: 'RTH',
    dbUrl: process.env.DATABASE_URL_RTH,
    users: [
      {
        email: 'ajayshah@gmail.com',
        password: 'testing',
        name: 'Ajay Shah',
        roleName: 'user',
      }
    ]
  },
  {
    brand: 'SkillUp',
    dbUrl: process.env.DATABASE_URL_SKILLUP,
    users: [
      {
        email: 'student@skillupitacademy.com',
        password: 'testing',
        name: 'SkillUp Student',
        roleName: 'user',
      }
    ]
  }
];

async function ensureRole(client, roleName) {
  try {
    const existing = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
    if (existing.rowCount > 0) {
      console.log(`   Role exists: ${roleName}`);
      return existing.rows[0].id;
    }

    console.log(`   Creating role: ${roleName}`);
    const inserted = await client.query(
      'INSERT INTO roles (name) VALUES ($1) RETURNING id',
      [roleName],
    );
    return inserted.rows[0].id;
  } catch (error) {
    console.log(`   Role error: ${error.message}`);
    // Try to find existing role with different case
    const existing = await client.query('SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1', [roleName]);
    if (existing.rowCount > 0) {
      console.log(`   Found existing role with different case: ${roleName}`);
      return existing.rows[0].id;
    }
    throw error;
  }
}

async function upsertUser(client, testUser, passwordHash) {
  try {
    // Check if user exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [testUser.email]);
    
    let userId;
    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
      console.log(`   Updating existing user: ${testUser.email} (${userId})`);
      
      // Update user
      await client.query(
        `UPDATE users SET 
         password_hash = $1, 
         email_verified = TRUE, 
         is_blocked = FALSE, 
         deleted_at = NULL 
         WHERE id = $2`,
        [passwordHash, userId]
      );
    } else {
      console.log(`   Creating new user: ${testUser.email}`);
      
      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, email_verified, is_blocked, deleted_at)
         VALUES ($1, $2, TRUE, FALSE, NULL)
         RETURNING id`,
        [testUser.email, passwordHash]
      );
      userId = result.rows[0].id;
    }

    // Upsert profile
    const profileCheck = await client.query(
      'SELECT id FROM user_profiles WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (profileCheck.rowCount > 0) {
      await client.query(
        'UPDATE user_profiles SET name = $1 WHERE user_id = $2',
        [testUser.name, userId]
      );
      console.log(`   Updated profile for: ${testUser.email}`);
    } else {
      await client.query(
        'INSERT INTO user_profiles (user_id, name) VALUES ($1, $2)',
        [userId, testUser.name]
      );
      console.log(`   Created profile for: ${testUser.email}`);
    }

    return userId;
  } catch (error) {
    console.log(`   User upsert error: ${error.message}`);
    throw error;
  }
}

async function assignRole(client, userId, roleId) {
  try {
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
    console.log(`   Assigned role to user`);
  } catch (error) {
    console.log(`   Role assignment error: ${error.message}`);
    // Try without conflict handling for older schemas
    try {
      const existing = await client.query(
        'SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
      );
      if (existing.rowCount === 0) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [userId, roleId]
        );
        console.log(`   Assigned role to user (fallback)`);
      } else {
        console.log(`   Role already assigned`);
      }
    } catch (fallbackError) {
      console.log(`   Role assignment fallback error: ${fallbackError.message}`);
    }
  }
}

async function seedBrandDatabase(brandConfig) {
  console.log(`\n🔧 Seeding ${brandConfig.brand} Database`);
  console.log('='.repeat(50));
  
  if (!brandConfig.dbUrl) {
    console.log(`❌ No database URL configured for ${brandConfig.brand}`);
    return false;
  }

  let pool, client;
  try {
    console.log(`🔗 Connecting to ${brandConfig.brand} database...`);
    pool = new Pool({ 
      connectionString: brandConfig.dbUrl, 
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    client = await pool.connect();
    
    // Test connection
    await client.query('SELECT 1');
    console.log(`✅ Connected to ${brandConfig.brand} database`);

    for (const testUser of brandConfig.users) {
      console.log(`\n👤 Processing user: ${testUser.email}`);
      
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const userId = await upsertUser(client, testUser, passwordHash);
      
      const roleId = await ensureRole(client, testUser.roleName);
      await assignRole(client, userId, roleId);
      
      console.log(`✅ User ${testUser.email} ready with role ${testUser.roleName}`);
    }

    console.log(`\n✅ ${brandConfig.brand} database seeding complete`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${brandConfig.brand} database error:`, error.message);
    return false;
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

async function main() {
  console.log('🚀 Seeding Brand-Specific Test Users\n');
  
  const results = [];
  
  for (const brandConfig of BRAND_USERS) {
    const success = await seedBrandDatabase(brandConfig);
    results.push({ brand: brandConfig.brand, success });
  }
  
  console.log('\n📊 SEEDING SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`${result.brand}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  });
  
  const allSuccess = results.every(r => r.success);
  console.log(`\n🎯 Overall: ${allSuccess ? '✅ ALL DATABASES SEEDED' : '❌ SOME FAILURES'}`);
  
  if (allSuccess) {
    console.log('\n🧪 Now test login with:');
    console.log('- RTH: ajayshah@gmail.com / testing');
    console.log('- SkillUp: student@skillupitacademy.com / testing');
  }
  
  return allSuccess;
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});