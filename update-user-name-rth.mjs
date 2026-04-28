/**
 * Script to update user name in RTH database
 * Usage: node update-user-name-rth.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

async function updateUserName() {
  const email = 'ajayshah@gmail.com';
  const newName = 'Ajay';
  
  console.log('🔄 Updating user name in RTH database...');
  console.log('📧 Email:', email);
  console.log('📝 New Name:', newName);
  
  if (!process.env.DATABASE_URL_RTH) {
    console.error('❌ DATABASE_URL_RTH not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_RTH);

    // First, get the user ID
    console.log('\n📋 Finding user...');
    const usersResult = await sql`
      SELECT id, email
      FROM users 
      WHERE email = ${email}
    `;

    if (usersResult.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = usersResult[0];
    console.log('✅ User found:', user.id);

    // Update user_profiles table
    console.log('\n🔄 Updating user_profiles table...');
    const updateResult = await sql`
      UPDATE user_profiles 
      SET 
        name = ${newName},
        updated_at = NOW()
      WHERE user_id = ${user.id}
      RETURNING id, name, updated_at
    `;

    if (updateResult.length === 0) {
      console.log('❌ No profile found to update');
      return;
    }

    console.log('✅ Profile updated successfully:');
    console.log(JSON.stringify(updateResult[0], null, 2));

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const verifyResult = await sql`
      SELECT 
        id,
        user_id,
        name,
        education_level,
        professional_status,
        updated_at
      FROM user_profiles 
      WHERE user_id = ${user.id}
    `;

    console.log('✅ Current profile data:');
    console.log(JSON.stringify(verifyResult[0], null, 2));

    console.log('\n✅ Update complete! The dashboard will now show "Ajay" instead of "RBAC_DIAGNOSTIC_TEST_1777103404117"');

  } catch (error) {
    console.error('❌ Error updating database:', error);
  }
}

updateUserName().catch(console.error);
