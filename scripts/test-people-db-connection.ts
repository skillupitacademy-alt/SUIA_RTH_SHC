#!/usr/bin/env tsx
/**
 * Test People DB Connection
 * Tests if the People database is accessible and has the required tables
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testPeopleDB() {
  console.log('\n🔍 Testing People Database Connection\n');
  console.log('='.repeat(70));

  const peopleDbUrl = process.env.DATABASE_URL_PEOPLE;

  if (!peopleDbUrl) {
    console.log('❌ DATABASE_URL_PEOPLE not found in environment');
    console.log('   This is required for shadow_user_id creation!');
    return;
  }

  console.log('✅ DATABASE_URL_PEOPLE found');
  console.log(`   URL: ${peopleDbUrl.substring(0, 50)}...\n`);

  try {
    const sql = neon(peopleDbUrl);

    // Test connection
    console.log('Step 1: Test database connection');
    const result = await sql`SELECT NOW() as current_time`;
    console.log(`   ✅ Connected successfully`);
    console.log(`   Server time: ${result[0].current_time}\n`);

    // Check if users table exists
    console.log('Step 2: Check if users table exists');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `;

    if (tables.length === 0) {
      console.log('   ❌ users table NOT found!');
      console.log('   This will cause shadow_user_id creation to fail!\n');
      return;
    }

    console.log('   ✅ users table exists\n');

    // Check users table structure
    console.log('Step 3: Check users table structure');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('id', 'external_id', 'platform', 'email', 'shadow_user_id')
      ORDER BY ordinal_position
    `;

    console.log('   Required columns:');
    const requiredColumns = ['id', 'external_id', 'platform', 'email'];
    requiredColumns.forEach(col => {
      const found = columns.find(c => c.column_name === col);
      if (found) {
        console.log(`   ✅ ${col} (${found.data_type})`);
      } else {
        console.log(`   ❌ ${col} - MISSING!`);
      }
    });

    // Check platform_access table
    console.log('\nStep 4: Check platform_access table');
    const platformAccessTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'platform_access'
    `;

    if (platformAccessTable.length === 0) {
      console.log('   ❌ platform_access table NOT found!');
    } else {
      console.log('   ✅ platform_access table exists');
    }

    // Check for existing shadow users
    console.log('\nStep 5: Check existing shadow users');
    const shadowUsers = await sql`
      SELECT COUNT(*) as count,
             platform,
             COUNT(DISTINCT external_brand) as brands
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY platform
    `;

    if (shadowUsers.length === 0) {
      console.log('   ⚠️  No shadow users found');
    } else {
      console.log('   Shadow users by platform:');
      shadowUsers.forEach(row => {
        console.log(`   - ${row.platform}: ${row.count} users`);
      });
    }

    // Try to find RTH admin shadow user
    console.log('\nStep 6: Check for RTH admin shadow user');
    const rthAdminShadow = await sql`
      SELECT id, external_id, email, platform, external_brand
      FROM users
      WHERE email = 'admin@realtutorialhub.com'
      AND platform = 'realtutorialhub'
      AND deleted_at IS NULL
    `;

    if (rthAdminShadow.length === 0) {
      console.log('   ❌ RTH admin shadow user NOT found');
      console.log('   This will be created on first successful login');
    } else {
      console.log('   ✅ RTH admin shadow user exists:');
      console.log(`      Shadow ID: ${rthAdminShadow[0].id}`);
      console.log(`      External ID: ${rthAdminShadow[0].external_id}`);
    }

    // Check SkillUp admin shadow user
    console.log('\nStep 7: Check for SkillUp admin shadow user');
    const skillupAdminShadow = await sql`
      SELECT id, external_id, email, platform, external_brand
      FROM users
      WHERE email = 'admin@skillupitacademy.com'
      AND platform = 'skillup'
      AND deleted_at IS NULL
    `;

    if (skillupAdminShadow.length === 0) {
      console.log('   ❌ SkillUp admin shadow user NOT found');
    } else {
      console.log('   ✅ SkillUp admin shadow user exists:');
      console.log(`      Shadow ID: ${skillupAdminShadow[0].id}`);
      console.log(`      External ID: ${skillupAdminShadow[0].external_id}`);
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
    console.log('\nThis error will cause login to fail!');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test complete\n');
}

testPeopleDB();
