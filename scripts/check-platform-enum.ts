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

async function checkPlatformEnum() {
  const sql = neon(DATABASE_URL);
  
  console.log('\n🔍 Checking people_platform enum values\n');
  
  try {
    const result = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'people_platform') 
      ORDER BY enumsortorder;
    `;
    
    console.log('Available platform values:');
    result.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.enumlabel}`);
    });
    
    const hasSkillhubcore = result.some(row => row.enumlabel === 'skillhubcore');
    
    console.log('\n' + '='.repeat(60));
    
    if (hasSkillhubcore) {
      console.log('✅ skillhubcore platform exists');
    } else {
      console.log('❌ skillhubcore platform does NOT exist');
      console.log('\n⚠️  Need to add skillhubcore to people_platform enum');
      console.log('   SQL: ALTER TYPE people_platform ADD VALUE \'skillhubcore\';');
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPlatformEnum();
