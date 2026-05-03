#!/usr/bin/env tsx
/**
 * Verify RTH Password Directly
 * Tests password hash directly from database
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyRTHPassword() {
  console.log('\n🔐 Verifying RTH Admin Password\n');
  console.log('='.repeat(60));

  const email = 'admin@realtutorialhub.com';
  const expectedPassword = 'admin123';
  const dbUrl = process.env.DATABASE_URL_RTH!;

  console.log(`Email: ${email}`);
  console.log(`Database: rth_prod\n`);

  try {
    const sql = neon(dbUrl);

    // Get user from database
    const users = await sql`
      SELECT id, email, password_hash, email_verified, is_blocked
      FROM users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      console.log('❌ User NOT found in database');
      return;
    }

    const user = users[0];
    console.log(`✅ User found: ${user.id}`);
    console.log(`   Email verified: ${user.email_verified}`);
    console.log(`   Is blocked: ${user.is_blocked}`);
    console.log(`   Password hash length: ${user.password_hash?.length || 0}\n`);

    // Test password
    const passwordMatches = await bcrypt.compare(expectedPassword, user.password_hash);

    if (passwordMatches) {
      console.log(`✅ Password matches: ${expectedPassword}`);
      console.log(`\n🎉 RTH admin login should work now!`);
    } else {
      console.log(`❌ Password does NOT match`);
      console.log(`\n🔧 Resetting password...`);
      
      // Reset password
      const newHash = await bcrypt.hash(expectedPassword, 10);
      await sql`
        UPDATE users
        SET password_hash = ${newHash},
            updated_at = NOW()
        WHERE id = ${user.id}
      `;
      
      console.log(`✅ Password reset complete`);
      console.log(`   New password: ${expectedPassword}`);
    }

    // Check roles
    const roles = await sql`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${user.id}
    `;

    console.log(`\n📋 Roles: ${roles.map(r => r.name).join(', ')}`);

  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

verifyRTHPassword();
