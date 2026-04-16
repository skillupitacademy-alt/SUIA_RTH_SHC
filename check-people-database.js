#!/usr/bin/env node

/**
 * Check People Database for Shadow Users
 * 
 * This script checks if the shadow users exist in the people database
 * which is required for the UserIdentityBridgeService authentication.
 */

const { Client } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const TEST_USERS = [
  {
    brand: 'RTH',
    email: 'ajayshah@gmail.com',
    externalId: '54726a2e-fca5-4d93-abc6-e7cee97a86f8', // From our previous verification
    platform: 'realtutorialhub'
  },
  {
    brand: 'SkillUp',
    email: 'student@skillupitacademy.com',
    externalId: 'b438fb19-fa32-4df4-93b4-91837a5a15ef', // From our previous verification
    platform: 'skillup'
  }
];

async function checkPeopleDatabase() {
  console.log('🔍 Checking People Database for Shadow Users');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL_PEOPLE,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to People database');

    // Check database structure
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if users table exists and its structure
    const usersTableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    if (usersTableCheck.rows.length > 0) {
      console.log('\n📊 Users table structure:');
      usersTableCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });

      // Check for our test users
      console.log('\n🔍 Checking for shadow users:');
      
      for (const user of TEST_USERS) {
        console.log(`\n--- ${user.brand} User ---`);
        
        // Check by external_id
        const shadowUserResult = await client.query(`
          SELECT 
            id,
            external_id,
            external_brand,
            email,
            platform,
            role,
            created_at,
            deleted_at
          FROM users 
          WHERE external_id = $1 AND platform = $2 AND deleted_at IS NULL
        `, [user.externalId, user.platform]);

        if (shadowUserResult.rows.length > 0) {
          const shadowUser = shadowUserResult.rows[0];
          console.log(`✅ Shadow user found:`);
          console.log(`   ID: ${shadowUser.id}`);
          console.log(`   External ID: ${shadowUser.external_id}`);
          console.log(`   Email: ${shadowUser.email}`);
          console.log(`   Platform: ${shadowUser.platform}`);
          console.log(`   Role: ${shadowUser.role}`);
          console.log(`   Created: ${shadowUser.created_at}`);

          // Check platform access
          const accessResult = await client.query(`
            SELECT platform, granted_at
            FROM platform_access 
            WHERE user_id = $1
          `, [shadowUser.id]);

          if (accessResult.rows.length > 0) {
            console.log(`   Platform Access:`);
            accessResult.rows.forEach(access => {
              console.log(`     - ${access.platform} (granted: ${access.granted_at})`);
            });
          } else {
            console.log(`   ❌ No platform access found`);
          }

        } else {
          console.log(`❌ Shadow user NOT found for external_id: ${user.externalId}`);
          
          // Check if there's a user with the same email
          const emailResult = await client.query(`
            SELECT id, external_id, platform, email
            FROM users 
            WHERE email = $1 AND deleted_at IS NULL
          `, [user.email]);

          if (emailResult.rows.length > 0) {
            console.log(`   ⚠️  Found user(s) with same email:`);
            emailResult.rows.forEach(emailUser => {
              console.log(`     - ID: ${emailUser.id}, External ID: ${emailUser.external_id}, Platform: ${emailUser.platform}`);
            });
          }
        }
      }

    } else {
      console.log('❌ Users table not found in people database');
    }

  } catch (error) {
    console.log(`❌ Error accessing people database: ${error.message}`);
    console.log('This could be the root cause of the authentication issue!');
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 ANALYSIS:');
  console.log('If shadow users are missing from the people database,');
  console.log('the UserIdentityBridgeService will fail during authentication,');
  console.log('causing the "Invalid credentials" error even when users exist');
  console.log('in the brand databases.');
  console.log('='.repeat(60));
}

// Run the check
checkPeopleDatabase().catch(console.error);