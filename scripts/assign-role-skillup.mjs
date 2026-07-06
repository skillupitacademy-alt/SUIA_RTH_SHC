/**
 * Script to assign user/student role to anujoshi@gmail.com in SkillUp database
 * Usage: node scripts/assign-role-skillup.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function assignRole() {
  const email = 'anujoshi@gmail.com';
  
  console.log('🔍 Assigning role in SkillUp database for user:', email);
  console.log('📊 Database URL:', process.env.DATABASE_URL_SKILLUP ? 'Found' : 'NOT FOUND');
  
  if (!process.env.DATABASE_URL_SKILLUP) {
    console.error('❌ DATABASE_URL_SKILLUP not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_SKILLUP);

    // 1. Find user
    console.log('\n📋 Step 1: Finding user...');
    const userResult = await sql`
      SELECT id, email 
      FROM users 
      WHERE email = ${email}
    `;

    if (userResult.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const user = userResult[0];
    console.log('✅ User found:', user.email, 'ID:', user.id);

    // 2. Find role
    console.log('\n📋 Step 2: Finding user/student role...');
    const roleResult = await sql`
      SELECT id, name 
      FROM roles 
      WHERE LOWER(name) IN ('user', 'student')
      ORDER BY CASE WHEN LOWER(name) = 'user' THEN 1 ELSE 2 END
      LIMIT 1
    `;

    if (roleResult.length === 0) {
      console.log('❌ No user/student role found in database');
      process.exit(1);
    }

    const role = roleResult[0];
    console.log('✅ Role found:', role.name, 'ID:', role.id);

    // 3. Check if already assigned
    console.log('\n📋 Step 3: Checking if role already assigned...');
    const existingResult = await sql`
      SELECT user_id, role_id 
      FROM user_roles 
      WHERE user_id = ${user.id} AND role_id = ${role.id}
    `;

    if (existingResult.length > 0) {
      console.log('✅ Role already assigned');
    } else {
      // 4. Assign role
      console.log('\n📋 Step 4: Assigning role...');
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${user.id}, ${role.id})
      `;
      console.log('✅✅✅ Role assigned successfully!');
    }

    // 5. Verify
    console.log('\n📋 Step 5: Verifying role assignment...');
    const verifyResult = await sql`
      SELECT 
        u.email,
        u.id as user_id,
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = ${email}
    `;

    if (verifyResult.length === 0) {
      console.log('❌ Verification failed: No roles found for user');
    } else {
      console.log('✅ Verification successful! User roles:');
      console.log(JSON.stringify(verifyResult, null, 2));
    }

    console.log('\n✅ Role assignment complete!');
    console.log('\n📝 Next step: Test login at https://user.skillupitacademy.com/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

assignRole().catch(console.error);
