/**
 * Verification script for student role migration
 * Checks if migration was successful
 * Usage: node scripts/verify-student-role-migration.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function verifyMigration() {
  console.log('🔍 Verifying Student Role Migration');
  console.log('===================================\n');
  
  if (!process.env.DATABASE_URL_SKILLUP) {
    console.error('❌ DATABASE_URL_SKILLUP not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_SKILLUP);

    // Check all users and their roles
    console.log('📊 All Users and Their Roles:\n');
    const allUsers = await sql`
      SELECT 
        u.id,
        u.email,
        u.email_verified,
        u.is_onboarded,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object('role', r.name)
            ORDER BY r.name
          ) FILTER (WHERE r.name IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email NOT LIKE 'audit-%'  -- Exclude test accounts
        AND u.email NOT LIKE 'flow-%'   -- Exclude test accounts
      GROUP BY u.id, u.email, u.email_verified, u.is_onboarded, u.created_at
      ORDER BY u.created_at DESC
      LIMIT 10
    `;

    if (allUsers.length === 0) {
      console.log('❌ No users found');
    } else {
      allUsers.forEach((user, index) => {
        const roleNames = user.roles.map(r => r.role).filter(Boolean);
        const rolesDisplay = roleNames.length > 0 ? roleNames.join(', ') : '❌ NO ROLES';
        const hasStudentRole = roleNames.includes('student');
        const hasUserRole = roleNames.includes('user');
        
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Roles: ${rolesDisplay}`);
        console.log(`   Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
        console.log(`   Onboarded: ${user.is_onboarded ? 'Yes' : 'No'}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
        
        // Status indicators
        if (hasStudentRole && !hasUserRole) {
          console.log(`   ✅ Status: Migrated (student role only)`);
        } else if (hasStudentRole && hasUserRole) {
          console.log(`   ⚠️ Status: Has both roles (will be unified to student in code)`);
        } else if (hasUserRole && !hasStudentRole) {
          console.log(`   ⚠️ Status: Legacy (user role only - will be unified to student in code)`);
        } else if (roleNames.length === 0) {
          console.log(`   ❌ Status: NO ROLES - Cannot access protected routes`);
        }
        console.log('');
      });
    }

    // Statistics
    console.log('\n📊 Statistics:\n');
    
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE 
          WHEN r.name = 'student' THEN u.id 
        END) as users_with_student,
        COUNT(DISTINCT CASE 
          WHEN r.name = 'user' THEN u.id 
        END) as users_with_user,
        COUNT(DISTINCT CASE 
          WHEN ur.role_id IS NULL THEN u.id 
        END) as users_without_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email NOT LIKE 'audit-%'
        AND u.email NOT LIKE 'flow-%'
    `;

    const stat = stats[0];
    console.log(`Total Users: ${stat.total_users}`);
    console.log(`Users with "student" role: ${stat.users_with_student} ✅`);
    console.log(`Users with "user" role: ${stat.users_with_user} ⚠️ (will be unified)`);
    console.log(`Users without roles: ${stat.users_without_roles} ❌ (cannot access protected routes)`);

    // Migration status
    console.log('\n📋 Migration Status:\n');
    
    const allHaveRoles = parseInt(stat.users_without_roles) === 0;
    const mostUseStudent = parseInt(stat.users_with_student) >= parseInt(stat.users_with_user);
    
    if (allHaveRoles) {
      console.log('✅ All users have roles assigned');
    } else {
      console.log(`⚠️ ${stat.users_without_roles} user(s) without roles need attention`);
    }
    
    if (mostUseStudent) {
      console.log('✅ Majority using "student" role - migration on track');
    } else {
      console.log('⚠️ More users have "user" role - consider database migration');
    }

    // Key users check
    console.log('\n📋 Key Users Status:\n');
    
    const keyUsers = ['anujoshi@gmail.com', 'yashicajoshi@gmail.com', 'student@skillupitacademy.com'];
    
    for (const email of keyUsers) {
      const userRoles = await sql`
        SELECT 
          u.email,
          u.is_onboarded,
          COALESCE(
            array_agg(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL),
            ARRAY[]::text[]
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE LOWER(u.email) = LOWER(${email})
        GROUP BY u.email, u.is_onboarded
      `;

      if (userRoles.length > 0) {
        const user = userRoles[0];
        const roleList = user.roles.length > 0 ? user.roles.join(', ') : 'NO ROLES';
        const hasStudentRole = user.roles.includes('student');
        const status = hasStudentRole ? '✅' : '❌';
        
        console.log(`${status} ${user.email}`);
        console.log(`   Roles: ${roleList}`);
        console.log(`   Onboarded: ${user.is_onboarded ? 'Yes' : 'No'}`);
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
      }
    }

    // Final verdict
    console.log('\n🎯 Final Verdict:\n');
    
    const hasYashicaRole = await sql`
      SELECT COUNT(*) as count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = 'yashicajoshi@gmail.com'
        AND LOWER(r.name) = 'student'
    `;
    
    const yashicaFixed = parseInt(hasYashicaRole[0].count) > 0;
    
    if (yashicaFixed && allHaveRoles) {
      console.log('✅ MIGRATION SUCCESSFUL!');
      console.log('   - yashicajoshi@gmail.com has "student" role');
      console.log('   - All users have at least one role');
      console.log('   - Ready for testing');
    } else {
      console.log('⚠️ MIGRATION INCOMPLETE');
      if (!yashicaFixed) {
        console.log('   - yashicajoshi@gmail.com missing "student" role');
      }
      if (!allHaveRoles) {
        console.log(`   - ${stat.users_without_roles} user(s) without roles`);
      }
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyMigration().catch(console.error);
