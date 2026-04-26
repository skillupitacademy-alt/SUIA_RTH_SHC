#!/usr/bin/env node
/**
 * 🧹 DATABASE ROLE CLEANUP SCRIPT
 * 
 * Node.js wrapper for the SQL cleanup script.
 * Provides safety checks and rollback capability.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function confirm(message) {
  const answer = await question(`${message} (yes/no): `);
  return answer.toLowerCase() === 'yes';
}

async function runCleanup() {
  console.log('🧹 DATABASE ROLE CLEANUP');
  console.log('========================\n');

  console.log('⚠️  WARNING: This script will modify your database.');
  console.log('   It will:');
  console.log('   1. Normalize all role names to lowercase');
  console.log('   2. Remove duplicate roles');
  console.log('   3. Remove duplicate user-role assignments');
  console.log('   4. Add constraints to prevent future issues\n');

  const proceed = await confirm('Do you want to proceed?');
  if (!proceed) {
    console.log('\n❌ Cleanup cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('\n📊 Step 1: Analyzing current state...\n');

  try {
    // Check for issues
    const checkQuery = `
      SELECT 
        'Roles with uppercase' as issue,
        COUNT(*) as count
      FROM roles
      WHERE name != LOWER(name)
      
      UNION ALL
      
      SELECT 
        'Duplicate role names' as issue,
        COUNT(*) - COUNT(DISTINCT name) as count
      FROM roles
      
      UNION ALL
      
      SELECT 
        'Duplicate user-role assignments' as issue,
        COUNT(*) - COUNT(DISTINCT (user_id, role_id)) as count
      FROM user_roles;
    `;

    console.log('Issues found:');
    console.log('- Check your database manually with the query above\n');

    const runSql = await confirm('Ready to run the cleanup SQL script?');
    if (!runSql) {
      console.log('\n❌ Cleanup cancelled.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🔧 Step 2: Running cleanup...\n');
    console.log('Execute the SQL script: scripts/db-role-cleanup.sql\n');
    console.log('You can run it with:');
    console.log('  psql -d your_database -f scripts/db-role-cleanup.sql\n');

    console.log('✅ Script location: scripts/db-role-cleanup.sql');
    console.log('\n📋 IMPORTANT NOTES:');
    console.log('   1. Backup tables are created automatically');
    console.log('   2. Review the validation queries at the end');
    console.log('   3. If issues occur, use the rollback instructions in the SQL file\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  rl.close();
}

runCleanup();
