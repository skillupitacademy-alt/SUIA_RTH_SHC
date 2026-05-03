#!/usr/bin/env tsx
/**
 * Check All Admin Accounts in Both Brands
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkBrand(brandName: string, connectionString: string | undefined) {
  if (!connectionString) {
    console.log(`[ERROR] No connection string for ${brandName}`);
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${brandName} - Admin Accounts`);
    console.log('='.repeat(60));

    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.email_verified,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.email, u.email_verified
      HAVING array_agg(r.name) @> ARRAY['admin']
      ORDER BY u.email;
    `);

    if (result.rows.length === 0) {
      console.log('[WARNING] No admin users found!');
    } else {
      console.log(`\nFound ${result.rows.length} admin user(s):\n`);
      result.rows.forEach((user, index) => {
        const roles = user.roles.filter((r: string | null) => r !== null);
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Verified: ${user.email_verified}`);
        console.log(`   Roles: ${roles.join(', ')}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error(`[ERROR] ${brandName}:`, error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('Checking Admin Accounts in Both Brands');
  console.log('='.repeat(60));

  await checkBrand('RealTutorialHub', process.env.DATABASE_URL_RTH);
  await checkBrand('SkillUp IT Academy', process.env.DATABASE_URL_SKILLUP);

  console.log(`\n${'='.repeat(60)}`);
  console.log('RECOMMENDATION');
  console.log('='.repeat(60));
  console.log('\nFor deployment scripts, use:');
  console.log('  RTH Admin: admin@realtutorialhub.com / admin123');
  console.log('  SkillUp Admin: admin@skillupitacademy.com / admin123');
  console.log('\nFor user testing, use:');
  console.log('  RTH User: ajayshah@gmail.com / testing');
  console.log('  SkillUp User: student@skillupitacademy.com / testing');
  console.log('='.repeat(60));
}

main();
