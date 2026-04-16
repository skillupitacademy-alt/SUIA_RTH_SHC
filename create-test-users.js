#!/usr/bin/env node

/**
 * Test User Creation Script
 * Creates the test users in the appropriate brand databases if they don't exist
 * 
 * Test Credentials to Create:
 * - RTH: ajayshah@gmail.com / testing (in rth_prod)
 * - SkillUp: student@skillupitacademy.com / testing (in skillup_prod)
 */

const bcrypt = require('bcryptjs');

const TEST_USERS = [
  {
    brand: 'realtutorialhub',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'Ajay Shah',
    database: 'rth_prod',
    description: 'RTH Test User'
  },
  {
    brand: 'skillup',
    email: 'student@skillupitacademy.com', 
    password: 'testing',
    name: 'SkillUp Student',
    database: 'skillup_prod',
    description: 'SkillUp Test User'
  }
];

class TestUserCreator {
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

  async hashPassword(password) {
    try {
      // Use bcrypt with salt rounds 12 (common for production)
      const saltRounds = 12;
      const hash = await bcrypt.hash(password, saltRounds);
      return hash;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  generateSQLStatements() {
    this.log('info', '🔧 Generating SQL statements to create test users');

    console.log('\n' + '='.repeat(80));
    console.log('SQL STATEMENTS TO CREATE TEST USERS');
    console.log('='.repeat(80));

    for (const user of TEST_USERS) {
      console.log(`\n-- ${user.description} (${user.email}) in ${user.database}`);
      console.log('-- Step 1: Create user');
      console.log(`INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)`);
      console.log(`VALUES (`);
      console.log(`  '${user.email}',`);
      console.log(`  '$2b$12$REPLACE_WITH_ACTUAL_HASH', -- Password: ${user.password}`);
      console.log(`  true,`);
      console.log(`  false,`);
      console.log(`  NOW(),`);
      console.log(`  NOW()`);
      console.log(`);`);
      console.log('');
      console.log('-- Step 2: Create user profile');
      console.log(`INSERT INTO user_profiles (user_id, name, created_at, updated_at)`);
      console.log(`SELECT id, '${user.name}', NOW(), NOW()`);
      console.log(`FROM users WHERE email = '${user.email}';`);
      console.log('');
      console.log('-- Step 3: Assign USER role');
      console.log(`INSERT INTO user_roles (user_id, role_id)`);
      console.log(`SELECT u.id, r.id`);
      console.log(`FROM users u, roles r`);
      console.log(`WHERE u.email = '${user.email}' AND r.name = 'USER';`);
      console.log('');
      console.log('-- Step 4: Verify user was created');
      console.log(`SELECT u.id, u.email, u.email_verified, u.is_blocked, p.name, r.name as role`);
      console.log(`FROM users u`);
      console.log(`LEFT JOIN user_profiles p ON u.id = p.user_id`);
      console.log(`LEFT JOIN user_roles ur ON u.id = ur.user_id`);
      console.log(`LEFT JOIN roles r ON ur.role_id = r.id`);
      console.log(`WHERE u.email = '${user.email}';`);
      console.log('\n' + '-'.repeat(80));
    }
  }

  async generatePasswordHashes() {
    this.log('info', '🔐 Generating password hashes for test users');

    console.log('\n' + '='.repeat(80));
    console.log('PASSWORD HASHES FOR TEST USERS');
    console.log('='.repeat(80));

    for (const user of TEST_USERS) {
      try {
        const hash = await this.hashPassword(user.password);
        const isValid = await this.verifyPassword(user.password, hash);
        
        console.log(`\n${user.description}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${user.password}`);
        console.log(`  Hash: ${hash}`);
        console.log(`  Verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`  Database: ${user.database}`);

        this.log('success', `Generated hash for ${user.description}`, {
          email: user.email,
          hashLength: hash.length,
          verified: isValid
        });

      } catch (error) {
        this.log('error', `Failed to generate hash for ${user.description}`, {
          email: user.email,
          error: error.message
        });
      }
    }
  }

  generateDrizzleScript() {
    this.log('info', '📝 Generating Drizzle ORM script');

    console.log('\n' + '='.repeat(80));
    console.log('DRIZZLE ORM SCRIPT TO CREATE TEST USERS');
    console.log('='.repeat(80));

    console.log(`
// create-test-users-drizzle.ts
import { db as rthDb } from '@quiz/db-rth';
import { db as skillupDb } from '@quiz/db-skillup';
import { users, userProfiles, roles, userRoles } from '@quiz/db-rth/schema';
import { users as skillupUsers, userProfiles as skillupUserProfiles, roles as skillupRoles, userRoles as skillupUserRoles } from '@quiz/db-skillup/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createTestUsers() {
  console.log('🔧 Creating test users...');

  // RTH User
  try {
    const rthPasswordHash = await bcrypt.hash('testing', 12);
    
    // Check if RTH user exists
    const existingRthUser = await rthDb.select().from(users).where(eq(users.email, 'ajayshah@gmail.com')).limit(1);
    
    if (existingRthUser.length === 0) {
      // Create RTH user
      const [rthUser] = await rthDb.insert(users).values({
        email: 'ajayshah@gmail.com',
        passwordHash: rthPasswordHash,
        emailVerified: true,
        isBlocked: false
      }).returning();

      // Create RTH user profile
      await rthDb.insert(userProfiles).values({
        userId: rthUser.id,
        name: 'Ajay Shah'
      });

      // Get USER role and assign it
      const [userRole] = await rthDb.select().from(roles).where(eq(roles.name, 'USER')).limit(1);
      if (userRole) {
        await rthDb.insert(userRoles).values({
          userId: rthUser.id,
          roleId: userRole.id
        });
      }

      console.log('✅ RTH user created:', rthUser.id);
    } else {
      console.log('ℹ️ RTH user already exists');
    }
  } catch (error) {
    console.error('❌ RTH user creation failed:', error);
  }

  // SkillUp User  
  try {
    const skillupPasswordHash = await bcrypt.hash('testing', 12);
    
    // Check if SkillUp user exists
    const existingSkillupUser = await skillupDb.select().from(skillupUsers).where(eq(skillupUsers.email, 'student@skillupitacademy.com')).limit(1);
    
    if (existingSkillupUser.length === 0) {
      // Create SkillUp user
      const [skillupUser] = await skillupDb.insert(skillupUsers).values({
        email: 'student@skillupitacademy.com',
        passwordHash: skillupPasswordHash,
        emailVerified: true,
        isBlocked: false
      }).returning();

      // Create SkillUp user profile
      await skillupDb.insert(skillupUserProfiles).values({
        userId: skillupUser.id,
        name: 'SkillUp Student'
      });

      // Get USER role and assign it
      const [userRole] = await skillupDb.select().from(skillupRoles).where(eq(skillupRoles.name, 'USER')).limit(1);
      if (userRole) {
        await skillupDb.insert(skillupUserRoles).values({
          userId: skillupUser.id,
          roleId: userRole.id
        });
      }

      console.log('✅ SkillUp user created:', skillupUser.id);
    } else {
      console.log('ℹ️ SkillUp user already exists');
    }
  } catch (error) {
    console.error('❌ SkillUp user creation failed:', error);
  }

  console.log('🏁 Test user creation completed');
}

createTestUsers().catch(console.error);
`);
  }

  async run() {
    this.log('info', '🚀 Starting Test User Creation Helper');

    console.log('\n' + '='.repeat(80));
    console.log('TEST USER CREATION HELPER');
    console.log('='.repeat(80));
    console.log('This script helps create the missing test users in the brand databases.');
    console.log('');
    console.log('Test Users to Create:');
    TEST_USERS.forEach(user => {
      console.log(`  - ${user.description}: ${user.email} (${user.database})`);
    });

    // Generate password hashes
    await this.generatePasswordHashes();

    // Generate SQL statements
    this.generateSQLStatements();

    // Generate Drizzle script
    this.generateDrizzleScript();

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Copy the password hashes from above');
    console.log('2. Use the SQL statements to create users in the databases');
    console.log('3. Or use the Drizzle script if you have access to the codebase');
    console.log('4. Verify the users exist by running the diagnostic script again');
    console.log('5. Test login with the credentials');

    console.log('\n🏁 Helper completed at', new Date().toISOString());
  }
}

// Run the helper
async function main() {
  const creator = new TestUserCreator();
  
  try {
    await creator.run();
  } catch (error) {
    console.error('💥 Test user creation helper failed:', error);
    process.exit(1);
  }
}

main();