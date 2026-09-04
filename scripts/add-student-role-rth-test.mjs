/**
 * Add student role to RTH test account (ajayshah@gmail.com)
 * 
 * Issue: RTH test account has only 'user' role, but tutorial endpoints require 'student'
 * Solution: Update user's roles array to include 'student'
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const RTH_TEST_EMAIL = 'ajayshah@gmail.com';

async function addStudentRole() {
  console.log('🔧 Adding student role to RTH test account\n');
  
  if (!process.env.DATABASE_URL_PEOPLE) {
    console.error('❌ DATABASE_URL_PEOPLE not configured');
    process.exit(1);
  }
  
  const sqlClient = neon(process.env.DATABASE_URL_PEOPLE);
  const db = drizzle(sqlClient);
  
  // Check current state
  console.log(`📋 Checking current state for: ${RTH_TEST_EMAIL}`);
  const beforeResult = await db.execute(sql`
    SELECT id, email, role 
    FROM users 
    WHERE email = ${RTH_TEST_EMAIL}
  `);
  
  if (beforeResult.rows.length === 0) {
    console.error(`❌ User not found: ${RTH_TEST_EMAIL}`);
    process.exit(1);
  }
  
  const user = beforeResult.rows[0];
  console.log(`✅ User found: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Current role: ${user.role}\n`);
  
  // Check if already student
  if (user.role === 'student') {
    console.log('✅ User already has student role - nothing to do!');
    return;
  }
  
  // Update to student role
  console.log(`🔄 Changing role from '${user.role}' to 'student'...`);
  await db.execute(sql`
    UPDATE users 
    SET role = 'student'
    WHERE email = ${RTH_TEST_EMAIL}
  `);
  
  // Verify update
  console.log('✅ Role updated! Verifying...\n');
  const afterResult = await db.execute(sql`
    SELECT id, email, role 
    FROM users 
    WHERE email = ${RTH_TEST_EMAIL}
  `);
  
  const updatedUser = afterResult.rows[0];
  console.log(`📋 Updated role for: ${updatedUser.email}`);
  console.log(`   Role: ${updatedUser.role}`);
  
  if (updatedUser.role === 'student') {
    console.log('\n✅✅✅ SUCCESS! Role changed to student');
    console.log('\nℹ️  RTH test account can now access tutorial endpoints');
    console.log('ℹ️  Restart dev servers if needed to clear any cached auth');
  } else {
    console.error('\n❌ FAILED! Role is not student after update');
    process.exit(1);
  }
}

addStudentRole().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
