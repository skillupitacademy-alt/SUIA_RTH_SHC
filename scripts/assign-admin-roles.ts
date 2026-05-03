/**
 * Assign Admin Roles to Test Users
 * =================================
 * Grants admin role to test users in both brands
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function assignAdminRoles() {
  console.log('🔧 Assigning admin roles to test users...\n');

  // RTH Database - ajayshah@gmail.com
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 RealTutorialHub Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const rthPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    // Check if admin role exists
    const roleCheck = await rthPool.query(`
      SELECT id, name FROM roles WHERE name = 'admin';
    `);

    if (roleCheck.rows.length === 0) {
      console.log('❌ Admin role not found in roles table');
      console.log('   Creating admin role...\n');
      
      const createRole = await rthPool.query(`
        INSERT INTO roles (name, description)
        VALUES ('admin', 'Administrator with full access')
        RETURNING id, name;
      `);
      
      console.log(`✅ Created admin role: ${createRole.rows[0].id}\n`);
    } else {
      console.log(`✅ Admin role exists: ${roleCheck.rows[0].id}\n`);
    }

    // Assign admin role to ajayshah@gmail.com
    const result = await rthPool.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id 
      FROM users u, roles r
      WHERE u.email = 'ajayshah@gmail.com' AND r.name = 'admin'
      ON CONFLICT DO NOTHING
      RETURNING user_id, role_id;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Assigned admin role to ajayshah@gmail.com');
      console.log(`   User ID: ${result.rows[0].user_id}`);
      console.log(`   Role ID: ${result.rows[0].role_id}\n`);
    } else {
      console.log('ℹ️  Admin role already assigned to ajayshah@gmail.com\n');
    }
  } catch (error) {
    console.log('❌ Error with RTH database:', error);
  } finally {
    await rthPool.end();
  }

  // SkillUp Database - student@skillupitacademy.com
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 SkillUp Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_SKILLUP,
  });

  try {
    // Check if admin role exists
    const roleCheck = await skillupPool.query(`
      SELECT id, name FROM roles WHERE name = 'admin';
    `);

    if (roleCheck.rows.length === 0) {
      console.log('❌ Admin role not found in roles table');
      console.log('   Creating admin role...\n');
      
      const createRole = await skillupPool.query(`
        INSERT INTO roles (name, description)
        VALUES ('admin', 'Administrator with full access')
        RETURNING id, name;
      `);
      
      console.log(`✅ Created admin role: ${createRole.rows[0].id}\n`);
    } else {
      console.log(`✅ Admin role exists: ${roleCheck.rows[0].id}\n`);
    }

    // Assign admin role to student@skillupitacademy.com
    const result = await skillupPool.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id 
      FROM users u, roles r
      WHERE u.email = 'student@skillupitacademy.com' AND r.name = 'admin'
      ON CONFLICT DO NOTHING
      RETURNING user_id, role_id;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Assigned admin role to student@skillupitacademy.com');
      console.log(`   User ID: ${result.rows[0].user_id}`);
      console.log(`   Role ID: ${result.rows[0].role_id}\n`);
    } else {
      console.log('ℹ️  Admin role already assigned to student@skillupitacademy.com\n');
    }
  } catch (error) {
    console.log('❌ Error with SkillUp database:', error);
  } finally {
    await skillupPool.end();
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Admin role assignment complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  RTH: ajayshah@gmail.com / testing');
  console.log('  SkillUp: student@skillupitacademy.com / testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

assignAdminRoles();
