/**
 * Script to check which users have the student role in SkillUp database
 * Usage: node scripts/check-student-role-users.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkStudentRoleUsers() {
  console.log('🔍 Checking users with student role in SkillUp database');
  
  if (!process.env.DATABASE_URL_SKILLUP) {
    console.error('❌ DATABASE_URL_SKILLUP not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_SKILLUP);

    // Find users with student role
    console.log('\n📋 Users with "student" role:');
    const studentUsers = await sql`
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
      WHERE LOWER(r.name) = 'student'
      ORDER BY u.created_at DESC
    `;

    if (studentUsers.length === 0) {
      console.log('❌ No users found with student role');
    } else {
      console.log(`✅ Found ${studentUsers.length} user(s) with student role:\n`);
      studentUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   User ID: ${user.user_id}`);
        console.log(`   Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
        console.log(`   Onboarded: ${user.is_onboarded ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Also check users with ALL their roles
    console.log('\n📊 All users and their roles:');
    const allUsersRoles = await sql`
      SELECT 
        u.email,
        u.is_onboarded,
        array_agg(r.name ORDER BY r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.email, u.is_onboarded
      ORDER BY u.created_at DESC
      LIMIT 10
    `;

    if (allUsersRoles.length === 0) {
      console.log('❌ No users found');
    } else {
      console.log(`✅ Showing last ${allUsersRoles.length} users:\n`);
      allUsersRoles.forEach((user, index) => {
        const roles = user.roles.filter(r => r !== null).join(', ') || 'No roles';
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Roles: ${roles}`);
        console.log(`   Onboarded: ${user.is_onboarded ? 'Yes' : 'No'}`);
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

checkStudentRoleUsers().catch(console.error);
