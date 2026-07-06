/**
 * Fix missing roles in both RTH and SkillUp databases
 * 
 * This ensures both databases have all required roles:
 * - student
 * - admin
 * - super_admin
 * - faculty
 * - infrastructure
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const REQUIRED_ROLES = ['student', 'admin', 'super_admin', 'faculty', 'infrastructure'];

async function fixRoles(dbUrl, dbName) {
  console.log(`\n🔧 Fixing roles in ${dbName} database\n`);
  
  const sql = neon(dbUrl);
  
  // Get existing roles
  const existingRoles = await sql`SELECT id, name FROM roles ORDER BY name`;
  const existingRoleNames = existingRoles.map(r => r.name);
  
  console.log('Existing roles:');
  existingRoles.forEach(r => {
    console.log(`  ✓ ${r.name} (ID: ${r.id})`);
  });
  
  // Find missing roles
  const missingRoles = REQUIRED_ROLES.filter(r => !existingRoleNames.includes(r));
  
  if (missingRoles.length === 0) {
    console.log('\n✅ All required roles exist!');
    return;
  }
  
  console.log('\n⚠️  Missing roles:', missingRoles.join(', '));
  console.log('\n➕ Adding missing roles...\n');
  
  // Add missing roles
  for (const roleName of missingRoles) {
    try {
      await sql`INSERT INTO roles (name) VALUES (${roleName})`;
      console.log(`  ✓ Added role: ${roleName}`);
    } catch (error) {
      console.error(`  ✗ Failed to add role ${roleName}:`, error.message);
    }
  }
  
  // Verify
  const updatedRoles = await sql`SELECT id, name FROM roles ORDER BY name`;
  console.log('\n✅ Updated roles:');
  updatedRoles.forEach(r => {
    const isNew = missingRoles.includes(r.name);
    console.log(`  ${isNew ? '🆕' : '  '} ${r.name} (ID: ${r.id})`);
  });
}

async function main() {
  console.log('🚀 Starting role fix for both databases...');
  
  // Fix RTH database
  await fixRoles(process.env.DATABASE_URL_RTH, 'RTH');
  
  // Fix SkillUp database
  await fixRoles(process.env.DATABASE_URL_SKILLUP, 'SkillUp');
  
  console.log('\n✅ Role fix complete for both databases!');
  console.log('\n📝 Summary:');
  console.log('   - Both databases now have all required roles: student, admin, super_admin, faculty, infrastructure');
  console.log('   - Signup should now work correctly for both brands');
}

main().catch(console.error);
