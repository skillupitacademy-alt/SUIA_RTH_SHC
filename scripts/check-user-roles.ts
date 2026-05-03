/**
 * Check User Roles
 * ================
 * Check if test users have admin roles assigned
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkUserRoles() {
  console.log('🔍 Checking user roles for test accounts...\n');

  const testEmails = [
    'ajayshah@gmail.com',
    'student@skillupitacademy.com',
  ];

  // RTH Database
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 RealTutorialHub Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const rthPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    for (const email of testEmails) {
      const result = await rthPool.query(`
        SELECT 
          u.id,
          u.email,
          r.name as role_name,
          r.id as role_id
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1;
      `, [email]);

      if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}\n`);
      } else {
        console.log(`✅ User: ${email}`);
        console.log(`   ID: ${result.rows[0].id}`);
        if (result.rows[0].role_name) {
          console.log(`   Roles:`);
          result.rows.forEach(row => {
            if (row.role_name) {
              console.log(`     - ${row.role_name} (${row.role_id})`);
            }
          });
        } else {
          console.log(`   Roles: None assigned`);
        }
        console.log('');
      }
    }
  } catch (error) {
    console.log('❌ Error querying RTH database:', error);
  } finally {
    await rthPool.end();
  }

  // SkillUp Database
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 SkillUp Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_SKILLUP,
  });

  try {
    for (const email of testEmails) {
      const result = await skillupPool.query(`
        SELECT 
          u.id,
          u.email,
          r.name as role_name,
          r.id as role_id
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1;
      `, [email]);

      if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}\n`);
      } else {
        console.log(`✅ User: ${email}`);
        console.log(`   ID: ${result.rows[0].id}`);
        if (result.rows[0].role_name) {
          console.log(`   Roles:`);
          result.rows.forEach(row => {
            if (row.role_name) {
              console.log(`     - ${row.role_name} (${row.role_id})`);
            }
          });
        } else {
          console.log(`   Roles: None assigned`);
        }
        console.log('');
      }
    }
  } catch (error) {
    console.log('❌ Error querying SkillUp database:', error);
  } finally {
    await skillupPool.end();
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 To assign admin role, run:');
  console.log('   INSERT INTO user_roles (user_id, role_id)');
  console.log('   SELECT u.id, r.id FROM users u, roles r');
  console.log('   WHERE u.email = \'ajayshah@gmail.com\' AND r.name = \'admin\';');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkUserRoles();
