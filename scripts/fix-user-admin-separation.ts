#!/usr/bin/env tsx
/**
 * Fix User-Admin Separation
 * ==========================
 * 
 * Problem: Regular users have admin role, causing cookie conflicts
 * Solution: 
 * 1. Remove admin role from regular users
 * 2. Create dedicated admin accounts
 * 
 * Regular Users (user role only):
 * - RTH: ajayshah@gmail.com
 * - SkillUp: student@skillupitacademy.com
 * 
 * Admin Users (admin role only):
 * - RTH: admin@realtutorialhub.com
 * - SkillUp: admin@skillupitacademy.com
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import * as crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const poolRTH = new Pool({
  connectionString: process.env.DATABASE_URL_RTH,
});

const poolSkillUp = new Pool({
  connectionString: process.env.DATABASE_URL_SKILLUP,
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function fixBrand(pool: Pool, brandName: string, regularUserEmail: string, adminEmail: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${brandName} - Fixing User-Admin Separation`);
  console.log('='.repeat(60));

  try {
    // Step 1: Check current state of regular user
    console.log(`\n[CHECK] Regular user: ${regularUserEmail}`);
    const regularUser = await pool.query(`
      SELECT 
        u.id,
        u.email,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.id, u.email
    `, [regularUserEmail]);

    if (regularUser.rows.length === 0) {
      console.log(`[ERROR] Regular user not found: ${regularUserEmail}`);
      return;
    }

    const user = regularUser.rows[0];
    const userRoles = user.roles.filter((r: string | null) => r !== null);
    console.log(`   ID: ${user.id}`);
    console.log(`   Current roles: ${userRoles.join(', ')}`);

    // Step 2: Remove admin role from regular user if present
    if (userRoles.includes('admin')) {
      console.log(`\n[FIX] Removing admin role from ${regularUserEmail}...`);
      
      // Get admin role ID
      const adminRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'admin'`);
      if (adminRoleResult.rows.length > 0) {
        const adminRoleId = adminRoleResult.rows[0].id;
        
        // Delete admin role assignment
        await pool.query(`
          DELETE FROM user_roles 
          WHERE user_id = $1 AND role_id = $2
        `, [user.id, adminRoleId]);
        
        console.log(`   [PASS] Admin role removed`);
      }
    } else {
      console.log(`   [PASS] User already has no admin role`);
    }

    // Step 3: Check if dedicated admin exists
    console.log(`\n[CHECK] Dedicated admin: ${adminEmail}`);
    const adminUser = await pool.query(`
      SELECT 
        u.id,
        u.email,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.id, u.email
    `, [adminEmail]);

    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      const adminRoles = admin.roles.filter((r: string | null) => r !== null);
      console.log(`   [EXISTS] Admin found`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Roles: ${adminRoles.join(', ')}`);
      
      // Ensure admin has admin role
      if (!adminRoles.includes('admin')) {
        console.log(`   [FIX] Adding admin role...`);
        const adminRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'admin'`);
        if (adminRoleResult.rows.length > 0) {
          const adminRoleId = adminRoleResult.rows[0].id;
          await pool.query(`
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [admin.id, adminRoleId]);
          console.log(`   [PASS] Admin role added`);
        }
      }
      
      // Remove user role if present
      if (adminRoles.includes('user')) {
        console.log(`   [FIX] Removing user role from admin...`);
        const userRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'user'`);
        if (userRoleResult.rows.length > 0) {
          const userRoleId = userRoleResult.rows[0].id;
          await pool.query(`
            DELETE FROM user_roles 
            WHERE user_id = $1 AND role_id = $2
          `, [admin.id, userRoleId]);
          console.log(`   [PASS] User role removed from admin`);
        }
      }
    } else {
      // Step 4: Create dedicated admin account
      console.log(`   [CREATE] Creating dedicated admin account...`);
      
      const adminId = crypto.randomUUID();
      const hashedPassword = hashPassword('admin123'); // Default password
      
      await pool.query(`
        INSERT INTO users (
          id, email, password_hash, email_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [adminId, adminEmail, hashedPassword, true]);
      
      // Add admin role
      const adminRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'admin'`);
      if (adminRoleResult.rows.length > 0) {
        const adminRoleId = adminRoleResult.rows[0].id;
        await pool.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [adminId, adminRoleId]);
      }
      
      console.log(`   [PASS] Admin account created`);
      console.log(`   ID: ${adminId}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: admin123`);
      console.log(`   Role: admin`);
    }

    // Step 5: Verify final state
    console.log(`\n[VERIFY] Final state:`);
    
    const finalRegularUser = await pool.query(`
      SELECT u.email, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.email
    `, [regularUserEmail]);
    const finalRegularRoles = finalRegularUser.rows[0].roles.filter((r: string | null) => r !== null);
    console.log(`   Regular user (${regularUserEmail}): ${finalRegularRoles.join(', ')}`);
    
    const finalAdminUser = await pool.query(`
      SELECT u.email, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.email
    `, [adminEmail]);
    const finalAdminRoles = finalAdminUser.rows[0].roles.filter((r: string | null) => r !== null);
    console.log(`   Admin user (${adminEmail}): ${finalAdminRoles.join(', ')}`);

    console.log(`\n[PASS] ${brandName} - User-Admin separation complete`);

  } catch (error) {
    console.error(`[ERROR] ${brandName} failed:`, error);
    throw error;
  }
}

async function main() {
  console.log('User-Admin Separation Fix');
  console.log('='.repeat(60));

  try {
    // Fix RTH
    await fixBrand(
      poolRTH,
      'RealTutorialHub',
      'ajayshah@gmail.com',
      'admin@realtutorialhub.com'
    );

    // Fix SkillUp
    await fixBrand(
      poolSkillUp,
      'SkillUp IT Academy',
      'student@skillupitacademy.com',
      'admin@skillupitacademy.com'
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('\n[PASS] User-Admin separation complete for both brands');
    console.log('\nRegular Users (user role only):');
    console.log('  RTH: ajayshah@gmail.com / testing');
    console.log('  SkillUp: student@skillupitacademy.com / testing');
    console.log('\nAdmin Users (admin role only):');
    console.log('  RTH: admin@realtutorialhub.com / admin123');
    console.log('  SkillUp: admin@skillupitacademy.com / admin123');
    console.log('\n[ACTION] Update deployment scripts to use admin accounts');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n[ERROR] Fix failed:', error);
    process.exit(1);
  } finally {
    await poolRTH.end();
    await poolSkillUp.end();
  }
}

main();
