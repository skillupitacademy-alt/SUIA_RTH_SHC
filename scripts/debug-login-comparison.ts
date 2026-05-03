#!/usr/bin/env tsx
/**
 * Debug Login Comparison
 * Compares what happens with RTH vs SkillUp login at database level
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugLoginComparison() {
  console.log('\n🔍 Debugging Login Comparison: RTH vs SkillUp\n');
  console.log('='.repeat(70));

  const testCases = [
    {
      brand: 'RealTutorialHub',
      email: 'admin@realtutorialhub.com',
      password: 'admin123',
      dbUrl: process.env.DATABASE_URL_RTH!,
      dbName: 'rth_prod'
    },
    {
      brand: 'SkillUp',
      email: 'admin@skillupitacademy.com',
      password: 'admin123',
      dbUrl: process.env.DATABASE_URL_SKILLUP!,
      dbName: 'skillup_prod'
    },
  ];

  for (const test of testCases) {
    console.log(`\n📦 ${test.brand} (${test.dbName})`);
    console.log('='.repeat(70));
    console.log(`Email: ${test.email}`);
    console.log(`Password: ${test.password}\n`);

    try {
      const sql = neon(test.dbUrl);

      // Step 1: Check if user exists
      console.log('Step 1: Check if user exists');
      const users = await sql`
        SELECT id, email, password_hash, email_verified, is_blocked, 
               created_at, updated_at, last_active_at
        FROM users
        WHERE email = ${test.email}
      `;

      if (users.length === 0) {
        console.log('   ❌ User NOT found\n');
        continue;
      }

      const user = users[0];
      console.log(`   ✅ User found: ${user.id}`);
      console.log(`   Email verified: ${user.email_verified}`);
      console.log(`   Is blocked: ${user.is_blocked}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log(`   Last active: ${user.last_active_at || 'never'}`);

      // Step 2: Check password hash
      console.log('\nStep 2: Verify password hash');
      console.log(`   Hash length: ${user.password_hash?.length || 0}`);
      console.log(`   Hash starts with: ${user.password_hash?.substring(0, 10)}...`);
      
      const passwordMatches = await bcrypt.compare(test.password, user.password_hash);
      console.log(`   Password matches: ${passwordMatches ? '✅ YES' : '❌ NO'}`);

      if (!passwordMatches) {
        console.log('   ⚠️  PASSWORD MISMATCH - This would cause 401!');
      }

      // Step 3: Check roles
      console.log('\nStep 3: Check user roles');
      const roles = await sql`
        SELECT r.id, r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
      `;

      console.log(`   Roles found: ${roles.length}`);
      roles.forEach(role => {
        console.log(`   - ${role.name} (${role.id})`);
      });

      const hasAdminRole = roles.some(r => 
        r.name.toLowerCase() === 'admin' || 
        r.name.toLowerCase() === 'super_admin'
      );
      console.log(`   Has admin role: ${hasAdminRole ? '✅ YES' : '❌ NO'}`);

      // Step 4: Check login attempts / locks
      console.log('\nStep 4: Check login attempts');
      const attempts = await sql`
        SELECT ip, attempts, locked_until, created_at, updated_at
        FROM login_attempts
        WHERE user_id = ${user.id}
        ORDER BY updated_at DESC
        LIMIT 5
      `;

      if (attempts.length === 0) {
        console.log('   ✅ No login attempts recorded');
      } else {
        console.log(`   Found ${attempts.length} recent attempt(s):`);
        attempts.forEach((attempt, i) => {
          const isLocked = attempt.locked_until && new Date(attempt.locked_until) > new Date();
          console.log(`   ${i + 1}. IP: ${attempt.ip}, Attempts: ${attempt.attempts}, Locked: ${isLocked ? '🔒 YES' : '✅ NO'}`);
        });
      }

      // Step 5: Check shadow_user_id
      console.log('\nStep 5: Check shadow_user_id');
      const userWithShadow = await sql`
        SELECT shadow_user_id
        FROM users
        WHERE id = ${user.id}
      `;
      
      if (userWithShadow[0]?.shadow_user_id) {
        console.log(`   ✅ Shadow user ID: ${userWithShadow[0].shadow_user_id}`);
      } else {
        console.log(`   ⚠️  No shadow_user_id (will be created on login)`);
      }

      // Summary
      console.log('\n📊 Summary:');
      console.log(`   User exists: ✅`);
      console.log(`   Password correct: ${passwordMatches ? '✅' : '❌'}`);
      console.log(`   Has admin role: ${hasAdminRole ? '✅' : '❌'}`);
      console.log(`   Account blocked: ${user.is_blocked ? '❌' : '✅'}`);
      console.log(`   Email verified: ${user.email_verified ? '✅' : '⚠️ '}`);
      
      const shouldWork = passwordMatches && hasAdminRole && !user.is_blocked;
      console.log(`\n   Expected login result: ${shouldWork ? '✅ SHOULD WORK' : '❌ SHOULD FAIL'}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Comparison complete\n');
}

debugLoginComparison();
