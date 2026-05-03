/**
 * Check Admin Credentials
 * ========================
 * Verifies admin users exist in both brand databases
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAdminCredentials() {
  console.log('[CHECK] Checking admin credentials in both brands...\n');

  // RTH Database - ajayshah@gmail.com
  console.log('================================================================');
  console.log('RealTutorialHub Database (rth_prod)');
  console.log('================================================================\n');
  
  const rthPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check for ajayshah@gmail.com
    const userResult = await rthPool.query(`
      SELECT 
        u.id,
        u.email,
        u.email_verified,
        u.created_at,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'ajayshah@gmail.com'
      GROUP BY u.id, u.email, u.email_verified, u.created_at;
    `);

    if (userResult.rows.length === 0) {
      console.log('[FAIL] User ajayshah@gmail.com NOT FOUND in RTH database');
      console.log('   Need to create this user first\n');
    } else {
      const user = userResult.rows[0];
      console.log('[PASS] User found: ajayshah@gmail.com');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Roles: ${user.roles.filter((r: string | null) => r !== null).join(', ') || 'none'}`);
      console.log(`   Created: ${user.created_at}\n`);
      
      if (!user.roles.includes('admin')) {
        console.log('[WARNING] User does NOT have admin role\n');
      } else {
        console.log('[PASS] User has admin role\n');
      }
    }
  } catch (error) {
    console.log('[FAIL] Error querying RTH database:', error);
  } finally {
    await rthPool.end();
  }

  // SkillUp Database - student@skillupitacademy.com
  console.log('================================================================');
  console.log('SkillUp Database (skillup_prod)');
  console.log('================================================================\n');
  
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_SKILLUP,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check for student@skillupitacademy.com
    const userResult = await skillupPool.query(`
      SELECT 
        u.id,
        u.email,
        u.email_verified,
        u.created_at,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'student@skillupitacademy.com'
      GROUP BY u.id, u.email, u.email_verified, u.created_at;
    `);

    if (userResult.rows.length === 0) {
      console.log('[FAIL] User student@skillupitacademy.com NOT FOUND in SkillUp database');
      console.log('   Need to create this user first\n');
    } else {
      const user = userResult.rows[0];
      console.log('[PASS] User found: student@skillupitacademy.com');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Roles: ${user.roles.filter((r: string | null) => r !== null).join(', ') || 'none'}`);
      console.log(`   Created: ${user.created_at}\n`);
      
      if (!user.roles.includes('admin')) {
        console.log('[WARNING] User does NOT have admin role\n');
      } else {
        console.log('[PASS] User has admin role\n');
      }
    }
  } catch (error) {
    console.log('[FAIL] Error querying SkillUp database:', error);
  } finally {
    await skillupPool.end();
  }

  console.log('================================================================');
  console.log('Summary');
  console.log('================================================================');
  console.log('If users are missing, run: npx tsx scripts/create-admin-users.ts');
  console.log('If roles are missing, run: npx tsx scripts/assign-admin-roles.ts');
  console.log('================================================================');
}

checkAdminCredentials();
