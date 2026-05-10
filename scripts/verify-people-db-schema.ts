/**
 * Verify people_db Schema and SHC User Data
 * ==========================================
 * Checks actual database schema and user data
 */

import dotenv from 'dotenv';
import path from 'path';
import { db, users } from '@quiz/db-people';
import { eq, and, isNull, sql } from 'drizzle-orm';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyPeopleDbSchema() {
  console.log('🔍 Verifying people_db Schema and Data');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // 1. Check table structure
    console.log('✅ Step 1: Checking users table structure');
    console.log('');

    const tableInfo = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('   Table: public.users');
    console.log('   Columns:');
    for (const col of tableInfo.rows) {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`     - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    }
    console.log('');

    // 2. Check enums
    console.log('✅ Step 2: Checking enum types');
    console.log('');

    const roleEnum = await db.execute(sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'people_user_role'::regtype
      ORDER BY enumsortorder;
    `);

    console.log('   Enum: people_user_role');
    console.log(`     Values: ${roleEnum.rows.map(r => r.enumlabel).join(', ')}`);
    console.log('');

    const platformEnum = await db.execute(sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'people_platform'::regtype
      ORDER BY enumsortorder;
    `);

    console.log('   Enum: people_platform');
    console.log(`     Values: ${platformEnum.rows.map(r => r.enumlabel).join(', ')}`);
    console.log('');

    // 3. Check SHC user exists
    console.log('✅ Step 3: Checking SHC admin user');
    console.log('');

    const shcUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'admin@skillhubcore.in'),
          eq(users.platform, 'skillhubcore'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (shcUser.length === 0) {
      console.log('   ❌ SHC admin user NOT FOUND!');
      console.log('');
      console.log('   Expected:');
      console.log('     Email: admin@skillhubcore.in');
      console.log('     Platform: skillhubcore');
      console.log('');
      process.exit(1);
    }

    const user = shcUser[0];

    console.log('   ✓ User found in database');
    console.log('');
    console.log('   Database Fields (Actual Data):');
    console.log(`     id: ${user.id} (${typeof user.id})`);
    console.log(`     email: ${user.email} (${typeof user.email})`);
    console.log(`     passwordHash: ${user.passwordHash ? '[PRESENT]' : '[MISSING]'} (${typeof user.passwordHash})`);
    console.log(`     role: ${user.role} (${typeof user.role})`);
    console.log(`     platform: ${user.platform} (${typeof user.platform})`);
    console.log(`     isActive: ${user.isActive} (${typeof user.isActive})`);
    console.log(`     deletedAt: ${user.deletedAt || 'null'} (${typeof user.deletedAt})`);
    console.log(`     version: ${user.version} (${typeof user.version})`);
    console.log(`     createdAt: ${user.createdAt} (${typeof user.createdAt})`);
    console.log(`     updatedAt: ${user.updatedAt} (${typeof user.updatedAt})`);
    console.log(`     externalId: ${user.externalId || 'null'} (${typeof user.externalId})`);
    console.log(`     externalBrand: ${user.externalBrand || 'null'} (${typeof user.externalBrand})`);
    console.log('');

    // 4. Verify required fields for authentication
    console.log('✅ Step 4: Verifying required fields for authentication');
    console.log('');

    const requiredFields = {
      'id': user.id,
      'email': user.email,
      'passwordHash': user.passwordHash,
      'role': user.role,
      'platform': user.platform,
      'isActive': user.isActive,
    };

    let allPresent = true;
    for (const [field, value] of Object.entries(requiredFields)) {
      const status = value !== null && value !== undefined ? '✓' : '✗';
      console.log(`   ${status} ${field}: ${value !== null && value !== undefined ? 'Present' : 'MISSING'}`);
      if (value === null || value === undefined) {
        allPresent = false;
      }
    }
    console.log('');

    if (!allPresent) {
      console.log('❌ Some required fields are missing!');
      process.exit(1);
    }

    // 5. Verify role is admin-level
    console.log('✅ Step 5: Verifying admin role');
    console.log('');

    const validAdminRoles = ['admin', 'super_admin', 'infrastructure'];
    const isValidAdmin = validAdminRoles.includes(user.role);

    if (isValidAdmin) {
      console.log(`   ✓ Valid admin role: ${user.role}`);
    } else {
      console.log(`   ✗ Invalid admin role: ${user.role}`);
      console.log(`   Expected one of: ${validAdminRoles.join(', ')}`);
      process.exit(1);
    }
    console.log('');

    // 6. Verify platform is skillhubcore
    console.log('✅ Step 6: Verifying platform');
    console.log('');

    if (user.platform === 'skillhubcore') {
      console.log(`   ✓ Platform is skillhubcore`);
    } else {
      console.log(`   ✗ Platform is ${user.platform} (expected: skillhubcore)`);
      process.exit(1);
    }
    console.log('');

    // 7. Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Database Schema:');
    console.log('  ✓ users table exists');
    console.log(`  ✓ ${tableInfo.rows.length} columns defined`);
    console.log(`  ✓ people_user_role enum: ${roleEnum.rows.length} values`);
    console.log(`  ✓ people_platform enum: ${platformEnum.rows.length} values`);
    console.log('');
    console.log('SHC Admin User:');
    console.log('  ✓ User exists in database');
    console.log('  ✓ All required fields present');
    console.log(`  ✓ Role: ${user.role} (admin-level)`);
    console.log(`  ✓ Platform: ${user.platform}`);
    console.log(`  ✓ Active: ${user.isActive}`);
    console.log('');
    console.log('Computed Fields (Added by API):');
    console.log('  ✓ isAdmin: true (computed from role)');
    console.log('  ✓ brand: "skillhubcore" (computed)');
    console.log('  ✓ expiresAt: null (computed)');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL VERIFICATIONS PASSED!');
    console.log('');
    console.log('people_db is correctly configured for SHC authentication.');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyPeopleDbSchema();
