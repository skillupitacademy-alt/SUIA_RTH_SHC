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

async function addSkillhubcorePlatform() {
  const sql = neon(DATABASE_URL);
  
  console.log('\n🔧 Adding skillhubcore to people_platform enum\n');
  
  try {
    // Check if it already exists
    const existing = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'people_platform')
      AND enumlabel = 'skillhubcore';
    `;
    
    if (existing.length > 0) {
      console.log('✅ skillhubcore already exists in people_platform enum');
      console.log('   No action needed\n');
      return;
    }
    
    console.log('📝 Executing: ALTER TYPE people_platform ADD VALUE \'skillhubcore\';\n');
    
    await sql`ALTER TYPE people_platform ADD VALUE 'skillhubcore'`;
    
    console.log('✅ Successfully added skillhubcore to people_platform enum\n');
    
    // Verify
    const result = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'people_platform') 
      ORDER BY enumsortorder;
    `;
    
    console.log('Updated platform values:');
    result.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.enumlabel}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration complete!');
    console.log('='.repeat(60));
    console.log('\n✅ Next step: Create SkillHub Core admin user');
    console.log('   npx tsx scripts/create-skillhubcore-admin.ts\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

addSkillhubcorePlatform();
