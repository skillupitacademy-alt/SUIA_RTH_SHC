#!/usr/bin/env tsx
/**
 * Verify Admin Passwords
 * Checks if admin passwords match expected values and resets if needed
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyAndFixPasswords() {
  console.log('\n🔐 Verifying Admin Passwords\n');
  console.log('='.repeat(60));

  const expectedPassword = 'admin123';
  const admins = [
    { 
      email: 'admin@realtutorialhub.com', 
      dbUrl: process.env.DATABASE_URL_RTH!,
      brand: 'RealTutorialHub'
    },
    { 
      email: 'admin@skillupitacademy.com', 
      dbUrl: process.env.DATABASE_URL_SKILLUP!,
      brand: 'SkillUp IT Academy'
    },
  ];

  for (const admin of admins) {
    console.log(`\n📦 ${admin.brand}`);
    console.log('-'.repeat(60));
    console.log(`Email: ${admin.email}`);

    try {
      const sql = neon(admin.dbUrl);

      // Get user from database
      const users = await sql`
        SELECT id, email, password_hash, email_verified
        FROM users
        WHERE email = ${admin.email}
      `;

      if (users.length === 0) {
        console.log('❌ User NOT found in database');
        console.log('   Action needed: Create admin user');
        continue;
      }

      const user = users[0];
      console.log(`✅ User found: ${user.id}`);
      console.log(`   Email verified: ${user.email_verified}`);

      // Check if password matches
      const passwordMatches = await bcrypt.compare(expectedPassword, user.password_hash);

      if (passwordMatches) {
        console.log(`✅ Password is correct (${expectedPassword})`);
      } else {
        console.log(`❌ Password does NOT match expected value`);
        console.log(`   Resetting password to: ${expectedPassword}`);

        // Hash new password
        const newHash = await bcrypt.hash(expectedPassword, 10);

        // Update password
        await sql`
          UPDATE users
          SET password_hash = ${newHash},
              updated_at = NOW()
          WHERE id = ${user.id}
        `;

        console.log(`✅ Password reset successful`);
      }

      // Verify user has admin role
      const roles = await sql`
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
      `;

      const roleNames = roles.map(r => r.name);
      console.log(`   Roles: ${roleNames.join(', ')}`);

      if (!roleNames.includes('admin')) {
        console.log(`❌ Missing admin role`);
        console.log(`   Action needed: Run npx tsx scripts/assign-admin-roles.ts`);
      } else {
        console.log(`✅ Has admin role`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification complete\n');
}

verifyAndFixPasswords();
