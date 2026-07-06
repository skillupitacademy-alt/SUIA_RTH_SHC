/**
 * Check what roles exist in RTH database
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkRoles() {
  console.log('🔍 Checking roles in RTH database\n');
  
  const sql = neon(process.env.DATABASE_URL_RTH);
  
  const roles = await sql`SELECT id, name FROM roles ORDER BY name`;
  
  console.log('Available roles:');
  roles.forEach(r => {
    console.log(`  - ${r.name} (ID: ${r.id})`);
  });
  
  console.log('\n🔍 Checking what the signup code is looking for:\n');
  console.log('Signup code tries to assign: "student" (after our changes)');
  console.log('Previously tried to assign: "USER" (uppercase)');
  
  const hasStudent = roles.some(r => r.name.toLowerCase() === 'student');
  const hasUser = roles.some(r => r.name.toLowerCase() === 'user');
  const hasUSER = roles.some(r => r.name === 'USER');
  
  console.log('\n📋 Role existence check:');
  console.log(`  "student" exists: ${hasStudent ? '✅ YES' : '❌ NO'}`);
  console.log(`  "user" exists: ${hasUser ? '✅ YES' : '❌ NO'}`);
  console.log(`  "USER" exists: ${hasUSER ? '✅ YES' : '❌ NO'}`);
  
  if (!hasStudent) {
    console.log('\n⚠️ WARNING: "student" role does not exist in database!');
    console.log('   This is why assignRole fails during signup.');
  }
}

checkRoles().catch(console.error);
