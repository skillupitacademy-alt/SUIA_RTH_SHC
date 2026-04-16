#!/usr/bin/env node

/**
 * Test script to validate the specific failing credentials
 * RTH: ajayshah@gmail.com / testing
 * SkillUp: student@skillupitacademy.com / testing
 */

// Import the database connections
const rthDb = require('./packages/db-rth/dist/index.js').db;
const skillupDb = require('./packages/db-skillup/dist/index.js').db;
const peopleDb = require('./packages/db/dist/index.js').db;
const bcrypt = require('bcryptjs');

async function testCredentials() {
  console.log('🔍 Testing Authentication Credentials\n');

  // Test RTH credentials
  console.log('📍 Testing RTH: ajayshah@gmail.com / testing');
  try {
    const rthUsers = await rthDb.query.users.findMany({
      where: (users, { eq }) => eq(users.email, 'ajayshah@gmail.com'),
      with: {
        userRoles: {
          with: {
            role: true
          }
        },
        profile: true
      }
    });

    if (rthUsers.length === 0) {
      console.log('❌ RTH User not found in rth_prod database');
    } else {
      const user = rthUsers[0];
      console.log('✅ RTH User found:', {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        isBlocked: user.isBlocked,
        deletedAt: user.deletedAt,
        shadowUserId: user.shadowUserId,
        roles: user.userRoles?.map(ur => ur.role?.name) || []
      });

      // Test password
      const passwordMatch = await bcrypt.compare('testing', user.passwordHash);
      console.log('🔑 Password match:', passwordMatch ? '✅ YES' : '❌ NO');
      
      if (!passwordMatch) {
        console.log('🔍 Password hash:', user.passwordHash.substring(0, 20) + '...');
      }
    }
  } catch (error) {
    console.log('❌ RTH Database Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test SkillUp credentials
  console.log('📍 Testing SkillUp: student@skillupitacademy.com / testing');
  try {
    const skillupUsers = await skillupDb.query.users.findMany({
      where: (users, { eq }) => eq(users.email, 'student@skillupitacademy.com'),
      with: {
        userRoles: {
          with: {
            role: true
          }
        },
        profile: true
      }
    });

    if (skillupUsers.length === 0) {
      console.log('❌ SkillUp User not found in skillup_prod database');
    } else {
      const user = skillupUsers[0];
      console.log('✅ SkillUp User found:', {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        isBlocked: user.isBlocked,
        deletedAt: user.deletedAt,
        shadowUserId: user.shadowUserId,
        roles: user.userRoles?.map(ur => ur.role?.name) || []
      });

      // Test password
      const passwordMatch = await bcrypt.compare('testing', user.passwordHash);
      console.log('🔑 Password match:', passwordMatch ? '✅ YES' : '❌ NO');
      
      if (!passwordMatch) {
        console.log('🔍 Password hash:', user.passwordHash.substring(0, 20) + '...');
      }
    }
  } catch (error) {
    console.log('❌ SkillUp Database Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Check shadow users in people_prod
  console.log('📍 Checking Shadow Users in people_prod');
  try {
    const shadowUsers = await peopleDb.query.users.findMany({
      where: (users, { or, eq }) => or(
        eq(users.email, 'ajayshah@gmail.com'),
        eq(users.email, 'student@skillupitacademy.com')
      )
    });

    console.log('👥 Shadow users found:', shadowUsers.length);
    shadowUsers.forEach(user => {
      console.log('  -', {
        id: user.id,
        email: user.email,
        externalId: user.externalId,
        externalBrand: user.externalBrand,
        platform: user.platform
      });
    });
  } catch (error) {
    console.log('❌ People Database Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test environment variables
  console.log('📍 Environment Variables Check');
  console.log('DATABASE_URL_RTH:', process.env.DATABASE_URL_RTH ? '✅ Set' : '❌ Missing');
  console.log('DATABASE_URL_SKILLUP:', process.env.DATABASE_URL_SKILLUP ? '✅ Set' : '❌ Missing');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

  process.exit(0);
}

testCredentials().catch(error => {
  console.error('💥 Script Error:', error);
  process.exit(1);
});