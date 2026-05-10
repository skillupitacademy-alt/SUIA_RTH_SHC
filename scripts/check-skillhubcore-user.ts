#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';
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

async function checkUser() {
  const sql = neon(DATABASE_URL);
  
  console.log('\n🔍 Checking admin@test.com in people_db\n');
  
  try {
    const users = await sql`
      SELECT id, email, platform, external_brand, role, deleted_at
      FROM users
      WHERE email = 'admin@test.com'
      ORDER BY created_at DESC;
    `;
    
    if (users.length === 0) {
      console.log('❌ User not found in people_db');
      console.log('\n⚠️  User needs to be created with:');
      console.log('   - email: admin@test.com');
      console.log('   - platform: skillhubcore');
      console.log('   - password: admin123');
      console.log('   - roles: ["admin"]');
      return;
    }
    
    console.log(`Found ${users.length} user(s):\n`);
    
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Platform: ${user.platform}`);
      console.log(`   External Brand: ${user.external_brand}`);
      console.log(`   Roles: ${user.role}`);
      console.log(`   Deleted: ${user.deleted_at ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    const skillhubcoreUser = users.find(u => u.platform === 'skillhubcore' && !u.deleted_at);
    
    if (skillhubcoreUser) {
      console.log('✅ SkillHub Core user exists and is active');
    } else {
      console.log('⚠️  No active user with platform="skillhubcore"');
      console.log('\nAvailable platforms for this email:');
      users.forEach(u => {
        if (!u.deleted_at) {
          console.log(`   - ${u.platform}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
