#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const DATABASE_URL = process.env.DATABASE_DIRECT_URL_PEOPLE || process.env.DATABASE_URL_PEOPLE || '';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL_PEOPLE not found');
  process.exit(1);
}

const SALT_ROUNDS = 12;

async function createSkillHubCoreAdmin() {
  const sql = neon(DATABASE_URL);
  
  const email = 'admin@skillhubcore.in';
  const password = 'testing';
  const platform = 'skillhubcore';
  const role = 'super_admin'; // Using super_admin to have both admin and super_admin capabilities
  
  console.log('\n🔐 Creating SkillHub Core Admin User\n');
  console.log('='.repeat(60));
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Platform: ${platform}`);
  console.log(`Role: ${role}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Check if user already exists
    const existing = await sql`
      SELECT id, email, platform, role, deleted_at
      FROM users
      WHERE email = ${email}
      AND platform = ${platform};
    `;
    
    if (existing.length > 0 && !existing[0].deleted_at) {
      console.log('⚠️  User already exists and is active');
      console.log(`   User ID: ${existing[0].id}`);
      console.log(`   Role: ${existing[0].role}`);
      console.log('\n✅ No action needed\n');
      return;
    }
    
    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    console.log('📝 Creating user in database...');
    const result = await sql`
      INSERT INTO users (email, password_hash, role, platform, is_active)
      VALUES (${email}, ${passwordHash}, ${role}::people_user_role, ${platform}::people_platform, true)
      RETURNING id, email, role, platform, created_at;
    `;
    
    if (result.length > 0) {
      const user = result[0];
      console.log('\n✅ User created successfully!\n');
      console.log('User Details:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Platform: ${user.platform}`);
      console.log(`  Created: ${user.created_at}`);
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SkillHub Core Admin User Ready!');
      console.log('='.repeat(60));
      console.log('\n✅ Next steps:');
      console.log('   1. Visit https://admin.skillhubcore.in/login');
      console.log(`   2. Login with ${email} / ${password}`);
      console.log('   3. Test Content Manager and Prompt Generator\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error creating user:', error.message);
    
    if (error.message.includes('duplicate key')) {
      console.log('\n⚠️  User might already exist. Check with:');
      console.log(`   npx tsx scripts/check-skillhubcore-user.ts\n`);
    } else if (error.message.includes('invalid input value for enum')) {
      console.log('\n⚠️  Invalid enum value. Available values:');
      console.log('   Platform: realtutorialhub, skillup, skillhubcore');
      console.log('   Role: student, faculty, admin, super_admin\n');
    }
    
    process.exit(1);
  }
}

createSkillHubCoreAdmin();
