/**
 * Comprehensive verification that role fix is complete
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const REQUIRED_ROLES = ['student', 'admin', 'super_admin', 'faculty', 'infrastructure'];

async function verifyDatabase(dbUrl, dbName) {
  console.log(`\n📋 Verifying ${dbName} Database`);
  console.log('='.repeat(50));
  
  const sql = neon(dbUrl);
  
  // Get all roles
  const roles = await sql`SELECT id, name FROM roles ORDER BY name`;
  
  console.log(`\nRoles in database (${roles.length} total):`);
  roles.forEach(r => {
    const isRequired = REQUIRED_ROLES.includes(r.name);
    console.log(`  ${isRequired ? '✅' : '  '} ${r.name} (ID: ${r.id})`);
  });
  
  // Check for required roles
  const existingRoleNames = roles.map(r => r.name);
  const missingRoles = REQUIRED_ROLES.filter(r => !existingRoleNames.includes(r));
  const extraRoles = existingRoleNames.filter(r => !REQUIRED_ROLES.includes(r) && r !== 'user');
  
  console.log('\n📊 Analysis:');
  
  if (missingRoles.length > 0) {
    console.log(`  ❌ Missing required roles: ${missingRoles.join(', ')}`);
    return false;
  } else {
    console.log(`  ✅ All ${REQUIRED_ROLES.length} required roles present`);
  }
  
  if (existingRoleNames.includes('student')) {
    console.log('  ✅ "student" role exists (signup will work)');
  } else {
    console.log('  ❌ "student" role missing (signup will fail!)');
    return false;
  }
  
  if (existingRoleNames.includes('user')) {
    console.log('  ℹ️  "user" role exists (for backwards compatibility)');
  }
  
  if (extraRoles.length > 0) {
    console.log(`  ℹ️  Extra roles found: ${extraRoles.join(', ')}`);
  }
  
  // Check for case sensitivity issues
  const duplicateCheck = new Map();
  roles.forEach(r => {
    const lower = r.name.toLowerCase();
    if (duplicateCheck.has(lower)) {
      console.log(`  ⚠️  Potential case issue: "${duplicateCheck.get(lower)}" and "${r.name}"`);
    } else {
      duplicateCheck.set(lower, r.name);
    }
  });
  
  return missingRoles.length === 0;
}

async function main() {
  console.log('🔍 ROLE FIX VERIFICATION');
  console.log('==================================================');
  console.log('Checking if databases have all required roles for signup to work');
  
  let allGood = true;
  
  // Verify RTH
  const rthOk = await verifyDatabase(process.env.DATABASE_URL_RTH, 'RTH');
  allGood = allGood && rthOk;
  
  // Verify SkillUp
  const skillupOk = await verifyDatabase(process.env.DATABASE_URL_SKILLUP, 'SkillUp');
  allGood = allGood && skillupOk;
  
  // Final verdict
  console.log('\n' + '='.repeat(50));
  console.log('🎯 FINAL VERDICT:');
  console.log('='.repeat(50));
  
  if (allGood) {
    console.log('✅ Both databases are correctly configured');
    console.log('✅ Signup should work for both RTH and SkillUp brands');
    console.log('\n📝 Next steps:');
    console.log('   1. Commit these changes');
    console.log('   2. Deploy to VPS via Codex');
    console.log('   3. Test signup on both brands');
    process.exit(0);
  } else {
    console.log('❌ Database configuration issues detected');
    console.log('❌ Signup will fail until roles are fixed');
    console.log('\n🔧 To fix, run: node scripts/fix-missing-roles.mjs');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
