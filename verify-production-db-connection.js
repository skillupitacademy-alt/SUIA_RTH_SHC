#!/usr/bin/env node

/**
 * Verify Production Database Connection
 * 
 * This script creates test users directly in the production databases
 * to ensure they exist and can be authenticated against.
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const TEST_USERS = [
  {
    brand: 'RTH',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'Ajay Shah',
    dbUrl: process.env.DATABASE_URL_RTH
  },
  {
    brand: 'SkillUp',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    name: 'SkillUp Student',
    dbUrl: process.env.DATABASE_URL_SKILLUP
  }
];

async function verifyAndCreateUsers() {
  console.log('🔍 Verifying Production Database Connections and Users');
  console.log('='.repeat(70));

  for (const user of TEST_USERS) {
    console.log(`\n--- ${user.brand} Database ---`);
    
    const client = new Client({
      connectionString: user.dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`✅ Connected to ${user.brand} database`);

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id, email, password_hash, email_verified, is_blocked FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        const dbUser = existingUser.rows[0];
        console.log(`✅ User ${user.email} exists in ${user.brand} database`);
        console.log(`   ID: ${dbUser.id}`);
        console.log(`   Email Verified: ${dbUser.email_verified}`);
        console.log(`   Is Blocked: ${dbUser.is_blocked}`);

        // Test password verification
        const passwordMatch = await bcrypt.compare(user.password, dbUser.password_hash);
        console.log(`   Password Match: ${passwordMatch ? '✅ YES' : '❌ NO'}`);

        if (!passwordMatch) {
          console.log('   🔧 Updating password hash...');
          const newHash = await bcrypt.hash(user.password, 12);
          await client.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [newHash, user.email]
          );
          console.log('   ✅ Password hash updated');
        }

      } else {
        console.log(`❌ User ${user.email} NOT found in ${user.brand} database`);
        console.log('   🔧 Creating user...');

        // Create user
        const passwordHash = await bcrypt.hash(user.password, 12);
        
        const newUser = await client.query(`
          INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)
          VALUES ($1, $2, true, false, NOW(), NOW())
          RETURNING id
        `, [user.email, passwordHash]);

        const userId = newUser.rows[0].id;
        console.log(`   ✅ Created user with ID: ${userId}`);

        // Create profile
        await client.query(`
          INSERT INTO user_profiles (user_id, name, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
        `, [userId, user.name]);
        console.log(`   ✅ Created profile for ${user.name}`);

        // Assign role
        const roleQuery = user.brand === 'SkillUp' ? 'student' : 'user';
        const role = await client.query('SELECT id FROM roles WHERE name = $1', [roleQuery]);
        
        if (role.rows.length > 0) {
          await client.query(`
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
          `, [userId, role.rows[0].id]);
          console.log(`   ✅ Assigned ${roleQuery} role`);
        } else {
          console.log(`   ⚠️  Role ${roleQuery} not found, checking for 'user' role`);
          const userRole = await client.query('SELECT id FROM roles WHERE name = $1', ['user']);
          if (userRole.rows.length > 0) {
            await client.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [userId, userRole.rows[0].id]);
            console.log(`   ✅ Assigned user role instead`);
          }
        }
      }

      // Final verification
      const finalCheck = await client.query(`
        SELECT 
          u.id,
          u.email,
          u.email_verified,
          u.is_blocked,
          p.name as profile_name,
          array_agg(r.name) as roles
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
        GROUP BY u.id, u.email, u.email_verified, u.is_blocked, p.name
      `, [user.email]);

      if (finalCheck.rows.length > 0) {
        const verifiedUser = finalCheck.rows[0];
        console.log(`\n   📊 Final User Status:`);
        console.log(`   Email: ${verifiedUser.email}`);
        console.log(`   Profile: ${verifiedUser.profile_name}`);
        console.log(`   Roles: ${verifiedUser.roles.filter(r => r !== null).join(', ')}`);
        console.log(`   Email Verified: ${verifiedUser.email_verified}`);
        console.log(`   Is Blocked: ${verifiedUser.is_blocked}`);
      }

    } catch (error) {
      console.log(`❌ Error with ${user.brand} database: ${error.message}`);
    } finally {
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 NEXT STEP: Test authentication again');
  console.log('If users exist with correct passwords but authentication still fails,');
  console.log('the issue is in the production authentication logic or environment.');
  console.log('='.repeat(70));
}

// Run verification
verifyAndCreateUsers().catch(console.error);