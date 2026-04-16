#!/usr/bin/env node

/**
 * Create Missing Test Users Script
 * 
 * This script creates the missing test users in the brand databases
 * based on the findings from the authentication investigation.
 * 
 * Test Users to Create:
 * - RTH: ajayshah@gmail.com / testing
 * - SkillUp: student@skillupitacademy.com / testing
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const TEST_USERS = {
  rth: {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'Ajay Shah',
    dbUrl: process.env.DATABASE_URL_RTH,
    brand: 'RTH'
  },
  skillup: {
    email: 'student@skillupitacademy.com',
    password: 'testing',
    name: 'SkillUp Student',
    dbUrl: process.env.DATABASE_URL_SKILLUP,
    brand: 'SkillUp'
  }
};

class TestUserCreator {
  constructor() {
    this.results = {};
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async hashPassword(password) {
    const saltRounds = 12; // Match the application's salt rounds
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async createUserInDatabase(brandKey, config) {
    this.log(`🔍 Creating user in ${config.brand} database...`);
    
    const client = new Client({
      connectionString: config.dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      this.log(`✅ Connected to ${config.brand} database`);

      // Start transaction
      await client.query('BEGIN');

      // Check if user already exists
      const existingUserResult = await client.query(
        'SELECT id, email FROM users WHERE email = $1',
        [config.email]
      );

      if (existingUserResult.rows.length > 0) {
        this.log(`⚠️  User ${config.email} already exists in ${config.brand} database`);
        this.results[brandKey] = {
          success: false,
          reason: 'user_already_exists',
          existingUserId: existingUserResult.rows[0].id
        };
        await client.query('ROLLBACK');
        return;
      }

      // Generate password hash
      const passwordHash = await this.hashPassword(config.password);
      this.log(`🔐 Generated password hash for ${config.email}`);

      // Verify the hash works
      const hashVerification = await this.verifyPassword(config.password, passwordHash);
      if (!hashVerification) {
        throw new Error('Password hash verification failed');
      }
      this.log(`✅ Password hash verification successful`);

      // Create user
      const userResult = await client.query(`
        INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, created_at
      `, [config.email, passwordHash, true, false]);

      const userId = userResult.rows[0].id;
      this.log(`✅ Created user with ID: ${userId}`);

      // Create user profile
      await client.query(`
        INSERT INTO user_profiles (user_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [userId, config.name]);

      this.log(`✅ Created user profile for ${config.name}`);

      // Get USER role ID
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['USER']
      );

      if (roleResult.rows.length === 0) {
        // Create USER role if it doesn't exist
        const newRoleResult = await client.query(`
          INSERT INTO roles (name, created_at, updated_at)
          VALUES ($1, NOW(), NOW())
          RETURNING id
        `, ['USER']);
        
        const roleId = newRoleResult.rows[0].id;
        this.log(`✅ Created USER role with ID: ${roleId}`);
        
        // Assign role to user
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [userId, roleId]);
      } else {
        const roleId = roleResult.rows[0].id;
        this.log(`✅ Found existing USER role with ID: ${roleId}`);
        
        // Assign role to user
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [userId, roleId]);
      }

      this.log(`✅ Assigned USER role to user`);

      // Verify the complete user creation
      const verificationResult = await client.query(`
        SELECT 
          u.id,
          u.email,
          u.email_verified,
          u.is_blocked,
          u.created_at,
          p.name as profile_name,
          array_agg(r.name) as roles
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
        GROUP BY u.id, u.email, u.email_verified, u.is_blocked, u.created_at, p.name
      `, [config.email]);

      const createdUser = verificationResult.rows[0];
      
      // Test password verification
      const passwordTest = await this.verifyPassword(config.password, passwordHash);

      // Commit transaction
      await client.query('COMMIT');

      this.results[brandKey] = {
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          emailVerified: createdUser.email_verified,
          isBlocked: createdUser.is_blocked,
          profileName: createdUser.profile_name,
          roles: createdUser.roles.filter(r => r !== null),
          createdAt: createdUser.created_at,
          passwordVerified: passwordTest
        }
      };

      this.log(`✅ Successfully created and verified user ${config.email} in ${config.brand} database`);

    } catch (error) {
      this.log(`❌ Error creating user in ${config.brand} database: ${error.message}`);
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        this.log(`❌ Rollback error: ${rollbackError.message}`);
      }
      
      this.results[brandKey] = {
        success: false,
        error: error.message,
        stack: error.stack
      };
    } finally {
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async testAuthentication(brandKey, config) {
    this.log(`🧪 Testing authentication for ${config.email}...`);
    
    const apiUrls = {
      rth: 'https://api.realtutorialhub.com/api/auth/login',
      skillup: 'https://api.skillupitacademy.com/api/auth/login'
    };

    const brands = {
      rth: 'realtutorialhub',
      skillup: 'skillup'
    };

    try {
      const fetch = require('node-fetch');
      const crypto = require('crypto');
      
      const correlationId = crypto.randomUUID();
      const authPayload = {
        email: config.email,
        password: config.password,
        platform: brands[brandKey]
      };

      const response = await fetch(apiUrls[brandKey], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          'Accept': 'application/json'
        },
        body: JSON.stringify(authPayload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        this.log(`✅ Authentication test SUCCESSFUL for ${config.email}`);
        this.results[`${brandKey}_auth_test`] = {
          success: true,
          correlationId: correlationId,
          status: response.status,
          userData: responseData.data?.user || null
        };
      } else {
        this.log(`❌ Authentication test FAILED for ${config.email}: ${response.status}`);
        this.results[`${brandKey}_auth_test`] = {
          success: false,
          correlationId: correlationId,
          status: response.status,
          error: responseData
        };
      }

    } catch (error) {
      this.log(`❌ Authentication test error for ${config.email}: ${error.message}`);
      this.results[`${brandKey}_auth_test`] = {
        success: false,
        error: error.message
      };
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 USER CREATION SUMMARY');
    console.log('='.repeat(80));

    let totalCreated = 0;
    let totalAuthTests = 0;
    let successfulAuthTests = 0;

    for (const [key, result] of Object.entries(this.results)) {
      if (key.includes('_auth_test')) {
        totalAuthTests++;
        if (result.success) {
          successfulAuthTests++;
        }
      } else {
        if (result.success) {
          totalCreated++;
          console.log(`✅ ${key.toUpperCase()}: User created successfully`);
          console.log(`   Email: ${result.user.email}`);
          console.log(`   ID: ${result.user.id}`);
          console.log(`   Profile: ${result.user.profileName}`);
          console.log(`   Roles: ${result.user.roles.join(', ')}`);
          console.log(`   Password Verified: ${result.user.passwordVerified ? '✅' : '❌'}`);
        } else {
          console.log(`❌ ${key.toUpperCase()}: ${result.reason || result.error}`);
        }
      }
    }

    console.log(`\nUsers Created: ${totalCreated}/2`);
    console.log(`Auth Tests Passed: ${successfulAuthTests}/${totalAuthTests}`);

    if (totalCreated === 2 && successfulAuthTests === 2) {
      console.log('\n🎉 SUCCESS: All test users created and authentication working!');
      console.log('\nYou can now test login at:');
      console.log('- RTH: https://user.realtutorialhub.com/login');
      console.log('- SkillUp: https://user.skillupitacademy.com/login');
    } else if (totalCreated === 2) {
      console.log('\n⚠️  Users created but authentication still failing');
      console.log('Check correlation IDs in backend logs for debugging');
    } else {
      console.log('\n❌ Some users could not be created');
    }

    console.log('='.repeat(80));
  }

  async run() {
    console.log('🚀 Creating Missing Test Users');
    console.log('This will create test users in the brand databases');
    console.log('');

    try {
      // Create users in both databases
      for (const [brandKey, config] of Object.entries(TEST_USERS)) {
        await this.createUserInDatabase(brandKey, config);
        console.log('');
      }

      // Test authentication for created users
      console.log('🧪 Testing authentication for created users...');
      for (const [brandKey, config] of Object.entries(TEST_USERS)) {
        if (this.results[brandKey]?.success) {
          await this.testAuthentication(brandKey, config);
        }
      }

      this.printSummary();

      // Save results
      const fs = require('fs');
      const resultsFile = `user-creation-results-${Date.now()}.json`;
      fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Detailed results saved to: ${resultsFile}`);

    } catch (error) {
      console.error('❌ User creation failed:', error);
      process.exit(1);
    }
  }
}

// Run the user creator
if (require.main === module) {
  const creator = new TestUserCreator();
  creator.run().catch(console.error);
}

module.exports = TestUserCreator;