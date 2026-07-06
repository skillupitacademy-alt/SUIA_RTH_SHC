/**
 * Script to assign "student" role to yashicajoshi@gmail.com
 * Usage: node scripts/assign-student-role-yashica.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function assignStudentRole() {
  const email = 'yashicajoshi@gmail.com';
  
  console.log(`🔍 Assigning "student" role to ${email} in SkillUp database`);
  
  if (!process.env.DATABASE_URL_SKILLUP) {
    console.error('❌ DATABASE_URL_SKILLUP not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_SKILLUP);

    // Find the user
    console.log('\n📋 Step 1: Finding user...');
    const users = await sql`
      SELECT id, email, email_verified, is_onboarded, created_at
      FROM users
      WHERE LOWER(email) = LOWER(${email})
    `;

    if (users.length === 0) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ User found:`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
    console.log(`   Onboarded: ${user.is_onboarded ? 'Yes' : 'No'}`);

    // Find the student role
    console.log('\n📋 Step 2: Finding "student" role...');
    const roles = await sql`
      SELECT id, name
      FROM roles
      WHERE LOWER(name) = 'student'
    `;

    if (roles.length === 0) {
      console.error('❌ "student" role not found in database');
      console.log('\n📋 Available roles:');
      const allRoles = await sql`SELECT id, name FROM roles ORDER BY name`;
      allRoles.forEach(role => {
        console.log(`   - ${role.name} (ID: ${role.id})`);
      });
      process.exit(1);
    }

    const studentRole = roles[0];
    console.log(`✅ "student" role found (ID: ${studentRole.id})`);

    // Check if user already has this role
    console.log('\n📋 Step 3: Checking existing roles...');
    const existingRoles = await sql`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${user.id}
    `;

    if (existingRoles.length > 0) {
      console.log(`⚠️ User already has ${existingRoles.length} role(s):`);
      existingRoles.forEach(role => {
        console.log(`   - ${role.name}`);
      });
      
      const hasStudentRole = existingRoles.some(r => r.name.toLowerCase() === 'student');
      if (hasStudentRole) {
        console.log('\n✅ User already has "student" role. Nothing to do!');
        return;
      }
    } else {
      console.log('   No existing roles found');
    }

    // Assign the student role
    console.log('\n📋 Step 4: Assigning "student" role...');
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${user.id}, ${studentRole.id})
    `;

    console.log('✅ "student" role assigned successfully!');

    // Verify the assignment
    console.log('\n📋 Step 5: Verifying assignment...');
    const verifyRoles = await sql`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${user.id}
      ORDER BY r.name
    `;

    console.log(`✅ User now has ${verifyRoles.length} role(s):`);
    verifyRoles.forEach(role => {
      console.log(`   - ${role.name}`);
    });

    console.log('\n✅ Done! User can now access protected routes.');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. User should clear browser cookies`);
    console.log(`   2. Login at https://user.skillupitacademy.com/login`);
    console.log(`   3. Should redirect to /onboarding (if not completed)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

assignStudentRole().catch(console.error);
