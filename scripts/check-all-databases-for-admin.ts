#!/usr/bin/env tsx
/**
 * Check All Databases for Admin
 * Checks quiz_platform, rth_prod, and skillup_prod for admin@realtutorialhub.com
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAllDatabases() {
  console.log('\n🔍 Checking All Databases for admin@realtutorialhub.com\n');

  const databases = [
    { name: 'quiz_platform_prod', url: process.env.DATABASE_URL! },
    { name: 'rth_prod', url: process.env.DATABASE_URL_RTH! },
    { name: 'skillup_prod', url: process.env.DATABASE_URL_SKILLUP! },
  ];

  const email = 'admin@realtutorialhub.com';
  const expectedPassword = 'admin123';

  for (const db of databases) {
    console.log('='.repeat(60));
    console.log(`📦 Database: ${db.name}`);
    console.log('='.repeat(60));

    try {
      const sql = neon(db.url);

      const users = await sql`
        SELECT id, email, password_hash, email_verified, is_blocked
        FROM users
        WHERE email = ${email}
      `;

      if (users.length === 0) {
        console.log(`❌ User NOT found\n`);
        continue;
      }

      const user = users[0];
      console.log(`✅ User found: ${user.id}`);
      console.log(`   Email verified: ${user.email_verified}`);
      console.log(`   Is blocked: ${user.is_blocked}`);

      // Test password
      const passwordMatches = await bcrypt.compare(expectedPassword, user.password_hash);
      console.log(`   Password matches: ${passwordMatches ? '✅ YES' : '❌ NO'}`);

      // Check roles
      const roles = await sql`
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
      `;

      console.log(`   Roles: ${roles.map(r => r.name).join(', ')}\n`);

      if (!passwordMatches) {
        console.log(`🔧 Resetting password in ${db.name}...`);
        const newHash = await bcrypt.hash(expectedPassword, 10);
        await sql`
          UPDATE users
          SET password_hash = ${newHash},
              updated_at = NOW()
          WHERE id = ${user.id}
        `;
        console.log(`✅ Password reset complete\n`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('✅ Check complete\n');
}

checkAllDatabases();
