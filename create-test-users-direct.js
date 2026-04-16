#!/usr/bin/env node

/**
 * Direct Database Test User Creation Script
 * Connects to the databases and creates the test users
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection strings from .env.local
const RTH_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/rth_prod?sslmode=require&channel_binding=require";
const SKILLUP_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require";

// Test users to create
const TEST_USERS = [
  {
    database: 'RTH',
    connectionString: RTH_DATABASE_URL,
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'Ajay Shah',
    passwordHash: '$2b$12$cNd4ybUJu0drHK8Vk53JY.C0U.2bzmKoshoRnvfyEli3EVaDJTTZm'
  },
  {
    database: 'SkillUp',
    connectionString: SKILLUP_DATABASE_URL,
    email: 'student@skillupitacademy.com',
    password: 'testing',
    name: 'SkillUp Student',
    passwordHash: '$2b$12$iv598PqwDQgtxFO3VS2KE./O3N6PM36NpAg949u2f88LXMkLplfzu'
  }
];

class DatabaseUserCreator {
  constructor() {
    this.results = [];
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  async createUser(userConfig) {
    const client = new Client({
      connectionString: userConfig.connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      this.log('info', `Connecting to ${userConfig.database} database`);
      await client.connect();

      // Verify password hash
      const isValidHash = await bcrypt.compare(userConfig.password, userConfig.passwordHash);
      this.log('info', `Password hash verification for ${userConfig.email}`, {
        valid: isValidHash
      });

      if (!isValidHash) {
        throw new Error('Password hash verification failed');
      }

      // Check if user already exists
      this.log('info', `Checking if user ${userConfig.email} exists`);
      const existingUserResult = await client.query(
        'SELECT id, email, email_verified, is_blocked FROM users WHERE email = $1',
        [userConfig.email]
      );

      if (existingUserResult.rows.length > 0) {
        const existingUser = existingUserResult.rows[0];
        this.log('info', `User ${userConfig.email} already exists`, {
          id: existingUser.id,
          email: existingUser.email,
          emailVerified: existingUser.email_verified,
          isBlocked: existingUser.is_blocked
        });

        // Verify existing user's password
        const existingPasswordResult = await client.query(
          'SELECT password_hash FROM users WHERE email = $1',
          [userConfig.email]
        );

        if (existingPasswordResult.rows.length > 0) {
          const existingHash = existingPasswordResult.rows[0].password_hash;
          const isExistingValid = await bcrypt.compare(userConfig.password, existingHash);
          this.log('info', `Existing user password verification`, {
            email: userConfig.email,
            passwordValid: isExistingValid
          });

          if (!isExistingValid) {
            this.log('warning', `Updating password for existing user ${userConfig.email}`);
            await client.query(
              'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
              [userConfig.passwordHash, userConfig.email]
            );
            this.log('success', `Password updated for ${userConfig.email}`);
          }
        }

        return { created: false, userId: existingUser.id };
      }

      // Create new user
      this.log('info', `Creating new user ${userConfig.email}`);
      const userResult = await client.query(`
        INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)
        VALUES ($1, $2, true, false, NOW(), NOW())
        RETURNING id, email, email_verified, is_blocked, created_at
      `, [userConfig.email, userConfig.passwordHash]);

      const newUser = userResult.rows[0];
      this.log('success', `User created successfully`, {
        id: newUser.id,
        email: newUser.email,
        emailVerified: newUser.email_verified,
        isBlocked: newUser.is_blocked
      });

      // Create user profile
      this.log('info', `Creating user profile for ${userConfig.email}`);
      await client.query(`
        INSERT INTO user_profiles (user_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [newUser.id, userConfig.name]);

      this.log('success', `User profile created for ${userConfig.name}`);

      // Check if USER role exists and assign it
      this.log('info', `Checking for USER role`);
      const roleResult = await client.query(
        'SELECT id, name FROM roles WHERE name = $1',
        ['USER']
      );

      if (roleResult.rows.length > 0) {
        const userRole = roleResult.rows[0];
        this.log('info', `Found USER role`, { roleId: userRole.id });

        // Assign USER role
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [newUser.id, userRole.id]);

        this.log('success', `USER role assigned to ${userConfig.email}`);
      } else {
        this.log('warning', `USER role not found in ${userConfig.database} database`);
        
        // Create USER role if it doesn't exist
        this.log('info', `Creating USER role in ${userConfig.database} database`);
        const newRoleResult = await client.query(`
          INSERT INTO roles (name)
          VALUES ('USER')
          RETURNING id, name
        `);

        const newRole = newRoleResult.rows[0];
        this.log('success', `USER role created`, { roleId: newRole.id });

        // Assign the newly created role
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [newUser.id, newRole.id]);

        this.log('success', `USER role assigned to ${userConfig.email}`);
      }

      // Verify user creation
      this.log('info', `Verifying user creation for ${userConfig.email}`);
      const verificationResult = await client.query(`
        SELECT 
          u.id, 
          u.email, 
          u.email_verified, 
          u.is_blocked, 
          p.name, 
          r.name as role
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
      `, [userConfig.email]);

      if (verificationResult.rows.length > 0) {
        const verifiedUser = verificationResult.rows[0];
        this.log('success', `User verification successful`, {
          id: verifiedUser.id,
          email: verifiedUser.email,
          name: verifiedUser.name,
          role: verifiedUser.role,
          emailVerified: verifiedUser.email_verified,
          isBlocked: verifiedUser.is_blocked
        });
      }

      return { created: true, userId: newUser.id };

    } catch (error) {
      this.log('error', `Failed to create user ${userConfig.email} in ${userConfig.database}`, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      await client.end();
      this.log('info', `Disconnected from ${userConfig.database} database`);
    }
  }

  async createAllUsers() {
    this.log('info', '🚀 Starting test user creation process');

    const results = [];

    for (const userConfig of TEST_USERS) {
      this.log('info', `\n${'='.repeat(50)}`);
      this.log('info', `Processing ${userConfig.database} user: ${userConfig.email}`);
      this.log('info', `${'='.repeat(50)}`);

      try {
        const result = await this.createUser(userConfig);
        results.push({
          database: userConfig.database,
          email: userConfig.email,
          success: true,
          created: result.created,
          userId: result.userId
        });
      } catch (error) {
        results.push({
          database: userConfig.database,
          email: userConfig.email,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  generateSummaryReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('TEST USER CREATION SUMMARY REPORT');
    console.log('='.repeat(80));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n📊 STATISTICS:`);
    console.log(`  ✅ Successful: ${successful.length}`);
    console.log(`  ❌ Failed: ${failed.length}`);
    console.log(`  📝 Total: ${results.length}`);

    if (successful.length > 0) {
      console.log(`\n✅ SUCCESSFUL USERS:`);
      successful.forEach(result => {
        console.log(`  - ${result.database}: ${result.email} (${result.created ? 'CREATED' : 'ALREADY EXISTS'})`);
      });
    }

    if (failed.length > 0) {
      console.log(`\n❌ FAILED USERS:`);
      failed.forEach(result => {
        console.log(`  - ${result.database}: ${result.email} - ${result.error}`);
      });
    }

    console.log(`\n🎯 NEXT STEPS:`);
    if (successful.length === TEST_USERS.length) {
      console.log('  🎉 All users created successfully!');
      console.log('  🔧 Test login at:');
      console.log('     - https://user.realtutorialhub.com/login');
      console.log('       Email: ajayshah@gmail.com');
      console.log('       Password: testing');
      console.log('');
      console.log('     - https://user.skillupitacademy.com/login');
      console.log('       Email: student@skillupitacademy.com');
      console.log('       Password: testing');
    } else {
      console.log('  ⚠️  Some users failed to create. Check the errors above.');
      console.log('  🔧 For successful users, test login at the respective URLs.');
    }

    console.log(`\n🏁 Process completed at ${new Date().toISOString()}`);
  }
}

// Main execution
async function main() {
  const creator = new DatabaseUserCreator();

  try {
    const results = await creator.createAllUsers();
    creator.generateSummaryReport(results);

    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();