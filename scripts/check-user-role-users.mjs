/**
 * Script to check which users have the "user" role in SkillUp database
 * Usage: node scripts/check-user-role-users.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkUserRoleUsers() {
  console.log('🔍 Checking users with "user" role in SkillUp database');
  
  if (!process.env.DATABASE_URL_SKILLUP) {
    console.error('❌ DATABASE_URL_SKILLUP not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_SKILLUP);

    // Find users with "user" role
    console.log('\n📋 Users with "user" role:');
    const userRoleUsers = await sql`
      SELECT 
        u.id as user_id,
        u.email,
        u.email_verified,
        u.is_onboarded,
        u.created_at,
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(r.name) = 'user'
      ORDER BY u.created_at DESC
    `;

    if (userRoleUsers.length === 0) {
      console.log('❌ No users found with "user" role');
    } else {
      console.log(`✅ Found ${userRoleUsers.length} user(s) with "user" role:\n`);
      userRoleUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   User ID: ${user.user_id}`);
        console.log(`   Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
        console.log(`   Onboarded: ${user.is_onboarded ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }

    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkUserRoleUsers().catch(console.error);
