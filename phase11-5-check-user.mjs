/**
 * PHASE 11.5: CHECK USER EXISTENCE IN DATABASES
 * READ-ONLY FORENSIC INVESTIGATION
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: 'apps/api-server/.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const TEST_EMAIL = 'student@skillupitacademy.com';

console.log('═══════════════════════════════════════════════════════════');
console.log('PHASE 11.5: USER EXISTENCE FORENSIC');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Target email: ${TEST_EMAIL}\n`);

// Mask sensitive connection strings
function maskConnectionString(url) {
  if (!url) return 'MISSING';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host.substring(0, 10)}.../${parsed.pathname.substring(1, 8)}...`;
  } catch {
    return 'INVALID';
  }
}

async function checkDatabase(label, envVar) {
  const connectionString = process.env[envVar];
  
  console.log(`\n${label}:`);
  console.log(`  Environment Variable: ${envVar}`);
  console.log(`  Connection: ${maskConnectionString(connectionString)}`);
  
  if (!connectionString) {
    console.log(`  Status: NOT CONFIGURED`);
    return null;
  }
  
  try {
    const pool = new Pool({ connectionString });
    
    const result = await pool.query(`
      SELECT 
        id,
        email,
        email_verified,
        is_blocked,
        deleted_at,
        created_at,
        shadow_user_id
      FROM users
      WHERE email = $1
    `, [TEST_EMAIL]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`  Status: USER FOUND ✅`);
      console.log(`  User ID: ${user.id}`);
      console.log(`  Email Verified: ${user.email_verified}`);
      console.log(`  Is Blocked: ${user.is_blocked}`);
      console.log(`  Deleted: ${user.deleted_at ? 'YES' : 'NO'}`);
      console.log(`  Shadow User ID: ${user.shadow_user_id || 'NONE'}`);
      console.log(`  Created: ${user.created_at}`);
    } else {
      console.log(`  Status: USER NOT FOUND ❌`);
    }
    
    await pool.end();
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.log(`  Status: ERROR`);
    console.log(`  Error: ${error.message}`);
    return null;
  }
}

try {
  // Check all three brand databases
  const skillupUser = await checkDatabase('SkillUp Database', 'DATABASE_URL_SKILLUP');
  const rthUser = await checkDatabase('RealTutorialHub Database', 'DATABASE_URL_RTH');
  const defaultUser = await checkDatabase('Default/People Database', 'DATABASE_URL');
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FORENSIC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Test Email: ${TEST_EMAIL}\n`);
  
  console.log('Database Presence:');
  console.log(`  SkillUp DB:        ${skillupUser ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
  console.log(`  RTH DB:            ${rthUser ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
  console.log(`  Default/People DB: ${defaultUser ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
  
  console.log('\nBrand Resolution Logic:');
  console.log('  Request from 127.0.0.1 → No explicit brand header');
  console.log('  Gateway logs show: resolvedBrand = "realtutorialhub"');
  console.log('  Therefore API server queries RTH DB, not SkillUp DB');
  
  if (!rthUser && skillupUser) {
    console.log('\n⚠️  ROOT CAUSE IDENTIFIED:');
    console.log('  User exists in SkillUp DB but API is querying RTH DB');
    console.log('  Brand resolution defaulting to "realtutorialhub"');
  } else if (!skillupUser && !rthUser && !defaultUser) {
    console.log('\n⚠️  ROOT CAUSE IDENTIFIED:');
    console.log('  Test user does not exist in ANY database');
  } else if (rthUser) {
    console.log('\n✅ User found in RTH DB - authentication should work');
  }
  
} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
}
