#!/usr/bin/env node

/**
 * Check Shadow User Links
 * 
 * This script verifies that the brand database users have the correct
 * shadow_user_id linking them to the people database.
 */

const { Client } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const TEST_USERS = [
  {
    brand: 'RTH',
    email: 'ajayshah@gmail.com',
    dbUrl: process.env.DATABASE_URL_RTH,
    expectedShadowId: '54726a2e-fca5-4d93-abc6-e7cee97a86f8' // From people DB check
  },
  {
    brand: 'SkillUp',
    email: 'student@skillupitacademy.com',
    dbUrl: process.env.DATABASE_URL_SKILLUP,
    expectedShadowId: 'afc355ca-6bae-4165-89dd-198494a62f85' // From people DB check
  }
];

async function checkShadowUserLinks() {
  console.log('🔍 Checking Shadow User Links in Brand Databases');
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

      // Check the user's shadow_user_id
      const userResult = await client.query(`
        SELECT 
          id,
          email,
          shadow_user_id,
          email_verified,
          is_blocked,
          created_at,
          updated_at
        FROM users 
        WHERE email = $1
      `, [user.email]);

      if (userResult.rows.length > 0) {
        const brandUser = userResult.rows[0];
        console.log(`✅ User found in ${user.brand} database:`);
        console.log(`   ID: ${brandUser.id}`);
        console.log(`   Email: ${brandUser.email}`);
        console.log(`   Shadow User ID: ${brandUser.shadow_user_id || 'NULL'}`);
        console.log(`   Expected Shadow ID: ${user.expectedShadowId}`);
        console.log(`   Email Verified: ${brandUser.email_verified}`);
        console.log(`   Is Blocked: ${brandUser.is_blocked}`);

        // Check if shadow_user_id matches expected
        if (brandUser.shadow_user_id === user.expectedShadowId) {
          console.log(`   ✅ Shadow User ID matches expected value`);
        } else if (brandUser.shadow_user_id === null) {
          console.log(`   ❌ Shadow User ID is NULL - NEEDS TO BE SET`);
          console.log(`   🔧 Updating shadow_user_id...`);
          
          await client.query(`
            UPDATE users 
            SET shadow_user_id = $1, updated_at = NOW()
            WHERE email = $2
          `, [user.expectedShadowId, user.email]);
          
          console.log(`   ✅ Shadow User ID updated to: ${user.expectedShadowId}`);
        } else {
          console.log(`   ❌ Shadow User ID mismatch:`);
          console.log(`      Current: ${brandUser.shadow_user_id}`);
          console.log(`      Expected: ${user.expectedShadowId}`);
          console.log(`   🔧 Updating shadow_user_id...`);
          
          await client.query(`
            UPDATE users 
            SET shadow_user_id = $1, updated_at = NOW()
            WHERE email = $2
          `, [user.expectedShadowId, user.email]);
          
          console.log(`   ✅ Shadow User ID updated to: ${user.expectedShadowId}`);
        }

        // Final verification
        const verifyResult = await client.query(`
          SELECT shadow_user_id FROM users WHERE email = $1
        `, [user.email]);
        
        const finalShadowId = verifyResult.rows[0].shadow_user_id;
        console.log(`   📊 Final Shadow User ID: ${finalShadowId}`);
        
        if (finalShadowId === user.expectedShadowId) {
          console.log(`   ✅ Shadow User ID correctly linked`);
        } else {
          console.log(`   ❌ Shadow User ID still incorrect`);
        }

      } else {
        console.log(`❌ User ${user.email} NOT found in ${user.brand} database`);
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
  console.log('If shadow_user_id links are now correct, authentication should work.');
  console.log('='.repeat(70));
}

// Run the check
checkShadowUserLinks().catch(console.error);