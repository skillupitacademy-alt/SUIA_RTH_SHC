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

async function verifyUser() {
  const sql = neon(DATABASE_URL);
  
  console.log('\n🔍 Verifying SkillHub Core Admin User\n');
  
  try {
    const users = await sql`
      SELECT id, email, platform, role, is_active, password_hash, created_at
      FROM users
      WHERE email = 'admin@skillhubcore.in'
      AND platform = 'skillhubcore';
    `;
    
    if (users.length === 0) {
      console.log('❌ User not found');
      console.log('   Run: npx tsx scripts/create-skillhubcore-admin.ts\n');
      return;
    }
    
    const user = users[0];
    
    console.log('✅ User found in database\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Platform: ${user.platform}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.is_active}`);
    console.log(`  Created: ${user.created_at}`);
    
    // Verify password
    console.log('\n🔒 Verifying password hash...');
    const passwordMatch = await bcrypt.compare('testing', user.password_hash);
    
    if (passwordMatch) {
      console.log('✅ Password hash is correct (matches "testing")');
    } else {
      console.log('❌ Password hash does NOT match "testing"');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 Summary');
    console.log('='.repeat(60));
    console.log(`✅ User exists: ${user.email}`);
    console.log(`✅ Platform: ${user.platform}`);
    console.log(`✅ Role: ${user.role}`);
    console.log(`✅ Password: ${passwordMatch ? 'Valid' : 'Invalid'}`);
    console.log('='.repeat(60) + '\n');
    
    if (passwordMatch && user.is_active) {
      console.log('🎉 User is ready for login!\n');
      console.log('⚠️  Note: If login fails at api.skillhubcore.in,');
      console.log('   the API gateway might not be deployed yet.');
      console.log('   Try using api.realtutorialhub.com as fallback.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyUser();
